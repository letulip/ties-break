---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-02
---

# Round 34 – a full career on the round-33 build, 21 items (02.09.2026)

Status: `[x]` shipped · `[~]` answered, nothing to build · `[>]` in flight · `[ ]` open ·
`[?]` waiting on him · `[!]` REOPENED

⚠ His save came with it: `tennis-sim_vera-8oem_w569.tsave` (Vera, week 569). He asked for a full
read of her performance against our benchmarks – filed as item 22 below, since it is work he asked
for and would otherwise have no line.

---

- [ ] **1. «в начале 2го сезона все очки в региональном уровне у меня обнулились, мне снова
  закрылся регионарный и национальный чемпионаты, хотя мы до них добрались. И кажется, что оно
  обнуляется каждой год. Или это так надо? … совершенно непонятно как выйти в j уровень»**
  — **measure first, then answer or build.** The ranking window is a rolling 52 weeks, so a season
  boundary CAN look like a reset; whether the tier gates re-close is the actual question. ⚠ His last
  sentence is the real complaint: the route to the J tour is unreadable.

- [ ] **2. «Тренер на главном экране (почему-то, давай на карточку тренера вернём лучше) написал 14
  летней девочке Close to her ceiling … звучит как приговор … не рановато ли? … давай подумаем в
  какой конкретно момент должно это появляться»** — three asks in one, split:
  - **2a** the read moved to Home and he wants it back on the coach card — **build**
    — `[x]` **SHIPPED.** `HomeScreen.vue` no longer renders it: the `roomBand` computed, its
    `<p class="coach-room">` and the CSS rule that dressed it are gone. Nothing was invented to fill
    the gap – his coach's round-7 quote and the signature are untouched, the card keeps its
    `card-short` box and is simply one line shorter, which is the shape it had before round 24. The
    read still renders exactly once, unchanged, above the coach list on the Coach Market
    (`.cm-room-band`). Evidence: `tests/component/round24-coach-card.test.ts` – the mounted file that
    used to pin the line ON Home – re-aimed to assert both halves in one test: absent on Home at six
    headrooms and under each of the four labels, present on the market card with its argument under
    it. ⚠ Mutation-verified: putting the line back on Home reddens two arms, and the non-vacuity arm
    reddens if the read is deleted rather than moved. ⚠ One collateral catch, recorded because it
    nearly shipped silently: naming the pin's filename in a comment above the card put a second
    `coach-card` string in the file and moved `tests/coach-market.test.ts`'s region marker up 900
    lines. `tests/helpers/source.ts` caught it; the note is worded around the marker now.
  - **2b** «Close to her ceiling» at 14 reads as a verdict — **measure**: what does the band
    actually say at 14, and on his save?
    — `[x]` **SHIPPED to §A1.** `realisedShare` (new in `world/coachMarket.ts`, one definition read
    by both `coachRoomNote` and `coachRoomBandOf`) divides `(skills − born)` by `(potential − born)`
    with `born = startingSkills(seed, profile)`, and `coachRoomBandIndex`'s edges are the approved
    **0.40 / 0.75 / 0.90**. `ROOM_BANDS` is untouched – four labels, same words, invariant 4 – and
    the round-23 measurement table over that function is kept with a ⚠ note saying the MEASURE moved
    under it and that the table describes the superseded quantity. Evidence:
    `tests/round34-ceiling-read.test.ts` – the inversion in two real careers (born-high-and-stalled
    reads a LOWER band than born-low-and-grown, where the old ratio ordered them the other way), a
    girl at her birth build reads «Huge potential» however well she was born (the old measure had her
    over 0.90 before her first session), the three edges pinned from both sides, monotone over the
    whole range, and the four labels asserted byte-identical. ⚠ Mutation-verified: reverting to
    `level / (level + room)` reddens 6 tests across 3 files; moving one edge by 0.05 reddens the edge
    pin; renaming one label reddens the invariant-4 pin.
    ⚠ **§A1 names `handoverRoomBand` as the model "in the same file" and it is not on this branch** –
    it lives on `prologue/wave` (`git show prologue/wave:src/engine/world/coachMarket.ts`). Its
    approach was copied from there rather than reinvented, and the note over `realisedShare` says so.
    ⚠⚠ **MEASURED CONSEQUENCE HE SHOULD SEE, and it contradicts nothing in §A1 but was not in it.**
    On the new scale the TOP band is a late, elite reading. Walked through the real engine to 29 (780
    weeks, the whole growth arc before `declineFactor`): «At her ceiling» is reached on 6 of 8 elite
    careers, at weeks 745–776, and on NONE of eight budget / middle / high ones, which peak at 0.855
    / 0.879 / 0.895 realised. A middle-rung career now reads «Huge potential» → «Still room to grow»
    (week 81) → «Close to her ceiling» (week 296) and never hears the fourth line. That is 0.90 doing
    exactly what he approved it to do; it is filed here because the fourth band is now about as rare
    as the first one was dead before round 23, and if he wants it audible on an ordinary career the
    **edge** is the knob, not the measure.
  - **2c** when should it appear at all — **ask**
    — `[~]` **ANSWERED BY THE THRESHOLDS; nothing built.** On the approved ladder the verdict arrives
    after twenty instead of at fourteen. Measured on the career `tests/round23-coach-copy.test.ts`
    walks: under the OLD measure it heard «Close to her ceiling» at week 78 (age 15.5) and «At her
    ceiling» at week 158 (age 17.0) – his complaint reproduced to the week – and on the new one it
    reads «Still room to grow» at 16 and «Close to her ceiling» at 24, the same pair §A1 predicted for
    Vera. The share it reads at each birthday is written into that test.
  ⚠ He then withdrew part of it himself: «А вот и At her ceiling в 16 лет случилось – видимо моя
  претензия снимается». ⭐ But he still asked for the save to be read: «Но сейв всё-таки посмотри».

