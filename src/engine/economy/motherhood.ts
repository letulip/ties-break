// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/motherhood.md#the-motherhood-block

/** ⭐⭐⭐ v85 – THE PREGNANCY AND THE RETURN (wave 8; `docs/plans/life-wave-8-builder-2026-09.md`
 *  §2 T2–T6, the design `docs/plans/the-wedding-and-the-children.md` §5 W3+W4).
 *  `ECONOMY.wedding`'s block one wave on and in its voice: one block, every number the wave
 *  spends, each row naming the task that reads it.
 *
 *  ⚠ motherhood: WITH **TWO** EXCEPTIONS, NAMED HERE SO THE SENTENCE ABOVE STAYS HONEST
 *  ⚠⚠ motherhood: EVERY NUMBER BELOW IS A DRAFT FOR THE BENCH AND NONE IS RULED
 *  ⚠ motherhood: NO CENTS ANYWHERE IN THIS BLOCK
 *  owner (motherhood), 20.09: «а на чем основана цифра?»
 *  ⚠ motherhood: THE CORRIDOR IS HIS AND IS NOT THE CURVE'S TO BEND
 *  ⚠⚠ motherhood: THE SHAPE OF THE CURVE IS THE **BUILDER'S OWN DRAFT**
 *  ⚠ motherhood: THE REALISED FIGURE WILL SIT UNDER EVERY NUMBER ABOVE, and the reasons are all real
 *  ⚠ motherhood: WHY IT RISES AND THEN TAPERS rather than sitting flat at 3%: the digest's own two sentences about the same population.
 *  → docs/notes/economy/motherhood.md#motherhood
 */
