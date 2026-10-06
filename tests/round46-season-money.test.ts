// ⭐⭐⭐ ROUND 46 #8 + #19 – THE YEAR-END CARD'S MONEY, PINNED AT THE ENGINE THAT BANKS IT.
//
// THE OWNER, 05.10: «В попапе итогов года что-то странное с доход-расход, в расходы явно что-то
// лишнее попадает, а в доходах общее состояние и прирост не учитываются» (#8) and «Потраченные суммы на
// итогах снова не соответствуют действительности» (#19, the REOPEN).
//
// ⚠⚠ THE DEFECT WAS THE ENGINE'S, NOT THE CARD'S. `maybeFireSeasonWrapUp` banked `financeWindow`'s gross
// `expenseCents` / `incomeCents`, so a house, an academy stage and a fund deposit (the `'shop'` category:
// money that MOVED onto `world.assets`), the cars' upkeep and a sale's proceeds were «spent» / «earned».
// The dialog printed exactly what it was handed. R11-12a had reconciled the popup to the wallet (window and
// category coverage) and never asked whether a deposit is «spent»; the 18.09 reckoning asked it of the
// CAREER and left the season fold alone.
//
// WHAT THIS FILE PINS (every arm is mutation-verified – see the outcome line under #8 in
// docs/rounds/round-46.md):
//   1. THE COMPOSITION TABLE: for each of the 19 ledger categories, as a cost and as income, what lands in
//      «spent», in «earned» and on the shelf – and that the one category excluded from consumption is
//      EXACTLY `'shop'` (the engine's own `isHoldingCategory`);
//   2. THE IDENTITY `earned - spent + shelf === net` on a mixed window, with the wallet's own gross fold
//      shown untouched beside it;
//   3. HIS SCENARIO, through the real wrap: a year with a fund deposit that gained and a boat's berth –
//      the figures are the ENUMERATED components, the purchase is NOT in spent, and the history row banked
//      beside the summary reads the same locals;
//   4. THE WEALTH CHAIN: portfolio and growth, wrap to wrap; season 0 from the opening wallet; no baseline
//      means NO growth rather than a guess;
//   5. A career that buys nothing reads exactly the gross figures it always did;
//   6. THE COMPACT FORM («M») – a figure from $1M up is in millions, anything smaller is untouched.
import { describe, it, expect } from 'vitest'
import { buyAsset, createWorld, maybeFireSeasonWrapUp, sellAsset, type WorldState } from '../src/engine/world'
import { accrueFinance, accrueRealised, financeWindow, isHoldingCategory, realisedLossOf, seasonMoneyOf } from '../src/engine/world/ledger'
import { careerMoney } from '../src/engine/world/reckoning'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { seasonYear } from '../src/shared/dates'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { FinanceWeek, SeasonSummary, WorldEventCategory } from '../src/shared/protocol'
import { formatCents, formatCentsCompact, formatCentsSigned, formatCentsSignedCompact } from '../src/shared/money'

/** Every ledger category, as a Record so that adding one to the union breaks the typecheck HERE – a new
 *  category must be a decision about which side of the shelf it sits on, not an accident of the fold. */
const CATEGORIES: Record<WorldEventCategory, true> = {
  coaching: true, facility: true, travel: true, entry: true, gear: true, stringing: true, sponsor: true,
  academy: true, prize: true, tuition: true, shop: true, business: true, income: true, interest: true,
  physio: true, staff: true, vacation: true, practice: true, other: true,
}
const ALL = Object.keys(CATEGORIES) as WorldEventCategory[]

const oneRow = (cat: WorldEventCategory, cents: number): FinanceWeek[] => [{ week: 3, byCategory: { [cat]: cents } }]

