---
type: reference
status: current
area: economy
last-reviewed: 2026-09-29
---

# Money shelf – the shop composable

The comment chronicles that stood in `shop.ts` – the Money shelf's state and logic (`src/composables/shop.ts`), lifted out of `MoneyScreen.vue` by E-11 – moved here verbatim (T7.6 of the principles fix). The source keeps each site's why, every ⚠ warning as one line, the owner's rulings (dated where the source dates them) and a pointer to the site's heading below; the fenced text is the source's own comment lines, byte for byte – Cyrillic included, never re-wrapped.

## Composable – `shop.ts`

### `shop.ts` header – why the shop left MoneyScreen.vue

```ts
// =================================================================================================
// THE SHELF'S STATE AND ITS LOGIC – the Money shop, lifted out of MoneyScreen.vue (E-11, 28.09)
// =================================================================================================
//
// WHY THIS FILE EXISTS. `docs/review-principles-2026-09-26/05-ui.md`, E-11: MoneyScreen.vue reached
// 4,913 lines (4,240 three weeks earlier), 49 test files re-read it, and the shop is «the one region
// with its own state (`openMark`, `pendingShop`, shelf tabs)» – the seam the 02.09 and the 05.09
// reviews had each already named and neither had cut (P-03, R2-11, U-04). Every Money wave collided
// in one file. This is the half of the shop that is reactive state and the arithmetic over it;
// `ShopPanel.vue` is its markup, and `MoneyScreen.vue` owns the instance and wires the two together.
//
// ⚠⚠ EVERY LINE BELOW MOVED VERBATIM, COMMENTS INCLUDED, out of MoneyScreen.vue:1022-1744 and
// :1801-2073 at `f0f538a5`. Not a sentence reflowed, not a predicate re-shaped, not a rendered string
// touched – CLAUDE.md's «Preserve them verbatim when moving code» and invariant 4 read together.
// THE ONE CHANGE IS TWO SPACES OF INDENT, which the function that now scopes them requires, and it is
// a whitespace shift rather than an edit: `diff -w` between this file's body and that span is empty,
// and the bundle's report carries the command. A move that also tidies is a move nobody can review.
//
// ⚠ AND THIS IS WHERE THE OWNER'S CYRILLIC RULINGS BELONG NOW, which is the same rule one door along.
// `tests/template-copy-rules.test.ts` forbids Cyrillic anywhere in a template block – strings AND
// comments – so the quotes behind `SHOP_FAMILIES`, the top-up, the part sale, the naming, the units,
// the chart, the marks and the owned frame are parked here, in a `.ts` file no template scan reaches.
// Every note below that says «parked here and not in the template, and this array is read into one»
// is still exactly true: the array is still read into a template, and the quote is still not in it.
// Only the file the quote sits in has changed. ⚠ The sibling rule stays with `ShopPanel.vue`, where it
// still bites: a template's opening tag may not be SPELLED in a `.vue` file's script, because that
// test slices from the first literal one. It does not apply to a `.ts` file.
//
// ⚠ `week` IS A PARAMETER RATHER THAN A SECOND READER. `buildProgress` needs the career's week, and
// MoneyScreen already owns `computed(() => game.snapshot?.week ?? 0)`; declaring a second one here
// would be one fact with two spellings, which is the drift half this repo's comments are about. The
// screen's own reader is passed in, and `buildProgress`'s body is byte-identical to what it was.
//
// ⚠ `useGameStore()` IS CALLED AGAIN AND THAT IS NOT A SECOND STORE. Pinia hands back the one
// instance for the active app, so this `game` and MoneyScreen's `game` are the same object; a store
// passed as an argument would only add a way for a caller to pass the wrong one.
```

### `ShopState` – the return type, not a hand-written list

```ts
/** Everything the shelf's two surfaces read: `ShopPanel.vue`'s markup and, for the confirmation
 *  question and the front door, `MoneyScreen.vue` itself.
 *
 *  ⚠ IT IS THE RETURN TYPE RATHER THAN A HAND-WRITTEN LIST OF FORTY-FIVE MEMBERS, deliberately. A
 *  second statement of the same shape is a second thing to keep in step, and this one would be a
 *  long one – the failure mode where a member is added to the object and forgotten in the interface
 *  is exactly what `ReturnType` cannot have. The object literal at the foot of `useShop` is the
 *  contract, and it is grouped and commented there. */
```

### `useShop` – per call and never at module scope

```ts
/**
 * The shelf, for one mounted Money screen.
 *
 * ⚠ PER CALL AND NEVER AT MODULE SCOPE, which is a real constraint rather than a style: `shelfTab`,
 * `shopHome`, `stakeDollars`, `nameDrafts`, `chartMonths`, `openMark` and `pendingShop` all reset when
 * the screen mounts, and module-level refs would carry one mount's typed figure into the next – which
 * is a behaviour change on the product and a cross-test leak in the nine mounted suites that open this
 * shop.
 *
 * @param week the career's week, the screen's own reader – see the header.
 */
```

### The shelf (v63) – every number is the engine’s

```ts
  // ================================ THE SHELF (v63) =================================================
  // docs/specs/the-shop-2026-08.md §2, §3a-c. The parent's own money, and the first screen in this game
  // where it is his to enjoy.
  //
  // ⚠⚠ EVERY NUMBER BELOW IS THE ENGINE'S. This block reads `snapshot.shop` and formats it – it never
  // prices a rung, never applies a rate, never subtracts a paid price from a current one and never
  // rounds a percentage. `shopView` (engine/world/shop.ts) did all four, once, which is the same rule
  // `kitLines` above is written under and the reason §5 stores `valueCents` instead of deriving it.
```

