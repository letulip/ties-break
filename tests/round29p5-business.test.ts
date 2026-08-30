// ROUND 29 PART FOUR P7, PARTS 2 AND 3 – FAME (the accounted stock), THE MERCH BRAND (income
// follows fame) AND THE ACADEMY THAT EARNS (income follows reputation = seasons ended in band).
//
// His order, verbatim: «нам нужен мерч, растущий от частоты и обилия рекламных контрактов, съемок,
// выступлений, титулов и прочего» and «нам нужна академия, которая зарабатывает» – with the fame
// spec's shape he approved out loud («здесь полностью согласен»): the floor is earned on court and
// the shoots MULTIPLY it.
//
// ⚠ MUTATIONS, EACH APPLIED ALONE TO THE ENGINE AND WATCHED FAIL BEFORE THIS FILE WAS BELIEVED
// (the round's own rule – eleven dead guards in three days). What each ACTUALLY reddened, counted
// from the runs rather than predicted:
//   M1 `fameFloorOf` returning 0 unconditionally → 7 of 22 red (every floor arm, the cap, the
//      merch income arm and the till's lived week);
//   M2 `decayAt` clamped to 1 (decay deleted) → 1 red, the half-life arm, on the exact halving;
//   M3 `fameShootMultOf` returning 1 (the lever deleted) → 1 red, the shoots-multiply arm;
//   M4 `resolveBusinessIncome` never writing the academy row → 1 red, the lived-week rows arm
//      (the merch row survives inside it – two rows, one claim about both);
//   M5 `academyReputationOf` returning 1 always → 3 red (the 1.75 ladder, the cap, the per-stage
//      figures);
//   M6 `familyWeeklyIncomeCents` without the business term → 1 red, the strip-totalling arm –
//      round 28 #8's law is a live guard, not a restatement;
//   M7 `assetWeeklyIncomeCents` reading `kidRankWta` instead of fame → 2 red, §2's «NOT rank»
//      assertion by name plus the fame arithmetic beside it.
import { describe, it, expect, vi } from 'vitest'

vi.setConfig({ testTimeout: 300_000 })

import {
  academyReputationOf,
  academyWeeklyIncomeCents,
  assetWeeklyIncomeCents,
  brandSignalsOf,
  brandWeeklyGrossCents,
  buyAsset,
  createWorld,
  fameAt,
  fameFloorOf,
  fameShootMultOf,
  kidAgeYears,
  merchWeeklyIncomeCents,
  shopView,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { householdWeekly } from '../src/engine/world/coachMarket'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type AdOfferTerms, type Offer, type SeasonHistoryEntry } from '../src/shared/protocol'

const FAME = ECONOMY.fame
const BIZ = ECONOMY.business

const ageOf = (w: WorldState): number => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)

/** A fresh world parked at an adult week – fame's inputs are all hand-plantable records, so no
 *  ticking is needed to ask the fold questions. */
function still(seed: string, week = 400): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  return world
}

/** A SIGNED ad paper carrying exactly these shoot weeks – the shape `acceptOffer`'s ad arm writes,
 *  hand-planted because §1 is about the FOLD over the record, not about the letter machinery
 *  (which round29p4-ad-portfolio.test.ts already drives end to end). */
function plantShoots(world: WorldState, weeks: number[]): void {
  const offer: Offer = {
    id: `ad-fame-${world.offers.length}`,
    kind: 'ad',
    week: Math.min(...weeks, world.week) - 1,
    deadlineWeek: world.week,
    state: 'signed',
    fromWeek: Math.min(...weeks, world.week) - 1,
    untilWeek: Math.max(...weeks) + 52,
    terms: {
      brand: 'Quiet Hour',
      cashCents: 20_000_00,
      termWeeks: 52,
      shootCount: weeks.length,
      shootWeeks: [...weeks],
    } as AdOfferTerms,
  }
  world.offers.push(offer)
}

/** One banked season ended at `endRank` on the professional table – the p4 file's own fixture
 *  shape, the one `wrapSeason` writes and both folds read. */
