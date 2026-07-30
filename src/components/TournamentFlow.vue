<script setup lang="ts">
// feat/tournament-experience – the foreground tournament. A full-screen overlay (like onboarding),
// auto-shown whenever the snapshot carries a `pending` reveal. The player walks the kid's bracket
// round by round: a VS pre-match card (watch or skip), a post-match box score, a between-rounds
// path strip, and a champion/eliminated finale. The result is already committed by the engine –
// this is presentation (Q&A 12), never a re-decision.
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { useKidEmotion } from '../composables/kidEmotion'
import { finaleUrl } from '../art/preload'
import { facePoint } from '../art/faceRects'
import { venueArtUrl } from '../art/venues'
import MatchViewer from './MatchViewer.vue'
import SurfaceMark from './ui/SurfaceMark.vue'
import MatchScene from './MatchScene.vue'
import BracketTabs from './BracketTabs.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import Card from './ui/Card.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import ProgressRing from './ui/ProgressRing.vue'
import { playSfx, primeSfx } from '../audio/sfx'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { computeMatchStats } from '../engine/match/matchStats'
import { surfaceStyleHint } from '../engine/match/style'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { TIERS } from '../engine/season/calendar'
import { KID_ID, flipScore } from '../engine/world'
import { formatShortName } from '../shared/format'
import { weekRange } from '../shared/dates'
import type { AvatarEmotion } from '../shared/avatarEmotion'
import type { MatchOptions, Side } from '../engine/match/types'
import type { WorldMatch } from '../shared/protocol'

// R9-9a: the splash's "← Back" returns to the shell WITHOUT resolving anything – App.vue
// hides the overlay and offers a Resume affordance while the week stays paused.
defineEmits<{ back: [] }>()

const game = useGameStore()
// R9-16: the splash/finale paintings follow her age stage (young at the 14-year-old start,
// teen from 17) via the shared resolver. Round 5 item 11 still stands: no dedicated runner-up art
// (a programmatic gold->silver desaturation came out patchy), so the silver finale reuses the
// "serious" (focused, composed) painting + a silver-styled card frame.
//
// build/webp-only: the url comes from art/preload.ts instead of being spelled out here. This
// component used to hand-build a `-fs8` name that the preloader also hand-built, and the two
// spellings could disagree with what actually shipped – which is how the adult champion splash
// 404'd. One builder, checked against the files on disk by tests/art/preload.test.ts.
const { stage: kidStage } = useKidEmotion()
const artUrl = (emotion: 'happy' | 'sad' | 'serious') => finaleUrl(kidStage.value, emotion)

function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const pending = computed(() => game.snapshot?.pending ?? null)
const profile = computed(() => game.snapshot?.profile ?? null)
const kidShort = computed(() =>
  profile.value ? formatShortName(`${profile.value.kidName} ${profile.value.kidLastName}`) : '',
)
const kidFlag = computed(() => flagEmoji(profile.value?.country ?? ''))
// L/M print her WHOLE name at 33/800 – a poster names the person, not the row in a table.
const kidFullName = computed(() =>
  profile.value ? `${profile.value.kidName} ${profile.value.kidLastName}` : '',
)
const kidRank = computed(() => game.snapshot?.kidRank ?? 0)
// Snapshot.week stays pinned to the event's own week for the whole reveal (tickWeek never
// advances again while paused), so this doubles as the tournament's real date range.
const weekDates = computed(() => weekRange(game.snapshot?.week ?? 0))

// --- Round 5 item 6: pre-tournament splash ------------------------------------
const tier = computed(() => (pending.value ? TIERS[pending.value.tier] : null))
const drawSize = computed(() => tier.value?.drawSize ?? 0)

// Round 5 item 11 fallback: lost the final => silver-styled card, serious art, "Runner-up".
const isRunnerUp = computed(() => !pending.value?.kidChampion && pending.value?.finishLabel === 'Runner-up')
/** WHICH PAINTING the finale poster hangs. Champion = the happy frame – and note WHAT IS IN IT
 *  (docs/lore/setting.md): "earned delight, holding a small club trophy or a medal, confetti of
 *  the cheap paper kind". That is the owner's §5 ruling in one line – L's confetti is a comparable
 *  effect we ALREADY ship, painted into the photograph, so this screen reuses it instead of
 *  rebuilding eighteen falling rectangles over the top of it. */
const finaleEmotion = computed<AvatarEmotion>(() => {
  if (pending.value?.kidChampion) return 'happy'
  if (isRunnerUp.value) return 'serious'
  return 'sad'
})
const finalePortrait = computed(() => artUrl(finaleEmotion.value as 'happy' | 'sad' | 'serious'))
/** The poster's photograph is cropped through the same face table as Home's hero and the F
 *  scene, so she is in the frame at every aspect the card can end up at. */
const finaleFocus = computed(() => {
  const p = facePoint(`${kidStage.value}-${finaleEmotion.value}`)
  return { objectPosition: `${p.x}% ${p.y}%` }
})

// --- flow state --------------------------------------------------------------
// Round-7 (spectate): 'spectate' sits between the kid's post-match card and the finale – once
// she's out (but not champion / runner-up) the flow walks the SUBSEQUENT rounds she isn't in,
// round by round, up to and including the Final, before "Continue" goes home.
const phase = ref<'splash' | 'pre' | 'post' | 'spectate' | 'finale'>('splash')
// The record currently being presented – captured from the pre-match snapshot so the post-match
// card keeps it even after the reveal has advanced the pending pointer to the next round.
const currentMatch = ref<WorldMatch | null>(null)
// The current opponent's rank, captured at pre-match time (before the reveal advances the pending
// pointer to the NEXT round's opponent). Shown under the opponent's name in the post-match stats.
const currentOppRank = ref<number | null>(null)
const replayOpen = ref(false)
// True when the replay was opened from a pre-match card (finishing it advances to the result).
const replayAdvances = ref(false)
// True only while the round being presented is the tournament FINAL. R10-6: the final's embedded
// MatchViewer now PLAYS the celebration itself, at the deciding point (`finalMatch`), and reports
// it via `endApplause`; the finale screen below only claps when nobody watched the final. Still
// exactly one `applauseFinal` – it just isn't a beat late any more.
const isFinalRound = computed(() => pending.value?.roundLabel === 'Final')
/**
 * WHICH ROUND THE OPEN VIEWER IS ACTUALLY SHOWING.
 *
 * ⚠ A BUG THE BADGE INHERITED AND THE 30.07 MOVE MADE VISIBLE. `pending.roundLabel` is the round on
 * DECK, and `tournamentReveal()` advances it the moment a result is revealed - so on the "Watch
 * again" path (post-match card -> the viewer, `replayAdvances === false`) it names the round she is
 * about to play NEXT while the viewer replays the one she just finished. The old `.tf-card-head`
 * read `pending.roundLabel` straight and mislabelled the same way; it was easier to miss in a row
 * that scrolled away than on the header line the badge lives on now.
 *  - watching the upcoming round  -> `pending.roundLabel` IS that round.
 *  - re-watching the round played -> the last entry on her revealed path, which is that match.
 */
