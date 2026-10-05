# Round 46 – the owner's playtest after round 45 merged, 22 items (05.10)

He played the merged build (round/45 went in as PR #164 the same day). The list mixes asset-card
UI, the year-summary popup, life-event presentation (a wedding happened with NO screen), an index-fund
cost-basis defect, two dev tools he wants for debugging, and one architecture question (a micro-LLM
in the browser). Item 16 says a save is attached – **no attachment reached the architect's session**;
item 20 explains he currently cannot export saves at all, which 20 itself is meant to fix.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

---

- [ ] **1. «Когда выбрали залистить айтем на продажу появляется кнопка withdraw выше sell на карточке
  машин. Предлагаю в один ряд сделать, а ещё, если случился list, то sell заменять на sell now и
  жёлтую. На карточке домов кнопки лежат одна сверху другой. Надо проверить во всех разделах и
  сделать одинаково.»** – split:
  - **1a** – listed-item cards stack `withdraw` above `sell`; put the two in ONE ROW, and make the
    layout identical across EVERY asset section (cars, houses, and whatever else sells: check the
    whole market surface). Class: **build**.
  - **1b** – once an item is listed, the `sell` button becomes **`sell now`** and turns **yellow**
    (his own copy and colour – the wording is his ruling, verbatim). Class: **build**.

- [ ] **2. «the weight дублирует the weight в настройках, надо второе переписать и может немного
  развернуть»** – two settings rows both read «the weight»; rewrite the SECOND one (he delegates the
  new wording – and «развернуть» = it may grow a few words of explanation). New string = DRAFT row
  for his blessing. Class: **build**.

- [ ] **3. «Похоже у нас такой же небольшой гринд на недвижимости есть: я только что продал первый
  дом за 332к, и мне предлагаю купить новый за 240к. На счёт инфляции на дома я ещё думаю, кстати,
  что ты думаешь на эту тему?»** – split:
  - **3a** – the housing grind: sell a house at 332k, be offered the next at 240k – the same class
    as round 45 #10 (the brand's 13,800). Measure the actual sell/offer spread and whether flipping
    houses is profitable grind. Class: **measure**.
  - **3b** – house-price inflation: he is still thinking and asks the architect's opinion. Class:
    **answer** (architect's recommendation, his decision).

- [ ] **4. «Альбом стал лучше, а давай ещё повернём немного вот этот цветной горизонтальный билет на
  на 5 градусов по часовой стрелке?»** – the coloured horizontal TICKET scrap in the album rotates
  +5° clockwise. Class: **build** (identify the exact scrap asset, rotate in the placement resolver,
  pin the value).

- [ ] **5. «На 29й день рождения она просила свой счёт в банке - это смешно. Давай наверное сделаем,
  что она будет где-то в адекватном возрасте и обстоятельствах его спрашивать? Может жёстко к 18
  привязать, например. Или, если можно раньше, то в коридоре 16-18»** – the own-bank-account birthday
  ask fired at 29. Gate it to an adequate age: his preference = hard 18, or a 16–18 corridor if the
  beat can naturally fire earlier. Class: **build** (find why it fired at 29 first – the fix must name
  the cause, not just clamp).

- [ ] **6. «Может для своей яхты тоже поставим -15% вероятности травмы?»** – «тоже» = something
  already grants −15% injury (find the existing owner of that bonus – presumably the own plane);
  mirror it for the OWN YACHT. Tuning change → measured, not guessed (invariant 5): bench arm or
  probe + spec note. Class: **build + measure**.

- [ ] **7. «Выигранный 1000 снимает сейчас 12 кондишина, и кажется, что 500 снимает ощутимо больше.
  Проверь пожалуйста»** – under the 02.10 tariff (500/1000/Slam all = 3) a WON 1000 drains 12 and a
  WON 500 seems to drain MORE – an inversion if true. Probe both with the drain probe; if confirmed,
  diagnose (draw sizes? match counts? run ladder?) and propose. Class: **measure**, then his word or
  an obvious fix.

- [ ] **8. «В попапе итогов года что-то странное с доход-расход, в расходы явно что-то лишнее
  попадает, а в доходах общее состояние и прирост не учитываются, надо исправить»** – the year-summary
  popup's income/expense split: something extra lands in expenses; income ignores net worth and its
  growth. Engine-UI parity class: find what the popup sums vs what the engine's own ledgers say.
  Class: **build**.

- [ ] **9. «А у нас где-то есть индикатор, что у неё есть отношения в данный момент? Может сделать
  что-то на личной странице или заменить after school, например, когда он станет неактуальным?
  С подсчётом сколько они уже вместе например или ещё что-то?»** – no current-relationship indicator
  exists(?); add one on the personal page – e.g. replace the stale «after school» block once it is no
  longer relevant, showing the partner and how long they have been together. He gave design latitude
  («или ещё что-то»). New strings = DRAFT rows. Class: **build**.

- [ ] **10. «На экране между матчами с большой картинкой немного съехала вёрстка в ширину и есть
  горизонтальный скрол, надо проверить и починить»** – the between-matches screen with the big
  picture overflows horizontally (horizontal scroll exists). Fix + a mounted no-overflow assertion at
  phone width. Class: **build**.

- [ ] **11. «И кстати, она объявит о свадьбе заранее (увидел, объявила, можно там тоже писать сколько
  они вместе, кстати, как вариант)? Или это от отношений и темперамента зависит? И поставим ли мы
  свадьбу в календарь? Картинка есть. Я дождался свадьбы, но самого экрана этого события не было!
  Подозреваю, что с похоронами то же самое и, возможно, с беременностью и родами тоже. Можно делать
  оверлей на весь экран, например.»** – split:
  - **11a** – does the advance wedding announcement depend on relationship/temperament, or always?
    Class: **answer** (read the code, tell him the actual law).
  - **11b** – put the wedding into the CALENDAR (the art exists). Class: **build** unless the answer
    to 11a changes the shape – the calendar entry follows the announcement.
  - **11c** – ⚠ THE DEFECT: he waited for the wedding and **no event screen appeared** despite the
    art existing. Audit ALL big life events – wedding, funerals, pregnancy, birth – which have art
    and which have a presentation moment; wire the missing ones as a full-screen overlay (his
    suggestion). Class: **build** (the round's biggest item).
  - **11d** – the announcement can also carry «сколько они вместе» (how long together) – shares the
    duration primitive with #9. Class: **build**, DRAFT strings.

- [ ] **12. «Надо проверить наш вординг на предмет дублей: "The one she married has something to say
  about this season / The one she married stayed back after the plates were cleared." The one she
  married повторяется дважды, давай может всё-таки напишем он, супруг, или вроде того. Мы за здоровые
  отношения.»** – the spouse feed card repeats «The one she married» in header AND first line.
  De-duplicate: pronoun / «her husband» forms. ⚠ Check first whether the phrase is deliberately
  gender-neutral (can she marry a woman?) – the replacement must survive the actual spouse model.
  New wording = DRAFT rows, his blessing. Class: **build**.

- [ ] **13. «Is there another year in this? - картинка съехала и голову обрезает»** – the
  season-decision screen's picture crops the head – same class as round 45 #7 (crop anchored too
  low). Find the screen, anchor the crop, pin it. Class: **build**.

- [ ] **14. «Индексный фонд не пересчитывается после изъятия почти всех денег и захода снова:
  "8131.90 units – bought at $9,969 each, $10,212 now / +$49,610,632 since you bought it (33%)" - я
  только пару недель назад зашёл на 80млн, они ещё не могли дать такой прирост»** – the index-fund
  cost basis survives a near-total withdrawal: after re-entering with 80M, «since you bought it»
  still claims +49.6M (33%). The basis must recompute on the re-entry (or the sell must realise the
  gain). Engine economy defect + tests over his exact scenario. Class: **build**.

- [ ] **15. «Эта фраза вылезла 2 раза с разницей в месяц или два (и вообще он очень разговорчивый и
  часто повторяется): "…The next tournament is half a world away. I knew the life I married into.
  Some weeks I would just like it nearer."»** – the same spouse line verbatim twice within a month or
  two, and the spouse talks too often overall. Add a no-repeat memory (and look at the overall
  chattiness rate). ⚠ Likely touches the save schema if lines-said must persist. Class: **build**.

- [ ] **16. «W11 2049 в календаре показали injured, на home injured walkover, но при этом пустили
  играть на w500 и далее выиграли 2 мачта, что-то странное было. Сейв во вложении»** – calendar said
  injured, home said injured walkover, yet she PLAYED the W500 and won 2 matches. ⚠ **The save did
  not reach this session** (and #20 says he currently cannot export saves at all). Hunt the
  injured-entry/walkover law in code + sim reproduction; ask him to re-send the save once #20 ships.
  Class: **measure/hunt**, honest status if not reproducible blind.

- [ ] **17. «А может быть нам какую-то микро языковую модель подключить для этих всех смолл токов
  можно (я знаю такие есть крохотные) и запускать прямо в браузере внутри приложения для генерации
  фраз и ответов? Это вообще возможно? Мне кажется это дало бы нам очень мощный буст вариативности на
  основе всех наших существующих фраз и всей истории уже сказанного ранее.»** – an in-browser micro
  LLM for smalltalk variability. Class: **answer** (the architect's feasibility analysis: size,
  offline-first, determinism law, voice control – with a recommendation and alternatives).

- [ ] **18. «Я нажал that's enough и снова увидел не наш красивый альбом, а набор детских фото и в
  конце 1 взрослую. Надо исправить, давать возможность посмотреть весь альбом и подумать какой вообще
  там флоу.»** – pressing «that's enough» (retirement) shows a legacy reel of childhood photos + one
  adult shot instead of the real album book. Route the epilogue to the full album and propose the
  flow. Class: **build** (+ the flow proposal in the report).

- [ ] **19. «Потраченные суммы на итогах снова не соответствуют действительности. А ещё там верстка
  пляшет. Можно миллионы сокращать до М, например и красиво все выстроить.»** – the summary's SPENT
  amounts are wrong **again** («снова» – check earlier rounds' ledgers; if a prior round reported
  this fixed, mark `[!]` REOPENED with what the first fix aimed at). Plus the layout dances; his
  formatting ruling: abbreviate millions to «M» and align. Same surface as #8 – one bundle. Class:
  **build**.

- [ ] **20. «Не могу сейв выгрузить кажется теперь никак из-за последнего экрана, у меня там много
  вопросов было на проверить. Может для служебных целей сделать там отдельную кнопку для сейва? Тогда
  я его смогу выгрузить на анализ»** – the final screen blocks reaching the save export; add a
  service export-save control reachable there (the ▶▶ 52 precedent: dev controls ship in every build
  by his ruling). Unblocks #16's save. Class: **build**.

- [ ] **21. «Если выбираем A daughter came later то имя точно не как у мамы должно быть мне
  кажется»** – in the epilogue's «A daughter came later» the daughter's name must never equal her
  mother's (the played kid's) name. Exclude it in the pick + test. Class: **build**.

- [ ] **22. «хотел дождаться, чтобы она родила, но так и не случилось - может быть в целях разработки
  можно в найстройках сделать переключатель, поднимающий шансы наступления этих событий в разы для
  отладки?»** – a dev settings toggle multiplying life-event hazard rates (pregnancy/birth and kin)
  for debugging. ⚠ Design with the RNG law in hand: sub-stream hazards only, MAIN untouched, dev-only
  surface. Class: **build**.

---

## Cross-references

- #3a is the round-45 #10 class (the brand grind) on a new asset class.
- #8 + #19 are one surface (the year summary) – one bundle, and #19 may be a REOPEN (audit first).
- #9 + #11d share the «how long together» primitive – build it once.
- #12 + #15 share the spouse voice/corpus surface – one bundle.
- #16 is blocked on a save that #20 unblocks – ship #20, then ask for the save again.
- #17 answers feed #15's design (the no-repeat memory is the non-LLM half of his variability ask).
- #18 + #20 + #21 live on the epilogue surface – one bundle.
