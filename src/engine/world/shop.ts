// ⭐⭐ THE SHOP, SLICE 1 – the tab, static prices, buy / own / sell.
// docs/specs/the-shop-2026-08.md §2, §3a-c, §5 and §11 row 1. Nothing else in that file is here:
// no drift, no shock, no freeze, no commissioning, no broker, no charity, no academy.
//
// ⚠⚠ WHOSE MONEY THIS IS, because the spec had to be corrected on it once already (§1, the owner:
// «Мы же делаем инвестиции для родителя, ты помнишь?»). The shelf belongs to the PARENT. Nothing on
// it is bought for her, nothing on it touches her radar, her condition, her kit or her calendar –
// the two items that were about her are gone from the shelf entirely (§3d became a birthday gift,
// §3e was struck). This module writes `world.assets`, `world.fundsCents` and two ledger rows, and
// reads nothing about the girl at all.
//
// ⚠⚠ ZERO DRAWS, ON MAIN OR ANYWHERE, AND SLICE 1 IS WHERE THAT IS EASIEST TO GUARANTEE: this file
// imports no RNG and takes no `Rng` argument, which is the guarantee rather than a claim about it.
// «Static» here means DETERMINISTIC, not frozen – every value is arithmetic on `boughtWeek`, so a
// car still loses its 9% a season and the ledger still has a loss to show. The frozen MAIN capture
// (41550 / e6b0c709) cannot see any of this.
// ⚠ AND THE DOOR SLICE 2 WALKS THROUGH IS ALREADY CUT. §4's drift draws on
// `rngFromSeed(`${seed}:asset:${assetId}:${week}`)` and never MAIN. `revalueAssets` below is the one
// writer of `valueCents` and takes the world alone; slice 2 adds the sub-stream inside it, at one
// call site, and every other line in this file and on the screen is unchanged. That is why the value
// is a STORED field written by a tick phase rather than a getter the screen calls: a getter would
// have to be given a stream, and a stream on a read path is how a purchase moves the world's dice.
import { ECONOMY } from '../economy'
import { WEEKS_PER_YEAR } from '../season/calendar'
import { activeLadderOf } from './ladder'
import { guardNotEndedForGood } from './endings'
import { addEvent } from './ledger'
import { formatCents } from '../../shared/money'
import type { OwnedAsset, ShopRowView, ShopView } from '../../shared/protocol'
import type { WorldState } from '../world'

/** One rung of `ECONOMY.shop.catalogue`, with the constant's literal types widened back to the
 *  shapes the rest of the engine reasons in. */
export interface ShopItem {
  id: string
  family: 'investment' | 'car' | 'house'
  /** 'fixed' – one price. 'open' – the family chooses an amount, at least `entryCents` (§3a's
   *  minimums: a deposit is not a $1,000 thing you buy). */
  stake: 'fixed' | 'open'
  label: string
  blurb: string
  entryCents: number
  /** signed basis points a year. NEGATIVE IS THE POINT for §3b's family. */
  annualRateBps: number
}

/** THE SHELF, cheapest first. A plain read of the constant – there is no per-career catalogue and
 *  there must not be one (§5: adding an item later is not a migration). */
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

/** ⭐ THE GATE: the shelf opens with the professional era and never in the junior years (§2).
 *
 *  ⚠ IT IS THE MASSEUR'S GATE, DELIBERATELY THE SAME ONE (`masseurUnlocked`, world/masseur.ts:48),
 *  and re-using it rather than inventing a second boundary is the whole point: her first counting
 *  W-series result makes the professional table her table, `activeLadderOf` reads the never-pruned
 *  mark, so the door can never close again behind a layoff, a pruned window or the college freeze.
 *  A second definition of "the professional era" is a second thing to keep in step. */
export function shopUnlocked(world: WorldState): boolean {
  return activeLadderOf(world) === 'wta'
}

/** The refusal, written once – the screen prints it and both commands throw it, so a disabled
 *  control and a refused click can never tell two stories (the R10-16 doctrine). */
export const SHOP_LOCKED_DETAIL =
  'The shelf opens with her professional career – her first counting W-series result unlocks it.'

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
 *  Pure: no world, no rng, no clock. */
export function assetValueCents(item: ShopItem, paidCents: number, weeksHeld: number): number {
  const years = Math.max(0, weeksHeld) / WEEKS_PER_YEAR
  return Math.round(paidCents * Math.pow(1 + item.annualRateBps / 10_000, years))
}

