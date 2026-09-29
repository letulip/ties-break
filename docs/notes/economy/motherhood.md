---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The motherhood block

The comment essays that stood above the `motherhood` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `motherhood`

```ts
  /** ⭐⭐⭐ v85 – THE PREGNANCY AND THE RETURN (wave 8; `docs/plans/life-wave-8-builder-2026-09.md`
   *  §2 T2–T6, the design `docs/plans/the-wedding-and-the-children.md` §5 W3+W4). `ECONOMY.wedding`'s
   *  block one wave on and in its voice: one block, every number the wave spends, each row naming the
   *  task that reads it.
   *
   *  ⚠ WITH **TWO** EXCEPTIONS, NAMED HERE SO THE SENTENCE ABOVE STAYS HONEST: T4's postpartum shock
   *  band and the `support` factor that scales it live in `ECONOMY.spirit` (`shock.postpartum` and
   *  `postpartumSupportScale`), because their one reader is `accrueSpirit` and `ECONOMY.spirit`'s own
   *  law is that its rows are the weekly pass's – `attachmentLift`'s note states it («it is read by
   *  `accrueSpirit` and by nothing else»). Put here they would have made `engine/spirit.ts`'s header
   *  false («Every constant lives in `ECONOMY.spirit` / `ECONOMY.bond`»), which is a worse trade than
   *  this cross-reference.
   *
   *  ⚠⚠ EVERY NUMBER BELOW IS A DRAFT FOR THE BENCH AND NONE IS RULED – the brief's §4 contract, the
   *  wedding block's own sentence inherited whole: «every §2 number ships at its drafted value,
   *  unruled, which is the contract and not an omission». T9 benches them and HIS word lands on
   *  numbers, not on a blank. ⚠ NO CENTS ANYWHERE IN THIS BLOCK – there is no birth fee (§2 T4's own
   *  «NO COST EVENT», the wedding-price ruling of 18.09 read one wave on) and the three deltas below
   *  are BOND POINTS on `applyBondDelta`'s scale, to which the cents rules do not apply.
   *
   *  ⭐⭐⭐ AND THE RATE IS **DERIVED**, WHICH IS THE ONE THING THIS BLOCK EXISTS TO MAKE READABLE AT
   *  THE CONSTANT. His 20.09 push-back is why this paragraph is here and not in a plan file: «а на
   *  чем основана цифра? не великовато получится?» – and the first draft's 35–60% census died of it,
   *  because it was sized by VISIBILITY («the player should get to see this») rather than by
   *  anything. The source is HIS OWN RESEARCH DIGEST, `docs/research/life-events-motherhood.md:31`,
   *  the personal-life arc's own table row:
   *
   *      | First pregnancy | 24–35 | 2–4% | support only – reaction sets recovery trajectory |
   *
   *  So the whole of the rate is that row: the WINDOW is 24–35, the ANNUAL band is 2–4%, and the
   *  weekly hazard is `annual / 52` on an eligible week. The division is written out in the rungs
   *  below rather than pre-computed, so what a reader sees IS the digest's own number: nobody has to
   *  trust a transcription of `0.000577`, and nobody can re-tune the annual figure by editing a
   *  sixth decimal place that no longer says where it came from.
   *
   *  ⭐ WHAT THE CURVE PREDICTS, AS A NUMBER, BECAUSE A DERIVATION WITH NO PREDICTION IS A STORY:
   *  **15–30% of latched careers reach a pregnancy by 35** – RULED 20.09 («и это ок»), straight from
   *  the research over the ~8.5 married window-years the corridor is stated on (1 − 0.98^8.5 ≈ 16%,
   *  1 − 0.96^8.5 ≈ 29%). ⚠ THE CORRIDOR IS HIS AND IS NOT THE CURVE'S TO BEND: T9 measures the
   *  realised share against it, and a curve that misses is the curve's finding, never the corridor's.
   *
   *  ⚠⚠ THE SHAPE OF THE CURVE IS THE **BUILDER'S OWN DRAFT** – the brief drafts the window and the
   *  annual band and NOT the shape, so it is flagged here exactly as `wedding.perWeek` and
   *  `wedding.spouseViewSpendCents` are, and nobody may mistake it for the architect's. Its
   *  arithmetic, in full:
   *
   *    · the four rungs weight the window as 3y at 2%, 3y at 3%, 4y at 4%, 1y at 3% – mean annual
   *      (3·2 + 3·3 + 4·4 + 1·3) / 11 = 34/11 ≈ **3.09%**, the middle of the digest's own 2–4%;
   *    · at the corridor's stated ~8.5 married window-years that mean gives
   *      1 − (1 − 0.0309)^8.5 ≈ **23.4%** – the middle of his corridor, which is where a derived
   *      figure ought to land when it is derived from the band the corridor was derived from;
   *    · a career married across the WHOLE window is the ceiling: 1 − 0.98³·0.97³·0.96⁴·0.97 ≈
   *      **29.2%** by the annual arithmetic, **28.8%** by the week-by-week walk the engine actually
   *      performs (weekly compounding is marginally gentler). Under the corridor's 30% either way;
   *    · the likely middle, given wave 7: a 0.006/week wedding hazard from 23 waits ~167 weeks on
   *      average, so the typical marriage latches around 26–27 → **25.2%**;
   *    · a career latched LATE – say at 31, which that hazard makes uncommon but real – carries
   *      **13.9%**, and that is the floor of the SPREAD and not of the corridor, which is a claim
   *      about the POPULATION share rather than about one career. ⚠ THE REALISED FIGURE WILL SIT
   *      UNDER EVERY NUMBER ABOVE, and the reasons are all real: careers retire, marriages end
   *      (wave 7 measured 6.2 endings per 100 latched episode-years), and the knock clause skips
   *      weeks. T9 measures; these are the predictions it measures against.
   *
   *  ⚠ WHY IT RISES AND THEN TAPERS rather than sitting flat at 3%: the digest's own two sentences
   *  about the same population. «First-child ages among pros: 26 / 28 / 31 / 35 – wide spread over
   *  the 24–35 window» puts the mass ABOVE the early twenties, and «the child-vs-career-peak dilemma
   *  (peak 23–28) is the emotional core» says why – the years the hazard competes hardest with are
   *  the peak years, and a flat curve would have said the peak costs nothing. */
```