export const motherhood = {
  /** ⚠⚠ THE WEEKLY HAZARD ON AN ELIGIBLE WEEK, BY AGE – the block's own note above carries the
   *  derivation, the census it predicts and the flag that the SHAPE is the builder's draft.
   *
   *  ⚠ motherhood.perWeekByAge: THE ANNUAL FIGURE IS QUOTED AS THE NUMERATOR AND NOT IN A COMMENT BESIDE THE ANSWER.
   *  ⚠ motherhood.perWeekByAge: READ AS RUNGS: the LAST rung whose `fromAge` the girl has reached wins…
   *  ⚠ motherhood.perWeekByAge: ASCENDING AND APPEND-ONLY-IN-SPIRIT
   *  ⚠⚠ motherhood.perWeekByAge: AND NEITHER ZERO IS A GATE.
   *  → docs/notes/economy/motherhood.md#motherhoodperweekbyage
   */
  perWeekByAge: [
    // 24–27 – the window opens on the digest's own lower bound, at its LOWEST annual rate: these
    // are the peak years (23–28), the ones a pregnancy competes hardest with, and the digest's
    // youngest observed first child among pros is 26.
    { fromAge: 24, perWeek: 0.02 / 52 },
    // 27–30 – the middle of the band, and the two commonest observed ages (26 / 28) sit across
    // this rung and the one below it.
    { fromAge: 27, perWeek: 0.03 / 52 },
    // 30–34 – the digest's TOP annual rate, after the peak has passed: the observed 31 sits here,
    // and this is the stretch where a pause costs a career the least of what it was going to have.
    { fromAge: 30, perWeek: 0.04 / 52 },
    // 34–35 – the tail. The digest's oldest observed first child is 35, so the window is real this
    // late and thin: back to 3%/yr for its last year.
    { fromAge: 34, perWeek: 0.03 / 52 },
    // 35+ – the window closes. See the ⭐ note above: a rung, not an absence, and not a gate.
    { fromAge: 35, perWeek: 0 },
  ],
  /** ⭐ SHE PLAYS ON THIS MANY WEEKS AFTER THE ANNOUNCEMENT, and then the entries close – the
   *  research's own «pros play into the early months». Drafted 8 (the brief's figure). T2 writes
   *  `pausesWeek` off it at the announcement; T3 is what makes the week actually close.
   *  ⚠ PERSISTED ON THE RECORD AND NOT RE-DERIVED AT READ – `PregnancyState`'s own law (T1, and
   *  `partnerName`'s one wave down): a later retune of this number must never move the pause date
   *  of a pregnancy a live career is already carrying. */
  playsOnWeeks: 8,
  /** ⭐⭐ v87 (the architect's review of T2 – the builder's own question 1 named the
   *  falsification): **THE FIRST-TRIMESTER CAP ON THE PAUSE, FROM CONCEPTION.** `announcedWeek +
   *  playsOnWeeks` alone let a private girl's 12-week window put her last event at pregnancy week
   *  20, and the research is unambiguous that COMPETITION stops after the first trimester…
   *  → docs/notes/economy/motherhood.md#motherhoodfirsttrimesterweeks
   */
  firstTrimesterWeeks: 13,
  /** ⭐ AND THE BIRTH IS THIS MANY WEEKS AFTER THE PAUSE – `dueWeek = pausesWeek + termWeeks`, the
   *  brief's own formula, drafted 31 (the brief's figure). ⚠ THE TWO TOGETHER ARE THE TERM: 8 +
   *  31 = **39 weeks from the announcement to the birth**, which is a full human term with the
   *  announcement read as its week 0 and the pause landing at week 8 – early enough that the
   *  research's «plays into the early months» is what the calendar actually does.
   *
   *  ⚠ motherhood.termTotalWeeks: THE BRIEF'S OWN PARENTHETICAL…
   *  ⚠⚠ motherhood.termTotalWeeks: THE ONE-NUMBER LAW, AND IT IS THE RESEARCH'S OWN FINDING RATHER THAN A TIDY-UP.
   *  ⚠ motherhood.termTotalWeeks: A LITERAL SUM CANNOT FOLLOW A RETUNE, AND A **PIN** IS WHAT CLOSES THAT, not this comment
   *  ⚠ motherhood.termTotalWeeks: 39 AND NOT 40, and the gap is the model's own rather than an error…
   *  ⚠ motherhood.termTotalWeeks: `termWeeks` IS KEPT AND NOT DELETED, deliberately.
   *  → docs/notes/economy/motherhood.md#motherhoodtermtotalweeks
   */
  termTotalWeeks: 8 + 31,
  termWeeks: 31,
  /** ⭐ THE PARENT'S THREE ANSWERS AT THE `'expecting'` BEAT – the research's own finding made
   *  mechanical («support only – reaction sets recovery trajectory», the digest's row): joy /
   *  worry / the career first, priced on `bond` through the existing `answerLifeBeat` seam exactly
   *  as every other beat's answers are, AND persisted as `support` on the pregnancy record, which
   *  T5's decision and T4's postpartum recovery both read. One answer, two consequences, zero new
   *  meters. Drafted +2.5 / −0.5 / −4 (the BRIEF's own figures, not the builder's), corridors
   *  benched in T9, his word after the numbers.
   *  ⚠ NO ZERO AMONG THEM, deliberately – the THIRD no-free-answer kind after `'ended'` and
   *  `'engaged'`: an announcement like this is not a card a parent can answer without it meaning
   *  something. `DRAIN_ANSWER['expecting']` is `worry`, whose −0.5 is the same −0.5 under every
   *  reading (no overlay exists for this kind), so the harnesses can state their skew exactly –
   *  `'spouse-view'`'s own precedent: the registry names the MILDEST of a kind with no zero. */
  joyBond: 2.5,
  worryBond: -0.5,
  careerFirstBond: -4,
  /** ⭐⭐ HOW LONG THE MONTHS AFTER THE BIRTH RUN BEFORE SHE SAYS – drafted 20 (the BRIEF's figure,
   *  §2 T5).
   *
   *  ⚠ motherhood.decisionWeeksAfterBirth: THE DRAW LANDS AT THE **END** OF THIS WINDOW AND NOT AT ITS START
   *  ⚠ motherhood.decisionWeeksAfterBirth: THE PAUSE OUTLIVES THE BIRTH BY EXACTLY THIS MANY WEEKS.
   *  → docs/notes/economy/motherhood.md#motherhooddecisionweeksafterbirth
   */
  decisionWeeksAfterBirth: 20,
  /** ⭐⭐⭐ HER CHANCE OF **TRYING** – the base, before the four terms below move it. Drafted 0.65
   *  (the BRIEF's figure, «~65% to TRY»).
   *
   *  ⚠⚠ motherhood.returnBase: THIS IS HALF OF A TWO-FACTOR MODEL AND THE OTHER HALF IS NOT IN THIS BLOCK.
   *  ⚠⚠ motherhood.returnBase: SO NO CONSTANT IN THIS BLOCK MAY EVER DECIDE WHETHER THE COMEBACK WORKED.
   *  ⚠ motherhood.returnBase: THE BASE IS THE **`measured`** RATE EXACTLY
   *  → docs/notes/economy/motherhood.md#motherhoodreturnbase
   */
  returnBase: 0.65,
  /** ⭐⭐⭐ THE BIGGEST TERM, AND IT IS THE DIGEST'S OWN CLAIM – «support only – reaction sets
   *  recovery trajectory» (`docs/research/life-events-motherhood.md:31`). ⚠ THE SHAPE IS THE
   *  **BUILDER'S DRAFT** and is flagged here exactly as `perWeekByAge` above is; the BRIEF drafts
   *  the base and the ordering of the terms, not the sizes.
   *
   *  ⚠ motherhood.returnSupportShift: THE ARITHMETIC, IN FULL: · grades land at **0.80 / 0.65 / 0.45** – a 35 pp spread…
   *  ⚠ motherhood.returnSupportShift: A `null` GRADE TAKES THE `measured` CELL
   *  → docs/notes/economy/motherhood.md#motherhoodreturnsupportshift
   */
  returnSupportShift: { warm: 0.15, measured: 0, cold: -0.2 },
  /** ⭐ HER OWN STATE, PER POINT OF `spirit` OFF `ECONOMY.spirit.baseline` (70). Builder's draft.
   *  ±0.04 over the ±10 band a recovered girl really sits in at the decision week; −0.28 / +0.12 at
   *  the ends of the 0–100 scale, which the clamp below then catches. ⚠ IT IS SECOND AND NOT FIRST
   *  ON PURPOSE: the digest's row says SUPPORT sets the trajectory, so her mood may move the
   *  decision and may not dominate it. */
  returnSpiritPerPoint: 0.004,
  /** ⭐ AND THE PARENT'S STANDING, PER POINT OF `bond` OFF `ECONOMY.bond.start` (70). Builder's
   *  draft, and deliberately HALF the spirit term per point: §4a's law is that her life moves
   *  `spirit` and his words move `bond`, so the number that is about HIM sits behind the number that
   *  is about HER in a decision that is hers. ±0.03 over a realistic 55–85, ±0.06 over the whole
   *  scale. */
  returnBondPerPoint: 0.002,
  /** ⭐ THE AGE TERM, AND IT IS ONE-SIDED. Builder's draft: nothing at or below `returnAgePivot`,
   *  and `returnAgePerYearOver` off the chance for each whole year past it.
   *
   *  ⚠ motherhood.returnAgePivotYears: ONE-SIDED RATHER THAN SYMMETRIC, and the reason is the drafted base.
   *  ⚠ motherhood.returnAgePivotYears: THE PIVOT IS 30 – the middle of the research's own 24–35 window rounded to a year…
   *  → docs/notes/economy/motherhood.md#motherhoodreturnagepivotyears
   */
  returnAgePivotYears: 30,
  returnAgePerYearOver: 0.015,
  /** ⚠⚠ AND THE BAND THE CHANCE IS HELD INSIDE – builder's draft, and NECESSARY rather than tidy:
   *  the terms above really do run off the end (cold + spirit 0 + bond 0 + 36 is
   *  0.65 − 0.20 − 0.28 − 0.14 − 0.09 = **−0.06**, and warm + spirit 100 + bond 100 is 0.98). A
   *  negative number would compare harmlessly and would still be a model claiming CERTAINTY about a
   *  woman's decision, which is the one thing this layer's §4a forbids in both directions.
   *  `ECONOMY.spirit.floor`'s own shape: a bound written down beats a value allowed to run off. */
  returnChanceMin: 0.1,
  returnChanceMax: 0.9,
  /** ⭐⭐⭐ THE FREEZE, AND THESE TWO NUMBERS ARE **RULED** (20.09, «наверное да, у нас тоже были
   *  исследования») – so they are NOT drafts and NOT this builder's, which is why they sit apart
   *  from every other row in this block under a heading that says so.
   *
   *  ⚠ motherhood.protectedRankWeeks: THREE FACTS AND TWO CONSTANTS.
   *  ⚠ motherhood.protectedRankWeeks: 156 WEEKS IS THREE YEARS AT THIS ENGINE'S OWN CALENDAR (3 × 52)
   *  ⚠ motherhood.protectedRankWeeks: AND IT RUNS FROM THE **RETURN**, NOT FROM THE PAUSE
   *  → docs/notes/economy/motherhood.md#motherhoodprotectedrankweeks
   */
  protectedRankWeeks: 3 * 52,
  /** ⭐⭐⭐ ...AND HOW MANY ENTRIES IT BUYS – **RULED 20.09** with the span above. Twelve, counted
   *  down on `world.comeback.protectedRank.entriesLeft` and spent only where the freeze was
   *  DECISIVE (`entryVerdict`, `world/medical.ts`, where that word is argued). ⚠ A COUNT AND NOT A
   *  RATE: it is an entitlement, so it is state on the record rather than a knob read per week, and
   *  T9 measures «entries it actually buys, and how often it expires unused» rather than tuning it. */
  protectedRankEntries: 12,
  /** ⭐⭐⭐ THE STAGED FACTOR'S OWN STAIRCASE – **RE-DENOMINATED IN ELO ON HIS WORD OF 21.09, «да,
   *  деноминируем»** (wave 8b T3). −200 / −100 / −50 / 0 Elo over 0–3 / 3–6 / 6–12 / 12+ months
   *  post-return, replacing the ×0.6 / ×0.8 / ×0.9 / ×1.0 MULTIPLIERS this table shipped with.
   *
   *  ⚠⚠ motherhood.childSmallWeeks: **WHAT WAS WRONG WAS THE UNITS AND NOT THE SHAPE**, and it was measured rather than felt…
   *  ⚠ motherhood.childSmallWeeks: THE SHAPE IS STILL THE RESEARCH'S OWN SENTENCE
   *  ⚠ motherhood.childSmallWeeks: THE SIZES CARRY ±10%, NAMED BY THE RESEARCH ITSELF
   *  ⚠⚠ motherhood.childSmallWeeks: **IT IS A TIME-SHAPED MULTIPLIER ON THE ABSENCE AND IT READS NOTHING FROM RESULTS.** §0 of the wave…
   *  ⚠ motherhood.childSmallWeeks: ANY BUILDER WHO FINDS THEMSELVES READING MATCH OUTCOMES INTO IT STOPS AND BRINGS IT.
   *  ⚠ motherhood.childSmallWeeks: THE WINDOWS ARE MONTHS IN THE RESEARCH AND WEEKS IN THE ENGINE
   *  ⚠ motherhood.childSmallWeeks: READ AS RUNGS, `perWeekByAge`'s own shape and its own hazard…
   *  owner (motherhood.childSmallWeeks), 21.09: «если сольет все турниры в первый год, то в следующем автоматически будет играть более»…
   *  ⚠⚠ motherhood.childSmallWeeks: AND «ONLY SMALLS» IS NO LONGER OFFERED AS AN ANSWER
   *  ⚠ motherhood.childSmallWeeks: WHAT IT MOVES IS A **LABEL**, NEVER A REFUSAL.
   *  ⚠ motherhood.childSmallWeeks: 13 WAS MEASURED TOO and is the retune if the six months read long…
   *  ⚠ motherhood.childSmallWeeks: A window and not a flag: nothing is persisted and no save gains a key…
   *  → docs/notes/economy/motherhood.md#motherhoodchildsmallweeks
   */
  childSmallWeeks: 156,
  /** ⭐⭐⭐ W5/T3 – THE SECOND CHILD'S OWN CURVE, and it is a different curve rather than the first
   *  one re-used. His digest's row is explicit and is the whole source: «Second child | 28–38 |
   *  1–2% | even less influence» – a LATER window than the first pregnancy's 24–35, a LOWER annual
   *  rate than its 2–4%, and the design's own sentence about the third («the repeat hazard reads
   *  the age window AND the count of children, so a third stays rare rather than routine»).
   *  ⚠ The rungs are read exactly as `perWeekByAge`'s are – last rung at or below her age wins –
   *  so the two curves cannot drift apart in how they are consumed, only in what they say. */
  repeatPerWeekByAge: [
    // 28–34 – the digest's window opens here, at its TOP annual rate: she is past the peak years,
    // the first child is old enough to have stopped being an infant, and this is where the two
    // documented multi-return careers sit.
    { fromAge: 28, perWeek: 0.02 / 52 },
    // 34–38 – the tail, at the digest's LOW rate. Real and thin, exactly as the first curve's
    // last rung is.
    { fromAge: 34, perWeek: 0.01 / 52 },
    // 38+ – the window closes. A rung and not an absence, `perWeekByAge`'s own law.
    { fromAge: 38, perWeek: 0 },
  ],
  /** ⭐⭐ AND EVERY CHILD AFTER THE SECOND MULTIPLIES THE HAZARD BY THIS – the «count of children»
   *  half of the design's sentence, as one number rather than a third curve. At 0.5 a third child
   *  runs at half the second's rate and a fourth at a quarter: rare, never impossible, and the
   *  bench reports what it produces instead of the constant promising it.
   *  ⚠ RULED BY HIM 21.09 that there is NO CAP – «пусть решает арифметика» – so this factor is the
   *  only thing making a large family rare, which is exactly the job it was given. */
  repeatCountFactor: 0.5,
  /** ⭐ HOW LONG AFTER A BIRTH THE NEXT PREGNANCY CANNOT START. Drafted at a year, and it is the
   *  ONE number in T3 the digest does not supply: what it protects is the comeback itself, because
   *  a pregnancy inside the return ramp would overwrite `world.comeback` and take back the freeze
   *  she is in the middle of spending. ⚠ DRAFTED, NOT RULED – benched in T7, and the alternative
   *  shape (refuse only while the freeze has entries left) is written up there rather than chosen
   *  here. */
  repeatCooldownWeeks: 52,
  /** ⭐⭐⭐ W5/T5 – «PRIORITIES SHIFT», AS ROOM RATHER THAN AS A GIFT. The research digest's one
   *  PERMANENT effect («possible permanent mental-resilience bonus after the return») and the
   *  only skill-adjacent number this whole branch is allowed to touch – which is why it ships
   *  with a bench and a spec row (invariant 5) and at a drafted value.
   *
   *  ⚠⚠ motherhood.returnPoiseCeiling: IT RAISES HER COMPOSURE **CEILING** AND NEVER HER COMPOSURE
   *  ⚠⚠ motherhood.returnPoiseCeiling: AND THE CEILING IS THE ONLY SHAPE THAT WORKS AT ALL
   *  ⚠ motherhood.returnPoiseCeiling: PER CHILD AND DERIVED FROM `world.children`
   *  → docs/notes/economy/motherhood.md#motherhoodreturnpoiseceiling
   */
  returnPoiseCeiling: 1.5,
  /** The cap on the above, whatever the family's size. Drafted at two children's worth. */
  returnPoiseMax: 3,
  smallFirstHoldWeeks: 26,
  comebackStages: [
    // 0–3 months – the deepest rung, and the one the wrong ramp spends its protected entries
    // inside. ⭐ 200 Elo is the top of the research's own −150…−250 corridor (§3 of the staircase
    // document), which is where «−40% of form» lands once it is priced: on a #31 it is ×0.832, a
    // returner playing like #151 rather than like #380.
    { fromWeeksBack: 0, dElo: 200 },
    // 3–6 months – half of it, exactly as the digest's −20% is half of its −40%.
    { fromWeeksBack: 52 / 4, dElo: 100 },
    // 6–12 months – half again.
    { fromWeeksBack: 52 / 2, dElo: 50 },
    // 12+ months – full. ⭐ A RUNG AND NOT AN ABSENCE, `perWeekByAge`'s own 0 at 35: «the ramp ends»
    // is a sentence somebody had to type, and a table that simply stopped would leave the last rung
    // running for the rest of her career. ⚠ AND IT IS **EXACTLY** ZERO, which is load-bearing
    // arithmetic rather than tidiness: `(core − 0) / core` is exactly 1.0 in IEEE-754, so a career
    // twelve months back composes BYTE-IDENTICALLY to one that never paused – the property
    // `tests/wave8-comeback-factor.test.ts` §B pins with `toEqual` on the whole player.
    { fromWeeksBack: 52, dElo: 0 },
  ],
} as const
