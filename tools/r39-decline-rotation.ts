/**
 * r39-decline-rotation – HOW FAR BELOW HER BEST A DECLINING CAREER ACTUALLY IS, so the three
 * intensities of Home's rotating plate are MEASURED rather than picked (invariant 5).
 *
 * Round 39 #2b, reopened a second time. The owner, 08.09: «слушай, а можно же чередовать как раз на
 * спаде эти фразочки. давай оставим и «Past her peak – about N seasons left», и «she's down N
 * places» в начале сезона, например или в конце наоборот, «she's below her best» или «she's way
 * below her best» или «she's far below her best», это даст живости и вариативности, уберет
 * статичность.»
 *
 * The three below-best phrasings are an INTENSITY LADDER over `seasonRankRead().belowBest` – how
 * many places the last banked WTA season finished behind her career best. Two thresholds decide
 * where «below» becomes «far below» becomes «way below», and neither may be invented: this tool
 * walks real careers past their peak and prints the distribution the thresholds have to partition.
 *
 * ⚠ IT IS A REAL CAREER WALK, NOT THE `r39-body-seasons` ARITHMETIC. `belowBest` is a fold over the
 * seasons a career actually banked, so nothing but the simulation produces it: a synthetic fixture
 * would be the thresholds choosing their own evidence. The walk is econ-bench's own
 * (`openCareer`/`stepCareerWeek`, the 'player' policy – the model of a reasonable parent), and the
 * horizon is `FULL_CAREER_WEEKS`, the same one endings-bench walks.
 *
 * ⚠ TWO UNITS, BOTH PRINTED, BECAUSE THEY ANSWER DIFFERENT QUESTIONS.
 *   - PER WEEK past the decline gate: what a player actually SEES, since the plate is read weekly
 *     and `belowBest` only moves at a season wrap. This is the unit the thresholds are chosen on.
 *   - PER BANKED SEASON: one row per (career, season) so a long career cannot outvote a short one.
 *
 * MEASUREMENT ONLY. It writes no constant; the numbers it prints are quoted in the round-39 ledger
 * and in the header of `BELOW_BEST_LADDER` in `src/engine/world/coachMarket.ts`.
 *
 * Run: npx vite-node tools/r39-decline-rotation.ts [--seeds N] [--presets N] [--dump out.json]
 */
import { writeFileSync } from 'node:fs'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { seasonRankRead } from '../src/engine/world/coachMarket'
import { ageCurveOf } from '../src/engine/development'
import { kidAgeExact } from '../src/engine/world/age'
import { seasonStartWeek } from '../src/engine/world/ledger'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const args = process.argv.slice(2)
const numArg = (flag: string, fallback: number): number => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = numArg('--seeds', 4)
const PRESET_COUNT = numArg('--presets', PRESETS.length)

const padL = (s: string | number, n: number) => String(s).padStart(n)
const pad = (s: string | number, n: number) => String(s).padEnd(n)

/** `declineRead`'s own gate, replicated because the function is private: her OWN resolved curve
 *  (round 31 #10), never `ECONOMY.development.ageCurve.declineStart`. */
function pastPeak(world: {
  week: number
  profile: { birthMonth: number; birthDay: number }
  ageCurve?: unknown
  careerTotals?: { weeksLostToInjury?: number }
}): boolean {
  const bounds = ageCurveOf(
    world.ageCurve as Parameters<typeof ageCurveOf>[0],
    world.careerTotals?.weeksLostToInjury ?? 0,
  )
  return kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay) >= bounds.declineStart
}

interface Sample {
  belowBest: number | null
  yearMove: number | null
  seasonWeek: number
}

const weekly: Sample[] = []
/** One entry per (career, last-banked-season) – the season-weighted view. */
const perSeason = new Map<string, number | null>()
let careers = 0
let weeksWalked = 0

