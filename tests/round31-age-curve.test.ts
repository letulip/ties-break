import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, kidAgeExact, answerFork, SAVE_SCHEMA_VERSION } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { growAndLive } from '../src/engine/world/phaseGrowth'
import { recoveryAgeFade } from '../src/engine/world/medical'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import {
  ageCurveOf,
  ageFactor,
  declineFactor,
  declineSpreadOf,
  injuryPullYears,
  physicalMean,
  resolveAgeCurve,
} from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { ENDINGS, weeksLostSoFar } from '../src/engine/ending'
import { COHORT, aiDeclineFactor, aiDeclineStart, generateCohort } from '../src/engine/season/cohort'
import { migrateSave } from '../src/engine/migrations'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

// ⭐⭐⭐ ROUND 31 #10 + #13 – THE AGE CURVE STOPS BEING ONE CURVE.
//
// The engine peaked every career 23-28, and §10 of the round measured that against the owner's own
// WTA reference: it is EXACTLY the college window («25-28 via college») worn by everybody, and two
// to four years late for a girl who went straight to the tour («24-26 direct»). His ruling, 31.08:
// «я думал уже так и есть, но тоже неплохо звучит» – he believed the fork already did this.
//
// Three things move the curve now, and a fourth thing pins it:
//   1. THE ROUTE, from the fork's own answer – direct 22/27, college 23/29 unchanged.
//   2. A PER-CAREER SPREAD of ±1.5 years on `declineStart`, one draw off `seed:decline`.
//   3. THE WEEKS HER BODY HAS LOST, pulling it earlier – 1 year per 40 weeks off court.
//   4. AND `WorldState.ageCurve`, the persisted pair, which the v68 migration writes onto every save
//      that already exists so that the owner's LIVE career (week 933, 31.7, 93.1% of her peak) does
//      not have its clock moved under it mid-game.
//
// ⚠ EVERY ASSERTION HERE IS ABOUT A NUMBER THE ENGINE PRODUCES. Nothing reads a string, a comment or
// a source region; the walked cases go through `growAndLive`, which is the shipped growth phase and
// the only writer of `world.skills`.
//
// ⚠ RNG: the spread is ONE draw off `seed:decline`, a purpose-scoped sub-stream keyed on the seed
// alone – no week, no player input – and the cohort's is `seed:decline:<id>`, derived per read and
// never stored. Nothing here touches MAIN, so the frozen capture (41550 / e6b0c709) cannot move.

const CURVE = ECONOMY.development.ageCurve
const ROUTES = ECONOMY.development.ageRoutes

const ageOf = (world: WorldState): number =>
  kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)

function bornAt(seed: string) {
  const world = createWorld(seed, DEFAULT_PROFILE)
  return { world, rng: rngFromSeed(world.seed) }
}

/** ONE WEEK OF THE REAL GROWTH PHASE – `peak-physical.test.ts`'s harness, and the same argument for
 *  it: reaching the decline is a decade and a half of weeks, and this is `tickWeek`'s own opening
 *  statement plus the only phase that writes `world.skills`. */
function stepGrowth(world: WorldState, rng: Rng): void {
  world.week += 1
  growAndLive(world, rng)
}
function walkTo(world: WorldState, rng: Rng, age: number): void {
  while (ageOf(world) < age) stepGrowth(world, rng)
}

const seeds = (n: number, tag = 'r31curve') => Array.from({ length: n }, (_, i) => `${tag}-${i}`)

