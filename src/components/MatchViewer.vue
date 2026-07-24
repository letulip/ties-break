<script setup lang="ts">
// Package F – match viewer UI. Consumes Package D (annotateMatch) and Package E
// (buildTimeline, geometry, drawScene) outputs only; no game math lives here. The
// component owns the rAF clock and walks the (pure, pre-timed) Timeline, deriving
// canvas SceneState + the surrounding score/probability/stats readout from it.
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type { AnnotatedMatch, CourtPoint, ShotResult, Timeline, TimelineEvent, ViewMode } from '../viz/types'
import { COURT } from '../viz/types'
import type { MatchPlayer, Side, Surface } from '../engine/match/types'
import { buildTimeline, computeEndsSwaps, type EndsState } from '../viz/timeline'
import { drawScene, type SceneState } from '../viz/courtRenderer'
import type { Viewport } from '../viz/geometry'
import { initSfx, playSfx } from '../audio/sfx'
import { formatShortName } from '../shared/format'

const props = withDefaults(
  defineProps<{
    match: AnnotatedMatch
    playerA: MatchPlayer
    playerB: MatchPlayer
    surface: Surface
    /** Round 4 item 4: 'replay' swaps Play/Pause + Restart for a single "Watch again"
     *  button. Defaults to 'live' so existing call sites need no change. */
    mode?: 'live' | 'replay'
    /** Round-5 item 9: each player's current standings rank, shown under their name in the
     *  post-match stats. null (default) hides it – the friendly match passes null for "Top seed". */
    rankA?: number | null
    rankB?: number | null
    /** Round-5 sound rewiring: true only for the tournament FINAL. Swaps the match-end cue
     *  from the regular short applause to the bigger `applauseFinal` cue. Defaults to false
     *  so every other call site (friendly exhibition, MatchReplay, non-final rounds) is
     *  unaffected. */
    finalMatch?: boolean
  }>(),
  { mode: 'live', rankA: null, rankB: null, finalMatch: false },
)
// Emitted once when playback reaches the end (used by TournamentFlow to auto-advance to the
// post-match card; other callers can ignore it).
const emit = defineEmits<{ finish: [] }>()

// --- canvas: fixed internal resolution, scaled by devicePixelRatio -----------
// Landscape court (Package H): wide 2:1 canvas.
const CSS_W = 680
const CSS_H = 340
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// --- playback controls (reactive; drive the template) -------------------------
// Named viewMode (not "mode") to avoid colliding with the new `mode` prop
// ('live'/'replay', round 4 item 4) – Vue's SFC compiler exposes declared prop names as
// bare template identifiers, so reusing "mode" for both would be ambiguous.
const viewMode = ref<ViewMode>('key')
const speed = ref<1 | 2 | 4>(2)
const playing = ref(false)
const finished = ref(false)
/** Index of the last point whose point-end event has fired (-1 = match not started yet). */
const displayedPointIndex = ref(-1)
/** Server of the point currently in flight (live, updates as soon as it starts). */
const liveServer = ref<Side | null>(null)

// --- playback clock + timeline walk (plain, non-reactive: read only inside the
// rAF frame/render loop, never in the template) --------------------------------
const MARK_DECAY = 2.5 // seconds (timeline time) for a bounce mark to fully fade
const MARK_CAP = 14

interface MarkEntry {
  p: CourtPoint
  landedAt: number
  result: ShotResult
}

let timeline: Timeline = buildTimeline(props.match, viewMode.value)
let clock = 0
let cursor = 0
let marks: MarkEntry[] = []
let currentEvent: TimelineEvent | null = timeline.events[0] ?? null
let rafId: number | null = null
let lastTs: number | null = null
/** Pending timer for the pre-match 'takeYourSeats' beat's ~1.5s hold (see startClock);
 *  non-null only during that hold, so pauseInternal can cancel it cleanly. */
let preRollTimer: ReturnType<typeof setTimeout> | null = null

// --- round 4 item 3: real side changes (ends-swap state) ---------------------
// Precomputed once per timeline rebuild; swappedDuring[i] is looked up per frame from
// the point currently on screen (same pattern as liveServer below).
let endsState: EndsState = computeEndsSwaps(props.match.points)
/** Reactive mirror of the ends-swap state for the current point – feeds both the
 *  canvas scene (mirrors marks/flight/players) and the `.ends-labels` row's left/right
 *  assignment. */
