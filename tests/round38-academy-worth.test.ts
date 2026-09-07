// ROUND 38 #8 – WHAT THE ACADEMY IS WORTH. docs/specs/academy-worth-2026-09.md.
//
// HIS OBSERVATION, 06.09: «Академия при этом стоит ровно на месте – и это не очень корректно, как
// мне кажется.» AND HIS RULING ON THE SHAPE, 07.09: «хорошо звучит» to option C, plus «а что насчёт
// стоимости и индексации этой стоимости с годами? Как с домами, например.»
//
// TWO INDEPENDENT HALVES, AND THIS FILE KEEPS THEM APART BECAUSE THEY CAN FAIL APART:
//
//   HALF ONE – THE DRIFT. `annualRateBps: 300` on the four `academy-*` rungs, the houses' own
//   number. No code was written for it: `assetValueCents` has indexed every rung by its rate since
//   slice 1 and the academy was the only family on the shelf carrying a literal zero.
//
//   HALF TWO – THE REPUTATION PREMIUM (option C). `worth = paid x drift x (1 + premiumPerRep x
//   (reputation − 1))`, in `assetWorthCents`' non-business branch, for `family === 'academy'` only.
//
// ⚠⚠ THE ONE PROPERTY THE WHOLE ITEM RESTS ON IS A FLOOR AND §3 BELOW IS IT: reputation starts at
// 1.0 and only ever rises, so the premium starts at EXACTLY zero and can only ADD. «A career that
// collapses cannot take back the land and the courts» – which is what makes the academy the thing
// worth moving money INTO near the end of a career, and is deliberately the opposite property from
// the merch brand, whose worth follows fame down.
//
// ⚠⚠ MUTATIONS, EACH APPLIED ALONE TO THE ENGINE AND WATCHED FAIL BEFORE THIS FILE WAS BELIEVED.
// ⚠ THE COUNTS ARE READ OFF THE RUNS AND NOT PREDICTED, and two of them were wrong when predicted
// (M1 was guessed at 9 and measures 5, M2 at 5 and measures 4) – which is the reason the rule is to
// run them. 12 tests in the file, control green at 12/12 before and after every arm:
//   M1 `annualRateBps: 300` back to 0 on all four rungs        → 5 red (both §1 arms, §2's real-
//      career and level arms, §4's whole-shelf table);
//   M2 `academyPremiumX` returning 1 unconditionally           → 4 red (§2's real-career and ramp
//      arms, §4's both) – §3's floor arms stay GREEN, which is the point of splitting them out: a
//      deleted premium does not break a floor, it only empties it;
//   M3 the family gate `item.family !== 'academy'` deleted     → 2 red (§4's negative claim about
//      the house and the car, and §5's both-directions arm);
//   M4 `Math.max(0, rep − 1)` → `(rep − 1)` (the clamp gone)   → 1 red, §3's hostile-band arm ONLY,
//      which is exactly the arm written to reach an otherwise unreachable guard;
//   M5 `premiumPerRep: 0.15` → `0`                             → 4 red (the same four as M2).
//
// ⚠⚠ AND THE WHOLE ITEM WAS REVERTED AT ONCE (rate -> 0 AND premium -> 0) AND MEASURED THROUGH THE
// SHIPPED PATH on the owner's own week-1115 save: `tools/r38-academy-worth.ts` reproduces the
// pre-item table to the cent – `academy-land` $2,000,000, `academy-courts` $3,000,000, the shelf
// total $12,390,369 – and five pins in four other files go red. A null arm that contained the
// constant without its reader is the failure mode CLAUDE.md names; this one contains both.
import { describe, it, expect } from 'vitest'
import {
  academyReputationOf,
  assetValueCents,
  assetWorthCents,
  buyAsset,
  createWorld,
  ownedAssets,
  revalueAssets,
  sellAsset,
  shopCatalogue,
  shopItem,
  shopView,
  type WorldState,
} from '../src/engine/world'
import { academyPremiumX } from '../src/engine/world/assets'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type SeasonHistoryEntry } from '../src/shared/protocol'

const A = ECONOMY.business.academy
const STAGES = ['academy-land', 'academy-courts', 'academy-building', 'academy-staff']

/** A fresh world parked at an adult week with money in it. Reputation is a fold over hand-plantable
 *  records, so nothing needs ticking to ask this file's questions. */
function still(seed: string, week = 400): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = week
  world.fundsCents = 40_000_000_00
  return world
}

/** One banked season ended at `endRank` on the professional table – `tests/round29p5-business.test.ts`'
 *  own fixture shape, the one `wrapSeason` writes and every fold reads. */
