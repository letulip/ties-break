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
import { marketRatio } from './market'
import type { OwnedAsset } from '../../shared/protocol'
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
  /** ⭐ §3f – HOW LONG FROM THE ORDER TO THE THING, in weeks. Absent on every rung that arrives the
   *  week it is paid for, which is everything slice 1 shipped. */
  buildWeeks?: number
  /** ⭐ §3f – WHAT IT TAKES EVERY YEAR TO KEEP, in basis points OF THE PRICE. Absent on everything
   *  that costs nothing to own. See `assetUpkeepCents` for why it is read off the price. */
  upkeepBps?: number
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
 *  ⭐⭐⭐ ROUND 29 PART THREE #16 ADDED `marketRatio`, AND IT IS THE WHOLE OF THE FUND MECHANIC. The
 *  curve above is the LONG RUN; this is where the holding actually stands on it, read off
 *  `world/market.ts`'s seeded path between the basis week and this one. Every rung with no `volBps`
 *  passes 1 and gets the byte-identical arithmetic this function has always done – which is why the
 *  default is 1 and not a branch, and why no car, house or deposit moved by a cent.
 *
 *  ⚠⚠ AND THE DEFAULT IS THE ONE HAZARD IN THIS SIGNATURE, so it is named rather than trusted: a
 *  caller that priced the FUND and forgot the ratio would silently get the old risk-free 7% and
 *  nothing would look wrong. That is why `assetWorthCents` below exists and why both writers of a
 *  worth (`revalueAssets` and `householdWeekly`) go through it instead of here – there is exactly one
 *  place in the engine that knows how to turn a holding into a number, and
 *  `tests/round29p3-market.test.ts` reads both of them out of a ticked world rather than the source.
 *
 *  Pure: no world, no rng, no clock. */
export function assetValueCents(item: ShopItem, paidCents: number, weeksHeld: number, marketRatio = 1): number {
  const years = Math.max(0, weeksHeld) / WEEKS_PER_YEAR
  return Math.round(paidCents * Math.pow(1 + item.annualRateBps / 10_000, years) * marketRatio)
}

/** ⭐⭐⭐ ROUND 29 PART THREE #16 – WHAT A HOLDING IS WORTH, ASKED OF THE WORLD. THE one entry point:
 *  `revalueAssets` (which stores it) and `householdWeekly` (which quotes the week's move) both call
 *  this and nothing else, so the till and the meter cannot describe two different markets.
 *
 *  ⚠ THE BASIS AND THE CLOCK ARE THE `??` PAIR ROUND 29 #11 AND PART TWO #4 BOTH WROTE, gathered
 *  here once instead of copied at two call sites. A top-up rebases `basisCents`/`basisWeek`; a part
 *  sale rebases the same two by the same arithmetic; an untouched holding has neither and falls back
 *  to `paidCents`/`boughtWeek`, which is what every save written before those items means.
 *
 *  ⭐ `weekOffset` IS `householdWeekly`'S «ONE MORE WEEK OF HOLDING» and the reason this takes a
 *  world rather than a week: the shelf line is the difference of THIS function at 0 and at 1, so
 *  when the curve changes the meter changes with it, for free. It was the difference of
 *  `assetValueCents` before and it is the difference of this now – the same discipline, one level up,
 *  because the market ratio needs the seed and the absolute week and `assetValueCents` has neither.
 *
 *  ⚠ ZERO MAIN DRAWS. The market path is a sub-stream keyed on the seed and a week; see
 *  `world/market.ts`'s header for why a purchase cannot move the world's dice through it.
 *
 *  Pure: reads the world, writes nothing. */
export function assetWorthCents(world: WorldState, owned: OwnedAsset, item: ShopItem, weekOffset = 0): number {
  const basisCents = owned.basisCents ?? owned.paidCents
  const basisWeek = owned.basisWeek ?? owned.boughtWeek
  const week = world.week + weekOffset
  return assetValueCents(item, basisCents, week - basisWeek, marketRatio(world.seed, basisWeek, week, item.volBps ?? 0))
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
  const growth =
    Math.pow(1 + item.annualRateBps / 10_000, (week - from) / WEEKS_PER_YEAR) *
    marketRatio(seed, from, week, item.volBps)
  return growth - 1
}

/** ⭐⭐ ROUND 29 #5, §3f – WHAT ONE WEEK OF KEEPING IT COSTS, in whole cents. Zero for every rung
 *  that carries no `upkeepBps`, which is every car, house and investment on the shelf.
 *
 *  ⚠⚠ IT IS A SHARE OF WHAT WAS PAID AND NOT OF WHAT IT IS WORTH TODAY, and the choice is the
 *  spec's own arithmetic rather than a preference. §3f's table quotes «upkeep / week» beside
 *  «price», and every figure in it is `price x pct / 52` to the dollar – $12,000,000 at 10% is the
 *  $23,076.92 it names. Reading the CURRENT value instead would make the bill shrink a little every
 *  week as the boat ages, which is a second mechanic the spec never asks for and which nothing on
 *  screen could explain: a crew does not take a pay cut because the hull got older.
 *
 *  ⚠ AND IT IS THE FIGURE THE PLAYER WAS QUOTED, FOREVER. A weekly cost that drifts away from the
 *  number on the card is the shape of defect this file's own «one arithmetic, one writer» rule
 *  exists to stop.
 *
 *  Pure: no world, no rng, no clock. */
export function assetUpkeepCents(item: ShopItem, paidCents: number): number {
  if (!item.upkeepBps) return 0
  return Math.round((paidCents * item.upkeepBps) / 10_000 / WEEKS_PER_YEAR)
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
  for (const { owned, item } of deliveredAssets(world)) total += assetUpkeepCents(item, owned.paidCents)
  return total
}