### Round 29 #11 – `shopTopUpNote`, topping up, and the tone of the worth line

```ts
  // ⭐⭐ ROUND 29 #11 – `shopTopUpNote`, THE OWNER'S OWN WORDS, PARKED HERE AND NOT IN THE TEMPLATE.
  //
  // «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit будет вести
  // себя так же – тоже надо исправить.»
  //
  // ⚠ AND HIS RULING THAT BINDS IT TO #12, 28.08: «здесь логика простая: в реальности на текущем счете
  // нет процентного дохода, максимум кешбек, и то не за все, мы для этого делаем Savings как раз. Одни
  // должны друг друга заменить.» So the shelf is not a competitor to the current account's interest –
  // it is its REPLACEMENT, and the decision to move money into it is the mechanic. That is why the
  // top-up control exists at all: without it the replacement cannot be fed.
  //
  // ⚠⚠ AND `shopToneNote` (ROUND 29 #9), for the same reason – Cyrillic may not appear in a template,
  // in a string OR in a comment (tests/template-copy-rules.test.ts):
  // «В строке с машиной и другими вещами Worth now / paid $60,000 / $59,361 – давай последнюю цифру
  // сделаем либо белой, либо жёлтой, с красным перебор.»
  // He is right about what red MEANS. `negative` is `--money-out`, whose documented sense is money
  // LEAVING – a bill, a fare, a cheque. What that figure states is what the thing IS WORTH, which is a
  // BALANCE, and StatRow's own vocabulary already has the word: `plain` = «a number with no direction
  // (a count, a balance)», painted `--ink`, i.e. white. The existing palette, not a new colour. The
  // direction is not lost – it moves to `.shop-row-change`, the signed row that is about a direction.
```

### Round 29 #5 – `shopEliteNote`, yachts, planes and the academy

```ts
  // ⭐⭐ ROUND 29 #5 – `shopEliteNote`, THE OWNER'S OWN WORDS, PARKED HERE FOR THE SAME REASON AS THE
  // two above: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts), and `SHOP_FAMILIES` is read into one.
  //
  // «В магазине всё ещё не хватает яхт, самолётов и стойки академии» – round 29 #5, the ask itself.
  // «Может что-то элитное добавить - яхты или самолеты? Со временем постройки около реальным - купил и
  // ждешь пока будет готово, яхты строят несколько лет.»
  // «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое обслуживание (недельный
  // кост, ага)»
  // «построить свою академию за много миллионов - тоже может быть интересно, кстати. Как раз будет
  // куда рекламное тратить.»
  //
  // ⚠⚠ AND THE ONE THING THIS SCREEN MAY NOT SAY. The plane's fare cut is a MONEY fact and money facts
  // are always on screen here – «a cost the player cannot find» is this repo's own named defect. Its
  // other effect is NOT: «По усталости по аналогии с кортом может 1 накинуть», and the analogy carries
  // his ruling about the court with it – «верно, но только если знают об этом, я предложил сделать
  // бонус скрытым». So no row, no note and no dialog below states a condition number, and none may be
  // added. The spec's §3d rule 4: «Hidden means never a number on a card.»
```

### Round 29 part two #4 – `shopPartSaleNote`, selling part of a holding

```ts
  // ⭐⭐ ROUND 29 PART TWO #4 – `shopPartSaleNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE
  // others: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // «при продаже бумаг надо дать возможность только часть продавать, иными словами при продаже надо
  // дать цифровой инпут для ввода суммы продажи»
  //
  // ⭐ His reasoning, in his own message: a holding money can come back OUT of in parts is a real cash
  // management decision instead of a one-way door. The input is drawn on an 'open' rung only – the
  // same property that decides whether money can go IN in parts – and it is left BLANK by default, so
  // the control still means all of it unless a figure is typed. ⭐ ROUND 35 #12 merged that box with
  // the top-up's, on his own frame, and took the figure out of the button's label: the control says
  // «Sell» and the amount is in the field beside it. What blank MEANS is untouched.
```

### Round 34 #18 – `shopOwnedFrameNote`, the frame on an owned rung

```ts
  // ⭐⭐ ROUND 34 #18 – `shopOwnedFrameNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE
  // others: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // «В магазине те пункты, которые во владении находятся давай цветом выделять рамку жёлтую, как с
  // тренером делали»
  //
  // ⚠⚠ «КАК С ТРЕНЕРОМ ДЕЛАЛИ» IS THE HALF THAT DECIDES THE IMPLEMENTATION. He is naming round-21
  // #11, where the coach the family employs was put in an accent frame, and he is asking for THAT
  // frame rather than for a yellow border in general. So `.shop-row.is-owned` in the style block below
  // carries `.cm-row.current`'s own three declarations and reads the same `--accent`; there is no
  // second convention to keep in step with the first.
  //
  // ⚠ NO WORD, PRICE OR CONTROL MOVED WITH IT. The card already says what it says on an owned rung
  // («Worth now», the units, the change since they bought it); this item adds a frame around the card
  // and nothing else, which is CLAUDE.md invariant 4 read literally.
