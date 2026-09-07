# Round 39 – Ines's career on the merged round-38 build, 15 items (08.09.2026)

Save under analysis: `~/Downloads/tennis-sim_ines-xgv7_w832.tsave` – **read-only, never committed,
never a fixture.**

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

Class: **build** · **answer** · **measure** · **ask** · **already-works**

---

- [>] **1. «A spare key on her own ring... В 35 лет звучит уже довольно странно. Давай проведём
  общее ревью этих фразочек на home с целью максимально убрать вот такие вот несоответствия»** –
  **build.** Home's flavour lines are written for a child and are still printed at 35. This is not
  one string: he is asking for a SWEEP of the home copy against the age it is shown at. Done means
  every home line has an age (or life-stage) gate that a mounted test can fail on.

- [>] **2a. «„Past her peak – down 57 places on the year, and her body has about 6 more seasons in
  it." – вот это как раз можно на карточку тренера в списке тренеров перенести, много текста»** –
  **build.** The long decline sentence moves off Home and onto the coach card in the coach list.

- [>] **2b. «А вот на home хотелось бы увидеть что-то короткое, емкое и яркое (в плане цвета), как
  было до этого про потолок и прочее»** – **build.** Home keeps a SHORT, coloured read. ⚠ The old
  ceiling plate is the shape he is naming; match its length and its colour treatment, not its words.

- [ ] **3. «У нас все контракты стали на 12 месяцев? Или мне только кажется? Увидел пару штук на 2
  года - лучше. Но мы обсуждали, что на 12 месяцев дают контракты тем, кто только идёт в топ, а чем
  выше - тем дольше. В спорте я видел, что они и на 5, и на 10 лет заключают. А некоторые и
  пожизненно»** – **measure then build.** First measure the actual term distribution by rank on his
  save; then make term scale with standing. His examples set the ceiling: 5 and 10 years exist, and
  a lifetime deal exists at the very top.

  **MEASURED on his save (`tools/r39-save-read.ts --report`) – he is right, and the ceiling is
  harder than he thinks: NOTHING above 3 years exists in the game at all.** Every signed deal of the
  career, term in years:

  | | 1y | 2y | 3y | 4y+ |
  | --- | --- | --- | --- | --- |
  | kit (7 signed) | 1 | 3 | 3 | **0** |
  | ad (15 signed) | 5 | 6 | 4 | **0** |

  ⚠ And the term does NOT track standing today. At wta#5 she signed a 3-season kit; at wta#91 she
  signed a 2-season one; the 3-year ad deals land at wta#7 and wta#16 alike. So this is not «all
  contracts became 12 months» – it is a flat 1-3 ladder with no top end.

  **OWNER (08.09):** «ну давай тоже какой-то ресерч проведем может быть на эту тему, чтобы было на
  что опираться? я бы сказал, что для растущей карьеры не больше, чем на 12 месяцев, для топ-100 до
  1-2 года, топ-50 1-3 года, для топ-20 и выше до 10 лет. Но может у тебя есть предложения лучше.»
  → research on real endorsement terms is MINE, then the ladder proposal comes back to him.

- [>] **4. «В яхтах и (подразумеваю) самолётах на уже купленных тоже убрать с карточки серую надпись
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

  ⭐⭐ **MEASURED, and it is worse than he reported.** Her fame is at the cap (100.0), which puts the
  ramp's half-life at its **13.3-week floor**. A brand bought TODAY for $250,000 is worth:

  | after | worth |
  | --- | ---: |
  | **1 week** | **$1,844,174** |
  | 5 weeks | $8,243,530 |
  | 13 weeks | $17,658,878 |
  | 26 weeks | $26,620,223 |
  | 52 weeks | $33,488,605 |

  **One week turns $250,000 into $1.84 million** – 7.4x, and the cycle restarts the moment it is
  sold. His own brand: paid $250,000 at week 597, held 235 weeks, now $35,879,827.

  **OWNER (08.09):** «мне сложно проверить, но кажется что у меня свежекупленный бренд возвращался к
  своей стоимости уже в течение 5 недель… Мне кажется, что нам надо как-то вообще более вариативно
  смотреть на цену бренда с точки зрения развития карьеры. Но и с продажей надо что-то тоже подумать
  как быть. Надо подумать хорошенько. У тебя какие мысли?» → the measured 5-week point is $8,243,530
  (23% of derived) – his feel is right in kind. Design proposal is MINE, back to him before any build.

