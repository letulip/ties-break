import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  recomputeKidRank,
  STARTING_FUNDS_CENTS,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY, GEAR_CATEGORIES, gearHitsUpTo } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, type FamilyBackground } from '../src/shared/protocol'

// Fixed calibration batch. 16 seeds so the mean is stable against the working-class sponsor's
// high variance (a single working season can swing several $k on sponsor luck – see below), while
// staying cheap.
const SEEDS = Array.from({ length: 16 }, (_, i) => `cal-${i + 1}`)

/** Net funds lost over 52 weeks with NO tournaments entered (fixed costs only). A fresh career
 *  earns no ranking points, so the kid sits at the bottom of the field all year → rank > 30 →
 *  the product-sponsorship valve never fires. These are the owner's UNSPONSORED-kid bands. */
function seasonBurnDollars(seed: string, background: FamilyBackground): number {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background })
  const rng = rngFromSeed(world.seed)
  const start = STARTING_FUNDS_CENTS[background]
  for (let i = 0; i < 52; i++) tickWeek(world, rng)
  return (start - world.fundsCents) / 100
}

function batchBurns(background: FamilyBackground): number[] {
  return SEEDS.map((s) => seasonBurnDollars(s, background))
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

// Owner's target net-burn bands (round-7 item 1d), defined for an UNSPONSORED kid (rank > 30 all
// year, no tournaments). Acceptance targets, so they live here, not in the ECONOMY config.
const BANDS: Record<FamilyBackground, [number, number]> = {
  working: [4_500, 7_000],
  middle: [9_000, 14_000],
  wealthy: [14_000, 22_000],
}

describe('economy calibration – 52-week net burn (no tournaments, unsponsored kid)', () => {
  it('the calibration kid really is unsponsored: rank stays well past the valve threshold', () => {
    const world = createWorld('cal-1', { ...DEFAULT_PROFILE, background: 'middle' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    // No results earned → bottom of the field → far past the ≤30 half-price / ≤10 free thresholds.
    expect(world.kidRank).toBeGreaterThan(ECONOMY.sponsorship.halfPriceMaxRank)
  })

  it('working burn lands in the $4.5–7k band (batch mean)', () => {
    // Working keeps the need-based local sponsor, whose 6% × $500–1500 roll swings a single season
    // by several $k – its per-seed spread is wider than the band, so the band is a BATCH-MEAN
    // statement (a typical working season), not a per-seed guarantee.
    const burns = batchBurns('working')
    const [lo, hi] = BANDS.working
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
  })

  it('middle burn lands in the $9–14k band (mean and every seed)', () => {
    const burns = batchBurns('middle')
    const [lo, hi] = BANDS.middle
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    // middle has no sponsor income → tight spread → every seed is in-band too.
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo)
      expect(b).toBeLessThanOrEqual(hi)
    }
  })

  it('wealthy burn lands in the $14–22k band (mean and every seed) – premium everything must hurt', () => {
    const burns = batchBurns('wealthy')
    const [lo, hi] = BANDS.wealthy
    expect(mean(burns)).toBeGreaterThanOrEqual(lo)
    expect(mean(burns)).toBeLessThanOrEqual(hi)
    for (const b of burns) {
      expect(b).toBeGreaterThanOrEqual(lo)
      expect(b).toBeLessThanOrEqual(hi)
    }
  })

  it('burn ordering matches the design: working < middle < wealthy', () => {
    expect(mean(batchBurns('working'))).toBeLessThan(mean(batchBurns('middle')))
    expect(mean(batchBurns('middle'))).toBeLessThan(mean(batchBurns('wealthy')))
  })
})

describe('product-sponsorship valve (round-7 amendment)', () => {
  // Force the kid to the very top with a big, in-window result (AI selection excludes the kid, so
  // this touches only the ranking, never the main stream). Then gear/stringing are covered.
  function topRankedBurn(seed: string, background: FamilyBackground): { burn: number; world: WorldState } {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, background })
    world.results.push({ playerId: KID_ID, week: 0, points: 100_000 })
    recomputeKidRank(world)
    const rng = rngFromSeed(world.seed)
    const start = STARTING_FUNDS_CENTS[background]
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    return { burn: (start - world.fundsCents) / 100, world }
  }

  it('a rank-≤10 middle kid burns ≥ $1.5k less over 52w than an unsponsored one', () => {
    const unsponsored = mean(batchBurns('middle'))
    const sponsored = mean(SEEDS.map((s) => topRankedBurn(s, 'middle').burn))
    expect(unsponsored - sponsored).toBeGreaterThanOrEqual(1_500)
  })

  it('subsidising gear never perturbs the main weekly stream (RNG discipline)', () => {
    // Same seed, same background; one kid is forced to rank ≤10 (gear free), the other is not.
    const plain = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    const sponsored = createWorld('valve-rng', { ...DEFAULT_PROFILE, background: 'middle' })
    sponsored.results.push({ playerId: KID_ID, week: 0, points: 100_000 })
    recomputeKidRank(sponsored)
    const rngA = rngFromSeed('valve-rng')
    const rngB = rngFromSeed('valve-rng')
    for (let i = 0; i < 52; i++) {
      tickWeek(plain, rngA)
      tickWeek(sponsored, rngB)
    }
    // The valve reads the kid's rank but draws nothing from the main stream: cohort drift and the
    // AI field resolve identically in both worlds.
    expect(plain.cohort).toEqual(sponsored.cohort)
    expect(plain.results.filter((r) => r.playerId !== KID_ID)).toEqual(
      sponsored.results.filter((r) => r.playerId !== KID_ID),
    )
    // ...but the sponsored kid spent less (gear covered), so she ends richer.
    expect(sponsored.fundsCents).toBeGreaterThan(plain.fundsCents)
  })

  it('emits the sponsor-covered gear events (still tagged, so the Money breakdown shows them)', () => {
    const { world } = topRankedBurn('cal-1', 'middle')
    const covered = world.events.filter(
      (e) => e.type === 'expense' && e.text.includes('covered by your racket sponsor'),
    )
    expect(covered.length).toBeGreaterThan(0)
    // covered line-items are $0 but still carry a gear/stringing category
    for (const e of covered) {
      expect(e.amountCents).toBe(0)
      expect(['gear', 'stringing']).toContain(e.category)
    }
  })
})

