// ⭐⭐⭐ ROUND 32 #4 (BRAND INERTIA) + #5 (COLLABORATIONS AS THE EARLY LEVER ON FAME).
//
// THE OWNER, #4: «А еще интересно, что будет происходить с годами падения в таблице (как у нее
// сейчас) – известность тоже будет падать и стоимость бренда, соответственно?» – and, on being shown
// the answer: «Инерция бренда – звучит интересно, давай попробуем».
//
// THE OWNER, #5: «карьера топ-20 без титулов … Мне кажется здесь как раз на раннем этапе
// коллаборации нам должны помочь, они станут хорошим рычагом роста известности и стоимости бренда
// как раз» – and «и это надо внедрять да».
//
// ⚠⚠ THE MEASUREMENT THAT FORCED #4, off his own week-933 career projected five years with nothing
// won: $831,382 -> $9,098. A 99% capital loss, arithmetic rather than tuning – fame halves every 104
// weeks, income goes as fame², and since round 32 #3 the multiple rises with fame too, so worth goes
// as fame³ and falls eightfold every two years.
//
// ⭐⭐⭐ AND THE 31.08 REVISION, WHICH IS WHY SEVERAL ARMS BELOW POINT SOMEWHERE ELSE THAN THEY DID.
// He read the shipped measurement and stopped it: «меня смущает вот это: На пятом году бренд стоит
// $166 060 при годовом доходе $1 352». #4 had floored the WORTH and left the INCOME a bare function
// of fame, so a valuation held while its earnings evaporated under it. The memory moved into the
// REVENUE – `brandReachOf` = `max(fame, retention x strength)` – the separate worth floor
// (`brandBuiltSignals`) was deleted, and `worth / a year of income` is the multiple again.
//
// ⚠ WHAT THIS FILE HOLDS:
//   §1  the kernel's two ends – fresh is 1, ancient is `floorShare`, and it never goes below;
//   §2  ⭐⭐⭐ THE TOP DOES NOT MOVE. Strength equals fame at the cap and at every running peak and
//       `retention < 1`, so the best career in the game prices exactly as it did – both its WORTH
//       and, since the revision, its INCOME – by construction rather than by a clamp;
//   §3  ⭐⭐ THE INCOME IS WHAT STOPS COLLAPSING, and the ratio it is priced at stays in band –
//       five years with nothing won, on his shape;
//   §4  the floor is a share of HER OWN peak – personal, never a global mark;
//   §5  ⭐⭐ THE SAVE. The v69 pin, «no existing career jumps», idempotence, and every older schema;
//   §6  ⭐⭐ #5: a delivered shoot ADDS to the floor, by the deal's band, on a SHORTER half-life;
//   §7  ...and the existing multiplier STAYS, so a champion who also sells feels both;
//   §8  a career with no results and no deals gains nothing from either feature;
//   §9  ⭐⭐⭐ NOTHING WRITES THE PIN BUT THE MIGRATION – the frozen-career-hash precondition, asserted.
//
// ⚠⚠ HIS SAVES ARE READ-ONLY AND NOTHING HERE COMES OUT OF ONE. §3 builds a career with the same
// SHAPE as the row he reported – fourteen professional seasons, one inside the top 20, nineteen
// professional finals lost, fame in the low twenties – out of this file's own fixtures. The save was
// read once, on the command line, to produce the controls in docs/specs/brand-inertia-2026-08.md §2;
// no byte of it is in the repo.
//
// ⚠ MUTATION-VERIFIED – the log is at the foot of this file.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  brandGrossWorthCents,
  brandMultipleX,
  brandReachOf,
  brandSignalsOf,
  brandStrengthAt,
  brandWeeklyGrossCents,
  closeTournament,
  completedShootsByBand,
  createWorld,
  fameAt,
  fameEventWeeks,
  fameFloorOf,
  fameShootMultOf,
  SAVE_SCHEMA_VERSION,
  shootFloorDecayAt,
  shopItem,
  skipTournament,
  strengthDecayAt,
  tickWeek,
  type BrandSignals,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { adBandOfTerms } from '../src/engine/offers'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { AdCategory, AdOfferTerms } from '../src/shared/protocol'

const MERCH = 'merch-brand'
const BASE_X = shopItem(MERCH)!.earningsMultipleX!
const CAP = ECONOMY.fame.cap
const S = ECONOMY.business.merch.strength
const SAVES_DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** A world twelve weeks in, professional, solvent – `round32-brand-multiple.test.ts`' own `shopper`. */
function shopper(seed: string, weeks = 12): WorldState {
  const world = createWorld(seed)
  world.bestFinishByTier.wta250 = 3
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = 5_000_000_00
  return world
}

function parkAt(world: WorldState, week: number): WorldState {
  world.week = week
  return world
}

