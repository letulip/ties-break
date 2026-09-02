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
  — `[x]` **MEASURED, ANSWERED, AND THE LAST SENTENCE SHIPPED.** Three questions, three different
  answers, and the premise in the triage line above is wrong: the domestic table is **not** a rolling
  52 weeks.

  **THE MEASUREMENT** (`tools/r34-domestic-reset.ts`, 25k middle career, seed 0, four seasons walked
  through the real engine; only the boundary weeks and the weeks a gate MOVED are printed):

  | week | season week | national pts | Regional | National | J30 | J30 chip |
  | --- | --- | --- | --- | --- | --- | --- |
  | 25 | 25 | 68 | open | shut | shut | `68 / 250 national pts` |
  | **51** | **51** | **106** | **open** | shut | shut | `106 / 250 national pts` |
  | **52** | **0** | **0** | **SHUT** | shut | shut | `0 / 250 national pts` |
  | 66 | 14 | 150 | open | open | shut | `150 / 250 national pts` |
  | 77 | 25 | 251 | open | open | **open** | `Open – on the calendar` |
  | **103** | **51** | **251** | **open** | **open** | open | – |
  | **104** | **0** | **0** | **SHUT** | **SHUT** | **open** | – |
  | 155 | 51 | 0 | shut | shut | open | – |
  | 207 | 51 | 0 | shut | shut | open | – |

  1. **DO THE POINTS ZERO AT A SEASON BOUNDARY? YES – and it is HIS OWN RULING, not a bug.**
     `WINDOW_BY_TRACK.domestic` is `'seasonToDate'` (round 23 #12/#13: shown leave-it /
     season-to-date / widen-the-window, he chose season-to-date – «да, это мелочь, а будет хорошо,
     мне кажется. Тем более, что первый сезон у нас показательный»). The two hypotheses are told
     apart by folding the same ledger twice at week 52: a rolling-52 window still carries **all** of
     season one there, the shipped rule carries only what season TWO has paid. So it is a RESET, not
     an ageing-out, and «оно обнуляется каждый год» is exactly right. ⚠ Only the domestic table: the
     ITF and WTA tables are `'rolling52'` and genuinely do carry over.
  2. **DO THE GATES RE-CLOSE? YES, MEASURED – w52 Regional, w104 Regional AND National.**
     `tierFloorOpen` reads that season-to-date total LIVE, so a rung she cleared in September is shut
     again in January. ⚠⚠ **This is the consequence nobody priced when the race was approved, and it
     is the half of his report that is NOT covered by the round-23 ruling.** ⭐ The engine already
     owns the mechanism that would fix it: the two on-ramps LATCH (`onRampCleared`), which is why in
     the table above J30 is still open at w207 on a book of 0 while Regional – cleared at w25 – is
     shut. **Not changed here: latching a cleared domestic floor is a balance decision and his to
     make.** It is a ~1-line change (`tierFloorOpen`'s domestic arm ORed with a never-pruned
     `bestFinishByTier` read – no schema bump), and it is pinned as a red-on-change guard so it
     cannot move in silence.
  3. **«СОВЕРШЕННО НЕПОНЯТНО КАК ВЫЙТИ В J УРОВЕНЬ» – SHIPPED, and it is presentational.** The route
     is J30's floor of 250 national points, and the screen never said those 250 have to be earned
     **inside one season**. The table above is the cost of that silence: 106 at week 51 is not 106 of
     the way to 250, and she did not cross until week 77 of the NEXT season. `tierOpensWhen`'s points
     clause now names the window it is counted over – «age 13 and 250 national pts **in one
     season**» – and the lock's long form ends «…, and the table starts again each season.»
     ⚠ **DERIVED FROM `WINDOW_BY_TRACK`, never written down**: that constant is a plain object
     precisely so `tools/domestic-season-to-date.ts` can patch it for an A/B arm, and a hardcoded
     clause would lie through such a run and through a re-ruling. W15's 120 ITF points are untouched.
     ⚠ **NEW COPY, and he should see the exact strings** – it is the one thing invariant 4 asks be
     named. Two clauses, both additive, on the surface whose own header says it exists so a player
     can read «what do I need to earn to get there» off one screen.

  Evidence: `tests/round34-ladder-plaques.test.ts` (the fold-it-twice arm that separates reset from
  ageing-out, the two measured gate closures, the J-latch asymmetry, the derivation) and the MOUNTED
  `tests/component/round34-j-route.test.ts` – the real Tour guide rendered over a real career, the
  `Opens at` cell read back for J30/Regional/National, and the two arms that fail if the clause
  spreads to a table that does not reset. ⚠ Mutation-verified: dropping the clause reddens 2 unit +
  2 mounted arms; hardcoding it instead of deriving reddens the derivation arm; deleting the
  tooltip's half reddens its own.

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
  — `[x]` **SHIPPED – AND ONE OF THE TWO WAS ALREADY DONE, WHICH IS WHY A THIRD ELEMENT MOVED.**

  **MEASURED FIRST**, through the real cascade on a mounted 375x667 Home (`getComputedStyle`, never
  a grep for the string «Sora» in a stylesheet – the two disagree, see below):

  | what he sees | before | after |
  | --- | --- | --- |
  | `.note-title` – the tournament NAME on the next-tournament plate | Manrope | **Sora** |
  | `.note-figure` – `Travel budget / $117`, same plate | Manrope | **Sora** |
  | `.budget-total` – the balance on Family budget | **already Sora** (since 29.07) | Sora, now pinned |

  ⭐ **THE FINDING, AND IT DECIDED THE BUILD.** The money on Family budget has carried
  `--font-heading` since the U0 port on 29.07, so under the narrow reading of his sentence half of
  this item was a no-op on the day it was filed. The only money on either of the two plates he named
  that was NOT Sora is the travel figure under the tournament – so that is the one that moved, and
  his sentence stops being half a no-op. ⚠ **If he meant only the family-budget total, deleting one
  line at `.note-figure` in `HomeScreen.vue` puts it back** – the note sits on the rule.

  ⚠ REUSED, NOT REINVENTED. All three ask for `var(--font-heading)` – the token declared once in
  `src/style.css` beside the single `@font-face`. No second loader and no open-coded stack, and that
  is asserted as an EQUALITY against the token's own computed value, so an element carrying its own
  copy of the family would fail the arm.

  ⚠ TYPE ONLY (invariant 4). No size, weight, leading, column or word moved: the shipped numbers –
  15.5px/700/118px/1.25, 23px/800, 19px/800 – are pinned beside the families, because a font swap
  that quietly re-sizes a caption is exactly the restyle he did not ask for. ⚠ And nothing here
  claims a caption overflows: happy-dom has no layout engine, a per-character width is a model and
  not a measurement, and he has twice said nothing overflows on those captions.

  Evidence: `tests/component/round34-home-type.test.ts` – 7 mounted arms, plus a round-20 #3 arm
  that walks each caption's room from the viewport through its ancestors. ⚠ Mutation-verified one
  rule at a time: taking Sora off `.note-title` reddens 3 arms, off `.note-figure` 2, off
  `.budget-total` 2.

