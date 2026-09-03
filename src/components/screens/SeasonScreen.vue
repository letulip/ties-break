<script setup lang="ts">
// Package N – Season tab: the real yearly calendar (Package L/M). Next-8-weeks
// event cards with Enter/Withdraw behind ConfirmDialog, "My entries", a
// standings card, and – when the latest resolved week is a tournament week –
// a bracket card with a Watch -> MatchReplay link per kid match.
//
// Season planner (docs/specs/season-planner.md): OUTGROWN events disappear from the calendar
// (a UI filter – the engine keeps emitting them, so bench/history stay untouched), locked-ahead
// "Reach N pts" events stay visible, and every freed empty week becomes plannable via
// "+ Plan week" -> PlanWeekSheet (Practice / Vacation). A booked week renders with its package
// name and a Cancel. When she is worn out the screen OFFERS a rescue vacation – an offer, never
// an auto-book.
//
// ⚠ THE OWNER'S RULINGS BELOW ARE TRANSLATED, NOT SUMMARISED. This is a `.vue`, so its comments are
// English – and every ruling in this file is quoted in his own words, under its own date, in
// docs/decisions.md (17.08.2026, "eighteen owner rulings"). Translate one, never shorten it: the
// reasoning IS the record, and the record now lives in two places rather than one.
import { computed, ref } from 'vue'
import { useGameStore } from '../../stores/game'
import ConfirmDialog from '../ConfirmDialog.vue'
import MatchReplay from '../MatchReplay.vue'
import MatchViewer from '../MatchViewer.vue'
// R10-12: a booked friendly is enterable LIVE through this flow (VS card -> live viewer -> box
// score), instead of only being diggable out of the feed as a replay afterwards.
import PracticeFlow from '../PracticeFlow.vue'
import PlanWeekSheet from '../PlanWeekSheet.vue'
import TierGuide from '../TierGuide.vue'
// U0 – the shared components (docs/specs/ui-components.md). Season is the SECOND caller, and the
// point of it being second: an abstraction that only ever served the screen it was extracted from
// has been renamed, not extracted. Three of the five it uses needed nothing new to fit
// (ScreenShell, ProgressRing, PrimaryPill); Card needed its second SURFACE, which is written up in
// the component - the photograph card here and the notecard on Home were already two shared rules
// in the sheet, so the variant records a split that existed rather than inventing one.
import ScreenShell from '../ui/ScreenShell.vue'
// THE TAKEOVER, AND IT IS THE OTHER HALF OF `ScreenShell` (owner, 30.07: it must all be done the
// same way, as an overlay over the whole screen – his words verbatim in docs/decisions.md).
// `ScreenShell` is the stack a TABBED screen gets; this is the stack a
// screen that COVERS the tabs gets, and the sandbox exhibition below is the fourth and last place
// MatchViewer is mounted. It was the one that did not have it - see the note at its call site.
import TakeoverShell from '../ui/TakeoverShell.vue'
import Card from '../ui/Card.vue'
import IconButton from '../ui/IconButton.vue'
import SurfaceMark from '../ui/SurfaceMark.vue'
import PrimaryPill from '../ui/PrimaryPill.vue'
import ProgressRing from '../ui/ProgressRing.vue'
import { simulateMatch } from '../../engine/match/engine'
import { annotateMatch } from '../../engine/match/rally'
import { applySurfaceStyle } from '../../engine/match/style'
// ⚠ `COLLEGE_FREEZE_REFUSAL` IS THE ENGINE'S OWN SENTENCE AND THIS SCREEN ONLY PRINTS IT – see
// `frozenForCollege` below for the whole argument.
import { COLLEGE_FREEZE_REFUSAL, KID_ID, kidMatchPlayer, isCappedProTier, isCappedTier, isExamWeek, flipScore, type PracticeCaution } from '../../engine/world'
import { dominantSurface, isOffSeasonWeek, surfaceBlockFor, SURFACE_BLOCKS, TIERS } from '../../engine/season/calendar'
// The wild-card badge quotes the engine's own count, never a literal – see the badge in the
// template and `WILD_CARD` in engine/season/tournament.ts for why the number lives there.
import { WILD_CARD } from '../../engine/season/tournament'
import { vacationArtUrl, weekArtUrl, weekHomeArtUrl } from '../../art/weeks'
import { portraitStage } from '../../shared/avatarEmotion'
import { rngFromSeed } from '../../engine/rng'
import { coachDeclineLine } from '../../composables/declineVoice'
import type { FieldStrength } from '../../engine/season/preview'
import { ECONOMY, recommendVacationPackage, vacationPackage } from '../../engine/economy'
// R11-5a: the ONE tier-state rule, shared with the Home season ladder. R15-9 adds the sliding
// feed rule (`feedContext`/`feedShows`) and the stacked-week pick from the same module.
// ⚠ ROUND 34 #14 – AND THE PICK IS NOW REACHED THROUGH `weekEventStack`, one storey down. This
// screen asks for the whole week rather than for its representative; the stack's FIRST member is
// `preferredWeekEvent`'s answer, unchanged, and the Calendar's markers still ask the pick directly
// because a marker is one week's identity. Same module, same rule, two questions.
import { entryBandTrack, eventActionable, feedContext, feedShows, pointsLockNote, useTierStates, weekEntryTaken, weekEventStack, type TierState } from '../../composables/tierState'
// ⚠ THE CALENDAR HORIZON, FROM ITS OWNER. This screen used to hold TWO independent eights: it
// imported `tierState.HORIZON_WEEKS` for the open-tier note's copy and kept a private
// `CALENDAR_HORIZON = 8` for the row loop, so one file could have printed one horizon and drawn
// another. Both were hand copies of `UPCOMING_WEEKS`, which is the span `toSnapshot` actually clips
// `upcoming` to – so the feed cannot draw a row the snapshot has no event for, and the note cannot
// promise a window the feed does not cover.
import { UPCOMING_WEEKS } from '../../engine/world/constants'
// THE UPCOMING-EVENT CARD'S OWN PARTS, shared with the Calendar's marker card: the photograph, the
// court's verdict for her build, the scholarship's share, and how an odds ring is NAMED. Its colour
// is no longer one of them – that ramp is drawn on five surfaces, not two, so it lives a line below.
import { DRAW_NOT_MADE_NOTE, FIELD_FIGURE_NOTE, fieldChanceLabel, fieldChanceTitle, firstMatchLabel, firstMatchTitle, useEventCard } from '../../composables/eventCard'
// The app's one red-to-green ramp, shared with the three condition rings. `{ fraction }` names the
// scale IN the call: this number is a 0..1 chance, not a 0..100 percentage, and the signature will
// not let the two be confused.
import { readingColor } from '../../composables/readingColor'
// D4 (docs/specs/e2e-coverage.md §12): the ONE accessible name for an Enter, shared with the
// Calendar so the two surfaces cannot call the same tournament two different things.
import { enterActionName } from '../../composables/eventName'
import { TIER_SHORT } from '../../composables/weekAhead'
import { consumePostAdvanceNav, holdPostAdvanceNav } from '../../composables/weekRecap'
import { rankLabel } from '../../shared/format'
import { seasonWeekRange, weekLabel, weekRange } from '../../shared/dates'
import { formatCents, entryFeeLabel } from '../../shared/money'
import type { MatchOptions, MatchPlayer, Surface } from '../../engine/match/types'
import type { TierId } from '../../engine/season/types'
import type { AnnotatedMatch } from '../../viz/types'
import { activeLadderOfSnapshot, DEFAULT_PROFILE } from '../../shared/protocol'
import type { PracticeBooking, UpcomingEvent, VacationBooking, WorldEvent, WorldMatch } from '../../shared/protocol'

const game = useGameStore()
// The upcoming-event card's shared parts, in one read of the snapshot. `surfaceVerdict` is what this
// file used to call `surfaceNote`, one-for-one; the Calendar screen had the identical one-liner
// under the second name, which is how one rule ends up with two of everything.
const { academyCoverPct, surfaceVerdict, venueUrl } = useEventCard()
const base = import.meta.env.BASE_URL
// Round-7 item 18 / owner amendment: the this-week tournament row's watch control is now
// ICON-ONLY – the word "Watch" dropped, just the play.svg glyph, accent-yellow and sized like
// the bottom-tab icons (see .watch-play-icon / .watch-play-btn). Still a real button with an
// aria-label for accessibility. SeasonScreen only; the News "Watch" keeps its glyph per the owner.
const playIconStyle = {
  WebkitMaskImage: `url(${base}icons/play.svg)`,
  maskImage: `url(${base}icons/play.svg)`,
}



// Surface x play style (docs/specs/surface-style.md): the calendar column stops being flavour, so
// the card says so in one line – and says nothing at all when the court is neutral for her build.
// ⚠ THE ONE-LINER MOVED to `composables/eventCard.ts` as `surfaceVerdict` (destructured above). It
// was written out here as `surfaceNote` and again on the Calendar screen as `surfaceVerdict` – the
// same call to `surfaceStyleHint` under two names, which is the version of this defect that a grep
// for either name will never find.
// ⚠ `surfaceAffinity()` went with `SurfaceView` (see the note below). It existed to colour the old
// surface PILL by whether the court suited her; the ring is coloured by the COURT (`--surface-*`) and
// the suits/against verdict reaches the player through the coach's plaque, which reads
// `surfaceStyleHint` directly. The engine rule it wrapped is untouched and still tested against
// SURFACE_STYLE_DELTAS in tests/round11-view.test.ts.

// R11-15 – the event card's surface PILL, back in the card corner. THIS REVERTS R10-11.
//
// R10-11 replaced the coloured pill with a ringed colour DOT and moved the surface name underneath
// it. The owner's verdict on that swap: the card corner used to carry a PILL with the surface type
// and its colour, and that was far better than the circle it has now - bring the pill back, and
// underneath it leave just "suits her or not", with the surface name taken off that line (his words
// verbatim in docs/decisions.md). So the pill is back, with the
// court's colour and its NAME inside it, and the line beneath carries the verdict ONLY.
//
// The surface name now appears EXACTLY ONCE, inside the pill – which is the whole reason the fit line
// is stripped down: the duplicate name ("🟢 grass" in the corner, "Grass – suits her game" below) was
// the real complaint R10-11 over-corrected for.
//
// Kept from R10-11, because those parts were right: the badge stays a STACKED object (pill on top,
// its verdict directly beneath, so the pair reads as one thing rather than being flung to opposite
// corners), the emoji stays `aria-hidden` (it is the colour, and the name next to it already carries
// the meaning), and both the verdict and its colour are still CONSUMED from engine/match/style.ts –
// `surfaceStyleAffinity` colours it, `surfaceStyleHint` words it – so nothing here can drift from
// SURFACE_STYLE_DELTAS, the table that actually moves her attributes.
// ⚠ `SurfaceView` AND ITS EMOJI TABLE ARE GONE (owner, 30.07: «Surface type similar icon across every
// screen – it means this icon is not a component»). It carried four fields and by wave 2 the card was
// reading exactly one of them - `title`. `emoji` was the last consumer of
// `const SURFACE_EMOJI = { hard: '🔵', clay: '🟠', grass: '🟢' }`, a line that had been copy-pasted
// into three files and whose hues are not the `--surface-*` tokens the ring uses, so the same clay
// court was one orange here and a different orange there. `affinity` and `fit` moved to the coach's
// plaque a wave ago and are read there directly. What is left is the one thing the card asks for.
/** The engine's hint MINUS its surface-name prefix. `surfaceStyleHint` writes "Grass – suits her
 *  game"; the pill already says "grass", so only the tail belongs under it. Sliced off the engine's
 *  own string rather than re-written from the affinity, so the two can never word it differently. */
function surfaceFit(surface: Surface): string | null {
  const hint = surfaceVerdict(surface)
  if (!hint) return null
  const dash = hint.indexOf('– ')
  return dash < 0 ? hint : hint.slice(dash + 2)
}
/** The engine's whole sentence, surface name included, for the mark's title. Falls back to the bare,
 *  capitalised surface id rather than to a second copy of the label table. */
function surfaceTitle(surface: Surface): string {
  return surfaceVerdict(surface) ?? surface.charAt(0).toUpperCase() + surface.slice(1)
}
// --- THE SEASON CARD (wave 2, the owner's redesign) ---------------------------------------------
// The export's big tournament card, one per upcoming event, scrolling. Three of its parts are ours
// rather than the export's, and each is a decision:
//
//   * WHERE THE LOCATION WAS, the surface and the dates now sit. The export prints a city under a
//     map pin; we have no cities (they are in the backlog, D4 of the diary spec), and an empty pin
//     is worse than no pin. The owner moved the surface/date line down into that slot.
//   * "COACH SAYS" carries what we can actually say - whether the surface suits her play style, and
//     how the field reads - instead of an invented quote.
//   * THE RING is the engine's own first-match probability (engine/season/preview.ts). It is the
//     one number on this screen that is a claim about the future, and it is computed, not styled.
//
// THE PHASE STRIP is the export's, driven by the real SURFACE_BLOCKS table the calendar generates
// from - so the strip cannot promise a swing the season does not have.
const PHASE_STRIP = SURFACE_BLOCKS.map((b) => ({
  id: b.id,
  // The export's own five words: Hard / Clay / Grass / Hard / Off. Our block labels are prose
  // ("Summer hard swing"), and prose wraps to two lines in a fifth of 390px - which is exactly what
  // the owner saw. The DOMINANT SURFACE is the fact the strip carries, so it is what it prints.
  short: b.id === 'off-season' ? 'Off' : dominantSurface(b).replace(/^./, (c) => c.toUpperCase()),
  weeks: seasonWeekRange(b.from, b.to),
}))
const activePhaseId = computed(() => surfaceBlockFor(week.value).id)

/** WHICH PAINTING OF HER the exam frame wears. The same one-line derivation `headerAvatar` makes off
 *  `ageYears`, and not `useKidEmotion` - this screen wants the ART band and none of the emotion
 *  machinery.
 *
 *  ⚠ "BAND" HERE IS THE PORTRAIT BAND, NOT THE AGE BAND, and the word had to be disambiguated once
 *  the one-clock wave gave `ageAtWeek` a name of its own. `portraitStage` cuts jun/young/teen/adult/
 *  the 31+ band for the ART; `ageAtWeek` is the coach market's restocking clock, which is the single job that
 *  ruling left it (PlanWeekSheet.vue prices a booked practice week through it, and that IS the
 *  market's question). So this line is CORRECT as it stands and must not be re-pointed: `ageYears` is
 *  now her real age, and a picture of her should follow the girl rather than a calendar-year cohort.
 *  Reading `ageAtWeek(week)` here would put a thirteen-year-old December girl in the next band's
 *  painting for a year - the exact defect the one-clock ruling was made to end. */
const kidStage = computed(() => portraitStage(game.snapshot?.ageYears ?? 14))

/** The painting for a week with no tournament. Every such week has one: the three off-season weeks
 *  each wear their own, the exam fortnight wears `study-*` (W6), everything else is the on-court frame
 *  (src/art/weeks.ts).
 *
 *  ⚠ HER CURRENT BAND, ON A ROW THAT MAY BE UP TO UPCOMING_WEEKS AWAY, and that is the right
 *  trade rather than an oversight: the band boundary is `young`→`teen` at 17, so the only rows this can
 *  get wrong are ones inside a few weeks of a birthday, and the alternative is a screen deriving her
 *  age at a future week - a fact the snapshot does not carry and the planner has no business computing.
 *  The recap card, which is the surface that shows a week she actually LIVED, takes its band from the
 *  engine's own `WeekScene` and is exact. */
function weekArt(row: CalendarRow): string {
  return row.kind === 'exam' ? weekHomeArtUrl('exam', kidStage.value) : weekArtUrl(row.week)
}
/** R12-1/14 kept: "Exams" is the owner's own word for it. */
// THE BOOKED FAMILY WEEK's painting, by package (owner, 29.07). Null when a package has no frame
// yet - the card falls back to the plain planned row rather than rendering a 404, because the
// catalogue can grow before the art does.
function vacationArt(row: CalendarRow): string | null {
  return row.vacation ? vacationArtUrl(row.vacation.packageId) : null
}

/** What the week away is worth, for the card's chips: the gain the package promises and what the
 *  family actually paid for it (the quote is per (seed, week, package), so the booking carries it). */
function vacationGain(row: CalendarRow): number {
  return vacationPackage(row.vacation?.packageId ?? '')?.conditionGain ?? 0
}

function weekTitle(row: CalendarRow): string {
  // ⭐⭐ ROUND 28 #4 – A SHOOT WEEK NAMES ITSELF, and it names itself in the SAME WORDS the button
  // into it uses (`useWeekAhead` -> 'Shooting week') and the Calendar's own eyebrow uses. Three
  // surfaces, one week, one phrase: the owner's item 6 is that the button says it, and item 4 is
  // that the season calendar shows it, and they are one thing said twice.
  //
  // ⚠ IT OUTRANKS 'Training week' AND NOT THE OTHER TWO. The off-season and the exam fortnight are
  // weeks nothing is hers to plan in - a shoot is what happens INSIDE a week she has - and a shoot
  // in the off-season cannot exist anyway (`chooseShootWeeks` filters those weeks out of every pool
  // by construction, «an off-season cost is free money wearing a cost's clothes»). Saying so here
  // rather than assuming it: if the pool rule ever changes, this stays right.
  if (row.kind === 'off-season') return 'Off-season'
  if (row.kind === 'exam') return 'Exams'
  return row.shoot ? 'Shooting week' : 'Training week'
}

/** "W8" - the week number alone. The date beside it already names the year, and `weekLabel` would
 *  print it a second time as "'38". Sliced off the shared formatter rather than re-derived, so the
 *  two can never disagree about which week it is. */
function weekOnly(w: number): string {
  return weekLabel(w).split(' ')[0]
}

// ⚠ `dominantSurface()` MOVED TO engine/season/calendar.ts, next to the SURFACE_BLOCKS table it
// reduces (see the note there). The calendar screen needs the same answer for its week grid's court
// colour, and a one-line reduce copied into a second screen is a line that drifts by an argument.
// Nothing about what this screen renders changed - same function, same call site, one import.
/** The season's own year, the same one weekLabel prints – never the calendar year (they diverge at
 *  season 5, which is what week-numbering.test.ts exists to remember). */