describe('gear cadence (round-7 a) – each category fires within its window', () => {
  const HORIZON = 520
  for (const background of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    for (const category of GEAR_CATEGORIES) {
      it(`${background}/${category}: gaps and prices stay inside the configured ranges`, () => {
        const line = ECONOMY.gear[category]
        const [cadLo, cadHi] = line.cadenceWeeks[background]
        const [prLo, prHi] = line.priceCents[background]
        const hits = gearHitsUpTo(`gear-cadence-${background}`, category, background, HORIZON)
        expect(hits.length).toBeGreaterThan(0)
        let prev = 0
        for (const h of hits) {
          const gap = h.week - prev
          expect(gap).toBeGreaterThanOrEqual(cadLo)
          expect(gap).toBeLessThanOrEqual(cadHi)
          expect(h.amountCents).toBeGreaterThanOrEqual(prLo)
          expect(h.amountCents).toBeLessThanOrEqual(prHi)
          prev = h.week
        }
      })
    }
  }

  it('gear schedules are deterministic and independent of the main stream / background choice', () => {
    // Same seed → same schedule every time (purpose-scoped sub-stream, re-derived from the seed).
    const a = gearHitsUpTo('det', 'rackets', 'middle', 200)
    const b = gearHitsUpTo('det', 'rackets', 'middle', 200)
    expect(a).toEqual(b)
    // A longer horizon is a strict prefix-superset: the (week, amount) pairs for the earlier weeks
    // never shift, so walking further ahead can't retroactively change a past purchase.
    const short = gearHitsUpTo('det', 'rackets', 'middle', 60)
    const long = gearHitsUpTo('det', 'rackets', 'middle', 200)
    expect(long.slice(0, short.length)).toEqual(short)
  })
})
