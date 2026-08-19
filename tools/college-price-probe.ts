// ⚠⚠ RETIRED AS THE ANSWER TO THE OWNER'S QUESTION ON 17.08, AND KEPT AS THE INSTRUMENT IT WAS.
// This file's whole architecture is a COMPARISON – college against four years on tour – and the owner
// ruled that out: «мы больше ничего ни с чем не сравниваем». `tools/college-choice-probe.ts` measures
// college on its own terms and is what the college reporting now uses. This one stays because P6's
// decomposition question (below) is a real question it answers, and because deleting a shipped
// instrument to make a report tidier is how a corpus loses its own history.
// ⚠ AND IT READS THE CHEAPEST PLACE, NOT "THE OFFER". A tier is a place with a price since 17.08 and
// the player picks one; this probe never picks.
//
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
import { COLLEGE_TIERS, type CollegeOffer } from '../src/engine/collegeOffer'

/** ⚠ THE CHEAPEST PLACE OPEN TO HER. This probe never picks, so this is the only quote it can
 *  honestly read – see the note on `answerFork` below. */
const cheapest = (offer: CollegeOffer | null | undefined) => offer?.quotes.find((q) => q.open) ?? null
// ⚠ FROM world/ladder, NOT world/snapshot (TB-07): kidLadderRank moved down to the ladder leaf so
// world/college.ts could stop importing the aggregate projection layer. Same function.
import { kidLadderRank } from '../src/engine/world/ladder'
import { parentIncomeForWeekCents } from '../src/engine/economy'
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
  /** ⭐⭐ ROUND 21 – THE FAMILY'S ACTUAL POSITION THE WEEK SHE ENROLS, and it is measured here BEFORE
   *  anything reads it, so the calibration of a means test can be set on the real distribution rather
   *  than on the three background labels. The owner, 17.08: «с учетом доходов семьи на момент
   *  поступления и прочего».
   *
   *  ⚠ `incomeAtForkCents` IS THE PARENTS' ANNUALISED CONTRIBUTION, NOT A HOUSEHOLD INCOME. It is
   *  `parentIncomeForWeekCents x 52` – what they put INTO the tennis – and the distinction is why no
   *  federal dollar threshold can be laid over it directly. See the spec's §2.
   *  ⚠ `assetsAtForkCents` is `world.fundsCents` at the fork, which is genuinely the family's savings
   *  and CAN be negative: a career carrying debt into college is a real state (§2e). */
  incomeAtForkCents: number
  assetsAtForkCents: number
  tuitionPaid: number
  fundsDelta: number
  earned: number
  spent: number
  prize: number
  rankAfter: number | null
  ended: string | null
  /** ⭐ ROUND 21 – DID THE MONEY RUN OUT WHILE SHE WAS THERE? `fundsAfter < 0` or a live debt spell at
   *  the end of the four years. §2e of `what-the-college-place-costs-2026-08.md` named this state as
   *  newly reachable and did not measure it; the owner's «может она околонулевая будет или всё-таки
   *  расходы перевесят» is exactly the question it answers. */
  fundsAfter: number
  inDebtAfter: boolean
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
      // ⚠ TAKEN BEFORE `answerFork`, which is the whole point: this is her position AT ENROLMENT.
      const incomeAtFork = parentIncomeForWeekCents(at.world.seed, at.world.profile.background, at.world.week) * WEEKS_PER_YEAR
      const assetsAtFork = at.world.fundsCents
      // ⚠ NO TIER ARGUMENT, WHICH IS THIS TOOL SAYING WHAT IT IS SINCE THE 17.08 REBUILD: the player
      // picks a place now, and this probe never was a player. `answerFork` falls back to the CHEAPEST
      // place open to her, so this file measures the college branch at its floor price and nothing
      // else. The choice is measured in `tools/college-choice-probe.ts`.
      answerFork(at.world, 'college')
      for (let y = 0; y < YEARS; y++) resumeFromCollege(at.world, at.rng)
      college.push({
        background: PRESETS[p].background,
        offerFamilyPerYearCents: cheapest(offer)?.familyPerYearCents ?? 0,
        offerAthleticShare: cheapest(offer)?.athleticShare ?? 0,
        offerNeedShare: cheapest(offer)?.needShare ?? 0,
        offerProgramme: cheapest(offer)?.tier ?? 'walk-on',
        incomeAtForkCents: incomeAtFork,
        assetsAtForkCents: assetsAtFork,
        tuitionPaid: tuitionSoFar(at.world) - tuitionBefore,
        ...delta(at.world, from),
        rankAfter: kidLadderRank(at.world, 'wta'),
        ended: at.world.ending ? at.world.ending.type : null,
        fundsAfter: at.world.fundsCents,
        inDebtAfter: at.world.debtSinceWeek !== null,
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
        incomeAtForkCents: 0,
        assetsAtForkCents: 0,
        tuitionPaid: 0,
        ...delta(at.world, from),
        rankAfter: kidLadderRank(at.world, 'wta'),
        ended: at.world.ending ? at.world.ending.type : null,
        fundsAfter: at.world.fundsCents,
        inDebtAfter: at.world.debtSinceWeek !== null,
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

// =================================================================================================
// ⭐⭐⭐ THE DISTRIBUTION – ROUND 21, AND IT IS A CORRECTION OF THIS FILE'S OWN REPORTING.
// =================================================================================================
//
// THE OWNER'S QUESTION (round 21): «И что значит "колледж лучше тура", если на туре за 4 года вполне
// можно 1-2 млн поднять?»
//
// HE IS RIGHT AND THE FAILING WAS IN THE REPORT, NOT IN THE MEASUREMENT. The four-year comparison
// was handed to him as a pair of MEDIANS – $106,995 against $31,959 – with no spread beside them.
// A median cannot answer "can you make one to two million on tour", because that claim is about the
// TAIL, and a median is the one statistic that is deliberately blind to it. His own career is the
// counter-example: Ines banks $1.97M by week 465.
//
// ⚠ AND THE ROW ABOVE IS A DIFFERENCE OF MEDIANS, WHICH IS NOT THE MEDIAN OF THE DIFFERENCE. The two
// arms are PAIRED – forked from one world at one week, byte-identical up to the fork – so the honest
// per-career statistic is `college_i - tour_i`, and it is printed here beside the marginals rather
// than instead of them, because the two answer different questions ("which arm is bigger typically"
// vs "how often, and by how much, does THIS career do better by going").
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b)
/** ⚠ NEAREST-RANK, and stated because the choice matters at n≈50: p90 of 53 rows is a real row, not
 *  an interpolation between two. Same convention as the quartiles in `collegeOffer.ts`'s own note. */
const pctl = (xs: number[], q: number) => {
  if (!xs.length) return 0
  const a = sorted(xs)
  return a[Math.min(a.length - 1, Math.max(0, Math.ceil(q * a.length) - 1))]
}
const QS = [0.1, 0.25, 0.5, 0.75, 0.9] as const

console.log(`\n⭐⭐ THE DISTRIBUTION OVER FOUR YEARS – funds delta, n=${college.length} paired careers`)
console.log(`  ${''.padEnd(20)}${'min'.padStart(13)}${'p10'.padStart(13)}${'p25'.padStart(13)}${'median'.padStart(13)}${'p75'.padStart(13)}${'p90'.padStart(13)}${'max'.padStart(13)}`)
const distRow = (label: string, xs: number[]) =>
  console.log(
    `  ${label.padEnd(20)}${usd(Math.min(...xs)).padStart(13)}` +
      QS.map((q) => usd(pctl(xs, q)).padStart(13)).join('') +
      usd(Math.max(...xs)).padStart(13),
  )
const cFunds = college.map((r) => r.fundsDelta)
const tFunds = tour.map((r) => r.fundsDelta)
distRow('COLLEGE', cFunds)
distRow('ON TOUR', tFunds)
distRow('paired (col - tour)', college.map((r, i) => r.fundsDelta - tour[i].fundsDelta))

// ⭐ WHERE THE ARMS CROSS. Two different crossings, and conflating them is how a median misleads:
//   (a) the MARGINAL crossing – the quantile at which the tour's own distribution passes college's
//       own distribution at the same quantile. This is what "the tour overtakes college" means when
//       reading the two columns above.
//   (b) the PAIRED crossing – the share of individual careers that did better by staying on tour.
{
  const cS = sorted(cFunds)
  const tS = sorted(tFunds)
  let cross: number | null = null
  for (let i = 0; i < cS.length; i++) {
    if (tS[i] > cS[i]) {
      cross = (i + 1) / cS.length
      break
    }
  }
  const paired = college.filter((r, i) => r.fundsDelta - tour[i].fundsDelta < 0).length
  console.log(
    `\n  ⭐ MARGINAL CROSSING: the tour arm passes the college arm at the ${cross === null ? 'NEVER – not at any quantile measured' : `${(100 * cross).toFixed(0)}th percentile and above`}.`,
  )
  console.log(`  ⭐ PAIRED: ${paired} of ${college.length} careers (${((100 * paired) / college.length).toFixed(0)}%) banked MORE by staying on tour.`)
  console.log(
    `\n  the four-year tour tail, in his own units:` +
      `\n    careers banking over   $500,000 on tour: ${tFunds.filter((x) => x >= 500_000_00).length} / ${tFunds.length}` +
      `\n    careers banking over $1,000,000 on tour: ${tFunds.filter((x) => x >= 1_000_000_00).length} / ${tFunds.length}` +
      `\n    careers banking over $2,000,000 on tour: ${tFunds.filter((x) => x >= 2_000_000_00).length} / ${tFunds.length}`,
  )
  console.log(
    `    ...and the same three on the COLLEGE arm:` +
      `  ${cFunds.filter((x) => x >= 500_000_00).length} · ${cFunds.filter((x) => x >= 1_000_000_00).length} · ${cFunds.filter((x) => x >= 2_000_000_00).length}`,
  )
}

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

// =================================================================================================
// ⭐⭐ THE NON-AMERICAN BILL, COMPUTED RATHER THAN ESTIMATED – round 21, the owner's second half.
// =================================================================================================
//
// §4.3 of `what-the-college-place-costs-2026-08.md` said "roughly $100,000 over four years against
// $28,316" and called the bench blind to it. The bench is not blind to it – it is one line of exact
// arithmetic over rows already measured, and it belongs BESIDE the American number rather than in a
// paragraph three sections down.
//
// ⚠ WHY IT IS EXACT AND NOT A MODEL. `resolveCollegeBill` is `sticker x (1 - min(1, athletic +
// need))`. The athletic award is MERIT-ONLY and physically cannot read `country` –
// `tests/college-offer.test.ts` block A proves that by sweep and by mutation – so every career's
// `offerAthleticShare` below is ALREADY the share a non-American would be given. Only two inputs
// change, and both are sourced constants rather than judgements: the sticker moves in-state ->
// out-of-state (a non-resident alien is never in-state anywhere), and the need layer is zero
// (`needShareOf` returns 0 for any country but 'US'; 34 CFR 668.33 is the citation).
{
  const IN = COLLEGE_TIERS.state.costPerYearCents
  const OUT = COLLEGE_TIERS.national.costPerYearCents
  const nonUsPerYear = (r: Arm) => Math.round(OUT * (1 - Math.min(1, r.offerAthleticShare)))
  const usPerYear = (r: Arm) => r.offerFamilyPerYearCents
  console.log(`\n⭐⭐ THE SAME PLACE, PRICED FOR A NON-AMERICAN (n=${college.length})`)
  console.log(`  the two stickers: in-state ${usd(IN)}/yr   ·   out-of-state ${usd(OUT)}/yr   ·   (private nonprofit ${usd(COLLEGE_TIERS.private.costPerYearCents)}/yr – A PLACE SHE MAY PICK since 17.08)`)
  console.log(`\n  ${''.padEnd(24)}${'AMERICAN'.padStart(16)}${'NON-AMERICAN'.padStart(16)}${'x'.padStart(9)}`)
  const usY = med(college.map(usPerYear))
  const nonY = med(college.map(nonUsPerYear))
  console.log(`  ${'family pays / year'.padEnd(24)}${usd(usY).padStart(16)}${usd(nonY).padStart(16)}${(usY ? (nonY / usY).toFixed(1) : '–').padStart(9)}`)
  console.log(`  ${`over ${YEARS} years`.padEnd(24)}${usd(usY * YEARS).padStart(16)}${usd(nonY * YEARS).padStart(16)}`)
  console.log(`  ${'free rides'.padEnd(24)}${String(college.filter((r) => usPerYear(r) === 0).length + '/' + college.length).padStart(16)}${String(college.filter((r) => nonUsPerYear(r) === 0).length + '/' + college.length).padStart(16)}`)
  console.log(`\n  ⚠ AND THE COMPARISON THAT MATTERS – the four-year bill against what the arm BANKS:`)
  // ⚠⚠ THE AMERICAN BILL IS ALREADY INSIDE `fundsDelta` AND MUST BE ADDED BACK BEFORE THE OTHER ONE
  // IS TAKEN OFF. The first cut of this block printed `colMed - usBill` as "less the American bill",
  // which double-charges it: `resolveCollegeBill` debits tuition weekly through the tick, so the
  // measured delta is ALREADY net of it. The honest counterfactual is delta + usBill - nonUsBill.
  // ⚠⚠ AND IT IS COMPUTED PER CAREER AND THEN TAKEN A MEDIAN OF, NEVER median±median. A median does
  // not add, and this file's own round-21 correction above is about exactly that mistake in the other
  // direction (a difference of medians is not the median of the difference). Each career's
  // counterfactual is `fundsDelta_i + usBill_i - nonUsBill_i`, and the median is taken last.
  const colMed = med(college.map((r) => r.fundsDelta))
  const preTuition = college.map((r) => r.fundsDelta + usPerYear(r) * YEARS)
  const nonUsNet = college.map((r) => r.fundsDelta + usPerYear(r) * YEARS - nonUsPerYear(r) * YEARS)
  const tourMed = med(tour.map((r) => r.fundsDelta))
  console.log(`    college funds delta over ${YEARS}y (median)   ${usd(colMed)}   ← ALREADY net of the American bill`)
  console.log(`    before any tuition at all                 ${usd(med(preTuition))}`)
  console.log(`    ...net for a NON-AMERICAN                 ${usd(med(nonUsNet))}`)
  console.log(`    the tour arm's median, for comparison     ${usd(tourMed)}`)
  console.log(
    `\n    ⭐ college's advantage over the tour's median: American ${usd(colMed - tourMed)}` +
      `  ·  NON-AMERICAN ${usd(med(nonUsNet) - tourMed)}`,
  )
  // The PAIRED version of the same question, which is the honest one for a forked pair.
  const pairedUs = college.map((r, i) => r.fundsDelta - tour[i].fundsDelta)
  const pairedNon = college.map((r, i) => r.fundsDelta + usPerYear(r) * YEARS - nonUsPerYear(r) * YEARS - tour[i].fundsDelta)
  console.log(
    `    ⭐ PAIRED (median of the per-career difference): American ${usd(med(pairedUs))}` +
      `  ·  NON-AMERICAN ${usd(med(pairedNon))}`,
  )
  console.log(
    `    careers that would do better ON TOUR: American ${pairedUs.filter((x) => x < 0).length}/${college.length}` +
      `  ·  NON-AMERICAN ${pairedNon.filter((x) => x < 0).length}/${college.length}`,
  )
  console.log(`\n  by background, four-year bill:`)
  console.log(`    ${'background'.padEnd(11)}${'n'.padStart(4)}${'athletic %'.padStart(12)}${'AMERICAN'.padStart(14)}${'NON-AMERICAN'.padStart(15)}`)
  for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    const g = college.filter((r) => r.background === b)
    if (!g.length) continue
    console.log(
      `    ${b.padEnd(11)}${String(g.length).padStart(4)}${(100 * mean(g.map((r) => r.offerAthleticShare))).toFixed(1).padStart(12)}` +
        `${usd(med(g.map(usPerYear)) * YEARS).padStart(14)}${usd(med(g.map(nonUsPerYear)) * YEARS).padStart(15)}`,
    )
  }
  console.log(
    `\n  ⭐ THE NEED LAYER IS THE WHOLE OF THE DIFFERENCE FOR A WORKING FAMILY, AND IT IS US-ONLY.` +
      `\n  A non-American working family pays the same as a non-American wealthy one on the same record:` +
      `\n  merit is all they get. That is the sourced law, not a design choice – flagged, not tuned.`,
  )

  // ===============================================================================================
  // ⭐⭐⭐ ROUND 21 – THE DELTA, BY BACKGROUND, AS A DISTRIBUTION. THE DELIVERABLE.
  // ===============================================================================================
  //
  // THE OWNER, 17.08: «Копят деньги и оплачивают. Какая дельта? Может она околонулевая будет или
  // всё-таки расходы перевесят.»
  //
  // ⚠⚠ AND IT IS PRINTED AS A DISTRIBUTION AND NEVER AS A MEDIAN ALONE. He has caught a bare median
  // here twice. The block above already fixed the AGGREGATE reporting; this one fixes it PER
  // BACKGROUND, which is the cut he actually asked for – a median per background is three bare
  // medians rather than one, and no better.
  //
  // ⚠ EVERY ROW IS THE PAIRED STATISTIC `college_i - tour_i`. The two arms fork from one world at one
  // week and are byte-identical up to it, so the per-career difference is the honest unit and a
  // difference of medians is not the median of the difference.
  console.log(`\n\n⭐⭐⭐ THE DELTA OVER ${YEARS} YEARS, BY BACKGROUND – paired (college minus tour), n=${college.length}`)
  console.log(`  ${'background'.padEnd(11)}${'n'.padStart(4)}${'p10'.padStart(13)}${'p25'.padStart(13)}${'MEDIAN'.padStart(13)}${'p75'.padStart(13)}${'p90'.padStart(13)}${'better on tour'.padStart(16)}`)
  const pairedOf = (b: FamilyBackground | null) => {
    const idx = college.map((_, i) => i).filter((i) => b === null || college[i].background === b)
    return idx.map((i) => college[i].fundsDelta - tour[i].fundsDelta)
  }
  const deltaRow = (label: string, xs: number[]) => {
    if (!xs.length) return
    const worse = xs.filter((x) => x < 0).length
    console.log(
      `  ${label.padEnd(11)}${String(xs.length).padStart(4)}` +
        [0.1, 0.25, 0.5, 0.75, 0.9].map((q) => usd(pctl(xs, q)).padStart(13)).join('') +
        `${`${worse}/${xs.length} (${Math.round((100 * worse) / xs.length)}%)`.padStart(16)}`,
    )
  }
  for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) deltaRow(b, pairedOf(b))
  deltaRow('ALL', pairedOf(null))

  console.log(`\n  ...AND THE SAME THREE FOR A NON-AMERICAN (out-of-state sticker, no need layer – 34 CFR 668.33)`)
  console.log(`  ${'background'.padEnd(11)}${'n'.padStart(4)}${'p10'.padStart(13)}${'p25'.padStart(13)}${'MEDIAN'.padStart(13)}${'p75'.padStart(13)}${'p90'.padStart(13)}${'better on tour'.padStart(16)}`)
  const pairedNonOf = (b: FamilyBackground | null) => {
    const idx = college.map((_, i) => i).filter((i) => b === null || college[i].background === b)
    return idx.map((i) => college[i].fundsDelta + usPerYear(college[i]) * YEARS - nonUsPerYear(college[i]) * YEARS - tour[i].fundsDelta)
  }
  for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) deltaRow(b, pairedNonOf(b))
  deltaRow('ALL', pairedNonOf(null))

  // ===============================================================================================
  // ⭐⭐ DID THE MONEY RUN OUT WHILE SHE WAS THERE? (§2e, named and never measured)
  // ===============================================================================================
  console.log(`\n⭐⭐ THE FAMILY RAN OUT MID-DEGREE?  – the state §2e said became reachable and did not measure`)
  const broke = college.filter((r) => r.fundsAfter < 0 || r.inDebtAfter)
  const brokeTour = tour.filter((r) => r.fundsAfter < 0 || r.inDebtAfter)
  console.log(`  under water after ${YEARS} years      college ${broke.length}/${college.length}   ·   tour ${brokeTour.length}/${tour.length}`)
  console.log(`  careers ENDED inside the ${YEARS}y     college ${college.filter((r) => r.ended !== null && r.ended !== 'college').length}/${college.length}   ·   tour ${tour.filter((r) => r.ended !== null).length}/${tour.length}`)
  for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
    const g = college.filter((r) => r.background === b)
    if (!g.length) continue
    console.log(`    ${b.padEnd(11)}under water ${String(g.filter((r) => r.fundsAfter < 0 || r.inDebtAfter).length).padStart(3)}/${String(g.length).padEnd(4)} · funds after, median ${usd(med(g.map((r) => r.fundsAfter)))}`)
  }
}

