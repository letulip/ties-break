// ⭐⭐ WHAT THE FAMILY OWNS – the shelf's PURE READS, and nothing that spends money.
// docs/specs/the-shop-2026-08.md §3a-c (slice 1), §3f and §3g (round 29 #5).
//
// ⚠⚠ WHY THIS IS A SEPARATE FILE FROM `world/shop.ts`, WHICH IS THE ONLY REASON IT EXISTS. Round 29
// #5 gave the shelf two effects that are read OUTSIDE it – the plane takes a share off a fare
// (`world/sponsors.ts`) and adds a point to a travelling week (`world/medical.ts`) – and neither of
// those files may import `world/shop.ts`: `shop.ts` imports `./endings`, `endings` imports
// `./entries`, and `entries` imports `./medical`. That is a real cycle and it was traced before this
// file was written, not after. So the reads move to a LEAF that imports the catalogue and a type and
// nothing else, and `world/shop.ts` re-exports every name it used to own, unchanged.
//
// ⚠ THE COMMANDS DID NOT MOVE. `buyAsset`, `sellAsset`, `revalueAssets`, `deliverAssets`,
// `sellableAsset` and `shopView` are still in `world/shop.ts`, with the guard, the
// wallet and the ledger rows. This file answers questions; it never writes the world.
//
// ⚠⚠ ZERO **MAIN** DRAWS, AND THE IMPORT LIST IS STILL THE GUARANTEE. Round 29 part three #16
// amended the first word of this note and nothing else: the market path (`./market`) draws from
// purpose-scoped SUB-streams keyed on the seed and a week, re-derived at the call site and
// persisting nothing. There is still no `Rng` argument anywhere in this file, no clock and no
// `Math.random`, and the frozen MAIN capture (41550 / e6b0c709) still cannot see any of it – which
// `tests/round29p3-market.test.ts` proves on a ticked world rather than claiming from the imports.
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { brandGrossWorthCents, brandSignalsOf, brandWeeklyGrossCents } from './brand'
import { marketIndex } from './market'
// ⭐ ROUND 34 #19 – the ONE calendar. `shared/dates.ts` imports nothing, so this closes no cycle;
// `world/market.ts`'s own note about not spelling a date twice is the reason it is asked rather than
// re-derived here.
import { weekMonth, weekYear } from '../../shared/dates'
import type { OwnedAsset, ShopPricePoint } from '../../shared/protocol'
import type { WorldState } from '../world'

/** One rung of `ECONOMY.shop.catalogue`, with the constant's literal types widened back to the
 *  shapes the rest of the engine reasons in. */
