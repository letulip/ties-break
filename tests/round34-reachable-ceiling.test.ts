// =================================================================================================
// ⭐⭐ ROUND 34 BUNDLE I – THE YARDSTICK IS THE BEST COACHING AVAILABLE, NOT NO COACHING AT ALL
// =================================================================================================
//
// The owner, 02.09, asked for the re-normalisation in one line: «да, перенормируй показ сразу».
// Bundle H did it against the wrong maximum; this file is bundle H's file, re-aimed.
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
// ⚠⚠⚠ AND BUNDLE H THEN DIVIDED BY THE BARE CURVE, WHICH IS THE DEFECT THIS FILE NOW GUARDS. H's
// normaliser walked `ageFactor` ALONE – the growth of a girl with NO COACH AT ALL and no matches
// (0.8668). A girl WITH a coach grows faster than that, so she EXCEEDS the denominator and runs into
// the `Math.min(1, …)` clamp in `realisedShare`. Measured under H, shown share by age:
//
//     age    self/off   middle   elite/great
//      18      75.9%     90.2%      93.9%
//      20      84.6%     97.6%     100.8%
//      22      89.3%    101.4%     104.2%
//      28      95.3%    105.7%     107.9%
//
// A middle-coached career read «At her ceiling» from about NINETEEN and for the rest of her life,
// while an elite coach demonstrably still added to her. That is the owner's own complaint («звучит
// как приговор») moved from fourteen to nineteen, and the fourth band's note – «no coach can add
// much more now, whatever the price» – was simply FALSE where it was being shown.
//
// ⭐ SO THE EDGES ARE STILL UNTOUCHED AND THE DENOMINATOR MOVED AGAIN. `realisedShare` divides by
// `room * reachableHeadroomShare()`, and that walk now runs at the BEST COACHING AVAILABLE –
// `coachFactor('elite','great')` with the match bonus at its cap, 0.9766 of her headroom on the
// shipped curve and ladder. The band's job is to answer «is there still room worth BUYING», so the
// yardstick has to be what the best available coaching could reach. ⚠ H rejected this for putting
// «the parent's chequebook inside his daughter's ceiling»; reconsidered, and it does not, because
// the denominator is ONE CONSTANT for every career – two identical girls read identically, and what
// differs is the numerator, which is how much she actually gained.
//
// ⚠⚠ THE SECOND TEST BELOW IS THE ONE THAT MATTERS MOST. A future wave is already approved to move
// `plateauStart` 23 -> 28 and `declineStart` 29 -> 33; a hardcoded 0.9766 would survive it in
// silence. That test moves the curve AND the coach ladder AND the match bonus in a fixture and fails
// if the normaliser stands still – all three, because since bundle I all three are inputs.
import { describe, it, expect, beforeAll } from 'vitest'
import { coachRoomBandOf, coachRoomBandLabel, coachRoomNote } from '../src/engine/world/coachMarket'
import { reachableHeadroomShare, SKILL_KEYS } from '../src/engine/development'
import { coachFactor } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { createWorld, startingSkills, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier } from '../src/shared/protocol'
import { WEEKS_IN_SEASON } from '../src/shared/dates'

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

