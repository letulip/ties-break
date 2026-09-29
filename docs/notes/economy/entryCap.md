---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The entryCap block

The comment essays that stood above the `entryCap` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `entryCap`

```ts
  // --- THE ITF ANNUAL ENTRY CAP (docs/research/ranking-points-by-tier.md §2 and §6) -----------
  //
  // Reality's real brake on "just grind cheap international events" is not the points table, it is
  // a HARD ELIGIBILITY CAP: Appendix F of the 2026 ITF World Tennis Tour Juniors Regulations limits
  // how many ITF junior events a player may enter per year, and the limit is tighter the younger
  // she is. The research counted our calendar at ~26 J30s + 17 J60s + 4 J300s a season, against an
  // allowance of FOURTEEN events for a 14-year-old. Wave B measured that zeroing the first-round
  // award did NOT reduce the grind (docs/specs/wave-b-first-round-zero.md) – the count is driven by
  // eligibility, affordability and calendar density, and this is the eligibility half.
  //
  // Counted birthday-to-birthday in the real rule. The game keeps the 52-week SEASON BLOCK as the
  // window – one allowance, reset at the season boundary, which is what the copy promises and what
  // `seasonStartWeek` already defines – and reads the LIMIT off the age she actually is in the week
  // of the event (`kidAgeAt`, world/age.ts).
  //
  // ⚠ THOSE TWO USED TO BE THE SAME SENTENCE AND ARE NOT ANY MORE. This note said the block "IS the
  // real rule's birthday year, because `ageAtWeek` and `seasonStartWeek` are the same arithmetic",
  // which held only for a girl born in the first week of January: everyone else's birthday falls
  // inside a block. Since the one-clock ruling (09.08) the window and the birthday are two facts, and
  // the visible consequence is that her allowance can RISE mid-season on her birthday and never
  // falls – see entryCaps.ts for why that direction is the safe one.
```

## `entryCap.meritIncrease`

```ts
    // ITF Appendix F, verbatim: 16 -> 25, 15 -> 18, 14 -> 14, 13 -> 10, 17 and 18 unrestricted,
    // 12 and under not eligible at all. `default` is the 17+ row; ages below 13 never reach this
    // table because `TIERS[tier].minAgeYears = 13` refuses them first (availabilityStatus asks the
    // age gate before the cap), which is also the honest place for "not eligible" to live.
    //
    // ⚠ AND SINCE §4.1 THE SAME IS NOW TRUE AT THE TOP: ages above 18 never reach this table
    // either, because `maxAgeYears = 18` on the same three rungs refuses them first. So `default`
    // is exactly the 17-18 row it was always meant to be, rather than an open-ended "17+" that
    // quietly also answered for a twenty-five-year-old. The table's domain and the tiers' age
    // window are now the same interval, which is what makes the `default` key honest.
    //
    // ⚠⚠ THE MERIT INCREASES SHIP AT P2 (16.08), AND THE ARGUMENT THAT KEPT THEM OUT IS RECORDED
    // RATHER THAN DELETED, BECAUSE THE BLOCKER IT NAMED WAS REAL AND WAS REMOVED BY SOMETHING ELSE.
    // It ran: "NOT MODELLED, DELIBERATELY – the merit increases. The same appendix grants +4 events
    // to a top-20 ITF junior at 14/15 (+4 to a top-50 at 13), and the WTA rulebook grants a year-end
    // top-5 junior up to 4 extra PRO events. Both are keyed to a world ranking; our field is 199
    // cohort players plus the kid, so 'top 20 of the ITF' has no defensible mapping onto 'top 20 of
    // 200' without an owner decision about what our standings represent. Left out rather than
    // guessed, and left out in the direction that keeps the cap honest (a bonus only weakens it)."
    //
    // WHAT CHANGED IS THAT P1 ANSWERED THE QUESTION, AND ANSWERED IT SOMEWHERE ELSE.
    // `docs/specs/junior-access-2026-08.md` built `yearEndJuniorRank` – a read of PERSISTED history,
    // not a live fold – and keyed the Junior Accelerator on the regulation's own ABSOLUTE rows
    // (1 / 2 / 3 / 4-5 / 6-10 / 11-20) rather than on a share of our table. So the decision the old
    // comment was waiting for has been taken and shipped: in this game a year-end junior rank IS read
    // as the list position the rulebooks name. The merit rows below read the SAME function on the
    // SAME convention; inventing a second mapping here is exactly what that would have been.
    //
    // ⚠ AND THE ONE PLACE THE CONVENTIONS DIFFER IS STATED, NOT SMOOTHED OVER. `JUNIOR_RESERVED`
    // (world/entryCaps.ts) resolves W15's door as a FRACTION of the table, because that door had a
    // shipped difficulty to hold and a rank-vs-points change of unit to survive. A merit bonus has
    // neither: it is additive, it can only ever be generous, and it is the same list the Accelerator
    // reads two lines up. Absolute is the honest reading for it.
```

