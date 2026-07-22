import { openDB, reqToPromise } from './idb'
import { compressWorld, decompressWorld } from '../engine/saveCodec'
import type { WorldState } from '../engine/world'
import type { SlotMeta } from '../shared/protocol'

// Save slots in IndexedDB: each record is one compressed, checksummed blob.
// DB schema migrations are append-only `if (oldVersion < N)` blocks, same rule as save migrations.

const DB_NAME = 'tennis-sim'
const DB_VERSION = 1
const STORE = 'saves'
const AUTOSAVE_SLOTS = ['auto-0', 'auto-1', 'auto-2']

interface SaveRecord extends SlotMeta {
  checksum: Uint8Array
  payload: Uint8Array
}

let dbPromise: Promise<IDBDatabase> | null = null

// Autosave rotation picks the oldest slot by savedAt; keep timestamps strictly
// increasing so two saves in the same millisecond can't confuse it.
let lastSavedAt = 0
function nextSavedAt(): number {
  lastSavedAt = Math.max(Date.now(), lastSavedAt + 1)
  return lastSavedAt
}

function db(): Promise<IDBDatabase> {
  dbPromise ??= openDB(DB_NAME, DB_VERSION, (database, oldVersion) => {
    if (oldVersion < 1) {
      database.createObjectStore(STORE, { keyPath: 'slot' })
    }
  })
  return dbPromise
}

function store(database: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return database.transaction(STORE, mode).objectStore(STORE)
}

export async function writeSlot(slot: string, world: WorldState): Promise<SlotMeta> {
  const { payload, checksum } = await compressWorld(world)
  const record: SaveRecord = {
    slot,
    savedAt: nextSavedAt(),
    week: world.week,
    seed: world.seed,
    bytes: payload.byteLength,
    checksum,
    payload,
  }
  await reqToPromise(store(await db(), 'readwrite').put(record))
  const { checksum: _c, payload: _p, ...meta } = record
  return meta
}

export async function readSlot(slot: string): Promise<WorldState> {
  const record = (await reqToPromise(store(await db(), 'readonly').get(slot))) as SaveRecord | undefined
  if (!record) throw new Error(`No save in slot "${slot}"`)
  return decompressWorld(record.payload, record.checksum)
}

export async function deleteSlot(slot: string): Promise<void> {
  await reqToPromise(store(await db(), 'readwrite').delete(slot))
}

export async function listSlots(): Promise<SlotMeta[]> {
  const records = (await reqToPromise(store(await db(), 'readonly').getAll())) as SaveRecord[]
  return records
    .map(({ checksum: _c, payload: _p, ...meta }) => meta)
    .sort((a, b) => b.savedAt - a.savedAt)
}

// Rotate autosaves: overwrite the oldest of the three slots.
export async function autosave(world: WorldState): Promise<SlotMeta> {
  const metas = await listSlots()
  const used = new Map(metas.filter((m) => AUTOSAVE_SLOTS.includes(m.slot)).map((m) => [m.slot, m.savedAt]))
  const free = AUTOSAVE_SLOTS.find((s) => !used.has(s))
  const target =
    free ?? AUTOSAVE_SLOTS.reduce((oldest, s) => ((used.get(s) ?? 0) < (used.get(oldest) ?? 0) ? s : oldest))
  return writeSlot(target, world)
}
