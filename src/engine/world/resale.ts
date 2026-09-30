// ⭐⭐⭐ THE SECONDARY MARKET'S PURE READS – the corridor a buyer's letter is drawn from, the weekly chance
// that a buyer writes at all, and the ONE quote the popup will print. docs/specs/secondary-market-2026-09.md
// §2c–§2i; step S1 of docs/plans/secondary-market-builder-2026-09.md. NO BEHAVIOUR CHANGES WITH THIS FILE:
// nothing calls it yet.
//
// ⚠⚠ THE `assets.ts` PATTERN, AND IT IS THE WHOLE POINT OF THIS FILE: IT ANSWERS QUESTIONS AND NEVER WRITES
// THE WORLD. A listing exists since S2 (`listedWeek`, `lastListing`) but nothing here reads it off the world, no letter is raised (S3) and nothing settles
// (S3/S4). So the state a later step will keep – how long a thing has been listed, what the market remembers
// of an earlier listing – arrives here as EXPLICIT PARAMETERS (`weeksListed`, `freshnessCarry`) and is never
// a field read off the world. That is boring on purpose: every function below can be tested on a hand-built
// world with no schema move.
//
// ⚠⚠ ZERO MAIN DRAWS, AND NO FUNCTION HERE TAKES AN `Rng` – the arity rule (invariant 2; the guarantee
// `assets.ts` gives of itself). Randomness is a purpose-scoped SUB-stream, re-derived at the call site and
// persisting nothing: `${seed}:sale:${itemId}:${week}:price` for a letter's draw and `…:knock` for whether a
// buyer wrote this week. TWO streams, so a price never depends on whether a buyer happened to write, and a
// reload replays the same buyers at the same weeks with the same prices (spec §3). The state handed in is
// never used to re-roll anything. `tests/resale-quote.test.ts` reads this file's text to keep both promises.
//
// ⚠ ONE MARKET, NOT TWO. The crash that a buyer's price and appetite ride is the SAME path the index fund
// rides (`marketCrashLog`, world/market.ts) – read at a week, never drawn – so a crisis is one event in one
// world and the fund, the house and the yacht cannot disagree about whether it is happening.
import { ECONOMY } from '../economy'
import { rngFromSeed } from '../rng'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { OwnedAsset, ShopFamily } from '../../shared/protocol'
// ⚠ S5 (30.09): FROM THE MODULE THAT DECLARES IT. This read `from '../world'` (the barrel) since S1 – a NEW barrel type-import that
// `tests/principles-a03-type-import-ratchet.test.ts` flags, red at dc4b6738 already and outside every S1–S4 verify list; `WorldState` is `./state`'s.
import type { WorldState } from './state'
import { assetDelivered, deliveredAssets, ownedAssets, shopCatalogue, shopItem } from './assets'
import type { ShopItem } from './assets'
import { CRASH_EPOCH_WEEKS, marketCrash, marketCrashLog } from './market'

/** One family's row of `ECONOMY.shop.secondary.byFamily`, widened back to plain numbers. */
export interface SecondaryRow {
  medianWeeks: number
  base: number
  spread: number
  stalePerYear: number
  crashShift: number
  crashArrival: number
  fireX: number
  freshFloor: number
}

/** ⭐ §2g – THE QUOTE, ONE ENGINE PRIMITIVE: what the popup prints and what the letter raiser draws from. */
export interface AssetSaleQuote {
  /** p10 of the wait for a first acceptable letter, in weeks, at TODAY's market. */
  weeksLo: number
  /** p90 of the same wait – and `QUOTE_HORIZON_WEEKS` when the tail never gets there (a hung yacht). */
  weeksHi: number
  /** ⭐ S6 (30.09) – `weeksHi` SITS AT THE HORIZON: the p90 search ran out of weeks, so the number above is the cap and not a wait. The popup reads THIS flag
   *  and never re-tests `weeksHi` against the constant (the parity law: one engine verdict, one spelling) – it would otherwise print «It may take 12 to 520
   *  weeks» for a yacht, a range whose upper end is only where the engine stopped counting. */
  atHorizon: boolean
  /** the envelope of the FIRST letter's price: base ∓ spread, less one week of stale drift (the first tick's own age – S6b), through the same crash and hangover terms. */
  corridorLoCents: number
  corridorHiCents: number
  /** «Sell now» (spec §2f): the corridor's own floor. */
  fireCents: number
  /** the first whole week of exposure at which the ad's freshness sits at its floor (spec §2i). */
  staleWeeks: number
  /** the thin-market dampener is at or below `thinQuoteAt` – the popup's «may not sell at all» line. */
  thinMarket: boolean
}

