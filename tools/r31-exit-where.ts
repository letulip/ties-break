/** r31 #5b – WHERE she dies: finish histogram, and the same split by tier. MEASUREMENT ONLY. */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { TIERS } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'

const argv = process.argv.slice(2)
const world = (await decodeExportFile(
  new Uint8Array(readFileSync(argv[argv.indexOf('--save') + 1])),
)) as WorldState

const ROUND = ['TITLE', 'final', 'semi', 'quarter', 'R16', 'R32', 'R64']
const rows: { tier: string; label: string; round: string; draw: number }[] = []
for (const r of world.results) {
  if (r.playerId !== KID_ID || !r.tier || r.mandatoryMiss) continue
  const t = TIERS[r.tier as keyof typeof TIERS]
  const i = t?.points.indexOf(r.points) ?? -1
  if (i < 0) continue
  // index 0 = title; the LAST index is the loss in her first match at that event.
  const fromTop = i
  rows.push({
    tier: r.tier,
    label: t.label,
    round: fromTop === 0 ? 'TITLE' : (ROUND[fromTop] ?? `-${fromTop}`),
    draw: t.drawSize,
  })
}

const hist = new Map<string, number>()
rows.forEach((r) => hist.set(r.round, (hist.get(r.round) ?? 0) + 1))
console.log('\nWHERE SHE FINISHED, all recorded entries\n')
for (const k of ['TITLE', 'final', 'semi', 'quarter', 'R16', 'R32', 'R64']) {
  if (hist.has(k)) console.log(`${k.padEnd(9)} ${hist.get(k)}`)
}

const byTier = new Map<string, { n: number; lostFirst: number }>()
for (const r of rows) {
  if (!byTier.has(r.label)) byTier.set(r.label, { n: 0, lostFirst: 0 })
  const b = byTier.get(r.label)!
  b.n++
  const t = TIERS[r.tier as keyof typeof TIERS]
  if (r.round === (ROUND[t.points.length - 1] ?? '')) b.lostFirst++
}
console.log('\nBY TIER (entries / lost her first match there)\n')
for (const [label, b] of [...byTier].sort((a, c) => c[1].n - a[1].n)) {
  console.log(`${label.padEnd(24)} ${b.n}\t${b.lostFirst}`)
}
