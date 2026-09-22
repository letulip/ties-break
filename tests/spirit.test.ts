// THE PRIVATE LIFE'S TWO NUMBERS – the nets for engine/spirit.ts, its constants, its call site, its
// match seam and its schema move (v72).
//
// ⚠ THE ONE THAT MATTERS MOST IS THE ORDER PIN. `accrueSpirit` runs the RETURN first, off LAST
// week's value, and only then this week's perturbation. Every row below is therefore asserted FROM
// BASELINE and expects the FULL scaled delta – a test that would also pass under the reversed
// (perturb-then-return) order is not this test, because under that order a steady girl's vacation
// (+5 × 0.8 = +4) meets the same-tick return of 4 and vanishes. Each row's expectation is exactly
// the value the reversed order CANNOT produce.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  accrueSpirit,
  applyBondDelta,
  bondBandOf,
  moodRegisterOf,
  seasonWrapsWithNoVacation,
  spiritBandOf,
  spiritMatchFactor,
  temperamentFor,
  temperamentIntensity,
  MOOD_WORD,
  SPIRIT_BANDS,
  TEMPERAMENTS,
  type SpiritBand,
  type Temperament,
} from '../src/engine/spirit'
// ⭐ v72 step 4: the face the two ladders collide on, and the two rung counts they collide by.
import {
  MOOD_DEVIATION,
  MOOD_FACE,
  avatarEmotionRead,
  conditionDeviation,
  idleEmotion,
} from '../src/shared/avatarEmotion'
import { BIRTHDAY_ASK_TILT, birthdayOffer } from '../src/engine/world/birthday'
import { ECONOMY } from '../src/engine/economy'
import { createWorld, decideKnock, chooseGift, pendingBirthday, birthdayOfferFor } from '../src/engine/world'
import { resolveVacation } from '../src/engine/world/planner'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { BIRTHDAY_TIME_TOGETHER, BIRTHDAY_TIME_TOGETHER_BOND } from '../src/engine/world/birthday'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { birthdayTurning } from '../src/engine/world/age'
import { isBlackoutWeek, isExamWeek, isOffSeasonWeek, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { engineModuleFunction, worldFunction } from './worldSource'
import { lineAt, region } from './helpers/source'
import type { WorldState } from '../src/engine/world'

const SRC = fileURLToPath(new URL('../src/', import.meta.url))
const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** Source with every comment removed – block first, then line. A pin that reads prose is a pin the
 *  next writer repairs by deleting a sentence, and one that MISSES an aliased import
 *  (`import { rngFromSeed as r }`) is not asking about spellings at all. */
function codeOnly(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
}

/** Every `.ts`/`.vue` file under `src/`, as (relative path, source) – for the two whole-tree pins. */
function srcFiles(dir = SRC, prefix = ''): [string, string][] {
  const out: [string, string][] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...srcFiles(`${dir}${entry.name}/`, `${prefix}${entry.name}/`))
    else if (/\.(ts|vue)$/.test(entry.name)) out.push([prefix + entry.name, readFileSync(dir + entry.name, 'utf8')])
  }
  return out
}

/** A world parked at `week`, at both baselines, wearing the temperament under test. Built by
 *  `createWorld` and then MOVED, never hand-assembled: the shapes have to be the engine's own. */
function probeWorld(temperament: Temperament, week = 10, seed = 'spirit-probe'): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.temperament = temperament
  world.spirit = ECONOMY.spirit.baseline
  world.bond = ECONOMY.bond.start
  return world
}

/** The spirit delta one `accrueSpirit` produces from baseline, for a world the caller has posed. */
function deltaFromBaseline(world: WorldState): number {
  accrueSpirit(world, false, [])
  return Math.round((world.spirit - ECONOMY.spirit.baseline) * 10) / 10
}

/** Does `week` fire NO row of the perturbation table for this girl? Her school clock and her own
 *  birth date decide it, so a row test can pose exactly one fact and read exactly one delta. */
function quiet(base: WorldState, week: number): boolean {
  const schoolOver = schoolIsOver(week, base.profile.birthMonth)
  return (
    !isBlackoutWeek(week, schoolOver) &&
    birthdayTurning(week, base.profile.birthMonth, base.profile.birthDay) === null
  )
}

/** The first week ≥ `from` on which `pred` holds – so a row's week is FOUND rather than guessed. */
function weekWhere(pred: (w: number) => boolean, from = 1, limit = 600): number {
  for (let w = from; w < from + limit; w++) if (pred(w)) return w
  throw new Error('no such week inside the search window')
}