describe('⭐⭐⭐ round 46 #8 – what lands in «spent», in «earned» and on the shelf', () => {
  it('THE COMPOSITION TABLE: every category, as a cost and as income', () => {
    for (const cat of ALL) {
      const held = isHoldingCategory(cat)
      // ⚠⚠ THE ARM. Mutate `seasonMoneyOf` to ignore `isHoldingCategory` and `'shop'` falls into spent and
      // earned like every other row – this table, the excluded-set arm below and the scenario all go red.
      expect(seasonMoneyOf(financeWindow(oneRow(cat, -1_000_00), 0)), `${cat} as a cost`).toEqual(
        held
          ? { spentCents: 0, earnedCents: 0, shelfNetCents: -1_000_00 }
          : { spentCents: 1_000_00, earnedCents: 0, shelfNetCents: 0 },
      )
      expect(seasonMoneyOf(financeWindow(oneRow(cat, 1_000_00), 0)), `${cat} as income`).toEqual(
        held
          ? { spentCents: 0, earnedCents: 0, shelfNetCents: 1_000_00 }
          : { spentCents: 0, earnedCents: 1_000_00, shelfNetCents: 0 },
      )
    }
  })

  it('the ONE category that is not consumption is `shop`, and nothing else was quietly excused', () => {
    const excluded = ALL.filter((c) => seasonMoneyOf(financeWindow(oneRow(c, -1_000_00), 0)).spentCents === 0)
    expect(excluded).toEqual(['shop'])
    expect(ALL.filter(isHoldingCategory)).toEqual(['shop'])
  })

  it('THE IDENTITY closes to the cent, and the wallet`s own fold is still the gross one', () => {
    const rows: FinanceWeek[] = [
      { week: 1, byCategory: { prize: 7_000_00, coaching: -3_000_00, shop: -9_000_00 } },
      { week: 2, byCategory: { shop: 2_500_00, sponsor: 400_00, travel: -1_250_00 } },
    ]
    const window = financeWindow(rows, 0)
    const money = seasonMoneyOf(window)
    // enumerated by hand: income = prize 7,000 + sponsor 400; cost = coaching 3,000 + travel 1,250; the
    // shelf's net = -9,000 + 2,500 = -6,500 (a category is classified by its NET over the window).
    expect(money).toEqual({ spentCents: 4_250_00, earnedCents: 7_400_00, shelfNetCents: -6_500_00 })
    expect(money.earnedCents - money.spentCents + money.shelfNetCents).toBe(window.netCents)
    // the Money screen's donut still sums its slices, «The shop» among them – a SECOND reading, never an edit.
    expect(window.expenseCents).toBe(10_750_00)
    expect(window.incomeCents).toBe(7_400_00)
  })
})

/** A career at the wrap-up week of `seasonIndex`, with its season window posed through the real ledger seam. */
function wrapWorld(seasonIndex: number, seed = 'r46-season-money'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  world.week = seasonIndex * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
  world.financeWeeks = []
  return world
}

/** HIS SCENARIO CLASS: a year with a fund deposit that gained and a boat's berth, around ordinary money. */
function fundYear(): WorldState {
  const world = wrapWorld(0)
  const base = seasonYearBase()
  // the ordinary year, every component enumerated: income 3,900,000 and consumption 1,000,000
  accrueFinance(world, base + 10, 'prize', 3_000_000_00)
  accrueFinance(world, base + 11, 'sponsor', 500_000_00)
  accrueFinance(world, base + 12, 'income', 400_000_00)
  accrueFinance(world, base + 13, 'coaching', -600_000_00)
  accrueFinance(world, base + 14, 'travel', -300_000_00)
  accrueFinance(world, base + 15, 'entry', -100_000_00)
  // the asset PURCHASE goes through the real shop path (a `'shop'` expense AND a row on `world.assets`) …
  world.fundsCents = 6_000_000_00 + 4_000_000_00
  buyAsset(world, 'index-fund', 4_000_000_00)
  // … the fund GAINED 400,000 over the year (what `revalueAssets` writes onto the row, never a ledger line) …
  world.assets.find((a) => a.id === 'index-fund')!.valueCents = 4_400_000_00
  // … and a berth bill, which the ledger books under the same category as the purchase.
  accrueFinance(world, base + 30, 'shop', -20_000_00)
  return world
}
const seasonYearBase = (): number => 0

