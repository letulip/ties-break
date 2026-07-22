// Typed message protocol between UI and the sim worker.
// The worker owns the authoritative state; the UI only ever sees snapshots.

export type FamilyBackground = 'wealthy' | 'middle' | 'working'
export type CoachSetup = 'parent' | 'hired'
/** An inclination, not numbers: weights future skill growth (Phase 4), gives build identity now. */
export type PlayStyle = 'aggressive' | 'counterpuncher' | 'serve-first' | 'all-court'

export interface PlayerProfile {
  kidName: string
  /** boys' tour is post-v1 content */
  gender: 'girl'
  /** ISO 3166-1 alpha-2, e.g. 'RU'; flag emoji is derived from it in the UI */
  country: string
  background: FamilyBackground
  coachSetup: CoachSetup
  playStyle: PlayStyle
}

export const DEFAULT_PROFILE: PlayerProfile = {
  kidName: 'Vera',
  gender: 'girl',
  country: 'US',
  background: 'middle',
  coachSetup: 'hired',
  playStyle: 'all-court',
}

/** Weekly time split in percent; train + rest === 100. */
export interface WeekPlan {
  train: number
  rest: number
}

export const WEEK_PLAN_PRESETS: Record<'grind' | 'balanced' | 'light', WeekPlan> = {
  grind: { train: 85, rest: 15 },
  balanced: { train: 75, rest: 25 },
  light: { train: 60, rest: 40 },
}

export interface Snapshot {
  schemaVersion: number
  seed: string
  week: number
  /** derived: detailed simulation starts at 14 */
  ageYears: number
  fundsCents: number
  profile: PlayerProfile
  plan: WeekPlan
  log: string[]
}

export interface SlotMeta {
  slot: string
  savedAt: number
  week: number
  seed: string
  bytes: number
}

export type ToWorker =
  | { id: number; type: 'new'; seed: string; profile: PlayerProfile }
  | { id: number; type: 'tick'; weeks: number }
  | { id: number; type: 'setPlan'; plan: WeekPlan }
  | { id: number; type: 'save'; slot?: string }
  | { id: number; type: 'load'; slot: string }
  | { id: number; type: 'listSlots' }
  | { id: number; type: 'deleteSlot'; slot: string }
  | { id: number; type: 'exportSave' }
  | { id: number; type: 'importSave'; bytes: ArrayBuffer }

export type ToUI =
  | { id: number; ok: true; type: 'snapshot'; snapshot: Snapshot }
  | { id: number; ok: true; type: 'slots'; slots: SlotMeta[] }
  | { id: number; ok: true; type: 'exported'; bytes: ArrayBuffer; filename: string }
  | { id: number; ok: false; error: string }