export interface ShopItem {
  id: string
  /** ⭐ ROUND 29 #5 added 'boat' | 'plane' | 'academy' (§3f, §3g) – the two commissioned families
   *  and the one thing on the shelf that is built in stages. ⭐ ROUND 29 PART FOUR P7 added
   *  'business' – the rungs that EARN every week (the merch brand; see world/business.ts). */
  family: 'investment' | 'car' | 'house' | 'business' | 'boat' | 'plane' | 'academy'
  /** 'fixed' – one price. 'open' – the family chooses an amount, at least `entryCents` (§3a's
   *  minimums: a deposit is not a $1,000 thing you buy). */
  stake: 'fixed' | 'open'
  label: string
  blurb: string
  entryCents: number
  /** signed basis points a year. NEGATIVE IS THE POINT for §3b's family.
   *
   *  ⚠⚠ SINCE ROUND 29 PART THREE #16 THIS IS THE LONG-RUN FIGURE AND NOT THE WEEK'S. On a rung with
   *  a `volBps` the market moves the holding either side of this curve; the rate is where it ends up,
   *  not where it is. That is why the fund's headline stayed at 700 when the market arrived – see
   *  `volBps` below. */
  annualRateBps: number
  /** ⭐⭐⭐ ROUND 29 PART THREE #16 – HOW HARD THIS RUNG RIDES THE MARKET, in basis points of
   *  log-value. Absent on everything whose worth is arithmetic on its rate alone, which is every car,
   *  house, boat, plane, academy stage and the savings deposit.
   *
   *  THE OWNER: «безрисковые 3 против безрисковых 7 это весьма странно.»
   *
   *  ⚠ THE PRESENCE OF THIS FIELD IS THE PREDICATE, and it is deliberately the same shape as
   *  `buildWeeks` / `requiresId` / `grantsVacationId`: a second, wilder fund added to the catalogue
   *  tomorrow rides the SAME world market harder because of what it says about itself, never because
   *  somebody remembered to name it in `revalueAssets`. `world/market.ts` owns the path; this number
   *  is the only thing a rung says about its own relationship to it.
   *
   *  ⚠ AND IT IS THE ONE KNOB. The drift stays in `annualRateBps`, so the shop card's «7% a year»
   *  needs no re-wording and the long-run figure the owner already approved is unchanged by
   *  construction rather than by tuning. */
  volBps?: number
  /** ⭐⭐⭐ ROUND 30 #14 – WHAT ONE UNIT OF THIS RUNG COST IN WEEK ZERO, in cents. Its PRESENCE is
   *  the predicate, the same shape as `volBps` / `buildWeeks` / `requiresId`: a rung that carries it
   *  is bought and sold in UNITS at a price the world moves, and a rung that does not is bought
   *  whole and valued off what was paid for it.
   *
   *  THE OWNER, 30.08: «И надо логику фонда переделать на покупку ДОЛЕЙ в фонде, как раз доли дадут
   *  возможность расти на горизонте и будут давать разные точки входа, как в жизни. Стоимость
   *  активов будет рассчитываться исходя из стоимости долей. Зашёл, когда доля стоила 4к, через
   *  десять лет она может вполне удвоиться. Или зашёл на пике при цене 7-8к и увидел просадку на
   *  следующий год – имеешь возможность усредниться или зафиксировать убыток.»
   *
   *  ⚠⚠ EVERY 'open' RUNG CARRIES IT AND NO 'fixed' RUNG DOES, and that is a GUARD rather than a
   *  type: `stake: 'open'` already means «a product you choose an amount for» – it is what makes a
   *  rung toppable (`buyAsset`) and divisible (`sellAsset`), and a holding you can add to and take
   *  parts out of is exactly a holding measured in units. TypeScript cannot say «required when
   *  `stake` is open», so `tests/round30-fund-units.test.ts` says it instead, on the catalogue, in
   *  both directions. A third investment added tomorrow is unit-priced because of what it IS.
   *
   *  ⚠ WEEK ZERO AND NOT «TODAY», because the price is a function of the career's own clock: the
   *  drift and the market both ride on top of this number (`unitPriceCents`), so what a unit costs
   *  in week 400 is this times fourteen seasons of the rung's own rate times where the market
   *  stands. His «доля стоила 4к» is this constant; his «через десять лет удвоиться» is the rate. */
  unitBaseCents?: number
  /** ⭐ §3f – HOW LONG FROM THE ORDER TO THE THING, in weeks. Absent on every rung that arrives the
   *  week it is paid for, which is everything slice 1 shipped. */
  buildWeeks?: number
  /** ⭐ §3f – WHAT IT TAKES EVERY YEAR TO KEEP, in basis points OF THE PRICE, IN ITS FIRST YEAR.
   *  Absent on everything that costs nothing to own. See `assetUpkeepCents` for why it is read off
   *  the price. ⚠ «IN ITS FIRST YEAR» IS NEW IN ROUND 30 #15 and it is the only thing that changed
   *  about this field: a rung that carries no `upkeepGrowthBps` below pays this every week forever,
   *  to the cent, exactly as it did before. */
  upkeepBps?: number
  /** ⭐⭐⭐ ROUND 30 #15 – HOW MUCH DEARER IT GETS TO KEEP EACH YEAR, in basis points a year,
   *  compounding on the age of the thing. Absent on every rung whose bill never moves.
   *
   *  THE OWNER, 30.08: «Для машин вполне можно ввести годовую стоимость обслуживания, которая может
   *  с каждым годом немного расти, как в реальности, пока стоимость авто на рынке падает.»
   *
   *  ⚠⚠ THE SHAPE IS HIS AND IT IS TWO CURVES CROSSING, not one. `annualRateBps` already takes the
   *  car's market value DOWN; this takes the bill to keep it UP – and because the bill is a share of
   *  what was PAID while the worth is a share that keeps shrinking, the bill as a fraction of what
   *  the thing is now worth climbs far faster than either curve alone. An eight-year-old car worth
   *  half what it cost and costing half again as much to run is exactly «как в реальности», and it
   *  falls out of the two fields rather than out of a third rule.
   *
   *  ⚠ PRESENCE IS THE PREDICATE, the shelf's own habit (`volBps` / `unitBaseCents` / `buildWeeks` /
   *  `requiresId`). ⚠⚠ AND IT IS DELIBERATELY ABSENT ON THE BOATS AND THE PLANES, which is a scope
   *  decision rather than an oversight: he said «для машин», and the elite rungs' flat 6–10% is the
   *  number §3f's «nothing here can strand a family» was MEASURED against ($23,076.92 a week at
   *  10% of $12M). Compounding that bill is a balance change to a rung whose safety property was
   *  proved at the flat figure, and it is his call, not this item's. The arithmetic for every rung
   *  without this field is byte-identical to what shipped.
   *
   *  ⚠ CAPPED – see `ECONOMY.shop.upkeepGrowthCapX`. A bill that compounds forever is a bill that
   *  eventually eats a career, and «мы ни за что не наказываем» is house law. */
  upkeepGrowthBps?: number
  /** ⭐⭐⭐ ROUND 30 #9 – WHAT THE RUNG IS WORTH, AS A MULTIPLE OF WHAT IT TAKES IN OVER A YEAR.
   *  Absent on everything valued off what was PAID for it, which is every car, house, boat, plane
   *  and academy stage; absent on everything valued in units, which is the two investments.
   *
   *  THE OWNER, 30.08: «сам Merch brand тоже вполне может расти в цене как бизнес по какой-то
   *  логике, похожей на привязку к её рекламе и результатам. Можно провести анализ доходов и
   *  стоимости бренда RF (Roger Federer) для референса.»
   *
   *  ⚠⚠ ITS PRESENCE IS THE THIRD VALUATION IN THE ENGINE, and the three are exclusive by
   *  construction: units (`unitBaseCents`), a business (this), or what was paid times a rate. A rung
   *  carrying two of them would be a rung with two prices, and `tests/round30-brand-value.test.ts`
   *  holds the catalogue to exactly one, in both directions.
   *
   *  ⭐⭐ IT IS THE SAME FUEL AS THE INCOME, WHICH IS HIS OWN «похожей на привязку к её рекламе и
   *  результатам»: the brand takes in `fame x perFamePointCents` a week, and it is WORTH some years
   *  of that. So a title, a Slam final, a top-10 season and a photo shoot each move the value and
   *  the income at once, through one number, and nothing else on the career can move either.
   *
   *  ⚠⚠ AND IT FALLS, WHICH IS THE HALF THAT HAD TO BE DESIGNED IN RATHER THAN HOPED FOR. Fame
   *  decays on a 104-week half-life, so a brand whose career goes quiet is worth less every week –
   *  and that is not a punishment invented for balance, it is the best-documented case in the sport:
   *  Federer's On stake fell about HALF, some $300M, between January 2025 and August 2026 while he
   *  was retired and nothing whatsoever about him changed
   *  (docs/research/player-brands-and-what-they-are-worth.md §3). A shelf rung whose value only ever
   *  rises is the risk-free 7% the fund spent two rounds removing.
   *
   *  ⚠ THE NUMBER IS A CHOICE AND THE RESEARCH SAYS SO: no player-brand transaction publishes both
   *  an earnings figure and a price. The nearest two are Beckham's DRJB at ~10.9x profit and the
   *  Nadal academy at ~31x, which is a band and not a citation (§5.4). See
   *  `ECONOMY.business.merch.valueMultipleX` for why this one is 16 and what was measured to pick it. */
  earningsMultipleX?: number
  /** ⭐ §3g – the rung that must already be owned before this one may be bought (the academy's
   *  stages). Absent on every rung that stands on its own. */
  requiresId?: string
  /** ⭐ §3f – the `ECONOMY.vacation.packages` id this rung unlocks once DELIVERED. Absent on
   *  everything that unlocks nothing. */
  grantsVacationId?: string
  /** ⭐ ROUND 29 PART FOUR P10 – A RUNG THE SHOP NO LONGER SELLS, kept as a tombstone for any save
   *  that holds one. His ruling: «значит убрать этот самолет за 38М и всех делов =)», off the
   *  reachability measurement (72 careers x 780 weeks: 0 of 72 ever took delivery).
   *
   *  ⚠ RETIRED MEANS NOT SOLD, NEVER NOT OWNED: `shopView` draws the row only for a family that
   *  owns one and `buyAsset` refuses it, while everything an OWNED row does – valuation by its own
   *  rate, the weekly upkeep, the sale – keeps working through the entry exactly as before.
   *  Deleting the entry instead would freeze the value, drop the bill and take the row off the
   *  screen with the money still in it (`shopItem`'s courtesy covers a lost id, but a courtesy is
   *  not a plan). Absent on everything still for sale. */
  retired?: boolean
}

/** THE SHELF, cheapest first. A plain read of the constant – there is no per-career catalogue and
 *  there must not be one (§5: adding an item later is not a migration).
 *
 *  ⚠ «CHEAPEST FIRST» HAS ONE DOCUMENTED EXCEPTION SINCE ROUND 29 #5 and it is in the catalogue's
 *  own comment: the academy's four stages read in BUILD order, because a stage cannot be bought
 *  before the one under it. Order is presentation here – `cheapestId` below reduces over the rows
 *  rather than taking the first – so nothing depends on the sort but the eye. */
