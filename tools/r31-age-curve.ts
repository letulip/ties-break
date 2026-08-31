// ROUND 31 #10/#13 – THE AGE CURVE BENCH. What the fork, the spread and a broken body actually do
// to the age a career stops performing, measured rather than asserted (CLAUDE.md invariant 5).
//
// Run: `npm run bench:agecurve` (add `--seeds N` for the pure arms, `--careers N` for the walked one).
//
// ⚠ FIVE ARMS, AND THEY ANSWER DIFFERENT KINDS OF QUESTION, cheapest first:
//   1. THE SPREAD, hers        – pure arithmetic over N seeds. No world is built; the draw is a
//                                function of the seed alone, so a world would add cost and nothing.
//   2. THE SPREAD, the field's – the same question of `aiDeclineStart` over real generated cohorts.
//   3. WHERE SHE PEAKS         – a growth-only walk, direct against college, on ONE seed and one
//                                plan so the route is the only thing that differs. This is the arm
//                                that answers "does a direct career really peak earlier".
//   4. THE INJURY CONTROL      – the same walk again at several injury loads, everything else held.
//                                Two careers identical but for injury load, which is the control the
//                                claim needs.
//   5. A REAL CAREER           – `openCareer` / `stepCareerWeek` to age 33, the fork answered both
//                                ways, so the claim is checked against the shipped tick and not only
//                                against the two functions the first four arms call.
import {
  ageCurveOf,
  declineFactor,
  declineSpreadOf,
  growWeek,
  physicalMean,
  resolveAgeCurve,
  rollPotential,
  type AgeCurveBounds,
  type KidSkills,
} from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { COHORT, aiDeclineStart, generateCohort } from '../src/engine/season/cohort'
import { WEEK_PLAN_PRESETS, DEFAULT_PROFILE } from '../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import {
  startingSkills,
  answerFork,
  answerRetirement,
  callUpRevealOpen,
  chooseGift,
  closeTournament,
  collegeLeagueRevealOpen,
  kidAgeExact,
  pendingBirthday,
  resumeFromCollege,
  skipTournament,
  type WorldState,
} from '../src/engine/world'
import { weeksLostSoFar } from '../src/engine/ending'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean } from './econ-bench'

const argOf = (name: string, fallback: number): number => {
  const next = process.argv[process.argv.indexOf(`--${name}`) + 1]
  const n = Number(next)
  return Number.isFinite(n) ? n : fallback
}
const SEEDS = argOf('seeds', 4000)
const CAREERS = argOf('careers', 2)

const rule = (s: string) => console.log(`\n${'='.repeat(96)}\n${s}\n${'='.repeat(96)}`)
const f2 = (x: number) => x.toFixed(2)
function stat(xs: number[]): string {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.reduce((p, c) => p + c, 0) / s.length
  const sd = Math.sqrt(s.reduce((p, c) => p + (c - m) ** 2, 0) / s.length)
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))]
  return `n=${s.length}  mean ${f2(m)}  sd ${f2(sd)}  p10 ${f2(q(0.1))}  median ${f2(q(0.5))}  p90 ${f2(q(0.9))}  range ${f2(s[0])}..${f2(s[s.length - 1])}`
}
function histogram(xs: number[], lo: number, hi: number, step = 0.5): void {
  const buckets = new Map<number, number>()
  for (const x of xs) {
    const b = Math.floor(x / step) * step
    buckets.set(b, (buckets.get(b) ?? 0) + 1)
  }
  const top = Math.max(...buckets.values())
  for (let b = Math.floor(lo / step) * step; b <= hi; b += step) {
    const n = buckets.get(Number(b.toFixed(6))) ?? buckets.get(b) ?? 0
    console.log(`  ${b.toFixed(1).padStart(5)}  ${'#'.repeat(Math.round((n / top) * 50)).padEnd(50)} ${n}`)
  }
}

// -------------------------------------------------------------------------------------------------
rule('1. THE SPREAD SHE DRAWS – declineStart over ' + SEEDS + ' careers, by route')
console.log(`  base pairs: direct ${JSON.stringify(ECONOMY.development.ageRoutes.direct)}  ` +
  `college ${JSON.stringify(ECONOMY.development.ageRoutes.college)}  band ±${ECONOMY.development.declineSpreadYears}`)