/** THE ONE WRITER OF `valueCents`, run at the top of every tick (world/phaseObligations.ts).
 *
 *  ⚠ IT IS A TICK PHASE AND NOT A GETTER, and §5 is the reason: two sides asking different functions
 *  about one question is this repo's most-repeated defect. The screen reads the field, the ledger
 *  reads the field, the sale price IS the field – there is exactly one arithmetic and it happens
 *  here. An item whose rung has been retired from the catalogue keeps its last value rather than
 *  being re-priced by a rate that no longer exists.
 *
 *  ⚠ IDEMPOTENT AND ORDER-FREE: the value is a function of (paidCents, boughtWeek, week), not of the
 *  previous value, so running it twice in a week or skipping a week changes nothing. That stops
 *  being true in slice 2, when drift accumulates – which is exactly when a single named writer with
 *  a single call site starts earning its keep.
 *
 *  ZERO DRAWS. Defensive `??=` for the hand-built probe worlds in tests that predate the field, the
 *  courtesy `accrueFinance` extends to `careerTotals`. */
export function revalueAssets(world: WorldState): void {
  world.assets ??= []
  for (const owned of world.assets) {
    const item = shopItem(owned.id)
    if (!item) continue
    owned.valueCents = assetValueCents(item, owned.paidCents, world.week - owned.boughtWeek)
  }
}

/** ⭐ CAN THIS BE SOLD THIS WEEK? Always true in slice 1 – and it exists anyway, because it is the
 *  seam §4's FREEZE widens («the asset cannot be sold for an indefinite stretch») and slice 3's
 *  contract widens beside it («the money leaves on order, the thing arrives N weeks later, and the
 *  contract cannot be sold»). Both read a field this slice deliberately does not persist – see
 *  `OwnedAsset` in shared/protocol/profile.ts for why an absent optional key beats a required null.
 *  Keeping the predicate now means those slices change one function, not two commands and a screen. */
export function sellableAsset(_world: WorldState, _owned: OwnedAsset): boolean {
  return true
}

/** WHAT THE FAMILY OWNS, oldest purchase first. Defensive `?? []` for probe worlds. */
export function ownedAssets(world: WorldState): OwnedAsset[] {
  return world.assets ?? []
}

/** ⭐ BUY. `stakeCents` is ignored on a 'fixed' rung and required on an 'open' one (§3a's minimums).
 *
 *  ⚠⚠ `guardNotEndedForGood`, NOT `guardNotEnded`, AND THE SPEC RULES IT EXPLICITLY (§5): «a shop
 *  command is about the FAMILY'S OWN money, so it belongs to `guardNotEndedForGood` … and NOT to the
 *  tour-command guard that refuses inside the college freeze.» That is what makes the college years
 *  shoppable, which the backlog's §0a argues is the shop's best moment – four years where the wallet
 *  rests and the parent has no weekly job to do. A terminal latch still refuses with the unchanged
 *  sentence. ⚠ This is the FOURTH member of a list `world/constants.ts` describes as short on
 *  purpose; the note there has been re-aimed rather than widened, and the reason it may grow at all
 *  is that a purchase out of the family's own pocket is not a decision that reaches the girl.
 *
 *  ⚠ EVERY REFUSAL IS RE-VALIDATED HERE because the worker is not the gate (CLAUDE.md invariant 1):
 *  a tab left open on a junior career, or on a rung already owned, must not be able to spend.
 *
 *  ZERO DRAWS: state, arithmetic and one ledger row. */
export function buyAsset(world: WorldState, itemId: string, stakeCents?: number): void {
  guardNotEndedForGood(world)
  if (!shopUnlocked(world)) throw new Error(SHOP_LOCKED_DETAIL)
  const item = shopItem(itemId)
  if (!item) throw new Error('There is nothing like that on the shelf')
  world.assets ??= []
  if (world.assets.some((a) => a.id === itemId)) throw new Error('The family already owns that')

  // ⚠ THE AMOUNT IS DECIDED BEFORE THE WALLET IS ASKED, and a 'fixed' rung ignores whatever the
  // caller sent rather than refusing it: the price of a car is the catalogue's, and a screen that
  // passed a number would otherwise be able to name its own.
  const paidCents = item.stake === 'open' ? Math.floor(stakeCents ?? 0) : item.entryCents
  if (item.stake === 'open' && paidCents < item.entryCents) {
    throw new Error(`That one starts at ${formatCents(item.entryCents)}`)
  }
  if (world.fundsCents < paidCents) throw new Error('Not enough funds for that')

  world.fundsCents -= paidCents
  world.assets.push({ id: item.id, boughtWeek: world.week, paidCents, valueCents: paidCents })
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'shop',
    text: `Bought: ${item.label}`,
    amountCents: -paidCents,
  })
}

