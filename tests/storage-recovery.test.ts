import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
// A's pipeline renamed the write paths: `adoptAutosave` is the lineage-adopting seed
// write (allocates disk+1 and persists) - exactly what seeding a standalone career needs.
import { adoptAutosave, closeDb } from '../src/db/saves'
import { DEFAULT_PROFILE, type ToWorker, type ToUI } from '../src/shared/protocol'

// =================================================================================================
// W1-INTEGRITY-B (Codex TB-06) — INIT IS A TOTAL TRANSITION: `loading -> ready | recovery`.
//
// The failure this suite exists to make impossible again: IndexedDB refuses to open (private
// browsing, disk full, a wedged browser profile) and the app either spins on "Loading…" forever
// or — worse — boots a player with years of careers into the onboarding wizard as if the device
// were fresh, because the failed careers probe was silently swallowed.
//
// Three contracts, each pinned end-to-end through the REAL store, the REAL worker module and the
// REAL db layer (fake-indexeddb underneath, a shimmed `Worker` bridging the two):
//   1. an injected `indexedDB.open` failure lands init in `recovery` with the error surfaced;
//   2. Retry SUCCEEDS WITHOUT A RELOAD once storage is back — which is the db() open-promise
//      reset in src/db/saves.ts doing its one job (before it, the first rejection was memoised
//      and every retry re-awaited the same dead promise until the tab reloaded);
//   3. every door out of recovery behaves: retry-into-ready, import-into-ready (and an import
//      that STILL cannot persist stays in recovery, error visible), start-fresh-into-onboarding.
// =================================================================================================

// --- the worker side of the bridge: the sim.worker module registers onto this `self` -------------
const waiters: Array<(r: ToUI) => void> = []
const workerGlobal = {
  onmessage: null as null | ((e: { data: ToWorker }) => void),
  postMessage(m: unknown) {
    // deliver to the UI side (the FakeWorker instances client.ts created)
    for (const w of uiWorkers) w.onmessage?.({ data: m as ToUI } as MessageEvent<ToUI>)
    for (const fn of waiters.splice(0)) fn(m as ToUI)
  },
}
;(globalThis as unknown as { self: unknown }).self = workerGlobal

// --- the UI side: client.ts news up `Worker`; this shim routes postMessage into the module -------
const uiWorkers: Array<{ onmessage: null | ((e: MessageEvent<ToUI>) => void) }> = []
class FakeWorker {
  onmessage: null | ((e: MessageEvent<ToUI>) => void) = null
  onerror: null | ((e: unknown) => void) = null
  constructor() {
    uiWorkers.push(this)
  }
  postMessage(msg: unknown, _transfer?: unknown[]): void {
    queueMicrotask(() => workerGlobal.onmessage?.({ data: msg as ToWorker }))
  }
  terminate(): void {}
}
;(globalThis as unknown as { Worker: unknown }).Worker = FakeWorker
// node's bare navigator has no `storage`; init() optional-chains it, but older nodes lack the
// global entirely — give it something to optional-chain on.
;(globalThis as unknown as { navigator: unknown }).navigator ??= {}

const DB_NAME = 'tennis-sim'
const realIDB = globalThis.indexedDB

/** An IndexedDB whose every open fails — the browser saying no, distilled. */
function breakIndexedDB(): void {
  ;(globalThis as { indexedDB: IDBFactory }).indexedDB = {
    open() {
      const req = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null, error: null }
      setTimeout(() => (req as { onerror: null | ((e: unknown) => void) }).onerror?.({ target: req }))
      return req as unknown as IDBOpenDBRequest
    },
  } as unknown as IDBFactory
}
function restoreIndexedDB(): void {
  ;(globalThis as { indexedDB: IDBFactory }).indexedDB = realIDB
}

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = realIDB.deleteDatabase(DB_NAME)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    req.onblocked = () => resolve()
  })
}

function liveCareer(seed: string, weeks: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE, `c-${seed}`)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

// The store module is imported AFTER the shims above exist (client.ts constructs `Worker` lazily,
// but the worker module grabs `self` at import time).
let useGameStore: typeof import('../src/stores/game').useGameStore

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
  ;({ useGameStore } = await import('../src/stores/game'))
})

beforeEach(async () => {
  restoreIndexedDB()
  await closeDb()
  await deleteDatabase()
  setActivePinia(createPinia())
})