/** ⚠ WHERE THE QUOTE'S WAIT GIVES UP: ten years. Because the freshness floor is never zero the chance of a
 *  sale never reaches it, but a hung yacht's p90 lies centuries out; the quote reports the horizon instead,
 *  and a screen reads the quote's `atHorizon` (S6) as «may not sell at all» rather than printing a number. */
export const QUOTE_HORIZON_WEEKS = 520

/** ⭐ THE ROW OF THE CORRIDOR TABLE THAT PRICES THIS RUNG, or null for a rung that never lists. ⚠ THE ABSENCE
 *  IS THE PREDICATE: `investment` has no row (parked cash never lists, spec §2a), and a family added to the
 *  union tomorrow is not sold by letter until somebody gives it one. */
export function secondaryOf(item: ShopItem): SecondaryRow | null {
  const rows: Partial<Record<ShopFamily, SecondaryRow>> = ECONOMY.shop.secondary.byFamily
  return rows[item.family] ?? null
}

/** ⭐⭐ THE CRASH, AS ONE NUMBER BOTH THE FUND AND THE BUYERS CAN READ: the share of value the world market
 *  has lost at `week` – 0 in calm waters, at most 1 − 0.70 = 0.30 at the deepest trough the crash layer can
 *  draw, and 0.15–0.30 at any crisis's own trough. It is `marketCrashLog` (the log-index the fund rides)
 *  turned into a fraction, and that is the whole adapter.
 *
 *  ⚠ THIS IS THE «0..1 DEPTH» OF THE BRIEF, AND IT IS A FRACTION OF VALUE LOST ON PURPOSE: `crashShift` then
 *  reads as a BETA. A plane at −1.0 offers one-for-one with the market (a −20% crisis, 20% off), a house at
 *  +0.2 gains a fifth of it. Normalising to «the deepest possible crisis = 1» instead would put every class
 *  but the house on its floor for the whole of every crisis – nothing like his «давай умеренно». */
export function crashDepth(seed: string, week: number): number {
  return 1 - Math.exp(marketCrashLog(seed, week))
}

/** ⭐ THE HANGOVER (his ruling §5.4, «может даже чуть ниже на какое-то время»): for `hangoverWeeks` after a
 *  crash arc CLOSES, a residual BELOW base for EVERY class, opening at `hangoverX` of the size of the response the
 *  class showed at that crisis's own trough (`|crashShift| × depth`) and decaying linearly to zero.
 *
 *  ⚠ 30.09 (S1b, the architect's ruling on S1's open question): every class sits a touch below its base after an
 *  arc – the house's premium unwinds, the postponed sellers crowd the rest; magnitude by |crashShift|. S1 built the
 *  brief's «opposite-sign» word for word, which sent a boat or a plane ABOVE base for half a season after a crash –
 *  the reverse of the spec's own gloss (§2c: the postponed yacht sellers crowd the market). The house is the same
 *  either way.
 *
 *  ⚠ TWO EPOCHS ARE ASKED because the arc's half-season can run into the next epoch. Two arcs' terms would
 *  simply add, which is rare and harmless. Pure over (seed, week): the arc is READ, never drawn.
 *
 *  ⚠ THE EPOCH LENGTH IS `market.ts`'s OWN `CRASH_EPOCH_WEEKS`, IMPORTED – ONE SPELLING (30.09, S2, the architect's
 *  ruling). This file used to restate the number, and a restated number is a number that can rot; the epoch-grid arm of
 *  `tests/resale-quote.test.ts` now asserts the grid off the same import. */
function hangoverTerm(seed: string, row: SecondaryRow, week: number): number {
  const knobs = ECONOMY.shop.secondary
  const epoch = Math.floor(week / CRASH_EPOCH_WEEKS)
  let term = 0
  for (let e = Math.max(0, epoch - 1); e <= epoch; e++) {
    const arc = marketCrash(seed, e)
    const since = week - arc.endWeek
    if (since < 0 || since >= knobs.hangoverWeeks) continue
    const trough = 1 - Math.exp(arc.depthLog)
    term += -Math.abs(row.crashShift) * trough * knobs.hangoverX * (1 - since / knobs.hangoverWeeks)
  }
  return term
}

