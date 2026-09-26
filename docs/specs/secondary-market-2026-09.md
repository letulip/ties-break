---
type: spec
status: current
area: economy
last-reviewed: 2026-09-26
---
# The secondary market – selling things takes time (2026-09)

Status: **spec written, rulings §5 pending** · Owner's ask 26.09 · Builder plan:
[secondary-market-builder-2026-09.md](../plans/secondary-market-builder-2026-09.md)

## 0 · What he asked, in his words

> все объекты имеют свой срок экспозиции, за который будет идти продажа, у всех он разный, но не
> фиксированный (например дом более ликвидный, яхта менее ликвидная, это и на цену может влиять)

> у каждого объекта свой коридор скидки на текущем рынке, и скидка может увеличиваться в зависимости
> от срока экспозиции … рынок просел – кризис – все активы на вторичке дешевеют.

Clarified the same day: the fund crash already exists (`world/market.ts`); what he means is a
per-class response of the BUYER's price to it –

> есть наш коридор скидки на каждый актив и так, а в кризис может быть еще больше на какой-то класс
> активов, например, а на какой-то меньше или вообще наоборот – цены могут подняться, как часто
> бывает с недвижимостью, например.

> при продаже мы показываем попап вроде "вы собираетесь продать (объект), это может занять от Н до К
> недель. Цена может варьироваться от текущей до более низкой …"

> можно даже присылать письма с предложением цены, кстати! … и там будет принять/отклонить

> а для академии может быть надо делать единовременную продажу всех блоков, вряд ли мы в реальности
> можем только корты продать, землю или админ здание. Это тоже надо заложить и предупредить
> пользователя

## 1 · What stands today

`sellAsset` (world/shop.ts) is instant: the row's `valueCents` lands in the wallet the same week,
whatever the thing is. `sellableAsset` refuses only undelivered orders. The inbox already exists
(docs/specs/offers-and-the-inbox.md): letters with terms printed on the paper, a deadline, sign /
refuse / expire, all persisted in `world.offers`. The world market already exists
(world/market.ts): a seed-derived path with a crash every 2–6 years, −15…−30% at the trough, that
nothing the player does can move. This wave composes those three; it invents no new subsystem.

## 2 · The design

**2a · Listing.** A *thing* – car, house, boat, plane, the brand, the academy – is no longer sold on
the spot. The player LISTS it (`listedWeek` on the owned row). While it is listed the family keeps
using it and keeps paying its upkeep – that is the price of selling slowly. A listing can be
withdrawn any week, free; re-listing starts the exposure clock again. Parked cash – the deposit and
the index fund – keeps today's instant, partial sale untouched: those are money, not things, and
the need gate reads them as reachable.

**2b · Buyer letters.** While a thing is listed, buyers write – the same inbox, a new letter kind
`'sale'`, at most ONE open letter per listing. The letter names a price; the price is printed on
the paper and does not move afterwards. Accept – the sale settles that week at that price, through
the same money-and-ledger path the instant sale uses today. Decline, or let it lapse (deadline
~2 weeks) – the listing continues and other buyers keep coming. Like kit letters, an unanswered
buyer does not block the week or the ▶▶ button.