describe('temperament – ONE derivation, drawn once, (seed)-keyed', () => {
  it('answers one of exactly the four ids, and the same one every time for a seed', () => {
    for (let i = 0; i < 200; i++) {
      const t = temperamentFor(`seed-${i}`)
      expect(TEMPERAMENTS).toContain(t)
      expect(temperamentFor(`seed-${i}`)).toBe(t)
    }
    expect([...TEMPERAMENTS].sort()).toEqual(['deep', 'fiery', 'quiet', 'sunny'])
  })

  it('is uniform 25/25/25/25 across seeds – two independent axis picks, not a four-way table', () => {
    const seen: Record<string, number> = { sunny: 0, fiery: 0, quiet: 0, deep: 0 }
    const N = 4000
    for (let i = 0; i < N; i++) seen[temperamentFor(`uniformity-${i}`)] += 1
    for (const t of TEMPERAMENTS) {
      // ±3 pp of a quarter: wide enough that a fair coin never trips it, narrow enough that a
      // three-way split or a biased axis does.
      expect(Math.abs(seen[t] / N - 0.25), `${t} share ${seen[t] / N}`).toBeLessThan(0.03)
    }
  })

  it('maps the intensity axis exactly as the four ids are defined', () => {
    expect(temperamentIntensity('sunny')).toBe('steady')
    expect(temperamentIntensity('quiet')).toBe('steady')
    expect(temperamentIntensity('fiery')).toBe('intense')
    expect(temperamentIntensity('deep')).toBe('intense')
  })

  it('⭐ createWorld draws it off the career seed and takes NOTHING from MAIN', () => {
    const world = createWorld('temperament-at-birth')
    expect(world.temperament).toBe(temperamentFor('temperament-at-birth'))
    // Two careers on one seed are the same girl; two seeds are (almost always) not the same draw.
    expect(createWorld('temperament-at-birth').temperament).toBe(world.temperament)
    const spread = new Set(Array.from({ length: 40 }, (_, i) => createWorld(`spread-${i}`).temperament))
    expect(spread.size).toBeGreaterThan(1)
  })

  it('⚠ there is exactly ONE spelling of the derivation in the whole of src/', () => {
    // The defect this module exists to avoid: a migration (or a bench, or a snapshot) with its own
    // copy of the two axis picks would hand a live save a different girl from the one the engine
    // would have drawn. The sub-stream key may appear in exactly one file.
    const owners = srcFiles()
      // ⚠ THE SUB-STREAM KEY IN LIVE CODE, not the call by name: a second spelling that imported
      // `rngFromSeed` under an alias would still have to name this key, and a pin that matched the
      // function name would wave it through.
      .filter(([, text]) => /`[^`]*:temperament`/.test(codeOnly(text)))
      .map(([path]) => path)
    expect(owners).toEqual(['engine/spirit.ts'])
  })
})

describe('spiritMatchFactor – condition’s curve with spirit’s own knee and floor', () => {
  it('is exactly 1 everywhere at or above the knee, and 0.90 at zero', () => {
    for (let s = ECONOMY.spirit.knee; s <= 100; s += 0.5) expect(spiritMatchFactor(s), `spirit ${s}`).toBe(1)
    expect(spiritMatchFactor(0)).toBeCloseTo(ECONOMY.spirit.floor, 12)
  })

  it('is linear between the floor and the knee', () => {
    const { knee, floor } = ECONOMY.spirit
    for (const s of [5, 12.5, 30, 47, 59.9]) {
      expect(spiritMatchFactor(s), `spirit ${s}`).toBeCloseTo(floor + (1 - floor) * (s / knee), 12)
    }
    // Monotone, and never above 1 or below the floor.
    let prev = -1
    for (let s = 0; s <= 100; s += 0.25) {
      const f = spiritMatchFactor(s)
      expect(f).toBeGreaterThanOrEqual(prev)
      expect(f).toBeLessThanOrEqual(1)
      expect(f).toBeGreaterThanOrEqual(floor)
      prev = f
    }
  })

  it('is gentler than fatigue at every point – the design’s own bound, as arithmetic', () => {
    expect(ECONOMY.spirit.floor).toBeGreaterThan(ECONOMY.condition.matchStrengthFloor)
  })
})

describe('⚠⚠ the weekly rule – RETURN FIRST, THEN THIS WEEK (the 09.09 order fix)', () => {
  const ARMS: [Temperament, 'steady' | 'intense'][] = [
    ['sunny', 'steady'],
    ['quiet', 'steady'],
    ['fiery', 'intense'],
    ['deep', 'intense'],
  ]

  /** The scaled, tenth-rounded value a raw row is worth on this arm – the number the FULL delta must
   *  be, and precisely the number the reversed order cannot produce. */
  const scaled = (raw: number, arm: 'steady' | 'intense') =>
    Math.round(raw * ECONOMY.spirit.perturbationScale[arm] * 10) / 10

  for (const [temperament, arm] of ARMS) {
    describe(`${temperament} (${arm})`, () => {
      it('an untouched week at baseline moves nothing', () => {
        const world = probeWorld(temperament, weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5))
        expect(deltaFromBaseline(world)).toBe(0)
      })

      it('injury onset shows the FULL scaled −8 from baseline', () => {
        const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
        const world = probeWorld(temperament, week)
        world.injury = { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: week }
        expect(deltaFromBaseline(world)).toBe(scaled(ECONOMY.spirit.perturb.injuryOnset, arm))
      })

      it('each further laid-up week shows the FULL scaled −1', () => {
        const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
        const world = probeWorld(temperament, week)
        world.injury = { kind: 'ankle', severity: 'minor', weeksRemaining: 2, totalWeeks: 3, sinceWeek: week - 1 }
        expect(deltaFromBaseline(world)).toBe(scaled(ECONOMY.spirit.perturb.laidUpWeek, arm))
      })

      it('a knock PUSHED through costs its scaled −2 on every week the decision governs', () => {
        const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
        const world = probeWorld(temperament, week)
        world.knock = { part: 'wrist', sinceWeek: week - 1, repeat: false, choice: 'push', untilWeek: week + 2 }
        expect(deltaFromBaseline(world)).toBe(scaled(ECONOMY.spirit.perturb.knockPushedWeek, arm))
      })

      it('...and a knock she was RESTED on costs her nothing', () => {
        const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
        const world = probeWorld(temperament, week)
        world.knock = { part: 'wrist', sinceWeek: week - 1, repeat: false, choice: 'rest', untilWeek: week }
        expect(deltaFromBaseline(world)).toBe(0)
      })

      it('⭐ a family week shows the FULL scaled +5 – the row the reversed order used to eat', () => {
        const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
        const world = probeWorld(temperament, week)
        world.vacations = [{ week, packageId: 'seaside', paidCents: 0 }]
        expect(deltaFromBaseline(world)).toBe(scaled(ECONOMY.spirit.perturb.vacationResolved, arm))
      })

      it('her birthday week shows the FULL scaled +2', () => {
        const base = createWorld('spirit-probe')
        // ⚠ HER BIRTHDAY LANDS INSIDE THE EXAM FORTNIGHT FOR THE FIRST FIVE SEASONS (weeks 23/76/
        // 128/180/232 against exam offsets 23-24), so the first week where the birthday row fires
        // ALONE is the one after school ends. Found, not guessed – that is what `quiet` is for.
        const week = weekWhere(
          (w) =>
            birthdayTurning(w, base.profile.birthMonth, base.profile.birthDay) !== null &&
            !isBlackoutWeek(w, schoolIsOver(w, base.profile.birthMonth)),
          5,
        )
        const world = probeWorld(temperament, week)
        expect(deltaFromBaseline(world)).toBe(scaled(ECONOMY.spirit.perturb.birthdayWeek, arm))
      })

      it('an exam week costs the scaled −2 ONLY while the plan is still grinding through it', () => {
        const base = createWorld('spirit-probe')
        const week = weekWhere(
          (w) =>
            isExamWeek(w, schoolIsOver(w, base.profile.birthMonth)) &&
            birthdayTurning(w, base.profile.birthMonth, base.profile.birthDay) === null,
          5,
        )
        // ⚠ An exam week is also a BLACKOUT week, so the two rows compose – the table as written.
        const blackout = ECONOMY.spirit.perturb.blackoutWeek
        const grinding = probeWorld(temperament, week)
        grinding.plan = { ...grinding.plan, train: ECONOMY.spirit.examTrainFloor, rest: 100 - ECONOMY.spirit.examTrainFloor }
        expect(deltaFromBaseline(grinding)).toBe(scaled(ECONOMY.spirit.perturb.hardExamWeek + blackout, arm))

        const light = probeWorld(temperament, week)
        light.plan = { ...light.plan, train: ECONOMY.spirit.examTrainFloor - 1, rest: 101 - ECONOMY.spirit.examTrainFloor }
        expect(deltaFromBaseline(light)).toBe(scaled(blackout, arm))
      })

      it('a blackout week shows the FULL scaled +1', () => {
        const base = createWorld('spirit-probe')
        const week = weekWhere(
          (w) =>
            isOffSeasonWeek(w) &&
            w % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS &&
            !isExamWeek(w, schoolIsOver(w, base.profile.birthMonth)) &&
            birthdayTurning(w, base.profile.birthMonth, base.profile.birthDay) === null,
          5,
        )
        const world = probeWorld(temperament, week)
        expect(deltaFromBaseline(world)).toBe(scaled(ECONOMY.spirit.perturb.blackoutWeek, arm))
      })

      it('a season that wraps with no family week costs the scaled −3, beside the wrap week’s own +1', () => {
        const base = createWorld('spirit-probe')
        const week = weekWhere(
          (w) =>
            w % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS &&
            !isExamWeek(w, schoolIsOver(w, base.profile.birthMonth)) &&
            birthdayTurning(w, base.profile.birthMonth, base.profile.birthDay) === null,
          53,
        )
        const empty = probeWorld(temperament, week)
        expect(seasonWrapsWithNoVacation(empty)).toBe(true)
        expect(deltaFromBaseline(empty)).toBe(
          scaled(ECONOMY.spirit.perturb.seasonWithNoVacation + ECONOMY.spirit.perturb.blackoutWeek, arm),
        )

        // ...and one family week ANYWHERE in the block – already taken, or still to come – answers it.
        const taken = probeWorld(temperament, week)
        taken.gearRestWeeks = [week - 20]
        expect(seasonWrapsWithNoVacation(taken)).toBe(false)
        expect(deltaFromBaseline(taken)).toBe(scaled(ECONOMY.spirit.perturb.blackoutWeek, arm))

        const booked = probeWorld(temperament, week)
        booked.vacations = [{ week: week + 1, packageId: 'seaside', paidCents: 0 }]
        expect(seasonWrapsWithNoVacation(booked)).toBe(false)
      })

      it('returns toward the baseline at this arm’s own rate, off LAST week’s value', () => {
        const rate = ECONOMY.spirit.returnPerWeek[arm]
        const calm = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)

        const low = probeWorld(temperament, calm)
        low.spirit = 40
        accrueSpirit(low, false, [])
        expect(low.spirit).toBe(40 + rate)

        const high = probeWorld(temperament, calm)
        high.spirit = 90
        accrueSpirit(high, false, [])
        expect(high.spirit).toBe(90 - rate)

        // ...and the step never overshoots the baseline into an oscillation.
        const nearly = probeWorld(temperament, calm)
        nearly.spirit = ECONOMY.spirit.baseline - 1
        accrueSpirit(nearly, false, [])
        expect(nearly.spirit).toBe(ECONOMY.spirit.baseline)
      })

      it('clamps to 0..100 and stores tenths, whatever is thrown at it', () => {
        const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
        const floorTest = probeWorld(temperament, week)
        floorTest.spirit = 0
        floorTest.injury = { kind: 'knee', severity: 'major', weeksRemaining: 9, totalWeeks: 9, sinceWeek: week }
        accrueSpirit(floorTest, false, [])
        expect(floorTest.spirit).toBeGreaterThanOrEqual(0)

        const ceilTest = probeWorld(temperament, week)
        ceilTest.spirit = 100
        ceilTest.vacations = [{ week, packageId: 'seaside', paidCents: 0 }]
        accrueSpirit(ceilTest, false, [])
        expect(ceilTest.spirit).toBeLessThanOrEqual(100)

        const tenths = probeWorld(temperament, week)
        tenths.injury = { kind: 'knee', severity: 'minor', weeksRemaining: 2, totalWeeks: 3, sinceWeek: week - 1 }
        accrueSpirit(tenths, false, [])
        expect(tenths.spirit * 10).toBe(Math.round(tenths.spirit * 10))
      })
    })
  }

  it('⚠ the intensity arms really differ – an intense girl takes more and comes back slower', () => {
    const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
    const steady = probeWorld('sunny', week)
    const intense = probeWorld('fiery', week)
    for (const w of [steady, intense]) {
      w.injury = { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: week }
    }
    accrueSpirit(steady, false, [])
    accrueSpirit(intense, false, [])
    expect(intense.spirit).toBeLessThan(steady.spirit)

    const backSteady = probeWorld('sunny', week)
    const backIntense = probeWorld('fiery', week)
    backSteady.spirit = 40
    backIntense.spirit = 40
    accrueSpirit(backSteady, false, [])
    accrueSpirit(backIntense, false, [])
    expect(backSteady.spirit).toBeGreaterThan(backIntense.spirit)
  })

  it('⚠ a long quiet run settles AT the baseline and stays there (equilibrium, per arm)', () => {
    const base = createWorld('spirit-probe')
    for (const t of TEMPERAMENTS) {
      const world = probeWorld(t, 5)
      world.spirit = 12
      for (let i = 0; i < 60; i++) {
        world.week = weekWhere((w) => quiet(base, w), world.week + 1)
        accrueSpirit(world, false, [])
      }
      expect(world.spirit, t).toBe(ECONOMY.spirit.baseline)
    }
  })
})

describe('bond – the standing, and the memory property', () => {
  it('regresses 0.5/week toward 70 on the same weekly pass, from both sides', () => {
    const calm = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
    const low = probeWorld('sunny', calm)
    low.bond = 50
    accrueSpirit(low, false, [])
    expect(low.bond).toBe(50 + ECONOMY.bond.regressionPerWeek)

    const high = probeWorld('sunny', calm)
    high.bond = 90
    accrueSpirit(high, false, [])
    expect(high.bond).toBe(90 - ECONOMY.bond.regressionPerWeek)

    const settled = probeWorld('sunny', calm)
    accrueSpirit(settled, false, [])
    expect(settled.bond).toBe(ECONOMY.bond.start)
  })

  it('a −25 season heals in about fifty weeks and never overshoots', () => {
    const base = createWorld('spirit-probe')
    const world = probeWorld('sunny', 5)
    world.bond = ECONOMY.bond.start - 25
    let weeks = 0
    while (world.bond < ECONOMY.bond.start && weeks < 200) {
      world.week = weekWhere((w) => quiet(base, w), world.week + 1)
      accrueSpirit(world, false, [])
      weeks += 1
    }
    expect(weeks).toBe(50)
    expect(world.bond).toBe(ECONOMY.bond.start)
  })

  it('clamps to 0..100 and always lands on the 0.5 grid', () => {
    const world = probeWorld('sunny', 5)
    applyBondDelta(world, -1000)
    expect(world.bond).toBe(ECONOMY.bond.min)
    applyBondDelta(world, 1000)
    expect(world.bond).toBe(ECONOMY.bond.max)
    world.bond = 70
    applyBondDelta(world, ECONOMY.bond.delta.giftAskedGranted)
    expect(world.bond).toBe(72.5)
    // ⚠ AND A DELTA THAT LANDS BETWEEN THE STEPS IS PUT BACK ON THEM. No row of today's table is
    // off-grid, so this is the writer's own guarantee rather than a consequence of the numbers –
    // which is exactly why it needs its own assertion: the day a row arrives at 0.3, the grid must
    // already be defended.
    world.bond = 70
    applyBondDelta(world, 0.3)
    expect(world.bond).toBe(70.5)
    world.bond = 70
    applyBondDelta(world, -0.1)
    expect(world.bond).toBe(70)
    expect(world.bond * 2).toBe(Math.round(world.bond * 2))
  })

  it('⚠⚠ regressionPerWeek is a MULTIPLE of the step, because the grid makes it a two-value dial', () => {
    // FOUND BY THE WAVE-1 SWEEP, and it is the reason this pin exists rather than a comment. The
    // regression is quantised by the same `roundHalf` as every other bond write, so the constant
    // does not mean what it says at most values: measured through the weekly rule itself, 0.5, 0.4,
    // 0.3 and 0.25 ALL move exactly half a point, and 0.24, 0.2 and 0.1 ALL move exactly nothing –
    // at which point a −25 season never heals at any horizon rather than healing slowly. A sweep
    // reading 0.5 → 0.1 is reading a dial that stopped turning after its third row, and the tuner
    // has no way to see that from the number.
    //
    // So the legal set is pinned instead of documented: a POSITIVE MULTIPLE of `step`. The shipped
    // 0.5 is one step exactly, which is why today's 50-week heal is real.
    // ⚠ A later wave wanting slower healing changes the mechanism – a finer `step`, or a regression
    // that carries its remainder between weeks – and not this number.
    const { regressionPerWeek, step } = ECONOMY.bond
    expect(regressionPerWeek).toBeGreaterThan(0)
    expect(regressionPerWeek / step).toBe(Math.round(regressionPerWeek / step))
    // ...and the property the multiple BUYS, asserted through the engine rather than by arithmetic:
    // one week of regression moves exactly the constant, at a bond value already on the grid.
    const world = probeWorld('sunny', 5)
    world.bond = ECONOMY.bond.start - 10
    accrueSpirit(world, false, [])
    expect(world.bond).toBe(ECONOMY.bond.start - 10 + regressionPerWeek)
  })

  describe('the delta table, at the decision sites that write it', () => {
    /** A career walked to the week a knock is live and unanswered, without touching the tick. */
    function knockWorld(choice: 'rest' | 'push', repeat: boolean): WorldState {
      const world = createWorld('bond-knock')
      world.week = 30
      world.bond = ECONOMY.bond.start
      world.knock = { part: 'wrist', sinceWeek: 30, repeat, choice: null, untilWeek: 30 }
      decideKnock(world, choice)
      return world
    }

    it('the knock: rest +1, push −3, push on a repeated part −5', () => {
      expect(knockWorld('rest', false).bond).toBe(ECONOMY.bond.start + 1)
      expect(knockWorld('push', false).bond).toBe(ECONOMY.bond.start - 3)
      expect(knockWorld('push', true).bond).toBe(ECONOMY.bond.start - 5)
      // ...and resting a repeated part is still resting.
      expect(knockWorld('rest', true).bond).toBe(ECONOMY.bond.start + 1)
    })

    it('a family week that resolves: +1', () => {
      const world = createWorld('bond-vacation')
      world.week = 20
      world.bond = ECONOMY.bond.start
      world.vacations = [{ week: 20, packageId: 'seaside', paidCents: 0 }]
      resolveVacation(world)
      expect(world.bond).toBe(ECONOMY.bond.start + ECONOMY.bond.delta.vacationResolved)
    })

    it('⭐ the birthday: the three time-together sizes are three different numbers', () => {
      expect(Object.keys(BIRTHDAY_TIME_TOGETHER_BOND).sort()).toEqual(Object.keys(BIRTHDAY_TIME_TOGETHER).sort())
      const values = Object.values(BIRTHDAY_TIME_TOGETHER_BOND)
      expect(new Set(values).size).toBe(values.length)
      expect(BIRTHDAY_TIME_TOGETHER_BOND.day).toBe(2)
      expect(BIRTHDAY_TIME_TOGETHER_BOND.familyweek).toBe(3)
      expect(BIRTHDAY_TIME_TOGETHER_BOND.trip).toBe(4)
    })

    it('⭐⭐ the birthday: heard +2.5, refused −1.5, unprompted material exactly 0', () => {
      // The four cases are walked on REAL birthdays, through the engine's own offer – a hand-made
      // option list would be a claim about a dialog nobody was shown.
      let seenGranted = false
      let seenRefused = false
      let seenUnprompted = false
      let seenTime = false
      for (let s = 0; s < 40 && !(seenGranted && seenRefused && seenUnprompted && seenTime); s++) {
        const world = createWorld(`bond-birthday-${s}`)
        for (let w = 1; w <= 160; w++) {
          world.week = w
          const age = pendingBirthday(world)
          if (age === null) continue
          const { options } = birthdayOfferFor(world, age)
          for (const option of options) {
            const probe = createWorld(`bond-birthday-${s}`)
            probe.week = w
            probe.bond = ECONOMY.bond.start
            chooseGift(probe, option.id)
            const record = probe.birthdays[probe.birthdays.length - 1]
            const move = probe.bond - ECONOMY.bond.start
            if (BIRTHDAY_TIME_TOGETHER_BOND[record.given!] !== undefined) {
              expect(move, `time-together ${record.given}`).toBe(BIRTHDAY_TIME_TOGETHER_BOND[record.given!])
              seenTime = true
            } else if (record.given === record.asked) {
              expect(move, 'the asked-for gift, granted').toBe(ECONOMY.bond.delta.giftAskedGranted)
              seenGranted = true
            } else if (BIRTHDAY_TIME_TOGETHER_BOND[record.asked] === undefined) {
              expect(move, 'she asked for a thing and got a different thing').toBe(ECONOMY.bond.delta.giftRefused)
              seenRefused = true
            } else {
              expect(move, 'unprompted material – she wanted time, not a parcel').toBe(0)
              seenUnprompted = true
            }
          }
        }
      }
      // ⚠ ANTI-VACUITY: a green run that never met a case proves nothing about it.
      expect({ seenTime, seenGranted, seenRefused, seenUnprompted }).toEqual({
        seenTime: true,
        seenGranted: true,
        seenRefused: true,
        seenUnprompted: true,
      })
    })
  })
})

describe('the match seam – a second factor beside condition’s, and 1.0 when it is absent', () => {
  const world = createWorld('seam')

  it('absent, at baseline and anywhere above the knee, is the pre-wave player byte for byte', () => {
    const { spirit: _drop, ...noSpirit } = world
    const pre = kidMatchPlayerFor(noSpirit as typeof world, 'hard')
    for (const s of [ECONOMY.spirit.knee, ECONOMY.spirit.baseline, 85, 100]) {
      expect(kidMatchPlayerFor({ ...world, spirit: s }, 'hard'), `spirit ${s}`).toEqual(pre)
    }
    // ...and the same on every surface and with the coach on the trip, so it is the SEAM that is
    // neutral and not one lucky path through it.
    for (const surface of ['hard', 'clay', 'grass'] as const) {
      for (const trip of [false, true]) {
        expect(kidMatchPlayerFor({ ...world, spirit: 100 }, surface, trip)).toEqual(
          kidMatchPlayerFor(noSpirit as typeof world, surface, trip),
        )
      }
    }
  })

  it('⚠ and it really bites below the knee – all five wings, and nothing else', () => {
    const { spirit: _drop, ...noSpirit } = world
    const pre = kidMatchPlayerFor(noSpirit as typeof world, 'hard')
    const low = kidMatchPlayerFor({ ...world, spirit: 30 }, 'hard')
    for (const wing of ['serve', 'ret', 'composure', 'stamina', 'groundstrokes'] as const) {
      expect(low[wing], wing).toBeLessThan(pre[wing])
      // ⚠ THE RATIO, NOT THE PRODUCT: `applySurfaceStyle` and `applyKit` sit between the factor and
      // the number that comes out, and both round – so the honest claim is that the five wings moved
      // BY THE FACTOR, to within the composition's own grain.
      expect(low[wing] / pre[wing], wing).toBeCloseTo(spiritMatchFactor(30), 3)
    }
    // The stamped facts are hers, not the factor's: age and the condition half do not move.
    expect(low.age).toBe(pre.age)
    expect(low.condition).toBe(pre.condition)
  })
})

describe('the v72 schema move', () => {
  it('bumps the version and ships a golden fixture for it', () => {
    // ⚠ RE-AIMED AT v73 (the private life's wave 2 took the next rung the day after), NOT LOOSENED.
    // This case is about v72's OWN RUNG – that the move happened and left a fixture of its own shape
    // behind – and never about the ladder's head, which moves with every wave. The head's own guard
    // («a bump forces a new golden save») lives in tests/goldenSaves.test.ts and is the only place
    // that should ever name a number that changes.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(72)
    const v72 = JSON.parse(readFileSync(`${SAVES}/v72.json`, 'utf8'))
    expect(v72.schemaVersion).toBe(72)
  })

  it('⭐⭐ back-fills the two numbers uniformly and DERIVES the temperament with createWorld’s formula', () => {
    const v71 = JSON.parse(readFileSync(`${SAVES}/v71.json`, 'utf8'))
    const migrated = migrateSave(JSON.parse(JSON.stringify(v71)))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.spirit).toBe(ECONOMY.spirit.baseline)
    expect(migrated.bond).toBe(ECONOMY.bond.start)
    // THE PIN THIS STEP EXISTS FOR: not "a temperament", but THE one the engine would have drawn.
    expect(migrated.temperament).toBe(temperamentFor(migrated.seed))
    expect(migrated.temperament).toBe(createWorld(migrated.seed).temperament)
  })

  it('is idempotent, and never re-rolls a career that already has one', () => {
    const v71 = JSON.parse(readFileSync(`${SAVES}/v71.json`, 'utf8'))
    const once = migrateSave(JSON.parse(JSON.stringify(v71)))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // A save that already carries the three keys keeps them, whatever they say.
    const posed = { ...JSON.parse(JSON.stringify(v71)), schemaVersion: 71, spirit: 31.5, bond: 88, temperament: 'deep' }
    const kept = migrateSave(posed)
    expect([kept.spirit, kept.bond, kept.temperament]).toEqual([31.5, 88, 'deep'])
  })

  it('⚠ takes NOTHING from the MAIN stream – the persisted position is byte-identical', () => {
    const v71 = JSON.parse(readFileSync(`${SAVES}/v71.json`, 'utf8'))
    const before = JSON.stringify(v71.rngMain)
    expect(JSON.stringify(migrateSave(JSON.parse(JSON.stringify(v71))).rngMain)).toBe(before)
  })

  // ⚠ AN EXPLICIT BUDGET, AND THE REASON IS MEASURED RATHER THAN CAUTIOUS: this walks the WHOLE
  // golden corpus (73 fixtures, several over half a megabyte) through the full ladder, which is the
  // heaviest single case in this file. On a quiet machine the file costs ~8 s end to end; on a
  // machine sharing its cores with another agent's suite this one case blew the 20 s default and
  // came back as a red with no assertion in it – the contention shape CLAUDE.md's gotcha describes.
  // A false red teaches the next reader to distrust the file, so the budget is stated.
  it('every older fixture reaches v72 carrying all three fields', () => {
    for (const file of readdirSync(SAVES).filter((f) => /^v\d+\.json$/.test(f))) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${SAVES}/${file}`, 'utf8')))
      expect(typeof migrated.spirit, file).toBe('number')
      expect(typeof migrated.bond, file).toBe('number')
      expect(TEMPERAMENTS, file).toContain(migrated.temperament)
    }
  }, 60_000)
})