/** ⭐ §2c THE PRICE FORMULA'S SHARE OF WORTH, ONE PLACE – the letter and the quote's envelope both call it, so
 *  they cannot describe two markets:
 *
 *      base + spread·u − stalePerYear·min(t / 52, 1) + crashShift·crashDepth + hangover
 *
 *  `u` is the draw in [−1, 1) (the envelope passes ±1), `t` the weeks listed. */
function corridorFactor(seed: string, row: SecondaryRow, week: number, u: number, weeksListed: number): number {
  const staleShare = Math.min(weeksListed / WEEKS_PER_YEAR, 1)
  return (
    row.base + row.spread * u - row.stalePerYear * staleShare + row.crashShift * crashDepth(seed, week) + hangoverTerm(seed, row, week)
  )
}

/** ⭐ THE FIRE PRICE AS A SHARE OF WORTH, AND THE CORRIDOR'S OWN FLOOR – ONE FUNCTION, so an offer can never
 *  read below what the family could get by selling at once (spec §2f). `fireX` is the calm-waters share; in a
 *  crisis it moves with the class's crash response (`× (1 + crashShift·depth)`, always positive: the deepest
 *  response is −1.0 × 0.30), which is the brief's «× crash response, same term». */
function floorFraction(seed: string, row: SecondaryRow, week: number): number {
  return row.fireX * (1 + row.crashShift * crashDepth(seed, week))
}

/** The cheapest rung of a family – «the class's entry rung» the thin-market dampener measures worth against. */
function classEntryCents(family: ShopFamily): number {
  let entry = Infinity
  for (const rung of shopCatalogue()) if (rung.family === family && rung.entryCents < entry) entry = rung.entryCents
  return entry
}

/** ⭐ §2d THE THIN-MARKET DAMPENER: `(classEntry / worth) ** thinExponent`, clamped to [thinFloor, 1]. Never
 *  above 1 – a cheap lot is not given more buyers than the class has – and never below `thinFloor`. */
function thinFactor(family: ShopFamily, worthCents: number): number {
  const knobs = ECONOMY.shop.secondary
  const entry = classEntryCents(family)
  if (!(worthCents > 0) || !Number.isFinite(entry)) return 1
  return Math.min(1, Math.max(knobs.thinFloor, Math.pow(entry / worthCents, knobs.thinExponent)))
}

// ⚠ THE AGE CONVENTION OF THIS WHOLE BLOCK (30.09, the architect's ruling after S6): age 1 at the first tick – the raiser's own clock. An ad listed in week W
// meets its first tick at W+1, one week on the market (`raiseSaleOffers` passes `week − listedWeek`), so the solve, the quote's walk and the stale span all count
// from 1. S6's probe measured the 0-based solve missing every family's median: the raiser's cumulative over `medianWeeks` ticks ran one decayed week behind it.
/** ⚠ HOW LONG A FRESH AD KEEPS ITS VIEWINGS, in weeks: `decayMedians` class medians, STRETCHED BY THE THIN
 *  DAMPENER. That stretch is what makes the stale week price-dependent (spec §2i: «class- and price-dependent»)
 *  and it is coherent: the dampener slows the market's clock – fewer buyers arrive and fewer see the ad – so a
 *  thin lot is the same market in slow motion, waiting seasons where a sensible one waits weeks. */
function freshnessSpanWeeks(row: SecondaryRow, thin: number): number {
  return (ECONOMY.shop.secondary.decayMedians * row.medianWeeks) / thin
}

/** What a market looks like at one lot, one week: the peak weekly chance, the dampener, the crash multiplier
 *  and the freshness span. Computed once so the quote's 520-week loop is just arithmetic. */
interface MarketState {
  peak: number
  thin: number
  arrival: number
  spanWeeks: number
}

