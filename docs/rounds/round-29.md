---
type: round-ledger
status: current
area: rounds/29
canonical: false
last-reviewed: 2026-08-28
---

# Round 29 – the pro years, 18 items (28.08.2026)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

**His own words, in his own numbering**, off save `alice-cfbv_w780` (⚠ personal, `~/Downloads`,
READ-ONLY – never copied into the repo, never a fixture) and three screenshots: the season feed at
W47–W2 '44/'45, the inbox, and the Tour office letter.

⚠⚠ **CORRECTION – the save IS schemaVersion 65, so he played a build WITH round 28 in it.** My first
note here said the opposite. That matters most for item 10: round 28 #15 widened her cut to sponsor
cheques, and it is live in this save.

⭐ **His instruction on how to run this round**, and it shapes every bundle below: «делай план работ,
выбирай агентов и запускай всю волну поочередно в ночь, работы много, мы не торопимся, одновременно
не надо делать, а пошагово вполне отлично». **One agent at a time.** No parallel fan-out – the
contention artefacts of round 28 cost more reading than the wall-clock they saved.

⭐ And his verdict on where we are: «По победам как-будто по-лучше стало» (item 4) and «Сейчас уже
ощутимо хорошо».

---

- [ ] **1. «На 23 неделе 44 года у меня в ленте был Шлем и не подал заявку, девушка была exhausted,
  я выбрал отпуск, отдохнул, вернулся – а шлема в ленте нет! Текущее место 116 (минус 11) показывает.
  После победы w500 снова появился. Это не очень хороший паттерн.»** – **measure, then build.** ⚠ The
  Slam is rank-gated, so a rank slip past its cut removes it mid-window. **The defect he is naming is
  not the gate, it is that resting COST him the entry and nothing warned him.** Check whether the
  vacation itself moved the rank (points decay over a rolling window) or whether the rank had already
  slipped. ⭐ His «не очень хороший паттерн» is the design complaint: a decision that removes content
  must be legible before it is taken, not after.

- [ ] **2. «Надо сделать предзагрузку картинок для оффлайн, у меня в ленте через одну черные плашки
  в сезоне»** – **build.** Every other card in the season feed renders black. PWA precache already
  exists (`118 entries` in the build log); the feed's imagery is evidently not in it.

- [ ] **3. «В разделе календаря недели всё ещё нет блоков про съёмки… а если это выпадает на неделю
  турнира, то на затраченной энергии должно отражаться. А, увидел на пустой неделе, но на
  чемпионатской нет. Может сделать возможность переноса съёмки или всё-таки жарить прямо с
  чемпионатом с последствиями.»** – **build + ask.** ⚠ Round 28 #1/#6 shipped the shoot week and
  **deliberately exempted a tournament week** – the engine pays the masseur nothing there and the
  builder recorded «lights and flights, not his table». **He has now looked at that exemption and
  does not want it.** Two roads and he named both: let the shoot MOVE, or let it run on top of the
  tournament with a real energy cost. Sharpened below.

- [~] **4. «По победам как-будто по-лучше стало»** – ⚙ **his own verdict, recorded, nothing to build.**

- [ ] **5. «В магазине всё ещё не хватает яхт, самолётов и стойки академии»** – **build.** Slice 1
  (cars) shipped; the spec [the-shop-2026-08.md](../specs/the-shop-2026-08.md) already carries yachts,
  the parents' plane and the academy. This is round 28 #7 with the queue position now given.

- [ ] **6. «Листалка на 4 недели кажется весьма бессмысленной: у меня был слот 6 недель, я нажал,
  увидел сообщение о конце года и странное окошко с отчётом о двух пройденных днях, а календарь так и
  остался на 51й неделе. Наверное эта кнопка будет полезна только для длительных травм, и то не точно.
  Её необходимость под большим вопросом.»** – **build (bug) + ask (keep it at all).** ⚠ Three separate
  wrongnesses in one press: it stopped at the year end, it reported **two days** for a six-week slot,
  and **the calendar did not move**. Fix the lie first; whether the control survives is his call.

- [ ] **7. «А что у нас со спонсорами вообще, кстати? Кроме часов за 20к есть ещё кто-то и когда
  появляется? Мы что-то говорили о больших чеках вроде.»** – **answer.** Read the ladder out of the
  code and tell him what exists, at what standing each rung opens, and what the largest cheque in the
  model actually is. ⭐ Pairs with 15, which is the same question from the other side.

- [ ] **8. «При клике на Next Tournament на главном экране давай сделаем может быть какой-то
  информационный экран? Например со списком соперников, прогнозами и комментариями тренера ещё
  какой-то информацией о турнире, картинкой с ним… Можно частично переиспользовать экран начала
  турнира»** – **build.** ⭐ His own implementation hint is the cheap road and should be taken.

- [ ] **9. «В строке с машиной и другими вещами `Worth now / paid $60,000 / $59,361` – давай
  последнюю цифру сделаем либо белой, либо жёлтой, с красным перебор.»** – **build.** One colour token.