## `motherhood.perWeekByAge`

```ts
    /** ⚠⚠ THE WEEKLY HAZARD ON AN ELIGIBLE WEEK, BY AGE – the block's own note above carries the
     *  derivation, the census it predicts and the flag that the SHAPE is the builder's draft.
     *
     *  ⚠ THE ANNUAL FIGURE IS QUOTED AS THE NUMERATOR AND NOT IN A COMMENT BESIDE THE ANSWER. `0.03 /
     *  52` is the digest's 3%/yr spread over its 52 weeks, evaluated at build time and costing a
     *  reader nothing; `0.000577` would be a transcription with its provenance thrown away, which is
     *  the exact failure the 20.09 push-back was about.
     *
     *  ⚠ READ AS RUNGS: the LAST rung whose `fromAge` the girl has reached wins, and an age under the
     *  first rung takes 0 (`pregnancyChanceAt`, `world/lifeBeat.ts` §14). ⚠ ASCENDING AND
     *  APPEND-ONLY-IN-SPIRIT: the read depends on the order, so a rung inserted out of sequence
     *  silently re-shapes the curve – `tests/wave8-pregnancy.test.ts` §A pins that it is sorted.
     *
     *  ⭐ THE 0 AT 35 IS A RUNG AND NOT AN ABSENCE, deliberately: «the window closes» is a sentence
     *  somebody had to type, and a table that simply stopped would leave the last real rung running
     *  for ever. ⚠⚠ AND NEITHER ZERO IS A GATE. §0's adopted recommendation is «the age window is the
     *  research's 24–35, hazard-shaped, NEVER a hard gate» – `pregnancyEligible` holds no age clause
     *  at all, the marriage door (23+, wave 7) keeps the junior years out by construction, and a 0
     *  here takes ZERO DRAWS exactly as an ineligible week does (the roll returns on the chance
     *  before it derives the stream). The difference is not cosmetic: a gate would have to be
     *  re-argued to move, and a rung is re-tuned by T9 with one number. */
```

## `motherhood.firstTrimesterWeeks`

