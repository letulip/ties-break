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
//   * `marketIndex`'s `if (!volBps) return 1` deleted         -> NOTHING under the wave-only model
//     (`exp(0·wave)` is already 1) – and STILL nothing under the crash layer, but for a new reason:
//     the guard is written twice and `marketRatio`'s own first clause shadows this one. See the
//     crash battery below for the pair.
//   * `marketRatio`'s `toWeek <= fromWeek` deleted            -> NOTHING, because no rung in the
//     catalogue is both commissioned and market-driven. Also documented at its source, and NOT
//     covered by an arm here: an arm that could not distinguish the mutation would be a dead guard
//     of exactly the kind this list exists to keep out.
//
// ⚠ THE CRASH BATTERY (his extension, 29.08) – eight more, each applied alone, watched, reverted:
//   * `marketCrashLog` -> constant 0 (the layer disconnected)  -> FOUR red: his -20% anchor, the
//     no-grace bite, the measured tail («a zero here means the layer is disconnected» – exactly),
//     and the trough top-up. The calendar arm stays green, correctly: the calendar exists whether
//     or not the index reads it, which is the same seeding/consumption split the weekly-noise
//     mutation demonstrated for the wave.
//   * `CRASH_DEPTH_RANGE` -> [0.85, 0.85] (his band emptied)   -> FIVE red, including the closed
//     form (the 0.70 floor is pinned there) and the calendar's median-depth band.
//   * `CRASH_JITTER_WEEKS` 104 -> 208 (gaps unbounded)         -> FIVE red: both gap theorems, the
//     no-grace share, and the two named fixtures whose calendars moved.
//   * the season line's `crashed` predicate forced false       -> «HIS ANCHOR» red, ALONE.
//   * `marketCrashFellIn` -> always true                       -> «A BAD YEAR THAT IS NOT A CRASH
//     STAYS PLAIN» red + the no-grace share arm – the label and its discriminator are separately
//     armed, in both directions.
//   * the recovery limb of `marketCrashLog` -> 0 (no rebound)  -> the anchor arm red (the season
//     nets deeper than his -20% once nothing comes back inside the year).
//   * the zero-vol guard, measured as a PAIR because a draft of the source note overclaimed:
//     `marketIndex`'s clause deleted alone -> NOTHING; `marketRatio`'s `!volBps` half deleted
//     alone -> NOTHING (each shadows the other); BOTH deleted -> «the deposit and the car did NOT
//     move by a cent» RED, ALONE. The pair is the guard; the arm covers the pair.
import { describe, it, expect } from 'vitest'
import {
  assetValueCents,
  assetWorthCents,
  buyAsset,
  closeTournament,
  createWorld,
  marketCrash,
  marketCrashFellIn,
  marketCrashLog,
  marketIndex,
  marketSeasonMove,
  marketWave,
  ownedAssets,
  sellAsset,
  shopItem,
  skipTournament,
  tickWeek,
  toSnapshot,
  unitPriceCents,
  worstCrashFreeRatio,
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

/** ⭐ ROUND 30 #14 – WHAT $1,000,000 PUT INTO THE FUND AT WEEK `from` IS WORTH `weeks` LATER, in
 *  cents, THROUGH THE SHIPPED ARITHMETIC: money buys units at the price of its own week and is worth
 *  `units × price(now)`. It replaces `assetValueCents(…, marketRatio(…))` at four call sites below –
 *  the same number, said the way the engine now says it, so these measurements keep pricing off the
 *  engine rather than off a copy of a model that no longer exists (`tools/market-probe.ts`'s own
 *  rule, and this file's). */
function fundOverWeeks(seed: string, from: number, weeks: number): number {
  const units = 1_000_000_00 / unitPriceCents(seed, from, FUND)
  return Math.round(units * unitPriceCents(seed, from + weeks, FUND))
}

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
  it('⭐⭐ the stored value is `units x price(now)`, and it is OFF the smooth curve', () => {
    const world = career('r29p3-value', 130, (w) => {
      if (w.week === 10) buyAsset(w, 'index-fund', 80_000_00)
    })
    const held = heldOf(world, 'index-fund')
    const span = world.week - held.boughtWeek

    // The engine's own answer, asked of the one function both writers use.
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
    // ⚠⚠ RE-AIMED AT ROUND 30 #14 AND THE CLAIM IS SHARPER, NOT WIDER. It read «`basis x index(now)
    // / index(basisWeek)`» and reproduced that by hand; the rebase is gone, so the sentence is now
    // «the money bought units at the price of week 10, and they are worth today's price» – which is
    // stated here independently of `assetWorthCents`, the same way the old line was.
    expect(held.units!).toBeCloseTo(80_000_00 / unitPriceCents(world.seed, 10, FUND), 8)
    expect(held.valueCents).toBe(Math.round(held.units! * unitPriceCents(world.seed, world.week, FUND)))

    // ⭐ THE CLAIM THAT WOULD BE VACUOUS WITHOUT THIS LINE: the market really took it somewhere the
    // old risk-free 7% would not have. The price ratio is a market fact, so this is «the fund is no
    // longer a deterministic compound», and it is the arm that dies when the market is disconnected.
    const smooth = assetValueCents(FUND, held.paidCents, span)
    const ratio =
      unitPriceCents(world.seed, world.week, FUND) /
      unitPriceCents(world.seed, 10, FUND) /
      Math.pow(1 + FUND.annualRateBps / 10_000, span / WEEKS_PER_YEAR)
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
    //
    // ⚠⚠ THE DEPOSIT IS HELD IN UNITS SINCE ROUND 30 #14 AND STILL ANSWERS THIS, WHICH IS THE POINT
    // OF LEAVING THE LINE ALONE. A zero-`volBps` unit price is `base × (1+r)^years` with
    // `marketIndex` answering exactly 1, so `units × price(now)` and «paid, compounded over its own
    // span» are the same number – to a cent of rounding, which is the only reason this is
    // `toBeCloseTo(…, -1)` rather than `toBe`. ⭐ IT IS ALSO THE ARM THAT NOW KILLS THE ZERO-VOL
    // GUARD ALONE: with `marketRatio` deleted there is only one copy left, and without it the
    // deposit would ride every crisis in the career.
    expect(dep.valueCents).toBeCloseTo(assetValueCents(DEPOSIT, dep.paidCents, world.week - dep.boughtWeek), -1)
    expect(car.valueCents).toBe(assetValueCents(CAR, car.paidCents, world.week - car.boughtWeek))
    // ⚠ AND THE CAR CARRIES NO UNITS AT ALL – a 'fixed' rung is bought whole and valued off what was
    // paid, which is the other half of «the market is one rung's business».
    expect(car.units, 'a car is not a count of shares').toBeUndefined()
    expect(dep.units, 'and a deposit is').toBeGreaterThan(0)
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
    // ⚠ RE-AIMED AT ROUND 30 #14 AND THE COMPARISON IS UNCHANGED: this is what the meter WOULD say
    // if the shelf line had gone back to the rate alone. There is no basis to read any more, so the
    // «smooth week» is the cash the family put in compounded over its own span – which is exactly
    // the number the pre-market engine produced and the number this arm must NOT match.
    const smoothWeekAt = (w: WorldState) => {
      const h = heldOf(w, 'index-fund')
      const n = w.week - h.boughtWeek
      return assetValueCents(FUND, h.paidCents, n + 1) - assetValueCents(FUND, h.paidCents, n)
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
describe('part three #16 + the crash extension – the season line knows a crash from a bad year', () => {
  // ⚠ THE SEEDS ARE CHOSEN AND SAID SO, and RE-SCANNED A SECOND TIME AT ROUND 30 #14 – his ruling
  // halved the wave's `volBps` (1,800 -> 900), so every season figure in the game moved and the two
  // named fixtures moved with it. That is the third time this note has been rewritten and the reason
  // it is a note rather than a magic string: a chosen seed is a MEASUREMENT of the shipped model,
  // and it has to be re-taken whenever the model is re-tuned. ⚠ The two ARMS below are untouched –
  // only the seeds that satisfy them are new.
  //
  // `r29p3-crash-56` is the owner's own anchor made real under the new volatility: its epoch-0 crash
  // falls at weeks 22-31, is drawn at -21.0% (inside his -15…-30 band), and the STARTING season nets
  // exactly -20% – «стартовый сезон уже может быть как раз с -20%». `r29p3-crash-272` is the
  // discriminator: season one is down 4.9% on the WAVE alone, its crash falling later (week 79), so
  // its feed row must stay plain – and its first fall really is in season two, which is what the
  // «never on an empty shelf» arm leans on.
  const CRASH_SEED = 'r29p3-crash-56'
  const PLAIN_SEED = 'r29p3-crash-272'

  it('⭐⭐ HIS ANCHOR, TICKED: the starting season is a crash year, down 20%, and the feed says which', () => {
    // The engine's own calendar, pinned so the fixture cannot drift silently under a re-tune: the
    // fall is inside season one and deep.
    const c = marketCrash(CRASH_SEED, 0)
    expect(c.troughWeek).toBeLessThan(WEEKS_PER_YEAR)
    expect(Math.exp(c.depthLog)).toBeLessThan(0.8)

    const world = career(CRASH_SEED, WEEKS_PER_YEAR + 2, (w) => {
      if (w.week === 1) buyAsset(w, 'index-fund', 50_000_00)
    })
    const move = marketSeasonMove(FUND, CRASH_SEED, WEEKS_PER_YEAR)
    expect(Math.round(move * 100), 'the anchor: a -20% starting season').toBe(-20)

    // ⭐ THE MONEY REALLY FELL – the holding is worth less than the family put in, read off the row.
    const held = heldOf(world, 'index-fund')
    expect(held.valueCents).toBeLessThan(held.paidCents)

    // ...and the row names the crash, in the week the season turned, with the same number rounded.
    const rows = world.events.filter((e) => e.week === WEEKS_PER_YEAR && e.text.startsWith('A season of the market'))
    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe('A season of the market – a crash year: An index fund is down 20% over the season.')
    expect(rows[0].type).toBe('info')
  })

  it('⚠ A BAD YEAR THAT IS NOT A CRASH STAYS PLAIN – the label is the fall, never mere red', () => {
    // Season one is down on the wave alone; this seed's fall starts at week 64, after the boundary.
    const c = marketCrash(PLAIN_SEED, 0)
    expect(c.startWeek).toBeGreaterThan(WEEKS_PER_YEAR)
    expect(marketCrashFellIn(PLAIN_SEED, 0, WEEKS_PER_YEAR)).toBe(false)

    const world = career(PLAIN_SEED, WEEKS_PER_YEAR + 2, (w) => {
      if (w.week === 1) buyAsset(w, 'index-fund', 50_000_00)
    })
    const move = marketSeasonMove(FUND, PLAIN_SEED, WEEKS_PER_YEAR)
    expect(move, 'the fixture really is a down year').toBeLessThan(-0.02)
    const rows = world.events.filter((e) => e.week === WEEKS_PER_YEAR && e.text.startsWith('A season of the market'))
    expect(rows).toHaveLength(1)
    expect(rows[0].text).toBe(`A season of the market – An index fund is down ${-Math.round(move * 100)}% over the season.`)
    expect(rows[0].text, 'no crash label on a wave year').not.toContain('crash')
  })

  it('⚠ ONCE A SEASON, ON THE BOUNDARY, and never on a shelf with nothing on it', () => {
    const holder = career(PLAIN_SEED, 110, (w) => {
      if (w.week === 1) buyAsset(w, 'index-fund', 50_000_00)
    })
    const said = holder.events.filter((e) => e.text.startsWith('A season of the market')).map((e) => e.week)
    // Weeks 52 and 104 and nothing between them – the crash label changes the sentence, never the
    // count. (The ledger prunes, so this reads the recent half of the career – which is why the run
    // stops at 110 rather than at 500.)
    expect(said).toEqual([52, 104])

    // A family that never opened the fund hears nothing about it, however loud the market was.
    const idle = career(PLAIN_SEED, 110)
    expect(idle.events.some((e) => e.text.startsWith('A season of the market'))).toBe(false)
    // ⚠ AND THE MARKET WAS LOUD IN EXACTLY THAT CAREER, so the silence is a decision and not an
    // absent market: season two contains this seed's first fall.
    expect(marketCrashFellIn(PLAIN_SEED, WEEKS_PER_YEAR, 2 * WEEKS_PER_YEAR)).toBe(true)
  })
})

// -------------------------------------------------------------------------------------------------
describe('the crash extension – the calendar is variability, not rails', () => {
  it('⭐⭐ gaps 2-6 years centered on exactly four, three-quarters inside his «раз в 3-5 лет» band', () => {
    const gaps: number[] = []
    const depths: number[] = []
    let malformed = 0
    for (let i = 0; i < 200; i++) {
      const seed = `cal-${i}`
      let prev = -1
      for (let epoch = 0; epoch <= 4; epoch++) {
        const c = marketCrash(seed, epoch)
        // Contained in its own epoch and ordered – the no-overlap theorem, checked rather than trusted.
        if (c.startWeek < epoch * 208 || c.endWeek >= (epoch + 1) * 208) malformed++
        if (!(c.startWeek < c.troughWeek && c.troughWeek < c.endWeek)) malformed++
        if (prev >= 0) gaps.push(c.startWeek - prev)
        prev = c.startWeek
        depths.push(Math.exp(c.depthLog))
      }
    }
    expect(malformed).toBe(0)
    expect(gaps.length).toBe(800)
    // Every gap in (104, 312) – two to six years, never a pile-up and never a decade of calm.
    expect(gaps.filter((g) => g <= 104 || g >= 312)).toHaveLength(0)
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length
    expect(mean / WEEKS_PER_YEAR).toBeGreaterThan(3.7)
    expect(mean / WEEKS_PER_YEAR).toBeLessThan(4.3)
    // ...and the 3-5y band holds the bulk. Probe (16,000 crises): 75.2%.
    const inBand = gaps.filter((g) => g >= 3 * WEEKS_PER_YEAR && g <= 5 * WEEKS_PER_YEAR).length / gaps.length
    expect(inBand).toBeGreaterThan(0.65)
    // Depth: his «-15…-30%» band verbatim, and the middle really is near his -20% anchor.
    expect(depths.filter((d) => d < 0.7 - 1e-12 || d > 0.85 + 1e-12)).toHaveLength(0)
    const median = [...depths].sort((a, b) => a - b)[Math.floor(depths.length / 2)]
    expect(median).toBeGreaterThan(0.75)
    expect(median).toBeLessThan(0.8)
  })

  it('⚠ NO GRACE PERIOD: about half of all careers open into a fall, and a real one really bites', () => {
    // The share, over seeds – his «стартовый сезон уже может быть как раз с -20%» needs «может» to
    // be common, not universal. Probe (4,000 seeds): 49.7%.
    let firstSeason = 0
    for (let i = 0; i < 200; i++) if (marketCrashFellIn(`grace-${i}`, 0, WEEKS_PER_YEAR)) firstSeason++
    expect(firstSeason / 200).toBeGreaterThan(0.3)
    expect(firstSeason / 200).toBeLessThan(0.7)

    // ...and one named career, week-0 money, read at the trough: r29p3-crash-12 bottoms at week 20.
    const SEED = 'r29p3-crash-12'
    const c = marketCrash(SEED, 0)
    const world = createWorld(SEED)
    world.fundsCents = 5_000_000_00
    buyAsset(world, 'index-fund', 50_000_00)
    const rng = resumeMain(world.rngMain)
    while (world.week < c.troughWeek) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    const held = heldOf(world, 'index-fund')
    // Down at least 15% from the family's money, inside the first half-season of the game.
    expect(held.valueCents / held.paidCents).toBeLessThan(0.85)
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
  })
})

// -------------------------------------------------------------------------------------------------
describe('part three #16 – ⚠⚠ THE LONG HORIZON, re-derived under crashes: a two-tier bound', () => {
  it('the wave is bounded in [-1, 1] – the premise every claim below rests on', () => {
    let worst = 0
    for (let s = 0; s < 120; s++) {
      for (let w = 0; w <= 780; w += 1) worst = Math.max(worst, Math.abs(marketWave(`bound-${s}`, w)))
    }
    expect(worst).toBeLessThanOrEqual(1)
    // ...and it gets close, so the bound is the real one and not a slack constant.
    expect(worst).toBeGreaterThan(0.85)
  })

  it('⭐⭐ CLOSED FORM, TWO TIERS: calm waters keep the old guarantee; a trough-sell needs ~20 years', () => {
    const growth = (rateBps: number, years: number) => Math.pow(1 + rateBps / 10_000, years)

    // TIER ONE – both ends outside crash arcs. The arc always returns home, so the crash contributes
    // exactly zero and the ORIGINAL ten-year universality stands verbatim, same 1,824 bps ceiling.
    expect(growth(FUND.annualRateBps, 10) * worstCrashFreeRatio(VOL)).toBeGreaterThan(growth(DEPOSIT.annualRateBps, 10))
    expect(VOL).toBeLessThan(1_824)

    // TIER TWO – selling into the deepest possible trough. The floor is the crash constant itself
    // (-30%), pinned here so deepening his band knowingly moves this arm and nothing else quietly.
    expect(worstMarketRatio(VOL)).toBeCloseTo(worstCrashFreeRatio(VOL) * 0.7, 10)
    // At ten years the total bound genuinely FAILS – the loss tail is real, which is why it is
    // MEASURED in the arm below and stated to the owner as a number, not assumed away…
    expect(growth(FUND.annualRateBps, 10) * worstMarketRatio(VOL)).toBeLessThan(growth(DEPOSIT.annualRateBps, 10))
    // …and universality returns just under twenty years – longer than a career, which is the honest
    // sentence: within a career, «hold through and sell in calm» is the guarantee; «sell into the
    // trough» is the measured tail.
    expect(growth(FUND.annualRateBps, 20) * worstMarketRatio(VOL)).toBeGreaterThan(growth(DEPOSIT.annualRateBps, 20))
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
          const v = fundOverWeeks(seed, from, weeks)
          n++
          if (v > deposit) won++
        }
      }
      beat[years] = { n, won }
    }
    // ⚠⚠ THE LAW, RE-STATED UNDER CRASHES: «мы ни за что не наказываем» now reads – holding through
    // a crisis costs nothing (the arc comes home), and only SELLING INTO one can lose. So the tail
    // must be (a) real, or the crash layer is dead; (b) small; (c) made ENTIRELY of trough-sells –
    // a single calm-water loser breaks tier one of the closed form. Probe at scale: 529 of 48,000
    // (1.10%) at ten years, zero of them in calm waters. HIS number to accept, measured here too.
    expect(beat[10].n).toBe(2400)
    const tail10 = beat[10].n - beat[10].won
    expect(tail10, 'the crash tail is real – a zero here means the layer is disconnected').toBeGreaterThan(0)
    expect(tail10 / beat[10].n, 'and small').toBeLessThan(0.025)
    for (const seed of seeds) {
      for (const from of entries) {
        const weeks = 10 * WEEKS_PER_YEAR
        const v = fundOverWeeks(seed, from, weeks)
        if (v <= assetValueCents(DEPOSIT, 1_000_000_00, weeks)) {
          expect(marketCrashLog(seed, from + weeks), `${seed}@${from} lost selling in calm waters`).toBeLessThan(0)
        }
      }
    }
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

  it('⭐ and the negative-season share sits where the probe says – the risk is felt', () => {
    let seasons = 0
    let negative = 0
    for (let s = 0; s < 400; s++) {
      const seed = `neg-${s}`
      for (let w = 0; w + WEEKS_PER_YEAR <= 780; w += 26) {
        const v = fundOverWeeks(seed, w, WEEKS_PER_YEAR)
        seasons++
        if (v < 1_000_000_00) negative++
      }
    }
    // ⚠ A BAND AND NOT A PIN, because the owner will re-tune this by feel. RE-AIMED under the crash
    // layer: the wave alone measured 19.9% negative seasons; with his crises on top the probe reads
    // 30.8% over 228,000 – nearly one season in three, which is a consequence he sees plainly in
    // §14h (the wave knob comes down if he wants one-in-four back). The band moves with the
    // measurement; it still goes red if `volBps`, the octave mix or the crash depth moves carelessly.
    const rate = negative / seasons
    expect(rate).toBeGreaterThan(0.2)
    expect(rate).toBeLessThan(0.4)
  })
})

// -------------------------------------------------------------------------------------------------
describe('part three #16 – the top-up and the part sale still hold under a market', () => {
  it('⭐⭐ a second cheque buys units at TODAY`s price, not week one`s', () => {
    const world = career('r29p3-topup', 120, (w) => {
      if (w.week === 10) buyAsset(w, 'index-fund', 40_000_00)
      if (w.week === 70) buyAsset(w, 'index-fund', 30_000_00)
    })
    const held = heldOf(world, 'index-fund')
    expect(held.paidCents, 'the cash the family put in').toBe(70_000_00)
    // ⚠⚠ RE-AIMED AT ROUND 30 #14 AND THE TITLE WITH IT – it read «a top-up rebases the MARKET too»,
    // and there is no rebase to assert. The claim underneath was always the same one: new money
    // enters where the market IS, not where it was. Units say that without a restatement, and the
    // two prices are named rather than folded into one number.
    expect(held.basisWeek, 'and the clock restarted nowhere').toBeUndefined()
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
    const p10 = unitPriceCents(world.seed, 10, FUND)
    const p70 = unitPriceCents(world.seed, 70, FUND)
    expect(held.units!).toBeCloseTo(40_000_00 / p10 + 30_000_00 / p70, 8)
    // ⭐ THE TRAP #11 CAUGHT, RE-ARMED FOR A MARKET: had the new money been back-dated to week 10 it
    // would have bought its units at week 10's price, which is a different – and here, larger –
    // number of them.
    const backDated = Math.round((70_000_00 / p10) * unitPriceCents(world.seed, world.week, FUND))
    expect(held.valueCents).not.toBe(backDated)
    // ...and the market between weeks 10 and 70 really moved, so the inequality is not a rounding.
    // ⚠ The floor was 0.02, the CRASH LAYER moved this seed's ratio to 0.0174, and round 30 #14's
    // halved volatility moves it again – the drift is divided out here so what is left is the market
    // alone. 0.01 is still a hundred times any rounding, and the claim this guards (that the
    // not-equal above is substantive) does not need more.
    const marketOnly = p70 / p10 / Math.pow(1 + FUND.annualRateBps / 10_000, 60 / WEEKS_PER_YEAR)
    expect(Math.abs(marketOnly - 1)).toBeGreaterThan(0.01)
  })

  it('⭐⭐ THE CRASH CASE HIS EXTENSION ADDS: a tranche bought AT THE TROUGH, and the P&L stays honest', () => {
    // r29p3-crash-46, scanned and named: calm until week 32, trough at 46 (-28.8% drawn), recovered
    // by 115. The family opens in calm waters and doubles in at the very bottom – the strongest
    // version of «new money enters at today's index», because today's index is a crisis.
    const SEED = 'r29p3-crash-46'
    const c = marketCrash(SEED, 0)
    expect(c.troughWeek).toBe(46)
    expect(c.startWeek).toBeGreaterThan(10)

    let troughValue = 0
    const world = career(SEED, c.endWeek + 5, (w) => {
      if (w.week === 10) buyAsset(w, 'index-fund', 50_000_00)
      if (w.week === c.troughWeek) {
        // The crisis really bit first – the holding stands well under the family's money…
        troughValue = heldOf(w, 'index-fund').valueCents
        // …and THAT is the moment they add to it.
        buyAsset(w, 'index-fund', 30_000_00)
      }
    })
    expect(troughValue, 'the fixture is a real crash, not a dip').toBeLessThan(42_500_00)

    const held = heldOf(world, 'index-fund')
    // The P&L, whole: cash is cash, the second tranche bought its units AT THE TROUGH PRICE, and the
    // value is the one arithmetic (`assetWorthCents`) – so those units rode the WHOLE rebound.
    //
    // ⚠⚠ RE-AIMED AT ROUND 30 #14 AND THE FIXTURE IS THE SAME CRISIS. «The basis was struck at the
    // trough» was the rebase's way of saying it; units say it directly and say MORE – the trough
    // tranche is a countable number of shares bought at the cheapest price in the career, which is
    // «усредниться» in one line.
    expect(held.paidCents).toBe(80_000_00)
    expect(held.boughtWeek).toBe(10)
    expect(held.basisWeek, 'and no clock was restarted by the second cheque').toBeUndefined()
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
    const priceAtOpen = unitPriceCents(SEED, 10, FUND)
    const priceAtTrough = unitPriceCents(SEED, c.troughWeek, FUND)
    expect(priceAtTrough, 'the fixture really is a cheaper entry').toBeLessThan(priceAtOpen)
    expect(held.units!).toBeCloseTo(50_000_00 / priceAtOpen + 30_000_00 / priceAtTrough, 8)
    // ⚠ AND NOT THE BACK-DATED ARITHMETIC: money pretending to have been there since week 10 would
    // have bought its units at the pre-crash price. Under a crash the two REALLY diverge.
    const backDated = Math.round((80_000_00 / priceAtOpen) * unitPriceCents(SEED, world.week, FUND))
    expect(held.valueCents).not.toBe(backDated)
    // The direction is the crash speaking: entering at the bottom beats entering before the fall.
    expect(held.valueCents).toBeGreaterThan(backDated)
    // ⭐⭐ AND THE AVERAGE CAME DOWN, WHICH IS THE WHOLE OF «имеешь возможность усредниться»: the
    // family's own entry price is now below what it was before they doubled in.
    expect(held.paidCents / held.units!, 'averaging down really moved the average').toBeLessThan(priceAtOpen)
  })

  it('⚠ and a part sale AT THE TROUGH stays sold – the crisis does not reinflate it', () => {
    // The same trap part two #4 caught, at the worst possible week to sell: `revalueAssets`
    // recomputes from the basis every tick, and mid-crash the path itself is moving hard, which is
    // exactly the noise a silent reinflation would hide in.
    const SEED = 'r29p3-crash-46'
    const c = marketCrash(SEED, 0)
    let walletAfter = 0
    const world = career(SEED, c.troughWeek + 3, (w) => {
      if (w.week === 10) buyAsset(w, 'index-fund', 50_000_00)
      if (w.week === c.troughWeek) {
        const wallet = w.fundsCents
        const before = heldOf(w, 'index-fund').valueCents
        sellAsset(w, 'index-fund', 10_000_00)
        expect(w.fundsCents).toBe(wallet + 10_000_00)
        expect(heldOf(w, 'index-fund').valueCents).toBe(before - 10_000_00)
        walletAfter = w.fundsCents
      }
    })
    const held = heldOf(world, 'index-fund')
    // Three ticks later the holding is priced off the units that were LEFT – riding the early
    // rebound, not reinflated to the pre-sale curve.
    expect(held.basisWeek, 'a part sale restarts no clock (round 30 #14)').toBeUndefined()
    expect(held.valueCents).toBe(assetWorthCents(world, held, FUND))
    expect(held.paidCents, 'the cost of what left went with it').toBeLessThan(50_000_00)
    expect(walletAfter, 'the sale really happened inside the run').toBeGreaterThan(0)
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
    expect(held.basisWeek, 'and no clock was restarted (round 30 #14)').toBeUndefined()
    const unitsAfter = held.units!

    // The trap: `revalueAssets` recomputes from the basis every tick. A sale that only lowered the
    // value would be undone here – and under a market the reinflation is masked by the path moving,
    // which is exactly why this is asserted against the ENGINE's own price and not against a number.
    const rng = resumeMain(world.rngMain)
    tickWeek(world, rng)
    const after = heldOf(world, 'index-fund')
    expect(after.valueCents).toBe(assetWorthCents(world, after, FUND))
    // ⚠ RE-AIMED AT ROUND 30 #14: the field that survived the tick was `basisCents`; it is `units`
    // now, and the claim is the same one – the tick re-priced the holding and did NOT restore what
    // was sold.
    expect(after.units).toBe(unitsAfter)
    expect(after.paidCents, 'and the cost of what left went with it').toBeLessThan(100_000_00)
  })
})
