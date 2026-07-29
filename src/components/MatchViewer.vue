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
import { buildCommentary } from '../viz/commentary'
import { initSfx, playSfx, primeSfx } from '../audio/sfx'
import { duck, restore } from '../audio/music'
import { formatShortName } from '../shared/format'
import { rngFromSeed, pickInt, type Rng } from '../engine/rng'
import { KID_ID } from '../engine/world'
import Card from './ui/Card.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import SegmentedRow from './ui/SegmentedRow.vue'
import WeatherPlate from './ui/WeatherPlate.vue'

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
     *  unaffected. R10-6: a final's cue fires AT the deciding point like every other reaction
     *  cue (see startEvent) and the clip is pre-warmed on mount, so the celebration lands with
     *  the winning shot instead of a beat behind the screen. Round-7's `suppressEndApplause`
     *  (which silenced the final's viewer so the finale SCREEN could clap, one click later) is
     *  gone with it – `endApplause` below is how the parent knows not to clap twice. */
    finalMatch?: boolean
    /** THE WEATHER PLATE'S DATA (owner, 29.07). `EventPreview.temperatureC` for the event THIS
     *  match belongs to - the same number the Season card printed for that tournament, passed in
     *  rather than re-derived, because two call sites computing one fact is how they drift.
     *
     *  ⚠ NOT WIRED YET, AND THE REASON IS ONE MISSING FIELD. `PendingView` (shared/protocol.ts) -
     *  what TournamentFlow gets while a tournament is being watched - carries `eventId`, `tier`
     *  and `surface` but no preview, and `snapshot.upcoming` (which does carry previews) is
     *  filtered to `week > world.week`, so an event being PLAYED has already dropped out of it.
     *  The hook is `PendingView.temperatureC: number`, filled where the pending view is built,
     *  and then `:temperature-c="pending.temperatureC"` at TournamentFlow's two viewer call
     *  sites. Both files are outside this slice - and `tests/preview.test.ts` deliberately greps
     *  world.ts for `eventTemperature`, so that guard is the owner's to re-aim, not mine.
     *  null (default) draws no plate at all, so nothing shows a made-up number in the meantime. */
    temperatureC?: number | null
  }>(),
  { mode: 'live', rankA: null, rankB: null, finalMatch: false, temperatureC: null },
)
// `finish` fires once when playback reaches the end (used by TournamentFlow to auto-advance to
// the post-match card; other callers can ignore it).
// R10-6: `endApplause` fires the instant the match-END crowd cue actually plays (never in 'skip'
// mode, which is silent by construction) so a parent that ALSO has an applause of its own –
// TournamentFlow's finale screen – can stand down instead of double-clapping a beat later.
const emit = defineEmits<{ finish: []; endApplause: [] }>()

// --- canvas: fixed internal resolution, scaled by devicePixelRatio -----------
// Landscape court (Package H). Was a flat 2:1 (680x340).
//
// AIR ABOVE AND BELOW THE COURT (owner, 29.07: «над и под полем больше воздуха ... чтобы плашка
// live на поле не заходила»). The principle behind it is bigger than the badge: NOTHING overlaps
// the playing surface. The court is what the player is watching; every readout is furniture.
//
// The lever is the canvas HEIGHT, and it is the only one that buys air for free. `courtScale`
// (viz/geometry.ts) is `min(availW / 23.77m, availH / 10.97m)`, and at 680 wide the width arm is
// the smaller one (24.03 px/m vs 32.16) - so the court is WIDTH-bound, and making the canvas
// taller adds pure run-off without moving a single court pixel. Raising MARGIN instead would have
// shrunk the court on both axes to buy mostly horizontal run-off we do not need.
//
//   court height drawn = 10.97m x 24.03 px/m = 263.6px, unchanged at any canvas height
//   run-off each side  = (420 - 263.6) / 2   = 78.2px internal
//                      = ~34px on a 375pt phone (the canvas renders ~299 CSS px wide there)
//   was               = (340 - 263.6) / 2    = 38.2px internal = ~17px, which the 24px-tall
//                                              badge overhung by about 13px. That was the bug.
//
// The template binds `aspect-ratio` off these two constants rather than restating 2/1, so the
// element and the drawing surface cannot drift apart again.
const CSS_W = 680
const CSS_H = 420
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
/** Event-START cursor (crowd-reaction pass): index of the next event whose START hook
 *  (reaction cues) hasn't fired yet. Deliberately separate from `cursor` (the event-END /
 *  completion cursor: marks + displayed score). Reset together in resetPlayback. */
let startedCursor = 0
let marks: MarkEntry[] = []
let currentEvent: TimelineEvent | null = timeline.events[0] ?? null
let rafId: number | null = null
let lastTs: number | null = null
/** Pending timer for the pre-match 'takeYourSeats' beat's hold (see startClock +
 *  SEATS_PREROLL_MS); non-null only during that hold, so pauseInternal can cancel it cleanly. */
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

// --- round-6: background-music ducking ----------------------------------------
// Matches must be music-free; menus/screens outside a match are not. `duck()`/`restore()`
// (src/audio/music.ts) are refcounted, so this component must call each at most once per
// outstanding duck – `musicDuckedForRun` tracks whether THIS instance currently holds one.
// Deliberately NOT reset in resetPlayback(): a mode change or a new match prop mid-viewing
// rebuilds the timeline without ever un-ducking (still watching a match), so beginClockLoop's
// `if (!musicDuckedForRun)` guard must keep seeing `true` across those rebuilds, or it would
// duck() again without a matching restore() and leak the refcount. Only the two teardown
// paths below (match finished, component unmounted) ever flip it back to false.
let musicDuckedForRun = false