```

### Round 34 #20 – `shopInlineActionNote`, the two controls beside the field

```ts
  // ⭐⭐ ROUND 34 #20 – `shopInlineActionNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE
  // others: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // «Кнопки put more in, sell it в разделе invest давай в одну строку с инпутами»
  //
  // ⚠ IT IS A LAYOUT ITEM AND NOTHING ELSE MOVED. Both controls kept their sentence, their `disabled`
  // predicate, their command and their `v-if` – what changed is that each now sits in a
  // `.shop-stake-row` beside the field it acts on instead of under it. The two rungs this is visible
  // on are the deposit and the index fund, which is «в разделе invest» exactly: `isTopUp` is the
  // property that draws an amount field at all.
  //
  // ⚠⚠ AND IT IS MEASURED AGAINST A PHONE, which is round-20 #3 read on a row instead of a dialog. A
  // row that fits at desktop width and pushes its button off a 375px screen is a worse defect than the
  // stack it replaced, so `.shop-stake-row` wraps rather than overflows and
  // tests/component/round34-money-shelf.test.ts asserts the whole row inside 375x667 with the
  // `fits.ts` instrument. The label column carries `min-width: 0` for that reason: a flex item's
  // default `min-width: auto` refuses to shrink below its content and is the usual way a row like this
  // leaves the screen.
```

### Round 29 part two #6 – `shopAlwaysOpenNote`, the shop open from the start

```ts
  // ⭐⭐ ROUND 29 PART TWO #6 – `shopAlwaysOpenNote`, HIS RULING, PARKED HERE FOR THE SAME REASON AS
  // the three above: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // «магазин открыт всегда с начала игры»
  //
  // So `shop.unlocked` / `shop.lockedDetail` are gone from the protocol, the engine's gate is gone
  // with them (engine/world/shop.ts writes out what went and why), and the shelf's chapter here no
  // longer has a shut arm. ⭐ It also closes round 29's ask 12b: the junior years, where removing the
  // current account's interest bites hardest, now have the instrument that replaces it.
```

### Round 41 #28 – `buildProgress`, the build ring

```ts
  /** ⭐ ROUND 41 #28 – THE BUILD RING. «добавим в уголке картинки наш круглый гаудж… чтобы он
   *  показывал в процентах прогресс стройки от 0 до 100» – the export's own ProgressRing (Home's
   *  condition ring), at the NEW 36px he asked for («чуть меньше размером, чем на главной»), on the
   *  art corner of every tile that builds to order – academy stages, boats, planes alike, because
   *  the predicate is the engine's `readyWeek`/`buildWeeks` pair and never a family list.
   *  Progress is derived, zero state: the weeks already served over the row's own `buildWeeks`.
   *  Clamped both ends – a row seen on its order week reads 0, never a negative.
   *
   *  ⚠ AND IT HIDES AT 100%, his second word on the item: «когда заполнен на 100% (построено) больше
   *  не надо показывать, только в процессе стройки». The markup's `v-if` carries it. The quote lives
   *  HERE rather than beside that `v-if` because `tests/template-copy-rules.test.ts` forbids Cyrillic
   *  anywhere in the markup block – strings and comments alike – and its own failure message names
   *  this remedy: move the owner's quote to the script side.
   *
   *  ⚠⚠ AND THE OPENING TAG MAY NOT BE SPELLED IN THIS FILE'S SCRIPT AT ALL, which is the second half
   *  of the same lesson and cost a red run to learn. That test slices from the FIRST literal opening
   *  tag to the LAST closing one, so one in a script comment moves the start marker up and hands the
   *  scan ~670 lines of script – whereupon every owner quote in this block reads as an offender. Same
   *  family as round 36 P2-1's «neither HTML comment delimiter may be spelled inside one». */
```

### Section 3f – `buildWaitLine`, the wait in the unit a person thinks in

```ts
  /** ⭐ §3f – HOW LONG THE FAMILY WOULD BE WAITING, in the unit a person thinks in. The engine's
   *  `buildWeeks` is weeks, which is the right unit for the calendar and a bad one for «yachts take
   *  years».
   *
   *  ⚠⚠ MONTHS UNDER TWO YEARS AND YEARS ABOVE IT, WHICH IS §3f's OWN TABLE READ BACK: «~12 months»,
   *  «~18 months», «~2 years», «~3 years», «~4 years». That is not a style choice – a single unit
   *  either turns eighteen months into «1.5 years» or into a wrong «2 years», and the spec already
   *  chose. ⚠ WHOLE NUMBERS EITHER WAY (the owner's display ruling of 26.08: «у пользователя целые в
   *  интерфейсе»); the wait itself is whole weeks and the due date the row prints once ordered is the
   *  engine's own. */
```

### Round 30 #11 – `rateLine`, why the words changed and the engine was checked first

```ts
    // ⭐⭐⭐ ROUND 30 #11 – RE-WORDED, AND THE ENGINE WAS CHECKED BEFORE A WORD MOVED.
    //
    // THE OWNER, 30.08: «И как будто бы Holds its value странно звучит тоже – это напрямую значит, что
    // оно обесценивается, а это вроде бы не совсем так.»
    //
    // ⚠⚠ HE IS RIGHT AND THE ENGINE SAYS SO. A rung at `annualRateBps: 0` is worth `paidCents x 1^n` –
    // exactly what was paid for it, every week, forever – and `sellAsset` hands back `valueCents`
    // whole with no spread, no fee and no haircut. There is no inflation anywhere in this engine, so
    // there is not even a real-terms slide hiding behind the nominal figure. It does NOT depreciate;
    // the words were the only thing suggesting it might. ⭐ AND THE ROW HE WAS PROBABLY READING IT ON
    // IS GONE FROM THIS BRANCH ENTIRELY – the merch brand is priced as a business one line up, which
    // is item 9, his own next sentence.
    //
    // ⚠ THE PARALLEL IS THE POINT: its two siblings are about a RATE («Loses 6% a season», «Gains
    // about 7% a season») and the third had better be a rate too. «Neither gains nor loses» is the
    // zero of that sentence and cannot be read as a slow slide. It is now said of the four academy
    // stages and of nothing else.
