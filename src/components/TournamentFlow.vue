<script setup lang="ts">
// feat/tournament-experience – the foreground tournament. A full-screen overlay (like onboarding),
// auto-shown whenever the snapshot carries a `pending` reveal. The player walks the kid's bracket
// round by round: a VS pre-match card (watch or skip), a post-match box score, a between-rounds
// path strip, and a champion/eliminated finale. The result is already committed by the engine –
// this is presentation (Q&A 12), never a re-decision.
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { useKidEmotion } from '../composables/kidEmotion'
import { finaleUrl } from '../art/preload'
// THE REAL SILVERWARE, and the flight that carries it to the cabinet – see the ⚠ over
// `herTrophy` and over `continueFinale`.
import { trophyArtUrl, trophyMetalFor } from '../art/trophies'
import { armTrophyFlight } from '../composables/trophyArrival'
import { facePoint } from '../art/faceRects'
import { venueArtUrl } from '../art/venues'
import MatchViewer from './MatchViewer.vue'
import SurfaceMark from './ui/SurfaceMark.vue'
import MatchScene from './MatchScene.vue'
import BracketTabs from './BracketTabs.vue'
import ConfirmDialog from './ConfirmDialog.vue'
import AppIcon from './ui/AppIcon.vue'
import Card from './ui/Card.vue'
import ConfettiBurst from './ui/ConfettiBurst.vue'
import IconButton from './ui/IconButton.vue'
import PrimaryPill from './ui/PrimaryPill.vue'
import ProgressRing from './ui/ProgressRing.vue'
import TakeoverShell from './ui/TakeoverShell.vue'
import { playSfx, primeSfx } from '../audio/sfx'
import { simulateMatch } from '../engine/match/engine'
import { annotateMatch } from '../engine/match/rally'
import { computeMatchStats } from '../engine/match/matchStats'
import { surfaceStyleHint } from '../engine/match/style'
import { JUNIOR_TOUR } from '../engine/season/tournament'
import { TIERS } from '../engine/season/calendar'
import { KID_ID, flipScore, prizeCentsFor } from '../engine/world'
import { LADDER_LABEL } from '../shared/protocol'
import { formatShortName, rankLabel, shortTierLabel } from '../shared/format'
import { formatCents } from '../shared/money'
import { weekLabel, weekRange } from '../shared/dates'
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
// ⚠ THE RANKS ON THIS OVERLAY COME FROM THE TABLE THE TOURNAMENT IS PLAYED ON (31.07,
// fix/ladder-separation). The owner, after a National: «по итогам матча national в таблице пишут # из
// international, надо проверить всё разделение хорошо». This read `snapshot.kidRank`, which is the ITF
// alias, while the opponent's came off `fullRanking` on the engine side - so both numbers on the VS
// card, the pre-match scene, the box score and the live viewer's head-plates were international ones,
// on a week she was playing for national points. Two currencies with no exchange rate
// (docs/specs/two-ladders.md), and this is the one screen where both players' numbers sit side by side.
//
// The engine answers it now (`PendingView.ladder` / `.kidRank` / `.opponent.rank`), for the same reason
// `temperatureC` rides on the pending view: the event has already left `upcoming` by the time it is
// played, so a component re-deriving "which ladder is this" is a second place to get it wrong.
const kidRank = computed<number | null>(() => pending.value?.kidRank ?? null)
/** "National" / "International" - the player-facing name of the table these numbers are in, defined
 *  once in LADDER_LABEL so this screen cannot invent a seventh word for it. */
const ladderLabel = computed(() => LADDER_LABEL[pending.value?.ladder ?? 'domestic'])
/** ...and the shared "#N or Unranked" rule, so a girl with no counting result in THIS table is not
 *  introduced on the splash as the tie floor she shares with half the field. */
const kidRankText = computed(() => rankLabel(kidRank.value ?? 0, kidRank.value !== null))
// HOW OLD THE TWO OF THEM ARE, on the card that introduces them (the owner: «и в турнирах перед
// матчем тоже можно показывать»). BOTH sides or neither: one girl's age printed opposite a blank is
// a comparison the reader cannot finish, and the comparison is the point at a junior event.
//
// ⚠ TWO CLOCKS AND THEY ARE BOTH HONEST. Hers moves on her birthday (`kidAgeAt`, the one-clock ruling
// of 09.08); a rival's moves at the season boundary, because a cohort girl has no birth date to be
// exact about (engine/world/age.ts says so in as many words). Whole years on both sides, so what the
// card compares is like with like. The opponent's rides on the pending view off the FROZEN match
// player - see `PendingView.opponent` - and is null on a reveal saved before ages were composed.
const kidAge = computed<number | null>(() => game.snapshot?.ageYears ?? null)
const oppAge = computed<number | null>(() => pending.value?.opponent.ageYears ?? null)
/** Print an age only when BOTH are known, for the reason above. */
const showAges = computed(() => kidAge.value !== null && oppAge.value !== null)
// Snapshot.week stays pinned to the event's own week for the whole reveal (tickWeek never
// advances again while paused), so this doubles as the tournament's real date range.
const weekDates = computed(() => weekRange(game.snapshot?.week ?? 0))
/** THE SAME WEEK, IN THE GAME'S OWN SHORT FORM: "W36 '35" (owner, R17 #9). `weekLabel` is where that
 *  format is spelled and it already ships on Home and in the practice header - the header line has
 *  room for a week, not for "Sep 1-7, 2035", and re-spelling it here is how two screens come to name
 *  the same week two ways (shared/dates.ts says so at the top of `weekLabel`). */