## `entryCap.proSubCapByAge`

```ts
    /** ⭐ THE SUB-CAP INSIDE THE FOURTEEN-YEAR-OLD'S EIGHT (WTA §X.A.2, quoted in
     *  docs/specs/acceptance-cuts-2026-08.md line 145: *"the WTA's sub-cap of three W75+ events
     *  inside a 14-year-old's eight – a quota, not a door"*).
     *
     *  ⚠⚠ IT CAN BIND AT THE SHIPPED CONSTANTS, AND IT MEASURES ZERO FOR A DIFFERENT REASON –
     *  CORRECTED 26.09 (C-02). The doorway is not what stops it: read `TIERS[*].minAgeYears`
     *  (`season/calendar.ts`; the grid's one prose copy is
     *  `docs/specs/college-is-its-own-branch-2026-08.md` §0a), where a fourteen-year-old is too young
     *  for no W rung at all. What holds the count at zero is the ACCEPTANCE LIST one field over –
     *  `w75.acceptsRank` – which she cannot satisfy at fourteen because she holds no professional
     *  ranking yet. `world/entryCaps.ts`' `proSubCapUsage` is the long version of both halves, with
     *  the measurement (n = 90, 676 weeks: mean 0.0) and the ledger limitation the live case promotes.
     *  The rule is here so that a phase which opens a rung lower does not have to remember it, and so
     *  that the game states the regulation it models rather than a subset of it.
     *
     *  ⚠ THE SUPERSEDED SENTENCE, KEPT AS HISTORY THE WAY `entryCaps.ts` KEEPS ITS OWN. This item read:
     *  *"IT CANNOT BIND AT THE SHIPPED CONSTANTS, AND IT SHIPS ANYWAY – the same choice, for the same
     *  reason, that put 14 and 15 in `proPerYearByAge` and 13 in `meritIncrease.juniorByAge`. W75 opens
     *  at 17 and no W rung above W15 opens below 16, so a fourteen-year-old can reach exactly one
     *  professional rung and it is far below the ceiling this counts. §5 of the spec measures the
     *  zero."* The owner's age-grid ruling of 16.08 moved those floors and this note did not move with
     *  them; `docs/decisions.md` logged it that evening as STILL OUTSTANDING, IN CODE, and it stood 41
     *  days. ⚠ The reason it survived a full gate: `npm run context:audit`'s age-grid guard reads
     *  DOCS, not code, so no gate has ever read this line against `TIERS`.
     *
     *  `fromTier` is a rung, not a list: "at or above W75" is a walk of TIER_LADDER, so a re-ordered
     *  or inserted rung moves with it. */
```

## `entryCap.cappedProTiers`

