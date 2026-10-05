// THE SHELF'S STATE AND ITS LOGIC – the Money shop, lifted out of MoneyScreen.vue (E-11, 28.09).
//
// The half of the shop that is reactive state and the arithmetic over it: `ShopPanel.vue` is its markup, and
// `MoneyScreen.vue` owns the instance and wires the two together (`docs/review-principles-2026-09-26/05-ui.md`, E-11).
//
// ⚠⚠ shop.ts: EVERY LINE BELOW MOVED VERBATIM, COMMENTS INCLUDED, out of MoneyScreen.vue:1022-1744 and :1801-2073 at `f0f538a5`.
// ⚠ shop.ts: AND THIS IS WHERE THE OWNER'S CYRILLIC RULINGS BELONG NOW – no template block may hold Cyrillic, comments included.
// ⚠ shop.ts: The sibling rule stays with `ShopPanel.vue`: a template's opening tag may not be SPELLED in a `.vue` file's script.
// ⚠ shop.ts: `week` IS A PARAMETER RATHER THAN A SECOND READER – one fact with two spellings is the drift half.
// ⚠ shop.ts: `useGameStore()` IS CALLED AGAIN AND THAT IS NOT A SECOND STORE – Pinia hands back the one instance.
// → docs/notes/money/shop.md#shopts-header--why-the-shop-left-moneyscreenvue
import { computed, ref, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import type { ShopPricePoint, ShopPurchaseView, ShopRowView } from '../shared/protocol'
import { monthLabel, weekLabel } from '../shared/dates'
import { formatCents } from '../shared/money'
// ⭐ ROUND 30 #5 / ROUND 35 #3 – the paintings' own module. `shelfArtUrl` is what decides whether a
// rung has a band at all (see `shopRowArtSide`), and `SHELF_CATEGORY_KEYS` is HIS row order for the
// six category tiles, kept beside the paintings it is the order of.
import { SHELF_CATEGORY_KEYS, shelfArtUrl } from '../art/shelf'

/** Everything the shelf's two surfaces read: `ShopPanel.vue`'s markup and, for the confirmation question
 *  and the front door, `MoneyScreen.vue` itself.
 *  ⚠ ShopState: IT IS THE RETURN TYPE RATHER THAN A HAND-WRITTEN LIST OF FORTY-FIVE MEMBERS, deliberately.
 *  → docs/notes/money/shop.md#shopstate--the-return-type-not-a-hand-written-list
 */
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

/** ⭐⭐⭐ THE SECONDARY MARKET, S5 – THE FOUR CONTROLS THE MARKET ADDS, AS WORDS. DRAFTS, tabled in docs/plans/secondary-market-strings-2026-09.md
 *  (SM7–SM10) and pinned there letter for letter: List, Sell now and Keep it are the popup's three doors, Withdraw is the listed row's one tap. (⚠ THE WORDS ARE NOT QUOTED IN
 *  THIS COMMENT ON PURPOSE: the round-trip test finds a row as a whole quoted literal anywhere in its home, so a quoted copy of a one-word row in a comment would
 *  keep the pin green after the real literal changed – found by S5's own mutation run.)
 *  Declared once, at module scope, because the popup component and the panel both print them and two spellings would be two wordings. */
export const SALE_LABELS = {
  list: 'List',
  sellNow: 'Sell now',
  keep: 'Keep it',
  withdraw: 'Withdraw',
} as const

// ⭐⭐ ROUND 46 #1 – THE LISTED CARD'S TWO BUTTONS AND THE SECOND WORD ON THE SELL ONE (`shopSellRowNote`; the template's comment names this).
// owner (shopSellRowNote), 05.10: «Когда выбрали залистить айтем на продажу появляется кнопка withdraw выше sell на карточке машин. Предлагаю в один ряд сделать, а ещё, если случился list, то sell заменять на sell now и жёлтую. На карточке домов кнопки лежат одна сверху другой. Надо проверить во всех разделах и сделать одинаково.»
// ⚠ shopSellRowNote: «SELL NOW» IS NOT A NEW STRING. It is the constant above that the popup's second door already prints, so the verb has ONE spelling:
// once the engine says the row is listed (`row.listing`, the predicate that already draws the badge) the card's Sell control prints it, and under
// no other condition – an unlisted card, a deposit and a fund read what they always read. DRAFT R46-S22 in docs/rounds/round-46.md, «his words, wired».
// ⚠ shopSellRowNote: WITHDRAW AND SELL ARE ONE ROW (`.shop-stake-row.is-listed` in ShopPanel.vue), the same row every owned card already draws – the
// two stacked on the cars and lay on top of each other on the painted families, and both were one cause (the Withdraw had a block of its own).

/** The shelf, for one mounted Money screen.
 *
 *  @param week the career's week, the screen's own reader – see the header.
 *
 *  ⚠ useShop: PER CALL AND NEVER AT MODULE SCOPE, which is a real constraint rather than a style: `shelfTab`, `shopHome`, `stakeDollars`…
 *  → docs/notes/money/shop.md#useshop--per-call-and-never-at-module-scope
 */
export function useShop(week: ComputedRef<number>) {
  const game = useGameStore()

  // THE SHELF (v63) – docs/specs/the-shop-2026-08.md §2, §3a-c. The parent's own money, and the first screen
  // in this game where it is his to enjoy.
  // ⚠⚠ shelf: EVERY NUMBER BELOW IS THE ENGINE'S – this block reads `snapshot.shop` and formats it; it never prices a rung.
  // → docs/notes/money/shop.md#the-shelf-v63--every-number-is-the-engines
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
  // ⭐⭐ ROUND 29 #11 – `shopTopUpNote`, THE OWNER'S OWN WORDS, PARKED HERE AND NOT IN THE
  // TEMPLATE.
  //
  // owner (shopTopUpNote, round 29 #11): «Index fund хотелось бы иметь возможность докупать, предполагаю»…
  // ⚠ shopTopUpNote: AND HIS RULING THAT BINDS IT TO #12, 28.08
  // owner (shopTopUpNote), 28.08: «здесь логика простая: в реальности на текущем счете нет процентного дохода, максимум кешбек»…
  // ⚠⚠ shopTopUpNote: AND `shopToneNote` (ROUND 29 #9), for the same reason – Cyrillic may not appear in a template…
  // owner (shopToneNote, round 29 #9): «В строке с машиной и другими вещами Worth now / paid $60,000 / $59,361»…
  // → docs/notes/money/shop.md#round-29-11--shoptopupnote-topping-up-and-the-tone-of-the-worth-line

  // ⭐⭐ ROUND 29 PART FOUR P7 – `shopBusinessNote`, THE OWNER'S OWN WORDS, PARKED HERE FOR THE SAME
  // REASON AS ITS NEIGHBOURS (no Cyrillic in a template, and `SHOP_FAMILIES` is read into one):
  // «до академии можно запустить свой бренд одежды (мерча) – это может стать хорошим шагом и
  // подспорьем как в доходе, так и вообще добавить геймплея немного. А еще это дешевле академии» and
  // «нам нужен мерч, растущий от частоты и обилия рекламных контрактов, съемок, выступлений, титулов
  // и прочего» – so the family note names FAME as the axis, never rank, and the row's income line
  // (`incomeCents`, engine-computed) is the mechanic on screen.

  // ⭐⭐ ROUND 29 #5 – `shopEliteNote`, THE OWNER'S OWN WORDS, PARKED HERE FOR THE SAME REASON AS
  // THE two above: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts), and `SHOP_FAMILIES` is read into one.
  //
  // owner (shopEliteNote, round 29 #5): «В магазине всё ещё не хватает яхт, самолётов и стойки академии»
  // owner (shopEliteNote, round 29 #5): «Может что-то элитное добавить - яхты или самолеты?»
  // owner (shopEliteNote, round 29 #5): «тоже можно разные тиры сделать, кстати и потерю стоимости в год + годовое обслуживание»…
  // owner (shopEliteNote, round 29 #5): «построить свою академию за много миллионов - тоже может быть интересно, кстати.»
  // ⚠⚠ shopEliteNote: AND THE ONE THING THIS SCREEN MAY NOT SAY – no row, note or dialog states a condition number.
  // owner (shopEliteNote, round 29 #5): «По усталости по аналогии с кортом может 1 накинуть»
  // owner (shopEliteNote, his court ruling): «верно, но только если знают об этом, я предложил сделать бонус скрытым»
  // → docs/notes/money/shop.md#round-29-5--shopelitenote-yachts-planes-and-the-academy

  // ⭐⭐ ROUND 29 PART TWO #4 – `shopPartSaleNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS
  // THE others: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // owner (shopPartSaleNote, round 29 part two #4): «при продаже бумаг надо дать возможность только часть продавать»…
  // → docs/notes/money/shop.md#round-29-part-two-4--shoppartsalenote-selling-part-of-a-holding

  // ⭐⭐ ROUND 34 #18 – `shopOwnedFrameNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE
  // others: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // owner (shopOwnedFrameNote, round 34 #18): «В магазине те пункты, которые во владении находятся давай цветом выделять рамку жёлтую»…
  // ⚠⚠ shopOwnedFrameNote: «КАК С ТРЕНЕРОМ ДЕЛАЛИ» IS THE HALF THAT DECIDES THE IMPLEMENTATION.
  // ⚠ shopOwnedFrameNote: NO WORD, PRICE OR CONTROL MOVED WITH IT.
  // → docs/notes/money/shop.md#round-34-18--shopownedframenote-the-frame-on-an-owned-rung

  // ⭐⭐ ROUND 34 #20 – `shopInlineActionNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE
  // others: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // owner (shopInlineActionNote, round 34 #20): «Кнопки put more in, sell it в разделе invest давай в одну строку с инпутами»
  // ⚠ shopInlineActionNote: IT IS A LAYOUT ITEM AND NOTHING ELSE MOVED.
  // ⚠⚠ shopInlineActionNote: AND IT IS MEASURED AGAINST A PHONE, which is round-20 #3 read on a row instead of a dialog.
  // → docs/notes/money/shop.md#round-34-20--shopinlineactionnote-the-two-controls-beside-the-field

  // ⭐⭐ ROUND 29 PART TWO #6 – `shopAlwaysOpenNote`, HIS RULING, PARKED HERE FOR THE SAME REASON
  // AS the three above: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // owner (shopAlwaysOpenNote, round 29 part two #6): «магазин открыт всегда с начала игры»
  // → docs/notes/money/shop.md#round-29-part-two-6--shopalwaysopennote-the-shop-open-from-the-start

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
  /** ⭐ ROUND 41 #28 – THE BUILD RING – the export's own ProgressRing (Home's condition ring), at the NEW 36px,
   *  on the art corner of every tile that builds to order – academy stages, boats, planes alike.
   *
   *  owner (buildProgress, round 41 #28): «добавим в уголке картинки наш круглый гаудж… чтобы он показывал в процентах прогресс стройки»…
   *  owner (buildProgress, round 41 #28): «чуть меньше размером, чем на главной»
   *  ⚠ buildProgress: AND IT HIDES AT 100%, his second word on the item…
   *  owner (buildProgress, round 41 #28): «когда заполнен на 100% (построено) больше не надо показывать, только в процессе стройки»
   *  ⚠⚠ buildProgress: AND THE OPENING TAG MAY NOT BE SPELLED IN THIS FILE'S SCRIPT AT ALL
   *  → docs/notes/money/shop.md#round-41-28--buildprogress-the-build-ring
   */
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
  /** ⭐ §3f – HOW LONG THE FAMILY WOULD BE WAITING, in the unit a person thinks in.
   *
   *  ⚠⚠ buildWaitLine: MONTHS UNDER TWO YEARS AND YEARS ABOVE IT, WHICH IS §3f's OWN TABLE READ BACK
   *  ⚠ buildWaitLine: WHOLE NUMBERS EITHER WAY – the wait itself is whole weeks and the due date is the engine's own.
   *  owner (buildWaitLine), 26.08: «у пользователя целые в интерфейсе»
   *  → docs/notes/money/shop.md#section-3f--buildwaitline-the-wait-in-the-unit-a-person-thinks-in
   */
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
    // owner (rateLine), 30.08: «И как будто бы Holds its value странно звучит тоже – это напрямую значит, что оно обесценивается»…
    // ⚠⚠ rateLine: HE IS RIGHT AND THE ENGINE SAYS SO – a rung at `annualRateBps: 0` is worth what was paid, so it does not depreciate.
    // ⚠ rateLine: THE PARALLEL IS THE POINT – its two siblings are about a RATE, and the third had better be a rate too.
    // → docs/notes/money/shop.md#round-30-11--rateline-why-the-words-changed-and-the-engine-was-checked-first
    if (row.annualRatePct === 0) return 'Neither gains nor loses'
    return `Gains about ${row.annualRatePct}% a season`
  }

  // ⭐⭐⭐ ROUND 30 #14 – `shopUnitsNote`, HIS RULING, PARKED HERE AND NOT IN THE TEMPLATE, for the
  // reason every other note in this block carries: Cyrillic may not appear in a template, in a
  // string OR in a comment (tests/template-copy-rules.test.ts).
  //
  // ⚠ shopUnitsNote: AND THE TAG IS NOT SPELLED OUT HERE, which is not fussiness – `templateOf` in that test scans from the FIRST literal…
  // owner (shopUnitsNote, round 30 #14): «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это то»…
  // ⚠⚠ shopUnitsNote: THE TWO LINES BELOW ARE THE WHOLE OF WHAT THIS ITEM ADDS TO THE SCREEN, and that is invariant 4 read literally
  // ⚠ shopUnitsNote: THE UNOWNED LINE EXISTS FOR «зашёл на пике при цене 7-8к»
  // → docs/notes/money/shop.md#round-30-14--shopunitsnote-the-units-a-holding-is-made-of

  // ⭐⭐⭐ ROUND 34 #19 – `shopChartNote`, HIS WORDS, PARKED HERE FOR THE SAME REASON AS THE
  // OTHERS: Cyrillic may not appear in a template, in a string OR in a comment
  // (tests/template-copy-rules.test.ts).
  //
  // owner (shopChartNote, round 34 #19): «для индексного фонда давай график нарисуем с точками его стоимости за пай с возможностью»…
  // ⚠⚠ shopChartNote: HIS LAST SENTENCE WAS ANSWERED, AND THE ANSWER IS «WE DO NOT HAVE TO».
  // ⚠ shopChartNote: THE FOUR WINDOWS ARE HIS FOUR, and the numbers live in `SHOP_PRICE_RANGE_MONTHS` (the protocol) so the engine's…
  // ⚠ shopChartNote: THIS SCREEN DOES NOT PRICE ANYTHING, which is the shelf's own standing rule…
  // → docs/notes/money/shop.md#round-34-19--shopchartnote-the-funds-chart-and-the-four-windows

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

  /** ⭐⭐⭐ v78, ROUND 41 #22 – WHERE THE FAMILY BOUGHT, AS GEOMETRY. One mark per purchase inside
   *  the OPEN window, placed on the line the chart already draws.
   *
   *  ⚠⚠ chartMarks: THE MARK SITS ON THE LINE AND NOT AT THE PRICE THEY PAID, which is a decision and not a shortcut.
   *  owner (chartMarks, round 41 #22): «микро попап… с суммой и датой»
   *  ⚠ chartMarks: A PURCHASE OLDER THAN THE OPEN WINDOW IS NOT DRAWN
   *  ⚠ chartMarks: AND `x` IS INTERPOLATED WITHIN THE MONTH
   *  ⚠ chartMarks: NO MONEY ARITHMETIC – the cents and the per-unit price arrive whole off the wire (`ShopPurchaseView`)…
   *  → docs/notes/money/shop.md#v78-round-41-22--chartmarks-where-the-family-bought
   */
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

  /** WHICH WAY THE BUBBLE LEANS – the left third of the plot pushes it right, the right third
   *  pushes it left, and the middle centres it. Spent as `justify-content` on a full-width row
   *  rather than as a `left` percentage on the bubble itself.
   *
   *  ⚠⚠ markAlign: THIS SHAPE IS A FIX AND THE FIRST ONE WAS MEASURED WRONG
   *  → docs/notes/money/shop.md#markalign--which-way-the-bubble-leans
   */
  function markAlign(mark: { x: number }): 'flex-start' | 'center' | 'flex-end' {
    const t = mark.x / CHART_W
    if (t < 1 / 3) return 'flex-start'
    if (t > 2 / 3) return 'flex-end'
    return 'center'
  }

  // ⭐⭐⭐ ROUND 41 #22 – `shopMarksNote`, HIS WORDS, PARKED HERE for the reason the note above it
  // gives: Cyrillic may not appear in a template, in a string OR in a comment.
  //
  // owner (shopMarksNote, round 41 #22): «В index fund можем делать отметки на графике когда была покупка с микро попап при hover/клике»…
  // ⚠⚠ shopMarksNote: THE ITEM WAITED A MONTH FOR A SCHEMA MOVE, AND THAT WAIT IS THE INTERESTING HALF.
  // ⚠ shopMarksNote: SO A HOLDING BOUGHT BEFORE v78 CARRIES NO MARKS AT ALL, and that is the honest answer rather than a padded one…
  // → docs/notes/money/shop.md#round-41-22--shopmarksnote-the-marks-that-waited-for-a-schema-move

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

  // ⭐⭐⭐ ROUND 30 #8 AND #10 – `shopNamingNote`, HIS ASK, PARKED HERE AND NOT IN THE TEMPLATE for
  // the reason every other note in this block carries: Cyrillic may not appear in a template, in
  // a string OR in a comment (tests/template-copy-rules.test.ts).
  //
  // owner (shopNamingNote, round 30 #8): «Merch brand давай предложим пользователю несколько вариантов именования при покупке… один из»…
  // owner (shopNamingNote, round 30 #10): «И нейминг для академии тоже по принципу бренда, как раз одним из вариантов можно предложить»…
  // ⚠⚠ shopNamingNote: THE FOUR RULES FOR THE TYPED VALUE ARE THE ENGINE'S AND NOT THIS SCREEN'S
  // ⚠ shopNamingNote: AND THE SUGGESTIONS ARE THE ENGINE'S TOO (`ShopRowView.nameOptions`)
  // → docs/notes/money/shop.md#round-30-8-and-10--shopnamingnote-naming-a-purchase
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
  // ⭐⭐⭐ ROUND 29 PART TWO #4 – HOW MUCH OF IT TO SELL. His words are in `shopPartSaleNote`.
  // ⭐⭐ ROUND 35 #12 TOOK «the same shape» TO ITS CONCLUSION: two fields of identical shape on one card are one field.
  // ⭐⭐⭐ ROUND 35 #12 – `shopOneFieldNote`, THE OWNER'S OWN WORDS, PARKED HERE AND NOT IN THE TEMPLATE.
  //
  // ⚠ sellCentsFor: IT HAD THE SAME SHAPE AS THE STAKE INPUT ABOVE, deliberately
  // owner (sellCentsFor, round 35 #12): «инвесту разрешил ответить "делать нечего" - нет, не так, сверься с макетами пожалуйста»…
  // owner (sellCentsFor, round 35 #12): «"Add more" и "Sell" - хорошо, меньше места занимают»
  // ⚠⚠ sellCentsFor: SO ROUND 34 #20 WAS HALF THE ITEM AND THIS IS THE OTHER HALF.
  // owner (sellCentsFor, round 34 #20): «в одну строку с инпутами»
  // ⚠ sellCentsFor: BLANK STILL MEANS «ALL OF IT» on the Sell side
  // → docs/notes/money/shop.md#round-29-part-two-4-and-round-35-12--how-much-to-sell-and-one-field-for-both-verbs

  /** ⭐ ROUND 35 #12 – THE ACCESSIBLE NAME FOR THE SHARED FIELD, which is what the two visible labels
   *  became. The frame draws the input with a placeholder and no caption, so the sentence a screen
   *  reader needs has nowhere visible to live – and an unlabelled number box driving two verbs is the
   *  one thing this layout could genuinely lose. ⚠ IT IS BUILT FROM THE ENGINE'S OWN FIGURES
   *  (`entryCents`, `valueCents`), never typed, so a retune moves it with the money. */
  function stakeFieldLabel(row: ShopRowView): string {
    const from = `Amount, from ${formatCents(row.entryCents)}`
    return row.valueCents === null ? from : `${from} – leave it blank to sell all ${formatCents(row.valueCents)}`
  }
  /** Null when the box is empty or unusable – the caller then sells the whole holding.
   *  ⚠ sellCentsFor: CLAMPED NOWHERE: `sellAsset` re-derives the floor and the ceiling and returns its own sentence…
   *  ⚠⚠ sellCentsFor: ROUND 35 #12 POINTED IT AT `stakeDollars` AND DELETED `sellDollars`.
   *  → docs/notes/money/shop.md#sellcentsfor--null-when-the-box-is-empty-and-clamped-nowhere
   */
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
    // ⭐⭐⭐ S5 – A THING ASKS THE MARKET BEFORE IT ASKS THE QUESTION. `quote` is the engine's «this row can be listed» (absent on parked cash, on
    // a rung nobody owns and on a contract in delivery), so a row WITHOUT one falls straight through to the part-sale path below – the deposit's
    // and the fund's Sell is byte for byte what it was. The dialog's «Sell now» comes back through `sellNow`, into the SAME confirm.
    if (row.quote) {
      saleDialogId.value = row.id
      return
    }
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

  // ⭐⭐⭐ THE SECONDARY MARKET, S5 (docs/specs/secondary-market-2026-09.md §2g, §2i) – A THING IS LISTED OR SOLD AT ONCE, AND THE SCREEN ONLY PRINTS.
  // ⚠⚠ EVERY NUMBER BELOW IS THE ENGINE'S. The wait, the corridor and the fire price are `ShopRowView.quote`'s own fields; the badge's weeks are the
  // career's week less `listing.sinceWeek`; the flip to «gone quiet» is `week >= listing.staleAtWeek`, a week the engine decided (`listingStaleWeek`)
  // and writes its letter in; and the confirm's amount and tail are `quote.fireCents` and `fire.changeCents`. Nothing here prices a thing, draws a
  // chance or subtracts two figures to find a loss (`tests/component/secondary-market-s5.test.ts` moves each engine value and watches the screen
  // follow it). ⚠ EVERY SENTENCE IS A DRAFT: tabled in docs/plans/secondary-market-strings-2026-09.md and pinned there letter for letter by
  // tests/secondary-market-strings-roundtrip.test.ts, so the wording pass can move any of them.
  const saleDialogId = ref<string | null>(null)
  /** The row whose market dialog is open. ⚠ A COMPUTED OFF THE SNAPSHOT AND NOT A COPY: the dialog closes by itself the moment the row stops having
   *  a quote (sold, or gone) instead of printing a figure the engine no longer stands behind. */
  const saleDialogRow = computed<ShopRowView | null>(() => {
    const id = saleDialogId.value
    return id === null ? null : (shopRows.value.find((r) => r.id === id && r.quote !== undefined) ?? null)
  })
  function closeSaleDialog(): void {
    saleDialogId.value = null
  }
  /** What the popup calls the lot: the engine's own name for it (`fire.label`), the label the ledger row will carry. */
  function saleDialogHeading(row: ShopRowView): string {
    return row.fire?.label ?? row.label
  }
  /** The popup's lines, in the order he described them: how long, at what price, what an instant sale pays – and the two warnings the row's own
   *  facts call for. ⚠ THE WARNINGS ARE THE ENGINE'S FACTS READ: `quote.thinMarket` is the engine's predicate, and the academy line is drawn on the
   *  row's family (the one the engine sells as a single lot). */
  function saleDialogLines(row: ShopRowView): string[] {
    const quote = row.quote
    if (!quote) return []
    const weeksLo = quote.weeksLo
    const weeksHi = quote.weeksHi
    const priceLo = formatCents(quote.corridorLoCents)
    const priceHi = formatCents(quote.corridorHiCents)
    const fire = formatCents(quote.fireCents)
    const lines = [
      // ⭐ S6: a quote at the horizon has no upper end to print – `weeksHi` is only where the engine stopped counting (`quote.atHorizon`, the engine's own flag).
      quote.atHorizon
        ? `It may take ${weeksLo} weeks or more to sell – there may be no buyer at all.`
        : `It may take ${weeksLo} to ${weeksHi} weeks to sell.`,
      `Offers may range from ${priceLo} to ${priceHi}.`,
      `Selling now pays ${fire}, at once.`,
    ]
    if (quote.thinMarket) lines.push('Few buyers can pay this much – it may not sell at all.')
    if (row.family === 'academy') lines.push('The academy sells as one lot – every stage goes together, not the courts alone.')
    return lines
  }
  /** «List»: the ad goes up and the popup closes. Free and reversible (Withdraw), so no second question. `listAsset` re-derives every guard. */
  function listOnMarket(row: ShopRowView): void {
    saleDialogId.value = null
    void game.listAsset(row.id)
  }
  /** «Sell now»: the SAME confirm every sale goes through, its amount the ENGINE'S fire price and its tail the ENGINE'S difference (`fire.changeCents`)
   *  – the sentence prints what `sellAsset` will pay and write, and never `valueCents`, which is the card and not the price. */
  function sellNow(row: ShopRowView): void {
    const quote = row.quote
    if (!quote || !row.fire) return
    saleDialogId.value = null
    pendingShop.value = {
      kind: 'sell',
      id: row.id,
      label: row.fire.label,
      amountCents: quote.fireCents,
      changeCents: row.fire.changeCents,
    }
  }
  /** «Withdraw»: one tap and no confirm – taking an ad down is free and the market remembers it (§2i), so there is nothing to undo. */
  function withdrawListing(row: ShopRowView): void {
    void game.unlistAsset(row.id)
  }
  function canWithdraw(): boolean {
    return !game.busy
  }
  function listingIsStale(row: ShopRowView): boolean {
    return row.listing !== undefined && week.value >= row.listing.staleAtWeek
  }
  /** The row's badge: how long the ad has been up, or – once the engine's stale week has come – that interest has gone quiet. */
  function listingBadge(row: ShopRowView): string | null {
    if (!row.listing) return null
    const weeks = Math.max(0, week.value - row.listing.sinceWeek)
    const unit = weeks === 1 ? 'week' : 'weeks'
    return listingIsStale(row)
      ? `Interest has gone quiet · ${weeks} ${unit} on the market`
      : `On the market · ${weeks} ${unit}`
  }

  // ⭐⭐ ROUND 43 #5 – `shelfShareNote`, WHY THE BUSINESS TAB NOW NAMES THE SPLIT. Parked here for
  // this file's standing reason (no Cyrillic in markup), and it is a defect report rather than a
  // feature request: he asked whether Zoe's brand was right, because the two numbers on screen
  // could not be reconciled.
  //
  // owner (shelfShareNote), 16.09: «Наверху вкладки Business можно добавить строчку про ту долю, которая уходит в семью и ей отдельно»…
  // ⚠ shelfShareNote: THE ARITHMETIC WAS NEVER WRONG.
  // → docs/notes/money/shop.md#round-43-5--shelfsharenote-why-the-business-tab-names-the-split
  const shelfTab = ref<ShelfTab>('invest')
  // ⭐⭐ ROUND 34 #16 – BUSINESS SITS NEXT TO INVEST NOW, AND THE ORDER IS THE WHOLE ITEM.
  //
  // owner (SHELF_TAB_OPTIONS), 02.09: «Business пододвинуть к Invest в магазине»
  // ⚠ SHELF_TAB_OPTIONS: ONLY THE ORDER MOVED.
  // ⚠ SHELF_TAB_OPTIONS: AND `SHOP_FAMILIES` IS NOT REORDERED WITH IT, deliberately.
  // → docs/notes/money/shop.md#round-34-16--shelf_tab_options-business-beside-invest
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

  // ⭐⭐ ROUND 35 #3 – THE SHOP HAS A FRONT DOOR NOW
  //
  // owner (shopHome, round 35 #3): «главная магазина становится главной с текущей the shelf, выбором категорий из 6 карточек»…
  // ⚠⚠ shopHome: AND ITEM 10 IS WHY THIS IS A FLAG AND NOT A SEVENTH SEGMENT
  // owner (shopHome, item 10): «переключалка между категориями магазина на самих страницах магазина остается текущей и не меняется.»
  // ⚠ shopHome: HIS ROW ORDER, NOT THE MOCKUP'S.
  // ⚠ shopHome: THE WORDS ARE THE SWITCHER'S OWN AND ARE NOT RE-TYPED.
  // ⚠ shopHome: THE MOCKUP'S BIG HERO IMAGE IS NOT BUILT – «большой картинки делать не будем пока что».
  // → docs/notes/money/shop.md#round-35-3--shophome-the-shops-front-door
  const shopHome = ref(true)
  function openShelfCategory(key: ShelfTab): void {
    shelfTab.value = key
    shopHome.value = false
  }

  // ⭐⭐ ROUND 36 REVIEW #10 – THE ARROW GOES, AND THE CHAPTER BUTTON BECOMES THE WAY OUT
  //
  // owner (openChapter), 04.09: «Внутри магазина на внутренних страницах нижнюю стрелку "назад" надо убрать»…
  // ⚠⚠ openChapter: TWO CLAUSES, AND THE SECOND ONE IS WHAT MAKES THE FIRST SAFE.
  // ⚠⚠ openChapter: WHY THIS IS A CLICK ON THE ROW AND NOT A `watch`, AND NOT `@update:model-value` EITHER.
  // owner (openChapter, round 36 review #10): «точка входа в магазин ВСЕГДА общая страница категорий»
  // ⚠ openChapter: `closest('button')` AND NOT THE ROW ITSELF, so a click landing on the row's own background is not a navigation.
  // ⚠ openChapter: AND THE DOOR AGREES WITH THE BUTTON.
  // → docs/notes/money/shop.md#round-36-review-10--openchapter-the-arrow-goes-and-the-chapter-button-is-the-way-out
  function openChapter(event: MouseEvent): void {
    if ((event.target as HTMLElement | null)?.closest('button')) shopHome.value = true
  }

  /** The six cards, in HIS order, with the switcher's own words on them. */
  const SHELF_CATEGORY_CARDS = SHELF_CATEGORY_KEYS.map((key) => {
    const tab = SHELF_TAB_OPTIONS.find((o) => o.value === key)
    if (!tab) throw new Error(`no shelf segment for the category tile ${key}`)
    return { key, label: tab.label, title: tab.title }
  })

  // ⭐⭐ ROUND 35 #5, #6, #7, #8, #9 – WHICH SIDE A RUNG'S PAINTING STANDS ON.
  // Two of his sentences set it, and they set it in opposite directions on purpose.
  //
  // ⚠⚠ SHELF_ART_SIDE: ONE MAP, BECAUSE IT IS ONE DECISION AND HE MAY WANT IT THE OTHER WAY ROUND.
  // owner (SHELF_ART_SIDE, round 35 #5-#9): «картинки будут квадратными на всю высоту карточки с небольшим градиентом СПРАВА»…
  // owner (SHELF_ART_SIDE, round 35 #5-#9): «но картинка с ДРУГОЙ стороны … и градиент СЛЕВА»
  // owner (SHELF_ART_SIDE, round 35 #5-#9): «как на экране машин, такой же принцип, можно переиспользовать»
  // ⚠ SHELF_ART_SIDE: THE BRIEF THIS WAVE ARRIVED WITH SAID THE OPPOSITE
  // owner (SHELF_ART_SIDE, round 35 #5-#9): «water – карточки как на домах»
  // → docs/notes/money/shop.md#round-35-5-to-9--shelf_art_side-which-side-a-rungs-painting-stands-on
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

  // ⭐⭐ ROUND 36 REVIEW #11 – THE PAINTING TAKES HALF THE CARD ON FOUR OF THE FAMILIES
  //
  // owner (SHELF_WIDE_ART), 04.09: «На Air, Water, Property, Cars давай для всех картинок еще чуть больше горизонтального места дадим»…
  // ⚠ SHELF_WIDE_ART: HER ACADEMY IS NOT IN THIS SET, and it is the family this most looks like it should be.
  // ⚠ SHELF_WIDE_ART: AND `investment` / `business` HAVE NO PAINTING AT ALL
  // → docs/notes/money/shop.md#round-36-review-11--shelf_wide_art-the-painting-takes-half-the-card
  const SHELF_WIDE_ART: ShopRowView['family'][] = ['car', 'house', 'boat', 'plane']
  function shopRowArtWide(row: ShopRowView): boolean {
    return shopRowArtSide(row) !== null && SHELF_WIDE_ART.includes(row.family)
  }
  // ⭐⭐ ROUND 36 REVIEW #12 AND #13 – THE SAME CHANGE ON TWO FAMILIES, MADE ONCE
  //
  // owner (SHELF_NO_PAID_META, #12), 04.09: «С купленной машины убираем paid серые буквы, кнопка buy/sell встает слева ближе к нижнему»…
  // owner (SHELF_NO_PAID_META, #13), 04.09: «В разделе Her Academy убираем paid серые буквы, кнопка buy/sell встает слева ближе к»…
  // ⚠⚠ SHELF_NO_PAID_META: AND THE `paid` LINE REALLY IS A FIGURE LEAVING THE SCREEN, WHICH WAS CHECKED BEFORE IT WENT.
  // owner (SHELF_NO_PAID_META, round 35 #7): «раз прибавка и так видна»
  // ⚠ SHELF_NO_PAID_META: WATER AND AIR KEPT THEIRS UNTIL ROUND 39 #4.
  // owner (SHELF_NO_PAID_META), 08.09: «В яхтах и (подразумеваю) самолётах на уже купленных тоже убрать с карточки серую надпись „paid»…
  // ⚠ SHELF_NO_PAID_META: THAT LEAVES `paid $N` ON `investment` AND `business` ONLY – still unnamed, still kept.
  // ⚠⚠ SHELF_NO_PAID_META: ROUND 41 #2 SUPERSEDES THIS FOR THE `On order` ROW ONLY
  // owner (SHELF_NO_PAID_META), 12.09: «Не убрали paid from water на заказанных, надо и другие категории проверить»
  // → docs/notes/money/shop.md#round-36-review-12-and-13--shelf_no_paid_meta-the-paid-line-goes
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
    // --- the secondary market (S5): the popup a thing's Sell opens, and the listed row's badge and Withdraw ---
    saleDialogRow,
    saleDialogHeading,
    saleDialogLines,
    closeSaleDialog,
    listOnMarket,
    sellNow,
    withdrawListing,
    canWithdraw,
    listingBadge,
    listingIsStale,
  }
}