describe('round 31 #10 – the fork shapes the curve', () => {
  it('gives the two routes different pairs, and the college one is TODAY’S pair unchanged', () => {
    // ⚠ THE COLLEGE PAIR IS THE SHIPPED PAIR. This is the half that must not move: the owner's own
    // career went through college, so a college career reads the curve it has always read.
    expect(ROUTES.college.plateauStart).toBe(CURVE.plateauStart)
    expect(ROUTES.college.declineStart).toBe(CURVE.declineStart)
    // ...and the direct route lands inside his own «24-26 direct» window rather than beside it: a
    // plateau that ends at 26 is a peak of 22-26.
    expect(ROUTES.direct.plateauStart).toBe(22)
    expect(ROUTES.direct.declineStart).toBe(27)
    expect(ROUTES.college.declineStart - ROUTES.direct.declineStart, 'the fork is worth two years').toBe(2)
  })

  it('resolves the SAME career two ways, and the gap is exactly the route gap', () => {
    for (const seed of seeds(50)) {
      const d = resolveAgeCurve(seed, 'direct')
      const c = resolveAgeCurve(seed, 'college')
      expect(c.declineStart - d.declineStart, seed).toBeCloseTo(2, 12)
      expect(d.plateauStart).toBe(22)
      expect(c.plateauStart).toBe(23)
    }
  })

  it('is written by `answerFork`, once, and by the answer the player gave', () => {
    for (const [answer, route] of [
      ['continue', 'direct'],
      ['stop', 'direct'],
      ['college', 'college'],
    ] as const) {
      const { world } = bornAt(`fork-${answer}`)
      // ⚠ ABSENT BEFORE THE ANSWER, AND THIS LINE IS THE FROZEN-HASH GUARANTEE. `createWorld` does
      // not write the key, so a career that never reaches nineteen never carries one – which is why
      // the eighteen frozen career hashes (156 weeks, age 16.6) did not move.
      expect('ageCurve' in world, `${answer}: nothing is written at birth`).toBe(false)
      world.fork = { askedWeek: world.week, answer: null, offer: null }
      answerFork(world, answer)
      expect(world.ageCurve, answer).toEqual({ ...resolveAgeCurve(world.seed, route), injuryFrom: 0 })
    }
  })

  it('...and the fork cannot be answered twice, so the curve cannot drift', () => {
    const { world } = bornAt('fork-once')
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    answerFork(world, 'continue')
    const written = { ...world.ageCurve! }
    expect(() => answerFork(world, 'college')).toThrow()
    expect(world.ageCurve).toEqual(written)
  })
})

describe('round 31 #13 – a spread, so the age she stops is not one number', () => {
  it('spreads across the whole band and nowhere outside it', () => {
    const drawn = seeds(600).map((s) => resolveAgeCurve(s, 'direct').declineStart)
    const lo = ROUTES.direct.declineStart - ECONOMY.development.declineSpreadYears
    const hi = ROUTES.direct.declineStart + ECONOMY.development.declineSpreadYears
    for (const d of drawn) {
      expect(d).toBeGreaterThanOrEqual(lo)
      expect(d).toBeLessThanOrEqual(hi)
    }
    // ...and it is a SPREAD and not a constant: measured sd is 0.87 on 4000 seeds
    // (`npm run bench:agecurve`), so a floor at 0.6 fails on a collapse and not on a sample.
    const mean = drawn.reduce((a, b) => a + b, 0) / drawn.length
    const sd = Math.sqrt(drawn.reduce((a, b) => a + (b - mean) ** 2, 0) / drawn.length)
    expect(sd, 'the band is a band').toBeGreaterThan(0.6)
    expect(mean, 'and it is centred on the route').toBeCloseTo(ROUTES.direct.declineStart, 1)
    expect(new Set(drawn.map((d) => d.toFixed(3))).size, 'not a handful of buckets').toBeGreaterThan(500)
  })

  it('is one draw off `seed:decline`, and the same career always draws the same number', () => {
    for (const seed of seeds(20)) {
      expect(resolveAgeCurve(seed, 'direct').declineStart - ROUTES.direct.declineStart).toBeCloseTo(
        declineSpreadOf(seed),
        12,
      )
      expect(declineSpreadOf(seed), 'asked twice, answered the same').toBe(declineSpreadOf(seed))
    }
    // ⚠ THE KEY CARRIES NO WEEK AND NO PLAYER INPUT, which is what lets the curve be resolved at the
    // fork rather than at week 0 and still be the same number.
    expect(declineSpreadOf('a')).not.toBe(declineSpreadOf('b'))
  })

  it('the routes OVERLAP, so the fork moves the odds and is not strictly dominant', () => {
    const direct = seeds(400).map((s) => resolveAgeCurve(s, 'direct').declineStart)
    const college = seeds(400).map((s) => resolveAgeCurve(s, 'college').declineStart)
    const earliestCollege = Math.min(...college)
    expect(
      direct.filter((d) => d > earliestCollege).length,
      'some direct careers last longer than some college ones',
    ).toBeGreaterThan(0)
  })
})

