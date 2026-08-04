// THE ENDINGS BENCH: how often each of the six actually happens, how long a family survives under
// water, and – the number the album's central page is written against – how often the tennis ever
// pays for itself.
//
// Run: `npm run bench:endings` (add `--seeds N` to change the sample).
//
// ⚠ WHY THIS TOOL EXISTS AND WHAT IT IS ALLOWED TO DECIDE. Two numbers in `ENDINGS` are design
// decisions rather than anchored constants – `bankruptcyGraceWeeks` and `plateauSeasons` – and
// adult-tour-and-endings.md B4 says so in as many words: «N is a design decision, not an obvious
// one, and it should be measured before it is picked». This measures them. It also measures the
// break-even crossing, which career-contract-v1.md §9.2 requires BEFORE slot 6's copy is written,
// because the wording has to know whether an empty page is the rarity or the rule.
//
// ⚠ THE SWEEP IS ONE PASS, NOT FIVE, AND THAT IS EXACT FOR THE QUESTION IT ANSWERS. Re-running
// every career at every candidate N would cost five times as much and answer a slightly different
// question each time (a career that goes bankrupt at N=4 never lives to be measured at N=16). So
// the sweep arm runs with the latch DISABLED, records every debt spell in full, and reports for
// each candidate N the first week a spell reached it. "When would N have fired" is then exact, and
// what the arm cannot claim – how the rest of the career would have differed afterwards – it does
// not claim.
import {
  PRESETS,
  POLICIES,
  openCareer,
  stepCareerWeek,
  mean,
  median,
  type Preset,
  type Policy,
} from './econ-bench'
import {
  answerFork,
  answerRetirement,
  resumeFromCollege,
  kidAgeYears,
  type WorldState,
} from '../src/engine/world'
import { ENDINGS, bankruptcyDue, debtWeeks } from '../src/engine/ending'
import type { CareerEndingType } from '../src/shared/protocol'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { Rng } from '../src/engine/rng'

/** A full playing life: fourteen to the week the game stops asking. 24 seasons. */
export const FULL_CAREER_WEEKS = (ENDINGS.stopAskingAgeYears - 14 + 1) * WEEKS_PER_YEAR
export const SEEDS_PER_PRESET = 20

/** How the bench answers the fork at nineteen. Three arms, because two of the three answers ARE
 *  endings and the third is what makes the other four reachable at all. */
export type ForkArm = 'continue' | 'college' | 'stop'

/** How she answers the natural end's offer.
 *
 *  ⚠ THE DEFAULT IS THE OWNER'S OWN SENTENCE, not "always retire" and not "never". «Не могу выйти в
 *  топ – уйду»: she takes the PLATEAU offer, because that offer only exists when the reading holds,
 *  and she says one more year to the AGE offer until the game stops asking at 38. That produces the
 *  distribution between #5 and #6 the contract asks the epilogue to be able to tell apart. */
function answersRetirement(reason: 'age' | 'plateau', final: boolean): boolean {
  return final || reason === 'plateau'
}

export interface CareerOutcome {
  seed: string
  ending: CareerEndingType | null
  endedWeek: number | null
  endedAge: number | null
  seasons: number
  /** every unbroken spell below zero, in weeks – the material for the N sweep */
  debtSpells: number[]
  /** the week her CUMULATIVE prize money first passed her CUMULATIVE costs, or null */
  cumulativeTurnWeek: number | null
  /** the week ONE week's prize money first beat that week's costs, or null. A different and much
   *  commoner event – see the header of docs/specs/endings-and-the-album.md §5. */
  weekTurnWeek: number | null
  prizeCents: number
  spentCents: number
  oneMoreYearCount: number
  wentToCollege: boolean
  /** ⚠ THE INJURY ENDING'S OWN REACHABILITY, instrumented rather than assumed. How many FRESH severe
   *  injuries the career ever saw, and the most major-or-worse layoffs she had already recovered
   *  from at the moment one landed. The predicate needs both, so these two columns are what say
   *  whether #4 is rare-but-real or simply unreachable. */
  freshSevereCount: number
  maxPriorsAtSevere: number
  majorPlusCount: number
  /** debt spells that STARTED inside the first `horizonWeeks` weeks - the 14→18 target row */
  debtSpellsInHorizon: number[]
}