const seedsOf = (n: number) => Array.from({ length: n }, (_, i) => `curve-seed-${i}`)
const direct = seedsOf(SEEDS).map((s) => resolveAgeCurve(s, 'direct').declineStart)
const college = seedsOf(SEEDS).map((s) => resolveAgeCurve(s, 'college').declineStart)
console.log(`\n  direct : ${stat(direct)}`)
console.log(`  college: ${stat(college)}`)
console.log('\n  direct')
histogram(direct, 25, 29)
console.log('  college')
histogram(college, 27, 31)
const overlap = direct.filter((d) => d > Math.min(...college)).length
console.log(`\n  ⭐ the routes OVERLAP: ${overlap} of ${SEEDS} direct careers decline later than the earliest college one`)
console.log(`     (a band narrower than the 2-year route gap would make the fork strictly dominant)`)
console.log(`  ⚠ the draw is a function of the SEED ALONE – asked twice it answers the same:`)
console.log(`     declineSpreadOf('curve-seed-0') = ${declineSpreadOf('curve-seed-0').toFixed(6)} / ` +
  `${declineSpreadOf('curve-seed-0').toFixed(6)}`)

// -------------------------------------------------------------------------------------------------
rule('2. THE SPREAD THE FIELD DRAWS – aiDeclineStart over real cohorts')
console.log(`  base ${COHORT.ageCurve.declineStart}  band ±${COHORT.declineSpreadYears}  (one base: a rival has no college fork)`)
const rivals: number[] = []
for (const s of ['bench-working-0', 'bench-middle-0', 'bench-wealthy-0']) {
  for (const p of generateCohort(s)) rivals.push(aiDeclineStart(s, p.id))
}
console.log(`\n  cohort : ${stat(rivals)}`)
histogram(rivals, 27, 31)
const perWorld = ['bench-working-0', 'bench-middle-0'].map((s) => aiDeclineStart(s, 'ai-3'))
console.log(`\n  ⚠ the world seed is in the key, so slot 'ai-3' is a different body in a different career:` +
  ` ${f2(perWorld[0])} vs ${f2(perWorld[1])}`)

// -------------------------------------------------------------------------------------------------
// A GROWTH-ONLY WALK. `growWeek` is the only writer of her build, so a walk over it IS her career's
// physical arc – with none of a world's noise, which is what makes the route the only difference.
function walkBuild(seed: string, bounds: AgeCurveBounds, weeksLostAtAge?: (age: number) => number) {
  let skills: KidSkills = startingSkills(seed, DEFAULT_PROFILE)
  const potential = rollPotential(seed, skills)
  let peak = physicalMean(skills)
  let peakAge = 14
  const byAge = new Map<number, number>()
  for (let week = 0; week < WEEKS_PER_YEAR * 27; week++) {
    const age = kidAgeExact(week, DEFAULT_PROFILE.birthMonth, DEFAULT_PROFILE.birthDay)
    const used = weeksLostAtAge
      ? ageCurveOf({ ...bounds, injuryFrom: 0 }, weeksLostAtAge(age))
      : bounds
    skills = growWeek({
      skills,
      potential,
      ageYears: age,
      plan: WEEK_PLAN_PRESETS.balanced,
      coach: null,
      playStyle: DEFAULT_PROFILE.playStyle,
      matchesThisWeek: 1,
      seed,
      week,
      bounds: used,
    })
    const now = physicalMean(skills)
    if (now > peak) {
      peak = now
      peakAge = age
    }
    const whole = Math.floor(age)
    if (!byAge.has(whole)) byAge.set(whole, now)
    else byAge.set(whole, Math.max(byAge.get(whole)!, now))
  }
  const share = (s: number) => {
    for (const [a, v] of [...byAge].sort((x, y) => x[0] - y[0])) if (a > peakAge && v / peak <= s) return a
    return NaN
  }
  return { peak, peakAge, byAge, at95: share(0.95), at90: share(0.9), at80: share(0.8) }
}