function seasonAt(index: number, endRank: number | undefined): SeasonHistoryEntry {
  return {
    seasonIndex: index,
    endRank: 40,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0 },
      wta: endRank === undefined ? { points: 0, wins: 0, losses: 0 } : { endRank, points: 0, wins: 0, losses: 0 },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }
}

/** The owner's own save as a reputation ladder: #411→#198→#155→#106→#97→…→#42→#23 – two seasons
 *  inside #100, one inside #50, one inside #25, reputation 1.75 (the ledger's own worked example). */
const OWNERS_SEASONS = [411, 198, 155, 106, 97, 385, 173, 98, 106, 42, 23]

// =================================================================================================
// 1 – FAME: THE FLOOR IS EARNED ON COURT, THE SHOOTS MULTIPLY IT, AND EVERYTHING DECAYS
// =================================================================================================
describe('§1 fame – an accounted stock, 0–100, zero draws', () => {
  it('a fresh career carries zero fame, and a junior title ladder buys none', () => {
    const world = still('p5a-zero')
    expect(fameAt(world)).toBe(0)
    world.trophiesByTier.j300.titles.push(390)
    world.trophiesByTier.national.titles.push(391)
    expect(fameAt(world), 'the world does not read junior draws').toBe(0)
  })

  it('⭐⭐ titles buy the floor by tier, fresh at the full step', () => {
    const world = still('p5a-title')
    world.trophiesByTier.wta1000.titles.push(world.week)
    expect(fameAt(world)).toBeCloseTo(FAME.titleFloor.wta1000!, 5)
    world.trophiesByTier.slam.titles.push(world.week)
    expect(fameAt(world)).toBeCloseTo(FAME.titleFloor.wta1000! + FAME.titleFloor.slam!, 5)
  })

  it('⭐ a LOST Slam final counts its own step – and only the Slam one does', () => {
    const world = still('p5a-final')
    world.trophiesByTier.slam.finals.push(world.week)
    expect(fameAt(world)).toBeCloseTo(FAME.slamFinalFloor, 5)
    world.trophiesByTier.wta1000.finals.push(world.week)
    expect(fameAt(world), 'the world remembers who won everywhere below a Slam').toBeCloseTo(FAME.slamFinalFloor, 5)
  })

  it('⭐⭐⭐ the season-end LADDER – top 10, then top 20, then top 50, and best band only', () => {
    // ⚠⚠ ROUND 30 #24 RE-AIMED THIS ARM AND REVERSED HALF OF IT. It read «an 11th place counts
    // NOTHING», which was the whole of the owner's complaint, three times over: «она же топ-20 в
    // мире». A career built on quarter- and semi-finals won no title, reached no Slam final and
    // ended no season in the top ten, so its fame floor was EXACTLY ZERO and its brand was worth
    // nothing however high it ranked. Two rungs ended that on 30.08.
    const world = still('p5a-seasons', 4 * WEEKS_PER_YEAR)
    const bands = FAME.seasonEndBands
    const floorFor = (endRank: number): number => {
      world.seasonHistory = [seasonAt(2, endRank)]
      return fameAt(world)
    }
    // ⚠ THE DECAY IS IN EVERY READING, so the arm compares the rungs to EACH OTHER rather than to
    // their raw steps – the ratios are exact and the absolute figures are not.
    const top10 = floorFor(8)
    const top20 = floorFor(15)
    const top50 = floorFor(40)
    expect(top10).toBeGreaterThan(top20)
    expect(top20).toBeGreaterThan(top50)
    expect(top50).toBeGreaterThan(0)
    expect(top20 / top10).toBeCloseTo(bands[1].add / bands[0].add, 5)
    expect(top50 / top10).toBeCloseTo(bands[2].add / bands[0].add, 5)
    // ⚠ BEST BAND ONLY, once per season: a top-10 season is a top-10 season and never also a
    // top-20 and a top-50 one, which is `academy.reputationBands`' own rule.
    expect(top10 / (bands[0].add + bands[1].add + bands[2].add)).toBeLessThan(1)
    expect(top10).toBeCloseTo(floorFor(8), 5)
    // ...and the ladder still ENDS. A season outside every band counts nothing, and so does a row
    // that never recorded a WTA rank – «not recorded» is not «unranked».
    expect(floorFor(200)).toBe(0)
    world.seasonHistory = [{ ...seasonAt(2, 8), byTrack: undefined }] // a v45 row: not recorded
    expect(fameAt(world)).toBe(0)
  })

  it('⭐⭐ the decay halves a contribution at exactly the half-life – the world forgets slowly', () => {
    const world = still('p5a-decay')
    world.trophiesByTier.slam.titles.push(world.week - FAME.halfLifeWeeks)
    expect(fameAt(world)).toBeCloseTo(FAME.titleFloor.slam! / 2, 5)
  })

  it('⭐⭐⭐ shoots MULTIPLY the floor – and multiply nothing when there is no floor', () => {
    const a = still('p5a-shoots')
    a.trophiesByTier.wta500.titles.push(a.week)
    const floorOnly = fameAt(a)
    plantShoots(a, [a.week - 4, a.week - 8, a.week - 12])
    const mult = fameShootMultOf(a, a.week)
    expect(mult).toBeGreaterThan(1)
    expect(fameAt(a)).toBeCloseTo(floorOnly * mult, 5)
    // ...and the census's counter-face: a face with no results has nothing to multiply.
    const b = still('p5a-shoots-bare')
    plantShoots(b, [b.week - 4, b.week - 8, b.week - 12])
    expect(fameAt(b), 'zero floor times any number of photographs is zero').toBe(0)
  })

  it('a shoot week still ahead is a promise, not a photograph – it buys nothing yet', () => {
    const world = still('p5a-future')
    world.trophiesByTier.wta500.titles.push(world.week)
    const before = fameAt(world)
    plantShoots(world, [world.week + 6])
    expect(fameAt(world)).toBeCloseTo(before, 10)
  })

  it('a shoot week the college freeze swallowed lapsed silently – it bought no fame either', () => {
    const world = still('p5a-college')
    world.trophiesByTier.wta500.titles.push(world.week)
    const before = fameAt(world)
    world.college = {
      fromWeek: world.week - 60,
      untilWeek: world.week + 150,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
      leagueReveal: null,
      callUpReveal: null,
      pausedBirthday: null,
    } as unknown as WorldState['college']
    plantShoots(world, [world.week - 10]) // inside the freeze
    expect(fameAt(world)).toBeCloseTo(before, 10)
  })

  it('fame is capped at 100 – a reign cannot overflow the scale', () => {
    const world = still('p5a-cap')
    for (let i = 0; i < 30; i++) world.trophiesByTier.slam.titles.push(world.week - i)
    expect(fameAt(world)).toBe(FAME.cap)
    // the snapshot rounds ONCE at the boundary and carries a whole number
    const snap = toSnapshot(world)
    expect(snap.fame).toBe(100)
    expect(Number.isInteger(snap.fame)).toBe(true)
  })

  it('⚠ the fold is bookkeeping, not a roll: reading fame moves no stream and writes nothing', () => {
    const world = still('p5a-pure')
    world.trophiesByTier.slam.titles.push(world.week - 10)
    plantShoots(world, [world.week - 5])
    const before = JSON.stringify(world)
    fameAt(world)
    fameFloorOf(world, world.week)
    fameShootMultOf(world, world.week)
    expect(JSON.stringify(world)).toBe(before)
  })
})