// =================================================================================================
// ⭐⭐⭐ v72 STEP 4 — THE MOOD LADDER, AND THE ONE DECISION HER FACE AND HER WORD BOTH READ
// =================================================================================================
describe('the Mood ladder – five words, four ruled cut points', () => {
  it('⚠⚠ the four cuts are the RULED ones, and each is anchored to a mechanical fact', () => {
    // ⚠ RULED 09.09 and NOT a tuning dial (runbook §6). A test that would be easier with other
    // numbers is a test to rewrite; if one of these looks wrong, it goes back to the owner.
    const m = ECONOMY.spirit.mood
    expect(m.heavyBelow, 'Heavy is the knee itself').toBe(ECONOMY.spirit.knee)
    // ⭐ the knee is the anchor that makes «the weeks under the knee» a checkable sentence: below it
    // and only below it does `spiritMatchFactor` stop being 1.0.
    expect(spiritMatchFactor(m.heavyBelow)).toBe(1)
    expect(spiritMatchFactor(m.heavyBelow - 0.1)).toBeLessThan(1)
    // baseline ± half a steady week's return (5 / 2 = 2.5) is the neutral band, on both sides
    const half = ECONOMY.spirit.returnPerWeek.steady / 2
    expect(m.dimmedBelow).toBe(ECONOMY.spirit.baseline - half)
    expect(m.brightFrom).toBe(ECONOMY.spirit.baseline + half)
    // ...and Glowing opens at the top of the range, where wave 3's lifted baseline (75) sits under it
    expect(m.glowingFrom).toBe(80)
    expect(ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift).toBeLessThan(m.glowingFrom)
  })

  it('reads every rung, at its own edge and a tenth either side', () => {
    const m = ECONOMY.spirit.mood
    expect(spiritBandOf(0)).toBe('heavy')
    expect(spiritBandOf(m.heavyBelow - 0.1)).toBe('heavy')
    expect(spiritBandOf(m.heavyBelow)).toBe('dimmed')
    expect(spiritBandOf(m.dimmedBelow - 0.1)).toBe('dimmed')
    expect(spiritBandOf(m.dimmedBelow)).toBe('steady')
    expect(spiritBandOf(ECONOMY.spirit.baseline)).toBe('steady')
    expect(spiritBandOf(m.brightFrom - 0.1)).toBe('steady')
    expect(spiritBandOf(m.brightFrom)).toBe('bright')
    expect(spiritBandOf(m.glowingFrom - 0.1)).toBe('bright')
    expect(spiritBandOf(m.glowingFrom)).toBe('glowing')
    expect(spiritBandOf(100)).toBe('glowing')
    // total over the whole range, in the tenths the number is actually stored in
    for (let s = 0; s <= 1000; s++) expect(SPIRIT_BANDS).toContain(spiritBandOf(s / 10))
  })

  it('⚠⚠ the five words are the OWNER’s, and «Steady» is the one shared with condition', () => {
    // CLAUDE.md invariant 4: approved copy, `docs/specs/voice-bibles-2026-09.md` §C. A rename shows
    // up here rather than on a screen nobody re-read.
    expect(SPIRIT_BANDS.map((b) => MOOD_WORD[b])).toEqual([
      'Glowing',
      'Bright',
      'Steady',
      'Dimmed',
      'Heavy',
    ])
    // ...and the neutral rung says exactly what the two tiles already say for the `norm` face, which
    // is the owner's «the neutral state is one state and gets one word».
    expect(MOOD_WORD.steady).toBe('Steady')
    expect(MOOD_FACE.steady).toBe('norm')
  })

  it('the register collapses the five to three, and a career’s opening week is `level`', () => {
    expect(SPIRIT_BANDS.map(moodRegisterOf)).toEqual(['bright', 'bright', 'level', 'low', 'low'])
    expect(moodRegisterOf(spiritBandOf(ECONOMY.spirit.baseline))).toBe('level')
  })

  it('the bond bands are the build plan’s four, at their own edges', () => {
    const c = ECONOMY.bond.band
    expect([c.close, c.steady, c.strained]).toEqual([80, 55, 35])
    expect(bondBandOf(100)).toBe('close')
    expect(bondBandOf(80)).toBe('close')
    expect(bondBandOf(79.5)).toBe('steady')
    expect(bondBandOf(ECONOMY.bond.start)).toBe('steady')
    expect(bondBandOf(55)).toBe('steady')
    expect(bondBandOf(54.5)).toBe('strained')
    expect(bondBandOf(35)).toBe('strained')
    expect(bondBandOf(34.5)).toBe('cold')
    expect(bondBandOf(0)).toBe('cold')
  })
})

