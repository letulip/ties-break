---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The spirit block

The comment essays that stood above the `spirit` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `spirit`

```ts
  // =================================================================================================
  // ⭐⭐ THE PRIVATE LIFE'S TWO NUMBERS (wave 1) – docs/specs/who-she-is-2026-09.md §4 is the source of
  // truth for every value below, and docs/plans/the-private-life-build.md §§1b/1d is where each one is
  // argued. `spirit` is the WEATHER (how she is this week) and `bond` is the STANDING (what the parent
  // has built with her); neither is ever shown as a number on any surface – the fog rule.
  //
  // ⚠ THEY LIVE HERE AND NOT IN `engine/spirit.ts` FOR THE REASON `condition`'s DO. The balance model
  // is ONE table that the bench, the tests and the engine all read, and a constant hidden inside a
  // leaf is a constant nobody can retune without editing behaviour (CLAUDE.md invariant 5).
  // =================================================================================================
```

## `spirit.attachmentLift`

```ts
    /** ⭐⭐ THE EFFECTIVE BASELINE'S LIFT – `accrueSpirit`'s weekly return walks toward
     *  `baseline + this` while the attachment slot is full (§1b). WIRED BY WAVE 3's T4 (11.09), and
     *  the note it replaces is worth keeping in one line because it was the point: this was DECLARED
     *  IN WAVE 1 AND READ BY NOBODY, deliberately, because the slot did not exist yet – written down
     *  early so that the number stayed HIS and the wave that built the slot could not invent it.
     *
     *  ⚠ IT IS A TARGET AND NOT A BUMP, which is the whole of «lifts a little and stays lifted»: she
     *  arrives at 75 over ~2 weeks through the standing return rule and leaves the same way. There is
     *  no row for it in `perturb` above and there must never be one.
     *
     *  ⚠ AND IT STAYS IN `spirit` RATHER THAN MOVING TO `life` BELOW. The private life merely
     *  SWITCHES this on; the number is spirit's own, it is read by `accrueSpirit` and by nothing
     *  else, and `baseline + attachmentLift < mood.glowingFrom` is a relation between three numbers
     *  that all live here (pinned in tests/spirit.test.ts – it is the reason the value is 5).
     *
     *  ⚠ THE READER IS PINNED, NOT JUST THE VALUE. `tests/spirit.test.ts` used to assert this
     *  constant had NO reader; T4 re-aimed that guard rather than deleting it, and it now asserts the
     *  read happens in `accrueSpirit`'s return target and in no other place in `src/`. */
```

## `spirit.shock`

