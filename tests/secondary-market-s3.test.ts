// ⭐⭐⭐ THE SECONDARY MARKET, STEP S3 – THE BUYER'S LETTER (docs/plans/secondary-market-builder-2026-09.md S3; spec
// docs/specs/secondary-market-2026-09.md §2b, §2c, §2e; the owner's rulings §5.2 / §5.3). What this file pins: a LISTED lot draws a
// buyer once a week and writes an open `'sale'` letter with the price PRINTED on it; letters ACCUMULATE; signing settles through the
// ONE body `sellAsset` also ends in (`settleAssetSale`) at the paper's own number; the lot's other letters lapse; withdrawing the ad
// makes the buyers walk; and none of it can move the world's dice.
//
// ⚠⚠ HOW THE ARMS THAT NEED A PARTICULAR WEEK GET ONE: the world is deterministic, so a walk is a SEARCH, not a gamble – the helper
// `findWalk` scans seeds until one produces the situation (two letters standing open at once, a letter followed by later ones …) and
// FAILS LOUDLY if none does within the budget. The hand-built weekly walk mimics the tick's own order (`expireOffers` at the top,
// `revalueAssets`, then the raiser) so a lot is priced on the card's number exactly as in play; ONE arm per law goes through the REAL
// `tickWeek` to prove the wiring, and the input-independence arm is two real careers.
//
// ⚠ THE SETTLE'S SENTENCE IS NEVER TYPED HERE: it is compared with what `sellAsset` writes for the same row (the twin-world arm), which is
// the claim – ONE body, two doors, no new string. The strings table gains no row (`secondary-market-strings-roundtrip.test.ts` counts).
//
// MUTATION-VERIFIED (30.09, S3), each arm applied ALONE to the source, watched, and restored byte-identical (sha-256 of the four touched
// sources and `git status` compared before and after the batch); what went red:
//   * the listedWeek filter dropped from `raiseSaleOffers`                      -> THREE: the unlisted-never-writes arm, the real-tick arm, input-independence
//   * a one-open-letter guard re-added to the raiser                             -> ONE: the accumulation arm (no seed reaches two open letters)
//   * the sibling expiry dropped from `settleAssetSale`                          -> THREE: the accumulation arm's sibling, and both academy arms
//   * the price recomputed at accept (`saleOfferPriceCents` for `t.priceCents`)  -> FIVE: the paper arm, the accumulation, academy and both sentence arms
//   * the expiry dropped from `unlistAsset`                                      -> ONE: the unlist arm
//   * `lotWorthCents` back to `assetWorthCents` (resale.ts)                      -> THREE, BY THE GAP: the brand's fire price reads 16,669,667 where the
//     card says 16,690,499 (the card 24,968,784 against the recomputation's 24,937,620 – 0.125 %), the car's offer prices under the recomputation's
//     own ceiling, and the worthless-card arm
//   * the accept-time re-validation dropped (`saleLotSettles` -> false)          -> THREE: not owned, taken off the market, in delivery
//   * the academy lot cut to its named row in the settle                         -> ONE: the academy signing
//   * the pure sign's sale arm removed (the kit arithmetic runs)                 -> ONE: the kit-untouched arm
//   * the carry asked at the tick week instead of the listing week               -> ONE: the memory arm
//   * the id guard dropped from the raiser                                       -> ONE: the idempotence arm
//   * the window one week short (deadline arrival + 1)                           -> THREE: the real-tick arm, the window arm, the paper arm
//   * the settle handed the row's own value instead of the printed price         -> FOUR: the tail arm, the accumulation, academy and paper arms
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  acceptOffer,
  advanceRefusal,
  closeTournament,
  createWorld,
  declineOffer,
  listAsset,
  sellAsset,
  skipTournament,
  tickWeek,
  unlistAsset,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { expireOffers, expireSaleOffers, isOfferLive, raiseSaleLetter, saleOfferId, SALE_LETTER_WEEKS } from '../src/engine/offers'
import { resumeMain } from '../src/engine/rng'
import { assetWorthCents, shopItem } from '../src/engine/world/assets'
import { buyerWritesThisWeek, crashDepth, freshnessCarryOf, saleFloorCents, saleOfferPriceCents } from '../src/engine/world/resale'
import { raiseSaleOffers, revalueAssets, saleLotSettles, settleAssetSale } from '../src/engine/world/shop'
import { formatCents } from '../src/shared/money'
import type { Offer, OwnedAsset, SaleOfferTerms } from '../src/shared/protocol'
import { codeOf } from './helpers/source'

