import { SAVE_SCHEMA_VERSION } from './world'

// =================================================================================================
// THE UNTRUSTED-INPUT GATE (W1-INTEGRITY-B, Codex TB-06).
//
// Everything in this file runs BEFORE `migrateSave` ever sees a byte of an imported file. The
// division of labour is deliberate and it mirrors the v35 ruling on where integrity lives:
//
//   * the CHECKSUM (saveCodec) proves the bytes are the bytes that were written – it guards against
//     storage rot, and it already stood before this wave;
//   * the MIGRATION LADDER (migrations.ts) upgrades old schemas – append-only blocks that, by that
//     file's own charter, "upgrade versions, they do not audit" – so it must never be leaned on as
//     a validator;
//   * the WORKER's `verifyMainState` audits the RNG position on every load and repairs it loudly.
//
// None of those three asks the one question an IMPORTED FILE raises: is this world-shaped at all,
// and is it small enough to even look at? A file off the player's disk is the only input in the
// game that arrives from outside our own writers – hand-edited, half-downloaded, or simply not
// ours – and the checksum happily blesses any of that if the writer computed it. So imports get
// this gate: resource caps before any parse, then a bounds walk over the whole payload, then a
// shape check of the DECLARED schema's spine – all into local candidates, so a failed import
// leaves every global exactly where it was.
//
// DB-sourced loads (the autosave chain) deliberately get only the resource caps: those records
// were written by us, the checksum guards them, and the worker repairs what it can – rejecting a
// repairable career out of the player's own database would turn a safety net into data loss.
// =================================================================================================

/** Machine-readable failure kinds. The player-facing message rides on the Error itself; the code
 *  exists so tests (and any future UI that wants to branch) never match on prose. */
export type SaveFileErrorCode =
  | 'not-a-save' // wrong magic – this was never one of our files
  | 'truncated' // shorter than its own fixed header
  | 'oversized' // compressed bytes over the cap, refused before any decompression
  | 'oversized-expanded' // decompression aborted at the expanded-bytes cap (zip-bomb guard)
  | 'future-schema' // declared schema newer than this build supports
  | 'corrupted' // checksum mismatch, broken gzip, unparseable JSON, header/body disagreement
  | 'invalid-shape' // parsed fine but is not world-shaped (spine/bounds violations)

export class SaveFileError extends Error {
  readonly code: SaveFileErrorCode
  constructor(code: SaveFileErrorCode, message: string) {
    super(message)
    this.name = 'SaveFileError'
    this.code = code
  }
}

// -------------------------------------------------------------------------------------------------
// RESOURCE LIMITS – measured, not guessed (probe run 01.08 on this tree, tools/ probe since
// removed; re-derive by compressing `createWorld` careers at 2/10/20 seasons plus the golden
// v35 fixture):
//
//   payload            gzip bytes   JSON bytes   biggest arrays
//   golden v35 (w60)       46 898      269 784   results 2155 · events 400 · cohort 199
//   2 seasons  (w104)      60 749      414 616   results 4162 · events 437 · season 159
//   10 seasons (w520)      84 125      520 570   results 4005 · events 428
//   20 seasons (w1040)    100 335      612 679   results 3873 · events 423
//
// Size PLATEAUS with career length because every big ledger is pruned to a window (results to the
// 52-week ranking window, events to 400 rows, season to the rolling horizon) – a 20-season career
// is barely half again the size of a 2-season one. So the caps below are ~150x the largest thing
// the engine can actually produce: far above any legitimate save this schema (or several future
// ones) can write, and small enough that a hostile file dies in milliseconds instead of taking the
// tab down with it. A gzip bomb is the concrete threat the expanded cap kills: 16 MiB of
// compressed zeros inflates towards ~16 GiB, and the streaming reader in saveCodec aborts it at
// 64 MiB instead of buffering it whole.
// -------------------------------------------------------------------------------------------------

/** Hard cap on compressed payload bytes – checked before checksum work, parse, everything. */
export const MAX_COMPRESSED_BYTES = 16 * 1024 * 1024 // 16 MiB; largest measured real save: ~98 KiB
/** Hard cap on decompressed bytes – the streaming gunzip aborts past this. */
export const MAX_EXPANDED_BYTES = 64 * 1024 * 1024 // 64 MiB; largest measured real JSON: ~599 KiB

// Bounds for the structural walk. Measured maxima are in the table above; each cap is an order of
// magnitude (or several) beyond them, so no save the engine writes can graze one.
const MAX_JSON_DEPTH = 64 // measured nesting is < 16 (pendingTournament rounds/matches/score)
const MAX_ARRAY_ITEMS = 50_000 // biggest measured array: results at 4 162 rows
const MAX_STRING_CHARS = 32_768 // longest strings are event/diary texts, a few hundred chars
const MAX_TOTAL_NODES = 2_000_000 // a 20-season world is ~60k values; bounded by bytes anyway

