import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'node:fs'
import { decodeExportFile, decompressWorld, sha256 } from '../src/engine/saveCodec'
import { SAVE_SCHEMA_VERSION, STARTING_FUNDS_CENTS, maxMainDraws } from '../src/engine/world'
import { mainStateConsistent } from '../src/engine/rng'
import { ENDINGS } from '../src/engine/ending'
import { isSponsorWindowWeek } from '../src/engine/offers'
import { FIRST_NAMES, SURNAMES } from '../src/engine/season/cohort'
import { TIER_SHORT } from '../src/engine/season/calendar'
import {
  careerIdFor,
  factsOf,
  FIXTURE_DIR,
  FIXTURE_NAMES,
  loadManifest,
  readFixtureBytes,
  slotFor,
  splitEnvelope,
  type FixtureEntry,
} from '../tools/e2e-fixtures'

// THE ROT ALARM for the Playwright fixture set (docs/plans/e2e-fixtures.md).
//
// The fixtures in e2e/fixtures/ are career saves a browser test boots into instead of clicking
// through four hundred weeks. They are BINARIES IN GIT, and the save schema moved four times in
// three days last week – so the one thing that can go wrong quietly is that a fixture stops being
// the career its manifest says it is. A stale fixture is a test that lies, and it lies in the
// slowest, least readable layer of the stack.
//
// So every claim the manifest makes is re-derived here, from the file, through the PRODUCT'S OWN
// reader – `decodeExportFile`, which is the untrusted-input door with the full guard chain and the
// real migration ladder behind it. Nothing in this file parses a save by hand. It runs on the PR
// gate with the rest of the unit project, in well under a second, which is what makes it the right
// place for this alarm rather than the nightly e2e job.
//
// ⚠ NOT tests/goldenSaves.test.ts, AND THE DIFFERENCE IS THE POINT. The golden corpus is one raw
// world per schema version and it proves MIGRATIONS work – it must keep old shapes for ever, and its
// v19 file is deliberately ancient. These five are playable STATES at the CURRENT version and they
// prove a browser has somewhere to start; when the schema moves they are regenerated, not migrated.
// Neither can do the other's job: a golden save has no funds worth asserting on, and a fixture at
// the current version proves nothing about v12.

const manifest = loadManifest()

/** The trademark rule (CLAUDE.md Style): tournament and organisation names are fictional, and real
 *  player surnames must not be constructible. A fixture inherits it from the engine that generated
 *  it – this is the check that the inheritance actually holds.
 *
 *  ⚠ `WTA nnn` IS EXPECTED AND IS NOT A LEAK. `TIER_SHORT` labels the four adult rungs "WTA 125"
 *  … "WTA 1000" as a deliberate, argued choice in season/calendar.ts (the tour's own shorthand;
 *  the Slam is handled the other way, with no major's name). The feed quotes those labels, so they
 *  reach the save. What this test forbids is a fixture carrying ANY OTHER organisation string –
 *  which is what a generator inventing its own names would produce. */
const ALLOWED_TRADEMARK_STRINGS = new Set(Object.values(TIER_SHORT))
const TRADEMARK = /\b(?:ITF|WTA|ATP)\b/

function trademarkOffenders(json: string): string[] {
  // Every quoted string in the payload that names a tour, minus the shipped tier labels.
  const strings = json.match(/"(?:[^"\\]|\\.)*"/g) ?? []
  const offenders = new Set<string>()
  for (const quoted of strings) {
    if (!TRADEMARK.test(quoted)) continue
    const value = quoted.slice(1, -1)
    // A feed line quotes a label inside a sentence ("Travel to WTA 125"), so the test is whether
    // every trademark token in it belongs to a shipped label, not whether the whole string is one.
    const stripped = [...ALLOWED_TRADEMARK_STRINGS].reduce((s, label) => s.split(label).join(''), value)
    if (TRADEMARK.test(stripped)) offenders.add(value)
  }
  return [...offenders]
}

