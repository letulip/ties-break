// THE SKILL CEILING PROBE – how good does she actually get, and is that what stops her?
//
// THE QUESTION, and it is the owner's own (04.08): «это у нас с механикой прокачки уровней скиллов
// значит что-то не то. Надо проверять и исправлять, как так? ради этого вся игра, можно сказать.»
// `docs/specs/money-decomposition-2026-08.md` measured the best professional rank any of 180 bench
// careers ever reached at #237, with zero entries into a WTA 250 or above, while
// `ECONOMY.development.ageCurve`'s own calibration comment promises "first points 17-18, top-100
// about 4.5 years later". Either the development model cannot produce a top-100 player, or it can
// and something downstream of it is the wall. This tool measures which.
//
// FIVE SECTIONS, and each one answers a separate half of that:
//
//   §1  THE HEADROOM MODEL'S OWN HONESTY. `growWeek` takes a share of the REMAINING distance to the
//       ceiling every week, so the last points never arrive by construction. That is a stated design
//       intention; this section prices it, analytically and per setup, in skill points.
//   §2  ACHIEVED vs POTENTIAL, over real careers through the real engine. What share of her own
//       ceiling does a career realise, at what age, and what rank does it buy?
//   §3  THE LUCKIEST CAREER. Sweep the potential roll to the top of the band and hand her the best
//       coaching and training the game sells. That is the ATHLETIC CEILING of the game.
//   §4  WHAT EACH DIAL IS WORTH. One counterfactual at a time, same seeds, ranked by measured effect
//       on peak skill AND on peak rank – because those are not the same question and this probe
//       exists because they might not have the same answer.
//   §5  SKILL -> WINNING. A skill number only matters through the match engine. The closed form
//       against the world the game actually contains (364 derived pros + 199 juniors), which yields
//       her SKILL rank – where she would stand if the table were sorted by how good she is – to set
//       beside her POINTS rank.
//
// RNG DISCIPLINE. Nothing here adds a draw to anything: §2/§3/§4 drive the engine through
// `openCareer`/`stepCareerWeek` exactly as the econ, endings and money benches do, and §1/§5 are
// closed-form arithmetic over `rollPotential`, `ageFactor` and `fastMatchProbability`. The dial
// sweeps mutate `ECONOMY.development` in place before a run and restore it after – the same
// measurement-harness pattern `tools/field-quality.ts` uses on `TIERS` for its band overrides.
//
// USAGE
//   npx vite-node tools/skill-ceiling.ts                  # everything, default seed counts
//   npx vite-node tools/skill-ceiling.ts --seeds 4        # the career arms, 4 seeds a preset
//   npx vite-node tools/skill-ceiling.ts --dial-seeds 8   # the counterfactual arms
//   npx vite-node tools/skill-ceiling.ts --only 1,5       # sections, comma separated

import { openCareer, stepCareerWeek, PRESETS, POLICIES, type Preset, type Policy } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, startingSkills, type WorldState } from '../src/engine/world'
import { kidAgeExact } from '../src/engine/world/age'
import { withHeadStart } from '../src/engine/world/player'
import {
  SKILL_KEYS,
  SKILL_POINTS_PER_YEAR,
  ageFactor,
  declineFactor,
  growWeek,
  relativeAgeHeadStart,
  rollPotential,
  trainFactor,
  type KidSkills,
} from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { coachFactor, coachFitFor, tierOf, bestFitCoachAt, type Coach } from '../src/engine/coach'
import { fastMatchProbability } from '../src/engine/match/engine'
import { FIELD, fieldProsFor, mergedWtaRanking } from '../src/engine/season/fieldPros'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { power } from '../src/engine/season/cohort'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { BEST_N_BY_TRACK } from '../src/engine/season/ranking'
import type { TierId } from '../src/engine/season/types'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier, type WeekPlan } from '../src/shared/protocol'
import type { MatchPlayer } from '../src/engine/match/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const CAREER_SEEDS = argOf('seeds', 4)
const DIAL_SEEDS = argOf('dial-seeds', 6)
const onlyArg = args.indexOf('--only') >= 0 ? (args[args.indexOf('--only') + 1] ?? '') : ''
const ONLY = new Set(onlyArg.split(',').filter(Boolean))
const wants = (section: string): boolean => ONLY.size === 0 || ONLY.has(section)

const START_AGE = 14

// -------------------------------------------------------------------------------------------------
// small helpers
// -------------------------------------------------------------------------------------------------
function meanFive(s: KidSkills): number {
  return SKILL_KEYS.reduce((a, k) => a + s[k], 0) / SKILL_KEYS.length
}
/** The FIELD table's own currency: `power()` is the mean of FOUR (the cohort has no groundstroke),
 *  so every comparison against `FIELD.tiers[].core` has to drop the fifth attribute or it is
 *  comparing two different rulers. */
function meanFour(s: KidSkills): number {
  return (s.serve + s.ret + s.composure + s.stamina) / 4
}
function pctl(xs: number[], q: number): number {
  if (xs.length === 0) return NaN
  const sorted = [...xs].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(q * sorted.length)))]
}
function mean(xs: number[]): number {
  return xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length
}
function f1(x: number): string {
  return Number.isFinite(x) ? x.toFixed(1) : '  –'
}
function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}
function padEnd(s: string | number, w: number): string {
  return String(s).padEnd(w)
}
function rule(n = 100): string {
  return '='.repeat(n)
}

// -------------------------------------------------------------------------------------------------
// §1 THE HEADROOM MODEL'S OWN HONESTY
// -------------------------------------------------------------------------------------------------
//
// `growWeek` is `skill += rate x (ceiling - skill) x luck`, so the distance to the ceiling decays
// geometrically: after W weeks the UNREALISED share is prod(1 - rate_w x luck_w). Luck is a mean-1
// multiplier drawn once a week, and `rate` is ~0.005, so the deterministic product is exact to three
// decimals and is what this section reports (§2 measures the stochastic truth on real careers).
//
// The output is the share of her own headroom she can EVER have, by age, per setup – i.e. the answer
// to "how much of the ceiling is unreachable in practice, and at what age does the curve stop".

interface Setup {
  label: string
  coachTier: CoachTier
  fit: 'great' | 'good' | 'off'
  train: number
  /** matches a week, averaged – `growWeek` caps the bonus at 3 */
  matches: number
  /** share of weeks at the summer block's 1.4 loadFactor */
  summerShare: number
}

const SETUPS: Setup[] = [
  { label: 'self-coached, light plan, no racing', coachTier: 'self', fit: 'good', train: 60, matches: 0, summerShare: 0 },
  { label: 'self-coached, balanced, some racing', coachTier: 'self', fit: 'good', train: 75, matches: 0.4, summerShare: 0.1 },
  { label: 'middle coach, balanced, some racing', coachTier: 'middle', fit: 'good', train: 75, matches: 0.4, summerShare: 0.1 },
  { label: 'elite coach, grind plan, racing', coachTier: 'elite', fit: 'great', train: 85, matches: 0.6, summerShare: 0.17 },
  { label: 'ELITE+GREAT, grind, 3 matches/wk', coachTier: 'elite', fit: 'great', train: 85, matches: 3, summerShare: 0.17 },
]

