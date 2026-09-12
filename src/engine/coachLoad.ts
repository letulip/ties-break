// THE COACH AS LOAD MANAGER – who holds the load decisions, and how well.
//
// docs/specs/coach-as-load-manager.md is the design; §8 is the mechanism and this file is it. The owner,
// 30.07: «тогда у нашего self coach появятся ручки, чтобы он ощутил каково это быть тренером. А
// остальные будут с автонастройкой и эффективностью зависимо от тира напрямую.»
//
// =================================================================================================
// WHAT THE SLICE ACTUALLY CHANGES, WHICH IS LESS THAN IT SOUNDS
// =================================================================================================
//
// Nothing here invents a mechanic. Every consequence is paid into a system that is already tuned:
// resting a knock costs KNOCK_REST_GROWTH, pushing one multiplies `injuryTau`, entering a tournament
// under `minConditionToEnter` is already a caution the player may ignore. What moves is WHO DECIDES:
//
//   self-coached   the parent decides, every time, and the week stops to ask him (W4's dialog).
//   hired          the coach decides the knock himself - the dialog does not appear - and he has an
//                  opinion about entries the parent may still ignore.
//
// THAT IS THE PRODUCT, and it is the spec's own sentence: you are buying your attention back. A parent
// with a job cannot be at the court every day, so he pays somebody to make those calls.
//
// ⚠ AND THE EVENT MUST NOT VANISH WITH THE DIALOG. W4 exists because the owner complained that training
// weeks «просто скипались»; a slice that deletes the prompt for four of five rungs would hand that
// complaint straight back, dressed as a feature. So the knock still HAPPENS, still costs, and still
// gets its week in the story - the coach's call arrives as a line in the diary and a row in the feed
// instead of as a question. He finds out what was decided about his daughter; he just does not have to
// be the one deciding.
//
// =================================================================================================
// ⚠ HOW "QUALITY BY RUNG" IS MODELLED, AND THE ONE IMPLEMENTATION THAT WAS REJECTED
// =================================================================================================
//
// REJECTED - A HIDDEN ORACLE. The injury roll is deterministic given the seed, so a coach COULD be made
// to know whether pushing this knock actually breaks her, and be right N% of the time by rung. That is
// the obvious implementation and it must never ship: foreknowledge makes the rung a dice-loader rather
// than a judgement, and there is no in-world story for how he knows.
//
// CHOSEN - HE DECIDES ON WHAT HE CAN SEE, AND THE FOG IS HOW MUCH HE CAN SEE. One rule, over observable
// state only. What the rung changes is the PRECISION OF HIS INPUTS: he reads her robustness through
// `shownSkill(view, 'stamina', …)`, the radar's own estimate, which is her true stamina displaced by his
// rung's haze. Measured, before this slice existed: a self-coached career ends at fog band 3.7 against
// Elite's 0.2 - an eighteen-fold difference in how well anyone knows this girl.
//
// ⚠ AND THE ERROR RUNS IN BOTH DIRECTIONS, WHICH IS THE PART THAT MAKES IT A MODEL OF IGNORANCE RATHER
// THAN A PENALTY. The radar's misread is ONE DRAW PER CAREER with a FIXED SIGN: a given cheap coach
// either thinks this girl is tougher than she is, for her whole career, or thinks she is frailer. So
//   * the ones reading HIGH push knocks they should have rested  -> more injuries, more lost weeks;
//   * the ones reading LOW rest knocks they could have pushed    -> fewer injuries, less development.
// Neither is "the bad outcome"; both are wrong, and a rung that cannot tell the marginal cases apart
// necessarily makes both mistakes. Across a seed sweep that shows up as a cheap rung having MORE
// injuries AND more rested weeks than an expensive one, which is the honest signature of low
// information. A single-signed penalty would have been a tax pretending to be a model.
//
// AND IT READS AS A PERSON. A coach with a fixed wrong idea about your daughter is exactly what a
// mediocre coach is. The sign being per-career, not per-week, is what makes him a character instead of
// a random number: hire him twice for the same girl and he is wrong the same way both times.
//
// PURE, WORLD-FREE, ZERO DRAWS OF ITS OWN. Everything arrives as a narrow `CoachLoadView`; the single
// draw behind `shownStamina` is the radar's own per-career one, taken by the caller. Same dependency
// shape as knock.ts, diary.ts, kidLife.ts and radar.ts - world.ts imports this, never the reverse.

