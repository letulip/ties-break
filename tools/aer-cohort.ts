// ⭐ P2 – DOES THE COHORT NEED THE AGE-ELIGIBILITY RULE TOO?
//
//   npx vite-node tools/aer-cohort.ts [--seeds N] [--weeks N] [--policy 0|1]
//
// THE QUESTION, AND IT IS THE PLAN'S OWN («⚠ THE COHORT NEEDS IT TOO, or the field she meets is
// playing a different sport», docs/plans/college-and-the-junior-ladder.md §P2): if only the kid is
// capped she is uniquely handicapped. The plan warns this may be the larger half of the work – so
// the first thing to do is not to build it but to MEASURE WHAT THE COHORT ALREADY DOES, because the
// answer decides whether there is anything to build at all.
//
// WHAT IT COUNTS, and why this ledger. `world.results` holds ONE ROW PER ENTRANT PER DRAW for every
// live cohort player since the rival-life slice (`runAiTournament` writes a row whatever she scored –
// season/rival.ts states that contract at length), and it is pruned to a rolling 52 weeks. So a fold
// over the whole ledger at any week IS "professional entries in the last year", per player, which is
// exactly the quantity the AER caps. Field pros (`fp-` ids) are derived state and leave no rows at
// all; they are adults with no age rule anyway.
//
// ⚠ ZERO ENGINE CHANGES. It reads a career the bench already knows how to run.
import { openCareer, stepCareerWeek, POLICIES, PRESETS, mean } from './econ-bench'
import { KID_ID, annualProEntryLimit, isCappedProTier } from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { AiPlayer } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 6)
const WEEKS = argOf('weeks', 8 * WEEKS_PER_YEAR)
const POLICY = POLICIES[argOf('policy', 1)] ?? POLICIES[1]

interface Sample {
  /** her age that season */
  ageYears: number
  /** W-family draws entered in the trailing 52 weeks */
  entries: number
}

const samples: Sample[] = []
/** every sampled (player, season) pair whose count is over the AER row for that age */
let over = 0
let sampled = 0
let kidSamples = 0
let kidOver = 0

for (let s = 0; s < SEEDS; s++) {
  const preset = PRESETS[s % PRESETS.length]
  const { world, rng } = openCareer(preset, Math.floor(s / PRESETS.length), POLICY)
  for (let w = 0; w < WEEKS; w++) {
    stepCareerWeek(world, rng, POLICY)
    // Sample at each season's end, when the trailing 52 weeks are a whole season.
    if ((world.week + 1) % WEEKS_PER_YEAR !== 0 || world.week < WEEKS_PER_YEAR) continue
    const ageOf = new Map<string, number>()
    for (const p of world.cohort as AiPlayer[]) ageOf.set(p.id, p.ageYears)
    const counts = new Map<string, number>()
    for (const r of world.results) {
      if (!isCappedProTier(r.tier ?? 'local')) continue
      counts.set(r.playerId, (counts.get(r.playerId) ?? 0) + 1)
    }
    for (const [id, entries] of counts) {
      if (id === KID_ID) {
        kidSamples++
        continue
      }
      const ageYears = ageOf.get(id)
      if (ageYears === undefined) continue // a player who left at the wrap
      samples.push({ ageYears, entries })
      sampled++
      if (entries > annualProEntryLimit(ageYears)) over++
    }
  }
  void kidOver
}

const ages = [...new Set(samples.map((s) => s.ageYears))].sort((a, b) => a - b)
const pad = (v: string | number, n: number) => String(v).padStart(n)
console.log(`\nTHE COHORT'S PROFESSIONAL SEASON, per player (n ${sampled} player-seasons, ${SEEDS} careers x ${WEEKS} weeks)`)
console.log(`  ${pad('age', 5)}${pad('players', 9)}${pad('mean W', 9)}${pad('max W', 8)}${pad('AER row', 9)}${pad('over it', 9)}`)
console.log('  ' + '-'.repeat(50))
for (const age of ages) {
  const rows = samples.filter((s) => s.ageYears === age)
  const limit = annualProEntryLimit(age)
  const overHere = rows.filter((r) => r.entries > limit).length
  console.log(
    `  ${pad(age, 5)}${pad(rows.length, 9)}${pad(mean(rows.map((r) => r.entries)).toFixed(1), 9)}` +
      `${pad(Math.max(...rows.map((r) => r.entries)), 8)}` +
      `${pad(limit >= Number.MAX_SAFE_INTEGER ? '-' : limit, 9)}${pad(overHere, 9)}`,
  )
}
console.log(`\n  player-seasons over the AER row for that age: ${over} of ${sampled}`)
console.log(`  kid seasons sampled (for scale): ${kidSamples}`)
console.log(
  `\n  ⚠ A ROW IS AN APPEARANCE. Only players still in the cohort at the sample week are counted; a\n` +
    `    player the conveyor retired at that wrap has no age to report and is skipped.`,
)