export function shopCatalogue(): ShopItem[] {
  return ECONOMY.shop.catalogue as unknown as ShopItem[]
}

/** One rung by id, or undefined for an id the catalogue no longer carries.
 *
 *  ⚠ UNDEFINED RATHER THAN A THROW, because a save can outlive a catalogue edit. An owned row whose
 *  rung has been retired must still be sellable and still be readable on screen – the same courtesy
 *  `vacationPackage(booking.packageId)?.label ?? booking.packageId` extends to a retired package. */
export function shopItem(id: string): ShopItem | undefined {
  return shopCatalogue().find((i) => i.id === id)
}

/** WHAT THE FAMILY OWNS, oldest purchase first. Defensive `?? []` for probe worlds. */
export function ownedAssets(world: WorldState): OwnedAsset[] {
  return world.assets ?? []
}

/** WHAT A THING IS WORTH AFTER `weeksHeld` WEEKS, in whole cents.
 *
 *  ⚠ CONTINUOUS AND NOT A SEASONAL STEP, and the difference is visible on the one acceptance this
 *  slice is measured by. A step would make a car worth its full price for fifty-one weeks and then
 *  drop it by 9% overnight, which turns §3b's honest depreciation into a date to sell before – the
 *  exact «buy low, sell before the season» play §4's freeze exists to stop. A smooth curve is also
 *  exact at the boundaries the spec talks in: held for two full seasons is `(1 + r)^2` to the cent,
 *  whichever week of the season it was bought in.
 *
 *  ⚠ ROUNDED ONCE, HERE, and never again: cents are integers everywhere in this engine (CLAUDE.md
 *  «Money is in cents»), so the fraction lives inside this function and nowhere else. The stored
 *  `valueCents` is already whole, which is why the shop needs no rounding at the snapshot boundary
 *  the way `shownCondition` does – `tests/condition-boundary.test.ts`'s own note: «Cents are already
 *  integers and stay integers.»
 *
 *  ⚠⚠ AND `Math.max(0, weeksHeld)` IS LOAD-BEARING SINCE ROUND 29 #5, not a defensive shrug. A
 *  COMMISSIONED thing is ordered years before it exists and its clock starts on DELIVERY
 *  (`basisWeek = readyWeek`), so every week of the wait asks this function for a negative span and
 *  is answered with the price. A contract does not depreciate – there is nothing yet to wear out –
 *  and that falls out of the clamp rather than out of a second rule.
 *
 *  ⭐⭐⭐ ROUND 30 #14 TOOK THE MARKET BACK OUT OF THIS FUNCTION, AND THAT IS THE SHAPE OF THE ITEM.
 *  Part three #16 had added a fourth `marketRatio` argument here, defaulting to 1, and the note that
 *  stood in its place named the default as «the one hazard in this signature»: a caller that priced
 *  the FUND and forgot the ratio would silently get the old risk-free 7%. There is no such caller
 *  and no such argument any more. A market rung is held in UNITS and worth `units × price`
 *  (`unitPriceCents`); this function is what a thing the family bought WHOLE is worth after wearing
 *  or earning for a while, which is every car, house, boat, plane, academy stage and business – and
 *  it is the three-argument arithmetic it had at slice 1, to the cent.
 *
 *  ⚠ THE ONE ENTRY POINT IS STILL `assetWorthCents` BELOW, and both writers of a worth
 *  (`revalueAssets` and `householdWeekly`) still go through it rather than here: it is the function
 *  that knows WHICH of the two arithmetics a row is under, and `tests/round30-fund-units.test.ts`
 *  reads both writers out of a ticked world rather than out of the source.
 *
 *  Pure: no world, no rng, no clock. */
export function assetValueCents(item: ShopItem, paidCents: number, weeksHeld: number): number {
  const years = Math.max(0, weeksHeld) / WEEKS_PER_YEAR
  return Math.round(paidCents * Math.pow(1 + item.annualRateBps / 10_000, years))
}

/** ⭐⭐⭐ ROUND 30 #14 – WHAT ONE UNIT OF `item` COSTS IN WEEK `week`, in cents.
 *
 *  THE OWNER: «Стоимость активов будет рассчитываться исходя из стоимости долей.»
 *
 *  ```
 *  price(week) = unitBaseCents · (1 + annualRateBps/10⁴)^(week/52) · index(seed, week, volBps)
 *  ```
 *
 *  ⭐⭐ THE DRIFT LIVES IN THE PRICE NOW, AND THAT IS THE WHOLE STRUCTURAL CHANGE. Round 29 valued a
 *  holding as `basis × (1+r)^(years SINCE THE BASIS WEEK) × index(now)/index(basisWeek)` – three
 *  numbers that all had to be restated every time money moved, which is what the rebase was. Put the
 *  rate on the PRICE instead and a holding is `units × price(now)`: one multiplication, no basis, no
 *  clock per row, and «зашёл, когда доля стоила 4к» is a fact the save can carry.
 *
 *  ⚠ IT IS THE SAME PATH ROUND 29 SHIPPED, RE-EXPRESSED, NOT A SECOND MODEL. `price(t)/price(f)` is
 *  exactly the old `(1+r)^((t−f)/52) × index(t)/index(f)`, so a single-entry holding is worth the
 *  same cents it was worth yesterday and every measurement round 29 made still describes this path.
 *  What changed is that a SECOND entry no longer restates the first one's clock.
 *
 *  ⚠ FRACTIONAL CENTS ON PURPOSE – «round the display, not the logic». Units are fractional and so
 *  is a price; the ONE rounding is `assetWorthCents`, and `shopView` rounds again only for the eye.
 *
 *  ⚠ A RUNG WITH NO `volBps` IS STILL PRICED HERE, dead flat: `marketIndex` answers exactly 1 for
 *  it (its own zero-vol guard, now the only copy), so the deposit's unit walks its 3.17% and rides
 *  no crisis. That is the arm that dies if that guard is deleted.
 *
 *  ⚠ AND THE CALLER MUST HAVE CHECKED `unitBaseCents` – the `?? 0` here is a total-function
 *  courtesy, not a branch anybody reaches: a rung with no unit price has no units to multiply.
 *
 *  Pure: no world, no MAIN draw, no clock. */
export function unitPriceCents(seed: string, week: number, item: ShopItem): number {
  const years = week / WEEKS_PER_YEAR
  return (
    (item.unitBaseCents ?? 0) *
    Math.pow(1 + item.annualRateBps / 10_000, years) *
    marketIndex(seed, week, item.volBps ?? 0)
  )
}

