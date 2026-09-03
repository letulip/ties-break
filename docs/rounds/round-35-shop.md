---
type: round
status: current
area: rounds
canonical: false
last-reviewed: 2026-09-03
---

# Round 35, the shop – his design pass, ten items (03.09.2026)

Status: `[x]` shipped · `[~]` answered · `[>]` in flight · `[ ]` open · `[?]` waiting on him

⚠ Same branch as the prologue round (`round/35`), different surface – they do not collide. The
prologue's items live in `round-35.md`.

⚠ HIS MOCKUP came as a zip, `design_handoff_tennis_parent_game`, frames **V, W, X, Y, Z, AA**. ⭐ His
own instruction is «есть нюансы, делаем не точно так» – so **where his words and the mockup differ,
his words win**, and every such difference is recorded below rather than resolved silently.

---

- [x] **1. «Я загрузил арты в public/shop - их надо конвертировать в webp»** – **DONE.**
  ⚠ They were in `public/images/shop/`, not `public/shop/` – which is the pipeline's OUTPUT folder,
  so `npm run art` could not see them. Staged into the inbox `public/images/shop-jpeg/` and encoded:
  **24 files, q82, 23.5–55.1 KB each, 1.1 MB for the set.**
  ⚠ The precache glob is `**/*.{js,css,html,svg,png,webp,woff2,mp3}`, so all 24 join the install:
  **+1.1 MB against the current 9.6 MB of images.** No test pins a precache ceiling; reported as a
  fact, not a blocker.

- [~] **2. «во вложении архив с базовой верстой страниц магазина (кадры V, W, X, Y, Z, AA), но есть
  нюансы, делаем не точно так»** – the mockup is a reference, not a specification.
  ⚙ **ANSWERED BY BUILDING IT.** Every frame was read and every place it disagrees with his message
  is recorded on the item it belongs to. Three disagreements were found in the end, not two – the
  third is on items 5 and 7 below and it is about WHICH SIDE the paintings stand on.

- [x] **3. «главная магазина становится главной с текущей the shelf, выбором категорий из 6 карточек
  (название категории встает на карточку внизу шрифтом Sora, первый ряд invest, business, property,
  остальное 2й ряд), ниже her account с фоточкой как в макете (а также на каждой странице магазина),
  большой картинки делать не будем пока что»** – **build.**
  ⚠⚠ **HIS ORDER DIFFERS FROM THE MOCKUP AND HIS ORDER WINS.** Frame V has row 1 = Invest / Cars /
  Property; he asks for **Invest / Business / Property**, with Cars / Water / Air on row 2. ⭐ His
  grouping reads as the three that earn, then the three that spend.
  ⚠ The mockup's big hero image is NOT built («пока что»).
  ⚠ Her account, with the photo, goes on the shelf AND on every shop page.

  ⚙ **BUILT.** The shop now has two levels. Pressing `Shop` lands on the HOME: the existing `The
  shelf` plate, the six category cards, her account. Pressing a card opens that category, which
  carries the switcher item 10 forbids touching, its rungs, and her account again.
  - **His order, and a test that fails on the mockup's.** `SHELF_CATEGORY_KEYS` in `src/art/shelf.ts`
    is `invest · business · property · cars · water · air`, beside the paintings it is the order of.
  - **No new words.** A card's name is the SWITCHER's own `label` and its tooltip the switcher's own
    `title`, read out of `SHELF_TAB_OPTIONS` – so the six cards and the six segments cannot drift and
    invariant 4 has nothing to catch. The one string this slice invents is the back control's
    accessible name, `Back to the shelf`, on the app's own shared `IconButton`.
  - **TALL, at the paintings' own ratio.** `aspect-ratio: 332 / 512`, not a rounding of it.
    ⚙ MEASURED at 375x667 off the real cascade: three columns, 8px gaps, **≈109 x 168 px** a card
    with the app's 16px gutters (the mounted measurement reads 119.7 x 184.5 because happy-dom
    resolves no gutter on the shell), two rows ≈344px. The name sits at the foot in `--font-heading`,
    which is Sora, and the test reads the resolved font stack rather than a class name.
  - **Her account carries her photograph** – a `Polaroid` of her own 256px crop at her own stage. The
    strip already sat outside every tab guard, so «на каждой странице магазина» needed no move: it is
    under the grid on the home and under the last rung on a category page. Round 26 #5b's two
    sentences are untouched; the element went `p` to `div` because a polaroid is a `div`.
  - **The way back is pinned as behaviour, not as markup.** A two-level shop is the first place in
    this app where a player could enter a level and not leave it – round-20 #3's own family of
    defect – so an arm presses the back control and requires the home to come back WHOLE, the plate
    and the six cards both, with the rungs gone. Mutating the handler to a no-op reddens it.
  - ⚠ The mockup's big hero image is NOT built, and there is an arm asserting its absence.

