---
type: round
status: current
area: delivery
last-reviewed: 2026-10-07
---

# Round 48 – первый детальный проход по смерженному раунду 47, 8 пунктов (07.10)

Контекст: «всё смержено, я посмотрю детально, но вроде стало сильно лучше» – и сразу восемь
пунктов с живого билда (его 20-сезонный сейв, тот же что в раунде 47). Мандат: «сделай отдельный
раунд пожалуйста для всех этих пунктов». Ветка `round/48` от мержа #167.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

- [!] **1. «пара моментов в альбоме пустых на последних страницах осталась (для горизонтальных
  пустых мест можно еще фото добавить какое-то, например из vacation второе рядом, на последней
  странице и предпоследней всё ещё остались пропуски, на последней повесь вертикальную бирку w1000
  справа, а на предпоследней зеленый билет на Шлем внизу)»** – REOPEN раунда 47 №14 (филлеры).
  Первая правка: B3 добавил 43 rest/vacation снимка и `placeFiller` ПОСЛЕ прохода билетов – но
  филлер один на лист и его окно не закрывает горизонтальные щели, а последние два листа карьеры
  остались с пропусками. Три под-пункта: **1a** горизонтальные пустоты – ВТОРОЕ фото рядом
  (vacation-пара); **1b** последний лист – вертикальная бирка W1000 справа; **1c** предпоследний –
  зелёный билет на Шлем внизу. Класс: build.
- [!] **2. «оверлап текста и заголовка на одной из страниц всё еще есть - эти надо точно поправить
  (The Tour/Straight back to the planning - надо отодвинуть последний дальше вправо)»** – REOPEN
  раунда 47 №9. Первая правка: B3 убил коллизию заголовок/ГЕРОЙ на 121 C-листе через таблицу
  размещения – но пара заголовок/ПОДПИСЬ («The Tour» / рукописная «Straight back to the planning»)
  в тот свип не входила. Правка: подпись дальше вправо. Класс: build.
- [x] **3. «Spent на первое место, Family's share мне кажется некорректно посчитано (40.6 млн
  против ее аккаунта 321.1 млн) проверь пожалуйста и поставь на 2 место, потом Family's portfolio
  на 3м и последний ее аккаунт»** – **3a** порядок денежных строк концовки: Spent → Family's share
  → Family's portfolio → её аккаунт; **3b** ПРОВЕРИТЬ математику Family's share на его сейве
  (40.6M против 321.1M у неё – подозрение на некорректность). Класс: measure (3b) + build (3a).
  - **ПЕРЕРЕШЕНО тем же днём, после вердикта по 3b**: «наверное Family's share вообще можно
    убрать, а spent переименовать TENNIS & TRIPS и проверить их сумму за все года, здесь я имею
    в виду вообще все расходы на теннис, конечно, включая всех тренеров. останется всего 3 цифры
    в итоге.» – 3a теперь: строка Family's share УХОДИТ, Spent переименовывается в его
    «TENNIS & TRIPS», остаются ровно ТРИ денежные строки (Tennis & trips → Family's portfolio →
    её аккаунт). 3b расширяется: проверить, что цифра – вся карьера и ВСЕ теннисные расходы,
    включая всех тренеров (состав `outlayCents` по категориям + сверка с банкованными
    посезонными spentCents).
  - **B1 · 3a [x] (07.10, sonnet).** The money list is THREE rows: «Tennis & trips» → «Family's portfolio»
    → «Her account» (last). «Family's share» is REMOVED – no `v-if`, no `display: none`, its figure is not
    in the DOM. The source label is `Tennis & trips`, not his literal caps: `.ending-totals dt` already
    carries `text-transform: uppercase`, so the page shows his TENNIS & TRIPS (Chromium `innerText`,
    375x667). The figure is untouched – `outlayCents`; the sum check is the architect's (3b-2). «Her
    account» stays conditional (no cheque on her account → two rows), the facts row is untouched, and the
    first ruling's four-row reorder was never built. Evidence: `tests/component/r48-b1-ending-page.test.ts`,
    «round 48 #3a» (the three-label sequence, the share label and figure ABSENT, the old «Spent» absent,
    every figure with its own label, the caps) – mutation-proven both ways: swap two rows RED (3 tests here
    + 1 in r47-b1), share row put back RED (5 + 1 + 2), `Spent` put back RED, `uppercase` removed RED (1).
