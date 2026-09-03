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
  assetKidShareCents,
  assetWeeklyIncomeCents,
  brandSignalsOf,
  brandWeeklyGrossCents,
  buyAsset,
  createWorld,
  fameAt,
  fameFloorOf,
  fameShootMultOf,
  kidAgeYears,
  merchFamilyWeeklyIncomeCents,
  merchWeeklyIncomeCents,
  shopView,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { householdWeekly } from '../src/engine/world/coachMarket'
import { ECONOMY, kidPrizeShareBps } from '../src/engine/economy'
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
 *  inside #100, one inside #50, one inside #25, reputation 1.75 (the ledger's own worked example).
 *  ⚠ ROUND 34 #17 (03.09) ADDED A top-150 AND A top-250 RUNG, so the same eleven seasons now read
 *  1.925: #106, #106 and #155 were below every rung there was and are not any more. The rows are
 *  unchanged – only what the ladder can see about them. */
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

  it('⭐ a LOST Slam final counts its own step – and every other lost final counts a SHARE of its tier', () => {
    // ⚠⚠ RE-AIMED BY ROUND 34 #17 (03.09) AND HALF OF IT IS REVERSED. This arm read «and only the
    // Slam one does»: a lost final below a Slam bought exactly nothing, which is why the owner's own
    // week-569 save carried SIXTEEN dated runner-up plates worth zero. He approved 40% of the tier's
    // own title step, so the second half of this arm now asserts the opposite of what it did – and
    // the FIRST half is unchanged, because the one thing that must not happen is a Slam final being
    // paid twice.
    const world = still('p5a-final')
    world.trophiesByTier.slam.finals.push(world.week)
    expect(fameAt(world), 'the Slam plate keeps its own constant, NOT the share').toBeCloseTo(FAME.slamFinalFloor, 5)
    world.trophiesByTier.wta1000.finals.push(world.week)
    expect(fameAt(world), 'a WTA 1000 final is worth 40% of a WTA 1000 title')
      .toBeCloseTo(FAME.slamFinalFloor + FAME.titleFloor.wta1000! * FAME.finalFloorShare, 5)
    // ⚠⚠ THE ANTI-DOUBLE-COUNT ARM, AND IT IS THE ONE THAT FAILS IF 'slam' EVER FALLS THROUGH INTO
    // THE SHARE RULE. A second Slam final adds `slamFinalFloor` and NOT `slamFinalFloor + 0.4 x 25`.
    const before = fameAt(world)
    world.trophiesByTier.slam.finals.push(world.week)
    expect(fameAt(world), 'a Slam final is paid once, by `slamFinalFloor`, and never also by the share')
      .toBeCloseTo(before + FAME.slamFinalFloor, 5)
    // ...and a final at a tier the world does not read still buys nothing – the junior rungs are not
    // in `titleFloor`, so the share cannot reach them either.
    world.trophiesByTier.j300.finals.push(world.week)
    expect(fameAt(world), 'the world does not read junior draws, finals included')
      .toBeCloseTo(before + FAME.slamFinalFloor, 5)
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

  it('⭐⭐⭐ shoots MULTIPLY the floor – and since round 32 #5 they ADD to it as well', () => {
    // ⚠⚠ A SHIPPED CLAIM MOVED HERE AND IT IS NAMED RATHER THAN LEFT TO ROT. This arm used to assert
    // `fameAt === floorOnly x mult` – shoots reach fame through the MULTIPLIER and through nothing
    // else. Round 32 #5 overturns that half on the owner's own instruction («на раннем этапе
    // коллаборации нам должны помочь»): a delivered shoot is a public event in its own right and now
    // ADDS to the floor as well, scaled by the deal's band. The multiplier is untouched and is still
    // asserted; what is gone is the claim that it is the ONLY road.
    // ⚠ AND THE OTHER HALF OF THE ORIGINAL CLAIM SURVIVES INTACT, which is why it is still the
    // headline: a face with no results still has nothing to multiply. See below.
    const a = still('p5a-shoots')
    a.trophiesByTier.wta500.titles.push(a.week)
    const floorOnly = fameFloorOf(a, a.week)
    plantShoots(a, [a.week - 4, a.week - 8, a.week - 12])
    const mult = fameShootMultOf(a, a.week)
    expect(mult, 'the photographs still multiply').toBeGreaterThan(1)
    const floorWithShoots = fameFloorOf(a, a.week)
    expect(floorWithShoots, '...and since round 32 #5 they add to the floor too').toBeGreaterThan(floorOnly)
    // the identity still holds against the floor AS IT NOW READS – fame is the floor times the
    // multiplier and always was; what changed is what goes into the floor.
    expect(fameAt(a)).toBeCloseTo(floorWithShoots * mult, 5)
    // ⚠⚠ AND THE CENSUS'S COUNTER-FACE MOVED TOO, WHICH IS THE HONEST HALF OF #5 AND IS STATED HERE
    // RATHER THAN QUIETLY DROPPED. «Zero floor times any number of photographs is zero» was true
    // while the shoots only multiplied. An ADD makes fame out of a photograph by design – that is
    // what «a source of fame in its own right, on the same ledger as a title» means. So a career with
    // NO tennis and hand-planted shoots now reads a small fame, and this arm says so.
    const b = still('p5a-shoots-bare')
    expect(fameAt(b), 'nothing at all before the letters').toBe(0)
    plantShoots(b, [b.week - 4, b.week - 8, b.week - 12])
    expect(fameAt(b), 'three delivered campaigns are three public events').toBeGreaterThan(0)
    // ⭐ ...AND IT IS STILL A ROUNDING ERROR NEXT TO WHAT THE COURT PAYS, which is the part of the
    // original claim that survives and the part that matters: the same three shoots on top of one
    // World Tour 500 title are worth many times more, because the floor they add to is the thing the
    // multiplier then works on.
    expect(fameAt(a)).toBeGreaterThan(fameAt(b) * 10)
    // ⚠ AND WHAT KEEPS IT OUT OF A REAL CAREER IS UPSTREAM, not here: `adBandFor` refuses a standing
    // that is not WTA-ranked, so the post never writes a letter to a career with no professional
    // result and there is no shoot to plant. The gate is the offers system's; this fixture plants the
    // letters by hand precisely because the engine would not.
    expect(fameFloorOf(still('p5a-shoots-none'), 0), 'no results, no letters, no floor').toBe(0)
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
    // ⚠⚠ RE-AIMED AT ROUND 35 #9, NEVER LOOSENED, AND THE CLAIM IS WORD FOR WORD THE ONE IN THIS
    // ARM'S OWN TITLE: «the shop card quotes the till's OWN figure». What the till banks changed –
    // her ramp now comes off the brand's week before the family sees it – so the card follows it,
    // because a card quoting the gross while the ledger books less is precisely the disagreement
    // this assertion was written to refuse. The equality is still an equality between the card and
    // the till; only the function on the right-hand side moved with the money.
    const banked = merchFamilyWeeklyIncomeCents(world)
    expect(shopView(world).rows.find((r) => r.id === 'merch-brand')!.incomeCents).toBe(banked)
    // ⚠ AND THE GROSS IS STILL THE GROSS. `paid` is what the WHOLE brand takes in and is the figure
    // `brandGrossWorthCents` multiplies; the two must not have collapsed into one number, which is
    // exactly what a split placed in the rate would have done.
    expect(banked, 'her cut really came off').toBeLessThan(paid)
    expect(banked + assetKidShareCents(world, 'merch-brand'), 'and the halves re-add').toBe(paid)
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

  it('⭐ reputation is the ledger\'s own fold: the owner\'s save reads exactly 1.925, base 1.0 with no seasons', () => {
    // ⚠ ROUND 34 #17 MOVED THIS NUMBER, 1.75 -> 1.925, and the two new rungs are exactly why: three
    // of his eleven seasons (#106, #155, #106) were below the lowest rung the ladder had.
    const world = still('p5a-rep')
    expect(academyReputationOf(world)).toBe(1)
    world.seasonHistory = OWNERS_SEASONS.map((r, i) => seasonAt(i, r))
    expect(academyReputationOf(world)).toBeCloseTo(1.925, 10)
    // a not-recorded season counts nothing – «not recorded» is not «top-100»
    world.seasonHistory.push(seasonAt(11, undefined))
    expect(academyReputationOf(world)).toBeCloseTo(1.925, 10)
  })

  it('⭐ ...and it is still capped – but round 34 made the cap the CAREER`s and it now binds very late', () => {
    // ⚠⚠ RE-AIMED BY ROUND 34 #17 (03.09), AND THE MEASUREMENT IS THE POINT OF THE RE-AIM. The cap
    // was a flat 4.0 for ever; the owner approved `4 + 0.5 per professional season played`. The
    // bands add at most 0.6 a season, so the ceiling only overtakes the ladder past THIRTY seasons –
    // twelve top-3 seasons, which used to sit ON the cap, now read 8.2 and never touch it.
    const world = still('p5a-rep-cap')
    world.seasonHistory = Array.from({ length: 12 }, (_, i) => seasonAt(i, 3))
    const capAt = (n: number): number => BIZ.academy.reputationCapBase + BIZ.academy.reputationCapPerSeason * n
    expect(academyReputationOf(world), 'twelve top-10 seasons no longer reach the ceiling').toBeCloseTo(8.2, 10)
    expect(academyReputationOf(world)).toBeLessThan(capAt(12))
    // ...and the cap is STILL a cap: a career long enough for the ladder to overtake it is held.
    const long = still('p5a-rep-cap-long')
    long.seasonHistory = Array.from({ length: 40 }, (_, i) => seasonAt(i, 3))
    expect(academyReputationOf(long), 'forty top-10 seasons are held at the career`s own ceiling').toBe(capAt(40))
    expect(1 + 40 * BIZ.academy.reputationBands[0].add, 'and the ladder really did want to go higher')
      .toBeGreaterThan(capAt(40))
    // ⚠ AND A SHORT CAREER IS HELD SHORT, which is the half of his ruling the growth is for: «so a
    // long professional career is worth something and a short one is not». The ceiling a two-season
    // career may ever reach is 5.0 against a forty-season career's 24.0.
    expect(capAt(2)).toBe(5)
    expect(capAt(2)).toBeLessThan(capAt(40))
    // ⚠⚠ AND THE MEASUREMENT THIS ARM EXISTS TO RECORD: at 4 + 0.5 the ceiling stops binding for
    // every career the engine can produce. `1 + 0.6n > 4 + 0.5n` needs n > 30, so nothing below
    // thirty professional seasons is held by it at all – the band ladder is what holds reputation
    // now. Reported to the owner in docs/rounds/round-34.md rather than adjusted here.
    const bindsFrom = (() => {
      for (let n = 1; n <= 60; n++) if (1 + n * BIZ.academy.reputationBands[0].add > capAt(n)) return n
      return null
    })()
    expect(bindsFrom, 'the cap first binds past thirty professional seasons').toBe(31)
  })

  it('⭐⭐ the land is a field and earns nothing; each built stage earns its own line, times reputation', () => {
    // ⚠ 1.75 -> 1.925 BY ROUND 34 #17: the ladder gained a top-150 and a top-250 rung and his eleven
    // seasons read higher on it. Nothing about the per-stage arithmetic moved.
    const REP = 1.925
    const land = withStages('p5a-land', ['academy-land'], OWNERS_SEASONS)
    expect(academyWeeklyIncomeCents(land)).toBe(0)
    const half = withStages('p5a-half', ['academy-land', 'academy-courts'], OWNERS_SEASONS)
    expect(academyWeeklyIncomeCents(half)).toBe(Math.round(BIZ.academy.stageIncomeCents['academy-courts'] * REP))
    const whole = withStages(
      'p5a-whole',
      ['academy-land', 'academy-courts', 'academy-building', 'academy-staff'],
      OWNERS_SEASONS,
    )
    const stages = ['academy-courts', 'academy-building', 'academy-staff']
    const expected = stages.reduce((s, id) => s + Math.round(BIZ.academy.stageIncomeCents[id] * REP), 0)
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
    // the P7 bench criterion stated as arithmetic the test can hold still: at reputation 4.0 the four
    // stages repay $12,000,000 in roughly 5–10 seasons; at reputation 1.0 they must NOT beat the
    // index fund's 7% – «assets never beat a career, they only survive one». Both read the
    // ECONOMY table itself, so a retune that breaks the design window reddens here by name.
    //
    // ⚠⚠ RE-AIMED BY ROUND 34 #17 (03.09) FROM «AT THE CAP» TO «AT 4.0», WHICH IS THE SAME NUMBER
    // THE WINDOW WAS SIZED ON. The cap is no longer one number – it is `4 + 0.5 x professional
    // seasons` – so «the cap» cannot name a reputation without naming a career too. 4.0 is the flat
    // cap the P7 bench measured against and is now `reputationCapBase`, read from the catalogue.
    const baseCents = Object.values(BIZ.academy.stageIncomeCents).reduce((s, c) => s + c, 0)
    const yearAtCap = Math.round(baseCents * BIZ.academy.reputationCapBase) * WEEKS_PER_YEAR
    const paybackYearsAtCap = 12_000_000_00 / yearAtCap
    expect(paybackYearsAtCap).toBeGreaterThanOrEqual(5)
    expect(paybackYearsAtCap).toBeLessThanOrEqual(10)
    const yearAtOne = baseCents * WEEKS_PER_YEAR
    expect(yearAtOne / 12_000_000_00).toBeLessThan(0.07)
    // ⚠⚠ AND THE NEW CEILING IS RECORDED RATHER THAN LEFT UNSAID – it is the one thing the career
    // cap changed that the P7 window did not ask for, and it is in docs/rounds/round-34.md for the
    // owner's eye. The window holds for reputations 3.18–6.37; a long elite career can now stand
    // above it, and this arm names the reputation at which it stops holding rather than pretending
    // it cannot be reached.
    const windowTop = 12_000_000_00 / (baseCents * WEEKS_PER_YEAR * 5)
    expect(windowTop, 'above this reputation the academy repays in under five seasons').toBeCloseTo(6.366, 3)
    const nineTop10 = 1 + 9 * BIZ.academy.reputationBands[0].add
    expect(nineTop10, 'nine top-10 seasons already stand above it').toBeGreaterThan(windowTop)
    expect(nineTop10, '...and the career cap does not hold them back from it')
      .toBeLessThan(BIZ.academy.reputationCapBase + BIZ.academy.reputationCapPerSeason * 9)
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
    //
    // ⚠⚠ RE-AIMED AT ROUND 35 #9, NEVER LOOSENED, AND THE CLAIM IS THE SAME CLAIM: one row per
    // business, carrying THE FUNCTION'S OWN CENTS. What moved is WHICH function the merch row
    // answers to – «в недельном доходе будет семье на руки сумма меньше», so the row is what the
    // FAMILY banked and `merchFamilyWeeklyIncomeCents` is the arithmetic that says so. The academy
    // row is untouched in both figure and function, which is the other half of the ruling.
    const merch = merchFamilyWeeklyIncomeCents(world)
    const academy = academyWeeklyIncomeCents(world)
    const rows = world.events.filter((e) => e.week === world.week && e.category === 'business')
    expect(rows).toHaveLength(2)
    expect(rows.find((r) => r.text.startsWith('Merch'))!.amountCents).toBe(merch)
    expect(rows.find((r) => r.text.startsWith('The academy'))!.amountCents).toBe(academy)
    expect(rows.every((r) => (r.amountCents ?? 0) > 0), 'income lines can never go negative').toBe(true)
    // ⚠ AND THE ACADEMY IS STILL WHOLE – the negative that keeps the split off the parent's own
    // business. If `assetKidShareCents` ever stopped guarding on the family this line goes red.
    expect(academy).toBe(assetWeeklyIncomeCents(world, 'academy-land') + assetWeeklyIncomeCents(world, 'academy-courts') + assetWeeklyIncomeCents(world, 'academy-building') + assetWeeklyIncomeCents(world, 'academy-staff'))
    // ...and the persisted per-category ledger carries the same week under the same key
    const fw = world.financeWeeks.find((w) => w.week === world.week)
    expect(fw?.byCategory.business).toBe(merch + academy)
  })

  // ⭐⭐⭐ ROUND 35 #9 – THE TWO HALVES RE-ADD TO THE CHEQUE, ON A LIVED WEEK.
  //
  // THE OWNER: «доход от ее бренда давай тоже как проценты с призовых будем делить».
  //
  // ⚠⚠ THIS IS THE ARM THE ITEM ASKS FOR BY NAME, and it is about ROUNDING and not about the rate:
  // `finalizeTournament`'s discipline is that her share is rounded ONCE and the family takes the
  // REMAINDER, so the two balances add up to the gross to the cent. A pair of independent
  // `Math.round`s loses or invents a cent on half the weeks, and a player can put these two numbers
  // side by side on screen. Walked over many weeks rather than asserted once, because a penny bug
  // shows up on some cheques and not others.
  it('⭐⭐⭐ #9 – her cut and the family\'s re-add to the brand\'s gross, every week, to the cent', () => {
    const { world, rng } = grown('p5a-split', true)
    let weeksWithBrandMoney = 0
    let herTotal = 0
    for (let i = 0; i < 60; i++) {
      const before = world.kidFundsCents ?? 0
      const gross = merchWeeklyIncomeCents(world)
      tickWeek(world, rng)
      if (gross <= 0) continue
      // The row the till actually wrote, and the cents that actually reached her account this week.
      const row = world.events.find(
        (e) => e.week === world.week && e.category === 'business' && e.text.startsWith('Merch'),
      )
      if (!row) continue
      weeksWithBrandMoney++
      const paidGross = merchWeeklyIncomeCents(world)
      const hers = (world.kidFundsCents ?? 0) - before
      herTotal += hers
      expect(row.amountCents! + hers, `w${world.week}: the two halves ARE the cheque`).toBe(paidGross)
      // ⚠ HER SHARE IS THE RAMP'S OWN, ROUNDED ONCE – never re-derived by dividing the cents back
      // out, which is the arithmetic `accrueKidShare`'s header forbids.
      expect(hers, `w${world.week}: one rounding, at her age`).toBe(
        Math.round((paidGross * kidPrizeShareBps(ageOf(world))) / 10_000),
      )
      // ⚠ AND THE FAMILY IS NEVER PUSHED THROUGH ZERO BY THIS – «мы ни за что не наказываем». It is
      // an income line and can only ever add LESS.
      expect(row.amountCents!, `w${world.week}: still income`).toBeGreaterThanOrEqual(0)
    }
    expect(weeksWithBrandMoney, 'the walk really exercised the split').toBeGreaterThan(10)
    expect(herTotal, 'and she was really paid something out of it').toBeGreaterThan(0)
  })

  // ⭐⭐ ROUND 35 #9 – THE MEMO BESIDE THE MONEY, TAGGED `brand` AND NOT `prize`.
  //
  // ⚠ ROUND 31 #2 IS THE REASON AND IT IS A STANDING RULING: the week recap prints ONE line and
  // picks the `prize` part by name, after he refused a second weekly row about money he had not
  // asked to see weekly. If the brand ever started arriving as a `prize` part, the recap's «Her cut
  // N%» line would silently grow by the brand's cents under a label that says prize.
  it('⭐⭐ #9 – the brand books its OWN kidShare part, and never lands in the prize one', () => {
    const { world, rng } = grown('p5a-part', true)
    let checked = 0
    for (let i = 0; i < 40 && checked === 0; i++) {
      tickWeek(world, rng)
      const fw = world.financeWeeks.find((w) => w.week === world.week)
      const brand = fw?.kidShare?.brand
      if (!brand) continue
      checked++
      expect(brand.cents, 'her cents, under the brand rule').toBeGreaterThan(0)
      expect(brand.bps, 'at her ramp – the SAME rate a prize splits at').toBe(kidPrizeShareBps(ageOf(world)))
      expect(brand.baseCents, 'and the gross it is a share of').toBe(merchWeeklyIncomeCents(world))
      // ⚠ THE NEGATIVE: this week paid no prize, so the prize part must be absent entirely. A brand
      // week that wrote a prize part would be exactly the mislabelling round 31 #2 forbids.
      const row = world.events.find(
        (e) => e.week === world.week && e.category === 'prize' && (e.amountCents ?? 0) > 0,
      )
      if (!row) expect(fw?.kidShare?.prize, 'no prize this week, so no prize part').toBeUndefined()
    }
    expect(checked, 'the walk really reached a week the brand paid her').toBe(1)
  })

  it('⭐⭐ the household strip TOTALS them: the IN figure moves by exactly the two lines, and names them', () => {
    const a = grown('p5a-house', false)
    const b = grown('p5a-house', true)
    const ha = householdWeekly(a.world, 0)
    const hb = householdWeekly(b.world, 0)
    // ⚠⚠ RE-AIMED AT ROUND 35 #9, NEVER LOOSENED. Round 28 #8's law is unchanged – the strip must
    // total every weekly line – and what changed is what the merch LINE is: the family's half, not
    // the brand's gross. The precedent is three blocks up in `familyWeeklyIncomeCents` itself, where
    // the retainer has been netted since round 29 P3 on the rule «the meter must read what the till
    // actually banks». A strip quoting the gross while the ledger books less is round 21 #12's
    // defect in mirror, which is the whole reason this arm exists.
    const merch = merchFamilyWeeklyIncomeCents(b.world)
    const academy = academyWeeklyIncomeCents(b.world)
    expect(merch + academy).toBeGreaterThan(0)
    expect(merch, 'and it really is the SMALLER figure – her cut has come off').toBeLessThan(
      merchWeeklyIncomeCents(b.world),
    )
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
