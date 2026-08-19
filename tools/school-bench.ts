// THE SCHOOL BENCH (W4-SCHOOL) – `npx vite-node tools/school-bench.ts`. A measurement harness, run
// by hand, never part of a gate. Same shape as the summer / skill / econ benches.
//
// THE OWNER'S TWO CLAIMS, and this tool exists because only one of them is a fact about the code:
//
//   1. «Школа должна когда-то закончиться, ей уже 21... Школа уже после 18 вроде не должна быть.»
//      That is a BUG REPORT and it needed no measurement – `isExamWeek` was a pure function of the
//      season week, so a twenty-two-year-old still sat papers. §1 measures what FIXING it costs and
//      buys on its own, with no training change attached, because the two must not be confused.
//   2. «а тренировки и прогресс должны удвоиться» – training and progress should double. That is a
//      BALANCE CHANGE, and invariant 4 says a balance change ships with a bench and a spec recording
//      predicted vs measured. §2 sweeps the dial from 1.0 to 2.0 and §3 sends the bill to the body.
//
// ⚠ THE SHIPPED ARM IS `ECONOMY.school.lastGrade = 99`, WHICH IS THE GAME AS IT WAS. `gradeOf`
// returns a grade for ever, `schoolEndWeek` lands past the end of any career, so the exam fortnight
// never lifts and `summerLoadFactor` never sees a post-school week. Every other code path is
// identical and nothing here spends a draw on any stream, so the arms walk byte-identical MAIN
// sequences and the difference is school and nothing else. Same `withScenario` idiom the fatigue
// bench and `tools/summer-bench.ts` use.
//
// USAGE
//   npx vite-node tools/school-bench.ts                 # everything, 2 seeds a preset
//   npx vite-node tools/school-bench.ts --seeds 4
//   npx vite-node tools/school-bench.ts --only 0,1      # sections, comma separated
//   npx vite-node tools/school-bench.ts --only 4      # v47: what NOT doubling costs (§4)
import { openCareer, stepCareerWeek, PRESETS, POLICIES, type Preset, type Policy } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, type WorldState } from '../src/engine/world'
import { kidAgeExact } from '../src/engine/world/age'
import { schoolEndWeek } from '../src/engine/kidLife'
import { summerBlockWeek, pastSchool } from '../src/engine/world/summer'
import { SKILL_KEYS, type KidSkills } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { planFromWeek } from '../src/engine/plan'
import type { SessionKind, WeekPlan } from '../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 2)
const onlyArg = args.indexOf('--only') >= 0 ? (args[args.indexOf('--only') + 1] ?? '') : ''
const ONLY = new Set(onlyArg.split(',').filter(Boolean))
const wants = (s: string): boolean => ONLY.size === 0 || ONLY.has(s)

const meanFive = (s: KidSkills): number => SKILL_KEYS.reduce((a, k) => a + s[k], 0) / SKILL_KEYS.length
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
function pctl(xs: number[], q: number): number {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))]
}
const pad = (s: string | number, w: number): string => String(s).padStart(w)
const padE = (s: string | number, w: number): string => String(s).padEnd(w)
const rule = (n = 108): string => '='.repeat(n)

// -------------------------------------------------------------------------------------------------
// the scenario – ONE object patched in place, restored in a finally, exactly like summer-bench
// -------------------------------------------------------------------------------------------------
interface Scenario {
  label: string
  /** 99 = the shipped game: school never ends */
  lastGrade: number
  loadFactor: number
  conditionCost: number
}
const SHIPPED_SCHOOL = { ...ECONOMY.school }

function withScenario<T>(s: Scenario, fn: () => T): T {
  Object.assign(ECONOMY.school, {
    lastGrade: s.lastGrade,
    loadFactor: s.loadFactor,
    conditionCost: s.conditionCost,
  })
  try {
    return fn()
  } finally {
    Object.assign(ECONOMY.school, SHIPPED_SCHOOL)
  }
}

const NEVER: Scenario = { label: 'school never ends (SHIPPED)', lastGrade: 99, loadFactor: 1, conditionCost: 0 }
const ENDS_FLAT: Scenario = { label: 'school ends, load 1.0', lastGrade: 12, loadFactor: 1, conditionCost: 0 }

