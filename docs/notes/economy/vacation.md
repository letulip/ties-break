---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The vacation block

The comment essays that stood above the `vacation` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `vacation`

```ts
  // --- Season planner: family vacations (spec §2, owner-approved 25.07) -------------------
  // ONE shared catalogue; money is the only gate. A vacation week is a hard blackout (nothing
  // enterable) that pays a condition gain on top of a FREE week's recovery, and the two top
  // packages carry an injury-tau buff for `buffWeeks` weeks (applied POST-draw, so the MAIN
  // stream stays byte-identical). Prices are middle-anchored bands × wealthCorridor, quoted
  // from the `seed:vacation:week:packageId` sub-stream. 1-week packages, bookable back-to-back
  // (2 weeks = deep reset at 2× price – owner approved).
  //
  // ⚠⚠ THE WHOLE TABLE WAS LIFTED 03.08 (W2-FATIGUE, docs/specs/fatigue-reprice-2026-08.md §4;
  // owner: «надо все приподнять»): 12/14/16/20/25/30 -> 18/22/26/32/40/48, prices untouched. It is
  // the same decision as `recoveryBase` and had to move in the same pass, because THIS TABLE IS
  // DENOMINATED IN REST WEEKS: at the new base of 8 the ladder reads 2.2 · 2.7 · 3.2 · 4.0 · 5.0 ·
  // 6.0 rest weeks, which is the shape the spec's §4 table specifies to the decimal. Left at
  // 12..30 against a base of 8 the ELITE week would have been worth less than four rest weeks and
  // the free one barely more than one, i.e. the whole ladder would have quietly become a rounding
  // error the season no longer needed.
  //
  // TWO PROPERTIES IT IS BUILT FOR, both of them tested rather than asserted:
  //   * THE FREE WEEK IS A REAL MID-SEASON TOOL. At 18 the staycation is worth over two rest weeks,
  //     so «в течение сезона она сможет брать мини отпуска на неделю иногда» is a move rather than
  //     a gesture - one week out after a hard block genuinely buys the block back.
  //   * MONEY BUYS RECOVERY SPEED, NOT RECOVERY. 18 -> 48 is the honest-economics thesis applied to
  //     the body: the elite week alone nearly closes a season's deficit and the free one does not.
  //     ⚠ AND THE WEALTH CORRIDOR MUST NEVER SCALE THE GAIN ITSELF - the same package restores the
  //     same condition for every family, exactly as prize money pays the same cheque (the rule
  //     act2-pro-tour.md §3 sets for money). It is true by construction: `resolveVacation` adds
  //     `pkg.conditionGain` flat and the corridor is applied ONLY in `vacationPriceCents`, which is
  //     the one thing about a holiday a family's means may decide. Pinned in tests/planner.test.ts
  //     P3 so it stays true by construction rather than by luck.
```

## `vacation.packages[1].priceCents`

```ts
        // ⚠ W7 PUT A FLOOR UNDER THIS ONE BAND, and only this one. The owner: «Grandma's village
        // регулярно стоит 0 или 3 доллара для 8к, мне кажется там можно какой-то порог цены
        // сделать, но можно и так оставить, в принципе.»
        //
        // HE IS DESCRIBING A REAL RATE, not a bad run. The band was `[0, 50_00]` and `corridorPrice`
        // draws `pickInt(rng, 0, 5000)` then scales by the wealth corridor, so a working family
        // ([0.7, 0.8]) was quoted $0.00-$40.00 uniformly: measured over 104,000 quotes, 1 in 78
        // rendered "$0", 1 in 37 rendered "$3", and 1 in 7 came in under five dollars. That is the
        // package quoting a week away for a family for less than a sandwich.
        //
        // ⚠ AND ZERO WAS NOT MERELY CHEAP, IT WAS A DIFFERENT OBJECT. `bookVacation` carves out the
        // free package twice - `if (priceCents > 0 && funds < priceCents)` skips the affordability
        // check, and `if (priceCents > 0)` skips the expense row - both correctly, for the
        // `staycation` rung that IS free by design. A grandma quote that happened to roll 0 fell
        // through both carve-outs: it was bookable at negative funds and it never appeared on the
        // Money screen's breakdown. The floor makes those two branches mean what they say again,
        // because the only package that can reach them is the one whose band is `[0, 0]`.
        //
        // THE NUMBER IS THE CATALOGUE'S OWN, NOT A TASTE. $30 is the floor of the practice-court
        // rental band a few blocks down this same file ($30-80 x corridor) - this economy's answer
        // to "the smallest thing this family knowingly pays for". A week at grandma's, which the
        // blurb prices as two trains and a bus, cannot honestly cost less than one hour on a
        // practice court. The CEILING is untouched at $50, so the floor compresses the band from
        // below rather than making the package dearer: a working family now sees $21-$40 where it
        // saw $0-$40, and the ladder reads free -> $21-40 -> $105-240 with no rung able to
        // impersonate the one below it.
```

