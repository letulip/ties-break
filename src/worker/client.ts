import { REPLY_BY_COMMAND, type ReplyFor, type ToWorker, type ToUI } from '../shared/protocol'

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

/** R2-05 — the worker answered a command with a reply the protocol does not pair it with. This is a
 *  PROTOCOL BUG, not a runtime condition a player can hit: `REPLY_BY_COMMAND` is compile-enforced on
 *  this side of the wire, and tests/worker-reply-correlation.test.ts holds the worker's switch to
 *  the same table. Deliberately NOT a `WorkerRestartError` — nothing is wedged and reloading the
 *  autosave would recover nothing, so the store must surface it rather than silently reload. */
export class ReplyMismatchError extends Error {
  constructor(
    readonly command: ToWorker['type'],
    readonly expected: string,
    readonly received: string,
  ) {
    super(`The simulation answered '${command}' with a '${received}' reply where '${expected}' was expected`)
    this.name = 'ReplyMismatchError'
  }
}

// Omit must distribute over the message union, else only shared fields survive.
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
export type WorkerRequest = DistributiveOmit<ToWorker, 'id'>

interface PendingEntry {
  resolve: (msg: ToUI) => void
  reject: (err: Error) => void
  /** the command this entry is waiting on — kept for one reason, R2-05: the reply arrives on a
   *  shared `onmessage` with nothing but an id on it, so this is the only place the pairing can be
   *  recovered and checked against `REPLY_BY_COMMAND` */
  command: ToWorker['type']
  /** the worker generation this request was posted into — a response or failure from any OTHER
   *  generation must never touch it */
  generation: number
  timer: ReturnType<typeof setTimeout>
}

/**
 * R2-05, THE RUNTIME HALF OF THE CORRELATION — one place, every command.
 *
 * The compile-time half (`ReplyFor<K>` below) binds this side of `postMessage`; nothing can bind the
 * other side, because a Worker is a separate program that could be built from a different revision
 * of the protocol. So the reply is checked against the table that typed the request, HERE, where the
 * command and its answer are both in hand — which is the whole of "correlate requests with replies".
 *
 * ⚠ FAILURES ARE NOT CHECKED AND MUST NOT BE. The `ok: false` arm carries no `type` at all: every
 * command may refuse, and a refusal is a legitimate answer to all of them. Checking only the ok arms
 * is what keeps the error path — engine refusals, STALE_REVISION, SAVE_CONFLICT — byte-for-byte the
 * behaviour it was.
 */
function replyMismatch(command: ToWorker['type'], reply: ToUI): ReplyMismatchError | null {
  if (!reply.ok) return null
  const expected = REPLY_BY_COMMAND[command]
  return reply.type === expected ? null : new ReplyMismatchError(command, expected, reply.type)
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
  // ⭐ ROUND-21 #1: a peek decodes and MIGRATES the same file the import would, so it is the same
  // one-time ~1.6s a 20-season save costs there. Budgeted with its twin, not with the reads.
  'peekSave',
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
    // R2-05: the reply is checked against the command that asked for it BEFORE it can resolve, so a
    // mispaired reply is a typed rejection rather than a value the caller reads the wrong fields off.
    // ⚠ The generation and timer bookkeeping above is untouched and stays FIRST: a mismatch settles
    // this one request, exactly like a serialization failure does, and leaves the worker serving.
    const mismatch = replyMismatch(p.command, e.data)
    if (mismatch) {
      p.reject(mismatch)
      return
    }
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

/**
 * Send one command and get back THE reply that command answers with (R2-05 / TB-06 / PR-07).
 *
 * The return type is `ReplyFor<K>` – `K`'s own ok arm, plus the single failure arm – rather than the
 * `ToUI` union of every reply this used to hand back. So `request({ type: 'advance', … })` resolves
 * to a snapshot-or-error and `request({ type: 'save', … })` to a slots-or-error, and reading
 * `.snapshot` off the second is a compile error instead of `undefined` at runtime.
 *
 * ⚠ `K` IS INFERRED FROM THE `type` FIELD OF THE ARGUMENT and nothing else has to be spelled out at
 * the call site – every existing `request({ type: '…', … })` call is unchanged source text. Passing a
 * value of the whole `WorkerRequest` union still works and degrades honestly: `K` widens to every
 * command and the result widens back to `ToUI`.
 */
export function request<K extends ToWorker['type']>(
  msg: WorkerRequest & { type: K },
  transfer: Transferable[] = [],
): Promise<ReplyFor<K>> {
  const id = nextId++
  const full = { ...msg, id } as ToWorker
  return new Promise<ReplyFor<K>>((resolve, reject) => {
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
    // ⚠ THE ONE WIDENING IN THE WHOLE CORRELATION, and it is where the correlation is ESTABLISHED
    // rather than assumed. `postMessage` delivers a bare `ToUI`; only `REPLY_BY_COMMAND` says which
    // arm belongs to this command, and `replyMismatch` above enforces exactly that before this
    // resolve is ever called – so the promise cannot settle with an arm `ReplyFor<K>` excludes.
    pending.set(id, { resolve: resolve as (m: ToUI) => void, reject, command: msg.type, generation: gen, timer })
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
