// DRIVING sim.worker.ts OVER ITS OWN PROTOCOL – the arrangement four suites had each written out.
//
// The worker module is written for a Worker global (`self.onmessage` / `self.postMessage`), so a
// test must PROVIDE that global BEFORE the module evaluates – which is why every caller imports the
// worker dynamically, inside a `beforeAll`, and calls this factory at module top level. Keep that
// order: `self` is assigned when this function runs, and the worker assigns `self.onmessage` at its
// own top level.
//
// WHAT DIFFERED between the four copies, and what it means for this factory:
//   `send`         – byte-identical in all four. Merged as-is.
//   `WorkerMsg`    – byte-identical in all four. Merged as-is.
//   `workerGlobal` – three identical; tests/dev-fast-forward.test.ts additionally latched the
//                    committed revision off every ok reply (`lastRevision`), because its guard tests
//                    must hand back a LIVE `baseRevision` – a stale one is refused as STALE_REVISION
//                    before the tick guard it is pinning ever runs. That is a real difference, so it
//                    is parameterised rather than flattened: `onReply` runs on every reply, in the
//                    same position the local copy ran it (before the waiter), and the variable it
//                    writes stays in the suite that reasons about it.
//   `Reply`        – DIFFERENT IN ALL FOUR and deliberately left alone. Each suite declares the
//                    fields it actually reads (`bytes`, `slots`, `restoredFrom`, `code`, …); a union
//                    of all four would let a test read a field its worker call never returns and get
//                    `undefined` instead of a type error. So `Reply` stays local and arrives here as
//                    the type parameter.
import type { ToWorker } from '../../src/shared/protocol'

/** Omit that DISTRIBUTES over a union: plain `Omit<ToWorker, 'id'>` collapses the message union to
 *  its common keys ({ id, type }) and rejects every payload field. */
export type WorkerMsg<T = ToWorker> = T extends { id: number } ? Omit<T, 'id'> : never

/** The Worker global the module under test believes it is running inside. */
export interface WorkerGlobal {
  onmessage: null | ((e: { data: ToWorker }) => void)
  postMessage(m: unknown): void
}

/** The only shape this harness needs of a reply: the id it is answering. */
export interface RepliesById {
  id: number
}

/**
 * Install a fake Worker global and return the client half.
 *
 * ⚠ CALL AT MODULE TOP LEVEL, before the dynamic `import('../src/worker/sim.worker')`. The
 * assignment to `globalThis.self` happens here; the worker reads it while evaluating.
 *
 * @param onReply runs on every reply before it is delivered – for a suite that has to track
 *                something off the stream (the committed revision) rather than off one call.
 */
export function workerHarness<R extends RepliesById>(onReply?: (r: R) => void): {
  send: (msg: WorkerMsg) => Promise<R>
  workerGlobal: WorkerGlobal
} {
  const waiters = new Map<number, (r: R) => void>()
  const workerGlobal: WorkerGlobal = {
    onmessage: null,
    postMessage(m: unknown) {
      const r = m as R
      onReply?.(r)
      waiters.get(r.id)?.(r)
      waiters.delete(r.id)
    },
  }
  // Must exist before the worker module evaluates (it assigns self.onmessage at top level).
  ;(globalThis as unknown as { self: unknown }).self = workerGlobal

  let nextId = 1
  function send(msg: WorkerMsg): Promise<R> {
    return new Promise((resolve) => {
      const id = nextId++
      waiters.set(id, resolve)
      workerGlobal.onmessage!({ data: { ...msg, id } as ToWorker })
    })
  }

  return { send, workerGlobal }
}
