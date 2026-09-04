---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-04
---

# Round 36, his review of the built wave – seventeen items (04.09.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` waiting on him

⚠ He looked at the seven built phases and came back with corrections. **One of them overrules a
decision the round argued for with a measurement (D28), and he has the right to** – the measurement
answered «does the column grow», and his answer is «neither: change the shape».

⚠ A third design pack arrived with it: `AU-live-match-tablet-768.png` and
`AV-live-match-desktop-1024.png`, at
`scratchpad/design/rwd2/live_match_responsive/`.

---

## The prologue

- [ ] **1. «D28 — пролог - так не пойдет, давай делать примерно как у нас home сделан, надо чтобы
  картинку было видно хорошо, скролла не будет, а текст будет либо ниже и шире (планшет), либо
  сбоку, ниже и шире (десктоп)»** – **build, and it overrules D28.**
  ⭐ The round's measurement stands and is not contradicted: a wider column IS a taller picture, and
  it pushed the decision down the page. His answer sidesteps it – **the picture stops being the
  column's width.** Home's own hero is the model: a picture with a shape of its own, text beneath it.
  ⚠ «скролла не будет» is the acceptance test: the card must fit the viewport at 768 and at 1280.

## Home, desktop and tablet

- [ ] **2. «колокольчик, письмо и шестеренка настроек живут на десктоп в правом верхнем углу вне
  картинки и доступно на всех экранах, кроме тех, что займут всё пространство (как матч,
  например)»** – ⚠ this reverses phase 3's **D14**, which left them on the photograph because moving
  them means re-parenting out of an `overflow:hidden` hero. That is the work, and it is now asked for.
- [ ] **3. «Аватар и ранг тоже уезжают с картинки, но в левый верхний угол в меню над всеми
  пунктами»** – into the rail, above the navigation.
- [ ] **4. «Next tournament — эта карточка менее высокая, чем family budget, т.к. на последней еще
  график должен поместиться и ширина этих карточек в макете около 310 пикселей. картинку на Next
  tournament можно смело делать больше, чтобы пропорционально она была похожа на карточку на мобиле
  и занимала больше места (и на планшете)»**
- [ ] **5. «Нижний блок карточек имеет свою сетку, они равны по ширине»**
- [ ] **6. «На Recent memory фотокарточку больше размером сделай пожалуйста и сдвинь ее ближе к
  тексту и чуть дальше от края (и на планшете)»**
- [ ] **7. «Сам шрифт на Recent memory и Coach note можно сделать крупнее (и на планшете)»**
- [ ] **8. «Home в боковом меню на первом месте сверху поставь пожалуйста»**
- [ ] **9. «Плитки дашборда живут прибитые к меню выше, Coaching budget несёт больше информации»**
  ⚠ «больше информации» is not specified – the coach-market meter has four figures and the card shows
  one. **Ask which, or show the meter's own set and let him cut it.**

## The shop

- [x] **10. «Внутри магазина на внутренних страницах нижнюю стрелку "назад" надо убрать - точка входа
  в магазин всегда общая страница категорий, по клику на Shop мы на нее же попадаем»**

  ### `[x]` SHIPPED – the arrow goes at every width, and the chapter button becomes the way out

  **What changed:** `src/components/screens/MoneyScreen.vue` – the `.shelf-nav` block and its
  `IconButton` are deleted from the template, `.shelf-nav` from the style block, and `openChapter`
  replaces `backToShelfHome`. `tests/component/round35-shop.test.ts` – the trap arm re-aimed, plus one
  new arm for the door. **D66.**

  ⚠⚠ **HIS SECOND CLAUSE IS WHAT MADE THE FIRST SAFE, and it had to be BUILT rather than assumed.**
  Round 35 #3's own test rejected «press the chapter tab again» as a way out **because it was not
  one**: `screenTab` never left `shop`, so the press did nothing at all. Deleting the arrow without
  that clause would have re-made round-20 #3's failure – a level you can enter and not leave.

  | | |
  | --- | --- |
  | **the arrow** | `.shelf-back`, a 32×32 box, measured present in arm A at **375 / 520 / 768 / 900 / 1024 / 1280** and **absent at all six** in arm B. Gone everywhere, which parity permits; gone at some widths only is what it forbids. |
  | **the way out** | a press on the `Shop` chapter button, from inside a category or from another chapter |
  | **the other door** | leave the shop for Bills and come back – `shopHome` is true again, so «точка входа **всегда** общая страница категорий» holds for the door as well as for the button |
  | **the page above the shelf** | 42px shorter at 375 – the arrow's own 32px box and its 10px margin. The first card sits at y=279.3 instead of 321.3, and its family heading at 210.7 instead of 252.7. |

  ⚠⚠ **AND THE OBVIOUS WIRING FOR IT IS DEAD CODE – built, measured, replaced.** Vue 3.5's `useModel`
  **returns early from its setter when the value has not changed**, so `SegmentedRow` emits **no**
  `update:modelValue` on a press that re-selects the open chapter. An `@update:model-value` listener
  passes every test that enters the shop from another chapter and does nothing for the press he
  actually described. **Mutation M3 puts that version back and reddens exactly the trap arm.** The
  press itself is the only signal that exists, so `openChapter` reads a click that came from a button
  inside the chapter row – no label, no value.

