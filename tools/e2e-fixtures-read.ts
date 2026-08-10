/**
 * THE FIXTURE READER – the half of the e2e fixture engine that only reads, split out so a browser
 * harness can import it.
 *
 * ⚠ WHY THIS FILE EXISTS, and it is a layering fact rather than a tidy-up. `tools/e2e-fixtures.ts`
 * GENERATES the fixtures, so it imports the whole deterministic engine – `createWorld`, the shared
 * career loop, the save codec, the endings constants. A Playwright spec needs none of that: it needs
 * a manifest, some bytes, and the header offset that cuts an export envelope into the two fields an
 * IndexedDB record holds. Importing the generator to get them costs twice:
 *
 *   1. TYPE-CHECKING. `tsconfig.e2e.json` is a composite project whose charter (its own header) is
 *      "this code runs in Node, against Playwright's API". A composite project must list every file
 *      it imports, so pulling the generator in would mean listing `src/engine/**` and `tools/**`
 *      there too – type-checking the entire engine a second time, under a different `types` set, to
 *      reach a 44-byte constant.
 *   2. RUNTIME. Playwright transpiles and loads every import in EVERY worker process. The engine is
 *      ~200 modules that a spec never calls.
 *
 * And there is a third, sharper reason: `tools/e2e-fixtures.ts` self-executes when its name appears
 * in `process.argv` or `npm_lifecycle_script` (the vite-node guard at the foot of that file). A test
 * runner is exactly the kind of process whose argv nobody controls. This file has no runner, no
 * argv check and nothing to launch.
 *
 * ⚠ NOTHING HERE RE-IMPLEMENTS THE SAVE FORMAT. `splitEnvelope` is a SLICE of bytes the product's own
 * `compressWorld` produced, at an offset the product's own `encodeExportFile` wrote. That is the
 * whole point of the fixture set: a fixture cannot disagree with what the app reads. The generator
 * imports these definitions back and re-exports them, so there is still exactly one of each.
 *
 * See docs/plans/e2e-fixtures.md for what the five fixtures are and how they are made.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// --- where they live ------------------------------------------------------------------------------

export const FIXTURE_DIR = fileURLToPath(new URL('../e2e/fixtures/', import.meta.url))
export const MANIFEST_FILE = `${FIXTURE_DIR}manifest.json`

// ⚠ `sinking` AND `broke` ARE THE SAME SPELL AT TWO DEPTHS, AND THAT IS THE POINT OF HAVING BOTH.
// `broke` is the last week before the latch, so the very next advance ENDS the career - which is
// what makes it the right fixture for the ending and the wrong one for anything that happens while
// the family is still playing. `sinking` is the same walk stopped halfway down, with weeks in hand,
// so a spec can tick it and still have a career afterwards. The measurement that forced the split is
// in e2e/week-advance.spec.ts: the funds stop toast could not be reached from `broke` at all,
// because the advance that raises it latches the bankruptcy ending instead.
export const FIXTURE_NAMES = ['fresh', 'junior', 'pro', 'sinking', 'broke', 'ending'] as const
export type FixtureName = (typeof FIXTURE_NAMES)[number]

/** The header layout `encodeExportFile` writes: MAGIC(8) | schemaVersion u32 BE | sha256(32) | gzip.
 *  Named here so the harness's IndexedDB seeding and the rot alarm slice it in one place. */
export const ENVELOPE_HEADER_BYTES = 44

// --- what a test is told about a fixture ----------------------------------------------------------

/** The facts a spec may stand on. Every one of them is RE-DERIVED from the loaded world by the rot
 *  alarm (tests/e2e-fixtures.test.ts) and compared to what the manifest claims, so a fixture whose
 *  numbers have drifted out from under it fails on the PR gate rather than in a browser. */