```ts
    /** ⭐⭐⭐ v75 (the private life, wave 4 – T3) – WHAT AN ENDING COSTS HER, in points of spirit, by
     *  the INTENSITY axis (who-she-is §4's spirit-physics table, verbatim: «break-up shock −22 / −34»).
     *  Keyed by `spiritShock['kind']` so the kinds the build plan's steps 7–8 add land as siblings in
     *  this record rather than as a second table; `'breakup'` is wave 4's and the only one today.
     *
     *  ⚠⚠ THESE TWO NUMBERS ARE **ALREADY INTENSITY-SCALED**, SO THEY GO IN **AFTER** THE SCALE AND
     *  NEVER THROUGH `perturb` – the architect's ruling C (docs/plans/life-wave-4-rulings-2026-09.md
     *  §C), and the reconstruction is written out here because it is the one thing a later reader
     *  cannot recover from the values themselves. They are ONE base of about **−27.5** seen through
     *  `perturbationScale` above: −27.5 × 0.8 = −22.0 and −27.5 × 1.25 = −34.4. A row added to
     *  `perturb` would therefore be multiplied a SECOND time, to −17.6 / −42.5 – two numbers that look
     *  every bit as plausible and are not the design's. `accrueSpirit` adds this on its own line after
     *  the scaled perturbation; `weekPerturbation` has no row for it and must never grow one, which is
     *  pinned in tests/spirit.test.ts in `attachmentLift`'s own guard shape.
     *
     *  ⚠ −34 AND NEVER THE DERIVED −34.375: §4's own two numbers win on drift (the single-source
     *  rule), and the −27.5 above is a reconstruction of where they came from, not their definition.
     *
     *  ⚠ AND IT IS A ONE-WEEK EVENT WITH NO RECOVERY CURVE ANYWHERE BEHIND IT. She takes this on the
     *  week the attachment ends – the same week `activeEpisode` goes null and the effective baseline
     *  drops back to the flat one by itself – and then comes back at `returnPerWeek` and at nothing
     *  else. §4's own prediction for a lifted 75 is the whole of the shape: ~1–2 weeks under the knee
     *  for a steady girl, ~6–7 for an intense one. A second return rate here would be a second
     *  mechanic wearing a constant. */
    /** ⭐⭐⭐ v85 T4 – AND WHAT A BIRTH COSTS HER, THE SECOND BAND, **THE BUILDER'S OWN DRAFT**. T1
     *  parked this cell as `null` with the whole of why in its place («these are two TUNING NUMBERS,
     *  and invariant 5 says tuning is measured and not guessed – T9 benches the wave's constants and
     *  T4 is the kind's only writer»), and T4 is that writer: `landBirth` (`world/lifeBeat.ts` §14)
     *  stamps `kind: 'postpartum'` on the week the child is born. The `null` is replaced, the key is
     *  not moved, and the brief's §4 contract holds – it ships at its drafted value, unruled, and T9
     *  benches recovery weeks by grade with the psychologist on and off.
     *
     *  ⭐⭐⭐ **THE BASE MOVED AT WAVE 8b T4 AND THE SCALE DID NOT – HIS RULING ON D5, 21.09.** The
     *  questions pass put it to him as «the postpartum window is never shorter than a break-up at the
     *  same grade», and he ruled it in. What was wrong is the `warm` column, which this note's own
     *  last paragraph used to defend out loud: wave 8 shipped a supported birth clearing in **3**
     *  weeks against the break-up's **4** for a steady girl, and **8** against **10** for an intense
     *  one. A birth is physically the larger event; support should SHORTEN the window, not take it
     *  under the break-up's floor. So the BASE moves from −30 to **−36** and
     *  `postpartumSupportScale`'s 0.8 / 1 / 1.25 is untouched, which is exactly the shape D5's own
     *  sentence prescribes («the base moves and not the scale»).
     *
     *  ⚠⚠ **WHY −36 AND NOT −35, WHICH IS THE ARITHMETIC MINIMUM.** The floor needs `warm` to reach
     *  the break-up's 4 and 10: she lands at 75 + delta, climbs at 5 (steady) / 3 (intense) a week and
     *  clears at `baseline − shockClearWithin` = 68, so the binding conditions are
     *  `ceil((base × 0.64 − 7) / 5) ≥ 4` → base > 34.375 and `ceil((base − 7) / 3) ≥ 10` → base > 34.
     *  **−35 satisfies both and is not available**: −35 × 1.25 = −43.75, which is HUNDREDTHS, and
     *  `world.spirit` is carried in tenths (`roundTenth` at the end of `accrueSpirit`'s sum) – the
     *  same constraint this note already applied to −37.5. Keeping both products on the meter's own
     *  grid needs a base that is a multiple of 2, and **36 is the first one above 34.375**. ⭐ SO THE
     *  MOVE IS THE SMALLEST THE RULING ALLOWS: at `warm` the two windows come out LEVEL rather than
     *  the birth dwarfing the break-up, which would have been a second, undrafted decision about how
     *  much worse a birth is.
     *
     *  ⚠⚠ THE SHAPE IS `breakup`'s, ONE BASE SEEN THROUGH `perturbationScale`, and the arithmetic is
     *  written out because a later reader cannot recover it from the values: ONE base of **−36**,
     *  −36 × 0.8 = **−28.8** and −36 × 1.25 = **−45.0**. ⚠ BOTH PRODUCTS SHIP EXACTLY, which is where
     *  this parts from `breakup` above rather than contradicting it: §4's own table named −22/−34 in
     *  words and the single-source rule kept them against the derived −34.375. No table names these
     *  two, so there is nothing for an exact product to disagree with, and `world.spirit` is carried
     *  in TENTHS (`roundTenth` at the end of `accrueSpirit`'s sum), so −37.5 is a value the meter can
     *  actually hold.
     *
     *  ⚠⚠ WHY A BIRTH SITS ABOVE A BREAK-UP ON THE SAME AXIS AT ALL – the two reasons the −30 draft
     *  was argued on, both still standing and both now carried further by his D5 ruling. ⚠ The
     *  paragraph is kept in its original terms («why −30 and not −27.5», a 9% gap) because it is the
     *  REASONING that survives, not the number: at −36 the gap is 31%, and it is his ruling that
     *  widened it rather than any of the arithmetic below. Note that the FIRST reason is arithmetic
     *  rather than sentiment:
     *    · **THE ATTACHMENT LIFT DOES NOT LEAVE.** A break-up takes its −22/−34 *and* empties the
     *      slot on the same tick, so the effective baseline falls 75 → 70 and she is climbing toward
     *      the lower number. A birth does neither: the marriage usually still stands, `activeEpisode`
     *      is unchanged, and she climbs toward 75. At an equal base the birth would therefore CLEAR
     *      SOONER than the break-up, and the brief's own sentence about this slot is that the
     *      postpartum window is the LARGER one – «the later, larger window wins». The +9% is what
     *      buys that back: measured below, it puts the middle grade LEVEL with the break-up for a
     *      steady girl and a week past it for an intense one, which is as close to «larger, and not
     *      by much» as a rate of 5 points a week can be made to land.
     *    · the research's row is about the RECOVERY and not about the blow – «support speeds
     *      recovery; pressure → depression risk ↑» (`docs/research/life-events-motherhood.md`) – so
     *      there is no digest number to transcribe here and the base is sized on the recovery it
     *      PRODUCES, which is the quantity T9 can measure and his word can land on.
     *
     *  ⭐ WHAT IT PREDICTS, MEASURED ON THE ENGINE'S OWN WALK (tests/wave8-birth.test.ts §E, a married
     *  career at the lifted 75, psychologist off) rather than computed on paper – weeks from the birth
     *  until `accrueSpirit`'s tail clears the mark:
     *
     *        grade        steady      intense        (wave 8's own, at the −30 base: 3/8, 4/11, 5/13)
     *        warm            4           10
     *        measured        5           13
     *        cold            6           16
     *
     *  against the BREAK-UP's own **4 / 10**, measured on the SAME instrument and on the break-up's
     *  own shape (the episode ends the same tick, so the lift leaves with it) rather than transcribed
     *  – `breakupWeeks` in that file is the arm, added by T4 for exactly this comparison, so the
     *  floor cannot go stale the day the break-up's own band moves.
     *
     *  ⭐⭐⭐ **EVERY CELL IS NOW AT OR ABOVE THE BREAK-UP'S, WHICH IS THE WHOLE OF D5.** `warm` is
     *  LEVEL on both axes (4 and 10), `measured` and `cold` sit above it, and the ordering
     *  `warm < measured < cold` is unchanged on all four voices. ⚠ THE OLD PARAGRAPH'S LAST SENTENCE
     *  IS GONE AND IS NAMED HERE SO THE CHANGE IS NOT SILENT: it read «`warm` is deliberately UNDER it
     *  – a supported birth is an easier week than being left. That is the one place the ordering is
     *  allowed to cross.» It was true of the draft, it was said out loud rather than hidden, and he
     *  ruled the other way.
     *
     *  ⚠ NO SECOND CURVE AND NO RECOVERY TERM – `spirit.ts`'s own «THERE IS NO RECOVERY CURVE,
     *  ANYWHERE, BY DESIGN» is untouched by this row and by `postpartumSupportScale` below, which is
     *  the reason support enters through the MAGNITUDE. See that constant's note for the whole of the
     *  argument, including the mechanical one. */
    /** ⭐⭐⭐ v87 (the weight, wave 11 – docs/specs/the-weight-2026-09.md §5) – AND THE TWO THE
     *  LAST STEP OF THE LAYER ADDS, **DRAFTED**: `loss` −26/−40 and `bereavement` −30/−46. The
     *  reserved seats this record's own header promised («so the kinds the build plan's steps 7–8
     *  add land as siblings in this record rather than as a second table»), taken.
     *
     *  ⚠⚠ THE ORDER IS THE DESIGN AND IT IS STATED IN THE SPEC: both sit deliberately DEEPER than the
     *  break-up and ASTRIDE the postpartum pair (−28.8/−45), «because that is the order the lived days
     *  have». A loss is heavier than a break-up and lighter, at the steady end, than a birth she
     *  keeps; a death in the family is the heaviest thing this layer holds.
     *
     *  ⚠⚠ AND NEITHER BRINGS A SECOND RECOVERY RATE – `spirit.ts`'s standing refusal, which the spec
     *  quotes back at itself: «a second return rate, a «recovering» flag or a taper read off
     *  `spiritShock` would all be the same mistake». The sketch's «longer, asymmetric curve» is
     *  delivered by DEPTH under the one-rate law, and depth is the whole of «longer»: at
     *  `returnPerWeek` 5 (steady) / 3 (intense) and a clear at `baseline − shockClearWithin` = 68, a
     *  deeper landing IS a longer window, arithmetically, with no second number anywhere.
     *
     *  ⚠ THEY ARE ALREADY INTENSITY-SCALED, `breakup`'s own law two paragraphs up: they go in AFTER
     *  the scale, on `accrueSpirit`'s own line, and `weekPerturbation` has no row for either and must
     *  never grow one. ⚠ AND `postpartumSupportScale` DOES NOT TOUCH THEM – it reads
     *  `shock.kind === 'postpartum'` and returns exactly 1 for every other kind, which is what keeps
     *  the support grade a fact about a BIRTH rather than a general softener.
     *
     *  ⚠ BOTH ARE THE BUILDER'S DRAFTS and are flagged here exactly as `perWeekByAge` and
     *  `postpartumSupportScale` are: the spec drafts the ORDER and the bench prices them; his word
     *  finalises. ⚠ BOTH PRODUCTS LAND ON THE METER'S GRID – the constraint `postpartum`'s own note
     *  measured: −26 × 0.8 = −20.8 and −26 × 1.25 = −32.5; −30 × 0.8 = −24 and −30 × 1.25 = −37.5.
     *  `world.spirit` is carried in TENTHS (`roundTenth`), and all four are tenths. ⚠ The steady/intense
     *  pair is written out rather than derived from a base for `breakup`'s own single-source reason:
     *  §5's two numbers win on drift, and a reconstruction is a comment, not a definition. */
```

