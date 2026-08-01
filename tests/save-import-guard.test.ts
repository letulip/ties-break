import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { encodeExportFile, decodeExportFile, sha256 } from '../src/engine/saveCodec'
import {
  SaveFileError,
  MAX_COMPRESSED_BYTES,
  MAX_EXPANDED_BYTES,
  type SaveFileErrorCode,
} from '../src/engine/saveGuard'
import { DEFAULT_PROFILE, type ToWorker } from '../src/shared/protocol'
import { closeDb } from '../src/db/saves'

// =================================================================================================
// W1-INTEGRITY-B (Codex TB-06) — THE IMPORT GATE'S FUZZ CORPUS, in three layers.
//
//   1. CODEC FUZZ: every hostile-file class TB-06 names — oversized (both caps), truncated,
//      bit-flipped, wrong-magic, future-schema, header/body disagreement, decodes-but-not-world-
//      shaped, bomb-nested — terminates quickly with a TYPED error (`SaveFileError.code`), never a
//      hang, never a stack-trace message, never a partial world.
//   2. THE COMPATIBILITY WINDOW: every golden fixture v0..current imports through the FULL strict
//      gate. This is the guard that keeps the versioned spine honest — a shape rule that any real
//      historical save violates cannot land, because this suite goes red first.
//   3. COMMIT-OR-NOTHING at the worker: a failed import — hostile bytes OR a healthy file meeting
//      a dead database — leaves the active career, its autosave chain and the careers list
//      byte-for-byte untouched. `world` moves only after decode, validation, migration, RNG
//      verify AND the persist all succeeded.
// =================================================================================================

const enc = new TextEncoder()

function liveCareer(seed: string, weeks: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE, `c-${seed}`)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

async function gz(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Hand-craft an export file: MAGIC | declared u32 | sha256(payload) | payload. The checksum is
 *  computed honestly on purpose — most of these fixtures model a WRITER that was hostile or
 *  broken, not a file that rotted (the bit-flip case covers rot). */
async function craftFile(declared: number, payload: Uint8Array): Promise<Uint8Array> {
  const out = new Uint8Array(44 + payload.length)
  out.set(enc.encode('TSIMSAVE'), 0)
  new DataView(out.buffer).setUint32(8, declared)
  out.set(await sha256(payload), 12)
  out.set(payload, 44)
  return out
}

async function craftJsonFile(declared: number, json: string): Promise<Uint8Array> {
  return craftFile(declared, await gz(enc.encode(json)))
}

/** A minimal payload that satisfies the v35 spine — the base the shape tests then break. */
function spineV35(overrides: Record<string, unknown> = {}): string {
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
    seasonHistory: [],
    trophiesByTier: {},
    offers: [],
    onRampCleared: { itf: false, wta: false },
    rngMain: { s: 1, n: 0 },
    ...overrides,
  })
}

async function expectCode(bytes: Uint8Array, code: SaveFileErrorCode, msg?: RegExp): Promise<void> {
  const err = await decodeExportFile(bytes).then(
    () => null,
    (e: unknown) => e,
  )
  expect(err, 'the import must be rejected').toBeInstanceOf(SaveFileError)
  expect((err as SaveFileError).code).toBe(code)
  if (msg) expect((err as SaveFileError).message).toMatch(msg)
}

