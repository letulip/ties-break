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
 *  `npm run bench:load`. */
export const ESCALATE_CAUTION = 3.5

/** ...and how much further a REPEAT widens it.
 *
 *  ⚠ THE FIRST DRAFT MADE A REPEAT ESCALATE UNCONDITIONALLY, at every rung, on the argument that "the
 *  parent is entitled to be asked before somebody gambles the same joint twice". That reads well and it
 *  is what flattened the ladder: repeats are tier-independent, they are ~40% of escalations, and an
 *  unconditional rule means the Elite coach interrupts you about the shoulder exactly as often as the
 *  Budget one. But being asked about the shoulder IS the burden you are paying him to carry. So a repeat
 *  now widens his doubt - a big widening, because knock.ts prices the repeat at KNOCK_REPEAT_TAU 3.0
 *  against 2.2 and it genuinely is a harder call - and a coach who knows her well still handles it. */
export const REPEAT_DOUBT = 3

/** Does he bring this one to the parent instead of deciding it? */
export function coachEscalates(view: CoachLoadView, repeat: boolean): boolean {
  const doubt = ESCALATE_BAND_MAX * (1 - Math.max(0, Math.min(1, view.confidence)))
  const margin = doubt * ESCALATE_CAUTION * (repeat ? REPEAT_DOUBT : 1)
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