## `spirit.shock.divorce`

```ts
      /** ⭐⭐⭐ v88 (the parting, wave 12 – T1/T2) – THE MARRIAGE ENDING'S OWN ROW.
       *  ⚠ ⚠ **DRAFT** – the spec (`docs/specs/the-parting-2026-09.md` §3) drafts these two numbers
       *  and says in as many words that his word replaces them at review. Flagged exactly as
       *  `motherhood.perWeekByAge` and `wedding.perWeek` are, and benched in T6.
       *
       *  ⚠⚠ THE ORDERING IS THE WHOLE CLAIM AND THE MAGNITUDES ARE THE DRAFT. §3: deeper than a
       *  break-up (−22/−34), because a marriage is more of a life; not as deep as a death
       *  (−30/−46), because the person is still in the world. Both comparisons hold for BOTH
       *  columns, which is what makes the row a rung on a ladder rather than two free numbers – and
       *  it is the property to preserve if the sizes move.
       *
       *  ⚠ AND THE SPACING IS NOT UNIFORM ON PURPOSE. −27 sits 5 above the break-up and 3 under the
       *  bereavement; −42 sits 8 above and 4 under. The gap to the break-up is the larger one in
       *  both columns because that is the distance the wave is actually claiming: the ending this
       *  row prices had a wedding in front of it, and the one under it did not.
       *
       *  ⚠ NO PER-KIND RECOVERY RATE, and `engine/spirit.ts`'s refusal is older than this member and
       *  binds it unchanged: «a second return rate, a «recovering» flag or a taper read off
       *  `spiritShock` would all be the same mistake». DEPTH is the whole of «longer» – at
       *  `returnPerWeek` 5 / 3 and a clear bar of `baseline − 2`, −27/−42 simply takes more weeks to
       *  climb out of than −22/−34 does, and that arithmetic is the design. */
```