import type { CoachTier, KnockChoice } from '../shared/protocol'

/** Does this rung take the load decisions over? Every hired rung does; the parent keeps them only when
 *  there is nobody to hand them to.
 *
 *  ⚠ THE SAME SHAPE `coachIncludesPhysio` HAS, and deliberately so: "hired or not" is the one
 *  distinction the coach ladder has ever drawn about her body, and this slice does not add a second
 *  boolean with a different cut. What the rungs differ in is `shownStamina`, not this. */
export function coachManagesLoad(tier: CoachTier): boolean {
  return tier !== 'self'
}

// =================================================================================================
// THE KNOBS
// =================================================================================================
//
// All four are in STAMINA POINTS, i.e. the same units as the thing they are compared against, so the
// rule below reads as one sentence: "how much strain is she carrying, against how much he thinks she
// can take". Keeping them commensurable is what makes the fog's ±12 points of misread MEAN something -
// a misread that could not move the comparison would have been decoration.

/** Fatigue's weight in the strain total. 1.0 = one point of condition lost is one point of strain, so a
 *  girl at condition 60 carries 40 points of it. The dominant term, and rightly: it is the one input
 *  BOTH coaches see exactly (the condition bar is not fogged), so the disagreement between rungs is
 *  always about the margin, never about whether she is tired. */
export const STRAIN_PER_FATIGUE = 1.0
/** ...plus this per consecutive week of competition. `playedWeeksInTrailing4` is the engine's own
 *  measure and already drives `consecutivePlayFactor`, so this reads the same fact the injury model
 *  reads rather than inventing a second notion of "a lot of tennis lately". */
export const STRAIN_PER_PLAYED_WEEK = 4
/** ...plus this when the part has spoken before AND he pushed it then. knock.ts already prices the
 *  repeat at KNOCK_REPEAT_TAU 3.0 against the ordinary 2.2, i.e. a materially worse bet, and this is
 *  the coach noticing that. Large on purpose: the second time the same shoulder complains, a
 *  professional sits her down almost regardless of what else he believes. */
export const STRAIN_PER_REPEAT = 22
/**
 * How much of his believed robustness he is willing to spend before he rests her.
 *
 * ⚠ IT IS 1.0, WHICH MEANS THERE IS NO KNOB HERE AT ALL, and getting to that was the useful part. The
 * rule is simply "rest her when the strain she is carrying exceeds what he thinks she can carry" - one
 * sentence, no free parameter, and it is kept as a named constant only so the tests and the bench can
 * quote the same number the rule uses.
 *
 * I first set it to 0.80 with a paragraph of derivation, and the bench said the derivation was worthless.
 * MEASURED over 263 real knocks: strain/shownStamina at knock time runs 0.73 / 0.96 / 1.22 / 1.52 / 1.71
 * (p10..p90). At 0.80 the coach rests roughly 85% of knocks - which is not WRONG (his injuries come out
 * at 10.8 against a self-coached 15.1, so the mechanism works) but it is lopsided enough that a ±12
 * point misread of her stamina almost never flips a call, and all four hired rungs then behave
 * identically. 1.0 puts the threshold near the middle of the measured distribution, which is where a
 * binary decision is actually sensitive to what he believes.
 */
export const PUSH_TOLERANCE = 1.0

/** How far above the tier's own condition floor he wants her before he is happy about a trip. In
 *  CONDITION points, and the floors are 20 (local) to 55 (j300) - so this is a real margin at the
 *  bottom of the ladder and a modest one at the top, which is the right asymmetry: a local Sunday is
 *  worth playing tired, a J300 is not. */
export const ENTRY_MARGIN = 8

// =================================================================================================
// WHAT HE CAN SEE
// =================================================================================================

export interface CoachLoadView {
  tier: CoachTier
  /** HIS ESTIMATE of her stamina, 0..100 - `shownSkill(view, 'stamina', confidence)`. NOT her true
   *  value, and the difference is the whole mechanism. */
  shownStamina: number
  /** her condition, 0..100. EXACT, not fogged: the condition bar is a number the game shows the player
   *  outright, so a coach who could not see it would be blinder than the parent. */
  condition: number
  /** weeks of competition in the trailing four - `playedWeeksInTrailing4`. */
  playedWeeks: number
  /** HOW SURE HE IS of `shownStamina`, 0..1 - `axisConfidence` on the stamina axis. Drives escalation
   *  only (see `coachEscalates`); the CALL itself uses the estimate, not the confidence, because a coach
   *  acts on what he believes rather than on how strongly he believes it. */
  confidence: number
}

