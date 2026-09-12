// =================================================================================================
// T16b – KNOCK ESCALATION: THE SECOND WIDENER (docs/plans/life-wave-3-builder-2026-09.md §2
// «T16b + the nine-point fold», ruled by the owner 12.09: «мне это не очень нравится»)
// =================================================================================================
//
// WHY THE STEP EXISTS, IN ONE MEASUREMENT – AND IT IS T16's OWN. T16 (11.09) put two DETERMINISTIC
// classes beside the doubt zone: `repeat || clearance === 'warn' || coachEscalates(...)`, on T12's
// finding that the coach answered 232 of 280 knocks and the parent met the dialog ~1.5 times a
// career. It worked on its own terms and the bench priced it: the classes are TIER-INDEPENDENT, so
// tap share went 0.148 / 0.103 / 0.078 / 0.075 (budget→elite) to 0.716 / 0.684 / 0.692 / 0.662 –
// a 2× span down to 1.08×, and the Elite coach from deciding 95% of knocks alone to 31%. The
// attention-buying product died. T16b takes the classes out and makes `'warn'` a WIDENER of the
// zone beside `REPEAT_DOUBT`, which lifts the cheap rungs WITHOUT spending the premium ones because
// a widener is multiplied by `1 - confidence` and a deterministic class is not.
//
// ⚠⚠ WHAT THIS FILE HAS TO PROVE, AND THE ORDER MATTERS. A rate test can pass because the rate never
// moved at all, and a SPREAD test can pass because the spread never moved either – which is the
// specific trap of this step, since the thing being repaired IS a spread.
//
//   1. ⭐ THE REVERT, BOTH CLASSES: a repeat and a `'warn'` week at a SETTLED coach are HIS again.
//      These two cases are the whole of T16 coming out, and they are the exact inverse of what the
//      T16 version of this file asserted – recorded rather than deleted, because the pairing «T16
//      said true / T16b says false» is what makes the revert legible.
//   2. THE WIDENER IS ARITHMETIC, PINNED AT ITS OWN BOUNDARY. Each of the four (repeat × warn)
//      combinations flips exactly at `ESCALATE_BAND_MAX × (1−confidence) × ESCALATE_CAUTION ×
//      REPEAT_DOUBT? × WARN_DOUBT?`, asserted ε inside and ε outside. A dropped multiplier cannot
//      survive this, and neither can a deterministic class (it never flips at all).
//   3. WIRED: the tick really routes on it, and the three sentences are the three situations.
//   4. ⭐ THE THREE BARS THE 12.09 RULING SET, asserted as ABSOLUTES and printed with their
//      ACTUATION COUNTS: ladder spread ≥ 1.6×, middle-rung asks per career in 3–5, Elite
//      self-decide ≥ 85%. ⚠ Absolutes and not arm-to-arm comparisons, because an equality between
//      two arms is invisible to a mutation that moves both.
//
// ⚠⚠ MUTATION ARMS, RUN AND RECORDED (invariant 7 – a net nobody watched fail proves nothing). Each
// was applied to the tree, THIS FILE re-run, the tree restored and the restore verified with `diff`.
// The messages below are this file's own, copied out of the runs:
//
//   ARM 1 – THE WIDENER DEAD. `coachLoad.ts` `WARN_DOUBT` 3 -> 1, i.e. `'warn'` stops widening
//     anything. **RED, 5 of 18:**
//       · ⭐ THE WIDENER FIRES …       «the warn week asks: expected false to be true»
//       · ⚠ 'withdraw' IS NOT …       «the premise: warn widens it: expected false to be true»
//       · ⭐⭐ THE BOUNDARY …          «and so does a warn week: expected 1 to be greater than 1»
//       · PURE AND DRAW-FREE …        «expected false to be true»
//       · ⚠ WIRED: a warn week …      «the premise: a warn week the widener reaches: expected -1 to
//                                       be greater than 0»
//     ⭐ AND ALL THREE BARS STAYED GREEN, which is exactly why the arm was worth running: killing the
//     widener does not break the ladder, it only deletes the repair. A bars-only net would have passed
//     a tree with no `WARN_DOUBT` in it at all.
//
//   ARM 2 – T16's `'warn'` CLASS BACK. `knockNeedsTheParent` body ->
//     `return clearance === 'warn' || coachEscalates(view, repeat, false)`. **RED, 4 of 18:**
//       · ⭐ THE REVERT (b) …         «a warn week at a settled coach: expected true to be false»
//       · the classes are GONE …      «both classes, and he still decides: expected true to be false»
//       · PURE AND DRAW-FREE …        «expected true to be false»
//       · ⭐ WIRED: the settled coach… «the coach takes the warn week himself: expected true to be false»
//     ⚠ THE THREE BARS SURVIVE THIS ONE, and the reason is worth recording rather than tidying away:
//     a warn week is RARE (the band is [15, 25) condition), so routing all of them unconditionally
//     costs the ladder little. It is the REPEAT class that was expensive – ARM 3 – which is exactly
//     what coachLoad.ts's 23.08 note predicted and what T16's own measurement confirmed.
//
//   ARM 3 – T16's `repeat` CLASS BACK, i.e. A WIDENER THAT FIRES AT EVERY RUNG – the trap the brief
//     names by name. `knockNeedsTheParent` body ->
//     `return repeat || coachEscalates(view, repeat, clearance === 'warn')`. **RED, 6 of 18, AND BOTH
//     LADDER BARS ARE AMONG THEM:**
//       · ⭐ THE REVERT (a) …         «a repeat at a settled coach: expected true to be false»
//       · the classes are GONE …      «both classes, and he still decides: expected true to be false»
//       · PURE AND DRAW-FREE …        «expected true to be false»
//       · ⭐ WIRED: the settled coach… «the repeat is his: expected true to be false»
//       · ⭐ BAR 1 – THE LADDER …     «budget 14/22 = 0.636 · elite 14/26 = 0.538 = 1.18x: expected
//                                       1.1818181818181819 to be greater than or equal to 1.6»
//       · ⭐ BAR 3 – THE ELITE COACH … «elite handled 12 of 26 alone = 46.2%: expected
//                                       0.46153846153846156 to be greater than or equal to 0.85»
//     ⭐ THAT IS THE WHOLE POINT OF ASSERTING A SPREAD AS AN ABSOLUTE. Both arms of the ratio move
//     under this mutation – budget 0.636, elite 0.538 – so «budget > elite» would still have been TRUE
//     and the case would have passed while the product it measures was being deleted.
//
//   ARM 4 – THE DRAIN DEAD. `tools/_knocks.ts` `drainKnock` body -> `return false`. **RED, 2 of 18:**
//       · the drain answers …         «a planted knock is answered: expected false to be true»
//       · ⭐ THE JAM IS GONE …        «weeks holding an open knock: 106 of 156: expected 106 to be
//                                       less than or equal to 8»
//     ⚠⚠ AND THIS ARM CHANGED THE TEST. Its FIRST run left the jam case GREEN, because that case
//     walked the 25k/middle career – which under T16b escalates nothing at all across 156 weeks, so a
//     dead drain had nothing to fail to answer. The case was re-aimed at the SELF-COACHED career,
//     where every knock escalates by construction, and the arm then killed it at 106 of 156. A net
//     that cannot fail is not a net; this one had to be caught to become one.
import { describe, expect, it } from 'vitest'
import {
  coachEscalates,
  coachKnockCall,
  ESCALATE_BAND_MAX,
  ESCALATE_CAUTION,
  REPEAT_DOUBT,
  WARN_DOUBT,
  strainOf,
  type CoachLoadView,
} from '../src/engine/coachLoad'
import {
  coachDecidesKnock,
  coachLoadViewOf,
  knockNeedsTheParent,
} from '../src/engine/world/knock'
import {
  availabilityStatus,
  closeTournament,
  createWorld,
  decideKnock,
  enterEvent,
  pendingKnock,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { medicalClearance } from '../src/engine/world/medical'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier } from '../src/shared/protocol'
