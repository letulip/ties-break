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
// ⚠⚠ ZERO DRAWS, AND THE IMPORT LIST IS THE GUARANTEE rather than a claim about one: no RNG, no
// clock, no `Math.random`. The frozen MAIN capture (41550 / e6b0c709) cannot see any of it.
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { OwnedAsset } from '../../shared/protocol'
import type { WorldState } from '../world'

/** One rung of `ECONOMY.shop.catalogue`, with the constant's literal types widened back to the
 *  shapes the rest of the engine reasons in. */
export interface ShopItem {
  id: string
  /** ⭐ ROUND 29 #5 added the last three (§3f, §3g) – the two commissioned families and the one
   *  thing on the shelf that is built in stages. */
  family: 'investment' | 'car' | 'house' | 'boat' | 'plane' | 'academy'
  /** 'fixed' – one price. 'open' – the family chooses an amount, at least `entryCents` (§3a's
   *  minimums: a deposit is not a $1,000 thing you buy). */
  stake: 'fixed' | 'open'
  label: string
  blurb: string
  entryCents: number
  /** signed basis points a year. NEGATIVE IS THE POINT for §3b's family. */
  annualRateBps: number
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
 *  Pure: no world, no rng, no clock. */
export function assetValueCents(item: ShopItem, paidCents: number, weeksHeld: number): number {
  const years = Math.max(0, weeksHeld) / WEEKS_PER_YEAR
  return Math.round(paidCents * Math.pow(1 + item.annualRateBps / 10_000, years))
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