// =================================================================================================
// 2 – MERCH: THE PARENT'S FIRST BUSINESS, AND IT READS FAME – NEVER RANK
// =================================================================================================
describe('§2 the merch brand – income follows fame', () => {
  it('the rung is on the shelf, cheap against the academy, startable the week the money is there', () => {
    const world = still('p5a-shelf')
    const row = shopView(world).rows.find((r) => r.id === 'merch-brand')
    expect(row).toBeDefined()
    expect(row!.family).toBe('business')
    expect(row!.entryCents).toBe(250_000_00)
    // «еще это дешевле академии» – an order of magnitude under the four stages' $12M
    expect(row!.entryCents * 10).toBeLessThanOrEqual(12_000_000_00)
  })

  it('⭐⭐ owned, the brand pays a curve in fame – and the shop card quotes the till\'s own figure', () => {
    const world = still('p5a-merch')
    world.trophiesByTier.wta1000.titles.push(world.week - 2)
    world.fundsCents = 300_000_00
    buyAsset(world, 'merch-brand')
    // ⭐⭐⭐ ROUND 30 #23 RE-AIMED THIS ARM AND KEPT ITS CLAIM. It read `fame x perFamePointCents`,
    // which was the whole dial until 30.08 and is now only the SCALE of a convex curve
    // (`weekly = perFamePointCents x fame² / famePivot` – research §7e: hold the anchor at the bottom,
    // reach the researched band at the top, and the only curves left are convex). ⚠ THE ARM ASSERTS
    // THE CURVE'S PROPERTIES rather than re-deriving it: a test that re-typed the new formula would
    // pass on a second copy of it, which is the defect this file's §4 exists to refuse.
    const paid = merchWeeklyIncomeCents(world)
    expect(paid).toBeGreaterThan(0)
    expect(shopView(world).rows.find((r) => r.id === 'merch-brand')!.incomeCents).toBe(paid)
    // ⭐ THE ANCHOR: at exactly `famePivot` the curve is IDENTICAL to the old linear dial, by
    // construction, which is what keeps the day-one 6%-a-year reading the rung was sized against.
    // Read through the earnings rate rather than the till, so no purchase is needed to ask it.
    const atPivot = still('p5a-merch-pivot')
    const pivot = BIZ.merch.famePivot
    expect(fameAt(atPivot), 'the control fixture is genuinely at fame 0').toBe(0)
    // a hand-built signal set is the only way to hold fame at an exact value – the career cannot be
    // asked for one – and `brandWeeklyGrossCents` is the same function the till pays out of.
    expect(brandWeeklyGrossCents({ ...brandSignalsOf(atPivot), fame: pivot }))
      .toBe(Math.round(pivot * BIZ.merch.perFamePointCents))
    // ⭐⭐ AND IT IS CONVEX ABOVE THE PIVOT: double the fame, MORE than double the money. This is the
    // arm that fails on a flat multiplier, which is the fix §7e explicitly refused.
    const one = brandWeeklyGrossCents({ ...brandSignalsOf(atPivot), fame: pivot })
    const two = brandWeeklyGrossCents({ ...brandSignalsOf(atPivot), fame: pivot * 2 })
    expect(two).toBeGreaterThan(one * 2)
    expect(two).toBe(one * 4)
    // ...and rank is nowhere in it: a rank change moves nothing.
    world.kidRankWta = 5
    expect(merchWeeklyIncomeCents(world)).toBe(paid)
  })

  it('not owned – or owned by a family nobody has heard of – it pays zero, never a negative cent', () => {
    const world = still('p5a-merch-zero')
    expect(merchWeeklyIncomeCents(world)).toBe(0)
    world.fundsCents = 300_000_00
    buyAsset(world, 'merch-brand')
    expect(merchWeeklyIncomeCents(world), 'fame 0 sells nothing').toBe(0)
  })
})