const watchedRoundLabel = computed(() => {
  const p = pending.value
  if (!p) return ''
  if (replayAdvances.value) return p.roundLabel
  return p.bracket[p.bracket.length - 1]?.roundLabel ?? p.roundLabel
})

// --- Round-7 spectate geometry ------------------------------------------------
// The Final's round index (log2(draw) - 1) and the round the kid exited in. Single-elim: she
// plays contiguous rounds 0..bracket.length-1, so her exit round is bracket.length-1 (once
// finished, `bracket` holds all her matches). She reached the Final iff exit === finalRound.
const finalRound = computed(() => (drawSize.value ? Math.log2(drawSize.value) - 1 : 0))
const kidExitRound = computed(() => (pending.value ? pending.value.bracket.length - 1 : -1))
// The round the spectate walk is currently showing (starts at the round after her exit).
const spectateRound = ref(0)
// The default-active tab for the draw: the spectate round while spectating, otherwise the kid's
// latest played round (bracket.length-1).
const bracketActiveRound = computed(() =>
  phase.value === 'spectate' ? spectateRound.value : Math.max(0, (pending.value?.bracket.length ?? 1) - 1),
)
function stageName(round: number): string {
  const remaining = drawSize.value / 2 ** round
  if (remaining === 2) return 'Final'
  if (remaining === 4) return 'Semifinal'
  if (remaining === 8) return 'Quarterfinal'
  return `Round of ${remaining}`
}
const spectateRoundLabel = computed(() => stageName(spectateRound.value))
/** Short stage name of a round in this draw – F / SF / QF / R16 … Same rule and the same words as
 *  BracketTabs' own `shortStage`, because L/M's round strip and the draw's tabs sit one card apart
 *  and must not call the same round two different things. */
function shortStage(round: number): string {
  const remaining = drawSize.value / 2 ** round
  if (remaining === 2) return 'F'
  if (remaining === 4) return 'SF'
  if (remaining === 8) return 'QF'
  return `R${remaining}`
}

// --- E. Tournament (Preview): the brief ---------------------------------------
// The design's E is a brief on the event she is walking into: the venue, four facts about what is
// at stake, the first-round pairing, and her coach's read beside the button that starts it. Every
// figure below is one the engine already holds – see the note on `factPrize` for the one the
// handoff asks for that this game genuinely does not have.
const venueUrl = computed(() =>
  pending.value ? venueArtUrl(pending.value.tier, pending.value.surface, pending.value.eventId, game.snapshot?.seed ?? '') : '',
)
/** Winner's points at this tier – `points[0]` of the tier table, the design's "Ranking Points". */
const winnerPoints = computed(() => tier.value?.points[0] ?? 0)
/**
 * "SPECTATORS" – the design's fourth fact, and now a real (if decorative) figure.
 *
 * The engine draws it per event off `seed:crowd:<eventId>`, banded by tier, so a Local Open is a
 * couple of dozen people and a J300 is a show court – see engine/season/preview.ts for the bands
 * and for the warning that nothing in the simulation may ever read this number. The UI only
 * FORMATS it: grouped through the same `toLocaleString('en-US')` every other figure in the app
 * uses, so "1,750" is punctuated here exactly as it is on the money screens.
 */
const crowdFigure = computed(() => (pending.value?.crowd ?? 0).toLocaleString('en-US'))
const crowdTitle = computed(() =>
  pending.value ? `About ${crowdFigure.value} people around the courts – atmosphere, not a factor in play` : '',
)
/** How many wins the title costs from round one. log2 of the draw, in words, because the coach
 *  says it out loud rather than printing it. */
const WINS_IN_WORDS = ['', 'One win', 'Two wins', 'Three wins', 'Four wins', 'Five wins', 'Six wins']
const winsToTitle = computed(() => (drawSize.value ? Math.log2(drawSize.value) : 0))
/**
 * "COACH PREDICTION" – what a coach can honestly say about THIS event, which is not what the
 * handoff's mock says.
 *
 * The Season card's line has two clauses: the court's fit for her style, and how strong the field
 * reads. Only the FIRST survives into the tournament week. `fieldStrength` and the first-match
 * probability live on `UpcomingEvent.preview`, and `upcomingEvents()` filters to `week > world.week`
 * – so the moment the event's own week arrives its preview is gone from the snapshot. The verdict
 * on the court does not need it: `surfaceStyleHint` is a pure function of her play style and the
 * surface, the same one the Season card consumes, so the two screens cannot word it differently.
 *
 * The second clause is the draw's own arithmetic. Not a prediction – a price.
 */
const coachLine = computed(() => {
  if (!pending.value) return ''
  const hint = profile.value ? surfaceStyleHint(profile.value.playStyle, pending.value.surface) : null
  // "Grass – suits her game" -> "The court suits her game." (R11-15's slice, same as Season's).
  const dash = hint?.indexOf('– ') ?? -1
  const fit = hint && dash >= 0 ? hint.slice(dash + 2) : hint
  const price = `${WINS_IN_WORDS[winsToTitle.value] ?? `${winsToTitle.value} wins`} for the title.`
  return fit ? `The court ${fit}. ${price}` : price
})
/** His signature under it, in Caveat – the same one Home's coach note is signed with, so the note
 *  and the brief are the same man. Empty while she is self-coached: nobody signs their own read. */
const coachSignature = computed(() => {
  const current = game.snapshot?.coachMarket.find((c) => c.current)
  return current ? formatShortName(current.name) : ''
})
/**
 * THE RING IS HER CONDITION, not the design's "Your chance to win".
 *
 * That percentage is `preview.firstMatchChance`, and it leaves the snapshot with the preview (see
 * `coachLine` above). Inventing a replacement out of the two ranks either side of the VS row would
 * put a number on this screen that the simulation never agreed to – the one thing a ring must never
 * be. Her condition is a real reading, it is the number that decides how this week goes, and it is
 * already drawn as a ring on Home in the same red-to-green ramp, so a percentage still means one
 * thing across the app.
 */
const condition = computed(() => game.snapshot?.condition ?? 0)
const conditionColor = computed(() => `hsl(${Math.round(Math.max(0, Math.min(1, condition.value / 100)) * 120)}, 72%, 48%)`)

// --- L. Champion / M. Runner-up: the poster ------------------------------------
// Both screens are one card with one `outcome` (the handoff's own ResultPoster, §22). The parts
// come off `pending.bracket`, which by the finale holds every round she played, oldest first.
const finalRow = computed(() => pending.value?.bracket.at(-1) ?? null)
/** "def. I. Aigner" / "lost to I. Aigner" – the opponent of the last round she played. */
const finaleOpponent = computed(() => (finalRow.value ? formatShortName(finalRow.value.oppName) : ''))
/** The set scores as separate readings (19px/800, 16px apart), not one run-on string. */
const finaleSets = computed(() => (finalRow.value?.score ?? '').split(' ').filter(Boolean))
interface PathCell {
  short: string
  opp: string
  score: string
  won: boolean
}
/** The round strip along the foot of the poster: one column per round she played. */
const pathCells = computed<PathCell[]>(() =>
  (pending.value?.bracket ?? []).map((r, i) => ({
    short: shortStage(i),
    opp: formatShortName(r.oppName),
    // A walkover carries no score line; the cell simply has one fewer reading in it.
    score: r.score ?? '',
    won: r.kidWon,
  })),
)

