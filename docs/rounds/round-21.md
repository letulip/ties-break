# Round 21 – a full playtest on the 128-draw build, 12 items (14.08.2026)

Measured against `tennis-sim_ines-xgv7_w362.tsave` – his own save, read locally, never committed,
never a fixture. Played on `main` at `6c7507b`, i.e. the first playtest that carries today's
opener-price and real-draw waves.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not).

- [ ] **1. «Загрузка сейва, нужен диалог, подтверждающий намерение, особенно актуально, если сейв
  перетирает существующий.»** – BUILD. Importing a save is destructive and currently silent. Wanted:
  a confirm step before the import lands, and it must say plainly WHEN it is overwriting a career
  that already exists rather than warning identically in both cases.
- [x] **2. ⚠ REOPENED, THIRD ASK. «Тренер всё ещё не едет на соревнования, как так? Уже 3й раз прошу
  сделать»** – BUILD. Round-20 #1 answered this with an explanation instead of a build: the mechanic
  was measured in three versions on 30.07, all three failed, he cancelled it, `docs/decisions.md`
  recorded the consequence, and I relabelled the toggle to say why it will never open.
  **Asking a third time overrules that cancellation.** `setCoachOnEventWeeks` still has no caller
  anywhere in `src/`. This time it gets wired, and the toggle has to do something on his screen.
  → ⚠ **NOT BUILT THIS ROUND, AND HE RULED ON IT MID-ROUND – IT IS ITS OWN WAVE.** I put the three
  measured failures to him as a choice; his answer moved the ground: «прибавка к силе матча сделала
  элитные результаты ХУЖЕ – это на старых измерениях? мы построили новый стенд, надо актуализировать
  данные. Присутствие в потоке и трансляции точно надо (если едет), но бонус какой-то тоже нужен, я
  считаю. А может и не один даже.»
  - He is RIGHT that the verdict is stale. The three arms were measured 30.07 (commit `77e08aa`) on
    the OLD bench – the one `the-wall-2026-08.md` §6-§7 later showed never got anyone ranked. Every
    absolute economy verdict from that bench is suspect (task #89), and this is one of them.
  - So the wave is three steps in order: **(1) re-measure all three arms on the rebuilt bench and
    today's draws** – a boolean bonus, a run-fatigue discount, a match-strength edge; **(2) build
    PRESENCE unconditionally** – he goes, it costs, and it is visible in the tournament flow, the
    running commentary and the week's story; **(3) attach whatever survives (1), possibly more than
    one**, because that is what he asked for.
  - Presence is also where the still-open «travel notification» from 08.08 finally becomes true:
    `docs/decisions.md` records it as unbuildable while travel could never happen. It can now.
  → ✅ **STEPS (1) AND (2) SHIPPED. THE BONUS ITSELF IS THE OWNER'S DOSE CALL.**
  - **(1) THE 30.07 VERDICT IS REVERSED** – `docs/specs/coach-travel-2026-08.md`, rebuilt policy, 30
    seeds, paired. The MATCH-STRENGTH edge at +3.0pp – the middle of the very band recorded as making
    elite results worse – is **47 better / 13 worse / 0 tied over 60 paired careers**: top-100 53.3%
    → 63.3% (wealthy·elite) and 26.7% → 46.7% (middle·middle). ⚠ **The confound is PROMOTION**: the
    band's mean strength rises gently up the ladder but the DRAW's rises twice as fast, so points per
    entry FALL as she is promoted (61.1 at w100 → 43.0 at wta250). On the old bench – the one that
    never got anyone ranked – that loop was pure loss. On a funded career it pays.
  - The RUN-FATIGUE arm is dead and was refused by arithmetic before it was run: the whole ladder is
    +4 on a W 32-draw and **−3** at the deep rungs, and it is indexed by match-within-run, so a
    first-round loser is charged nothing. Two coins when run at its ceiling.
  - The BOOLEAN's skill half is real and small (+0.47/+0.30 peak, 34/17/9).
  - **(2) PRESENCE SHIPPED** (`ceac405`): the toggle has a caller at last, the fare is its own feed
    row, and he appears in the tournament flow, in the commentary at a SET BREAK only (the one moment
    the rules allow an on-court coach, under 20% of rows, never a highlight) and in the week's story.
    The 08.08 notification is built. No schema change.
  - ⚠ **AND THE FARE SHIPPED UNGATED FOR ONE COMMIT – MY BRIEF'S OMISSION, CAUGHT BY THE BENCH**
    (`edff2dc`). At the owner's own price it bankrupted **8/30** wealthy·elite and **15/30**
    middle·middle careers, *every one in the junior years*; "ever ranked" 96.7% → 46.7%, the median
    middle career's prize money to **$0**. +$995,979 where the 30.07 record said +$21,000. Gated to
    the rungs that PAY – the owner's own 30.07 argument, tested on the rung's own `prizeCents`.
  - ~~**STILL OPEN AND IT IS HIS**: the DOSE.~~ → ✅ **(3) THE DOSE IS ANSWERED AND THE BONUS IS
    BUILT** (`ff72dc5`, measured in `coach-travel-2026-08.md` §7). He ruled on the size himself when
    told +3.0pp is about three times the whole coach ladder: «что если мы привяжем это как раз к
    тренерской лестнице? у нас там есть уже верхний процент, будет не так сильно влиять как будто.»
    - **SO THE TRAVEL BONUS IS HIS OWN EDGE AGAIN** – a coach who comes with her delivers a second
      helping of exactly what his tier is worth, and `COACH_EDGE_CORRIDOR_PP` is the whole of the
      scale (elite +0.9–1.1pp, budget +0.2–0.7). No second constant; «верхний процент» is a bound
      the table already carries. SCALED, never shifted: §1's overlap rule is about ratios, so
      doubling keeps the budget lottery alive where a +3.0pp shift would make every rung the same
      coach. Zero new randomness – the same uniform, multiplied – and a career that does not travel
      is byte-identical (frozen career hashes, mutation-verified).
    - **MEASURED AT 250 SEEDS A CELL, 500 PAIRED CAREERS**: **263/206/31, Δbest rank −4.1
      [−7.2, −1.0], *p* = 0.010**, top-100 **51.2→54.4%** (wealthy·elite) and **43.6→48.8%**
      (middle·middle), both cells agreeing in sign. **It pays for itself**: +$30,645/+$43,600 of
      prize against +$17,664/+$14,911 of travel.
    - ⚠ **AND AT 30 SEEDS IT LOOKED LIKE NOTHING, WHICH IS THE METHOD NOTE WORTH KEEPING.** The
      first run read 31/23/6 at *p* = 0.34 with the two cells disagreeing in sign, and two
      confident mechanisms were written on top of that null (a "dead zone" in the dose-response, a
      "the bench sees one helping but not the second" yardstick). **Both were artefacts.** At n=250
      the dose-response is a straight line – 3.8 / 4.8 / 4.8 rank places per pp across three doses
      spanning a factor of four – and points per entry rises rather than falls. 30 paired careers
      resolve a +3.0pp effect and do not resolve a 1pp one.
    - ~~⚠ **STILL HIS, AND SMALL**: the screen does not yet say the bonus exists – `edgePct` prints
      the rung's HOME corridor to a family that travels.~~ → ✅ **THE SCREEN SAYS IT NOW**
      (`coach-travel-2026-08.md` §9). Every market card carries a third chip – the middle rung reads
      `+1.0-1.8% travelling with her` – and the hired coach's card carries one line under it,
      `Twice that on the trips the coach travels to.`
      - ⚠ **«THE CORRIDOR IS DOUBLED» WOULD HAVE BEEN A LIE, and the copy is written from that.**
        The helping follows `coachTravelFareFor`, which stays home for the rungs that pay no prize
        money unless the junior stance is open – so a J-series week doubles nothing even for a
        family that always sends him. Both surfaces name the CONDITION instead of claiming a flat
        doubling, and a junior-only family therefore reads a figure that is true of the trips it
        does not yet take rather than a promise about the season it is playing.
      - **Gated on `coachTravelsWithHer`** – somebody to send AND the switch on, the same pair the
        fare is charged on. Null otherwise, so a family that leaves him at home reads the card it
        read before, to the character; a self-coached family with the stance on is shown nothing.
      - ⚠ **§4 AND §7 BOTH SURVIVE IT.** Twice a price bracket is a price bracket, and
        `coachEdgeCorridorPp` reads the tier table and no coach id – so the market still quotes a
        rung and never a man. The plaque needed no hedge beside the second figure either: the
        helping SCALES the corridor rather than shifting it, so the upper third of 0.5-0.9 IS the
        upper third of 1.0-1.8 and «the upper end of that band» is true of both bands at once.
      - **No schema change, zero new randomness, and one `* 2` in the engine** (`withTravelHelping`,
        shared by the draw and the bracket – two copies of a dose is exactly the defect being
        closed). `coachEdgePp` is byte-identical.
      - **Evidence.** `tests/component/round21-coach-travel.test.ts` §5 (9 MOUNTED, mutation-verified
        eight ways, four of them failing alone) and `tests/coach-travel-edge.test.ts` (6 engine).
        The plaque guard there is **re-aimed rather than deleted**: its whole-view `toEqual` used to
        record this very gap as deliberate, so it now names field by field what the trip may not
        touch and asserts that the one field it owns really does differ.
      - ⚠ **STILL HIS: THE WORDS.** The ledger said copy is his call and it still is – the mechanic
        is settled, the two sentences are a proposal written to the card's measured character
        budget. Also still open and unchanged: −4 rank places is a distribution shift nobody will
        feel in one playthrough, and the two scoping warts (§7.6(c): the junior-rung freebie and the
        home practice friendly) are the follow-up.
  - → ✅ **STEP (2) IS BUILT AND SHIPPED ON THIS BRANCH. HE TRAVELS, IT COSTS MONEY, AND FOUR
    SURFACES SAY SO.** Step (1) – re-measuring the three stat arms on the rebuilt bench – is a
    separate agent's arm of the same wave and **no stat is added here**, which is the point: a fourth
    invisible bonus is the exact thing that got this reported three times.
    - **THE SWITCH IS UNLOCKED, AND `setCoachOnEventWeeks` HAS A CALLER AT LAST.** The row on screen
      T was `disabled` by a LITERAL with no binding behind it; it is now a live switch bound to the
      engine's own stance, pressable at every age and on every rung. The one refusal left is a fact
      rather than a gate: a self-coached family is told there is nobody to send, and the control
      still works (the stance takes effect the moment she hires somebody).
    - **⚠ THE FARE IS THE OWNER'S OWN FIGURE, AND THE 30.07 ONE IS NOT RECOVERABLE.** The brief asked
      for the 30.07 price to be reused rather than invented. It cannot be: commit `77e08aa` says in
      capitals that *"ALL THE ENGINE WORK IS REVERTED ... the `coachTravelsFrom` threshold, the
      per-trip fare ... are gone"*, and it was never committed, so neither git nor any doc holds the
      number. What **is** on the record is him pricing the same thing on 12.08 in
      `docs/specs/the-wall-2026-08.md` §L1: «a per-tournament top-up when the coach travels with her,
      **at double the travel cost**». So his seat is her seat again – **a trip he comes on costs
      twice the fare** – which is also where the brief's own fallback ("price it from
      `travelCostFor`") lands. `coachTravelFareFor` is that doubling.
      - ⚠⚠ **SUPERSEDED THE NEXT DAY, AND THE SENTENCE THIS REPLACES WAS THE DEFECT.** It read: "it
        reads `travelCostFor` and nothing else, so the academy scholarship and a brand's share reach
        his seat exactly as they reach hers". They did – and that meant the mechanism built to keep a
        struggling family in the game was **buying the coach a plane ticket**, with the better
        scholarship funding the larger share of the luxury. The owner caught it as a principle
        (15.08): «механизм точечной поддержки нуждающихся не должен поддерживать их чрезмерные
        траты, только помочь дожить до призов». HER fare keeps every cover; HIS is
        `event.travelCostCents`, gross (`f9104eb`). So "twice the fare" is true only for a family
        paying full price, and the screen now says his seat is not covered instead of quoting a bare
        multiple – which is exactly the family that most needed to be told.
    - **WHERE IT IS CHARGED, and why not in the weekly bill.** Beside `chargeTravel` in `tickWeek`'s
      `else if (enteredThisWeek)` arm – the arm where she actually boarded. That inherits the two
      no-travel arms for free (an injury walkover and a medical withdrawal never pay it, because she
      never went) and keeps it out of `resolveBaseCosts`, where R4's mistake was: the retainer is
      unconditional (owner, 08.08) and this is a FARE. Its own `travel` row in the feed, never folded
      into the coaching line. Zero new draws on any stream.
    - **PRESENCE, on the three surfaces he named.** (a) THE FLOW: `PendingView.coachTravelled` off
      one engine predicate (`coachTravelsWithHer`), drawn as one line on the splash's brief card –
      the card that is already the coach's own, under his signature. (b) THE COMMENTARY: a new
      `coach` beat at a SET BREAK, which is the only moment the rules give an on-court coach
      (`training-dials.md` §8) – at most twice in a match, `PRIORITY.coach` last so any tennis beat
      on the same point wins, never in the `key` cut, and byte-identical to today when nobody
      travelled. (c) THE WEEK'S STORY: `DiarySnapshot.coachNote`, its own field rather than entries
      in `TRAVEL_NOTES` – a licensed pool entry would surface on maybe one trip in twenty, and this
      has to be there on every trip the family paid a second fare for.
    - **⭐ AND THE 08.08 TRAVEL NOTIFICATION IS BUILT.** `markCoachTravelOpen` fires once per career,
      `keep: true` so the 400-row prune cannot lose it, on the first week she has a coach AND a trip
      still ahead of her – so it arrives in time to be acted on rather than as a receipt. Silent for
      a self-coached family, because for them it is not true. A feed milestone and **not** a popup:
      round-20 #3 was a blocking dialog whose dismiss control left a 375x667 screen and stopped his
      career, and a notice is exactly the class of thing that does not need to block anybody.
    - **NO SCHEMA CHANGE** – true of the presence slice, and ⚠ **NO LONGER TRUE OF ITEM 2 AS A
      WHOLE.** `coachOnEventWeeks` already shipped and everything the presence work added is
      snapshot-derived (`coachTravelled`, `coachNote`, `travelFareCents`/`travelTrips`), reusing the
      existing `travel` event category. The JUNIOR opt-in the owner asked for on 15.08 («делаем
      тогда») could not be: it needed a second stance, so `SAVE_SCHEMA_VERSION` went **48 → 49** with
      an append-only step and `tests/fixtures/saves/v49.json` – the deliberate three-part move,
      plus the e2e fixtures this repo enforces as a fourth part.
    - **Evidence.** `tests/round21-coach-travel.test.ts` (17, engine) and
      `tests/component/round21-coach-travel.test.ts` (10, MOUNTED). The load-bearing ones:
      two identical careers differing only in the switch spend **exactly twice** on the trip and the
      second row is his; the MAIN stream is byte-identical across 40 weeks of both arms
      (invariant 2); the same match narrates differently with him there and he is **under 20% of
      rows**, one word per set break at most; the coach room's row calls the command and prices
      itself from `coachBilling`; the week's scrap carries two hands and the week's own note is not
      displaced. **⚠ AND THE PHONE MEASUREMENT CLAUDE.md ASKS FOR:** the brief card is measured
      against 375x667 with the presence line on it – the takeover's scrollport is bounded and
      `overflow-y: auto`, the card fits the screen so a scroll position exists that shows it and
      `Begin` together, and the line itself is held to a 3-line budget at the card's width.
      **Mutation-verified, eight ways** (each named in the test headers): deleting the charge, the
      gross-fare fare, dropping the self-coached clause, dropping the notice's "trip ahead" clause,
      firing the beat on every point, dropping the `:coach-travelled` binding, and a four-sentence
      presence line – each turns a different, named block red.
    - ⚠ `tests/component/coach-travel-row.test.ts` (round-20 #1) is **deleted**, and its source pin in
      `tests/coach-market.test.ts` re-aimed. Both existed to assert the row could never open; that is
      the claim his third ask overrules. The reasoning they recorded is preserved in the new files.
- [x] **3. ⚠ REOPENED. «И ещё раз: проверь пожалуйста что с комментариями текстовой трансляции на
  1000 и шлемах, кажется ничего не изменилось»** – MEASURE, then build. Task #109 was created for
  exactly this and never built, so "ничего не изменилось" is the correct observation. Read what a
  1000/Slam match actually emits against what a J30 emits, on the real commentary builder.
  → ✅ **HE IS RIGHT, AND NOT "ALMOST" RIGHT: the two were IDENTICAL, byte for byte. Now built.**
  - **THE MEASUREMENT FIRST** (`tools/commentary-rung-probe.ts`, 200 seeded matches over three
    surfaces, every arm on the SAME corpus). BEFORE, and there is nothing to interpret in it:

    | arm | beats/match | distinct phrasings | rows differing from a J30 first round |
    |---|---|---|---|
    | J30 first round | 16.07 | 483 | – |
    | WTA 1000 first round | 16.07 | 483 | **0.0%** |
    | WTA 1000 final | 16.07 | 483 | **0.0%** |
    | Slam first round | 16.07 | 483 | **0.0%** |
    | Slam final | 16.07 | 483 | **0.0%** |

    Not "similar" – the same rows in the same order with the same words, because `buildCommentary`
    took three arguments (`match, playerA, playerB`) and none of them was the tournament. A Grand
    Slam final and a J30 first round were literally the same function call. **So the correct answer
    to «кажется ничего не изменилось» is that nothing had changed, and nothing had been built.**
  - **AFTER**, same corpus, same tool:

    | arm | distinct phrasings | rows differing from J30 R1 |
    |---|---|---|
    | National final (storey 1) | 483 | 0.0% |
    | J30 first round (storey 2) | 482 | – |
    | W75 first round (storey 3) | 655 | 55.3% |
    | WTA 1000 R64 (storey 4) | 759 | 60.5% |
    | Slam final (storey 4) | **768** | **60.5%** |

    Per beat family, J30 first round → Slam final: break 189 → 311, hold 117 → 170, set 92 → 150,
    match 39 → 65, streak 8 → 22, games 6 → 13, tiebreak 2 → 8. ⚠ The one number that goes DOWN is
    storey 2's aggregate (483 → 482): the stake clause lengthens the match beat, so one colour clause
    now falls off the 120-character row budget. That is the trade `clausesUpTo` exists to make and it
    is the escalation ladder's own rule (the top of a match gets SHORTER), recorded rather than hidden.
  - **WHAT CHANGES BY RUNG, and all three are the research's ladder rather than a new opinion**
    (`live-text-adult-tour.md` §2.7: escalation is entry length and vocabulary, never louder
    adjectives; `commentary-lexicon.md` §5.3: «the lever is not adjectives, it is what gets mentioned
    at all»). (a) **The phrase pools grow** – break 3 → 5 → 7, break-back 2 → 3 → 4, hold-under-
    pressure 1 → 2 → 3, streak and game-run 1 → 2 → 3, and the added entries are Ferguson's other
    sentence moulds (copula-drop, result expression) rather than the same mould with adjectives.
    (b) **The stakes are named** from storey 2 up: "takes it in three, **and the title with it**" /
    "**and a place in the round of 64**". (c) **The room appears** from storey 3 up and never below –
    a J30 side court has two families on a bank, and saying otherwise would be an invention.
  - **THE 14.08 DRAWS ARE CLEAN – no five-round or 32-draw assumption anywhere, and I looked.** Every
    round count in `src/` is `Math.log2(drawSize)`; the stake clause parses `stageLabel`'s own label
    through `viz/preview.ts`'s `remainingIn` (now exported so there is ONE reader of that vocabulary),
    so a Slam opener really does read "Round of 128" → "a place in the round of 64", a 1000 opener
    "Round of 64" → "round of 32", and a J30 "Round of 32" → "round of 16". All seven Slam rounds are
    asserted individually. **No live bug found here.**
  - **The storeys are `viz/preview.ts`'s own four-storey ladder, imported not restated** – the owner's
    ruling from round 16. No event = storey 1 = byte-identical to the old output, so the friendly, the
    sandbox hit-out and the whole existing suite are untouched. **Nothing names a tournament**: the
    preview block one row below already prints «Final at the Grand Slam», and the beats read only the
    event's size and round, so this file imports no tier catalogue at all.
  - **EVIDENCE.** 11 new assertions in `tests/viz/commentary.test.ts` + 1 mounted wiring test in
    `tests/component/match-viewer.test.ts`. Mutation-verified both ways: `storeyFor → 1` turns **5**
    builder tests red; dropping the fourth argument at MatchViewer's call site turns the mounted test
    red while the builder suite stays green – which is the exact failure this item was.
  - Commit `8e38c0d`.
- [x] **4. «...только 1 раз за весь сезон смог пройти 1й раунд турнира из всех попыток, в 250 чуть
  лучше. Это как-то не очень метчится с нашим процентом побед»** – MEASURE FIRST, and it may be MY
  regression: the Slam draw went 32 -> 128 and the 1000 32 -> 64 this morning.
  → ✅ **HE IS RIGHT, IT IS A REAL BUG, AND IT IS NOT THIS MORNING'S DRAW CHANGE.** She entered EVERY
  draw as the lowest-ranked player, on every rung, since v21b – which shipped a comment saying the
  opposite («she goes into the draw AT HER STANDING, not at the bottom of it»).
  - **THE CAUSE IS THE TABLE, NOT THE FUNCTION.** `kidSeedIndexIn` counts how many entrants outrank
    her by looking her up in the ranking it is handed, and falls back to LAST for a player it cannot
    find. Both tables reaching that call are built to the INPUT-INDEPENDENCE rule and fold her out on
    purpose – `aiRanking` («excludes the kid so AI-field selection never depends on the kid's own
    results») and `selRanking` («LIVE rows fold WITHOUT the kid»). Never found means bottom.
  - **MEASURED on his own save, a world #15** (`tools/draw-vs-band.ts`, 40 season-chunks):
    | | seeded | R1 win | R1 opponent (median) | titles |
    |---|---|---|---|---|
    | before | **0.0%** | 42.8% | #34.5 | 1.6% |
    | after | **100%** | **57.2%** | #49 | **5.9%** |
    At a 1000 **89% of the field she met was stronger than her**, because the back of the draw is
    what the top seeds are paired against. That is «прошёл первый круг один раз за сезон».
  - **THE FIX IS A SECOND TABLE, NOT A RELAXED FIRST ONE.** Who turns up must not depend on her –
    `selectEntrants` and `weekFieldExclusion` keep the kid-free fold. Where she stands among them
    must depend on nothing else, so the seeding call reads `rankingFor`, the table the Season card
    and the acceptance lists already use. The draw now agrees with the card instead of contradicting
    it. Same RNG draw count: `buildDraw` shuffles a tail whose length does not move with her slot.
  - ⚠ **AND THE TOOL THAT CAUGHT IT WAS BROKEN BY MY OWN DRAW CHANGE.** `draw-vs-band` crashed on the
    Slam (seven rounds indexing a five-long label array) and printed `undefined 41.3%` for the two
    finishes a 128-draw added. Both label tables now come from `stageLabel`/`finishLabel`.
  - **Two guards fell out of it and neither was a product regression** (`d8ee134`): `travel-home`'s
    mood re-derivation was missing `retired` and had been passing only because this career had never
    retired hurt – now completed, so that arm is covered for the first time; `long-career-ledgers`
    asked seasons she did not play for a best result. ⚠ Its ENDING is deliberately not pinned: this
    career flipped across the threshold three times in one day on three balance states.
- [x] **5. ⚠ REOPENED. «И мне всё ещё показывают local чемпионаты в ленте у обоих»** – BUILD. This is
  task #84, pending since it was filed and never built. The feed offers rungs that pay into a table
  she has left.
  → ✅ **BUILT. The feed now asks which table is hers, and the domestic rungs are gone from a
  professional's.** `feedContext` (`src/composables/tierState.ts`) takes `activeLadder` –
  `Snapshot.activeLadder`, i.e. the engine's own `activeLadderOf` – and drops every rung that pays
  into a table more than ONE below hers. Wired at all three consumers (`SeasonScreen.vue`'s feed,
  `HomeScreen.vue`'s season strip, `weekDays.ts`'s look-ahead markers), so they cannot disagree.
  - **MEASURED ON A BUILT WORLD, before and after** (`tests/tier-window.test.ts`, "round-21 #5"). A
    22-year-old with a 600-point W book and the domestic book she climbed up on:
    | | rungs the feed offered | working window (Home strip) |
    |---|---|---|
    | before | **local, regional, national**, w15, w35, w50, w75, w100, wta125, wta250 | **national**, w100, wta125, wta250 |
    | after | w15, w35, w50, w75, w100, wta125, wta250 | w100, wta125, wta250 |
    Same at 19 and 20. `national` was inside the WORKING set as well – i.e. the Home strip was
    naming a club rung as the level her career is about.
  - **ROOT, and both halves are the ladder working as written.** `tierOpenFor` has been the FLOOR
    alone since 06.08 and **Local's floor is ZERO domestic points**, so no book is ever empty enough
    to close it. The ceiling that was supposed to collapse the domestic family upward
    (`tierOutgrown`: a rung closes when the rung THREE ABOVE opens) carries an age clause – «a door
    she cannot open yet cannot close the one behind her» – and past eighteen J30/J60/J300 are
    age-shut for ever, so Local/Regional/National have no reachable ceiling left. `HomeScreen.vue`
    already documents this exact hole and works around it with the ellipsis collapse; the feed had
    no such collapse and printed the cards.
  - **THE SEAM IS WHY IT IS ONE TABLE OF SLACK AND NOT A HARD CUT**, and it is asserted rather than
    argued: a girl on her FIRST counting W15 point at 16 keeps her whole ITF window (j30, j60, j300,
    w15) and loses only the domestic three – measured. A hard "only her own table" would also have
    hidden J30 from a domestic girl, which is her only way ONTO the ITF table (`entryBandTrack`: a
    table's bottom rung is opened by the table below it). Domestic and junior careers are
    byte-identical to what they were, at four ages, asserted.
  - **VISIBILITY, NEVER ACCESS – the 06.08 ruling is intact.** `entryStatus` is untouched, every
    domestic rung is still `tierOpenFor`-open, an ENTERED domestic event still renders, and her
    finishes stay on the Home ladder's chips. Only what the feed OFFERS unasked changed.
  - Mutation-verified: neutering the filter turns 3 of the new assertions red.
- [x] **6. «Если день рождения в декабре, то вся школа уже закончилась и в сентябре вроде бы её быть
  не должно, мы это обсуждали. Надо везде по коду проверить этот сдвиг»** – BUILD + AUDIT. The school
  clock has to read her BIRTH MONTH, not a calendar constant, and he is asking for the whole code
  swept rather than one site fixed. Related to task #87.
  → ✅ **SWEPT (35 sites), 2 FIXED – and the September he is looking at is the CUT-OFF, not a bug.
  One decision is his and it is at the bottom of this entry.**
  - **THE INVENTORY.** Every site that decides a school / exam / term fact, and what it reads:

    | site | decides | reads her birth month? |
    |---|---|---|
    | `kidLife.schoolEndWeek(birthMonth)` | the leaving week – **the clock itself** | ✅ source of truth |
    | `kidLife.schoolIsOver(week, birthMonth)` | is she out, in ANY week | ✅ |
    | `kidLife.gradeOf(...)` | her grade / "School's done" | ✅ |
    | `kidLife.schoolTile()` – grade line | the Kid screen's School tile | ✅ |
    | `kidLife.schoolTile()` – exam line | "Exams this week" | ❌ **literal `false`** → **FIXED** |
    | `kidLife.friendsTile()` | two lines that name a classroom | ✅ |
    | `kidLife.schoolIsOverForBand(week)` | the RIVALS' blackout recovery | ⚪ constant `6` **by design** – a cohort player has no birth date |
    | `calendar.isExamWeek(week, schoolOver)` | the exam fortnight | ✅ required param, caller brings it |
    | `calendar.isBlackoutWeek(week, schoolOver)` | blackout recovery + availability | ✅ |
    | `calendar.isSummerWeek(week)` | the holidays | ⚪ calendar-only **by design** – the holidays are the same for every girl |
    | `ECONOMY.availability.examWeeks` / `school.lastGrade` | the fortnight's offsets, 12 grades | ⚪ constants **by design** – gated by `schoolOver` at every read |
    | `world/summer.pastSchool()` and its four consumers | the school-free training block, its cost, day capacity | ✅ |
    | `world/planner.ts:94` | the planner's refusal | ✅ |
    | `world/medical.ts:69,354` | blackout recovery, both arms | ✅ |
    | `world/knock.ts:66` | knock arrival | ✅ |
    | `world/milestones.ts:66,452` | the leaving MOMENT + the wrap-up line | ✅ |
    | `world.ts:1073,1148` | the rest-event pool, the court-cost draw | ✅ |
    | `world/snapshot.ts:652,750,946` | diary view, `schoolEndsWeek`, kidLife view | ✅ |
    | `diary.ts:141` + `diary/facts,pool,weekNotes` | every schoolgirl phrase | ✅ off the view |
    | `season/rival.ts:185` | the cohort's recovery | ⚪ band clock **by design** |
    | `migrations.ts:1231` (v43) | the back-filled milestone week | ✅ |
    | `weekDays.calendarWeekFor:327` | `CalendarWeek.schoolOver`, per DRAWN week | ✅ via `schoolEndsWeek` |
    | `weekDays.ts:412,478,615` | exam week, "Summer block", look-ahead | ✅ |
    | `weekAhead.ts:110` | the next-week button | ✅ |
    | `weekGrid.bandFor(ageYears, schoolOver = false)` | school vs full-time day shapes | ✅ read – ⚠ but **defaults to a schoolgirl** (left: same argument the optional `schoolEndsWeek` makes for two dozen pre-W4 fixtures) |
    | `weekGrid.examDay` / `dropSchoolFurniture` | the paper, the 08–13 block, the study hour | ✅ |
    | `SeasonScreen.vue:534`, `SeasonSummaryDialog.vue:52` | exam rows, the off-season line | ✅ |
    | `CalendarScreen.vue` NOTE_MOOD, `KidScreen.vue`, `WeekRecapCard.vue` | fridge note, tile, recap art | ✅ derive nothing |
    | `HerWeekTab.vue:197` capacity note | «One session a day **while school is on**» | ❌ **read plan CAPACITY** → **FIXED** |
    | `tools/` (school-bench, round16/18-read, season-anchor-read, week-story-trace, boredom-guard) | all probes | ✅ |

  - **THE TWO FIXES.** (a) `schoolTile`'s exam line took a literal `false`; it now takes
    `schoolIsOver(view.week, view.birthMonth)`. The two agree on every (week, birthMonth) the game
    can produce – so it costs nothing today and cannot drift tomorrow, which is the ask. (b)
    `HerWeekTab`'s note printed «while school is on» whenever the day capacity was 1 – and capacity
    is 1 for **five** reasons (`summerBlockWeek` also refuses on an injury, a booked family week, a
    tournament and a rested knock), so a 22-year-old professional resting a knock was told her
    school timetable was the limit. It now asks `schoolEndsWeek` about the week the plan is about.
  - **⚠ THE SEPTEMBER, MEASURED – and it is the 1-September cut-off, not a defect.** The ITF band is
    one birth YEAR (everyone in the 14s was born 2017) but the school year turns over on 1 September,
    so the band splits and the halves leave school **52 weeks apart**: January–August at career week
    **242**, September–December at **294**. A December-born girl therefore sits a whole extra school
    year, and **career weeks 243–246 (September 2035) are 12th-grade weeks for her while the other
    half of her own age group has already left**. That is the September he is reporting.
    Both halves leave at a real age of **18.00–19.00**, so nothing here violates «школа уже после 18
    вроде не должна быть» (task #87) – what he is objecting to is the SPLIT itself.
  - **THE ASYMMETRY IS PINNED, NOT REMOVED** (`tests/school-ends.test.ts`, "round-21 #6"): the same
    September is a school month for a December girl and a post-school month for a June one, asserted
    on the predicate AND on the drawn calendar's lesson block; plus the per-girl half of his sentence
    (no September school week from her leaving week on, for all twelve months). Mutation-verified: a
    birth-month-blind cohort turns 5 assertions red.
  - **⚠ HIS RULING NEEDED, and it is why the split was not simply deleted.** Collapsing the two
    halves onto one leaving week is a BALANCE change, not a copy change: it moves 52 weeks of a
    Sept–Dec career onto `ECONOMY.school.loadFactor` (1.4x development, and the whole `pastSchool`
    branch of `summerBlockWeek`). CLAUDE.md invariant 4 – tuning is measured, not guessed – so it
    needs a bench run and a spec, which is its own wave. **The question for him: should the whole
    ITF band leave school together at week 242 (his premise – but that puts the December girls out
    at 17.67, before eighteen), or does the real September cut-off stand as it is today?**
  - → ✅ **HE RULED: THE CUT-OFF STAYS. So the line I promised and did not ship is now built, and it
    is the only thing that changed – NO CLOCK MOVES.**
    - **WHERE.** The School tile on the Kid screen, which is where he saw it. Under the grid rather
      than inside the cell, and that is forced rather than a preference: both `KidLifeTile` lines are
      `white-space: nowrap` in a 115px cell on a 17-character budget (`TILE_LINE_MAX`), so a sentence
      cannot go in one. It renders directly below the School tile – the first cell of the second row
      – prefixed `School –` so it names what it is about.
    - **WHAT IT SAYS**, engine-composed in `kidLife.schoolCutOffNote` and only drawn by the screen:
      *"School runs on a 1 September cut-off and her birthday falls after it – so her last school
      year ends the summer after she turns 18, a year later than girls born earlier in the same
      tennis year."*
    - **AND ONLY WHERE IT IS TRUE.** Four birth months out of twelve (September–December, which is
      `schoolCohortYear`'s own comparison), and only while she is still at school – `gradeOf`
      returning null is "School's done", which accounts for itself. For a June girl the sentence
      would be false, so she is told nothing.
    - **Evidence.** `tests/component/round21-school-cutoff.test.ts` – 5 MOUNTED tests on real careers
      through the real engine. The December arm ticks to career week **246**, the exact September the
      measurement above names, and reads the rendered line off the screen; a June career at the same
      week gets nothing; both are checked again at 14, where the split is already true and already
      says so; and the line stops at `schoolEndWeek(12) + 1`. The fixture asserts the two leaving
      weeks (242 / 294) up front, so a clock change goes red **first**, with its reason, instead of
      the copy failing mysteriously. Mutation-verified three ways: firing for every birth month,
      surviving past the last grade, and deleting the paragraph from `KidScreen.vue` each redden a
      different named block.
- [x] **7. «У тренера на карточке "Too early to tell 49 weeks of 52" – звучит довольно смешно, сезон
  уже сыгран.»** – BUILD, and it is three asks in one sentence:
  - 7a: the copy at the top of the window should be «обсудим в межсезонье», not "too early to tell".
  - 7b: drop the "of 52" framing – a rolling 52-week bar is the wrong clock for a question the
    season answers.
  - 7c: make it depend on WHEN the coach was hired. First half of the season -> "too early" is fair;
    second half -> it should already be saying "not long enough yet" and moving its own bar down the
    year. **He asks whether it already works that way – check before building.**
  - **7c ANSWERED FIRST, AND THE ANSWER IS NO.** Checked before anything was touched. The gate was
    `weeksTogether >= COACH_EDGE_REVEAL_WEEKS` in `coachEdgeView` – a rolling 52-week bar off
    `coachSinceWeek` and nothing else. No season, no calendar and no hire month appeared anywhere in
    `coachEdgeView` or `coachPlaqueLine`; a coach taken on in week 2 and one taken on in week 40 were
    treated identically, and the sentence printed the bar's progress, which is how his card read
    "49 weeks of 52" in an off-season with that season already played.
  - **7c SHIPPED.** `coachRevealWeek(sinceWeek)` returns the FIRST OFF-SEASON WEEK of the season he
    was present for, on his own split: hired in a season's first half, that season counts; hired in
    the second, it does not and the bar moves a year down. The card picks its arm off the season she
    is in NOW, so a week-40 hire shows the far arm all autumn and switches to the near one by itself
    when the new season opens – «сдвигать эту планку дальше по году» with no second rule. One read of
    the market now costs 24 weeks at the cheapest and 75 at the dearest, against a flat 52; §4's
    anti-shopping rule survives because the price is a CALENDAR week the player cannot choose.
  - **7a/7b SHIPPED.** Two sentences replace one, and neither counts anything:
    `Where in that band – we will know in the off-season.` /
    `Where in that band – too soon, ask next off-season.` Both keep §7's «that band» referent, both
    are 51-52 characters (inside the 49-58 the nine revealed sentences occupy), so the card still
    wraps to two lines at 320px and does not jump when the reveal lands.
  - Evidence: `tests/component/round21-coach.test.ts` §7a/#7b and §7c – MOUNTED, real careers through
    the real commands, asserting the rendered `.cm-plaque` text and that the reveal really arrives in
    an `isOffSeasonWeek`. Mutation-verified: the old sentence restored, the two arms swapped, and
    `coachRevealWeek` returned to `sinceWeek + 52` each redden a different, named subset (ledger in
    the test's header). Also `tests/coach-edge.test.ts` unit pins. Spec: `docs/specs/coach-match-edge.md` §9.
  - ⚠ `Snapshot.coachEdge.revealAfterWeeks` is now `revealWeek` (an absolute off-season week).
- [x] **8. «В 19 не было варианта выбрать колледж, только про или завязать»** – BUILD. Task #102 has
  the design (college as a second act, not a coda) and nothing was built. At the fork she is offered
  two doors where the spec says three.
  → ✅ **BUILT – and the finding decided the fix. IT IS THE ENGINE, NOT THE DIALOG.**
  - **THE MEASUREMENT, taken before anything was written.** `tools/econ-bench.ts`'s own **`player`**
    policy – the model of a reasonable parent, fitted to his own envelope – over 9 presets × 3 seeds:
    **26 of 26 careers that reached the fork had `collegeStillOpen === false`**, and `toSnapshot` put
    that on `snapshot.fork.collegeOpen` faithfully every single time. Under the **`grinder`** policy,
    which never plays the paid rungs, it was **open 13 of 13**. `ForkDialog` draws the third arm
    exactly when the flag is true (its own mounted test has pinned that since round-17 #6). So the
    door was genuinely shut, the card was right to show two answers, and the bug is that **nothing on
    it explained why**.
  - **WHICH RUNG SHUT IT.** W75, essentially always, with a best finish of **0–3 of 5** – she reached
    the quarter-finals or won the thing. This is not the wooden-spoon false positive the 13.08 ruling
    («чини дверь по набранному результату, а не по единице») was about; that fix is working. She
    really has taken professional prize money at W75+ before nineteen.
  - **THE FIX IS A SENTENCE, NOT A BUTTON.** Round-17 chose *absent* over *disabled* and that stays
    right – a greyed answer reads as one she is refusing. What was wrong is that *absent* and
    *never existed* looked identical. The card now carries one line above the answers when the door
    is shut: «There are two answers here and not three: the college place closed the first time she
    took a real result at W75 or above. Prize money at that level spends her college eligibility, and
    nothing gives it back.» The rung is read from `ENDINGS.collegeClosedFromTier` through
    `TIER_SHORT`, never typed into the markup.
  - **⚠ A DECISION FOR HIM, NOT TAKEN HERE.** 26 of 26 means the third door is not *sometimes*
    missing – on any career that plays the tour at all it is **never** offered. If college is meant to
    be a real second act (task #102) rather than a theoretical one, `collegeClosedFromTier` has to
    move up the ladder or stop being a hard precondition. That is a balance change with a measured
    argument behind the current value, so it is material for #102 and not something this item
    decided. Task #102's second act itself remains unbuilt, as scoped.
  - **Evidence** – `tests/component/round21-dialogs.test.ts`: the third arm IS rendered when the
    engine says open (and no explanation is drawn then); the explanation IS rendered when it says
    shut, with the rung from `ENDINGS`; still two `.fork-answer`s, still no primary, and the note is a
    `<p>` rather than a fourth button; a negative pin that no rung name is typed into the template.
    Mutation-verified. Plus the 375×667 fit assertion below, since the card was lengthened.
  - **Files** – `src/components/ForkDialog.vue` only. The engine was not touched.
- [ ] **9. «Попап с развилкой появился сразу после финального матча чемпионата перекрыв интерфейс
  таблицы и завершения. Нам надо как-то всё-таки разобраться с порядком появления попапов, чтобы они
  не конфликтовали с происходящим на экране... кроме травмы, которая как раз должна появляться в
  моменте.»** – BUILD, and the general rule is the deliverable rather than the one collision: a
  blocking popup must wait for the screen to be idle, with the injury popup the stated exception.
  → ✅ **BUILT. One rule, one place, and every popup inherits it – the injury is the one exception.**
  - **WHY THE FORK LANDED ON THE FINALE, exactly.** `finalizeTournament` calls `resolveEndings`
    **while `pendingTournament` is still set** – `p.finished = true` is the very next line, and only
    `closeTournament` clears the reveal. So the fork is raised, correctly, with the finale card, the
    draw and the points still on screen, and it painted straight over them. Not a race: a documented
    ordering that had never been written down.
  - **WHAT WAS MISSING.** `composables/blockingOverlay.ts` answered *which question is next*. Nothing
    anywhere answered *may anything land at all*. Each popup had worked that out privately – the
    injury report and the tour briefing had each grown their own `!snapshot.pending`; the fork, the
    knock, the birthday and the retirement offer never had; and nothing recorded that as a decision.
  - **THE RULE.** `screenBusy(snapshot, liveMatch)` – a tournament reveal or a live practice match is
    the screen mid-sentence. `popupMayShow(id, …)` – every popup waits for idle unless it is in
    `INTERRUPTS`, which holds exactly two: **`injury`** (his own exception: «кроме травмы, которая как
    раз должна появляться в моменте») and **`ending`**, which is not a dialog at all but the thing
    that REPLACES the shell, reveal included. `visibleOverlay` is precedence and the wait together;
    `blockingOverlay` still answers "what is pending", and the two are deliberately not the same –
    the reports below the queue must wait for a question that is merely HELD as well.
  - **⚠ IT REVERSES ONE ROUND-16 LINE, ON HIS INSTRUCTION.** The injury gate used to carry
    `!game.snapshot.pending`, whose note read «the report waits for the reveal to be resolved». That
    held the report behind the very beat 61% of this game's injuries arrive on. The data is ready
    when it fires either way: `retirementInjury` opens the layoff **inside** `finalizeTournament`,
    ahead of `resolveEndings`.
  - **⚠ A WAIT IS NOT A DEADLOCK, and that is checked rather than argued.** A held question is held
    behind a reveal, and a reveal is the one state in the game with a free exit: `closeTournament` is
    deliberately not `guardNotEnded`-guarded, and the sticky bar renders its resume button on every
    tab while `pending` is set. The test walks it: close the tournament and the fork is the next
    thing on screen.
  - **Evidence** – `tests/component/round21-popup-order.test.ts` mounts the **real shell** on a
    **real finished reveal** (real entry, real bracket, `skipTournament`, then the fork the engine
    would have raised there): the fork is **not** in the DOM while `TournamentFlow` is; it appears the
    moment the tournament closes; the knock waits by the same rule; and the **injury DOES** mount over
    the same reveal. `tests/blocking-overlay.test.ts` adds six pure-function cases, including a total
    over every popup id so a new one cannot be added without answering this question. All four shell
    assertions mutation-verified by editing `INTERRUPTS`.
  - **Files** – `src/composables/blockingOverlay.ts` (the rule), `src/App.vue` (five gates rewired to
    it; nothing about WHEN a popup may land is decided in that file any more).
- [x] **10. «В разделе bills возле выбранной позиции и "# good weeks" написать "(3 left)" – сколько
  осталось»** – BUILD. A commitment shows how many good weeks it bought and not how many are left.
  → ✅ **BUILT. The rung she is ON now carries "(N left)" beside the "N good weeks" it buys.**
  - **WHAT IT WAS.** `rungs[].goodWeeks` is a catalogue constant – what a rung buys FROM NEW – so a
    fourteen-week-old string job on a "24 good weeks" rung read exactly like a fresh one, and the
    number never moved between the week it was bought and the week it wore out.
  - **READ FROM REAL STATE, NOT RECOMPUTED FROM A START DATE.** `kitAgeWeeks` was a closure inside
    `kitWearAt`; it is lifted out and exported, `kitWearAt` now calls it, and `goodWeeksLeftFor` is
    `goodWeeksFor(line, grade)` minus that same age. **ONE clock**, so the countdown reaching 0 and
    `wearWord` starting to say "Worn" are the same week by construction rather than by agreement –
    that is asserted as its own claim over 86 weeks, both directions.
  - **The screen derives nothing**: it prints the engine's `KitLineView.goodWeeksLeft`. A surface
    that subtracted a week number itself would be a second authority on the one number the wear model
    owns, which is the standing rule `world/kit.ts` is written under.
  - **A SPONSORED LINE PRINTS NO COUNTDOWN**, and that is the right answer rather than a missing one:
    `kitFreshCap` holds a covered line at 0.3 or 0.5, both under the 0.55 Worn edge, so it never runs
    down while the deal runs – and "(0 left)" beside a line the same page calls Fresh would be exactly
    the disagreement the one-clock rule exists to prevent. Read off the ceiling, not off the flag, so
    a future cap above the edge starts counting down by itself.
  - **EVIDENCE.** `tests/component/round21-bills.test.ts` – 6 mounted assertions on the real Bills
    tab with the engine's figures interpolated, including an unsponsored career and a signed national
    deal. Mutation-verified twice: rendering `rung.goodWeeks` inside the span instead – the revert
    that keeps the new words and puts the old bug back – turns 3 red, and deleting the span turns the
    same 3 red.
  - Commit `bef882c`.
- [x] **11. «Выбранного тренера давай в жёлтую рамку возьмём и чтобы портрет его подсвечивался
  всегда, независимо от дохода семьи.»** – BUILD. Two things: an accent frame on the CHOSEN coach,
  and his portrait lit whether or not the family can currently afford his tier.
  - **IT WAS THE CASCADE, NOT THE COLOUR.** `.cm-row.current` has carried `border-color: var(--accent)`
    since screen T shipped – and `.cm-row.blocked` is declared directly under it at the SAME
    specificity, so a row that was both (the coach she employs, on a rung that no longer fits the
    week's income) lost the frame to source order: dashed `rgba(255,255,255,.09)` over a darker card,
    with `.cm-row.blocked .cm-art { opacity: 0.45 }` greying the portrait and the name and price
    beside it. His own save is exactly that state – an Elite coach at $485.95/wk against a read of
    $439.73 – so the frame he is asking for was being drawn and then painted over.
  - **SHIPPED, two locks.** (a) the template no longer puts `blocked` on a current row at all:
    `blocked: !r.current && (…)`. "Blocked" paints a refusal, which is true of a coach she MIGHT hire
    and false of the one she is paying – and no information is lost, because a current row's action
    word has always been "Current" and never the over-budget figure. (b) `.cm-row.current.blocked`
    (four classes against three, so it wins in either source order) restores the solid accent border,
    the portrait at full opacity and the name/price colours, so re-introducing the class somewhere
    else can never un-frame her coach again. The frame also gained a 1px accent RING
    (`box-shadow`, not a second pixel of border – a border would move the row's padding box and with
    it the 12.00px portrait clearance measured in `coach-edge-card.test.ts` §4).
  - Evidence: `tests/component/round21-coach.test.ts` §11 – MOUNTED on an Elite career whose own coach
    is over budget, reading `border-color`, `box-shadow` and `.cm-art` opacity through the REAL
    cascade (`css: true`), with unaffordable strangers on the same list as the control that proves
    the dimming rule is live. Mutation-verified: the template revert reddens the class + portrait
    tests alone, deleting the CSS lock reddens the cascade test alone, and both together – the
    shipped defect exactly – redden all four.
- [x] **12. «у нас есть ещё %, надо их тоже учитывать и суммировать, а то на счету 1млн, а элитного
  тренера какого-то нельзя брать.»** – BUILD or ANSWER, decide after reading the gate: the
  affordability check ignores income that is not the bank balance, so a millionaire is refused an
  elite coach. Find what the gate actually reads.
  - **WHAT THE GATE READS, MEASURED FIRST.** `coachMarket()` cut `overBudgetCents` from
    `parentIncomeForWeekCents(seed, background, week)` and NOTHING ELSE. Probed on a real career at
    week 120 with his million banked: parents $482.94/wk, savings interest **$600.00/wk**, and the
    test saw only the first – so all four Elite coaches printed "$33-176 over" while more than half
    the family's weekly money was invisible to the thing refusing them. His «%» is
    `ECONOMY.savings.apyWeekly`: `accrueSavingsInterest` credits `round(fundsCents × apyWeekly)` at
    the top of EVERY tick, deterministically, zero RNG. **VERDICT: a bug in the denominator, not a
    wording problem** – it is a wage the balance pays, and at a million it is larger than the
    parents' own. (The Elite RANKING gate is not involved: `ECONOMY.coach.eliteGate.enabled` is
    `false`, so `lockedPoints` is always null. And the row was never actually un-pressable – only
    `current` and `lockedPoints` disable it – so the refusal he read was the dimming and the "$X
    over" label, which is item 11's half of the same screen.)
  - **SHIPPED.** `familyWeeklyIncomeCents(world)` = the parents' contribution + the savings interest
    + a signed kit deal's retainer PRO-RATED over the year (`payRetainer` fires four times a year, so
    counting it whole would make an Elite coach affordable on four weeks and refused on forty-eight).
    Prize money, appearance fees and result bonuses are deliberately OUT: they are paid for a result,
    and a weekly retainer underwritten by them is a family one bad draw from not paying. The RESERVE
    stays out too – that ruling («a reserve pays for one week of anything») is untouched; what was
    wrong was the week's income. At his million the cap is $1,074.23 and no Elite coach is over.
  - **AND A LATENT BUG THE FIX WOULD HAVE EXPOSED:** the budget meter RECOVERED its cap from whichever
    row was over budget, which returns 0 when none is – i.e. exactly his case, once the income is read
    in full. `coachBilling` now carries `weeklyIncomeCents` and the screen draws that.
  - Evidence: `tests/component/round21-coach.test.ts` §12 – a real world built and ticked, funds set
    to $1M, the value read out of REAL state (recomputed from `ECONOMY` at the test, never restated
    as a constant), plus the other direction on the same career: empty the account and the same
    coaches go back over budget by exactly the parents' shortfall, which is what makes it a
    measurement of the interest rather than of a widened threshold. Mutation-verified.
