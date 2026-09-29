// ⭐⭐ D-01 (principles review of 26.09, docs/review-principles-2026-09-26/04-worker-protocol-persistence.md)
// – «RESTORE PREVIOUS» RESTORED THE PRESENT AND OVERWROTE THE REAL PREVIOUS GENERATION.
//
// 41 store actions commit an autosave into the older generation; only 26 of them then call
// `refreshSlots`. `game.slots` has exactly ONE reader – this screen – and it never refreshed the
// list at all, so after any of the other 15 (the four irreversible dialog answers among them, and
// `setPlan`, which every tap on Her week sends) More's "previous" row pointed at the slot that holds
// the CURRENT state. Restoring it reported ok, moved nothing the player could see, and overwrote the
// only generation that still held the one-command-old career.
//
// ⚠ 28.09 – THE 26/15 SPLIT ABOVE IS NOW HISTORY RATHER THAN A LIVE COUNT, and the paragraph is kept
// because it is what this file's cases are shaped by. D-05 collapsed the 41 bodies into one
// `commit(msg)` and deleted every refresh tail with them, so the number of actions that "forget" the
// list is no longer 15 – it is zero, and there is nowhere left to forget it. This file did not move:
// the watch it measures is the mechanism that made the deletion safe, so its cases got STRONGER, and
// its mutation arm (delete the `watch` block) is unchanged.
//
// ⚠ MOUNTED, OVER THE REAL STORE AND THE REAL WORKER, because the defect lives in the join: the
// screen's stale `autoSlots[1]`, the store's missing refresh and the worker's existence-only
// re-validation of the slot key. A source pin on MoreScreen would have passed on every day this
// shipped, and so would a store unit test – the review's own probe (`probes/d-stale-slots.test.ts`)
// needed the whole pipeline to see it. `request` (worker/client.ts) is routed into the real
// `sim.worker.ts` handler through tests/helpers/workerHarness, with a structuredClone on each leg
// standing in for postMessage; IndexedDB is fake-indexeddb.
//
// ⚠ THE MUTATION ARMS, each watched red before this file was believed:
//   1. delete the `watch(() => game.revision, …, { immediate: true })` block in MoreScreen.vue →
//      the first two cases go red (no refresh at all: the list is whatever the last action left).
//   2. drop only `{ immediate: true }` from it → «a screen opened after the toggle» goes red (the
//      mount half) while «a tick from More itself» stays green (the watch half).
//   3. skip the revision comparison in the worker's `restoreSlot` → the last case goes red.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import { workerHarness } from '../helpers/workerHarness'
import { drainLifeBeats } from '../helpers/career'
import { createWorld, tickWeek, type WorldState } from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { adoptAutosave, listSlots, readSlot } from '../../src/db/saves'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND MoreScreen READS IT ON MOUNT (sound, motion, match
// defaults) – the same shim round21-dialogs.test.ts and round20-ui.test.ts install, for the reason
// quoted there: supply the browser's own object rather than weaken the app to suit the runner.
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
// assigns `self.onmessage` while it evaluates. Nothing under test here reads `self` for anything
// else, so the happy-dom window being shadowed costs nothing.
const { send, workerGlobal } = workerHarness<Reply>()
harness.send = send as (m: unknown) => Promise<unknown>

/** A quiet career: ten weeks, no open question, so every command below is about the save layer. */
function quietCareer(seed: string, weeks = 10): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  drainLifeBeats(world)
  return world
}

type Game = ReturnType<typeof useGameStore>

/** ⚠ A RESTORE IS GZIP + SHA-256 + AN IndexedDB TRANSACTION, so it settles over several macrotasks
 *  and a fixed number of `flushPromises()` calls is a coin toss (four was not enough; the first
 *  draft of this file failed on a restore that had not finished yet). The store's own `busy` flag is
 *  the honest end condition; the bound only stops a hang from becoming a silent pass. */
/** ⚠ RE-AIMED 29.09 (the PR's CI): the wait is TIME-bound, never tick-COUNTED – the end condition
 *  each caller asserts is unchanged. 500 counted flushes missed on the 2-core CI runner (~20x slower
 *  than a dev box: this suite 868s there against ~45s here), where the save codec's zlib and the IDB
 *  callbacks land AFTER a counted loop exhausts – reproduced by no local arm (node 22, storage sim,
 *  full suite all green here), which is exactly what a wall-time race looks like from a fast box.
 *  A real latch still fails – in 30s instead of 500 ticks – so nothing is weakened. */