describe('⚠⚠ the ruled collision – injury first, then the larger deviation, ties to the body', () => {
  const RESULT_WEEK = 10
  const loss = { week: RESULT_WEEK, won: false, lostFinal: false }

  it('the two rung counts are one ladder counted twice – the body’s reads idleEmotion’s own thresholds', () => {
    // If these two ever disagree the face and the word start describing different weeks, which is
    // the single failure the "one decision" design exists to prevent.
    for (let condition = 0; condition <= 100; condition++) {
      const face = idleEmotion(false, condition)
      const expected = face === 'tired' ? 2 : face === 'serious' ? 1 : 0
      expect(conditionDeviation(condition), `condition ${condition} reads ${face}`).toBe(expected)
    }
    expect(SPIRIT_BANDS.map((b) => MOOD_DEVIATION[b])).toEqual([2, 1, 0, 1, 2])
  })

  it('injury outranks BOTH channels – a Glowing week in a brace is still the rehab painting', () => {
    for (const band of SPIRIT_BANDS) {
      const read = avatarEmotionRead({
        week: RESULT_WEEK,
        condition: 20,
        injured: true,
        lastResult: null,
        spiritBand: band,
      })
      expect(read).toEqual({ emotion: 'rehab', channel: 'injury' })
    }
  })

  it('⭐ the larger deviation speaks – and a Glowing week smiles on a girl who won nothing', () => {
    const at = (condition: number, band: SpiritBand) =>
      avatarEmotionRead({ week: RESULT_WEEK, condition, injured: false, lastResult: null, spiritBand: band })
    // body 0, mood 2 -> her life takes the face
    expect(at(90, 'glowing')).toEqual({ emotion: 'happy', channel: 'mood' })
    // body 0, mood 1 -> still her life
    expect(at(90, 'dimmed')).toEqual({ emotion: 'sad', channel: 'mood' })
    // body 1 (serious), mood 2 -> her life again
    expect(at(50, 'heavy')).toEqual({ emotion: 'sad', channel: 'mood' })
    // body 2 (tired), mood 1 -> the body wins, and the tile keeps its own word
    expect(at(20, 'dimmed')).toEqual({ emotion: 'tired', channel: 'body' })
    // body 2, mood 2 -> A TIE, and a tie goes to the shipped channel
    expect(at(20, 'heavy')).toEqual({ emotion: 'tired', channel: 'body' })
    // body 1, mood 1 -> a tie one rung down, same answer
    expect(at(50, 'bright')).toEqual({ emotion: 'serious', channel: 'body' })
    // both neutral -> the body's `norm`, which is the same word either channel would have said
    expect(at(90, 'steady')).toEqual({ emotion: 'norm', channel: 'body' })
  })

  it('⚠ a fresh RESULT is untouched by the layer – R8-6a is not overturned by a bad mood', () => {
    // «then the existing result logic» is the layer that stays ON TOP, not a rung the new channel
    // may outrank. A win reads `happy` on the worst week of her life, exactly as it always has.
    for (const band of SPIRIT_BANDS) {
      const won = avatarEmotionRead({
        week: RESULT_WEEK,
        condition: 20,
        injured: false,
        lastResult: { week: RESULT_WEEK, won: true, lostFinal: false },
        spiritBand: band,
      })
      expect(won, `a win on a ${band} week`).toEqual({ emotion: 'happy', channel: 'result' })
      const runnerUp = avatarEmotionRead({
        week: RESULT_WEEK,
        condition: 20,
        injured: false,
        lastResult: { week: RESULT_WEEK, won: false, lostFinal: true },
        spiritBand: band,
      })
      expect(runnerUp.emotion, `a runner-up on a ${band} week`).toBe('serious')
      const plain = avatarEmotionRead({
        week: RESULT_WEEK,
        condition: 90,
        injured: false,
        lastResult: loss,
        spiritBand: band,
      })
      expect(plain, `a loss on a ${band} week`).toEqual({ emotion: 'sad', channel: 'result' })
    }
  })

  it('⚠⚠ ABSENT, IT IS THE PRE-WAVE FUNCTION BYTE FOR BYTE – every caller that predates the layer', () => {
    for (let condition = 0; condition <= 100; condition += 1) {
      for (const injured of [false, true]) {
        const before = injured ? 'rehab' : condition < 40 ? 'tired' : condition < 60 ? 'serious' : 'norm'
        expect(idleEmotion(injured, condition)).toBe(before)
        expect(idleEmotion(injured, condition, null)).toBe(before)
        // ...and the neutral rung is inert too, which is what makes wave 1 quiet on purpose
        expect(idleEmotion(injured, condition, 'steady')).toBe(before)
      }
    }
  })

  it('⚠ the face and the word can never disagree – the word exists on exactly the mood weeks', () => {
    // The tile's word is licensed on `channel === 'mood'` and on nothing else, so a non-null word
    // implies a face this ladder chose, and the two are one call.
    for (const band of SPIRIT_BANDS) {
      for (const condition of [10, 30, 50, 70, 90]) {
        for (const injured of [false, true]) {
          const read = avatarEmotionRead({
            week: RESULT_WEEK,
            condition,
            injured,
            lastResult: null,
            spiritBand: band,
          })
          if (read.channel !== 'mood') continue
          expect(read.emotion).toBe(MOOD_FACE[band])
          expect(['Glowing', 'Bright', 'Dimmed', 'Heavy']).toContain(MOOD_WORD[band])
          // the neutral rung can never win – it ties with a neutral body and loses to any other
          expect(band).not.toBe('steady')
        }
      }
    }
  })
})

