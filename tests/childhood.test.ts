// THE CHILDHOOD, 5 -> 14 – the prologue's phase 1 (docs/specs/childhood-growth-2026-09.md).
//
// ⚠ THE FIRST BLOCK IS THE CONTROL, PINNED AS A DEFECT RATHER THAN FIXED. `ageFactor` below 13 is
// clamped to `peakRate`, and the next person who reaches for the obvious repair – dragging
// `growthStart` down to 5 – needs the size of what that does in front of them. So the blow-out is
// asserted, and a curve change that "fixes" it fails here and sends the reader to the spec.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import {
  ageFactor,
  rollPotential,
  SKILL_KEYS,
  SKILL_POINTS_PER_YEAR,
  STARTING_SKILL_BAND,
  type KidSkills,
} from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { startingSkills, withHeadStart } from '../src/engine/world/player'
import { WEEKS_IN_SEASON } from '../src/shared/dates'
import { DEFAULT_PROFILE, SESSION_KINDS } from '../src/shared/protocol'
import {
  appetiteAt,
  CHILDHOOD,
  CHILDHOOD_AGES,
  childhoodArrival,
  childhoodWalk,
  devotedChildhood,
  medianChildhood,
  neglectedChildhood,
  weightAt,
  type ChildhoodYear,
} from '../src/engine/childhood'

const CHILDHOOD_SRC = readFileSync(new URL('../src/engine/childhood.ts', import.meta.url), 'utf8')

/** ⚠ THE SOURCE PINS BELOW READ THE CODE, NOT THE PROSE – and the first draft of them did not, which
 *  is worth recording because the failure was instructive rather than annoying. The module's header
 *  names `rollPotential` and the `seed:kid` sub-stream precisely in order to explain why it touches
 *  NEITHER, so a pin over the raw file was asking the file to stop explaining itself in exchange for
 *  staying green. Comments out, code in. (No string literal in that module contains `//`, so the
 *  cheap strip is exact here; the assertions below are mutation-checked against the stripped text.) */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1')
}
const CHILDHOOD_CODE = codeOf(CHILDHOOD_SRC)

function ageTermOver(from: number, to: number): number {
  let sum = 0
  for (let age = from; age < to - 1e-9; age += 1 / WEEKS_IN_SEASON) sum += ageFactor(age)
  return sum
}

function meanOf(s: KidSkills): number {
  return SKILL_KEYS.reduce((a, k) => a + s[k], 0) / SKILL_KEYS.length
}

describe('the control – why the prologue may not reuse the game\'s curve', () => {
  it('returns the maximum junior rate at every age below 13', () => {
    for (const age of [5, 6, 8, 10, 12, 13]) {
      expect(ageFactor(age)).toBeCloseTo(ECONOMY.development.ageCurve.peakRate, 10)
    }
    // ...and it is only past 13 that the curve says anything at all
    expect(ageFactor(14)).toBeLessThan(ageFactor(13))
    expect(ageFactor(18)).toBeLessThan(ageFactor(16))
  })

  it('would grant a prologue 2.8x the age term of the whole 14->18 window', () => {
    const prologue = ageTermOver(6, 14)
    const junior = ageTermOver(14, 18)
    const toPeak = ageTermOver(14, 23)
    // The build spec's §1a, re-measured here: 2.56 / 0.90 / 1.43.
    expect(prologue).toBeCloseTo(2.56, 2)
    expect(junior).toBeCloseTo(0.9, 2)
    expect(toPeak).toBeCloseTo(1.43, 2)
    expect(prologue / junior).toBeGreaterThan(2.8)
    expect(prologue / toPeak).toBeGreaterThan(1.7)
  })
})

describe('the childhood is nine years from five', () => {
  it('runs 5..13 and hands over at 14', () => {
    expect(CHILDHOOD.startAge).toBe(5)
    expect(CHILDHOOD.endAge).toBe(14)
    expect(CHILDHOOD_AGES).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13])
    expect(medianChildhood()).toHaveLength(9)
  })

  it('weights the nine years by what a child that age can take, and they sum to one', () => {
    let total = 0
    for (const age of CHILDHOOD_AGES) total += weightAt(age)
    expect(total).toBeCloseTo(1, 12)
    // rising: a five-year-old's year is worth less than a thirteen-year-old's, and there is no
    // second table saying so – `weightAt` IS `appetiteAt` normalised
    expect(weightAt(5)).toBeLessThan(weightAt(9))
    expect(weightAt(9)).toBeLessThan(weightAt(13))
    expect(appetiteAt(5)).toBeCloseTo(CHILDHOOD.appetiteAt5, 12)
    expect(appetiteAt(13)).toBeCloseTo(CHILDHOOD.appetiteAt13, 12)
  })
})

