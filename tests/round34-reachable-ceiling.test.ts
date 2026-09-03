// =================================================================================================
// ⭐⭐ ROUND 34 BUNDLE H – THE CEILING READ IS A FRACTION OF WHAT IS REACHABLE, NOT OF THE ASYMPTOTE
// =================================================================================================
//
// The owner, 02.09, asked for it in one line: «да, перенормируй показ сразу».
//
// ⚠⚠ WHAT WAS WRONG WAS THE SCALE, NOT THE EDGES. Round 34 #2b made the read measure true
// realisation – `(skills - born) / (potential - born)` – and the owner approved band edges of 0.40 /
// 0.75 / 0.90 on it. But `potential` is an ASYMPTOTE: `growWeek` gains `rate * headroom * luck`, a
// share of what is LEFT, so the distance to the ceiling shrinks geometrically and never closes, and
// `ageFactor` returns 0 from `declineStart`, so whatever is unfilled at that age is unfilled for
// ever. Bundle A walked real careers and measured the consequence – budget / middle / high rungs peak
// at 0.855 / 0.879 / 0.895 raw and NONE of them ever reached the approved 0.90, so «At her ceiling»
// was elite-only and a parent whose girl had stopped growing was never told to stop paying.
//
// ⭐ SO THE EDGES ARE UNTOUCHED AND THE DENOMINATOR MOVED. `realisedShare` divides by
// `room * reachableHeadroomShare()`, and 0.40 / 0.75 / 0.90 now mean what the owner was told they
// meant. Measured on the shipped curve: the curve alone reaches 0.8668 of her headroom, an elite
// well-matched coach 0.9124, a self-coached badly-matched career 0.7885. The CURVE-ONLY arm is the
// normaliser – see `reachableHeadroomShare`'s note for why the coach may not be in a scale that is
// supposed to be about her.
//
// ⚠⚠ THE SECOND TEST BELOW IS THE ONE THAT MATTERS MOST. A future wave is already approved to raise
// `plateauRate` and push `declineStart` later; a hardcoded 0.867 would survive it in silence. That
// test moves the curve in a fixture and fails if the normaliser stands still.
import { describe, it, expect } from 'vitest'
import { coachRoomBandOf, coachRoomBandLabel, coachRoomNote } from '../src/engine/world/coachMarket'
import { reachableHeadroomShare, SKILL_KEYS } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { createWorld, startingSkills, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'

/** A career whose RAW share – `(skills - born) / (potential - born)`, the quantity before bundle H
 *  normalised it – is exactly `raw`. Built off her real birth build, because that is the one thing
 *  about her nothing may re-roll, with 20 points of headroom per attribute. ⚠ Not a flat ceiling:
 *  `STARTING_SKILL_BAND.stamina` reaches 60, and a girl born at her ceiling divides by zero. */
function careerAtRaw(seed: string, raw: number) {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const born = startingSkills(world.seed, world.profile)
  for (const k of SKILL_KEYS) {
    world.potential[k] = born[k] + 20
    world.skills[k] = born[k] + 20 * raw
  }
  return world
}

/** ...and the same career addressed by the share the PLAYER is shown, which is the raw one over the
 *  reachable maximum. Derived rather than written down, so this helper follows the curve too. */
function careerAtShown(seed: string, shown: number) {
  return careerAtRaw(seed, shown * reachableHeadroomShare())
}

describe('bundle H: the normaliser is derived from the age curve', () => {
  it('⭐ the shipped curve reaches 0.8668 of her headroom, and that is where the number comes from', () => {
    // ⚠ THIS IS A MEASUREMENT, AND A WAVE THAT MOVES THE CURVE IS SUPPOSED TO REDDEN IT. The value
    // is not an input anywhere – nothing reads a literal – but it IS the fact the whole bundle rests
    // on, so it is pinned here rather than left to be rediscovered. If the approved plateauRate /
    // declineStart wave lands, this number moves, and the right response is to re-measure it (the
    // tool prints it: `npx vite-node tools/r34-reachable-ceiling.ts --skip-walk`), not to widen the
    // tolerance.
    const reachable = reachableHeadroomShare()
    expect(reachable).toBeCloseTo(0.8668, 4)

    // ...and it is genuinely short of the ceiling, which is the defect in one line: 13% of every
    // girl's headroom is arithmetically unreachable, so the old scale's top did not exist.
    expect(reachable, 'the ceiling is an asymptote, not a destination').toBeLessThan(1)
    // It is also above every band edge, which is why the raw read could never enter the top band:
    // 0.90 of the OLD scale was above what the curve itself delivers.
    expect(reachable).toBeGreaterThan(0.75)
  })

  it('⚠⚠ IT MOVES WITH THE CURVE – the test that fails if the normaliser is ever hardcoded', () => {
    // The owner has approved a FUTURE wave that raises `plateauRate` and pushes `declineStart` later.
    // A literal in `reachableHeadroomShare` would survive that wave silently and start understating
    // every career the day it landed. So: move the curve, and the number must move.
    //
    // ⚠ IT ALSO GUARDS THE MEMO, which is the subtler half. `reachableHeadroomShare` caches its walk
    // – ~830 iterations is not free at snapshot time – and a cache keyed on "have I run yet" instead
    // of on the curve's own values would be a hardcode wearing a lazy initialiser and would pass
    // every OTHER test in this file. The restore arm at the end is what catches that.
    // ⚠ `ECONOMY` IS DECLARED `as const`, so its numbers are readonly to the type system and
    // perfectly writeable at runtime. A fixture that has to move the shipped curve and put it back
    // is the one legitimate reason to look past that, and the cast is kept as narrow as the job:
    // three fields, restored in a `finally`, with the last assertion in this test being that the
    // shipped value came back. Nothing in `src/` writes here – this is the only writer in the repo.
    const curve = ECONOMY.development.ageCurve as {
      peakRate: number
      plateauRate: number
      declineStart: number
    }
    const shipped = reachableHeadroomShare()
    const restore = {
      plateauRate: curve.plateauRate,
      declineStart: curve.declineStart,
      peakRate: curve.peakRate,
    }
    try {
      // A faster plateau fills more of the headroom before the gain term shuts off.
      curve.plateauRate = restore.plateauRate * 2
      const faster = reachableHeadroomShare()
      expect(faster, 'doubling plateauRate must raise what is reachable').toBeGreaterThan(shipped)

      // A later decline gives her more weeks of it.
      Object.assign(curve, restore)
      curve.declineStart = restore.declineStart + 3
      const longer = reachableHeadroomShare()
      expect(longer, 'a later declineStart must raise what is reachable').toBeGreaterThan(shipped)

      // ...and both directions, so a function that merely rises with any edit is caught too.
      Object.assign(curve, restore)
      curve.declineStart = restore.declineStart - 3
      expect(
        reachableHeadroomShare(),
        'an earlier declineStart must LOWER what is reachable',
      ).toBeLessThan(shipped)

      Object.assign(curve, restore)
      curve.peakRate = restore.peakRate * 1.3
      expect(reachableHeadroomShare(), 'a steeper peakRate must raise it').toBeGreaterThan(shipped)
    } finally {
      Object.assign(curve, restore)
    }
    // ⚠ AND IT COMES BACK. A memo that froze the first answer would fail here, having passed every
    // arm above by never having been asked a second question about the same curve.
    expect(reachableHeadroomShare(), 'the walk is re-derived, not frozen').toBe(shipped)
  })

  it('the per-route curves reach different amounts, so the walk really reads its argument', () => {
    // Round 31 #10 gave the two routes different pairs. The direct route peaks earlier and declines
    // earlier, so less of her headroom is reachable on it – a fact about the CURVE, and the cleanest
    // proof that the loop is reading `bounds` rather than a constant. ⚠ The shipped default is what
    // the read normalises by; these are measured here, not used.
    const direct = reachableHeadroomShare(ECONOMY.development.ageRoutes.direct)
    const college = reachableHeadroomShare(ECONOMY.development.ageRoutes.college)
    expect(direct).toBeLessThan(college)
    expect(college).toBeCloseTo(reachableHeadroomShare(), 6) // college IS the shipped pair
  })
})

describe('bundle H: the approved edges now mean what they say', () => {
  it('⭐ a career at its birth build still reads «Huge potential», however well she was born', () => {
    // The claim bundle A shipped, re-asserted against the new denominator: normalising divides, and
    // dividing zero by anything is still zero. This is the sentence the owner met at fourteen.
    for (const seed of ['r34h-born-a', 'r34h-born-b', 'r34h-born-c']) {
      const untrained = careerAtRaw(seed, 0)
      expect(coachRoomBandOf(untrained), seed).toBe(0)
      expect(coachRoomNote(untrained), seed).toMatch(/^Huge potential/)
    }
  })

  it('⭐⭐ a career that took everything the curve offers reads the TOP band – the item itself', () => {
    // Before bundle H this was the defect in one assertion: a career that had realised the ENTIRE
    // reachable maximum read 0.867 and was told «Close to her ceiling», because the remaining 13.3%
    // was arithmetically unavailable to her. Now it reads the top of the scale.
    const finished = careerAtRaw('r34h-finished', reachableHeadroomShare())
    expect(coachRoomBandOf(finished)).toBe(3)
    expect(coachRoomNote(finished)).toMatch(/^At her ceiling/)

    // ...and the raw share it was built at is BELOW the approved top edge, which is what makes the
    // line above a statement about the normalisation and not about the construction.
    expect(reachableHeadroomShare()).toBeLessThan(0.9)
  })

  it('the three edges land at the derived raw shares, checked from both sides', () => {
    // ⚠ THE EDGES ARE THE OWNER'S AND DID NOT MOVE (0.40 / 0.75 / 0.90, approved 02.09). What moved
    // is where they fall in RAW terms: an edge `e` now fires at `e * reachable` of her headroom. Both
    // sides of each, so an arm displaced by a hundredth reddens – and every number here is derived,
    // so the approved curve wave moves the test with the code instead of breaking it.
    const r = reachableHeadroomShare()
    for (const [edge, below, above] of [
      [0.4, 0, 1],
      [0.75, 1, 2],
      [0.9, 2, 3],
    ] as const) {
      expect(coachRoomBandOf(careerAtRaw(`r34h-edge-${edge}-lo`, (edge - 0.005) * r)), `below ${edge}`).toBe(below)
      expect(coachRoomBandOf(careerAtRaw(`r34h-edge-${edge}-hi`, (edge + 0.005) * r)), `above ${edge}`).toBe(above)
    }
  })

  it('the read is monotone in headroom and cannot flicker, swept densely', () => {
    // A band that stepped back and forth across a threshold would put two different sentences on
    // alternate Tuesdays with nothing having happened. Swept on the SHOWN share, one point per half
    // percent, so a swapped arm inside a band is caught and not only at the four edges.
    let last = 0
    const entered: number[] = [0]
    for (let shown = 0; shown <= 1.0001; shown += 0.005) {
      const band = coachRoomBandOf(careerAtShown('r34h-sweep', Math.min(shown, 1)))!
      expect(band, `shown ${shown.toFixed(3)} went backwards`).toBeGreaterThanOrEqual(last)
      if (band !== last) entered.push(band)
      last = band
    }
    expect(entered, 'four bands, each entered once, in order').toEqual([0, 1, 2, 3])
    // ...and the top of the scale is genuinely reachable by construction: a career that realises
    // everything the curve offers is at 1.0 shown, not at 0.867.
    expect(coachRoomBandOf(careerAtShown('r34h-sweep-top', 1))).toBe(3)
  })

  it('⚠ and the FOUR LABELS ARE UNTOUCHED – invariant 4, which this task did not ask to break', () => {
    // «запрети на уровне документации и спек агентам самовольно изменять вординг» (owner, 30.08).
    // This task asked for a DENOMINATOR. The words are his, and a rename would pass every other test
    // in this file – which is exactly why this one is here, byte for byte.
    expect([0, 1, 2, 3].map(coachRoomBandLabel)).toEqual([
      'Huge potential',
      'Still room to grow',
      'Close to her ceiling',
      'At her ceiling',
    ])
    // ...and still no digit in any of them: the fog-of-war ruling is older than this round, and a
    // normaliser is exactly the kind of change that would tempt somebody to print a percentage.
    for (const label of [0, 1, 2, 3].map(coachRoomBandLabel)) expect(label).not.toMatch(/\d/)
    for (const shown of [0, 0.3, 0.6, 0.8, 0.95, 1]) {
      expect(coachRoomNote(careerAtShown('r34h-digits', shown))).not.toMatch(/\d/)
    }
  })
})

describe('bundle H: every rung reaches «At her ceiling» at its own peak', () => {
  // ⚠⚠ THIS IS THE FUNCTION THAT WAS LOST AND IS NOW BACK, and it is why the bundle exists. The
  // fourth band carries ADVICE, not only a verdict: «no coach can add much more now, whatever the
  // price». Under the raw denominator a budget, middle or high career peaked at 0.855 / 0.879 / 0.895
  // and never heard it, so a parent whose girl had genuinely stopped growing was never told to stop
  // paying for a coach who could no longer buy anything.
  //
  // ⚠ WALKED THROUGH THE REAL ENGINE, because an index-level check passes happily on copy no career
  // can reach – the round-23 lesson about dead strings, asked at the other end of the ladder. One
  // career per rung here to keep the unit suite honest about its runtime; the eight-seed version is
  // `npx vite-node tools/r34-reachable-ceiling.ts`, and its numbers are in the ledger.
  const RUNGS: CoachTier[] = ['budget', 'middle', 'high', 'elite']
  for (const tier of RUNGS) {
    it(`⭐ the ${tier} rung gets there`, () => {
      const world = createWorld(`r34h-walk-${tier}`, { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      let last = coachRoomBandOf(world)!
      const seen: number[] = [last]
      for (let w = 0; w < 780; w++) {
        // 15 seasons, 14 -> 29: the whole growth arc and none of the decline past it.
        tickWeek(world, rng)
        const band = coachRoomBandOf(world)!
        // The no-flicker claim, on a REAL career rather than on a swept number.
        expect(band, `week ${world.week} went backwards, ${last} -> ${band}`).toBeGreaterThanOrEqual(last)
        if (band !== last) seen.push(band)
        last = band
      }
      expect(seen, `${tier}: every band, in order, none skipped and none repeated`).toEqual([0, 1, 2, 3])
    })
  }
})
