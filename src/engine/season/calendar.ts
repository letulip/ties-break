// Package L – tournament calendar. Pure: the season is a deterministic function
// of a seed string and a week span. No worker/DOM/IndexedDB, no Math.random –
// all randomness flows from a season sub-RNG (rngFromSeed(seedStr)).

import { rngFromSeed, pickInt, type Rng } from '../rng'
import type { Surface } from '../match/types'
import type { FamilyBackground } from '../../shared/protocol'
import { ECONOMY } from '../economy'
import type { SeasonEvent, TierDef, TierId } from './types'

// Tier catalogue. Economy numbers are whole cents. `points` length = rounds + 1
// (rounds = log2(drawSize)); index 0 = champion. `itf` is present but locked in
// Phase 3 (everyNWeeks 0 → buildSeason never schedules it).
export const TIERS: Record<TierId, TierDef> = {
  local: {
    id: 'local',
    label: 'Local Open',
    drawSize: 8,
    entryFeeCents: 40_00,
    travelCostCents: [60_00, 120_00],
    points: [30, 18, 10, 5],
    everyNWeeks: 2,
  },
  regional: {
    id: 'regional',
    label: 'Regional Championship',
    drawSize: 16,
    entryFeeCents: 75_00,
    travelCostCents: [150_00, 400_00],
    points: [80, 48, 28, 14, 6],
    everyNWeeks: 4,
  },
  national: {
    id: 'national',
    label: 'National Series',
    drawSize: 32,
    entryFeeCents: 120_00,
    travelCostCents: [400_00, 900_00],
    points: [200, 120, 70, 35, 15, 6],
    everyNWeeks: 13,
  },
  itf: {
    id: 'itf',
    label: 'ITF Junior (locked)',
    drawSize: 32,
    entryFeeCents: 200_00,
    travelCostCents: [900_00, 2000_00],
    points: [400, 240, 140, 70, 30, 12],
    everyNWeeks: 0, // locked in Phase 3
  },
}

// --- off-season (Round 5 items 16/21) ----------------------------------------
// Every season year (52 absolute weeks, year = floor(week / 52)) ends with 3 dead
// weeks that never carry an event – the real-world Nov/Dec break: school, family,
// no travel. Tied to the absolute week number (not to whatever span buildSeason
// happens to be called with) so it lines up with world.ts's year-boundary logic
// regardless of chunking.
export const WEEKS_PER_YEAR = 52
export const OFF_SEASON_WEEKS = 3

/** True for the last `OFF_SEASON_WEEKS` weeks of a season year (e.g. weeks 49-51 of
 *  year 0: Dec 15 - Jan 4 against the Round-5 real-dates epoch). */
export function isOffSeasonWeek(week: number): boolean {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return offset >= WEEKS_PER_YEAR - OFF_SEASON_WEEKS
}

// Surface mix: hard 50 / clay 35 / grass 15. One RNG draw.
function pickSurface(rng: Rng): Surface {
  const r = rng()
  if (r < 0.5) return 'hard'
  if (r < 0.85) return 'clay'
  return 'grass'
}

// Claim the free week nearest `target`, searching outward (forward first) within
// [lo, hi]. With at most floor(weeks/2)+floor(weeks/4)+floor(weeks/13) ≤ weeks
// events over a `weeks`-wide window there is always a free slot.
function claimWeek(used: Set<number>, target: number, lo: number, hi: number): number {
  const start = Math.min(Math.max(target, lo), hi)
  for (let d = 0; d <= hi - lo; d++) {
    const up = start + d
    if (up <= hi && !used.has(up)) {
      used.add(up)
      return up
    }
    if (d > 0) {
      const down = start - d
      if (down >= lo && !used.has(down)) {
        used.add(down)
        return down
      }
    }
  }
  throw new Error('buildSeason: no free week in span (over-subscribed)')
}

// Evenly-spaced ideal week for the i-th event of a tier that fires `count` times
// across the span, offset half a cadence in so events sit mid-interval.
function idealWeek(fromWeek: number, weeks: number, i: number, count: number): number {
  return fromWeek + Math.floor(((i + 0.5) * weeks) / count)
}

function makeEvent(week: number, tier: TierId, rng: Rng, background: FamilyBackground): SeasonEvent {
  const surface = pickSurface(rng)
  const [lo, hi] = TIERS[tier].travelCostCents
  // Draw first (byte-identical RNG), THEN scale by family means – the pickInt call is unchanged,
  // so the draw count/sequence is background-independent. This one scaled value is both what the
  // UI shows (UpcomingEvent.travelCostCents) and what enterEvent charges (chargeTravel), no divergence.
  const travelCostCents = Math.round(pickInt(rng, lo, hi) * ECONOMY.travelBgFactor[background])
  const year = Math.floor(week / 52)
  return {
    id: `${year}-w${week}-${tier}`,
    week,
    tier,
    surface,
    travelCostCents,
    deadlineWeek: week - 2, // entries close at the END of week - 2
  }
}

// A career's very first season must never spawn an event whose entry deadline
// (`week − 2`) is already in the past at week 0 – that showed a fresh career the
// "Entries closed" state on week 1 (round-5 item 2). Floor the first block's earliest
// placement at week 3 so the soonest deadline is week 1. Only the first block is
// affected (`fromWeek === 0`); later year-blocks start at 52, 104, … already.
export const MIN_FIRST_EVENT_WEEK = 3

// buildSeason – deterministic season for [fromWeek, fromWeek + weeks). National
// weeks are placed first, then regional, then local, so lower tiers bend around
// the higher ones: no two events share a week and local never lands on a national
// week. Counts scale as floor(weeks / everyNWeeks) per tier.
export function buildSeason(
  seedStr: string,
  fromWeek: number,
  weeks: number,
  background: FamilyBackground = 'middle',
): SeasonEvent[] {
  const rng = rngFromSeed(seedStr)
  const used = new Set<number>()
  const events: SeasonEvent[] = []
  // Floor the first career block so no event opens already-closed; the makeEvent draw
  // order is unchanged (only the claimed week shifts), so counts/surfaces/costs are stable.
  const lo = fromWeek === 0 ? MIN_FIRST_EVENT_WEEK : fromWeek
  const hi = fromWeek + weeks - 1

  // Off-season weeks are reserved FIRST, ahead of even the national tier, so no
  // event ever lands there (items 16/21).
  for (let w = lo; w <= hi; w++) if (isOffSeasonWeek(w)) used.add(w)

  // Highest tier first so its weeks are reserved before lower tiers are placed.
  const order: TierId[] = ['national', 'regional', 'local']
  for (const tier of order) {
    const cadence = TIERS[tier].everyNWeeks
    if (cadence === 0) continue
    const count = Math.floor(weeks / cadence)
    for (let i = 0; i < count; i++) {
      const target = idealWeek(fromWeek, weeks, i, count)
      const week = claimWeek(used, target, lo, hi)
      events.push(makeEvent(week, tier, rng, background))
    }
  }

  events.sort((a, b) => a.week - b.week)
  return events
}