// =================================================================================================
// 3 – THE ACADEMY THAT EARNS: EACH DELIVERED STAGE, TIMES REPUTATION
// =================================================================================================
describe('§3 the academy – «нам нужна академия, которая зарабатывает»', () => {
  function withStages(seed: string, stages: string[], seasons: number[] = []): WorldState {
    const world = still(seed)
    world.seasonHistory = seasons.map((endRank, i) => seasonAt(i, endRank))
    world.fundsCents = 15_000_000_00
    for (const id of stages) buyAsset(world, id)
    return world
  }

  it('⭐ reputation is the ledger\'s own fold: the owner\'s save reads exactly 1.75, base 1.0 with no seasons', () => {
    const world = still('p5a-rep')
    expect(academyReputationOf(world)).toBe(1)
    world.seasonHistory = OWNERS_SEASONS.map((r, i) => seasonAt(i, r))
    expect(academyReputationOf(world)).toBeCloseTo(1.75, 10)
    // a not-recorded season counts nothing – «not recorded» is not «top-100»
    world.seasonHistory.push(seasonAt(11, undefined))
    expect(academyReputationOf(world)).toBeCloseTo(1.75, 10)
  })

  it('⭐ ...and it is capped: a reign cannot push the multiplier past 4.0', () => {
    const world = still('p5a-rep-cap')
    world.seasonHistory = Array.from({ length: 12 }, (_, i) => seasonAt(i, 3))
    expect(academyReputationOf(world)).toBe(BIZ.academy.reputationCap)
  })

  it('⭐⭐ the land is a field and earns nothing; each built stage earns its own line, times reputation', () => {
    const land = withStages('p5a-land', ['academy-land'], OWNERS_SEASONS)
    expect(academyWeeklyIncomeCents(land)).toBe(0)
    const half = withStages('p5a-half', ['academy-land', 'academy-courts'], OWNERS_SEASONS)
    expect(academyWeeklyIncomeCents(half)).toBe(Math.round(BIZ.academy.stageIncomeCents['academy-courts'] * 1.75))
    const whole = withStages(
      'p5a-whole',
      ['academy-land', 'academy-courts', 'academy-building', 'academy-staff'],
      OWNERS_SEASONS,
    )
    const stages = ['academy-courts', 'academy-building', 'academy-staff']
    const expected = stages.reduce((s, id) => s + Math.round(BIZ.academy.stageIncomeCents[id] * 1.75), 0)
    expect(academyWeeklyIncomeCents(whole)).toBe(expected)
    // the card quotes the same arithmetic per stage, so the rows SUM to the ledger's line
    const rows = shopView(whole).rows.filter((r) => r.family === 'academy')
    expect(rows.reduce((s, r) => s + r.incomeCents, 0)).toBe(expected)
  })

  it('⚠ a stage still on order earns nothing – a contract is not a business', () => {
    const world = withStages('p5a-order', ['academy-land', 'academy-courts'], OWNERS_SEASONS)
    world.assets.find((a) => a.id === 'academy-courts')!.readyWeek = world.week + 52
    expect(academyWeeklyIncomeCents(world)).toBe(0)
    expect(assetWeeklyIncomeCents(world, 'academy-courts')).toBe(0)
  })

  it('the whole academy at the anchor: $12M pays back inside a reign only at a real reputation', () => {
    // the P7 bench criterion stated as arithmetic the test can hold still: at the cap the four
    // stages repay $12,000,000 in roughly 5–10 seasons; at reputation 1.0 they must NOT beat the
    // index fund's 7% – «assets never beat a career, they only survive one». Both read the
    // ECONOMY table itself, so a retune that breaks the design window reddens here by name.
    const baseCents = Object.values(BIZ.academy.stageIncomeCents).reduce((s, c) => s + c, 0)
    const yearAtCap = Math.round(baseCents * BIZ.academy.reputationCap) * WEEKS_PER_YEAR
    const paybackYearsAtCap = 12_000_000_00 / yearAtCap
    expect(paybackYearsAtCap).toBeGreaterThanOrEqual(5)
    expect(paybackYearsAtCap).toBeLessThanOrEqual(10)
    const yearAtOne = baseCents * WEEKS_PER_YEAR
    expect(yearAtOne / 12_000_000_00).toBeLessThan(0.07)
  })
})

