// ⭐⭐⭐ THE SECONDARY MARKET, STEP S4 – THE FIRE SALE (docs/plans/secondary-market-builder-2026-09.md S4; spec docs/specs/secondary-market-2026-09.md §2e,
// §2f, §2h; the owner's ruling §5.1, «да»: the fire sale «replaces the instant full-value sale for things; parked cash keeps today's path»). What this
// file pins: `sellAsset` on a THING settles at the corridor's floor (`saleFloorCents`, at THIS week, the class's crash response included) through the one
// settle body a buyer's letter also ends in; the academy fire-sells as ONE LOT – every delivered stage, one ledger row; parked cash (the deposit and the
// fund) is bit for bit what it was and never even asks the corridor; a fire sale of a listed thing lets every open letter of the lot lapse; a buyer's
// letter that lands inside a span STOPS the span (a collected stop, not a refusal); and none of it draws.
//
// ⚠⚠ THE FIRE PRICE IS NEVER TYPED HERE AS A NUMBER. Every expectation is re-derived from `ECONOMY.shop.secondary` and `crashDepth`, ASSOCIATED EXACTLY as the
// engine associates it (`worth × (fireX × (1 + crashShift × depth))`), so an arm is red for a wrong PRICE and never for a floating-point reordering – and
// green only when the wallet moved by the corridor's own floor, which no arm here can reach by accident.
//
// ⚠ NO NEW SENTENCE: the fire sale writes the SHIPPED ledger line, `Sold: ${label} – ${tail}`, and its tail already names the loss (`saleTail`, world/shop.ts).
// The strings table gains no row (`secondary-market-strings-roundtrip.test.ts` counts); the arms below compare the row with that spelling and a parked-cash
// sale with the pre-S4 body. If the sentence ever lied in some case, this is the file that would say so.
//
// ⚠⚠ HOW THE FUND'S «BIT FOR BIT» IS MEASURED (owner's law: round 30 #14 and round 34 #15 are not re-opened). TWO INDEPENDENT ANCHORS, because either alone can
// rot: (1) a TWIN – `asItStood` re-types the money rungs' whole and part sale as they stood at b9ffdbb6 (S3's head, the last commit before this step) and is
// run on a structured clone of the same walked world, world AND ledger canonically serialised and compared after EVERY step; (2) PINNED FIGURES captured by
// running the very walk at b9ffdbb6, BEFORE the engine edit, with the date on them. The twin proves the branch left the arithmetic alone; the figures prove the
// twin itself did not drift.
//
// MUTATION-VERIFIED (30.09, S4), each arm applied ALONE to the source, watched, and restored byte-identical (sha-256 of the three touched sources compared before
// and after the batch: identical); what went red:
//   * the fire price handed back as the row's full value (`owned.valueCents` for the floor)          -> SEVEN: the car, the tail, the trough, the academy lot, the listed row, the
//     stale exit, and the spy's positive control (a thing that never asks the corridor leaves the spy at zero)
//   * the crash term dropped from the floor (`floorFraction` returns `row.fireX`)                     -> TWO: the trough arm (the car's floor reads 2,769,913 where the trough price is
//     2,558,359) and the academy lot's price
//   * a per-stage settle (`[owned]` handed to `settleAssetSale` on the thing branch)                  -> THREE: the academy lot, the car held beside it, the listed academy
//   * a `kind !== 'sale'` filter added to `stoppableOfferWeek` (multiWeek.ts)                         -> ONE: the span-stop arm (`[]` where `['offer']` belongs – the span ran past the buyer)
//   * every whole sale fire-priced, the fund included (`thing = item !== undefined`)                  -> TWO: the twin and the spy (the fund's sale cannot even find a lot)
//   * the corridor asked BEFORE the stake (same behaviour, but parked cash READS resale.ts)           -> ONE: the spy alone (`secondaryOf: 2` where 0 belongs) – the twin stays green, which
//     is exactly what the spy is for
//   * the settle's sibling-lapse dropped (`expireSaleOffers` removed from `settleAssetSale`)          -> TWO: both listed arms (the letters stay `open` after the fire sale)
import { describe, expect, it, vi } from 'vitest'
import {
  acceptOffer,
  advanceRefusal,
  advanceWeeks,
  buyAsset,
  closeTournament,
  createWorld,
  listAsset,
  sellAsset,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { isOfferLive, raiseSaleLetter, SALE_LETTER_WEEKS } from '../src/engine/offers'
import { resumeMain } from '../src/engine/rng'
import { shopCatalogue, shopItem } from '../src/engine/world/assets'
import { addEvent } from '../src/engine/world/ledger'
import { CRASH_EPOCH_WEEKS } from '../src/engine/world/market'
import { crashDepth, saleFloorCents } from '../src/engine/world/resale'
import { revalueAssets, settleAssetSale } from '../src/engine/world/shop'
import { formatCents } from '../src/shared/money'
import type { Offer, OwnedAsset } from '../src/shared/protocol'

/** ⚠ THE SPY THAT TURNS «PARKED CASH DOES NOT READ resale.ts» FROM A CLAIM INTO A COUNT. Every export `world/shop.ts` calls to reach the corridor is wrapped
 *  in a pass-through that counts – same behaviour, same numbers, so no other arm in this file can tell it is there – and the parked-cash arm asserts the counts
 *  are ZERO across a part sale and a whole sale of both money rungs, then proves the spy is live by selling a car through the same wiring. */
const reads = vi.hoisted(() => ({ secondaryOf: 0, saleFloorCents: 0, saleLotOf: 0 }))
vi.mock('../src/engine/world/resale', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/engine/world/resale')>()
  return {
    ...real,
    secondaryOf: (...args: Parameters<typeof real.secondaryOf>) => {
      reads.secondaryOf += 1
      return real.secondaryOf(...args)
    },
    saleFloorCents: (...args: Parameters<typeof real.saleFloorCents>) => {
      reads.saleFloorCents += 1
      return real.saleFloorCents(...args)
    },
    saleLotOf: (...args: Parameters<typeof real.saleLotOf>) => {
      reads.saleLotOf += 1
      return real.saleLotOf(...args)
    },
  }
})

