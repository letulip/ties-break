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
// ⚠⚠ THE COLLEGE COLUMN BELOW IS A COUNTERFACTUAL SINCE 16.08.2026, NOT A READING OF THE SHIPPED
// GAME. The owner removed the rule that closed the college door on a result («Колледж – это
// независимая ветка карьеры … альтернативная»); in the game as it ships the third answer is on the
// fork card in 100% of careers. What this file prints is what the PRE-16.08 rule WOULD have done on
// this population. `tools/retired-college-rule.ts` is the one definition of it.
import { RETIRED_COLLEGE_RUNG, retiredCollegeDoorOpen } from './retired-college-rule'
import { ENDINGS, bankruptcyDue, debtWeeks, plateauReading, weeksLostSoFar } from '../src/engine/ending'
import { plateauViewOf, autoEndingViewOf } from '../src/engine/world'
import type { CareerEndingType } from '../src/shared/protocol'
import { WEEKS_PER_YEAR, TIER_LADDER } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
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
export type RetireArm = 'her-words' | 'plays-on'
function answersRetirement(arm: RetireArm, reason: 'age' | 'plateau', final: boolean): boolean {
  if (final) return true
  return arm === 'her-words' && reason === 'plateau'
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
  /** priors of moderate-or-worse at the moment of a fresh severe, and the weeks her body had
   *  already lost to injury by then. Both are candidate accumulation rules; the shipped one is
   *  whichever the measurement supports. */
  maxModeratePlusAtSevere: number
  maxWeeksOutAtSevere: number
  /** debt spells that STARTED inside the first `horizonWeeks` weeks - the 14→18 target row */
  debtSpellsInHorizon: number[]
  /** ⭐ THE COLLEGE DOOR AT NINETEEN – the owner's own question, asked in his own words: «т.е. если
   *  она получает зачетный w75+ раньше 19 летия, то она не получит права идти в академию?» Yes –
   *  round-17 #6 made `collegeStillOpen` a precondition and `answerFork` re-validates it – and
   *  nobody had ever measured how OFTEN that removes the answer. If it is almost always shut then
   *  the fork at nineteen is a two-way fork wearing a three-way card, which is a design finding
   *  (task #102) rather than a bench detail.
   *
   *  Null ⇔ the career never reached the fork at all (it ended, or the horizon stopped short), which
   *  is the only honest denominator: a girl who went bankrupt at fifteen was never offered anything. */
  collegeOpenAtFork: boolean | null
  /** WHAT SHUTS IT, and when. The week `collegeStillOpen` first went false, her age that week, and
   *  the tier whose SCORING finish did it. Null ⇔ the door never shut inside the horizon. */
  collegeShutWeek: number | null
  collegeShutAge: number | null
  collegeShutTier: TierId | null
  /** ⚠ THE PLATEAU'S OWN N, SWEPT WITHOUT RE-RUNNING. At every season wrap the reading is evaluated
   *  at 2, 3 and 4 seasons and the first season each would have asked in is banked. The career only
   *  ACTS on the shipped value, so this is "when would it have asked" rather than "what would the
   *  career have become" - exactly the claim the grace sweep makes, and no more. */
  plateauAsksAt: Record<number, number | null>
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
  retireArm: RetireArm = 'her-words',
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
    maxModeratePlusAtSevere: 0,
    maxWeeksOutAtSevere: 0,
    debtSpellsInHorizon: [],
    collegeOpenAtFork: null,
    collegeShutWeek: null,
    collegeShutAge: null,
    collegeShutTier: null,
    plateauAsksAt: { 2: null, 3: null, 4: null },
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
    // ⭐ only while the door is still open – after that the copy buys nothing and it is per week
    const bestBefore = out.collegeShutWeek === null ? { ...world.bestFinishByTier } : null
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
        const mod = world.injuryHistory.filter(
          (h) => h.severity === 'moderate' || h.severity === 'major' || h.severity === 'severe',
        ).length
        if (mod > out.maxModeratePlusAtSevere) out.maxModeratePlusAtSevere = mod
        // ⚠ THROUGH THE ENGINE'S OWN ACCUMULATOR, NOT A HAND-ROLLED SUM (v40). `injuryHistory` is
        // pruned to twenty rows, so the sum this line used to take went short on exactly the bodies
        // the predicate is about - see docs/specs/fatigue-injury-audit-2026-08.md §6.
        // `weeksLostSoFar` is what the ending itself reads, so the bench and the rule can no longer
        // disagree about what a body has been through.
        const lost = weeksLostSoFar(autoEndingViewOf(world))
        if (lost > out.maxWeeksOutAtSevere) out.maxWeeksOutAtSevere = lost
      }
      if (world.injury.severity === 'major' || world.injury.severity === 'severe') out.majorPlusCount += 1
    }

    // ⭐ THE COLLEGE DOOR, READ THROUGH THE ENGINE'S OWN PREDICATE – the same discipline
    // `weeksLostSoFar` above is written in: the bench asks `collegeStillOpen`, so the bench and the
    // rule `answerFork` re-validates cannot come to disagree about what "open" means.
    //
    // ⚠ THE TIER IS ATTRIBUTED BY DIFFING `bestFinishByTier` ACROSS THE WEEK, not by re-deriving
    // the predicate. That is exact rather than clever: at most one event resolves in a week (the
    // entry policy books one tournament per week and `enterEvent` enforces it), so at the
    // transition week exactly one rung has moved. Re-implementing the scoring test here would be a
    // second copy of the rule, which is what this file is trying not to own.
    if (bestBefore !== null && out.collegeShutWeek === null && !retiredCollegeDoorOpen(world)) {
      out.collegeShutWeek = world.week
      out.collegeShutAge = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
      const from = TIER_LADDER.indexOf(RETIRED_COLLEGE_RUNG)
      const moved = (Object.keys(world.bestFinishByTier) as TierId[]).filter(
        (t) => world.bestFinishByTier[t] !== bestBefore[t] && TIER_LADDER.indexOf(t) >= from,
      )
      out.collegeShutTier = moved[0] ?? null
    }

    // the plateau sweep, evaluated on the wrap week and nowhere else (the only week it can fire)
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 3) {
      const view = plateauViewOf(world)
      for (const n of [2, 3, 4] as number[]) {
        if (out.plateauAsksAt[n] === null && plateauReading(view, n)) out.plateauAsksAt[n] = view.seasonIndex
      }
    }

    answerWhateverIsOpen(world, rng, arm, out, retireArm)
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

