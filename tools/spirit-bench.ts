// THE SPIRIT BENCH (wave 1, runbook §6) - `npm run bench:spirit`. Same shape as the econ / fatigue /
// knock / radar benches: a measurement harness, run by hand, never part of a gate.
//
// ⚠⚠ WHAT THIS FILE IS FOR, AND WHAT IT IS FORBIDDEN TO DO. CLAUDE.md invariant 5 - «tuning is
// measured, not guessed» - and the runbook's own sentence: **a bar that fails is a finding for the
// owner, never a licence to touch a constant.** This tool reads `ECONOMY.spirit` / `ECONOMY.bond`
// and changes nothing. If a number below comes back red, the number below is the report.
//
// THE QUESTION THE WAVE OWES AN ANSWER TO, in six parts (runbook §6):
//
//   1  does spirit MOVE at all                per-career sd over weeks >= 2 points, both arms
//   2  does it DRIFT                          weeks < 20 or > 95 under 2%; long-run mean 70 +/- 4,
//                                             held PER TEMPERAMENT and not merely pooled
//   3  does bond SEPARATE parenting           grind-vs-care gap >= 12 points at season 3, > 2x SEM
//   4  is either arm pinned at a clamp        neither bond median at 0 or 100
//   5  ⚠ THE FAIRNESS CORRIDOR                paired lifetime match-win deltas across temperaments
//                                             inside +/- 1.5 pp. who-she-is §4 names the ONLY
//                                             sanctioned compensator and it needs his word first.
//   6  is any Mood word dead copy             with the five-word ladder's cut points as a FREE
//                                             PARAMETER, what distribution is there to cut, and
//                                             which cuts would put all five in >= 2% of weeks
//
// ⚠ 6 PROPOSES NOTHING AS RULED. The five words, the ladder and its cut points are the owner's
// (CLAUDE.md invariant 4) and step 4 of the runbook is blocked on his wording pass. This file
// prints the DISTRIBUTION and the arithmetic of what would fit; it ships no word and no threshold.
//
// =================================================================================================
// THE GRID, AND WHY EACH HALF OF IT IS BUILT THE WAY IT IS
// =================================================================================================
//
// 32 seeds x 4 seasons x {care, grind} x 4 temperaments. Runbook §6, verbatim.
//
//   care    rest every knock  ·  a family week booked every season  ·  LIGHT exam weeks
//   grind   push every knock  ·  no family week ever                ·  HEAVY exam weeks
//
// ⚠ THE ARMS DIFFER IN PARENTING, NOT IN THE CALENDAR - the runbook's own words - and three
// deliberate choices keep that true rather than merely claimed:
//
//   (a) THE ENTRY POLICY IS IDENTICAL IN BOTH ARMS (`enterWhatSheCan`). A grind arm that also
//       entered more tournaments would fold the calendar into the answer, and bar 3 would be
//       measuring two things at once.
//       ⚠ AND IT IS THE ENGINE'S OWN CAUTION, not "enter everything": a week whose
//       `availabilityStatus` is anything but `ok` is skipped, which is exactly the family that does
//       not race her while she is Exhausted. MEASURED, because the aggressive policy looked
//       reasonable and was not: entering everything the medical gate does not HARD-block took her
//       into tournaments at condition 8-19 week after week, and the −4 played-hurt row then
//       out-weighed every arm-defining decision combined (bond ending at 13.5 in the CARE arm).
//       It also produced LESS tennis, not more – 206 lifetime matches against 211-231 for the
//       cautious policy, because a wrecked girl loses in the first round.
//
//   (b) THE BASE PLAN IS `balanced` IN BOTH ARMS. Only the EXAM weeks differ - `light` (train 60)
//       against `grind` (train 85) - because `ECONOMY.spirit.examTrainFloor` is exactly what
//       "light exams" vs "heavy exams" MEANS in the engine: the exam row fires at train >= 85 and
//       is silent below it. Running the whole career at two different plans would also have moved
//       injury rates, development and condition, and the spirit numbers would then be reporting
//       the training regime rather than the parenting.
//
//   (c) THE CARE ARM'S FAMILY WEEKS ARE BOOKED IN THE OFF-SEASON (season offsets 50 and 51, the
//       `staycation` package, which is free at every wealth band so no funds confound rides along).
//       The planner's own comment calls the off-season "the natural family-vacation week"; more to
//       the point, those weeks hold no tournaments, so a booked family week in the care arm takes
//       nothing off the calendar the grind arm still has.
//       ⚠ WEEK 49 IS LEFT FREE ON PURPOSE: it is `seasonWrapsWithNoVacation`'s own week, and the
//       two bookings at 50/51 are what makes that predicate answer false for the care arm.
//
// ⚠ THE FAMILY IS `wealthy`, WHICH IS radar-bench's OWN CHOICE AND FOR THE SAME REASON: this is a
// bench about the private life's two numbers, and the family's finances are not the variable under
// test. Measured on the default `middle` background, 2 careers in 8 ended in BANKRUPTCY at weeks 125
// and 157 - a ragged grid, a season-3 reading taken off careers that no longer exist, and a money
// story sitting inside every spirit number. At `wealthy` all careers run the full four seasons.
//
// ⚠ THE BIRTHDAY IS ANSWERED IDENTICALLY IN BOTH ARMS - always the thing she asked for. It is not
// one of the runbook's arm-defining decisions, so making it an arm difference would have handed
// bar 3 a gap it did not earn; answering it the same way in both arms exercises `chooseGift`'s new
// bond rows and hands §6's "his read" print the ask itself, without touching the care/grind
// difference at all.
//
// ⚠⚠ AND THE TEMPERAMENT IS ASSIGNED, NOT DRAWN, WHICH IS THE WHOLE FAIRNESS MEASUREMENT. The four
// temperament arms run the SAME 32 seeds with `world.temperament` overwritten after `createWorld`,
// so bar 5's deltas are PAIRED: seed-for-seed, arm-for-arm, the only difference between two careers
// being compared is who she is. Letting `temperamentFor` decide would have compared four DIFFERENT
// sets of careers and called the noise between them unfairness. The override is legal for exactly
// the reason it is safe: `temperament` is drawn on its own `seed:temperament` sub-stream and read in
// wave 1 by nothing but `temperamentIntensity` inside `accrueSpirit`, so overwriting the field moves
// no draw on any stream (the bench takes no draws of its own either - `rngFromSeed(world.seed)` is
// the world's own MAIN, exactly as every other bench drives it).
import {
  createWorld,
  tickWeek,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  chooseGift,
  birthdayOfferFor,
  bookVacation,
  enterEvent,
  availabilityStatus,
  skipTournament,
  closeTournament,
  matchesEverPlayed,
  TEMPERAMENTS,
} from '../src/engine/world'
import type { Temperament, WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { isExamWeek, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { schoolIsOver } from '../src/engine/kidLife'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'

// =================================================================================================
// THE GRID
// =================================================================================================

const SEASONS = 4
const WEEKS = SEASONS * WEEKS_PER_YEAR
/** Season 3's LAST week - the moment bar 3 reads bond at. */
const SEASON_3_WEEK = 3 * WEEKS_PER_YEAR
const SEED_COUNT = seedCount()
const ARMS = ['care', 'grind'] as const
type Arm = (typeof ARMS)[number]

/** `--seeds=N` for a smoke run; the grid the bars are read off is the runbook's 32. */
function seedCount(): number {
  const flag = process.argv.find((a) => a.startsWith('--seeds='))
  const n = flag ? Number(flag.slice('--seeds='.length)) : 32
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 32
}

/** The care arm's two family weeks a season: off-season offsets, where no tournament ever sits. */
const VACATION_OFFSETS = [50, 51]
const VACATION_PACKAGE = 'staycation'

// =================================================================================================
// ONE CAREER
// =================================================================================================

interface Career {
  seed: string
  arm: Arm
  temperament: Temperament
  /** spirit after every resolved week, in order */
  spirit: number[]
  /** bond at the end of every resolved week, after that week's decisions */
  bond: number[]
  /** bond at the end of season 3 - bar 3's own reading */
  bondAtSeason3: number
  matchesPlayed: number
  matchesWon: number
  knocks: number
  injuries: number
  vacations: number
  /** Weeks a decision cost her 3.5 bond or more INSIDE one tick. Only two rows can do that: the
   *  played-hurt −4 and (grind arm only, once a season) the zero-vacation −3 landing beside the
   *  0.5 regression. Read off the bond delta across the tick rather than off a news string, so no
   *  copy change can silently turn this counter into a zero. */
  heavyWeeks: number
  /** every birthday ask she raised, by gift id */
  asks: string[]
  weeks: number
  /** null when she played all four seasons; the ending's own type when she did not */
  endedAs: string | null
}

function runCareer(seed: string, arm: Arm, temperament: Temperament): Career {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy' })
  // ⚠ THE ONE FIELD THE BENCH WRITES. See the header: paired arms, zero draws moved.
  world.temperament = temperament
  const rng = rngFromSeed(world.seed)
  const career: Career = {
    seed,
    arm,
    temperament,
    spirit: [],
    bond: [],
    bondAtSeason3: Number.NaN,
    matchesPlayed: 0,
    matchesWon: 0,
    knocks: 0,
    injuries: 0,
    vacations: 0,
    heavyWeeks: 0,
    asks: [],
    weeks: 0,
    endedAs: null,
  }

  for (let i = 0; i < WEEKS; i++) {
    if (world.ending !== null) break
    // --- the family's season plan, laid at each season boundary (care arm only) ------------------
    if (arm === 'care' && world.week % WEEKS_PER_YEAR === 0) bookTheFamilyWeeks(world, career)
    // --- what this week is going to be worked at ------------------------------------------------
    world.plan = { ...planFor(world, arm) }
    // --- the ordinary entry policy, the SAME one in both arms ------------------------------------
    enterWhatSheCan(world)

    const bondBefore = world.bond
    tickWeek(world, rng)
    career.weeks++
    career.spirit.push(world.spirit)
    if (world.bond - bondBefore <= -3.5) career.heavyWeeks++
    if (world.injury !== null && world.injury.sinceWeek === world.week) career.injuries++

    // Her competition resolves the way a played career's does: watch nothing, close everything.
    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }

    // --- the parent's two decisions of the week --------------------------------------------------
    if (pendingKnock(world)) {
      career.knocks++
      decideKnock(world, arm === 'care' ? 'rest' : 'push')
    }
    answerTheBirthday(world, career)

    // Bond is read AFTER the week's decisions - "what he has built with her by the end of week W".
    career.bond.push(world.bond)
    if (world.week === SEASON_3_WEEK) career.bondAtSeason3 = world.bond
  }

  career.endedAs = world.ending === null ? null : world.ending.type
  career.matchesPlayed = matchesEverPlayed(world)
  career.matchesWon = world.seasonWins + world.seasonHistory.reduce((sum, h) => sum + h.wins, 0)
  // ⚠ NaN IS LEFT IN PLACE for a career that never reached week 156 (a career-ending injury is a
  // real outcome, not a harness fault). Bar 3 filters it out and prints its own n rather than
  // substituting the final bond of a career that was over by then - which would have quietly told
  // the bar a season-3 number that no season 3 produced.
  return career
}

/** LIGHT exam weeks against HEAVY ones, and nothing else about the plan differs - see header (b). */
function planFor(world: WorldState, arm: Arm) {
  const next = world.week + 1
  const exam = isExamWeek(next, schoolIsOver(next, world.profile.birthMonth))
  if (!exam) return WEEK_PLAN_PRESETS.balanced
  return arm === 'care' ? WEEK_PLAN_PRESETS.light : WEEK_PLAN_PRESETS.grind
}

/** The care arm's family weeks, booked a season ahead into the off-season. Swallows the planner's
 *  refusals the way the screen does: an unbookable week is simply a week the family does not get. */
function bookTheFamilyWeeks(world: WorldState, career: Career): void {
  for (const offset of VACATION_OFFSETS) {
    const week = world.week + offset
    if (week >= WEEKS) continue
    try {
      bookVacation(world, week, VACATION_PACKAGE)
      career.vacations++
    } catch {
      /* the week is already spoken for - the parent would see the lock */
    }
  }
}

/** THE ORDINARY ENTRY POLICY, IDENTICAL IN BOTH ARMS: everything she is eligible for inside a
 *  four-week horizon, and NOTHING the game itself is cautioning about. `availabilityStatus`'s three
 *  levels are the engine's own opinion of an entry - `blocked` is the doctor's veto and the tour's
 *  closed doors, `caution` is "Exhausted - racing risks injury", and `ok` is the rest. Taking only
 *  `ok` is the family that reads the caution and waits a week; see the header for what taking
 *  `caution` as well was measured to do to her. */
function enterWhatSheCan(world: WorldState): void {
  for (const e of world.season) {
    if (e.week <= world.week || e.week > world.week + 4) continue
    if (world.entries.includes(e.id)) continue
    try {
      if (availabilityStatus(world, e).level !== 'ok') continue
      enterEvent(world, e.id)
    } catch {
      /* not affordable, not eligible, deadline gone - the player would see the lock */
    }
  }
}

/** Answered the SAME way in both arms - she gets the thing she asked for. See the header for why
 *  this is deliberately not an arm difference. The ask itself is what §6's print wants. */
function answerTheBirthday(world: WorldState, career: Career): void {
  const age = pendingBirthday(world)
  if (age === null) return
  const { options, askedId } = birthdayOfferFor(world, age)
  if (options.length === 0) return
  career.asks.push(askedId)
  const granted = options.some((g) => g.id === askedId) ? askedId : options[0].id
  try {
    chooseGift(world, granted)
  } catch {
    /* a latch we cannot answer behind - the row simply does not appear */
  }
}

// =================================================================================================
// STATISTICS - the plainest possible spellings, so the numbers are auditable by hand
// =================================================================================================

function mean(xs: readonly number[]): number {
  return xs.length === 0 ? Number.NaN : xs.reduce((a, b) => a + b, 0) / xs.length
}

function sd(xs: readonly number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1))
}

