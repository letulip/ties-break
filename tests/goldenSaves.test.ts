import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'

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

      // v9 birth month: present and in range on every fixture, however old
      expect(typeof migrated.profile.birthMonth).toBe('number')
      expect(migrated.profile.birthMonth).toBeGreaterThanOrEqual(1)
      expect(migrated.profile.birthMonth).toBeLessThanOrEqual(12)

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
    })
  }
})
