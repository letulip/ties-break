/**
 * r42-kid-share-ramp – ROUND 42 #25. WHAT TEN POINTS A BIRTHDAY, A 60% CAP AT 23 AND A COLLEGE
 * PAUSE DO TO THE FAMILY'S CORRIDOR AND TO HER ACCOUNT.
 *
 * THE OWNER, 14.09: «может быть нам с 18 не по 5, а по 10% в год ей добавлять стоит?», «может даже
 * до 60% к 23», and – the new mechanic – «пока она снова в тур не вернется». Confirmed 15.09.
 *
 * ⚠⚠ THE PREDICTION IS WRITTEN DOWN IN docs/specs/kid-share-ramp-2026-09.md §3 **BEFORE** THIS FILE
 * WAS FIRST RUN (invariant 5). The measured column goes back into that table, misses named as misses.
 * THE NUMBERS STAY HIS: this prints what the change does, it does not argue for it.
 *
 * THE ARMS, on identical seeds and presets:
 *   A · BEFORE  stepBps 500,  capBps 5000 – the round-23 ladder exactly.
 *   B · AFTER   stepBps 1000, capBps 6000 – what ships.
 *   0 · ACTUATION stepBps 0 – her account must flatten onto the `startBps` line or the dial is dead.
 *
 * ⚠⚠ AND THE COLLEGE ARM IS A DIFFERENT POPULATION, NOT A DIFFERENT SETTING, which is why it has its
 * own section and its own control. The pause is a MECHANIC – it cannot be switched off by moving a
 * constant – so §3 walks careers that really take the fork at nineteen, spend four years and come
 * back, and reads them against the same careers with the pause NEUTRALISED at the reading site
 * (`pausedYears` forced to 0). Same seeds, same fork, same four years: the only difference between
 * the two columns is whether those four birthdays counted.
 *
 * ⚠ ACTUATION IS PROVEN PER RUN AND THE COLLEGE ARM CARRIES ITS OWN: if no career in the corpus
 * actually reaches college, or if the paused count reads zero on every one of them, the section says
 * so and prints no table – «a constant without its reader is a null arm that looks like a null
 * result» (CLAUDE.md).
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A share with no denominator
 * prints `–`, never `0.0%`.
 *
 * Run:  npx vite-node tools/r42-kid-share-ramp.ts
 *       npx vite-node tools/r42-kid-share-ramp.ts -- --seeds 6 --college 4
 */
import { ECONOMY, kidPrizeShareBps } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import {
  callUpRevealOpen,
  closeTournament,
  collegeLeagueRevealOpen,
  collegePausedShareYears,
  kidAgeYears,
  pendingBirthday,
  resumeFromCollege,
  skipTournament,
} from '../src/engine/world'
import { answerFork } from '../src/engine/world/endings'
import { answerBirthdayNeutral } from './_birthday'
import { drainLifeBeats } from './_lifeBeats'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, mean, median } from './econ-bench'
// ⭐⭐ ROUND 42 #41 – THE CORRIDOR READER MOVED OUT OF THIS FILE AND DID NOT CHANGE. Item 41 needed the
// same print for the coach's every-cheque cut and was told to reuse this instrument rather than write
// a third one, so `Read` / `weeklyBurnCents` / `corridor` now live in `tools/_corridor.ts`, verbatim,
// with the two arm labels as parameters. Nothing this file prints moved.
import { corridor, money, padL, padR, readCorridor, type CorridorRead as Read } from './_corridor'
import type { CollegeOffer, CollegeTier } from '../src/shared/protocol'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET for the two money horizons. n = seeds x 9. */
const SEEDS = argOf('seeds', 4)
/** seeds PER PRESET for the college section, which is four times as expensive a walk. */
const COLLEGE_SEEDS = argOf('college', 3)
/** §3 alone. The corridor sections are deterministic and cost ten minutes; when only the college
 *  walk is being repaired there is no reason to re-derive numbers that cannot have moved. */
const COLLEGE_ONLY = args.includes('--college-only')
/** ⭐ HIS TWO HORIZONS, verbatim from the item: «the family's wealth corridor at week 400 and 600». */
const HORIZONS = [400, 600]
const START_AGE = 14
/** ⚠⚠ `POLICIES[1]` ('player') AND NOT `POLICIES[0]`, AND THE CHOICE IS THE MEASUREMENT'S. The
 *  'grinder' arm keeps no reserve and enters everything it can reach, so on a 400-week horizon it
 *  bankrupts 21 careers of 36 and its median wallet is MINUS $122 – a corpus in which «the family's
 *  wealth corridor» is a question about who died first rather than about the split. 'player' holds an
 *  eight-week reserve and a rest floor, which is the parent this item is about. Measured both ways
 *  before choosing; the grinder arm's answer is in the report, not hidden. */