```ts
    /** ⭐⭐ v87 (the architect's review of T2 – the builder's own question 1 named the falsification):
     *  **THE FIRST-TRIMESTER CAP ON THE PAUSE, FROM CONCEPTION.** `announcedWeek + playsOnWeeks`
     *  alone let a private girl's 12-week window put her last event at pregnancy week 20, and the
     *  research is unambiguous that COMPETITION stops after the first trimester
     *  (`docs/research/pregnancy-in-sport-2026-09.md` §5 – training continues, competition does not).
     *  So the pause is `min(announcedWeek + playsOnWeeks, conceivedWeek + firstTrimesterWeeks)`:
     *  the shipped «up to 8 after she tells» surface holds wherever biology allows it, and the cap
     *  binds only when the window is long – which is exactly the design doc's quiet-girl scene, «he
     *  may learn from the absence of entries»: she stops entering before he knows why.
     *  Drafted 13; a zero-window pregnancy reproduces every wave-8 date exactly (min(8, 13) = 8),
     *  which is what keeps the shipped identity pin green by arithmetic rather than by luck. */
```

## `motherhood.termTotalWeeks`

```ts
    /** ⭐ AND THE BIRTH IS THIS MANY WEEKS AFTER THE PAUSE – `dueWeek = pausesWeek + termWeeks`, the
     *  brief's own formula, drafted 31 (the brief's figure). ⚠ THE TWO TOGETHER ARE THE TERM: 8 + 31
     *  = **39 weeks from the announcement to the birth**, which is a full human term with the
     *  announcement read as its week 0 and the pause landing at week 8 – early enough that the
     *  research's «plays into the early months» is what the calendar actually does.
     *  ⚠ THE BRIEF'S OWN PARENTHETICAL («announcement lands around pregnancy week 8, term at 39») is
     *  the rationale for the 31 and reads one word loose – the arithmetic it describes only closes if
     *  it is the PAUSE that lands around pregnancy week 8, which is what the formula beside it says
     *  and what is built. Reported rather than papered over; both numbers ship at their drafted
     *  values. T4 fires the birth on `dueWeek`. */
    /** ⭐⭐⭐ v87 (the weight, wave 11 T2 – docs/specs/the-weight-2026-09.md §2) – **AND THE WHOLE
     *  TERM, FROM CONCEPTION, WHICH IS THE NUMBER THE BIRTH NOW RIDES ON.** `termWeeks` above has no
     *  reader in `src/` any more: `dueWeek = conceivedWeek + termTotalWeeks`, and the announcement
     *  sits INSIDE the term rather than ahead of it.
     *
     *  ⚠⚠ THE ONE-NUMBER LAW, AND IT IS THE RESEARCH'S OWN FINDING RATHER THAN A TIDY-UP.
     *  `docs/research/pregnancy-in-sport-2026-09.md` §6: «`termWeeks: 31` places conception AT the
     *  announcement, so a hidden window added without shrinking `termWeeks` by the same amount would
     *  make her pregnancy 43–47 weeks long. The two are one number and must move together.» So they
     *  did: this constant is `playsOnWeeks + termWeeks` written out as the sum it is, which is the
     *  `0.03 / 52` precedent one field up – «the annual figure is quoted as the numerator and not in
     *  a comment beside the answer» – and costs a reader nothing at run time.
     *
     *  ⚠ A LITERAL SUM CANNOT FOLLOW A RETUNE, AND A **PIN** IS WHAT CLOSES THAT, not this comment:
     *  an object literal cannot reference its own siblings, so `8 + 31` would go stale in silence if
     *  somebody moved `playsOnWeeks` to 9. `tests/wave11-window.test.ts` §A asserts
     *  `termTotalWeeks === playsOnWeeks + termWeeks` against the LIVE constants, so that retune goes
     *  red at the moment it is made instead of shipping a 40-week pregnancy. The same file pins the
     *  zero-window identity against the wave-8 BRIEF's own literals rather than against this
     *  expression, so the two claims cannot prove each other.
     *
     *  ⚠ 39 AND NOT 40, and the gap is the model's own rather than an error: a human term is ~40
     *  weeks from the last period and ~38 from conception, so 39 sits between the two conventions and
     *  is what the shipped numbers already added up to. Nothing was re-derived to reach it.
     *
     *  ⚠ `termWeeks` IS KEPT AND NOT DELETED, deliberately. It is the ANNOUNCEMENT-relative half of
     *  the sum and the number every wave-8 document, test and comment quotes; deleting it would make
     *  this constant a bare 39 with its provenance thrown away – the exact failure the 20.09 push-back
     *  was about one field up («the annual figure is quoted as the numerator and not in a comment»). */
```

