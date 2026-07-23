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

  it('upgrades a v4 save: careerId backfilled as legacy-<seed>', () => {
    const v4 = {
      schemaVersion: 4,
      seed: 'coco-2004',
      week: 12,
      fundsCents: 999,
      profile: { ...DEFAULT_PROFILE },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      log: [],
    }
    const migrated = migrateSave(v4)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.careerId).toBe('legacy-coco-2004')
    expect(migrated.week).toBe(12)
  })

  it('upgrades a v5 save to v6: old log becomes info events, world systems generated', () => {
    const v5 = {
      schemaVersion: 5,
      careerId: 'c-migrate-abc',
      seed: 'migrate-me',
      week: 30,
      fundsCents: 5_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Coco' },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      log: ['W1: technique drills', 'W2: recovery week'],
    }
    const migrated = migrateSave(v5)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // cohort + rolling season regenerated deterministically from the seed
    expect(migrated.cohort.length).toBe(199)
    expect(migrated.season.length).toBeGreaterThan(0)
    const maxWeek = Math.max(...migrated.season.map((e) => e.week))
    expect(maxWeek - migrated.week).toBeGreaterThanOrEqual(26)
    // old log lines become info events, in order; the log field is gone
    const infoTexts = migrated.events.filter((e) => e.type === 'info').map((e) => e.text)
    expect(infoTexts).toEqual(['W1: technique drills', 'W2: recovery week'])
    expect('log' in migrated).toBe(false)
    expect(migrated.results).toEqual([])
    expect(migrated.entries).toEqual([])
    expect(typeof migrated.kidRank).toBe('number')
    expect(migrated.nextEventId).toBe(migrated.events.length)
    // profile survives
    expect(migrated.profile.kidName).toBe('Coco')
  })

  it('regenerates the same cohort/season for a given seed across migrations', () => {
    const make = () => migrateSave({
      schemaVersion: 5,
      careerId: 'c-1',
      seed: 'stable-seed',
      week: 10,
      fundsCents: 1_000_00,
      profile: { ...DEFAULT_PROFILE },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      log: [],
    })
    expect(make().cohort).toEqual(make().cohort)
    expect(make().season).toEqual(make().season)
  })

  it('upgrades a v6 save to v7: kidLastName (deterministic from seed) + prevKidRank default', () => {
    const makeV6 = () => {
      const profile: Record<string, unknown> = { ...DEFAULT_PROFILE, kidName: 'Mirra' }
      delete profile.kidLastName // v6 profiles had no family name
      return {
        schemaVersion: 6,
        careerId: 'c-v6',
        seed: 'family-name',
        week: 8,
        fundsCents: 3_000_00,
        profile,
        plan: { ...WEEK_PLAN_PRESETS.balanced },
        cohort: [],
        results: [],
        season: [],
        entries: [],
        events: [],
        nextEventId: 0,
        kidRank: 200,
      }
    }
    const migrated = migrateSave(makeV6())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(typeof migrated.profile.kidLastName).toBe('string')
    expect(migrated.profile.kidLastName.length).toBeGreaterThan(0)
    expect(migrated.prevKidRank).toBeNull()
    // deterministic: the same seed backfills the same surname across independent migrations
    expect(migrateSave(makeV6()).profile.kidLastName).toBe(migrated.profile.kidLastName)
  })

  it('upgrades a v7 save to v8: pendingTournament defaults to null', () => {
    const v7 = {
      schemaVersion: 7,
      careerId: 'c-v7',
      seed: 'no-reveal-yet',
      week: 20,
      fundsCents: 2_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Naomi', kidLastName: 'Kato' },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 150,
      prevKidRank: 152,
    }
    const migrated = migrateSave(v7)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.pendingTournament).toBeNull()
  })

  it('passes a current save through unchanged', () => {
    const current = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      careerId: 'c-s-abc',
      seed: 's',
      week: 1,
      fundsCents: 5,
      profile: { ...DEFAULT_PROFILE, kidName: 'Alexandra', kidLastName: 'Rossi', country: 'RS' },
      plan: { train: 85, rest: 15 },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 200,
      prevKidRank: null,
      pendingTournament: null,
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
