// ⭐⭐ ROUND 29 #5 – THE SHOP'S REMAINING STOREYS: the boats, the planes and the academy.
//
// THE OWNER: «В магазине всё ещё не хватает яхт, самолётов и стойки академии»
//
// docs/specs/the-shop-2026-08.md §3f (commissioning, the annual loss, the weekly upkeep, the yacht
// week, the plane's two effects) and §3g (the academy, in stages). Slice 1 (§3a-c) shipped at v63
// and `tests/shop.test.ts` still holds all of it; this file holds only what round 29 #5 added.
//
// ⚠ WHAT THIS FILE IS FOR, one describe each:
//   §1  the ladder IS §3f's table – price, wait, annual loss, weekly upkeep, to the figure;
//   §2  ORDERED, not bought: the money goes now, the contract cannot be sold and costs nothing;
//   §3  DELIVERED: it arrives, it starts falling, and the bill starts – in the wallet, in the ledger
//       and in `householdWeekly`, which is the strip round 28 #8 exists for;
//   §4  §3g's academy, in stages, in order, with a legible half-built state;
//   §5  ⭐⭐ THE PLANE: the fare it cuts (visible) and the point it adds (HIDDEN, and asserted as an
//       absence – that is the one a careless implementation gets backwards);
//   §6  ⭐⭐ THE YACHT WEEK as a seventh vacation package – there once owned, and not before;
//   §7  ⭐ P10's TOMBSTONE: the long-range plane is not sold, and an owning save is not stranded.
//
// ⚠ EVERY FIGURE IS READ OUT OF A TICKED WORLD, never off the constant that produced it. Where a
// price or a percentage IS asserted it is the SPEC's own literal, quoted so that a retune has to
// come through this file – the rule `tests/shop.test.ts` was written under.
import { describe, it, expect } from 'vitest'
import {
  accrueCondition,
  buyAsset,
  bookVacation,
  coachBilling,
  createWorld,
  closeTournament,
  hireMasseur,
  ownedAssets,
  revalueAssets,
  sellAsset,
  sellableAsset,
  shopItem,
  shopView,
  skipTournament,
  tickWeek,
  toSnapshot,
  travelCostFor,
  coachTravelFareFor,
  weeklyAssetUpkeepCents,
  type WorldState,
} from '../src/engine/world'
import { householdWeekly } from '../src/engine/world/coachMarket'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { SeasonEvent } from '../src/engine/season/types'

/** ⚠ THE DOOR IS OPENED THE WAY THE ENGINE OPENS IT – `tests/shop.test.ts`'s own helper, verbatim.
 *  `activeLadderOf`'s professional arm reads the never-pruned `bestFinishByTier` mark, so writing
 *  it is the same one-way door a real counting W-series result walks through. */
function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

/** A real career, walked by the real engine, professional and solvent enough to shop at this
 *  storey. `fundsCents` is set rather than earned: no career in the bench reaches $40M, and what is
 *  under test is what the shelf does with the money, not how the money arrives. */
function shopper(seed: string, weeks = 12, fundsCents = 60_000_000_00): WorldState {
  const world = professional(createWorld(seed))
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = fundsCents
  return world
}

