import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import type { ToUI, ToWorker } from '../src/shared/protocol'

// =================================================================================================
// W1-INTEGRITY-A (Codex TB-05) — THE RECOVERABLE CLIENT, driven over a scriptable Worker global.
//
// The defect this pins shut: `worker.onerror` used to reject the in-flight requests but KEEP the
// dead Worker cached — every later request posted into a corpse and hung forever, and there was
// no timeout and no `messageerror` handler at all. The acceptance list, as tests:
//   * terminating failure (crash / messageerror / timeout) rejects EVERY pending request with the
//     typed, recoverable error — and the instance is terminated, not merely abandoned;
//   * the NEXT request spawns a fresh worker instance, no page reload anywhere;
//   * late responses from a dead generation cannot resolve current requests;
//   * per-command budgets differ: lifecycle/simulation commands get the long budget (derived from
//     the restore-bench receipts — a 20-season migration once cost ~1.6s, so 60s clears a
//     10x-slower phone many times over), ordinary commands the short one;
//   * a clean response resolves and disarms its timer.
//
// The worker BEHIND the client is the pipeline suite's subject, not this one's: here the worker is
// a hand-cranked fake, because TB-05's contracts are entirely on the client's side of postMessage.
// =================================================================================================

class FakeWorker {
  static instances: FakeWorker[] = []
  onmessage: ((e: { data: ToUI }) => void) | null = null
  onerror: ((e: { message?: string }) => void) | null = null
  onmessageerror: ((e: unknown) => void) | null = null
  posted: ToWorker[] = []
  terminated = false
  constructor(..._args: unknown[]) {
    FakeWorker.instances.push(this)
  }
  postMessage(m: unknown): void {
    this.posted.push(m as ToWorker)
  }
  terminate(): void {
    this.terminated = true
  }
  // -- test cranks ------------------------------------------------------------
  reply(msg: ToUI): void {
    this.onmessage?.({ data: msg })
  }
  crash(message: string): void {
    this.onerror?.({ message })
  }
}

// The global must exist before the client module evaluates `new Worker(...)` on first request.
;(globalThis as unknown as { Worker: unknown }).Worker = FakeWorker

type Client = typeof import('../src/worker/client')
let client: Client

const last = (): FakeWorker => FakeWorker.instances[FakeWorker.instances.length - 1]

/** ok careers reply for whatever id the fake worker last received. */
const okReply = (w: FakeWorker, marker = 0): ToUI => ({
  id: w.posted[w.posted.length - 1].id,
  ok: true,
  type: 'careers',
  careers: [],
  revision: marker,
})

beforeAll(async () => {
  client = await import('../src/worker/client')
})

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('a worker failure is terminal for the instance, recoverable for the app', () => {
  it('crash: every pending request rejects typed, the instance is terminated, the next request gets a fresh one', async () => {
    const p1 = client.request({ type: 'listCareers' })
    const p2 = client.request({ type: 'listSlots' })
    const w = last()
    expect(w.posted).toHaveLength(2)

    w.crash('boom')
    await expect(p1).rejects.toBeInstanceOf(client.WorkerRestartError)
    await expect(p2).rejects.toMatchObject({ kind: 'crash', recoverable: true })
    expect(w.terminated, 'a crashed instance is terminated, never kept cached').toBe(true)

    // No page reload semantics: the very next request spawns generation N+1 and works.
    const countBefore = FakeWorker.instances.length
    const p3 = client.request({ type: 'listCareers' })
    expect(FakeWorker.instances.length).toBe(countBefore + 1)
    const w2 = last()
    expect(w2).not.toBe(w)
    w2.reply(okReply(w2, 7))
    await expect(p3).resolves.toMatchObject({ ok: true, revision: 7 })
  })

  it('messageerror: an undeliverable message rejects typed instead of hanging silent', async () => {
    const p = client.request({ type: 'listCareers' })
    last().onmessageerror?.({})
    await expect(p).rejects.toMatchObject({ kind: 'messageerror', recoverable: true })
    expect(last().terminated).toBe(true)
  })

  it('a late response from the DEAD generation cannot resolve a current request', async () => {
    const p1 = client.request({ type: 'listCareers' })
    const w1 = last()
    w1.crash('boom')
    await expect(p1).rejects.toBeInstanceOf(client.WorkerRestartError)

    const p2 = client.request({ type: 'listCareers' })
    const w2 = last()
    const currentId = w2.posted[0].id

    // The dead generation speaks up late, FORGING the current request's id (ids are global, so
    // this is the sharpest possible impersonation). The generation check must drop it.
    w1.reply({ id: currentId, ok: true, type: 'careers', careers: [], revision: 999 })

    // p2 is still pending — only ITS OWN worker may resolve it.
    let settled = false
    void p2.finally(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled, 'the forged reply must not settle the live request').toBe(false)

    w2.reply(okReply(w2, 1))
    await expect(p2).resolves.toMatchObject({ ok: true, revision: 1 })
  })
})

describe('per-command timeouts', () => {
  it('an ordinary command times out on the short budget: typed rejection, worker replaced', async () => {
    const p = client.request({ type: 'listCareers' })
    const w = last()
    const rejected = expect(p).rejects.toMatchObject({ kind: 'timeout', recoverable: true })
    await vi.advanceTimersByTimeAsync(10_000 + 1)
    await rejected
    expect(w.terminated, 'a wedged worker is terminated so it cannot keep writing later').toBe(true)

    const p2 = client.request({ type: 'listCareers' })
    const w2 = last()
    expect(w2).not.toBe(w)
    w2.reply(okReply(w2, 3))
    await expect(p2).resolves.toMatchObject({ ok: true })
  })

  it('a heavy command (advance/import class) survives the short budget and times out on the long one', async () => {
    const p = client.request({ type: 'advance', weeks: 4, baseRevision: 5 })
    const w = last()
    let settled = false
    void p.catch(() => {}).finally(() => {
      settled = true
    })

    // 59s: a 20-season migration at phone speed still fits here — the client must still wait.
    await vi.advanceTimersByTimeAsync(59_000)
    expect(settled, 'the long budget must not fire on the short schedule').toBe(false)

    const rejected = expect(p).rejects.toMatchObject({ kind: 'timeout' })
    await vi.advanceTimersByTimeAsync(1_000 + 1)
    await rejected
    expect(w.terminated).toBe(true)
  })

  it('a clean response resolves and disarms the timer — no late ghost teardown', async () => {
    const p = client.request({ type: 'listCareers' })
    const w = last()
    w.reply(okReply(w, 11))
    await expect(p).resolves.toMatchObject({ ok: true, revision: 11 })

    // Run the clock far past every budget: the resolved request's timer must be gone, so the
    // CURRENT worker survives and serves the next request.
    await vi.advanceTimersByTimeAsync(120_000)
    expect(w.terminated).toBe(false)
    const p2 = client.request({ type: 'listCareers' })
    expect(last(), 'no spawn happened — the instance was never torn down').toBe(w)
    w.reply(okReply(w, 12))
    await expect(p2).resolves.toMatchObject({ ok: true, revision: 12 })
  })
})
