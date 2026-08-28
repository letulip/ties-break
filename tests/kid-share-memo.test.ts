// ⭐⭐⭐ HER CUT ON THE WEEK RECAP – THE ENGINE HALF: CARRIED, NOT RECONSTRUCTED, AND OUTSIDE THE SUM.
//
// THE OWNER, 27.08: «на плашке Finances на week recap после турниров можно писать что-то вроде
// Income $sum / Spent $sum / Her cut 10% $sum / Balance $sum. Мне кажется так будет нагляднее.»
//
// ⚠⚠ HIS ARITHMETIC AS WRITTEN DOUBLE-COUNTS, AND HE CHOSE THE FIX. `finalizeTournament` credits the
// family `prize − herShare` (world.ts), so the Income on that tile is ALREADY NET of her cut;
// subtracting it a second time would print a balance the till never had. Shown the two honest
// layouts he picked the memo: «(B) мемо под балансом - вот это хорошо, да». So the defect this file
// exists to make unshippable is not "the figure is missing" – it is "the figure joined the sum".
//
// ⚠ AND THE FIGURE IS THE ENGINE'S OWN. The gross cheque is persisted nowhere and dividing the
// family's row back by the ramp is forbidden by `kidPrizeShareCents`' own comment («the two balances
// add up to the tournament's cheque to the cent – a player can put the two numbers side by side on
// screen and they must not disagree by a penny»), which is exactly the side-by-side this screen is.
// So `FinanceWeek.kidShare` carries `herShare` itself, and the walked arm below proves it by the one
// witness that cannot be a recomputation: what her ACCOUNT was credited on the same tick.
//
// ⚠ MUTATION-VERIFIED – each of these turns exactly the named arm red, and each was watched doing it:
//   * `financeSeries` adds `kidShare.cents` into `incomeCents`     -> the "outside the sum" arm, and
//     the walked balance arm; the "carried to the cent" arm stays green, which is what makes the
//     two separate `it`s worth having.
//   * `accrueKidShare` writes through `accrueFinance` instead      -> the "outside the sum" arm.
//   * `accrueKidShare` given `kidPrizeShareCents(prize, age)` re-derived from a rounded gross
//                                                                  -> the "to the cent" arm.
//   * the `if (herShare > 0)` guard dropped in world.ts            -> the under-eighteen arm.
//   * `Math.round(bps / 100)` -> `bps / 100` in `financeSeries`    -> the whole-percent arm.
import { describe, it, expect } from 'vitest'
import {
  KID_ID,
  closeTournament,
  createWorld,
  enterEvent,
  financeSeries,
  financeWindow,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { kidPrizeShareBps } from '../src/engine/economy'
import { kidAgeYears } from '../src/engine/world/age'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type FinanceWeek } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { SeasonResult } from '../src/engine/season/ranking'

/** `round26-world-speaks.test.ts`'s own helper, unchanged: enter an event by parking the ranking
 *  marker the door asks for and taking it straight back out, so the walk plays a real draw. */
function enterEligible(world: WorldState, event: SeasonEvent): void {
  const min = TIERS[event.tier as TierId].enterPointBand[0]
  const marker: SeasonResult = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
}

/** What the walk harvests: for every tick, what her account gained and what the ledger row says it
 *  gained. The account balance is an INDEPENDENT WITNESS here rather than a second reading of the
 *  same field, because the two are written by different statements: `world.fundsCents` /
 *  `world.kidFundsCents` by the split, and the memo by `accrueKidShare`.
 *
 *  ⚠ THIS NOTE USED TO SAY «`world.ts:592` is the ONLY writer of `kidFundsCents` in the engine
 *  (createWorld and the v54 migration aside)», AND ROUND-28 #15 MADE THAT FALSE. The owner ruled her
 *  prize ramp onto sponsor cheques too («с чеков спонсоров… как и с призовых»), so
 *  `bankSponsorCheque` in engine/world/sponsors.ts is a second writer – reached by the advertising
 *  fee, the kit retainer, the appearance fee and the result bonus. It is corrected rather than
 *  deleted because a line number in a comment is exactly the kind of fact that rots silently: this
 *  file's walk enters tournaments and takes prize money, so what it measures is unchanged, but a
 *  reader who trusted the old sentence would conclude a sponsor cheque cannot pay her. */