function proSeasons(world: WorldState, n: number, endRank: number, wins: number, losses: number): void {
  world.seasonHistory ??= []
  for (let i = 0; i < n; i++) {
    world.seasonHistory.push({
      seasonIndex: world.seasonHistory.length,
      endRank,
      points: 0,
      wins,
      losses,
      byTrack: {
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { points: 0, wins: 0, losses: 0 },
        wta: { endRank, points: 0, wins, losses },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    })
  }
}

function winTitles(world: WorldState, tier: TierId, weeks: number[]): void {
  world.trophiesByTier[tier] ??= { titles: [], finals: [] }
  world.trophiesByTier[tier]!.titles.push(...weeks)
}

function loseFinals(world: WorldState, tier: TierId, weeks: number[]): void {
  world.trophiesByTier[tier] ??= { titles: [], finals: [] }
  world.trophiesByTier[tier]!.finals.push(...weeks)
}

/** a SIGNED advertising letter at one band of the gradient, with its shoot weeks already lived. The
 *  cheque is the catalogue's own cell, which is what `adBandOfTerms` reads the band back off.
 *
 *  ⚠⚠ RE-AIMED FROM WATCHES TO CLOTHING BY ROUND 34 #7/#11/#12/#13 (03.09), AND NOT WEAKENED. The
 *  owner's approved foot of the ladder closed WATCHES at the new ≤400 band (`null`) and set its
 *  ≤200 and ≤100 cells to the same $200,000, so watches can no longer stand for «one category
 *  across every band» and its cheque no longer identifies its band. CLOTHING is open at all five
 *  bands and its five cells are all distinct, which is exactly the property this fixture needs; the
 *  arms below are unchanged in what they claim. */
function signDeal(world: WorldState, id: string, band: number, shootWeeks: number[]): void {
  world.offers ??= []
  world.offers.push({
    id,
    kind: 'ad',
    week: 1,
    deadlineWeek: 6,
    state: 'signed',
    terms: {
      brand: `House ${id}`,
      category: 'clothing',
      cashCents: ECONOMY.advertising.categories.clothing.feeCentsByBand[band]!,
      termWeeks: world.week,
      shootCount: 2,
      shootWeeks,
    } as AdOfferTerms,
  })
}

/** the pre-wave worth, THROUGH THE SHIPPED FUNCTION. Since the 31.08 revision the whole of #4
 *  reaches the pricing through `brandReachOf` = `max(fame, retention x strength)`; hand it a signal
 *  set whose strength IS its fame and – because `retention < 1` – the max resolves to `fame`, so
 *  `brandGrossWorthCents` reduces to the expression it had before this wave, term for term. Nothing
 *  here can drift from the engine. */
const flatWorth = (s: BrandSignals): number => brandGrossWorthCents({ ...s, strength: s.fame }, BASE_X)

/** ...and the same identity for the INCOME, which the revision moved onto the reach as well. */
const flatWeekly = (s: BrandSignals): number => brandWeeklyGrossCents({ ...s, strength: s.fame })

describe('round 32 #4 §1 – the kernel: a years-long fade with a floor', () => {
  it('⭐ fresh is 1, and the fade is a half-life measured in YEARS rather than in weeks', () => {
    expect(strengthDecayAt(0), 'today is worth all of itself').toBe(1)
    expect(strengthDecayAt(S.halfLifeWeeks), 'half at the half-life').toBeCloseTo(0.5, 10)
    expect(S.halfLifeWeeks / WEEKS_PER_YEAR, 'and the half-life is in years, which is his ruling')
      .toBeGreaterThanOrEqual(2)
    // ⚠⚠ AND IT IS SLOWER THAN FAME'S, WHICH IS THE WHOLE POINT OF A SECOND STOCK. Equal half-lives
    // would make strength fame wearing a different name and the split would collapse.
    expect(S.halfLifeWeeks).toBeGreaterThan(ECONOMY.fame.halfLifeWeeks)
  })

  it('⭐⭐ ...and it never falls below `floorShare`, however long the silence runs', () => {
    for (const years of [10, 25, 100]) {
      expect(strengthDecayAt(years * WEEKS_PER_YEAR), `${years} years on`).toBe(S.floorShare)
    }
    expect(S.floorShare, 'a share, so the floor is personal').toBeGreaterThan(0)
    expect(S.floorShare, '...and a share of something, so it cannot exceed the peak').toBeLessThan(1)
    // an event in the future has not happened – `decayAt`'s own rule, kept identical.
    expect(strengthDecayAt(-5)).toBe(0)
  })
})

describe('round 32 #4 §2 – ⭐⭐⭐ THE TOP OF THE SHELF DOES NOT MOVE', () => {
  it('⭐⭐⭐ a career at the fame cap prices exactly as it did before this wave', () => {
    // ⚠⚠ THE OWNER'S STANDING RULING THAT BOUNDS THIS WHOLE LAYER: «вроде бы как раз спонсорские
    // коллаборации со спортсменами дают и не такое, кратно большее.» The ceiling may not be cut, and
    // it may not be RAISED either – a stock that read above the cap would lift it.
    //
    // ⭐ AND THE REASON IS ARITHMETIC, NOT A CLAMP: every candidate the stock maximises over is a past
    // fame (≤ cap) times a kernel (≤ 1), so strength ≤ cap; and the candidate at the week itself is
    // fame × 1, so strength ≥ fame. At fame = cap the two bounds meet.
    const careers: [string, Partial<BrandSignals>][] = [
      ['nothing at all', {}],
      ['his own shape', { proSeasons: 14, topSeasons: 1, finalsLost: 19, winRate: 0.682, roomSize: 4_743 }],
      ['a reign', { proSeasons: 12, topSeasons: 8, finalsLost: 12, winRate: 0.82, roomSize: 12_000 }],
      ['past every cap', { proSeasons: 40, topSeasons: 30, finalsLost: 60, winRate: 1, roomSize: 30_000 }],
    ]
    for (const [label, over] of careers) {
      const s: BrandSignals = {
        fame: CAP,
        strength: CAP,
        proSeasons: 0,
        topSeasons: 0,
        finalsLost: 0,
        roomSize: 0,
        winRate: 0,
        // ⚠ ROUND 34 #17 ADDED THIS SIGNAL. These are hypothetical careers holding no live shelf, so
        // the contract term is 0 and every pre-wave claim below still reads the pre-wave arithmetic.
        contractFame: 0,
        ...over,
      }
      expect(brandGrossWorthCents(s, BASE_X), `${label}: the pre-wave worth, to the cent`).toBe(flatWorth(s))
    }
  })

  it('⭐⭐⭐ and a real career at the cap reads strength = fame, so the identity above is reachable', () => {
    // ⚠ ASKED OF A WORLD AND NOT OF A HAND-BUILT SIGNAL SET, because §2's first arm proves the
    // ARITHMETIC and this one proves the STOCK actually lands there. A career carrying enough Slams to
    // sit on the cap has a strength pinned to the cap in the same week.
    const w = parkAt(shopper('r32-4-cap'), 6 * WEEKS_PER_YEAR)
    winTitles(w, 'slam', [w.week - 1, w.week - 8, w.week - 20, w.week - 40, w.week - 60, w.week - 80])
    proSeasons(w, 6, 1, 60, 5)
    expect(fameAt(w, w.week), 'she is at the cap').toBe(CAP)
    expect(brandStrengthAt(w, w.week), '...and so is the stock').toBe(CAP)
    const s = brandSignalsOf(w, w.week)
    expect(brandGrossWorthCents(s, BASE_X), 'so the worth is untouched').toBe(flatWorth(s))
  })

  it('⭐⭐ at a career\'s own running PEAK the stock equals fame, so peak worth is untouched too', () => {
    // The candidate at t = week is `fame(week) × 1`; nothing older can beat it while fame is at its
    // maximum, because every older candidate is a SMALLER fame times a kernel ≤ 1.
    const w = parkAt(shopper('r32-4-peak'), 4 * WEEKS_PER_YEAR)
    winTitles(w, 'wta1000', [w.week - 1])
    winTitles(w, 'wta500', [w.week - 60, w.week - 120])
    proSeasons(w, 4, 6, 40, 12)
    expect(brandStrengthAt(w, w.week), 'her best week is her best week').toBeCloseTo(fameAt(w, w.week), 9)
    const s = brandSignalsOf(w, w.week)
    expect(brandGrossWorthCents(s, BASE_X)).toBe(flatWorth(s))
  })

  it('⭐⭐⭐ the REACH is fame wherever fame is at its own maximum – `retention < 1` is the proof', () => {
    // ⚠⚠ THE 31.08 REVISION MOVED THE MEMORY INTO THE INCOME, so «the top does not move» is now a
    // claim about `brandReachOf` and not only about the worth. It holds for the same reason and by
    // the same two lines: `brandStrengthAt` pins strength to fame at the cap and at every running
    // peak, and `retention` is strictly below 1 – so `retention x strength < fame` exactly where the
    // best careers live and the max resolves to fame. If `retention` ever reaches 1 this arm reddens,
    // which is what makes the constant's own bound load-bearing rather than decorative.
    expect(ECONOMY.business.merch.strength.retention, 'strictly below 1, or the top moves').toBeLessThan(1)
    expect(ECONOMY.business.merch.strength.retention, '...and a real share of the stock').toBeGreaterThan(0)
    const atCap: BrandSignals = {
      fame: CAP, strength: CAP, proSeasons: 14, topSeasons: 8, finalsLost: 19, roomSize: 4_743, winRate: 0.7,
      contractFame: 0, // ⚠ round 34 #17: no live shelf, so the reach at the cap is the pre-wave one
    }
    expect(brandReachOf(atCap), 'at the cap the reach IS the cap').toBe(CAP)
    expect(brandWeeklyGrossCents(atCap), '...so the INCOME at the top is the pre-wave one, to the cent')
      .toBe(flatWeekly(atCap))

    // ...and on a real career, at every week fame is at its own running maximum.
    const w = shopper('r32-4-reach-peak')
    winTitles(w, 'wta1000', [30, 90, 150])
    winTitles(w, 'wta500', [60, 120])
    proSeasons(w, 4, 6, 40, 12)
    let best = -1
    let checked = 0
    for (let week = 0; week <= 6 * WEEKS_PER_YEAR; week++) {
      const f = fameAt(w, week)
      if (f <= best || f <= 0) continue
      best = f
      checked++
      const s = brandSignalsOf(w, week)
      expect(brandReachOf(s), `week ${week} is a running peak`).toBeCloseTo(s.fame, 9)
      expect(brandWeeklyGrossCents(s), `week ${week}: the income is untouched there`).toBe(flatWeekly(s))
    }
    expect(checked, 'and the sweep really found running peaks to ask about').toBeGreaterThan(3)
  })

  it('⚠ strength is NEVER below fame, on every week of a real career – so nobody loses money', () => {
    const w = shopper('r32-4-monotone')
    winTitles(w, 'wta500', [40, 90, 150])
    winTitles(w, 'wta250', [20, 60, 110, 200])
    loseFinals(w, 'slam', [180])
    proSeasons(w, 5, 9, 38, 14)
    signDeal(w, 'a', 2, [55, 108, 160, 212])
    for (let week = 0; week <= 8 * WEEKS_PER_YEAR; week += 7) {
      expect(brandStrengthAt(w, week), `week ${week}`).toBeGreaterThanOrEqual(fameAt(w, week) - 1e-9)
      expect(brandStrengthAt(w, week), `week ${week} is inside the scale`).toBeLessThanOrEqual(CAP)
    }
  })
})

describe('round 32 #4 §3 – ⭐⭐ THE ASSET HOLDS WHILE THE INCOME BREATHES', () => {
  /** his w933 SHAPE, mirrored out of this file's own fixtures – never derived from his save. */
  function hisShape(): WorldState {
    const w = parkAt(shopper('r32-4-his-shape'), 14 * WEEKS_PER_YEAR)
    proSeasons(w, 13, 40, 30, 14)
    proSeasons(w, 1, 15, 34, 12)
    winTitles(w, 'wta250', [w.week - 30, w.week - 90, w.week - 150])
    winTitles(w, 'wta500', [w.week - 200])
    loseFinals(w, 'wta250', Array.from({ length: 19 }, (_, i) => w.week - 20 - i * 17))
    return w
  }

  it('⭐⭐⭐ five years with nothing new won: the INCOME is what stops collapsing', () => {
    // ⚠⚠ THIS ARM IS AIMED WHERE THE 31.08 REVISION AIMED IT, and the claim it USED to make is
    // written out rather than deleted. It asserted «the worth falls FAR less than the income does» –
    // which was true of what #4 shipped and was exactly the defect: a valuation floored while its
    // earnings evaporated under it. THE OWNER: «меня смущает вот это: На пятом году бренд стоит
    // $166 060 при годовом доходе $1 352». The memory is now in the REVENUE, so what has to hold is
    // the income, and the worth follows it as a multiple.
    const w = hisShape()
    const now = brandSignalsOf(w, w.week)
    const later = brandSignalsOf(w, w.week + 5 * WEEKS_PER_YEAR)
    const incomeFall = 1 - brandWeeklyGrossCents(later) / brandWeeklyGrossCents(now)
    const bareFall = 1 - flatWeekly(later) / flatWeekly(now)
    const wornFall = 1 - flatWorth(later) / flatWorth(now)
    const heldFall = 1 - brandGrossWorthCents(later, BASE_X) / brandGrossWorthCents(now, BASE_X)

    // ⭐⭐ THE FEATURE: five years of silence used to take all but a hundredth of the revenue.
    expect(bareFall, 'the pre-wave income all but disappears').toBeGreaterThan(0.95)
    expect(incomeFall, 'and with the floor it does not').toBeLessThan(bareFall - 0.05)
    // ⭐⭐⭐ AND THE WORTH NOW FALLS WITH IT rather than floating free of it – «of the same ORDER as
    // the fall in income» is the acceptance, and this is that sentence as arithmetic. The pre-wave
    // worth fell HARDER than its own income (fame³ against fame²) and it still does; what changed is
    // that both numbers are now much smaller.
    expect(wornFall, 'the pre-wave worth fell at least as hard as the pre-wave income').toBeGreaterThan(bareFall)
    expect(heldFall, 'the held worth is of the same order as its own income').toBeLessThan(incomeFall + 0.1)
    expect(heldFall, '...and far shallower than the pre-wave collapse').toBeLessThan(wornFall - 0.05)
  })

  it('⭐⭐⭐ worth / a year of income IS the multiple, at EVERY week of the five years', () => {
    // ⚠⚠ THE HEADLINE ACCEPTANCE OF THE REVISION, and it holds BY CONSTRUCTION rather than by tuning:
    // with the separate worth floor deleted, `brandGrossWorthCents` is `income x 52 x multiple` and
    // nothing stands between the two, so the ratio is bounded by the multiple's own band for every
    // career at every week. Round 30 #9's claim, which #4 had to record as overturned, is restored.
    const V = ECONOMY.business.merch.value
    const w = hisShape()
    for (let offset = 0; offset <= 5 * WEEKS_PER_YEAR; offset += 4) {
      const s = brandSignalsOf(w, w.week + offset)
      const annual = brandWeeklyGrossCents(s) * WEEKS_PER_YEAR
      if (annual <= 0) continue
      const ratio = brandGrossWorthCents(s, BASE_X) / annual
      expect(ratio, `+${offset}w: the ratio IS the multiple`).toBeCloseTo(brandMultipleX(s, BASE_X), 4)
      expect(ratio, `+${offset}w: inside the multiple's own band`).toBeGreaterThanOrEqual(V.unknownX - 1e-6)
      expect(ratio, `+${offset}w: inside the multiple's own band`).toBeLessThanOrEqual(V.maxX + 1e-6)
    }
  })

  it('⭐⭐⭐ BOTH HALVES OF THE WORTH READ ONE CLOCK – same reach, same income AND same multiple', () => {
    // ⚠⚠ THE ARM «the ratio IS the multiple» CANNOT CATCH THIS ON ITS OWN, which is why this one
    // exists: it compares the ratio against `brandMultipleX` itself, so a multiple that quietly went
    // back to reading raw fame would keep that identity and pass. Measured – the mutation was run and
    // came back green before this arm was written.
    //
    // ⭐ THE CLAIM: a business is as big as the audience it reaches, so the SIZE term and the REVENUE
    // term must be asked about the same audience. Two careers with an identical reach built from
    // different halves – one at her peak, one living off the stock – price identically.
    const R = ECONOMY.business.merch.strength.retention
    const record = { proSeasons: 8, topSeasons: 3, finalsLost: 9, roomSize: 4_000, winRate: 0.7 }
    const loud: BrandSignals = { fame: 10, strength: 10, contractFame: 0, ...record }
    const remembered: BrandSignals = { fame: 5, strength: 10 / R, contractFame: 0, ...record }
    expect(brandReachOf(loud), 'the two reaches are the same number').toBeCloseTo(brandReachOf(remembered), 9)
    expect(brandWeeklyGrossCents(remembered), 'so the income is the same').toBe(brandWeeklyGrossCents(loud))
    expect(brandMultipleX(remembered, BASE_X), '...and so is the multiple').toBeCloseTo(brandMultipleX(loud, BASE_X), 9)
    expect(brandGrossWorthCents(remembered, BASE_X), '...and therefore the worth, to the cent')
      .toBe(brandGrossWorthCents(loud, BASE_X))
    // ⚠ AND THE FIXTURE IS NOT VACUOUS: the two careers really do differ in this week's attention.
    expect(remembered.fame).toBeLessThan(loud.fame / 1.5)
  })

  it('⭐⭐ the INCOME carries the memory now, and that is the whole of the revision', () => {
    // ⚠ THE ARM THIS REPLACED SAID «the INCOME is untouched by #4 – it still reads fame, week by
    // week», and it was the defect stated as a guarantee. It now reads the REACH, and the direction
    // is asserted so a revert cannot pass quietly.
    const w = hisShape()
    // ⚠ THE FLOOR DOES NOT BIND THE MOMENT THE DECLINE STARTS, AND THAT IS THE DESIGN RATHER THAN A
    // SHORTFALL: `retention < 1`, so it takes hold only once fame has fallen to `retention` of the
    // stock. A year in it has not; by two it has. Both halves are asserted so a retention pushed to
    // 1 – which would move the top of the shelf – reddens the arm above instead of passing here.
    const early = brandSignalsOf(w, w.week + WEEKS_PER_YEAR)
    expect(early.strength, 'a year in the stock is already above fame').toBeGreaterThan(early.fame)
    expect(brandWeeklyGrossCents(early), '...but the floor has not taken hold yet').toBe(flatWeekly(early))
    for (const offset of [2 * WEEKS_PER_YEAR, 3 * WEEKS_PER_YEAR, 5 * WEEKS_PER_YEAR]) {
      const s = brandSignalsOf(w, w.week + offset)
      expect(s.strength, `+${offset}w: the stock has genuinely diverged from fame`).toBeGreaterThan(s.fame)
      expect(brandReachOf(s), `+${offset}w: ...so the reach is above this week's noise`).toBeGreaterThan(s.fame)
      expect(brandWeeklyGrossCents(s), `+${offset}w: and the income is above the bare one`)
        .toBeGreaterThan(flatWeekly(s))
    }
  })
})

describe('round 32 #4 §4 – ⚠ the floor is a share of HER OWN peak, never a global mark', () => {
  it('⭐⭐⭐ a big career never prices at the minimum; a small one still can', () => {
    // HIS RULING, both halves: «плюс пол в доле от пика – чтобы карьера, которая реально была
    // большой, никогда не оценивалась по минимуму». A share, so it is personal.
    const big = shopper('r32-4-big')
    winTitles(big, 'slam', [100, 160])
    winTitles(big, 'wta1000', [80, 140, 200])
    proSeasons(big, 4, 2, 55, 8)
    const small = shopper('r32-4-small')
    winTitles(small, 'w75', [100])
    proSeasons(small, 4, 120, 20, 22)

    const far = 40 * WEEKS_PER_YEAR
    const bigPeak = Math.max(...fameEventWeeks(big).map((t) => fameAt(big, t)))
    const smallPeak = Math.max(...fameEventWeeks(small).map((t) => fameAt(small, t)))
    expect(brandStrengthAt(big, far), 'the big career lands on ITS OWN floor').toBeCloseTo(bigPeak * S.floorShare, 6)
    expect(brandStrengthAt(small, far), '...and the small one on its own, which is a much smaller number')
      .toBeCloseTo(smallPeak * S.floorShare, 6)
    expect(brandStrengthAt(big, far), 'a big career never prices where a small one does')
      .toBeGreaterThan(brandStrengthAt(small, far) * 5)
    // ⚠ AND FAME ITSELF IS ESSENTIALLY GONE BY THEN for both – which is the whole reason the floor is
    // the thing being asserted. The stock remembers what the attention has forgotten.
    expect(fameAt(big, far)).toBeLessThan(bigPeak * 0.01)
  })

  it('⚠ a career that built nothing has a peak of nothing and a floor of nothing', () => {
    const nobody = shopper('r32-4-nobody')
    expect(fameAt(nobody, nobody.week)).toBe(0)
    expect(brandStrengthAt(nobody, nobody.week), 'no stock at all').toBe(0)
    expect(brandStrengthAt(nobody, 30 * WEEKS_PER_YEAR), '...and none thirty years later either').toBe(0)
  })
})

describe('round 32 #4 §5 – ⭐⭐ THE SAVE, which is his binding constraint', () => {
  it('⭐⭐⭐ the v69 pin makes an existing career read the SAME brand value after the update', () => {
    // «главное обратная совместимость чтобы работала». A stock derived from a fifteen-season history
    // would hand a live career a number it has never seen; the pin is what stops that, and this arm
    // is the difference between the two.
    // ⚠ AND SHE IS PAST HER PEAK, which is the only state where the question has teeth – his own
    // career is thirty-one and three seasons out from its best. A career sitting ON its peak reads the
    // same number with or without a pin, so it could not tell a working pin from a missing one.
    const played = parkAt(shopper('r32-4-pinned'), 13 * WEEKS_PER_YEAR)
    winTitles(played, 'wta1000', [120, 200, 280])
    winTitles(played, 'wta500', [80, 160, 240, 320])
    proSeasons(played, 10, 8, 40, 12)
    const fameNow = fameAt(played, played.week)
    const unpinned = brandStrengthAt(played, played.week)
    expect(unpinned, 'without a pin she would read her own history, which is a bigger number')
      .toBeGreaterThan(fameNow)

    const save = migrateSave(JSON.parse(JSON.stringify({ ...played, schemaVersion: 68 })))
    expect(save.brandStrengthSeed, 'the step writes the pin').toEqual({ week: played.week, value: fameNow })
    expect(brandStrengthAt(save, save.week), 'and pinned, the stock IS this week\'s fame – nothing jumps')
      .toBeCloseTo(fameNow, 10)
    expect(brandGrossWorthCents(brandSignalsOf(save, save.week), BASE_X), '...so the worth is unchanged to the cent')
      .toBe(flatWorth(brandSignalsOf(save, save.week)))
    // ⭐ AND ONLY THE YEARS AFTER IT ARE FLATTENED, which is the feature rather than the promise.
    const later = save.week + 3 * WEEKS_PER_YEAR
    expect(brandStrengthAt(save, later), 'the pin fades on the slow kernel, not on fame\'s')
      .toBeGreaterThan(fameAt(save, later))
  })

  it('⚠ the pin is idempotent, and a save that already carries one is not re-pinned', () => {
    const raw = JSON.parse(readFileSync(`${SAVES_DIR}/v68.json`, 'utf8'))
    const once = migrateSave(JSON.parse(JSON.stringify(raw)))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(twice.brandStrengthSeed).toEqual(once.brandStrengthSeed)
    expect(twice.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
  })

  it('⭐⭐ EVERY older schema still loads and comes out pinned – the ladder, not the assertion', () => {
    // ⚠ THE ONE FAILURE THIS FEATURE IS NOT ALLOWED TO HAVE. `goldenSaves.test.ts` walks the whole
    // corpus; this arm names the rungs a schema move is most likely to break – the very first shape,
    // the one that introduced persisted RNG, the one before the trophy ledger the pin reads, and the
    // version immediately below this one.
    for (const v of [0, 31, 35, 46, 57, 67, 68]) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${SAVES_DIR}/v${v}.json`, 'utf8')))
      expect(migrated.schemaVersion, `v${v} migrates`).toBe(SAVE_SCHEMA_VERSION)
      expect(migrated.brandStrengthSeed, `v${v} comes out pinned`).toBeDefined()
      expect(migrated.brandStrengthSeed!.week, `v${v} pins at its own week`).toBe(migrated.week)
      expect(migrated.brandStrengthSeed!.value, `v${v} pins its own fame`)
        .toBeCloseTo(fameAt(migrated, migrated.week), 10)
    }
  })

  it('⚠ the fixture for this version exists and carries the key the version is about', () => {
    const fixture = JSON.parse(readFileSync(`${SAVES_DIR}/v${SAVE_SCHEMA_VERSION}.json`, 'utf8'))
    expect(fixture.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(fixture.brandStrengthSeed, 'the shape the version froze').toBeDefined()
  })
})

describe('round 32 #5 §6 – ⭐⭐ a delivered shoot ADDS to the floor, by the band of its deal', () => {
  it('⭐⭐⭐ the addition is on the floor, so it lifts a career that has nothing to multiply', () => {
    // «карьера топ-20 без титулов … на раннем этапе коллаборации нам должны помочь». A multiplier
    // cannot lift a career with nothing to multiply, and this arm is that sentence: the SAME shoots
    // move a career whose floor is nearly zero.
    const bare = parkAt(shopper('r32-5-bare'), 3 * WEEKS_PER_YEAR)
    winTitles(bare, 'w75', [bare.week - 30])
    const before = fameFloorOf(bare, bare.week)
    signDeal(bare, 'a', 2, [bare.week - 5, bare.week - 30, bare.week - 60])
    expect(fameFloorOf(bare, bare.week), 'the FLOOR itself moved, which is the item').toBeGreaterThan(before)
  })

  it('⭐⭐ ...and by the deal\'s band – «глобальный дом это не локальный ретейнер»', () => {
    const weeks = [200, 180, 160]
    const at = (band: number): number => {
      const w = parkAt(shopper(`r32-5-band-${band}`), 210)
      winTitles(w, 'w75', [100])
      signDeal(w, 'a', band, weeks)
      return fameFloorOf(w, w.week)
    }
    const bands = ECONOMY.fame.shootFloorByBand
    let last = -Infinity
    for (let b = 0; b < bands.length; b++) {
      const v = at(b)
      expect(v, `band ${b} is worth at least as much as the one below it`).toBeGreaterThan(last)
      last = v
    }
    // ⚠ AND THE GRADIENT IS GENTLE ON PURPOSE – benched at 6.7x it moved his own row +44% on fame,
    // which is a retune of the top wearing an early-career label. See the constant's own note.
    expect(bands[bands.length - 1] / bands[0], 'a global house, not a hundred of them').toBeLessThan(4)
    expect(bands[bands.length - 1]).toBeGreaterThan(bands[0])
  })

  it('⭐⭐ the band is read off the CHEQUE the letter states, so no save needs a new field', () => {
    // ⚠⚠ RE-AIMED FROM WATCHES TO CLOTHING BY ROUND 34 (03.09) AND THE CLAIM IS UNCHANGED: every
    // cell of a category whose cheques are distinct still round-trips to its own band, exactly.
    // Watches cannot carry this arm any more – the owner's approved table pays $200,000 at BOTH the
    // ≤200 and the ≤100 band – and clothing can, because its five cells are five different numbers.
    const cells = ECONOMY.advertising.categories.clothing.feeCentsByBand
    for (let b = 0; b < ECONOMY.advertising.bands.length; b++) {
      const cell = cells[b]
      if (cell == null) continue
      expect(adBandOfTerms({ brand: 'x', category: 'clothing', cashCents: cell, termWeeks: 52, shootCount: 1 }))
        .toBe(b)
    }
    // ⚠⚠ ...AND THE PLACES WHERE THE CHEQUE NO LONGER IDENTIFIES THE BAND ARE PINNED BY NAME RATHER
    // THAN LEFT TO BE DISCOVERED. Round 34's approved cells repeat a figure twice in two categories,
    // so those two letters read back one rung ABOVE the band they were written at – the strongest
    // band whose cell they exactly are, which is `adBandOfTerms`' shipped rule unchanged. Listing
    // them here means a later edit that creates a THIRD collision reddens this arm.
    const collisions: [Exclude<AdCategory, 'capstone'>, number, number][] = [
      ['watches', 1, 2], // $200,000 at ≤200 and at ≤100
      ['drinks', 0, 1], //  $80,000 at ≤400 and at ≤200
    ]
    for (const [category, writtenAt, readsAs] of collisions) {
      const cell = ECONOMY.advertising.categories[category].feeCentsByBand[writtenAt]!
      expect(adBandOfTerms({ brand: 'x', category, cashCents: cell, termWeeks: 52, shootCount: 1 }), `${category}@${writtenAt}`)
        .toBe(readsAs)
    }
    const seen = new Set<string>()
    for (const category of Object.keys(ECONOMY.advertising.categories) as Exclude<AdCategory, 'capstone'>[]) {
      const ladder = ECONOMY.advertising.categories[category].feeCentsByBand
      for (let b = 0; b < ladder.length; b++) {
        const cell = ladder[b]
        if (cell == null) continue
        const read = adBandOfTerms({ brand: 'x', category, cashCents: cell, termWeeks: 52, shootCount: 1 })
        if (read !== b) seen.add(`${category}@${b}`)
      }
    }
    expect([...seen].sort(), 'exactly these cells are ambiguous, and no others')
      .toEqual(['drinks@0', 'watches@1'])
    // ⚠ A LEGACY LETTER – no category at all, which `adCategoryOf` reads as the watch rung – lands on
    // the strongest band its cheque can actually pay for, and never throws.
    expect(adBandOfTerms({ brand: 'x', cashCents: 1_00, termWeeks: 52, shootCount: 1 }), 'under every cell is band 0')
      .toBe(0)
    expect(adBandOfTerms({ brand: 'x', cashCents: 999_999_999_00, termWeeks: 52, shootCount: 1 }), 'over every cell is the top')
      .toBe(ECONOMY.advertising.bands.length - 1)
    // the capstone is not a category row and is the top band by name, not by falling through to 0.
    expect(adBandOfTerms({ brand: 'x', category: 'capstone', cashCents: ECONOMY.advertising.capstone.cashCents, termWeeks: 416, shootCount: 2 }))
      .toBe(ECONOMY.advertising.bands.length - 1)
  })

  it('⭐⭐⭐ the addition DECAYS, on a half-life SHORTER than a title\'s, and leaves no residue', () => {
    // HIS RULING, both halves separated: the CAMPAIGN'S NOISE fades faster than a championship
    // («мало кто смотрит журналы 2 годичной давности»); the ASSOCIATION is permanent and is carried
    // by BRAND STRENGTH, not by a second permanent term in here.
    const ladder = ECONOMY.fame.shootFloorHalfLifeByBand
    for (let b = 0; b < ladder.length; b++) {
      expect(ladder[b], `band ${b} is forgotten faster than a title`).toBeLessThan(ECONOMY.fame.halfLifeWeeks)
      expect(shootFloorDecayAt(0, b), `band ${b} is fresh at zero`).toBe(1)
      expect(shootFloorDecayAt(ladder[b]!, b), `band ${b} is half at its own half-life`).toBeCloseTo(0.5, 10)
      // ⚠⚠ NO PERMANENT RESIDUE, WHICH IS WHAT KEEPS THE TERM BOUNDED WITHOUT A CAP PICKED OUT OF
      // THE AIR. A permanent per-shoot addition accumulates without limit over a twenty-season career.
      expect(shootFloorDecayAt(40 * WEEKS_PER_YEAR, b), `band ${b}: forty years on, nothing is left`)
        .toBeLessThan(1e-6)
    }
    const w = parkAt(shopper('r32-5-decay'), 3 * WEEKS_PER_YEAR)
    signDeal(w, 'a', 3, [w.week - 2])
    const fresh = fameFloorOf(w, w.week)
    expect(fameFloorOf(w, w.week + 40 * WEEKS_PER_YEAR), 'and it really does leave the floor')
      .toBeLessThan(fresh * 1e-3)
  })

  it('⭐⭐⭐ REACH BUYS DURABILITY – the same shoots at a stronger band are still there years later', () => {
    // THE OWNER (31.08): «у нас есть популярные сайты, журналы и бренды, а есть менее популярные …
    // чем больше она была в сильных контрактах – тем больше у нее велосити». What shipped first
    // scaled only the SIZE by the band and forgot every band at the same 52 weeks.
    //
    // ⚠⚠ AND THE TEST HAS TO BE ABOUT YEARS LATER, NOT ABOUT THE SHOOT WEEK – the sizes alone already
    // separate the bands there and always did, so a shoot-week comparison proves nothing about
    // durability. What is asserted is that the GAP OPENS: the ratio between the two floors at three
    // years is far larger than the ratio in the shoot week, which cannot happen on a flat ladder.
    const ladder = ECONOMY.fame.shootFloorHalfLifeByBand
    const top = ladder.length - 1
    expect(ladder[top], 'the global house is remembered longest').toBeGreaterThan(ladder[0]!)
    for (let b = 1; b < ladder.length; b++) {
      expect(ladder[b], `band ${b} outlasts band ${b - 1}`).toBeGreaterThan(ladder[b - 1]!)
    }

    // ⚠⚠ ONE SEED FOR BOTH BANDS, AND THAT IS NOT COSMETIC. The first draft of this arm seeded the
    // two careers on their own band and measured two DIFFERENT careers – the confound CLAUDE.md's
    // «prove the arm contains both the change and its reader» note is about, arriving from the other
    // side. Everything below is the same career; the band index is the only thing that varies.
    // ⚠ AND A BARE CAREER RATHER THAN `shopper`'s, because `shopper` walks twelve weeks and arrives
    // carrying a floor of its own – which would drown a term this item is for in one it is not.
    // This is the EARLY career the lever exists for: three seasons ended #45, a deal at two shoots a
    // season, and no title anywhere.
    const shoots = Array.from({ length: 12 }, (_, k) => 3 * WEEKS_PER_YEAR - 4 - k * 13).filter((x) => x > 0)
    const career = (band: number | null, week: number): WorldState => {
      const w = parkAt(createWorld('r32-5-durable'), week)
      proSeasons(w, 3, 45, 26, 14)
      if (band !== null) signDeal(w, 'd', band, shoots)
      return w
    }
    // ⚠ THE SHOOT TERM ALONE. The shootless twin carries the SAME three banked seasons, so this
    // subtraction isolates what the collaborations bought and nothing else – a baseline that forgot
    // the seasons would drown the effect in a floor both careers already had.
    const at = (band: number, week: number): number =>
      fameFloorOf(career(band, week), week) - fameFloorOf(career(null, week), week)
    const fresh = at(top, 3 * WEEKS_PER_YEAR) / at(0, 3 * WEEKS_PER_YEAR)
    const late = at(top, 6 * WEEKS_PER_YEAR) / at(0, 6 * WEEKS_PER_YEAR)
    expect(late, 'three years on the gap is far wider than it was in the shoot week')
      .toBeGreaterThan(fresh * 4)
    // ⚠ AND THE WORTH FEELS IT, which is the half a player can see. The strength stock compresses the
    // difference – it remembers both careers' peaks – so this is a real number rather than a large one.
    const worthAt = (band: number, week: number): number =>
      brandGrossWorthCents(brandSignalsOf(career(band, week), week), BASE_X)
    const spread = worthAt(top, 6 * WEEKS_PER_YEAR) / worthAt(0, 6 * WEEKS_PER_YEAR)
    expect(spread, 'three years after the last shoot the stronger shelf is still worth visibly more')
      .toBeGreaterThan(1.25)
    // ⚠⚠ AND AGAINST ITS OWN CONTROL, which is the claim the extension actually makes: on the FLAT
    // 52-week ladder that shipped first, the same two careers are much closer together three years
    // on. A test that only asserted «they differ» would pass on the flat ladder too.
    const flat = ECONOMY.fame.shootFloorHalfLifeByBand
    ;(ECONOMY.fame as { shootFloorHalfLifeByBand: readonly number[] }).shootFloorHalfLifeByBand = flat.map(() => 52)
    const flatSpread = worthAt(top, 6 * WEEKS_PER_YEAR) / worthAt(0, 6 * WEEKS_PER_YEAR)
    ;(ECONOMY.fame as { shootFloorHalfLifeByBand: readonly number[] }).shootFloorHalfLifeByBand = flat
    expect(spread, 'the ladder is what opens the gap, not the sizes').toBeGreaterThan(flatSpread * 1.1)
  })
})

describe('round 32 #5 §7 – ⚠ the existing multiplier STAYS as well, on his ruling «давай, да»', () => {
  it('⭐⭐ a delivered shoot moves BOTH the floor and the multiplier, and a champion feels both', () => {
    const w = parkAt(shopper('r32-5-both'), 4 * WEEKS_PER_YEAR)
    winTitles(w, 'wta500', [w.week - 40, w.week - 100])
    proSeasons(w, 4, 12, 34, 14)
    const floorBefore = fameFloorOf(w, w.week)
    const multBefore = fameShootMultOf(w, w.week)
    expect(multBefore, 'no shoots yet').toBe(1)
    signDeal(w, 'a', 2, [w.week - 6, w.week - 40, w.week - 70])
    expect(fameFloorOf(w, w.week), 'the add – the early rung').toBeGreaterThan(floorBefore)
    expect(fameShootMultOf(w, w.week), '...and the multiplier – the late one').toBeGreaterThan(multBefore)
    // and the two ledgers read the SAME weeks, which is what stops them drifting apart.
    expect(completedShootsByBand(w, w.week).map((x) => x.week).sort((a, b) => a - b))
      .toEqual([w.week - 70, w.week - 40, w.week - 6])
  })

  it('⚠ a shoot week still AHEAD buys nothing, and a week the college freeze swallowed lapses', () => {
    const ahead = parkAt(shopper('r32-5-ahead'), 200)
    winTitles(ahead, 'w75', [100])
    const before = fameFloorOf(ahead, ahead.week)
    signDeal(ahead, 'a', 3, [ahead.week + 4, ahead.week + 20])
    expect(fameFloorOf(ahead, ahead.week), 'a promise is not a photograph').toBe(before)

    const frozen = parkAt(shopper('r32-5-college'), 300)
    winTitles(frozen, 'w75', [100])
    // ⚠ THE FIELDS THE FREEZE'S OWN WINDOW IS MADE OF, and only those – the rest of `CollegeState` is
    // what the freeze DID, and `shootWeeksLived` reads the window alone.
    frozen.college = { fromWeek: 200, untilWeek: 280, doneWeek: null, years: [], pendingCallUp: null, pendingLeague: null }
    const bare = fameFloorOf(frozen, frozen.week)
    signDeal(frozen, 'a', 3, [230, 260])
    expect(fameFloorOf(frozen, frozen.week), 'a week the freeze swallowed bought no fame either').toBe(bare)
  })
})

describe('round 32 §8 – ⚠ a career with no results and no deals gains nothing from either feature', () => {
  it('⭐⭐ zero in, zero out, in both arms and at every week', () => {
    const bare = shopper('r32-8-bare')
    expect(bare.offers?.filter((o) => o.kind === 'ad' && o.state === 'signed') ?? [], 'no deals').toEqual([])
    for (const week of [bare.week, bare.week + WEEKS_PER_YEAR, bare.week + 10 * WEEKS_PER_YEAR]) {
      const s = brandSignalsOf(bare, week)
      expect(s.fame, `week ${week}`).toBe(0)
      expect(s.strength, `week ${week}`).toBe(0)
      expect(brandGrossWorthCents(s, BASE_X), 'a brand nobody has heard of is worth nothing gross')
        .toBe(flatWorth(s))
      expect(brandWeeklyGrossCents(s)).toBe(0)
    }
  })

  it('⚠ and the engine\'s own gate is what keeps «a face with no results» out of the ledger', () => {
    // ⚠⚠ SAID PLAINLY RATHER THAN LEFT TO BE DISCOVERED: the floor's new term DOES create fame from a
    // delivered shoot, which is exactly what «a source of fame in its own right» means. What stops a
    // career with no tennis from buying fame is UPSTREAM – `adBandFor` refuses a standing that is not
    // WTA-ranked, so the post never writes her a letter to sign. The gate is the offers system's, and
    // this arm records where it lives so a later reader does not look for it in `fameFloorOf`.
    const bare = shopper('r32-8-gate')
    expect(fameFloorOf(bare, bare.week), 'no results, no letters, no floor').toBe(0)
  })
})

describe('round 32 §9 – ⭐⭐⭐ NOTHING WRITES THE PIN BUT THE MIGRATION', () => {
  it('⭐⭐⭐ `createWorld` does not write it, and neither does a hundred weeks of ticking', () => {
    // ⚠⚠ THIS IS THE PRECONDITION THE FROZEN CAREER HASHES STAND ON. A stock written weekly would
    // appear on `selfTravelling` – her fame is 2.55 by week 156 – and the v69 re-freeze would have
    // moved TWO keys instead of one, which is the owner's call rather than a renumber. If this arm
    // ever goes red the re-freeze in tests/coachTravelEdgeFixtures.ts is no longer honest.
    const w = createWorld('r32-9-live')
    expect(w.brandStrengthSeed, 'not at birth').toBeUndefined()
    const rng = rngFromSeed(w.seed)
    for (let i = 0; i < 100; i++) {
      tickWeek(w, rng)
      if (w.pendingTournament) {
        skipTournament(w)
        closeTournament(w)
      }
    }
    expect(w.brandStrengthSeed, 'and not after a hundred weeks of play').toBeUndefined()
    expect(brandStrengthAt(w, w.week), 'the stock is still readable – it is derived, not stored')
      .toBeGreaterThanOrEqual(0)
  })

  it('⚠ the stock is a pure fold: same world, same week, same answer, before and after a round trip', () => {
    const w = parkAt(shopper('r32-9-pure'), 5 * WEEKS_PER_YEAR)
    winTitles(w, 'wta500', [80, 160])
    proSeasons(w, 5, 14, 32, 16)
    const first = brandStrengthAt(w, w.week)
    expect(brandStrengthAt(w, w.week), 'idempotent').toBe(first)
    const reloaded = migrateSave(JSON.parse(JSON.stringify(w)))
    expect(brandStrengthAt(reloaded, reloaded.week), 'and a save-and-load cannot drift it')
      .toBeCloseTo(first, 10)
  })

  it('⚠ `fameEventWeeks` lists every date fame can rise on, and a shoot dates at w+1', () => {
    // ⚠ THE OFF-BY-ONE THAT WOULD QUIETLY UNDER-READ EVERY STOCK BUILT ON SHOOTS: a shoot at week w
    // first pays at w+1 (`completedShootWeeks`' «strictly before»), so the candidate is w+1.
    const w = parkAt(shopper('r32-9-events'), 400)
    winTitles(w, 'wta250', [120])
    loseFinals(w, 'slam', [200])
    proSeasons(w, 2, 30, 20, 20)
    signDeal(w, 'a', 1, [300])
    const dates = fameEventWeeks(w)
    expect(dates, 'the title, the lost Slam final, two season wraps and the shoot at w+1')
      .toEqual([52, 104, 120, 200, 301])
    expect(dates, 'sorted').toEqual([...dates].sort((a, b) => a - b))
  })
})

// =================================================================================================
// ROUND 34 #17 (03.09) – ⭐⭐⭐ THE BRAND FOLLOWS THE CONTRACTS
// =================================================================================================
//
// THE OWNER, on his own week-569 career: «89 место доход опустился с 200 до 65 долларов в неделю с
// бизнеса… Она доходит в Шлеме до QF и вообще стабильно в 100 держится, плюс есть мощные рекламные
// контракты… мне кажется нам надо улучшить формулу рассчета доходности и стоимости ее бренда».
//
// The incoherence, measured on that save: the sponsor market priced her at $550,000 a year of live
// paper while the brand model said her whole brand was worth $76,822 and paid $244 a week. Approved:
// +1 point of REACH per $50,000 of live annual contract value, the whole term capped at +30.

/** a SIGNED advertising letter that is LIVE at `week` – `activeAdDeals`' own predicate needs the
 *  window, which `signDeal` above deliberately does not set (its letters are read for their SHOOTS,
 *  not for their term). */
function liveDeal(world: WorldState, id: string, cashCents: number, fromWeek: number, untilWeek: number): void {
  world.offers ??= []
  world.offers.push({
    id,
    kind: 'ad',
    week: fromWeek,
    deadlineWeek: fromWeek + 4,
    state: 'signed',
    decidedWeek: fromWeek,
    fromWeek,
    untilWeek,
    terms: { brand: `House ${id}`, category: 'cars', cashCents, termWeeks: untilWeek - fromWeek + 1, shootCount: 1 } as AdOfferTerms,
  })
}

describe('round 34 #17 – ⭐⭐⭐ the brand follows the contracts', () => {
  const C = ECONOMY.business.merch.contracts

  it('⭐⭐ +1 of reach per $50,000 of LIVE annual contract value, and the cap is the point', () => {
    const W = 6 * WEEKS_PER_YEAR
    const bare = parkAt(shopper('r34-17-bare'), W)
    expect(brandSignalsOf(bare, W).contractFame, 'no paper, no term').toBe(0)

    const modest = parkAt(shopper('r34-17-modest'), W)
    liveDeal(modest, 'a', 600_000_00, W - 20, W + 20)
    expect(brandSignalsOf(modest, W).contractFame, '$600,000 is twelve points').toBeCloseTo(12, 10)
    expect(C.famePerCents, 'and the rate is the owner`s own $50,000').toBe(50_000_00)

    // ⭐⭐ THE CAP IS NOT DROPPABLE AND IS ASSERTED AS ITSELF: contracts lift the floor under an
    // unglamorous professional, but an icon is still made by titles and not by her agent. A full
    // top-10 shelf is $9.2M a year and saturates this term nearly twenty times over.
    const icon = parkAt(shopper('r34-17-icon'), W)
    liveDeal(icon, 'b', 9_200_000_00, W - 20, W + 20)
    expect(brandSignalsOf(icon, W).contractFame, 'a whole top-10 shelf is held at the cap').toBe(C.fameCap)
    expect(C.fameCap).toBe(30)

    // ⚠ LIVE, NOT LIFETIME – a term that has run out stops counting the week it runs out, so the
    // signal FALLS with the shelf exactly as the file's other current-form terms do.
    const lapsed = parkAt(shopper('r34-17-lapsed'), W)
    liveDeal(lapsed, 'c', 600_000_00, W - 60, W - 1)
    expect(brandSignalsOf(lapsed, W).contractFame, 'dead paper is not a shelf').toBe(0)
    expect(brandSignalsOf(lapsed, W - 2).contractFame, '...and it counted while it ran').toBeCloseTo(12, 10)
  })

  it('⚠⚠ it is a SIGNAL and never a cash line – one contract is not paid twice', () => {
    // Her sponsor money already arrives through the deals themselves (`bankSponsorCheque` at the
    // signature, `payAdAnniversaries` each year). The claim here is that the brand gains NOTHING
    // except reach from them: two careers standing at the same reach, one through fame and one
    // through paper, earn the same to the cent and are worth the same to the cent.
    const W = 6 * WEEKS_PER_YEAR
    const paper = parkAt(shopper('r34-17-paper'), W)
    liveDeal(paper, 'a', 500_000_00, W - 20, W + 20)
    const s = brandSignalsOf(paper, W)
    expect(s.contractFame, 'ten points of it are paper').toBeCloseTo(10, 10)
    const famous: BrandSignals = { ...s, fame: s.fame + 10, strength: s.strength + 10, contractFame: 0 }
    expect(brandReachOf(famous), 'the two reaches are the same number').toBeCloseTo(brandReachOf(s), 9)
    expect(brandWeeklyGrossCents(famous), 'so the income is the same, to the cent').toBe(brandWeeklyGrossCents(s))
    expect(brandGrossWorthCents(famous, BASE_X), '...and so is the worth').toBe(brandGrossWorthCents(s, BASE_X))
  })

  it('⚠ the contracts lift the REACH and never the brand`s own stock, and the top cannot move', () => {
    const W = 6 * WEEKS_PER_YEAR
    const w = parkAt(shopper('r34-17-stock'), W)
    winTitles(w, 'wta500', [W - 10])
    const before = brandSignalsOf(w, W)
    liveDeal(w, 'a', 1_000_000_00, W - 20, W + 20)
    const after = brandSignalsOf(w, W)
    // ⚠ OUTSIDE THE `max`, DELIBERATELY: `strength` is «the best she has ever been» and a contract is
    // current form. A shelf must not be able to raise a career's high-water mark.
    expect(after.strength, 'the slow stock does not hear about the paper').toBe(before.strength)
    expect(after.fame, '...and neither does fame itself').toBe(before.fame)
    expect(brandReachOf(after) - brandReachOf(before), 'only the reach moves').toBeCloseTo(20, 9)

    // ⚠⚠ AND THE TOP OF THE SHELF ROUND 32 #3 FIXED BY CONSTRUCTION CANNOT MOVE, which is what the
    // clamp is for: at the fame cap the income and the multiple are the pre-wave ones whatever the
    // shelf says. Without the clamp an unclamped +30 would lift the peak income 69%.
    const atCap: BrandSignals = {
      fame: CAP, strength: CAP, proSeasons: 14, topSeasons: 8, finalsLost: 19, roomSize: 4_743, winRate: 0.7,
      contractFame: 0,
    }
    const loaded: BrandSignals = { ...atCap, contractFame: C.fameCap }
    expect(brandReachOf(loaded), 'the reach is still the cap').toBe(CAP)
    expect(brandWeeklyGrossCents(loaded), 'the income at the top is untouched').toBe(brandWeeklyGrossCents(atCap))
    expect(brandMultipleX(loaded, BASE_X), '...and so is the multiple').toBe(brandMultipleX(atCap, BASE_X))
  })

  it('⭐⭐⭐ his approved acceptance rows, reproduced – and the multiple stays inside 6-9x', () => {
    // ⚠⚠ NOT HIS SAVE. His `~/Downloads` exports are read-only and nothing derived from one enters
    // the repo; these are the SHAPES of the two rows he approved, built out of this file's own
    // fixtures. The save itself was read once on the command line (`tools/r34-brand-foot.ts`) and the
    // figures are recorded in docs/rounds/round-34.md under item 17.
    const at = (ownFame: number, dealCents: number): BrandSignals => ({
      fame: ownFame,
      strength: ownFame,
      proSeasons: 8,
      topSeasons: 0,
      finalsLost: 8,
      roomSize: 1_176,
      winRate: 0.63,
      contractFame: Math.min(C.fameCap, dealCents / C.famePerCents),
    })

    // ROW 1 – «top-100, $600k of deals, own fame 6»: approved fame 6 -> 18.
    const row1 = at(6, 600_000_00)
    expect(brandReachOf(row1), 'fame 6 and $600,000 of paper is a reach of 18').toBe(18)

    // ⚠⚠ AND THE MONEY COLUMN OF THAT ROW IS RECORDED AS UNREACHABLE RATHER THAN QUIETLY MISSED. The
    // approved row says $1,350 a week; the shipped income curve at reach 18 is
    // `perFamePointCents x 18² / famePivot` = $972, times a crowd tilt CLAMPED to [0.9, 1.15]. So the
    // most any career can earn at that reach is $1,118 – 17% under the approved figure, and no
    // signal can close it because every other term reaches the income through that clamp. Reported
    // to the owner in docs/rounds/round-34.md item 17; NOT adjusted here.
    const M = ECONOMY.business.merch
    const ceilingAt18 = Math.round(((M.perFamePointCents * 18 * 18) / M.famePivot) * M.crowd.maxMult)
    expect(ceilingAt18, 'the most the curve can pay at reach 18 – $1,117.80 in cents').toBe(111_780)
    expect(ceilingAt18, '...which is under the approved $1,350').toBeLessThan(1_350_00)

    // ROW 2 – «his shape, $1M of deals, own fame 8.9»: approved 8.9 -> 28.9, ~$2,600 a week,
    // ~$135,000 a year, ~$1,130,000 of worth, 8.4x. Measured against the shipped curve to within 1.5%.
    const row2 = at(8.925, 1_000_000_00)
    expect(brandReachOf(row2), 'fame 8.9 and $1M of paper is a reach of 28.9').toBeCloseTo(28.925, 6)
    const weekly = brandWeeklyGrossCents(row2)
    const worth = brandGrossWorthCents(row2, BASE_X)
    const mult = brandMultipleX(row2, BASE_X)
    expect(weekly / 2_600_00, 'the weekly lands within 2% of his approved $2,600').toBeCloseTo(1, 1)
    expect(worth / 1_130_000_00, 'and the worth within 2% of his approved $1,130,000').toBeCloseTo(1, 1)
    expect(Math.abs(mult / 8.4 - 1), 'the multiple lands within 1% of his approved 8.4x').toBeLessThan(0.01)
    // ⚠⚠ THE CORRIDOR ROUND 32 REPAIRED THE FREE FLOAT TO, asserted rather than assumed: a change
    // that puts the worth outside 6-9x of a year's earnings has reintroduced the 123x defect.
    const ratio = worth / (weekly * WEEKS_PER_YEAR)
    expect(ratio, 'worth over a year of income is the multiple, to the cent').toBeCloseTo(mult, 2)
    expect(ratio).toBeGreaterThanOrEqual(6)
    expect(ratio).toBeLessThanOrEqual(9)
  })
})

// ⚠⚠ ROUND 34 #17 MUTATIONS – each applied ALONE to the shipped source and reverted. Measured, not
// predicted.
//  R34-1 `fame.finalFloorShare` 0.4 -> 0 (finals stop paying)
//        -> 3 RED across round29p5-business, round30-brand-value and round32-brand-multiple.
//  R34-2 the `if (tier === 'slam') continue` guard deleted from `fameFloorOf` (a Slam final paid twice)
//        -> 1 RED, ALONE: «a LOST Slam final counts its own step – and every other lost final counts
//           a SHARE of its tier». That arm is the only thing standing between the two rules.
//  R34-3 `brandReachOf` reverted to `Math.min(cap, built)` (the contract term dropped)
//        -> 3 RED, all three round-34 arms in this file. ⚠ Before those arms existed it ran GREEN,
//           which is why they were written: F4 shipped with no guard until the mutation said so.
//  R34-4 `academy.reputationCapPerSeason` 0.5 -> 0 (the career cap flattened)
//        -> 2 RED in round29p5-business, including the payback-window arm.
//  R34-5 the drinks ≤400 cell $80,000 -> $8,000 (one approved cell moved back)
//        -> 3 RED in round29p2-ladder-monotone, the band-totals arm among them.
//
// ⚠⚠ MUTATION LOG – each applied ALONE to the shipped source and reverted, on this branch.
//
// ⭐ THE REVISION'S OWN FOUR ARE 13-16; 1-12 are the first pass's and were re-run against the revised
// source, with the two that changed meaning noted in place.
//
// 13. `brandReachOf` reduced to `signals.fame` (the floor deleted)
//     -> §3 «the INCOME is what stops collapsing» RED, §3 «the INCOME carries the memory» RED;
//        §2 «the REACH is fame wherever fame is at its own maximum» GREEN – which is exactly the
//        shape a change that keeps the top and loses the feature must have.
// 14. `strength.retention` set to 1
//     -> §2 «`retention < 1` is the proof» RED, and §3 «the INCOME carries the memory» RED with it
//        (the floor starts binding the week after the peak). The top of the shelf moves, which is
//        what that bound exists to forbid.
// 15. `shootFloorHalfLifeByBand` flattened to one half-life for every band
//     -> §6 «REACH BUYS DURABILITY» RED; §6 «by the deal's band» still GREEN – the sizes are a
//        different claim and the mutation must not touch it.
// 16. ⭐⭐ `brandMultipleX` pointed back at `signals.fame` instead of the reach
//     -> ⚠⚠ RAN GREEN THE FIRST TIME, AND THAT IS WHY §3's «BOTH HALVES READ ONE CLOCK» EXISTS.
//        «worth / a year of income IS the multiple» compares the ratio against `brandMultipleX`
//        itself, so a multiple that quietly moved to a different clock keeps the identity and passes.
//        With the new arm the mutation is RED, and it is the only arm that catches it.
//
//  1. `strengthDecayAt` floor removed (`Math.max(S.floorShare, …)` -> the bare power)
//     -> §1 «never falls below floorShare» RED (3 arms), §4 «a share of her own peak» RED.
//  2. `brandStrengthAt` week-itself candidate deleted
//     -> §2 «strength is NEVER below fame» RED, §2 «at the cap» RED, §5 «nothing jumps» RED.
//  3. `brandStrengthAt` seed cut-off removed (candidates from -1 always)
//     -> §5 «the v69 pin makes an existing career read the SAME brand value» RED.
//  4. `brandGrossWorthCents` reverted to pricing at `signals` rather than `brandBuiltSignals`
//     ⚠ SUPERSEDED BY THE REVISION: `brandBuiltSignals` no longer exists, and the mutation it names
//     is now the shipped code. Mutation 13 is what took its place.
//  5. `strength.halfLifeWeeks` set to `ECONOMY.fame.halfLifeWeeks`
//     -> §1 «slower than fame's» RED.
//  6. the collaboration term deleted from `fameFloorOf`
//     -> §6 «the addition is on the floor» RED, §6 «by the deal's band» RED, §7 «BOTH» RED.
//  7. `shootFloorByBand` flattened to a constant
//     -> §6 «by the deal's band» RED (the monotone sweep), everything else green.
//  8. `shootFloorHalfLifeByBand` set to `fame.halfLifeWeeks` throughout (was `shootFloorHalfLifeWeeks`
//     before the 31.08 extension made it a ladder)
//     -> §6 «shorter than a title's» RED on every band.
//  9. `adBandOfTerms` walking the ladder from the bottom instead of the top
//     -> §6 «read off the cheque» RED (bands 1..3 all answer 0).
// 10. `fameEventWeeks` dating a shoot at `w` instead of `w + 1`
//     -> §9 «a shoot dates at w+1» RED.
// 11. the v68 -> v69 migration step deleted
//     -> §5 «the v69 pin», «every older schema still loads» and «idempotent» RED;
//        `goldenSaves.test.ts` RED on every fixture (the schema would be newer than supported).
// 12. `createWorld` given `brandStrengthSeed: {week: 0, value: 0}`
//     -> §9 «not at birth» RED, and the three frozen career hashes RED – which is the coupling this
//        section exists to make visible.
