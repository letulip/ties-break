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

  it('upgrades a v8 save to v9: birth month backfilled deterministically from the seed', () => {
    const makeV8 = () => {
      // v8 profiles never had birthMonth – strip the DEFAULT_PROFILE static value so this
      // exercises the actual rngFromSeed(seed + ':bm') backfill, not a pass-through default.
      const profile: Record<string, unknown> = { ...DEFAULT_PROFILE, kidName: 'Petra', kidLastName: 'Novak' }
      delete profile.birthMonth
      return {
        schemaVersion: 8,
        careerId: 'c-v8',
        seed: 'birth-month-seed',
        week: 15,
        fundsCents: 4_000_00,
        profile,
        plan: { ...WEEK_PLAN_PRESETS.balanced },
        cohort: [],
        results: [],
        season: [],
        entries: [],
        events: [],
        nextEventId: 0,
        kidRank: 180,
        prevKidRank: 182,
        pendingTournament: null,
      }
    }
    const migrated = migrateSave(makeV8())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(typeof migrated.profile.birthMonth).toBe('number')
    expect(migrated.profile.birthMonth).toBeGreaterThanOrEqual(1)
    expect(migrated.profile.birthMonth).toBeLessThanOrEqual(12)
    // deterministic: the same seed backfills the same birth month across independent migrations
    expect(migrateSave(makeV8()).profile.birthMonth).toBe(migrated.profile.birthMonth)
  })

  it('backfills DIFFERENT birth months for different seeds (not a constant fallback)', () => {
    const makeV8 = (seed: string) => {
      const profile: Record<string, unknown> = { ...DEFAULT_PROFILE }
      delete profile.birthMonth
      return {
        schemaVersion: 8,
        careerId: `c-${seed}`,
        seed,
        week: 1,
        fundsCents: 0,
        profile,
        plan: { ...WEEK_PLAN_PRESETS.balanced },
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
    }
    const months = new Set(
      ['seed-a', 'seed-b', 'seed-c', 'seed-d', 'seed-e', 'seed-f'].map((s) => migrateSave(makeV8(s)).profile.birthMonth),
    )
    expect(months.size).toBeGreaterThan(1)
  })

  it('upgrades a v9 save to v10: bestFinishByTier backfilled from tournament events, rest defaulted', () => {
    const v9 = {
      schemaVersion: 9,
      careerId: 'c-v9',
      seed: 'tier-progress',
      week: 40,
      fundsCents: 6_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Ines', kidLastName: 'Duarte', birthMonth: 7 },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [
        { id: 0, week: 0, type: 'info', text: 'started', keep: true },
        { id: 1, week: 10, type: 'tournament', text: 'Local Open (clay, W10): Ines – Runner-up (+18 pts)', finishIdx: 1 },
        { id: 2, week: 22, type: 'tournament', text: 'Local Open (hard, W22): Ines – Champion (+30 pts)', finishIdx: 0 },
        { id: 3, week: 30, type: 'tournament', text: 'Regional Championship (grass, W30): Ines – Semifinalist (+28 pts)', finishIdx: 2 },
      ],
      nextEventId: 4,
      kidRank: 60,
      prevKidRank: 65,
      pendingTournament: null,
    }
    const migrated = migrateSave(v9)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // best (smallest) finish per tier, recovered from the tournament summaries' tier-label prefix
    expect(migrated.bestFinishByTier).toEqual({ local: 0, regional: 2 })
    expect(migrated.lastSeasonSummary).toBeNull()
    expect(migrated.seasonWins).toBe(0)
    expect(migrated.seasonLosses).toBe(0)
  })

  it('upgrades a v10 save to v11: financeWeeks rebuilt from retained finance events', () => {
    const v10 = {
      schemaVersion: 10,
      careerId: 'c-v10',
      seed: 'finance-ledger',
      week: 40,
      fundsCents: 5_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Lea', kidLastName: 'Meyer', birthMonth: 5 },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [
        { id: 0, week: 0, type: 'info', text: 'started', keep: true }, // non-financial: ignored
        { id: 1, week: 38, type: 'income', category: 'income', text: "Parents' contribution", amountCents: 30_000 },
        { id: 2, week: 38, type: 'expense', category: 'coaching', text: 'Coaching', amountCents: -45_000 },
        { id: 3, week: 39, type: 'expense', category: 'travel', text: 'Travel', amountCents: -9_000 },
        { id: 4, week: 39, type: 'expense', category: 'gear', text: 'Covered', amountCents: 0 }, // $0: skipped
        { id: 5, week: 2, type: 'expense', category: 'coaching', text: 'old', amountCents: -40_000 }, // within week-59 window at week 40, so retained
      ],
      nextEventId: 6,
      kidRank: 70,
      prevKidRank: 72,
      pendingTournament: null,
      bestFinishByTier: {},
      lastSeasonSummary: null,
      seasonWins: 0,
      seasonLosses: 0,
    }
    const migrated = migrateSave(v10)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(Array.isArray(migrated.financeWeeks)).toBe(true)
    // week-ascending, one entry per week that had >=1 nonzero financial event
    expect(migrated.financeWeeks.map((w) => w.week)).toEqual([2, 38, 39])
    // per-category signed sums are rebuilt from the events
    const w38 = migrated.financeWeeks.find((w) => w.week === 38)!
    expect(w38.byCategory).toEqual({ income: 30_000, coaching: -45_000 })
    // the $0 covered gear line-item never created a category entry
    const w39 = migrated.financeWeeks.find((w) => w.week === 39)!
    expect(w39.byCategory).toEqual({ travel: -9_000 })
  })

  it('upgrades a v11 save to v12: condition/injury/injuryHistory/physio backfilled to healthy defaults', () => {
    const v11 = {
      schemaVersion: 11,
      careerId: 'c-v11',
      seed: 'availability',
      week: 40,
      fundsCents: 7_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Nadia', kidLastName: 'Petrova', birthMonth: 4, coachSetup: 'hired' as const },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [{ playerId: 'kid', week: 38, points: 30, tier: 'local' as const }],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 55,
      prevKidRank: 58,
      pendingTournament: null,
      bestFinishByTier: { local: 1 },
      lastSeasonSummary: null,
      seasonWins: 2,
      seasonLosses: 1,
      financeWeeks: [],
    }
    const migrated = migrateSave(structuredClone(v11))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // four new fields at their healthy defaults
    expect(migrated.condition).toBe(100)
    expect(migrated.injury).toBeNull()
    expect(migrated.injuryHistory).toEqual([])
    expect(migrated.physioActive).toBe(true) // coachSetup 'hired'
    // everything else identical to the raw v11 save
    expect(migrated.seed).toBe(v11.seed)
    expect(migrated.week).toBe(v11.week)
    expect(migrated.fundsCents).toBe(v11.fundsCents)
    expect(migrated.results).toEqual(v11.results)
    expect(migrated.kidRank).toBe(v11.kidRank)
    // re-running migrateSave on the v12 output changes nothing (idempotent)
    expect(migrateSave(structuredClone(migrated))).toEqual(migrated)
  })

  // ⚠ RE-AIMED BY THE COACH LADDER (v22), and the protected fact is unchanged: a parent-coached
  // career migrates with physio OFF. What moved is where the v12 block LOOKS. It used to ask
  // `profile.coachSetup === 'hired'` and nothing else; v22 renames that field to `coachTier`, so
  // the block now asks the legacy field FIRST and falls back to the new one. The precedence
  // matters here specifically: this fixture is a v11 shape built by spreading today's
  // DEFAULT_PROFILE, so it carries BOTH `coachSetup: 'parent'` and (from the spread)
  // `coachTier: 'middle'` – a hybrid no real save has. The legacy field wins, which is the correct
  // reading for a genuine pre-v22 save and is what keeps this assertion true.
  it('v11 -> v12 physioActive follows the coach setup (parent coach -> false)', () => {
    const v11 = {
      schemaVersion: 11,
      careerId: 'c-v11b',
      seed: 'parent-coach',
      week: 12,
      fundsCents: 3_000_00,
      profile: { ...DEFAULT_PROFILE, coachSetup: 'parent' as const, birthMonth: 8 },
      plan: { ...WEEK_PLAN_PRESETS.balanced },
      cohort: [],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 120,
      prevKidRank: null,
      pendingTournament: null,
      bestFinishByTier: {},
      lastSeasonSummary: null,
      seasonWins: 0,
      seasonLosses: 0,
      financeWeeks: [],
    }
    const migrated = migrateSave(v11)
    expect(migrated.physioActive).toBe(false)
    expect(migrated.condition).toBe(100)
  })

  it('passes a current save through unchanged', () => {
    const current = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      careerId: 'c-s-abc',
      seed: 's',
      week: 1,
      fundsCents: 5,
      profile: { ...DEFAULT_PROFILE, kidName: 'Alexandra', kidLastName: 'Rossi', country: 'RS', birthMonth: 3 },
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
      bestFinishByTier: { local: 1 },
      lastSeasonSummary: null,
      seasonWins: 0,
      seasonLosses: 0,
      financeWeeks: [],
    }
    expect(migrateSave(current)).toEqual(current)
  })

  // v33 -> v34: THE ON-RAMP BACK-FILL, and it is EXACT rather than best-effort.
  //
  // A save's `results` are pruned to 52 weeks, so "has she ever been on the ITF table" is not a
  // question the results ledger can answer a year later - which is the whole reason the field has to
  // exist at all. `bestFinishByTier` can: it is a HIGH-WATER MARK that is never pruned, so a tier
  // appears in it if she has ever finished an event there, however long ago. That is the difference
  // between a girl keeping the access she earned and a girl being asked to earn it twice.
  it('v33 -> v34 latches the on-ramp from the never-pruned high-water marks', () => {
    const base = {
      schemaVersion: 33,
      seed: 's',
      week: 400,
      profile: { kidLastName: 'X', background: 'middle', coachTier: 'self', birthMonth: 1, birthDay: 1 },
      results: [], // a year on from anything she played - the ledger has forgotten it
    }
    // She finished J60s once upon a time. The evidence survives, so the door does.
    const played = migrateSave({ ...base, bestFinishByTier: { local: 0, j60: 5 } })
    expect(played.onRampCleared).toEqual({ itf: true, wta: false })

    // She never left the domestic table. Nothing latches, and that is correct - the on-ramp is a
    // rung, not a formality, and a migration must not hand her a table she never reached.
    const homeOnly = migrateSave({ ...base, bestFinishByTier: { local: 0, national: 2 } })
    expect(homeOnly.onRampCleared).toEqual({ itf: false, wta: false })

    // The adult table latches on its own marks, independently of the junior one.
    const pro = migrateSave({ ...base, bestFinishByTier: { j300: 1, w15: 3 } })
    expect(pro.onRampCleared).toEqual({ itf: true, wta: true })
  })

  // Append-only means idempotent: a second pass must not overwrite what the first decided, and a
  // save that already carries the field is left exactly as it is.
  it('v33 -> v34 leaves an existing onRampCleared alone', () => {
    const migrated = migrateSave({
      schemaVersion: 33,
      seed: 's',
      week: 10,
      profile: { kidLastName: 'X', background: 'middle', coachTier: 'self', birthMonth: 1, birthDay: 1 },
      results: [],
      bestFinishByTier: {},
      onRampCleared: { itf: true, wta: true },
    })
    expect(migrated.onRampCleared).toEqual({ itf: true, wta: true })
  })

  it('rejects saves from a future schema', () => {
    expect(() => migrateSave({ schemaVersion: 999, seed: 's', week: 1 })).toThrow(/newer/)
  })

  it('rejects corrupted saves', () => {
    expect(() => migrateSave({ schemaVersion: SAVE_SCHEMA_VERSION })).toThrow(/corrupted/i)
  })
})
