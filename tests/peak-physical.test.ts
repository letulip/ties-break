import { describe, it, expect } from 'vitest'
import { createWorld, kidAgeExact } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import {
  declineFactor,
  growWeek,
  isPhysicalSkill,
  physicalMean,
  PHYSICAL_SKILL_KEYS,
  SKILL_KEYS,
  type KidSkills,
} from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { KNOCK_REST_GROWTH } from '../src/engine/knock'
import { migrateSave } from '../src/engine/migrations'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

// ⭐⭐⭐ THE STORED PEAK PHYSICAL (v62, the long goodbye step 1 –
// docs/specs/the-long-goodbye-2026-08.md §3b). `WorldState.peakPhysical` is the best her body has
// ever been, as one number: `physicalMean` of her skills, kept as a running maximum by the growth
// phase. NOTHING READS IT YET – step 2 is what moves the last retirement offer off her 38th birthday
// and onto a share of this number, so a body kept well plays to 41 and a wrecked one finishes early.
//
// ⚠ WHAT THIS FILE PINS IS THE FACT, NEVER A SPELLING. Every assertion below is about a number the
// engine produces: which attributes actually fall, that the maximum never goes down, that the share
// left is what `declineFactor` implies, that an interruption cannot buy a peak, and that a migrated
// save arrives at the number the career would have tracked. No test here reads a string, a comment
// or a source region – this repo has been bitten repeatedly by pins that guarded the text and missed
// the mechanic.
//
// ⚠ RNG: NOTHING HERE DRAWS ANYTHING NEW. `growAndLive` spends `driftCohort`'s four-per-rival on the
// MAIN stream exactly as it always has, and the peak is a `Math.max` over state `growWeek` has
// already computed. The frozen capture (41550 / e6b0c709, tests/condition.test.ts) is untouched.

/** ONE WEEK OF THE REAL GROWTH PHASE, and it is the phase that OWNS this field.
 *
 *  ⚠ WHY NOT `tickWeek` FOR THE LONG WALKS. Reaching the decline is 16 years – 832 weeks – and a
 *  full tick costs ~5.6 ms of tournaments, brackets, finance and AI against 0.035 ms for this. The
 *  two-line body is `tickWeek`'s own opening statement (`world.week += 1`) plus its phase 4, which
 *  is where `world.skills` and `world.peakPhysical` are written and the ONLY place either is; every
 *  other phase is downstream of the number and cannot move it. The real tick is walked anyway, in
 *  the first case below, so the claim "the shipped tick maintains this" is measured rather than
 *  inferred – what this harness buys is the AGE, not a shortcut past the engine. */
function stepGrowth(world: WorldState, rng: Rng): void {
  world.week += 1
  growAndLive(world, rng)
}

function bornAt(seed: string, background: 'working' | 'middle' | 'wealthy', coachTier: 'self' | 'middle' | 'elite') {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier })
  return { world, rng: rngFromSeed(world.seed) }
}

const ageOf = (world: WorldState): number =>
  kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)

/** Walk the growth phase until she is `age`, handing every week to `onWeek` after it has been lived. */
function walkTo(world: WorldState, rng: Rng, age: number, onWeek?: (w: WorldState) => void): void {
  while (ageOf(world) < age) {
    stepGrowth(world, rng)
    onWeek?.(world)
  }
}

