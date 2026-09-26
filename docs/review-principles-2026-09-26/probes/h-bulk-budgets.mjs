#!/usr/bin/env node
// Lane H probe (26.09 review, baseline 03d92221). Read-only.
// Which `unit`-project test files run in the BULK pool (not in HEAVY_UNIT_FILES / HEAVY_SIM_FILES,
// not under tests/component/) yet declare a per-test or per-hook budget of 60 s or more – the
// `testTimeout: N` / `timeout: N` / `}, N)` idioms. 60 s is birpc's per-RPC window, so such a budget
// cannot be spent by a synchronous test in any vitest worker; in the bulk pool it also shares ten cores.
// Usage (repo root): node h-bulk-budgets.mjs
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