- [ ] **6. «2 года подряд спонсор с духами не пришёл»** – **measure.** A named sponsor category
  absent two seasons running. Is the perfume slot gated (rank, fame, exclusivity) or is it draw
  luck? Measure the arrival rate before touching anything.

  **ANSWERED – a rank gate working exactly as designed, not luck.** `fragrance` is the icon-band
  category and `ECONOMY` gates it at the **top 10** («watches early, cars at top-100, fragrance at
  top-10»). She signed it twice – Blanche & Noir $2,500,000 (w573) and Rivelle $2,500,000 (w683) –
  and her WTA end-rank since is **#16, #14, #15**. Three seasons out of the top ten, so the most
  valuable category in the game stopped writing. ⚠ Worth telling him plainly: the perfume deal IS
  the top-10 bonus, and it is what sliding to #15 costs.

  **OWNER (08.09), REOPENING THE ANSWER:** «я это помню, но кажется, что 2 сезона в топ-10 прошли без
  него.» → so the question is now the offer CADENCE, not the gate: when did she hold a top-10 rank,
  when did fragrance offers arrive, and what cooldown sits between ad offers of one category. MINE.

- [ ] **7. «Странно, что после шлема в 40м году она не смогла взять больше ни одного»** –
  **measure.** One Slam in season 40 and never again. Read her actual title history and the field
  she met off the save; a single Slam followed by nothing may be correct for her level, or may be a
  ceiling in the draw model.

  **MEASURED, and it is not the slam alone – she cannot get PAST the fourth round.** Since week 634
  she has played **11 slams, 40 matches, best result the Round of 16 three times, ZERO
  quarterfinals.** Over the same window she won **6 WTA1000 titles** (weeks 551, 629, 642, 684, 785,
  825) and 10 WTA500s. One extra round cannot explain it: at her observed 70.4% match rate a slam QF
  is p^4 = 24%, so eleven attempts should have produced two or three. ⚠ A real asymmetry between the
  slam draw and every other tier, and it needs its own measurement before any fix.

  **OWNER (08.09), REFRAMING:** «вот у меня и вопрос тогда, а корректно ли работает наша формула по
  скиллам и прочему, тут даже не совсем в ранге и позиции в таблице вопрос, сколько в её скиллах и
  тому, как они относятся к остальным соперникам, особенно ниже 50» → #7 and #10 merge into ONE
  audit: her skills against the field's, expected win probabilities from the match model, actual
  results over them – slams and sub-top-50 opponents as the two lenses. MINE.

