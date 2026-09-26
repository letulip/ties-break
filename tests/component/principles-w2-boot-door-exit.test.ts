// ⭐⭐ W2 – THE BOOT DOOR'S REFUSALS, AND THE DOOR OUT OF THEM.
//
// The owner, 26.09 (docs/decisions.md, «NO PLAYERS, SO THE SAVE DOORS ANSWER TO ONE RULE: THE PLAYER
// NEVER GETS STUCK»): «у нас сейчас нет игроков, старые сейвы нас не интересуют, нужна будущая 100%
// обратная совместимость, но страховку сделать можно, по твоей рекомендации, лишь бы пользователь не
// застрял в этом флоу». That moves the question off WORDING and onto EXITS: the test of a save-door
// refusal is not what the screen says, it is whether the player can leave. So every case below ends
// on a PRESS, and on what the press reached.
//
// ⚠ WHAT WAS ALREADY PROVEN, AND WHAT THIS FILE ADDS. `tests/component/round36-boot-refusal.test.ts`
// (U-01) proves a refused boot load REACHES the recovery screen and counts its three buttons;
// `e2e/save-safety.spec.ts`'s T1.6 proves the `future-schema` refusal reaches it in a real browser
// with all three doors ENABLED. Neither presses one. «Enabled» is not «leads anywhere»: on this
// screen «Retry» re-runs `init` against the same disk, so for every refusal here it lands on the SAME
// refusal by construction – which makes the other two doors the whole of the insurance, and an
// unpressed button is an untested one.
//
// ⚠ AND THE THIRD CASE IS THE ONE NO OLDER NET CAN HAVE COVERED, because this wave created it.
// `fix(worker): a load adopts only what can render` (96748400) moved `toSnapshot` in front of the two
// assignments in `loadCareer`, so a newest generation that DECODES and cannot RENDER is now a refusal
// instead of an in-memory loss. W1's own corpus reported that refusal as UNTYPED – a bare `TypeError`
// message with no `code` (tests/save-doors-fuzz.test.ts, its finding A, still open) – and which
// sentence it should carry is the owner's. What is NOT his and is asserted here: whatever the reply
// says, it lands on a surface with a working way out.
//
// ⚠ NO NEW WORDING, AND EVERY STRING HERE IS TRANSCRIBED WITH ITS SOURCE NAMED (CLAUDE.md invariant
// 4). The three door labels and the heading come out of `src/App.vue`'s recovery block; the refusal
// itself is never typed here at all – it is read off `game.initError`, which is what the screen
// renders, so a reworded refusal moves this file's expectation with it.
//
// ⚠ THE REAL WORKER AND A REAL DISK, because the claim spans both. `request` (worker/client.ts) is
// routed into the real `sim.worker.ts` handler through tests/helpers/workerHarness, and the records
// are seeded into fake-indexeddb through the product's OWN write paths (`adoptAutosave`,
// `commitAutosave`) – so the payload, the checksum and the generation rotation are the ones the app
// writes. Every case ends by comparing the raw records byte for byte with what was seeded.
//
// ⚠ MUTATION ARMS – both watched red before this file was believed; the outputs are quoted in the
// wave's report.
//   1. THE EXIT: drop the handler off «Start a new career» in `src/App.vue`
//      (`@click="game.startFreshFromRecovery()"` -> `@click=""`). All four cases go red on the press.
//   2. THE SURFACE: `v-if="game.initError"` -> `v-if="false"` on the recovery screen's error
//      paragraph. The three boot cases go red on the sentence.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { workerHarness } from '../helpers/workerHarness'
import { drainLifeBeats } from '../helpers/career'
import {
  SAVE_SCHEMA_VERSION,
  createWorld,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { adoptAutosave, commitAutosave } from '../../src/db/saves'
import { decompressWorld } from '../../src/engine/saveCodec'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHELL'S SCREENS READ IT AT SETUP – the same shim and the
// same argument as tests/component/round36-boot-refusal.test.ts, quoted there in full: supply the
// browser's own object rather than weaken the app to suit the runner.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** The fields these cases read off a reply – the harness's `Reply` stays local by its own rule. */
interface Reply {
  id: number
  ok: boolean
  code?: string
  error?: string
}

const harness = vi.hoisted(() => ({ send: null as null | ((m: unknown) => Promise<unknown>) }))
vi.mock('../../src/worker/client', () => ({
  WorkerRestartError: class extends Error {},
  request: async (msg: unknown) => structuredClone(await harness.send!(structuredClone(msg))),
}))
import { useGameStore } from '../../src/stores/game'

// ⚠ AT MODULE SCOPE, before the dynamic import of the worker in `beforeAll`: the worker module
// assigns `self.onmessage` while it evaluates.
const { send, workerGlobal } = workerHarness<Reply>()
harness.send = send as (m: unknown) => Promise<unknown>

// -------------------------------------------------------------------------------------------------
// THE SCREEN'S OWN COPY, TRANSCRIBED, WITH THE FILE THAT OWNS IT NAMED (CLAUDE.md invariant 4)
// -------------------------------------------------------------------------------------------------

/** The three ways out of recovery, by the names on them – `src/App.vue`'s `.recovery-actions` block,
 *  and the same list `e2e/save-safety.spec.ts` and `e2e/storage-recovery.spec.ts` carry. */
const DOORS = ['Retry', 'Import a save file', 'Start a new career']

/** The door this file PRESSES. `Retry` re-runs `init` against a disk that has not moved, so on every
 *  refusal below it is the same refusal again – true insurance, and not an exit. `Import a save file`
 *  needs a file the player does not have yet. This one is the way out that is always available, and
 *  it destroys nothing: `startFreshFromRecovery` sets no flag on disk (stores/game.ts). */
const START_FRESH = 'Start a new career'

/** The recovery screen's heading, transcribed from `src/App.vue`. */
const RECOVERY_HEADING = "Saved games can't be reached"

// -------------------------------------------------------------------------------------------------
// READING THE DISK RAW – the half no screen can answer, and the reason this file seeds through the
// product's own write paths instead of hand-building records.
// -------------------------------------------------------------------------------------------------

const DB_NAME = 'tennis-sim'
const STORE = 'saves'

interface RawRecord {
  slot: string
  revision?: number
  bytes: number
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

function getRaw(database: IDBDatabase, slot: string): Promise<RawRecord | undefined> {
  return new Promise((resolve, reject) => {
    const req = database.transaction(STORE, 'readonly').objectStore(STORE).get(slot)
    req.onsuccess = () => resolve(req.result as RawRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function putRaw(database: IDBDatabase, record: RawRecord): Promise<void> {
  const t = database.transaction(STORE, 'readwrite')
  t.objectStore(STORE).put(record)
  await txDone(t)
}

/** Every autosave generation of a career, as bytes – a fingerprint «nothing moved» can be read off. */
async function generationsRaw(careerId: string): Promise<string> {
  const database = await openRaw()
  const rows = await Promise.all(
    (['a', 'b'] as const).map((gen) => getRaw(database, `auto:${careerId}:${gen}`)),
  )
  return JSON.stringify(
    rows.map((r) =>
      r === undefined
        ? 'ABSENT'
        : { slot: r.slot, revision: r.revision, bytes: r.bytes, payload: [...r.payload] },
    ),
  )
}

// -------------------------------------------------------------------------------------------------
// THE FIXTURES – one quiet career per case, written by the app's own writers.
// -------------------------------------------------------------------------------------------------

/** A quiet career: ten weeks, no open question, so every command below is about the save layer.
 *  (The same fixture tests/component/principles-d01-restore-previous.test.ts uses.) */
function quietCareer(seed: string, careerId: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE, careerId)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 10; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  drainLifeBeats(world)
  return world
}

type Game = ReturnType<typeof useGameStore>

/** The store's own `busy` flag is the honest end condition for a save round trip (gzip + SHA-256 +
 *  an IndexedDB transaction settle over several macrotasks); the bound only stops a hang becoming a
 *  silent pass. Lifted from principles-d01-restore-previous.test.ts, which argues it in full. */
async function settle(game: Game): Promise<void> {
  for (let i = 0; i < 500 && game.busy; i++) await flushPromises()
  expect(game.busy, 'the store settled').toBe(false)
}

/** Mount the shell. `App` calls `game.init()` on mount, so this IS the boot.
 *
 *  ⚠ `init` IS THE END CONDITION, NOT `busy`. A boot is `listCareers` -> `loadCareer` -> gunzip ->
 *  SHA-256 -> a migration, and `busy` is only raised once `loadCareer` starts – so a `settle(game)`
 *  called too early sees `busy: false` and returns before the boot has begun (measured: the first
 *  draft of this file read `phase: 'loading'` and reported «no recovery screen» on every arm). `init`
 *  is a TOTAL transition by W1-INTEGRITY-B, so «not loading any more» is the honest wait. */
async function boot(): Promise<{ wrapper: VueWrapper; game: Game }> {
  const wrapper = mount(App, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const game = useGameStore()
  for (let i = 0; i < 500 && game.phase === 'loading'; i++) await flushPromises()
  expect(game.phase, 'init settled into one of its two exits').not.toBe('loading')
  await settle(game)
  await flushPromises()
  return { wrapper, game }
}

/** The recovery screen, its refusal and its three doors – asserted as one block because they are one
 *  claim: the door refused, the screen SAYS so, and every way out is live. */
function expectRecoveryWithLiveDoors(wrapper: VueWrapper, game: Game, why: string): void {
  const recovery = wrapper.find('.recovery-screen')
  expect(recovery.exists(), `${why}: the failure path out of the splash`).toBe(true)
  expect(recovery.find('h2').text(), `${why}: the screen is the one U-01 built`).toBe(RECOVERY_HEADING)
  // ⚠ THE SENTENCE IS NEVER TYPED IN THIS FILE. It is whatever the door wrote, rendered verbatim –
  // so a reworded refusal moves this expectation with it, and an EMPTY one fails here rather than
  // leaving the player a screen with no reason on it.
  expect(game.initError, `${why}: the refusal reached the store`).not.toBe('')
  expect(
    recovery.findAll('.error').map((p) => p.text()),
    `${why}: ...and the screen renders it`,
  ).toContain(game.initError)
  const doors = recovery.findAll('.recovery-actions button')
  expect(doors.map((b) => b.text()), `${why}: retry / import / start new`).toEqual(DOORS)
  for (const door of doors) {
    expect(
      door.attributes('disabled'),
      `${why}: «${door.text()}» is on the screen and cannot be pressed`,
    ).toBeUndefined()
  }
}

/** ⭐⭐ THE PRESS, AND THE WHOLE POINT OF THIS FILE: the door leads somewhere that is NOT the same
 *  refusal. «Start a new career» is an explicit player decision to walk past the failure into
 *  onboarding (stores/game.ts), so what must be true afterwards is that the recovery screen is gone
 *  and the app is showing the childhood – with the career still on disk behind it. */
async function pressStartFresh(wrapper: VueWrapper, game: Game, why: string): Promise<void> {
  const door = wrapper
    .findAll('.recovery-screen .recovery-actions button')
    .find((b) => b.text() === START_FRESH)
  expect(door, `${why}: the screen offers «${START_FRESH}»`).toBeTruthy()
  await door!.trigger('click')
  await flushPromises()
  await settle(game)
  await flushPromises()
  expect(wrapper.find('.recovery-screen').exists(), `${why}: the press left the refusal up`).toBe(false)
  // ⚠ AND THE SPLASH IS BETWEEN THEM, which is the ordinary launch resuming rather than a hop this
  // helper takes to make itself pass: `App.vue` branches recovery, then `!ready`, then the SPLASH,
  // and only then the prologue. `tests/component/round36-boot-refusal.test.ts` argues the same seam
  // in full – the splash is a real component with a real timer, and asking it for its own `done` is
  // the seam the player's tap uses and needs no clock.
  const splash = wrapper.findComponent(SplashScreen)
  expect(splash.exists(), `${why}: the press reached neither the splash nor anything behind it`).toBe(true)
  splash.vm.$emit('done')
  await nextTick()
  expect(
    wrapper.findComponent(ChildhoodPrologue).exists(),
    `${why}: the press reached nothing – the door is on the screen and goes nowhere`,
  ).toBe(true)
}

beforeAll(async () => {
  await import('../../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the real worker module installed its handler').not.toBeNull()
})

describe('⭐⭐ W2 – every boot-door refusal lands on a screen the player can leave', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐ `future-schema`: a newest generation from a newer build, with a readable one behind it', async () => {
    // The straddle e2e/save-safety.spec.ts case 2 seeds in a browser, written here through the app's
    // own writers: generation a at this build's schema, generation b one ahead. `compressWorld`
    // stringifies the world as it is, so the declared version IS the world's own field.
    const world = quietCareer('w2-future', 'c-w2-future')
    await adoptAutosave(world)
    const ahead = structuredClone(world)
    ahead.schemaVersion = SAVE_SCHEMA_VERSION + 1
    await commitAutosave(ahead, 2)
    const before = await generationsRaw(world.careerId)

    const { wrapper, game } = await boot()

    expect(game.snapshot, 'the refused career was not adopted').toBe(null)
    // ⚠ `toContain`, NOT `toEqual`: fake-indexeddb is per-FILE, so the careers this suite seeds
    // accumulate across its cases. What matters is that the refused career was not deleted.
    expect(game.careers.map((c) => c.careerId), 'the career is still listed').toContain(world.careerId)
    expectRecoveryWithLiveDoors(wrapper, game, 'future-schema')
    await pressStartFresh(wrapper, game, 'future-schema')
    expect(await generationsRaw(world.careerId), 'a refused boot moved the disk').toBe(before)
    wrapper.unmount()
  })

  it('⭐ `corrupted` with NO older generation to fall back to', async () => {
    // `readLatestAutosave`'s `gens.length === 1` branch – the one the two-generation net cannot cover,
    // so the refusal is all there is between a torn record and this screen. The tear is a flipped
    // byte inside the gzip the SHA-256 covers, which is what a wedged write actually leaves behind.
    const world = quietCareer('w2-lone', 'c-w2-lone')
    await adoptAutosave(world)
    const database = await openRaw()
    const only = (await getRaw(database, `auto:${world.careerId}:a`))!
    const torn = Uint8Array.from(only.payload)
    torn[torn.length - 5] ^= 0xff
    await putRaw(database, { ...only, payload: torn })
    const before = await generationsRaw(world.careerId)

    const { wrapper, game } = await boot()

    expect(game.snapshot, 'a torn lone generation was not adopted').toBe(null)
    expectRecoveryWithLiveDoors(wrapper, game, 'corrupted, lone generation')
    await pressStartFresh(wrapper, game, 'corrupted, lone generation')
    expect(await generationsRaw(world.careerId), 'the torn record was rewritten by a READ').toBe(before)
    wrapper.unmount()
  })

  it('⭐⭐ THE SHARP ONE – a newest generation that DECODES and cannot RENDER (this wave made it a refusal)', async () => {
    // ⚠ THE PREMISE IS ASSERTED, NOT ASSUMED, and it is asserted through the product's own two steps:
    // the boot door reads this record without complaint (it runs neither the bounds walk nor the
    // spine – saveCodec.ts's trust-levels note is the ruling) and `toSnapshot` then throws on it.
    // `bestFinishByTier` is one of the thirteen fields the review's own sweep measured throwing there
    // (docs/review-principles-2026-09-26/04-worker-protocol-persistence.md), and it is absent from the
    // migration ladder's spine, so nothing earlier can refuse it.
    const world = quietCareer('w2-unrenderable', 'c-w2-unrenderable')
    delete (world as unknown as Record<string, unknown>).bestFinishByTier
    await adoptAutosave(world)
    const database = await openRaw()
    const rec = (await getRaw(database, `auto:${world.careerId}:a`))!
    const decoded = await decompressWorld(rec.payload, rec.checksum)
    expect(() => toSnapshot(decoded), 'the boot door reads it and the render throws').toThrow()
    const before = await generationsRaw(world.careerId)

    const { wrapper, game } = await boot()

    // The refusal this wave created: `loadCareer` builds the snapshot before it adopts anything, so
    // the reply is `ok: false` and nothing was taken. It is UNTYPED – the corpus's open finding A –
    // and which sentence it should carry is the owner's; that it lands somewhere with a way out is
    // not, and is what the rest of this case is.
    expect(game.snapshot, 'a career that cannot render was not adopted').toBe(null)
    expect(game.careers.map((c) => c.careerId), 'and it was not deleted either').toContain(world.careerId)
    expectRecoveryWithLiveDoors(wrapper, game, 'decodes but cannot render')
    await pressStartFresh(wrapper, game, 'decodes but cannot render')
    expect(await generationsRaw(world.careerId), 'a refused load moved the disk').toBe(before)
    wrapper.unmount()
  })

  it('⭐ ...and a refused IMPORT on that screen does not close the other two doors', async () => {
    // The recovery screen's own second door, refused. `importSave` runs through `runOp`, so its
    // failure is a `saveOp` row rather than `initError` – App.vue renders that row right here, and
    // the three doors are `:disabled="game.busy"`, which a settled refusal clears. The risk this case
    // measures is the one the popup law is about: a screen whose last working control has just been
    // spent.
    const world = quietCareer('w2-import', 'c-w2-import')
    delete (world as unknown as Record<string, unknown>).bestFinishByTier
    await adoptAutosave(world)
    const before = await generationsRaw(world.careerId)

    const { wrapper, game } = await boot()
    expectRecoveryWithLiveDoors(wrapper, game, 'before the import')

    // Not a save file at all – the cheapest of the import door's five refusals to build, and the
    // surface is one row whichever code arrives (App.vue branches on `op`, never on `code`).
    await game.importSave(new File([new Uint8Array([1, 2, 3, 4])], 'career.tsave'))
    await settle(game)
    await flushPromises()

    expect(game.saveOp, 'the import was refused, not silently swallowed').toMatchObject({
      op: 'import',
      status: 'error',
    })
    expect(game.phase, 'a refused import must not walk the player into the game').toBe('recovery')
    const refusal = game.saveOp?.message ?? ''
    expect(refusal, 'the door refused in words').not.toBe('')
    const rows = wrapper.findAll('.recovery-screen .error').map((p) => p.text())
    expect(rows, 'the refusal is on the screen the player is standing on').toContain(refusal)
    expectRecoveryWithLiveDoors(wrapper, game, 'after the refused import')
    await pressStartFresh(wrapper, game, 'after the refused import')
    expect(await generationsRaw(world.careerId), 'a refused import moved the disk').toBe(before)
    wrapper.unmount()
  })
})