/** ⚠ THE FRESHNESS SHARE OF THE PEAK AT ONE AGE OF THE AD (§2d): 1 fresh, falling LINEARLY over `spanWeeks` to
 *  `freshFloor` and then holding there, never 0. LINEAR SO THE FLOOR IS REACHED AT A WEEK (the stale badge needs
 *  one), not approached for ever. ONE FUNCTION because the hazard and the peak's solver must walk the SAME shape. */
function freshShare(row: SecondaryRow, spanWeeks: number, ageWeeks: number): number {
  return ageWeeks >= spanWeeks ? row.freshFloor : 1 - (1 - row.freshFloor) * (ageWeeks / spanWeeks)
}

/** The solve below, remembered. It reads only the row's `medianWeeks` and `freshFloor` and the shared
 *  `decayMedians`, so it is a pure function of three numbers, and keying on them stays right if a knob is ever
 *  re-tuned at runtime. */
const PEAK_MEMO = new Map<string, number>()

/** ⭐⭐ THE PEAK WEEKLY CHANCE, SOLVED SO THAT THE TABLE'S MEDIAN IS TRUE BY CONSTRUCTION (30.09, S1b – the
 *  architect's ruling). S1 set the peak to `1 − e^(−ln 2 / median)`, which is the median of a hazard that NEVER
 *  decays; this hazard decays, so the fresh window's cumulative fell short of a half and the realised median
 *  landed on the floor's tail – 2–10× the column, for every class. The fix is in the SEMANTICS and not in the
 *  column: the peak is BISECTED so that, at thin = 1 in a calm market, the chance that no buyer has written over
 *  exactly `medianWeeks` weeks is one half, under the decay-to-floor shape the hazard itself walks (`freshShare`).
 *  Deterministic, no draws.
 *
 *  ⚠ THE TABLE'S MEDIAN IS THE FAMILY'S ENTRY RUNG IN A CALM MARKET – the thin dampener then slows expensive rungs
 *  on top, which is the design (his $300k car), and S6 measures the spread.
 *
 *  ⚠ THE SPAN THE SOLVE USES IS THE `thin = 1` ONE (`decayMedians × medianWeeks`), so it depends on the row and on
 *  nothing about a lot – which is what lets it be remembered per row. The bracket [0, 1] holds the root (at a peak of
 *  1 the first tick's chance is the age-1 share, 1 − (1 − floor)/span – over a half for any span past two weeks, and
 *  every row's is far past that) and the UPPER end is returned, so the cumulative at `medianWeeks` is at least one
 *  half and never a hair under.
 *
 *  ⚠ THE SOLVE WALKS AGES 1 … `medianWeeks` (S6b, 30.09 – the convention note above): the first tick is age 1, so the peak is the level of an age no tick ever
 *  asks (a virtual age 0) and the FIRST tick already carries one step of decay. The 0-based walk (ages 0 … `medianWeeks` − 1) put the peak too low by that step. */
function peakChanceOf(row: SecondaryRow): number {
  const decay = ECONOMY.shop.secondary.decayMedians
  const key = `${row.medianWeeks}:${row.freshFloor}:${decay}`
  const known = PEAK_MEMO.get(key)
  if (known !== undefined) return known
  const weeks = Math.max(1, Math.round(row.medianWeeks))
  const span = decay * row.medianWeeks
  let lo = 0
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    let survive = 1
    for (let age = 1; age <= weeks; age++) survive *= 1 - Math.min(1, mid * freshShare(row, span, age))
    if (survive > 0.5) lo = mid
    else hi = mid
  }
  PEAK_MEMO.set(key, hi)
  return hi
}

/** ⭐ THE WEEKLY CHANCE AT ONE AGE OF THE AD (§2d): the family's solved peak (`peakChanceOf` – the class median
 *  at the entry rung) times the freshness share, times the crash multiplier while an arc is open and the thin
 *  dampener. */
function chanceAt(row: SecondaryRow, market: MarketState, ageWeeks: number): number {
  return Math.min(1, market.peak * freshShare(row, market.spanWeeks, ageWeeks) * market.arrival * market.thin)
}

/** What sells together: one owned row – or, for the academy, EVERY DELIVERED STAGE (spec §2e: «one listing
 *  covers every delivered stage; one letter prices the lot»). */