for (const preset of PRESETS.slice(0, PRESET_COUNT)) {
  for (let i = 0; i < SEEDS; i++) {
    const { world, rng } = openCareer(preset, i, POLICIES[1]!)
    careers++
    for (let w = 0; w < FULL_CAREER_WEEKS; w++) {
      stepCareerWeek(world, rng, POLICIES[1]!)
      weeksWalked++
      if (!pastPeak(world)) continue
      const read = seasonRankRead(world)
      weekly.push({ ...read, seasonWeek: world.week - seasonStartWeek(world.week) })
      const rows = world.seasonHistory ?? []
      const last = rows[rows.length - 1]
      if (last) perSeason.set(`${preset.label}|${i}|${last.seasonIndex}`, read.belowBest)
    }
  }
}

const withBelow = weekly.filter((s) => s.belowBest !== null && s.belowBest > 0).map((s) => s.belowBest!)
const sorted = [...withBelow].sort((a, b) => a - b)
const q = (p: number): number => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]! : NaN)

console.log('='.repeat(100))
console.log('ROUND 39 #2b – THE `belowBest` DISTRIBUTION PAST THE DECLINE GATE')
console.log('='.repeat(100))
console.log(
  `${careers} careers · ${PRESETS.slice(0, PRESET_COUNT).length} presets x ${SEEDS} seeds · policy "${POLICIES[1]!.id}" · ` +
    `${FULL_CAREER_WEEKS} weeks each (${weeksWalked} walked)`,
)
console.log(
  `past-peak weeks ${weekly.length} · of them with a TRUE below-best (> 0 places): ${withBelow.length} ` +
    `(${((100 * withBelow.length) / Math.max(1, weekly.length)).toFixed(1)}%)`,
)
const noRank = weekly.filter((s) => s.belowBest === null).length
const atBest = weekly.filter((s) => s.belowBest === 0).length
const negative = weekly.filter((s) => s.belowBest !== null && s.belowBest < 0).length
console.log(`  no WTA row at all: ${noRank} · sitting ON her best (0): ${atBest} · negative (impossible): ${negative}`)
const withFall = weekly.filter((s) => s.yearMove !== null && s.yearMove > 0).length
console.log(
  `past-peak weeks with a TRUE year fall (> 0 places): ${withFall} ` +
    `(${((100 * withFall) / Math.max(1, weekly.length)).toFixed(1)}%)`,
)
console.log()

console.log('DISTRIBUTION of belowBest over past-peak weeks where it is > 0 (the ladder\'s domain):')
console.log(`  n ${sorted.length} · min ${sorted[0] ?? '-'} · max ${sorted[sorted.length - 1] ?? '-'}`)
for (const p of [0.1, 0.2, 0.25, 0.3, 1 / 3, 0.4, 0.5, 0.6, 2 / 3, 0.7, 0.75, 0.8, 0.9]) {
  console.log(`  p${padL((p * 100).toFixed(0), 3)}  ${padL(q(p), 6)} places`)
}
console.log()

const BUCKETS: [number, number][] = [
  [1, 4],
  [5, 9],
  [10, 19],
  [20, 39],
  [40, 79],
  [80, 149],
  [150, 299],
  [300, 599],
  [600, Number.MAX_SAFE_INTEGER],
]
console.log('HISTOGRAM (past-peak weeks):')
for (const [lo, hi] of BUCKETS) {
  const n = withBelow.filter((v) => v >= lo && v <= hi).length
  const share = (100 * n) / Math.max(1, withBelow.length)
  const label = hi === Number.MAX_SAFE_INTEGER ? `${lo}+` : `${lo}-${hi}`
  console.log(`  ${pad(label, 10)} ${padL(n, 7)}  ${padL(share.toFixed(1), 5)}%  ${'#'.repeat(Math.round(share / 2))}`)
}
console.log()