describe('⭐⭐⭐ round 46 #8 – HIS SCENARIO, through the real wrap-up', () => {
  it('the purchase is NOT in «spent»; the figures are the enumerated components; the rows add up', () => {
    const world = fundYear()
    maybeFireSeasonWrapUp(world)
    const s = world.lastSeasonSummary!

    // ⚠⚠ RED ON THE UNFIXED TREE, which banked the gross: spentCents was 5,020,000_00 (the deposit and the berth
    // inside it) and earnedCents was the same 3,900,000_00 – this line is the owner's #8 and #19 in one number.
    expect(s.spentCents, 'consumption only: coaching 600,000 + travel 300,000 + entries 100,000').toBe(1_000_000_00)
    expect(s.earnedCents, 'income only: prize 3,000,000 + sponsor 500,000 + income 400,000').toBe(3_900_000_00)
    // the net is the WALLET's change and did not move: 3.9M - 1.0M - 4.0M (deposit) - 0.02M (berth)
    expect(s.fundsDeltaCents).toBe(-1_120_000_00)
    expect(s.wealth!.shelfNetCents, 'the shop row, taken out of both figures above').toBe(-4_020_000_00)
    // and the three add up to the bottom line, to the cent
    expect(s.earnedCents! - s.spentCents! + s.wealth!.shelfNetCents).toBe(s.fundsDeltaCents)
    // the gross the wallet's donut shows is still recoverable: spent + the shelf's outflow
    expect(s.spentCents! - s.wealth!.shelfNetCents).toBe(5_020_000_00)
  })

  it('the income side now says what she HOLDS and how much richer the year made the family', () => {
    const world = fundYear()
    maybeFireSeasonWrapUp(world)
    const w = world.lastSeasonSummary!.wealth!

    expect(w.holdingsCents, 'the fund at what it is worth, gain included').toBe(4_400_000_00)
    expect(w.portfolioCents, 'wallet 6,000,000 + holdings 4,400,000').toBe(10_400_000_00)
    // parity: the card's portfolio IS the epilogue's «Family's portfolio», off the same fold
    expect(w.portfolioCents).toBe(careerMoney(world).portfolioCents)
    // season 0: the shelf started empty, so the baseline is the opening wallet = funds - the window's net =
    // 6,000,000 + 1,120,000. Growth = 10,400,000 - 7,120,000, and by components (income - consumption - what
    // went to the shelf + what the shelf is now worth):
    expect(w.growthCents).toBe(3_900_000_00 - 1_000_000_00 - 4_020_000_00 + 4_400_000_00)
    expect(w.growthCents).toBe(3_280_000_00)
  })

  it('the history row banked beside the summary reads the SAME locals, so the two cannot disagree', () => {
    const world = fundYear()
    maybeFireSeasonWrapUp(world)
    const s = world.lastSeasonSummary!
    const row = world.seasonHistory[world.seasonHistory.length - 1]!
    expect(row.spentCents).toBe(s.spentCents)
    expect(row.earnedCents).toBe(s.earnedCents)
    expect(row.fundsDeltaCents).toBe(s.fundsDeltaCents)
  })
})

/** A summary as the previous wrap-up banked it, for the chain. */
function previousSummary(year: number, portfolioCents: number): SeasonSummary {
  return {
    seasonYear: year,
    endRank: 100,
    startRank: null,
    points: 0,
    wins: 0,
    losses: 0,
    bestResultText: 'No tournaments played',
    fundsDeltaCents: 0,
    wealth: { portfolioCents, holdingsCents: 3_000_000_00, shelfNetCents: 0 },
  }
}

/** Season `index`'s wrap with 3,000,000 of fund held at 3,900,000, a wallet of 5,000,000 and NO purchase this year. */
function holdingYear(index: number, prior: SeasonSummary | null): WorldState {
  const world = createWorld('r46-season-chain', { ...DEFAULT_PROFILE })
  world.week = 5
  world.fundsCents = 5_000_000_00 + 3_000_000_00
  buyAsset(world, 'index-fund', 3_000_000_00)
  world.assets.find((a) => a.id === 'index-fund')!.valueCents = 3_900_000_00
  world.week = index * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
  world.financeWeeks = [] // last year's purchase is out of THIS window – nothing moved through the shelf
  world.lastSeasonSummary = prior
  return world
}

