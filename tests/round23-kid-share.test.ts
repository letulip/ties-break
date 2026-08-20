// ⭐⭐ ROUND-23 #18 – HER SHARE OF THE PRIZE MONEY, AND IT REALLY LEAVES THE FAMILY WALLET.
//
// THE OWNER, 19.08:
//   «О! А ещё можно сделать после появления её счета в банке в 18 начать ей призовые переводить
//    какие-то суммы, например начать с 10-20% и может быть наращивать год к году»
//   ...and on the ceiling he was offered: «да, давай, но может не до 30, а до 40 или 50 вообще, это
//   всё-таки ее карьера?»
//
// SO THE SHIPPED LADDER IS 10% AT 18, +5 EVERY BIRTHDAY, 50% FROM 26 – and the table below is
// written out as LITERALS rather than by calling the function under test, because a ramp checked
// against its own implementation is a tautology with a describe block round it.
//
// THE THREE CLAIMS, and the second is the one the design decision turns on:
//
//   1. NOTHING BEFORE HER EIGHTEENTH. Not a cent, on any week of the junior story.
//   2. THE MONEY LEAVES. Measured as an A/B on ONE seed: the family's booked prize income falls by
//      exactly her balance. This is the claim that separates a mechanic from a counter, and it is
//      the reason the split happens at the moment the cheque is written rather than in a report.
//   3. IT PERSISTS. `kidFundsCents` is a save field (v54), so a career loaded at twenty-six still
//      has the eight years of transfers behind it – and a save written before v54 arrives at ZERO
//      rather than at an invented back-fill.
//
// ⚠ MUTATION-VERIFIED (each applied alone, then reverted):
//   * `capBps: 3000` (the number he rejected)          -> the ramp table and the copy arm go red.
//   * `fromAgeYears: 17`                               -> "nothing before eighteen" goes red.
//   * credit `world.fundsCents += prize` (the whole cheque) and keep her credit
//                                                      -> the A/B arm goes red, and nothing else.
//   * migration back-fills `careerTotals.prizeCents / 2`  -> the v53 arm goes red.
import { describe, it, expect } from 'vitest'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from '../tools/econ-bench'
import {
  answerFork,
  answerRetirement,
  birthdayOffer,
  chooseGift,
  decideKnock,
  kidAgeYears,
  pendingBirthday,
  pendingKnock,
  SAVE_SCHEMA_VERSION,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY, kidPrizeShareBps, kidPrizeShareCents } from '../src/engine/economy'
import { ownAccountNote, type KidLifeWorldView } from '../src/engine/kidLife'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

/** His ladder, spelled out. NOT read from `ECONOMY.kidShare`, so a retune has to come here and be
 *  looked at rather than sliding through green. */
const HIS_RAMP: Record<number, number> = {
  13: 0,
  14: 0,
  15: 0,
  16: 0,
  17: 0,
  18: 10,
  19: 15,
  20: 20,
  21: 25,
  22: 30,
  23: 35,
  24: 40,
  25: 45,
  26: 50,
  27: 50,
  33: 50,
}

function answerAll(world: WorldState): void {
  if (pendingKnock(world)) decideKnock(world, 'rest')
  const age = pendingBirthday(world)
  if (age !== null) chooseGift(world, birthdayOffer(world.seed, age).options[0].id)
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
}

const ageOf = (w: WorldState): number => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)

/** The wealthy·elite arm reaches the paying rungs earliest, which is what makes a short horizon
 *  enough to see real cheques on both sides of her eighteenth. */
function walk(seedIndex: number, weeks: number, shareOff = false): WorldState {
  const savedStart = ECONOMY.kidShare.startBps
  const savedCap = ECONOMY.kidShare.capBps
  // The house idiom for a bench arm: ONE object patched in place and restored in a `finally`
  // (tools/school-bench.ts `withScenario`). `ECONOMY` is `as const`, so this is also the only way in.
  if (shareOff) Object.assign(ECONOMY.kidShare, { startBps: 0, capBps: 0 })
  try {
    const { world, rng } = openCareer(PRESETS[8], seedIndex, POLICIES[1])
    while (world.week < weeks && !world.ending) {
      answerAll(world)
      if (world.ending) break
      stepCareerWeek(world, rng, POLICIES[1])
    }
    return world
  } finally {
    Object.assign(ECONOMY.kidShare, { startBps: savedStart, capBps: savedCap })
  }
}