describe('round 31 #13 – injury history pulls it earlier, in years and not weeks', () => {
  it('a clean career sits at exactly the value it drew', () => {
    const drawn = { ...resolveAgeCurve('clean', 'college'), injuryFrom: 0 }
    expect(ageCurveOf(drawn, 0).declineStart).toBe(drawn.declineStart)
    expect(injuryPullYears(0)).toBe(0)
  })

  it('a badly broken one loses YEARS – the bar the ruling set', () => {
    const drawn = { ...resolveAgeCurve('broken', 'college'), injuryFrom: 0 }
    // 40 weeks off court is one year of peak. A season lost is most of a year; three are three.
    expect(drawn.declineStart - ageCurveOf(drawn, 40).declineStart).toBeCloseTo(1, 9)
    expect(drawn.declineStart - ageCurveOf(drawn, 120).declineStart).toBeCloseTo(3, 9)
    // ⚠ AND A HANDFUL OF WEEKS IS A HANDFUL OF WEEKS – the other half of "years, not weeks". A knock
    // that cost her five weeks must not read as a lost season.
    expect(drawn.declineStart - ageCurveOf(drawn, 5).declineStart).toBeLessThan(0.2)
  })

  it('counts only the weeks lost AFTER the mark – which is what pins a migrated career', () => {
    const drawn = { ...resolveAgeCurve('marked', 'college'), injuryFrom: 60 }
    expect(ageCurveOf(drawn, 60).declineStart, 'at the mark, nothing is charged').toBe(drawn.declineStart)
    expect(ageCurveOf(drawn, 30).declineStart, 'and below it nothing is credited either').toBe(drawn.declineStart)
    expect(drawn.declineStart - ageCurveOf(drawn, 100).declineStart).toBeCloseTo(1, 9)
  })

  it('never falls below the plateau, however wrecked the body', () => {
    const drawn = { ...resolveAgeCurve('wreck', 'direct'), injuryFrom: 0 }
    const floored = ageCurveOf(drawn, 10_000)
    expect(floored.declineStart).toBe(floored.plateauStart + 1)
    // ⚠ A CORRECTNESS GUARD AND NOT A DIAL: `ageFactor` reads `plateauStart` first, so a decline age
    // under the plateau would put a career in a band that is still climbing and already falling.
    expect(ageFactor(floored.plateauStart + 0.5, floored)).toBe(CURVE.plateauRate)
    expect(declineFactor(floored.plateauStart + 0.5, floored)).toBe(0)
  })
})

