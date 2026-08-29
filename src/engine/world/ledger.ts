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
 *  Cents ACCUMULATE (a week that ever pays two cheques owes her both).
 *
 *  ⚠⚠ AND THE RATE IS THE WEEK'S EFFECTIVE ONE SINCE ROUND 29 P3, WHICH IS A REAL CHANGE OF MEANING.
 *  Until the manager's commission there was exactly one rate in the game – her age ramp – so «two
 *  cheques in one week are one age and therefore one rate by construction» was true and this stored
 *  the last rate handed in. P3 puts a SECOND rate on the same weeks: a title pays a prize at her ramp
 *  and a result bonus at `10_000 − managerCommissionBps()`, and on the shipped numbers that is 50%
 *  beside 85%. Storing either one would print a percentage that is not a percentage of the base
 *  printed beside it, which is precisely the defect round 29 #10 exists to have ended.
 *
 *  So `bps` is now `cents / baseCents` – what she actually kept of everything she was actually paid.
 *  ⚠ THAT IS THE SAFE DIRECTION OF THE DIVISION AND THE FORBIDDEN ONE IS STILL FORBIDDEN. The rule
 *  below («never re-derive the base by dividing cents by the rate») is about reconstructing MONEY
 *  from a rounded figure, and it stands. This derives a LABEL from two figures the till really paid,
 *  neither of which is invented, and it makes `cents === round(baseCents × bps / 10_000)` true by
 *  construction instead of by coincidence. On a week with a single rate it reproduces that rate
 *  exactly for any cheque above a few cents, so nothing about the pre-P3 weeks reads differently.
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
  const summedCents = (entry.kidShare?.cents ?? 0) + cents
  const summedBase = (entry.kidShare?.baseCents ?? 0) + baseCents
  entry.kidShare = {
    cents: summedCents,
    // ⚠ THE FALLBACK IS THE RATE HANDED IN, not zero and not a guess: a caller that has no base to
    // offer (none does today, and the parameter is optional-by-convention rather than by type) still
    // gets an honest rate for its single cheque. See the header for why the division is the safe one.
    bps: summedBase > 0 ? Math.round((summedCents * 10_000) / summedBase) : bps,
    baseCents: summedBase,
  }
}

/** ⭐⭐ ROUND 29 PART TWO #13 – WHAT THE COACH TOOK OFF THE WEEK'S CHEQUE, parked beside the
 *  arithmetic in the same way `accrueKidShare` parks hers, and for the MIRROR-IMAGE reason.
 *
 *  THE OWNER, 29.08: «вот и можно как раз добавить cut тренера на weekly экране для прозрачности.»
 *
 *  ⚠⚠ THIS IS NOT `accrueFinance` EITHER, AND HERE THE DANGER RUNS THE OTHER WAY. Her share was
 *  never a family expense and must not become one; the coach's share ALREADY IS one –
 *  `finalizeTournament` writes it through `addEvent` as a `coaching` expense the same tick – so
 *  booking it again here would double it inside `byCategory`, `expenseCents` and
 *  `careerTotals.spentCents`. This writes `FinanceWeek.coachCut` and touches neither, which is what
 *  lets a screen print the figure under a balance the figure has already moved once.
 *
 *  ⚠ AND IT IS CARRIED RATHER THAN RE-DERIVED, for a harder reason than hers: `byCategory.coaching`
 *  is the week's WHOLE coaching bill – the retainer, the travel fare, the facility – so the share
 *  genuinely cannot be recovered from the ledger once it is folded in. The cents handed in are the
 *  very `coachShare` variable the wallet was debited by, at the same commit point.
 *
 *  Cents ACCUMULATE on `accrueKidShare`'s reasoning; the rate is the finish's own and a week reaches
 *  `finalizeTournament` for at most one tournament, so there is no second rate to reconcile.
 *
 *  A pure state write on integers already decided: no draw, no clock. */
export function accrueCoachCut(world: WorldState, week: number, cents: number, bps: number): void {
  if (cents <= 0) return
  const entry = financeWeekEntry(world, week)
  entry.coachCut = { cents: (entry.coachCut?.cents ?? 0) + cents, bps }
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
    // ⭐⭐ ROUND 29 PART TWO #13 – AND THE COACH'S CUT RIDES ALONG THE SAME WAY, WITH THE OPPOSITE
    // RELATIONSHIP TO THE SUM. Hers is outside `byCategory` and therefore outside `expenseCents`;
    // his is a real `coaching` expense row, so the loop above has ALREADY counted it and this is a
    // name for a figure the week's spend contains. Neither is added here. Rounded once, here.
    const coachCut = byWeek.get(week)?.coachCut
    const kidShare = byWeek.get(week)?.kidShare
    out.push({
      week,
      incomeCents,
      expenseCents,
      balanceCents: 0,
      ...(coachCut ? { coachCutCents: coachCut.cents, coachCutPct: Math.round(coachCut.bps / 100) } : {}),
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
