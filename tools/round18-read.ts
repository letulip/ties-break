/**
 * round18-read – read the owner's save through the game's own import door and answer the round-18
 * items that only his career can answer: #9 (school still named at 21) and #7 (the season that made
 * her snap).
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVE IS PERSONAL AND IS NEVER COMMITTED, and neither is anything derived from one beyond the
 * aggregate facts quoted in docs/rounds/. Same rule as tools/round17-read.ts.
 *
 * Run:
 *   npx vite-node tools/round18-read.ts -- --save ~/Downloads/a.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { schoolEndWeek, schoolIsOver } from '../src/engine/kidLife'
import { kidAgeYears, kidAgeExact } from '../src/engine/world/age'
import { weekLabel } from '../src/shared/dates'
import { KID_ID } from '../src/engine/world/constants'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}

function section(title: string): void {
  console.log(`\n${'='.repeat(78)}\n${title}\n${'='.repeat(78)}`)
}

async function main(): Promise<void> {
  const i = process.argv.indexOf('--save')
  const path = i >= 0 ? process.argv[i + 1].replace('~', process.env.HOME ?? '') : ''
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
  const p = w.profile

  section('WHO AND WHEN')
  console.log(`week ${w.week} (${weekLabel(w.week)})  ·  schema v${(w as unknown as { version?: number }).version ?? '?'}`)
  console.log(`born ${p.birthDay}.${p.birthMonth}  ·  age exact ${kidAgeExact(w.week, p.birthMonth, p.birthDay).toFixed(2)}  ·  age years ${kidAgeYears(w.week, p.birthMonth, p.birthDay)}`)
  console.log(`funds ${money(w.fundsCents)}  ·  coachTier ${p.coachTier}  ·  coachId ${w.coachId ?? 'self'}`)

  section('#9 – THE SCHOOL CLOCK ON HIS SAVE')
  const end = schoolEndWeek(p.birthMonth)
  console.log(`schoolEndWeek(birthMonth=${p.birthMonth}) = ${end}  (${weekLabel(end)})`)
  console.log(`schoolIsOver(week ${w.week})               = ${schoolIsOver(w.week, p.birthMonth)}`)
  console.log(`her age at that week                      = ${kidAgeYears(end, p.birthMonth, p.birthDay)}`)
  console.log(`weeks since school ended                  = ${w.week - end}`)

  section('#7 – THE SEASON THAT MADE HER SNAP')
  // ⚠ `world.results` is the WHOLE COHORT's ledger, not hers – filter by playerId or the counts are
  // the field's. (My first pass did not, and reported 2221 "her" results in one season.)
  const season = Math.floor(w.week / WEEKS_PER_YEAR)
  const from = season * WEEKS_PER_YEAR
  const hers = (w.results ?? []).filter((r) => r.playerId === KID_ID)
  const inSeason = hers.filter((r) => r.week >= from)
  console.log(`season index ${season}, weeks ${from}-${w.week}: ${inSeason.length} of her results (career ${hers.length})`)
  const byTier: Record<string, { n: number; points: number; scored: number }> = {}
  for (const r of inSeason) {
    const t = r.tier ?? '?'
    byTier[t] ??= { n: 0, points: 0, scored: 0 }
    byTier[t].n += 1
    byTier[t].points += r.points
    byTier[t].scored += r.points > 0 ? 1 : 0
  }
  for (const [t, v] of Object.entries(byTier).sort((a, b) => b[1].points - a[1].points)) {
    console.log(`  ${t.padEnd(10)} entries ${String(v.n).padStart(2)}  scored ${String(v.scored).padStart(2)}  points ${String(v.points).padStart(5)}`)
  }
  const misses = inSeason.filter((r) => r.mandatoryMiss === true)
  console.log(`\n  mandatory misses this season: ${misses.length}`)

  section('#7 – THE BIG DRAWS: WHAT THEY ASKED AND WHAT THEY GAVE')
  const big = inSeason.filter((r) => ['slam', 'wta1000', 'wta500'].includes(r.tier ?? ''))
  for (const r of big) {
    console.log(`  ${weekLabel(r.week).padEnd(9)} ${(r.tier ?? '').padEnd(8)} points ${String(r.points).padStart(4)}${r.mandatoryMiss ? '   (skipped – zero takes a slot)' : ''}`)
  }
  const bigPts = big.reduce((s, r) => s + r.points, 0)
  console.log(`\n  ${big.length} big entries · ${big.filter((r) => r.points > 0).length} that scored · ${bigPts} points`)

  section('#7 – THE ANGER, AS THE ENGINE RECORDED IT')
  const streak = (w as unknown as { lossStreak?: { losses: number; startWeek: number; angerAt: number } | null }).lossStreak
  console.log(`loss streak now: ${streak ? `${streak.losses} since ${weekLabel(streak.startWeek)}, anger at ${streak.angerAt}` : 'none'}`)
  const milestones = (w as unknown as { milestones?: { week: number; kind?: string; line?: string }[] }).milestones ?? []
  const recent = milestones.filter((m) => m.week >= from)
  console.log(`milestones this season: ${recent.length}`)
  for (const m of recent.slice(-8)) console.log(`  ${weekLabel(m.week).padEnd(9)} ${m.line ?? m.kind ?? ''}`)
}

void main()