export interface FixtureFacts {
  week: number
  seasonIndex: number
  ageYears: number
  fundsCents: number
  kidRank: number
  /** ranked at all – the engine's own test, `points > 0`, not the length of a results list.
   *  ⚠ THREE TABLES, THREE CURRENCIES (season/types.ts): National, junior International and
   *  Professional. A career reads as unranked on two of them for most of its life – the junior
   *  columns empty out as she ages past the J rungs – so a spec has to name the table it means. */
  rankedDomestic: boolean
  rankedItf: boolean
  rankedWta: boolean
  domesticPoints: number
  itfPoints: number
  wtaPoints: number
  seasonsPlayed: number
  resultRows: number
  feedEvents: number
  financeWeeks: number
  cohortSize: number
  endingType: string | null
  /** consecutive weeks below zero, counting this one – 0 when solvent */
  debtWeeks: number
  inSponsorWindow: boolean
  openKitLetters: number
  hasActiveKitDeal: boolean
  rngMain: { s: number; n: number }
}

/**
 * One row of the manifest, as a READER sees it.
 *
 * ⚠ `background`, `coachTier` and `policy` are plain strings HERE and narrow unions in
 * `tools/e2e-fixtures.ts`, which re-declares this interface with the engine's own types and returns
 * it from its own `loadManifest`. The narrow types come from `src/shared/protocol.ts` and
 * `tools/econ-bench.ts`, both of which pull the engine in – the very thing this file exists not to
 * do. Nothing is lost: the generator still WRITES them typed, the rot alarm still READS them typed,
 * and a browser spec has no business branching on which coach the recipe hired.
 */
export interface FixtureEntry {
  name: FixtureName
  file: string
  /** one sentence: which seam a spec would reach for this fixture to test */
  purpose: string
  seed: string
  careerId: string
  /** the IndexedDB slot the harness should write it to (src/db/saves.ts naming) */
  slot: string
  /** the week the recipe aimed at – for the searched fixtures, the week it was FOUND at */
  targetWeek: number
  schemaVersion: number
  background: string
  coachTier: string
  policy: string
  profile: { kidName: string; kidLastName: string; country: string }
  /** the size of the WHOLE export file. The IndexedDB record's `bytes` is `payloadBytes` – see
   *  `compressWorld` in src/db/saves.ts, which stores the payload's length and not the envelope's. */
  bytes: number
  payloadBytes: number
  /** SHA-256 of the WHOLE envelope, hex. The envelope's own checksum covers the payload; this one
   *  covers the header too, so a truncated or re-headered file is caught before it is decoded. */
  sha256: string
  /** how many seeds the search tried before this one was accepted (1 = the first) */
  seedsTried: number
  facts: FixtureFacts
}

export interface FixtureManifest {
  generatedBy: string
  command: string
  /** the schema every fixture in this manifest was written at */
  schemaVersion: number
  fixtures: FixtureEntry[]
}

// --- reading (the rot alarm and the Playwright harness both come through here) --------------------

export function loadManifest(): FixtureManifest {
  return JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')) as FixtureManifest
}

export function readFixtureBytes(file: string): Uint8Array {
  return new Uint8Array(readFileSync(`${FIXTURE_DIR}${file}`))
}

/**
 * The export envelope, cut into the two fields an IndexedDB save record holds.
 *
 * ⚠ THIS IS A SLICE, NOT A RE-ENCODE. `compressWorld` produced exactly these bytes and
 * `decompressWorld` verifies the checksum against them on read, so a record built this way is
 * byte-identical to one the app wrote itself. The alternative – decode the file and re-compress –
 * would put a second gzip implementation between the fixture and the product.
 */
export function splitEnvelope(bytes: Uint8Array): {
  schemaVersion: number
  checksum: Uint8Array
  payload: Uint8Array
} {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return {
    schemaVersion: view.getUint32(8),
    checksum: bytes.subarray(12, ENVELOPE_HEADER_BYTES),
    payload: bytes.subarray(ENVELOPE_HEADER_BYTES),
  }
}

/** The careerId the generator pins, because the engine does not own it: the worker mints one from
 *  `Date.now()` (`makeCareerId`), which no fixture could reproduce. */
export function careerIdFor(name: FixtureName): string {
  return `c-e2e-${name}`
}

/** The autosave slot a fixture is seeded into – `src/db/saves.ts`'s own naming. */
export function slotFor(name: FixtureName): string {
  return `auto:${careerIdFor(name)}:a`
}