/** The strain she is carrying, in stamina points. Pure arithmetic over facts anyone can see. */
export function strainOf(view: CoachLoadView, repeat: boolean): number {
  return (
    (100 - view.condition) * STRAIN_PER_FATIGUE +
    view.playedWeeks * STRAIN_PER_PLAYED_WEEK +
    (repeat ? STRAIN_PER_REPEAT : 0)
  )
}

/**
 * REST OR PUSH, as the hired coach answers it. Deterministic, draw-free, and the ONLY place the rule
 * lives - the bench and the tests both call this rather than re-deriving it.
 *
 * `repeat` is the knock's own flag (knock.ts: "a statement about the RECORD"), which is a ledger fact
 * and therefore something he can see exactly.
 */
export function coachKnockCall(view: CoachLoadView, repeat: boolean): KnockChoice {
  return strainOf(view, repeat) >= view.shownStamina * PUSH_TOLERANCE ? 'rest' : 'push'
}

// =================================================================================================
// ⚠ WHEN HE BRINGS IT TO THE PARENT ANYWAY – the half that keeps W4 alive, and the second thing the
// rung turns out to sell
// =================================================================================================
//
// THE PROBLEM THIS SOLVES, FOUND BY THE TEST SUITE AND WORTH STATING PLAINLY. `DEFAULT_PROFILE.coachTier`
// is `'middle'`, so a brand-new career is HIRED. Route every knock to the coach and the default player
// never sees the dialog at all - which deletes the content W4 was built for. The owner's complaint that
// started W4 was that training weeks «просто скипались»; handing that back, dressed as automation, would
// be a worse outcome than not shipping the slice.
//
// AND THE FIX IS NOT TO WEAKEN THE ROUTING, because «остальные будут с автонастройкой» is exactly what
// the owner asked for. It is to notice that a real coach does not decide everything alone. He handles the
// routine Friday and he comes to you about the shoulder. So:
//
//   HE ESCALATES THE CALLS HE IS NOT SURE OF, and how sure he is depends on his rung.
//
// ⚠ WHICH MAKES "BUYING YOUR ATTENTION BACK" A MEASURABLE QUANTITY, and this is the good part. A cheap
// coach has a blurry read of her, so more of his calls fall in the zone where he wants the parent's
// say - he interrupts more. An expensive one is sure, and handles it. The ladder therefore sells TWO
// things at once, and the second was not in the spec:
//
//   * fewer weeks lost   (the coach decides better - §5's measurement)
//   * fewer interruptions (the coach decides ALONE more often - taps per career)
//
// That is a far truer model of what people actually buy when they hire a professional, and it costs one
// comparison. It also means the rung ladder is legible without reading a table: you can FEEL an Elite
// coach, because the game stops asking you things.
//
// A REPEAT WIDENS HIS DOUBT rather than forcing his hand - see REPEAT_DOUBT, and the first draft got
// this wrong in a way the bench caught.
//
// ⭐ AND SO DOES A `'warn'` CLEARANCE WEEK - see WARN_DOUBT. Two wideners, one shape, and the three
// rulings that produced that shape are written out below rather than summarised.

/** Half-width of the "I would rather you decided" zone at ZERO confidence, in STRAIN points.
 *
 *  ⚠ DERIVED, AND MY FIRST JUSTIFICATION FOR IT WAS WRONG. I wrote that it is "the same magnitude as
 *  `bandFor` because it is the same uncertainty" - it is not: `bandFor` is a half-width in STAMINA points
 *  and this is a zone in STRAIN points, which is a different axis with a different range (strain runs past
 *  100). The honest derivation is one step longer. His threshold is `shownStamina * PUSH_TOLERANCE`, and
 *  `shownStamina` is uncertain by ±`RADAR_BAND_MAX * (1 - confidence)`. So his uncertainty ABOUT THE
 *  THRESHOLD is that, times PUSH_TOLERANCE: 12 * 0.8 ≈ 9.6 at zero confidence. That is the number below,
 *  and it is arithmetic rather than taste. */
export const ESCALATE_BAND_MAX = 9.6