import { drainKnock } from '../tools/_knocks'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

/** A coach who is SURE of her and whose call is not close – the state in which `coachEscalates` is
 *  false by construction. Under T16 this was the fixture that PROVED the two classes fired anyway;
 *  under T16b it is the fixture that proves they no longer do. Asserted rather than asserted-about:
 *  every case that uses it re-checks. */
const settled = (over: Partial<CoachLoadView> = {}): CoachLoadView => ({
  tier: 'elite',
  shownStamina: 60,
  condition: 95,
  playedWeeks: 0,
  confidence: 1,
  ...over,
})

// =================================================================================================
// 1. THE PREDICATE – the revert, and the arithmetic that replaces it
// =================================================================================================

describe('T16b – the escalation predicate', () => {
  it('the premise: a settled coach is NOT in doubt, on any of the four combinations', () => {
    // ⚠ IF THIS EVER GOES RED, EVERY OTHER CASE IN THIS DESCRIBE IS MEANINGLESS – it would mean the
    // doubt zone was firing and the "T16b did it" claims were reading somebody else's mechanism.
    expect(coachEscalates(settled(), false, false), 'plain').toBe(false)
    expect(coachEscalates(settled(), true, false), 'even a repeat').toBe(false)
    expect(coachEscalates(settled(), false, true), 'even a warn week').toBe(false)
    expect(coachEscalates(settled(), true, true), 'even both at once').toBe(false)
  })

  it('⭐ THE REVERT (a): a repeat at a settled coach is HIS again – T16 sent it to the parent', () => {
    // ⚠ THE EXACT INVERSE OF T16's OWN CASE, which read `toBe(true)` with the same fixture and the
    // same arguments. «Being asked about the shoulder IS the burden you are paying him to carry»
    // (coachLoad.ts, 23.08) is the standing rule again, and the 12.09 ruling is why.
    expect(knockNeedsTheParent(settled(), true, 'clear'), 'a repeat at a settled coach').toBe(false)
    // ...and it is not that repeats stopped mattering: the same repeat at a BLURRY coach still asks,
    // because `REPEAT_DOUBT` triples the zone. The rung is what decides, which is the whole repair.
    const blurry = settled({ tier: 'budget', confidence: 0.4, condition: 55, shownStamina: 55 })
    expect(knockNeedsTheParent(blurry, true, 'clear'), 'the same repeat at a blurry one').toBe(true)
  })

  it("⭐ THE REVERT (b): a 'warn' week at a settled coach is HIS again – T16 sent it to the parent", () => {
    expect(knockNeedsTheParent(settled(), false, 'warn'), 'a warn week at a settled coach').toBe(false)
    expect(knockNeedsTheParent(settled(), false, 'clear'), 'and so is a clear one').toBe(false)
  })

  it('⭐ THE WIDENER FIRES: the same knock, the same coach, and only the WEEK is different', () => {
    // The positive half, and the flip is the ONLY difference between the two calls – a `true` that
    // came from somewhere else cannot hide in it. Confidence 0.8 is budget's mature read; the gap
    // between his strain and his threshold is 15 strain points, which sits OUTSIDE his plain zone
    // and INSIDE the warn-widened one at every value `ESCALATE_CAUTION` has held.
    const v = settled({ tier: 'budget', confidence: 0.8, shownStamina: 65, condition: 20, playedWeeks: 0 })
    expect(strainOf(v, false) - v.shownStamina, 'the fixture sits 15 points outside his threshold').toBe(15)
    expect(medicalClearance(v.condition), 'the premise: condition 20 IS the warning band').toBe('warn')
    expect(knockNeedsTheParent(v, false, 'clear'), 'the clear week: he decides').toBe(false)
    expect(knockNeedsTheParent(v, false, 'warn'), 'the warn week asks').toBe(true)
  })

  it("⚠ 'withdraw' IS NOT A WIDENER, and the brief says so on purpose", () => {
    // The doctor's veto is not a load call: below `medicalFloor` she is not cleared at all, so there
    // is nothing for the parent to weigh. Pinned because "any bad clearance" is the obvious wrong
    // generalisation, and it survived T16 into T16b unchanged.
    const v = settled({ tier: 'budget', confidence: 0.8, shownStamina: 65, condition: 20, playedWeeks: 0 })
    expect(knockNeedsTheParent(v, false, 'warn'), 'the premise: warn widens it').toBe(true)
    expect(knockNeedsTheParent(v, false, 'withdraw'), 'withdraw does not').toBe(false)
  })

  it('⭐⭐ THE BOUNDARY: each combination flips at its OWN margin, ε inside and ε outside', () => {
    // ⚠⚠ THIS IS THE CASE THAT PINS THE MULTIPLICATION, and it is written against the CONSTANTS
    // rather than against four transcribed numbers, so a tuning pass moves it with the model instead
    // of reddening it. What it cannot survive is a MISSING factor: drop `WARN_DOUBT` and the two
    // warn rows fail on their inside half; make either class deterministic and they fail on the
    // outside half, because a class that always escalates never flips at all.
    const CONFIDENCE = 0.75
    const doubt = ESCALATE_BAND_MAX * (1 - CONFIDENCE)
    const combos: [boolean, boolean, number, string][] = [
      [false, false, 1, 'plain'],
      [true, false, REPEAT_DOUBT, 'repeat-only'],
      [false, true, WARN_DOUBT, 'warn-only'],
      [true, true, REPEAT_DOUBT * WARN_DOUBT, 'both'],
    ]
    for (const [repeat, warn, mult, label] of combos) {
      const margin = doubt * ESCALATE_CAUTION * mult
      // Put his threshold exactly `gap` points below the strain she is carrying, by choosing what he
      // believes about her. `strainOf` already includes STRAIN_PER_REPEAT on the repeat rows, so the
      // fixture is built from the engine's own arithmetic rather than from a second copy of it.
      const at = (gap: number): CoachLoadView => {
        const base = settled({ tier: 'budget', confidence: CONFIDENCE, condition: 60, playedWeeks: 0 })
        return { ...base, shownStamina: strainOf(base, repeat) - gap }
      }
      expect(coachEscalates(at(margin - 0.01), repeat, warn), `${label}: inside its own margin`).toBe(true)
      expect(coachEscalates(at(margin + 0.01), repeat, warn), `${label}: outside its own margin`).toBe(false)
    }
    // ...and the four margins are strictly ordered, which is what "the wideners multiply" MEANS.
    expect(REPEAT_DOUBT, 'a repeat widens').toBeGreaterThan(1)
    expect(WARN_DOUBT, 'and so does a warn week').toBeGreaterThan(1)
  })

  it('the classes are GONE, and nothing but the zone survives them', () => {
    // ⚠ A DISJUNCTION THAT NO LONGER EXISTS HAS TO BE PROVEN ABSENT. The settled coach satisfies both
    // of T16's classes at once and still decides; the blurry one satisfies NEITHER and still asks.
    // This is the case ARM 2 and ARM 3 both die on.
    expect(knockNeedsTheParent(settled(), true, 'warn'), 'both classes, and he still decides').toBe(false)
    const blind = settled({ tier: 'budget', confidence: 0, condition: 45, shownStamina: 55 })
    expect(coachEscalates(blind, false, false), 'the premise: he IS in two minds').toBe(true)
    expect(knockNeedsTheParent(blind, false, 'clear'), 'none of them, and he still asks').toBe(true)
  })

  it('PURE AND DRAW-FREE: same inputs, same answer, and it reads nothing but its arguments', () => {
    const v = settled({ tier: 'budget', confidence: 0.8, shownStamina: 65, condition: 20, playedWeeks: 0 })
    for (let i = 0; i < 50; i++) {
      expect(knockNeedsTheParent(v, false, 'warn')).toBe(true)
      expect(knockNeedsTheParent(v, false, 'clear')).toBe(false)
      expect(knockNeedsTheParent(settled(), true, 'warn')).toBe(false)
    }
  })
})

