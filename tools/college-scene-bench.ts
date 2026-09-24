// ⭐⭐⭐ THE COLLEGE SCENE, MEASURED – the four walked rows of the spec's §6, predicted beside found.
//
//   npx vite-node tools/college-scene-bench.ts                 (16 careers, both arms)
//   npx vite-node tools/college-scene-bench.ts -- --careers 32
//
// `docs/specs/the-college-scene-2026-09.md` §6, task T5; the rulings the wave was built under are
// `docs/plans/college-scene-rulings-2026-09.md`.
//
// ⚠⚠ EVERY ROW PRINTS ITS PREDICTION BESIDE ITS MEASUREMENT, and the prediction is the SPEC's rather
// than this file's – `tools/dynasty-bench.ts`'s own law, which is `docs/specs/rank-plateau.md`'s
// lesson applied before the fact instead of after. A bench that printed only what it found would let
// §6 be filled in from whatever came out, which is what invariant 5 exists to refuse.
//
// ⚠ MEASUREMENT ONLY. Nothing under `src/` is touched, no constant is patched – not even in memory –
// and no save is written. Rows 1 and 4 are ASSERTIONS ABOUT THE SHIPPED CODE (a disagreement is a
// defect and prints ⚠⚠); rows 2 and 3 are the two numbers nobody has ever measured, which is why
// their predictions are marked coarse in the spec.
//
// ⚠ ZERO RNG DISCIPLINE: nothing here touches MAIN in a way the frozen capture can see. Careers are
// opened and stepped through the shipped bench harness (`openCareer` / `stepCareerWeek`), exactly as
// `tools/college-year-content.ts` and `tools/dynasty-bench.ts` do.
//
// ⚠⚠ ONE DISTINCT SEED PER CAREER, and `college-year-content.ts` learned this the hard way:
// `openCareer` builds its seed as `bench-${preset.background}-${index}` and `PRESETS` holds nine
// presets over only three backgrounds, so a nested loop hands three careers the same seed and the
// same sub-streams. A GLOBAL index is what makes n mean n.
import { dynastyBackgroundOf, dynastyHandoverOf, pendingBirthday, resumeFromCollege } from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { COLLEGE_LEAGUE, wonTheLeague } from '../src/engine/collegeLeague'
import { finishedTheCourse } from '../src/shared/avatarEmotion'
import { ENDINGS } from '../src/engine/ending'
import type { Rng } from '../src/engine/rng'
import type { WorldState } from '../src/engine/world'
import type { FamilyBackground } from '../src/shared/protocol'
import { answerBirthdayNeutral } from './_birthday'
import { drainLifeBeats } from './_lifeBeats'
/** ⚠ THE SHARED REVEAL DRAIN, and its own file says why a walker without it banks nothing. */
import { drainReveals } from './_reveals'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'

const args = process.argv.slice(2)
const numOf = (name: string, fallback: number): number => {
  const at = args.indexOf(`--${name}`)
  return at >= 0 && args[at + 1] ? Number(args[at + 1]) : fallback
}
const CAREERS = numOf('careers', 16)
/** the fork is raised the week school ends – reached inside 400 weeks or the career ended first */
const FORK_CAP = 400
/** and after college she is back on the tour: long enough for an ending to arrive on its own */
const END_CAP = 1400
/** ⭐⭐ THE PLAYER'S OWN POLICY, PLUS THE ONE FLAG THAT LETS A CAREER **END** – and it is a
 *  correctness note rather than a preference. Neither shipped policy sets `answerRetirementOffers`,
 *  so a walk on `POLICIES[1]` alone ends only where an AUTOMATIC ending fires (bankruptcy, a
 *  career-ending injury): measured on the smoke run, one control career of two was still playing at
 *  the 1400-week cap. Row 4 is a claim about walked ENDINGS, so the walk has to be able to reach one,
 *  and `answerRetirement(world, offer.final)` is the player-shaped answer – «one more year» while it
 *  is a question, stop the year it stops being one. */
const POLICY = { ...POLICIES[1], answerRetirementOffers: true }

const pad = (s: string | number, n: number): string => String(s).padStart(n)
const padE = (s: string | number, n: number): string => String(s).padEnd(n)
const pct = (a: number, b: number): string => (b === 0 ? '   – ' : `${((100 * a) / b).toFixed(1)}%`)

interface Lived {
  label: string
  /** 'college' or 'continue' – which answer this arm gave at nineteen */
  arm: string
  /** banked college years, 0 on the control arm */
  years: number
  /** banked years whose run is a title (`wonTheLeague`) */
  titles: number
  /** banked years that really held a championship – a year cut short before week 12 holds none */
  yearsWithRun: number
  graduated: boolean
  ended: boolean
  endingKind: string
  fundsCents: number
  /** the band her own account maps to, with no floor on it – `dynastyBackgroundOf`, unchanged */
  rawBand: FamilyBackground
  /** the band the SHIPPED handover carries – the floor's effect is exactly `band !== rawBand` */
  band: FamilyBackground
  /** the count the handover carries (schema v89) */
  collegeTitles: number
}

