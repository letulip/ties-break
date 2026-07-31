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
import { pointServeSpeeds, type StruckServe } from '../engine/match/serveSpeed'
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
    /**
     * IS THIS MATCH HAPPENING NOW, OR IS IT BEING WATCHED BACK? It decides three things and only
     * three: the blinking Live badge, the shout, and the viewer's own "Watch again ↻".
     *
     * ⚠ REQUIRED, AND IT USED TO DEFAULT TO `'live'` "so existing call sites need no change" (round
     * 4 item 4). That convenience shipped a lie: TournamentFlow mounted this component with NO
     * `mode` at all, so the busiest match screen in the app blinked a red "Live" over a bracket the
     * engine had already resolved during the tick, and PracticeFlow said `mode="live"` out loud on a
     * friendly that was equally already in the save file. A default that is wrong for three call
     * sites out of four is not a convenience, it is a trap with a nice name - so there is no default
     * any more and `vue-tsc` fails the build if a new caller forgets to say which it is.
     * The one genuinely live surface in the app is SeasonScreen's sandbox exhibition: it is
     * simulated at the moment the button is pressed and written nowhere.
     */
    mode: 'live' | 'replay'
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
  { rankA: null, rankB: null, finalMatch: false, temperatureC: null },
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
/**
 * THE SPEED OF THE SERVE CURRENTLY BEING TALKED ABOUT, and which side struck it (owner, 31.07:
 * «а справа и слева, в зависимости от того, кто подает, будем скорость подачи писать - это будет
 * топ»). Null when there is no serve to talk about - see `serveReadingFor` for the rule.
 *
 * `side` is the side that STRUCK it, not `liveServer`, so the reading can never end up under the
 * wrong player: both come off the same point, but only this one comes off the shot itself.
 */
const liveServeSpeed = ref<StruckServe | null>(null)

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

// --- 31.07: THE SERVE SPEED, LIVE, AT THE SERVER'S END OF THE RUN-OFF BAND ----------------------
//
// Owner, after playing: «а справа и слева, в зависимости от того, кто подает, будем скорость подачи
// писать - это будет топ».
//
// ⚠ THE NUMBER IS NOT COMPUTED HERE. `serveSpeed.pointServeSpeeds` is the one place the per-point
// speed stream is seeded and read, and the box score's "Max serve" row goes through the same call -
// so the reading on the court and the reading in the stats table are one number by construction.
// Re-deriving it in this file, however carefully, is how two readings of one serve come to disagree,
// and that is worse than not showing it at all.
//
/**
 * HOW LONG THE READING STAYS UP: the serve, and the reply to it.
 *
 * The two failure modes are both real and they pull opposite ways. Leave it up for the whole point
 * and a twenty-shot rally ends with a stale number sitting under the court, as if it described the
 * ball currently in play. Take it down when the ball is struck and it is a 0.55s flash at ×1 - a
 * quarter of a second at ×2, which is the speed the viewer opens on - and a reading nobody can
 * actually read is decoration.
 *
 * So it lives for the serve and for the answer to it - "serve +1", which is the phrase tennis
 * already has for exactly this window. TWO event kinds carry it and everything else is nothing:
 *
 *   * a SHOT: the last serve struck at or before it, if that serve is this shot or the one before
 *     it. The reply is the last moment the serve is still the thing that happened; from the third
 *     strike on it is a rally, and the number is history.
 *   * the point's own POINT-END beat, judged the same way against the shot the point ended on. This
 *     is the half that saves the short points: an ace, a service winner and a double fault ARE one
 *     or two shots long, so without it they would be the only points whose reading really did flash.
 *
 * ⚠ AN ALLOW-LIST OF TWO, NOT A DENY-LIST, and that is the point of writing it this way. Everything
 * else falls out right for free: the point-start, so a reading can never survive into a point it did
 * not come from and sit under the wrong player when the serve changes hands; the match-end curtain;
 * and - measured on a live match, which is what sent this back for a second pass - the CEREMONY
 * beats. A game-ending ace used to hold its number through point-end, the quiet gap, game-end, its
 * gap and the change of ends: four seconds at ×1, and eight if it also ended a set. That is a
 * different kind of stale from the twenty-shot rally and just as wrong.
 *
 * What is left is ~1s of screen time at ×1 in both cases - 0.55 + 0.42 for a rally, 0.55 + 0.50 for
 * an ace - so the reading is the same length whatever the point turns out to be, and it is gone well
 * before the next ball is served either way. Timeline seconds, so it shortens with the playback
 * speed exactly as the bounce marks (MARK_DECAY) already do.
 */
const SERVE_READING_SHOTS = 1