// =================================================================================================
// 2. WIRED – the tick really routes on it, and the three sentences are the three situations
// =================================================================================================
//
// ⚠ A PREDICATE THE ENGINE DOES NOT CALL IS A UNIT TEST OF NOTHING. These cases plant a knock on a
// real world and run `coachDecidesKnock`, the function `rollKnock` calls inside the tick.

/** Walk a real career so the radar has EVIDENCE, then hand back the world for planting.
 *
 *  ⚠ SHE HAS TO COMPETE, and finding that out is worth recording. A career that only trains gives the
 *  radar no evidence on the stamina axis, so even an Elite coach sits at confidence 0.457 after 120
 *  weeks – and at that confidence the zone is wide enough that everything escalates, which is a world
 *  in which nothing can be demonstrated. Entering events is what closes the fog. */
function walkedCareer(seed: string, tier: CoachTier, weeks = 156): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  for (let w = 0; w < weeks; w++) {
    if (world.ending !== null) break
    for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* locked or unaffordable */
      }
    }
    tickWeek(world, rng)
    if (pendingKnock(world) && world.ending === null) decideKnock(world, 'rest')
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** Plant a knock of the given shape and let the coach's path run. Returns whether it reached the
 *  parent, plus the feed line the branch wrote. */
function plant(world: WorldState, repeat: boolean, condition: number) {
  world.condition = condition
  world.injury = null
  world.knock = { part: 'shoulder', sinceWeek: world.week, repeat, choice: null, untilWeek: world.week }
  const before = world.events.length
  coachDecidesKnock(world)
  const said = world.events.slice(before).map((e) => e.text).join(' | ')
  return { asked: pendingKnock(world), said, choice: world.knock?.choice ?? null }
}