rule('3. WHERE SHE ACTUALLY PEAKS – the same seed, the same plan, one thing different: the route')
const SEED = 'curve-walk-0'
const dCurve = resolveAgeCurve(SEED, 'direct')
const cCurve = resolveAgeCurve(SEED, 'college')
console.log(`  seed ${SEED}   direct ${JSON.stringify(dCurve)}   college ${JSON.stringify(cCurve)}`)
const dWalk = walkBuild(SEED, dCurve)
const cWalk = walkBuild(SEED, cCurve)
console.log(`\n  route     peak physical   peaks at   falls to 95%   90%    80%`)
console.log(`  direct    ${f2(dWalk.peak).padStart(13)}   ${f2(dWalk.peakAge).padStart(8)}   ${String(dWalk.at95).padStart(12)}   ${String(dWalk.at90).padStart(3)}   ${String(dWalk.at80).padStart(4)}`)
console.log(`  college   ${f2(cWalk.peak).padStart(13)}   ${f2(cWalk.peakAge).padStart(8)}   ${String(cWalk.at95).padStart(12)}   ${String(cWalk.at90).padStart(3)}   ${String(cWalk.at80).padStart(4)}`)
console.log('\n  physical mean by age (the two arcs, side by side)')
console.log('   age    direct   college     gap')
for (let a = 20; a <= 36; a++) {
  const d = dWalk.byAge.get(a)
  const c = cWalk.byAge.get(a)
  if (d === undefined || c === undefined) continue
  console.log(`   ${String(a).padStart(3)}   ${f2(d).padStart(7)}   ${f2(c).padStart(7)}   ${(d - c >= 0 ? '+' : '') + f2(d - c)}`)
}

// ...and over many seeds, so the finding is not one career's arithmetic.
const peakGap: number[] = []
const levelGapAt30: number[] = []
for (let i = 0; i < 24; i++) {
  const s = `curve-walk-${i}`
  const d = walkBuild(s, resolveAgeCurve(s, 'direct'))
  const c = walkBuild(s, resolveAgeCurve(s, 'college'))
  peakGap.push(c.peakAge - d.peakAge)
  const d30 = d.byAge.get(30)
  const c30 = c.byAge.get(30)
  if (d30 !== undefined && c30 !== undefined) levelGapAt30.push(c30 - d30)
}
console.log(`\n  over 24 seeds: college peaks ${f2(mean(peakGap))} years later than the same girl going direct`)
console.log(`                 and at 30 she is ${f2(mean(levelGapAt30))} physical points ahead of her direct self`)

// -------------------------------------------------------------------------------------------------
rule('4. THE INJURY CONTROL – two careers identical but for injury load')
console.log(`  ${ECONOMY.development.declinePullPerInjuryWeek} years of peak per week off court` +
  ` (1 year per ${Math.round(1 / ECONOMY.development.declinePullPerInjuryWeek)} weeks)`)
console.log(`\n  weeks lost   declineStart   peak physical   peaks at   falls to 90%   at 32`)
for (const lost of [0, 10, 20, 40, 80, 120, 200]) {
  const bounds = resolveAgeCurve(SEED, 'college')
  const w = walkBuild(SEED, bounds, () => lost)
  const resolved = ageCurveOf({ ...bounds, injuryFrom: 0 }, lost)
  console.log(
    `  ${String(lost).padStart(10)}   ${f2(resolved.declineStart).padStart(12)}   ${f2(w.peak).padStart(13)}` +
      `   ${f2(w.peakAge).padStart(8)}   ${String(w.at90).padStart(12)}   ${f2(w.byAge.get(32) ?? NaN).padStart(5)}`,
  )
}
console.log('\n  ⚠ EVERY ROW IS THE SAME SEED, THE SAME PLAN AND THE SAME POTENTIAL. The only input that')
console.log('    moves is the weeks her body has spent off court, which is what makes this a control')
console.log('    rather than a demonstration.')
console.log(`\n  and the floor holds: a body that has lost 400 weeks reads ` +
  `${f2(ageCurveOf({ ...resolveAgeCurve(SEED, 'direct'), injuryFrom: 0 }, 400).declineStart)}` +
  ` (plateauStart + 1), never below the plateau`)