describe('the engine reads the per-career curve, and which readers follow it', () => {
  it('a direct career is already declining at an age a college one is still at its peak', () => {
    const direct = { ...resolveAgeCurve('reader', 'direct'), injuryFrom: 0 }
    const college = { ...resolveAgeCurve('reader', 'college'), injuryFrom: 0 }
    // ⚠ THE AGE IS TAKEN FROM THE PAIR AND NOT WRITTEN DOWN. The two routes are exactly two years
    // apart FOR THE SAME SEED, but the band is ±1.5 so the two ranges overlap – there is no fixed
    // age that sits in the gap for every career, which is the shape the overlap case above pins.
    // Midway between HER two answers always does.
    const at = direct.declineStart + 1
    expect(direct.declineStart).toBeLessThan(at)
    expect(college.declineStart).toBeGreaterThan(at)
    expect(declineFactor(at, ageCurveOf(direct, 0)), 'direct: losing').toBeGreaterThan(0)
    expect(declineFactor(at, ageCurveOf(college, 0)), 'college: not yet').toBe(0)
    expect(ageFactor(at, ageCurveOf(direct, 0)), 'direct: no longer gaining').toBe(0)
    expect(ageFactor(at, ageCurveOf(college, 0)), 'college: still maintaining').toBe(CURVE.plateauRate)
  })

  it('...and the SHIPPED GROWTH PHASE produces it: the same career, walked, peaks earlier on the direct route', () => {
    // ⚠ ONE INPUT DIFFERS. Same seed, same profile, same weeks, same MAIN stream – the world is
    // handed the direct pair in one arm and the college pair in the other, and nothing else moves.
    const built = (route: 'direct' | 'college') => {
      const { world, rng } = bornAt('walked-arc')
      world.ageCurve = { ...resolveAgeCurve(world.seed, route), injuryFrom: 0 }
      let peak = 0
      let peakAge = 0
      while (ageOf(world) < 32) {
        stepGrowth(world, rng)
        const now = physicalMean(world.skills)
        if (now > peak) {
          peak = now
          peakAge = ageOf(world)
        }
      }
      return { peak, peakAge, at30: physicalMean(world.skills) }
    }
    const d = built('direct')
    const c = built('college')
    expect(d.peakAge, 'the direct career tops out first').toBeLessThan(c.peakAge)
    expect(c.peakAge - d.peakAge, 'and by about the route gap').toBeCloseTo(2, 0)
    expect(c.at30, 'so at 32 she is further along the decline on the direct route').toBeGreaterThan(d.at30)
  })

  it('THE RECOVERY GATE FOLLOWS THE PER-CAREER VALUE – a deliberate choice, and this is it', () => {
    // ⭐ `world/medical.ts` gates the recovery fade on the decline age. Its own note says two clocks
    // there «would open a gap of up to a year in which her body is falling and her recovery is not»;
    // on a direct career the constant would open that gap permanently, for two years. So the gate
    // reads `ageCurveOf`, and this case is what says so.
    const build = (route: 'direct' | 'college' | null) => {
      const { world, rng } = bornAt('fade-gate')
      if (route) world.ageCurve = { ...resolveAgeCurve(world.seed, route), injuryFrom: 0 }
      walkTo(world, rng, 28)
      return recoveryAgeFade(world)
    }
    expect(build('direct'), 'a direct career at 28 is past her decline and recovers slower').toBeLessThan(1)
    expect(build('college'), 'a college career at 28 is not').toBe(1)
    // ...and the junior-era guarantee the gate exists for is untouched: no stored curve reads 29.
    expect(build(null), 'an unresolved career reads the shipped curve exactly').toBe(1)
  })

  it('THE RETIREMENT QUESTION DOES NOT – it opens at 29 for everybody, on purpose', () => {
    // ⭐ The ask is SOCIAL, not physical: `ENDINGS.lastOfferPeakShare` is the half that reads her
    // body and always has, and `RetirementDialog`'s owner-approved lede says «Twenty-nine is when the
    // question starts being asked» – copy an agent may not move (CLAUDE.md invariant 4). A direct
    // career therefore declines about two years before anybody offers her the door, and that gap is
    // the design rather than an oversight.
    expect(ENDINGS.askFromAgeYears).toBe(29)
    expect(ENDINGS.askFromAgeYears).toBe(CURVE.declineStart)
    const direct = ageCurveOf({ ...resolveAgeCurve('ask-age', 'direct'), injuryFrom: 0 }, 0)
    expect(direct.declineStart, 'her body goes first').toBeLessThan(ENDINGS.askFromAgeYears)
  })
})