describe('e2e fixtures: the manifest and the files agree', () => {
  it('carries exactly the five fixtures the plan asks for', () => {
    expect(manifest.fixtures.map((f) => f.name)).toEqual([...FIXTURE_NAMES])
  })

  it('the trademark scan is looking at real text (positive control)', async () => {
    // Without this, `trademarkOffenders` returning [] would be indistinguishable from a regex that
    // never matches anything – the empty-set pass every scanner of this shape eventually rots into.
    // A career that has played weeks quotes the adult tier labels in its feed, so the scan must both
    // FIND the token and exempt it.
    const json = JSON.stringify(await decodeExportFile(readFixtureBytes('pro.tsave')))
    expect(TRADEMARK.test(json)).toBe(true)
    expect(trademarkOffenders(json)).toEqual([])
  })

  it(`is written at the current schema (v${SAVE_SCHEMA_VERSION}) – REGENERATE with \`npm run e2e:fixtures\` after a bump`, () => {
    // THE ALARM THAT GOES OFF ON A SCHEMA BUMP, and it is meant to. Everything below would still
    // pass on a fixture a version or two behind – that is exactly what the migration ladder is for –
    // and passing is the problem: the e2e layer would silently be testing "an old save, migrated"
    // instead of "the state the app writes today". Save schema changes are already a three-part move
    // (CLAUDE.md invariant 3); this makes the fixture set the fourth part, and it costs one command.
    expect(manifest.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const entry of manifest.fixtures) {
      expect(entry.schemaVersion, `${entry.name}.tsave was written at v${entry.schemaVersion}`).toBe(
        SAVE_SCHEMA_VERSION,
      )
    }
  })

  for (const entry of manifest.fixtures as FixtureEntry[]) {
    describe(entry.name, () => {
      it('is on disk, unedited, with the header the manifest describes', async () => {
        expect(existsSync(`${FIXTURE_DIR}${entry.file}`)).toBe(true)
        const bytes = readFixtureBytes(entry.file)
        expect(statSync(`${FIXTURE_DIR}${entry.file}`).size).toBe(entry.bytes)
        expect(bytes.byteLength).toBe(entry.bytes)
        // The envelope's own SHA-256 covers the payload; the manifest's covers the header too, so a
        // re-headered or truncated file is caught before anything tries to decode it.
        const digest = [...(await sha256(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('')
        expect(digest).toBe(entry.sha256)
        const envelope = splitEnvelope(bytes)
        expect(envelope.schemaVersion).toBe(entry.schemaVersion)
        expect(envelope.checksum.byteLength).toBe(32)
        expect(envelope.payload.byteLength).toBe(entry.payloadBytes)
      })

      it('loads through the real import door and still holds the facts its manifest claims', async () => {
        // decodeExportFile IS the app's import path: size cap, magic, declared version, checksum,
        // bounded inflation, the bounds walk, the declared schema's spine, then the migration ladder.
        const world = await decodeExportFile(readFixtureBytes(entry.file))

        expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
        expect(world.seed).toBe(entry.seed)
        expect(world.careerId).toBe(entry.careerId)
        expect(world.careerId).toBe(careerIdFor(entry.name))
        expect(entry.slot).toBe(slotFor(entry.name))
        expect(world.profile.kidName).toBe(entry.profile.kidName)
        expect(world.profile.kidLastName).toBe(entry.profile.kidLastName)
        expect(world.profile.country).toBe(entry.profile.country)
        expect(world.profile.background).toBe(entry.background)
        expect(world.profile.coachTier).toBe(entry.coachTier)

        // The whole fact sheet, re-derived by the same function that wrote it. This is the alarm:
        // any drift between what a spec was told and what the save holds fails here.
        expect(factsOf(world)).toEqual(entry.facts)
        expect(world.week).toBe(entry.facts.week)
      })

      it('loads through the DATABASE door too – the one the harness actually seeds', async () => {
        // TWO DOORS, TWO TRUST LEVELS (saveCodec.ts's own header). The test above uses the FILE
        // door; a fixture written into IndexedDB is read back through `decompressWorld`, which is a
        // different function with a different guard set. That is the path every seeded spec takes,
        // so it gets its own assertion rather than being assumed from the file door's green.
        const { payload, checksum } = splitEnvelope(readFixtureBytes(entry.file))
        const world = await decompressWorld(payload, checksum)
        expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
        expect(factsOf(world)).toEqual(entry.facts)
      })

      it('carries a MAIN stream position it could actually have reached', async () => {
        // v35's two halves, the same pair goldenSaves.test.ts checks: the s/n redundancy algebra
        // (the pair IS the checksum) and the plausibility bound from the weekly draw budget.
        //
        // ⚠ THIS IS THE TEST THAT CATCHES A GENERATOR TAKING A RAW `rngFromSeed` TAP. A fixture
        // built that way looks perfect – right week, right funds – and claims zero draws spent, so
        // the app resumes its main stream from the beginning and replays four hundred weeks of dice.
        // tools/e2e-fixtures.ts draws through `resumeMain(world.rngMain)` for exactly this reason.
        const world = await decodeExportFile(readFixtureBytes(entry.file))
        expect(mainStateConsistent(world.seed, world.rngMain)).toBe(true)
        expect(world.rngMain.n).toBeGreaterThanOrEqual(0)
        expect(world.rngMain.n).toBeLessThanOrEqual(maxMainDraws(world.week, world.cohort.length))
        // A career that has played weeks has spent draws; a week-0 one has not.
        expect(world.rngMain.n > 0).toBe(world.week > 0)
      })

      it('names only people the engine could have named', async () => {
        const world = await decodeExportFile(readFixtureBytes(entry.file))
        // The kid's name comes out of the shipped pools through the engine's own dice, never
        // invented by the generator – so no real player's surname is constructible from a fixture.
        expect(FIRST_NAMES).toContain(world.profile.kidName)
        expect(SURNAMES).toContain(world.profile.kidLastName)
        for (const player of world.cohort) {
          const [first, ...rest] = player.name.split(' ')
          expect(FIRST_NAMES, `cohort given name "${first}"`).toContain(first)
          expect(SURNAMES, `cohort surname "${rest.join(' ')}"`).toContain(rest.join(' '))
        }
        expect(trademarkOffenders(JSON.stringify(world))).toEqual([])
      })
    })
  }
})

// --- and that each one is still the STATE its name promises ---------------------------------------
//
// The block above proves a fixture matches its own manifest, which a fixture regenerated from a
// broken recipe would also do. These assertions are tied to the ENGINE's constants instead, so a
// balance change that moves a state out from under a fixture is caught as well as a stale binary.

describe('e2e fixtures: each is the state its name promises', () => {
  const facts = (name: string) => manifest.fixtures.find((f) => f.name === name)!.facts
  const entry = (name: string) => manifest.fixtures.find((f) => f.name === name)!

  it('fresh is week 0 with the background\'s starting funds and no ranking', () => {
    const f = facts('fresh')
    expect(f.week).toBe(0)
    expect(f.fundsCents).toBe(STARTING_FUNDS_CENTS[entry('fresh').background])
    expect(f.rankedDomestic).toBe(false)
    expect(f.rankedItf).toBe(false)
    expect(f.rankedWta).toBe(false)
    expect(f.seasonsPlayed).toBe(0)
    expect(f.endingType).toBeNull()
  })

  it('junior has earned a ranking and has seasons behind her', () => {
    const f = facts('junior')
    expect(f.week).toBeGreaterThan(52)
    expect(f.rankedDomestic).toBe(true)
    expect(f.domesticPoints).toBeGreaterThan(0)
    expect(f.seasonsPlayed).toBeGreaterThanOrEqual(2)
    expect(f.endingType).toBeNull()
  })

  it('pro is deep in a professional career, inside the sponsor window, with paper on the table', () => {
    const f = facts('pro')
    expect(f.week).toBeGreaterThanOrEqual(400)
    expect(f.endingType).toBeNull()
    // Not the junior table: at twenty-one her ITF points are years gone. Three tables, three
    // currencies – a spec that asks the wrong one gets a career that reads as unranked.
    expect(f.rankedWta).toBe(true)
    expect(f.wtaPoints).toBeGreaterThan(0)
    expect(f.inSponsorWindow).toBe(true)
    expect(isSponsorWindowWeek(f.week)).toBe(true)
    expect(f.openKitLetters + (f.hasActiveKitDeal ? 1 : 0)).toBeGreaterThan(0)
    // "full ledgers": the finance ledger and the feed are both at their pruned length, which is what
    // a career this old looks like and what the money and news screens have to render.
    expect(f.financeWeeks).toBeGreaterThan(0)
    expect(f.feedEvents).toBeGreaterThan(0)
    expect(f.seasonsPlayed).toBeGreaterThanOrEqual(7)
  })

  // ⚠ THE TWO DEBT FIXTURES ARE CHECKED AGAINST EACH OTHER, NOT ONLY AGAINST THE CONSTANT, because
  // the thing that makes them two fixtures rather than one is the DISTANCE between them. `sinking`
  // exists so that a spec can advance a week and still have a career on the other side of it; a
  // regeneration that let it drift up against the latch would take that away while every assertion
  // written per-fixture still passed.
  it('sinking is under water with weeks in hand – advanceable, and not against the latch', () => {
    const f = facts('sinking')
    expect(f.fundsCents).toBeLessThan(0)
    expect(f.debtWeeks).toBe(Math.floor(ENDINGS.bankruptcyGraceWeeks / 2))
    // Room on BOTH sides: a spell already long enough to have a countdown worth printing, and at
    // least two weeks before anything latches, so one advance cannot end the career.
    expect(f.debtWeeks).toBeGreaterThan(1)
    expect(ENDINGS.bankruptcyGraceWeeks - f.debtWeeks).toBeGreaterThan(1)
    expect(f.debtWeeks).toBeLessThan(facts('broke').debtWeeks)
    expect(f.endingType).toBeNull()
  })

  it('broke is under water and exactly one week short of the bankruptcy latch', () => {
    const f = facts('broke')
    expect(f.fundsCents).toBeLessThan(0)
    // Tied to the engine's own constant, not to the number 11: if the grace window is ever retuned,
    // this fixture is no longer "one week short" and the alarm says so.
    expect(f.debtWeeks).toBe(ENDINGS.bankruptcyGraceWeeks - 1)
    expect(f.endingType).toBeNull()
  })

  it('ending is past the fork at nineteen, with the racket down', () => {
    const f = facts('ending')
    expect(f.endingType).toBe('stopped')
    expect(f.ageYears).toBeGreaterThanOrEqual(ENDINGS.forkAgeYears)
  })
})
