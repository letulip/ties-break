// WHERE DOES A CAREER ACTUALLY REACH ON THE INTERNATIONAL TABLE?
//
// The brand ladder's two upper rungs are gated on her ITF standing, and this project picks a
// threshold with a number in hand rather than by feel. The question is exactly the one the local
// shop's gate got wrong once already (two-ladders.md §"the gear valve has never fired for anybody"):
// a sponsor gate denominated in a currency she does not hold fires for NOBODY, and dead content is
// worse than no content.
//
// So: run the econ bench's own careers - same presets, same policies, same entry policy - and report
// the BEST ITF rank each one ever held, plus how many careers would have cleared each candidate cut.
//
// Run: npx vite-node tools/brand-gate-bench.ts

import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { TIERS } from '../src/engine/season/calendar'

const WEEKS = 312 // 14 -> 20, the horizon the adult tour needs (HORIZONS[2])
const SEEDS = 12

/** The candidate cuts, and where each one comes from. */
const CUTS = [
  { label: 'j300 draw (32)', rank: TIERS.j300.drawSize },
  { label: 'last 16 of it (16)', rank: TIERS.j300.drawSize / 2 },
  { label: 'last 8 of it (8)', rank: TIERS.j300.drawSize / 4 },
  { label: 'last 4 of it (4)', rank: TIERS.j300.drawSize / 8 },
]

interface Row {
  label: string
  best: number[]
  bestDom: number[]
}

const rows: Row[] = []

for (const preset of PRESETS) {
  for (const policy of POLICIES) {
    const best: number[] = []
    const bestDom: number[] = []
    for (let i = 0; i < SEEDS; i++) {
      const { world, rng } = openCareer(preset, i, policy)
      let bestRank = Number.MAX_SAFE_INTEGER
      let bestDomRank = Number.MAX_SAFE_INTEGER
      for (let w = 0; w < WEEKS; w++) {
        stepCareerWeek(world, rng, policy)
        // Only a career with a counting international result is on the table at all; everybody else
        // sits at the `cohort.length + 1` fallback, which is not a rank.
        const ranked = world.results.some((r) => r.tier === 'j30' || r.tier === 'j60' || r.tier === 'j300')
        if (ranked && world.kidRank < bestRank) bestRank = world.kidRank
        const dom = world.kidRankDomestic ?? Number.MAX_SAFE_INTEGER
        if (dom < bestDomRank) bestDomRank = dom
      }
      best.push(bestRank)
      bestDom.push(bestDomRank)
    }
    rows.push({ label: `${preset.label} · ${policy.label}`, best, bestDom })
  }
}

const fmt = (n: number) => (n === Number.MAX_SAFE_INTEGER ? '  –' : `#${n}`.padStart(5))
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

console.log(`\nBEST ITF RANK EVER HELD, ${SEEDS} seeds x ${WEEKS} weeks (14 -> 20)\n`)
console.log(
  `${'preset · policy'.padEnd(38)} ${'best'.padStart(6)} ${'median'.padStart(7)} ${'worst'.padStart(6)}   ${CUTS.map((c) => c.label.padStart(18)).join(' ')}   ${'best dom'.padStart(9)}`,
)
for (const r of rows) {
  const sorted = [...r.best].sort((a, b) => a - b)
  const cleared = CUTS.map((c) => `${r.best.filter((b) => b <= c.rank).length}/${SEEDS}`.padStart(18)).join(' ')
  console.log(
    `${r.label.padEnd(38)} ${fmt(sorted[0])} ${fmt(med(r.best)).padStart(7)} ${fmt(sorted[sorted.length - 1])}   ${cleared}   ${fmt(med(r.bestDom)).padStart(9)}`,
  )
}

const all = rows.flatMap((r) => r.best)
console.log(`\nACROSS ALL ${all.length} CAREERS`)
for (const c of CUTS) {
  const n = all.filter((b) => b <= c.rank).length
  console.log(`  ITF <= ${String(c.rank).padStart(2)}  (${c.label.padEnd(18)}) : ${n}/${all.length} careers`)
}