- [ ] **3. «Увидел попап про 15 летите … а затем на home перешёл, а там написано 14 лет.
  Подозреваю, что это из-за дат: ДР 15го, а начало недели 14го, но раз мы показали попап – то уже
  можно и возраст менять, либо сам попап в таких случаях в конце недели показать»** — **build**.
  The birthday popup and the age line disagree within one week. ⭐ He named both fixes; pick one and
  say why. ⚠ He also noted the popup says «1 день вместе» and wondered whether that age should carry
  more of a request — filed as **3b**, an **ask**.

- [ ] **4. «На плашке next tournament, family budget для названия турнира и денег используй
  пожалуйста шрифт Sora»** — **build**, copy/type only.

- [ ] **5. «с нашим текущим "процент прохода 1го круга" на карточках турниров планировать всё равно
  не получается, потому что за неделю нельзя сняться с турнира бесплатно – это бессмысленная фича…
  Какие у нас ещё здесь варианты? … надо хотя бы что-то примерное писать до жеребьевки»** — **ask**,
  and it reopens round 31 #4. ⚠ The band was supposed to be the pre-draw information; he is saying it
  is not enough to plan on. Round 31 #3 already measured the band as degenerate on junior and domestic
  cards — that finding and this complaint are the same defect.

- [ ] **6. «W35 · 🔒 163 / 0 international pts вот это вот что значит? И на следующих тирах такое
  же»** — **measure**, then build or answer. A lock showing `163 / 0` is either a swapped pair or a
  zero that should be the requirement.

- [ ] **7. «в 18 лет предлагают подписать копеечные контракты на 2 и 3 года … в фильме Финальный
  сет показывали, что игроку на 240 месте в мире предлагают контракты за 5к за каждый сыгранный матч
  с нашивкой спонсора. У нас сейчас 5000-12000 в год да ещё и на расцвет карьеры. Давай
  пересмотрим»** — **measure, then balance**. With **11**, **12** and **13** this is one subject.