async function waitUntil(done: () => boolean): Promise<void> {
  const until = Date.now() + 30_000
  while (!done() && Date.now() < until) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 10))
  }
}

async function settle(game: Game): Promise<void> {
  await waitUntil(() => !game.busy)
  expect(game.busy, 'the store settled').toBe(false)
}

/**
 * ⚠⚠ ADDED 28.09 BY D-05, AND IT IS A SECOND END CONDITION RATHER THAN MORE FLUSHES. `busy` covers
 * the COMMAND; until D-05 it covered the list refresh too, because every mutation awaited
 * `refreshSlots()` inside `run`. The refresh happens where the list is READ now – this screen's own
 * `watch` on `game.revision` – so it is a floating promise outside `busy`, and `openSaves`'s two
 * `flushPromises()` stopped being enough: «the screen offers a previous generation to restore» failed
 * on an empty list and «the toggle is given back» on a list the refresh had not caught up yet.
 *
 * ⚠ IT IS NOT A WEAKENING, and the distinction matters: the condition asserted here is exactly the
 * claim – the list on the glass has caught up with the revision the worker has committed. If the
 * watch never fires, this fails BY NAME instead of leaving the case to fail on a missing button.
 * Both assertions below the loop are kept for that reason: a bound that expires is a legible failure.
 */
async function settleLists(game: Game): Promise<void> {
  const newest = (): number => Math.max(0, ...game.slots.map((s) => s.revision ?? 0))
  const behind = (): boolean => game.slots.length === 0 || newest() < game.revision || game.careers.length === 0
  await waitUntil(() => !behind())
  expect(newest(), "More's refresh caught the slot list up to the committed revision").toBeGreaterThanOrEqual(
    game.revision,
  )
  expect(game.careers.length, "...and its careers refresh landed too").toBeGreaterThan(0)
}

