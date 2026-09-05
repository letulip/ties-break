import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION, maxMainDraws } from '../src/engine/world'
import { mainStateConsistent } from '../src/engine/rng'
import { COACH_TIERS } from '../src/engine/coach'
import { physicalMean, SKILL_CEILING_MAX } from '../src/engine/development'
import { LADDER_TRACKS } from '../src/shared/protocol'
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

/** The first fixture whose save carries a college quote through the ladder. Measured 05.09: every
 *  fixture from here on carries exactly one, twenty of them. It is the anti-vacuity floor for the
 *  v61 sweep – see the note there. */
const FIRST_QUOTE_FIXTURE = 51

/** "This record is numbers all the way down" – the season-history row's size guarantee, asked of the
 *  LEAVES rather than of the top level so a nested value (v46's `byTrack`) is covered rather than
 *  waved through. Arrays and objects recurse; anything else must be a number. */
function numericLeaves(value: unknown): boolean {
  if (typeof value === 'object' && value !== null) return Object.values(value).every(numericLeaves)
  return typeof value === 'number'
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

      // v35 persisted MAIN position: present on EVERY migrated fixture (the v34 block stamps it via
      // the one-time replay when it is absent), and the pair must satisfy BOTH halves of the
      // load-time verifier — the s/n redundancy algebra, and the plausibility bound derived from
      // the weekly draw budget. A fixture failing here would ship a career that greets its first
      // post-update load with a recovery replay it should never have needed.
      expect(typeof migrated.rngMain).toBe('object')
      expect(typeof migrated.rngMain.s).toBe('number')
      expect(typeof migrated.rngMain.n).toBe('number')
      expect(mainStateConsistent(migrated.seed, migrated.rngMain), `${file}: rngMain fails the redundancy check`).toBe(true)
      expect(migrated.rngMain.n).toBeGreaterThanOrEqual(0)
      expect(
        migrated.rngMain.n,
        `${file}: rngMain.n implausible for week ${migrated.week}`,
      ).toBeLessThanOrEqual(maxMainDraws(migrated.week, migrated.cohort.length))

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
        // ⚠ RE-AIMED FOR v46, NOT RELAXED. This read `Object.values(h).every(number)`, and the CLAIM it
        // was making is "no strings, so a long career can't bloat the save". v46 gives the row ONE
        // nested value – `byTrack`, three records of four numbers – so a flat scan is no longer the
        // shape of the claim, and left alone it would have failed on a row that contains nothing but
        // numbers. `numericLeaves` walks to the leaves instead: every assertion above is kept, and this
        // one now covers strictly more of the row than it did before (a string hidden one level down
        // used to pass it).
        expect(numericLeaves(h)).toBe(true)
        // v46: absent is the shape a pre-v46 row keeps – see the v45 -> v46 migration. When it IS
        // present it is TOTAL over the three tables, its W-L is a pair of numbers per table exactly as
        // `seasonRecord` is, and a rank is either a real place or ABSENT (never 0, which would be a
        // place nobody can hold, and never the tie floor `LadderView.rank`'s null exists to refuse).
        if (h.byTrack !== undefined) {
          for (const track of LADDER_TRACKS) {
            const row = h.byTrack[track]
            expect(row, `${file}: byTrack is missing ${track}`).toBeDefined()
            expect(typeof row.points).toBe('number')
            expect(typeof row.wins).toBe('number')
            expect(typeof row.losses).toBe('number')
            if ('endRank' in row) expect(row.endRank).toBeGreaterThan(0)
          }
          // The split adds up to the fold it splits: the per-track figures and the whole-season ones
          // are the same matches counted twice, so a row where they disagree is a row that lost a
          // tournament somewhere. (Points can only diverge on pre-r5 rows with no `tier` – no fixture
          // carries one INSIDE a byTrack row, since byTrack only ever appears on rows this build wrote.)
          const sum = (pick: 'points' | 'wins' | 'losses'): number =>
            LADDER_TRACKS.reduce((t, track) => t + h.byTrack![track][pick], 0)
          expect(sum('wins'), `${file}: season ${h.seasonIndex} wins`).toBe(h.wins)
          expect(sum('losses'), `${file}: season ${h.seasonIndex} losses`).toBe(h.losses)
          expect(sum('points'), `${file}: season ${h.seasonIndex} points`).toBe(h.points)
        }
      }
    })
  }

  // ⭐⭐⭐⭐ v61 – THE FIRST FIELD THIS LADDER HAS DELETED, AND THE DELETE HAS TO BE PROVED ON THE
  // CORPUS RATHER THAN ON ITS OWN MIGRATION. Round 26 #2, second pass: the owner overruled the rule
  // that could shut a college place («по-моему в каждой стране есть домашний универ»), so
  // `CollegeQuote.open` left the type – and a value left behind in a save is worse than one that was
  // never removed, because `answerFork` used to filter on it. NINE fixtures (v52..v60) carry a fork
  // offer with `open: true`, so this sweep is not vacuous and its own anti-vacuity line says so.
  //
  // ⚠⚠ ONE TEST PER FIXTURE, AND THE SPLIT IS THE FIX ROUND 31 ALREADY MADE ONCE (P-14, 05.09).
  // This was a single `it` walking the whole corpus, and `migrateSave` runs the WHOLE ladder on each
  // fixture, so it grew TWICE with every wave: one more fixture, and one more step in every other
  // fixture's chain. Measured here at v70: this sweep and the v62 one below were 6.3 s and 6.1 s of
  // the file's 19.0 s of test time – 65 % of it, in two tests, against a 20 s PER-TEST ceiling that
  // has already killed this exact file (27.08, red four times on `check` with zero assertion
  // failures). `tests/round31-age-curve.test.ts:298-311` records the same failure and the same fix;
  // its own words apply here unchanged: «`it.each` is not a loosening – the same assertions run over
  // the same fixtures. Each one now gets its own budget, a failure names the fixture instead of the
  // sweep, and the arm cannot cross the line again however many schema versions accumulate.»
  //
  // ⚠ AND THE CORPUS IS DELIBERATELY NOT MIGRATED ONCE INTO A SHARED CONSTANT, which was the other
  // remedy on the table. It would take ~12 s out of the file, and it would put that work at MODULE
  // level, where no per-test budget and no `hookTimeout` covers it and the reporter attributes it to
  // no test – which is the defect P-15 is about, one file over. Cheaper is not the same as bounded.
  it.each(FILES)('⭐⭐⭐⭐ v61: %s carries no college quote `open` flag', (file) => {
    const migrated = migrateSave(load(file)) as unknown as {
      fork?: { offer?: { quotes?: Array<Record<string, unknown>> } | null } | null
    }
    const quotes = migrated.fork?.offer?.quotes ?? []
    // ⚠ THE ANTI-VACUITY HALF, RE-AIMED BY P-14 AND STRICTLY STRONGER THAN WHAT IT REPLACES. The
    // sweep used to count quotes across the whole corpus and assert `>= 9` once; per fixture, the
    // same claim is made of EACH carrier by name, so a fixture that quietly stopped carrying its
    // quote is red instead of being absorbed by the other nineteen. Measured 05.09: every fixture
    // from v51 on carries exactly one, twenty of them – the comment this replaces still said nine.
    if (Number(file.match(/\d+/)![0]) >= FIRST_QUOTE_FIXTURE) {
      expect(quotes.length, `${file}: at or past v${FIRST_QUOTE_FIXTURE} and carrying no college quote – the case below would prove nothing`)
        .toBeGreaterThanOrEqual(1)
    }
    for (const q of quotes) {
      expect('open' in q, `${file}: a shut flag survived the migration`).toBe(false)
      // ⚠ AND NOTHING ELSE ON THE QUOTE MOVED. The migration deletes one key and re-prices nothing
      // – `ForkState.offer`'s own doctrine that a career is not re-priced halfway through a bill.
      expect(typeof q.costPerYearCents, `${file}: the sticker is still there`).toBe('number')
      expect(typeof q.familyPerYearCents, `${file}: and so is what the family pays`).toBe('number')
    }
  })

  it('⚠ ...and the corpus really does carry college quotes for that sweep to check', () => {
    // The corpus-scale half of the anti-vacuity, kept as its own claim now that the sweep is
    // per-fixture: there have to BE carriers, or every case above is a loop over an empty array.
    const carriers = FILES.filter((f) => Number(f.match(/\d+/)![0]) >= FIRST_QUOTE_FIXTURE)
    expect(carriers.length, 'no fixture is old enough to carry a college quote').toBeGreaterThanOrEqual(9)
  })

  // ⭐⭐⭐⭐ v62 – EVERY SAVE THIS GAME HAS EVER WRITTEN COMES BACK WITH A PEAK, AND IT IS AT LEAST THE
  // BODY IT IS CARRYING. `peakPhysical` (the long goodbye step 1) is a RUNNING MAXIMUM, so the one
  // thing that can never be true of it is that it sits below her current physical mean – a save that
  // loaded like that would tell step 2 she is at more than 100% of her own peak, i.e. that the
  // decline runs backwards. The v62 migration reconstructs the value rather than defaulting it, and
  // this is the corpus-scale check on that: sixty-three fixtures, every historical shape the ladder
  // has ever produced, through the real loader.
  //
  // ⚠⚠ AND WHAT IT CANNOT DO IS STATED RATHER THAN IMPLIED, because the corpus has one blind spot
  // here: the DEEPEST fixture in it is week 333 – she is 19 – so no golden save has ever reached
  // `declineStart` and the reconstruction's divisor is 1 on every one of them. Mutation-verified in
  // both directions: seeding half her build fails this on v0.json, and INVERTING the divisor
  // (`* shareLeft` for `/ shareLeft`) passes it, which is exactly the hole. So this case is the
  // loader-side FLOOR – every historical shape survives the ladder and comes back with a usable
  // number – and the reconstruction's accuracy is measured where a career can actually be old, on
  // walked careers of 33 / 38 / 41 in tests/peak-physical.test.ts. Neither can do the other's job.
  //
  // ⚠ ONE TEST PER FIXTURE – P-14, for the reason written out above the v61 sweep. This one was the
  // slowest test in the file (6.3 s of 19.0 s, and 10.2 s on the review's machine).
  it.each(FILES)('⭐⭐⭐⭐ v62: %s carries a peak physical, and it is never below her build', (file) => {
    const migrated = migrateSave(load(file))
    expect(typeof migrated.peakPhysical, `${file}: no stored peak`).toBe('number')
    expect(Number.isFinite(migrated.peakPhysical), `${file}: the peak is not a real number`).toBe(true)
    // A hundredth of tolerance for the floating-point walk the reconstruction does, and no more.
    expect(migrated.peakPhysical, `${file}: the peak is BELOW her current body`)
      .toBeGreaterThanOrEqual(physicalMean(migrated.skills) - 0.01)
    expect(migrated.peakPhysical, `${file}: the peak is above anything this engine can produce`)
      .toBeLessThanOrEqual(SKILL_CEILING_MAX)
  })
})