const CAR = 'car-sensible'
const HOUSE = 'house-first'
const FUND = 'index-fund'
const DEPOSIT = 'deposit'
/** every academy stage the catalogue knows – the lot, whichever stage a command names */
const ACADEMY = shopCatalogue()
  .filter((rung) => rung.family === 'academy')
  .map((rung) => rung.id)

const assetsOf = (world: WorldState): OwnedAsset[] => world.assets ?? []
const rowOf = (world: WorldState, id: string): OwnedAsset | undefined => assetsOf(world).find((a) => a.id === id)
const lastEvent = (world: WorldState) => world.events[world.events.length - 1]
const salesOf = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'sale')
const openSales = (world: WorldState): Offer[] => salesOf(world).filter((o) => o.state === 'open')
const soldRows = (world: WorldState): number => world.events.filter((e) => e.text.startsWith('Sold')).length

function ownedRow(id: string): OwnedAsset {
  const item = shopItem(id)!
  return { id, boughtWeek: 0, paidCents: item.entryCents, valueCents: item.entryCents, entries: [{ week: 0, cents: item.entryCents }] }
}

/** A hand-built world at `week` that owns exactly these rungs, every one DELIVERED and REVALUED at that week – the card's number (`valueCents`) is the one
 *  the shelf shows, which is the number the fire price reads (S3's parity ruling). */
function worldOwning(seed: string, ids: readonly string[], week: number): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.assets = ids.map(ownedRow)
  revalueAssets(world)
  return world
}

/** What a command says when it refuses – or the marker that it did not. */
function refusal(fn: () => void): string {
  try {
    fn()
  } catch (e) {
    return (e as Error).message
  }
  return 'NO REFUSAL'
}

/** The shipped three-way tail (`saleTail`, world/shop.ts), spelled the way S3's tail arm spells it: what the sale fetched against what the rows cost. */
const tailOf = (deltaCents: number): string =>
  deltaCents < 0
    ? `${formatCents(-deltaCents)} less than it cost`
    : deltaCents > 0
      ? `${formatCents(deltaCents)} more than it cost`
      : 'exactly what it cost'

