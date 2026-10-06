---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The condition block

The comment essays that stood above the `condition` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `condition.recoveryBase`

```ts
    // V2.1 SHIPPED (owner 25.07 "все чуть ниже к концу сезона", same pass as the V2 flip):
    // every MATCH-FREE week recovers this base (was 2) – the free-week ladder is now
    // grinder +1 / balanced +2 / careful +3 via the slider bonus, so every policy ARRIVES at
    // the season wrap below 100 and the off-season + a planner vacation earn their keep.
    //
    // ⚠⚠ 1 -> 8 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §3). THE OTHER HALF OF THE SAME
    // DECISION as the W surcharge reprice below, and it could not be anything else: at the shipped
    // surcharge a rest week would have had to return SEVENTEEN for the owner's season to balance,
    // and that is not rest, that is convalescence. So both dials move towards each other instead.
    //
    // THE NUMBER IS THE SEASON EQUATION'S, not a taste. His design (§1) is twenty events on every
    // second week, fatigue that ACCUMULATES, and «то, что за off-season РЕАЛЬНО восстановить с 1
    // большим или парой небольших отпусков» - which is arithmetic: arrive at the off-season door
    // around 45-50, so twenty play+rest PAIRS cost ~55, so each pair costs ~2.75, so a rest week
    // must return within ~2.75 of what an average event drains. At the repriced surcharge an average
    // professional event costs ~12.5, so the rest week owes ~10 = base 8 + the 60/40 slider's 2.
    //
    // ⚠⚠⚠ THE OWNER RELEASED «ARRIVE AT THE OFF-SEASON DOOR AROUND 45-50» ON 19.09, AND THIS NUMBER
    // IS NOT RE-DERIVED. He said it in as many words: «давай изменим эту цель, если она нам мешает.
    // Цель – отпуска реже, а не после каждого турнира ездить всё-таки»
    // (docs/specs/the-season-equation-2026-09.md §10b). The 45-50 was DERIVED from his holiday
    // sentence above, never given: he has kept the sentence and released the arithmetic reading of
    // it, because the reading turned out to be self-defeating - arriving at 45 means living near
    // empty all year, and living near empty is what crosses `practice.rescueCondition` (80) eight
    // times a season, which is the very complaint the new target is about.
    //
    // WHAT THIS MEANS FOR THE CHAIN ABOVE: it is now the HISTORY of how 8 was chosen, and not a live
    // criterion anybody may re-derive a value from. The bar is holiday FREQUENCY. ⚠ The 8 itself did
    // NOT move with the release - nothing measured asked it to, and the 19.09 pass refused to raise
    // the professional base beside it (§10e: the natural-recovery arms buy ~0.15 holidays a point,
    // because the ceiling discards most of what they pay, and raising it would also undo his own
    // 22.08 ruling below). ONE dial moved instead, and it is the only recovery in the game the
    // ceiling cannot reach because it lands on a week she PLAYS: `masseur.tourRecoveryPerRound`.
    // The vacation table below is denominated in exactly this unit (18/22/26/32/40/48 = 2.2 … 6.0
    // rest weeks at base 8), which is why the two tables have to move in one pass.
    //
    // ⚠ IT IS GLOBAL, SO THE JUNIOR ERA AND THE COHORT GET IT TOO - deliberate, not collateral. The
    // spec moves what a WEEK returns, not what a professional week returns; the junior COST tables
    // are untouched (not one cell of tests/fatigueReference.test.ts's domestic/J rows moves). What
    // does move is how fast anybody comes back, kid and rivals alike, and the rival half is
    // re-measured rather than re-tuned - see `rivalFatigueWindowWeeks` below, whose whole premise
    // ("at recoveryBase 1/week their drain outruns their recovery permanently") this number retires.
```

## `condition.proPhaseRecoveryBase`

