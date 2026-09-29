// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/spirit.md#the-spirit-block

// ⚠⚠ TYPE-ONLY FOR THE IDENTICAL REASON, and it buys the identical thing one mechanic over: `shock`
// below is `Record<SpiritShockKind, … | null>` and therefore TOTAL, so the day step 8's kind joins the
// union `vue-tsc` names the missing band instead of letting a shock ship priced at `undefined` – which
// would poison `accrueSpirit`'s weekly sum with `NaN` exactly as an unpriced exposure would.
// ⚠ `PregnancyState` JOINS IT IN v85 T4 FOR THE IDENTICAL REASON, one mechanic further on:
// `postpartumSupportScale` below is `Record<NonNullable<PregnancyState['support']>, number>` and
// therefore TOTAL, so the day a fourth answer grade joins that union `vue-tsc` names the missing
// factor instead of letting a grade ship multiplying the postpartum band by `undefined`.
import type { PregnancyState, SpiritShockKind } from '../world/state'

// ⭐⭐ THE PRIVATE LIFE'S TWO NUMBERS (wave 1) – docs/specs/who-she-is-2026-09.md §4 is the
// source of truth for every value below, and docs/plans/the-private-life-build.md §§1b/1d is
// where each one is argued. `spirit` is the WEATHER (how she is this week) and `bond` is the
// STANDING (what the parent has built with her); neither is ever shown as a number on any
// surface – the fog rule. ⚠ THEY LIVE HERE AND NOT IN `engine/spirit.ts` FOR THE REASON…
// → docs/notes/economy/spirit.md#spirit
export const spirit = {
  /** Where she sits when nothing is happening to her, what a career starts at, and what every
   *  week's return step walks back toward. */
  baseline: 70,
  min: 0,
  max: 100,
  /** ⚠ THE KNEE IS 60 AND THE START IS 70, so a fresh career – and every migrated one – reads
   *  factor 1.0 and plays byte-identical tennis until something actually moves her. Same shape as
   *  `condition.matchStrengthKnee`; see `spiritMatchFactor`. */
  knee: 60,
  /** The worst the curve can be, at spirit 0 – and it is DELIBERATELY far gentler than condition's
   *  0.55 floor. The design's bound is «smaller than fatigue» at every point of the curve, and
   *  0.90 vs 0.55 is that bound made arithmetic rather than promised. */
  floor: 0.9,
  /** THE RETURN TOWARD BASELINE, per week, by the INTENSITY axis of her temperament (who-she-is §4:
   *  5 steady / 3 intense – the flat 4 of the 23.08 draft is superseded). A steady girl is back to
   *  herself faster; an intense one holds a feeling longer. */
  returnPerWeek: { steady: 5, intense: 3 },
  /** ...and the same axis scales how hard the week LANDS on her – «она ярче во всём». Every row of
   *  `perturb` below is multiplied by this before it is applied. */
  perturbationScale: { steady: 0.8, intense: 1.25 },
  /** THE WEEK'S OWN EVENTS (build plan §1b, verbatim), BEFORE the intensity scale. Existing world
   *  facts only – no life events yet, that is wave 2's. ⚠ Deliberately absent and named so nobody
   *  adds them by accident: match results (form's channel, parked) and training load (condition's
   *  channel). */
  perturb: {
    injuryOnset: -8,
    laidUpWeek: -1,
    knockPushedWeek: -2,
    vacationResolved: 5,
    birthdayWeek: 2,
    hardExamWeek: -2,
    seasonWithNoVacation: -3,
    blackoutWeek: 1,
    /** ⭐⭐⭐ W5/T2 – THE WEEK THE FAMILY IS ON THE ROAD AND A SMALL CHILD IS AT HOME. His ruling of
     *  21.09 chose the SPIRIT shape over the money one: a fare is something she already pays and
     *  would have read as a tax, while a week away belongs to the layer that prices weeks.
     *
     *  ⚠ DRAFTED, NOT RULED. −2 puts it between the knock she played through (−2) and the season
     *  that ended with no family week (−3), which is the company it keeps: a real weekly cost
     *  that no single week decides a career over. Benched in T7.
     *
     *  ⚠ IT IS SCALED BY TEMPERAMENT FOR FREE (`perturbationScale` above, this block's own law),
     *  so an `intense` mother feels the road more than a `quiet` one without a second constant –
     *  the property that made this the right home rather than a new weekly pass. */
    awayFromSmallChild: -2,
  },
  /** The exam row's own gate: an exam week only costs her when the plan is still grinding through
   *  it (`plan.train >= 85`, which is the `grind` preset). A light exam fortnight costs nothing. */
  examTrainFloor: 85,
  /** ⭐⭐ THE EFFECTIVE BASELINE'S LIFT – `accrueSpirit`'s weekly return walks toward `baseline +
   *  this` while the attachment slot is full (§1b). WIRED BY WAVE 3's T4 (11.09), and the note it
   *  replaces is worth keeping in one line because it was the point: this was DECLARED IN WAVE 1
   *  AND READ BY NOBODY, deliberately, because the slot did not exist yet – written down early so
   *  that the number stayed HIS and the wave that built the slot could not invent it.
   *
   *  ⚠ spirit.attachmentLift: IT IS A TARGET AND NOT A BUMP, which is the whole of «lifts a little and stays lifted»…
   *  ⚠ spirit.attachmentLift: AND IT STAYS IN `spirit` RATHER THAN MOVING TO `life` BELOW.
   *  ⚠ spirit.attachmentLift: THE READER IS PINNED, NOT JUST THE VALUE.
   *  → docs/notes/economy/spirit.md#spiritattachmentlift
   */
  attachmentLift: 5,
  /** ⭐⭐⭐ v75 (the private life, wave 4 – T3) – WHAT AN ENDING COSTS HER, in points of spirit, by
   *  the INTENSITY axis (who-she-is §4's spirit-physics table, verbatim: «break-up shock −22 /
   *  −34»). Keyed by `spiritShock['kind']` so the kinds the build plan's steps 7–8 add land as
   *  siblings in this record rather than as a second table; `'breakup'` is wave 4's and the only
   *  one today.
   *
   *  ⚠⚠ spirit.shock: THESE TWO NUMBERS ARE **ALREADY INTENSITY-SCALED**, SO THEY GO IN **AFTER** THE SCALE AND NEVER THROUGH `perturb`
   *  ⚠ spirit.shock: −34 AND NEVER THE DERIVED −34.375: §4's own two numbers win on drift (the single-source rule)…
   *  ⚠ spirit.shock: AND IT IS A ONE-WEEK EVENT WITH NO RECOVERY CURVE ANYWHERE BEHIND IT.
   *  ⚠⚠ spirit.shock: **WHY −36 AND NOT −35, WHICH IS THE ARITHMETIC MINIMUM.** The floor needs `warm` to reach the break-up's 4 and 10…
   *  ⚠⚠ spirit.shock: THE SHAPE IS `breakup`'s, ONE BASE SEEN THROUGH `perturbationScale`
   *  ⚠ spirit.shock: BOTH PRODUCTS SHIP EXACTLY, which is where this parts from `breakup` above rather than contradicting it…
   *  ⚠⚠ spirit.shock: WHY A BIRTH SITS ABOVE A BREAK-UP ON THE SAME AXIS AT ALL
   *  ⚠ spirit.shock: The paragraph is kept in its original terms…
   *  ⚠ spirit.shock: THE OLD PARAGRAPH'S LAST SENTENCE IS GONE AND IS NAMED HERE SO THE CHANGE IS NOT SILENT
   *  ⚠ spirit.shock: NO SECOND CURVE AND NO RECOVERY TERM
   *  ⚠⚠ spirit.shock: THE ORDER IS THE DESIGN AND IT IS STATED IN THE SPEC
   *  ⚠⚠ spirit.shock: AND NEITHER BRINGS A SECOND RECOVERY RATE
   *  ⚠ spirit.shock: THEY ARE ALREADY INTENSITY-SCALED, `breakup`'s
   *  ⚠ spirit.shock: AND `postpartumSupportScale` DOES NOT TOUCH THEM
   *  ⚠ spirit.shock: BOTH ARE THE BUILDER'S DRAFTS and are flagged here exactly as `perWeekByAge` and `postpartumSupportScale` are…
   *  ⚠ spirit.shock: BOTH PRODUCTS LAND ON THE METER'S GRID
   *  ⚠ spirit.shock: The steady/intense pair is written out rather than derived from a base for `breakup`'s own single-source reason…
   *  → docs/notes/economy/spirit.md#spiritshock
   */
  shock: {
    breakup: { steady: -22, intense: -34 },
    postpartum: { steady: -28.8, intense: -45 },
    loss: { steady: -26, intense: -40 },
    bereavement: { steady: -30, intense: -46 },
    /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – THE MARRIAGE ENDING'S OWN ROW. ⚠ ⚠ **DRAFT** – the
     *  spec (`docs/specs/the-parting-2026-09.md` §3) drafts these two numbers and says in as many
     *  words that his word replaces them at review. Flagged exactly as `motherhood.perWeekByAge`
     *  and `wedding.perWeek` are, and benched in T6.
     *
     *  ⚠⚠ spirit.shock.divorce: THE ORDERING IS THE WHOLE CLAIM AND THE MAGNITUDES ARE THE DRAFT.
     *  ⚠ spirit.shock.divorce: AND THE SPACING IS NOT UNIFORM ON PURPOSE.
     *  ⚠ spirit.shock.divorce: NO PER-KIND RECOVERY RATE, and `engine/spirit.ts`'s refusal is older than this member and binds it…
     *  → docs/notes/economy/spirit.md#spiritshockdivorce
     */
    divorce: { steady: -27, intense: -42 },
  } satisfies Record<
    SpiritShockKind,
    { steady: number; intense: number } | null
  >,
  /** ⭐⭐⭐ v85 T4 – **WHERE `support` ENTERS THE RECOVERY**, and it is the whole of the wave's
   *  «support speeds recovery; pressure → depression risk ↑» (the digest's own row for the
   *  return).
   *
   *  ⚠⚠ spirit.postpartumSupportScale: THE MAGNITUDE AND NOT THE SLOPE, AND THE FILE THAT OWNS THE RECOVERY IS WHAT DECIDES IT.
   *  ⚠⚠ spirit.postpartumSupportScale: AND THE MECHANICAL ARGUMENT IS THE DECIDING ONE
   *  ⚠ spirit.postpartumSupportScale: AND NOT THE CLEAR THRESHOLD, THE THIRD CANDIDATE
   *  ⚠ spirit.postpartumSupportScale: THE COLLISION WITH `perturbationScale`'s 0.8 / 1.25 IS THE RECIPROCAL PAIR TURNING UP TWICE AND NOT…
   *  ⚠ spirit.postpartumSupportScale: A `null` GRADE READS 1.0 AND THAT IS A PROBE-WORLD COURTESY, not a fourth cell
   *  → docs/notes/economy/spirit.md#spiritpostpartumsupportscale
   */
  postpartumSupportScale: { warm: 0.8, measured: 1, cold: 1.25 } satisfies Record<
    NonNullable<PregnancyState['support']>,
    number
  >,
  /** ⭐⭐ HOW CLOSE TO HER OWN BASELINE COUNTS AS BACK – the gap `accrueSpirit`'s tail clears
   *  `world.spiritShock` at (the build plan §5 step 4: «clears when spirit ≥ baseline − 2», i.e.
   *  **68**).
   *
   *  ⚠⚠ spirit.shockClearWithin: IT IS SUBTRACTED FROM THE PLAIN `baseline` AND NEVER FROM THE EFFECTIVE ONE
   *  ⚠ spirit.shockClearWithin: NAMED RATHER THAN INLINED because this module's own law is that `engine/spirit.ts` invents no number…
   *  → docs/notes/economy/spirit.md#spiritshockclearwithin
   */
  shockClearWithin: 2,
  /** ⭐⭐ THE MOOD LADDER'S FOUR CUT POINTS – RULED 09.09, and every one of them is anchored to a
   *  MECHANICAL FACT rather than to taste.
   *
   *  ⚠ spirit.mood: THE ≥ 2% OCCUPANCY BAR DOES NOT PASS IN WAVE 1 AND THAT IS THE RULED OUTCOME, not a defect
   *  ⚠ spirit.mood: The «lands at 41» in `docs/plans/wave-1-the-two-numbers-runbook-2026-09.md` §6 WAS annotated after all…
   *  ⚠ spirit.mood: These are not tuning dials: a test that would be easier with other numbers is a test to rewrite, not a ladder to move.
   *  → docs/notes/economy/spirit.md#spiritmood
   */
  mood: {
    /** ⭐ THE KNEE ITSELF – below this `spiritMatchFactor` stops being 1.0 and the match starts
     *  reading her. It is already the approved doc's own gloss for «Heavy» («the weeks under the
     *  knee, where the match factor starts reading her»), so the word and the number agree by
     *  construction rather than by agreement. Kept equal to `knee` above by the pin in
     *  tests/spirit.test.ts – if one moves the other has to be argued. */
    heavyBelow: 60,
    /** Below baseline by more than half a week's return (70 − 5/2 = 67.5). */
    dimmedBelow: 67.5,
    /** ⭐ BASELINE + HALF A STEADY WEEK'S RETURN (70 + 5/2 = 72.5) – the other side of the same
     *  cut `dimmedBelow` makes. Inside `[dimmedBelow, brightFrom)` she is less than half a week of
     *  coming back from herself, which is not worth a word: «her ordinary state – nothing pressing
     *  in either direction», as arithmetic. It is where wave 3's attachment lift (+5 on a baseline
     *  of 75) will sit her, so the word she wears while someone is in her life is decided here. */
    brightFrom: 72.5,
    /** The top of the range – rare by design, as the approved doc says of «Glowing». */
    glowingFrom: 80,
  },
} as const
