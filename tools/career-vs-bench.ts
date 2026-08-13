/**
 * career-vs-bench – the owner's own career against the bench's policy, on the one axis he
 * challenged: does a paid coach really ruin a poor family?
 *
 * ⚠ WHY IT EXISTS (owner, 13.08): «у меня Naomi была и есть с тренером и с какого-то момента даже
 * с мидл, а она 8к была. Так что еще раз возвращает нас к вопросу "как алгоритм играет" – я не
 * просто так отгружаю свои карьеры.» The economy verdicts in coach-match-edge.md §6a are drawn
 * from `tools/econ-bench.ts`'s POLICY, and a policy that plays worse than the owner biases every
 * one of them. This prints the facts his save actually holds so the two can be compared.
 *
 * MEASUREMENT ONLY. Read-only, changes no constant, ships no fixture. The save is personal and is
 * never committed – same rule as tools/round18-read.ts.
 *
 * Run:
 *   npx vite-node tools/career-vs-bench.ts -- --save ~/Downloads/a.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { coachById } from '../src/engine/coach'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { startingSkills } from '../src/engine/world/player'
import { rollPotential, SKILL_KEYS, type KidSkills } from '../src/engine/development'
import { ageAtWeek, kidAgeYears } from '../src/engine/world/age'
import { KID_ID } from '../src/engine/world/constants'
import { weekLabel } from '../src/shared/dates'

function money(cents: number): string {
  const s = cents < 0 ? '-' : ''
  return `${s}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}

function section(t: string): void {
  console.log(`\n${'='.repeat(84)}\n${t}\n${'='.repeat(84)}`)
}

async function main(): Promise<void> {
  const i = process.argv.indexOf('--save')
  const path = i >= 0 ? process.argv[i + 1].replace('~', process.env.HOME ?? '') : ''
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
  const p = w.profile

  section('THE FAMILY, AS THE BENCH WOULD CLASSIFY IT')
  console.log(`background          : ${p.background}`)
  console.log(`starting capital    : ${'startingFundsCents' in p ? money((p as unknown as { startingFundsCents: number }).startingFundsCents) : 'not on the profile'}`)
  console.log(`funds now           : ${money(w.fundsCents)}   (week ${w.week}, ${weekLabel(w.week)})`)
  console.log(`coach now           : ${w.coachId ?? 'self'}${w.coachId ? ` – ${coachById(w.seed, ageAtWeek(w.week), w.coachId)?.name ?? '?'} (${coachById(w.seed, ageAtWeek(w.week), w.coachId)?.tier ?? '?'})` : ''}`)
  console.log(`rank (wta / itf)    : #${w.kidRankWta ?? '–'} / #${w.kidRank ?? '–'}`)

  // ⚠ THE OTHER HALF OF THE COMPARISON, and the owner named it as still open: two of his careers are
  // not the same experiment. «Naomi почти prodigy, тогда как Olivia с нижней планкой скиллов.» The
  // band she was drawn from is what decides whether an economic difference is about the money at all.
  const start = startingSkills(w.seed, p)
  const pot = rollPotential(w.seed, start)
  const sum = (o: KidSkills): number => SKILL_KEYS.reduce((n, k) => n + o[k], 0)
  const now = w.skills
  console.log(
    `start / now / ceiling: ${sum(start).toFixed(1)} -> ${sum(now).toFixed(1)} -> ${sum(pot).toFixed(1)}` +
      `   (headroom left ${(sum(pot) - sum(now)).toFixed(1)} of ${(sum(pot) - sum(start)).toFixed(1)}, ` +
      `${Math.round((100 * (sum(now) - sum(start))) / Math.max(1, sum(pot) - sum(start)))}% realised)`,
  )
  console.log(`per wing, start -> now : ${SKILL_KEYS.map((k) => `${k} ${start[k].toFixed(0)}->${now[k].toFixed(0)}`).join('  ')}`)

  section('WHAT SHE HAS EARNED, PER SEASON – with the prize DERIVED from her own results')
  // ⚠ NOT DERIVED FROM `world.results` – that list is PRUNED to the ranking's rolling window, so on
  // a twelve-season save it holds only the last one and every earlier season would read $0. The
  // money is banked on the season row itself (`spentCents` / `earnedCents`, v28), optional because
  // rows written before v28 have no gross figure and none can be invented – so an older row prints
  // silence rather than a zero, which is that field's own stated contract.
  console.log('season   age    points   wins-losses        earned         spent          net')
  for (const s of w.seasonHistory) {
    const row = s as unknown as { spentCents?: number; earnedCents?: number; fundsDeltaCents?: number }
    const age = kidAgeYears(s.seasonIndex * WEEKS_PER_YEAR + 26, p.birthMonth)
    const cell = (v: number | undefined): string => (v === undefined ? '–' : money(v))
    console.log(
      `  ${String(s.seasonIndex).padStart(2)}     ${String(age).padStart(2)}    ${String(s.points).padStart(5)}     ${String(s.wins).padStart(3)}-${String(s.losses).padEnd(3)}   ${cell(row.earnedCents).padStart(12)}  ${cell(row.spentCents).padStart(12)}  ${cell(row.fundsDeltaCents).padStart(12)}`,
    )
  }

  section('THE BILLS, AS THE LEDGER RECORDED THEM')
  // The ledger is pruned, so this is the surviving window rather than the career - stated, not hidden.
  const ledger = (w as unknown as { ledger?: { week: number; category?: string; amountCents: number }[] }).ledger ?? []
  const byCat: Record<string, { n: number; cents: number }> = {}
  for (const row of ledger) {
    const c = row.category ?? 'other'
    byCat[c] ??= { n: 0, cents: 0 }
    byCat[c].n += 1
    byCat[c].cents += row.amountCents
  }
  const weeks = ledger.length ? Math.max(...ledger.map((r) => r.week)) - Math.min(...ledger.map((r) => r.week)) + 1 : 0
  console.log(`surviving ledger window: ${weeks} weeks (it is pruned – this is not the whole career)`)
  let windowTotal = 0
  for (const [c, v] of Object.entries(byCat).sort((a, b) => a[1].cents - b[1].cents)) {
    console.log(`  ${c.padEnd(14)} ${String(v.n).padStart(4)} rows   ${money(v.cents).padStart(12)}   ${weeks ? money(Math.round(v.cents / weeks)) : '–'}/week`)
    windowTotal += v.cents
  }
  console.log(`  ${'TOTAL'.padEnd(14)}              ${money(windowTotal).padStart(12)}`)

  section('HER RESULTS, BY TIER – what the bench calls the ladder')
  const hers = (w.results ?? []).filter((r) => r.playerId === KID_ID)
  const byTier: Record<string, { n: number; scored: number; points: number }> = {}
  for (const r of hers) {
    const t = r.tier ?? '?'
    byTier[t] ??= { n: 0, scored: 0, points: 0 }
    byTier[t].n += 1
    byTier[t].scored += r.points > 0 ? 1 : 0
    byTier[t].points += r.points
  }
  for (const [t, v] of Object.entries(byTier).sort((a, b) => b[1].points - a[1].points)) {
    console.log(`  ${t.padEnd(10)} entries ${String(v.n).padStart(3)}   scored ${String(v.scored).padStart(3)}   points ${String(v.points).padStart(5)}`)
  }
}

void main()
