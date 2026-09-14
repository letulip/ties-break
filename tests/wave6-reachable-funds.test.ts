// ⭐⭐⭐ T12 – NEED MEANS THE MONEY SHE CAN REACH. The owner, 14.09, from his live playtest of the
// deployed wave-5 build – the first exploit report of the run:
//
//   «у рабочей семьи, если вложить все деньги сразу со стартом карьеры в депозит, сразу же приходят
//    спонсорские деньги. Это надо починить, чтобы поддержка приходила реально тогда, когда вообще
//    уже край и денег нет, а не только кошельком мыслить»
//
// ...and, the same hour, the scope widened by his own guess and confirmed by the code:
//
//   «предполагаю, что у среднего класса так же будет, так что на них тоже распространяется»
//
// ⚠⚠ HE IS RIGHT ABOUT `middle` BY CONSTRUCTION, which is why both of his arms are here rather than
// only the one he played. The cameo's need gate has been BACKGROUND-BLIND since the day it was built
// (docs/specs/need-not-background-2026-08.md – that was the whole point of it), so the hole was never
// the working family's: it was every family's. The two arms below are the same defect twice.
//
// THE ANATOMY, so the net is aimed at the cause. `sponsorNeedMet`'s spec built a correctness wall –
// «nobody is in need before a ball is struck», worst week-0 runway 81.5 court weeks against a bar of
// 62 – and that wall was TRUE on 10.08. It was broken by a LATER wave: rounds 29-30 gave the wallet
// two parking places (`economy.ts`'s own «WHERE MONEY EARNS NOW»), and a wallet emptied into one of
// them reads `fundsCents ≈ 0` – runway 0 – on week ZERO. Two waves, each correct alone.
//
// ⚠ THE BAR DID NOT MOVE AND NOTHING HERE ASSERTS THAT IT DID. `runwayWeeks` 62, the court
// denominator, the rung cut and the gift amounts are `tests/economy.test.ts`'s to hold and they are
// untouched. This file is about the INPUT.
//
// ⚠ MUTATION-VERIFIED, each applied ALONE to the engine, watched, reverted, md5 checked pristine
// after every arm. THE RED SET BELOW IS THE MEASURED ONE, NOT THE EXPECTED ONE – two of the four
// landed differently from the first draft of this list and are recorded as they fell:
//   * `reachableFundsCents`'s body -> `return world.fundsCents` (the whole fix reverted, one line)
//     -> 4 RED: BOTH of the owner's «parks everything» arms, «the wallet PLUS the parking», and the
//     revalue-order arm. This is the arm the fix exists to fail on.
//   * `cashParking` deleted from the `deposit` row alone -> 4 RED: the catalogue arm, «the wallet
//     PLUS the parking» and BOTH career arms (both of his families park in the deposit).
//     ⚠ NOT the revalue-order arm, which parks in the FUND – which is the point of them being two.
//   * `cashParking` deleted from the `index-fund` row alone -> 2 RED: the catalogue arm and the
//     revalue-order arm. ⚠ NEITHER career arm moves, because neither of them parks there. The second
//     parking place is therefore held by exactly two nets and by no repro – worth knowing before
//     anybody trims this file.
//   * the helper's `if (… ?.cashParking !== true) continue` inverted (only the NON-parking rows
//     summed) -> 4 RED: both career arms, «the wallet PLUS the parking» and the revalue-order arm.
//     ⚠ NOT the catalogue arm, which reads the shelf and never the helper.
//   ⭐ THE TWO «REALLY GONE» ARMS STAYED GREEN UNDER ALL FOUR, and correctly: they are the positive
//   control – a gate that has simply been switched off would fail them, and no mutation of the
//   INPUT can, because that family has nothing left to reach either way.
//
// ⚠ ONE ARM, ONE CASE – the wave's own law. Arms are never stacked into a single `it`, because the
// first failing assertion would stop the case and a mutation that breaks five things would redden
// one.
import { describe, expect, it } from 'vitest'
import {
  assetWorthCents,
  buyAsset,
  closeTournament,
  createWorld,
  ownedAssets,
  reachableFundsCents,
  sellAsset,
  shopCatalogue,
  shopItem,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { DEFAULT_PROFILE, type FamilyBackground } from '../src/shared/protocol'

/** ⚠ READ, NEVER WRITTEN. The cameo's feed line is the owner's copy (CLAUDE.md invariant 4) and this
 *  file only looks for it; it is spelled once here so a future wording change of HIS breaks one line
 *  of test instead of four. */
const CAMEO_LINE = 'A local sponsor chipped in!'

const DEPOSIT = 'deposit'
const FUND = 'index-fund'

function familyWorld(background: FamilyBackground, seed: string): WorldState {
  return createWorld(seed, { ...DEFAULT_PROFILE, background, coachTier: 'self' })
}

/** A real career on the MAIN stream the worker uses – `round30-fund-units.test.ts`'s own helper. She
 *  does not enter, because the claim is about the FAMILY'S MONEY and a tournament run is noise on it.
 *
 *  ⚠ `self` COACHED ON PURPOSE: it is the cell the spec measured the correctness wall on (worst
 *  week-0 runway 81.5 court weeks against the bar of 62), so an unparked career of either background
 *  is supposed to hear from nobody. That is what makes a cameo in the parked arm a defect rather
 *  than a coincidence. */
function walk(world: WorldState, weeks: number, at?: (w: WorldState, i: number) => void): number {
  const rng = resumeMain(world.rngMain)
  let cameos = 0
  for (let i = 0; i < weeks; i++) {
    at?.(world, i)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    cameos += world.events.filter((e) => e.week === world.week && e.text === CAMEO_LINE).length
    if (world.ending) break
  }
  return cameos
}

const SEEDS = 6
const WINDOW = 104

// -------------------------------------------------------------------------------------------------
describe('T12 – the catalogue is where cash-parking is declared', () => {
  it('⭐⭐ the two rungs that are PARKED CASH carry the flag, and nothing else on the shelf does', () => {
    const parking = shopCatalogue().filter((i) => i.cashParking === true)
    const rest = shopCatalogue().filter((i) => i.cashParking !== true)
    // The scan is real: a guard that reads an empty shelf passes everything.
    expect(shopCatalogue().length).toBeGreaterThan(8)
    expect(parking.map((i) => i.id).sort()).toEqual([DEPOSIT, FUND].sort())
    // ...and the other direction, named by FAMILY rather than by id, so a new car or a second
    // business cannot walk in unflagged: things are not parked cash, their worth curves are
    // path-dependent, and nobody sells a company to qualify for a $500 cameo.
    for (const item of rest) {
      expect(
        ['car', 'house', 'business', 'boat', 'plane', 'academy'].includes(item.family),
        `${item.id} is not flagged as cash parking, so it must be a THING`,
      ).toBe(true)
    }
    expect(rest.length).toBeGreaterThan(6)
  })

  it('⭐⭐ the helper is the wallet PLUS the parking – and a car is not parked cash', () => {
    const world = familyWorld('wealthy', 't12-helper')
    const wallet0 = world.fundsCents
    buyAsset(world, DEPOSIT, 10_000_00)
    const parked = ownedAssets(world).find((a) => a.id === DEPOSIT)!
    expect(world.fundsCents).toBe(wallet0 - 10_000_00)
    expect(reachableFundsCents(world)).toBe(world.fundsCents + parked.valueCents)

    // ...and the car, bought out of the same wallet, does NOT come back. The price is read off the
    // WALLET rather than off the catalogue, so the claim is «none of it came back» and not a second,
    // weaker claim about what a car costs.
    const car = shopCatalogue().find((i) => i.family === 'car' && i.retired !== true)!
    const beforeCar = reachableFundsCents(world)
    const walletBeforeCar = world.fundsCents
    buyAsset(world, car.id)
    const spent = walletBeforeCar - world.fundsCents
    expect(spent, 'the car really was paid for').toBeGreaterThan(0)
    expect(reachableFundsCents(world)).toBe(beforeCar - spent)
  })

  it('⭐⭐ a family that owns nothing gets its wallet back TO THE CENT – the no-deposit career is unchanged', () => {
    for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const world = familyWorld(bg, `t12-null-${bg}`)
      expect(ownedAssets(world)).toHaveLength(0)
      expect(reachableFundsCents(world)).toBe(world.fundsCents)
      walk(world, 30)
      expect(ownedAssets(world)).toHaveLength(0)
      expect(reachableFundsCents(world)).toBe(world.fundsCents)
    }
  })

  it('⚠ the worth the gate reads is THIS week\'s – `revalueAssets` runs a phase before the cameo', () => {
    // Tick order: phase 1 `world/phaseObligations.ts` revalues, phase 2 `world/phaseFinance.ts`
    // decides the cameo. So `valueCents` at the gate is not last week's number, and the helper adds
    // no arithmetic of its own. Read out of a ticked world rather than out of the source.
    const world = familyWorld('wealthy', 't12-order')
    buyAsset(world, FUND, 50_000_00)
    walk(world, 40)
    const owned = ownedAssets(world).find((a) => a.id === FUND)!
    expect(owned.valueCents).toBe(assetWorthCents(world, owned, shopItem(FUND)!))
    expect(reachableFundsCents(world)).toBe(world.fundsCents + owned.valueCents)
  })
})

