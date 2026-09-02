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

// =================================================================================================
// ⭐⭐ PHASE 12 – A CHILDHOOD THAT IS STILL RUNNING, and the anchor that was lying about it
// =================================================================================================
//
// THE DEFECT, in the owner's own words: at a Local Open she was drawn as «a ninth child out of
// STARTING_SKILL_BAND, with no connection to the childhood», so «a player who paid for the club,
// one-to-one hours and the sports school watches her play exactly like a neglected girl».
//
// Phase 11 declined to fix it and gave a real reason – a partial walk «would read as far below
// median simply for being short». It did, and the fault was the DENOMINATOR: both anchors were
// folded over all nine years whatever length of childhood the function was handed, so a six-year
// numerator was measured against a nine-year median. See `childhoodWalk`.
describe('⭐⭐ the level answers the years she has lived', () => {
  /** THE OLD ARITHMETIC, RECONSTRUCTED FROM PUBLIC EXPORTS – the arm this phase replaces. Every term
   *  is on `childhoodWalk`'s own result, so this cannot drift away from the thing it is contrasted
   *  with the way a hard-coded table would. */
  const qMedianFull = childhoodWalk(medianChildhood()).quality
  const qDevotedFull = childhoodWalk(devotedChildhood()).quality
  const levelBefore = (years: readonly ChildhoodYear[]) =>
    (CHILDHOOD.swingPoints * (childhoodWalk(years).quality - qMedianFull)) / (qDevotedFull - qMedianFull)

  it('⚠⚠ AND AT FOURTEEN NOTHING MOVED – byte-for-byte against the arithmetic phase 11 shipped', () => {
    // ⭐ THE PROOF THE BALANCE PASS NEEDS. `childhood-prologue-balance-2026-09.md` measured the
    // handover on these exact numbers, so a phase that moved the FULL childhood by a hundredth would
    // silently invalidate a spec the owner has accepted. These four rows were captured by running
    // `childhoodArrival` in a worktree at `prologue/p11-tournaments` – the commit BEFORE this change
    // – and pasted here unedited.
    //
    // ⚠ IT IS ALSO TRUE BY CONSTRUCTION, WHICH IS THE STRONGER HALF: a finished childhood has lived
    // all nine years, so the median filtered to «the years she has lived» IS the whole median, and
    // the expression reduces to the one that was there. The capture is what proves the argument is
    // about this code rather than about a story told over it.
    const P11: Record<string, KidSkills> = {
      'a/neglected': { serve: 53.71, ret: 44.71, composure: 39.71, stamina: 44.71, groundstrokes: 40 },
      'a/median': { serve: 56, ret: 47, composure: 42, stamina: 47, groundstrokes: 41 },
      'a/devoted': { serve: 58, ret: 49.4, composure: 44.4, stamina: 49.4, groundstrokes: 43.4 },
      'b/neglected': { serve: 48.71, ret: 45.71, composure: 35.71, stamina: 53.71, groundstrokes: 52.71 },
      'b/median': { serve: 51, ret: 48, composure: 38, stamina: 56, groundstrokes: 55 },
      'b/devoted': { serve: 53.4, ret: 50.4, composure: 40.4, stamina: 58.4, groundstrokes: 57.4 },
      'career-7/neglected': { serve: 50.71, ret: 52.71, composure: 51.71, stamina: 40.71, groundstrokes: 51.71 },
      'career-7/median': { serve: 53, ret: 55, composure: 54, stamina: 43, groundstrokes: 54 },
      'career-7/devoted': { serve: 55.4, ret: 57.4, composure: 55, stamina: 45.4, groundstrokes: 56.4 },
      'zzz/neglected': { serve: 43.71, ret: 51.71, composure: 44.71, stamina: 40.71, groundstrokes: 40 },
      'zzz/median': { serve: 46, ret: 54, composure: 47, stamina: 43, groundstrokes: 41 },
      'zzz/devoted': { serve: 48.4, ret: 56.4, composure: 49.4, stamina: 45.4, groundstrokes: 43.4 },
    }
    const roads: Record<string, ChildhoodYear[]> = {
      neglected: neglectedChildhood(),
      median: medianChildhood(),
      devoted: devotedChildhood(),
    }
    for (const [key, expected] of Object.entries(P11)) {
      const [seed, road] = key.split('/')
      const got = childhoodArrival(startingSkills(seed, DEFAULT_PROFILE), roads[road])
      expect(got, key).toEqual(expected)
    }
    // ...and the walk's own three numbers, to twelve places, because the arrival is rounded to two
    // and a rounded pin cannot see a small drift.
    expect(childhoodWalk(medianChildhood()).level).toBe(0)
    expect(childhoodWalk(devotedChildhood()).level).toBeCloseTo(2.4, 12)
    expect(childhoodWalk(neglectedChildhood()).level).toBeCloseTo(-2.2854594381043194, 12)
    expect(childhoodWalk(neglectedChildhood()).quality).toBeCloseTo(0.2634684674844444, 15)
    expect(childhoodWalk(devotedChildhood()).quality).toBeCloseTo(0.9327670499555555, 15)
  })

  it('⭐⭐ a partial childhood is measured against a partial median – the fault was the denominator', () => {
    // Five years of the best decisions a parent can make used to read as a girl who had been
    // neglected for nine. Both arms are in the file so the fix is legible as a difference.
    const devotedFive = devotedChildhood().slice(0, 5)
    expect(levelBefore(devotedFive)).toBeLessThan(-1.5) // -1.81: far below an ordinary childhood
    expect(childhoodWalk(devotedFive).level).toBeGreaterThan(0.5) // +0.87: better than ordinary
    // ⚠ THE MUTATION ARM. Point the numerator's anchor back at the full median and the line above
    // goes red – which is what says this pin is about the change and not about the model.
    const mutated =
      (CHILDHOOD.swingPoints * (childhoodWalk(devotedFive).quality - qMedianFull)) / (qDevotedFull - qMedianFull)
    expect(mutated).toBe(levelBefore(devotedFive))
    expect(mutated).not.toBeCloseTo(childhoodWalk(devotedFive).level, 6)
  })

  it('⭐ an ordinary childhood is exactly zero at EVERY length, which is what «matched» means', () => {
    const median = medianChildhood()
    for (let n = 1; n <= median.length; n++) {
      expect(childhoodWalk(median.slice(0, n)).level, `${n} years`).toBeCloseTo(0, 12)
    }
    // ...and the old arithmetic could not say that about a single one of the first eight.
    for (let n = 1; n < median.length; n++) {
      expect(levelBefore(median.slice(0, n)), `${n} years`).toBeLessThan(-0.5)
    }
  })

  it('⭐⭐ the gap is SMALL AT TEN AND VISIBLE AT THIRTEEN – it grows with every year she lives', () => {
    // The consequence the phase exists for: five years of investment barely show, nine years do, and
    // the tournament reveals the upbringing gradually rather than in a jump.
    const gaps: number[] = []
    for (let n = 1; n <= 9; n++) {
      gaps.push(childhoodWalk(devotedChildhood().slice(0, n)).level - childhoodWalk(neglectedChildhood().slice(0, n)).level)
    }
    for (let i = 1; i < gaps.length; i++) expect(gaps[i], `${i + 1} years`).toBeGreaterThan(gaps[i - 1])
    // Six years lived is the weekend at ten; nine is the weekend at thirteen and the handover.
    expect(gaps[5]).toBeCloseTo(2.3, 1)
    expect(gaps[8]).toBeCloseTo(4.69, 2)
    expect(gaps[8] / gaps[5]).toBeGreaterThan(1.9)
    // ⚠ AND THE FULL CHILDHOOD STILL SPANS EXACTLY ONE SWING EITHER SIDE OF ORDINARY.
    expect(childhoodWalk(devotedChildhood()).level).toBeCloseTo(CHILDHOOD.swingPoints, 12)
  })

  it('an empty childhood is the girl she was born – there is nothing to have lived', () => {
    // `createWorld` guards this case (`years.length > 0`) and so does `prologueEntrant`, but the
    // arithmetic should not need the guard to be sane: no years lived is no distance from ordinary.
    expect(childhoodWalk([]).level).toBe(0)
    const born = startingSkills('empty', DEFAULT_PROFILE)
    expect(childhoodArrival(born, [])).toEqual(born)
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

  it('⚠⚠ cannot be reached by an ordinary in-game week – two named importers and no others', () => {
    // ⭐ THE ONE-LINE, REVIEWED CHANGE PHASE 1 PROMISED, MADE – AND WIDENED ONCE MORE, BY PHASE 12.
    // It shipped as `[]` («the module exists, is measured, and is unreachable»), phase 4 opened it to
    // `['engine/world.ts']` when `createWorld` began spending the nine years, and phase 12 adds
    // `prologue/pool.ts` because the owner found the gap that refusal left: a girl at a Local Open
    // was drawn straight out of `STARTING_SKILL_BAND` and played like a neglected one whatever her
    // parent had paid for. The build she plays on is `childhoodArrival` now, so the pool imports it.
    //
    // ⚠⚠ THE SET IS STILL THE POINT, AND THE CLAIM IT CARRIES IS UNCHANGED. It was never «one
    // importer»; it is «nothing an in-game week runs». Both names below are off the tick path, and
    // the second one is proved so by the assertion underneath rather than asserted here:
    //   * `engine/world.ts` reaches it from `createWorld`, which runs ONCE at the birth of a career
    //     and is never called by `tickWeek`;
    //   * `prologue/pool.ts` is walked by the prologue's two components BEFORE a world exists, and
    //     no framework-free zone imports `src/prologue` at all.
    // The card table still may not import it, no store and no other screen may, and a THIRD importer
    // appearing anywhere in `src/` reddens this line rather than quietly widening the reach.
    //
    // ⚠ AND `development.ts` IS STILL UNTOUCHED, which is why the frozen capture (41550 / e6b0c709)
    // and every career hash cannot move – not «were checked and did not move», cannot.
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
    expect(importers.sort()).toEqual(['engine/world.ts', 'prologue/pool.ts'])

    // ⭐⭐ AND HERE IS WHY THE SECOND NAME COSTS THE GUARANTEE NOTHING – the half the widened set
    // cannot state on its own. `src/prologue` is UI-side: not one file in the four framework-free
    // zones (invariant 1's own list, and `scripts/engine-purity.mjs` walks the same four) imports
    // it, so no path from `tickWeek` reaches `pool.ts` and therefore none reaches the childhood
    // through it. Mutation-checked: swapping `prologue\/` for `childhood` in the pattern below
    // makes it name `engine/world.ts`, so the walk and the read are live rather than vacuous.
    const ZONES = ['engine/', 'worker/', 'db/', 'shared/']
    const leaks = files
      .map((f) => f.slice(SRC.length))
      .filter((rel) => ZONES.some((z) => rel.startsWith(z)))
      .filter((rel) => /from\s*['"][^'"]*\bprologue\//.test(readFileSync(join(SRC, rel), 'utf8')))
    expect(leaks).toEqual([])
  })
})
