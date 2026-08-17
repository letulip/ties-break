// HOW FAR SHE ACTUALLY GETS AT THE BIG RUNGS – the observed distribution, not the model's prediction.
//
// The owner, 17.08: «в каком % случаев карьеры, которые добирались до 250+ вообще куда-то дальше
// первого раунда двигались дальше? Какой % доходил до QF, Final и первого места? Распиши для
// каждого турнира.»
//
// ⚠ WHY THIS CAN BE MEASURED AT ALL, and why only here. The kid's result row is AWARD-ONLY –
// `world.ts` writes one only `if (points > 0)` – so at W15, W35 and W100, whose points arrays end in
// a literal 0, a first-round exit leaves no trace and the distribution below them is unknowable from
// the ledger. Every rung from WTA 125 up pays its opening round (1 · 1 · 1 · 10 · 10), so for exactly
// the rungs he asked about the ledger is complete. The tables therefore start at WTA 125 and say so.
//
// ⚠ AND THE ROUND IS RECOVERED FROM THE POINTS, which is safe because no rung's points array repeats
// a value (checked: nine rungs, zero duplicates). Index 0 is the champion; the last index is the
// player who lost her first match.
//
//     npx vite-node tools/big-rung-finishes.ts [--seeds 6] [--weeks 676]

import { TIERS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import { KID_ID } from '../src/engine/world/constants'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'

const argOf = (name: string, fallback: number): number => {
  const next = process.argv[process.argv.indexOf(`--${name}`) + 1]
  const n = Number(next)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const SEEDS = argOf('seeds', 6)
const WEEKS = argOf('weeks', 676)
/** The rungs whose opening round pays, i.e. the ones the ledger can answer for. */
const RUNGS: TierId[] = ['wta125', 'wta250', 'wta500', 'wta1000', 'slam']

/** Round labels from the champion down, for a draw of this many paid places. */
function roundNames(n: number): string[] {
  const tail = ['W', 'F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128']
  return tail.slice(0, n)
}

interface Tally {
  entries: number
  byFinish: number[]
  careersEntering: Set<number>
  careersPastR1: Set<number>
  careersQF: Set<number>
  careersFinal: Set<number>
  careersTitle: Set<number>
}

const tally = new Map<TierId, Tally>()
for (const r of RUNGS) {
  tally.set(r, {
    entries: 0,
    byFinish: new Array((TIERS[r].points ?? []).length).fill(0),
    careersEntering: new Set(),
    careersPastR1: new Set(),
    careersQF: new Set(),
    careersFinal: new Set(),
    careersTitle: new Set(),
  })
}

let careerIndex = 0
for (const preset of PRESETS) {
  for (let s = 0; s < SEEDS; s++) {
    const id = careerIndex++
    const { world, rng } = openCareer(preset, s, POLICIES[1])
    for (let w = 0; w < WEEKS && world.ending === null; w++) stepCareerWeek(world, rng, POLICIES[1])
    for (const row of world.results) {
      if (row.playerId !== KID_ID || !row.tier) continue
      const t = tally.get(row.tier as TierId)
      if (!t) continue
      const points = TIERS[row.tier as TierId].points ?? []
      const finish = points.indexOf(row.points)
      if (finish < 0) continue
      t.entries++
      t.byFinish[finish]++
      t.careersEntering.add(id)
      const last = points.length - 1
      if (finish < last) t.careersPastR1.add(id)
      if (finish <= 3) t.careersQF.add(id)
      if (finish <= 1) t.careersFinal.add(id)
      if (finish === 0) t.careersTitle.add(id)
    }
  }
}

const pct = (a: number, b: number): string => (b === 0 ? '   – ' : `${((100 * a) / b).toFixed(1).padStart(5)}%`)

console.log('')
console.log(`BIG-RUNG FINISHES · ${PRESETS.length} presets x ${SEEDS} seeds = n ${careerIndex} careers · ${WEEKS} weeks · POLICIES[1]`)
console.log('')
console.log('⚠ WTA 125 and up only: below it the opening round pays 0 and leaves no row, so a first-round')
console.log('  exit is invisible to the ledger and any share computed there would be a lie.')
console.log('')
console.log('1. PER ENTRY – of all the draws she played at this rung, how far did each one go')
console.log('')
for (const r of RUNGS) {
  const t = tally.get(r)!
  const names = roundNames(t.byFinish.length)
  console.log(`  ${TIERS[r].label} – ${t.entries} entries`)
  console.log(`    ${names.map((n) => n.padStart(7)).join('')}`)
  console.log(`    ${t.byFinish.map((c) => String(c).padStart(7)).join('')}`)
  console.log(`    ${t.byFinish.map((c) => pct(c, t.entries).padStart(7)).join('')}`)
  const last = t.byFinish.length - 1
  const past = t.entries - t.byFinish[last]
  const qf = t.byFinish.slice(0, 4).reduce((a, b) => a + b, 0)
  console.log(
    `    past R1 ${pct(past, t.entries)} · QF+ ${pct(qf, t.entries)} · ` +
      `final+ ${pct(t.byFinish[0] + t.byFinish[1], t.entries)} · title ${pct(t.byFinish[0], t.entries)}`,
  )
  console.log('')
}

console.log('2. PER CAREER – of the careers that ever entered this rung, how many EVER got that far')
console.log('')
console.log('  rung           entered   past R1        QF+       final+       title')
for (const r of RUNGS) {
  const t = tally.get(r)!
  const n = t.careersEntering.size
  console.log(
    `  ${TIERS[r].label.padEnd(12)} ${String(n).padStart(4)}/${careerIndex}` +
      `   ${String(t.careersPastR1.size).padStart(3)} ${pct(t.careersPastR1.size, n)}` +
      `  ${String(t.careersQF.size).padStart(3)} ${pct(t.careersQF.size, n)}` +
      `  ${String(t.careersFinal.size).padStart(3)} ${pct(t.careersFinal.size, n)}` +
      `  ${String(t.careersTitle.size).padStart(3)} ${pct(t.careersTitle.size, n)}`,
  )
}
console.log('')