// The whole draw once finished (through the Final), else the kid's played rounds – rendered as
// the round-tabbed bracket between rounds (post), during the spectate walk, and once more under
// the finale card. NEVER over the pre-match card and never during a replay (round-7 rule): the
// draw would spoil the match she is about to watch.
const bracketMatches = computed(() => pending.value?.fullBracket ?? [])
const showBracket = computed(
  () => bracketMatches.value.length > 0 && !replayOpen.value && (phase.value === 'post' || phase.value === 'spectate'),
)
// The finale copy of the draw sits BELOW the champion/portrait card, so the celebration still
// lands first and the completed bracket is there to scroll into.
const showFinaleBracket = computed(() => bracketMatches.value.length > 0 && phase.value === 'finale')
// The tournament champion (the Final match's winner) – named on the non-champion finale card,
// where there is no kid portrait to celebrate an AI winner.
const championName = computed(() => {
  const f = bracketMatches.value.find((m) => m.round === finalRound.value)
  if (!f) return ''
  return f.winnerId === f.aId ? f.aName : f.bName
})

function enterPre(): void {
  phase.value = 'pre'
  replayOpen.value = false
  currentMatch.value = pending.value?.kidMatch ?? null
  currentOppRank.value = pending.value?.opponent.rank ?? null
}

function beginFromSplash(): void {
  enterPre()
}

// R9-9b: skip the event AT its week – a post-deadline withdrawal behind a confirm. The engine
// command forfeits the entry fee, refunds the travel and discards the shadow run; the snapshot
// comes back without `pending`, so the overlay closes by itself. Splash-only: once a match has
// been revealed the run is under way (the engine guards this too).
const showSkipConfirm = ref(false)
const skipConfirmMessage = computed(() =>
  pending.value
    ? `Skip ${pending.value.tierLabel}? The entry fee is forfeited – the list closed with her on it. ` +
      'Travel is refunded and the week passes without playing.'
    : '',
)
async function confirmSkipEvent(): Promise<void> {
  showSkipConfirm.value = false
  if (pending.value) await game.skipEvent(pending.value.eventId)
}

// Initialise from the snapshot: resume at the finale after a reload mid-celebration, resume
// mid-round if a round is already revealed, otherwise this is the FIRST time the flow has
// opened for this tournament -> show the splash first (item 6).
if (pending.value?.finished) phase.value = 'finale'
else if (pending.value && pending.value.bracket.length === 0) phase.value = 'splash'
else enterPre()

async function showResult(): Promise<void> {
  if (phase.value !== 'pre') return
  replayOpen.value = false
  await game.tournamentReveal()
  phase.value = 'post'
}

function watchMatch(): void {
  replayAdvances.value = true
  replayOpen.value = true
}
function watchAgain(): void {
  replayAdvances.value = false
  replayOpen.value = true
}
function endReplay(): void {
  replayOpen.value = false
  if (replayAdvances.value) showResult()
}

function next(): void {
  const p = pending.value
  if (!p) return
  // Still in her run -> the next round's pre-match card.
  if (!p.finished) {
    enterPre()
    return
  }
  // Her run is over. Champion or a lost final (runner-up) -> straight to the finale; both are
  // cases where she reached the Final so there's nothing left to spectate. Otherwise she exited
  // early: spectate the SUBSEQUENT rounds she isn't in, starting the round after her exit.
  if (p.kidChampion || kidExitRound.value >= finalRound.value) {
    phase.value = 'finale'
    return
  }
  spectateRound.value = kidExitRound.value + 1
  phase.value = 'spectate'
}
// The spectate walk: advance one round until the Final is shown, then "Continue" -> finale.
function nextSpectateRound(): void {
  if (spectateRound.value < finalRound.value) spectateRound.value++
  else phase.value = 'finale'
}
async function skipAll(): Promise<void> {
  await game.tournamentSkip()
  phase.value = 'finale'
}
async function continueFinale(): Promise<void> {
  await game.tournamentClose()
}

// R10-6 (was round-7 item 14): the celebratory applause belongs to the moment she wins or loses
// the final, so the final's own MatchViewer fires it at that point and calls `noteEndApplause`
// here. The finale screen is the FALLBACK for the paths where no viewer ever played it – the
// player skipped the match (or the whole tournament), watched it in 'skip' view mode, or reloaded
// straight into an already-finished tournament. Either way it stays ONE applauseFinal per mount.
//
// The owner's bug: this watcher was the ONLY player of the cue, so the applause could not fire
// before the reveal round-trip + the "Next →" click + the phase flip, and then still had to
// fetch/decode a cold ~60 KB clip (see primeSfx) – audibly behind the result. Both halves are
// gone: the cue is warmed the moment a final is on deck, and it lands on the deciding point.
let finaleSoundPlayed = false
/** The embedded viewer just played a match-end cue. Only the FINAL's is the celebration this
 *  screen would otherwise play, so an earlier round's ordinary applause must NOT stand it down
 *  (watch the semifinal, skip the final -> the champion card still gets its applause). */
function noteEndApplause(): void {
  if (isFinalRound.value) finaleSoundPlayed = true
}
watch(
  phase,
  (p) => {
    if (p !== 'finale' || finaleSoundPlayed) return
    finaleSoundPlayed = true
    if (pending.value?.kidChampion || isRunnerUp.value) playSfx('applauseFinal')
  },
  { immediate: true },
)
// Warm the celebration clip as soon as a final is in play – it covers the paths that never mount a
// final viewer (skip to result / skip tournament / resume into the finale), where the fallback
// above is what plays. `{ immediate: true }` so a flow that opens already ON the final is covered.
watch(isFinalRound, (isFinal) => { if (isFinal) primeSfx('applauseFinal') }, { immediate: true })

