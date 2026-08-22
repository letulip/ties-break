// ⭐⭐⭐ WHAT IS ACTUALLY IN A COLLEGE YEAR – the measurement round 24's student-championship item
// came out of, and the one it has to be judged in (docs/plans/college-as-a-place.md §3, the owner's
// «как минимум 1 турнир в год колледжа был»).
//
//   npx vite-node tools/college-year-content.ts                (12 careers × 4 years = 48 years)
//   npx vite-node tools/college-year-content.ts -- --careers 24
//   npx vite-node tools/college-year-content.ts -- --tiers     (the floor, at every tier)
//
// ⚠⚠ THE STATE OF THINGS THAT PRODUCED THE ITEM, measured over 12 careers × 4 years:
//   * THREE marked weeks in fifty-two – two squad trips (`COLLEGE_TRIP_WEEKS`) and one call-up.
//   * The two trips WRITE NO ROWS and cannot be watched; they only feed `growWeek`'s
//     `matchesThisWeek`, so nothing on the calendar answers a tap.
//   * The call-up was a BARE ROLL at 40%: it landed in 19 of 48 years and she took the court in 17.
//   * **0.71 watchable matches per college year.** On two thirds of college years the calendar held
//     one openable row and it was empty.
//
// ⚠⚠ THIS FILE READS THE WORLD AND NOT THE FEATURE, WHICH IS WHAT MAKES IT AN A/B INSTRUMENT RATHER
// THAN A VICTORY LAP. It imports no symbol this round added: every number below comes from
// `world.college.years` and from `match` rows in `world.events`, both of which exist unchanged on
// the commit before the change. So the SAME FILE runs on an arm with the student championship
// reverted and prints the same table – which is the only way a before/after here is worth anything
// (CLAUDE.md: "a null result is a claim and needs the same provenance check as a positive one", and
// the control is your own change reverted, never a different tool on a different tree).
//
// ⚠ MEASUREMENT ONLY. Nothing under `src/` is touched and no save is written.
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'
import { chooseGift, pendingBirthday, resumeFromCollege } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { NATIONAL_TEAM } from '../src/engine/nationalTeam'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { COLLEGE_TIER_ORDER } from '../src/engine/collegeOffer'
import { ENDINGS } from '../src/engine/ending'
import type { Rng } from '../src/engine/rng'
import type { WorldState } from '../src/engine/world'
import type { CollegeTier } from '../src/shared/protocol'

const args = process.argv.slice(2)
const numOf = (n: string, d: number): number => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const CAREERS = numOf('careers', 12)
const TIERS_ARM = args.includes('--tiers')
const POLICY = POLICIES[1]
const WALK_CAP = 400

const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const pct = (a: number, b: number) => (b === 0 ? '   – ' : `${((100 * a) / b).toFixed(0)}%`)

/** ⚠ READ OFF THE PERSISTED YEAR AND THE FEED, NEVER OFF A CONSTANT THIS ROUND INTRODUCED. `league`
 *  is typed loose on purpose: it is `undefined` on the arm where the feature does not exist, which
 *  is exactly the arm this file has to be able to run on. */
interface YearRow {
  career: string
  index: number
  fromWeek: number
  untilWeek: number
  /** ⚠ DID THE YEAR RUN ITS FULL FIFTY-TWO WEEKS? A year cut short by a career-ending event – she
   *  is playing a lot of tennis and an injury can land – is banked as it stood, and if it ended
   *  before `COLLEGE_LEAGUE.seasonWeek` came round it genuinely held no championship. The floor is
   *  a claim about a year that was LIVED, so this column is what keeps it honest. */
  full: boolean
  /** how many of the year's competitions actually happened – the owner's «минимум 1, максимум 2» */
  tournaments: number
  /** how many `match` rows the year wrote that the player can open in `MatchReplay` */
  watchable: number
  calledUp: boolean
  /** she was named AND took the court */
  onCourt: boolean
  /** rounds won at the student championship of THIS year, or null where there was none */
  leagueRoundsWon: number | null
  /** ⭐ THE RESULT THE SELECTORS ACTUALLY HAD IN FRONT OF THEM on this year's call-up week – the most
   *  recent championship played STRICTLY BEFORE it, which is usually this year's and, for two
   *  enrolment weeks in fifty-two, last year's or none at all. */
  readRoundsWon: number | null
}