describe('layer 1 — hostile files die fast, typed, and named', () => {
  it('wrong magic: not one of our files at all', async () => {
    await expectCode(enc.encode('definitely not a save'), 'not-a-save', /not a tennis sim save/i)
  })

  it('truncated header: magic present, nothing else', async () => {
    const stub = new Uint8Array(20)
    stub.set(enc.encode('TSIMSAVE'), 0)
    await expectCode(stub, 'truncated', /cut short/i)
  })

  it('oversized compressed bytes are refused BEFORE any parse', async () => {
    // Nothing behind the header is even looked at — the cap is the first check, so the body can
    // be garbage and the rejection is O(1).
    const huge = new Uint8Array(MAX_COMPRESSED_BYTES + 1)
    huge.set(enc.encode('TSIMSAVE'), 0)
    await expectCode(huge, 'oversized', /too large/i)
  })

  it('a gzip bomb is aborted mid-inflation at the expanded cap', async () => {
    // ~64 MiB of zeros compresses to ~64 KiB — the classic shape. The streaming reader must stop
    // AT the cap, not buffer the whole expansion and measure the corpse.
    const bomb = await gz(new Uint8Array(MAX_EXPANDED_BYTES + 1024))
    expect(bomb.byteLength).toBeLessThan(MAX_COMPRESSED_BYTES) // it really is a bomb, not a big file
    await expectCode(await craftFile(35, bomb), 'oversized-expanded', /refusing to unpack/i)
  })

  it('a flipped bit fails the checksum (the storage-rot arm)', async () => {
    const file = await encodeExportFile(liveCareer('fuzz-flip', 3))
    file[file.length - 5] ^= 0xff
    await expectCode(file, 'corrupted', /checksum/i)
  })

  it('a truncated payload fails the checksum, not the inflater', async () => {
    const file = await encodeExportFile(liveCareer('fuzz-cut', 3))
    await expectCode(file.subarray(0, Math.floor(file.length / 2)), 'corrupted', /checksum/i)
  })

  it('a future schema is refused BEFORE decompression, with upgrade advice', async () => {
    const file = await encodeExportFile(liveCareer('fuzz-future', 3))
    new DataView(file.buffer, file.byteOffset, file.byteLength).setUint32(8, 36)
    await expectCode(file, 'future-schema', /newer version .* update the app/i)
  })

  it('a header/body version disagreement is corruption, not a guess', async () => {
    // The header is NOT covered by the payload checksum, so the two claiming different schemas
    // means one of them lies and there is no way to know which.
    const file = await encodeExportFile(liveCareer('fuzz-mismatch', 3))
    new DataView(file.buffer, file.byteOffset, file.byteLength).setUint32(8, 34)
    await expectCode(file, 'corrupted', /header and its data disagree/i)
  })

  it('valid gzip of non-JSON is corrupted, with a readable message', async () => {
    await expectCode(await craftJsonFile(35, '{not json'), 'corrupted', /cannot be read/i)
  })

  it('decodes fine but is not world-shaped: a missing spine field is named', async () => {
    const json = JSON.parse(spineV35()) as Record<string, unknown>
    delete json.week
    await expectCode(await craftJsonFile(35, JSON.stringify(json)), 'invalid-shape', /"week"/)
  })

  it('a mistyped spine field is named too', async () => {
    await expectCode(await craftJsonFile(35, spineV35({ week: 'ten' })), 'invalid-shape', /"week"/)
  })

  it('JSON Infinity (1e999) cannot ride into the ledger', async () => {
    // JSON.parse('1e999') really returns Infinity — the bounds walk refuses non-finite numbers.
    const json = spineV35().replace('"fundsCents":1000', '"fundsCents":1e999')
    await expectCode(await craftJsonFile(35, json), 'invalid-shape', /non-finite/i)
  })

  it('a finite but absurd fundsCents fails the range check', async () => {
    await expectCode(await craftJsonFile(35, spineV35({ fundsCents: 1e16 })), 'invalid-shape', /"fundsCents"/)
  })

  it('an out-of-range rngMain register fails the spine (int32 domain, signed)', async () => {
    const bad = spineV35({ rngMain: { s: 2 ** 32, n: 0 } })
    await expectCode(await craftJsonFile(35, bad), 'invalid-shape', /"rngMain"/)
  })

  it('bomb nesting: 1000-deep arrays parse, then die at the depth bound', async () => {
    // Deep enough to blow a RECURSIVE validator's stack (which is why the walker is iterative),
    // shallow enough that JSON.parse itself survives to hand it over.
    const deep = '['.repeat(1000) + '1' + ']'.repeat(1000)
    await expectCode(await craftJsonFile(35, deep), 'invalid-shape', /nests deeper/i)
  })

  it('an implausibly long list dies at the array bound', async () => {
    const json = spineV35({ entries: new Array(60_000).fill(0) })
    await expectCode(await craftJsonFile(35, json), 'invalid-shape', /implausibly long/i)
  })

  it('an implausibly long string dies at the string bound', async () => {
    const json = spineV35({ seed: 'x'.repeat(40_000) })
    await expectCode(await craftJsonFile(35, json), 'invalid-shape', /implausibly long|longer than/i)
  })
})

describe('layer 2 — the compatibility window holds through the strict gate', () => {
  const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
  const FILES = readdirSync(DIR)
    .filter((f) => /^v\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))

  for (const file of FILES) {
    it(`golden ${file} imports through caps + bounds + declared-shape + migration`, async () => {
      const raw = JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8')) as WorldState
      // encodeExportFile stamps the world's OWN declared version into the header (v0 has none —
      // DataView coerces undefined to 0, which is exactly what migrateSave assumes), so each
      // fixture walks the gate as the historical file it is, not as a re-labelled modern one.
      const imported = await decodeExportFile(await encodeExportFile(raw))
      expect(imported.schemaVersion).toBe(35)
      expect(typeof imported.seed).toBe('string')
    })
  }
})

// =================================================================================================
// Layer 3 — the worker: same self-shim harness as tests/sim-worker-rng.test.ts. Every byte the
// worker sees travels the real codec; IndexedDB is fake-indexeddb.
// =================================================================================================

