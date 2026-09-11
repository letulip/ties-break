// =================================================================================================
// T16 – KNOCK ESCALATION: THE COACH CALLS HOME (docs/plans/life-wave-3-builder-2026-09.md §2 T16,
// ruled by the owner 11.09: «давай попробуем»)
// =================================================================================================
//
// WHY THE STEP EXISTS, IN ONE MEASUREMENT. T12 (who-she-is §4a, wave-3 second entry) ran the
// push-through pair at the SHIPPED coach rung and found the coach answering 232 of 280 knocks: the
// parent met the knock dialog about **1.5 times per career** against 9.0 self-coached. So
// `ECONOMY.bond.delta.knockPush` (−3) and `knockPushRepeatPart` (−5) – the two rows of the bond
// table the owner cares about – were nearly dead in normal play, because the decision they price was
// not the parent's to take. The repair adds TWO DETERMINISTIC CLASSES beside the existing
// probabilistic doubt zone; it does NOT touch `ECONOMY.bond.regressionPerWeek`, which travels to its
// own session.
//
// ⚠⚠ WHAT THIS FILE HAS TO PROVE, AND THE ORDER MATTERS. A rate test can pass because the rate never
// moved at all, so the positive is proven FIRST and the negative is asserted beside it:
//
//   1. the predicate, BOTH WAYS, per class – and the flip is the ONLY difference between the two
//      views, so a `true` that came from somewhere else cannot hide in it;
//   2. ⚠ THE NEGATIVE THAT KEEPS IT HONEST: an ORDINARY knock at the default coach – no repeat, a
//      clear week, a coach who is not in doubt – still never reaches the parent. If that went, the
//      step would have deleted the ladder instead of widening it;
//   3. the doubt zone SURVIVES – T16 adds beside `coachEscalates`, it does not replace it;
//   4. the WALKED rate, asserted in both directions: the parent is asked materially MORE than the
//      old rule could produce AND the coach still answers a material share of them alone.
//
// ⚠⚠ MUTATION ARMS, RUN AND RECORDED (invariant 7 – a net nobody watched fail proves nothing). Each
// was applied to `src/engine/world/knock.ts`, the file's tests re-run, and the file restored:
//
//   ARM 1 – DROP THE PREDICATE. `knockNeedsTheParent` body -> `return coachEscalates(view, repeat)`,
//     i.e. exactly the pre-T16 rule. RED, 8 of 13 cases, and these are its own words:
//       · (a) a REPEATED part …            «repeat -> the parent: expected false to be true»
//       · (b) a 'warn' clearance week …    «'warn' -> the parent: expected false to be true»
//       · the classes are three …          «repeat only: expected false to be true»
//       · PURE AND DRAW-FREE …             «expected false to be true»
//       · ⚠ WIRED: a repeat …              «the dialog opens: expected false to be true»
//       · ⚠ WIRED: a 'warn' week …         «the dialog opens: expected false to be true»
//       · ⚠ NO NEW COPY …                  «expected 'The coach is happy for her to train t…' to be
//                                            'The coach wants to talk about her sho…'»
//       · ⭐ THE RATE MOVED …              «the parent has to be asked: 13 of 74: expected 13 to be
//                                            greater than 40»
//     ⭐ THE LAST ONE IS THE WHOLE POINT OF THE ARM and answers «could this case pass against a
//     predicate that never fires»: 13 taps against the 40 the assertion demands.
//
//   ARM 2 – FIRE ALWAYS. `knockNeedsTheParent` body -> `return true`. RED, 8 of 13 cases:
//       · (a) / (b) / the classes are three  «the ONLY thing that changed / none of the three:
//                                             expected true to be false»
//       · ⚠ 'withdraw' is NOT one …          «expected true to be false»
//       · PURE AND DRAW-FREE …               «expected true to be false»
//       · ⚠ THE NEGATIVE …                   «the coach takes this one himself: expected true to be
//                                              false»
//       · ⭐ THE RATE MOVED … on its OTHER direction
//                                            «the coach must still answer some: 0 of 70: expected 0
//                                             to be greater than 0»
//       · ⚠ HIRING STILL MEANS SOMETHING …   «budget must be asked about fewer than all of them:
//                                             expected 1 to be less than 1»
//     Two arms in opposite directions is what makes the rate a MEASUREMENT rather than a floor
//     anybody can clear: ARM 1 dies on «not enough», ARM 2 on «all of them».
import { describe, expect, it } from 'vitest'
import {
  coachEscalates,
  coachKnockCall,
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

/** A coach who is SURE of her and whose call is not close – the state in which `coachEscalates` is
 *  false by construction, so anything this file measures as an escalation came from T16 and not from
 *  the doubt zone. Asserted rather than asserted-about: every case that uses it re-checks. */
const settled = (over: Partial<CoachLoadView> = {}): CoachLoadView => ({
  tier: 'elite',
  shownStamina: 60,
  condition: 95,
  playedWeeks: 0,
  confidence: 1,
  ...over,
})

// =================================================================================================
// 1. THE PREDICATE, BOTH WAYS, ONE CLASS AT A TIME
// =================================================================================================

describe('T16 – the escalation predicate', () => {
  it('the premise: a settled coach is NOT in doubt, so nothing here rides on the old zone', () => {
    // ⚠ IF THIS EVER GOES RED, EVERY OTHER CASE IN THIS DESCRIBE IS MEANINGLESS – it would mean the
    // doubt zone was firing and the "T16 did it" claims were reading somebody else's mechanism.
    expect(coachEscalates(settled(), false), 'no repeat').toBe(false)
    expect(coachEscalates(settled(), true), 'even a repeat').toBe(false)
  })

  it('(a) a REPEATED part goes to the parent – and the same knock without the repeat does not', () => {
    // The −5 row's own trigger. `decideKnock`: "a second one on the same part is the record telling
    // him and being overruled" – so it has to be HIS decision to be overruled on.
    expect(knockNeedsTheParent(settled(), true, 'clear'), 'repeat -> the parent').toBe(true)
    expect(knockNeedsTheParent(settled(), false, 'clear'), 'the ONLY thing that changed').toBe(false)
  })

  it("(b) a 'warn' clearance week goes to the parent – and a 'clear' week does not", () => {
    expect(knockNeedsTheParent(settled(), false, 'warn'), "'warn' -> the parent").toBe(true)
    expect(knockNeedsTheParent(settled(), false, 'clear'), 'the ONLY thing that changed').toBe(false)
  })

  it("⚠ 'withdraw' is NOT one of the classes, and the brief says so on purpose", () => {
    // The doctor's veto is not a load call: below `medicalFloor` she is not cleared at all, so there
    // is nothing for the parent to weigh. Pinned because "any bad clearance" is the obvious wrong
    // generalisation of (b).
    expect(knockNeedsTheParent(settled(), false, 'withdraw')).toBe(false)
  })

  it('the doubt zone SURVIVES – T16 adds beside `coachEscalates`, it does not replace it', () => {
    // A blind coach whose call sits on his own threshold: the pre-T16 mechanism, still live, on a
    // knock that is neither of the two new classes.
    const blind = settled({ tier: 'budget', confidence: 0, condition: 45, shownStamina: 55 })
    expect(coachEscalates(blind, false), 'the premise: he IS in two minds').toBe(true)
    expect(knockNeedsTheParent(blind, false, 'clear')).toBe(true)
  })

  it('the classes are three, and each can fire alone', () => {
    // ⚠ A DISJUNCTION HAS TO BE PROVEN DISJUNCT: three views, each satisfying exactly one clause,
    // each true; and the view satisfying none, false. This is the case ARM 1 and ARM 2 both catch.
    const blind = settled({ tier: 'budget', confidence: 0, condition: 45, shownStamina: 55 })
    expect(knockNeedsTheParent(settled(), true, 'clear'), 'repeat only').toBe(true)
    expect(knockNeedsTheParent(settled(), false, 'warn'), 'warn only').toBe(true)
    expect(knockNeedsTheParent(blind, false, 'clear'), 'doubt only').toBe(true)
    expect(knockNeedsTheParent(settled(), false, 'clear'), 'none of the three').toBe(false)
  })

  it('PURE AND DRAW-FREE: same inputs, same answer, and it reads nothing but its arguments', () => {
    for (let i = 0; i < 50; i++) {
      expect(knockNeedsTheParent(settled(), false, 'warn')).toBe(true)
      expect(knockNeedsTheParent(settled(), false, 'clear')).toBe(false)
    }
  })
})

// =================================================================================================
// 2. WIRED – the tick really routes on it
// =================================================================================================
//
// ⚠ A PREDICATE THE ENGINE DOES NOT CALL IS A UNIT TEST OF NOTHING. These cases plant a knock on a
// real world and run `coachDecidesKnock`, the function `rollKnock` calls inside the tick.

/** Walk a real career to a settled coach, then hand back the world for planting.
 *
 *  ⚠ SHE HAS TO COMPETE, and finding that out is worth recording. A career that only trains gives the
 *  radar no EVIDENCE on the stamina axis, so even an Elite coach sits at confidence 0.457 after 120
 *  weeks – and at that confidence `coachEscalates(view, true)` is true at every condition from 25 to
 *  100 (measured: «NONE» silent), because a repeat triples the margin to ~55 strain points. A world
 *  in which the OLD rule already escalates everything cannot demonstrate a NEW rule. Entering events
 *  is what closes the fog. */
function settledCareer(seed: string, weeks = 156): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: 'elite' })
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