function sem(xs: readonly number[]): number {
  return xs.length < 2 ? 0 : sd(xs) / Math.sqrt(xs.length)
}

function median(xs: readonly number[]): number {
  if (xs.length === 0) return Number.NaN
  const s = [...xs].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return Number.NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : (100 * part) / whole
}

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n)
}

function padL(s: string | number, n: number): string {
  return String(s).padStart(n)
}

function verdict(pass: boolean): string {
  return pass ? 'PASS' : 'FAIL'
}

function rule(title: string): void {
  console.log(`\n${'='.repeat(100)}\n${title}\n${'='.repeat(100)}`)
}

// =================================================================================================
// THE RUN
// =================================================================================================

const started = Date.now()
const careers: Career[] = []
for (const arm of ARMS) {
  for (const temperament of TEMPERAMENTS) {
    for (let s = 0; s < SEED_COUNT; s++) {
      careers.push(runCareer(`spirit-${s}`, arm, temperament))
    }
  }
}

const of = (arm: Arm, temperament?: Temperament) =>
  careers.filter((c) => c.arm === arm && (temperament === undefined || c.temperament === temperament))
const weeksOf = (cs: readonly Career[], pick: (c: Career) => number[]) => cs.flatMap(pick)

const full = careers.filter((c) => c.weeks === WEEKS).length
rule(
  `SPIRIT BENCH – wave 1, runbook §6 · ${SEED_COUNT} seeds × ${SEASONS} seasons × {care, grind} × 4 temperaments\n` +
    `${careers.length} careers, ${careers.reduce((a, c) => a + c.weeks, 0).toLocaleString('en-US')} resolved weeks · ` +
    `constants read from ECONOMY.spirit / ECONOMY.bond, none changed\n` +
    // ⚠ A CAREER THAT ENDED EARLY IS A SHORTER ARM, and a season-3 reading taken off one that no
    // longer exists is a lie. Printed rather than assumed, so truncation can never hide in a mean.
    `careers that ran all ${SEASONS} seasons: ${full}/${careers.length}` +
    (full === careers.length
      ? ''
      : `  ⚠ ${careers.length - full} ENDED EARLY (` +
        [...new Set(careers.filter((c) => c.endedAs !== null).map((c) => c.endedAs))]
          .map((t) => `${t} ${careers.filter((c) => c.endedAs === t).length}`)
          .join(', ') +
        `) – those arms are shorter than the rest`),
)

