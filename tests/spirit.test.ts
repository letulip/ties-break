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
  seasonWrapsWithNoVacation,
  spiritMatchFactor,
  temperamentFor,
  temperamentIntensity,
  TEMPERAMENTS,
  type Temperament,
} from '../src/engine/spirit'
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
import { worldFunction } from './worldSource'
import { region } from './helpers/source'
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
  accrueSpirit(world)
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
        accrueSpirit(low)
        expect(low.spirit).toBe(40 + rate)

        const high = probeWorld(temperament, calm)
        high.spirit = 90
        accrueSpirit(high)
        expect(high.spirit).toBe(90 - rate)

        // ...and the step never overshoots the baseline into an oscillation.
        const nearly = probeWorld(temperament, calm)
        nearly.spirit = ECONOMY.spirit.baseline - 1
        accrueSpirit(nearly)
        expect(nearly.spirit).toBe(ECONOMY.spirit.baseline)
      })

      it('clamps to 0..100 and stores tenths, whatever is thrown at it', () => {
        const week = weekWhere((w) => quiet(createWorld('spirit-probe'), w), 5)
        const floorTest = probeWorld(temperament, week)
        floorTest.spirit = 0
        floorTest.injury = { kind: 'knee', severity: 'major', weeksRemaining: 9, totalWeeks: 9, sinceWeek: week }
        accrueSpirit(floorTest)
        expect(floorTest.spirit).toBeGreaterThanOrEqual(0)

        const ceilTest = probeWorld(temperament, week)
        ceilTest.spirit = 100
        ceilTest.vacations = [{ week, packageId: 'seaside', paidCents: 0 }]
        accrueSpirit(ceilTest)
        expect(ceilTest.spirit).toBeLessThanOrEqual(100)

        const tenths = probeWorld(temperament, week)
        tenths.injury = { kind: 'knee', severity: 'minor', weeksRemaining: 2, totalWeeks: 3, sinceWeek: week - 1 }
        accrueSpirit(tenths)
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
    accrueSpirit(steady)
    accrueSpirit(intense)
    expect(intense.spirit).toBeLessThan(steady.spirit)

    const backSteady = probeWorld('sunny', week)
    const backIntense = probeWorld('fiery', week)
    backSteady.spirit = 40
    backIntense.spirit = 40
    accrueSpirit(backSteady)
    accrueSpirit(backIntense)
    expect(backSteady.spirit).toBeGreaterThan(backIntense.spirit)
  })

  it('⚠ a long quiet run settles AT the baseline and stays there (equilibrium, per arm)', () => {
    const base = createWorld('spirit-probe')
    for (const t of TEMPERAMENTS) {
      const world = probeWorld(t, 5)
      world.spirit = 12
      for (let i = 0; i < 60; i++) {
        world.week = weekWhere((w) => quiet(base, w), world.week + 1)
        accrueSpirit(world)
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
    accrueSpirit(low)
    expect(low.bond).toBe(50 + ECONOMY.bond.regressionPerWeek)

    const high = probeWorld('sunny', calm)
    high.bond = 90
    accrueSpirit(high)
    expect(high.bond).toBe(90 - ECONOMY.bond.regressionPerWeek)

    const settled = probeWorld('sunny', calm)
    accrueSpirit(settled)
    expect(settled.bond).toBe(ECONOMY.bond.start)
  })

  it('a −25 season heals in about fifty weeks and never overshoots', () => {
    const base = createWorld('spirit-probe')
    const world = probeWorld('sunny', 5)
    world.bond = ECONOMY.bond.start - 25
    let weeks = 0
    while (world.bond < ECONOMY.bond.start && weeks < 200) {
      world.week = weekWhere((w) => quiet(base, w), world.week + 1)
      accrueSpirit(world)
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
    expect(SAVE_SCHEMA_VERSION).toBe(72)
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

describe('the fence this step is judged by', () => {
  it('⚠⚠ the weekly rules take ZERO draws – MAIN is not touched by either of them', () => {
    const world = createWorld('no-draws')
    world.week = 40
    world.injury = { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: 40 }
    const before = JSON.stringify(world.rngMain)
    accrueSpirit(world)
    applyBondDelta(world, -3)
    expect(JSON.stringify(world.rngMain)).toBe(before)
  })

  it('⚠ neither weekly function takes an Rng at all – the strongest form of the same claim', () => {
    expect(accrueSpirit.length).toBe(1)
    expect(applyBondDelta.length).toBe(2)
  })

  it('⚠ engine/spirit.ts reaches for no clock, no Math.random and no UI', () => {
    const src = readFileSync(`${SRC}engine/spirit.ts`, 'utf8')
    expect(src).not.toContain('Math.random')
    expect(src).not.toContain('new Date')
    expect(src).not.toMatch(/from '(vue|pinia|\.\.\/components)/)
  })

  it('⚠⚠ accrueSpirit is its OWN call, immediately after accrueCondition’s', () => {
    // `accrueCondition`'s arity-2, zero-RNG contract is pinned in tests/condition.test.ts and must
    // not gain a parameter – so this asserts the CALL ORDER, not a signature.
    const body = worldFunction('resolveBodyAndPlanner')
    const code = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
    const i = code.indexOf('accrueCondition(world, playedThisWeek)')
    expect(i, 'the accrueCondition call moved').toBeGreaterThan(-1)
    expect(code[i + 1]).toBe('accrueSpirit(world)')
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

  it('⚠⚠ no meter, no tile, no bar, no arrow – neither number leaves the engine at all', () => {
    // The fog rule, pinned at the strongest place it can be: the two numbers do not ride the
    // Snapshot in this step, so no component, store or composable CAN print one. (`bond` is already
    // a local name in two components – an apparel campaign's buy-out – which is why this asks the
    // structural question and not a word-search one.)
    const outsideTheEngine = srcFiles()
      .filter(([path]) => !path.startsWith('engine/'))
      .filter(([, text]) => /\b(accrueSpirit|spiritMatchFactor|applyBondDelta|temperament)\b/.test(text))
      .map(([path]) => path)
    expect(outsideTheEngine).toEqual([])
    const protocol = srcFiles()
      .filter(([path]) => path.startsWith('shared/'))
      .map(([, text]) => text)
      .join('\n')
    for (const field of ['spirit:', 'bond:', 'temperament:']) expect(protocol).not.toContain(field)
  })

  it('⚠ attachmentLift is DECLARED AND NOT READ, deliberately, until wave 3 wires the slot', () => {
    const owners = srcFiles()
      // ⚠ A READ, NOT A MENTION: the constant is discussed in prose in two places (its own
      // declaration and `accrueSpirit`'s note on why the target is a flat baseline), and a pin that
      // tripped on prose would be repaired by deleting the explanation, which is the wrong repair.
      .filter(([, text]) => text.includes('.attachmentLift'))
      .map(([path]) => path)
    expect(owners).toEqual([])
    // ...and it IS declared, at the value the design named – the other half of the same claim.
    expect(ECONOMY.spirit.attachmentLift).toBe(5)
  })
})
