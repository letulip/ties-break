// ROUND 41 #18 – THE BRAND'S SUDDEN DROP. THE WALK IS INCREMENTAL AND CANNOT REWRITE ITS OWN PAST.
//
// THE OWNER, 12.09: «у девочки в 16 лет в топ-100 свежекупленный бренд почему-то упал в цене на
// вторую неделю и остался там и дальше на долго. Начал потихоньку расти только после победы на w500.
// Надо проверить логику. И снова потом упал в цене внезапно.»
//
// ⚠⚠ THREE OF THE FOUR THINGS HE SAW ARE THE MODEL WORKING AND ARE UNTOUCHED BY THIS ITEM, which is
// why §3 pins them rather than leaving them to be "fixed" by a later reader:
//   * the dip after the buy – the row opens at what was PAID (round 38 #16's sell-and-rebuy fix) and
//     a sixteen-year-old's derived worth is far below it, so the first weeks fall;
//   * the long flat stretch – `worthRampHalfLife` is ≈266 weeks at low fame, so the walk is slow;
//   * the rise after the W500 – fame climbs and the target goes above the row.
//
// THE FOURTH – «и снова потом упал в цене внезапно» – WAS A DEFECT, AND IT WAS IN THE SPAN. The
// half-life was recomputed from TODAY's fame and then applied to the WHOLE holding period, so a fame
// that fell re-read every week the family had already lived. Measured on the recon's worked example
// (held 100 weeks, paid $250,000, derived $2,000,000, fame 25.6 → 12.8): **−28.13% in one week**,
// with nothing having happened to the brand that week. The row now steps ONE WEEK from its own
// current value at this week's pace: the same event moves it **+0.20%**.
//
// ⚠⚠ IT IS THE SAME CURVE AND §1 IS WHERE THAT IS PROVED. For a constant half-life the weekly
// product telescopes to the shipped closed form exactly – `d + (v − d)·q` applied n times from
// `paid` is `d + (paid − d)·qⁿ` – so every number round 38 #16 measured still describes this path,
// and the only difference is the cent each step rounds away.
//
// ⚠ NO SCHEMA MOVE. The accumulator is `owned.valueCents`, a field `revalueAssets` has written every
// week since slice 1. `SAVE_SCHEMA_VERSION` stays 74 and a save mid-hold simply keeps walking from
// the value it was saved with – §4.
//
// ⚠ ZERO DRAWS: `world/shop.ts` imports no RNG, and the brand's own signals are folds over results
// and trophies. The frozen MAIN capture (41550 / e6b0c709) cannot see any of it.
//
// ⚠⚠ THE ONE PROPERTY THE ITEM COSTS IS IDEMPOTENCE, ON ONE FAMILY, AND §5 IS ITS GUARD:
// `revalueAssets` run twice in a week now double-steps a brand. It is safe because the tick is its
// only caller, and the warning lives on `revalueAssets`' own header where a reader adding a second
// one would see it.
//
// MUTATIONS, each applied alone to the engine, run, reverted. Control 10/10 here and 85/85 across
// the five brand suites this item touches. ⚠ THE COUNTS ARE READ OFF THE RUNS AND NOT PREDICTED, and
// the FIRST of them changed this file rather than being recorded:
//   P1 `assetWorthCents`' business arm reverted to the shipped closed form
//                                          -> 3 red: §2's ENGINE arm, §5's «the brand is the one
//                                             that is not», and round 30 #9 §3's re-measured fall
//                                             band. ⚠⚠ THE FIRST DRAFT OF §2's ENGINE ARM STAYED
//                                             GREEN UNDER THIS, and that is why the discriminator
//                                             inside it exists: a smoothly decaying fame makes the
//                                             OLD form fall smoothly too, so «no jumps» alone cannot
//                                             tell the arms apart – WHERE THE ROW ENDS UP can.
//   P2 the week-zero identity (`held <= 0` returns `paidCents`) deleted
//                                          -> 6 red across three files: this file's buy arm, round
//                                             30 #9 §4 and §5, #24, and both of r39-brand-rebuy's
//                                             founding arms. The sell-and-rebuy loop is the property
//                                             that guard holds shut.
//   P3 the ramp deleted (`return Math.round(derived)`, the row arrives at once)
//                                          -> 9 red, which is round 38 #16's own blast radius plus
//                                             this file's dip arm: «не за 1 день, т.к. это процесс».
import { describe, it, expect } from 'vitest'
import {
  assetWorthCents,
  buyAsset,
  closeTournament,
  createWorld,
  ownedAssets,
  revalueAssets,
  shopItem,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rampedWorthCents, worthRampHalfLife } from '../src/engine/world/assets'
