---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The sponsor block

The comment essays that stood above the `sponsor` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `sponsor`

```ts
  // Local sponsor cameo. The weekly ROLL is unchanged (draw count!), and round-7 b made the payout
  // NEED-BASED – for everyone else the roll result is ignored (no event), the draws still happen so
  // the main stream is background-independent. Amounts unchanged.
  //
  // ⚠ AND SINCE 10.08 "NEED" IS THE BALANCE RATHER THAN THE PROFILE ROW. `eligible: ['working']` is
  // GONE. The intent was need from the start – docs/rounds/round-7.md, 24.07: «спонсор
  // нужде-ориентирован (платит только working)» – and background was a proxy for it because at the
  // time the two coincided. docs/specs/round15-triage.md measured how far they have since come apart.
  // The owner, 10.08: «порог по деньгам на счету, а не по строчке в анкете – всё именно так, и с
  // самого начала так и затевалось».
  //
  // The predicate is `sponsorNeedMet` in engine/world/sponsors.ts and the whole argument for its
  // SHAPE is written there – why a runway and not a dollar figure, why the court and not the whole
  // bill, why a rung cut and not a spend cut. The numbers, and only the numbers, are here.
  // Measured in docs/specs/need-not-background-2026-08.md (tools/runway-probe.ts, tools/two-cells.ts).
```

## `sponsor.amountCents`

```ts
    /** ⭐⭐⭐ THE CHEQUE, AND IT IS THE CHEQUE AGAIN – ROUND 42 #47, SECOND READING (16.09).
     *
     *  ⚠⚠ THE FIRST READING OF HIS RULING WAS WRONG AND THIS BAND IS THE THING IT BROKE. #47 read
     *  «давай что-то вроде 60-80% закрытия» as the SIZE of the cheque and replaced this band with
     *  `shortfall × U(0.60, 0.80)`. He meant the FREQUENCY – «помощь должна срабатывать в 80%
     *  случаев примерно» – and said so plainly on 16.09, along with what was actually broken:
     *  «у нас был механизм, который нормально давал денег, нормальными суммами, просто делал это без оглядки
     *  на общий бюджет семьи, а смотрел только на кошелек. Это надо было исправить.»
     *
     *  ⭐ WHY THIS BAND IS THE RIGHT SIZE, MEASURED RATHER THAN REMEMBERED. A J-series trip costs
     *  **$1,100–3,600** before staff fares (`TIERS`, season/calendar.ts: j30 $200 + $900–2,000,
     *  j60 $250 + $1,100–2,400, j300 $400 + $1,600–3,200), and the J years are the stretch he named
     *  – «для семьи 8к самый сложный период это J серия, а там стоимость радикально другая». So this band
     *  covers **a third to a half of one trip**, which is what «нормальные суммы» means; the gap
     *  fraction paid a median **$129**, or 4–12% of a single trip.
     *
     *  ⚠ THE GAP IS STILL THE TRIGGER, IT IS JUST NOT THE SIZE. `unpayableTrip` gates whether a
     *  cheque is written at all (`world/phaseFinance.ts`) – «в край нужды для закрытия поездок» is his
     *  and it survives intact. And the cheque is deliberately NOT capped at the gap: a gift sized to
     *  what a trip costs is the mechanic, and a residual is not.
     *
     *  ⚠ The remaining half of his ruling – 60–80% of NEED CASES receiving help, against about 4%
     *  today – is a CADENCE question that needs a bench, and it ships with the chemistry/sparring
     *  wave. See docs/specs/cameo-gap-closer-corrected-2026-09.md §3. */
```

## `sponsor.cooldownWeeks`