// Spine ranges. Deliberately loose sanity ceilings – their job is rejecting garbage, never a save
// the app itself could have written (a dev fast-forward career at week 2 000 must import fine).
const MAX_WEEK = 52_000 // 1 000 seasons; honest careers end around week 200-300
const MAX_ABS_FUNDS_CENTS = 1e15 // ten trillion dollars; a career deals in ~1e7 cents
const MAX_ID_CHARS = 200 // seed / careerId; generated ones are < 30 chars

/**
 * Iterative bounds walk over a parsed payload: depth, string lengths, array lengths, total node
 * count, and every number finite. Iterative ON PURPOSE – JSON.parse itself survives nesting far
 * deeper than any recursive walker would (V8 parses ~thousands deep before its own RangeError), so
 * a recursive check here could blow the stack on exactly the hostile input it exists to reject.
 *
 * The finite-number check is not paranoia about JSON – `JSON.parse('1e999')` really does return
 * Infinity, and one Infinity in fundsCents would ride a migration all the way into the ledger.
 */
export function guardPayloadBounds(root: unknown): void {
  const fail = (detail: string): never => {
    throw new SaveFileError('invalid-shape', `This save file is malformed – ${detail}`)
  }
  let nodes = 0
  const stack: Array<{ value: unknown; depth: number }> = [{ value: root, depth: 0 }]
  while (stack.length > 0) {
    const { value, depth } = stack.pop()!
    if (++nodes > MAX_TOTAL_NODES) fail('it contains more data points than any career can hold')
    if (depth > MAX_JSON_DEPTH) fail('its data nests deeper than any save the game writes')
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail('it contains a non-finite number')
    } else if (typeof value === 'string') {
      if (value.length > MAX_STRING_CHARS) fail('it contains an implausibly long text field')
    } else if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY_ITEMS) fail('one of its lists is implausibly long')
      for (const item of value) stack.push({ value: item, depth: depth + 1 })
    } else if (value !== null && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        if (key.length > MAX_STRING_CHARS) fail('it contains an implausibly long field name')
        stack.push({ value: (value as Record<string, unknown>)[key], depth: depth + 1 })
      }
    }
  }
}

// -------------------------------------------------------------------------------------------------
// THE VERSIONED SPINE. Validates the shape a payload's DECLARED schema promises, before migration.
//
// ⚠ THIS IS NOT THE MIGRATION LADDER RESTATED, and keeping it from becoming one is a design line
// this wave inherited explicitly: migrations UPGRADE (append-only, defensive within a block, never
// auditing the version they receive), so a save DECLARED at v12 that is missing a field v12
// promised sails through every `if (v < N)` block untouched and detonates later, at runtime, far
// from any message that names the file. This table asks the one question migration cannot: does
// the payload actually have the spine its own declared version says it has?
//
// SPINE, not census: only the fields whose absence or wrong type breaks the engine immediately on
// load, each with the version that introduced it (from the ladder's own history). Optional and
// self-healing fields (kidRankDomestic, prevKidRank* and friends – "recomputes on the next tick,
// which is why it needs no migration") are deliberately not here: listing all ~50 world fields
// would be a second schema to keep in lockstep with the first, which is exactly the maintenance
// trap TB-06's own trade-off note warns about. The golden corpus test imports every fixture
// v0..v35 through this gate, so a spine rule that any real historical save violates cannot land.
// -------------------------------------------------------------------------------------------------