interface Credit {
  fundsDelta: number
  ledgerDelta: number
  week: number
  bps: number | null
}

const kidRows = (w: WorldState): Map<number, number> =>
  new Map(w.financeWeeks.filter((x) => x.kidShare).map((x) => [x.week, x.kidShare!.cents]))

function walkPayingCareer(seed: string, seasons: number): { world: WorldState; credits: Credit[] } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 5 })
  const rng = rngFromSeed(world.seed)
  const credits: Credit[] = []
  while (world.week < WEEKS_PER_YEAR * seasons) {
    world.fundsCents = Math.max(world.fundsCents, 5_000_000_00)
    const next = world.season.find(
      (e) => e.week > world.week && e.week <= world.week + 4 && world.week <= e.deadlineWeek && !world.entries.includes(e.id),
    )
    if (next) {
      try {
        enterEligible(world, next)
      } catch {
        /* the door was shut – the walk simply does not play that week */
      }
    }
    const fundsBefore = world.kidFundsCents ?? 0
    const rowsBefore = kidRows(world)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    const rowsAfter = kidRows(world)
    // ⚠ A DELTA OVER THE WHOLE LEDGER, NOT A LOOKUP BY WEEK. `pruneFinanceWeeks` drops rows older
    // than sixty weeks, and a dropped row simply is not in `rowsAfter` – it contributes nothing to a
    // delta, whereas a subtraction of two running totals would read the prune as a refund.
    let ledgerDelta = 0
    let week = -1
    let bps: number | null = null
    for (const [wk, cents] of rowsAfter) {
      const grew = cents - (rowsBefore.get(wk) ?? 0)
      if (grew === 0) continue
      ledgerDelta += grew
      week = wk
      bps = world.financeWeeks.find((x) => x.week === wk)!.kidShare!.bps
    }
    const fundsDelta = (world.kidFundsCents ?? 0) - fundsBefore
    if (fundsDelta !== 0 || ledgerDelta !== 0) credits.push({ fundsDelta, ledgerDelta, week, bps })
  }
  return { world, credits }
}

describe('her cut is carried on the durable ledger, not reconstructed', () => {
  it('equals what her account was actually credited, to the cent, on a walked career', () => {
    const { world, credits } = walkPayingCareer('kid-share-memo', 12)
    expect(credits.length, 'the walk really paid her, more than once').toBeGreaterThan(3)
    for (const c of credits) {
      // THE WITNESS IS THE BALANCE ITSELF. Nothing here re-derives a gross cheque or re-applies the
      // ramp: `world.kidFundsCents` moved by exactly what the ledger row says it moved by.
      expect(c.ledgerDelta, `week ${c.week}: the ledger row is the cents the account received`).toBe(c.fundsDelta)
    }
    // ...and the rate on the row is the ramp at her REAL age that week (the one-clock ruling of
    // 09.08), which is the same call `finalizeTournament` divides by.
    for (const row of world.financeWeeks) {
      if (!row.kidShare) continue
      const age = kidAgeYears(row.week, world.profile.birthMonth, world.profile.birthDay)
      expect(row.kidShare.bps, `week ${row.week}: the rate the till used`).toBe(kidPrizeShareBps(age))
      expect(age, 'and nothing is credited before her eighteenth').toBeGreaterThanOrEqual(18)
    }
  })

  it('writes nothing at all before her eighteenth, on a career walked through the junior years', () => {
    // ⚠ THE GATE IS THE PRIZE EVENT'S OWN (`if (herShare > 0)`), not a second copy of the age rule –
    // so this arm is what proves the memo can never appear in a junior season, whatever the tennis
    // paid. `kidPrizeShareBps` is 0 below `ECONOMY.kidShare.fromAgeYears` and the rest follows.
    const { world, credits } = walkPayingCareer('kid-share-junior', 4)
    const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    expect(age, 'the arm really stops short of the threshold birthday').toBeLessThan(18)
    // ⭐ AND THE ARM IS NOT VACUOUS: this career banked $665,370 of prize money before her
    // eighteenth (measured, not assumed – she reaches the paying rungs years before the ramp
    // starts). So the silence below is the AGE GATE doing its work and not an absence of cheques,
    // which is the only version of this test worth having.
    expect(world.careerTotals.prizeCents, 'real cheques were cashed in the junior years').toBeGreaterThan(0)
    expect(credits, 'her account was never touched and no row was written').toEqual([])
    expect(world.financeWeeks.some((w) => w.kidShare), 'no ledger row carries a cut').toBe(false)
    // ...and the ledger is not empty for an unrelated reason – the family really was spending.
    expect(world.financeWeeks.length, 'the fixture is a real career with a real ledger').toBeGreaterThan(10)
  })
})

