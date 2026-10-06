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

- [ ] **1. «на этом экране надо убрать обертку-подложку, на которой весь контент лежит, мне кажется
  она там не нужна, как раз освободится немного места горизонтально.»** – the ending screen's card
  wrapper (the backing the whole content sits on) goes; the content takes the freed horizontal
  space. Class: **build**.

- [!] **2. «цифры миллионов я просил сократить до 40,5М 254,3М и т.д.»** – REOPENED: round 46 #19
  ruled the M-abbreviation and B5 shipped `formatCentsCompact` – but wired it into the SEASON
  summary popup only; the ENDING screen's figures (the screenshot: $40,563,980 …) never got it.
  The first fix aimed at the popup he named then; this screen is the second surface. ⚠ His example
  spells «40,5М» with a DECIMAL COMMA – the shipped form is «$40.6M» (dot, the app's locale);
  wire the existing form here, flag the comma question in the report. Class: **build**.

- [!] **3. «цифры трат снова гросс и не пересчитаны, мы туда вроде собирались записывать сколько
  было именно на теннис потрачено»** – REOPENED, the reckoning class: the 18.09 reckoning
  (`careerMoney`, `isHoldingCategory`) was supposed to make the career totals consumption-only,
  and round 46 B5 fixed the SEASON fold – yet the ending screen's SPENT ($254M beside a $269M
  portfolio) reads gross again. Diagnose what this screen actually sums (which reader, which
  categories), then make it the tennis-consumption figure he asked for. Class: **build** (diagnose
  first, the fix must name the reader that lied).

- [!] **4. «верстка все еще едет и цифры скачут»** – REOPENED for THIS surface: round 46 R5's
  label|figure grid fixed the season popup's dance; the ending screen's figure grid still jumps.
  Rebuilt together with #5/#7's typography pass. Class: **build**.

- [ ] **5. «best rank, titles и seasons лучше в одну строку, наверное сделать и тоже крупнее и
  Sora, жирнее»** – the three career facts become ONE row, larger, Sora, bolder. Class: **build**.

- [ ] **6. «чем отличается still owned от family's protfolio? кажется можно одно лишнее убрать»** –
  what is the difference between the two figures ($268,755,069 vs $269,490,541 on his screen)?
  Diagnose the two readers; if one nests inside the other, remove the redundant row (his lean);
  if they are genuinely different, answer with the numbers and the one-sentence difference.
  Class: **answer → likely build** (remove one).

- [ ] **7. «для цифр жирный шрифт, крупнее размер и Sora на этом экране»** – every figure on the
  ending screen: bold, larger, Sora. One typography pass with #4/#5. Class: **build**.

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

- [ ] **10. «фраза she played until she was done звучит довольно странно как мне кажется. У нас
  разные вариации этой фразы или одна на всех?»** – is the ending title one-per-ending-kind or
  one-for-all? Answer with the real table (nine kinds have nine titles – name which kind produced
  his), then DRAFT alternatives for THIS title for his blessing. Class: **answer + DRAFT**.

- [ ] **11. «she said one more year 5 times - а разве это она говорила, а не я?»** – who says «one
  more year» in the fiction? The retirement dialog asks the PARENT; the line credits HER. Read the
  mechanic's framing, answer honestly, and DRAFT the corrected subject if the line mis-attributes
  his choice. Class: **answer + DRAFT**.

- [ ] **12. «the whole record в самый низ под кнопки поставь пожалуйста, ниже только export save
  останется»** – «The whole record» moves to the very bottom, under the door buttons; only
  «Export save (dev)» stays below it. Class: **build**.

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

## Cross-references

- #1+#2+#3+#4+#5+#6+#7+#12 are ONE surface – the ending screen (`EndingScreen.vue` + its engine
  readers); #10/#11 are its WORDING (answer+DRAFT, separate from layout).
- #8+#16 share the ticket/tag component family; #9+#14+#15 are the album book's
  composition/typography.
- #13 rides the save he could only export because of round 46 #20.
- #2/#3/#4 are REOPENS – each records what the first fix aimed at and why this screen missed it.
