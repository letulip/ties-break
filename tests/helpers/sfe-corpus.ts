// THE SAVE-FILE REFUSAL CORPUS – every way the two doors, the guard and the codec can refuse a save, as data (10.10, the L3-7 close-out «seven player-facing SaveFileError refusals typify NOW»,
// docs/decisions.md 10.10 item 33). Shared by `tests/i18n-l3-7-save-file-errors.test.ts` in its two modes:
//   · CAPTURE (`SFE_CAPTURE=<path>`) writes every variant's outcome on WHATEVER tree it runs on – `tests/fixtures/sfe/old-arm.json` was captured on the PRE-wave tree (8f8c9298), before a line of
//     `saveGuard.ts`, `saveCodec.ts` or `sim.worker.ts` moved;
//   · COMPARE (default) runs the same variants on the tree under test and demands the same outcome, variant for variant.
// ⚠ THIS FILE USES ONLY WHAT THE PRE-WAVE TREE ALREADY EXPORTS (`decodeExportFile`, `decompressWorld`, `sha256`, the four guards, the two caps) – that is what lets one corpus be run on both arms.
// ⚠ NO SENTENCE IS TYPED HERE. A variant is a way to provoke a refusal; what the refusal SAYS is read off the tree that raises it (and compared with the frozen capture), never stated in this file.
// ⚠ A MESSAGE THAT QUOTES THE SCHEMA VERSION IS NORMALISED (`normalise`): the corpus provokes `future-schema` with versions RELATIVE to `SAVE_SCHEMA_VERSION`, and the capture stores them as `<V+k>`,
//   so the next schema bump does not turn a frozen fixture into a false red.
import { createWorld, SAVE_SCHEMA_VERSION } from '../../src/engine/world'
import { decodeExportFile, decompressWorld, sha256 } from '../../src/engine/saveCodec'
import {
  guardCompressedSize,
  guardDeclaredShape,
  guardDeclaredVersion,
  guardPayloadBounds,
  MAX_COMPRESSED_BYTES,
  MAX_EXPANDED_BYTES,
} from '../../src/engine/saveGuard'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

const enc = new TextEncoder()
const V = SAVE_SCHEMA_VERSION

/** What a variant produced: nothing thrown, or the thrown value as the tree under test built it. */
export type Outcome = { kind: 'ok' } | { kind: 'refused'; name: string; code: string | null; message: string; c?: unknown }

export interface Variant {
  id: string
  /** the byte string of a FILE variant, so the worker arm can send the same bytes through `importSave` (absent for a guard- or DB-level variant) */
  file?: () => Promise<Uint8Array>
  run: () => Promise<void>
  /** the refusal's detail is a lower layer's own text (a V8 `TypeError`), so only its fixed prefix is compared with the capture */
  volatile?: boolean
}

export async function gz(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** MAGIC | declared u32 | sha256(payload) | payload – the checksum computed honestly, as `tests/save-import-guard.test.ts` does. */
export async function craftFile(declared: number, payload: Uint8Array): Promise<Uint8Array> {
  const out = new Uint8Array(44 + payload.length)
  out.set(enc.encode('TSIMSAVE'), 0)
  new DataView(out.buffer).setUint32(8, declared)
  out.set(await sha256(payload), 12)
  out.set(payload, 44)
  return out
}

/** The v35 spine, minimal – the base `tests/save-import-guard.test.ts` breaks; here it is the base of the recipe that makes the LADDER throw. */
export function spineV35(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    schemaVersion: 35,
    seed: 'fuzz',
    week: 10,
    fundsCents: 1000,
    profile: { kidName: 'Vera' },
    plan: { train: 60, rest: 40 },
    careerId: 'c-fuzz',
    cohort: [],
    results: [],
    season: [],
    entries: [],
    events: [],
    nextEventId: 1,
    financeWeeks: [],
    injuryHistory: [],
    knockHistory: [],
    vacations: [],
    practices: [],
    internationalEntryWeeks: [],
    milestones: [],
    seasonHistory: [],
    trophiesByTier: {},
    offers: [],
    onRampCleared: { itf: false, wta: false },
    rngMain: { s: 1, n: 0 },
    ...overrides,
  })
}