- [ ] **10. «По результатам w500 мне пишут Income +$29,046 · Spent -$6,883 · Balance +$22,164 ·
  Her cut 50% $27,600 – это не 50% по сравнению с income»** – **build (bug).** ⚠⚠ **$27,600 against an
  income of $29,046 is 95%, not 50%.** Either the label lies about the base or the split is wrong;
  round 28 #15 has just widened her cut to sponsor cheques and **is live in this save (v65)**.

  ⚠⚠ **MEASURED, and it is neither of the two readings we had.** I first called it 95% by dividing
  where I should have added; he corrected me – «это 27,600 + 29,046, это НЕ 95%, но и не 50%». The
  save says a third thing. Across all 27 weeks that credited her:

  | week | prize | her cut | bps | ratio |
  | --- | --- | --- | --- | --- |
  | 730 | $62,000 | $74,400 | 5000 | **1.20** |
  | 733 | $82,500 | $99,000 | 5000 | **1.20** |
  | 738 | $23,000 | $27,600 | 5000 | **1.20** |
  | 749 | $95,000 | $114,000 | 5000 | **1.20** |
  | 754 | $41,000 | $49,950 | 5000 | **1.22** |
  | 767 | $13,250 | $16,650 | 5000 | **1.26** |

  **The field states `bps: 5000` and pays 120% of the prize – more than the whole prize.** 24 of 27
  weeks land on exactly 1.20 and two drift to 1.22 / 1.26, so there is a VARIABLE term, not merely a
  wrong constant. ⚠ Candidate, unverified: the kit contract's `bonusShare: 0.2` (a 20% bonus on prize
  money from w75 up). **The base must be identified before anything is changed** – I have already been
  wrong once on this item.

  ⭐ Two weeks (728, 741) credit **$750 with a prize of zero** – the sponsor-cheque cut of round 28 #15
  doing its job, and evidence the two paths are separate.

- [ ] **11. «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
  будет вести себя так же – тоже надо исправить. А ещё было предложение делать доходность индексного
  фонда плавающей, на сколько я помню, мы это делали? Иначе не очень понятно зачем вообще Savings»** –
  **build + answer.** Top-ups for both instruments; and answer whether the floating yield shipped.
  ⭐ His «иначе непонятно зачем вообще Savings» is the design test the answer has to pass.

- [ ] **12. «И я предлагал убрать авто начисление % на текущий счёт»** – ⚙ **his RULING**, and it
  settles round 28 #9, which was filed as an ask. Remove the automatic interest on the current
  account. ⚠ It is a large silent income line – measure what the economy loses before shipping, and
  say so, but the direction is decided.

- [ ] **13. «А мы что-то перечисляем тренеру за финал каких-то турниров в итоге? Мне кажется эта
  информация стоит того, чтобы добавить её на странице тренеров»** – **answer + build.** Read the
  bonus rule out of the code, then surface it once on the coaches page.

- [ ] **14. «Ни одной победы в 45 году, только 2е место на 500 и 250 и 2 взрыва ярости за год по
  случаю полосы вылетов в 1м раунде – не самый удачный год для 23 ракетки мира»** – **measure.**
  ⚠ Round 28 measured the drought at 23.9% of seasons and **66.1% in the #81–120 band** – but he is
  **#23**, where our rate was 15.3% against a real 50%. **A title-less year at #23 is normal by the
  real censuses and abnormal by our own numbers.** Check which of the two his season actually is.

- [ ] **15. «И где все наши топовые спонсоры, интересно? Кроме Netrally, Baseline athletic, Play
  beyond? На других аккаунтах я помню один был мощный.»** – **answer/measure.** Same question as 7
  from the brand side: does the top of the brand ladder ever open, and what gates it.

- [ ] **16. ⚠ «письмо с Заголовком Entries Suspended – я точно это заводил уже в одном из предыдущих
  раундов, мне кажется этот заголовок сбивает с толку… Может его как-то и озаглавить про топ-50
  правила»** – **build**, and ⚠⚠ **CHECK THE EARLIER ROUND FIRST.** If he filed it before, this is
  `[!]` REOPENED and the ledger must say what the first fix aimed at and why it missed. The letter's
  body is the top-50 mandatory regime (4 Slams, 8 × WT1000, 6 of 10 × WT500, 2 penalty points, 10
  points suspends for 4 weeks); the title announces a suspension that has not happened.

- [ ] **17. «проверь предыдущие раунды на предмет "что забыто и не сделано" пожалуйста»** – **audit.**
  ⭐ Runs FIRST, because its output changes what the rest of this round should do.

- [ ] **18. «добавить в скилл pull-request проверку несделанных пунктов из раунда»** – **build (skill).**
  ⭐ 17 and 18 are the same instinct: he has noticed that items go quiet, and wants the PR step to
  catch it mechanically rather than by my memory.

---

## Asks – batched, so he answers in one pass

| | the choice |
| --- | --- |
| **3** | a shoot landing on a tournament week: **(A)** it can be MOVED, **(B)** it runs on top with a real energy cost, **(C)** both, A by default with B as the price of refusing |
| **6** | the multi-week skip: **(A)** repair it (it must move the calendar and report the real span), **(B)** delete the control, **(C)** keep it only for an injury lay-off |
| **11** | Savings vs Index fund: what makes Savings worth holding once the fund can be topped up |