const seasonVals = [...perSeason.values()].filter((v): v is number => v !== null && v > 0).sort((a, b) => a - b)
const sq = (p: number): number =>
  seasonVals.length ? seasonVals[Math.min(seasonVals.length - 1, Math.floor(p * seasonVals.length))]! : NaN
console.log(`PER BANKED SEASON (one row per career-season past the gate, n ${seasonVals.length}):`)
console.log(
  `  p25 ${sq(0.25)} · p33 ${sq(1 / 3)} · median ${sq(0.5)} · p66 ${sq(2 / 3)} · p75 ${sq(0.75)} · max ${seasonVals[seasonVals.length - 1] ?? '-'}`,
)
console.log()

console.log('CANDIDATE THRESHOLD PAIRS – the share of past-peak weeks each of the three rungs takes:')
const CANDIDATES: [number, number][] = [
  [10, 40],
  [10, 50],
  [15, 60],
  [20, 60],
  [20, 80],
  [25, 100],
  [30, 100],
  [40, 120],
  [50, 150],
  // ⭐ THE TERCILES OF THE PER-SEASON VIEW, and – the pair the engine ships – the terciles of the
  // WEEK-weighted one. Every other row here is a pair of round numbers, which is what "chosen"
  // looks like; these two are what the distribution itself says.
  [Math.max(1, Math.round(sq(1 / 3))), Math.max(2, Math.round(sq(2 / 3)))],
  [Math.max(1, Math.round(q(1 / 3))), Math.max(2, Math.round(q(2 / 3)))],
]
console.log(`  ${pad('far / way', 16)} ${padL('below', 8)} ${padL('far', 8)} ${padL('way', 8)}`)
for (const [far, way] of CANDIDATES) {
  const below = withBelow.filter((v) => v < far).length
  const mid = withBelow.filter((v) => v >= far && v < way).length
  const top = withBelow.filter((v) => v >= way).length
  const pc = (n: number) => `${((100 * n) / Math.max(1, withBelow.length)).toFixed(1)}%`
  console.log(`  ${pad(`${far} / ${way}`, 16)} ${padL(pc(below), 8)} ${padL(pc(mid), 8)} ${padL(pc(top), 8)}`)
}
console.log()

console.log('PHASE OCCUPANCY – which variant each third of the season would land on (past-peak weeks):')
const EARLY_END = Math.round(WEEKS_PER_YEAR / 3)
const MID_END = Math.round((2 * WEEKS_PER_YEAR) / 3)
const phaseOf = (sw: number) => (sw < EARLY_END ? 'early' : sw < MID_END ? 'mid' : 'late')
for (const phase of ['early', 'mid', 'late'] as const) {
  const rows = weekly.filter((s) => phaseOf(s.seasonWeek) === phase)
  const fell = rows.filter((s) => s.yearMove !== null && s.yearMove > 0).length
  const below = rows.filter((s) => s.belowBest !== null && s.belowBest > 0).length
  const pc = (n: number) => `${((100 * n) / Math.max(1, rows.length)).toFixed(1)}%`
  console.log(`  ${pad(phase, 7)} weeks ${padL(rows.length, 7)} · year fall true ${padL(pc(fell), 7)} · below-best true ${padL(pc(below), 7)}`)
}
console.log()
console.log(`season thirds: early 0-${EARLY_END - 1} · mid ${EARLY_END}-${MID_END - 1} · late ${MID_END}-${WEEKS_PER_YEAR - 1}`)

// ⚠ `--dump <path>` writes the sorted sample so the pair can be re-cut without walking 27 careers
// again (the walk is 9 minutes and fully deterministic, so the file is the same file every time).
const dumpAt = args.indexOf('--dump')
if (dumpAt >= 0 && args[dumpAt + 1]) {
  writeFileSync(args[dumpAt + 1]!, JSON.stringify({ weekly: sorted, perSeason: seasonVals }))
  console.log(`dumped ${sorted.length} week samples and ${seasonVals.length} season samples to ${args[dumpAt + 1]}`)
}