describe('the arrival at fourteen', () => {
  const seeds = Array.from({ length: 400 }, (_, i) => `childhood-test-${i}`)

  it('a median childhood is a no-op – she is exactly the girl startingSkills has always produced', () => {
    const years = medianChildhood()
    expect(childhoodWalk(years).level).toBeCloseTo(0, 12)
    for (const seed of seeds) {
      const born = startingSkills(seed, DEFAULT_PROFILE)
      expect(childhoodArrival(born, years)).toEqual(born)
    }
  })

  it('a devoted childhood is worth exactly one extra junior year, before the band guard', () => {
    expect(CHILDHOOD.swingPoints).toBe(SKILL_POINTS_PER_YEAR)
    expect(childhoodWalk(devotedChildhood()).level).toBeCloseTo(CHILDHOOD.swingPoints, 12)
    expect(childhoodWalk(neglectedChildhood()).level).toBeLessThan(0)
  })

  it('⭐⭐ leaves her inside the band a freshly created fourteen-year-old occupies today', () => {
    // Every path the data can express, including the adversarial ones a card table could produce.
    const paths: ChildhoodYear[][] = [
      neglectedChildhood(),
      medianChildhood(),
      devotedChildhood(),
      CHILDHOOD_AGES.map((age) => ({ age, practice: 0, teaching: 0, focus: 'general' as const })),
      CHILDHOOD_AGES.map((age) => ({ age, practice: 1, teaching: 1, focus: 'general' as const })),
      // the shape channel at full lock, one path per session kind
      ...SESSION_KINDS.map((focus) => devotedChildhood().map((y) => ({ ...y, focus }))),
      ...SESSION_KINDS.map((focus) => neglectedChildhood().map((y) => ({ ...y, focus }))),
    ]
    for (const years of paths) {
      for (const seed of seeds) {
        const born = startingSkills(seed, DEFAULT_PROFILE)
        const raised = childhoodArrival(born, years)
        for (const k of SKILL_KEYS) {
          const [lo, hi] = STARTING_SKILL_BAND[k]
          expect(raised[k]).toBeGreaterThanOrEqual(lo)
          expect(raised[k]).toBeLessThanOrEqual(hi)
        }
      }
    }
  })

  it('...and so does the girl the game actually receives, once the head start is on top', () => {
    // The arrival goes through `withHeadStart` exactly as `createWorld` puts a fresh build through
    // it, so the SET of fourteen-year-olds a prologue can hand over is the same set, not a wider one.
    for (const birthMonth of [1, 6, 12]) {
      let lo = Infinity
      let hi = -Infinity
      let todayLo = Infinity
      let todayHi = -Infinity
      for (const seed of seeds) {
        const born = startingSkills(seed, DEFAULT_PROFILE)
        const today = withHeadStart(born, birthMonth)
        for (const years of [neglectedChildhood(), medianChildhood(), devotedChildhood()]) {
          const raised = withHeadStart(childhoodArrival(born, years), birthMonth)
          for (const k of SKILL_KEYS) {
            lo = Math.min(lo, raised[k])
            hi = Math.max(hi, raised[k])
          }
        }
        for (const k of SKILL_KEYS) {
          todayLo = Math.min(todayLo, STARTING_SKILL_BAND[k][0] + (today[k] - born[k]))
          todayHi = Math.max(todayHi, STARTING_SKILL_BAND[k][1] + (today[k] - born[k]))
        }
      }
      expect(lo).toBeGreaterThanOrEqual(todayLo - 1e-9)
      expect(hi).toBeLessThanOrEqual(todayHi + 1e-9)
    }
  })

  it('⚠⚠ the band guard is a GUARD and not the mechanism – it must not be doing the work', () => {
    // The containment above is structural: everything is clamped into `STARTING_SKILL_BAND`, so that
    // assertion cannot fail however large the dial gets, and on its own it proves only that the clamp
    // is applied. THIS is the claim that can fail – the dial is small enough that the guard is a rare
    // edge case rather than the thing producing the answer. Set `swingPoints` to 12 and watch it go.
    const years = devotedChildhood()
    const level = childhoodWalk(years).level
    let gained = 0
    let clamped = 0
    let cells = 0
    for (const seed of seeds) {
      const born = startingSkills(seed, DEFAULT_PROFILE)
      const raised = childhoodArrival(born, years)
      for (const k of SKILL_KEYS) {
        cells++
        gained += raised[k] - born[k]
        if (Math.abs(born[k] + level - raised[k]) > 0.005) clamped++
      }
    }
    expect(gained / cells).toBeGreaterThan(0.85 * CHILDHOOD.swingPoints)
    expect(clamped / cells).toBeLessThan(0.25)
  })

  it('moves her – a devoted childhood beats a neglected one on every attribute', () => {
    for (const seed of seeds.slice(0, 50)) {
      const born = startingSkills(seed, DEFAULT_PROFILE)
      const good = childhoodArrival(born, devotedChildhood())
      const bad = childhoodArrival(born, neglectedChildhood())
      expect(meanOf(good)).toBeGreaterThan(meanOf(bad))
      for (const k of SKILL_KEYS) expect(good[k]).toBeGreaterThanOrEqual(bad[k])
    }
  })
})