/** Mount More on the Saves tab – the tab the autosave rows and «Restore previous» live behind. */
async function openSaves(game: Game): Promise<ReturnType<typeof mount>> {
  const w = mount(MoreScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = w.findAll('.more-tabs .tab-pill').find((t) => t.text() === 'Saves')!
  await tab.trigger('click')
  await settle(game)
  await settleLists(game)
  await flushPromises()
  return w
}

/** Press «Restore previous» and answer its confirm – ConfirmDialog puts Cancel first. */
async function restorePrevious(w: ReturnType<typeof mount>, game: Game): Promise<void> {
  const button = w.findAll('button').find((b) => b.text() === 'Restore previous')
  expect(button, 'the screen offers a previous generation to restore').toBeTruthy()
  await button!.trigger('click')
  await flushPromises()
  const dialog = w.findComponent(ConfirmDialog)
  expect(dialog.exists(), 'the restore asks first').toBe(true)
  await dialog.findAll('button')[1].trigger('click')
  await flushPromises()
  await settle(game)
}

/** Both autosave generations of a career, decoded off disk. */
async function generations(careerId: string): Promise<WorldState[]> {
  const slots = (await listSlots(careerId)).filter((s) => s.slot.startsWith('auto:'))
  return Promise.all(slots.map((s) => readSlot(s.slot)))
}

beforeAll(async () => {
  await import('../../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the real worker module installed its handler').not.toBeNull()
})

describe('⭐⭐ D-01 – «Restore previous» targets the generation the player can actually go back to', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐ a screen opened AFTER a non-refreshing mutation restores the pre-toggle generation', async () => {
    const game = useGameStore()
    const world = quietCareer('d01-after')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1)
    expect(game.error).toBe('')
    const physioBefore = game.snapshot!.physioActive as boolean

    // `setPhysio` was one of the 15 store actions with no `refreshSlots` – ⚠ re-aimed 28.09 by D-05:
    // no action carries one now, so `setPhysio` is simply a mutation that moves the revision, which is
    // the only property this case ever needed of it.
    await game.setPhysio(!physioBefore)
    expect(game.error).toBe('')
    expect(game.snapshot!.physioActive).toBe(!physioBefore)

    // The player now opens More – the everyday order, and the one App.vue's plain v-if chain turns
    // into a fresh mount every time.
    const w = await openSaves(game)
    await restorePrevious(w, game)
    expect(game.error, 'the restore was not refused').toBe('')

    // THE ITEM: the toggle is undone on screen, and a generation still holds the pre-toggle career.
    expect(game.snapshot!.physioActive, 'the restore moved the state the player sees').toBe(physioBefore)
    const gens = await generations(world.careerId)
    expect(
      gens.some((g) => g.physioActive === physioBefore),
      'a generation still holds the pre-toggle career',
    ).toBe(true)
    w.unmount()
  })

  it('⭐ a mutation that lands while the screen is OPEN moves the list under it', async () => {
    const game = useGameStore()
    const world = quietCareer('d01-open')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1)
    const physioBefore = game.snapshot!.physioActive as boolean

    // ⚠ WHY THIS ORDER IS A REAL PATH AND NOT A CONTRIVANCE. Three of the 15 non-refreshing actions
    // are answers to BLOCKING overlays (the knock, the shoot clash, her card), and a blocking overlay
    // comes up over whatever screen the player is on – More included, since the ▶▶ 52 (dev) tick
    // lives on this very tab (an owner ruling: the deployed build is the playtest device). So the
    // revision really can move while this list is on the glass, and the player really can reach for
    // «Restore previous» on the screen they are already looking at. `setPhysio` is the same class of
    // action and the cheapest of them to drive.
    const w = await openSaves(game)
    await game.setPhysio(!physioBefore)
    expect(game.error).toBe('')
    await flushPromises()
    await settle(game)
    // ⭐ D-05 (28.09): THIS is «moves the list under it», made an explicit end condition. The store no
    // longer awaits the refresh inside the command, so the list arrives through this screen's watch –
    // and if it never did, `settleLists` says so by name rather than leaving the restore below to
    // target the wrong generation and fail one assertion later.
    await settleLists(game)
    expect(game.snapshot!.physioActive).toBe(!physioBefore)

    await restorePrevious(w, game)
    expect(game.error, 'the restore was not refused').toBe('')
    expect(game.snapshot!.physioActive, 'the toggle is given back').toBe(physioBefore)
    w.unmount()
  })

  it('⭐ the worker refuses a restore whose slot has moved under the screen (STALE_REVISION)', async () => {
    const game = useGameStore()
    const world = quietCareer('d01-wire')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1)
    const physioBefore = game.snapshot!.physioActive as boolean
    await game.setPhysio(!physioBefore)

    // The stale belief the screen used to hold, put back by hand: the row for the generation the
    // toggle rewrote still carries the revision it held two commits ago, while the record on disk has
    // moved on to hold the CURRENT state. That is exactly the list D-01's 15 actions left behind.
    const fresh = await listSlots(world.careerId)
    const stalest = fresh.reduce((lo, s) => ((s.revision ?? 0) < (lo.revision ?? 0) ? s : lo), fresh[0])
    const newest = fresh.reduce((hi, s) => ((s.revision ?? 0) > (hi.revision ?? 0) ? s : hi), fresh[0])
    game.slots = fresh.map((s) => (s.slot === newest.slot ? { ...s, revision: (s.revision ?? 0) - 2 } : s))

    await game.restoreSlot(newest.slot)
    await settle(game)

    expect(game.saveOp, 'the restore was refused, not silently applied').toMatchObject({ status: 'error' })
    expect(game.snapshot!.physioActive, 'the world did not move').toBe(!physioBefore)
    const gens = await generations(world.careerId)
    expect(
      gens.some((g) => g.physioActive === physioBefore),
      'the pre-toggle generation was not overwritten',
    ).toBe(true)

    // The refusal is the EXISTING typed one, and a caller that states no belief is still served: the
    // field is optional on the wire for the records written before it existed.
    const refused = (await send({ type: 'restoreSlot', slot: newest.slot, revision: 0 })) as Reply
    expect(refused.ok).toBe(false)
    expect(refused.code).toBe('STALE_REVISION')
    const allowed = (await send({ type: 'restoreSlot', slot: stalest.slot })) as Reply
    expect(allowed.ok, 'no belief stated, nothing to disagree with').toBe(true)
  })
})
