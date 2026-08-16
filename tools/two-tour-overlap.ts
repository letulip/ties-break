// ⭐ P2 ITEM 6 – WHAT THE `w15.minAgeYears` RULING DOES TO THE TWO-TOUR OVERLAP.
//
//   npx vite-node tools/two-tour-overlap.ts [--seeds N] [--weeks N] [--policy 0|1]
//
// THE RULING (owner, 16.08): «мы же вроде наресерчили четкую возрастную сетку с количеством
// доступных турниров каждого тира на каждом возрасте, мне кажется надо использовать.» So W15 opens
// at 14, as the sport's own reserved place does, instead of at the 16 P1 deliberately kept.
//
// THE PILLAR IT COLLIDES WITH (docs/specs/adult-tour-and-endings.md §4.1): *"a sixteen-to-eighteen-
// year-old holds both tours at once and arrives at nineteen having seen what each one costs and
// pays"*. Opening W15 at 14 widens that window to 14-18. Do not silently discard the pillar and do
// not silently keep it – so this measures what the ruling actually does to it, per year of her life,
// and the spec puts the number in front of the owner.
//
// WHAT "HOLDING BOTH TOURS" MEANS HERE, and it is deliberately the strict reading: in that year of
// her life she ENTERED at least one JUNIOR event (the ITF family the appendix counts) AND at least
// one PROFESSIONAL one (the W family the AER counts). Eligibility alone is not the pillar's claim –
// the sentence is about a girl who is actually playing both.
//
// ⚠ THE LEDGERS PRUNE, so they are harvested every week rather than at the end, and each row is
// counted once by (family, week). Zero engine changes: it runs a career the bench already knows.
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import { kidAgeYears } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 6)
const WEEKS = argOf('weeks', 8 * 52)
const POLICY = POLICIES[argOf('policy', 1)] ?? POLICIES[1]

interface Counts {
  junior: number
  pro: number
}
const careers: Map<number, Counts>[] = []

for (let s = 0; s < SEEDS; s++) {
  for (const preset of PRESETS) {
    const { world, rng } = openCareer(preset, s, POLICY)
    const byAge = new Map<number, Counts>()
    const seen = new Set<string>()
    const harvest = (weeks: readonly number[], family: 'junior' | 'pro'): void => {
      for (const week of weeks) {
        const key = `${family}:${week}`
        if (seen.has(key)) continue
        seen.add(key)
        const age = kidAgeYears(week, world.profile.birthMonth)
        const row = byAge.get(age) ?? { junior: 0, pro: 0 }
        row[family]++
        byAge.set(age, row)
      }
    }
    for (let w = 0; w < WEEKS; w++) {
      stepCareerWeek(world, rng, POLICY)
      harvest(world.internationalEntryWeeks, 'junior')
      harvest(world.proEntryWeeks, 'pro')
    }
    careers.push(byAge)
  }
}

const ages = [...new Set(careers.flatMap((c) => [...c.keys()]))].sort((a, b) => a - b)
const pad = (v: string | number, n: number) => String(v).padStart(n)
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
console.log(`\nTHE TWO-TOUR OVERLAP, per year of her life (n ${careers.length} careers x ${WEEKS} weeks)`)
console.log(
  `  ${pad('age', 5)}${pad('any J', 8)}${pad('any W', 8)}${pad('BOTH', 7)}${pad('share', 8)}` +
    `${pad('mean J', 9)}${pad('mean W', 9)}`,
)
console.log('  ' + '-'.repeat(54))
for (const age of ages) {
  const rows = careers.map((c) => c.get(age) ?? { junior: 0, pro: 0 })
  const junior = rows.filter((r) => r.junior > 0).length
  const pro = rows.filter((r) => r.pro > 0).length
  const both = rows.filter((r) => r.junior > 0 && r.pro > 0).length
  console.log(
    `  ${pad(age, 5)}${pad(junior, 8)}${pad(pro, 8)}${pad(both, 7)}` +
      `${pad(`${Math.round((100 * both) / careers.length)}%`, 8)}` +
      `${pad(mean(rows.map((r) => r.junior)).toFixed(1), 9)}${pad(mean(rows.map((r) => r.pro)).toFixed(1), 9)}`,
  )
}
console.log(
  `\n  BOTH = careers that entered at least one of each family in that year of her life.\n` +
    `  ⚠ THE LEDGERS ARE THE SOURCE, so this counts ENTRIES, not eligibility: the pillar's sentence\n` +
    `    is about a girl who is actually playing both tours, not one who could.`,
)