function serveReadingFor(ev: TimelineEvent | null): StruckServe | null {
  if (!ev || (ev.kind !== 'shot' && ev.kind !== 'point-end')) return null
  const point = props.match.points[ev.pointIndex]
  if (!point) return null
  // Which shot of this point is on screen: the one a 'shot' event names, or - on the point-end beat
  // - the shot the point ended on.
  const onScreen = ev.kind === 'shot' && ev.shotIndex !== undefined ? ev.shotIndex : point.rally.shots.length - 1
  if (onScreen < 0) return null
  const struck = pointServeSpeeds(props.match.result.seed, point, props.playerA, props.playerB)
  // The last serve struck at or before that shot - so a point that went to a second serve reports
  // the second serve, which is the one actually struck (and the model strikes it slower).
  let latest: StruckServe | null = null
  for (const s of struck) {
    if (s.shotIndex > onScreen) break
    latest = s
  }
  if (!latest || onScreen - latest.shotIndex > SERVE_READING_SHOTS) return null
  return latest
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
  // The serve reading rides the same gate: it is a pure function of the event on screen (see
  // serveReadingFor), so recomputing it only when that event changes is both exact and free -
  // once every ~0.4s of playback rather than sixty times a second.
  if (currentEvent !== lastRenderedEvent) {
    if (currentEvent?.kind === 'shot') gatedSfx('hit')
    liveServeSpeed.value = serveReadingFor(currentEvent)
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

/**
 * THE LARGEST REAL-TIME GAP A SINGLE FRAME MAY CARRY, in seconds.
 *
 * ⚠ THIS IS THE HALF OF THE 31.07 VISIBILITY FIX THAT SURVIVES A MISSED EVENT, and it is the half
 * that actually holds the guarantee. `visibilitychange` (below) is the door, but it is not the only
 * way a tab stops painting: iOS backgrounds through `pagehide`/`freeze` without always firing it,
 * and a device can sleep between two frames with nothing dispatched at all. In every one of those
 * cases rAF stops, `lastTs` keeps the timestamp of the last frame BEFORE the gap, and the first
 * frame back hands `frame()` the whole absence as one `dtReal` - which `advance()` would then walk
 * through the timeline in a single call. A minute on the home screen was a minute of match, played
 * with no one watching and the sound cues fired into an empty room; long enough, and the player came
 * back to a finished match he never saw.
 *
 * A quarter of a second is ~15 frames at 60Hz - far beyond any hitch that is still playback (a bad
 * GC pause is a few tens of ms) and far below any absence that is not. Clamping COSTS the missing
 * time rather than skipping any of it: the timeline is a fixed, pre-computed sequence and the walk
 * is strictly ordered, so every event still plays, in order, exactly once. The only thing that
 * changes is that the wall clock does not get to fast-forward the match.
 */
const MAX_FRAME_DT = 0.25

function frame(ts: number): void {
  if (lastTs === null) lastTs = ts
  const dtReal = Math.min((ts - lastTs) / 1000, MAX_FRAME_DT)
  lastTs = ts
  const dt = dtReal * speed.value
  advance(dt)
  updatePlayers(dt)
  render()
  if (playing.value && !finished.value) {
    rafId = requestAnimationFrame(frame)
  }
}

// --- 31.07 item 2: THE MATCH STOPS WHEN THE SCREEN DOES -----------------------------------------
//
// Owner: pause the game and the match when the screen is minimised or backgrounded, the way the
// music does. The music's own listener (src/audio/music.ts, R8-2) is the model this follows
// deliberately - same event, same "only resume what was actually running" rule - because a player
// who comes back to a silent app and a running match has been told two different things about
// whether the game is paused.
//
// WHAT WAS ACTUALLY GOING WRONG, and it is not that rAF keeps running - it does not. The damage was
// all in the RESUME: rAF stops while hidden, `lastTs` holds the last frame before the tab went away,
// and the first frame back therefore carries the entire absence as one delta. See MAX_FRAME_DT
// above for that half. This half is the honest one - the match is PAUSED, not merely rate-limited,
// so nothing plays to an empty room and the pre-roll timer (a `setTimeout`, which is NOT throttled
// away the way rAF is) cannot start the clock behind the player's back.
//
// RESUMING IS CLEAN BY CONSTRUCTION. `pauseInternal()` sets `lastTs = null`, so the first frame after
// `startClock()` measures zero elapsed time and the clock resumes at exactly the value it was
// stopped at - no skip, and nothing replayed. Time stops passing; it is never rewound or thrown away.
//
// ONE EDGE, stated rather than papered over: hidden DURING the take-your-seats pre-roll, the hold's
// remainder is dropped and playback begins as soon as the screen comes back (`seatsPlayedForRun` is
// already true, so `startClock` goes straight to the clock loop). The clip is a pre-match beat, the
// clock was still at 0, and no match time is involved either way.
/** Was the match actually running when the screen went away? Only then does coming back start it
 *  again - a match the player had deliberately paused, or one already finished, stays as it was. */
let resumeOnVisible = false

function onVisibilityChange(): void {
  if (document.hidden) {
    resumeOnVisible = playing.value && !finished.value
    if (resumeOnVisible) pauseInternal()
  } else if (resumeOnVisible) {
    resumeOnVisible = false
    startClock()
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
  // Explicit rather than left to render()'s gate: on an EMPTY timeline `currentEvent` and
  // `lastRenderedEvent` are both null, the gate never fires, and the last run's reading would sit
  // under a court with no match on it.
  liveServeSpeed.value = null
  seatsPlayedForRun = false
  // The shouts belong to THE RUN, not to the match: a restart, a "Watch again", a mode change or a
  // new match prop all start the watch over, and what was shouted at the last one is not part of
  // this one. (Nothing else has to be undone - a shout changed nothing to undo.)
  shouts.value = []
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
  // 31.07 item 2. Per INSTANCE rather than at module load (which is what music.ts does): that
  // listener guards one long-lived `<audio>` element, this one guards the rAF clock of a component
  // that mounts and unmounts four times over, and a module-level handler would have to find the live
  // one. Feature-guarded so the unit environment, which has no `document`, is untouched.
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibilityChange)
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
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange)
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
 *  used to carry instead (the commentary's score column shows GAMES, not points).
 *
 *  ⚠ THE SLOT MOVED ON 31.07 AND THE READING DID NOT. It used to be the right-hand end of a serve
 *  row under the player rows; the owner had the row's other half deleted as a duplicate and this
 *  half moved into the court's bottom run-off band, which was already drawn and already empty. Same
 *  words, same typography, one fewer row of panel - see `scoreReadout` and `.mv-score`. */
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

/**
 * WHAT THE COUNTER UNDER THE COURT SAYS (owner, 31.07 - see `.mv-score` for where it sits).
 *
 * Both readings the deleted serve row carried, in one place and unchanged: the point score of the
 * game in progress while it is being played, and how far the match got once it is over. Neither is
 * a duplicate of anything else on the screen - the commentary's score column shows GAMES, and the
 * set cells show sets - which is exactly why the row's OTHER half was the one that went.
 *
 * Empty before the first point lands (`gameScore` returns '' there), and the template drops the
 * element entirely rather than pinning an empty box over the court.
 */
const scoreReadout = computed(() => (finished.value ? `${pointsPlayed.value} points` : gameScore.value))

/**
 * WHICH END OF THE RUN-OFF BAND THE SPEED IS WRITTEN AT, or null when there is nothing to write.
 *
 * Owner: «справа и слева, в зависимости от того, кто подает». The band is directly under the court
 * and the court is landscape (viz/geometry: side 0 defends the LEFT half), so an end really is a
 * left and a right - the same mapping `.ends-labels` already uses one row further down, through the
 * same `leftSide`. The reading therefore sits with the player who struck the serve, and crosses the
 * screen when the serve does: on a change of ends, because the players swapped; on a change of
 * serve, because the server did.
 */
const serveSpeedEnd = computed<'left' | 'right' | null>(() =>
  liveServeSpeed.value === null ? null : liveServeSpeed.value.side === leftSide.value ? 'left' : 'right',
)

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

// --- THE SHOUT (owner, 30.07: «можем какой-то набор фраз в дропдаун селект сделать и кнопку рядом.
// Выбрал, крикнул.») ----------------------------------------------------------------------------
//
// WHAT SHOUTING DOES: it lands in the log, and it does not touch the match. That is not a shortcut,
// it is the only thing it COULD do here. Every match this component is ever handed is already
// resolved - `AnnotatedMatch` is built from a finished `MatchResult`, and three of the four callers
// say so in their own header comments ("watching cannot change the result and draws no RNG the
// engine hasn't already drawn"). A shout that changed play would mean the VIEW re-deciding a result
// the engine owns and the save file already holds. Morale is the substrate a real mechanic would
// need and it does not exist yet (docs/plan.md, Phase 6) - so this is the flavour half, shipped, and
// the mechanic half stays where the plan put it.
//
// AND THE PLAYER IS NOT TOLD EITHER WAY, deliberately. docs/decisions.md: «Shouts from the stands in
// key points: yes, engagement feature; affect morale at most (maybe nothing – deliberately
// uncertain, like real life)». So no label promises an effect and none denies one; the row appears,
// and that is all it claims.
//
// THE VOICE. A parent at the side of a junior court, not a crowd at a stadium. docs/lore/setting.md
// §3 is the register («the drama is in the numbers ... nothing is heightened», «warm ... this is not
// misery») and §4 is the hard constraint: «parent as observer – they shape circumstances and react,
// they never decide for her». So NONE of these is an instruction about tennis. They notice her, or
// they give her room, or they are a parent being domestic at a sports ground - which is exactly what
// the family diary does («She asked what was for dinner before we were out of the car park»). What
// is deliberately absent is the whole consolation register `tests/travel-home.test.ts` already bans
// from this family's mouth once: no "well played", no "good effort", no "unlucky", no "so close".
//
// ⚠ AND IT IS THE FIRST SECOND-PERSON COPY IN THE GAME, which is a break and not an oversight. Every
// other player-facing pool is third person about her with "we" for the family, and the diary's guard
// greps for `\byou\b` and fails on it. A shout is the one surface where speaking TO her is the whole
// point, and that guard is about the DIARY's voice - a note written down later - not about a sentence
// shouted across a fence.
const SHOUT_PHRASES = [
  'Still here.',
  'Take your time.',
  'I saw that.',
  'Next one.',
  'Drink something.',
  'Enjoy it.',
] as const
const shoutPhrase = ref<string>(SHOUT_PHRASES[0])

interface ShoutRow {
  /** monotonic, so two identical phrases are two rows and the newest sorts on top */
  n: number
  pointIndex: number
  set: number
  text: string
}
const shouts = ref<ShoutRow[]>([])
let shoutSeq = 0

/** 1-based set the given point belongs to – the log's left rail label. Counted the way
 *  viz/commentary.ts counts it (one `setEnd` point closes each set), so a shout's rail label can
 *  never disagree with the beat sitting under it. */
function setOfPoint(index: number): number {
  let set = 1
  for (let i = 0; i < index; i++) if (props.match.points[i]?.setEnd) set++
  return set
}

/** Shout the chosen phrase. Anchored to the point on screen, which is what puts it in the right
 *  place in a log that is ordered by point and read newest-first. */
function shoutIt(): void {
  const at = Math.max(0, displayedPointIndex.value)
  shouts.value.push({ n: ++shoutSeq, pointIndex: at, set: setOfPoint(at), text: shoutPhrase.value })
  playSfx('click')
}

/** A row of the log: a commentary beat, or something the parent shouted. ONE flat shape rather than
 *  a discriminated union, because the template has to read `lead`/`score` off it and a union would
 *  need narrowing inside the markup to type-check. A shout carries no lead and no score. */
interface LogRow {
  key: string
  kind: 'beat' | 'shout'
  set: number
  lead: string | null
  text: string
  score: string
}

/**
 * THE MERGED LOG, and the merge is the whole reason a shout can be a row at all.
 *
 * ⚠ `buildCommentary` IS NOT TOUCHED, AND MUST NOT BE. It is a pure function of the match with a
 * determinism pin on it: the same match narrates identically, every replay, forever (viz/commentary
 * .ts, "THE DETERMINISM RULE" - zero random draws, phrase variety from a hash of the point index).
 * A player action is not match data, so a shout cannot enter that function without making the same
 * match narrate two different ways depending on what somebody pressed. The two lists therefore stay
 * separate all the way to the render: `commentary` is derived from the match, `shouts` is a plain
 * reactive log of presses, and they only meet HERE, in display order.
 *
 * Newest first, the way the export stacks the log. Ties go to the shout, because a shout during
 * point N happens after point N's beat has already appeared on screen.
 */
const visibleRows = computed<LogRow[]>(() => {
  const merged: { pointIndex: number; order: number; row: LogRow }[] = visibleBeats.value.map((b) => ({
    pointIndex: b.pointIndex,
    order: 0,
    row: { key: `b${b.pointIndex}`, kind: 'beat', set: b.set, lead: b.lead, text: b.text, score: b.score },
  }))
  for (const s of shouts.value) {
    merged.push({
      pointIndex: s.pointIndex,
      order: s.n,
      row: { key: `s${s.n}`, kind: 'shout', set: s.set, lead: null, text: s.text, score: '' },
    })
  }
  merged.sort((x, y) => y.pointIndex - x.pointIndex || y.order - x.order)
  return merged.map((m) => m.row)
})

/** The export's log is a fixed-height window with "Show more" under it; four rows is what fits. */
const LOG_ROWS = 4
const logExpanded = ref(false)
const shownRows = computed(() =>
  logExpanded.value ? visibleRows.value : visibleRows.value.slice(0, LOG_ROWS),
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
             left, the weather right, so they cannot meet however wide the phone is.
             ⚠ AND THEY ARE ONE ROW NOW, NOT TWO ABSOLUTE CORNERS (owner, 31.07: «align the weather
             element and move it down so it sits on the same line as live»). They were pinned
             separately at the same `top: 6px`, which lines up their TOP EDGES and therefore nothing
             a reader can see: the badge is a 19px pill (10px text at 1.5, plus 2px of padding each
             side) and the plate is a bare 13px reading, so their centre lines sat 3px apart and the
             weather rode high. `top` on two boxes of different heights is not an alignment. One flex
             row with `align-items: center` is - and it stays true if either piece ever changes size,
             which is the half a 3px nudge would not have bought. -->
        <div class="mv-chrome">
          <!-- The export's Live badge. `replay` mode drops it deliberately: docs/specs/ui-inventory
               §2 says the replay "IS the live match minus the blinking Live and minus shouting". -->
          <span v-if="props.mode === 'live' && !finished" class="mv-live"
            ><i class="mv-live-dot" aria-hidden="true"></i>Live</span
          >
          <!-- The export puts this bottom-right ON the court as a two-line chip; the owner asked for
               one line and off the surface, so it is a single row up here. Same plate the Season
               card draws, so the same fact looks like the same fact. -->
          <WeatherPlate v-if="temperatureC != null" :temperature-c="temperatureC" :size="13" />
        </div>

        <!-- ===== THE BOTTOM RUN-OFF BAND: SPEED · SCORE · SPEED =============================
             The score counter came here on 31.07 («move the score counter up so it sits directly
             under the court, positioned the way the weather element is, but at the bottom edge -
             this buys back some vertical space»), pinned to the band's right end. It is CENTRED now,
             and the two ends carry the serve speed, at the end of whoever struck it (owner, after
             playing: the score in the middle, the serve speed left and right depending on who is
             serving). The band itself is unchanged - already drawn, already empty, already off the
             playing surface, which is the 29.07 rule the Live badge and the weather live by too.
             Three fixed grid columns rather than a flex row, because the score has to be centred on
             the COURT and not on whatever is left after the speed: `1fr auto 1fr` centres the middle
             column no matter which end is occupied, and only one end ever is. See `.mv-runoff`. -->
        <div class="mv-runoff">
          <!-- ONE element that moves between the two end columns, not two that take turns being
               hidden: the class IS the end (see `.mv-speed.left` / `.mv-speed.right`), so there is
               one piece of markup and one place a future change to the reading has to be made. -->
          <span v-if="serveSpeedEnd" class="mv-speed num" :class="serveSpeedEnd"
            >{{ liveServeSpeed?.kmh }}<i class="mv-speed-unit">km/h</i></span
          >
          <span v-if="scoreReadout" class="mv-score num">{{ scoreReadout }}</span>
        </div>
      </div>

      <!-- Round-4 item 1: who stands at which END right now, and who is serving. The panel's own
           rows are fixed A-then-B, so this row is the only thing that knows about ends swaps.
           ⚠ AND IT IS THE OUTLINED ONE NOW (owner, 31.07: «who's serving is already indicated by
           colour - add an outline on top of that, and remove the duplicate indicator at the bottom»).
           The serving end was said in the accent and suffixed "· serving"; it now also wears a
           hairline capsule in the same accent. The capsule is on BOTH ends - transparent on the one
           that is not serving - so the row's height and both baselines are fixed and nothing jumps
           when the serve changes hands. The word stays: colour and an outline are both decoration,
           and the reading has to survive a screen reader and a monochrome screen. -->

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

      <!-- ===== THE SERVE ROW IS GONE, AND THAT IS THE POINT OF THE 31.07 ITEM ==================
           It held two things and neither belonged here:
             * "Serving: B. Tran" - the THIRD saying of a fact the screen already gives twice above,
               in colour, at the two places the eye is already looking (the ends row directly under
               the court, and the lime dot on the serving player's own row). The owner named it
               exactly: «who's serving is already indicated by colour ... remove the duplicate
               indicator at the bottom». The two survivors are the ones attached to something - an
               end and a player - and the outline this round adds is on the first of them.
             * The point score of the game in progress, which is not a duplicate of anything and has
               moved UP into the court's bottom run-off band (see `.mv-score`), where it costs no
               height at all.
           So the row itself had nothing left to hold, and a row is worth ~33px of a phone that is
           mostly court and log. Its `border-top` went with it; `.mv-stats` draws its own, so the
           panel's hairline rhythm is unchanged. "Final" went too: the box score directly below says
           "<winner> wins 6-4 6-3", which is that word plus everything it left out, and the Live badge
           disappearing at the same instant says it a second time. -->

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

    <!-- ===== EVERYTHING BELOW THE COURT ========================================================
         ⚠ THIS WRAPPER IS WHAT KEEPS THE PINNED CONTROL BAR OFF THE PLAYING SURFACE (owner, 30.07:
         «maybe we need to make lower buttons on match screen fixed so we could use them anytime?»).
         `.mv-controls` is `position: sticky; bottom: 0`, and a sticky element can only travel
         inside its own containing block - which is THIS element's content box, not `.mv`'s. Its top
         edge is the log's top edge, strictly below `.mv-panel`, which is what holds the court. So
         the bar cannot reach the surface at ANY viewport height, and that is a structural fact
         rather than an argument from how tall a phone happens to be. Flatten this wrapper away and
         the guarantee goes with it - see tests/screen-i-live-match.test.ts. -->
    <div class="mv-below">
      <!-- ===== THE COMMENTARY (design I, "Лог очков") ==========================================
           The export's log chrome - rail, dot, accent lead word, score on the right - carrying the
           beats from viz/commentary.ts instead of one row per point. It REPLACES the point log
           rather than sitting beside it: the export's own rows already read as sentences ("Rally of
           9. Bianca wins the point."), and two lists of the same events differing only in density
           would be one list too many on a phone. Newest first, revealed in step with the score.
           ⚠ AND IT CARRIES WHAT THE PARENT SHOUTED, INTERLEAVED (owner, 30.07). A shout row is the
           phrase in a `<q>` - real quotation semantics, so the marks are the browser's and a screen
           reader announces a quotation rather than two typed characters - with no lead and no score,
           because a shout is not a point and has no games standing after it. It takes the SAME grid
           as a beat so the rail and the dots still line up down one column. See `visibleRows` for
           why the two lists only ever meet at the render. -->
      <Card variant="photo" class="mv-log" pad="8px 12px 10px">
        <p v-if="!shownRows.length" class="mv-log-empty">Warming up. The first ball is on its way.</p>
        <ol v-else class="mv-log-list">
          <li
            v-for="(row, i) in shownRows"
            :key="row.key"
            class="mv-beat"
            :class="{ latest: i === 0, said: row.kind === 'shout' }"
          >
            <span class="mv-beat-set">S{{ row.set }}</span>
            <span class="mv-beat-dot" aria-hidden="true"></span>
            <span class="mv-beat-text">
              <q v-if="row.kind === 'shout'">{{ row.text }}</q>
              <template v-else>
                <b v-if="row.lead" class="mv-beat-lead">{{ row.lead }}</b>
                {{ row.text }}
              </template>
            </span>
            <span v-if="row.score" class="mv-beat-score num">{{ row.score }}</span>
          </li>
        </ol>
        <button
          v-if="visibleRows.length > LOG_ROWS"
          class="link mv-log-more"
          @click="logExpanded = !logExpanded"
        >
          {{ logExpanded ? 'Show less ⌃' : 'Show more ⌄' }}
        </button>
      </Card>

      <!-- ===== CONTROLS =======================================================================
           The two <select>s became the app's segmented control (U0 SegmentedRow) - the same plate
           the draw's round switcher uses, so "how much to watch" and "how fast" read as controls
           rather than as a form.
           PINNED, NOT FIXED (owner, 30.07). A fixed bar would cost its height off the top of every
           match screen for the whole watch; sticky costs NOTHING until the bar would otherwise be
           off the bottom, and then it is there. See `.mv-controls` for the measurement. -->
      <div class="mv-controls">
        <SegmentedRow
          v-model="viewSeg"
          class="mv-seg"
          :options="VIEW_OPTIONS"
          group-label="How much of the match to watch"
        />
        <SegmentedRow v-model="speedSeg" class="mv-seg" :options="SPEED_OPTIONS" group-label="Playback speed" />
        <!-- ⚠ SHOUT IS IN THE PINNED BLOCK (owner, 30.07: «на экране live матча кнопку shout тоже
             надо оставить в sticky блоке»). It used to sit below the bar in `.mv-actions`, on the
             argument that the bar carries SETTINGS and this is an ACTION - and the argument was wrong
             about this one button. Shouting at your kid is the thing you would reach for mid-rally,
             which is the same test that pinned the speed and the view; leaving it outside meant the
             one control the player might actually want during a point was the one that scrolled away
             as the log filled. It takes a SECOND ROW of the bar rather than squeezing the two plates
             onto a third of it - see `.mv-shout`, and the measurement of the attempt that did squeeze
             them.
             ⚠ AND IT IS A REAL CONTROL NOW, NOT A DISABLED PLACEHOLDER (owner, 30.07: «можем какой-то
             набор фраз в дропдаун селект сделать и кнопку рядом. Выбрал, крикнул»). It read
             "Shout 📣", disabled, `title="Coming in Phase 6"`; it is a phrase picker and the same
             verb beside it, and pressing it puts the line in the log. What it does NOT do is touch
             the match - see `SHOUT_PHRASES` for why that is the only thing it could do and why no
             label here promises or denies an effect.
             ⚠ THE PICKER IS A NATIVE `<select>`, AND THAT IS A FINDING RATHER THAN A CHOICE. This app
             has a control system and it has NO dropdown component: `src/components/ui/` holds eleven
             components and none of them is one, `SegmentedRow` cannot take six phrases on a 327px bar
             (its three `short` labels already needed their padding trimmed to fit), and the only
             designed dropdown in the app is `.ob-select-wrap` in OnboardingWizard - a labelled box
             with an icon and a chevron, scoped to that screen, built around a real `<select>` with
             its chrome turned off. What `src/style.css` DOES declare, in the same rule as the text
             input, is a plain `select` skin, and this is its first live consumer. A native select is
             also the only version that opens the phone's own picker. So: no seventh control shape
             invented, no premature component for one caller. The extraction point, if a second caller
             ever appears, is OnboardingWizard's box - and it should take that box, not this one.
             The gate is the Live badge's own: ui-inventory §2 says the replay "IS the live match minus
             the blinking Live and minus shouting", and the owner said it again on 30.07 («На реплее
             этого Shout вообще не будет, его можно даже не показывать, по принципу live»). After this
             round three of the four callers are replays, so this is a Season-sandbox control. -->
        <div v-if="props.mode === 'live' && !finished" class="mv-shout">
          <select v-model="shoutPhrase" class="mv-shout-pick" aria-label="What to shout">
            <option v-for="phrase in SHOUT_PHRASES" :key="phrase" :value="phrase">{{ phrase }}</option>
          </select>
          <button class="mv-shout-go" @click="shoutIt">Shout 📣</button>
        </div>
      </div>
      <!-- WHAT IS LEFT OUTSIDE THE PINNED BAR, and it is one button on one mode: "Watch again" only
           means anything once the match is over, and a replay is never watched while you are waiting
           for it - so it does not earn permanent screen the way a mid-rally control does.
           ⚠ `&& finished` IS NEW, 30.07, AND IT IS WHAT THE LINE ABOVE ALREADY CLAIMED. The gate was
           `mode === 'replay'` alone, so the button sat there through the whole replay - "only means
           anything once the match is over" was an argument the code did not keep. It matters now
           because TournamentFlow and PracticeFlow became replays this round: both hand the player
           their own box score the instant playback ends (`@finish` -> a phase change that unmounts
           this component in the same flush, before it can paint), so without this they would have
           grown a second "Watch again" inside the viewer, next to the one their box score already
           has. MatchReplay is the caller that genuinely needs it: it has no screen after the match. -->
      <div v-if="props.mode === 'replay' && finished" class="mv-actions">
        <!-- U0's PrimaryPill: `solid` IS `.primary`, so the class stays and the sound layer's
             `.sfx-watch` hook keeps working - what arrives is the one door for the affirmative. -->
        <PrimaryPill class="sfx-watch" @click="restart">Watch again ↻</PrimaryPill>
      </div>

      <!-- ===== THE BOX SCORE, once it is over ================================================ -->
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

/* THE TOP RUN-OFF BAND'S ROW OF FURNITURE (owner, 31.07: «align the weather element and move it down
   so it sits on the same line as live»). The badge and the weather plate used to be pinned
   separately, both at `top: 6px` - which aligns their top EDGES, and they are not the same height
   (19px pill vs a bare 13px reading), so their centre lines sat 3px apart. One row, centred, is the
   alignment he asked for and it survives either piece changing size.
   The insets are the two they already had (8px left for the badge, 10px right for the plate), so
   nothing moved horizontally; `justify-content: flex-end` plus the badge's own `margin-right: auto`
   keeps the plate hard right on a replay, where there is no badge to push it there.
   `pointer-events: none` because this row is now a full-width box over the court and none of it is a
   control - without it, the dead space between the two readings would swallow taps meant for the
   canvas. */
.mv-chrome {
  position: absolute;
  top: 6px;
  left: 8px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  pointer-events: none;
}

/* The export's Live badge. It sits in the top RUN-OFF band, never on the playing surface (owner,
   29.07). At the shipped canvas that band is ~34px on a 375pt phone and this badge is ~19px tall
   at `top: 6px`, so it clears the surface by ~9px with room for a bigger phone to only add more.
   Kept smaller than the export's pill for exactly that reason: the constraint is the band.
   `margin-right: auto` is what holds the left end of the row above - see `.mv-chrome`. */
.mv-live {
  margin-right: auto;
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

/* The weather plate needs no rule of its own any more: it is the other end of `.mv-chrome`, which
   owns the band, the inset and the centre line for both pieces. It kept a `.mv-weather` class for
   the two absolute offsets that are now the row's, and a class with no rule behind it is the next
   thing somebody re-adds a rule to, so it went with them. */

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

/* THE BOTTOM RUN-OFF BAND'S ROW: SPEED · SCORE · SPEED.
   The score arrived here on 31.07 («move the score counter up so it sits directly under the court,
   positioned the way the weather element is, but at the bottom edge - this buys back some vertical
   space»), at the band's right end. The owner then asked, after playing, for the score in the MIDDLE
   and the serve speed at the ends: «этот счет сета ... поставим посередине, а справа и слева, в
   зависимости от того, кто подает, будем скорость подачи писать».
   The band is untouched: `bottom: 6px` still mirrors `.mv-chrome`'s `top: 6px`, so the two run-off
   bands are still used identically, and the badge's arithmetic still applies - ~19px of furniture in
   the ~34px of band a 375pt phone draws (see CSS_H, and the symmetry assertion in
   tests/screen-i-live-match.test.ts), so nothing here reaches the playing surface either.
   The inset is the counter's own 10px, on BOTH sides. Measured at 375pt, the 8px left / 10px right
   pair the top row uses put the score 1px off the court's centre line - invisible, but "posередине"
   is cheap to make exactly true and there is nothing to trade it against: the top row's 8px belongs
   to the Live badge, which is a PLATE, so its text actually starts at 8 + 9 = 17px and the left end
   of this band was never in a column with it anyway. Two bare readings, one inset, an exact middle.

   ⚠ GRID, NOT FLEX, AND THE TWO EDGE COLUMNS ARE `minmax(0, 1fr)`. Both halves are load-bearing:
     * `1fr auto 1fr` centres the middle column on the COURT. `space-between` would centre the score
       on whatever space the speed left over, so it would jump sideways every time a serve landed and
       jump back when the reading cleared - and only ONE end is ever occupied, so it would be off
       centre nearly all the time.
     * `minmax(0, 1fr)` (rather than a bare `1fr`, whose floor is min-content) is what makes a
       collision impossible instead of merely unlikely. A three-digit speed reads ~52px at 12px and
       the widest score the band can hold is "196 points" at ~85px, which is ~205px of a ~279px band
       on a 375pt phone - fine, but the guarantee should not rest on that sum. With a zero floor the
       EDGE column is the one that gives, and `.mv-speed`'s `nowrap` + `clip` means it loses its tail
       rather than pushing the score off centre or sliding under it.
   `pointer-events: none` for the same reason `.mv-chrome` has it: this is a full-width box over the
   court and none of it is a control, so the dead space between the readings must not swallow taps. */
.mv-runoff {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 6px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  /* ⚠ BASELINE, NOT CENTRE (owner, 31.07: «скорость подачи надо ниже подвинуть, на уровне с цифрами
     счета посередине»). `center` aligns the two BOXES, and the boxes are different heights - the
     speed is 12px against the score's 15px, both at `line-height: 1` - so their midpoints matched
     while their digits did not, and the smaller reading floated about 1.5px high. Two numbers on one
     row that do not sit on one line read as two rows badly stacked.
     Baseline is what "level with" means for text: the glyphs stand on the same line whatever size
     they are, so the speed can stay deliberately smaller (see `.mv-speed`) without looking lifted. */
  align-items: baseline;
  gap: 8px;
  pointer-events: none;
}

/* Bare rather than plated, like the weather and unlike the Live badge: it is a READING, and the badge
   wears a plate because it is a status. Same size and weight the deleted serve row gave it.
   The explicit `grid-column` is not decoration: the score is dropped entirely before the first point
   lands (`scoreReadout` is '' there) and each speed only exists at its own end, so auto-placement
   would slide whatever survives into column 1 and put a lone reading under the middle of the court. */
.mv-score {
  grid-column: 2;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--text);
}

/* THE SERVE SPEED, AT THE END OF WHOEVER STRUCK IT.
   Smaller than the score on purpose: the score is what the player is following and the speed is the
   colour commentary next to it, so a 15px speed at both ends would give the band three equal
   readings and no subject. 12px also keeps the widest possible reading ("183 km/h" - the model's
   plateau plus a 90 serve plus the jitter band) comfortably inside its column.
   `nowrap` + `clip` so the reading can never wrap into the playing surface above it or spill across
   the score; with the zero-floor column above, clipping is what a too-narrow phone does instead of
   colliding. */
.mv-speed {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.mv-speed.left {
  grid-column: 1;
  text-align: left;
}

.mv-speed.right {
  grid-column: 3;
  text-align: right;
}

/* The unit, muted and a shade smaller: km/h is the same three characters on every serve, so it is
   the label and the number is the reading. `<i>` un-italicised, the same way `.mv-live-dot` uses one
   as a bare decorative box. */
.mv-speed-unit {
  margin-left: 3px;
  font-size: 10px;
  font-style: normal;
  font-weight: 600;
  color: var(--muted);
}

/* Round-4 item 1's ends row, now court chrome inside the panel.
   ⚠ THE SERVING END IS OUTLINED AS WELL AS COLOURED (owner, 31.07: «who's serving is already
   indicated by colour - add an outline on top of that»). The capsule is declared on BOTH ends and
   left transparent on the one that is not serving: the row is `justify-content: space-between`, so a
   border that appeared only on the serving side would change that side's width and both baselines
   every time the serve changed hands, which on a change of ends is every other game. Paying 2px of
   border and 2px of padding on both sides buys a row that never moves.
   The accent is the same one the row already used, and the word "· serving" stays with it: colour and
   an outline are decoration, and the reading has to hold up in a screen reader and in monochrome. */
.ends-labels {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 12px 0;
  font-size: 11px;
  color: var(--muted);
}

.ends-labels > span {
  min-width: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  padding: 1px 8px;
}

.ends-labels .serving {
  border-color: var(--accent);
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

/* --- 3. THE SERVE ROW IS GONE (owner, 31.07) --------------------------------------------------
   `.mv-serving`, `.mv-serve-pill`, `.mv-progress` and `.mv-gamescore` went with the markup that
   used them - the duplicate "Serving: …" pill, and the point score that moved up into the court's
   bottom band as `.mv-score`. The export's §3 row is a deliberate deviation now rather than an
   omission: the export has no ends row above the players (we do, and it says the same thing better,
   attached to an end), and it has a wall clock we cannot honestly tell. Both facts the row carried
   are still on the screen; neither rents a line to say it. */

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

/* A SHOUT ROW. The same grid, the same rail, the same dot position - what a reader has to be able to
   tell at a glance is that this line was SAID rather than played, and two devices do it without any
   new furniture: the `<q>`'s quotation marks (the browser's own, from real markup) and the italic.
   The dot takes the accent at half strength: brighter than a spent beat's `--ink-dim`, quieter than
   the newest beat's glow, so a shout never competes with the point that is actually on screen. */
.mv-beat.said .mv-beat-dot {
  background: var(--accent);
  opacity: 0.5;
}

.mv-beat.said .mv-beat-text {
  font-style: italic;
  color: var(--ink-2);
}

/* The newest row glows whether it is a beat or a shout - it is the same "look here" - so the shout
   only has to opt OUT of the half-strength dot when it is the newest thing in the log. */
.mv-beat.said.latest .mv-beat-dot {
  opacity: 1;
  box-shadow: 0 0 8px var(--accent-glow);
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

/* EVERYTHING BELOW THE COURT, and the reason it is one element: it is the sticky bar's containing
   block. See the template note - a sticky child cannot leave its containing block, so starting this
   box below `.mv-panel` is what makes "the bar never touches the playing surface" true by
   construction instead of true by arithmetic about phone heights. It re-states `.mv`'s own column
   and gap and nothing else, so wrapping the four changed no spacing. */
.mv-below {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* THE PINNED CONTROL BAR (owner, 30.07: «maybe we need to make lower buttons on match screen fixed
   so we could use them anytime?»).
   ⚠ STICKY, NOT FIXED, AND THE MEASUREMENT IS THE ARGUMENT. On a 375pt phone the takeover's scroller
   is 737px; the panel + log + this row + the actions come to ~590px, so at the first point the row
   is already on screen at y=636 and needs no help. Four beats later the log is 220px tall and the
   row has been pushed to y=806 - off the bottom, which is the bug he hit. A FIXED bar would have
   fixed that by taking ~53px off the scroller permanently, for the whole watch, including the
   first point when nothing was wrong; sticky takes NOTHING until the row would otherwise be gone,
   and then puts it exactly where a fixed bar would have been. Same recovery, none of the rent.
   The floor is opaque so the log and the box score pass UNDER the bar rather than through it, and it
   is the tone of whatever the viewer is standing on, so the plate is invisible until it pins.
   ⚠ THAT TONE CHANGED WITH THE OUTER FRAME, 30.07. It was `--panel`, because all three match screens
   used to put the viewer inside a `--panel`-toned `.tf-card`; the owner has now taken that frame off
   («давай внешний контур уберем»), so the ground under the viewer is the takeover's own page colour
   and the floor follows it to `--bg`. Leaving it at `--panel` would have drawn exactly the seam this
   line used to warn about, with the two tones swapped. The same move is why the segmented plates
   below are visible at all now: `--panel` on `--bg` reads as a plate, which is what SegmentedRow's
   default `page` tone is for and what it could not do inside a panel of the same colour.
   The negative margin eats `.mv-below`'s 10px gap and the top padding pays it back, so the plate is
   flush against the log instead of leaving a 10px slot for text to show through; the 8px underneath
   is the only height this costs, and the head row it replaced gave back 34.
   ⚠ IT IS TWO ROWS NOW, because "Shout" joined it (owner, 30.07: «на экране live матча кнопку shout
   тоже надо оставить в sticky блоке»). Three controls do not fit one 327px line - the two segmented
   plates alone want ~275px at this bar's trimmed pill padding and the button is another ~110 - so the
   shout takes a second row inside the SAME sticky block, which is the whole of what he asked for.
   ⚠ AND THAT IS WHY THIS IS A GRID AND NOT A FLEX ROW ANY MORE, which is worth writing down because
   the obvious flex answer is wrong in a way that LOOKS right. `flex-wrap: wrap` plus `flex: 0 0 100%`
   on the button does force a second line - but only while nothing clamps it, and clamping is exactly
   what "own row, own width, centred" needs. `max-width: max-content` feeds into the flex item's
   HYPOTHETICAL main size, so the browser sizes the button at ~109px BEFORE deciding where lines break,
   finds it fits beside two zero-basis plates, and puts all three on one line: measured 327px wide, 59px
   tall, and the two plates squeezed to 109px each. Grid decides rows from the template instead of from
   the items, so `grid-column: 1 / -1` is a row no matter how wide its content is. */
.mv-controls {
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: grid;
  /* Two equal tracks for the two plates. `minmax(0, ...)` rather than a bare `1fr`, so a pill row
     that overflows shrinks its track instead of pushing the grid wider than the bar. */
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: -10px;
  padding: 10px 0 8px;
  background: var(--bg);
}

/* The plates were `flex: 1` when this was a row; the tracks size them now. `min-width: 0` stays -
   it is what lets a plate's own contents shrink rather than overflow. */
.mv-seg {
  min-width: 0;
}

/* THE SHOUT, ON ITS OWN ROW OF THE PINNED BLOCK: full width of the bar as a CELL. `grid-column` is
   what the flex version could not express - see the note on `.mv-controls` for the measurement of the
   attempt that put all three controls on one line.
   ⚠ IT IS THE ROW NOW, NOT THE BUTTON (30.07). `.mv-shout` used to BE the disabled button, centred in
   its cell with `justify-self`; it is the picker plus the verb, so it is a flex row filling the cell
   and the centring is gone with the empty space it used to leave. The grid template above is
   untouched: two tracks for the two segmented plates, and this spans both. */
.mv-shout {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* THE PHRASE PICKER. It wears the app's own `select` skin from src/style.css (declared in the same
   rule as the text input, and this is its first live consumer - see the template note). Two local
   adjustments, both of them about THIS bar rather than about selects:
     * it takes the row's spare width, and `min-width: 0` is what lets it shrink instead of pushing
       the bar wider than the takeover's 327px;
     * `--panel` instead of the skin's `--bg`, because the bar's own floor IS `--bg`. On the floor a
       `--bg` field reads as a hole with a hairline round it, while the two segmented plates beside it
       are `--panel` on `--bg` and read as plates. Same tone, so the second row of the bar looks like
       the first. Precedent: the pill padding below is trimmed for this bar alone in exactly this way,
       and the shared rule stays shared. */
.mv-shout-pick {
  flex: 1;
  min-width: 0;
  background: var(--panel);
  /* Measured at 375pt: the select came out 36px tall beside a 41px button, because the two shapes
     resolve their content height off different metrics (a button's line box, a select's UA control
     height) from the same 8px padding. Stretching is the fix that survives a font change, where
     hard-coding 41px would not. */
  align-self: stretch;
}

.mv-shout-go {
  flex: none;
}

/* ⚠ "Skip" USED TO RENDER AS "Ski", AND THE SPEED PLATE SAT ON TOP OF IT. The two rows want
   ~359px of pill between them at the shared `.tab-pill` padding of 16px a side; inside a .tf-card
   on a 375pt phone they got 293px, so the view row overflowed its half and painted over its
   neighbour. The padding is the only thing here that was negotiable - the labels are already the
   `short` forms - so it is trimmed for THIS bar alone. The sheet's own 16px is untouched, and so is
   every other SegmentedRow (the draw's round tabs have room for theirs).
   ⚠ STILL NEEDED AFTER THE OUTER FRAME CAME OFF (30.07), and it is worth writing the arithmetic down
   rather than re-deriving it next time: the bar is 327px wide now instead of 293, and 327 is still
   short of the 359 the sheet's padding wants. What the extra 34px bought is HEADROOM - the trim
   brings the two rows to ~275px, so they now clear the bar by 52px instead of overflowing it.
   ⚠ AND THAT HEADROOM IS WHAT THE OWNER WAS LOOKING AT, 31.07: «the speed and brevity buttons are
   bunched to the left of their plates - distribute them evenly across the plate, and make it tidy».
   `.tab-row` is a plain flex row and `.tab-pill` is content-sized, so the 52px the trim recovered
   became 26px of empty plate at the RIGHT-HAND END of each of the two rows - the pills sat left, the
   plate ran on past them, and the two rows did not even end in the same place because "Full/Key/Skip"
   and "1x/2x/4x" are different widths. `flex: 1` hands each plate's width to its own three pills, so
   they divide it evenly and both rows end where the plate ends.
   THE PADDING TRIM STAYS, and it is doing a different job now. `flex: 1` is `1 1 0%`, and a flex
   item's automatic minimum size is its CONTENT size - so the padding no longer sets the pill's width
   but still sets the width below which it will not shrink. At the sheet's 16px that floor is the
   ~359px that overflowed in the first place; at 9px it is ~275px, comfortably inside any phone this
   app targets. Trimmed padding is what keeps `flex: 1` from being a lie on a narrow screen.
   SCOPED TO THIS BAR, like the padding above it and for the same reason: `.tab-row`/`.tab-pill` are
   shared vocabulary with five callers, the draw's round tabs deliberately opt their pills OUT of
   flexing (`.bt-tabs :deep(.tab-pill) { flex: 0 0 auto }` - they scroll horizontally), and Stats and
   Money are not this slice's screens to move. */
.mv-controls :deep(.tab-pill) {
  flex: 1;
  padding-left: 9px;
  padding-right: 9px;
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
