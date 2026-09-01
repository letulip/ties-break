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
// ⚠ WHAT THIS FILE HOLDS:
//   §1  the kernel's two ends – fresh is 1, ancient is `floorShare`, and it never goes below;
//   §2  ⭐⭐⭐ THE TOP DOES NOT MOVE. Strength equals fame at the cap and at every running peak, so the
//       best career in the game prices exactly as it did – by construction, not by a clamp;
//   §3  ⭐⭐ THE ASSET HOLDS WHILE THE INCOME BREATHES – five years with nothing won, on his shape;
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
import type { AdOfferTerms } from '../src/shared/protocol'

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
 *  cheque is the catalogue's own cell, which is what `adBandOfTerms` reads the band back off. */
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
      category: 'watches',
      cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[band]!,
      termWeeks: world.week,
      shootCount: 2,
      shootWeeks,
    } as AdOfferTerms,
  })
}

/** the pre-#4 worth, THROUGH THE SHIPPED FUNCTION: `brandBuiltSignals` substitutes `strength` for
 *  `fame`, so a signal set whose strength IS its fame reduces `brandGrossWorthCents` to the
 *  expression it had before this wave, term for term. Nothing here can drift from the engine. */
const flatWorth = (s: BrandSignals): number => brandGrossWorthCents({ ...s, strength: s.fame }, BASE_X)

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

  it('⭐⭐⭐ five years with nothing new won: the worth falls FAR less than the income does', () => {
    const w = hisShape()
    const now = brandSignalsOf(w, w.week)
    const later = brandSignalsOf(w, w.week + 5 * WEEKS_PER_YEAR)
    const incomeFall = 1 - brandWeeklyGrossCents(later) / brandWeeklyGrossCents(now)
    const wornFall = 1 - flatWorth(later) / flatWorth(now)
    const heldFall = 1 - brandGrossWorthCents(later, BASE_X) / brandGrossWorthCents(now, BASE_X)

    // ⚠⚠ THE DEFECT, RE-MEASURED ON THE MIRROR: before this wave the worth fell HARDER than the
    // income, because it went as fame³ against the income's fame². That is what a 99% capital loss
    // in five years is made of.
    expect(wornFall, 'the pre-wave worth falls at least as hard as the income').toBeGreaterThan(incomeFall)
    // ...and after it, the asset holds. His acceptance: «a decline of the same ORDER as the income's,
    // not its cube» – comfortably met, because the stock decays on years and the income on weeks.
    expect(heldFall, 'the held worth falls less than the income').toBeLessThan(incomeFall)
    expect(heldFall, '...and much less than it used to').toBeLessThan(wornFall - 0.1)
    expect(heldFall, 'a 99% capital loss is what this feature exists to end').toBeLessThan(0.9)
  })

  it('⚠ the INCOME is untouched by #4 – it still reads fame, week by week', () => {
    // The split, asserted rather than described: income is a flow and follows attention. If this ever
    // goes green on a strength-priced income, the two clocks have been collapsed back into one.
    const w = hisShape()
    for (const offset of [0, WEEKS_PER_YEAR, 3 * WEEKS_PER_YEAR]) {
      const s = brandSignalsOf(w, w.week + offset)
      expect(brandWeeklyGrossCents(s), `+${offset}w`).toBe(brandWeeklyGrossCents({ ...s, strength: s.fame }))
      expect(s.strength, '...while the stock has genuinely diverged from fame').toBeGreaterThan(
        offset === 0 ? s.fame - 1e-9 : s.fame,
      )
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
    const cells = ECONOMY.advertising.categories.watches.feeCentsByBand
    for (let b = 0; b < ECONOMY.advertising.bands.length; b++) {
      const cell = cells[b]
      if (cell == null) continue
      expect(adBandOfTerms({ brand: 'x', category: 'watches', cashCents: cell, termWeeks: 52, shootCount: 1 }))
        .toBe(b)
    }
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
    expect(ECONOMY.fame.shootFloorHalfLifeWeeks, 'faster than a title')
      .toBeLessThan(ECONOMY.fame.halfLifeWeeks)
    expect(shootFloorDecayAt(0)).toBe(1)
    expect(shootFloorDecayAt(ECONOMY.fame.shootFloorHalfLifeWeeks)).toBeCloseTo(0.5, 10)
    // ⚠⚠ NO PERMANENT RESIDUE, WHICH IS WHAT KEEPS THE TERM BOUNDED WITHOUT A CAP PICKED OUT OF THE
    // AIR. A permanent per-shoot addition accumulates without limit over a twenty-season career.
    expect(shootFloorDecayAt(40 * WEEKS_PER_YEAR), 'forty years on, nothing is left of the campaign')
      .toBeLessThan(1e-6)
    const w = parkAt(shopper('r32-5-decay'), 3 * WEEKS_PER_YEAR)
    signDeal(w, 'a', 3, [w.week - 2])
    const fresh = fameFloorOf(w, w.week)
    expect(fameFloorOf(w, w.week + 40 * WEEKS_PER_YEAR), 'and it really does leave the floor')
      .toBeLessThan(fresh * 1e-3)
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

// ⚠⚠ MUTATION LOG – each applied ALONE to the shipped source and reverted, on this branch.
//
//  1. `strengthDecayAt` floor removed (`Math.max(S.floorShare, …)` -> the bare power)
//     -> §1 «never falls below floorShare» RED (3 arms), §4 «a share of her own peak» RED.
//  2. `brandStrengthAt` week-itself candidate deleted
//     -> §2 «strength is NEVER below fame» RED, §2 «at the cap» RED, §5 «nothing jumps» RED.
//  3. `brandStrengthAt` seed cut-off removed (candidates from -1 always)
//     -> §5 «the v69 pin makes an existing career read the SAME brand value» RED.
//  4. `brandGrossWorthCents` reverted to pricing at `signals` rather than `brandBuiltSignals`
//     -> §3 «the worth falls FAR less than the income» RED, §5 «unchanged to the cent» still green
//        (the pin makes strength = fame there, which is the point), §2 green – exactly the shape a
//        change that keeps the top and loses the feature should have.
//  5. `strength.halfLifeWeeks` set to `ECONOMY.fame.halfLifeWeeks`
//     -> §1 «slower than fame's» RED.
//  6. the collaboration term deleted from `fameFloorOf`
//     -> §6 «the addition is on the floor» RED, §6 «by the deal's band» RED, §7 «BOTH» RED.
//  7. `shootFloorByBand` flattened to a constant
//     -> §6 «by the deal's band» RED (the monotone sweep), everything else green.
//  8. `shootFloorHalfLifeWeeks` set to `fame.halfLifeWeeks`
//     -> §6 «shorter than a title's» RED.
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