## `spirit.postpartumSupportScale`

```ts
    /** ⭐⭐⭐ v85 T4 – **WHERE `support` ENTERS THE RECOVERY**, and it is the whole of the wave's
     *  «support speeds recovery; pressure → depression risk ↑» (the digest's own row for the return).
     *  A pure multiplier on the postpartum band above, applied ONCE, on the one week the shock lands.
     *  **THE THREE FIGURES ARE THE BUILDER'S DRAFT** – the brief drafts the DIRECTION («`warm`
     *  shortens, `cold` lengthens», §0) and not the size – flagged exactly as `motherhood.perWeekByAge`
     *  and `wedding.perWeek` are, and benched by T9.
     *
     *  ⚠⚠ THE MAGNITUDE AND NOT THE SLOPE, AND THE FILE THAT OWNS THE RECOVERY IS WHAT DECIDES IT.
     *  `engine/spirit.ts` says of the shock, in capitals: «AND THERE IS NO RECOVERY CURVE, ANYWHERE,
     *  BY DESIGN … A second return rate, a «recovering» flag or a taper read off `spiritShock` would
     *  all be the same mistake». A support term on `returnPerWeek` IS a second return rate, by that
     *  sentence's own definition. A support term on the MAGNITUDE is the week's own weather, and the
     *  weeks she then takes to climb out of it fall out of the standing weekly rule – so «support
     *  speeds recovery» is a MEASUREMENT of arithmetic that already existed rather than a second
     *  mechanic wearing a constant.
     *
     *  ⚠⚠ AND THE MECHANICAL ARGUMENT IS THE DECIDING ONE, because it is not a matter of taste:
     *  `support` lives on `world.pregnancy`, and **T5 and T6 CLEAR that record** – the return has to
     *  clear it or W5's repeat pregnancy can never re-enter the gate (`state.ts`'s own note on
     *  `comeback`). A RATE that read `support` would therefore change silently, mid-recovery, on the
     *  week she came back, and a magnitude cannot: it is read on the birth week, when the record is
     *  provably non-null (T4 writes nothing to it, and T5's window opens
     *  `decisionWeeksAfterBirth` weeks later).
     *
     *  ⚠ AND NOT THE CLEAR THRESHOLD, THE THIRD CANDIDATE, which is refused on ruling D's own ground:
     *  `shockClearWithin` is read against the PLAIN baseline because the mark is «a question about HER
     *  recovery, not about who is in her life now». Bending the bar per grade would make «back on her
     *  feet» mean a different number for two girls who feel the same, which is the exact reading
     *  ruling D refused for the attachment lift.
     *
     *  ⭐ THE TWO FACTORS ARE EXACT RECIPROCALS – 0.8 = 1 / 1.25 – so «warm shortens and cold
     *  lengthens by the same factor» is true of the arithmetic and not only of the sentence, and
     *  `measured` is exactly **1**, so the band above IS the measured-grade magnitude and a career
     *  whose parent answered `worry` takes the two numbers as written. ⚠ THE COLLISION WITH
     *  `perturbationScale`'s 0.8 / 1.25 IS THE RECIPROCAL PAIR TURNING UP TWICE AND NOT A SHARED ROW:
     *  that one is keyed by INTENSITY (who she is), this one by the parent's ANSWER, they multiply the
     *  same summand on different axes, and folding them would be a category error. Named here so
     *  nobody folds them.
     *
     *  ⚠ A `null` GRADE READS 1.0 AND THAT IS A PROBE-WORLD COURTESY, not a fourth cell: the
     *  `'expecting'` beat BLOCKS (`LIFE_BEAT_BLOCKING`), so a career cannot tick the ~39 weeks from
     *  the announcement to the birth with the card still up, and `support === null` at a birth is
     *  unreachable in play. `accrueSpirit`'s `??` courtesies are the same instrument. */
```