// --- current match: rebuilt annotated match + box score ----------------------
const annotated = computed(() => {
  const m = currentMatch.value
  if (!m) return null
  const opts: MatchOptions = { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' }
  return annotateMatch(simulateMatch(m.a, m.b, opts), m.a, m.b, opts)
})
const kidSide = computed<Side>(() => (currentMatch.value?.aId === KID_ID ? 0 : 1))
const kidWon = computed(() => currentMatch.value?.winnerId === KID_ID)
const kidScore = computed(() => {
  const m = currentMatch.value
  if (!m?.score) return ''
  return m.bId === KID_ID ? flipScore(m.score) : m.score
})
const oppName = computed(() => currentMatch.value?.oppName ?? '')
// Short name on both sides for the caption + stats header (round-5 item 9).
const oppShort = computed(() => (oppName.value ? formatShortName(oppName.value) : ''))
// Ranks routed into the inline MatchViewer, mapped to its A/B sides by which side the kid took.
const viewerRankA = computed<number | null>(() => (kidSide.value === 0 ? kidRank.value : currentOppRank.value))
const viewerRankB = computed<number | null>(() => (kidSide.value === 0 ? currentOppRank.value : kidRank.value))

interface StatRow {
  label: string
  kid: string
  opp: string
}
const statRows = computed<StatRow[]>(() => {
  const a = annotated.value
  const m = currentMatch.value
  if (!a || !m) return []
  const s = computeMatchStats(a, m.a, m.b)
  const k = kidSide.value
  const o: Side = k === 0 ? 1 : 0
  const pair = (v: [number, number]): { kid: string; opp: string } => ({ kid: String(v[k]), opp: String(v[o]) })
  return [
    { label: 'Aces', ...pair(s.aces) },
    { label: 'Double faults', ...pair(s.doubleFaults) },
    { label: 'Winners', ...pair(s.winners) },
    { label: 'Unforced errors', ...pair(s.unforcedErrors) },
    { label: 'Max serve', kid: `${s.serveSpeed.max[k]} km/h`, opp: `${s.serveSpeed.max[o]} km/h` },
  ]
})
const matchMeta = computed(() => {
  const a = annotated.value
  const m = currentMatch.value
  if (!a || !m) return null
  const s = computeMatchStats(a, m.a, m.b)
  return { rally: s.meanRallyLength.toFixed(1), duration: s.durationEstimate }
})

</script>

<template>
  <div v-if="pending" class="tournament-flow">
    <!-- The flow's own header. NOT on the E brief: the hero underneath it carries the tournament's
         name, its court and its dates, and the design gives that screen a bare back-arrow rather
         than a title bar. Every other phase still needs to be told which tournament this is. -->
    <header v-if="phase !== 'splash'" class="tf-top">
      <div>
        <div class="tf-title">{{ pending.tierLabel }}</div>
        <div class="tf-sub">
          <!-- ⚠ THE SURFACE STEPS ASIDE WHILE A MATCH IS ON SCREEN, and it is the one readout on
               this line that can: the court is painted in it about 20px lower, so "clay" is being
               said twice and the second saying is the one made of pixels. That is what pays for the
               round badge below - the line has room for the date plus a full round name, but not for
               all three (measured at 375pt: 88.5 + 85 fits the 215px the header control leaves,
               65.3 + 88.5 + 85 does not, and it wrapped, which put 23px BACK onto the header and
               undid the row we had just recovered). Every other phase keeps the pill: the preview,
               the pre-match card, the box score and the poster have no court to read it off. -->
          <!-- ⚠ ADOPTED AT THE INTEGRATION MERGE: this was the last hand-written surface readout, and
               the icon-system branch that made `SurfaceMark` listed this exact line as its pending
               adoption. Its own note is worth keeping in mind - one of the three copies had `surf-clay`
               HARD-CODED beside the word "clay", so every other court showed an orange ring labelled
               clay. The conditional below is the one thing the component does not own and must
               survive: WHETHER the surface is said at all on this line. -->
          <SurfaceMark v-if="!replayOpen" :surface="pending.surface" size="sm" />
          <span class="hint tf-week-dates">{{ weekDates }}</span>
          <!-- ⚠ THE ROUND BADGE MOVED UP HERE, ONTO THE DATE LINE (owner, 30.07: «on tournament
               match screen move quarterfinal badge higher nearby date»). It used to sit in the
               match card's own head row, which existed only to hold it, so the row went with it -
               see the note at the replay section. Same `.tf-replay-round` capsule, deliberately:
               it is still the same fact wearing the same clothes, it just costs no row now, because
               the sub line was already being drawn. Full round name rather than the draw's "QF" -
               there is room for it once the surface pill stands down, and the badge the owner asked
               to move said "Quarterfinal". Only while a match is on screen: between rounds the path
               strip and the draw name their own rounds. And it names the round IN THE VIEWER, not the
               round on deck - see `watchedRoundLabel` for the mislabel it inherited. -->
          <span v-if="replayOpen" class="tf-replay-round">{{ watchedRoundLabel }}</span>
        </div>
      </div>
      <!-- THE HEADER'S ONE SLOT, filled with whichever exit fits the phase.
           ⚠ IT USED TO SAY "Skip tournament →" EVEN WHILE A MATCH WAS PLAYING, one card above a
           "To result →" that meant something else entirely (owner, 30.07: «what's the difference
           between to results and skip tournament?»). They are genuinely different buttons - one
           match versus the whole draw - so the fix is not to merge them but to stop offering them
           at the same time and to make the big one say how big it is:
             * "To result →"      -> endReplay: leave the live view of THIS match and show ITS box
                                    score. The tournament carries on round by round.
             * "Skip all rounds →" -> skipAll: game.tournamentSkip() resolves EVERY remaining round
                                    at once and lands on the champion / runner-up poster. You do not
                                    see another match. "Skip tournament" never said that it was the
                                    rest of the DRAW rather than the rest of this match.
           Neither is the splash's "Skip this event – withdraw", which forfeits her entry for no
           points at all; that one keeps its own place and its own confirm.
           The skip's conditions are unchanged - not before the run has begun, not after it is over -
           it just yields the slot while a match is being watched. -->
      <button v-if="replayOpen" class="link" :disabled="game.busy" @click="endReplay">To result →</button>
      <button
        v-else-if="!pending.finished && phase !== 'finale'"
        class="link"
        :disabled="game.busy"
        @click="skipAll"
      >
        Skip all rounds →
      </button>
    </header>

    <div class="tf-body">
      <!-- =====================================================================================
           E. TOURNAMENT (PREVIEW) – the brief, and the flow's very first screen (Round 5 item 6).
           Hero -> four facts -> the first-round pairing -> the coach's read beside the button.
           ===================================================================================== -->
      <template v-if="phase === 'splash'">
        <!-- THE HERO. The venue this event owns forever (art/venues.ts draws it off the event's own
             sub-stream), under the design's four-stop scrim so the title keeps its contrast on a
             bright court. Rounded rather than full-bleed: this is a card in a takeover, not the top
             of a screen. -->
        <Card variant="photo" class="tf-hero">
          <img class="tf-hero-art" :src="venueUrl" alt="" />
          <span class="tf-hero-scrim" aria-hidden="true"></span>
          <!-- R9-9: the begin flow is not a one-way door – Back returns to the shell with nothing
               resolved. It is the design's back-arrow, on the hero where the design puts it. -->
          <button class="tf-hero-back" :disabled="game.busy" @click="$emit('back')">← Back</button>
          <div class="tf-hero-caption">
            <h2 class="tf-hero-title">{{ pending.tierLabel }}</h2>
            <p class="tf-hero-meta">{{ pending.surface }} &middot; {{ weekDates }}</p>
          </div>
        </Card>

        <!-- THE FACTS ROW, and it is the design's own four in the design's own order: Surface /
             Prize Money / Ranking Points / Spectators.
             ⚠ THE FOURTH CELL WAS "Draw" FOR ONE SLICE, because the game did not model a crowd. It
             does now (engine/season/preview.ts `eventCrowd` – a corridor per tier off the event's
             own `seed:crowd:` sub-stream, decorative, read by nothing), so the handoff's own label
             is back. The DRAW SIZE did not lose its place with the swap: it moved onto the
             first-round card below, which is where a draw size actually means something, and it
             is stated there for every tier – `roundLabel` alone would not do it, since a local's
             8-player first round reads "Quarterfinal" and never says 8. -->
        <div class="tf-facts">
          <div class="tf-fact">
            <span class="tf-fact-tile" aria-hidden="true">
              <span class="surface-mark" :class="`surf-${pending.surface}`">
                <span class="surface-ring"><i></i></span>
              </span>
            </span>
            <span class="tf-fact-label">Surface</span>
            <span class="tf-fact-value surface">{{ pending.surface }}</span>
          </div>
          <!-- "Prize Money", dashed out, is the design's own third fact, and it is true of every
               event in the game: the junior tour pays nothing at all (engine/season/calendar.ts,
               "the junior international tour – no prize money"). The family carries the year; she
               collects points. That is the premise of the whole game, so it earns a cell. -->
          <div class="tf-fact">
            <span class="tf-fact-tile" aria-hidden="true">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v18M16 7.5A3.5 3.5 0 0 0 12.5 5h-1a3 3 0 0 0 0 6h1a3 3 0 0 1 0 6h-1A3.5 3.5 0 0 1 8 16.5" />
              </svg>
            </span>
            <span class="tf-fact-label">Prize money</span>
            <span class="tf-fact-value" title="The junior tour pays no prize money at any level">–</span>
          </div>
          <div class="tf-fact">
            <span class="tf-fact-tile" aria-hidden="true">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 14v6" />
              </svg>
            </span>
            <span class="tf-fact-label">Winner</span>
            <span class="tf-fact-value">{{ winnerPoints }} pts</span>
          </div>
          <div class="tf-fact">
            <span class="tf-fact-tile" aria-hidden="true">
              <!-- The design's own three-figure mark: one face forward, two behind it. -->
              <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="12" cy="7.4" r="2.8" />
                <circle cx="5.8" cy="9.4" r="2.2" />
                <circle cx="18.2" cy="9.4" r="2.2" />
                <path d="M12 11.4c-3 0-5.2 1.7-5.2 4.1V18h10.4v-2.5c0-2.4-2.2-4.1-5.2-4.1z" />
                <path d="M5.8 12.6c-2 0-3.6 1.2-3.6 2.9V18h3.2v-2.5c0-1 .3-1.9.9-2.6a5 5 0 0 0-.5-.3zM18.2 12.6c2 0 3.6 1.2 3.6 2.9V18h-3.2v-2.5c0-1-.3-1.9-.9-2.6a5 5 0 0 1 .5-.3z" />
              </svg>
            </span>
            <span class="tf-fact-label">Spectators</span>
            <span class="tf-fact-value" :title="crowdTitle">{{ crowdFigure }}</span>
          </div>
        </div>

        <!-- THE FIRST ROUND. Two mirrored player panels either side of a VS. No portraits: we ship
             none for the opponents, and one face against an empty frame reads worse than two
             names. -->
        <Card class="tf-first">
          <!-- The round she is about to play, and the size of the thing she has to get through to
               win it. The draw size lives HERE rather than in the facts row (see the note on it):
               "Quarterfinal · 8-player draw" says in one line both where she starts and how far
               the top is, which is more than either half said on its own. -->
          <div class="tf-round-row">
            <p class="tf-round">{{ pending.roundLabel }}</p>
            <p class="tf-draw">{{ drawSize }}-player draw</p>
          </div>
          <div class="tf-first-grid">
            <div class="tf-first-side">
              <div class="tf-first-flag">{{ kidFlag }}</div>
              <div class="tf-first-name">{{ kidShort }}</div>
              <div class="tf-first-rank">Rank #{{ kidRank }}</div>
            </div>
            <div class="tf-first-vs">VS</div>
            <div class="tf-first-side mirrored">
              <div class="tf-first-flag">{{ flagEmoji(pending.opponent.nation) }}</div>
              <div class="tf-first-name">{{ pending.opponent.name }}</div>
              <div class="tf-first-rank">Rank #{{ pending.opponent.rank }}</div>
            </div>
          </div>
        </Card>

        <!-- THE COACH'S READ + THE BUTTON THAT STARTS IT. -->
        <Card class="tf-brief">
          <div class="tf-brief-said">
            <p class="tf-brief-label">Coach prediction</p>
            <p class="tf-brief-line">{{ coachLine }}</p>
            <p v-if="coachSignature" class="tf-brief-sign">{{ coachSignature }}</p>
          </div>
          <div class="tf-brief-go">
            <p class="tf-brief-ring-label">Her condition</p>
            <ProgressRing
              :value="condition / 100"
              :color="conditionColor"
              :label="`Her condition going into this tournament: ${Math.round(condition)} percent`"
            />
            <PrimaryPill variant="cta" :disabled="game.busy" @click="beginFromSplash">Begin →</PrimaryPill>
          </div>
        </Card>

        <!-- R9-9b: the post-deadline withdrawal, behind a confirm. -->
        <button class="link tf-skip-entry" :disabled="game.busy" @click="showSkipConfirm = true">
          Skip this event – withdraw
        </button>
      </template>

      <template v-else>
        <!-- Path so far. NOT on the finale: the L/M poster carries her whole path as its own round
             strip (design §L), and printing it twice, one card apart, is the same list said twice. -->
        <div v-if="pending.bracket.length && phase !== 'finale'" class="tf-strip">
          <div v-for="(r, i) in pending.bracket" :key="i" class="tf-strip-row" :class="{ won: r.kidWon }">
            <span class="tf-strip-round">{{ r.roundLabel }}</span>
            <span class="tf-strip-result">{{ r.kidWon ? 'W' : 'L' }}</span>
            <span class="tf-strip-opp">{{ r.oppName }}</span>
            <span class="tf-strip-score num">{{ r.score }}</span>
          </div>
        </div>

        <!-- Round-7 (owner): the draw as a round-tabbed bracket (R32 · R16 · QF · SF · F). The
             active tab defaults to the kid's current round between rounds (post) and to the
             spectate round during the walk; the finale renders the same component again below
             its card. Only revealed rounds are in `fullBracket`, so no tab can leak ahead. -->
        <section v-if="showBracket" class="tf-card tf-bracket">
          <p class="tf-bracket-title">Draw</p>
          <BracketTabs :matches="bracketMatches" :draw-size="drawSize" :active-round="bracketActiveRound" />
        </section>

        <!-- Watching a match (inline).
             ⚠ THE HEAD ROW IS GONE, AND IT COST 34px. Round-7 moved the stage/round label off the
             court (where it obstructed play) into a head row of its own, level with "To result →";
             30.07 finishes the move. The label went UP to the header's date line, which was already
             being drawn, and "To result →" went up to the header's own slot - so the row had nothing
             left to carry and the court starts 34px higher (22px of pill + its 12px of air).
             The round is still named on this screen and it is still the same capsule. It just does
             not rent a row to say it.
             ⚠ AND THE `.tf-card` AROUND IT IS GONE TOO, WHICH IS THE OTHER 36px (owner, 30.07: «на
             экране матча у нас двойная рамка, она съедает место, давай внешний контур уберем, он не
             нужен»). It was a 16px-padded, hairline-bordered panel wrapped around a STACK of panels
             the viewer draws itself - `.mv-panel`, `.mv-log`, `.mv-boxscore` are each a `Card`, so
             the outer box was a second border around a border and 34px of horizontal padding around
             nothing. Measured at 375pt: the canvas went 291 -> 327px wide and the painted court with
             it (244.4 -> 274.9px), and the panel lost 32px of height. The viewer now hangs straight
             off `.tf-body`, which is what the other two match screens do as well. The section it used
             to live in went with the class: the `v-if` sits on the component, so the phase chain is
             unchanged and there is no wrapper left to grow a border again. -->
      <MatchViewer
        v-if="replayOpen && annotated && currentMatch"
        :match="annotated"
        :player-a="currentMatch.a"
        :player-b="currentMatch.b"
        :surface="currentMatch.surface"
        :rank-a="viewerRankA"
        :rank-b="viewerRankB"
        :final-match="isFinalRound"
        :temperature-c="pending?.temperatureC ?? null"
        @finish="endReplay"
        @end-applause="noteEndApplause"
      />

      <!-- =====================================================================================
           F. MATCH DAY – the pre-match card, as the portrait treatment (ui-inventory §4 Q2). The
           painted scene fills the card, the round rides the top corner, and the glass plate at its
           foot carries the pairing and the two ways into the match. `serious` is the frame for a
           match she has not played yet: focused, contained, nothing decided.
           ===================================================================================== -->
      <MatchScene
        v-else-if="phase === 'pre'"
        class="tf-scene"
        :stage="kidStage"
        emotion="serious"
        :label="pending.roundLabel"
      >
        <div class="tf-scene-grid">
          <div class="tf-scene-side">
            <div class="tf-scene-name">{{ kidShort }} {{ kidFlag }}</div>
            <div class="tf-scene-rank">#{{ kidRank }}</div>
          </div>
          <div class="tf-scene-vs">vs</div>
          <div class="tf-scene-side mirrored">
            <div class="tf-scene-name">{{ pending.opponent.name }} {{ flagEmoji(pending.opponent.nation) }}</div>
            <div class="tf-scene-rank">#{{ pending.opponent.rank }}</div>
          </div>
        </div>
        <div class="tf-actions">
          <button class="primary sfx-watch" :disabled="game.busy" @click="watchMatch">Watch match</button>
          <button :disabled="game.busy" @click="showResult">Skip</button>
        </div>
      </MatchScene>

      <!-- Post-match box score -->
      <section v-else-if="phase === 'post'" class="tf-card">
        <div class="tf-result-head">
          <span class="tf-badge" :class="kidWon ? 'win' : 'loss'">{{ kidWon ? 'Win' : 'Loss' }}</span>
          <span class="tf-scoreline num">{{ kidScore }}</span>
        </div>
        <p class="hint" style="margin: 0 0 12px">{{ kidShort }} vs {{ oppShort }}</p>
        <table>
          <thead>
            <tr>
              <th></th>
              <th>
                <span class="ph-name">{{ kidShort }}</span>
                <span v-if="kidRank" class="ph-rank">#{{ kidRank }}</span>
              </th>
              <th>
                <span class="ph-name">{{ oppShort }}</span>
                <span v-if="currentOppRank != null" class="ph-rank">#{{ currentOppRank }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in statRows" :key="row.label">
              <th>{{ row.label }}</th>
              <td class="num">{{ row.kid }}</td>
              <td class="num">{{ row.opp }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="matchMeta" class="hint">Avg rally {{ matchMeta.rally }} shots · ~{{ matchMeta.duration }}</p>
        <div class="tf-actions">
          <button class="sfx-watch" :disabled="game.busy" @click="watchAgain">Watch again</button>
          <button class="primary" :disabled="game.busy" @click="next">Next →</button>
        </div>
      </section>

      <!-- Round-7 spectate: after the kid's exit, walk the rounds she isn't in, up to the Final.
           Her own result stays visible; the draw above (BracketTabs) shows this round. -->
      <section v-else-if="phase === 'spectate'" class="tf-card tf-spectate">
        <p class="tf-spectate-kid">{{ kidShort }} – {{ pending.finishLabel }}</p>
        <p class="tf-round">{{ spectateRoundLabel }}</p>
        <p class="hint">She's out – see how the draw finishes.</p>
        <div class="tf-actions">
          <button class="primary" :disabled="game.busy" @click="nextSpectateRound">
            {{ spectateRound < finalRound ? 'Next round →' : 'Continue' }}
          </button>
        </div>
      </section>

      <!-- =====================================================================================
           L. CHAMPION / M. RUNNER-UP – one poster, one `outcome` (the handoff's ResultPoster, §22).
           Order is the design's: mark -> status -> her name -> the photograph -> who she beat ->
           the sets -> the chips -> the points -> the round strip -> Continue. The photograph is the
           only thing that stretches, so the button can never be pushed under the fold.
           ===================================================================================== -->
      <template v-else>
        <!-- Reached the Final: her own poster, gold or silver. -->
        <Card
          v-if="pending.kidChampion || isRunnerUp"
          class="tf-poster"
          :class="pending.kidChampion ? 'champ' : 'silver'"
        >
          <!-- The trophy and the medal are the art we already ship (owner, §4 Q4) – no slot to
               fill, nothing to draw. -->
          <div class="tf-poster-mark">{{ pending.kidChampion ? '🏆' : '🥈' }}</div>
          <p class="tf-poster-status">{{ pending.kidChampion ? 'Champion' : 'Runner-up' }}</p>
          <h2 class="tf-poster-name">{{ kidFullName }}</h2>
          <img class="tf-poster-photo" :src="finalePortrait" :style="finaleFocus" alt="" />
          <p v-if="finaleOpponent" class="tf-poster-line">
            {{ pending.kidChampion ? 'def.' : 'lost to' }} <b>{{ finaleOpponent }}</b> in the Final
          </p>
          <p v-if="finaleSets.length" class="tf-poster-sets">
            <span v-for="(s, i) in finaleSets" :key="i">{{ s }}</span>
          </p>
          <div class="controls tf-poster-chips">
            <SurfaceMark :surface="pending.surface" />
            <span class="pill">{{ pending.tierLabel }}</span>
          </div>
          <!-- Lime on BOTH posters: points are always a gain, even on the day she lost the final. -->
          <p class="tf-poster-points">+{{ pending.points }} pts</p>
          <div v-if="pathCells.length" class="tf-path" :style="{ gridTemplateColumns: `repeat(${pathCells.length}, 1fr)` }">
            <div v-for="(c, i) in pathCells" :key="i" class="tf-path-cell" :class="{ lost: !c.won }">
              <span class="tf-path-round">{{ c.short }}</span>
              <span class="tf-path-opp">{{ c.won ? 'def.' : 'lost to' }} <b>{{ c.opp }}</b></span>
              <span class="tf-path-score num">{{ c.score }}</span>
              <svg class="tf-path-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path v-if="c.won" d="M8 12.4l2.6 2.6L16 9.6" />
                <path v-else d="M9 9l6 6M15 9l-6 6" />
              </svg>
            </div>
          </div>
          <PrimaryPill class="tf-poster-cta" variant="cta" :disabled="game.busy" @click="continueFinale">
            Continue
          </PrimaryPill>
        </Card>

        <!-- Exited earlier: the same poster with somebody else's name on it. No art for an AI
             champion, so the photograph's place is taken by her own finish line. -->
        <Card v-else class="tf-poster out">
          <div class="tf-poster-mark">🏆</div>
          <p class="tf-poster-status">Champion</p>
          <h2 class="tf-poster-name">{{ championName }}</h2>
          <p class="tf-poster-line">
            {{ kidShort }} – <b>{{ pending.finishLabel }}</b>
          </p>
          <div class="controls tf-poster-chips">
            <SurfaceMark :surface="pending.surface" />
            <span class="pill">{{ pending.tierLabel }}</span>
          </div>
          <p class="tf-poster-points">+{{ pending.points }} pts</p>
          <div v-if="pathCells.length" class="tf-path" :style="{ gridTemplateColumns: `repeat(${pathCells.length}, 1fr)` }">
            <div v-for="(c, i) in pathCells" :key="i" class="tf-path-cell" :class="{ lost: !c.won }">
              <span class="tf-path-round">{{ c.short }}</span>
              <span class="tf-path-opp">{{ c.won ? 'def.' : 'lost to' }} <b>{{ c.opp }}</b></span>
              <span class="tf-path-score num">{{ c.score }}</span>
              <svg class="tf-path-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path v-if="c.won" d="M8 12.4l2.6 2.6L16 9.6" />
                <path v-else d="M9 9l6 6M15 9l-6 6" />
              </svg>
            </div>
          </div>
          <PrimaryPill class="tf-poster-cta" variant="cta" :disabled="game.busy" @click="continueFinale">
            Continue
          </PrimaryPill>
        </Card>

        <!-- The finished draw, below the celebration – same component, same tabs (her round is
             still the default one, and by now every round is revealed). -->
        <section v-if="showFinaleBracket" class="tf-card tf-bracket">
          <p class="tf-bracket-title">Draw</p>
          <BracketTabs :matches="bracketMatches" :draw-size="drawSize" :active-round="bracketActiveRound" />
        </section>
      </template>
      </template>
    </div>

    <ConfirmDialog
      v-if="showSkipConfirm"
      :message="skipConfirmMessage"
      confirm-label="Skip event"
      @confirm="confirmSkipEvent"
      @cancel="showSkipConfirm = false"
    />
  </div>
</template>

<style scoped>
/* =================================================================================================
   E / F / L / M – THE TOURNAMENT FLOW'S OWN STYLES
   =================================================================================================
   Same rule Home and Season were ported under (U0): shared vocabulary lives in `src/style.css` or in
   `src/components/ui/`; what ONE screen composes lives scoped in that screen's file, so six screens
   being built at once are not all editing the same 3,400-line sheet.

   WHAT LEFT `src/style.css` WITH THIS SLICE, because its markup is gone: `.tf-vs` / `.tf-vs-grid` /
   `.tf-side-name` / `.tf-vs-mid` (the old flat VS card, now the F scene), `.tf-splash` /
   `.tf-splash-tier` / `.tf-portrait` (the old splash, now the E brief), and `.tf-trophy` /
   `.tf-finale*` / `.tf-path*` / `.tf-champ-label` / `.tf-champ-name` / `.tf-finale-kidline` (the old
   finale, now the L/M poster).

   WHAT DELIBERATELY STAYED IN THE SHEET: `.tournament-flow` and `.tf-body` (the full-screen takeover
   and its scrolling column, both SHARED with the splash and the onboarding wizard – another agent's
   screens are in that selector list), `.tf-card` (the panel shell, shared with four dialogs),
   `.tf-round` (still the spectate card's label too), `.tf-actions`, `.tf-badge`, `.tf-replay-round`,
   `.tf-strip*`, `.tf-bracket*` and `.tf-spectate*` – the phases this slice does not redesign.

   ⚠ RESOLVED, 29.07 – the two design tokens this screen needs NOW EXIST IN THE APP. This block used
   to say `--celebration-bg` / `--celebration-bg-cool` were declared only in `docs/design/tokens.css`,
   which is a REFERENCE and never imported, so the gradients were written out below at the point of
   use and would "belong in `src/style.css`'s :root the day somebody owns that file again". That day
   came with the owner's question about the play-style colours, and both are on :root now; L and M
   reference them. `--gold` was listed here too and turns out never to have been referenced by any
   rule on this screen – the champion card is lime – so it was NOT promoted. See tests/design-tokens.test.ts,
   which now fails the build if a screen references a token this app does not declare.
   ================================================================================================= */

/* --- The header's sub line ---------------------------------------------------------------------- */

/* THE ROUND BADGE, NOW A THIRD ITEM ON THE DATE LINE (owner, 30.07). Two corrections it needs to
   ride there, neither of which belongs in the sheet - the capsule itself is shared vocabulary and
   its other consumer is still the friendly's own header:
     * the 8px is the rhythm `.tf-week-dates` already sets between the surface pill and the date, so
       the badge keeps the same step instead of butting against "Mar 10–16, 2031";
     * `inline-block`, because the capsule has vertical padding and an inline box would not reserve
       height for it - it read as a pill only by luck of the line box.
   Vue's whitespace-condense drops the newline between the two spans in the template, so the gap has
   to be a margin; a space in the markup would not survive the compile. */
.tf-sub .tf-replay-round {
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
}

/* THE HEADER CONTROL NEVER WRAPS. A wrapped exit is how the header went from 75px to 98px in the
   first draft of this slice: the flex row gave the sub line what it asked for and the button took
   two lines for "To result →". A long tier label wrapping the TITLE is the better trade - the title
   is a name and reads fine on two lines; the control is a control. */
.tf-top > button {
  white-space: nowrap;
}

/* --- E. Tournament (Preview) ------------------------------------------------------------------ */

/* The design's hero is 300px (tokens.css --hero-tournament). Ours keeps the height and takes the
   card's corners, because it sits under the flow's own header rather than at the top of a screen. */
.tf-hero {
  position: relative;
  min-height: 300px;
  justify-content: flex-end;
}

.tf-hero-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* §E's own four stops: dark at the head for the back control, clear through the middle of the
   court, and closing to the page colour under the title. */
.tf-hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(6, 10, 14, 0.62) 0%,
    rgba(6, 10, 14, 0.1) 26%,
    rgba(11, 17, 23, 0.45) 66%,
    rgba(15, 23, 32, 0.94) 100%
  );
}

.tf-hero-back {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 13px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-pill);
  background: rgba(10, 15, 20, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-2);
}

