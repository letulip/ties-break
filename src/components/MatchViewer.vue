<script setup lang="ts">
// Package F – match viewer UI. Consumes Package D (annotateMatch) and Package E
// (buildTimeline, geometry, drawScene) outputs only; no game math lives here. The
// component owns the rAF clock and walks the (pure, pre-timed) Timeline, deriving
// canvas SceneState + the surrounding score/probability/stats readout from it.
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type { AnnotatedMatch, CourtPoint, ShotResult, Timeline, TimelineEvent, ViewMode } from '../viz/types'
import { useMatchReadout } from '../composables/matchReadout'
import { COURT } from '../viz/types'
import type { MatchPlayer, Side, Surface } from '../engine/match/types'
import { buildTimeline, computeEndsSwaps, type EndsState } from '../viz/timeline'
import { drawScene, type SceneState } from '../viz/courtRenderer'
import type { Viewport } from '../viz/geometry'
import { buildCommentary } from '../viz/commentary'
import { buildPreview, type PreviewEvent } from '../viz/preview'
import { buildClockTrack, clockSecondsAt, formatMatchClock, type ClockTrack } from '../viz/matchClock'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { initSfx, playSfx, primeSfx } from '../audio/sfx'
import { formatShortName } from '../shared/format'
import { pointServeSpeeds, type StruckServe } from '../engine/match/serveSpeed'
import { matchSpeedDefault, matchViewDefault, type MatchSpeed } from '../composables/matchDefaults'
// R2-11 – THE TWO OWNERS THIS FILE NO LONGER IS. `usePlaybackClock` is the ONE clock: the rAF loop,
// the pre-match hold, the visibility gate and `playing`/`finished`. `useMatchAudio` is the ONE cue
// owner: the speed matrix, the intermittent `out` stream and the music duck's refcount. Both take
// the transport's refs and own neither, so there is exactly one owner per fact.
import { usePlaybackClock } from '../composables/playbackClock'
import { useMatchAudio } from '../composables/matchAudio'
// R2-11 – THE TRANSPORT IS A PROP-DRIVEN LEAF. It takes the two settings as values and says what
// the player pressed; this screen keeps the match and stops owning the bar as well.
import MatchControls from './MatchControls.vue'
import Card from './ui/Card.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
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
     *  ⚠ IT IS WIRED, AND THIS PARAGRAPH USED TO SAY IT WAS NOT. It described a missing field, a
     *  second viewer call site and a guard somebody else would have to re-aim; none of the three
     *  was true when the principles review read it, and the review repeated the claim. What exists:
     *    * `PendingView.temperatureC: number` (shared/protocol.ts), filled in `world/snapshot.ts`
     *      from the engine's own `eventTemperature` generator - the one the Season card quotes too.
     *      ⚠ NAMED WITHOUT ITS PARENTHESES ON PURPOSE: tests/screen-i-live-match.test.ts forbids
     *      that name followed by an open bracket anywhere in this FILE, prose included. The guard is
     *      right and stays as strict as it was - the viewer must never derive the day itself, and a
     *      pin that has to tell code from English is not a pin;
     *    * `:temperature-c="pending?.temperatureC ?? null"` at TournamentFlow's ONE viewer call
     *      site. There is exactly one `<MatchViewer` in that file and there has only ever been one;
     *    * `tests/preview.test.ts` re-aimed, not weakened: the match engine and the tournament
     *      still may not name `eventTemperature` at all, world.ts is exempted for one use, and that
     *      use's exact text is asserted so a second cannot hide behind the first.
     *
     *  ⚠ WHY IT RIDES ON THE PENDING VIEW rather than on a preview, which was the true half all
     *  along: `snapshot.upcoming` is filtered to `week > world.week`, so an event being PLAYED has
     *  already dropped out of it and its preview is unreachable from here.
     *
     *  null (default) draws no plate at all, and three of the four callers take it - MatchReplay,
     *  PracticeFlow and the Season sandbox have no tournament day behind the match, so no plate is
     *  the truth there rather than a gap. */
    temperatureC?: number | null
    /** THE PRE-MATCH PREVIEW'S TOURNAMENT CONTEXT (round 16, owner's own ask) - the tier and the
     *  round, which together decide BOTH how much the intro says (the ladder of voices, four
     *  storeys - see viz/preview.ts) and what winning this match is worth in points.
     *
     *  ⚠ null (default) IS A REAL ANSWER, NOT A MISSING ONE, and it is why this is optional rather
     *  than required. Two of the four callers genuinely have no tournament behind the match - the
     *  friendly and the sandbox hit-out - and for them "no draw, nothing on it" is the truth. They
     *  still get an intro; it is the thinnest one, which is exactly the owner's ruling («убирать
     *  совсем я бы всё-таки не стал»). Compare `mode`, which has no default because every caller
     *  has an answer and three of them were getting it wrong by silence. */
    previewEvent?: PreviewEvent | null
    /**
     * THE LABEL OF THE BUTTON THAT LEAVES THIS MATCH - and, by its presence, whether the match
     * ejects the player at all (round 17 #10, the owner's own layout ruling: «мне кажется надо по
     * завершению матча не автоматически выкидывать на результаты, а заменить панель скорости и shout
     * на одну кнопку Proceed или вроде того»).
     *
     * ⚠ WHAT WAS WRONG: `finish` fired the instant playback reached the end, and both flows that
     * listen to it change phase in the same flush - so this component unmounted before it could
     * paint a single frame of its own box score. That is invisible on a routine win and it is a
     * whole bug on a RETIREMENT: round 16 built the "she retired hurt" line into the box score below
     * and the owner has never been able to read it, because the screen carrying it was replaced
     * before it existed. The eject was also the answer to «не выбрасывать из матча».
     *
     * ⚠ null (default) IS A REAL ANSWER, like `previewEvent`'s. Two of the four callers have nowhere
     * to proceed TO - MatchReplay is opened on top of a finished match and closes back to where it
     * came from, and the Season sandbox's friendly ends where it stands, the log's final beat being
     * the result - so a Proceed button there would be a control that does nothing. Those two keep
     * the old behaviour exactly: `finish` fires when playback ends and they ignore it. A caller that
     * names a label gets the button, and `finish` waits for the press.
     *
     * ⚠ AND THE OWNER CORRECTED HOW THIS LANDED, 12.08 - the words the template below cannot hold:
     * «я просил чтобы просто кнопки управления менялись на proceed, сейчас так происходит, но
     * почему-то весь этот блок поднимается, а под ним еще какой-то счет и статистика матча пишется -
     * не надо этого. Можно сделать 2 кнопки рядом просто в этом нижнем блоке с контролами и все:
     * Watch again | Proceed» - and, pressed on the panel that first stayed: «просто вот эта нижняя
     * "борода" под кнопками на экране матча не нужна всё».
     *
     * The ROW is the finished bar: `Watch again ↻` beside the proceed label, on the same two tracks
     * the speed and view plates stand on, so nothing shifts sideways when the match ends. THE PANEL
     * UNDER IT IS GONE with the second ruling. It survived the first one because it carried the only
     * sentence explaining an OPPONENT's retirement (`.mv-hurt` is raised for HER only, by ruling) -
     * that witness now lives in the commentary log's own final beat ("Retired. X cannot go on. Y
     * advances.", viz/commentary.ts), which is on this screen when the match ends and is pinned
     * visible there by tests/component/injury-surfacing.test.ts and match-viewer.test.ts. The stats
     * the panel duplicated are one press away on the flow's own result card, which is the owner's
     * point.
     */
    proceedLabel?: string | null
    /** ⭐ ROUND-21 #2: her coach travelled to this tournament, so he is in the corner at a set break
     *  and the running commentary may say so. The engine's own answer (`PendingView.coachTravelled`,
     *  off `coachTravelsWithHer`) rather than a second derivation - the tournament flow, this log and
     *  the week's story all read the one predicate.
     *
     *  ⚠ false (default) IS A REAL ANSWER, like `previewEvent`'s null. Three of the four callers are
     *  matches nobody was flown to (the friendly, the sandbox hit-out, a replay of a rival's match),
     *  and for them "he was not there" is the truth. It also keeps every existing caller's log
     *  byte-identical, which is what makes this additive. */
    coachTravelled?: boolean
  }>(),
  { rankA: null, rankB: null, finalMatch: false, temperatureC: null, previewEvent: null, proceedLabel: null, coachTravelled: false },
)
// `finish` = "the player is done with this match". ⚠ R17 #10 MOVED WHEN IT FIRES, NOT WHAT IT MEANS:
// with a `proceedLabel` it waits for the Proceed press, and without one it still fires the instant
// playback ends (see the prop). Nothing about the emit's contract changed for a listener.
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
//
// ⚠ SEEDED FROM THE SETTINGS, ONCE, AT MOUNT (owner, 02.08: «Default match speed and text match
// settings setup in settings»). These used to open 'key'/2 for everybody; the openings are the
// More screen's two pickers now (composables/matchDefaults.ts). The pills below still write ONLY
// these refs – a mid-match change lasts the match and never becomes the default, which is the
// one-way contract the composable's header states.
const viewMode = ref<ViewMode>(matchViewDefault())
const speed = ref<MatchSpeed>(matchSpeedDefault())

