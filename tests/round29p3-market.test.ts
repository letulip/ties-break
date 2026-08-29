// ⭐⭐⭐ ROUND 29 PART THREE #16 – THE FUND HAS A MARKET, AND EVERY CLAIM ABOUT IT IS READ OUT OF A
// TICKED WORLD.
//
// THE OWNER, 29.08: «Механику фонда надо придумать, да, потому что безрисковые 3 против безрисковых
// 7 это весьма странно. Давай подумаем как это можно сделать красиво и просто.» ⚙ And on the design:
// «вроде посмотрел, давай сделаем, а я пощупаю и скажу свои ощущения потом» – so the NUMBERS here
// are provisional by his own framing, and every arm that pins one says which knob moves it.
//
// ⚠⚠ THE HOUSE RULE THIS FILE IS WRITTEN UNDER: a source grep proves nothing. Every arm below walks
// a real career through `tickWeek`, buys through `buyAsset`, and reads `valueCents`, the ledger and
// the snapshot back out. The two arms that CANNOT be walked – the [-1, 1] bound and the ten-year
// inequality – are closed-form statements about the model and say so.
//
// ⚠ MUTATION-VERIFIED, TEN OF THEM, EACH APPLIED ALONE TO THE ENGINE, WATCHED, AND REVERTED. The
// two that changed NOTHING are recorded beside the eight that worked, because a mutation that cannot
// move the output is evidence about the design and not a hole in the net:
//
//   * `assetValueCents`'s `* marketRatio` -> `* 1`            -> SIX arms red (the value model, the
//     shelf line's smoothness AND its sign, the household meter, the negative season, and both
//     horizon measurements). The deposit and car arm stayed GREEN, which is what having it is for.
//   * `assetWorthCents`'s `item.volBps ?? 0` -> `?? 1_800`    -> «the deposit and the car did NOT
//     move by a cent», ALONE.
//   * `householdWeekly` back to `assetValueCents(basis, held+1) - assetValueCents(basis, held)`
//                                                             -> «the household meter and the till
//     read ONE market», ALONE. Round 29 #11's own defect, re-armed and caught.
//   * `marketWave` replaced by a per-week draw                -> THREE red (smoothness, the named
//     career's season figure, the one-in-five rate). ⭐ The two INPUT-INDEPENDENCE arms stayed green,
//     correctly: independence is a property of the seeding, not of the smoothness, and it is worth
//     knowing that this file can tell those two apart.
//   * a MAIN draw added to the tick when the family owns anything
//                                                             -> BOTH independence arms red, and
//     nothing else. That is «a purchase moved the world's dice», which is the permanent law.
//   * `reportMarketSeason`'s `% WEEKS_PER_YEAR !== 0` -> `< 0` -> «once a season, on the boundary»,
//     ALONE (a row every week).
//   * `marketSeasonMove`'s window `- WEEKS_PER_YEAR` -> `- 26` -> the two season-line arms red.
//   * `volBps` 1_800 -> 2_500                                 -> the CLOSED FORM arm red, and the
//     named career's figure with it. ⚠⚠ AND THE MEASURED TEN-YEAR ARM STAYED GREEN – 2,400 holdings
//     and not one of them lost. That is the finding, and it is why both arms exist: sampling cannot
//     see a ceiling this design is only just inside, and the inequality can.
//   * `marketIndex`'s `if (!volBps) return 1` deleted         -> NOTHING. `Math.exp(0·wave)` is
//     already 1, so the clause is a short-circuit and not a guard. Documented at its own source.
//   * `marketRatio`'s `toWeek <= fromWeek` deleted            -> NOTHING, because no rung in the
//     catalogue is both commissioned and market-driven. Also documented at its source, and NOT
//     covered by an arm here: an arm that could not distinguish the mutation would be a dead guard
//     of exactly the kind this list exists to keep out.
import { describe, it, expect } from 'vitest'
import {
  assetValueCents,
  assetWorthCents,
  buyAsset,
  closeTournament,
  createWorld,
  marketIndex,
  marketRatio,
  marketSeasonMove,
  marketWave,
  ownedAssets,
  sellAsset,
  shopItem,
  skipTournament,
  tickWeek,
  toSnapshot,
  worstMarketRatio,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const FUND = shopItem('index-fund')!
const DEPOSIT = shopItem('deposit')!
const CAR = shopItem('car-sensible')!
/** The one knob, read off the catalogue rather than restated – part three #16 will be re-tuned by
 *  feel and a copy of this number in a test is a second place to forget. */
const VOL = FUND.volBps!

/** A real career, ticked through the MAIN stream the worker uses, so `world.rngMain` really moves
 *  and can be compared byte for byte between arms. `act` is the family's decisions, by week. */
function career(seed: string, weeks: number, act?: (w: WorldState) => void): WorldState {
  const world = createWorld(seed)
  world.fundsCents = 5_000_000_00
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    act?.(world)
  }
  return world
}

