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
