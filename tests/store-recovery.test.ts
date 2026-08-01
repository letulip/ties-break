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