/** career-outcome-targets.md's own window: four seasons, fourteen to eighteen. */
export const TARGET_HORIZON_WEEKS = 4 * WEEKS_PER_YEAR

/** Play one career from fourteen to its ending (or to the floor), answering every question the
 *  engine raises. `latchBankruptcy: false` is the sweep arm – it keeps the family playing under
 *  water so the full spell distribution is visible. */
export function runToEnding(
  preset: Preset,
  index: number,
  arm: ForkArm,
  policy: Policy = POLICIES[0],
  latchBankruptcy = true,
  horizonWeeks = FULL_CAREER_WEEKS,
): CareerOutcome {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const out: CareerOutcome = {
    seed,
    ending: null,
    endedWeek: null,
    endedAge: null,
    seasons: 0,
    debtSpells: [],
    cumulativeTurnWeek: null,
    weekTurnWeek: null,
    prizeCents: 0,
    spentCents: 0,
    oneMoreYearCount: 0,
    wentToCollege: false,
    freshSevereCount: 0,
    maxPriorsAtSevere: 0,
    majorPlusCount: 0,
    debtSpellsInHorizon: [],
  }
  let spell = 0
  let spellStart = 0
  let lastPrize = 0
  let lastSpent = 0

  for (let i = 0; i < horizonWeeks && world.ending === null; i++) {
    // ⚠ THE SWEEP ARM DEFUSES THE LATCH BEFORE THE WEEK RATHER THAN AFTER IT. `resolveEndings` runs
    // inside the tick, so the only way to keep a bankrupt family playing is to hand the detector a
    // solvent-looking spell – which is what clearing `debtSinceWeek` does. The spell is counted
    // here instead, in full, which is the whole point of the arm.
    if (!latchBankruptcy) world.debtSinceWeek = null
    const before = { prize: world.careerTotals.prizeCents, spent: world.careerTotals.spentCents }
    stepCareerWeek(world, rng, policy)

    // the two crossings, measured the same week, off the counters the engine keeps for the album
    const prizeDelta = world.careerTotals.prizeCents - before.prize
    const spentDelta = world.careerTotals.spentCents - before.spent
    if (out.weekTurnWeek === null && prizeDelta > spentDelta && prizeDelta > 0) out.weekTurnWeek = world.week
    if (out.cumulativeTurnWeek === null && world.careerTotals.prizeCents > world.careerTotals.spentCents) {
      out.cumulativeTurnWeek = world.week
    }
    lastPrize = world.careerTotals.prizeCents
    lastSpent = world.careerTotals.spentCents

    // the debt spell, counted independently of the latch so the sweep arm sees all of it
    if (world.fundsCents < 0) {
      if (spell === 0) spellStart = world.week
      spell += 1
    } else if (spell > 0) {
      out.debtSpells.push(spell)
      if (spellStart < TARGET_HORIZON_WEEKS) out.debtSpellsInHorizon.push(spell)
      spell = 0
    }

    // #4's reachability, instrumented at the one moment the predicate cares about: a FRESH severe.
    if (world.injury !== null && world.injury.sinceWeek === world.week) {
      if (world.injury.severity === 'severe') {
        out.freshSevereCount += 1
        const priors = world.injuryHistory.filter((h) => h.severity === 'major' || h.severity === 'severe').length
        if (priors > out.maxPriorsAtSevere) out.maxPriorsAtSevere = priors
      }
      if (world.injury.severity === 'major' || world.injury.severity === 'severe') out.majorPlusCount += 1
    }

    answerWhateverIsOpen(world, rng, arm, out)
  }
  if (spell > 0) {
    out.debtSpells.push(spell)
    if (spellStart < TARGET_HORIZON_WEEKS) out.debtSpellsInHorizon.push(spell)
  }
  out.seasons = world.seasonHistory.length
  out.prizeCents = lastPrize
  out.spentCents = lastSpent
  out.oneMoreYearCount = world.oneMoreYearCount
  out.wentToCollege = world.college !== null
  if (world.ending) {
    out.ending = world.ending.type
    out.endedWeek = world.ending.week
    out.endedAge = world.ending.ageYears
  }
  return out
}

