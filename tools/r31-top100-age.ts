/** r31 #10 – our top-100's age profile against the real WTA reference. MEASUREMENT ONLY. */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { rankingFor, fieldProsOf } from '../src/engine/world/ladder'
import { FIELD } from '../src/engine/season/fieldPros'
import { kidAgeAt } from '../src/engine/world/age'
import { KID_ID } from '../src/engine/world/constants'

const w = (await decodeExportFile(
  new Uint8Array(readFileSync(process.argv.slice(2).find((a) => a.endsWith('.tsave'))!)),
)) as WorldState

const ageOf = new Map<string, number>()
for (const p of w.cohort) ageOf.set(p.id, p.ageYears)
for (const p of fieldProsOf(w)) ageOf.set(p.id, (p as unknown as { ageYears: number }).ageYears)
ageOf.set(KID_ID, kidAgeAt(w, w.week))
console.log(`FIELD.career: ${JSON.stringify(FIELD.career)}`)
console.log(`FIELD.ageBand: ${JSON.stringify(FIELD.ageBand)}`)

const ranking = rankingFor(w, 'wta')
const top = (n: number) =>
  ranking.slice(0, n).map((r) => ageOf.get(r.playerId)).filter((a): a is number => a !== undefined)

const stat = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y)
  const mean = s.reduce((p, c) => p + c, 0) / s.length
  return `n=${s.length}  mean ${mean.toFixed(1)}  median ${s[Math.floor(s.length / 2)]}  range ${s[0]}..${s[s.length - 1]}`
}
console.log(`\nweek ${w.week}\n`)
console.log(`top 10 : ${stat(top(10))}`)
console.log(`top 20 : ${stat(top(20))}`)
console.log(`top 50 : ${stat(top(50))}`)
console.log(`top 100: ${stat(top(100))}`)

// where the top 100's ages actually sit
const buckets = new Map<string, number>()
for (const a of top(100)) {
  const k = a < 20 ? '<20' : a < 23 ? '20-22' : a < 26 ? '23-25' : a < 29 ? '26-28' : a < 32 ? '29-31' : '32+'
  buckets.set(k, (buckets.get(k) ?? 0) + 1)
}
console.log('\ntop-100 age distribution')
for (const k of ['<20', '20-22', '23-25', '26-28', '29-31', '32+']) {
  if (buckets.has(k)) console.log(`  ${k.padEnd(6)} ${'#'.repeat(buckets.get(k)!)} ${buckets.get(k)}`)
}
console.log('\nREAL WTA REFERENCE (owner\'s research): mean age of top 100 = 25-27; peak window 24-26 direct, 25-28 via college.')