- [ ] **8. «на 18 она просит свой счёт в банке, а что будет если отказать? … Можно как-то обыграть,
  например если отказали – она сама пошла и открыла и на морали/отношениях отразится (это в
  бэклог)»** — **answer** what refusal does today; the moral/relationship version is **his own
  backlog instruction**.

- [ ] **9. «Если отпуск назначен, то на карточке турнира в сезоне надо убрать Exhausted … Или
  считать из отпуска восстановится ли и тогда убирать Exhausted»** — **build**. ⭐ He named the
  better of the two himself: compute the recovery, do not just hide the word.

- [ ] **10. «Мне не нравятся жирные буквы на главной жёлтой кнопке, сделай обычные пожалуйста. А
  может быть мне кажется и там две кнопки или надписи рисуется вообще? Проверь пожалуйста»** —
  **build** plus a **reproduce**: he suspects a doubled label.

- [ ] **11. «129 место в мире, тот же контракт на 12к в год на 3 года. Не верю»** — with 7/12/13.

- [ ] **12. «99 место в мире, тот же контракт на 20к в год на 2 года»** — with 7/11/13.

- [ ] **13. «А 100 позиции и выше это как раз Бублик с его кучей спонсоров. Хотя может быть для
  нашего масштаба наша система нормальная, цифры только на первом тире и условия не очень, надо
  разумно сделать»** — ⭐ his own hedge: the ladder may be right in shape and wrong at its foot.

- [ ] **14. «Календарь сезона надо ещё раз переделать … на 105 месте доступны 50, 250, 500 и шлемы,
  при этом нет 75, 100 и 125. Мне кажется, они прячутся на тех же неделях… Предлагаю с повышением
  ранга заменять более низкие турниры в сетке более высокими… они не конфликтуют в сетке, а
  заменяются динамично один другим видом»** — **measure, then design**. ⚠ The largest item in the
  round and it touches the calendar the last three rounds worked on.

- [ ] **15. «Сумма дохода на savings меняется вниз если деньги вывести. Мне кажется она не должна
  меняться, просто новое поступление будет меньше»** — **reproduce**, then build.

- [ ] **16. «Business пододвинуть к Invest в магазине»** — **build**, ordering only.

- [ ] **17. «89 место доход опустился с 200 до 65 долларов в неделю с бизнеса… Она доходит в Шлеме
  до QF и вообще стабильно в 100 держится, плюс есть мощные рекламные контракты… мне кажется нам
  надо улучшить формулу рассчета доходности и стоимости ее бренда»** — **measure**. ⚠ Round 32
  reworked exactly this; a fall from $200 to $65 while she is top-100 is either the fame decay
  working as designed or a defect the rework introduced. Must be read off HIS save.

- [ ] **18. «В магазине те пункты, которые во владении находятся давай цветом выделять рамку жёлтую,
  как с тренером делали»** — **build**.

- [ ] **19. «для индексного фонда давай график нарисуем с точками его стоимости за пай с
  возможностью выбрать промежуток… 6 месяцев, 1 год, 2 года, 5 лет. Мы же сможем хранить по одной
  цифре за месяц средней»** — **build**, and ⚠ storing a monthly figure is a schema move.

- [ ] **20. «Кнопки put more in, sell it в разделе invest давай в одну строку с инпутами»** — **build**.

- [ ] **21. «С массажистом она выздоровела быстрее после травмы, а с турнира была снята тем не менее
  и теперь на турнир не зайти, надо учитывать наличие массажиста при автоматической отмене
  событий»** — **build**. ⚠ The withdrawal is decided before the masseur's recovery is applied.

- [ ] **22. His save, read in full** — «посмотри пожалуйста полностью историю её перформанса, мне
  очень интересно как она себя показывает вообще относительно наших бенчмарков. Мне кажется если мы
  разберемся с доходностью бренда и прочими мелочами может вполне сносно быть играть даже с
  настолько средней по скиллам девочкой.» — **measure**. ⭐ His hypothesis is the interesting part:
  that an average girl is playable once the economy is right.