// ⚠ THE SOUND OWNER IS DECLARED BEFORE THE CLOCK because the clock asks it for one thing – the
// pre-match beat – and never the other way round. `seed` is a getter rather than a value so a new
// `match` prop re-seeds the `out` stream through `resetRun()` without this file holding a copy.
const audio = useMatchAudio({ speed, seed: () => props.match.result.seed })
// ⚠ AND THIS IS THE ONE CLOCK. Nothing else in this file may arm a timer or a frame: `playing` and
// `finished` are ITS refs, `start`/`pause`/`finish`/`resetRun` are the only four doors, and
// ⚠ IT IS `playback`, NOT `clock`: `clock` is already this file's PLAYBACK POSITION in seconds
// (`let clock = 0` below), and the diegetic reading on screen comes off it through viz/matchClock.
// Three different things called a clock is how the second owner gets in.
// tests/component/match-viewer-clock.test.ts counts the owners on a mounted component to keep it so.
const playback = usePlaybackClock({
  speed,
  viewMode,
  onPreRollCue: () => audio.cue('seats'),
  onLoopStart: audio.duckForRun,
  onFrame: (dt) => {
    advance(dt)
    updatePlayers(dt)
    render()
  },
})
const { playing, finished } = playback
/** Index of the last point whose point-end event has fired (-1 = match not started yet). */
const displayedPointIndex = ref(-1)
/**
 * Index of the point whose beat is ON SCREEN right now (-1 = nothing is). Mirrored off
 * `currentEvent` in render(), the same way `liveServer` and `endsSwappedRef` are.
 *
 * ⚠ NOT A DUPLICATE OF `displayedPointIndex`, and the gap between them is a whole bug: in 'key'
 * mode the timeline skips points that were nonetheless PLAYED, so the last point SHOWN is several
 * points behind the one being served. The scoreboard needs the second number to read the score the
 * players are playing for – see `scoredPointIndex` in composables/matchReadout.ts.
 */
const onScreenPointIndex = ref(-1)
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
/**
 * HOW LONG THE MATCH HAS BEEN GOING, IN WHOLE MATCH SECONDS (round 17 #24, owner: show the elapsed
 * time between `live` and the weather, where there is room).
 *
 * ⚠ WHOLE SECONDS, NOT THE FORMATTED STRING, and that is what keeps a per-frame mirror cheap. Like
 * `liveServer` and `endsSwappedRef` it is written on every paint; an integer that only changes when
 * the reading changes means Vue re-renders the span ~8 times a second at x1 rather than sixty.
 *
 * ⚠ AND IT IS A FUNCTION OF THE PLAYBACK POSITION, WHICH IS THE WHOLE OF THE SPEED HALF OF THE ITEM.
 * `clock` advances at `dtReal * speed`, so a reading taken off it advances at x1/x2/x4 without this
 * file, or viz/matchClock.ts, ever reading the speed pills. The clock is DIEGETIC - it measures the
 * match, not the watching - see viz/matchClock.ts for where the minutes come from.
 */
const elapsedMatchSeconds = ref(0)
/** "0:41:07" - the reading the band prints. Fixed width so the row beside it never shifts. */
const elapsedClock = computed(() => formatMatchClock(elapsedMatchSeconds.value))

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
/** Playback position -> match time, rebuilt with the timeline (see viz/matchClock.ts on why the
 *  track is per TIMELINE: 'key' shows less of the match and none of it takes less time). */
let clockTrack: ClockTrack = buildClockTrack(props.match, timeline)
let clock = 0
let cursor = 0
/** Event-START cursor (crowd-reaction pass): index of the next event whose START hook
 *  (reaction cues) hasn't fired yet. Deliberately separate from `cursor` (the event-END /
 *  completion cursor: marks + displayed score). Reset together in resetPlayback. */
let startedCursor = 0
let marks: MarkEntry[] = []
let currentEvent: TimelineEvent | null = timeline.events[0] ?? null
// ⚠ NO rAF ID, NO TIMER HANDLE AND NO `lastTs` HERE ANY MORE – they are `composables/playbackClock.ts`
// (R2-11). This block used to declare the clock's three handles in the middle of the timeline walk's
// own cursors, which is how "who stops playback?" became a question with more than one answer.

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

