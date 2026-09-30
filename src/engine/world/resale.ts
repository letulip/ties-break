// ⭐⭐⭐ THE SECONDARY MARKET'S PURE READS – the corridor a buyer's letter is drawn from, the weekly chance
// that a buyer writes at all, and the ONE quote the popup will print. docs/specs/secondary-market-2026-09.md
// §2c–§2i; step S1 of docs/plans/secondary-market-builder-2026-09.md. NO BEHAVIOUR CHANGES WITH THIS FILE:
// nothing calls it yet.
//
// ⚠⚠ THE `assets.ts` PATTERN, AND IT IS THE WHOLE POINT OF THIS FILE: IT ANSWERS QUESTIONS AND NEVER WRITES
// THE WORLD. No listing exists yet (S2 adds `listedWeek`), no letter is raised (S3) and nothing settles
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
import type { WorldState } from '../world'
import { assetDelivered, assetWorthCents, deliveredAssets, ownedAssets, shopCatalogue, shopItem } from './assets'
import type { ShopItem } from './assets'
import { marketCrash, marketCrashLog } from './market'

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
  /** the envelope of a fresh letter's price: base ∓ spread through the same crash and hangover terms. */
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
 *  and a screen reads `weeksHi >= QUOTE_HORIZON_WEEKS` as «may not sell at all» rather than printing a number. */
export const QUOTE_HORIZON_WEEKS = 520

/** ⚠ `market.ts`'s private `CRASH_EPOCH_WEEKS`, restated because the hangover must ask the PREVIOUS epoch's arc
 *  too: an arc never crosses its own epoch, but the half-season after it can. A restated number is a number
 *  that can rot, so `tests/resale-quote.test.ts` pins the epoch grid from the outside («the epoch grid»). */
const MARKET_EPOCH_WEEKS = 208

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
 *  simply add, which is rare and harmless. Pure over (seed, week): the arc is READ, never drawn. */
function hangoverTerm(seed: string, row: SecondaryRow, week: number): number {
  const knobs = ECONOMY.shop.secondary
  const epoch = Math.floor(week / MARKET_EPOCH_WEEKS)
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
 *  nothing about a lot – which is what lets it be remembered per row. The bracket [0, 1] always holds the root (at
 *  a peak of 1 the first week's chance is 1) and the UPPER end is returned, so the cumulative at `medianWeeks` is
 *  at least one half and never a hair under. */
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
    for (let age = 0; age < weeks; age++) survive *= 1 - Math.min(1, mid * freshShare(row, span, age))
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

/** The lot's worth at `week` – `assetWorthCents` per member, summed, read against the week asked for. */
function lotWorthCents(world: WorldState, lot: Lot, week: number): number {
  const offset = week - world.week
  let sum = 0
  for (const member of lot.members) sum += assetWorthCents(world, member.owned, member.item, offset)
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

/** ⭐ THE WEEK THE AD'S FRESHNESS REACHES ITS FLOOR – the first whole week of exposure at which the weekly
 *  chance sits at `freshFloor × peak`, and null for a rung that never lists (§2i's stale flip and its one
 *  info letter key on it; the quote knows it in advance). Deterministic, and price-dependent through the thin
 *  dampener (`freshnessSpanWeeks`). With a market memory of `c` weeks (§2i) the listing goes stale `c` weeks
 *  sooner: the caller subtracts, this stays a property of the lot. */
export function staleAtWeeks(item: ShopItem, worthCents: number): number | null {
  const row = secondaryOf(item)
  if (!row) return null
  return Math.ceil(freshnessSpanWeeks(row, thinFactor(item.family, worthCents)))
}

/** ⭐ WHAT THE FAMILY WOULD GET FOR THE LOT BY SELLING AT ONCE AT `week`, and the floor no letter may read
 *  below (the fire price IS the corridor's own floor). 0 for a lot that does not exist. */
export function saleFloorCents(world: WorldState, itemId: string, week: number): number {
  const lot = lotOf(world, itemId)
  if (!lot || !Number.isFinite(week)) return 0
  const worth = lotWorthCents(world, lot, week)
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
  const worth = lotWorthCents(world, lot, week)
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
  const worth = lotWorthCents(world, lot, week)
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
 *  taken from the weekly chances themselves (`1 − Π(1 − p)`), ages 0, 1, 2 …, with TODAY's crash state and
 *  today's worth held fixed – the quote does not peek at a crisis that has not begun, so it cannot leak one.
 *  ⚠ THE CORRIDOR IS THE PRICE FORMULA'S ENVELOPE at zero weeks listed: `u = ∓1`, the crash and hangover terms at
 *  today's depth, clamped to the same floor and cap as a real letter. */
export function assetSaleQuote(world: WorldState, itemId: string): AssetSaleQuote | null {
  const lot = lotOf(world, itemId)
  if (!lot) return null
  const week = world.week
  const worth = lotWorthCents(world, lot, week)
  if (!(worth > 0)) return null
  const knobs = ECONOMY.shop.secondary
  const floor = Math.round(worth * floorFraction(world.seed, lot.row, week))
  const cap = Math.round(worth * knobs.capX)
  const envelope = (u: number): number =>
    Math.min(cap, Math.max(floor, Math.round(worth * corridorFactor(world.seed, lot.row, week, u, 0))))

  const market = marketOf(world.seed, lot, worth, week)
  let survive = 1
  let weeksLo = 0
  let weeksHi = 0
  for (let k = 1; k <= QUOTE_HORIZON_WEEKS && weeksHi === 0; k++) {
    survive *= 1 - chanceAt(lot.row, market, k - 1)
    const sold = 1 - survive
    if (weeksLo === 0 && sold >= 0.1) weeksLo = k
    if (sold >= 0.9) weeksHi = k
  }
  return {
    weeksLo: weeksLo || QUOTE_HORIZON_WEEKS,
    weeksHi: weeksHi || QUOTE_HORIZON_WEEKS,
    corridorLoCents: envelope(-1),
    corridorHiCents: envelope(1),
    fireCents: floor,
    staleWeeks: Math.ceil(market.spanWeeks),
    thinMarket: market.thin <= knobs.thinQuoteAt,
  }
}