// =================================================================================================
// ⭐⭐⭐ ROUND 34 #19 – WHAT THE UNIT HAS COST, MONTH BY MONTH. THE CHART'S OWN DATA.
// =================================================================================================
//
// THE OWNER, 02.09: «для индексного фонда давай график нарисуем с точками его стоимости за пай с
// возможностью выбрать промежуток… 6 месяцев, 1 год, 2 года, 5 лет. Мы же сможем хранить по одной
// цифре за месяц средней»
//
// ⚠⚠ AND NOTHING IS STORED, WHICH IS A DEPARTURE FROM HIS OWN SENTENCE AND IS WHY IT IS ARGUED HERE
// RATHER THAN DECIDED QUIETLY. He offered the monthly average as the CHEAP way to afford the chart –
// «мы же сможем хранить» is an answer to an objection about cost. On this engine the chart is
// cheaper than that: `unitPriceCents` is a pure function of the career SEED, the week and the rung
// («Pure: no world, no MAIN draw, no clock», six lines up), because `world/market.ts` was built on
// one load-bearing idea – «THE MARKET EXISTS WHETHER OR NOT SHE BUYS … a path drawn from the
// career's seed alone, READ at the weeks a holding spans rather than DRAWN when one is opened».
// So every past week's price is COMPUTABLE and always was. What he asked to store is derivable.
//
// ⭐⭐ THREE THINGS FALL OUT OF DERIVING IT, AND THE FIRST IS THE ONE THAT DECIDED IT:
//
//   * HIS OWN LIVE CAREER GETS THE FULL CHART THE MOMENT HE LOADS IT. A stored series starts empty,
//     so Vera at week 569 would have opened the new screen on an empty box and waited five years for
//     the feature. Derived, her whole eleven years are there.
//   * THE CHART CANNOT DISAGREE WITH THE CARD ABOVE IT. Both ask `unitPriceCents`; a recorded series
//     is a second source of truth for a number the engine already computes, which `world/shop.ts`
//     calls «a screen and a valuation disagreeing, this repo's most-repeated defect».
//   * NO MIGRATION IS OWED AND NONE IS SPENT. Migrations are append-only forever (CLAUDE.md item 3),
//     so a schema version added for data nothing needs is a permanent cost for no benefit.
//
// ⚠ THE ONE THING STORAGE WOULD BUY is a record of what the player SAW if the market model is ever
// re-tuned. `world/market.ts` has already ruled on that: «Nothing persists any of it, so this is a
// debugging convenience rather than a compatibility promise.» A re-tune already rewrites what a
// holding is worth today (`revalueAssets` re-prices `units × price(week)` every tick), so a frozen
// chart beside a re-priced holding would be the disagreement, not the protection.

// ⚠ THE POINT'S SHAPE IS THE PROTOCOL'S (`ShopPricePoint`) and not a second declaration here: it
// crosses to the screen unchanged, and a private twin is how two structures start to drift. It is
// the month's AVERAGE unit price in WHOLE cents, rounded ONCE at this boundary – the owner's rule of
// 26.08, «у пользователя целые в интерфейсе» – so no screen rounds a price a second time.

/** ⭐⭐ THE LAST `months` CALENDAR MONTHS OF A RUNG'S UNIT PRICE, oldest first, one averaged figure
 *  each – «по одной цифре за месяц средней», his own resolution.
 *
 *  ⚠ A MONTH IS A REAL CALENDAR MONTH (`shared/dates.ts`), not a block of four weeks. The app has one
 *  calendar and every other date on screen is drawn from it; a private «month» of 4.33 weeks would
 *  drift against every label beside it, which is the exact defect the season re-anchor was written to
 *  end. A season is 52 weeks anchored to the first Monday of its own year, so twelve months make a
 *  season and five years make **60 points** – the number his own sentence arrives at.
 *
 *  ⚠ IT NEVER REACHES BEHIND WEEK 0. `marketWave` is defined for negative weeks, so a naive walk
 *  would happily draw a market from before the career began – history the player did not live. A
 *  young career gets a SHORT series and the chart says so; it does not get an invented one.
 *
 *  ⚠ THE MONTH IN PROGRESS IS THE LAST POINT, averaged over the weeks of it that have happened, so
 *  the right-hand end of the chart is now rather than last month.
 *
 *  Pure: seed, week, rung, length. No world, no MAIN draw, no clock, nothing stored. */
export function unitPriceHistory(seed: string, week: number, item: ShopItem, months: number): ShopPricePoint[] {
  if (item.unitBaseCents === undefined || months <= 0) return []
  const now = Math.max(0, Math.floor(week))
  // Walk BACKWARDS a week at a time, closing a bucket whenever the calendar month changes, and stop
  // as soon as `months` of them are complete. ⚠ The walk is bounded by the answer's own size (about
  // 4.34 weeks a month, so ~260 iterations for the five-year range) rather than by the career's
  // length, which is what keeps a thirty-season career the same cost as a two-season one.
  const out: ShopPricePoint[] = []
  let w = now
  while (w >= 0 && out.length < months) {
    const month = weekMonth(w)
    const year = weekYear(w)
    let sum = 0
    let count = 0
    let first = w
    while (w >= 0 && weekMonth(w) === month && weekYear(w) === year) {
      sum += unitPriceCents(seed, w, item)
      count++
      first = w
      w--
    }
    out.push({ week: first, cents: Math.round(sum / count) })
  }
  return out.reverse()
}

/** ⭐⭐⭐ WHAT A HOLDING IS WORTH, ASKED OF THE WORLD. THE one entry point: `revalueAssets` (which
 *  stores it) and `householdWeekly` (which quotes the week's move) both call this and nothing else,
 *  so the till and the meter cannot describe two different markets.
 *
 *  ⭐⭐ ROUND 30 #14 – TWO ARITHMETICS, AND **THE ROW** SAYS WHICH. A row that carries `units` is
 *  worth `units × price(now)` and nothing else; a row that does not is worth what was paid,
 *  compounded over its own span. ⚠ THE PREDICATE IS THE ROW AND NOT THE RUNG **HERE**, deliberately
 *  and only here: `units` is the field that makes the multiplication possible, so reading it is the
 *  same question as «can this be priced that way», and there is no `?? 0` to hide a corrupt row
 *  behind. Everywhere a DECISION is made – `buyAsset`, `shopView`, the migration – the predicate is
 *  the RUNG's `unitBaseCents`, because that is the thing that says what a rung is. `buyAsset` writes
 *  the units and the v66 migration back-fills them, so the two predicates agree on every row any
 *  save can hold, and `tests/round30-fund-units.test.ts` walks a career to prove it rather than
 *  asserting it here.
 *
 *  ⚠⚠ AND THE REBASE IS GONE WITH THE `??` PAIR THAT SERVED IT. Round 29 #11's top-up and part two
 *  #4's part sale both restated `basisCents`/`basisWeek`, and this function opened by falling back
 *  through them. `basisCents` no longer exists: money buys units at the week's price and the units
 *  are the memory. `basisWeek` survives with ONE meaning and one writer – §3f's commissioned order,
 *  whose value clock starts on DELIVERY – so the fallback below is live in both directions on every
 *  save (a car has none, a yacht has one).
 *
 *  ⭐ `weekOffset` IS `householdWeekly`'S «ONE MORE WEEK OF HOLDING» and the reason this takes a
 *  world rather than a week: the shelf line is the difference of THIS function at 0 and at 1, so
 *  when the curve changes the meter changes with it, for free.
 *
 *  ⚠ ZERO MAIN DRAWS. The market path is a sub-stream keyed on the seed and a week; see
 *  `world/market.ts`'s header for why a purchase cannot move the world's dice through it.
 *
 *  Pure: reads the world, writes nothing. */