// =================================================================================================
// ⭐⭐⭐ ROUND 21 – WHAT THE FAMILY ACTUALLY HAS THE WEEK SHE ENROLS.
// =================================================================================================
//
// THE OWNER, 17.08: «...с учетом доходов семьи на момент поступления и прочего».
//
// ⚠⚠ THIS BLOCK IS THE CALIBRATION INPUT FOR A MEANS TEST AND IT IS PRINTED BEFORE ANYTHING READS IT.
// The need layer priced by the three background LABELS until round 21. To price it on the family's
// real position instead, the real position has to be measured first – and the headline finding is
// that the two axes are not the same axis at all:
//
//   * INCOME here is `parentIncomeForWeekCents x 52` – the parents' annualised contribution to the
//     TENNIS, grown by five seasons of `incomeGrowthBand`. It is NOT a household income, it is far
//     below the US median ($105,800 `[S]`), and that is why no federal dollar threshold can be laid
//     over it. Any knot set on it is OURS.
//   * ASSETS is `world.fundsCents` at the fork – genuinely the family's savings, genuinely what
//     «копят деньги» means, and it CAN BE NEGATIVE.
console.log(`\n\n⭐⭐⭐ THE FAMILY AT ENROLMENT – the position a means test would read, n=${college.length}`)
console.log(`  ${''.padEnd(30)}${'min'.padStart(13)}${'p10'.padStart(13)}${'p25'.padStart(13)}${'median'.padStart(13)}${'p75'.padStart(13)}${'p90'.padStart(13)}${'max'.padStart(13)}`)
const posRow = (label: string, xs: number[]) => {
  if (!xs.length) return
  console.log(
    `  ${label.padEnd(30)}${usd(Math.min(...xs)).padStart(13)}` +
      QS.map((q) => usd(pctl(xs, q)).padStart(13)).join('') +
      usd(Math.max(...xs)).padStart(13),
  )
}
posRow('parent income /yr (ALL)', college.map((r) => r.incomeAtForkCents))
posRow('savings at the fork (ALL)', college.map((r) => r.assetsAtForkCents))
console.log(`\n  BY BACKGROUND – and the SPREAD INSIDE a background is the whole argument for reading the`)
console.log(`  position rather than the label: a label has none.`)
console.log(`  ${'background'.padEnd(11)}${'n'.padStart(4)}${'income p25'.padStart(14)}${'income med'.padStart(14)}${'income p75'.padStart(14)}${'savings p25'.padStart(14)}${'savings med'.padStart(14)}${'savings p75'.padStart(14)}`)
for (const b of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
  const g = college.filter((r) => r.background === b)
  if (!g.length) continue
  const inc = g.map((r) => r.incomeAtForkCents)
  const sav = g.map((r) => r.assetsAtForkCents)
  console.log(
    `  ${b.padEnd(11)}${String(g.length).padStart(4)}` +
      [0.25, 0.5, 0.75].map((q) => usd(pctl(inc, q)).padStart(14)).join('') +
      [0.25, 0.5, 0.75].map((q) => usd(pctl(sav, q)).padStart(14)).join(''),
  )
}
console.log(`\n  ⚠ THE OVERLAP IS THE FINDING. Where the savings ranges of two backgrounds overlap, the`)
console.log(`    label and the position DISAGREE about the same family – and today the bill reads the label.`)