```ts
    // ===============================================================================================
    // ⭐⭐⭐ ROUND 42 #5 – THE CADENCE DIAL. PROPOSED NUMBERS, HIS TO CONFIRM OFF THE PRINTED TABLE.
    // ===============================================================================================
    //
    // THE OWNER, 15.09: «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели».
    //
    // ⚠ HIS IMPRESSION IS THE DESIGN'S OWN NOISE AND NOT A DEFECT IN THE GATE. Measured before the
    // change (tools/sponsor-cadence.ts): the cameo was a MEMORYLESS weekly Bernoulli at
    // `rollChance` with NO cooldown and NO per-season cap of any kind, so P(gap <= 4 weeks) = 1 −
    // 0.94⁴ ≈ 22% and a working family – for whom the runway gate has zero hysteresis and therefore
    // stands open every single week – collected ≈ 2.9 payments ≈ $2,940 a season. Three cheques in
    // ten weeks is what a memoryless process looks like; it is also what «засыпает» looks like.
    //
    // ⚠⚠ BOTH NUMBERS BELOW WERE A PROPOSAL AND THE PRINT WENT TO HIM. The prediction was written
    // down BEFORE the arm was run (invariant 5) and lives in docs/specs/sponsor-cadence-2026-09.md;
    // the measured column is beside it in the same table.
    //
    // ⭐⭐⭐ ROUND 42 #43 – HIS RULING OFF THAT TABLE, 15.09: «сними потолок, а кулдаун давай 4».
    // Both halves land here and the second one HAS A CONSEQUENCE HE WAS TOLD ABOUT RATHER THAN LEFT
    // TO FIND: his original complaint was «раз в 3-4 недели», and a cooldown of four sets the floor
    // of the gap at EXACTLY four weeks – so a four-week gap is still legal and only the one-, two-
    // and three-week clusters are structurally gone. The measured share of gaps that land on that
    // floor is in the spec's §5 ledger. If the cadence still reads as too fast in play, this is one
    // constant and nothing else moves.
    //
    // ⚠ AND `seasonCap` IS GONE ENTIRELY – the constant and its reader. It was never a second
    // opinion about the cadence, it was a wall against the tail; he took the wall off, so the walk
    // in `cameoWillingWeeks` no longer counts a season's cheques at all. The cooldown is the whole
    // mechanism now, which is also why the dial he would move next is unambiguous.
    /** ⭐ THE SHOP'S OWN PATIENCE: no second cheque inside this many weeks of the last one. FOUR is
     *  his number (round 42 #43) – at `rollChance` the renewal mean is 1/p + 4 ≈ 20.7 weeks, about
     *  two and a half cheques in a season that never refuses one. ⚠ The floor it sets is four, not
     *  five: see the block above. */
```

## `sponsor.runwayWeeks`

```ts
    /** HOW MANY WEEKS OF COURT HIRE THE BALANCE MUST NO LONGER COVER for a shop to chip in.
     *
     *  ⚠ 62 IS THE MIDDLE OF A MEASURED BAND, not a chosen figure, and both of its walls are numbers
     *  rather than opinions (50 seeds x 4 seasons on the round-15 2x2, plus a ten-arm rung sweep):
     *    * NOT BELOW ~58, because under that the gate pays the `middle` background MORE of the cameo
     *      than the `working` one and the difficulty setting inverts. The crossover measures at 55-56
     *      and it is the wealth corridor doing it: a middle-market court costs more, so the same
     *      balance buys fewer weeks of it. What puts working back on top above the crossover is the
     *      thing that should – it opens the game $17,000 poorer.
     *    * NOT ABOVE ~68, because past that the two SELF-COACHED cells start collecting it, and they
     *      are the definition of a family that does not need it: they finish four seasons at +$25,626
     *      and +$39,001 and neither goes under water once in 50 careers. They cross 2% of weeks at 72
     *      and reach 10% at 90.
     *    * AND NEVER ABOVE 81 whatever else is true: 81.5 is the worst week-0 runway any eligible cell
     *      holds over 50 seeds, and NOBODY IS IN NEED BEFORE A BALL IS STRUCK. That is round-15 item
     *      16 in one number - the cameo paid the owner's own career in week 2 - and it is the one
     *      bound here that is a correctness condition rather than a balance preference.
     *
     *  ⚠ IT IS DENOMINATED IN COURT WEEKS, WHICH ARE NOT MONEY WEEKS. The court is roughly a quarter
     *  of what a family actually spends in a week (measured: $77 of a $335 week self-coached, $92 of
     *  $357 with a middle coach), so 62 court weeks is nearer 15 weeks of the real burn. The unit is
     *  the court because the court is the part she cannot get out of; the number is 62 because that
     *  is where the band is. */
```

## `sponsor.maxCoachTier`

```ts
    /** ...AND ABOVE THIS RUNG NOBODY CHIPS IN, however empty the account (owner, 10.08: «у нас есть
     *  маркер трат в неделю, если тренер стоит дороже, то нечего и помогать»). A shop backs the girl
     *  whose family is doing this on a shoestring, not the one that has hired the best coach in the
     *  city – a story rule first and an anti-exploit second.
     *
     *  ⚠ `middle` AND NOT LOWER, because the owner's own two careers are 8k self-coached and 25k
     *  middle and both stay inside it. ⚠ AND NOT HIGHER, because `high` and `elite` are exactly where
     *  a need gate would start paying for the coach: measured at this threshold, a `high` rung holds
     *  the cameo's gate open for 99% of a working career's weeks and an `elite` one for 100% – against
     *  53-60% at `middle`, 9-14% at `budget` and 1-2% self-coached.
     *  The rung ladder's own comment already says what the top of it is – "The steps between them
     *  shrink as they climb while the price roughly doubles every two rungs. Elite is a luxury, not an
     *  optimisation" – so cutting above `middle` reads a property `ECONOMY.coach` asserts about itself.
     *
     *  ⚠ THE CUT IS ON THE RUNG AND NOT ON THE WEEKLY DOLLARS. See `sponsorNeedMet`: the corridor
     *  prices the same rung differently by background, so a dollar cut would refuse a wealthy family's
     *  `middle` coach and allow a working family's – background back through the side door, in the one
     *  mechanic this wave exists to take it out of. */
```
