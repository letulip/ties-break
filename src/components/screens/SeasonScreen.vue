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
// THE TAKEOVER, AND IT IS THE OTHER HALF OF `ScreenShell` (owner, 30.07: «надо все одинаково сделать
// оверлеем поверх всего экрана»). `ScreenShell` is the stack a TABBED screen gets; this is the stack a
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
import { applySurfaceStyle, surfaceStyleHint } from '../../engine/match/style'
import { KID_ID, kidMatchPlayer, isCappedProTier, isExamWeek, flipScore, type PracticeCaution } from '../../engine/world'
import { dominantSurface, isOffSeasonWeek, surfaceBlockFor, SURFACE_BLOCKS, TIERS } from '../../engine/season/calendar'
import { venueArtUrl } from '../../art/venues'
import { vacationArtUrl, weekArtUrl, weekHomeArtUrl } from '../../art/weeks'
import { portraitStage } from '../../shared/avatarEmotion'
import { rngFromSeed } from '../../engine/rng'
import type { FieldStrength } from '../../engine/season/preview'
import { ECONOMY, recommendVacationPackage, vacationPackage } from '../../engine/economy'
// R11-5a: the ONE tier-state rule, shared with the Home season ladder. R15-9 adds the sliding
// feed rule (`feedContext`/`feedShows`) and the stacked-week pick (`preferredWeekEvent`) from the same module.
import { HORIZON_WEEKS, entryBandTrack, feedContext, feedShows, pointsLockNote, preferredWeekEvent, useTierStates, type TierState } from '../../composables/tierState'
import { TIER_SHORT } from '../../composables/weekAhead'
import { consumePostAdvanceNav, holdPostAdvanceNav } from '../../composables/weekRecap'
import { seasonWeekRange, weekLabel, weekRange } from '../../shared/dates'
import { formatCents } from '../../shared/money'
import type { MatchOptions, MatchPlayer, Surface } from '../../engine/match/types'
import type { TierId } from '../../engine/season/types'
import type { AnnotatedMatch } from '../../viz/types'
import { activeLadderOfSnapshot } from '../../shared/protocol'
import type { PracticeBooking, UpcomingEvent, VacationBooking, WorldEvent, WorldMatch } from '../../shared/protocol'

const game = useGameStore()
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
function surfaceNote(surface: Surface): string | null {
  return game.snapshot ? surfaceStyleHint(game.snapshot.profile.playStyle, surface) : null
}
// ⚠ `surfaceAffinity()` went with `SurfaceView` (see the note below). It existed to colour the old
// surface PILL by whether the court suited her; the ring is coloured by the COURT (`--surface-*`) and
// the suits/against verdict reaches the player through the coach's plaque, which reads
// `surfaceStyleHint` directly. The engine rule it wrapped is untouched and still tested against
// SURFACE_STYLE_DELTAS in tests/round11-view.test.ts.

// R11-15 – the event card's surface PILL, back in the card corner. THIS REVERTS R10-11.
//
// R10-11 replaced the coloured pill with a ringed colour DOT and moved the surface name underneath
// it. The owner's verdict on that swap: «раньше в углу карточки в календаре была пилюля с типом
// покрытия и цветом – было сильно лучше, чем кружок сейчас. Надо вернуть пилюлю, а вот под ней
// оставить просто подходит или нет, а название поверхности убрать.» So the pill is back, with the
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
  const hint = surfaceNote(surface)
  if (!hint) return null
  const dash = hint.indexOf('– ')
  return dash < 0 ? hint : hint.slice(dash + 2)
}
/** The engine's whole sentence, surface name included, for the mark's title. Falls back to the bare,
 *  capitalised surface id rather than to a second copy of the label table. */
