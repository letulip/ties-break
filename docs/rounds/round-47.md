---
type: round
status: current
area: delivery
last-reviewed: 2026-10-06
---

# Round 47 – the ending screen and the album, off the double merge, 16 items (06.10)

Both round 46 and the succession wave merged this morning (PR #165/#166); he played the fresh
build the same afternoon to the END of a 20-season career (№1, 127 titles) and sent: 16 items, a
Moto screenshot of the LAST PAGE (the ending screen), two SVG icons from svgrepo (crossed
racquets, a tennis ball) for item 16, and – through round 46 #20's own dev button – the FULL
career save `tennis-sim_alice-prologue-pmb8nzwh_w1037.tsave` (80 KB, week 1037) for item 13's
deep analysis. The save and icons sit in the architect's scratchpad; the icons enter the repo
with item 16's build.

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

---

- [x] **1. «на этом экране надо убрать обертку-подложку, на которой весь контент лежит, мне кажется
  она там не нужна, как раз освободится немного места горизонтально.»** – the ending screen's card
  wrapper (the backing the whole content sits on) goes; the content takes the freed horizontal
  space. Class: **build**.
  - **B1 · SHIPPED – the wrapper was the GLOBAL `section` rule, not anything in `EndingScreen.vue`.** `style.css:1369` paints EVERY
    `<section>` as a panel (the panel colour, a 1px line, `--tb-card-pad` + 2px = 16px of padding), and the last page's
    `section.ending-album` was one: the content lay on a card 17px inside the takeover's own 16px gutter on each side – 309px of column at
    375, the screenshot's ~15px indent. The page is `bare` now – the app's existing opt-out (the Season strips use it): **343px at 375 (+34),
    288 at 320**, nothing clipped; the takeover's own `--celebration-bg` ground is untouched. ⚠ The record layer (`.ending-scroll`) and the
    book layer (`.ending-book`) are the same panel and were NOT touched – he asked about the last page; one `bare` each if he wants them
    flat too. (A first attempt cut the takeover's side gutter 16 → 8px before the real rule was found; it was reverted, nothing of it
    ships.) Tests: `tests/component/r47-b1-ending-figures.test.ts` #1 (×2 widths). Mutation: take `bare` off → RED ×2.

- [x] **2. «цифры миллионов я просил сократить до 40,5М 254,3М и т.д.»** – REOPENED: round 46 #19
  ruled the M-abbreviation and B5 shipped `formatCentsCompact` – but wired it into the SEASON
  summary popup only; the ENDING screen's figures (the screenshot: $40,563,980 …) never got it.
  The first fix aimed at the popup he named then; this screen is the second surface. ⚠ His example
  spells «40,5М» with a DECIMAL COMMA – the shipped form is «$40.6M» (dot, the app's locale);
  wire the existing form here, flag the comma question in the report. Class: **build**.
  - **B1 · SHIPPED – every money figure on the page goes through `formatCentsCompact`:** `$40.6M`, `$254.4M`, `$321.1M`, `$269.5M` on
    his own figures; below $1M exactly what it was (`$735,472`). Six places: the four grid rows plus the two notes that carry money (the
    academy's weekly income, the lifetime deal – `$2.5M a year`). Labels byte-identical. ⚠ FLAGGED FOR HIM: his example spells
    `40,5М` – decimal COMMA, Cyrillic М and TRUNCATED (40.56 → 40,5); the shipped form is the app's dot and ROUNDS (40.56 → 40.6, 254.38 → 254.4).
    Both are number formatting rather than wording; a comma/М spelling would be a locale decision inside `shared/money.ts`, his call.
    Tests: `r47-b1-ending-figures` #2 (×3) + two re-aimed arms (`round46-the-reckoning`, `r39-lifetime-letter`, dated notes naming this item).
    Mutation: long form → RED ×6.

- [x] **3. «цифры трат снова гросс и не пересчитаны, мы туда вроде собирались записывать сколько
  было именно на теннис потрачено»** – REOPENED, the reckoning class: the 18.09 reckoning
  (`careerMoney`, `isHoldingCategory`) was supposed to make the career totals consumption-only,
  and round 46 B5 fixed the SEASON fold – yet the ending screen's SPENT ($254M beside a $269M
  portfolio) reads gross again. Diagnose what this screen actually sums (which reader, which
  categories), then make it the tennis-consumption figure he asked for. Class: **build** (diagnose
  first, the fix must name the reader that lied).
  - **B1 · SHIPPED – DIAGNOSED ON HIS OWN SAVE FIRST; the reader that lied is `careerMoney` (engine/world/reckoning.ts), not the screen.**
    The page printed `view.money.outlayCents` all along (the screen was already in parity); the fold behind it read
    `spentCents − heldCents − upkeepCents`. Decoded through the app's own codec (the `…_w1037.tsave` he sent): gross spent $428,692,101 −
    held $163,296,852 (16 shelf rows) − upkeep $11,011,692 = **$254,383,557** – his $254M. **$237,928,148 of it (93.5 %) is the cost of units
    the family had already SOLD back out of the index fund ($69,590,851) and the deposit ($168,337,297)**: `sellAsset` takes the sold part's
    cost out of `paidCents` (so `heldCents` stops excusing it) and leaves it inside `spentCents`, while the proceeds go to `earnedCents` –
    right for a car that lost value, wrong for a fund the family used as a till (buy, sell, rebuy, for twenty years). The two other candidates
    were ruled out: there is ONE reader (`careerMoney` feeds the screen, album slot 6, the break-even gate and the fork card), and his career
    is new enough to hold no pre-reckoning rows. FIX: a fourth term, `soldCostCents` = Σ `realisedCostCents` of the rows still held
    (persisted since round 34 #15 – **schema zero, RNG zero, no new state**); `outlayCents` excuses it; the identity gains `+ soldCostCents`
    and is proved again. **His career now reads $16,455,409** (the last sixty ledger weeks of the same save carry $0.78M of tennis outflow –
    about $0.7M a year, the same order). A reader fix also reprints his FINISHED save correctly the day it ships (the ending view is folded on
    every read). ⚠ NAMED RESIDUAL – the figure is an UPPER bound: a WHOLE sale deletes the row and a top-up at least as big as the holding
    clears its memory (shop.ts), so those round trips stay inside «Spent» (pinned, so it can be seen moving). The EXACT answer is what he
    literally asked for – he wrote that we were going to RECORD the tennis spend – an accumulator at `accrueFinance` for every non-`'shop'`
    outflow: a SCHEMA move, FLAGGED FOR THE ARCHITECT, not done (brief: schema zero). Gates: `condition.test.ts` (the frozen capture) and
    `round46-season-money` green, `round46-career-money` green with three new arms. Tests: `tests/round46-career-money.test.ts` (round-47
    describe: a round trip moves nothing and the four-term identity; a family that never sold reads byte-identically; the whole-sale residual)
    + the parity arm in `r47-b1-ending-figures` #3. Mutation: drop `− soldCostCents` → RED (engine arm) and RED (screen arm).

- [x] **4. «верстка все еще едет и цифры скачут»** – REOPENED for THIS surface: round 46 R5's
  label|figure grid fixed the season popup's dance; the ending screen's figure grid still jumps.
  Rebuilt together with #5/#7's typography pass. Class: **build**.
  - **B1 · SHIPPED – the dance was a column COUNT.** The old list was `repeat(auto-fit, minmax(84px, 1fr))` in a 460px-max `dl`, so WHICH
    figures shared a line changed with the width (3+3+2 at 375, other splits at 360/390/430) and the page re-flowed under his thumb. Now the
    money rows are a `minmax(0, 1fr) auto` label|figure grid whose row wrappers are `display: contents` (round 46 R5's idiom): the figure column
    is as wide as the widest figure, the label wraps in its OWN column, and the grid string is identical at 320/375/430 (asserted). The facts
    are `repeat(3, minmax(0, 1fr))` at every width. Tests: `r47-b1-ending-figures` #4 (the idiom ×3 widths, fit ×2) + the re-aimed
    `round46-the-reckoning` arm (it pinned `auto-fit` – the dance itself). Mutations: auto-fit back → RED ×2; wrappers as boxes → RED.
    ⚠ NOT SEEN IN A REAL BROWSER – happy-dom computed-style + the fit helpers only; no ending-state session was available inside the budget.

- [x] **5. «best rank, titles и seasons лучше в одну строку, наверное сделать и тоже крупнее и
  Sora, жирнее»** – the three career facts become ONE row, larger, Sora, bolder. Class: **build**.
  - **B1 · SHIPPED – best rank, titles and seasons are ONE row of three equal columns, in the order he named them** (Best rank · Titles ·
    Seasons; the page used to read Seasons · Best rank · Titles – `round46-the-reckoning`'s order pin re-aimed with a dated note), 30px, Sora,
    700. At 320 each tile is ~96px and the widest figure ("#127"-class) takes a third of it (asserted ×2 widths). Mutation: two columns → RED.

- [x] **6. «чем отличается still owned от family's protfolio? кажется можно одно лишнее убрать»** –
  what is the difference between the two figures ($268,755,069 vs $269,490,541 on his screen)?
  Diagnose the two readers; if one nests inside the other, remove the redundant row (his lean);
  if they are genuinely different, answer with the numbers and the one-sentence difference.
  Class: **answer → likely build** (remove one).
  - **B1 · SHIPPED – the answer, with his numbers: NESTED, so the redundant row left.** `holdingsCents` = the shelf at value;
    `portfolioCents` = `fundsCents + holdingsCents` = the wallet PLUS the shelf. His screen: $268,755,069 vs $269,490,541 – they differ by
    **$735,472, exactly the wallet** (probe: funds $735,472). So «Still owned» said strictly less than «Family's portfolio» and is gone; the
    portfolio is the line ruling A of 18.09 asked for and is the more complete, so it stays. The engine's `holdingsCents` stays on the wire (the
    season popup reads it) – the screen just does not print it. Re-aimed with a dated note: `round46-the-reckoning` (it pinned the row present).
    Mutation: put the row back → RED.

- [x] **7. «для цифр жирный шрифт, крупнее размер и Sora на этом экране»** – every figure on the
  ending screen: bold, larger, Sora. One typography pass with #4/#5. Class: **build**.
  - **B1 · SHIPPED – every figure is Sora (`--font-heading`), weight 700, larger:** the seven grid figures (money rows 22px, the three facts
    30px – both were 16px, regular) AND the numbers inside the three notes (`<b class="ending-fig">`, 1.15em of the 14px prose; the sentences'
    text is byte-identical – `She said one more year 5 times.` is asserted verbatim). One `.ending-fig` rule carries face, weight and tabular
    figures. Test: `r47-b1-ending-figures` #7 (ten figures at once). Mutation: body face → RED.

- [x] **8. «в альбоме горизонтальный билет повернулся - ок, но надо его ниже опустить, он на
  некоторых страницах перекрывает много букв наверху. И давай его на 10% меньше сделаем заодно.
  Еще на этом билете дублируется Champion, давай только рукописный оставим. И еще на нем Row, Gate
  давай везде в одну строку писать, а то где-то в две получается»** – four ticket asks: (a) lower
  it (it covers top-of-page letters on some sheets – the exact overlap B12 measured and parked;
  his eye has now ruled); (b) −10 % size; (c) the duplicated «Champion» – keep only the
  HANDWRITTEN one; (d) «Row …, Gate …» always ONE line. Class: **build**.
  - **B2 · SHIPPED – 8a + 8b: the pass is drawn at ×0.9, hangs from its TOP-LEFT corner, and sits lower.** `AlbumLayoutB.vue`:
    `transform-origin: 0 0; transform: translateX(4px) rotate(5deg) scale(0.9)`, `bottom: 34px` (was 48), `min-height: 121px`. The +5° is
    round 46's, untouched. THE ARITHMETIC (400px frame, h = 121, θ = 5°): turned about the centre, the top-left corner lifts
    (w/2)·sin θ − (h/2)(1 − cos θ) = 17.43 − 0.23 = **17.2px** above the frame (Chromium: 16.84 – AABB top 284.16 against a box top of
    301); at −10 % and the same centre origin it would still have lifted (360/2)·sin θ − … = 15.7 − 0.2 = 15.5px. About the TOP-LEFT corner
    the lift is **0.00**: the highest corner IS the frame's top-left and the rest of the pass turns DOWN – the right end drops 360·sin θ =
    31.4px, the leaning foot goes out 0.9·121·sin θ = 9.5px (hence the 4px `translateX`: 16.5px from the page edge, round 46's ≥ 15px margin
    kept). Chromium on the real layout-B sheet, all four steps: AABB top **315.00** = the frame's y, bottom 454.86 (15.1px from the page
    edge – 34px is the lowest anchor that keeps round 46's margin for the tallest pass), left 16.5, right 384.6.
  - **B2 · FOUND – the overlap was not only the lift: `passBox`'s height table was STALE.** It held 97 (lower steps) / 121 (upper); the real
    pass measured **115 / 121 / 134px** in Chromium over all 16 rungs × 6 stages with the widest row and seat (Row/Seat broke in two on every
    one, a long stage broke in the stub, a long title broke). On the lower steps the box stood 18–37px ABOVE the resolver's frame before it
    was even turned. Now the pass is ONE height (natural 100.8–120.6px, `min-height` 121) and `passBox` says so: frame y 315 / h 121 for
    every ticketed sheet; a ticketless sheet draws no pass and keeps round 45's 97px edge (reserving the new frame there shrank windows for a
    pass nobody draws: 25 of 67, over the guard).
  - **B2 · THE RESOLVER'S SWEEP, MEASURED** (335 sheets, `tests/round45-album-placement.test.ts`; the control is HEAD's `albumPlacement.ts`
    through the SAME test body): photograph windows at a shrunk rung – B **18 → 22 of 67** (the guard's ceiling is 22: green AT the ceiling,
    zero slack, thresholds untouched), C 29 → 29 of 121, A 0 → 0 of 147; hero covered 0 → 0; the B6-knob floor (≥ 40) 42 → 46. The four extra
    B sheets are the honest price of a frame that is finally the pass's size. 24 of 24 green; the unit mirror test now reads a ticketed
    sheet and holds the page's `min-height` against `PASS_H`.
  - **B2 · SHIPPED – 8c: «Champion» printed twice because the template printed `ticket.stage` TWICE** – the title
    (`{{ ticket.tier }} {{ ticket.stage }}`, display face) AND the stub (`.album-pass-stage`, `--font-hand`) – for EVERY stage, not only the
    champion's. WORDING, before → after, exactly: title `World Tour 1000 Champion` → `World Tour 1000`; the stub's handwritten `Champion` is
    unchanged. The removal applies to every other stage (`Final`, `Semifinalist`, `Round of 16` …): the duplication was structural and
    «Champion» is the one he saw – ⚠ if he wants the display-face stage back on the non-champion tickets that is one line in the template.
  - **B2 · SHIPPED – 8d: «Row …» is ONE line, and the stub grew 116 → 134px so it can be.** Measured in Chromium: the stub's Row/Seat line
    (flex, 90.5px text box) broke in two on ALL 96 passes of the survey («ROW / 30», «SEAT / 30D»); the Date/Gate line never broke (101px
    spare). The widest pair the engine can deal («Row 30» 45.25 + «Seat 30D» 55.95 + the gap) is **105.2px**, so `white-space: nowrap` ALONE
    would have run it off the ticket's edge: the stub is 134px (3.8px spare) and the gap 4px (was 8). Re-measured: 0 of 96 wrap, 0px overflow.
    Both lines are `nowrap` on the element and on its spans.
  - **B2 · FOUND, NOT TOUCHED (not asked):** the handwritten stage is wider than the stub for the longest words. At the old 116px `Semifinalist`
    ran 18px past its box (6px beyond the ticket's edge, clipped) and `Quarterfinalist` 38px (26 clipped); at 134px `Semifinalist` fits (0) and
    `Quarterfinalist` is 20px over – **8px of its last letters still clipped**. A smaller hand size or a longer stub for that one word is a design call.
  - **B2 · TESTS (all green):** `round46-album-pass-tilt` (rewritten, 24: +5°, ×0.9, TOP CLEARANCE, its own non-vacuity check, ≥ 15px page margin, the
    page/table mirror – each × 4 steps), `r47-b2-album-ticket-patch` 16 (8c × 6, 8d × 5, 16 × 5), the 335-sheet sweep 24, `albumBook` +5. Mutations
    (applied, run, restored byte-identical): rotate 0° → 4 red, −5° → 8, 25° → 8; scale(1) → 8; centre origin → 4 (the clearance arm, on all four steps);
    min-height 118 → 8 + the unit mirror 1; **the pre-fix geometry** (`bottom: 48px`, `rotate(5deg)` about the centre, no scale) → 12 red; title back
    to tier + stage → 6; nowrap removed → 4; stub 116 → 1.

- [x] **9. «в альбоме очень крупные заголовки на страницах, можно чуть уменьшить, а еще иногда у
  этих заголовков оверлап с написанным на странице случается, что тоже странновато, вроде место
  есть. Если надо детально каждую страницу альбома разобрать - скажи, я сделаю»** – album page
  headings: slightly smaller, and the heading-vs-content overlap fixed (the resolver has room –
  find why it still collides). His offer of a per-page breakdown stays in reserve if the sweep
  cannot localise it. Class: **build**.
  - **B3 · SHIPPED – 9: THE HEADING IS ONE STEP SMALLER, AND THE OVERLAP WAS ONE CLASS – FOUND IN REAL CHROMIUM BEFORE ANY CODE.**
    * THE SIZE (`AlbumSheetTitle.vue`, layouts A and C – B has no heading): the chapter's name **44 → 38px** (×0.86), the «– Chapter N» kicker 19 → 17, the years line 21 → 19, the gaps
      4 / 8 → 3 / 6: the whole block **96 → 83px** tall (measured). Sizes only – no word changed.
    * THE OVERLAP, MEASURED (Chromium, phone width, Caveat loaded; the 335 sheets of the 48 posed careers; the real text boxes of all three heading lines against the real box of every
      photograph, caption, note, loose line, patch, tag, pass and doodle): **layout A 0 of 147, layout B has no heading, layout C 121 of 121** – the years line («Age 18 – 22») lies UNDER the hero
      photograph, its whole width, 25.9px tall; the old page does not show it at all. «Sometimes» is A and C alternating. It is NOT a note, a caption or the loose line (0 hits of any of them).
    * THE CLASS: a photograph's SLOT is a table entry (`LAYOUTS`), and the resolver only ever moved a note and a loose line – C's hero slot began at y 100 while the title block reserves y 26..122,
      and nothing compared the table with its own furniture. THE FIX IS IN THE TABLE (the `passBox` lesson): `HEAD_H` = 83, the number the CSS renders, and C's hero hangs `HERO_GAP` (5px) under
      that box (y 100 → 114) with its window giving the pixels back at the BOTTOM (196 → 182 – it still ends at y 300), so the note strip, the second photograph and round 45's counts sit where
      they were tuned. `headBox`'s width estimate is 14.7px a character at 38px (Chromium: 181.2 / 141.7 / 233.4 / 111.8 / 224.1 for the five names; never under, at most 15 % over).
      AFTER: Chromium **0 of 335**, the resolver's frames **0 of 335**, and the corpus's longest note, caption and loose line under all five names on A and C: 0.
    * ⚠ THE LIVE NET FOUND A SECOND, SEPARATE THING: the mounted round-45 sweep went red on the crowded C sheet by 0.0006px once the smaller heading let the resolver find a BETTER solution there
      (hero window at rung 0.76 instead of 0.68, the widest note exactly `GAP` from the second photograph's caption) – the page drew that note 186.0006px wide because `noteSpot` rounded the laid-out
      width UP to the hundredth. Fixed at the cause: rounded DOWN, so the page never draws wider than the resolver reserved; the one pin that states the rounded value (`'226.83px'` in
      `tests/round45-album-placement.test.ts`) moves to `'226.82px'` with it – a pin of what the string IS.
    * NUMBERS (round-45 sweep, `placeSheet` at HEAD vs now, the same 335 sheets): windows at a shrunk rung **A 0 / B 22 / C 29 – identical before and after** (B at its 22 ceiling with zero slack,
      UNCHANGED; C 29 of its 35; A 0 of 10); hero covered 0; stack-below 0; no sheet changed its scale. A note or a loose line sits elsewhere on 108 A and 24 C sheets – the smaller box frees
      room, so they are nearer where they were drawn.
    * TESTS: `tests/r47-b3-album-headings.test.ts` (the sizes in the CSS; their sum = `HEAD_H`; the five-name width estimate against Chromium; the table arm – every photograph slot of A and C
      starts below the box, leaning included; the 335-sheet arm, incl. «the OLD numbers collide on every C sheet and on no A sheet»; the worst words × five names), `tests/component/r47-b3-album-filler-cup.test.ts`
      §heading (computed 38 / 17 / 19 on A and C). MUTATIONS (each on the real file, restored byte-identical): name 38 → 44px → 2 red (unit) + 1 (mounted); **the PRE-FIX TABLE (`HEAD_H` 96 + hero y 100) →
      5 red, the sweep says «121 of 335 sheets collide with their heading»**; hero back to y 100 alone → 4 red (121 of 335); `HEAD_CHAR` 14.7 → 12 → 1 red; `noteSpot` floor → round → the two mounted
      round-45 tests red again + the unit pin.
    * HIS PER-PAGE OFFER STAYS UNUSED: the sweep localised the class. If a page still looks wrong to him, the Chromium harness (a throwaway page that mounts the real `AlbumSheet` for every sheet of the 48
      careers at 390px and intersects the text boxes – not committed) can be re-run on any page he names.

- [~] **10. «фраза she played until she was done звучит довольно странно как мне кажется. У нас
  разные вариации этой фразы или одна на всех?»** – is the ending title one-per-ending-kind or
  one-for-all? Answer with the real table (nine kinds have nine titles – name which kind produced
  his), then DRAFT alternatives for THIS title for his blessing. Class: **answer + DRAFT**.
  - **B1 · ANSWERED + DRAFTED (nothing wired).** ONE PER KIND, not one for all: `ENDING_TITLE: Record<CareerEndingType, string>`
    (engine/ending.ts:1169) has nine entries – stopped «She stopped after school», college «She went to college», bankruptcy «The money ran out»,
    injury «The body stopped first», **natural «She played until she was done»**, plateau «She had gone as far as she was going», peak «She left
    at the top», fall «She stopped after the fall», family «She did not go back» – and a parallel nine-line `ENDING_BLURB`. WITHIN a kind there
    is exactly one (no variation), so every career that ends the age way reads his sentence; his №1 career latched `natural`. On the page it
    reads in place as «She played until she was done – 41, and nobody had to ask her.» (the detail follows the title, engine/ending.ts:767), so an
    alternative has to survive that tail. DRAFT alternatives, R47-S1…S3 below. If he wants SEVERAL variants per kind (his variability law) that is
    a corpus of its own – a separate ask.

- [~] **11. «she said one more year 5 times - а разве это она говорила, а не я?»** – who says «one
  more year» in the fiction? The retirement dialog asks the PARENT; the line credits HER. Read the
  mechanic's framing, answer honestly, and DRAFT the corrected subject if the line mis-attributes
  his choice. Class: **answer + DRAFT**.
  - **B1 · ANSWERED + DRAFTED (nothing wired).** He is right about the BUTTON and the engine knows it. The retirement card asks the PARENT:
    «One more year» is a button the player taps (`answerRetirement(world, false)`, which is what `oneMoreYearCount` counts – his taps). The
    engine then writes the words in HER voice everywhere: the diary «One more year, she said. Same as last time.» (world/endings.ts:1236), the
    note under the button «The same answer she gave last winter.» (RetirementDialog.vue), the plateau lede (ending.ts:709/730), `lastWordLine`
    (ending.ts:654) and – a TEMPLATE string, not engine copy – this page's «She said one more year N times.» (EndingScreen.vue). The design's
    own comment says the card's subject is that the decision is hers; the control says it is his. Only the FINAL (age) offer is truly hers –
    «Nobody asked her this time. She said it herself» – and it has no refuse button. So the page line credits her with HIS count. DRAFTS
    R47-S4…S6 below; if he blesses a subject, the same flip is owed at the four engine/dialog sites above (a copy wave, his words first) – none
    touched here.

- [x] **12. «the whole record в самый низ под кнопки поставь пожалуйста, ниже только export save
  останется»** – «The whole record» moves to the very bottom, under the door buttons; only
  «Export save (dev)» stays below it. Class: **build**.
  - **B1 · SHIPPED – the footer reads: View the album, the doors (Raise another / the line door), «The whole record», Export save (dev).** The
    link moved from between the notes and the pills to under BOTH doors; only the dev export is below it and the export is the last child. Label
    unmoved. Tests: `r47-b1-ending-figures` #12 (DOM order) + two phone-law cases (the takeover still scrolls; every control reachable at 375×667
    and 320×568 – `assertDismissReachable`, `setViewport` before the mount). Mutations: link back above the doors → RED; `.ending` no longer
    the scroller → RED ×2.

- [x] **13. «и вот весь сейв, разбирай. меня интересует всё: травмы, перформанс, как отработали
  помогающие специалисты, как и с какой скоростью она деградировала и т.д.»** – the full-career
  deep read: injuries (count, severity, timing, cost), performance arc, what each support seat
  actually delivered over its tenure, the decline curve and its speed, plus whatever the data
  volunteers. A probe tool decodes the .tsave through the app's own codec and the report reads
  like a scout's dossier. Class: **measure** (architect-led).

- [x] **14. «и еще по альбому: я увидел, что мы сделали хорошую вариативность по страницам, давай
  усилим. У нас есть фотки, где она дома отдыхает, есть где на отдых ездила - их тоже можно
  небольшие добавлять на те страница, где убрали горизонтальный билет или боковую бирку, чтобы
  пустоту немного заполнить, а остальном хорошо.»** – more sheet variety: the existing rest-at-home
  and vacation artwork joins as SMALL photos on sheets that carry no ticket/side tag, filling the
  gap. Class: **build** (composition + the placement resolver).
  - **B3 · SHIPPED – 14: A SMALL TAPED SNAPSHOT OF HER RESTING OR ON HOLIDAY HANGS IN THE GAP A TICKETLESS OR TAGLESS SHEET LEAVES.**
    * WHICH SHEETS: a sheet with no ticket, no tag AND no patch – layout B or C with no tournament on it (A always wears the patch). In the 335-sheet sweep that is **43 sheets (B 8 of 67, C 35 of 121):
      before, 0 carried a snapshot; now 43 carry one and 43 are drawn – 0 skipped for lack of room, 0 for the guard**. In Chromium: 43 rendered (B 8, C 35), **0 overlaps** with any other element.
    * WHICH PICTURES – THE HONEST SUBSET, from `public/images/weeks/`: HOLIDAY = the six `vac-*` paintings the family budget already shows (`VACATION_ART`: camping, elite, friends, resort, sea, village – the
      test holds the set equal to the app's own); REST = the three `off-1/2/3` off-season paintings (a fire and a window, a frozen lake, a warm court) + the week she rests a knock at home, which the app paints
      in two ages (`chores-young` for the young band, `chores-teen` for every later band – `weekHomeBand`'s own split). LEFT OUT, and why: `study-*` (the exam fortnight is not rest), `training` (it is
      training), the sleepy journey set `…-sleepy-*` / `…-travel-sleepy-*` (it is the §4 ladder's own rung for an AWAY week and already appears as a frame – a ticketless sheet is not a journey; it also carries
      a stray corner mark), and the whole PROLOGUE chapter (the child's chapter: a grown woman's holiday would be somebody else's childhood).
    * WHICH KIND, FROM A TABLE THAT ALREADY EXISTS: the sheet's own mood (`ALBUM_MOOD` of its lead occasion) – a happy page gets a holiday picture, every other page a quiet day at home – and NEVER on a page
      that has its own painting or is the book's last word (kinds `lineage`, `prologue`, `wedding`, `birth`, `closing`). The ERA is the band (young → `chores-young`, later → `chores-teen`).
    * THE PICK IS A WALK, NOT A ROLL (`albumFillerFor`, B2's `albumPatchFor` idiom): the k-th snapshot of a pool in the book is `pool[(start + k) % size]`, `start` being the career's ONE existing flavour draw
      (`${seed}:album:flavour:patch`, the same key and the same single draw it has always made – now read by `flavourStartOf`), so a pool never repeats a picture until it has shown them all. **No new key and no
      new draw: `tests/life-beat-keys.test.ts` did not move.** Across the sweep the snapshots use 10 of the 11 pictures (`chores-young` needs a young-band sheet with no tournament, which the posed careers lack).
    * WHERE: a POST-PASS IN THE RESOLVER (`placeFiller`) – it runs AFTER the photographs, the note and the line are settled and moves none of them. B: a 128×88 card in the strip the boarding pass would hang in
      (`passBox` has always reserved it on a ticketless sheet), right to left; C: a 100×84 card in the column the tag would hang in, from beside the hero's middle down. It takes the first spot that touches no
      card, caption band, note, loose line or piece of furniture, and a sheet with no such spot goes without. **THE GUARD, AS AN ASSERTION: with and without the snapshot every photograph, note, line and scale is
      identical on every one of the 43 sheets – so B's 22 ceiling (zero slack) cannot move because of it, and did not** (A 0 / B 22 / C 29, the numbers under item 9).
    * ZERO NEW STRINGS: no caption, and `alt=""` – decorative, `aria-hidden` (`AlbumFillerPhoto.vue`, a taped small `Polaroid`). ⚠ FLAGGED: a describing alt would be a string, i.e. a DRAFT for his pass; none was written.
    * RNG: derivation only – MAIN untouched, the frozen capture untouched (no engine MAIN code was touched), nothing persisted (the book is a view; `SAVE_SCHEMA_VERSION` untouched).
    * TESTS: `tests/r47-b3-album-filler.test.ts` (pool files on disk; holiday set = `VACATION_ART_STEMS`, rest = `WEEK_ART`'s off-*; none of study / training / journey; the kind table over the whole corpus;
      the walk from any start; the sweep: carried only on no-ticket / no-tag / no-patch B or C sheets, the guard assertion above, drawn inside the page and inside its frame touching nothing; a crowded gap whose first
      spot is taken by the portrait's long caption), `tests/component/r47-b3-album-filler-cup.test.ts` (mounted on B and C: position = the resolver's answer, `src` base-prefixed, `alt=""`, `aria-hidden`, crop
      `80% 40%`, no caption; not drawn on A, not beside a drawn ticket or tag, not when the sheet carries none). MUTATIONS (restored byte-identical): the snapshot nudges the scale → 1 red; photographs not
      obstacles → 1 red; eligibility ignores ticket / tag / patch → 2 red; no walk → 1 red; NEVER kinds ignored → 1 red; a drawn ticket / tag ignored → 1 red unit + 1 mounted; layout B / C stops drawing it →
      2 / 1 red; `alt` a string → 2 red; crop `50% 50%` → 2 red.
    * LOOK (Chromium screenshots): a small taped print dropped in the empty strip / column; the crop `80% 40%` keeps her in view on the wide paintings (she sits right of centre in all of them).

- [x] **15. «иконка кубка у нас есть хорошая, используй ее пожалуйста вместо этого текущего немного
  странного кубка»** – find where the «странный кубок» renders (the album's trophy scrap /
  trophies surface) and swap it for the good existing cup icon. Class: **build** (locate both
  first; name them in the ledger).
  - **B3 · SHIPPED – 15: THE ALBUM'S CUP IS THE APP'S OWN CUP ICON.**
    * THE «СТРАННЫЙ КУБОК» (located): the `trophy` marginalia doodle – `PATHS.trophy` in `src/components/album/AlbumDoodleMark.vue`, a hand-drawn pen cup that `DOODLE_BY_KIND` (`albumBook.ts`) puts on title and
      rare sheets. Why it looked odd: its stem ended at y 17 while its base sat at y 20 – a floating foot, 3 units of nothing between them. It is the only cup in the album kit (a grep of
      `src/components/album/`, `albumBook.ts` and the protocol for cup / trophy / 🏆 finds the doodle and its type, nothing else).
    * THE «ХОРОШАЯ» ONE (located): `public/icons/trophy.svg` – the Trophies tab icon and the «Winner points» tile (`AppIcon name="trophy"`: `App.vue`, `NextTournamentPanel.vue`, `TournamentFlow.vue`). The tier
      paintings `public/images/trophies/*-gold|silver.webp` are a different object (per-tier paintings, not an icon) and are not used here.
    * THE SWAP: the doodle now draws that file's own path, `M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 14v6`, on the same 24-grid, in the doodle's own pen (stroke 1.15, the
      ink and the 0.78 opacity of the other five marks). ⚠ ONE CHOICE FOR HIM: the pen WEIGHT is the doodle system's (1.15), not the icon's own 1.8, so the cup reads as that icon drawn lightly beside its five
      siblings; his icon's own weight is a one-line `stroke-width` rule for the trophy mark if he wants it bolder.
    * TESTS: `tests/component/r47-b3-album-filler-cup.test.ts` §cup – the mounted doodle's `d` equals the `d` read out of `public/icons/trophy.svg`, alone and on all three layouts; the old cup's drawing is in no
      file of the album kit; the other five marks' paths are untouched. MUTATION: the old path back → 2 red.

- [x] **16. «whitegate club и саму бирку тоже можно сделать по аналогии с билетом разными цветами и
  с разными названиями вымышленными, иконка на эту бирку со скрещенными ракетками во вложении, или
  можно еще иконку мячика использовать, тоже во вложении»** – the album's side TAG goes the
  ticket's way: colour steps + FICTIONAL club names (new strings → DRAFT rows; the fictional-names
  law holds – nothing real constructible), with his attached crossed-racquets icon (or the ball)
  on the tag. Both SVGs enter the repo with this build. Class: **build**.
  - **B2 · SHIPPED – 16: THE CLUB PATCH IS A STEPPED FAMILY.** ⚠ WHICH OBJECT: «Whitegate Club» is the club **PATCH** – `AlbumPatch.vue`, the crest on
    layout A's opener, `sheet.patch`; its name was one of six in `PATCH_POOL`, drawn ONCE per career, so every opener wore the same cloth and the same
    club – and NOT the baggage tag (`AlbumTagCard.vue`, layout C), which already has colour steps and the tournament's name. The patch already carried two
    CSS-ellipse racquets; his icon replaces them. `AlbumSheetModel.patch` is `{ name, step }` now (`AlbumClubPatch`, protocol/album.ts).
    * THE NAME is derived, not rolled: the career's ONE existing draw (`${seed}:album:flavour:patch`, same key, same single draw) gives the start and chapter N
      wears the name N places on (`albumPatchFor`) – a pure function of (seed, chapter), so the openers of one book never repeat a club until the pool
      runs out (ten; a per-sheet roll off six repeated one in roughly three books of four), re-opening reshuffles nothing, MAIN untouched, no stream is new.
    * THE POOL is ten: the six that shipped (`Whitegate Club` among them, unchanged) + R47-S7…S10 below. All are two or three plain words that fit the 96px
      cloth in two lines (measured in Chromium: 10 of 10 two lines, patch 83px as `albumPlacement` holds it), none a club, tournament or trademark.
    * THE STEP is the highest step of any tournament on the chapter's own pages through the SAME `ALBUM_TIER_STEP` (`albumChapterStep`); a chapter with no
      tournament (the childhood) is the first step. THE CLOTH is the pass's own four pairs (`--tier-<step>` ×0.38 / ×0.27 – no colour added; legibility
      ≥ 4.5:1 held), `album-patch-<step>`.
    * THE ICON: his crossed racquets, INLINE (`fill="currentColor"`, 22px – the thread tints it; inline like the baggage tag's cord, not a CSS mask, which a
      raster export would leave empty), his «Uploaded to: SVG Repo» provenance kept in the template. Both files are in the repo as received:
      `public/icons/tennis-svgrepo-com.svg` (used) and `public/icons/tennis-ball-2-svgrepo-com.svg` (his alternative, unused – one swap: replace the
      two `<path d>` in `AlbumPatch.vue` with its paths and its `.st0` fill with `currentColor`).
    * TESTS: `r47-b2-album-ticket-patch` (step class, four cloths = token pairs, pool name + inline icon + tint, legibility, layout-A binding), `albumBook`
      (pool: ten, distinct, fictional, `Whitegate Club` kept; the ladder is total through the shared table; the walk never repeats and wraps; forty seeds
      reach ≥ 6 of 10 clubs; the assembled book). Mutations: step class removed → 2 red, svg deleted → 1, `fill` → `#000000` → 1, name ignores the
      chapter → 2, step always budget → 1, last rung not highest → 1, trademark in the pool → 1.

---

## The plan – bundles by collision surface, sequential dispatch (token law 29.09)

Orientation: «She said one more year N times» is ENGINE copy (`engine/ending.ts:654` – the engine
itself attributes the words to HER); Spent = `view.money.outlayCents`, Still owned =
`holdingsCents`, portfolio = `portfolioCents` (the reckoning's readers – the gross diagnosis
starts there); the ticket's Champion/Row/Gate lines and the «Whitegate» tag are COMPOSED in
`engine/world/albumBook.ts`, not the component; the #14 photo pool exists in
`public/images/weeks/` (off-1..3, vac-camping, vac-elite, chores, study) + the sleepy travel set;
the «хорошая» cup candidate is to be located (public/icons + trophies webps).

| Step | Items | Surface owned | Model · budget |
| --- | --- | --- | --- |
| B1 | 1 2 3 4 5 6 7 12 + DRAFTs for 10 11 | `EndingScreen.vue` + its engine money/ending readers | sonnet · 70 |
| B2 | 8 16 | ticket+tag: `albumBook.ts` (ticketOf/tag sections), `AlbumTicketPass.vue`, the tag component, the two SVGs into the repo, the fictional-club DRAFT corpus | sonnet · 55 |
| B3 | 9 14 15 | album composition: headings, the small-photo filler pool, the cup swap (`albumBook.ts` other sections, layouts, placement) | sonnet · 55 |
| A13 (architect) | 13 | `tools/career-dossier.ts` + the dossier report off his save | – |

B2 and B3 both touch `albumBook.ts` – they run strictly in sequence (B2 lands and commits before
B3 starts), never side by side. The architect's probe rides tools/ + scratchpad only.

## Cross-references

- #1+#2+#3+#4+#5+#6+#7+#12 are ONE surface – the ending screen (`EndingScreen.vue` + its engine
  readers); #10/#11 are its WORDING (answer+DRAFT, separate from layout).
- #8+#16 share the ticket/tag component family; #9+#14+#15 are the album book's
  composition/typography.
- #13 rides the save he could only export because of round 46 #20.
- #2/#3/#4 are REOPENS – each records what the first fix aimed at and why this screen missed it.

---

## DRAFT strings – B1 (his blessing decides; NOTHING below is wired)

| id | item – where | string |
| --- | --- | --- |
| R47-S1 | 10 – the `natural` ending's title (`ENDING_TITLE.natural`, engine/ending.ts:1174), alternate A. In place: «… – 41, and nobody had to ask her.» | `She retired` |
| R47-S2 | 10 – same slot, alternate B | `She played her last season` |
| R47-S3 | 10 – same slot, alternate C | `She stopped playing` |
| R47-S4 | 11 – the one-more-year note on the last page (`EndingScreen.vue`, `.ending-note`; today «She said one more year N times.»), alternate A – his own reading. `time` / `times` as today | `You said one more year N times.` |
| R47-S5 | 11 – same slot, alternate B – the agency framing (the parent gives, she receives) | `You gave her one more year N times.` |
| R47-S6 | 11 – same slot, alternate C – impersonal, leaves the speaker out | `One more year was said N times.` |

## DRAFT strings – B2 (WIRED – these four ARE in the build; his veto removes a row from the pool)

| id | item – where | string |
| --- | --- | --- |
| R47-S7 | 16 – WIRED: club-patch pool row 7 (`ALBUM_PATCH_POOL`, engine/world/albumBook.ts) – a fictional club, two lines on the 96px cloth | `Larkfield Tennis` |
| R47-S8 | 16 – WIRED: pool row 8 | `Fairhaven Club` |
| R47-S9 | 16 – WIRED: pool row 9 | `Elmwood Courts` |
| R47-S10 | 16 – WIRED: pool row 10 | `Stoneleigh Tennis` |

The first six rows (`Rivermouth Tennis`, `Northfield Club`, `Harbour Lane Tennis`, `Old Mill Courts`, `Cedar Park Tennis`, `Whitegate Club`) shipped
with §8b and are unchanged.

- **A13 · 13 MEASURED AND DELIVERED (the architect).** `tools/career-dossier.ts` (committed,
  registry regenerated) decodes any .tsave through the app's own import door; his w1037 save
  opened clean at v92 (the night's migration validated on a live career). The dossier file went to
  him mid-round. Headlines: the lived decline matched the drawn curve to the half-season
  (declineStart 28.48 vs the S15 dip and the S20 fall); 9 injuries / 18 weeks lost in 20 years
  with the masseur saving 8 of them; 15 of 16 knocks played through («push») with the ankle as
  the late-era chronic; composure 57.8 ABOVE its 52.7 potential – the psychologist's +5 is the
  career's only above-ceiling skill; the academy at 4/4 is the best deal ($12M → $42.9M + weekly
  income); «Family's share» on the last page = prizeCents to the cent. Honest holes stated:
  financeWeeks keep 60 weeks, results keep the running season – the early-era per-tier splits are
  not reconstructable from a save.

---

- [x] **17. (06.10, вечер – the owner pulled the spawned walk-slowdown hunt INTO the round:
  «давай в этот раунд докинем?»)** – the walked-career fixtures grew ~3–4× across the morning's
  double merge (college-league's four-year walk: «4.7 s quiet» when its budget was written →
  20.7 s solo on main tonight; the round/47 branch already ~24 % faster at 15.8 s). The symptom
  is closed (three files promoted to HEAVY_UNIT_FILES, the dated 06.10 entry); THIS item is the
  CAUSE: profile `stepCareerWeek`/tick on a walked college career, name which merged additions
  grew the hot path (candidates: the life-moment derivation, lifeBeat additions, the masseur
  replay, snapshot work leaking into walks, the reckoning fold), optimize the honest way or
  document the growth as the price of shipped features – and re-measure the three promoted
  walkers (back under ~8 s solo → they return to the bulk pool). ⚠ Any optimization keeps worlds
  BYTE-IDENTICAL: same-seed walks equal before/after, `rngMain` untouched, the frozen capture
  green. Class: **measure → build** → **B4**.

  - **B4 · HUNTED – THE PREMISE DID NOT SURVIVE THE PROFILE: the walks did NOT grow across the double merge, «3–4×» compared two different things (the real per-tick growth since the budget was written is ×1.3–1.4), and the one grower the profile names was FIXED – round 42 #47's `unpayableTrip` ran on EVERY tick as the first of four conjuncts. Junior-era walks -19 %, worlds BYTE-IDENTICAL on 29 careers, the frozen capture green.** Both halves of measure → build delivered; the three files stay or return by the rule written in item 17 (under ~8 s solo), and the table is below.
    * THE METHOD (scratchpad only, never committed): a standalone `vite-node` harness that imports the engine and walks college-league's OWN fixture idiom (`atTheFork` → `answerFork` → 54 ticks → `pressCollegeYear` × N: six careers × four years, 242 weeks each) plus a plain 3 × 200-week walk, run under `node --cpu-prof` (500 µs) – and the SAME harness in a control worktree (HEAD `18503a11`, and older commits) INTERLEAVED with the changed tree. ⚠ THE MACHINE WAS NOT QUIET (load 6–21, six pegged Python jobs from another session), so every comparison below is an interleaved A/B in CPU-ms, never a wall number set against an old comment – the same lesson as the 17.08 null results, in the other direction.
    * THE PROFILE – the college-league walk, TOP 10 BY SELF TIME (6,799 ms sampled, 12,167 samples; the era is the function's own dated comment, not git archaeology):
      | # | self | share | function · file | era |
      |---|-----:|------:|-----------------|-----|
      | 1 | 543 ms | 8.0 % | `win` · match/closedForm.ts (the pSet/pTiebreak DP closures, a Map per call) | the base match engine (its header carries no date) |
      | 2 | 455 ms | 6.7 % | (anonymous) · season/tournament.ts (`selectEntrants`' age/band filters and sorts) | W2-FIELD2 / §4.1, August |
      | 3 | 378 ms | 5.6 % | (anonymous) · world/ladder.ts (the ledger digest and the memo thunks) | Wave A derived-cache, September (next-waves-2026-09) |
      | 4 | 347 ms | 5.1 % | `assignCompetitionRanks` · season/ranking.ts | W2-LADDER, August |
      | 5 | 332 ms | 4.9 % | `selectEntrants` · season/tournament.ts | W2-FIELD2, August |
      | 6 | 310 ms | 4.6 % | (anonymous) · season/ranking.ts (`computeRanking`'s callbacks) | W2-LADDER, August |
      | 7 | 225 ms | 3.3 % | (idle) · native – the process waiting on esbuild | harness, not engine |
      | 8 | 152 ms | 2.2 % | `fold` · world/derivedCache.ts (FNV over the ledger, once per array) | Wave A, September |
      | 9 | 150 ms | 2.2 % | `rankingForUncached` · world/ladder.ts | W2-LADDER / Wave A |
      | 10 | 130 ms | 1.9 % | `deriveWeekField` · world/weekField.ts | R2-10 step 2, 31.07 |
      Ten rows hold 44.5 % of the samples; nothing past them is over 1.8 %. By INCLUSIVE share (the first, loaded profile): `tickWeek` 77 %, `closeTheWeek` 49 % (the AI world's tournaments and standings), `recomputeRankAndMilestones` 15.5 %, `deriveWeekField` 14.7 %, `drawAiEntrants` 12.5 %, `runAiTournament` 11.1 %, `fastMatchProbability` 8.4 %, `computeRanking` 7.0 %, `ledgerToken` 6.3 %, `weeklyFinance` 6.2 %. NOT ONE of the top ten is a round-46 or succession-wave function by its own dated comments, and the interleaved A/B across the merge below is the proof: the college walk's hot path is the alive world, which is August's design.
    * THE CANDIDATES THE ITEM NAMED, EACH MEASURED ON THAT SAME PROFILE: `lifeMomentOf` – not in the profile at all (nothing calls it per tick); lifeBeat (`pendingLifeBeat`, `rollSmallTalk`, `answerLifeBeat`) ≤ 3 ms in total; the spouse no-repeat scan – absent; the masseur replay (`masseurWeeklyCents` chain, `resolveMasseur`) ≤ 1 ms; the reckoning fold (`careerMoney` through milestones' break-even gate) 2 ms – the gate does not fold per tick; snapshot work in walks: `toSnapshot` 279 ms (3.1 %) – but ONLY through the FIXTURE's `answerBirthdayNeutral` (tools/_birthday.ts reads `toSnapshot(world).birthdayPrompt`, ~11.6 ms × 24 birthdays), never through the tick. None of the five is a grower; the last is a test-helper cost, noted, not changed (nobody asked, and it is shared by 26 walks).
    * THE PREMISE, MEASURED (interleaved, CPU-ms of the six-career college walk; load fell 21 → 13 over the three reps):
      · THE DOUBLE MERGE IS FLAT: main before it (`6841f057`, 03.10) 9362 / 9645 / 8554 · after both merges (`1e7b125b`) 8345 / 10302 / 8601 · this branch (`18503a11`) 10096 / 8998 / 8506 – medians 9.4 / 8.6 / 9.0 s: noise, no step. The plain walk, 3 x 200 weeks, cpu ms: main before the merges 4124 / 5362 / 6012 vs this branch 4939 / 4441 / 4322 – no step either.
      · THE BUDGET'S OWN TREE, INTERLEAVED (`d2f89ca7`, the commit whose message says «paid by a hook»; the harness answers its birthdays with `chooseGift(world, 'day')`, the idiom of that day) – THIS ONE DOES SHOW GROWTH, AND IT IS ×1.3–1.4, NOT ×3–4: college walk 6998 / 8192 / 10666 cpu ms vs HEAD 10223 / 10802 / 10497 (medians 8.2 vs 10.5 s, +28 %); plain 3 x 200 weeks 3611 / 3869 / 3526 vs 5041 / 6987 / 5036 (medians 3.61 vs 5.04 s, +40 %). The job ran at load 10 → 26, so read the RATIOS and not the seconds. Where the growth is: the isolated step of `70c87aea` below is +26 % on the plain walk by itself, the largest single step; the rest is spread (the derived-cache key work, the entry gates, features) and no other function in the profile took more than a few percent.
      · WHAT THE ITEM COMPARED: «4.7 s quiet» is the six-career BEFORE-ALL walk alone; the 15.8 / 20.7 s it was set beside are the WHOLE FILE, and the same comment gives the file as 13.4 s on 04.09. Like for like: file 13.4 s on 04.09 (its own comment) → 16.7 s solo here today; walk 4.7 s on an idle machine → 5.7 s at load 6–9 here. And «the branch is 24 % faster than main» is not in the walk: it is the same code on both trees (above: 8.6 s vs 9.0 s interleaved, no step) – the likeliest cause, NOT tested here, is a cold transform cache in a fresh worktree set against a warm checkout.
    * THE GROWER, NAMED: `unpayableTrip` (world/phaseFinance.ts), added by `70c87aea` (16.09, round 42 #47 + #49(b), «the cameo closes a trip»; ABSENT in its parent `fc856e17`). `resolveBaseCosts` evaluated it FIRST, on every tick of every career: it walks the whole season calendar and asks `entryStatus` of every upcoming event, and each verdict folds the ranking tables (`kidPoints` → `rankingFor` → `memoise` → `ledgerToken` / `readEnv`). Junior-era plain walk, HEAD vs 04.09, share of `tickWeek`: `weeklyFinance` 0.5 % → 21.3 %, of which `unpayableTrip` 18.0 %, `entryStatus` 15.2 %, `hasOutgrown` 6.9 %, `readEnv` (two `process.env` reads per memoised call) 5.1 % SELF – all of it one call chain. The isolated step, parent vs `70c87aea`, plain cpu ms 3418 / 2645 / 2625 vs 3329 / 3250 / 4184 (medians 2.65 vs 3.33 s, +26 %, load 8–10, three interleaved reps); college 6961 / 8005 vs 7139 / 10111 – two reps on a loaded machine, too noisy to read: the clean college number is the fix's own A/B below, because `unpayableTrip` returns at once while she is in college and only the 54 pre-departure ticks of a career pay for it – which is also why the college files barely move.
    * THE FIX (one function, `resolveBaseCosts`): the cameo's four-term condition is the same four terms in a different ORDER – `!inCollege`, `sponsorNeedMet`, `sponsorCameoWilling`, and only then `(unpayableTrip(world)?.shortfallCents ?? 0) > 0`. Every term is pure (a lookup or arithmetic over state the week already wrote – `unpayableTrip`'s own header says so and the evidence below confirms it), so the truth value cannot change; the gift, its sub-stream draw and its text are not touched (invariant 4: not one character of copy moved).
    * THE RAZOR – WORLDS BYTE-IDENTICAL, 29 careers, `JSON.stringify(world)` sha256 + `rngMain` + the walk stream's NEXT draw, HEAD control worktree vs the changed tree: 3 plain × 200 weeks (default family) · 4 + 16 NEEDY families × 300 weeks (mostly working-class, a $1,200 start, so the gate really runs: 8 cameo gifts fired across the 16 and 2 in the first four, funds equal to the cent) · 6 college careers × 242 weeks. the comparator printed `ALL 13 CAREERS BYTE-IDENTICAL: true` (3 + 4 + 6) and `ALL 16 CAREERS BYTE-IDENTICAL: true` (the 16 needy ones, a second run). The frozen capture: `npx vitest run tests/condition.test.ts --project unit` → `Test Files 1 passed (1) · Tests 51 passed (51)`; the cameo's five files (`round42-sponsor-cadence`, `wave6-reachable-funds`, `wave6-reachable-reads`, `round28-sponsor-cut`, `economy-calibration`) → 39 passed; the byte-level frozen career hashes (`coach-travel-edge-walk-memo`, `coach-travel-edge`) → 9 passed. The pin queries for `phaseFinance.ts` found only comments (`coachTravelEdgeFixtures`, `round28-sponsor-cut`, `wave6-reachable-funds`), no source pin on the old order.
    * BEFORE / AFTER of the fix, three interleaved reps each, median: plain 3 × 200 weeks **2.70 → 2.19 s wall (-18.7 %), cpu 3.16 → 2.51 s (-20.6 %)**; the college walk (six careers) 5.69 → 5.54 s wall (-2.7 %), cpu 6.33 → 6.13 s (-3.2 %). Every walk outside a college freeze paid for the call, so the saving lands across the unit suite – NOT re-timed here (no `npm test`, by the brief).
    * THE THREE PROMOTED FILES, SOLO, before (control worktree) / after (this tree), two interleaved reps, `vitest run <file> --project unit`:
      college-league: solo 16.4 / 17.0 s before, 16.5 / 16.0 s after (medians 16.7 -> 16.2 s, -3 %) -> STAYS in HEAVY_UNIT_FILES
      wave9-poise: solo 12.5 / 12.7 s before, 11.3 / 11.2 s after (medians 12.6 -> 11.2 s, -11 %) -> STAYS in HEAVY_UNIT_FILES
      round27-call-up-flow: solo 16.8 / 17.1 s before, 15.7 / 16.2 s after (medians 16.9 -> 15.9 s, -6 %) -> STAYS in HEAVY_UNIT_FILES
      THE RULE WAS «under ~8 s solo → back to the bulk pool». The 06.10 entry in `scripts/heavy-tests.mjs` carries the dated «hunted, verdict» note and the pool changes (if any); nothing else in that list was re-measured.
    * WHAT STAYS, AND WHY IT IS THE PRICE AND NOT A DEFECT: after the fix the profile is flat – `win` 6.8 %, the tournament callbacks 5.9 %, ladder 4.7 %, `selectEntrants` 4.4 %, `assignCompetitionRanks` 4.1 % – the alive world's own tick, ~3.7 ms a week, 242 weeks a college career, ~1 s a career, six of them in a file. Refused, with reasons: `win`'s Map → typed array (the engine's hottest numeric function: a ≤ 5 % gain, and every match probability in the game flows through it – best case no change, worst case a silent drift in every bracket); an incremental ledger digest (`pruneResults` hands `world.results` a NEW array every week, so no running state can carry across a tick – the keyed-by-identity memo would restart every time); hoisting `selectEntrants`' position map per ranking (1.7 %); `readEnv` caching (the note in derivedCache.ts says why it is read per call – the bench flips the flag between arms). None is a grower; each is a few percent against a risk to bytes this item exists to forbid.
    * HONEST HOLES: (1) the machine was loaded throughout, so the per-file solo figures carry ±1 s; the interleaved A/Bs, not the absolute seconds, are the evidence. (2) The harness stalled on birthdays at pre-15.09 commits until it was given the `chooseGift(world, 'day')` fallback of that day – the first 04.09 reading (76 weeks, 2.3 s) was a harness artefact and is withdrawn here, not used. (3) `entryStatus` is still O(events) per call and `unpayableTrip` still scans the calendar whenever a needy family is in a willing week – a cache keyed on (week, ledger token, entries) would flatten that too, and it is NOT done: it is a new derived table with its own key discipline, which is a wave, not a hunt.
    * FILES: `src/engine/world/phaseFinance.ts` (the order + its dated note), `scripts/heavy-tests.mjs` (the 06.10 entry's verdict), this ledger. The harness, the profiles and the logs stay in the scratchpad.