describe('T16 – wired into the tick', () => {
  it('⚠ THE NEGATIVE: an ordinary knock at the default coach still never asks the parent', () => {
    // ⚠⚠ THE CASE THAT KEEPS THE WHOLE STEP HONEST. «You are buying your attention back» is the
    // product (coachLoad.ts §"WHEN HE BRINGS IT TO THE PARENT ANYWAY"); a repair that routed
    // EVERYTHING to the parent would have deleted it. No repeat, a clear week, a settled coach.
    const world = settledCareer('t16-ordinary')
    expect(medicalClearance(90), 'the premise: 90 is a clear week').toBe('clear')
    const view = coachLoadViewOf({ ...world, condition: 90 } as WorldState)
    expect(coachEscalates(view, false), 'the premise: he is not in two minds').toBe(false)
    const { asked, choice, said } = plant(world, false, 90)
    expect(asked, 'the coach takes this one himself').toBe(false)
    expect(choice, 'and he answers it').toBe(coachKnockCall(view, false))
    expect(said, 'in his own voice').toMatch(/The coach is (keeping her off|happy for her)/)
  })

  it('⚠ WIRED: a repeat reaches the parent through the tick', () => {
    // ⚠ THE CONDITION IS SEARCHED FOR RATHER THAN GUESSED, and the search is the premise. A repeat
    // adds STRAIN_PER_REPEAT (22) and triples the doubt margin (REPEAT_DOUBT), so most conditions on
    // a real career ARE inside the old zone – and a case planted at one of those would prove nothing
    // about T16. This finds a clear week where the coach is decidedly NOT in two minds, and fails
    // loudly if no such week exists rather than quietly measuring the old mechanism.
    const world = settledCareer('t16-ordinary')
    let picked = -1
    for (let c = 100; c >= 60; c--) {
      if (medicalClearance(c) !== 'clear') continue
      if (coachEscalates(coachLoadViewOf({ ...world, condition: c } as WorldState), true)) continue
      picked = c
      break
    }
    expect(picked, 'the premise: a week where the doubt zone is silent on a repeat').toBeGreaterThan(0)
    const { asked, choice } = plant(world, true, picked)
    expect(asked, 'the dialog opens').toBe(true)
    expect(choice, 'and nobody answered for him').toBe(null)
  })

  it("⚠ WIRED: a 'warn' week reaches the parent through the tick", () => {
    const world = settledCareer('t16-ordinary')
    const warn = ECONOMY.availability.medicalWarningCeiling - 1
    expect(medicalClearance(warn), 'the premise: this IS the warning band').toBe('warn')
    const view = coachLoadViewOf({ ...world, condition: warn } as WorldState)
    expect(coachEscalates(view, false), 'the premise: the doubt zone is NOT what did it').toBe(false)
    const { asked, choice } = plant(world, false, warn)
    expect(asked, 'the dialog opens').toBe(true)
    expect(choice).toBe(null)
  })

  it('⚠ NO NEW COPY, AND NO SHIPPED SENTENCE CHANGED THE SITUATION IT DESCRIBES', () => {
    // Invariant 4. Two lines exist and T16 writes no third. The key moved from `k.repeat` to «is he
    // actually in two minds», which leaves every PRE-T16 pairing exactly where it was:
    //   · a repeat -> «wants to talk», as before;
    //   · a non-repeat the DOUBT ZONE raised -> «in two minds», as before;
    //   · the two NEW classes -> «wants to talk», which claims only the ACT and is therefore honest
    //     for a risk week, where «in two minds» would be a claim about him the mechanism cannot back.
    const settledW = settledCareer('t16-ordinary')
    expect(plant(settledW, true, 100).said).toBe(
      'The coach wants to talk about her shoulder before anyone decides.',
    )
    const warn = ECONOMY.availability.medicalWarningCeiling - 1
    expect(plant(settledCareer('t16-ordinary'), false, warn).said).toBe(
      'The coach wants to talk about her shoulder before anyone decides.',
    )
    // ...and the doubt zone keeps its own sentence. A green, young, cheap coach is the blurry one.
    const blind = createWorld('t16-blind', { ...DEFAULT_PROFILE, coachTier: 'budget' })
    let saw = ''
    for (let c = 100; c >= 30 && saw === ''; c--) {
      const v = coachLoadViewOf({ ...blind, condition: c } as WorldState)
      if (!coachEscalates(v, false)) continue
      saw = plant(blind, false, c).said
    }
    expect(saw, 'the fixture has to reach a doubt-zone escalation').toBe(
      'The coach is in two minds about the shoulder – and is asking us.',
    )
  })
})