/** The world week inside `[from, until)` whose season week is `seasonWeek`. Exactly one exists in a
 *  52-week span, which is the arithmetic the whole guarantee rests on. */
function weekOfSeasonWeek(from: number, until: number, seasonWeek: number): number | null {
  for (let w = from; w < until; w++) if (w % WEEKS_PER_YEAR === seasonWeek) return w
  return null
}

function rowsFor(world: WorldState, career: string): YearRow[] {
  const college = world.college
  if (!college) return []
  const runs: Array<{ week: number; roundsWon: number }> = []
  for (const y of college.years) {
    const league = (y as { league?: { week: number; roundsWon: number } | null }).league ?? null
    if (league) runs.push({ week: league.week, roundsWon: league.roundsWon })
  }
  return college.years.map((y) => {
    const league = (y as { league?: { week: number; roundsWon: number } | null }).league ?? null
    const watchable = world.events.filter(
      (e) =>
        e.match !== undefined &&
        e.week >= y.fromWeek &&
        e.week < y.untilWeek &&
        (e.match.eventId.startsWith('nations-w') || e.match.eventId.startsWith('college-w')),
    ).length
    const callWeek = weekOfSeasonWeek(y.fromWeek, y.untilWeek, NATIONAL_TEAM.seasonWeek)
    const before = callWeek === null ? [] : runs.filter((r) => r.week < callWeek)
    return {
      career,
      index: y.index,
      fromWeek: y.fromWeek,
      untilWeek: y.untilWeek,
      full: y.untilWeek - y.fromWeek >= WEEKS_PER_YEAR,
      tournaments: (y.callUp ? 1 : 0) + (league ? 1 : 0),
      watchable,
      calledUp: y.callUp !== null,
      onCourt: (y.callUp?.rubbersPlayed ?? 0) > 0,
      leagueRoundsWon: league?.roundsWon ?? null,
      readRoundsWon: before.length ? before[before.length - 1].roundsWon : null,
    }
  })
}

function walkToFork(preset: (typeof PRESETS)[number], i: number): { world: WorldState; rng: Rng; label: string } | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng, label: `${preset.background}-${i}` }
  }
  return null
}

/** One career, four years, exactly as the Home shell's «Another year» spends them. */
function walkCollege(at: { world: WorldState; rng: Rng; label: string }, tier?: CollegeTier): YearRow[] {
  const world = structuredClone(at.world)
  const rng = at.rng
  answerFork(world, 'college', tier)
  // Round 24: the year pauses on her birthday week – press, answer, press again.
  for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  return rowsFor(world, at.label)
}

// =================================================================================================
const t0 = Date.now()
// ⚠⚠ ONE DISTINCT SEED PER CAREER, AND THE FIRST DRAFT OF THIS LOOP DID NOT HAVE IT. `openCareer`
// builds its seed as `bench-${preset.background}-${index}`, and `PRESETS` holds NINE presets over
// only THREE backgrounds – so the obvious nested loop (`for index { for preset }`) hands three
// different careers the SAME seed, hence the same `seed:callup:<week>` sub-stream, hence identical
// letters at identical weeks. It looks like 400 samples and behaves like 140: the call-up rate came
// out 3.7 standard deviations under its own ladder purely from the duplication. A GLOBAL index
// makes every seed distinct, which is what the rate columns below need to mean anything.
const forks: Array<{ world: WorldState; rng: Rng; label: string }> = []
for (let k = 0; forks.length < CAREERS && k < CAREERS * 4; k++) {
  const at = walkToFork(PRESETS[k % PRESETS.length], k)
  if (at) forks.push(at)
}
if (forks.length < CAREERS) console.log(`  ⚠ only ${forks.length} careers reached the fork`)

const rows: YearRow[] = []
for (const at of forks) rows.push(...walkCollege(at))