// -------------------------------------------------------------------------------------------------
// the career runner
// -------------------------------------------------------------------------------------------------
interface Row {
  peakMean: number
  peakAge: number
  realised: number
  wtaRank: number | null
  kidRank: number
  ending: string | null
  endedAge: number | null
  weeksLived: number
  entries: number
  /** weeks the post-school block was live (school-free, trainable, not racing) */
  blockWeeks: number
  /** weeks lived past the leaving September */
  postSchoolWeeks: number
  onsets: number
  weeksLost: number
  seasonsLived: number
  seasonsWithOnset: number
  meanCondition: number
  /** her condition on the last week before the off-season, averaged over the seasons she lived */
  doorCondition: number
  /** events entered per season lived */
  entriesPerSeason: number
}

interface ArmOpts {
  playsOn?: boolean
  noBankruptcy?: boolean
  /** ⚠ v47 – THE WEEK IS THE PLAN, so an arm can now state what she actually does with her days
   *  (docs/specs/training-dials.md §3). Omitted = whatever `openCareer` opens with, which is
   *  `WEEK_PLAN_PRESETS.balanced` and therefore an UNDOUBLED week – the shape a migrated career
   *  loads as. §4 is the A/B this exists for. */
  plan?: WeekPlan
}

function runCareer(preset: Preset, index: number, policy: Policy, opts: ArmOpts = {}): Row {
  const { world, rng } = openCareer(preset, index, policy)
  if (opts.plan) world.plan = { ...opts.plan, week: opts.plan.week?.map((d) => [...d]) }
  const start: KidSkills = { ...world.skills }
  const potential: KidSkills = { ...world.potential }
  const peak: KidSkills = { ...world.skills }
  let peakMean = meanFive(world.skills)
  let peakAge = 14
  let wtaRank: number | null = null
  let kidRank = world.kidRank
  let blockWeeks = 0
  let postSchoolWeeks = 0
  let onsets = 0
  let conditionSum = 0
  let doorSum = 0
  let doors = 0
  const onsetSeasons = new Set<number>()
  const everEntered = new Set<string>()

  for (let i = 0; i < FULL_CAREER_WEEKS && world.ending === null; i++) {
    if (opts.noBankruptcy) world.debtSinceWeek = null
    // ⚠ ASKED AGAINST THE WEEK THE TICK IS ABOUT TO RESOLVE, the same correction summer-bench makes:
    // `tickWeek` increments `world.week` at its first statement.
    const probe = { ...world, week: world.week + 1 } as WorldState
    if (summerBlockWeek(probe) && pastSchool(probe)) blockWeeks++
    if (pastSchool(probe)) postSchoolWeeks++
    const injuryBefore = world.injury
    stepCareerWeek(world, rng, policy)
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) {
      const { reason, final } = world.retirementOffer
      answerRetirement(world, final ? true : !opts.playsOn && reason === 'plateau')
    }
    for (const id of world.entries) everEntered.add(id)
    if (world.injury !== null && injuryBefore === null) {
      onsets++
      onsetSeasons.add(Math.floor(world.week / WEEKS_PER_YEAR))
    }
    for (const k of SKILL_KEYS) if (world.skills[k] > peak[k]) peak[k] = world.skills[k]
    const m = meanFive(world.skills)
    if (m > peakMean) {
      peakMean = m
      peakAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    }
    if (world.kidRank < kidRank) kidRank = world.kidRank
    if (world.careerTotals.prizeCents > 0) {
      const w = world.kidRankWta ?? world.cohort.length + 1
      if (wtaRank === null || w < wtaRank) wtaRank = w
    }
    conditionSum += world.condition
    // THE OFF-SEASON DOOR – season-week 49, the first off-season week, which is the reading
    // `docs/specs/fatigue-injury-audit-2026-08.md` §2 reports as "the off-season door (wk 49)".
    if (world.week % WEEKS_PER_YEAR === 49) {
      doorSum += world.condition
      doors++
    }
  }

  let realisedSum = 0
  for (const k of SKILL_KEYS) {
    const head = potential[k] - start[k]
    realisedSum += head > 0 ? Math.min(1, Math.max(0, (peak[k] - start[k]) / head)) : 1
  }
  const seasonsLived = Math.max(1, Math.ceil(world.week / WEEKS_PER_YEAR))
  return {
    peakMean,
    peakAge,
    realised: realisedSum / SKILL_KEYS.length,
    wtaRank,
    kidRank,
    ending: world.ending?.type ?? null,
    endedAge: world.ending ? kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay) : null,
    weeksLived: world.week,
    entries: everEntered.size,
    blockWeeks,
    postSchoolWeeks,
    onsets,
    weeksLost: world.careerTotals.weeksLostToInjury,
    seasonsLived,
    seasonsWithOnset: onsetSeasons.size,
    meanCondition: conditionSum / Math.max(1, world.week),
    doorCondition: doors ? doorSum / doors : NaN,
    entriesPerSeason: everEntered.size / seasonsLived,
  }
}

