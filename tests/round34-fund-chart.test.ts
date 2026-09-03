// =================================================================================================
// ⭐⭐⭐ ROUND 34 #19 – THE INDEX FUND'S PRICE CHART, AND WHERE ITS NUMBERS COME FROM
// =================================================================================================
//
// THE OWNER, 02.09: «для индексного фонда давай график нарисуем с точками его стоимости за пай с
// возможностью выбрать промежуток… 6 месяцев, 1 год, 2 года, 5 лет. Мы же сможем хранить по одной
// цифре за месяц средней»
//
// ⚠⚠ HIS LAST SENTENCE IS THE ONE THIS FILE IS REALLY ABOUT, AND THE ANSWER TO IT IS «NOTHING IS
// STORED». `unitPriceCents` is documented pure – seed, week, rung, no world and no clock – because
// `world/market.ts` was built on «THE MARKET EXISTS WHETHER OR NOT SHE BUYS … a path drawn from the
// career's seed alone». So the monthly series he offered to store is DERIVED on every read, and
// three of the tests below are the properties that decision has to earn:
//
//   * DETERMINISM – two reads of the same career give the same series, to the cent. Without it a
//     derived chart would flicker and a stored one really would have been necessary.
//   * RETROACTIVITY – a career that existed BEFORE this item has its whole chart. This is the arm
//     that matters to him personally: his own save is at week 569, and a stored series would have
//     opened empty and filled up over the next five years.
//   * NOTHING BEFORE WEEK 0 – `marketWave` is happily defined for negative weeks, so the honest
//     failure mode of a derived series is inventing history the career did not live. A young family
//     gets a SHORT chart, never a padded one.
//
// ⚠ AND «ONE AVERAGED FIGURE PER MONTH» IS HIS RESOLUTION, kept exactly: a point is the mean of the
// unit price over the calendar month's own career weeks, rounded once at the engine boundary.
//
// ⚠⚠ MUTATION-VERIFIED, each reverted alone, and the verdicts are what was MEASURED rather than
// what was expected – one of them says something about the code and is recorded for that reason:
//   * the walk's two `w >= 0` conditions relaxed to `w >= -60`, so it reaches behind the career ->
//     «never reaches behind the first week» RED **and** «a young career gets a short series» RED.
//     Those two conditions are the floor; the pair fails together because a series that runs into
//     negative weeks is both dishonest AND the wrong length.
//   * ⚠ `Math.max(0, Math.floor(week))` -> `Math.floor(week)` reddens NOTHING, and that is recorded
//     rather than quietly dropped: the two loop conditions above already stop at week 0, so the
//     clamp only guards a NEGATIVE `week` argument, which no caller passes. It is belt and braces,
//     not the guard – and a mutation that changes nothing is evidence about the code, not a gap.
//   * the month walk replaced by a fixed four-week block -> FOUR arms RED («real calendar months»,
//     «a point is the month's mean», «the month in progress is the last point», «a young career gets
//     a short series»). ⚠ The five-year COUNT survives it – 60 blocks of four weeks is still 60
//     points – which is exactly why the count is not the test for this.
//   * `sum / count` -> the month's FIRST price instead of its average -> «a point is the month's
//     mean» RED alone.
//   * `item.volBps` -> `item.unitBaseCents` as the predicate in `shopView` -> «the fund has one
//     because it rides the market; the deposit does not» RED alone.
//   * `Math.max(...SHOP_PRICE_RANGE_MONTHS)` -> a literal 24 -> «five years is sixty points» RED and
//     «RETROACTIVE: a career that predates this item opens on a full chart» RED with it, plus the
//     mounted five-year window in tests/component/round34-money-shelf.test.ts.
import { describe, it, expect } from 'vitest'
import { createWorld, shopItem, shopView, unitPriceCents, unitPriceHistory } from '../src/engine/world'
import { SHOP_PRICE_RANGE_MONTHS } from '../src/shared/protocol'
import { weekMonth, weekYear } from '../src/shared/dates'

const FUND = 'index-fund'
const LONGEST = Math.max(...SHOP_PRICE_RANGE_MONTHS)

/** A career at `week` with nothing bought – the chart is a fact about the world, not about a
 *  holding, so no purchase is needed to ask for one. */
function at(week: number, seed = 'r34-19') {
  const world = createWorld(seed)
  world.week = week
  return world
}

function fundHistory(week: number, seed = 'r34-19') {
  const row = shopView(at(week, seed)).rows.find((r) => r.id === FUND)
  expect(row, 'the index fund row').toBeTruthy()
  return row!.priceHistory
}

describe('#19 – the four windows are his four', () => {
  it('6 months, 1 year, 2 years, 5 years – and nothing else', () => {
    expect([...SHOP_PRICE_RANGE_MONTHS]).toEqual([6, 12, 24, 60])
  })

  it('⭐ five years is sixty points, which is the number his own sentence arrives at', () => {
    const points = fundHistory(52 * 11)!
    expect(points).toHaveLength(60)
    expect(LONGEST).toBe(60)
  })
})

