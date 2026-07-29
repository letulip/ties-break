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
import { simulateMatch } from '../../engine/match/engine'
import { annotateMatch } from '../../engine/match/rally'
import { applySurfaceStyle, surfaceStyleAffinity, surfaceStyleHint } from '../../engine/match/style'
import { KID_ID, kidMatchPlayer, isExamWeek, flipScore, type PracticeCaution } from '../../engine/world'
import { isOffSeasonWeek, surfaceBlockFor, SURFACE_BLOCKS } from '../../engine/season/calendar'
import { venueArtUrl } from '../../art/venues'
import { weekArtUrl } from '../../art/weeks'
import { rngFromSeed } from '../../engine/rng'
import type { FieldStrength } from '../../engine/season/preview'
import { ECONOMY, recommendVacationPackage, vacationPackage } from '../../engine/economy'
// R11-5a: the ONE tier-state rule, shared with the Home season ladder.
import { HORIZON_WEEKS, pointsLockNote, useTierStates, type TierState } from '../../composables/tierState'
import { TIER_SHORT } from '../../composables/weekAhead'
import { seasonWeekRange, weekLabel, weekRange } from '../../shared/dates'
import type { MatchOptions, MatchPlayer, Surface } from '../../engine/match/types'
import type { TierId } from '../../engine/season/types'
import type { AnnotatedMatch } from '../../viz/types'
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

function formatDollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`
}

const SURFACE_EMOJI: Record<string, string> = { hard: '🔵', clay: '🟠', grass: '🟢' }

// Surface x play style (docs/specs/surface-style.md): the calendar column stops being flavour, so
// the card says so in one line – and says nothing at all when the court is neutral for her build.
function surfaceNote(surface: Surface): string | null {
  return game.snapshot ? surfaceStyleHint(game.snapshot.profile.playStyle, surface) : null
}
function surfaceAffinity(surface: Surface): 'suits' | 'against' | 'neutral' {
  return game.snapshot ? surfaceStyleAffinity(game.snapshot.profile.playStyle, surface) : 'neutral'
}

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
interface SurfaceView {
  emoji: string
  affinity: 'suits' | 'against' | 'neutral'
  /** the verdict alone – "suits her game" / "not her surface" – or null on a neutral court */
  fit: string | null
  /** the engine's whole sentence, surface name included, for the pill's title */
  title: string
}
/** The engine's hint MINUS its surface-name prefix. `surfaceStyleHint` writes "Grass – suits her
 *  game"; the pill already says "grass", so only the tail belongs under it. Sliced off the engine's
 *  own string rather than re-written from the affinity, so the two can never word it differently. */
function surfaceFit(surface: Surface): string | null {
  const hint = surfaceNote(surface)
  if (!hint) return null
  const dash = hint.indexOf('– ')
  return dash < 0 ? hint : hint.slice(dash + 2)
}
function surfaceView(surface: Surface): SurfaceView {
  return {
    emoji: SURFACE_EMOJI[surface],
    affinity: surfaceAffinity(surface),
    fit: surfaceFit(surface),
    // Fall back to the bare, capitalised surface id rather than a second copy of the label table.
    title: surfaceNote(surface) ?? surface.charAt(0).toUpperCase() + surface.slice(1),
  }
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

/** The painting for a week with no tournament. Every such week has one - training and exams share
 *  the on-court frame, the three off-season weeks each wear their own (src/art/weeks.ts). */
function weekArt(row: CalendarRow): string {
  return weekArtUrl(row.week)
}
/** R12-1/14 kept: "Exams" is the owner's own word for it. */
function weekTitle(row: CalendarRow): string {
  return row.kind === 'off-season' ? 'Off-season' : row.kind === 'exam' ? 'Exams' : 'Training week'
}

/** "W8" - the week number alone. The date beside it already names the year, and `weekLabel` would
 *  print it a second time as "'38". Sliced off the shared formatter rather than re-derived, so the
 *  two can never disagree about which week it is. */
function weekOnly(w: number): string {
  return weekLabel(w).split(' ')[0]
}

/** A block's identity is the surface it is mostly made of - the one the player plans around. */
function dominantSurface(b: (typeof SURFACE_BLOCKS)[number]): Surface {
  return (Object.keys(b.weights) as Surface[]).reduce((a, x) => (b.weights[x] > b.weights[a] ? x : a))
}
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
    'You should be among the best here.',
    'She is one of the strongest in this draw.',
    'On paper this is hers to lose.',
    'A field she should be beating.',
  ],
}
function coachSays(e: UpcomingEvent): string {
  // `surfaceFit` is the engine's own verdict with the surface name sliced off (R11-15) – the card
  // names the court once, beside its ring, so the coach must not name it a second time.
  const fit = surfaceFit(e.surface)
  const pool = COACH_FIELD_LINES[e.preview.fieldStrength]
  const field = pool[Math.floor(rngFromSeed(`${game.snapshot?.seed ?? ''}:coachsay:${e.id}`)() * pool.length)]
  if (!fit) return field
  // "suits her game" -> "The court suits her game." Capitalised into a sentence, because the coach
  // speaks in sentences and the engine's fragment does not.
  return `The court ${fit}. ${field}`
}

/** The ring's arc, on the export's geometry (r=19 of a 46px box). */
const RING_C = Math.round(2 * Math.PI * 19 * 10) / 10
function ringOffset(chance: number): number {
  const p = Math.max(0, Math.min(1, chance))
  return Math.round(RING_C * (1 - p) * 10) / 10
}
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
const visibleUpcoming = computed(() =>
  upcoming.value.filter((e) => e.entered || e.ineligibleReason !== 'outgrown'),
)
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
  const byWeek = new Map<number, UpcomingEvent>()
  for (const e of visibleUpcoming.value) byWeek.set(e.week, e)
  const rows: CalendarRow[] = []
  for (let w = week.value + 1; w <= week.value + CALENDAR_HORIZON; w++) {
    const e = byWeek.get(w)
    const vacation = vacations.value.find((v) => v.week === w)
    const practice = practices.value.find((p) => p.week === w)
    const exam = isExamWeek(w)
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
// enterable with a soft caution. OUTGROWN never reaches this label any more: those events are
// filtered off the calendar (spec §1), so the case stays only as a defensive fallback.
// The injured detail names the return week (slice C) so the parent can plan around the layoff.
function lockLabel(e: UpcomingEvent): string {
  switch (e.ineligibleReason) {
    case 'outgrown':
      return 'Outgrown'
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
    case 'capped':
      return e.entryCap ? `Year limit – ${e.entryCap.used} of ${e.entryCap.limit}` : 'Year limit reached'
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
      return e.pointsToEnter !== undefined ? pointsLockNote(e.pointsToEnter) : tierStateById.value[e.tier].note
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
  pendingConfirm.value = {
    message: fatigued
      ? `${e.cautionDetail ?? 'Exhausted – racing risks injury.'} ` +
        `Enter ${e.label} (${weekLabel(e.week)}, ${e.surface}) anyway? Entry fee ${formatDollars(e.entryFeeCents)}.`
      : `Enter ${e.label} (${weekLabel(e.week)}, ${e.surface})? Entry fee ${formatDollars(e.entryFeeCents)}.`,
    confirmLabel: fatigued ? 'Push through' : 'Enter',
    onConfirm: () => game.enterEvent(e.id),
  }
}
function askWithdraw(e: UpcomingEvent): void {
  pendingConfirm.value = {
    message: `Withdraw from ${e.label} (${weekLabel(e.week)})? Entry fee ${formatDollars(e.entryFeeCents)} will be refunded.`,
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
      `${formatDollars(e.entryFeeCents)} entry fee is NOT refunded. The week frees up for a practice ` +
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
      `${what} in ${weekLabel(p.week)} – ${formatDollars(p.feeCents)}. No ranking points.`,
    confirmLabel: p.caution.level === 'caution' ? 'Push through' : 'Book it',
    onConfirm: () => game.bookPractice(p.week, p.withCoach),
  }
  planSheet.value = null
}

function confirmVacation(v: { week: number; packageId: string; label: string; priceCents: number; gain: number }): void {
  pendingConfirm.value = {
    message:
      `${v.label} in ${weekLabel(v.week)} – ${v.priceCents === 0 ? 'free' : formatDollars(v.priceCents)}, ` +
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
      booking.paidCents > 0 ? `${formatDollars(booking.paidCents)} comes back in full.` : 'Nothing was paid for it.'
    }`,
    confirmLabel: 'Cancel the trip',
    onConfirm: () => game.cancelVacation(row.week),
  }
}
function askCancelPractice(row: CalendarRow): void {
  const booking = row.practice!
  pendingConfirm.value = {
    message: `Cancel the practice match in ${weekLabel(row.week)}? ${formatDollars(booking.paidCents)} comes back in full.`,
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
const kidRank = computed(() => game.snapshot?.kidRank ?? 0)

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
/** The booked friendly for next week: play the week, then watch it live. If she got hurt (the
 *  engine cancels + refunds the booking) or the advance stopped for another reason, no friendly
 *  lands and nothing opens – the news event explains it, as before. */
async function playPracticeWeek(): Promise<void> {
  await game.advance(1)
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
    : { id: 'kid', name: kidName.value, serve: 50, ret: 50, composure: 50, stamina: 50 },
)
const exhibitionPlayerB: MatchPlayer = { id: 'top-seed', name: 'Top seed', serve: 63, ret: 60, composure: 70, stamina: 65 }
const exhibitionSeed = ref('')
const exhibitionMatch = ref<AnnotatedMatch | null>(null)

function playExhibition(): void {
  const seed = exhibitionSeed.value.trim() || `exhibition-${Date.now().toString(36)}`
  const opts: MatchOptions = { surface: exhibitionSurface, tour: 'wta', seed }
  const result = simulateMatch(exhibitionPlayerA.value, exhibitionPlayerB, opts)
  exhibitionMatch.value = annotateMatch(result, exhibitionPlayerA.value, exhibitionPlayerB, opts)
}
</script>

<template>
  <template v-if="game.snapshot">
    <p v-if="game.error" class="error">{{ game.error }}</p>

    <!-- Round-6: the Calendar/Standings segmented control is gone – standings moved to
         the new Stats tab, so Season is calendar-only now. The "?" tour-guide button stays.
         Wave 2: restyled to the export's header – the title with the season year under it, and the
         one control this screen has, on the right. -->
    <div class="season-topbar">
      <div>
        <h2 class="season-title">Season Planner</h2>
        <p class="season-year">{{ seasonYearLabel }}</p>
      </div>
      <button class="tier-guide-btn" aria-label="Tour guide" title="Tour guide" @click="showTierGuide = true">?</button>
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
        <button class="primary" @click="openRescue">See the options</button>
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
          <div v-if="row.kind === 'event' && row.event" class="event-card">
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
                   name. It replaces the emoji pill HERE and nowhere else - the pill still carries
                   R11-15's job on any surface the redesign has not reached. -->
              <span class="surface-mark" :class="`surf-${row.event.surface}`" :title="surfaceView(row.event.surface).title">
                <span class="surface-ring" aria-hidden="true"><i></i></span>
                {{ row.event.surface }}
              </span>
              <span class="event-place-sep"></span>
              <!-- Owner, 28.07: the week number belongs UP here with the dates, and without its
                   season suffix - "W8 · Feb 20-26, 2034" already says which year twice otherwise. -->
              <span class="event-dates">{{ weekOnly(row.event.week) }} &middot; {{ row.dates }}</span>
            </div>

            <div class="event-money">
              <p class="event-money-label">Travel budget</p>
              <p class="event-money-figure">{{ formatDollars(row.event.travelCostCents) }}</p>
              <!-- v21: the figure above is already NET of the scholarship, so without this line the
                   player just sees a smaller number and no reason for it. -->
              <p v-if="academyCoverPct > 0" class="event-money-sub">academy covers {{ academyCoverPct }}%</p>
            </div>

            <div class="controls">
              <!-- The entry fee reads as a FIGURE, in white, on the same row as the deadline chips
                   (owner, 28.07) - it is money, like the travel budget above it, not a caption. -->
              <span class="entry-fee">entry {{ formatDollars(row.event.entryFeeCents) }}</span>
              <!-- R12-8b: the layoff covers this WEEK, whatever the event's own lock says – a
                   points-locked card names the band first (lock precedence), so without the chip
                   the injury never appeared on it at all. -->
              <span v-if="row.injured" class="pill avail-chip red" :title="layoffNote">injury</span>
              <!-- Round-7 item 21: past tense once the window has shut. -->
              <span class="pill" :class="{ negative: week > row.event.deadlineWeek && !row.event.entered }">
                {{ week > row.event.deadlineWeek ? 'Closed' : 'closes' }} {{ weekLabel(row.event.deadlineWeek) }}
              </span>
              <span v-if="row.event.entered" class="pill ok">Entered</span>
              <!-- R10-5: an entry that survived the band crossing is COMMITTED, not illegal – but it
                   must SAY so. The owner played a Local at 122 points with nothing on screen to
                   explain it, because the card had been decluttered away entirely. -->
              <span v-if="row.event.entered && row.event.ineligibleReason === 'outgrown'" class="pill muted lock">
                🔒 Outgrown – she is past this level
              </span>
            </div>

            <!-- THE COACH PLAQUE. His read on the court and the field, and her real odds in round
                 one - see engine/season/preview.ts for what that number does and does not claim. -->
            <div class="event-coach">
              <div class="event-coach-said">
                <p class="event-coach-label">Coach says:</p>
                <p class="event-coach-line">{{ coachSays(row.event) }}</p>
              </div>
              <div
                class="chance-ring"
                role="img"
                :aria-label="`Her chance to win the first match: ${Math.round(row.event.preview.firstMatchChance * 100)} percent, against ${row.event.preview.opponentName}`"
                :title="`First round vs ${row.event.preview.opponentName}`"
              >
                <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
                  <circle cx="23" cy="23" r="19" class="chance-ring-track" stroke-width="3" />
                  <circle
                    cx="23"
                    cy="23"
                    r="19"
                    class="chance-ring-arc"
                    :stroke="chanceColor(row.event.preview.firstMatchChance)"
                    stroke-width="3"
                    stroke-linecap="round"
                    :stroke-dasharray="RING_C"
                    :stroke-dashoffset="ringOffset(row.event.preview.firstMatchChance)"
                    transform="rotate(-90 23 23)"
                  />
                </svg>
                <span class="chance-ring-value">
                  <b>{{ Math.round(row.event.preview.firstMatchChance * 100) }}</b><i>%</i>
                </span>
              </div>
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
                <button
                  class="primary"
                  :class="{ risky: row.event.cautionReason === 'fatigued' }"
                  :disabled="fundsShort(row.event) || game.busy"
                  @click="askEnter(row.event)"
                >
                  Enter
                </button>
                <span v-if="fundsShort(row.event)" class="hint" style="margin: 0">Not enough funds</span>
                <p v-else-if="row.event.cautionReason === 'fatigued'" class="caution-note">
                  Exhausted – race anyway? Rest would be wiser.
                </p>
              </template>
              <!-- She cannot enter this one (locked ahead, or the list has closed), so the week is
                   still hers to plan: a friendly or a family week. The aspirational card stays –
                   the week just stops being dead. -->
              <button v-if="row.plannable" :disabled="game.busy" @click="openPlanner(row)">+ Plan week</button>
              <!-- R12-1/14: on an exam week the button does not vanish SILENTLY – the card says why
                   SHE cannot go (the tournament still runs; school owns her week). -->
              <span v-else-if="examReasonShows(row)" class="pill muted lock">Exams this week</span>
            </div>
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
          <div v-else-if="row.kind === 'vacation' && row.vacation" class="calendar-row-muted planned">
            <span class="planned-lines">
              <span class="planned-when">
                {{ weekLabel(row.week) }} · {{ row.dates }}
                <!-- R12-8b: a kept booking inside the layoff still wears the week's truth. -->
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
                   the week (the same single advance the Home bar does) and opens it live. -->
              <button v-if="row.week === week + 1" class="primary sfx-watch" :disabled="game.busy" @click="playPracticeWeek">
                Watch it live →
              </button>
              <button :disabled="game.busy" @click="askCancelPractice(row)">Cancel</button>
            </span>
          </div>

          <!-- A WEEK WITH NO TOURNAMENT: training, the off-season, or exams. Owner, 28.07 - these
               used to be one muted line each, which read like table rows beside a photo album now
               that the tournament cards are cards. Same card, one size down: the painting across
               the top, the week's name, its dates, and the plan button at the foot.
               Exams have no painting yet and render without one (see src/art/weeks.ts). -->
          <div
            v-else
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
          </div>
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
      <div class="friendly-card">
        <div class="friendly-said">
          <p class="friendly-vs">{{ kidName }} <span>vs</span> Top seed</p>
          <p class="friendly-sub">
            <span class="surface-mark surf-clay"><span class="surface-ring" aria-hidden="true"><i></i></span> clay</span>
            <span class="event-place-sep"></span>
            <span>No points, no money – a hit-out</span>
          </p>
        </div>
        <button class="primary friendly-go" @click="playExhibition">Play match</button>
      </div>
      <div class="controls friendly-seed">
        <input v-model="exhibitionSeed" type="text" placeholder="seed (optional)" />
      </div>
      <MatchViewer
        v-if="exhibitionMatch"
        :match="exhibitionMatch"
        :player-a="exhibitionPlayerA"
        :player-b="exhibitionPlayerB"
        :surface="exhibitionSurface"
        :rank-a="kidRank"
        :rank-b="null"
        mode="live"
      />
    </section>

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