const heldOf = (world: WorldState, id: string) => ownedAssets(world).find((a) => a.id === id)!

// -------------------------------------------------------------------------------------------------
describe('part three #16 – the market exists whether or not she buys', () => {
  it('⭐⭐ INPUT-INDEPENDENCE, PROVED: same world, same weeks, and `rngMain` byte-identical', () => {
    const SEED = 'r29p3-independence'
    const WEEKS = 160
    // A – the family never touches the shelf.
    const idle = career(SEED, WEEKS)
    // B – it opens the fund in week 30 and does nothing else.
    const buyer = career(SEED, WEEKS, (w) => {
      if (w.week === 30) buyAsset(w, 'index-fund', 50_000_00)
    })
    // C – the same fund on the same week, buried in a busy shelf: a deposit opened, topped up and
    //     part-sold, and a car bought and sold. If ANY of that could reach the world's dice, this is
    //     where it shows.
    const busy = career(SEED, WEEKS, (w) => {
      if (w.week === 30) buyAsset(w, 'index-fund', 50_000_00)
      if (w.week === 12) buyAsset(w, 'deposit', 40_000_00)
      if (w.week === 60) buyAsset(w, 'deposit', 25_000_00)
      if (w.week === 90) sellAsset(w, 'deposit', 10_000_00)
      if (w.week === 20) buyAsset(w, 'car-sensible')
      if (w.week === 120) sellAsset(w, 'car-sensible')
    })

    // ⚠⚠ THE PERMANENT LAW (CLAUDE.md invariant 2), asserted on the PERSISTED position rather than on
    // a hash: `{s, n}` is a complete description of where the MAIN stream stands, and the two fields
    // are redundant with each other, so equality here is byte-identity of the whole sequence.
    expect(buyer.rngMain, 'a purchase did not move the world`s dice').toEqual(idle.rngMain)
    expect(busy.rngMain, 'and neither did five of them').toEqual(idle.rngMain)
    expect(idle.rngMain.n, 'the arms really ticked – a zero-draw run would pass vacuously').toBeGreaterThan(1000)

    // ⭐⭐ AND THE PATH IS THE SAME PATH. The fund opened on the same week in two families whose
    // histories have nothing else in common is worth the same to the cent – which is «the market is
    // a fact about the world» stated as an equality a mutation can break.
    expect(heldOf(busy, 'index-fund').valueCents).toBe(heldOf(buyer, 'index-fund').valueCents)
    expect(heldOf(buyer, 'index-fund').valueCents, 'and it is a real holding').toBeGreaterThan(0)

    // ...and it exists in the arm that never bought anything: the market moved over those 160 weeks
    // in a world with an empty shelf. Read off the same function the engine prices with.
    expect(ownedAssets(idle), 'arm A really is empty-handed').toHaveLength(0)
    expect(marketIndex(SEED, WEEKS, VOL)).not.toBe(marketIndex(SEED, 30, VOL))
  })

  it('⚠ the frozen MAIN capture cannot see the market: no phase gained a draw', () => {
    // The narrower half of the arm above, on the phase that actually changed. Two careers of the
    // same length, one holding a market rung and one holding nothing, must have spent the same
    // number of MAIN draws – `revalueAssets` and `reportMarketSeason` both run every tick in the
    // second world too.
    const withFund = career('r29p3-draws', 120, (w) => {
      if (w.week === 5) buyAsset(w, 'index-fund', 30_000_00)
    })
    const without = career('r29p3-draws', 120)
    expect(withFund.rngMain.n).toBe(without.rngMain.n)
    expect(withFund.rngMain.s).toBe(without.rngMain.s)
  })
})