/** ⚠ THE CORRIDOR'S SHARE OF WORTH AT A WEEK, ASSOCIATED EXACTLY AS `floorFraction` DOES (resale.ts): `fireX × (1 + crashShift × depth)`. */
function fireShare(seed: string, k: { fireX: number; crashShift: number }, week: number): number {
  return k.fireX * (1 + k.crashShift * crashDepth(seed, week))
}

/** A week at or after `from` with NO crash arc open (`crashDepth` is exactly 0 outside an arc), so the fire share is the class's plain `fireX`. */
function calmWeek(seed: string, from: number): number {
  for (let w = from; w < from + CRASH_EPOCH_WEEKS; w++) if (crashDepth(seed, w) === 0) return w
  throw new Error(`no calm week within an epoch of ${from} for «${seed}»`)
}

/** A seed and the week of its DEEPEST crash trough, or FAIL LOUDLY: an arm that needs a crisis must not pass quietly on a calm world. */
function troughOf(): { seed: string; week: number; depth: number } {
  for (let i = 0; i < 40; i++) {
    const seed = `s4-trough-${i}`
    let depth = 0
    let week = -1
    for (let w = 60; w < CRASH_EPOCH_WEEKS * 6; w++) {
      const d = crashDepth(seed, w)
      if (d > depth) {
        depth = d
        week = w
      }
    }
    if (depth >= 0.15) return { seed, week, depth }
  }
  throw new Error('no seed within the budget has a crash trough of 0.15 or more')
}

/** Canonical serialisation: keys sorted at every depth, so two worlds compare by CONTENT and never by the order a field happened to be written in. */
function canon(value: unknown): string {
  const sorted = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sorted)
      : v !== null && typeof v === 'object'
        ? Object.fromEntries(
            Object.entries(v as Record<string, unknown>)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([key, x]) => [key, sorted(x)]),
          )
        : v
  return JSON.stringify(sorted(value))
}