interface Lot {
  /** the rung the lot is named by: the row itself, or the academy's first delivered stage */
  item: ShopItem
  row: SecondaryRow
  /** the id the sub-streams are keyed on. ⚠ For the academy it is the FIRST delivered stage, whichever stage
   *  the caller named, so the lot has ONE draw a week and any of its ids reaches it. */
  keyId: string
  members: { owned: OwnedAsset; item: ShopItem }[]
}

/** The lot `itemId` names, or null for «not a thing sold this way»: an investment, a rung nobody owns, a
 *  contract still in delivery (S2 refuses to list it; this simply has nothing to quote), or an academy with no
 *  delivered stage. A stage still being built is NOT a member of its lot – nobody buys a construction site. */
function lotOf(world: WorldState, itemId: string): Lot | null {
  const item = shopItem(itemId)
  if (!item) return null
  const row = secondaryOf(item)
  if (!row) return null
  if (item.family === 'academy') {
    const members = deliveredAssets(world).filter((m) => m.item.family === 'academy')
    const anchor = members[0]
    return anchor ? { item: anchor.item, row, keyId: anchor.owned.id, members } : null
  }
  const owned = ownedAssets(world).find((a) => a.id === itemId)
  if (!owned || !assetDelivered(owned)) return null
  return { item, row, keyId: itemId, members: [{ owned, item }] }
}

/** ⭐ S3 – THE LOT `itemId` NAMES, FOR THE CALLERS THAT WRITE: the id its sub-streams and its letters are keyed on (`keyId`, for the
 *  academy its first delivered stage, whichever stage was named) and the rows that sell together. ONE lot definition – the letter raiser
 *  (`raiseSaleOffers`), the settle (`settleAssetSale`) and the accept-time re-validation (`saleLotSettles`) all ask THIS, so a lot cannot
 *  mean one thing to the paper and another to the till. Null for what is not sold this way: an investment, a rung nobody owns, a contract
 *  still in delivery, an academy with no delivered stage. A read: it writes nothing and draws nothing. */
export function saleLotOf(world: WorldState, itemId: string): { keyId: string; rows: OwnedAsset[] } | null {
  const lot = lotOf(world, itemId)
  return lot ? { keyId: lot.keyId, rows: lot.members.map((m) => m.owned) } : null
}

/** ⭐⭐ THE LOT'S WORTH IS THE NUMBER ON THE CARD (30.09, S3 – the architect's parity ruling): the members' stored `valueCents`, summed –
 *  the revalued row `revalueAssets` writes every tick and every surface already shows (the shelf, the holdings card, the Money breakdown).
 *  It used to be `assetWorthCents` recomputed here at an offset from the world's week, and the two differ – the brand by one ramp step,
 *  under 1 % – so a paper priced off the recomputation could print a number the card beside it did not: the parity class
 *  (docs/specs/engine-ui-parity-2026-09.md), one engine value in two spellings.
 *
 *  ⚠ THE WORTH IS A FACT OF THE ROW NOW, NOT OF THE WEEK ASKED: every production caller asks at the world's own week (the tick's raiser, the
 *  popup's quote, the fire price), so nothing needs a non-now hypothetical, and the quote holds the market fixed anyway. The `week` the
 *  functions below still take picks the market's WEATHER (crash, hangover) and the sub-stream key. ⚠ WHICH MAKES THE CALLER RESPONSIBLE
 *  FOR A CURRENT ROW: the tick's raiser runs AFTER `revalueAssets` on purpose (world/phaseObligations.ts). */
function lotWorthCents(lot: Lot): number {
  let sum = 0
  for (const member of lot.members) sum += member.owned.valueCents
  return sum
}

function marketOf(seed: string, lot: Lot, worthCents: number, week: number): MarketState {
  const thin = thinFactor(lot.item.family, worthCents)
  return {
    peak: peakChanceOf(lot.row),
    thin,
    // ⚠ «WHILE AN ARC IS OPEN» IS THE CRASH LAYER BEING OFF ZERO: it is exactly zero outside an arc and exactly
    // non-zero inside one, so this needs no calendar of its own.
    arrival: marketCrashLog(seed, week) !== 0 ? lot.row.crashArrival : 1,
    spanWeeks: freshnessSpanWeeks(lot.row, thin),
  }
}

/** A week count that survives a stray NaN or a negative: the wire is not trusted (the plan's proof discipline). */
function weeksOrZero(x: number): number {
  return Number.isFinite(x) && x > 0 ? x : 0
}

