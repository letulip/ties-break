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
import { answerFork } from '../src/engine/world/endings'
// ⚠⚠ THE COLLEGE COLUMN BELOW IS A COUNTERFACTUAL SINCE 16.08.2026, NOT A READING OF THE SHIPPED
// GAME. The owner removed the rule that closed the college door on a result («Колледж – это
// независимая ветка карьеры … альтернативная»); in the game as it ships the third answer is on the
// fork card in 100% of careers. What this file prints is what the PRE-16.08 rule WOULD have done on
// this population, kept so the frozen battery's arms stay comparable on the dimension the
// junior-access phases moved most. `tools/retired-college-rule.ts` is the one definition of it.
import { retiredCollegeDoorOpen } from './retired-college-rule'
import { kidLadderRank } from '../src/engine/world/snapshot'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'
import type { FamilyBackground } from '../src/shared/protocol'

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
/** ⚠ `--all` COUNTS EVERY CAREER THAT REACHES THE FORK – the shipped population, in which the third
 *  answer is always on the card. Default OFF so P5's figure stays reproducible: see `toTheFork`. */
const ALL = args.includes('--all')

interface Arm {
  /** the family this career was run on – the owner's question of 16.08 is a split by this column */
  background: FamilyBackground
  /** ⭐ v51: what the offer quoted her at the fork, and what the four years actually charged */
  offerFamilyPerYearCents: number
  offerAthleticShare: number
  offerNeedShare: number
  offerProgramme: string
  tuitionPaid: number
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
      // ⚠⚠ THE FILTER IS RE-AIMED, NOT DELETED (v51, docs/specs/what-the-college-place-costs-2026-08.md).
      //
      // This line used to be unconditional: only a career the RETIRED pre-16.08 rule would have left
      // the door open for was counted. That was right when the rule shipped and it is the population
      // P5's $152,243 / $45,544 was measured on – so `--all` is OFF by default and the historical
      // figure stays reproducible byte for byte.
      //
      // ⚠ BUT IT IS NOW THE WRONG POPULATION FOR THE QUESTION. The shipped game puts the third answer
      // on the card in 100% of careers, and the retired rule fires in 81 of 90 of them
      // (`college-is-its-own-branch-2026-08.md` §3e) – so the default arm measures the ~9 careers of
      // 90 that never posted a counting W75+ result, i.e. the weakest tail, and calls it "the
      // population the question is about". With a tuition bill in the game that is no longer a
      // harmless narrowing: the bill scales with her JUNIOR record, and the retired filter selects on
      // her PROFESSIONAL one. **Run `--all` for the shipped population and quote both.**
      if (ALL || retiredCollegeDoorOpen(world)) return { world, rng }
      return null
    }
  }
  return null
}

/** ⭐ v51 – what the family has actually paid in tuition so far, off the ledger's own rows. Read from
 *  `financeWeeks` rather than reconstructed from the offer, so a bug in the weekly debit shows up as a
 *  disagreement between the quoted bill and the charged one rather than being hidden by arithmetic. */
function tuitionSoFar(world: WorldState): number {
  let sum = 0
  for (const w of world.financeWeeks) sum += w.byCategory.tuition ?? 0
  return sum
}

function snapshot(world: WorldState): { funds: number; earned: number; spent: number; prize: number } {
  return {
    funds: world.fundsCents,
    earned: world.careerTotals.earnedCents,
    spent: world.careerTotals.spentCents,
    prize: world.careerTotals.prizeCents,
  }
}
/** ⚠ THE FOUR MONEY FIELDS ONLY. It used to read `Omit<Arm, 'rankAfter' | 'ended'>`, which was fine
 *  while those were the whole row; v51 added six descriptive columns and an `Omit` would have had the
 *  spread silently overwrite every one of them with a delta. Named explicitly so it cannot again. */
interface MoneyDelta {
  fundsDelta: number
  earned: number
  spent: number
  prize: number
}