export function assetWorthCents(world: WorldState, owned: OwnedAsset, item: ShopItem, weekOffset = 0): number {
  const week = world.week + weekOffset
  if (owned.units !== undefined) return Math.round(owned.units * unitPriceCents(world.seed, week, item))
  // ⭐⭐⭐ ROUND 30 #9 – THE THIRD ARITHMETIC, AND IT IS THE ONLY ONE THAT READS THE CAREER. A car is
  // worth what was paid for it, worn down by a rate; a fund is worth its units times a price; a
  // BUSINESS is worth some years of what it takes in, and what this one takes in is her fame.
  if (item.earningsMultipleX !== undefined) {
    // ⭐⭐⭐ ROUND 30 #23 – THE OWNERSHIP BOUNDARY, and it is the only line in the engine that turns a
    // BRAND into a HOLDING. `world/brand.ts` prices a whole brand off the career and knows nothing
    // about who owns it; this is where the owned row applies itself, and today the family owns all of
    // one, so the share is an unwritten multiplication by 1.
    //
    // ⚠⚠ THAT IS A DOOR AND NOT A HINGE (the owner: «по сути этот мерч бренд это фундамент для этого
    // слоя»). A partner buying into her brand is a share on THIS row and a `x share` on THIS line –
    // not a second income model beside the first. No field is added for it today, because an unused
    // field is a dead field and this repo has spent the week digging out dead guards. See
    // docs/specs/brand-worth-and-income-2026-08.md §6.
    //
    // ⚠⚠ THE FAMILY GATE IS REPEATED HERE ON PURPOSE and is not a tidy-up waiting to happen. It is
    // the same guard `assetEarningsRateCents` applies below, and before round 30 #23 this branch
    // inherited it for free by going THROUGH that function. It now goes through `world/brand.ts`,
    // which prices a brand and does not know what a shelf family is – so an academy stage handed a
    // multiple by mistake would have been valued off the merch dial. `tests/round30-brand-value.test.ts`
    // §1 asserts the zero in both directions.
    const grossCents =
      item.family === 'business' ? brandGrossWorthCents(brandSignalsOf(world, week), item.earningsMultipleX) : 0
    // ⚠⚠ THE FLOOR IS THE MARK, AND IT IS A SOURCED IDEA RATHER THAN A KINDNESS. Björn Borg's own
    // company went bankrupt in 1990 and the NAME was still bought outright for $18M in 2006 and is a
    // listed company today (the research §4d) – a brand with no earnings left is not a brand with no
    // value. It is also what keeps «мы ни за что не наказываем» true of the week she is between
    // reigns: the family can always sell the name.
    return Math.round(Math.max(owned.paidCents * ECONOMY.shop.businessValueFloorShare, grossCents))
  }
  return assetValueCents(item, owned.paidCents, week - (owned.basisWeek ?? owned.boughtWeek))
}

/** ⭐⭐⭐ ROUND 30 #9 – WHAT AN EARNING RUNG TAKES IN THIS WEEK, in cents, BEFORE the question of
 *  whether the family owns one. THE arithmetic for the merch line, and it lives here rather than in
 *  `world/business.ts` for one structural reason: `assetWorthCents` above has to ask it, `business.ts`
 *  imports THIS file, and a leaf that imported it back would be a cycle. `assetWeeklyIncomeCents`
 *  calls this and adds the ownership and delivery guards, so there is still exactly ONE place where
 *  fame becomes money – `world/business.ts`' own «ONE DEFINITION, MANY READERS» rule, moved rather
 *  than broken.
 *
 *  ⚠ IT ANSWERS ZERO FOR EVERY RUNG THAT IS NOT A BUSINESS, so the guard on `earningsMultipleX`
 *  above cannot silently price an academy stage off the merch dial. A second earning family added
 *  tomorrow extends THIS function; `tests/round30-brand-value.test.ts` holds the catalogue to one
 *  rung carrying the multiple, so a second one cannot arrive without the arm to price it.
 *
 *  Pure: reads the world, writes nothing, draws nothing – `fameAt` is a fold over records the career
 *  already keeps (world/fame.ts). */
export function assetEarningsRateCents(world: WorldState, item: ShopItem, week = world.week): number {
  if (item.family !== 'business') return 0
  // ⭐⭐⭐ ROUND 30 #23 – CONVEX IN FAME SINCE 30.08, and the curve is `world/brand.ts`'s, not a second
  // copy of it here. This function keeps the job it has always had – the ONE place a career becomes
  // a weekly cheque – and hands the shape to the file that also prices the worth, so the income the
  // ledger pays and the income the valuation multiplies are the same arithmetic by construction.
  return brandWeeklyGrossCents(brandSignalsOf(world, week))
}

/** ⭐⭐ ROUND 30 #14 – WHAT THE FAMILY PAID PER UNIT, AVERAGED OVER EVERY PURCHASE, in cents. Null
 *  for a holding that is not measured in units.
 *
 *  ⭐⭐⭐ THIS IS THE NUMBER THE ITEM EXISTS TO PUT ON SCREEN. «Имеешь возможность усредниться или
 *  зафиксировать убыток» is not a mechanic a player can use unless the game tells him where his
 *  average is against today's price – averaging down is a DECISION when you can see you are below
 *  it and a feeling when you cannot. Round 29's rebased basis could not say it at all: it folded
 *  every entry into one restated number.
 *
 *  ⚠⚠ AND `units <= 0` IS A REAL CLAUSE, NOT A HABIT: it is the difference between a screen that
 *  says nothing and a screen that says `Infinity`. No command can produce a zero-unit row – a whole
 *  sale deletes the row, a part sale leaves units behind by construction, and the v66 back-fill
 *  divides a positive basis – but a corrupted or hand-built row can, and `shared/money.ts`' house
 *  rule is that a fact and a missing value must not look the same. `tests/round30-fund-units.test.ts`
 *  drives one through `shopView` rather than leaving the clause to be trusted.
 *
 *  ⚠ IT IS `paidCents / units` AND THEREFORE SURVIVES A PART SALE UNCHANGED, which is what makes
 *  «зафиксировать убыток» honest: a sale takes the same fraction out of the cash and out of the
 *  units (`sellAsset`), so the average the family entered at does not move when they realise part of
 *  a loss. Only a BUY moves it – which is exactly what averaging down means. */
export function avgUnitPriceCents(owned: OwnedAsset): number | null {
  if (owned.units === undefined || owned.units <= 0) return null
  return owned.paidCents / owned.units
}

