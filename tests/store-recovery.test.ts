import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { request, WorkerRestartError } from '../src/worker/client'
import { useGameStore } from '../src/stores/game'
import type { Snapshot, ToUI } from '../src/shared/protocol'

// =================================================================================================
// W1-INTEGRITY-A — the STORE side of TB-05/TB-02 recovery. The client suite proves the transport
// rejects typed; this one proves the store turns those rejections into the promised behavior:
//   * WorkerRestartError -> reload the LAST COMMITTED autosave through the fresh worker and show
//     "Simulation restarted from the last saved week." (the copy is the TB-05 acceptance line —
//     rendered through `game.error`, which every screen already shows; the crashed command is
//     NEVER retried, because whether it committed is what a dead worker cannot answer);
//   * STALE_REVISION -> adopt the current revision, re-fetch the committed snapshot, explain;
//   * SAVE_CONFLICT -> surface the cross-tab copy, clobber nothing.
// The worker client is mocked at the module boundary — the store's contract is entirely in what
// it sends next and what it patches, and both are observable right here.
// =================================================================================================

vi.mock('../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})

const mockRequest = vi.mocked(request)

const snap = (week: number): Snapshot => ({ careerId: 'c-test', week }) as unknown as Snapshot

const snapshotReply = (week: number, revision: number): ToUI => ({
  id: 0,
  ok: true,
  type: 'snapshot',
  snapshot: snap(week),
  revision,
})
const slotsReply = (revision: number): ToUI => ({ id: 0, ok: true, type: 'slots', slots: [], revision })
const careersReply = (revision: number): ToUI => ({ id: 0, ok: true, type: 'careers', careers: [], revision })

beforeEach(() => {
  setActivePinia(createPinia())
  mockRequest.mockReset()
})

describe('worker restart recovery (TB-05)', () => {
  it('reloads the last committed autosave and says where time resumed', async () => {
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5

    mockRequest.mockImplementation(async (msg) => {
      if (msg.type === 'advance') throw new WorkerRestartError('crash', 'Sim worker crashed')
      if (msg.type === 'loadCareer') return snapshotReply(20, 5)
      if (msg.type === 'listSlots') return slotsReply(5)
      if (msg.type === 'listCareers') return careersReply(5)
      throw new Error(`unexpected request ${msg.type}`)
    })

    await store.advance(1)

    // The recovery reloaded the career the player was in — and ONLY that; the crashed advance was
    // not re-sent (nothing may guess whether it committed).
    const types = mockRequest.mock.calls.map(([m]) => m.type)
    expect(types.filter((t) => t === 'advance')).toHaveLength(1)
    expect(types).toContain('loadCareer')
    expect(mockRequest.mock.calls.find(([m]) => m.type === 'loadCareer')![0]).toMatchObject({
      careerId: 'c-test',
    })
    expect(store.snapshot?.week).toBe(20)
    expect(store.error).toBe('Simulation restarted from the last saved week.')
    expect(store.busy).toBe(false)
  })

  it('with no active career the restart surfaces plainly and stays retryable', async () => {
    const store = useGameStore()
    mockRequest.mockRejectedValue(new WorkerRestartError('timeout', 'timed out'))

    await store.refreshCareers().catch(() => {}) // refresh helpers do not run(); direct actions do
    await store.advance(1)
    expect(store.error).toBe('The simulation restarted. Try again.')
    expect(store.busy).toBe(false)
  })
})

describe('stale revision recovery (TB-02)', () => {
  it('adopts the current revision, re-fetches the committed snapshot, explains the refusal', async () => {
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5

    mockRequest.mockImplementation(async (msg) => {
      if (msg.type === 'advance')
        return { id: 0, ok: false, error: 'Stale revision', code: 'STALE_REVISION', revision: 9 }
      if (msg.type === 'getSnapshot') return snapshotReply(24, 9)
      throw new Error(`unexpected request ${msg.type}`)
    })

    await store.advance(1)

    expect(store.revision).toBe(9)
    expect(store.snapshot?.week, 'the UI now shows the state that actually is').toBe(24)
    expect(store.error).toContain('outdated screen')
    expect(store.busy).toBe(false)
  })

  it('SAVE_CONFLICT surfaces the cross-tab copy without touching the snapshot', async () => {
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5

    mockRequest.mockResolvedValue({
      id: 0,
      ok: false,
      error: 'Save conflict: this career is at revision 8 on disk',
      code: 'SAVE_CONFLICT',
      revision: 8,
    })

    await store.advance(1)
    expect(store.error).toContain('Another tab has newer progress')
    expect(store.snapshot?.week).toBe(20)
    expect(store.busy).toBe(false)
  })
})

// =================================================================================================
// R2-05 (TB-06 / PR-07) — THE CENTRAL SNAPSHOT APPLICATION, from the store's side.
//
// 36 copies of `if (res.type === 'snapshot') this.snapshot = res.snapshot` are gone; three appliers
// took their place. The compiler proves nothing can be handed to the wrong one
// (tests/worker-reply-pairs.types.ts) and the client rejects a mispaired reply before the store ever
// sees it (tests/worker-client-recovery.test.ts). These two tests cover what is left: that the
// appliers publish, and that the assertion inside them is a real one rather than decoration.
// =================================================================================================
describe('central snapshot application (R2-05)', () => {
  it('the applier publishes the snapshot off the reply and absorbs its revision', async () => {
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5

    mockRequest.mockImplementation(async (msg) => {
      if (msg.type === 'advance') return snapshotReply(21, 6)
      if (msg.type === 'listSlots') return slotsReply(6)
      if (msg.type === 'listCareers') return careersReply(6)
      throw new Error(`unexpected request ${msg.type}`)
    })

    await store.advance(1)
    expect(store.snapshot?.week).toBe(21)
    expect(store.revision).toBe(6)
    expect(store.error).toBe('')
  })

  it('a worker that answers off-contract is REFUSED, not applied – the screen keeps its snapshot', async () => {
    // ⚠ THIS IS THE MUTATION TEST FOR `expectArm`. Take the assertion out of the applier and
    // `this.snapshot = res.snapshot` assigns `undefined` off a slots reply – the game blanks, with
    // no error anywhere. The `if` this replaced was no better: it left the screen on last week and
    // said nothing. Only a refusal is honest, and only this test can tell the three apart.
    //
    // Reaching this state needs a mocked client, because the REAL `request` rejects a mispaired
    // reply on the wire (R2-05's `replyMismatch`) and it could never arrive here at all. That is the
    // point: two guards at two boundaries, and this one is the backstop.
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5

    mockRequest.mockImplementation(async (msg) => {
      if (msg.type === 'advance') return slotsReply(6) // the wrong arm, straight past the wire check
      if (msg.type === 'listSlots') return slotsReply(6)
      if (msg.type === 'listCareers') return careersReply(6)
      throw new Error(`unexpected request ${msg.type}`)
    })

    await store.advance(1)

    expect(store.snapshot?.week, 'the week the player was looking at is still there').toBe(20)
    expect(store.error).toContain("'slots'")
    expect(store.error).toContain('snapshot')
    expect(store.busy).toBe(false)
  })

  it('an ordinary command does not clear the recovery flag – only the three lifecycle loads set it', async () => {
    // ⚠ THE REGRESSION A CENTRAL APPLIER INVITES, pinned before it can happen. `recovered` is read
    // off the SAME snapshot reply as the snapshot itself, so the obvious tidy is to fold
    // `this.recovered = res.recovered ?? false` into `applySnapshot` – and that would silently wipe
    // the "this career was repaired on the way in" banner on the player's very next action.
    // It stays at the three call sites that own it: newCareer, loadCareer, restoreSlot.
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5
    store.recovered = true

    mockRequest.mockImplementation(async (msg) => {
      if (msg.type === 'advance') return snapshotReply(21, 6)
      if (msg.type === 'listSlots') return slotsReply(6)
      if (msg.type === 'listCareers') return careersReply(6)
      throw new Error(`unexpected request ${msg.type}`)
    })

    await store.advance(1)
    expect(store.recovered, 'the repair notice survives an advance').toBe(true)
  })
})