import { brandGrossWorthCents, brandSignalsOf } from '../src/engine/world/brand'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const R = ECONOMY.shop.worthRamp
const MERCH = 'merch-brand'
const PRICE = shopItem(MERCH)!.entryCents

/** THE OLD ARM, SPELLED OUT ONCE: the call the engine made before this item – the whole holding
 *  period, at the pace today's fame implies. Kept in the test rather than in the engine, because it
 *  is what the item REPLACED and a comparison needs both sides. */
const closedForm = (paidCents: number, derivedCents: number, weeksHeld: number, fame: number): number =>
  rampedWorthCents(paidCents, derivedCents, weeksHeld, worthRampHalfLife(fame, R.medianFame))

/** THE NEW ARM: one week's step from the row's own value, which is what `assetWorthCents` now hands
 *  `rampedWorthCents` for a business row. */
const step = (valueCents: number, derivedCents: number, fame: number): number =>
  rampedWorthCents(valueCents, derivedCents, 1, worthRampHalfLife(fame, R.medianFame))

const ownedOf = (w: WorldState, id: string) => ownedAssets(w).find((a) => a.id === id)

/** A real career with money in it – `tests/round29-shop-elite.test.ts`' own shopper idiom. */
function shopper(seed: string, weeks = 12, fundsCents = 60_000_000_00): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.bestFinishByTier.wta250 = 3
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

// =================================================================================================
// §1 – THE SAME CURVE: THE WEEKLY PRODUCT TELESCOPES TO THE SHIPPED CLOSED FORM
// =================================================================================================
describe('§1 the walk IS the closed form, one week at a time', () => {
  it('⭐⭐⭐ at a constant half-life, N steps from `paid` land where the closed form said, to the cent', () => {
    // ⚠ THE ARM THAT SAYS «THIS IS NOT A NEW MODEL». Every measurement round 38 #16 took still
    // describes this path; what a falling fame no longer does is reach backwards.
    for (const fame of [4, 12.8, 25.6, 60]) {
      for (const derived of [2_000_000_00, 90_000_00, PRICE]) {
        let value = PRICE
        for (let n = 1; n <= 208; n++) {
          value = step(value, derived, fame)
          const closed = closedForm(PRICE, derived, n, fame)
          // ⚠ THE DRIFT IS THE ROUNDING AND NOTHING ELSE – one cent a step at worst, and the bound
          // is the step count. A model that differed would diverge as a SHARE, not as a count.
          expect(Math.abs(value - closed), `fame ${fame}, derived ${derived}, n=${n}`).toBeLessThanOrEqual(n)
        }
      }
    }
  })

  it('⭐⭐ over eight years of weekly steps the drift is cents, not dollars', () => {
    // The longest walk the game can produce, at the slowest pace: 416 weeks at the clamp.
    let value = PRICE
    const derived = Math.round(PRICE * ECONOMY.shop.businessValueFloorShare)
    for (let n = 0; n < R.maxHalfLifeWeeks; n++) value = step(value, derived, 0)
    const closed = closedForm(PRICE, derived, R.maxHalfLifeWeeks, 0)
    expect(Math.abs(value - closed), 'a half-life of weekly rounding').toBeLessThanOrEqual(100)
    // ...and it really did walk half the way, which is what makes the comparison worth making.
    expect(value).toBeLessThan(PRICE)
    expect(value).toBeGreaterThan(derived)
  })
})