// --- 1. SPIRIT MOVES -----------------------------------------------------------------------------
rule('[1] SPIRIT MOVES – per-career sd of spirit over weeks · BAR: mean per-career sd ≥ 2.0 points, in BOTH arms')
console.log(`    ${pad('arm', 8)}${pad('temperament', 14)}${padL('careers', 8)}${padL('mean sd', 10)}${padL('min', 8)}${padL('max', 8)}${padL('p10', 8)}${padL('p90', 8)}`)
console.log(`    ${'─'.repeat(72)}`)
const sdByArm: Record<Arm, number[]> = { care: [], grind: [] }
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const cs = of(arm, t)
    const sds = cs.map((c) => sd(c.spirit))
    sdByArm[arm].push(...sds)
    const sorted = [...sds].sort((a, b) => a - b)
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(cs.length, 8)}${padL(mean(sds).toFixed(2), 10)}` +
        `${padL(sorted[0].toFixed(2), 8)}${padL(sorted[sorted.length - 1].toFixed(2), 8)}` +
        `${padL(quantile(sorted, 0.1).toFixed(2), 8)}${padL(quantile(sorted, 0.9).toFixed(2), 8)}`,
    )
  }
}
console.log(`    ${'─'.repeat(72)}`)
const bar1: Record<Arm, boolean> = { care: false, grind: false }
for (const arm of ARMS) {
  const m = mean(sdByArm[arm])
  bar1[arm] = m >= 2
  console.log(`    ${pad(arm, 8)}mean per-career sd ${m.toFixed(2)} vs bar 2.00 → ${verdict(bar1[arm])}`)
}
console.log(`    BAR 1 → ${verdict(bar1.care && bar1.grind)}`)

// --- 2. NO EXTREME DRIFT -------------------------------------------------------------------------
rule('[2] NO EXTREME DRIFT – BARS: weeks at spirit < 20 or > 95 under 2%, and long-run mean 70 ± 4 – held PER TEMPERAMENT ARM')
console.log(`    ${pad('arm', 8)}${pad('temperament', 14)}${padL('weeks', 9)}${padL('mean', 9)}${padL('sd', 8)}${padL('<20 %', 9)}${padL('>95 %', 9)}${padL('min', 8)}${padL('max', 8)}  bars`)
console.log(`    ${'─'.repeat(90)}`)
let bar2extreme = true
let bar2mean = true
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const xs = weeksOf(of(arm, t), (c) => c.spirit)
    const low = xs.filter((x) => x < 20).length
    const high = xs.filter((x) => x > 95).length
    const m = mean(xs)
    const okExtreme = pct(low + high, xs.length) < 2
    const okMean = Math.abs(m - 70) <= 4
    bar2extreme &&= okExtreme
    bar2mean &&= okMean
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(xs.length, 9)}${padL(m.toFixed(2), 9)}${padL(sd(xs).toFixed(2), 8)}` +
        `${padL(pct(low, xs.length).toFixed(2), 9)}${padL(pct(high, xs.length).toFixed(2), 9)}` +
        `${padL(Math.min(...xs).toFixed(1), 8)}${padL(Math.max(...xs).toFixed(1), 8)}  ` +
        `${verdict(okExtreme)}/${verdict(okMean)}`,
    )
  }
}
console.log(`    ${'─'.repeat(90)}`)
console.log(`    BAR 2a (extremes < 2%) → ${verdict(bar2extreme)}      BAR 2b (mean 70 ± 4, per temperament) → ${verdict(bar2mean)}`)

