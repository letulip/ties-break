---
type: round-ledger
status: current
area: rounds/27
canonical: false
last-reviewed: 2026-08-27
---

# Round 27 – the college mini-round (27.08.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**His own words, in the order he found them, over two afternoons of playing a career through
college.** He asked for them collected: «давай наверное мои все последние правки и замечания по
колледжу в мини раунд со своим документом соберем – много накопилось».

⚠ **THIS FILE IS THE LEDGER, NOT THE ARGUMENT.** Every diagnosis, measurement and recommendation
lives in [college-the-last-mile-2026-08.md](../specs/college-the-last-mile-2026-08.md); a ledger that
restates a spec is a fork that rots. Here: what he said, what it turned out to be, and where it stands.

⭐ **Four of these were answered by reading rather than building, and two of those found that the
shipped behaviour was already what he wanted.** That is worth saying at the top, because the round
reads longer than the work it implies.

---

- [ ] **1. «на первый год колледжа Alice исполняется 20 лет, в то время как ее соперницам 18 – может
  быть мы что-то напутали с возрастом ухода в колледж?»** – ⚠ **True, and it is exactly one line.**
  `schoolEndWeek` lands on the academic-year boundary and `nextAcademicYearStart` is strictly-after,
  so her `delta` is exactly 0 and the function returns `week + 52`: **she skips the September she is
  asked in.** Enrolment is **19.00–19.92 for every birth month**, always. Spec §1.

- [ ] **1a. «надо просто понять в каком возрасте идут в колледжи спортсмены»** – his own narrowing of
  1, and it shrank the job from twenty-four school calendars to one number. ⭐ It also **partly
  vindicated the shipped model**: a 19-year-old freshman is normal for an international tennis
  recruit. **The defect is that there is no spread at all**, not that the value is wrong. And it
  withdrew the decision I had put to him – modelling the age directly does not move the fork, so her
  last junior season is not spent. Spec §1a.

- [ ] **1b. «последний год учебы заканчивается не в сентябре, а сильно раньше, где-то в июне
  примерно вместе с экзаменами»** – ⭐⭐ **and this is the same line as 1.** The model ends every
  academic year, school and college alike, exactly on the September boundary; exams and a June
  graduation do not exist in it. **If the last year ends in June, `delta` stops being zero and 1
  dissolves on its own.** Three observations, one repair.

- [ ] **2. «кнопка "Продолжить год", а при нажатии мы попадаем в the College League – как будто можно
  тоже наш флоу использовать с неймингом кнопки – Play College Open, а уже потом Закончить год»** –
  ⚠ True. The label knows ONE pause inside a year (her birthday) and round 26 added a second. ⭐ The
  function's own comment already forbids this one case earlier. Spec §2.

- [ ] **3. «сотая ракетка мира приезжает в колледж и проигрывает там =))»** – ⚠ **True and measured.**
  The student field draws 44–68 against a professional MIDDLE of 52–62: it is calibrated at the level
  of ranks 30–150, which is where a world #100 sits. **She is playing her equals and they should not
  be her equals.** ⚠⚠ But see 9 – the fix may be at the other end. Spec §3.

- [ ] **4. «на экране итогов матча the College League написано Professional ranking – как будто нет»**
  – ⚠ True. `LadderTrack` has three members and no fourth answer, so a fixture that awards nothing
  must still name a table. ⚠⚠ **This exact defect was fixed once before** and `PendingView.ladder` IS
  that fix; it came back because the type cannot say «neither». Spec §4.

- [ ] **5. «на время колледжа на вкладке Season кнопки подачи заявок и планирования недели задизаблим»**
  – ⚠ True. `SeasonScreen.vue` contains no reference to college at all. ⭐ The ENGINE is correct – it
  refuses with the college sentence – so the defect is entirely about WHEN he learns it. Spec §5.

- [ ] **6. «И опять на те же грабли: "Her country called this year…" во всплывашке сверху и матчи
  только постфактум»** – ⚠ True, and it is the shape round 26 #6/#7 fixed for the League one file
  away. ⭐ His own key: the game knows in advance (`rollCallUp`), so a letter and the ordinary
  tournament flow are available and the toast can go. ⚠ Ships with 4 or after it. Spec §6.