const endsSwappedRef = ref(false)

// --- round 4 item 2: players run onto the court -------------------------------
// Eased position state (fixed physics frame – index = match Side; side 0 always
// defends y<0, side 1 always defends y>0). Lives here (not in courtRenderer, which
// stays a stateless drawing layer) alongside the other per-frame mutable state above.
const PLAYER_HOME: readonly [CourtPoint, CourtPoint] = [
  { x: 0, y: -COURT.halfLength },
  { x: 0, y: COURT.halfLength },
]
const PLAYER_EASE_RATE = 6 // 1/s; ~90% converged in ~0.35s of timeline time
let playerPos: [CourtPoint, CourtPoint] = [{ ...PLAYER_HOME[0] }, { ...PLAYER_HOME[1] }]

/** The shot currently in flight, if any: who's hitting it and where it lands. */
function currentShotContext(): { hitter: Side; target: CourtPoint } | null {
  if (!currentEvent || currentEvent.kind !== 'shot' || currentEvent.shotIndex === undefined) return null
  const shot = props.match.points[currentEvent.pointIndex]?.rally.shots[currentEvent.shotIndex]
  if (!shot) return null
  return { hitter: shot.by, target: shot.bounce }
}

/** Per frame: the shot's hitter recovers toward their own baseline center; the other
 *  side (who will hit next) chases the incoming ball's landing spot. Between shots
 *  both sides recover toward center. Plain per-frame lerp – smooth, no physics. */
function updatePlayers(dt: number): void {
  const shotCtx = currentShotContext()
  const factor = Math.min(1, dt * PLAYER_EASE_RATE)
  for (const side of [0, 1] as const) {
    const target = shotCtx && shotCtx.hitter !== side ? shotCtx.target : PLAYER_HOME[side]
    playerPos[side] = {
      x: playerPos[side].x + (target.x - playerPos[side].x) * factor,
      y: playerPos[side].y + (target.y - playerPos[side].y) * factor,
    }
  }
}

/** Tracks the last event `render()` reacted to, so the 'hit' sfx fires exactly once per
 *  shot (on the frame its flight event becomes current), not once per frame. */
let lastRenderedEvent: TimelineEvent | null = null

/** True once the pre-match 'takeYourSeats' beat (see startClock) has been decided –
 *  played or skipped – for the current playback run; reset on every resetPlayback()
 *  (fresh play, mode change, restart, Watch again, ...) so each run decides exactly
 *  once, on its first startClock() call, and never re-decides on pause/resume. */
let seatsPlayedForRun = false

// --- round-5 polish: speed-gated sound matrix ---------------------------------
// At ×2/×4 the full sound picture (every hit, every miss, every game/set cue) turns
// into noise well before the eye can track it, so each speed keeps only a curated
// subset of cues. Every play site in this file that's part of the match soundscape
// (not the UI `click`) routes through this one gate – it's the single source of
// truth for "which key, if any, plays at the current speed":
//
//   ×1  – everything, except `out` is throttled to every 3rd call (a plain counter,
//         so it can never fire twice in a row) so a miss-heavy rally doesn't spam it.
//   ×2  – `hit`, `applauseShort` at game-end/set-end (tiebreak sets use `applauseShort`
//         here too, not `oohApplause`) and match-end (including the final – no
//         `applauseFinal` above ×1), plus the `takeYourSeats` pre-match beat.
//   ×4  – only `hit` and a single `applauseShort` at match-end (no game/set applause,
//         no `takeYourSeats`).
//
// 'seats' is special: it's not tied to a timeline event at all (see startClock) – it
// plays, if this speed allows it, BEFORE the clock starts, not from inside
// completeEvent like every other site.
type SoundSite = 'hit' | 'out' | 'ooh' | 'gameEnd' | 'setEnd' | 'setEndTiebreak' | 'matchEnd' | 'seats'

/** Counts 'out' calls this playback run; reset in resetPlayback() so every fresh
 *  play/restart/Watch again starts the throttle from the same deterministic point. */
let outCounter = 0