/** ⭐⭐ ROUND 29 PART THREE #16 – WHAT THE MARKET DID TO THIS RUNG OVER THE LAST SEASON, as a signed
 *  fraction (-0.083 is «down 8%»). Zero for every rung that does not ride the market.
 *
 *  ⚠⚠ IT IS THE HOLDING'S WHOLE MOVE AND NOT THE WOBBLE'S, drift included, because that is the
 *  number a player can check against his own row. «The fund this year: −8%» has to be the thing that
 *  happened to the money, not a component of it that nothing on screen shows.
 *
 *  ⚠ AND IT IS A FRACTION RATHER THAN A ROUNDED PERCENT, because the house rule is «round the
 *  DISPLAY, not the logic». The one caller that prints it rounds once, where it prints.
 *
 *  ⚠ A CAREER YOUNGER THAN A SEASON LOOKS BACK TO WEEK 0 rather than to a negative week – the market
 *  has no history before the career starts, and a shorter window is the honest answer for a shorter
 *  life. Nothing prints it before week 52 anyway; the clamp is here so the function is total. */
export function marketSeasonMove(item: ShopItem, seed: string, week: number): number {
  if (!item.volBps) return 0
  const from = Math.max(0, week - WEEKS_PER_YEAR)
  // ⭐ ROUND 30 #14 – A RATIO OF TWO UNIT PRICES, which is the same number the two-factor form
  // computed (`(1+r)^span × index(now)/index(then)`) said in the shape the shop card now speaks in.
  return unitPriceCents(seed, week, item) / unitPriceCents(seed, from, item) - 1
}

/** ⭐⭐ ROUND 29 #5, §3f – WHAT ONE WEEK OF KEEPING IT COSTS, in whole cents. Zero for every rung
 *  that carries no `upkeepBps`, which is every house and investment on the shelf.
 *
 *  ⚠⚠ IT IS A SHARE OF WHAT WAS PAID AND NOT OF WHAT IT IS WORTH TODAY, and the choice is the
 *  spec's own arithmetic rather than a preference. §3f's table quotes «upkeep / week» beside
 *  «price», and every figure in it is `price x pct / 52` to the dollar – $12,000,000 at 10% is the
 *  $23,076.92 it names. Reading the CURRENT value instead would make the bill shrink a little every
 *  week as the boat ages, which is a second mechanic the spec never asks for and which nothing on
 *  screen could explain: a crew does not take a pay cut because the hull got older.
 *
 *  ⭐⭐⭐ ROUND 30 #15 GAVE IT AN AGE, AND THE SENTENCE ABOVE IS WHY IT IS AN AGE AND NOT A VALUE.
 *  The owner: «годовая стоимость обслуживания, которая может с каждым годом немного расти, как в
 *  реальности, пока стоимость авто на рынке падает.» A bill indexed to the CURRENT worth would fall
 *  as the car aged, which is backwards; a bill indexed to the price and multiplied by the thing's
 *  own age rises, which is what happens to a car. Both curves are now on screen and they run in
 *  opposite directions, which is the item.
 *
 *  ⚠ CONTINUOUS AND NOT A YEARLY STEP – `assetValueCents`' own argument twenty lines up, read in the
 *  other direction. A step would hold the bill flat for fifty-one weeks and then raise it overnight
 *  on an anniversary nothing on screen names, and it would create a week to sell before. His «с
 *  каждым годом» is the RATE; a smooth curve is exact at every anniversary he could check.
 *
 *  ⚠⚠ AND THE OLD PROMISE STILL HOLDS WHERE IT WAS MADE. This function's note used to end «AND IT IS
 *  THE FIGURE THE PLAYER WAS QUOTED, FOREVER», which is now true of every rung that carries no
 *  `upkeepGrowthBps` – the boats, the planes, and everything the elite shelf shipped – and cannot be
 *  true of one whose whole point is that it grows. The promise it was protecting is kept the other
 *  way round: `shopView` quotes an OWNED row at THIS week's figure, so what the card says and what
 *  the till charges are still one number asked of one function. Both are proved on a ticked world in
 *  `tests/round30-car-upkeep.test.ts` rather than trusted from here.
 *
 *  ⚠ `weeksHeld` IS REQUIRED, NOT DEFAULTED, and that is round 30 #14's lesson taken literally: the
 *  fund's `marketRatio` argument defaulted to 1 and its own note called the default «the one hazard
 *  in this signature», because a caller that forgot it got the wrong answer silently. A caller that
 *  forgets this one does not compile.
 *
 *  Pure: no world, no rng, no clock. */
export function assetUpkeepCents(item: ShopItem, paidCents: number, weeksHeld: number): number {
  if (!item.upkeepBps) return 0
  const weekly = (paidCents * item.upkeepBps) / 10_000 / WEEKS_PER_YEAR
  if (!item.upkeepGrowthBps) return Math.round(weekly)
  // ⚠ `Math.max(0, weeksHeld)` FOR `assetValueCents`' OWN REASON: a commissioned rung's clock starts
  // on delivery, so every week of the wait asks for a negative span. Nothing with a build time
  // carries growth today, and the clamp is what keeps that from being an assumption.
  const years = Math.max(0, weeksHeld) / WEEKS_PER_YEAR
  const grown = Math.min(Math.pow(1 + item.upkeepGrowthBps / 10_000, years), ECONOMY.shop.upkeepGrowthCapX)
  return Math.round(weekly * grown)
}

/** ⭐ ROUND 30 #15 – HOW LONG THIS FAMILY HAS HAD THIS THING, in weeks, off the world's own clock.
 *
 *  ⚠⚠ IT IS THE **SAME** SPAN `assetWorthCents` DEPRECIATES OVER – `basisWeek ?? boughtWeek` – and
 *  that is the whole reason it is a function rather than an expression repeated at three call sites.
 *  The two curves he described only cross honestly if they are drawn against one clock: a car whose
 *  value has fallen for six years must be a car whose upkeep has risen for six years, and a second
 *  copy of this arithmetic is exactly how those two would drift apart. `world/assets.ts`' own «one
 *  arithmetic, one writer» rule, applied before there was a second writer. */
export function assetHeldWeeks(world: WorldState, owned: OwnedAsset): number {
  return world.week - (owned.basisWeek ?? owned.boughtWeek)
}

/** ⭐ §3f – IS IT HERE YET? Absent `readyWeek` means «delivered», which is what every row written
 *  before round 29 #5 already means and what `deliverAssets` restores by removing the key.
 *
 *  ⚠ ONE PREDICATE, FIVE READERS: the sale (`sellableAsset`), the weekly bill
 *  (`weeklyAssetUpkeepCents`), the vacation grant (`grantedVacationIds`), the plane's fare and the
 *  plane's rest week. A contract is not a boat, and this is the one place that sentence is code. */
export function assetDelivered(owned: OwnedAsset): boolean {
  return owned.readyWeek === undefined
}

