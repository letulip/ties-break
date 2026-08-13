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
import { schoolEndWeek, schoolIsOver, gradeOf } from '../src/engine/kidLife'
import { kidAgeYears, kidAgeExact } from '../src/engine/world/age'
import { weekLabel, seasonYear, weekYear } from '../src/shared/dates'
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
  console.log(`born ${p.birthDay}.${p.birthMonth}  ·  age exact ${kidAgeExact(w.week, p.birthMonth, p.birthDay).toFixed(2)}  ·  age years ${kidAgeYears(w.week, p.birthMonth)}`)
  console.log(`funds ${money(w.funds)}  ·  coachTier ${p.coachTier}  ·  coachId ${w.coachId ?? 'self'}`)

  section('#9 – THE SCHOOL CLOCK ON HIS SAVE')
  const end = schoolEndWeek(p.birthMonth)
  console.log(`schoolEndWeek(birthMonth=${p.birthMonth}) = ${end}  (${weekLabel(end)})`)
  console.log(`schoolIsOver(week ${w.week})               = ${schoolIsOver(w.week, p.birthMonth)}`)
  console.log(`her age at that week                      = ${kidAgeYears(end, p.birthMonth)}`)
  console.log(`gradeOf now (schoolYearStart ${seasonYear(w.week)})       = ${gradeOf(2026 - 14, p.birthMonth, seasonYear(w.week)) ?? 'null (done)'}`)
  console.log(`weeks since school ended                  = ${w.week - end}`)

  section('#7 – THE SEASON THAT MADE HER SNAP')
  const season = Math.floor(w.week / WEEKS_PER_YEAR)
  const from = season * WEEKS_PER_YEAR
  const inSeason = (w.results ?? []).filter((r) => r.week >= from)
  console.log(`season index ${season} (${seasonYear(w.week)}), weeks ${from}-${w.week}: ${inSeason.length} results`)
  const byTier: Record<string, { n: number; wins: number; prize: number }> = {}
  for (const r of inSeason) {
    const t = (r as unknown as { tier?: string }).tier ?? '?'
    byTier[t] ??= { n: 0, wins: 0, prize: 0 }
    byTier[t].n += 1
    byTier[t].wins += (r as unknown as { wins?: number }).wins ?? 0
    byTier[t].prize += (r as unknown as { prizeCents?: number }).prizeCents ?? 0
  }
  for (const [t, v] of Object.entries(byTier).sort((a, b) => b[1].prize - a[1].prize)) {
    console.log(`  ${t.padEnd(10)} entries ${String(v.n).padStart(2)}  matches won ${String(v.wins).padStart(3)}  prize ${money(v.prize)}`)
  }

  section('#7 – THE ANGER, AS THE ENGINE RECORDED IT')
  const diary = (w as unknown as { diary?: { week: number; emotion?: string; line?: string }[] }).diary ?? []
  const angry = diary.filter((d) => d.emotion === 'angry')
  console.log(`angry weeks in the diary: ${angry.length}`)
  for (const a of angry.slice(-6)) console.log(`  ${weekLabel(a.week)}  ${a.line ?? ''}`)
  const streak = (w as unknown as { angerStreak?: number }).angerStreak
  if (streak !== undefined) console.log(`anger streak counter now: ${streak}`)

  section('#7 – WHAT THE BIG DRAWS PAID AND COST')
  const big = inSeason.filter((r) => ['slam', 'wta1000', 'wta500'].includes((r as unknown as { tier?: string }).tier ?? ''))
  let prize = 0
  let played = 0
  let won = 0
  for (const r of big) {
    const rr = r as unknown as { tier?: string; week: number; wins?: number; prizeCents?: number; roundReached?: string }
    prize += rr.prizeCents ?? 0
    played += 1
    won += rr.wins ?? 0
    console.log(`  ${weekLabel(rr.week)}  ${(rr.tier ?? '').padEnd(8)}  won ${rr.wins ?? 0}  ${rr.roundReached ?? ''}  ${money(rr.prizeCents ?? 0)}`)
  }
  console.log(`\n  ${played} big entries · ${won} matches won · ${money(prize)} in prize`)
}

void main()
