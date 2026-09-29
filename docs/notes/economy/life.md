---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# The life block

The comment essays that stood above the `life` constants in `src/engine/economy.ts`, moved here verbatim (T7.3 of the principles fix). The source keeps each constant's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to its heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## `life`

```ts
  // =================================================================================================
  // ⭐⭐ THE PRIVATE LIFE, WAVE 3 – «SOMEONE EXISTS»: WHETHER HE ARRIVES, AND WHEN THE PARENT HEARS
  // =================================================================================================
  //
  // ITS OWN BLOCK BESIDE `spirit` AND `bond` for the reason those two are beside each other rather
  // than nested: three numbers, three rules. Spirit is weather, bond is a relationship, and THIS is
  // a biography – a thing that happens to her once and then stays happened.
  //
  // ⚠ EVERY VALUE BELOW IS SOURCED TO `docs/specs/who-she-is-2026-09.md` §4 («The numbers – all
  // proposals for the bench»), and THAT TABLE WINS ON ANY DRIFT. Two of them are the architect's
  // concretisations rather than the spec's own rows and are marked ⚠ where they sit – they are
  // bench-visible by design, so his word can move them without touching a line of design.
  //
  // ⚠ THE LIFT THAT BELONGS TO THIS LAYER IS NOT HERE. §1b's effective-baseline constant lives in
  // `spirit` above, because it is a SPIRIT number that this layer merely switches on; wave 3's T4
  // wired it where it already stood, and it stays there. ⚠⚠ THE BRIEF'S §4 TABLE LISTS IT UNDER THIS
  // BLOCK AND THE BRIEF IS WRONG ON THAT ROW – moving it would break the two pins in
  // tests/spirit.test.ts that hold `baseline + attachmentLift < mood.glowingFrom`, which is the
  // relation the value 5 comes from, and it would buy nothing.
```

## `life.endsMult`

```ts
    /** ...and how hard each girl leans on THAT (who-she-is §4's `end` column, verbatim).
     *
     *  ⚠⚠ A TABLE OF ITS OWN AND **NEVER** `temperamentMult` OVERLOADED – the architect's ruling E
     *  (docs/plans/life-wave-4-rulings-2026-09.md), and it is the kind of mistake that ships. The two
     *  columns are genuinely different numbers in the same table: reusing the arrival record would
     *  make a fiery girl's break-ups ×1.6 instead of ×1.5 and a deep girl's ×0.5 instead of ×0.9,
     *  silently, with both values looking plausible to a reader who never opened the spec.
     *
     *  ⚠ AND THE TWO COLUMNS DO NOT EVEN AGREE ON THEIR ORDER, which is the design speaking: openness
     *  owns the MEETING (fiery and sunny meet people often), intensity owns the BREAKING (fiery ×1.5
     *  and deep ×0.9 are the two intense girls, quiet ×0.35 the one who holds on). §4's «expected
     *  biography» column is this table's other face – fiery ~0.7 seasons against quiet ~3 – so a
     *  number moved here moves a census bar in T7 and is never a local tweak. */
```

## `life.cooldownWeeks`

```ts
    /** THE WEEKS AFTER AN ENDING BEFORE ANYONE MAY APPEAR AGAIN (who-she-is §4, the `cooldown`
     *  column).
     *
     *  ⭐⭐ LIVE SINCE v75 (wave 4, T2), AND THE NOTE IS RE-AIMED RATHER THAN DELETED so the dormant
     *  year cannot be mistaken for a cancellation. It read «UNREACHABLE IN WAVE 3 AND SHIPPED ANYWAY:
     *  nothing in this wave writes `endedWeek`, so no career can ever be inside a cooldown – it lands
     *  now, with its tests, so that wave 4 (which writes the endings) changes nothing here.» That is
     *  exactly what happened: `endEpisode` (world/loveEpisodes.ts) now writes the date, clause 3 of
     *  `arrivalEligible` bites for the first time, and NOT ONE CHARACTER of the gate or of this row
     *  had to move for it. ⚠ The ordering does the rest by construction – `rollEnds` runs BEFORE
     *  `rollArrival` in the same tick, so the week an attachment ends is a week the cooldown already
     *  refuses, and nobody can arrive on the afternoon of a break-up. */
```