---

## APPROVED BY THE OWNER, 02.09.2026 – the numbers agents build to

⚠ Everything below was proposed with measurements, discussed, and approved verbatim: «да, всё
утверждаю, запускай волну 34». No agent may re-derive, round, or "improve" these figures. If a
measurement contradicts one, STOP and report it – do not adjust it yourself.

### A1 – the ceiling bands read TRUE realisation (items 2a/2b/2c)

`coachRoomBandOf` divides `level / (level + room)`, which counts the skill she was BORN with as
achievement. `handoverRoomBand` in the same file already does it correctly, against
`potential − startingSkills(seed, profile)`, and is the model to copy.

Measured on his save before the change: Vera hears «Close to her ceiling» at **41.6%** truly
realised and «At her ceiling» at **76.3%**, while a high-ceiling girl hears the same two sentences
at **72.3%** and **87.7%** – the verdict arrives EARLIER for the girl with less talent. That
inversion is the defect.

Approved band edges, on true realisation:

| realised | line |
| --- | --- |
| 0–40% | Huge potential |
| 40–75% | Still room to grow |
| 75–90% | Close to her ceiling |
| 90–100% | At her ceiling |

Why these two numbers and not others – measured on his save:

* her whole remaining headroom is worth **31 rating points** (mean 55.35 → 56.73, rating 1786 → 1817)
* which is **54.4% instead of 50%** against an opponent she splits with today
* compounding over a draw: 3/4/5/6 rounds → **+29% / +40% / +52% / +66%** relative title chance
* saying «at her ceiling» at 75% writes off **8 rating points**; at 90% it writes off **3**

⭐ On this scale Vera reads «Still room to grow» at 16 and «Close to her ceiling» at 24 – which is
what he asked for: the verdict arrives after twenty, not at fourteen.

### F1 – finals pay fame (item 17)

`trophiesByTier` ALREADY records finals per tier; nothing reads them. Only Slam finals pay today
(`slamFinalFloor`). Vera has **16 finals** – 5 local, 2 regional, 1 national, 1 w15, 4 w50, 2 w100,
1 wta125 – worth exactly zero.

Approved: **a final pays 40% of that tier's own title value**, decayed on the same clock as a title.
Slam finals keep `slamFinalFloor` and are NOT double-counted.

Measured effect on his save: fame 8.9 → 10.3, weekly $244 → $323, worth $76,822 → $104,044.

### F2 – the ranking ladder reaches below the top 100 (item 17)

Season bands stop at top-100 (+0.1). Vera is #144, i.e. BELOW the lowest rung, and a decade of
top-150 tennis has earned her **0.27** in total.

Approved: extend the ladder – **top-150 +0.05, top-250 +0.025** – and make the career cap on season
bands GROW WITH SEASONS PLAYED instead of the flat 4-for-ever it is now, so a long professional
career is worth something.

### F3 – the endorsement ladder below the top 100 (items 7/11/12/13)

Today, per deal-year, all categories signed:

| rank | today | approved |
| --- | --- | --- |
| 201+ | **$0** (no band exists – `adBandFor` returns null) | **$200,000** |
| 101–200 | $45,000 | **$450,000** |
| 51–100 | $1,100,000 | unchanged |
| 11–50 | $2,600,000 | unchanged |
| top 10 | $9,200,000 | unchanged |

⚠ The two cliffs this removes: nothing at all below 200, and a **24x jump on a single ranking
place** from #101 to #100. Above the top 100 the ladder already steps 2.4x / 2.4x / 3.5x and is
NOT to be touched – his ruling: «Про 50–100 отвечаю прямо: пересматривать не надо».