/** ⭐ §2i – THE MARKET'S MEMORY OF AN EARLIER AD, AS THE CARRY `buyerWritesThisWeek` TAKES: the weeks of exposure the row
 *  banked when its last ad ended, IF that ad ended within `ECONOMY.shop.secondary.memoryWeeks` of `week` – and 0 once the
 *  window has passed, or when the row never had an ad (the new ad starts fresh). INCLUSIVE: an ad withdrawn exactly
 *  `memoryWeeks` ago is still remembered; one week later it is not.
 *
 *  ⚠ THE ONE PLACE THE WINDOW IS READ – two copies of `<= memoryWeeks` would be two windows. ⚠ AND ASK IT AT THE WEEK THE
 *  AD WENT UP (`listedWeek`), NOT AT THE TICK: the window measures how long the family waited BEFORE re-listing, so a carry
 *  asked at tick time would slide out of the window while the ad is still up and the staleness would snap back to fresh.
 *  `unlistAsset` asks it that way (world/shop.ts). Pure over (row, week): the row is a PARAMETER, never read off a world,
 *  and nothing is drawn. */
export function freshnessCarryOf(owned: OwnedAsset, week: number): number {
  const last = owned.lastListing
  return last && week - last.endedWeek <= ECONOMY.shop.secondary.memoryWeeks ? last.exposedWeeks : 0
}

/** ⭐ THE WEEK THE AD'S FRESHNESS REACHES ITS FLOOR – the first whole week of exposure at which the weekly
 *  chance sits at `freshFloor × peak`, and null for a rung that never lists (§2i's stale flip and its one
 *  info letter key on it; the quote knows it in advance). Deterministic, and price-dependent through the thin
 *  dampener (`freshnessSpanWeeks`). With a market memory of `c` weeks (§2i) the listing goes stale `c` weeks
 *  sooner: the caller subtracts, this stays a property of the lot.
 *
 *  ⚠ COUNTED ON THE SAME CLOCK AS THE WALK (S6b, 30.09): the tick of week k asks age k, so the first tick at the floor is week `ceil(span)` – and the quote's own
 *  wait loop now reaches the floor at that same week (asking k − 1 it reached it one week later). No code moved here: `listingStaleWeek` and `saleLotStaleWeeks` read
 *  this through the shared span helper too. */
export function staleAtWeeks(item: ShopItem, worthCents: number): number | null {
  const row = secondaryOf(item)
  if (!row) return null
  return Math.ceil(freshnessSpanWeeks(row, thinFactor(item.family, worthCents)))
}

/** ⭐ S5 – THE STALE SPAN OF THE LOT `itemId` NAMES, in weeks: `staleAtWeeks` asked of the lot's own worth (the members' stored `valueCents`,
 *  summed – for the academy, every delivered stage). Null when the lot does not exist (an investment, a rung nobody owns, a contract in
 *  delivery). ⚠ IT IS THE SAME NUMBER AS THE QUOTE'S `staleWeeks` and is asked separately on purpose: the raiser runs it once per listed lot
 *  per WEEK, and the quote's 520-step wait loop is not needed to answer it. `tests/secondary-market-s5.test.ts` pins the two equal. */
export function saleLotStaleWeeks(world: WorldState, itemId: string): number | null {
  const lot = lotOf(world, itemId)
  return lot ? staleAtWeeks(lot.item, lotWorthCents(lot)) : null
}

