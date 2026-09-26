// ⭐⭐ W2 – THE SAVE DOORS' REFUSALS ON THE SCREEN THAT OWNS THEM, AND THE WAY OUT OF EACH.
//
// The owner, 26.09 (docs/decisions.md, «NO PLAYERS, SO THE SAVE DOORS ANSWER TO ONE RULE: THE PLAYER
// NEVER GETS STUCK»): «страховку сделать можно, по твоей рекомендации, лишь бы пользователь не
// застрял в этом флоу». The boot door's half of that is
// tests/component/principles-w2-boot-door-exit.test.ts; this is the IN-GAME half, where all three
// remaining refusals arrive on one screen – More's Saves tab – and where the exit is a control on it
// rather than a recovery door.
//
// THE THREE ROWS, and why each one needs a mounted screen rather than a worker case:
//   1. `loadCareer` REFUSED because the career's newest generation cannot render. The refusal is this
//      wave's own (96748400 moved `toSnapshot` in front of the two assignments), it is UNTYPED – the
//      corpus's open finding A – and the store routes it through `runOp`, so what the player gets is
//      a `saveOp` row on a screen whose OTHER rows still work. Nothing below the UI can say that.
//   2. `restoreSlot` REFUSED with `STALE_REVISION` (D-01's second arm). The refusal is pinned in
//      tests/component/principles-d01-restore-previous.test.ts as a `saveOp` status; what was never
//      asked is whether the Retry beside it leads anywhere, and the answer moved this wave – see the
//      case's own note.
//   3. `importSave` REFUSED. e2e/save-file.spec.ts proves two of the five codes reach this screen in
//      a browser and that the career survives; the exit it takes is `goHome`, i.e. the shell. This
//      asks the narrower question the recovery screen's case asks: is the control that produced the
//      refusal still able to produce a success?
//
// ⚠ NO NEW WORDING (CLAUDE.md invariant 4). Not one refusal is typed in this file: each is read off
// `game.saveOp.message`, which is the string the row renders, so a reworded refusal moves the
// expectation with it and an EMPTY one fails. The two labels this file matches on – «Retry» and the
// `Load career – <name>` accessible name – are transcribed with `src/components/screens/MoreScreen.vue`
// named beside them.
//
// ⚠ THE REAL WORKER AND A REAL DISK, for the reason principles-d01-restore-previous.test.ts gives: the
// defects on this layer live in the join between the screen's list, the store's refresh and the
// worker's re-validation. `request` is routed into the real `sim.worker.ts` handler through
// tests/helpers/workerHarness; the records are seeded through the product's own writers.
//
// ⚠ MUTATION ARMS – each watched red, outputs quoted in the wave's report:
//   A. THE SURFACE: `class="error save-op-row"` -> `v-if="false"` on More's save-op row. All three
//      cases red on the refusal they can no longer read.
//   B. THE EXIT, case 1: drop `@click="askLoadCareer(c)"` off the Careers row's Load.
//   C. THE EXIT, case 2: revert `refreshAfterStale`'s `refreshSlots()` (stores/game.ts) – the Retry
//      then re-sends the same stale belief and is refused again.
//   D. THE EXIT, case 3: drop `@click="fileInput?.click()"` off «Import from file».
//   E. ⭐ W2, SECOND PASS (26.09) – THE RESTORE'S OWN RETRY: drop the `tracked(...)` wrapper back off
//      `askRestorePrevious`'s `onConfirm` (MoreScreen.vue). Cases 4 and 5 go red and the three above
//      stay green: «the refusal row offers no Retry at all – That action was based on an outdated
//      screen – it was refreshed. Try again.» and «it sent ["manual:c-w2m-prev-inherit:backup"] where
//      the refused command was auto:c-w2m-prev-inherit:b».
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import { workerHarness } from '../helpers/workerHarness'
import { drainLifeBeats } from '../helpers/career'
import { createWorld, tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { adoptAutosave, listSlots } from '../../src/db/saves'
import { decompressWorld, encodeExportFile } from '../../src/engine/saveCodec'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND MoreScreen READS IT ON MOUNT (sound, motion, match defaults)
// – the same shim principles-d01-restore-previous.test.ts installs, for the reason quoted there.
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

const { send, workerGlobal } = workerHarness<Reply>()
harness.send = send as (m: unknown) => Promise<unknown>

/** ⭐ W2, SECOND PASS (26.09) – EVERY MESSAGE THE SCREEN SENDS, so «which operation did the Retry
 *  re-run» is a question about the WIRE and not about a label. The fourth and fifth cases below are
 *  about a Retry that used to re-run a DIFFERENT command with the same button text, which nothing
 *  readable off the screen can distinguish.
 *
 *  ⚠ WRAPPED, NOT REPLACED: the transport above is untouched and the first three cases read nothing
 *  from here. */
interface SentMsg {
  type: string
  slot?: string
}
const sent: SentMsg[] = []
const plainSend = harness.send
harness.send = async (m: unknown) => {
  sent.push(structuredClone(m) as SentMsg)
  return plainSend!(m)
}
const restoresSent = (): (string | undefined)[] =>
  sent.filter((m) => m.type === 'restoreSlot').map((m) => m.slot)

// -------------------------------------------------------------------------------------------------
// READING THE DISK RAW. Lifted from tests/save-doors-fuzz.test.ts, whose `RawRecord` note argues for
// a local copy: a shared reader would have to know which fields each suite compares, and «nothing
// moved» is a different fingerprint in each one. Here it is the payload itself, byte for byte,
// because one of the careers below CANNOT be decoded and so cannot be compared any other way.
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

function getRaw(database: IDBDatabase, slot: string): Promise<RawRecord | undefined> {
  return new Promise((resolve, reject) => {
    const req = database.transaction(STORE, 'readonly').objectStore(STORE).get(slot)
    req.onsuccess = () => resolve(req.result as RawRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}

/** Every autosave generation of a career, as bytes – the fingerprint «nothing moved» is read off. */
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
// THE FIXTURES
// -------------------------------------------------------------------------------------------------

/** A quiet career: ten weeks, no open question, so every command below is about the save layer.
 *  The name is per-career because More's controls are reached by their accessible names, which carry
 *  it (`Load career – <name>`, MoreScreen.vue) – one list, three rows, no index arithmetic. */
function quietCareer(seed: string, careerId: string, kidName: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, kidName }, careerId)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 10; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  drainLifeBeats(world)
  return world
}

/** ⚠ THE PREMISE OF THE FIRST CASE, ASSERTED THROUGH THE PRODUCT'S OWN TWO STEPS rather than
 *  assumed: the boot door reads this record without complaint (it runs neither the bounds walk nor
 *  the spine – saveCodec.ts's trust-levels note is the ruling) and `toSnapshot` then throws on it.
 *  `bestFinishByTier` is one of the thirteen fields the review's own sweep measured throwing there
 *  (docs/review-principles-2026-09-26/04-worker-protocol-persistence.md) and is absent from the
 *  migration ladder's spine, so nothing earlier can refuse it. */
async function seedUnrenderable(seed: string, careerId: string, kidName: string): Promise<WorldState> {
  const world = quietCareer(seed, careerId, kidName)
  delete (world as unknown as Record<string, unknown>).bestFinishByTier
  await adoptAutosave(world)
  const database = await openRaw()
  const rec = (await getRaw(database, `auto:${careerId}:a`))!
  const decoded = await decompressWorld(rec.payload, rec.checksum)
  expect(() => toSnapshot(decoded), 'the door reads it and the render throws').toThrow()
  return world
}

type Game = ReturnType<typeof useGameStore>

/** The store's own `busy` flag is the honest end condition for a save round trip; the bound only
 *  stops a hang becoming a silent pass. Lifted from principles-d01-restore-previous.test.ts. */
async function settle(game: Game): Promise<void> {
  for (let i = 0; i < 500 && game.busy; i++) await flushPromises()
  expect(game.busy, 'the store settled').toBe(false)
}

/** Mount More on the Saves tab – the tab Careers, the autosave rows, import/export and the save-op
 *  row all live behind. */
async function openSaves(game: Game): Promise<ReturnType<typeof mount>> {
  const w = mount(MoreScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = w.findAll('.more-tabs .tab-pill').find((t) => t.text() === 'Saves')!
  await tab.trigger('click')
  await settle(game)
  await flushPromises()
  return w
}

type Wrapper = ReturnType<typeof mount>

/** Press a control and answer its confirm – `ConfirmDialog` puts Cancel first and the action last,
 *  which is the row every destructive action on this screen uses. */
async function pressAndConfirm(w: Wrapper, game: Game, selector: () => unknown): Promise<void> {
  const button = selector() as { trigger: (e: string) => Promise<void> } | undefined
  expect(button, 'the screen offers the control this case presses').toBeTruthy()
  await button!.trigger('click')
  await flushPromises()
  const dialog = w.findComponent(ConfirmDialog)
  expect(dialog.exists(), 'the operation asks first').toBe(true)
  await dialog.findAll('button')[1].trigger('click')
  await flushPromises()
  await settle(game)
  await flushPromises()
}

const loadCareerButton = (w: Wrapper, kidName: string) =>
  // The accessible name is MoreScreen.vue's own, extended per D11 so the two `Load` controls on this
  // screen can be told apart: `Load career – <name>`.
  w.findAll('button').find((b) => b.attributes('aria-label') === `Load career – ${kidName}`)

/** The refusal row – TB-19's `.save-op-row`, the one element on this screen that reports a save
 *  operation's outcome. Asserted against `game.saveOp.message`, never against a literal. */
function expectRefusalOnScreen(w: Wrapper, game: Game, why: string): string {
  expect(game.saveOp, `${why}: refused, not silently swallowed`).toMatchObject({ status: 'error' })
  const message = game.saveOp?.message ?? ''
  expect(message, `${why}: the door refused in words`).not.toBe('')
  const row = w.find('.save-op-row.error')
  expect(row.exists(), `${why}: the refusal has no home on this screen`).toBe(true)
  expect(row.text(), `${why}: ...and the row does not carry it`).toContain(message)
  return message
}

beforeAll(async () => {
  await import('../../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the real worker module installed its handler').not.toBeNull()
})

describe('⭐⭐ W2 – every in-game save-door refusal leaves a control that goes somewhere else', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
    sent.length = 0
  })

  it('⭐⭐ a career that cannot render is refused, and the list still opens the one that can', async () => {
    const game = useGameStore()
    const held = quietCareer('w2m-held', 'c-w2m-held', 'Ada')
    const broken = await seedUnrenderable('w2m-broken', 'c-w2m-broken', 'Bea')
    const other = quietCareer('w2m-other', 'c-w2m-other', 'Cleo')
    await adoptAutosave(held)
    await adoptAutosave(other)
    await game.loadCareer(held.careerId)
    expect(game.snapshot?.careerId, 'the career the player is on').toBe(held.careerId)
    const brokenBefore = await generationsRaw(broken.careerId)
    const heldBefore = await generationsRaw(held.careerId)

    const w = await openSaves(game)
    await pressAndConfirm(w, game, () => loadCareerButton(w, 'Bea'))

    // The refusal is the untyped one the corpus reported (finding A) and the sentence is the owner's
    // to write; what is asserted is that it ARRIVES, and on a screen that still works.
    const message = expectRefusalOnScreen(w, game, 'a career that cannot render')
    expect(game.snapshot?.careerId, 'the refused load took the career the player was on').toBe(held.careerId)
    expect(await generationsRaw(broken.careerId), 'a refused load rewrote the record it read').toBe(brokenBefore)
    expect(await generationsRaw(held.careerId), 'a refused load touched the held career').toBe(heldBefore)

    // ⭐⭐ THE EXIT: the control that produced the refusal is one row of a list, and the list's other
    // rows are live. This is the assertion that separates «a refusal» from «a dead end».
    const exit = loadCareerButton(w, 'Cleo')
    expect(exit?.attributes('disabled'), 'the way out is on the screen and cannot be pressed').toBeUndefined()
    await pressAndConfirm(w, game, () => loadCareerButton(w, 'Cleo'))
    expect(game.snapshot?.careerId, 'the press landed on the same refusal').toBe(other.careerId)
    expect(game.saveOp, 'the row still reports the failure of a command that has been superseded').toMatchObject({
      status: 'ok',
    })
    expect(game.error, `the exit inherited the refusal – ${message}`).toBe('')
    w.unmount()
  })

  it('⭐ a restore refused with STALE_REVISION, and the Retry beside it that has to work', async () => {
    const game = useGameStore()
    const world = quietCareer('w2m-stale', 'c-w2m-stale', 'Dora')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1)
    await game.saveNamed('backup')
    await settle(game)
    const physioBefore = game.snapshot!.physioActive as boolean
    const before = await generationsRaw(world.careerId)

    const w = await openSaves(game)
    const named = (await listSlots(world.careerId)).find((s) => s.slot.startsWith('manual:'))!

    // ⚠ THE STALE BELIEF, PUT BACK BY HAND, and it is a REAL shape rather than a contrivance: the
    // screen's list is refreshed on every move of THIS tab's revision (D-01's first arm), so what is
    // left is the cross-tab case – another tab overwrites the record and this tab's list still holds
    // the revision it had. principles-d01-restore-previous.test.ts stages the same belief the same
    // way for the auto generations.
    game.slots = game.slots.map((s) =>
      s.slot === named.slot ? { ...s, revision: (s.revision ?? 0) - 2 } : s,
    )
    await flushPromises()

    const loadNamed = () => w.findAll('button').find((b) => b.attributes('aria-label') === 'Load save backup')
    expect(loadNamed(), 'the named-save table offers its Load').toBeTruthy()
    await loadNamed()!.trigger('click')
    await flushPromises()
    await settle(game)
    await flushPromises()

    // The refusal is the EXISTING typed one and the sentence is `refreshAfterStale`'s, which TB-02
    // shipped – no new copy on this path.
    const message = expectRefusalOnScreen(w, game, 'a stale restore')
    expect(game.snapshot!.physioActive, 'the world moved under a refused restore').toBe(physioBefore)
    expect(await generationsRaw(world.careerId), 'a refused restore moved a generation').toBe(before)

    // ⭐⭐ THE EXIT, AND IT IS WHY THIS CASE EXISTS. The named table's Load is wrapped in `tracked`, so
    // the row offers a Retry – and a Retry that re-sends the SAME stale belief is a control that
    // leads back to the same refusal, i.e. not an exit at all. `refreshAfterStale` re-reads the slot
    // list for exactly this reason: «the player decides against what IS» was true of the snapshot and
    // not of the list the next press reads its belief from.
    const retry = w.findAll('.save-op-row button').find((b) => b.text() === 'Retry')
    expect(retry, 'the refusal row offers its Retry').toBeTruthy()
    expect(retry!.attributes('disabled'), 'the Retry is on the screen and cannot be pressed').toBeUndefined()
    await retry!.trigger('click')
    await flushPromises()
    await settle(game)
    await flushPromises()
    expect(game.saveOp, `the Retry led back to the same refusal – ${message}`).toMatchObject({ status: 'ok' })
    expect(game.error, 'the Retry was refused too').toBe('')
    w.unmount()
  })

  it('⭐ an import refused at the door, and the picker beside it still imports', async () => {
    const game = useGameStore()
    const held = quietCareer('w2m-import-held', 'c-w2m-import-held', 'Eve')
    await adoptAutosave(held)
    await game.loadCareer(held.careerId)
    const heldBefore = await generationsRaw(held.careerId)

    // A file the product itself wrote, for the exit – and a career that is NOT on this device, so the
    // import adds rather than overwrites.
    const incoming = quietCareer('w2m-incoming', 'c-w2m-incoming', 'Flo')
    const goodBytes = await encodeExportFile(incoming)
    // ...and the same file with one byte flipped inside the gzip the SHA-256 covers, which is what a
    // truncated download or a helpful text editor actually produces.
    const damaged = Uint8Array.from(goodBytes)
    damaged[100] ^= 0xff

    const w = await openSaves(game)
    const picker = () => w.find('input[type="file"]')
    const pick = async (bytes: Uint8Array): Promise<void> => {
      const input = picker()
      expect(input.exists(), 'the Saves tab draws the import picker').toBe(true)
      // happy-dom's `files` is read-only, so the selection is defined onto the element and the same
      // `change` event the screen listens for is fired – round21-dialogs.test.ts's own helper.
      Object.defineProperty(input.element, 'files', {
        value: [new File([bytes as BlobPart], 'career.tsave')],
        configurable: true,
      })
      await input.trigger('change')
      // ⚠ THE PEEK IS A WORKER ROUND TRIP AND THE CONFIRM WAITS ON IT. `onImportPicked` awaits
      // `game.peekSave(file)` before it raises the question (MoreScreen.vue), and that is a gzip, a
      // structured clone and an IndexedDB open – several macrotasks, not one. A fixed number of
      // flushes is a coin toss; the dialog's own existence is the honest end condition.
      for (let i = 0; i < 500 && !w.findComponent(ConfirmDialog).exists(); i++) await flushPromises()
      const dialog = w.findComponent(ConfirmDialog)
      expect(dialog.exists(), 'the import asks first').toBe(true)
      await dialog.findAll('button')[1].trigger('click')
      await flushPromises()
      await settle(game)
      await flushPromises()
    }

    await pick(damaged)
    const message = expectRefusalOnScreen(w, game, 'a damaged file')
    expect(game.snapshot?.careerId, 'a refused import replaced the career on screen').toBe(held.careerId)
    expect(await generationsRaw(held.careerId), 'a refused import moved the held career').toBe(heldBefore)
    expect(
      game.careers.map((c) => c.careerId),
      'a refused import added the file as a career',
    ).not.toContain(incoming.careerId)

    // ⭐⭐ THE EXIT: the control that refused is the same control that succeeds – a bad file is not a
    // spent door. «Import from file» is still enabled and the picker behind it still works.
    const button = w.findAll('button').find((b) => b.text() === 'Import from file')
    expect(button, 'the screen still offers its import control').toBeTruthy()
    expect(button!.attributes('disabled'), 'the import door closed behind a bad file').toBeUndefined()
    await pick(goodBytes)
    expect(game.saveOp, `the good file was refused too – the first refusal was ${message}`).toMatchObject({
      status: 'ok',
    })
    expect(game.snapshot?.careerId, 'the good file did not become the career').toBe(incoming.careerId)
    w.unmount()
  })

  // ===============================================================================================
  // ⭐⭐ W2, SECOND PASS (26.09) – «RESTORE PREVIOUS»'s RETRY BELONGED TO SOMETHING ELSE
  // ===============================================================================================
  //
  // `askRestorePrevious` is the ONE save operation on this screen not wrapped in `tracked`
  // (MoreScreen.vue; its six siblings – the two career rows, the named delete, the named Load, the
  // export and the import – all are). `tracked` records the operation as the Retry target, so the
  // omission has two measured consequences, and the two cases below are one each:
  //
  //   1. the restore is the FIRST save op of a More visit -> `retrySaveAction` is still null, the row
  //      renders no Retry at all, and the refusal is a dead end on this row;
  //   2. something tracked ran EARLIER in the visit -> the Retry beside the restore's refusal
  //      re-runs THAT operation. A control that silently runs a different command is worse than no
  //      control, and nothing readable off the screen can tell the two apart – both say «Retry» – so
  //      case 2 asks the WIRE which command went out.
  //
  // ⚠ NO COPY MOVES. The row, its label and the refusal are TB-19's and TB-02's and are untouched;
  // the fix is the one `tracked(...)` wrapper its siblings already carry.
  //
  // ⚠ WHY THE STALE BELIEF IS PUT BACK BY HAND, and it is a real shape rather than a contrivance:
  // D-01's first arm refreshes this screen's list on every move of THIS tab's revision, so what is
  // left is the cross-tab case – another tab overwrites the record and this tab's list still holds
  // the revision it had. The `STALE_REVISION` case above stages the identical belief the identical
  // way for a named slot.
  //
  // ⚠ MUTATION ARM (E): drop the `tracked(...)` wrapper back off `askRestorePrevious`'s `onConfirm`
  // – case 1 goes red with «the refusal row offers no Retry at all» and case 2 with the manual slot
  // the Retry re-sent in place of the autosave one.

  /** Make every autosave generation's revision in THIS SCREEN's list two behind the disk, which is
   *  what a second tab's commit leaves. Whichever generation «Restore previous» targets is then
   *  refused, so the case never has to guess which one that is. */
  function staleAutoBelief(game: Game): void {
    game.slots = game.slots.map((s) =>
      s.slot.startsWith('auto:') ? { ...s, revision: (s.revision ?? 0) - 2 } : s,
    )
  }

  const restorePreviousButton = (w: Wrapper) =>
    // MoreScreen.vue's own label on the autosave row; the named table's controls carry aria-labels.
    w.findAll('button').find((b) => b.text() === 'Restore previous')

  const retryButton = (w: Wrapper) => w.findAll('.save-op-row button').find((b) => b.text() === 'Retry')

  it('⭐⭐ a refused «Restore previous» has a Retry at all, on a visit that ran nothing before it', async () => {
    const game = useGameStore()
    const world = quietCareer('w2m-prev-first', 'c-w2m-prev-first', 'Gwen')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1)
    await settle(game)
    const before = await generationsRaw(world.careerId)

    const w = await openSaves(game)
    // ⚠ THE PRECONDITION IS ABOUT THE VISIT, NOT ABOUT `saveOp`. `saveOp` is STORE state and outlives
    // the mount – the fixture's own `loadCareer` leaves an ok row on it – while `retrySaveAction` is
    // per-screen-visit BY DESIGN (MoreScreen.vue: «a Retry button that outlived the list it acted on
    // would be a trap»). So this visit has tracked nothing and the screen offers no Retry to inherit,
    // which is exactly the state this case is about.
    expect(retryButton(w), 'this visit has tracked nothing, so there is no Retry to inherit').toBeUndefined()
    staleAutoBelief(game)
    await flushPromises()

    await pressAndConfirm(w, game, () => restorePreviousButton(w))
    const message = expectRefusalOnScreen(w, game, 'a refused restore of the previous generation')
    expect(await generationsRaw(world.careerId), 'a refused restore moved a generation').toBe(before)

    // ⭐⭐ THE ITEM. The screen has other exits – the careers list, the named table, the import – so
    // nobody is STUCK here, which is why this is a dead CONTROL rather than a dead end. It is still
    // the row the player looks at, and the row said «failed» with nothing to press.
    const retry = retryButton(w)
    expect(retry, `the refusal row offers no Retry at all – ${message}`).toBeTruthy()
    expect(retry!.attributes('disabled'), 'the Retry is on the screen and cannot be pressed').toBeUndefined()

    // ...and it leads somewhere: `refreshAfterStale` re-read the list, so the second press states a
    // belief the worker agrees with.
    sent.length = 0
    await retry!.trigger('click')
    await flushPromises()
    await settle(game)
    await flushPromises()
    expect(restoresSent(), 'the Retry sent no restore at all').toHaveLength(1)
    expect(game.saveOp, `the Retry led back to the same refusal – ${message}`).toMatchObject({ status: 'ok' })
    expect(game.error, 'the Retry was refused too').toBe('')
    w.unmount()
  })

  it('⭐⭐ ...and the Retry re-runs THE RESTORE, not the tracked operation that ran before it', async () => {
    const game = useGameStore()
    const world = quietCareer('w2m-prev-inherit', 'c-w2m-prev-inherit', 'Hana')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1)
    await game.saveNamed('backup')
    await settle(game)

    const w = await openSaves(game)

    // AN EARLIER TRACKED OPERATION IN THE SAME VISIT – the named table's Load, which is wrapped, so
    // after this press `retrySaveAction` holds a restore of the MANUAL slot.
    const loadNamed = () => w.findAll('button').find((b) => b.attributes('aria-label') === 'Load save backup')
    expect(loadNamed(), 'the named-save table offers its Load').toBeTruthy()
    sent.length = 0
    await loadNamed()!.trigger('click')
    await flushPromises()
    await settle(game)
    await flushPromises()
    expect(game.saveOp, 'the earlier operation succeeded, so the Retry it left is a live one').toMatchObject({
      status: 'ok',
    })
    const earlier = restoresSent()
    expect(earlier, 'the earlier press sent exactly one restore').toHaveLength(1)
    expect(earlier[0], 'and it was the NAMED slot').toContain('manual:')

    staleAutoBelief(game)
    await flushPromises()
    sent.length = 0
    await pressAndConfirm(w, game, () => restorePreviousButton(w))
    const message = expectRefusalOnScreen(w, game, 'a refused restore after a tracked operation')
    const asked = restoresSent()
    expect(asked, 'the press sent exactly one restore').toHaveLength(1)
    const target = asked[0]!
    expect(target.startsWith('auto:'), 'the control pressed was the AUTOSAVE restore').toBe(true)
    expect(target, 'the two operations must target different slots, or this case proves nothing').not.toBe(
      earlier[0],
    )

    // ⭐⭐ THE ITEM. Same button, same words, and until this wave it re-ran the LOAD above.
    const retry = retryButton(w)
    expect(retry, `the refusal row offers its Retry – ${message}`).toBeTruthy()
    sent.length = 0
    await retry!.trigger('click')
    await flushPromises()
    await settle(game)
    await flushPromises()
    const again = restoresSent()
    expect(
      again,
      `the Retry beside the restore's refusal re-ran a DIFFERENT operation: it sent ${JSON.stringify(again)} ` +
        `where the refused command was ${target}`,
    ).toEqual([target])
    expect(game.saveOp, `the Retry led back to the same refusal – ${message}`).toMatchObject({ status: 'ok' })
    expect(game.error, 'the Retry was refused too').toBe('')
    w.unmount()
  })
})