const seasonYearLabel = computed(() => {
  const short = weekLabel(week.value).match(/'(\d{2})$/)?.[1] ?? ''
  return short ? `20${short}` : ''
})

// ⚠ THE PAINTED COURT is `venueUrl` off `useEventCard` (destructured at the top). It was written out
// here and again on the Calendar screen, both wrapping `venueArtUrl` with the snapshot's seed – and
// "one tournament wears one photograph wherever it appears" is a claim two copies cannot make.

/** WHAT THE COACH SAYS about an event. Two clauses at most: how the field reads, and - only when
 *  the court actually has an opinion about her build - whether it suits her.
 *
 *  THE FIELD CLAUSE HAS FOUR WORDINGS PER VERDICT, picked off `seed:coachsay:<eventId>` (owner,
 *  asking whether there is any variety at all in what the coach says - his words verbatim in
 *  docs/decisions.md; there was not). The event's own
 *  sub-stream, so a tournament's line never changes between renders and costs the MAIN stream
 *  nothing; and because it is keyed on the EVENT rather than the week, two cards on screen together
 *  do not echo each other.
 *
 *  Every wording says the same thing as its verdict. A coach who is cheerful about a field the ring
 *  reads at 30% is the diary's cardinal sin wearing a whistle. */
const COACH_FIELD_LINES: Record<FieldStrength, readonly string[]> = {
  strong: [
    'This field is strong.',
    'Tough draw. Plenty of good players here.',
    'She will have to earn every game here.',
    'This is a level up. Good practice either way.',
  ],
  even: [
    'An even field.',
    'Good field. Many solid players.',
    'She belongs in this one.',
    'Nothing here she has not seen before.',
  ],
  favourite: [
    'She should be among the best here.',
    'She is one of the strongest in this draw.',
    'On paper this is hers to lose.',
    'A field she should be beating.',
  ],
}

// ⚠ THE COACH AND THE RING WERE ANSWERING DIFFERENT QUESTIONS, AND THE CARD PRINTED THEM AS ONE.
//
// Owner, 31.07: sometimes "On paper this is hers to lose" turns up at 92% =) and it happens the
// other way round too (his words verbatim in docs/decisions.md). Both halves of that are real, and
// they are two different faults:
//
//   * THE SEAM. The ring is `firstMatchChance` – her odds against ONE named opponent in the first
//     round. The coach's line comes off `fieldStrength` – the share of the WHOLE field ranked above
//     her. A strong field can hand her a soft opener; a field she towers over can hand her the one
//     player in it who beats her. Measured over 150,336 cards (tools/coach-line-drift.ts): the two
//     read as contradicting each other on 22.5% of them – "this field is strong" beside a ring of
//     77% on 15.6%, and a favourite line beside a ring of 22% on 6.9%. Nearly one card in four.
//     The fix is NOT to make one of them lie. Both facts are worth having, so the coach says the
//     second one out loud when it cuts against the first, which is what a coach actually does.
//
//   * THE UNDERSTATEMENT, which is the one he quoted, and it is only 1.8% of cards. "Hers to lose"
//     is a HEDGE – it means the result is in doubt and the doubt is on her side. On a ring of 92%
//     there is no doubt to hedge, so the line reads as a joke. That is a copy problem, fixed by not
//     offering hedged wordings on a card the ring already calls a near-certainty.
const RING_COMFORTABLE = 0.65
const RING_HARD = 0.35
const RING_CERTAIN = 0.85

/** Wordings that imply the result is in doubt. Held apart from the pools rather than removed: they
 *  are good lines on a card where the doubt is real, and only wrong where it is not.
 *
 *  It holds no SELF_FIELD_LINES member and that is a fact rather than an oversight: none of the
 *  parent wordings below hedges the RESULT. They hedge the READING, which stays honest at any ring
 *  because a parent squinting at a draw sheet really is unsure of the reading at 92 percent too. */
const HEDGED_LINES = new Set(['On paper this is hers to lose.', 'A field she should be beating.'])

// ⚠ AND WHEN NOBODY IS HIRED, NOBODY PROFESSIONAL IS SPEAKING (R15-18, owner 09.08: on the 8k
// background with no coach, the season cards still say "coach says" and say it very professionally…
// it is unclear how this option differs from having a coach. His words verbatim in
// docs/decisions.md).
//
// `coachSays` read `e.preview` alone and never asked whether a coach was hired, so a family paying
// nothing was handed professional draw analysis under a plaque that said Coach says. Two separate
// wrongs in one line: it credits a person who does not exist, and it makes the free option look
// identical to the one that costs money every week.
//
// THE FIX IS A REGISTER, NOT A DELETION. A blank card is worse than a plain one, and the ring beside
// the plaque is the same number either way, so nothing is withheld here. What changes is WHO is
// talking: a parent at the kitchen table with a printed draw sheet, reading names and recognising
// some of them, rather than a professional reading a field. Same verdicts, same seam, same
// sub-stream, different mouth.
//
// ⚠ THE MECHANICAL ANSWER TO "how this option differs" - the second half of that same 09.08 ruling,
// in his own words in docs/decisions.md - IS NOT HERE. What a coach actually buys
// is the per-day training controls the owner ruled on in the same session, and this line must not
// pre-empt them by inventing a difference in what the preview contains. `preview` is untouched.
const SELF_FIELD_LINES: Record<FieldStrength, readonly string[]> = {
  strong: [
    'Reading down the list, most of these names are above her.',
    'This one looks hard on paper.',
    'A lot of good players in this draw. More than usual.',
    'We do not recognise half of them, and that is usually the bad half.',
  ],
  even: [
    'Names we half know, and some we do not.',
    'Looks like the girls she usually plays.',
    'Nothing on this sheet we have not seen before.',
    'An ordinary week, as far as we can tell.',
  ],
  favourite: [
    'Reading the sheet, she may be the best name on it.',
    'We have watched her beat most of these.',
    'Nobody on this list has frightened us before.',
    'She is the one to beat here, unless we are reading it wrong.',
  ],
}

/** What the coach adds when the draw cuts against the field – three wordings each, off the event's
 *  own sub-stream like the field line, so a card never changes between renders and two cards on
 *  screen together do not echo. Silent when the two agree, which is 77.5% of cards: a seam that
 *  fired every time would stop being information and become wallpaper. */
const DRAW_CLAUSES: Record<'kind' | 'cruel', readonly string[]> = {
  kind: [
    'The draw has been kind, though.',
    'Her first one is winnable, though.',
    'She has a way in, though – look who she opens against.',
  ],
  cruel: [
    'She has drawn the one who can stop her, though.',
    'Of everyone here, she drew the wrong one first.',
    'The first round is the hard part, though.',
  ],
}

/** IS ANYBODY HIRED. `coachId` is null for the parent on the court and a roster id otherwise – the
 *  engine's own answer, on the snapshot, so the screen derives no fact of its own. */
const selfCoached = computed(() => !game.snapshot?.coachId)

/** WHOSE PLAQUE THIS IS. The label has to move with the voice or the register change below is
 *  invisible: the whole complaint was that the words said "Coach says" to a family with no coach. */
const readLabel = computed(() => (selfCoached.value ? 'Your read:' : 'Coach says:'))

/** The plaque's sentence. It keeps the name `coachSays` because a hired coach is its author on most
 *  careers – and because three source pins use `function coachSays` as a slice marker, where a
 *  vanished marker makes `indexOf` return -1 and the slice collapse. It is the ONE entry point
 *  either way: the branch is inside, so nothing can render one author under the other one's label. */
function coachSays(e: UpcomingEvent): string {
  // `surfaceFit` is the engine's own verdict with the surface name sliced off (R11-15) – the card
  // names the court once, beside its ring, so the coach must not name it a second time.
  const fit = surfaceFit(e.surface)
  // ⭐⭐ ROUND 31 #4 – NULL UNTIL THE DRAW IS MADE, and every clause below that reads it has to say
  // so rather than assume a number. His ruling put the draw in THIS field: «прямо на карточке
  // турнира писать имя и ранг соперницы на 1й круг внизу возле этого круга с шансом, можно как раз
  // в поле Coach says это делать элегантно». So the plaque gains one sentence at its foot – beside
  // the ring, which is where he put it – and that sentence is the draw's state, either way.
  const chance = e.preview.firstMatchChance
  const strength = e.preview.fieldStrength
  const pick = (pool: readonly string[], salt: string) =>
    pool[Math.floor(rngFromSeed(`${game.snapshot?.seed ?? ''}:${salt}:${e.id}`)() * pool.length)]

  // Filtering shortens the pool and therefore changes which line the same draw lands on – still
  // deterministic per event, which is all the sub-stream ever promised.
  //
  // ⚠ THE SALT DOES NOT MOVE WITH THE AUTHOR, deliberately. Both pools are read at the same index of
  // the same `seed:coachsay:<eventId>` draw, so hiring somebody mid-season re-voices the card and
  // never re-rolls it – the same property the event sub-stream was chosen for in the first place.
  const all = (selfCoached.value ? SELF_FIELD_LINES : COACH_FIELD_LINES)[strength]
  const pool = chance !== null && chance >= RING_CERTAIN ? all.filter((l) => !HEDGED_LINES.has(l)) : all
  const parts = [pick(pool.length ? pool : all, 'coachsay')]

  // ⚠ THE SEAM CLAUSE NEEDS A RING TO CUT AGAINST, so it is silent before the draw rather than
  // guessing. Both arms below are about a named opponent ("she has drawn the one who can stop
  // her"), and there is nobody to have drawn yet.
  if (chance !== null && strength === 'strong' && chance >= RING_COMFORTABLE) parts.push(pick(DRAW_CLAUSES.kind, 'coachdraw'))
  else if (chance !== null && strength === 'favourite' && chance <= RING_HARD) parts.push(pick(DRAW_CLAUSES.cruel, 'coachdraw'))

  // ⭐⭐⭐ ROUND 31 #9 – AND ONCE SHE IS PAST HER PEAK, THE PLAQUE SAYS SO. The owner asked for it
  // here in as many words: «тренер вполне может что-то такое говорить». `coachDeclineLine` returns
  // null on every week of every career before her own decline starts, so this line is provably inert
  // for the first fifteen seasons and cannot move a single card the owner has already seen.
  //
  // ⚠ THE SAME SUB-STREAM DISCIPLINE AS THE TWO CLAUSES ABOVE – the event's own key, `coachage`
  // beside `coachsay` and `coachdraw`, never MAIN and never the week. A card that re-voiced itself
  // as the tournament came closer is round 31 #4, and he reports that one.
  //
  // ⚠ IT READS THE FIELD, NOT THE RING, which is why it is placed with the field clause rather than
  // beside the draw: «At this age you choose your weeks» is advice about WHICH tournament to enter,
  // and the entry decision is made two weeks before there is an opponent to have a ring against.
  const declineSay = coachDeclineLine(game.snapshot?.physicalShare, game.snapshot?.seed ?? '', e.id, strength)
  if (declineSay) parts.push(declineSay)

  // "suits her game" -> "The court suits her game." Capitalised into a sentence, because the coach
  // speaks in sentences and the engine's fragment does not.
  if (fit) parts.unshift(`The court ${fit}.`)
  // ...and the draw LAST, at the foot of the plaque next to the ring – his placement. One sentence
  // either way: the state of the draw, or the person it produced with her rank beside her.
  parts.push(e.preview.drawMade ? drawnLine(e) : DRAW_NOT_MADE_NOTE)
  return parts.join(' ')
}

/** ⭐⭐⭐ ROUND 34 #5b – IS THIS CARD DRAWING THE **FIELD** RING? The condition the pre-draw line
 *  under the plaque rides on, and it is the ring chain's `v-else-if` branch stated in full: the
 *  opponent ring is not the one being drawn, AND there is a field figure to draw.
 *
 *  ⚠⚠ THE NEGATION IS THE WHOLE POINT AND IT IS EASY TO LOSE. The obvious spelling for the caption
 *  is the branch's own text, `ev.preview.fieldChance !== null` – and that is TRUE on a DRAWN card
 *  too, because the field figure does not stop existing when the draw is made; it simply stops being
 *  the number on the ring. A caption written that way survives one state longer than the ring it
 *  captions, and would tell a player whose draw is out that his figure is about to sharpen. That
 *  exact mutation is one of the three `tests/component/round31-draw-reveal.test.ts` is verified
 *  against, and it reddens.
 *
 *  ⚠ THE TWO RINGS KEEP THEIR OWN INLINE CONDITIONS rather than calling these, deliberately: a
 *  `v-if` written as a null comparison is what NARROWS `preview.firstMatchChance` / `preview.
 *  fieldChance` to `number` for the three bindings inside each ring, and routing it through a
 *  predicate would trade that compiler-checked narrowing for a `!` on every one of them – tried,
 *  and `vue-tsc` answered with four errors. The chain is the authority on which ring is drawn; this
 *  pair is that chain read back, in one place, for the surface outside it that needs the answer. */
function opponentRingShown(e: UpcomingEvent): boolean {
  return e.preview.drawMade && e.preview.firstMatchChance !== null
}
function fieldRingShown(e: UpcomingEvent): boolean {
  return !opponentRingShown(e) && e.preview.fieldChance !== null
}

/** ⭐ THE OPPONENT, NAMED, once the draw exists – «имя и ранг соперницы на 1й круг». The rank is
 *  rendered the way every other surface renders an opponent's: `#212`, or `Unranked` for a girl with
 *  no counted results, which is `rankLabel`'s own pair and not a second spelling of it. */
function drawnLine(e: UpcomingEvent): string {
  const rank = rankLabel(e.preview.opponentRank ?? 0, e.preview.opponentRank !== null)
  return `First round: ${e.preview.opponentName}, ${rank}.`
}

// U0: the ring's geometry and the arithmetic that turns a chance into a dash offset left for
// ui/ProgressRing.vue, which Home's condition ring reads too. Only the COLOUR is data – and it, the
// ring's accessible sentence and its title now live in `composables/eventCard.ts`, because the
// Calendar's marker card drew the identical ring and the two could have worded it differently.

const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const condition = computed(() => game.snapshot?.condition ?? 0)
// v21: the share of every trip the academy is paying – one number for the whole calendar, since the
// scholarship is a rate and not a per-event deal. It is `academyCoverPct` off `useEventCard` now
// (destructured at the top): the Calendar's marker card printed the identical computed, and the
// Money screen reports the same percentage as a season total.

/** How many places a wild-card tournament holds, read out of the engine so the badge's tooltip
 *  cannot go on saying eight after a bench has swept the constant. Not a computed – it is a
 *  module constant and never changes inside a session. */
const wildCardSlots = WILD_CARD.slots

// ⚠ HER PROFESSIONAL ALLOWANCE, ON EVERY W CARD (round-16 #7). It used to appear in exactly one
// place: the lock pill, on the card that had already run out ("Tour age rule – 12 of 12"). So the
// one number a parent needs in order to SPEND the allowance sensibly only ever arrived after it was
// spent - which is the same shape as a fuel gauge that lights up when the tank is empty.
//
// The engine's own figure, never re-derived.
//
// ⚠ AND IT IS THE CARD'S OWN FIGURE SINCE ROUND-17 #2, NOT THE SCREEN'S. This used to read
// `Snapshot.proEntryCap` - a single number computed at `world.week` - and hang it on every W card in
// the eight-week horizon. The comment here conceded the hole and waved it through: "the season the
// counter describes is the CURRENT one, which is what every card inside the eight-week horizon is in
// EXCEPT ACROSS THE YEAR BOUNDARY - and a capped card there still prints the engine's per-EVENT
// verdict on the lock pill". That is true of a card the cap BLOCKS and false of every other one, and
// the owner's report is exactly the other case: from about week 44 the horizon fills with next
// season's cards, each announcing `pro entries 16 / 16` for a season it is not in, on cards she
// could enter. `UpcomingEvent.proEntryCap` is the same engine function asked about the EVENT's week,
// which is what `pointsToEnter` and `entryCap` have always done.
//
// SILENT FROM EIGHTEEN, because the rule is: `proPerYearByAge` is unlimited from 18 and the protocol
// spells "unlimited" as MAX_SAFE_INTEGER, so a counter there would be a fraction with no denominator.
function proEntriesFor(e: UpcomingEvent): string | null {
  const cap = e.proEntryCap
  if (!cap || cap.limit >= Number.MAX_SAFE_INTEGER) return null
  return `pro entries ${cap.used} / ${cap.limit}`
}
/** WHICH CARDS CARRY IT – the rungs the tour's age rule actually counts (`ECONOMY.entryCap
 *  .cappedProTiers`, read through the engine's own predicate). That is every W and WTA rung and no
 *  junior or domestic one, so "every W card" is a property of the tier rather than a list here.
 *
 *  ⚠ THE ENGINE NOW ANSWERS BOTH HALVES: the field is only present on a rung the rule counts, so
 *  `isCappedProTier` and the presence of `proEntryCap` are the same question asked twice. Kept
 *  explicit so a card whose payload predates the field cannot start showing a chip with no number. */
function showsProEntries(e: UpcomingEvent): boolean {
  return isCappedProTier(e.tier) && proEntriesFor(e) !== null
}

// ⭐ AND THE JUNIOR BUDGET, ON THE SAME TERMS (P2, act2-pro-tour.md §5: «The player sees the budget
// ... and the refusal names the rule»). Half of that sentence shipped at round-17 #2 and half did
// not: the professional counter has ridden every W card since, while the junior one appeared only on a
// card the cap had ALREADY refused. Both allowances are hers to see, and a junior season is where
// the budget is tightest - fourteen international events at fourteen, against a calendar that offers
// far more than fourteen.
//
// SAME SHAPE, SAME SILENCE RULE: the engine's own per-event figure, and nothing at all once the row
// is unlimited (17+), because a fraction with no denominator is not a budget.
function juniorEntriesFor(e: UpcomingEvent): string | null {
  const cap = e.entryCap
  if (!cap || cap.limit >= Number.MAX_SAFE_INTEGER) return null
  return `junior entries ${cap.used} / ${cap.limit}`
}
/** WHICH CARDS CARRY IT – the junior rungs the allowance counts (`ECONOMY.entryCap.cappedTiers`,
 *  through the engine's own predicate). The two families are disjoint, so no card shows both. */
function showsJuniorEntries(e: UpcomingEvent): boolean {
  return isCappedTier(e.tier) && juniorEntriesFor(e) !== null
}

// SEASON STRUCTURE BY SURFACE (owner approved 26.07). The calendar shows 8 weeks, so a 15-week clay
// swing would otherwise only become visible once she is standing in it – and the whole point of the
// block schedule is that the calendar tells her when her surface ARRIVES. One strip above the
// calendar names the block she is in, when it ends, and what comes next, each tagged with how it
// reads for HER build (the same surfaceStyleHint copy the event cards carry, so the two can never
// disagree). Derived purely from the week number, so nothing was added to the snapshot payload.
// ⚠ The `SeasonBlockView` / `blockView` / `seasonBlocks` trio went with the two-row swing strip in
// wave 2 (see the template). The phase strip now shows the whole season from the engine's own
// SURFACE_BLOCKS, and the surface affinity those rows carried reaches the player through the coach
// on each card instead. Nothing else consumed them.
// CALENDAR DECLUTTER (spec §1): an OUTGROWN tournament is noise – she can never enter it again –
// so it leaves the calendar entirely and its week becomes plannable. Locked-ahead events
// ("Reach N pts") STAY: they are aspirational. Engine output is untouched.
//
// R10-3 (owner playtest 26.07 – the worst item of the round): the filter used to be unconditional,
// so it also hid an event she was ALREADY ENTERED IN the moment her points crossed the tier's
// ceiling. That took the whole week with it: the card carried the Withdraw/Cancel control, so the
// entry became unreachable; `calendarRows` then saw an empty week and offered "+ Plan week"; and the
// engine still held the entry, so every booking was refused. Total dead end. An ENTERED event is
// never decluttered – she is IN it, and it is the one card she most needs to act on.
const upcoming = computed(() => game.snapshot?.upcoming ?? [])
// ⚠ THE SLIDING WINDOW (act2-pro-tour.md §11, ruling 11 - superseding the two-type feed, which
// superseded R15-9's latch window; see `feedContext` in composables/tierState.ts for the whole rule
// and the owner's own worked example). The feed shows exactly the rungs the ENGINE holds open -
// three through the climb, four at the top - because a rung she has passed is CLOSED by the ladder
// now rather than filtered out here. Entered events always survive: she is IN them (R10-3), and a
// committed week must stay actionable.
// ⚠ AND round-21 #5 ADDS THE TABLE SHE IS ON: a professional is no longer offered the domestic
// rungs, whose points she cannot spend. `activeLadder` is the ENGINE's verdict, asked here and never
// re-derived - see `paysIntoHerTables` in composables/tierState.ts for the whole rule and its seam.
const feed = computed(() =>
  feedContext({
    ageYears: game.snapshot?.ageYears ?? 0,
    tierOpen: game.snapshot?.tierOpen,
    activeLadder: game.snapshot?.activeLadder,
    upcoming: upcoming.value,
  }),
)
const visibleUpcoming = computed(() => upcoming.value.filter((e) => feedShows(e, feed.value)))
const myEntries = computed(() => upcoming.value.filter((e) => e.entered))
const vacations = computed<VacationBooking[]>(() => game.snapshot?.vacations ?? [])
const practices = computed<PracticeBooking[]>(() => game.snapshot?.practices ?? [])
/** ⭐ ROUND 28 #4 – every running endorsement's named shoot weeks, or none. Read once here so the
 *  row loop below asks the snapshot a single time rather than per week; a Map so a week can name
 *  WHOSE shoot it is now that the portfolio runs several deals at once (P6). The first deal naming
 *  a week lends the name, which is `adDealShootingAt`'s own order on the engine side. */
const shootBrandByWeek = computed<Map<number, string>>(() => {
  const map = new Map<number, string>()
  for (const deal of game.snapshot?.adShoots ?? []) {
    for (const w of deal.weeks) if (!map.has(w)) map.set(w, deal.brand)
  }
  return map
})

// --- Round 5 item 7: tour guide overlay ---------------------------------------
const showTierGuide = ref(false)

// --- Round 5 items 1/3/16/21: every week in the horizon, not just eventful ones –
// training weeks and off-season weeks show as muted rows so tournaments sit visibly
// among ordinary weeks, each carrying its real calendar date range.
// Season planner: the muted rows now carry their PLAN – a booked vacation/practice, or the
// "+ Plan week" invitation on a genuinely empty week. Exam weeks say so instead of pretending
// to be ordinary training weeks (nothing is bookable there).
interface CalendarRow {
  week: number
  dates: string
  kind: 'event' | 'training' | 'off-season' | 'exam' | 'vacation' | 'practice'
  /** THE WEEK'S LEAD CARD – `preferredWeekEvent`'s pick, unchanged since R15-9. Every row-level
   *  question that needs ONE representative still asks this one (see `events` below). */
  event?: UpcomingEvent
  /** ⭐⭐⭐ ROUND 34 #14 – EVERY CARD THIS WEEK OFFERS, LEAD FIRST, and it is the row's own retirement
   *  of R15-9's one-row-per-week rule at the owner's ruling. Length 0 or 1 on all but the stacked
   *  weeks, so most of the calendar is byte-identical; where it is longer the cards swipe. See
   *  `weekEventStack` (composables/tierState.ts) for what earns a second card and what does not. */
  events: UpcomingEvent[]
  vacation?: VacationBooking
  practice?: PracticeBooking
  /** an empty future week the parent may plan (vacation always, practice outside the off-season) */
  plannable: boolean
  /** R12-1/14: a school-exam week (ECONOMY.availability.examWeeks). Kept as its own flag because an
   *  exam week can still CARRY an event (kind 'event' wins) – and that card must say why the week
   *  is not hers to plan instead of silently dropping the button. */
  exam: boolean
  /** R12-8b: the layoff covers this week – the card wears the small red injury chip. */
  injured: boolean
  /** ⭐⭐ ROUND 28 #4 – THIS WEEK IS ONE OF THE SIGNED ENDORSEMENT'S SHOOT WEEKS, with the brand that
   *  booked it. Undefined on every other week.
   *
   *  ⚠ IT IS A FLAG BESIDE `kind`, NOT A MEMBER OF IT, and that is the mechanic's own design rather
   *  than a shortcut. A shoot week is «not blocked and not double-charged» – a tournament, a booked
   *  family week and a practice match on a shoot week all genuinely happen – so a `kind: 'shoot'`
   *  would have had to outrank one of them and lie about the week. `injured` and `exam` are flags
   *  for exactly the same reason, and the mark rides on top of whatever the row already is: the
   *  owner asked for separate plates, or at least some mark that picks a shoot week out (his words
   *  are in docs/rounds/round-28.md item 4 – this file's comments are English by its own header's
   *  rule), and a chip that can appear on ANY row is the form of that which never has to displace
   *  something true. */
  shoot?: { brand: string }
}

// R12-8b: the layoff window as the SNAPSHOT tells it. Mirrors the engine's `layoffCovering`
// (R10-17: covered ⇔ w < week + weeksRemaining, EXCLUSIVE of the return week – she is back at the
// top of that week) without reaching into the worker's WorldState. Every calendar card inside the
// window carries a small red "injury" chip, so "why can't I plan anything" is answerable at a
// glance instead of one lock label at a time.
function layoffCovers(w: number): boolean {
  const s = game.snapshot
  return s?.injury != null && w < s.week + s.injury.weeksRemaining
}
/** The chip's tooltip – the same words the tournament card's injured lock uses. */
const layoffNote = computed(() => {
  const s = game.snapshot
  return s?.injury ? `Injured – back ${weekLabel(s.week + s.injury.weeksRemaining)}` : ''
})
/** ⭐⭐⭐ ROUND 34 #14 – WHAT A WEEK OFFERS, AS A LIST, and the rule is in `composables/tierState.ts`
 *  beside `preferredWeekEvent` rather than in this file, and his ruling is quoted verbatim on
 *  `weekEventStack` there. It lives there for the reason the PICK does: the measurement tool that
 *  reports what the calendar shows him reads the same function the screen draws through, so the
 *  table and the screen cannot disagree by construction.
 *
 *  ⚠ THE LEAD IS STILL `preferredWeekEvent`'s. `row.event` is `stack[0]` and every row-level
 *  question below still asks it. */
const stackFor = (onWeek: readonly UpcomingEvent[]): UpcomingEvent[] => weekEventStack(onWeek, week.value)
/** ...and the one enterability test, shared with the header's counter and the planner's gate. */
const actionable = (e: UpcomingEvent): boolean => eventActionable(e, week.value)
/** ⭐⭐⭐ ROUND 35 #10 – THE WEEK IS ALREADY SPENT, so the OTHER cards on it stop offering an entry
 *  the engine would refuse. His words and the whole reading are on `weekEntryTaken` in
 *  composables/tierState.ts, where Cyrillic is allowed and in a template it is not.
 *  ⚠ THE ROW, NOT THE CARD. Every card on a committed week reads the same answer, and the committed
 *  card itself never reaches this branch – it is drawing Withdraw or Cancel entry. */
const entryTaken = (row: CalendarRow): boolean => weekEntryTaken(row.events)

const calendarRows = computed<CalendarRow[]>(() => {
  // ⚠ R15-9: ONE ROW PER WEEK, AND THE PICK IS NOW A RULE RATHER THAN AN ACCIDENT. This used to be
  // `for (e of visibleUpcoming) byWeek.set(e.week, e)` - a Map whose LAST write wins. The season
  // list orders a stacked week strongest-tier-first (buildSeason), so "last" was the WEAKEST tier,
  // and the rare rungs never surfaced: every J300 week also carries a denser event, and the denser
  // event always overwrote it (the owner: he had never seen a J300 card). `preferredWeekEvent` is
  // the shared pick - entered first, then the highest visible rung - and the Calendar screen's
  // markers pick through the same function, so the two surfaces cannot disagree about which
  // tournament a week IS.
  //
  // ⚠⚠ ROUND 34 #14 RETIRED THE "ONE ROW" HALF OF THAT SENTENCE AND KEPT ALL OF THE REST. The pick
  // still decides which card LEADS a week and is still the only thing every row-level question
  // asks; what changed is that a week she may play twice now offers both cards rather than one.
  // The measurement is in docs/rounds/round-34.md item 14; the rule is `weekEventStack` in tierState.
  const byWeek = new Map<number, UpcomingEvent[]>()
  for (const e of visibleUpcoming.value) {
    const held = byWeek.get(e.week)
    if (held) held.push(e)
    else byWeek.set(e.week, [e])
  }
  const rows: CalendarRow[] = []
  for (let w = week.value + 1; w <= week.value + UPCOMING_WEEKS; w++) {
    const stack = stackFor(byWeek.get(w) ?? [])
    const e = stack[0]
    const vacation = vacations.value.find((v) => v.week === w)
    const practice = practices.value.find((p) => p.week === w)
    // W4-SCHOOL: the ROW's own week, so the September she leaves in draws correctly either side.
    const exam = isExamWeek(w, w >= (game.snapshot?.schoolEndsWeek ?? Infinity))
    const offSeason = isOffSeasonWeek(w)
    const kind: CalendarRow['kind'] = vacation
      ? 'vacation'
      : practice
        ? 'practice'
        : e
          ? 'event'
          : exam
            ? 'exam'
            : offSeason
              ? 'off-season'
              : 'training'
    rows.push({
      week: w,
      dates: weekRange(w),
      kind,
      event: e,
      events: stack,
      vacation,
      practice,
      // ⭐ ROUND 28 #4 – off `snapshot.adShoots`, each deal's own frozen terms as `toSnapshot` reads
      // them, so the plate here and the recovery `accrueCondition` charges can never name different
      // weeks. Keys are absolute career weeks, the same unit this loop counts in.
      shoot: shootBrandByWeek.value.has(w) ? { brand: shootBrandByWeek.value.get(w)! } : undefined,
      // "Empty" means empty FOR HER: a week whose only tournament is one she can NOT enter – a
      // locked-ahead "Reach N pts" card (the spec keeps those visible on purpose) or one whose
      // entry list has already closed – is still hers to plan. Otherwise the aspirational cards
      // sterilise most of the calendar and the planner has nowhere to go. An ENTERED week is
      // committed, an enterable one is a real decision she should make first, exam weeks belong
      // to school, and an already-planned week is done.
      // ⚠ ROUND 34 #14 – IT ASKS THE WHOLE STACK NOW, and that is a re-statement rather than a new
      // rule: `!stack.some(actionable)` is exactly what `!e || (!e.entered && (!e.eligible ||
      // week > e.deadlineWeek))` said about the lead, widened to the cards beside it. It can only
      // differ where the LEAD's entry window has closed while a card under it is still open - and
      // offering "+ Plan week" on a week that still holds a real entry decision is precisely what
      // the paragraph above forbids.
      plannable: !vacation && !practice && !exam && !stack.some(actionable),
      exam,
      injured: layoffCovers(w),
    })
  }
  return rows
})

function packageLabel(packageId: string): string {
  return vacationPackage(packageId)?.label ?? packageId
}

// THE DEFENDING BADGE's number (W2-LADDER §3, the owner's "window of points opportunity" - his
// phrase, verbatim in docs/decisions.md): the
// counted PROFESSIONAL result exactly 52 weeks
// behind this card's week - the slot this event replaces in her rolling window. W-track cards
// only: the badge is about the professional window, and a junior card wearing a WTA number would
// invite the cross-currency reading two-ladders.md forbids. Null = no badge (nothing counted at
// that slot, or not a W event).
function defendingPts(e: UpcomingEvent): number | null {
  if (TIERS[e.tier].track !== 'wta') return null
  const counted = game.snapshot?.ladders.wta.countingResults ?? []
  const r = counted.find((c) => c.week === e.week - 52)
  return r ? r.points : null
}

// THE PRO BUDGET LINE (W2-LADDER §5): «Pro entries this season: N of M», finite seasons only.
// The engine's own current-season count (Snapshot.proEntryCap); null hides the line entirely on
// the seasons the rule does not meter, which is every season but 16 and 17.
const proBudgetLine = computed<string | null>(() => {
  const cap = game.snapshot?.proEntryCap
  if (!cap || cap.limit >= Number.MAX_SAFE_INTEGER) return null
  return `Pro entries this season: ${cap.used} of ${cap.limit}`
})

// THE PLANNING COUNTER (owner, 02.08: how many tournaments are available to us and at what level,
// with how much of the year left at all - that gives a person the chance to plan. His words verbatim
// in docs/decisions.md). The engine's own read of the
// WHOLE remaining season - not this screen's eight-week feed, and deliberately NOT filtered by the
// two-type rule, so the rare rungs she may enter are counted where the feed can only mention them.
// Null before the first snapshot and in a season with nothing left, where a row of zeroes would be
// worse than silence.
const SUPPLY_RUNGS_SHOWN = 4
const supplyLine = computed<{ total: number; weeks: number; parts: string[] } | null>(() => {
  const supply = game.snapshot?.seasonSupply
  if (!supply || supply.rows.length === 0) return null
  const total = supply.rows.reduce((n, r) => n + r.open, 0)
  if (total === 0) return null
  // Strongest rung first: a planner reads down from the biggest week she could still have.
  const strongestFirst = [...supply.rows].reverse()
  const shown = strongestFirst.slice(0, SUPPLY_RUNGS_SHOWN)
  const parts = shown.map((r) => `${TIER_SHORT[r.tier]} ${r.open}`)
  // ⚠ THE TAIL IS SUMMARISED, NEVER DROPPED - the arithmetic has to close or the total becomes a
  // number the player cannot check. A career deep in the W era is technically still allowed into
  // J30 and National; naming every one of those rungs turned this line into two lines of things
  // nobody would enter, which is the opposite of a planning aid.
  const tail = strongestFirst.slice(SUPPLY_RUNGS_SHOWN).reduce((n, r) => n + r.open, 0)
  if (tail > 0) parts.push(`+${tail} lower`)
  return { total, weeks: supply.weeksLeft, parts }
})

/** ⭐⭐ ROUND-21 #2b – HOW MANY OF THAT COUNT THE FEED BELOW ACTUALLY DRAWS.
 *
 *  THE OWNER'S REPORT, and it is two sentences about one screen: there are lots of them on the
 *  season page at the top, and he does not see them in the feed. His screenshot reads
 *  `9 left to enter over 10 weeks`. Both numbers were right. The header counts every rung the
 *  engine opens, across the rest of the season; the feed draws eight weeks, of the rungs that pay
 *  into her tables, one row a week, and a week she has booked renders as the booking. Six
 *  independent reasons the two can differ, and not one of them was on screen.
 *
 *  ⚠⚠ AND THE GAME ALREADY KNEW. The `title` on this line has said so since it shipped -
 *  "including the rare ones the eight-week feed cannot show" - and a `title` is a HOVER tooltip.
 *  This is a phone game. The explanation existed the whole time, in the one place the device it is
 *  played on cannot reach, which is the same failure family as round-20 #3: a surface measured by
 *  what it SAYS rather than by what the screen can deliver.
 *
 *  So the reconciliation goes on screen as a number, next to the number it reconciles. Measured
 *  over 18 careers x 676 weeks (tools/empty-week-census.ts): 78.3% of the events this header counts
 *  never reach the feed, and 5.2% of her non-blackout weeks had tennis she could have entered that
 *  the feed never drew a card for at all. Saying "9" and showing four is not a defect in either
 *  number; saying "9" and never saying "four of them are below" is.
 *
 *  ⚠ IT COUNTS THROUGH `calendarRows`, NOT THROUGH `visibleUpcoming`. Those are different sets: a
 *  booked week draws its booking instead of its tennis, so the rows are what the parent can
 *  actually see and the upcoming list is what survived the rung filter. The whole point of this
 *  line is to name the second number, so it must be read off the first surface. The enterability
 *  test is `seasonSupply`'s own, so the two numbers count the same KIND of thing.
 *
 *  ⚠⚠ ROUND 34 #14 – AND IT COUNTS CARDS, NOT ROWS, which is a re-aim of that same rule rather than
 *  a widening of it. "A stacked week collapses to one row" used to be part of the sentence above
 *  and stopped being true: a week may now draw several cards, and a counter that still counted rows
 *  would under-report the very surface it exists to reconcile with – the defect this line was
 *  written to fix, pointing the other way. `r.events` is what the feed drew. */
const supplyOnScreen = computed<number>(() => {
  let n = 0
  for (const r of calendarRows.value) {
    if (r.kind !== 'event') continue
    for (const e of r.events) if (actionable(e)) n++
  }
  return n
})

// A passed deadline swaps the Enter button for a muted "Entries closed" pill (round-5
// item 2); an open event only ever disables Enter for insufficient funds.
function entriesClosed(e: UpcomingEvent): boolean {
  return week.value > e.deadlineWeek
}
function fundsShort(e: UpcomingEvent): boolean {
  return fundsCents.value < e.entryFeeCents
}
// The HARD-lock label (Season-Life slice B): point-band (locked) or a hard availability
// block (injured / school exams / a booked family vacation). Fatigue is NOT here – it stays
// enterable with a soft caution.
// ⚠ OUTGROWN IS NOT A LOCK AT ALL SINCE 06.08 and its arm here is deleted rather than left as a
// defensive fallback: `UpcomingEvent.outgrown` is a separate flag and the compiler refuses the old
// spelling, which is the point of moving it out of `ineligibleReason` (see protocol.ts). The rung
// she has passed is ENTERABLE and says so on its own pill below.
// The injured detail names the return week (slice C) so the parent can plan around the layoff.
/** ⭐ #28: the confirm's fee sentence. A slam levies nothing, and "Entry fee $0." is the sentence
 *  that made the owner ask whether it was broken. It is not – the majors charge no entry fee, and
 *  every other rung charges from $40 to $1,000 – so the card and the confirm both say so in words.
 *  ⚠ NOT "free": the trip is $3,000-$6,000 and is charged separately. */
function feeSentence(cents: number): string {
  return cents === 0 ? 'No entry fee – the trip is still yours to pay for.' : `Entry fee ${formatCents(cents)}.`
}

function lockLabel(e: UpcomingEvent): string {
  switch (e.ineligibleReason) {
    case 'injured': {
      const s = game.snapshot
      return s?.injury ? `Injured – back ${weekLabel(s.week + s.injury.weeksRemaining)}` : 'Injured – rest up'
    }
    // The doctor's veto (below ECONOMY.availability.medicalFloor): the one hard body-gate. The
    // card says WHY in three words; the confirm never appears, because there is nothing to confirm.
    case 'medical':
      return 'Not cleared to play'
    // The annual entry cap: she has spent this YEAR's international allowance. The count comes
    // from the engine's verdict on THIS event (never the ladder's current-season read) for the same
    // reason `pointsToEnter` does – an event in the next season is judged against a different
    // year's allowance. "Year limit" rather than "Locked": the block lifts when the season turns,
    // and the tier ladder's long form says so in full.
    // ⚠ TWO CAPS, ONE REASON CODE since W2-LADDER §5: a W rung's 'capped' is the TOUR's age rule,
    // not the junior Appendix-F one, and the refusal names the rule (owner ruling 1's
    // transparency). The family split is the engine's own (`isCappedProTier`), never guessed from
    // the label.
    case 'capped':
      return e.entryCap
        ? `${isCappedProTier(e.tier) ? 'Tour age rule' : 'Year limit'} – ${e.entryCap.used} of ${e.entryCap.limit}`
        : 'Year limit reached'
    // R12-1/14: worded to match the exam row's own label ("Exams") – ONE language for the block,
    // whether the parent reads the row or the card.
    // ⚠ FIVE REFUSALS WEAR THIS ONE CODE, AND THIS PILL USED TO GUESS WHICH (round-17 #19). A tour
    // suspension, the tier's age door, a booked vacation, an exam week and the off-season all arrive
    // as 'unavailable'; the branch below asked about the vacation and then assumed EXAMS for
    // everything else. On the owner's save that printed "Exams this week" on a Junior Tour 30 shown
    // to a twenty-year-old – a girl whose school ended at 18 (`schoolIsOver`), refused for a reason
    // that no longer exists in her life, on a card she had also aged out of two seasons earlier.
    //
    // The vacation branch stays FIRST and keeps its own copy: it is the only one of the five that
    // names something the PLAYER booked, and the package name is worth more than the engine's
    // generic sentence. Everything else now prints the engine's own words rather than a guess.
    case 'unavailable': {
      const vacation = vacations.value.find((v) => v.week === e.week)
      if (vacation) return `Family vacation – ${packageLabel(vacation.packageId)}`
      // ⚠ AND THE FALLBACK IS NOT A SECOND GUESS. An old fixture with no detail on the wire gets the
      // one word that is true of all five – it is unavailable – rather than a reason it invented.
      return e.ineligibleDetail ?? 'Not available this week'
    }
    default:
      // R11-5a: the WORDS come from the shared rule, the NUMBER stays the engine's own verdict for
      // THIS event. Reading the ladder's whole note here instead was tried and rejected in the
      // browser: it let a card the engine had locked print the ladder's "open" state.
      // Her points IN THE THRESHOLD'S OWN TABLE ride along so the card shows the fraction rather
      // than a bare target - the number stays the engine's per-event verdict, which is what this
      // comment is about; what is added is where she stands against it. See `pointsLockNote`.
      // ⚠ 01.08 (round-15's find): this used to hand over `ladders.domestic.points` unconditionally,
      // and the engine's `pointsToEnter` for a W15 is INTERNATIONAL junior points - the chip then
      // read "58 / 120 national pts", her domestic total over an international threshold under a
      // domestic label. `entryBandTrack` is the one rule for which table a rung's threshold lives in.
      // ⚠⚠ AND THE FALLBACK IS THE ENGINE'S OWN WORDS BEFORE THE LADDER'S (P1, docs/specs/
      // junior-access-2026-08.md) – the round-17 #19 fix one branch up, arriving on the OTHER code.
      // 'locked' stopped being one refusal the moment junior access shipped: a rung can now be shut
      // because the Junior Accelerator holds no place for her there, at a rank the acceptance list
      // would happily take. The ladder's note knows nothing about that and would print the CUT
      // ("takes the top 700 – she is #291") on a card refused for a completely different reason,
      // about a number she can see she is inside. `ineligibleDetail` is the sentence the gate itself
      // wrote and is right for every arm of 'locked'; the ladder note stays as the last resort, for a
      // snapshot old enough not to carry one.
      return e.pointsToEnter !== undefined
        ? pointsLockNote(e.tier, e.pointsToEnter, game.snapshot?.ladders[entryBandTrack(e.tier)].points)
        : (e.ineligibleDetail ?? tierStateById.value[e.tier].note)
  }
}

// R12-1/14: an exam week's event card must NAME the block wherever losing "+ Plan week" would
// otherwise be silent. Before this, a points-locked card ("Reach N pts") or an entries-closed one
// simply lost the button – lock precedence names the band first, so "exams" never appeared. The one
// case that already says it is the unavailable-lock pill itself (an in-band, open event, which
// lockLabel words as "Exams this week") – the reason must not print twice on that card.
function examReasonShows(row: CalendarRow): boolean {
  if (!row.exam || !row.event) return false
  const e = row.event
  const lockPillShows = !e.entered && !entriesClosed(e) && !e.eligible
  return !(lockPillShows && e.ineligibleReason === 'unavailable')
}

// --- R11-5a: "locked" vs "nothing scheduled" -------------------------------------------------
// The owner could enter a J30 and believed National was LOCKED. It never was – national [150, ∞) is a
// superset of j30 [180, ∞) – but national comes round 6 times a season against j30's ~26, so there was
// simply none inside the 8-week horizon, and every surface reported that with the same muted dash it
// used for a genuine point lock. The states are told apart by ONE rule (composables/tierState.ts);
// this screen consumes it twice: the lock label above, and the note below the calendar that finally
// NAMES the tiers she can enter but has nothing scheduled for.
const tierStates = useTierStates()
const tierStateById = computed<Record<TierId, TierState>>(
  () => Object.fromEntries(tierStates.value.map((s) => [s.id, s])) as Record<TierId, TierState>,
)
/** Open to her, nothing on the calendar – the exact case that read as "locked". Short names: the
 *  line sits under a list of full tier cards, so the ladder shorthand is enough to point at them. */
const openButUnscheduled = computed<string[]>(() =>
  tierStates.value.filter((s) => s.kind === 'unscheduled').map((s) => TIER_SHORT[s.id]),
)

// =================================================================================================
// ⭐⭐⭐ ROUND 27 #5 – THE FOUR COLLEGE YEARS, AS THIS SCREEN HAS TO READ THEM
// =================================================================================================
//
// The owner, 27.08: «на время колледжа на вкладке Season кнопки подачи заявок и планирования недели
// задизаблим пожалуйста. Можно рядом или ниже написать пояснение, что это только на время колледжа
// (как сейчас наверху появляется)».
//
// ⚠⚠ THE ENGINE WAS ALREADY RIGHT, AND THAT IS WHAT HID THIS. `enterEvent`, `withdrawEvent`,
// `cancelEntry`, `bookVacation` and `bookPractice` all open with `guardNotEnded`, which inside the
// freeze throws `COLLEGE_FREEZE_REFUSAL` rather than the ended sentence – so nothing illegal could
// ever happen here and the message that came back was the right message. The defect was entirely
// about WHEN the player learned it: after the press, in a toast, having already chosen a tournament.
// That is R10-16's own doctrine («a refused control with no reason on screen is the bug») applied
// one step earlier than it was being applied.
//
// ⚠⚠ THE SENTENCE COMES FROM THE ENGINE, NEVER FROM THIS FILE. `COLLEGE_FREEZE_REFUSAL` is exported
// for exactly this argument – its own comment says «a string literal copied into a test is a rename
// that breaks a report in silence», and a component is the same reader. The owner's «как сейчас
// наверху появляется» is the same instruction from his side: the note the shell already puts up is
// the note he wants, not a second voice saying the same fact in different words.
//
// ⚠ THE PREDICATE IS `guardNotEnded`'s OWN FIRST QUESTION, spelled the way App.vue's `showCollege`
// and HomeScreen's `collegeWeek` spell it. It is deliberately NOT `snapshot.inCollege`: the guard
// branches on `ending.type === 'college'`, i.e. "is the latch a FREEZE or an END", and the two part
// on the one week that matters – a career-ending injury inside the freeze re-latches its own ending,
// the guard goes back to refusing with the ended sentence, and the epilogue takes the shell so this
// screen is not on the player's screen at all. Asking the guard's question is what makes it
// impossible for this screen and the engine to disagree about which controls work.
const frozenForCollege = computed(() => game.snapshot?.ending?.ending.type === 'college')

// ⚠⚠ AND NOT EVERYTHING ON THIS SCREEN IS FROZEN – ROUND 24's E2 AUDIT LEFT TWO CANCELS OPEN ON
// PURPOSE, so the flag above is applied control by control and never to the screen as a whole.
// `cancelVacation` and `cancelPractice` take `guardNotEndedForGood` (world/constants.ts), because
// `resolveVacation` / `resolvePractice` have no `inCollege` gate: a booking made before the fork is
// really resolved inside the freeze, and undoing it is about the family's own week rather than about
// the tour. Both stay live here, and so does the painted vacation card that opens the planner – on a
// booked week `PlanWeekSheet` replaces both booking tabs with its `booked` pane, so that tap reaches
// the cancel and nothing else. Disabling a control the engine still allows is the same class of lie
// as enabling one it refuses, pointed the other way.

// --- one shared confirm-popup slot (mirrors MoreScreen's pattern) ------------
interface PendingConfirm {
  message: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
}
const pendingConfirm = ref<PendingConfirm | null>(null)

/* ⚠⚠ `COLLEGE_COST_NOTE` WAS HERE AND IT IS REMOVED BECAUSE IT BECAME FALSE (owner, 16.08). P4 put
 *  it on both entry paths – *"A result here can cost the college place at nineteen – a win at this
 *  level makes her a professional."* – and it was an honest sentence about the rule as it then stood:
 *  "can", never "will", because a first-round loss kept the door (owner, 13.08), and it stated a
 *  consequence without recommending anything.
 *
 *  ⚠ THE RULE UNDER IT IS GONE: college is an independent branch of the career, and no result closes
 *  it. So the sentence would now warn about something that cannot happen, on the card where the
 *  player is deciding whether to spend an entry fee. **A false warning on an entry card is worse than
 *  no warning** – it prices a cost into a decision that does not carry it, which is the opposite of
 *  what a confirm dialog is for. The record of the whole rule is on the retired
 *  `ENDINGS.collegeClosedFromTier`. */

function askEnter(e: UpcomingEvent): void {
  // Fatigue is a warned CHOICE: spell out the risk in the confirm, but keep the action available.
  const fatigued = e.cautionReason === 'fatigued'
  // ...and if the family is paying somebody who would rather she skipped it, the confirm says so in HIS
  // words. Load slice: it is the one moment the advice can still change the decision, and a warning that
  // appears only on the card is a warning the player has already scrolled past by the time he taps.
  const said = e.coachCaution ? `${e.coachCaution} ` : ''
  pendingConfirm.value = {
    message: fatigued
      ? `${said}${e.cautionDetail ?? 'Exhausted – racing risks injury.'} ` +
        `Enter ${e.label} (${weekLabel(e.week)}, ${e.surface}) anyway? ${feeSentence(e.entryFeeCents)}`
      : `${said}Enter ${e.label} (${weekLabel(e.week)}, ${e.surface})? ${feeSentence(e.entryFeeCents)}`,
    // ⚠ TWO VERBS FOR TWO KINDS OF ADVICE (08.08). "Push through" is a BODY word – it is what you do
    // to tiredness – and since the coach also has an opinion about the SCHEDULE now, it would have
    // been the wrong verb on half the cautions he raises: there is nothing to push through about a
    // club draw in a week when the W50 is the better tournament. Both keep the affordance the load
    // slice built (the button stops saying "Enter", so the player notices he is overruling somebody);
    // only the word matches what is being overruled.
    confirmLabel: fatigued ? 'Push through' : e.coachCaution ? 'Enter anyway' : 'Enter',
    onConfirm: () => game.enterEvent(e.id),
  }
}
function askWithdraw(e: UpcomingEvent): void {
  pendingConfirm.value = {
    message: `Withdraw from ${e.label} (${weekLabel(e.week)})? Entry fee ${formatCents(e.entryFeeCents)} will be refunded.`,
    confirmLabel: 'Withdraw',
    onConfirm: () => game.withdrawEvent(e.id),
  }
}
/** R10-13: the entry list has CLOSED, so this is a cancellation, not a withdrawal – the word and the
 *  money both change. The confirm has to be blunt about the fee (it is the only thing standing
 *  between the player and an irreversible spend) and about what she GETS: the week back. This is the
 *  escape from the R10-3 dead end, so it also names the two things the freed week can become. */
function askCancelEntry(e: UpcomingEvent): void {
  pendingConfirm.value = {
    message:
      `Cancel her entry to ${e.label} (${weekLabel(e.week)})? Entries closed on ${weekLabel(e.deadlineWeek)}, so the ` +
      `${formatCents(e.entryFeeCents)} entry fee is NOT refunded. The week frees up for a practice ` +
      `match or a family week.`,
    confirmLabel: 'Cancel the entry',
    onConfirm: () => game.cancelEntry(e.id),
  }
}
function runConfirm(): void {
  const action = pendingConfirm.value
  pendingConfirm.value = null
  action?.onConfirm()
}

// --- the planner sheet ("+ Plan week") ---------------------------------------------------
interface SheetState {
  week: number
  tab: 'practice' | 'vacation'
  highlightPackageId?: string
}
const planSheet = ref<SheetState | null>(null)

function openPlanner(row: CalendarRow): void {
  // The off-season row opens on Vacation – the family week is its natural use (spec §4b).
  planSheet.value = { week: row.week, tab: row.kind === 'off-season' ? 'vacation' : 'practice' }
}

/** The sheet emitted a practice choice: confirm it (with the guardrail warning in the copy –
 *  the owner's "She is already worn out – another match?" lands HERE, where the parent can still say
 *  yes; his words verbatim in docs/decisions.md). */
function confirmPractice(p: { week: number; withCoach: boolean; feeCents: number; caution: PracticeCaution }): void {
  const what = p.withCoach ? 'Practice match with the coach' : 'Practice match'
  pendingConfirm.value = {
    message:
      (p.caution.level === 'caution' ? `${p.caution.detail} ` : '') +
      `${what} in ${weekLabel(p.week)} – ${formatCents(p.feeCents)}. No ranking points.`,
    confirmLabel: p.caution.level === 'caution' ? 'Push through' : 'Book it',
    onConfirm: () => game.bookPractice(p.week, p.withCoach),
  }
  planSheet.value = null
}

function confirmVacation(v: { week: number; packageId: string; label: string; priceCents: number; gain: number }): void {
  pendingConfirm.value = {
    message:
      `${v.label} in ${weekLabel(v.week)} – ${v.priceCents === 0 ? 'free' : formatCents(v.priceCents)}, ` +
      `+${v.gain} condition. No tournaments that week.`,
    confirmLabel: 'Book it',
    onConfirm: () => game.bookVacation(v.week, v.packageId),
  }
  planSheet.value = null
}

/** R14-1: ONE CONFIRM, TWO DOORS. The un-painted fallback row's own Cancel and the planner sheet's
 *  both land here, so the sentence the parent reads before a refund cannot depend on which surface
 *  he came through. It takes the booking rather than a `CalendarRow` for exactly that reason – the
 *  sheet has no row. */
function askCancelVacation(week: number, booking: VacationBooking): void {
  pendingConfirm.value = {
    message: `Cancel ${packageLabel(booking.packageId)} in ${weekLabel(week)}? ${
      booking.paidCents > 0 ? `${formatCents(booking.paidCents)} comes back in full.` : 'Nothing was paid for it.'
    }`,
    confirmLabel: 'Cancel the trip',
    onConfirm: () => game.cancelVacation(week),
  }
}
/** The planner sheet asked to unbook the week it was opened on (R14-1). The sheet closes first, the
 *  same way `confirmVacation`/`confirmPractice` hand over: the confirm is the only thing on screen
 *  while the decision is being taken. */
function cancelVacationFromPlanner(v: { week: number; packageId: string; label: string; paidCents: number }): void {
  planSheet.value = null
  askCancelVacation(v.week, { week: v.week, packageId: v.packageId, paidCents: v.paidCents })
}
function askCancelPractice(row: CalendarRow): void {
  const booking = row.practice!
  pendingConfirm.value = {
    message: `Cancel the practice match in ${weekLabel(row.week)}? ${formatCents(booking.paidCents)} comes back in full.`,
    confirmLabel: 'Cancel the match',
    onConfirm: () => game.cancelPractice(row.week),
  }
}

// --- the RESCUE prompt (spec §4b) -------------------------------------------------------
// The bench exposed the trap: a reactive "book when condition < 60" rule never fires for the
// load-manager, while the overloaded player has no booking habit at all – 5 of 6 packages never
// sell. So the game SURFACES the lever to whoever is low: at or below rescueCondition, with a
// bookable empty week ahead, it OFFERS a vacation with the cheapest sufficient package
// pre-highlighted. An offer – never an auto-book. Dismissible per session.
// WAVE-2 (bench 26.07): the band was widened 65 → 80 and the pick now reads HER condition
// (recommendVacationPackage) instead of always demanding a package that clears 85 – on a mild
// deficit the free staycation is the right answer, and seaside stops being the only sale.
const rescueDismissed = ref(false)
const rescueWeek = computed<number | null>(() => calendarRows.value.find((r) => r.plannable)?.week ?? null)
/** The cheapest package sufficient for her CURRENT condition – the ONE shared rule (economy.ts),
 *  so this card, the planner sheet and the bench can never drift apart. */
const rescuePackageId = computed<string | null>(() => {
  const w = rescueWeek.value
  const snap = game.snapshot
  if (w === null || !snap) return null
  return recommendVacationPackage({
    seed: snap.seed,
    week: w,
    background: snap.profile.background,
    condition: condition.value,
    fundsCents: snap.fundsCents,
    // ⭐ ROUND 29 #5 – the packages the shelf has unlocked (the-shop §3f). Without this the rescue
    // card and the planner sheet would recommend different things to the same family, which is the
    // one thing `recommendVacationPackage` exists to make impossible.
    grantedIds: snap.shop.vacationIds,
  })
})
/** The rescue week as the player reads it. Empty string is unreachable: the card is gated on
 *  `showRescue`, which requires a plannable week. */
const rescueWeekLabel = computed(() => (rescueWeek.value === null ? '' : weekLabel(rescueWeek.value)))
const showRescue = computed(
  () =>
    !!game.snapshot &&
    !game.snapshot.injury &&
    // ⭐ ROUND 27 #5 – AND IT IS SILENT INSIDE THE COLLEGE FREEZE, WHICH IS THE ONE PLACE THIS CARD
    // IS SUPPRESSED RATHER THAN DISABLED. Everything else on the screen is a control the player went
    // looking for, so it stays on screen greyed with the reason beside it; this is the game OFFERING
    // a booking, and `bookVacation` is refused for the whole freeze. An offer that cannot be
    // accepted is worse than no offer – its own copy («nothing is booked until you say so») promises
    // a decision the engine will not take – and «See the options» opens the same planner sheet the
    // owner asked to have disabled, so leaving it would have been the disabled button with a second
    // door beside it.
    !frozenForCollege.value &&
    !rescueDismissed.value &&
    condition.value <= ECONOMY.practice.rescueCondition &&
    rescueWeek.value !== null,
)
/** The offer now reaches MILDLY tired weeks too (band widened to 80), and "she is worn out" is a
 *  lie at condition 78 – the headline follows the depth of the hole. */
const rescueTitle = computed(() =>
  condition.value < ECONOMY.practice.cautionCondition
    ? 'She is worn out – maybe a family week?'
    : 'She could use a week off – maybe a family week?',
)
function openRescue(): void {
  if (rescueWeek.value === null) return
  planSheet.value = {
    week: rescueWeek.value,
    tab: 'vacation',
    highlightPackageId: rescuePackageId.value ?? undefined,
  }
}

// --- kidRank: only needed here now for the Friendly-match viewer's rank-a prop – the
// full standings table moved to the Stats tab (round-6). ---------------------------
//
// ⚠ HER LADDER, NOT THE INTERNATIONAL ALIAS (31.07, fix/ladder-separation). A friendly is on neither
// table, so the only question this prop can be answering is "where does she stand", and the app has
// exactly one answer to that: `Snapshot.activeLadder`. `snapshot.kidRank ?? 0` was the international
// number AND a number at all times, so an unranked girl went into the viewer's head-plate as the
// tie-floor place she shares with half the field. (This file is under the fiction guard in
// tests/ladder.test.ts, which reads the whole source: no trademark here, in copy or in comments.)
const kidRank = computed(() => activeLadderOfSnapshot(game.snapshot).rank)

// --- this week's tournament: only kid matches are ever recorded as `match`
// events, so the list below IS the kid's path – nothing else to highlight
// against. Rank-movement arrows would need last week's rank, which the
// Snapshot doesn't carry, so they're left out (see report: spec conflict). ---
// A PRACTICE friendly is also a `match` event, so it is filtered out here and gets its own
// card below – it is not part of any tournament and awards no points.
const thisWeekMatches = computed<WorldEvent[]>(
  () => game.snapshot?.events.filter((e) => e.type === 'match' && !e.friendly && e.week === week.value) ?? [],
)
const thisWeekSummary = computed<WorldEvent | null>(
  () => game.snapshot?.events.find((e) => e.type === 'tournament' && e.week === week.value) ?? null,
)
const thisWeekFriendly = computed<WorldEvent | null>(
  () => game.snapshot?.events.find((e) => e.type === 'match' && e.friendly && e.week === week.value) ?? null,
)

// R12-12 (the owner's SECOND ask – round-11's one-line fix was the practice row; THIS is the
// tournament plaque): on the this-week tournament rows the SCORE leaves the sentence and takes its
// own line under the title. The score is never re-parsed out of the text: it comes off the match
// record itself, flipped to the kid's perspective exactly the way kidMatchEvent built the sentence
// (MatchRecord scores are side A's; flipScore when she played side B), and the title is the
// sentence MINUS that trailing token. A row without a stored scoreline – or one whose text ever
// stops ending with it – renders exactly as before, on one line, losing nothing.
interface PlaqueLines {
  title: string
  score: string | null
}
function plaqueLines(e: WorldEvent): PlaqueLines {
  const m = e.match
  const score = m?.score ? (m.bId === KID_ID ? flipScore(m.score) : m.score) : null
  if (!score || !e.text.endsWith(score)) return { title: e.text, score: null }
  return { title: e.text.slice(0, e.text.length - score.length).trimEnd(), score }
}

// R10-15: the this-week list read identically for a win and a loss, so the parent had to parse
// "beat" vs "lost to" out of the sentence to find out how the run went. The row now carries the
// result as colour: accent (the palette's positive/green, same token as .pill.ok and the rank-up
// arrow) for a win, --danger for a loss. Read off `match.winnerId`, the record's own field – never
// scraped from the event text.
function kidWon(e: WorldEvent): boolean | null {
  return e.match ? e.match.winnerId === KID_ID : null
}

// --- replay overlay --------------------------------------------------------------
const replayMatch = ref<WorldMatch | null>(null)
function watchMatch(e: WorldEvent): void {
  if (e.match) replayMatch.value = e.match
}

// --- R10-12: the booked practice match, LIVE -------------------------------------------------
// Two ways in, both on the WEEK rather than in the feed:
//  1. the booked practice row for NEXT week -> "Watch it live →" plays that week and drops straight
//     into the flow (the engine resolves the friendly during the tick, exactly as it always did –
//     `advance(1)` always ticks one week, so this is the normal week-advance, not a new path);
//  2. the "This week's practice match" card -> the same flow for the week just played.
// The result is the engine's: the flow only re-simulates the stored record under its stored seed.
const practiceLive = ref<WorldMatch | null>(null)
const practiceLiveWeek = ref(0)
function openPracticeLive(match: WorldMatch, atWeek: number): void {
  practiceLiveWeek.value = atWeek
  practiceLive.value = match
}
/** The booked friendly for next week: play the week, then watch the match. If she got hurt (the
 *  engine cancels + refunds the booking) or the advance stopped for another reason, no friendly
 *  lands and nothing opens – the news event explains it, as before.
 *
 *  ⚠ W4 RENAMED THE BUTTON THIS SITS BEHIND, from "Watch it live →" to "Play it and watch →". The
 *  owner caught the same two words on the Weekly Story's copy of this control – "She played her
 *  practice match - Watch it live, it says on the button. That is definitely not live, it is a
 *  replay, no?" (his words verbatim in docs/decisions.md) – and they were no
 *  truer here, one tick removed: this handler ADVANCES THE WEEK, the engine resolves the friendly
 *  inside that tick exactly as it always did, and PracticeFlow then re-simulates the stored record
 *  under its stored seed. There is no moment at which anything is being watched as it happens. The
 *  new label is what the press actually costs and buys, in that order. */
async function playPracticeWeek(): Promise<void> {
  // ⚠ CLAIM THE POST-ADVANCE NAVIGATION FIRST (owner, 01.08: it must lead to the pre-match screen –
  // his words verbatim in docs/decisions.md).
  // App.vue's watcher fires INSIDE the awaited advance - the snapshot lands before the next line
  // here runs - so the claim has to be made before the call, not after it. Without it the watcher
  // switched tabs (story, or Home), this screen unmounted, and the flow this function opens two
  // lines down was destroyed before the player ever saw its pre-match card.
  holdPostAdvanceNav()
  await game.advance(1)
  // A week that never ticked (a knock blocks before anything happens) leaves the claim unspent -
  // the watcher only consumes it on a week that actually advanced. Clear it, or it would silence
  // the navigation of some unrelated later advance. Idempotent when the watcher already took it.
  consumePostAdvanceNav()
  const friendly = thisWeekFriendly.value
  if (friendly?.match && game.snapshot) openPracticeLive(friendly.match, game.snapshot.week)
}

// --- Friendly match (Package J, restored per architect ruling: owner-approved –
// sparring now, a training tool in Phase 4). Player A is the kid's ACTUAL current
// build, reconstructed the same deterministic way the worker does (kidMatchPlayer,
// exported from engine/world.ts); the opponent stays the fixed "Top seed" block.
// This is the sandbox hit-out; a BOOKED practice match (above) is the real, costed one. --
const exhibitionSurface: Surface = 'clay'
// ⚠ THE FALLBACK IS `DEFAULT_PROFILE`'s OWN NAME and is read from it rather than written out again –
// it was a second copy of the literal 'Vera' and went stale the moment the owner moved the default
// to Alice (02.09.2026). There is no snapshot-less path to this screen; the `??` is a type guard.
const kidName = computed(() => game.snapshot?.profile.kidName ?? DEFAULT_PROFILE.kidName)
// Her CURRENT build as this clay court lets her play it (surface-style). Condition is deliberately
// NOT applied here – the sandbox hit-out has always shown her raw build, unlike a real match week.
const exhibitionPlayerA = computed<MatchPlayer>(() =>
  game.snapshot
    ? applySurfaceStyle(kidMatchPlayer(game.snapshot), game.snapshot.profile.playStyle, exhibitionSurface)
    : { id: 'kid', name: kidName.value, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 },
)
// The fixed sparring block. Her groundstroke (v25) sits between her serve and her return, which is
// what a strong all-round junior looks like off the ground - the point of this opponent is that she
// is uniformly good rather than that she has a weakness to find.
const exhibitionPlayerB: MatchPlayer = { id: 'top-seed', name: 'Top seed', serve: 63, ret: 60, composure: 70, stamina: 65, groundstrokes: 62 }
const exhibitionSeed = ref('')
const exhibitionMatch = ref<AnnotatedMatch | null>(null)

function playExhibition(): void {
  const seed = exhibitionSeed.value.trim() || `exhibition-${Date.now().toString(36)}`
  const opts: MatchOptions = { surface: exhibitionSurface, tour: 'wta', seed }
  const result = simulateMatch(exhibitionPlayerA.value, exhibitionPlayerB, opts)
  exhibitionMatch.value = annotateMatch(result, exhibitionPlayerA.value, exhibitionPlayerB, opts)
}
/** Dismiss the takeover. Nothing to commit: the hit-out costs nothing, decides nothing and is not
 *  written anywhere, so leaving it is the whole of leaving it. */
function closeExhibition(): void {
  exhibitionMatch.value = null
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <!-- U0: Season had NO wrapper at all – its blocks were a bare fragment dropped into the app's
         <main>. That is the thing ScreenShell replaces: the stack is now a named object with the
         same three regions every screen in this system gets, instead of "whatever <main> does". -->
    <ScreenShell>
    <!-- Round-6: the Calendar/Standings segmented control is gone – standings moved to
         the new Stats tab, so Season is calendar-only now. The "?" tour-guide button stays.
         Wave 2: restyled to the export's header – the title with the season year under it, and the
         one control this screen has, on the right. -->
    <div class="season-topbar">
      <div>
        <h2 class="season-title">Season Planner</h2>
        <p class="season-year">
          {{ seasonYearLabel }}
          <!-- Owner, 29.07: the week she is actually IN, up here with the year, so it is on
               screen without hunting for it down the feed. -->
          <span class="season-week-now">&middot; {{ weekOnly(week) }}</span>
        </p>
        <!-- THE PRO BUDGET (W2-LADDER, spec 5: the player sees the budget). Rendered only on the
             seasons the tour's age rule actually meters (16 and 17) - an unlimited season would
             print a MAX_SAFE_INTEGER, and a budget that cannot run out is not a budget. The
             number is the engine's own count for THIS season, straight off the snapshot. -->
        <p v-if="proBudgetLine" class="season-pro-budget" :title="'The tour\'s age rule limits how many professional (W) events she may enter this season. A fresh allowance arrives when the season turns; junior and national events are not counted.'">
          {{ proBudgetLine }}
        </p>
        <!-- THE PLANNING COUNTER: how much tennis is left in the season and on which rungs. It
             counts the WHOLE season, every rung the engine opens to her - the feed below shows
             eight weeks and at most two rungs, so without this a sparse stretch reads as an empty
             career. Blank weeks are normal: a full season is roughly twenty events, one a
             fortnight, and there is always more on offer than she can take. -->
        <p v-if="supplyLine" class="season-supply" :title="'Tournaments you can still enter this season, counted across every level open to her - including the rare ones the eight-week feed cannot show. She can play one event a week at most, so the supply is always larger than the schedule.'">
          {{ supplyLine.total }} left to enter over {{ supplyLine.weeks }} weeks
          <span class="season-supply-tiers">{{ supplyLine.parts.join(' · ') }}</span>
          <!-- ⭐⭐ ROUND-21 #2b: the sentence that reconciles this count with the cards under it.
               The `title` above has always said the feed cannot show them all, and a title is a
               hover tooltip on a phone game - see `supplyOnScreen` in the script for the owner's
               report and the measurement. Drawn only when the two numbers actually differ: on a
               week where every counted event is on screen this line would be noise, and the point
               of it is to explain a gap rather than to narrate agreement. -->
          <span v-if="supplyOnScreen < supplyLine.total" class="season-supply-here">
            {{ supplyOnScreen }} of them on the cards below
          </span>
        </p>
      </div>
      <IconButton class="tier-guide-btn" label="Tour guide" title="Tour guide" @click="showTierGuide = true">?</IconButton>
    </div>

    <!-- THE PHASE STRIP. Driven by the engine's own SURFACE_BLOCKS, so it cannot promise a swing the
         calendar does not generate; the lime cell is the block this week falls in. -->
    <div class="phase-strip">
      <div
        v-for="p in PHASE_STRIP"
        :key="p.id"
        class="phase-cell"
        :class="{ active: p.id === activePhaseId }"
      >
        <span class="phase-name">{{ p.short }}</span>
        <span class="phase-weeks">{{ p.weeks }}</span>
      </div>
    </div>

    <!-- Rescue prompt (spec §4b): an OFFER when she is worn out, never an auto-book. -->
    <div v-if="showRescue" class="rescue-card">
      <p class="rescue-title">{{ rescueTitle }}</p>
      <p class="hint" style="margin: 0">
        Condition {{ condition }}/100. A week away in {{ rescueWeekLabel }} would bring her back
        fresher – nothing is booked until you say so.
      </p>
      <div class="controls" style="margin-top: 10px">
        <PrimaryPill @click="openRescue">See the options</PrimaryPill>
        <button @click="rescueDismissed = true">Not now</button>
      </div>
    </div>

    <section v-if="thisWeekMatches.length">
      <h2>This week's tournament</h2>
      <p v-if="thisWeekSummary" class="tournament-summary">{{ thisWeekSummary.text }}</p>
      <ol class="bracket-list">
        <!-- R12-12: TWO lines – the sentence on top, the scoreline on its own line beneath. -->
        <li
          v-for="m in thisWeekMatches"
          :key="m.id"
          class="bracket-row"
          :class="{ won: kidWon(m) === true, lost: kidWon(m) === false }"
        >
          <span class="bracket-lines">
            <span>{{ plaqueLines(m).title }}</span>
            <span v-if="plaqueLines(m).score" class="bracket-score">{{ plaqueLines(m).score }}</span>
          </span>
          <button v-if="m.match" class="watch-play-btn sfx-watch" aria-label="Watch match" @click="watchMatch(m)">
            <span class="watch-play-icon" :style="playIconStyle"></span>
          </button>
        </li>
      </ol>
    </section>

    <!-- A booked practice match that has just been played: watchable, zero ranking points.
         R10-12: the play button opens the LIVE flow (VS card -> the match -> a box score), not the
         "Watch again ↻" replay card – a friendly you paid for should play out, not read as history. -->
    <section v-if="thisWeekFriendly">
      <h2>This week's practice match</h2>
      <ol class="bracket-list">
        <li
          class="bracket-row"
          :class="{ won: kidWon(thisWeekFriendly) === true, lost: kidWon(thisWeekFriendly) === false }"
        >
          <span>{{ thisWeekFriendly.text }}</span>
          <button
            v-if="thisWeekFriendly.match"
            class="watch-play-btn sfx-watch"
            aria-label="Watch practice match"
            @click="openPracticeLive(thisWeekFriendly.match, week)"
          >
            <span class="watch-play-icon" :style="playIconStyle"></span>
          </button>
        </li>
      </ol>
    </section>

    <!-- Owner, 28.07: no panel behind this - just the heading and the chips, which reads lighter
         and gives the chips the full width. -->
    <section v-if="myEntries.length" class="bare">
      <h2>My entries</h2>
      <div class="entries-strip">
        <span v-for="e in myEntries" :key="e.id" class="pill ok">{{ e.label }} · {{ weekLabel(e.week) }}</span>
      </div>
    </section>

    <!-- Owner, 28.07: the calendar's panel is gone and the cards ARE the surface now, so they run
         to the screen's own gutter the way the export draws them. The panel's translucent top
         border went with it - that was the line running across above the first card. -->
    <section class="bare">
      <h2>Calendar</h2>
      <!-- ⭐⭐⭐ ROUND 27 #5 – THE REASON, BESIDE THE CONTROLS INSTEAD OF BEHIND THEM.
           The owner asked for a line beside or under the buttons, in the words the shell already
           puts up. ⚠ HIS WORDS ARE IN THE SCRIPT, AT `frozenForCollege`, AND THEY STAY THERE: no
           Cyrillic may appear in a template, comments included (tests/template-copy-rules.test.ts
           and tests/ladder.test.ts both read this block).
           ⚠ THE STRING IS THE ENGINE'S, NEVER THIS TEMPLATE'S. `COLLEGE_FREEZE_REFUSAL` is the exact
           sentence `guardNotEnded` throws for every control this note explains, so the screen and
           the refusal cannot come to say two different things about the same four years.
           ⚠ ONCE, AT THE HEAD OF THE FEED, AND NOT PER CARD. Eight cards carry a disabled Enter and
           eight copies of one sentence would be the noisiest thing on the screen; here it is read
           before the first card and stays true for every one under it. -->
      <p v-if="frozenForCollege" class="hint college-freeze-note" role="note">{{ COLLEGE_FREEZE_REFUSAL }}</p>
      <!-- ⚠ The two-row "swing" strip that used to sit here is GONE (wave 2). The phase strip at the
           top of the screen is the export's version of the same fact and shows the WHOLE season
           rather than this block and the next, so keeping both meant saying it twice. The surface
           affinity it also carried now reaches the player through the coach on each card, where it
           is about a tournament she can actually enter. -->
      <div class="event-cards">
        <template v-for="row in calendarRows" :key="row.week">
          <!-- U0: `<Card variant="photo">` – the same hairline and corners as Home's notecards over
               a FLAT dark tone, clipped, laid out as a column so the painting can bleed in behind
               the words. The 16/16/12 inset is this card's own, so it arrives as `pad`. -->
          <!-- ⭐⭐⭐ ROUND 34 #14 – THE WEEK'S CARDS, PLURAL. `row.events` is `weekEventStack`'s answer:
               the lead card R15-9 always drew, and behind it every OTHER rung on this week she may
               actually enter. Most weeks hold exactly one and this is the shipped markup wearing a
               wrapper; a week that stacks two she can play now offers both, and `.swipeable` turns
               the wrapper into a scroll-snapping strip so the second one is a thumb away.
               ⚠ NO NEW WORDS, WHICH INVARIANT 4 REQUIRES AND THE OWNER DID NOT ASK TO LIFT: the
               affordance is the next card's own edge showing past the first, not a caption. -->
          <div
            v-if="row.kind === 'event' && row.events.length"
            class="week-stack"
            :class="{ swipeable: row.events.length > 1 }"
          >
          <Card
            v-for="(ev, i) in row.events"
            :key="ev.id"
            variant="photo"
            pad="16px 16px 12px"
            class="event-card"
          >
            <!-- THE PAINTED COURT, bleeding in from the right under the export's own dissolve, with
                 a vertical scrim over it so the words keep their contrast whatever the picture is
                 doing. Same picker Home uses: one tournament, one photograph. -->
            <div class="event-art">
              <img :src="venueUrl(ev)" alt="" />
              <span class="event-art-scrim"></span>
            </div>

            <div class="event-card-top">
              <h3 class="event-tier">{{ ev.label }}</h3>
              <!-- Decorative weather (owner's ruling): deterministic per event, read by nothing. -->
              <span class="event-weather">
                <svg class="event-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.2"></circle>
                  <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"></path>
                </svg>
                {{ ev.preview.temperatureC }}&deg;
              </span>
            </div>

            <!-- WHERE THE EXPORT PRINTS A CITY (owner: we have no cities yet, so this slot carries
                 the surface and the dates). R11-15's pill still names the court exactly once. -->
            <div class="event-place">
              <!-- The export's surface mark: two concentric rings in the court's colour, then its
                   name. ⚠ IT IS A COMPONENT NOW (owner, 30.07: «Surface type similar icon across
                   every screen – it means this icon is not a component»). This markup was written
                   out by hand in three places and all three had drifted apart; SurfaceMark is the
                   one door. Nothing about what this site renders has changed - same classes, same
                   ring, same engine title. -->
              <SurfaceMark :surface="ev.surface" :title="surfaceTitle(ev.surface)" />
              <span class="event-place-sep"></span>
              <!-- Owner, 28.07: the week number belongs UP here with the dates, and without its
                   season suffix - "W8 · Feb 20-26, 2034" already says which year twice otherwise. -->
              <span class="event-dates">{{ weekOnly(ev.week) }} &middot; {{ row.dates }}</span>
            </div>

            <div class="event-money">
              <p class="event-money-label">Travel budget</p>
              <p class="event-money-figure">{{ formatCents(ev.travelCostCents) }}</p>
              <!-- v21: the figure above is already NET of the scholarship, so without this line the
                   player just sees a smaller number and no reason for it. -->
              <p v-if="academyCoverPct > 0" class="event-money-sub">academy covers {{ academyCoverPct }}%</p>
            </div>

            <div class="controls">
              <!-- The entry fee reads as a FIGURE, in white, on the same row as the deadline chips
                   (owner, 28.07) - it is money, like the travel budget above it, not a caption. -->
              <!-- ⭐ #28: a slam levies no entry fee at all, and "no entry fee" is a fact where "$0" reads
                   as a number nobody filled in. `entryFeeLabel` carries the word "entry" itself, so the
                   chip prints the label bare rather than prefixing a second one. -->
              <span class="entry-fee">{{ entryFeeLabel(ev.entryFeeCents) }}</span>
              <!-- R12-8b: the layoff covers this WEEK, whatever the event's own lock says – a
                   points-locked card names the band first (lock precedence), so without the chip
                   the injury never appeared on it at all. -->
              <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
              <!-- ⭐⭐ ROUND 28 #4 – THE SHOOT PLATE, and it rides on EVERY row shape rather than on a
                   row kind of its own. The owner: shoot weeks for sponsors need their own plates, or
                   at least some mark that picks them out in the season calendar. A shoot week is not
                   blocked and not double-charged, so it can be any of these five rows at once – a
                   tournament, a family week, a friendly, a training week – and a mark that had to
                   displace one of those to appear would be a lie about the week on the four rows it
                   is not. Same shape and same slot as the injury chip beside it, for the same
                   reason: both are facts ABOUT the week rather than what the week IS. -->
              <span v-if="row.shoot" class="pill shoot-chip" :title="`${row.shoot.brand} shoot week – she keeps her sessions and gives up the rest`">shoot</span>
              <!-- Round-7 item 21: past tense once the window has shut. -->
              <span class="pill" :class="{ negative: week > ev.deadlineWeek && !ev.entered }">
                {{ week > ev.deadlineWeek ? 'Closed' : 'closes' }} {{ weekLabel(ev.deadlineWeek) }}
              </span>
              <span v-if="ev.entered" class="pill ok">Entered</span>
              <!-- ⭐⭐ THE WILD CARD (round 21 #2b) – the half of the item the owner asked for by
                   name: the event row says the place was a wild card. The flag is the ENGINE's
                   (`UpcomingEvent.wildCard`), set only when the acceptance list would have refused
                   her, so this badge can never appear on a place she earned. The rule itself lives
                   in engine/season/tournament.ts and is never restated here; the tooltip quotes
                   `WILD_CARD.slots` rather than a literal eight so a swept constant cannot leave a
                   sentence behind saying the old number. -->
              <span
                v-if="ev.wildCard"
                class="pill wildcard-chip"
                :title="`One of the ${wildCardSlots} places this tournament holds for players of the host nation – she is outside the acceptance list.`"
              >
                wild card
              </span>
              <!-- THE DEFENDING BADGE (W2-LADDER §3: the points window made visible - the
                   owner's phrase is quoted at `defendingPts` in the script). Last year's counted
                   result at this exact week is about to age out of her rolling professional
                   window - the week she plays (or skips) this card is the week those points
                   leave. The number is the counted result's own; the rule is the engine's 52-week
                   window, restated nowhere. -->
              <span
                v-if="defendingPts(ev) !== null"
                class="pill defend-chip"
                :title="`Her counted result from this week last year (${defendingPts(ev)} pts) leaves the 52-week professional window as this week arrives.`"
              >
                defending {{ defendingPts(ev) }} pts
              </span>
              <!-- R10-5: an entry that survived the band crossing is COMMITTED, not illegal – but it
                   must SAY so. The owner played a Local at 122 points with nothing on screen to
                   explain it, because the card had been decluttered away entirely.
                   ⚠ AND SINCE 06.08 IT IS SAID ON EVERY OUTGROWN CARD, not only an entered one, and
                   it is no longer a padlock. The rung she has passed stays open (see `tierOpenFor`),
                   so the pill's job changed from explaining a stranded commitment to labelling a
                   choice she may still make – which is what «lead with the more relevant tournament»
                   needs the weaker card to look like. -->
              <span v-if="ev.outgrown" class="pill muted">
                Outgrown – she is past this level
              </span>
            </div>

            <!-- THE PLAQUE. A read on the court and the field, and her real odds in round one - see
                 engine/season/preview.ts for what that number does and does not claim.

                 R15-18: it has TWO authors and the label names which one. A hired coach reads a
                 field; a self-coached family reads a draw sheet at the kitchen table, and until this
                 wave both were printed under "Coach says:" to a family paying nobody. The ring and
                 the preview behind it are identical either way - this is the voice, not the value.
                 See `readLabel` and SELF_FIELD_LINES in the script. -->
            <div class="event-coach">
              <div class="event-coach-said">
                <p class="event-coach-label">{{ readLabel }}</p>
                <p class="event-coach-line">{{ coachSays(ev) }}</p>
                <!-- ⭐⭐⭐ ROUND 34 #5b – WHAT THE PRE-DRAW FIGURE PROMISES, IN ONE LINE THE PLAYER
                     CAN SEE. The owner's ruling and the measurement behind it (the number steps 9.1
                     points on average at the draw, 36 at worst) are quoted on `FIELD_FIGURE_NOTE` in
                     composables/eventCard.ts, where Cyrillic is allowed and in a template it is not.
                     ⚠ VISIBLE, not an accessible name: the jump he is being warned about is visible,
                     so the warning has to be. It sits under the plaque and beside the ring it is
                     about, and it appears and disappears with that ring – `fieldRingShown` is the
                     ring chain's own else-branch read back, negation included. Writing the branch's
                     bare text here instead would leave the line on a card whose draw is out. -->
                <p v-if="fieldRingShown(ev)" class="field-note">{{ FIELD_FIGURE_NOTE }}</p>
              </div>
              <!-- ⭐⭐ ROUND 31 #4 – NO OPPONENT RING UNTIL THE DRAW IS MADE. A percentage here is her
                   chance against ONE named girl, so before there is a girl there is no number to draw
                   and an empty ring would be a reading of nothing. The plaque beside it says which
                   state this card is in, in the field the owner chose for it.
                   ⚠ RE-AIMED, NOT RETIRED, BY ROUND 34 #5: what waits for the draw is this RING's
                   number, not the ring. See the field ring below it. -->
              <ProgressRing
                v-if="ev.preview.drawMade && ev.preview.firstMatchChance !== null"
                class="chance-ring"
                :value="ev.preview.firstMatchChance"
                :color="readingColor({ fraction: ev.preview.firstMatchChance })"
                :label="firstMatchLabel(ev.preview)"
                :title="firstMatchTitle(ev.preview)"
              >
                <b>{{ Math.round(ev.preview.firstMatchChance * 100) }}</b><i>%</i>
              </ProgressRing>
              <!-- ⭐⭐⭐ ROUND 34 #5 – AND BEFORE THE DRAW, THE FIELD'S OWN FIGURE. His words are in
                   the script, at `fieldChanceLabel`'s own note in composables/eventCard.ts, where
                   Cyrillic is allowed and in a template it is not: the pre-draw card carried a word
                   and no number, and a plan is made in the two weeks when withdrawal is still free.
                   ⚠ ITS OWN CLASS AND ITS OWN SENTENCE. Same ring, same ramp, different question -
                   «a typical opponent at this level» rather than «this girl» - so the two numbers
                   are never shown under one name. The plaque under it still says the draw has not
                   been made, which is what makes the difference VISIBLE rather than only spoken. -->
              <ProgressRing
                v-else-if="ev.preview.fieldChance !== null"
                class="chance-ring field-ring"
                :value="ev.preview.fieldChance"
                :color="readingColor({ fraction: ev.preview.fieldChance })"
                :label="fieldChanceLabel(ev.preview)"
                :title="fieldChanceTitle(ev.preview)"
              >
                <b>{{ Math.round(ev.preview.fieldChance * 100) }}</b><i>%</i>
              </ProgressRing>
            </div>
            <!-- ⚠⚠ THE "Rating 1642 vs 1801" LINE WAS HERE AND IS REMOVED BY OWNER RULING (round 21):
                 "I did not ask for this, it is surplus information, please take it out." It was the
                 calendar card's twin and it goes for the same reason - see the fuller note at the
                 same place in CalendarScreen.vue. `src/engine/match/rating.ts` stays exported and
                 tested; it has no surface, and giving it one again is his decision. -->

            <div class="controls" style="margin-top: 12px">
              <!-- Entered, list still OPEN: an ordinary withdrawal, fee refunded.
                   ⭐ ROUND 27 #5: `withdrawEvent` takes `guardNotEnded`, so it is refused for the
                   whole college freeze. The departure releases every outstanding entry, so this
                   button should not be drawn there at all - the gate is what makes that a rule
                   rather than a hope. -->
              <button
                v-if="ev.entered && !ev.cancellable"
                :disabled="game.busy || frozenForCollege"
                @click="askWithdraw(ev)"
              >
                Withdraw
              </button>
              <!-- R10-13: entered, list CLOSED. Not a "withdraw" any more – a CANCEL, with the fee
                   forfeited, which hands the week back to the planner. Plain secondary button, like
                   the planner's own Cancel controls; the confirm carries the warning.
                   ⭐ ROUND 27 #5: `cancelEntry` is `guardNotEnded` too - it is a TOUR command about
                   an entry, not one of E2's two family-week cancels. -->
              <button v-else-if="ev.entered" :disabled="game.busy || frozenForCollege" @click="askCancelEntry(ev)">
                Cancel entry
              </button>
              <!-- Round-8 6b: `lock` brightens the label to soft amber (pill stays disabled). -->
              <span v-else-if="entriesClosed(ev)" class="pill muted lock">
                Entries closed {{ weekLabel(ev.deadlineWeek) }}
              </span>
              <!-- HARD locks: ranking gate ('locked') OR a hard availability block (injured /
                   school exams / a booked family vacation / the doctor's veto under the medical
                   floor). ORDINARY fatigue is NOT here – it stays enterable (see below). -->
              <span v-else-if="!ev.eligible" class="pill muted lock">
                🔒 {{ lockLabel(ev) }}
              </span>
              <template v-else>
                <!-- Fatigued is a soft, warned CHOICE: the Enter stays ACTIVE and amber, with a
                     "race anyway?" warning – never greyed out. -->
                <!-- ⚠ THE NAME SAYS WHICH TOURNAMENT (defect D4, docs/specs/e2e-coverage.md §12 -
                     the highest-priority item on that list, and the direct cause of gap 8.1). The
                     feed draws one of these per card and the whole accessible name was the word
                     "Enter", so eight cards were eight controls a selector cannot tell apart. The
                     VISIBLE word is unchanged and is still the first word of the name, which is what
                     WCAG 2.5.3 asks; `enterActionName` is shared with the Calendar so the two
                     surfaces cannot call the same event two different things. -->
                <!-- ⭐⭐⭐ ROUND 27 #5 – ...AND IT STANDS DOWN FOR THE FOUR COLLEGE YEARS. `enterEvent`
                     opens with `guardNotEnded`, so every press inside the freeze was refused; the
                     freeze note at the head of the calendar carries the engine's own reason. -->
                <!-- ⭐⭐⭐ ROUND 35 #10 – AND IT STANDS DOWN ON A WEEK SHE HAS ALREADY ENTERED. His
                     words are quoted on `weekEntryTaken` (composables/tierState.ts), where Cyrillic
                     is allowed and in a template it is not. `enterEvent` has refused a second entry
                     on one week since the ladder-up wave; round 34 #14 then put several cards on a
                     week, so the refusal became something the player could reach by swiping. The
                     button is the engine's verdict now instead of a press that spends a confirm and
                     answers with an error.
                     ⚠ NO NOTE BESIDE IT, WHICH IS THIS SCREEN'S OWN CONVENTION: a refusal that
                     covers several cards at once is stated once, not per card – see the college
                     freeze note at the head of the feed and its ⚠ about eight copies of one
                     sentence. The committed card is one swipe away wearing `Entered`. -->
                <PrimaryPill
                  :risky="ev.cautionReason === 'fatigued'"
                  :disabled="fundsShort(ev) || game.busy || frozenForCollege || entryTaken(row)"
                  :aria-label="enterActionName(ev)"
                  @click="askEnter(ev)"
                >
                  Enter
                </PrimaryPill>
                <span v-if="fundsShort(ev)" class="hint" style="margin: 0">Not enough funds</span>
                <p v-else-if="ev.cautionReason === 'fatigued'" class="caution-note">
                  Exhausted – race anyway? Rest would be wiser.
                </p>
                <!-- THE HIRED COACH'S OPINION (load slice). Its own line, below the engine's caution and
                     never instead of it: `cautionReason` is the RULE (she is under the tier's floor) and
                     this is a PERSON's read, so a card can carry one, both or neither. Quiet styling on
                     purpose - it is advice, the Enter stays active, and the card must not look locked. -->
                <p v-if="ev.coachCaution" class="coach-note">{{ ev.coachCaution }}</p>
              </template>
              <!-- She cannot enter this one (locked ahead, or the list has closed), so the week is
                   still hers to plan: a friendly or a family week. The aspirational card stays –
                   the week just stops being dead. -->
              <!-- ⭐⭐⭐ ROUND 27 #5 – THE SECOND OF THE OWNER'S TWO GROUPS (the week planner; his
                   own words for it are quoted at `frozenForCollege` in the script, where Cyrillic
                   is allowed and in a template it is not).
                   The sheet behind it books a practice or a family week, and `bookPractice` /
                   `bookVacation` are both `guardNotEnded`: refused for the whole freeze. -->
              <button v-if="row.plannable && i === 0" :disabled="game.busy || frozenForCollege" @click="openPlanner(row)">+ Plan week</button>
              <!-- R12-1/14: on an exam week the button does not vanish SILENTLY – the card says why
                   SHE cannot go (the tournament still runs; school owns her week).
                   ⚠ ROUND 34 #14 – THIS ONE KEEPS NO `i === 0` GUARD AND THE BUTTON ABOVE DOES, which
                   is the same split the injury and shoot chips already make: «school owns this week»
                   is a FACT about the week and is true of every card on it, while «+ Plan week» is an
                   ACTION and two of them would be one control drawn twice. -->
              <span v-else-if="examReasonShows(row)" class="pill muted lock">Exams this week</span>
              <!-- ⚠ THE ALLOWANCE, BOTTOM RIGHT, ON EVERY W CARD (round-16 #7, the owner). LAST in
                   the row and pushed over by `margin-left: auto`, so it is the last thing read on the
                   card and never competes with the control beside it. `.controls` wraps, and the
                   owner has accepted the second line this takes on the one crowded combination
                   ("Entries closed" + "Exams this week" + the counter). Quiet, and deliberately not a
                   lock: it is a budget, and the card it sits on is usually one she may still enter. -->
              <span
                v-if="showsProEntries(ev)"
                class="pill muted pro-entries"
                :title="`The tour's age rule caps how many professional tournaments she may enter in the year she is this age – counted from birthday to birthday. This is where she stands against it.`"
              >
                {{ proEntriesFor(ev) }}
              </span>
              <!-- ...and the junior budget, in the same slot on the junior cards (P2). Disjoint
                   families, so exactly one of the two can ever be on a card. -->
              <span
                v-else-if="showsJuniorEntries(ev)"
                class="pill muted junior-entries"
                :title="`The junior tour caps how many international tournaments she may enter in the year she is this age – counted from birthday to birthday. This is where she stands against it.`"
              >
                {{ juniorEntriesFor(ev) }}
              </span>
            </div>
          </Card>
          </div>

          <!-- A PLANNED week: the booking reads back with its package/match name + a Cancel. When
               the week also carried a (locked) tournament, the row NAMES it, so a planned week
               never makes a calendar entry vanish without explanation – cancel and it is back. -->
          <!-- R10-4: WHEN on the first line (week + dates), WHAT on the second (the trip / the
               match). As one run-on line the booking landed mid-sentence on a third wrapped row and
               the parent had to read to the end to find out what she had actually booked. The
               practice row gets the same two-line shape – it is the same card. -->
          <!-- R11-14: the booking text and its controls are now two STACKED bands instead of two
               flex columns fighting over 285px. Side by side, the two buttons on a practice row left
               the text ~80px, so "🎾 Practice match + coach" broke across two lines mid-phrase (and
               the date line broke too) – the owner asked for that label on ONE line. Full width, it
               always is. Same shape for the vacation row: it is the same card. -->
          <!-- A BOOKED FAMILY WEEK (owner, 29.07). It used to be a muted text row beside the
               painted training and off-season cards, which made the one week the family actually
               chose the plainest thing in the feed. Now it wears its own frame, one per package.
               SHORTER than a training card, because the art is: these frames are 941x377 against
               the week paintings' 941x536, and the card follows the art rather than cropping it.
               NO BUTTON on it (the owner's call): a booked week is a statement, not a control, and
               cancelling lives where booking does - tap the card and the planner opens.
               ⚠⚠ AND THAT TAP IS DELIBERATELY NOT FROZEN FOR COLLEGE (round 27 #5, round 24 E2).
               The card only renders on a week that IS booked, and `PlanWeekSheet` answers a booked
               week with its `booked` pane – a third pane that REPLACES both booking tabs – so the
               only command this door reaches is `cancelVacation`, which the engine allows through
               the whole freeze (`guardNotEndedForGood`). -->
          <Card
            v-else-if="row.kind === 'vacation' && row.vacation && vacationArt(row)"
            variant="photo"
            class="week-card vacation"
            role="button"
            tabindex="0"
            :aria-label="`${packageLabel(row.vacation.packageId)}, ${weekLabel(row.week)} - open the planner`"
            @click="openPlanner(row)"
            @keydown.enter.prevent="openPlanner(row)"
            @keydown.space.prevent="openPlanner(row)"
          >
            <div class="week-art">
              <img :src="vacationArt(row)!" alt="" />
              <span class="week-art-scrim"></span>
            </div>
            <div class="week-body">
              <div>
                <h3 class="week-title">{{ packageLabel(row.vacation.packageId) }}</h3>
                <p class="week-dates">{{ weekOnly(row.week) }} &middot; {{ row.dates }}</p>
              </div>
              <div class="controls week-controls">
                <!-- R12-8b: a kept booking inside the layoff still wears the week's truth. -->
                <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
                <span v-if="row.shoot" class="pill shoot-chip" :title="`${row.shoot.brand} shoot week – she keeps her sessions and gives up the rest`">shoot</span>
                <span v-if="vacationGain(row) > 0" class="pill">+{{ vacationGain(row) }} condition</span>
                <span class="pill">{{ formatCents(row.vacation.paidCents) }}</span>
                <span v-if="row.event" class="week-note">Skipping {{ row.event.label }}.</span>
              </div>
            </div>
          </Card>
          <!-- A package with no painting yet keeps the old row, Cancel included. -->
          <div v-else-if="row.kind === 'vacation' && row.vacation" class="calendar-row-muted planned">
            <span class="planned-lines">
              <span class="planned-when">
                {{ weekLabel(row.week) }} · {{ row.dates }}
                <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
                <span v-if="row.shoot" class="pill shoot-chip" :title="`${row.shoot.brand} shoot week – she keeps her sessions and gives up the rest`">shoot</span>
              </span>
              <span class="planned-what">
                🏖 {{ packageLabel(row.vacation.packageId) }}
                <template v-if="row.event"> · skipping {{ row.event.label }}</template>
              </span>
            </span>
            <span class="planned-actions">
              <!-- ⚠⚠ LEFT LIVE INSIDE THE COLLEGE FREEZE, ON PURPOSE (round 24, E2). `cancelVacation`
                   takes `guardNotEndedForGood` – a booked family week is the family's own calendar,
                   and a trip booked before she left is really paid for inside the freeze. -->
              <button :disabled="game.busy" @click="askCancelVacation(row.week, row.vacation)">Cancel</button>
            </span>
          </div>
          <div v-else-if="row.kind === 'practice' && row.practice" class="calendar-row-muted planned">
            <span class="planned-lines">
              <span class="planned-when">
                {{ weekLabel(row.week) }} · {{ row.dates }}
                <!-- R12-8b: the engine refunds these on injury, so the chip here is a belt-and-braces
                     read of the same window, never a promise the match survives the layoff. -->
                <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
                <span v-if="row.shoot" class="pill shoot-chip" :title="`${row.shoot.brand} shoot week – she keeps her sessions and gives up the rest`">shoot</span>
              </span>
              <span class="planned-what">
                🎾 Practice match{{ row.practice.withCoach ? ' + coach' : '' }}
                <template v-if="row.event"> · instead of {{ row.event.label }}</template>
              </span>
            </span>
            <span class="planned-actions">
              <!-- R10-12: on the week that is next, the friendly is enterable right here – this plays
                   the week (the same single advance the Home bar does) and opens the match.
                   ⚠ W4 renamed this label – see `playPracticeWeek` in the script for what it used to
                   promise and for the owner's words. Nothing here happens as you watch: the click
                   TICKS THE WEEK, the engine resolves the friendly inside that tick, and the viewer
                   then re-simulates the stored record. The label is what the press does. -->
              <!-- ⭐⭐ ROUND 27 #5 – AND IT STANDS DOWN INSIDE THE COLLEGE FREEZE, WHICH IS THE ONE
                   CONTROL HERE THAT WAS FAILING SILENTLY. This press is an ADVANCE, and
                   `advanceRefusal` returns 'ending' behind any latch – college included – so the
                   week did not move; and 'ending' is the one stop reason with no copy in
                   `STOP_REASON_TEXT`, so R10-16's rule («no copy, no toast») meant nothing appeared
                   at all. A booked friendly really can sit inside the freeze: the departure releases
                   ENTRIES and leaves `world.practices` alone, which is why E2 opened the Cancel
                   beside this. App.vue's own week bar already stands down on a college week for
                   exactly this argument (see the note at `.next-week-bar`); this is the same command
                   on another screen, and it had not been told. -->
              <PrimaryPill v-if="row.week === week + 1" class="sfx-watch" :disabled="game.busy || frozenForCollege" @click="playPracticeWeek">
                Play it and watch
              </PrimaryPill>
              <!-- ⚠⚠ AND THE CANCEL BESIDE IT IS DELIBERATELY LEFT LIVE (round 24, E2).
                   `cancelPractice` takes `guardNotEndedForGood`, so the engine ALLOWS it through the
                   whole freeze – disabling it would be the same lie pointed the other way. -->
              <button :disabled="game.busy" @click="askCancelPractice(row)">Cancel</button>
            </span>
          </div>

          <!-- A WEEK WITH NO TOURNAMENT: training, the off-season, or exams. Owner, 28.07 - these
               used to be one muted line each, which read like table rows beside a photo album now
               that the tournament cards are cards. Same card, one size down: the painting across
               the top, the week's name, its dates, and the plan button at the foot.
               Exams have no painting yet and render without one (see src/art/weeks.ts). -->
          <Card
            v-else
            variant="photo"
            class="week-card"
            :class="{ 'off-season': row.kind === 'off-season', exam: row.kind === 'exam' }"
          >
            <div class="week-art">
              <img :src="weekArt(row)" alt="" />
              <span class="week-art-scrim"></span>
            </div>
            <div class="week-body">
              <div>
                <h3 class="week-title">{{ weekTitle(row) }}</h3>
                <p class="week-dates">{{ weekOnly(row.week) }} &middot; {{ row.dates }}</p>
              </div>
              <div class="controls week-controls">
                <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
                <span v-if="row.shoot" class="pill shoot-chip" :title="`${row.shoot.brand} shoot week – she keeps her sessions and gives up the rest`">shoot</span>
                <!-- ⭐ ROUND 27 #5 – the same button on the tournament-free week card, and the same
                     two refused commands behind it. -->
                <button v-if="row.plannable" :disabled="game.busy || frozenForCollege" @click="openPlanner(row)">+ Plan week</button>
                <span v-else-if="row.kind === 'exam'" class="week-note">School owns this week.</span>
              </div>
            </div>
          </Card>
        </template>
      </div>
      <!-- R11-5a: the line the owner needed and never had. A tier she can enter but that has nothing
           on the calendar used to be indistinguishable from one she was locked out of – both were
           simply absent. Now it says so, and says it is not a lock. -->
      <p v-if="openButUnscheduled.length" class="hint open-tier-note">
        Also open to her: {{ openButUnscheduled.join(', ') }} – none scheduled in the next
        {{ UPCOMING_WEEKS }} weeks. Not locked, just rarer: keep watching the calendar.
      </p>
      <p class="hint">
        Weeks can carry more than one event now – she can only play one, so the pick is yours.
      </p>
    </section>

    <!-- The sandbox hit-out, in the redesign's own idiom (owner, 28.07): the same notecard the rest
         of the app uses, with the matchup as its subject rather than a row of controls. Its costed
         cousin - a BOOKED practice match - lives on the calendar above. -->
    <section class="bare">
      <h2>Friendly match</h2>
      <!-- U0: the SAME Card as Home's notecards, and it always was – `.friendly-card`,
           `.diary-strip` and `.note-card` shared one rule in the sheet. The default `gradient`
           variant is that rule. -->
      <Card class="friendly-card">
        <div class="friendly-said">
          <p class="friendly-vs">{{ kidName }} <span>vs</span> Top seed</p>
          <p class="friendly-sub">
            <!-- ⚠ THE SURFACE WAS HARD-CODED TWICE HERE - once as the class `surf-clay` and once as
                 the literal word "clay" in the copy - so a friendly on any other court would have
                 shown an orange ring labelled clay. It reads the exhibition's own surface now, which
                 is the same value the match is actually played on (`exhibitionSurface`). `sm` is the
                 15px ring this subtitle already used, asked for by name instead of by being a
                 descendant of `.friendly-sub`. -->
            <SurfaceMark :surface="exhibitionSurface" size="sm" />
            <span class="event-place-sep"></span>
            <span>No points, no money – a hit-out</span>
          </p>
        </div>
        <PrimaryPill class="friendly-go" @click="playExhibition">Play match</PrimaryPill>
      </Card>
      <!-- ⚠ IT HAS A LABEL NOW (defect D9, docs/specs/e2e-coverage.md §12: unlabelled text inputs,
           placeholder only). A placeholder is not a name - it is content that disappears the moment
           anything is typed - so this box was not reachable as a named textbox at all, and a screen
           reader announced an anonymous edit field beside a Play button. A real `<label for>` is the
           fix rather than an `aria-label`, because the one thing this control needed was to say what
           it is to EVERYBODY, sighted users included: "seed (optional)" vanished on the first
           keystroke, which is exactly when the field is hardest to identify. The placeholder stays
           as the hint it always was, with the word the label now carries taken out of it. -->
      <div class="controls friendly-seed">
        <label class="hint friendly-seed-label" for="friendly-seed">Seed</label>
        <input id="friendly-seed" v-model="exhibitionSeed" type="text" placeholder="optional" />
      </div>
      <!-- ⚠ THE VIEWER USED TO BE RIGHT HERE, INLINE, and that was the fourth-place bug the owner
           found on 30.07 - there is a fourth place the match viewer lives, and all four should open
           the same way, as an overlay over the whole screen (his words are quoted at the
           `TakeoverShell` import above; this template stays Latin-only, see tests/ladder.test.ts).
           It is a takeover below now, with the other three overlays.
           WHY IT WAS A BUG AND NOT A PREFERENCE, measured at 375x812: on a tabbed screen the
           DOCUMENT is the scrollport (`main` and `.tb-screen-body` are both `overflow: visible`;
           the document scrolled to 3054px here), so the viewer's `position: sticky; bottom: 0`
           control bar pinned against the bottom of the VIEWPORT - where the app's `position: fixed`
           tab bar lives, at y=760..812. With the box score on screen the bar sat at y=736.5..791.5
           and 31.5 of its 55px were behind the bar; `elementFromPoint` at the bar's own bottom edge
           returned `.tab-icon`, so the lower half of both segmented plates could not be tapped.
           Inside a takeover the scrollport is `.tf-body` and the tab bar is covered, so the bar pins
           against the bottom of the body with nothing in front of it. -->
    </section>
    </ScreenShell>

    <!-- The overlays sit OUTSIDE the shell on purpose: each is a full-screen takeover with its own
         backdrop, so it is not part of this screen's stack. -->
    <!-- THE SANDBOX HIT-OUT, and it is the app's ONE genuinely live match. Every other surface
         replays a record the engine had already resolved and stored during the tick; this one is
         simulated at the moment the button is pressed, out of her current build, and is written
         nowhere. So it is the only place `mode="live"` is true - the blinking badge, and the shout.
         The exit is a cross for the same reason MatchReplay's is: this screen decides nothing and
         there is no screen after it, so "out" is the only thing an exit could mean here. -->
    <TakeoverShell v-if="exhibitionMatch" title="Friendly match">
      <template #sub>
        <SurfaceMark :surface="exhibitionSurface" size="sm" />
        <span class="hint tf-week-dates">No points, no money – a hit-out</span>
      </template>
      <template #exit>
        <IconButton icon="close" label="Close the friendly" title="Close" @click="closeExhibition" />
      </template>
      <!-- ⭐ ROUND-23 #4: `preview-event` is bound to a LITERAL null here, and the literal is the
           point. Round 23 found that a re-watched tournament match narrated as a Sunday-morning local
           draw because `MatchReplay` never passed this prop, and nothing caught it for two rounds -
           the prop defaults to null and null is genuinely right for two of the four match surfaces,
           so "I meant it" and "I forgot" rendered identically. The other three surfaces now DERIVE
           the answer from the stored match (`occasionOf`); this one has no stored match to derive
           from - the friendly is generated at click time and written nowhere - so it says so out
           loud instead of staying silent. There is no draw behind a hit-out: that is the truth, and
           it is the same truth the "No points, no money" pill above states. -->
      <MatchViewer
        :match="exhibitionMatch"
        :player-a="exhibitionPlayerA"
        :player-b="exhibitionPlayerB"
        :surface="exhibitionSurface"
        :rank-a="kidRank"
        :rank-b="null"
        :preview-event="null"
        mode="live"
      />
    </TakeoverShell>
    <PlanWeekSheet
      v-if="planSheet"
      :week="planSheet.week"
      :initial-tab="planSheet.tab"
      :highlight-package-id="planSheet.highlightPackageId"
      @book-practice="confirmPractice"
      @book-vacation="confirmVacation"
      @cancel-vacation="cancelVacationFromPlanner"
      @close="planSheet = null"
    />
    <ConfirmDialog
      v-if="pendingConfirm"
      :message="pendingConfirm.message"
      :confirm-label="pendingConfirm.confirmLabel"
      @confirm="runConfirm"
      @cancel="pendingConfirm = null"
    />
    <MatchReplay v-if="replayMatch" :match="replayMatch" @close="replayMatch = null" />
    <!-- R10-12: the live practice-match flow (full-screen, like the tournament's). -->
    <PracticeFlow
      v-if="practiceLive"
      :match="practiceLive"
      :week="practiceLiveWeek"
      :kid-rank="kidRank"
      @close="practiceLive = null"
    />
    <TierGuide v-if="showTierGuide" @close="showTierGuide = false" />
  </template>
</template>

<style scoped>
/* =================================================================================================
   SEASON'S OWN STYLES – moved here from src/style.css by U0
   =================================================================================================
   Same rule as Home's: shared things live in `src/style.css` or in `src/components/ui/`; what ONE
   screen composes lives scoped in that screen's file, so five agents building six screens in
   parallel are not all editing the same 4,900-line sheet. Every selector below had exactly one
   consumer, this page.

   WHAT LEFT THIS BLOCK ENTIRELY, because a component owns it now:
     the photograph card -> ui/Card.vue, `photo` variant. It was the shared rule behind
                            `.event-card` and `.week-card`; the 16/16/12 inset that was the event
                            card's alone is now a `pad` prop with the same numbers.
     the notecard        -> ui/Card.vue, default variant. `.friendly-card` was the sheet's last
                            hand-rolled copy of it, 14px inset included.
     the chance ring     -> ui/ProgressRing.vue, shared with Home's condition ring.

   WHAT DELIBERATELY STAYED IN THE SHEET, so the next reader does not "finish the job" wrongly:
     `:root` token blocks   – a scoped `:root` never matches anything. Two of them sit inside this
                              region (the coach tiers, the surface colours) and must stay global.
     `.surface-mark` / `.surface-ring` / `.surf-*` – the design's surface mark. It reads as
                              Season-only today, but the friendly card, the event card and the
                              tier guide all use it and it is design-system vocabulary, not
                              composition.
     `.event-art img` and friends – ONE rule for "a photograph filling a frame it did not size",
                              shared with Home's hero and its venue arch. Four consumers, two
                              screens.
     `.pill` `.controls` `.hint` `section h2` `.tab-row` `.tab-pill` – the app's own vocabulary.

   Scoping adds one attribute selector of specificity, so every rule here was measured against the
   running app rather than reasoned about: a computed-style walk keyed by each element's document
   rect, 236 nodes, before and after.

/* --- Season: event cards, entries strip, bracket, standings ------------------- */

/* ⭐ ROUND 27 #5 – the college freeze note stands between the heading and the first card, so it
   needs the gap underneath that a `.hint` at the FOOT of a section does not. Colour and size stay
   the shared `.hint`'s on purpose: it is the same voice the screen's other explanations speak in,
   and that pair is already measured by the contrast sweep everywhere else it appears. */
.college-freeze-note {
  margin-bottom: 10px;
}

.event-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ⭐⭐⭐ ROUND 34 #14 – ONE WEEK'S CARDS. A plain wrapper while the week holds one, which is most of
   the calendar: no display, no width, no gap, so a single-card week is byte-identical to the shipped
   layout and every measurement taken of it still holds. */
.week-stack {
  min-width: 0;
}

/* ...and a scroll-snapping strip the moment a week offers her a choice. The owner asked for exactly
   this - «чисто интерфейсная правка на свайп карточек» - and the affordance is DELIBERATELY not a
   word: the second card's own edge shows past the first (88% + a 12px gap leaves ~30px of it on a
   375px phone), which is what tells a thumb there is something to the right. Invariant 4 does not
   allow this screen to invent a caption, and it does not need one. */
.week-stack.swipeable {
  display: flex;
  flex-direction: row;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  /* The strip is the affordance; a scrollbar over a photograph is not. */
  scrollbar-width: none;
}

.week-stack.swipeable::-webkit-scrollbar {
  display: none;
}

/* ⚠ THE WIDTH IS DECLARED RATHER THAN LEFT TO `flex-basis`, and that is a testability decision as
   much as a layout one: `tests/component/fits.ts` reads the room a control has by walking
   `getComputedStyle` up the ancestors, and a basis it cannot read is a card it would score as
   full-width - which is exactly the "measured by what it says, not by what the screen can hold"
   failure round-20 #3 is about. 88% keeps every card narrower than the phone by construction. */
.week-stack.swipeable > .event-card {
  flex: 0 0 auto;
  width: 88%;
  scroll-snap-align: start;
}

/* The export's list gutter is 14px of the screen; ours already has 16px from #app, so the cards
   simply stop being inset a second time by a panel. */
section.bare .event-cards {
  margin: 0;
}

/* --- SEASON HEADER + PHASE STRIP (wave 2) --------------------------------------------------------
   The export's header: the screen's name at 20/800 with the season's own year beneath it. */
.season-title {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
}

.season-year {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

/* The pro budget (W2-LADDER §5) - the season-year line's quiet sibling, one register down: a
   fact she plans around, not a warning. */
.season-pro-budget {
  margin: 2px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* The planning counter, one register quieter than the budget above it: the supply is context for a
   decision, never the decision. The rung list is dimmer still - it is the detail you look for once
   the total has told you whether to look at all. */
.season-supply {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.season-supply-tiers {
  opacity: 0.7;
}
.season-supply-tiers::before {
  content: '· ';
}
/* ⭐⭐ ROUND-21 #2b – ITS OWN LINE, and that is the whole of the styling decision. The rung list
   above it is a `· `-joined tail because it is DETAIL about the total; this sentence is not detail,
   it is the reconciliation between this line and the cards under it, and appended to the same run
   of text it would read as one more rung. `display: block` also means it cannot push the tiers into
   a second line at 320px, which is where the strip is tightest. Same quiet register as the tail -
   it explains a number, it is not a warning. */
.season-supply-here {
  display: block;
  opacity: 0.7;
}

/* The defending badge (W2-LADDER §3): the accent register the Entered pill already uses - points
   at stake is good news to act on, not a warning - with the number kept tabular. */
/* ⚠ ONE RULE, TWO CHIPS, AND NO NEW COLOUR IS INVENTED HERE. Both say something about the PLACE
   she holds rather than about the week, so they share the accent token the palette already
   defines – the wild-card badge adds a selector to an existing declaration instead of a second
   palette entry that would then have to be kept in step with this one. */
.defend-chip,
.wildcard-chip {
  color: var(--accent);
  border-color: var(--accent);
  font-variant-numeric: tabular-nums;
}

/* THE PRO ALLOWANCE, BOTTOM RIGHT (round-16 #7). `.controls` is `display: flex; flex-wrap: wrap`, so
   `margin-left: auto` is the whole of "right" - and when the row is already full the chip wraps onto
   a line of its own and the auto margin keeps it on the right of that one. That wrap is the case the
   owner accepted in advance ("Entries closed" + "Exams this week" + this).
   ⚠ `margin-left: auto` AND NOT `justify-content`: the row's other children are laid out from the
   left and must stay there. A justification would move all of them to say one thing about this one. */
/* Both budget chips share one rule – they are the same chip on two families, and giving them two
   rules is how they would drift apart. `margin-left: auto` puts whichever one is present last in the
   controls row, so it is the last thing read and never competes with the button beside it. */
.pro-entries,
.junior-entries {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

/* Owner, 29.07: the current week rides with the year in the Season header. Quieter than the year
   itself - it is a locator, not a title. */
.season-week-now {
  color: var(--ink-soft);
  font-weight: 600;
}

/* Five cells, one per surface block, hairline-separated; the lime one is the week she is standing
   in. Driven by the engine's SURFACE_BLOCKS, so it cannot describe a season we do not generate. */
.phase-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  margin: 0 0 14px;
}

.phase-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 2px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
}

.phase-cell:first-child {
  border-left: none;
}

.phase-name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-2);
}

.phase-weeks {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.phase-cell.active {
  border: 1px solid var(--accent);
  border-radius: var(--radius-dialog);
}

.phase-cell.active .phase-name,
.phase-cell.active .phase-weeks {
  color: var(--accent);
  font-weight: 700;
}

/* The cell after the active one keeps its own hairline off, or it doubles up against the border. */
.phase-cell.active + .phase-cell {
  border-left-color: transparent;
}

/* 74% of the card, dissolved away to the left, exactly as the export draws it. */
.event-art {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 74%;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 42%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 42%);
  pointer-events: none;
}

/* The export's four-stop vertical scrim. Without it a bright court eats the type at both ends. */
.event-art-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(11, 17, 23, 0.55) 0%,
    rgba(11, 17, 23, 0.12) 34%,
    rgba(11, 17, 23, 0.55) 78%,
    rgba(11, 17, 23, 0.86) 100%
  );
}

/* Everything after the art is a sibling of it, so it needs to sit above. */
.event-card > *:not(.event-art) {
  position: relative;
}

.event-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.event-tier {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 21px;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0;
  max-width: 62%;
  text-wrap: pretty;
}

/* The FIGURE is white (owner, 28.07) - it is a reading, and every other reading on these screens is
   white. Only the sun keeps the amber, which is what makes it read as a sun. */
.event-weather {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-shadow: var(--shadow-text-on-art);
}

.event-sun {
  color: var(--amber);
}

/* WHERE THE EXPORT PRINTS A CITY. The owner moved the surface and dates here; the vertical hairline
   is the export's own separator. */
.event-place {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.event-place-sep {
  width: 1px;
  height: 13px;
  background: rgba(255, 255, 255, 0.22);
  flex: none;
}

.event-dates {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--ink-2);
  text-shadow: var(--shadow-text-on-art);
}

.event-money {
  margin-top: 14px;
}

.event-money-label {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-soft);
}

.event-money-figure {
  margin: 2px 0 0;
  font-family: var(--font-heading);
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  text-shadow: var(--shadow-text-on-art);
}

/* The line under the travel figure. v21 gave it its job back: the figure is already net of the
   academy's share, and this says so. It sits ON the venue painting like the figure above it, so it
   carries the same shadow – `--ink-soft` alone disappears over a bright court. */
.event-money-sub {
  margin: 4px 0 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
  text-shadow: var(--shadow-text-on-art);
}

/* --- THE WEEK CARD (owner, 28.07) ----------------------------------------------------------------
   A week with no tournament in it, built exactly like the tournament card: the painting fills the
   card, dissolves away to the left, and the words sit on it - name at the top, action at the foot,
   air between. The only difference is the shape, and it comes from the art: these masters are 16:9
   landscape (941x536), so the CARD takes that ratio rather than the art taking a fixed band.
   At 324px wide that is a 185px card - the same height the export gives its own cards, which is a
   coincidence worth keeping. */
.week-card {
  aspect-ratio: 941 / 536;
}

.week-art {
  position: absolute;
  inset: 0;
}

/* Fills its frame (see the shared rule up by .event-art img) and steers its own crop. */
.week-art img {
  object-position: center 38%;
}

/* Dark on the left where the words are, clear on the right where she is - the same reading the
   hero's scrim on Home makes, for the same reason. */
.week-art-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(100deg, rgba(8, 12, 17, 0.86) 0%, rgba(8, 12, 17, 0.5) 38%, rgba(8, 12, 17, 0.06) 66%),
    linear-gradient(180deg, rgba(8, 12, 17, 0.34) 0%, rgba(8, 12, 17, 0) 40%, rgba(8, 12, 17, 0.42) 100%);
}

/* Title top, controls bottom, the space between them left as space. */
.week-body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* A step under the tournament card's 21px: a training week is a smaller thing than a championship
   and the type should say so before the words do. */
.week-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
  text-shadow: var(--shadow-text-on-art);
}

.week-dates {
  margin: 5px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
  text-shadow: var(--shadow-text-on-art);
}

.week-note {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-2);
  text-shadow: var(--shadow-text-on-art);
}

.week-controls {
  margin-top: 0;
}

.week-controls button {
  border-color: rgba(255, 255, 255, 0.28);
}

.week-controls button:hover:not(:disabled) {
  border-color: var(--accent);
}

/* Exams are nobody's to plan. R12-1/14's rule survives its row becoming a card: the week is
   AFFIRMED in the accent colour, never dimmed into looking like a rendering accident. */
/* THE BOOKED FAMILY WEEK (owner, 29.07) - the same card as a training week, following its own art.
   The vacation frames are 941x377 where the week paintings are 941x536, so this card is visibly
   SHORTER in the same feed. That is deliberate: the owner asked for the card to take the picture's
   shape rather than crop a wide picture into a tall box. It carries no button, so the body needs a
   little less room at the foot than a plannable week does. */
.week-card.vacation {
  aspect-ratio: 941 / 377;
  cursor: pointer;
}

.week-card.vacation:hover,
.week-card.vacation:focus-visible {
  border-color: var(--accent-soft);
}

/* The chips on a booked week are read-only facts, not controls, so they sit quieter than the
   Enter/Plan row they share a class with. */
.week-card.vacation .week-controls .pill {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
}

.week-card.exam {
  border-color: var(--accent);
  background: var(--accent-wash);
}

/* THE FRIENDLY CARD – the sandbox hit-out, wearing the same notecard as everything else. The 14px
   inset went with the surface: it is Card's default, and all three of these were already 14. */
.friendly-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.friendly-said {
  flex: 1;
  min-width: 0;
}

.friendly-vs {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.friendly-vs span {
  color: var(--ink-soft);
  font-weight: 500;
  margin: 0 4px;
}

.friendly-sub {
  margin: 7px 0 0;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-soft);
  flex-wrap: wrap;
}

/* ⚠ THE SMALL SURFACE RING MOVED TO `.surface-mark--sm` in src/style.css, and the numbers are
   unchanged (12.5px type, no text-shadow, a 15px ring around a 7px dot). These three rules sized the
   mark by WHERE it happened to be - a descendant of this screen's subtitle - which meant the mark
   had two sizes in the app and no way for a third caller to ask for either. `SurfaceMark`'s
   `size="sm"` asks for it by name, in the template above. */

.friendly-go {
  flex: none;
}

/* The seed box is a developer affordance, not part of the card. */
.friendly-seed {
  margin-top: 10px;
}

/* D9's label. `.controls` is already a flex row, so the word sits beside the field; it takes the
   muted `.hint` ink because it names a developer affordance rather than a decision. */
.friendly-seed-label {
  margin: 0;
}

/* The entry fee sits with the deadline chips but is NOT one – it is a figure, so it reads white and
   carries no outline (owner, 28.07). */
.entry-fee {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  text-shadow: var(--shadow-text-on-art);
}

/* THE STATUS ROW. "closes W3", "Entered", the injury chip - one line, above the plaque, wrapping
   only if it truly must. It used to sit below and stack, which pushed the plaque off the card. */
.event-card .controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
}

.event-card .controls .pill {
  white-space: nowrap;
}

/* THE COACH PLAQUE – frosted glass on the photograph, the export's own idiom. */
.event-coach {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  border-radius: var(--radius-frame);
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(10, 15, 20, 0.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.event-coach-said {
  flex: 1;
  min-width: 0;
}

.event-coach-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
}

.event-coach-line {
  margin: 5px 0 0;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.35;
  color: #eef3f6;
  text-wrap: pretty;
}

/* ⭐⭐⭐ ROUND 34 #5b – the pre-draw figure's own caption. Quieter than the plaque above it, because
   it is a note ABOUT the ring rather than another thing the coach said: same column, one step down
   in size and weight, the label's own ink. It wraps like the plaque and adds no fixed height, so the
   card grows by one line and only while the draw is pending. */
.field-note {
  margin: 5px 0 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--ink-soft);
  text-wrap: pretty;
}

/* Owner, 28.07: the card's secondary buttons ("+ Plan week", "Withdraw") were disappearing into the
   photograph behind them - a 7% outline is enough on a flat panel and not on a painting. */
.event-card .controls button {
  border-color: rgba(255, 255, 255, 0.28);
}

.event-card .controls button:hover:not(:disabled) {
  border-color: var(--accent);
}

/* Season structure by surface: the two-row block strip above the Calendar list. The upcoming block
   is dimmed so the eye lands on the swing she is actually in. */
.season-blocks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.season-block {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.season-block.upcoming {
  opacity: 0.6;
}

/* A wrapping strip of chips - see .this-week-status. */

.tournament-summary {
  font-size: 13.5px;
  margin: 0 0 12px;
}

.bracket-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bracket-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-left: 3px solid var(--accent);
  background: var(--accent-wash);
  border-radius: 0 var(--radius-control) var(--radius-control) 0;
  font-size: 13.5px;
}

/* R10-15: a win and a loss used to read IDENTICALLY in the this-week list – both wore the default
   accent rail and tint, so the only signal was "beat" vs "lost to" buried in the sentence. The result
   is now carried by the row itself, using the palette's own positive/negative pair: --accent (the
   same green .pill.ok and the rank-up arrow use) for a win, --danger for a loss. The rail thickens
   from 3px to 4px so the two are separable without relying on hue alone. */
.bracket-row.won {
  border-left: 4px solid var(--accent);
  background: var(--accent-fill);
}

.bracket-row.lost {
  border-left: 4px solid var(--danger);
  background: rgba(242, 102, 79, 0.1);
}

/* Round-7 item 18: keep the "Watch" label + play icon on one line even when the match text
   squeezes the button in this flex row. */
.bracket-row .sfx-watch {
  flex-shrink: 0;
  white-space: nowrap;
}

/* R12-12 (the owner's second ask – round-11's one-line fix was the practice row): the this-week
   tournament plaque is TWO lines, the sentence on top and the scoreline on its own line beneath.
   The stack owns the row's flexible width, so the watch button can never fold the score back into
   the sentence. */
.bracket-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.bracket-score {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* ⭐⭐ ROUND 28 #4 – THE SHOOT PLATE. The owner asked for separate plates on a sponsor's shoot week,
   or at least some mark that picks one out in the season calendar (his own words are in
   docs/rounds/round-28.md item 4). This is the second of those: the app's own pill,
   in the one palette colour that already means "a commercial thing the family bought" – the wallet's
   shop magenta, `--cat-shop`. It is deliberately the same SHAPE as the injury chip it sits beside
   (both are facts about the week rather than what the week is), and deliberately not red: a shoot is
   a decision the parent made and gets paid for, not a warning.
   ⚠ NO `background`. Every pill on this screen is an outline, and a filled one would out-shout the
   tournament card's own art on the row it lands on. */
.shoot-chip {
  color: var(--cat-shop);
  border-color: var(--cat-shop);
  border-radius: var(--radius-chip);
}

</style>