const POLICY = POLICIES[1]

/** The two dials, as a bench arm. ⚠ `ECONOMY` is `as const`, so an arm reaches it through the cast
 *  the house benches already use (`tools/band-vs-field.ts`, `tools/fatigue-bench.ts`). */
interface Dials {
  stepBps: number
  capBps: number
}
const DIALS = ECONOMY.kidShare as unknown as Dials
const SHIPPED: Dials = { stepBps: DIALS.stepBps, capBps: DIALS.capBps }
const BEFORE: Dials = { stepBps: 500, capBps: 5000 }
const FLAT: Dials = { stepBps: 0, capBps: ECONOMY.kidShare.startBps }

function runCareer(presetIndex: number, seedIndex: number, weeks: number): Read {
  const preset = PRESETS[presetIndex]
  const { world, rng } = openCareer(preset, seedIndex, POLICY)
  let weeksUnderWater = 0
  for (let w = 0; w < weeks; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.fundsCents < 0) weeksUnderWater++
    if (world.ending) break
  }
  return readCorridor(world, preset.background, weeksUnderWater)
}

function runArm(dials: Dials, weeks: number, seeds: number): Read[] {
  DIALS.stepBps = dials.stepBps
  DIALS.capBps = dials.capBps
  const out: Read[] = []
  for (let p = 0; p < PRESETS.length; p++) for (let s = 0; s < seeds; s++) out.push(runCareer(p, s, weeks))
  return out
}

// --- §3 the college pause ---------------------------------------------------------------------------

interface CollegeRead {
  background: string
  pausedYears: number
  ageOnReturn: number
  bpsOnReturn: number
  bpsOnReturnNoPause: number
  kidFundsCents: number
  fundsCents: number
  /** she reached the fork with the college answer still open */
  reachedFork: boolean
  /** ...and she actually ENROLLED – `world.college` was written. ⚠ The two are separate on purpose:
   *  a career that answers the fork and then never departs is a null arm that looks like a result. */
  enrolled: boolean
  /** college years banked, 0-4 */
  yearsDone: number
  /** why the walk stopped, for the census that makes a null explicable */
  why: string
}

/** Walk to the fork, take college, spend the years, come back, and run on to the horizon. The shape
 *  is `tools/college-return-probe.ts`' walk, which is the one this repo already trusts. */
