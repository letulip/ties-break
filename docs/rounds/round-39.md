# Round 39 – Ines's career on the merged round-38 build, 15 items (08.09.2026)

Save under analysis: `~/Downloads/tennis-sim_ines-xgv7_w832.tsave` – **read-only, never committed,
never a fixture.**

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

Class: **build** · **answer** · **measure** · **ask** · **already-works**

---

- [ ] **1. «A spare key on her own ring... В 35 лет звучит уже довольно странно. Давай проведём
  общее ревью этих фразочек на home с целью максимально убрать вот такие вот несоответствия»** –
  **build.** Home's flavour lines are written for a child and are still printed at 35. This is not
  one string: he is asking for a SWEEP of the home copy against the age it is shown at. Done means
  every home line has an age (or life-stage) gate that a mounted test can fail on.

- [ ] **2a. «„Past her peak – down 57 places on the year, and her body has about 6 more seasons in
  it." – вот это как раз можно на карточку тренера в списке тренеров перенести, много текста»** –
  **build.** The long decline sentence moves off Home and onto the coach card in the coach list.

- [ ] **2b. «А вот на home хотелось бы увидеть что-то короткое, емкое и яркое (в плане цвета), как
  было до этого про потолок и прочее»** – **build.** Home keeps a SHORT, coloured read. ⚠ The old
  ceiling plate is the shape he is naming; match its length and its colour treatment, not its words.

- [ ] **3. «У нас все контракты стали на 12 месяцев? Или мне только кажется? Увидел пару штук на 2
  года - лучше. Но мы обсуждали, что на 12 месяцев дают контракты тем, кто только идёт в топ, а чем
  выше - тем дольше. В спорте я видел, что они и на 5, и на 10 лет заключают. А некоторые и
  пожизненно»** – **measure then build.** First measure the actual term distribution by rank on his
  save; then make term scale with standing. His examples set the ceiling: 5 and 10 years exist, and
  a lifetime deal exists at the very top.

- [ ] **4. «В яхтах и (подразумеваю) самолётах на уже купленных тоже убрать с карточки серую надпись
  „paid ..."»** – **build.** The `paid …` caption must not show on an owned yacht or plane. He
  assumes planes have it too – verify rather than assume, and fix every shelf rung that shows it.

- [!] **5. «Я завел бренд у Инэс, он за несколько недель стал стоить 22 млн, я его продал. Потом
  купил новый за 250к, а он снова за несколько недель уже 30+ стоит. Кажется надо ещё что-то с этой
  механикой подумать»** – **REOPENED against round 38 #15/#16.**

  ⚠ **Why the first fix missed, precisely.** Round 38 reported «the ramp closed every sell-and-rebuy
  loop: merch-brand $0» – and that measurement was taken **at `weeksHeld = 0`**, where
  `rampedWorthCents` returns the paid price *by construction*. So the $0 was true and meaningless:
  it proved the loop is shut on the day of the trade and never tested it OVER TIME, which is the
  only place the money was. His cycle is sell at the ramped 22M, re-buy at the catalogue's flat
  250k, wait for the ramp to climb back. The re-buy price is the hole, not the sale.

  **measure then ask.** Measure the cycle's true yield per week on his save, then put the shape to
  him – the catalogue price is his own 07.09 ruling («неизменно для первого открытия стоит 250к»),
  so what changes is what a RE-purchase costs or what a sale pays.

- [ ] **6. «2 года подряд спонсор с духами не пришёл»** – **measure.** A named sponsor category
  absent two seasons running. Is the perfume slot gated (rank, fame, exclusivity) or is it draw
  luck? Measure the arrival rate before touching anything.

- [ ] **7. «Странно, что после шлема в 40м году она не смогла взять больше ни одного»** –
  **measure.** One Slam in season 40 and never again. Read her actual title history and the field
  she met off the save; a single Slam followed by nothing may be correct for her level, or may be a
  ceiling in the draw model.

- [ ] **8. «Meridian sport прислал контракт за 300к для #7»** – **measure then build.** A world #7
  offered $300k reads as insulting. Measure the offer curve against rank and check whether the top
  of the ladder is being underpaid.