// =================================================================================================
// 4 – THE TILL AND THE HOUSEHOLD: ONE ARITHMETIC, EVERY READER
// =================================================================================================
describe('§4 the ledger rows and the strip total – round 28 #8\'s law', () => {
  /** A real ticked career to 18 with the businesses bought – the till is a phase of `tickWeek`,
   *  so the rows have to come out of a lived week, not a hand call. */
  function grown(seed: string, buy: boolean): { world: WorldState; rng: () => number } {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = resumeMain(world.rngMain)
    while (ageOf(world) < 18) tickWeek(world, rng)
    world.trophiesByTier.wta1000.titles.push(world.week - 4)
    world.seasonHistory = OWNERS_SEASONS.map((r, i) => seasonAt(i, r))
    if (buy) {
      world.fundsCents = Math.max(world.fundsCents, 15_000_000_00)
      buyAsset(world, 'merch-brand')
      for (const id of ['academy-land', 'academy-courts', 'academy-building', 'academy-staff']) buyAsset(world, id)
    }
    return { world, rng }
  }

  it('⭐⭐ a lived week books one row per business under \'business\', for the functions\' own cents', () => {
    const { world, rng } = grown('p5a-till', true)
    expect(merchWeeklyIncomeCents(world)).toBeGreaterThan(0)
    expect(academyWeeklyIncomeCents(world)).toBeGreaterThan(0)
    tickWeek(world, rng)
    // ⚠ the tick advances the clock FIRST, so the lived week's rows carry the post-tick number –
    // and the two functions, asked at the same post-tick week, are the rows' own arithmetic.
    const merch = merchWeeklyIncomeCents(world)
    const academy = academyWeeklyIncomeCents(world)
    const rows = world.events.filter((e) => e.week === world.week && e.category === 'business')
    expect(rows).toHaveLength(2)
    expect(rows.find((r) => r.text.startsWith('Merch'))!.amountCents).toBe(merch)
    expect(rows.find((r) => r.text.startsWith('The academy'))!.amountCents).toBe(academy)
    expect(rows.every((r) => (r.amountCents ?? 0) > 0), 'income lines can never go negative').toBe(true)
    // ...and the persisted per-category ledger carries the same week under the same key
    const fw = world.financeWeeks.find((w) => w.week === world.week)
    expect(fw?.byCategory.business).toBe(merch + academy)
  })

  it('⭐⭐ the household strip TOTALS them: the IN figure moves by exactly the two lines, and names them', () => {
    const a = grown('p5a-house', false)
    const b = grown('p5a-house', true)
    const ha = householdWeekly(a.world, 0)
    const hb = householdWeekly(b.world, 0)
    const merch = merchWeeklyIncomeCents(b.world)
    const academy = academyWeeklyIncomeCents(b.world)
    expect(merch + academy).toBeGreaterThan(0)
    expect(hb.incomeCents - ha.incomeCents, 'round 28 #8: the strip must total every weekly line').toBe(
      merch + academy,
    )
    expect(hb.merchCents).toBe(merch)
    expect(hb.academyIncomeCents).toBe(academy)
    expect(ha.merchCents).toBe(0)
    expect(ha.academyIncomeCents).toBe(0)
  })

  it('a career with no businesses books no \'business\' row at all – no $0 noise', () => {
    const { world, rng } = grown('p5a-quiet', false)
    tickWeek(world, rng)
    expect(world.events.some((e) => e.category === 'business')).toBe(false)
  })
})