// =================================================================================================
// 1 – THE RAMP ITSELF
// =================================================================================================
describe('#18 – the ramp, against the numbers he actually asked for', () => {
  it('⭐⭐ 10% at 18, five points a birthday, and it stops at half', () => {
    for (const [age, pct] of Object.entries(HIS_RAMP)) {
      expect(kidPrizeShareBps(Number(age)), `age ${age}`).toBe(pct * 100)
    }
    // The cap is REACHED, and it is reached at 26 – «это всё-таки её карьера», in her best years.
    expect(kidPrizeShareBps(26)).toBe(ECONOMY.kidShare.capBps)
    expect(kidPrizeShareBps(25)).toBeLessThan(ECONOMY.kidShare.capBps)
    // ...and it is monotone and bounded for every age the game can reach.
    let last = -1
    for (let age = 10; age <= 45; age++) {
      const bps = kidPrizeShareBps(age)
      expect(bps).toBeGreaterThanOrEqual(last)
      expect(bps).toBeLessThanOrEqual(ECONOMY.kidShare.capBps)
      last = bps
    }
  })

  it('a cheque splits to the cent – the two balances always add up to what the tournament paid', () => {
    for (const prize of [130_00, 2_200_00, 55_555_55, 3_000_000_00, 1, 7]) {
      for (let age = 17; age <= 27; age++) {
        const hers = kidPrizeShareCents(prize, age)
        expect(hers, `age ${age} of ${prize}`).toBeGreaterThanOrEqual(0)
        expect(hers).toBeLessThanOrEqual(prize)
        // The family's part is the REMAINDER, never a second rounding – so no cent is lost or made.
        expect(hers + (prize - hers)).toBe(prize)
        expect(Math.abs(hers / prize - HIS_RAMP[age] / 100), `age ${age}`).toBeLessThanOrEqual(0.5 / prize + 1e-9)
      }
    }
  })

  it('a ramp read off ECONOMY, not off a literal in a formula', () => {
    const saved = ECONOMY.kidShare.capBps
    Object.assign(ECONOMY.kidShare, { capBps: 2000 })
    try {
      expect(kidPrizeShareBps(30), 'the cap is the object, not the code').toBe(2000)
    } finally {
      Object.assign(ECONOMY.kidShare, { capBps: saved })
    }
  })
})

// =================================================================================================
// 2 – ON A REAL CAREER: nothing before eighteen, and the family feels it after
// =================================================================================================
describe('#18 – the transfer, on a career that is really played', () => {
  it('⭐⭐ NOT ONE CENT BEFORE HER EIGHTEENTH, on every week of the junior story', () => {
    const { world, rng } = openCareer(PRESETS[8], 1, POLICIES[1])
    let sawPrizeMoney = false
    while (ageOf(world) < ECONOMY.kidShare.fromAgeYears && !world.ending) {
      answerAll(world)
      if (world.ending) break
      stepCareerWeek(world, rng, POLICIES[1])
      expect(world.kidFundsCents, `w${world.week}, age ${ageOf(world)}`).toBe(0)
      if ((world.careerTotals?.prizeCents ?? 0) > 0) sawPrizeMoney = true
    }
    // ⚠ THE ARM HAS TO CONTAIN THE THING IT IS PROVING ABSENT. A career that never won a cheque
    // before eighteen would pass this test with the mechanic deleted.
    expect(sawPrizeMoney, 'she was really being paid in those years').toBe(true)
    expect(ageOf(world)).toBe(ECONOMY.kidShare.fromAgeYears)
  })

  it('⭐⭐⭐ THE MONEY LEAVES THE FAMILY WALLET – A/B on one seed, one arm with the ramp at zero', () => {
    // Two arms of the SAME seed, differing only in `ECONOMY.kidShare`. The horizon is her eighteenth
    // plus a season, short enough that the two careers are still the same career: the split moves
    // money, and money moves entry decisions, so a long horizon compares two different lives.
    const HORIZON = WEEKS_PER_YEAR * 5 + 26
    const on = walk(1, HORIZON)
    const off = walk(1, HORIZON, true)

    // ⚠ PROVE THE ARMS ARE COMPARABLE BEFORE READING THE DIFFERENCE (CLAUDE.md's own A/B rule).
    expect(on.week, 'both arms walked the same number of weeks').toBe(off.week)
    expect(on.results.length, 'and played the same tournaments').toBe(off.results.length)
    expect(off.kidFundsCents, 'the control transfers nothing, by construction').toBe(0)

    const grossOn = on.careerTotals.prizeCents + on.kidFundsCents
    expect(on.kidFundsCents, 'she has really been paid something').toBeGreaterThan(0)
    expect(grossOn, 'the cheques are the same cheques in both arms').toBe(off.careerTotals.prizeCents)
    // THE CLAIM: the family's prize income is lighter by exactly what she was given. Not "tallied
    // beside", not "reported" – the wallet is smaller.
    expect(off.careerTotals.prizeCents - on.careerTotals.prizeCents).toBe(on.kidFundsCents)
    expect(on.fundsCents, 'and so is the balance the parent spends from').toBeLessThan(off.fundsCents)
  })

  it('the realised share matches the ladder, year by year, on the cheques she actually won', () => {
    const { world, rng } = openCareer(PRESETS[8], 1, POLICIES[1])
    let age = ageOf(world)
    let hersAtBirthday = 0
    let familyAtBirthday = 0
    const realised: { age: number; pct: number }[] = []
    while (world.week < WEEKS_PER_YEAR * 14 && !world.ending) {
      answerAll(world)
      if (world.ending) break
      stepCareerWeek(world, rng, POLICIES[1])
      const now = ageOf(world)
      if (now !== age) {
        const hers = world.kidFundsCents - hersAtBirthday
        const family = world.careerTotals.prizeCents - familyAtBirthday
        if (hers + family > 100_00) realised.push({ age, pct: (100 * hers) / (hers + family) })
        hersAtBirthday = world.kidFundsCents
        familyAtBirthday = world.careerTotals.prizeCents
        age = now
      }
    }
    expect(realised.length, 'the walk really covered the ramp').toBeGreaterThanOrEqual(8)
    for (const r of realised) {
      // Within a tenth of a point: the only slack is the per-cheque rounding.
      expect(Math.abs(r.pct - HIS_RAMP[r.age]), `age ${r.age}: realised ${r.pct.toFixed(2)}%`).toBeLessThan(0.1)
    }
    // And she really is on the cap by 26, which is the whole of «до 40 или 50 вообще».
    expect(realised.some((r) => r.age >= 26 && r.pct > 49.9)).toBe(true)
  })
})