## `motherhood.decisionWeeksAfterBirth`

```ts
    /** ⭐⭐ HOW LONG THE MONTHS AFTER THE BIRTH RUN BEFORE SHE SAYS – drafted 20 (the BRIEF's figure,
     *  §2 T5). ⚠ THE DRAW LANDS AT THE **END** OF THIS WINDOW AND NOT AT ITS START, which is what
     *  makes the number price anything at all; `decisionWeekOf` (`world/lifeBeat.ts` §14) is where
     *  that is argued, and its strongest reason is mechanical rather than narrative – T4 MEASURED the
     *  postpartum mark clearing in 3–13 weeks by grade and intensity, so at +20 her `spirit` is her
     *  recovered spirit and the term below reads a number that has finished moving.
     *  ⚠ THE PAUSE OUTLIVES THE BIRTH BY EXACTLY THIS MANY WEEKS. `pauseCovering` has no upper bound
     *  of its own (T3's finding): entries stay shut from `pausesWeek` until the record goes null, and
     *  `termWeeks + decisionWeeksAfterBirth` = 31 + 20 = **51 weeks with no new entry**, a year almost
     *  to the week. (Not «off tour»: already-booked events inside the window still play out, which is
     *  the distinction the `'family'` ending's own detail line is written to respect.) T9 measures what
     *  that costs her ranking; nothing here decides it. */
```

## `motherhood.returnBase`

```ts
    /** ⭐⭐⭐ HER CHANCE OF **TRYING** – the base, before the four terms below move it. Drafted 0.65
     *  (the BRIEF's figure, «~65% to TRY»).
     *
     *  ⚠⚠ THIS IS HALF OF A TWO-FACTOR MODEL AND THE OTHER HALF IS NOT IN THIS BLOCK. The research's
     *  headline is «~40% of mothers return SUCCESSFULLY», and the brief splits it honestly rather than
     *  shipping one number that pretends to be both:
     *
     *      her decision to TRY        DRAWN, here, ~65% and `support`-weighted
     *      whether the comeback WORKS EMERGENT from T6's pricing – MEASURED, never drawn
     *
     *  and the product is the sanity line: 0.65 × ~0.6 ≈ 0.4. ⚠⚠ SO NO CONSTANT IN THIS BLOCK MAY EVER
     *  DECIDE WHETHER THE COMEBACK WORKED. A success rate written here would collapse the two factors
     *  into one and make T9's check circular – it checks the PRODUCT against the digest's sentence
     *  precisely so that neither factor has to be forced to a target. A builder who finds themselves
     *  reaching for such a number stops and brings it; it belongs to T6's pricing and to nobody's draw.
     *
     *  ⚠ THE BASE IS THE **`measured`** RATE EXACTLY, because `returnSupportShift.measured` is exactly
     *  0 – `ECONOMY.spirit.postpartumSupportScale`'s own arrangement one wave-task down, and for its
     *  reason: the band a reader sees written down should be the band one real grade actually takes. */
```

## `motherhood.returnSupportShift`

```ts
    /** ⭐⭐⭐ THE BIGGEST TERM, AND IT IS THE DIGEST'S OWN CLAIM – «support only – reaction sets
     *  recovery trajectory» (`docs/research/life-events-motherhood.md:31`). ⚠ THE SHAPE IS THE
     *  **BUILDER'S DRAFT** and is flagged here exactly as `perWeekByAge` above is; the BRIEF drafts
     *  the base and the ordering of the terms, not the sizes.
     *
     *  ⚠ THE ARITHMETIC, IN FULL:
     *    · grades land at **0.80 / 0.65 / 0.45** – a 35 pp spread, which is more than twice what the
     *      other three terms can move between them at realistic inputs (±0.04 spirit + ±0.03 bond +
     *      0…−0.04 age ≈ 0.11 of span). «The biggest term» is arithmetic here, not an adjective;
     *    · `measured` is EXACTLY 0, so `returnBase` above IS the measured-grade rate;
     *    · THE ASYMMETRY IS THE ANSWERS' OWN. The three answers are already priced on `bond` at
     *      +2.5 / −0.5 / −4 (the brief's ruled figures, three fields up), so the cold answer is the
     *      heaviest of the three – ratio 4 / 2.5 = 1.60. This table keeps the direction and is
     *      deliberately GENTLER: 0.20 / 0.15 = 1.33. One cold sentence eleven months earlier should
     *      TILT a woman's decision about her own career; it may not decide it.
     *  ⚠ A `null` GRADE TAKES THE `measured` CELL and is not a fourth column – `postpartumSupportScale`'s
     *  own `??` courtesy: the `'expecting'` beat BLOCKS, so no career can tick the 51 weeks from the
     *  announcement to the decision without answering it, and the null is a probe world's answer. */
```

