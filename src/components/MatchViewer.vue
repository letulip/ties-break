<script setup lang="ts">
// Package F – match viewer UI. Consumes Package D (annotateMatch) and Package E
// (buildTimeline, geometry, drawScene) outputs only; no game math lives here. The
// component owns the rAF clock and walks the (pure, pre-timed) Timeline, deriving
// canvas SceneState + the surrounding score/probability/stats readout from it.
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type { AnnotatedMatch, CourtPoint, ShotResult, Timeline, TimelineEvent, ViewMode } from '../viz/types'
import type { MatchPlayer, Side, Surface } from '../engine/match/types'
import { buildTimeline } from '../viz/timeline'
import { drawScene, type SceneState } from '../viz/courtRenderer'
import type { Viewport } from '../viz/geometry'

const props = defineProps<{
  match: AnnotatedMatch
  playerA: MatchPlayer
  playerB: MatchPlayer
  surface: Surface
}>()

// --- canvas: fixed internal resolution, scaled by devicePixelRatio -----------
// Landscape court (Package H): wide 2:1 canvas.
const CSS_W = 680
const CSS_H = 340
const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

// --- playback controls (reactive; drive the template) -------------------------
const mode = ref<ViewMode>('key')
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

let timeline: Timeline = buildTimeline(props.match, mode.value)
let clock = 0
let cursor = 0
let marks: MarkEntry[] = []
let currentEvent: TimelineEvent | null = timeline.events[0] ?? null
let rafId: number | null = null
let lastTs: number | null = null

function pauseInternal(): void {
  playing.value = false
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  lastTs = null
}

function completeEvent(ev: TimelineEvent): void {
  if (ev.kind === 'shot' && ev.shotIndex !== undefined) {
    const shot = props.match.points[ev.pointIndex]?.rally.shots[ev.shotIndex]
    if (shot) {
      marks.push({ p: shot.bounce, landedAt: ev.t + ev.duration, result: shot.result })
      if (marks.length > MARK_CAP) marks.shift()
    }
  } else if (ev.kind === 'point-end') {
    displayedPointIndex.value = ev.pointIndex
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
  const scene: SceneState = {
    match: props.match,
    pointIndex: scenePointIndex,
    flight: currentFlight(),
    marks: visibleMarks(),
    surface: props.surface,
  }
  drawScene(ctx, vp, scene)
}

function frame(ts: number): void {
  if (lastTs === null) lastTs = ts
  const dtReal = (ts - lastTs) / 1000
  lastTs = ts
  advance(dtReal * speed.value)
  render()
  if (playing.value && !finished.value) {
    rafId = requestAnimationFrame(frame)
  }
}

function startClock(): void {
  if (finished.value || mode.value === 'skip') return
  playing.value = true
  lastTs = null
  rafId = requestAnimationFrame(frame)
}

/** 'skip' mode never walks points – jump straight to the result screen. */
function jumpToEnd(): void {
  pauseInternal()
  clock = timeline.duration
  cursor = timeline.events.length
  currentEvent = timeline.events[timeline.events.length - 1] ?? null
  displayedPointIndex.value = props.match.points.length - 1
  finished.value = true
  render()
}

function resetPlayback(startPlaying: boolean): void {
  pauseInternal()
  timeline = buildTimeline(props.match, mode.value)
  clock = 0
  cursor = 0
  marks = []
  displayedPointIndex.value = -1
  finished.value = false
  currentEvent = timeline.events[0] ?? null
  if (mode.value === 'skip') {
    jumpToEnd()
  } else {
    render()
    if (startPlaying) startClock()
  }
}

function togglePlay(): void {
  if (mode.value === 'skip') return
  if (finished.value) {
    resetPlayback(true)
    return
  }
  if (playing.value) pauseInternal()
  else startClock()
}

function restart(): void {
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
watch(mode, () => resetPlayback(playing.value))
watch(
  () => props.match,
  () => resetPlayback(true),
)

// --- readout: score / serve / win-probability / stats -------------------------
function playerName(side: Side): string {
  return side === 0 ? props.playerA.name : props.playerB.name
}

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

    <div class="controls">
      <select v-model="mode">
        <option value="full">Full</option>
        <option value="key">Key points</option>
        <option value="skip">Skip</option>
      </select>
      <select v-model.number="speed">
        <option :value="1">1×</option>
        <option :value="2">2×</option>
        <option :value="4">4×</option>
      </select>
      <button class="primary" :disabled="mode === 'skip'" @click="togglePlay">{{ playPauseLabel }}</button>
      <button @click="restart">Restart</button>
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
              <th>{{ playerA.name }}</th>
              <th>{{ playerB.name }}</th>
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