```

### Round 30 #14 – `shopUnitsNote`, the units a holding is made of

```ts
  // ⭐⭐⭐ ROUND 30 #14 – `shopUnitsNote`, HIS RULING, PARKED HERE AND NOT IN THE TEMPLATE, for the
  // reason every other note in this block carries: Cyrillic may not appear in a template, in a string
  // OR in a comment (tests/template-copy-rules.test.ts). ⚠ AND THE TAG IS NOT SPELLED OUT HERE, which
  // is not fussiness – `templateOf` in that test scans from the FIRST literal opening tag in the file,
  // so a script-side note that writes the tag out drags the whole script into the scanned region and
  // fails the guard on its own comment. Every sibling note above says «a template» for that reason.
  //
  // «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это то, что я видел…
  // И надо логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут возможность расти на
  // горизонте и будут давать разные точки входа, как в жизни. Стоимость активов будет рассчитываться
  // исходя из стоимости долей. Зашёл, когда доля стоила 4к, через десять лет она может вполне
  // удвоиться. Или зашёл на пике при цене 7-8к и увидел просадку на следующий год – имеешь возможность
  // усредниться или зафиксировать убыток.»
  //
  // ⚠⚠ THE TWO LINES BELOW ARE THE WHOLE OF WHAT THIS ITEM ADDS TO THE SCREEN, and that is invariant 4
  // read literally: a mechanic that cannot be decided without a number gets that number and nothing
  // else moves. He asked to be able to average down or take a loss; both need the same three figures –
  // how many units they hold, what they averaged at, what one costs today – and none of the sentences
  // already on this row is touched, re-worded or removed.
  //
  // ⚠ THE UNOWNED LINE EXISTS FOR «зашёл на пике при цене 7-8к»: the entry price is a fact about the
  // WEEK, so a family looking at the row before it buys is looking at the price it would pay.
```

### Round 34 #19 – `shopChartNote`, the fund’s chart and the four windows

```ts
  // ⭐⭐⭐ ROUND 34 #19 – `shopChartNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE OTHERS:
  // Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // «для индексного фонда давай график нарисуем с точками его стоимости за пай с возможностью выбрать
  // промежуток… 6 месяцев, 1 год, 2 года, 5 лет. Мы же сможем хранить по одной цифре за месяц средней»
  //
  // ⚠⚠ HIS LAST SENTENCE WAS ANSWERED, AND THE ANSWER IS «WE DO NOT HAVE TO». `unitPriceCents` is a
  // pure function of the career seed and the week, so a monthly series is DERIVED on every read and
  // nothing is written to the save. The full argument – and the one thing storage would have bought –
  // is in `unitPriceHistory`'s header in engine/world/assets.ts. What it means for HIM is the part
  // worth saying twice: his live career opens the chart with every month it has already played, where
  // a stored series would have started empty and filled up over the next five years.
  //
  // ⚠ THE FOUR WINDOWS ARE HIS FOUR, and the numbers live in `SHOP_PRICE_RANGE_MONTHS` (the protocol)
  // so the engine's series length and this picker cannot disagree. Only the WORDS are here.
  //
  // ⚠ THIS SCREEN DOES NOT PRICE ANYTHING, which is the shelf's own standing rule: every point is
  // whole cents the engine already rounded, and the geometry below maps cents onto a viewBox and does
  // no money arithmetic at all.
```

### v78, round 41 #22 – `chartMarks`, where the family bought

```ts
  /** ⭐⭐⭐ v78, ROUND 41 #22 – WHERE THE FAMILY BOUGHT, AS GEOMETRY. One mark per purchase inside the
   *  OPEN window, placed on the line the chart already draws.
   *
   *  The owner's words are in `shopMarksNote` below (no Cyrillic in a template, and none in a comment).
   *
   *  ⚠⚠ THE MARK SITS ON THE LINE AND NOT AT THE PRICE THEY PAID, which is a decision and not a
   *  shortcut. The line is a MONTHLY MEAN – the engine averages the weeks of each month into one
   *  figure – and a purchase happens in a WEEK, at that week's price, which can sit outside the
   *  window's own low..high. A mark drawn at the true entry price would therefore float off the line,
   *  or be clipped by the box, on exactly the volatile months the chart exists to show. So the mark
   *  answers WHERE on this chart the purchase falls, and the popup carries what it actually cost –
   *  which is also the split the owner asked for («отметки на графике» + «микро попап… с суммой и
   *  датой»).
   *
   *  ⚠ A PURCHASE OLDER THAN THE OPEN WINDOW IS NOT DRAWN, rather than pinned to the left edge: a mark
   *  at the edge of a six-month view would claim a week that view does not cover. Widen the window and
   *  it appears. ⚠ AND `x` IS INTERPOLATED WITHIN THE MONTH, so two purchases in the same month are two
   *  marks at two places rather than one mark on top of another.
   *
   *  ⚠ NO MONEY ARITHMETIC – the cents and the per-unit price arrive whole off the wire
   *  (`ShopPurchaseView`), and this maps weeks and cents onto a viewBox exactly as `chartPlot` does. */