// --- 3. BOND SEPARATES ---------------------------------------------------------------------------
rule('[3] BOND SEPARATES – BARS: grind-vs-care gap ≥ 12 points at season 3, AND gap > 2 × SEM')
// ⚠⚠ THE STATISTICS ARE SEED-PAIRED, AND THAT IS NOT A REFINEMENT. The four temperament arms are
// the SAME 32 careers played four times over, so pooling all 4 × 32 as if they were 128 independent
// samples would divide the SEM by 2 for free and hand bar 3's "> 2 × SEM" half a pass it did not
// earn. Each seed contributes ONE number per arm (its mean over the four temperaments), and the gap
// is the mean of the 32 PAIRED per-seed differences with its own paired SEM - care and grind run
// the same seeds, so the pairing is real.
const seeds = [...new Set(careers.map((c) => c.seed))]
const perSeed = (arm: Arm, pick: (c: Career) => number) =>
  seeds.map((s) => mean(careers.filter((c) => c.arm === arm && c.seed === s).map(pick).filter((x) => !Number.isNaN(x))))
const season3Mean = (c: Career) => mean(c.bond.slice(2 * WEEKS_PER_YEAR, 3 * WEEKS_PER_YEAR))
const bondAt3: Record<Arm, number[]> = { care: perSeed('care', (c) => c.bondAtSeason3), grind: perSeed('grind', (c) => c.bondAtSeason3) }
const bondSeason3Mean: Record<Arm, number[]> = { care: perSeed('care', season3Mean), grind: perSeed('grind', season3Mean) }
const paired = (a: number[], b: number[]) => a.map((x, i) => x - b[i]).filter((d) => !Number.isNaN(d))
const bond3n = paired(bondAt3.care, bondAt3.grind).length
console.log(`    ${pad('reading (n = ' + bond3n + ' paired seeds)', 34)}${padL('care', 12)}${padL('± SEM', 9)}${padL('grind', 12)}${padL('± SEM', 9)}${padL('gap', 9)}${padL('2×SEM', 10)}`)
console.log(`    ${'─'.repeat(95)}`)
const gapsAt3 = paired(bondAt3.care, bondAt3.grind)
const gapAt3 = mean(gapsAt3)
const sem3 = sem(gapsAt3)
const gapsMean3 = paired(bondSeason3Mean.care, bondSeason3Mean.grind)
console.log(
  `    ${pad('bond at the end of season 3', 34)}${padL(mean(bondAt3.care).toFixed(2), 12)}${padL(sem(bondAt3.care).toFixed(3), 9)}` +
    `${padL(mean(bondAt3.grind).toFixed(2), 12)}${padL(sem(bondAt3.grind).toFixed(3), 9)}${padL(gapAt3.toFixed(2), 9)}${padL((2 * sem3).toFixed(3), 10)}`,
)
console.log(
  `    ${pad("season 3's mean bond", 34)}${padL(mean(bondSeason3Mean.care).toFixed(2), 12)}${padL(sem(bondSeason3Mean.care).toFixed(3), 9)}` +
    `${padL(mean(bondSeason3Mean.grind).toFixed(2), 12)}${padL(sem(bondSeason3Mean.grind).toFixed(3), 9)}${padL(mean(gapsMean3).toFixed(2), 9)}${padL((2 * sem(gapsMean3)).toFixed(3), 10)}`,
)
console.log(`    ${'─'.repeat(95)}`)
const bar3gap = gapAt3 >= 12
const bar3sem = gapAt3 > 2 * sem3
console.log(`    gap ${gapAt3.toFixed(2)} vs bar 12.00 → ${verdict(bar3gap)}      paired gap vs 2×SEM ${(2 * sem3).toFixed(3)} → ${verdict(bar3sem)}`)
console.log(`    BAR 3 → ${verdict(bar3gap && bar3sem)}`)
// The ceiling this bar is being asked to clear, computed from the constants rather than guessed:
// bond's restoring force is a FLAT `regressionPerWeek` step toward `start`, so a displacement can
// only be held while |mean weekly delta| >= that step.
console.log(
  `    ⚠ the arithmetic ceiling: bond regresses a FLAT ${ECONOMY.bond.regressionPerWeek}/week toward ${ECONOMY.bond.start}, so an arm can hold a\n` +
    `      displacement only while its decisions are worth ≥ ${ECONOMY.bond.regressionPerWeek}/week. Measured decision rates per career-week:`,
)
for (const arm of ARMS) {
  const cs = of(arm)
  const weeks = cs.reduce((a, c) => a + c.weeks, 0)
  const knocks = cs.reduce((a, c) => a + c.knocks, 0)
  const vac = cs.reduce((a, c) => a + c.vacations, 0)
  const asks = cs.reduce((a, c) => a + c.asks.length, 0)
  console.log(
    `      ${pad(arm, 8)}knocks ${(knocks / weeks).toFixed(4)}/wk · family weeks ${(vac / weeks).toFixed(4)}/wk · birthdays ${(asks / weeks).toFixed(4)}/wk`,
  )
}