function runCollegeCareer(presetIndex: number, seedIndex: number, weeks: number): CollegeRead {
  const preset = PRESETS[presetIndex]
  const { world, rng } = openCareer(preset, seedIndex, POLICY)
  const read = (why: string): CollegeRead => {
    const ageOnReturn = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    const pausedYears = collegePausedShareYears(world)
    return {
      background: preset.background,
      pausedYears,
      ageOnReturn,
      bpsOnReturn: kidPrizeShareBps(ageOnReturn, pausedYears),
      bpsOnReturnNoPause: kidPrizeShareBps(ageOnReturn, 0),
      kidFundsCents: world.kidFundsCents ?? 0,
      fundsCents: world.fundsCents,
      reachedFork: world.fork !== null,
      enrolled: world.college !== null,
      yearsDone: world.college?.years.length ?? 0,
      why,
    }
  }
  for (let w = 0; w < weeks; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return read(`ended ${world.ending.type} before the fork`)
    if (world.fork !== null && world.fork.answer === null) break
  }
  if (world.fork === null || world.fork.answer !== null) return read('never reached an open fork')
  const offer = world.fork.offer as CollegeOffer
  const tier: CollegeTier = offer.quotes[0].tier
  drainLifeBeats(world)
  answerFork(world, 'college', tier)
  // ⚠ THE ANSWER ONLY RESERVES (round 24 #5) – `resolveCollegeDeparture` enrols her on the next
  // academic September, so the gap year has to be WALKED or `world.college` is never written and the
  // whole section reads zero. The birthday in that gap year blocks nothing here (this walks
  // `tickWeek`, not `advanceWeeks`), but it is answered so the record stays honest.
  for (let gap = 0; gap < 60 && world.college === null && world.ending === null; gap++) {
    stepCareerWeek(world, rng, POLICY)
    if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  }
  if (world.college === null) return read('answered college but never departed')
  // ⚠⚠ A COLLEGE YEAR HAS THREE QUESTIONS IN IT, NOT ONE, AND A DRIVER THAT ANSWERS ONLY THE
  // BIRTHDAY HANGS. `resumeFromCollege` pauses on her birthday week (round 24), on the student
  // championship (round 26 #6, v60) and on the Nations Cup tie (round 27 #6) – and a press over an
  // OPEN reveal is a reported no-op, so a loop that never closes one banks zero years for ever.
  // Measured the hard way: the first version of this walk reported «25 careers stopped inside
  // college, 0 years», which is a NULL ARM and not a null result. The reveal pair is answered the
  // way `tests/round23-kid-life.test.ts` answers it – the player's own two presses.
  for (let y = 0; y < 4 && world.ending?.type === 'college'; y++) {
    for (let press = 0; press < 12 && world.college.years.length === y && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
      if (collegeLeagueRevealOpen(world) || callUpRevealOpen(world)) {
        skipTournament(world)
        closeTournament(world)
      }
    }
  }
  if (world.ending !== null) return read(`stopped inside college (${world.ending.type}), ${world.college.years.length} years`)
  // She has graduated. Read the ramp AT THE RETURN – before the tour years move her age on.
  const atReturn = read(`graduated, ${world.college.years.length} years`)
  for (; world.week < weeks && world.ending === null; ) stepCareerWeek(world, rng, POLICY)
  return { ...atReturn, kidFundsCents: world.kidFundsCents ?? 0, fundsCents: world.fundsCents }
}

function collegeSection(): void {
  DIALS.stepBps = SHIPPED.stepBps
  DIALS.capBps = SHIPPED.capBps
  const rows: CollegeRead[] = []
  for (let p = 0; p < PRESETS.length; p++) {
    for (let s = 0; s < COLLEGE_SEEDS; s++) rows.push(runCollegeCareer(p, s, HORIZONS[1]))
  }
  const took = rows.filter((r) => r.enrolled && r.yearsDone > 0)
  console.log(`\n\n§3 THE COLLEGE PAUSE – «пока она снова в тур не вернется»\n`)
  // ⚠ THE CENSUS FIRST, ALWAYS – a section that can print a zero has to be able to say WHY.
  const census = new Map<string, number>()
  for (const r of rows) census.set(r.why, (census.get(r.why) ?? 0) + 1)
  console.log(`  careers walked: ${rows.length} – reached the fork ${rows.filter((r) => r.reachedFork).length}, ` +
    `enrolled ${rows.filter((r) => r.enrolled).length}, spent at least one year ${took.length}`)
  for (const [why, n] of [...census.entries()].sort((a, b) => b[1] - a[1])) console.log(`    ${padL(n, 4)}  ${why}`)
  if (took.length === 0) {
    console.log('  ⚠⚠ NO CAREER SPENT A COLLEGE YEAR – this section is a NULL ARM and prints no table.')
    return
  }
  const paused = took.filter((r) => r.pausedYears > 0)
  if (paused.length === 0) {
    console.log('  ⚠⚠ EVERY COLLEGE CAREER READS ZERO PAUSED YEARS – the mechanic is NOT WIRED on this corpus.')
    return
  }
  console.log(
    `  of those, careers whose ramp was actually paused: ${paused.length}` +
      `  (paused birthdays: median ${median(took.map((r) => r.pausedYears)).toFixed(1)}, max ${Math.max(...took.map((r) => r.pausedYears))})`,
  )
  console.log('')
  console.log(`  ${padR('', 40)}${padL('WITH the pause', 20)}${padL('same careers, no pause', 24)}`)
  const rowN = (label: string, a: number, b: number, fmt: (x: number) => string) =>
    console.log(`  ${padR(label, 40)}${padL(fmt(a), 20)}${padL(fmt(b), 24)}`)
  rowN(
    'her SHARE the week she comes back',
    mean(took.map((r) => r.bpsOnReturn)) / 100,
    mean(took.map((r) => r.bpsOnReturnNoPause)) / 100,
    (x) => `${x.toFixed(1)}%`,
  )
  rowN(
    'her age the week she comes back',
    mean(took.map((r) => r.ageOnReturn)),
    mean(took.map((r) => r.ageOnReturn)),
    (x) => x.toFixed(1),
  )
  console.log('')
  console.log(`  the distribution of her share on the week she returns (with the pause):`)
  const byBps = new Map<number, number>()
  for (const r of took) byBps.set(r.bpsOnReturn, (byBps.get(r.bpsOnReturn) ?? 0) + 1)
  for (const [bps, n] of [...byBps.entries()].sort((a, b) => a[0] - b[0])) {
    console.log(`    ${padL(`${bps / 100}%`, 8)}  ${padL(n, 4)} careers`)
  }
  console.log('')
  console.log(`  HER account at week ${HORIZONS[1]}, mean:   ${money(mean(took.map((r) => r.kidFundsCents)))}`)
  console.log(`  FAMILY wallet at week ${HORIZONS[1]}, mean:  ${money(mean(took.map((r) => r.fundsCents)))}`)
  console.log(
    '\n  ⚠ THE COLLEGE ROWS ARE NOT COMPARABLE WITH §1/§2 AND ARE NOT MEANT TO BE: four years off the' +
      '\n    tour is a different career, not a different setting. The one honest comparison is the pair' +
      '\n    of columns above – the same careers, read with and without the pause.',
  )
}