function surfaceTitle(surface: Surface): string {
  return surfaceNote(surface) ?? surface.charAt(0).toUpperCase() + surface.slice(1)
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

/** Her age band, for the band-scoped exam frame. The same one-line derivation `headerAvatar` makes off
 *  `ageYears`, and not `useKidEmotion` - this screen wants the BAND and none of the emotion machinery. */
const kidStage = computed(() => portraitStage(game.snapshot?.ageYears ?? 14))

/** The painting for a week with no tournament. Every such week has one: the three off-season weeks
 *  each wear their own, the exam fortnight wears `study-*` (W6), everything else is the on-court frame
 *  (src/art/weeks.ts).
 *
 *  ⚠ HER CURRENT BAND, ON A ROW THAT MAY BE UP TO CALENDAR_HORIZON WEEKS AWAY, and that is the right
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
  return row.kind === 'off-season' ? 'Off-season' : row.kind === 'exam' ? 'Exams' : 'Training week'
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

/** The painted court for a card. Same picker Home uses, so one tournament wears one photograph
 *  wherever it appears. */
function venueUrl(e: UpcomingEvent): string {
  return venueArtUrl(e.tier, e.surface, e.id, game.snapshot?.seed ?? '')
}

/** WHAT THE COACH SAYS about an event. Two clauses at most: how the field reads, and - only when
 *  the court actually has an opinion about her build - whether it suits her.
 *
 *  THE FIELD CLAUSE HAS FOUR WORDINGS PER VERDICT, picked off `seed:coachsay:<eventId>` (owner:
 *  «а там есть какое-то разнообразие в словах тренера?» - there was not). The event's own
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
// Owner, 31.07: «иногда попадается "On paper this is hers to lose" при 92% =) и в обратную сторону
// тоже бывает». Both halves of that are real, and they are two different faults:
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
 *  are good lines on a card where the doubt is real, and only wrong where it is not. */
const HEDGED_LINES = new Set(['On paper this is hers to lose.', 'A field she should be beating.'])

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

function coachSays(e: UpcomingEvent): string {
  // `surfaceFit` is the engine's own verdict with the surface name sliced off (R11-15) – the card
  // names the court once, beside its ring, so the coach must not name it a second time.
  const fit = surfaceFit(e.surface)
  const chance = e.preview.firstMatchChance
  const strength = e.preview.fieldStrength
  const pick = (pool: readonly string[], salt: string) =>
    pool[Math.floor(rngFromSeed(`${game.snapshot?.seed ?? ''}:${salt}:${e.id}`)() * pool.length)]

  // Filtering shortens the pool and therefore changes which line the same draw lands on – still
  // deterministic per event, which is all the sub-stream ever promised.
  const all = COACH_FIELD_LINES[strength]
  const pool = chance >= RING_CERTAIN ? all.filter((l) => !HEDGED_LINES.has(l)) : all
  const parts = [pick(pool.length ? pool : all, 'coachsay')]

  if (strength === 'strong' && chance >= RING_COMFORTABLE) parts.push(pick(DRAW_CLAUSES.kind, 'coachdraw'))
  else if (strength === 'favourite' && chance <= RING_HARD) parts.push(pick(DRAW_CLAUSES.cruel, 'coachdraw'))

  // "suits her game" -> "The court suits her game." Capitalised into a sentence, because the coach
  // speaks in sentences and the engine's fragment does not.
  if (fit) parts.unshift(`The court ${fit}.`)
  return parts.join(' ')
}

// U0: the ring's geometry and the arithmetic that turns a chance into a dash offset left for
// ui/ProgressRing.vue, which Home's condition ring reads too. Only the COLOUR stays here, and only
// because it is data.
/** Her odds read on the same red-to-green ramp the condition ring uses, so a percentage means the
 *  same thing everywhere in the app. */
function chanceColor(chance: number): string {
  return `hsl(${Math.round(Math.max(0, Math.min(1, chance)) * 120)}, 72%, 48%)`
}

const CALENDAR_HORIZON = 8 // mirrors world.ts's UPCOMING_WEEKS

const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const condition = computed(() => game.snapshot?.condition ?? 0)
// v21: the share of every trip the academy is paying. One number for the whole calendar – the
// scholarship is a rate, not a per-event deal – so each card can print it without re-deriving it.
const academyCoverPct = computed(() => Math.round((game.snapshot?.academy?.coverShare ?? 0) * 100))

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
const feed = computed(() =>
  feedContext({
    ageYears: game.snapshot?.ageYears ?? 0,
    tierOpen: game.snapshot?.tierOpen,
    upcoming: upcoming.value,
  }),
)
const visibleUpcoming = computed(() => upcoming.value.filter((e) => feedShows(e, feed.value)))
const myEntries = computed(() => upcoming.value.filter((e) => e.entered))
const vacations = computed<VacationBooking[]>(() => game.snapshot?.vacations ?? [])
const practices = computed<PracticeBooking[]>(() => game.snapshot?.practices ?? [])

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
  event?: UpcomingEvent
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
const calendarRows = computed<CalendarRow[]>(() => {
  // ⚠ R15-9: ONE ROW PER WEEK, AND THE PICK IS NOW A RULE RATHER THAN AN ACCIDENT. This used to be
  // `for (e of visibleUpcoming) byWeek.set(e.week, e)` - a Map whose LAST write wins. The season
  // list orders a stacked week strongest-tier-first (buildSeason), so "last" was the WEAKEST tier,
  // and the rare rungs never surfaced: every J300 week also carries a denser event, and the denser
  // event always overwrote it (the owner: he had never seen a J300 card). `preferredWeekEvent` is
  // the shared pick - entered first, then the highest visible rung - and the Calendar screen's
  // markers pick through the same function, so the two surfaces cannot disagree about which
  // tournament a week IS.
  const byWeek = new Map<number, UpcomingEvent>()
  for (const e of visibleUpcoming.value) {
    const held = byWeek.get(e.week)
    byWeek.set(e.week, preferredWeekEvent(held ? [held, e] : [e])!)
  }
  const rows: CalendarRow[] = []
  for (let w = week.value + 1; w <= week.value + CALENDAR_HORIZON; w++) {
    const e = byWeek.get(w)
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
      vacation,
      practice,
      // "Empty" means empty FOR HER: a week whose only tournament is one she can NOT enter – a
      // locked-ahead "Reach N pts" card (the spec keeps those visible on purpose) or one whose
      // entry list has already closed – is still hers to plan. Otherwise the aspirational cards
      // sterilise most of the calendar and the planner has nowhere to go. An ENTERED week is
      // committed, an enterable one is a real decision she should make first, exam weeks belong
      // to school, and an already-planned week is done.
      plannable:
        !vacation &&
        !practice &&
        !exam &&
        (!e || (!e.entered && (!e.eligible || week.value > e.deadlineWeek))),
      exam,
      injured: layoffCovers(w),
    })
  }
  return rows
})