// --- 4. NO CLAMPED MEDIANS -----------------------------------------------------------------------
rule('[4] NO CLAMPED MEDIANS – BAR: neither arm’s bond median at 0 or 100')
console.log(`    ${pad('arm', 8)}${padL('median', 10)}${padL('mean', 10)}${padL('p10', 9)}${padL('p90', 9)}${padL('min', 9)}${padL('max', 9)}${padL('at 0 %', 10)}${padL('at 100 %', 10)}`)
console.log(`    ${'─'.repeat(84)}`)
let bar4 = true
for (const arm of ARMS) {
  const xs = weeksOf(of(arm), (c) => c.bond)
  const sorted = [...xs].sort((a, b) => a - b)
  const med = median(sorted)
  const clamped = med === ECONOMY.bond.min || med === ECONOMY.bond.max
  bar4 &&= !clamped
  console.log(
    `    ${pad(arm, 8)}${padL(med.toFixed(2), 10)}${padL(mean(xs).toFixed(2), 10)}${padL(quantile(sorted, 0.1).toFixed(1), 9)}` +
      `${padL(quantile(sorted, 0.9).toFixed(1), 9)}${padL(sorted[0].toFixed(1), 9)}${padL(sorted[sorted.length - 1].toFixed(1), 9)}` +
      `${padL(pct(xs.filter((x) => x === ECONOMY.bond.min).length, xs.length).toFixed(2), 10)}` +
      `${padL(pct(xs.filter((x) => x === ECONOMY.bond.max).length, xs.length).toFixed(2), 10)}`,
  )
}
console.log(`    BAR 4 → ${verdict(bar4)}`)