/** How much doubt he needs before he involves the parent, as a multiple of his own uncertainty.
 *
 *  1.0 would mean "escalate whenever the true answer might be the other one", which sounds right and is
 *  too timid to be a professional: at budget's mature confidence (0.80) his threshold uncertainty is
 *  ~1.9 strain points, and the bench showed the gap between strain and threshold sitting anywhere from
 *  0.7 to 27. A zone that narrow catches almost nothing, so escalation was driven ENTIRELY by the repeat
 *  rule and the tap counts came out flat across the whole ladder (9.5 / 9.1 / 9.1 / 9.1 - measured).
 *  This is the factor that makes his own read decide how often he asks. Tuned against
 *  `npm run bench:load`.
 *
 *  ⚠ 3.5 -> 4.5 ON T16b's BENCH (12.09), THE ONE STEP THE 12.09 RULING AUTHORISED AND THE ONLY THING
 *  ON THIS PAGE THAT MOVED BESIDES THE NEW WIDENER. `WARN_DOUBT` alone was not enough to reach the
 *  ruling's middle bar: the warning band is [15, 25) condition, so a warn week is RARE and it arrives
 *  carrying so much strain that at a confident coach the call is nowhere near his threshold anyway.
 *  MEASURED, the T12 pair at the shipped rung (`bench:spirit --push --coached --seeds=4`, asks per
 *  career, the bar being 3-5): 1.88 before T16 · 6.50 under T16 · **2.25 / 2.50** at CAUTION 3.5 with
 *  the widener · **3.50 / 4.00** at 4.5. The ladder pays nothing for it, because the zone this scales
 *  is already multiplied by `1 - confidence`: budget-to-elite tap share stayed at 4.2x. */
export const ESCALATE_CAUTION = 4.5

// =================================================================================================
// ⭐⭐⭐ THE TWO WIDENERS, AND THE THREE RULINGS THAT MADE THEM WIDENERS RATHER THAN OVERRIDES
// =================================================================================================
//
// ⚠⚠ THIS BLOCK IS THE FILE'S HISTORY LESSON AND IT IS KEPT WHOLE ON PURPOSE. The same idea - "some
// classes of knock are the parent's, whatever the rung" - was proposed, rejected, shipped, measured
// and withdrawn across three weeks, and the argument turned on ONE number each time. Whoever proposes
// it a fourth time should have to read all three rulings first.
//
//   23.08 - REJECTED (the first draft of this file). An unconditional repeat escalation, at every
//     rung, on the argument that "the parent is entitled to be asked before somebody gambles the same
//     joint twice". That reads well and it is what flattened the ladder: repeats are tier-independent,
//     they are ~40% of escalations, and an unconditional rule means the Elite coach interrupts you
//     about the shoulder exactly as often as the Budget one (9.5 / 9.1 / 9.1 / 9.1 taps - measured).
//     But BEING ASKED ABOUT THE SHOULDER IS THE BURDEN YOU ARE PAYING HIM TO CARRY. So a repeat
//     WIDENS his doubt instead - see REPEAT_DOUBT.
//
//   11.09 - OVERRIDDEN ANYWAY, on T12's measurement, and the owner ruled it («давай попробуем»). T12
//     had found the push-through price mostly not the parent's to pay: at every `coachManagesLoad`
//     rung the coach answered 232 of 280 knocks, so the parent met the dialog ~1.5 times a career
//     against 9.0 self-coached and `ECONOMY.bond.delta.knockPush` (−3) / `knockPushRepeatPart` (−5)
//     were nearly dead in normal play. T16 therefore put TWO DETERMINISTIC CLASSES beside this zone in
//     `world/knock.ts` - a repeated part, and a `'warn'` clearance week - routing both to the parent
//     at every rung. The 23.08 note was preserved beside it, and it was preserved because it was the
//     prediction: the classes are tier-independent in exactly the way the rejection describes.
//
//   12.09 - CORRECTED BY THE LADDER'S OWN NUMBER, which is the part worth keeping. T16's own
//     measurement overturned T16. Tap share pooled over 8 seeds × 208 weeks went
//     0.148 / 0.103 / 0.078 / 0.075 (budget→elite) to 0.716 / 0.684 / 0.692 / 0.662: a 2× budget-to-
//     elite span became 1.08×, and the Elite coach went from deciding 95% of knocks alone to 31%. The
//     attention-buying product died, and the owner's word on it was «мне это не очень нравится». So
//     the classes come out and `'warn'` becomes the SECOND WIDENER beside the repeat - the doubt zone
//     alone decides again, a warn week merely makes him three times readier to ask, and a warn-week
//     repeat compounds because both multipliers apply. The parent is asked more than T12 measured
//     WITHOUT the premium rungs paying for it, because a widener scales with `1 - confidence` and a
//     deterministic class does not.
//
// ⚠ WHAT THAT LEAVES AS THE STANDING RULE: escalation is the DOUBT ZONE and nothing else. Any future
// "this class always goes to the parent" proposal is the 23.08 draft again, and it costs the ladder
// again; the lever that does not is a widener.