## `spirit.shockClearWithin`

```ts
    /** ⭐⭐ HOW CLOSE TO HER OWN BASELINE COUNTS AS BACK – the gap `accrueSpirit`'s tail clears
     *  `world.spiritShock` at (the build plan §5 step 4: «clears when spirit ≥ baseline − 2», i.e.
     *  **68**).
     *
     *  ⚠⚠ IT IS SUBTRACTED FROM THE PLAIN `baseline` AND NEVER FROM THE EFFECTIVE ONE – ruling D. The
     *  mark is a question about HER recovery, not about who is in her life now: read against
     *  `baseline + attachmentLift` the bar would be 73, and a shock would then be held OPEN LONGER
     *  precisely because a new romance had arrived, which reads backwards on screen.
     *
     *  ⚠ NAMED RATHER THAN INLINED because this module's own law is that `engine/spirit.ts` invents no
     *  number (its header: «Every constant lives in `ECONOMY.spirit` / `ECONOMY.bond`»). The ruling
     *  writes the bar as `baseline - 2`; this is that 2, with its source on it. */
```

## `spirit.mood`

```ts
    /** ⭐⭐ THE MOOD LADDER'S FOUR CUT POINTS – RULED 09.09, and every one of them is anchored to a
     *  MECHANICAL FACT rather than to taste. The five words they divide are the owner's
     *  (`docs/specs/voice-bibles-2026-09.md` §C, approved); the numbers are his ruling of the same
     *  day, taken over the bench's measured optimum on the reason that moved bars 1 and 3 too:
     *  «the word changes only when something really happened» – wave 1 is quiet on purpose and the
     *  ladder is built for the finished layer.
     *
     *  The four read as two floors and two ceilings around the neutral band, and `spiritBandOf` is
     *  the ONE reader: `< heavyBelow` Heavy · `< dimmedBelow` Dimmed · `>= glowingFrom` Glowing ·
     *  `>= brightFrom` Bright · everything between the two Steady.
     *
     *  ⚠ THE ≥ 2% OCCUPANCY BAR DOES NOT PASS IN WAVE 1 AND THAT IS THE RULED OUTCOME, not a defect:
     *  measured against who-she-is §4a's own distribution these cuts give Steady 90.98% · Bright
     *  6.07% · Dimmed 2.07% · Glowing 0.88% · Heavy 0.00%. Glowing and Heavy are rare-to-absent
     *  until wave 4's break-up shock (−22 steady / −34 intense) gives them their range – a lifted
     *  girl taking −34 lands deep in Heavy and stays there for weeks. The bar moved to wave 4 with
     *  bar 1; see the runbook's §6 list.
     *
     *  ⭐ THE SHOCK SHIPPED IN v75's T3 AND THE ARITHMETIC ABOVE WAS ONE WEEK'S RETURN OUT – the
     *  sentence read «a lifted girl at 75 taking −34 lands at 41», and the MEASURED figure is **38**.
     *  75 − 34 = 41 forgets that the ending frees the slot BEFORE `accrueSpirit` runs, so the return
     *  toward the flat 70 happens first (75 → 72 for an intense girl) and the shock lands on that.
     *  The claim the sentence was making is unchanged and is now a measurement rather than a
     *  prediction: an intense girl is Heavy for EIGHT weeks (38 41 44 47 50 53 56 59, then 62) and a
     *  steady one for three (48 53 58, then 63). ⚠ The «lands at 41» in
     *  `docs/plans/wave-1-the-two-numbers-runbook-2026-09.md` §6 WAS annotated after all
     *  (`a22e7499`, additively – the 41 kept as wave 1's record of its own prediction), so the
     *  earlier reading of this sentence («left alone, the architect's to re-date») aged the day it
     *  was written down; corrected 12.09 by the wave's judge rather than left to mislead.
     *  ⚠ These are not tuning dials: a test that would be easier
     *  with other numbers is a test to rewrite, not a ladder to move. */
```
