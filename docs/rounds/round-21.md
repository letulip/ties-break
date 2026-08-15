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
- [ ] **2. ⚠ REOPENED, THIRD ASK. «Тренер всё ещё не едет на соревнования, как так? Уже 3й раз прошу
  сделать»** – BUILD. Round-20 #1 answered this with an explanation instead of a build: the mechanic
  was measured in three versions on 30.07, all three failed, he cancelled it, `docs/decisions.md`
  recorded the consequence, and I relabelled the toggle to say why it will never open.
  **Asking a third time overrules that cancellation.** `setCoachOnEventWeeks` still has no caller
  anywhere in `src/`. This time it gets wired, and the toggle has to do something on his screen.
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
- [ ] **4. «...только 1 раз за весь сезон смог пройти 1й раунд турнира из всех попыток, в 250 чуть
  лучше. Это как-то не очень метчится с нашим процентом побед»** – MEASURE FIRST, and it may be MY
  regression: the Slam draw went 32 -> 128 and the 1000 32 -> 64 this morning. More rounds means more
  first rounds, and a 128 draw from the same entrant band may SEED her differently. Answer with the
  per-round rate on the new draws against the old, off his own save.
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
- [ ] **7. «У тренера на карточке "Too early to tell 49 weeks of 52" – звучит довольно смешно, сезон
  уже сыгран.»** – BUILD, and it is three asks in one sentence:
  - 7a: the copy at the top of the window should be «обсудим в межсезонье», not "too early to tell".
  - 7b: drop the "of 52" framing – a rolling 52-week bar is the wrong clock for a question the
    season answers.
  - 7c: make it depend on WHEN the coach was hired. First half of the season -> "too early" is fair;
    second half -> it should already be saying "not long enough yet" and moving its own bar down the
    year. **He asks whether it already works that way – check before building.**
- [ ] **8. «В 19 не было варианта выбрать колледж, только про или завязать»** – BUILD. Task #102 has
  the design (college as a second act, not a coda) and nothing was built. At the fork she is offered
  two doors where the spec says three.
- [ ] **9. «Попап с развилкой появился сразу после финального матча чемпионата перекрыв интерфейс
  таблицы и завершения. Нам надо как-то всё-таки разобраться с порядком появления попапов, чтобы они
  не конфликтовали с происходящим на экране... кроме травмы, которая как раз должна появляться в
  моменте.»** – BUILD, and the general rule is the deliverable rather than the one collision: a
  blocking popup must wait for the screen to be idle, with the injury popup the stated exception.
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
- [ ] **11. «Выбранного тренера давай в жёлтую рамку возьмём и чтобы портрет его подсвечивался
  всегда, независимо от дохода семьи.»** – BUILD. Two things: an accent frame on the CHOSEN coach,
  and his portrait lit whether or not the family can currently afford his tier.
- [ ] **12. «у нас есть ещё %, надо их тоже учитывать и суммировать, а то на счету 1млн, а элитного
  тренера какого-то нельзя брать.»** – BUILD or ANSWER, decide after reading the gate: the
  affordability check ignores income that is not the bank balance, so a millionaire is refused an
  elite coach. Find what the gate actually reads.
