// SCRATCH READER (21.09) – the owner's question: what happened to Alice after the Slam at 19?
// Derived rows only, decodeExportFile per the house law. Not committed until asked.
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidAgeYears } from '../src/engine/world/age'

async function main() {
  const w = (await decodeExportFile(new Uint8Array(readFileSync(process.argv[2])))) as WorldState
  const age = (week: number) => (13 + (week - 0) / 52).toFixed(1) // display grain
  const ageY = (week: number) => kidAgeYears(week, w.profile.birthMonth, w.profile.birthDay)

  console.log('== titles and finals, tier · week · age ==')
  for (const m of w.milestones) {
    if (m.type === 'title' || m.type === 'final') {
      console.log(`${m.type.padEnd(5)} ${String(m.tier ?? '?').padEnd(7)} w${m.week} · age ${ageY(m.week)} (${age(m.week)})`)
    }
  }
  console.log('\n== trophiesByTier (big tiers) ==')
  for (const t of ['wta250', 'wta500', 'wta1000', 'slam'] as const) {
    const row = (w.trophiesByTier as Record<string, unknown>)[t]
    console.log(`${t}: ${JSON.stringify(row)}`)
  }
  console.log('\n== knocks, part · from(age) · weeks out ==')
  for (const k of w.knockHistory) {
    const kk = k as unknown as { part?: string; sinceWeek: number; untilWeek?: number | null; choice?: string }
    const len = kk.untilWeek != null ? kk.untilWeek - kk.sinceWeek : null
    console.log(`${String(kk.part ?? '?').padEnd(16)} w${kk.sinceWeek} · age ${ageY(kk.sinceWeek)} · ${len != null ? len + 'w' : 'open'} · ${kk.choice ?? ''}`)
  }
  console.log('\n== season-rank milestones ==')
  for (const m of w.milestones) if (m.type === 'season-rank') console.log(`S${m.seasonIndex} rank ${m.rank}`)
}
main().catch(e => { console.error(e); process.exit(1) })
