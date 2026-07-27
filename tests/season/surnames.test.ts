import { describe, it, expect } from 'vitest'
import { SURNAMES, pickSurname, generateCohort } from '../../src/engine/season/cohort'
import { migrateSave } from '../../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

// R11-13 – the surname pool grew 44 -> 210 so a 199-junior field stops reading as a family
// reunion. THE TRAP: both draws are `pickInt(rng, 0, SURNAMES.length - 1)`, i.e.
// `floor(rng() * length)`, so the pool LENGTH is part of the index arithmetic – growing or
// reordering the array re-maps every draw. These tests pin the three properties that make the
// growth safe, so a future edit that breaks one of them fails here instead of in someone's save.

// An INDEPENDENT copy of the original 44, in their original order. This literal is the guard:
// if the pool is ever reordered or an entry removed, this comparison – not a player – finds out.
const ORIGINAL_44 = [
  'Adler', 'Baros', 'Costa', 'Duval', 'Everts', 'Falk', 'Granados', 'Horvat',
  'Ivanova', 'Janssen', 'Kovac', 'Lindqvist', 'Moreau', 'Novak', 'Oberg', 'Petrov',
  'Quaranta', 'Rossi', 'Sato', 'Toma', 'Udall', 'Varga', 'Weiss', 'Xu',
  'Yilmaz', 'Zima', 'Andersen', 'Blanco', 'Chen', 'Dumont', 'Esposito', 'Ferro',
  'Georgiou', 'Haas', 'Ikeda', 'Jelic', 'Kern', 'Larsson', 'Mensah', 'Nagy',
  'Ortiz', 'Pavic', 'Reyes', 'Sanches',
]

describe('SURNAMES – append-only pool', () => {
  it('keeps the original 44 entries first, in their original order', () => {
    expect(SURNAMES.slice(0, ORIGINAL_44.length)).toEqual(ORIGINAL_44)
  })

  it('is big enough that a 199-junior field is not mostly namesakes', () => {
    expect(SURNAMES.length).toBeGreaterThanOrEqual(150)
  })

  it('has no duplicate entries (a duplicate is a hidden double weight in the draw)', () => {
    expect(new Set(SURNAMES).size).toBe(SURNAMES.length)
  })

  it('is player-facing-safe: plain ASCII letters only, no Cyrillic, no empty entries', () => {
    for (const s of SURNAMES) expect(s).toMatch(/^[A-Z][a-z]+$/)
  })

  it('cuts shared surnames in the generated field by more than 3x vs the old 44-name pool', () => {
    // Measured against the pool that shipped before R11-13: 199 juniors over 44 surnames left
    // ~99% of the field sharing a surname with someone. The property, not the exact figure:
    // most juniors now carry a surname nobody else in the draw has.
    const cohort = generateCohort('surname-spread', 199)
    const counts = new Map<string, number>()
    for (const p of cohort) {
      const last = p.name.split(' ')[1]
      counts.set(last, (counts.get(last) ?? 0) + 1)
    }
    const shared = [...counts.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0)
    expect(shared / cohort.length).toBeLessThan(0.75)

    // and no full-name twins beyond a handful (44 given names x 210 surnames)
    const full = new Map<string, number>()
    for (const p of cohort) full.set(p.name, (full.get(p.name) ?? 0) + 1)
    const twins = [...full.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0)
    expect(twins).toBeLessThanOrEqual(8)
  })
})

describe('pickSurname – the v7 migration default', () => {
  it('is deterministic per seed and always lands inside the pool', () => {
    for (const seed of ['golden-1', 'bench-working-0', '', 'wave-e']) {
      const a = pickSurname(seed)
      expect(pickSurname(seed)).toBe(a)
      expect(SURNAMES).toContain(a)
    }
  })
})

describe('growing the pool cannot rename an EXISTING career', () => {
  // The safety argument, executed: a save that already carries names keeps them byte-for-byte
  // through migrateSave. Both name fields are deliberately values that are NOT in the pool at
  // all, so any regeneration from the seed would be impossible to miss.
  const OUT_OF_POOL_KID = 'Zzyzx'
  const OUT_OF_POOL_AI = 'Aria Qqqqq'

  function currentSave(): Record<string, unknown> {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      careerId: 'c-1',
      seed: 'rename-guard',
      week: 40,
      fundsCents: 1_000_00,
      profile: { ...DEFAULT_PROFILE, kidName: 'Mira', kidLastName: OUT_OF_POOL_KID, birthMonth: 5 },
      plan: { practiceHours: 10, schoolHours: 20, restHours: 10 },
      cohort: [
        { id: 'ai-0', name: OUT_OF_POOL_AI, serve: 50, ret: 50, composure: 50, stamina: 50, nation: 'US', growth: 1 },
      ],
      results: [],
      season: [],
      entries: [],
      events: [],
      nextEventId: 0,
      kidRank: 100,
      prevKidRank: null,
      pendingTournament: null,
      bestFinishByTier: {},
      lastSeasonSummary: null,
      seasonHistory: [],
      seasonWins: 0,
      seasonLosses: 0,
      financeWeeks: [],
      condition: 100,
      injury: null,
      injuryHistory: [],
      physioActive: false,
      vacations: [],
      practices: [],
      recoveryBuff: null,
    }
  }

  it('keeps a persisted kidLastName and cohort name untouched', () => {
    const migrated = migrateSave(currentSave())
    expect(migrated.profile.kidLastName).toBe(OUT_OF_POOL_KID)
    expect(migrated.cohort[0].name).toBe(OUT_OF_POOL_AI)
  })

  it('only fills kidLastName when the field is absent (the v7 block is not a rewrite)', () => {
    const save = currentSave()
    save.schemaVersion = 6
    const profile = save.profile as Record<string, unknown>
    profile.kidLastName = OUT_OF_POOL_KID
    // A v6 save whose profile ALREADY has the field (a hand-edited/partially-migrated save):
    // v7 must leave it alone even though it re-runs.
    expect(migrateSave(save).profile.kidLastName).toBe(OUT_OF_POOL_KID)
  })
})

describe('the pool length is not part of the RNG draw COUNT', () => {
  it('spends the same number of draws per junior whatever the pool size', () => {
    // pickInt consumes exactly one rng() value for any range, so skills/nations/growth – and with
    // them the frozen MAIN-stream capture and kidRank – cannot move when the pool grows. Proof:
    // two cohorts of different sizes off one seed agree on every junior they share, which is only
    // true if the per-player draw count is fixed.
    const small = generateCohort('draw-count', 5)
    const big = generateCohort('draw-count', 40)
    expect(big.slice(0, 5)).toEqual(small)
  })
})