// =================================================================================================
// 5 – RNG: THE PERMANENT LAW, RESTATED FOR THE BUSINESSES
// =================================================================================================
describe('§5 input-independence – buying the businesses never touches MAIN', () => {
  it('⭐⭐ a career that buys merch and the whole academy taps the identical MAIN sequence', () => {
    const build = () => {
      const world = createWorld('p5a-rng', { ...DEFAULT_PROFILE, coachTier: 'self' })
      const rng = resumeMain(world.rngMain)
      while (ageOf(world) < 18) tickWeek(world, rng)
      world.trophiesByTier.wta1000.titles.push(world.week - 4)
      world.seasonHistory = OWNERS_SEASONS.map((r, i) => seasonAt(i, r))
      return { world, rng }
    }
    const a = build()
    const b = build()
    b.world.fundsCents = Math.max(b.world.fundsCents, 15_000_000_00)
    buyAsset(b.world, 'merch-brand')
    for (const id of ['academy-land', 'academy-courts', 'academy-building', 'academy-staff']) buyAsset(b.world, id)
    for (let i = 0; i < 20; i++) {
      tickWeek(a.world, a.rng)
      tickWeek(b.world, b.rng)
    }
    expect(b.world.events.some((e) => e.category === 'business'), 'the B arm really earned').toBe(true)
    expect(b.world.rngMain).toEqual(a.world.rngMain)
  })
})