function answerWhateverIsOpen(
  world: WorldState,
  rng: Rng,
  arm: ForkArm,
  out: CareerOutcome,
  retireArm: RetireArm,
): void {
  if (world.fork !== null && world.fork.answer === null) {
    // ⭐ RECORDED BEFORE THE ANSWER, on every arm, because it is a fact about the CARD she was
    // shown rather than about what she did with it – and because `answerFork` throws on 'college'
    // when the door is shut, so a reading taken afterwards would only ever see the open half.
    out.collegeOpenAtFork = retiredCollegeDoorOpen(world)
    answerFork(world, arm)
    if (arm === 'college' && world.ending?.type === 'college') {
      out.wentToCollege = true
      // one tap, four years – the only ending that resumes
      resumeFromCollege(world, rng)
    }
  }
  if (world.retirementOffer !== null) {
    answerRetirement(world, answersRetirement(retireArm, world.retirementOffer.reason, world.retirementOffer.final))
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

  // --- ARM 1: she turns professional at the fork. The only arm the other four endings live in.
  //
  // ⚠ RUN UNDER BOTH RETIREMENT ANSWERS, because the split between #5 and #6 is a PLAYER CHOICE and
  // not a game rate. «Her words» takes the plateau offer the moment it comes («не могу выйти в топ –
  // уйду»); «plays on» refuses every offer until the game stops asking at 38. Reporting only one of
  // them would have printed a 0% next to an ending that is reachable in one tap.
  const arms: { label: string; retire: RetireArm; rows: CareerOutcome[] }[] = [
    { label: 'her words (takes the plateau)', retire: 'her-words', rows: [] },
    { label: 'plays on (refuses until 38)', retire: 'plays-on', rows: [] },
  ]
  for (const a of arms) {
    for (const preset of presets) {
      for (let i = 0; i < seeds; i++) {
        a.rows.push(runToEnding(preset, i, 'continue', POLICIES[0], true, FULL_CAREER_WEEKS, a.retire))
      }
    }
  }
  const pro = arms[0].rows

  console.log('  ── THE SIX, as rates of all careers that turned professional at nineteen ──')
  for (const a of arms) {
    console.log('')
    console.log(`  answering the natural end: "${a.label}"`)
    console.log(`  ${padEnd('ending', 14)}${'careers'.padStart(9)}${'rate'.padStart(8)}   median age`)
    for (const type of ENDING_ORDER) {
      const rows = a.rows.filter((o) => o.ending === type)
      const ages = rows.map((o) => o.endedAge ?? 0).sort((x, y) => x - y)
      console.log(
        `  ${padEnd(type, 14)}${String(rows.length).padStart(9)}${pct(rows.length, a.rows.length).padStart(8)}   ${
          ages.length ? median(ages).toFixed(0) : '–'
        }`,
      )
    }
    const unresolved = a.rows.filter((o) => o.ending === null).length
    console.log(
      `  ${padEnd('(still playing)', 14)}${String(unresolved).padStart(9)}${pct(unresolved, a.rows.length).padStart(8)}`,
    )
  }
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
  const afterCollege = resumed.filter((o) => o.ending !== null)
  console.log(
    `  college : ${resumed.length}/${collegeArm.length} took the scholarship and came back at twenty-two; ` +
      `${afterCollege.length} of THOSE went on to an ending (${afterCollege.map((o) => o.ending).join(', ') || 'none'})`,
  )
  console.log(
    `            the other ${collegeArm.length - resumed.length} never reached nineteen – the money went first.`,
  )
  console.log(`            (how often the door is open AT ALL is its own table, further down.)`)
  console.log('')

  // --- THE PLATEAU'S OWN N ---
  console.log('  ── THE PLATEAU READING: when would each N have asked? ──')
  console.log('')
  console.log(`  ${padEnd('seasons', 10)}${'careers asked'.padStart(15)}${'rate'.padStart(8)}${'median season'.padStart(15)}`)
  for (const n of [2, 3, 4]) {
    const asked = arms[1].rows.filter((o) => o.plateauAsksAt[n] !== null)
    const seasons = asked.map((o) => o.plateauAsksAt[n]!).sort((a, b) => a - b)
    console.log(
      `  ${padEnd(String(n), 10)}${String(asked.length).padStart(15)}${pct(asked.length, arms[1].rows.length).padStart(8)}${(seasons.length ? median(seasons).toFixed(0) : '–').padStart(15)}${n === ENDINGS.plateauSeasons ? '   <- shipped' : ''}`,
    )
  }
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

  // --- ⭐ THE COLLEGE DOOR AT NINETEEN: is the fork really a three-way fork? ---
  //
  // ⚠ THE OWNER ASKED THIS IN HIS OWN WORDS – «т.е. если она получает зачетный w75+ раньше 19
  // летия, то она не получит права идти в академию?» – and the honest answer needs a rate, not a
  // yes. Round-17 #6 made `collegeStillOpen` a precondition; nobody measured how often it removes
  // the answer. If the door is nearly always shut for a career worth playing, then the fork's card
  // is a two-way choice wearing a three-way layout, and task #102 (the fork's exits need screens)
  // is designing screens for a path almost nobody can take.
  //
  // ⚠ THE DENOMINATOR IS "REACHED THE FORK", NOT "STARTED", and the two differ enormously here: a
  // family that went under at fifteen was never offered anything, so counting it as "door shut"
  // would blame the scholarship rule for the economy. Both columns are printed so the reader can
  // see the gap rather than take the ratio on trust.
  //
  // ⚠ AND IT IS REPORTED PER ARM RATHER THAN POOLED. The latched grinder arm is the shipped game;
  // the two no-latch arms keep bankrupt families playing, so they carry careers to nineteen that
  // the shipped rules would have stopped – which is exactly why their "reached 19" column is
  // bigger, and why pooling them into one rate would quietly answer a different question.
  const doorArms: { label: string; rows: CareerOutcome[] }[] = [
    { label: `${POLICIES[0].label} · latched`, rows: arms[0].rows },
    ...sweepRows.map((r) => ({ label: `${r.policy.label} · no-latch`, rows: r.full })),
  ]
  console.log('  ── ⭐ THE COLLEGE DOOR: how often is the scholarship still open at nineteen? ──')
  console.log('')
  console.log(
    `  ${padEnd('arm', 22)}${'careers'.padStart(9)}${'reached 19'.padStart(12)}${'door OPEN'.padStart(11)}${'of those'.padStart(10)}`,
  )
  for (const a of doorArms) {
    const reached = a.rows.filter((o) => o.collegeOpenAtFork !== null)
    const open = reached.filter((o) => o.collegeOpenAtFork === true)
    console.log(
      `  ${padEnd(a.label, 22)}${String(a.rows.length).padStart(9)}${String(reached.length).padStart(12)}${String(open.length).padStart(11)}${pct(open.length, reached.length).padStart(10)}`,
    )
  }
  console.log('')
  // WHAT SHUTS IT – the rung whose SCORING finish spent her eligibility, and how old she was. This
  // is the more useful half: "the door is usually shut" is a fact about the economy, but "this rung
  // shuts it, at this age" is a lever, because the rung the entry policy reaches first is a thing
  // the ladder controls.
  const doorRows = doorArms.flatMap((a) => a.rows)
  const shut = doorRows.filter((o) => o.collegeShutWeek !== null)
  console.log(
    `  ${padEnd('what shut it', 22)}${'careers'.padStart(9)}${'share of shut'.padStart(15)}${'median age'.padStart(12)}${'earliest'.padStart(10)}`,
  )
  for (const tier of TIER_LADDER) {
    const rows = shut.filter((o) => o.collegeShutTier === tier)
    if (rows.length === 0) continue
    const ages = rows.map((o) => o.collegeShutAge ?? 0).sort((x, y) => x - y)
    console.log(
      `  ${padEnd(tier, 22)}${String(rows.length).padStart(9)}${pct(rows.length, shut.length).padStart(15)}${median(ages).toFixed(0).padStart(12)}${String(ages[0]).padStart(10)}`,
    )
  }
  const unattributed = shut.filter((o) => o.collegeShutTier === null).length
  if (unattributed > 0) {
    console.log(`  ${padEnd('(unattributed)', 22)}${String(unattributed).padStart(9)}   <- a week that moved no rung at or above ${RETIRED_COLLEGE_RUNG}`)
  }
  console.log('')
  const shutBeforeFork = shut.filter((o) => (o.collegeShutAge ?? 99) < ENDINGS.forkAgeYears).length
  console.log(
    `  careers whose door ever shut : ${shut.length}/${doorRows.length} = ${pct(shut.length, doorRows.length).trim()}` +
      ` · and ${shutBeforeFork} of those shut BEFORE the fork, which is the only half that costs her the answer`,
  )
  console.log('')

  // --- #4's REACHABILITY, instrumented rather than assumed ---
  //
  // ⚠ MEASURED ON THE ARM WITH MAXIMUM EXPOSURE, and it has to be. The first draft read the SWEEP
  // arm, whose careers answer the plateau offer the moment it comes and therefore stop around
  // twenty-four - so it reported 0.0% for a predicate the latched arm fires 7.8% of the time. A
  // career-ending injury is a LATE-CAREER event by construction (it needs a body that has already
  // lost months), so the only honest denominator is the careers that play long enough to have one.
  const longLived = arms[1].rows
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
  // ⚠ THE COUNTED RULE AND THE SHIPPED ONE, SIDE BY SIDE. P1 proposed "a fresh severe on >= 2 prior
  // major-or-severe layoffs" and predicted 1-2%; it measures 0.0% on this injury model, which is why
  // the shipped predicate reads WEEKS LOST instead. Both are printed so the reason is on the record.
  for (const need of [0, 1, 2, 3]) {
    const hit = longLived.filter((o) => o.freshSevereCount > 0 && o.maxPriorsAtSevere >= need).length
    console.log(
      `  a severe with >= ${need} prior major+     : ${hit} (${((100 * hit) / Math.max(1, longLived.length)).toFixed(1)}%)`,
    )
  }
  // ⚠ THE CANDIDATE LIST IS THE SWEEP THE 04.08 AUDIT DEFENDS N ON, and it is deliberately finer
  // than the four rungs the endings wave shipped with: 20 and 30 were three points apart in the
  // original and the whole argument for one over the other turns on how much of the accumulation
  // clause is actually doing the deciding. See docs/specs/fatigue-injury-audit-2026-08.md §7.
  for (const need of [10, 16, 20, 24, 30, 40, 52]) {
    const hit = longLived.filter((o) => o.freshSevereCount > 0 && o.maxWeeksOutAtSevere >= need).length
    console.log(
      `  a severe on >= ${String(need).padStart(2)}w already lost : ${hit} (${((100 * hit) / Math.max(1, longLived.length)).toFixed(1)}%)${need === ENDINGS.injuryPriorWeeksOut ? '   <- the shipped rule' : ''}`,
    )
  }
  console.log('')

  // --- THE TURN (album slot 6) ---
  //
  // ⚠ THIS IS THE MEASUREMENT §9.2 REQUIRES BEFORE SLOT 6's COPY IS WRITTEN, and the reason it is
  // two rows is that "break-even" names two different events years apart. Reading one for the other
  // is the trap: a WEEK that paid for itself is common and lands in the first professional season;
  // repaying everything the family ever spent is a different bar entirely.
  const turnRows = [...arms[0].rows, ...arms[1].rows]
  const cum = turnRows.filter((o) => o.cumulativeTurnWeek !== null)
  const wk = turnRows.filter((o) => o.weekTurnWeek !== null)
  console.log('  ── SLOT 6: THE TURN. Two different crossings, and they are years apart ──')
  console.log('')
  console.log(
    `  a WEEK that paid for itself    : ${wk.length}/${turnRows.length} = ${pct(wk.length, turnRows.length).trim()}` +
      `   median week ${wk.length ? median(wk.map((o) => o.weekTurnWeek!)).toFixed(0) : '–'} (age ${ageOf(wk.length ? median(wk.map((o) => o.weekTurnWeek!)) : null)})`,
  )
  console.log(
    `  the CUMULATIVE crossing (§9.2) : ${cum.length}/${turnRows.length} = ${pct(cum.length, turnRows.length).trim()}` +
      `   median week ${cum.length ? median(cum.map((o) => o.cumulativeTurnWeek!)).toFixed(0) : '–'} (age ${ageOf(cum.length ? median(cum.map((o) => o.cumulativeTurnWeek!)) : null)})`,
  )
  console.log('')
  const ratios = turnRows.map((o) => (o.spentCents > 0 ? o.prizeCents / o.spentCents : 0))
  console.log(
    `  prize / spend at the end: median ${(median(ratios) * 100).toFixed(1)}% · mean ${(mean(ratios) * 100).toFixed(1)}% · best ${(Math.max(...ratios) * 100).toFixed(1)}%`,
  )
  console.log(
    `  careers that were EVER paid a cheque: ${turnRows.filter((o) => o.prizeCents > 0).length}/${turnRows.length}`,
  )
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