## `motherhood.returnAgePivotYears`

```ts
    /** ⭐ THE AGE TERM, AND IT IS ONE-SIDED. Builder's draft: nothing at or below `returnAgePivot`,
     *  and `returnAgePerYearOver` off the chance for each whole year past it.
     *
     *  ⚠ ONE-SIDED RATHER THAN SYMMETRIC, and the reason is the drafted base. A symmetric term would
     *  pay a 25-year-old a bonus and push her above 0.65, and then the BRIEF's own «~65% to TRY» would
     *  no longer be the base of anything – it would be the rate of a girl nobody is. So youth is the
     *  default and age is the cost, which is also the shape the digest describes: the window it names
     *  is 24–35 and the comeback stories in it thin out at the top of that range.
     *  ⚠ THE PIVOT IS 30 – the middle of the research's own 24–35 window rounded to a year, and the
     *  age a career that conceived at the hazard's own likeliest rungs actually reaches the decision
     *  at. The reachable span is −0 at 27 to −0.09 at 36 (the oldest decision this wave can produce:
     *  conception at 35, +39 weeks to the birth, +20 more to here, WHOLE years), so the whole term is
     *  worth just under two thirds of the warm grade and never more. */
```

## `motherhood.protectedRankWeeks`

```ts
    /** ⭐⭐⭐ THE FREEZE, AND THESE TWO NUMBERS ARE **RULED** (20.09, «наверное да, у нас тоже были
     *  исследования») – so they are NOT drafts and NOT this builder's, which is why they sit apart
     *  from every other row in this block under a heading that says so. The source is his own digest,
     *  `docs/research/life-events-motherhood.md:9`: «**ranking freeze for 3 years post-birth** (since
     *  2019, used by 50+ players)», and the real rule's own shape is a frozen ENTRY standing usable
     *  for a bounded number of tournaments inside that span.
     *
     *  ⚠ THREE FACTS AND TWO CONSTANTS. The third – **her rank at `pausesWeek`** – is ruled with these
     *  two and is not a number that could live here: it is a fact about one career, captured on the
     *  one week it is true (`landPregnancyPause`, `world/lifeBeat.ts` §14) and carried on the record.
     *
     *  ⚠ 156 WEEKS IS THREE YEARS AT THIS ENGINE'S OWN CALENDAR (3 × 52), written as the product
     *  rather than as `156` for `perWeekByAge`'s reason one screen up: what a reader sees is the
     *  digest's own «3 years», not a transcription with its provenance thrown away.
     *  ⚠ AND IT RUNS FROM THE **RETURN**, NOT FROM THE PAUSE – `resolveReturnDecision` writes
     *  `validUntilWeek = returnedWeek + this`, and the argument is at that line: the entitlement is
     *  what the comeback buys, `returnedWeek` is the record's own clock (the staged factor is a
     *  function of exactly that number), and anchoring both halves of `world.comeback` on one week is
     *  what stops the freeze and the ramp from being two different dates about one comeback. Anchored
     *  at `pausesWeek` instead it would be 156 − 51 = 105 usable weeks, which is a different rule and
     *  is flagged in the hand-back as the one place his «3 years» could honestly be read the other
     *  way. */
```

## `motherhood.childSmallWeeks`