```

### `markAlign` – which way the bubble leans

```ts
  /** WHICH WAY THE BUBBLE LEANS – the left third of the plot pushes it right, the right third pushes
   *  it left, and the middle centres it. Spent as `justify-content` on a full-width row rather than as
   *  a `left` percentage on the bubble itself.
   *
   *  ⚠⚠ THIS SHAPE IS A FIX AND THE FIRST ONE WAS MEASURED WRONG, which is worth the paragraph because
   *  the failure is round-20 #3's in miniature. The first draft did what a tooltip usually does –
   *  `left: <mark>%` with `translateX(-50%)`, clamped to `[18%, 82%]` – and it read perfectly well at
   *  1280. Measured against a 375x667 phone through the real cascade
   *  (`tests/component/round41-fund-marks.test.ts` §C), the bubble's HALF-width came out at 77.6px
   *  against an 18% margin of 62.8px: on the owner's own device the first and last marks would have had
   *  their bubble CUT OFF by `.tb-card--photo`'s `overflow: hidden`. A percentage clamp cannot be
   *  right, because the thing it has to clear is measured in px and the margin is measured in %.
   *
   *  ⭐ SO THE BUBBLE IS NEVER POSITIONED BY ITS CENTRE AT ALL. It is a child of a row that spans the
   *  plot exactly, with `max-width: 100%`, so it CANNOT leave the box whatever it contains – the
   *  geometry is clip-proof by construction rather than by a number that has to be re-checked every
   *  time the copy or the font changes. What the lean buys is that a mark at the left edge still gets
   *  its bubble over it rather than over the middle of the chart. */
```

### Round 41 #22 – `shopMarksNote`, the marks that waited for a schema move

```ts
  // ⭐⭐⭐ ROUND 41 #22 – `shopMarksNote`, HIS WORDS, PARKED HERE for the reason the note above it gives:
  // Cyrillic may not appear in a template, in a string OR in a comment.
  //
  // «В index fund можем делать отметки на графике когда была покупка с микро попап при hover/клике с
  // суммой и датой?»
  //
  // ⚠⚠ THE ITEM WAITED A MONTH FOR A SCHEMA MOVE, AND THAT WAIT IS THE INTERESTING HALF. Round 41
  // measured that no persisted road existed for «when, and how much»: `boughtWeek` is the FIRST buy
  // only, `paidCents` a blended net sum a top-up adds to and a part sale scales down, the feed rows
  // un-keyed prose capped at 400/50 and prunable, the ledger weekly category totals mixing buys, sells
  // and upkeep. The degraded one-mark version would have printed a number the family never paid on any
  // topped-up holding, and it was REFUSED rather than shipped. v78's `OwnedAsset.entries` is the road.
  //
  // ⚠ SO A HOLDING BOUGHT BEFORE v78 CARRIES NO MARKS AT ALL, and that is the honest answer rather
  // than a padded one – the same shape `priceHistory`'s own note takes for a young career. The chart
  // draws no mark because there is none, and the next purchase starts the record.
```

### Round 30 #8 and #10 – `shopNamingNote`, naming a purchase

```ts
  // ⭐⭐⭐ ROUND 30 #8 AND #10 – `shopNamingNote`, HIS ASK, PARKED HERE AND NOT IN THE TEMPLATE for the
  // reason every other note in this block carries: Cyrillic may not appear in a template, in a string
  // OR in a comment (tests/template-copy-rules.test.ts).
  //
  // #8: «Merch brand давай предложим пользователю несколько вариантов именования при покупке… один из
  // вариантов "ввести своё название" – это придаст +100 к индивидуальности сразу. Среди вариантов по
  // дефолту могут быть инициалы ребёнка или что-то связанное с именем или фамилией.»
  // #10: «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно предложить
  // уже существующее название бренда (если он есть) или снова "ввести своё".»
  //
  // ⚠⚠ THE FOUR RULES FOR THE TYPED VALUE ARE THE ENGINE'S AND NOT THIS SCREEN'S – `sanitiseAssetName`
  // in `world/assets.ts` states all four (a 24-code-point cap, an allow-list, an empty entry becoming
  // the first suggestion, and collapsed whitespace) and `buyAsset` applies them to whatever arrives.
  // What this screen does is make the cap FELT rather than applied silently: `maxlength` is the same
  // constant, imported rather than retyped. A screen that validated instead of the engine would be
  // invariant 1 broken in the direction the worker exists to prevent.
  //
  // ⚠ AND THE SUGGESTIONS ARE THE ENGINE'S TOO (`ShopRowView.nameOptions`), because whether a purchase
  // names anything is a fact about the world – it is the FIRST rung of a nameable family – and a
  // screen that worked it out would be a second copy of `buyAsset`'s own question.
```

### Round 29 part two #4 and round 35 #12 – how much to sell, and one field for both verbs

```ts
  // ⭐⭐⭐ ROUND 29 PART TWO #4 – HOW MUCH OF IT TO SELL. His words are in `shopPartSaleNote` below
  // (no Cyrillic in a template, and none in a comment a template reads).
  //
  // ⚠ IT HAD THE SAME SHAPE AS THE STAKE INPUT ABOVE, deliberately: DOLLARS as typed, kept as a STRING
  // so a half-typed figure is not coerced, and `sellCentsFor` is the one place it becomes cents. Blank
  // means «all of it», which is what the control said before this item and still says.
  // ⭐⭐ ROUND 35 #12 TOOK «the same shape» TO ITS CONCLUSION: two fields of identical shape on one
  // card are one field, and he had already drawn it that way. The ref is gone; the reader below is
  // unchanged bar the value it reads.
  // ⭐⭐⭐ ROUND 35 #12 – `shopOneFieldNote`, THE OWNER'S OWN WORDS, PARKED HERE AND NOT IN THE
  // TEMPLATE (no Cyrillic in a template, in a string OR in a comment – tests/template-copy-rules.test.ts).
  //
  // «инвесту разрешил ответить "делать нечего" - нет, не так, сверься с макетами пожалуйста, там две
  // кнопки о поле инпута одно, всё в ряд стоит»
  //
  // ...and, on the two labels, closing the question this item opened:
  // «"Add more" и "Sell" - хорошо, меньше места занимают»
  //
  // ⚠⚠ SO ROUND 34 #20 WAS HALF THE ITEM AND THIS IS THE OTHER HALF. #20 put each control beside its
  // own input, which is «в одну строку с инпутами» satisfied twice – and left a holding carrying TWO
  // number fields. The frame he drew (W-shop-investments.png) has ONE, with both buttons after it, and
  // he checked it against the build himself. The controls, their `disabled` predicates, their commands
  // and the engine's minimum are all unchanged; what changed is that they now read ONE value.
  //
  // ⭐ THE SHORTER WORDS ARE HIS AND THE REASON IS HIS TOO – «меньше места занимают». That is not a
  // preference, it is the measurement: three controls have to share one line at 375px, and
  // «Sell it for $12,000,000» is the longest string this card can produce. `tests/component/
  // round35-money-invest.test.ts` measures the row with the shorter words in place, which is the only
  // reading worth having.
  //
  // ⚠ BLANK STILL MEANS «ALL OF IT» on the Sell side – `sellCentsFor` returns null and `askSell`
  // sells the whole holding, exactly as it did when the field was its own. And blank cannot buy: the
  // engine's minimum is the floor and `canBuy` refuses a zero, so one field driving two verbs has one
  // unambiguous reading of an empty box per verb.
