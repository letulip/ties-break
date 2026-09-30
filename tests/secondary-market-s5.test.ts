// THE SECONDARY MARKET, STEP S5 – THE ENGINE'S HALF OF THE SCREENS: two pre-steps, the snapshot the screens print, and the stale prompt.
// (The screens' half – the popup, the badge, the letter – is tests/component/secondary-market-s5.test.ts, mounted.)
//
// WHAT IS PINNED, AND THE ARMS THAT PIN IT
//   S5.0  the academy's FIRE SALE refuses while any stage is in delivery, with the SHIPPED sentence (a lot with a live contract has no whole);
//         and the lot's settle row names the academy by the name the family gave it (`assetNameOf`), falling back to the stage label.
//   S5.1  `shopView` hands the screens the engine's own `quote`, `listing` and `fire`: absent on parked cash, on a rung nobody owns and on a
//         contract in delivery; the academy's rows all carry the LOT's; the stale week is the market's memory subtracted from the quote's span.
//   S5.4  the stale prompt: ONE `info` letter per listing, in the first week its ad is stale, the same week the badge flips; never on a lot that
//         is sold or withdrawn; a re-listing inside the memory window goes stale exactly as sooner as it was remembered.
//
// ⚠ THE PARITY ARMS ARE THE POINT: what `shopView` says «Sell now» will pay and write is compared with the ledger row `sellAsset` really writes
// (amount, name and tail), for a car, an unnamed academy and a named one – so the confirm sentence the screen builds off `quote.fireCents`,
// `fire.label` and `fire.changeCents` cannot say something the sale does not do.
//
// ⚠ MUTATION-VERIFIED (30.09, S5) – each arm applied ALONE, watched red and restored (byte-exact, by hash):
//   * the academy fire refusal dropped from `sellAsset`                                     -> TWO: the refusal arm and the exit-is-not-locked arm
//   * the lot's settle row back to `item?.label`                                            -> TWO: the named-academy arm and the parity arm's named case
//   * the stale notice keyed on the ARRIVAL week (so it is raised every week past stale)   -> FIVE: the once arm, the re-listing, the day-one, the drift arm and the MAIN arm
//   * `>=` for `===` in the raiser                                                          -> ONE: the drift arm – on the plane, the lot an equality test steps over
//   * the market's memory dropped from `listing.staleAtWeek`                                -> THREE: the listing arm, the re-listing arm and the day-one arm
//   * `fire.changeCents` worked out from the card's value instead of the fire price         -> THREE: the car's snapshot arm, the parity arm and the academy arm
//   * the quote handed to every row the lot names (the owned-and-delivered guard dropped)   -> ONE: the academy arm
import { describe, expect, it } from 'vitest'
import { acceptOffer, createWorld, listAsset, sellAsset, unlistAsset, type WorldState } from '../src/engine/world'
import { expireOffers, raiseSaleLetter, saleStaleId, signOffer } from '../src/engine/offers'
import { shopCatalogue, shopItem } from '../src/engine/world/assets'
import { assetSaleQuote, freshnessCarryOf, listingStaleWeek, saleLotStaleWeeks } from '../src/engine/world/resale'
import { raiseSaleOffers, revalueAssets, shopView } from '../src/engine/world/shop'
import { formatCents } from '../src/shared/money'
import type { Offer, OwnedAsset, ShopRowView } from '../src/shared/protocol'

const CAR = 'car-sensible'
const HOUSE = 'house-first'
const FUND = 'index-fund'
const DEPOSIT = 'deposit'
const LAND = 'academy-land'
const COURTS = 'academy-courts'
const REFUSAL = 'That one cannot be sold right now'
/** the dearest plane: its worth – and so its stale span – falls steadily, and on the default trajectory the span drops across the very week an equality test would need */
const PLANE = shopCatalogue()
  .filter((rung) => rung.family === 'plane')
  .sort((a, b) => b.entryCents - a.entryCents)[0]!.id
/** the dearest car on the shelf: the thin market, and a price that DRIFTS as the car ages */
const ELITE = shopCatalogue()
  .filter((rung) => rung.family === 'car')
  .sort((a, b) => b.entryCents - a.entryCents)[0]!.id

const assetsOf = (world: WorldState): OwnedAsset[] => world.assets ?? []
const rowOf = (world: WorldState, id: string): OwnedAsset | undefined => assetsOf(world).find((a) => a.id === id)
const lastEvent = (world: WorldState) => world.events[world.events.length - 1]
const notices = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'sale' && o.state === 'info')
const view = (world: WorldState, id: string): ShopRowView => shopView(world).rows.find((r) => r.id === id)!