// --- round-5 polish: speed-gated sound matrix ---------------------------------
// At ×2/×4 the full sound picture (every hit, every miss, every game/set cue) turns
// into noise well before the eye can track it, so each speed keeps only a curated
// subset of cues. Every play site in this file that's part of the match soundscape
// (not the UI `click`) routes through this one gate – it's the single source of
// truth for "which key, if any, plays at the current speed":
//
//   ×1  – everything, except `out` fires only intermittently (~1 in 3–5 out/net points,
//         seeded per match – see the outRng block below) so a miss-heavy rally doesn't spam it.
//   ×2  – `hit`, `applauseShort` at game-end/set-end (tiebreak sets use `applauseShort`
//         here too, not `oohApplause`) and match-end, plus the `takeYourSeats` pre-match beat.
//   ×4  – only `hit` and a single applause at match-end (no game/set applause, no
//         `takeYourSeats`).
//
// R10-6 amendment: the tournament FINAL's match-end cue is `applauseFinal` at EVERY speed. The
// old matrix downgraded it to `applauseShort` above ×1 because a long clip dragged behind a
// sped-up match – R9-24's rate-matching (playLong) removed that reason, and a final gets exactly
// ONE cue per match, so it is never the noise the per-game/per-set gating is about.
//
// 'seats' is special: it's not tied to a timeline event at all (see startClock) – it
// plays, if this speed allows it, BEFORE the clock starts, not from inside
// completeEvent like every other site.
type SoundSite = 'hit' | 'out' | 'ooh' | 'gameEnd' | 'setEnd' | 'setEndTiebreak' | 'matchEnd' | 'seats'

// --- round-7 item 12: intermittent 'out' call --------------------------------------
// An out/net point plays the `out` call only ~1 in 3–5 times, at ×1 only. Deterministic
// PER MATCH so a replay sounds identical: a small RNG seeded from the match seed +
// ':outcall', re-created at every resetPlayback(). `outCounter` counts out/net occurrences
// since the last fired call; once it reaches `outThreshold` (a fresh 3–5 draw) the call
// fires and a new threshold is drawn. (Replaced the earlier every-3rd counter.)
let outRng: Rng = rngFromSeed(props.match.result.seed + ':outcall')
let outCounter = 0
let outThreshold = pickInt(outRng, 3, 5)

// R9-24: the LONG cues (applause family + take-your-seats) play rate-matched to the clip at
// ×2 so they stop dragging behind a sped-up match – capped at 2 inside playSfx (rate-4
// applause is noise; ×4 already gates most cues off anyway). Short percussive cues (hit /
// out / ooh / click*) stay at rate 1: they're too brief for the mismatch to register.
function playLong(key: 'applauseShort' | 'oohApplause' | 'applauseFinal' | 'takeYourSeats'): void {
  playSfx(key, speed.value > 1 ? { rate: speed.value } : undefined)
}