// -------------------------------------------------------------------------------------------------
describe('part three #16 – what the fund is worth is the market, not a rate', () => {
  it('⭐⭐ the stored value is `basis x index(now) / index(basisWeek)`, and it is OFF the smooth curve', () => {
    const world = career('r29p3-value', 130, (w) => {
      if (w.week === 10) buyAsset(w, 'index-fund', 80_000_00)
    })
    const held = heldOf(world, 'index-fund')
    const span = world.week - held.boughtWeek

    // The engine's own answer, asked of the one function both writers use.
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
    // ...and it is the market path times the long-run curve, stated independently of that function.
    const smooth = assetValueCents(FUND, held.paidCents, span)
    const ratio = marketRatio(world.seed, held.boughtWeek, world.week, VOL)
    expect(held.valueCents).toBe(Math.round(held.paidCents * Math.pow(1 + FUND.annualRateBps / 10_000, span / WEEKS_PER_YEAR) * ratio))

    // ⭐ THE CLAIM THAT WOULD BE VACUOUS WITHOUT THIS LINE: the market really took it somewhere the
    // old risk-free 7% would not have. `ratio` is a market fact, so this is «the fund is no longer a
    // deterministic compound» and it is the arm that dies when `marketRatio` is dropped.
    expect(ratio).not.toBe(1)
    expect(held.valueCents).not.toBe(smooth)
  })

  it('⚠ and the deposit and the car did NOT move by a cent – the market is one rung`s business', () => {
    const world = career('r29p3-untouched', 120, (w) => {
      if (w.week === 8) buyAsset(w, 'deposit', 100_000_00)
      if (w.week === 8) buyAsset(w, 'car-sensible')
    })
    const dep = heldOf(world, 'deposit')
    const car = heldOf(world, 'car-sensible')
    // The THREE-ARGUMENT arithmetic this function has had since slice 1, to the cent.
    expect(dep.valueCents).toBe(assetValueCents(DEPOSIT, dep.paidCents, world.week - dep.boughtWeek))
    expect(car.valueCents).toBe(assetValueCents(CAR, car.paidCents, world.week - car.boughtWeek))
    // ...and they really went in opposite directions, so neither line is asserting a no-op.
    expect(dep.valueCents).toBeGreaterThan(dep.paidCents)
    expect(car.valueCents).toBeLessThan(car.paidCents)
  })
})

