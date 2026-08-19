// WHAT #30 MEANS AGAINST WHAT 120 MEANT – the one number P1's W15 door had to be chosen from.
//
//   npx vite-node tools/junior-door-calibration.ts -- [--seeds N] [--weeks N]
//
// P1 moves W15's on-ramp off 120 ITF junior POINTS (ours) onto an ITF junior RANKING (the sport's
// junior reserved place). A change of unit is only a change of unit if the DIFFICULTY is held, and
// "the same difficulty" is not arguable from either number on its own: it is a fact about where 120
// points sits in this game's junior table, week by week, as the kid climbs and the cohort's book
// decays. This prints exactly that, on the same careers the arms are measured on.
//
// MEASUREMENT ONLY. Nothing is patched and no engine number is written from here.
import { openCareer, stepCareerWeek, POLICIES, PRESETS, mean, median } from './econ-bench'
import { kidPoints, kidAgeExact, tableSize } from '../src/engine/world'
// `rankingFor` is not on world.ts's re-export list, so it is imported from the module that owns it.
import { rankingFor } from '../src/engine/world/ladder'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEEDS = argOf('seeds', 4)
const WEEKS = argOf('weeks', 208)
const POLICY = POLICIES[1]
/** The band the door used to read – kept as a reference to the tier rather than a literal. */
const BAND = TIERS.w15.enterPointBand[0]

/** Her ITF rank the week her ITF book first reaches the retired band, and the SHARE of the table
 *  that rank is – which is the unit `JUNIOR_RESERVED.rankPct` is written in. */
const crossRank: number[] = []
const crossPct: number[] = []
const crossAge: number[] = []
/** ...and the same question asked of the COHORT: how many rivals hold the band at a given week, as a
 *  share of the table. The cohort's door moved with hers (`proDoors`), so both matter. */
const cohortSharePerWeek = new Map<number, number[]>()

for (const preset of PRESETS) {
  for (let i = 0; i < SEEDS; i++) {
    const { world, rng } = openCareer(preset, i, POLICY)
    let crossed = false
    for (let w = 0; w < WEEKS; w++) {
      stepCareerWeek(world, rng, POLICY)
      if (!crossed && kidPoints(world, 'itf') >= BAND) {
        crossed = true
        const row = rankingFor(world, 'itf').find((r) => r.playerId === KID_ID)
        if (row) {
          crossRank.push(row.rank)
          crossPct.push(row.rank / tableSize(world, 'itf'))
          crossAge.push(kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay))
        }
      }
      if (w % 26 === 25) {
        const table = rankingFor(world, 'itf')
        const holders = table.filter((r) => r.points >= BAND).length
        const season = Math.floor(w / WEEKS_PER_YEAR)
        const arr = cohortSharePerWeek.get(season) ?? []
        arr.push(holders / table.length)
        cohortSharePerWeek.set(season, arr)
      }
    }
  }
}

const pct = (x: number) => `${(100 * x).toFixed(1)}%`
console.log(`\njunior-door-calibration · n=${PRESETS.length * SEEDS} · ${WEEKS} weeks · band ${BAND} ITF pts\n`)
console.log(`HER OWN CROSSING (the week her ITF book first reaches ${BAND}):`)
console.log(`  careers that crossed        ${crossRank.length} of ${PRESETS.length * SEEDS}`)
console.log(`  age at the crossing         mean ${mean(crossAge).toFixed(2)}   median ${median(crossAge).toFixed(2)}`)
console.log(`  her ITF rank there          mean ${mean(crossRank).toFixed(1)}   median ${median(crossRank).toFixed(0)}`)
console.log(`  ...as a SHARE of the table  mean ${pct(mean(crossPct))}   median ${pct(median(crossPct))}`)
console.log(`\nHOW MANY OF THE TABLE HOLD THE BAND AT ALL, by season (the cohort's own door):`)
for (const [season, arr] of [...cohortSharePerWeek].sort((a, b) => a[0] - b[0])) {
  console.log(`  season ${season} (age ${14 + season})   mean ${pct(mean(arr))}   median ${pct(median(arr))}`)
}
console.log(
  `\n⚠ THE SECOND TABLE IS THE ONE THAT SETS THE SHARE. The door has to admit roughly the same\n` +
    `POPULATION it used to, on both sides of it – hers and the cohort's – and "the share of the\n` +
    `junior table that held 120 points" is that population measured in the new unit.`,
)