```ts
    /** ⭐⭐⭐ THE STAGED FACTOR'S OWN STAIRCASE – **RE-DENOMINATED IN ELO ON HIS WORD OF 21.09, «да,
     *  деноминируем»** (wave 8b T3). −200 / −100 / −50 / 0 Elo over 0–3 / 3–6 / 6–12 / 12+ months
     *  post-return, replacing the ×0.6 / ×0.8 / ×0.9 / ×1.0 MULTIPLIERS this table shipped with.
     *
     *  ⚠⚠ **WHAT WAS WRONG WAS THE UNITS AND NOT THE SHAPE**, and it was measured rather than felt:
     *  [the-comeback-staircase-2026-09.md](../../../docs/research/the-comeback-staircase-2026-09.md)
     *  prices the old first rung through `coreForStanding`/`eloForStanding` and finds that **×0.6 on a
     *  #31's wings is −477 Elo at this engine's own measured rate** – she played the first three
     *  months like **#380**, level with the W15 field and a ten-point donor at every big draw. The
     *  research's own «−40%» reads as −150…−250 Elo in the same currency, so the shipped first rung
     *  was about **twice too deep**. The digest's sentence is unchanged and still governs; what
     *  changes is that «−40% of form» is now spelled in the currency `fieldPros.ts` keeps its whole
     *  table in, instead of as a fraction of her wings.
     *
     *  ⭐ AND THE A1 INVERSION IS WHAT IT WAS ALWAYS ABOUT. Wave 8's ramp trap ran BACKWARDS – straight
     *  back to the big draws beat a careful small-first programme 8/8 and 16/18 – and §3 of the
     *  research isolates this table as the cause: a returner even with the W15 fields she was sent to
     *  farm harvests 55 points a year, while twelve first-round exits at the big draws bank 120. No
     *  design change, no points floor, no body cost: the units.
     *
     *  ⚠ THE SHAPE IS STILL THE RESEARCH'S OWN SENTENCE – `docs/research/life-events-motherhood.md:35`,
     *  «staged penalties ≈ −40% (0–3 mo) → −20% (3–6) → −10% (6–12) → full recovery 12+ mo» – and the
     *  windows below are untouched. Four rungs, halving, ending at zero.
     *
     *  ⚠ THE SIZES CARRY ±10%, NAMED BY THE RESEARCH ITSELF: `eloPerCore` was measured on FLAT builds
     *  and a ×-factor build is not flat. It changes nothing in the conclusion – −477 against −250 is
     *  not inside any error bar.
     *
     *  ⚠⚠ **IT IS A TIME-SHAPED MULTIPLIER ON THE ABSENCE AND IT READS NOTHING FROM RESULTS.** §0 of
     *  the wave brief names the fence and names the document it is a fence around:
     *  `docs/specs/form-and-slump.md` (results-driven form) is OWNER-PARKED – «форму и спад тоже давай
     *  распишем спеком, но уже на потом» – and this factor «is NOT that spec and must not become it by
     *  the back door». Three properties, all of them mechanical rather than promised:
     *    · it is a function of `world.comeback.returnedWeek` and the current week, and of nothing else;
     *    · it is dead at 1.0 for every career that never paused – `comebackMatchFactor`'s reader takes
     *      the same early return `spirit` and `form` take, so the composition is byte-identical;
     *    · the ARGUMENT TYPE it is read through carries `returnedWeek` and no other field, so a
     *      result is not merely unread here, it is out of scope at the call site.
     *  ⚠ ANY BUILDER WHO FINDS THEMSELVES READING MATCH OUTCOMES INTO IT STOPS AND BRINGS IT. That is
     *  §0's instruction verbatim and it is the one line of T6 that is not negotiable.
     *
     *  ⚠ THE WINDOWS ARE MONTHS IN THE RESEARCH AND WEEKS IN THE ENGINE, and the conversion is
     *  written as arithmetic rather than as three transcribed integers, on `perWeekByAge`'s own rule
     *  one screen up: `52 / 4` is three months, `52 / 2` is six, `52` is twelve. A reader sees the
     *  digest's own staircase; nobody has to trust `13` / `26` / `52`.
     *
     *  ⚠ READ AS RUNGS, `perWeekByAge`'s own shape and its own hazard: the LAST rung whose
     *  `fromWeeksBack` she has reached wins, so the table must stay ASCENDING – a rung inserted out of
     *  sequence silently re-shapes the ramp. ⭐ AND A WEEK BEFORE THE RETURN TAKES **NO RUNG AND
     *  THEREFORE 1.0**: a match played before she came back is not a comeback match, and the stored
     *  `WorldMatch` of one must replay exactly as it was. */
    /** ⭐⭐⭐ HOW LONG «SMALL EVENTS FIRST» ACTUALLY MEANS «ONLY SMALL EVENTS» – the owner's ruling of
     *  21.09, and it started as his own reading of the ramp rather than as a tuning: «если сольет все
     *  турниры в первый год, то в следующем автоматически будет играть более низкие, разве нет?» Yes –
     *  the freeze is twelve entries and it is spent ONCE, so the only lever the card ever had is WHEN.
     *
     *  MEASURED before it was ruled (`docs/specs/the-motherhood-2026-09.md` §15.5, n=15 paired
     *  returns off one card, five arms on the same clones):
     *
     *      arm                     pts@52w  rank@52w  freeze  pts@104w  rank@104w  top-100  back to #39
     *      only smalls (policy)          0      1621     0.0         0       1620     0/15        0/14
     *      straight back               703       267    11.2       914        173     5/15        0/14
     *      hybrid, hold 13             464       295    11.2       711        143     4/15        1/14
     *      hybrid, hold 26 (THIS)      460       268     9.9       945        117     7/15        2/14
     *
     *  ⭐ Hold-26 takes every LONG metric and matches straight-back's 52-week rank, conceding only the
     *  first year's points – six months of small draws rebuild a live standing, and the freeze then
     *  opens big draws at −50/0 instead of −200, which converts into runs rather than first-round
     *  exits. ⚠⚠ AND «ONLY SMALLS» IS NO LONGER OFFERED AS AN ANSWER, by his ruling, because it is
     *  DOMINATED by the hybrid at both horizons and at both hold points – a card may not offer a
     *  measured trap as one of its two answers.
     *
     *  ⚠ WHAT IT MOVES IS A **LABEL**, NEVER A REFUSAL. `EntryStatus.offReturnPlan` is a preference
     *  the player can override week to week (T6 §C); past this many weeks from `returnedWeek` the
     *  label simply stops being raised, so the same plan stops calling a big draw off-plan. Nothing
     *  becomes newly legal and no entry cap moves.
     *
     *  ⚠ 13 WAS MEASURED TOO and is the retune if the six months read long; the curve between them is
     *  not measured, which is the honest limit on this number (n=15, two hold points). */
    /** ⭐⭐ W5/T2 – HOW LONG «SMALL» LASTS, the window `awayFromSmallChild` reads off the child's own
     *  `bornWeek`. Drafted at three years (156 weeks): the span the digest's protected ranking runs
     *  for, and the age by which a child stops being carried everywhere. The wave-9 brief names this
     *  as one of the two things T2 was to BRING rather than decide, so it is his with the bench's
     *  numbers beside it (T7).
     *  ⚠ A window and not a flag: nothing is persisted and no save gains a key – the child's row
     *  already holds the only fact this needs. */
```

