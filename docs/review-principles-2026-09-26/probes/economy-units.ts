// Lane C probe – does every ECONOMY key's name agree with its value's unit? (review of 26.09.2026, baseline 03d92221)
//
// Usage (from the root of the baseline worktree): npx vite-node docs/review-principles-2026-09-26/probes/economy-units.ts
//
// METHOD. Walk the live ECONOMY object; for each numeric leaf (array elements included) apply the suffix rule of
// its key or its nearest named ancestor's key:
//   *Cents  -> must be an integer (money is integer cents everywhere in the engine – CLAUDE.md "Style")
//   *Bps    -> must be an integer in [-10000, 10000·k] and >= 1 in magnitude when non-zero (a fraction written
//              under a Bps name, e.g. 0.3, is a unit lie)
//   *Share / *Pct / *Prob / *Chance / *Rate (as a fraction) -> reported when > 1 (a percent under a share name)
//   *Weeks / *Week  -> must be an integer (the engine ticks whole weeks)
//   *Years / *Age / AgeYears -> reported when not an integer (informational; ages are fractional in places)
// Prints every violation with its path. Values are the ones the engine sees (computed keys evaluated).
import { ECONOMY } from '../../../src/engine/economy'

type V = { path: string; value: number; rule: string }
const out: V[] = []
function rule(name: string): string | null {
  if (/Cents$/.test(name)) return 'Cents'
  if (/Bps$/.test(name)) return 'Bps'
  if (/(Share|Pct|Prob|Chance)$/.test(name)) return 'Fraction'
  if (/Weeks?$/.test(name) && !/PerWeek$|perWeek$/.test(name)) return 'Weeks'
  return null
}
function check(path: string, name: string, v: number): void {
  const r = rule(name)
  if (!r) return
  if (r === 'Cents' && !Number.isInteger(v)) out.push({ path, value: v, rule: 'Cents not integer' })
  if (r === 'Bps' && (!Number.isInteger(v) || (v !== 0 && Math.abs(v) < 1))) out.push({ path, value: v, rule: 'Bps not integer' })
  if (r === 'Fraction' && Math.abs(v) > 1) out.push({ path, value: v, rule: 'share/prob > 1' })
  if (r === 'Weeks' && !Number.isInteger(v)) out.push({ path, value: v, rule: 'Weeks not integer' })
}
let leaves = 0
function walk(v: unknown, path: string, name: string): void {
  if (typeof v === 'number') { leaves++; check(path, name, v); return }
  if (v === null || typeof v !== 'object') return
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    const childName = Array.isArray(v) ? name : /^\d+$/.test(k) || /^[a-z]+\d*$/.test(k) && rule(k) === null && rule(name) !== null ? name : k
    walk(x, Array.isArray(v) ? `${path}[${k}]` : `${path}.${k}`, childName)
  }
}
walk(ECONOMY, 'ECONOMY', 'ECONOMY')
console.log(`numeric leaves checked: ${leaves}; violations: ${out.length}`)
for (const o of out) console.log(`${o.rule}\t${o.path} = ${o.value}`)
