// ⚠⚠ NO SOCKET LEAVES THE COMPONENT PROJECT – P-17, 05.09 review.
//
// WHAT WAS HAPPENING. `src/audio/sfx.ts` probes a cue's existence with
// `await fetch(url, { method: 'HEAD', cache: 'no-store' })` before it ever hands the URL to an
// `<audio>` element – a deliberate design, and the right one: a `fetch` 404 does not print to the
// devtools console the way an `<audio src>` 404 does, so the probe is what keeps a player's console
// clean with no mp3 files present. Under happy-dom the document's base URL is
// `http://localhost:3000/`, so `urlFor()` resolves to an ABSOLUTE http URL and node's real `fetch`
// opens a real TCP connection to 127.0.0.1:3000 from a unit test.
//
// Measured on the review's gate run: 18 `AggregateError` blocks
// (`connect ECONNREFUSED ::1:3000` / `connect ETIMEDOUT 127.0.0.1:3000`) occupying 474 of the run's
// 1,296 output lines, from 17 distinct component test files. Nothing was ever RED – `probe()`
// catches, records the file as failed and returns null, which is the correct behaviour – so this is
// log noise plus one connect attempt per mount. ⚠ AND IT GETS WORSE, NOT BETTER, WHEN SOMETHING IS
// LISTENING ON 3000: the owner's live stand is a dev server, and a probe that CONNECTS waits for a
// response instead of being refused in a microsecond.
//
// ⚠ WHY THE STUB IS ON `fetch` AND NOT ON `src/audio/sfx.ts`. Two reasons, and the second is the
// one that decided it. (1) `src/audio/sfx.ts` is the ONLY `fetch(` in the whole of `src/` – measured
// with `git grep 'fetch(' -- src` – so stubbing the global is exactly as narrow as aliasing that
// module, and narrower than it looks. (2) An alias would replace the module, so every mounted test
// would be exercising a stub instead of the real `probe()` / `failed` / `pending` bookkeeping; this
// leaves all of that running and changes only what the network answers. Eight component files
// already `vi.mock('../../src/audio/sfx', …)` by hand for their own reasons, and those keep working
// unchanged – a module mock takes precedence over anything here.
//
// ⚠ AND IT REJECTS RATHER THAN ANSWERING 404, because a rejected fetch is EXACTLY what the sockets
// were producing: `probe()`'s `catch` adds the file to `failed` and returns null. So no mounted
// component behaves differently after this than before it – the same branch runs, without the
// socket. A future component that genuinely needs a network answer will fail loudly here, naming
// the URL, instead of hanging until a connect times out; there is no network in this project and
// saying so out loud is the point.

const target = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

globalThis.fetch = ((input: RequestInfo | URL): Promise<Response> =>
  Promise.reject(
    new TypeError(
      `component project: there is no network here – refused ${target(input)}. ` +
        'See tests/component/setup.ts (P-17). If a component now NEEDS a response, mock it in that file.',
    ),
  )) as typeof fetch