## `motherhood.returnPoiseCeiling`

```ts
    /** ⭐⭐⭐ W5/T5 – «PRIORITIES SHIFT», AS ROOM RATHER THAN AS A GIFT. The research digest's one
     *  PERMANENT effect («possible permanent mental-resilience bonus after the return») and the only
     *  skill-adjacent number this whole branch is allowed to touch – which is why it ships with a
     *  bench and a spec row (invariant 5) and at a drafted value.
     *
     *  ⚠⚠ IT RAISES HER COMPOSURE **CEILING** AND NEVER HER COMPOSURE, and that shape is round 42
     *  #35's, re-used rather than re-invented: the psychologist's years already buy room above a
     *  rolled ceiling and ordinary development climbs into it. Three things follow that a raw bump
     *  could not give – she EARNS it week by week rather than receiving it, it cannot overshoot, and
     *  it composes with the seat's own bonus without either one needing to know about the other.
     *
     *  ⚠⚠ AND THE CEILING IS THE ONLY SHAPE THAT WORKS AT ALL, which is a measurement and not a
     *  preference: wave 8b's arm 7 walked careers and found a coached one reaching **96–98% of her
     *  own headroom by about twenty-two** (`docs/research/the-unclosable-head-2026-09.md` §7), and
     *  the first child arrives at 24+. A bonus clamped to her rolled ceiling would therefore be worth
     *  almost nothing to almost everybody; room ABOVE it is worth exactly what she then trains into.
     *
     *  ⚠ PER CHILD AND DERIVED FROM `world.children`, so nothing is persisted, nothing can be applied
     *  twice, and a second child adds its own room – with `returnPoiseMax` as the cap so a large
     *  family cannot become a composure strategy. */
```