describe('⭐⭐⭐ round 46 #8 – the wealth chain, wrap to wrap', () => {
  it('growth is this wrap`s portfolio minus LAST year`s banked one – the number the player was shown', () => {
    const world = holdingYear(1, previousSummary(seasonYear(0), 8_000_000_00))
    maybeFireSeasonWrapUp(world)
    const w = world.lastSeasonSummary!.wealth!
    expect(w.portfolioCents).toBe(5_000_000_00 + 3_900_000_00)
    expect(w.shelfNetCents, 'nothing moved through the shelf this year').toBe(0)
    expect(w.growthCents).toBe(8_900_000_00 - 8_000_000_00)
  })

  it('NO baseline means NO growth – the first wrap after this shipped, and a skipped season, are not guessed', () => {
    const none = holdingYear(1, null)
    maybeFireSeasonWrapUp(none)
    expect(none.lastSeasonSummary!.wealth!.portfolioCents).toBe(8_900_000_00)
    expect(none.lastSeasonSummary!.wealth!.growthCents).toBeUndefined()

    const legacy = holdingYear(1, { ...previousSummary(seasonYear(0), 0), wealth: undefined })
    maybeFireSeasonWrapUp(legacy)
    expect(legacy.lastSeasonSummary!.wealth!.growthCents, 'a summary banked before this change has no portfolio').toBeUndefined()

    const stale = holdingYear(2, previousSummary(seasonYear(0), 8_000_000_00))
    maybeFireSeasonWrapUp(stale)
    expect(stale.lastSeasonSummary!.wealth!.growthCents, 'two seasons back is not LAST year').toBeUndefined()
  })
})

describe('⭐ round 46 #8 – a career that buys nothing reads exactly what it always read', () => {
  it('spent and earned are the wallet`s gross figures, and there is no shelf and no holdings to speak of', () => {
    const world = wrapWorld(0)
    accrueFinance(world, 10, 'prize', 21_502_00)
    accrueFinance(world, 11, 'coaching', -12_000_00)
    accrueFinance(world, 12, 'travel', -8_779_00)
    const gross = financeWindow(world.financeWeeks, 0)
    maybeFireSeasonWrapUp(world)
    const s = world.lastSeasonSummary!
    expect(s.spentCents).toBe(gross.expenseCents)
    expect(s.earnedCents).toBe(gross.incomeCents)
    expect(s.wealth!.shelfNetCents).toBe(0)
    expect(s.wealth!.holdingsCents).toBe(0)
    // no holdings: the portfolio IS the wallet and its growth IS the funds delta, which is why the card hides it
    expect(s.wealth!.growthCents).toBe(s.fundsDeltaCents)
  })
})

describe('⭐ round 46 #19 – the compact form: millions in «M», everything smaller untouched', () => {
  it('writes a figure from $1M up in millions with one decimal', () => {
    expect(formatCentsCompact(12_400_000_00)).toBe('$12.4M')
    expect(formatCentsCompact(1_000_000_00)).toBe('$1.0M')
    expect(formatCentsCompact(-5_000_000_00)).toBe('-$5.0M')
    expect(formatCentsSignedCompact(2_100_000_00)).toBe('+$2.1M')
    expect(formatCentsSignedCompact(-4_020_000_00)).toBe('-$4.0M')
  })

  it('leaves every smaller figure EXACTLY what the full forms print', () => {
    for (const cents of [0, 49, 50, 12_345, 723_00, 20_779_00, 999_999_00, -999_999_00, -49]) {
      expect(formatCentsCompact(cents), `${cents} cents`).toBe(formatCents(cents))
      expect(formatCentsSignedCompact(cents), `${cents} cents`).toBe(formatCentsSigned(cents))
    }
  })

  it('reads the boundary off the ROUNDED dollars, so no "$1,000,000" ever stands beside an M column', () => {
    expect(formatCentsCompact(999_999_60)).toBe('$1.0M')
    expect(formatCentsCompact(999_999_49)).toBe('$999,999')
    expect(formatCentsCompact(1_250_000_00)).toBe('$1.3M')
    expect(formatCentsCompact(1_249_999_00)).toBe('$1.2M')
  })
})