/** ⭐ S5 – THE ABSOLUTE WEEK A LISTING GOES STALE: `listedWeek` plus the weeks of freshness the ad still has, which is the quote's
 *  `staleWeeks` (the lot's own span) LESS the `carry` the market remembered from an earlier ad (spec §2i: «with a market memory of `c`
 *  weeks the listing goes stale `c` weeks sooner: the caller subtracts»). ONE function for the two readers that must agree to the week –
 *  the shelf's badge (`shopView`'s `listing.staleAtWeek`) and the stale prompt (`raiseSaleOffers`) – so the badge cannot flip in one week
 *  and the letter arrive in another.
 *
 *  ⚠ FLOORED AT ONE WEEK, AND THAT IS THE ONLY JUDGEMENT IN IT: an ad re-listed inside the memory window with more banked exposure than the
 *  span is stale from its first day, and the raiser only runs on the ticks AFTER the listing (`weeksListed` >= 1) – so the badge is held to flip
 *  in the first tick's week too, the week the notice can first be written, instead of in a listing week nobody is ticked through.
 *
 *  ⚠⚠ IT IS EVALUATED EVERY WEEK AT THE CURRENT WORTH, NEVER ONCE AT LISTING TIME – `staleWeeks` stretches with the lot's price (the thin-market
 *  dampener, `freshnessSpanWeeks`) and a depreciating lot's span SHRINKS as it ages, which is why a reader tests `week >= this` rather than
 *  `week === this`: an equality test misses the week when the span drops across it – measured at S5 on the dearest plane, which an `===` test
 *  never caught on any of 200 seeds (world/shop.ts `raiseSaleOffers` carries the numbers; tests/secondary-market-s5.test.ts pins the premise).
 *  A pure integer function: no world, no draws. */
export function listingStaleWeek(listedWeek: number, staleWeeks: number, carryWeeks: number): number {
  return listedWeek + Math.max(1, staleWeeks - carryWeeks)
}

/** ⭐ WHAT THE FAMILY WOULD GET FOR THE LOT BY SELLING AT ONCE AT `week`, and the floor no letter may read
 *  below (the fire price IS the corridor's own floor). 0 for a lot that does not exist. */
export function saleFloorCents(world: WorldState, itemId: string, week: number): number {
  const lot = lotOf(world, itemId)
  if (!lot || !Number.isFinite(week)) return 0
  const worth = lotWorthCents(lot)
  return worth > 0 ? Math.round(worth * floorFraction(world.seed, lot.row, week)) : 0
}

/** ⭐⭐ §2c – WHAT A BUYER WHO WRITES IN `week` OFFERS FOR THE LOT, in cents, drawn on the `:price` sub-stream
 *  and printed on the paper at its arrival week. `weeksListed` is how long the ad has been up (the stale drift).
 *
 *      price = worth(week) × ( base + spread·u − stale·min(t / 52, 1) + crashShift·depth + hangover )
 *
 *  clamped to [the fire price, worth × capX]. 0 – never NaN, never negative – for a lot that does not exist, in
 *  the `sellAsset` «!(asked > 0)» spirit: whatever crosses the wire is an amount or nothing. */
export function saleOfferPriceCents(world: WorldState, itemId: string, week: number, weeksListed: number): number {
  const lot = lotOf(world, itemId)
  if (!lot || !Number.isFinite(week)) return 0
  const worth = lotWorthCents(lot)
  if (!(worth > 0)) return 0
  const u = 2 * rngFromSeed(`${world.seed}:sale:${lot.keyId}:${week}:price`)() - 1
  const raw = Math.round(worth * corridorFactor(world.seed, lot.row, week, u, weeksOrZero(weeksListed)))
  const floor = Math.round(worth * floorFraction(world.seed, lot.row, week))
  const cap = Math.round(worth * ECONOMY.shop.secondary.capX)
  return Math.min(cap, Math.max(floor, raw))
}

/** The weekly chance that a buyer writes for `lot` in `week`, given how long the ad has been up and how much
 *  exposure the market remembers from an earlier listing (§2i – `freshnessCarry` simply adds to the age). */
function hazardOfLot(world: WorldState, lot: Lot, week: number, weeksListed: number, freshnessCarry: number): number {
  if (!Number.isFinite(week)) return 0
  const worth = lotWorthCents(lot)
  if (!(worth > 0)) return 0
  const age = weeksOrZero(weeksListed) + weeksOrZero(freshnessCarry)
  return chanceAt(lot.row, marketOf(world.seed, lot, worth, week), age)
}

/** ⭐ §2d THE WEEKLY CHANCE OF A BUYER, as a probability – the number `buyerWritesThisWeek` compares its draw to
 *  and the numbers the quote's wait is built from. 0 for a lot that does not exist. */
export function buyerHazard(world: WorldState, itemId: string, week: number, weeksListed: number, freshnessCarry: number): number {
  const lot = lotOf(world, itemId)
  return lot ? hazardOfLot(world, lot, week, weeksListed, freshnessCarry) : 0
}