- [ ] **8. «Meridian sport прислал контракт за 300к для #7»** – **measure then build.** A world #7
  offered $300k reads as insulting. Measure the offer curve against rank and check whether the top
  of the ladder is being underpaid.

  ⚠⚠ **CONFIRMED, and the defect is bigger than the one offer.** Meridian Sport's clothing deal was
  **$300,000** at w697 and again at w720. The same brand and the same category paid her
  **$1,000,000** at w575 – when she was ranked LOWER (wta#14 against wta#7). And it is every
  category, not just clothing:

  | category | season 11 | season 14-16 |
  | --- | ---: | ---: |
  | fragrance | $2,500,000 | – (gated out, see #6) |
  | cars | $2,000,000 | **$800,000** |
  | airline | $1,500,000 | **$600,000** |
  | watches | $1,200,000 | **$500,000** |
  | clothing | $1,000,000 | **$300,000** |

  Every ad category roughly HALVED between season 11 and season 14 while she stayed top-20. That is
  the item; the $300k offer is one symptom of it.

- [>] **9. «Опять just one day (REOPENED against round 26 #9). Я просил сделать много вариантов подарков для разных возрастных
  групп. Мне кажется, что вполне допустимо чтобы что-то повторялось, но не больше 2-3 раз за всю
  карьеру и с разницей не меньше 5 лет»** – **REOPENED against round 26 #9.**

  ⚠ **What round 26 aimed at and why it missed this.** It measured the pool (29 gifts, 9 bands),
  found four bands holding exactly three gifts – C(3,3) = 1, one possible dialog – and built
  repetition control over CONSECUTIVE birthdays. His complaint now is not about consecutive years:
  it is about a gift's TOTAL count across a whole career and the gap between its appearances. Round
  26's guard cannot see either, so it is green while he sees the same gift again.

  **build, and now he has given the number:** at most 2-3 appearances per career, never closer than
  5 years apart.

  **CONFIRMED on his save.** Her 13 birthdays: trip(18), home(19), car(20), deposit(21),
  **day(22)**, familyweek(23), **day(24)**, dog(24), **day(25)**, jewellery(26), **day(27)**,
  oldclub(28), album(29). ⭐ **`day` four times – at 22, 24, 25 and 27, gaps of 2, 1 and 2 years.**
  Against his rule (at most 2-3 a career, never under 5 years apart) that is double the count at a
  third of the spacing. Every other gift appears exactly once.

- [>] **9c. NOT RAISED BY HIM, found in the same log: two birthdays one week apart.** Week 569
  `day` at age 24 and week 570 `dog` at age 24. Folded in because it lives in the same file.

- [ ] **10. «Очень печально смотреть, как она регулярно сливает кому-то, сильно ниже #50 (хотя может
  только кажется, что регулярно). Проанализируй сейв пожалуйста с момента, где все покупки
  случились и дальше - это как раз новые правки пришли»** – **measure.** ⚠ He flags his own doubt
  («может только кажется»), so the honest answer is a rate, not an anecdote: her loss rate to
  opponents ranked far below her, from the week the purchases land onward, against what her skill
  gap predicts. Round 38's C4 changed AI match results, so this window is the first read of it.

  ⚠⚠ **HE IS RIGHT, AND MY FIRST READ SAID THE OPPOSITE.** The first pass reported «0 of 73» – it
  had mapped NOTHING, because `RankingRow` is `{playerId, points, rank}` and the lookup was keyed on
  `r.id`, which is `undefined` on every row. A lookup that silently misses looks exactly like a
  clean result. Corrected:

  | window | record | losses to a player now outside the top 50 |
  | --- | --- | --- |
  | from w634 (198 weeks) | 174W 73L | **33 of 73 – 45%** |
  | from w750 (82 weeks) | 68W 32L | 15 of 32 – 47% |
  | from w790 (42 weeks) | 40W 18L | 9 of 18 – 50% |
  | **from w802 (30 weeks)** | 30W 11L | **6 of 11 – 55%** |

  She is WTA #17. The worst are #124, #107, #101, #101, #96, #91. ⚠ The honest caveat: those are
  ranks TODAY, not at match time, so an old loss may have been to someone then-strong – which is why
  the recent window matters most, and there it is WORSE (55%), not better.

- [ ] **11a. «Бренд за 33м выглядит как имба, особенно на фоне академии за 17м совокупно, но может
  быть я придираюсь»** – **measure then ask.** The two shelves' valuations against what each one
  earns. Related to 5: the same brand, at the top of its ramp.

- [ ] **11b. «При этом академия больше денег приносит, кстати»** – **answer.** Confirm or correct
  with the two weekly figures off his save; if the academy earns more while being worth half, that
  is the imbalance 11a is really about.

  ⚠ **MEASURED, and half of this is the other way round.** Brand worth **$35,879,827** against the
  academy's four rungs at **$21,057,495** – 1.70x, so he is right that it dwarfs them. But the weekly
  income is **brand $34,500 vs academy $33,169**: the brand earns **4% MORE**, not less. The academy
  cost $12,000,000 and is worth $21.1M; the brand cost **$250,000** and is worth $35.9M. That gap –
  143x on the purchase price – is the same fact as #5.

  **OWNER (08.09):** «видимо вторая половина её, но ее не видно, поэтому и был вопрос, т.к. в
  интерфейсе доход около 17к» → the engine pays $33,169 and his screen says ~17k. Find where the
  half goes on the MoneyScreen and either show it or name it. MINE to measure, then a small build.

- [ ] **12. «Мне кажется, что когда у нас появляется самолёт можно перелёты зачеркнуть на карточке
  и не считать в неделе: мы и так платим за самолёт еженедельно. Или это не так работает?»** –
  **answer first, then build if it confirms.** He is asking how it works before asking for a change.
  Read what a plane actually does to the weekly flight cost today; if it already zeroes it, the card
  is lying and the fix is on the card.

  **ANSWERED, measured:** `ECONOMY.shop.planeTravelShare = 0.5`. The plane takes exactly **half**
  the fare, never all of it, so a flight still costs and still counts. On her calendar right now:

  | event | sticker | after academy + kit | after her own plane |
  | --- | ---: | ---: | ---: |
  | w833 w50 | $3,067 | $1,534 | **$767** |
  | w832 w15 | $1,748 | $874 | **$437** |
  | w832 local | $97 | $49 | **$24** |

  So the card is not lying – it shows a real, halved fare. Striking it out entirely is a CHANGE (his
  call), and the money at stake is small: the whole remaining calendar is a few thousand dollars
  against the plane's own upkeep.

  **OWNER (08.09):** «окей, хорошо, но вот я и пытаюсь понять он должен их вообще снимать или нет,
  т.к. мы уже платим недельный тариф, я не знаком так глубоко с частной авиацией. Нужен небольшой
  ресерч.» → research on what owning an aircraft actually removes per trip is MINE, verdict back to him.

- [>] **13a. «Ей почти 29, а тренер говорит, что она протянет ещё 13 сезонов, при этом она уже
  начинает постепенно сдавать, что видно в статистике сезонов: уже не топ-10»** – **build.** The
  coach's remaining-seasons number contradicts the decline the same screen is reporting. 13 seasons
  at 29 puts her at 42.

  **CONFIRMED, with the cause.** The card reads «Past her peak – down 1 places on the year, and her
  body has about **13** more seasons in it.» at age **29.0**. The number comes from
  `seasonsOfBodyLeft`, which extrapolates from `physicalMean / peakPhysical` – and hers is **63.03
  of 63.19 = 99.7%**. She has barely declined yet, so the extrapolation runs to age 42.

- [>] **13c. NOT RAISED BY HIM, found in the same sentence: «down 1 places».** `coachDeclineNote`
  interpolates `down ${yearMove} places` with no singular. Folded in – same file, same line.

- [~] **13b. «Но очень хорошо, что тренер стал обращать внимание, что перформанс падает»** –
  **answer, nothing to build.** Round 38's decline note landing well. Recorded so it is not lost.

- [ ] **14a. «„She said it in the car. Three seasons on the professional table and it has not moved…"
  - одно и то же опять, давай какую-то вариативность в этих фразах сделаем, какие варианты?»** –
  **build + ask.** The retirement-thought copy repeats verbatim. He is asking BOTH for variety and
  what the variants should be, so the variants come back to him as a choice before they ship.

  **OWNER (08.09):** «да, подумай пожалуйста» → the variant sets and the she-is-done mechanism are
  MINE to draft, back to him before any build.

- [ ] **14b. «И как-то надо подсветить, когда она сама дальше вообще не готова играть продолжать.
  Какой-то механизм для этого»** – **ask then build.** Today the line always ends «She will keep
  playing if you want her to». He wants a state where she genuinely will not, and a signal for it.
  That is a mechanic, not copy – sharpen it to a choice before building.

- [>] **15a. «В прологе во время травмы нужно как-то аккуратно объяснить игроку, что всё нормально
  и ребёнок выживет и вернётся в строй»** – **build.** A first-time player reads a child's injury as
  a catastrophe. The prologue must say, in its own voice, that she recovers.

- [>] **15b. «И вообще чуть больше тепла в этих экранах надо сделать, как мне кажется. Например на
  варианте rest добавить hug и ещё как-то над самим текстом подумать»** – **build.** Warmth pass on
  the prologue injury screens; `hug` named explicitly as an addition to the `rest` option.

---

## Bundles (dispatched 08.09, owner's «можно запускать дальше»)

No two bundles touch the same file. Each agent appends to its OWN ledger lines only, on its own
branch, and reports per item number.

| wave | branch | items | surface |
| --- | --- | --- | --- |
| A | `r39/wave-a` | 1, 2a, 2b, 13a, 13c | Home's flavour + coach voice: HomeScreen.vue, coachMarket.ts, the coach list card |
| B | `r39/wave-b` | 4 | the shelf's owned-asset cards (yacht, plane) |
| C | `r39/wave-c` | 9, 9c | birthday.ts and its tests |
| D | `r39/wave-d` | 15a, 15b | the prologue injury screens |

MINE, not waved: 3 + 12 (research), 5 (design), 6 + 8 (sponsor economy measure), 7 + 10 (the skill
formula audit), 11 (the invisible half of the academy's income), 14 (variants + the mechanism).