describe('⭐ the birthday ask leans toward her register – a tendency, never a rule', () => {
  /** The ask, over one girl's whole run of birthdays, as a share per gift id. */
  function askMix(temperament: Temperament | null, seeds = 60): Map<string, number> {
    const mix = new Map<string, number>()
    for (let s = 0; s < seeds; s++) {
      for (let age = 13; age <= 30; age++) {
        const { askedId } = birthdayOffer(`ask-${s}`, age, [], false, null, null, null, null, temperament)
        mix.set(askedId, (mix.get(askedId) ?? 0) + 1)
      }
    }
    return mix
  }

  it('⚠ absent, the draw is UNIFORM – every historical caller and every catalogue sweep is untouched', () => {
    for (let s = 0; s < 25; s++) {
      for (const age of [13, 16, 19, 23, 29]) {
        const bare = birthdayOffer(`untouched-${s}`, age)
        const explicit = birthdayOffer(`untouched-${s}`, age, [], false, null, null, null, null, null)
        expect(explicit.askedId, `seed ${s} age ${age}`).toBe(bare.askedId)
        expect(explicit.options.map((o) => o.id)).toEqual(bare.options.map((o) => o.id))
      }
    }
  })

  it('⭐ an OPEN girl asks for time together more often, a PRIVATE girl less – and both do', () => {
    const share = (mix: Map<string, number>) => {
      const total = [...mix.values()].reduce((a, b) => a + b, 0)
      const together = ['day', 'familyweek', 'trip'].reduce((a, id) => a + (mix.get(id) ?? 0), 0)
      return together / total
    }
    const open = share(askMix('sunny'))
    const uniform = share(askMix(null))
    const priv = share(askMix('quiet'))
    expect(open, 'the open girl leans toward people').toBeGreaterThan(uniform)
    expect(priv, 'the private girl leans away').toBeLessThan(uniform)
    // ⚠ AND IT IS MILD – the whole lean is inside the ~1.5x cap the design put on it.
    expect(open / priv).toBeLessThan(BIRTHDAY_ASK_TILT + 0.5)
    // ⚠⚠ THE ANTI-STEREOTYPE GUARD (who-she-is §3, reader 7): every id stays COMMON for every girl.
    //
    // ⚠ MEASURED AGAINST THE UNIFORM MIX RATHER THAN AGAINST A FLAT FLOOR, because the ids are not
    // equally common to begin with: `trip` lives in two age bands and answers ~1.3% of asks over a
    // whole career whoever she is. A flat 2% floor therefore fails on a row the lean never touched –
    // which is the first thing this pin did – and would have been "fixed" by weakening the guard.
    // The honest question is whether the LEAN moved anything out of reach, so it is asked as a ratio.
    const baseMix = askMix(null)
    const baseTotal = [...baseMix.values()].reduce((a, b) => a + b, 0)
    for (const temperament of TEMPERAMENTS) {
      const mix = askMix(temperament)
      const total = [...mix.values()].reduce((a, b) => a + b, 0)
      for (const [id, n] of baseMix) {
        const seen = (mix.get(id) ?? 0) / total
        const base = n / baseTotal
        expect(seen, `${temperament} never asks for ${id}`).toBeGreaterThan(0)
        expect(seen / base, `${temperament} barely asks for ${id}`).toBeGreaterThan(0.5)
        expect(seen / base, `${temperament} asks for ${id} far too often`).toBeLessThan(2)
      }
      // ...and no single id ever swallows the card
      for (const [id, n] of mix) expect(n / total, `${temperament} asks only for ${id}`).toBeLessThan(0.6)
    }
  })

  it('⚠⚠ SAME STREAM, SAME COUNT: the lean is applied to the pool, never to the draw', () => {
    // The stream is `seed:birthday:<age>` and it is drawn exactly four times for every birthday in
    // the game – three to order the four rows, one for the ask. A weighted CUT of one `rng()` keeps
    // that; a second roll, or a roll skipped for some girls, would make the stream's position depend
    // on who she is, which is CLAUDE.md invariant 2's own failure mode.
    // ⚠ Both markers are CODE, because `codeOnly` has already taken the comments out – a docstring
    // marker here would be the rotted-marker case `region` throws on, which is how this pin was
    // written the first time and what the helper caught within the minute.
    const src = codeOnly(readFileSync(`${SRC}engine/world/birthday.ts`, 'utf8'))
    const offer = region(src, 'export function birthdayOffer(', 'function giftsAlreadyGiven(')
    expect(offer.split('rng()').length - 1, 'the ask is still ONE draw').toBe(1)
    // ...and the four options on the card do not move with her temperament: only which she names.
    for (const temperament of [...TEMPERAMENTS, null]) {
      const { options } = birthdayOffer('same-card', 17, [], false, null, null, null, null, temperament)
      expect(options.map((o) => o.id)).toEqual(
        birthdayOffer('same-card', 17).options.map((o) => o.id),
      )
    }
  })
})

