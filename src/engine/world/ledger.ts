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
  world.careerTotals ??= { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
  if (amountCents > 0) world.careerTotals.earnedCents += amountCents
  else world.careerTotals.spentCents += -amountCents
  if (category === 'prize') world.careerTotals.prizeCents += amountCents

  const entry = financeWeekEntry(world, week)
  entry.byCategory[category] = (entry.byCategory[category] ?? 0) + amountCents
}

/** Find-or-create this week's ledger row, keeping the array week-ascending (the common case is
 *  appending the current, newest week). Shared by the two writers below it so "which row is this
 *  week's" is spelled once – the same reason `seasonStartWeek` exists further down. */
function financeWeekEntry(world: WorldState, week: number): FinanceWeek {
  const found = world.financeWeeks.find((w) => w.week === week)
  if (found) return found
  const entry: FinanceWeek = { week, byCategory: {} }
  const last = world.financeWeeks[world.financeWeeks.length - 1]
  if (!last || week >= last.week) world.financeWeeks.push(entry)
  else world.financeWeeks.splice(world.financeWeeks.findIndex((w) => w.week > week), 0, entry)
  return entry
}

/** ⭐⭐ WHAT THE TILL PAID HER THIS WEEK, PARKED BESIDE THE ARITHMETIC AND NOT IN IT.
 *
 *  ⚠⚠ THIS IS NOT `accrueFinance` AND MUST NEVER BECOME IT. Her share is not a family expense – the
 *  family was credited `prize − herShare` in the first place, and `finalizeTournament`'s own note
 *  says why booking it a second time is forbidden: it «would count the same cents twice - once
 *  against `careerTotals.spentCents`, which is the denominator of the album's break-even page». So
 *  this writes `FinanceWeek.kidShare` and touches neither `byCategory` nor `careerTotals`, which is
 *  what lets a screen print the figure under a balance the figure cannot move.
 *
 *  Cents ACCUMULATE (a week that ever pays two cheques owes her both); the rate is the last one
 *  written, and two cheques in one week are one age and therefore one rate by construction.
 *
 *  ⭐⭐ ROUND 29 #10 – AND SO DOES THE BASE, WHICH IS THE WHOLE OF THAT ITEM. `baseCents` is the
 *  GROSS of the same cheque, handed in by the site that banked it, and it accumulates in lockstep
 *  with `cents` for exactly the reason `cents` does: a title week pays a prize, a result bonus and
 *  sometimes a quarterly retainer, and her «50%» is 50% of all three added up. Summing the two
 *  together is what keeps `cents === round(baseCents * bps / 10_000)` true across a multi-cheque
 *  week – ⚠ to within the per-cheque rounding, since each cheque rounds once on its own way in and
 *  a sum of rounded halves is not the rounded half of a sum. `tests/round29-kid-cut-base.test.ts`
 *  pins that tolerance at one cent per cheque rather than pretending it is zero.
 *
 *  ⚠ NEVER RE-DERIVED BY DIVIDING `cents` BY THE RATE. That division is the arithmetic that
 *  produced two wrong readings of this item before it was measured, and it re-introduces the penny
 *  `kidPrizeShareCents`' own comment forbids.
 *
 *  A pure state write on integers already decided: no draw, no clock, so the frozen MAIN capture
 *  cannot notice it – `addEvent`'s own guarantee at the top of this file. */
export function accrueKidShare(
  world: WorldState,
  week: number,
  cents: number,
  bps: number,
  baseCents: number,
): void {
  if (cents <= 0) return
  const entry = financeWeekEntry(world, week)
  entry.kidShare = {
    cents: (entry.kidShare?.cents ?? 0) + cents,
    bps,
    baseCents: (entry.kidShare?.baseCents ?? 0) + baseCents,
  }
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
    // ⚠ HER CUT RIDES ALONG AND IS NOT SUMMED – it is not in `byCategory`, so the loop above cannot
    // have seen it, and the two figures the card prints (`incomeCents`, `expenseCents`) are byte for
    // byte what they were before this field existed. That is the point of it: `finalizeTournament`
    // credits the family `prize − herShare`, so income here is ALREADY net of her cut and a memo is
    // the only honest place for it. Absent on a week that split no cheque.
    // ⚠ ROUNDED ONCE, HERE (basis points are a hundredth of a percent) – the snapshot boundary, per
    // the owner's whole-numbers rule of 26.08 and `shopView`'s `annualRatePct`. No component divides
    // the rate a second time; `FinanceWeekPoint` persists nothing, so this is a display figure born
    // whole. Cents are already integers and stay integers (tests/condition-boundary.test.ts).
    const kidShare = byWeek.get(week)?.kidShare
    out.push({
      week,
      incomeCents,
      expenseCents,
      balanceCents: 0,
      ...(kidShare
        ? {
            kidShareCents: kidShare.cents,
            kidSharePct: Math.round(kidShare.bps / 100),
            // ⭐ ROUND 29 #10 – the gross the percentage is a share OF, straight through and only
            // when the ledger row actually carries it. A week banked before that field existed has
            // no base and gets none invented here (see `FinanceWeekKidShare.baseCents`): the recap
            // reads its absence and prints the older, base-less line.
            ...(kidShare.baseCents ? { kidShareBaseCents: kidShare.baseCents } : {}),
          }
        : {}),
    })
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