interface Reply {
  id: number
  ok: boolean
  error?: string
  recovered?: true
  snapshot?: { week: number; careerId: string }
  bytes?: ArrayBuffer
  slots?: { slot: string; savedAt: number }[]
  careers?: { careerId: string }[]
}

const waiters = new Map<number, (r: Reply) => void>()
const workerGlobal = {
  onmessage: null as null | ((e: { data: ToWorker }) => void),
  postMessage(m: unknown) {
    const r = m as Reply
    waiters.get(r.id)?.(r)
    waiters.delete(r.id)
  },
}
;(globalThis as unknown as { self: unknown }).self = workerGlobal

// Omit must distribute over the message union (same trick as client.ts's DistributiveOmit).
type WorkerMsg<T = ToWorker> = T extends { id: number } ? Omit<T, 'id'> : never

let nextId = 1
function send(msg: WorkerMsg): Promise<Reply> {
  return new Promise((resolve) => {
    const id = nextId++
    waiters.set(id, resolve)
    workerGlobal.onmessage!({ data: { ...msg, id } as ToWorker })
  })
}

async function importIntoWorker(world: WorldState): Promise<Reply> {
  const bytes = (await encodeExportFile(world)).slice()
  return send({ type: 'importSave', bytes: bytes.buffer as ArrayBuffer })
}

async function exportedWorld(): Promise<WorldState> {
  const res = await send({ type: 'exportSave' })
  expect(res.ok, res.error).toBe(true)
  return decodeExportFile(new Uint8Array(res.bytes!))
}

async function slotFingerprint(): Promise<string> {
  const res = await send({ type: 'listSlots' })
  return JSON.stringify(res.slots)
}

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
})

describe('layer 3 — a failed import changes NOTHING', () => {
  it('hostile bytes leave the active career, its slots and the careers list untouched', async () => {
    const anchor = liveCareer('anchor-career', 8)
    expect((await importIntoWorker(anchor)).ok).toBe(true)
    const slotsBefore = await slotFingerprint()
    const careersBefore = JSON.stringify((await send({ type: 'listCareers' })).careers)

    const hostiles: Uint8Array[] = [
      enc.encode('definitely not a save'),
      await craftJsonFile(35, spineV35({ week: 'ten' })),
      await craftJsonFile(35, '{not json'),
    ]
    for (const bytes of hostiles) {
      const res = await send({ type: 'importSave', bytes: bytes.slice().buffer as ArrayBuffer })
      expect(res.ok).toBe(false)
      expect(res.error, 'a typed, player-readable message').toBeTruthy()
    }

    const held = await exportedWorld()
    expect(held.seed).toBe('anchor-career')
    expect(held.week).toBe(8)
    expect(held.rngMain).toEqual(anchor.rngMain)
    expect(await slotFingerprint()).toBe(slotsBefore)
    expect(JSON.stringify((await send({ type: 'listCareers' })).careers)).toBe(careersBefore)
  })

  it('a HEALTHY file meeting a dead database also changes nothing — persist-then-commit', async () => {
    const anchor = await exportedWorld() // whatever layer-3 test 1 left active
    const slotsBefore = await slotFingerprint()

    // Kill IndexedDB the way a browser does: opens fail. `closeDb()` first — the healthy
    // connection from the test above is memoised, and a cached connection would happily keep
    // writing without ever meeting the broken `open`. The valid import must decode fine and
    // then REFUSE to become the active career, because its autosave could not be written.
    await closeDb()
    const realIDB = globalThis.indexedDB
    ;(globalThis as { indexedDB: IDBFactory }).indexedDB = {
      open() {
        const req = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null, error: null } as unknown as IDBOpenDBRequest
        setTimeout(() => (req as { onerror: null | ((e: unknown) => void) }).onerror?.({ target: req }))
        return req
      },
    } as unknown as IDBFactory

    try {
      const res = await importIntoWorker(liveCareer('healthy-but-homeless', 5))
      expect(res.ok, 'the import must fail when its autosave cannot be written').toBe(false)
    } finally {
      ;(globalThis as { indexedDB: IDBFactory }).indexedDB = realIDB
    }

    // The database is back — and the worker still holds the anchor, chain intact, and the
    // homeless career never reached the careers list.
    const held = await exportedWorld()
    expect(held.seed).toBe(anchor.seed)
    expect(held.week).toBe(anchor.week)
    expect(await slotFingerprint()).toBe(slotsBefore)
    const careers = (await send({ type: 'listCareers' })).careers ?? []
    expect(careers.some((c) => c.careerId === 'c-healthy-but-homeless')).toBe(false)
  })
})