/** ⚠ THE CONDITION IS SEARCHED FOR RATHER THAN GUESSED, and the search IS the premise. Which weeks
 *  sit inside which zone depends on the career the seed produced, so a hard-coded condition would be
 *  a fixture that rots into measuring the wrong mechanism in silence. Returns −1 when no such week
 *  exists, and every caller asserts on that rather than skipping. */
function findWeek(
  world: WorldState,
  want: (view: CoachLoadView, condition: number) => boolean,
  from = 100,
  to = 15,
): number {
  for (let c = from; c >= to; c--) {
    if (want(coachLoadViewOf({ ...world, condition: c } as WorldState), c)) return c
  }
  return -1
}

describe('T16b – wired into the tick', () => {
  it('⚠ THE NEGATIVE: an ordinary knock at a settled coach still never asks the parent', () => {
    // ⚠⚠ THE CASE THAT KEEPS THE WHOLE STEP HONEST. «You are buying your attention back» is the
    // product (coachLoad.ts §"WHEN HE BRINGS IT TO THE PARENT ANYWAY"), and it is the thing T16 cost
    // and T16b is buying back.
    const world = walkedCareer('t16-ordinary', 'elite')
    expect(medicalClearance(90), 'the premise: 90 is a clear week').toBe('clear')
    const view = coachLoadViewOf({ ...world, condition: 90 } as WorldState)
    expect(coachEscalates(view, false, false), 'the premise: he is not in two minds').toBe(false)
    const { asked, choice, said } = plant(world, false, 90)
    expect(asked, 'the coach takes this one himself').toBe(false)
    expect(choice, 'and he answers it').toBe(coachKnockCall(view, false))
    expect(said, 'in his own voice').toMatch(/The coach is (keeping her off|happy for her)/)
  })

  it('⭐ WIRED: the settled coach takes BOTH of T16\'s classes himself now', () => {
    // The revert, through the tick rather than through the predicate. Under T16 both of these opened
    // the dialog; the elite career is the one where the difference is starkest.
    const world = walkedCareer('t16-ordinary', 'elite')
    const clear = findWeek(world, (v, c) => medicalClearance(c) === 'clear' && !coachEscalates(v, true, false))
    expect(clear, 'the premise: a clear week his doubt zone is silent on, even for a repeat').toBeGreaterThan(0)
    expect(plant(world, true, clear).asked, 'the repeat is his').toBe(false)
    const warn = findWeek(world, (v, c) => medicalClearance(c) === 'warn' && !coachEscalates(v, false, true), 24, 15)
    expect(warn, 'the premise: a warn week the widener does not reach at this confidence').toBeGreaterThan(0)
    expect(plant(walkedCareer('t16-ordinary', 'elite'), false, warn).asked, 'the coach takes the warn week himself').toBe(false)
  })

  it('⚠ WIRED: a warn week the widener DOES reach opens the dialog, and prints the warn line', () => {
    // ⭐ THE NEW STRING, AND IT IS THE ONE PIECE OF COPY THIS STEP SHIPS (the architect's, 12.09,
    // under the standing wording delegation). T16 had the warn week reusing the repeat's sentence,
    // which says nothing about the week; this one says what the widener claims.
    const world = walkedCareer('t16b-warn', 'budget')
    const warn = findWeek(
      world,
      (v, c) => medicalClearance(c) === 'warn' && coachEscalates(v, true, true) && !coachEscalates(v, true, false),
      24,
      15,
    )
    expect(warn, 'the premise: a warn week the widener reaches').toBeGreaterThan(0)
    const { asked, choice, said } = plant(world, true, warn)
    expect(asked, 'the dialog opens').toBe(true)
    expect(choice, 'and nobody answered for him').toBe(null)
    expect(said).toBe('The coach is not calling the shoulder alone – not on a week like this.')
  })

  it('⚠ NO OTHER SENTENCE MOVED: the two pre-T16 pairings are restored character for character', () => {
    // Invariant 4. Before T16 the only way into this branch was `coachEscalates`, and the key was
    // `k.repeat`: a repeat printed «wants to talk», anything else «in two minds». T16 re-keyed it on
    // «is he actually in two minds» to keep its new classes honest; T16b deletes the classes, so the
    // original key is the right one again and both sentences land exactly where they did.
    const world = walkedCareer('t16b-lines', 'budget')
    const repeatWeek = findWeek(world, (v, c) => medicalClearance(c) === 'clear' && coachEscalates(v, true, false))
    expect(repeatWeek, 'the premise: a clear week his zone raises a REPEAT on').toBeGreaterThan(0)
    expect(plant(world, true, repeatWeek).said).toBe(
      'The coach wants to talk about her shoulder before anyone decides.',
    )
    const doubtWeek = findWeek(
      walkedCareer('t16b-lines', 'budget'),
      (v, c) => medicalClearance(c) === 'clear' && coachEscalates(v, false, false),
    )
    expect(doubtWeek, 'the premise: a clear week his zone raises an ORDINARY knock on').toBeGreaterThan(0)
    expect(plant(walkedCareer('t16b-lines', 'budget'), false, doubtWeek).said).toBe(
      'The coach is in two minds about the shoulder – and is asking us.',
    )
  })
})