function gatedSfx(site: SoundSite, opts?: { final?: boolean }): void {
  if (speed.value === 4) {
    if (site === 'hit') playSfx('hit')
    else if (site === 'matchEnd') playSfx('applauseShort')
    return
  }
  if (speed.value === 2) {
    if (site === 'hit') playSfx('hit')
    else if (site === 'seats') playSfx('takeYourSeats')
    else if (site === 'gameEnd' || site === 'setEnd' || site === 'setEndTiebreak' || site === 'matchEnd') {
      playSfx('applauseShort')
    }
    return
  }
  // ×1: everything, as before.
  switch (site) {
    case 'hit':
      playSfx('hit')
      return
    case 'out':
      outCounter++
      if (outCounter % 3 === 0) playSfx('out')
      return
    case 'ooh':
      playSfx('ooh')
      return
    case 'seats':
      playSfx('takeYourSeats')
      return
    case 'gameEnd':
      playSfx('applauseShort')
      return
    case 'setEnd':
      playSfx('applauseShort')
      return
    case 'setEndTiebreak':
      playSfx('oohApplause')
      return
    case 'matchEnd':
      playSfx(opts?.final ? 'applauseFinal' : 'applauseShort')
      return
  }
}

function pauseInternal(): void {
  playing.value = false
  if (preRollTimer !== null) {
    clearTimeout(preRollTimer)
    preRollTimer = null
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  lastTs = null
}

/** How many points up to and including `pointIndex` have setEnd === true, minus one – i.e.
 *  the index into match.result.sets (completed sets only) of the set that just finished at
 *  this point. match.result.sets holds only completed sets in play order, one per setEnd
 *  point, so counting setEnd points up to here gives that set's 1-based position. */
function completedSetIndex(pointIndex: number): number {
  let count = -1
  for (let i = 0; i <= pointIndex; i++) {
    if (props.match.points[i]?.setEnd) count++
  }
  return count
}

function completeEvent(ev: TimelineEvent): void {
  if (ev.kind === 'shot' && ev.shotIndex !== undefined) {
    const shot = props.match.points[ev.pointIndex]?.rally.shots[ev.shotIndex]
    if (shot) {
      marks.push({ p: shot.bounce, landedAt: ev.t + ev.duration, result: shot.result })
      if (marks.length > MARK_CAP) marks.shift()
      // No sound for a shot that lands in or wins the point – only a miss (out/net) gets a
      // cue at flight end. The 'hit' cue already played when this shot's flight started
      // (see render()).
      if (shot.result === 'out' || shot.result === 'net') gatedSfx('out')
    }
  } else if (ev.kind === 'point-end') {
    displayedPointIndex.value = ev.pointIndex
    const point = props.match.points[ev.pointIndex]
    const entry = point?.entry
    const shots = point?.rally.shots ?? []
    const lastShot = shots[shots.length - 1]
    const endedOnMiss = lastShot?.result === 'out' || lastShot?.result === 'net'
    // Silent by default. Two exceptions get an 'ooh': a converted break point (receiver
    // wins a point that was a break point), or a long rally (>= 8 shots) ending in a clean
    // winner. Never stacked on top of the 'out' cue that already played when the point
    // ended on a miss.
    const brokeServe = !!entry && entry.breakPoint && entry.winner !== entry.server
    const longWinnerRally = shots.length >= 8 && lastShot?.result === 'winner'
    if (!endedOnMiss && (brokeServe || longWinnerRally)) gatedSfx('ooh')
  } else if (ev.kind === 'game-end') {
    gatedSfx('gameEnd')
  } else if (ev.kind === 'set-end') {
    // A set decided by a tiebreak (final games score 7-6/6-7) gets the bigger
    // 'oohApplause' cue at ×1; any other set gets the regular short applause (both
    // collapse to 'applauseShort' at ×2 – see gatedSfx).
    const set = props.match.result.sets[completedSetIndex(ev.pointIndex)]
    const tiebreakSet = !!set && ((set.a === 7 && set.b === 6) || (set.a === 6 && set.b === 7))
    gatedSfx(tiebreakSet ? 'setEndTiebreak' : 'setEnd')
  } else if (ev.kind === 'match-end') {
    gatedSfx('matchEnd', { final: props.finalMatch })
  }
}

function processUpTo(time: number): void {
  const events = timeline.events
  while (cursor < events.length && events[cursor].t + events[cursor].duration <= time) {
    completeEvent(events[cursor])
    cursor++
  }
  currentEvent = events[cursor] ?? events[events.length - 1] ?? null
}

function finishNow(): void {
  pauseInternal()
  finished.value = true
  if (displayedPointIndex.value < 0) displayedPointIndex.value = props.match.points.length - 1
}

function advance(dt: number): void {
  clock += dt
  if (clock >= timeline.duration) {
    clock = timeline.duration
    processUpTo(clock)
    finishNow()
    return
  }
  processUpTo(clock)
}

function currentFlight(): SceneState['flight'] {
  if (!currentEvent || currentEvent.kind !== 'shot' || currentEvent.shotIndex === undefined) return null
  const progress = currentEvent.duration > 0 ? (clock - currentEvent.t) / currentEvent.duration : 1
  return { shotIndex: currentEvent.shotIndex, progress: Math.max(0, Math.min(1, progress)) }
}

function visibleMarks(): SceneState['marks'] {
  return marks
    .map((m) => ({ p: m.p, result: m.result, age: (clock - m.landedAt) / MARK_DECAY }))
    .filter((m) => m.age < 1)
}

function render(): void {
  if (!ctx) return
  const vp: Viewport = { width: CSS_W, height: CSS_H }
  const scenePointIndex = currentEvent ? currentEvent.pointIndex : 0
  liveServer.value = props.match.points[scenePointIndex]?.entry.server ?? null
  endsSwappedRef.value = endsState.swappedDuring[scenePointIndex] ?? false

  // 'hit' fires once per shot, exactly when its flight event becomes current (shot start,
  // not flight end).
  if (currentEvent !== lastRenderedEvent) {
    if (currentEvent?.kind === 'shot') gatedSfx('hit')
    lastRenderedEvent = currentEvent
  }

  const scene: SceneState = {
    match: props.match,
    pointIndex: scenePointIndex,
    flight: currentFlight(),
    marks: visibleMarks(),
    surface: props.surface,
    players: playerPos,
    serverSide: liveServer.value,
    time: clock,
    endsSwapped: endsSwappedRef.value,
    changingEnds: currentEvent?.kind === 'change-ends',
  }
  drawScene(ctx, vp, scene)
}

function frame(ts: number): void {
  if (lastTs === null) lastTs = ts
  const dtReal = (ts - lastTs) / 1000
  lastTs = ts
  const dt = dtReal * speed.value
  advance(dt)
  updatePlayers(dt)
  render()
  if (playing.value && !finished.value) {
    rafId = requestAnimationFrame(frame)
  }
}

/** ~1.5s of real time the court sits static (players home, clock at 0) after
 *  'takeYourSeats' plays and before the timeline actually starts – see startClock. */
const SEATS_PREROLL_MS = 1500

function beginClockLoop(): void {
  lastTs = null
  rafId = requestAnimationFrame(frame)
}

function startClock(): void {
  if (finished.value || viewMode.value === 'skip') return
  playing.value = true
  if (!seatsPlayedForRun) {
    seatsPlayedForRun = true
    // Pre-match beat (owner spec): on a fresh run, 'takeYourSeats' plays BEFORE the
    // clock starts – the court sits visible and static for ~1.5s, then the timeline
    // begins. gatedSfx decides whether this speed plays the cue at all (×1/×2 only);
    // the hold only applies when it does. This replaced the old wiring where the cue
    // fired on the timeline's own first point-start event.
    if (speed.value !== 4) {
      gatedSfx('seats')
      preRollTimer = setTimeout(() => {
        preRollTimer = null
        beginClockLoop()
      }, SEATS_PREROLL_MS)
      return
    }
  }
  beginClockLoop()
}

/** 'skip' mode never walks points – jump straight to the result screen. */
function jumpToEnd(): void {
  pauseInternal()
  clock = timeline.duration
  cursor = timeline.events.length
  currentEvent = timeline.events[timeline.events.length - 1] ?? null
  displayedPointIndex.value = props.match.points.length - 1
  finished.value = true
  playerPos = [{ ...PLAYER_HOME[0] }, { ...PLAYER_HOME[1] }]
  render()
}

function resetPlayback(startPlaying: boolean): void {
  pauseInternal()
  timeline = buildTimeline(props.match, viewMode.value)
  endsState = computeEndsSwaps(props.match.points)
  clock = 0
  cursor = 0
  marks = []
  displayedPointIndex.value = -1
  finished.value = false
  currentEvent = timeline.events[0] ?? null
  lastRenderedEvent = null
  seatsPlayedForRun = false
  outCounter = 0
  playerPos = [{ ...PLAYER_HOME[0] }, { ...PLAYER_HOME[1] }]
  if (viewMode.value === 'skip') {
    jumpToEnd()
  } else {
    render()
    if (startPlaying) startClock()
  }
}

function togglePlay(): void {
  if (viewMode.value === 'skip') return
  initSfx() // belt-and-suspenders; the global listener normally unlocks audio first
  if (finished.value) {
    resetPlayback(true)
    return
  }
  if (playing.value) pauseInternal()
  else startClock()
}

function restart(): void {
  initSfx()
  resetPlayback(true)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    const dpr = window.devicePixelRatio || 1
    canvas.width = CSS_W * dpr
    canvas.height = CSS_H * dpr
    const c = canvas.getContext('2d')
    if (c) {
      c.scale(dpr, dpr)
      ctx = c
    }
  }
  resetPlayback(true)
})