function answerWhateverIsOpen(world: WorldState, rng: Rng, arm: ForkArm, out: CareerOutcome): void {
  if (world.fork !== null && world.fork.answer === null) {
    answerFork(world, arm)
    if (arm === 'college' && world.ending?.type === 'college') {
      out.wentToCollege = true
      // one tap, four years – the only ending that resumes
      resumeFromCollege(world, rng)
    }
  }
  if (world.retirementOffer !== null) {
    answerRetirement(world, answersRetirement(world.retirementOffer.reason, world.retirementOffer.final))
  }
}

// --- the N sweep ---------------------------------------------------------------------------------

/** For each candidate N: what fraction of careers had a debt spell that long. Exact for "would N
 *  have fired", measured off the no-latch arm. */
export function sweepGrace(
  outcomes: CareerOutcome[],
  candidates: number[],
  field: 'debtSpells' | 'debtSpellsInHorizon' = 'debtSpells',
): { n: number; rate: number }[] {
  return candidates.map((n) => ({
    n,
    rate: outcomes.filter((o) => o[field].some((s) => s >= n)).length / Math.max(1, outcomes.length),
  }))
}

// --- printing --------------------------------------------------------------------------------------

const ENDING_ORDER: CareerEndingType[] = ['stopped', 'college', 'bankruptcy', 'injury', 'natural', 'plateau']

function pct(n: number, d: number): string {
  if (d === 0) return '   – '
  return `${((100 * n) / d).toFixed(1).padStart(5)}%`
}

function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}

function ageOf(week: number | null): string {
  return week === null ? '–' : String(14 + Math.floor(week / WEEKS_PER_YEAR))
}