// =================================================================================================
// 3. ⭐ THE RATE – asserted in BOTH directions
// =================================================================================================

/** The same walk `tests/coach-load.test.ts` uses, counting who answered. */
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
      // PUSH, not rest: a rested knock never enters `pushedParts`, so an arm that always rests can
      // never produce class (a) at all and would measure half the step.
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

describe('T16 – the measured rate', () => {
  it('⭐ THE RATE MOVED – the parent is asked materially more often, and the coach still answers some', () => {
    // ⚠⚠ THE POSITIVE IS PROVEN FIRST AND THE FLOOR IS NOT A ROUND NUMBER SOMEBODY LIKED. Measured
    // on this grid at the shipped `middle` rung, eight seeds × 156 weeks of grinding: **51 taps of
    // 71 knocks**, against the pre-T16 rule's **13 of 74** on the same eight walks (ARM 1's own
    // output). The floor below is 40 – three times what the old predicate can reach and well under
    // what this one does, so it is a wall ARM 1 hits head-on and a rate a later re-tune can drift
    // inside without a spurious red.
    //
    // ⚠ AND THE CEILING IS THE OTHER HALF: «fewer interruptions» is half of what a rung SELLS, so
    // «the coach still answers the majority» is asserted beside it. ARM 2 (fire always) dies here.
    const seeds = ['t16-r0', 't16-r1', 't16-r2', 't16-r3', 't16-r4', 't16-r5', 't16-r6', 't16-r7']
    let taps = 0
    let handled = 0
    let knocks = 0
    for (const seed of seeds) {
      const r = walk(seed, DEFAULT_PROFILE.coachTier, 156)
      taps += r.taps
      handled += r.handled
      knocks += r.knocks
    }
    expect(DEFAULT_PROFILE.coachTier, 'the premise: the default career is HIRED').not.toBe('self')
    expect(knocks, 'the fixture must produce knocks').toBeGreaterThan(0)
    expect(taps, `the parent has to be asked: ${taps} of ${knocks}`).toBeGreaterThan(40)
    // ⚠ THE OTHER DIRECTION. ARM 2 (`knockNeedsTheParent` -> `return true`) dies on both of these:
    // the coach answers nothing and every knock becomes a tap. Stated as «some, and not all» rather
    // than «most», because MEASURED it is 20 of 71 – a push-everything career manufactures repeats
    // (T12: 60% of pushes are repeats) and class (a) is therefore the dominant one on this arm.
    expect(handled, `the coach must still answer some: ${handled} of ${knocks}`).toBeGreaterThan(0)
    expect(taps, 'and not all of them: the routing is not unconditional').toBeLessThan(knocks)
  })

  it('⚠ HIRING STILL MEANS SOMETHING – every hired rung is asked about FEWER of her knocks', () => {
    // The second thing the rung sells has to survive the repair, and this is the half of it T16 could
    // have destroyed outright: if the two new classes had swallowed the routing, every rung would tap
    // at the self-coached rate and «you are buying your attention back» would be a dead string.
    //
    // ⚠ ASSERTED PER KNOCK, NOT PER CAREER, and that is a T16 consequence rather than a preference.
    // With most knocks now escalating, an absolute tap count tracks how many knocks a seed produced –
    // `escal-budget` taps 3 of 4 against `escal-elite`'s 7 of 12, i.e. the ladder inverted on counts
    // and ran the right way on shares. The rung-by-rung comparison lives in `tests/coach-load.test.ts`
    // («the escalation ladder»), pooled over eight seeds; this case asserts only the floor that
    // hiring beats not hiring. ARM 2 (`return true`) dies here: every share becomes 1.
    // Measured on this fixture (3 seeds × 156 wks, pushing): self 28/28 · budget 20/23 · middle
    // 21/25 · high 21/24 · elite 19/26. Every hired rung keeps a handful, and elite keeps the most.
    const share = (tier: CoachTier) => {
      let taps = 0
      let knocks = 0
      for (const s of ['t16-ladder-0', 't16-ladder-1', 't16-ladder-2']) {
        const r = walk(s, tier, 156)
        taps += r.taps
        knocks += r.knocks
      }
      expect(knocks, `${tier}: the fixture must produce knocks`).toBeGreaterThan(0)
      return taps / knocks
    }
    const self = share('self')
    expect(self, 'a self-coached parent answers every one of them').toBe(1)
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      expect(share(tier), `${tier} must be asked about fewer than all of them`).toBeLessThan(self)
    }
  })
})