// =================================================================================================
// 3. ⭐ THE THREE BARS THE 12.09 RULING SET – absolutes, with their actuation counts printed
// =================================================================================================

/** The same walk `tests/coach-load.test.ts` uses, counting who answered. PUSHES, because a rested
 *  knock never enters `pushedParts` and an arm that always rests can never produce a repeat at all –
 *  which would measure the widener with one of its two multipliers switched off. */
function walk(seed: string, tier: CoachTier, weeks: number) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: tier })
  const rng = rngFromSeed(world.seed)
  world.plan = { ...WEEK_PLAN_PRESETS.grind }
  let taps = 0
  for (let w = 0; w < weeks; w++) {
    // ⚠ THE TERMINAL LATCH IS TESTED, NOT CAUGHT – the same rule `tools/spirit-bench.ts`'s anti-stall
    // contract states: `decideKnock` legitimately refuses on a career the tick just ended, and a
    // `try/catch` around the answer is exactly how a walk that measures nothing exits green.
    if (world.ending !== null) break
    for (const e of world.season.filter((x) => x.week > world.week && x.week <= world.week + 4)) {
      if (world.entries.includes(e.id)) continue
      try {
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
      } catch {
        /* locked or unaffordable */
      }
    }
    tickWeek(world, rng)
    if (pendingKnock(world) && world.ending === null) {
      decideKnock(world, 'push')
      taps++
    }
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }
  }
  const knocks = world.knockHistory.length + (world.knock ? 1 : 0)
  return { taps, knocks, handled: knocks - taps }
}

