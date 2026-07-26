// Package L – tournament calendar. Pure: the season is a deterministic function
// of a seed string and a week span. No worker/DOM/IndexedDB, no Math.random –
// all randomness flows from a season sub-RNG (rngFromSeed(seedStr)).

import { rngFromSeed, pickInt, type Rng } from '../rng'
import type { Surface } from '../match/types'
import type { FamilyBackground } from '../../shared/protocol'
import { ECONOMY } from '../economy'
import type { SeasonEvent, TierDef, TierId } from './types'

// Tier catalogue. Economy numbers are whole cents. `points` length = rounds + 1
// (rounds = log2(drawSize)); index 0 = champion. Every tier is LIVE – the inert `itf`
// placeholder became the j30/j60/j300 family in the ladder-up slice.
//
// THE LADDER (owner: "there must ALWAYS be somewhere to go"). Two overlapping ladders,
// both read off the kid's EARNED windowed best-6 points:
//
//   pts →      0      65    85   150  180        230        400            900
//   local      ├───────────────┤
//   regional          ├──────────────────────────┤
//   national                    ├──────────────────────────────────────────────→ ∞
//   j30                              ├─────────────────────────────────────────→ ∞
//   j60                                          ────────────├───────────────  → ∞
//   j300                                                                  ├───→ ∞
//
// Read it as: she never falls off the bottom (local opens at 0), she is never stranded at the
// top (national and every J level use the MAX sentinel so they never graduate her out), and at
// every total from 150 up at least TWO rungs are open at once, so the handover is a choice
// rather than a cliff. Only local and regional graduate her – the two tiers she is meant to
// outgrow. NO junior level pays prize money (real rule: juniors pay to play), which is the
// whole "invest without knowing the return" thesis: international travel out, points only back.
export const TIERS: Record<TierId, TierDef> = {
  local: {
    id: 'local',
    label: 'Local Open',
    drawSize: 8,
    entryFeeCents: 40_00,
    travelCostCents: [60_00, 120_00],
    points: [30, 18, 10, 5],
    everyNWeeks: 2,
    // The ENTRY tier: open from 0 points (a fresh kid always starts here), graduates out once she has
    // clearly outgrown it (best-6 > 85 pts – roughly three strong local runs). Tuned on the bench so a
    // fresh career shows a real early local phase before the regional/national climb.
    enterPointBand: [0, 85],
    // The bottom 45% of the standings – the draw a kid can genuinely win her first title in.
    entrantPctBand: [0.55, 1.0],
  },
  regional: {
    id: 'regional',
    label: 'Regional Championship',
    drawSize: 16,
    entryFeeCents: 75_00,
    travelCostCents: [150_00, 400_00],
    points: [80, 48, 28, 14, 6],
    everyNWeeks: 4,
    // Opens once she has a couple of counting results (65 pts); graduates out at 230. Overlaps local
    // (65-85) and national (150-230), so the climb is a smooth local → regional → national handover.
    enterPointBand: [65, 230],
    entrantPctBand: [0.4, 0.88],
  },
  national: {
    id: 'national',
    label: 'National Series',
    drawSize: 32,
    entryFeeCents: 120_00,
    travelCostCents: [400_00, 900_00],
    points: [200, 120, 70, 35, 15, 6],
    everyNWeeks: 13,
    // R9-20 (owner): 4 a year is far too sparse for a kid who has outgrown regional but cannot yet
    // afford the international calendar, and the shortage bites hardest in the season's back half
    // (the base cadence puts the last one around week 45). Two EXTRA nationals in the second half
    // takes it to 6/season – a modest bump that keeps the tier prestigious while giving the
    // 150-180 point window a real bridge into the J ladder.
    secondHalfBonus: 2,
    // Opens at 150 pts; never graduates (sentinel maxPoints keeps the top of the ladder always open).
    enterPointBand: [150, Number.MAX_SAFE_INTEGER],
    // The domestic elite is a mid-table field once the real prospects are away on the J tour.
    entrantPctBand: [0.2, 0.7],
  },
  // --- the junior international tour (age 13+, no prize money) --------------------------------
  // Real ladder: J500/J300/J200/J100/J60/J30, with J30+J60 = 75% of ALL events. We ship the two
  // dense entry levels plus one rare prestige level; the rest is content later. Points scale with
  // the level off the j30 array (j60 = ×1.5, j300 = ×2.5), and j30 already out-scores a National
  // at every finish – an international result is worth more than a domestic one of the same round.
  j30: {
    id: 'j30',
    label: 'Junior Tour 30',
    drawSize: 32,
    entryFeeCents: 200_00,
    travelCostCents: [900_00, 2000_00],
    points: [400, 240, 140, 70, 30, 12],
    // THE dense entry level – with regional it is what makes an empty week a choice, not a gap.
    everyNWeeks: 2,
    minAgeYears: 13,
    // Opens at 180: one National quarter-final (35) on top of a regional book gets her there, so
    // the international door opens while regional (≤230) is still open and national is already
    // live. Never closes – a J30 stays a legitimate week even for a strong junior.
    enterPointBand: [180, Number.MAX_SAFE_INTEGER],
    entrantPctBand: [0.12, 0.6],
  },
  j60: {
    id: 'j60',
    label: 'Junior Tour 60',
    drawSize: 32,
    entryFeeCents: 250_00,
    travelCostCents: [1100_00, 2400_00],
    points: [600, 360, 210, 105, 45, 18],
    everyNWeeks: 3,
    minAgeYears: 13,
    // 400 = one J30 title, or three J30 semi-finals. A real body of international results, not one
    // lucky week.
    enterPointBand: [400, Number.MAX_SAFE_INTEGER],
    entrantPctBand: [0.05, 0.4],
  },
  j300: {
    id: 'j300',
    label: 'Junior Tour 300',
    drawSize: 32,
    entryFeeCents: 400_00,
    travelCostCents: [1600_00, 3200_00],
    points: [1000, 600, 350, 175, 75, 30],
    // Rare by design: four a year, so each one is an event the family plans a season around.
    everyNWeeks: 13,
    minAgeYears: 13,
    // 900 ≈ a J60 title plus a deep second run – the point at which she is one of the field's best.
    enterPointBand: [900, Number.MAX_SAFE_INTEGER],
    entrantPctBand: [0.0, 0.25],
  },
}

