import { type Rng, pickInt } from './rng'
import {
  DEFAULT_PROFILE,
  WEEK_PLAN_PRESETS,
  type FamilyBackground,
  type PlayerProfile,
  type Snapshot,
  type WeekPlan,
} from '../shared/protocol'

// Phase-0 placeholder world: just enough state to prove the full pipeline
// (worker ownership, deterministic ticks, save/load/export). Real systems land in Phases 1+.

export const SAVE_SCHEMA_VERSION = 4

/** Detailed weekly simulation starts here; childhood becomes a prologue (Phase 6). */
export const START_AGE_YEARS = 14

export interface WorldState {
  schemaVersion: number
  seed: string
  week: number
  fundsCents: number
  profile: PlayerProfile
  plan: WeekPlan
  log: string[]
}

export const STARTING_FUNDS_CENTS: Record<FamilyBackground, number> = {
  wealthy: 120_000_00,
  middle: 25_000_00,
  working: 8_000_00,
}

// Weekly expense draw ranges in cents. A parent-coach saves on coaching fees;
// the ranges differ but the RNG draw COUNT per tick must stay identical across
// profiles – the load-time RNG replay depends on it.
const EXPENSE_RANGE: Record<PlayerProfile['coachSetup'], [number, number]> = {
  hired: [250_00, 700_00],
  parent: [120_00, 400_00],
}

// Two flavor lists, same length: the list is chosen deterministically from the
// plan, so the RNG draw COUNT per tick never depends on player input (the
// load-time RNG replay requires it).
const TRAIN_EVENTS = [
  'Coaching block: technique drills',
  'Coaching block: footwork and conditioning',
  'Practice sets at the local club',
  'Sparring with the older kids',
  'Video session: studying her last matches',
]

const REST_EVENTS = [
  'Light week: school catches up',
  'Family weekend away from the courts',
  'Recovery week: stretching and pool',
  'Hitting for fun, no drills',
  'Off week: she reread her favorite book',
]

/** Weekly expense scale from the time split: train 75% ≈ 1.0, more training costs more. */
function planExpenseFactor(plan: WeekPlan): number {
  return 0.55 + 0.006 * plan.train
}

export function createWorld(seed: string, profile: PlayerProfile = DEFAULT_PROFILE): WorldState {
  const fundsCents = STARTING_FUNDS_CENTS[profile.background]
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    seed,
    week: 0,
    fundsCents,
    profile,
    plan: { ...WEEK_PLAN_PRESETS.balanced },
    log: [
      `${profile.kidName}'s career started (seed "${seed}"). Family budget: $${(fundsCents / 100).toLocaleString('en-US')}.`,
    ],
  }
}

export function tickWeek(world: WorldState, rng: Rng): void {
  world.week += 1
  const [lo, hi] = EXPENSE_RANGE[world.profile.coachSetup]
  const expense = Math.round(pickInt(rng, lo, hi) * planExpenseFactor(world.plan))
  world.fundsCents -= expense
  const events = world.plan.train >= 70 ? TRAIN_EVENTS : REST_EVENTS
  let line = `W${world.week}: ${events[pickInt(rng, 0, events.length - 1)]}, spent $${(expense / 100).toFixed(0)}.`
  if (rng() < 0.06) {
    const gift = pickInt(rng, 500_00, 1500_00)
    world.fundsCents += gift
    line += ` Local sponsor chipped in $${(gift / 100).toFixed(0)}!`
  }
  world.log.push(line)
  if (world.log.length > 200) world.log.splice(0, world.log.length - 200)
}

export function toSnapshot(world: WorldState): Snapshot {
  return {
    schemaVersion: world.schemaVersion,
    seed: world.seed,
    week: world.week,
    ageYears: START_AGE_YEARS + Math.floor(world.week / 52),
    fundsCents: world.fundsCents,
    profile: world.profile,
    plan: world.plan,
    log: [...world.log].reverse().slice(0, 60),
  }
}