describe('S4 · a THING fire-sells: the instant door pays the corridor\'s floor, never the card', () => {
  it('a car sold at once lands saleFloorCents – the class\'s share of the CARD – and moves exactly that into the wallet and ONE ledger row', () => {
    const seed = 's4-calm'
    const week = calmWeek(seed, 100)
    const world = worldOwning(seed, [CAR], week)
    const row = rowOf(world, CAR)!
    const card = row.valueCents
    const paid = row.paidCents
    const k = ECONOMY.shop.secondary.byFamily.car
    const fire = saleFloorCents(world, CAR, week)
    expect(fire, 'the engine primitive: worth × fireX in calm waters, to the cent').toBe(Math.round(card * fireShare(seed, k, week)))
    expect(fire, 'strictly under the card – otherwise this arm could not tell the fire price from full value').toBeLessThan(card)
    const funds = world.fundsCents
    const rows = soldRows(world)
    sellAsset(world, CAR)
    expect(world.fundsCents - funds, 'the wallet moved by the FIRE price').toBe(fire)
    expect(rowOf(world, CAR), 'the row is gone').toBeUndefined()
    expect(soldRows(world) - rows, 'ONE ledger row').toBe(1)
    const written = lastEvent(world)
    expect(written.amountCents, 'and the row says the same number').toBe(fire)
    expect(written.type).toBe('income')
    expect(written.category).toBe('shop')
    expect(written.text, 'the SHIPPED sentence, its tail naming the loss').toBe(`Sold: ${shopItem(CAR)!.label} – ${tailOf(fire - paid)}`)
  })

  it('the shipped three-way tail holds through the fire door: more than it cost, less than it cost, and exactly what it cost', () => {
    const seed = 's4-tail'
    const week = calmWeek(seed, 100)
    const label = shopItem(CAR)!.label
    const probe = worldOwning(seed, [CAR], week)
    const fire = saleFloorCents(probe, CAR, week)
    expect(fire, 'a car worth more than the step the tail is spelled with').toBeGreaterThan(1_234_00)
    for (const [paidCents, tail] of [
      [fire - 1_234_00, `${formatCents(1_234_00)} more than it cost`],
      [fire + 1_234_00, `${formatCents(1_234_00)} less than it cost`],
      [fire, 'exactly what it cost'],
    ] as const) {
      const world = worldOwning(seed, [CAR], week)
      rowOf(world, CAR)!.paidCents = paidCents
      sellAsset(world, CAR)
      expect(lastEvent(world).text).toBe(`Sold: ${label} – ${tail}`)
      expect(lastEvent(world).amountCents, 'the tail changes with the cost and the amount does not').toBe(fire)
    }
  })

  it('in a crash-trough week the fire price sags with the class response: a car falls, a house (the class that gains from a crash) rises – to the cent', () => {
    const { seed, week, depth } = troughOf()
    const world = worldOwning(seed, [CAR, HOUSE], week)
    const carK = ECONOMY.shop.secondary.byFamily.car
    const houseK = ECONOMY.shop.secondary.byFamily.house
    const car = rowOf(world, CAR)!.valueCents
    const house = rowOf(world, HOUSE)!.valueCents
    const calmCar = Math.round(car * carK.fireX)
    const troughCar = Math.round(car * fireShare(seed, carK, week))
    const calmHouse = Math.round(house * houseK.fireX)
    const troughHouse = Math.round(house * fireShare(seed, houseK, week))
    expect(depth, 'a real crisis, or the arm is vacuous').toBeGreaterThanOrEqual(0.15)
    expect(troughCar, `the car sags: ${troughCar} under its calm ${calmCar}`).toBeLessThan(calmCar)
    expect(troughHouse, `the house does not: ${troughHouse} over its calm ${calmHouse}`).toBeGreaterThan(calmHouse)
    expect(saleFloorCents(world, CAR, week)).toBe(troughCar)
    const funds = world.fundsCents
    sellAsset(world, CAR)
    expect(world.fundsCents - funds, 'the car fire-sells at the trough price').toBe(troughCar)
    const after = world.fundsCents
    sellAsset(world, HOUSE)
    expect(world.fundsCents - after, 'and the house at its own').toBe(troughHouse)
  })

  it('the doors\' guards are untouched: an amount on a thing is refused, a contract in delivery cannot be sold, a stranger is not owned', () => {
    const world = worldOwning('s4-guards', [CAR], 100)
    expect(refusal(() => sellAsset(world, CAR, 1_000_00))).toBe(`${shopItem(CAR)!.label} can only be sold whole`)
    expect(refusal(() => sellAsset(world, HOUSE))).toBe('The family does not own that')
    rowOf(world, CAR)!.readyWeek = world.week + 10
    expect(refusal(() => sellAsset(world, CAR))).toBe('That one cannot be sold right now')
    expect(rowOf(world, CAR), 'nothing moved on any refusal').toBeDefined()
    expect(soldRows(world)).toBe(0)
  })
})

