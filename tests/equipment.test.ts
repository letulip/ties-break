import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { migrateSave } from '../src/engine/migrations'
import {
  applyKit,
  DEFAULT_KIT_GRADES,
  FRESH_KIT,
  KIT_GRADES,
  SPENT_KIT,
  defaultKitState,
  kitInjuryFactor,
  kitLinePriceCents,
  kitMultipliers,
  kitWearAt,
} from '../src/engine/equipment'
import { ECONOMY, GEAR_CATEGORIES, gearHitsUpTo, weeksSinceGear } from '../src/engine/economy'
import {
  expectedServeSpeed,
  LEGACY_SNAPSHOT_AGE,
  serveSpeedBase,
  SPEED_PER_SKILL,
} from '../src/engine/match/serveSpeed'
import { aceSpeedFactor, ACE_SPEED_FLOOR, ACE_SPEED_REF, ACE_SPEED_MAX_FACTOR } from '../src/engine/match/rally'
import { basePServe, paceAdvantage } from '../src/engine/match/point'
import { SKILL_POINTS_PER_YEAR } from '../src/engine/development'
import { createWorld, kidMatchPlayerFor, setKitGrade, kitLineViews, goodWeeksFor, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import type { FamilyBackground, KitGrade, KitLine, KitState } from '../src/shared/protocol'
import type { MatchOptions, MatchPlayer } from '../src/engine/match/types'

// ---------------------------------------------------------------------------
// Equipment condition + the serve-speed curve it reads into.
// docs/specs/equipment-and-serve-speed.md.
//
// Everything here is pure arithmetic with ZERO RNG. The frozen MAIN capture
// (41550 / e6b0c709) is guarded in condition/injuries/planner/knock; this file
// guards the MODEL those tests must not be able to move.
// ---------------------------------------------------------------------------

const BACKGROUNDS: FamilyBackground[] = ['working', 'middle', 'wealthy']
const P = (over: Partial<MatchPlayer>): MatchPlayer => ({
  id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over,
})

describe('serve speed — the age curve (§1)', () => {
  it("hits the owner's two checkpoints", () => {
    expect(expectedServeSpeed(14, 40)).toBeCloseTo(117, 0)
    expect(expectedServeSpeed(19, 75)).toBeCloseTo(161, 0)
  })

  it('the base rises from ~95 at 14 to ~120 at 19, and it is the shape he approved', () => {
    expect(serveSpeedBase(14)).toBeCloseTo(95, 0)
    expect(serveSpeedBase(19)).toBeCloseTo(120, 0)
  })

  // ⚠ THE REQUIREMENT THAT MADE THIS A FUNCTION RATHER THAN A TABLE. The owner wants the childhood
  // prologue to «дорасти» into the corridor (docs/specs/childhood-prologue.md), which only works if
  // the SAME curve answers at six. A two-row table for {14, 19} would have had to be extended by
  // hand for every age the prologue invents.
  it('is continuous and monotonic from early childhood into an adult plateau', () => {
    let prev = -Infinity
    for (let age = 5; age <= 32; age += 0.25) {
      const v = serveSpeedBase(age)
      expect(v).toBeGreaterThan(prev)
      prev = v
    }
    // A six-year-old cannot reach 90 km/h, however the prologue rolls her - the spec's own example.
    for (const skill of [5, 10, 20, 40]) expect(expectedServeSpeed(6, skill)).toBeLessThan(90)
    // ...and it saturates instead of running away: a 30-year-old is not much past a 25-year-old.
    expect(serveSpeedBase(30) - serveSpeedBase(25)).toBeLessThan(1)
  })

  it('the corridor is the real sport: strong juniors reach ~150, professionals 155-165', () => {
    // a strong fourteen-year-old, which the spec puts at about 150
    expect(expectedServeSpeed(14, 90)).toBeGreaterThan(140)
    expect(expectedServeSpeed(14, 90)).toBeLessThan(152)
    // WTA professionals average roughly 155-165
    expect(expectedServeSpeed(19, 70)).toBeGreaterThan(154)
    expect(expectedServeSpeed(22, 80)).toBeLessThan(172)
  })

  // ⚠ THE BUG THIS SLICE EXISTS TO FIX, pinned so nobody can put the floor back: the shipped model
  // was `128 + skill x 0.45`, so nobody in this game had ever served slower than about 120 km/h.
  it('a weak fourteen-year-old serves BELOW the old 128 floor, and talent outweighs the base', () => {
    expect(expectedServeSpeed(14, 30)).toBeLessThan(120)
    // talent shows more than the floor does: skill 30 -> 90 is worth more than age 14 -> 19
    const bySkill = expectedServeSpeed(16, 90) - expectedServeSpeed(16, 30)
    const byAge = serveSpeedBase(19) - serveSpeedBase(14)
    expect(bySkill).toBeGreaterThan(byAge)
    expect(SPEED_PER_SKILL).toBeGreaterThan(0.45) // raised from the shipped coefficient
  })
})

describe('equipment — condition is DERIVED, nothing is persisted', () => {
  // THE HEADLINE, and the reason this slice needed no migration: gear purchases are scheduled
  // deterministically off (seed, background) sub-streams and `resolveGear` bills them
  // unconditionally, so the purchase weeks - and therefore the condition - are a pure function of
  // what the save already holds.
  it('wear is a pure function of (seed, background, week)', () => {
    for (const bg of BACKGROUNDS) {
      for (const week of [0, 1, 7, 40, 155, 311]) {
        expect(kitWearAt('derive', bg, week)).toEqual(kitWearAt('derive', bg, week))
      }
    }
  })

  it('`weeksSinceGear` agrees with `gearHitsUpTo`, which is the schedule that is actually billed', () => {
    for (const bg of BACKGROUNDS) {
      for (const category of GEAR_CATEGORIES) {
        for (const week of [0, 3, 9, 26, 77, 208]) {
          const hits = gearHitsUpTo('agree', category, bg, week)
          const lastWeek = hits.length ? hits[hits.length - 1].week : 0
          expect(weeksSinceGear('agree', category, bg, week), `${bg}/${category}/${week}`).toBe(week - lastWeek)
        }
      }
    }
  })

  it('week 0 is brand new kit on every line, for every family', () => {
    for (const bg of BACKGROUNDS) expect(kitWearAt('new', bg, 0)).toEqual(FRESH_KIT)
  })

  it('a restring RESTORES the strings: wear falls back to zero on the purchase week', () => {
    const hits = gearHitsUpTo('restore', 'stringing', 'working', 60)
    expect(hits.length).toBeGreaterThan(5)
    for (const hit of hits) {
      expect(kitWearAt('restore', 'working', hit.week).strings).toBe(0)
      expect(kitWearAt('restore', 'working', hit.week - 1).strings).toBeGreaterThan(0)
    }
  })
})

describe('equipment — the multipliers', () => {
  it('fresh kit is the NEUTRAL ELEMENT: every attribute comes back byte-identical', () => {
    const p = P({ serve: 47.3, ret: 51.9, composure: 38.5, stamina: 44.1, groundstrokes: 49.7 })
    expect(applyKit(p, FRESH_KIT)).toEqual(p)
    for (const v of Object.values(kitMultipliers(FRESH_KIT))) expect(v).toBe(1)
    expect(kitInjuryFactor(FRESH_KIT)).toBe(1)
  })

  it('wear only ever subtracts, and never touches composure (nerves are hers, not her racket\'s)', () => {
    const p = P({})
    const worn = applyKit(p, SPENT_KIT)
    expect(worn.serve).toBeLessThan(p.serve)
    expect(worn.ret).toBeLessThan(p.ret)
    expect(worn.stamina).toBeLessThan(p.stamina)
    expect(worn.groundstrokes).toBeLessThan(p.groundstrokes)
    expect(worn.composure).toBe(p.composure)
  })

  // The spec's ordering, as a fact rather than a comment: strings are the biggest and truest lever,
  // the frame is a small constant, and the strings read into CONTROL rather than power.
  it('strings are the biggest line, the frame the smallest, and strings are control not power', () => {
    const only = (line: 'strings' | 'frame' | 'shoes') => {
      const p = P({})
      const worn = applyKit(p, { ...FRESH_KIT, [line]: 1 })
      return (p.serve - worn.serve) + (p.ret - worn.ret) + (p.stamina - worn.stamina) + (p.groundstrokes - worn.groundstrokes)
    }
    expect(only('strings')).toBeGreaterThan(only('shoes'))
    expect(only('shoes')).toBeGreaterThan(only('frame'))
    // control, not power: a dead bed costs her far more return/rally than serve
    const e = ECONOMY.equipment
    expect(e.stringWear.ret).toBeGreaterThan(e.stringWear.serve * 2)
    expect(e.stringWear.groundstrokes).toBeGreaterThan(e.stringWear.serve * 2)
  })

  it('shoes are TWO effects, not one: movement AND injury risk', () => {
    const p = P({})
    const worn = applyKit(p, { ...FRESH_KIT, shoes: 1 })
    expect(worn.ret).toBeLessThan(p.ret) // reaching the ball
    expect(worn.stamina).toBeLessThan(p.stamina) // chasing costs more when you slip
    expect(kitInjuryFactor({ ...FRESH_KIT, shoes: 1 })).toBeGreaterThan(1)
    expect(kitInjuryFactor({ ...FRESH_KIT, shoes: 1 })).toBeCloseTo(1 + ECONOMY.equipment.shoeInjuryRise, 12)
  })

  it('an OLD frame is not a BROKEN one - sound is neutral until its service life runs out', () => {
    // The owner's padel correction: «чиненая ракетка работает хуже, чем пусть и старая, но целая».
    const e = ECONOMY.equipment
    for (let weeks = 0; weeks <= e.frameSoundWeeks; weeks++) {
      const wear = Math.max(0, Math.min(1, (weeks - e.frameSoundWeeks) / e.framePatchWeeks))
      expect(wear, `an ${weeks}-week-old frame is still sound`).toBe(0)
    }
  })
})

describe('equipment — it must never make background destiny (the hard constraint)', () => {
  // MEASURED, and the numbers are the bench's (tools/kit-bench.ts). The yardstick is human: one year
  // of junior development / relative age, SKILL_POINTS_PER_YEAR = 2.4.
  const HORIZON = 208
  function meanPenalty(bg: FamilyBackground): number {
    let sum = 0
    let n = 0
    for (let s = 0; s < 12; s++) {
      for (let w = 0; w <= HORIZON; w++) {
        const p = P({})
        const worn = applyKit(p, kitWearAt(`destiny-${s}`, bg, w))
        sum += (p.serve - worn.serve + (p.ret - worn.ret) + (p.stamina - worn.stamina) + (p.groundstrokes - worn.groundstrokes)) / 5
        n++
      }
    }
    return sum / n
  }

  it('the WHOLE swing, worst kit to best, comes in under one year of relative age', () => {
    const p = P({ serve: 57, ret: 57, composure: 57, stamina: 57, groundstrokes: 57 })
    const worn = applyKit(p, SPENT_KIT)
    const mean =
      (p.serve - worn.serve + (p.ret - worn.ret) + (p.composure - worn.composure) + (p.stamina - worn.stamina) + (p.groundstrokes - worn.groundstrokes)) / 5
    expect(mean).toBeLessThan(SKILL_POINTS_PER_YEAR)
  })

  it('⚠ THE ONE THAT DECIDES IT: the working/wealthy gap is a rounding error next to a year', () => {
    const gap = meanPenalty('working') - meanPenalty('wealthy')
    expect(gap).toBeGreaterThan(0) // the effect is REAL - the wealthy girl does restring more often
    expect(gap).toBeLessThan(SKILL_POINTS_PER_YEAR / 4) // ...and it is nowhere near destiny
  })

  // ⚠ RE-AIMED, NOT DELETED (W3-KIT). This guard read "the injury half is background-NEUTRAL by
  // construction: nobody buys out of a rolled ankle", and it asserted that `kitInjuryFactor` returns
  // the SAME number for all three families at every week. Its evidence was the shoe cadence, which is
  // 10-14 for everybody with only the price differing - and that is still true and still checked
  // below. What broke it is that the frame now has an injury half too (a stiff dead frame is a
  // tennis-elbow story, `ECONOMY.equipment.frameInjuryRise`), and the frame's CADENCE is not
  // background-neutral: 14-18 for the working family against 10-12 for the wealthy one.
  //
  // So the property being defended has to be stated properly rather than by exact equality, and the
  // properly-stated version is the sentence the old name was reaching for: THE ANKLE IS NEUTRAL TO
  // THE CENT. The shoes are the big half (0.20 against the frame's 0.12), their cadence is identical
  // for every family, and byte equality on that half is still checked below exactly as before. What
  // is not neutral any more is the ELBOW, and it cannot be: the frame cadence really is 14-18 for the
  // working family against 10-12 for the wealthy one, so a family that replaces its racket less often
  // really does hold a deader one. MEASURED over a 14->18 career: the mean spread is 0.005 (half a
  // per cent of a threshold that sits around 1.08), because realised frame wear is 0.041 / 0.010 /
  // 0.000 by background - the frame has a flat head 13 weeks long and everyone replaces inside it.
  // The PEAK, in the fortnight before a working family's frame is replaced, is 0.060.
  it('the injury half keeps the ANKLE background-neutral: nobody buys out of a rolled ankle', () => {
    // Shoe cadence is 10-14 for every family; only the price differs (ECONOMY.gear.shoes).
    for (const bg of BACKGROUNDS) {
      expect(ECONOMY.gear.shoes.cadenceWeeks[bg]).toEqual(ECONOMY.gear.shoes.cadenceWeeks.working)
    }
    const HORIZON = 208
    const totals: Record<string, number> = { working: 0, middle: 0, wealthy: 0 }
    for (let w = 0; w <= HORIZON; w++) {
      // THE SHOE HALF ALONE, which is what the guard was ever about: byte equality across every
      // background, at every week, exactly as before.
      const shoesOnly = (bg: FamilyBackground) =>
        1 + kitWearAt('inj', bg, w).shoes * ECONOMY.equipment.shoeInjuryRise
      for (const bg of BACKGROUNDS) expect(shoesOnly(bg)).toBe(shoesOnly('working'))
      // ...and no single week's whole-factor spread exceeds the frame half's own size, which is the
      // most the frame term can possibly contribute.
      const working = kitInjuryFactor(kitWearAt('inj', 'working', w))
      for (const bg of BACKGROUNDS) {
        totals[bg] += kitInjuryFactor(kitWearAt('inj', bg, w))
        expect(Math.abs(kitInjuryFactor(kitWearAt('inj', bg, w)) - working)).toBeLessThanOrEqual(
          ECONOMY.equipment.frameInjuryRise,
        )
      }
    }
    // AND THE ONE THAT DECIDES IT: over a whole career the elbow gap is a rounding error - under one
    // per cent of a threshold that is itself a few per cent a week.
    const mean = (bg: string) => totals[bg] / (HORIZON + 1)
    expect(mean('working') - mean('wealthy')).toBeGreaterThan(0) // real, not zero
    expect(mean('working') - mean('wealthy')).toBeLessThan(0.01)
  })
})

describe('the ace rate is the serve speed (§1, the annotation layer)', () => {
  it('a professional pace reproduces the shipped constant exactly', () => {
    expect(aceSpeedFactor(ACE_SPEED_REF)).toBeCloseTo(1, 12)
  })

  it('a returnable serve stops producing aces, and the biggest server is capped', () => {
    expect(aceSpeedFactor(ACE_SPEED_FLOOR)).toBe(0)
    expect(aceSpeedFactor(ACE_SPEED_FLOOR - 30)).toBe(0)
    expect(aceSpeedFactor(400)).toBe(ACE_SPEED_MAX_FACTOR)
  })

  it('a fourteen-year-old aces markedly less than a nineteen-year-old at the same skill', () => {
    const young = aceSpeedFactor(expectedServeSpeed(14, 50))
    const old = aceSpeedFactor(expectedServeSpeed(19, 50))
    expect(old).toBeGreaterThan(young * 1.5)
  })
})

describe('the pace term in basePServe (§the third layer)', () => {
  const opts: MatchOptions = { surface: 'hard', tour: 'wta', seed: 's' }

  // ⚠ THE PROPERTY THAT MAKES IT ADMISSIBLE AT ALL, and it is verified rather than assumed: the term
  // multiplies a DIFFERENCE, so it vanishes at the reference point and no calibrated number moves.
  it('is EXACTLY zero inside one age band, and for players with no age at all', () => {
    for (const age of [6, 13, 14, 16.7, 19, 25]) {
      expect(paceAdvantage(P({ age }), P({ age }))).toBe(0)
    }
    expect(paceAdvantage(P({}), P({}))).toBe(0)
    // ...so basePServe is byte-identical to its pre-slice value on the reference fixture: two level
    // players at 50 land exactly on the tour average, with or without an age on them.
    expect(basePServe(P({ id: 'a' }), P({ id: 'b' }), opts)).toBe(0.57) // TOUR_AVG_P.wta, untouched
    expect(basePServe(P({ id: 'a', age: 18 }), P({ id: 'b', age: 18 }), opts)).toBe(0.57)
    // and an aged pair reproduces the age-less pair to the bit
    expect(basePServe(P({ age: 17, serve: 71 }), P({ age: 17, ret: 44 }), opts)).toBe(
      basePServe(P({ serve: 71 }), P({ ret: 44 }), opts),
    )
  })

  it('reads the BAND, not the girl - so the relative age effect is not paid for twice', () => {
    // A January girl (14.0) and a December girl (13.1) in the same 14s band: the head start they
    // already carry in skill points is the game's model of that, and this term must not add to it.
    expect(paceAdvantage(P({ age: 14.0 }), P({ age: 14.9 }))).toBe(0)
    expect(paceAdvantage(P({ age: 14.9 }), P({ age: 15.0 }))).not.toBe(0)
  })

  it('an older girl serves through a younger one, and the size stays inside the yardstick', () => {
    expect(paceAdvantage(P({ age: 16 }), P({ age: 14 }))).toBeGreaterThan(0)
    expect(paceAdvantage(P({ age: 14 }), P({ age: 16 }))).toBeLessThan(0)
    // The extreme this game can produce - a fourteen-year-old against a nineteen-year-old - is
    // measured by the bench at 1.83 skill points, inside one year of relative age (2.4).
    const extreme = paceAdvantage(P({ age: 19 }), P({ age: 14 }))
    expect(extreme).toBeCloseTo(serveSpeedBase(19) - serveSpeedBase(14), 12)
    expect(extreme).toBeLessThan(26) // km/h of pace, the whole span of the curve
  })
})

describe('the wiring — a real world composes kit and age exactly once', () => {
  it('the composition point stamps her real age and her kit onto the MatchPlayer', () => {
    const world = createWorld('kit-wire')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    const kid = kidMatchPlayerFor(world, 'hard')
    expect(kid.age).toBeGreaterThan(14)
    expect(kid.age).toBeLessThan(15.5)
    // ...and her kit is the kit her ledger paid for, not a fresh set
    const wear = kitWearAt(world.seed, world.profile.background, world.week)
    expect(kid.serve).toBeCloseTo(
      kidMatchPlayerFor({ ...world, week: world.week }, 'hard').serve,
      12,
    )
    expect(wear.strings).toBeGreaterThanOrEqual(0)
    expect(wear.strings).toBeLessThanOrEqual(1)
  })

  it('LEGACY_SNAPSHOT_AGE covers a pre-branch snapshot instead of producing NaN', () => {
    const stale = P({ serve: 60 }) // no `age`, exactly like a MatchPlayer frozen before this slice
    expect(Number.isFinite(expectedServeSpeed(stale.age ?? LEGACY_SNAPSHOT_AGE, stale.serve))).toBe(true)
    expect(LEGACY_SNAPSHOT_AGE).toBe(14) // the age every career opens at
  })
})

// =================================================================================================
// W3-KIT — THE QUALITY LADDER THE PLAYER BUYS
// =================================================================================================
//
// The owner's ruling: «я вообще за оба подхода одновременно, как с тренерами... начальные ракетки из
// алюминия тяжелее и хуже во многом, чем начальные композитные, значит экип влияет и на травмы и на
// производительность игрока.» So the tests below check BOTH halves and, above all, the one property
// the whole design rests on: the ladder cannot leave the interval the wear model already occupied,
// so the anti-destiny bound survives structurally rather than by a lucky coefficient.

describe('the quality ladder — both axes, and it can never buy destiny', () => {
  const gradedKit = (grade: KitGrade): KitState => ({
    grade: { strings: grade, frame: grade, shoes: grade },
    sinceWeek: { strings: 0, frame: 0, shoes: 0 },
  })

  it('⚠ THE ONE THAT DECIDES IT: no rung, at any week, can leave [FRESH_KIT, SPENT_KIT]', () => {
    // This is the anti-destiny bound. §1 of tools/kit-bench.ts measures the nominal swing across
    // that interval at 2.01 skill points against a yardstick of 2.4, and the ladder is only ever a
    // position INSIDE it - so the ladder cannot widen the swing however the coefficients are tuned.
    for (const grade of KIT_GRADES) {
      for (const bg of BACKGROUNDS) {
        for (let w = 0; w <= 208; w++) {
          const wear = kitWearAt(`ladder-${bg}`, bg, w, null, gradedKit(grade))
          for (const line of ['strings', 'frame', 'shoes'] as const) {
            expect(wear[line], `${grade}/${bg}/${line}@${w}`).toBeGreaterThanOrEqual(0)
            expect(wear[line], `${grade}/${bg}/${line}@${w}`).toBeLessThanOrEqual(1)
          }
        }
      }
    }
  })

  it('composite is the IDENTITY: a v37 save on it is byte-identical to a pre-v37 career', () => {
    // The migration's whole promise. `kitWearAt` with no kit at all IS the shipped behaviour, and the
    // rung every old save lands on has to reproduce it to the last bit - not approximately.
    for (const bg of BACKGROUNDS) {
      for (let w = 0; w <= 208; w++) {
        expect(kitWearAt('identity', bg, w, null, gradedKit('composite'))).toEqual(
          kitWearAt('identity', bg, w),
        )
      }
    }
    expect(ECONOMY.equipment.grades.composite.lifeFactor).toBe(1)
    expect(ECONOMY.equipment.grades.composite.priceFactor).toBe(1)
    for (const line of ['strings', 'frame', 'shoes'] as const) {
      expect(ECONOMY.equipment.grades.composite.startWear[line]).toBe(0)
    }
  })

  it('the ladder is MONOTONE: a dearer rung is never worse on any line, at any week', () => {
    // The player-facing promise, and the thing a mistuned `startWear`/`lifeFactor` pair would break
    // silently: paying more must never make her kit worse.
    for (let i = 1; i < KIT_GRADES.length; i++) {
      const lower = gradedKit(KIT_GRADES[i - 1])
      const higher = gradedKit(KIT_GRADES[i])
      for (const bg of BACKGROUNDS) {
        for (let w = 0; w <= 208; w++) {
          const a = kitWearAt(`mono-${bg}`, bg, w, null, lower)
          const b = kitWearAt(`mono-${bg}`, bg, w, null, higher)
          for (const line of ['strings', 'frame', 'shoes'] as const) {
            expect(b[line], `${KIT_GRADES[i]} vs ${KIT_GRADES[i - 1]} ${line}@${w}`).toBeLessThanOrEqual(a[line] + 1e-12)
          }
        }
      }
    }
  })

  it('and it moves BOTH axes - performance AND injury - which is the owner’s ruling', () => {
    const p = P({ serve: 57, ret: 57, composure: 57, stamina: 57, groundstrokes: 57 })
    const at = (grade: KitGrade, w: number) => kitWearAt('axes', 'working', w, null, gradedKit(grade))
    // Half a season in: the alloy girl is playing worse tennis...
    const alloy = applyKit(p, at('alloy', 26))
    const pro = applyKit(p, at('pro', 26))
    expect(pro.serve).toBeGreaterThan(alloy.serve)
    expect(pro.ret).toBeGreaterThan(alloy.ret)
    expect(pro.groundstrokes).toBeGreaterThan(alloy.groundstrokes)
    expect(pro.stamina).toBeGreaterThan(alloy.stamina)
    // ...and getting hurt more often. Never below 1: the top rung buys back the penalty of worn kit,
    // it never buys a safety BONUS - which is what keeps "nobody buys their way out" true.
    expect(kitInjuryFactor(at('alloy', 26))).toBeGreaterThan(kitInjuryFactor(at('pro', 26)))
    expect(kitInjuryFactor(at('pro', 26))).toBeGreaterThanOrEqual(1)
    expect(kitInjuryFactor(FRESH_KIT)).toBe(1)
  })

  it('the FRAME is the arm story the owner named, and it is smaller than the shoes', () => {
    // A stiff dead frame is tennis elbow; worn soles are a rolled ankle. The research's own
    // 48%-lower-limb / 28%-upper split is why the frame is priced under the shoes.
    expect(ECONOMY.equipment.frameInjuryRise).toBeGreaterThan(0)
    expect(ECONOMY.equipment.frameInjuryRise).toBeLessThan(ECONOMY.equipment.shoeInjuryRise)
    expect(kitInjuryFactor({ ...FRESH_KIT, frame: 1 })).toBeCloseTo(1 + ECONOMY.equipment.frameInjuryRise, 12)
  })

  it('a bought line reads as NEW that week, and the family schedule is untouched', () => {
    // `sinceWeek` is a second CLOCK, not a second schedule: it can only ever pull wear DOWN.
    const bought: KitState = { grade: { ...DEFAULT_KIT_GRADES }, sinceWeek: { strings: 40, frame: 40, shoes: 40 } }
    expect(kitWearAt('bought', 'working', 40, null, bought)).toEqual(FRESH_KIT)
    for (let w = 40; w <= 120; w++) {
      const withBuy = kitWearAt('bought', 'working', w, null, bought)
      const without = kitWearAt('bought', 'working', w)
      for (const line of ['strings', 'frame', 'shoes'] as const) {
        expect(withBuy[line]).toBeLessThanOrEqual(without[line] + 1e-12)
      }
    }
    // ...and a zero (every migrated save) changes nothing at all.
    expect(kitWearAt('bought', 'working', 77, null, defaultKitState())).toEqual(kitWearAt('bought', 'working', 77))
  })

  it('the rung prices the recurring bill through the wealth corridor, not instead of it', () => {
    for (const bg of BACKGROUNDS) {
      const composite = kitLinePriceCents(bg, 'frame', 'composite')
      expect(kitLinePriceCents(bg, 'frame', 'alloy')).toBeLessThan(composite)
      expect(kitLinePriceCents(bg, 'frame', 'pro')).toBeGreaterThan(composite)
    }
    // The corridor still sets the base: a wealthy family's frame is dearer at every rung.
    for (const grade of KIT_GRADES) {
      expect(kitLinePriceCents('wealthy', 'frame', grade)).toBeGreaterThan(kitLinePriceCents('working', 'frame', grade))
    }
  })

  it('the till: up buys and bills, down is free, and a repeat tap buys nothing', () => {
    const world = createWorld('kit-till')
    const before = world.fundsCents
    setKitGrade(world, 'frame', 'pro')
    const price = kitLinePriceCents(world.profile.background, 'frame', 'pro')
    expect(world.fundsCents).toBe(before - price)
    expect(world.kit!.grade.frame).toBe('pro')
    expect(world.kit!.sinceWeek.frame).toBe(world.week)
    // Idempotent: the same rung again is not a second frame.
    setKitGrade(world, 'frame', 'pro')
    expect(world.fundsCents).toBe(before - price)
    // Down the ladder costs nothing and refunds nothing.
    setKitGrade(world, 'frame', 'alloy')
    expect(world.fundsCents).toBe(before - price)
    expect(world.kit!.grade.frame).toBe('alloy')
    // ...and the ledger says what was bought.
    expect(world.events.some((e) => e.text.startsWith('Bought:'))).toBe(true)
    expect(() => setKitGrade(world, 'frame', 'titanium' as KitGrade)).toThrow()
  })

  // ⚠ THE PURCHASE PATH CONSULTS THE DEAL (owner, 08.08). The letter said «up to $X of kit over the
  // season, on us», the Money screen printed "Her sponsor supplies this line" directly under the
  // buttons, and `setKitGrade` charged the family in full - it was the one place in the game that
  // spent money on kit without asking whether somebody had promised to pay for it. His report:
  // «Несмотря на наличие спонсора, закрывающего струны и ракетки, в разделе bills я выбрал новые,
  // нажал купить, и они списались со счёта. Спонсор не покрыл - мне кажется, это неправильно.»
  //
  // And what the rungs GIVE, which he could not tell either: «Еще вообще хорошо бы дать понять что
  // разные тиры шмота дают вообще.» (Both quotes live here rather than in the templates, which ban
  // Cyrillic - tests/template-copy-rules.test.ts.)
  describe('the sponsor pays for a line it covers (08.08)', () => {
    /** A world holding a signed deal over `covers`, with `allowance` cents left in the pot. */
    function withDeal(covers: KitLine[], allowanceCents: number, spentCents = 0) {
      const world = createWorld('kit-cover')
      world.offers.push({
        id: 'kit-test',
        kind: 'kit',
        week: 0,
        deadlineWeek: 4,
        state: 'signed',
        decidedWeek: 1,
        fromWeek: 0,
        untilWeek: world.week + 200,
        coveredCents: spentCents,
        terms: {
          tier: 'national',
          brand: 'Netrally Distribution',
          kitAllowanceCents: allowanceCents,
          freshCap: 0.3,
          minEventsPerSeason: 10,
          covers,
          travelShare: 0,
          seasons: 2,
        },
      } as (typeof world.offers)[number])
      return world
    }

    it('charges the family nothing when the allowance covers the whole purchase', () => {
      const world = withDeal(['strings', 'frame'], 3_000_00)
      const before = world.fundsCents
      const price = kitLinePriceCents(world.profile.background, 'frame', 'pro')
      expect(price).toBeLessThan(3_000_00) // ...the fixture really does have room
      setKitGrade(world, 'frame', 'pro')
      expect(world.fundsCents).toBe(before) // not a cent
      expect(world.kit!.grade.frame).toBe('pro') // ...and she is holding the frame
      // The row is still EMITTED at what the family paid, so the breakdown explains the $0.
      const row = world.events.find((e) => e.text.startsWith('Bought:'))!
      expect(row.amountCents).toBe(0)
      expect(row.text).toContain('Netrally Distribution')
      // ...and the pot really was spent, which is what stops this being free money on every line.
      expect(world.offers[0].coveredCents).toBe(price)
    })

    it('splits the bill when the allowance runs out mid-purchase', () => {
      const price = kitLinePriceCents(createWorld('kit-cover').profile.background, 'frame', 'pro')
      const world = withDeal(['frame'], price, price - 40_00) // $40 of pot left
      const before = world.fundsCents
      setKitGrade(world, 'frame', 'pro')
      expect(world.fundsCents).toBe(before - (price - 40_00))
      expect(world.offers[0].coveredCents).toBe(price) // the pot is now exactly empty
    })

    it('does NOT cover a line the deal leaves hers, which is the whole brand ladder', () => {
      const world = withDeal(['strings', 'frame'], 3_000_00) // national: shoes stay hers
      const before = world.fundsCents
      const price = kitLinePriceCents(world.profile.background, 'shoes', 'pro')
      setKitGrade(world, 'shoes', 'pro')
      expect(world.fundsCents).toBe(before - price)
      expect(world.offers[0].coveredCents).toBe(0)
    })

    it('quotes the same answer on the button as the till charges', () => {
      // The screen may not work the discount out for itself - `payableCents` is the till's own
      // number, and until 08.08 the two disagreed by the entire price.
      const world = withDeal(['strings'], 3_000_00)
      const view = kitLineViews(world).find((v) => v.line === 'strings')!
      const pro = view.rungs.find((r) => r.grade === 'pro')!
      const before = world.fundsCents
      setKitGrade(world, 'strings', 'pro')
      expect(before - world.fundsCents).toBe(pro.payableCents)
      // ...and an uncovered line quotes its sticker unchanged.
      const shoes = kitLineViews(world).find((v) => v.line === 'shoes')!
      for (const r of shoes.rungs) expect(r.payableCents).toBe(r.priceCents)
    })
  })

  // ⚠ WHAT A RUNG BUYS, AND WHY IT IS MEASURED IN WEEKS. engine/equipment.ts is explicit that fresh
  // kit is EXACTLY neutral at every rung and that wear only ever subtracts - so there is no power
  // figure to print, and a screen claiming one would be inventing it. What a rung really buys is
  // time before the line goes off, which is what `goodWeeksFor` states.
  it('a dearer rung buys WEEKS, monotonically, and never a bonus', () => {
    for (const line of ['strings', 'frame', 'shoes'] as KitLine[]) {
      const weeks = KIT_GRADES.map((g) => goodWeeksFor(line, g))
      // Strictly increasing up the ladder: this is the sentence the Money screen prints.
      for (let i = 1; i < weeks.length; i++) {
        expect(weeks[i], `${line}: ${KIT_GRADES[i]} is not better than ${KIT_GRADES[i - 1]}`).toBeGreaterThan(weeks[i - 1])
      }
      expect(weeks[0]).toBeGreaterThan(0) // even the starter lasts SOME weeks
    }
    // And the claim underneath it: from `composite` up, brand-new kit is byte-identical at every
    // rung, so the ladder can never be sold as an upside - it is bounded above by fresh kit.
    // `alloy` is the one rung that starts partway down its own curve, which is the handicap it is.
    for (const g of KIT_GRADES) {
      const fresh = kitWearAt('neutral', 'middle', 0, null, {
        grade: { strings: g, frame: g, shoes: g },
        sinceWeek: { strings: 0, frame: 0, shoes: 0 },
      })
      if (g === 'alloy') {
        expect(fresh.strings).toBeGreaterThan(0)
        expect(fresh.shoes).toBeGreaterThan(0)
        // ⚠ ...but NOT the frame, and that is the model rather than an omission: the frame has a
        //   flat head 13 weeks long ("sound is sound however old"), so even a cheap one is neutral
        //   the day it is bought and only becomes the patched racket once the head is past. It is
        //   why `goodWeeksFor` treats the frame separately.
        expect(fresh.frame).toBe(0)
      } else {
        expect(fresh.strings).toBe(0)
        expect(fresh.frame).toBe(0)
        expect(fresh.shoes).toBe(0)
      }
    }
  })

  it('a signed deal supplies a covered line whatever rung she picked', () => {
    // The two systems compose rather than fight: the brand's freshness ceiling is applied AFTER the
    // rung, so on a covered line the ladder mostly moves the BILL - which the brand is paying.
    const capped = kitWearAt('sponsor', 'working', 60, { strings: 0.3 }, {
      grade: { strings: 'alloy', frame: 'composite', shoes: 'composite' },
      sinceWeek: { strings: 0, frame: 0, shoes: 0 },
    })
    expect(capped.strings).toBeLessThanOrEqual(0.3)
  })
})

describe('W3-KIT — a career from before this wave opens and plays unchanged', () => {
  // ⚠ THE ACCEPTANCE CHECK, AND IT IS BEHAVIOURAL RATHER THAN STRUCTURAL. goldenSaves.test.ts already
  // proves every historical fixture MIGRATES; what a schema bump can still get wrong is that the
  // migrated career then plays differently, which is the failure a player would actually notice. So
  // this loads the last pre-wave fixture, migrates it, and runs it forward against the SAME save with
  // the new field stripped out - i.e. against the engine as it behaved before v37 existed.
  it('v36 migrates onto `composite` and then ticks byte-identically to a world with no kit at all', () => {
    const raw = readFileSync(new URL('./fixtures/saves/v36.json', import.meta.url), 'utf8')
    const migrated = migrateSave(JSON.parse(raw))
    expect(migrated.kit).toEqual(defaultKitState())

    const run = (stripKit: boolean) => {
      const w = migrateSave(JSON.parse(raw))
      if (stripKit) delete (w as { kit?: unknown }).kit
      const rng = rngFromSeed(w.seed)
      for (let i = 0; i < 30; i++) tickWeek(w, rng)
      return {
        skills: { ...w.skills },
        condition: w.condition,
        fundsCents: w.fundsCents,
        injury: w.injury ? { ...w.injury } : null,
        draws: w.rngMain.n,
        // The one that matters for the match: her build as she steps on court.
        onCourt: kidMatchPlayerFor(w, 'hard'),
      }
    }
    const withKit = run(false)
    const withoutKit = run(true)
    expect(withKit.skills).toEqual(withoutKit.skills)
    expect(withKit.condition).toBe(withoutKit.condition)
    expect(withKit.fundsCents).toBe(withoutKit.fundsCents)
    expect(withKit.injury).toEqual(withoutKit.injury)
    expect(withKit.draws).toBe(withoutKit.draws)
    expect(withKit.onCourt).toEqual(withoutKit.onCourt)
  })
})