// -------------------------------------------------------------------------------------------------
describe('part three #16 – it is a market, not noise, and the household meter reads it', () => {
  it('⭐ SMOOTH: over five seasons the shelf line turns a handful of times, not weekly', () => {
    // The shelf line is what `householdWeekly` puts on screen – one more week of holding, signed.
    // A per-week draw would flip its sign about half the weeks; a market turns when the tide does.
    const world = createWorld('r29p3-smooth')
    world.fundsCents = 5_000_000_00
    buyAsset(world, 'index-fund', 100_000_00)
    const rng = resumeMain(world.rngMain)
    const line: number[] = []
    for (let i = 0; i < 260; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const held = heldOf(world, 'index-fund')
      line.push(assetWorthCents(world, held, FUND, 1) - assetWorthCents(world, held, FUND))
    }
    let flips = 0
    for (let i = 1; i < line.length; i++) if (Math.sign(line[i]) !== Math.sign(line[i - 1])) flips++
    // ⚠ THE NUMBER IS A CEILING AND NOT A PIN. 260 weeks, and the market's fastest octave is half a
    // season – a dozen turns is already generous. A per-week draw scores 120+ here.
    expect(flips, 'a market turns; noise flips').toBeLessThan(20)
    // ...and it really did turn, so «smooth» is not «flat».
    expect(flips).toBeGreaterThan(0)
    expect(line.some((c) => c < 0), 'a positive-rate holding really does have losing weeks now').toBe(true)
  })

  it('⭐⭐ the household meter and the till read ONE market (round 29 #11`s defect, re-armed)', () => {
    const world = career('r29p3-household', 140, (w) => {
      if (w.week === 20) buyAsset(w, 'index-fund', 120_000_00)
    })
    const held = heldOf(world, 'index-fund')
    const shelf = toSnapshot(world).coachBilling.household.shelfCents
    expect(shelf).toBe(assetWorthCents(world, held, FUND, 1) - assetWorthCents(world, held, FUND))
    // ⚠ AND IT IS NOT THE OLD SMOOTH WEEK, which is the inequality that dies when `householdWeekly`
    // goes back to `assetValueCents`.
    const smoothWeekAt = (w: WorldState) => {
      const h = heldOf(w, 'index-fund')
      const basis = h.basisCents ?? h.paidCents
      const n = w.week - (h.basisWeek ?? h.boughtWeek)
      return assetValueCents(FUND, basis, n + 1) - assetValueCents(FUND, basis, n)
    }
    expect(shelf).not.toBe(smoothWeekAt(world))

    // ⭐⭐ THE SHARP FORM, AND IT IS THE ONE A TURNING WEEK CANNOT MAKE VACUOUS: on a rung whose RATE
    // is positive the smooth week is positive EVERY week, by arithmetic. So a season in which the
    // meter reports a losing week at all can only be reporting the market. ⚠ An earlier draft of
    // this arm compared the two magnitudes in ONE week and failed honestly – the market's slope is
    // near zero at a turning point, so «the market dominates the drift» is not true of every week
    // and a test that says it is, is wrong about the model rather than about the code.
    const rng = resumeMain(world.rngMain)
    const meter: number[] = []
    const smooth: number[] = []
    for (let i = 0; i < WEEKS_PER_YEAR; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      meter.push(toSnapshot(world).coachBilling.household.shelfCents)
      smooth.push(smoothWeekAt(world))
    }
    expect(smooth.every((c) => c > 0), 'the rate alone can never lose a week').toBe(true)
    expect(meter.some((c) => c < 0), 'the market can, and did').toBe(true)
    expect(Math.max(...meter.map(Math.abs)), 'and it moves the meter by a multiple of the drift').toBeGreaterThan(
      3 * Math.max(...smooth),
    )
  })
})

// -------------------------------------------------------------------------------------------------
describe('part three #16 – the season line, on a career that really had a bad year', () => {
  // ⚠ THE SEED IS CHOSEN AND SAID SO. `tools/market-probe.ts` measures 19.9% of seasons negative, so
  // a bad year is common – this is a NAMED one so the arm can assert the exact sentence rather than
  // «some row appeared». Its second season is the negative one.
  const SEED = 'r29p3-career-20'

  it('⭐⭐ a negative season happens, the holding really falls, and the feed says why', () => {
    const world = career(SEED, 2 * WEEKS_PER_YEAR, (w) => {
      if (w.week === 1) buyAsset(w, 'index-fund', 50_000_00)
    })
    expect(world.week).toBe(104)

    // The market's own year, and it is DOWN – the fixture is not asserting an up year by accident.
    const move = marketSeasonMove(FUND, SEED, world.week)
    expect(move).toBeLessThan(0)

    // ⭐ AND THE MONEY REALLY FELL, which the sentence alone would not prove. What the holding was
    // worth a season ago against what it is worth now, both off the engine's one pricing function.
    const held = heldOf(world, 'index-fund')
    const aYearAgo = assetWorthCents({ ...world, week: world.week - WEEKS_PER_YEAR } as WorldState, held, FUND)
    expect(held.valueCents).toBeLessThan(aYearAgo)

    // ...and the row is in the feed, in the week the season turned, saying the same number rounded.
    const rows = world.events.filter((e) => e.week === world.week && e.text.startsWith('A season of the market'))
    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe(`A season of the market – An index fund is down ${-Math.round(move * 100)}% over the season.`)
    expect(rows[0].text).toContain('is down 8%')
    expect(rows[0].type).toBe('info')
  })

  it('⚠ ONCE A SEASON, ON THE BOUNDARY, and never on a shelf with nothing on it', () => {
    const holder = career(SEED, 110, (w) => {
      if (w.week === 1) buyAsset(w, 'index-fund', 50_000_00)
    })
    const said = holder.events.filter((e) => e.text.startsWith('A season of the market')).map((e) => e.week)
    // Weeks 52 and 104 and nothing between them. (The ledger prunes, so this reads the recent half
    // of the career – which is why the run stops at 110 rather than at 500.)
    expect(said).toEqual([52, 104])

    // A family that never opened the fund hears nothing about it, however loud the market was.
    const idle = career(SEED, 110)
    expect(idle.events.some((e) => e.text.startsWith('A season of the market'))).toBe(false)
    // ⚠ AND THE MARKET WAS LOUD IN EXACTLY THAT CAREER, so the silence is a decision and not an
    // absent market.
    expect(Math.abs(marketSeasonMove(FUND, SEED, 104))).toBeGreaterThan(0.05)
  })
})