describe('init is a total transition: loading -> ready | recovery', () => {
  it('a healthy empty database lands in ready (the onboarding path)', async () => {
    const game = useGameStore()
    expect(game.phase).toBe('loading')
    await game.init()
    expect(game.phase).toBe('ready')
    expect(game.ready).toBe(true)
    expect(game.snapshot).toBeNull()
  })

  it('a healthy database with careers lands in ready with the most recent career open', async () => {
    await adoptAutosave(liveCareer('recov-seeded', 6))
    const game = useGameStore()
    await game.init()
    expect(game.phase).toBe('ready')
    expect(game.snapshot?.week).toBe(6)
  })

  it('an injected indexedDB.open failure lands in recovery — never onboarding, never a spin', async () => {
    breakIndexedDB()
    const game = useGameStore()
    await game.init()
    expect(game.phase).toBe('recovery')
    expect(game.ready, 'the shell must NOT proceed to the wizard').toBe(false)
    expect(game.initError).toMatch(/indexeddb/i)
  })

  it('retry fails while storage is still broken, then SUCCEEDS without a reload once it is back', async () => {
    breakIndexedDB()
    const game = useGameStore()
    await game.init()
    expect(game.phase).toBe('recovery')

    // Still broken: retry lands back in recovery — a total transition has no third exit.
    await game.retryInit()
    expect(game.phase).toBe('recovery')

    // Storage returns (the browser recovered, space was freed). The SAME session's retry must
    // now succeed — this is the memoised-rejection reset in db/saves.ts under test end-to-end:
    // without it, this retry re-awaits the first rejection forever.
    restoreIndexedDB()
    await game.retryInit()
    expect(game.phase).toBe('ready')
    expect(game.ready).toBe(true)
  })

  it('recovery keeps existing careers reachable: retry after the failure finds them intact', async () => {
    await adoptAutosave(liveCareer('recov-survivor', 9))
    await closeDb() // drop the healthy cached connection so the broken factory is really met
    breakIndexedDB()
    const game = useGameStore()
    await game.init()
    expect(game.phase).toBe('recovery')

    restoreIndexedDB()
    await game.retryInit()
    expect(game.phase).toBe('ready')
    expect(game.snapshot?.week, 'nothing was deleted on the way through recovery').toBe(9)
  })
})

describe('the doors out of recovery', () => {
  it('import while storage is STILL broken: typed failure surfaced, still in recovery, nothing committed', async () => {
    breakIndexedDB()
    const game = useGameStore()
    await game.init()
    expect(game.phase).toBe('recovery')

    const bytes = await encodeExportFile(liveCareer('recov-import-fail', 4))
    await game.importSave(new File([bytes as BlobPart], 'career.tsave'))
    expect(game.saveOp?.op).toBe('import')
    expect(game.saveOp?.status, 'the failure is visible state, not a vanished promise').toBe('error')
    expect(game.phase).toBe('recovery')
    expect(game.snapshot, 'commit-or-nothing holds at the store too').toBeNull()
  })

  it('import once storage is back: the write lands and the store flips itself to ready', async () => {
    breakIndexedDB()
    const game = useGameStore()
    await game.init()
    expect(game.phase).toBe('recovery')

    restoreIndexedDB()
    const bytes = await encodeExportFile(liveCareer('recov-import-ok', 4))
    await game.importSave(new File([bytes as BlobPart], 'career.tsave'))
    expect(game.saveOp?.status).toBe('ok')
    expect(game.phase).toBe('ready')
    expect(game.snapshot?.week).toBe(4)
  })

  it('start-fresh is an explicit walk into onboarding: ready with no snapshot, nothing deleted', async () => {
    breakIndexedDB()
    const game = useGameStore()
    await game.init()
    expect(game.phase).toBe('recovery')

    game.startFreshFromRecovery()
    expect(game.phase).toBe('ready')
    expect(game.ready).toBe(true)
    expect(game.snapshot).toBeNull() // App.vue's showOnboarding = ready && !snapshot
  })
})

// =================================================================================================
// Source pins (the repo's own pattern, tests/dev-fast-forward.test.ts layer 1): the recovery UI
// and the TB-19 surfacing exist where the store expects surfaces, and the one formerly
// unconfirmed destructive action goes through the shared ConfirmDialog.
// =================================================================================================

describe('the surfaces exist (source pins)', () => {
  const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
  const more = readFileSync(new URL('../src/components/screens/MoreScreen.vue', import.meta.url), 'utf8')

  it('App.vue mounts the recovery screen with all three doors, ahead of the splash', () => {
    expect(app).toContain(`game.phase === 'recovery'`)
    expect(app).toContain('game.retryInit()')
    expect(app).toContain('game.startFreshFromRecovery()')
    expect(app).toContain('onRecoveryImportPicked')
    // the recovery branch must render BEFORE the loading/splash chain, or a broken database
    // would still show "Loading…" forever
    expect(app.indexOf(`game.phase === 'recovery'`)).toBeLessThan(app.indexOf('app-loading'))
  })

  it('More renders every save-operation outcome (TB-19: no more silent failures)', () => {
    expect(more).toContain('game.saveOp')
    expect(more).toMatch(/status === 'pending'/)
    expect(more).toMatch(/status === 'error'/)
    expect(more).toContain('retrySaveAction')
  })

  it('named-save deletion is confirmed — the bare one-tap delete is gone', () => {
    expect(more).toContain('askDeleteSlot(')
    expect(more, 'no template hunk may call game.deleteSlot directly any more').not.toMatch(
      /@click="game\.deleteSlot/,
    )
  })
})