const TOKENS = [57, 3, 1, 0].map((k) => [String(V + k), `<V+${k}>`] as const)
/** a message with the schema versions it quotes spelled relative to the build's own */
export function normalise(message: string): string {
  return TOKENS.reduce((s, [n, token]) => s.replace(new RegExp(`(?<![\\d.])${n}(?![\\d.])`, 'g'), token), message)
}

export function outcomeOf(thrown: unknown): Outcome {
  const e = thrown as { name?: string; code?: string; message?: string; c?: unknown }
  return {
    kind: 'refused',
    name: thrown instanceof Error ? thrown.constructor.name : typeof thrown,
    code: typeof e?.code === 'string' ? e.code : null,
    message: String(e?.message ?? thrown),
    ...(e?.c !== undefined ? { c: e.c } : {}),
  }
}

export async function runVariant(v: Variant): Promise<Outcome> {
  try {
    await v.run()
    return { kind: 'ok' }
  } catch (err) {
    return outcomeOf(err)
  }
}

const MISSING = Symbol('missing')
/** Bad values for each top-level field of a real career – each one names what it is, so a failing id reads. */
const BAD: ReadonlyArray<readonly [string, unknown]> = [
  ['missing', MISSING],
  ['null', null],
  ['text', 'x'],
  ['empty-text', ''],
  ['long-text', 'a'.repeat(201)],
  ['negative', -1],
  ['fraction', 1.5],
  ['huge', 1e16],
  ['past-the-week-cap', 52_001],
  ['past-safe-integer', 2 ** 53],
  ['infinity', Infinity],
  ['list', []],
  ['object', {}],
  ['profile-without-name', { kidName: '' }],
  ['plan-with-text', { train: 'x', rest: 1 }],
  ['totals-partial', { earnedCents: 1 }],
  ['latches-partial', { itf: true }],
  ['rng-fraction', { s: 1.5, n: 0 }],
]

let bombCache: Uint8Array | null = null
/** a gzip stream that inflates past the expanded cap – built once (≈64 MiB of zeros, a fraction of a second) */
async function bomb(): Promise<Uint8Array> {
  bombCache ??= await gz(new Uint8Array(MAX_EXPANDED_BYTES + 1024))
  return bombCache
}