function packageLabel(packageId: string): string {
  return vacationPackage(packageId)?.label ?? packageId
}

// THE DEFENDING BADGE's number (W2-LADDER §3, the owner's «очковое окно возможностей»): the
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

// THE PLANNING COUNTER (owner, 02.08: «сколько доступных турниров и какого уровня у нас до конца
// года вообще осталось, это даст человеку возможность планировать»). The engine's own read of the
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
    case 'unavailable': {
      const vacation = vacations.value.find((v) => v.week === e.week)
      return vacation ? `Family vacation – ${packageLabel(vacation.packageId)}` : 'Exams this week'
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
      return e.pointsToEnter !== undefined
        ? pointsLockNote(e.tier, e.pointsToEnter, game.snapshot?.ladders[entryBandTrack(e.tier)].points)
        : tierStateById.value[e.tier].note
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

// --- one shared confirm-popup slot (mirrors MoreScreen's pattern) ------------
interface PendingConfirm {
  message: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
}
const pendingConfirm = ref<PendingConfirm | null>(null)

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
        `Enter ${e.label} (${weekLabel(e.week)}, ${e.surface}) anyway? Entry fee ${formatCents(e.entryFeeCents)}.`
      : `${said}Enter ${e.label} (${weekLabel(e.week)}, ${e.surface})? Entry fee ${formatCents(e.entryFeeCents)}.`,
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
 *  the owner's «Она уже вымотана – ещё матч?» lands HERE, where the parent can still say yes). */
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

function askCancelVacation(row: CalendarRow): void {
  const booking = row.vacation!
  pendingConfirm.value = {
    message: `Cancel ${packageLabel(booking.packageId)} in ${weekLabel(row.week)}? ${
      booking.paidCents > 0 ? `${formatCents(booking.paidCents)} comes back in full.` : 'Nothing was paid for it.'
    }`,
    confirmLabel: 'Cancel the trip',
    onConfirm: () => game.cancelVacation(row.week),
  }
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
  })
})
/** The rescue week as the player reads it. Empty string is unreachable: the card is gated on
 *  `showRescue`, which requires a plannable week. */