const weekShort = computed(() => weekLabel(game.snapshot?.week ?? 0))

// --- Round 5 item 6: pre-tournament splash ------------------------------------
const tier = computed(() => (pending.value ? TIERS[pending.value.tier] : null))
const drawSize = computed(() => tier.value?.drawSize ?? 0)

// Round 5 item 11 fallback: lost the final => silver-styled card, serious art, "Runner-up".
const isRunnerUp = computed(() => !pending.value?.kidChampion && pending.value?.finishLabel === 'Runner-up')
/** WHICH PAINTING the finale poster hangs. Champion = the happy frame – and note WHAT IS IN IT
 *  (docs/lore/setting.md): "earned delight, holding a small club trophy or a medal, confetti of
 *  the cheap paper kind".
 *
 *  ⚠ THE SECOND HALF OF THIS NOTE IS SPENT, AND THE OWNER SPENT IT. It used to read: "That is the
 *  owner's §5 ruling in one line – L's confetti is a comparable effect we ALREADY ship, painted
 *  into the photograph, so this screen reuses it instead of rebuilding eighteen falling rectangles
 *  over the top of it." The argument was that the painting is the confetti. He looked at the
 *  shipped screen and disagreed, twice in one message: «На втором месте нет конфетти на финальном
 *  экране... Мне кажется на втором тоже можно. Всё-таки подиум. На первом тоже нет конфетти.»
 *
 *  AND HE IS RIGHT ABOUT THE THING THE ARGUMENT MISSED. Painted-in confetti is part of a
 *  PHOTOGRAPH, and a photograph is a record of a moment that has already happened. Falling paper is
 *  the moment happening now, which is what a finale is for – and the runner-up's poster hangs
 *  `serious`, a painting with nothing celebratory in it at all, so on second place the old argument
 *  did not even have a picture to point at. Both posters get a real burst now
 *  (`ui/ConfettiBurst.vue`, ported from Tense Titans as he asked), the painting keeps its own job,
 *  and this computed is unchanged. */
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
 *
 * ⚠ AND IT WEARS THE ACCENT CAPSULE AGAIN (owner, 12.08: «Quarterfinal наверху раньше был выделен
 * цветом овалом вокруг, надо вернуть»). R17 #9 carried this value up onto the tournament's own line
 * through `headline-meta` - an array of strings, which cannot say that one of two facts is louder -
 * and the oval it had worn since 30.07 went with the shape. It is handed over as `headline-badge`
 * now; see the note on the `<TakeoverShell>` binding, which is where the owner's words would have
 * gone if a template could hold them.
 */
const watchedRoundLabel = computed(() => {
  const p = pending.value
  if (!p) return ''
  if (replayAdvances.value) return p.roundLabel
  return p.bracket[p.bracket.length - 1]?.roundLabel ?? p.roundLabel
})

/**
 * THE PRE-MATCH PREVIEW'S CONTEXT, for the viewer's commentator intro (round 16, owner's own ask).
 *
 * Two fields and both are already on the pending view: the tier decides how much the intro says (the
 * ladder of voices - viz/preview.ts) and, with the round, what winning this match is worth.
 *
 * ⚠ IT READS `watchedRoundLabel`, NOT `pending.roundLabel`, for the reason that computed exists: on
 * the "Watch again" path the reveal has already advanced the pointer, so the round on deck is not the
 * round in the viewer. Getting that wrong here would be worse than on the badge - the badge would
 * name the wrong round, this would also quote the wrong POINTS for it.
 */
const viewerPreviewEvent = computed(() => {
  const p = pending.value
  if (!p) return null
  return { tier: p.tier, roundLabel: watchedRoundLabel.value }
})

/** WHICH SCREEN THIS FLOW IS SHOWING, for the takeover's scroll reset (owner, 31.07 - see the
 *  `screen` prop on `ui/TakeoverShell.vue`). `phase` is most of it and is not all of it: `replayOpen`
 *  swaps the live match in and out INSIDE the 'pre' and 'post' phases, and going from the match to
 *  its box score is exactly the transition that used to land the player halfway down the page. The
 *  value is never read for meaning - only for change - so a pair of them joined is the honest shape.
 *  Deliberately NOT the round: a new round with the same phase is the same screen showing new facts,
 *  and the player has not gone anywhere. */
const watchedScreen = computed(() => `${phase.value}:${replayOpen.value}`)

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
/** Winner's CHEQUE at this tier – the design's "Prize Money" fact, read through `prizeCentsFor`
 *  because types.ts names that function the payout table's ONLY reader and this screen must not
 *  become a second one. 0 on the whole junior tour (juniors pay to play – the game's thesis), and
 *  the template renders that zero as the dash it always was. */
const winnerPrizeCents = computed(() => (pending.value ? prizeCentsFor(pending.value.tier, 0) : 0))
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