/** ⚠ THE BANKED COUNT, RE-DERIVED HERE rather than trusted off the block – which is the cheapest
 *  possible statement that the fold and the record cannot disagree (row 4). */
function bankedTitles(world: WorldState): { titles: number; years: number; withRun: number } {
  const years = world.college?.years ?? []
  let titles = 0
  let withRun = 0
  for (const year of years) {
    const run = year.league
    if (!run) continue
    withRun += 1
    if (wonTheLeague(run)) titles += 1
  }
  return { titles, years: years.length, withRun }
}

function readLived(world: WorldState, label: string, arm: string): Lived {
  const banked = bankedTitles(world)
  const block = dynastyHandoverOf(world)
  const college = world.college
  return {
    label,
    arm,
    years: banked.years,
    titles: banked.titles,
    yearsWithRun: banked.withRun,
    graduated: college?.doneWeek != null && finishedTheCourse(banked.years, ENDINGS.collegeYears),
    ended: world.ending !== null,
    endingKind: world.ending?.type ?? '',
    fundsCents: world.kidFundsCents,
    rawBand: dynastyBackgroundOf(world.kidFundsCents),
    band: block.background,
    collegeTitles: block.motherCareer.collegeTitles,
  }
}

function walkToFork(preset: (typeof PRESETS)[number], index: number): { world: WorldState; rng: Rng; label: string } | null {
  const { world, rng } = openCareer(preset, index, POLICY)
  for (let w = 0; w < FORK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng, label: `${preset.background}-${index}` }
  }
  return null
}

/** Walk one career to an ENDING, draining the questions that block a week. ⚠ THE DRAINS ARE NOT
 *  DECORATION: a pending birthday and an unanswered life beat both stop the loop, and a walk without
 *  them measures how far a blocked career gets rather than how a career ends. */
function walkToEnding(world: WorldState, rng: Rng): void {
  for (let w = 0; w < END_CAP && world.ending === null; w++) {
    drainLifeBeats(world)
    drainReveals(world)
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    stepCareerWeek(world, rng, POLICY)
  }
}

/** THE COLLEGE ARM – the fork answered `college`, the four years spent the way Home's «Another year»
 *  spends them, and then back on the tour until the story stops. */
function liveCollege(at: { world: WorldState; rng: Rng; label: string }): Lived {
  const world = structuredClone(at.world)
  const rng = at.rng
  drainLifeBeats(world)
  answerFork(world, 'college')
  // ROUND 24 #5: the answer only RESERVES the place – walk the gap to the September departure.
  for (let gap = 0; gap < 54 && world.ending === null; gap++) stepCareerWeek(world, rng, POLICIES[0])
  // The year pauses on her birthday week and on the championship's own reveal – press, answer, press.
  for (let press = 0; press < 6 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    drainLifeBeats(world)
    drainReveals(world)
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
    resumeFromCollege(world, rng)
  }
  walkToEnding(world, rng)
  return readLived(world, at.label, 'college')
}

/** THE CONTROL ARM – the same career, the direct answer, walked to its own ending. ⚠ IT IS NOT A
 *  DRAW-PAIRED TWIN of the college arm (both arms are stepped off the same `Rng`, which is
 *  `college-year-content.ts`'s own arrangement for its tier arm), and row 1's control claim does not
 *  need one: «a career with no degree reads exactly what her account maps to» is a predicate on the
 *  ending it reached, not a comparison between two arms. */
function liveContinue(at: { world: WorldState; rng: Rng; label: string }): Lived {
  const world = structuredClone(at.world)
  const rng = at.rng
  drainLifeBeats(world)
  answerFork(world, 'continue')
  walkToEnding(world, rng)
  return readLived(world, at.label, 'continue')
}

// =================================================================================================
const t0 = Date.now()
const forks: Array<{ world: WorldState; rng: Rng; label: string }> = []
for (let k = 0; forks.length < CAREERS && k < CAREERS * 4; k++) {
  const at = walkToFork(PRESETS[k % PRESETS.length], k)
  if (at) forks.push(at)
}
console.log(`\n⭐⭐⭐ THE COLLEGE SCENE, MEASURED – ${forks.length} careers reached the fork at nineteen`)
if (forks.length < CAREERS) console.log(`  ⚠ asked for ${CAREERS}; the rest ended before the fork was raised`)