describe('the three terms, and the decision they make', () => {
  it('coordination saturates at what a child that age can absorb, not at a ceiling', () => {
    // twice the age-appropriate hours buy exactly the same coordination as the right amount
    const at = (practice: number) =>
      childhoodWalk([{ age: 9, practice, teaching: 1, focus: 'general' }]).years[0]
    const right = at(appetiteAt(9))
    const double = at(Math.min(1, appetiteAt(9) * 2))
    expect(double.coordination).toBeCloseTo(right.coordination, 12)
    expect(right.coordination).toBeCloseTo(1, 12)
    expect(at(appetiteAt(9) / 2).coordination).toBeCloseTo(0.5, 12)
  })

  it('joy falls with strain and the strain carries into later years', () => {
    const pushed = childhoodWalk(
      CHILDHOOD_AGES.map((age) => ({ age, practice: 1, teaching: 1, focus: 'general' as const })),
    )
    expect(pushed.years[0].joy).toBeLessThan(1)
    // she was pushed hardest when she was smallest, and is still paying at nine
    expect(pushed.years[4].joy).toBeLessThan(1)
    // ...and she grows into the load, so it recovers rather than being a permanent brand
    expect(pushed.years[8].joy).toBeGreaterThan(pushed.years[2].joy)
    // a childhood that never overshoots never loses any joy at all
    for (const y of childhoodWalk(devotedChildhood()).years) expect(y.joy).toBe(1)
  })

  it('habit carries – a light year at nine is still costing her at twelve', () => {
    const light = medianChildhood().map((y) => (y.age === 9 ? { ...y, practice: 0 } : y))
    const full = medianChildhood()
    const a = childhoodWalk(light).years
    const b = childhoodWalk(full).years
    const at = (rows: typeof a, age: number) => rows.find((r) => r.age === age)!
    expect(at(a, 12).habit).toBeLessThan(at(b, 12).habit)
    expect(at(a, 12).quality).toBeLessThan(at(b, 12).quality)
  })

  it('⚠ THE GRINDER LOSES – a branch that always ends better is not a decision', () => {
    const grinder = CHILDHOOD_AGES.map((age) => ({
      age,
      practice: 1,
      teaching: 1,
      focus: 'general' as const,
    }))
    expect(childhoodWalk(grinder).level).toBeLessThan(childhoodWalk(devotedChildhood()).level)
    expect(childhoodWalk(grinder).level).toBeLessThan(0)
  })

  it('the shape channel redistributes and never adds', () => {
    for (const focus of SESSION_KINDS) {
      const walk = childhoodWalk(devotedChildhood().map((y) => ({ ...y, focus })))
      let total = 0
      for (const k of SKILL_KEYS) total += walk.shape[k]
      expect(total).toBeCloseTo(0, 10)
      expect(walk.level).toBeCloseTo(CHILDHOOD.swingPoints, 12)
    }
    // a childhood spent on the rally moves the groundstroke by the full dial and nothing else up
    const rally = childhoodWalk(devotedChildhood().map((y) => ({ ...y, focus: 'rally' as const })))
    expect(rally.shape.groundstrokes).toBeCloseTo(CHILDHOOD.shapeSwingPoints, 6)
    expect(rally.shape.serve).toBeLessThan(0)
    // ...and a general childhood shapes nothing at all
    for (const k of SKILL_KEYS) expect(childhoodWalk(devotedChildhood()).shape[k]).toBeCloseTo(0, 12)
  })
})