console.log(`  the shape past the peak is untouched: declineFactor(31) on a 29 curve = ` +
  `${declineFactor(31, { plateauStart: 23, declineStart: 29 }).toFixed(6)}, on a 27 curve = ` +
  `${declineFactor(31, { plateauStart: 22, declineStart: 27 }).toFixed(6)}`)

// -------------------------------------------------------------------------------------------------
rule(`5. A REAL CAREER, THROUGH THE SHIPPED TICK – ${CAREERS} seed(s) x both fork answers, to age 33`)
const WEEKS = Math.round(WEEKS_PER_YEAR * 19)
for (let i = 0; i < CAREERS; i++) {
  for (const arm of ['continue', 'college'] as const) {
    const { world, rng } = openCareer(PRESETS[5], i, POLICIES[0])
    world.fundsCents = 5_000_000_00 // the money is not what this arm measures
    let resolvedAt: number | null = null
    let peak = 0
    let peakAge = 0
    for (let w = 0; w < WEEKS; w++) {
      if (world.fork !== null && world.fork.answer === null) {
        answerFork(world, arm)
        resolvedAt = world.week
      }
      // ⚠ THE COLLEGE ARM HAS TO BE PRESSED THROUGH OR IT IS NOT A CAREER – `endings-bench`'s own
      // shape. The answer latches a `college` ending at the September departure and each year is
      // resumed one press at a time, with a birthday gift chosen in between. Without this the walk
      // stops at nineteen and the college row reports a peak she reached as a junior.
      //
      // ⚠⚠ CAPPED, BECAUSE `resumeFromCollege` CAN RETURN WITHOUT SPENDING A YEAR. Three of its
      // guards (`college-league`, `call-up`, `birthday`) are RETURNS rather than throws – nothing is
      // mutated and the same press works once the reveal is answered – so an unconditional `while`
      // is an infinite loop the first time this bench meets one, which is exactly what it did. Four
      // years cost about eight presses with the birthday pauses; twelve is headroom, and a career
      // that has not cleared by then leaves the walk with its state named rather than hanging.
      for (let press = 0; press < 24 && world.ending?.type === 'college'; press++) {
        resumeFromCollege(world, rng)
        if (pendingBirthday(world) !== null) chooseGift(world, 'day')
        // ⚠ AND THE FRESHMAN CHAMPIONSHIP AND THE NATIONS CUP TIE COME DOWN THE TOUR'S OWN FLOW
        // (rounds 26 #6 / 27 #6). `resumeFromCollege` RETURNS on either – nothing mutated, the same
        // press works once it is answered – so a bench that never answers one presses for ever
        // against a year it cannot spend. `skipTournament` + `closeTournament` is «Skip all rounds»
        // then «Continue», the same two commands the screen sends.
        if (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)) {
          skipTournament(world)
          closeTournament(world)
        }
      }
      // ...and «one more year» every winter, so the arm measures the body rather than the answer.
      if (world.retirementOffer !== null) answerRetirement(world, false)
      if (world.ending) break
      stepCareerWeek(world, rng, POLICIES[0])
      const now = physicalMean(world.skills)
      if (now > peak) {
        peak = now
        peakAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
      }
    }
    const w2 = world as WorldState
    console.log(
      `  seed ${i} · fork "${arm}"  ->  ageCurve ${JSON.stringify(w2.ageCurve)}  written w${resolvedAt}` +
        `  ·  resolved declineStart ${f2(ageCurveOf(w2.ageCurve, weeksLostSoFar(w2)).declineStart)}` +
        `  ·  weeks lost ${weeksLostSoFar(w2)}  ·  peak ${f2(peak)} at ${f2(peakAge)}` +
        `  ·  ended ${world.ending?.type ?? 'still playing'}`,
    )
  }
}
console.log('\n  ⚠ `ageCurve` is ABSENT until the fork is answered – which is what keeps the eighteen frozen')
console.log('    career hashes still (they stop at week 156, age 16.6) and is why the write is here and')
console.log('    not in `createWorld`. See docs/specs/age-curve-fork-and-spread.md §6.')