function weeklyRate(setup: Setup, ageYears: number): number {
  const d = ECONOMY.development
  const plan: WeekPlan = { train: setup.train, rest: 100 - setup.train }
  const load = 1 + setup.summerShare * (ECONOMY.summerBlock.loadFactor - 1)
  return (
    ageFactor(ageYears) *
    trainFactor(plan) *
    load *
    coachFactor(setup.coachTier, setup.fit) *
    (1 + Math.min(setup.matches, d.matchBonusCap) * d.matchBonus)
  )
}

/** Unrealised share of the ORIGINAL headroom at each reported age, per setup. */
function headroomCurve(setup: Setup): { age: number; realised: number }[] {
  const marks = [16, 18, 20, 21, 23, 26, 29, 34, 38]
  const out: { age: number; realised: number }[] = []
  let remaining = 1
  let mark = 0
  for (let w = 0; w < (38 - START_AGE) * WEEKS_PER_YEAR; w++) {
    const age = START_AGE + w / WEEKS_PER_YEAR
    remaining *= 1 - weeklyRate(setup, age)
    while (mark < marks.length && age >= marks[mark]) {
      out.push({ age: marks[mark], realised: 1 - remaining })
      mark++
    }
  }
  while (mark < marks.length) {
    out.push({ age: marks[mark], realised: 1 - remaining })
    mark++
  }
  return out
}

function section1(): void {
  console.log(`\n${rule()}`)
  console.log('§1  THE HEADROOM MODEL\'S OWN HONESTY – how much of the ceiling can ever arrive')
  console.log(rule())
  console.log(
    '\n  `growWeek`: skill += rate x (ceiling - skill) x luck. The distance decays geometrically, so the',
  )
  console.log('  share of her OWN headroom she can ever realise is 1 - prod(1 - rate). Deterministic (luck mean 1):\n')

  const marks = headroomCurve(SETUPS[0]).map((r) => r.age)
  console.log(`  ${padEnd('setup', 38)}${marks.map((m) => pad(`age ${m}`, 8)).join('')}`)
  const rows: { setup: Setup; curve: { age: number; realised: number }[] }[] = []
  for (const s of SETUPS) {
    const curve = headroomCurve(s)
    rows.push({ setup: s, curve })
    console.log(`  ${padEnd(s.label, 38)}${curve.map((r) => pad(`${(100 * r.realised).toFixed(1)}%`, 8)).join('')}`)
  }

  // What the asymptote costs, in the unit the whole codebase prices things in.
  const medianHeadroom = (ECONOMY.development.potentialBand[0] + ECONOMY.development.potentialBand[1]) / 2
  console.log(
    `\n  THE PRICE OF THE ASYMPTOTE, on the MEDIAN talent roll (headroom ${medianHeadroom.toFixed(1)} points/attribute,`,
  )
  console.log(`  yardstick SKILL_POINTS_PER_YEAR = ${SKILL_POINTS_PER_YEAR}):\n`)
  console.log(`  ${padEnd('setup', 38)}${pad('lost by 23', 12)}${pad('lost for ever', 15)}${pad('= years of dev', 16)}`)
  for (const { setup, curve } of rows) {
    const at23 = curve.find((r) => r.age === 23)!.realised
    const at38 = curve[curve.length - 1].realised
    const lost23 = medianHeadroom * (1 - at23)
    const lostEver = medianHeadroom * (1 - at38)
    console.log(
      `  ${padEnd(setup.label, 38)}${pad(lost23.toFixed(2), 12)}${pad(lostEver.toFixed(2), 15)}` +
        `${pad((lostEver / SKILL_POINTS_PER_YEAR).toFixed(2), 16)}`,
    )
  }

  // Where the curve effectively stops: the age by which 90% / 99% of the eventual gain has landed.
  console.log(`\n  WHERE THE CURVE EFFECTIVELY STOPS (age by which X% of the EVENTUAL gain has landed):\n`)
  console.log(`  ${padEnd('setup', 38)}${pad('50%', 8)}${pad('90%', 8)}${pad('95%', 8)}${pad('99%', 8)}`)
  for (const s of SETUPS) {
    let remaining = 1
    const finalRealised = 1 - headroomCurve(s)[headroomCurve(s).length - 1].realised
    const total = 1 - finalRealised
    const hits: Record<string, number | null> = { '0.5': null, '0.9': null, '0.95': null, '0.99': null }
    for (let w = 0; w < (38 - START_AGE) * WEEKS_PER_YEAR; w++) {
      const age = START_AGE + w / WEEKS_PER_YEAR
      remaining *= 1 - weeklyRate(s, age)
      const done = (1 - remaining) / total
      for (const key of Object.keys(hits)) {
        if (hits[key] === null && done >= Number(key)) hits[key] = age
      }
    }
    console.log(
      `  ${padEnd(s.label, 38)}` +
        [0.5, 0.9, 0.95, 0.99].map((q) => pad(f1(hits[String(q)] ?? NaN), 8)).join(''),
    )
  }

  // The age curve's own shape, printed once, because every dial in §4 is a change to this line.
  console.log(`\n  THE AGE CURVE ITSELF (share of remaining headroom per week, before coach/train/matches):\n`)
  const ages = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 28, 29, 30, 32, 35]
  console.log(`  ${padEnd('age', 10)}${ages.map((a) => pad(a, 7)).join('')}`)
  console.log(
    `  ${padEnd('ageFactor', 10)}${ages.map((a) => pad((1000 * ageFactor(a)).toFixed(2), 7)).join('')}   (x1000)`,
  )
  console.log(
    `  ${padEnd('decline', 10)}${ages.map((a) => pad((1000 * declineFactor(a)).toFixed(2), 7)).join('')}   (x1000)`,
  )
}

// -------------------------------------------------------------------------------------------------
// the career runner – one full career through the real engine, instrumented for skills
// -------------------------------------------------------------------------------------------------