.tf-hero-caption {
  position: relative;
  padding: 0 16px 16px;
}

.tf-hero-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-wrap: pretty;
  text-shadow: var(--shadow-text-on-art);
}

.tf-hero-meta {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  text-transform: capitalize;
  text-shadow: var(--shadow-text-on-art);
}

/* Four facts across, the design's own row: a tinted panel with an icon tile over a label over a
   value in each cell. */
.tf-facts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid var(--line);
  border-radius: var(--radius-frame);
  background: rgba(20, 29, 38, 0.72);
}

.tf-fact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  min-width: 0;
}

.tf-fact-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-dialog);
  background: rgba(255, 255, 255, 0.07);
  color: var(--ink-2);
}

.tf-fact-label {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--ink-soft);
  line-height: 1.25;
}

.tf-fact-value {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.25;
}

/* Only the SURFACE is capitalised – it is a proper noun of the sport, and the engine stores it
   lower-case. "30 Pts" and a crowd figure are not names, and capitalising them was the
   sentence-case bug this rule exists to avoid. */
.tf-fact-value.surface {
  text-transform: capitalize;
}

/* The first-round card's header line: the round label on the left, the draw size answering it on
   the right. `.tf-round` lives in src/style.css and carries the 16px gap on its own bottom margin;
   the row takes that job over so the two readings sit on one baseline. */
