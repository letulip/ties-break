import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pickInt, resumeMain, rngFromSeed, type Rng } from '../src/engine/rng'
import {
  SAVE_SCHEMA_VERSION,
  createWorld,
  refreshDerivedRankCaches,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { decodeExportFile, decompressWorld, sha256 } from '../src/engine/saveCodec'
import { SaveFileError, type SaveFileErrorCode } from '../src/engine/saveGuard'
import { commitAutosave, readLatestAutosave } from '../src/db/saves'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { engineModuleSource } from './worldSource'
import { codeOf } from './helpers/source'
import { workerHarness } from './helpers/workerHarness'

// =================================================================================================
// T1.7 – THE SAVE DOORS UNDER HOSTILE INPUT (principles plan of 26.09, appended after dispatch).
//
// `tests/save-import-guard.test.ts` is the TABLE: hand-picked files, one hostile class per case, and
// D-04's sixteen named fields. This file is the GENERATED CORPUS beside it, and it exists because
// every hole the two reviews found on this layer was found the same way – `probes/d-spine-sweep.ts`
// deleted each top-level field of one golden save in turn and read what came out. That sweep is a
// measurement somebody has to remember to re-run; a seeded generator is the same question asked on
// every commit, over five bases and five mutation kinds instead of one base and one kind.
//
// THE TWO DOORS, WHICH DO NOT PROMISE THE SAME THING (saveCodec.ts's trust-levels note is the
// ruling, and the corpus is built to respect it rather than to argue with it):
//   * the IMPORT door (`decodeExportFile`, plus the worker's `importSave` one step further in) reads
//     a FILE – hand-edited, half-downloaded, or not ours at all – so it owes the player a refusal
//     that names something: caps, header, checksum, bounds walk, the declared version's spine, the
//     ladder, and since D-04 a one-week dry run on a discarded clone.
//   * the BOOT door (`decompressWorld` under `readLatestAutosave`) reads OUR OWN DATABASE RECORD,
//     guarded by a checksum, and deliberately runs neither the bounds walk nor the spine: refusing a
//     repairable autosave out of the player's own database would turn a safety net into data loss.
//     What it owes is a TYPED answer, so the two-generation fallback can tell «unreadable» from
//     «written by a newer build» – which is exactly what D-02 fixed.
//
// WHAT IS ASSERTED PER VARIANT (the four invariants of T1.7, one `it` each below):
//   1. every refusal either door hands back is a `SaveFileError` with a code from the enum and a
//      sentence that EXISTS IN THE SOURCE – never a bare `TypeError`, which is what 13 of D-04's
//      sixteen fields used to produce;
//   2. nothing the ADOPTING door accepts throws inside `toSnapshot` or on the next tick;
//   3. the boot door falls back to the older generation only on `corrupted`, and always on it;
//   4. no call overwrites or deletes a known-good generation.
//
// ⚠ NO NEW WORDING ANYWHERE, INCLUDING IN THE ASSERTIONS. The sentence catalogue below is EXTRACTED
// from `saveGuard.ts`, `saveCodec.ts` and `migrations.ts` with the comments stripped, so this file
// never states what a message says – it states that the message is one the product already writes.
// A reworded sentence moves the catalogue with it and this corpus stays green; an invented one, or a
// stack-trace leaking into a refusal, does not.
//
// ⚠ THE ENGINE TICKS HERE, AND THE FROZEN CAPTURE CANNOT MOVE. Three kinds of tick happen in this
// file and none of them can reach the committed stream (41550 draws / `e6b0c709`, pinned in
// tests/condition.test.ts):
//   * `rehearse` and the worker's own `importDryRun` tick a `structuredClone`, so `resumeMain`
//     advances the CLONE's pair and the candidate is byte-for-byte the one that arrived;
//   * the four careers this file builds (`createWorld` + a few weeks, and the `advance` calls in the
//     two worker arms) live in fake-indexeddb inside this process and are gone when it exits;
//   * no engine file is touched, so no MAIN draw is added, removed or reordered – the capture is a
//     measurement of what the ENGINE draws, and this file only reads saves through it.
// =================================================================================================

const enc = new TextEncoder()
const dec = new TextDecoder()

/** ⭐ THE RECIPE LINES ARE OPT-IN, THE MEASUREMENT IS NOT (26.09). This file printed ~45 lines on
 *  every unit run – one per instrument, three lists of them – and a diagnostic that nobody asked for
 *  is a diagnostic nobody reads. What stays unconditional is what the corpus EXISTS to produce: the
 *  tally, the code histogram and the load door's counts, four lines. The per-variant recipes go
 *  behind the flag, and they cost nothing to get back, because a red arm already quotes the variant
 *  id and the recipe in its own message.
 *
 *  ⚠ `TB_` AND THE TWO SPELLINGS ARE THE HOUSE'S, not a new convention: `TB_SNAPSHOT_VERIFY`,
 *  `TB_UNIT_SKIP_HEAVY`, `TB_BENCH_NO_AUTORUN`, and `snapshotVerifyEnabled` (world/derivedCache.ts)
 *  accepts exactly `1` and `true`. */
const VERBOSE = process.env.TB_FUZZ_VERBOSE === '1' || process.env.TB_FUZZ_VERBOSE === 'true'

async function gz(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// -------------------------------------------------------------------------------------------------
// THE BASES – five real saves, not five copies of one.
//
// A corpus derived from a single fixture measures one career's shape. These five differ in the ways
// this layer actually branches: the CURRENT golden (every spine row live, every ledger populated),
// two historical goldens that arrive through the migration ladder (v70, v35), and two e2e export
// files, which are the only bases that arrive as BYTES the product itself wrote – header, checksum
// and all – one of them a career at week 0 whose ledgers are empty and one eight seasons deep.
// -------------------------------------------------------------------------------------------------

interface Base {
  name: string
  /** the schemaVersion the payload's own body carries */
  declared: number
  text: string
  payload: Uint8Array
  checksum: Uint8Array
}

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const E2E = fileURLToPath(new URL('../e2e/fixtures', import.meta.url))

async function goldenBase(version: number): Promise<Base> {
  const text = readFileSync(`${SAVES}/v${version}.json`, 'utf8')
  const payload = await gz(enc.encode(text))
  return { name: `golden-v${version}`, declared: version, text, payload, checksum: await sha256(payload) }
}

/** An e2e fixture is an export FILE: MAGIC(8) | schemaVersion u32 | sha256(32) | gzip(JSON). Its
 *  payload and checksum are taken as they are – the product's own bytes are the honest base for a
 *  byte-level mutation, and re-gzipping them here would measure this file's compressor instead. */
async function e2eBase(name: string): Promise<Base> {
  const bytes = new Uint8Array(readFileSync(`${E2E}/${name}.tsave`))
  const payload = bytes.subarray(44)
  const declared = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(8)
  return {
    name: `e2e-${name}`,
    declared,
    text: dec.decode(await gunzip(payload)),
    payload,
    checksum: bytes.subarray(12, 44),
  }
}

// -------------------------------------------------------------------------------------------------
// THE GENERATOR. Fixed seeds, the engine's own `rngFromSeed` / `pickInt`, no `Math.random` and no
// `new Date()` anywhere (CLAUDE.md invariant 2): the corpus is a pure function of the five bases and
// the string below, and `the same seeds give the same corpus twice` proves it on every run.
// -------------------------------------------------------------------------------------------------

type Kind = 'truncated' | 'field-deleted' | 'type-swapped' | 'schema-shifted' | 'checksum-flipped'
const KINDS: Kind[] = ['truncated', 'field-deleted', 'type-swapped', 'schema-shifted', 'checksum-flipped']
const PER_KIND = 8
const CORPUS_SEED = 'tb-save-doors-fuzz/2026-09-26'

interface Variant {
  id: string
  base: string
  kind: Kind
  /** the recipe, in words – a red arm has to be reproducible from the report alone */
  recipe: string
  declared: number
  payload: Uint8Array
  checksum: Uint8Array
  file: Uint8Array
}

/** The export-file layout, as `encodeExportFile` writes it: MAGIC(8) | schemaVersion u32 BE |
 *  sha256(32) | gzip(JSON). Assembled here rather than through `encodeExportFile` because half the
 *  point of the corpus is a header and a checksum that DISAGREE with the body. */
function assemble(declared: number, payload: Uint8Array, checksum: Uint8Array): Uint8Array {
  const file = new Uint8Array(44 + payload.length)
  file.set(enc.encode('TSIMSAVE'), 0)
  new DataView(file.buffer).setUint32(8, declared)
  file.set(checksum, 12)
  file.set(payload, 44)
  return file
}

const SWAPS: [string, unknown][] = [
  ['a number', 0],
  ['a text', 'x'],
  ['a boolean', true],
  ['null', null],
  ['an empty list', []],
  ['an empty object', {}],
]

const isContainer = (v: unknown): boolean => typeof v === 'object' && v !== null

/** Walk `wantDepth` steps into the payload along a seeded path and hand back the container plus the
 *  key to hit. The depth is a WISH, not a demand: a walk that dead-ends in a leaf or an empty
 *  container targets the last live key it saw, because a generator that skipped those recipes would
 *  quietly shrink the corpus – and a variant that is silently not generated is a variant nobody
 *  notices is missing. */
function seededTarget(
  root: Record<string, unknown>,
  rng: Rng,
  wantDepth: number,
): { path: string; parent: Record<string, unknown> | unknown[]; key: string | number } {
  let parent: Record<string, unknown> | unknown[] = root
  let hit: { path: string; parent: Record<string, unknown> | unknown[]; key: string | number } | null = null
  const path: string[] = []
  for (let depth = 1; ; depth++) {
    const keys: (string | number)[] = Array.isArray(parent) ? parent.map((_, i) => i) : Object.keys(parent)
    if (keys.length === 0) {
      // An empty container: the key that HOLDS it is the target. A base whose ROOT is empty is not a
      // save at all, and it has to say so here rather than hand back an undefined target.
      if (!hit) throw new Error('seededTarget: the base payload has no fields to mutate')
      return hit
    }
    const key = keys[pickInt(rng, 0, keys.length - 1)]
    const value = (parent as Record<string | number, unknown>)[key]
    hit = { path: [...path, String(key)].join('.'), parent, key }
    if (depth >= wantDepth || !isContainer(value)) return hit
    path.push(String(key))
    parent = value as Record<string, unknown> | unknown[]
  }
}

function drop(parent: Record<string, unknown> | unknown[], key: string | number): void {
  if (Array.isArray(parent)) parent.splice(Number(key), 1)
  else delete parent[String(key)]
}

/** ⚠ ONE SUB-STREAM PER VARIANT, KEYED BY ITS OWN ID, rather than one walk shared by the corpus.
 *  A shared walk makes every variant's bytes a function of how many variants came before it, so
 *  adding a kind or a base rewrites the whole corpus and no earlier measurement can be compared
 *  with a later one. Keyed per variant, a base or a kind can be added without moving a single
 *  existing variant – the same reason the engine keys its own sub-streams by purpose and week. */
function variantRng(base: Base, kind: Kind, i: number): Rng {
  return rngFromSeed(`${CORPUS_SEED}:${base.name}:${kind}:${i}`)
}

/** The depth wishes of the eight `field-deleted` / `type-swapped` variants per base: half at the top
 *  level, which is the layer `probes/d-spine-sweep.ts` sweeps by hand, then down into the ledgers,
 *  where no spine row can ever reach and only the dry run can answer. */
const DEPTHS = [1, 1, 1, 1, 2, 2, 3, 4]

/** `schemaVersion` moved by ±k. 1000 is in the list because «a newer build» is the case D-02 is
 *  about and one version is the narrowest possible skew; a thousand is the rollback-deploy shape. */
const SHIFTS = [1, 2, 3, 1000, -1, -2, -3, -1000]

async function buildVariants(base: Base): Promise<Variant[]> {
  const out: Variant[] = []
  const craft = (
    kind: Kind,
    i: number,
    recipe: string,
    declared: number,
    payload: Uint8Array,
    checksum: Uint8Array,
  ): void => {
    out.push({
      id: `${base.name}/${kind}/${i}`,
      base: base.name,
      kind,
      recipe,
      declared,
      payload,
      checksum,
      file: assemble(declared, payload, checksum),
    })
  }
  const mutatedJson = async (
    kind: Kind,
    i: number,
    recipe: string,
    declared: number,
    json: Record<string, unknown>,
  ): Promise<void> => {
    const payload = await gz(enc.encode(JSON.stringify(json)))
    craft(kind, i, recipe, declared, payload, await sha256(payload))
  }

  for (const kind of KINDS) {
    for (let i = 0; i < PER_KIND; i++) {
      const rng = variantRng(base, kind, i)
      if (kind === 'truncated') {
        const cut = pickInt(rng, 1, base.payload.length - 1)
        const short = base.payload.subarray(0, cut)
        // Two writers, both of them real: a file that ROTTED still carries the checksum it was
        // written with, and one truncated by a hostile or broken writer carries a checksum over the
        // stump. Only the second reaches the inflater – the first dies one step earlier – so a
        // corpus with just one of them never tests the streaming gunzip's own failure at all.
        const rewritten = rng() < 0.5
        const checksum = rewritten ? await sha256(short) : base.checksum
        craft(
          kind,
          i,
          `payload cut to ${cut}/${base.payload.length} bytes, checksum ${rewritten ? 'recomputed' : 'kept'}`,
          base.declared,
          short,
          checksum,
        )
      } else if (kind === 'field-deleted' || kind === 'type-swapped') {
        const json = JSON.parse(base.text) as Record<string, unknown>
        const target = seededTarget(json, rng, DEPTHS[i])
        if (kind === 'field-deleted') {
          drop(target.parent, target.key)
          await mutatedJson(kind, i, `deleted ${target.path} (depth wish ${DEPTHS[i]})`, base.declared, json)
        } else {
          const [label, value] = SWAPS[pickInt(rng, 0, SWAPS.length - 1)]
          ;(target.parent as Record<string | number, unknown>)[target.key] = value
          await mutatedJson(kind, i, `${target.path} := ${label}`, base.declared, json)
        }
      } else if (kind === 'schema-shifted') {
        const moved = base.declared + SHIFTS[i]
        const json = JSON.parse(base.text) as Record<string, unknown>
        json.schemaVersion = moved
        // The header is NOT covered by the payload checksum, so a shifted body can arrive under
        // either header, and the two mean different things: a matched pair is a save from another
        // build, a mismatched one is the disagreement `guardDeclaredShape` calls corruption.
        const headerFollows = rng() < 0.67
        await mutatedJson(
          kind,
          i,
          `schemaVersion ${base.declared} -> ${moved}, header ${headerFollows ? 'follows' : `stays at ${base.declared}`}`,
          headerFollows ? moved : base.declared,
          json,
        )
      } else {
        const checksum = Uint8Array.from(base.checksum)
        const byte = pickInt(rng, 0, checksum.length - 1)
        const bit = pickInt(rng, 0, 7)
        checksum[byte] ^= 1 << bit
        craft(kind, i, `checksum byte ${byte} bit ${bit} flipped`, base.declared, base.payload, checksum)
      }
    }
  }
  return out
}

// -------------------------------------------------------------------------------------------------
// THE SENTENCE CATALOGUE – the refusals' copy, READ OUT OF THE SOURCE.
// -------------------------------------------------------------------------------------------------

/** Every sentence the two doors and the migration ladder can write, extracted from their own source
 *  rather than retyped (CLAUDE.md invariant 4: the copy is the owner's, and a pin that quotes it
 *  from memory is a second spelling of it that goes stale silently).
 *
 *  ⚠ COMMENTS ARE STRIPPED FIRST, and that is the whole reason this is not a grep over the file:
 *  both modules QUOTE their own sentences in prose – saveCodec's D-02 note quotes the migration
 *  ladder's line, saveGuard's D-04 note quotes «must be a list» – so a catalogue built from the raw
 *  text would happily bless a sentence no code can produce any more. */
function sentenceCatalogue(): string[][] {
  const src = ['saveGuard', 'saveCodec', 'migrations'].map((m) => codeOf(engineModuleSource(m))).join('\n')
  const literals = [...src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g), ...src.matchAll(/`((?:[^`\\]|\\.)*)`/g)].map(
    (m) => m[1],
  )
  return literals
    .map((raw) => raw.replace(/\\'/g, "'"))
    .filter((raw) => raw.length >= 12 && /\s/.test(raw) && /[a-z]{3}/.test(raw))
    // A template's literal chunks, in order – `${…}` is whatever the runtime put there.
    .map((raw) => raw.split(/\$\{[^}]*\}/).filter((chunk) => chunk.trim().length >= 6))
    .filter((chunks) => chunks.length > 0)
}

const CATALOGUE = sentenceCatalogue()

/** True when `message` carries one of the catalogue's sentences – all of its chunks, in order. */
function existingSentence(message: string): boolean {
  return CATALOGUE.some((chunks) => {
    let from = 0
    for (const chunk of chunks) {
      const at = message.indexOf(chunk, from)
      if (at < 0) return false
      from = at + chunk.length
    }
    return true
  })
}

const CODES: SaveFileErrorCode[] = [
  'not-a-save',
  'truncated',
  'oversized',
  'oversized-expanded',
  'future-schema',
  'corrupted',
  'invalid-shape',
]

// -------------------------------------------------------------------------------------------------
// DRIVING ONE VARIANT
// -------------------------------------------------------------------------------------------------

interface Refused {
  ok: false
  code?: SaveFileErrorCode
  message: string
  /** the constructor's own name – `SaveFileError` or the bare thing D-04 found */
  errName: string
  /** the error itself, so the assertion can ask `instanceof` rather than trust the name */
  raw: unknown
}
interface Accepted {
  ok: true
  world: WorldState
}
type Outcome = Refused | Accepted

async function through<T>(step: () => Promise<T>): Promise<{ ok: true; v: T } | { ok: false; err: unknown }> {
  try {
    return { ok: true, v: await step() }
  } catch (err) {
    return { ok: false, err }
  }
}

function refusal(err: unknown): Refused {
  const e = err as { code?: SaveFileErrorCode; message?: string }
  return {
    ok: false,
    code: e?.code,
    message: e?.message ?? String(err),
    errName: err instanceof Error ? err.constructor.name : typeof err,
    raw: err,
  }
}

interface Rehearsal {
  ok: boolean
  stage?: 'snapshot' | 'tick'
  message?: string
}

/** What `loadCareer` and `importSave` do to a world before the player sees it – the derived-cache
 *  refresh, the render, then one week – on a clone that is thrown away.
 *
 *  ⚠ DELIBERATELY NOT `ensureMainState`: its repair arm REPLAYS the career from the seed
 *  (`replayMainState`), and these bases sit at weeks 60 to 412, so a corpus that called it would
 *  spend its whole budget measuring the emergency exit instead of the door. The worker arm below
 *  drives the real `ensureMainState` on the handful of variants where it is the question. */
function rehearse(world: WorldState): Rehearsal {
  let stage: 'snapshot' | 'tick' = 'snapshot'
  try {
    const w = structuredClone(world)
    refreshDerivedRankCaches(w)
    toSnapshot(w)
    stage = 'tick'
    tickWeek(w, resumeMain(w.rngMain))
    return { ok: true }
  } catch (err) {
    return { ok: false, stage, message: err instanceof Error ? err.message : String(err) }
  }
}

// -------------------------------------------------------------------------------------------------
// THE BOOT DOOR'S BED: one career, a known-good OLDER generation written by the real writer, and the
// variant put over the newer one as raw bytes – which is what a version skew or a rotted record
// actually looks like on disk. White-box DB name/store, as tests/saves.test.ts already keeps them.
// -------------------------------------------------------------------------------------------------

const DB_NAME = 'tennis-sim'
const STORE = 'saves'
const BOOT_CAREER = 'c-fuzz-boot'
const LONE_CAREER = 'c-fuzz-lone'
const BOOT_WEEK = 4

interface RawRecord {
  slot: string
  careerId: string
  savedAt: number
  week: number
  seed: string
  bytes: number
  kidName: string
  country: string
  revision?: number
  checksum: Uint8Array
  payload: Uint8Array
}

function openRaw(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txDone(t: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

function getRaw(db: IDBDatabase, slot: string): Promise<RawRecord | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(slot)
    req.onsuccess = () => resolve(req.result as RawRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function putRaw(db: IDBDatabase, record: RawRecord): Promise<void> {
  const t = db.transaction(STORE, 'readwrite')
  t.objectStore(STORE).put(record)
  await txDone(t)
}

const sameBytes = (a: Uint8Array | undefined, b: Uint8Array | undefined): boolean =>
  !!a && !!b && a.length === b.length && a.every((v, i) => v === b[i])

/** A record's envelope, for «nothing moved» – the payload is compared separately, byte for byte. */
const envelopeOf = (r: RawRecord | undefined): string =>
  r ? JSON.stringify({ slot: r.slot, revision: r.revision, week: r.week, bytes: r.bytes }) : 'ABSENT'

// -------------------------------------------------------------------------------------------------
// THE WORKER – the import door's adopting half, where D-04's dry run lives.
// -------------------------------------------------------------------------------------------------

interface Reply {
  id: number
  ok: boolean
  error?: string
  /** absent on an untyped throw, which is exactly the tell D-04 asks about */
  code?: string
  revision?: number
  snapshot?: { week: number; careerId: string }
  bytes?: ArrayBuffer
  slots?: { slot: string; savedAt: number; revision?: number }[]
}

let lastRevision = 0
const { send, workerGlobal } = workerHarness<Reply>((r) => {
  if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
})

async function activeFingerprint(): Promise<string> {
  const snap = await send({ type: 'getSnapshot' })
  const slots = await send({ type: 'listSlots' })
  return JSON.stringify({
    careerId: snap.snapshot?.careerId,
    week: snap.snapshot?.week,
    revision: snap.revision,
    slots: slots.slots,
  })
}

// =================================================================================================

interface Measured {
  variant: Variant
  /** the file door, on its own – the step both `importSave` and `peekSave` begin with */
  imported: Outcome
  /** `toSnapshot` + one tick, run only on what the file door accepted */
  rehearsal: Rehearsal | null
  /** the boot door's own verdict on the variant's record, before the fallback gets a say */
  bootDecode: Outcome
  /** what `readLatestAutosave` answered with the variant as the newest generation */
  boot: Refused | { ok: true; recovered: boolean; loadedWeek: number }
  /** the same rehearsal on what the BOOT door handed over – measured, not asserted: see the header */
  bootRehearsal: Rehearsal | null
  /** the two generations' envelopes after the call */
  after: { good: string; variantGen: string; goodPayloadIntact: boolean; variantPayloadIntact: boolean }
}

const BASES: Base[] = []
const CORPUS: Variant[] = []
const MEASURED: Measured[] = []
let db: IDBDatabase
let goodRecord: RawRecord

beforeAll(async () => {
  // ⚠ THE CLOCK HERE IS A STOPWATCH AND NOTHING ELSE: it feeds one `console.log`, no assertion reads
  // it, and no byte of the corpus is a function of it. The generator's only source of variation is
  // `CORPUS_SEED` (CLAUDE.md invariant 2 – no `Math.random`, no bare `new Date()`).
  const built = Date.now()
  BASES.push(
    await goldenBase(SAVE_SCHEMA_VERSION),
    await goldenBase(70),
    await goldenBase(35),
    await e2eBase('fresh'),
    await e2eBase('pro'),
  )
  for (const base of BASES) CORPUS.push(...(await buildVariants(base)))
  const corpusMs = Date.now() - built

  // The known-good older generation, written by the real writer so the envelope and the careers row
  // are the product's own rather than this file's idea of them.
  const good = createWorld('fuzz-boot', DEFAULT_PROFILE, BOOT_CAREER)
  const rng = resumeMain(good.rngMain)
  for (let i = 0; i < BOOT_WEEK; i++) tickWeek(good, rng)
  await commitAutosave(good, 1)
  db = await openRaw()
  goodRecord = (await getRaw(db, `auto:${BOOT_CAREER}:a`))!
  expect(goodRecord, 'the known-good generation is on disk before anything hostile is').toBeTruthy()

  const drove = Date.now()
  for (const variant of CORPUS) {
    const file = await through(() => decodeExportFile(variant.file))
    const imported: Outcome = file.ok ? { ok: true, world: file.v } : refusal(file.err)
    const rehearsal = file.ok ? rehearse(file.v) : null

    await putRaw(db, {
      ...goodRecord,
      slot: `auto:${BOOT_CAREER}:b`,
      revision: 2, // the NEWEST generation: recNewer reads the revision first
      savedAt: goodRecord.savedAt + 1,
      bytes: variant.payload.byteLength,
      checksum: variant.checksum,
      payload: variant.payload,
    })
    const record = await through(() => decompressWorld(variant.payload, variant.checksum))
    const bootDecode: Outcome = record.ok ? { ok: true, world: record.v } : refusal(record.err)
    const answer = await through(() => readLatestAutosave(BOOT_CAREER))
    const boot = answer.ok
      ? { ok: true as const, recovered: answer.v.recovered, loadedWeek: answer.v.world.week }
      : refusal(answer.err)

    const goodAfter = await getRaw(db, `auto:${BOOT_CAREER}:a`)
    const variantAfter = await getRaw(db, `auto:${BOOT_CAREER}:b`)
    MEASURED.push({
      variant,
      imported,
      rehearsal,
      bootDecode,
      boot,
      bootRehearsal: boot.ok && !boot.recovered && bootDecode.ok ? rehearse(bootDecode.world) : null,
      after: {
        good: envelopeOf(goodAfter),
        variantGen: envelopeOf(variantAfter),
        goodPayloadIntact: sameBytes(goodAfter?.payload, goodRecord.payload),
        variantPayloadIntact: sameBytes(variantAfter?.payload, variant.payload),
      },
    })
  }

  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
  // The corpus's own shape, in the run log rather than in prose: a number a document states about
  // itself survives every gate (CLAUDE.md), and these are the numbers the next reader compares.
  const codes: Record<string, number> = {}
  const count = (door: string, code: string | undefined): void => {
    const key = `${door}:${code ?? 'UNTYPED'}`
    codes[key] = (codes[key] ?? 0) + 1
  }
  for (const m of MEASURED) {
    if (!m.imported.ok) count('import', m.imported.code)
    if (!m.boot.ok) count('boot', m.boot.code)
  }
  const tally = {
    variants: CORPUS.length,
    importRefused: MEASURED.filter((m) => !m.imported.ok).length,
    importAccepted: MEASURED.filter((m) => m.imported.ok).length,
    importAcceptedUnusable: MEASURED.filter((m) => m.rehearsal && !m.rehearsal.ok).length,
    bootRefused: MEASURED.filter((m) => !m.boot.ok).length,
    bootRecovered: MEASURED.filter((m) => m.boot.ok && m.boot.recovered).length,
    bootAccepted: MEASURED.filter((m) => m.boot.ok && !m.boot.recovered).length,
    bootAcceptedUnusable: MEASURED.filter((m) => m.bootRehearsal && !m.bootRehearsal.ok).length,
    rawMessageUnderCorrupted: MEASURED.filter(
      (m) => !m.bootDecode.ok && m.bootDecode.code === 'corrupted' && !existingSentence(m.bootDecode.message),
    ).length,
  }
  console.log(`[fuzz] built in ${corpusMs} ms, both doors in ${Date.now() - drove} ms`)
  console.log(`[fuzz] tally ${JSON.stringify(tally)}`)
  console.log(`[fuzz] codes ${JSON.stringify(codes)}`)
  // The two instrument lists, one line per variant, under `TB_FUZZ_VERBOSE=1`. Their COUNTS are in
  // the tally above (`importAcceptedUnusable`, `bootAcceptedUnusable`), so the default run still
  // states how many there are – only the recipes are opt-in.
  if (VERBOSE) {
    for (const m of MEASURED.filter((x) => x.rehearsal && !x.rehearsal.ok)) {
      console.log(`[fuzz] import-accepted-then-${m.rehearsal!.stage}: ${m.variant.id} :: ${m.variant.recipe}`)
    }
    // ⚠ THE BOOT DOOR'S OWN LIST, AND IT IS LONGER THAN THE IMPORT DOOR'S BY DESIGN – see the header:
    // that door runs neither the bounds walk nor the spine nor a dry run. Printed rather than asserted
    // because closing it is a product decision about `loadCareer`, not this test's to take.
    for (const m of MEASURED.filter((x) => x.bootRehearsal && !x.bootRehearsal.ok)) {
      console.log(`[fuzz] boot-accepted-then-${m.bootRehearsal!.stage}: ${m.variant.id} :: ${m.variant.recipe}`)
    }
  }
  // ⚠ THE HOOK CARRIES A BUDGET AND THE TESTS DELIBERATELY DO NOT. Every `it` below reads numbers
  // this hook already took, so the slowest of them is 0.7 s and the project's own 60 s ceiling
  // covers them with nothing restated. The HOOK is the one that needed a line: vitest's default
  // `hookTimeout` is 10 s, the work here is ~3 s solo, and `unit-bulk`'s measured contention
  // multiplier is at least 3.1x (vite.config.ts) – which is 10 s, i.e. exactly on the wall. 60 s is
  // the ceiling this project already sets for a test and never above it, so nothing new to clamp.
}, 60_000)

// =================================================================================================

describe('T1.7 – the save doors under a seeded hostile corpus', () => {
  it('the corpus is the shape it claims to be, and the same seeds give it twice', async () => {
    expect(CORPUS.length).toBe(BASES.length * KINDS.length * PER_KIND)
    for (const kind of KINDS) {
      expect(CORPUS.filter((v) => v.kind === kind).length, `${kind} variants`).toBe(BASES.length * PER_KIND)
    }
    // Every variant is somebody's – an id collision would silently halve the corpus.
    expect(new Set(CORPUS.map((v) => v.id)).size).toBe(CORPUS.length)

    // DETERMINISM, PROVEN RATHER THAN PINNED. A literal digest here would be a number about the
    // fixtures as much as about the generator, and it would go stale on the next schema bump; two
    // builds in one process compare the generator with itself and can never go stale.
    const again: Variant[] = []
    for (const base of BASES) again.push(...(await buildVariants(base)))
    expect(again.map((v) => `${v.id}|${v.recipe}|${v.declared}`)).toEqual(
      CORPUS.map((v) => `${v.id}|${v.recipe}|${v.declared}`),
    )
    const digest = async (list: Variant[]): Promise<string> => {
      const total = list.reduce((n, v) => n + v.payload.length + v.checksum.length + 4, 0)
      const all = new Uint8Array(total)
      let at = 0
      for (const v of list) {
        new DataView(all.buffer).setUint32(at, v.declared)
        at += 4
        all.set(v.payload, at)
        at += v.payload.length
        all.set(v.checksum, at)
        at += v.checksum.length
      }
      return [...(await sha256(all))].map((b) => b.toString(16).padStart(2, '0')).join('')
    }
    expect(await digest(again), 'the same seeds, the same bytes').toBe(await digest(CORPUS))
  })

  // -----------------------------------------------------------------------------------------------
  it('invariant 1 – every refusal is a typed SaveFileError carrying an existing sentence', () => {
    // The catalogue's own negative control: if the extractor ever matched everything, every arm in
    // this file would be vacuous, and the shape it must never bless is the one D-04 measured.
    expect(existingSentence("Cannot read properties of undefined (reading 'serve')")).toBe(false)
    expect(existingSentence('x')).toBe(false)
    expect(CATALOGUE.length).toBeGreaterThan(10)

    const refusals: [string, Refused][] = []
    for (const m of MEASURED) {
      if (!m.imported.ok) refusals.push([`import ${m.variant.id} (${m.variant.recipe})`, m.imported])
      if (!m.boot.ok) refusals.push([`boot ${m.variant.id} (${m.variant.recipe})`, m.boot])
    }
    expect(refusals.length, 'a corpus where nothing is refused is not measuring a door').toBeGreaterThan(50)
    for (const [where, r] of refusals) {
      expect(r.raw, `${where}: refused with a bare ${r.errName} – ${r.message}`).toBeInstanceOf(SaveFileError)
      expect(CODES, `${where}: the code must be one the store can branch on`).toContain(r.code)
      expect(existingSentence(r.message), `${where}: not an existing sentence – "${r.message}"`).toBe(true)
    }

    // ⚠ AND THE HALF THE BOOT DOOR DOES NOT PROMISE, ASSERTED AS THE RULE IT IS. `asCorrupted`
    // (saveCodec.ts) types every unreadable record as `corrupted` and leaves its MESSAGE untouched
    // on purpose, so a torn gzip or a migration block tripping over data can carry a raw message –
    // a fair share of this corpus's variants do (`rawMessageUnderCorrupted` in the run log – the
    // count lives there and not in this sentence, because a number in prose is the one thing no gate
    // reads). Every one of them is absorbed by the fallback below, so it is never the answer a player
    // gets. What must never happen is the same leak under any OTHER code, where there is no fallback
    // and the player reads the message: so a boot refusal that is not `corrupted` carries copy, which
    // is what the `future-schema` arm this wave shipped relies on.
    for (const m of MEASURED) {
      if (!m.bootDecode.ok && m.bootDecode.code !== 'corrupted') {
        expect(
          existingSentence(m.bootDecode.message),
          `boot ${m.variant.id} (${m.variant.recipe}): a non-corruption refusal must carry copy – "${m.bootDecode.message}"`,
        ).toBe(true)
      }
    }
  })

  // -----------------------------------------------------------------------------------------------
  it('invariant 3 – the boot door falls back on `corrupted`, and only on it', () => {
    let recovered = 0
    let accepted = 0
    let refused = 0
    for (const m of MEASURED) {
      const why = `${m.variant.id} (${m.variant.recipe})`
      if (!m.boot.ok) {
        // With a readable older generation present, the only way out of `readLatestAutosave` other
        // than a world is an error it declined to recover from – D-02's whole point.
        refused++
        expect(m.boot.code, `${why}: refused, so the newest generation must NOT have been corruption`).not.toBe(
          'corrupted',
        )
        expect(m.bootDecode.ok, `${why}: refused, so the newest generation did not decode`).toBe(false)
        if (!m.bootDecode.ok) expect(m.bootDecode.code, `${why}: the door's code crosses unchanged`).toBe(m.boot.code)
        continue
      }
      if (m.boot.recovered) {
        recovered++
        expect(m.bootDecode.ok, `${why}: a fallback means the newest generation was unreadable`).toBe(false)
        if (!m.bootDecode.ok) {
          expect(m.bootDecode.code, `${why}: the fallback is for corruption alone`).toBe('corrupted')
        }
        expect(m.boot.loadedWeek, `${why}: the fallback loads the known-good older generation`).toBe(BOOT_WEEK)
      } else {
        accepted++
        expect(m.bootDecode.ok, `${why}: no fallback, so the newest generation decoded`).toBe(true)
        expect(m.boot.loadedWeek, `${why}: the newest generation is what loaded`).not.toBe(BOOT_WEEK)
      }
    }
    // Every branch has to be reached, or the arm above is three assertions about nothing.
    expect(recovered, 'corrupted newest generations, recovered').toBeGreaterThan(10)
    expect(refused, 'newest generations refused without a rollback').toBeGreaterThan(5)
    expect(accepted, 'newest generations the DB door accepts – its trust level is deliberate').toBeGreaterThan(10)
  })

  it('invariant 3b – a lone generation has nothing to fall back to, and says so in a code', async () => {
    // The `gens.length === 1` branch, which the corpus above cannot reach: with one generation the
    // corrupted error is rethrown, so the store's branch on `code` is the only thing standing
    // between a torn record and the recovery screen.
    const lone = createWorld('fuzz-lone', DEFAULT_PROFILE, LONE_CAREER)
    await commitAutosave(lone, 1)
    const only = (await getRaw(db, `auto:${LONE_CAREER}:a`))!
    const torn = Uint8Array.from(only.payload)
    torn[torn.length - 5] ^= 0xff
    await putRaw(db, { ...only, payload: torn })
    const answer = await through(() => readLatestAutosave(LONE_CAREER))
    expect(answer.ok).toBe(false)
    if (!answer.ok) {
      const r = refusal(answer.err)
      expect(r.raw, `a lone torn record refused with a bare ${r.errName}`).toBeInstanceOf(SaveFileError)
      expect(r.code).toBe('corrupted')
      expect(existingSentence(r.message), `a lone torn record: "${r.message}"`).toBe(true)
    }
  })

  // -----------------------------------------------------------------------------------------------
  // INVARIANT 2 lives at the ADOPTING door, because it is the only one that can promise it: a world
  // the file door hands back has not been adopted yet, and a handful of the files it accepts cannot
  // be rendered or ticked – `importAcceptedUnusable` in the run log, with one `import-accepted-then-…`
  // line per recipe. `importSave` is where D-04's dry run answers for them, which is also why this
  // arm is the mutation arm for it.
  //
  // ⚠ THE WORKER SUBSET IS CAPPED AND DETERMINISTIC, not a sample of convenience: every variant the
  // rehearsal found unusable (the instruments), plus the first accepted-and-healthy one per base and
  // the first refused one per base (the control and the boundary). An import ADOPTS, so each send
  // costs a gzip, an IndexedDB transaction and – when a variant has broken the RNG pair's algebra –
  // `ensureMainState`'s replay of a 242-to-412-week career. The corpus is 200 variants; the budget
  // is one unit file.
  it('invariant 2 – nothing the import door adopts fails to render or advance', async () => {
    // The control arm, assembled by the same `assemble` the corpus uses: the UNMUTATED current
    // golden must come through the whole door, so a refusal below is the variant's doing and not the
    // harness's way of building a file.
    const control = await send({
      type: 'importSave',
      bytes: assemble(BASES[0].declared, BASES[0].payload, BASES[0].checksum).slice().buffer as ArrayBuffer,
    })
    expect(control.ok, `the untouched current golden must import: ${control.error}`).toBe(true)
    const controlAdvance = await send({ type: 'advance', weeks: 1, baseRevision: lastRevision })
    expect(controlAdvance.ok, `...and advance: ${controlAdvance.error}`).toBe(true)

    const firstPerBase = (pick: (m: Measured) => boolean): Measured[] =>
      BASES.map((b) => MEASURED.find((m) => m.variant.base === b.name && pick(m))).filter(
        (m): m is Measured => m !== undefined,
      )
    const instruments = MEASURED.filter((m) => m.imported.ok && m.rehearsal && !m.rehearsal.ok)
    expect(
      instruments.some((m) => m.rehearsal?.stage === 'tick'),
      'the corpus must contain a file that RENDERS and then fails on the tick, or the dry run has no witness',
    ).toBe(true)
    const healthy = firstPerBase((m) => m.imported.ok && !!m.rehearsal?.ok)
    const refused = firstPerBase((m) => !m.imported.ok)
    const subset = [...instruments, ...healthy, ...refused]

    for (const m of subset) {
      const why = `${m.variant.id} (${m.variant.recipe})`
      const before = await activeFingerprint()
      const res = await send({ type: 'importSave', bytes: m.variant.file.slice().buffer as ArrayBuffer })
      if (!res.ok) {
        expect(res.code, `${why}: a refusal the store can branch on`).toBeTruthy()
        expect(res.error, `${why}: ...and a sentence`).toBeTruthy()
        expect(existingSentence(res.error!), `${why}: not an existing sentence – "${res.error}"`).toBe(true)
        expect(await activeFingerprint(), `${why}: a refused import moved the career`).toBe(before)
        continue
      }
      // Accepted: the door has promised this file works, and «works» includes the next week. The
      // PRODUCT's own answer is asked first on purpose – a red arm should quote the engine's error,
      // not this file's opinion of it – and the rehearsal's agreement is the cross-check after it.
      const advanced = await send({ type: 'advance', weeks: 1, baseRevision: lastRevision })
      expect(advanced.ok, `${why}: adopted and then could not advance – ${advanced.error}`).toBe(true)
      expect(m.rehearsal?.ok, `${why}: adopted although it cannot ${m.rehearsal?.stage}`).toBe(true)
    }
  })

  // -----------------------------------------------------------------------------------------------
  // THE BOOT DOOR'S ADOPTING HALF, on the variants the door accepts and the engine then cannot use.
  //
  // `readLatestAutosave` hands back a world; `loadCareer` is what ADOPTS it (`ensureMainState`, then
  // `toSnapshot` inside `snapshotMsg`), and that pairing is the boot-side twin of `decodeExportFile`
  // + `importSave`. The corpus finds records this door accepts and the engine then throws on
  // (`bootAcceptedUnusable` in the log, one `boot-accepted-then-…` line each), and driving them
  // through the real command measured two things this file did NOT assert when it landed, because
  // both needed a product decision rather than a stricter test (reported to the architect, 26.09, with
  // these recipes):
  //   * the refusal is UNTYPED – a bare `TypeError` message with no `code`, which is D-04's own
  //     finding arriving on the door D-02 has just been through;
  //   * `loadCareer` sets `world = loaded` BEFORE `snapshotMsg` renders it, so a career whose newest
  //     generation cannot render replaces the career the worker was holding and every later
  //     `getSnapshot` throws. E-02 fixed that ordering for `new` / `restoreSlot` / `importSave` and
  //     B-02 for all 41 mutations; this is the one lifecycle path it has not reached.
  //
  // ⭐⭐ THE SECOND ONE IS FIXED AND IS NOW ASSERTED HERE – «fix(worker): a load adopts only what can
  // render – B-02's last lifecycle path». It needed no decision after all: the snapshot moves in
  // front of `touchCareer` and both assignments, which is the one-line shape E-02 gave the three
  // lifecycle paths and T1.4 gave all 41 mutations, with no wording, no schema and no RNG in it. So
  // the property below is the one this corpus created: a load the door refuses leaves the career the
  // worker was holding intact AND answerable. ⚠ The reorder also stops a refused load TOUCHING the
  // career, which is what made the defect self-reproducing – the career that cannot render was marked
  // as just-played before the render, so it became the one the next boot opens first and the player's
  // reload landed on the same wall. That half is pinned in tests/principles-b02-commit-order.test.ts,
  // where a spied throw can name the careers row; here the property is asserted on the real data.
  //
  // ⚠ MUTATION ARM, THE FILE'S THIRD (the other two are D-02's catch-all and T1.5's dry run): move
  // `const snapshot = toSnapshot(loaded)` back behind `touchCareer` and the two assignments in
  // `loadCareer`, and this arm goes red on the first refusal of the corpus – «golden-v89/field-deleted/0
  // (deleted ending (depth wish 1)): the worker can no longer answer for the career it held – Cannot
  // read properties of undefined (reading 'type')».
  //
  // ⚠ THE FIRST ONE IS STILL OPEN AND STILL NOT PINNED. Which sentence a refused load should carry is
  // the owner's (CLAUDE.md invariant 4), and this wave answers no part of it: a test that asserted
  // today's bare `TypeError` would pin the defect, and one that asserted a sentence would be inventing
  // his copy. The last assertion is unchanged and still the one that matters most whatever the reply:
  // THE DISK DOES NOT MOVE – the known-good older generation is still there, byte for byte, after
  // every one of them.
  it('a hostile newest generation cannot cost the player the generation behind it', async () => {
    const unusable = MEASURED.filter((m) => m.bootRehearsal && !m.bootRehearsal.ok)
    expect(unusable.length, 'the corpus must reach this door at all').toBeGreaterThan(0)
    // One block rather than one line per call: vitest prefixes every `console.log` with the test's
    // full name, and eighteen of those is 2 kB of header for 18 lines of measurement.
    const answers: string[] = []
    let refused = 0
    let loaded = 0
    for (const m of unusable) {
      const why = `${m.variant.id} (${m.variant.recipe})`
      await putRaw(db, {
        ...goodRecord,
        slot: `auto:${BOOT_CAREER}:b`,
        revision: 2,
        savedAt: goodRecord.savedAt + 1,
        bytes: m.variant.payload.byteLength,
        checksum: m.variant.checksum,
        payload: m.variant.payload,
      })
      // ⚠ READ IMMEDIATELY BEFORE THE LOAD, not once for the loop: a variant the door ACCEPTS
      // legitimately becomes the career the worker holds, so "what the player was on" is whatever the
      // previous iteration left – and the property is about the load that is refused, not about one
      // fixed career surviving eighteen of them.
      const before = await activeFingerprint()
      const res = await send({ type: 'loadCareer', careerId: BOOT_CAREER })
      if (!res.ok) {
        refused++
        const held = await send({ type: 'getSnapshot' })
        expect(held.ok, `${why}: the worker can no longer answer for the career it held – ${held.error}`).toBe(true)
        expect(await activeFingerprint(), `${why}: the refused load took the career the player was on`).toBe(before)
      } else {
        loaded++
      }
      // A load that SUCCEEDS is asked the second half of D-04's question, because the boot path has
      // no dry run: does the career it just opened survive one week?
      const next = res.ok ? await send({ type: 'advance', weeks: 1, baseRevision: lastRevision }) : null
      answers.push(
        `[fuzz] loadCareer ${m.variant.id} :: ${
          res.ok
            ? `LOADED week ${res.snapshot?.week}, next week ${next?.ok ? 'ok' : `REFUSED [${next?.code ?? 'no code'}] ${next?.error?.slice(0, 60)}`}`
            : `[${res.code ?? 'no code'}] ${res.error?.slice(0, 80)}`
        }`,
      )
      const good = await getRaw(db, `auto:${BOOT_CAREER}:a`)
      expect(sameBytes(good?.payload, goodRecord.payload), `${why}: the known-good generation moved`).toBe(true)
      const stillReads = await through(() => decompressWorld(good!.payload, good!.checksum))
      expect(stillReads.ok, `${why}: the known-good generation stopped reading`).toBe(true)
    }
    // The count stays unconditional – it is this door's half of the tally – and the recipes behind
    // `TB_FUZZ_VERBOSE=1`, like the two instrument lists in the hook.
    console.log(`[fuzz] loadCareer ${unusable.length} unusable newest generations: ${refused} refused, ${loaded} loaded`)
    if (VERBOSE) console.log(answers.join('\n'))
  })

  // -----------------------------------------------------------------------------------------------
  // ⚠ LAST ON PURPOSE: the final read below is the claim that the known-good generation survived the
  // WHOLE file, worker traffic included, and a `it` declared above the import arm could not make it.
  it('invariant 4 – no call overwrites or deletes a known-good generation', async () => {
    for (const m of MEASURED) {
      const why = `${m.variant.id} (${m.variant.recipe})`
      expect(m.after.good, `${why}: the older generation's envelope moved`).toBe(envelopeOf(goodRecord))
      expect(m.after.goodPayloadIntact, `${why}: the older generation's bytes moved`).toBe(true)
      // The unreadable newest generation stays too: «repaired» must not mean «quietly replaced», which
      // is the half of D-02 that made the old fallback a data loss rather than a rollback.
      expect(m.after.variantGen, `${why}: the newest generation was rewritten by a READ`).not.toBe('ABSENT')
      expect(m.after.variantPayloadIntact, `${why}: the newest generation's bytes moved`).toBe(true)
    }
    const still = await getRaw(db, `auto:${BOOT_CAREER}:a`)
    expect(sameBytes(still?.payload, goodRecord.payload), 'the known-good generation after everything').toBe(true)
    expect((await decompressWorld(still!.payload, still!.checksum)).week).toBe(BOOT_WEEK)
  })
})