function ownedRow(id: string): OwnedAsset {
  const item = shopItem(id)!
  return { id, boughtWeek: 0, paidCents: item.entryCents, valueCents: item.entryCents, entries: [{ week: 0, cents: item.entryCents }] }
}

/** A hand-built world at `week` that owns exactly these rungs, every one DELIVERED and REVALUED at that week. */
function worldOwning(seed: string, ids: readonly string[], week = 100): WorldState {
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

/** Walk `weeks` weeks in the TICK'S order: the deadline sweep, the revalue, then the raiser. */
function walk(world: WorldState, weeks: number, each?: (w: WorldState) => void): void {
  for (let i = 0; i < weeks; i++) {
    world.week += 1
    expireOffers(world.offers, world.week)
    revalueAssets(world)
    raiseSaleOffers(world)
    each?.(world)
  }
}

/** The shipped three-way tail (`saleTail`, world/shop.ts). */
const tailOf = (deltaCents: number): string =>
  deltaCents < 0
    ? `${formatCents(-deltaCents)} less than it cost`
    : deltaCents > 0
      ? `${formatCents(deltaCents)} more than it cost`
      : 'exactly what it cost'

describe('S5.0 · the academy fire sale refuses while any stage is in delivery', () => {
  it('a delivered stage cannot fire-sell the lot while a later stage is on order – the SHIPPED sentence, and nothing moves', () => {
    const world = worldOwning('s5-academy-refusal', [LAND, COURTS], 130)
    rowOf(world, COURTS)!.readyWeek = world.week + 20
    const before = JSON.stringify({ assets: world.assets, funds: world.fundsCents, events: world.events.length })
    expect(refusal(() => sellAsset(world, LAND)), 'the delivered stage, asked while the courts are still being built').toBe(REFUSAL)
    expect(JSON.stringify({ assets: world.assets, funds: world.fundsCents, events: world.events.length }), 'no row, no money, no ledger line').toBe(before)
  })

  it('the exit is not locked: the week the last stage lands, the lot sells whole – every stage, one ledger row', () => {
    const world = worldOwning('s5-academy-lands', [LAND, COURTS], 130)
    rowOf(world, COURTS)!.readyWeek = world.week + 20
    expect(refusal(() => sellAsset(world, LAND))).toBe(REFUSAL)
    delete rowOf(world, COURTS)!.readyWeek
    const rows = world.events.filter((e) => e.text.startsWith('Sold')).length
    sellAsset(world, LAND)
    expect(assetsOf(world), 'every stage left').toHaveLength(0)
    expect(world.events.filter((e) => e.text.startsWith('Sold')).length - rows, 'ONE ledger row for the lot').toBe(1)
  })

  it('it is the ACADEMY\'S refusal: a car held beside a stage in delivery still fire-sells', () => {
    const world = worldOwning('s5-academy-beside', [CAR, LAND, COURTS], 130)
    rowOf(world, COURTS)!.readyWeek = world.week + 20
    sellAsset(world, CAR)
    expect(rowOf(world, CAR), 'the car sold').toBeUndefined()
    expect(rowOf(world, LAND), 'and the academy is untouched').toBeDefined()
  })
})

describe('S5.0 · the lot\'s settle row names the academy by the name the family gave it', () => {
  it('a fire sale through ANY stage writes the family\'s name – not that stage\'s label – and a signed buyer\'s letter does too', () => {
    for (const named of [LAND, COURTS]) {
      const world = worldOwning('s5-academy-named', [LAND, COURTS], 130)
      rowOf(world, LAND)!.name = 'Baseline Academy'
      const paid = assetsOf(world).reduce((sum, a) => sum + a.paidCents, 0)
      sellAsset(world, named)
      const written = lastEvent(world)
      expect(written.text, `${named}: the family's name`).toBe(`Sold: Baseline Academy – ${tailOf(written.amountCents! - paid)}`)
    }
    // the letter's door: the same body, the same name
    const world = worldOwning('s5-academy-named-letter', [LAND, COURTS], 130)
    rowOf(world, LAND)!.name = 'Baseline Academy'
    listAsset(world, LAND)
    const paid = assetsOf(world).reduce((sum, a) => sum + a.paidCents, 0)
    const letter = raiseSaleLetter(world.offers, world.week, { itemId: LAND, priceCents: 12_345_00 })
    acceptOffer(world, letter.id)
    expect(lastEvent(world).text).toBe(`Sold: Baseline Academy – ${tailOf(12_345_00 - paid)}`)
  })

  it('an academy the family never named falls back to the stage\'s own label – no new literal', () => {
    const world = worldOwning('s5-academy-unnamed', [LAND, COURTS], 130)
    const paid = assetsOf(world).reduce((sum, a) => sum + a.paidCents, 0)
    sellAsset(world, COURTS)
    const written = lastEvent(world)
    expect(written.text).toBe(`Sold: ${shopItem(COURTS)!.label} – ${tailOf(written.amountCents! - paid)}`)
  })
})

describe('S5.1 · the snapshot prints what the engine decided', () => {
  it('a delivered, unlisted thing carries the engine\'s own quote, its ledger name and its tail – and no listing', () => {
    const world = worldOwning('s5-snap-car', [CAR, HOUSE], 100)
    for (const id of [CAR, HOUSE]) {
      const row = view(world, id)
      const quote = assetSaleQuote(world, id)!
      expect(row.quote, `${id}: the quote, verbatim`).toEqual(quote)
      expect(row.fire, `${id}: the ledger's name and tail`).toEqual({
        label: shopItem(id)!.label,
        changeCents: quote.fireCents - rowOf(world, id)!.paidCents,
      })
      expect('listing' in row, `${id}: nothing is listed`).toBe(false)
    }
  })

  it('⭐ PARITY: what the row says «Sell now» pays and writes IS what the sale pays and writes – the car, an unnamed academy and a named one', () => {
    const cases: { label: string; ids: string[]; sellThrough: string; name?: string }[] = [
      { label: 'the car', ids: [CAR], sellThrough: CAR },
      { label: 'an unnamed academy', ids: [LAND, COURTS], sellThrough: COURTS },
      { label: 'a named academy', ids: [LAND, COURTS], sellThrough: COURTS, name: 'Baseline Academy' },
    ]
    for (const c of cases) {
      const world = worldOwning(`s5-parity-${c.label}`, c.ids, 140)
      if (c.name) rowOf(world, LAND)!.name = c.name
      const row = view(world, c.sellThrough)
      const funds = world.fundsCents
      sellAsset(world, c.sellThrough)
      const written = lastEvent(world)
      expect(world.fundsCents - funds, `${c.label}: the wallet moves by the quote's fire price`).toBe(row.quote!.fireCents)
      expect(written.amountCents, `${c.label}: and so does the ledger row`).toBe(row.quote!.fireCents)
      expect(written.text, `${c.label}: the row's own name and tail`).toBe(`Sold: ${row.fire!.label} – ${tailOf(row.fire!.changeCents)}`)
    }
  })

  it('parked cash, an unowned rung and a contract in delivery carry none of the three', () => {
    const world = worldOwning('s5-snap-absent', [DEPOSIT, FUND, HOUSE, CAR], 100)
    rowOf(world, CAR)!.readyWeek = world.week + 30
    for (const id of [DEPOSIT, FUND, CAR, ELITE]) {
      const row = view(world, id)
      expect('quote' in row || 'listing' in row || 'fire' in row, `${id}: no market facts – keys ABSENT, not undefined`).toBe(false)
    }
    expect('quote' in view(world, HOUSE), 'a delivered house is the control: it does').toBe(true)
  })

  it('the academy: every DELIVERED stage carries the ONE lot quote; a stage on order and an unowned stage carry none', () => {
    const world = worldOwning('s5-snap-academy', [LAND, COURTS], 130)
    const lot = assetSaleQuote(world, LAND)!
    const paid = assetsOf(world).reduce((sum, a) => sum + a.paidCents, 0)
    for (const id of [LAND, COURTS]) {
      expect(view(world, id).quote, `${id} carries the lot's quote`).toEqual(lot)
      expect(view(world, id).fire!.changeCents, `${id}: the tail is over the stages' summed cost`).toBe(lot.fireCents - paid)
    }
    const unowned = shopCatalogue().filter((r) => r.family === 'academy' && ![LAND, COURTS].includes(r.id))
    expect(unowned.length, 'the shelf has more academy stages than the family holds').toBeGreaterThan(0)
    for (const rung of unowned) expect('quote' in view(world, rung.id), `${rung.id}: unowned`).toBe(false)
    // one stage goes back on order: it stops carrying a quote and stops being part of the lot
    rowOf(world, COURTS)!.readyWeek = world.week + 40
    expect('quote' in view(world, COURTS), 'a stage on order').toBe(false)
    expect(view(world, LAND).quote, 'the land now quotes the lot of one').toEqual(assetSaleQuote(world, LAND))
    expect(view(world, LAND).fire!.changeCents).toBe(assetSaleQuote(world, LAND)!.fireCents - rowOf(world, LAND)!.paidCents)
  })

  it('a listed row carries its listing – the week the ad went up and the week it goes stale, the market\'s memory subtracted', () => {
    const world = worldOwning('s5-snap-listing', [CAR], 100)
    listAsset(world, CAR)
    const span = saleLotStaleWeeks(world, CAR)!
    expect(view(world, CAR).listing).toEqual({ sinceWeek: 100, staleAtWeek: listingStaleWeek(100, span, 0) })
    expect(view(world, CAR).listing!.staleAtWeek, 'with nothing remembered: up + the whole span').toBe(100 + span)
    // an earlier ad, ended two weeks ago with three weeks of exposure, is remembered
    unlistAsset(world, CAR)
    world.week = 102
    rowOf(world, CAR)!.lastListing = { endedWeek: 100, exposedWeeks: 3 }
    listAsset(world, CAR)
    expect(freshnessCarryOf(rowOf(world, CAR)!, 102)).toBe(3)
    expect(view(world, CAR).listing, 'goes stale three weeks sooner').toEqual({ sinceWeek: 102, staleAtWeek: 102 + Math.max(1, span - 3) })
  })

  it('a listed academy: every stage\'s row carries the one lot listing', () => {
    const world = worldOwning('s5-snap-academy-listing', [LAND, COURTS], 130)
    listAsset(world, COURTS)
    expect(view(world, LAND).listing).toBeDefined()
    expect(view(world, COURTS).listing).toEqual(view(world, LAND).listing)
  })

  it('⚠ two derivations, ONE number: the quote\'s `staleWeeks` is the span the stale week is built from – a car, a house, an elite car and the academy', () => {
    const world = worldOwning('s5-span', [CAR, HOUSE, ELITE, LAND, COURTS], 120)
    for (const id of [CAR, HOUSE, ELITE, LAND, COURTS]) {
      expect(assetSaleQuote(world, id)!.staleWeeks, id).toBe(saleLotStaleWeeks(world, id))
    }
  })
})

describe('S5.4 · the stale prompt', () => {
  it('a listing that goes stale raises ONE info letter, in the week the badge flips, and never a second', () => {
    const world = worldOwning('s5-stale-once', [CAR], 100)
    listAsset(world, CAR)
    const staleAt = view(world, CAR).listing!.staleAtWeek
    expect(staleAt, 'the car goes stale within a year, or this walk proves nothing').toBeLessThan(160)
    // EVERY week of the walk: the letter exists exactly when the badge says stale
    walk(world, 90, (w) => {
      const flipped = w.week >= view(w, CAR).listing!.staleAtWeek
      expect(notices(w).length > 0, `week ${w.week}: the letter and the badge agree`).toBe(flipped)
      expect(notices(w).length, `week ${w.week}: never more than one`).toBeLessThanOrEqual(1)
    })
    const [notice] = notices(world)
    expect(notice, 'the notice was written').toBeDefined()
    expect(notice).toMatchObject({
      id: saleStaleId(CAR, 100),
      kind: 'sale',
      state: 'info',
      week: staleAt,
      deadlineWeek: staleAt,
      terms: { itemId: CAR, priceCents: 0 },
    })
  })

  it('it is a NOTICE: nothing on it can be signed, and it outlives a withdrawal', () => {
    const world = worldOwning('s5-stale-notice', [CAR], 100)
    listAsset(world, CAR)
    walk(world, view(world, CAR).listing!.staleAtWeek - world.week)
    const [notice] = notices(world)
    expect(notice).toBeDefined()
    expect(signOffer(world.offers, notice!.id, world.week), 'an info letter is not answerable').toBeNull()
    unlistAsset(world, CAR)
    expect(notices(world), 'withdrawing lapses only the OPEN buyers\' letters; the notice is a record').toHaveLength(1)
  })

  it('never on a lot that is sold or withdrawn before its stale week', () => {
    for (const door of ['sold', 'withdrawn'] as const) {
      const world = worldOwning(`s5-stale-gone-${door}`, [CAR], 100)
      listAsset(world, CAR)
      const staleAt = view(world, CAR).listing!.staleAtWeek
      walk(world, staleAt - 2 - world.week)
      expect(notices(world), `${door}: nothing yet`).toHaveLength(0)
      if (door === 'sold') sellAsset(world, CAR)
      else unlistAsset(world, CAR)
      walk(world, 60)
      expect(notices(world), `${door}: and nothing after`).toHaveLength(0)
    }
  })

  it('a re-listing inside the market\'s memory goes stale in the very week the first ad would have – and writes its own notice', () => {
    const world = worldOwning('s5-stale-relist', [CAR], 100)
    listAsset(world, CAR)
    const first = view(world, CAR).listing!.staleAtWeek
    walk(world, 3)
    unlistAsset(world, CAR)
    listAsset(world, CAR)
    expect(view(world, CAR).listing, 'three weeks of exposure remembered, three weeks fewer to wait').toEqual({ sinceWeek: 103, staleAtWeek: first })
    walk(world, first - world.week)
    expect(notices(world).map((n) => n.id), 'the second ad is stale in its own right').toEqual([saleStaleId(CAR, 103)])
  })

  it('a re-listing AFTER the memory window starts fresh: the whole span again', () => {
    const world = worldOwning('s5-stale-relist-late', [CAR], 100)
    listAsset(world, CAR)
    walk(world, 3)
    unlistAsset(world, CAR)
    walk(world, 40)
    listAsset(world, CAR)
    const span = saleLotStaleWeeks(world, CAR)!
    expect(view(world, CAR).listing!.staleAtWeek).toBe(world.week + span)
  })

  it('an ad stale from its first day is told so in the first week the raiser runs', () => {
    const world = worldOwning('s5-stale-day-one', [CAR], 100)
    listAsset(world, CAR)
    unlistAsset(world, CAR)
    rowOf(world, CAR)!.lastListing = { endedWeek: 100, exposedWeeks: 500 }
    listAsset(world, CAR)
    expect(view(world, CAR).listing!.staleAtWeek, 'banked exposure past the span: stale one tick after the listing').toBe(101)
    walk(world, 1)
    expect(notices(world).map((n) => n.id)).toEqual([saleStaleId(CAR, 100)])
  })

  it('⭐ A LOT WHOSE WORTH DRIFTS still writes exactly ONE notice, in the first week its ad is stale – the dearest plane, and the elite car beside it', () => {
    // MEASURED AT S5 (30.09, a scratch scan, 200 seeds per rung, 400 weeks each): the stale span stretches with the price (the thin-market dampener) and
    // falls as the lot ages, so the stale week MOVES during a listing – and an `===` test steps over it. The two dearest cars, the two dearest houses and the
    // dearest yacht were EXACT on all 200 seeds; THE DEAREST PLANE WAS MISSED ON ALL 200: on its default trajectory the span drops from 103 to 102 in the very
    // week (203, for a listing at 100) that an equality test would have needed – the target moves 203 -> 202 as the week arrives – so no notice is ever written.
    // The letter is `>=` plus the listing-keyed id, which writes in the first stale week and once. `equalityMissed` is the arm's PREMISE: it counts the listings
    // an `===` would have got wrong, it must stay above zero for this arm to tell the two rules apart, and if a retune ever zeroes it the comment above is stale.
    let equalityMissed = 0
    let listings = 0
    for (const id of [PLANE, ELITE]) {
      for (let i = 0; i < 4; i++) {
        const world = worldOwning(`s5-drift-${id}-${i}`, [id], 100)
        listAsset(world, id)
        let first: number | null = null
        let equalityWeeks = 0
        walk(world, 400, (w) => {
          const row = rowOf(w, id)!
          const target = listingStaleWeek(row.listedWeek!, saleLotStaleWeeks(w, id)!, freshnessCarryOf(row, row.listedWeek!))
          if (w.week >= target && first === null) first = w.week
          if (w.week === target) equalityWeeks += 1
          // keep the lot listed: refuse every open buyer's letter the week it lands
          for (const o of w.offers) if (o.kind === 'sale' && o.state === 'open') o.state = 'refused'
        })
        expect(first, `${id} seed ${i}: goes stale within the walk`).not.toBeNull()
        expect(notices(world).map((n) => n.week), `${id} seed ${i}: ONE notice, in the first stale week`).toEqual([first])
        listings += 1
        if (equalityWeeks !== 1) equalityMissed += 1
      }
    }
    console.info(`s5 drift: an equality test would have got ${equalityMissed} of ${listings} drifting listings wrong`)
    expect(equalityMissed, 'PREMISE: an `===` test is wrong for at least one of these lots').toBeGreaterThan(0)
  })

  it('the prompt draws nothing: the MAIN stream is exactly where it was', () => {
    const world = worldOwning('s5-stale-main', [CAR], 100)
    listAsset(world, CAR)
    const main = structuredClone(world.rngMain)
    walk(world, view(world, CAR).listing!.staleAtWeek - world.week + 2)
    expect(notices(world), 'the notice was written').toHaveLength(1)
    expect(world.rngMain).toEqual(main)
  })
})
