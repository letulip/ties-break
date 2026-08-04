// THE LEDGER: the two write primitives every world mutation goes through, and the pure folds that
// read the finance ledger back out.
//
// ⚠ DEPENDENCY DIRECTION. This module knows about `WorldState` as a TYPE ONLY (the import below is
// erased at compile time), so `world.ts` can import these values without a runtime cycle. Nothing
// here calls back into world.ts, and nothing here draws on any RNG stream — `addEvent` and
// `accrueFinance` are pure state writes, which is why the frozen MAIN capture cannot notice them.
import { WEEKS_PER_YEAR } from '../season/calendar'
import type {
  FinanceWeek,
  FinanceWeekPoint,
  FinanceWindow,
  WorldEvent,
  WorldEventCategory,
} from '../../shared/protocol'
import type { WorldState } from '../world'

export function addEvent(world: WorldState, e: Omit<WorldEvent, 'id'>): void {
  world.events.push({ id: world.nextEventId++, ...e })
  // Every financial event (amountCents present) also folds into the persisted finance ledger –
  // the single choke point that captures income/coaching/sponsor/gear/stringing/travel/entry with
  // zero call-site changes, and (unlike `events`) survives pruning so the Money breakdown stays
  // window-accurate. `amount === 0` sponsored line-items move no cash, so they're skipped.
  if (e.amountCents !== undefined && e.amountCents !== 0) accrueFinance(world, e.week, e.category ?? 'other', e.amountCents)
}

// Fold one financial delta into financeWeeks: find-or-create the week entry (keeping the array
// week-ascending – the common case is appending the current, newest week) and add into its category.
export function accrueFinance(world: WorldState, week: number, category: WorldEventCategory, amountCents: number): void {
  // W2-ENDINGS (v39): the same delta also folds into the CAREER totals, which is the one thing the
  // window below cannot answer. `financeWeeks` prunes to sixty weeks (FINANCE_WEEKS), so by season
  // three the early bills are gone from the save – and the epilogue's reckoning, and the break-even
  // crossing the album's central page is about, are both questions about the whole career.
  //
  // ⚠ `prize` IS COUNTED APART FROM the rest of the income, and that separation IS slot 6. Parent
  // wages, sponsor money, the academy grant and savings interest are all income; none of them is the
  // tennis paying for itself. Zero draws, at the choke point every money movement already passes.
  // Defensive `??=` because hand-built probe worlds in tests predate the field.
  world.careerTotals ??= { earnedCents: 0, spentCents: 0, prizeCents: 0 }
  if (amountCents > 0) world.careerTotals.earnedCents += amountCents
  else world.careerTotals.spentCents += -amountCents
  if (category === 'prize') world.careerTotals.prizeCents += amountCents

  let entry = world.financeWeeks.find((w) => w.week === week)
  if (!entry) {
    entry = { week, byCategory: {} }
    const last = world.financeWeeks[world.financeWeeks.length - 1]
    if (!last || week >= last.week) world.financeWeeks.push(entry)
    else world.financeWeeks.splice(world.financeWeeks.findIndex((w) => w.week > week), 0, entry)
  }
  entry.byCategory[category] = (entry.byCategory[category] ?? 0) + amountCents
}

/** THE SEASON'S IDENTITY: the 0-based index of the 52-week block a week belongs to.
 *
 *  Pure integer arithmetic on the absolute week – no calendar, no date, nothing that can drift.
 *  It is the ONLY thing allowed to identify a season: the wrap-up milestone key, the "already
 *  banked?" guard on `seasonHistory` and the row it writes all key on this. The season year the
 *  player READS is derived from it (`seasonYear` in shared/dates.ts), never the other way round –
 *  see SeasonHistoryEntry.seasonIndex for the season that went missing when it was. */
export function seasonIndexOf(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR)
}

/** The first week of the 52-week season block a week belongs to. THE ONE definition of "this
 *  season" for money: the Money screen's "This season" window and the end-of-season summary both
 *  read it, so a season can never mean two different spans on two surfaces (R11-12a). */
export function seasonStartWeek(week: number): number {
  return seasonIndexOf(week) * WEEKS_PER_YEAR
}

/** Pure category-accurate fold of `financeWeeks` from `fromWeek` onward (inclusive). No world
 *  dependency, so the bench and tests call it directly. income/expense/net are derived from the
 *  aggregated per-category totals, so `netCents === incomeCents - expenseCents === Σ byCategory`. */
export function financeWindow(financeWeeks: FinanceWeek[], fromWeek: number): FinanceWindow {
  const byCategory: Partial<Record<WorldEventCategory, number>> = {}
  for (const w of financeWeeks) {
    if (w.week < fromWeek) continue
    for (const [cat, amt] of Object.entries(w.byCategory) as [WorldEventCategory, number][]) {
      byCategory[cat] = (byCategory[cat] ?? 0) + amt
    }
  }
  let incomeCents = 0
  let expenseCents = 0
  for (const amt of Object.values(byCategory)) {
    if ((amt ?? 0) > 0) incomeCents += amt!
    else expenseCents += -(amt ?? 0)
  }
  return { startWeek: fromWeek, byCategory, incomeCents, expenseCents, netCents: incomeCents - expenseCents }
}

/** DENSE per-week income/expense over `[fromWeek, toWeek]` – the Home budget card's chart series.
 *
 *  Dense is the whole point, and the reason this is not a `.map` over `financeWeeks`: that ledger
 *  only holds weeks that HAD a financial event, so a fortnight with nothing in it simply is not
 *  there, and a chart plotted straight off it would silently close the gap and draw a quiet
 *  stretch as if it never happened. Every week in the span gets a bar, zero-valued when the ledger
 *  is silent about it.
 *
 *  Pure (no world dependency), and the same sign convention `financeWindow` folds by: positive
 *  category totals are income, negative ones are spend, reported as a magnitude. */
export function financeSeries(
  financeWeeks: FinanceWeek[],
  fromWeek: number,
  toWeek: number,
  /** what the family has RIGHT NOW, i.e. at the end of `toWeek`. The running balance is walked
   *  backwards from it, so the series can never drift away from the funds the card prints above the
   *  chart – they are the same number by construction. Defaults to 0 for callers that only want the
   *  in/out shape. */
  endBalanceCents = 0,
): FinanceWeekPoint[] {
  const byWeek = new Map<number, FinanceWeek>()
  for (const w of financeWeeks) byWeek.set(w.week, w)
  const out: FinanceWeekPoint[] = []
  for (let week = fromWeek; week <= toWeek; week++) {
    let incomeCents = 0
    let expenseCents = 0
    for (const amt of Object.values(byWeek.get(week)?.byCategory ?? {})) {
      if ((amt ?? 0) > 0) incomeCents += amt!
      else expenseCents += -(amt ?? 0)
    }
    out.push({ week, incomeCents, expenseCents, balanceCents: 0 })
  }
  // Backwards: the last week ends on today's funds, and every earlier week ends on the next week's
  // opening balance. Undoing week i means removing ITS OWN net from the balance it closed on.
  let running = endBalanceCents
  for (let i = out.length - 1; i >= 0; i--) {
    out[i].balanceCents = running
    running -= out[i].incomeCents - out[i].expenseCents
  }
  return out
}