/** ⭐ SELL, at exactly what the stored value says – and the difference from `paidCents` is the whole
 *  feature (§3b: «THIS FAMILY EXISTS TO LOSE MONEY AND THAT IS THE POINT»).
 *
 *  ⚠ THE SENTENCE NAMES THE DIFFERENCE, TO THE CENT, and that is acceptance §2e-1 read literally: a
 *  player who has to subtract two rows himself has not been shown the loss, he has been shown two
 *  prices. The ledger keeps both rows anyway, so nothing is hidden by saying it out loud.
 *
 *  Same guard, same class, zero draws. */
export function sellAsset(world: WorldState, itemId: string): void {
  guardNotEndedForGood(world)
  world.assets ??= []
  const owned = world.assets.find((a) => a.id === itemId)
  if (!owned) throw new Error('The family does not own that')
  if (!sellableAsset(world, owned)) throw new Error('That one cannot be sold right now')

  const item = shopItem(itemId)
  const label = item?.label ?? owned.id
  const proceedsCents = owned.valueCents
  const deltaCents = proceedsCents - owned.paidCents
  world.assets = world.assets.filter((a) => a !== owned)
  world.fundsCents += proceedsCents

  const tail =
    deltaCents < 0
      ? `${formatCents(-deltaCents)} less than it cost`
      : deltaCents > 0
        ? `${formatCents(deltaCents)} more than it cost`
        : 'exactly what it cost'
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'shop',
    text: `Sold: ${label} – ${tail}`,
    amountCents: proceedsCents,
  })
}

/** ⭐⭐ THE SHELF AS THE MONEY SCREEN READS IT (§2). `kitLineViews`' own shape and its own rule: the
 *  screen never prices a rung, never applies a rate and never subtracts two figures to find a loss.
 *
 *  ⚠⚠ WHOLE NUMBERS CROSS HERE AND NOWHERE ELSE – the owner's rule of 26.08 («у нас в логике могут
 *  быть дробные числа – это окей, а у пользователя целые в интерфейсе»), the one `shownCondition`
 *  follows twenty lines into `toSnapshot`. Two figures on this view are genuinely fractional behind
 *  it and both are rounded ONCE, right here: `annualRatePct` (basis points are a hundredth of a
 *  percent) and `changePct` (a ratio of two cent figures). Every other number is cents, and
 *  `tests/condition-boundary.test.ts`'s own note is the licence for leaving those alone: «Cents are
 *  already integers and stay integers.» ⚠ No component may round either of these a second time.
 *
 *  ⚠ AND THE EMPTY SHELF NAMES A THING, NOT A GOAL (§2): «never a locked row, a progress bar or a
 *  teaser». `cheapestId` is the cheapest rung on the shelf – a real object at a real price the
 *  screen can print a sentence about – and it goes null the moment the family owns anything, because
 *  a shelf with something on it does not need to be introduced.
 *
 *  Pure: reads the world, writes nothing, draws nothing. */
export function shopView(world: WorldState): ShopView {
  const owned = ownedAssets(world)
  const rows: ShopRowView[] = shopCatalogue().map((item) => {
    const mine = owned.find((a) => a.id === item.id)
    const changeCents = mine ? mine.valueCents - mine.paidCents : null
    return {
      id: item.id,
      family: item.family,
      stake: item.stake,
      label: item.label,
      blurb: item.blurb,
      entryCents: item.entryCents,
      annualRatePct: Math.round(item.annualRateBps / 100),
      paidCents: mine ? mine.paidCents : null,
      valueCents: mine ? mine.valueCents : null,
      changeCents,
      changePct:
        mine && mine.paidCents > 0 && changeCents !== null ? Math.round((changeCents / mine.paidCents) * 100) : null,
      boughtWeek: mine ? mine.boughtWeek : null,
      // ⚠ THE PRICE IS ON SCREEN EITHER WAY. This says whether the control is pressable, never
      // whether the row is drawn: §2 rules out the locked row and the progress bar, and a shop
      // window is a thing you look into before you can afford it.
      affordable: world.fundsCents >= item.entryCents,
    }
  })
  const cheapest = rows.reduce<ShopRowView | null>((best, r) => (!best || r.entryCents < best.entryCents ? r : best), null)
  return {
    unlocked: shopUnlocked(world),
    lockedDetail: SHOP_LOCKED_DETAIL,
    rows,
    cheapestId: owned.length === 0 && cheapest ? cheapest.id : null,
    ownedCount: owned.length,
    ownedValueCents: owned.reduce((sum, a) => sum + a.valueCents, 0),
  }
}
