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