- [!] **9. «Опять just one day. Я просил сделать много вариантов подарков для разных возрастных
  групп. Мне кажется, что вполне допустимо чтобы что-то повторялось, но не больше 2-3 раз за всю
  карьеру и с разницей не меньше 5 лет»** – **REOPENED against round 26 #9.**

  ⚠ **What round 26 aimed at and why it missed this.** It measured the pool (29 gifts, 9 bands),
  found four bands holding exactly three gifts – C(3,3) = 1, one possible dialog – and built
  repetition control over CONSECUTIVE birthdays. His complaint now is not about consecutive years:
  it is about a gift's TOTAL count across a whole career and the gap between its appearances. Round
  26's guard cannot see either, so it is green while he sees the same gift again.

  **build, and now he has given the number:** at most 2-3 appearances per career, never closer than
  5 years apart.

- [ ] **10. «Очень печально смотреть, как она регулярно сливает кому-то, сильно ниже #50 (хотя может
  только кажется, что регулярно). Проанализируй сейв пожалуйста с момента, где все покупки
  случились и дальше - это как раз новые правки пришли»** – **measure.** ⚠ He flags his own doubt
  («может только кажется»), so the honest answer is a rate, not an anecdote: her loss rate to
  opponents ranked far below her, from the week the purchases land onward, against what her skill
  gap predicts. Round 38's C4 changed AI match results, so this window is the first read of it.

- [ ] **11a. «Бренд за 33м выглядит как имба, особенно на фоне академии за 17м совокупно, но может
  быть я придираюсь»** – **measure then ask.** The two shelves' valuations against what each one
  earns. Related to 5: the same brand, at the top of its ramp.

- [ ] **11b. «При этом академия больше денег приносит, кстати»** – **answer.** Confirm or correct
  with the two weekly figures off his save; if the academy earns more while being worth half, that
  is the imbalance 11a is really about.

- [ ] **12. «Мне кажется, что когда у нас появляется самолёт можно перелёты зачеркнуть на карточке
  и не считать в неделе: мы и так платим за самолёт еженедельно. Или это не так работает?»** –
  **answer first, then build if it confirms.** He is asking how it works before asking for a change.
  Read what a plane actually does to the weekly flight cost today; if it already zeroes it, the card
  is lying and the fix is on the card.

- [ ] **13a. «Ей почти 29, а тренер говорит, что она протянет ещё 13 сезонов, при этом она уже
  начинает постепенно сдавать, что видно в статистике сезонов: уже не топ-10»** – **build.** The
  coach's remaining-seasons number contradicts the decline the same screen is reporting. 13 seasons
  at 29 puts her at 42.

- [~] **13b. «Но очень хорошо, что тренер стал обращать внимание, что перформанс падает»** –
  **answer, nothing to build.** Round 38's decline note landing well. Recorded so it is not lost.

- [ ] **14a. «„She said it in the car. Three seasons on the professional table and it has not moved…"
  - одно и то же опять, давай какую-то вариативность в этих фразах сделаем, какие варианты?»** –
  **build + ask.** The retirement-thought copy repeats verbatim. He is asking BOTH for variety and
  what the variants should be, so the variants come back to him as a choice before they ship.

- [ ] **14b. «И как-то надо подсветить, когда она сама дальше вообще не готова играть продолжать.
  Какой-то механизм для этого»** – **ask then build.** Today the line always ends «She will keep
  playing if you want her to». He wants a state where she genuinely will not, and a signal for it.
  That is a mechanic, not copy – sharpen it to a choice before building.

- [ ] **15a. «В прологе во время травмы нужно как-то аккуратно объяснить игроку, что всё нормально
  и ребёнок выживет и вернётся в строй»** – **build.** A first-time player reads a child's injury as
  a catastrophe. The prologue must say, in its own voice, that she recovers.

- [ ] **15b. «И вообще чуть больше тепла в этих экранах надо сделать, как мне кажется. Например на
  варианте rest добавить hug и ещё как-то над самим текстом подумать»** – **build.** Warmth pass on
  the prologue injury screens; `hug` named explicitly as an addition to the `rest` option.

---

## Bundles

To be filled in at step 3, after triage – no two bundles may touch the same file.