describe('what «physical» means is READ OFF the line that erodes it', () => {
  // ⚠ THE DERIVATION, PROVED BEHAVIOURALLY RATHER THAN BY READING THE LIST BACK. `PHYSICAL_SKILL_KEYS`
  // is `SKILL_KEYS.filter(isPhysicalSkill)` and `growWeek` spends the same predicate, so asserting
  // the array's contents would only prove that `filter` works. What matters is that the set really
  // IS the set of attributes a week past the peak takes points off – so this runs a real declining
  // week with the headroom closed (potential = skills, so the gain term is 0) and reads the answer
  // out of the numbers that come back. Append a sixth skill and this test tells the truth about it
  // without being edited.
  it('is exactly the set of attributes a declining week takes points off', () => {
    const at = 35
    const skills: KidSkills = { serve: 60, ret: 58, composure: 55, stamina: 62, groundstrokes: 59 }
    const after = growWeek({
      skills,
      potential: { ...skills },
      ageYears: at,
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      coach: null,
      playStyle: DEFAULT_PROFILE.playStyle,
      matchesThisWeek: 0,
      seed: 'peak-derivation',
      week: 900,
    })
    const fell = SKILL_KEYS.filter((k) => after[k] < skills[k])
    const rose = SKILL_KEYS.filter((k) => after[k] > skills[k])
    expect(declineFactor(at), 'the week really is past the peak, or this proves nothing').toBeGreaterThan(0)
    expect([...fell].sort()).toEqual([...PHYSICAL_SKILL_KEYS].sort())
    expect(rose, 'composure is the one that GAINS – veteranPoise, which is why it is not physical')
      .toEqual(SKILL_KEYS.filter((k) => !isPhysicalSkill(k)))
    expect(fell.length + rose.length, 'every attribute is on exactly one side of the line').toBe(SKILL_KEYS.length)
  })

  it('is the mean of those keys and nothing else', () => {
    const skills: KidSkills = { serve: 40, ret: 50, composure: 99, stamina: 60, groundstrokes: 70 }
    // 40 + 50 + 60 + 70 = 220 over four. Composure's 99 must not be in it – and a mean over all five
    // would read 63.8, which is what makes this arithmetic rather than a tautology.
    expect(physicalMean(skills)).toBeCloseTo(55, 10)
  })
})

describe('the peak never decreases', () => {
  it('holds week by week through a career walked on the REAL tick', () => {
    // 120 weeks of the shipped `tickWeek` – tournaments, finance, brackets and all. She is 16 at the
    // end, so nothing has declined; what this case is for is that the SHIPPED tick maintains the
    // field at all, and that it is the mean of her live build rather than a number set at birth and
    // forgotten. Mutate `phaseGrowth`'s `Math.max` line away and this goes red on week 2.
    const { world, rng } = openCareer(PRESETS[5], 0, POLICIES[0])
    let prev = world.peakPhysical
    let moved = 0
    for (let w = 0; w < 120; w++) {
      stepCareerWeek(world, rng, POLICIES[0])
      expect(world.peakPhysical, `week ${world.week}: the maximum went DOWN`).toBeGreaterThanOrEqual(prev)
      expect(world.peakPhysical, `week ${world.week}: the peak is not her build`)
        .toBeCloseTo(physicalMean(world.skills), 10)
      if (world.peakPhysical > prev) moved += 1
      prev = world.peakPhysical
    }
    // Anti-vacuity: a peak that never moved would satisfy every line above.
    expect(moved, 'she developed, so the maximum was really re-taken').toBeGreaterThan(100)
  })

  it('holds across a WHOLE career, decline included – and the peak is the body she took into it', () => {
    const { world, rng } = bornAt('peak-monotone', 'middle', 'middle')
    let prev = world.peakPhysical
    let peakWeek = 0
    let peakValue = prev
    walkTo(world, rng, 45, (w) => {
      expect(w.peakPhysical, `week ${w.week}: the maximum went DOWN`).toBeGreaterThanOrEqual(prev)
      if (w.peakPhysical > prev) {
        peakWeek = w.week
        peakValue = w.peakPhysical
      }
      prev = w.peakPhysical
    })
    // ⭐ THE PEAK IS ATTAINED AT THE DOOR OF THE DECLINE, not at some week the curve chose. Before
    // `declineStart` the loss term is 0 and the gain term cannot be negative (`weekLuck` is
    // [0.55, 1.45]), so her physical mean is non-decreasing right up to it and drops every week after.
    // This is the fact that makes a running maximum equal to "the body she took into her thirties",
    // and it is what the migration's reconstruction depends on.
    expect(kidAgeExact(peakWeek, world.profile.birthMonth, world.profile.birthDay))
      .toBeCloseTo(ECONOMY.development.ageCurve.declineStart, 1)
    expect(world.peakPhysical, 'and it never moved again after that week').toBe(peakValue)
    expect(physicalMean(world.skills), 'she really did lose a lot of it by 45').toBeLessThan(0.5 * peakValue)
  })
})