- [ ] **5. «с нашим текущим "процент прохода 1го круга" на карточках турниров планировать всё равно
  не получается, потому что за неделю нельзя сняться с турнира бесплатно – это бессмысленная фича…
  Какие у нас ещё здесь варианты? … надо хотя бы что-то примерное писать до жеребьевки»** — **ask**,
  and it reopens round 31 #4. ⚠ The band was supposed to be the pre-draw information; he is saying it
  is not enough to plan on. Round 31 #3 already measured the band as degenerate on junior and domestic
  cards — that finding and this complaint are the same defect.

- [ ] **6. «W35 · 🔒 163 / 0 international pts вот это вот что значит? И на следующих тирах такое
  же»** — **measure**, then build or answer. A lock showing `163 / 0` is either a swapped pair or a
  zero that should be the requirement.
  — `[x]` **SHIPPED.** Neither guess: it is a **requirement that failed to resolve**, and «на
  следующих тирах такое же» is literally true – EVERY acceptance rung printed it.

  **THE REPRODUCTION** (`tools/r34-zero-lock.ts` – nine presets x two seeds, walked 13→21 through the
  real `toSnapshot` and the shipped `tierState`, so a hit is the string the strip renders):

  | rung | first week it printed a requirement of 0 | chip | tooltip |
  | --- | --- | --- | --- |
  | J60 / J300 | career **week 0**, age 13 | `0 / 0 national pts` | `locked: 0 more national pts (she has 0 of 0)` |
  | W35 / W50 / W75 / W100 / Slam | week 23, age 14 | `0 / 0 international pts` | same shape |
  | WT125 / WT250 / WT500 / WT1000 | week 76, age 15 | `64 / 0 international pts` | `locked: **-64** more international pts (she has 64 of 0)` |

  ⭐ **HIS 163 IS THE SAME ROW AT A BIGGER JUNIOR BOOK.** The tooltip is worse than the chip: the
  arithmetic goes NEGATIVE.

  **THE CAUSE.** Since PR-09 / TB-05 the ENGINE's refusal decides whether `tierState` calls a rung
  locked, and an acceptance-list rung is refused on a **rank** (`rankToEnter`), never on points. The
  points arm then fell back to the tier's own `enterPointBand[0]`, which is `0` on every acceptance
  rung – so it printed her book over a threshold that does not exist. ⚠ **It is a regression the
  projection introduced**: before the refusal existed, `bandLocked` was `bandPoints < 0` = false on
  those rungs, so they fell through to the acceptance arm and read «Opens in the top 700».

  **THE FIX.** `refusedOnRank` (a `locked` refusal carrying `rankToEnter` and no `pointsToEnter`)
  routes to the acceptance arm instead of the points arm. The rung is still LOCKED – `isTierOpen` is
  false either way, no rung opened – and the chip is the string that arm **already** printed for this
  state, so no new wording enters the app: `Opens in the top 700`. The tooltip becomes the ENGINE's
  own `detail` («World Tour 35 takes the top 700 – she has no professional ranking yet»), which also
  names the right table: the arm's fallback sentence says "her international ranking" for every rung,
  true of the J rungs it was written for and false of the W ones.

  ⭐ **IT CLOSES THE W15 CASE `tierState.ts`'s OWN NOTES DESCRIBE, from the far side.** Their fix was
  `engineOpen === true` short-circuiting the band; what stayed live was the engine holding W15 SHUT
  on the junior RESERVED PLACE – `rankToEnter`, no `pointsToEnter` – where the plaque priced her book
  against W15's 120 and never mentioned the place. Same arm, same repair. This is the **fifth**
  occurrence of that family and the notes now name it.

  After: `tools/r34-zero-lock.ts` reports **0** distinct (preset, rung) pairs printing a requirement
  of zero, against 11 rungs before. Evidence: `tests/round34-ladder-plaques.test.ts` – the
  reproduction at his own numbers, a sweep over every rung x six books that fails on `/ 0 `, on
  `of 0)` and on any negative distance, the W15 reserved-place arm, and two non-regression arms (a
  genuine points refusal still prints `112 / 150 national pts`; a lock with NO distance is still
  «Outgrown», round 28 #12's arm). ⚠ Mutation-verified: reverting the one boolean reddens 3 arms.

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
  — `[x]` **SHIPPED. THE ANSWER TO HIS QUESTION IS ONE BUTTON AND ONE LABEL – ⭐ BUT HE WAS SEEING
  SOMETHING REAL, AND IT HAS A NAME.**

  **THE COUNT – the reproduction he asked for.** The whole `App` shell mounted on Home at 375x667,
  counted over the entire document, not over one component's subtree:

  | counted | on screen |
  | --- | --- |
  | `.next-week-bar` – the floating bar | **1** |
  | `.next-week-btn` – the yellow button | **1** |
  | controls wearing the app's lime `.primary` | **1** of 15 buttons on screen |
  | leaf elements anywhere printing that exact label | **1** – the button itself |
  | the button's own child nodes | **1**, a text node; no `::before`/`::after`, no `text-shadow` |

  ⭐⭐ **WHAT HE ACTUALLY SAW.** Manrope is self-hosted at 400 and 500 ONLY (`public/fonts/`). The
  button was computing **600**, which has no real face, so the renderer emboldens the 500 one – and
  synthetic bold thickens a stroke by drawing it AGAIN, offset. One label, drawn twice by the
  rasteriser. «Мне кажется» was not imagination and it was not a second button; the regular weight
  ends it, because 400 is a face that actually ships.

  ⚠⚠ **AND THE `font-weight: 800` IN THE SHEET HAD NEVER APPLIED.** The element is
  `<button class="primary next-week-btn">`: `button.primary` is specificity 0-1-1, `.next-week-btn`
  is 0-1-0, so the weight the player has been reading all along is `button.primary`'s **600**, not
  the 800 the stylesheet appeared to promise. Measured on a mount, not deduced. The dead declaration
  is DELETED rather than edited – a rule that loses its own cascade tells the next reader a number
  the screen never used – and the new weight is declared at `button.next-week-btn`, the smallest
  selector that can win without touching `button.primary` itself: twelve files of affirmative
  buttons hang off that rule and he named exactly one button.

  **THE BUILD:** `font-weight: 400`, which is CSS `normal` and the literal «обычные». ⚠ 500 is one
  step away if he wants a touch more body in it – one number, say the word.
  ⚠ `PrimaryPill`'s `.tb-pill--cta` keeps its 800 on purpose: a different button, on TournamentFlow,
  EndingScreen and the wizard, and it never renders on Home.

  ⚠ **THE ONE STATE WHERE THAT BAR HOLDS TWO CONTROLS IS HIS OWN.** On a long injury layoff the span
  pill stands to the LEFT of the CTA – round 26 #1, «давай сделаем ее во-первых слева от основной».
  Two controls, still one yellow button: the pill is the outline variant deliberately (one CTA per
  screen). Asserted in that state too, so the answer holds in both.

  Evidence: `tests/component/round34-home-type.test.ts` – 7 mounted arms, including `assertRowFits`
  at 375x667 in BOTH bar states (round-20 #3). ⚠ Mutation-verified: demoting the new rule back to
  `.next-week-btn` reddens 3 arms; the count arms clone the button and inject a bare second label
  into the live document and watch both counts move, so a real double could not hide from them.

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
  — `[?]` **MEASURED IN FULL. HIS DIAGNOSIS IS CONFIRMED TO THE TIER. HIS REMEDY IS ALREADY SHIPPED
  AND IS THE MECHANISM PRODUCING THE SYMPTOM – so nothing was built, and the two candidate designs
  are below for him to rule on.**

  **THE MEASUREMENT** (`tools/r34-calendar-tiers.ts`): careers walked to WTA #95–#117 at a season
  start, then ONE FULL SEASON recorded week by week through the shipped predicates the two calendar
  surfaces use – `toSnapshot` for the cards, `feedContext` / `feedShows` / `preferredWeekEvent` for
  the row – so the table cannot disagree with the screen. Six seasons that stayed outside the top 50
  (a seventh climbed to #15 and is excluded: play-down then shuts W50–W100 and it measures a
  different player).

  | rung | generated / season | SHOWN by the calendar | share | rows a season |
  | --- | --- | --- | --- | --- |
  | WT500 | 10 | 60 of 60 | **100%** | 10.0 |
  | W50 | 12 | 31 of 72 | 43% | **5.2** |
  | WT250 | 8 | 30 of 48 | 63% | **5.0** |
  | Slam | 4 | 24 of 24 | **100%** | 4.0 |
  | WT125 | 4 | 20 of 24 | 83% | 3.3 |
  | W75 | 8 | 18 of 48 | 38% | 3.0 |
  | W100 | 4 | 12 of 24 | 50% | 2.0 |

  ⭐⭐ **THE CUT FALLS EXACTLY WHERE HE PUT IT.** Ordered by rows a season, his «доступны» set
  {50, 250, 500, шлемы} is the top four and his «нет» set {75, 100, 125} is the bottom three, in
  order. ⚠ Note it is ROWS and not share that reproduces his reading: W50 is the second least
  visible rung by percentage and he still sees it, because 43% of twelve is more cards than 83% of
  four.

  ⭐ **AND «ОНИ ПРЯЧУТСЯ НА ТЕХ ЖЕ НЕДЕЛЯХ» IS EXACTLY THE MECHANISM.** Every missing row is a
  same-week loss, recorded by the thief. One season, week by week (elite seed 0, w468, age 22,
  WTA #111 – `gen` is every event the engine put on the week, strongest first):

  ```
  w470  gen [Slam W75 J30 Regional Local]              shown Slam
  w476  gen [WT1000 WT125 W75 W35 W15 J30 Local]       shown WT125
  w483  gen [WT500 W75 J60]                            shown WT500
  w489  gen [Slam WT250 W75 Regional Local]            shown Slam
  w494  gen [Slam W75 W50 W15 J300 J60 J30 Local]      shown Slam
  w502  gen [Slam W75 W35 W15 J60 J30]                 shown Slam
  w506  gen [W75 W50 W35 J30 National]                 shown W75   <- the only one
  w512  gen [WT125 W75 J300 J60]                       shown WT125
  ```

  ⚠⚠ **AND THE HALF HE DID NOT NAME, WHICH IS THE BIGGER NUMBER: 12 of the 48 eventful weeks show
  her NOTHING** (w474, 477, 480, 481, 488, 491, 493, 499, 504, 505, 509, 516). Every event on those
  weeks is a rung she has outgrown (W15/W35 play-down-barred at #111, the J rungs age-shut at 22, the
  domestic three shut on the pro table) or one she cannot reach (WT1000 takes the top 65). So the
  season is not short of tennis – it carries ~50 events she may enter across 48 weeks – it is
  **badly distributed for her rank**: a quarter of her weeks are empty while a quarter stack two to
  four rungs she could play and only one survives.

  **⚠⚠ WHY NOTHING WAS BUILT.** «Заменять более низкие турниры в сетке более высокими с повышением
  ранга» is `preferredWeekEvent`'s third tiebreak, shipped 05.08/06.08 and measured in
  `docs/specs/ladder-floor-2026-08.md` §2: on a stacked week the row shows the ENTERED event, else
  the one she may actually ENTER, else the **highest rung** – so as her rank rises the taller rung
  takes the slot and the lower one is replaced. That rule IS the thing hiding his W75. Building it
  would be building the cause, and the brief's own instruction is to stop and report rather than
  invent a third design.

  **THE REAL CAUSE, for whichever design he picks.** The three anchored rungs – Slam `[2,21,26,34]`,
  WT500 `[4,10,15,19,24,28,33,39,43,47]`, WT1000 `[5,8,12,18,31,37,41,45]` – claim **22 of the 49
  playable week-offsets, the same offsets in every world for ever**, before a single cadence rung is
  placed. `buildSeason` then places the cadence rungs by `tierPhase` + jitter with no knowledge of
  the anchors, so a rung with 4–8 events a season loses roughly half of them to a taller rung on the
  same week – and the sparser the rung, the fewer survive. That is the same fixed-grid failure
  `tierPhase`'s own note records and fixes for the cadence rungs; the anchors reintroduced it.

  **THE TWO DESIGNS, AND WHAT EACH COSTS – his call:**
  - **(A) SUPPLY.** Place a cadence rung away from weeks already claimed by a taller one («они не
    конфликтуют в сетке»). ~6 lines in `buildSeason`. ⚠ It changes `world.season`, so the AI field
    and the season RNG stream move → invariant 5 wants a bench and a spec, and it partly reverses his
    own ruling recorded in `calendar.ts`: «ONE EVENT PER TIER PER WEEK, NOT ONE EVENT PER WEEK … with
    J-tiers, empty weeks stop being boredom and become CHOICE». Existing saves keep their dealt
    blocks (`ensureSeason` never re-deals), so only future seasons change.
  - **(B) DISPLAY.** Let a week that stacks several rungs she may enter offer more than one card.
    ⚠ It is NOT what he proposed – he asked for them not to conflict – and it retires R15-9's
    one-row-per-week rule that rounds 31/32/33 all built on.

  ⚠ A generation-time fix cannot be rank-aware (a year block is dealt once, and her rank moves
  through the season) and a rank-aware fix cannot be at generation time – which is why (A) and (B)
  are genuinely different games rather than two spellings of one.

- [ ] **15. «Сумма дохода на savings меняется вниз если деньги вывести. Мне кажется она не должна
  меняться, просто новое поступление будет меньше»** — **reproduce**, then build.
  — `[x]` **REPRODUCED, THEN SHIPPED. IT IS AN AMOUNT, NOT A RATE, AND HE IS EXACTLY RIGHT.**

  **THE REPRODUCTION** (`tools/r34-savings-income.ts` – $100,000 opened, held ten years through the
  real engine, then half taken out with the real `sellAsset`). The card carries three numbers that
  could be read as «доход», and the walk prints all three so the numbers say which one he saw:

  | what the card says | before the withdrawal | after |
  | --- | --- | --- |
  | «Gains about 3% a season» (`annualRatePct`) | 3% | 3% – a RATE, and it did not move |
  | «Brings in $N a week right now» (`incomeCents`) | $0 | $0 – zero on a deposit by design |
  | **«+$36,626 since they bought it (37%)»** (`changeCents`) | **$36,626** | **$18,313** |

  So it is the lifetime-gain AMOUNT, and it was being recomputed from the balance that REMAINS:
  `changeCents = valueCents − paidCents`, and a part sale scales both by the same fraction. The
  family was not poorer – the $68,313 was in the wallet – but the card answered «what is the gain on
  what is still held» to a sentence that asks «what has this earned».

  **THE FIX.** `sellAsset` already computes both halves of the part that leaves for its own ledger
  sentence (`deltaCents` = the realised gain, `costSoldCents` = what it cost). They are now kept on
  the row (`realisedGainCents`, `realisedCostCents`), and the card reads
  `valueCents − paidCents + realised`. The same walk now prints **$36,626 → $36,626, moved by $0**.
  ⚠ The PERCENTAGE needed the second field or the fix would have moved the number he did not
  complain about: `paidCents` is the cost of what is still held, so a lifetime gain over it alone
  would have jumped 37% → 73% on the same withdrawal. Over lifetime cost it holds at 37%.

  ⭐ **HIS SECOND CLAUSE NEEDED NOTHING** – «просто новое поступление будет меньше» is what the
  engine already does. The tool prints the halved balance accruing **$41** in the week after the
  withdrawal, and it is now PINNED rather than left as an observation: an arm asserts the week's
  accrual falls after a part sale, and that doubling it returns the full-balance week's figure.

  ⚠ **NOT A SCHEMA MOVE, ON THIS REPO'S OWN RULE** (`gearRestWeeks?`, `shootClashAccepted?`,
  `WorldEvent.entryRef`): both fields are optional and ABSENT means exactly what every save written
  before today means – no realised gain recorded – so an in-flight career reads the figure it read
  yesterday, to the cent, and starts remembering from its next withdrawal. Asserted rather than
  assumed, in its own arm.

  Evidence: `tests/round34-savings-income.test.ts` (6 arms: the reproduction as an assertion, the
  percentage, the realised+unrealised identity, a realised LOSS staying realised, backwards
  compatibility, and his second clause) + a mounted arm in
  `tests/component/round34-money-shelf.test.ts` that the SENTENCE on the card does not move.
  ⚠ Four-mutation ledger in the test header; the four verdicts differ from one another, which is
  what says the arms measure different things. `tests/round29p2-part-sale.test.ts`'s identity was
  **re-aimed, not loosened** – it read «the unrealised half and nothing else», which is the defect –
  and gained a non-vacuity arm so it cannot pass by both sides being zero.

- [ ] **16. «Business пододвинуть к Invest в магазине»** — **build**, ordering only.
  — `[x]` **SHIPPED.** `SHELF_TAB_OPTIONS` in `MoneyScreen.vue` now reads Invest / **Business** /
  Cars / Property / Water / Air. Only the ORDER moved: every label, title and the tab-to-family map
  are untouched (invariant 4 – he asked for a position, not a word), and `SHOP_FAMILIES` is
  deliberately NOT reordered with it, because that array is the order INSIDE a tab (it is what puts
  the brand above the academy under Business) and nothing on screen reads it across tabs.
  Evidence: two mounted arms in `tests/component/round34-money-shelf.test.ts` – the rendered pills
  put Business at `indexOf('Invest') + 1`, and pressing the moved segment still opens
  `The business` + `Her academy`, so an order change that quietly repointed a tab is caught too.
  `tests/component/shelf.ts`'s `SHELF_TAB_LABELS` re-aimed with a ⚠ note; `round30-subtabs.test.ts`
  reads that constant and still fails the moment the screen and it disagree.

- [ ] **17. «89 место доход опустился с 200 до 65 долларов в неделю с бизнеса… Она доходит в Шлеме
  до QF и вообще стабильно в 100 держится, плюс есть мощные рекламные контракты… мне кажется нам
  надо улучшить формулу рассчета доходности и стоимости ее бренда»** — **measure**. ⚠ Round 32
  reworked exactly this; a fall from $200 to $65 while she is top-100 is either the fame decay
  working as designed or a defect the rework introduced. Must be read off HIS save.

- [ ] **18. «В магазине те пункты, которые во владении находятся давай цветом выделять рамку жёлтую,
  как с тренером делали»** — **build**.
  — `[x]` **SHIPPED, AND IT IS LITERALLY THE COACH'S FRAME.** «как с тренером делали» is the half
  that decided the implementation: he is naming round-21 #11, so `.shop-row.is-owned` carries
  `.cm-row.current`'s own three declarations – `rgba(var(--accent-rgb), .07)` behind it,
  `border-color: var(--accent)`, and the `box-shadow: 0 0 0 1px var(--accent)` ring that makes it
  read as a FRAME rather than a hairline. One `--accent`, not a second convention: move the token
  and the coach she has and the things they own move together. ⚠ An outer shadow paints outside the
  border box, so a framed card and an unframed one still line up in the feed – round-21 #11's own
  reasoning, reused rather than rediscovered.
  ⚠ The predicate is the CARD'S OWN (`row.valueCents !== null`), which is already what decides
  whether the card draws its owned half or its shop window – so a rung can never be framed and
  priced at the same time, and there is no second definition of «owned» to keep in step.
  ⚠ No word, price or control moved with it.
  Evidence: three mounted arms in `tests/component/round34-money-shelf.test.ts`, one of which reads
  the shipped `.cm-row.current` through the real cascade and compares all three values, and one of
  which walks all six segments to assert **framed on screen == owned in the engine**. Mutation
  ledger in the header: deleting the CSS reddens the paint arm alone, and widening the predicate to
  `true` reddens all three for three different reasons – a frame that means nothing is caught as
  loudly as a frame that is missing.

- [ ] **19. «для индексного фонда давай график нарисуем с точками его стоимости за пай с
  возможностью выбрать промежуток… 6 месяцев, 1 год, 2 года, 5 лет. Мы же сможем хранить по одной
  цифре за месяц средней»** — **build**, and ⚠ storing a monthly figure is a schema move.
  — `[x]` **SHIPPED – AND ⚠⚠ IT IS NOT A SCHEMA MOVE AFTER ALL. NOTHING IS STORED, AND THE TRIAGE
  LINE ABOVE IS WRONG. THIS NEEDS THE OWNER'S EYE.**

  **WHY.** `unitPriceCents(seed, week, item)` is a PURE function – its own header says «Pure: no
  world, no MAIN draw, no clock» – because `world/market.ts` was built on one load-bearing idea:
  «**THE MARKET EXISTS WHETHER OR NOT SHE BUYS** … a path drawn from the career's seed alone, READ
  at the weeks a holding spans rather than DRAWN when one is opened». So **every past week's price
  is computable from the seed**, and the monthly series he offered to store is derivable. His
  sentence «мы же сможем хранить» was answering an objection about COST; on this engine the chart is
  cheaper than that.

  **WHAT DERIVING IT BUYS, and the first one is what decided it:**
  * ⭐ **HIS OWN LIVE CAREER OPENS ON A FULL CHART.** Vera is at week 569. A stored series starts
    EMPTY, so he would have opened the new screen on an empty box and waited five years for the
    feature he asked for. Derived, all sixty months are there the moment he loads. Pinned in a test
    at his own week.
  * The chart cannot disagree with the card above it – both ask `unitPriceCents`. A recorded series
    is a second source of truth for a number the engine already computes, which `world/shop.ts`
    itself calls «a screen and a valuation disagreeing, this repo's most-repeated defect».
  * No migration is spent. Migrations are append-only FOREVER (CLAUDE.md item 3), so a schema
    version added for data nothing reads is a permanent cost for no benefit.

  ⚠ **THE ONE THING STORAGE WOULD HAVE BOUGHT** is a record of what the player SAW if the market
  model is ever re-tuned. `world/market.ts` has already ruled on that – «Nothing persists any of it,
  so this is a debugging convenience rather than a compatibility promise» – and a re-tune already
  rewrites what a holding is worth today (`revalueAssets` re-prices `units × price(week)` every
  tick), so a frozen chart beside a re-priced holding would BE the disagreement, not the protection.
  ⭐ **If he wants the series recorded anyway, that is one field and a migration and I will build
  it – but it should be his call, not a default.**

  **WHAT SHIPPED.** `unitPriceHistory(seed, week, item, months)` in `engine/world/assets.ts`: one
  averaged figure per **real calendar month** (`shared/dates.ts`'s own months, so the chart's axis
  and every other date on screen read one calendar), oldest first, rounded once at the engine
  boundary. Twelve months a season, so five years is **60 points** – the number his own sentence
  arrives at. On the card: the polyline, one dot a month («с точками»), a low–high span and the two
  end months, and his four windows as a picker – `6 months / 1 year / 2 years / 5 years`, the
  numbers in `SHOP_PRICE_RANGE_MONTHS` so the picker and the engine's series length cannot disagree.
  ⚠ The predicate is `ShopItem.volBps` – does this rung ride the market – so the fund he named has a
  chart, the deposit's dead-flat exponential does not (a line with nothing to read, on a card he did
  not mention), and a wilder fund added tomorrow gets one because of what it IS.

  ⚠ **A CAREER TOO YOUNG FOR A LINE GETS AN HONEST SENTENCE, NEVER A BACK-FILL.** `marketWave` is
  happily defined for negative weeks, so the real failure mode of a derived series is inventing
  history the family did not live; the walk stops at week 0. A career in its first month has one
  point and the card says «One month of prices so far – the chart starts next month.»

  ⚠ **COST, MEASURED RATHER THAN ASSUMED**, because `shopView` runs on every `toSnapshot`: the
  60-month series is **0.28 ms** and is the whole of `shopView`'s move from 0.03 ms to 0.30 ms. The
  walk is bounded by the ANSWER's size (~4.34 weeks a month, ~260 iterations) and not by the
  career's length, so a thirty-season career costs what a two-season one does. Suite A/B on the same
  machine, same shard: `bulk` **110s before, 112s after** – inside the run-to-run noise.

  Evidence: `tests/round34-fund-chart.test.ts` (10 arms – the four windows, real calendar months,
  the month's mean, determinism, retroactivity at his own week 569, nothing behind week 0, the short
  young series, and the `volBps` predicate) + six mounted arms in
  `tests/component/round34-money-shelf.test.ts`, **one per range button** (6/12/24/60 dots), the
  honest short-career line, no chart on the rungs that do not ride the market, and a `fits.ts`
  assertion that the four range controls fit a 375x667 phone. Mutation ledgers in both headers, and
  one entry is recorded because it changed NOTHING: the `Math.max(0, …)` clamp in `unitPriceHistory`
  is belt and braces, since the walk's own `w >= 0` conditions are the real floor.
  ⚠ `tests/week-numbering.test.ts`'s R11-6 guard – «no surface prints a raw absolute week» – caught
  the chart's time axis and was **re-aimed, not loosened**: `monthLabel(` joins the five shared
  formatters already on its allow-list, for the reason the list exists (it prints «Jan '31», never an
  integer), and every other spelling is still refused.
  ⚠ `npm run e2e:fixtures` re-run: byte-identical, no diff – this item stores nothing, so no fixture
  could move. ⚠ `SAVE_SCHEMA_VERSION` is untouched at 69, and no other bundle moved it either.

- [ ] **20. «Кнопки put more in, sell it в разделе invest давай в одну строку с инпутами»** — **build**.
  — `[x]` **SHIPPED, AND MEASURED AGAINST A PHONE.** A `.shop-stake-row` wrapper puts each control
  beside the field it acts on – «Add more, from $X» with **Put more in**, and «Take out how much…»
  with **Sell it for $X**. Nothing else moved: both keep their sentence, their `disabled` predicate,
  their command and their `v-if`. ⚠ The sell wrapper is drawn UNCONDITIONALLY so the control stays a
  single element rather than two copies behind opposite `v-if`s – a car has no amount to type and
  comes out of the row exactly as the bare button did, which is its own arm.
  ⚠ **ROUND-20 #3 IS THE HALF THAT NEEDED WORK.** `fits.ts` could only measure a `position: fixed`
  bar, so it gained `availableWidth` / `rowItemWidth` / `assertInlineRowFits` – the same arithmetic
  read against a room WALKED down the real ancestor chain, and reading a control's declared `width`
  (a form field carries no text, so the old `demandedWidth` scored `.shop-stake-input` as its
  padding). Measured at 375x667: the sell row on a $1,000,000 holding demands **285px of a 349px
  line**, so it really is one row on his phone. `flex-wrap` plus `white-space: nowrap` is what a
  bigger figure spends – a line inside the card, never the edge of the screen.
  Evidence: three mounted arms in `tests/component/round34-money-shelf.test.ts`. ⚠ The mutation that
  matters: widening `.shop-stake-input` from 8.5em to 30em with the STRUCTURE untouched reddens the
  375x667 arm and nothing else in the file – which is what says the row was measured against a phone
  and not against a desktop.

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