const CAR = 'car-sensible'
const HOUSE = 'house-first'
const BRAND = 'merch-brand'
const LAND = 'academy-land'
const COURTS = 'academy-courts'

const assetsOf = (world: WorldState): OwnedAsset[] => world.assets ?? []
const rowOf = (world: WorldState, id: string): OwnedAsset | undefined => assetsOf(world).find((a) => a.id === id)
const salesOf = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'sale')
const openSales = (world: WorldState): Offer[] => salesOf(world).filter((o) => o.state === 'open')
const termsOf = (o: Offer): SaleOfferTerms => o.terms as SaleOfferTerms
const lastEvent = (world: WorldState) => world.events[world.events.length - 1]

function ownedRow(id: string): OwnedAsset {
  const item = shopItem(id)!
  return { id, boughtWeek: 0, paidCents: item.entryCents, valueCents: item.entryCents, entries: [{ week: 0, cents: item.entryCents }] }
}

/** A hand-built world at `week` that owns exactly these rungs, every one DELIVERED, each REVALUED at that week – so the card's number
 *  (`valueCents`) is the analytic worth to start with, and the tests move it deliberately when they need it to differ. */
function worldOwning(seed: string, ids: readonly string[], week = 100): WorldState {
  const world = createWorld(seed)
  world.week = week
  world.assets = ids.map(ownedRow)
  revalueAssets(world)
  return world
}

function listAll(world: WorldState, ids: readonly string[]): void {
  for (const id of ids) {
    if (!(rowOf(world, id)?.listedWeek !== undefined)) listAsset(world, id)
  }
}

/** Walk `weeks` weeks in the TICK'S order: the deadline sweep at the top, the revalue, then the raiser. `each` is what the family does
 *  that week, AFTER the week's letters have landed. */
function walk(world: WorldState, weeks: number, each?: (w: WorldState) => void): void {
  for (let i = 0; i < weeks; i++) {
    world.week += 1
    expireOffers(world.offers, world.week)
    revalueAssets(world)
    raiseSaleOffers(world)
    each?.(world)
  }
}

/** Scan seeds until the walk reaches a situation, or FAIL LOUDLY – a search whose budget ran out must not pass quietly. */
function findWalk(
  label: string,
  ids: readonly string[],
  weeks: number,
  reached: (w: WorldState) => boolean,
): { world: WorldState; seed: string } {
  for (let i = 0; i < 300; i++) {
    const seed = `s3-${label}-${i}`
    const world = worldOwning(seed, ids)
    listAll(world, ids)
    for (let k = 0; k < weeks; k++) {
      walk(world, 1)
      if (reached(world)) return { world, seed }
    }
  }
  throw new Error(`no seed within the budget reached «${label}»`)
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

/** A real career through the MAIN stream the worker uses, owning one car from week 0. `list` puts the car on the market after the third
 *  tick; `refuse` declines every letter the week it lands. `brand` also holds the brand (never listed) so the card-versus-recomputation gap
 *  can be measured on real ticks. */
function career(seed: string, weeks: number, opts: { list?: boolean; refuse?: boolean; brand?: boolean } = {}): { world: WorldState; brandGaps: number[] } {
  const world = createWorld(seed)
  world.fundsCents = 5_000_000_00
  world.assets = opts.brand ? [ownedRow(CAR), ownedRow(BRAND)] : [ownedRow(CAR)]
  const rng = resumeMain(world.rngMain)
  const brandGaps: number[] = []
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (opts.brand) {
      const held = rowOf(world, BRAND)!
      const analytic = assetWorthCents(world, held, shopItem(BRAND)!)
      brandGaps.push(analytic > 0 ? Math.abs(held.valueCents - analytic) / analytic : 0)
    }
    if (opts.list && i === 2) listAsset(world, CAR)
    if (opts.refuse) for (const o of openSales(world)) declineOffer(world, o.id)
  }
  return { world, brandGaps }
}