export async function buildVariants(): Promise<Variant[]> {
  const out: Variant[] = []
  const add = (id: string, run: () => unknown, extra: Partial<Variant> = {}): void => {
    out.push({ id, run: async () => void (await run()), ...extra })
  }
  const addFile = (id: string, bytes: () => Promise<Uint8Array>, extra: Partial<Variant> = {}): void => {
    add(id, async () => decodeExportFile(await bytes()), { file: bytes, ...extra })
  }

  // ---- the compressed-size cap, at several sizes (the megabytes print to one decimal)
  for (const n of [MAX_COMPRESSED_BYTES + 1, 17_000_000, 20_000_000, 33_554_432, 100_000_000]) add(`size:${n}`, () => guardCompressedSize(n))
  add('size:at-the-cap', () => guardCompressedSize(MAX_COMPRESSED_BYTES))

  // ---- the declared version
  for (const [name, n] of [['negative', -1], ['fraction', 1.5], ['nan', NaN], ['one-newer', V + 1], ['far-newer', V + 57], ['u32-max', 4_294_967_295], ['current', V]] as const) {
    add(`version:${name}`, () => guardDeclaredVersion(n))
  }

  // ---- the bounds walk, one variant per limit it enforces
  add('bounds:nodes', () => {
    const arrays: number[][] = []
    for (let i = 0; i < 41; i++) arrays.push(new Array<number>(50_000).fill(0))
    guardPayloadBounds(arrays)
  })
  add('bounds:depth', () => {
    let v: unknown = 0
    for (let i = 0; i < 70; i++) v = [v]
    guardPayloadBounds(v)
  })
  add('bounds:non-finite', () => guardPayloadBounds({ a: Infinity }))
  add('bounds:long-text', () => guardPayloadBounds({ a: 'x'.repeat(32_769) }))
  add('bounds:long-list', () => guardPayloadBounds(new Array<number>(50_001).fill(0)))
  add('bounds:long-field-name', () => guardPayloadBounds({ ['k'.repeat(32_769)]: 1 }))
  add('bounds:fine', () => guardPayloadBounds({ a: [1, 2, { b: 'c' }] }))

  // ---- the declared shape: not a career at all, and the header/body disagreement
  for (const [name, v] of [['null', null], ['number', 5], ['list', []], ['text', 'x']] as const) add(`shape:not-a-career:${name}`, () => guardDeclaredShape(v, V))
  add('shape:header-body-disagree', () => guardDeclaredShape({ schemaVersion: V - 1 }, V))
  add('shape:header-without-body-version', () => guardDeclaredShape({}, 5))

  // ---- the spine: every top-level field of a real career, each broken in every way above (a field that is not on the spine is accepted, and so is part of the capture)
  const base = JSON.parse(JSON.stringify(createWorld('sfe-corpus', { ...DEFAULT_PROFILE }, 'c-sfe-corpus'))) as Record<string, unknown>
  for (const key of Object.keys(base).sort()) {
    for (const [name, bad] of BAD) {
      add(`spine:${key}:${name}`, () => {
        const payload: Record<string, unknown> = { ...base }
        if (bad === MISSING) delete payload[key]
        else payload[key] = bad
        guardDeclaredShape(payload, V)
      })
    }
  }

  // ---- the file door, byte by byte
  addFile('file:empty', async () => new Uint8Array(0))
  addFile('file:wrong-magic', async () => enc.encode('definitely not a save'))
  addFile('file:short-before-magic', async () => enc.encode('TSIM'))
  addFile('file:cut-short', async () => {
    const stub = new Uint8Array(20)
    stub.set(enc.encode('TSIMSAVE'), 0)
    return stub
  })
  addFile('file:oversized', async () => new Uint8Array(MAX_COMPRESSED_BYTES + 1))
  addFile('file:future-header', async () => {
    const stub = new Uint8Array(44)
    stub.set(enc.encode('TSIMSAVE'), 0)
    new DataView(stub.buffer).setUint32(8, V + 1)
    return stub
  })
  addFile('file:far-future-header', async () => {
    const stub = new Uint8Array(44)
    stub.set(enc.encode('TSIMSAVE'), 0)
    new DataView(stub.buffer).setUint32(8, V + 57)
    return stub
  })
  addFile('file:checksum-rot', async () => {
    const file = await craftFile(V, await gz(enc.encode(spineV35())))
    file[file.length - 5] ^= 0xff
    return file
  })
  addFile('file:not-gzip', async () => craftFile(V, enc.encode('this is not a gzip stream')))
  addFile('file:gzip-of-not-json', async () => craftFile(V, await gz(enc.encode('this is not json'))))
  addFile('file:expansion-bomb', async () => craftFile(V, await bomb()))
  addFile('file:bounds-too-deep', async () => {
    let v: unknown = 0
    for (let i = 0; i < 70; i++) v = [v]
    return craftFile(V, await gz(enc.encode(JSON.stringify(v))))
  })
  addFile('file:spine-results-text', async () => craftFile(35, await gz(enc.encode(spineV35({ results: 'x' })))))
  addFile('file:spine-week-over', async () => craftFile(35, await gz(enc.encode(spineV35({ week: 60_000 })))))
  addFile('file:header-body-disagree', async () => craftFile(36, await gz(enc.encode(spineV35()))))
  addFile('file:not-an-object', async () => craftFile(V, await gz(enc.encode('[1,2,3]'))))
  addFile('file:ladder-throws', async () => craftFile(35, await gz(enc.encode(spineV35({ events: [null] })))), { volatile: true })

  // ---- the database door (`decompressWorld`): our own record, so no bounds walk and no spine
  add('db:newer-build', async () => {
    const payload = await gz(enc.encode(JSON.stringify({ schemaVersion: V + 3 })))
    await decompressWorld(payload, await sha256(payload))
  })
  add('db:checksum-rot', async () => {
    const payload = await gz(enc.encode(spineV35()))
    const checksum = await sha256(payload)
    checksum[0] ^= 0xff
    await decompressWorld(payload, checksum)
  })
  add('db:not-gzip', async () => {
    const payload = enc.encode('this is not a gzip stream')
    await decompressWorld(payload, await sha256(payload))
  }, { volatile: true })
  add('db:ladder-throws', async () => {
    const payload = await gz(enc.encode(spineV35({ events: [null] })))
    await decompressWorld(payload, await sha256(payload))
  }, { volatile: true })

  return out
}