- [x] **11. «На Air, Water, Property, Cars давай для всех картинок еще чуть больше горизонтального
  места дадим, самим картинкам `width: 50%`, а `shop-row-body padding-right: calc(45% + 12px)`»**
  ⭐ He has given the declarations themselves – use them, and if they fight the card's own geometry
  say so with a measurement rather than adjusting them silently.

  ### `[x]` SHIPPED – **his two declarations verbatim**, and they do fight the geometry a little

  **What changed:** `MoneyScreen.vue` – `SHELF_WIDE_ART` + `shopRowArtWide` in the script, a
  `shop-row--art-wide` class on the card, three rules in the style block.
  `tests/component/round35-shop.test.ts` – the car and property arms re-aimed, one new arm for the
  academy. **D67, D68, D69.**

  #### The measurement he asked for – Chromium, arm A → arm B

  | width | card | **band** A→B | **words' column** A→B | first car A→B | first property A→B |
  | --- | --- | --- | --- | --- | --- |
  | **375** | 343 | 136.4 → **170.5** | 180.6 → **163.6** | 180.9 → 180.9 | 139.6 → **155.8** |
  | **520** | 488 | 194.4 → **243.0** | 267.6 → **243.3** | 164.7 → 164.7 | 139.6 → 139.6 |
  | **768** | 362 | 144.0 → **180.0** | 192.0 → **174.0** | 180.9 → 180.9 | 139.6 → 139.6 |
  | **900** | 428 | 170.4 → **213.0** | 231.6 → **210.3** | 164.7 → 164.7 | 139.6 → 139.6 |
  | **1024** | 380 | 151.2 → **189.0** | 202.8 → **183.9** | 164.7 → **180.9** | 139.6 → 139.6 |
  | **1280** | 468 | 186.4 → **233.0** | 255.6 → **232.3** | 164.7 → 164.7 | 139.6 → 139.6 |

  ⭐ **The picture gains 34–47px and the words give up 17–24px.**

  ⚠⚠ **AND THE CARD GROWS BY ONE LINE IN EXACTLY TWO OF THE TWELVE CELLS, WHICH IS THE HONEST FORM OF
  «it does not grow».** Round 35's constant through three of his own messages was «иначе карточка
  очень высокая получается», so a height that moves is the thing to report rather than to average
  away. It moves **+16.2px – one wrapped blurb line – on property at 375 and on the first car at
  1024**, and nowhere else: at the other ten cells the card is byte-identical between the arms. Both
  are the same mechanism, a 12px blurb at `line-height: 1.35` finding one word too many for the
  narrower column, and both are one word of copy or one point of `--art-wide` away from going. **The
  Cars page as a whole is 779.8 → 831.5px at 375.**

  ⚠⚠ **WHERE THEY FIGHT THE CARD, SAID WITH THE NUMBER RATHER THAN ADJUSTED.** Round 35's pair was
  40 / 40 – the inset MATCHED the band, so the words began exactly where the picture stopped. His is
  50 / 45, so **the words begin `5% of the card − 12px` before the band ends**: 5.1px at 375, 6.0 at
  768, 11.3 at 1280, 12.3 at 520 (the widest overlap of the six). Every one of those lands in the
  last 5% of the band's own fade, where the mask is at **7.8%–13.3% alpha** – invisible rather than
  absent, and no control sits in the strip. **It is used as he wrote it. D67 carries the full table
  and the argument; one sentence from him makes the inset match the band again.**

  **D68** is why it is applied at every width – he wrote a CSS rule and put no media query on it, and
  scoping it to 768 would give one object two proportions 21px of card width apart. It is the row to
  overrule if the phone should keep round 35's 40 / 40.

  ⚠ **HER ACADEMY IS NOT IN IT (D69).** The academy rows are `--art-left` exactly like the cars, so a
  rule keyed on the SIDE would have taken them; he named four families and this is not one. It keeps
  40 / 40. **Mutation M6 adds it and reddens the arm that holds it.**

- [x] **12. «С купленной машины убираем paid серые буквы, кнопка buy/sell встает слева ближе к нижнему
  правому углу карточки»**