interface CareerSkillRow {
  seed: string
  preset: string
  start: KidSkills
  potential: KidSkills
  /** THE ENVELOPE: each attribute's own career maximum. The right object for "what share of this
   *  attribute's headroom did she realise", and the WRONG one for a match, because past 29 the
   *  physical peaks and the composure peak are years apart – she never held all five at once. */
  peak: KidSkills
  /** THE BUILD SHE ACTUALLY HAD in the week her mean-of-five peaked. This is the one §5 puts on
   *  court. It is ~0.5 core below the envelope, and the difference is `veteranPoise`. */
  peakBuild: KidSkills
  /** peak of the MEAN of five, and the age it happened at */
  peakMean: number
  peakMeanAge: number
  /** mean-of-four at the peak-mean week – the FIELD table's currency */
  peakCore: number
  /** (peak - start) / (potential - start), per attribute and aggregated */
  realised: number
  realisedByKey: Record<string, number>
  /** her best professional (merged W table) rank, guarded on having been paid – money-decomposition's rule */
  peakWtaRank: number | null
  /** best junior/ITF dense rank, unguarded */
  peakKidRank: number
  endedAge: number | null
  ending: string | null
  weeksLived: number
  /** matches played over the whole career – the growth model's `matchBonus` channel */
  matches: number
  /** events entered over the whole career, for scale against `matches` */
  entries: number
  /** ⚠ THE BUG PROBE. How many weeks `growWeek` would have seen a non-zero `matchesThisWeek`, read
   *  with the SAME predicate at the SAME moment in the tick. See `matchBonusWeeks` below. */
  matchBonusWeeks: number
}

/** How a career arm answers the two questions the engine asks mid-run.
 *
 *  `her-words` is the money bench's own arm (she retires when the plateau offer comes), and it is
 *  what makes arm (a) below the same population as `docs/specs/money-decomposition-2026-08.md`.
 *  `plays-on` says one more year to everything until the game stops asking – which is what an arm
 *  measuring the GROWTH CURVE has to do, or half the careers stop before the curve does. */
type RetireArm = 'her-words' | 'plays-on'

interface ArmOpts {
  retire?: RetireArm
  /** defuse the bankruptcy latch every week – the endings bench's own `sweepGrace` trick. A career
   *  that dies of money at seventeen measures the family's bank balance, not the skill model. */
  noBankruptcy?: boolean
  mutate?: (w: WorldState) => void
}

function answerOpenQuestions(world: WorldState, retire: RetireArm): void {
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) {
    const { reason, final } = world.retirementOffer
    answerRetirement(world, final ? true : retire === 'her-words' && reason === 'plateau')
  }
}

function runCareerSkills(preset: Preset, index: number, policy: Policy, opts: ArmOpts = {}): CareerSkillRow {
  const retire = opts.retire ?? 'her-words'
  const { world, rng, seed } = openCareer(preset, index, policy)
  opts.mutate?.(world)
  const start: KidSkills = { ...world.skills }
  const potential: KidSkills = { ...world.potential }
  const peak: KidSkills = { ...world.skills }
  let peakBuild: KidSkills = { ...world.skills }
  let peakMean = meanFive(world.skills)
  let peakMeanAge = START_AGE
  let peakCore = meanFour(world.skills)
  let peakWtaRank: number | null = null
  let peakKidRank = world.kidRank
  let matches = 0
  let entries = 0
  let matchBonusWeeks = 0
  const everEntered = new Set<string>()

  for (let i = 0; i < FULL_CAREER_WEEKS && world.ending === null; i++) {
    if (opts.noBankruptcy) world.debtSinceWeek = null
    // ⚠ READ BEFORE THE TICK, WITH `growWeek`'s OWN PREDICATE, AND THE WEEK IT LOOKS AT IS THE
    // SUBJECT OF THIS AUDIT. `tickWeek` increments `world.week` at its first statement and reads
    // `matchesThisWeek` at step 3b, so the feed it sees is the feed as it stands RIGHT NOW.
    // world.week here is (the week it will grow) - 1, which is exactly what the FIXED filter asks
    // for; the shipped filter before this branch asked for (the week it will grow), whose rows are
    // only written after the tick returns – hence 0, always. Flip the `- 0` to `+ 1` to reproduce
    // the pre-fix reading.
    const weekGrowWeekWillRead = world.week
    if (
      world.events.some((e) => e.week === weekGrowWeekWillRead && e.type === 'match' && !e.friendly)
    ) {
      matchBonusWeeks++
    }
    stepCareerWeek(world, rng, policy)
    for (const id of world.entries) {
      if (!everEntered.has(id)) {
        everEntered.add(id)
        entries++
      }
    }
    answerOpenQuestions(world, retire)
    for (const k of SKILL_KEYS) if (world.skills[k] > peak[k]) peak[k] = world.skills[k]
    const m = meanFive(world.skills)
    if (m > peakMean) {
      peakMean = m
      peakMeanAge = kidAgeExact(world.week, world.profile.birthMonth)
      peakCore = meanFour(world.skills)
      peakBuild = { ...world.skills }
    }
    if (world.kidRank < peakKidRank) peakKidRank = world.kidRank
    if (world.careerTotals.prizeCents > 0) {
      const wta = world.kidRankWta ?? world.cohort.length + 1
      if (peakWtaRank === null || wta < peakWtaRank) peakWtaRank = wta
    }
    // ⚠ COUNTED PER WEEK, NOT CUMULATIVELY. `world.events` is the NEWS FEED and `pruneEvents` caps
    // it at 400 rows oldest-first, so a running index into it silently loses most of a 24-season
    // career. This is the exact predicate `growWeek`'s own `matchesThisWeek` uses, read in the same
    // week – so what this counts IS what the growth model was fed.
    matches += world.events.filter((e) => e.week === world.week && e.type === 'match' && !e.friendly).length
  }

  const realisedByKey: Record<string, number> = {}
  let realisedSum = 0
  for (const k of SKILL_KEYS) {
    const head = potential[k] - start[k]
    const got = head > 0 ? Math.min(1, Math.max(0, (peak[k] - start[k]) / head)) : 1
    realisedByKey[k] = got
    realisedSum += got
  }

  return {
    seed,
    preset: preset.label,
    start,
    potential,
    peak,
    peakBuild,
    peakMean,
    peakMeanAge,
    peakCore,
    realised: realisedSum / SKILL_KEYS.length,
    realisedByKey,
    peakWtaRank,
    peakKidRank,
    endedAge: world.ending ? kidAgeExact(world.week, world.profile.birthMonth) : null,
    ending: world.ending?.type ?? null,
    weeksLived: world.week,
    matches,
    entries,
    matchBonusWeeks,
  }
}

// -------------------------------------------------------------------------------------------------
// §2 ACHIEVED vs POTENTIAL
// -------------------------------------------------------------------------------------------------

