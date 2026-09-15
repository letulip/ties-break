// =================================================================================================
// ⭐⭐⭐ ROUND 42 #17(a) – ONE PRESS, ONE WEEK: THE IN-FLIGHT LATCH ON `game.advance`
// =================================================================================================
//
// The owner: «иногда получается двойная перемотка недели вместо одинарной… не получается на турниры
// заходить вовремя». Mechanism (a) of three, measured in the ledger: NOTHING on the press path ever
// asked `busy` – `playWeek` does not, `run()` has no re-entry check – and the worker's
// `baseRevision` refuses only CONCURRENT duplicates, so the second press of a double-tap that
// landed inside the first press's round-trip was sent as a fresh, valid command and spent a second
// week. The latch is ONE line at the narrowest honest point (`advance` refuses while any command is
// in flight), and this file is its pin.
//
// ⚠ THE WORKER CLIENT IS MOCKED AT THE MODULE BOUNDARY – store-recovery.test.ts's own arrangement:
// the store's whole contract is what it SENDS next, and the count of 'advance' requests is exactly
// the claim («one press, one week») made observable.
//
// ⚠⚠ MUTATION ARM (run 15.09, red then restored): delete `if (this.busy) return` from
// `advance` in src/stores/game.ts – «a second press inside the flight sends NO second command» goes
// red with 2 advance requests on the wire, which is the owner's double week reproduced at the seam
// that now stops it.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { request } from '../src/worker/client'
import { useGameStore } from '../src/stores/game'
import type { Snapshot, ToUI } from '../src/shared/protocol'

vi.mock('../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})

const mockRequest = vi.mocked(request)

const snap = (week: number): Snapshot => ({ careerId: 'c-r42', week }) as unknown as Snapshot

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

/** The wire, with the advance's reply HELD OPEN until the test releases it – the double-tap's whole
 *  stage is the window while the first press is still in flight. */
function wireWithHeldAdvance() {
  let release: (() => void) | null = null
  const sent: string[] = []
  mockRequest.mockImplementation(async (msg) => {
    sent.push(msg.type)
    if (msg.type === 'advance') {
      await new Promise<void>((resolve) => {
        release = resolve
      })
      return snapshotReply(21, 6)
    }
    if (msg.type === 'listSlots') return slotsReply(6)
    if (msg.type === 'listCareers') return careersReply(6)
    throw new Error(`unexpected request ${msg.type}`)
  })
  return { sent, release: () => release?.() }
}

describe('ROUND 42 #17(a) – the advance latch', () => {
  it('⭐⭐⭐ a second press inside the flight sends NO second command – one press, one week', async () => {
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5
    const { sent, release } = wireWithHeldAdvance()

    const first = store.advance(1)
    // The double-tap: the first press's request is on the wire and unanswered. `busy` is the
    // in-flight fact the latch reads, so the assertion checks the stage is really set.
    expect(store.busy, 'the first press really is in flight – the case is not vacuous').toBe(true)
    const second = store.advance(1)
    await second
    expect(sent.filter((t) => t === 'advance'), 'the second press was refused outright').toHaveLength(1)

    release()
    await first
    expect(store.snapshot?.week, 'the one press bought its one week').toBe(21)
    expect(store.busy).toBe(false)
    expect(store.error, 'a refused double-tap is silence, not a toast').toBe('')
  })

  it('⚠ the latch is the flight, not a one-shot: a press AFTER the round-trip is an ordinary press', async () => {
    // The guard must never eat a deliberate second week – it reads `busy`, which drops with the
    // reply, so two sequential presses stay two weeks. (What tells a fast deliberate press from a
    // bounce is the flight window itself: that is the recorded design, mechanism (a) closes the
    // in-flight window and mechanisms (b)/(c) close the windows around it.)
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5
    let week = 20
    mockRequest.mockImplementation(async (msg) => {
      if (msg.type === 'advance') return snapshotReply(++week, ++store.revision)
      if (msg.type === 'listSlots') return slotsReply(store.revision)
      if (msg.type === 'listCareers') return careersReply(store.revision)
      throw new Error(`unexpected request ${msg.type}`)
    })
    await store.advance(1)
    await store.advance(1)
    expect(store.snapshot?.week, 'two finished presses are two weeks, as they always were').toBe(22)
  })

  it('⚠ the latch refuses while ANY command is in flight – a tick behind a save cannot stack', async () => {
    // `busy` is `run()`'s own flag for every command, so an advance pressed while (say) a manual
    // save round-trips is refused the same way. That is deliberate: the press was made against a
    // screen about to be replaced, which is the stale-decision family W1-INTEGRITY-A exists for.
    const store = useGameStore()
    store.snapshot = snap(20)
    store.revision = 5
    let releaseSave: () => void = () => {}
    const sent: string[] = []
    mockRequest.mockImplementation(async (msg) => {
      sent.push(msg.type)
      if (msg.type === 'save') {
        await new Promise<void>((resolve) => {
          releaseSave = resolve
        })
        return slotsReply(6)
      }
      throw new Error(`unexpected request ${msg.type}`)
    })
    const saving = store.saveManual()
    expect(store.busy).toBe(true)
    await store.advance(1)
    expect(sent.filter((t) => t === 'advance')).toHaveLength(0)
    releaseSave()
    await saving
  })
})