**2c · The offer price.** Drawn at the week the buyer writes, against the row's worth THAT week
(`assetWorthCents` – so a brand listed while she is loud and still unsold when she goes quiet gets
quieter offers, which is the shelf's own «продавать пока о ней говорят» made real):

    price = worth(week) × ( base(class) + spread(class)·u − stale(class)·min(t/52, 1)
                            + crashShift(class)·crashDepth(week) )

- `base`/`spread` – the class corridor. A house clusters near its worth; a plane scatters low.
- `stale` – his «скидка может увеличиваться в зависимости от срока экспозиции»: a gentle drift
  down as the listing ages, so a boat that hung two years goes cheap.
- `crashShift` – SIGNED, per class, his clarification. Boats and planes dive with the market;
  houses can go the other way (money fleeing to real assets). It multiplies the same crash depth
  the fund rides, read off the same path – one world, one crisis.
- A lucky draw may land a touch ABOVE worth (cap ~1.05): waiting is occasionally delicious.

**2d · Exposure.** Arrival is a weekly hazard per class (median weeks to a first acceptable letter);
in a crash the hazard itself moves per class – yacht buyers vanish, house buyers multiply.

Proposed starting numbers – **all six columns are to be measured by the probe (§6), none is final**:

| class    | median weeks | base | spread | stale/yr | crashShift | crash arrival |
|----------|--------------|------|--------|----------|------------|---------------|
| car      | 4            | 0.93 | ±0.06  | −0.04    | −0.3       | ×0.8          |
| house    | 16           | 0.97 | ±0.05  | −0.03    | **+0.4**   | ×1.2          |
| boat     | 32           | 0.88 | ±0.10  | −0.06    | −0.8       | ×0.4          |
| plane    | 44           | 0.85 | ±0.12  | −0.06    | −1.0       | ×0.4          |
| business | 52           | 0.90 | ±0.10  | −0.05    | −0.6       | ×0.6          |
| academy  | 65           | 0.92 | ±0.08  | −0.04    | −0.4       | ×0.7          |

**2e · The academy sells as one lot** – his ruling, quoted in §0. One listing covers every delivered
stage; one letter prices the lot (the sum of the stages' worths through the corridor); the popup
warns him in so many words. A stage still in delivery blocks listing the lot until it lands –
nobody buys a construction site with someone else's contract on it.

**2f · The fire sale** (proposed – ruling §5.1). The listing dialog offers a second door: «Sell
now», instant, at the corridor's floor minus a class haircut (a car fetches ~0.85 of worth, a plane
~0.60). It exists so a family in a cash crunch is squeezed, not stuck: the mansion CAN save them
today, at a price they will remember. Without it, bankruptcy against an illiquid shelf is a wall;
with it, it is a decision.

**2g · The quote is one engine primitive.** `assetSaleQuote(world, itemId)` returns the exposure
range, the price corridor and the fire price; the popup prints it, the letter raiser draws from it.
The screen never re-derives a number the engine owns (the parity law,
docs/specs/engine-ui-parity-2026-09.md), and the popup carries the mounted 375×667 dismiss-box test
every dialog owes.

**2h · What does not change.** Buying; delivery; upkeep arithmetic; the deposit and the fund;
`revalueAssets`; the frozen MAIN capture. The instant `sellAsset` path survives as the settle
function the letters and the fire sale both call – one body, two doors.

## 3 · Determinism

Listing is a player action, so its randomness lives on purpose-scoped sub-streams keyed
`${seed}:sale:${itemId}:${week}` – re-derived at the call site, persisting nothing, invisible to
the MAIN stream (invariant 2; the capture 41550/e6b0c709 must not move). A reload mid-listing
replays the same buyers at the same weeks with the same prices – his own law: every career
different, every variation reproducible.

## 4 · Save schema

v89 → v90: `listedWeek?: number` on `OwnedAsset`; `Offer` gains kind `'sale'` with
`SaleOfferTerms { itemId, priceCents }` (letters already persist). Append-only migration (the field
is optional – the migration is the version step), golden fixture, e2e fixtures regenerated – the
three-part move plus the fixture regen, as always.

## 5 · Rulings still open

1. **The fire sale (§2f)** – in, at floor-minus-haircut? My recommendation: yes, and it REPLACES
   today's instant full-value sale for things (full value on the spot is the one thing the wave
   exists to remove).
2. **The letter's shelf life** – 2 weeks to answer, one open letter per listing. Fine?
3. **Withdrawing a listing** kills its open letter (the buyer walks). Fine?
4. **The corridor table (§2d)** – the shape and the signs, numbers to be tuned by measurement.
   In particular: houses RISING in a crash – how strongly does he want that felt?
5. **The brand** sells through the same letters at fame-of-the-week prices – confirm it stays
   listable in quiet years (worth is floored by its own arithmetic today).

## 6 · Measurement (invariant 5)

`tools/sale-probe.ts` walks listed careers across seeds and classes: weeks-to-sale p10/p50/p90,
mean price/worth, in and out of crash arcs. The table in §2d gets a measured column per class
before the wave ships; predicted vs measured, and the misses explained, per the house rule.

## 7 · Left for a later slice, deliberately

- Buying on the secondary market – the family shopping somebody ELSE's crisis (his «наоборот»
  pointed here; it wants its own wave with its own shelf).
- Two buyers in one week – an auction premium above the corridor. Spicy, rare, later.
- A «reduce the asking price» control on a stale listing. The stale drift covers the need for now.
