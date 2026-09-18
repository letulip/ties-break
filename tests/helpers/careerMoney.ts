// ⭐ ROUND 46 #9 – THE HONEST MONEY, FOR A FIXTURE THAT HAS NO WORLD TO FOLD IT OUT OF.
//
// `careerMoney(world)` (engine/world/ledger.ts) is the one reader the app uses; a MOUNTED test hands
// the store a hand-built `EndingView` or `Snapshot` and has no world at all, so it needs the same
// shape built from the same `CareerTotals` it already states.
//
// ⚠ DERIVED FROM THE TOTALS RATHER THAN WRITTEN OUT, which is the point of the helper: a fixture
// that stated its totals and its money separately could state two different careers and pass, and
// the figure under test would then be proving nothing about the arithmetic it is named for.
//
// ⚠ THE DEFAULT IS A FAMILY THAT OWNS NOTHING AND A GIRL WITH NO ACCOUNT – `heldCents` 0, so
// `outlayCents === spentCents` exactly as the engine's own fold produces for an empty `assets`. That
// keeps every fixture written before this field byte-identical in meaning. `over` is how an arm that
// is ABOUT the holdings says so.
import type { CareerMoney, CareerTotals } from '../../src/shared/protocol'

export function moneyOf(totals: CareerTotals, over: Partial<CareerMoney> = {}): CareerMoney {
  return {
    earnedCents: totals.earnedCents,
    prizeCents: totals.prizeCents,
    herAccountCents: 0,
    cameInCents: totals.earnedCents,
    spentCents: totals.spentCents,
    heldCents: 0,
    outlayCents: totals.spentCents,
    holdingsCents: 0,
    ...over,
  }
}
