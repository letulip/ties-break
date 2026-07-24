import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../shared/protocol'
import { SAVE_SCHEMA_VERSION, seedWorldForV6, type WorldState } from './world'
import { pickSurname } from './season/cohort'
import { rngFromSeed, pickInt } from './rng'

// Save-data migrations. Append-only: never renumber, never delete a block.
// Each `if (v < N)` block upgrades from N-1 to N and must be idempotent for its version.

export function migrateSave(raw: unknown): WorldState {
  // `log` is a pre-v6 field (dropped from WorldState when Snapshot switched to
  // structured events); keep it typed here so the historical blocks can touch it.
  const save = raw as Partial<WorldState> & { schemaVersion?: number; log?: string[] }
  let v = save.schemaVersion ?? 0

  if (v < 1) {
    // v0: pre-release dev saves had no fundsCents
    if (typeof save.fundsCents !== 'number') save.fundsCents = 20_000_00
    if (!Array.isArray(save.log)) save.log = []
    v = 1
  }

  if (v < 2) {
    // v2 added the player profile (onboarding); v1 careers get the demo defaults
    save.profile = { ...DEFAULT_PROFILE }
    v = 2
  }

  if (v < 3) {
    // v3 added playStyle to the profile
    if (save.profile && !save.profile.playStyle) save.profile.playStyle = 'all-court'
    v = 3
  }

  if (v < 4) {
    // v4 added the weekly time plan
    save.plan ??= { ...WEEK_PLAN_PRESETS.balanced }
    v = 4
  }

  if (v < 5) {
    // v5 added careerId (career profiles / save generations); pre-v5 saves are one career per seed
    if (typeof save.careerId !== 'string') save.careerId = `legacy-${save.seed}`
    v = 5
  }

  if (v < 6) {
    // v6 added the living world: cohort, rolling season, results, structured events.
    // Old `log` strings become `info` events; the `log` field is dropped (Snapshot
    // switches to events). Cohort/season are regenerated deterministically from the seed.
    if (typeof save.seed === 'string' && typeof save.week === 'number') {
      seedWorldForV6(save as Partial<WorldState> & { seed: string; week: number; log?: string[] })
    }
    v = 6
  }

  if (v < 7) {
    // v7 added the kid's family name + the previous-week rank cache. The last name
    // defaults deterministically from the seed's surname sub-RNG (same pool the cohort draws).
    if (save.profile && typeof save.profile.kidLastName !== 'string') {
      save.profile.kidLastName = pickSurname(typeof save.seed === 'string' ? save.seed : '')
    }
    if (save.prevKidRank === undefined) save.prevKidRank = null
    v = 7
  }

  if (v < 8) {
    // v8 added the tournament-reveal flow: a week with the kid's event pauses into
    // world.pendingTournament instead of resolving inline. Old saves were never mid-reveal.
    if (save.pendingTournament === undefined) save.pendingTournament = null
    v = 8
  }

  if (v < 9) {
    // v9 added the profile's birth month (relative-age-effect groundwork, round-3 QA item
    // 16; round-6 bundle). Pre-v9 saves never chose one at onboarding, so it's backfilled
    // deterministically from the seed – same pattern as v7's kidLastName backfill – rather
    // than collapsing to the static DEFAULT_PROFILE value, so two different legacy careers
    // don't all land on the same birth month.
    if (save.profile && typeof save.profile.birthMonth !== 'number') {
      const seed = typeof save.seed === 'string' ? save.seed : ''
      save.profile.birthMonth = pickInt(rngFromSeed(`${seed}:bm`), 1, 12)
    }
    v = 9
  }

  if (v !== SAVE_SCHEMA_VERSION) {
    throw new Error(`Save schema ${v} is newer than supported ${SAVE_SCHEMA_VERSION}`)
  }
  save.schemaVersion = v
  if (typeof save.seed !== 'string' || typeof save.week !== 'number' || typeof save.profile !== 'object') {
    throw new Error('Corrupted save: missing seed/week/profile')
  }
  return save as WorldState
}