describe('bundle I: the normaliser is derived from the age curve AND the coach ladder', () => {
  it('⭐ the shipped curve and ladder reach 0.9766 of her headroom, and that is the number', () => {
    // ⚠ THIS IS A MEASUREMENT, AND A WAVE THAT MOVES ITS INPUTS IS SUPPOSED TO REDDEN IT. The value
    // is not an input anywhere – nothing reads a literal – but it IS the fact the whole bundle rests
    // on, so it is pinned here rather than left to be rediscovered. If the approved plateauStart /
    // declineStart wave lands, or the coach ladder is retuned, this number moves, and the right
    // response is to re-measure it (the tool prints it: `npx vite-node
    // tools/r34-reachable-ceiling.ts --skip-walk`), not to widen the tolerance.
    // ⚠ RE-AIMED FROM BUNDLE H, WHICH PINNED 0.8668 HERE – the bare-curve walk. Same assertion, same
    // job; what moved is the multiplier the walk runs at. See this file's header for why.
    const reachable = reachableHeadroomShare()
    expect(reachable).toBeCloseTo(0.9766, 4)

    // ...and it is STILL genuinely short of the ceiling, which is the round-34 #2b defect in one
    // line: even taking the best coaching money can buy, every week of her life, ~2.3% of her
    // headroom is arithmetically unreachable and `potential` remains an asymptote.
    expect(reachable, 'the ceiling is an asymptote, not a destination').toBeLessThan(1)

    // ⭐⭐ AND IT IS ABOVE THE TOP EDGE, WHICH IS THE PROPERTY BUNDLE I EXISTS TO CREATE. The band
    // edges are read on `raw / reachable`, so a career can only enter «At her ceiling» by realising
    // more than `0.90 * reachable` of her headroom. With the denominator at the best-coached maximum
    // that target sits ABOVE what the bare curve alone delivers – so a girl nobody ever coached
    // cannot reach the top band, which is the correct advice: a coach would still buy her something.
    expect(reachable, 'the top edge must sit inside the scale').toBeGreaterThan(0.9)
  })

  it('⭐⭐ the walk runs at the BEST COACHING AVAILABLE, not at the bare curve – bundle I itself', () => {
    // ⚠ THE ARM THAT CATCHES A REVERT TO BUNDLE H. Re-derived here from the same shipped knobs the
    // engine reads, never quoted: if somebody puts `ageFactor` alone back in the walk, the shipped
    // normaliser drops onto the bare-curve number below and both assertions fail.
    const bare = 0.8668 // what bundle H divided by, measured – see the header table for what it cost
    const reachable = reachableHeadroomShare()
    expect(reachable, 'the denominator is NOT the no-coach curve').toBeGreaterThan(bare + 0.05)

    // And the multiplier is the one the ledger names, so a reader can check the arithmetic: the
    // dearest rung teaching the game she actually plays, and the match bonus at its cap.
    const best =
      coachFactor('elite', 'great') *
      (1 + ECONOMY.development.matchBonusCap * ECONOMY.development.matchBonus)
    expect(best).toBeCloseTo(1.8596, 4)

    // ⚠⚠ AND THE CONSEQUENCE THAT IS THE WHOLE POINT: a career that took everything the BARE CURVE
    // offers – i.e. a girl who was never coached and never played – reads «Close to her ceiling» and
    // NOT «At her ceiling». Under bundle H that same career read the top band and was told no coach
    // could add anything, which was false. This is the defect, as one assertion.
    const uncoachedMaximum = careerAtRaw('r34i-bare-curve', bare)
    expect(coachRoomBandOf(uncoachedMaximum), 'the bare curve is not the top of the scale').toBe(2)
    expect(coachRoomNote(uncoachedMaximum)).toMatch(/^Close to her ceiling/)
  })

  it('⚠⚠ IT MOVES WITH ALL THREE INPUTS – the test that fails if the normaliser is hardcoded', () => {
    // The owner has approved a FUTURE wave that moves `plateauStart` 23 -> 28 and `declineStart`
    // 29 -> 33. A literal in `reachableHeadroomShare` would survive that wave silently and start
    // understating every career the day it landed. So: move the inputs, and the number must move.
    //
    // ⚠⚠ AND SINCE BUNDLE I THERE ARE THREE KINDS OF INPUT, NOT ONE. The walk runs at
    // `ageFactor(age) * coachFactor('elite','great') * (1 + matchBonusCap * matchBonus)`, so a
    // sensitivity test that only moved the CURVE would now be testing half the function and would
    // stay green while a coach retune rotted the read. The ladder and match arms below are bundle I's
    // addition; the curve arms are bundle H's, unchanged.
    //
    // ⚠ IT ALSO GUARDS THE MEMO, which is the subtler half. `reachableHeadroomShare` caches its walk
    // – ~830 iterations is not free at snapshot time – and a cache keyed on "have I run yet" instead
    // of on its inputs' own values would be a hardcode wearing a lazy initialiser and would pass
    // every OTHER test in this file. The restore arm at the end is what catches that.
    // ⚠ `ECONOMY` IS DECLARED `as const`, so its numbers are readonly to the type system and
    // perfectly writeable at runtime. A fixture that has to move the shipped knobs and put them back
    // is the one legitimate reason to look past that, and the casts are kept as narrow as the job,
    // restored in a `finally`, with the last assertion in this test being that the shipped value came
    // back. Nothing in `src/` writes here – this is the only writer in the repo.
    const curve = ECONOMY.development.ageCurve as {
      peakRate: number
      plateauRate: number
      declineStart: number
    }
    const dev = ECONOMY.development as { matchBonus: number; matchBonusCap: number }
    const ladder = ECONOMY.coach.developmentFactor as Record<string, number>
    const fits = ECONOMY.coach.fitFactor as Record<string, number>
    const shipped = reachableHeadroomShare()
    const restore = {
      plateauRate: curve.plateauRate,
      declineStart: curve.declineStart,
      peakRate: curve.peakRate,
    }
    const restoreLadder = {
      matchBonus: dev.matchBonus,
      matchBonusCap: dev.matchBonusCap,
      elite: ladder.elite,
      great: fits.great,
    }
    const putBack = () => {
      Object.assign(curve, restore)
      Object.assign(dev, {
        matchBonus: restoreLadder.matchBonus,
        matchBonusCap: restoreLadder.matchBonusCap,
      })
      ladder.elite = restoreLadder.elite
      fits.great = restoreLadder.great
    }
    try {
      // --- THE CURVE (bundle H's arms, kept) -------------------------------------------------------
      // A faster plateau fills more of the headroom before the gain term shuts off.
      curve.plateauRate = restore.plateauRate * 2
      const faster = reachableHeadroomShare()
      expect(faster, 'doubling plateauRate must raise what is reachable').toBeGreaterThan(shipped)

      // A later decline gives her more weeks of it.
      putBack()
      curve.declineStart = restore.declineStart + 3
      const longer = reachableHeadroomShare()
      expect(longer, 'a later declineStart must raise what is reachable').toBeGreaterThan(shipped)

      // ...and both directions, so a function that merely rises with any edit is caught too.
      putBack()
      curve.declineStart = restore.declineStart - 3
      expect(
        reachableHeadroomShare(),
        'an earlier declineStart must LOWER what is reachable',
      ).toBeLessThan(shipped)

      putBack()
      curve.peakRate = restore.peakRate * 1.3
      expect(reachableHeadroomShare(), 'a steeper peakRate must raise it').toBeGreaterThan(shipped)

      // --- THE COACH LADDER (bundle I's addition) --------------------------------------------------
      // ⭐ `coachFactor`'s TOP RUNG is what the walk reads, so a retune of the dearest coach has to
      // move the yardstick: if Elite got better, "the best available coaching" got better with it.
      putBack()
      ladder.elite = restoreLadder.elite * 1.2
      expect(
        reachableHeadroomShare(),
        'a stronger elite rung must raise what the best coaching reaches',
      ).toBeGreaterThan(shipped)

      putBack()
      ladder.elite = restoreLadder.elite * 0.8
      expect(
        reachableHeadroomShare(),
        'a weaker elite rung must LOWER what the best coaching reaches',
      ).toBeLessThan(shipped)

      // ...and the FIT half of `coachFactor`, which is the other multiplicand and would be missed by
      // a key that watched `developmentFactor` alone.
      putBack()
      fits.great = restoreLadder.great * 1.1
      expect(reachableHeadroomShare(), 'a better great-fit must raise it').toBeGreaterThan(shipped)

      // --- THE MATCH BONUS (bundle I's addition) ---------------------------------------------------
      // ⭐ The other half of "the best week anybody can buy". Both the per-match bonus and the cap it
      // is counted to, because a key that watched one would rot on a retune of the other.
      putBack()
      dev.matchBonus = restoreLadder.matchBonus * 1.5
      expect(reachableHeadroomShare(), 'a bigger matchBonus must raise it').toBeGreaterThan(shipped)

      putBack()
      dev.matchBonus = restoreLadder.matchBonus * 0.5
      expect(reachableHeadroomShare(), 'a smaller matchBonus must LOWER it').toBeLessThan(shipped)

      putBack()
      dev.matchBonusCap = restoreLadder.matchBonusCap + 2
      expect(reachableHeadroomShare(), 'a higher matchBonusCap must raise it').toBeGreaterThan(shipped)
    } finally {
      putBack()
    }
    // ⚠ AND IT COMES BACK. A memo that froze the first answer would fail here, having passed every
    // arm above by never having been asked a second question about the same inputs.
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

// ⚠ THESE ARE BUNDLE H'S ASSERTIONS, KEPT AND RE-AIMED RATHER THAN REPLACED. Every claim in this
// block is about the EDGES meaning what the owner approved, which is true under either denominator;
// what moved is where each edge falls in raw terms, and every sample point below is derived from
// `reachableHeadroomShare()` rather than written down, so they followed the change on their own.
describe('bundle I: the approved edges still mean what they say', () => {
  it('⭐ a career at its birth build still reads «Huge potential», however well she was born', () => {
    // The claim bundle A shipped, re-asserted against the new denominator: normalising divides, and
    // dividing zero by anything is still zero. This is the sentence the owner met at fourteen.
    for (const seed of ['r34h-born-a', 'r34h-born-b', 'r34h-born-c']) {
      const untrained = careerAtRaw(seed, 0)
      expect(coachRoomBandOf(untrained), seed).toBe(0)
      expect(coachRoomNote(untrained), seed).toMatch(/^Huge potential/)
    }
  })

  it('⭐⭐ a career that took everything the BEST COACHING offers reads the TOP band', () => {
    // Before bundle H this was the defect in one assertion: a career that had realised the entire
    // reachable maximum read 0.867 and was told «Close to her ceiling», because the rest was
    // arithmetically unavailable to her. Now the top of the scale is what the best coaching reaches,
    // and a career that took all of it reads the top band.
    const finished = careerAtRaw('r34h-finished', reachableHeadroomShare())
    expect(coachRoomBandOf(finished)).toBe(3)
    expect(coachRoomNote(finished)).toMatch(/^At her ceiling/)

    // ⚠ RE-AIMED FROM BUNDLE H, WHICH ASSERTED `reachable < 0.9` HERE. That was H's way of saying
    // "the top band is reached by normalisation, not by construction", and it worked only because
    // H's bare-curve denominator (0.8668) happened to sit BELOW the top edge. Bundle I's is 0.9766,
    // above it, so that arm is arithmetically gone. The claim it was making is made properly below
    // instead: a career one hair under the maximum must NOT read the top band, which is the same
    // statement and does not depend on where the denominator happens to fall.
    const nearlyFinished = careerAtShown('r34h-nearly', 0.895)
    expect(coachRoomBandOf(nearlyFinished), 'the top band is earned, not automatic').toBe(2)
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

// =================================================================================================
// WHICH BAND EACH RUNG REACHES – walked through the real engine, one career per rung
// =================================================================================================
//
// ⚠ WALKED THROUGH THE REAL ENGINE, because an index-level check passes happily on copy no career
// can reach – the round-23 lesson about dead strings, asked at the other end of the ladder. One
// career per rung here to keep the unit suite honest about its runtime; the eight-seed version is
// `npx vite-node tools/r34-reachable-ceiling.ts`, and its numbers are in the ledger.
//
// ⚠⚠ RE-AIMED FROM BUNDLE H, WHICH ASSERTED `[0, 1, 2, 3]` ON ALL FOUR HIRED RUNGS. That was true
// under H's bare-curve denominator and it is not true under bundle I's, for the reason H's own
// numbers predict: H's budget / middle / high careers reached the top band only by EXCEEDING the
// denominator and being pinned there by the clamp. Measured, 8 seeds per rung, 780 weeks (14 -> 29):
//
//   rung     Huge potential  Still room to grow  Close to her ceiling  At her ceiling   reached top
//   self     14.0            16.1                22.7                  never            0/8
//   budget   14.0            15.6                19.8                  never            0/8
//   middle   14.0            15.5                19.1                  28.9             3/8
//   high     14.0            15.4                18.7                  27.1             8/8
//   elite    14.0            15.4                18.4                  25.5             8/8
//
// ⭐ THE `self` ROW IS THE ONE BUNDLE I WAS BUILT TO PRODUCE and it is asserted below: a girl nobody
// ever coached must never be told «no coach can add much more now, whatever the price», because a
// coach demonstrably would.
//
// ⚠⚠ AND THE `budget` ROW IS AN OPEN CONSEQUENCE FOR THE OWNER, REPORTED AND NOT ADJUSTED. It is
// asserted below as measured rather than quietly left untested, because the alternative – deleting
// the claim – is how a known gap stops being known. Both knobs that would close it are his: the
// edges (0.40 / 0.75 / 0.90, approved 02.09) and the choice of denominator. See
// docs/rounds/round-34.md, bundle I.
describe('bundle I: which band each rung reaches, walked through the real engine', () => {
  const RUNGS: CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']
  /** One 780-week walk per rung – 15 seasons, 14 -> 29, the whole growth arc and none of the decline
   *  past it – collected once and read by every test below, because five walks are the expensive part
   *  of this file and each `it` wants a different column of the same table. */
  type Walk = {
    seen: number[]
    peakRatio: number
    pinnedWeeks: number
    topAtAge: number | null
    /** Weeks on which the band went DOWN. The no-flicker claim, recorded rather than asserted in the
     *  loop, so that the walk stays plain data-gathering and every assertion lives in an `it`. */
    backwards: number
  }
  const walked = new Map<CoachTier, Walk>()
  // ⚠⚠ THE HOOK'S BUDGET IS 50 s AND IT WAS 120 s – RE-AIMED BY P-15/T-05 (05.09), and the number is
  // the whole point of the change. This hook is the most expensive thing in the file by two orders
  // of magnitude: measured 05.09, the file runs 13.4 s solo of which the fifteen tests are 0.24 s,
  // and the review measured the hook at 22.0 s of a 22.6 s wall IN THE POOL and 31.2 s of 32.2 s
  // under four concurrent lanes.
  //
  // ⚠ 120 s WAS A BUDGET THE RUNNER CANNOT HONOUR, which is T-05's finding about thirty files and
  // this is one of them. `tests/round34-reachable-ceiling.test.ts` is NOT in `HEAVY_UNIT_FILES`
  // (scripts/heavy-tests.mjs), so it runs in the parallel bulk pool, where birpc's per-FILE reporter
  // wall is 60 s and unraisable – the wall five recorded incidents in that script's own header were
  // killed by. A hook allowed 120 s in a pool that kills the file at 60 can never spend its budget:
  // at 61 s the FILE dies with every test green and nothing named, which is the «all green, exit 1»
  // shape scripts/lib/stall.mjs was written to classify. 50 s spends first, 10 s under the wall.
  //
  // ⚠ AND THE BUDGET DOES BITE ON A SYNCHRONOUS HOOK, which was worth proving rather than assuming:
  // vitest cannot INTERRUPT a synchronous walk – the wall clock is unchanged either way – but it
  // measures the elapsed time and fails the suite when it returns. Verified 05.09 by setting this
  // number to 1_000: «Error: Hook timed out in 1000ms», file red, 9 passed / 6 skipped, exit 1. So
  // the number is the difference between a named hook failure and an unattributed file kill.
  beforeAll(() => {
    for (const tier of RUNGS) {
      const world = createWorld(`r34h-walk-${tier}`, { ...DEFAULT_PROFILE, coachTier: tier })
      const rng = rngFromSeed(world.seed)
      const born = startingSkills(world.seed, world.profile)
      const reachable = reachableHeadroomShare()
      let last = coachRoomBandOf(world)!
      const seen: number[] = [last]
      let peakRatio = 0
      let pinnedWeeks = 0
      let backwards = 0
      let topAtAge: number | null = null
      for (let w = 0; w < 780; w++) {
        tickWeek(world, rng)
        const band = coachRoomBandOf(world)!
        if (band < last) backwards += 1
        if (band !== last) seen.push(band)
        last = band
        if (band === 3 && topAtAge === null) topAtAge = 14 + world.week / WEEKS_IN_SEASON
        // The RAW ratio, i.e. what `realisedShare` computes BEFORE its `Math.min(1, …)`. This is the
        // quantity the clamp test below reads.
        let gained = 0
        let room = 0
        for (const k of SKILL_KEYS) {
          gained += world.skills[k] - born[k]
          room += world.potential[k] - born[k]
        }
        const ratio = gained / (room * reachable)
        peakRatio = Math.max(peakRatio, ratio)
        if (ratio >= 1) pinnedWeeks += 1
      }
      walked.set(tier, { seen, peakRatio, pinnedWeeks, topAtAge, backwards })
    }
  }, 50_000)

  it('no rung flickers – the band never steps back on a career that is merely progressing', () => {
    // A band that stepped back and forth across a threshold would put two different sentences on
    // alternate Tuesdays with nothing having happened. Asserted on all five REAL careers, which is
    // the claim the swept version above cannot make.
    for (const tier of RUNGS) {
      expect(walked.get(tier)!.backwards, `${tier} stepped backwards`).toBe(0)
    }
  })

  it('⭐⭐ a SELF-COACHED career NEVER reaches the top band – the point of the bundle', () => {
    // ⚠⚠ THIS IS THE ASSERTION BUNDLE I EXISTS FOR. The fourth band carries ADVICE, not a verdict:
    // «no coach can add much more now, whatever the price». Saying that to the parent of a girl who
    // has never had a coach is simply false – a coach is exactly what would still buy her something –
    // and under bundle H's bare-curve denominator she was told it anyway, because the denominator WAS
    // her own uncoached curve and she filled it.
    const self = walked.get('self')!
    expect(self.seen, 'self-coached: three bands, in order, and it stops at «Close to her ceiling»').toEqual([0, 1, 2])
    expect(self.topAtAge, 'a girl nobody coached may never be told a coach cannot help').toBeNull()
    // ...and she genuinely gets near the top of what she can do, so the line above is a statement
    // about the SCALE and not about a career that simply went nowhere.
    expect(self.peakRatio).toBeGreaterThan(0.75)
    expect(self.peakRatio).toBeLessThan(0.9)
  })

  it('⭐ the high and elite rungs DO reach it, and every band arrives in order', () => {
    // The other end of the same claim: the top band is not dead copy. `toEqual` on the whole walk
    // forbids a skipped band, a repeat and any step backwards, so this is the strong form.
    for (const tier of ['high', 'elite'] as CoachTier[]) {
      const w = walked.get(tier)!
      expect(w.seen, `${tier}: every band, in order, none skipped and none repeated`).toEqual([0, 1, 2, 3])
      expect(w.topAtAge, `${tier} reaches «At her ceiling»`).not.toBeNull()
    }
    // Measured: high at 26.3, elite at 25.2 on these seeds (26.5-27.8 and 24.8-25.8 across eight).
    // Pinned as a BAND rather than a point – the claim is "late in her career but inside it", and a
    // tighter pin would redden on a tuning change that did not move the meaning.
    expect(walked.get('high')!.topAtAge!).toBeGreaterThan(24)
    expect(walked.get('high')!.topAtAge!).toBeLessThan(29)
    expect(walked.get('elite')!.topAtAge!).toBeLessThan(walked.get('high')!.topAtAge!)
  })

  it('⚠⚠ the BUDGET rung does not reach it inside the growth arc – measured, reported, not adjusted', () => {
    // ⚠⚠ AN OPEN CONSEQUENCE FOR THE OWNER, PINNED SO THAT IT CANNOT BE FORGOTTEN. Bundle H's whole
    // argument was that «a parent whose girl had genuinely stopped growing was never told to stop
    // paying», and bundle I re-opens exactly that at the bottom of the hired ladder: 0/8 budget
    // careers and 3/8 middle ones ever hear «At her ceiling», the middle ones only at 28.9.
    //
    // ⚠ IT IS NOT A DEFECT IN THIS CODE AND IT WAS NOT SILENTLY TUNED AWAY. Both knobs that would
    // close it belong to the owner: the band edges (0.40 / 0.75 / 0.90, approved 02.09, explicitly
    // out of scope for this bundle) and the choice of denominator (his «да, перенормируй показ
    // сразу», measured both ways in docs/rounds/round-34.md). This test records where the code
    // actually stands so that a later wave moving either knob turns it red and gets read.
    const budget = walked.get('budget')!
    expect(budget.seen, 'budget: reaches «Close to her ceiling» and stops there').toEqual([0, 1, 2])
    expect(budget.topAtAge, 'budget does NOT reach «At her ceiling» – the open item').toBeNull()
    // ...and it is MARGINAL rather than remote, which is the part that makes it a question for him
    // and not a structural fact: she ends a couple of points under the edge.
    expect(budget.peakRatio, 'budget lands just under the 0.90 edge').toBeGreaterThan(0.85)
    expect(budget.peakRatio).toBeLessThan(0.9)
  })

  it('the peak share is a strict ladder across the five rungs, which is the structural claim', () => {
    // ⭐ THE ROBUST HALF OF THIS FILE. Where each rung lands relative to an EDGE is a tuning question
    // and the two tests above pin today's answer; that the rungs are ORDERED at all is a property of
    // the model, and it survives any edge or denominator the owner picks. A read that did not rise
    // with the money spent would be the round-34 #2b inversion returning.
    const peaks = RUNGS.map((t) => walked.get(t)!.peakRatio)
    for (let i = 1; i < peaks.length; i++) {
      expect(peaks[i], `${RUNGS[i]} must realise more than ${RUNGS[i - 1]}`).toBeGreaterThan(peaks[i - 1])
    }
  })

  it('⭐⭐ THE CLAMP IS NOT LOAD-BEARING: no ordinary career is pinned at 1.0 by it', () => {
    // ⚠⚠ THIS IS BUNDLE H'S DEFECT AS A MECHANICAL TEST, AND IT IS THE ARM THAT CATCHES A REVERT.
    // `realisedShare` ends in `Math.min(1, …)`. Under H's bare-curve denominator that clamp was doing
    // the READING rather than guarding it – measured over the same walks, a middle career spent 12.5%
    // of its weeks pinned at 1.000, high 26.6% and elite 34.2%, which is what «At her ceiling from
    // nineteen, for ever» looks like in the arithmetic. Under bundle I: 0.0% at every rung.
    //
    // ⚠ MUTATION-VERIFIED: put `ageFactor` alone back in the walk and every rung from middle up goes
    // non-zero here, which is the whole bundle in one number.
    for (const tier of RUNGS) {
      const w = walked.get(tier)!
      expect(w.pinnedWeeks, `${tier} must never be pinned at the clamp in normal play`).toBe(0)
      expect(w.peakRatio, `${tier}'s raw ratio must stay under 1`).toBeLessThan(1)
    }
  })
})