function gatedSfx(site: SoundSite, opts?: { final?: boolean }): void {
  if (speed.value === 4) {
    if (site === 'hit') playSfx('hit')
    else if (site === 'matchEnd') playLong(opts?.final ? 'applauseFinal' : 'applauseShort')
    return
  }
  if (speed.value === 2) {
    if (site === 'hit') playSfx('hit')
    else if (site === 'seats') playLong('takeYourSeats')
    else if (site === 'matchEnd') playLong(opts?.final ? 'applauseFinal' : 'applauseShort')
    else if (site === 'gameEnd' || site === 'setEnd' || site === 'setEndTiebreak') {
      playLong('applauseShort')
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
      if (outCounter >= outThreshold) {
        playSfx('out')
        outCounter = 0
        outThreshold = pickInt(outRng, 3, 5)
      }
      return
    case 'ooh':
      playSfx('ooh')
      return
    case 'seats':
      playLong('takeYourSeats')
      return
    case 'gameEnd':
      playLong('applauseShort')
      return
    case 'setEnd':
      playLong('applauseShort')
      return
    case 'setEndTiebreak':
      playLong('oohApplause')
      return
    case 'matchEnd':
      playLong(opts?.final ? 'applauseFinal' : 'applauseShort')
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

/** Event-START hook (crowd-reaction pass; R9-23 rework): EVERY reaction cue fires at the
 *  SCORING instant – the START of the decisive point's own 'point-end' event. The game/set/
 *  match cues used to fire at the START of their separate 'game-end'/'set-end'/'match-end'
 *  timeline events, but those are scheduled AFTER the point-end's duration plus its trailing
 *  gap, so the crowd reacted ~a beat late (the owner heard the lag, worst at ×2). Those later
 *  events' starts are now SILENT – their visual/completion duties are untouched, so the
 *  timeline itself is unchanged (no fixture churn). Only the BIGGEST cue plays per point
 *  (match > set > game – a set-ending point is always game-ending too), and the converted-
 *  break 'ooh' yields to the game applause that now lands at the same instant. The 'hit' cue
 *  (shot start, in render()) and the 'out' cue (shot landing, in completeEvent) are unchanged.
 *  'skip' mode stays silent by construction – jumpToEnd never fires start hooks. */
function startEvent(ev: TimelineEvent): void {
  if (ev.kind !== 'point-end') return
  const point = props.match.points[ev.pointIndex]

  // Match-ending point: the last point of the match (always present in 'key' mode). R10-6: THIS is
  // where a tournament final's celebration now lands – on the winning shot, with the result – and
  // the parent is told (`endApplause`) so its finale screen doesn't clap again a click later.
  if (ev.pointIndex === props.match.points.length - 1) {
    gatedSfx('matchEnd', { final: props.finalMatch })
    emit('endApplause')
    return
  }
  if (point?.setEnd) {
    // A set decided by a tiebreak (final games score 7-6/6-7) gets the bigger
    // 'oohApplause' cue at ×1; any other set gets the regular short applause (both
    // collapse to 'applauseShort' at ×2 – see gatedSfx).
    const set = props.match.result.sets[completedSetIndex(ev.pointIndex)]
    const tiebreakSet = !!set && ((set.a === 7 && set.b === 6) || (set.a === 6 && set.b === 7))
    gatedSfx(tiebreakSet ? 'setEndTiebreak' : 'setEnd')
    return
  }
  if (point?.gameEnd) {
    gatedSfx('gameEnd')
    return
  }

  // Ordinary (non-deciding) point. One exception gets an 'ooh': a long rally (>= 8 shots)
  // ending in a clean winner. (A converted break point always ends its game, so it lands in
  // the game branch above.) Never stacked on top of the 'out' cue of a point ending on a miss.
  const shots = point?.rally.shots ?? []
  const lastShot = shots[shots.length - 1]
  const endedOnMiss = lastShot?.result === 'out' || lastShot?.result === 'net'
  const longWinnerRally = shots.length >= 8 && lastShot?.result === 'winner'
  if (!endedOnMiss && longWinnerRally) gatedSfx('ooh')
}

function completeEvent(ev: TimelineEvent): void {
  if (ev.kind === 'shot' && ev.shotIndex !== undefined) {
    const shot = props.match.points[ev.pointIndex]?.rally.shots[ev.shotIndex]
    if (shot) {
      marks.push({ p: shot.bounce, landedAt: ev.t + ev.duration, result: shot.result })
      if (marks.length > MARK_CAP) marks.shift()
      // No sound for a shot that lands in or wins the point – only a miss (out/net) gets a
      // cue at flight end (the ball landing). The 'hit' cue already played when this shot's
      // flight started (see render()).
      if (shot.result === 'out' || shot.result === 'net') gatedSfx('out')
    }
  } else if (ev.kind === 'point-end') {
    // Non-sound completion work only: reveal the point's score once its point-end beat has
    // fully played. (Its reaction cue, if any, already fired at the point-end START.)
    displayedPointIndex.value = ev.pointIndex
  }
}

/** Event-START walk: fire each event's reaction cue the instant its start time is reached.
 *  Guarded by startedCursor so every event starts exactly once – shared by the normal frame
 *  walk (processUpTo) and the skip/jumpToEnd fast-forward, so neither double-fires. */
function processStartsUpTo(time: number): void {
  const events = timeline.events
  while (startedCursor < events.length && events[startedCursor].t <= time) {
    startEvent(events[startedCursor])
    startedCursor++
  }
}

function processUpTo(time: number): void {
  const events = timeline.events
  // Starts first (reaction cues at each event's beginning), then completions (marks + score
  // at each event's end).
  processStartsUpTo(time)
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

/** Real time the court sits static (players home, clock at 0) after 'takeYourSeats' plays
 *  and before the timeline actually starts – see startClock. Round-7 item 11: held for the
 *  clip's real length (~3.5s) so the match no longer starts over the top of it; was 1.5s,
 *  which cut the clip off. Applies at ×1/×2 (the speeds that play the cue); ×4 skips both
 *  the cue and the hold. Hardcoded to the recorded clip's duration.
 *  R9-24: the clip itself now plays rate-matched at ×2 (see playLong), so the hold scales
 *  with it – effective hold = SEATS_PREROLL_MS / min(speed, 2) (~1800ms at ×2). */
const SEATS_PREROLL_MS = 3600
function seatsHoldMs(): number {
  return SEATS_PREROLL_MS / Math.min(speed.value, 2)
}

function beginClockLoop(): void {
  // Playback is actually starting now (immediately at speed ×4, or after the
  // take-your-seats pre-roll at ×1/×2 – both paths funnel through here) – duck the music.
  if (!musicDuckedForRun) {
    musicDuckedForRun = true
    duck()
  }
  lastTs = null
  rafId = requestAnimationFrame(frame)
}

function startClock(): void {
  if (finished.value || viewMode.value === 'skip') return
  playing.value = true
  if (!seatsPlayedForRun) {
    seatsPlayedForRun = true
    // Pre-match beat (owner spec): on a fresh run, 'takeYourSeats' plays BEFORE the
    // clock starts – the court sits visible and static for the clip's full length
    // (SEATS_PREROLL_MS ~3.6s, round-7 item 11), then the timeline begins, so the first
    // hit never lands on top of the clip. gatedSfx decides whether this speed plays the
    // cue at all (×1/×2 only); the hold only applies when it does. This replaced the old
    // wiring where the cue fired on the timeline's own first point-start event.
    if (speed.value !== 4) {
      gatedSfx('seats')
      preRollTimer = setTimeout(() => {
        preRollTimer = null
        beginClockLoop()
      }, seatsHoldMs()) // R9-24: rate-matched clip → rate-matched hold (~1800ms at ×2)
      return
    }
  }
  beginClockLoop()
}

/** 'skip' mode never walks points – jump straight to the result screen. */
function jumpToEnd(): void {
  pauseInternal()
  clock = timeline.duration
  // Skip is silent: no one's watching, so no crowd cues play. Mark every event as already
  // started (without firing its start-hook sound) so a later resume never back-fires them.
  startedCursor = timeline.events.length
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
  startedCursor = 0
  marks = []
  displayedPointIndex.value = -1
  finished.value = false
  currentEvent = timeline.events[0] ?? null
  lastRenderedEvent = null
  seatsPlayedForRun = false
  outRng = rngFromSeed(props.match.result.seed + ':outcall')
  outCounter = 0
  outThreshold = pickInt(outRng, 3, 5)
  playerPos = [{ ...PLAYER_HOME[0] }, { ...PLAYER_HOME[1] }]
  if (viewMode.value === 'skip') {
    jumpToEnd()
  } else {
    render()
    if (startPlaying) startClock()
  }
}

function restart(): void {
  initSfx()
  resetPlayback(true)
}

onMounted(() => {
  // R10-6: a final's celebration clip is the one cue that never plays before the moment it has to
  // land, so it is warmed HERE – a whole match's worth of lead time for ~60 KB, and by the deciding
  // point playSfx has nothing left to fetch. (No-op when this isn't a final, or while muted.)
  if (props.finalMatch) primeSfx('applauseFinal')
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
  if (musicDuckedForRun) {
    musicDuckedForRun = false
    restore()
  }
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
  if (isFinished) {
    emit('finish')
    if (musicDuckedForRun) {
      musicDuckedForRun = false
      restore()
    }
  }
})

// --- readout: score / serve / win-probability / stats -------------------------
function playerName(side: Side): string {
  return side === 0 ? props.playerA.name : props.playerB.name
}

// HER side, when she is in this match at all. The design writes our own girl's name in the accent
// and everyone else's in white ("у своей игроницы имя лаймом"), and draws the momentum curve from
// her point of view. Every call site that carries the kid gives her `id: KID_ID` (world.ts
// kidMatchPlayer, and SeasonScreen's exhibition too), so the viewer can tell without a new prop.
const kidSide = computed<Side | null>(() =>
  props.playerA.id === KID_ID ? 0 : props.playerB.id === KID_ID ? 1 : null,
)
/** Whose point of view the momentum curve and its caption take: hers, or side A's by default. */
const heroSide = computed<Side>(() => kidSide.value ?? 0)

/** For the two-row / two-column readouts, in the panel's fixed A-then-B order. */
const SIDES: readonly Side[] = [0, 1]

// --- round 4 item 1: server-highlight labels row, on the players' CURRENT sides ----
// Name truncation is the shared formatShortName ("First Last" -> "F. Last"); see
// docs/specs/round4-viz.md §1 for the row's origin.
const leftSide = computed<Side>(() => (endsSwappedRef.value ? 1 : 0))
const rightSide = computed<Side>(() => (endsSwappedRef.value ? 0 : 1))

const currentAnnotated = computed(() => (displayedPointIndex.value >= 0 ? props.match.points[displayedPointIndex.value] : null))
const winProbA = computed(() => currentAnnotated.value?.winProbA ?? 0.5)

// --- design I §2: the two player rows and their per-set score cells ----------------------------
// Best-of-THREE cells, not the export's four. The export draws four boxes and our matches are
// bo3 (`MatchOptions.bestOf?: 3` is the only value the engine takes), so a fourth box would be a
// permanently empty dash claiming a format we do not play. Reported as a deliberate deviation.
const SET_CELLS = 3

interface SetCell {
  a: string
  b: string
  state: 'played' | 'current' | 'future'
  /** who leads the IN-PROGRESS set – the export fills the leader's cell with the accent */
  leader: Side | null
}

const setCells = computed<SetCell[]>(() => {
  const done: [number, number][] = []
  const games: [number, number] = [0, 0]
  for (let i = 0; i <= displayedPointIndex.value; i++) {
    const p = props.match.points[i]
    if (!p?.gameEnd) continue
    games[p.entry.winner]++
    if (p.setEnd) {
      done.push([games[0], games[1]])
      games[0] = 0
      games[1] = 0
    }
  }
  const live = !finished.value && done.length < props.match.result.sets.length
  return Array.from({ length: SET_CELLS }, (_, i): SetCell => {
    const set = done[i]
    if (set) return { a: String(set[0]), b: String(set[1]), state: 'played', leader: null }
    if (i === done.length && live) {
      return {
        a: String(games[0]),
        b: String(games[1]),
        state: 'current',
        leader: games[0] > games[1] ? 0 : games[1] > games[0] ? 1 : null,
      }
    }
    return { a: '–', b: '–', state: 'future', leader: null }
  })
})

/** How far into the match we are. Shown once it is over, in place of the live game score. */
const pointsPlayed = computed(() => Math.max(0, displayedPointIndex.value + 1))

const POINT_NAMES = ['0', '15', '30', '40'] as const

/** THE POINT SCORE OF THE GAME IN PROGRESS ("30-40", "40-A", "TB 3-2").
 *
 *  The export gives this slot to a wall clock and labels it "Match time". The engine has no time
 *  model at all, so a clock here would be a number we made up - and a live tennis view that cannot
 *  tell you it is 30-40 is missing the most basic thing on a scoreboard. So the slot keeps the
 *  export's shape and its typography, and carries the one live reading the export's own point log
 *  used to carry instead (the commentary's score column shows GAMES, not points). */
const gameScore = computed(() => {
  if (finished.value || displayedPointIndex.value < 0) return ''
  const pts: [number, number] = [0, 0]
  let tiebreak = false
  for (let i = 0; i <= displayedPointIndex.value; i++) {
    const p = props.match.points[i]
    if (!p) continue
    pts[p.entry.winner]++
    tiebreak = p.entry.tiebreak
    if (p.gameEnd) {
      pts[0] = 0
      pts[1] = 0
      tiebreak = false
    }
  }
  // The point AFTER a completed game is served in the next one, which the flags on the NEXT point
  // already know; a game boundary therefore reads 0-0 until the first point of the new game lands.
  const next = props.match.points[displayedPointIndex.value + 1]
  if (next?.entry.tiebreak) tiebreak = true
  if (tiebreak) return `TB ${pts[0]}-${pts[1]}`
  if (pts[0] >= 3 && pts[1] >= 3) {
    if (pts[0] === pts[1]) return '40-40'
    return pts[0] > pts[1] ? 'A-40' : '40-A'
  }
  return `${POINT_NAMES[pts[0]]}-${POINT_NAMES[pts[1]]}`
})

// --- design I §4a: MOMENTUM ---------------------------------------------------------------
// The export's "two polylines + a caption" IS the live win probability we already compute per
// point (viz/liveProb), drawn from HER point of view. Sampled to at most 48 columns so the shape
// stays readable in a 104x26 box however long the match runs.
const MOM_W = 104
const MOM_H = 26
const MOM_PAD = 2
const MOM_MAX_SAMPLES = 48

/** Her win probability after the point currently on screen. */
const heroProb = computed(() => (heroSide.value === 0 ? winProbA.value : 1 - winProbA.value))

const momentum = computed<{ hero: string; rival: string } | null>(() => {
  const upto = displayedPointIndex.value
  if (upto < 1) return null
  const n = Math.min(upto + 1, MOM_MAX_SAMPLES)
  const hero: string[] = []
  const rival: string[] = []
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / (n - 1)) * upto)
    const pa = props.match.points[idx]?.winProbA ?? 0.5
    const p = heroSide.value === 0 ? pa : 1 - pa
    const x = MOM_PAD + (i / (n - 1)) * (MOM_W - MOM_PAD * 2)
    const span = MOM_H - MOM_PAD * 2
    hero.push(`${x.toFixed(1)},${(MOM_PAD + (1 - p) * span).toFixed(1)}`)
    rival.push(`${x.toFixed(1)},${(MOM_PAD + p * span).toFixed(1)}`)
  }
  return { hero: hero.join(' '), rival: rival.join(' ') }
})

/** The export's "Slight edge" caption, as a band of the same probability the curve draws. Seven
 *  bands, symmetric, and never a claim about how she FEELS – only about where the match stands. */
const momentumCaption = computed(() => {
  if (displayedPointIndex.value < 0) return 'Not started'
  const p = heroProb.value
  if (p >= 0.9) return 'Almost there'
  if (p >= 0.7) return 'Well ahead'
  if (p >= 0.57) return 'Slight edge'
  if (p > 0.43) return 'Even'
  if (p > 0.3) return 'Uphill'
  if (p > 0.1) return 'Well behind'
  return 'Hanging on'
})

// --- design I §4b/c: 1st serve % and break points, both live ------------------------------
interface PanelStats {
  /** first serves landed in / service points played, per side */
  firstIn: [number, number]
  firstPlayed: [number, number]
  /** break points CONVERTED / had, per side as the returner (the broadcast stat) */
  bpWon: [number, number]
  bpHad: [number, number]
}

const panelStats = computed<PanelStats>(() => {
  const st: PanelStats = { firstIn: [0, 0], firstPlayed: [0, 0], bpWon: [0, 0], bpHad: [0, 0] }
  for (let i = 0; i <= displayedPointIndex.value; i++) {
    const p = props.match.points[i]
    if (!p) continue
    const server = p.entry.server
    const first = p.rally.shots[0]
    if (first) {
      st.firstPlayed[server]++
      // rally.ts always emits the first serve as shots[0]; 'out'/'net' means it was missed.
      if (first.result !== 'out' && first.result !== 'net') st.firstIn[server]++
    }
    if (p.entry.breakPoint) {
      const returner: Side = server === 0 ? 1 : 0
      st.bpHad[returner]++
      if (p.entry.winner === returner) st.bpWon[returner]++
    }
  }
  return st
})

function pct(n: number, of: number): number {
  return of ? Math.round((n / of) * 100) : 0
}

// --- THE COMMENTARY (viz/commentary.ts) --------------------------------------------------------
// Built once per match, revealed in step with the score: a beat appears exactly when the point it
// is anchored to has been played on screen. So a 'key'-mode watch reveals them in bursts and a
// 'skip' hands over the whole story at once, and in all three the text is the same text.
const commentary = computed(() => buildCommentary(props.match, props.playerA.name, props.playerB.name))

/** Newest first, the way the export stacks the log. */
const visibleBeats = computed(() =>
  commentary.value.filter((b) => b.pointIndex <= displayedPointIndex.value).slice().reverse(),
)

/** The export's log is a fixed-height window with "Show more" under it; four rows is what fits. */
const LOG_ROWS = 4
const logExpanded = ref(false)
const shownBeats = computed(() =>
  logExpanded.value ? visibleBeats.value : visibleBeats.value.slice(0, LOG_ROWS),
)

// --- controls: the app's segmented row rather than two <select>s -------------------------------
// SegmentedRow speaks in VALUES; speed is a number, so this is the one adapter between them (the
// same shape BracketTabs uses for round ids).
const VIEW_OPTIONS = [
  { value: 'full', label: 'Every point', short: 'Full' },
  { value: 'key', label: 'Key points only', short: 'Key' },
  { value: 'skip', label: 'Skip to the result', short: 'Skip' },
] as const
const SPEED_OPTIONS = [
  { value: '1', label: 'Normal speed', short: '1×' },
  { value: '2', label: 'Double speed', short: '2×' },
  { value: '4', label: 'Quadruple speed', short: '4×' },
] as const

const viewSeg = computed({
  get: () => viewMode.value as string,
  set: (v: string) => {
    viewMode.value = v as ViewMode
    playSfx('clickSoft')
  },
})
const speedSeg = computed({
  get: () => String(speed.value),
  set: (v: string) => {
    speed.value = Number(v) as 1 | 2 | 4
    playSfx('clickSoft')
  },
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
  <div class="mv">
    <!-- ===== THE MATCH PANEL (design I, "Панель матча": court, players, serve, stats) ==========
         One clipped panel with hairline-divided sections, exactly as the export draws it. Screen
         I's header (tournament, round, "Skip match") and its CTA belong to whichever flow mounts
         this viewer, not here. -->
    <Card variant="photo" class="mv-panel">
      <div class="mv-court">
        <canvas ref="canvasRef" class="mv-canvas" :style="{ aspectRatio: `${CSS_W} / ${CSS_H}` }"></canvas>
        <!-- BOTH OF THESE SIT IN THE TOP RUN-OFF BAND, NEVER ON THE PLAYING SURFACE (owner,
             29.07). They are furniture: the court is what the player is watching. The badge is
             left, the weather right, so they cannot meet however wide the phone is. -->

        <!-- The export's Live badge. `replay` mode drops it deliberately: docs/specs/ui-inventory
             §2 says the replay "IS the live match minus the blinking Live and minus shouting". -->
        <span v-if="props.mode === 'live' && !finished" class="mv-live"
          ><i class="mv-live-dot" aria-hidden="true"></i>Live</span
        >
        <!-- The export puts this bottom-right ON the court as a two-line chip; the owner asked for
             one line and off the surface, so it is a single row up here. Same plate the Season
             card draws, so the same fact looks like the same fact. -->
        <WeatherPlate v-if="temperatureC != null" class="mv-weather" :temperature-c="temperatureC" :size="13" />
      </div>

      <!-- Round-4 item 1: who stands at which END right now, and who is serving. The panel's own
           rows are fixed A-then-B, so this row is the only thing that knows about ends swaps. -->
      <div class="ends-labels">
        <span :class="{ serving: liveServer === leftSide }">
          {{ formatShortName(playerName(leftSide)) }}{{ liveServer === leftSide ? ' · serving' : '' }}
        </span>
        <span :class="{ serving: liveServer === rightSide }">
          {{ formatShortName(playerName(rightSide)) }}{{ liveServer === rightSide ? ' · serving' : '' }}
        </span>
      </div>

      <div class="mv-players">
        <div v-for="side in SIDES" :key="side" class="mv-prow">
          <span class="mv-serve-dot" :class="{ on: liveServer === side }" aria-hidden="true"></span>
          <span class="mv-pname" :class="{ hers: side === kidSide }">{{ playerName(side) }}</span>
          <span v-if="(side === 0 ? rankA : rankB) != null" class="mv-prank">#{{ side === 0 ? rankA : rankB }}</span>
          <span class="mv-cells">
            <span
              v-for="(cell, i) in setCells"
              :key="i"
              class="mv-cell num"
              :class="[cell.state, { lead: cell.state === 'current' && cell.leader === side }]"
              >{{ side === 0 ? cell.a : cell.b }}</span
            >
          </span>
        </div>
      </div>

      <div class="mv-serving">
        <span class="pill mv-serve-pill">
          <template v-if="finished">Final</template>
          <template v-else>Serving: {{ liveServer !== null ? formatShortName(playerName(liveServer)) : '–' }}</template>
        </span>
        <!-- The export's "Match time 00:07" slot. See `gameScore` for why it carries the point
             score of the game in progress instead of a clock the engine could not honestly tell. -->
        <span v-if="finished" class="mv-progress">Points played <b class="num">{{ pointsPlayed }}</b></span>
        <span v-else class="mv-progress mv-gamescore num">{{ gameScore }}</span>
      </div>

      <div class="mv-stats">
        <div class="mv-stat">
          <p class="mv-stat-label">Momentum</p>
          <svg
            class="mv-mom"
            :viewBox="`0 0 ${MOM_W} ${MOM_H}`"
            :width="MOM_W"
            :height="MOM_H"
            role="img"
            :aria-label="`Momentum: ${momentumCaption}`"
          >
            <template v-if="momentum">
              <polyline class="mv-mom-rival" :points="momentum.rival" />
              <polyline class="mv-mom-hero" :points="momentum.hero" />
            </template>
          </svg>
          <p class="mv-stat-note">{{ momentumCaption }}</p>
        </div>

        <div class="mv-stat">
          <p class="mv-stat-label">1st serve %</p>
          <p class="mv-stat-pair">
            <span class="num" :class="{ hers: heroSide === 0 }">{{ pct(panelStats.firstIn[0], panelStats.firstPlayed[0]) }}%</span>
            <i class="mv-stat-rule" aria-hidden="true"></i>
            <span class="num" :class="{ hers: heroSide === 1 }">{{ pct(panelStats.firstIn[1], panelStats.firstPlayed[1]) }}%</span>
          </p>
          <span class="mv-bar">
            <span
              class="mv-bar-fill"
              :style="{ width: pct(panelStats.firstIn[heroSide], panelStats.firstPlayed[heroSide]) + '%' }"
            ></span>
          </span>
        </div>

        <div class="mv-stat">
          <p class="mv-stat-label">Break points</p>
          <p class="mv-stat-pair">
            <span class="num" :class="{ hers: heroSide === 0 }">{{ panelStats.bpWon[0] }}/{{ panelStats.bpHad[0] }}</span>
            <i class="mv-stat-rule" aria-hidden="true"></i>
            <span class="num" :class="{ hers: heroSide === 1 }">{{ panelStats.bpWon[1] }}/{{ panelStats.bpHad[1] }}</span>
          </p>
          <span class="mv-bar-pair">
            <span v-for="side in SIDES" :key="side" class="mv-bar">
              <span
                class="mv-bar-fill"
                :class="{ dim: side !== heroSide }"
                :style="{ width: pct(panelStats.bpWon[side], panelStats.bpHad[side]) + '%' }"
              ></span>
            </span>
          </span>
        </div>
      </div>
    </Card>

    <!-- ===== THE COMMENTARY (design I, "Лог очков") ============================================
         The export's log chrome - rail, dot, accent lead word, score on the right - carrying the
         beats from viz/commentary.ts instead of one row per point. It REPLACES the point log
         rather than sitting beside it: the export's own rows already read as sentences ("Rally of
         9. Bianca wins the point."), and two lists of the same events differing only in density
         would be one list too many on a phone. Newest first, revealed in step with the score. -->
    <Card variant="photo" class="mv-log" pad="8px 12px 10px">
      <p v-if="!shownBeats.length" class="mv-log-empty">Warming up. The first ball is on its way.</p>
      <ol v-else class="mv-log-list">
        <li v-for="(beat, i) in shownBeats" :key="beat.pointIndex" class="mv-beat" :class="{ latest: i === 0 }">
          <span class="mv-beat-set">S{{ beat.set }}</span>
          <span class="mv-beat-dot" aria-hidden="true"></span>
          <span class="mv-beat-text">
            <b v-if="beat.lead" class="mv-beat-lead">{{ beat.lead }}</b>
            {{ beat.text }}
          </span>
          <span class="mv-beat-score num">{{ beat.score }}</span>
        </li>
      </ol>
      <button
        v-if="visibleBeats.length > LOG_ROWS"
        class="link mv-log-more"
        @click="logExpanded = !logExpanded"
      >
        {{ logExpanded ? 'Show less ⌃' : 'Show more ⌄' }}
      </button>
    </Card>

    <!-- ===== CONTROLS =========================================================================
         The two <select>s became the app's segmented control (U0 SegmentedRow) - the same plate
         the draw's round switcher uses, so "how much to watch" and "how fast" read as controls
         rather than as a form. -->
    <div class="mv-controls">
      <SegmentedRow
        v-model="viewSeg"
        class="mv-seg"
        :options="VIEW_OPTIONS"
        group-label="How much of the match to watch"
      />
      <SegmentedRow v-model="speedSeg" class="mv-seg" :options="SPEED_OPTIONS" group-label="Playback speed" />
    </div>
    <div v-if="props.mode === 'replay' || !finished" class="mv-actions">
      <!-- U0's PrimaryPill: `solid` IS `.primary`, so the class stays and the sound layer's
           `.sfx-watch` hook keeps working - what arrives is the one door for the affirmative. -->
      <PrimaryPill v-if="props.mode === 'replay'" class="sfx-watch" @click="restart">Watch again ↻</PrimaryPill>
      <button v-else disabled title="Coming in Phase 6">Shout 📣</button>
    </div>

    <!-- ===== THE BOX SCORE, once it is over ================================================== -->
    <Card v-if="finished" variant="photo" class="mv-boxscore" pad="12px 14px 14px">
      <p class="mv-final">{{ winnerName }} wins <span class="num">{{ finalScoreLine }}</span></p>
      <table>
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
    </Card>
  </div>
</template>

<style scoped>
/* Screen I's own styles. They live here rather than in src/style.css because the sheet is shared
   vocabulary and this is one screen's business (docs/specs/ui-components.md, and U0's precedent on
   Home and Season). Nothing shared is re-declared: `.pill`, `.link`, `.num`, `table` and `.primary`
   all still come from the sheet. */

.mv {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* --- 1. THE COURT ---------------------------------------------------------------------------
   The canvas keeps its landscape 2:1 (round-4 §0: the shipped geometry is landscape, and the
   phase-2 doc's portrait wording was never updated - not reversed here). */
.mv-court {
  position: relative;
  line-height: 0; /* no descender gap under the canvas */
}

/* `aspect-ratio` is bound inline from CSS_W/CSS_H so the element and the drawing surface cannot
   drift apart - see the constants for why the canvas is taller than the court needs. */
.mv-canvas {
  width: 100%;
  height: auto;
  display: block;
  background: var(--bg);
}

/* The export's Live badge. It sits in the top RUN-OFF band, never on the playing surface (owner,
   29.07). At the shipped canvas that band is ~34px on a 375pt phone and this badge is ~19px tall
   at `top: 6px`, so it clears the surface by ~9px with room for a bigger phone to only add more.
   Kept smaller than the export's pill for exactly that reason: the constraint is the band. */
.mv-live {
  position: absolute;
  top: 6px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  /* The export's overlay chip is rgba(8,13,18,.72) over the court; the app's own --bg IS that
     colour, so the badge takes the token rather than a hand-mixed alpha. */
  background: var(--bg);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.5;
  color: var(--text);
}

.mv-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--danger);
  animation: mv-live-pulse 1.1s ease-in-out infinite;
}

/* The weather plate's mirror of the badge: same band, other end. Both are furniture in the
   run-off; neither may touch the surface. */
.mv-weather {
  position: absolute;
  top: 6px;
  right: 10px;
}

@keyframes mv-live-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mv-live-dot {
    animation: none;
  }
}

/* Round-4 item 1's ends row, now court chrome inside the panel. */
.ends-labels {
  display: flex;
  justify-content: space-between;
  padding: 6px 12px 0;
  font-size: 11px;
  color: var(--muted);
}

.ends-labels .serving {
  color: var(--accent);
  font-weight: 600;
}

/* --- 2. THE PLAYER ROWS --------------------------------------------------------------------- */
.mv-players {
  padding: 8px 12px 10px;
}

.mv-prow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}

/* The serve indicator. The non-serving row keeps the dot as a transparent spacer so the two names
   stay on one left edge (the export's own trick). */
.mv-serve-dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: transparent;
}

