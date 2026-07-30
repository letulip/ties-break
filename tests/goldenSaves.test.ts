import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { COACH_TIERS } from '../src/engine/coach'
import { daysInBirthMonth } from '../src/shared/dates'

// Backward compatibility is a hard product guarantee: every historical save shape must still
// load. Each fixture is a world-shaped payload for one schema version; all of them must migrate
// cleanly to the CURRENT schema. See tests/fixtures/saves/README.md for the rule.

const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const FILES = readdirSync(DIR)
  .filter((f) => /^v\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))

function load(file: string): unknown {
  return JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8'))
}

describe('golden saves corpus', () => {
  it('has a fixture for every schema version from v0 to the current one', () => {
    const versions = FILES.map((f) => Number(f.match(/\d+/)![0]))
    for (let v = 0; v <= SAVE_SCHEMA_VERSION; v++) {
      expect(versions, `missing fixture v${v}.json`).toContain(v)
    }
  })

  it(`guards SAVE_SCHEMA_VERSION (v${SAVE_SCHEMA_VERSION}): a bump forces a new golden save`, () => {
    expect(existsSync(`${DIR}/v${SAVE_SCHEMA_VERSION}.json`)).toBe(true)
  })

  for (const file of FILES) {
    it(`${file} migrates to the current schema and satisfies its invariants`, () => {
      const migrated = migrateSave(load(file))

      expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
      expect(typeof migrated.seed).toBe('string')
      expect(typeof migrated.week).toBe('number')
      expect(typeof migrated.fundsCents).toBe('number')

      // profile: v7 family name is always present and non-empty
      expect(typeof migrated.profile).toBe('object')
      expect(typeof migrated.profile.kidLastName).toBe('string')
      expect(migrated.profile.kidLastName.length).toBeGreaterThan(0)
      expect(typeof migrated.profile.playStyle).toBe('string')

      // v22 coach ladder: every fixture, however old, lands on a real rung and the pre-v22
      // `coachSetup` boolean is gone from the profile entirely.
      expect(COACH_TIERS).toContain(migrated.profile.coachTier)
      expect('coachSetup' in migrated.profile).toBe(false)

      // v9 birth month: present and in range on every fixture, however old
      expect(typeof migrated.profile.birthMonth).toBe('number')
      expect(migrated.profile.birthMonth).toBeGreaterThanOrEqual(1)
      expect(migrated.profile.birthMonth).toBeLessThanOrEqual(12)

      // v27 birth DAY: same contract, and clamped to HER OWN MONTH - a back-filled 30 February would be a
      // date she could not have been born on, and it would only surface much later as a birthday landing
      // in a week that does not exist. February is 28 because her birth year is the band's, never a leap
      // year (see daysInBirthMonth).
      expect(typeof migrated.profile.birthDay).toBe('number')
      expect(migrated.profile.birthDay).toBeGreaterThanOrEqual(1)
      expect(migrated.profile.birthDay, `${file}: ${migrated.profile.birthMonth}/${migrated.profile.birthDay}`)
        .toBeLessThanOrEqual(daysInBirthMonth(migrated.profile.birthMonth))

      // living-world systems exist and the pre-v6 `log` field is gone
      expect(Array.isArray(migrated.cohort)).toBe(true)
      expect(Array.isArray(migrated.results)).toBe(true)
      expect(Array.isArray(migrated.season)).toBe(true)
      expect(Array.isArray(migrated.entries)).toBe(true)
      expect(Array.isArray(migrated.events)).toBe(true)
      expect(typeof migrated.nextEventId).toBe('number')
      expect(typeof migrated.kidRank).toBe('number')
      expect('log' in migrated).toBe(false)

      // v7 prev-rank cache is present and well-typed
      expect(migrated.prevKidRank === null || typeof migrated.prevKidRank === 'number').toBe(true)

      // v8 tournament-reveal field is present (null for any non-mid-reveal save)
      expect(migrated.pendingTournament === null || typeof migrated.pendingTournament === 'object').toBe(true)

      // v10 fields: per-tier best finish is an object, the season summary + W-L counters exist
      expect(typeof migrated.bestFinishByTier).toBe('object')
      expect(migrated.bestFinishByTier).not.toBeNull()
      expect(migrated.lastSeasonSummary === null || typeof migrated.lastSeasonSummary === 'object').toBe(true)
      expect(typeof migrated.seasonWins).toBe('number')
      expect(typeof migrated.seasonLosses).toBe('number')

      // v11 finance ledger: an array, week-ascending, each entry a {week, byCategory} shape
      expect(Array.isArray(migrated.financeWeeks)).toBe(true)
      const weeks = migrated.financeWeeks.map((w) => w.week)
      expect(weeks).toEqual([...weeks].sort((a, b) => a - b))
      for (const w of migrated.financeWeeks) expect(typeof w.byCategory).toBe('object')

      // v12 Season-Life availability fields: condition (0..100), injury (null or object),
      // an injuryHistory array, and a boolean physio flag – present on EVERY migrated fixture.
      expect(typeof migrated.condition).toBe('number')
      expect(migrated.condition).toBeGreaterThanOrEqual(0)
      expect(migrated.condition).toBeLessThanOrEqual(100)
      expect(migrated.injury === null || typeof migrated.injury === 'object').toBe(true)
      expect(Array.isArray(migrated.injuryHistory)).toBe(true)
      expect(typeof migrated.physioActive).toBe('boolean')

      // v14 season history (R10-9): an array, season-ascending, and every row is the tiny numeric
      // record – no strings, so a long career can't bloat the save.
      // v16: the ordering key is the SEASON INDEX, and it must be strictly increasing – the whole
      // point of the re-key is that two rows can never claim the same season.
      expect(Array.isArray(migrated.seasonHistory)).toBe(true)
      const seasons = migrated.seasonHistory.map((h) => h.seasonIndex)
      expect(seasons).toEqual([...seasons].sort((a, b) => a - b))
      expect(new Set(seasons).size).toBe(seasons.length)
      for (const h of migrated.seasonHistory) {
        expect(typeof h.seasonIndex).toBe('number')
        // the pre-v16 date-derived key is gone from every migrated row
        expect('year' in h).toBe(false)
        expect(typeof h.endRank).toBe('number')
        expect(typeof h.wins).toBe('number')
        expect(typeof h.losses).toBe('number')
        expect(typeof h.fundsDeltaCents).toBe('number')
        expect(Object.values(h).every((v) => typeof v === 'number')).toBe(true)
      }
    })
  }
})