/**
 * ⚠ THE MARK IS THE REAL TROPHY NOW, AND THE OWNER'S §4 Q4 RULING IS SPENT BY BEING KEPT (31.07).
 *
 * This used to be `pending.kidChampion ? '🏆' : '🥈'` under a note reading "the trophy and the medal
 * are the art we already ship (owner, §4 Q4) – no slot to fill, nothing to draw". That was true when
 * it was written and the ruling it cites has not changed: `docs/specs/ui-inventory.md` §4 Q4 says of
 * the trophy and the silver medal, "use what we already ship". WHAT WE SHIP CHANGED. Eighteen
 * painted cups arrived with the Trophy Cabinet – nine tiers, gold and silver each – so the emoji is
 * no longer the art we already ship, it is a placeholder standing in front of it.
 *
 * The owner, looking at the finished cabinet: «раз у нас есть реальные трофеи, мы бы могли их как
 * есть рисовать в призах вместо текущих общих эмоджи, каждый титул станет индивидуальным».
 *
 * AND THE LAST FOUR WORDS ARE THE FEATURE. A generic cup made a Local Open and a J300 the same
 * screen with a different word on it; the whole ladder is nine rungs of "the same week, worth more",
 * and this is the one moment in the game where a rung is supposed to feel like an object. The
 * painted J300 cup is not the painted local one, so a title now looks like the title it is.
 *
 * ⚠ THE URL COMES FROM `art/trophies.ts`, NOT FROM A SECOND STRING HERE. The cabinet draws these
 * same eighteen files, and two components composing one filename is precisely how the champion
 * splash 404'd once already (`art/preload.ts`, the `-fs8` note). One builder, two callers.
 */
const herTrophy = computed(() =>
  pending.value ? trophyArtUrl(pending.value.tier, trophyMetalFor(pending.value.kidChampion)) : '',
)
/** The GOLD of this tier, for the poster where somebody else lifted it.
 *
 *  ⚠ IT IS NOT HERS AND THE POSTER NEVER SAYS IT IS: that card's own name line is the AI champion's,
 *  and her finish is the line under it ("K. Weber – Semifinalist"). The object still belongs on it,
 *  because a trophy WAS handed out at that event – it is the third emoji the owner's «вместо текущих
 *  общих эмоджи» names, and leaving one 🏆 on the third of three sibling posters would have been two
 *  art styles for one screen. Nothing flies to the cabinet from this card, and nothing should: her
 *  ledger did not gain a piece of silverware this week. */
const eventGoldTrophy = computed(() => (pending.value ? trophyArtUrl(pending.value.tier, 'gold') : ''))
/** The poster's mark, measured at take-off – see `continueFinale`. Only the podium poster carries
 *  it: it is the only card whose trophy has anywhere to go. */
const posterMark = useTemplateRef<HTMLImageElement>('posterMark')

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
/**
 * Continue – and, when she is taking something home, the trophy goes to the cabinet in front of her.
 *
 * The owner: «Можно даже анимацию сделать "добавления трофея в раздел трофеев" с точечкой зеленой по
 * итогу». The flight itself is rendered by `App.vue`, because it crosses a boundary this component
 * cannot: it starts inside a full-screen takeover and lands on the bottom tab bar, which is the
 * shell's and is about to be uncovered. See `composables/trophyArrival.ts`.
 *
 * ⚠ ARMED SYNCHRONOUSLY, BEFORE THE AWAIT, and both halves of that matter:
 *   * the mark is measured while it is still on screen – one tick later the takeover is unmounting
 *     and there is no rect left to read;
 *   * arming also HOLDS THE TAB DOT, and it has to do so before the bar is uncovered. The ledger
 *     gained this trophy when the engine finalised the run, several taps ago, so the dot's fact is
 *     already true behind the overlay; without this ordering the dot would be sitting on the tab
 *     before the trophy set off towards it.
 *
 * ⚠ ONLY FROM THE PODIUM. `kidChampion || isRunnerUp` is exactly the pair of finishes that put a
 * piece of silverware in her cabinet – gold and silver, and there is no third (a knockout draw
 * leaves two losing semi-finalists and no play-off). A flight from the poster where somebody else
 * won would animate a cabinet entry that does not exist.
 *
 * Under `prefers-reduced-motion` this arms nothing and says so; the trophy is in the cabinet either
 * way and the dot appears at once. Less motion is not less information.
 */