- [x] **13. «В разделе Her Academy убираем paid серые буквы, кнопка buy/sell встает слева ближе к
  нижнему правому углу карточки»**

  ### `[x]` SHIPPED – one change, two families, made once

  **What changed:** `MoneyScreen.vue` – `SHELF_NO_PAID_META` and `shopRowCornerAction` in the script,
  a `shop-row--corner-action` class, one style rule. `tests/component/round36-review.test.ts` §1 (new,
  three arms), `round35-shop.test.ts`'s «Worth now» arm re-aimed, `shop-tab.test.ts` re-aimed.
  **D70.**

  ⚠⚠ **THE `paid` LINE IS A FIGURE LEAVING THE SCREEN, AND THE ROUND 35 REASON WAS CHECKED BEFORE IT
  WENT.** He removed it from the HOUSES on 03.09 «раз прибавка и так видна», and the same has to be
  true here or the number is simply lost. **It is:** `.shop-row-change` is drawn **unconditionally**
  inside `.shop-row-owned` – it carries no `v-if` – and the engine fills it for every owned rung
  (`changeCents = valueCents − paidCents + realisedGain`, `src/engine/world/shop.ts`). A car and an
  academy stage each print «Worth now $X» and «−$Y since you bought it (−Z%)», so what was paid is
  X − Y. Nothing is re-worded: the meta stops being passed.

  ⚠ **Water and air keep theirs.** He named two families; `paid $N` stays on `investment`, `business`,
  `boat` and `plane`. **Mutation M10 strips all seven and reddens two arms – the house's and the
  investment holding's.**

  **The control** goes to the card's bottom-right corner with `margin-left: auto` on the LAST control
  in the owned row – ⚠ **in the flow, not `position: absolute`**. The `--art-right` families' pill is
  in that corner already but it sits **on the painting**; on a car the corner is inside the WORDS, and
  a pill lifted out of the flow there shortens the card and prints itself over the last sentence.

  ⚠ **BOTH APPLY AT EVERY WIDTH, and that was decided rather than defaulted.** Neither names one, and
  unlike a composition these are about what the card SAYS: a figure printed on a phone and absent on a
  desktop is not a responsive decision, it is two different cards.
  ⚠ **THE IDENTITY CENSUS CANNOT SPEAK FOR THESE TWO** – its Money station lands on the Spending
  chapter and the shop is two presses behind it, so what its zeros prove is that these two changed
  nothing ELSEWHERE. The shop itself is covered by `e2e/parity.spec.ts`'s two shop rooms (green at
  375 / 768 / 900 / 1280) and by the browser measurement at six widths.

  ⚠ **ONE MUTATION DID NOT BITE AND IT FOUND A BLIND ARM.** Widening the corner rule to every family
  left the whole file green – because the «an investment holding is untouched» arm was reading the
  FIRST control in the row («Add more») and the rule is `:last-child` («Sell»). The helper reads the
  last control now, names it, and the same mutation reddens. **A guard aimed at the wrong element is
  «four empty sets are equal» in miniature.**

- [x] **14. «Фоточку на Her own account можно сделать крупнее»**

  ### `[x]` SHIPPED – the photograph grows, the card's cap does not

  **What changed:** `MoneyScreen.vue` – one `@media (min-width: 768px)` block on
  `.money-share-photo`. `tests/component/round36-review.test.ts` §2 (two arms). **D71.**

  | | 375 / 520 / 576 | 768 and above |
  | --- | --- | --- |
  | the paper | **66px**, unchanged | **104px** |
  | the window | **52px**, unchanged | **82px** |
  | measured box (tilt −3°) | 69.5×71.4 → 69.5×71.4 | 69.5×71.4 → **109.0×103.3** |
  | the photograph itself | 60.6×55.0 → 60.6×55.0 | 60.6×55.0 → **100.2×86.9** |
  | the card | 343×214.4, unchanged | width capped at **640** in both arms; **18.6px taller** at 768, **18.9px** at 1280 |

  ⭐ 104 : 82 is the mockup's own 66 : 52 – a bigger polaroid, not a differently shaped one. Phase 3's
  D18 cap is untouched, measured 640.0 in both arms at 1024 and 1280.

  ⚠ **FROM 768, AND THE PHONE IS DELIBERATELY UNTOUCHED (D71).** He names no width, and the complaint
  is a wide-screen one by construction: at 375 this polaroid is 66 of 319px of content – a fifth of
  the strip – and at 1024 the same 66px sits in a 616px card.

  ⚠⚠ **AND IT IS `min-height`, WHICH IS THE WHOLE TRICK.** `Polaroid` writes the window's height as an
  **inline style**, which beats every rule in the screen's sheet – so a media query that widened the
  paper alone leaves a 52px photograph floating in a 104px frame, **which looks exactly like the item
  working**. `min-height` is a different property and the used height is the larger of the two. Two
  other routes were built first and are recorded in D71: a `var()` through the component's own
  `photoStyle` slot (happy-dom's CSSOM **rejects `var()` as a height**, so the guard could not read
  what it guards), and moving the prop for every width. **Mutation M11 widens the paper and leaves the
  window at 52 – the arm reddens by name.**

## Money, other rooms

- [x] **15. «В разделе Spending всему правому сектору с запиской, фото и пайчартом дать больше воздуха
  слева и справа - там есть достаточно места»**

  ### `[x]` SHIPPED – two of the app's own gutters, on each side

  **What changed:** `MoneyScreen.vue` – one `@media (min-width: 768px)` block on `.money-body` and
  `.money-artefacts`. `tests/component/round36-review.test.ts` §3 (two arms). **D72.**

  | | 375 / 520 / 576 | 768 and above |
  | --- | --- | --- |
  | air on the **left** | **8px**, unchanged | **32px** = `calc(2 * var(--app-pad-x))` |
  | air on the **right** | **0**, unchanged | **32px**, the same expression |
  | the figures' column | 189px, unchanged | 582 → **526** at 768 · 794 → **738** at 1280 |
  | the sector itself | 146px | **146px** – he asked for air around the paper, not a bigger paper |
  | `.money-body` height | unchanged | **546.7px in BOTH arms** at 768 and at 1280 |

  ⭐ **The figures pay 64px and nothing reflows** – the body is the same height in both arms, so the
  56px the list gives up is slack rather than a wrapped row. The air is the app's own `--app-pad-x`
  twice rather than a number invented here, and it is symmetric because he named both sides in one
  breath.

  ⚠ **From 768 up.** His sentence names no width and the phone is the one place his premise
  («там есть достаточно места») is false: 375 leaves the figures 189px beside the paper, so 64px of
  air would come straight out of the amounts.