describe('what is LEFT of her, past the peak', () => {
  it('falls every week, and by exactly the factor `declineFactor` implies', () => {
    const { world, rng } = bornAt('peak-rate', 'middle', 'middle')
    walkTo(world, rng, ECONOMY.development.ageCurve.declineStart)
    let prevShare = physicalMean(world.skills) / world.peakPhysical
    let weeks = 0
    // Stopped at 42 deliberately: `growWeek` clamps every attribute at `ECONOMY.development.floor`
    // (20) and the mid-forties are where a physical attribute first reaches it – past that point the
    // decline is no longer purely proportional and the identity below stops being exact. 29 to 42 is
    // the whole range the spec's dial (§3a, 70% -> 38 … 45% -> 43) actually reads.
    while (ageOf(world) < 42) {
      const before = physicalMean(world.skills)
      const decline = declineFactor(kidAgeExact(world.week + 1, world.profile.birthMonth, world.profile.birthDay))
      stepGrowth(world, rng)
      const after = physicalMean(world.skills)
      // THE RATE, as an identity rather than as a direction: one week multiplies her physical mean by
      // exactly (1 - declineFactor(age)). That is `growWeek`'s `loss = decline * skills[k]` read at
      // the level of the mean, and it is the reason a scalar peak is exact rather than a fudge.
      expect(after, `week ${world.week}: the week did not cost what the curve says`)
        .toBeCloseTo(before * (1 - decline), 9)
      const share = after / world.peakPhysical
      expect(share, `week ${world.week}: the share did not fall`).toBeLessThan(prevShare)
      prevShare = share
      weeks += 1
    }
    expect(weeks, 'thirteen seasons of decline were really walked').toBeGreaterThan(600)
    expect(prevShare).toBeLessThan(0.55)
  })

  it('is the same share at the same age however good she got – which is why one number is enough', () => {
    // ⭐⭐ THE PROPORTIONALITY CLAIM, MEASURED. §3b's whole design rests on it: the decline scales
    // every physical attribute by one factor, so the share left is a function of AGE and not of
    // level. Three careers with deliberately different ceilings – a self-coached working family and
    // an elite-coached wealthy one are the widest gap the presets offer – must read the same share
    // at 38 while their peaks differ. If they did not, a share threshold would be a different rule
    // for a rich girl than for a poor one, and the spec's dial table would mean nothing.
    const shares: number[] = []
    const peaks: number[] = []
    for (const [seed, bg, tier] of [
      ['share-a', 'working', 'self'],
      ['share-b', 'middle', 'middle'],
      ['share-c', 'wealthy', 'elite'],
    ] as const) {
      const { world, rng } = bornAt(seed, bg, tier)
      walkTo(world, rng, 38)
      shares.push(physicalMean(world.skills) / world.peakPhysical)
      peaks.push(world.peakPhysical)
    }
    expect(Math.max(...peaks) - Math.min(...peaks), 'the three careers really are different bodies')
      .toBeGreaterThan(3)
    for (const s of shares) expect(s).toBeCloseTo(shares[0], 3)
  })
})

describe('an interruption costs her the peak – it can never buy one', () => {
  it('does not raise the maximum when a rested knock flattens the years it lands in', () => {
    // The engine's own price of resting a knock is `KNOCK_REST_GROWTH` on the week's whole rate
    // (world/phaseGrowth's `loadFactor`), and it is reached by giving her a live, answered knock –
    // the same state the dialog writes. Two arms of ONE seed: the injured one rests a full year at
    // 21, which is squarely inside the years that decide how high she gets.
    const REST_FROM = 21
    const REST_TO = 22
    const healthy = bornAt('knock-arm', 'middle', 'middle')
    const injured = bornAt('knock-arm', 'middle', 'middle')
    walkTo(healthy.world, healthy.rng, 29)

    let everFell = false
    let prev = injured.world.peakPhysical
    while (ageOf(injured.world) < 29) {
      const age = ageOf(injured.world)
      if (age >= REST_FROM && age < REST_TO) {
        // Re-asserted each week: `rollKnock` runs in the same phase and retires a knock whose week
        // has passed, so a single long-dated one would not survive the block.
        injured.world.knock = {
          part: 'shoulder',
          sinceWeek: injured.world.week,
          repeat: false,
          choice: 'rest',
          untilWeek: injured.world.week + 1,
        }
      }
      stepGrowth(injured.world, injured.rng)
      if (injured.world.peakPhysical < prev) everFell = true
      prev = injured.world.peakPhysical
    }

    expect(everFell, 'the maximum moved DOWN inside the injured year').toBe(false)
    // ⚠ THE COST IS REAL AND IT IS PAID IN THE PEAK, which is exactly what §3 wants: the ending reads
    // her body, so a year lost to a knock has to show up as a lower ceiling on the rest of her life.
    expect(injured.world.peakPhysical, 'the lost year cost her nothing at all')
      .toBeLessThan(healthy.world.peakPhysical)
    expect(KNOCK_REST_GROWTH, 'the arm really is priced by the engine, not by this test').toBeLessThan(1)
  })

  it('stands still while the decline takes her build apart', () => {
    // The other direction, and the one a `Math.max` exists for: past 29 EVERY week costs her skill,
    // and the stored peak must sit exactly where it was while that happens.
    const { world, rng } = bornAt('peak-holds', 'middle', 'middle')
    walkTo(world, rng, 29)
    const atThirty = world.peakPhysical
    let fellCount = 0
    walkTo(world, rng, 40, (w) => {
      expect(w.peakPhysical, `week ${w.week}: a falling career moved its own peak`).toBe(atThirty)
      fellCount += 1
    })
    expect(fellCount).toBeGreaterThan(500)
    expect(physicalMean(world.skills), 'and she really was falling the whole time').toBeLessThan(0.7 * atThirty)
  })
})