// -------------------------------------------------------------------------------------------------
describe('part three #16 – ⚠⚠ THE LONG HORIZON IS SAFE, and it is a proof before it is a sample', () => {
  it('the wave is bounded in [-1, 1] – the premise every claim below rests on', () => {
    let worst = 0
    for (let s = 0; s < 120; s++) {
      for (let w = 0; w <= 780; w += 1) worst = Math.max(worst, Math.abs(marketWave(`bound-${s}`, w)))
    }
    expect(worst).toBeLessThanOrEqual(1)
    // ...and it gets close, so the bound is the real one and not a slack constant.
    expect(worst).toBeGreaterThan(0.85)
  })

  it('⭐⭐ CLOSED FORM: even the worst market the model can draw leaves ten years ahead of the deposit', () => {
    const fundTen = Math.pow(1 + FUND.annualRateBps / 10_000, 10) * worstMarketRatio(VOL)
    const depositTen = Math.pow(1 + DEPOSIT.annualRateBps / 10_000, 10)
    expect(fundTen).toBeGreaterThan(depositTen)
    // ⚠ THE MARGIN IS THIN AND THAT IS DELIBERATE – 1,800 bps sits just under the 1,824 the
    // inequality solves to. If a future tuning raises the volatility this arm is the one that says
    // no, so it must not be given slack it does not have.
    expect(VOL).toBeLessThan(1_824)
  })

  it('⭐⭐ MEASURED: 1 / 3 / 5 / 10 years against the 3.17% deposit, 400 seeds x 6 entry weeks', () => {
    const seeds = Array.from({ length: 400 }, (_, i) => `horizon-${i}`)
    const entries = [0, 26, 78, 156, 312, 520]
    const beat: Record<number, { n: number; won: number }> = {}
    for (const years of [1, 3, 5, 10]) {
      const weeks = years * WEEKS_PER_YEAR
      const deposit = assetValueCents(DEPOSIT, 1_000_000_00, weeks)
      let n = 0
      let won = 0
      for (const seed of seeds) {
        for (const from of entries) {
          const v = assetValueCents(FUND, 1_000_000_00, weeks, marketRatio(seed, from, from + weeks, VOL))
          n++
          if (v > deposit) won++
        }
      }
      beat[years] = { n, won }
    }
    // ⚠⚠ THE LAW: «On a long horizon the fund MUST beat Savings. Otherwise it is a trap for a player
    // who did not read carefully, and "мы ни за что не наказываем" is house law.» Every one of them.
    expect(beat[10].won).toBe(beat[10].n)
    expect(beat[10].n).toBe(2400)
    // ...and the shorter horizons are NOT safe, which is the whole point of the mechanic. A fund
    // that won every one-year hold would be the risk-free 7% this item exists to delete.
    expect(beat[1].won / beat[1].n).toBeLessThan(0.8)
    expect(beat[1].won / beat[1].n).toBeGreaterThan(0.5)
    expect(beat[3].won).toBeLessThan(beat[3].n)
    expect(beat[5].won).toBeLessThan(beat[5].n)
    // ⚠ AND THE ORDER IS MONOTONE: the longer you hold, the likelier you are right. That is the
    // sentence the shape of the design is supposed to teach.
    expect(beat[1].won / beat[1].n).toBeLessThan(beat[3].won / beat[3].n)
    expect(beat[3].won / beat[3].n).toBeLessThan(beat[5].won / beat[5].n)
    expect(beat[5].won / beat[5].n).toBeLessThan(beat[10].won / beat[10].n)
  })

  it('⭐ and roughly one season in five is negative – the risk is felt', () => {
    let seasons = 0
    let negative = 0
    for (let s = 0; s < 400; s++) {
      const seed = `neg-${s}`
      for (let w = 0; w + WEEKS_PER_YEAR <= 780; w += 26) {
        const v = assetValueCents(FUND, 1_000_000_00, WEEKS_PER_YEAR, marketRatio(seed, w, w + WEEKS_PER_YEAR, VOL))
        seasons++
        if (v < 1_000_000_00) negative++
      }
    }
    // ⚠ A BAND AND NOT A PIN, because the owner will re-tune this by feel. `tools/market-probe.ts`
    // measures 19.9% over 228,000 seasons; the band is «one year in four or five» with room either
    // side, and it is the arm that goes red if `volBps` or the octave mix is moved carelessly.
    const rate = negative / seasons
    expect(rate).toBeGreaterThan(0.12)
    expect(rate).toBeLessThan(0.32)
  })
})

