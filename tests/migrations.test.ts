import { describe, it, expect } from 'vitest'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'

describe('save migrations', () => {
  it('upgrades a v0 save to the current schema', () => {
    const v0 = { seed: 'old-timer', week: 42, log: ['W42: something'] }
    const migrated = migrateSave(v0)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.fundsCents).toBe(20_000_00)
    expect(migrated.week).toBe(42)
    expect(migrated.profile).toEqual(DEFAULT_PROFILE)
  })

  it('upgrades a v1 save: gains the default player profile', () => {
    const v1 = { schemaVersion: 1, seed: 'bublik-junior', week: 52, fundsCents: -285_600, log: [] }
    const migrated = migrateSave(v1)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.fundsCents).toBe(-285_600)
    expect(migrated.profile).toEqual(DEFAULT_PROFILE)
  })

  it('upgrades a v2 save: profile gains the default play style', () => {
    const v2 = {
      schemaVersion: 2,
      seed: 's',
      week: 3,
      fundsCents: 100,
      profile: { kidName: 'Iga', gender: 'girl', country: 'PL', background: 'working', coachSetup: 'parent' },
      log: [],
    }
    const migrated = migrateSave(v2)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.profile.playStyle).toBe('all-court')
    expect(migrated.profile.kidName).toBe('Iga')
  })

  it('upgrades a v3 save: gains the default week plan', () => {
    const v3 = {
      schemaVersion: 3,
      seed: 's',
      week: 9,
      fundsCents: 42,
      profile: { ...DEFAULT_PROFILE },
      log: [],
    }
    const migrated = migrateSave(v3)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.plan).toEqual(WEEK_PLAN_PRESETS.balanced)
  })

  it('passes a current save through unchanged', () => {
    const current = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      seed: 's',
      week: 1,
      fundsCents: 5,
      profile: { ...DEFAULT_PROFILE, kidName: 'Alexandra', country: 'RS' },
      plan: { train: 85, rest: 15 },
      log: [],
    }
    expect(migrateSave(current)).toEqual(current)
  })

  it('rejects saves from a future schema', () => {
    expect(() => migrateSave({ schemaVersion: 999, seed: 's', week: 1 })).toThrow(/newer/)
  })

  it('rejects corrupted saves', () => {
    expect(() => migrateSave({ schemaVersion: SAVE_SCHEMA_VERSION })).toThrow(/corrupted/i)
  })
})