.mv-serve-dot.on {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
}

.mv-pname {
  flex: 1;
  min-width: 0;
  font-size: 14.5px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* HERS, in the one accent - the export writes our own girl's name in it and everyone else's white. */
.mv-pname.hers {
  color: var(--accent);
}

.mv-prank {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
}

.mv-cells {
  flex: none;
  display: flex;
  gap: 4px;
}

.mv-cell {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-control);
  font-size: 15px;
  font-weight: 700;
  background: transparent;
  color: var(--text);
}

/* Played and in-progress sets sit on the sheet's hairline tone, a future one on the fainter card
   edge - the export's .05/.03 pair, expressed in the two white-alpha tokens the app declares
   rather than as two new hand-mixed alphas. */
.mv-cell.played,
.mv-cell.current {
  background: var(--line);
}

/* The leader of the set in progress, filled - the export's one lime cell. */
.mv-cell.current.lead {
  background: var(--accent);
  color: var(--on-lime);
  font-weight: 800;
}

.mv-cell.future {
  background: var(--card-edge);
  color: var(--ink-dim);
  font-weight: 600;
}

/* --- 3. THE SERVE ROW ------------------------------------------------------------------------ */
.mv-serving {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border-top: 1px solid var(--line);
}

/* The export outlines this pill in the accent and writes it in the accent; `.pill` gives it the
   capsule and the inset, and this is the only thing that differs. */