// -------------------------------------------------------------------------------------------------
describe('T12 – his repro, in both of the arms he named', () => {
  it('⭐⭐⭐ HIS ARM: a WORKING family parks its whole start in week 0 and the shop does NOT write', () => {
    let cameos = 0
    for (let s = 0; s < SEEDS; s++) {
      const world = familyWorld('working', `t12-park-working-${s}`)
      buyAsset(world, DEPOSIT, world.fundsCents)
      expect(world.fundsCents, 'the wallet really is empty – this is his exploit, not a near miss').toBe(0)
      cameos += walk(world, WINDOW)
    }
    expect(cameos, `${SEEDS} working careers x ${WINDOW} weeks with the money parked`).toBe(0)
  })

  it('⭐⭐⭐ HIS OTHER ARM: a MIDDLE family parks its whole start in week 0 and the shop does NOT write', () => {
    // «предполагаю, что у среднего класса так же будет» – he guessed, and the gate's own
    // background-blindness is why he was right.
    let cameos = 0
    for (let s = 0; s < SEEDS; s++) {
      const world = familyWorld('middle', `t12-park-middle-${s}`)
      buyAsset(world, DEPOSIT, world.fundsCents)
      expect(world.fundsCents).toBe(0)
      cameos += walk(world, WINDOW)
    }
    expect(cameos, `${SEEDS} middle careers x ${WINDOW} weeks with the money parked`).toBe(0)
  })

  it('⭐⭐ ...and when the money is REALLY gone the shop still writes – WORKING', () => {
    // «чтобы поддержка приходила реально тогда, когда вообще уже край и денег нет». The parking is
    // sold and the proceeds are spent, so there is nothing left to reach. Without this arm the two
    // above are satisfied by a gate that has simply been switched off.
    expect(brokeAfterSelling('working')).toBeGreaterThan(0)
  })

  it('⭐⭐ ...and when the money is REALLY gone the shop still writes – MIDDLE', () => {
    expect(brokeAfterSelling('middle')).toBeGreaterThan(0)
  })
})

/** Park everything, hold it a while, then sell it and spend the proceeds for real. What is left is a
 *  family with no wallet and nothing to reach – the owner's «уже край». */
function brokeAfterSelling(background: FamilyBackground): number {
  let cameos = 0
  for (let s = 0; s < SEEDS; s++) {
    const world = familyWorld(background, `t12-broke-${background}-${s}`)
    buyAsset(world, DEPOSIT, world.fundsCents)
    cameos += walk(world, 60, (w, i) => {
      if (i !== 10) return
      sellAsset(w, DEPOSIT)
      expect(ownedAssets(w).find((a) => a.id === DEPOSIT), 'the parking is gone, not merely ignored').toBeUndefined()
      // The money is spent. There is no engine command for «the family had to pay for something
      // that is not tennis», so the wallet is set the way the benches set it.
      w.fundsCents = 200_00
    })
  }
  return cameos
}
