// THE ERROR RING – the last few things that went wrong in this tab, kept in memory for one job: so
// the feedback report (src/feedback.ts) can say what the app was choking on when the player pressed
// send. Nothing else reads it.
//
// ⚠ PRIVACY BY CONSTRUCTION (docs/specs/feedback-channel-2026-09.md, "No telemetry, asserted").
// This file has NO storage and NO network: the ring is a module-scope array, it dies with the tab,
// and no line here can write it to localStorage / IndexedDB or send it anywhere. It leaves the
// device only when the player presses send AND picks a recipient in the share sheet or the mail
// app. tests/feedback-f1.test.ts pins both halves – it reads this file's imports and spies on
// fetch / XHR / sendBeacon across every path.
//
// ⚠ APP-SIDE, NOT ENGINE. `src/engine`, `src/worker`, `src/db` and `src/shared` never import this
// (invariant 1 – and the read-the-imports arm of the test keeps the reverse honest: this file
// imports nothing at all). That is also why `at` is a plain `new Date().toISOString()`: invariant 2's
// ban on a bare `new Date()` binds ENGINE code, where a wall clock would break the deterministic
// replay. A diagnostic timestamp on the device clock, in a file the engine cannot reach, is exactly
// what the ban leaves alone. (The version line has no time source to reuse either – it prints two
// constants baked at build time.)
//
// ⚠ IT MUST NEVER THROW, and that is why `recordError` swallows its own failures. It runs INSIDE the
// global error handlers: an exception there is reported to `window.onerror` again, which calls this
// again – one bug becoming an endless loop of them. A lost diagnostic row costs nothing.

export type ErrorKind = 'error' | 'rejection'

export interface ErrorEntry {
  /** ISO timestamp on the device clock (see the header for why that is allowed here). */
  at: string
  kind: ErrorKind
  message: string
  /** The first three lines of the stack, joined with `\n`; absent when the thrown value had none. */
  stack?: string
}

/** How many entries the ring keeps – the spec's "~20 rows". The report reads the whole ring. */
export const ERROR_BUFFER_CAPACITY = 20

/** A rejection with a huge object in it must not turn the report into a novel. */
const MESSAGE_MAX = 300
const STACK_LINES = 3
const STACK_LINE_MAX = 200

const ring: ErrorEntry[] = []

/** Targets already wired, so a second `installErrorBuffer()` (HMR, a test, a careless caller) adds
 *  no second listener and every error is recorded exactly once. */
const wired = new WeakSet<EventTarget>()

function messageOf(value: unknown): string {
  if (typeof value === 'string') return value
  // Duck-typed on purpose: an Error thrown in another realm (an iframe, a worker) fails `instanceof`.
  if (typeof value === 'object' && value !== null) {
    const m = (value as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    // Circular structures, BigInts: `toString` on the prototype cannot throw.
    return Object.prototype.toString.call(value)
  }
}

function stackOf(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const s = (value as { stack?: unknown }).stack
  if (typeof s !== 'string' || s === '') return undefined
  return s
    .split('\n')
    .slice(0, STACK_LINES)
    .map((line) => line.trim().slice(0, STACK_LINE_MAX))
    .join('\n')
}

/** Push one row; the oldest falls off once the ring is full. `value` is whatever was thrown or
 *  rejected with – an Error, a string, anything. */
export function recordError(kind: ErrorKind, value: unknown): void {
  try {
    const entry: ErrorEntry = {
      at: new Date().toISOString(),
      kind,
      message: messageOf(value).slice(0, MESSAGE_MAX),
    }
    const stack = stackOf(value)
    if (stack !== undefined) entry.stack = stack
    ring.push(entry)
    while (ring.length > ERROR_BUFFER_CAPACITY) ring.shift()
  } catch {
    // See the header: an error handler that can throw is how one bug becomes a loop.
  }
}

/** Wire `window.onerror`'s hook (the `error` event) and `unhandledrejection`. Idempotent per target.
 *
 *  `addEventListener` rather than assigning `window.onerror`: assignment would replace a handler
 *  somebody else installed, and neither listener calls `preventDefault`, so the browser console
 *  still gets the error exactly as before. The `target` parameter is the test seam – the app calls
 *  it with no argument and gets `window`. */
export function installErrorBuffer(target: EventTarget = window): void {
  if (wired.has(target)) return
  wired.add(target)
  target.addEventListener('error', (ev) => {
    const e = ev as ErrorEvent
    // `error` is null for a cross-origin "Script error." – the message is all there is then.
    recordError('error', e.error ?? e.message)
  })
  target.addEventListener('unhandledrejection', (ev) => {
    recordError('rejection', (ev as PromiseRejectionEvent).reason)
  })
}

/** A copy of the ring, oldest first. Entries are copied too, so a caller cannot edit the ring. */
export function errorTail(): ErrorEntry[] {
  return ring.map((e) => ({ ...e }))
}