// =================================================================================================
// ⚠⚠ THE MEMORY-STORAGE SHIM LIVES HERE NOW – AND IT IS EXPORTED, NEVER INSTALLED (F-03 / T5.10,
// 27.09).
//
// WHAT IT IS FOR. `localStorage` is undefined in this runner, so any component that reads it at
// setup dies on the read. Fourteen lines of in-memory `Storage` is the fix, and supplying the
// browser's own object is right rather than weakening a component to suit the runner – the argument
// is written out in full in `round20-ui.test.ts` and `a11y-sweep.test.ts`. Measured 27.09: **68 of
// this directory's 236 test files carry a copy** of those fourteen lines (the 26.09 review hashed 57
// files then, 53 of them byte-identical and 4 variants), which is ~950 lines of duplicated volume
// and 68 edits the day the contract gains `key()`, a quota throw or an `entries()`.
//
// ⚠ AND THE REASON IS NOT THE ONE THOSE 68 COPIES GIVE. They all say some version of «happy-dom is
// configured here without web storage». Measured while writing the pair below: happy-dom supplies
// both, and `sessionStorage` IS here, a real `Storage` (happy-dom 20.11, vitest 3.2.7). What removes
// `localStorage` is NODE – its own experimental global under Node 26.5, which announces itself:
// «localStorage is not available because --localstorage-file was not provided». It is an own property
// of `globalThis` holding `undefined`, which is exactly why `Object.defineProperty` with
// `configurable: true` is the shape that installs over it. `storage-shim-scope.test.ts` pins that
// asymmetry so a runner upgrade that starts supplying it cannot pass unnoticed.
//
// ⚠⚠ AND IT IS NOT INSTALLED BY THIS FILE, WHICH IS THE WHOLE POINT. `setupFiles` runs for ALL 236
// component files, so a top-level install here would hand the shim to the **168 that run today with
// no web storage at all** – and those files are not merely indifferent to it. At least two REASON
// FROM THE ABSENCE in prose: `r47-raise-another-route.test.ts:193-198` («`localStorage` is undefined
// here … `useDeviceFlag` reads false and its write throws and is swallowed – there is nothing to spy
// on»), which is why its tour arm was rewritten to watch the flag's in-memory half after a
// spy-based arm scored 0 on the mutation, and `prologue-two-paths.test.ts`, which records the same.
// A global install would make 168 files pass for a NEW REASON, and «still green» is exactly what
// that looks like from the outside. The review's own verification says so: «a migration must scope
// the install or audit those files».
//
// So the rule is: **a file that wants storage says so**, in one import and one call, in place of its
// fourteen lines. A file that says nothing keeps the absence it was written against.
//
// ⚠ EACH CALLER GETS ITS OWN MAP, and that is a property of the runner rather than of this code:
// setup files and their imports are evaluated per TEST FILE, so nothing here is shared between
// files and no `beforeEach` has to defend against another file's leftovers. Within one file, the
// returned handle IS the shared map – `backing.clear()` in a `beforeEach` is the intended use.
//
// ⚠ THE SCOPE IS PROVEN, NOT ASSERTED. `storage-shim-scope.test.ts` imports this module, opts OUT,
// and asserts `localStorage` is still absent; `storage-shim-optin.test.ts` opts IN and asserts the
// contract. The named mutation is «make the shim global»: call `installMemoryStorage()` at this
// file's top level, and the opt-out file goes red by itself. A setup file cannot have a mounted
// test, so that pair is the net.

/** The handle `installMemoryStorage` hands back: the map behind the storage, and the one knob. */
export type MemoryStorage = {
  /** The backing map. `backing.clear()` in a `beforeEach`, or read what a component wrote. */
  readonly backing: Map<string, string>
  /** `'throws'` makes it a private-mode browser – reads raise `SecurityError`, writes
   *  `QuotaExceededError`, the exact pair `career-watermarks.test.ts` measured – and it is meant to
   *  be flipped mid-test (`store.mode = 'throws'`). `removeItem`, `clear` and `key` do NOT throw,
   *  which is that file's shape too, not an oversight. */
  mode: 'ok' | 'throws'
}

/** Install an in-memory `localStorage` for THIS test file. Opt-in by design – see the block above. */
export function installMemoryStorage(options: { mode?: 'ok' | 'throws' } = {}): MemoryStorage {
  const store: MemoryStorage = { backing: new Map<string, string>(), mode: options.mode ?? 'ok' }
  const backing = store.backing
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => {
        if (store.mode === 'throws') throw new DOMException('The operation is insecure.', 'SecurityError')
        return backing.has(k) ? backing.get(k)! : null
      },
      setItem: (k: string, v: string) => {
        if (store.mode === 'throws') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
        backing.set(k, String(v))
      },
      removeItem: (k: string) => void backing.delete(k),
      clear: () => backing.clear(),
      key: (i: number) => [...backing.keys()][i] ?? null,
      get length() {
        return backing.size
      },
    },
  })
  return store
}