describe('S3 · a ticked LISTED lot raises letters, an unlisted one never does', () => {
  it('through the REAL tick: a listed car draws buyers, the paper says what it must, and the same seeds unlisted write nothing', () => {
    let letters = 0
    let maxGap = 0
    for (const seed of ['s3-tick-a', 's3-tick-b']) {
      const listed = career(seed, 45, { list: true, brand: true })
      const unlisted = career(seed, 45, { brand: true })
      expect(salesOf(unlisted.world), `${seed}: an unlisted career never has a buyer`).toHaveLength(0)
      for (const o of salesOf(listed.world)) {
        letters += 1
        expect(o.kind).toBe('sale')
        expect(o.id, 'the id is the lot and the arrival week').toBe(saleOfferId(CAR, o.week))
        expect(o.deadlineWeek, 'ruling §5.2: arrival week + 2').toBe(o.week + SALE_LETTER_WEEKS)
        expect(SALE_LETTER_WEEKS).toBe(2)
        expect(termsOf(o).itemId).toBe(CAR)
        expect(termsOf(o).priceCents, 'a printed price is a positive whole number of cents').toBeGreaterThan(0)
        expect(Number.isInteger(termsOf(o).priceCents)).toBe(true)
        expect(o.week, 'no letter before the ad went up').toBeGreaterThan(3)
      }
      maxGap = Math.max(maxGap, ...listed.brandGaps, ...unlisted.brandGaps)
    }
    expect(letters, 'the listed careers drew at least one buyer between them').toBeGreaterThan(0)
    // the brand's card against the analytic recomputation, measured on real ticks (S1 measured «one ramp step, under 1 %»)
    if (process.env.S3_REPORT) console.info(`S3_BRAND_GAP real-tick max relative gap card vs assetWorthCents = ${maxGap}`)
    expect(maxGap, 'card versus recomputation on real ticks stays a ramp step, never a different market').toBeLessThan(0.05)
  })

  it('a lot draws ONLY while it is listed: the same walk, listed and not, and a withdrawn ad writes no more', () => {
    const walked = (list: boolean): WorldState => {
      const world = worldOwning('s3-listed-vs-not', [CAR, HOUSE])
      if (list) listAll(world, [CAR, HOUSE])
      walk(world, 60)
      return world
    }
    expect(salesOf(walked(false)), 'nothing listed, nothing written').toHaveLength(0)
    const listed = walked(true)
    expect(salesOf(listed).length, 'the same seed listed does write').toBeGreaterThan(0)
    // withdraw everything: from that week on no letter is raised
    const withdrawn = walked(true)
    unlistAsset(withdrawn, CAR)
    unlistAsset(withdrawn, HOUSE)
    const before = salesOf(withdrawn).length
    walk(withdrawn, 40)
    expect(salesOf(withdrawn).length, 'an ad that is down draws no buyer').toBe(before)
  })

  it('the raiser is idempotent on the week: running it twice in one week writes one letter, not two', () => {
    const { world } = findWalk('idem', [CAR], 40, (w) => openSales(w).length >= 1)
    const count = salesOf(world).length
    expect(raiseSaleOffers(world), 'a replayed week raises nothing new').toHaveLength(0)
    expect(salesOf(world)).toHaveLength(count)
  })
})

describe('S3 · letters ACCUMULATE, and one signature settles the sale and lapses the siblings (ruling §5.2)', () => {
  it('two letters stand open on ONE lot at once; signing one settles at ITS price, and the other lapses with the same week', () => {
    const { world } = findWalk('accumulate', [CAR], 40, (w) => openSales(w).length >= 2)
    const [first, second] = openSales(world)
    expect(first.id).not.toBe(second.id)
    expect(termsOf(first).itemId, 'one lot').toBe(termsOf(second).itemId)
    expect(first.week, 'two different weeks: a lot writes once a week').not.toBe(second.week)
    const funds = world.fundsCents
    const signed = acceptOffer(world, first.id)
    expect(signed.state).toBe('signed')
    expect(world.fundsCents - funds, 'the wallet moved by the LETTER\'s price').toBe(termsOf(first).priceCents)
    expect(rowOf(world, CAR), 'the row is gone').toBeUndefined()
    expect(second.state, 'the sibling lapsed – the thing is sold').toBe('expired')
    expect(second.decidedWeek, 'on the week of the signature').toBe(world.week)
    expect(openSales(world), 'nothing is left open').toHaveLength(0)
    expect(refusal(() => acceptOffer(world, second.id)), 'and the lapsed paper cannot be signed').toBe('That offer has already gone.')
  })

  it('signing a buyer never touches the kit ladder: a running signed kit deal is left exactly as it was', () => {
    const { world } = findWalk('kit-untouched', [CAR], 40, (w) => openSales(w).length >= 1)
    const kit = {
      id: 'kit-running',
      kind: 'kit',
      week: 90,
      deadlineWeek: 92,
      state: 'signed',
      decidedWeek: 91,
      fromWeek: 91,
      untilWeek: 400,
      coveredCents: 0,
      terms: { tier: 'local', brand: 'Fictional Kit Co' },
    } as unknown as Offer
    world.offers.push(kit)
    const snapshot = JSON.stringify(kit)
    const count = world.offers.length
    acceptOffer(world, openSales(world)[0].id)
    expect(JSON.stringify(kit), 'the sponsor deal is byte-identical').toBe(snapshot)
    expect(world.offers, 'and no goodbye letter was written').toHaveLength(count)
  })
})