describe('S4 · the academy fire-sells as ONE LOT (spec §2e – «вряд ли мы в реальности можем только корты продать»)', () => {
  it('sellAsset on ANY stage settles every delivered stage: one command, an empty shelf, ONE ledger row at the lot\'s fire total', () => {
    const seed = 's4-academy'
    const k = ECONOMY.shop.secondary.byFamily.academy
    expect(ACADEMY.length, 'the lot has several stages, or this arm proves nothing about the lot').toBeGreaterThan(1)
    for (const named of ACADEMY) {
      const world = worldOwning(seed, ACADEMY, 130)
      const worth = assetsOf(world).reduce((sum, a) => sum + a.valueCents, 0)
      const paid = assetsOf(world).reduce((sum, a) => sum + a.paidCents, 0)
      const lotFire = Math.round(worth * fireShare(seed, k, world.week))
      expect(saleFloorCents(world, named, world.week), `${named} names the whole lot`).toBe(lotFire)
      const funds = world.fundsCents
      const rows = soldRows(world)
      sellAsset(world, named)
      expect(assetsOf(world), `${named}: every stage left`).toHaveLength(0)
      expect(world.fundsCents - funds, `${named}: the lot's fire total, once`).toBe(lotFire)
      expect(soldRows(world) - rows, `${named}: ONE ledger row for the lot`).toBe(1)
      expect(lastEvent(world).amountCents).toBe(lotFire)
      // ⚠ RE-AIMED AT S5.0 (30.09), NEVER LOOSENED: the lot's settle row names the academy by the name the family gave it (`assetNameOf`) and by the NAMED stage's own label
      // when it never named one. This world never named its academy, so the FALLBACK is what this arm pins – the stage's label, exactly as before; the NAMED arm is
      // tests/secondary-market-s5.test.ts's.
      expect(lastEvent(world).text, 'the tail is over the stages\' summed cost').toBe(`Sold: ${shopItem(named)!.label} – ${tailOf(lotFire - paid)}`)
    }
  })

  it('the lot is the ACADEMY\'S: a car held beside it is not sold with it', () => {
    const world = worldOwning('s4-academy-beside', [CAR, ...ACADEMY], 130)
    sellAsset(world, ACADEMY[1])
    expect(assetsOf(world).map((a) => a.id), 'only the car is left').toEqual([CAR])
  })
})

describe('S4 · a LISTED thing fire-sold through the instant door (settle clears the ad and lapses the letters – asserted from THIS door too)', () => {
  it('the row is gone, every open letter of the lot lapses on the sale week, and the price is the fire price whatever the letters printed', () => {
    const world = worldOwning('s4-listed', [CAR], 100)
    listAsset(world, CAR)
    const first = raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents: 9_000_000_00 })
    world.week += 1
    const second = raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents: 9_100_000_00 })
    expect(openSales(world), 'two letters stand at once (ruling §5.2)').toHaveLength(2)
    const fire = saleFloorCents(world, CAR, world.week)
    const funds = world.fundsCents
    sellAsset(world, CAR)
    expect(world.fundsCents - funds, 'the instant door ignores the letters: the corridor\'s floor, not a printed price').toBe(fire)
    expect(rowOf(world, CAR), 'the row – and with it its listedWeek – is gone').toBeUndefined()
    expect(first.state, 'the first letter lapsed').toBe('expired')
    expect(second.state, 'the second letter lapsed').toBe('expired')
    expect(second.decidedWeek, 'on the week of the sale').toBe(world.week)
    expect(openSales(world), 'nothing is left open').toHaveLength(0)
    expect(refusal(() => acceptOffer(world, second.id)), 'and a lapsed paper cannot be signed').toBe('That offer has already gone.')
  })

  it('the listed academy: a fire sale through ANY stage empties the lot and lapses a letter written under ANOTHER stage', () => {
    const world = worldOwning('s4-listed-academy', ACADEMY, 130)
    listAsset(world, ACADEMY[0])
    const letter = raiseSaleLetter(world.offers, world.week, { itemId: ACADEMY[0], priceCents: 9_000_000_00 })
    sellAsset(world, ACADEMY[2])
    expect(assetsOf(world), 'every stage left').toHaveLength(0)
    expect(letter.state, 'the letter written under the first stage fell with the lot').toBe('expired')
    expect(openSales(world)).toHaveLength(0)
  })

  it('the exit is never locked: a listing gone stale for years fire-sells at the same corridor floor', () => {
    const world = worldOwning('s4-stale', [CAR], 100)
    listAsset(world, CAR)
    world.week += 150
    revalueAssets(world)
    const fire = saleFloorCents(world, CAR, world.week)
    expect(fire, 'the car is still worth something after three years').toBeGreaterThan(0)
    const funds = world.fundsCents
    expect(refusal(() => sellAsset(world, CAR))).toBe('NO REFUSAL')
    expect(world.fundsCents - funds).toBe(fire)
  })
})

/** The money rungs' walk: a fund and a deposit opened at week 0 and carried 30 weeks by the market's own path (the tick's per-week revalue), so `units` and
 *  `valueCents` are the ones a real career holds. Money is ample, so no purchase can be refused. */