/** The catalogue in ladder order, weakest rung first. The single source of truth for "is tier A
 *  above tier B" – used for scheduling precedence, the tier guide, the Home season strip and
 *  every monotonicity check in the tests. */
export const TIER_LADDER: readonly TierId[] = ['local', 'regional', 'national', 'j30', 'j60', 'j300']

// Tier ids ordered by DESCENDING label length – the scan order tierFromLabel needs. "Junior Tour
// 30" is a prefix of "Junior Tour 300", so a first-match scan would report every J300 result as a
// J30 one. Derived, not hand-written, so a future label can never silently reintroduce the bug.
const TIER_IDS_BY_LABEL_LENGTH: readonly TierId[] = [...TIER_LADDER].sort(
  (a, b) => TIERS[b].label.length - TIERS[a].label.length,
)

/** The tier a tournament-summary line belongs to. Summaries read `${TIERS[tier].label} (…)`, so
 *  this is a longest-label-first prefix match. Used by the v10 save migration (rebuilding
 *  bestFinishByTier from historical events) and by the avatar-emotion title lookup – ONE
 *  implementation, so the prefix hazard is handled in exactly one place. */
export function tierFromLabel(text: string): TierId | undefined {
  return TIER_IDS_BY_LABEL_LENGTH.find((t) => text.startsWith(TIERS[t].label))
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

/** True for a school-exam blackout week – the season-week offset falls inside one of
 *  ECONOMY.availability.examWeeks. Exported so the planner UI can label the calendar row
 *  honestly ("School exams") instead of calling it a training week.
 *  (Lives here, with its off-season sibling, since the rival-life slice: a week's TYPE is a
 *  property of the calendar, and the cohort's condition accrual has to read it without
 *  importing world.ts. world.ts re-exports both under their historical names.) */
export function isExamWeek(week: number): boolean {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return ECONOMY.availability.examWeeks.some(([lo, hi]) => offset >= lo && offset <= hi)
}

/** A "blackout" week for tournaments: the off-season tail (already event-free) or a school-exam
 *  block. Used by the condition accumulators (extra recovery, for the kid AND the cohort) and by
 *  the availability gate. */
export function isBlackoutWeek(week: number): boolean {
  return isOffSeasonWeek(week) || isExamWeek(week)
}

// Surface mix: hard 50 / clay 35 / grass 15. One RNG draw.
function pickSurface(rng: Rng): Surface {
  const r = rng()
  if (r < 0.5) return 'hard'
  if (r < 0.85) return 'clay'
  return 'grass'
}

// Claim the free week nearest `target`, searching outward (forward first) within
// [lo, hi]. `used` is PER TIER (plus the shared off-season reservation), so different tiers may
// share a week – see buildSeason – while a tier never runs two events in the same one. The
// densest tier claims floor(weeks/2) slots out of `weeks - OFF_SEASON_WEEKS`, so a free slot
// always exists.
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

// Evenly-spaced ideal week for the i-th event of a tier that fires `count` times across the span,
// offset `phase` cadences in (0.5 = mid-interval, the historical value).
//
// `phase` exists because two tiers with the SAME cadence would otherwise target exactly the same
// weeks and stack on top of each other – local and j30 both fire every 2 weeks, national and j300
// both every 13. Stacking is allowed, but a calendar where 92 events pile onto 39 weeks and leave
// 7 empty is the opposite of the owner's "always somewhere to go". A per-rung phase interleaves
// them instead, so the same event count covers far more of the season.
function idealWeek(fromWeek: number, weeks: number, i: number, count: number, phase = 0.5): number {
  return fromWeek + Math.floor(((i + phase) * weeks) / count)
}

/** Phase offset for a tier, spread evenly over one whole cadence across the ladder – so equal-cadence
 *  rungs (local/j30, national/j300) land in each other's gaps rather than on each other. */
function tierPhase(tier: TierId): number {
  return 0.5 + TIER_LADDER.indexOf(tier) / TIER_LADDER.length
}

function makeEvent(
  seedStr: string,
  week: number,
  tier: TierId,
  rng: Rng,
  background: FamilyBackground,
): SeasonEvent {
  const surface = pickSurface(rng)
  const [lo, hi] = TIERS[tier].travelCostCents
  // Draw the base travel first (byte-identical MAIN-stream RNG – the pickInt call/sequence is
  // background-independent, so the calendar structure and the world's RNG identity hold). Then map a
  // per-trip factor out of the background's CORRIDOR using a PURPOSE-SCOPED sub-stream keyed by the
  // event (week+tier) – independent of both the main weekly stream and this season stream, so it is
  // identity-safe. Same roll across backgrounds → the same relative draw, only the corridor differs.
  // This one factored value is both what the UI shows (UpcomingEvent.travelCostCents) and what
  // enterEvent charges (chargeTravel), no divergence.
  const baseTravelCents = pickInt(rng, lo, hi)
  const [cLo, cHi] = ECONOMY.travelBgFactor[background]
  const roll = rngFromSeed(`${seedStr}:travelbg:${week}:${tier}`)()
  const travelCostCents = Math.round(baseTravelCents * (cLo + roll * (cHi - cLo)))
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

// buildSeason – deterministic season for [fromWeek, fromWeek + weeks). Tiers are placed
// strongest-first (j300 → … → local) so the rare prestige weeks are chosen before the dense ones
// bend around them. Counts scale as floor(weeks / everyNWeeks) per tier, plus each tier's
// optional `secondHalfBonus` inside the season's back half.
//
// ONE EVENT PER TIER PER WEEK, NOT ONE EVENT PER WEEK (ladder-up). The pre-J calendar carried 43
// events over 49 playable weeks and could keep a global one-per-week rule; the J family takes it
// to ~92, which no longer fits – and should not. The real tour runs many events the same week,
// and the owner's point is exactly that: "with J-tiers, empty weeks stop being boredom and become
// CHOICE – where to go, what it costs, what her body can take". Occupancy is therefore tracked
// PER TIER (each tier still gets a unique week, which is what keeps the `${year}-w${week}-${tier}`
// ids unique), while the off-season reservation stays global so no tier can schedule into it.
// The kid can still only play one of them: `enterEvent` refuses a second entry in the same week.
export function buildSeason(
  seedStr: string,
  fromWeek: number,
  weeks: number,
  background: FamilyBackground = 'middle',
): SeasonEvent[] {
  const rng = rngFromSeed(seedStr)
  const events: SeasonEvent[] = []
  // Floor the first career block so no event opens already-closed; the makeEvent draw
  // order is unchanged (only the claimed week shifts), so counts/surfaces/costs are stable.
  const lo = fromWeek === 0 ? MIN_FIRST_EVENT_WEEK : fromWeek
  const hi = fromWeek + weeks - 1

  // Off-season weeks are reserved for EVERY tier, so no event ever lands there (items 16/21).
  const offSeason = new Set<number>()
  for (let w = lo; w <= hi; w++) if (isOffSeasonWeek(w)) offSeason.add(w)

  // Strongest tier first, so the scarce high-tier weeks are picked before the dense ones fill in.
  const order: TierId[] = [...TIER_LADDER].reverse()
  for (const tier of order) {
    const def = TIERS[tier]
    const cadence = def.everyNWeeks
    if (cadence === 0) continue
    const used = new Set<number>(offSeason)
    const phase = tierPhase(tier)
    const count = Math.floor(weeks / cadence)
    for (let i = 0; i < count; i++) {
      const target = idealWeek(fromWeek, weeks, i, count, phase)
      const week = claimWeek(used, target, lo, hi)
      events.push(makeEvent(seedStr, week, tier, rng, background))
    }
    // R9-20: the extra events a tier gets in the season's SECOND half only (national densification).
    const bonus = def.secondHalfBonus ?? 0
    if (bonus > 0) {
      const halfFrom = fromWeek + Math.floor(weeks / 2)
      const halfWeeks = weeks - Math.floor(weeks / 2)
      for (let i = 0; i < bonus; i++) {
        const target = idealWeek(halfFrom, halfWeeks, i, bonus, phase)
        const week = claimWeek(used, target, Math.max(lo, halfFrom), hi)
        events.push(makeEvent(seedStr, week, tier, rng, background))
      }
    }
  }

  // Week-ascending; within a week, strongest tier first so the season list reads as a ladder.
  const rung = (t: TierId) => TIER_LADDER.indexOf(t)
  events.sort((a, b) => a.week - b.week || rung(b.tier) - rung(a.tier))
  return events
}