const rescueWeekLabel = computed(() => (rescueWeek.value === null ? '' : weekLabel(rescueWeek.value)))
const showRescue = computed(
  () =>
    !!game.snapshot &&
    !game.snapshot.injury &&
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
 *  owner caught the same two words on the Weekly Story's copy of this control – «She played her
 *  practice match - Watch it live на кнопке. Ну точно не live, а replay, да?» – and they were no
 *  truer here, one tick removed: this handler ADVANCES THE WEEK, the engine resolves the friendly
 *  inside that tick exactly as it always did, and PracticeFlow then re-simulates the stored record
 *  under its stored seed. There is no moment at which anything is being watched as it happens. The
 *  new label is what the press actually costs and buys, in that order. */
async function playPracticeWeek(): Promise<void> {
  // ⚠ CLAIM THE POST-ADVANCE NAVIGATION FIRST (owner, 01.08: «он должен вести на пре-матч экран»).
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
const kidName = computed(() => game.snapshot?.profile.kidName ?? 'Vera')
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
          <Card
            v-if="row.kind === 'event' && row.event"
            variant="photo"
            pad="16px 16px 12px"
            class="event-card"
          >
            <!-- THE PAINTED COURT, bleeding in from the right under the export's own dissolve, with
                 a vertical scrim over it so the words keep their contrast whatever the picture is
                 doing. Same picker Home uses: one tournament, one photograph. -->
            <div class="event-art">
              <img :src="venueUrl(row.event)" alt="" />
              <span class="event-art-scrim"></span>
            </div>

            <div class="event-card-top">
              <h3 class="event-tier">{{ row.event.label }}</h3>
              <!-- Decorative weather (owner's ruling): deterministic per event, read by nothing. -->
              <span class="event-weather">
                <svg class="event-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4.2"></circle>
                  <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"></path>
                </svg>
                {{ row.event.preview.temperatureC }}&deg;
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
              <SurfaceMark :surface="row.event.surface" :title="surfaceTitle(row.event.surface)" />
              <span class="event-place-sep"></span>
              <!-- Owner, 28.07: the week number belongs UP here with the dates, and without its
                   season suffix - "W8 · Feb 20-26, 2034" already says which year twice otherwise. -->
              <span class="event-dates">{{ weekOnly(row.event.week) }} &middot; {{ row.dates }}</span>
            </div>

            <div class="event-money">
              <p class="event-money-label">Travel budget</p>
              <p class="event-money-figure">{{ formatCents(row.event.travelCostCents) }}</p>
              <!-- v21: the figure above is already NET of the scholarship, so without this line the
                   player just sees a smaller number and no reason for it. -->
              <p v-if="academyCoverPct > 0" class="event-money-sub">academy covers {{ academyCoverPct }}%</p>
            </div>

            <div class="controls">
              <!-- The entry fee reads as a FIGURE, in white, on the same row as the deadline chips
                   (owner, 28.07) - it is money, like the travel budget above it, not a caption. -->
              <span class="entry-fee">entry {{ formatCents(row.event.entryFeeCents) }}</span>
              <!-- R12-8b: the layoff covers this WEEK, whatever the event's own lock says – a
                   points-locked card names the band first (lock precedence), so without the chip
                   the injury never appeared on it at all. -->
              <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
              <!-- Round-7 item 21: past tense once the window has shut. -->
              <span class="pill" :class="{ negative: week > row.event.deadlineWeek && !row.event.entered }">
                {{ week > row.event.deadlineWeek ? 'Closed' : 'closes' }} {{ weekLabel(row.event.deadlineWeek) }}
              </span>
              <span v-if="row.event.entered" class="pill ok">Entered</span>
              <!-- THE DEFENDING BADGE (W2-LADDER §3: the points window made visible - the
                   owner's phrase is quoted at `defendingPts` in the script). Last year's counted
                   result at this exact week is about to age out of her rolling professional
                   window - the week she plays (or skips) this card is the week those points
                   leave. The number is the counted result's own; the rule is the engine's 52-week
                   window, restated nowhere. -->
              <span
                v-if="defendingPts(row.event) !== null"
                class="pill defend-chip"
                :title="`Her counted result from this week last year (${defendingPts(row.event)} pts) leaves the 52-week professional window as this week arrives.`"
              >
                defending {{ defendingPts(row.event) }} pts
              </span>
              <!-- R10-5: an entry that survived the band crossing is COMMITTED, not illegal – but it
                   must SAY so. The owner played a Local at 122 points with nothing on screen to
                   explain it, because the card had been decluttered away entirely.
                   ⚠ AND SINCE 06.08 IT IS SAID ON EVERY OUTGROWN CARD, not only an entered one, and
                   it is no longer a padlock. The rung she has passed stays open (see `tierOpenFor`),
                   so the pill's job changed from explaining a stranded commitment to labelling a
                   choice she may still make – which is what «lead with the more relevant tournament»
                   needs the weaker card to look like. -->
              <span v-if="row.event.outgrown" class="pill muted">
                Outgrown – she is past this level
              </span>
            </div>

            <!-- THE COACH PLAQUE. His read on the court and the field, and her real odds in round
                 one - see engine/season/preview.ts for what that number does and does not claim. -->
            <div class="event-coach">
              <div class="event-coach-said">
                <p class="event-coach-label">Coach says:</p>
                <p class="event-coach-line">{{ coachSays(row.event) }}</p>
              </div>
              <ProgressRing
                class="chance-ring"
                :value="row.event.preview.firstMatchChance"
                :color="chanceColor(row.event.preview.firstMatchChance)"
                :label="`Her chance to win the first match: ${Math.round(row.event.preview.firstMatchChance * 100)} percent, against ${row.event.preview.opponentName}`"
                :title="`First round vs ${row.event.preview.opponentName}`"
              >
                <b>{{ Math.round(row.event.preview.firstMatchChance * 100) }}</b><i>%</i>
              </ProgressRing>
            </div>

            <div class="controls" style="margin-top: 12px">
              <!-- Entered, list still OPEN: an ordinary withdrawal, fee refunded. -->
              <button
                v-if="row.event.entered && !row.event.cancellable"
                :disabled="game.busy"
                @click="askWithdraw(row.event)"
              >
                Withdraw
              </button>
              <!-- R10-13: entered, list CLOSED. Not a "withdraw" any more – a CANCEL, with the fee
                   forfeited, which hands the week back to the planner. Plain secondary button, like
                   the planner's own Cancel controls; the confirm carries the warning. -->
              <button v-else-if="row.event.entered" :disabled="game.busy" @click="askCancelEntry(row.event)">
                Cancel entry
              </button>
              <!-- Round-8 6b: `lock` brightens the label to soft amber (pill stays disabled). -->
              <span v-else-if="entriesClosed(row.event)" class="pill muted lock">
                Entries closed {{ weekLabel(row.event.deadlineWeek) }}
              </span>
              <!-- HARD locks: ranking gate ('locked') OR a hard availability block (injured /
                   school exams / a booked family vacation / the doctor's veto under the medical
                   floor). ORDINARY fatigue is NOT here – it stays enterable (see below). -->
              <span v-else-if="!row.event.eligible" class="pill muted lock">
                🔒 {{ lockLabel(row.event) }}
              </span>
              <template v-else>
                <!-- Fatigued is a soft, warned CHOICE: the Enter stays ACTIVE and amber, with a
                     "race anyway?" warning – never greyed out. -->
                <PrimaryPill
                  :risky="row.event.cautionReason === 'fatigued'"
                  :disabled="fundsShort(row.event) || game.busy"
                  @click="askEnter(row.event)"
                >
                  Enter
                </PrimaryPill>
                <span v-if="fundsShort(row.event)" class="hint" style="margin: 0">Not enough funds</span>
                <p v-else-if="row.event.cautionReason === 'fatigued'" class="caution-note">
                  Exhausted – race anyway? Rest would be wiser.
                </p>
                <!-- THE HIRED COACH'S OPINION (load slice). Its own line, below the engine's caution and
                     never instead of it: `cautionReason` is the RULE (she is under the tier's floor) and
                     this is a PERSON's read, so a card can carry one, both or neither. Quiet styling on
                     purpose - it is advice, the Enter stays active, and the card must not look locked. -->
                <p v-if="row.event.coachCaution" class="coach-note">{{ row.event.coachCaution }}</p>
              </template>
              <!-- She cannot enter this one (locked ahead, or the list has closed), so the week is
                   still hers to plan: a friendly or a family week. The aspirational card stays –
                   the week just stops being dead. -->
              <button v-if="row.plannable" :disabled="game.busy" @click="openPlanner(row)">+ Plan week</button>
              <!-- R12-1/14: on an exam week the button does not vanish SILENTLY – the card says why
                   SHE cannot go (the tournament still runs; school owns her week). -->
              <span v-else-if="examReasonShows(row)" class="pill muted lock">Exams this week</span>
            </div>
          </Card>

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
               cancelling lives where booking does - tap the card and the planner opens. -->
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
              </span>
              <span class="planned-what">
                🏖 {{ packageLabel(row.vacation.packageId) }}
                <template v-if="row.event"> · skipping {{ row.event.label }}</template>
              </span>
            </span>
            <span class="planned-actions">
              <button :disabled="game.busy" @click="askCancelVacation(row)">Cancel</button>
            </span>
          </div>
          <div v-else-if="row.kind === 'practice' && row.practice" class="calendar-row-muted planned">
            <span class="planned-lines">
              <span class="planned-when">
                {{ weekLabel(row.week) }} · {{ row.dates }}
                <!-- R12-8b: the engine refunds these on injury, so the chip here is a belt-and-braces
                     read of the same window, never a promise the match survives the layoff. -->
                <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
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
              <PrimaryPill v-if="row.week === week + 1" class="sfx-watch" :disabled="game.busy" @click="playPracticeWeek">
                Play it and watch
              </PrimaryPill>
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
                <button v-if="row.plannable" :disabled="game.busy" @click="openPlanner(row)">+ Plan week</button>
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
        {{ HORIZON_WEEKS }} weeks. Not locked, just rarer: keep watching the calendar.
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
      <div class="controls friendly-seed">
        <input v-model="exhibitionSeed" type="text" placeholder="seed (optional)" />
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
      <MatchViewer
        :match="exhibitionMatch"
        :player-a="exhibitionPlayerA"
        :player-b="exhibitionPlayerB"
        :surface="exhibitionSurface"
        :rank-a="kidRank"
        :rank-b="null"
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

.event-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

/* The defending badge (W2-LADDER §3): the accent register the Entered pill already uses - points
   at stake is good news to act on, not a warning - with the number kept tabular. */
.defend-chip {
  color: var(--accent);
  border-color: var(--accent);
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
</style>