describe('#19 – one averaged figure per calendar month', () => {
  it('⭐⭐ the buckets are REAL calendar months, not blocks of four weeks', () => {
    const points = fundHistory(52 * 8)!
    // Consecutive points step exactly one calendar month, every time, over eight years.
    for (let i = 1; i < points.length; i++) {
      const prev = { m: weekMonth(points[i - 1].week), y: weekYear(points[i - 1].week) }
      const here = { m: weekMonth(points[i].week), y: weekYear(points[i].week) }
      const stepped = here.m === prev.m + 1 || (here.m === 1 && prev.m === 12 && here.y === prev.y + 1)
      expect(stepped, `point ${i} is ${here.m}/${here.y} after ${prev.m}/${prev.y}`).toBe(true)
    }
    // ...and a point's own week really is the FIRST career week of the month it names.
    for (const p of points) {
      expect(weekMonth(p.week - 1) !== weekMonth(p.week) || weekYear(p.week - 1) !== weekYear(p.week)).toBe(true)
    }
  })

  it('⭐ a point is the MEAN of that month`s weeks, rounded once', () => {
    const world = at(52 * 4)
    const item = shopItem(FUND)!
    const points = unitPriceHistory(world.seed, world.week, item, LONGEST)
    // Re-derive one full month by hand, from the same pure function the shelf prices with.
    const target = points[10]
    const weeks: number[] = []
    for (let w = target.week; weekMonth(w) === weekMonth(target.week) && weekYear(w) === weekYear(target.week); w++) {
      weeks.push(unitPriceCents(world.seed, w, item))
    }
    expect(weeks.length, 'a calendar month is four or five career weeks').toBeGreaterThanOrEqual(4)
    expect(target.cents).toBe(Math.round(weeks.reduce((a, b) => a + b, 0) / weeks.length))
    // ⚠ WHOLE CENTS EVERYWHERE – «у пользователя целые в интерфейсе», rounded at this boundary and
    // nowhere else, so no screen can round a price a second time.
    for (const p of points) expect(Number.isInteger(p.cents), `${p.week} is whole cents`).toBe(true)
  })

  it('the month in progress is the last point, so the chart ends at now', () => {
    const world = at(52 * 6 + 30)
    const points = fundHistory(world.week)!
    const last = points[points.length - 1]
    expect(weekMonth(last.week)).toBe(weekMonth(world.week))
    expect(weekYear(last.week)).toBe(weekYear(world.week))
  })
})

describe('#19 – the series is derived, and these are the properties that buys', () => {
  it('⭐⭐ DETERMINISTIC: the same career read twice gives the same series, to the cent', () => {
    expect(fundHistory(400)).toEqual(fundHistory(400))
    // ...and a different career is a different market, so this is not a constant.
    expect(fundHistory(400, 'another-career')).not.toEqual(fundHistory(400))
  })

  it('⭐⭐ RETROACTIVE: a career that predates this item opens on a full chart', () => {
    // ⚠ HIS OWN SAVE'S WEEK. Nothing was recorded at any point in this career – the world is built
    // and the clock is moved – and the five-year window is complete. A stored series would have had
    // exactly zero points here, which is the whole reason this is derived.
    const points = fundHistory(569)!
    expect(points).toHaveLength(60)
    expect(points.every((p) => p.cents > 0)).toBe(true)
  })

  it('⚠ NEVER REACHES BEHIND THE FIRST WEEK – no invented history', () => {
    for (const week of [0, 3, 20, 51, 100]) {
      const points = fundHistory(week)!
      expect(points.every((p) => p.week >= 0), `week ${week} stays inside the career`).toBe(true)
    }
  })

  it('⚠ a young career gets a SHORT series, as long as the months it has lived', () => {
    // Week 0 is the career's first month and has one point; a first season has twelve-ish, never 60.
    expect(fundHistory(0)!).toHaveLength(1)
    const firstSeason = fundHistory(51)!
    expect(firstSeason.length).toBeGreaterThan(6)
    expect(firstSeason.length).toBeLessThanOrEqual(12)
    // ⭐ AND THE SCREEN'S SHORTEST WINDOW IS STILL LONGER THAN THAT, which is the state the honest
    // line on the card exists for – see the mounted arm.
    expect(fundHistory(2)!.length).toBeLessThan(SHOP_PRICE_RANGE_MONTHS[0])
  })
})

describe('#19 – which rungs have a chart at all', () => {
  it('⚠ the fund has one because it RIDES THE MARKET; the deposit does not', () => {
    const rows = shopView(at(300)).rows
    expect(rows.find((r) => r.id === FUND)!.priceHistory, 'the fund he named').not.toBeNull()
    // ⚠ THE DEPOSIT IS UNIT-PRICED TOO, so «has units» would have given it a chart – a dead-flat
    // exponential with nothing to read, on a card he did not mention. The predicate is `volBps`.
    expect(shopItem('deposit')!.unitBaseCents, 'the deposit really is unit-priced').toBeGreaterThan(0)
    expect(rows.find((r) => r.id === 'deposit')!.priceHistory, 'and still has no chart').toBeNull()
    // ...and nothing that is not a market holding has one.
    for (const row of rows.filter((r) => r.id !== FUND)) {
      expect(row.priceHistory, `${row.id}`).toBeNull()
    }
  })
})