- [x] **4. «She said one more year - всё еще осталось и не исправлено, это не она говорила, а мы
  предлагали, надо переформулировать»** – REOPEN раунда 47 №11. Первая правка: раунд закрыл пункт
  как `[~]` – «отвечено, драфты S4–S6 ждут выбора» – но для владельца неизменённый экран есть
  неисправленный пункт; `[~]` на видимой неверной строке пункт не закрывает. Решение теперь дано:
  говорила НЕ она – предлагали МЫ; все пять мест (дневник, нота под кнопкой, плато-леде, lastWord,
  страница) переводятся в голос родителя-предложившего. Класс: build.
  - **B1 · [x] (07.10, sonnet) – the five final strings, verbatim** (N is her count; `time` at 1):
    1. page line (`EndingScreen.vue`): `You said one more year N times.`
    2. diary (`engine/world/endings.ts`, `answerRetirement`): `One more year, you said. Same as last time.`
    3. note under the button (`RetirementDialog.vue`): `The same answer you gave last winter.`
    4. plateau lede (`engine/ending.ts`, `plateauLede`) – band 1: `She brought it up before the airport
       this time. You have said one more year once already, and she has stopped pretending the next season
       is different. She would still play a year for you – she said that too.` – band 3+: `This time she said
       it looking out of the window. You have said one more year N times, and the <table> table has not
       moved. She will not fight you on one more – but you both know what she wants.` (bands 0 and 2 never
       credited her with the answer and are byte-identical)
    5. `lastWordLine` (`engine/ending.ts`): `Nobody asked her this time. She said it herself, and she said it
       steadily. You have said one more year N times, and this season was the last one.` (count 0 is
       unchanged: `… This season was the last one.`)

    ⚠ UNTOUCHED, as ruled: the final age offer – `LAST_WORD_OPENING`, «Nobody asked her this time. She said
    it herself, and she said it steadily.» – and its refusal `LAST_OFFER_NOT_A_QUESTION`. Kept as hers on
    purpose: «she said that too» (band 1 – her offer to play on) and «she said it looking out of the window»
    (band 3+ – her doubt, the card's own «She said it in the car» voice).
    Evidence: `tests/r48-b1-voice-flip.test.ts` (the literals above, her opening and bands 0/2 to the byte,
    the diary through the real `answerRetirement`, a «she said one more» tripwire over counts 0–40) and
    `tests/component/r48-b1-ending-page.test.ts`, «round 48 #4» (page line at 1/2/5/27, the note on the age
    and plateau cards, the final card, the plateau bands on screen). Mutation-proven, each site put back to
    «she»: page line RED (2 here + 1 endings-ui + 1 r47-b1), note RED (1 + 1 last-word), `lastWordLine` RED 3,
    band 3+ RED 3, band 1 RED 3, diary RED 1; flipping HER opening too RED 2.
    Not touched, for the owner's eye: `ENDING_BLURB.natural` (`engine/ending.ts`) reads «…for years she said
    one more. This year she did not.» – rendered by NOTHING today (`wave8-family-ending` pins that), so it is
    not one of the five; `docs/specs/the-long-goodbye-2026-08.md` still quotes the old strings, as history.
- [x] **5. «for life выделить жирным (если есть)»** – найти строку с «for life» на поверхности
  концовки; если есть – жирным. Класс: build (если строки нет – answer).
  - **B1 · [x] (07.10, sonnet).** The line exists – the lifetime-deal note in `.ending-note` (`The {brand}
    deal never ran out – $X a year, for life.`, shown when a lifetime deal was signed). It is `a year,
    <b>for life</b>.` now: a plain `<b>` (they are words; `ending-fig` is the figure style), the sentence
    byte-identical. Chromium (375x667): `for life` computes to weight 700, Manrope 14px, against 400 around
    it. Evidence: `tests/component/r48-b1-ending-page.test.ts`, «round 48 #5» – the text node `for life`
    stands alone inside a `b`/`strong` holding exactly those two words, and the bold set is [`$2.5M`,
    `for life`]; mutation-proven (`<b>` removed RED 2, bold widened to «a year, for life» RED 2). happy-dom
    reports `normal` for a bare `<b>`, so the proof is the element and the weight is the browser measure.