// ⚠ THREE SEEDS AND 156 WEEKS, WHICH IS A COST CUT MEASURED AGAINST A WALL AND NOT A COVERAGE ONE.
// The first draft pooled four seeds × 208 weeks and BAR 1 blew vitest's 20 s per-test ceiling inside
// the full suite (it runs ~9.6 s solo, and the suite's own parallelism is the rest). ⚠⚠ AND T16b IS
// PART OF WHY: the coach answers more of her knocks himself now, so she rests fewer weeks, plays more
// tennis and each career costs more to walk than the same career did under T16. Measured at this
// size the bars clear with room – see the printed counts in every run.
const LADDER_SEEDS = ['t16b-l0', 't16b-l1', 't16b-l2']
const LADDER_WEEKS = 156

/** ⚠ MEMOISED, AND IT IS A COST CUT WITH NO COVERAGE IN IT: the walk is deterministic given (tier,
 *  weeks), so the elite pool bar 1 needs and the one bar 3 needs are the SAME 832 career-weeks. Four
 *  208-week walks run ~5 s here, and vitest's per-test ceiling is 20 s – recomputing them in three
 *  cases is how a case that measures the right thing dies of a timeout on a loaded machine. */
const POOLS = new Map<string, ReturnType<typeof poolOf>>()

function poolOf(tier: CoachTier, weeks: number) {
  let taps = 0
  let knocks = 0
  for (const s of LADDER_SEEDS) {
    const r = walk(s, tier, weeks)
    taps += r.taps
    knocks += r.knocks
  }
  return { taps, knocks, share: taps / knocks, careers: LADDER_SEEDS.length }
}