describe('the memo is beside the arithmetic and never inside it', () => {
  /** ONE hand-built week: a real income row, a real expense row, and a cut so large that any fold
   *  which touched it would be impossible to miss. Hand-built on purpose – the claim is about the
   *  fold, and a walked career cannot make the counter-example loud. */
  const LOUD: FinanceWeek[] = [
    { week: 40, byCategory: { prize: 900_00, travel: -300_00 }, kidShare: { cents: 100_000_00, bps: 1000 } },
  ]

  it('income, spend and balance are exactly what byCategory says, with a six-figure cut sitting on the row', () => {
    const [point] = financeSeries(LOUD, 40, 40, 0)
    expect(point.incomeCents, 'income is the positive categories and nothing else').toBe(900_00)
    expect(point.expenseCents, 'spend is the negative ones and nothing else').toBe(300_00)
    // THE CARD'S OWN BALANCE ARITHMETIC (`incomeCents + (-expenseCents)` in WeekRecapCard).
    expect(point.incomeCents - point.expenseCents, 'the balance the tile prints').toBe(600_00)
    // ...and the memo is there, which is what stops this being green for the wrong reason.
    expect(point.kidShareCents).toBe(100_000_00)
  })

  it('the season/window fold cannot see it either – it iterates byCategory, and the cut is a sibling', () => {
    const w = financeWindow(LOUD, 0)
    expect(w.incomeCents).toBe(900_00)
    expect(w.expenseCents).toBe(300_00)
    expect(w.netCents, 'the Money screen totals move by not one cent').toBe(600_00)
    expect(Object.keys(w.byCategory).sort(), 'and no category was invented for it').toEqual(['prize', 'travel'])
  })

  it('reaches the interface as a WHOLE percent, rounded once here and never in a component', () => {
    // The owner's rule of 26.08, and `shopView`'s `annualRatePct` two files over. Basis points are a
    // hundredth of a percent, so an odd retune of `ECONOMY.kidShare` must not put 12.5 on a tile.
    const odd: FinanceWeek[] = [{ week: 3, byCategory: {}, kidShare: { cents: 1_00, bps: 1250 } }]
    expect(financeSeries(odd, 3, 3, 0)[0].kidSharePct).toBe(13)
    // ...and the shipped ladder is exact at every rung, which is what a parent actually sees.
    for (const bps of [1000, 1500, 5000]) {
      const [p] = financeSeries([{ week: 3, byCategory: {}, kidShare: { cents: 1_00, bps } }], 3, 3, 0)
      expect(p.kidSharePct).toBe(bps / 100)
    }
  })

  it('leaves the point untouched on a week that split no cheque', () => {
    const [quiet] = financeSeries([{ week: 7, byCategory: { travel: -50_00 } }], 7, 7, 0)
    expect(quiet.kidShareCents, 'absent, not zero – the tile renders nothing at all').toBeUndefined()
    expect(quiet.kidSharePct).toBeUndefined()
    // The dense fold invents empty weeks; those must be bare too.
    expect(financeSeries([], 1, 2, 0).every((p) => p.kidShareCents === undefined)).toBe(true)
  })
})