- [x] **6. «Кнопки Raise another, A daughter (child лучше) came later в один ряд давай
  поставим»** – **6a** две кнопки-двери концовки в один ряд; **6b** вординг-руллинг владельца:
  «A daughter came later» → «A child came later». Класс: build.
  - **B1 · [x] (07.10, sonnet).** `DYNASTY_AFTER` is `A child came later` (his own «child is better»; the
    lived label `Raise her daughter` is untouched). The two doors are ONE ROW: a new `.ending-doors` flex row
    – always present, so the college ending's lone `Another year –` keeps its content width; the equal halves
    are declared for the pair only (`:not(:only-child)`): `flex-grow 1`, `flex-shrink 1`, `flex-basis 50%`,
    `min-width 0`, 12px sides, 12px gap, 460px cap. A wrapper and not a grid on the footer, because fits.ts
    models flex rows only. **Measured in Chromium (07.10):** 375x667 – row 343px (16..359), doors 165.46 and
    165.54px, same top (733.37) and height (40.5), one line each, no horizontal overflow; 320x568 – row
    288px, doors 137.95 and 138.05px, same top and height (50), `Raise another` on one line and the line door
    on two (the label wraps INSIDE its pill, as designed), no overflow; the college lone pill 151.5px,
    centred. (The first spelling, `flex-basis: 0`, measured 164.5 / 166.5 – the ghost pill's 1px border – and
    became 50%.) Evidence: `tests/component/r48-b1-ending-page.test.ts`, «round 48 #6» (the label; a flex row,
    no wrap; equal shares with `min-width: 0`; at 375 and 320, for both labels, `assertInlineRowFits`, a
    gutter-aware half-width check, `assertDismissReachable` for both doors and ONE shared bottom) –
    mutation-proven: `display: block` and `flex-direction: column` (RED 6 here + 1 wave10 each),
    `flex-wrap: wrap` (RED 2), `min-width` 206 and 170 (RED 5 each – the 170 passes the shared instrument at
    375 and is caught by the gutter-aware check), the pair rule on the lone pill (RED 1), the record link
    above the row (RED 3), the old label (RED 2 + 1).
    Pins re-aimed with a ⚠ 07.10 note: `e2e/dynasty.spec.ts` (the literal), `wave10-dynasty-door` (the label;
    the «stacked» assertion became one shared bottom + the row above the record link – the tail-walk arm in
    its header reddens it, verified), `r47-b1-ending-figures` (footer order read through the row;
    `.ending-foot > button` → `.ending-foot button`), and the wave-10 strings table D2 row
    (`docs/plans/life-wave-10-strings-2026-09.md`; status kept `DRAFT` because `wave1011-strings-roundtrip`
    parses DRAFT rows only).
    Instrument finding: `fits.ts`' `availableWidth` returns the WHOLE viewport for this takeover (happy-dom
    cannot resolve `.ending`'s `var(--app-pad-x)` padding), so `assertInlineRowFits` reads «a 375px row» where
    the column is 343 – the new test subtracts the `:root` gutters itself; `fits.ts` is untouched.