```

### `sellCentsFor` – null when the box is empty, and clamped nowhere

```ts
  /** Null when the box is empty or unusable – the caller then sells the whole holding, which is the
   *  engine's own `amountCents === undefined`. ⚠ CLAMPED NOWHERE: `sellAsset` re-derives the floor and
   *  the ceiling and returns its own sentence, and a screen that silently corrected the number would
   *  be the R10-16 defect (a control and a refusal telling two stories).
   *
   *  ⚠⚠ ROUND 35 #12 POINTED IT AT `stakeDollars` AND DELETED `sellDollars`. There is one field on the
   *  card now, so there is one value; a second ref would be a value nothing on screen can show, which
   *  is worse than the two fields it replaced. */
```

### Round 43 #5 – `shelfShareNote`, why the Business tab names the split

```ts
  // ⭐⭐ ROUND 43 #5 – `shelfShareNote`, WHY THE BUSINESS TAB NOW NAMES THE SPLIT. Parked here for
  // this file's standing reason (no Cyrillic in markup), and it is a defect report rather than a
  // feature request: he asked whether Zoe's brand was right, because the two numbers on screen could
  // not be reconciled.
  //
  // «Наверху вкладки Business можно добавить строчку про ту долю, которая уходит в семью и ей
  // отдельно, сказав, что видимые суммы - это семейный чистый доход» (16.09)
  //
  // ⚠ THE ARITHMETIC WAS NEVER WRONG. `worth = weekly GROSS × 52 × multiple`, the multiple capped at
  // `value.maxX = 20`; his $13k/wk beside $28M reads as 41x and looks impossible. But $13k is the
  // FAMILY's cut after her prize-ramp share, so the gross is $32.5k/wk and the multiple is 16.6x –
  // inside the band. The screen put his 40% beside the whole business's worth and named neither.
```

### Round 34 #16 – `SHELF_TAB_OPTIONS`, Business beside Invest

```ts
  // ⭐⭐ ROUND 34 #16 – BUSINESS SITS NEXT TO INVEST NOW, AND THE ORDER IS THE WHOLE ITEM.
  //
  // THE OWNER, 02.09: «Business пододвинуть к Invest в магазине»
  //
  // ⚠ ONLY THE ORDER MOVED. Round 30 #5 shipped these six in the order he first spelled them
  // («Invest / Cars / Property / Business (Academy is subdivision inside) / Water / Air») and every
  // LABEL, title and family map below is untouched – CLAUDE.md invariant 4, and this item asked for a
  // position rather than a word. What he is grouping is real: Invest and Business are the two rungs of
  // the shelf that are about money COMING BACK, and Cars / Property / Water / Air are the four that
  // are about spending it. Reading them apart put two pages between the only pair a player compares.
  //
  // ⚠ AND `SHOP_FAMILIES` IS NOT REORDERED WITH IT, deliberately. That array is the order INSIDE a
  // tab – it is what puts the brand above the academy under Business – and nothing on screen reads it
  // across tabs. Moving it too would have been a second change nobody asked for.
```

### Round 35 #3 – `shopHome`, the shop’s front door

```ts
  // =================================================================================================
  // ⭐⭐ ROUND 35 #3 – THE SHOP HAS A FRONT DOOR NOW
  // =================================================================================================
  //
  // THE OWNER: «главная магазина становится главной с текущей the shelf, выбором категорий из 6
  // карточек (название категории встает на карточку внизу шрифтом Sora, первый ряд invest, business,
  // property, остальное 2й ряд), ниже her account с фоточкой как в макете (а также на каждой странице
  // магазина), большой картинки делать не будем пока что».
  //
  // ⚠⚠ AND ITEM 10 IS WHY THIS IS A FLAG AND NOT A SEVENTH SEGMENT: «переключалка между категориями
  // магазина на самих страницах магазина остается текущей и не меняется.» `shelfTab` and
  // `SHELF_TAB_OPTIONS` above are untouched – not a label, not an order, not a value. The home is a
  // state BEFORE any of them, so the switcher never has to represent it and cannot be widened by it.
  //
  // ⚠ HIS ROW ORDER, NOT THE MOCKUP'S. Frame V draws Invest / Cars / Property on the first row; he
  // asked for «первый ряд invest, business, property, остальное 2й ряд» – the three that earn, then
  // the three that spend. The order lives in `SHELF_CATEGORY_KEYS` (src/art/shelf.ts), beside the
  // paintings it is the order of, and `tests/component/round35-shop.test.ts` holds the grid to it.
  //
  // ⚠ THE WORDS ARE THE SWITCHER'S OWN AND ARE NOT RE-TYPED. A category card's name is the tab's
  // `label` and its title is the tab's `title`, read out of `SHELF_TAB_OPTIONS` above. So the six
  // cards and the six segments cannot drift, and CLAUDE.md invariant 4 has nothing to catch here:
  // this slice adds no user-facing string at all except the back control's accessible name.
  //
  // ⚠ THE MOCKUP'S BIG HERO IMAGE IS NOT BUILT – «большой картинки делать не будем пока что».