/** ...and how much further a REPEAT widens it.
 *
 *  ⚠ A BIG WIDENING, because knock.ts prices the repeat at KNOCK_REPEAT_TAU 3.0 against 2.2 and it
 *  genuinely is a harder call - and a coach who knows her well still handles it. See the block above
 *  for why it is a widening rather than a rule. */
export const REPEAT_DOUBT = 3

/** ...and how much a `'warn'` CLEARANCE WEEK widens it. THE SECOND WIDENER (T16b, 12.09).
 *
 *  `medicalClearance` is the doctor's own three-way verdict (world/medical.ts, owner 26.07): inside
 *  [medicalFloor, medicalWarningCeiling) she plays and he warns the family. A knock arriving in that
 *  band is the week where the answer carries real risk - the played-hurt row's neighbourhood - so he
 *  is readier to ask, not obliged to. NOT `'withdraw'`: that is the doctor's veto and no knock answer
 *  survives it anyway, which is why the flag reaching this function is `clearance === 'warn'` and not
 *  "any bad clearance" (`world/knock.ts` `knockNeedsTheParent` is where the verdict becomes the flag).
 *
 *  ⚠ THE SAME MAGNITUDE AS `REPEAT_DOUBT` AND THAT IS A CLAIM, NOT A COPY: the two are the same size
 *  of harder call. A repeat is the record telling him; a warn week is the doctor telling him. DRAFTED
 *  at 3 for the bench out of 2.5-3 and MEASURED there against the three bars the 12.09 ruling set -
 *  ladder spread ≥ 1.6×, middle-rung asks 3-5 a career, Elite self-decide ≥ 85% - see
 *  docs/specs/who-she-is-2026-09.md §4a's T16b entry for what each setting produced. */
export const WARN_DOUBT = 3

/** Does he bring this one to the parent instead of deciding it?
 *
 *  ⚠ THE TWO WIDENERS MULTIPLY, so a repeat on a warn week compounds - `REPEAT_DOUBT * WARN_DOUBT`
 *  against his uncertainty, which is the widest this zone ever opens. That is deliberate: it is the
 *  hardest call the model can describe, and it is still HIS call when he is sure of her. */
export function coachEscalates(view: CoachLoadView, repeat: boolean, warn: boolean): boolean {
  const doubt = ESCALATE_BAND_MAX * (1 - Math.max(0, Math.min(1, view.confidence)))
  const margin = doubt * ESCALATE_CAUTION * (repeat ? REPEAT_DOUBT : 1) * (warn ? WARN_DOUBT : 1)
  const threshold = view.shownStamina * PUSH_TOLERANCE
  // ⚠ STRICTLY LESS THAN, so a zero-width zone escalates NOTHING. With `<=` a coach of perfect confidence
  // still passed up the call that landed exactly on his threshold - the one case where he is certain the
  // answer is a coin flip, which is not the same as being uncertain. A test caught it, and the fix is the
  // right semantics rather than a nudge: no doubt, no question.
  return Math.abs(strainOf(view, repeat) - threshold) < margin
}

/**
 * WOULD HE WARN AGAINST THIS TRIP? A soft opinion and never a block - "the parent may push" is a
 * standing rule of this game and the doctor's veto is its single exception, which this is not.
 *
 * ⚠ THE MARGIN IS SCALED BY HIS READ OF HER, which is how the fog reaches entries as well as knocks: a
 * coach who thinks she is tough (`shownStamina` high) effectively lowers the bar and waves her onto a
 * plane she should not be on. Divided by 50 rather than 100 so that a mid-career stamina (~53) lands
 * near 1.0 and the margin is roughly ENTRY_MARGIN for a normal girl - the scaling is a modulation, not
 * a doubling.
 */
export function coachWarnsEntry(view: CoachLoadView, tierFloor: number): boolean {
  const trust = view.shownStamina / 50
  return view.condition < tierFloor + ENTRY_MARGIN / Math.max(0.5, trust)
}