/** Every DELIVERED holding paired with its catalogue rung, skipping a row whose rung has been
 *  retired (the same courtesy `revalueAssets` extends – it keeps its value and stops being priced).
 *  Oldest purchase first. */
export function deliveredAssets(world: WorldState): { owned: OwnedAsset; item: ShopItem }[] {
  const out: { owned: OwnedAsset; item: ShopItem }[] = []
  for (const owned of ownedAssets(world)) {
    if (!assetDelivered(owned)) continue
    const item = shopItem(owned.id)
    if (item) out.push({ owned, item })
  }
  return out
}

/** ⭐ DOES THE FAMILY HAVE ONE OF THESE, HERE AND NOW? The plane's two effects and nothing else ask
 *  this, and they ask it of the FAMILY rather than of a rung id – §3f gives the two aircraft three
 *  different numbers and one identical purpose, so «do they own a plane» is the honest question. */
export function ownsDeliveredOfFamily(world: WorldState, family: ShopItem['family']): boolean {
  return deliveredAssets(world).some((row) => row.item.family === family)
}

/** ⭐⭐ §3f – THE VACATION PACKAGES THE SHELF HAS UNLOCKED, deduplicated. A family that owns both
 *  yachts has one week on a yacht, not two.
 *
 *  ⚠ DELIVERED ONLY, and §3f is explicit about the case: the week «appears in `PlanWeekSheet` only
 *  while the yacht is owned and delivered – not while it is still building», because the contract
 *  is not a boat and nobody can spend a week on a contract. */
export function grantedVacationIds(world: WorldState): string[] {
  const ids = new Set<string>()
  for (const { item } of deliveredAssets(world)) {
    if (item.grantsVacationId) ids.add(item.grantsVacationId)
  }
  return [...ids]
}

/** ⭐⭐ §3f – WHAT THE WHOLE SHELF COSTS TO KEEP THIS WEEK, in cents, as a POSITIVE magnitude.
 *
 *  ⚠ DELIVERED ONLY. There is no crew on a hull that does not exist, and that is the half of §3f's
 *  commissioning that keeps it inside «мы ни за что не наказываем»: the weeks in which the thing
 *  cannot be sold are exactly the weeks in which it costs nothing, so no family is ever locked into
 *  a bill it has no way out of.
 *
 *  ⚠ ONE DEFINITION, TWO READERS – the till (`resolveAssetUpkeep`, which really charges it) and the
 *  household meter (`householdWeekly`, which quotes it). This repo's most-repeated defect is two
 *  sides asking different functions about one question. */
export function weeklyAssetUpkeepCents(world: WorldState): number {
  let total = 0
  // ⭐ ROUND 30 #15 – ...AND AT THIS WEEK'S FIGURE, which is the same figure the till charges: both
  // sides ask `assetUpkeepCents` with `assetHeldWeeks`, so the meter and the bill still cannot
  // disagree once one of them started moving.
  for (const { owned, item } of deliveredAssets(world)) {
    total += assetUpkeepCents(item, owned.paidCents, assetHeldWeeks(world, owned))
  }
  return total
}

// =================================================================================================
// ⭐⭐⭐ ROUND 30 #8 AND #10 – THE FAMILY NAMES THE THINGS IT BUILDS.
//
// THE OWNER, 30.08, on the brand: «Merch brand давай предложим пользователю несколько вариантов
// именования при покупке… один из вариантов "ввести своё название" – это придаст +100 к
// индивидуальности сразу. Среди вариантов по дефолту могут быть инициалы ребёнка или что-то
// связанное с именем или фамилией.» And on the academy: «И нейминг для академии тоже по принципу
// бренда, как раз одним из вариантов можно предложить уже существующее название бренда (если он
// есть) или снова "ввести своё".»
//
// ⚠⚠ THE NAME BELONGS TO THE FAMILY OF RUNGS, NOT TO THE ROW, and that is what makes the academy
// work at all: it is FOUR purchases and one institution. The name is written on the first rung of
// its family the household buys and every later stage reads it, so «The Martin Academy» does not
// become four differently-named buildings. One field, one reader, no second place for it to live.
//
// ⚠⚠ IT IS PLAYER-AUTHORED TEXT THAT IS PERSISTED AND RENDERED, so the rules are stated rather than
// assumed – see `sanitiseAssetName` for all four of them (a length cap, an allow-list, what an empty
// entry becomes, and why none of it can break a 375px row).
// =================================================================================================

/** ⭐ THE FAMILIES THAT CARRY A NAME. The cars, the houses, the boats, the planes and the two
 *  investments do not: you do not name a saloon, and «+100 к индивидуальности» is about the things
 *  the family BUILDS with her name on them. */
export const NAMEABLE_FAMILIES: readonly ShopItem['family'][] = ['business', 'academy']

export function isNameable(item: ShopItem): boolean {
  return NAMEABLE_FAMILIES.includes(item.family)
}

/** ⭐ WHAT THE FAMILY CALLED ITS `family`, or null when it owns nothing of it yet.
 *
 *  ⚠ THE FIRST OWNED ROW OF THE FAMILY, in purchase order (`world.assets` is oldest-first – see
 *  `ownedAssets`), so a four-stage academy answers with the name given when the LAND was bought and
 *  a later stage cannot rename it. ⚠ AND A ROW WITH NO NAME IS SKIPPED rather than answering null:
 *  a save that owned a brand before this item exists (v66 back-fills it, but a hand-built probe
 *  world does not) must not make the whole family nameless. */
export function assetNameOf(world: WorldState, family: ShopItem['family']): string | null {
  for (const owned of ownedAssets(world)) {
    if (shopItem(owned.id)?.family !== family) continue
    if (!owned.name) continue
    // ⚠⚠ SANITISED ON THE WAY **OUT** AS WELL AS ON THE WAY IN, AND THAT IS THE POINT OF DOING IT
    // HERE. `buyAsset` bounds what the game itself stores, which covers every name any player can
    // create – but a save file is a file, and an imported or hand-edited one can carry a row with a
    // ten-thousand-character name that no command ever wrote. `saveGuard`'s bounds walk caps a string
    // at 32,768 characters, which stops a hostile PAYLOAD and is four hundred times too loose to stop
    // a broken LAYOUT. Re-bounding at the one function every reader goes through makes «no name that
    // reaches a screen is longer than `ASSET_NAME_MAX_CHARS`» a property rather than a hope, and it
    // costs one pass over at most twenty-four characters.
    const safe = sanitiseAssetName(owned.name, '')
    if (safe) return safe
  }
  return null
}