- [x] **16. «На week results нижняя записка на скотче давай сделаем ее на 50-60% ширины, как на
  календаре примерно. Блок картинок предлагаю сделать более квадратным, справа темный фон, а вот эту
  верхнюю записку (на всю длину скрина) ставим тоже квадратиком неправильной формы как раз на это
  место справа пустое освободившееся»**

  ### `[x]` SHIPPED – three moves, one grid, and the card comes out **shorter**

  **What changed:** `src/components/WeekRecapCard.vue` – `--recap-art-h` on `.recap-card`, one
  `@media (min-width: 768px)` block replacing phase 2's `width: 100%` rung, and a second for
  `.recap-goal`. `tests/component/round36-review.test.ts` §4 (four arms). **D72.**

  ⚠ **PHASE 4's OWN FINDING ON THIS SURFACE IS INTACT AND CARRIED FORWARD.** Phase 2 found `.recap-art`
  frozen at 390px from 520 up – a block with `aspect-ratio` and a violated `max-height` transfers the
  width back down the ratio – and fixed it with `width: 100%` **at ≥768 only**, leaving 520/576 as
  **D11**. That `width: 100%` is still there, inside the new block; **D11 is still open and this item
  did not touch it** (`.recap-art` measures 390×286 at 520 in both arms).

  | move | 375 / 520 / 576 | 768 | 1280 |
  | --- | --- | --- | --- |
  | **1. the taped note narrows** | 343.4 / 488.4 – unchanged | 736.4 → **405.2** = **55.1%** | 948.4 → **521.8** = **55.0%** |
  | **2. the picture becomes square** | unchanged | img 736×286 → **286×286**, the rest of the band `--card-bottom` | img 948×286 → **286×286** |
  | **3. the top note moves right** | unchanged (still rides the painting at −34px) | 740.5 @x13.8 → **422.7 @x317.6** | 952.5 @x273.8 → **634.5 @x577.8** |
  | the card's own height | 873.4 → 873.4 | 773.0 → **747.5** | 741.8 → **716.3** |

  ⭐ **55% is the middle of his «50-60%»**, and it is a SHARE rather than `.cal-note`'s fixed 280px:
  the calendar's fridge note is the surface he compared it to, not the rule to copy, and 280px would
  read as a quarter of a scrap at 1280.

  ⭐ **The picture block keeps its box – 736×286 and 948×286, unchanged – and only the photograph
  inside it moves**, so «более квадратным» costs the card nothing. The square is not a second number:
  the grid's first column IS `--recap-art-h`, the same custom property the height cap reads, so «as
  wide as the band is tall» cannot drift.

  ⭐ **And the story is 25.5px SHORTER at 768 and at 1280**, because the note no longer takes a row of
  its own. Its paper is untouched – the torn cut, the ruling, the tilt and the doodle are
  `PaperNote`'s, which is «квадратиком неправильной формы».

  ⚠⚠ **THE GRID HAD A REAL DEFECT AND ONLY THE MOUNTED ARM CAUGHT IT.** Vue's scoping turns
  `.recap-card > *` into `.recap-card[data-v] > *[data-v]` – **(0,3,0)** against a bare
  `.recap-note[data-v]`'s (0,2,0) – so the span won and **the note sat under the picture at full
  width, which is the shipped layout wearing a grid.** It was built that way, the arm read `1 / -1`
  back, and both placed items are addressed as children now. **Mutation M15 restores the bare class
  and reddens that arm alone.**

  ⚠ **From 768 up.** Neither half survives a phone: 55% of 343px is 189px for «Next goal» plus a
  sentence at 21px, and there is no space to the right of a phone's picture to put a note in.

---

## The evidence for items 10–16

### `[x]` THE GATES – every exit code read out of a FILE, never through a pipe

⚠⚠ **AND THE TREE IS SHARED WITH TWO OTHER AGENTS WHILE THESE RAN, so both numbers are given.**
CLAUDE.md's own rule: a red with a shifting failing set is contention, and it is re-run before it is
believed.