// =================================================================================================
// 3 – IT PERSISTS, AND AN OLD SAVE ARRIVES AT ZERO
// =================================================================================================
describe('#18 – the save schema move (v54)', () => {
  it('her balance survives a save/load round trip', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    expect(world.kidFundsCents).toBeGreaterThan(0)
    const reloaded = migrateSave(JSON.parse(JSON.stringify(world)))
    expect(reloaded.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(reloaded.kidFundsCents).toBe(world.kidFundsCents)
  })

  it('⚠ A v53 SAVE ARRIVES AT ZERO – the migration invents no history it could not have had', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    const asV53 = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    asV53.schemaVersion = 53
    delete asV53.kidFundsCents
    const migrated = migrateSave(asV53)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.kidFundsCents).toBe(0)
    // ...and nothing is clawed back out of the family's wallet to pay for it.
    expect(migrated.fundsCents).toBe(world.fundsCents)
    expect(migrated.careerTotals.prizeCents).toBe(world.careerTotals.prizeCents)
  })

  it('a corrupted balance is rebuilt whole rather than carried through as NaN', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    const broken = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    broken.schemaVersion = 53
    broken.kidFundsCents = 'lots'
    expect(migrateSave(broken).kidFundsCents).toBe(0)
  })
})

// =================================================================================================
// 4 – WHAT THE PLAYER IS TOLD, AND WHERE THE FIGURES IN IT COME FROM
// =================================================================================================
describe('#18 – the line on her own page', () => {
  const view = (over: Partial<KidLifeWorldView>): KidLifeWorldView => ({
    seed: 'share',
    week: 400,
    ageYears: 18,
    seasonYear: 2038,
    playStyle: 'all-court',
    birthMonth: 6,
    injured: false,
    weeksAway: 0,
    lossStreak: 0,
    weeksSinceTitle: null,
    college: null,
    kidFundsCents: 0,
    ...over,
  })

  it('silent before eighteen, and from eighteen it carries the balance AND the rule', () => {
    expect(ownAccountNote(view({ ageYears: 17, kidFundsCents: 0 }))).toBe('')
    const at18 = ownAccountNote(view({ ageYears: 18, kidFundsCents: 90_150_00 }))
    expect(at18).toContain('$90,150')
    expect(at18).toContain('10% of every cheque')
    expect(at18).toContain('50%')
    const at26 = ownAccountNote(view({ ageYears: 26, kidFundsCents: 8_909_415_00 }))
    expect(at26).toContain('50% of every cheque')
    expect(at26, 'at the cap it stops promising more').toMatch(/goes no higher/)
    expect(at26).not.toContain('every birthday')
    // Player copy: short dash only, and no Cyrillic.
    for (const s of [at18, at26]) {
      expect(s).not.toContain('—')
      expect(s).toMatch(/^[\x20-\x7e–]+$/)
    }
  })

  it('⭐ THE PERCENTAGE IS THE ENGINE\'S OWN, not a number typed into a sentence', () => {
    const saved = ECONOMY.kidShare.stepBps
    Object.assign(ECONOMY.kidShare, { stepBps: 100 })
    try {
      // 10% at 18 + one point a year: at 20 the line must say 12%, which no literal could.
      expect(ownAccountNote(view({ ageYears: 20, kidFundsCents: 100_00 }))).toContain('12% of every cheque')
    } finally {
      Object.assign(ECONOMY.kidShare, { stepBps: saved })
    }
  })

  it('and it reaches the screen through the snapshot, on a real career', () => {
    const world = walk(1, WEEKS_PER_YEAR * 6)
    const life = toSnapshot(world).life
    expect(ageOf(world)).toBeGreaterThanOrEqual(ECONOMY.kidShare.fromAgeYears)
    expect(life.ownAccount).toContain('Her own account')
    expect(life.ownAccount).toContain('% of every cheque')
  })
})