// ⚠ THE SOUND MATRIX, THE INTERMITTENT `out` STREAM AND THE MUSIC DUCK ARE `composables/matchAudio.ts`
// NOW (R2-11). ~120 lines of cue policy used to sit between the timeline walk and the clock loop, with
// the run's pre-roll flag and the duck's refcount interleaved among them. Every call site below asks
// `audio.cue(site)` and the answer is decided in one place. The owner's rulings behind the matrix -
// R9-24's rate-matching, R10-6's final, round 16 item 12's half-rate `out` at x2 - moved with it,
// verbatim, into that file's header.

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
    audio.cue('matchEnd', { final: props.finalMatch })
    emit('endApplause')
    return
  }
  if (point?.setEnd) {
    // A set decided by a tiebreak (final games score 7-6/6-7) gets the bigger
    // 'oohApplause' cue at ×1; any other set gets the regular short applause (both
    // collapse to 'applauseShort' at ×2 – see the matrix in composables/matchAudio.ts).
    const set = props.match.result.sets[completedSetIndex(ev.pointIndex)]
    const tiebreakSet = !!set && ((set.a === 7 && set.b === 6) || (set.a === 6 && set.b === 7))
    audio.cue(tiebreakSet ? 'setEndTiebreak' : 'setEnd')
    return
  }
  if (point?.gameEnd) {
    audio.cue('gameEnd')
    return
  }

  // Ordinary (non-deciding) point. One exception gets an 'ooh': a long rally (>= 8 shots)
  // ending in a clean winner. (A converted break point always ends its game, so it lands in
  // the game branch above.) Never stacked on top of the 'out' cue of a point ending on a miss.
  const shots = point?.rally.shots ?? []
  const lastShot = shots[shots.length - 1]
  const endedOnMiss = lastShot?.result === 'out' || lastShot?.result === 'net'
  const longWinnerRally = shots.length >= 8 && lastShot?.result === 'winner'
  if (!endedOnMiss && longWinnerRally) audio.cue('ooh')
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
      if (shot.result === 'out' || shot.result === 'net') audio.cue('out')
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
  playback.finish()
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
  // ⚠ THE READOUT MIRRORS COME FIRST, ABOVE THE CANVAS GUARD (04.08). They are not drawing work -
  // they are the reactive facts the TEMPLATE reads, and sitting under `if (!ctx) return` meant that
  // wherever there is no 2D context (happy-dom, so: every mounted test) the panel froze at its mount
  // values while the clock ran. That made the component's most refactor-fragile behaviour - the
  // score walking with the playback - untestable except by hand, which is how it shipped wrong.
  // In a browser `ctx` is never null, so nothing about the shipped behaviour moves.
  const scenePointIndex = currentEvent ? currentEvent.pointIndex : 0
  liveServer.value = props.match.points[scenePointIndex]?.entry.server ?? null
  endsSwappedRef.value = endsState.swappedDuring[scenePointIndex] ?? false
  // ⚠ -1 UNTIL THE WALK HAS ACTUALLY BEGUN (`startedCursor > 0`), not merely until an event is
  // queued. `currentEvent` is already events[0] the moment the timeline is built, and in 'key' mode
  // that first event belongs to point 3 or 4 - so mirroring it eagerly would print the score of a
  // game the player has not been shown one ball of, over a static court, during the take-your-seats
  // hold. Nothing is on screen until something has started; the 04.08 rule that a fresh match opens
  // on 0-0 is exactly this.
  onScreenPointIndex.value = startedCursor > 0 && currentEvent ? currentEvent.pointIndex : -1
  elapsedMatchSeconds.value = Math.floor(clockSecondsAt(clockTrack, clock))

  // 'hit' fires once per shot, exactly when its flight event becomes current (shot start,
  // not flight end).
  // The serve reading rides the same gate: it is a pure function of the event on screen (see
  // serveReadingFor), so recomputing it only when that event changes is both exact and free -
  // once every ~0.4s of playback rather than sixty times a second.
  if (currentEvent !== lastRenderedEvent) {
    if (currentEvent?.kind === 'shot') audio.cue('hit')
    liveServeSpeed.value = serveReadingFor(currentEvent)
    lastRenderedEvent = currentEvent
  }

  if (!ctx) return
  const vp: Viewport = { width: CSS_W, height: CSS_H }
  const scene: SceneState = {
    match: props.match,
    pointIndex: scenePointIndex,
    flight: currentFlight(),
    marks: visibleMarks(),
    surface: props.surface,
    players: playerPos,
    serverSide: liveServer.value,
    // `kidSide`, NOT `heroSide`: the second falls back to side 0 for the momentum curve's point of
    // view, which is right for a chart and wrong for a colour - it would paint a stranger's dot in
    // her accent on every match she is not in. See courtRenderer's SceneState.heroSide.
    heroSide: kidSide.value,
    time: clock,
    endsSwapped: endsSwappedRef.value,
    changingEnds: currentEvent?.kind === 'change-ends',
  }
  drawScene(ctx, vp, scene)
}

// ⚠ THE FRAME LOOP, THE 0.25s CLAMP, THE VISIBILITY GATE AND THE PRE-MATCH HOLD ARE
// `composables/playbackClock.ts` NOW (R2-11). They were ~110 lines here and they are the whole of
// "is the match running": the owner's 31.07 backgrounding ruling, MAX_FRAME_DT's argument for why
// the clamp holds even when no event fires, and R9-24's rate-matched hold all moved with them,
// verbatim. What this file hands the clock is one function - walk the timeline by `dt`, move the
// players, draw - and what it gets back is `playing`, `finished` and four doors.

/** 'skip' mode never walks points – jump straight to the result screen. */
function jumpToEnd(): void {
  playback.pause()
  clock = timeline.duration
  // Skip is silent: no one's watching, so no crowd cues play. Mark every event as already
  // started (without firing its start-hook sound) so a later resume never back-fires them.
  startedCursor = timeline.events.length
  cursor = timeline.events.length
  currentEvent = timeline.events[timeline.events.length - 1] ?? null
  displayedPointIndex.value = props.match.points.length - 1
  // ⚠ THROUGH THE CLOCK, NOT BY WRITING ITS REF. `finished` has exactly one writer; the pause it
  // performs on the way is a no-op here (this function paused on its first line) and the point of
  // routing through it is that a second way to end playback cannot appear by habit.
  playback.finish()
  playerPos = [{ ...PLAYER_HOME[0] }, { ...PLAYER_HOME[1] }]
  render()
}

function resetPlayback(startPlaying: boolean): void {
  // ⚠ ONE CALL FOR THREE LINES THAT WERE ALWAYS ONE MOVE: stop the clock, clear `finished`, and owe
  // the pre-match beat again. They were `pauseInternal()` here, `finished.value = false` twelve lines
  // down and `seatsPlayedForRun = false` four lines after that - three statements of "this is a fresh
  // run", which is exactly how one of them comes to be forgotten.
  playback.resetRun()
  timeline = buildTimeline(props.match, viewMode.value)
  clockTrack = buildClockTrack(props.match, timeline)
  endsState = computeEndsSwaps(props.match.points)
  clock = 0
  cursor = 0
  startedCursor = 0
  marks = []
  displayedPointIndex.value = -1
  currentEvent = timeline.events[0] ?? null
  lastRenderedEvent = null
  // Explicit rather than left to render()'s gate: on an EMPTY timeline `currentEvent` and
  // `lastRenderedEvent` are both null, the gate never fires, and the last run's reading would sit
  // under a court with no match on it.
  liveServeSpeed.value = null
  // The shouts belong to THE RUN, not to the match: a restart, a "Watch again", a mode change or a
  // new match prop all start the watch over, and what was shouted at the last one is not part of
  // this one. (Nothing else has to be undone - a shout changed nothing to undo.)
  shouts.value = []
  // Same rule for the retirement popup (R17 #10): it belongs to the run that reached the end, so a
  // restart takes it down and the next ending raises it again.
  retirementNotice.value = false
  audio.resetRun()
  playerPos = [{ ...PLAYER_HOME[0] }, { ...PLAYER_HOME[1] }]
  if (viewMode.value === 'skip') {
    jumpToEnd()
  } else {
    render()
    if (startPlaying) playback.start()
  }
}

/** First event of `events` belonging to a point AFTER `afterPoint`, or -1 if the timeline has
 *  nothing left to show. The seek target for a mode change – see `retimeForMode`. */
function firstEventAfterPoint(events: TimelineEvent[], afterPoint: number): number {
  for (let i = 0; i < events.length; i++) if (events[i].pointIndex > afterPoint) return i
  return -1
}