```ts
    // ⭐ THE PRO PHASE RECOVERS ON 5, NOT 8 (owner 22.08, variant C of his own proposal: «может
    // быть нам тогда стоит дефолтное восстановление с 10 в неделю на 7 опустить? тогда массажист
    // как раз будет еще немного накидывать, может вполне гармонично получиться»). His 10 = base 8
    // + the 60/40 slider's +2, so his 7 = base 5 – and it applies ONLY while
    // `activeLadderOf === 'wta'` (the masseur's own unlock boundary), read through
    // `recoveryBaseFor` in world/medical.ts. Juniors and ALL 199 RIVALS keep `recoveryBase` above.
    //
    // ⚠ THE GLOBAL DROP (variant B) WAS MEASURED AND REJECTED – docs/specs/the-masseur-2026-08.md
    // §10, 32 paired seeds × 2 presets: B lands 2/3 of its damage outside the place he aimed at
    // (junior condition −1.6..−2.2 at 3.5-5 SEM, +3 bankruptcies across 64 base careers, two
    // careers per preset never turn professional) and the one thing the proposal was FOR – the
    // masseur's uplift – SHRINKS (~40% fewer rehab receipts). C keeps the junior era byte-identical
    // (measured 0.00 ± 0.00 on every metric) and makes the pro grind honestly harder exactly where
    // he pointed. His «накидывать» arithmetic only works here too: base 5 + slider 2 + the entry
    // rung's +1 = 8 for a staffed professional against today's unstaffed 10.
```

## `condition.recoveryAgeFloor`

```ts
    // ⭐⭐⭐ THE FLOOR UNDER THE FADING RECOVERY (the long goodbye §4a, owner 26.08 – «пол 2.5 ок»).
    // From `declineStart` the base above is multiplied by the share of her own peak physical she has
    // left, and this is the lowest that multiplier may go: 0.5, so a professional rest week can never
    // return less than 2.5. His own addition to the spec – «и физика будет падать и восстанавливаться
    // будет дольше» – because until it the only thing age touched was the attribute VALUE: a
    // thirty-eight-year-old drained from a match exactly as fast as a twenty-two-year-old and came
    // back exactly as fast, so the old body was weaker but never tireder, which is backwards.
    //
    // ⚠ IT IS A MULTIPLIER ON `recoveryBaseFor`, NOT A SECOND CURVE. The share is the one §3a already
    // computes for the ending, so the corridor closes continuously – every week, with no steps in it
    // – and no new constant is tuned. `world/medical.ts` is the single place it is spent.
    //
    // ⚠⚠ AND IT IS ALMOST INERT UNDER THE SHIPPED THRESHOLD, which is worth knowing BEFORE anybody
    // reaches for it. The share first falls below 0.5 at ~43, and `ENDINGS.lastOfferPeakShare` (0.55)
    // has ended the career at ~41.2 – so this fires on outliers only (a migrated save, a future dial).
    // It is a safety net, not a balance knob: «nobody should later raise the floor to fix something
    // without noticing it is not currently doing anything» (§4a). ⚠ The ONE thing that legitimately
    // moves it is §6.6's veto – if the fade pushes season injury prevalence further over its band,
    // this rises before anything else is touched.
```

## `condition.matchFatigue`

```ts
    // Per-match drain components (see world.ts matchDrain).
    // MATCH BASE RAISED 1 → 2 (owner decision 26.07, "a simple match should cost 2, not 1"): the
    // BASE moved one rung and hardMatch moved with it, because his rule is unchanged – "+1 for a
    // tiebreak or a third set" – so hardMatch must always be straightSets + 1 (pinned as a pair in
    // tests/fatigueReference.test.ts). extraTiebreaks and tierMatchFatigue are NOT touched, so a
    // SIMPLE match now costs 2 (local) … 7 (j300) and the ceiling is 9 (a three-TB J300 epic).
    // The consequence he asked for: at the shipped ladder C a straight-sets TITLE costs exactly
    // what the pre-round-9 FLAT tournamentStrain charged (local 8 / regional 16 / national 26),
    // while a first-round exit still costs a fraction of it.
    // ONE side effect, deliberate: the practice friendly's max(1, local − 1) used to clamp
    // (max(1, 0) = 1 for every scoreline); it now subtracts for real, so a straight-sets friendly
    // still costs 1 but a 3-setter costs 2 and a three-TB epic 3 (docs/specs/fatigue-reference.md).
    // ⚠ AND THE FRIENDLY NO LONGER READS LOCAL'S SURCHARGE AT ALL (W2-WINDOW): with local at 1 the
    // same formula would have taken the cheapest thing in the game from 1/2/3 to 2/3/4 as a side
    // effect of pricing a tournament WEEK. `resolvePractice` subtracts the surcharge by name now -
    // a practice set against a clubmate has no trip in it - so those three values are pinned to the
    // SCORELINE and cannot move again when Local is re-priced.
```