// -------------------------------------------------------------------------------------------------
// populations
// -------------------------------------------------------------------------------------------------
function population(policy: Policy, opts: ArmOpts = {}): Row[] {
  const rows: Row[] = []
  for (const preset of PRESETS) for (let i = 0; i < SEEDS; i++) rows.push(runCareer(preset, i, policy, opts))
  return rows
}

/** THE GROWTH MODEL ISOLATED – skill-ceiling.ts §2(b)'s own arm, so the two pages compare. */
function isolated(): Row[] {
  const best = PRESETS[PRESETS.length - 1]
  const rows: Row[] = []
  for (let i = 0; i < SEEDS * 3; i++) {
    rows.push(runCareer(best, i, POLICIES[1], { playsOn: true, noBankruptcy: true }))
  }
  return rows
}

function skillLine(label: string, rows: Row[]): string {
  const ranked = rows.filter((r) => r.wtaRank !== null).map((r) => r.wtaRank as number)
  return (
    `  ${padE(label, 30)}${pad(mean(rows.map((r) => r.peakMean)).toFixed(2), 8)}` +
    `${pad((100 * mean(rows.map((r) => r.realised))).toFixed(1), 10)}` +
    `${pad(mean(rows.map((r) => r.peakAge)).toFixed(1), 8)}` +
    `${pad(ranked.length ? `#${Math.min(...ranked)}` : '–', 8)}` +
    `${pad(ranked.length ? `#${pctl(ranked, 0.5).toFixed(0)}` : '–', 9)}` +
    `${pad(mean(rows.map((r) => r.entriesPerSeason)).toFixed(1), 9)}` +
    `${pad(mean(rows.map((r) => r.blockWeeks)).toFixed(0), 8)}`
  )
}
const SKILL_HEAD =
  `  ${padE('arm', 30)}${pad('peak', 8)}${pad('realised%', 10)}${pad('peakAge', 8)}` +
  `${pad('best', 8)}${pad('median', 9)}${pad('ev/seas', 9)}${pad('blockW', 8)}`

function bodyLine(label: string, rows: Row[]): string {
  const prevalence = 100 * mean(rows.map((r) => r.seasonsWithOnset / r.seasonsLived))
  return (
    `  ${padE(label, 30)}${pad(prevalence.toFixed(1), 12)}` +
    `${pad(mean(rows.map((r) => r.onsets / r.seasonsLived)).toFixed(2), 11)}` +
    `${pad(mean(rows.map((r) => r.weeksLost)).toFixed(1), 12)}` +
    `${pad(mean(rows.map((r) => r.meanCondition)).toFixed(0), 10)}` +
    `${pad(mean(rows.map((r) => r.doorCondition)).toFixed(0), 8)}` +
    `${pad(mean(rows.map((r) => r.seasonsLived)).toFixed(1), 9)}` +
    `${pad(((100 * rows.filter((r) => r.ending === 'injury').length) / rows.length).toFixed(1), 9)}`
  )
}
const BODY_HEAD =
  `  ${padE('arm', 30)}${pad('prevalence%', 12)}${pad('onsets/s', 11)}${pad('wksLost/car', 12)}` +
  `${pad('meanCond', 10)}${pad('door', 8)}${pad('seasons', 9)}${pad('endInj%', 9)}`

// =================================================================================================
console.log(rule())
console.log('SCHOOL BENCH (W4-SCHOOL) – when school ends, and what the freed hours buy and cost')
console.log(`  ${SEEDS} seeds a preset · ${PRESETS.length} presets · full careers 14->38 (${FULL_CAREER_WEEKS}w)`)
console.log(rule())

// -------------------------------------------------------------------------------------------------
if (wants('0')) {
  console.log('\n§0  WHEN SCHOOL ENDS – `schoolEndWeek`, over every birth month')
  console.log(`  ${padE('birth month', 14)}${pad('career week', 13)}${pad('season', 8)}${pad('offset', 8)}${pad('her real age', 14)}`)
  for (let bm = 1; bm <= 12; bm++) {
    const w = schoolEndWeek(bm)
    console.log(
      `  ${padE(bm, 14)}${pad(w, 13)}${pad(Math.floor(w / WEEKS_PER_YEAR), 8)}` +
        `${pad(w % WEEKS_PER_YEAR, 8)}${pad(kidAgeExact(w, bm, 1).toFixed(2), 14)}`,
    )
  }
  console.log('  (offset 34 is the 1 September the school year turns over on – SCHOOL_YEAR_TURNS_AT)')
}