describe('S3 · the price is ON THE PAPER and never recomputed at signature', () => {
  it('accept at arrival week + 2 settles at the letter\'s priceCents even though the market moved', () => {
    const { world } = findWalk('paper', [CAR], 40, (w) => openSales(w).length >= 1)
    const letter = openSales(world)[0]
    const printed = termsOf(letter).priceCents
    // two more weeks, and a hand-moved card on top so «the market moved» is unmistakable
    walk(world, letter.week + SALE_LETTER_WEEKS - world.week)
    expect(world.week).toBe(letter.week + SALE_LETTER_WEEKS)
    expect(isOfferLive(letter, world.week), 'the last day of its window').toBe(true)
    rowOf(world, CAR)!.valueCents = Math.round(rowOf(world, CAR)!.valueCents * 1.25)
    expect(saleOfferPriceCents(world, CAR, world.week, 0), 'a price asked of the market NOW is a different number').not.toBe(printed)
    const funds = world.fundsCents
    acceptOffer(world, letter.id)
    expect(world.fundsCents - funds, 'settled at the paper\'s number').toBe(printed)
    expect(lastEvent(world).amountCents, 'and the ledger row says the same').toBe(printed)
  })

  it('a letter is live for exactly its window: open on arrival + 2, lapsed by the sweep of arrival + 3', () => {
    const { world } = findWalk('window', [CAR], 40, (w) => openSales(w).length >= 1)
    const letter = openSales(world)[0]
    walk(world, letter.week + SALE_LETTER_WEEKS - world.week)
    expect(letter.state, 'still open on the third week').toBe('open')
    walk(world, 1)
    expect(world.week).toBe(letter.week + SALE_LETTER_WEEKS + 1)
    expect(letter.state, 'gone on the fourth').toBe('expired')
    expect(letter.decidedWeek).toBe(world.week)
  })
})

describe('S3 · signing re-validates against the world and settles NOTHING when the lot is gone', () => {
  const setup = (): { world: WorldState; letter: Offer } => {
    const world = worldOwning('s3-revalidate', [CAR])
    listAsset(world, CAR)
    const letter = raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents: 5_000_00 })
    return { world, letter }
  }
  const untouched = (world: WorldState, letter: Offer, funds: number, events: number): void => {
    expect(world.fundsCents, 'no money moved').toBe(funds)
    expect(world.events, 'no ledger row').toHaveLength(events)
    expect(letter.state, 'the paper is not marked signed').toBe('open')
  }

  it('a letter for a row that is no longer owned refuses with the shipped sentence', () => {
    const { world, letter } = setup()
    world.assets = []
    const funds = world.fundsCents
    const events = world.events.length
    expect(refusal(() => acceptOffer(world, letter.id))).toBe('That offer has already gone.')
    untouched(world, letter, funds, events)
  })

  it('a letter for a row taken off the market meanwhile refuses, and the row stays', () => {
    const { world, letter } = setup()
    delete rowOf(world, CAR)!.listedWeek
    const funds = world.fundsCents
    const events = world.events.length
    expect(refusal(() => acceptOffer(world, letter.id))).toBe('That offer has already gone.')
    untouched(world, letter, funds, events)
    expect(rowOf(world, CAR), 'the row was not sold').toBeDefined()
  })

  it('a letter for a contract still in delivery refuses', () => {
    const { world, letter } = setup()
    rowOf(world, CAR)!.readyWeek = world.week + 10
    const funds = world.fundsCents
    const events = world.events.length
    expect(refusal(() => acceptOffer(world, letter.id))).toBe('That offer has already gone.')
    untouched(world, letter, funds, events)
    expect(saleLotSettles(world, CAR), 'the predicate the door asks').toBe(false)
  })

  it('an ended career refuses with the guard\'s own sentence, and the college freeze does not', () => {
    const { world, letter } = setup()
    world.ending = { type: 'college' } as unknown as WorldState['ending']
    expect(refusal(() => acceptOffer(world, letter.id)), 'the freeze lets a family answer a buyer').toBe('NO REFUSAL')
    expect(rowOf(world, CAR), 'and the sale went through').toBeUndefined()
    const ended = setup()
    ended.world.ending = { type: 'breakup' } as unknown as WorldState['ending']
    const soldMsg = refusal(() => sellAsset(ended.world, CAR))
    expect(soldMsg).not.toBe('NO REFUSAL')
    expect(refusal(() => acceptOffer(ended.world, ended.letter.id)), 'the same latch sentence as the shop\'s own commands').toBe(soldMsg)
    expect(rowOf(ended.world, CAR), 'nothing moved').toBeDefined()
  })
})