export function main(argv = process.argv.slice(2)): void {
  const seedsArg = argv.indexOf('--seeds')
  const seeds = seedsArg >= 0 ? Number(argv[seedsArg + 1]) : SEEDS_PER_PRESET
  const presetsArg = argv.indexOf('--presets')
  const presets = presetsArg >= 0 ? PRESETS.slice(0, Number(argv[presetsArg + 1])) : PRESETS

  console.log('')
  console.log('THE ENDINGS BENCH – six endings, one surface (career-contract-v1.md §4)')
  console.log(
    `  ${presets.length} presets x ${seeds} seeds, fourteen to ${ENDINGS.stopAskingAgeYears} (${FULL_CAREER_WEEKS} weeks max)`,
  )
  console.log(
    `  grace N = ${ENDINGS.bankruptcyGraceWeeks}w · plateau = ${ENDINGS.plateauSeasons} seasons from ${ENDINGS.plateauFromAgeYears} · the game stops asking at ${ENDINGS.stopAskingAgeYears}`,
  )
  console.log('')

  // --- ARM 1: she turns professional at the fork. The only arm the other four endings live in. ---
  const pro: CareerOutcome[] = []
  for (const preset of presets) {
    for (let i = 0; i < seeds; i++) pro.push(runToEnding(preset, i, 'continue'))
  }

  console.log('  ── THE SIX, as rates of all careers that turned professional at nineteen ──')
  console.log('')
  console.log(`  ${padEnd('ending', 14)}${'careers'.padStart(9)}${'rate'.padStart(8)}   median age`)
  for (const type of ENDING_ORDER) {
    const rows = pro.filter((o) => o.ending === type)
    const ages = rows.map((o) => o.endedAge ?? 0).sort((a, b) => a - b)
    console.log(
      `  ${padEnd(type, 14)}${String(rows.length).padStart(9)}${pct(rows.length, pro.length).padStart(8)}   ${
        ages.length ? median(ages).toFixed(0) : '–'
      }`,
    )
  }
  const unresolved = pro.filter((o) => o.ending === null).length
  console.log(`  ${padEnd('(still playing)', 14)}${String(unresolved).padStart(9)}${pct(unresolved, pro.length).padStart(8)}`)
  console.log('')
  console.log(
    `  ⚠ 'stopped' and 'college' are 0 here BY CONSTRUCTION – this arm answers the fork with`,
  )
  console.log(`    "continue". They are the fork's other two answers and the arms below take them.`)
  console.log('')

  // --- ARM 2 and 3: the fork's other two answers ---
  const stopArm = presets.map((p) => runToEnding(p, 0, 'stop'))
  const collegeArm = presets.map((p) => runToEnding(p, 0, 'college'))
  console.log('  ── THE FORK\'S OTHER TWO ANSWERS (one seed per preset – they are decisions, not rates) ──')
  console.log('')
  console.log(
    `  stop    : ${stopArm.filter((o) => o.ending === 'stopped').length}/${stopArm.length} latched 'stopped' at nineteen`,
  )
  const resumed = collegeArm.filter((o) => o.wentToCollege)
  const collegeEnded = collegeArm.filter((o) => o.ending !== null)
  console.log(
    `  college : ${resumed.length}/${collegeArm.length} took the scholarship and came back at twenty-two; ` +
      `${collegeEnded.length} of those went on to an ending (${collegeEnded.map((o) => o.ending).join(', ') || 'none'})`,
  )
  console.log('')

  // --- THE N SWEEP, AGAINST THE TARGET ROW ---
  //
  // ⚠ THE ROW N IS PINNED AGAINST IS career-outcome-targets.md's OWN: «Family did not go bankrupt,
  // 14→18: 60-80% of all starts». So the sweep is run over that exact window (four seasons, 208
  // weeks) and over both entry policies, because the grinder and the careful parent are two
  // different games and N has to be defensible for both.
  const sweepRows: { policy: Policy; horizon: CareerOutcome[]; full: CareerOutcome[] }[] = []
  for (const policy of POLICIES) {
    const horizon: CareerOutcome[] = []
    const full: CareerOutcome[] = []
    for (const preset of presets) {
      for (let i = 0; i < seeds; i++) {
        horizon.push(runToEnding(preset, i, 'continue', policy, false, TARGET_HORIZON_WEEKS))
      }
      for (let i = 0; i < Math.max(4, Math.round(seeds / 2)); i++) {
        full.push(runToEnding(preset, i, 'continue', policy, false))
      }
    }
    sweepRows.push({ policy, horizon, full })
  }

  console.log('  ── BANKRUPTCY: the grace window, swept ──')
  console.log('')
  for (const row of sweepRows) {
    const spells = row.horizon.flatMap((o) => o.debtSpells)
    console.log(`  policy "${row.policy.label}" · ${row.horizon.length} careers over 14→18, ${row.full.length} over the full life`)
    console.log(
      `    spells: ${spells.length} · median ${spells.length ? median(spells).toFixed(0) : '–'}w · mean ${spells.length ? mean(spells).toFixed(1) : '–'}w · longest ${spells.length ? Math.max(...spells) : 0}w`,
    )
    console.log(`    ${padEnd('N', 6)}${'14→18 bankrupt'.padStart(16)}${'SURVIVED'.padStart(11)}${'full-life bankrupt'.padStart(20)}`)
    const fullSweep = sweepGrace(row.full, [4, 6, 8, 12, 16, 24])
    sweepGrace(row.horizon, [4, 6, 8, 12, 16, 24], 'debtSpellsInHorizon').forEach((r, i) => {
      const survived = 1 - r.rate
      const flag = survived >= 0.6 && survived <= 0.8 ? '  <- inside 60-80%' : ''
      console.log(
        `    ${padEnd(String(r.n), 6)}${(r.rate * 100).toFixed(1).padStart(15)}%${(survived * 100).toFixed(1).padStart(10)}%${(fullSweep[i].rate * 100).toFixed(1).padStart(19)}%${flag}`,
      )
    })
    console.log('')
  }

  // --- #4's REACHABILITY, instrumented rather than assumed ---
  const longLived = sweepRows.flatMap((r) => r.full)
  const sawSevere = longLived.filter((o) => o.freshSevereCount > 0)
  console.log('  ── #4 THE CAREER-ENDING INJURY: is the predicate reachable at all? ──')
  console.log('')
  console.log(`  full-life careers measured        : ${longLived.length}`)
  console.log(
    `  ever saw a FRESH severe           : ${sawSevere.length} (${((100 * sawSevere.length) / Math.max(1, longLived.length)).toFixed(1)}%)`,
  )
  console.log(
    `  major-or-worse layoffs per career : mean ${mean(longLived.map((o) => o.majorPlusCount)).toFixed(2)} · max ${Math.max(0, ...longLived.map((o) => o.majorPlusCount))}`,
  )
  for (const need of [0, 1, 2, 3]) {
    const hit = longLived.filter((o) => o.freshSevereCount > 0 && o.maxPriorsAtSevere >= need).length
    console.log(
      `  a severe with >= ${need} prior major+     : ${hit} (${((100 * hit) / Math.max(1, longLived.length)).toFixed(1)}%)${need === ENDINGS.injuryPriorMajors ? '   <- the shipped threshold' : ''}`,
    )
  }
  console.log('')

  // --- per preset, so a wealth corridor's effect is visible ---
  console.log('  ── BY PRESET (the professional arm) ──')
  console.log('')
  console.log(`  ${padEnd('preset', 30)}${'bankrupt'.padStart(9)}${'injury'.padStart(8)}${'natural'.padStart(9)}${'plateau'.padStart(9)}${'turned'.padStart(8)}`)
  for (const preset of presets) {
    const rows = pro.filter((o) => o.seed.startsWith(`bench-${preset.background}-`))
    const mine = rows.slice(0, seeds)
    void mine
    const sub = pro.filter((_, i) => Math.floor(i / seeds) === presets.indexOf(preset))
    console.log(
      `  ${padEnd(preset.label, 30)}` +
        `${pct(sub.filter((o) => o.ending === 'bankruptcy').length, sub.length).padStart(9)}` +
        `${pct(sub.filter((o) => o.ending === 'injury').length, sub.length).padStart(8)}` +
        `${pct(sub.filter((o) => o.ending === 'natural').length, sub.length).padStart(9)}` +
        `${pct(sub.filter((o) => o.ending === 'plateau').length, sub.length).padStart(9)}` +
        `${pct(sub.filter((o) => o.cumulativeTurnWeek !== null).length, sub.length).padStart(8)}`,
    )
  }
  console.log('')

  // A last sanity line: the swept arm and the latched arm have to agree about what a bankrupt career
  // is. `sweepGrace` at the shipped N counts careers whose spell reached it; the professional arm
  // latched on exactly that condition, so the two should sit close - a wide gap would mean the
  // no-latch arm is measuring a different game (careers that keep playing while under water spend
  // more, so it is expected to be the HIGHER of the two rather than equal).
  const swept = sweepRows[0].horizon
  const wouldLatch = swept.filter((o) => o.debtSpellsInHorizon.some((x) => x >= ENDINGS.bankruptcyGraceWeeks)).length
  console.log(
    `  cross-check: ${wouldLatch}/${swept.length} careers would have latched inside 14→18 at the pinned N = ${ENDINGS.bankruptcyGraceWeeks}`,
  )
  console.log('')
  void bankruptcyDue
  void debtWeeks
  void kidAgeYears
  void ageOf
}

// ⚠ vite-node 3.2.4 strips the entry file from `process.argv`, so a plain argv[1] check silently
// never runs main(). Same guard econ-bench.ts carries, and for the same measured reason.
const NAMED_ON_THE_COMMAND_LINE =
  process.argv.some((a) => a.includes('endings-bench')) ||
  (process.env.npm_lifecycle_script ?? '').includes('endings-bench') ||
  process.env.TB_BENCH_RUN === '1'
if (!process.env.VITEST && NAMED_ON_THE_COMMAND_LINE) {
  main()
}
