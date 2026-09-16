// ⭐⭐⭐ D7 (14.09) – THE THREE READS THAT STOPPED LYING OVER PARKED MONEY, pinned one by one.
//
// THE OWNER'S TWO REPORTS, one wave apart: help arrived while the wallet was faked empty (T12,
// the cameo gate), and – the mirror this suite pins – the game called a SOLVENT family broke.
// Measured before the fix: a family that parked everything at week 0 and took a $10,000 shock was
// declared bankrupt in 8 of 8 careers, both backgrounds, with $8,106 / $25,332 still in the
// deposit; the diary licensed money-worry lines on 11.9% of parked weeks against 0.0% unparked;
// the birthday hardship licence fired on 51.0% («She was looking fares home at two in the
// morning» over a family holding its whole fortune – round 26 #4 reopened through a new parking
// place). His word on the questions doc §14/§15: «давай попробуем».
//
// ⚠ EVERY CASE HERE IS A MUTATION-HONEST PIN: revert any one read to the raw wallet
// (`world.fundsCents`) and the matching case goes red – that was run once, by hand, before this
// sentence was written, which is the only licence for writing it.
import { describe, expect, it } from 'vitest'
import { createWorld, familyMeans, householdWalletCents, reachableFundsCents } from '../src/engine/world'
import { autoEndingViewOf, resolveEndings } from '../src/engine/world/endings'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'

/** A world with its whole war chest parked: wallet DOWN, deposit UP, net comfortably solvent.
 *  The deposit row mirrors what `buyAsset` writes for the catalogue's `'deposit'` – only the
 *  fields the reachable read and the means re-spell consult matter here. */
function parkedWorld(): WorldState {
  const world = createWorld('w6-reachable-reads', { ...DEFAULT_PROFILE })
  world.fundsCents = -5_000_00
  world.assets.push({ id: 'deposit', boughtWeek: 0, paidCents: 20_000_00, valueCents: 20_000_00, units: 20, entries: [] })
  return world
}

describe('D7 – need, debt and voice read the money she can REACH', () => {
  it('the debt spell does not latch while the deposit covers the hole', () => {
    const world = parkedWorld()
    resolveEndings(world)
    expect(world.debtSinceWeek, 'wallet −$5,000, deposit $20,000: reachable is +$15,000').toBe(null)

    // ⚠ THE CONTROL ARM IS THE SAME WORLD WITH THE PARKING GONE – the spell must still exist for a
    // family that is genuinely under water, or this fix deleted the warning phase instead of
    // aiming it. One solvent week clears it, as ever.
    world.assets.length = 0
    resolveEndings(world)
    expect(world.debtSinceWeek, 'no parking: −$5,000 is really −$5,000').toBe(world.week)
    world.fundsCents = 1_00
    resolveEndings(world)
    expect(world.debtSinceWeek, 'one week back in the black clears it – the spell law survives').toBe(null)
  })

  it('the ending judges the same fact the spell latches on', () => {
    const world = parkedWorld()
    // The view and the latch must never disagree about what «broke» means – the view's fundsCents
    // IS the reachable read, so `bankruptcyDue` (funds >= 0 → false) cannot end a solvent career.
    expect(autoEndingViewOf(world).fundsCents).toBe(reachableFundsCents(world))
    expect(autoEndingViewOf(world).fundsCents).toBe(15_000_00)
  })

  it('the means re-spell equals reachableFundsCents to the cent (the pinned equivalence)', () => {
    // `world/means.ts` may not import the assets module (its own header forbids a runtime edge
    // toward world.ts – ruling J's wall), so it re-spells the parked sum from the catalogue mark.
    // The re-spell is TRUSTED NOWHERE and pinned HERE: household minus her own purse must equal
    // the one reachable read, on a parked world where the difference is the whole point.
    const world = parkedWorld()
    expect(householdWalletCents(world) - (world.kidFundsCents ?? 0)).toBe(reachableFundsCents(world))
  })

  it('a family holding its fortune in the deposit is not «tight» to her voice', () => {
    const world = parkedWorld()
    // Wallet alone reads −$5,000 – below the tight ceiling; the household can reach $15,000.
    // Round 26 #4's own sentence must not come back through a parking place.
    expect(familyMeans(world)).not.toBe('tight')
    world.assets.length = 0
    expect(familyMeans(world), 'and with no parking the hardship band is honestly hers again').toBe('tight')
  })
})