The $200,000 anchor is his, from the film «Cinquième Set»: ~$5,000 a match under a sponsor at ~40
matches a year. ⭐ It was checked against the engine and holds – Vera plays **22 events ≈ 44
matches** a year. The figure is the BAND TOTAL across all categories, never one category's fee.

⚠ The new band is PREPENDED, so every existing band index shifts by one. Verified safe for saves:
the index is spent at signature (`cashCents`, `shootCount` are stored as values, never the index).
⚠ BUT the kit ladder reads `tour`/`premium`/`icon`'s `maxWtaRank` off these bands "read and not
imported" (see the comment in `economy.ts`) – that coupling MUST be checked, not assumed.

### F4 – the brand follows the contracts (item 17)

The incoherence: the sponsor market prices Vera at **$1,000,000 a year** of live deals, while the
brand model says her whole brand is worth **$76,822** and pays **$244 a week**. Her brand is worth
less than one of her contracts for one year.

Approved: **+1 fame per $50,000 of live annual contract value, the contribution capped at +30.**

⭐ The cap is the point: contracts lift the floor under an unglamorous professional, but an icon is
still made by titles, not by her agent. A top-10 saturates the term and has to win the rest.

Measured against his own acceptance test – «как только человек накопит 250к, чтобы его открыть – он
уже будет что-то приносить, а не 200 в неделю как оскорбление»:

| | fame | weekly | a year | brand worth |
| --- | --- | --- | --- | --- |
| top-100, $600k of deals, own fame 6 | 6 → 18 | $1,350 | $70,000 | $520,000 |
| Vera #144, $1M of deals, own fame 8.9 | 8.9 → 28.9 | $2,600 | $135,000 | $1,130,000 |

The $250,000 unlock pays itself back in **3.6 years** and climbs with her. Vera's multiple lands at
**8.4x**, inside the 6–9x corridor round 32 fixed – the free-float defect does not return.

### Backlog, NOT this wave – approved as its own future wave

Per-match sponsor pay, and contract terms of six months / a season / a named group of tournaments
(his: «контракты могут быть на 6 месяцев или год или только на какую-то группу турниров»). It is
the better mechanic – money follows playing, a lost season genuinely costs her – but it rewrites the
letter copy and the moment money arrives, which is a save-schema move. Not to be started here.

---

## ⚠ OPEN FOR THE OWNER, raised by the measurement in bundle A – the top band went elite-only

The approved edge of **0.90** does exactly what he asked, and bundle A shipped it. But walking the
real engine to age 29 (780 weeks, the whole growth arc) measured what it costs:

| rung | peak true realisation | ever hears «At her ceiling»? |
| --- | --- | --- |
| budget | 0.855 | **no** |
| middle | 0.879 | **no** |
| high | 0.895 | **no** |
| elite | – | yes, 6 of 8 careers, weeks 745–776 |

A middle-rung career reads Huge potential → Still room to grow (w81) → Close to her ceiling (w296)
and **never hears the fourth line at all**.

⭐ The original complaint is fully cured: on his own save the old measure said «Close to her
ceiling» at week 78 (age 15.5) and «At her ceiling» at week 158 (age 17.0) – his «приговор» to the
week. The new ladder says «Still room to grow» at 16 and «Close to her ceiling» at 24.

⚠⚠ **But the fourth band also carries advice, not just a verdict**: its note reads «no coach can add
much more now, whatever the price». If an ordinary career never reaches it, a parent whose girl has
stopped growing is never told to stop paying for a coach who can no longer buy anything. That is a
function lost, not only a sentence unheard.

⭐ **My recommendation: move the top edge to 0.85.** It restores the advice on budget/middle/high
careers (all three peak above it), and it is still far from his complaint – on his save the girl is
at 0.416 realised at 14 and 0.876 at 24, so 0.85 fires near her peak and nowhere near her teens.

⚙ **NOT CHANGED. 0.90 is what he approved and 0.90 is what shipped.** This is a decision for him.
