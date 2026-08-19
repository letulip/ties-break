// WHAT A SEASON OF LIVE RESULTS DOES TO THE PROFESSIONAL TABLE – the measurement `fieldPros.ts`'s
// `mergedWtaRanking` cites, and the one that caught the v53 defect.
//
//     npx vite-node tools/live-table-inflation.ts [--seasons 8] [--preset 0]
//
// THE DEFECT IT FOUND (19.08). v53 made the professional table live: a pro's season winnings
// (`WorldState.fieldSeasonPoints`) joined her row. They were ADDED to her derived book – and
// `wtaPoints` is not a January opening balance, it is her WHOLE derived 52-week book, so the same
// tennis was counted twice. The table inflated all season; the acceptance cuts read the inflated
// table and refused the kid; a ten-season career reached the W tour in NO season and finished on
// domestic events at 22.
//
// ⚠ MEASUREMENT ONLY. Imports the engine read-only and changes no constant. Column B re-scores the
// MEASURED rows under the old additive rule rather than re-running the engine under it, so nothing
// here can be mistaken for shipped behaviour – the same discipline `tools/teen-at-the-top.ts` is
// under.
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import { fieldProsOf } from '../src/engine/world/ladder'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEASONS = argOf('seasons', 8)
const PRESET = argOf('preset', 0)

const pad = (s: string, n: number) => s.padStart(n)
const { world, rng } = openCareer(PRESETS[PRESET % PRESETS.length], 0, POLICIES[1])

console.log(`\nLIVE TABLE INFLATION – preset ${PRESET}, ${SEASONS} seasons, policy 1`)
console.log(`\n⚠ THE SEASON'S TALLY IS SPENT AT THE WRAP (world/milestones.ts clears it three weeks`)
console.log(`  before the new season starts), so the sampling weeks below stop short of it.\n`)
console.log(
  `  ${pad('season:week', 12)}${pad('pros', 7)}${pad('earning', 9)}${pad('sum(earned)', 13)}` +
    `${pad('sum(book)', 12)}${pad('ADDITIVE bloat', 16)}${pad('SHIPPED bloat', 15)}`,
)

for (let w = 0; w < SEASONS * WEEKS_PER_YEAR; w++) {
  stepCareerWeek(world, rng, POLICIES[1])
  const wk = world.week % WEEKS_PER_YEAR
  if (wk !== 13 && wk !== 26 && wk !== 39) continue
  const pros = fieldProsOf(world) ?? []
  if (!pros.length) continue
  const tally = world.fieldSeasonPoints ?? {}

  let sumEarned = 0
  let sumBook = 0
  let earning = 0
  // ...and the two rules, side by side, over the SAME measured rows.
  let sumAdditive = 0
  let sumShipped = 0
  let activeBook = 0
  for (const p of pros) {
    const e = tally[p.id] ?? 0
    sumBook += p.wtaPoints
    if (e > 0) {
      earning += 1
      sumEarned += e
      activeBook += p.wtaPoints
    }
  }
  const share = activeBook > 0 ? Math.min(1, sumEarned / activeBook) : 0
  for (const p of pros) {
    const e = tally[p.id] ?? 0
    sumAdditive += p.wtaPoints + e // the v53 rule as shipped, and the defect
    sumShipped += e > 0 ? p.wtaPoints * (1 - share) + e : p.wtaPoints // winnings REPLACE a share
  }
  const bloat = (x: number) => `${(100 * (x / sumBook - 1)).toFixed(1)}%`
  console.log(
    `  ${pad(`${Math.floor(world.week / WEEKS_PER_YEAR)}:w${wk}`, 12)}${pad(String(pros.length), 7)}` +
      `${pad(String(earning), 9)}${pad(String(sumEarned), 13)}${pad(String(sumBook), 12)}` +
      `${pad(bloat(sumAdditive), 16)}${pad(bloat(sumShipped), 15)}`,
  )
}
console.log(
  `\n  ⭐ READ THE LAST TWO COLUMNS. 'ADDITIVE' is what v53 shipped and it grows through every` +
    `\n  season – that growth IS the defect. 'SHIPPED' is the correction: winnings replace a share of` +
    `\n  the book, so the table's total is preserved by construction and cannot bloat at all.` +
    `\n\n  ⚠ AND NOTE 'earning' AGAINST 'pros': only a fifth of the table gets a draw in a season, so` +
    `\n  the additive bloat was never even – it was concentrated on the few who played, and they` +
    `\n  leapfrogged everybody else.\n`,
)