## `vacation.packages[5].uniformPrice`

```ts
        // ⭐⭐ ROUND 42 #49(b) – **SET**, AND THE RULING IS WHAT THE BENCH COULD NOT SEE. His word,
        // 16.09: «высокие тиры восстановлений в одном ценовом коридоре независимо от достатка…
        // пользуются этими восстановлениями уже когда деньги реально есть. Вряд ли семья с доходом
        // 200-300 в неделю туда поедет, а если и поедет – это их выбор.» The #19 note below is kept
        // VERBATIM underneath, because the measurement in it is still true and is still the cost of
        // this line – what changed is not the number, it is the question the number answers.
        //
        // ⚠⚠ WHY THE 4-OF-20 REFUSAL DOES NOT BIND ANY MORE. `tools/r42-elite-retainer.ts` walks its
        // corpus under `econ-bench`'s policy, and that policy books the best package inside 10% of
        // current funds every off-season and every rescue – mechanically, with no view on whether a
        // family like this one would ever choose a clinic. So the four mid-careers it moved are the
        // AUTOPILOT's bookings re-priced, not a player's. His sentence is precisely the judgement the
        // policy does not make, and no arm can supply it: no bench can tell «a family that would
        // never book this» from «a family whose autopilot books everything». That limit is named in
        // docs/specs/elite-retainer-2026-09.md §9 rather than quietly re-measured away.
        //
        // ⚠ AND THE COST IS STILL THE COST. The re-measurement under #49(b) is in that same §9: the
        // mid-careers that never enter the rank band still move, because a discretionary week really
        // did get dearer for them. He has spent it knowingly.
        //
        // ---------------------------------------------------------------------------------------
        // ⭐⭐ ROUND 42 #19 – HIS SECOND NAMED FIGURE, MEASURED AND THEN **NOT TAKEN** (the state
        // this row was in until #49(b), kept because the measurement is the price of the line above).
        //
        // «элитный стоит 830 в неделю… И то же про элит рекавери… 2900». $2,900 is this band's floor
        // times a WORKING family's 0.725 corridor, so «the clinic the pros use» quotes the poorest
        // family in the game a third off - and round 41 P1 already ruled on that shape for coaching
        // («в про карьере с большими чеками цены для всех должны быть равны»). Extending P1 to this
        // rung is ONE LINE: `uniformPrice: true` here. It was built, it typechecks, and it is what
        // `tools/r42-elite-retainer.ts`'s clinic arm switches on.
        //
        // ⚠⚠ IT WAS REFUSED BY ITS OWN MEASUREMENT, AND BY THE HARDEST CONSTRAINT THIS ITEM HAS.
        // Finding 3.2 says the raise must reach the elite tail and nothing else, so the bench
        // partitions its corpus by whether a career ever enters the rank band and reads the wallet
        // delta for the ones that never do. Over 20 such mid-careers (14->20, 6 seeds x 9 presets):
        //   the rank band alone     0 of 20 moved, worst $0        - the constraint, satisfied
        //   the band + this rung    4 of 20 moved, worst $178,701  - the constraint, broken
        // A clinic week is discretionary and one-off, so «only a rich family could buy it» sounded
        // right and is not: a stretched family books one after an injury, and the corridor is what
        // made it reachable. The clean rank gate has no such failure mode because a rank is not a
        // decision the family can stretch for.
        //
        // ⚠ SO THE MECHANISM STAYS AND THE FLAG DOES NOT, and that is the same shape v78's own
        // `sparringHired` note describes: a reader who finds an unused switch here is reading a
        // DECISION with a bench behind it, not a half-built feature. The other reading of his $2,900
        // is on the table too - `resort` at a WEALTHY corridor quotes $2,950, which is nearer his
        // number than this rung's working-family quote - and which of the two he meant is one word.
        //
        // ⚠ ZERO DRAWS EITHER WAY when it is switched on: `corridorPrice` still spends its `pickInt`
        // and its `rng()` on a purpose-scoped sub-stream that persists nothing; only the multiply
        // after them changes.
```