.mv-serve-pill {
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
  padding-block: 4px;
}

.mv-progress {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.mv-progress b {
  margin-left: 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text);
}

.mv-gamescore {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.01em;
}

/* --- 4. THE THREE STATS ---------------------------------------------------------------------- */
.mv-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 10px 4px 12px;
  border-top: 1px solid var(--line);
}

.mv-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 0 6px;
  min-width: 0;
}

.mv-stat + .mv-stat {
  border-left: 1px solid var(--line);
}

.mv-stat-label {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-soft);
}

.mv-stat-note {
  margin: 0;
  font-size: 11px;
  color: var(--muted);
}

/* The momentum curve is the live win probability we already compute, drawn from her side. */
.mv-mom {
  width: 100%;
  max-width: 104px;
  height: 26px;
}

.mv-mom-hero,
.mv-mom-rival {
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.mv-mom-hero {
  stroke: var(--accent);
  stroke-width: 1.8;
}

.mv-mom-rival {
  stroke: var(--ink-dim);
  stroke-width: 1.4;
}

.mv-stat-pair {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--muted);
}

.mv-stat-pair .hers {
  font-size: 16px;
  font-weight: 800;
  color: var(--accent);
}

.mv-stat-rule {
  width: 1px;
  height: 12px;
  background: var(--line);
}