/**
 * SWITCHING full <-> key IS NOT A RESTART (owner, 04.08: «при переключении full/key в матче сам матч
 * начинается заново на каждое нажатие, это жутко раздражает»).
 *
 * ⚠ WHY IT RESTARTED: the mode pill's only wiring was `resetPlayback`, which is a FRESH-RUN routine -
 * it zeroes the clock and both cursors because that is what a new match, a "Watch again" and a mount
 * need. The mode change reused it for the one thing it genuinely does need (`buildTimeline` with the
 * new mode), and paid for it with the twelve other lines. Rebuilding the timeline and RESUMING is a
 * different move, and this is it.
 *
 * The seek is by POINT, not by clock time, because the two timelines do not share a time axis at all
 * (the same match is 580s in 'full' and 184s in 'key'): playback resumes at the first event of the
 * new timeline for the point she is watching or anything after it. So key -> full picks the match up
 * at the point currently on court, and full -> key at the next point the new mode thinks is worth
 * showing. `displayedPointIndex` is untouched by design - it is a fact about the MATCH, not about the
 * timeline, so the score, the set cells and the commentary log all carry across the switch unchanged.
 *
 * ⚠ 'skip' IS NOT A POSITION AND SO IT IS NOT PART OF THIS. Going INTO skip means "stop watching,
 * show me the result", and going OUT of it means "actually, let me watch" - and there is nothing to
 * resume from, because skip's position is the end of the match. Both directions therefore keep the
 * old behaviour and go through `resetPlayback`: into skip jumps to the end, out of skip starts the
 * walk from the top. Pinned both ways in tests/component/match-viewer.test.ts.
 *
 * The run's own state (the take-your-seats beat, the shouts, the 'out'-call stream, the music duck)
 * is deliberately NOT reset either: this is the same watch, seen at a different resolution.
 */
function retimeForMode(previousMode: ViewMode): void {
  if (viewMode.value === 'skip' || previousMode === 'skip' || displayedPointIndex.value < 0) {
    resetPlayback(playing.value)
    return
  }
  const wasPlaying = playing.value
  playback.pause()
  timeline = buildTimeline(props.match, viewMode.value)
  clockTrack = buildClockTrack(props.match, timeline)
  // ⚠ THE ANCHOR IS THE POINT ON COURT, NOT THE LAST ONE COMPLETED, and the difference shows on the
  // screen. In 'key' mode the point being played is several points ahead of the last one whose beat
  // finished, so anchoring to `displayedPointIndex` would resume 'full' mode BEFORE the point she is
  // watching - and the counter under the court would visibly step backwards on the click. This is
  // the same "where she is" that the score readout already uses (matchReadout: `scoredPointIndex`).
  const anchor = Math.max(displayedPointIndex.value, onScreenPointIndex.value - 1)
  const resume = firstEventAfterPoint(timeline.events, anchor)
  // Per-run visual state that belongs to the timeline we just threw away: bounce marks were placed
  // at times on the OLD axis, and the players are mid-ease toward a shot that is no longer current.
  marks = []
  playerPos = [{ ...PLAYER_HOME[0] }, { ...PLAYER_HOME[1] }]
  liveServeSpeed.value = null
  lastRenderedEvent = null
  if (resume < 0) {
    // Everything she has not seen is already behind her (she switched mode on the last point, or
    // after the match ended): the honest continuation is the end of the match, not a replay of it.
    clock = timeline.duration
    startedCursor = timeline.events.length
    cursor = timeline.events.length
    currentEvent = timeline.events[timeline.events.length - 1] ?? null
    render()
    finishNow()
    return
  }
  clock = timeline.events[resume].t
  cursor = resume
  startedCursor = resume
  currentEvent = timeline.events[resume]
  render()
  if (wasPlaying) playback.start()
}

function restart(): void {
  initSfx()
  resetPlayback(true)
}

onMounted(() => {
  // ⚠ THE VISIBILITY LISTENER IS THE CLOCK'S OWN MOUNT HOOK NOW (composables/playbackClock.ts), and it
  // still runs FIRST: `usePlaybackClock` is called during setup, above, so its hook is registered
  // before this one and Vue runs them in registration order. Nothing about the ordering moved.
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
  // ⚠ THE LISTENER AND THE PAUSE ARE THE CLOCK'S, and its `onBeforeUnmount` runs BEFORE this one for
  // the same registration-order reason as the mount hook - so the sequence is still: drop the
  // listener, stop the clock, give the music back. What is left here is the music, because the duck
  // is the audio owner's refcount and not the clock's.
  audio.releaseDuck()
})

// Mode change: rebuild the timeline and RESUME where she was, preserving whatever play state was
// active (see retimeForMode – full <-> key continues, anything involving 'skip' resets).
// A new match prop (re-run exhibition) always restarts and autoplays.
watch(viewMode, (_next, previous) => retimeForMode(previous))
watch(
  () => props.match,
  () => resetPlayback(true),
)
// ⚠ THE `finished` WATCHER IS AT THE BOTTOM OF THIS BLOCK NOW, not here beside its two siblings
// (R17 #10). It reads `kidSide`, which arrives with the readout composable below, and what it does
// on the end of playback is the whole of that item - so it lives with the rest of it rather than
// three hundred lines above the state it depends on.

// THE READOUT moved to composables/matchReadout.ts (pure derivation, zero mutable state).
const { playerName, kidSide, heroSide, SIDES, leftSide, rightSide, setCells, courtScore, scoreReadout, serveSpeedEnd, MOM_W, MOM_H, momentum, momentumCaption, panelStats, pct } = useMatchReadout({ props, displayedPointIndex, onScreenPointIndex, finished, liveServeSpeed, endsSwappedRef })

// --- THE COMMENTARY (viz/commentary.ts) --------------------------------------------------------
// Built once per match, revealed in step with the score: a beat appears exactly when the point it
// is anchored to has been played on screen.
//
// ⚠ AND THE VIEW MODE NOW PICKS THE LIST, WHICH IS THE 06.08 ITEM (owner: «сам матч идёт быстрее и
// показывает ключевые моменты, но в тексте трансляции вообще ничего не меняется, надо это
// синхронизировать ... может быть мы можем full/key моменты сделать больше отличий»).
//
// WHAT WAS ACTUALLY WRONG, because "the switch is broken" was the symptom and not the fault: the
// switch was never wired to the text at all. `buildTimeline(match, mode)` is what 'key' reached -
// it drops the points the mode does not show - and this line built ONE list per MATCH and revealed
// it off `displayedPointIndex`. Both modes therefore printed the same rows, in the same order, and
// the only difference a viewer could see was that 'key' revealed them in bursts, several points
// behind the ball. The header said "key moments" and the log went on reading out every one.
//
// ⚠ THE CUT IS NOT MADE HERE. `Beat.keyMoment` is decided inside buildCommentary from the engine's
// own live win probability (viz/commentary.ts, THE KEY CUT) - so this component switches lists and
// holds no opinion about which moments matter. Putting the rule here would have meant a second
// implementation of "what counts", in the one file that must not own that question.
//
// 'skip' takes the FULL list deliberately: it hands over the whole story at once, and somebody who
// skipped the match wants the account of it, not the trailer.
// ⚠ ROUND 21 ITEM 3 - THE FOURTH ARGUMENT IS THE OCCASION, and it is the prop this component was
// already holding for the intro. Owner, 14.08, second ask: «И ещё раз: проверь пожалуйста что с
// комментариями текстовой трансляции на 1000 и шлемах, кажется ничего не изменилось» - measured, and
// nothing had: the builder took three arguments and none of them was the tournament, so a Grand Slam
// final and a J30 first round were the same call and produced the same rows byte for byte.
//
// `previewEvent` carries the tier and the round already (it is what decides the intro's storey), so
// the two builders now read ONE occasion object and cannot disagree about what is being played.
// null - the friendly and the sandbox hit-out - is the bottom storey, which is exactly the log this
// file has always rendered.
// ⚠ ROUND-21 #2 - AND THE FIFTH IS THE COACH, on the same principle. Owner, third ask:
// «Присутствие в потоке и трансляции точно надо (если едет).» The engine has already answered
// whether he came (`PendingView.coachTravelled` off `coachTravelsWithHer`), so this passes the
// answer rather than re-deriving it; `kidSide` is which chair is HERS, and null there means she is
// not in this match at all - a rival replay - where nobody's coach is the family's.
// ⚠ ONE LINE ON PURPOSE. tests/screen-i-live-match.test.ts pins the head of this call as a literal
// string, and that pin is the guard keeping the player's own picker out of the deterministic
// narrator. Breaking the arguments across lines would defeat a real check for a formatting taste.
// (And this note may not spell the pinned literal out: the guard's negative arm reads the whole file
// and would find its own name quoted here. It caught exactly that on the first draft.)
const commentary = computed(() =>
  buildCommentary(props.match, props.playerA.name, props.playerB.name, props.previewEvent, props.coachTravelled && kidSide.value !== null ? { side: kidSide.value } : null),
)
const modeCommentary = computed(() =>
  viewMode.value === 'key' ? commentary.value.filter((b) => b.keyMoment) : commentary.value,
)

