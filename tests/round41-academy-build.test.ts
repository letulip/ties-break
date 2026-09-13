// ROUND 41 #24 – THE ACADEMY IS BUILT TO ORDER.
//
// THE OWNER, 12.09: «может быть для Академии корты, клубный дом и стафф тоже должны сколько-то
// строиться по времени, а не сразу быть готовы?» – and, when the round proposed courts ~6 weeks, the
// clubhouse ~12 and a staff hire of 2–4 and asked whether it should wait for v76: «сроки ок, в этот
// же раунд заводи пожалуйста».
//
// ⚠⚠ THE ITEM IS THREE FIELDS IN THE CATALOGUE AND NOT ONE LINE OF MACHINERY, WHICH IS WHY THIS FILE
// TESTS THE READERS RATHER THAN THE FIELDS. `buildWeeks` / `readyWeek` / «On order» have been shipped
// machinery since round 29 #5 (the boats and the planes), and every reader of academy ownership
// already asks `deliveredAssets`: the income, the epilogue's stage count, the sale, the upkeep meter.
// So what needs proving is not that the three numbers are in the file – `round29-shop-elite.test.ts`
// pins that – but that a stage under construction behaves like a yacht under construction: no
// income, no sale, and worth exactly what was paid, with nothing wearing out while it does not exist.
//
// ⚠⚠ NO SCHEMA MOVE. `readyWeek` and `basisWeek` are v29-era persisted fields already on
// `OwnedAsset`; `SAVE_SCHEMA_VERSION` stays 74 and no migration is owed. A save written before this
// item holds academy rows with no `readyWeek`, which already means «delivered» – §3f's own rule –
// so an existing academy keeps earning through the change, and that is asserted here rather than
// assumed (§5).
//
// ⚠ ZERO DRAWS. Nothing in this item is random: a delivery week is `world.week + buildWeeks`.
//
// MUTATIONS, each applied alone to the engine, run, reverted. Control 8/8 green before and after.
// ⚠ THE COUNTS ARE READ OFF THE RUNS AND NOT PREDICTED – two of the four were guessed low (M1 at 7,
// M4 at 2), which is round 38's own lesson about why they are run rather than argued:
//   M1 `buildWeeks` removed from all three academy rows (the shipped state) → 8 red: seven here, and
//      `round29-shop-elite` §4's re-aimed catalogue arm;
//   M2 `deliverAssets` never removing `readyWeek`                           → 4 red (the delivery
//      week, the sale, the epilogue's second count, the shelf's cleared date);
//   M3 `assetWeeklyIncomeCents`' `deliveredAssets` gate → `ownedAssets`     → 3 red (the income
//      during the wait, the row's quoted income, the deferred-income total);
//   M4 `buyAsset` writing `basisWeek: world.week` instead of `readyWeek`    → 3 red (the value
//      clock, the boats-shape arm, and the career walk's «nothing is wearing out»).
import { describe, it, expect } from 'vitest'
import {
  academyWeeklyIncomeCents,
  assetDelivered,
  assetWeeklyIncomeCents,
  assetWorthCents,
  buyAsset,
  closeTournament,
  createWorld,
  deliveredAssets,
  ownedAssets,
  sellableAsset,
  shopItem,
  shopView,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { academyEpilogueOf } from '../src/engine/world/endings'
import { rngFromSeed } from '../src/engine/rng'

/** ⚠ THE DOOR IS OPENED THE WAY THE ENGINE OPENS IT – `tests/round29-shop-elite.test.ts`' own
 *  helper, verbatim: `activeLadderOf`'s professional arm reads the never-pruned `bestFinishByTier`
 *  mark, so writing it is the same one-way door a real counting W-series result walks through. */
function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

/** A real career, walked by the real engine, solvent enough to shop at this storey. The funds are
 *  set rather than earned – what is under test is what the shelf does with the money. */
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

/** Live `n` weeks the way a career lives them – the only path on which `deliverAssets` ever runs. */
function live(world: WorldState, n: number): void {
  const rng = rngFromSeed(`${world.seed}:live`)
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
/** A season-history-free career sits at reputation 1.0, so a delivered stage earns its base exactly.
 *  The reputation is not what this item moved and every arm reads the engine rather than a number. */
const COURTS_WEEKS = shopItem('academy-courts')!.buildWeeks!

// =================================================================================================
// §1 – THE ORDER. A CAREER PAYS, AND OWNS A CONTRACT.
// =================================================================================================
describe('§1 the order – the money goes this week and the courts do not', () => {
  it('⭐⭐⭐ ordering the courts writes the delivery date, and the value clock starts THERE', () => {
    const w = shopper('r41-24-order')
    const orderedAt = w.week
    buyAsset(w, 'academy-land')
    buyAsset(w, 'academy-courts')
    const courts = ownedOf(w, 'academy-courts')!
    expect(courts.readyWeek, 'six weeks, and the engine wrote the date').toBe(orderedAt + COURTS_WEEKS)
    // ⚠⚠ THE MECHANISM, NAMED, AND IT IS `round29-shop-elite.test.ts`' OWN SENTENCE ABOUT THE YACHT:
    // the value clock starts at DELIVERY, so the wait is not a punishment – `assetValueCents`'
    // `Math.max(0, weeksHeld)` holds the row at exactly what was paid for the whole of it.
    expect(courts.basisWeek, 'the clock starts when the thing exists').toBe(courts.readyWeek)
    expect(assetDelivered(courts), 'a contract, not a courts').toBe(false)
    expect(courts.valueCents, 'and it is worth what was paid').toBe(courts.paidCents)
    // ⚠ THE LAND IS THE CONTROL AND IT IS HIS OWN LIST READ LITERALLY: «корты, клубный дом и стафф»
    // names three things, and a field is BOUGHT rather than BUILT.
    const land = ownedOf(w, 'academy-land')!
    expect(land.readyWeek, 'the deeds arrive with the money').toBeUndefined()
    expect(land.basisWeek, 'so the land has no second clock at all').toBeUndefined()
    expect(assetDelivered(land)).toBe(true)
  })

  it('⭐⭐ the ordered row is the BOATS row, field for field – one branch writes both', () => {
    // ⚠⚠ THE CLAIM IS STRUCTURAL RATHER THAN NUMERIC, and it is the one that keeps this item from
    // being a second commissioning model beside §3f's. Order a yacht and the courts in the same week
    // of the same career: `buyAsset` has ONE commissioned branch, so the two rows must carry exactly
    // the same keys, with the same two meanings.
    const w = shopper('r41-24-shape')
    buyAsset(w, 'academy-land')
    buyAsset(w, 'academy-courts')
    buyAsset(w, 'yacht')
    const courts = ownedOf(w, 'academy-courts')!
    const yacht = ownedOf(w, 'yacht')!
    expect(Object.keys(courts).sort(), 'the same row shape').toEqual(Object.keys(yacht).sort())
    for (const row of [courts, yacht]) {
      expect(row.basisWeek, `${row.id}: the clock starts on delivery`).toBe(row.readyWeek)
      expect(row.valueCents, `${row.id}: a contract is worth what was paid`).toBe(row.paidCents)
      expect(row.readyWeek! - row.boughtWeek, `${row.id}: the wait is the catalogue's`)
        .toBe(shopItem(row.id)!.buildWeeks)
    }
  })

  it('⭐ the ledger says it twice – the money, and then the date', () => {
    const w = shopper('r41-24-ledger')
    buyAsset(w, 'academy-land')
    buyAsset(w, 'academy-courts')
    const rows = w.events.filter((e) => e.week === w.week)
    // ⚠ THE STRINGS ARE ROUND 29 #5's OWN AND NOT ONE WORD IS NEW – `Ordered:` and «is on order –
    // due» are the sentences the boats have printed since the commissioned branch shipped, and this
    // item adds no player-facing copy at all. What moved is which rungs reach them.
    expect(rows.some((e) => e.text === 'Ordered: The courts'), 'the expense row names the order').toBe(true)
    expect(rows.some((e) => e.text.startsWith('The courts is on order – due ')), 'and the date is its own row')
      .toBe(true)
    // ⚠ AND THE LAND KEPT THE OTHER VERB, which is what a row with no wait has always said.
    expect(rows.some((e) => e.text === 'Bought: The land'), 'the land is bought, not ordered').toBe(true)
    expect(rows.some((e) => e.text.startsWith('The land is on order')), 'and nothing is owed on it').toBe(false)
  })
})

// =================================================================================================
// §2 – THE WAIT. THE EFFECT IS ABSENT UNTIL THE WEEK IT IS DUE, AND PRESENT FROM IT.
// =================================================================================================
describe('§2 the wait – no income, no sale, nothing wearing out', () => {
  it('⭐⭐⭐ a career walks it: silent at week+3, silent at week+5, earning at week+6', () => {
    const w = shopper('r41-24-walk')
    buyAsset(w, 'academy-land')
    buyAsset(w, 'academy-courts')
    const due = ownedOf(w, 'academy-courts')!.readyWeek!
    const paid = ownedOf(w, 'academy-courts')!.paidCents
    // ⚠ THE OWNER'S OWN QUESTION IS «не сразу быть готовы», SO THE ARM IS ABOUT THE WEEKS BETWEEN –
    // walked through real ticks, because `deliverAssets` is a tick phase and a hand-set clock would
    // prove nothing about the career.
    live(w, 3)
    expect(w.week, 'three weeks of a real career').toBe(due - 3)
    expect(academyWeeklyIncomeCents(w), 'nothing is teaching on a building site').toBe(0)
    expect(ownedOf(w, 'academy-courts')!.valueCents, 'and nothing is wearing out either').toBe(paid)
    live(w, 2)
    expect(w.week).toBe(due - 1)
    expect(academyWeeklyIncomeCents(w), 'still a contract the week before it is due').toBe(0)
    expect(assetDelivered(ownedOf(w, 'academy-courts')!)).toBe(false)
    // ...and the week it is due, it is courts.
    live(w, 1)
    expect(w.week).toBe(due)
    expect(assetDelivered(ownedOf(w, 'academy-courts')!), 'absent readyWeek means delivered').toBe(true)
    expect(ownedOf(w, 'academy-courts')!.readyWeek, 'the key is GONE, not falsified').toBeUndefined()
    expect(academyWeeklyIncomeCents(w), 'and the courts earn from the week they exist').toBeGreaterThan(0)
    expect(w.events.some((e) => e.week === due && e.text === 'Delivered: The courts'), 'it says so')
      .toBe(true)
  })

  it('⭐⭐ nothing can be sold out of a building site, and the epilogue does not count it', () => {
    const w = shopper('r41-24-sale')
    buyAsset(w, 'academy-land')
    buyAsset(w, 'academy-courts')
    expect(sellableAsset(w, ownedOf(w, 'academy-courts')!), 'a contract is not a thing to sell').toBe(false)
    expect(sellableAsset(w, ownedOf(w, 'academy-land')!), 'the land is sellable the same week').toBe(true)
    // ⚠⚠ THE EPILOGUE'S OWN NOTE PREDICTED THIS ITEM IN AS MANY WORDS – «if a wait is ever added to a
    // stage, «a contract is not a business» keeps holding here for free» – and this is the arm that
    // collects on the promise rather than trusting it. One stage is built; one is on order.
    expect(academyEpilogueOf(w)!.stagesBuilt, 'the land, and not the courts').toBe(1)
    expect(deliveredAssets(w).filter((r) => r.item.family === 'academy').length).toBe(1)
    live(w, COURTS_WEEKS)
    expect(academyEpilogueOf(w)!.stagesBuilt, 'and then both of them').toBe(2)
    expect(sellableAsset(w, ownedOf(w, 'academy-courts')!), 'a delivered stage can be sold').toBe(true)
  })

  it('⭐ the shelf shows the date instead of a value, and quotes no income for it', () => {
    const w = shopper('r41-24-view')
    buyAsset(w, 'academy-land')
    buyAsset(w, 'academy-courts')
    const row = rowOf(w, 'academy-courts')
    expect(row.readyWeek, 'the snapshot really carries the date').toBe(ownedOf(w, 'academy-courts')!.readyWeek)
    expect(row.incomeCents, 'and quotes nothing coming in').toBe(0)
    expect(row.buildWeeks, 'the card can say how long it takes before it is ordered').toBe(COURTS_WEEKS)
    // ⚠ AND THE LAND'S ROW IS A DELIVERED ROW, which is the negative that fails if the wait leaks on
    // to a rung that has none.
    expect(rowOf(w, 'academy-land').readyWeek, 'the land is not on order').toBeNull()
    live(w, COURTS_WEEKS)
    expect(rowOf(w, 'academy-courts').readyWeek, 'and the date is gone once it is here').toBeNull()
    expect(rowOf(w, 'academy-courts').incomeCents, 'with the week`s money on the row').toBeGreaterThan(0)
  })
})

// =================================================================================================
// §3 – WHAT THE DELAY COSTS, MEASURED. THE «BENCH-LIGHT» NOTE THE ROUND ASKED FOR.
// =================================================================================================
describe('§3 the size of it – the income the wait defers, in cents', () => {
  it('⭐⭐ the whole academy ordered at once starts earning 12 weeks later, and loses exactly that', () => {
    // ⚠⚠ NO BALANCE CORRIDOR MOVED BY THIS ITEM – not one price, rate or income figure changed – so
    // what a bench could measure is arithmetic: the delay shifts the start of the academy's income
    // by the longest stage's own wait, and costs the family that many weeks of it. This arm states
    // the number rather than leaving it to a corpus run that could only rediscover multiplication.
    const w = shopper('r41-24-cost')
    for (const id of ['academy-land', 'academy-courts', 'academy-building', 'academy-staff']) buyAsset(w, id)
    expect(academyWeeklyIncomeCents(w), 'week zero: four contracts and no academy').toBe(0)
    const waits = ['academy-courts', 'academy-building', 'academy-staff'].map(
      (id) => shopItem(id)!.buildWeeks!,
    )
    const longest = Math.max(...waits)
    // Walk the whole build and total what each week actually brought in.
    let deferredCents = 0
    for (let i = 0; i < longest; i++) {
      live(w, 1)
      deferredCents += academyWeeklyIncomeCents(w)
    }
    // ⚠ THE STAFF ARRIVE FIRST (3 weeks), THEN THE COURTS (6), THEN THE CLUBHOUSE (12) – so the
    // ramp is real money arriving in three steps rather than one cliff, and the total below is what
    // a career that ordered everything in one week actually banked over the twelve.
    const whole = academyWeeklyIncomeCents(w)
    expect(whole, 'and at the end the academy is whole').toBeGreaterThan(0)
    const ifInstant = whole * longest
    expect(deferredCents, 'the wait really did cost weeks of income').toBeLessThan(ifInstant)
    // ⚠ THE FIGURES ARE READ OFF THE RUN AND NOT PREDICTED – measured at reputation 1.0, which is
    // where a career with no banked season sits, so these are the base rows themselves ($950 the
    // courts, $2,500 the clubhouse, $3,800 the staff):
    //   the whole academy                 $7,250 a week
    //   banked over the 12-week build     $47,150   (staff from w+3, courts from w+6, clubhouse w+12)
    //   had all four arrived at once      $87,000
    //   deferred by the wait              $39,850   (45.8% of the window, once)
    expect(whole).toBe(7_250_00)
    expect(deferredCents).toBe(47_150_00)
    expect(ifInstant - deferredCents).toBe(39_850_00)
  })
})

// =================================================================================================
// §4 – THE SAVE. NOTHING PERSISTED MOVED, AND AN OLD ACADEMY KEEPS EARNING.
// =================================================================================================
describe('§4 the save – no schema move, and no career is stranded', () => {
  it('⭐⭐⭐ a stage written the OLD way – owned with no readyWeek – is delivered and earns', () => {
    // ⚠⚠ THIS IS THE WHOLE OF THE MIGRATION QUESTION AND THE ANSWER IS «NONE OWED». Every academy
    // row in every save written before this item carries no `readyWeek`, and `assetDelivered`'s own
    // rule is that an absent key MEANS delivered – «what every row written before round 29 #5
    // already means». So a loaded career finds its academy built, which is exactly what its owner
    // left behind. A migration would have had to invent a delivery date for a thing that is standing.
    const w = shopper('r41-24-old')
    w.assets = [
      { id: 'academy-land', boughtWeek: w.week - 200, paidCents: 2_000_000_00, valueCents: 2_000_000_00 },
      { id: 'academy-courts', boughtWeek: w.week - 200, paidCents: 3_000_000_00, valueCents: 3_000_000_00 },
    ]
    expect(assetDelivered(ownedOf(w, 'academy-courts')!), 'absent means delivered').toBe(true)
    expect(assetWeeklyIncomeCents(w, 'academy-courts'), 'and it is still teaching').toBeGreaterThan(0)
    expect(sellableAsset(w, ownedOf(w, 'academy-courts')!)).toBe(true)
    // ...and it is priced off its own purchase week, unchanged: no basis was invented for it.
    const item = shopItem('academy-courts')!
    expect(assetWorthCents(w, ownedOf(w, 'academy-courts')!, item)).toBeGreaterThan(3_000_000_00)
  })
})
