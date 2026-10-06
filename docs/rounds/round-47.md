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

- [ ] **8. «в альбоме горизонтальный билет повернулся - ок, но надо его ниже опустить, он на
  некоторых страницах перекрывает много букв наверху. И давай его на 10% меньше сделаем заодно.
  Еще на этом билете дублируется Champion, давай только рукописный оставим. И еще на нем Row, Gate
  давай везде в одну строку писать, а то где-то в две получается»** – four ticket asks: (a) lower
  it (it covers top-of-page letters on some sheets – the exact overlap B12 measured and parked;
  his eye has now ruled); (b) −10 % size; (c) the duplicated «Champion» – keep only the
  HANDWRITTEN one; (d) «Row …, Gate …» always ONE line. Class: **build**.

- [ ] **9. «в альбоме очень крупные заголовки на страницах, можно чуть уменьшить, а еще иногда у
  этих заголовков оверлап с написанным на странице случается, что тоже странновато, вроде место
  есть. Если надо детально каждую страницу альбома разобрать - скажи, я сделаю»** – album page
  headings: slightly smaller, and the heading-vs-content overlap fixed (the resolver has room –
  find why it still collides). His offer of a per-page breakdown stays in reserve if the sweep
  cannot localise it. Class: **build**.

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

- [ ] **13. «и вот весь сейв, разбирай. меня интересует всё: травмы, перформанс, как отработали
  помогающие специалисты, как и с какой скоростью она деградировала и т.д.»** – the full-career
  deep read: injuries (count, severity, timing, cost), performance arc, what each support seat
  actually delivered over its tenure, the decline curve and its speed, plus whatever the data
  volunteers. A probe tool decodes the .tsave through the app's own codec and the report reads
  like a scout's dossier. Class: **measure** (architect-led).

- [ ] **14. «и еще по альбому: я увидел, что мы сделали хорошую вариативность по страницам, давай
  усилим. У нас есть фотки, где она дома отдыхает, есть где на отдых ездила - их тоже можно
  небольшие добавлять на те страница, где убрали горизонтальный билет или боковую бирку, чтобы
  пустоту немного заполнить, а остальном хорошо.»** – more sheet variety: the existing rest-at-home
  and vacation artwork joins as SMALL photos on sheets that carry no ticket/side tag, filling the
  gap. Class: **build** (composition + the placement resolver).

- [ ] **15. «иконка кубка у нас есть хорошая, используй ее пожалуйста вместо этого текущего немного
  странного кубка»** – find where the «странный кубок» renders (the album's trophy scrap /
  trophies surface) and swap it for the good existing cup icon. Class: **build** (locate both
  first; name them in the ledger).

- [ ] **16. «whitegate club и саму бирку тоже можно сделать по аналогии с билетом разными цветами и
  с разными названиями вымышленными, иконка на эту бирку со скрещенными ракетками во вложении, или
  можно еще иконку мячика использовать, тоже во вложении»** – the album's side TAG goes the
  ticket's way: colour steps + FICTIONAL club names (new strings → DRAFT rows; the fictional-names
  law holds – nothing real constructible), with his attached crossed-racquets icon (or the ball)
  on the tag. Both SVGs enter the repo with this build. Class: **build**.

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