/** Newest first, the way the export stacks the log. */
const visibleBeats = computed(() =>
  modeCommentary.value.filter((b) => b.pointIndex <= displayedPointIndex.value).slice().reverse(),
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

// --- THE PRE-MATCH PREVIEW (viz/preview.ts) ----------------------------------------------------
// Owner, 11.08: «комментаторы дают какую-то короткую информацию об участниках, их шансе на победу
// или на продвижение в таблице». A commentator's intro, and the cheapest good thing on the round-16
// list: every fact it needs already exists and none of it is new state.
//
// ⚠ IT IS NOT PART OF THE COMMENTARY AND MUST NOT BE. `buildCommentary` is a pure function of the
// MATCH with a determinism pin on it; a preview is a function of the DRAW - the tier, the round, the
// two ranks, the day's temperature - none of which the match carries and none of which a replay of
// the match could reproduce. So it is a second pure builder with its own inputs, and the two meet
// where the shout already meets them: in `visibleRows`, at render time.
//
// ⚠ HOW MUCH IT SAYS IS THE LADDER, not a setting. See viz/preview.ts - four storeys, monotone, and
// a friendly with no tournament behind it still gets the thinnest one rather than nothing.
const previewRows = computed<LogRow[]>(() =>
  buildPreview({
    a: props.playerA,
    b: props.playerB,
    heroSide: heroSide.value,
    surface: props.surface,
    tour: JUNIOR_TOUR,
    heroRank: heroSide.value === 0 ? props.rankA : props.rankB,
    oppRank: heroSide.value === 0 ? props.rankB : props.rankA,
    event: props.previewEvent,
    temperatureC: props.temperatureC,
  }).map((line) => ({ key: `p-${line.key}`, kind: 'intro', rail: '', lead: null, text: line.text, score: '' })),
)

/** A row of the log: a commentary beat, or something the parent shouted. ONE flat shape rather than
 *  a discriminated union, because the template has to read `lead`/`score` off it and a union would
 *  need narrowing inside the markup to type-check. A shout carries no lead and no score. */
interface LogRow {
  key: string
  kind: 'beat' | 'shout' | 'intro'
  /** the left-rail label ("S2"), or '' for a row that belongs to no set - see `previewRows` */
  rail: string
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
    row: { key: `b${b.pointIndex}`, kind: 'beat', rail: `S${b.set}`, lead: b.lead, text: b.text, score: b.score },
  }))
  for (const s of shouts.value) {
    merged.push({
      pointIndex: s.pointIndex,
      order: s.n,
      row: { key: `s${s.n}`, kind: 'shout', rail: `S${s.set}`, lead: null, text: s.text, score: '' },
    })
  }
  merged.sort((x, y) => y.pointIndex - x.pointIndex || y.order - x.order)
  // ⚠ THE PREVIEW SITS UNDER EVERYTHING, and that is chronology rather than layout. The log reads
  // NEWEST FIRST, so the oldest thing in it belongs at the bottom - and the intro is older than the
  // first ball. It is appended here rather than merged above because it has no point index at all:
  // it is not anchored to the match, it is what was said before the match. See `previewRows`.
  return [...merged.map((m) => m.row), ...previewRows.value]
})

// ⚠ THE FOUR-ROW WINDOW AND ITS "Show more" ARE GONE, AND THE PINNED BLOCK IS WHY (owner, 06.08:
// «давай вообще этот блок full/key/speed/shout кнопок внизу экрана в матче закрепим просто, а
// текстовая трансляция будет до него "разворачиваться"»). The window existed because the log was a
// box of its own height in a page that scrolled past it: four rows is what the export drew, and
// anything more pushed the controls off the bottom - the very bug the sticky bar was added for.
// The log is now the part of the column that GIVES (`.mv-log` is the only flexible row), so it is
// exactly as tall as the space between the court and the pinned block and scrolls inside itself.
// A fixed window inside a box that is already the size of the space would be a second, smaller
// clamp on the same content, and the newest beat is at the top either way - so there is nothing a
// "Show more" could still reveal that scrolling does not.

// ⚠ THE TRANSPORT'S OWN SCRIPT IS `MatchControls.vue` NOW (R2-11): the two SegmentedRow adapters,
// the option tables and the skip link, with the owner's rulings behind each of them. They read
// `viewMode` and `speed` as VALUES and write back through `update:` events, so the two refs still
// live here - one owner per fact - and the bar knows nothing about a timeline.

/** Leave the match, at the player's own moment. `finish` is the same event the parent always
 *  listened to - only the instant it fires has moved. The sound is the bar's, as it always was. */
function proceed(): void {
  emit('finish')
}

// ⚠ THE BOX SCORE'S OWN BINDINGS (finalAcesDfs, winnerName, servePct) WENT WITH ITS CARD - the
// owner, 12.08: the panel under the finished controls duplicated the flow's result card. What
// remains here is what the retirement POPUP still reads: the scoreline, and who stopped.
const finalScoreLine = computed(() => props.match.result.sets.map((s) => `${s.a}-${s.b}`).join('  '))
/**
 * R16 #18 – WHO STOPPED, IF ANYBODY DID. `result.retired` has been on the match since the
 * retirement slice, and the owner's original report was a retirement going by as a bare scoreline
 * ("wins 4-5" – a winner with fewer games than the loser, no explanation). The fact is told twice
 * now: the commentary log's final beat says it to everyone ("Retired. X cannot go on...",
 * viz/commentary.ts), and when the one who stopped is HERS this name headlines the `.mv-hurt`
 * popup below.
 */
const retiredName = computed(() => {
  const r = props.match.result.retired
  return r ? playerName(r.side) : null
})

// --- R17 #10: THE MATCH ENDS WHERE THE PLAYER IS, AND SHE IS TOLD WHY IT ENDED ------------------
//
// «Если травма случилась внутри матча надо сразу попап показать и не выбрасывать из матча. Вообще
// мне кажется надо по завершению матча не автоматически выкидывать на результаты, а заменить панель
// скорости и shout на одну кнопку Proceed или вроде того.»
//
// Two halves of one mechanism, because they were one mechanism when they were broken: playback
// reaching its end used to emit `finish` at once, the caller changed phase in the same flush, and
// the screen went away. That is the eject, and it is also why the popup could not be shown - there
// was no screen left to show it on.

/** SHE IS THE ONE WHO STOPPED. `kidSide` is null in a match she is not in (the spectate walk), and
 *  the opponent retiring is not an injury to this family - so both halves have to be true. */
const retiredIsHers = computed(
  () => kidSide.value !== null && props.match.result.retired?.side === kidSide.value,
)
/** Is the in-match retirement popup up? Belongs to THE RUN, like the shouts: a restart or a
 *  "Watch again" is a fresh watch and it is raised again there. Dismissing it leaves her on the
 *  match, which is the whole point of the item. */
const retirementNotice = ref(false)

