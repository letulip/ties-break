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

- [!] **7. «И снова она просит "One day, not a week, not a trip"» · «3 раза подряд» · «я просил это
  исправить»** – ⚠⚠ **REOPENED, and he is right to.** His original complaint (round 26 #9) was about
  THE DAY; the measurement found the DIALOG repeating, fixed that, and recorded «the day was never the
  problem». **The dialog fix was real and held. The thing he pointed at was left alone.** And it is a
  guarantee, not luck: the day is exempt from the already-given filter by design, material gifts leave
  the pool permanently, so the day's share rises to 100% once the three drawn options are all hers.
  Spec §7.

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

- [~] **9. «а не слишком ли быстро растут наши спортсменки? Alice на момент поступления играла уже на
  500 и шлемах и имела 600к+ в 18-19»** – ⚠⚠ **The most consequential question of the round, and it
  may invert 3.** The development model's own calibration is «points ~17-18, top-100 ~4.5 yrs later» –
  **top-100 at about 22**. She is there at 18–19, three years early. ⭐ **If careers run ahead of the
  anchor, the college field may be right and the player too strong.** Fixing the field first would
  then be treating the symptom. **A measurement is in flight and the college wave waits on it.**

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

---

## What this round is waiting on

| | what | who |
| --- | --- | --- |
| ⚠ **first** | **9's measurement** – it decides whether 3 is a fix or a symptom | in flight |
| ⚠ **his** | the entry-age band, once 9 lands and the one research table exists | the owner |
| then | 4 → 2 → 5 → 7 → 6, in that order (4 before 6; 5 and 7 are independent) | – |
| last | 3, only after 9 | – |

⚠ **Nothing in this round has been built.** Two agents are finishing unrelated work on the same
branch and a third is measuring 9. The spec carries the order and the reason for it.
