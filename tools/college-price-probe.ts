// WHAT DOES THE THIRD ANSWER ACTUALLY COST, AND WHICH TERM IS THE BIG ONE?
//
//   npx vite-node tools/college-price-probe.ts -- [--seeds N]
//
// WHY THIS EXISTS. `docs/specs/college-as-a-second-act-2026-08.md` §2d measured four years at
// college banking **$152,243** against four years on tour banking **$45,544**, and finishing #290
// against #169. That probe was scratch and was not committed, and §6.1 handed the balance question
// to P6 with one instruction: name the lever, size it, do not pull it.
//
// ⚠ A NET FIGURE CANNOT NAME A LEVER. "+$152,243" is a difference of two much larger numbers, and
// which of them is doing the work decides what a compensation would even be:
//
//   * if college's advantage is EARNED, the lever is what the scholarship pays;
//   * if it is AVOIDED SPEND, the lever is what a tennis year costs a family – and the finding is
//     about the TOUR's economics, not about college at all.
//
// So this probe reports `careerTotals.earnedCents` and `careerTotals.spentCents` per arm, not just
// the funds delta. The decomposition IS the deliverable.
//
// METHOD. Two arms per seed, each walked from week 0 with a fresh stream, so both are byte-identical
// up to the fork by determinism and diverge only in the answer given there:
//   COLLEGE  – answerFork('college'), then four resumeFromCollege years
//   ON TOUR  – four years of stepCareerWeek under the same policy
// Only careers that reach the fork with the college answer still on the card are counted, which is
// the population the question is about.
//
// MEASUREMENT ONLY: nothing is patched and no engine number is written from here.
import { openCareer, stepCareerWeek, POLICIES, PRESETS, mean, median } from './econ-bench'
import { resumeFromCollege } from '../src/engine/world'
import { answerFork, collegeStillOpen } from '../src/engine/world/endings'
import { kidLadderRank } from '../src/engine/world/snapshot'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
/** 6 per preset = n 54, the n `college-as-a-second-act-2026-08.md` §2a measured on. */
const SEEDS = argOf('seeds', 6)
const YEARS = argOf('years', 4)
/** Far enough past the nineteenth birthday for the fork to have been raised on any seed. Week 0 is
 *  age 13.58, so 19.0 falls near week 282; 340 leaves a full season of slack and costs nothing. */
const WALK_CAP = argOf('cap', 340)
const POLICY = POLICIES[1]

interface Arm {
  fundsDelta: number
  earned: number
  spent: number
  prize: number
  rankAfter: number | null
  ended: string | null
}

/** Walk a fresh career to the week the fork is raised. Returns null if it never got there with the
 *  college answer still available – that career is not what this question is about. */
function toTheFork(preset: (typeof PRESETS)[number], i: number): { world: WorldState; rng: Rng } | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) {
      return collegeStillOpen(world) ? { world, rng } : null
    }
  }
  return null
}

function snapshot(world: WorldState): { funds: number; earned: number; spent: number; prize: number } {
  return {
    funds: world.fundsCents,
    earned: world.careerTotals.earnedCents,
    spent: world.careerTotals.spentCents,
    prize: world.careerTotals.prizeCents,
  }
}
function delta(world: WorldState, from: ReturnType<typeof snapshot>): Omit<Arm, 'rankAfter' | 'ended'> {
  const now = snapshot(world)
  return {
    fundsDelta: now.funds - from.funds,
    earned: now.earned - from.earned,
    spent: now.spent - from.spent,
    prize: now.prize - from.prize,
  }
}

const college: Arm[] = []
const tour: Arm[] = []
let reached = 0