const college: Lived[] = []
const control: Lived[] = []
for (const at of forks) {
  college.push(liveCollege(at))
  control.push(liveContinue(at))
}

const graduates = college.filter((r) => r.graduated)
const collegeYears = college.reduce((s, r) => s + r.years, 0)
const yearsWithRun = college.reduce((s, r) => s + r.yearsWithRun, 0)
const titles = college.reduce((s, r) => s + r.titles, 0)

console.log(`\n  college arm   ${college.length} careers, ${collegeYears} banked years, ${graduates.length} graduated`)
console.log(`  control arm   ${control.length} careers, ${control.filter((r) => r.ended).length} reached an ending`)
console.log(`  ⚠ years that really held a championship: ${yearsWithRun} of ${collegeYears} – a year cut short before`)
console.log(`    week ${COLLEGE_LEAGUE.seasonWeek} came round holds none – the record of a year that was lived`)

// --- row 1 – the floor ---------------------------------------------------------------------------
console.log(`\n1. THE FLOOR – the graduate's shelf reads no lower than 'middle' (spec §6 row 1)`)
console.log(`   predicted: 100% of graduates read middle or better, 0 non-college careers moved`)
const order: Record<FamilyBackground, number> = { working: 0, middle: 1, wealthy: 2 }
const atOrAbove = graduates.filter((r) => order[r.band] >= order.middle)
const moved = graduates.filter((r) => r.band !== r.rawBand)
const controlMoved = control.filter((r) => r.band !== r.rawBand)
console.log(`   measured : ${atOrAbove.length} of ${graduates.length} graduates at or above middle   ${pct(atOrAbove.length, graduates.length)}`)
console.log(`              ${moved.length} of ${graduates.length} were LIFTED by the clause (their account maps lower)   ${pct(moved.length, graduates.length)}`)
console.log(`              ${controlMoved.length} of ${control.length} non-college careers moved`)
if (atOrAbove.length !== graduates.length) console.log(`   ⚠⚠ a graduate below middle is a DEFECT in the clause, not a finding`)
if (controlMoved.length > 0) console.log(`   ⚠⚠ a non-college career moved – the clause is reading the biography, not the degree`)
console.log(`   ${padE('band', 10)}${pad('raw', 8)}${pad('shipped', 10)}   (graduates only)`)
for (const band of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
  const raw = graduates.filter((r) => r.rawBand === band).length
  const ship = graduates.filter((r) => r.band === band).length
  console.log(`   ${padE(band, 10)}${pad(raw, 8)}${pad(ship, 10)}`)
}

// --- row 2 – the title share, per YEAR -----------------------------------------------------------
console.log(`\n2. THE TITLE SHARE PER COLLEGE YEAR (spec §6 row 2)`)
console.log(`   predicted: coarse 15–35% (field standard 56 under her year-2+ skill, three wins at`)
console.log(`              draw 8) – confidence low, the measurement is the point`)
console.log(`   measured : ${titles} titles over ${yearsWithRun} years that held a championship   ${pct(titles, yearsWithRun)}`)
console.log(`              (over all ${collegeYears} banked years, including the ones that held none: ${pct(titles, collegeYears)})`)

// --- row 3 – the title share, per CAREER ---------------------------------------------------------
console.log(`\n3. THE SHARE OF COLLEGE CAREERS WITH AT LEAST ONE TITLE (spec §6 row 3)`)
console.log(`   predicted: above row 2, coarse 40–70%`)
const withTitle = college.filter((r) => r.titles > 0)
console.log(`   measured : ${withTitle.length} of ${college.length} careers   ${pct(withTitle.length, college.length)}`)
for (const n of [0, 1, 2, 3, 4]) {
  const k = college.filter((r) => r.titles === n).length
  if (k) console.log(`              ${n} title${n === 1 ? ' ' : 's'}   ${pad(k, 3)} careers   ${pct(k, college.length)}`)
}

// --- row 4 – the handover's count ----------------------------------------------------------------
console.log(`\n4. THE HANDOVER'S collegeTitles EQUALS THE BANKED COUNT (spec §6 row 4)`)
console.log(`   predicted: equality on every walked ending – a disagreement is a defect`)
const disagreements = [...college, ...control].filter((r) => r.collegeTitles !== r.titles)
console.log(`   measured : ${disagreements.length} disagreements over ${college.length + control.length} walked careers`)
for (const row of disagreements) {
  console.log(`   ⚠⚠ ${row.label} (${row.arm}): the block says ${row.collegeTitles}, the record holds ${row.titles}`)
}
console.log(`              control arm carries ${control.reduce((s, r) => s + r.collegeTitles, 0)} college titles in total (0 is the only honest value)`)

console.log(`\n  ${((Date.now() - t0) / 1000).toFixed(0)}s\n`)