function seasonAt(index: number, endRank: number | undefined): SeasonHistoryEntry {
  return {
    seasonIndex: index,
    endRank: 40,
    points: 0,
    wins: 0,
    losses: 0,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0 },
      wta: endRank === undefined ? { points: 0, wins: 0, losses: 0 } : { endRank, points: 0, wins: 0, losses: 0 },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }
}

const ownedOf = (w: WorldState, id: string) => ownedAssets(w).find((a) => a.id === id)

/** Buy the stages in build order (`requiresId` chains them) and park the clock `weeks` later. */
function built(seed: string, stages: string[], weeks = 0, seasons: (number | undefined)[] = []): WorldState {
  const world = still(seed)
  world.seasonHistory = seasons.map((r, i) => seasonAt(i, r))
  for (const id of stages) buyAsset(world, id)
  world.week += weeks
  revalueAssets(world)
  return world
}

// =================================================================================================
// §1 – HALF ONE: THE DRIFT, WHICH IS «КАК С ДОМАМИ» AND IS ONE FIELD FOUR TIMES
// =================================================================================================
describe('§1 the drift – the academy indexes like a house', () => {
  it('⭐⭐⭐ all four stages carry the HOUSES own rate, and it is one rate rather than two', () => {
    const stages = shopCatalogue().filter((r) => r.family === 'academy')
    expect(stages.map((r) => r.id)).toEqual(STAGES)
    // ⚠⚠ READ OFF THE HOUSES RATHER THAN TYPED AS 300, which is what makes «как с домами» a claim
    // this test can lose. A future retune of the houses that forgot the academy reddens here.
    const houses = shopCatalogue().filter((r) => r.family === 'house')
    const houseRate = houses[0]!.annualRateBps
    expect(houses.every((h) => h.annualRateBps === houseRate), 'the houses agree among themselves').toBe(true)
    for (const s of stages) expect(s.annualRateBps, `${s.id} indexes like a house`).toBe(houseRate)
    // ⚠ ONE RATE AND NOT TWO – the spec's §2, refusing the land/building split while this family
    // carries no maintenance line to justify the losing half. All four are the SAME number, so a
    // quietly-diverging stage fails here rather than on a screen.
    expect(new Set(stages.map((s) => s.annualRateBps)).size, 'one rate across the family').toBe(1)
    // ⚠ AND IT IS POSITIVE, which is the mutation guard: at the old 0 every line above still passes
    // if the houses were zeroed too, and this one cannot.
    expect(houseRate).toBeGreaterThan(0)
  })

  it('⭐⭐ a held stage really gains, on the shipped writer, and the arithmetic is the shelfs own', () => {
    const w = built('r38-8-drift', ['academy-land'], 4 * WEEKS_PER_YEAR)
    const land = ownedOf(w, 'academy-land')!
    // ⚠ NO PREMIUM HERE – this career banked no season, so reputation is 1.0 by construction and
    // what is measured is the drift alone.
    expect(academyReputationOf(w)).toBe(1)
    expect(land.valueCents).toBe(assetValueCents(shopItem('academy-land')!, 2_000_000_00, 4 * WEEKS_PER_YEAR))
    expect(land.valueCents, 'four seasons of holding is four seasons of drift').toBeGreaterThan(2_000_000_00)
    // ⚠⚠ AND IT IS THE SAME ARITHMETIC A HOUSE GETS, TO THE CENT, ON THE SAME SPAN – «как с домами»
    // as a ratio rather than as a sentence. Same rate, same span, so the same multiple of the price.
    const house = shopItem('house-first')!
    const houseX = assetValueCents(house, 1_000_000_00, 4 * WEEKS_PER_YEAR) / 1_000_000_00
    expect(land.valueCents / 2_000_000_00).toBeCloseTo(houseX, 10)
  })
})