function fundWalk(): WorldState {
  const world = createWorld('s4-fund-walk')
  world.fundsCents = 900_000_00
  buyAsset(world, FUND, 60_000_00)
  buyAsset(world, DEPOSIT, 25_000_00)
  for (let i = 0; i < 30; i++) {
    world.week += 1
    revalueAssets(world)
  }
  return world
}

/** ⚠ THE MONEY RUNGS' SALE AS IT STOOD AT b9ffdbb6 (S3's head, the last commit before S4), RE-TYPED HERE ON PURPOSE AND NOT IMPORTED: the whole sale is S3's own
 *  body called with the row's own value, the part sale is round 30 #14 / round 34 #15's arithmetic (one rounding, the remainder a subtraction, both halves of
 *  the gain kept). It is the yardstick the engine is compared with, so it must not share a line with the engine. */
function asItStood(world: WorldState, itemId: string, amountCents?: number): void {
  const owned = rowOf(world, itemId)!
  const label = shopItem(itemId)!.label
  if (amountCents === undefined || amountCents >= owned.valueCents) {
    settleAssetSale(world, itemId, owned.valueCents, [owned])
    return
  }
  const costSoldCents = Math.round((owned.paidCents * amountCents) / owned.valueCents)
  const deltaCents = amountCents - costSoldCents
  if (owned.units !== undefined) owned.units -= (owned.units * amountCents) / owned.valueCents
  owned.paidCents -= costSoldCents
  owned.valueCents -= amountCents
  owned.realisedGainCents = (owned.realisedGainCents ?? 0) + deltaCents
  owned.realisedCostCents = (owned.realisedCostCents ?? 0) + costSoldCents
  world.fundsCents += amountCents
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'shop',
    text: `Sold ${formatCents(amountCents)} of: ${label} – ${tailOf(deltaCents)}`,
    amountCents,
  })
}

/** The whole state a sale can touch, canonically serialised: wallet, every row, the whole ledger, the letters, the dice. */
// ⭐ v93 / L3-1 (10.10): the ledger rows carry `c` beside `text` now, and the yardstick above is the pre-S4 body RE-TYPED ON PURPOSE – it predates the ref and
// writes none. The ref is a second spelling of the row's sentence (tests/i18n-l3-1-ledger-writers.test.ts renders both shop sale rows against `text` for every tail),
// so this twin compares the rest of the row: wallet, rows, the sentence, the cents, the dice – everything that was true before the ref existed.
const image = (w: WorldState): string =>
  canon({ funds: w.fundsCents, assets: w.assets, events: w.events.map(({ c: _c, ...row }) => row), offers: w.offers, rng: w.rngMain })

