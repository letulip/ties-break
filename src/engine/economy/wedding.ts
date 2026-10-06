// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/wedding.md#the-wedding-block

/** ⭐⭐⭐ v83 – THE WEDDING (wave 7; `docs/plans/life-wave-7-builder-2026-09.md` §2 T2–T4, the
 *  design `docs/plans/the-wedding-and-the-children.md` §1). One block, every number the wave
 *  spends, each row naming the task that reads it.
 *
 *  ⚠⚠ wedding: EVERY NUMBER BELOW IS A DRAFT FOR THE BENCH AND NONE IS RULED
 *  ⚠ wedding: THE ONE EXCEPTION IS `ageGate`, WHICH IS RULED AND NOT A DRAFT.
 *  ⚠ wedding: NO CENTS ANYWHERE EXCEPT `spouseViewSpendCents`
 *  → docs/notes/economy/wedding.md#wedding
 */
export const wedding = {
  /** ⭐ THE AGE GATE – RULED 11.09, art-driven and his own word («свадьба на 23+ – мне вполне
   *  ок»), superseding 23.08's 22+: the `adult` portrait set is where the bride art lives. The
   *  gate sits IN THE HAZARD, never the UI, and it reads `kidAgeExact` – the fractional age, the
   *  `life.ageGate` reading – so a girl turns eligible the week she turns 23. */
  ageGate: 23,
  /** ⭐ THE DEPTH THRESHOLD, in weeks since `sinceWeek` – the episode must be DEEP before she
   *  would marry into it, and depth is DERIVED from the row's own age (no new state). Drafted 52
   *  (the brief's own figure): a year together. ⚠ Both trajectories must reach it honestly – the
   *  one-long girl latches her old episode, the several-short girl a late one – and T8's census
   *  proves BOTH populations exist; a trajectory that cannot marry is a finding, not a shrug. */
  minEpisodeWeeks: 52,
  /** ⚠⚠ THE WEEKLY HAZARD ON AN ELIGIBLE WEEK, and it is the BUILDER'S OWN DRAFT – the one number
   *  in this block the brief did not draft, flagged here so nobody mistakes it for the
   *  architect's. Sized against the proposed census corridor by arithmetic, not measurement:
   *  45–70% latched by 30 over the ~150–250 eligible weeks a typical 23+ career holds wants
   *  p ≈ 0.004–0.008, and 0.006 sits in the middle. One uniform on `seed:life:wedding:<week>`
   *  (never MAIN), an ineligible week takes ZERO draws, and T8 measures what this figure actually
   *  produces before anybody believes it. */
  perWeek: 0.006,
  /** ⭐ THE PARENT'S THREE ANSWERS AT THE `'engaged'` BEAT – the research digest's own triple
   *  (bless / keep distance / oppose), priced on `bond` through the existing `answerLifeBeat`
   *  seam exactly as every other beat's answers are. Drafted +2.5 / −1 / −4 (the brief's own
   *  figures), corridors benched in T8, his word after the numbers.
   *  ⚠ NO ZERO AMONG THEM, deliberately – the layer's second no-free-answer kind after
   *  `'ended'`: a wedding announcement is not a card a parent can answer without it meaning
   *  something. `DRAIN_ANSWER['engaged']` is `distance`, whose −1 is the same −1 under every
   *  reading (no overlay exists for this kind), so the harnesses can state their skew exactly. */
  blessBond: 2.5,
  distanceBond: -1,
  opposeBond: -4,
  /** ⭐ THE WEDDING LANDS THIS MANY WEEKS AFTER THE BEAT IS ANSWERED – any answer, opposing does
   *  not stop it: SHE decided, and what opposing bought is the bond price and the diary's memory.
   *  Drafted 8. T3 is the reader (`landWedding`). */
  weeksAfterEngagement: 8,
  // ⚠ `costCents` (drafted $12,000) RULED OUT 18.09 – Q-1 answered in his own words: «я думаю как
  // с подарками, никто и нисколько» – like the gifts, nobody pays and nothing. What the drafted
  // charge weighed while the tree carried it: docs/specs/the-wedding-2026-09.md §3c.
  /** ⭐ WHAT MARRIAGE DOES TO THE ENDING HAZARD – wave-4's multiplier × this, on a latched
   *  episode only, applied at `rollEnds`' one seam (T4). Drafted 0.15: marriage steadies the
   *  slot, which is its whole mechanical meaning at W1. ⚠ NOT ZERO, deliberately – a latched
   *  episode ending through the OLD hazard stays possible and rare, the divorce door the schema
   *  pre-paid, and T8's bench REPORTS its frequency rather than hiding it. */
  latchEndFactor: 0.15,
  /** ⭐ THE SPOUSE'S OPINION SURFACE (T5) – at most one `'spouse-view'` beat per this many weeks,
   *  counted off the `lifeLog` itself (the row is the counter, `smallTalkThisSeason`'s doctrine –
   *  no new state). Drafted 10 (the brief's own figure): up to ~5 a season while the marriage
   *  stands, and in play fewer, because the beat also needs a TRUE occasion and a free soft
   *  surface. T8's bench measures the realised rate. */
  spouseViewCooldownWeeks: 10,
  /** ⭐ ROUND 46 #15 – HE DOES NOT RAISE THE SAME WORRY TWICE INSIDE THIS MANY WEEKS (owner, 05.10:
   *  «он очень разговорчивый и часто повторяется»). The memory is the `lifeLog` itself, the cooldown's
   *  own doctrine: every `'spouse-view'` row carries its occasion as `detail` and the log is never
   *  pruned, so «what he said lately» is DERIVED and the save schema does not move. 52 = one season –
   *  the lines are about the season («the next tournament», «a whole season»), so a season is the
   *  longest a worry can wait before it is news again. ⚠ IT BRAKES THE CADENCE TOO, BY CONSTRUCTION: a
   *  week whose only true occasions he has just said raises nothing. The bench had measured 5.13 per
   *  latched season against the cooldown's 5.2 ceiling – the deterministic occasions refilled every
   *  slot with the same two or three lines. Predicted vs measured: docs/specs/the-wedding-2026-09.md. */
  spouseViewNoRepeatWeeks: 52,
  /** ⭐ THE `'money'` OCCASION'S «LARGE» LINE, in cents – the ONE money fact the surface reads
   *  (brief T5's own boundary: «beats about money, never accounting»). A financeWeeks category
   *  at or under −this inside the marriage's own trailing window counts as a spend the spouse
   *  would mention. Drafted $2,500 – above a season's routine weekly bills, under the wedding's
   *  own $12,000 – and it is the BUILDER'S OWN DRAFT (the brief drafted no figure), flagged so
   *  nobody mistakes it for the architect's. Benched in T8 with the rest of the block. */
  spouseViewSpendCents: 250000,
  /** ⭐ THE PARENT'S THREE ANSWERS AT A `'spouse-view'` BEAT, priced SMALL on `bond` through the
   *  existing `answerLifeBeat` seam – the brief's ±0.5..±1.5 corridor, the exact figures the
   *  BUILDER'S OWN DRAFT within it, flagged. Hearing the spouse out reaches her as care (+1);
   *  «the season is what it is» is a small honest friction (−0.5); waving the concern off is a
   *  dismissal of the person she chose (−1.5). ⚠ NO ZERO among them – a word about her marriage
   *  is not free – and read-INDEPENDENT by construction: no overlay in `lifeBeatOptionsFor`
   *  names this kind, so `DRAIN_ANSWER['spouse-view']` (= `level`, −0.5, the mildest) drains at
   *  one statable number. Corridors benched in T8, his word after the numbers. */
  spouseViewHearBond: 1,
  spouseViewLevelBond: -0.5,
  spouseViewBrushBond: -1.5,
} as const
