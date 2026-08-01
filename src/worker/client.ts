import type { ToWorker, ToUI } from '../shared/protocol'

// UI-side wrapper: request/response correlation over postMessage.
//
// W1-INTEGRITY-A (Codex TB-05) — THE WORKER IS A REPLACEABLE PROCESS. The pre-wave client kept
// the crashed Worker object cached forever: `onerror` rejected the in-flight requests but left
// `worker` set, so every later request posted into a dead process and hung without recourse (the
// verified load-bearing defect #3 of this wave). Now every failure — `error`, `messageerror`, or
// a per-command timeout — tears the instance down COMPLETELY: terminate, drop the cache, reject
// everything pending with a typed `WorkerRestartError`, and let the NEXT request spawn a fresh
// worker. The fresh worker boots with no world; the store reacts to `WorkerRestartError` by
// reloading the last committed autosave (see stores/game.ts), which TB-03 made unambiguous — a
// mutation either committed durably or never happened, so "reload the last committed revision"
// is the whole recovery story, with no guessing about a half-applied command.

/** Why the pending request failed, for the store's recovery dispatch. */
export type WorkerFailureKind = 'crash' | 'messageerror' | 'timeout'

/** The typed, recoverable rejection every pending request receives when its worker generation
 *  dies. `recoverable` says: nothing is wedged — the last committed autosave is intact, and the
 *  next request will get a fresh worker; reload and continue. */
export class WorkerRestartError extends Error {
  readonly recoverable = true as const
  constructor(
    readonly kind: WorkerFailureKind,
    message: string,
  ) {
    super(message)
    this.name = 'WorkerRestartError'
  }
}

// Omit must distribute over the message union, else only shared fields survive.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type WorkerRequest = DistributiveOmit<ToWorker, 'id'>

interface PendingEntry {
  resolve: (msg: ToUI) => void
  reject: (err: Error) => void
  /** the worker generation this request was posted into — a response or failure from any OTHER
   *  generation must never touch it */
  generation: number
  timer: ReturnType<typeof setTimeout>
}

let worker: Worker | null = null
/** Generation token: bumped on every spawn. Handlers close over the generation they were created
 *  for, so a late event from a torn-down instance is provably ignorable rather than "probably
 *  fine" — the acceptance line "late responses from the terminated generation cannot resolve
 *  current requests" is this number. */
let generation = 0
let nextId = 1
const pending = new Map<number, PendingEntry>()

/**
 * Per-command budgets (TB-05). The clock covers queue time too — the worker serializes commands
 * (TB-02), so a request's wait includes whatever runs ahead of it; both classes are sized for
 * that, deliberately generous, because the timeout's ONLY job is to catch a genuinely wedged
 * worker, not to race a slow phone.
 *
 * HEAVY (60s) — commands that move simulated time or (re)build a whole world. Derived from the
 * restore-bench receipts on main (tools/restore-bench.ts): a 20-season import pays a one-time
 * migration measured at ~1.6s on a desktop core; a 52-week dev tick is ~100ms of engine plus a
 * commit. A phone an order of magnitude slower still clears 60s several times over, and a worker
 * that is BUSY posts its reply the moment it finishes — only a wedged one ever meets this number.
 *
 * DEFAULT (10s) — everything else: reads, single-slot storage work, and one-week-scale planner
 * mutations, each tens of milliseconds of real work at worst.
 */
const DEFAULT_TIMEOUT_MS = 10_000
const HEAVY_TIMEOUT_MS = 60_000
const HEAVY_COMMANDS: ReadonlySet<ToWorker['type']> = new Set([
  'new',
  'tick',
  'advance',
  'loadCareer',
  'restoreSlot',
  'importSave',
])

function timeoutFor(type: ToWorker['type']): number {
  return HEAVY_COMMANDS.has(type) ? HEAVY_TIMEOUT_MS : DEFAULT_TIMEOUT_MS
}

/**
 * Kill one worker generation: terminate the instance, forget it, and reject every request that
 * was posted into it. Terminating on TIMEOUT too is deliberate: a wedged worker left alive could
 * finish its stuck command later and keep autosaving behind the fresh worker's back — two writers
 * over one career. The disk-level CAS (db/saves.ts) makes even that a typed conflict rather than
 * data loss, but one writer at a time is the design, and terminate is what enforces it.
 */
function teardown(gen: number, err: WorkerRestartError): void {
  if (gen !== generation) return // that generation is already gone; never touch its successor
  worker?.terminate()
  worker = null
  for (const [id, p] of pending) {
    if (p.generation !== gen) continue
    pending.delete(id)
    clearTimeout(p.timer)
    p.reject(err)
  }
}

function spawn(): Worker {
  generation += 1
  const gen = generation
  const w = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' })
  w.onmessage = (e: MessageEvent<ToUI>) => {
    const p = pending.get(e.data.id)
    if (!p || p.generation !== gen) return // late response from a dead generation: ignored
    pending.delete(e.data.id)
    clearTimeout(p.timer)
    p.resolve(e.data)
  }
  w.onerror = (e) => teardown(gen, new WorkerRestartError('crash', e.message || 'Sim worker crashed'))
  // A message that fails structured deserialization never reaches the worker's queue, so no reply
  // will ever come — without this handler that request would sit silent until its timeout.
  w.onmessageerror = () =>
    teardown(gen, new WorkerRestartError('messageerror', 'Sim worker message could not be delivered'))
  return w
}

function ensureWorker(): Worker {
  worker ??= spawn()
  return worker
}

export function request(msg: WorkerRequest, transfer: Transferable[] = []): Promise<ToUI> {
  const id = nextId++
  const full = { ...msg, id } as ToWorker
  return new Promise((resolve, reject) => {
    const w = ensureWorker()
    const gen = generation
    const timer = setTimeout(() => {
      if (!pending.has(id)) return
      teardown(
        gen,
        new WorkerRestartError(
          'timeout',
          `The simulation did not respond ('${msg.type}', ${timeoutFor(msg.type) / 1000}s) and was restarted`,
        ),
      )
    }, timeoutFor(msg.type))
    pending.set(id, { resolve, reject, generation: gen, timer })
    try {
      w.postMessage(full, transfer)
    } catch (err) {
      // A request that cannot be serialized (e.g. an already-detached buffer) is THIS caller's
      // failure, not the worker's: reject it alone, keep the worker and its other requests alive.
      pending.delete(id)
      clearTimeout(timer)
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}
