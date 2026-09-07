// ⭐⭐ YOU CANNOT BUY YOUR OWN NAME BACK AT THE STICKER PRICE – round 38 #14.
//
// THE OWNER, 07.09: «да, чини по max(каталог, стоимость)».
//
// ⚠⚠ THE DEFECT, MEASURED ON HIS OWN WEEK-1115 SAVE THROUGH THE SHIPPED COMMANDS BEFORE THE FIX:
//   merch-brand: paid $250,000, worth $2,576,989 – sold for $2,576,989, re-bought for $250,000,
//   NET +$2,326,989, and worth $5,172,791 again. Repeatable, in one week, without limit.
//
// ⚠ AND WHAT THIS FILE DOES **NOT** CLAIM. A SECOND loop survives and is a different defect: a rung
// whose worth is `paid x drift^yearsHeld` can be sold at its aged value and re-bought at a catalogue
// price that never inflates. Measured on the same save: house-first +$58,036 (PRE-EXISTING, nothing
// to do with this round), academy-land +$357,466 and academy-courts +$164,167 (round 38 #8's drift
// extending the same class). Closing it needs either a catalogue that ages – which changes the price
// on the card for every appreciating rung – or a refusal to re-buy, which forbids a legitimate sale.
// It is the owner's call and it is filed, not fixed. This file pins what IS fixed, so the two cannot
// be confused later.
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import { purchasePriceCents, shopItem } from '../src/engine/world/shop'
import type { WorldState } from '../src/engine/world'

/** The smallest world the price arithmetic reads: a week, a wallet, and no career at all. */
function bareWorld(week = 400): WorldState {
  return {
    week,
    seed: 'price-test',
    fundsCents: 100_000_000_00,
    assets: [],
    seasonHistory: [],
    trophiesByTier: {},
    offers: [],
  } as unknown as WorldState
}

describe('round 38 #14 – what a rung costs to buy', () => {
  it('an ordinary rung costs exactly what the card says', () => {
    for (const id of ['car-good', 'house-first', 'boat-launch']) {
      const item = shopItem(id)!
      expect(purchasePriceCents(bareWorld(), item), id).toBe(item.entryCents)
    }
  })

  it('⭐ a brand on a career the world has never heard of ALSO costs what the card says', () => {
    // The case the fix must not break: an unknown's brand is worth its floor, far under the sticker.
    const item = shopItem('merch-brand')!
    expect(purchasePriceCents(bareWorld(), item)).toBe(item.entryCents)
  })

  it('⚠⚠ a brand on a FAMOUS career costs what the name is worth, not the sticker', () => {
    const w = bareWorld(15 * 52)
    // Ten seasons ended inside the top 20 – a career the world can name.
    w.seasonHistory = Array.from({ length: 10 }, (_, i) => ({
      seasonIndex: i,
      byTrack: { wta: { endRank: 12, points: 0, wins: 40, losses: 10 } },
    })) as never
    const item = shopItem('merch-brand')!
    const price = purchasePriceCents(w, item)
    expect(price).toBeGreaterThan(item.entryCents)
  })

  it('an open rung is still whatever the family puts in', () => {
    const item = shopItem('index-fund')!
    expect(purchasePriceCents(bareWorld(), item, 7_000_00)).toBe(7_000_00)
    // ...and it is never quietly raised to the catalogue minimum here – `buyAsset` refuses that, with
    // its own sentence, and a silent bump would spend money the player did not agree to.
    expect(purchasePriceCents(bareWorld(), item, 1_00)).toBe(1_00)
  })

  it('⚠ MUTATION ARM – dropping the max reopens the loop', () => {
    const w = bareWorld(15 * 52)
    w.seasonHistory = Array.from({ length: 10 }, (_, i) => ({
      seasonIndex: i,
      byTrack: { wta: { endRank: 12, points: 0, wins: 40, losses: 10 } },
    })) as never
    const item = shopItem('merch-brand')!
    // The arm is only meaningful if the brand really is worth MORE than the sticker on this fixture,
    // and by enough that a sale-and-rebuy would have paid. MEASURED on this ten-top-20-season career:
    // $288,890 against a $250,000 sticker, i.e. the loop was worth $38,890 a cycle here and
    // $2,326,989 on his own. The fixture is deliberately modest – a career the ladder barely notices
    // still trips it, which is what makes the defect a defect rather than an endgame curiosity.
    expect(purchasePriceCents(w, item)).toBeGreaterThan(item.entryCents * 1.1)
  })

  it('the floor share is what makes an unknown brand cheap, and it is still under the sticker', () => {
    const item = shopItem('merch-brand')!
    expect(item.entryCents * ECONOMY.shop.businessValueFloorShare).toBeLessThan(item.entryCents)
  })
})
