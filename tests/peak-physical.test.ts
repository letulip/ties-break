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
  // ⚠⚠ SELF-COACHED SINCE 17.09, AND THE TOLERANCE DID NOT MOVE TO PAY FOR IT (round 44, spec §7).
  // `declineFactor` is the WHOLE weekly cost only for a career with nobody on the payroll: round 44
  // charges `declineRate x ageWeightOf(k) x SHIELD x skills[k]`, and the shield is below 1 on every
  // week a seat is working. The old arm was `middle`-coached, so once `coachMaintenanceTop` went
  // live it lost 0.0060 a week against this line's 0.005 – the identity was not drifting, it was
  // INCOMPLETE. MEASURED ON BOTH ARMS at the shipped constant: self-coached 0.0031 (which is the
  // round-38 #6c figure, unchanged), middle-coached 0.0060. So the arm is the one the claim is
  // about and the claim is exact again; what a PAID seat does to the same walk is the case two
  // describes below («...but a PAID SEAT does change it»), where it is asserted rather than tolerated.
  it('falls every week, and by exactly the factor `declineFactor` implies', () => {
    const { world, rng } = bornAt('peak-rate', 'middle', 'self')
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
    // ⚠⚠ RE-AIMED, ROUND 38 #6c (07.09) – `physicalMean` STOPPED BEING EXACT AND THIS IS WHERE IT
    // SHOWS. `ageWeightOf` gives each physical attribute its own decline rate (the serve slowest, the
    // legs fastest), so the four no longer scale by ONE factor and their mean is a mean again rather
    // than each attribute's own share. The weights are normalised to a mean of exactly 1, which is
    // why the drift below is a rounding-scale number and not a behaviour change. See
    // `physicalMean`'s corrected header and docs/specs/what-ages-first-2026-09.md §4.
    // MEASURED, WORST WEEK OF 675: 0.0031 on a mean of 55-64, i.e. 5e-5 relative. The line still
    // fails if the decline stops, doubles, or loses an attribute – it no longer claims the mean is
    // the single factor, because it is not.
      expect(after, `week ${world.week}: the week did not cost what the curve says`)
        .toBeCloseTo(before * (1 - decline), 2)
      const share = after / world.peakPhysical
      expect(share, `week ${world.week}: the share did not fall`).toBeLessThan(prevShare)
      prevShare = share
      weeks += 1
    }
    expect(weeks, 'thirteen seasons of decline were really walked').toBeGreaterThan(600)
    // ⚠ RE-AIMED, ROUND 38 #3d (06.09) – WAS `< 0.55`, MEASURED 0.5454 AFTER THE SAME 675 WEEKS.
    // `ageCurve.declineAccel` went 0.28 -> 0.24 on the owner's «они и не беспомощны… может разве что
    // тоже плавнее сделать», so thirteen seasons of decline now leave slightly MORE of her. The
    // claim this line makes is unchanged and is still the point – she really is most of the way down
    // after thirteen seasons – so the bound moves and the assertion is not weakened: it still fails
    // if the decline stops working at all. See docs/specs/fame-presence-2026-09.md §6.
    expect(prevShare).toBeLessThan(0.6)
  })

  // ⚠⚠⚠ THESE TWO CASES WERE ONE CASE UNTIL 17.09, AND THE SPLIT IS A STRENGTHENING RATHER THAN A
  // RELAXATION (docs/specs/the-decline-and-the-seats-2026-09.md §7, the owner's ruling). The old
  // single case manufactured its three bodies with `bornAt(seed, background, coachTier)` and read
  // them as three CLASSES – «a share threshold must not be a different rule for a rich girl than
  // for a poor one». Round 44's coach maintenance row turned it red at the swept 0.08, and the
  // fixture is what settled the argument: `bornAt` puts the tier in the PROFILE at creation and
  // `walkTo` ticks growth weeks only, so NOTHING IN THAT WALK EVER HIRES ANYBODY. `share-a` was
  // self-coached at 38 because the fixture never hired, not because a working family cannot afford
  // a coach on the pro tour – and the 1.88pp it opened was a STAFFING difference wearing a class
  // label. The owner, 17.09: «на про уровне они все имеют условно одинаковый доход… и здесь нет
  // разницы в начальном сословии».
  //
  // ⭐ So the one claim the case had been carrying at once is now two, and each is stated on a
  // fixture that can only be about the thing it names:
  //
  //   1. PROPORTIONALITY, ISOLATED – different ceilings, IDENTICAL staffing, same share.
  //      What the old comment always said it tested («three careers with deliberately different
  //      CEILINGS … must read the same share at 38 while their peaks differ»), with money unable
  //      to contaminate it. It is 100x TIGHTER than the case it replaces and its three bodies are
  //      6.6x further apart – see its own note.
  //   2. THE SEATS, PINNED – same age, same LEVEL, different staffing, a DIFFERENT share.
  //      The new fact gets a case of its own instead of being absorbed as slack in an old one.
  //      ⭐ It is also the case that would have caught round 44's «the coach multiplies zero» years
  //      earlier: nothing anywhere pinned that a paid seat changes anything at all about ageing,
  //      which is exactly why the defect survived to be found by a player.
  //
  // ⚠ WHAT IS NOT CLAIMED, SAID OUT LOUD: the share is no longer a pure function of age, because
  // staffing now enters it. The decline's SHAPE is still class-blind – `declineRate`, `declineAccel`,
  // `ageWeight` and the drawn `declineStart` read nothing about the family – and case 1 is what
  // holds that line.
  it('is the same share at the same age however good she got – which is why one number is enough', () => {
    // ⭐⭐ THE PROPORTIONALITY CLAIM, MEASURED, AND THE VARIABLE IS *LEVEL* AND NOTHING ELSE. §3b's
    // whole design rests on it: the decline scales every physical attribute proportionally, so the
    // share left is a function of AGE and not of how high she got. Three bodies, ONE seed – so the
    // same coach at the same tier with the same fit and the same chemistry, i.e. identical staffing
    // by construction rather than by inspection – and the CEILING written directly, which is the
    // axis the claim is about. If they did not read the same share, a share threshold would mean a
    // different thing for a great career than for a modest one and the spec's dial table would mean
    // nothing.
    //
    // ⚠ THE CEILING IS SCALED RATHER THAN DRAWN, deliberately: a different SEED gives a different
    // mix of the four as well as a different level, and `ageWeightOf` gives each attribute its own
    // rate, so a re-mixed body legitimately reads a slightly different share (MEASURED: 0.59pp over
    // a tilted trio). That is the round-38 #6c finding and it is not what this case is about.
    const shares: number[] = []
    const peaks: number[] = []
    for (const ceiling of [0.82, 1.0, 1.18]) {
      const { world, rng } = bornAt('share-iso', 'middle', 'middle')
      for (const k of SKILL_KEYS) world.potential[k] = world.potential[k] * ceiling
      walkTo(world, rng, 38)
      shares.push(physicalMean(world.skills) / world.peakPhysical)
      peaks.push(world.peakPhysical)
    }
    // ⭐ 6.6x THE OLD SPREAD. The bodies the class fixture produced were 3.37 points apart and the
    // line under them read `> 3`; these are 22.22 apart (51.93 / 63.04 / 74.15), which is most of
    // the range the engine can roll.
    expect(Math.max(...peaks) - Math.min(...peaks), 'the three careers really are different bodies')
      .toBeGreaterThan(15)
    // ⭐⭐ AND 100x TIGHTER THAN THE CASE IT REPLACES – WAS 2 DECIMALS (0.5pp of slack, against a
    // measured 0.20pp), NOW 4 (0.005pp of slack, against a MEASURED SPREAD OF 0.0011pp). Removing
    // the staffing confound is what bought the exactness back: what was left over in the old case
    // was money, not arithmetic. The residual is the `ageWeightOf` mixing that round 38 #6c found,
    // and at one seed it is a rounding-scale number.
    for (const s of shares) expect(s).toBeCloseTo(shares[0], 4)
    // Anti-vacuity: three careers that never declined would satisfy every line above.
    for (const s of shares) expect(s, 'she really did lose a lot of it by 38').toBeLessThan(0.8)
  })

  it('⭐ ...but a PAID SEAT does change it – same age, same LEVEL, a different payroll', () => {
    // ⭐⭐⭐ THE OTHER HALF OF THE OLD CASE, AND THE PIN THAT DID NOT EXIST (round 44, spec §7).
    // Nothing anywhere asserted that hiring anybody changes ageing at all, so `coachMaintenanceTop`
    // could sit at 0 – «an elite coach multiplies zero past `declineStart`» – and every test in the
    // repo stayed green while a family paid elite money for a twenty-eight-year-old and bought her
    // tennis nothing. This case fails the day that is true again.
    //
    // ⚠ THE FORK IS WHAT MAKES «SAME LEVEL» A FACT RATHER THAN A HOPE. One seed is walked to
    // `declineStart` three times identically and the payroll is set only THERE, so all three arms
    // enter their thirties as the same body to the bit – the peak is attained at the door of the
    // decline (the monotone case above proves it) and is asserted identical below. Age, level and
    // seed are held; staffing is the only variable left.
    const armAt38 = (setup: (w: WorldState) => void) => {
      const { world, rng } = bornAt('share-fork', 'middle', 'elite')
      walkTo(world, rng, ECONOMY.development.ageCurve.declineStart)
      setup(world)
      walkTo(world, rng, 38)
      return { share: physicalMean(world.skills) / world.peakPhysical, peak: world.peakPhysical }
    }
    const nobody = armAt38((w) => {
      w.coachId = null
    })
    const coachOnly = armAt38(() => {})
    const team = armAt38((w) => {
      w.masseurHired = true
      w.masseurSessionsPerWeek = ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions
      w.masseurTravels = true
      w.sparringHired = true
      // ⚠ THE LITERAL IS THE PERSISTED TYPE'S – `sparringRung` is `0 | 1 | 2`, so a computed index
      // does not narrow. The line under it is what stops the literal rotting if the ladder grows.
      w.sparringRung = 2
      w.sparringTravels = true
    })
    expect(ECONOMY.sparring.rungs.length, 'the partner ladder grew – rung 2 is no longer its top').toBe(3)
    // SAME LEVEL, PROVEN: identical to the bit, so nothing below can be a difference in bodies.
    expect(coachOnly.peak, 'the arms are not the same body').toBe(nobody.peak)
    expect(team.peak, 'the arms are not the same body').toBe(nobody.peak)
    // ⭐⭐ THE COACH ALONE IS WORTH SOMETHING, which is the sentence round 44 exists to make true.
    // MEASURED at the shipped `coachMaintenanceTop`: +1.92pp of her peak over eleven seasons
    // (71.39% -> 73.30%). ⚠ AT A HELD ROW IT IS EXACTLY +0.0000pp – this line is the tripwire.
    expect(coachOnly.share, 'the elite coach is still multiplying zero past the peak')
      .toBeGreaterThan(nobody.share)
    expect(coachOnly.share - nobody.share, 'the coach\'s maintenance row is smaller than it was measured at')
      .toBeGreaterThan(0.015)
    // ...and the body seats are worth more again, on top of him. MEASURED: +4.91pp (71.39 -> 76.30).
    expect(team.share, 'the masseur and the partner added nothing to a coached veteran')
      .toBeGreaterThan(coachOnly.share)
    expect(team.share - nobody.share, 'the whole payroll is worth less than it was measured at')
      .toBeGreaterThan(0.04)
    // ⚠ AND NO PAYROLL BUYS THE IMMORTALITY BUTTON – the spec's §4 Q1, at the level of a walked
    // career rather than of the shield's arithmetic. She is thirty-eight and she has lost a quarter
    // of her body with the best team in the game on the payroll.
    expect(team.share, 'a fully staffed veteran stopped ageing').toBeLessThan(0.8)
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
   *  removed and the version rolled back, which is exactly the payload the loader meets.
   *
   *  ⚠⚠ SELF-COACHED SINCE 17.09, AND IT IS A CORRECTION TO THE FIXTURE'S PROVENANCE RATHER THAN A
   *  CONCESSION (round 44, spec §7). `migrateSave` reconstructs the peak by multiplying `growWeek`'s
   *  own weekly factors back out of today's mean, and those factors are the UNSHIELDED curve –
   *  correctly, because **a v61 save is by definition a career walked before round 44 existed**, so
   *  its decline really did run with no payroll in it. This helper was manufacturing its «v61» input
   *  with TODAY's engine, which from the coach row onwards means a shielded walk the loader can
   *  never actually meet: a save old enough to need this migration cannot have been shielded.
   *  ⭐ NOT ONE NUMBER IN THIS DESCRIBE MOVED WHEN THE ARM WAS CORRECTED – the 2% bound, the two
   *  anti-vacuity lines and the 0.8971 / 0.7102 / 0.5866 table all reproduce to the digit, and the
   *  measured 0.015% / 0.50% / 1.37% drift is the same drift round 38 #6c recorded. That is the
   *  check that says the arm was wrong and the pins were right, rather than the other way about. */
  function asV61(age: number, seed = 'migrate-arm') {
    const { world, rng } = bornAt(seed, 'middle', 'self')
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
      // ⚠⚠ RE-AIMED, ROUND 38 #6c – WAS 8 DECIMALS, i.e. floating-point equality, and the comment
      // above says exactly why it could be: «past `declineStart` those factors are the ONLY thing
      // that moved her – so this is arithmetic run backwards». The migration still runs the same
      // arithmetic backwards, but it runs ONE factor backwards where the engine now applies four, so
      // it lands near the tracked peak instead of on it. MEASURED: 0.0108 on a peak of 71.22, i.e.
      // 0.015%. The anti-vacuity line below is untouched and is what keeps this a real test.
      // ⚠ A RELATIVE BOUND RATHER THAN `toBeCloseTo`'s decimal places, because the drift GROWS with
      // the years of divergence (0.015% / 0.50% / 1.37% at 33 / 38 / 41) and a single decimal place
      // would be slack at 33 and red at 41. 2% is above the measured worst and far below the third of
      // her body the naive seeding would miss by.
      expect(Math.abs(migrated.peakPhysical - tracked) / tracked, `age ${age}: the reconstruction missed the real peak`)
        .toBeLessThan(0.02)
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
    // fires at the same birthday on both.
    // ⚠ RE-AIMED, ROUND 38 #3d (06.09). The table WAS 89% / 69% / 56% at 33 / 38 / 41 and is now
    // 90% / 71% / 59%, because `ageCurve.declineAccel` went 0.28 -> 0.24. What the test checks is
    // unchanged – a migrated career and a fresh one of the same age read the SAME share – and the
    // numbers are the shipped curve's, re-measured rather than adjusted to pass.
    // ⚠⚠ AND THE ROW THE OWNER'S 55% RULING SAT ON HAS MOVED: 41 used to read 56%, just past the
    // threshold, and now reads 59%, just short of it. That is the measured cost of the softer curve
    // and it is why `tests/ending.test.ts`'s last offer moved from 41 to 42 – one winter, not more.
    const expected: Record<number, number> = { 33: 0.8971, 38: 0.7102, 41: 0.5866 }
    for (const age of [33, 38, 41]) {
      const { today, migrated } = asV61(age)
      expect(today / migrated.peakPhysical, `age ${age}`).toBeCloseTo(expected[age], 2)
    }
  })
})