## `vacation.packages[6]`

```ts
      // ⭐⭐ ROUND 29 #5 – THE SEVENTH RUNG. docs/specs/the-shop-2026-08.md §3f, the owner's own
      // idea: «а неделя на яхте (при наличии яхты) вполне может стать новой строкой отпуска,
      // кстати».
      //
      // ⭐⭐ PART TWO #8 PUT IT ON THE GENERAL SHELF (29.08): «она же бесплатная только при наличии
      // яхты, верно? я могу сделать для нее отдельный арт, тогда можно просто на постоянку
      // добавить в ленту сначала с реальной стоимостью, а после покупки яхты это станет
      // бесплатным». So the band below is a real CHARTER price every family is quoted, and the
      // shelf's grant is what zeroes it (`freeOnceGranted` + `grantedVacationIds`, DELIVERED rungs
      // only) – §3f's «the money went years ago and the upkeep is charged every week whether she
      // sails or not» is still the whole reason the owner's quote is 0. A granted quote of 0 walks
      // `bookVacation`'s two zero-price carve-outs (affordable at negative funds, no expense row)
      // unchanged and correctly: nothing is charged, so nothing has to be afforded and there is no
      // row to write. ⚠ His art for the row is coming; until it lands `vacationArtUrl` returns
      // null and the sheet draws the row artless by its documented fallback.
      //
      // ⚠ #9's BAND IS x1.4 OF ELITE'S ([4000_00, 7000_00] -> [5600_00, 9800_00]) – HIS 29.08
      // FIGURE, VERIFIED AGAINST THE SPEC BEFORE USE because he asked rather than decreed
      // («изначально стоит дороже немного (х1.4 вроде мы считали, да?)»). §3f carries exactly one
      // 1.4 and it relates the SAME two objects – the yacht week against the elite programme
      // («about 1.4 elite vacations a week in upkeep») – and no other charter figure anywhere, so
      // his multiplier stands as the figure of record. A charter dearer than the clinic is also
      // the honest ladder: same gain, no injury buff, top of a strictly ascending price ladder
      // (tests/planner.test.ts pins both).
      //
      // ⚠⚠ 48 AND `buffFactor: 1` – THE TUNING QUESTION §3f NAMES, ANSWERED ON ITS FIRST ARM. Its
      // words: «Either it ties with elite and wins on being free, or it beats it slightly and elite
      // keeps a reason to exist that is not price», and its veto: «the yacht must NOT be the
      // strictly best rest week available – if it is, every owner takes it every time and the other
      // six packages die on the same day the yacht arrives.»
      //
      // It TIES with the elite programme on the gain (48, the top of the ladder – §3f's «at or above
      // elite» read at «at») and wins on being free FOR THE OWNER, and ELITE KEEPS THE INJURY BUFF:
      // `buffFactor` 0.85 against this one's 1, riding `buffWeeks: 4`. So the two are not comparable
      // on one axis and neither dominates – a family with a yacht still pays for the clinic in the
      // weeks it wants her tau bought down, which is the only thing money can do that a boat cannot.
      // ⚠ A NUMBER ABOVE 48 WOULD BREAK THAT: it would beat elite on the gain AND on the price, and
      // the buff alone is not a reason to pay $7,000 for a smaller reset. ⚠ AND #8's CHARTER MAKES
      // THE VETO HOLD FOR EVERYBODY ELSE TOO, for free: the boatless family sees the same 48 at a
      // DEARER price and a weaker after-effect, so the clinic keeps its reason on both sides of the
      // grant and the six packages survive the row appearing everywhere.
```