## `life.lag`

```ts
    /** THE RAW FEED LAG, in weeks, by her OPENNESS REGISTER (who-she-is §4, «Feed lag», verbatim:
     *  open – 0 with p 0.70, else uniform 1..4; private – 0 with p 0.10, else uniform 2..12).
     *
     *  ⭐⭐ THE OPEN ROW MOVED ON 11.09.2026, AND IT MOVED BECAUSE A BAR MISSED – not because anybody
     *  preferred the shape of it. T11's arrival census (§4a's wave-3 entry) measured the open
     *  late-share at **44.0% against its own ≤ 25% bar**, and it measured the CAUSE beside it: the
     *  RAW draw, before `bondShave` touches it, was already **57.4% late** (nominal 55.0% – the old
     *  row's own «0 with p 0.45»). That is 2.3× the bar with no shave in it at all, so no setting of
     *  the shave could ever have reached the corridor; ≤ 25% needs p(raw = 0) ≈ 0.75 for an open
     *  girl. The finding went to the owner as a finding and he moved the TABLE rather than the bar
     *  («двигать таблицу – ок»): **open now means the parent usually hears at once.**
     *
     *  ⚠ THE BAR ITSELF DID NOT MOVE AND MUST NOT (invariant 5: numbers are measured, never
     *  adjusted). ≤ 25% / ≥ 60% are still what `tools/life-arrival.ts` prints against, and §4a
     *  carries the re-measurement under the moved row, old numbers beside the new ones.
     *
     *  ⚠ INDEXED BY THE REGISTER SHE WAS BORN WITH, not by the `wants` she drew for this particular
     *  attachment. The two are separate facts on separate keys and are free to disagree; §4's own
     *  neighbouring row («open girls draw `open` at ~70%») is what settles which sense of the word
     *  «open» each table is keyed on – there the girl, here the girl.
     *
     *  ⚠ RAW, and the bond band shortens it afterwards (`bondShave`). This is the world's dice; the
     *  shave is the parent's history. */
```

## `life.smallTalkPerWeek`

```ts
    /** ⭐⭐ TIER-1 SMALL TALK, PER WEEK, BY BOND BAND (wave-3 brief §4's last row, verbatim) – ⚠ THE
     *  ARCHITECT'S PROPOSAL AND MARKED AS ONE THERE, bench-visible, NOT a ruling. It is sourced to
     *  who-she-is §5b's frequency column, which is prose rather than a number: «a few per season at
     *  `close`; none at `cold`».
     *
     *  ⭐⭐ READ AT RUNTIME AGAIN SINCE v74 T15 (11.09.2026), AND THE NOTE IS RE-AIMED RATHER THAN
     *  DELETED so the interim state cannot be mistaken for a cancellation. These two numbers shipped
     *  DECLARED AND NOT REACHED for one commit – the owner's «вариант 3» took the raise out while
     *  §5b's «soft – answerable, never lost» had no surface to be answerable ON. T15 built the
     *  surface (a Home card, a per-kind `blocking` flag, a 3-week derived TTL), so `rollSmallTalk` is
     *  called again from `world/phaseHerWeek.ts` and the hazard is live. ⚠ THE RULING THAT CAME WITH
     *  IT, kept where the numbers are: NO AGE GATE. She talks at any age; tier 1 is texture, not part
     *  of the romance layer – `smallTalkEligible` has none and must not acquire one.
     *
     *  ⚠⚠ THE TWO ZEROES ARE A SHORT-CIRCUIT AND NEVER A COMPARISON. `rollSmallTalk` returns before
     *  `seed:life:smalltalk:<week>` is ever derived when the chance is 0, exactly as `rollArrival`'s
     *  gate does – an ineligible week takes ZERO draws (T3's load-bearing rule, inherited whole).
     *
     *  ⚠ AND «NONE AT COLD» IS THE DESIGN RATHER THAN A FLOOR: at `strained` and `cold` the silence
     *  IS the line (§5b's own sentence). There is no flat pool for this beat, because a beat that
     *  never fires needs none. */
```

## `life.smallTalkTtlWeeks`