// --- 5. THE FAIRNESS CORRIDOR --------------------------------------------------------------------
rule('[5] ⚠ THE FAIRNESS CORRIDOR – BAR: paired lifetime match-win deltas across temperaments inside ±1.5 pp')
console.log('    Paired seed-for-seed and arm-for-arm: the two careers in every delta differ in NOTHING but who she is.')
console.log(`    ${pad('pair', 18)}${padL('n', 6)}${padL('mean Δ pp', 12)}${padL('± SEM', 9)}${padL('max |Δ| pp', 13)}${padL('inside ±1.5', 13)}`)
console.log(`    ${'─'.repeat(71)}`)
const winRate = new Map<string, number>()
for (const c of careers) {
  winRate.set(`${c.arm}|${c.temperament}|${c.seed}`, c.matchesPlayed === 0 ? Number.NaN : pct(c.matchesWon, c.matchesPlayed))
}
let bar5 = true
let worstPair = 0
for (let i = 0; i < TEMPERAMENTS.length; i++) {
  for (let j = i + 1; j < TEMPERAMENTS.length; j++) {
    const a = TEMPERAMENTS[i]
    const b = TEMPERAMENTS[j]
    const deltas: number[] = []
    for (const arm of ARMS) {
      for (let s = 0; s < SEED_COUNT; s++) {
        const x = winRate.get(`${arm}|${a}|spirit-${s}`)
        const y = winRate.get(`${arm}|${b}|spirit-${s}`)
        if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) continue
        deltas.push(x - y)
      }
    }
    const m = mean(deltas)
    const worst = deltas.reduce((acc, d) => Math.max(acc, Math.abs(d)), 0)
    const ok = Math.abs(m) <= 1.5
    bar5 &&= ok
    worstPair = Math.max(worstPair, Math.abs(m))
    console.log(
      `    ${pad(`${a} − ${b}`, 18)}${padL(deltas.length, 6)}${padL(m.toFixed(3), 12)}${padL(sem(deltas).toFixed(3), 9)}` +
        `${padL(worst.toFixed(3), 13)}${padL(verdict(ok), 13)}`,
    )
  }
}
console.log(`    ${'─'.repeat(71)}`)
console.log(`    ${pad('lifetime win rate', 18)}${TEMPERAMENTS.map((t) => `${t} ${mean(careers.filter((c) => c.temperament === t).map((c) => pct(c.matchesWon, c.matchesPlayed))).toFixed(2)}%`).join('  ')}`)
console.log(`    worst pair |mean Δ| ${worstPair.toFixed(3)} pp vs corridor 1.500 pp → BAR 5 ${verdict(bar5)}`)
if (!bar5) {
  console.log('    ⚠⚠ A BREACH IS A FINDING FOR THE OWNER, NEVER A SILENT REBALANCE (who-she-is §4 names the only')
  console.log('       sanctioned compensator – support-responsiveness, not a stat rebate – and it needs his word first).')
}

// --- 6. MOOD-WORD OCCUPANCY ----------------------------------------------------------------------
rule('[6] MOOD-WORD OCCUPANCY – the spirit distribution under the CARE arm, and what cut points would fit')
console.log('    ⚠ The five words and their ladder are the OWNER’s (invariant 4) and are not built. This section')
console.log('      reports the distribution there is to cut and the arithmetic of what would fit. It proposes nothing.')
const careSpirit = weeksOf(of('care'), (c) => c.spirit)
const careSorted = [...careSpirit].sort((a, b) => a - b)
console.log(`\n    Deciles of spirit over ${careSorted.length.toLocaleString('en-US')} care-arm weeks:`)
console.log(`    ${['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'].map((d) => padL(d, 8)).join('')}`)
console.log(`    ${[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((q) => padL(quantile(careSorted, q).toFixed(1), 8)).join('')}`)