## `condition.tierMatchFatigue`

```ts
    // Tier surcharge PER MATCH, one step per rung. The J levels are EXTRAPOLATED above national
    // (ladder-up): international travel, time-zone changes and a fortnight away from home make
    // them the most draining weeks she plays. Worst case USED to be a 5-match J300 run at 4 + 5 per
    // match = 45, + the cumulative ladder 6 = 51 condition, and OWNER-TUNABLE: the owner has priced
    // local..national himself, never the J family, so those three are the first numbers the pending
    // tuning pass should look at – all the more so now that the base under them is one rung higher.
    //
    // ⚠ THE W FAMILY IS REPRICED ONE STEP OVER THE J FAMILY (R15-6, owner asked directly 01.08 and
    // agreed the W15 drops were too deep for what the field is today). The original W surcharges
    // (6/7/8) extrapolated "+1 per rung over J300" on the argument that a W15 field is full of
    // adults who do this for a living. MEASURED, it is not - not yet: today's W15 entrant field
    // median sits at position ~53 of 200 on the mixed table (mean skill 50.2) against the J300
    // field's ~20 (53.9), so the softest international field in the game was priced as its hardest
    // week. The W family now steps +1 over the J ENTRY rungs instead (j30 3 -> w15 4), keeping +1
    // per rung inside its own family.
    //
    // ⚠ PRICED FOR TODAY'S SOFT FIELDS, ON PURPOSE, AND THAT IS A DATED DECISION: when the
    // living-field population lands and the W fields become real professionals rather than the top
    // half of a junior table, w35/w100 must be re-priced UPWARD - measured against the actual
    // entrant fields, not guessed. The seam j300 (5) -> w15 (4) DROPS by design and the ladder
    // guard (tests/ladder.test.ts L9) is re-aimed per family to hold exactly this shape: monotone
    // inside each family, and the W family never priced above where its fields actually are.
    // ⚠ W50/W75/WTA125 (W2-LADDER) INTERPOLATE INSIDE THE PRICED FAMILY, THEY DO NOT EXTEND IT.
    // R15-6 pinned the family's ends for today's soft fields (w15 4 .. w100 6), so the two middle
    // rungs land BETWEEN them: the raw interpolation is w50 5 / w75 5.5, and the half rounds UP
    // because the condition accumulator is integer arithmetic end to end ("no fractions", the
    // block note above) - so w75 prices with the prestige pair it schedules like (every 6 weeks,
    // age 17) rather than with the dense pair. Two integers strictly between 5 and 6 do not exist,
    // so the family is monotone NON-STRICT by construction; the ladder guard (tests/ladder.test.ts
    // L9) holds exactly that. The 125 takes w100's 6, NOT a +1 step: R15-6's rule is "priced
    // against the measured field, never extrapolated by prestige", and today a 125 field is drawn
    // from the same merged-table slice as a W100's - when W2-FIELD2's fourth storey makes the 125
    // field real, IT gets re-priced upward with w35/w100, measured, per the dated note above.
    //
    // ⚠⚠ AND NOW THE WHOLE W FAMILY IS REPRICED DOWN INTO THE 2-3 BAND (W2-FATIGUE,
    // docs/specs/fatigue-reprice-2026-08.md §2-3; owner 03.08: «по усталости нам надо комплексно
    // что-то сделать, я чувствую. Значит надо все рычаги потрогать»). R15-6 above moved this family
    // for the FIELD it meets; this moves it for the SCHEDULE she keeps, and those are two different
    // arguments that happen to pull the same lever.
    //
    // THE ARITHMETIC THAT FORCED IT. The surcharge is charged PER MATCH, so the depth of a run
    // multiplies it: of a W35 title's 41 condition, 25 WERE THE SURCHARGE (61%) against 12 of
    // scoreline and 4 of cumulative ladder. Cutting the ladder instead - the intuitive move - buys 4
    // points and costs the story, so the ladder stays (see runFatigueLadderWta). And the owner's own
    // frame is an argument about exactly this number: «это же работа, она привыкла». The surcharge
    // prices international travel, time zones and a fortnight from home - written for a schoolgirl
    // who flies to a J300 twice a year. A professional grinding W35s is conditioned for her own tour
    // and must not pay more per match than that fifteen-year-old does.
    //
    // THE SHAPE IS THE SHIPPED ONE COMPRESSED, never a new table: R15-6's dense pair (w15/w35/w50 at
    // 4/5/5) all land on 2 and its prestige pair (w75/w100/wta125 at 6) on 3, so the family's one
    // internal seam stays exactly where it was and the family stays monotone non-decreasing. W35 = 2
    // is the value the ACCEPTANCE picks rather than the middle of the proposed range: a title (five
    // matches, two of them 3-setters) costs 26 and she comes home at 74%, inside spec §6.3's 70-78;
    // at surcharge 3 the same run costs 31 and she comes home at 69%, outside it.
    //
    // ⚠ SO THE J -> W SEAM NOW DROPS BY THREE, AND A W15 MATCH COSTS WHAT A NATIONAL ONE DOES (both
    // 4). That is the ruling and not an artefact: what this table prices is travel-and-adaptation,
    // and the one girl in the game who does this for a living is the one it should cost least. The
    // guards (tests/fatigueReference.test.ts, tests/ladder.test.ts L9) are RE-AIMED onto the new
    // seam, not relaxed - a decrease inside the family and a prestige re-extrapolation both still
    // fail there.
    //
    // ⚠ THE ENTRY FLOORS DID NOT MOVE WITH THEM, so R15-6's `floor = 30 + 5 x surcharge` pairing is
    // retired (see minConditionToEnter for the argument and the re-aimed guard). Two different
    // questions had been given one answer: what a week COSTS her body, and how fresh she must be to
    // start one.
    //
    // ⚠⚠⚠ AND THE DOMESTIC FAMILY GOES UP BY ONE (W2-WINDOW, owner 03.08: «как для local, Regional и
    // national мы могли бы легко брать больше condition за них, я считаю, это сделало бы вещи чуть
    // сложнее и интереснее»). 0/1/2 -> 1/2/3. The J and W families do NOT move - they were priced
    // last wave against the field and against the schedule, and not one cell of their whole-run
    // tables in tests/fatigueReference.test.ts changes.
    //
    // WHY LOCAL'S 0 WAS THE ONE WORTH FIXING. A surcharge of 0 is not a cheap week, it is NO WEEK:
    // `matchDrain` = scoreline + surcharge, so a Local match cost exactly what a practice set costs
    // and the rung contributed nothing at all to the one resource the game is about. A Local title
    // (three matches) cost 8 of 100 condition against a recovery of 8-10 a rest week, i.e. she could
    // play every Local on the calendar for free and scheduling was not yet a decision. At 1 the same
    // title costs 11, which is still cheap - it should be - but it is a number.
    //
    // THE SEAM GOES FLAT AT THE TOP, AND THAT IS THE RULING RATHER THAN AN ARTEFACT. National is now
    // 3, exactly what J30 costs. What this table prices is the week away from ordinary life, and a
    // National Series week - a 32 draw, five matches, the event the family plans a season around -
    // is the same kind of week as the entry rung of the international tour. It never INVERTS (the
    // guard in tests/ladder.test.ts L9 is re-aimed to `>=` for this table only, and the condition
    // FLOOR table keeps its strict step: 45 to enter a J30 against 40 for a National, because how
    // fresh she must ARRIVE is the different question W2-FATIGUE already separated out).
    //
    // MEASURED, tools/ladder-walk.ts, 6 prospect careers x 8 seasons, before -> after:
    // entries a season 20.8-29.2 (mean 26.2) -> see the wave report; the early domestic seasons are
    // where it bites, which is where the owner asked for it to.
```