// =================================================================================================
// §2 – THE DEFECT: A FAME THAT FALLS NO LONGER REWRITES THE WEEKS ALREADY LIVED
// =================================================================================================
describe('§2 the retroactive half-life is gone', () => {
  it('⭐⭐⭐ the recon`s worked example: OLD drops 28% in one week, NEW moves under one', () => {
    const PAID = 250_000_00
    const DERIVED = 2_000_000_00
    const HELD = 100
    const BEFORE = 25.6
    const AFTER = 12.8
    // The fixture's own premise, asserted rather than assumed: halving the fame doubles the pace.
    expect(worthRampHalfLife(AFTER, R.medianFame)).toBeCloseTo(2 * worthRampHalfLife(BEFORE, R.medianFame), 6)

    // OLD – the span re-read at the new pace.
    const oldAt99 = closedForm(PAID, DERIVED, HELD - 1, BEFORE)
    const oldAt100 = closedForm(PAID, DERIVED, HELD, AFTER)
    const oldMove = (oldAt100 - oldAt99) / oldAt99
    expect(oldMove, 'the defect, reproduced').toBeLessThan(-0.25)

    // NEW – the row walks to week 99 and then takes ONE step at the new pace.
    let value = PAID
    for (let w = 0; w < HELD - 1; w++) value = step(value, DERIVED, BEFORE)
    const newAt99 = value
    const newAt100 = step(newAt99, DERIVED, AFTER)
    const newMove = (newAt100 - newAt99) / newAt99
    // ⚠⚠ THE BOUND IS THE WEEKLY BLEND ITSELF AND NOT A ROUND NUMBER – `1 − 0.5^(1/H)` is the most
    // of the gap one week can close, so a step can never exceed it however the world moves. That is
    // the property «no week-over-week move beyond the weekly blend» stated as arithmetic.
    const blend = 1 - Math.pow(0.5, 1 / worthRampHalfLife(AFTER, R.medianFame))
    expect(Math.abs(newMove), 'the fix, bounded by the blend itself').toBeLessThanOrEqual(blend)
    expect(Math.abs(newMove)).toBeLessThan(0.01)
    // ⚠ AND THE TWO ARMS AGREED THE WEEK BEFORE, which is what makes this a comparison of one path
    // rather than of two models.
    expect(Math.abs(newAt99 - oldAt99), 'the same row, up to the walk`s rounding').toBeLessThanOrEqual(HELD)
  })

  it('⭐⭐⭐ THROUGH THE ENGINE: a real career whose fame decays never sees a jump', () => {
    // ⚠⚠ THE ARM THAT TESTS THE **ENGINE'S CHOICE** AND NOT THE ARITHMETIC. Every other arm in §1 and
    // §2 spends `rampedWorthCents` directly, so a revert of `assetWorthCents` to the closed form
    // would leave them all green – which the mutation run showed, and which is why this one exists.
    // Here the row is walked by the shipped writer (`revalueAssets`) on a world whose fame is really
    // decaying (a reign, then nothing: `fameAt` halves on its own 104-week clock), and the claim is
    // the one his report is about – no week arrives with a cliff in it.
    const w = shopper('r41-18-engine')
    w.trophiesByTier.slam ??= { titles: [], finals: [] }
    w.trophiesByTier.slam!.titles.push(w.week - 2, w.week - 6)
    w.trophiesByTier.wta1000 ??= { titles: [], finals: [] }
    w.trophiesByTier.wta1000!.titles.push(w.week - 4, w.week - 8, w.week - 12)
    buyAsset(w, MERCH)
    // A season to settle – the row climbs toward a target far above the sticker, which is the ramp
    // and is in both arms – and then three years of the fame decaying with no new results at all.
    let worstSettled = 0
    let worstWeek = -1
    let fell = false
    let prev = ownedOf(w, MERCH)!.valueCents
    for (let i = 1; i <= 4 * WEEKS_PER_YEAR; i++) {
      w.week += 1
      revalueAssets(w)
      const now = ownedOf(w, MERCH)!.valueCents
      if (i > WEEKS_PER_YEAR) {
        const move = Math.abs((now - prev) / prev)
        if (move > worstSettled) {
          worstSettled = move
          worstWeek = i
        }
        if (now < prev) fell = true
      }
      prev = now
    }
    // ⚠ THE ARM CONTAINS THE THING IT IS PROVING: the brand really is fading over this walk, so a
    // «no jumps» reading is not the reading of a flat line.
    expect(fell, 'the fixture really is a fading brand').toBe(true)
    expect(worstSettled, `the worst settled week (w${worstWeek}) is a step, not a cliff`).toBeLessThan(0.02)
    // ⚠⚠⚠ AND THE DISCRIMINATOR, WHICH IS THE HALF OF THIS ARM WITH TEETH. A smoothly decaying fame
    // makes the OLD closed form fall smoothly too – wrongly, but without a visible cliff – so «no
    // jumps» alone cannot tell the two apart on this fixture, and the first draft of this arm stayed
    // GREEN under the revert. What separates them is WHERE THE ROW ENDS UP: the re-read drags the
    // value back toward what was PAID every week (a longer half-life keeps more of the purchase
    // price in the answer), while the walk keeps the ground it covered. So after four years of
    // fading the two arithmetics are far apart, and the walk is the higher of them.
    const row = ownedOf(w, MERCH)!
    const item = shopItem(MERCH)!
    const signals = brandSignalsOf(w)
    const derivedNow = Math.max(
      row.paidCents * ECONOMY.shop.businessValueFloorShare,
      brandGrossWorthCents(signals, item.earningsMultipleX!),
    )
    // The exact call the engine made before this item, on this world, at this week.
    const reRead = closedForm(row.paidCents, derivedNow, w.week - row.boughtWeek, signals.fame)
    expect(row.valueCents, 'the walked row is worth more than the re-read one').toBeGreaterThan(reRead)
    expect(row.valueCents, '...and it kept the ground it covered').toBeGreaterThan(row.paidCents)
    // ⚠ THE GAP IS LARGE ENOUGH TO BE A FINDING RATHER THAN A ROUNDING: the re-read hands back a
    // fifth of the row on this fixture, which is the money the owner watched disappear.
    expect((row.valueCents - reRead) / row.valueCents, 'and by a real share of it').toBeGreaterThan(0.05)
  })

  it('⭐⭐ no single week can move a brand by more than the blend, whatever the fame does', () => {
    // ⚠ A HOSTILE PATH: fame thrown between its extremes every week for four seasons. Under the old
    // closed form this is a row that jumps every time the pace changes; under the walk it is bounded
    // by construction, and that is the claim.
    const DERIVED = 2_000_000_00
    let value = PRICE
    let worst = 0
    for (let w = 1; w <= 208; w++) {
      const fame = w % 2 === 0 ? 60 : 3
      const blend = 1 - Math.pow(0.5, 1 / worthRampHalfLife(fame, R.medianFame))
      const prev = value
      value = step(value, DERIVED, fame)
      // ⚠⚠ THE BOUND IS A SHARE OF THE **GAP** AND NOT OF THE VALUE, which is the distinction the
      // first draft of this arm got wrong and the run corrected: a row at $250,000 walking toward
      // $2,000,000 carries a gap seven times its own size, so a blend of 0.17% of the gap is a move
      // of 1.17% of the row. The property that matters is unchanged and is what is asserted – the
      // week takes EXACTLY its blend of the gap, so it can never be the whole-span re-read the old
      // closed form performed.
      const gap = DERIVED - prev
      expect(value - prev, `w${w}: a week takes its blend of the gap and nothing else`).toBe(
        Math.round(DERIVED - gap * (1 - blend)) - prev,
      )
      // ...and the row never overshoots its target, in either direction.
      expect(value).toBeGreaterThanOrEqual(Math.min(prev, DERIVED))
      expect(value).toBeLessThanOrEqual(Math.max(prev, DERIVED))
      // ⚠⚠ THE WORST WEEK IS COUNTED FROM THE SECOND SEASON ON, AND THE EXCLUSION IS THE HONEST
      // HALF OF THIS ARM. A row bought at $250,000 with a target of $2,000,000 carries a gap seven
      // times its own size, so its FIRST weeks move several percent – measured 9.15% on this path –
      // and that is the ramp climbing, in both arms, exactly as round 38 #16 built it. The defect
      // this item fixed happened to a CONVERGED row at week 100, so that is the population the
      // bound is about.
      if (w > WEEKS_PER_YEAR) worst = Math.max(worst, Math.abs((value - prev) / prev))
    }
    expect(worst, 'the path really did move').toBeGreaterThan(0)
    // ⚠ AND NOT ONE SETTLED WEEK OF THAT HOSTILE PATH CAME NEAR THE DEFECT'S OWN 28%.
    expect(worst, 'no settled week on a fame see-saw looks anything like the old jump').toBeLessThan(0.02)
  })
})