.tf-round-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.tf-round-row .tf-round {
  margin-bottom: 0;
}

.tf-draw {
  margin: 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-soft);
  white-space: nowrap;
}

/* The first-round pairing: two mirrored panels with the VS between them. */
.tf-first-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
}

.tf-first-side {
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-frame);
  background: var(--card-top);
}

/* The right-hand player reads back toward the net, exactly as the design mirrors it. */
.tf-first-side.mirrored {
  text-align: right;
}

.tf-first-flag {
  font-size: 17px;
  line-height: 1;
}

.tf-first-name {
  margin-top: 6px;
  font-size: 12.5px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.tf-first-rank {
  margin-top: 2px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.tf-first-vs {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-soft);
}

/* The coach's read on the left, the reading and the button on the right (the design's 168px
   column, as a min-content track so a long tier name cannot squeeze the CTA). */
.tf-brief {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.tf-brief-said {
  flex: 1;
  min-width: 0;
}

.tf-brief-label {
  margin: 0;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-2);
}

.tf-brief-line {
  margin: 6px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.42;
  color: var(--ink);
  text-wrap: pretty;
}

/* His signature, in the app's handwriting – the same object as Home's coach note sign-off. */
.tf-brief-sign {
  margin: 8px 0 0;
  font-family: var(--font-hand);
  font-size: 17px;
  line-height: 1;
  color: var(--accent-soft);
}

.tf-brief-go {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.tf-brief-ring-label {
  margin: 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-soft);
}

/* --- F. Match Day (the pre-match scene) -------------------------------------------------------- */

/* The design's F scene is `flex: 1` of the screen and this one is too – a match day is not a card
   floating in a field of page colour. `min-height` on the component keeps it from collapsing when
   there is a path strip above it. */
.tf-scene {
  flex: 1;
}

/* MatchScene owns the card, the painting and the glass plate; this is only what is written on it. */
.tf-scene-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
}

