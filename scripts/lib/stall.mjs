// TELLING A STALLED RUNNER APART FROM A FAILED TEST – shared by scripts/units.mjs and
// scripts/sim.mjs, because it was written twice and the second copy is how a rule drifts.
//
// THE FAILURE MODE. birpc's `DEFAULT_TIMEOUT` is 6e4 and nothing in vitest's config can raise it
// (traced through `createForksRpcOptions`; `.github/workflows/simulation.yml` says the same). When a
// worker holds a core past 60 s of wall the reporter's `onTaskUpdate` call times out, and vitest
// prints its summary, reports EVERY TEST GREEN, and exits 1:
//
//     Test Files  1 passed (1) · Tests  61 passed (61) · Errors  1 error
//     Error: [vitest-worker]: Timeout calling "onTaskUpdate"        -> exit 1
//
// That is the worst possible shape for a quality signal: the number a script reads disagrees with
// the number a human reads, and a gate that does that teaches everyone to ignore it.
//
// ⚠ AND IT IS NOT A LOCAL QUIRK. Both readings that produced this module came from a runner rather
// than from a defect: the sim project on a Mac under agent contention (the same tree read 18 s and
// 917 s for one file half an hour apart), and the UNIT project on CI, where the `radar` shard passed
// 61 of 61 in 62.63 s and exited 1. No single test is near the wall in either project – the longest
// in `radar` is 16.1 s and the longest in `econ-bench` is 16.2 s – so there is nothing to split and
// nothing to optimise. The suites are the right size; the machines vary.
//
// WHAT THIS MODULE DOES, AND THE LINE IT WILL NOT CROSS. It classifies. A run whose own summary says
// zero failed tests but whose exit code is non-zero is an INFRASTRUCTURE outcome and may be retried
// once. A run with a failing assertion is a FAILURE, is never retried, and always ends the gate.
// Retrying real failures would be the actual sin here, and the classifier is what makes the
// difference mechanical instead of a judgement call at the call site.
//
// ⚠ READ OFF VITEST'S OWN SUMMARY, NOT OFF THE TIMEOUT TEXT, which varies between versions and
// transports. And a run that printed NO summary at all – a runner that died before reporting – is
// classified as a real failure, which is the safe direction: silence must never read as green.

/** What vitest itself says happened, independent of the exit code. `null` when it said nothing. */
export function summaryOf(output) {
  const tests = output.match(/Tests\s+(.+)/)
  const files = output.match(/Test Files\s+(.+)/)
  if (!tests && !files) return null
  const line = `${tests?.[1] ?? ''} ${files?.[1] ?? ''}`
  return { failedTests: /\d+\s+failed/.test(line), line: line.trim() }
}

/** `{ stalled, failed }` for one finished run. Exactly one can be true; both false means green. */
export function classify(status, output) {
  if (status === 0) return { stalled: false, failed: false }
  const summary = summaryOf(output)
  // No summary => the runner died before reporting => treat as a real failure.
  if (summary === null) return { stalled: false, failed: true }
  return { stalled: !summary.failedTests, failed: summary.failedTests }
}

/** The sentence printed for a stall that a retry cleared. Shared so both gates say the same thing –
 *  and it is printed even though the run goes on to pass, because a gate that quietly retries a
 *  machine falling over rebuilds the same lie one level down. */
export function recoveredNote(label, firstSecs) {
  return (
    `\n  ⚠ ${label} stalled at ${firstSecs}s with every test green, and passed on the retry.` +
    `\n    That is the runner, not a defect – but a machine that does it often is a finding of its` +
    `\n    own. Check load and swap before trusting any timing figure from this run.`
  )
}

// ⚠⚠ 13.09 – THE LATE ACK, told apart from the wedge, and the day that forced the distinction.
// Deploy runs #135 and #137 (and #136's first attempt) went red on the bulk pool with EVERY test
// green – and the durations said nothing ever hung: 692 s and 682 s against a healthy run's 681 s.
// The pool ran to completion; ONE reporter ack crossed birpc's unraisable 60 s window somewhere
// inside ~11 minutes of saturated workers; vitest logged it as an unhandled error and exited 1.
// `classify` correctly calls that shape infrastructure – but the retry it prescribes re-rolls the
// same ~11-minute dice, and on a day when the odds are bad the gate burns 23 minutes to report a
// cosmetic timeout twice. The radar law (a shard that stalls twice is OVER the wall and its FILE
// must be cut) still holds where a file IS the unit – the heavy shards – and unit-bulk keeps it
// for every OTHER shape too. The leniency below exists ONLY for the shape the buffer itself can
// prove harmless.
//
// ⚠ AND IT READS THE ERROR TEXT DELIBERATELY, where the header above says classification must
// not. The header's concern is version drift making STALL DETECTION miss – failing unsafe. This
// check runs the OTHER way: it must prove every unhandled error is vitest's own transport
// timeout before it may be LENIENT, so an unrecognised text falls back to the strict path.
// Version drift here fails SAFE: unknown error shapes never read as green.

/** vitest's own worker-RPC timeout – the one error a green suite may carry and still be green.
 *  The family is `Timeout calling "onTaskUpdate"` / `"onCollected"` / …, always stamped
 *  `[vitest-worker]`. Nothing an app's own code throws wears that prefix. */
const INFRA_ACK_ERROR = /\[vitest-worker\]: Timeout calling "on[A-Za-z]+"/g

/** TRUE only when the buffer PROVES the run's unhandled errors are all birpc late acks: vitest's
 *  own count line is present, and at least that many infra-stamped timeout lines exist. A foreign
 *  unhandled error (a real defect in app code) makes the count exceed the infra matches and the
 *  verdict falls back to strict. No count line (a runner that died mid-report) is strict too –
 *  silence must never read as green, the module's standing law. */
export function lateAckOnly(output) {
  const caught = output.match(/Vitest caught (\d+) unhandled errors? during the test run/)
  if (!caught) return false
  const n = Number(caught[1])
  if (!(n >= 1)) return false
  const infra = output.match(INFRA_ACK_ERROR)?.length ?? 0
  return infra >= n
}

/** The sentence for an accepted late ack – loud on purpose: a gate that quietly forgives a
 *  timeout rebuilds the recoveredNote lie one level down. Printed once per accepted shard. */
export function lateAckNote(label, secs) {
  return (
    `\n  ⚠ ${label} finished green in ${secs}s and exited non-zero on birpc's own late ack –` +
    `\n    every unhandled error in the buffer is vitest's transport timeout, none is the app's.` +
    `\n    Accepted as green without a retry. If this line becomes a regular guest, the pool is` +
    `\n    living on the 60 s wall and the next step is fewer workers per core, measured` +
    `\n    (scripts/heavy-tests.mjs carries the prescription) – never fewer tests.`
  )
}