- [x] **7. «The whole record - там какая-то ерунда в каждом season close написана, а еще с 2036
  начиная нет никаких титулов вообще»** – **7a** строка season close на странице полной летописи
  показывает ерунду – воспроизвести на его сейве, найти источник; **7b** титулы с 2036 отсутствуют –
  выяснить: данные (сейв не хранит) или рендер (экран читает не то поле). Класс: measure → build.
  - **B2 · [x] (07.10, sonnet, commit `01e8fb3f`).** Both halves were data the save already held; neither was a
    render bug. Both are derivation-at-read in `engine/world/album.ts`, and `buildScroll` stays a pure read: no
    stream drawn, nothing on `world` written (it sorts a local array, never `world.milestones`). The labels
    `Season close`, `Title`, `Final` and every detail string are untouched.
    **7a** – a Season close row reads `seasonHistory[season].byTrack[dominant].endRank` (`seasonCloseDetail`,
    `closeTrackOf`). The dominant table is `dominantTrackOfSeason`'s own rule run on the banked row – most matches,
    then points, the higher table on a dead heat – MIRRORED and not imported, because the live function reads
    counters the wrap resets. An unranked dominant table is silence (`null`), never another table's number;
    nobody played = the highest table she held a rank in (the banked twin of `activeLadderOf`); a season past the
    cap or a pre-v46 row (no `byTrack`, nothing recoverable) keeps today's `m.rank` line.
    **7b** – Title and Final rows come from `trophiesByTier`, one per week, detail `TIERS[tier].label`, merged with
    the other milestones and week-sorted BEFORE the season grouping; the `title` and `final` milestones leave the
    walk. One visible consequence: the `final` milestone also fires on a title week (`kidFinish <= 1`) while the
    cabinet's finals are LOST finals, so a first title prints `Title` alone where it used to print `Title` +
    `Final` on the same week.
    **His save (read-only, the architect's `r48-probe.ts`, after the change):** 2044 close `#1` (was `#71`; banked
    wta 97-11 #1), 2035 close `#3` (was `#79`; wta 66-13 #3), and 2036 shows its 4 titles (World Tour 500, 1000,
    500, 500; it showed 0). All 20 closes equal their dominant table's banked rank. The cabinet's 127 titles and 30
    lost finals are 127 Title and 30 Final rows (184 rows in all, every `week-label` UI key unique); all 14 title
    and 16 final milestones are cabinet weeks (11 of the finals on a title week) – nothing is lost.
    Evidence: `tests/r48-b2-scroll-truth.test.ts`, 15 arms – the 50-10 #4 / milestone 83 construction; matches
    before points; the dead heat on matches, then points, then the higher table; unranked dominant = silence;
    nothing banked = today's line (absent season, no season index, pre-v46 row); nobody played; PARITY on real
    wraps (two walked careers, 9+ wraps: the scroll equals the table and rank `lastSeasonSummary` banked at the
    same wrap, with a non-vacuity guard that the old line and the card disagreed in 3+ of them); 3 titles + 1
    final over two seasons with the old walk as the red control; a season with only a cabinet week; nothing prints
    twice; week order across tiers; the other milestone types row for row; real careers (every title/final
    milestone is a cabinet week, counts equal, keys unique); purity. Mutation-proven in a worktree, control 15/15
    green: detail back at `m.rank` RED 6, `>=` to `>` RED 1, points before matches RED 3, old walk RED 5,
    milestones walked beside the cabinet RED 3, no-`byTrack` fallback removed RED 1, nobody-played fallback
    removed RED 1, cabinet finals dropped RED 4.
    Targeted gates (verdicts read from files): the new file 15/15; 18 unit files / 473 tests (every pin-query hit
    plus the ending-view callers); `endings-bench` solo 4/4; 3 component files 28/28; `vue-tsc -b --force` clean;
    `engine-purity`, `map:world:check` (539 symbols, no new export) and `pins:check` ok. No pin needed re-aiming:
    nothing moved, and no test read the changed lines.
    Flagged, not touched: `albumBook.ts` `seasonCandidates` routes the album's season pages (first / best / held /
    recovery / down) on the same ITF `m.rank` – a routing read, never printed, but for a professional it routes on
    junior numbers; `diary.ts` prints `#N international` from it – labelled, round-17 #16's ruling, left alone.
    **A wording question for him (invariant 4 – asked, not changed):** the close line carries no table name, and
    the table can change between seasons – his 2031 is National #1, his 2032 is Professional #158 – so the number's
    scale jumps with it. A table word on that line would settle it; it is his copy.
- [ ] **8. «А и в самом альбоме тоже подложка не нужна, она лишняя и место ест, пусть он на весь
  экран будет, как и THE LAST PAGE по принципу»** – снять подложку-панель с экрана альбома,
  фуллскрин по механизму `bare` страницы (раунд 47 B1, экран концовки). Класс: build.