// =================================================================================================
// §3 – WHAT THE ITEM DID **NOT** CHANGE
// =================================================================================================
describe('§3 the dip, the door and the loop are untouched', () => {
  it('⭐⭐⭐ a brand bought this week is worth exactly what was paid for it', () => {
    // ROUND 38 #16's own law, and the whole of the sell-and-rebuy fix: it is asserted through the
    // engine's own buy, not through the arithmetic.
    const w = shopper('r41-18-buy')
    buyAsset(w, MERCH)
    const row = ownedOf(w, MERCH)!
    expect(row.valueCents, 'the week it is bought').toBe(row.paidCents)
    expect(assetWorthCents(w, row, shopItem(MERCH)!), 'and the valuation agrees on the same week').toBe(row.paidCents)
  })

  it('⭐⭐ the dip after the buy is DESIGN and is still there – the row walks DOWN to a smaller target', () => {
    // A career nobody has heard of: the derived worth is the floor share of what was paid, so the
    // row must fall. His «упал в цене на вторую неделю» is this, and it is not a defect.
    const w = shopper('r41-18-dip')
    buyAsset(w, MERCH)
    const first = ownedOf(w, MERCH)!.valueCents
    w.week += 1
    revalueAssets(w)
    const second = ownedOf(w, MERCH)!.valueCents
    expect(second, 'the second week is lower, exactly as he saw').toBeLessThan(first)
    // ⚠ AND IT IS A WALK RATHER THAN A CLIFF – one week takes at most the blend, which is the half
    // of his report the item actually answers.
    expect((first - second) / first, 'but it is a step, not a drop').toBeLessThan(0.02)
    // ...and many weeks of it stay above the floor, which is Björn Borg's name (round 30 #9 §4).
    for (let i = 0; i < 52; i++) {
      w.week += 1
      revalueAssets(w)
    }
    expect(ownedOf(w, MERCH)!.valueCents).toBeGreaterThanOrEqual(
      Math.round(PRICE * ECONOMY.shop.businessValueFloorShare),
    )
  })
})