```

### Round 36 review #10 – `openChapter`, the arrow goes and the chapter button is the way out

```ts
  // =================================================================================================
  // ⭐⭐ ROUND 36 REVIEW #10 – THE ARROW GOES, AND THE CHAPTER BUTTON BECOMES THE WAY OUT
  // =================================================================================================
  //
  // THE OWNER, 04.09: «Внутри магазина на внутренних страницах нижнюю стрелку "назад" надо убрать -
  // точка входа в магазин всегда общая страница категорий, по клику на Shop мы на нее же попадаем.»
  //
  // ⚠⚠ TWO CLAUSES, AND THE SECOND ONE IS WHAT MAKES THE FIRST SAFE. Round 35 #3 built the two-level
  // shop and its own test spelled out why the arrow was there: «a level you can enter and not leave»
  // is round-20 #3's family, and «press the chapter tab again» was rejected as a way out because it
  // WAS NOT ONE – `screenTab` never left `shop`, so pressing Shop from inside Cars did nothing at all.
  // His second clause is exactly that missing behaviour, so the guard is not deleted with the arrow;
  // it is RE-AIMED at the control he named, and `tests/component/round35-shop.test.ts` presses Shop
  // where it used to press the arrow.
  //
  // ⚠⚠ WHY THIS IS A CLICK ON THE ROW AND NOT A `watch`, AND NOT `@update:model-value` EITHER. Both
  // of the obvious hooks are silent in exactly the case he is complaining about – standing inside
  // Cars and pressing Shop:
  //   * a `watch` on `screenTab` never fires, because the value is already `shop` and an unchanged
  //     ref triggers nothing;
  //   * `@update:model-value` never fires either, and that one was BUILT AND MEASURED before it was
  //     replaced. Vue 3.5's `useModel` (runtime-core, `set()`) RETURNS EARLY when the new value has
  //     not changed, so `SegmentedRow` emits nothing at all on a press that re-selects the open
  //     chapter. A listener there would have passed every test that pressed Shop from another
  //     chapter and done nothing for the press he actually named.
  // The press itself is the only signal that exists for «I asked for this chapter again», so that is
  // what is read: a click that came from a BUTTON inside the chapter row. It reads no label and no
  // value – any chapter press returns the shop to its front door, which is his sentence generalised
  // rather than narrowed («точка входа в магазин ВСЕГДА общая страница категорий»), and on the three
  // chapters that are not the shop it changes nothing anybody can see.
  //
  // ⚠ `closest('button')` AND NOT THE ROW ITSELF, so a click landing on the row's own background is
  // not a navigation. Keyboard activation of a pill dispatches a real `click`, so the route is not
  // mouse-only.
  //
  // ⚠ AND THE DOOR AGREES WITH THE BUTTON. Nothing else in the app sets `screenTab` to `shop` (the
  // ledger's own `showAllTransactions` sets `history`), and the screen mounts on `spend` with
  // `shopHome` true – so a player arriving at Family Budget for the first time also lands on the six
  // cards.
```

### Round 35 #5 to #9 – `SHELF_ART_SIDE`, which side a rung’s painting stands on

```ts
  // =================================================================================================
  // ⭐⭐ ROUND 35 #5, #6, #7, #8, #9 – WHICH SIDE A RUNG'S PAINTING STANDS ON
  // =================================================================================================
  //
  // ⚠⚠ ONE MAP, BECAUSE IT IS ONE DECISION AND HE MAY WANT IT THE OTHER WAY ROUND. Two of his
  // sentences set it, and they set it in opposite directions on purpose:
  //
  //   cars     «картинки будут квадратными на всю высоту карточки с небольшим градиентом СПРАВА (как
  //            на тренерах)» – the coach cards are `.cm-art` at `left: 0` under a 90deg mask that
  //            fades out at its RIGHT edge, so «gradient on the right» is a painting on the LEFT.
  //   property «но картинка с ДРУГОЙ стороны … и градиент СЛЕВА» – the other side from the cars, with
  //            the fade on its left, so the painting is on the RIGHT.
  //   water    «карточки как на домах» – so water follows property, and so does air («как на домах»).
  //   academy  «как на экране машин, такой же принцип, можно переиспользовать» – so it follows cars.
  //
  // ⭐ His own mockup agrees on both: frame X puts the car photo on the left, frames Z and AA put the
  // house and the boats on the right under a `linear-gradient(90deg, transparent 0%, #000 40%)`.
  // ⚠ THE BRIEF THIS WAVE ARRIVED WITH SAID THE OPPOSITE («cars and water on the RIGHT, property on
  // the LEFT»), which cannot be reconciled with «water – карточки как на домах»: that clause makes
  // water and property the SAME side, whichever side that is. His words and his frames win, the
  // disagreement is recorded in docs/rounds/round-35-shop.md, and flipping it is this one map.