## `condition.runFatigueLadder`

```ts
    // CUMULATIVE RUN FATIGUE (owner idea 26.07): matches at a tournament run every day or every
    // other day, so each SUBSEQUENT match of the SAME run costs EXTRA condition on top of its own
    // scoreline drain – the deeper she goes, the more that week grinds her down. The array is the
    // extra, INDEXED BY MATCH-WITHIN-RUN: index 0 = her first match = 0 extra, index 1 = the
    // second match, and so on (world.ts runFatigueExtra / tournamentRunStrain).
    // A run LONGER than the ladder repeats its LAST value – a future draw bigger than the J-tier
    // 32 (5 matches) must never silently cost 0.
    // The owner proposed four ladders and the fatigue bench measured all four
    // (--scenario runfat-a|b|c|d, plus runfat-off for the pre-ladder reference):
    //   A +1,+2,+3,+4 (10 over a 5-match run) · B +1,+1,+2,+4 (8) · C +1,+1,+2,+2 (6) · D +1×4 (4)
    // C – the middle of his range – ships as the default; the bench report is what moves it.
```

## `condition.runFatigueLadderWta`

```ts
    // ⚠ ...AND THE W FAMILY RUNS ON HIS LADDER D (R15-6, owner 01.08: «может быть будет иметь смысл
    // использовать другой кумулятивный механизм для мировой серии, с меньшими надбавками просто. Я
    // несколько тогда предлагал»). He is pointing back at his own four measured ladders above - D
    // is the flattest of them, +1 per subsequent match, 4 over a 5-match run against C's 6 - and it
    // lands on the same finding the surcharge reprice above rests on: today's W fields are the
    // softest international draws in the game, so the professional week grinds a run down GENTLY
    // rather than steeply. Domestic and J rungs keep ladder C untouched (their whole-run tables in
    // tests/fatigueReference.test.ts must not move a cell); the split is per FAMILY, applied inside
    // `runFatigueExtra` (engine/condition.ts) so the kid and the rival cohort inherit it from the
    // one implementation together. A straight-sets W15 title run: 5x(2+4) + 4 = 34, from 46.
    //
    //
    // ⚠ THE TWO BIG RUNGS DO NOT RUN ON THIS LADDER ANY MORE (14.08) – they have their own, keyed
    // on the DRAW rather than the track, because the question stopped being "which family" and
    // became "how many matches fit in a week". See `runFatigueLadderDeep` below and
    // `condition.ts ladderFor`. This array is therefore back to the exact five entries R15-6
    // measured, and every rung that reads it is a 32-draw, so its fifth entry is its last.
    //
    // ⚠⚠ MEASURED ON 19.09 AND DELIBERATELY NOT MOVED – docs/specs/the-season-equation-2026-09.md
    // §10f. The owner named this lever FIRST («слив на глубине хода»), and a concave tail was built,
    // benched at three strengths and works. It is held for his ruling rather than shipped, for one
    // measured reason: the only strength that respects the shape rule he set on 14.08 (see
    // `runFatigueLadderDeep` below – no round of a run may cost less than that run's first round)
    // buys 0.2 holidays a season, while re-pricing all 199 rivals and moving ~40 keys of every
    // frozen career. The strengths that would justify that cost are the ones that break his rule.
    // The arms live in `tools/season-equation.ts` §5 (`--levers`); the grid is the spec's §10e.
```