async function continueFinale(): Promise<void> {
  if (pending.value?.kidChampion || isRunnerUp.value) armTrophyFlight(herTrophy.value, posterMark.value)
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
// ⚠ RE-AIMED (owner, 04.08: «applause on the finals screen has broken»). R10-6 above moved the
// celebration onto the deciding point, which is right — but it left the CHAMPION CARD silent for
// the one player who does what the game is built for: he watches his finals. From his seat the
// screen with the trophy on it makes no sound, and "broken" is a fair description of that.
//
// So the card always sounds now, and the two beats stay distinct rather than doubling: if nobody
// clapped at the deciding point (skip / skip-tournament / resumed into the finale) the card carries
// the full `applauseFinal`; if the viewer already played it a click ago, the card takes the SHORT
// cue — a second, smaller swell under the trophy rather than the same big clip twice.
watch(
  phase,
  (p) => {
    if (p !== 'finale') return
    if (!pending.value?.kidChampion && !isRunnerUp.value) return
    const alreadyCelebrated = finaleSoundPlayed
    finaleSoundPlayed = true
    playSfx(alreadyCelebrated ? 'applauseShort' : 'applauseFinal')
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
  <!-- ⚠ THE TAKEOVER IS A COMPONENT NOW - the owner's 30.07 ruling, quoted in full on the script
       side (house convention: his words live where Cyrillic is allowed): he counted a FOURTH place
       the match viewer lives in, and asked for one overlay component with no duplicated code.
       The layer, the header and the scroller were hand-written here, in
       PracticeFlow and in MatchReplay - three copies that agreed - while the FOURTH match surface,
       SeasonScreen's sandbox exhibition, had none of them and was inline on a tabbed screen. That is
       how it ended up with its pinned control bar behind the tab bar. `ui/TakeoverShell.vue` owns the
       three parts now; the classes, the layout and this screen's five phases are unchanged, and the
       header's exit stays a SLOT because the four surfaces mean four different things by it. -->
  <!-- ⚠ `screen` IS WHY THE BRIEF NO LONGER OPENS HALFWAY DOWN (owner, 31.07: «after a transition
       between screens, always land at the top of the new screen»). One shell holds five of them here
       and the scroller between them is never unmounted, so the box score inherited however far the
       player had scrolled the match, and the poster inherited the box score. `phase` alone is not the
       whole answer - `replayOpen` swaps the live match in and out WITHIN a phase - so the key is the
       pair, which is exactly `watchedScreen`. -->
  <!-- `tf-fit` marks the ONE phase whose body is a fitted column rather than a scroller: the
       pre-match card. The class lands on the shell's root via Vue's attribute fallthrough, and the
       scoped rules below reach the body through it - see the F section of the style block. -->
  <!-- ⚠ THE TITLE DROPS THE TOURNAMENT'S GENERIC NOUN WHILE A MATCH IS ON SCREEN, and only there
       (owner, R17 #9: the word "Championship" can come off in the header). "Regional Championship"
       is "Regional" on the one line that is short of room and that the reader is already inside;
       the brief, the pre-match card, the box score, the poster and every letter still say the whole
       name. See `shortTierLabel` in shared/format.ts for why it is a list of three and not a
       drop-the-last-word rule. -->
  <!-- ⚠ THE ROUND GOES IN AS `headline-badge` AND NOT AS A SECOND `headline-meta` ITEM (owner,
       12.08 - his words are with `watchedRoundLabel` in the script above, because THIS IS A TEMPLATE
       and the app's rule, pinned in tests/round13-nav.test.ts, is that no Cyrillic appears inside
       one, comments included). It rode up onto this line from the sub line in R17 #9 and lost the
       accent oval it had worn since 30.07 on the way - both facts arrived through one array, and an
       array of strings has no way to say that one of them is the loud one. The week is a date stamp;
       the round is where she has got to. `watchedRoundLabel` still names the round IN THE VIEWER
       rather than the round on deck - see its own note for the mislabel that distinction fixes. -->
  <TakeoverShell
    v-if="pending"
    :title="phase === 'splash' ? null : replayOpen ? shortTierLabel(pending.tierLabel) : pending.tierLabel"
    :headline-meta="replayOpen ? [weekShort] : null"
    :headline-badge="replayOpen ? watchedRoundLabel : null"
    :screen="watchedScreen"
    :class="{ 'tf-fit': phase === 'pre' && !replayOpen }"
  >
    <!-- NO HEADER ON THE E BRIEF, which is what the `null` above buys: the hero underneath carries
         the tournament's name, its court and its dates, and the design gives that screen a bare
         back-arrow rather than a title bar. Every other phase still needs to be told which
         tournament this is. -->
    <!-- ⚠ THE SUB LINE IS NOT DRAWN AT ALL WHILE A MATCH IS ON SCREEN (owner, R17 #9: the date
         becomes "W36 '35", and the date and the round move up onto the tournament's line).
         It has moved onto the title line as `headline-meta` above, and the row it used to occupy is
         25.75px of a 667px-tall phone - measured, in Chromium: the header goes 74.39 -> 48.64px, and
         the commentary log under the court is the flexible row that takes it (MatchViewer's
         `.mv-log` is the only thing in the stack that gives).
         ⚠ THE ROUND IS SPELLED OUT AND IT FITS, WHICH IS A MEASUREMENT AND NOT A HOPE. It was the
         item's own risk: with the full tournament name, `Regional Championship` (188.5px of Sora
         17/600) + `W36 '35` (44.2) + `Quarterfinal` (68) is 320.3px against the 283.8px the exit
         control leaves at the 16px gutter - it wraps, and a wrapped line hands the row straight back.
         Dropping the generic noun from the name (see the title binding above) is what bought the
         room: the worst line in the whole ladder is now `Junior Tour 300` + the week + `Round of 128`
         = 254.6px, 29.2px inside the budget, so nothing has to be abbreviated. Re-run
         `node tools/header-probe.mjs` if either string ever grows.
         The SURFACE was already standing down here (the court is painted in it 20px lower, so the
         word was the second saying of a fact made of pixels), so nothing else is lost. Every other
         phase keeps the whole sub line: the preview, the pre-match card, the box score and the
         poster have no court to read the surface off and no match to be short for. -->
    <template v-if="!replayOpen" #sub>
      <!-- ⚠ ADOPTED AT THE INTEGRATION MERGE: this was the last hand-written surface readout, and
           the icon-system branch that made `SurfaceMark` listed this exact line as its pending
           adoption. Its own note is worth keeping in mind - one of the three copies had `surf-clay`
           HARD-CODED beside the word "clay", so every other court showed an orange ring labelled
           clay. -->
      <SurfaceMark :surface="pending.surface" size="sm" />
      <span class="hint tf-week-dates">{{ weekDates }}</span>
    </template>

    <template #exit>
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
      <button v-if="replayOpen" class="link" :disabled="game.busy" @click="endReplay">To result</button>
      <button
        v-else-if="!pending.finished && phase !== 'finale'"
        class="link"
        :disabled="game.busy"
        @click="skipAll"
      >
        Skip all rounds
      </button>
    </template>

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
             resolved. It is the design's back-arrow, on the hero where the design puts it (§E puts
             it at the top).
             ⚠ THE LAST HAND-WRITTEN BACK CONTROL IN THE APP, NOW THE SHARED ONE - the owner's 30.07
             ruling (quoted on the script side): one back component everywhere, used consistently,
             just the icon with a white fill. It was a glass pill reading "← Back" - a `&larr;`
             CHARACTER plus a word,
             on a plate nothing else in the app wears - while three screen headers had already been
             converted to `IconButton variant="bare" icon="back"`. Now all four are the same control
             and the same asset (`public/icons/back.svg`, the owner's own drawing), and
             tests/ui-control-system.test.ts's allowlist of hand-written back arrows is empty.
             WHAT THIS SCREEN STILL OWNS is where it sits and what colour it is: white rather than the
             `.back-link` muted, because it is the only one standing on a photograph. -->
        <IconButton
          class="back-link tf-hero-back"
          variant="bare"
          icon="back"
          label="Back"
          :disabled="game.busy"
          @click="$emit('back')"
        />
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
      <!-- ⚠ ALL FOUR GLYPHS ARE ASSETS NOW, NOT INLINE PATHS (owner, 30.07: the prize-money icon had not updated, check it - and he was right, nothing had changed on screen). His own
           `dollar.svg` had been sitting in public/icons since that morning with a note asking for
           this exact swap, and `trophy.svg` / `spectators.svg` had been lifted OUT of the three
           inline `<svg>`s below so the tiles could adopt them without redrawing anything. The
           paths are deleted with the markup that held them: the whole point of an asset is that
           there is no second copy to drift, and a dead `d=` attribute is the next drift.
           The surface tile takes `SurfaceMark` for the same reason («Surface type similar icon
           across every screen – it means this icon is not a component»); it was the app's last
           hand-written ring. `:show-name="false"` because the tile labels itself underneath.
           SIZE STAYS 19px, the size the inline SVGs were, so the 34px tiles are unchanged. Colour
           comes from `.tf-fact-tile`'s own `--ink-2` through `currentColor` - see AppIcon. -->
      <div class="tf-facts">
        <div class="tf-fact">
          <span class="tf-fact-tile" aria-hidden="true">
            <SurfaceMark :surface="pending.surface" :show-name="false" />
          </span>
          <span class="tf-fact-label">Surface</span>
          <span class="tf-fact-value surface">{{ pending.surface }}</span>
        </div>
        <!-- "Prize Money" is the design's own third fact. The DASH was written when it was true of
             every event in the game, and on the junior tour it still is (engine/season/calendar.ts,
             "the junior international tour – no prize money"): the family carries the year; she
             collects points. That premise earns the cell – and since task #17 the W rungs BREAK it
             on purpose, which is the other half of the same story: the cheque is the first money
             the tennis itself has ever produced. So the cell reads the tier's own payout table
             (via `winnerPrizeCents` – the engine's one reader of it) and prints the winner's
             cheque where one exists, the dash where none does. A W15 card saying "–" over a
             $2,200 title was the stowaway the living-field smoke caught. -->
        <div class="tf-fact">
          <span class="tf-fact-tile" aria-hidden="true">
            <AppIcon name="dollar" :size="19" />
          </span>
          <span class="tf-fact-label">Prize money</span>
          <span
            v-if="winnerPrizeCents > 0"
            class="tf-fact-value"
            title="The winner's cheque at this tier"
            >{{ formatCents(winnerPrizeCents) }}</span
          >
          <span v-else class="tf-fact-value" title="The junior tour pays no prize money at any level">–</span>
        </div>
        <div class="tf-fact">
          <span class="tf-fact-tile" aria-hidden="true">
            <AppIcon name="trophy" :size="19" />
          </span>
          <span class="tf-fact-label">Winner</span>
          <span class="tf-fact-value">{{ winnerPoints }} pts</span>
        </div>
        <div class="tf-fact">
          <span class="tf-fact-tile" aria-hidden="true">
            <AppIcon name="spectators" :size="19" />
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
        <!-- Both ranks are read off the table THIS tournament is played on, and the panel says which
             one that is - a bare "#118" beside a bare "#4" is a comparison, and a comparison across
             two tables with no exchange rate is a lie. See `kidRank` above. -->
        <div class="tf-first-grid">
          <div class="tf-first-side">
            <div class="tf-first-flag">{{ kidFlag }}</div>
            <div class="tf-first-name">{{ kidShort }}</div>
            <div class="tf-first-rank">{{ kidRankText }}</div>
            <!-- Age, both sides or neither - see `showAges`. -->
            <div v-if="showAges" class="tf-first-age">Age {{ kidAge }}</div>
          </div>
          <div class="tf-first-vs">VS</div>
          <div class="tf-first-side mirrored">
            <div class="tf-first-flag">{{ flagEmoji(pending.opponent.nation) }}</div>
            <div class="tf-first-name">{{ pending.opponent.name }}</div>
            <div class="tf-first-rank">
              {{ pending.opponent.rank === null ? 'Unranked' : '#' + pending.opponent.rank }}
            </div>
            <div v-if="showAges" class="tf-first-age">Age {{ oppAge }}</div>
          </div>
        </div>
        <p class="hint tf-first-ladder">{{ ladderLabel }} ranking</p>
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
          <!-- ⚠ JUST THE WORD - the owner, 30.07: on begin, simply drop the arrow. The arrow was doing
               nothing the button was not: a lime CTA at the foot of a brief is already the way
               forward, and §E's own copy for this control is one word. The design's onboarding CTA
               is "Begin" bare as well, so the two now match. -->
          <PrimaryPill variant="cta" :disabled="game.busy" @click="beginFromSplash">Begin</PrimaryPill>
        </div>
      </Card>

      <!-- R9-9b: the post-deadline withdrawal, behind a confirm. -->
      <button class="link tf-skip-entry" :disabled="game.busy" @click="showSkipConfirm = true">
        Skip this event – withdraw
      </button>
    </template>

    <template v-else>
      <!-- Path so far. NOT on the finale: the L/M poster carries her whole path as its own round
           strip (design §L), and printing it twice, one card apart, is the same list said twice.
           ⚠ AND NOT WHILE A MATCH IS ON SCREEN EITHER (owner, 31.07: the live match screen was
           showing the rounds already played above the court, and «inside the match the screen should
           be the match and information about the match, nothing else»). This strip is the LAST piece
           of tournament furniture that was still being drawn over the top of the viewer: the draw
           below it already stands down on `!replayOpen` (see `showBracket`), the round badge and the
           surface pill already trade places on the header's date line for exactly this reason, and
           the outer `.tf-card` frame came off on 30.07 to buy the court its width back. A list of
           finished matches is the clearest case of all - it is the one thing on this screen that is
           about OTHER matches, it is several rows tall, and it pushes the court down the scroller on
           the one screen where the court is the whole point. Nothing is lost: between rounds (and on
           the box score, and on the poster) the strip is still exactly where it was, and the draw
           tabs below carry the same results in more detail. -->
      <div v-if="pending.bracket.length && phase !== 'finale' && !replayOpen" class="tf-strip">
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
           ⚠ AND THE `.tf-card` AROUND IT IS GONE TOO, WHICH IS THE OTHER 36px - the owner, 30.07:
           the match screen has a double frame that eats space, drop the outer contour.
           It was a 16px-padded, hairline-bordered panel wrapped around a STACK of panels
           the viewer draws itself - `.mv-panel`, `.mv-log` (and, until 12.08, `.mv-boxscore`) are
           each a `Card`, so
           the outer box was a second border around a border and 34px of horizontal padding around
           nothing. Measured at 375pt: the canvas went 291 -> 327px wide and the painted court with
           it (244.4 -> 274.9px), and the panel lost 32px of height. The viewer now hangs straight
           off the takeover's own scroller, which is what the other three match screens do as well.
           The section it used to live in went with the class: the `v-if` sits on the component, so
           the phase chain is unchanged and there is no wrapper left to grow a border again.
           ⚠ AND IT SAYS `mode="replay"` NOW, WHERE IT USED TO SAY NOTHING AT ALL - which was a lie
           the prop's own default told for it. `MatchViewer.mode` defaulted to `'live'` "so existing
           call sites need no change", and this was the call site that took the default: the busiest
           match screen in the app blinked a red "Live" badge over a bracket the ENGINE had already
           resolved during the tick, which is the same contract stated at the top of this file
           (Q&A 12 - presentation, never a re-decision). The default is gone with this line: `mode`
           is a REQUIRED prop now, so the next call site has to say which it is instead of inheriting
           the wrong answer. Nothing else on this screen moves - the badge goes, and with it the
           shout, because a match already in the save file cannot be shouted at. The only genuinely
           live surface left is SeasonScreen's sandbox exhibition, generated at click time.
           ⚠⚠ AND THE OWNER HAS RULED, 30.07, so the lever below IS taken: live means "watch it" and nothing else; everything else is replay. That is a cleaner definition than the one this
           file was using. "Live" here does not mean the engine has not decided yet - it never has,
           for any surface but the sandbox. It means THE PLAYER HAS NOT SEEN IT YET. A first watch is
           an outcome he does not know; a re-watch is a recording of one he does.
           `replayAdvances` is exactly that distinction and always was (true when opened from the
           pre-match card, false on the box score's "Watch again"), so the badge and the shout land on
           a round's first watch and stay off every re-watch.
           ⚠ AND IT DOES NOT EJECT ANY MORE (R17 #10, `proceed-label`). `@finish` used to fire the
           instant the last beat played and `endReplay` swapped the phase in the same flush - so the
           viewer's own box score, the one round 16 put "she retired hurt" on, never painted a single
           frame and the owner watched a retirement go by as a scoreline for a second round running.
           The handler is unchanged; naming a label is what turns the eject into a button the player
           presses when she is ready. "To the result" is the header exit's own words, because it goes
           to the same place. -->
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
      :preview-event="viewerPreviewEvent"
      :mode="replayAdvances ? 'live' : 'replay'"
      proceed-label="To the result"
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
      fill
    >
      <div class="tf-scene-grid">
        <div class="tf-scene-side">
          <div class="tf-scene-name">{{ kidShort }} {{ kidFlag }}</div>
          <!-- The pre-match card carries the age too - the same two facts as the splash, in the
               screen's own register. Both sides or neither; see `showAges`. -->
          <div class="tf-scene-rank">{{ kidRankText }}<template v-if="showAges"> · Age {{ kidAge }}</template></div>
        </div>
        <div class="tf-scene-vs">vs</div>
        <div class="tf-scene-side mirrored">
          <div class="tf-scene-name">{{ pending.opponent.name }} {{ flagEmoji(pending.opponent.nation) }}</div>
          <div class="tf-scene-rank">
            {{ pending.opponent.rank === null ? 'Unranked' : '#' + pending.opponent.rank
            }}<template v-if="showAges"> · Age {{ oppAge }}</template>
          </div>
        </div>
      </div>
      <!-- ⚠ SKIP FIRST, WATCH SECOND (owner, 30.07: swap the skip and watch-it buttons on the pre-match screen, it reads more logically). It is the app's own order everywhere else and this
           card was the outlier: `.dialog-actions` puts Cancel before Confirm, the box score below
           puts "Watch again" before "Next →", and the friendly's own two are in the same pair. The
           affirmative belongs under the thumb, which on a phone is the right-hand end of the row -
           and "the one you usually want is where your thumb already is" is the whole argument. Only
           the ORDER moved: same handlers, same `.primary` on the same button, same `.sfx-watch`. -->
      <div class="tf-actions">
        <button :disabled="game.busy" @click="showResult">Skip</button>
        <button class="primary sfx-watch" :disabled="game.busy" @click="watchMatch">Watch match</button>
      </div>
    </MatchScene>

    <!-- Post-match box score -->
    <section v-else-if="phase === 'post'" class="tf-card">
      <div class="tf-result-head">
        <span class="tf-badge" :class="kidWon ? 'win' : 'loss'">{{ kidWon ? 'Win' : 'Loss' }}</span>
        <span class="tf-scoreline num">{{ kidScore }}</span>
      </div>
      <!-- ⚠ THE RESULTS TABLE THE OWNER WAS LOOKING AT (31.07). It printed her ITF rank under her name
           whatever the tournament was, so a National box score introduced her as #118 in a table that
           had just paid her nothing. It names its ladder now, for the same reason the Stats screen
           does: a rank with no table beside it is only ever right by accident. -->
      <p class="hint" style="margin: 0 0 12px">{{ kidShort }} vs {{ oppShort }} · {{ ladderLabel }} ranking</p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>
              <span class="ph-name">{{ kidShort }}</span>
              <span v-if="kidRank !== null" class="ph-rank">#{{ kidRank }}</span>
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
        <button class="primary" :disabled="game.busy" @click="next">Next</button>
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
          {{ spectateRound < finalRound ? 'Next round' : 'Continue' }}
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
        <!-- THE TROPHY SHE ACTUALLY WON, painted, for THIS event's tier: gold on the champion
             screen, silver on the runner-up screen. Still "the art we already ship" (owner, §4 Q4) -
             what we ship simply grew eighteen painted cups since that ruling was written. See the
             note over `herTrophy` in the script for the owner's own words on it.
             Decorative: the poster says "Champion" or "Runner-up" in words on the very next line, in
             the colour of its own border and in the name below that, so a reader loses nothing.
             NOT lazy: it is the first thing on the card the player came here to see. -->
        <img
          ref="posterMark"
          class="tf-poster-mark"
          :src="herTrophy"
          alt=""
          aria-hidden="true"
          width="88"
          height="88"
          decoding="async"
        />
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
        <!-- The podium's paper, and it falls IN FRONT of the poster - which is why it is last in the
             card and carries the only z-index on this screen. Both posters get it, on the owner's
             ruling that a lost final is still a podium. Decoration and nothing else: aria-hidden,
             never a click target, and it does not mount at all under reduced motion. -->
        <ConfettiBurst class="tf-poster-confetti" />
      </Card>

      <!-- Exited earlier: the same poster with somebody else's name on it. No art for an AI
           champion, so the photograph's place is taken by her own finish line. -->
      <Card v-else class="tf-poster out">
        <!-- The event's gold, and the name under it is the girl who lifted it. No ref and no
             flight: nothing entered HER cabinet this week. -->
        <img
          class="tf-poster-mark"
          :src="eventGoldTrophy"
          alt=""
          aria-hidden="true"
          width="88"
          height="88"
          decoding="async"
        />
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

    <!-- ⚠ THE CONFIRM MOVED INSIDE THE SCROLLER, and it changes nothing about where it paints. It
         used to be a sibling of `.tf-body` inside the takeover; `.dialog-overlay` is
         `position: fixed; inset: 0; z-index: 60`, so it is laid out against the VIEWPORT and is not
         clipped by `.tf-body`'s `overflow-y: auto` (overflow alone creates no containing block for a
         fixed child, and no ancestor here sets transform/filter/contain). Its z-index still resolves
         inside `.tournament-flow`'s stacking context, exactly as before - the only reason it moved is
         that the shell has one content slot and an `overlay` slot for a single caller would be API
         nobody else needs. -->
    <ConfirmDialog
      v-if="showSkipConfirm"
      :message="skipConfirmMessage"
      confirm-label="Skip event"
      @confirm="confirmSkipEvent"
      @cancel="showSkipConfirm = false"
    />
  </TakeoverShell>
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

/* ⚠ `.tf-sub .tf-replay-round` WENT WITH THE SUB LINE (R17 #9). It was two corrections the round
   badge needed to ride on the date line - an 8px step and `inline-block`, because the capsule has
   vertical padding and an inline box would not reserve height for it. The date line is not drawn at
   all while a match is on screen now (the date and the round are up on the tournament's own line),
   so there is nothing left for those two declarations to correct. The CAPSULE itself is shared
   vocabulary and stays in `src/style.css`; what is gone is this screen's override of it, on the same
   rule `.mv-weather` went by: a selector with nothing to select is the next thing somebody re-adds a
   rule to. */

/* ⚠ `.tf-top > button { white-space: nowrap }` LEFT THIS BLOCK FOR `src/style.css`, 30.07. It is
   what keeps a header exit on one line ("To result →" wrapped in the first draft of the 30.07 slice
   and cost the header 23px), and it stopped being this screen's business when `ui/TakeoverShell.vue`
   made FOUR surfaces draw their header through one component. It could not simply move into the
   shell's scoped block either: the exit is SLOT content, so it carries the CALLER's scope id, never
   the shell's. The rule now sits beside `.tf-top` itself, which is where the header lives. */

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

/* THE HERO'S BACK CONTROL: placement and ink only, because the control itself is `IconButton` now.
   ⚠ WHAT LEFT THIS RULE, and why none of it is missed: the glass pill (a border, a translucent plate
   and two `backdrop-filter` declarations) and the type (`font-size` / `font-weight`, which a masked
   glyph has no use for). The owner asked for «просто иконка с белым fill» and the pill was the reason
   this one back control looked unlike the other three. The scrim above it is `rgba(6,10,14,.62)` at
   the top stop - see `.tf-hero-scrim` - so a white glyph has its contrast without a plate under it.
   WHITE, not `.back-link`'s `--muted`: `--ink` is the ink the two readings at the foot of this same
   photograph use, and muted grey on a lit court is the one place that class's default is wrong. The
   hover is `--accent` for every other IconButton and stays that way here.
   ⚠ THE COLOUR NEEDS BOTH CLASSES IN THE SELECTOR, and it is not a style choice - a one-class scoped
   rule LOST here and the button rendered muted (measured: rgb(142,155,164) on screen). `.back-link` in
   src/style.css is a bare class, but `IconButton`'s own `.tb-iconbtn--bare` is a scoped rule, so it
   carries a `[data-v-…]` of its own and ties a single scoped class of ours at (0,2,0) - and ties go to
   whichever component's block was injected last, which is import order and not something a screen
   should depend on. `.back-link.tf-hero-back` is (0,3,0) and wins outright. */
.back-link.tf-hero-back {
  position: absolute;
  top: 12px;
  left: 12px;
  color: var(--ink);
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

/* Her age, one step quieter than the rank above it: on this card the rank is the headline and the
   age is context. Same tabular figures, so the two sides line up. */
.tf-first-age {
  margin-top: 1px;
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* WHICH TABLE the two numbers above are in – centred under the VS, because it qualifies both sides
   and belongs to neither. Quiet by design: it is a unit, not a fact about the match. */
.tf-first-ladder {
  margin: 8px 0 0;
  text-align: center;
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

/* ⚠ `flex: 1` IS BACK, AND THIS TIME THE WHOLE COLUMN IS SIZED FOR IT (owner, 02.08: «вернуть
   картину на весь экран, как в макете. И сделать высоту адаптивной, чтобы сыгранные матчи и всё
   изображение с кнопками влезали в экран по высоте без скролла»). R15-3 had set this to
   `flex: none` because stretching the 01.08 square letterboxed - and the square is what actually
   left: `fill` on the component releases the aspect (MatchScene owns that geometry, this rule owns
   only where the card sits) while the img stays `contain`, so the 01.08 whole-painting ruling holds
   at any height. The spare band goes ABOVE the art (`.scene--fill .scene-art` anchors it to the
   foot), so the plate still rides the painting - the exact complaint R15-3 had about the stretch.

   FULL-BLEED, as the design's F draws its art slot: the negative margins cancel `.tf-body`'s 24px
   gutters, and the corner/border come off with them - a card edge makes no sense on a surface that
   touches the screen edge. Doubled class beats `Card`'s scoped `.tb-card` radius/border at
   (0,3,0) vs (0,2,0) - the same tie `.back-link.tf-hero-back` documents; a single scoped class
   only ties it and injection order decides. */
.tf-scene.tf-scene {
  margin: 0 -24px;
  border: none;
  border-radius: 0;
}

/* THE FITTED BODY - the three shared-scroller amendments the pre card needs, keyed off `tf-fit` on
   the shell's root (which carries this component's scope id, so `:deep` reaches the body). They are
   NOT changes to `.tf-body` itself: every other phase - and this same shell one tap later, with the
   viewer open - keeps the scrolling column exactly as `src/style.css` declares it.
     * no scrollbar: the column is sized to fit by construction (strip and plate keep natural
       height, the scene absorbs the leftover down to `min-height: 0`), so `hidden` only asserts
       what the flex arithmetic already made true - and stops one stray pixel of rounding from
       minting a scrollbar over a screen the owner asked to fit;
     * no `::after` spacer: the takeover's 24px of bottom room is CONTENT (see style.css), and on
       the one screen whose art runs to the bottom edge that room would be a page-coloured skirt
       under the painting. */
.tf-fit :deep(.tf-body) {
  overflow-y: hidden;
}

.tf-fit :deep(.tf-body)::after {
  content: none;
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
/* `position: relative` is the confetti's doing and is part of the object now: the burst fills the
   poster with `inset: 0`, so the poster has to be the box it measures itself against. Same shape as
   Eyebrow's own note about hosting absolutely positioned art. */
.tf-poster {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 14px 14px;
  border-radius: var(--radius-card);
  background: var(--celebration-bg);
}

/* The burst is the only thing on the poster that is deliberately above everything else. The
   component sizes and clips itself (`inset: 0`, `border-radius: inherit`); this rule owns only the
   one thing the CALLER gets to decide, which is that the paper falls in front of the girl. */
.tf-poster-confetti {
  z-index: 1;
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

/* THE MARK IS A PAINTING NOW, NOT A GLYPH. It was `font-size: 52px` on a `<div>` holding an emoji;
   the type rules are gone with the emoji because an image has no use for them.
   88 rather than the emoji's 52: a cup is a tall object with a base, a bowl and two handles, and at
   52px the tier telling – which is the entire point of the swap – is not readable. It is still well
   inside the master's own resolution (`SET_MAX_SIDE.trophies = 384` in scripts/optimize-art.mjs is
   128 x 3, so 88px is drawn from more pixels than it needs on any display).
   `contain`, because the eighteen masters are not all the same aspect and a `cover` would crop the
   handles off the wide ones. */
.tf-poster-mark {
  display: block;
  width: 88px;
  height: 88px;
  object-fit: contain;
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