// =================================================================================================
// §4 – THE SAVE: NO MIGRATION, AND A ROW MID-HOLD KEEPS WALKING
// =================================================================================================
describe('§4 an old save keeps walking from where it was left', () => {
  it('⭐⭐⭐ a hand-written row mid-hold steps on from ITS OWN value, not from what was paid', () => {
    // ⚠⚠ THIS IS THE WHOLE MIGRATION QUESTION AND THE ANSWER IS «NONE OWED». Every save already
    // carries `valueCents` on every owned row – `revalueAssets` has written it since slice 1 – so a
    // career loaded mid-hold continues from the number it was saved with. A migration would have had
    // to invent a history for a row whose history is the number itself.
    const w = shopper('r41-18-save')
    buyAsset(w, MERCH)
    const row = ownedOf(w, MERCH)!
    // A row saved at an arbitrary point of its own walk, which is what a real save holds.
    row.valueCents = 1_000_000_00
    row.boughtWeek = w.week - 100
    const item = shopItem(MERCH)!
    const next = assetWorthCents(w, row, item)
    expect(next, 'the step starts at the stored value').not.toBe(row.paidCents)
    const derived = Math.max(row.paidCents * ECONOMY.shop.businessValueFloorShare, 0)
    // The step is between the stored value and this week's target, and never outside them.
    const lo = Math.min(row.valueCents, Math.round(derived))
    const hi = Math.max(row.valueCents, Math.round(derived))
    expect(next).toBeGreaterThanOrEqual(lo)
    expect(next).toBeLessThanOrEqual(hi)
    // ⚠ AND IT REALLY MOVED – a step of zero would satisfy the bounds above and prove nothing.
    expect(next).not.toBe(row.valueCents)
  })
})

// =================================================================================================
// §5 – THE BLAST RADIUS: ONE FAMILY MOVED AND THE REST OF THE SHELF DID NOT
// =================================================================================================
describe('§5 only the business family walks', () => {
  it('⭐⭐⭐ a house, a car and an academy stage are still closed-form, and running the revalue twice does not move them', () => {
    const w = shopper('r41-18-shelf')
    for (const id of ['house-first', 'car-good', 'academy-land']) buyAsset(w, id)
    w.week += 52
    revalueAssets(w)
    const once = ownedAssets(w).map((a) => ({ id: a.id, v: a.valueCents }))
    // ⚠⚠ THE IDEMPOTENCE GUARD, AND IT IS WHERE THE ITEM'S COST IS MADE VISIBLE. Every family this
    // item did not touch is still a function of (paid, basis, week): a second revalue in the same
    // week changes nothing at all. The brand is the exception, and it is deliberate – see
    // `revalueAssets`' own header, which carries the warning a reader adding a second caller needs.
    revalueAssets(w)
    for (const before of once) {
      const after = ownedAssets(w).find((a) => a.id === before.id)!
      expect(after.valueCents, `${before.id} is order-free`).toBe(before.v)
    }
  })

  it('⚠ ...and the brand is the one that is not, which is stated rather than discovered', () => {
    const w = shopper('r41-18-twice')
    buyAsset(w, MERCH)
    w.week += 10
    revalueAssets(w)
    const once = ownedOf(w, MERCH)!.valueCents
    revalueAssets(w)
    const twice = ownedOf(w, MERCH)!.valueCents
    // ⚠⚠ THE ARM EXISTS TO BE READ, NOT TO BE CELEBRATED: a second revalue in one week takes a
    // second step. The tick is the only caller (`phaseObligations.ts`), and this is the test that
    // tells whoever adds a second one what it will cost them.
    expect(twice, 'a second revalue takes a second step – the tick must stay the only caller').not.toBe(once)
  })
})