describe('S3 · the academy is ONE lot: one signing, every delivered stage, ONE ledger row', () => {
  it('signing empties every stage, writes one row for the lot\'s total, and lapses the sibling letter', () => {
    const { world } = findWalk('academy', [LAND, COURTS], 150, (w) => openSales(w).length >= 1)
    const first = openSales(world)[0]
    // a sibling dated the week BEFORE: the slowest class writes so rarely that a naturally drawn pair is not worth a search, and the
    // accumulation itself is pinned on the car above – this arm is about the LOT (`first` is the first letter ever, so that id is free)
    const second = raiseSaleLetter(world.offers, first.week - 1, { itemId: LAND, priceCents: termsOf(first).priceCents })
    expect(second.state).toBe('open')
    expect(termsOf(first).itemId, 'the lot is named by its first delivered stage, once').toBe(LAND)
    const paid = assetsOf(world).reduce((sum, a) => sum + a.paidCents, 0)
    const funds = world.fundsCents
    const soldRows = (): number => world.events.filter((e) => e.text.startsWith('Sold')).length
    const before = soldRows()
    acceptOffer(world, first.id)
    expect(assetsOf(world), 'every stage left').toHaveLength(0)
    expect(assetsOf(world).some((a) => a.listedWeek !== undefined), 'and nothing is left listed').toBe(false)
    expect(world.fundsCents - funds, 'the lot\'s price, once').toBe(termsOf(first).priceCents)
    expect(soldRows() - before, 'ONE ledger row for the lot').toBe(1)
    expect(lastEvent(world).amountCents).toBe(termsOf(first).priceCents)
    const delta = termsOf(first).priceCents - paid
    const tail = delta < 0 ? `${formatCents(-delta)} less than it cost` : delta > 0 ? `${formatCents(delta)} more than it cost` : 'exactly what it cost'
    expect(lastEvent(world).text, 'the tail is over the stages\' summed cost').toBe(`Sold: ${shopItem(LAND)!.label} – ${tail}`)
    expect(second.state).toBe('expired')
  })

  it('a stage settled ON ITS OWN changes the lot, so the lot\'s open letters lapse – and the instant door now sells the lot whole (S4)', () => {
    // ⚠ RE-AIMED AT THE SECONDARY MARKET'S S4 (ruling §5.1, «да»), NEVER LOOSENED (ruling §5.1 + spec §2e): `sellAsset` no longer sells one academy stage on its own – the instant door sells the LOT at its fire
    // price – so the settle body's own sibling-lapse law is pinned where it still lives (`settleAssetSale` handed ONE row explicitly) and the instant door's new behaviour beside it.
    const world = worldOwning('s3-academy-stage', [LAND, COURTS])
    listAll(world, [LAND, COURTS])
    const letter = raiseSaleLetter(world.offers, world.week, { itemId: LAND, priceCents: 9_000_000_00 })
    settleAssetSale(world, COURTS, 1_000_000_00, [rowOf(world, COURTS)!])
    expect(letter.state, 'a printed price for the whole lot cannot outlive a change to it').toBe('expired')
    expect(rowOf(world, LAND), 'and the other stage is still there').toBeDefined()
    const whole = worldOwning('s3-academy-stage-instant', [LAND, COURTS])
    listAll(whole, [LAND, COURTS])
    const lotLetter = raiseSaleLetter(whole.offers, whole.week, { itemId: LAND, priceCents: 9_000_000_00 })
    sellAsset(whole, COURTS)
    expect(lotLetter.state, 'and the instant door, which sells the whole lot, lapses it too').toBe('expired')
    expect(assetsOf(whole), 'the courts took the land with them – one lot').toHaveLength(0)
  })
})

describe('S3 · unlisting makes the buyers walk (ruling §5.3), and only for THAT lot', () => {
  it('every open letter of the lot lapses on withdrawal; another lot\'s letter stands', () => {
    const world = worldOwning('s3-unlist', [CAR, HOUSE])
    listAll(world, [CAR, HOUSE])
    const a = raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents: 4_000_00 })
    world.week += 1
    const b = raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents: 4_100_00 })
    const other = raiseSaleLetter(world.offers, world.week, { itemId: HOUSE, priceCents: 90_000_00 })
    unlistAsset(world, CAR)
    expect(a.state).toBe('expired')
    expect(b.state).toBe('expired')
    expect(a.decidedWeek, 'on the week the ad came down').toBe(world.week)
    expect(other.state, 'the house is still on the market with its letter').toBe('open')
    expect(rowOf(world, HOUSE)!.listedWeek).toBeDefined()
    expect(rowOf(world, CAR)!.listedWeek, 'and the car is off').toBeUndefined()
  })
})