.mv-bar,
.mv-bar-pair {
  display: flex;
  width: 100%;
  max-width: 104px;
}

.mv-bar-pair {
  gap: 6px;
}

.mv-bar {
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--ring-track);
  overflow: hidden;
}

.mv-bar-fill {
  height: 100%;
  background: var(--accent);
  transition: width var(--dur-slow) ease;
}

.mv-bar-fill.dim {
  background: var(--ink-dim);
}

/* --- THE COMMENTARY LOG ---------------------------------------------------------------------- */
.mv-log-list {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
}

/* The export's timeline rail, behind the dots. Inset top and bottom so it starts and stops with
   the rows rather than running into the card's edges. */
.mv-log-list::before {
  content: '';
  position: absolute;
  left: 33px;
  top: 12px;
  bottom: 12px;
  width: 1.5px;
  background: var(--line);
}

.mv-beat {
  position: relative;
  display: grid;
  grid-template-columns: 22px 12px 1fr auto;
  align-items: baseline;
  gap: 8px;
  padding: 7px 0;
  font-size: 13px;
}

.mv-beat + .mv-beat {
  border-top: 1px solid var(--card-edge);
}

.mv-beat-set {
  font-size: 11.5px;
  color: var(--muted);
}

.mv-beat-dot {
  justify-self: center;
  align-self: center;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ink-dim);
}

/* The newest beat is the one the eye should land on - the export gives it the bright ball colour
   and a glow, and lifts its text and score out of the muted stack. */
.mv-beat.latest .mv-beat-dot {
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-glow);
}

.mv-beat-text {
  color: var(--ink-soft);
  line-height: 1.35;
}

.mv-beat.latest .mv-beat-text {
  color: var(--ink-2);
}

.mv-beat-lead {
  font-weight: 800;
  color: var(--accent);
}

.mv-beat-score {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-soft);
  white-space: nowrap;
}

.mv-beat.latest .mv-beat-score {
  color: var(--text);
}

.mv-log-empty {
  margin: 6px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--muted);
}

.mv-log-more {
  display: block;
  margin: 2px auto 0;
  text-decoration: none;
  font-weight: 600;
}

/* --- CONTROLS -------------------------------------------------------------------------------- */
.mv-controls {
  display: flex;
  gap: 8px;
}

.mv-seg {
  flex: 1;
  min-width: 0;
}

.mv-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* --- THE BOX SCORE --------------------------------------------------------------------------- */
.mv-final {
  margin: 0 0 10px;
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
}

.mv-final .num {
  margin-left: 6px;
  color: var(--text);
}
</style>
