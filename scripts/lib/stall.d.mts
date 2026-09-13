// Types for scripts/lib/stall.mjs. The module stays plain ESM JS so the two shard scripts
// (`scripts/units.mjs`, `scripts/sim.mjs`) can import it on any Node without a TS loader; since
// 13.09 `tests/units-stall-classifier.test.ts` imports it too – the first TYPECHECKED importer –
// so it needs a declaration: the same arrangement as scripts/heavy-tests.d.mts one level up
// (vue-tsc red TS7016 on the deploy dispatch of the fix branch is what forced it, honestly).

/** What vitest itself says happened, independent of the exit code. `null` when it said nothing. */
export declare function summaryOf(output: string): { failedTests: boolean; line: string } | null

/** `{ stalled, failed }` for one finished run. Exactly one can be true; both false means green. */
export declare function classify(status: number | null, output: string): { stalled: boolean; failed: boolean }

/** The sentence printed for a stall that a retry cleared. */
export declare function recoveredNote(label: string, firstSecs: string | number): string

/** TRUE only when the buffer PROVES the run's unhandled errors are all birpc late acks – vitest's
 *  own count line present, and at least that many `[vitest-worker]` timeout lines. Foreign error
 *  shapes and silence both read strict, never green. */
export declare function lateAckOnly(output: string): boolean

/** The loud sentence for an accepted late ack – printed once per accepted shard. */
export declare function lateAckNote(label: string, secs: string | number): string