describe('S4 · parked cash is BIT FOR BIT what it was (ruling §5.1: «parked cash keeps today\'s path»)', () => {
  it('⭐⭐ THE TWIN: part sales and whole sales of the fund and the deposit match the pre-S4 body after EVERY step – world and ledger canonically serialised', () => {
    const world = fundWalk()
    const twin = structuredClone(world)
    expect(image(world), 'the twin starts as the very same world').toBe(image(twin))
    const steps: Array<[string, (w: WorldState) => number | undefined]> = [
      [FUND, (w) => Math.floor(rowOf(w, FUND)!.valueCents / 3)],
      [DEPOSIT, (w) => Math.floor(rowOf(w, DEPOSIT)!.valueCents / 2)],
      [FUND, (w) => Math.floor(rowOf(w, FUND)!.valueCents / 4)],
      [FUND, () => undefined],
      [DEPOSIT, () => undefined],
    ]
    for (const [id, amountOf] of steps) {
      const amount = amountOf(world)
      sellAsset(world, id, amount)
      asItStood(twin, id, amount)
      expect(image(world), `${id} ${amount === undefined ? 'whole' : formatCents(amount)}`).toBe(image(twin))
    }
    expect(assetsOf(world), 'both money rungs are fully sold at the end of the walk').toHaveLength(0)
  })

  it('⭐ THE PINNED FIGURES, captured 30.09 by running this very walk at b9ffdbb6 BEFORE the engine edit: a part sale of the fund at a NON-ROUND amount, to the cent', () => {
    const world = fundWalk()
    const before = { ...rowOf(world, FUND)! }
    // ⚠ NOT A CLEAN FRACTION ON PURPOSE: a third of this holding divides its cost exactly, so `costSoldCents`' one rounding would go unexercised. $12,345.67 does not.
    const amount = 1_234_567
    const funds = world.fundsCents
    sellAsset(world, FUND, amount)
    const after = rowOf(world, FUND)!
    const observed = {
      valueBefore: before.valueCents,
      paidBefore: before.paidCents,
      unitsBefore: before.units,
      amount,
      proceeds: world.fundsCents - funds,
      valueAfter: after.valueCents,
      paidAfter: after.paidCents,
      unitsAfter: after.units,
      realisedGain: after.realisedGainCents,
      realisedCost: after.realisedCostCents,
      text: lastEvent(world).text,
      ledgerAmount: lastEvent(world).amountCents,
    }
    if (process.env.S4_REPORT) console.info(`S4_GOLDEN ${JSON.stringify(observed)}`)
    // ⚠ CAPTURED 30.09 AT b9ffdbb6, THE COMMIT BEFORE THE ENGINE EDIT (`git diff -- src` was empty when this ran). A figure here that moves is a money rung whose
    // arithmetic moved – re-derive it from the twin above before touching the number, never the other way round. `units` are the exact floats the walk produced.
    expect(observed).toEqual({
      valueBefore: 6324909,
      paidBefore: 6000000,
      unitsBefore: 15.362575540401657,
      amount: 1234567,
      proceeds: 1234567,
      valueAfter: 5090342,
      paidAfter: 4828852,
      unitsAfter: 12.36393495961432,
      realisedGain: 63419,
      realisedCost: 1171148,
      text: 'Sold $12,346 of: An index fund – $634 more than it cost',
      ledgerAmount: 1234567,
    })
    // round 34's arithmetic, re-added to the cent: what left and what stayed are the whole, in cost and in value
    expect(after.paidCents + after.realisedCostCents!, 'cost that stayed + cost that left = what was paid').toBe(before.paidCents)
    expect(after.valueCents + amount, 'value that stayed + value that left = what it was worth').toBe(before.valueCents)
    expect(after.realisedGainCents!, 'the realised half is the part that left, at what it fetched against what it cost').toBe(amount - after.realisedCostCents!)
  })

  it('and it never even READS the corridor: zero calls into resale.ts across part and whole sales of both rungs – while a car\'s fire sale does (the spy is live)', () => {
    const world = fundWalk()
    reads.secondaryOf = 0
    reads.saleFloorCents = 0
    reads.saleLotOf = 0
    sellAsset(world, FUND, Math.floor(rowOf(world, FUND)!.valueCents / 3))
    sellAsset(world, DEPOSIT, Math.floor(rowOf(world, DEPOSIT)!.valueCents / 2))
    sellAsset(world, FUND)
    sellAsset(world, DEPOSIT)
    expect({ ...reads }, 'parked cash asked the corridor nothing').toEqual({ secondaryOf: 0, saleFloorCents: 0, saleLotOf: 0 })
    sellAsset(worldOwning('s4-spy', [CAR], 100), CAR)
    expect(reads.saleFloorCents, 'the spy is wired: a THING does ask').toBeGreaterThan(0)
  })
})