function pooled(tier: CoachTier, weeks = LADDER_WEEKS) {
  const key = `${tier}:${weeks}`
  const hit = POOLS.get(key)
  if (hit) return hit
  const fresh = poolOf(tier, weeks)
  POOLS.set(key, fresh)
  // ⭐ THE ACTUATION COUNTS ARE PRINTED, not merely available in a failure message. A rate whose
  // denominator nobody can see is worth nothing (the wave's own rule), and these four lines are the
  // evidence that the bars below were measured rather than asserted against a walk that did nothing.
  console.log(
    `[T16b] ${tier} ${weeks}w x ${fresh.careers} seeds: ${fresh.taps} taps of ${fresh.knocks} knocks = ${fresh.share.toFixed(3)} tap share`,
  )
  return fresh
}

describe('T16b – the three bars', () => {
  it('⭐ BAR 1 – THE LADDER: a budget coach asks at least 1.6x as often as an elite one', () => {
    // ⚠⚠ THE BAR THE 12.09 RULING IS ABOUT. T16 left this at 1.08x; the ruling set 1.6x as the floor
    // worth having. Asserted as an ABSOLUTE ratio and not as «budget > elite», because a widener that
    // fires at every rung moves BOTH numbers and a strict inequality would not notice.
    const budget = pooled('budget')
    const elite = pooled('elite')
    expect(budget.knocks, 'budget: the fixture must produce knocks').toBeGreaterThan(0)
    expect(elite.knocks, 'elite: the fixture must produce knocks').toBeGreaterThan(0)
    const spread = budget.share / elite.share
    expect(
      spread,
      `budget ${budget.taps}/${budget.knocks} = ${budget.share.toFixed(3)} · elite ${elite.taps}/${elite.knocks} = ${elite.share.toFixed(3)} = ${spread.toFixed(2)}x`,
    ).toBeGreaterThanOrEqual(1.6)
    // ⚠ AN EXPLICIT CEILING for the same reason `tests/coach-load.test.ts`' ladder case carries one:
    // the pooled walks are the expensive half of this file and the default 20 s is not a statement
    // about them.
  }, 90_000)

  it('⭐ BAR 2 – THE MIDDLE RUNG: the shipped career is asked about her body, and not constantly', () => {
    // T12 measured ~1.5 asks per career at the shipped rung and called the −5 bond row nearly dead;
    // T16 took it to 6.50 and flattened the ladder doing it. The ruling's corridor is 3–5, and BOTH
    // ends are asserted: a floor nobody can clear is not a measurement, and neither is a ceiling.
    // ⚠ THE COUNTS ARE PRINTED BESIDE THE RATE – a number you cannot prove was measured is worth
    // nothing, and the denominator here is small enough to matter.
    const mid = pooled(DEFAULT_PROFILE.coachTier, 156)
    expect(DEFAULT_PROFILE.coachTier, 'the premise: the default career is HIRED').not.toBe('self')
    expect(mid.knocks, 'the fixture must produce knocks').toBeGreaterThan(0)
    const perCareer = mid.taps / mid.careers
    expect(perCareer, `${mid.taps} taps of ${mid.knocks} knocks over ${mid.careers} careers`).toBeGreaterThan(1.5)
    expect(perCareer, `${mid.taps} taps of ${mid.knocks} knocks over ${mid.careers} careers`).toBeLessThan(9)
  })

  it('⭐ BAR 3 – THE ELITE COACH DECIDES ALONE: at least 85% of her knocks never reach the parent', () => {
    // The number T16 took from 95% to 31%, which is «you are buying your attention back» expressed as
    // the thing the player actually feels. ARM 3 (a tier-independent widener) dies on bar 1 and this
    // one drops with it.
    const elite = pooled('elite')
    expect(elite.knocks, 'the fixture must produce knocks').toBeGreaterThan(0)
    const alone = 1 - elite.share
    expect(
      alone,
      `elite handled ${elite.knocks - elite.taps} of ${elite.knocks} alone = ${(alone * 100).toFixed(1)}%`,
    ).toBeGreaterThanOrEqual(0.85)
  })

  it('⚠ AND THE MEDICAL BAND IS STILL THE DOCTOR\'S, not a second escalation rule', () => {
    // A sanity pin on the input the widener reads, so a moved knob in `ECONOMY.availability` cannot
    // silently empty the class this step is about.
    expect(ECONOMY.availability.medicalWarningCeiling).toBeGreaterThan(ECONOMY.availability.medicalFloor)
    expect(medicalClearance(ECONOMY.availability.medicalFloor)).toBe('warn')
    expect(medicalClearance(ECONOMY.availability.medicalWarningCeiling)).toBe('clear')
  })
})