function reportPopulation(label: string, rows: CareerSkillRow[]): void {
  const realised = rows.map((r) => r.realised)
  const peakMean = rows.map((r) => r.peakMean)
  const peakAge = rows.map((r) => r.peakMeanAge)
  const ceilings = rows.map((r) => meanFive(r.potential))
  const ranked = rows.filter((r) => r.peakWtaRank !== null).map((r) => r.peakWtaRank as number)
  console.log(`\n  ${label} – ${rows.length} careers`)
  console.log(
    `  ${padEnd('', 24)}${pad('p10', 9)}${pad('median', 9)}${pad('p90', 9)}${pad('best', 9)}${pad('mean', 9)}`,
  )
  const line = (name: string, xs: number[], best: 'high' | 'low' = 'high', dp = 1) => {
    const sorted = [...xs].sort((a, b) => a - b)
    const bestVal = best === 'high' ? sorted[sorted.length - 1] : sorted[0]
    console.log(
      `  ${padEnd(name, 24)}${pad(pctl(xs, 0.1).toFixed(dp), 9)}${pad(pctl(xs, 0.5).toFixed(dp), 9)}` +
        `${pad(pctl(xs, 0.9).toFixed(dp), 9)}${pad(bestVal.toFixed(dp), 9)}${pad(mean(xs).toFixed(dp), 9)}`,
    )
  }
  line('realised % of ceiling', realised.map((x) => 100 * x))
  line('peak skill (mean of 5)', peakMean)
  line('her CEILING (mean of 5)', ceilings)
  line('age at peak', peakAge)
  if (ranked.length) line('peak W rank', ranked, 'low', 0)
  console.log(
    `  ever paid (W rank defined): ${ranked.length}/${rows.length}` +
      `   ·  entries/career median ${pctl(rows.map((r) => r.entries), 0.5).toFixed(0)}` +
      `   ·  matches/career median ${pctl(rows.map((r) => r.matches), 0.5).toFixed(0)}` +
      `   ·  ended age median ${f1(pctl(rows.filter((r) => r.endedAge !== null).map((r) => r.endedAge as number), 0.5))}`,
  )
  // ⚠ THE MATCH-BONUS CHANNEL, MEASURED. `growWeek`'s `matchBonus` is worth up to +54% of a week's
  // rate; this is how many weeks of a career it ever actually fired on.
  console.log(
    `  weeks growWeek saw a match (matchBonus fired): total ${rows.reduce((a, r) => a + r.matchBonusWeeks, 0)}` +
      ` over ${rows.reduce((a, r) => a + r.weeksLived, 0)} weeks lived` +
      `, against ${rows.reduce((a, r) => a + r.matches, 0)} matches actually played`,
  )
  const endings = new Map<string, number>()
  for (const r of rows) endings.set(r.ending ?? 'ran to 38', (endings.get(r.ending ?? 'ran to 38') ?? 0) + 1)
  console.log(
    `  how the careers ended: ${[...endings.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
  )
  // ⚠ ONE NUMBER, NOT FIVE, THROUGH THE WHOLE GROWTH PHASE, AND THAT IS A PROPERTY OF THE MODEL
  // RATHER THAN A BUG IN THE PRINT. `growWeek` applies the SAME rate and the SAME weekly luck draw
  // to every attribute, so each attribute's headroom decays by the identical factor and the realised
  // SHARE is equal across the five by construction. Her shape is entirely the birth roll plus the
  // potential roll; nothing in development can make her serve develop differently from her return.
  // The only thing that ever separates them is the DECLINE (physical attributes fall past 29 while
  // `veteranPoise` keeps composure creeping up), which is why a career that runs to 38 shows a
  // spread and one that ends at 24 shows exactly zero.
  const byKey = SKILL_KEYS.map((k) => mean(rows.map((r) => r.realisedByKey[k])))
  console.log(
    `  realised by attribute: ${SKILL_KEYS.map((k, i) => `${k} ${(100 * byKey[i]).toFixed(1)}%`).join(' · ')}` +
      `  (spread ${(100 * (Math.max(...byKey) - Math.min(...byKey))).toFixed(2)} pts – see note: zero before the decline)`,
  )
}

function section2(): CareerSkillRow[] {
  console.log(`\n${rule()}`)
  console.log('§2  ACHIEVED vs POTENTIAL – full careers 14->38 through the real engine')
  console.log(rule())

  const grinder = POLICIES[0]
  const player = POLICIES[1]

  // (a) THE MONEY BENCH'S OWN POPULATION, so this page's numbers are that page's numbers: all nine
  //     presets, grinder policy, her-words retirement – the arm that produced "best professional
  //     rank #237".
  const popA: CareerSkillRow[] = []
  for (const preset of PRESETS) {
    for (let i = 0; i < CAREER_SEEDS; i++) popA.push(runCareerSkills(preset, i, grinder))
  }
  reportPopulation("(a) all 9 presets, GRINDER policy (the money bench's own population)", popA)

  // (b) THE GROWTH MODEL, ISOLATED. Everything that can stop a career short of the age curve is
  //     taken away: the richest preset, the best coach, someone managing the calendar, the
  //     bankruptcy latch defused, and she says one more year to every offer. Whatever the
  //     development model can do, it can do HERE. If it is the wall, this is where it stands.
  const best = PRESETS[PRESETS.length - 1] // 120k · wealthy · elite coach
  const popB: CareerSkillRow[] = []
  for (let i = 0; i < CAREER_SEEDS * 3; i++) {
    popB.push(runCareerSkills(best, i, player, { retire: 'plays-on', noBankruptcy: true }))
  }
  reportPopulation(
    `(b) ${best.label.trim()}, PLAYER policy, plays-on, no bankruptcy – THE GROWTH MODEL ISOLATED`,
    popB,
  )

  return popB
}

// -------------------------------------------------------------------------------------------------
// §3 THE LUCKIEST CAREER
// -------------------------------------------------------------------------------------------------
//
// Two different "luckiest" questions, and they have different answers:
//   the TOP-OF-BAND ROLL – her starting build is whatever the seed gave her, but every attribute
//     rolls the top of `potentialBand`. That is a 1-in-many prodigy on a normal seed.
//   the ATHLETIC CEILING – the best starting build the game can deal (`startingSkills`' top of every
//     band) PLUS the top of the potential band PLUS a January birthday. No career can exceed it.

function topOfBandPotential(start: KidSkills, u = 1): KidSkills {
  const [lo, hi] = ECONOMY.development.potentialBand
  const out = {} as KidSkills
  for (const k of SKILL_KEYS) out[k] = start[k] + lo + u * (hi - lo)
  return out
}

/** The best build `startingSkills` can ever deal, plus a January head start. */
function maxStart(): KidSkills {
  const raw: KidSkills = { serve: 58, ret: 58, composure: 55, stamina: 60, groundstrokes: 58 }
  return withHeadStart(raw, 1)
}

function section3(): { prodigy: KidSkills; ceiling: KidSkills; theoretical: KidSkills } {
  console.log(`\n${rule()}`)
  console.log('§3  THE LUCKIEST CAREER – the athletic ceiling of the game')
  console.log(rule())

  const best = PRESETS[PRESETS.length - 1]
  const player = POLICIES[1]

  // (a) THE SWEEP. Same seeds, same everything, only the potential roll moves.
  console.log('\n  (a) THE POTENTIAL SWEEP – identical careers, only the talent roll moves\n')
  console.log(
    `  ${padEnd('roll (u in potentialBand)', 28)}${pad('ceiling', 10)}${pad('peak', 9)}${pad('realised', 10)}` +
      `${pad('peak age', 10)}${pad('peak W rank', 13)}`,
  )
  const sweepRows: { u: number; rows: CareerSkillRow[] }[] = []
  for (const u of [0, 0.25, 0.5, 0.75, 0.9, 0.99, 1]) {
    const rows: CareerSkillRow[] = []
    for (let i = 0; i < CAREER_SEEDS * 2; i++) {
      rows.push(
        runCareerSkills(best, i, player, {
          retire: 'plays-on',
          noBankruptcy: true,
          mutate: (w) => {
            w.potential = topOfBandPotential(startingSkills(w.seed, w.profile), u)
          },
        }),
      )
    }
    sweepRows.push({ u, rows })
    const ranked = rows.filter((r) => r.peakWtaRank !== null).map((r) => r.peakWtaRank as number)
    console.log(
      `  ${padEnd(`u = ${u.toFixed(2)}`, 28)}${pad(mean(rows.map((r) => meanFive(r.potential))).toFixed(1), 10)}` +
        `${pad(mean(rows.map((r) => r.peakMean)).toFixed(1), 9)}` +
        `${pad(`${(100 * mean(rows.map((r) => r.realised))).toFixed(1)}%`, 10)}` +
        `${pad(mean(rows.map((r) => r.peakMeanAge)).toFixed(1), 10)}` +
        `${pad(ranked.length ? `#${Math.min(...ranked)} (best)` : 'never paid', 13)}`,
    )
  }

  const prodigyRows = sweepRows[sweepRows.length - 1].rows
  const bestProdigy = prodigyRows.reduce((a, b) => (b.peakMean > a.peakMean ? b : a))
  console.log(
    `\n  BEST SINGLE PRODIGY CAREER: peak build ` +
      SKILL_KEYS.map((k) => `${k} ${bestProdigy.peakBuild[k].toFixed(1)}`).join(' · '),
  )
  console.log(
    `    mean-of-five ${bestProdigy.peakMean.toFixed(1)} · core (mean-of-four) ${bestProdigy.peakCore.toFixed(1)}` +
      ` · at age ${bestProdigy.peakMeanAge.toFixed(1)} · peak W rank ${bestProdigy.peakWtaRank === null ? 'never paid' : `#${bestProdigy.peakWtaRank}`}`,
  )

  // (b) THE THEORETICAL CEILING – the pure growth model with the best inputs the game sells, no
  //     injuries, no money, no calendar. Nothing a career can do beats this.
  const ms = maxStart()
  const theoreticalCeiling = topOfBandPotential(ms, 1)
  const coach: Coach = bestFitCoachAt('ceiling-probe', 16, 'elite', 'all-court') ?? {
    id: 'x',
    tier: 'elite',
    style: 'all-court',
    name: 'x',
    rateCents: 0,
  }
  let s: KidSkills = { ...ms }
  let bestMean = meanFive(s)
  let bestAge = START_AGE
  let bestBuild: KidSkills = { ...s }
  for (let w = 0; w < (38 - START_AGE) * WEEKS_PER_YEAR; w++) {
    const age = START_AGE + w / WEEKS_PER_YEAR
    s = growWeek({
      skills: s,
      potential: theoreticalCeiling,
      ageYears: age,
      plan: WEEK_PLAN_PRESETS.grind,
      coach,
      playStyle: 'all-court',
      matchesThisWeek: 3,
      seed: 'ceiling-probe',
      week: w,
      loadFactor: ECONOMY.summerBlock.loadFactor,
    })
    if (meanFive(s) > bestMean) {
      bestMean = meanFive(s)
      bestAge = age
      bestBuild = { ...s }
    }
  }
  console.log(`\n  (b) THE THEORETICAL CEILING – best possible start, top-of-band roll, and the best week the`)
  console.log(`      game can sell REPEATED FOR EVERY WEEK OF HER LIFE (elite+great coach, grind plan,`)
  console.log(`      3 matches every week, summer loadFactor always on, no injury, no money, no calendar):\n`)
  console.log(`      her ceiling      ${SKILL_KEYS.map((k) => `${k} ${theoreticalCeiling[k].toFixed(1)}`).join(' · ')}`)
  console.log(`      what she reaches ${SKILL_KEYS.map((k) => `${k} ${bestBuild[k].toFixed(1)}`).join(' · ')}`)
  console.log(
    `      mean-of-five ${bestMean.toFixed(1)} (ceiling ${meanFive(theoreticalCeiling).toFixed(1)}) · core ${meanFour(bestBuild).toFixed(1)}` +
      ` (ceiling ${meanFour(theoreticalCeiling).toFixed(1)}) · at age ${bestAge.toFixed(1)}`,
  )

  // The distribution of the CEILING itself, so §5 can be read against it.
  const cores: number[] = []
  for (let i = 0; i < 20000; i++) {
    const seed = `skill-ceiling-${i}`
    const pot = rollPotential(seed, startingSkills(seed, DEFAULT_PROFILE))
    cores.push(meanFour(pot))
  }
  console.log(
    `\n  THE CEILING DISTRIBUTION (20k rolls of rollPotential, mean-of-four – the FIELD table's own currency):` +
      `\n      p10 ${f1(pctl(cores, 0.1))} · p50 ${f1(pctl(cores, 0.5))} · p90 ${f1(pctl(cores, 0.9))}` +
      ` · p99 ${f1(pctl(cores, 0.99))} · max ${f1(Math.max(...cores))}`,
  )

  return { prodigy: bestProdigy.peakBuild, ceiling: bestBuild, theoretical: theoreticalCeiling }
}

// -------------------------------------------------------------------------------------------------
// §4 WHAT EACH DIAL IS WORTH
// -------------------------------------------------------------------------------------------------

interface Dial {
  label: string
  /** apply the counterfactual; return an undo */
  apply: () => () => void
  /** or a per-world mutation instead (coach rung, training plan) */
  mutate?: (w: WorldState) => void
}

function dials(): Dial[] {
  // ⚠ `ECONOMY` is `as const`, i.e. deeply readonly to the COMPILER and an ordinary mutable object at
  // RUNTIME. A measurement harness that sweeps a shipped constant has to say so once and out loud;
  // this is the same move `tools/field-quality.ts` makes on `TIERS.entrantPctBand`, and every arm
  // below restores what it changed before the next one runs.
  const d = ECONOMY.development as unknown as { matchBonus: number; potentialBand: [number, number] }
  const c = ECONOMY.development.ageCurve as unknown as Record<string, number>
  const set = (obj: Record<string, number>, key: string, value: number): (() => void) => {
    const old = obj[key]
    obj[key] = value
    return () => {
      obj[key] = old
    }
  }
  return [
    { label: 'baseline', apply: () => () => {} },
    {
      label: 'potentialBand hi 26 -> 40',
      apply: () => {
        const old = d.potentialBand[1]
        d.potentialBand[1] = 40
        return () => {
          d.potentialBand[1] = old
        }
      },
    },
    { label: 'peakRate x1.5 (.0062->.0093)', apply: () => set(c, 'peakRate', 0.0093) },
    { label: 'growthEase .5 -> .25', apply: () => set(c, 'growthEase', 0.25) },
    { label: 'plateauStart 23 -> 27', apply: () => set(c, 'plateauStart', 27) },
    { label: 'plateauRate .0009 -> .0031', apply: () => set(c, 'plateauRate', 0.0031) },
    { label: 'declineStart 29 -> 32', apply: () => set(c, 'declineStart', 32) },
    { label: 'matchBonus .18 -> .36', apply: () => set(d as unknown as Record<string, number>, 'matchBonus', 0.36) },
    // ⚠ THE COACH IS SWAPPED BY `coachId`, NOT BY `profile.coachTier`. `createWorld` reads the
    // profile ONCE, at birth, to pick the person on the rung (`openingCoachId`); by the time a bench
    // mutation runs, the world already holds a coach and the profile field is a record of what was
    // bought, not a live setting. A first cut of this arm moved the profile and measured +0.00,
    // which is what a no-op looks like.
    {
      label: 'coach: SELF (from elite rung)',
      apply: () => () => {},
      mutate: (w) => {
        w.coachId = null
      },
    },
    {
      label: 'coach: budget rung',
      apply: () => () => {},
      mutate: (w) => {
        w.coachId = bestFitCoachAt(w.seed, 14, 'budget', w.profile.playStyle)?.id ?? null
      },
    },
    {
      label: 'coach: middle rung',
      apply: () => () => {},
      mutate: (w) => {
        w.coachId = bestFitCoachAt(w.seed, 14, 'middle', w.profile.playStyle)?.id ?? null
      },
    },
    {
      label: 'plan: grind 85 (from balanced)',
      apply: () => () => {},
      mutate: (w) => {
        w.plan = { ...WEEK_PLAN_PRESETS.grind }
      },
    },
    {
      label: 'plan: light 60 (from balanced)',
      apply: () => () => {},
      mutate: (w) => {
        w.plan = { ...WEEK_PLAN_PRESETS.light }
      },
    },
  ]
}

function section4(): void {
  console.log(`\n${rule()}`)
  console.log('§4  WHAT EACH DIAL IS WORTH – one counterfactual at a time, identical seeds')
  console.log(rule())
  const preset = PRESETS[PRESETS.length - 1]
  const policy = POLICIES[1]
  console.log(`\n  cell: ${preset.label.trim()}, ${policy.label} policy, ${DIAL_SEEDS} seeds, full careers 14->38\n`)
  console.log(
    `  ${padEnd('dial', 32)}${pad('peak skill', 12)}${pad('d skill', 10)}${pad('realised', 10)}` +
      `${pad('best W rank', 13)}${pad('median W rank', 15)}${pad('paid', 7)}`,
  )

  let baselineSkill = NaN
  for (const dial of dials()) {
    const undo = dial.apply()
    const rows: CareerSkillRow[] = []
    for (let i = 0; i < DIAL_SEEDS; i++) {
      rows.push(runCareerSkills(preset, i, policy, { retire: 'plays-on', noBankruptcy: true, mutate: dial.mutate }))
    }
    undo()
    const skill = mean(rows.map((r) => r.peakMean))
    if (Number.isNaN(baselineSkill)) baselineSkill = skill
    const ranked = rows.filter((r) => r.peakWtaRank !== null).map((r) => r.peakWtaRank as number)
    console.log(
      `  ${padEnd(dial.label, 32)}${pad(skill.toFixed(2), 12)}${pad((skill - baselineSkill >= 0 ? '+' : '') + (skill - baselineSkill).toFixed(2), 10)}` +
        `${pad(`${(100 * mean(rows.map((r) => r.realised))).toFixed(1)}%`, 10)}` +
        `${pad(ranked.length ? `#${Math.min(...ranked)}` : '–', 13)}` +
        `${pad(ranked.length ? `#${pctl(ranked, 0.5).toFixed(0)}` : '–', 15)}` +
        `${pad(`${ranked.length}/${rows.length}`, 7)}`,
    )
  }

  // SKILL_POINTS_PER_YEAR is listed as a dial in the brief. It is not one, and the cheapest way to
  // say so is to measure the only channel it has: the birth-month head start.
  console.log(
    `\n  ⚠ SKILL_POINTS_PER_YEAR (${SKILL_POINTS_PER_YEAR}) IS NOT A GROWTH DIAL. Its only engine use is`,
  )
  console.log(`    \`relativeAgeHeadStart\`, worth ${relativeAgeHeadStart(1).toFixed(2)} points to a January girl and`)
  console.log(
    `    ${relativeAgeHeadStart(12).toFixed(2)} to a December one – a level at week 0, not a rate. Everything else that cites it`,
  )
  console.log(`    (kit, pace, equipment) uses it as a YARDSTICK. Measured, same seeds, birth month swept:\n`)
  console.log(`  ${padEnd('birth month', 20)}${pad('start', 10)}${pad('peak skill', 12)}${pad('best W rank', 13)}`)
  for (const bm of [1, 6, 12]) {
    const rows: CareerSkillRow[] = []
    for (let i = 0; i < DIAL_SEEDS; i++) {
      rows.push(
        runCareerSkills(preset, i, policy, {
          retire: 'plays-on',
          noBankruptcy: true,
          mutate: (w) => {
            w.profile = { ...w.profile, birthMonth: bm }
            w.skills = withHeadStart(startingSkills(w.seed, w.profile), bm)
          },
        }),
      )
    }
    const ranked = rows.filter((r) => r.peakWtaRank !== null).map((r) => r.peakWtaRank as number)
    console.log(
      `  ${padEnd(`month ${bm}`, 20)}${pad(mean(rows.map((r) => meanFive(r.start))).toFixed(2), 10)}` +
        `${pad(mean(rows.map((r) => r.peakMean)).toFixed(2), 12)}` +
        `${pad(ranked.length ? `#${Math.min(...ranked)}` : '–', 13)}`,
    )
  }

  // The HEADROOM SHAPE cannot be swapped by moving a constant, so it is measured on the pure model:
  // asymptotic (shipped) vs linear (a fixed share of the ORIGINAL headroom every week).
  console.log(`\n  THE HEADROOM SHAPE ITSELF (pure growth model, no world – the one dial that is not a constant):\n`)
  const startBuild = withHeadStart(startingSkills('shape-probe', DEFAULT_PROFILE), 6)
  const potential = rollPotential('shape-probe', startingSkills('shape-probe', DEFAULT_PROFILE))
  const coach = bestFitCoachAt('shape-probe', 16, 'elite', 'all-court')
  for (const linear of [false, true]) {
    let s: KidSkills = { ...startBuild }
    const head0 = {} as KidSkills
    for (const k of SKILL_KEYS) head0[k] = potential[k] - startBuild[k]
    let peak = meanFive(s)
    let peakAge = START_AGE
    for (let w = 0; w < (38 - START_AGE) * WEEKS_PER_YEAR; w++) {
      const age = START_AGE + w / WEEKS_PER_YEAR
      if (!linear) {
        s = growWeek({
          skills: s,
          potential,
          ageYears: age,
          plan: WEEK_PLAN_PRESETS.balanced,
          coach,
          playStyle: 'all-court',
          matchesThisWeek: 0,
          seed: 'shape-probe',
          week: w,
        })
      } else {
        // Same rate, same luck stream, but the gain is a share of the ORIGINAL headroom and the
        // result is clamped at the ceiling: growth that ARRIVES instead of approaching.
        const rate =
          ageFactor(age) *
          trainFactor(WEEK_PLAN_PRESETS.balanced) *
          coachFactor(tierOf(coach), coachFitFor(coach, 'all-court'))
        const out = { ...s }
        for (const k of SKILL_KEYS) {
          out[k] = Math.min(potential[k], s[k] + rate * head0[k])
        }
        s = out
      }
      if (meanFive(s) > peak) {
        peak = meanFive(s)
        peakAge = age
      }
    }
    console.log(
      `  ${padEnd(linear ? 'LINEAR (share of head0)' : 'ASYMPTOTIC (shipped)', 32)}` +
        `peak ${peak.toFixed(2)} of ceiling ${meanFive(potential).toFixed(2)}` +
        `  (${(100 * ((peak - meanFive(startBuild)) / (meanFive(potential) - meanFive(startBuild)))).toFixed(1)}% realised)` +
        `  at age ${peakAge.toFixed(1)}`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// §5 SKILL -> WINNING
// -------------------------------------------------------------------------------------------------

function buildPlayer(id: string, s: KidSkills, age = 24): MatchPlayer {
  return { id, name: id, serve: s.serve, ret: s.ret, composure: s.composure, stamina: s.stamina, groundstrokes: s.groundstrokes, age }
}
function flatPlayer(core: number, id: string, age = 24): MatchPlayer {
  return { id, name: id, serve: core, ret: core, composure: core, stamina: core, groundstrokes: core, age }
}

/** WHERE SHE WOULD STAND IF THE TABLE WERE SORTED BY HOW GOOD SHE IS. Count the players in the
 *  world she would LOSE to more often than not; her skill rank is that count + 1. Both sides fresh
 *  (condition 100) and on a neutral hard court, so this is a statement about the builds and nothing
 *  else – exactly the comparison `FIELD.tiers`' own calibration note is denominated in. */
function skillRank(build: MatchPlayer, seed: string, seasonIndex: number): { rank: number; ofPros: number } {
  const pros = fieldProsFor(seed, seasonIndex)
  let losses = 0
  for (const p of pros) {
    const opp = rivalMatchPlayer(p, 'hard', ECONOMY.condition.max)
    if (fastMatchProbability(build, opp, { surface: 'hard', tour: 'wta', seed: '' }) < 0.5) losses++
  }
  return { rank: losses + 1, ofPros: pros.length }
}

function section5(peaks: { label: string; build: KidSkills }[]): void {
  console.log(`\n${rule()}`)
  console.log('§5  SKILL -> WINNING – what her peak build is worth against the world the game contains')
  console.log(rule())

  // The rungs' measured field cores, straight from calendar.ts's own W2-FIELD2 table, plus the
  // storeys from fieldPros.ts. One ruler: mean-of-four.
  const opponents: { label: string; core: number }[] = [
    { label: 'W15 field (mean core)', core: 48.5 },
    { label: 'W35 field', core: 50.4 },
    { label: 'W50 field', core: 55.1 },
    { label: 'W75 field', core: 60.0 },
    { label: 'W100 field', core: 65.9 },
    { label: 'WTA 125 field', core: 70.7 },
    { label: 'median elite storey', core: 61.0 },
    { label: 'median tourElite storey', core: 72.0 },
    { label: 'the world #1 (top of band)', core: 77.0 },
  ]

  console.log(`\n  P(she wins a best-of-3), closed form, both fresh, hard court:\n`)
  console.log(`  ${padEnd('build', 34)}${opponents.map((o) => pad(o.core.toFixed(0), 8)).join('')}`)
  console.log(`  ${padEnd('opponent core ->', 34)}${opponents.map((o) => pad(o.label.slice(0, 7), 8)).join('')}`)
  for (const { label, build } of peaks) {
    const me = buildPlayer('me', build)
    console.log(
      `  ${padEnd(`${label} (core ${meanFour(build).toFixed(1)})`, 34)}` +
        opponents
          .map((o) =>
            pad(
              `${(100 * fastMatchProbability(me, flatPlayer(o.core, o.label), { surface: 'hard', tour: 'wta', seed: '' })).toFixed(0)}%`,
              8,
            ),
          )
          .join(''),
    )
  }

  console.log(`\n  HER SKILL RANK – how many of the world's ${FIELD.size} professionals beat her more often than not:\n`)
  console.log(`  ${padEnd('build', 40)}${pad('core', 8)}${pad('skill rank', 13)}${pad('points rank needed', 20)}`)
  for (const { label, build } of peaks) {
    const me = buildPlayer('me', build)
    const { rank, ofPros } = skillRank(me, 'skill-ceiling-world', 4)
    console.log(
      `  ${padEnd(label, 40)}${pad(meanFour(build).toFixed(1), 8)}${pad(`#${rank} of ${ofPros}`, 13)}` +
        `${pad('see §2 peak W rank', 20)}`,
    )
  }

  // And the inverse: what core does she need to be a genuine top-N player?
  console.log(`\n  WHAT CORE A GIVEN WORLD RANK COSTS (same world, skill-sorted):\n`)
  console.log(`  ${padEnd('flat core', 14)}${pad('skill rank', 14)}${pad('P(beats median tourElite)', 28)}`)
  for (const core of [50, 55, 60, 63, 66, 69, 72, 75, 78, 81, 84]) {
    const me = flatPlayer(core, `c${core}`)
    const { rank } = skillRank(me, 'skill-ceiling-world', 4)
    const p = fastMatchProbability(me, flatPlayer(72, 'te'), { surface: 'hard', tour: 'wta', seed: '' })
    console.log(`  ${padEnd(core.toFixed(0), 14)}${pad(`#${rank}`, 14)}${pad(`${(100 * p).toFixed(1)}%`, 28)}`)
  }

  // The cohort, for scale: the juniors she actually spends her teens beating.
  const pros = fieldProsFor('skill-ceiling-world', 4)
  const proCores = pros.map((p) => power(p)).sort((a, b) => b - a)
  console.log(
    `\n  the world's pro cores: #1 ${f1(proCores[0])} · #10 ${f1(proCores[9])} · #50 ${f1(proCores[49])}` +
      ` · #100 ${f1(proCores[99])} · #200 ${f1(proCores[199])} · #364 ${f1(proCores[proCores.length - 1])}`,
  )

  // -----------------------------------------------------------------------------------------------
  // AND THE HALF THAT DECIDES THE VERDICT: from skill, to POINTS, to a RANK.
  // -----------------------------------------------------------------------------------------------
  //
  // A skill rank is what she DESERVES; the table sorts on points. `mergedWtaRanking` is the engine's
  // own sort, so handing it a single LIVE row holding X points and reading back its place is the
  // exact points-to-rank curve of this world – not an approximation of it.
  const rankForPoints = (points: number): number => {
    const merged = mergedWtaRanking([{ playerId: 'kid', points, rank: 0 }], pros)
    return merged.find((r) => r.playerId === 'kid')?.rank ?? merged.length
  }
  console.log(`\n  THE POINTS-TO-RANK CURVE OF THIS WORLD (mergedWtaRanking, one live row):\n`)
  const ptsMarks = [10, 50, 100, 160, 250, 400, 650, 1000, 1400, 2500]
  console.log(`  ${padEnd('W points', 14)}${ptsMarks.map((p) => pad(p, 8)).join('')}`)
  console.log(`  ${padEnd('rank', 14)}${ptsMarks.map((p) => pad(`#${rankForPoints(p)}`, 8)).join('')}`)

  // WHAT HER SKILL IS WORTH IN POINTS. Approximating a rung's whole field by its measured mean core
  // (calendar.ts's own W2-FIELD2 table), a 32-draw is five rounds of the same coin, so the finish
  // distribution is closed form and `TIERS[tier].points[finish]` prices it. `bestN` for the W table
  // is 16, so sixteen events of that rung is the standing she would hold playing nothing else.
  //
  // ⚠ THE POINTS COME OFF `TIERS`, NOT OFF A COPY (points-by-the-book, 05.08). This table used to
  // carry its own transcription of all six rows, which went stale the moment W15 and W35 were
  // corrected to the chart they are named after – and stale silently, because a hand-copied array
  // still adds up. Only the measured FIELD CORE is a number of this tool's own, because it comes
  // from tools/field-quality.ts and not from the tier table.
  const rungs: { tier: TierId; core: number; points: readonly number[] }[] = (
    [
      { tier: 'w15', core: 48.5 },
      { tier: 'w35', core: 50.4 },
      { tier: 'w50', core: 55.1 },
      { tier: 'w75', core: 60.0 },
      { tier: 'w100', core: 65.9 },
      { tier: 'wta125', core: 70.7 },
    ] as const
  ).map((r) => ({ tier: r.tier, core: r.core, points: TIERS[r.tier].points }))
  const expectedPoints = (p: number, pts: readonly number[]): number => {
    // finish 0 = champion (5 wins), 1 = finalist, ... 5 = first-round loss
    let e = 0
    for (let finish = 0; finish <= 5; finish++) {
      const wins = 5 - finish
      const prob = finish === 0 ? Math.pow(p, 5) : Math.pow(p, wins) * (1 - p)
      e += prob * (pts[finish] ?? 0)
    }
    return e
  }
  const SLOTS = BEST_N_BY_TRACK.wta
  console.log(`\n  FROM SKILL TO POINTS – E[points] per event by rung, and the best-${SLOTS} that buys:\n`)
  console.log(
    `  ${padEnd('build', 34)}${rungs.map((r) => pad(r.tier, 10)).join('')}${pad(`best-${SLOTS}`, 10)}${pad('=> rank', 10)}`,
  )
  for (const { label, build } of peaks) {
    const me = buildPlayer('me', build)
    const perRung = rungs.map((r) => {
      const p = fastMatchProbability(me, flatPlayer(r.core, r.tier), { surface: 'hard', tour: 'wta', seed: '' })
      return expectedPoints(p, r.points)
    })
    const bestRung = Math.max(...perRung)
    const best16 = SLOTS * bestRung
    console.log(
      `  ${padEnd(label, 34)}${perRung.map((e) => pad(e.toFixed(1), 10)).join('')}` +
        `${pad(best16.toFixed(0), 10)}${pad(`#${rankForPoints(best16)}`, 10)}`,
    )
  }
  console.log(
    `\n  (best-${SLOTS} = ${SLOTS} events of her BEST rung, every result counting – an upper bound on what the`,
  )
  console.log(`   shipped points table can pay a player of that skill, before entry gates and fatigue.)`)

  // AND WHERE SKILL MEETS FATIGUE. rank-plateau.md §5 measured a grinder on court at 0.707 of
  // herself; the condition factor multiplies every attribute, so it is a skill discount and belongs
  // on this ruler.
  console.log(`\n  THE SAME BUILDS, DISCOUNTED BY CONDITION (conditionMatchFactor multiplies every attribute):\n`)
  console.log(`  ${padEnd('build', 34)}${pad('fresh', 12)}${pad('x0.89 (cond 70)', 18)}${pad('x0.71 (cond 19)', 18)}`)
  for (const { label, build } of peaks) {
    const scaled = (f: number): KidSkills => {
      const out = {} as KidSkills
      for (const k of SKILL_KEYS) out[k] = build[k] * f
      return out
    }
    const ranks = [1, 0.892, 0.707].map((f) => skillRank(buildPlayer('me', scaled(f)), 'skill-ceiling-world', 4).rank)
    console.log(
      `  ${padEnd(label, 34)}${pad(`#${ranks[0]}`, 12)}${pad(`#${ranks[1]}`, 18)}${pad(`#${ranks[2]}`, 18)}`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------------------
console.log(rule())
console.log('SKILL CEILING PROBE – is the development model the binding constraint?')
console.log(`  career seeds ${CAREER_SEEDS} · dial seeds ${DIAL_SEEDS} · full careers = ${FULL_CAREER_WEEKS} weeks (14->38)`)
console.log(rule())

if (wants('1')) section1()
let pop: CareerSkillRow[] = []
if (wants('2')) pop = section2()
let ceilings: { prodigy: KidSkills; ceiling: KidSkills; theoretical: KidSkills } | null = null
if (wants('3')) ceilings = section3()
if (wants('4')) section4()
if (wants('5')) {
  const peaks: { label: string; build: KidSkills }[] = []
  if (pop.length) {
    const sorted = [...pop].sort((a, b) => a.peakMean - b.peakMean)
    peaks.push({ label: 'median managed career, peak', build: sorted[Math.floor(sorted.length / 2)].peakBuild })
    peaks.push({ label: 'best managed career, peak', build: sorted[sorted.length - 1].peakBuild })
  }
  if (ceilings) {
    peaks.push({ label: 'top-of-band prodigy, peak', build: ceilings.prodigy })
    peaks.push({ label: 'THE ATHLETIC CEILING', build: ceilings.ceiling })
  }
  if (peaks.length === 0) {
    // --only 5: still useful on its own, with a reference build.
    peaks.push({ label: 'reference strong junior', build: { serve: 66, ret: 50, composure: 57, stamina: 54, groundstrokes: 65 } })
  }
  section5(peaks)
}