onBeforeUnmount(() => {
  pauseInternal()
})

// Mode change: rebuild the timeline and restart, preserving whatever play state
// was active. A new match prop (re-run exhibition) always restarts and autoplays.
watch(viewMode, () => resetPlayback(playing.value))
watch(
  () => props.match,
  () => resetPlayback(true),
)
// Surface the end of playback to the parent (fires once per completed run).
watch(finished, (isFinished) => {
  if (isFinished) emit('finish')
})

// --- readout: score / serve / win-probability / stats -------------------------
function playerName(side: Side): string {
  return side === 0 ? props.playerA.name : props.playerB.name
}

// --- round 4 item 1: server-highlight labels row, on the players' CURRENT sides ----
// Name truncation is the shared formatShortName ("First Last" -> "F. Last"); see
// docs/specs/round4-viz.md §1 for the row's origin.
const leftSide = computed<Side>(() => (endsSwappedRef.value ? 1 : 0))
const rightSide = computed<Side>(() => (endsSwappedRef.value ? 0 : 1))

const currentAnnotated = computed(() => (displayedPointIndex.value >= 0 ? props.match.points[displayedPointIndex.value] : null))
const scoreLine = computed(() => currentAnnotated.value?.entry.scoreAfter ?? '0-0')
const winProbA = computed(() => currentAnnotated.value?.winProbA ?? 0.5)
const probPct = computed(() => Math.round(winProbA.value * 100))
const playPauseLabel = computed(() => (playing.value ? 'Pause' : 'Play'))