const BANDS: [string, (x: number) => boolean][] = [
  ['< 60 (under the knee)', (x) => x < 60],
  ['60 – 64.9', (x) => x >= 60 && x < 65],
  ['65 – 67.4', (x) => x >= 65 && x < 67.5],
  ['67.5 – 69.9', (x) => x >= 67.5 && x < 70],
  ['exactly 70.0 (baseline)', (x) => x === 70],
  ['70.1 – 72.4', (x) => x > 70 && x < 72.5],
  ['72.5 – 74.9', (x) => x >= 72.5 && x < 75],
  ['75 – 79.9', (x) => x >= 75 && x < 80],
  ['≥ 80', (x) => x >= 80],
]
console.log('\n    The shape of it, care arm:')
for (const [label, test] of BANDS) {
  const n = careSpirit.filter(test).length
  const share = pct(n, careSpirit.length)
  console.log(`      ${pad(label, 26)}${padL(share.toFixed(2) + '%', 9)}  ${'█'.repeat(Math.round(share / 2))}`)
}

// THE CUT-POINT SEARCH. Five words are five CONTIGUOUS bands of the value axis, so "do cut points
// exist that give all five >= 2%" is a partition of the sorted distinct values into five contiguous
// groups, and the best available set is the one whose SMALLEST group is largest. A DP over the
// cumulative distribution answers both at once.
const distinct = [...new Set(careSpirit)].sort((a, b) => a - b)
const cumulative = new Map<number, number>()
{
  let running = 0
  for (const v of distinct) {
    running += careSpirit.filter((x) => x === v).length
    cumulative.set(v, running)
  }
}
const upto = (index: number) => (index < 0 ? 0 : (cumulative.get(distinct[index]) ?? 0))
const massOf = (from: number, to: number) => upto(to) - upto(from - 1)
/** best[k][i] = the largest achievable MINIMUM band mass when values [0..i] are cut into k bands */
const NEG = -1
const best: number[][] = Array.from({ length: 6 }, () => new Array(distinct.length).fill(NEG))
const cutAt: number[][] = Array.from({ length: 6 }, () => new Array(distinct.length).fill(-1))
for (let i = 0; i < distinct.length; i++) best[1][i] = massOf(0, i)
for (let k = 2; k <= 5; k++) {
  for (let i = k - 1; i < distinct.length; i++) {
    for (let j = k - 2; j < i; j++) {
      if (best[k - 1][j] === NEG) continue
      const score = Math.min(best[k - 1][j], massOf(j + 1, i))
      if (score > best[k][i]) {
        best[k][i] = score
        cutAt[k][i] = j
      }
    }
  }
}
const bestMin = best[5][distinct.length - 1]
const bestShare = pct(bestMin, careSpirit.length)
const bar6 = bestShare >= 2
console.log(`\n    Best five-way split of this distribution: the SMALLEST of the five words can hold at most ${bestShare.toFixed(2)}% of weeks.`)
console.log(`    BAR 6 (each of five ≥ 2% of weeks, cut points free) → ${verdict(bar6)}`)
{
  const edges: number[] = []
  let k = 5
  let i = distinct.length - 1
  while (k > 1) {
    const j = cutAt[k][i]
    edges.unshift(j)
    i = j
    k--
  }
  console.log('\n    The best-available ladder, LOWEST band first – for his read, not a proposal:')
  console.log(`    ${pad('band', 24)}${padL('weeks', 10)}${padL('share', 10)}`)
  console.log(`    ${'─'.repeat(44)}`)
  let from = 0
  const bounds = [...edges, distinct.length - 1]
  for (let b = 0; b < bounds.length; b++) {
    const to = bounds[b]
    const lo = distinct[from]
    const hi = distinct[to]
    const n = massOf(from, to)
    const label = b === 0 ? `spirit < ${(distinct[to + 1] ?? hi).toFixed(1)}` : b === bounds.length - 1 ? `spirit ≥ ${lo.toFixed(1)}` : `${lo.toFixed(1)} – ${hi.toFixed(1)}`
    console.log(`    ${pad(label, 24)}${padL(n, 10)}${padL(pct(n, careSpirit.length).toFixed(2) + '%', 10)}`)
    from = to + 1
  }
  console.log(`    cut points (descending): ${edges.map((e) => distinct[e + 1].toFixed(1)).reverse().join('  ·  ')}`)
}