console.log(`\n⭐⭐ WHAT A COLLEGE YEAR CONTAINS – ${forks.length} careers × ${ENDINGS.collegeYears} years = ${rows.length} college years`)
console.log(`  ${'-'.repeat(96)}`)
const shortYears = rows.filter((r) => !r.full)
if (shortYears.length) {
  console.log(
    `  ⚠ ${shortYears.length} of them were CUT SHORT by an ending (a career-ending injury, bankruptcy) and are` +
      ` excluded from the floor below – they held ${shortYears.filter((r) => r.tournaments === 0).length} year(s) with no tournament at all`,
  )
}
const full = rows.filter((r) => r.full)
console.log(
  `  tournaments per FULL college year   min ${Math.min(...full.map((r) => r.tournaments))}` +
    `   max ${Math.max(...full.map((r) => r.tournaments))}` +
    `   over ${full.length} years`,
)
console.log(
  `  tournaments per college year   min ${Math.min(...rows.map((r) => r.tournaments))}` +
    `   max ${Math.max(...rows.map((r) => r.tournaments))}` +
    `   mean ${(rows.reduce((s, r) => s + r.tournaments, 0) / rows.length).toFixed(2)}`,
)
for (const n of [0, 1, 2, 3]) {
  const k = rows.filter((r) => r.tournaments === n).length
  console.log(`      ${n} tournament${n === 1 ? ' ' : 's'}   ${pad(k, 4)} years   ${pct(k, rows.length)}`)
}
const watch = rows.reduce((s, r) => s + r.watchable, 0)
console.log(
  `\n  watchable matches per year     ${(watch / rows.length).toFixed(2)}` +
    `   (${watch} over ${rows.length} years, min ${Math.min(...rows.map((r) => r.watchable))}, max ${Math.max(...rows.map((r) => r.watchable))})`,
)
console.log(`      years with NO watchable match  ${pad(rows.filter((r) => r.watchable === 0).length, 4)}   ${pct(rows.filter((r) => r.watchable === 0).length, rows.length)}`)
const called = rows.filter((r) => r.calledUp).length
const onCourt = rows.filter((r) => r.onCourt).length
console.log(`\n  call-up landed                 ${pad(called, 4)} / ${rows.length}   ${pct(called, rows.length)}`)
console.log(`  ...and she took the court      ${pad(onCourt, 4)} / ${rows.length}   ${pct(onCourt, rows.length)}`)

console.log(`\n⭐⭐⭐ DOES THE LETTER FOLLOW THE CHAMPIONSHIP? – grouped by the result the selectors READ`)
console.log(`  ${padE('championship read on the call-up week', 40)}${pad('years', 7)}${pad('called', 8)}${pad('rate', 8)}`)
console.log(`  ${'-'.repeat(63)}`)
const groups: Array<[string, (r: YearRow) => boolean]> = [
  ['none on record', (r) => r.readRoundsWon === null],
  ['out in the first round (0 wins)', (r) => r.readRoundsWon === 0],
  ['1 win', (r) => r.readRoundsWon === 1],
  ['2 wins (lost the final)', (r) => r.readRoundsWon === 2],
  ['3 wins (champion)', (r) => r.readRoundsWon === 3],
]
for (const [label, test] of groups) {
  const g = rows.filter(test)
  if (!g.length) continue
  const c = g.filter((r) => r.calledUp).length
  console.log(`  ${padE(label, 40)}${pad(g.length, 7)}${pad(c, 8)}${pad(pct(c, g.length), 8)}`)
}

console.log(`\n  championship result distribution (this year's own run):`)
for (const n of [null, 0, 1, 2, 3]) {
  const k = rows.filter((r) => r.leagueRoundsWon === n).length
  if (!k) continue
  console.log(`      ${padE(n === null ? 'none' : `${n} wins`, 10)}${pad(k, 4)} years   ${pct(k, rows.length)}`)
}

if (TIERS_ARM) {
  console.log(`\n⭐ THE FLOOR AT EVERY TIER – the guarantee is not a property of the dear places`)
  for (const tier of COLLEGE_TIER_ORDER) {
    const tRows: YearRow[] = []
    for (const at of forks) tRows.push(...walkCollege(at, tier))
    const min = Math.min(...tRows.map((r) => r.tournaments))
    const max = Math.max(...tRows.map((r) => r.tournaments))
    const w = tRows.reduce((s, r) => s + r.watchable, 0)
    console.log(
      `  ${padE(tier, 10)}${tRows.length} years   tournaments ${min}..${max}   ` +
        `watchable/year ${(w / tRows.length).toFixed(2)}   call-up ${pct(tRows.filter((r) => r.calledUp).length, tRows.length)}`,
    )
  }
}

console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`)