// ⭐⭐⭐ ROUND 46, MORNING ITEM 4 (06.10) – A SALE THAT FIXED A LOSS IS A REAL EXPENSE, AND ONLY A LOSS.
//
// THE OWNER, 06.10: «а) мне нужно видеть реальные расходы и доходы, мы это уже обсуждали. Инвестиция это не совсем расход, только если мы не в минусе
// зафиксировались». B5 took the whole `'shop'` category out of «spent» (a deposit moves, it does not leave); this is the part of it that DOES leave – what a
// sale got back below what it had cost – named as its own figure and banked beside the shelf it is inside of.
//
// ⚠⚠ EVERY EXPECTED FIGURE BELOW IS MEASURED OFF THE WALLET AND THE SOLD ROW (`fundsCents` before and after, the row's `paidCents` before and after), NEVER OFF THE
// MEMO UNDER TEST, and the hand-computed literals are there so a memo that drifted with its reader could not pass. The source of the figure is the memo
// `FinanceWeek.realisedCents`, which the two settle sites write from the very delta their ledger sentence names: the asset rows cannot say it (a whole sale
// deletes the row; `realisedGainCents` is lifetime and part-sale-only).

/** A season-0 year in which the family bought a car and sold it again at once, around ordinary money. */
function carYear(): { world: WorldState; paid: number; fetched: number; rngBefore: string } {
  const world = wrapWorld(0, 'r46-realised-car')
  world.fundsCents = 5_000_000_00
  accrueFinance(world, 10, 'prize', 300_000_00)
  accrueFinance(world, 11, 'coaching', -100_000_00)
  buyAsset(world, 'car-sensible')
  const paid = world.assets.find((a) => a.id === 'car-sensible')!.paidCents
  const before = world.fundsCents
  const rngBefore = JSON.stringify(world.rngMain)
  sellAsset(world, 'car-sensible')
  return { world, paid, fetched: world.fundsCents - before, rngBefore }
}

/** Buy 4,000,000 of the index fund, let it be worth `valueCents`, and take `saleCents` out: what the part that left cost and what it fetched, off the row and the wallet. */
function fundSale(world: WorldState, valueCents: number, saleCents: number): { purchase: number; basisReleased: number; proceeds: number } {
  const purchase = 4_000_000_00
  world.fundsCents += purchase
  buyAsset(world, 'index-fund', purchase)
  const row = world.assets.find((a) => a.id === 'index-fund')!
  row.valueCents = valueCents
  return withdraw(world, saleCents)
}

/** One more withdrawal from the fund the family already holds. */
function withdraw(world: WorldState, saleCents: number): { purchase: number; basisReleased: number; proceeds: number } {
  const row = world.assets.find((a) => a.id === 'index-fund')!
  const paidBefore = row.paidCents
  const before = world.fundsCents
  sellAsset(world, 'index-fund', saleCents)
  return { purchase: 4_000_000_00, basisReleased: paidBefore - row.paidCents, proceeds: world.fundsCents - before }
}

