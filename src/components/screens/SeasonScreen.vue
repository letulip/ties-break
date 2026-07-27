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
import { KID_ID, kidMatchPlayer, isExamWeek, type PracticeCaution } from '../../engine/world'
import { isOffSeasonWeek, surfaceBlockFor, WEEKS_PER_YEAR } from '../../engine/season/calendar'
import { ECONOMY, recommendVacationPackage, vacationPackage } from '../../engine/economy'
// R11-5a: the ONE tier-state rule, shared with the Home season ladder.
import { HORIZON_WEEKS, pointsLockNote, useTierStates, type TierState } from '../../composables/tierState'
import { TIER_SHORT } from '../../composables/weekAhead'
import { weekLabel, weekRange } from '../../shared/dates'
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
const CALENDAR_HORIZON = 8 // mirrors world.ts's UPCOMING_WEEKS

const week = computed(() => game.snapshot?.week ?? 0)
const fundsCents = computed(() => game.snapshot?.fundsCents ?? 0)
const condition = computed(() => game.snapshot?.condition ?? 0)

// SEASON STRUCTURE BY SURFACE (owner approved 26.07). The calendar shows 8 weeks, so a 15-week clay
// swing would otherwise only become visible once she is standing in it – and the whole point of the
// block schedule is that the calendar tells her when her surface ARRIVES. One strip above the
// calendar names the block she is in, when it ends, and what comes next, each tagged with how it
// reads for HER build (the same surfaceStyleHint copy the event cards carry, so the two can never
// disagree). Derived purely from the week number, so nothing was added to the snapshot payload.
interface SeasonBlockView {
  label: string
  when: string
  surface: Surface
  note: string | null
  /** R10-11: read off surfaceStyleAffinity, NOT sniffed out of the note string – the strip used to
   *  test `note.includes('suits')`, which would silently mis-colour the day the copy is reworded. */
  affinity: 'suits' | 'against' | 'neutral'
}
function blockView(atWeek: number, when: string): SeasonBlockView {
  const block = surfaceBlockFor(atWeek)
  // A block's identity is its dominant surface – the one the player plans around.
  const surface = (Object.keys(block.weights) as Surface[]).reduce((a, b) =>
    block.weights[b] > block.weights[a] ? b : a,
  )
  return { label: block.label, when, surface, note: surfaceNote(surface), affinity: surfaceAffinity(surface) }
}
const seasonBlocks = computed<SeasonBlockView[]>(() => {
  if (!game.snapshot) return []
  const year = Math.floor(week.value / WEEKS_PER_YEAR)
  const endWeek = year * WEEKS_PER_YEAR + surfaceBlockFor(week.value).to
  return [
    blockView(week.value, `now – through ${weekLabel(endWeek)}`),
    blockView(endWeek + 1, `from ${weekLabel(endWeek + 1)}`),
  ]
})
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
}
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
      return s?.injury ? `Injured – back wk ${s.week + s.injury.weeksRemaining}` : 'Injured – rest up'
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
    case 'unavailable': {
      const vacation = vacations.value.find((v) => v.week === e.week)
      return vacation ? `Family vacation – ${packageLabel(vacation.packageId)}` : 'School exams this week'
    }
    default:
      // R11-5a: the WORDS come from the shared rule, the NUMBER stays the engine's own verdict for
      // THIS event. Reading the ladder's whole note here instead was tried and rejected in the
      // browser: it let a card the engine had locked print the ladder's "open" state.
      return e.pointsToEnter !== undefined ? pointsLockNote(e.pointsToEnter) : tierStateById.value[e.tier].note
  }
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
         the new Stats tab, so Season is calendar-only now. The "?" tour-guide button stays. -->
    <div class="season-topbar">
      <h2 style="margin: 0">Season</h2>
      <button class="tier-guide-btn" aria-label="Tour guide" title="Tour guide" @click="showTierGuide = true">?</button>
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
        <li
          v-for="m in thisWeekMatches"
          :key="m.id"
          class="bracket-row"
          :class="{ won: kidWon(m) === true, lost: kidWon(m) === false }"
        >
          <span>{{ m.text }}</span>
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

    <section v-if="myEntries.length">
      <h2>My entries</h2>
      <div class="entries-strip">
        <span v-for="e in myEntries" :key="e.id" class="pill ok">{{ e.label }} · {{ weekLabel(e.week) }}</span>
      </div>
    </section>

    <section>
      <h2>Calendar</h2>
      <!-- The season's surface blocks: which swing she is in, and which one is coming. -->
      <div v-if="seasonBlocks.length" class="season-blocks">
        <div v-for="(b, i) in seasonBlocks" :key="b.when" class="season-block" :class="{ upcoming: i > 0 }">
          <span class="pill">{{ SURFACE_EMOJI[b.surface] }} {{ b.label }}</span>
          <span class="hint">{{ b.when }}</span>
          <span v-if="b.note" class="hint surface-note" :class="{ suits: b.affinity === 'suits' }">{{ b.note }}</span>
        </div>
      </div>
      <div class="event-cards">
        <template v-for="row in calendarRows" :key="row.week">
          <div v-if="row.kind === 'event' && row.event" class="event-card">
            <div class="event-card-top">
              <span class="event-tier">{{ row.event.label }}</span>
              <!-- R11-15 (reverts R10-11): the coloured PILL is back in the corner, carrying the
                   surface colour and its name, and only the verdict sits under it. The name is
                   printed exactly once – here. A neutral court gets the pill and nothing else. -->
              <span class="surface-badge" :class="`aff-${surfaceView(row.event.surface).affinity}`">
                <span class="pill surface-pill" :title="surfaceView(row.event.surface).title">
                  <span aria-hidden="true">{{ surfaceView(row.event.surface).emoji }}</span>
                  {{ row.event.surface }}
                </span>
                <span v-if="surfaceView(row.event.surface).fit" class="surface-caption">
                  {{ surfaceView(row.event.surface).fit }}
                </span>
              </span>
            </div>
            <p class="hint" style="margin-top: 8px">
              {{ weekLabel(row.event.week) }} · {{ row.dates }} · entry
              {{ formatDollars(row.event.entryFeeCents) }} · travel ~{{ formatDollars(row.event.travelCostCents) }}
            </p>
            <div class="controls" style="margin-top: 8px">
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
              <span class="planned-when">{{ weekLabel(row.week) }} · {{ row.dates }}</span>
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
              <span class="planned-when">{{ weekLabel(row.week) }} · {{ row.dates }}</span>
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

          <!-- An empty week: plannable (or an exam block, which is nobody's to plan). -->
          <div
            v-else
            class="calendar-row-muted"
            :class="{ 'off-season': row.kind === 'off-season', exam: row.kind === 'exam' }"
          >
            <span class="hint" style="margin: 0">
              {{ weekLabel(row.week) }} · {{ row.dates }} ·
              {{
                row.kind === 'off-season'
                  ? 'Off-season – the natural family week'
                  : row.kind === 'exam'
                    ? 'School exams'
                    : 'Training week'
              }}
            </span>
            <button v-if="row.plannable" :disabled="game.busy" @click="openPlanner(row)">+ Plan week</button>
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

    <section>
      <h2>Friendly match</h2>
      <div class="controls">
        <input v-model="exhibitionSeed" type="text" placeholder="seed (optional)" />
        <button class="primary" @click="playExhibition">Play match</button>
        <span class="pill">{{ kidName }} vs Top seed · Clay</span>
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