describe('S3 · refusing and lapsing both leave the listing live, and later weeks raise again', () => {
  it('a refused letter and a lapsed one cost the listing nothing, and a later buyer still writes', () => {
    const { world } = findWalk('refuse-lapse', [CAR], 90, (w) => {
      // decline the FIRST letter the week it lands (stateless: it is the earliest letter and it is still open), leave every later one
      // unanswered, and stop once one written AFTER the refusal has lapsed
      const first = salesOf(w)[0]
      if (first && first.state === 'open') declineOffer(w, first.id)
      return !!first && first.state === 'refused' && salesOf(w).some((o) => o.week > first.week && o.state === 'expired')
    })
    const refused = salesOf(world)[0]
    expect(refused.state).toBe('refused')
    expect(rowOf(world, CAR)!.listedWeek, 'the listing continues untouched').toBeDefined()
    expect(rowOf(world, CAR)!.lastListing, 'and nothing wrote a memory').toBeUndefined()
    expect(salesOf(world).some((o) => o.week > refused.week), 'a later week raised again').toBe(true)
  })
})

describe('S3 · the market\'s memory rides the ad, not the tick: the carry is asked at the week the ad WENT UP (S2\'s warning)', () => {
  it('every week\'s letter decision equals the hazard at the LISTING-week carry, on a re-listed house whose memory the tick week would have forgotten', () => {
    const memory = ECONOMY.shop.secondary.memoryWeeks
    let mismatches = 0
    let armed = 0
    for (let i = 0; i < 30; i++) {
      const world = worldOwning(`s3-carry-${i}`, [HOUSE])
      const row = rowOf(world, HOUSE)!
      // an earlier ad that ran 80 weeks and came down four weeks before this one went up: inside the window at the LISTING week (the
      // market remembers it) and OUT of it from the tick week `memory` + 1 on, where a carry asked at the tick would read 0 and the
      // staleness would snap back to fresh while the ad is still up
      row.lastListing = { endedWeek: world.week - 4, exposedWeeks: 80 }
      listAsset(world, HOUSE)
      const listedWeek = row.listedWeek!
      const carry = freshnessCarryOf(row, listedWeek)
      expect(carry, 'the memory holds at the listing week').toBe(80)
      for (let k = 0; k < memory + 20; k++) {
        walk(world, 1)
        const week = world.week
        const wrote = world.offers.some((o) => o.id === saleOfferId(HOUSE, week))
        if (wrote !== buyerWritesThisWeek(world, HOUSE, week, week - listedWeek, carry)) mismatches++
        if (week - row.lastListing!.endedWeek > memory) armed++
      }
    }
    expect(armed, 'the arm really walked weeks past the memory window').toBeGreaterThan(100)
    expect(mismatches, 'in every one of them the raiser read the carry at the week the ad went up').toBe(0)
  })
})

describe('S3 · ▶▶ IS NOT BLOCKED: an unanswered buyer joins no refusal', () => {
  it('a twin world with and without an open sale letter agrees, week by week, on what stops time – and on its dice', () => {
    const build = (withLetter: boolean): { world: WorldState; rng: ReturnType<typeof resumeMain> } => {
      const world = createWorld('s3-ff')
      world.assets = [ownedRow(CAR)]
      if (withLetter) {
        listAsset(world, CAR)
        raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents: 3_000_00 })
      }
      return { world, rng: resumeMain(world.rngMain) }
    }
    const a = build(true)
    const b = build(false)
    expect(openSales(a.world), 'the letter really stands').toHaveLength(1)
    for (let i = 0; i < 8; i++) {
      expect(advanceRefusal(a.world), `week ${i}: the letter changes nothing about what blocks the tick`).toBe(advanceRefusal(b.world))
      tickWeek(a.world, a.rng)
      tickWeek(b.world, b.rng)
      for (const w of [a.world, b.world]) {
        if (w.pendingTournament) {
          skipTournament(w)
          closeTournament(w)
        }
      }
      expect(a.world.week, 'both worlds moved').toBe(b.world.week)
    }
    expect(a.world.rngMain, 'and the letter did not touch the dice').toEqual(b.world.rngMain)
  })
})