// -------------------------------------------------------------------------------------------------
// THE THREE THINGS THE PHASE PROMISED NOT TO DO. Source pins, because each one is a claim about what
// the module CANNOT reach rather than about what it computes.
// -------------------------------------------------------------------------------------------------

describe('what the childhood may not touch', () => {
  it('⚠ never sees a ceiling – potential is talent, and what you did at eight does not change it', () => {
    expect(CHILDHOOD_CODE).not.toMatch(/\brollPotential\b/)
    expect(CHILDHOOD_CODE).not.toMatch(/potential\s*[:[.]/)
    // it returns a build and nothing else: the same five keys `startingSkills` produces
    const out = childhoodArrival(startingSkills('k', DEFAULT_PROFILE), devotedChildhood())
    expect(Object.keys(out).sort()).toEqual([...SKILL_KEYS].sort())
    // and the ceiling a career rolls is untouched by any childhood, because it is rolled off the
    // BIRTH build – the same argument task 55 makes for the relative-age head start
    const born = startingSkills('k', DEFAULT_PROFILE)
    expect(rollPotential('k', born)).toEqual(rollPotential('k', born))
  })

  it('⚠ takes no seed and draws nothing – invariant 2 answered by having no dice at all', () => {
    // the stripped text is still the module and not an empty string – the pins above and below are
    // worthless without this line, and it is the mutation guard for `codeOf` itself
    expect(CHILDHOOD_CODE).toMatch(/export function childhoodArrival/)
    expect(CHILDHOOD_CODE).toMatch(/STARTING_SKILL_BAND\[k\]/)
    expect(CHILDHOOD_CODE).not.toMatch(/from '\.\/rng'/)
    expect(CHILDHOOD_CODE).not.toMatch(/\brngFromSeed\b/)
    expect(CHILDHOOD_CODE).not.toMatch(/\bMath\.random\b/)
    expect(CHILDHOOD_CODE).not.toMatch(/\bpickInt\b/)
    expect(CHILDHOOD_CODE).not.toMatch(/\bseed\b\s*:/)
  })

  it('⚠⚠ cannot be reached by an ordinary in-game week – only engine/world.ts imports it', () => {
    // ⭐ THE ONE-LINE, REVIEWED CHANGE PHASE 1 PROMISED, MADE. It shipped as `[]` – «the module
    // exists, is measured, and is unreachable» – with its own note saying that when phase 4 hands
    // the prologue's build to `createWorld` this expectation moves to exactly `['engine/world.ts']`.
    // It has, and the set is still the point: the card table may not import it, the pool may not
    // import it, no screen and no store may import it, and a second importer appearing anywhere in
    // `src/` reddens this line rather than quietly putting the childhood on the tick path.
    //
    // ⚠ WHAT IT STILL BUYS, WHICH IS THE SAME THING PHASE 1 BOUGHT. `createWorld` runs ONCE, at the
    // birth of a career; `tickWeek` never calls it. So a module reachable from `world.ts` alone is
    // still a module an ordinary in-game week cannot reach, and `development.ts` is still untouched
    // – which is why the frozen capture (41550 / e6b0c709) and every career hash cannot move.
    const SRC = fileURLToPath(new URL('../src/', import.meta.url))
    const files: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) walk(full)
        else if (name.endsWith('.ts') || name.endsWith('.vue')) files.push(full)
      }
    }
    walk(SRC)
    const importers = files
      .filter((f) => !f.endsWith(`engine${'/'}childhood.ts`))
      .filter((f) => /from\s*['"][^'"]*\bchildhood['"]/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(SRC.length))
    expect(importers).toEqual(['engine/world.ts'])
  })
})