// =================================================================================================
// ⭐⭐ HOW MUCH OF THE BILL IS COVERED – the distribution the FUNDING BANDS are calibrated on.
// =================================================================================================
//
// ⚠⚠ THE SAME DISCIPLINE THE PROGRAMME BANDS LEARNED THE HARD WAY. `collegeOffer.ts`'s own note
// records that the first set of programme thresholds (12 / 5 / 1) put 88 of 90 careers in one band
// and produced a median family bill of $0. A band that holds nearly everybody carries no information
// about anybody, and the only way to know before shipping is to measure the axis first.
//
// ⚠ `covered` is `min(1, athletic + need)` – the Bylaw 15.1 ceiling – which is exactly the number a
// funding band would be named for, and it is pure arithmetic on two persisted fields.
{
  const covered = college.map((r) => Math.min(1, r.offerAthleticShare + r.offerNeedShare))
  const pctOf = (q: number) => `${(100 * pctl(covered, q)).toFixed(1)}%`
  console.log(`\n⭐⭐ SHARE OF THE BILL COVERED (athletic + need, capped at the Bylaw 15.1 ceiling), n=${covered.length}`)
  console.log(
    `  min ${(100 * Math.min(...covered)).toFixed(1)}%  ·  p10 ${pctOf(0.1)}  ·  p25 ${pctOf(0.25)}  ·  median ${pctOf(0.5)}` +
      `  ·  p75 ${pctOf(0.75)}  ·  p90 ${pctOf(0.9)}  ·  max ${(100 * Math.max(...covered)).toFixed(1)}%`,
  )
  const at = (lo: number, hi: number) => covered.filter((c) => c >= lo && c < hi).length
  console.log(
    `  fully covered (=100%) ${covered.filter((c) => c >= 1).length}/${covered.length}` +
      `  ·  80-100% ${at(0.8, 1)}  ·  55-80% ${at(0.55, 0.8)}  ·  1-55% ${at(0.0001, 0.55)}  ·  nothing at all ${covered.filter((c) => c <= 0).length}`,
  )
}