// =================================================================================================
// §2 – HALF TWO: THE REPUTATION PREMIUM, AT 1.0 AND AT A REAL CAREER'S FIGURE
// =================================================================================================
describe('§2 the premium – option C, and it starts at exactly zero', () => {
  it('⭐⭐⭐ at reputation 1.0 the premium is EXACTLY zero – worth and drift are the same cents', () => {
    const w = built('r38-8-zero', ['academy-land', 'academy-courts'], 3 * WEEKS_PER_YEAR)
    expect(academyReputationOf(w), 'a career with no banked season sits at the base').toBe(1)
    expect(academyPremiumX(w), 'so the multiplier is one, not approximately one').toBe(1)
    // ⚠⚠ «EXACTLY» IS A CLAIM ABOUT ROUNDING AND NOT A TURN OF PHRASE, which is why the premium
    // multiplies the number `assetValueCents` ALREADY ROUNDED rather than the fraction under it: the
    // two functions return the same integer, byte for byte, on a career that has won nothing.
    for (const owned of ownedAssets(w)) {
      const item = shopItem(owned.id)!
      const drift = assetValueCents(item, owned.paidCents, w.week - owned.boughtWeek)
      expect(assetWorthCents(w, owned, item), `${owned.id} carries no premium at all`).toBe(drift)
    }
  })

  it('⭐⭐⭐ at a REAL career`s reputation the premium is on the row, and it is the spec`s own formula', () => {
    // ⚠ THE LADDER IS THE OWNER'S OWN SHAPE – seasons ended inside the bands, which is what
    // `academyReputationOf` folds. Two top-10s and two top-25s: 1 + 0.6 + 0.6 + 0.35 + 0.35 = 2.90.
    const w = built('r38-8-earned', ['academy-land', 'academy-courts'], 3 * WEEKS_PER_YEAR, [8, 9, 20, 22])
    const rep = academyReputationOf(w)
    expect(rep, 'two top-10 and two top-25 seasons').toBeCloseTo(2.9, 10)
    expect(academyPremiumX(w)).toBeCloseTo(1 + A.premiumPerRep * (rep - 1), 12)
    for (const owned of ownedAssets(w)) {
      const item = shopItem(owned.id)!
      const drift = assetValueCents(item, owned.paidCents, w.week - owned.boughtWeek)
      expect(assetWorthCents(w, owned, item), `${owned.id} is priced at drift x premium`)
        .toBe(Math.round(drift * (1 + A.premiumPerRep * (rep - 1))))
      // ⚠ AND IT REALLY IS ABOVE THE DRIFT – the arm that fails when the premium is deleted.
      expect(assetWorthCents(w, owned, item)).toBeGreaterThan(drift)
    }
  })

  it('⭐⭐ the premium RISES with her seasons and with nothing else – the career pays for it', () => {
    const quiet = built('r38-8-ramp-a', ['academy-land'], 5 * WEEKS_PER_YEAR, [180, 190])
    const good = built('r38-8-ramp-b', ['academy-land'], 5 * WEEKS_PER_YEAR, [8, 9, 8])
    expect(academyReputationOf(good)).toBeGreaterThan(academyReputationOf(quiet))
    expect(ownedOf(good, 'academy-land')!.valueCents)
      .toBeGreaterThan(ownedOf(quiet, 'academy-land')!.valueCents)
    // ⚠⚠ AND IT IS A LEVEL, NOT A SECOND RATE – the property that keeps «assets never beat a career,
    // they only survive one» true of the dearest thing on the shelf. Held twice as long at the SAME
    // reputation, the row grows by the drift alone: the ratio of the two worths is the drift's
    // ratio, with the premium cancelling out of both sides.
    const later = built('r38-8-ramp-c', ['academy-land'], 10 * WEEKS_PER_YEAR, [8, 9, 8])
    const grew = ownedOf(later, 'academy-land')!.valueCents / ownedOf(good, 'academy-land')!.valueCents
    expect(grew).toBeCloseTo(Math.pow(1 + shopItem('academy-land')!.annualRateBps / 10_000, 5), 6)
  })
})