## `condition.runFatigueLadderDeep`

⚠⚠ 05.10 – SUPERSEDED (round 46 #7). The value is now `[0, 0, 0, 1, 1, 1, 1]`; it runs on the 500, the 1000 and the Slam BY TIER (`MAJOR_RUNGS` in `engine/condition.ts`), and both the draw-over-32 key and the `[-2, -1, 0]` discount below are gone. The owner, 05.10: «по 7 надо сделать разумно, например: 250-12, 500-15, 1000-18, шлем-21 … в 1000 на 1 матч больше, чем в 500, а в шлеме на 2. Мне кажется это справедливая логика.» The name is history; the essay below is the 14.08 chronicle, kept verbatim. Measured and predicted: docs/specs/the-season-equation-2026-09.md §11.

```ts
    /** ⚠⚠ THE OWNER'S OWN CURVE FOR THE DEEP DRAWS, 14.08, given as the two bounds of a match at a
     *  Slam and a WTA 1000 round by round: min 5 6 7 7 7 7 7, max 7 8 9 9 9 9 9.
     *
     *  Against `matchDrain`'s parts (scoreline 2..4 plus the rung's surcharge of 5) that is the
     *  surcharge RAMPING to its full value over three matches instead of landing flat on the first,
     *  so the ladder is the offset: -2, -1, then the tier's own number. The trailing 0 is what makes
     *  the plateau follow `tierMatchFatigue` rather than duplicate it.
     *
     *  WHAT IT COSTS A TITLE. Slam (7 matches) 46 at best, 60 at worst; WTA 1000 (6 matches) 39 and
     *  51. Under the flat surcharge those were 43/57 and 41/53 – so the Slam gets slightly dearer
     *  and the 1000 slightly cheaper, which is exactly what he predicted when he wrote the rows.
     *
     *  ⚠ IT REPLACES A CAP OF MINE THAT MADE A CLIFF. I had stopped charging the surcharge after the
     *  fifth match, which priced the deep rounds at 2 against the shallow ones' 8 – «а сейчас немного
     *  некорректно получается». A plateau is the right shape; a collapse was not.
     *
     *  ⚠⚠ AND THAT REJECTION IS A STANDING SHAPE RULE, WHICH THE 19.09 PASS READ OFF IT AND OBEYED.
     *  The curve he wrote is monotone NON-DECREASING; the 19.09 ruling («немного уменьшить усталость
     *  на глубоких турнирах») asks for the tail to come down, which supersedes that – but «НЕМНОГО»
     *  is the qualifier, and the shape he threw out is the one where a late round costs a fraction of
     *  an early one. The rule that survives both: THE TAIL MAY EASE BACK, BUT NO ROUND OF A RUN MAY
     *  COST LESS THAN THAT RUN'S FIRST ROUND. Benched at three strengths and NOT shipped – see
     *  `runFatigueLadderWta` above for the price, and the spec's §10d/§10f for the ruling it awaits. */
```

## `condition.rivalFatigueWindowWeeks`

```ts
    // RIVALS BECOME REAL (rival-life slice): how many trailing weeks of the results ledger a
    // COHORT player's condition is reconstructed from. The kid carries a persisted `condition`
    // counter; a rival cannot (world.cohort is inside every save, and a new field would cost a
    // schema bump AND re-roll all 199 players), so hers is DERIVED on the fly from the rows she
    // already has – which means the scan has to be bounded.
    //
    // The window is therefore the rival's MEMORY: she carries the last N weeks of competitive
    // load, not her whole career. That is not just an optimisation – it is the knob that keeps a
    // heavy schedule from being an unrecoverable death spiral. Elite juniors enter ~20-30 draws a
    // season (the entrant bands overlap, so the top of the table is a candidate for j30 + j60 +
    // j300 at once), and at recoveryBase 1/week their drain outruns their recovery permanently:
    // an unbounded scan pins the whole top of the cohort at condition 0 for the entire season,
    // which inverts the standings instead of colouring them. Measured on the real calendar
    // (docs + the rival bench): 16 weeks keeps the field's median in the 70s-80s, leaves a real
    // dip behind a deep run, and floors nobody all season.
    //
    // ⚠ W2-FATIGUE RETIRED THAT PREMISE AND LEFT THE NUMBER ALONE, ON PURPOSE. `recoveryBase` is
    // now 8, so an elite rival's recovery no longer loses to her drain and the window is no longer
    // the thing standing between the cohort and a season pinned at 0 - it is now just her MEMORY,
    // which is what the paragraph above says it always was. The re-price's §7 names this window as
    // the owner's, "except where the shared implementation forces a re-measure", so it was
    // re-MEASURED and not re-tuned: the fatigue bench's rival columns (mean cohort condition and
    // the share arriving below `matchStrengthKnee`) are the receipt, reported with the wave.
```