/**
 * WHY, AS FAR AS THE MODEL KNOWS - and it knows exactly this much. `retireHazard` is
 * `RETIRE_K * spentness(pointNumber, stamina)` and `spentness` is EXACTLY ZERO up to
 * `FATIGUE_START` (120 points), so every retirement this engine can produce happened deep into a
 * long match to a girl who was not fresh. The sentence is the same one round 16 put in the
 * commentary beat (docs/specs/round16-commentary.md §2), deliberately: two surfaces saying one fact
 * must say it the same way.
 */
const RETIREMENT_REASON = 'A long match on tired legs.'

function dismissRetirementNotice(): void {
  retirementNotice.value = false
  playSfx('clickSoft')
}

/**
 * PLAYBACK HAS ENDED. Two things happen here and only one of them is new.
 *
 * ⚠ A CALLER THAT NAMED A `proceedLabel` IS NOT EJECTED - the emit waits for the press. A caller
 * with nowhere to proceed to keeps the immediate emit it always had (see the prop).
 *
 * ⚠ AND IF SHE IS THE ONE WHO STOPPED, THE POPUP IS OWED HERE, on the beat the eject used to happen
 * on. It is raised on a SKIP too (`jumpToEnd` sets `finished` like any other ending), which is
 * round 16 #19's rule restated: the report is a consequence of what happened, not of a screen having
 * been watched. The App-level `InjuryStopDialog` still lands afterwards and is not a duplicate of
 * this one - it reports the LAYOFF, which does not exist until the tournament is closed.
 */
watch(finished, (isFinished) => {
  if (isFinished) {
    if (retiredIsHers.value) retirementNotice.value = true
    if (props.proceedLabel === null) emit('finish')
    audio.releaseDuck()
  }
})
</script>

