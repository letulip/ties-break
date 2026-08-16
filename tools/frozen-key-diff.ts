// PER-KEY HASHES OF ONE FROZEN CAREER – the diff `tests/coach-travel-edge.test.ts` demands before
// any of its three hashes may be re-frozen.
//
// Its protocol, in its own words: re-freezing without the per-key check "would have been the exact
// defect the file exists to catch". So this walks the same career the test walks and prints a hash
// per top-level key of the world; run it on both trees and diff the output, and what moved is named
// rather than assumed.
//
//     npx vite-node tools/frozen-key-diff.ts [--preset 0] [--policy 1]

import { createHash } from 'node:crypto'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'

const argOf = (name: string, fallback: number): number => {
  const next = process.argv[process.argv.indexOf(`--${name}`) + 1]
  const n = Number(next)
  return Number.isFinite(n) ? n : fallback
}

const PRESET = argOf('preset', 0)
const POLICY = argOf('policy', 1)
const FREEZE_WEEKS = 156

const { world, rng } = openCareer(PRESETS[PRESET], 0, POLICIES[POLICY])
for (let w = 0; w < FREEZE_WEEKS; w++) stepCareerWeek(world, rng, POLICIES[POLICY])

const record = world as unknown as Record<string, unknown>
console.log(`# preset ${PRESET} policy ${POLICY} weeks ${FREEZE_WEEKS}`)
for (const key of Object.keys(record).sort()) {
  const h = createHash('sha256').update(JSON.stringify(record[key] ?? null)).digest('hex').slice(0, 12)
  console.log(`${h}  ${key}`)
}