for (let p = 0; p < PRESETS.length; p++) {
  for (let i = 0; i < SEEDS; i++) {
    if (toTheFork(PRESETS[p], i) === null) continue
    reached += 1

    // --- arm 1: college ---------------------------------------------------------------------
    {
      const at = toTheFork(PRESETS[p], i)!
      const from = snapshot(at.world)
      answerFork(at.world, 'college')
      for (let y = 0; y < YEARS; y++) resumeFromCollege(at.world, at.rng)
      college.push({
        ...delta(at.world, from),
        rankAfter: kidLadderRank(at.world, 'wta'),
        ended: at.world.ending ? at.world.ending.type : null,
      })
    }

    // --- arm 2: on tour ---------------------------------------------------------------------
    {
      const at = toTheFork(PRESETS[p], i)!
      const from = snapshot(at.world)
      // ⚠ THE FORK IS ANSWERED 'continue' RATHER THAN LEFT OPEN, so the two arms differ in the
      // ANSWER and not in whether a question is outstanding.
      answerFork(at.world, 'continue')
      for (let w = 0; w < YEARS * WEEKS_PER_YEAR; w++) {
        stepCareerWeek(at.world, at.rng, POLICY)
        if (at.world.ending) break
      }
      tour.push({
        ...delta(at.world, from),
        rankAfter: kidLadderRank(at.world, 'wta'),
        ended: at.world.ending ? at.world.ending.type : null,
      })
    }
  }
}

const usd = (c: number) => `${c < 0 ? '-' : ''}$${Math.abs(Math.round(c / 100)).toLocaleString('en-US')}`
const med = (xs: number[]) => (xs.length ? median(xs) : 0)
console.log(`\ncollege-price-probe · n=${reached} careers reached the fork with the answer open`)
console.log(`  (${PRESETS.length} presets x ${SEEDS} seeds, policy ${POLICY.id}, ${YEARS} years each arm)\n`)

console.log('OVER THE FOUR YEARS – median per career')
console.log(`  ${''.padEnd(22)}${'COLLEGE'.padStart(14)}${'ON TOUR'.padStart(14)}${'difference'.padStart(16)}`)
const line = (label: string, a: number[], b: number[]) =>
  console.log(`  ${label.padEnd(22)}${usd(med(a)).padStart(14)}${usd(med(b)).padStart(14)}${usd(med(a) - med(b)).padStart(16)}`)
line('funds delta', college.map((r) => r.fundsDelta), tour.map((r) => r.fundsDelta))
line('...of which EARNED', college.map((r) => r.earned), tour.map((r) => r.earned))
line('...of which SPENT', college.map((r) => r.spent), tour.map((r) => r.spent))
line('...prize inside that', college.map((r) => r.prize), tour.map((r) => r.prize))

const ranked = (xs: Arm[]) => xs.filter((r) => r.rankAfter !== null).map((r) => r.rankAfter as number)
console.log(
  `\n  professional rank after   college ${ranked(college).length ? `#${Math.round(med(ranked(college)))} (${ranked(college).length}/${college.length} ranked)` : `unranked (0/${college.length})`}` +
    `   ·   tour ${ranked(tour).length ? `#${Math.round(med(ranked(tour)))} (${ranked(tour).length}/${tour.length} ranked)` : `unranked (0/${tour.length})`}`,
)
console.log(
  `  careers that ENDED        college ${college.filter((r) => r.ended !== null && r.ended !== 'college').length}/${college.length}   ·   tour ${tour.filter((r) => r.ended !== null).length}/${tour.length}`,
)

console.log('\n⭐ THE DECOMPOSITION – which term carries the difference')
const dEarn = med(college.map((r) => r.earned)) - med(tour.map((r) => r.earned))
const dSpend = med(tour.map((r) => r.spent)) - med(college.map((r) => r.spent))
console.log(`  college earns LESS by            ${usd(-dEarn)}`)
console.log(`  college avoids SPENDING          ${usd(dSpend)}`)
console.log(`  net advantage to college         ${usd(dEarn + dSpend)}`)
console.log(`  ⚠ per YEAR that avoided spend is ${usd(dSpend / YEARS)} – THAT is the size of the lever.`)
console.log(`  mean funds delta: college ${usd(mean(college.map((r) => r.fundsDelta)))} · tour ${usd(mean(tour.map((r) => r.fundsDelta)))}`)