- [x] **7. «И снова она просит "One day, not a week, not a trip"» · «3 раза подряд» · «я просил это
  исправить»** – ⚠⚠ **REOPENED, and he was right to.** His original complaint (round 26 #9) was about
  THE DAY; the measurement found the DIALOG repeating, fixed that, and recorded «the day was never the
  problem». **The dialog fix was real and held. The thing he pointed at was left alone.** And it is a
  guarantee, not luck: the day is exempt from the already-given filter by design, material gifts leave
  the pool permanently, so the day's share rises to 100% once the three drawn options are all hers.
  ⚙ **BUILT: a one-birthday cooldown on the VOICE, never on the option** – the day is on the card
  every year exactly as his 11.08 ruling says, it just cannot be the ask twice running. **Measured:
  the longest run of day-asks goes 4 → 1 and the careers that ever ran three in a row go 4 of 12 → 0
  of 12**, with the share 30% → 24% (late career 34% → 28%). No schema move – the record has held
  `asked` since v48 – and no draw moved. Spec §7.

- [ ] **8. «в History расход за сезон написан 36 тысяч, а на вкладке расходов 25 тысяч. Явно что-то
  там не ладно с нашей математикой»** – ⚠ **Reproduced exactly on his own save** (`w502`, read-only,
  never copied): the tab folds **25 213**, `seasonHistory` season 8 banked **36 514**. ⭐ **The
  arithmetic is not wrong – both call the same fold from the same season start.** The tab shows season
  9 at **34 weeks of 52**; History shows season 8, complete. 25 213 over 34 weeks projects to ~38 500,
  against 36 514 actual. **Two screens say «за сезон» and mean different seasons, and nothing on either
  says so.** Spec §8 – a label, not a repair.

- [~] **8a. «должны были на 5-6к в год экипировки списываться за это время, надо тоже проверить»** –
  ⭐ **Checked, and the absence is his own rule**: `if (!inCollege(world)) resolveGear(world)`, with
  the comment «her kit is the university's for four years» (W2-ENDINGS). Her kit in that save is pro
  on all three lines. **Nothing is missing.** ⚠ And a correction on me: my first probe reported
  «racket: null», which was my probe reading a field that does not exist, not a fact about the save.

- [~] **8b. the wallet check he asked for** – "if the wallet is 19 751 × 4 more than at entry, all is
  well". ⭐ **It is.** College ran weeks 294–502; the season deltas over it are +21 514, +19 574,
  +23 423 and +19 469 = **+83 980** against his predicted 79 004. **The money is consistent** – his
  suspicion was wrong and the numbers say so.

- [x] **9. «а не слишком ли быстро растут наши спортсменки? Alice на момент поступления играла уже на
  500 и шлемах и имела 600к+ в 18-19»** – ⚠⚠ **MEASURED, and every one of his four observations is the
  MEDIAN case rather than a tail** ([how-fast-she-grows-2026-08.md](../specs/how-fast-she-grows-2026-08.md),
  90 careers × 4 manager arms):

  | | measured | anchor / target |
  | --- | --- | --- |
  | first top-100 | **median 18.9** | ~22 – and 22 is the **p90** |
  | rank at 19 | **median #96**, 47.8% top-100 | – |
  | first W500+ main draw | median **18.9**, 61.9% under 19 | – |
  | first Slam main draw | median **19.0** | – |
  | prize banked by 19 | p75 **$799,518**, 30% over $600k | his 600k is normal |
  | junior-majority seasons | **median 1**, and she leaves the junior tour at **15.6** | – |
  | reach top-100 | **93.3%** | **3–6%** |
  | played a Slam | **93.3%** | **<1%** |

  ⭐⭐ **THE MECHANISM, and it is manager-proof: 90% of her rolled ceiling is spent by 16.4** and 92.8%
  by 18; she gains **0.8 power points** between 18 and 19. The anchor's «top-100 about 4.5 years after
  first points» is a climb with no fuel left. **16.4 / 16.4 / 16.2 / 16.1 across four policies whose
  ladder outcomes span 0% to 95.6% – the parent buys rank and money, the parent does not buy skill.**

  ⚠ **The outcome half is subtler and mostly the BENCH'S MANAGER, not the model**: the same engine and
  seeds under the 12.08 `player` policy reach top-100 **8.8%**, today's **93.3%**, `grinder` **0.0%**.
  The 3–6% band is bracketed by the managers and none of the three sits inside it. ⚠ And
  `ladder-vs-targets-2026-08.md` (12.08) is now badly stale – the same tool, unchanged, went from
  «nobody in 160 careers reaches it» to 16/16 top-100 and a median career prize of $457k → **$15.4M**.

  ⚠⚠ **AND IT INVERTS THE ORDER OF 3.** My §3 was also **understated, not backwards**: I had quoted a
  REJECTED draft pyramid. Shipped, the college field's ceiling of 68 sits **above the whole `elite`
  storey and inside `tourElite` – the world's top 64.** ⭐ **Both numbers are wrong; only the order is
  actionable. Decide the growth curve first, or the field is tuned twice against a target that moves.**

  ⚠ My «moving the entry age closes part of the gap for free» is refuted: a year of freshman age is
  worth **+0.8 power points** against an opponent sd of ≈3.2 – **a quarter of one SD**. §1a keeps its
  own reasons and none of §3's.

- [~] **10. «physio -2061 – это без массажиста, здесь нет проблемы, а вот массажиста хорошо бы
  останавливать, как и тренера»** – ⭐ **Already done.** `masseurWorksThisWeek` returns false in
  college: the retainer is suspended, not cancelled, and the hire resumes with the tour. **He asked
  for behaviour that ships.** ⚙ And his «здесь нет проблемы» is recorded as a RULING: the physio
  retainer bills through the freeze (measured: −3 510 over 60 weeks) while the coach's salary is
  suspended, and that asymmetry is **accepted**, not a defect.

- [~] **11. «ZERO BODY COST AND ZERO DEVELOPMENT – для колледжа с одним-двумя чемпионатами в год это
  вполне ок, меня не смущает»** – ⚙ **RULED.** The question I raised is closed. ⚠ One thing recorded
  against it: **the zero is not pinned by any test** – `college-league.test.ts` asserts «awards
  nothing» in points, money and results only. Someone making the championship feel like real tennis
  would trip nothing, and the masseur stand-down would silently turn from correct into a hole.

- [~] **12. «100 из 10 она вылетает в обоих турнирах сразу на 1м матче?»** – ⭐⭐ **No. There is real
  spread, and his result reproduced because it is the same seeded draw, not because it is typical.**
  N=100 on his own pair at full condition: W50 opener **11%**, title **48%**; W75 opener **15%**.
  **Both openers lost: 2 of 100.** ⚠ And the card had told him **85.0%** and **85.3%** – he lost both,
  a one-in-forty-five afternoon. ⚠ He also played the SECOND W50/W75 after the winter, not the first;
  on the first pair she wins.

- [~] **13. «просто рельсы без влияния игрока… мы показываем 70% успеха, но она не пройдет никогда»** –
  ⚠⚠ **Not rails – but the levers he pays most for are the ones that do least.** Over 300 trials:
  an elite coach travelling moves **49** results, firing the coach **30**, restoring her to full
  condition **2**, the masseur **1**, the physio retainer **0**. ⭐⭐ **And one line of arithmetic
  explains the whole condition family: `conditionMatchFactor` is flat above 70 and every measured
  arrival condition was 86–100.** Written up as its own page –
  [the-knee-2026-08.md](../specs/the-knee-2026-08.md) – because that constant has now been the answer
  to three separate investigations in one week. ⚙ **He has seen the numbers and ruled: «вариативность
  всё-таки есть, это хорошо, значит не рельсы».**

- [ ] **14. ⚠ «наши фавориты слишком безопасны» (mine, from his own standard)** – measured against the
  cited research at the same rank gap: **ours 11%, reality 19.2%.** She should be losing openers
  MORE often, not less. Held open because it points the opposite way to every other balance finding
  this week and must not be fixed in the same breath as them.

---

## What this round is waiting on

| | what | who |
| --- | --- | --- |
| ⚙ **done** | **9's measurement** – it decided: 3 is a symptom, the growth curve is the cause | landed 27.08 |
| ⚠ **first** | **the growth curve** – ⚠ and the measurement recommends BISECTING the 12.08→27.08 drift before anything is tuned, because the manager moved as much as the model | the owner |
| ⚠ **his** | the entry-age band, once 9 lands and the one research table exists | the owner |
| then | 4 → 2 → 5 → 7 → 6, in that order (4 before 6; 5 and 7 are independent) | – |
| last | 3, only after the growth curve is settled – its number is a DIFFERENCE against a freshman who is about to change | – |

⚠ **Nothing in this round has been built.** Two agents are finishing unrelated work on the same
branch and a third is measuring 9. The spec carries the order and the reason for it.