- [~] **4. «invest особо не меняется, там оптимизация инпутов и кнопок в основном, на фонде рисуем
  график, как договаривались»** – ⭐ the inputs, buttons and the fund chart all shipped in round 34
  (items 19 and 20). Check what is left rather than rebuilding it.

  ⚙ **CHECKED, AND THE ANSWER IS «NOTHING HERE – BUT NOT BECAUSE IT IS DONE IN THIS TREE».** Both
  items are real and both are shipped **on the `round/34` branch, which is not merged**:
  `git merge-base --is-ancestor f5b50eb9 HEAD` says no, and neither `.shop-stake-row` (item 20's
  inline row) nor the unit-price history the chart draws (item 19) exists anywhere in `round/35`.
  They are on `round/34` – `git grep shop-stake-row round/34` finds it at MoneyScreen.vue:2228.
  ⭐ So the correct action was to build NOTHING: re-implementing either one here would be a second
  copy of the owner's own feature and a guaranteed conflict in the same 3,000-line file the moment
  round 34 merges. **Nothing on invest was touched by this wave** – no rung, no control, no string,
  and `shelfArtUrl` returns null for both investment rungs, so they draw artless as they always have.

- [x] **5. «cars - есть арты для каждой машины (универсал 60к, люкс внедорожник 110к, спорткар 190к,
  4местный люкс кабриолет 300к) надо и описания поправить немного с названиями, а также картинки
  будут квадратными на всю высоту карточки с небольшим градиентом справа (как на тренерах), кнопку
  покупки можно поставить под цену - тогда больше горизонтального места для надписей»** – **build.**
  ⚠⚠ **THREE DIFFERENT PRICES FOR THE FIRST CAR and it must be asked, not guessed:** his message says
  **60k**, his own art file is named **`cars-90`**, and the mockup shows **$45,364**. The other three
  agree at 110 / 190 / 300. The four shipped ids are `car-sensible`, `car-good`, `car-nineteen`,
  `car-unreasonable`.

  ⚙ **BUILT. The prices did not move; three of the four descriptions did.** He asked for exactly
  that – «надо и описания поправить немного с названиями» – and each correction is the painting read
  back in words, which is the one thing that makes this a legal copy change under invariant 4.

  | rung | his word | was | is |
  | --- | --- | --- | --- |
  | 60k | универсал | The sensible estate | **untouched** – it was already an estate |
  | 110k | люкс внедорожник | The good saloon | **The luxury four-by-four** |
  | 190k | спорткар | «…twenty-five years late» | «…the one that was on the bedroom wall» |
  | 300k | 4местный люкс кабриолет | «no boot, **no back seats**» | «**Four seats**, no roof» |

  The 190k label «The one from the poster» and the 300k label «The unreasonable one» are HIS and
  survive – only the sentences that described a car he did not draw changed.

  **The layout.** Painting full card height, 40% of the card's width, the other 60% for the words,
  fading into the card with the coach cards' own mask. The card stays SHORT: the band is
  `position: absolute` between the card's top and bottom, so the WORDS set the height and the
  painting can never push it – «Карточки остаются узкие».
  ⚙ MEASURED off the real cascade at 375x667: **art 40.0% of the card, text column 56.8%** (the
  remainder is the card's own 12px gutter between them). His frame AA gives the yacht cards 37%, so
  «почти как в макете» lands within three points of the frame he sent.
  ### ⭐⭐⭐ HE MOVED THIS CONTROL TWICE IN ONE DAY, AND THE REASON OUTLIVED BOTH MOVES

  1. **item 5** – «кнопку покупки можно поставить под цену – тогда больше горизонтального места для
     надписей»: the control on its own line, under the price.
  2. **he built it, looked at it, and named the cost** – «на машинах на карточках кнопку buy
     всё-таки поставь СЛЕВА от цены пожалуйста, **иначе карточка очень высокая получается**».
  3. **and then corrected the side** – «и я ошибся: на машинах на карточках кнопку buy поставь
     **справа** от цены пожалуйста», which is also what his own frame X draws. ⭐ **THIS IS WHAT
     SHIPPED:** the price and the control on ONE line, price first, control to its right.

  ⚙ **MEASURED in a real browser at 375px** – stacked, the four car cards stood **200.3–216.5 px**;
  sharing the line they are **164.7–180.9 px**, about 36px off each.

  ⭐⭐ **THE CONSTANT ACROSS ALL THREE IS NOT THE POSITION, IT IS THE PROPERTY: the card must not grow
  taller.** That is the rule this family is built under from here – where a choice adds height, take
  the shorter one – and the mounted arm is aimed at the HEIGHT rather than at the arrangement, so a
  later edit that re-stacks the controls reddens.

  ⚠ **AND ONE MORE HEIGHT FIX HIS OWN HANDOFF ASKED FOR, FOUND BY LOOKING AT IT IN A BROWSER.**
  README §X: «Название – на своей строке, с переносом (не в одном флекс-ряду с доходностью, иначе
  обрезается)». `.shop-row-head` is `space-between` with an unbreakable rate beside the name; a
  framed row hands the words 40% less room, and «The luxury four-by-four» broke into THREE lines
  against a column with space for one and a half. On a card whose height IS its words, that is the
  one thing that can make it tall again. The name takes the line now and the rate falls under it.

- [x] **6. «business - мерч без изменений (разве что надо посмотреть там расположение кнопок), а для
  академии делаем для каждой части свою карточку (как на экране машин, такой же принцип, можно
  переиспользовать), все арты на месте»** – **build.** The academy's four parts are shipped as
  `academy-land`, `academy-courts`, `academy-building`, `academy-staff`, and the four arts match.
  ⚠ `academy` is its own family in the engine; the shop's six categories fold it under Business.

  ⚙ **BUILT, by reusing item 5 rather than writing a second convention.** The four stages carry the
  cars' framing – `shop-row--art-left`, same 40%, same mask, same class – and a mounted arm walks all
  four and asserts it. Their four paintings are wired (`business-academy-land/courts/clubhouse/staff`;
  ⚠ the third file is `clubhouse` and the id is `academy-building`, which is why the map exists).
  **The merch brand is untouched**, which is «мерч без изменений» taken literally: it has no painting
  of its own, so it is not framed, and an unframed row is the state this shelf has always drawn.
  ⚠ **Its buttons were looked at and left alone.** «разве что надо посмотреть там расположение
  кнопок» is a look, not an instruction, and the brand's controls sit where every unframed rung's do.
  One sentence from him and they move.

- [x] **7. «property - карточки похожи на cars, но картинка с другой стороны, тоже во всю высоту,
  видимо будет некоторая обрезка по ширине и градиент слева, пока так посмотрим. Добавится 2 тира
  домов еще: за 1.4м и за 3м. Кнопка покупка/продажа может стоять на картинке (как на яхтах, тогда
  картинка будет более квадратная, как мне кажется), а текущая цена отдельной строчкой белым шрифтом
  Sora (как на яхтах, или можно там где worth now написать как раз текущую цену, а цену покупки
  убрать вообще, у нас уже есть сколько прибавила)»** – **build, and it carries a CATALOGUE change.**
  Two shipped today (`house-first`, `house-garden`); **two new tiers at 1.4M and 3M**, and his four
  arts (`property-240/590/1400/3000`) say what the full ladder is.
  ⚠ He offers TWO spellings for the price line and prefers neither out loud – ask, or take the second
  («worth now» carries the current price and the purchase price goes entirely) and say why.

  ⚙ **BUILT.** Painting on the RIGHT, full height, fading to the left, 40% of the width – the mirror
  of the cars, which is «картинка с другой стороны … градиент слева».
  **The buy/sell control stands ON the painting**, bottom right, «как на яхтах», bounded by the band
  so a long label («Sell it for $12,000,000») can never put its own left edge back over the
  sentences. The price is a large white number in the heading face at the foot of the words.
  **The price line is his second spelling, which he then ruled on:** `Worth now` carries the current
  price and `paid $N` is gone. ⚠ **PROPERTY ONLY** – he said it of the house cards, so a car still
  names what was paid, and there is an arm asserting both halves.
  **Two tiers added: `house-villa` at $1,400,000 and `house-headland` at $3,000,000**, his prices to
  the digit, at the family's own +3% and with no build wait and no upkeep, exactly like the two
  below them. The ladder is pinned out of `ECONOMY` so it cannot move quietly.
  ⚠ `house-garden` is still **$520,000** although his painting for it is named `property-590`. He
  asked to ADD two tiers and to change nothing else, so the price stands and the stem is treated as
  his shorthand for «the second house» – the same family of slip as `cars-90`, but this one he has
  not ruled on. **One word and either the file or the price moves.**

- [x] **8. «water - карточки как на домах, все арты яхт в наличии, меням местами только: за 900к это
  парусник, за 2.4м уже небольшая яхта, дальше как было»** – **build.** A SWAP, not new items:
  900k becomes the sailing boat and 2.4M the small yacht. Shipped ids: `boat-launch`, `boat-sail`,
  `yacht`, `yacht-big`; arts `water-900/2400/12000/28000`.

  ⚙ **BUILT, and not one of the four prices moved** – «дальше как было». `boat-launch` is **The
  sailing boat** («Two cabins, a mast, and weekends that answer to the wind», the sentence that came
  down a rung with the identity) and `boat-sail` is **The small yacht**. Build times, rates and
  upkeep are untouched on both, and the cards take property's framing – «карточки как на домах».
  ⚠ **THE IDS DID NOT MOVE WITH THE IDENTITY, DELIBERATELY, AND THIS IS THE ONE THING TO TELL HIM.**
  Round 29 part three renamed `boat-motor` to `boat-sail` and paid for it with migration v66. A SWAP
  needs two renames that would collide mid-flight, so expressing it in the ids costs a schema bump,
  an append-only migration and a golden fixture – for something no player can see, since nothing on
  screen reads an id. So `boat-launch` now carries the sailing boat and `boat-sail` the small yacht:
  the names are stale, the rows are right, and one sentence from him turns it into a v70 migration.
  ⭐ A side effect worth keeping: round 29's «a rung CALLED a yacht on 6% upkeep still grants no
  crewed week» arm now tests a rung that really is called a yacht, so the guard got stronger.

- [x] **9. «air - карточки как на домах, добавляется небольшой самолет 8 мест за 7м, большой на 12
  мест остается как был за 18м»** – **build.** Shipped: `plane`, `plane-long`. Arts: `air-7`,
  `air-18`. ⚠ Two arts for two planes, so the reading is that the ladder ENDS at two – a small 8-seat
  at 7M and the big 12-seat at 18M – rather than gaining a third. Confirm before building.

  ⚙ **BUILT.** `plane-small`, **$7,000,000**, with `air-7` as its painting, sitting under the $18M
  one; the retired $38M tombstone is untouched and the roster still holds the tombstone count to
  exactly one. The ladder is pinned out of `ECONOMY`. Cards take property's framing («как на домах»).
  ⚠ **THE PRICE IS HIS; THE OTHER THREE NUMBERS ARE THE FAMILY'S OWN, and one of them is mine.**
  Both shipped aircraft carry the same rate (−600) and the same upkeep (800 bps), so those are what a
  plane costs on this shelf rather than a choice. The BUILD TIME is the one figure the ladder does
  not share (104 weeks at $18M, 156 at the retired $38M), so the rung below them got **52 weeks** –
  the shortest wait on the shelf, the same year `boat-launch` waits, about what a light aircraft
  really takes. It is one number and moving it moves nothing else.

  ### [?] ⚠ THE ONE QUESTION THIS WAVE COULD NOT ANSWER ITSELF – the seat count

  His message calls the new one «8 мест» and the $18M one «большой на **12** мест». The $18M rung's
  blurb has read «**Eight seats** and no airport that keeps them waiting» since round 29 #5, so by
  his own description the shipped sentence is wrong. Invariant 4 forbids an agent editing a shipped
  sentence it was not asked to edit, and putting «Eight seats» on the NEW card as well would have put
  two cards on one screen claiming the same cabin. **So the new plane's blurb deliberately counts no
  seats** – «Short runways, small airfields, and home the same night» – and the $18M row is untouched.
  ⭐ One word from him («Eight» to «Twelve» on the $18M row) closes it, and the small plane can then
  have its eight back.

- [x] **10. «переключалка между категориями магазина на самих страницах магазина остается текущей и
  не меняется»** – ⭐ an explicit DO-NOT-TOUCH. The in-page category switcher stays exactly as it is.

  ⚙ **NOT TOUCHED, and there is an arm that is the record of it.** `SHELF_TAB_OPTIONS`, `shelfTab`
  and `SHELF_TAB_FAMILIES` are byte-identical to what round 30 #5 shipped: six segments, his six
  words, his order. ⭐ **This item is the reason item 3's home is a separate flag rather than a
  seventh segment** – a home represented inside the switcher would have been exactly the change he
  forbade. The mounted arm asserts the six labels in order and that there are six and never seven;
  mutating a seventh segment in turns it red.

---

## ⚙ HIS ANSWERS, 03.09 – the three questions closed and one new instruction

**The first car is 60k.** «60к правильная - это наш дефолт, в нейминге я ошибся - поправь
пожалуйста». The art is renamed `cars-90.webp` → **`cars-60.webp`** (master renamed with it), and
neither his message nor the mockup's $45,364 is the number: **the shipped default is.**

**The planes: one live, one retired, and he wants a second live one.** «у нас сейчас один активный
за 18м, раньше был еще за 28м, а я прошу добавить второй за 7м с картинкой». Confirmed in
`economy.ts`: `plane-long` carries `retired`, whose own comment says it «is only what keeps it off
the shelf and out of `buyAsset`» – it is still valued, still billed and still sells for anyone who
owns one. ⭐ So the ladder becomes **two live planes, 7M and 18M**, and the retired 28M stays
retired. `air-7` and `air-18` are exactly the two arts needed.

**Property's price line: his second spelling.** «в строке "worth now" показывать текущую цену, а
цену покупки убрать совсем, раз прибавка и так видна. - верно.»

## ⭐ NEW – the six category cards are TALL, not square

> «Давай на главной магазина вот эти 6 основых карточек сделаем не квадратными, как в макете, а
> высокими (смотри соотношение сторон картинок), на них как раз вниз хорошо надписи встанут.»

⭐⭐ **The arts specify the layout themselves, and they were measured rather than guessed:**

| | pixels | ratio |
| --- | --- | --- |
| the six category tiles (`invest`, `business`, `property`, `cars`, `water`, `air`) | **332 x 512** | **0.65** – tall |
| every item tile (`cars-60`, `property-240`, `water-900`, `air-7`, …) | **512 x 512** | **1.00** – square |

So the category grid is portrait cards with the name at the foot, and the item rows are square
paintings at full card height – which is exactly the two shapes he described, in the two shapes the
paintings already are. At 375px, three columns with the shipped gaps puts a category card near
**105 x 162 px**; measure it rather than trusting that arithmetic.

---

## ⚠⚠ THE THIRD DISAGREEMENT, FOUND WHILE BUILDING – which side each painting stands on

The ledger recorded two places where his message and his mockup differ (the row order in item 3, the
first car's price in item 5). A third turned up, and unlike the other two **it is not his message
against his mockup – it is the two of them AGAINST the brief this wave was dispatched with.**

His words, and both of his own sources agree with each other:

| family | his sentence | what it means | his frame |
| --- | --- | --- | --- |
| cars | «с небольшим градиентом **справа** (как на тренерах)» | the coach cards are `.cm-art` at `left: 0` under a 90deg mask that fades out at its RIGHT edge, so a gradient on the right is a **painting on the LEFT** | X puts the car photo on the left |
| property | «картинка с **другой стороны** … и градиент **слева**» | the other side from the cars, fading leftwards: **painting on the RIGHT** | Z puts the house on the right |
| water | «карточки **как на домах**» | whatever property is, water is | AA puts the boats on the right |
| air | «карточки **как на домах**» | the same again | – |

The brief said «cars and water on the RIGHT, property on the LEFT». That reading cannot be
reconciled with «water – карточки как на домах»: that clause makes property and water the SAME side,
whichever side it is, and the brief puts them on opposite ones. It also contradicts the brief's own
sentence for item 5 («a small gradient on its RIGHT, **the way the coach cards already do it**»),
which names the convention that puts the picture on the left.

⭐ **So it was built to his words and his frames: cars and the academy LEFT, property, water and air
RIGHT.** It is one map – `SHELF_ART_SIDE` in `MoneyScreen.vue` – and flipping any family is one
word in it. A mounted arm pins the current arrangement, so a flip goes red and is re-aimed rather
than done silently.

⚠⚠ **THE BRIEF REPEATED «cars on the RIGHT» THREE TIMES, so this is flagged rather than buried.**
None of the three carried an owner quote about SIDES – the quotes they carried were about the
picture's WIDTH and about where the buy control sits. The two sources that do speak to sides are
his message and his handoff, and both say the same thing; the handoff says it in plain words:

> **README §X. Cars:** «строки с фото 74×52 radius 10px **слева** и кнопкой «Buy» справа»

⭐ **If he wants it the other way, it is `car: 'left'` -> `'right'` in that one map, plus re-aiming
the arm that pins it. Nothing else in the bundle moves.**

## ⚙ THE SCHEMA QUESTION, PROVED RATHER THAN ASSUMED

`SAVE_SCHEMA_VERSION` **stays at 69** and no migration is owed. The proof is that no stored save can
reference an id that no longer exists, and the catalogue's ids were diffed rather than eyeballed:

```
git show HEAD:src/engine/economy.ts | grep -oE "^        id: '[a-z-]+'," | sort   # before
grep -oE "^        id: '[a-z-]+'," src/engine/economy.ts | sort                   # after
comm -23 before after   ->  EMPTY:  nothing was removed or renamed
comm -13 before after   ->  house-villa, house-headland, plane-small
```

Three additions, zero removals, zero renames. A save holds `{ id, boughtWeek, paidCents, valueCents }`
per OWNED asset, so a v69 save simply sees three catalogue rows it does not own. ⚠ This is exactly
why item 8's swap kept its ids: a rename is the one shape of catalogue change that DOES owe the
four-part move, which is what round 29 part three paid for with v66. `tests/goldenSaves.test.ts`
(74 tests) is green, which is the mechanical confirmation that no version was skipped.

## ⚙ HOW THE TWO HEIGHT DEFECTS WERE FOUND – it was not the tests

Both the three-line name and the tall car card passed all seventeen mounted arms. They were found by
rendering the real cascade in a real browser at 375px and reading the geometry back:
`src/style.css` + `MoneyScreen.vue`'s own scoped block + `Card.vue`'s, over a static harness of shop
markup, served on localhost. ⭐ The measurements in this document (art 39.8% of the card, band full
height on every row, text column 182.6px, no control overlapping any text, card heights per row) are
that page's own `getBoundingClientRect`, not the floor model's estimate. ⚠ The harness is a scratch
file and is NOT committed – it is one script away from being rebuilt, and a stale copy of three
stylesheets is worse than none.

## ⚙ ONE THING THIS BUNDLE INHERITS FROM THE OTHER HALF OF THE ROUND

The category name is Sora 800 («шрифтом Sora», at the foot of the tile). ⚠ The prologue half of
round 35 measured, on the same day, that the app asks Sora for 700 and 800 in twenty-two rules and
ships neither – so every one of them, this one included, is currently a SYNTHESISED bold rather than
the real face (`docs/rounds/round-35.md` item 8, and he has ruled that the missing faces ship).
⭐ Nothing here has to change for that: this rule joins the twenty that already exist, and when the
face lands the tile's name gets sharper along with every heading in the app. It is recorded so that
«the category names look different now» is not read later as a shop regression.

## ⚙ THE ART'S PROVENANCE

Filed and attested by the owner while this wave ran (`public/images/README.md`): the shop set is
ChatGPT image generation, post-processed in Figma, owner, 2026-09-03. `tests/legal-assets.test.ts`
is green, so nothing in this bundle is blocked on it.

## ⚙ EVIDENCE

`tests/component/round35-shop.test.ts` – **18 mounted arms**, all against a real snapshot from the
real engine, none of them a source pin.

**Fourteen mutations, fourteen reds** – every claim was watched failing before it was believed:

| # | mutation | the arm that went red |
| --- | --- | --- |
| 1 | category order back to the mockup's (`business` ↔ `cars`) | «six category cards, in HIS order» |
| 2 | tiles `aspect-ratio: 1 / 1` | «the cards are TALL» – expected 100 to be close to 154.2 |
| 3 | art band 40% → 55% | «40% of the card» – expected 0.55 to be close to 0.4 |
| 4 | `car: 'left'` → `'right'` | «a car takes the painting on the LEFT» |
| 5 | property keeps `paid $N` | «no purchase price» – found `paid $240,000` |
| 6 | her photograph removed | «her account … carries her photograph» |
| 7 | `house-villa` repriced 1.4M → 1.5M | «property is a four-rung ladder now» |
| 8 | `plane-small`'s painting unwired | «every rung he painted has its painting wired» |
| 9 | a seventh segment on the switcher | item 10's «six, never seven» |
| 10 | the buy pill given a 150px minimum | «share ONE LINE» – 229px demanded of a 200px column |
| 11 | `order: -1` put back on the pill | «share ONE LINE» – the two are reordered against each other |
| 12 | the price given `flex: 1 0 100%` again | «share ONE LINE» – the price claims the line and pushes the control down |
| 13 | the framed head back to `display: flex` | «painting on the LEFT» – the name shares a flex line with the rate |
| 14 | the back control made a no-op | «the way back out is real» – the six cards do not come back |

⚠ **AND ONE PIN THAT WAS WRITTEN, FOUND VACUOUS AND REPLACED – recorded because it looks exactly
like a real assertion.** The obvious way to hold «the card is short» is a ceiling on
`boxOf(card).h`. It cannot fail: `fits.ts` models a non-column flex container as its TALLEST CHILD,
which is right for a row and blind to a WRAP, so the buy row measures one control tall whether the
price and the pill sit side by side or one under the other – 149px in both worlds. The claim is
made as a WIDTH instead, which is what it really is: the pill and the price fit on one line of the
text column, so they cannot wrap, so the card cannot grow the row he complained about. That one
fails on mutation 10 above.

**Re-aimed guards, none deleted, none loosened** – each carries a ⚠ note naming round 35 and why:

- `tests/shop.test.ts` – the roster gains `house-villa`, `house-headland`, `plane-small`; the sale
  row's label follows `car-good`.
- `tests/round29-shop-elite.test.ts` – the boat labels traded places (delivery row, upkeep row, and
  the «a rung called a yacht grants no crewed week» arm, which got stronger).
- `tests/round30-car-upkeep.test.ts`, `tests/component/round29-shop-elite.test.ts`,
  `tests/component/round30-brand-naming-screen.test.ts`, `tests/component/shop-tab.test.ts` – label
  re-aims only; not one figure beside them moved.
- `tests/component/shelf.ts` – `openShelfTab` now presses the category CARD when the switcher is not
  in the document, so all seven mounted files that reach into the shelf were re-aimed in ONE place.
- `tests/component/shop-tab.test.ts` – «one more segment, no new navigation» now asserts the home
  first and the rungs after a press.
- `tests/component/round30-subtabs.test.ts` – «плашка сверху, вкладки ниже» reads plate → grid →
  (one press) → switcher; and the ARTLESS arm was re-pointed from Cars, which he has now painted, to
  Invest, which he has not – with a second assertion that the cars really do have their four frames,
  so the move cannot hide a regression.
- `tests/component/round29-shop-topup.test.ts` – reaches its row through `shelfRow`.