interface SideStats {
  pointsWon: [number, number]
  aces: [number, number]
  dfs: [number, number]
  breaks: [number, number]
}

const liveStats = computed<SideStats>(() => {
  const stats: SideStats = { pointsWon: [0, 0], aces: [0, 0], dfs: [0, 0], breaks: [0, 0] }
  const upto = displayedPointIndex.value
  for (let i = 0; i <= upto; i++) {
    const p = props.match.points[i]
    if (!p) continue
    stats.pointsWon[p.entry.winner]++
    if (p.rally.ace) stats.aces[p.entry.server]++
    if (p.rally.doubleFault) stats.dfs[p.entry.server]++
    if (p.gameEnd && !p.entry.tiebreak && p.entry.winner !== p.entry.server) stats.breaks[p.entry.winner]++
  }
  return stats
})

// Final full stats: aces/DFs computed from rallies (per spec); everything else
// read straight from the authoritative MatchResult.stats.
const finalAcesDfs = computed<{ aces: [number, number]; dfs: [number, number] }>(() => {
  const aces: [number, number] = [0, 0]
  const dfs: [number, number] = [0, 0]
  for (const p of props.match.points) {
    if (p.rally.ace) aces[p.entry.server]++
    if (p.rally.doubleFault) dfs[p.entry.server]++
  }
  return { aces, dfs }
})

const finalScoreLine = computed(() => props.match.result.sets.map((s) => `${s.a}-${s.b}`).join('  '))
const winnerName = computed(() => playerName(props.match.result.winner))

function servePct(side: Side): number {
  const s = props.match.result.stats[side]
  return s.servePointsPlayed ? Math.round((s.servePointsWon / s.servePointsPlayed) * 100) : 0
}
</script>

