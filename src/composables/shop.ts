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
import { computed, ref, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import type { ShopPricePoint, ShopPurchaseView, ShopRowView } from '../shared/protocol'
import { monthLabel, weekLabel } from '../shared/dates'
import { formatCents } from '../shared/money'
// ⭐ ROUND 30 #5 / ROUND 35 #3 – the paintings' own module. `shelfArtUrl` is what decides whether a
// rung has a band at all (see `shopRowArtSide`), and `SHELF_CATEGORY_KEYS` is HIS row order for the
// six category tiles, kept beside the paintings it is the order of.
import { SHELF_CATEGORY_KEYS, shelfArtUrl } from '../art/shelf'

/** Everything the shelf's two surfaces read: `ShopPanel.vue`'s markup and, for the confirmation
 *  question and the front door, `MoneyScreen.vue` itself.
 *
 *  ⚠ IT IS THE RETURN TYPE RATHER THAN A HAND-WRITTEN LIST OF FORTY-FIVE MEMBERS, deliberately. A
 *  second statement of the same shape is a second thing to keep in step, and this one would be a
 *  long one – the failure mode where a member is added to the object and forgotten in the interface
 *  is exactly what `ReturnType` cannot have. The object literal at the foot of `useShop` is the
 *  contract, and it is grouped and commented there. */
export type ShopState = ReturnType<typeof useShop>

/** ⚠ HOISTED TO MODULE SCOPE BY E-11, 28.09, FOR ONE MECHANICAL REASON: `ShopState` is
 *  `ReturnType<typeof useShop>`, and TypeScript refuses to name a return type that mentions a type
 *  declared inside the function (TS4060, measured). Both declarations are byte-identical to the ones
 *  that stood at MoneyScreen.vue:1541-1559 and :1801 – de-indented and exported, nothing else. The
 *  blank line each left behind in the body is where it was. */
export type ShelfTab = 'invest' | 'cars' | 'property' | 'business' | 'water' | 'air'

export interface PendingShop {
  kind: 'buy' | 'sell'
  id: string
  label: string
  amountCents: number
  changeCents: number | null
  /** ⭐ ROUND 29 #11 – adding to a holding they already have, rather than opening one. */
  topUp?: boolean
  /** ⭐ ROUND 29 PART TWO #4 – set only when this is a PART sale, so the question can say so. */
  partCents?: number
  /** ⭐ ROUND 29 #5 – how long they would be waiting, in weeks. 0 on everything that arrives at
   *  once, which is every rung the shelf had before §3f. */
  buildWeeks?: number
  /** ⚠ ...and what keeping it costs a week. §3f's whole argument is that this is the number the
   *  decision is actually about, so it is on the question and not only on the row. */
  upkeepCents?: number
  /** ⭐ ROUND 30 #8/#10 – what the family is calling it, on the one purchase that names it. */
  name?: string
}

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
export function useShop(week: ComputedRef<number>) {
  const game = useGameStore()

  // ================================ THE SHELF (v63) =================================================
  // docs/specs/the-shop-2026-08.md §2, §3a-c. The parent's own money, and the first screen in this game
  // where it is his to enjoy.
  //
  // ⚠⚠ EVERY NUMBER BELOW IS THE ENGINE'S. This block reads `snapshot.shop` and formats it – it never
  // prices a rung, never applies a rate, never subtracts a paid price from a current one and never
  // rounds a percentage. `shopView` (engine/world/shop.ts) did all four, once, which is the same rule
  // `kitLines` above is written under and the reason §5 stores `valueCents` instead of deriving it.
  const shop = computed(() => game.snapshot?.shop ?? null)
  const shopRows = computed<ShopRowView[]>(() => shop.value?.rows ?? [])
  /** The three families, in the order the shelf is read. The note under each is what the family IS
   *  FOR – a shop where the only difference is price is a list, not a decision (spec §3). */
  const SHOP_FAMILIES: { key: ShopRowView['family']; title: string; note: string }[] = [
    {
      key: 'investment',
      title: 'Investments',
      note: 'Money that stays money. Each one names a minimum, not a price – put in what you like above it.',
    },
    {
      key: 'car',
      title: 'Cars',
      note: 'Every one of these is worth less next season than it is today. That is what a car is.',
    },
    { key: 'house', title: 'Property', note: 'Slow, large, and the end of paying somebody else rent.' },
    // ⭐⭐ ROUND 29 PART FOUR P7 – THE PARENT'S OWN BUSINESS, and the first rung on the shelf that
    // EARNS. His words are in `shopBusinessNote` in the comment block below (Cyrillic may not appear
    // in a template, and this array is read into one). The note says what the family is FOR – §3's
    // own rule – and names the axis out loud: fame, never rank.
    {
      key: 'business',
      title: 'The business',
      note: 'The first thing on this shelf that earns. What it brings in follows how known she is – the shoots and the titles – not her ranking.',
    },
    // ⭐⭐ ROUND 29 #5 – THE THREE STOREYS THE OWNER ASKED FOR. His words are in `shopEliteNote` in the
    // comment block below (Cyrillic may not appear in a template, and this array is read into one).
    // Each note says what the FAMILY is for, which is §3's own rule: «a shop where the only difference
    // is price is a list, not a decision».
    {
      key: 'boat',
      title: 'On the water',
      note: 'Ordered, not bought – the money goes now and the boat comes years later. Every one of them costs a wage a week to keep.',
    },
    {
      key: 'plane',
      title: 'In the air',
      note: 'The family aeroplane. It takes half the fare off every trip to a tournament, and it is kept the way an aeroplane is kept.',
    },
    {
      key: 'academy',
      title: 'Her academy',
      // ⭐ ROUND 29 PART FOUR P7 – the second sentence is «нам нужна академия, которая зарабатывает»
      // made visible: each stage earns weekly once built, scaled by the seasons she finished high.
      note: 'Four stages, in order, and each one is a decision. Every stage earns once it is built – the higher and longer she placed, the more it brings in – and it outlives the career.',
    },
  ]
  function shopRowsOf(family: ShopRowView['family']): ShopRowView[] {
    return shopRows.value.filter((r) => r.family === family)
  }
  /** ⭐ §2 – WHAT AN EMPTY SHELF SAYS: the cheapest thing on it, by name and price. «Never a locked
   *  row, a progress bar or a teaser» – so this is a real object at a real number, and the engine
   *  chose it (`shop.cheapestId`) rather than this screen sorting the rows itself. */
  const shopCheapest = computed(() => shopRows.value.find((r) => r.id === shop.value?.cheapestId) ?? null)

  /** What the player has typed into an 'open' rung, in DOLLARS as typed – the input's own units, kept
   *  as a string so a half-typed figure is not silently coerced to a number. `stakeCentsFor` is the
   *  one place it becomes cents, and the engine re-validates the minimum either way. */
  const stakeDollars = ref<Record<string, string>>({})
  function stakeCentsFor(row: ShopRowView): number {
    const typed = Number(stakeDollars.value[row.id] ?? '')
    if (!Number.isFinite(typed) || typed <= 0) return row.entryCents
    return Math.round(typed * 100)
  }
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

  // ⭐⭐ ROUND 29 PART FOUR P7 – `shopBusinessNote`, THE OWNER'S OWN WORDS, PARKED HERE FOR THE SAME
  // REASON AS ITS NEIGHBOURS (no Cyrillic in a template, and `SHOP_FAMILIES` is read into one):
  // «до академии можно запустить свой бренд одежды (мерча) – это может стать хорошим шагом и
  // подспорьем как в доходе, так и вообще добавить геймплея немного. А еще это дешевле академии» and
  // «нам нужен мерч, растущий от частоты и обилия рекламных контрактов, съемок, выступлений, титулов
  // и прочего» – so the family note names FAME as the axis, never rank, and the row's income line
  // (`incomeCents`, engine-computed) is the mechanic on screen.

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

  /** ⭐ ROUND 29 #11 – CAN THE FAMILY PUT MORE INTO THIS ONE? True only for an 'open' rung it already
   *  holds: a deposit and an index fund take more money, a car does not. The predicate is the STAKE
   *  and not a list of ids, exactly as `buyAsset` re-validates it engine-side. */
  function isTopUp(row: ShopRowView): boolean {
    return row.stake === 'open' && row.valueCents !== null
  }
  /** ⚠ ADVISORY, NOT THE GATE. The engine refuses a stake under the minimum and a stake over the
   *  wallet with its own sentences (`buyAsset`); this only decides whether the control is pressable,
   *  which is the R10-16 pairing – a disabled control and a refused click telling one story.
   *
   *  ⚠ ROUND 29 #11 re-aimed the owned-row clause: it used to refuse EVERY owned rung, which is what
   *  made the fund un-toppable on screen even once the engine allowed it. A `fixed` rung still
   *  refuses – there is no second helping of a car. */
  function canBuy(row: ShopRowView): boolean {
    if (game.busy) return false
    if (row.valueCents !== null && !isTopUp(row)) return false
    // ⭐ ROUND 29 #5, §3g – a stage cannot be built before the one under it. Advisory, like every other
    // clause here: `buyAsset` refuses the same purchase with its own sentence naming the stage.
    if (!row.requirementMet) return false
    const cents = row.stake === 'open' ? stakeCentsFor(row) : row.entryCents
    return cents >= row.entryCents && cents <= (game.snapshot?.fundsCents ?? 0)
  }
  /** ⭐ ROUND 29 #5, §3f – IS THIS ONE STILL BEING BUILT? A contract, not a boat: no sale, and the
   *  week it is due instead. The engine decided it (`ShopRowView.readyWeek`); this reads the field. */
  function isBuilding(row: ShopRowView): boolean {
    return row.readyWeek !== null
  }
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
  function buildProgress(row: ShopRowView): number {
    if (row.readyWeek === null || !row.buildWeeks) return 0
    const served = row.buildWeeks - (row.readyWeek - week.value)
    return Math.max(0, Math.min(1, served / row.buildWeeks))
  }
  /** The ring's spoken sentence – the visible figure is the ring's own default slot (N%). DRAFT for
   *  the owner's read, listed on the ledger item. Week through `weekLabel`, per R11-6. */
  function buildRingLabel(row: ShopRowView): string {
    return `${Math.round(buildProgress(row) * 100)}% built – ready ${weekLabel(row.readyWeek ?? 0)}`
  }
  /** The stage this rung is waiting on, by NAME – the label off the row it names, never an id on
   *  screen. Empty when the requirement is met or there is none. */
  function requiresLabel(row: ShopRowView): string {
    if (row.requirementMet || !row.requiresId) return ''
    return shopRows.value.find((r) => r.id === row.requiresId)?.label ?? ''
  }
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
  function buildWaitLine(row: ShopRowView): string {
    // ⚠ ROUND 41 #24: the academy's stages build in WEEKS (courts 6, staff 3), and rounding 6 weeks
    // gave «about 1 months» – the wrong scale wearing broken grammar. Builds under ~2 months speak
    // in weeks; the months and years sentences stay byte-identical for boats and planes (their
    // shortest build is 52 weeks, so the weeks branch cannot reach them).
    if (row.buildWeeks < 9) {
      return `Built to order – about ${row.buildWeeks} ${row.buildWeeks === 1 ? 'week' : 'weeks'} from the week it is ordered.`
    }
    const months = Math.round((row.buildWeeks / 52) * 12)
    if (months < 24) return `Built to order – about ${months} months from the week it is ordered.`
    return `Built to order – about ${Math.round(months / 12)} years from the week it is ordered.`
  }
  /** «loses 6% a season» / «+7% a season». ⚠ THE UNIT IS THE GAME'S OWN – a season IS the 52-week
   *  block every other figure on this screen is quoted over, and the spec's own «/yr» and «a season»
   *  are the same span. The number is `annualRatePct`, whole, rounded once in the engine. */
  function rateLine(row: ShopRowView): string {
    // ⭐⭐⭐ ROUND 30 #9 – A BUSINESS IS NOT PRICED BY A RATE, so it does not read one out. Its worth is
    // years of what it takes in, and what it takes in is her fame – so this line is what the row is
    // ABOUT rather than a percentage it does not have. See `assetWorthCents`' third branch.
    if (row.earningsMultipleX !== null) return `Worth ${row.earningsMultipleX} years of what it sells`
    if (row.annualRatePct < 0) return `Loses ${-row.annualRatePct}% a season`
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
    if (row.annualRatePct === 0) return 'Neither gains nor loses'
    return `Gains about ${row.annualRatePct}% a season`
  }

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

  /** The plot's own coordinate space. A viewBox rather than pixels, so the chart is whatever width the
   *  card gives it – the phone is the narrow case and it must not need its own layout. */
  const CHART_W = 300
  const CHART_H = 90
  /** Air above and below the line, so the highest and lowest dots are not clipped by the box. */
  const CHART_PAD = 6

  /** Which window the picker is on. ⚠ ONE REF FOR THE SCREEN rather than one per row: the range is a
   *  viewing preference, and today exactly one rung on the shelf has a chart at all. */
  const chartMonths = ref<number>(12)

  /** «6 months» / «1 year» / «2 years» / «5 years» – his four spellings, in English, and the ONLY
   *  place they are written. Derived from the month count so the picker and the slice can never name
   *  different windows. */
  function rangeLabel(months: number): string {
    if (months < 12) return `${months} months`
    const years = months / 12
    return years === 1 ? '1 year' : `${years} years`
  }

  /** The points inside the open window – the tail of the engine's series. ⚠ A SLICE AND NEVER A
   *  RESAMPLE: the engine sent one averaged figure a month and this shows the last N of them. */
  function chartPoints(row: ShopRowView): ShopPricePoint[] {
    return (row.priceHistory ?? []).slice(-chartMonths.value)
  }

  /** The geometry of one row's chart, or null when there is not enough of a career to draw a line.
   *
   *  ⚠ THE VERTICAL SCALE IS THE WINDOW'S OWN low..high, which is what makes a six-month view readable
   *  at all: on a five-year scale a quiet half-year is a flat line. ⚠ AND A DEAD-FLAT WINDOW IS A REAL
   *  STATE – every point equal – so the span is floored at 1 cent rather than dividing by zero, and
   *  the line lands mid-box. */
  function chartPlot(row: ShopRowView): { line: string; dots: { x: number; y: number }[]; low: number; high: number } | null {
    const points = chartPoints(row)
    if (points.length < 2) return null
    const low = Math.min(...points.map((p) => p.cents))
    const high = Math.max(...points.map((p) => p.cents))
    const span = Math.max(1, high - low)
    const dots = points.map((p, i) => ({
      x: (i / (points.length - 1)) * CHART_W,
      y: CHART_H - CHART_PAD - ((p.cents - low) / span) * (CHART_H - 2 * CHART_PAD),
    }))
    return { line: dots.map((d) => `${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' '), dots, low, high }
  }

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
  function chartMarks(row: ShopRowView): { key: string; x: number; y: number; buy: ShopPurchaseView }[] {
    const plot = chartPlot(row)
    if (!plot) return []
    const points = chartPoints(row)
    const out: { key: string; x: number; y: number; buy: ShopPurchaseView }[] = []
    for (const [i, buy] of row.purchases.entries()) {
      if (buy.week < points[0].week) continue
      let seg = points.length - 2
      while (seg > 0 && points[seg].week > buy.week) seg -= 1
      const span = Math.max(1, points[seg + 1].week - points[seg].week)
      const within = Math.min(1, Math.max(0, (buy.week - points[seg].week) / span))
      const a = plot.dots[seg]
      const b = plot.dots[seg + 1]
      out.push({
        key: `${row.id}:${i}`,
        x: ((seg + within) / (points.length - 1)) * CHART_W,
        y: a.y + (b.y - a.y) * within,
        buy,
      })
    }
    return out
  }

  /** Which mark's popup is open, by `chartMarks` key, or null. ⚠ ONE REF FOR THE SCREEN, like
   *  `chartMonths` above and for the same reason: exactly one rung has a chart, and two popups open at
   *  once is not a state anybody wants. */
  const openMark = ref<string | null>(null)

  /** ⚠ HOVER **AND** TAP, which is the owner's own «при наведении/нажатии» and is not one behaviour
   *  written twice. A phone has no hover at all, so a mark that only answered `mouseenter` would be
   *  dead on the device this game is played on; a desktop that only answered `click` would feel broken
   *  beside every other chart. Tap TOGGLES (a second tap closes it, which is the only way to dismiss
   *  one on a touch screen); hover opens and leaving closes. Keyboard focus opens it too – the marks
   *  are real buttons, so they are reachable by Tab and Escape closes. */
  function toggleMark(key: string): void {
    openMark.value = openMark.value === key ? null : key
  }

  /** The mark whose bubble is open on THIS row, or null. ⚠ Asked of the row rather than read off
   *  `openMark` directly, because the key is row-scoped and a second charted rung must not show one
   *  row's popup over another's plot. */
  function openMarkOf(row: ShopRowView): { key: string; x: number; y: number; buy: ShopPurchaseView } | null {
    return chartMarks(row).find((m) => m.key === openMark.value) ?? null
  }

  /** ⚠⚠ DRAFT (CLAUDE.md invariant 4) – what the mark ANNOUNCES to a screen reader, reported verbatim
   *  in the bundle's handback and the owner's to change. The two figures are the two he named
   *  («с суммой и датой») and the month is the chart's OWN axis spelling (`monthLabel`), so the bubble
   *  and the strip under it cannot name a week two different ways. */
  function markLabel(buy: ShopPurchaseView): string {
    return `Bought in ${monthLabel(buy.week)}, ${formatCents(buy.cents)}`
  }

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
  function markAlign(mark: { x: number }): 'flex-start' | 'center' | 'flex-end' {
    const t = mark.x / CHART_W
    if (t < 1 / 3) return 'flex-start'
    if (t > 2 / 3) return 'flex-end'
    return 'center'
  }

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

  /** What the chart says, for somebody who cannot see it. ⚠ IT IS THE SAME THREE FACTS the axis under
   *  the plot prints, so the picture and its description cannot drift. */
  function chartSummary(row: ShopRowView): string {
    const points = chartPoints(row)
    const plot = chartPlot(row)
    if (!plot || points.length === 0) return 'Not enough months to draw yet'
    return (
      `One unit, monthly, from ${monthLabel(points[0].week)} to ${monthLabel(points[points.length - 1].week)}: ` +
      `${formatCents(plot.low)} to ${formatCents(plot.high)}`
    )
  }

  /** ⭐ HOW MANY UNITS, AS A PERSON READS THEM. ⚠ THE ONE FRACTIONAL FIGURE ON THIS SCREEN, and the
   *  owner's rule of 26.08 («у пользователя целые в интерфейсе») is about MONEY: $5,000 into a $4,000
   *  unit is 1.25 units, and rounding that to 1 would print a quarter of the holding out of existence.
   *  Two places, which is what a real fund statement uses. */
  function formatUnits(units: number): string {
    return units.toFixed(2)
  }

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
  const nameDrafts = ref<Record<string, string>>({})
  /** What is in the box for this row – the first suggestion until the player touches it. ⚠ `??` AND
   *  NOT `||`: a player who clears the field should see it empty rather than have the default snap
   *  back under his cursor, and the engine turns an empty entry into that same default at the command.
   *  `''` is a value here and only `undefined` means «never touched». */
  function nameFor(row: ShopRowView): string {
    return nameDrafts.value[row.id] ?? row.nameOptions[0] ?? ''
  }

  const pendingShop = ref<PendingShop | null>(null)
  function askBuy(row: ShopRowView): void {
    if (!canBuy(row)) return
    const amountCents = row.stake === 'open' ? stakeCentsFor(row) : row.entryCents
    pendingShop.value = {
      kind: 'buy',
      id: row.id,
      label: row.label,
      amountCents,
      changeCents: null,
      topUp: isTopUp(row),
      buildWeeks: row.buildWeeks,
      upkeepCents: row.upkeepCents,
      // ⭐ ROUND 30 #8/#10 – carried on the pending question and sent with the command. Undefined on
      // every row that names nothing, which is every row whose `nameOptions` the engine left empty.
      name: row.nameOptions.length > 0 ? nameFor(row) : undefined,
    }
  }
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

  /** ⭐ ROUND 35 #12 – THE ACCESSIBLE NAME FOR THE SHARED FIELD, which is what the two visible labels
   *  became. The frame draws the input with a placeholder and no caption, so the sentence a screen
   *  reader needs has nowhere visible to live – and an unlabelled number box driving two verbs is the
   *  one thing this layout could genuinely lose. ⚠ IT IS BUILT FROM THE ENGINE'S OWN FIGURES
   *  (`entryCents`, `valueCents`), never typed, so a retune moves it with the money. */
  function stakeFieldLabel(row: ShopRowView): string {
    const from = `Amount, from ${formatCents(row.entryCents)}`
    return row.valueCents === null ? from : `${from} – leave it blank to sell all ${formatCents(row.valueCents)}`
  }
  /** Null when the box is empty or unusable – the caller then sells the whole holding, which is the
   *  engine's own `amountCents === undefined`. ⚠ CLAMPED NOWHERE: `sellAsset` re-derives the floor and
   *  the ceiling and returns its own sentence, and a screen that silently corrected the number would
   *  be the R10-16 defect (a control and a refusal telling two stories).
   *
   *  ⚠⚠ ROUND 35 #12 POINTED IT AT `stakeDollars` AND DELETED `sellDollars`. There is one field on the
   *  card now, so there is one value; a second ref would be a value nothing on screen can show, which
   *  is worse than the two fields it replaced. */
  function sellCentsFor(row: ShopRowView): number | null {
    // ⚠ `String(...)` AND NOT A CAST: Vue 3's `v-model` on `type="number"` coerces the bound value to a
    // NUMBER at runtime, whatever the ref is typed as, so «is the box empty» has to survive both. The
    // stake reader above only ever reaches this through `Number()`, which is why it never noticed.
    const raw = String(stakeDollars.value[row.id] ?? '').trim()
    const typed = Number(raw)
    if (!raw || !Number.isFinite(typed) || typed <= 0) return null
    return Math.round(typed * 100)
  }
  /** ⚠ ADVISORY, NOT THE GATE – `canBuy`'s own rule one function up. An amount over what they hold is
   *  refused by the engine with the figure in it; this only decides whether the control is pressable. */
  function canSell(row: ShopRowView): boolean {
    if (game.busy || row.valueCents === null) return false
    const cents = sellCentsFor(row)
    return cents === null || (cents > 0 && cents <= row.valueCents)
  }
  function askSell(row: ShopRowView): void {
    if (!canSell(row) || row.valueCents === null) return
    // ⚠ THE PART IS ONLY OFFERED ON AN 'open' RUNG, which is `isTopUp`'s predicate read from the other
    // end – see `sellAsset`'s own header. A car is sold whole whatever is in any box.
    const part = isTopUp(row) ? sellCentsFor(row) : null
    const amountCents = part !== null && part < row.valueCents ? part : row.valueCents
    pendingShop.value = {
      kind: 'sell',
      id: row.id,
      label: row.label,
      amountCents,
      // ⚠ THE REALISED DIFFERENCE, SCALED BY WHAT IS LEAVING. The engine reaches the same figure from
      // the other side – `proceeds − round(paidCents x proceeds / value)` – which is this expression
      // rearranged, so the two can differ by at most a cent and never by a dollar on screen. ⚠ IT IS
      // NOT RE-DERIVED FROM A RATE: `changeCents` is the engine's own subtraction, off `shopView`.
      // Whole sale: the row's own `changeCents`, untouched.
      changeCents:
        row.changeCents === null || amountCents >= row.valueCents
          ? row.changeCents
          : Math.round((row.changeCents * amountCents) / row.valueCents),
      partCents: amountCents < row.valueCents ? amountCents : undefined,
    }
  }
  /** ⚠ THE SALE'S SENTENCE NAMES THE DIFFERENCE, TO THE CENT, and it is the same sentence the ledger
   *  row carries – both take `changeCents` off the engine rather than working it out. A player who has
   *  to subtract two prices himself has been shown two prices, not a loss (spec §2e-1). */
  const shopConfirmMessage = computed(() => {
    const p = pendingShop.value
    if (!p) return ''
    if (p.kind === 'buy') {
      // ⭐ ROUND 29 #11 – a top-up is a different sentence from a first purchase, because it is a
      // different act: «Buy an index fund» reads wrong on the fund they have held for six seasons.
      if (p.topUp) {
        return `Put a further ${formatCents(p.amountCents)} into ${p.label}? It comes out of the family's money this week.`
      }
      // ⭐⭐ ROUND 29 #5, §3f – A COMMISSION ASKS A DIFFERENT QUESTION, because it commits the family to
      // three things and not one: the money now, the wait, and a bill every week for as long as they
      // keep it. «Buy the yacht for $12,000,000?» would be true and would hide the two halves that
      // actually decide it. ⚠ NOT A NUMBER ABOUT HER – the fatigue side of the plane is hidden by his
      // own ruling and no sentence here goes near it.
      if (p.buildWeeks) {
        const keep = p.upkeepCents ? ` It then costs ${formatCents(p.upkeepCents)} a week to keep.` : ''
        return `Order ${p.label} for ${formatCents(p.amountCents)}? The money goes this week and it arrives in ${p.buildWeeks} weeks.${keep}`
      }
      return `Buy ${p.label} for ${formatCents(p.amountCents)}? It comes out of the family's money this week.`
    }
    const tail =
      p.changeCents === null || p.changeCents === 0
        ? 'exactly what it cost'
        : p.changeCents < 0
          ? `${formatCents(-p.changeCents)} less than it cost`
          : `${formatCents(p.changeCents)} more than it cost`
    // ⭐ ROUND 29 PART TWO #4 – a part sale asks a different question, because it leaves something
    // behind: «Sell the index fund» reads wrong on a family taking $10,000 out of one.
    if (p.partCents !== undefined) {
      return `Take ${formatCents(p.partCents)} out of ${p.label}? That part is ${tail}, and the rest stays invested.`
    }
    return `Sell ${p.label} for ${formatCents(p.amountCents)}? That is ${tail}.`
  })
  function confirmShop(): void {
    const pending = pendingShop.value
    pendingShop.value = null
    if (!pending) return
    if (pending.kind === 'buy') void game.buyAsset(pending.id, pending.amountCents, pending.name)
    // ⚠ `partCents` OR NOTHING: a whole sale sends no amount, which is the engine's «sell the lot» and
    // is byte for byte the call this screen made before part two #4.
    else void game.sellAsset(pending.id, pending.partCents)
  }

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
  const shelfTab = ref<ShelfTab>('invest')
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
  const SHELF_TAB_OPTIONS = [
    { value: 'invest', label: 'Invest', title: 'Money that stays money' },
    { value: 'business', label: 'Business', title: 'What the family owns that earns – the academy included' },
    { value: 'cars', label: 'Cars', title: 'The garage' },
    { value: 'property', label: 'Property', title: 'Somewhere to live' },
    { value: 'water', label: 'Water', title: 'Boats, ordered rather than bought' },
    { value: 'air', label: 'Air', title: 'The family aeroplane' },
  ]
  /** ⚠⚠ «Business (Academy is subdivision inside)» – THE ACADEMY IS NOT A SEVENTH TAB. It is a
   *  subdivision of Business, so that tab holds TWO families and the academy's four stages appear
   *  under it, below the brand. Every other tab holds exactly one. This map is the whole mechanism:
   *  the engine's families are untouched, and so is `SHOP_FAMILIES` and every word in it. */
  const SHELF_TAB_FAMILIES: Record<ShelfTab, ShopRowView['family'][]> = {
    invest: ['investment'],
    cars: ['car'],
    property: ['house'],
    business: ['business', 'academy'],
    water: ['boat'],
    air: ['plane'],
  }
  /** The families the open shelf tab shows, in `SHOP_FAMILIES`' own order – so Business shows the
   *  brand and then the academy under it, which is what "subdivision inside" means on screen. */
  const shelfFamilies = computed(() =>
    SHOP_FAMILIES.filter((f) => SHELF_TAB_FAMILIES[shelfTab.value].includes(f.key)),
  )

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
  const shopHome = ref(true)
  function openShelfCategory(key: ShelfTab): void {
    shelfTab.value = key
    shopHome.value = false
  }

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
  function openChapter(event: MouseEvent): void {
    if ((event.target as HTMLElement | null)?.closest('button')) shopHome.value = true
  }

  /** The six cards, in HIS order, with the switcher's own words on them. */
  const SHELF_CATEGORY_CARDS = SHELF_CATEGORY_KEYS.map((key) => {
    const tab = SHELF_TAB_OPTIONS.find((o) => o.value === key)
    if (!tab) throw new Error(`no shelf segment for the category tile ${key}`)
    return { key, label: tab.label, title: tab.title }
  })

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
  const SHELF_ART_SIDE: Partial<Record<ShopRowView['family'], 'left' | 'right'>> = {
    car: 'left',
    academy: 'left',
    house: 'right',
    boat: 'right',
    plane: 'right',
  }
  /** ⚠ THE `right` FAMILIES ARE ALSO THE ONES WHOSE CONTROL STANDS ON THE PAINTING – «Кнопка
   *  покупка/продажа может стоять на картинке (как на яхтах)», said of property and inherited by
   *  water and air through «как на домах». The cars go the other way by his own separate sentence:
   *  «кнопку покупки можно поставить под цену – тогда больше горизонтального места для надписей». */
  function shopRowArtSide(row: ShopRowView): 'left' | 'right' | null {
    return shelfArtUrl(row.id) ? (SHELF_ART_SIDE[row.family] ?? null) : null
  }

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
  const SHELF_WIDE_ART: ShopRowView['family'][] = ['car', 'house', 'boat', 'plane']
  function shopRowArtWide(row: ShopRowView): boolean {
    return shopRowArtSide(row) !== null && SHELF_WIDE_ART.includes(row.family)
  }
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
  const SHELF_NO_PAID_META: ShopRowView['family'][] = ['house', 'car', 'academy', 'boat', 'plane']
  /** ⚙ ROUND 35 #7, HIS RULING, 03.09: «в строке "worth now" показывать текущую цену, а цену покупки
   *  убрать совсем, раз прибавка и так видна. – верно.» The `Worth now` row's VALUE has always been
   *  the current price; what goes is the `paid $N` beside it. Round 36 review #12 and #13 add the
   *  cars and the academy to the house he said it of; round 39 #4 adds the boats and the planes –
   *  see the note above. */
  function shopRowPaidMeta(row: ShopRowView): string | undefined {
    return SHELF_NO_PAID_META.includes(row.family) ? undefined : `paid ${formatCents(row.paidCents ?? 0)}`
  }
  /** #12 and #13's second clause: the control leaves the left of its row for the card's bottom-right
   *  corner. ⚠ IT STAYS IN THE FLOW rather than becoming `position: absolute` like the `--art-right`
   *  families' pill, and that is the whole of the difference between the two corners: on those the
   *  pill sits over the PAINTING, on these the corner is inside the words, and a pill lifted out of
   *  the flow there would shorten the card and print itself over the last sentence. Round 35's
   *  constant across three of his own messages was «the card must not grow taller»; the mirror of it
   *  is that the card must not lose the height its own words need. */
  function shopRowCornerAction(row: ShopRowView): boolean {
    return row.family === 'car' || row.family === 'academy'
  }

  // ===============================================================================================
  // THE SEAM. What the shelf's two surfaces read, grouped by who reads it.
  // ===============================================================================================
  //
  // ⚠ NOTHING IS COMPUTED HERE. Every member is a ref, a computed or a function declared above; this
  // literal is the list and not a second implementation, so a reader chasing a name goes to one
  // place. The shape is `ShopState` (see the type above).
  return {
    // --- the wire, and the shelf's own reading of it -------------------------------------------
    // ⚠ `shopRows` AND `SHOP_FAMILIES` ARE DELIBERATELY NOT HERE. Neither surface reads them – the
    // markup reads `shelfFamilies` (the open tab's slice) and `shopRowsOf` (one family's rungs) – and
    // a returned name nobody reads is the dead re-export A-03 is deleting 93 of, one file over.
    shop,
    shopCheapest,
    shopRowsOf,
    // --- the front door and the six segments (round 35 #3, round 30 #5, round 36 review #10) ---
    shopHome,
    openShelfCategory,
    openChapter,
    shelfTab,
    SHELF_TAB_OPTIONS,
    SHELF_CATEGORY_CARDS,
    shelfFamilies,
    // --- what a rung says about itself ---------------------------------------------------------
    rateLine,
    buildWaitLine,
    requiresLabel,
    isBuilding,
    buildProgress,
    buildRingLabel,
    formatUnits,
    shopRowPaidMeta,
    // --- where its painting stands, and how wide (round 35 #5-#9, round 36 review #11, #12, #13)
    shopRowArtSide,
    shopRowArtWide,
    shopRowCornerAction,
    // --- the fund's chart, its purchase marks and their one bubble (round 34 #19, round 41 #22) -
    CHART_W,
    CHART_H,
    chartMonths,
    rangeLabel,
    chartPoints,
    chartPlot,
    chartSummary,
    chartMarks,
    openMark,
    toggleMark,
    openMarkOf,
    markLabel,
    markAlign,
    // --- the one field, its two verbs and their advisory gates (round 34 #20, round 35 #12) -----
    stakeDollars,
    stakeFieldLabel,
    isTopUp,
    canBuy,
    canSell,
    askBuy,
    askSell,
    nameDrafts,
    nameFor,
    // --- the question, which MoneyScreen draws at the foot of the column ------------------------
    pendingShop,
    shopConfirmMessage,
    confirmShop,
  }
}