// =================================================================================================
// §3 – ⚠⚠ THE FLOOR. THE PAID PRICE TIMES THE DRIFT, AND THE WORTH MAY NEVER FALL UNDER IT.
// =================================================================================================
describe('§3 the floor – the cost is a floor and that is the whole of option C', () => {
  it('⭐⭐⭐ driven to its MINIMUM reputation the worth still never falls below paid x drift', () => {
    // ⚠ THE MINIMUM IS 1.0 AND IT IS REACHED THREE DIFFERENT WAYS, because «minimum» has to mean the
    // worst a real career can do rather than the one fixture that happens to be lowest: a career
    // that banked nothing, a career whose every season is UNRECORDED («not recorded» is not
    // «top-100»), and a career whose every season finished below the lowest rung of the ladder.
    const lowest = A.reputationBands[A.reputationBands.length - 1]!.maxEndRank
    const worlds: [string, WorldState][] = [
      ['no seasons at all', built('r38-8-floor-a', STAGES, 6 * WEEKS_PER_YEAR)],
      ['every season unrecorded', built('r38-8-floor-b', STAGES, 6 * WEEKS_PER_YEAR, [undefined, undefined, undefined])],
      ['every season below the ladder', built('r38-8-floor-c', STAGES, 6 * WEEKS_PER_YEAR, [lowest + 1, lowest + 50, 900])],
    ]
    for (const [why, w] of worlds) {
      expect(academyReputationOf(w), `${why}: this really is the floor of the fold`).toBe(1)
      for (const owned of ownedAssets(w)) {
        const item = shopItem(owned.id)!
        const floor = assetValueCents(item, owned.paidCents, w.week - owned.boughtWeek)
        expect(assetWorthCents(w, owned, item), `${why}: ${owned.id} is never under paid x drift`)
          .toBeGreaterThanOrEqual(floor)
        // ...and never under what was PAID either, which is the sentence he will read it as.
        expect(assetWorthCents(w, owned, item), `${why}: ${owned.id} is never under what was paid`)
          .toBeGreaterThanOrEqual(owned.paidCents)
      }
    }
  })

  it('⚠⚠ ...and a HOSTILE band cannot turn the premium into a discount – the clamp is live', () => {
    // ⚠⚠ THIS IS THE ARM THAT REACHES AN OTHERWISE UNREACHABLE GUARD, and it is written because the
    // guard is one edit away from mattering. `academyReputationOf` cannot answer below 1 today – it
    // starts at 1 and every band ADDS – so `Math.max(0, rep − 1)` looks like a defensive shrug. A
    // single negative `add` in `reputationBands` would turn a five-million-dollar row into a
    // PENALTY, silently, with nothing between the catalogue and the money. «Мы ни за что не
    // наказываем» is house law and this is where it is mechanical.
    const w = built('r38-8-clamp', ['academy-land'], 2 * WEEKS_PER_YEAR)
    const bands = A.reputationBands
    const hostile = [{ maxEndRank: 10_000, add: -0.9 }] as unknown as typeof A.reputationBands
    ;(A as { reputationBands: typeof A.reputationBands }).reputationBands = hostile
    try {
      const w2 = built('r38-8-clamp', ['academy-land'], 2 * WEEKS_PER_YEAR, [500, 600, 700])
      expect(academyReputationOf(w2), 'the fold really did go under the base').toBeLessThan(1)
      expect(academyPremiumX(w2), 'and the premium is held at one, never below it').toBe(1)
      const owned = ownedOf(w2, 'academy-land')!
      const item = shopItem('academy-land')!
      expect(assetWorthCents(w2, owned, item), 'so the floor holds even here')
        .toBe(assetValueCents(item, owned.paidCents, w2.week - owned.boughtWeek))
      expect(assetWorthCents(w2, owned, item)).toBeGreaterThan(owned.paidCents)
    } finally {
      ;(A as { reputationBands: typeof A.reputationBands }).reputationBands = bands
    }
    // ⚠ AND THE CONSTANT REALLY WENT BACK, so no later file inherits a hostile catalogue.
    expect(A.reputationBands).toBe(bands)
    expect(academyPremiumX(w)).toBe(1)
  })

  it('⭐ the SALE hands the floor back too – a collapsed career keeps the land and the courts', () => {
    // The floor is only a promise if the money can actually come out at it. Buy, hold, let the
    // career bank nothing at all, sell: the family gets back MORE than it put in.
    const w = built('r38-8-sale', ['academy-land', 'academy-courts'], 6 * WEEKS_PER_YEAR)
    const before = w.fundsCents
    const held = ownedOf(w, 'academy-land')!.valueCents + ownedOf(w, 'academy-courts')!.valueCents
    sellAsset(w, 'academy-courts')
    sellAsset(w, 'academy-land')
    expect(w.fundsCents - before, 'the sale is whole and at the row figure').toBe(held)
    expect(w.fundsCents - before, 'and it is more than the five million that went in')
      .toBeGreaterThan(5_000_000_00)
  })
})