type Payload = Record<string, unknown>
interface SpineRule {
  field: string
  /** first schema version whose saves must carry the field */
  since: number
  /** returns an error detail, or null when the value is acceptable */
  check: (value: unknown) => string | null
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const boundedString =
  (max: number) =>
  (v: unknown): string | null => {
    if (typeof v !== 'string' || v.length === 0) return 'must be a non-empty text'
    if (v.length > max) return `is longer than ${max} characters`
    return null
  }

const intInRange =
  (min: number, max: number) =>
  (v: unknown): string | null =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max
      ? null
      : `must be a whole number between ${min} and ${max}`

const finiteAbsMax =
  (max: number) =>
  (v: unknown): string | null =>
    typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max ? null : 'is out of range'

const anArray = (v: unknown): string | null => (Array.isArray(v) ? null : 'must be a list')

const SPINE: SpineRule[] = [
  // The two fields every version has carried – migrateSave's own final invariant demands them.
  { field: 'seed', since: 0, check: boundedString(MAX_ID_CHARS) },
  { field: 'week', since: 0, check: intInRange(0, MAX_WEEK) },
  { field: 'fundsCents', since: 1, check: finiteAbsMax(MAX_ABS_FUNDS_CENTS) },
  {
    field: 'profile',
    since: 2,
    check: (v) =>
      isObject(v) && typeof v.kidName === 'string' && v.kidName.length > 0 && v.kidName.length <= MAX_ID_CHARS
        ? null
        : 'must carry the player profile',
  },
  {
    field: 'plan',
    since: 4,
    check: (v) =>
      isObject(v) && typeof v.train === 'number' && typeof v.rest === 'number'
        ? null
        : 'must carry the weekly plan',
  },
  { field: 'careerId', since: 5, check: boundedString(MAX_ID_CHARS) },
  // The living world (v6): the engine dereferences these on the very first tick after load.
  { field: 'cohort', since: 6, check: anArray },
  { field: 'results', since: 6, check: anArray },
  { field: 'season', since: 6, check: anArray },
  { field: 'entries', since: 6, check: anArray },
  { field: 'events', since: 6, check: anArray },
  { field: 'nextEventId', since: 6, check: intInRange(0, Number.MAX_SAFE_INTEGER) },
  { field: 'seasonHistory', since: 14, check: anArray },
  { field: 'trophiesByTier', since: 31, check: (v) => (isObject(v) ? null : 'must be the trophies ledger') },
  { field: 'offers', since: 32, check: anArray },
  {
    field: 'onRampCleared',
    since: 34,
    check: (v) =>
      isObject(v) && typeof v.itf === 'boolean' && typeof v.wta === 'boolean'
        ? null
        : 'must carry the on-ramp latches',
  },
  // The pro AER ledger (v36, W2-LADDER §5): dereferenced by `proEntryCapUsage` on the first
  // availability read after load, so a v36 file without it is a crash wearing a valid header.
  { field: 'proEntryWeeks', since: 36, check: anArray },
  // The penalty ledger (v38, W3-ACT2 §6), for the same reason its neighbour is here: `penaltyPointsAt`
  // filters it on the first availability read after load, so a v38 file without it is a crash
  // wearing a valid header. `suspendedUntilWeek` is deliberately NOT listed - `null` is a legitimate
  // value and the field is read through `isSuspendedAt`, which treats absent and null alike, so it
  // is genuinely self-healing in the sense the note at the top of this file describes.
  { field: 'penalties', since: 38, check: anArray },
  {
    // Shape only – s is mulberry32's register and the engine stores it SIGNED (rng.ts: `a |= 0`),
    // so the honest range is int32, both halves. Whether the pair satisfies the s/n algebra is the
    // RNG-VERIFY step's question, answered after migration by the same verify-or-repair the worker
    // applies to every load (and pinned to repair, loudly, by tests/sim-worker-rng.test.ts).
    field: 'rngMain',
    since: 35,
    check: (v) =>
      isObject(v) &&
      typeof v.s === 'number' &&
      Number.isInteger(v.s) &&
      v.s >= -2147483648 &&
      v.s <= 2147483647 &&
      typeof v.n === 'number' &&
      Number.isInteger(v.n) &&
      v.n >= 0 &&
      v.n <= Number.MAX_SAFE_INTEGER
        ? null
        : 'must carry a valid RNG position',
  },
]

/**
 * Validate a parsed payload against the spine its DECLARED version promises. `declaredVersion` is
 * the version the file header claims; the payload's own `schemaVersion` must agree with it (the
 * header is not covered by the payload checksum, so a disagreement means one of the two was
 * tampered with or mis-written – there is no way to know which, hence 'corrupted').
 */
export function guardDeclaredShape(payload: unknown, declaredVersion: number): Payload {
  if (!isObject(payload)) {
    throw new SaveFileError('invalid-shape', 'This save file is malformed – it does not contain a career')
  }
  const bodyVersion = payload.schemaVersion ?? 0
  if (bodyVersion !== declaredVersion) {
    throw new SaveFileError(
      'corrupted',
      'This save file is damaged – its header and its data disagree about the save version',
    )
  }
  for (const rule of SPINE) {
    if (declaredVersion < rule.since) continue
    const detail = rule.check(payload[rule.field])
    if (detail !== null) {
      throw new SaveFileError('invalid-shape', `This save file is malformed – "${rule.field}" ${detail}`)
    }
  }
  return payload
}

/** Reject a declared schema this build cannot read – BEFORE any decompression happens. */
export function guardDeclaredVersion(declaredVersion: number): void {
  if (!Number.isInteger(declaredVersion) || declaredVersion < 0) {
    throw new SaveFileError('corrupted', 'This save file is damaged – it declares an impossible save version')
  }
  if (declaredVersion > SAVE_SCHEMA_VERSION) {
    throw new SaveFileError(
      'future-schema',
      `This save is from a newer version of the game (schema v${declaredVersion}, this build reads up to v${SAVE_SCHEMA_VERSION}) – update the app, then import it`,
    )
  }
}

/** The compressed-bytes cap, shared by the import gate and the DB read path. */
export function guardCompressedSize(byteLength: number): void {
  if (byteLength > MAX_COMPRESSED_BYTES) {
    throw new SaveFileError(
      'oversized',
      `This file is too large to be a save (${(byteLength / (1024 * 1024)).toFixed(1)} MB – the limit is ${MAX_COMPRESSED_BYTES / (1024 * 1024)} MB)`,
    )
  }
}