```

### Round 36 review #11 – `SHELF_WIDE_ART`, the painting takes half the card

```ts
  // =================================================================================================
  // ⭐⭐ ROUND 36 REVIEW #11 – THE PAINTING TAKES HALF THE CARD ON FOUR OF THE FAMILIES
  // =================================================================================================
  //
  // THE OWNER, 04.09: «На Air, Water, Property, Cars давай для всех картинок еще чуть больше
  // горизонтального места дадим, самим картинкам `width: 50%`, а `shop-row-body padding-right:
  // calc(45% + 12px)`»
  //
  // ⭐⭐ THE TWO DECLARATIONS ARE HIS AND ARE USED VERBATIM – `50%` and `calc(45% + 12px)`, not a
  // number of ours near them. What is NOT verbatim is the property NAME on the second one, and that
  // is the one place his sentence could not be copied blind: three of the four families he lists
  // (Property, Water, Air) carry the painting on the RIGHT, so `padding-right` is the inset that
  // clears it; CARS carry it on the LEFT (`SHELF_ART_SIDE` above, his own «как на тренерах»), and
  // `padding-right` there would have pushed the words AWAY from the painting and, with the existing
  // left inset still in place, left the sentences about 10% of the card to live in. So the rule is
  // «his number, on the side the picture is on», which is what the round-35 pair already said twice.
  // It is a decisions row (docs/specs/responsive-decisions-2026-09.md), not a silent adjustment.
  //
  // ⚠ HER ACADEMY IS NOT IN THIS SET, and it is the family this most looks like it should be. The
  // academy rows are `--art-left` exactly like the cars (his «как на экране машин»), so a rule keyed
  // on the SIDE would have swept them up; he named four families and the academy is not one of them,
  // which is CLAUDE.md invariant 4's rule applied to a proportion instead of a word. It keeps round
  // 35's 40 / 60. ⭐ One name in the array below moves it, if he wants the pair to match.
  //
  // ⚠ AND `investment` / `business` HAVE NO PAINTING AT ALL, so they are untouched by construction:
  // `shopRowArtSide` returns null for a rung with no art and the class never lands.
```

### Round 36 review #12 and #13 – `SHELF_NO_PAID_META`, the paid line goes

```ts
  // =================================================================================================
  // ⭐⭐ ROUND 36 REVIEW #12 AND #13 – THE SAME CHANGE ON TWO FAMILIES, MADE ONCE
  // =================================================================================================
  //
  // THE OWNER, 04.09, twice in the same words:
  //   #12 «С купленной машины убираем paid серые буквы, кнопка buy/sell встает слева ближе к нижнему
  //        правому углу карточки»
  //   #13 «В разделе Her Academy убираем paid серые буквы, кнопка buy/sell встает слева ближе к
  //        нижнему правому углу карточки»
  //
  // Two items, one change, so there is one array and one rule rather than a copy of each. Cars and the
  // academy are also the two families whose control was still standing at the LEFT of its own row –
  // «кнопка … слева» is where it IS, and «ближе к нижнему правому углу карточки» is where it goes.
  // The four families that carry their painting on the right have had their control in that corner
  // since round 35 #6, so this is the shelf agreeing with itself, not a second arrangement.
  //
  // ⚠⚠ AND THE `paid` LINE REALLY IS A FIGURE LEAVING THE SCREEN, WHICH WAS CHECKED BEFORE IT WENT.
  // Round 35 #7 removed it from the houses on his own reason – «раз прибавка и так видна» – and the
  // same has to be TRUE here or the number is simply lost. It is: `.shop-row-change` is drawn
  // unconditionally inside `.shop-row-owned` (it has no `v-if`), and the engine fills it for every
  // owned rung – `changeCents = valueCents - paidCents + realisedGain`, src/engine/world/shop.ts. So
  // a car and an academy stage both print «Worth now $X» and «-$Y since you bought it (-Z%)», and
  // what was paid is X - Y, exactly as on a house. ⭐ Nothing is re-worded: the meta simply stops
  // being passed, which is the round 35 mechanism on two more families.
  //
  // ⚠ WATER AND AIR KEPT THEIRS UNTIL ROUND 39 #4. Round 36 could not take them – he had named cars
  // and the academy, boats and aeroplanes were in neither sentence, and invariant 4 does not let a
  // proportion spread on its own any more than a word does. Then he named them, 08.09: «В яхтах и
  // (подразумеваю) самолётах на уже купленных тоже убрать с карточки серую надпись „paid ..."» – the
  // «тоже» is round 36's own change asked for on the two families it deliberately left. The figure
  // survives the same way it did there: an OWNED boat or plane prints «Worth now $X» and the gain
  // line, so what was paid is still X - Y.
  //
  // ⚠ THAT LEAVES `paid $N` ON `investment` AND `business` ONLY – still unnamed, still kept. And the
  // `On order` row (water and air are BUILT to order) kept its own `paid $N` untouched THROUGH ROUND
  // 40, as it was under round 36: on that card there was no `Worth now` and no gain line, so the paid
  // figure was the ONLY money on it – removing it there would have failed the very check that let it
  // go here, and «Ordered, not bought» is the shelf's own word for a rung that is not yet an owned one.
  //
  // ⚠⚠ ROUND 41 #2 SUPERSEDES THIS FOR THE `On order` ROW ONLY, and the history above is kept rather
  // than deleted because the reasoning was sound at the time. The owner, 12.09: «Не убрали paid from
  // water на заказанных, надо и другие категории проверить» – he read the ordered card's `paid $N` as
  // the SAME leftover round 39 #4 removed from the owned card, not as a figure this screen had
  // deliberately kept. His report is the newer ruling, so the meta is now gone from the `On order`
  // StatRow too – see the template, `label="On order"`, no `:meta` any more. It is one unconditional
  // site, so water (boats) and air (planes) both lose it at once, which is the "other categories"
  // half of his ask; `investment` and `business` were never his target and are untouched by this.
```
