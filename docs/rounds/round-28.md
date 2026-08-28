---
type: round-ledger
status: current
area: rounds/28
canonical: false
last-reviewed: 2026-08-28
---

# Round 28 – a full career replayed, 17 items (28.08.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**His own words, in his own numbering, from one playthrough carried past college into the pro years.**
Read off save `alice-cfbv_w675` (⚠ his personal save, `~/Downloads`, READ-ONLY – never copied into the
repo, never a fixture) plus three screenshots: the Trophies cabinet, and two Season views.

⚠⚠ **THIS SAVE PREDATES THE COLLEGE FIXES.** It was played on `main` before
[#112](https://github.com/letulip/ties-break/pull/112) existed, so anything round 27 closed is
**not in this build**. Item 3 is the visible case and it is not a regression – see its line.

⚠ **THIS FILE IS THE LEDGER, NOT THE ARGUMENT.** Diagnoses, measurements and refusals live in the
specs each item names.

⭐⭐⭐ **MEASURED 28.08, AND IT KILLS THE PREMISE WE WERE HOLDING §3 ON.**
⚠ Measured into THIS ledger rather than a spec of its own – I named a
`the-rank-she-deserves-2026-08.md` here before writing it and `context:audit` caught the dangling
link, correctly. The growth half lives in
[how-fast-she-grows-2026-08.md](../specs/how-fast-she-grows-2026-08.md); the calendar half in
[the-calendar-she-can-reach-2026-08.md](../specs/the-calendar-she-can-reach-2026-08.md). Read off his
save with the engine's own `coreForStanding` and `ratingOf`:

| | |
| --- | --- |
| her skill core | **60.8** (ceiling 62.7, she is at 97% of it) |
| what the SKILL LAW says that core is worth | **standing #26** – by full rating, **#36** |
| her actual ranking | **#93**, WTA **#110** |
| she beats a player at her OWN rank | **64.8%** |
| she beats a real #32 | **47.3%** – a coin flip, not a wall |
| her season points | **791**, where the tier bands put a #36 at **1400+** |

⚠⚠ **She is not too weak for the 250s. She is UNDER-RANKED BY ABOUT SIXTY PLACES**, and every
symptom in 11, 13 and 16 falls out of that one gap: strength ahead of ranking means she climbs fast
(11), is unseeded and meets seeds in round one (13), and cannot convert either into a title (16).

⚠⚠⚠ **AND ROUND 27 §3 READ THE WRONG COLUMN – SO DID I.** `FIELD.tourElite.core = [67, 77]` is not
the STRENGTH of the top 64; `careerAt` (fieldPros.ts:833) draws the opponent's core from
`coreForStanding(standing)` and uses `tier.core` only to spread that storey's POINTS. The real
strength of the top 64 runs **76.4 at #1 down to 55.2 at #64**, fitted to the live 2026 Elo list.
**«The college field is calibrated too high» was never true.** The §3 hold was correct for the wrong
reason and the reason has to be replaced, not inherited.

⭐⭐ **Items 3, 11, 12, 13 and 16 are not five questions.** 11/13/16 are one question asked from three
directions – *she reaches the top 100, and yet the 250s and 500s are a wall* – and 12 is the schedule
that feeds them. They are measured together or not at all, and they inherit round 27 §3, which was
held open for exactly this reason.

---

- [x] **1. «При наличии массажиста добавить в соответствии с выбранным тиром сессии массажа в
  расписании»** – **build.** The masseur is bought and billed but never appears in the week. The tier
  should decide how many sessions land, the way the coach's tier decides his.
  ⭐ **SHIPPED, and it was a SURFACING job – no schema move.** The dial already existed
  (`masseurSessionsPerWeek`, `ECONOMY.masseur.rungs` = 2 / 4 / 7); no week had ever drawn one of its
  sessions. `CalendarWeek.masseurDays` now carries exactly `masseurSessionsPerWeek` day indices
  (`masseurDaysFor`: her training days first, then the free ones – so `Daily` is every day) and
  `weekGrid.ts` draws one `Body work` hour on each, in the last free hour of that day so it can never
  paint over a session. ⚠ **The weeks that draw NONE are the weeks the ENGINE pays him nothing for** –
  college, a booked family week, a trip he did not travel to, and a SHOOT week (`accrueCondition`:
  «lights and flights, not his table»). Evidence: `tests/component/round28-week-and-season.test.ts`
  mounts CalendarScreen at two rungs and counts the rendered blocks – 2 vs 7, each equal to its rung –
  and the middle rung lands at 4. Mutation-verified three ways (rung ignored → red; hire clause
  dropped → red; shoot exemption dropped → red).

- [x] **2. «Предложение от спонсора с часами пришло на сорок четвёртой неделе А на сорок восьмой уже
  истёк срок рассмотрения мне казалось мы договаривались про 5 недель»** – **build.** w44 → w48 is
  **four** weeks of shelf life against a ruling of five. Either the constant is 4, or it is 5 and the
  arithmetic is inclusive/exclusive by one. ⭐ His memory of the ruling is the spec here.
  **SHIPPED.** It was the constant, not the arithmetic. The sponsor with the watches is the
  ADVERTISING letter – `ECONOMY.advertising.brand` is a watchmaker, «Quiet Hour» – and its clock was
  `ECONOMY.advertising.decideWeeks: 4`, counted inclusively (`arrival + decideWeeks - 1`). Filed on
  W44 it died on W47 and was gone when he looked on W48, exactly as he read it. **4 → 5.**
  ⚠⚠ **AND THE FIVE HE REMEMBERS WAS NEVER WRITTEN DOWN FOR THIS LETTER – the spec and his memory
  disagreed and the disagreement is the finding.** The only statement in the repo was the constant's
  own comment, *"Four weeks to decide – the same thinking time the kit window's letters get"*, and
  that sentence is where the bug came from: the KIT window is five weeks wide
  (`SPONSOR_WINDOW_WEEKS` = «межсезонье +2»), and what a kit letter actually gets is **five weeks for
  the first of a winter down to two for the last**, because its deadline belongs to the WINDOW and
  not to the letter (`docs/specs/sponsor-window-2026-08.md` §3.1). Whoever wrote the ad letter read
  "the same thinking time" off `sponsorship.decideWeeks` – the number that *sizes* that window – and
  got four. His memory matches the window's first letter; nothing ever ruled four for the campaign.
  ⚠ The two clocks stay separate on purpose: an ad letter arrives on whatever week a campaign
  notices her, so it cannot inherit «every letter dies when the window closes» without leaving a
  decision open in weeks she is playing. Nets: `tests/ad-offer.test.ts`, a new block that asserts the
  ruled number as a **literal** (every other deadline assertion in that file is written as
  `AD.decideWeeks - 1`, so not one of them could have failed) and measures the shelf life from
  **four different arrival weeks** – flat five, live on all five, gone on the sixth – plus his own
  report replayed in the labels he read (`W44` filed, still answerable on `W48`). Mutation-verified
  twice: back to 4 reddens 4 tests, and a batch deadline (all letters expiring on the season's last
  week) reddens the shelf-life pair. Argument recorded on the constant itself and in
  `docs/plans/the-face-and-the-court.md` §6; no bench – this is a duration ruling, not a tuning.

- [?] **3. «Снова "один день" на день рождения. Эта правка была до колледжа или нет ещё? Может быть
  надо какую-то логику дополнительную сделать, например раз в несколько лет иди просто вообще 1 раз
  только такое пожелание показывать?»** – **answer + ask, NOT a reopen.** ⚠ The fix is round 27 #7 and
  it is round 27 #7. ⚙ **[#112](https://github.com/letulip/ties-break/pull/112) IS NOW MERGED** (28.08),
  so the fix is in `main` – **his save was played on a build without it**, which is why he saw it again. Shipped there: a one-birthday cooldown on the VOICE, longest run **4 → 1**,
  careers that ever run three in a row **4 of 12 → 0 of 12**, share 30% → 24%. ⭐ **But he is now
  asking for something stronger than what #112 ships** – «раз в несколько лет» or «вообще 1 раз». That
  is a new ruling, not the old fix, and it collides with his 11.08 ruling that the day must stay on the
  card every year. Sharpened as an ask below.

- [x] **4. «Для съёмочных недель для спонсоров надо сделать какие-то отдельные плашки или хотя бы
  какой-то символ выделения в календаре в сезоне»** – **build.** A shoot week is currently
  indistinguishable from a training week in the season feed.
  ⭐ **SHIPPED, also pure surfacing** – the feed already had the fact (`snapshot.adShoot.weeks`) and
  never read it. `CalendarRow` gained a `shoot` FLAG beside `injured`/`exam` rather than a `kind`,
  because a shoot week is «not blocked and not double-charged»: a tournament, a family week and a
  friendly on a shoot week all genuinely happen, so a mark that had to displace one of them would lie
  about the week on the four rows it is not. The chip (`.shoot-chip`, the wallet's `--cat-shop`
  magenta, the injury chip's shape) therefore renders on **all five row shapes**, and a week with
  nothing else on it is also TITLED `Shooting week`. Evidence:
  `tests/component/round28-week-and-season.test.ts` – a shoot week renders the mark, a training week
  does not, and two named weeks render exactly two marks. Mutation-verified three ways.

- [ ] **5. «2 травмы за первый год после колледжа»** – **measure.** ⚠ Prevalence was measured this
  month at **30–54%** across a career; two in one season is a different statistic (a per-season rate),
  and it has never been read out. ⚠⚠ And college suspends body cost entirely (round 27 #11, his own
  ruling) – **the first year back is the first year her body is loaded again**, so the question may be
  a re-entry spike rather than a rate.

- [x] **6. «И на кнопки соответственно перед съёмочной недели тоже надо писать Shooting week и как бы
  в продолжении деле тоже комбинации делать и тренировочных дней и слоты фотосессии добавлять»** –
  **build**, and it is 4's other half: the button that advances into a shoot week must name it, and the
  week itself should mix training days with shoot slots rather than consuming the whole week.
  ⭐ **SHIPPED, both halves.** (a) `useWeekAhead` gained a `shoot` kind labelled **`Shooting week`**,
  sitting exactly where `lookAheadFor` puts a shoot – below the bookings and an entered event, above
  the blackouts – so the marker under the grid and the button above the tab bar cannot disagree; it
  feeds BOTH week controls through `useWeekAction`, and `QUIET_AHEAD` gained `'shoot'` so the span
  pill behaves exactly as it did (the engine ticks straight through a shoot week). (b) The week
  COMBINES: a ninth `DayKind` `'shoot'` takes **the plan's free days and only those**, which is the
  engine's own charge drawn – `accrueCondition` pays a shoot week the travel figure, i.e. it keeps her
  sessions and forfeits the REST. Her session count does not move; the eyebrow and the read-out name
  the brand. Evidence: mounted assertions that `.cal-go-btn` reads `Shooting week` on a shoot week and
  `Training week` otherwise, and that the drawn week carries training blocks AND shoot blocks with the
  shoot landing on exactly the free days. Mutation-verified (label branch deleted → red; shoot takes
  every day → red; shoot takes none → red). ⚠ `e2e/journey.ts`'s advance-button locator is a
  deliberately CLOSED set of `weekAhead`'s labels – its own comment says a new week kind is meant
  to arrive there as a decision – so `Shooting week` is added to it.

- [?] **7. «Что с остальными разделами магазина? Яхты, самолёты, строительство академии»** –
  **answer.** Slice 1 (cars) shipped; the spec carries yachts, the parents' plane and the academy.
  Their queue position is his call.

- [x] **8. «На странице коучей в верхнем блоке с недельными тратами и доходами можно совокупную всю
  цифру показывать с учётом массажиста (и психолога в будущем), и даже на магазин растянуть, т.к. там
  тоже есть и с доходностью инструменты и с расходом»** – **build.** One weekly figure that actually
  totals the household, not just the coaching line.
  ⭐ **SHIPPED.** A second line under the coaching meter: `Household, every week – $X in, $Y out,
  $Z left over` (or `short`). `HouseholdWeekly` on `coachBilling`, computed by `householdWeekly` in
  `engine/world/coachMarket.ts`. **OUT** = the training bill (`coachBilling.weeklyCents`, coach +
  court) **+ a hired masseur's salary** + the shelf's weekly loss; **IN** = `familyWeeklyIncomeCents`
  + the shelf's weekly gain. A psychologist joins as one more line in that list and nothing else
  moves. ⚠ **The coaching meter above is UNTOUCHED** – "can I afford this coach" is round-21 #12's
  claim and is a different question; overwriting it would have deleted a shipped answer. ⚠ **The
  shelf is his «и даже на магазин растянуть»**, signed and asked of `assetValueCents` itself (one
  more week of holding), so a deposit yields and a car costs; it is carried as a memo beside the
  three figures and is **deliberately NOT in `weeklyIncomeCents`** – an unrealised gain is not cash
  and that field is the affordability cap. ⭐ **It also quietly fixed a second thing:** the old meter
  read the CURRENT ROW's price, so a self-coached family saw `$0.00 committed` while paying the
  facility rate every week.
  **Evidence:** `tests/component/round28-household-block.test.ts` – 7 mounted assertions on the
  rendered strip, hired vs not hired (the figure moves by exactly his salary, and the two screens
  really differ), the shelf arm, and a guard that the coaching meter still says what it said.
  ⚠ Mutation-verified, 4 mutations, each alone: masseur term dropped → §1+§2; shelf term dropped →
  §3 only; the strip bound back to `committedCents` (the shipped defect) → §1, §2, §3; income halved
  → §1. ⚠ **The first draft survived the income mutation green** – the expectation was read back off
  the field under test – so §1 now rebuilds it from `parentIncomeForWeekCents` + interest.

  ⭐⭐ **APPROVED («это хорошо»), AND THE FOLLOW-UP SHIPPED:** «а мы можем эту шкалу на вкладке
  массажиста тоже показывать?» The strip is now on **`SupportStaffTab.vue`** too, at the head of the
  payroll. ⭐ His reasoning is the good part and it decided the placement: a salary on that payroll is
  one of the lines the strip totals and **the dial that sets its size is on that tab**, so it was the
  one screen where a rung could be chosen without seeing what the rung does to the week.
  ⚠⚠ **ONE SOURCE, STRUCTURALLY.** The block became `src/components/HouseholdStrip.vue`, which reads
  `snapshot.coachBilling.household` **itself and takes no props** – a caller cannot hand it a
  different number, so there is nothing for a second implementation to be. Not decoration: two tabs
  quoting one figure from two computations is the same defect class this strip was written to fix
  (the meter beside it once read the current roster row's price and told a self-coached family it
  committed $0.00 a week). The global `.budget-*` rules stay global for the same reason; one new
  `:first-child` rule drops the separator hairline when the strip opens a card instead of following
  the legend.
  **Evidence:** `tests/component/round28-household-shared.test.ts` – 6 mounted assertions: the strip
  on the staff tab hired and unhired, its position above the payroll (that chapter exists because he
  could not find something at the bottom of a page), ⭐⭐ **both surfaces mounted against one snapshot
  printing the same string, on two households of different shape**, and pressing a rung moving the
  OUT figure by exactly the rung difference through the real click path and the real engine command.
  ⚠ Mutation-verified, and the asymmetry is the record: **the shared source moved → five reds across
  BOTH files; the sharing broken (staff tab hand-rolling its own figure) → the parity tests red while
  the Coaches-only file stayed entirely green**; the dial disconnected → §3 alone.

- [?] **9. «Может быть с появлением магазина надо переписать спеку про безусловную % доходность на
  текущий счёт? И оставить этот момент уже на управление игроку, убрав текущую автоматическую, т.к.
  довольно часто на текущий счёт никаких % не приходит в банке обычно»** – **ask.** ⭐ He is right about
  the real world, and this is a balance decision, not a bug: the automatic interest is a large silent
  income line. Removing it makes the shop's yield instruments matter and makes the parent manage money
  – it also removes a floor that the economy may currently lean on. Needs a measurement before a ruling.

- [x] **10. «На всплывающих сверху уведомлениях есть кнопка Dismiss с 3 словам на ней, выглядит
  неаккуратно, давай просто оставим Dismiss и всё»** – **build.** One word, one button.
  ⭐ **SHIPPED. Three top-of-screen notification surfaces, enumerated:** `.recovered-banner` (damaged
  autosave) and `.stop-toast` (the advance's stop reason) both carried the three-word copy and now
  read exactly `Dismiss`; `.update-banner` (the PWA update prompt) has no dismiss control at all – its
  only button is `Update` – and is asserted as such so the day it grows one, it gets the same word.
  ⚠ This OVERRULES defect D11, which had deliberately put the disambiguation in the VISIBLE copy; the
  two banners can be on screen together, so the names moved to `aria-label` («Dismiss autosave
  notice» / «Dismiss stop notice»). WCAG 2.5.3 is satisfied, not breached: each label STARTS with the
  visible word. `tests/a11y-banner-names.test.ts` is **re-aimed, not deleted**, and points at the new
  layer. ⭐⭐ **And `App.vue` is mountable for the first time** – the `virtual:pwa-register` import that
  blocked it is now aliased to a stub on the `component` project alone – so
  `tests/component/round28-top-notices.test.ts` raises both strips at once and asserts the RENDERED
  text, which is the claim D11 could only ever state backwards. Mutation-verified: restoring the old
  copy turns three blocks red.

- [~] **11. «Alice за 2 года до топ-100 добралась, это нормальный темп?»** – **answer**, and the
  measurement already exists: [how-fast-she-grows-2026-08.md](../specs/how-fast-she-grows-2026-08.md).
  ⚠ Median first top-100 is **18.9** and the research anchor is ~22, with 22 sitting at the **p90** –
  so no, two years is not normal, it is the median case of a curve we already know is too fast. Round
  27 §9. ⚠⚠ **But the measurement above reframes it**: two years is fast because her STRENGTH is
  genuinely top-40 by season 5 – the climb is not too fast for the girl, the girl is too strong for
  the anchor. ⭐ Same gap as 13 and 16, seen from the other end.

- [ ] **12. «Посмотри на скриншот с распределением турниров… Давай подумаем как распределить турниры
  по году ещё раз в зависимости от уровня игрока и закрывать дыры одновременно в расписании… Проверь
  пожалуйста доступные турниры для Alice из сейва и сравни с выдачей в сезоне, всё ли корректно?»** –
  **measure first, then build.** Two claims to check separately: (a) the calendar has holes – his
  screenshot shows runs of three and four consecutive training weeks; (b) the entitlement he can see
  («Also open to her: WT125 Grass – none scheduled in the next 8 weeks») disagrees with what the season
  actually offers. ⭐ His own proposal: **let higher tiers replace lower ones** so density and choice
  survive as she climbs. ⚙ **MEASURED on his save, and (a) is not what it looks like**: season 13 has
  **47 of 48 weeks carrying at least one event** – only w685 is truly empty. But the tier mix is
  `w15 25 · j30 25 · local 25 · j60 16 · w35 16 · regional 12 · w50 12 · wta500 10 · wta250 8 · w75 8
  · wta1000 8 · national 6 · slam 4 · w100 4 · j300 4 · wta125 4` – **a quarter of the calendar is
  junior and domestic events she outgrew nine seasons ago**, and **12 of 48 weeks offer her nothing
  above w35**. ⭐⭐ **His proposal is exactly right and the measurement backs it**: the weeks are not
  missing, they are occupied by tiers that are dead to her.

  ⚠⚠ **HE PUSHED BACK AND HE WAS RIGHT – my first count was dishonest.** I counted weeks carrying
  ANY event, junior and local included. Re-measured on HER OWN playable set
  (`w50 w75 w100 wta125 wta250 wta500 slam`; `w15`/`w35` are closed to the top 150, `wta1000` needs
  the top 65, juniors aged out, `regional`/`national` refused for want of DOMESTIC points):

  | | |
  | --- | --- |
  | events playable in season 13 | **50** |
  | weeks they land on | **34 of 48** |
  | ⚠ weeks with nothing for her | **14** |
  | ⚠ events stacked on an already-busy week | **16** |
  | longest hole | **2 weeks** |

  ⭐⭐ **50 events, 48 weeks – the SUPPLY is already right and the DISTRIBUTION is wrong.** 16 events
  land on a week that already had one. ⚠ Honest limit: his screenshots are season **12** and I
  measured **13**; season 13's longest hole is two weeks, so I have not reproduced his exact run.

  ⚠⚠ **THREE DEFECTS FOUND IN THE FEED, none of them the one the item names:**
  1. **`Local Open` never closes.** At 26, WTA #110, it is open with `outgrown=n` – **4 of the 12 open
     slots in the next 8 weeks are Local Opens.** Its band is `[0, 85]` on DOMESTIC points, which she
     stopped earning nine seasons ago, so the gate that should graduate her never fires.
  2. **The domestic ladder locked her OUT while local stays open**: «Not enough national pts for
     Regional Championship yet (need 65)» and «…National Series yet (need 150)» – said to the world
     #110. Same root, opposite sign.
  3. **Junior rows still render in her feed at 26**, with reasons that read absurd against her rank:
     «Junior Tour 60 takes the top 100 – she has no international ranking yet».

  ⚙ **The owner approved plan B** – «это хороший план, как раз пересекается с моим пониманием».

  **His top-50 requirement, measured on his own season 13.** Mandatory events never collide: slams
  land on 678/697/702/710 and WTA 1000s on 681/684/688/694/707/713/717/721 – **no shared week**, and
  it is guaranteed by construction (anchored tiers are placed by name from disjoint lists, pinned in
  `tests/season/calendar.test.ts`). ⚠ **But the rung below them collides with them six times a
  season**: 678 slam+250, 691 250+500, 697 slam+250, 710 slam+125+250, 715 250+500, 721 1000+250.
  No penalty – she plays the compulsory one – but six events land on a week she is already committed
  to, and that is choice destroyed rather than offered.

  ⚠ **And `act2-pro-tour.md` §517 already rules what he is asking for**: at the top, «the big events
  are compulsory and **the rungs below stay open as filler**». Part 0 measured the opposite –
  `PLAY_DOWN.fromAllW` bars the whole W series at once inside the top 50. **Design and build
  disagree, and the build is the one that is wrong.**

- [~] **13. «Нормально ли с Alice с таким количеством вылетов в первых раундах вообще до топ-100
  добирается? Или мне только кажется, что это странно?»** – **answer.** ⚠ This is the sharpest question
  in the round, because it points at a possible contradiction in the model rather than at a defect:
  first-round exits and a top-100 rank should not coexist this comfortably. ⚠⚠ It also touches round
  27 #14 (**our favourites are SAFER than the research, 11% vs 19.2%**), which he has just put on hold –
  answering 13 must not quietly re-open 14. ⚙ **ANSWERED: it is not strange and it is not two things.**
  She is unseeded at #110 while playing to a #36 standard, so round one hands her a seed – and the same
  gap is why she still climbs. ⭐ **Both halves of his sentence are the one gap.**

- [?] **14. «Нужно ли на время колледжа приостановить накопление % на выплаты ребенку от выигрышей или
  нет?»** – **ask.** ⭐ College already suspends the coach and the masseur and zeroes body cost; her
  cut is the one standing instruction that has never been examined against the freeze.

- [x] **15. «С чеков спонсоров мне кажется ребёнку тоже нужно % перечислять, как и с призовых, давай
  сделаем»** – **build.** A ruling, not a question: her cut extends to sponsor cheques.
  ⭐ **SHIPPED.** One splitter, `bankSponsorCheque` (`engine/world/sponsors.ts`), at four sites. Same
  `ECONOMY.kidShare` ramp, same single rounding, family keeps the remainder by subtraction, same
  `FinanceWeek.kidShare` memo. ⚠ **NOT the plan's step 5** – that gives her the WHOLE fee; he asked
  for the prize ramp, which is a share. Step 5 stays open.
  ⚠⚠ **WHICH CHEQUES, AND WHY.** The line is not taste: it is the one `sponsors.ts` already drew in
  2026-08 – «every one of them is a cheque somebody writes to the PLAYER rather than a price the
  family pays».
  **HERS:** the advertising fee (`cashCents` – «a brand buys her face, not the family's»); the **kit
  retainer** (`retainerCents` – a quarterly cheque for HER wearing the brand, the largest sponsor
  money in the game; excluding it would make «как и с призовых» mean *some* cheques); the **result
  bonus** (`bonusShare` – literally `share x TIERS[tier].prizeCents[finish]`, so leaving it whole
  would make her realised share of a winning week FALL as sponsorship grows); and the **appearance
  fee** – ⚠ **not named in his sentence**, included because it is indistinguishable from the other
  two and a rule that skipped it would be arbitrary. **It is the one line to take back out if he
  disagrees.**
  **NOT HERS:** the kit allowance (it buys her rackets – a cut leaves her half a racket); the kit
  travel share (reduces a fare, nothing lands); the local-sponsor cameo (need-based rescue written to
  the family – a cut of a rescue inverts it); the academy scholarship and its grant.
  ⚠⚠ **ONE BALANCE CONSEQUENCE, AND IT IS HIS TO KNOW ABOUT.** `familyWeeklyIncomeCents` – the coach
  market's affordability cap – had to stop quoting the GROSS retainer, or the meter would state money
  the till no longer banks (round-21 #12 in mirror). Closed-form, since it is linear: the cap falls
  by `bps/10000 x retainerCents x 4 / 52` **for a family holding a kit deal, and by nothing at all
  for one holding none.** At the icon rung ($37,500/quarter): **$288/wk at her first 10%, $1,442/wk
  at the 50% cap**; at the tour rung ($1,500): $11.50 and $57.70. ⚠ **Nobody is locked out** –
  `hireCoach` never consults the budget, so `overBudgetCents` colours a card and refuses nothing;
  «мы ни за что не наказываем» holds. **And no new way to go negative:** every site is an income
  line, `herShare <= gross` always, so a cheque can only add less, never subtract.
  ⚠ **Forward-only, no schema move.** `kidFundsCents` is persisted, so this changes what lands there
  from the week it ships and rewrites no existing save. No field added anywhere, so
  `SAVE_SCHEMA_VERSION` does not move.
  **Evidence:** `tests/round28-sponsor-cut.test.ts` – 13 assertions across §1 the ad fee, §2 the
  other three cheques, §3 the categories that are NOT hers (a full-season walk proving the allowance
  never touches her account; the cameo driven through the real tick), §4 the cap. ⚠ Mutation-verified,
  4 mutations: rate moved → the two literal-pinned tests only; split removed → 8 of 13; **the RULE
  widened (the cameo routed through the splitter) → §3's cameo test ALONE**; cap back to gross → §4.
  ⚠ **The first draft survived the rate mutation entirely green** (every expectation read the same
  constant), which is why §1 and §4 now each carry one literal pin.
  ⚠ **Two guards RE-AIMED, not deleted:** `tests/ad-offer.test.ts`' «and NOT her account» now asserts
  the split and the penny rule (a sharper claim than the one it replaces), and the stale «`world.ts`
  is the ONLY writer of `kidFundsCents`» note in `tests/kid-share-memo.test.ts` is corrected.

- [~] **16. «250 и 500 всё ещё выглядят почти как стена… в 35 году она взяла 2 250 победой, а с тех
  пор после колледжа смогла только 1 раз до 2 места дойти… А в 500 вообще пусто. При этом она около
  топ-100. Проверь пожалуйста этот момент. И вообще оцени её перформанс опираясь на скиллы и
  статистику»** – **measure.** The cabinet: **WT250 champion ×2 (both '35), runner-up ×1 ('42), WT500
  empty, WT1000 empty.** ⚠⚠ **The shape he is describing is a career that got WORSE after college
  while its rank did not** – two titles at 17-ish, nothing for seven years. That is the growth curve
  (round 27 §9: 90% of her ceiling spent by **16.4**) seen from the trophy cabinet, and it is why §3
  was held. ⭐ His «оцени её перформанс опираясь на скиллы» is the right instrument: read her actual
  skills out of the save and ask what result they DESERVE. ⚙ **DONE, and the verdict is that she is
  UNDER-performing her ranking's expectations while OVER-performing her ranking itself.** ⚠ And the
  cabinet is not as empty as it shows: `bestFinishByTier.wta500 = 2` – **she has reached a WT500
  semi-final**, which the cabinet does not display because it shows only champion and runner-up.
  That is a display finding of its own and it belongs to 4's family.

- [ ] **18. ⚠ THE HALF OF ROUND 27 #13 THAT WAS NEVER ANSWERED (found 28.08, his own reference)** –
  «И чем дело кончилось по моему вопросу-референсу с DnD системой и перезагрузкой сохранения,
  напомни пожалуйста, я это пропустил.» ⚠⚠ **It was a DOUBLE question and only half of it closed.**

  Closed: «рельсы или нет» – the lever bench, 300 trials, his own ruling «вариативность всё-таки
  есть, это хорошо, значит не рельсы» (round 27 #13).

  **Never answered anywhere** – not in round 27, not in a spec, not in the backlog: «возможно ты прав,
  но это игра. Я когда играю в Pathfinder Kingmaker… пользуюсь этим иногда в особо сложных битвах и
  проверяю какие мои действия дадут какие результаты. Есть стены непроходные – это ок "недорос", но
  есть и криво выпавшие кости. Это другой момент. **Может быть можем какую-то грань найти здесь.**»

  ⚠ **This is a silent drop, exactly the failure the ledger exists to prevent**, and it was mine.
  The question is real and unresolved: RNG input-independence (the permanent law, frozen capture
  41550 / `e6b0c709`) means a reload replays the same dice, so a lost match is lost for ever. He is
  not asking to break the law – he is asking whether there is a LINE between «she was not good
  enough», which should stand, and «the dice fell badly», which a player may reasonably want to
  re-roll. **Needs a spec of its own before anything is built; it touches the one law nothing else
  may touch.**

- [x] **17. «Baseline athletic 2 раза письмо о спонсорстве прислали на 48 и 52 неделе одинаковое»** –
  **build.** A duplicate offer from one brand four weeks apart. Related to 2 – both are the sponsor
  offer clock – and they belong to one agent.
  **SHIPPED, and it is not the same clock after all – it is a seam.** The two letters in his save are
  `kit-671` (W48, the window's opening week, tier `tour`, refused) and `kit-renew-kit-567` (W52, the
  closing week, `renewal: true`, signed). W48/W52 are the 1-based labels of window weeks 47 and 51,
  to the week. Both are Baseline Athletic because **the contract that was ending under her,
  `kit-567`, came from that very rung** – so the LADDER wrote to her as a stranger on its own slot,
  and the RELATIONSHIP wrote to her four weeks later. `raiseKitOffers` already dedupes rung against
  rung (round 17 #27, the earlier «two identical Baseline Athletics letters, W48 and W49» report) and
  `raiseKitRenewal` is idempotent on its own id; nobody asked whether the two were the same brand.
  ⭐ **The renewal is the one the design keeps** and the rung's letter is the duplicate, on three
  grounds already written down: `raiseKitRenewal`'s header puts the incumbent LAST precisely because
  «the incumbent is the letter a parent is likeliest to sign on sight», so a letter from that brand
  on slot 0 is the placement that header forbids; only `renewal: true` renders «Another year in our
  kit» – without it the paper says «A kit deal for your daughter» and *introduces* a brand she has
  worn all season; and suppressing the renewal instead would make the relationship depend on a
  competing letter's dice, when «⚠ NO DICE» is a pinned property of it. Fix: `raiseKitOffers` seeds
  its `alreadyWritten` set from `dealEndingWithSeason` – one line, no new state, no migration, and
  the slot ids either side of the hole are deliberately unchanged so no rung's dice are re-keyed.
  Net: `tests/offers.test.ts`, a test that runs the contract to its natural end (goodbye reason
  `term`) and reads **`toSnapshot(world).offers` through `InboxSheet`'s own `live()` predicate** on
  every week of the window – no brand twice – plus one letter per brand across the winter, the
  incumbent's being the renewal, and the season's feed row naming the brand in one voice.
  Mutation-verified: dropping the suppression reddens it with «week 51: Netrally Distribution, String
  House, String House», his exact report. Two guard blocks **re-aimed with ⚠ notes, not weakened** –
  `careerInTheWindow`'s `rungsWanted` 3 → 2 and the `kit-100/national` line, because that third
  letter *was* the defect (its fixture's outgoing deal is a national one), and the seam test, whose
  second letter now steps her up a rung instead of being her own shop writing twice.
  ⚠⚠ **ONE CONSEQUENCE HE SHOULD SEE, AND IT IS A RULING NOT A BUG.** A career whose ladder is only
  the incumbent's rung – the common shape: the local shop renewing every winter – used to get a
  rolled fresh letter early in the window (five weeks to decide) *and* the renewal. It now gets only
  the renewal, which by his own 10.08 placement lands on the closing week with a **one-week**
  deadline. That is the duplicate being removed, but it is also less thinking time in exactly the
  place item 2 is about. Moving the renewal earlier would reverse two heavily-argued guards (it
  writes last, and it takes no dice), so it is **left as it stands and flagged**: if he wants the
  incumbent's letter to arrive at its rung's slot instead, that is a new ruling.
  ⭐⭐ **HE RULED, 28.08** – «в чем проблема сделать 5? у нас конечная неделя сезона 49 по сути,
  дальше окно в новый сезон, даже если приглашение придет на 1й или 2й неделе я не вижу проблем
  сделать слот в 5 недель». **SHIPPED as #17-b:** every kit letter now carries five weeks from its own
  arrival (`kitOfferDeadline`), the deadline is a property of the LETTER again, and the renewal-only
  ladder – his actual case – carries five weeks instead of one. He knowingly gave up §3.1's «no
  decision is ever open while she is playing»; that property was **already gone**, because item 2 gave
  the ad letter five fixed weeks and ad letters land mid-season. Two windows can never overlap: latest
  death is season offset 3, next window opens at 47, **44 weeks of daylight** – arithmetic, pinned.
  ⚠⚠ **BUT THE MEASUREMENT CROSSES THE LINE AND NEEDS HIM AGAIN – DO NOT MERGE ON MY WORD.** Seasons
  opening with **no kit deal**, patient signer: **27/646 (4.2%) → 354/645 (54.9%)**; careers that never
  open a season bare **117/144 → 13/144**; uncovered opening weeks **10.7 → 21.6 per career**; coverage
  83.3% → 79.3%. ⚠ The **eager signer is identical to the digit** – this costs nothing to a parent who
  answers on sight. The mechanism is NOT the objection he overruled: `fromWeek` is the week he SIGNS
  while `untilWeek` is anchored on the letter's ARRIVAL, so the new weeks are **spent, not banked** –
  before the ruling he could not wait past week 51, so he could not lose. The one-line remedy (a winter
  letter's cover starts at the season's first week however late it is signed) is **named and not
  built**: it changes what a signature means and touches the seam §3.5 protects. Full table, the
  instrument note and the remedy: `docs/specs/sponsor-window-2026-08.md` §12.
  Measured: `npm run bench:sponsor`, 144 careers per arm, the change toggled on one line so both arms
  carry the same tree. **The whole delta is on the PATIENT arm** – local letters **6.34 → 4.17**,
  while the eager arm barely moves (3.46 → 3.51), because an eager signer takes the ladder's letter
  on the opening week and the signature suppresses the renewal, so *he never sees the duplicate*.
  That is why the bench never caught this and the owner did: he plays patient, and his save shows it
  (`kit-671` refused, `kit-renew-kit-567` signed). Coverage ±0.4 pp, 144/144 careers still covered,
  gap distribution identical to the week, 0 winters different by entry week, and **bare seasons go
  slightly DOWN** (28 → 26 / 29 → 27) – nobody lost a deal. Full argument, table and the flagged
  ruling: `docs/specs/sponsor-window-2026-08.md` §11.

---

## Rulings he gave with this round

| | what he said | effect |
| --- | --- | --- |
| round 27 **1/1a/1b** | «если у нас всё ок – мне ок» | ⚙ **delegated to me** – pick the entry-age band and build it |
| round 27 **3** | «надо что-то придумать с этим. Какие варианты?» | ⚙ options owed, see below |
| round 27 **8** | «да, я уже понял, не страшно» | ⚙ **CLOSED**, no repair |
| round 27 **14** | «тогда на стопе пока» | ⚙ **ON HOLD** by his ruling – must not be re-opened sideways by 13 |
| **15** appearance fee | «да, окей, пусть остается пока» | ⚙ **STAYS** in her cut – reviewable, not settled forever |
| **2** letter window | «в чем проблема сделать 5?» | ⚙ five weeks per LETTER, both kinds; §3.1's window deadline retired |
| **12** `tierOutgrown` age clause | «это не страшно, просто по приоритету мы их не покажем. Или просто убрать их на уровне про» | ⚙ fix by PRIORITY/display, not by the age clause – do not touch `tierOutgrown` |
| **12** top-50 | «проконтролировать, что игрок увидит все обязательные турниры в первую очередь и гарантированно, чтобы не было коллизий» | ⚙ requirement recorded – measured below |

## What this round is waiting on

| | what | who |
| --- | --- | --- |
| ⚠ **first** | **the growth curve** – 11, 13 and 16 all reduce to it, and 12 feeds it | measurement, then him |
| **ask** | 3 – how hard to suppress the birthday day, against his 11.08 ruling | the owner |
| **ask** | 9 – remove automatic interest, or keep it as a floor | the owner, after a measurement |
| **ask** | 14 – does her cut pause during college | the owner |
| **ask** | 7 – queue position for yachts, the plane and the academy | the owner |
