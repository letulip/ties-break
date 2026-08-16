// THE AGE CLOCK'S COST, MEASURED IN ONE PROCESS – because a test runner on a busy machine cannot
// answer this question (16.08).
//
// ⚠ WHY THIS TOOL EXISTS AT ALL, and it is a method note worth keeping. P2's birthday-to-birthday
// window turned the age clock into a hot path, and the symptom was the unit suite going from 74s to
// 1877s with SIXTEEN files timing out and ZERO assertion failures. That shape is indistinguishable
// from the machine-contention hazard CLAUDE.md records – and this machine really was contended
// (`mobileassetd` at 143% for three hours, load average 113), so every wall-clock reading taken that
// afternoon was measuring both effects at once. Two different verdicts were reached and discarded
// before this tool was written.
//
// SO THE MEASUREMENT IS COUNTED, NOT TIMED. `Date` is instrumented and the tool reports how many
// allocations one career of weeks costs. An allocation count is the same number on an idle laptop and
// on a thrashing one; it is the quantity that actually drives the GC pressure the suite was dying of;
// and it can be compared across commits without a quiet machine, which is what was needed.
//
//     npx vite-node tools/age-clock-cost.ts [--weeks N]

import { createWorld, tickWeek } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const argOf = (name: string, fallback: number): number => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  const next = process.argv[process.argv.indexOf(`--${name}`) + 1]
  const raw = hit ? hit.split('=')[1] : next
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const WEEKS = argOf('weeks', 260)

// The instrument: every `new Date(...)` in the process, counted. `src/shared/dates.ts` is the only
// engine module that constructs one (invariant: no bare `new Date()` in engine code), so this counts
// calendar reads and nothing else.
let dateCalls = 0
const RealDate = Date
class CountingDate extends RealDate {
  constructor(...args: [] | [number] | [string] | [number, number, number?, number?, number?, number?, number?]) {
    dateCalls++
    // A transparent proxy of every arity `dates.ts` uses – it only ever calls `new Date(utc)`.
    super(...(args as [number]))
  }
}
;(globalThis as { Date: DateConstructor }).Date = CountingDate as unknown as DateConstructor

const world = createWorld('age-clock-cost', DEFAULT_PROFILE, 'middle')
// `resumeMain(world.rngMain)`, not `rngFromSeed(world.seed)` – the world's OWN persisted MAIN
// position, which is the rule every tool that drives a real career here obeys.
const rng = resumeMain(world.rngMain)
const startedAt = process.hrtime.bigint()
for (let i = 0; i < WEEKS; i++) tickWeek(world, rng)
const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6
;(globalThis as { Date: DateConstructor }).Date = RealDate

console.log('')
console.log(`AGE CLOCK COST · ${WEEKS} weeks of one career · seed age-clock-cost`)
console.log('')
console.log(`  Date allocations   ${dateCalls.toLocaleString('en-GB')}`)
console.log(`  ...per week        ${Math.round(dateCalls / WEEKS).toLocaleString('en-GB')}`)
console.log(`  wall              ${(elapsedMs / 1000).toFixed(1)}s   <- CONTENDED, read the count instead`)
console.log(`  reached week      ${world.week}${world.ending ? ` (ended: ${world.ending.type})` : ''}`)
console.log('')