// --- FOR HIS READ, NO BARS -----------------------------------------------------------------------
rule('FOR HIS READ – no bars on any of these')
console.log('  (a) THE BIRTHDAY ASK-MIX PER TEMPERAMENT. ⚠ The ~1.5× weighting toward her register is runbook §4.4')
console.log('      and is NOT built; the ask rides `seed:birthday:<age>`, which carries no temperament term. An')
console.log('      identical mix across the four is therefore the EXPECTED reading here, and the baseline the')
console.log('      weighting will be measured against once it lands.')
{
  const ids = [...new Set(careers.flatMap((c) => c.asks))].sort()
  console.log(`\n    ${pad('temperament', 14)}${padL('asks', 7)}${ids.map((id) => padL(id, 14)).join('')}`)
  console.log(`    ${'─'.repeat(21 + 14 * ids.length)}`)
  for (const t of TEMPERAMENTS) {
    const asks = careers.filter((c) => c.temperament === t).flatMap((c) => c.asks)
    console.log(
      `    ${pad(t, 14)}${padL(asks.length, 7)}` +
        ids.map((id) => padL(pct(asks.filter((a) => a === id).length, asks.length).toFixed(1) + '%', 14)).join(''),
    )
  }
}
console.log('\n  (b) WEEKS UNDER THE KNEE (spirit < 60 – the only place `spiritMatchFactor` stops being 1.0).')
console.log(`\n    ${pad('arm', 8)}${pad('temperament', 14)}${padL('weeks < 60', 12)}${padL('share', 10)}${padL('per career', 12)}${padL('lowest', 9)}`)
console.log(`    ${'─'.repeat(65)}`)
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const cs = of(arm, t)
    const xs = weeksOf(cs, (c) => c.spirit)
    const under = xs.filter((x) => x < ECONOMY.spirit.knee).length
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(under, 12)}${padL(pct(under, xs.length).toFixed(2) + '%', 10)}` +
        `${padL((under / cs.length).toFixed(2), 12)}${padL(Math.min(...xs).toFixed(1), 9)}`,
    )
  }
}
console.log('\n  (c) BOND OUTCOMES PER TEMPERAMENT. ⚠ Bond has NO temperament term anywhere in wave 1, so any')
console.log('      spread across the four rows of one arm is the feedback path through `spiritMatchFactor` only.')
console.log(`\n    ${pad('arm', 8)}${pad('temperament', 14)}${padL('final', 9)}${padL('mean', 9)}${padL('median', 9)}${padL('min', 8)}${padL('max', 8)}${padL('knocks', 9)}${padL('injuries', 10)}${padL('heavy wks', 11)}`)
console.log(`    ${'─'.repeat(95)}`)
for (const arm of ARMS) {
  for (const t of TEMPERAMENTS) {
    const cs = of(arm, t)
    const finals = cs.map((c) => c.bond[c.bond.length - 1])
    const xs = weeksOf(cs, (c) => c.bond)
    console.log(
      `    ${pad(arm, 8)}${pad(t, 14)}${padL(mean(finals).toFixed(2), 9)}${padL(mean(xs).toFixed(2), 9)}${padL(median(xs).toFixed(2), 9)}` +
        `${padL(Math.min(...xs).toFixed(1), 8)}${padL(Math.max(...xs).toFixed(1), 8)}` +
        `${padL((cs.reduce((a, c) => a + c.knocks, 0) / cs.length).toFixed(2), 9)}` +
        `${padL((cs.reduce((a, c) => a + c.injuries, 0) / cs.length).toFixed(2), 10)}` +
        `${padL((cs.reduce((a, c) => a + c.heavyWeeks, 0) / cs.length).toFixed(2), 11)}`,
    )
  }
}
console.log('      "heavy wks" = weeks a decision cost her ≥ 3.5 bond inside ONE tick, per career. Only two rows can:')
console.log('      the played-hurt −4 (she was entered under a "cleared, but only just" verdict) and, grind arm only,')
console.log('      the season\'s zero-vacation −3 landing beside the regression. It is NOT an arm-defining decision –')
console.log('      it is what the shared entry policy costs – and it is printed because it is worth more per event than')
console.log('      any row that IS.')

// --- THE VERDICT ---------------------------------------------------------------------------------
rule('THE SIX BARS')
const bars: [string, boolean, string][] = [
  ['1  spirit moves (per-career sd ≥ 2)', bar1.care && bar1.grind, `care ${mean(sdByArm.care).toFixed(2)} · grind ${mean(sdByArm.grind).toFixed(2)}`],
  ['2a no extremes (< 20 / > 95 under 2%)', bar2extreme, 'per temperament arm'],
  ['2b long-run mean 70 ± 4', bar2mean, 'per temperament arm'],
  ['3  bond separates (≥ 12 at season 3, > 2×SEM)', bar3gap && bar3sem, `gap ${gapAt3.toFixed(2)} · 2×SEM ${(2 * sem3).toFixed(3)}`],
  ['4  no clamped bond medians', bar4, `care ${median(weeksOf(of('care'), (c) => c.bond)).toFixed(1)} · grind ${median(weeksOf(of('grind'), (c) => c.bond)).toFixed(1)}`],
  ['5  fairness corridor ±1.5 pp', bar5, `worst pair ${worstPair.toFixed(3)} pp`],
  ['6  five Mood words ≥ 2% each (cuts free)', bar6, `best smallest band ${bestShare.toFixed(2)}%`],
]
for (const [label, ok, note] of bars) console.log(`    ${verdict(ok)}  ${pad(label, 46)}${note}`)
console.log(`\n    ⚠ A FAILED BAR IS A FINDING FOR THE OWNER. This tool changed no constant and proposes none.`)
console.log(`\n    ${((Date.now() - started) / 1000).toFixed(1)}s`)