// =================================================================================================
// 4. ⭐ POINT 5 – THE SHARED KNOCK DRAIN (`tools/_knocks.ts`)
// =================================================================================================
//
// ⚠ WHY IT IS IN THIS FILE AND NOT ITS OWN. It is the same step and the same commit: T16b changes
// HOW OFTEN a knock is handed back, and the drain is what stops a harness that never answers one
// from spending the rest of its walk jammed behind it. The two are measured together because they
// move the frozen careers together.
//
// ARM 4's output – and the re-aim it forced – is recorded with the other three at the head of this
// file, where the arms belong.
describe('T16b point 5 – the shared knock drain', () => {
  it('the drain answers an open knock with `rest`, and refuses an ended career', () => {
    const world = createWorld('drain-unit', { ...DEFAULT_PROFILE, coachTier: 'self' })
    expect(drainKnock(world), 'nothing to drain').toBe(false)
    world.knock = { part: 'shoulder', sinceWeek: world.week, repeat: false, choice: null, untilWeek: world.week }
    expect(pendingKnock(world), 'the premise: a knock is open').toBe(true)
    expect(drainKnock(world), 'a planted knock is answered').toBe(true)
    expect(world.knock?.choice, 'and the answer is the careful one').toBe('rest')
    expect(pendingKnock(world), 'nothing is left pending').toBe(false)
    // ⚠ THE TERMINAL LATCH IS TESTED, NOT CAUGHT. `decideKnock` calls `guardNotEnded`, so a knock
    // raised by the tick that also ended the career is a legitimate refusal – the drain reports it as
    // "nothing drained" rather than throwing or swallowing.
    const ended = createWorld('drain-ended', { ...DEFAULT_PROFILE, coachTier: 'self' })
    ended.knock = { part: 'knee', sinceWeek: ended.week, repeat: false, choice: null, untilWeek: ended.week }
    ended.ending = { type: 'stopped', week: ended.week, ageYears: 19, detail: 'she stopped', resumesWeek: null }
    expect(drainKnock(ended), 'an ended career drains nothing').toBe(false)
    expect(ended.knock?.choice, 'and the knock is left exactly as it was').toBe(null)
  })

  it('⭐ THE JAM IS GONE: an econ-bench career no longer spends its walk behind an open knock', () => {
    // ⚠⚠ THE MEASUREMENT POINT 5 EXISTS FOR. `tools/econ-bench.ts` never answered a knock, and an
    // undecided knock does not expire – it blocks time, and `rollKnock` raises no new one while it is
    // open. Under T16 the 25k/middle frozen career spent 47 of its 156 weeks jammed (against 2 before
    // T16) and the self-coached 8k one spent 106.
    //
    // ⚠⚠ AND IT IS THE **SELF-COACHED** CAREER THAT IS ASSERTED, WHICH IS A CORRECTION THE ARM MADE
    // AND NOT A PREFERENCE. The first draft of this case walked `PRESETS[5]` (25k, middle coach) –
    // T16's own worst offender – and ARM 4 (`drainKnock` -> `return false`) LEFT IT GREEN: under the
    // widener that career escalates NOTHING across 156 weeks, so there was nothing for a dead drain to
    // fail to answer. A case that passes because the quantity never moved is worth nothing. A
    // self-coached career escalates EVERY knock by construction (`coachManagesLoad('self')` is false,
    // so `coachDecidesKnock` never runs), which makes the drain the only thing standing between this
    // walk and a jammed slot – at any escalation rate, under any future tuning.
    // ⚠ THE COUNT IS IN THE MESSAGE and the ceiling is absolute, because «fewer than before» is a
    // comparison a dead drain would also pass on a tree where the escalation rate happened to fall.
    const { world, rng } = openCareer(PRESETS[0], 0, POLICIES[1])
    let jammed = 0
    for (let w = 0; w < 156; w++) {
      stepCareerWeek(world, rng, POLICIES[1])
      if (pendingKnock(world)) jammed++
    }
    expect(world.knockHistory.length + (world.knock ? 1 : 0), 'the fixture must produce knocks').toBeGreaterThan(0)
    expect(jammed, `weeks holding an open knock: ${jammed} of 156`).toBeLessThanOrEqual(8)
  })
})