/** Tick `n` weeks of a real career, keeping the wallet out of the way of the tournament flow. */
function walk(world: WorldState, n: number): void {
  const rng = rngFromSeed(`${world.seed}:walk`)
  for (let i = 0; i < n; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
}

const ownedOf = (w: WorldState, id: string) => ownedAssets(w).find((a) => a.id === id)
const rowOf = (w: WorldState, id: string) => shopView(w).rows.find((r) => r.id === id)!

describe('§1 – the elite ladder is the spec table, and each rung carries THREE numbers', () => {
  it('⭐⭐ price, wait, annual loss and weekly upkeep, on all six rungs', () => {
    // §3f's own table. Quoted as literals so a retune has to come through this file – and the
    // WEEKLY figure is derived from the percentage rather than stored, because §3f is explicit that
    // «THE UPKEEP PERCENTAGES ARE THE REAL ONES».
    const table: [string, number, number, number, number][] = [
      // id, price, build weeks, annual loss bps, annual upkeep bps
      ['boat-launch', 900_000_00, 52, -700, 600],
      // ⚠ RE-AIMED AT ROUND 29 PART THREE P1 («моторка $2.4М – давай переделаем на парусную яхту
      // пожалуйста»): the motor boat became the sailing yacht – id and identity moved, EVERY
      // NUMBER STAYED, which is exactly what this row now guards: he changed what the rung IS,
      // never what it costs.
      ['boat-sail', 2_400_000_00, 78, -700, 600],
      ['yacht', 12_000_000_00, 156, -500, 1000],
      ['yacht-big', 28_000_000_00, 208, -500, 1000],
      ['plane', 18_000_000_00, 104, -600, 800],
      // ⚠ P10: retired (see §7 below), but the TOMBSTONE keeps the numbers – an owned one is still
      // valued and billed by exactly this row, so the pin stays.
      ['plane-long', 38_000_000_00, 156, -600, 800],
    ]
    for (const [id, price, build, lossBps, upkeepBps] of table) {
      const item = shopItem(id)!
      expect(item.entryCents, `${id} price`).toBe(price)
      expect(item.buildWeeks, `${id} build`).toBe(build)
      expect(item.annualRateBps, `${id} loses`).toBe(lossBps)
      expect(item.upkeepBps, `${id} upkeep`).toBe(upkeepBps)
    }
  })

  it('⭐⭐ ...and the WEEKLY figure on the shelf is §3f\'s own, to the dollar', () => {
    // The spec prints these rounded to the nearest ten dollars; the engine keeps the cent. Asserted
    // against the spec's number with a $10 tolerance, which is exactly the rounding in his table
    // and no more – a bill computed off anything but `price x pct / 52` misses by far more.
    const spec: [string, number][] = [
      ['boat-launch', 1_040_00],
      // P1: the sailing yacht keeps the motor boat's weekly bill to the cent – same price, same
      // percentage, so the same $2,770.
      ['boat-sail', 2_770_00],
      ['yacht', 23_080_00],
      ['yacht-big', 53_850_00],
      ['plane', 27_690_00],
      ['plane-long', 58_460_00],
    ]
    const w = shopper('r29-5-table')
    // ⚠ RE-AIMED AT ROUND 29 PART FOUR P10: `plane-long` is RETIRED, and a retired rung is on the
    // view only for a family that owns one – so this world owns one, delivered, which is also the
    // tombstone's own claim being exercised: the row is still drawn and still quotes §3f's bill.
    // The other five stay unowned, so their rows quote off the PRICE exactly as before.
    w.assets = [{ id: 'plane-long', boughtWeek: 0, paidCents: 38_000_000_00, valueCents: 38_000_000_00 }]
    for (const [id, weekly] of spec) {
      // ⚠ OFF THE VIEW THE SCREEN READS, not off the catalogue: the number the player sees is the
      // claim, and `shopView` is where it is made.
      const row = rowOf(w, id)
      expect(Math.abs(row.upkeepCents - weekly), `${id} weekly upkeep`).toBeLessThanOrEqual(10_00)
      // ...and it really is a year of the percentage divided by the year.
      expect(row.upkeepCents).toBe(Math.round((row.entryCents * shopItem(id)!.upkeepBps!) / 10_000 / WEEKS_PER_YEAR))
    }
    // ⚠ ANTI-VACUITY: nothing that shipped in slice 1 has an upkeep, so a `upkeepBps` defaulted to
    // some non-zero number would light up here rather than passing quietly.
    for (const id of ['deposit', 'car-good', 'house-first', 'academy-land']) {
      expect(rowOf(w, id).upkeepCents, `${id} costs nothing to keep`).toBe(0)
    }
  })
})

describe('§2 – ordered, not bought: the money goes now and the contract cannot be sold', () => {
  it('⭐⭐ the wallet moves by the price, and the shelf holds a CONTRACT with a date on it', () => {
    const w = shopper('r29-5-order')
    const before = w.fundsCents
    const orderedWeek = w.week
    buyAsset(w, 'yacht')
    expect(before - w.fundsCents, 'the money left this week, in full').toBe(12_000_000_00)
    const owned = ownedOf(w, 'yacht')!
    expect(owned.paidCents).toBe(12_000_000_00)
    expect(owned.boughtWeek, 'the week they ordered it').toBe(orderedWeek)
    expect(owned.readyWeek, 'three years, and the engine wrote the date').toBe(orderedWeek + 156)
    // The ledger says both halves: the money, and the wait.
    const rows = w.events.filter((e) => e.week === orderedWeek)
    expect(rows.find((e) => e.category === 'shop')!.amountCents).toBe(-12_000_000_00)
    expect(rows.find((e) => e.category === 'shop')!.text).toContain('Ordered')
    expect(rows.some((e) => e.type === 'entry' && e.text.includes('on order')), 'the wait is on paper').toBe(true)
  })

  it('⭐⭐ §3f – a contract cannot be sold, and it costs NOTHING to keep while it is one', () => {
    const w = shopper('r29-5-contract')
    buyAsset(w, 'yacht')
    expect(sellableAsset(w, ownedOf(w, 'yacht')!), 'a contract is not a boat').toBe(false)
    expect(() => sellAsset(w, 'yacht')).toThrow(/cannot be sold/i)
    // ⚠⚠ AND THIS PAIR IS THE «мы ни за что не наказываем» CHECK. §4's own acceptance is that a
    // freeze may never bankrupt a family; the un-sellable weeks are exactly the weeks that cost
    // nothing, so there is no week in which a family is paying for a thing it cannot get out from
    // under. A yacht is $23,076 a week – if this were the other way round it would be ruinous.
    expect(weeklyAssetUpkeepCents(w), 'nobody crews a hull that does not exist').toBe(0)
    expect(householdWeekly(w, 0).upkeepCents).toBe(0)
    // ...and the screen says the same thing rather than offering a Sell it will refuse (R10-16).
    expect(rowOf(w, 'yacht').readyWeek).toBe(ownedOf(w, 'yacht')!.readyWeek)
  })

  it('⚠ ...and it does not lose a penny while it is being built', () => {
    const w = shopper('r29-5-nodepreciation')
    buyAsset(w, 'boat-launch')
    walk(w, 40) // 40 weeks into a 52-week build
    const owned = ownedOf(w, 'boat-launch')!
    expect(owned.readyWeek, 'still on order').toBeGreaterThan(w.week)
    expect(owned.valueCents, 'a contract has nothing to wear out yet').toBe(900_000_00)
    // ⚠ THE MECHANISM, NAMED: the value clock starts at DELIVERY (`basisWeek === readyWeek`), and
    // `assetValueCents`' own `Math.max(0, weeksHeld)` does the rest. A branch in `revalueAssets`
    // would have been a second value model.
    expect(owned.basisWeek).toBe(owned.readyWeek)
  })
})

describe('§3 – delivered: it arrives, it starts falling, and the bill starts', () => {
  /** A career that has taken delivery of the cheapest commissioned rung – 52 weeks of build walked
   *  through the real tick, so the arrival is the engine's own and not a poked field. */
  function delivered(seed: string): WorldState {
    const w = shopper(seed)
    buyAsset(w, 'boat-launch')
    walk(w, 53)
    return w
  }

  it('⭐⭐ the wait ends, the ledger says so, and the key is gone', () => {
    const w = delivered('r29-5-deliver')
    const owned = ownedOf(w, 'boat-launch')!
    expect(owned.readyWeek, 'absent means delivered').toBeUndefined()
    expect(
      w.events.some((e) => e.type === 'entry' && e.text.startsWith('Delivered: The launch')),
      'a three-year wait that ended in silence would be a defect',
    ).toBe(true)
    expect(sellableAsset(w, owned), 'and now it can be sold').toBe(true)
  })

  it('⭐⭐ ...and NOW it loses value, from the week it arrived and not from the week it was ordered', () => {
    const w = delivered('r29-5-falls')
    const price = 900_000_00
    walk(w, WEEKS_PER_YEAR)
    const owned = ownedOf(w, 'boat-launch')!
    // §3f's 7% a year, compounded over the weeks SINCE DELIVERY – both spans read off the world.
    const sinceDelivery = w.week - owned.basisWeek!
    const sinceOrder = w.week - owned.boughtWeek
    expect(owned.valueCents).toBe(Math.round(price * Math.pow(0.93, sinceDelivery / WEEKS_PER_YEAR)))
    // ⚠⚠ AND THE COUNTERFACTUAL IS THE POINT OF THE CASE. Had the clock started at the ORDER the
    // boat would be two years down instead of one – a year of the wait charged as wear on a thing
    // that did not exist. The gap is real money, so this is not a tautology of the line above.
    const ifOrderClock = Math.round(price * Math.pow(0.93, sinceOrder / WEEKS_PER_YEAR))
    expect(sinceOrder - sinceDelivery, 'the build really was a year').toBe(52)
    expect(owned.valueCents - ifOrderClock).toBeGreaterThan(5_000_000)
  })

  it('⭐⭐ the weekly upkeep leaves the WALLET, every week, at the figure on the card', () => {
    const w = delivered('r29-5-bill')
    const weekly = rowOf(w, 'boat-launch').upkeepCents
    expect(weekly, 'a zero here would make every assertion below vacuous').toBeGreaterThan(0)
    // ⚠ MEASURED AS A DIFFERENCE OF DIFFERENCES, because a week of a real career moves money for a
    // dozen reasons. The control is the SAME career with the boat sold the week it landed: every
    // other line of the week is identical and the gap between the two wallets is the upkeep alone.
    const control = delivered('r29-5-bill')
    sellAsset(control, 'boat-launch')
    const withBoat = w.fundsCents
    const without = control.fundsCents
    walk(w, 4)
    walk(control, 4)
    const spentWithBoat = withBoat - w.fundsCents
    const spentWithout = without - control.fundsCents
    expect(spentWithBoat - spentWithout, 'four weeks of crew, berth and insurance').toBe(weekly * 4)
    // ...and it is in the ledger under the shelf's own category, one row per thing, by name.
    const rows = w.events.filter((e) => e.category === 'shop' && e.text.startsWith('Upkeep:'))
    expect(rows.length).toBeGreaterThanOrEqual(4)
    expect(rows[rows.length - 1].text).toBe('Upkeep: The launch')
    expect(rows[rows.length - 1].amountCents).toBe(-weekly)
  })

  it('⭐⭐ ...and it is in `householdWeekly`, beside the coach and the masseur (round 28 #8)', () => {
    const w = delivered('r29-5-household')
    hireMasseur(w, true)
    const training = 500_00
    const house = householdWeekly(w, training)
    const weekly = rowOf(w, 'boat-launch').upkeepCents
    expect(house.upkeepCents, 'the shelf names its own bill on the strip').toBe(weekly)
    // ⚠⚠ THE CLAIM IS THAT IT IS INSIDE THE TOTAL, and it is measured against the SAME career with
    // the boat gone rather than against a sum rebuilt out of the object under test. Round 28 #8's
    // own defect was a total that did not know about a $525 masseur; a $1,038 boat that bypassed it
    // would be that defect again.
    const control = delivered('r29-5-household')
    hireMasseur(control, true)
    sellAsset(control, 'boat-launch')
    const bare = householdWeekly(control, training)
    // ⚠ SELLING THE BOAT REMOVES TWO TERMS AND THE CASE NAMES BOTH, or it would be asserting the
    // sum of a valuation and a bill and calling it a bill. `shelfCents` is round 28 #8's own field
    // (what one more week of holding does to the VALUE, never cash); `upkeepCents` is round 29 #5's
    // (what really leaves the wallet). The boat has both and they are different sizes.
    const shelfLoss = Math.max(0, -house.shelfCents)
    expect(shelfLoss, 'the launch really is depreciating, or the split below is vacuous').toBeGreaterThan(0)
    expect(shelfLoss).not.toBe(weekly)
    expect(house.outgoingCents - bare.outgoingCents).toBe(weekly + shelfLoss)
    expect(bare.upkeepCents).toBe(0)
    expect(bare.shelfCents).toBe(0)
    // ...and the snapshot the strip actually reads carries it.
    expect(toSnapshot(w).coachBilling.household.upkeepCents).toBe(weekly)
    expect(coachBilling(w).household.upkeepCents).toBe(weekly)
  })
})

describe('§4 – §3g, the academy: four stages, in order, and a half-built one is a real state', () => {
  it('⭐⭐ the four stages are a ladder in BUILD order, and they sum inside his band', () => {
    const w = shopper('r29-5-academy')
    const stages = shopView(w).rows.filter((r) => r.family === 'academy')
    expect(stages.map((s) => s.id)).toEqual([
      'academy-land',
      'academy-courts',
      'academy-building',
      'academy-staff',
    ])
    const total = stages.reduce((sum, s) => sum + s.entryCents, 0)
    // §3g: «Cost: $8–15M, in STAGES rather than one press». ⚠ The four prices themselves are the
    // builder's and not the spec's – §3g gives the band and the four names and stops – so what is
    // pinned is the BAND, which is his.
    expect(total).toBeGreaterThanOrEqual(8_000_000_00)
    expect(total).toBeLessThanOrEqual(15_000_000_00)
    // ⚠ AND IT NEITHER EARNS NOR DECAYS, because §3g gives it no rate and this file invents none.
    for (const s of stages) expect(s.annualRatePct, `${s.id} holds its value`).toBe(0)
    // ...nor a wait, nor an upkeep: §3f's «время постройки» and «годовое обслуживание» are said of
    // the boats and the planes.
    for (const s of stages) {
      expect(s.buildWeeks, `${s.id} arrives at once`).toBe(0)
      expect(s.upkeepCents, `${s.id} costs nothing to keep`).toBe(0)
    }
  })

  it('⭐⭐ a stage cannot be built before the one under it, and the refusal NAMES it', () => {
    const w = shopper('r29-5-stages')
    expect(() => buyAsset(w, 'academy-courts')).toThrow(/The land has to come first/)
    expect(rowOf(w, 'academy-courts').requirementMet).toBe(false)
    expect(rowOf(w, 'academy-land').requirementMet, 'the first stage stands on its own').toBe(true)
    buyAsset(w, 'academy-land')
    expect(rowOf(w, 'academy-courts').requirementMet, 'and now it does not').toBe(true)
    buyAsset(w, 'academy-courts')
    expect(() => buyAsset(w, 'academy-staff')).toThrow(/The clubhouse has to come first/)
  })

  it('⭐ a HALF-BUILT academy is legible: two stages owned, two priced and waiting', () => {
    const w = shopper('r29-5-half')
    const before = w.fundsCents
    buyAsset(w, 'academy-land')
    buyAsset(w, 'academy-courts')
    expect(before - w.fundsCents, 'both stages came out of the one wallet').toBe(5_000_000_00)
    walk(w, 4)
    const stages = shopView(w).rows.filter((r) => r.family === 'academy')
    expect(stages.filter((s) => s.valueCents !== null).map((s) => s.id)).toEqual([
      'academy-land',
      'academy-courts',
    ])
    // ⚠ THE UNBUILT STAGES KEEP THEIR PRICE ON SCREEN – §2's «never a locked row, a progress bar or
    // a teaser», read one storey up.
    for (const s of stages.filter((x) => x.valueCents === null)) expect(s.entryCents).toBeGreaterThan(0)
    // ...and four weeks later the land is worth exactly what it cost.
    expect(ownedOf(w, 'academy-land')!.valueCents).toBe(2_000_000_00)
  })
})

describe('§5 – the plane: the fare it cuts, and the point it does NOT print', () => {
  /** A career with a DELIVERED plane, walked through the real build. `plane` waits two years. */
  function withPlane(seed: string): WorldState {
    const w = shopper(seed)
    buyAsset(w, 'plane')
    walk(w, 105)
    expect(ownedOf(w, 'plane')!.readyWeek, 'the plane really landed').toBeUndefined()
    return w
  }
  /** The same career, same weeks, no plane – the control. */
  function withoutPlane(seed: string): WorldState {
    const w = shopper(seed)
    walk(w, 105)
    return w
  }

  const trip = { tier: 'wta250', travelCostCents: 3_000_00 } as unknown as SeasonEvent

  it('⭐ ordering one moves the wallet, the shelf and – once it lands – the weekly bill', () => {
    // The per-storey claim, for this storey: the boats have it in §2 and §3, the academy in §4, and
    // this is the aircraft's. Read out of a ticked world at both ends.
    const w = shopper('r29-5-plane-wallet')
    const before = w.fundsCents
    buyAsset(w, 'plane')
    expect(before - w.fundsCents, 'the money left this week, in full').toBe(18_000_000_00)
    expect(ownedOf(w, 'plane')!.readyWeek, 'two years').toBe(w.week + 104)
    expect(householdWeekly(w, 0).upkeepCents, 'a contract has no crew').toBe(0)
    walk(w, 105)
    const weekly = rowOf(w, 'plane').upkeepCents
    expect(weekly, '§3f\'s own figure for this rung, to the dollar').toBe(27_692_31)
    expect(householdWeekly(w, 0).upkeepCents, 'and now it is in the household\'s week').toBe(weekly)
  })

  it('⭐⭐ it halves the family\'s fare – hers and the staff\'s, because it is one aeroplane', () => {
    const w = withPlane('r29-5-plane-fare')
    const bare = withoutPlane('r29-5-plane-fare')
    expect(travelCostFor(bare, trip), 'the control pays the calendar\'s price').toBe(3_000_00)
    expect(travelCostFor(w, trip)).toBe(1_500_00)
    // his seat too – `coachTravelFareFor` is what §3f names
    w.coachId = bare.coachId = 'c-any'
    w.coachOnEventWeeks = bare.coachOnEventWeeks = true
    expect(coachTravelFareFor(bare, trip)).toBe(3_000_00)
    expect(coachTravelFareFor(w, trip)).toBe(1_500_00)
  })

  it('⚠⚠ ...and a plane is NOT a scholarship: the support sentence stays false', () => {
    // The re-aim this change owed the screen. `travelCoverReachesHer` asks «is any SUPPORT taking
    // anything off her travel», and it is asked of `supportedTravelCents` now precisely so a family
    // that bought its own aeroplane is not told a brand or an academy is paying for her seat.
    const w = withPlane('r29-5-plane-cover')
    expect(w.academy, 'the fixture holds no scholarship').toBeNull()
    expect(coachBilling(w).travelCovered).toBe(false)
  })

  it('⚠ a plane still ON ORDER flies nobody anywhere', () => {
    const w = shopper('r29-5-plane-contract')
    buyAsset(w, 'plane')
    walk(w, 20)
    expect(travelCostFor(w, trip), 'a contract is not an aeroplane').toBe(3_000_00)
  })

  it('⭐⭐ THE HIDDEN BONUS – a travelling week returns exactly one point more', () => {
    // ⚠ MUTATION: drop the `playedThisWeek && ownsDeliveredOfFamily(world, 'plane')` term from
    // `accrueCondition` and this case alone goes red.
    //
    // §3f's own row: «the plane | +1 applies on | weeks she IS travelling to an event». The control
    // is the SAME career with no plane, so nothing else about the two worlds differs.
    const withIt = withPlane('r29-5-plane-rest')
    const without = withoutPlane('r29-5-plane-rest')
    const played = (w: WorldState): number => {
      w.condition = 50
      accrueCondition(w, true)
      return w.condition
    }
    expect(played(withIt) - played(without), 'his own figure – «может 1 накинуть»').toBe(1)
  })

  it('⭐⭐ ...and it lands on the weeks she TRAVELS and on no others', () => {
    // §3f: «No week can receive both, so a family owning everything gets a corridor that is one
    // point kinder across the board – never two.» The court (§3d) pays on the weeks this does not,
    // and this is the half of that statement the shop can prove.
    const withIt = withPlane('r29-5-plane-restweek')
    const without = withoutPlane('r29-5-plane-restweek')
    const rested = (w: WorldState): number => {
      w.condition = 50
      accrueCondition(w, false)
      return w.condition
    }
    expect(rested(withIt) - rested(without), 'a week at home is not a week on the road').toBe(0)
  })

  it('⭐⭐ THE BONUS IS NEVER DISPLAYED – asserted as an absence, which is the only way to test it', () => {
    // ⚠⚠ HIS OWN RULING, made about the court this is the analogy of: «верно, но только если знают
    // об этом, я предложил сделать бонус скрытым». §3d rule 4: «Hidden means never a number on a
    // card.» A shelf row that helpfully said «+1 on travel weeks» would pass every other case in
    // this file and break the feature, so the claim is that NOTHING a person can read says it.
    const w = withPlane('r29-5-plane-hidden')
    const snap = toSnapshot(w)
    const row = snap.shop.rows.find((r) => r.id === 'plane')!
    // Everything the row carries about the plane, in one bag of readable text.
    const words = `${row.label} ${row.blurb}`.toLowerCase()
    expect(words).not.toMatch(/condition|fatigue|tired|fresher|rest|recover|\+1/)
    // ...and no ledger line the plane writes mentions her at all.
    const shopRows = w.events.filter((e) => e.category === 'shop').map((e) => e.text.toLowerCase())
    for (const text of shopRows) expect(text).not.toMatch(/condition|fatigue|fresher|recover/)
    // ⚠ ANTI-VACUITY, AND IT IS THE HALF THAT MAKES THIS TEST WORTH HAVING: the patterns above do
    // match the language this game uses for exactly this kind of effect, so a row that DID state
    // the bonus would be caught. The masseur's own card is the proof that the vocabulary is real.
    expect('adds a little condition each week').toMatch(/condition/)
    // ...and the effect is genuinely there behind the silence – the same career with and without
    // the aeroplane, measured. ⚠ AN A/B AND NOT AN ABSOLUTE: a played week also carries the physio
    // retainer and whatever else the world is holding, so «51» would be a claim about the fixture
    // rather than about the plane.
    const bare = withoutPlane('r29-5-plane-hidden')
    const played = (x: WorldState): number => {
      x.condition = 50
      accrueCondition(x, true)
      return x.condition
    }
    expect(played(w) - played(bare), 'silent, and still worth a point').toBe(1)
  })
})

describe('§6 – ⭐⭐ a week on the yacht is a seventh vacation package (§3f)', () => {
  it('⭐⭐ it is not on the ladder for a family with no yacht, and cannot be booked', () => {
    const w = shopper('r29-5-noyacht')
    expect(shopView(w).vacationIds, 'nothing granted').toEqual([])
    expect(toSnapshot(w).shop.vacationIds).toEqual([])
    expect(() => bookVacation(w, w.week + 2, 'yacht-week')).toThrow(/does not own/i)
  })

  it('⚠ ...nor while the yacht is still being built – a contract is not a boat', () => {
    const w = shopper('r29-5-building-yacht')
    buyAsset(w, 'yacht')
    walk(w, 30)
    expect(shopView(w).vacationIds).toEqual([])
    expect(() => bookVacation(w, w.week + 2, 'yacht-week')).toThrow(/does not own/i)
  })

  it('⭐⭐ ...and once it is DELIVERED the week is there, free, and it books', () => {
    const w = shopper('r29-5-yacht-week')
    buyAsset(w, 'yacht')
    walk(w, 157)
    expect(ownedOf(w, 'yacht')!.readyWeek, 'the yacht really landed').toBeUndefined()
    expect(toSnapshot(w).shop.vacationIds).toEqual(['yacht-week'])
    const funds = w.fundsCents
    const week = w.week + 2
    bookVacation(w, week, 'yacht-week')
    expect(w.fundsCents, 'free at the point of use – the money went years ago').toBe(funds)
    expect(w.vacations.some((v) => v.week === week && v.packageId === 'yacht-week')).toBe(true)
    // ⚠ AND IT RESTORES WHAT IT SAYS IT DOES, through the real tick rather than off the catalogue.
    w.condition = 40
    w.physioActive = false
    walk(w, week - w.week + 1)
    expect(w.condition, 'the week away landed its gain').toBeGreaterThan(40)
  })

  it('⚠ P1 – the SAILING yacht grants nothing: the week is crewed and its upkeep has no crew in it', () => {
    // ⭐ ROUND 29 PART THREE P1's one design question, answered NO on purpose: the package's own
    // copy is a crew of six, and the crew is what `yacht`/`yacht-big`'s 10% upkeep pays for. The
    // $2.4M sailing yacht keeps the boats' crewless 6%, so renaming the rung must not hand its
    // family a crewed holiday – the grant reads what the upkeep pays for, not the label's noun.
    // The catalogue comment above `yacht` carries the full argument; this arm is what keeps a
    // future «it says yacht, wire the week» edit honest.
    const w = shopper('r29-p1-sail-grants-nothing')
    w.assets = [{ id: 'boat-sail', boughtWeek: 0, paidCents: 2_400_000_00, valueCents: 2_400_000_00 }]
    expect(shopItem('boat-sail')!.label, 'the rung really is the sailing yacht').toBe('The sailing yacht')
    expect(shopItem('boat-sail')!.grantsVacationId, 'and it grants no package').toBeUndefined()
    expect(shopView(w).vacationIds, 'a delivered sailing yacht unlocks nothing').toEqual([])
  })

  it('⚠ selling the yacht takes the week away again', () => {
    const w = shopper('r29-5-yacht-sold')
    buyAsset(w, 'yacht')
    walk(w, 157)
    expect(shopView(w).vacationIds).toEqual(['yacht-week'])
    sellAsset(w, 'yacht')
    expect(shopView(w).vacationIds).toEqual([])
    expect(() => bookVacation(w, w.week + 2, 'yacht-week')).toThrow(/does not own/i)
  })
})

describe('§7 – ⭐ round 29 part four P10: the long-range plane leaves the shelf, tombstoned', () => {
  // HIS RULING: «значит убрать этот самолет за 38М и всех делов =)» – off the reachability
  // measurement (72 careers x 780 weeks): 0 of 72 ever took DELIVERY of a `plane-long`, and its
  // upkeep alone ($58,460/wk) eats a $20M portfolio's whole commission. He removed the rung rather
  // than resizing it. The three claims below are the ruling's own three verbs: not sold, still
  // valued/billed, still sellable – «do not strand the money».

  it('⭐ it is not on the shelf and cannot be bought – and the smaller plane still is', () => {
    const w = shopper('r29-p10-not-sold')
    expect(shopView(w).rows.some((r) => r.id === 'plane-long'), 'no row for a family without one').toBe(false)
    // ⚠ ANTI-VACUITY: the FAMILY survives – only the one rung is gone, so a filter that swept the
    // whole plane family (or the whole shelf) goes red here rather than passing quietly.
    expect(shopView(w).rows.some((r) => r.id === 'plane'), 'the $18M plane is still sold').toBe(true)
    const funds = w.fundsCents
    expect(() => buyAsset(w, 'plane-long')).toThrow(/no longer sold/i)
    expect(w.fundsCents, 'and the refusal charged nothing').toBe(funds)
    expect(ownedAssets(w).length, 'and owns nothing').toBe(0)
  })

  it('⭐⭐ a save that owns one is not stranded: visible, valued, billed – and it sells', () => {
    const w = shopper('r29-p10-owner')
    // The owning save, delivered – the state the tombstone exists for. Written directly: no career
    // can BUY one any more, which is exactly the point.
    w.assets = [{ id: 'plane-long', boughtWeek: w.week - 52, paidCents: 38_000_000_00, valueCents: 38_000_000_00 }]
    const row = shopView(w).rows.find((r) => r.id === 'plane-long')
    expect(row, 'the owner still sees the row').toBeDefined()
    expect(row!.upkeepCents, 'still billed §3f\'s own weekly figure').toBe(
      Math.round((38_000_000_00 * 800) / 10_000 / WEEKS_PER_YEAR),
    )
    expect(weeklyAssetUpkeepCents(w), 'and the till charges the same number').toBe(row!.upkeepCents)
    // Valuation still runs on the retired rung's own rate – a year old, it is worth LESS than paid.
    revalueAssets(w)
    const owned = ownedAssets(w).find((a) => a.id === 'plane-long')!
    expect(owned.valueCents, 'a year of -6% really priced in').toBeLessThan(38_000_000_00)
    expect(owned.valueCents, 'and it is a value, not a write-off').toBeGreaterThan(30_000_000_00)
    // ...and the way out is open: sold at the stored value, money in the wallet, row off the shelf.
    const funds = w.fundsCents
    const worth = owned.valueCents
    sellAsset(w, 'plane-long')
    expect(w.fundsCents).toBe(funds + worth)
    expect(shopView(w).rows.some((r) => r.id === 'plane-long'), 'gone from the view once sold').toBe(false)
  })
})
