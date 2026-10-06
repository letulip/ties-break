// =================================================================================================
// ⭐⭐⭐ ROUND 46 #3 – THE HOUSE'S ENTRY PRICE INDEXES: +2 % A YEAR FROM THE CAREER'S FIRST WEEK, STRICTLY BELOW ITS OWN +3 %
// =================================================================================================
//
// THE OWNER, 05.10: «Похоже у нас такой же небольшой гринд на недвижимости есть: я только что продал первый дом за 332к, и мне предлагаю купить новый за 240к. …»
// and, asked what he thought of house inflation, his ruling: «Дом на 3% в год - смотри, чтобы он всё ещё при этом остался инвест активом, пусть и небольшим, т.е. его рост должен обгонять инфляцию.»
//
// THE GRIND WAS MEASURED BEFORE IT WAS FIXED (ledger A0): $240,000 × 1.03¹² × 0.97 = $331,917.13 – his «332к», to the digit – and the shelf re-offered the rung at the frozen $240,000, so a
// cycle pocketed ~$92k. THE FIX IS ONE QUOTE: `assetEntryPriceCents` grows a house's catalogue price at the rung's own `entryIndexBps` (200) on the HOLDING'S OWN weekly clock, in whole
// dollars, with no stored state – and `shopView` (the card and `affordable`) and `buyAsset` (the charge) already call it, so the card, the gate and the till are ONE figure (arm 6 drives all three).
//
// ⚠ WHAT EACH ARM HOLDS, in the order the ruling reads:
//   1. WEEK 0 IS THE CATALOGUE, to the cent, on all four rungs – the first house of a career costs what the card always said.
//   2. YEAR 12 – house-first quotes $304,378.00 (the engine's own whole-dollar rounding of 240k × 1.02¹²) and the quote never steps: weekly, monotone, no sawtooth at a year boundary.
//   3. THE CHURN – (a) a flip at year 2 LOSES $2,718.48, and every flip up to year 3 loses; (b) the 12-year cycle is +$27,539.13, under a third of the old +$91,917.13. The model is the ledger's own and it
//      reproduces his 332k, so the arms measure HIS number, not an invented one.
//   4. IT IS STILL AN INVESTMENT (his constraint) – the appreciation is strictly above the index on every rung; a house held from week 0 is worth more than the same rung costs new, every year, and the gap
//      widens; and after the corridor's 3 % haircut the held house is ahead of inflation from year 3.1 on (a quick flip loses, a long hold earns).
//   5. NOTHING BUT A HOUSE MOVES – every other rung quotes its catalogue figure at any week; the field is on the four houses and on nothing else.
//   6. THE CARD, THE GATE AND THE TILL ARE ONE FIGURE – at year 12 one cent short is not affordable and not buyable, the catalogue's $240,000 is not enough, and the exact price buys, the wallet moving by it.
//
// ⚠ ZERO DRAWS, ZERO STRINGS, NO SCHEMA: nothing here touches an RNG stream, the card prints a number it already printed, and the rate is a catalogue constant (the `ECONOMY` pin carries it).
//
// ⚠⚠ MUTATION-VERIFIED (06.10) against `assetEntryPriceCents`, `shopView` and `buyAsset`, each restored byte-identical (`cmp`, both files), and the verdicts DIFFER from one another – which is what says the arms
// measure different things. Baseline 30 green; then, one mutation at a time:
//   * M1  INDEX EVERYTHING (the family filter AND the field predicate dropped, every rung grown at 200) -> THREE RED, all arm 5: the non-house quotes, the card of every row, and the family rule.
//   * M2  DROP THE INDEXATION (`years = 0`) -> THIRTEEN RED across arms 2, 3, 4 and 6: the year-12 quotes, the churn arms, the figures pin, the crossing and the gate / charge arms. Arms 1 and 5 stay green, which is right.
//   * M3  DROP ONLY THE FAMILY FILTER (the field alone decides) -> ONE RED, «a non-house row that DID carry the field would still quote its catalogue price». Nothing else sees it, because no other row carries the field.
//   * M4  NO WHOLE-DOLLAR ROUNDING (`Math.round(price × 1.02^y)`) -> EIGHT RED: the five year-12 arms, the figures pin and two of arm 6 – the card and the till still agree with each other and disagree with the dollar.
//   * M5  ANNUAL STEPS (`years = floor(…)`) -> THREE RED: the sawtooth arm, «every quick flip loses» and the crossing. Year 2 and year 12 stay green because they are whole years, which is why those arms alone could not see it.
//   * M6a THE GATE READS THE CATALOGUE (`shopView`'s `affordable >= item.entryCents`) -> TWO RED, both arm 6.
//   * M6b THE CHARGE READS THE CATALOGUE (`buyAsset`'s `paidCents = item.entryCents`) -> THREE RED, all arm 6: the card, the gate and the till are three halves of one claim.
import { describe, it, expect } from 'vitest'
import {
  assetEntryPriceCents,
  assetValueCents,
  buyAsset,
  createWorld,
  ownedAssets,
  shopCatalogue,
  shopItem,
  shopView,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** whole dollars to cents – money is cents everywhere in the engine. */
const usd = (dollars: number): number => Math.round(dollars * 100)

const HOUSES = ['house-first', 'house-garden', 'house-villa', 'house-headland'] as const
type HouseId = (typeof HOUSES)[number]

/** HIS FOUR PRICES (round 35 #7 / #13), typed here and not read from the catalogue: week 0 must be exactly what he named, and a retune of one of them should have to say so in this file. */
const HIS_PRICE_USD: Record<HouseId, number> = {
  'house-first': 240_000,
  'house-garden': 590_000,
  'house-villa': 1_400_000,
  'house-headland': 3_000_000,
}
/** WHAT EACH RUNG QUOTES AT YEAR 12, whole dollars – measured 06.10 off the engine's own rounding (`Math.round(price × 1.02¹² / 100) × 100`). */
const YEAR_12_USD: Record<HouseId, number> = {
  'house-first': 304_378,
  'house-garden': 748_263,
  'house-villa': 1_775_539,
  'house-headland': 3_804_725,
}
const YEAR_12 = 12 * WEEKS_PER_YEAR

function worldAt(week: number, fundsCents = 0): WorldState {
  const world = createWorld('b14-house-entry-index')
  world.week = week
  world.fundsCents = fundsCents
  return world
}

/** ONE PROBE WORLD, RE-AIMED AT A WEEK: `assetEntryPriceCents` reads only `week` for a house (and `brandFounded` for a business, which a fresh world has not set), so the quote arms do not
 *  each pay for a `createWorld`. The buy arms below build their own worlds – they WRITE. */
const probe = worldAt(0)
function quote(week: number, id: string = 'house-first'): number {
  probe.week = week
  return assetEntryPriceCents(probe, shopItem(id)!)
}

const FIRST = shopItem('house-first')!
const FIRST_COST = usd(240_000)
/** THE CORRIDOR'S CALM-WATER CENTRE for a house – the 0.97 the ledger's A0 measurement multiplied the holding's worth by to land on his 332k. It is the engine's own constant, not a number typed here. */
const CORRIDOR = ECONOMY.shop.secondary.byFamily.house.base
/** WHAT A HOUSE BOUGHT AT WEEK 0 FOR THE CATALOGUE PRICE FETCHES, SOLD `week` WEEKS LATER AT THE CORRIDOR'S CENTRE – the holding's own `assetValueCents` (+3 %), times the haircut. */
const proceedsAt = (week: number): number => CORRIDOR * assetValueCents(FIRST, FIRST_COST, week)
/** THE CHURN: sell that house, buy the same rung again at THIS week's quote, and what is left in the wallet. Negative is a loss, positive is the grind. */
const flipAt = (week: number): number => proceedsAt(week) - quote(week)

describe('arm 1 – week 0 is the catalogue, to the cent', () => {
  it.each(HOUSES)('%s quotes his own price in the first week', (id) => {
    expect(quote(0, id)).toBe(usd(HIS_PRICE_USD[id]))
    expect(quote(0, id)).toBe(shopItem(id)!.entryCents)
  })
})

describe('arm 2 – year 12', () => {
  it('house-first quotes $304,378.00: the whole-dollar rounding of 240k × 1.02^12, not a hand-rounded guess', () => {
    const q = quote(YEAR_12)
    expect(q).toBe(usd(YEAR_12_USD['house-first']))
    expect(q, 'the engine\'s own idiom').toBe(Math.round((FIRST_COST * Math.pow(1 + 200 / 10_000, 12)) / 100) * 100)
    expect(q % 100, 'a whole dollar, so the card and the till can never differ by cents').toBe(0)
    expect(q / usd(1000)).toBeCloseTo(304.4, 1)
  })

  it.each(HOUSES)('%s at year 12 is its catalogue price grown 12 years at +2 percent', (id) => {
    expect(quote(YEAR_12, id)).toBe(usd(YEAR_12_USD[id]))
    expect(quote(YEAR_12, id)).toBe(Math.round((shopItem(id)!.entryCents * Math.pow(1.02, 12)) / 100) * 100)
  })

  it('the quote never steps: it is weekly, monotone, and no year boundary is a jump', () => {
    let prev = quote(0)
    let widest = 0
    for (let week = 1; week <= 20 * WEEKS_PER_YEAR; week++) {
      const q = quote(week)
      expect(q, `week ${week} never quotes under week ${week - 1}`).toBeGreaterThanOrEqual(prev)
      widest = Math.max(widest, q / prev - 1)
      prev = q
    }
    // +2 %/yr is ~0.038 % a week. Annual steps would be a 2 % jump in one week – and a flip a week before each step meets a quote a year stale.
    expect(widest).toBeLessThan(0.001)
  })
})

describe('arm 3 – the churn he found', () => {
  it('the model is the ledger\'s own: twelve years held, sold at the corridor\'s centre, is HIS 332k', () => {
    expect(CORRIDOR).toBe(0.97)
    expect(Math.round(proceedsAt(YEAR_12) / usd(1000)), 'his «332к», to the digit').toBe(332)
    // …and what the shelf used to re-offer it at, the frozen 240k: the ~$92k grind.
    const frozenChurn = proceedsAt(YEAR_12) - FIRST_COST
    expect(frozenChurn / 100).toBeGreaterThan(90_000)
    expect(frozenChurn / 100).toBeLessThan(94_000)
  })

  it('(a) a flip at year 2 LOSES: sell at 0.97 × the +3 % value, buy back at the +2 % quote, and the wallet is behind', () => {
    const flip = flipAt(2 * WEEKS_PER_YEAR)
    expect(flip).toBeLessThan(0)
    expect(flip / 100).toBeGreaterThan(-3_000)
    expect(flip / 100).toBeLessThan(-2_500)
  })

  it('and every quick flip loses, from the first week to year 3', () => {
    for (let week = 0; week < 3 * WEEKS_PER_YEAR; week++) expect(flipAt(week), `week ${week}`).toBeLessThan(0)
  })

  it('(b) the twelve-year cycle is the house\'s real return, not a grind: positive, ~$28k, under a third of the old ~$92k', () => {
    const flip = flipAt(YEAR_12)
    const frozen = proceedsAt(YEAR_12) - FIRST_COST
    expect(flip, 'a long hold still earns').toBeGreaterThan(0)
    expect(flip / 100).toBeGreaterThan(25_000)
    expect(flip / 100).toBeLessThan(30_000)
    expect(flip * 3).toBeLessThan(frozen)
  })

  it('THE FIGURES THE CATALOGUE COMMENT QUOTES ARE THE ENGINE\'S (a prose number needs a pin against the thing)', () => {
    expect(assetValueCents(FIRST, FIRST_COST, YEAR_12), '$240,000 twelve years at +3 %').toBe(34_218_261)
    expect(Math.round(proceedsAt(YEAR_12)), 'the corridor\'s 0.97 of it').toBe(33_191_713)
    expect(Math.round(proceedsAt(YEAR_12) - FIRST_COST), 'the old cycle, at the frozen price').toBe(9_191_713)
    expect(quote(YEAR_12), 'the new price').toBe(30_437_800)
    expect(Math.round(flipAt(YEAR_12)), 'the new cycle').toBe(2_753_913)
    expect(assetValueCents(FIRST, FIRST_COST, 2 * WEEKS_PER_YEAR), 'year 2 worth').toBe(25_461_600)
    expect(quote(2 * WEEKS_PER_YEAR), 'year 2 quote').toBe(24_969_600)
    expect(Math.round(flipAt(2 * WEEKS_PER_YEAR)), 'the year-2 flip').toBe(-271_848)
  })
})

describe('arm 4 – it is still an investment asset (his constraint)', () => {
  it.each(HOUSES)('%s: the appreciation is strictly above the entry index', (id) => {
    const rung = shopItem(id)!
    expect(rung.entryIndexBps, 'the index exists').toBeGreaterThan(0)
    expect(rung.annualRateBps, 'and growth outpaces it').toBeGreaterThan(rung.entryIndexBps!)
  })

  it('HOLDING BEATS BUYING LATE: a house held from week 0 is worth more than the same rung costs new, in every year, and the gap widens', () => {
    let widest = 1
    for (const years of [1, 2, 3, 5, 8, 12, 20, 30]) {
      const week = years * WEEKS_PER_YEAR
      const worth = assetValueCents(FIRST, FIRST_COST, week)
      const ratio = worth / quote(week)
      expect(worth, `year ${years}: held beats the late buyer's price`).toBeGreaterThan(quote(week))
      expect(ratio, `year ${years}: the gap is wider than the year before`).toBeGreaterThan(widest)
      widest = ratio
    }
  })

  it('after the corridor\'s 3 % haircut the held house is behind inflation until year 3.1 and ahead of it from then on', () => {
    let cross = -1
    for (let week = 0; week <= 30 * WEEKS_PER_YEAR; week++) {
      if (flipAt(week) >= 0) {
        cross = week
        break
      }
    }
    expect(cross, 'it does cross').toBeGreaterThan(0)
    expect(cross / WEEKS_PER_YEAR).toBeGreaterThan(3)
    expect(cross / WEEKS_PER_YEAR).toBeLessThan(4)
    const behindAgain: number[] = []
    for (let week = cross; week <= 30 * WEEKS_PER_YEAR; week++) if (flipAt(week) < 0) behindAgain.push(week)
    expect(behindAgain, 'once ahead it stays ahead').toEqual([])
  })
})

describe('arm 5 – nothing but a house moves', () => {
  it('every rung that is not a house quotes its catalogue figure at any week of a career', () => {
    const others = shopCatalogue().filter((i) => i.family !== 'house')
    expect(others.length, 'a real denominator').toBeGreaterThan(15)
    for (const week of [0, YEAR_12, 30 * WEEKS_PER_YEAR]) {
      for (const rung of others) expect(quote(week, rung.id), `${rung.id} @ week ${week}`).toBe(rung.entryCents)
    }
  })

  it('the field is on the four houses and on nothing else, and it is one number', () => {
    const houses = shopCatalogue().filter((i) => i.family === 'house').map((i) => i.id)
    const carriers = shopCatalogue().filter((i) => i.entryIndexBps !== undefined).map((i) => i.id)
    expect(houses).toEqual([...HOUSES])
    expect(carriers, 'a fifth house that forgot the field, or a car that grew one, goes red here').toEqual([...HOUSES])
    expect(new Set(HOUSES.map((id) => shopItem(id)!.entryIndexBps)).size).toBe(1)
  })

  it('the rule keys on the family: a non-house row that DID carry the field would still quote its catalogue price', () => {
    const car = { ...shopItem('car-good')!, entryIndexBps: 200 }
    probe.week = YEAR_12
    expect(assetEntryPriceCents(probe, car)).toBe(car.entryCents)
  })

  it('the card agrees with the function: every non-house row at its catalogue price, every house at the quote', () => {
    const rows = shopView(worldAt(YEAR_12)).rows
    for (const row of rows) {
      const rung = shopItem(row.id)!
      const want = rung.family === 'house' ? quote(YEAR_12, row.id) : rung.entryCents
      expect(row.entryCents, row.id).toBe(want)
    }
    expect(rows.filter((r) => r.family === 'house')).toHaveLength(4)
  })
})

describe('arm 6 – the card, the gate and the till are one figure', () => {
  const price = usd(YEAR_12_USD['house-first'])
  const rowOf = (world: WorldState) => shopView(world).rows.find((r) => r.id === 'house-first')!

  it('at year 12 the card shows the indexed price, and the gate opens at that price and not a cent under', () => {
    const short = worldAt(YEAR_12, price - 1)
    expect(rowOf(short).entryCents, 'the card').toBe(price)
    expect(rowOf(short).affordable, 'one cent short').toBe(false)
    expect(() => buyAsset(short, 'house-first'), 'and the till agrees').toThrow('Not enough funds for that')
    expect(short.fundsCents, 'a refused buy moves nothing').toBe(price - 1)

    const exact = worldAt(YEAR_12, price)
    expect(rowOf(exact).affordable, 'exactly the quote').toBe(true)
  })

  it('the catalogue\'s $240,000 is not enough at year 12: the gate is not reading the old figure', () => {
    const world = worldAt(YEAR_12, usd(240_000))
    expect(rowOf(world).affordable).toBe(false)
    expect(() => buyAsset(world, 'house-first')).toThrow('Not enough funds for that')
    expect(world.fundsCents).toBe(usd(240_000))
  })

  it('a buy at year 12 moves the wallet by exactly the indexed price and writes it down as what was paid', () => {
    const spare = usd(1_234)
    const world = worldAt(YEAR_12, price + spare)
    const card = rowOf(world).entryCents
    buyAsset(world, 'house-first')
    expect(world.fundsCents, 'the wallet moved by the quote, not by 240k').toBe(spare)
    expect(price + spare - world.fundsCents, 'the till charged what the card showed').toBe(card)
    const held = ownedAssets(world).find((a) => a.id === 'house-first')!
    expect(held.paidCents).toBe(price)
    expect(held.boughtWeek).toBe(YEAR_12)
  })

  it('and in the first week the same door still charges the catalogue, to the cent', () => {
    const world = worldAt(0, usd(240_000))
    expect(rowOf(world).affordable).toBe(true)
    buyAsset(world, 'house-first')
    expect(world.fundsCents).toBe(0)
    expect(ownedAssets(world).find((a) => a.id === 'house-first')!.paidCents).toBe(usd(240_000))
  })

  it('the one place the card still reads the catalogue price – the unowned upkeep line – cannot disagree: a house has no upkeep', () => {
    const rows = shopView(worldAt(YEAR_12)).rows.filter((r) => r.family === 'house')
    expect(rows).toHaveLength(4)
    for (const row of rows) expect(row.upkeepCents, row.id).toBe(0)
  })
})