// -------------------------------------------------------------------------------------------------
if (wants('1')) {
  console.log(`\n${rule()}`)
  console.log('§1  THE FIX ON ITS OWN – school ends, and the training dial is NOT touched')
  console.log('    Isolates what removing the exam fortnight is worth: two more enterable weeks a year')
  console.log('    from eighteen, and no more blackout recovery in them.')
  console.log(rule())
  for (const [name, policy] of [['GRINDER', POLICIES[0]], ['PLAYER (careful)', POLICIES[1]]] as const) {
    console.log(`\n  ${name} policy – ${PRESETS.length * SEEDS} careers`)
    console.log(SKILL_HEAD)
    const never = withScenario(NEVER, () => population(policy))
    const ends = withScenario(ENDS_FLAT, () => population(policy))
    console.log(skillLine('school never ends (SHIPPED)', never))
    console.log(skillLine('school ends, load 1.0', ends))
    console.log(BODY_HEAD)
    console.log(bodyLine('school never ends (SHIPPED)', never))
    console.log(bodyLine('school ends, load 1.0', ends))
  }
}

// -------------------------------------------------------------------------------------------------
if (wants('2')) {
  console.log(`\n${rule()}`)
  console.log('§2  THE LOAD DIAL – «тренировки и прогресс должны удвоиться», swept 1.0 -> 2.0')
  console.log('    THE GROWTH MODEL ISOLATED (skill-ceiling.ts §2b\'s own arm): the richest preset, the')
  console.log('    best coach, the player policy, plays-on, bankruptcy defused. Whatever more training')
  console.log('    can do, it does here.')
  console.log(rule())
  const arms: Scenario[] = [
    NEVER,
    ENDS_FLAT,
    { label: 'ends, load 1.2', lastGrade: 12, loadFactor: 1.2, conditionCost: 0 },
    { label: 'ends, load 1.4 (summer parity)', lastGrade: 12, loadFactor: 1.4, conditionCost: 0 },
    { label: 'ends, load 1.7', lastGrade: 12, loadFactor: 1.7, conditionCost: 0 },
    { label: 'ends, load 2.0 (his number)', lastGrade: 12, loadFactor: 2, conditionCost: 0 },
    { label: 'ends, load 1.4, cost 3', lastGrade: 12, loadFactor: 1.4, conditionCost: 3 },
    { label: 'ends, load 2.0, cost 3', lastGrade: 12, loadFactor: 2, conditionCost: 3 },
  ]
  console.log(`\n  ISOLATED – ${SEEDS * 3} careers`)
  console.log(SKILL_HEAD)
  const banked: { s: Scenario; rows: Row[] }[] = []
  for (const s of arms) {
    const rows = withScenario(s, isolated)
    banked.push({ s, rows })
    console.log(skillLine(s.label, rows))
  }
  console.log(`\n  ...AND THE BILL`)
  console.log(BODY_HEAD)
  for (const { s, rows } of banked) console.log(bodyLine(s.label, rows))

  console.log(`\n  THE YARDSTICK: one year of junior development = 2.4 skill points (SKILL_POINTS_PER_YEAR).`)
  const base = banked.find((b) => b.s === ENDS_FLAT)
  if (base) {
    console.log(`  ${padE('arm', 30)}${pad('delta skill', 13)}${pad('= years', 10)}${pad('delta wksLost', 15)}`)
    for (const { s, rows } of banked) {
      const d = mean(rows.map((r) => r.peakMean)) - mean(base.rows.map((r) => r.peakMean))
      const dl = mean(rows.map((r) => r.weeksLost)) - mean(base.rows.map((r) => r.weeksLost))
      console.log(`  ${padE(s.label, 30)}${pad(d.toFixed(2), 13)}${pad((d / 2.4).toFixed(2), 10)}${pad(dl.toFixed(1), 15)}`)
    }
  }
}