function delta(world: WorldState, from: ReturnType<typeof snapshot>): MoneyDelta {
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
      const offer = at.world.fork?.offer ?? null
      const tuitionBefore = tuitionSoFar(at.world)
      answerFork(at.world, 'college')
      for (let y = 0; y < YEARS; y++) resumeFromCollege(at.world, at.rng)
      college.push({
        background: PRESETS[p].background,
        offerFamilyPerYearCents: offer?.familyPerYearCents ?? 0,
        offerAthleticShare: offer?.athleticShare ?? 0,
        offerNeedShare: offer?.needShare ?? 0,
        offerProgramme: offer?.programme ?? 'walk-on',
        tuitionPaid: tuitionSoFar(at.world) - tuitionBefore,
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
        background: PRESETS[p].background,
        offerFamilyPerYearCents: 0,
        offerAthleticShare: 0,
        offerNeedShare: 0,
        offerProgramme: 'n/a',
        tuitionPaid: 0,
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

// =================================================================================================
// ⭐⭐ v51 – THE BILL, AND WHETHER IT READS THE FAMILY (docs/specs/what-the-college-place-costs-2026-08.md)
// =================================================================================================
//
// ⚠ THE POPULATION IS PRINTED BESIDE EVERY ROW ON PURPOSE. `the-ladder-is-monotone-2026-08.md` §3c is
// the standing warning: a median over a population that grew is not a comparison. Here the risk is
// sharper still, because the default arm filters on the RETIRED rule (see `toTheFork`) and that rule
// selects on her PROFESSIONAL record while the bill is priced off her JUNIOR one.
console.log(`\n⭐⭐ THE COLLEGE BILL (v51) – n=${college.length}${ALL ? '  [--all: every career reaching the fork, the SHIPPED population]' : '  [default: only careers the RETIRED pre-16.08 rule would have left open]'}`)
console.log(`  ${'quoted at the fork'.padEnd(26)}${usd(med(college.map((r) => r.offerFamilyPerYearCents))).padStart(14)} a year   ·  x${YEARS} = ${usd(med(college.map((r) => r.offerFamilyPerYearCents)) * YEARS)}`)
// ⚠⚠ THE LEDGER READ IS TRUNCATED BY THE FINANCE WINDOW AND CANNOT TOTAL FOUR YEARS. `financeWeeks`
// keeps a rolling ~60-week window, so this sees roughly the last season of tuition and not all 208
// weeks of it – measured, it comes back at about 38% of the quoted bill, which is 60/208. It is
// printed anyway, and negated to a positive spend, because it is the only INDEPENDENT check that the
// weekly debit fires at all: a zero here beside a non-zero quote would mean the bill was quoted and
// never charged. Do not read it as the four-year total; that is the row above.
console.log(`  ${'charged in the last ~60wk'.padEnd(26)}${usd(-med(college.map((r) => r.tuitionPaid))).padStart(14)}   ← off the LEDGER; a rolling window, NOT the 4-year total`)
const freeRides = college.filter((r) => r.offerFamilyPerYearCents === 0).length
console.log(`  ${'free rides'.padEnd(26)}${String(freeRides).padStart(14)} / ${college.length}`)
console.log(`\n  WHICH PROGRAMME OFFERED (n=${college.length})`)
for (const g of ['strong', 'solid', 'small', 'walk-on']) {
  const k = college.filter((r) => r.offerProgramme === g)
  if (k.length === 0) continue
  console.log(`    ${g.padEnd(10)}${String(k.length).padStart(4)} / ${college.length}   athletic ${(100 * mean(k.map((r) => r.offerAthleticShare))).toFixed(1)}%   bill ${usd(med(k.map((r) => r.offerFamilyPerYearCents)))}/yr`)
}
console.log(`\n  ⭐⭐ BY FAMILY BACKGROUND – the athletic column must be FLAT if the award is merit-only`)
console.log(`    ${'background'.padEnd(11)}${'n'.padStart(4)}${'athletic %'.padStart(12)}${'need %'.padStart(9)}${'bill/yr'.padStart(12)}${'over ' + YEARS + 'y'.padStart(3)}`)
for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
  const g = college.filter((r) => r.background === b)
  if (g.length === 0) continue
  const perYear = med(g.map((r) => r.offerFamilyPerYearCents))
  console.log(
    `    ${b.padEnd(11)}${String(g.length).padStart(4)}` +
      `${(100 * mean(g.map((r) => r.offerAthleticShare))).toFixed(1).padStart(12)}` +
      `${(100 * mean(g.map((r) => r.offerNeedShare))).toFixed(1).padStart(9)}` +
      `${usd(perYear).padStart(12)}${usd(perYear * YEARS).padStart(12)}`,
  )
}
console.log(`\n  AND THE SAME THREE ON THE FUNDS DELTA THE FOUR YEARS ACTUALLY PRODUCED`)
for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
  const c = college.filter((r) => r.background === b)
  const t = tour.filter((r) => r.background === b)
  if (c.length === 0) continue
  console.log(`    ${b.padEnd(11)}${String(c.length).padStart(4)}   college ${usd(med(c.map((r) => r.fundsDelta))).padStart(12)}   ·   tour ${usd(med(t.map((r) => r.fundsDelta))).padStart(12)}   ·   college ahead by ${usd(med(c.map((r) => r.fundsDelta)) - med(t.map((r) => r.fundsDelta)))}`)
}
console.log(`\n  ⚠ EVERY CAREER HERE IS country 'US' – the bench's own profile. A non-American faces the`)
console.log(`    out-of-state sticker and NO need-based layer at all (34 CFR 668.33), so these are the`)
console.log(`    CHEAPEST bills the college branch can produce.`)