/** ⭐⭐ THE NAMES THE GAME OFFERS, in the order they are shown, and every one of them is made out of
 *  HER – which is the whole of «придаст +100 к индивидуальности сразу». A generic list would be the
 *  opposite of what he asked for.
 *
 *  For a girl called Vera Martin the brand reads `VM` / `Martin` / `Vera Martin` / `House of Martin`,
 *  and the academy reads her brand's name FIRST when she has one (his own «уже существующее название
 *  бренда»), then `Martin Academy` / `Vera Martin Academy` / `VM Academy`.
 *
 *  ⚠ THE LIST IS NEVER EMPTY AND ITS FIRST ENTRY IS THE DEFAULT, which is what makes «what happens
 *  to an empty entry» answerable without a refusal: `sanitiseAssetName` falls back to it.
 *
 *  ⚠ DE-DUPLICATED, because the academy's first suggestion can equal one of the others when the
 *  brand was itself named after the surname – two identical chips is a bug the eye sees instantly.
 *
 *  ⚠ AND EVERY ENTRY GOES THROUGH THE SAME CAP THE FREE-TEXT FIELD DOES: a long surname must not
 *  produce a suggestion the player could not have typed. */
export function assetNameSuggestions(world: WorldState, family: ShopItem['family']): string[] {
  return nameSuggestionsFor(
    world.profile?.kidName ?? '',
    world.profile?.kidLastName ?? '',
    family,
    assetNameOf(world, 'business'),
  )
}

/** ⭐ THE SAME LIST, ASKED WITHOUT A WORLD – the pure core `assetNameSuggestions` wraps.
 *
 *  ⚠⚠ IT EXISTS FOR ONE CALLER AND THAT CALLER IS THE MIGRATION – the v66 -> v67 step, which names
 *  a v66 save's rows from a RAW SAVE OBJECT and has no `WorldState` to ask. (It was written against
 *  the v65 -> v66 step and moved with the rest of that back-fill when v66 shipped underneath it;
 *  what it reads did not change, since v66 writes no field this cares about.) Splitting it is the
 *  only way the migration's
 *  default and the shop's default can be the same list – and if they were not, a save that arrived
 *  through the migration would carry a name the game itself would never have offered. */
export function nameSuggestionsFor(
  kidName: string,
  kidLastName: string,
  family: ShopItem['family'],
  brandName: string | null,
): string[] {
  const first = kidName.trim()
  const last = kidLastName.trim()
  const initials = `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase()
  const both = [first, last].filter(Boolean).join(' ')
  const out: string[] = []
  if (family === 'academy') {
    // ⭐ HIS OWN FIRST OPTION: the brand they already built, if they built one.
    if (brandName) out.push(brandName)
    if (last) out.push(`${last} Academy`)
    if (both) out.push(`${both} Academy`)
    if (initials.length === 2) out.push(`${initials} Academy`)
  } else {
    if (initials.length === 2) out.push(initials)
    if (last) out.push(last)
    if (both && both !== last) out.push(both)
    if (last) out.push(`House of ${last}`)
  }
  const capped = out.map((n) => cutToLimit(n)).filter((n) => n.length > 0)
  const seen = new Set<string>()
  const unique = capped.filter((n) => (seen.has(n) ? false : (seen.add(n), true)))
  // ⚠ THE LAST-RESORT ENTRY EXISTS SO THE LIST CANNOT BE EMPTY. A profile with no name at all is not
  // reachable through onboarding (`kidName` is required and the save guard bounds it), but a
  // hand-built probe world is, and a default that is `undefined` is how a null reaches a template.
  return unique.length > 0 ? unique : [family === 'academy' ? 'The Academy' : 'The Brand']
}

/** ⭐⭐⭐ THE FOUR RULES FOR PLAYER-AUTHORED TEXT, STATED RATHER THAN ASSUMED. This string is typed by
 *  a person, written into a save, carried across versions and rendered on a phone, so each of those
 *  four has an answer and this function is all four of them.
 *
 *  **1. A LENGTH CAP OF `ASSET_NAME_MAX_CHARS` (24), COUNTED IN CODE POINTS.** Twenty-four is what a
 *  shop row holds on a 375px screen beside its price without wrapping to a third line, and the
 *  screen sets the same number as the field's `maxlength` so the cap is felt while typing rather
 *  than applied silently afterwards. ⚠ CODE POINTS AND NOT `.slice`: `str.slice(0, 24)` can cut a
 *  surrogate pair in half and produce an unrenderable character, and some scripts' letters are
 *  astral. `[...str]` iterates code points.
 *
 *  **2. AN ALLOW-LIST, NOT A DENY-LIST.** Unicode letters and digits, the space, and `& . ' -` –
 *  which is every character real brands use (`S by Serena`, `H&M`, `Levi's`, `Ben & Jerry's`) and
 *  nothing else. ⚠ IT IS AN ALLOW-LIST BECAUSE A DENY-LIST IS A LIST OF THE THINGS SOMEBODY THOUGHT
 *  OF: control characters, bidirectional overrides, zero-width joiners and combining stacks are all
 *  refused by not being on it. ⚠ CYRILLIC IS ALLOWED and that is deliberate – the house rule against
 *  it is about OUR copy in a template (`tests/template-copy-rules.test.ts` reads source files), and
 *  a player typing his daughter's name in his own alphabet is data, not copy.
 *  ⚠ Vue escapes interpolated text, so markup is a LAYOUT question here and never an injection one;
 *  nothing in this engine renders a name through `v-html`.
 *
 *  **3. AN EMPTY ENTRY IS NOT A REFUSAL, IT IS THE DEFAULT.** Blank, whitespace-only, or a string
 *  that is nothing but disallowed characters all become `fallback` – the first suggestion, which is
 *  built from her own name. «мы ни за что не наказываем» applies to a text field too: a player who
 *  clears the box and presses Buy gets a brand called after his daughter, not an error.
 *
 *  **4. WHITESPACE IS COLLAPSED AND TRIMMED**, so `  V   M  ` and `V M` are the same brand and no
 *  name can be made of spaces to hide the row.
 *
 *  Pure: no world, no rng, no clock. */
export const ASSET_NAME_MAX_CHARS = 24

/** The allow-list of rule 2, as one class. `u` is required for `\p{...}` to mean anything at all. */
const NAME_ALLOWED = /[\p{L}\p{N} &.'-]/u

function cutToLimit(raw: string): string {
  return [...raw].slice(0, ASSET_NAME_MAX_CHARS).join('').trim()
}

export function sanitiseAssetName(raw: string | undefined, fallback: string): string {
  // ⚠⚠ WHITESPACE BECOMES A SPACE **BEFORE** THE ALLOW-LIST, AND THE ORDER IS THE BUG THIS FUNCTION
  // ALREADY HAD ONCE. The list allows the plain space and nothing else, so filtering first turned a
  // pasted `Martin\n\tHouse` into `MartinHouse` – two words glued into one, silently. Normalising
  // first keeps the word boundary and still refuses the character itself. Caught by
  // `tests/round30-brand-naming.test.ts` rule 2, on its first run.
  const spaced = (raw ?? '').replace(/\s/gu, ' ')
  const kept = [...spaced].filter((ch) => NAME_ALLOWED.test(ch)).join('')
  const collapsed = kept.replace(/ +/g, ' ').trim()
  const cut = cutToLimit(collapsed)
  return cut.length > 0 ? cut : fallback
}