```ts
    // --- THE PRO AER, PARALLEL AND NEVER MERGED (W2-LADDER §5) --------------------------------
    //
    // The WTA's own age-eligibility rule - the Capriati rule, which exists for exactly our story -
    // gets the PARALLEL structure to the junior cap above: its own capped family, its own age
    // table, its own persisted ledger (`WorldState.proEntryWeeks`, schema v36). The two are never
    // merged because the real rules are two rules: research §4 is explicit that the professional
    // age caps are "separate from and additional to the junior caps", so a sixteen-year-old holds
    // BOTH allowances at once - 25 junior entries AND 12 professional ones - and spending one
    // never touches the other.
    //
    // THE FAMILY is every W rung (the WTA counts professional events, whatever their size); the
    // domestic ladder stays uncapped here for the same reason it is uncapped above - it is ours.
    // ⚠ AND THE ACT-3 RUNGS JOIN IT (W3-ACT2). "Professional events, whatever their size" is the
    // rule's own wording, and a Grand Slam is the most professional event there is - the real AER
    // counts a major against a sixteen-year-old's twelve exactly as it counts a W15. ⚠ THE PARENTHESIS
    // HERE USED TO READ "every act-3 rung opens at 17" AND IT NO LONGER DOES: the owner's age-grid
    // ruling of 16.08 put the four WTA rungs at 15 and the Slam at 14, so the family is capped from
    // fourteen upward and `proPerYearByAge` is the only thing metering it. In practice it still bites
    // for about one season, because the allowance is unlimited from 18 and an acceptance list at
    // #200 or tighter is what a child actually meets up here – the honest amount: the rule is about
    // children, and by the time her ranking clears a 1000's list she is not one.
```

## `entryCap.proPerYearByAge`

```ts
    // The spec's design table (§5): 16 -> 12, 17 -> 16, 18+ unlimited.
    //
    // ⚠⚠ 14 -> 8 AND 15 -> 10 ARE HERE SINCE THE ONE-CLOCK RULING (owner 1, 09.08), AND THE
    // ARGUMENT THAT KEPT THEM OUT IS WORTH KEEPING RATHER THAN DELETING. It ran: "14 and 15 carry 8
    // and 10 in the real rulebook (research §4) and are DELIBERATELY absent here: every W rung's
    // `minAgeYears` is 16+, so availabilityStatus refuses a fourteen-year-old on AGE before the cap
    // is ever consulted - the same 'the age gate is the honest place for not eligible' argument the
    // junior table's note makes about 12-and-under. A rung that ever opens at 14 (the real W15 does,
    // via junior-reserved places) must bring those rows with it."
    //
    // THE ARGUMENT WAS FALSE FOR EVERY GIRL BORN AFTER JUNE, and the reason is the defect the ruling
    // fixes: the gate was asking `ageAtWeek` - the BAND - so a fifteen-year-old born in March was
    // "16" from week 104, the age gate let her through, and the AER then had no row to refuse her
    // with. She entered W15s at 15.83 against an allowance of `default`, i.e. unlimited. Both halves
    // are mended: the gate reads HER age now (world/age.ts), and the table covers the ages a girl can
    // be, so `default` - a rule about adults - can never answer for a child again. The rows are the
    // rulebook's own (research/real-ladder-pace.md: <14 = 0, 14 = 8, 15 = 10, 16 = 12, 17 = 16, 18+
    // unlimited), so the game does not invent a number even where the gate makes it unreachable.
    //
    // ⚠ AND 13 IS DELIBERATELY NOT A ROW, THOUGH THE RULEBOOK HAS ONE (0 events). Two reasons, and
    // the second is a trap. (a) "Not eligible at all" belongs in the age gate, exactly as the junior
    // table's note says of 12-and-under - a 0 in an allowance table is a rule pretending to be a
    // budget. (b) A limit of 0 makes `remaining <= 0` TRUE for a thirteen-year-old who has entered
    // nothing, and `tierOutgrown` (world/ladder.ts) reads precisely that expression to re-open the
    // rungs below her when her pro allowance is spent - so a 13 row would silently disable the
    // ladder's ceiling for the whole first season of every career except a January one. Named here
    // rather than discovered later.
    //
    // NOT MODELLED, DELIBERATELY - the merited increases (a year-end top-5 junior earns up to 4
    // extra pro events). Same ruling as the junior table's: keyed to a world ranking ours cannot
    // honestly map, and the spec names it phase 2 or act 3 ("v1 ships the flat table if the bench
    // says it already paces well" - the boredom-guard receipt in tools/boredom-guard.ts is that
    // bench).
```