describe('the fence this step is judged by', () => {
  it('⚠⚠ the weekly rules take ZERO draws – MAIN is not touched by either of them', () => {
    const world = createWorld('no-draws')
    world.week = 40
    world.injury = { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: 40 }
    const before = JSON.stringify(world.rngMain)
    accrueSpirit(world, false, [])
    applyBondDelta(world, -3)
    expect(JSON.stringify(world.rngMain)).toBe(before)
  })

  it('⚠ neither weekly function takes an Rng at all – the strongest form of the same claim', () => {
    // ⚠⚠ RE-AIMED 13.09 BY WAVE 5's T4b (the architect's ruling J), AND STRENGTHENED RATHER THAN
    // RENUMBERED. WHAT MOVED: `accrueSpirit` gained a SECOND parameter, `psychologistWorks: boolean` –
    // the seat's own billing predicate, handed down by `world/phaseHerWeek.ts` because
    // `engine/spirit.ts` cannot import `psychologistWorksThisWeek` without closing a measured value
    // cycle (`spirit -> psychologist -> college -> player -> spirit`).
    //
    // ⚠⚠ WHY BUMPING 1 TO 2 AND STOPPING THERE WOULD HAVE BEEN A WEAKENING, which is the whole of the
    // re-aim. The claim this case is NAMED for is «no Rng», and an arity count is only a proxy for it –
    // a proxy that a `boolean` has just retired, because the number now moves for reasons that have
    // nothing to do with randomness. The arity line stays (a THIRD parameter is still red, and that is
    // worth keeping), and the claim itself is now asserted OF THE SIGNATURE, where it can still fail:
    // give either function an `Rng` and this goes red on the text of the declaration.
    //
    // ⚠⚠ RE-AIMED A SECOND TIME 14.09 BY WAVE 6's T3 (the architect's ruling A), AND IT WENT RED ON
    // CONTACT, WHICH IS THE SENTENCE ABOVE COMING TRUE: «a THIRD parameter is still red, and that is
    // worth keeping». WHAT MOVED: `accrueSpirit` gained `exposure: readonly ExposureEvent[]` – the
    // week's exposure list, derived by `world/spotlight.ts` and handed down by `world/phaseHerWeek.ts`
    // (§0.1's dependency inversion, ruling J's shape applied to a second fact). Neither DELETED nor
    // WEAKENED: the number moves from 2 to 3, a FOURTH parameter is still red, and the `toContain`
    // list below grows the new name so the claim is about the signature that exists.
    //
    // ⚠⚠ AND THE PARAMETER IS REQUIRED **BECAUSE OF THIS LINE** – ruling A in one sentence, recorded
    // where the counter lives. `Function.length` counts the parameters BEFORE the first one carrying
    // a default, so `exposure: readonly ExposureEvent[] = []` would have left this reading 2: GREEN
    // through the exact change it exists to notice, and the next wave inheriting a counter that had
    // quietly stopped counting. That is the «unable to fail» family in its eleventh costume. The cost
    // of requiring it was 49 mentions across 9 files, every one of them named by `vue-tsc -b --force`,
    // which is why required is the CHEAP option and not the expensive one.
    expect(accrueSpirit.length).toBe(3)
    expect(applyBondDelta.length).toBe(2)
    // ⚠ THROUGH `lineAt`, WHICH THROWS ON AN ABSENT MARKER – the raw `indexOf` form would hand back a
    // `-1` slice and the pin would go green on a function it could no longer find (CLAUDE.md's own
    // gotcha). Comments are stripped first, so this file's own prose about `Rng` cannot fire it.
    const src = codeOnly(readFileSync(`${SRC}engine/spirit.ts`, 'utf8'))
    for (const fn of ['accrueSpirit', 'applyBondDelta']) {
      const signature = lineAt(src, `export function ${fn}(`)
      expect(signature, `${fn} must take no Rng, whatever else it takes`).not.toMatch(/\brng\b/i)
      expect(signature, `${fn}'s declaration must fit on the line this pin reads`).toContain('{')
    }
    // ...and the pin can see a signature at all, so neither assertion above is vacuous.
    // ⚠⚠ AND THE SECOND NAME IS WAVE 6's T3 – ruling A's own instruction («the re-aim adds the new
    // parameter to the same pin's `toContain` list beside `psychologistWorks: boolean`»). ⭐ THE
    // SIBLING ASSERTION ABOVE IS WHY BOTH NAMES HAVE TO FIT ON ONE LINE: `.toContain('{')` proves
    // this pin is not reading a WRAPPED fragment, because a signature broken across lines would make
    // «must take no Rng, whatever else it takes» pass on a truncated string. Measured 14.09: the
    // three-parameter declaration is 119 characters, the repository carries no prettier or eslint
    // width config, and `engine/spirit.ts` already holds lines of 163 – so nothing in the toolchain
    // will wrap it, and a hand-wrapped one goes red here rather than silently hollowing out the pin.
    expect(lineAt(src, 'export function accrueSpirit(')).toContain('psychologistWorks: boolean')
    expect(lineAt(src, 'export function accrueSpirit(')).toContain('exposure: readonly ExposureEvent[]')
  })

  it('⚠ engine/spirit.ts reaches for no clock, no Math.random and no UI', () => {
    const src = readFileSync(`${SRC}engine/spirit.ts`, 'utf8')
    expect(src).not.toContain('Math.random')
    expect(src).not.toContain('new Date')
    expect(src).not.toMatch(/from '(vue|pinia|\.\.\/components)/)
  })

  it('⚠⚠ accrueSpirit is its OWN call, after accrueCondition’s and with only the arrival roll between', () => {
    // `accrueCondition`'s arity-2, zero-RNG contract is pinned in tests/condition.test.ts and must
    // not gain a parameter – so this asserts the CALL ORDER, not a signature.
    //
    // ⚠⚠ RE-AIMED 11.09 BY WAVE 3's T3, AND NOT WEAKENED. WHAT MOVED: one statement now sits between
    // the two calls – `rollArrival(world)`, the private life's weekly arrival hazard
    // (`engine/world/lifeBeat.ts` §5). WHY IT HAD TO: the attachment lifts spirit's effective
    // baseline while the slot is full, so a roll placed after the spirit pass would hand the lift its
    // first return-step a week late – «immediately BEFORE `accrueSpirit`» is the brief's own wording
    // (docs/plans/life-wave-3-builder-2026-09.md §2 T3) and it is the order the lift is judged on.
    //
    // ⚠⚠ RE-AIMED AGAIN 11.09 BY WAVE 3's T6, AND THE RE-AIM IS THE PIN DOING ITS JOB: it went RED
    // («expected [ 'rollArrival(world)', …(1) ] to deeply equal [ 'rollArrival(world)' ]») the moment
    // a second statement slid into the gap, which is exactly what «asserted EXACTLY» was written for.
    // WHAT MOVED: `deliverKnownPartner(world)` – the delivery on `knownWeek` (§6 of the same module).
    // WHY IT BELONGS THERE: a shaved lag of ZERO is common (an open girl draws it at p 0.70 since
    // §4's lag row moved on the census miss, 11.09 – it read p 0.45 when this note was written), so
    // `knownWeek === sinceWeek` on those careers, and delivery placed anywhere before the roll would
    // hold that news back a week for no reason a player could be told. It writes no spirit and takes
    // no `Rng`, so `accrueSpirit`'s own reading is untouched by its presence.
    //
    // ⚠⚠ RE-AIMED A THIRD TIME 11.09 BY WAVE 3's T8, AND AGAIN THE RE-AIM IS THE PIN DOING ITS JOB:
    // it went RED («expected [ 'rollArrival(world)', …(2) ] to deeply equal [ 'rollArrival(world)',
    // …(1) ]») the moment a third statement slid into the gap. WHAT MOVED: `rollSmallTalk(world)` –
    // the tier-1 weekly roll (§7 of the same module). WHY IT BELONGS THERE, AND WHY IN THIS ORDER:
    // it must run AFTER `deliverKnownPartner`, because the brief's rule is «fires only when no beat
    // is already pending that week» and the delivery is the thing most likely to have raised one –
    // a week that is both «there is someone» and «something small» is a week the small thing loses.
    // And BEFORE `accrueSpirit`, for `rollArrival`'s own reason twice over: the bond band it reads
    // and the Mood register that decides what she comes with are both LAST week's settled values.
    // It writes no spirit and takes no `Rng`, so `accrueSpirit`'s own reading is untouched.
    //
    // ⚠⚠ AND RE-AIMED A FOURTH TIME THE SAME DAY, BACK TO TWO – 11.09, THE OWNER'S «ВАРИАНТ 3»
    // (the raise reverted, the engine kept). WHAT MOVED: the `rollSmallTalk(world)` statement the
    // note above describes was REMOVED from the gap again. WHY: §5b prices tier 1 «soft – answerable,
    // never lost» while what T8 shipped through the standard machinery is tier 2's HARD pause, and a
    // soft beat needs a surface – so the whole of tier 1 stays built and DORMANT until T15 builds one
    // (see the note at the call site, and the dormancy guard in tests/wave3-small-talk.test.ts §H,
    // whose ledger records this case among ARM 9's four). ⚠ T15 PUTS THE STATEMENT BACK ON THE SAME
    // LINE, so this pin returns to the three-element form it held for one commit – re-aim it there
    // with its note, exactly as this note does.
    //
    // ⚠ NOTHING IS WEAKENED BY THE RE-AIM: the form is the same ORDERED LIST and it is one element
    // SHORTER, so it refuses a third statement sliding back into the gap – including the tier-1 roll
    // itself, which is the deferral this pin is now the second reader of. MEASURED IN THAT DIRECTION
    // RATHER THAN ASSUMED: with the call site restored it goes RED here – «only the private life's
    // two weekly calls separate them: expected [ 'rollArrival(world)', …(2) ] to deeply equal
    // [ 'rollArrival(world)', …(1) ]» – which is this pin refusing the very statement the deferral
    // took out.
    //
    // ⚠⚠ AND RE-AIMED A FIFTH TIME, BACK TO THREE – 11.09, WAVE 3's T15, WHICH IS THE STEP THE NOTE
    // ABOVE SAID WOULD DO EXACTLY THIS. WHAT MOVED: `rollSmallTalk(world)` is on that line again.
    // WHY: the owner ruled tier 1's SOFT surface into this wave («расписать вариант 2 подробнее
    // сейчас в спеке и тоже всё-таки в эту волну загнать» – who-she-is §5b's SOFT BLOCK CONCRETIZED
    // amendment), so the raise is back – through a per-kind `blocking` flag, a `pendingLifeBeat`
    // narrowed to blocking rows, a Home card and a three-week derived TTL, rather than through a
    // pause. THE POSITION IS THE ONE T8 ARGUED FOR AND THE DEFERRAL RESERVED, unchanged: after the
    // delivery (a week that is both «there is someone» and «something small» is a week the small
    // thing loses – and the raise gate still refuses behind a BLOCKING row), and before
    // `accrueSpirit`, because the bond band it reads and the Mood register that decides what she
    // comes with are both LAST week's settled values. It writes no spirit and takes no `Rng`.
    //
    // ⚠ THE PIN IS THE SAME PIN AND REFUSES THE SAME THINGS: an ordered list of exactly the private
    // life's three weekly calls, so a FOURTH statement sliding into the gap, a reorder of these
    // three, or a removal of any one of them is red.
    //
    // ⚠⚠ RE-AIMED A SIXTH TIME, TO FOUR – 12.09, WAVE 4's T2, AND IT WENT RED EXACTLY AS THE NOTE
    // ABOVE PROMISED A FOURTH STATEMENT WOULD («expected [ 'rollEnds(world)', …(3) ] to deeply equal
    // [ 'rollArrival(world)', …(2) ]»). WHAT MOVED: `rollEnds(world)` – the weekly END hazard
    // (`engine/world/lifeBeat.ts` §8), and it is FIRST of the four rather than last.
    //
    // WHY IT BELONGS THERE, AND WHY IN THAT POSITION SPECIFICALLY. It is not a reading preference;
    // two of wave 4's rulings are consequences of this one line sitting above `rollArrival(world)`
    // (docs/plans/life-wave-4-rulings-2026-09.md, F and A):
    //
    //   · the row this week's arrival may append DOES NOT EXIST YET when the ends hazard rolls, so an
    //     attachment can never end in its own arrival week – `endedWeek >= sinceWeek + 1` and the
    //     shortest romance the engine can produce is exactly ONE week. Ruling A's told-late
    //     discriminator rests on that premise;
    //   · and `endEpisode` writes the date before `arrivalEligible` is next asked, so the cooldown
    //     (shipped dormant in wave 3, live from this commit) refuses same-tick re-arrival by
    //     construction – the slot is free and the clock already reads zero.
    //
    // Swapped, BOTH of those silently stop being true and nothing else in the tree objects, which is
    // precisely why the order is pinned here rather than described in a comment at the call site.
    // ⚠ AND BEFORE `accrueSpirit` for `rollArrival`'s own reason: the week an attachment ends is the
    // week the effective baseline drops back to the flat one, through the standing return rule and
    // through no new code. It writes one date, takes no `Rng` and raises nothing – the shock is T3,
    // the beat T4, the feed row T5 – so `accrueSpirit`'s own reading is untouched by its presence.
    // ⭐⭐ ALL THREE HAVE LANDED (T5, 12.09) AND THE SENTENCE ABOVE IS KEPT AS THE RECORD OF THE COMMIT
    // ORDER RATHER THAN EDITED AWAY. `rollEnds` now also sets `world.spiritShock`, raises the told-now
    // `'ended'` card and appends its kept feed row. ⚠ WHAT THIS PIN IS ABOUT IS UNCHANGED BY ANY OF
    // THAT, which is why the assertion did not move: none of the three touches `world.spirit`, so
    // `accrueSpirit` is still the one writer of it and still reads a world no earlier call in the gap
    // has perturbed. A spirit delta appearing in `rollEnds` is the thing this note still watches for.
    //
    // ⚠ NOTHING IS WEAKENED: the form is the same ORDERED LIST, one element LONGER, so a FIFTH
    // statement sliding into the gap, a reorder of these four, or a removal of any one of them is
    // still red. The behavioural half of the same order lives in tests/wave4-ends.test.ts §E, which
    // reads this very span out of the source and runs the two rolls in the order it finds them.
    //
    // The claim this pin makes is therefore unchanged and the form is still exact: the gap between
    // the two calls is asserted as an ORDERED LIST, so nothing else can slide into it and neither of
    // the two can be reordered – a third statement appearing here goes red just as a swap does.
    const body = worldFunction('resolveBodyAndPlanner')
    const code = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
    const i = code.indexOf('accrueCondition(world, playedThisWeek)')
    expect(i, 'the accrueCondition call moved').toBeGreaterThan(-1)
    // ⚠⚠ RE-AIMED 13.09 BY WAVE 5's T4b (ruling J), AND THE RE-AIM CARRIES A CLAIM THE OLD TEXT COULD
    // NOT MAKE. WHAT MOVED: the call is `accrueSpirit(world, psychologistWorksThisWeek(world))`. WHY:
    // T4 gated the recovery slope on `psychologistHired`, which is true on the two weeks
    // `resolvePsychologist` bills nothing for – a college freeze and a booked family week – so the
    // family paid nothing and received the work. `engine/spirit.ts` cannot ask the predicate itself
    // (an import closes the measured cycle `spirit -> psychologist -> college -> player -> spirit`),
    // so the CALLER answers it, and the caller is this line.
    //
    // ⚠ SO THE EXACT TEXT IS WORTH PINNING, AND THE NEGATIVE BESIDE IT IS WHAT MAKES IT A RULE: the
    // one thing that must never happen here is the raw flag being handed down in the predicate's
    // place, which would reinstate the defect while leaving the signature and every arity pin green.
    //
    // ⚠⚠ RE-AIMED A SECOND TIME 14.09 BY WAVE 6's T3, AND NOT WEAKENED BY A CHARACTER. WHAT MOVED:
    // the call APPENDS a third argument, `exposureEventsOf(world, world.week)` – the week's exposure
    // list, §0.1's dependency inversion applied to a second fact. WHY THE TEXT IS STILL EXACT: the
    // negative beside it is the whole rule, and it is now guarding TWO holes rather than one – the
    // raw flag handed down in the predicate's place (ruling J's own hole, 13.09) and a hoisted or
    // pre-computed exposure list handed down in the derivation's place. ⚠ THE DOUBLE ASK OF
    // `psychologistWorksThisWeek(world)` ON THIS LINE IS DELIBERATE AND DID NOT MOVE – ruling M's ⚠:
    // hoisting it into a local is exactly what would let a raw flag be handed down, so T3 APPENDED
    // and changed nothing else about the statement.
    //
    // ⚠ THIS PIN IS ONE RULING A DID NOT NAME. Its table names three sites (the arity pin above and
    // the two wave-4 files); measured on the tree there are FIVE, and this is the fourth – a text pin
    // living in the same file as the arity one. The fifth is tests/wave5-psychologist-walls.test.ts's
    // ruling-P case. Both are re-aimed with their own notes; carried back to the architect.
    //
    // ⚠⚠ RE-AIMED A THIRD TIME 14.09 BY WAVE 6's **T3b**, WHICH IS THE RE-AIM **AFTER T3's** AND ON
    // THE SAME DAY. RULING P's REASON IN ONE SENTENCE: a trophy and a result row are stamped inside
    // `playHerWeek`, two phases after this pass, so asked about `world.week` the `'stage'` and
    // `'publicLoss'` kinds could never fire, and the horizon moves to the week that has CLOSED.
    // WHAT MOVED: `exposureEventsOf(world, world.week)` -> `exposureEventsOf(world, world.week - 1)`,
    // and nothing else on the line. NOT WEAKENED BY A CHARACTER: the anchor is still the call's exact
    // text, `accrueSpirit` is still called exactly once, and the negative below still guards the two
    // holes it guarded – the raw flag handed down in the predicate's place, and a hoisted list handed
    // down in the derivation's place. ⚠ It now guards a THIRD: a split horizon, which ruling P refuses
    // by name, cannot be spelled on this line without going red here.
    const CALL = 'accrueSpirit(world, psychologistWorksThisWeek(world), exposureEventsOf(world, world.week - 1))'
    const j = code.indexOf(CALL)
    expect(j, 'the accrueSpirit call moved').toBeGreaterThan(i)
    expect(code.filter((l) => l === CALL), 'and it is called exactly once').toHaveLength(1)
    expect(
      code.filter((l) => l.startsWith('accrueSpirit(')),
      '⚠ and there is no OTHER spelling of it – the working week, never the raw flag',
    ).toEqual([CALL])
    // ⚠⚠ RE-AIMED 14.09 BY WAVE 6's T6, AND THE OLD SENTENCE IS KEPT AS THE RECORD: it read «only the
    // private life's FOUR weekly calls separate them». There are FIVE. The architect's ruling M put
    // the leak hazard in this block – «it is a life call and belongs among its siblings» – and T6's
    // own slot argument puts it THIRD, between the arrival and the delivery, because the overtake
    // writes `knownWeek` and `deliverKnownPartner` is what turns that into the standing `'met'` card
    // in the same tick. NOTHING about this pin's claim moves and it is not weakened by a character:
    // it is still «the life calls sit between the body's pass and the spirit's, in THIS ORDER», it is
    // still an exact list with no wildcard, and a sixth call or a reordering is red here.
    // ⚠⚠ RE-AIMED 18.09 BY WAVE 7's T2, AND THE SIXTH CALL IS HERE – the pin fired exactly as the
    // sentence above promised, which is the pin working and not the pin rotting. `rollWedding` is a
    // life call among its siblings (the wedding hazard, §11 of the same module), slotted THIRD:
    // after `rollEnds` (an episode that ended this tick cannot be proposed into – the date is
    // already written and the gate refuses) and after `rollArrival` (free there – a row born this
    // tick is 0 weeks deep against a 52-week threshold – and beside its own hazard family), before
    // the leak so the household hears her before the papers do. Still an exact list, still no
    // wildcard, and a SEVENTH call or a reordering is red here.
    // ⚠⚠ RE-AIMED AGAIN 18.09, SAME WAVE, AND THE SEVENTH, EIGHTH AND NINTH CALLS ARE HERE – T2's
    // re-aim above pinned its own call and the wave's LATER tasks then landed three more, each with
    // a slot argued on both sides at its own call site (phaseHerWeek.ts, the 1c block): T3's
    // `landWedding` directly after the roll, so the week the clock comes due is the week it lands,
    // and before the leak for the reading's sake alone (nothing between them shares state with it);
    // T10's `deliverOwnKey` before the spouse and tier 1, because the three share ONE soft surface
    // and the once-a-career story outranks both; T5's `rollSpouseView` after the delivery (a week
    // that is both news and a word from the spouse stops for the news) and before small talk (the
    // rarer, bigger voice takes the shared surface). The shipped order is the brief's own – checked
    // against docs/plans/life-wave-7-builder-2026-09.md before this list moved. Still an exact
    // list, still no wildcard, and a TENTH call or a reordering is red here.
    // ⚠⚠ RE-AIMED 20.09 BY WAVE 8's T2, AND THE TENTH CALL IS HERE – the pin fired exactly as the
    // sentence above promised, on the very next call to land, which is the pin working and not the
    // pin rotting. `rollPregnancy` is a life call among its siblings (the pregnancy hazard, §14 of
    // the same module), slotted FIFTH: after `rollEnds`, so a marriage that ended this tick cannot
    // be conceived into (the date is written, `latchedEpisode` answers null, and the gate refuses
    // before any stream exists); after `landWedding`, and THAT one is load-bearing rather than free,
    // because the door IS the latch and `landWedding` is what writes it – running first would give
    // every career a systematic blind week after its own wedding; and before the leak, on
    // `rollWedding`'s own precedent, so the household hears her before the papers do. The shipped
    // order is the brief's own – checked against docs/plans/life-wave-8-builder-2026-09.md before
    // this list moved. Still an exact list, still no wildcard, and an ELEVENTH call or a reordering
    // is red here.
    // ⚠⚠ RE-AIMED 20.09 BY WAVE 8's T3, AND THE ELEVENTH CALL IS HERE – the pin fired on the very
    // next call to land, for the third wave running, which is the pin working rather than the pin
    // rotting. `landPregnancyPause` is the pause week's ONE feed row, slotted SIXTH, immediately
    // under the raise it belongs to. ⚠ ITS SLOT IS FREE AND SAYING SO IS THE ARGUMENT, not a gap in
    // one: `ECONOMY.motherhood.playsOnWeeks` is 8, so the pause can never land on the week of its own
    // announcement and these two calls cannot meet on one tick; nothing else in the list reads or
    // writes `world.pregnancy`, and the entry gate – which is what the pause actually IS – is not in
    // this pipeline at all (`pauseCovering`, `world/medical.ts`, read per event by every surface).
    // The shipped order is the brief's own – docs/plans/life-wave-8-builder-2026-09.md §2 T3. Still
    // an exact list, still no wildcard, and a TWELFTH call or a reordering is red here.
    // ⚠⚠ RE-AIMED 20.09 BY WAVE 8's T4, AND THE TWELFTH CALL IS HERE – the pin fired on the very next
    // call to land, for the FOURTH wave running, which is the pin working rather than the pin rotting.
    // `landBirth` is the due week's five writes, slotted SEVENTH, immediately under the pause it
    // closes. ⚠ ITS SLOT IS **LOAD-BEARING IN BOTH DIRECTIONS**, which is the first time that is true
    // of a call on this list, and both halves are argued at the call site (phaseHerWeek.ts, the 1c
    // block): (a) it must run BEFORE `accrueSpirit`, because it is the SECOND writer of
    // `world.spiritShock` and the pass that PRICES a shock reads `shock.week === world.week` – landing
    // after it would apply the postpartum band a week late for ever, which is `rollEnds`' own
    // arrangement six calls up; (b) it must run AFTER `rollEnds`, so that on the one week a
    // marriage ends AND a child is born the birth's mark REPLACES the break-up's – the single slot's
    // «the later, larger window wins» (§2 T4), which reversed would let the divorce outrank the birth.
    // Nothing between it and `accrueSpirit` reads `world.pregnancy`, `world.children` or
    // `world.spiritShock`. The shipped order is the brief's own –
    // docs/plans/life-wave-8-builder-2026-09.md §2 T4. Still an exact list, still no wildcard, and a
    // THIRTEENTH call or a reordering is red here.
    // ⚠⚠ RE-AIMED 22.09 BY WAVE 11's T2, AND THE THIRTEENTH CALL IS HERE – the pin fired on the
    // very next call to land, for the FIFTH wave running, which is the pin working rather than the
    // pin rotting. `landPregnancyAnnouncement` is the week she SAYS it, slotted SIXTH, immediately
    // under the roll it belongs to. ⚠ ITS SLOT IS LOAD-BEARING ON ONE SIDE ONLY and the side is
    // argued at the call site: it must run in the SAME tick as `rollPregnancy` and immediately after
    // it, because a zero window – which the shipped `ECONOMY.life.lag` draws 70% of the time for an
    // open girl – has to behave exactly as the single wave-8 call did, and anything between the two
    // would be one tick of a window nobody drew. Nothing else in the list reads or writes
    // `world.pregnancy`. The shipped order is the plan's own –
    // docs/plans/life-wave-11-builder-2026-09.md §T2. Still an exact list, still no wildcard, and a
    // FOURTEENTH call or a reordering is red here.
    expect(code.slice(i + 1, j), 'only the private life\'s thirteen weekly calls separate them').toEqual([
      'rollEnds(world)',
      'rollArrival(world)',
      'rollWedding(world)',
      'landWedding(world)',
      'rollPregnancy(world)',
      'landPregnancyAnnouncement(world)',
      'landPregnancyPause(world)',
      'landBirth(world)',
      'rollLeak(world)',
      'deliverKnownPartner(world)',
      'deliverOwnKey(world)',
      'rollSpouseView(world)',
      'rollSmallTalk(world)',
    ])
  })

  it('⚠⚠ the played-hurt −4 sits INSIDE the warning band’s own arm, and nowhere else', () => {
    // The one bond row with no cheap behavioural reach: it fires only where a real entry meets a
    // `'warn'` clearance, deep inside a played week. So it is pinned STRUCTURALLY – through the
    // marker helpers, which throw on a rotted marker rather than silently widening (CLAUDE.md's
    // gotcha about raw `indexOf` slices) – and mutation-verified by deleting the call.
    const arm = region(worldFunction('playHerWeek'), "if (clearance === 'warn') {", 'world.pendingTournament =')
    expect(arm).toContain('applyBondDelta(world, ECONOMY.bond.delta.playedHurt)')
    // ...and it is read exactly once in the whole engine: the walkover and medical-withdrawal arms
    // above it never pay, because she never played.
    const readers = srcFiles().filter(([, text]) => text.includes('delta.playedHurt'))
    expect(readers.map(([path]) => path)).toEqual(['engine/world/phaseHerWeek.ts'])
    expect(readers[0][1].split('delta.playedHurt').length - 1).toBe(1)
  })

  // ===============================================================================================
  // ⚠⚠ v72 STEP 4 — THE FOG PIN RE-AIMED. THE NUMBERS STILL DO NOT LEAVE; THE *WORDS* DO.
  // ===============================================================================================
  //
  // WHAT IT SAID BEFORE, and it was right for the step it was written in: «the two numbers do not
  // ride the Snapshot IN THIS STEP, so no component, store or composable CAN print one», enforced by
  // refusing the four names anywhere outside `engine/` and refusing three field spellings anywhere
  // in `shared/`.
  //
  // ⭐ STEP 4 IS THE STEP THAT CHANGES THAT, and it changes exactly half of it. Her face, the Mood
  // word and her own voice all need a reading of the two numbers to cross the boundary – so what
  // crosses now is a WORD, a BAND and an id (`moodWord` / `moodRegister` / `bondBand` /
  // `temperament` on `DiaryFacts`). ⚠ WHAT DOES NOT CROSS, AND IS WHAT THE FOG LAW ACTUALLY BANS, IS
  // THE NUMBER: there is no `spirit:` and no `bond:` field anywhere under `shared/`, so no meter, no
  // bar, no arrow and no tile figure is CONSTRUCTIBLE, whatever a future screen decides to render.
  // The pin is therefore re-aimed at the number rather than relaxed – and it gains an arm the old
  // one did not have: no component may name the temperament either (who-she-is §5b, «no label,
  // ever»), which is a different promise from the fog rule and was previously only implied.
  it('⚠⚠ THE FOG RULE: no meter, no bar, no arrow – neither NUMBER leaves the engine at all', () => {
    const shared = srcFiles().filter(([path]) => path.startsWith('shared/'))
    for (const [path, text] of shared) {
      for (const field of ['spirit:', 'bond:']) {
        expect(text, `${path} puts the raw ${field.slice(0, -1)} on the wire`).not.toContain(field)
      }
    }
    // ...and the weekly rules and the match seam stay engine-only: nothing outside can move either.
    //
    // ⚠⚠ ALIGNED 14.09 BY WAVE 6's T10, ON THE ARCHITECT'S RULING U, AND IT IS NOT A WEAKENING.
    // This line was TEXT-BASED while its two immediate neighbours – the `temperament` rule directly
    // below and the `attachmentLift` rule below that – both strip comments first with `codeOnly` and
    // both say why in the same words: «a pin that tripped on the prose explaining the rule would be
    // repaired by deleting the explanation, which is the wrong repair». Same file, same screen,
    // three rules, one of them measuring something else.
    //
    // WHAT IT COST: wave 6's T7 reddened this on an ENGLISH PROSE mention of `accrueSpirit` inside a
    // comment in `src/viz/commentary.ts` – a file that calls nothing – and reworded its own note
    // rather than re-aim another task's guard mid-task, which was the right call and is why the
    // finding reached the architect instead of a quiet edit.
    //
    // ⚠ THE CLAIM IS UNCHANGED AND THE INSTRUMENT NOW MATCHES IT. The claim is «no CODE outside
    // `engine/` calls these three»; the old form was a proxy that also fired on English, and a proxy
    // that fires on the documentation is repaired by deleting documentation. `codeOnly` makes the
    // test measure the claim. A real call is still red – it is code – and the aliased-import hole the
    // helper's own docstring names is the reason this file has never used a bare `includes`.
    //
    // ⭐ THREE ARMS, RUN 14.09, EACH REVERTED BY HAND WITH `src/viz/commentary.ts`'s md5 CHECKED BACK
    // TO PRISTINE (`aec08ecf…`) – because an alignment that cannot be shown to keep its teeth is a
    // weakening whatever its note says:
    //
    //   U-a  an ENGLISH PROSE mention of `accrueSpirit` appended as a `//` comment to
    //        `src/viz/commentary.ts` – exactly the shape T7 hit. **0 RED.** That is the claim.
    //   U-a′ THE CONTROL FOR IT, and the half that makes U-a mean anything: the same prose, with this
    //        line reverted to `.test(text)`. **1 RED** – «expected [ 'viz/commentary.ts' ] to deeply
    //        equal []». So the old form really did fire on English, measured rather than argued.
    //   U-b  a real CODE occurrence outside `engine/` – `const ARM_U_B = { spiritMatchFactor: 1 }` in
    //        the same file, no comment anywhere near it. **1 RED**, the same sentence. The rule still
    //        bites on the thing it is about.
    const outsideTheEngine = srcFiles()
      .filter(([path]) => !path.startsWith('engine/'))
      .filter(([, text]) => /\b(accrueSpirit|spiritMatchFactor|applyBondDelta)\b/.test(codeOnly(text)))
      .map(([path]) => path)
    expect(outsideTheEngine).toEqual([])
    // ⚠ AND THE STRIP IS NOT ALLOWED TO HAVE EATEN THE RULE. `codeOnly` on a corpus it happened to
    // blank would make the sweep pass for ever – so the positive control is asked out loud: inside
    // `engine/` these three names are still there to be found, in code, after the same strip.
    const insideTheEngine = srcFiles()
      .filter(([path]) => path.startsWith('engine/'))
      .filter(([, text]) => /\b(accrueSpirit|spiritMatchFactor|applyBondDelta)\b/.test(codeOnly(text)))
      .map(([path]) => path)
    expect(insideTheEngine.length, '⚠⚠ the strip left nothing to sweep – this rule would pass on an empty corpus')
      .toBeGreaterThan(1)
  })

  it('⚠⚠ NO LABEL, EVER: `temperament` reaches the facts and no surface at all', () => {
    // who-she-is §5b: the parent LEARNS who she is from how the diary talks. A character-sheet line
    // («темперамент: холерик») would flatten the one discovery the layer is about – so the id may
    // ride the facts (all 44 voiced lines are licensed on it) and may not reach a screen.
    // ⚠ `codeOnly`, because this is a claim about CODE: a pin that tripped on the prose explaining
    // the rule would be repaired by deleting the explanation, which is the wrong repair.
    const surfaces = srcFiles()
      .filter(([path]) => path.startsWith('components/') || path.startsWith('stores/') || path.startsWith('composables/'))
      .filter(([, text]) => /\btemperament\b/i.test(codeOnly(text)))
      .map(([path]) => path)
    expect(surfaces).toEqual([])
    // ...and the ONE place outside `engine/` that may name it is the facts shape itself.
    const named = srcFiles()
      .filter(([path]) => !path.startsWith('engine/'))
      .filter(([, text]) => /\btemperament\b/i.test(codeOnly(text)))
      .map(([path]) => path)
    // ⚠ RE-AIMED 22.09 BY WAVE 10's T1, AND NOT WEAKENED. The FENCE is the assertion above this one
    // – no component, store or composable may name it – and that half is untouched and still empty.
    // What moved is the list of FACTS SHAPES allowed to carry the id: `DynastyHandover`
    // (`shared/protocol/profile.ts`) carries `motherTemperament`, because §7's heredity needs the
    // mother's birth axis at the daughter's creation and the block is the only thing that crosses.
    // It is a fact riding the wire exactly as `DiaryFacts.temperament` does one module over, and no
    // screen reads either – which is what the first assertion goes on proving.
    expect(named).toEqual(['shared/protocol/narrative.ts', 'shared/protocol/profile.ts'])
  })

  it('⚠⚠ attachmentLift is read ONCE – in accrueSpirit’s return TARGET – and nowhere else', () => {
    // ⚠⚠ RE-AIMED 11.09 BY WAVE 3's T4, AND NOT WEAKENED.
    //
    // WHAT IT SAID BEFORE, and it was right for the wave it was written in: «attachmentLift is
    // DECLARED AND NOT READ, deliberately, until wave 3 wires the slot», enforced by asserting that
    // NO file under `src/` reads it. WHAT MOVED: T4 is the step that gives it a reader –
    // `accrueSpirit`'s weekly return now walks toward `baseline + attachmentLift` while
    // `activeEpisode` returns a row (docs/plans/life-wave-3-builder-2026-09.md §2 T4). The old form
    // was written to go red on exactly this commit, and this is that commit.
    //
    // ⚠ THE CLAIM IS TIGHTER THAN THE ONE IT REPLACES, not looser. «No reader anywhere» has become
    // «ONE reader, in one named function, on the line that computes the return's TARGET», and the
    // three ways this rule could be got wrong are each refused by a line below: a second reader
    // anywhere in `src/`; a read that is not gated on the slot being full; and a read that lands in
    // `weekPerturbation`, which would make the lift a one-off SPIKE THAT DECAYS instead of a moved
    // baseline – the opposite shape from «lifts a little and stays lifted», and the one thing §1b
    // actually specifies.
    const owners = srcFiles()
      // ⚠ A READ, NOT A MENTION – and `codeOnly` now, because the constant is discussed in prose in
      // four places (its declaration, `accrueSpirit`'s note, the `ECONOMY.life` banner and
      // `world/loveEpisodes.ts`), and a pin that tripped on prose would be repaired by deleting the
      // explanation, which is the wrong repair.
      .filter(([, text]) => codeOnly(text).includes('.attachmentLift'))
      .map(([path]) => path)
    expect(owners, 'exactly one file in src/ reads it').toEqual(['engine/spirit.ts'])
    // ...and inside that file it is read exactly ONCE, on the line that builds the return's target.
    const accrue = codeOnly(engineModuleFunction('spirit', 'accrueSpirit'))
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    const reads = accrue.filter((l) => l.includes('.attachmentLift'))
    expect(reads, 'one read, and it is inside accrueSpirit').toHaveLength(1)
    expect(reads[0], 'it is added to the BASELINE – an effective baseline, not a bonus').toContain('s.baseline +')
    expect(reads[0], 'and it is gated on somebody actually being there').toContain('activeEpisode(world)')
    // ...and THAT value is what the return step is handed, which is the whole of «a target, not a
    // bump»: she walks toward it at her own rate and holds there.
    const step = accrue.filter((l) => l.includes('stepToward(world.spirit'))
    expect(step, 'the return step is still one line').toHaveLength(1)
    expect(step[0], 'the return walks toward the lifted target').toContain('target')
    // ⚠⚠ AND NOT ONE TENTH OF IT REACHES THE WEEK'S OWN EVENTS.
    expect(codeOnly(engineModuleFunction('spirit', 'weekPerturbation'))).not.toContain('attachmentLift')
    // ...and it IS declared, at the value the design named – the other half of the same claim, kept
    // verbatim from the pin this replaces.
    expect(ECONOMY.spirit.attachmentLift).toBe(5)
  })

  it('⚠⚠ the break-up shock is read ONCE, OUTSIDE the scale, and never inside weekPerturbation', () => {
    // ⚠⚠ THE ARCHITECT'S RULING C AS A STRUCTURAL PIN (docs/plans/life-wave-4-rulings-2026-09.md §C),
    // and it is deliberately the TWIN of the `attachmentLift` guard above rather than a new shape –
    // the two constants fail in the same direction and the same three ways. who-she-is §4's −22 / −34
    // are ALREADY intensity-scaled: one base of about −27.5 seen through `perturbationScale`'s ×0.8
    // and ×1.25. A row inside `weekPerturbation` would multiply them a SECOND time, to −17.6 / −42.5 –
    // two numbers that look every bit as plausible and are not the design's.
    //
    // ⚠ THE BEHAVIOURAL HALF IS tests/wave4-spirit-shock.test.ts §C, which reads the literal 48 / 36
    // from a flat 70 against the 52.4 / 27.5 the double-scale would produce. This half is here because
    // this is where the constant's ONE legal reader lives, and because a structural pin refuses the
    // defect at the line that would introduce it rather than at the number that would come out.
    const owners = srcFiles()
      // ⚠ A READ, NOT A MENTION – `codeOnly` for `attachmentLift`'s own stated reason: the constant is
      // discussed in prose in `economy.ts`, in `accrueSpirit`'s note and in `world/lifeBeat.ts`, and a
      // pin that tripped on an explanation would be repaired by deleting the explanation.
      .filter(([, text]) => codeOnly(text).includes('.shock'))
      .map(([path]) => path)
    expect(owners, 'exactly one file in src/ reads it').toEqual(['engine/spirit.ts'])
    const accrue = codeOnly(engineModuleFunction('spirit', 'accrueSpirit'))
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
    const reads = accrue.filter((l) => l.includes('.shock['))
    expect(reads, 'one read, and it is inside accrueSpirit').toHaveLength(1)
    // ⚠⚠ AND IT IS NOT ON THE SCALED LINE. This is the whole of ruling C in one assertion: the term is
    // built on its own line, so nothing can multiply it on the way past.
    expect(reads[0], 'the shock term is never multiplied by the perturbation scale')
      .not.toContain('perturbationScale')
    // ...and the sum that lands adds it as its own summand, beside the scaled perturbation.
    const moved = accrue.filter((l) => l.includes('weekPerturbation(world'))
    expect(moved, 'the week\'s movement is still one expression').toHaveLength(1)
    expect(moved[0], 'the perturbation is still the thing that is scaled').toContain('perturbationScale')
    // ⚠⚠ AND NOT ONE POINT OF THE SHOCK REACHES THE WEEK'S OWN EVENTS – `attachmentLift`'s own last
    // line, restated for the constant that would be scaled twice instead of decaying.
    expect(codeOnly(engineModuleFunction('spirit', 'weekPerturbation'))).not.toContain('.shock')
    // ...and both rows ARE declared, at the values §4 named – asserted as literals, because a
    // comparison built out of the constant cannot see the constant move.
    expect(ECONOMY.spirit.shock.breakup).toEqual({ steady: -22, intense: -34 })
  })
})