describe('the cohort gets the spread too – one base, no fork', () => {
  it('every rival has a decline age of her own, inside the band', () => {
    const cohort = generateCohort('cohort-spread')
    const drawn = cohort.map((p) => aiDeclineStart('cohort-spread', p.id))
    for (const d of drawn) {
      expect(d).toBeGreaterThanOrEqual(COHORT.ageCurve.declineStart - COHORT.declineSpreadYears)
      expect(d).toBeLessThanOrEqual(COHORT.ageCurve.declineStart + COHORT.declineSpreadYears)
    }
    const mean = drawn.reduce((a, b) => a + b, 0) / drawn.length
    const sd = Math.sqrt(drawn.reduce((a, b) => a + (b - mean) ** 2, 0) / drawn.length)
    expect(sd, 'a field, not a class that ages together').toBeGreaterThan(0.6)
    expect(new Set(drawn.map((d) => d.toFixed(4))).size, 'one value each').toBe(cohort.length)
  })

  it('...keyed on the WORLD and on her, so the same slot is a different body in a different career', () => {
    expect(aiDeclineStart('world-a', 'ai-3')).not.toBeCloseTo(aiDeclineStart('world-b', 'ai-3'), 6)
    expect(aiDeclineStart('world-a', 'ai-3')).toBe(aiDeclineStart('world-a', 'ai-3'))
  })

  it('and it REACHES the curve: at one age some rivals are declining and others are not', () => {
    const cohort = generateCohort('cohort-bite')
    const at = COHORT.ageCurve.declineStart // 29: half the band is under it and half over
    const declining = cohort.filter((p) => aiDeclineFactor(at, aiDeclineStart('cohort-bite', p.id)) > 0)
    expect(declining.length, 'some have started').toBeGreaterThan(cohort.length / 5)
    expect(declining.length, '...and some have not').toBeLessThan((cohort.length * 4) / 5)
  })
})

describe('⭐⭐⭐ v68 – the pin, which is what the version move is FOR', () => {
  const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
  const FILES = readdirSync(DIR).filter((f) => /^v\d+\.json$/.test(f))

  it('every save that already exists wakes up on the curve it went to sleep on', () => {
    // ⚠⚠ THE OWNER IS PLAYING A CAREER. Alice is at week 933, 31.7, standing at 93.1% of her peak –
    // a decline he has been reading for a season. A curve re-derived from her seed on the next load
    // would hand her some other decline age and re-shape her remaining seasons under her. So the
    // migration writes the shipped pair onto every existing save and nothing re-derives a stored one.
    for (const file of FILES) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8')))
      expect(migrated.schemaVersion, file).toBe(SAVE_SCHEMA_VERSION)
      expect(migrated.ageCurve, `${file}: the pin is present`).toBeDefined()
      expect(migrated.ageCurve!.plateauStart, file).toBe(23)
      expect(migrated.ageCurve!.declineStart, file).toBe(29)
      // ...and the resolved reading is 29 EXACTLY, however many weeks that career has already lost –
      // which is the other half of "today's behaviour" and the reason `injuryFrom` exists.
      expect(ageCurveOf(migrated.ageCurve, weeksLostSoFar(migrated)).declineStart, `${file}: reads 29 today`).toBe(29)
      expect(migrated.ageCurve!.injuryFrom, file).toBe(weeksLostSoFar(migrated))
    }
  })

  it('...and only the weeks it loses AFTER the update pull it earlier', () => {
    const migrated = migrateSave(JSON.parse(readFileSync(`${DIR}/v67.json`, 'utf8')))
    const already = weeksLostSoFar(migrated)
    expect(already, 'this fixture has a real injury history, or the case proves nothing').toBeGreaterThan(0)
    expect(ageCurveOf(migrated.ageCurve, already).declineStart).toBe(29)
    expect(ageCurveOf(migrated.ageCurve, already + 40).declineStart).toBeCloseTo(28, 9)
  })

  it('is idempotent – migrating twice writes the same pin', () => {
    const once = migrateSave(JSON.parse(readFileSync(`${DIR}/v67.json`, 'utf8')))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(twice.ageCurve).toEqual(once.ageCurve)
  })

  it('an unresolved career reads the shipped curve and CANNOT be moved by an injury', () => {
    // The pre-fork default. `plateauStart` first bites at 18 and `declineStart` at 22, so a career
    // that has not answered the fork is younger than either – and the absence is what keeps the
    // frozen career hashes still.
    expect(ageCurveOf(undefined, 0)).toEqual({ plateauStart: CURVE.plateauStart, declineStart: CURVE.declineStart })
    expect(ageCurveOf(undefined, 500)).toEqual({ plateauStart: CURVE.plateauStart, declineStart: CURVE.declineStart })
  })
})