// =================================================================================================
// §4 – THE WHOLE SHELF: THE TWO ROWS MOVE AND NOTHING ELSE DOES
// =================================================================================================
describe('§4 the rest of the shelf – §4 step 1`s NEGATIVE claim', () => {
  it('⭐⭐⭐ only the academy rows read a premium; every other family is untouched arithmetic', () => {
    const w = still('r38-8-shelf')
    w.seasonHistory = [8, 9, 20].map((r, i) => seasonAt(i, r))
    for (const id of ['house-first', 'car-good', 'academy-land', 'academy-courts']) buyAsset(w, id)
    w.week += 5 * WEEKS_PER_YEAR
    revalueAssets(w)
    expect(academyPremiumX(w), 'the premium really is switched on for this world').toBeGreaterThan(1)
    for (const owned of ownedAssets(w)) {
      const item = shopItem(owned.id)!
      const drift = assetValueCents(item, owned.paidCents, w.week - owned.boughtWeek)
      if (item.family === 'academy') {
        expect(owned.valueCents, `${owned.id} carries the premium`).toBeGreaterThan(drift)
      } else {
        // ⚠⚠ THE NEGATIVE CLAIM, ON THE SHIPPED WRITER: a house and a car are the SAME cents they
        // were before this item existed – `paid x (1+r)^years`, with nothing multiplied on top.
        expect(owned.valueCents, `${owned.id} is drift and nothing else`).toBe(drift)
      }
    }
  })

  it('⭐⭐ and the shop VIEW says the same numbers the engine does – no second arithmetic on screen', () => {
    const w = still('r38-8-view')
    w.seasonHistory = [8, 9, 20].map((r, i) => seasonAt(i, r))
    for (const id of ['academy-land', 'academy-courts']) buyAsset(w, id)
    w.week += 4 * WEEKS_PER_YEAR
    revalueAssets(w)
    const rows = shopView(w).rows.filter((r) => r.family === 'academy' && r.valueCents !== null)
    expect(rows.length).toBe(2)
    for (const row of rows) {
      const owned = ownedOf(w, row.id)!
      expect(row.valueCents, `${row.id} on screen is the engine's own figure`)
        .toBe(assetWorthCents(w, owned, shopItem(row.id)!))
      // ⚠ AND THE CARD SHOWS A GAIN, which is «стоит ровно на месте» answered on the surface he
      // was looking at when he said it.
      expect(row.changeCents, `${row.id} shows a gain on the card`).toBeGreaterThan(0)
    }
  })
})

// =================================================================================================
// §5 – THE FAMILY GATE, IN BOTH DIRECTIONS
// =================================================================================================
describe('§5 the family gate – no other rung can be priced off a reputation it does not have', () => {
  it('⚠⚠ the premium is applied to `academy` and refused to everything else, both directions', () => {
    const w = still('r38-8-gate')
    w.seasonHistory = [3, 4, 5].map((r, i) => seasonAt(i, r))
    const premium = academyPremiumX(w)
    expect(premium, 'a reputable career, so the gate has something to refuse').toBeGreaterThan(1)
    // ⚠ THE SAME PRICE, THE SAME SPAN, THE SAME RATE, AND ONLY THE FAMILY DIFFERENT – which is what
    // isolates the gate from the drift. `house-first` and an academy stage both carry +300 bps.
    const span = 3 * WEEKS_PER_YEAR
    const later = { ...w, week: w.week + span } as WorldState
    const house = shopItem('house-first')!
    const land = shopItem('academy-land')!
    expect(house.annualRateBps, 'the two rungs really do share a rate').toBe(land.annualRateBps)
    const asHouse = { id: house.id, boughtWeek: w.week, paidCents: 1_000_000_00, valueCents: 1_000_000_00 }
    const asLand = { id: land.id, boughtWeek: w.week, paidCents: 1_000_000_00, valueCents: 1_000_000_00 }
    const flat = assetValueCents(house, 1_000_000_00, span)
    expect(assetWorthCents(later, asHouse, house), 'a house gets the drift and no premium').toBe(flat)
    expect(assetWorthCents(later, asLand, land), 'the academy stage gets both')
      .toBe(Math.round(flat * premium))
    expect(assetWorthCents(later, asLand, land)).toBeGreaterThan(assetWorthCents(later, asHouse, house))
  })

  it('⚠ and the BUSINESS branch still runs first – a brand is not priced off the academy dial', () => {
    // The merch rung carries `earningsMultipleX`, so it returns before the academy branch is ever
    // reached. This is the guard `world/assets.ts` already documents, asserted from the other side.
    const w = still('r38-8-gate-biz')
    w.seasonHistory = [3, 4, 5].map((r, i) => seasonAt(i, r))
    buyAsset(w, 'merch-brand')
    const owned = ownedOf(w, 'merch-brand')!
    const item = shopItem('merch-brand')!
    expect(item.family, 'it is not an academy rung to begin with').not.toBe('academy')
    // ⚠ A BUSINESS IS FLOORED AT A SHARE OF WHAT WAS PAID, never at paid x drift x premium – so the
    // two valuations are genuinely different arithmetic and this asserts the business one.
    expect(assetWorthCents(w, owned, item)).toBe(
      Math.max(Math.round(owned.paidCents * ECONOMY.shop.businessValueFloorShare), owned.valueCents),
    )
  })
})