```ts
    /** ⭐⭐⭐ v74 T15 – HOW LONG A SOFT ROW STAYS ANSWERABLE: THE RAISE WEEK AND THE TWO AFTER IT
     *  (who-she-is §5b's SOFT BLOCK CONCRETIZED amendment, 11.09: «a soft row is live for 3 weeks
     *  (the raise week + 2)»).
     *
     *  ⚠⚠ LIVENESS IS **DERIVED** FROM `week − row.week` AND IS NEVER STORED – `activeEpisode`'s own
     *  discipline, and the reason is the same one the queue gives for having no `pending` boolean: an
     *  «expired» flag beside a week number is one fact with two sources of truth, and the two desync
     *  the first time a migration, a load or a command touches one and not the other. `liveSoftBeat`
     *  (world/lifeBeat.ts §1) is the one reader, and there is no new persisted field anywhere in T15.
     *
     *  ⚠ 3 IS «THE RAISE WEEK + 2» AND THE COMPARISON IS STRICTLY `<`: at `week − row.week` of 0, 1
     *  and 2 the card is up; at 3 the moment has passed, the card goes and nothing asks. The ROW
     *  stands forever either way – answered, or expired with `answer: null`, which is the honest
     *  record that she came and it went unasked («never lost = the ROW, not the chance»). */
```

## `life.smallTalkCapPerSeason`

```ts
    /** THE HARD CAP PER SEASON (brief §4: «cap 4/season»), counted off `lifeLog` itself.
     *
     *  ⚠⚠ THE LOG IS THE COUNTER AND THERE IS NO NEW STATE – who-she-is §5b's line item 6 («caps
     *  without new state – tier-0/1 frequency per season derived from `lifeLog` counts»). A counter
     *  field beside a record that already answers the question is one fact with two sources of
     *  truth, which is `pendingLifeBeat`'s own doctrine applied to frequency.
     *
     *  ⚠ THE COUNT IS `'small-talk'` ROWS OF **THIS** SEASON AND NOTHING ELSE. `lifeLog` also holds
     *  `'fork-opinion'` and `'met'` rows, and a naive length would cap her small talk on the week
     *  she was told there is someone. */
```

## `life.forkStop`

```ts
    /** ⭐⭐⭐ v74 T17 – WHAT IT TAKES FOR HER TO WANT TO STOP (the owner's ruling of 11.09, made on
     *  his own playtest: his world #5, healthy, close home, met «I want to finish» at eighteen).
     *
     *  ⚠⚠ THE SHAPE IS THE RULING AND THE THREE NUMBERS ARE **DRAFT FOR THE BENCH**, in exactly the
     *  sense §4's other rows are: `stop = floor + gainWorn × worn + gainStrained × strained`, read
     *  by `forkWantWeights` (world/lifeBeat.ts §2) and by nothing else. Before this the `stop` weight
     *  was `lean(worn)`, which is 1.0 at its floor – so the least stop-shaped girl the game can
     *  produce still met the question at ~22–25%, and a quarter of all players were told at the
     *  biggest moment of the career that she wanted to finish, with no root they could read.
     *
     *  ⚠ THE TAIL IS PRICED, NOT REMOVED. `floor` is ε > 0 and must stay so: the Barty ending – she
     *  is whole, she is winning, and she is done – is a FEATURE, and any girl may still want any of
     *  the three. What the floor buys is its RARITY: unsupported (worn = strained = 0) it reads
     *  ~3–4% at every standing, which is an eighteen-year-old's rarity rather than a quarter.
     *
     *  ⚠ `strained` IS THE MIRROR OF `close` and is measured off the distance BELOW `bond.start`,
     *  exactly as `close` is measured above it – so 70 is neutral in both directions and a neutral
     *  home leans nothing. The two gains are ordered deliberately: being worn out weighs more than
     *  being far from the parent, because the season is what she would be stopping. */
```

## `life.forkStopDriverFrom`