// -------------------------------------------------------------------------------------------------
if (wants('3')) {
  console.log(`\n${rule()}`)
  console.log('§3  THE SAME DIAL ON THE POPULATION THE GAME ACTUALLY SHIPS')
  console.log('    Both policy arms, all presets, every latch live. §2 measures what the dial CAN do;')
  console.log('    this measures what it DOES to a career that money and the plateau reading can stop.')
  console.log(rule())
  const arms: Scenario[] = [
    NEVER,
    ENDS_FLAT,
    { label: 'ends, load 1.4 (summer parity)', lastGrade: 12, loadFactor: 1.4, conditionCost: 0 },
    { label: 'ends, load 2.0 (his number)', lastGrade: 12, loadFactor: 2, conditionCost: 0 },
  ]
  for (const [name, policy] of [['GRINDER', POLICIES[0]], ['PLAYER (careful)', POLICIES[1]]] as const) {
    console.log(`\n  ${name} policy – ${PRESETS.length * SEEDS} careers`)
    console.log(SKILL_HEAD)
    const banked: { s: Scenario; rows: Row[] }[] = []
    for (const s of arms) {
      const rows = withScenario(s, () => population(policy))
      banked.push({ s, rows })
      console.log(skillLine(s.label, rows))
    }
    console.log(BODY_HEAD)
    for (const { s, rows } of banked) console.log(bodyLine(s.label, rows))
  }
}

// -------------------------------------------------------------------------------------------------
if (wants('4')) {
  console.log(`\n${rule()}`)
  console.log('§4  v47 – THE BONUS FOLLOWS THE DOUBLING, NOT THE CALENDAR (docs/specs/training-dials.md §3)')
  console.log('    THE OWNER RULED THE DIRECTION IN ADVANCE (10.08: «да»), so this measures the SIZE.')
  console.log('    The A/B is exact: both arms are FIVE sessions and therefore train/rest 75/25, so')
  console.log('    `trainFactor`, `coachHoursForPlan`, `knockChance` and `restRecoveryBonus` are')
  console.log('    identical and the ONLY thing that varies is whether the school-free weeks are')
  console.log('    doubled. Arm A reproduces the shipped v46 game exactly (a fully doubled week is')
  console.log('    1.4 and -3 by construction); arm B is what a MIGRATED career loads as.')
  console.log(rule())
  const DOUBLED: WeekPlan = planFromWeek([
    ['general', 'general'], ['general', 'general'], ['general'], [], [], [], [],
  ] as SessionKind[][])
  const FLAT: WeekPlan = planFromWeek([
    ['general'], ['general'], ['general'], ['general'], ['general'], [], [],
  ] as SessionKind[][])
  console.log(`  both arms: train ${DOUBLED.train}/${DOUBLED.rest}, 5 sessions, 5 billed hours`)
  for (const [name, policy] of [['GRINDER', POLICIES[0]], ['PLAYER (careful)', POLICIES[1]]] as const) {
    console.log(`\n  ${name} policy – ${PRESETS.length * SEEDS} careers`)
    console.log(SKILL_HEAD)
    const doubled = population(policy, { plan: DOUBLED })
    const flat = population(policy, { plan: FLAT })
    console.log(skillLine('A doubled (= the v46 game)', doubled))
    console.log(skillLine('B undoubled (= a migrated save)', flat))
    console.log(BODY_HEAD)
    console.log(bodyLine('A doubled (= the v46 game)', doubled))
    console.log(bodyLine('B undoubled (= a migrated save)', flat))
    const dPeak = mean(flat.map((r) => r.peakMean)) - mean(doubled.map((r) => r.peakMean))
    const rank = (rows: Row[]): number => {
      const r = rows.filter((x) => x.wtaRank !== null).map((x) => x.wtaRank as number)
      return r.length ? pctl(r, 0.5) : NaN
    }
    const dRank = rank(flat) - rank(doubled)
    const dEntries = mean(flat.map((r) => r.entriesPerSeason)) - mean(doubled.map((r) => r.entriesPerSeason))
    const dDoor = mean(flat.map((r) => r.doorCondition)) - mean(doubled.map((r) => r.doorCondition))
    console.log(`\n  WHAT NOT DOUBLING COSTS (B - A):`)
    console.log(`  ${padE('peak skill', 30)}${pad(dPeak.toFixed(2), 10)}  = ${(dPeak / 2.4).toFixed(2)} junior years`)
    console.log(`  ${padE('median WTA rank', 30)}${pad(dRank.toFixed(0), 10)}  (+ = worse)`)
    console.log(`  ${padE('entries / season', 30)}${pad(dEntries.toFixed(2), 10)}`)
    console.log(`  ${padE('off-season door condition', 30)}${pad(dDoor.toFixed(1), 10)}  (+ = fresher, the -3 not paid)`)
  }
  console.log(`\n  THE YARDSTICK: one junior year = 2.4 skill points (SKILL_POINTS_PER_YEAR); the whole`)
  console.log(`  coach ladder is 2.26. A cost far above that would mean the change is a trap rather than`)
  console.log(`  a choice – §12 item 1's fallback (keep the window bonus automatic, charge condition for`)
  console.log(`  doubling only) is what that verdict buys.`)
}

console.log('')