describe('the v62 migration seeds an existing save at the peak it actually had', () => {
  /** A career walked to `age`, then handed back as the v61 save it would have been – the field
   *  removed and the version rolled back, which is exactly the payload the loader meets. */
  function asV61(age: number, seed = 'migrate-arm') {
    const { world, rng } = bornAt(seed, 'middle', 'middle')
    walkTo(world, rng, age)
    const tracked = world.peakPhysical
    const today = physicalMean(world.skills)
    const raw = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    delete raw.peakPhysical
    raw.schemaVersion = 61
    return { tracked, today, migrated: migrateSave(raw) }
  }

  it('reproduces the tracked peak of a career deep into its decline', () => {
    for (const age of [33, 38, 41]) {
      const { tracked, today, migrated } = asV61(age)
      // THE CLAIM: the seeded value is the number the career would have been carrying, not an
      // estimate of it. The migration multiplies `growWeek`'s own weekly factors back out of today's
      // mean, and past `declineStart` those factors are the ONLY thing that moved her – so this is
      // arithmetic run backwards and lands on floating-point equality, not on a tolerance.
      expect(migrated.peakPhysical, `age ${age}: the reconstruction missed the real peak`)
        .toBeCloseTo(tracked, 8)
      // ⚠ AND THE ANTI-VACUITY LINE, which is the whole point of the block: seeding "today" – the
      // obvious back-fill – would have been a different number by a wide margin, and would have told
      // a declining career it stands at 100% of its peak. At 38 that is a third of her body handed
      // back. A test that could pass under the naive seeding would not be this test.
      expect(today, `age ${age}: today's mean is not far enough from the peak to prove anything`)
        .toBeLessThan(0.9 * tracked)
      expect(migrated.peakPhysical).toBeGreaterThan(1.1 * today)
    }
  })

  it('leaves a career that has never declined reading exactly today – no special case', () => {
    // The reconstruction's product is empty below `declineStart`, so a young save seeds at its own
    // mean with no branch to get wrong. This is the arm the golden fixture covers (v62.json is a
    // 19-year-old), stated here as the fact rather than as a property of that file.
    for (const age of [17, 24, 28]) {
      const { tracked, today, migrated } = asV61(age)
      expect(migrated.peakPhysical, `age ${age}`).toBeCloseTo(today, 10)
      expect(migrated.peakPhysical).toBeCloseTo(tracked, 10)
    }
  })

  it('is idempotent, and does not touch a save that already carries the field', () => {
    const { world, rng } = bornAt('migrate-idem', 'middle', 'middle')
    walkTo(world, rng, 38)
    const raw = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
    raw.schemaVersion = 61
    raw.peakPhysical = 12345
    expect(migrateSave(raw).peakPhysical, 'a value already in the save was overwritten').toBe(12345)
  })

  it('reads the share its age implies, exactly as a career played from scratch would', () => {
    // ⭐ THE CONSEQUENCE OF THE SEEDING CHOICE, STATED AS A NUMBER. Step 2 puts the last retirement
    // offer on `current / peak`; the point of reconstructing rather than defaulting is that a
    // migrated career arrives at the SAME share as a fresh one of the same age, so the threshold
    // fires at the same birthday on both. Measured off the shipped curve: ~89% at 33, ~69% at 38,
    // ~56% at 41 – which is also the row the owner's 55% ruling sits on.
    const expected: Record<number, number> = { 33: 0.892, 38: 0.689, 41: 0.557 }
    for (const age of [33, 38, 41]) {
      const { today, migrated } = asV61(age)
      expect(today / migrated.peakPhysical, `age ${age}`).toBeCloseTo(expected[age], 2)
    }
  })
})