```ts
    /** ⭐⭐ THE DRIVER'S THRESHOLD – the one number that decides which ROOT her stop line and the
     *  coach's counsel are worded from (`worn > this` → `'worn'`, else `strained > this` →
     *  `'strained'`, else `'own'`).
     *
     *  ⚠⚠ IT IS SPENT ON WORDING AND ON NOTHING ELSE. The driver never re-weights the draw it
     *  explains: `forkWantWeights` reads `forkStop` above and never this, and the same (standing,
     *  spirit, bond) produces the identical three weights whether or not anything asks for a driver.
     *  `tests/wave3-stop-want.test.ts` §B is the pin that says so.
     *
     *  ⚠ 0.15 IS «SOMETHING REAL RATHER THAN ROUNDING»: at 0.15 the stop weight has moved by 0.375
     *  (worn) or 0.30 (strained) off its floor, which is already three times the floor itself – so
     *  the wording claims a root only where the arithmetic actually leaned on one. Below it she is
     *  the Barty case and the copy says so. */
```

## `life.walls`

```ts
    /** ⭐⭐⭐ HER WALLS AND HER REGULATION – who-she-is §2a's leanings, their hysteresis and the hazard
     *  that flips a pole (v76, wave 5's T7). The one reader is `driftWalls` (engine/spirit.ts).
     *
     *  ⚠⚠ THE HOME IS `ECONOMY.life` AND NOT `ECONOMY.psychologist`, AND THAT IS A DELIBERATE
     *  DEPARTURE FROM THE WAVE-5 BRIEF'S §4 HEADING («home: `ECONOMY.psychologist`, one block beside
     *  `ECONOMY.masseur`»), REPORTED RATHER THAN DONE QUIETLY. The seven numbers below are read on
     *  EVERY career, including the great majority that never hire anybody – walls rise from neglect
     *  itself, «no purchase, no work» (§2a), and repair is FREE (§0.3: «the seat only ever
     *  ACCELERATES the road home. Gating any part of that road behind the retainer is a design
     *  violation»). A constant whose reader runs on a seatless career, filed under the seat's price
     *  list, would read as a paywall in the one place the layer's own law says there is none. The
     *  three numbers that really ARE the seat's – the O6 slow-down, the `'herself'` acceleration and
     *  the beyond-baseline hazard scale – are in `ECONOMY.psychologist` beside `recoverySlope`, where
     *  they belong, and each names this block.
     *
     *  ⚠⚠ ALL SEVEN ARE PROPOSALS AND NONE IS RULED – the wave-5 brief §4's «Proposals – NONE ruled,
     *  all bench-priced predicted-first, his word after». Six are the brief's own; `leanMax` is the
     *  seventh and it is the BUILDER's, argued at its own entry.
     *
     *  ⚠ THE SIGN CONVENTION IS THE ARCHITECT'S RULING N AND IS NOT NEGOTIABLE HERE: the lean is
     *  ABSOLUTE and zero is her NATURE. Negative = more private / more intense (walls up,
     *  dysregulated); positive = more open / more steady (beyond her own baseline). `driftWalls`
     *  carries the whole of it; these are only the magnitudes. */
```

## `life.walls.leanMax`

```ts
      /** ⚠⚠ THE MAGNITUDE CAP ON THE LEAN, ±. **THE BUILDER'S ADDITION, NOT THE BRIEF'S** – §4 names
       *  six walls numbers and this is a seventh, added because without it §2a's own law is
       *  ARITHMETICALLY FALSE and reported to the architect as such rather than slipped in.
       *
       *  §2a: «the road back always exists – a closed-again girl can be opened again … A career can
       *  round-trip; that sentence is earned drama». Unbounded, a career that grinds 300 weeks at a
       *  `strained` bond reaches −450, and the walk home is then 450 weeks at `repairPerWeek` – about
       *  nine years, which is longer than the game. The round trip would be a sentence in a spec and
       *  unreachable in play, and nothing in the engine would ever say so.
       *
       *  ⚠ 100 IS SIZED AGAINST THE TWO THRESHOLDS IT HAS TO LEAVE ROOM FOR, not picked round: the
       *  deepest hole is 100 weeks of free repair back to nature (~two seasons) and 60 weeks back to
       *  the release band, so neglect still costs her real seasons of the LADDER – ruling N's «she
       *  must be walked back to 0 before a single point of growth can be bought» keeps its teeth –
       *  while the round trip stays inside one career. It is also the reason the accumulator cannot
       *  drift into a serialised number nobody bounded. A PROPOSAL like the six above; T10 prices it. */
```
