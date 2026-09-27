#!/usr/bin/env node
// Lane H probe (26.09 review, baseline 03d92221). Read-only.
// Which `unit`-project test files run in the BULK pool (not in HEAVY_UNIT_FILES / HEAVY_SIM_FILES,
// not under tests/component/) yet declare a per-test or per-hook budget of 60 s or more – the
// `testTimeout: N` / `timeout: N` / `}, N)` idioms. 60 s is birpc's per-RPC window, so such a budget
// cannot be spent by a synchronous test in any vitest worker; in the bulk pool it also shares ten cores.
// Usage (repo root): node h-bulk-budgets.mjs
//
// ⚠⚠ NOTE ADDED 27.09.2026 (T5.3, which executed H-06) – AND THIS PROBE IS DELIBERATELY NOT CORRECTED.
// It is the review's dated record of how H-06's own numbers were produced, and editing it would make
// those numbers unreproducible from their own instrument, which is worse than a blind probe with a sign
// on it. The sign is this block. **The authority is now the committed gate,
// `tests/sim-serialisation.test.ts` («no bulk-pool test declares a budget above birpc's window»), which
// is mutation-verified and runs on every unit pass.** Two blind spots, both found while executing H-06:
//
// 1. PROSE IS READ AS A DECLARATION. The regex below matches `testTimeout: N` and `}, N)` wherever they
//    appear, including inside comments. It has no effect on H-06's headline figures – those counted
//    budgets ABOVE 60 s, and no comment in the corpus quoted one – but it inflated two counts T5.3
//    reported from this probe while deleting the at-the-ceiling declarations: «42 still at exactly 60 s,
//    in 14 files» is really **40 in 13**. One was the gate file's own header quoting the ceiling, one was
//    prose in `wave5-psychologist-recovery.test.ts`. ⚠ The hazard grows rather than shrinks from here,
//    because every one of T5.3's 43 dated notes quotes the budget it removed: a note recording a 300 s
//    override would be reported by this probe as a 300 s override.
// 2. NO TEST/HOOK ATTRIBUTION. It takes the MAXIMUM budget per file and never asks which call a
//    `}, N)` closes – so a `beforeAll` budget reads as a test budget. The review caught that by hand
//    (its H-06 verification note deducts `round34-reachable-ceiling`, «so test-level overrides above
//    60 s are 30»), which is the right answer and not a repeatable one. Doing it mechanically is what
//    found the case the hand pass could not have: `tests/save-doors-fuzz.test.ts:675` closes a
//    `beforeAll` **114 lines** after it opens, and T5.3's first classifier – an 80-line proximity walk –
//    called it a test budget. That budget is a 6x raise over vitest's own 10 s `hookTimeout` default
//    (this project sets none) and its note records the measurement behind it, so deleting it would have
//    put a hook that needs 60 s back on 10. The gate now matches the parenthesis instead of guessing,
//    and pins the 114-line case. That is why the at-the-ceiling set was **39 in 12 files**, not 40 in 13.
//
// The counts H-06 itself states – 348 bulk-pool files, 42 at 60 s or more, 31 above it, 30 of those
// test-level – are unchanged and still reproduce from this file as written.
import { HEAVY_UNIT_FILES, HEAVY_SIM_FILES } from '../../../scripts/heavy-tests.mjs'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const heavy = new Set([...HEAVY_UNIT_FILES, ...HEAVY_SIM_FILES].map((f) => f.replace(/^\.\//, '')))
const files = execSync("git ls-files 'tests/*.test.ts'").toString().trim().split('\n')
  .filter((f) => !f.startsWith('tests/component/') && !heavy.has(f))
const out = []
for (const f of files) {
  const s = readFileSync(f, 'utf8')
  const budgets = [...s.matchAll(/(testTimeout|hookTimeout|timeout)\s*:\s*([0-9_]+)|\},\s*([0-9_]{5,})\s*\)/g)]
    .map((m) => Number((m[2] || m[3]).replace(/_/g, '')))
  const max = Math.max(0, ...budgets)
  if (max >= 60_000) out.push([max, f])
}
out.sort((a, b) => b[0] - a[0])
console.log(`bulk-pool unit files: ${files.length}; declaring a budget >= 60 s: ${out.length}`)
for (const [ms, f] of out) console.log(`${ms / 1000} s  ${f}`)
console.log(`HEAVY_UNIT_FILES ${HEAVY_UNIT_FILES.length}, HEAVY_SIM_FILES ${HEAVY_SIM_FILES.length}`)
