import { describe, it, expect } from 'vitest'
import {
  applyKit,
  FRESH_KIT,
  SPENT_KIT,
  kitInjuryFactor,
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
import { createWorld, kidMatchPlayerFor, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import type { FamilyBackground } from '../src/shared/protocol'
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

  it('the injury half is background-NEUTRAL by construction: nobody buys out of a rolled ankle', () => {
    // Shoe cadence is 10-14 for every family; only the price differs (ECONOMY.gear.shoes).
    for (const bg of BACKGROUNDS) {
      expect(ECONOMY.gear.shoes.cadenceWeeks[bg]).toEqual(ECONOMY.gear.shoes.cadenceWeeks.working)
    }
    for (let w = 0; w <= 120; w++) {
      const working = kitInjuryFactor(kitWearAt('inj', 'working', w))
      for (const bg of BACKGROUNDS) expect(kitInjuryFactor(kitWearAt('inj', bg, w))).toBe(working)
    }
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