describe('S3 · invariant 2: the world\'s dice never learn what the family did about a buyer', () => {
  it('⭐⭐ INPUT-INDEPENDENCE: a career that lists and refuses everything and one that never lists tap IDENTICAL MAIN sequences', () => {
    const idle = career('s3-independence', 150)
    const busy = career('s3-independence', 150, { list: true, refuse: true })
    expect(busy.world.rngMain, 'listing and refusing did not move the world\'s dice').toEqual(idle.world.rngMain)
    expect(idle.world.rngMain.n, 'the arms really ticked – a zero-draw run would pass vacuously').toBeGreaterThan(1000)
    expect(salesOf(idle.world)).toHaveLength(0)
    const written = salesOf(busy.world)
    expect(written.length, 'the busy career really met buyers').toBeGreaterThan(0)
    expect(written.every((o) => o.state === 'refused'), 'and refused every one').toBe(true)
  })

  it('zero draws in the sign, refuse and unlist paths: MAIN is byte-identical across each, and no path takes an rng', () => {
    const { world } = findWalk('zero-draws', [CAR, HOUSE], 60, (w) => openSales(w).length >= 2)
    const main = structuredClone(world.rngMain)
    const [one, two] = openSales(world)
    declineOffer(world, one.id)
    expect(world.rngMain, 'refuse').toEqual(main)
    acceptOffer(world, two.id)
    expect(world.rngMain, 'sign + settle').toEqual(main)
    const rest = world.assets?.find((a) => a.listedWeek !== undefined)
    if (rest) unlistAsset(world, rest.id)
    expect(world.rngMain, 'unlist').toEqual(main)
    // arity: none of the paths declares an Rng, so none could draw on MAIN even by accident
    for (const fn of [acceptOffer, declineOffer, unlistAsset, listAsset, settleAssetSale, raiseSaleOffers, raiseSaleLetter, saleLotSettles]) {
      expect(String(fn), `${fn.name} takes no rng`).not.toMatch(/\brng\b/i)
    }
    expect(acceptOffer.length).toBe(2)
    expect(declineOffer.length).toBe(2)
    expect(raiseSaleOffers.length).toBe(1)
  })

  it('the raiser draws ONLY the lot\'s own sale sub-streams, and the paper\'s modules draw nothing themselves (key-shape pin)', () => {
    const read = (path: string): string => codeOf(readFileSync(new URL(path, import.meta.url), 'utf8'))
    const resale = read('../src/engine/world/resale.ts')
    const keys = [...resale.matchAll(/rngFromSeed\(`([^`]*)`\)/g)].map((m) => m[1]).sort()
    expect(keys, 'exactly the two documented keys – a price and a knock – and nothing else in the file').toEqual([
      '${world.seed}:sale:${lot.keyId}:${week}:knock',
      '${world.seed}:sale:${lot.keyId}:${week}:price',
    ])
    expect(read('../src/engine/world/shop.ts'), 'world/shop.ts keeps no stream of its own – the raiser draws through resale.ts only').not.toMatch(
      /\brngFromSeed\(|\bresumeMain\(|Math\.random|new Date/,
    )
    // offers.ts DOES keep sub-streams (the sponsors' own), so the paper's two new functions are asserted on their own text
    for (const fn of [raiseSaleLetter, expireSaleOffers]) {
      expect(String(fn), `${fn.name} draws nothing`).not.toMatch(/rngFromSeed|resumeMain|Math\.random|new Date/)
    }
  })
})

describe('S3 · ONE body, two doors: the settle\'s sentence is sellAsset\'s, byte for byte', () => {
  it('a letter priced at the FIRE price writes the very row the instant sale writes (S4: the instant door pays the corridor\'s floor)', () => {
    // ⚠ RE-AIMED AT THE SECONDARY MARKET'S S4 (ruling §5.1, «да»), NEVER LOOSENED (ruling §5.1): the instant door no longer pays the row's own value, so the letter that must write the SAME row is the one printed at
    // the instant door's own price – the fire price, asked before the row leaves. Same body, same sentence, same wallet, same rows: this arm's claim, unchanged.
    const a = worldOwning('s3-sentence', [CAR])
    const b = worldOwning('s3-sentence', [CAR])
    const value = saleFloorCents(a, CAR, a.week)
    sellAsset(a, CAR)
    listAsset(b, CAR)
    const letter = raiseSaleLetter(b.offers, b.week, { itemId: CAR, priceCents: value })
    acceptOffer(b, letter.id)
    const strip = (e: WorldState['events'][number]) => ({ week: e.week, type: e.type, category: e.category, text: e.text, amountCents: e.amountCents })
    expect(strip(lastEvent(b))).toEqual(strip(lastEvent(a)))
    expect(b.fundsCents).toBe(a.fundsCents)
    expect(assetsOf(b)).toEqual(assetsOf(a))
  })

  it('the three-way tail is the difference between the paper\'s price and what the row cost – above, below, and exactly', () => {
    const label = shopItem(CAR)!.label
    const paid = ownedRow(CAR).paidCents
    for (const [price, tail] of [
      [paid + 1_234_00, `${formatCents(1_234_00)} more than it cost`],
      [paid - 1_234_00, `${formatCents(1_234_00)} less than it cost`],
      [paid, 'exactly what it cost'],
    ] as const) {
      const world = worldOwning('s3-tail', [CAR])
      listAsset(world, CAR)
      const letter = raiseSaleLetter(world.offers, world.week, { itemId: CAR, priceCents: price })
      acceptOffer(world, letter.id)
      expect(lastEvent(world).text).toBe(`Sold: ${label} – ${tail}`)
      expect(lastEvent(world).amountCents).toBe(price)
    }
  })
})

describe('S3 · WORTH READS THE CARD: an offer is priced on the row\'s stored valueCents (the parity law)', () => {
  it('the fire price – the corridor\'s own floor – is the CARD\'s number times the class share, for a brand off the recomputation', () => {
    const world = worldOwning('s3-parity', [BRAND])
    const row = rowOf(world, BRAND)!
    const card = row.valueCents
    const analytic = assetWorthCents(world, row, shopItem(BRAND)!)
    // S1 measured the brand a ramp step (under a percent) off between the two, and the arm stands on that measurement: the natural gap
    // is real and small, which is exactly why a paper priced off the recomputation would print a number the card beside it did not
    expect(card, 'the revalued card and a fresh recomputation are different numbers for a brand').not.toBe(analytic)
    expect(Math.abs(card - analytic) / analytic, 'and only a ramp step apart').toBeLessThan(0.01)
    const knobs = ECONOMY.shop.secondary.byFamily.business
    const share = knobs.fireX * (1 + knobs.crashShift * crashDepth(world.seed, world.week))
    const report: string[] = []
    // the card as revalued, then a percent further off, then three times over: the fire price must follow the CARD to the cent every time
    for (const factor of [1, 1.01, 3]) {
      row.valueCents = Math.round(card * factor)
      const onCard = Math.round(row.valueCents * share)
      const onRecomputation = Math.round(analytic * share)
      const fire = saleFloorCents(world, BRAND, world.week)
      report.push(`x${factor}: card ${row.valueCents} vs analytic ${analytic}, fire ${fire} vs ${onRecomputation} (gap ${fire - onRecomputation} cents, ${(((fire - onRecomputation) / onRecomputation) * 100).toFixed(3)} %)`)
      expect(fire, `the fire price follows the card, not the recomputation – ${report.join(' | ')}`).toBe(onCard)
    }
    if (process.env.S3_REPORT) console.info(`S3_PARITY ${report.join(' | ')}`)
  })

  it('and an OFFER moves with the card: a car whose card is three times the recomputation prices above anything the recomputation could', () => {
    // a CAR here, deliberately: a brand's recomputation steps FROM the row's own stored value (`rampedWorthCents(owned.valueCents, …)`, the
    // ramp's accumulator), so the two worths are never independent for a brand and this arm could not tell them apart
    const world = worldOwning('s3-parity-offer', [CAR])
    const row = rowOf(world, CAR)!
    const analytic = assetWorthCents(world, row, shopItem(CAR)!)
    const ceilingOnRecomputation = Math.round(analytic * ECONOMY.shop.secondary.capX)
    row.valueCents = analytic * 3
    const price = saleOfferPriceCents(world, CAR, world.week, 0)
    expect(price, `priced on the card: ${price} against a recomputation's own ceiling of ${ceilingOnRecomputation}`).toBeGreaterThan(ceilingOnRecomputation)
    expect(price).toBeLessThanOrEqual(Math.round(row.valueCents * ECONOMY.shop.secondary.capX))
  })

  it('a stray NaN or a worthless card prices nothing – whatever crosses the wire is an amount or nothing', () => {
    const world = worldOwning('s3-parity-nan', [CAR])
    for (const bad of [Number.NaN, 0, -5]) {
      rowOf(world, CAR)!.valueCents = bad
      expect(saleOfferPriceCents(world, CAR, world.week, 0), String(bad)).toBe(0)
    }
  })
})