<template>
  <div class="mv">
    <!-- ===== THE MATCH PANEL (design I, the match panel: court, players, serve, stats) =========
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
          <!-- ⚠ THE ELAPSED MATCH TIME, BETWEEN THE BADGE AND THE WEATHER (owner, R17 #24) - the
               third piece of furniture in a band that had room for exactly one more. It is a
               DIEGETIC clock: it measures the match, so a two-setter reads about an hour and twenty
               and a x4 watch runs it four times as fast as a x1 one. Neither this markup nor
               viz/matchClock.ts reads the speed pills - both facts fall out of the reading being a
               function of the playback position. See `elapsedMatchSeconds`.
               It survives the end of the match on purpose: once the badge goes, the reading is how
               long the thing the player just watched actually took. -->
          <span class="mv-clock num" :aria-label="`Elapsed match time ${elapsedClock}`">{{ elapsedClock }}</span>
          <!-- The export puts this bottom-right ON the court as a two-line chip; the owner asked for
               one line and off the surface, so it is a single row up here. Same plate the Season
               card draws, so the same fact looks like the same fact. -->
          <WeatherPlate v-if="temperatureC != null" class="mv-weather" :temperature-c="temperatureC" :size="13" />
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
          <!-- THE POINT SCORE, ONE NUMBER PER END (owner, 04.08). Her number carries the accent,
               and the pair swaps with the players on a change of ends - see `courtScore`. Split
               into three spans rather than one string so exactly one digit can be coloured. -->
          <span v-if="courtScore" class="mv-score num">
            <i class="mv-score-tb" v-if="courtScore.tiebreak">TB</i>
            <i class="mv-score-pt" :class="{ hers: courtScore.hersAt === 'left' }">{{ courtScore.left }}</i>
            <i class="mv-score-sep">-</i>
            <i class="mv-score-pt" :class="{ hers: courtScore.hersAt === 'right' }">{{ courtScore.right }}</i>
          </span>
          <span v-else-if="scoreReadout" class="mv-score num">{{ scoreReadout }}</span>
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
           panel's hairline rhythm is unchanged. "Final" went too: the log's own last beat says it in
           words ("Match. X takes it in straight sets."), and the Live badge disappearing plus the
           control bar swapping to Watch again | Proceed say it again. -->

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
      <!-- ===== THE COMMENTARY (design I, the point log) =========================================
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
           why the two lists only ever meet at the render.
           ⚠ AND IT OPENS WITH THE PRE-MATCH PREVIEW, AT THE BOTTOM (round 16, owner's own ask). The
           log is newest-first, so the oldest thing in it is its last row - and the commentator's
           intro is older than the first ball. Before a point is played the preview IS the log, which
           is why the "Warming up" empty state below is now only ever reached if a caller has no
           players at all. An intro row has no set label and no score, and its dot is hollow: it is
           on the rail because it is part of the same story, and it is not a moment IN the match.
           How much it says is the ladder of voices - see viz/preview.ts. -->
      <Card variant="photo" class="mv-log" pad="8px 12px 10px">
        <p v-if="!visibleRows.length" class="mv-log-empty">Warming up. The first ball is on its way.</p>
        <ol v-else class="mv-log-list">
          <li
            v-for="(row, i) in visibleRows"
            :key="row.key"
            class="mv-beat"
            :class="{
              latest: i === 0 && row.kind !== 'intro',
              said: row.kind === 'shout',
              intro: row.kind === 'intro',
            }"
          >
            <span class="mv-beat-set">{{ row.rail }}</span>
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
      </Card>

      <!-- ===== CONTROLS – A PROP-DRIVEN LEAF SINCE R2-11 =====================================
           The bar itself, its two plates, the shout row, the skip link and the finished swap are
           `MatchControls.vue`, with every one of the owner's rulings about them carried across
           verbatim. What crosses the boundary is four values and six events, and none of them
           mentions a timeline: the screen drives the match, the bar asks the player about it.
           ⚠ `SHOUT_PHRASES` STAYS HERE, and that is the seam rather than an oversight. The pool is
           COPY - the family's voice, argued at length on the script side - and the log it lands in
           is this screen's. The bar shows the phrases and says which one was shouted. -->
      <MatchControls
        v-model:view="viewMode"
        v-model:speed="speed"
        v-model:shout-phrase="shoutPhrase"
        :finished="finished"
        :live="props.mode === 'live'"
        :phrases="SHOUT_PHRASES"
        :proceed-label="props.proceedLabel"
        @shout="shoutIt"
        @restart="restart"
        @proceed="proceed"
      />
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
           has. MatchReplay is the caller that genuinely needs it: it has no screen after the match.
           ⚠ AND `!props.proceedLabel` IS THE R17 #10 HALF OF THE SAME ARGUMENT. The unmount-in-the-
           same-flush that used to hide this button is gone - a caller with a Proceed keeps the viewer
           on screen after the last point - so on a re-watch it WOULD now sit beside Proceed, which is
           the exact duplication the paragraph above is about. A caller that owns "what happens next"
           owns the re-watch too, and both flows' own box scores already offer one. -->
      <div v-if="props.mode === 'replay' && finished && !props.proceedLabel" class="mv-actions">
        <!-- U0's PrimaryPill: `solid` IS `.primary`, so the class stays and the sound layer's
             `.sfx-watch` hook keeps working - what arrives is the one door for the affirmative. -->
        <PrimaryPill class="sfx-watch" @click="restart">Watch again ↻</PrimaryPill>
      </div>

      <!-- ===== WHERE THE BOX SCORE WENT (owner, 12.08) ========================================
           The card that stood here duplicated the flow's own result card and lifted the sticky bar
           off the floor; the owner asked for it to go, twice - his words are with the `proceedLabel`
           prop on the script side, because THIS IS A TEMPLATE and no Cyrillic may appear in one,
           comments included (tests/template-copy-rules.test.ts). The one line of it that was not a
           duplicate - the only sentence explaining an OPPONENT's retirement, since `.mv-hurt` is
           raised for HER only - lives in the commentary log's final beat now ("Retired. X cannot
           go on. Y advances.", viz/commentary.ts), on this same screen, at the top of the log the
           moment the match ends. That beat is pinned VISIBLE at end-of-match by
           tests/component/injury-surfacing.test.ts and tests/component/match-viewer.test.ts; do not
           bring the card back to say it a second time. -->
    </div>

    <!-- ===== SHE COULD NOT CONTINUE (R17 #10) ==================================================
         ⚠ IT IS A POPUP OVER THE MATCH, NOT A DOOR OUT OF IT. That is the item in one sentence, and
         the owner's own is on the script side at the `proceedLabel` prop. Dismissing it puts her back
         on the match screen with the log under it, and she leaves when she presses Proceed.
         ⚠ AND IT SAYS ONLY WHAT THE MODEL KNOWS. The layoff - how many weeks, what it withdrew,
         what came back - does not exist yet: a tournament retirement opens it in `finalizeTournament`,
         which runs when the reveal is CLOSED, long after this screen. That report is
         `InjuryStopDialog`'s and still arrives. This one is the moment, and the moment is all it
         claims: she stopped, at this score, and the model's own reason for it.
         The app's shared dialog vocabulary (`.dialog-overlay` / `.dialog-card`), not a seventh
         popup shape - see ConfirmDialog for the same three classes. -->
    <div v-if="retirementNotice" class="dialog-overlay" @click.self="dismissRetirementNotice">
      <div class="dialog-card mv-hurt" role="alertdialog" aria-labelledby="mv-hurt-title">
        <p id="mv-hurt-title" class="mv-hurt-title">{{ retiredName }} could not continue.</p>
        <p class="dialog-message">
          She retired hurt at <span class="num">{{ finalScoreLine }}</span
          >. {{ RETIREMENT_REASON }}
        </p>
        <div class="dialog-actions">
          <button class="primary" @click="dismissRetirementNotice">Stay with her</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Screen I's own styles. They live here rather than in src/style.css because the sheet is shared
   vocabulary and this is one screen's business (docs/specs/ui-components.md, and U0's precedent on
   Home and Season). Nothing shared is re-declared: `.pill`, `.link`, `.num`, `table` and `.primary`
   all still come from the sheet. */

/* ⚠ THE VIEWER FILLS THE TAKEOVER, WHICH IS WHAT PUTS THE CONTROL BLOCK ON THE FLOOR OF THE SCREEN
   (owner, 06.08: «давай вообще этот блок full/key/speed/shout кнопок внизу экрана в матче закрепим
   просто, а текстовая трансляция будет до него "разворачиваться"»).
   ⚠ THE BAR WAS ALREADY STICKY AND THAT WAS NOT THE ASK. Sticky only bites when the bar would
   otherwise be BELOW the fold; on a tall phone it never is, so the block sat wherever the log's last
   row left it with dead page under it - measured at 576x1280 (his screen): the block ended at
   y=1110 and 170px of empty scroller ran on beneath it. Sticky cannot fix that, because there is
   nothing to stick to: the column is shorter than the scrollport.
   THE FIX IS THE COLUMN, NOT THE BAR. `.mv` grows to fill `.tf-body` (a column flex container - see
   src/style.css), `.mv-below` takes what is left under the court, and `.mv-log` is the ONE flexible
   row in the whole stack. So the log is exactly the space between the court and the block, and the
   block lands on the bottom edge whatever the screen height is. `flex: 1` degrades to nothing in a
   container that is not a flex column, and everything below still overflows and scrolls the moment
   the column outgrows the port - which is the case the sticky bar is still there for, and it stays. */
.mv {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  /* ...and `min-height: 0` is what lets the flexible row actually give: without it a flex item's
     automatic minimum size is its content, so a long log would push the block back off the bottom
     instead of scrolling inside itself. */
  min-height: 0;
}

/* Everything except the log is fixed furniture. Stated rather than left to the defaults, because
   `flex: 0 1 auto` lets a box SHRINK, and in a deficit the court and the controls would give up
   height alongside the log they are meant to be framing.
   ⚠ `.mv-controls` LEFT THIS LIST WITH ITS MARKUP (R2-11) and says `flex: none` in MatchControls.vue
   instead. A parent's scoped selector does still reach a child component's ROOT, so keeping it here
   would have worked - by an accident of Vue's scope inheritance, and only until the bar grew a
   wrapper. The clause is where its element is now; the rule it states is unchanged. */
.mv-panel,
.mv-actions {
  flex: none;
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
/* ⚠ THREE GRID COLUMNS, NOT A FLEX ROW WITH AUTO MARGINS (owner, 12.08: «на match replay часы тоже
   должны остаться посередине экрана, а они сейчас уезжают налево»).
   THE CAUSE, and it was a property of the layout rather than of the replay. This was
   `justify-content: flex-end` with `margin-right: auto` on BOTH the badge and the clock: two auto
   margins split the free space evenly, so the clock landed in the middle only for as long as there
   were two of them. `replay` mode drops the Live badge on purpose (ui-inventory §2), and so does the
   end of a live match - and with one auto margin left the clock does not stay put, it takes the left
   end. Measured at 375pt: centred at x=173.5 with the badge, x=25 without it.
   ⚠ THE APP HAD ALREADY SOLVED THIS ONE BAND LOWER. `.mv-runoff` is `minmax(0,1fr) auto minmax(0,1fr)`
   for exactly this reason, in its own words: the score has to be centred on the COURT and not on
   whatever is left after the speed, and only one end is ever occupied. The top band has the same
   shape - two ends that come and go, one reading in the middle - so it gets the same answer instead
   of a second one. A column holds its position whether or not anything is in it.
   ⚠ AND `left` BECOMES 10px, MATCHING `.mv-runoff`. It was 8 against a right of 10, which put the
   row's centre 1px off the canvas centre - invisible while the clock was floated by margins, and a
   1px lie the moment the middle column IS the centre. The two bands now inset by the same number, so
   the clock, the score below it and the changeover plaque all stand on one axis. */
.mv-chrome {
  position: absolute;
  top: 6px;
  left: 10px;
  right: 10px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

/* The export's Live badge. It sits in the top RUN-OFF band, never on the playing surface (owner,
   29.07). At the shipped canvas that band is ~34px on a 375pt phone and this badge is ~19px tall
   at `top: 6px`, so it clears the surface by ~9px with room for a bigger phone to only add more.
   Kept smaller than the export's pill for exactly that reason: the constraint is the band.
   ⚠ `margin-right: auto` USED TO BE WHAT HELD THE LEFT END and it is the grid's job now - see
   `.mv-chrome`. The badge owns the first column and starts in it; when it is not drawn the column
   stays, which is the whole point of the change. */
.mv-live {
  grid-column: 1;
  justify-self: start;
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

/* THE ELAPSED MATCH TIME (R17 #24), between the badge and the weather.
   ⚠ THE MIDDLE COLUMN, WHICH IS WHY IT STAYS PUT (owner, 12.08). It used to hold its place with a
   second `margin-right: auto` against `.mv-live`'s - and that only works while there ARE two of
   them, so the reading slid to the left end on every replay and at the end of every live match. The
   note that used to be here called that "surviving the badge disappearing"; the owner calls it
   «уезжают налево», and he is looking at the same screen. See `.mv-chrome` for the grid.
   Bare rather than plated, like the weather and unlike the badge: it is a READING, not a status.
   `--muted` because it is the quietest of the three - the badge is a state and the temperature is
   the day, and neither of those should have to compete with a clock.
   ⚠ AND THE FIGURES ARE TABULAR HERE, BECAUSE `.num` DOES NOT DO IT (owner, 12.08: «цифры времени
   над кортом можно моноширинными сделать, чтобы не скакала надпись»). This rule's own note used to
   say "Tabular figures (`.num`)" and that was wrong: `num` is written on 77 readouts across the
   components and the ONLY rule in the sheet keyed on it is `td.num` - inside a table it means
   tabular figures, and everywhere else it is a marker with nothing behind it. Measured in Chromium on
   the shipped build, `.mv-clock` computed `font-variant-numeric: normal`, so every proportional digit
   that ticked past moved the whole reading. `h:mm:ss` is fixed-width BY DESIGN (see
   docs/specs/round17-match-screen.md §2), which is what makes this the whole of the fix: with equal
   advances the string cannot change width at all, and the clock stops walking under the court.
   ⚠ NOT FIXED BY GIVING `.num` THE DECLARATION, deliberately: 77 readouts is not this wave's blast
   radius, and several of them sit on lines already measured to the pixel (the tournament header's own
   budget is 254.6px against 283.8). That is a sweep with its own before/after, not a bug fix. */
.mv-clock {
  grid-column: 2;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}

/* ⚠ AND `.mv-weather` IS BACK, WITH A RULE BEHIND IT THIS TIME. It was dropped on 30.07 because a
   class with no rule is the next thing somebody re-adds a rule to - correct then, when the row was a
   flex line and the plate simply ended it. The row is a three-column grid now (see `.mv-chrome`) and
   a grid needs to be told which column each end holds, or the plate falls into column 1 the moment
   the Live badge is not drawn - which is the same bug this change exists to fix, one seat over. */
.mv-weather {
  grid-column: 3;
  justify-self: end;
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
       collision impossible instead of merely unlikely. ⚠ RE-MEASURED 14.08, `tools/runoff-probe.mjs`,
       because the finished reading gained a word that day ("196 points" -> "196 points played", so
       that a match statistic stops reading as a ranking award): at the app's real content width the
       band is 323px and at the narrow bound this note was originally taken at, 279px. The widest
       reading the band can ever hold - a 400-point match, well past anything best-of-three can
       produce - is 135px, centred, and clears a live serve-speed reading at either end at both
       widths. Comfortable, but the guarantee should not rest on that sum. With a zero floor the
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
   would slide whatever survives into column 1 and put a lone reading under the middle of the court.
   ⚠ AND THE ROW IS PINNED TOO, WHICH IS THE OTHER HALF OF THE SAME BUG (owner, 31.07: «правая цифра
   всё ещё выше возле самого корта»). Naming the column alone is not enough, because auto-placement
   is SPARSE: it never walks the cursor backwards. The markup is speed-then-score, so when the speed
   takes column 3 the cursor is already past column 2 and the score CANNOT be placed on row 1 - it
   opens a second row and the band silently becomes two lines tall. Measured, on this exact markup:
   left-end serve → band 15px, speed and score on one baseline; right-end serve → band 35px, the
   speed 22.5px above the score AND back on the playing surface, which the 29.07 rule forbids. The
   left end was fine only because column 1 leaves the cursor short of column 2. `grid-row: 1` on both
   readings says the band is one line whatever survives and in whatever order it is written. */
.mv-score {
  grid-column: 2;
  grid-row: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  color: var(--text);
}

/* THE POINT PAIR (owner, 04.08). The digits are `font-style: normal` because they live in <i> –
   the tag is here to give each number its own box for the accent, not to italicise a score.
   Tabular figures so 0-0 and 40-40 occupy the same width and the pair does not jitter under the
   court as points land. */
.mv-score-pt,
.mv-score-sep,
.mv-score-tb {
  font-style: normal;
  font-variant-numeric: tabular-nums;
}
/* HER NUMBER, IN THE SAME LIME EVERY OTHER "this one is yours" ON THE SCREEN USES – the player
   name above it and the stat pairs below both take `--accent` for exactly this job, so the eye
   learns one colour and reads it everywhere. */
.mv-score-pt.hers {
  color: var(--accent);
}
.mv-score-sep {
  margin: 0 2px;
  opacity: 0.55;
}
/* The tiebreak marker keeps its old prefix shape ("TB 5-3") but stops being part of the number, so
   it cannot inherit the accent when hers is the left digit. */
.mv-score-tb {
  margin-right: 5px;
  font-size: 11px;
  letter-spacing: var(--label-track);
  opacity: 0.7;
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
  /* `grid-row: 1` here for the same reason `.mv-score` carries it - see the note there. Declared on
     the shared class rather than on each end so the two ends cannot drift apart again. */
  grid-row: 1;
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
/* ⚠ ROUND 16 ITEM 14 (owner, 11.08: align the commentary bullets with the rail, nudge them left).
   The rail and the dots were positioned by two unrelated mechanisms that happened to nearly agree:
   the rail is absolutely placed at a hand-written offset, the dots are centred in the grid's second
   column. MEASURED on the shipped rule - column 1 is 22px, the gap is 8px, so column 2 opens at
   30px and a 9px dot centred in a 12px column sits at 36px, while the 1.5px rail at left:33px has
   its centre at 33.75px. Two and a quarter pixels, which on a 9px dot is exactly the "the line
   comes out of the side of the circle" the owner is looking at.

   ONE NUMBER OWNS BOTH NOW. `--mv-rail-x` is the rail's CENTRE LINE, the rail is drawn half its
   width either side of it, and the dot's left edge is placed half a dot to the left of it. Neither
   can drift from the other again, and moving the column is one edit. */
.mv-log-list {
  --mv-rail-x: 33.75px;
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
  left: calc(var(--mv-rail-x) - 0.75px);
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
  /* Placed off the rail rather than centred in its column - see `--mv-rail-x`. `start` puts the
     dot's left edge at the column's own start (22px label + 8px gap = 30px), and the margin walks
     it back to half a dot left of the rail's centre line. */
  justify-self: start;
  align-self: center;
  width: 9px;
  height: 9px;
  margin-left: calc(var(--mv-rail-x) - 34.5px);
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

/* AN INTRO ROW (the pre-match preview). Same grid, same rail, same dot position - it is part of the
   same story and reads down the same column. What tells it apart is that the dot is HOLLOW: the
   filled dots are moments in the match and this is not one, it is what was said before there was a
   match to have moments in. It never takes `.latest`, because before the first ball nothing has
   just happened (see the template's `:class`). */
.mv-beat.intro .mv-beat-dot {
  background: transparent;
  border: 1.5px solid var(--ink-dim);
}

.mv-beat.intro .mv-beat-text {
  color: var(--muted);
}

.mv-log-empty {
  margin: 6px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--muted);
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
  flex: 1;
  min-height: 0;
}

/* THE LOG IS THE PART THAT GIVES - see the note on `.mv`. It takes every pixel between the court and
   the pinned block and scrolls inside itself past that, which is the "разворачивается до него" half
   of the 06.08 ask. The floor is two rows plus the card's own inset: below that the box stops being
   a log and starts being a hint, and a phone in landscape would otherwise squeeze it to nothing.
   `overflow-y` beats the `overflow: hidden` a photo Card carries for its art - this one has none. */
.mv-log {
  flex: 1 1 auto;
  min-height: 92px;
  overflow-y: auto;
}

.mv-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

/* --- R17 #10: THE "SHE COULD NOT CONTINUE" POPUP ----------------------------------------------
   The shared dialog box (`.dialog-card` in src/style.css) plus a title line, and nothing else is
   redeclared here. The title keeps the 15px/700 accent headline the finished box score used to set
   (the card went with the owner's 12.08 ruling; this popup was its twin and keeps the voice). */
.mv-hurt-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
}

.mv-hurt .num {
  color: var(--text);
}
</style>