describe('⭐⭐⭐ round 46 morning item 4 – a sale that FIXED a loss is a real expense, and only a loss', () => {
  it('a whole sale of a thing at a loss: the loss is proceeds-minus-cost to the cent, off the wallet and the sold row', () => {
    const { world, paid, fetched, rngBefore } = carYear()
    expect(fetched, 'the scenario has to be a loss year: a car resold at once fetches less than it cost').toBeLessThan(paid)
    // ⚠⚠ THE ARM. Mutate `realisedLossOf` to return 0, or drop `accrueRealised` from `settleAssetSale`, and this goes red.
    expect(realisedLossOf(world.financeWeeks, 0)).toBe(paid - fetched)
    // the memo is ONE signed figure on the week's row, beside the categories and not in them
    const week = world.financeWeeks.find((w) => w.realisedCents !== undefined)!
    expect(week.realisedCents).toBe(fetched - paid)
    // the booking did not move: purchase and proceeds are the one ordinary `shop` net, memo or no memo
    expect(week.byCategory.shop).toBe(fetched - paid)
    // zero draws: the sale never touched the MAIN stream
    expect(JSON.stringify(world.rngMain)).toBe(rngBefore)
  })

  it('THE RELATION: the loss is NAMED INSIDE the shelf and never added to it – the identity is untouched and the card`s rows add up once', () => {
    const { world, paid, fetched } = carYear()
    const loss = paid - fetched
    const window = financeWindow(world.financeWeeks, 0)
    const money = seasonMoneyOf(window)
    // the shelf is the whole `shop` net, the sale's proceeds netted against the purchase: -purchases + proceeds
    expect(money.shelfNetCents).toBe(-paid + fetched)
    // B5's identity, exactly as it stood: the loss is INSIDE the shelf figure, so nothing was added to the arithmetic
    expect(money.earnedCents - money.spentCents + money.shelfNetCents).toBe(window.netCents)
    // shelf = -(purchases - basis released) - loss. The sale released the WHOLE basis, so the first term is nothing: what is left on the shelf is the loss
    expect(money.shelfNetCents + loss).toBe(0)
    // the card prints the loss as an expense row, so its shelf row is the shelf WITHOUT it – and the rows add up exactly once
    expect(money.earnedCents - money.spentCents - loss + (money.shelfNetCents + loss)).toBe(window.netCents)
    // …whereas adding the loss to the identity AS IT STANDS counts it twice: this is the double count the card must never print
    expect(money.earnedCents - money.spentCents - loss + money.shelfNetCents).toBe(window.netCents - loss)
  })

  it('a PART sale at a loss: loss = released basis - proceeds, and shelf = -(purchases - basis released) - loss', () => {
    const world = wrapWorld(0, 'r46-realised-fund')
    world.fundsCents = 6_000_000_00
    accrueFinance(world, 10, 'prize', 300_000_00)
    // the market fell 10%: 4,000,000 bought is worth 3,600,000 and a million is taken out
    const { purchase, basisReleased, proceeds } = fundSale(world, 3_600_000_00, 1_000_000_00)
    const loss = basisReleased - proceeds
    // hand-computed: the cost of the million that left is 4,000,000 x 1,000,000 / 3,600,000 = 1,111,111.11 -> 111,111,111 cents, so the loss is 11,111,111 cents
    expect(loss).toBe(11_111_111)
    expect(realisedLossOf(world.financeWeeks, 0)).toBe(11_111_111)
    const window = financeWindow(world.financeWeeks, 0)
    const money = seasonMoneyOf(window)
    expect(money.shelfNetCents).toBe(-purchase + proceeds)
    // the relation, on the principal that STAYED on the shelf: -(4,000,000 - 1,111,111.11) = -2,888,888.89
    expect(money.shelfNetCents + loss).toBe(-(purchase - basisReleased))
    expect(money.shelfNetCents + loss).toBe(-288_888_889)
    expect(money.earnedCents - money.spentCents + money.shelfNetCents).toBe(window.netCents)
  })

  it('a GAIN-fixing year is 0 – it is not income, the row hides, and the summary banks nothing for it', () => {
    const world = wrapWorld(0, 'r46-realised-gain')
    world.fundsCents = 6_000_000_00
    const { basisReleased, proceeds } = fundSale(world, 4_400_000_00, 1_000_000_00)
    expect(proceeds - basisReleased, 'the part that left was worth more than it cost').toBe(9_090_909)
    expect(realisedLossOf(world.financeWeeks, 0)).toBe(0)
    maybeFireSeasonWrapUp(world)
    const s = world.lastSeasonSummary!
    expect(s.wealth, 'the wealth block is banked as ever').toBeDefined()
    // ABSENT at zero, not 0: a year with no loss banks exactly what it banked yesterday
    expect('realisedLossCents' in s.wealth!).toBe(false)
    // and B5's identity on the banked figures is as it was – a gain stays inside the shelf and joins nothing
    expect(s.earnedCents! - s.spentCents! + s.wealth!.shelfNetCents).toBe(s.fundsDeltaCents)
  })

  it('the figure is NET over the window: a gain on one sale hides a loss on another, and what is left is the loss', () => {
    for (const [secondValueCents, expectLoss] of [[5_000_000_00, false], [2_000_000_00, true]] as const) {
      const world = wrapWorld(0, 'r46-realised-net')
      world.fundsCents = 6_000_000_00
      const first = fundSale(world, 3_600_000_00, 1_000_000_00)
      world.assets.find((a) => a.id === 'index-fund')!.valueCents = secondValueCents
      const second = withdraw(world, 1_000_000_00)
      const net = first.proceeds - first.basisReleased + (second.proceeds - second.basisReleased)
      expect(first.proceeds - first.basisReleased, 'the first sale fixed a loss').toBeLessThan(0)
      expect(realisedLossOf(world.financeWeeks, 0)).toBe(Math.max(0, -net))
      expect(realisedLossOf(world.financeWeeks, 0) > 0, `second sale at a fund worth ${secondValueCents / 100}`).toBe(expectLoss)
    }
  })

  it('the window is the one `financeWindow` folds, a zero delta writes nothing, and the memo is outside every arithmetic', () => {
    const rows: FinanceWeek[] = [
      { week: 3, byCategory: { shop: 1_000_00 }, realisedCents: -500_00 },
      { week: 60, byCategory: { shop: 2_000_00 }, realisedCents: -200_00 },
    ]
    expect(realisedLossOf(rows, 0), 'both weeks').toBe(700_00)
    expect(realisedLossOf(rows, 52), 'a sale before the window starts is not this year`s').toBe(200_00)
    expect(realisedLossOf(rows, 61), 'and one after the last row is nobody`s').toBe(0)
    expect(realisedLossOf([...rows, { week: 61, byCategory: {}, realisedCents: 900_00 }], 0), 'a gain nets the loss away').toBe(0)
    expect(realisedLossOf([], 0)).toBe(0)

    const world = wrapWorld(0, 'r46-realised-zero')
    accrueRealised(world, 5, 0)
    expect(world.financeWeeks, 'a sale at exactly its cost writes no memo and no row').toEqual([])
    accrueRealised(world, 5, -300_00)
    accrueRealised(world, 5, -200_00)
    expect(world.financeWeeks, 'a week that settles two sales accumulates').toEqual([{ week: 5, byCategory: {}, realisedCents: -500_00 }])

    // outside every arithmetic: the same window folded with the memo and without it is the same window, to the cent
    const bare = rows.map(({ realisedCents: _memo, ...rest }) => rest)
    expect(financeWindow(rows, 0)).toEqual(financeWindow(bare, 0))
    expect(seasonMoneyOf(financeWindow(rows, 0))).toEqual(seasonMoneyOf(financeWindow(bare, 0)))
  })

  it('banked ABSENT at zero and present when it is a loss, and the history row banked beside it is untouched', () => {
    const { world, paid, fetched } = carYear()
    maybeFireSeasonWrapUp(world)
    const s = world.lastSeasonSummary!
    expect(s.wealth!.realisedLossCents).toBe(paid - fetched)
    // B5's identity on the banked figures, the loss still INSIDE the shelf
    expect(s.earnedCents! - s.spentCents! + s.wealth!.shelfNetCents).toBe(s.fundsDeltaCents)
    const row = world.seasonHistory[world.seasonHistory.length - 1]!
    expect(Object.keys(row), 'the history row carries consumption and income as it did; the loss is the card`s').not.toContain('realisedLossCents')
    expect(row.spentCents).toBe(s.spentCents)

    const quiet = wrapWorld(0, 'r46-realised-quiet')
    accrueFinance(quiet, 10, 'prize', 21_502_00)
    maybeFireSeasonWrapUp(quiet)
    expect('realisedLossCents' in quiet.lastSeasonSummary!.wealth!).toBe(false)
  })
})