| | |
| --- | --- |
| `npm run test:e2e` | **62 passed, `E2E_EXIT=0`** – parity green at 375 / 768 / 900 / 1280 on every screen and on all four rooms, including **`MoneyScreen.vue – a shelf inside the shop`**, which is the room item 10 removes a control from |
| `npm run test:component` | **124 files, 1423 tests, `COMP3_EXIT=0`.** The two runs before it were red with a **shifting** set (10 then 11 failures, `round35-shop` in one and not the other) at load 20–42 with 68 vitest processes alive – contention, and it cleared on the re-run. **One of those reds was real and mine:** the item-14 arm walked five seasons TWICE inside one case, passed alone in 9.6s and timed out at the 5s default in a full run. Fixed by hoisting the walk; the file now carries a 30s ceiling with its reason. |
| `npm run test:quiet` | red in the shared tree, and **not one of its failures is this wave's**. **Run 1** (757s, at load 30–42): 24 named failures – **16 timeouts** (`Test timed out` / `[vitest-worker]: Timeout calling "onTaskUpdate"`) and 9 assertion failures, **one of which was mine** and is the R15-7 pronoun above. **Run 2, after the fix** (459s, load fallen): **zero timeouts and eight assertion failures**, in six copy-rule files, and every failure body names only `App.vue`, `HomeScreen.vue` and `RailDashboard.vue` – another agent's uncommitted work on items 1–9. `MoneyScreen.vue` and `WeekRecapCard.vue` appear in none of them. ⭐ The timeouts vanishing while the assertions stayed identical is the two halves separating exactly as CLAUDE.md predicts. |
| `npm run check` | `CHECK_EXIT=2` on the same tree, and the `vue-tsc` half names one file: **`tests/component/round36-review-home.test.ts` – TS6133 ×2**, another agent's new file. `npx vue-tsc -b --force` over this tree reports **those two errors and nothing else**; the doc gates it runs first (`context:audit`, `doc-facts`, `decisions:check`) are green with everything this wave appended. |