// -------------------------------------------------------------------------------------------------
describe('part three #16 – the top-up and the part sale still hold under a market', () => {
  it('⭐⭐ a top-up rebases the MARKET too: new money enters at today`s index, not week one`s', () => {
    const world = career('r29p3-topup', 120, (w) => {
      if (w.week === 10) buyAsset(w, 'index-fund', 40_000_00)
      if (w.week === 70) buyAsset(w, 'index-fund', 30_000_00)
    })
    const held = heldOf(world, 'index-fund')
    expect(held.paidCents, 'the cash the family put in').toBe(70_000_00)
    expect(held.basisWeek, 'and the clock restarted at the top-up').toBe(70)
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
    // ⭐ THE TRAP #11 CAUGHT, RE-ARMED FOR A MARKET: had the new money been back-dated to week 10 it
    // would have ridden the market from week 10, which is a different – and here, larger – number.
    const backDated = assetValueCents(FUND, 70_000_00, world.week - 10, marketRatio(world.seed, 10, world.week, VOL))
    expect(held.valueCents).not.toBe(backDated)
    // ...and the market between weeks 10 and 70 really moved, so the inequality is not a rounding.
    expect(Math.abs(marketRatio(world.seed, 10, 70, VOL) - 1)).toBeGreaterThan(0.02)
  })

  it('⚠⚠ a part sale STAYS sold across the next tick, market or no market', () => {
    const world = career('r29p3-partsale', 90, (w) => {
      if (w.week === 10) buyAsset(w, 'index-fund', 100_000_00)
    })
    const before = heldOf(world, 'index-fund').valueCents
    const wallet = world.fundsCents
    sellAsset(world, 'index-fund', 30_000_00)
    expect(world.fundsCents).toBe(wallet + 30_000_00)
    const held = heldOf(world, 'index-fund')
    expect(held.valueCents).toBe(before - 30_000_00)
    expect(held.basisWeek).toBe(world.week)

    // The trap: `revalueAssets` recomputes from the basis every tick. A sale that only lowered the
    // value would be undone here – and under a market the reinflation is masked by the path moving,
    // which is exactly why this is asserted against the ENGINE's own price and not against a number.
    const rng = resumeMain(world.rngMain)
    tickWeek(world, rng)
    const after = heldOf(world, 'index-fund')
    expect(after.valueCents).toBe(assetWorthCents(world, after, FUND))
    expect(after.basisCents).toBe(before - 30_000_00)
    expect(after.paidCents, 'and the cost of what left went with it').toBeLessThan(100_000_00)
  })
})