<template>
  <div class="viewer">
    <canvas ref="canvasRef" class="viewer-canvas"></canvas>

    <div class="ends-labels">
      <span :class="{ serving: liveServer === leftSide }">
        {{ formatShortName(playerName(leftSide)) }}{{ liveServer === leftSide ? ' · serving' : '' }}
      </span>
      <span :class="{ serving: liveServer === rightSide }">
        {{ formatShortName(playerName(rightSide)) }}{{ liveServer === rightSide ? ' · serving' : '' }}
      </span>
    </div>

    <div class="controls">
      <select v-model="viewMode" @change="playSfx('clickSoft')">
        <option value="full">Full</option>
        <option value="key">Key points</option>
        <option value="skip">Skip</option>
      </select>
      <select v-model.number="speed" @change="playSfx('clickSoft')">
        <option :value="1">1×</option>
        <option :value="2">2×</option>
        <option :value="4">4×</option>
      </select>
      <template v-if="props.mode === 'replay'">
        <button class="primary sfx-watch" @click="restart">Watch again ↻</button>
      </template>
      <template v-else>
        <button class="primary" :disabled="viewMode === 'skip'" @click="togglePlay">{{ playPauseLabel }}</button>
      </template>
      <button disabled title="Coming in Phase 6">Shout 📣</button>
    </div>

    <div class="viewer-readout">
      <template v-if="!finished">
        <div class="score-line">{{ scoreLine }}</div>
        <span class="pill">Serving: {{ liveServer !== null ? playerName(liveServer) : '–' }}</span>

        <div class="prob-labels">
          <span>{{ playerA.name }}</span>
          <span>{{ probPct }}%</span>
          <span>{{ playerB.name }}</span>
        </div>
        <div class="prob-bar"><div class="prob-fill" :style="{ width: probPct + '%' }"></div></div>

        <table style="margin-top: 12px">
          <thead>
            <tr>
              <th></th>
              <th>{{ playerA.name }}</th>
              <th>{{ playerB.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Points won</th>
              <td class="num">{{ liveStats.pointsWon[0] }}</td>
              <td class="num">{{ liveStats.pointsWon[1] }}</td>
            </tr>
            <tr>
              <th>Aces</th>
              <td class="num">{{ liveStats.aces[0] }}</td>
              <td class="num">{{ liveStats.aces[1] }}</td>
            </tr>
            <tr>
              <th>Double faults</th>
              <td class="num">{{ liveStats.dfs[0] }}</td>
              <td class="num">{{ liveStats.dfs[1] }}</td>
            </tr>
            <tr>
              <th>Breaks</th>
              <td class="num">{{ liveStats.breaks[0] }}</td>
              <td class="num">{{ liveStats.breaks[1] }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-else>
        <div class="score-line final">{{ finalScoreLine }} – {{ winnerName }} wins</div>

        <table style="margin-top: 12px">
          <thead>
            <tr>
              <th></th>
              <th>
                <span class="ph-name">{{ playerA.name }}</span>
                <span v-if="rankA != null" class="ph-rank">#{{ rankA }}</span>
              </th>
              <th>
                <span class="ph-name">{{ playerB.name }}</span>
                <span v-if="rankB != null" class="ph-rank">#{{ rankB }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Aces</th>
              <td class="num">{{ finalAcesDfs.aces[0] }}</td>
              <td class="num">{{ finalAcesDfs.aces[1] }}</td>
            </tr>
            <tr>
              <th>Double faults</th>
              <td class="num">{{ finalAcesDfs.dfs[0] }}</td>
              <td class="num">{{ finalAcesDfs.dfs[1] }}</td>
            </tr>
            <tr>
              <th>Serve %</th>
              <td class="num">{{ servePct(0) }}%</td>
              <td class="num">{{ servePct(1) }}%</td>
            </tr>
            <tr>
              <th>Break points</th>
              <td class="num">{{ match.result.stats[0].breakPointsSaved }}/{{ match.result.stats[0].breakPointsFaced }}</td>
              <td class="num">{{ match.result.stats[1].breakPointsSaved }}/{{ match.result.stats[1].breakPointsFaced }}</td>
            </tr>
            <tr>
              <th>Breaks</th>
              <td class="num">{{ match.result.stats[0].breaksWon }}</td>
              <td class="num">{{ match.result.stats[1].breaksWon }}</td>
            </tr>
            <tr>
              <th>Longest streak</th>
              <td class="num">{{ match.result.stats[0].longestPointStreak }}</td>
              <td class="num">{{ match.result.stats[1].longestPointStreak }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>
</template>