describe('S4 · the span stop: a buyer\'s letter that lands inside a four-week press STOPS it (one positive arm for S3\'s finding)', () => {
  /** A career holding one delivered car, funds ample (no 'funds' stop can join the week), the dice resumed exactly as the worker would. */
  function career(seed: string, list: boolean): { world: WorldState; rng: ReturnType<typeof resumeMain> } {
    const world = createWorld(seed)
    world.fundsCents = 5_000_000_00
    world.assets = [ownedRow(CAR)]
    if (list) listAsset(world, CAR)
    return { world, rng: resumeMain(world.rngMain) }
  }
  const tick = (c: { world: WorldState; rng: ReturnType<typeof resumeMain> }): void => {
    tickWeek(c.world, c.rng)
    if (c.world.pendingTournament) {
      skipTournament(c.world)
      closeTournament(c.world)
    }
  }

  /** ⚠⚠ THE SEED IS FOUND BY A WALK THAT USES NO STOP LOGIC AT ALL – single ticks – so the search cannot be moved by the very rule the arm is about. It wants the
   *  first buyer to write on the SECOND week of the span and no earlier one, and a control twin (the same career, never listed – the dice are input-independent, so
   *  it is the same world) whose own four-week press does not stop on or before that second week for any OTHER reason. FAILS LOUDLY when none is found. */
  function seedWhereABuyerWritesOnWeekTwo(): string {
    for (let i = 0; i < 400; i++) {
      const seed = `s4-span-${i}`
      const walked = career(seed, true)
      const start = walked.world.week
      tick(walked)
      const early = salesOf(walked.world).length
      tick(walked)
      const arrived = salesOf(walked.world).filter((o) => o.week === start + 2).length
      if (early !== 0 || arrived !== 1) continue
      const control = career(seed, false)
      advanceWeeks(control.world, control.rng, 4)
      if (control.world.week > start + 2) return seed
    }
    throw new Error('no seed within the budget put a buyer\'s letter on week two of a clean four-week span')
  }

  it('⭐ the letter arrives on week 2 of 4 and the span halts THERE, with the collected reason and no refusal – and the paper is still answerable', () => {
    const seed = seedWhereABuyerWritesOnWeekTwo()
    const { world, rng } = career(seed, true)
    const start = world.week
    expect(advanceRefusal(world), 'nothing refuses the press before it starts').toBeNull()
    const stops = advanceWeeks(world, rng, 4)
    expect(stops, 'the buyer\'s letter is a COLLECTED stop – the one reason, and nothing else that week').toEqual(['offer'])
    expect(world.week, 'two of the four weeks were bought, the letter stopped the rest').toBe(start + 2)
    const letter = openSales(world).find((o) => o.week === world.week)!
    expect(letter, 'a real sale letter dated the week the span stopped on').toBeDefined()
    expect(letter.deadlineWeek, 'it lives two weeks: a press that outran it would burn the buyer silently').toBe(letter.week + SALE_LETTER_WEEKS)
    expect(isOfferLive(letter, world.week), 'and it can still be answered on the stopping week').toBe(true)
    // a stop, not a refusal: `advanceRefusal` does not name it, so the very next press moves time whatever the parent decided
    expect(advanceRefusal(world), 'the next press is not refused by the letter').toBeNull()
    advanceWeeks(world, rng, 4)
    expect(world.week, 'and time really moved on').toBeGreaterThan(start + 2)
  })

  it('the control: the same career never listed has no letter and no offer stop through the same four-week press', () => {
    const seed = seedWhereABuyerWritesOnWeekTwo()
    const { world, rng } = career(seed, false)
    const stops = advanceWeeks(world, rng, 4)
    expect(salesOf(world), 'an unlisted car draws no buyer').toHaveLength(0)
    expect(stops).not.toContain('offer')
  })
})

describe('S4 · invariant 2: a fire sale draws nothing', () => {
  it('the world\'s MAIN stream is exactly where it was after a car\'s fire sale and after an academy lot\'s, and the command takes no dice', () => {
    const world = worldOwning('s4-draws', [CAR, ...ACADEMY], 130)
    const main = structuredClone(world.rngMain)
    sellAsset(world, CAR)
    expect(world.rngMain, 'car').toEqual(main)
    sellAsset(world, ACADEMY[1])
    expect(world.rngMain, 'academy lot').toEqual(main)
    expect(String(sellAsset), 'sellAsset declares no rng, so it could not draw even by accident').not.toMatch(/\brng\b/i)
    expect(sellAsset.length, 'world, itemId, amountCents – and nothing else').toBe(3)
  })
})