function main(): void {
  console.log('\n⭐⭐ ROUND 42 #25 – HER SHARE OF THE PRIZE MONEY: TEN POINTS A BIRTHDAY, 60% AT 23, COLLEGE PAUSES IT')
  console.log(
    `\n  shipped now: startBps ${ECONOMY.kidShare.startBps / 100}% from ${ECONOMY.kidShare.fromAgeYears}, ` +
      `+${SHIPPED.stepBps / 100}pp a birthday, cap ${SHIPPED.capBps / 100}% ` +
      `(reached at ${ECONOMY.kidShare.fromAgeYears + (SHIPPED.capBps - ECONOMY.kidShare.startBps) / SHIPPED.stepBps})`,
  )
  console.log(`  before:      +${BEFORE.stepBps / 100}pp a birthday, cap ${BEFORE.capBps / 100}% (reached at 26)`)
  const ladder = (d: Dials) => {
    DIALS.stepBps = d.stepBps
    DIALS.capBps = d.capBps
    return [17, 18, 19, 20, 21, 22, 23, 24, 25, 26].map((a) => `${kidPrizeShareBps(a) / 100}%`).join(' ')
  }
  console.log(`\n  ages       17   18   19   20   21   22   23   24   25   26`)
  console.log(`  BEFORE     ${ladder(BEFORE)}`)
  console.log(`  AFTER      ${ladder(SHIPPED)}`)

  for (const weeks of COLLEGE_ONLY ? [] : HORIZONS) {
    const age = START_AGE + weeks / WEEKS_PER_YEAR
    const before = runArm(BEFORE, weeks, SEEDS)
    const after = runArm(SHIPPED, weeks, SEEDS)
    corridor(`\n§${weeks === HORIZONS[0] ? 1 : 2} THE FAMILY CORRIDOR AT WEEK ${weeks} (she is ~${age.toFixed(1)})`, before, after, [
      'BEFORE 5pp/50@26',
      'AFTER 10pp/60@23',
    ])
  }

  collegeSection()

  // --- actuation ------------------------------------------------------------------------------------
  if (COLLEGE_ONLY) return
  const flat = runArm(FLAT, HORIZONS[0], Math.max(2, Math.floor(SEEDS / 2)))
  const live = runArm(SHIPPED, HORIZONS[0], Math.max(2, Math.floor(SEEDS / 2)))
  DIALS.stepBps = SHIPPED.stepBps
  DIALS.capBps = SHIPPED.capBps
  console.log('\n\n§4 ACTUATION – the dial must move the output, or every table above is a null\n')
  const herFlat = mean(flat.map((c) => c.kidFundsCents))
  const herLive = mean(live.map((c) => c.kidFundsCents))
  console.log(`  her account at week ${HORIZONS[0]}, stepBps 0 (a flat 10% forever): ${money(herFlat)}`)
  console.log(`  her account at week ${HORIZONS[0]}, shipped:                        ${money(herLive)}`)
  console.log(`  -> the ramp is ${herLive > herFlat ? 'WIRED' : '**NOT WIRED – EVERY ROW ABOVE IS A NULL**'}`)
}

main()