/** ⭐⭐ DID A BUYER WRITE IN `week`? One draw on the `:knock` sub-stream against the weekly chance above –
 *  a separate stream from the price, so the two can never lean on each other. */
export function buyerWritesThisWeek(world: WorldState, itemId: string, week: number, weeksListed: number, freshnessCarry: number): boolean {
  const lot = lotOf(world, itemId)
  if (!lot) return false
  const chance = hazardOfLot(world, lot, week, weeksListed, freshnessCarry)
  if (!(chance > 0)) return false
  return rngFromSeed(`${world.seed}:sale:${lot.keyId}:${week}:knock`)() < chance
}

/** ⭐⭐ §2g – THE QUOTE. The exposure range, the price corridor and the fire price for what the family owns
 *  under `itemId` – for the academy, THE LOT (every delivered stage, summed: any stage's id names it) – read at
 *  THIS week and null for a thing that cannot be listed (an investment, a rung nobody owns, a contract still in
 *  delivery). The popup prints it and the letter raiser draws from it; a screen never re-derives a number here.
 *
 *  ⚠ THE WAIT IS NUMERIC, NOT A DRAW: `weeksLo`/`weeksHi` are the p10 and p90 of the first week a buyer writes,
 *  taken from the weekly chances themselves (`1 − Π(1 − p)`), week k asking age k – the age the raiser hands its k-th tick (S6b, 30.09: it used to ask k − 1) – with TODAY's crash state and
 *  today's worth held fixed – the quote does not peek at a crisis that has not begun, so it cannot leak one.
 *  ⚠ THE CORRIDOR IS THE PRICE FORMULA'S ENVELOPE at ONE week listed – the first possible letter's own age: `u = ∓1`, the crash and
 *  hangover terms at today's depth, clamped to the same floor and cap as a real letter. (S6b, 30.09: it asked zero weeks while the raiser prices the first tick
 *  at `weeksListed = 1`, so a stale-heavy family's lowest draws printed `stalePerYear / 52` of worth – a boat's 0.12 % – under the low end the popup had printed.) */
export function assetSaleQuote(world: WorldState, itemId: string): AssetSaleQuote | null {
  const lot = lotOf(world, itemId)
  if (!lot) return null
  const week = world.week
  const worth = lotWorthCents(lot)
  if (!(worth > 0)) return null
  const knobs = ECONOMY.shop.secondary
  const floor = Math.round(worth * floorFraction(world.seed, lot.row, week))
  const cap = Math.round(worth * knobs.capX)
  // ⚠ ONE WEEK LISTED, NOT ZERO: the first letter is drawn at tick 1 and priced at `weeksListed = 1` (the age the hazard walk starts at) – the popup's low end must cover it.
  const envelope = (u: number): number =>
    Math.min(cap, Math.max(floor, Math.round(worth * corridorFactor(world.seed, lot.row, week, u, 1))))

  const market = marketOf(world.seed, lot, worth, week)
  let survive = 1
  let weeksLo = 0
  let weeksHi = 0
  // ⚠ AGE k AT WEEK k – the raiser's clock (the convention note above the span helper); this asked k - 1 until S6b.
  for (let k = 1; k <= QUOTE_HORIZON_WEEKS && weeksHi === 0; k++) {
    survive *= 1 - chanceAt(lot.row, market, k)
    const sold = 1 - survive
    if (weeksLo === 0 && sold >= 0.1) weeksLo = k
    if (sold >= 0.9) weeksHi = k
  }
  // ⚠ S6: THE CLAMPED WEEK AND THE FLAG ARE ONE DECISION – `atHorizon` is «the p90 is the cap», true when the search never reached 90 % (`weeksHi` still 0)
  // and, harmlessly, when it reached it exactly AT the cap. It is NOT «within a week of the cap»: a p90 of 519 weeks is a real wait and prints as one.
  const hi = weeksHi || QUOTE_HORIZON_WEEKS
  return {
    weeksLo: weeksLo || QUOTE_HORIZON_WEEKS,
    weeksHi: hi,
    atHorizon: hi >= QUOTE_HORIZON_WEEKS,
    corridorLoCents: envelope(-1),
    corridorHiCents: envelope(1),
    fireCents: floor,
    staleWeeks: Math.ceil(market.spanWeeks),
    thinMarket: market.thin <= knobs.thinQuoteAt,
  }
}