## Разбор до билдеров (архитектор, 07.10, зонд `r48-probe.ts` на его сейве)

**3b ПРОВЕРЕНО – посчитано корректно, расхождение по построению.** `careerTotals.prizeCents`
$40.56M – семейная часть призовых (100% до 18, дальше её доля растёт по `ECONOMY.kidShare`:
10% в 18, +5 п.п. в год рождения, половина с 26). Её счёт $321.12M кормят ТРИ ручья: её
призовая доля (`tournamentClose`), ВЕСЬ гросс её спонсорских чеков – семье с них идёт только
менеджерский процент (`sponsors.ts`, «the figure on the row is the parent's») – и её мерч-доля
(`phaseFinance`). Семья за карьеру заработала $429.33M (все категории вместе). Сравнивать
40.6M и 321.1M – сравнивать часть призовых с целым банком. Класс 3b = answer; 3a строится.

**3b-2 (после перерешения) – «сумма за все года, все расходы на теннис, включая всех тренеров»
ПРОВЕРЕНА, цифра честная.** `outlayCents` = все минусовые ряды карьеры с недели 0
(`ledger.ts:41`, каждая категория) МИНУС полка: стоимость держимых активов, стоимость проданных
(`soldCostCents`) и их обслуживание (руллинг 5 – дома/яхты «вообще не про теннис»). Внутри по
построению: coaching, staff, physio (все тренеры и специалисты), travel+vacation (поездки),
entry, facility, gear, stringing, academy (стадии подготовки), tuition. Сверка масштабом на его
сейве: последние 60 недель теннисных категорий = $0.79M – ровно темп $16.46M за 20 сезонов.
⚠ Банкованные посезонные `spentCents` суммируются в $133.27M – это НЕ опровержение: сезоны до
раунда 46 №8 банковались гроссом ВМЕСТЕ с полкой (фонд-депозиты, покупки), записи – «a record
of what was said», и его же утренний руллинг №7 (06.10) закрыл это «без миграции ок».

**7 ВОСПРОИЗВЕДЕНО, обе половины – и истина лежит в сейве, чинится задним числом.**
(a) Season close печатает `m.rank` = `world.kidRank` на неделе враппа – а это честно ITF-ранг
(его же комментарий в milestones.ts), т.е. для профи WTA – мусор устаревшей юниорской таблицы:
сезон 2044 (97-11, №1 МИРА) показан как «#71», 2035 (№3) – «#79». Истина банкована в
`seasonHistory[].byTrack[track].endRank`; доминантный стол выводится из банкованных W-L/points
тем же правилом, что `dominantTrackOfSeason`. (b) Титулы в свитке – милстоуны «первый за тир»
(идемпотентны по ключу), всего 14 строк; кабинет `trophiesByTier` держит ~125 титулов + ~30
финалов с неделями – 2036-й реально имеет 4 титула, свиток показывает 0. Строки Title/Final
свитка переводятся на кабинет (все недели), милстоуны-первинки этих двух типов из свитка
уходят (кабинет содержит их по построению).

## План: три бандла, последовательно, по поверхностям

| Бандл | Пункты | Поверхность (файлы без пересечений в один момент времени) | Бюджет |
| --- | --- | --- | --- |
| B1 | 3a, 4, 5, 6 | `EndingScreen.vue`, `RetirementDialog.vue`, `engine/ending.ts`, `engine/world/endings.ts` + их тесты | ~70 мин |
| B2 | 7 | `engine/world/album.ts` (buildScroll/scrollDetail) + тесты | ~45 мин |
| B3 | 1, 2, 8 | `albumPlacement.ts`, `components/album/*`, одна строка хоста в `EndingScreen.vue` (после B1) | ~80 мин |

Гейты – у архитектора, после каждого билдера и полным набором в конце. Голос №4 – по драфту
R47-S4 («You said one more year N times.», в леджере 47 помечен как his own reading – ровно
его «мы предлагали»); остальные четыре места – минимальный флип субъекта с сохранением формы
строки, все пять итоговых строк цитируются в outcome. Финальное (возрастное) предложение
«Nobody asked her this time. She said it herself» не трогается – оно действительно её.
