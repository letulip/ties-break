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
 * See docs/plans/e2e-fixtures.md for what the ten fixtures are and how they are made.
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
// ⚠ `unheard` AND `ending` ARE THE SAME WEEK SEEN FROM EITHER SIDE OF ONE QUESTION, and that is why
// there are two of them. Both sit on `schoolEndWeek` – the tick that opens the college fork – but
// `ending` is PAST it: the generator's own walk answered her beat and then answered the fork, so the
// career is over and the epilogue has replaced the shell. `unheard` is the same week with nothing
// answered yet: her `lifeLog` row is still `answer: null`, so the week is stopped for the life beat
// and `answerFork` refuses behind it (v73, the private life's wave 2). No other fixture can hold
// that state, because every other recipe walks through `drainLifeBeats(world)` on its way past
// (v74: it read `answerLifeBeat(world, 'listen')` while `'fork-opinion'` was the only beat kind) –
// see the recipe in tools/e2e-fixtures.ts, whose ONE difference from the others is that it stops
// before that line runs.
// ⚠⚠ `soft` IS THE TIER-1 CAREER, AND IT IS AN EIGHTH FIXTURE RATHER THAN A FLAG ON ONE OF THE
// SEVEN BECAUSE NONE OF THEM CAN HOLD THE STATE (v74 T15, 11.09). The soft surface is a `'small-talk'
// row that is unanswered AND still inside its three-week window (`liveSoftBeat`, derived from
// `week − row.week`), on a week the engine never stopped – and every recipe above walks past that
// state without ever parking on it: six of them stop on a week chosen for money, a ranking or an
// ending, and `unheard` stops on a BLOCKING row, whose card covers the hub the soft card lives on.
// ⚠ MEASURED BEFORE THE RECIPE WAS WRITTEN, not assumed: six of the seven carry `'small-talk'` rows
// (3 to 11 each, `fresh` is week 0 and has none) and all 40 of them are unanswered and EXPIRED. The
// closest miss is `junior`, whose youngest row is **4 weeks** old against a window of 3 – one week
// outside it. So the tier-1 case had nowhere to start until this career existed, which is the same
// argument one tier down that `unheard` makes about the blocking beat.
// ⚠⚠ `breakup` AND `belated` ARE THE SAME PIECE OF NEWS IN THE TWO REGISTERS THE ENGINE HAS FOR IT,
// AND THAT IS WHY THERE ARE TWO OF THEM (v75 T8, 12.09). `breakup` parks on an ordinary week with a
// live attachment the parent HAS been told about, one tick before the hazard ends it: pressing the
// week button fires the ending, drops her Mood and raises the told-NOW card. `belated` parks one tick
// before a `knownWeek` whose episode is ALREADY over, so the same press raises the told-LATE card –
// «there was someone, and it is already over» – and no `'met'` beat is ever raised for that episode.
// ⚠ THE TWO CANNOT BE ONE FIXTURE, and the reason is the mechanic rather than the budget: the
// register is decided by ruling A's `'met'` RECEIPT, which an episode either carries or does not, so
// one career on one week can only ever be one of the two scenes. `pro` settles which one the corpus
// had: its four endings all carry a receipt (weeks 171 / 221 / 307 / 371, every one told-now), so the
// told-late branch – the scene ruling A exists for, the one that goes wrong QUIETLY – had no browser
// anywhere in the suite until `belated`.
// ⚠ MEASURED BEFORE EITHER RECIPE WAS WRITTEN, not assumed: no committed fixture holds a live known
// episode at all (`pro` is the only one with a love life past its arrival, and its tail row `p:400`
// is known but never ends inside the walk), so neither state had anywhere to start.
export const FIXTURE_NAMES = ['fresh', 'junior', 'pro', 'sinking', 'broke', 'ending', 'unheard', 'soft', 'breakup', 'belated'] as const
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