.tf-scene-side {
  min-width: 0;
}

.tf-scene-side.mirrored {
  text-align: right;
}

.tf-scene-name {
  font-size: 14.5px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.tf-scene-rank {
  margin-top: 2px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.tf-scene-vs {
  font-size: 13px;
  font-style: italic;
  color: var(--ink-soft);
}

/* --- L. Champion / M. Runner-up ---------------------------------------------------------------- */

/* THE POSTER. `--celebration-bg` / `--celebration-bg-cool`, the design system's own light behind a
   champion's card; M's is the same light from the same place, colder by one step. Both are REAL
   tokens now (src/style.css :root) rather than the two gradients this rule used to spell out - see
   the ⚠ at the top of this block, which is why they were literals in the first place. */
.tf-poster {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 14px 14px;
  border-radius: var(--radius-card);
  background: var(--celebration-bg);
}

.tf-poster.silver,
.tf-poster.out {
  background: var(--celebration-bg-cool);
}

.tf-poster.champ {
  border-color: var(--accent);
}

/* Round 5 item 11's silver ring, kept: a lost final is not a gold card with the gold turned off.
   The ground is the same `--celebration-bg-cool` as the rule above; only the border-box layer on
   top of it is this rule's own. (The metal itself is not a design token - the system names no
   silver - so that gradient stays a literal, and honestly so.) */
.tf-poster.silver {
  border: 2px solid transparent;
  background:
    var(--celebration-bg-cool) padding-box,
    linear-gradient(135deg, #f4f6fa, #aab2c0 45%, #7d8698 55%, #f4f6fa) border-box;
}

.tf-poster-mark {
  font-size: 52px;
  line-height: 1;
}

/* The design's 0.24em status label. It is the app's MUTED label, not the lime eyebrow – U0's ⚠
   about `.tf-champ-label` applies to exactly this word. */
.tf-poster-status {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.24em;
  /* Tracking is trailing space on the LAST glyph, so a centred line sits half of it to the left.
     The padding takes it back off the content box, which re-centres the word. */
  padding-left: 0.24em;
  color: var(--ink-soft);
}

.tf-poster-name {
  margin: 4px 0 0;
  font-family: var(--font-heading);
  font-size: 33px;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.05;
  text-wrap: balance;
}

.tf-poster.champ .tf-poster-name {
  color: var(--accent);
}

/* THE MOMENT. 198px square, the design's own `champion-photo` slot (192 for M's `runnerup-photo`).
   ⚠ THE DESIGN MAKES THIS `flex: 1` and we do not, and the reason is the owner's Q5: his card is a
   height-bounded screen where "the photo is the only thing that stretches, so Continue never leaves
   the fold", and OURS lives in a scrolling takeover where nothing is squeezed in the first place.
   `flex: 1` there means `flex-basis: 0` here, which on a replaced element in a content-sized column
   collapses the photograph to nothing. The rule the design is protecting - the button is never the
   thing that gives way - holds by construction once the card can scroll. */
.tf-poster-photo {
  flex: none;
  width: 198px;
  height: 198px;
  max-width: 100%;
  margin: 12px 0 0;
  object-fit: cover;
  border: 1px solid var(--line);
  border-radius: var(--radius-frame);
  box-shadow: var(--shadow-card-lift);
}

.tf-poster.silver .tf-poster-photo {
  width: 192px;
  height: 192px;
}

.tf-poster.champ .tf-poster-photo {
  border-color: var(--accent-soft);
}

.tf-poster-line {
  margin: 12px 0 0;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ink-2);
}

.tf-poster.champ .tf-poster-line b {
  color: var(--accent);
}

.tf-poster-sets {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 6px 0 0;
  font-size: 19px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.tf-poster-chips {
  justify-content: center;
  margin-top: 12px;
}

.tf-poster-points {
  margin: 10px 0 0;
  font-size: 19px;
  font-weight: 800;
  color: var(--accent);
}

/* THE ROUND STRIP. One column per round she played (the design draws four; a Local is three and a
   National is five), hairline-separated, each carrying the round, who was across the net, the score
   and the verdict. `margin-top: auto` pins it to the foot of the poster. */
.tf-path {
  display: grid;
  width: 100%;
  margin: 16px 0 0;
  padding: 11px 2px;
  border: 1px solid var(--line);
  border-radius: var(--radius-frame);
  background: rgba(255, 255, 255, 0.03);
}

.tf-path-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0 4px;
  min-width: 0;
  border-left: 1px solid var(--line);
}

.tf-path-cell:first-child {
  border-left: none;
}

.tf-path-round {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink-2);
}

.tf-path-cell.lost .tf-path-round {
  font-weight: 800;
  color: var(--danger);
}

.tf-path-opp {
  font-size: 10.5px;
  color: var(--ink-soft);
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.tf-path-opp b {
  font-weight: 700;
  color: var(--ink-2);
}

.tf-path-score {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--ink-soft);
  line-height: 1.25;
}

.tf-path-icon {
  margin-top: 2px;
  color: var(--accent);
}

.tf-path-cell.lost .tf-path-icon {
  color: var(--danger);
}

.tf-poster-cta {
  width: 100%;
  margin-top: 14px;
}
</style>