⚠⚠ **AND ONE OF THE UNIT REDS WAS MINE AND IS WORTH THE PARAGRAPH.** `tests/coach-voice.test.ts`
(R15-7, «no surface guesses a professional's gender») reddened by name on two lines of this wave: a
`//` comment inside the shop row's `:class` binding that wrote «the four families **he** named».
**The sweep strips `<!-- -->` before it scans and cannot see a `//` line inside an expression**, so a
prose note in a binding is rendered text as far as that harness is concerned. The note is an HTML
comment above the card now. It is written into the file beside the fix, because the next person to
annotate a binding will make the same mistake.

⚠ **Item 10 removes a control at EVERY width, which parity permits** – it compares the four
fingerprints to each other, so a control that goes everywhere is invisible to it and one that went at
some widths only fails by name. The proof that it really went everywhere is the browser measurement:
`.shelf-back` is a 32×32 box at all six measured widths in arm A and absent at all six in arm B.

### `[x]` THE IDENTITY PROOF, RE-RUN – 0 NEW, 0 GONE, AND **NOTHING AT ALL BELOW 768**

Arm A is this commit with `MoneyScreen.vue` and `WeekRecapCard.vue` restored to `HEAD` **in the same
tree** (CLAUDE.md's shared-checkout rule – the other two agents' live edits are in both arms and
cancel); arm B is the wave. Ten tab screens, one fresh career per width, every element that renders
censused as tag + class + occurrence + box to 2dp.

| width | boxes | **moved** | **new** | **gone** | pixels | raw A→B |
| --- | --- | --- | --- | --- | --- | --- |
| **375 / 520 / 576** | 2212 | **0** | **0** | **0** | **0** | 2452→2452 |
| 768 / 900 | 2235 | 179 | **0** | **0** | 11755 / 12322 | 2475→2475 |
| 1024 / 1280 | 2365 | 179 | **0** | **0** | 11968 / 12748 | 2475→2475 |

⭐ **Nothing appeared and nothing went at any width**, and the raw element count is identical – items
14, 15 and 16 are placement, not markup. **Below 768 not one box moves**, which is the round's own
contract kept for items 14, 15 and 16.

**The 179 that do move are decomposed and attributed**, and they fall on exactly two screens:

| screen | what moved | item |
| --- | --- | --- |
| **Money** (Spending) | `.money-list`, `.money-artefacts` and everything inside them – the receipt, the polaroid, the donut, the eight expense rows and the CTA | **15** |
| **Money** (Spending) | `.money-share`, `.money-share-photo`, its `img`, `.money-share-text` | **14** |
| **ThisWeek** | everything inside `.recap-card` – the note, the grid, the tiles, the goal scrap – the card is 25.5px shorter, so what follows it rises | **16** |
| both | `html` / `body` | the page's own scroll height, from the two above |

⚠ **The census cannot see items 10–13:** its Money station lands on the Spending chapter, and the shop
is two presses behind it. Those four are covered by the browser measurement (six widths, four
surfaces) in the item entries above, and by `e2e/parity.spec.ts`'s two shop rooms.

#### ⭐⭐ AND THE THREE ZEROS ARE A MEASUREMENT, NOT A BLIND INSTRUMENT

The same census, in the same run, on the same career, with **only** `.money-artefacts`' `width: 146px`
changed to `130px` – one property, no media query, so it lands at every width:

| width | boxes moved | pixels moved |
| --- | --- | --- |
| **375** | **59** | **1644** |
| **520** | **59** | **1644** |
| **576** | **59** | **1644** |
| 768 / 900 | 59 | 1636 |

– so the instrument is demonstrably sensitive at exactly the three widths where it reports nothing.

### `[x]` THE MUTATIONS – fifteen run, **fourteen bit, one did not**

Each was applied alone to the shipped tree and the tree was restored from a byte-checked copy
afterwards (`md5` verified against the pre-mutation backup, never `git checkout --`).

| | mutation | what reddened |
| --- | --- | --- |
| **M1** | `openChapter` never resets `shopHome` | both item-10 arms |
| **M2** | the back arrow restored on an inner page | the «no arrow on an inner page» arm |
| **M3** | ⭐ the `@update:model-value` route instead of the press | the trap arm alone – **this is the measurement behind D66** |
| **M4** | the band back to round 35's 40% | the car and property arms |
| **M5** | ⭐ his `padding-right` copied blind onto the cars | the car arm **and** round 35's «price and control share one line» – the card grows |
| **M6** | the academy swept into his four | the academy's 40% arm |
| **M7** | the control back at the left of its row | both item-12/13 arms |
| **M8** | ⚠ the corner rule widened to every family | **NOTHING – the arm was reading the wrong button.** See below. |
| **M8b** | the same mutation, arm re-aimed at the LAST control | the investment arm |
| **M9** | `paid` restored on the cars and the academy | three arms across two files |
| **M10** | `paid` removed from every family | the house arm and the investment arm |
| **M11** | item 14's paper grows, the window does not | the photograph arm |
| **M12** | item 14's media block deleted | the photograph arm |
| **M13** | item 15's air on the right dropped | the air arm |
| **M14** | item 15's media block deleted | the air arm |
| **M15** | item 16's note addressed by class alone | the «beside, not under» arm – **the specificity defect** |
| **M16** | item 16's picture back to a letterbox | the square arm |
| **M17** | item 16's dark ground dropped | the square arm |
| **M18** | item 16's taped note back to full width | the taped-note arm |
| **M19** | `.recap-card` not a grid | the «beside, not under» arm |

⚠⚠ **M8 IS THE ONE THAT DID NOT BITE, AND IT IS RECORDED BECAUSE IT FOUND A BLIND ARM.** Widening the
corner rule to every family left the whole file green: the «an investment holding is untouched» arm
read `find('.shop-action')` – the FIRST control in the row, «Add more» – and the rule under test is
`:last-child`, i.e. «Sell». The arm was measuring a button the rule can never touch. The helper takes
the last control now and names it in the assertion, and **M8b reddens**.

### `[x]` WHAT IS **NOT** BUILT, AND IS HIS TO ASK FOR

| | |
| --- | --- |
| **the words reaching into the band (D67)** | His `50%` / `calc(45% + 12px)` do not meet, so a sentence begins on the last 5% of the painting's fade – 7.8–13.3% alpha, invisible in practice. Making the inset match the band again is one number. |
| **item 11 on the phone (D68)** | Applied at every width because he wrote a bare CSS rule. It costs one wrapped blurb line on property at 375 and on the first car at 1024. A `@media (min-width: 768px)` around four rules undoes it. |
| **Her Academy's proportion (D69)** | Left at round 35's 40 / 40 because he named four families and this is not one. One name in `SHELF_WIDE_ART` moves it. |
| **`paid $N` on water and air (D70)** | Left, for the same reason. Two names in `SHELF_NO_PAID_META`. |
| **`.recap-art`'s 390px collapse at 520 and 576 (D11)** | **Still open, and untouched by item 16** – phase 2's `width: 100%` remains a ≥768 rule and this wave did not widen it. It is still the phase-4-or-owner call it has been since phase 2. |

## The match

- [x] **17. «Экран матча переделываем полностью… Для планшета AU option 2 "court on top, instruments
  in two columns", для десктоп AV»** – ⚠⚠ **«ВАЖНО: наши контролы скорости и моментов остаются с
  нами, дизайн их забыл.»** The frames draw a single «Speed up» pill; the app has a speed matrix and
  the full/key view mode. **Neither may be lost, and this is the round's own rule anyway.**

  ---

  ### `[x]` SHIPPED – and the whole item is two media queries in one file

  **Two files of app and harness, one of tests, two of documents.** `src/components/MatchViewer.vue`
  (a `@media (min-width: 768px)` block and a `@media (min-width: 1024px)` block, at the end of its
  scoped stylesheet); `e2e/parity.spec.ts` (a live-match ROOM, and an optional `Station.park` for
  it); `tests/component/round36-item17.test.ts` (new, eleven arms); **D60–D65** in
  `docs/specs/responsive-decisions-2026-09.md`, and this entry.

  ⭐ **Not one line of template changed, and that is the point rather than a boast.** No element, no
  string and no icon is added or removed at any width – the raw element count on the live match is
  **394 → 394** at every one of seven widths – because the layout is written as PLACEMENT and never
  as moved markup. **D60.**

  #### ⭐⭐⭐ HIS OWN WARNING, ANSWERED FOUR WAYS – the speed matrix and the view mode both survive

  | | where it sits now |
  | --- | --- |
  | **the SPEED matrix** – `Normal speed` · `Double speed` · `Quadruple speed` | the pinned bar, **at the foot of the court's own column** at 768/900 (382px / 494px wide) and at the foot of the left column on a desktop (508.8px). Unmoved on a phone. |
  | **the VIEW mode** – `Every point` · `Key points only` | the same bar, the left of its two plates, at every width |
  | the shout row – `What to shout` + `Shout 📣` | the same bar's second row, live matches only, unchanged |
  | `Skip to the result` | the same bar's third row, unchanged |

  ⚠ **And the view mode's own hazard was left alone deliberately.** `'key'` shows fewer points while
  the clock still reports the match's real duration – «a per-point clock would report a 'key' match as
  twenty minutes long, which is the lie» (`viz/matchClock.ts`). Nothing in this item touches that
  derivation; what a layout CAN do to a diegetic clock is hide it, so the mounted suite asserts the
  clock is drawn, named and not hidden at all three widths.

  ⚠⚠ **THE ACCEPTANCE TEST DID NOT EXIST AND THAT WAS THE ITEM'S REAL RISK.** `e2e/parity.spec.ts`
  derives its screen list from `src/components/screens/`, and **`MatchViewer.vue` is not in that
  directory** – so the match screen had never been fingerprinted at ALL, and a dropped speed plate at
  1280 was not something this round's instrument could have said. It is a room now, walked at
  375/768/900/1280, and it was proved to bite: with the two plates hidden from 768 up – the design's
  own omission, as a layout bug – it fails **by name**, printing `button "Double speed"`,
  `button "Every point"`, `button "Key points only"`, `button "Normal speed"`,
  `button "Quadruple speed"`. **D65.**

  #### WHAT IT LOOKS LIKE, PER BREAKPOINT, MEASURED IN CHROMIUM AT A 900px-TALL VIEWPORT

  `before` is `MatchViewer.vue` as it stood at `7f6c52ce`, the head this item was written against –
  ⚠ **not «the previous commit»**, because another agent was landing items 10–16 in the same worktree
  while this ran, and «branch head before mine vs mine» would have measured both of us. Arm A is this
  item's own file restored from that revision into this tree, and nothing else.

  | | 375 | 768 | 900 | 1024 / 1280 |
  | --- | --- | --- | --- | --- |
  | the court | 341×211 | 680×420 | 680×420 | 680×420 → **507×313** |
  | the commentary column | 343×253 | 736×92 → **344×179** | 848×92 → **344×179** | 848×92 → **329×819** |
  | the pinned bar | 343 | 736 → **382** | 848 → **494** | 848 → **509** |
  | **the takeover's own overflow** | 0 | **25 → 0** | **25 → 0** | **25 → 0** |

  * **768–1023 is `AU`:** the panel (court, both score rows, the three statistics) spans the whole
    column on row 1 – «court on top» – and row 2 stands in two: the transport left, the commentary
    right, on his own 344px track.
  * **1024+ is `AV`:** the panel takes a 60% column, the transport sits under it, and the commentary
    runs the **full height of both rows** beside them. The court is narrower than the tablet's, which
    is `AV`'s own trade and not a regression – he draws it 716 wide on a tablet and 612 on a desktop.
    **D61.**

  ⚠ **HE ASKED WHETHER IT SCROLLS. IT DID, BY 25px, AND NOW IT DOES NOT.** Before this item the
  takeover's scroller measured `scrollHeight 876 / clientHeight 851` at **768, 900, 1024 and 1280
  alike** – so the column ran 25px past its own window and the control bar was held on screen by
  `position: sticky` rather than sitting where the layout put it. Both new layouts fit **exactly**:
  `851 / 851`, nothing to scroll, sticky inert. ⭐ **And the court and the score were always visible
  together, before and after** – the panel ends at y=686 at 768 and at y=579 on a desktop, well
  inside a 900px window. What the old layout put past the fold was the bottom of the column, and the
  new one does not.

  ⚠⚠ **THE TABLET'S COMMENTARY IS STILL SHORTER THAN THE PHONE'S, AND THAT IS THE ONE NUMBER IN THIS
  ITEM THAT IS NOT A WIN.** Measured: **343×253 on a phone**, 736×92 at 768 before, **344×179 after**.
  So the tablet gains 95% on what it had and is still 74px short of what a 375px phone shows, because
  the court is 420px tall at 768 against 211 on a phone and our score and statistics sit in the
  COURT'S OWN CARD where `AU` puts them in a second card beside the feed. Splitting that card is a
  change to the PHONE, which rule 4 forbids; the alternative that keeps it makes the court 380px wide
  at 768, which is barely more than the phone's 341. **D62** – and whether the panel should split at
  768 is his call, not one to take inside a layout item. The desktop has no such problem: **329×819**,
  3.2× the phone.

  #### `[x]` ALL FOUR CALLERS, NOT JUST THE TOURNAMENT – measured, because the viewer is mounted in four places

  `MatchViewer` is not a screen file and has no single owner: `TournamentFlow`, `MatchReplay`
  (Home's news feed), `PracticeFlow` and Season's sandbox friendly all mount it, and the prologue's
  Local Open mounts it inside a container of its own. Measured at 375 / 768 / 1280:

  | | 768 | 1280 |
  | --- | --- | --- |
  | the tournament's live match | court 680×420, feed 344×179 | panel 508.8, court 507×313, feed 329×819 |
  | **a replay** off the news feed | court 680×420, feed 344×153 | panel 508.8, court 507×313, feed 329×793 |
  | **Season's sandbox friendly** | court 680×420, feed 344×154 | panel 508.8, court 507×313, feed 329×794 |

  ⭐ **And the one rule in this item that had never been rendered was driven to it.** `.mv-actions` –
  MatchReplay's `Watch again ↻`, the only surface with nothing to proceed to – is placed on an
  IMPLICIT third row, so it costs nothing when it is not drawn and becomes a full-width row under
  both columns when it is. Skipping a replay to its end: the button lands at **736×34 at 768** and
  **848×34 at 1280**, and the commentary gives up exactly its height (153→109 and 793→749). ⚠ The
  prologue's own weekend was NOT driven, and that is the one caller taken on structure rather than
  measurement: `.plo` is `position: fixed; inset: 0` with a flex column inside it, which is the same
  definite-height container `.tf-body` is, and `.plo > .mv` already reads `--takeover-col-max`.

  #### ⚠ AND IT WAS LOOKED AT, NOT ONLY MEASURED – one thing for his morning

  ⚠ **THE DESKTOP'S LEFT COLUMN HAS A 160px VOID IN IT, AND IT IS D63's SHADOW.** The panel ends at
  y=579 and the control bar stands on the floor at y=740, so between the statistics and the plates
  there is a band of empty page. In `AV` that band is not empty – it holds `Coach advice 2` and
  `Match stats`, the two controls we did not build because the app has no counterpart for either. So
  the space is not a layout defect to be tuned away; it is exactly the two buttons he drew, missing.
  ⚠ **The bar stays on the floor rather than moving up under the panel**, deliberately: its bottom
  edge is level with the commentary's, which is the line `AV` draws, and pulling it up would spend
  160px of the commentary column to fill a gap with nothing.

  #### `[x]` NOTHING BELOW 768 MOVED – re-run, and it is zero on both surfaces

  Arm A is the shipped head with `MatchViewer.vue` restored from it; arm B is this item. Every element
  that renders, censused as tag + class + occurrence + box to 2dp, one fresh career per width.

  | surface | 375 / 520 / 576 | 768 / 900 | 1024 / 1280 |
  | --- | --- | --- | --- |
  | **the live match** | **0 moved · 0 new · 0 gone · 0px** | 30 moved · 0 new · 1 gone | 90 moved · 0 new · 1 gone |
  | **the ten tab screens** | **0 · 0 · 0 · 0px** | **0 · 0 · 0 · 0px** | **0 · 0 · 0 · 0px** |

  The single box **gone** above 768 is `.mv-below`, which has no box once it has no display. The ten
  tab screens are untouched at every width, which a scoped stylesheet cannot help being – measured
  rather than asserted.

  ⭐ **AND THE ZEROS ARE A MEASUREMENT, NOT A BLIND INSTRUMENT.** The same census, the same run, with
  **only** `.mv`'s column gap changed from 10px to 18px: **19 boxes / 168px at 375, 520 and 576**,
  30 at 768 and 900, 18 at 1024 and 1280. ⚠ The FIRST anti-vacuity arm tried was a null one and is
  reported as such – raising the log's `min-height` from 92px to 132px moved nothing at any width,
  because the log is 253px tall on a phone and its floor was never binding. A null result is a claim;
  this one failed its own provenance check and was replaced.

  #### `[x]` PARITY – green at 375 / 768 / 900 / 1280, with a room the harness did not have

  `PARITY_EXIT=0`, **25 tests**, run solo. All nine of the viewer's controls are in the fingerprint at
  every width, and the deliberate break above is what says the room can see them.

  #### The eleven new test arms, and every mutation that was run

  `tests/component/round36-item17.test.ts`, mounted through the real cascade at `PHONE`, `TABLET` and
  `DESKTOP`.

  | mutation | what reddened |
  | --- | --- |
  | the two `SegmentedRow`s → one `Speed up` pill (his frames' own control) | **all four control arms, by name**, at all three widths |
  | `.mv-below { display: contents }` deleted | the `AU` and `AV` placement arms |
  | the `@media (min-width: 1024px)` block deleted | the `AV` arm **alone** – the pair this file exists to tell apart |
  | the whole `@media (min-width: 768px)` block deleted | `AU`, `AV` and the sticky-bar arm; **the phone arm stayed green**, which is the identity claim as a mutation |
  | `margin-top: 0` removed from the placed bar | the sticky-bar arm |
  | `grid-template-columns` collapsed to ONE track | the tracks arm – **and nothing at all before that arm existed** |

  ⚠⚠ **TWO MUTATIONS DID NOT BITE, AND ONE OF THEM BOUGHT AN ELEVENTH ARM.** Collapsing the grid to a
  single column passed all ten original arms: `grid-column: 2` is a DECLARATION and happy-dom reports
  it whether or not a second column exists to hold it, so «the log is in column 2» stayed true of a
  grid with one column. The tracks are asserted now as well as the placements. The second is a
  standing limit rather than a fix: deleting `display: contents` does **not** redden the sticky-bar
  arm, because happy-dom has no layout engine and cannot tell which box is a containing block – that
  half is carried by the browser measurements above.

## Everything

- [ ] **18. «кнопок в 700 пикселей не должно быть, максимум 500 пожалуйста с выравниванием по
  центру»** – ⚙ **this answers D20 and D32**, which parked the two controls over 700px for him.
  The census found exactly two at 1280: `View all transactions` at 793 and `.cal-marker` at 948.
