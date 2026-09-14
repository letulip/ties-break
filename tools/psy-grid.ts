// THE PSYCHOLOGIST'S GRID – 4 focuses x 3 rungs, paired, predicted-first (v76, wave 5's T10).
//
// Run: `npm run bench:psy`  (`--careers N` scales every arm; `--walls N` the walls arms alone).
//
// WHAT THIS MEASURES, and why it is the ONLY instrument that can. CLAUDE.md invariant 5 – «tuning is
// measured, not guessed» – owes the wave's ladder a paired reading per focus, and the masseur spec's
// §4 law («each rung measurably better than the one below AT THE CHOSEN FOCUS or it is re-priced»)
// is applied per focus by the psychologist spec's §3. Everything before T10 in this wave BUILT
// something; this prices it.
//
// ⚠⚠⚠ AND THE FROZEN CORPUS CANNOT DO ANY OF IT – rulings K and R, said a fourth time because three
// tasks in a row have had to. The corpus diffs END STATES, so it is weak evidence about a change
// that CONVERGES (a faster walk to the same spirit, a composure walk toward a ceiling she reaches
// anyway, walls repairing to 0) – and for this wave's careers it cannot even REACH the state:
// measured at 156 weeks on all nine cells, ZERO love episodes, ZERO endings, no shock ever,
// `psychologistHired` false everywhere, and `econ-bench` never calls `answerLifeBeat`. A zero from
// the corpus says only that no accidental coupling leaked in. It is a coupling detector for this
// wave, not a measurement, and a corpus zero is NEVER reported here as a bench result.
//
// ⚠⚠ EVERY BAR IS PREDICTED BEFORE IT IS MEASURED, AND EVERY PREDICTION IS DERIVED RATHER THAN
// REMEMBERED. §1's predictions are computed in this file from `ECONOMY`'s own shipped constants and
// from the architect's rulings M, N and S by name – `predictUnderKnee` walks the return arithmetic
// with no perturbation in it, the clarity predictions ARE `ECONOMY.psychologist.listenClarity`, and
// the cool-head prediction is ruling M's 0.9x applied to the card. A bar met by a prediction written
// AFTER the measurement is not a bar, so nothing below reads a number off its own output.
//
// ⚠⚠ INSTRUMENT LAWS – the house's, and structural rather than promised:
//   1. THERE IS NO `try`/`catch` IN THIS FILE. Not one. A swallowed exception is a measurement that
//      lies (`bench:spirit` printed a full census and answered nothing for a whole wave behind one).
//      Where an engine call can refuse – `setPsychologistFocus` at a strained bond, every command
//      behind the terminal latch – the PREDICATE is asked first (`psychologistFocusRefusal`,
//      `world.ending !== null`), never the throw caught.
//   2. EVERY NUMBER GOES THROUGH `sample()` / `share()`, WHICH THROW ON A SHORT LIST. A median of an
//      empty column is not a reachable state of this program, and every printed row carries the `n`
//      it actually GOT rather than the n the grid asked for.
//   3. THE INSTRUMENT ASSERTS ITS OWN ACTUATION (§5, and a per-arm receipt beside every table).
//      Shocks stamped, receipts printed, flips fired, beyond-baseline weeks, ceiling weeks, matched
//      reactions – all COUNTED, all printed beside the result, all thrown on if zero. «The run
//      reached the thing» is proven before anything is read off it. This wave has produced EIGHT
//      sightings of the «unable to fail» family – two arms that moved together, a spot check on one
//      week, a walk that could not reach the case, an expectation calling the function under test, a
//      threshold passing on 0 and 1, a key-set comparison that only saw deletions, a sibling
//      restoring a flag to a literal, a sweep using the function under test as its expectation – and
//      a bench is the easiest place in the wave for a ninth.
//   4. `–` FOR «NO DATA», NEVER `0.0%`. A dash and a zero mean different things and a reader cannot
//      tell them apart afterwards.
//   5. PER-TEMPERAMENT ARMS AND PRINTED GRADIENTS – the spec's §5 («every focus has a natural
//      clientele») is a claim this file is the only reader of.
//   6. TWO EXIT CODES. ⚠ AND THIS FILE'S PAIR IS THE T10 BRIEF'S, NOT `life-arrival`'s. That census
//      exits 0 on a missed corridor because its bars are §4's acceptance table and a miss there is a
//      finding about HER. The T10 brief says in as many words: «0 when every bar is met, non-zero
//      when one is not. A bench that always exits 0 is a report, not a gate» – so a MISSED BAR here
//      exits non-zero, and so does an UNMEASURED column. That is deliberate and it is not a
//      regression against the house rule: NO BENCH RUNS INSIDE `npm run check`, so a red here is a
//      RULING REQUEST on §4's proposals rather than a blocked gate. Every miss is re-printed in §6
//      with the constant it implicates, because a miss is this task's PRODUCT and not its failure.
//
// ⚠⚠ ZERO NEW RNG, AND MAIN IS NOT TOUCHED. This file derives no stream. It drives the engine's own
// walk (`stepCareerWeek` from `econ-bench.ts`) and moves exactly two kinds of dial, both restored
// and both CHECKED restored at the end (§5):
//   · `ECONOMY.life.arrivalPerWeek` / `endsPerWeek` – `spirit-bench.ts`'s own shock poke, a poke of
//     the THRESHOLD and never of the stream, so `rngFromSeed` is re-derived at the call site off the
//     same key and the pair stays paired;
//   · `ECONOMY.psychologist.listenClarity` – the §1c byte-identity arm's one dial, for the same
//     reason: the coin is still drawn, on the same key, and only its verdict changes.
// The frozen capture (41550 / `e6b0c709`) cannot see this file; `tests/condition.test.ts` is where
// that is proven, not here.
import {
  createWorld,
  hirePsychologist,
  kidAgeExact,
  kidPoints,
  lifeLogOf,
  matchesEverPlayed,
  psychologistFocusRefusal,
  psychologistUnlocked,
  psychologistWorksThisWeek,
  setPsychologistFocus,
  setPsychologistRung,
  TEMPERAMENTS,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
// ⚠ NOT ON THE `engine/world` BARREL and imported from the leaves that own them – the same direct
// import `life-arrival.ts` takes on `bondBandOf`. `psychologistWorkingRung` is the billing predicate
// the three focus passes ask, `coolheadGain` the exact term `growWeek` spends, and the walls axes and
// the expressed read are `spirit.ts`'s. Asking the engine for all of them is what stops this file
// growing a second copy of any rule it is measuring.
import { psychologistWorkingRung } from '../src/engine/world/psychologist'
import { coolheadGain } from '../src/engine/development'
import {
  bondBandOf,
  expressedTemperamentOf,
  RECOVERY_RECEIPT,
  temperamentIntensity,
  temperamentOpenness,
  WALLS_AXES,
  type WallsAxis,
} from '../src/engine/spirit'
import { coachProfileBand, type CoachProfileBand } from '../src/engine/world/coachMarket'
import { styleFitBetween } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { PlayStyle } from '../src/shared/protocol/profile'
import type { LifeBeatRecord } from '../src/shared/protocol/narrative'
import type { PsyFocus } from '../src/engine/world/state'
import { rngFromSeed } from '../src/engine/rng'
import { mean, median, POLICIES, stepCareerWeek, type Policy } from './econ-bench'

// =================================================================================================
// 0. THE GRID
// =================================================================================================

function flag(name: string, fallback: number): number {
  const i = process.argv.indexOf(name)
  if (i < 0) return fallback
  const n = Number(process.argv[i + 1])
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** Seeds per temperament for the two CHEAP arms (recovery, cool head – both stop the walk a season
 *  after their subject). ⚠ THE SEEDS ARE THE SAME IN EVERY ARM OF A CELL, which is what makes the
 *  columns PAIRED: the same career is played with no seat and at each of the three rungs, so a
 *  difference between two columns is the rung and not which careers landed where. */
const CAREERS = flag('--careers', 20)
/** ...and for the two EXPENSIVE ones (listen, herself – both need most of a career: a flip is «an
 *  event of seasons» and the listen churn needs the cooldown to turn over several times). */
const WALLS_CAREERS = flag('--walls', Math.max(4, Math.round(CAREERS * 0.4)))

const AGE_AT = (week: number): number => kidAgeExact(week, DEFAULT_PROFILE.birthMonth, DEFAULT_PROFILE.birthDay)
/** ⚠ HER AGE IS ASKED OF THE ENGINE AND NEVER COMPUTED HERE – `life-arrival.ts`'s own rule and its
 *  own story: `14 + week / 52` is the coach market's restocking clock wearing her name. */
function weekSheTurns(age: number): number {
  for (let w = 0; w < 40 * WEEKS_PER_YEAR; w++) if (AGE_AT(w) >= age) return w
  throw new Error(`she never reaches ${age} inside forty years – the calendar moved under this bench`)
}
/** The census's own horizon: week 0 to the week she turns 24 (who-she-is §4's «ages 16→24»). */
const WEEKS = weekSheTurns(24)
/** The first week `arrivalEligible`'s age clause can be true. */
const ELIGIBLE_FROM = weekSheTurns(ECONOMY.life.ageGate)

/** THE CARING PARENT and THE GRINDING ONE – `econ-bench`'s two shipped policies, used as this file's
 *  two bond regimes because that is what they measurably ARE. Walked ten years, `player` holds the
 *  bond at `steady` for the whole career and `grinder` collapses it to `strained`/`cold` (the census's
 *  own finding, §2 of `life-arrival.ts`). The walls model reads the bond BAND and nothing else, so
 *  these two policies are the kicked arm and the cared-for arm without this file inventing either. */
const CARING: Policy = POLICIES[1]
const GRINDING: Policy = POLICIES[0]

// ⚠ THE ONE SEAM for a dial, and it is `spirit-bench.ts`'s: `ECONOMY` is `as const` at the TYPE level
// only, so a bench that means to move a number says so here, once, in a named cast.
const LIFE_DIAL = ECONOMY.life as unknown as { arrivalPerWeek: { minor: number; adult: number }; endsPerWeek: number }
const PSY_DIAL = ECONOMY.psychologist as unknown as { listenClarity: number[] }
const DIALS_SHIPPED = {
  minor: ECONOMY.life.arrivalPerWeek.minor,
  adult: ECONOMY.life.arrivalPerWeek.adult,
  ends: ECONOMY.life.endsPerWeek,
  clarity: [...ECONOMY.psychologist.listenClarity],
}
/** ⚠ BIG ENOUGH THAT EVERY MULTIPLIER CLEARS 1, DERIVED RATHER THAN CHOSEN – `spirit-bench.ts`'s own:
 *  the engine compares `rngFromSeed(...)()` against `rate x mult`, and a rate of `2 / min(mult)` makes
 *  `draw < hazard` certain for every girl, with the same single draw on the same key. */
const FORCE_RATE = 2 / Math.min(...Object.values(ECONOMY.life.temperamentMult), ...Object.values(ECONOMY.life.endsMult))

/** Restore every dial and CHECK it restored. Called once, at §5, and asserted rather than trusted. */
function restoreDials(): void {
  LIFE_DIAL.arrivalPerWeek.minor = DIALS_SHIPPED.minor
  LIFE_DIAL.arrivalPerWeek.adult = DIALS_SHIPPED.adult
  LIFE_DIAL.endsPerWeek = DIALS_SHIPPED.ends
  PSY_DIAL.listenClarity = [...DIALS_SHIPPED.clarity]
}

const RUNGS = [0, 1, 2] as const
type Rung = (typeof RUNGS)[number]
/** `null` is the NO-SEAT arm – the free road, `psychologistHired === false`, which §0.3 of the wave
 *  brief makes the control every walls-fall path must be measured against. */
type Arm = Rung | null
const ARMS: readonly Arm[] = [null, 0, 1, 2]
const armLabel = (a: Arm): string => (a === null ? 'no seat' : `rung ${a}`)
/** The arm one step DOWN the ladder – rung 0's neighbour below is the free road, which is what makes
 *  «against the rung below AND against no-seat» one walk of the same list rather than two tables. */
const armBelow = (a: Rung): Arm => (a === 0 ? null : ((a - 1) as Rung))

// =================================================================================================
// 1. THE GUARDS THAT MAKE AN EMPTY COLUMN IMPOSSIBLE TO MISTAKE FOR A MEASUREMENT
// =================================================================================================

interface Sample {
  readonly label: string
  readonly xs: readonly number[]
}

function requireN(label: string, n: number, minN: number): void {
  if (n >= minN) return
  console.log('')
  console.log(`  !! RED – ${label}: ${n} observation(s), ${minN} required.`)
  console.log('     This bench does not print a median, a mean or a share of an empty list. The column')
  console.log('     is UNMEASURED, which is a broken instrument and not a missed bar – exiting non-zero.')
  console.log('')
  throw new Error(`unmeasured column: ${label} (n=${n}, need ${minN})`)
}

/** ⚠⚠ THE ONLY WAY A NUMBER REACHES THE PRINTER. There is no overload that skips the check, so «the
 *  mean of an empty arm» is not a reachable state of this program. */
function sample(label: string, xs: readonly number[], minN = 1): Sample {
  requireN(label, xs.length, minN)
  return { label, xs }
}
const avg = (s: Sample): number => mean([...s.xs])
const med = (s: Sample): number => median([...s.xs])
/** THE STANDARD ERROR OF THE MEAN. ⚠ `n − 1` AND NOT `n`: at the sample sizes this grid runs the
 *  difference is a few per cent of the bar, and a bar read against a divisor that flatters it is not
 *  a bar. A one-observation column has no SEM and says so (`NaN` prints as `–`). */
function sem(s: Sample): number {
  const n = s.xs.length
  if (n < 2) return Number.NaN
  const m = avg(s)
  return Math.sqrt(s.xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (n - 1) / n)
}
/** A share, with the same guard on the DENOMINATOR – `0/0` formats as `NaN%` and a reader skims past
 *  it, which is the other way an empty column looks like a measurement. */
function share(label: string, hits: number, of: number, minN = 1): number {
  requireN(label, of, minN)
  return (100 * hits) / of
}

const pad = (s: string, w: number): string => (s.length >= w ? s : s + ' '.repeat(w - s.length))
const padL = (s: string, w: number): string => (s.length >= w ? s : ' '.repeat(w - s.length) + s)
/** ⚠ `–` FOR NO DATA, NEVER `0.0`. One formatter, so the distinction cannot be lost at one call site. */
const num = (x: number, dp = 2): string => (Number.isFinite(x) ? x.toFixed(dp) : '–')
const pctS = (x: number, dp = 1): string => (Number.isFinite(x) ? `${x.toFixed(dp)}%` : '–')
function rule(title: string): void {
  console.log('')
  console.log(`  -- ${title} ${'-'.repeat(Math.max(0, 96 - title.length))}`)
  console.log('')
}

const MISSES: string[] = []
/** A bar's verdict. ⚠ A MISS IS THIS TASK'S PRODUCT – §4's numbers are PROPOSALS and the owner rules
 *  on them after this run – so it is printed with the constant it implicates and carried to §6. It
 *  also decides the exit code (law 6 above). */
function verdict(bar: string, ok: boolean, detail: string): string {
  if (!ok) MISSES.push(`${bar} – ${detail}`)
  return ok ? 'HIT ' : 'MISS'
}
/** ⚠⚠ THE OTHER EXIT. An actuation zero is never a result of zero: it is the run saying it never
 *  reached its own subject, and it ends the program with the stack still attached. */
function stall(headline: string, detail: string): never {
  console.log('')
  console.log(`  ${'!'.repeat(96)}`)
  console.log(`  THE ARM MEASURED NOTHING – NO BAR IS READ OFF IT`)
  console.log(`    ${headline}`)
  console.log(`    ${detail}`)
  console.log(`  ${'!'.repeat(96)}`)
  console.log('')
  throw new Error(headline)
}

// =================================================================================================
// 2. ONE CAREER – the shared walk every arm below poses
// =================================================================================================

/** What an arm asks of one career. Everything not named here is held equal ACROSS the arms of a cell:
 *  the seed, the assigned temperament, `wealthy`, `DEFAULT_PROFILE`, the entry policy, the knock and
 *  birthday answers `stepCareerWeek` makes for both. */
interface WalkOpts {
  policy: Policy
  focus: PsyFocus | null
  /** `null` = nobody is hired, ever. The free road – §0.3's control arm in code. */
  rung: Arm
  weeks: number
  /** ⭐⭐ A PARENT WHO CHANGES – `policy` until this week, then `policyAfter.policy`. §1e is the only
   *  caller and it needs one: see that section's own ⚠⚠ for why a plain grinding arm cannot measure
   *  O6 at all. */
  policyAfter?: { week: number; policy: Policy }
  /** forced-arrival weeks and forced-ending weeks, `spirit-bench`'s threshold poke */
  arrivals?: readonly number[]
  ends?: readonly number[]
  /** true = the arrival and ending hazards are FORCED HIGH every eligible week, which turns the
   *  attachment over as fast as the cooldown allows. The listen arm's beat factory. */
  churn?: boolean
  /** the week at or after which a `spiritShock` counts as THE shock this walk is about – so an
   *  earlier forced ending (the «last time» T4's receipt needs) cannot be mistaken for the subject. */
  shockFrom?: number
  /** stop this many weeks after the pro gate opened. ⚠ IT IS A COST CUT AND NEVER A MEASUREMENT
   *  CHOICE: §1b reads ONE held season and the four hundred weeks after it are walked for nothing.
   *  The cut is keyed on the career's OWN unlock week, which is identical in both arms of a pair (it
   *  happens before either hires), so the two arms are still cut at the same week. */
  stopAtUnlockPlus?: number
}

interface Career {
  seed: string
  birth: Temperament
  expressed: Temperament
  weeks: number
  endedAs: string | null
  /** the week the pro gate opened (`activeLadderOf === 'wta'`), or −1 if it never did */
  unlockWeek: number
  /** the week the seat was hired, or −1 */
  hireWeek: number
  /** the week the focus was actually SET (the consent gates can refuse it for a career), or −1 */
  focusWeek: number
  /** how many times `setPsychologistFocus` was refused before it took – printed, because a career
   *  that could never buy the focus is the anti-dam working and not a missing sample. */
  focusRefusals: number
  /** weeks the family PAID him (`psychologistWorksThisWeek`) – the never-fired corridor's denominator */
  paidWeeks: number
  /** ...of which the chosen focus had nothing at all to do (§2's corridor) */
  idleWeeks: number
  /** the same count read the other way round, off the lean's own transition – §2's cross-check */
  observedIdle: number
  spiritByWeek: number[]
  bondByWeek: number[]
  leanByWeek: { open: number; reg: number }[]
  flippedByWeek: { open: boolean; reg: boolean }[]
  /** §1f (14.09) – was the seat WORKING this week (`psychologistWorksThisWeek`): the repair
   *  acceleration rides the billing predicate exactly as O6 does, and a stood-down week is a ×1
   *  week that would dilute the multiplier if pooled. Recorded off the engine's own predicate,
   *  never inferred from the step's value – inferring the cut from the output being measured is
   *  the «expectation from the function under test» family. */
  workingByWeek: boolean[]
  pointsByWeek: number[]
  composureByWeek: number[]
  ceilingByWeek: number[]
  /** the week `world.spiritShock` was first seen standing at or after `shockFrom`, and the week it
   *  cleared – both OBSERVED off the world, never inferred from the poke. */
  shockWeek: number
  shockCleared: number
  receipts: number
  /** read-bearing rows and their `heard` stamp, read back off `lifeLog` at the end of the walk */
  readBearing: number
  heardStamped: number
  heardTrue: number
  /** walls events, counted off the transition and not off the end state */
  flipsUp: Record<WallsAxis, number>
  flipsDown: Record<WallsAxis, number>
  beyondWeeks: number
  ceilingWeeks: number
  matches: number
  wins: number
  fundsCents: number
}

/** ⚠⚠ HAS THIS GIRL ANYWHERE TO GROW ON THIS AXIS – ruling N's table. It is `spirit.ts`'s own
 *  `wallsGrowable`, which is module-private, re-spelled HERE and nowhere else in this file, off the
 *  two exported axis readers. Named as a copy rather than hidden as one: a bench that needs it has
 *  two honest options, this or exporting a predicate for a bench's sake, and the copy is one line
 *  whose disagreement with the engine would show up as a flip counted in the wrong column. */
function growable(birth: Temperament, axis: WallsAxis): boolean {
  return axis === 'open' ? temperamentOpenness(birth) === 'private' : temperamentIntensity(birth) === 'intense'
}

function emptyAxis<T>(v: T): Record<WallsAxis, T> {
  return { open: v, reg: v }
}

/** ⭐⭐ THE WALK. ⚠ THE TEMPERAMENT IS ASSIGNED AND NEVER DRAWN, which is what makes the four columns
 *  PAIRED (`life-arrival.ts` and `spirit-bench.ts` both record the same construction and the same
 *  reason). ⚠ `wealthy`, for their reason too: a family that goes bankrupt at seventeen truncates the
 *  biography, and a truncated career is a missing measurement rather than a short one.
 *
 *  ⚠⚠ NO `try`/`catch`. The one refusal a walk can legitimately meet is the terminal latch, and it is
 *  TESTED (`world.ending !== null` breaks before anything is commanded), never caught. The focus
 *  command's own refusals are asked of `psychologistFocusRefusal` BEFORE the call, which is the same
 *  discipline one level down: the card and the throw share that predicate, so asking it is asking the
 *  engine rather than guessing at it. */
function walk(seed: string, birth: Temperament, opts: WalkOpts): Career {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy' })
  world.temperament = birth
  const rng = rngFromSeed(world.seed)
  const c: Career = {
    seed,
    birth,
    expressed: birth,
    weeks: 0,
    endedAs: null,
    unlockWeek: -1,
    hireWeek: -1,
    focusWeek: -1,
    focusRefusals: 0,
    paidWeeks: 0,
    idleWeeks: 0,
    observedIdle: 0,
    spiritByWeek: [],
    bondByWeek: [],
    leanByWeek: [],
    flippedByWeek: [],
    workingByWeek: [],
    pointsByWeek: [],
    composureByWeek: [],
    ceilingByWeek: [],
    shockWeek: -1,
    shockCleared: -1,
    receipts: 0,
    readBearing: 0,
    heardStamped: 0,
    heardTrue: 0,
    flipsUp: emptyAxis(0),
    flipsDown: emptyAxis(0),
    beyondWeeks: 0,
    ceilingWeeks: 0,
    matches: 0,
    wins: 0,
    fundsCents: 0,
  }
  let prevFlipped = { open: false, reg: false }

  for (let i = 0; i < opts.weeks; i++) {
    if (world.ending !== null) break
    // ⚠⚠ THE DIALS ARE WRITTEN EVERY WEEK RATHER THAN TOGGLED ON THE SPECIAL ONES – `spirit-bench`'s
    // own shape and its own reason: «zero on every other week» is then a property of the loop rather
    // than of a restore an early `break` could skip. `tickWeek` increments the week FIRST, so the
    // week this tick lands on is `world.week + 1` and the dials are set for THAT week.
    const landing = world.week + 1
    const churnOn = opts.churn === true && landing >= ELIGIBLE_FROM
    const arriveNow = churnOn || (opts.arrivals ?? []).includes(landing)
    const endNow = churnOn || (opts.ends ?? []).includes(landing)
    LIFE_DIAL.arrivalPerWeek.minor = arriveNow ? FORCE_RATE : 0
    LIFE_DIAL.arrivalPerWeek.adult = arriveNow ? FORCE_RATE : 0
    LIFE_DIAL.endsPerWeek = endNow ? FORCE_RATE : 0

    // --- THE NEVER-FIRED CORRIDOR'S TWO READS, AND THE ORDER IS THE WHOLE OF THEIR CORRECTNESS.
    //     ⚠⚠ THE **STATE** IS CAPTURED BEFORE THE TICK AND THE **PREDICATE** IS ASKED AFTER IT,
    //     because that is what the engine itself does: `tickWeek` increments the week FIRST, so
    //     `psychologistWorksThisWeek` inside the tick answers for the week being resolved, while the
    //     three focus passes spend the state that stood at the head of it.
    //     ⚠⚠ THE FIRST DRAFT ASKED BOTH BEFORE THE TICK AND WAS WRONG BY A WEEK – measured, not
    //     reasoned: §2's own cross-check disagreed by 39 pp, and a one-career probe found 54
    //     disagreeing weeks in 346, every one of them a week this counter called PAID and the engine
    //     had STOOD DOWN (a family holiday booked on the following week). A retainer counted on weeks
    //     nobody was billed for is precisely the number this corridor exists to get right.
    //     ⚠ THE DENOMINATOR IS PAID WEEKS AND NOT HELD WEEKS: a college freeze and a booked family
    //     week suspend the seat and charge NOTHING, so they belong in the «stood down» column.
    const leanBefore = { open: world.wallsLean.open, reg: world.wallsLean.reg }
    const stateBefore = {
      shock: world.spiritShock ?? null,
      composure: world.skills.composure,
      ceiling: world.potential.composure,
      lean: leanBefore,
    }

    stepCareerWeek(
      world,
      rng,
      opts.policyAfter !== undefined && world.week >= opts.policyAfter.week ? opts.policyAfter.policy : opts.policy,
    )
    c.weeks++
    const workingRung = opts.focus === null ? undefined : psychologistWorkingRung(world, opts.focus)
    if (workingRung !== undefined) {
      c.paidWeeks++
      if (idleThisWeek(world, opts.focus as PsyFocus, workingRung, stateBefore)) c.idleWeeks++
    }

    const w = world.week
    c.spiritByWeek[w] = world.spirit
    c.bondByWeek[w] = world.bond
    c.leanByWeek[w] = { open: world.wallsLean.open, reg: world.wallsLean.reg }
    c.flippedByWeek[w] = { open: world.wallsFlipped.open, reg: world.wallsFlipped.reg }
    c.composureByWeek[w] = world.skills.composure
    c.ceilingByWeek[w] = world.potential.composure
    c.pointsByWeek[w] = kidPoints(world, 'domestic')
    c.workingByWeek[w] = psychologistWorksThisWeek(world)
    for (const ax of WALLS_AXES) {
      if (world.wallsFlipped[ax] !== prevFlipped[ax]) {
        if (world.wallsFlipped[ax]) c.flipsUp[ax]++
        else c.flipsDown[ax]++
      }
      if (world.wallsLean[ax] > 0) c.beyondWeeks++
    }
    prevFlipped = { open: world.wallsFlipped.open, reg: world.wallsFlipped.reg }
    // ⚠ THE OBSERVATIONAL CROSS-CHECK ON THE `'herself'` CORRIDOR: a week «fired» iff the lean moved
    //   UP past what the FREE repair alone would have moved it. It is read off the lean's own
    //   transition rather than off a re-spelling of `driftWalls`'s branch table, and §2 prints the
    //   two counts beside each other so a disagreement between them is visible rather than silent.
    if (opts.focus === 'herself' && workingRung !== undefined) {
      const moved = WALLS_AXES.some((ax) => {
        const d = world.wallsLean[ax] - leanBefore[ax]
        return leanBefore[ax] >= 0 ? d > 0 : d > ECONOMY.life.walls.repairPerWeek + 1e-9
      })
      if (!moved) c.observedIdle++
    }
    // ⚠ THE MARK IS OBSERVED, NEVER INFERRED FROM THE POKE – `spirit-bench`'s rule. `rollEnds` stamps
    //   it and `accrueSpirit` can clear it in the same tick's tail.
    if (world.spiritShock !== null && c.shockWeek < 0 && world.spiritShock.week >= (opts.shockFrom ?? 0)) {
      c.shockWeek = world.spiritShock.week
    }
    if (world.spiritShock === null && c.shockWeek >= 0 && c.shockCleared < 0) c.shockCleared = w
    if (world.skills.composure >= world.potential.composure) c.ceilingWeeks++
    // ⚠⚠ THE WHOLE FEED IS FILTERED FOR **THIS WEEK**, AND A CURSOR HERE IS A DEFECT RATHER THAN AN
    //   OPTIMISATION – written, measured, and reverted inside this task. `world.events` is PRUNED
    //   (`ledger.ts`'s own note: `financeWeeks` «survives pruning» UNLIKE `events`), so an index kept
    //   across weeks walks off the end of a shortened array and never sees another row. It cost
    //   nothing visible: the table still printed, the receipts column just read ZERO – and §5's
    //   actuation guard is the only thing in this file that could tell that from «the focus never
    //   worked». The filter is cheap precisely BECAUSE the array is pruned; it is bounded, not
    //   career-length.
    c.receipts += world.events.filter((e) => e.week === w && e.text === RECOVERY_RECEIPT).length

    if (c.unlockWeek < 0 && psychologistUnlocked(world)) c.unlockWeek = w
    if (opts.stopAtUnlockPlus !== undefined && c.unlockWeek >= 0 && w > c.unlockWeek + opts.stopAtUnlockPlus) break
    // --- the hire, and then the focus: two commands, each behind the predicate that owns it --------
    if (opts.rung !== null && c.hireWeek < 0 && psychologistUnlocked(world)) {
      hirePsychologist(world, true)
      setPsychologistRung(world, opts.rung)
      c.hireWeek = w
    }
    if (opts.focus !== null && c.hireWeek >= 0 && c.focusWeek < 0) {
      // ⚠⚠ THE PREDICATE, NOT THE THROW. At a `strained`/`cold` bond `'herself'` is refused outright
      //    («she is not ready») and from 18 EVERY focus is refused – the consent gates, deterministic
      //    band reads. A grinding career therefore never buys the growth focus, which is the anti-
      //    «hugged into an extravert» dam standing in a second place, and it is COUNTED here rather
      //    than caught.
      if (psychologistFocusRefusal(world, opts.focus) === null) {
        setPsychologistFocus(world, opts.focus)
        c.focusWeek = w
      } else {
        c.focusRefusals++
      }
    }
  }

  c.endedAs = world.ending === null ? null : world.ending.type
  c.expressed = expressedTemperamentOf(world)
  c.matches = matchesEverPlayed(world)
  c.wins = world.seasonWins + world.seasonHistory.reduce((s, h) => s + h.wins, 0)
  c.fundsCents = world.fundsCents
  for (const row of lifeLogOf(world) as LifeBeatRecord[]) {
    if (row.kind !== 'met' && row.kind !== 'ended') continue
    c.readBearing++
    if (row.heard !== undefined) c.heardStamped++
    if (row.heard === true) c.heardTrue++
  }
  return c
}

/** ⭐ DID THE CHOSEN FOCUS HAVE ANYTHING AT ALL TO DO THIS WEEK – the never-fired corridor's numerator,
 *  asked of the WORLD before the tick and per focus:
 *
 *   · recovery – no live mark to shorten. `shockBeingWorked` also requires `shock.week < world.week`,
 *     so the landing week itself is not work either; that clause is mirrored here.
 *   · cool head – `coolheadGain` is EXACTLY 0, which is the ceiling (the spec's own bar and ruling
 *     M's second number: at or within a week's rate of her ceiling every rung buys nothing).
 *   · listen – no read-bearing beat was raised in the week, so the coin is never reached.
 *     ⚠ ASKED AFTERWARDS, off the row's own `week`, because the raise happens inside the tick; the
 *     walk records the weeks and §2 joins them.
 *   · herself – nothing to accelerate: her lean is already at her nature (0) with nowhere to grow, or
 *     the bond band is a kicked one, where this focus's two terms are both switched off.
 *
 *  ⚠ IT IS A READ AND NEVER A WRITE, and it asks the engine for every number it uses. */
function idleThisWeek(
  world: WorldState,
  focus: PsyFocus,
  rung: Rung,
  before: { shock: WorldState['spiritShock']; composure: number; ceiling: number; lean: Record<WallsAxis, number> },
): boolean {
  if (focus === 'recovery') {
    // `shockBeingWorked`'s own two clauses, mirrored: a mark that is not there, and the LANDING week
    // itself (`shock.week >= world.week`), which is not work either.
    const shock = before.shock ?? null
    return shock === null || shock.week >= world.week
  }
  if (focus === 'coolhead') {
    // ⚠ THE ENGINE'S OWN FUNCTION, on the engine's own inputs: `growAndLive` calls `coolheadGain`
    //   with the composure and the ceiling that stood at the head of the week. Exactly 0 is the
    //   ceiling (the spec §2's bar and ruling M's second number).
    return coolheadGain(before.composure, before.ceiling, rung) <= 0
  }
  if (focus === 'herself') {
    // ⚠⚠ THE BOND IS READ **AFTER** THE TICK AND THE LEAN **BEFORE** IT, and that is `driftWalls`'s
    //    own order rather than a convenience: it is a sibling of `accrueSpirit` and runs on the line
    //    after it, so the band it sees is the one the week's bond regression has already produced,
    //    while the lean it spends is the one it is about to move.
    const band = bondBandOf(world.bond)
    if (band === 'strained' || band === 'cold') return true
    // A CARE WEEK. The acceleration fires while a wall is still standing; the growth term while an
    // axis with somewhere to grow is at or above her nature AND STILL UNDER THE CAP – the lean
    // saturates at ±`leanMax` about 200 held weeks in, and from that week the term is clamped to
    // nothing while the family keeps paying.
    return !WALLS_AXES.some(
      (ax) => before.lean[ax] < 0 || (growable(world.temperament ?? 'sunny', ax) && before.lean[ax] < ECONOMY.life.walls.leanMax),
    )
  }
  // listen: decided in §2 off the rows' own weeks – the raise is inside the tick and cannot be asked
  // for before it. Counted as NOT idle here so this denominator is never the listen corridor's.
  return false
}

console.log('')
console.log('==============================================================================================')
console.log('  THE PSYCHOLOGIST\'S GRID – npm run bench:psy')
console.log('  docs/specs/the-psychologists-year-2026-09.md §2-§3 · docs/plans/life-wave-5-builder-2026-09.md §2 T10')
console.log('  rulings M (two numbers to predict), N (the walls sign), S (T12\'s line) – life-wave-5-rulings-2026-09.md')
console.log('==============================================================================================')
console.log('')
console.log('  !! THE FROZEN CORPUS IS NOT AN INSTRUMENT FOR THIS WAVE (rulings K and R). It compares END')
console.log('     STATES and cannot REACH this wave\'s: 0 love episodes, 0 endings, no shock, no hire, at 156')
console.log('     weeks on all nine cells. The paired arms below are the only thing that prices anything here.')
console.log('  !! NO try/catch ANYWHERE IN THIS FILE. Every engine refusal is asked of its own predicate first.')
console.log('  !! TWO EXIT CODES, and this file\'s pair is the T10 brief\'s: a MISSED BAR exits NON-ZERO (the')
console.log('     brief: «a bench that always exits 0 is a report, not a gate»), and so does an unmeasured')
console.log('     column. No bench runs inside `npm run check`, so a red here is a RULING REQUEST on §4\'s')
console.log('     proposals, never a blocked gate. Every miss is re-printed in §6 with the constant it implicates.')
console.log('')

rule('§0. THE GRID')
console.log(`    seeds/temperament  : ${CAREERS} (recovery, cool head) · ${WALLS_CAREERS} (listen, herself – full-career arms)`)
console.log(`    arms per cell      : ${ARMS.map(armLabel).join(' · ')}   ← PAIRED: the same seeds in every arm`)
console.log(`    temperaments       : ${TEMPERAMENTS.join(' · ')}   ← assigned after createWorld, never drawn`)
console.log(`    family             : wealthy · ${DEFAULT_PROFILE.birthMonth}/${DEFAULT_PROFILE.birthDay} birth date · the engine's own calendar`)
console.log(`    caring parent      : the '${CARING.label}' policy – measured to hold the bond at steady for a whole career`)
console.log(`    grinding parent    : the '${GRINDING.label}' policy – measured to collapse it to strained/cold`)
console.log(`    horizon            : week 0 → ${WEEKS} (she is ${AGE_AT(0).toFixed(2)} → 24) · the pro gate opens the seat`)
console.log(`    the ladder         : salaries $${ECONOMY.psychologist.rungs.map((r) => (r.salaryCents / 100).toFixed(0)).join(' / $')} a week · one session at every rung`)
console.log('')
console.log('    !! THE SEAT IS HIRED THE FIRST WEEK `psychologistUnlocked` IS TRUE (the pro career, the')
console.log('       travelling-team ruled gate) AND THE FOCUS IS SET THE FIRST WEEK THE ENGINE ALLOWS IT.')
console.log('       Both are commands through the shipped path; neither is poked onto the world.')

// =================================================================================================
// §1a. «BACK ON HER FEET» – the recovery slope, paired per rung
// =================================================================================================
//
// ⚠⚠ THE CONSTRUCTION IS WAVE-4'S PAIRED SHOCK ARMS, RE-RUN PER RUNG (`tools/spirit-bench.ts`'s
// `--shock` block), with ONE addition this file had to make and which is a reachability fix rather
// than a refinement: THERE ARE **TWO** ENDINGS, not one.
//
//   · T4's receipt is gated on `hadAnEarlierEnding` (the architect's вычитка, 13.09: «she came back
//     sooner than last time» needs a last time). With a single forced ending the receipt can NEVER
//     print, and an arm that cannot reach its own subject is this wave's most frequent defect. The
//     first pair (arrival, ending) is therefore the «last time»; the SECOND is the one every number
//     below is cut on, and the gap between them clears the longest `cooldownWeeks` in the table.
//   · The ending hazard is held at ZERO on every other week in every arm, so the arms differ in ONE
//     EVENT rather than in «one ending at a known week» minus «0.7 endings at unknown weeks».
//
// WHAT IS MEASURED: WEEKS UNDER THE KNEE (spirit < `ECONOMY.spirit.knee`), counted INCLUSIVE of the
// landing week – who-she-is §4's ruled convention («`spiritMatchFactor` reads her spirit on the
// landing week itself, so a convention that excluded it would name a week not-under-the-knee while
// the engine was pricing it as under»).

const RECOVERY_ARR_1 = 150
const RECOVERY_END_1 = 158
const RECOVERY_ARR_2 = 220
const RECOVERY_END_2 = 228
const RECOVERY_TO = RECOVERY_END_2 + 60

/** ⭐⭐ THE PREDICTION, DERIVED FROM THE ENGINE AND NOT REMEMBERED. `accrueSpirit` walks the return
 *  first, off last week's value, at `returnPerWeek[intensity] (+ recoverySlope[rung] while he works
 *  it)`, and the shock lands on the same tick as a term OUTSIDE the perturbation scale. So from a
 *  lifted `baseline + attachmentLift` the whole arithmetic is four constants, and this function is
 *  that arithmetic with the week's WEATHER left out – which is exactly what makes it a prediction:
 *  `weekPerturbation` is a real positive-on-average term this model does not carry, so every measured
 *  column is expected to read SHORTER than its prediction. What the prediction is for is the LADDER:
 *  the three rungs against each other and against the free road. */
function predictUnderKnee(intensity: 'steady' | 'intense', arm: Arm): number {
  const s = ECONOMY.spirit
  const rate = s.returnPerWeek[intensity] + (arm === null ? 0 : ECONOMY.psychologist.recoverySlope[arm])
  let spirit = s.baseline + s.attachmentLift + s.shock.breakup[intensity]
  let weeks = 0
  while (spirit < s.knee && weeks < 200) {
    weeks++
    spirit = Math.min(s.baseline, spirit + rate)
  }
  return weeks
}

rule('§1a. «BACK ON HER FEET» – weeks under the knee, paired per rung   [recoverySlope = RULED, spec §2]')
console.log(`    forced arrivals wk ${RECOVERY_ARR_1} and ${RECOVERY_ARR_2} · forced endings wk ${RECOVERY_END_1} and ${RECOVERY_END_2} · every other week's hazard held at 0`)
console.log(`    the FIRST ending is the «last time» T4's receipt needs; the SECOND is what every number is cut on.`)
console.log(`    under the knee = spirit < ${ECONOMY.spirit.knee}, INCLUSIVE of the landing week (who-she-is §4's ruled convention)`)
console.log('    prediction: the return arithmetic with NO weather in it – so a measured column SHORTER than')
console.log('    its prediction is `weekPerturbation` and not a defect. The BAR is the ladder, not the level.')
console.log('')

interface RecoveryCell {
  temperament: Temperament
  arm: Arm
  under: number[]
  receipts: number
  shocks: number
  hired: number
  seeds: string[]
  /** §2's two counters, folded as the cell walks – so the never-fired corridor is measured on the
   *  SAME RUNS as the ladder above it rather than on a second grid that could differ. */
  paid: number
  idle: number
  held: number
}
const recoveryCells: RecoveryCell[] = []
for (const t of TEMPERAMENTS) {
  for (const arm of ARMS) {
    const cell: RecoveryCell = { temperament: t, arm, under: [], receipts: 0, shocks: 0, hired: 0, seeds: [], paid: 0, idle: 0, held: 0 }
    for (let i = 0; i < CAREERS; i++) {
      const seed = `psy-rec-${i}`
      const c = walk(seed, t, {
        policy: CARING,
        focus: arm === null ? null : 'recovery',
        rung: arm,
        weeks: RECOVERY_TO,
        arrivals: [RECOVERY_ARR_1, RECOVERY_ARR_2],
        ends: [RECOVERY_END_1, RECOVERY_END_2],
        shockFrom: RECOVERY_END_2,
      })
      cell.paid += c.paidWeeks
      cell.idle += c.idleWeeks
      cell.held += c.hireWeek >= 0 ? c.weeks - c.hireWeek : 0
      if (c.shockWeek < RECOVERY_END_2) continue
      cell.shocks++
      if (c.hireWeek >= 0 && c.hireWeek < RECOVERY_END_2) cell.hired++
      cell.receipts += c.receipts
      let under = 0
      for (let w = RECOVERY_END_2; w < c.spiritByWeek.length; w++) {
        if (c.spiritByWeek[w] !== undefined && c.spiritByWeek[w] < ECONOMY.spirit.knee) under++
      }
      cell.under.push(under)
      cell.seeds.push(seed)
    }
    recoveryCells.push(cell)
  }
}
{
  const withShock = recoveryCells.reduce((s, c) => s + c.shocks, 0)
  if (withShock === 0) stall('§1a: ZERO careers carried `world.spiritShock` at the forced week', 'the poke never reached `rollEnds` – no bar below means anything')
  const hiredArms = recoveryCells.filter((c) => c.arm !== null)
  if (hiredArms.every((c) => c.hired === 0)) stall('§1a: ZERO seat arms ever hired', 'the pro gate never opened before the shock week – every column is the free road')
  if (hiredArms.reduce((s, c) => s + c.receipts, 0) === 0) {
    stall('§1a: ZERO recovery receipts printed in any seat arm', 'T4\'s clear line never fired – the arm cannot see the focus work at all')
  }
}
console.log(
  `    ${pad('temperament', 12)}${pad('arm', 9)}${padL('n', 4)}${padL('pred', 6)}${padL('median', 8)}${padL('mean', 8)}${padL('SEM', 7)}` +
    `${padL('vs rung-1 (paired)', 20)}${padL('SEM', 8)}${padL('x SEM', 8)}  verdict   ${padL('shocks', 7)}${padL('receipts', 9)}`,
)
for (const t of TEMPERAMENTS) {
  const intensity = temperamentIntensity(t)
  for (const arm of ARMS) {
    const cell = recoveryCells.find((c) => c.temperament === t && c.arm === arm)
    if (cell === undefined) throw new Error('missing cell')
    const s = sample(`§1a ${t}/${armLabel(arm)}`, cell.under, 1)
    const below = arm === null ? undefined : recoveryCells.find((c) => c.temperament === t && c.arm === armBelow(arm))
    let pairedTxt = '–'
    let pairedSemTxt = '–'
    let xSemTxt = '–'
    let vTxt = '    '
    if (arm !== null && below !== undefined) {
      // ⚠⚠ THE PAIRED DIFFERENCE, SEED BY SEED, AND NOT A DIFFERENCE OF TWO MEANS. The two arms are
      //    the same careers, so the pairing removes the career-to-career spread that is not the
      //    rung's – which is the whole reason the seeds are held identical across the arms.
      const common = cell.seeds.filter((sd) => below.seeds.includes(sd))
      const deltas = common.map((sd) => cell.under[cell.seeds.indexOf(sd)] - below.under[below.seeds.indexOf(sd)])
      const ds = sample(`§1a ${t}/${armLabel(arm)} paired`, deltas, 1)
      const m = avg(ds)
      const se = sem(ds)
      pairedTxt = num(m, 3)
      pairedSemTxt = num(se, 3)
      xSemTxt = Number.isFinite(se) && se > 0 ? num(Math.abs(m) / se, 2) : '–'
      // THE BAR (the masseur §4 law, applied per focus): strictly FEWER weeks under the knee than the
      // arm below, by more than 2 x SEM, or the rung is re-priced.
      const ok = m < 0 && Number.isFinite(se) && se > 0 && Math.abs(m) > 2 * se
      vTxt = verdict(
        `§1a recovery ${t} ${armLabel(arm)} vs ${armLabel(armBelow(arm))}`,
        ok,
        `paired Δ ${num(m, 3)} wk ± ${num(se, 3)} (${xSemTxt}× SEM, needs < 0 and > 2×SEM) – implicates ECONOMY.psychologist.recoverySlope [${ECONOMY.psychologist.recoverySlope.join(', ')}]`,
      )
    }
    console.log(
      `    ${pad(t, 12)}${pad(armLabel(arm), 9)}${padL(String(s.xs.length), 4)}${padL(String(predictUnderKnee(intensity, arm)), 6)}` +
        `${padL(num(med(s), 1), 8)}${padL(num(avg(s), 3), 8)}${padL(num(sem(s), 3), 7)}${padL(pairedTxt, 20)}${padL(pairedSemTxt, 8)}${padL(xSemTxt, 8)}  ${vTxt}      ` +
        `${padL(String(cell.shocks), 3)}${padL(String(cell.receipts), 9)}`,
    )
  }
}
console.log('')
console.log('    !! THE PER-TEMPERAMENT GRADIENT IS THE SPEC\'S §5 CLAIM («an intense girl\'s shocks are deeper, so')
console.log('       recovery buys more weeks back») and it is what the two intensity blocks above say or do not.')
console.log('    !! AND sunny==quiet, fiery==deep BY ARITHMETIC RATHER THAN BY LUCK – wave 4\'s own note, restated')
console.log('       here so four rows that agree to the digit are not read as a dead arm. `accrueSpirit` spends the')
console.log('       temperament THREE ways and all three are `temperamentIntensity`: the return rate, the')
console.log('       perturbation scale and the shock. Her OPENNESS reaches `knownWeek` and nothing the spirit pass')
console.log('       can see, and the arrival and the ending are both forced here – so the informative comparison in')
console.log('       this section is steady-vs-intense, and the four columns are two measurements printed twice.')

// =================================================================================================
// §1b. «COOL HEAD» – the composure walk against a TRAINING-ONLY control
// =================================================================================================
//
// ⚠⚠ THE CONTROL IS THE SAME CAREER WITH NO SEAT, AND THE READING IS ONE HELD SEASON. A career-end
// reading is NOT this measurement and would be the «unable to fail» family again in its ceiling
// costume: both arms converge on `potential.composure`, so a terminal diff prices the CEILING and
// not the rate. Ruling M's second number says the same thing from the other side – at or within a
// week's rate of her ceiling ALL THREE RUNGS COLLAPSE TO EXACTLY 0 – so this block segments on the
// HEADROOM the control arm carried into the season, and prints both segments.
//
// ⚠⚠ RULING M BINDS THE PREDICTION: a held season delivers ~0.9x the card number (1.35 / 2.25 / 3.15
// against 1.5 / 2.5 / 3.5), because `growWeek`'s gain is `rate × HEADROOM × luck × aim` and a girl he
// has already lifted has marginally less headroom for the training that follows. Predicting 1.0x
// would report a correct implementation as a miss.

const COOLHEAD_PRED_FACTOR = 0.9 // ruling M, measured by T5 over five seeds
/** The headroom a career must have carried into the season for its cell to be read as a RATE rather
 *  than as a ceiling. ⚠ DERIVED: one season's worth of the top rung, so the cut is «there was room for
 *  the whole of what the best rung sells» and not a round number. */
const COOLHEAD_HEADROOM_CUT = Math.max(...ECONOMY.psychologist.coolheadPerSeason)

rule('§1b. «COOL HEAD» – one held season against a training-only control   [coolheadPerSeason = PROPOSAL, O5]')
console.log(`    the season starts the week the pro gate opens (the first week the seat can be bought) and runs ${WEEKS_PER_YEAR} weeks.`)
console.log(`    PREDICTION = ${COOLHEAD_PRED_FACTOR}× the card (RULING M): ${ECONOMY.psychologist.coolheadPerSeason.map((r) => (r * COOLHEAD_PRED_FACTOR).toFixed(2)).join(' / ')} against the constants' ${ECONOMY.psychologist.coolheadPerSeason.join(' / ')}.`)
console.log(`    segmented on the CONTROL arm's headroom at the hire week (cut: ${COOLHEAD_HEADROOM_CUT} points = one season of the top rung),`)
console.log(`    because ruling M's second number is that at the ceiling every rung buys exactly 0.`)
console.log('')

interface CoolCell {
  temperament: Temperament
  arm: Arm
  gain: number[]
  headroom: number[]
  workedWeeks: number[]
  termSum: number[]
  seeds: string[]
  atCeiling: number
}
const coolCells: CoolCell[] = []
for (const t of TEMPERAMENTS) {
  for (const arm of ARMS) {
    const cell: CoolCell = { temperament: t, arm, gain: [], headroom: [], workedWeeks: [], termSum: [], seeds: [], atCeiling: 0 }
    for (let i = 0; i < CAREERS; i++) {
      const seed = `psy-cool-${i}`
      // ⚠ THE WALK IS CUT AT THE HIRE WEEK PLUS ONE SEASON, and the hire week is a property of the
      //   CAREER (the pro gate), so the two arms of a pair cut at the same week by construction –
      //   they are the same career up to the hire.
      const c = walk(seed, t, {
        policy: CARING,
        focus: arm === null ? null : 'coolhead',
        rung: arm,
        weeks: WEEKS,
        stopAtUnlockPlus: WEEKS_PER_YEAR + 1,
      })
      if (c.unlockWeek < 0) continue
      const from = c.unlockWeek
      const to = from + WEEKS_PER_YEAR
      if (c.composureByWeek[to] === undefined) continue
      cell.gain.push(c.composureByWeek[to] - c.composureByWeek[from])
      cell.headroom.push(c.ceilingByWeek[from] - c.composureByWeek[from])
      cell.seeds.push(seed)
      if (c.ceilingByWeek[from] - c.composureByWeek[from] < COOLHEAD_HEADROOM_CUT) cell.atCeiling++
    }
    coolCells.push(cell)
  }
}
{
  const seat = coolCells.filter((c) => c.arm !== null)
  if (seat.every((c) => c.gain.length === 0)) stall('§1b: ZERO careers reached the pro gate inside the horizon', 'the seat could never be bought – there is no held season to read')
}
console.log(
  `    ${pad('temperament', 12)}${pad('arm', 9)}${padL('n', 4)}${padL('pred', 7)}${padL('gain vs control', 17)}${padL('SEM', 8)}${padL('× SEM', 7)}` +
    `${padL('roomy n', 9)}${padL('roomy Δ', 9)}${padL('at-ceil n', 11)}${padL('ceil Δ', 9)}${padL('vs rung below', 15)}${padL('× SEM', 8)}  verdict`,
)
for (const t of TEMPERAMENTS) {
  const control = coolCells.find((c) => c.temperament === t && c.arm === null)
  if (control === undefined) throw new Error('missing control')
  for (const arm of RUNGS) {
    const cell = coolCells.find((c) => c.temperament === t && c.arm === arm)
    if (cell === undefined) throw new Error('missing cell')
    const common = cell.seeds.filter((sd) => control.seeds.includes(sd))
    const deltas = common.map((sd) => cell.gain[cell.seeds.indexOf(sd)] - control.gain[control.seeds.indexOf(sd)])
    const rooms = common.map((sd) => control.headroom[control.seeds.indexOf(sd)])
    const ds = sample(`§1b ${t}/${armLabel(arm)}`, deltas, 1)
    const m = avg(ds)
    const se = sem(ds)
    const roomy = deltas.filter((_, k) => rooms[k] >= COOLHEAD_HEADROOM_CUT)
    const tight = deltas.filter((_, k) => rooms[k] < COOLHEAD_HEADROOM_CUT)
    // THE BAR: growth vs the training-only control, more than 2 x SEM, at every rung (the spec §2's
    // own bench line). ⚠ IT IS READ ON THE ROOMY SEGMENT, because the at-ceiling segment is ruling
    // M's exact-0 by design and pooling the two would price the ceiling as a failure of the rate.
    const rs = roomy.length >= 2 ? sample(`§1b ${t}/${armLabel(arm)} roomy`, roomy, 2) : null
    const rm = rs === null ? Number.NaN : avg(rs)
    const rse = rs === null ? Number.NaN : sem(rs)
    const ok = Number.isFinite(rm) && Number.isFinite(rse) && rse > 0 && rm > 2 * rse
    const v = verdict(
      `§1b coolhead ${t} ${armLabel(arm)} vs training-only`,
      ok,
      `roomy Δ ${num(rm, 3)} ± ${num(rse, 3)} over n=${roomy.length} (needs > 2×SEM) – implicates ECONOMY.psychologist.coolheadPerSeason [${ECONOMY.psychologist.coolheadPerSeason.join(', ')}]`,
    )
    // ⚠⚠ AND THE SECOND HALF OF THE BRIEF'S «AGAINST THE RUNG BELOW AND AGAINST NO-SEAT»: the same
    //    paired difference taken against the arm one rung down rather than against the control. It is
    //    the masseur §4 law in its own words, and it is a different question from «does the focus do
    //    anything» – the column above can be enormous at every rung while this one is noise, which is
    //    exactly the 23.08 slope-blur the spec §1 claims the focus model dissolves.
    let belowTxt = '–'
    let belowX = '–'
    if (arm > 0) {
      const lower = coolCells.find((c) => c.temperament === t && c.arm === ((arm - 1) as Rung))
      if (lower === undefined) throw new Error('missing lower cell')
      const shared = cell.seeds.filter((sd) => lower.seeds.includes(sd))
      const bd = sample(
        `§1b ${t}/${armLabel(arm)} vs ${armLabel(armBelow(arm))}`,
        shared.map((sd) => cell.gain[cell.seeds.indexOf(sd)] - lower.gain[lower.seeds.indexOf(sd)]),
        1,
      )
      const bm = avg(bd)
      const bse = sem(bd)
      belowTxt = num(bm, 3)
      belowX = Number.isFinite(bse) && bse > 0 ? num(Math.abs(bm) / bse, 1) : '–'
      verdict(
        `§1b coolhead ${t} ${armLabel(arm)} vs ${armLabel(armBelow(arm))}`,
        bm > 0 && Number.isFinite(bse) && bse > 0 && bm > 2 * bse,
        `paired Δ ${num(bm, 3)} ± ${num(bse, 3)} points of composure a season (needs > 0 and > 2×SEM) – implicates ECONOMY.psychologist.coolheadPerSeason [${ECONOMY.psychologist.coolheadPerSeason.join(', ')}]`,
      )
    }
    console.log(
      `    ${pad(t, 12)}${pad(armLabel(arm), 9)}${padL(String(ds.xs.length), 4)}${padL(num(ECONOMY.psychologist.coolheadPerSeason[arm] * COOLHEAD_PRED_FACTOR, 2), 7)}` +
        `${padL(num(m, 4), 17)}${padL(num(se, 4), 8)}${padL(Number.isFinite(se) && se > 0 ? num(Math.abs(m) / se, 1) : '–', 7)}` +
        `${padL(String(roomy.length), 9)}${padL(num(rm, 3), 9)}${padL(String(tight.length), 11)}${padL(tight.length > 0 ? num(mean(tight), 3) : '–', 9)}` +
        `${padL(belowTxt, 15)}${padL(belowX, 8)}  ${v}`,
    )
  }
}
{
  // ⭐⭐ ZERO AT THE CEILING, PROVEN RATHER THAN ASSERTED FROM THE CODE – the spec §2's own bar and
  //     ruling M's second number. The subject is `coolheadGain`'s value on weeks she is AT the
  //     ceiling, counted over the walked careers, and the claim is exact: not small, ZERO.
  let nonZeroAtCeiling = 0
  // the exact claim, swept over the engine's own function at the boundary rather than over a walk
  // (a walk can only sample the states it happens to reach, and this is a claim about ALL of them):
  let swept = 0
  for (const rung of RUNGS) {
    for (const ceiling of [40, 55, 66.2469, 80]) {
      for (const over of [0, 0.0001, 0.5, 5]) {
        swept++
        if (coolheadGain(ceiling + over, ceiling, rung) !== 0) nonZeroAtCeiling++
      }
    }
  }
  const ok = nonZeroAtCeiling === 0 && swept > 0
  const v = verdict('§1b zero at the ceiling', ok, `${nonZeroAtCeiling} of ${swept} at-or-above-ceiling states bought something`)
  console.log('')
  console.log(`    zero at the ceiling : ${swept} at-or-above-ceiling states swept over the engine's own \`coolheadGain\`, ${nonZeroAtCeiling} non-zero  ${v}`)
  console.log(`    careers that STARTED the season inside ${COOLHEAD_HEADROOM_CUT} points of the ceiling: ${coolCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.atCeiling, 0)} of ${coolCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.seeds.length, 0)} seat-arm careers`)
  console.log(`    (ruling M's second number is the reason the bar above is read on the ROOMY segment and the`)
  console.log(`     at-ceiling column is printed beside it rather than pooled into it.)`)
  console.log('')
  console.log('    !! THE FOUR TEMPERAMENT ROWS ARE IDENTICAL, AND THAT IS THE MEASUREMENT RATHER THAN A DEAD ARM.')
  console.log('       `growWeek` reads her skills, her ceiling, her age, the plan and one luck draw – and NOT who')
  console.log('       she is; the temperament reaches spirit, arrivals, endings and bond, none of which is in this')
  console.log('       window (no arrival is forced here and no shock lands). So COOL HEAD IS THE ONE FOCUS WITH NO')
  console.log('       NATURAL CLIENTELE, which is worth saying because the spec\'s §5 claims one for the other three.')
  console.log('       The proof that the assignment is live is one section up: §1a\'s columns differ by intensity.')
}

// =================================================================================================
// §1c. «LEARNING TO LISTEN» – the matched-reaction share, and the bond fence
// =================================================================================================
//
// ⚠⚠ THE BEATS HAVE TO BE MADE TO HAPPEN. A natural career meets two or three people in eight years,
// so a no-poke arm would read a matched-reaction share off a handful of rows and call it a ladder.
// The CHURN arm holds both hazards high from the age gate on: `rollArrival` still refuses while
// somebody is there and inside the cooldown, and `rollEnds` still refuses with nobody there – so the
// attachment turns over as fast as `ECONOMY.life.cooldownWeeks` allows and every raise goes through
// the shipped path. The poke is of the THRESHOLD; the coin is the engine's own, on its own key.
//
// ⚠⚠ AND THE BOND FENCE'S CONTROL IS THE CLARITY DIAL, NOT THE HIRE. Measured first: hiring the seat
// moves `fundsCents`, the entry policy reads a reserve off the ledger, and three careers in four
// therefore DIVERGE from their unhired twin – so «hired vs not hired» prices the wallet and would
// have reported a wording change as a bond change. The honest toggle is the one the claim is about:
// the same seat, the same money, the same week, `listenClarity` poked to 0 so every coin FAILS and
// every row wears the standing ambiguous wording. Byte-identity of the whole bond series across THAT
// is the fence the spec means («bond untouched»), and it is a strictly stronger statement.

rule('§1c. «LEARNING TO LISTEN» – matched-reaction share by rung   [listenClarity = RULED, spec §2]')
console.log(`    prediction = the constants themselves: ${ECONOMY.psychologist.listenClarity.map((c) => c.toFixed(2)).join(' / ')}. The bar is the REALISED share inside its own`)
console.log(`    95% CI of that number, and the share monotone in rung.`)
console.log(`    the churn arm forces the arrival and ending hazards from week ${ELIGIBLE_FROM}, so the cooldown (${Object.values(ECONOMY.life.cooldownWeeks).join('/')} wk)`)
console.log(`    is what paces the beats. Every raise is the engine's; only the THRESHOLD is poked.`)
console.log('')

const LISTEN_TO = 400
interface ListenCell {
  temperament: Temperament
  arm: Arm
  readBearing: number
  stamped: number
  heard: number
  paid: number
  held: number
}
const listenCells: ListenCell[] = []
for (const t of TEMPERAMENTS) {
  for (const arm of ARMS) {
    const cell: ListenCell = { temperament: t, arm, readBearing: 0, stamped: 0, heard: 0, paid: 0, held: 0 }
    for (let i = 0; i < WALLS_CAREERS; i++) {
      const c = walk(`psy-listen-${i}`, t, {
        policy: CARING,
        focus: arm === null ? null : 'listen',
        rung: arm,
        weeks: LISTEN_TO,
        churn: true,
      })
      cell.readBearing += c.readBearing
      cell.stamped += c.heardStamped
      cell.heard += c.heardTrue
      cell.paid += c.paidWeeks
      cell.held += c.hireWeek >= 0 ? c.weeks - c.hireWeek : 0
    }
    listenCells.push(cell)
  }
}
{
  const seat = listenCells.filter((c) => c.arm !== null)
  if (seat.reduce((s, c) => s + c.stamped, 0) === 0) {
    stall('§1c: ZERO read-bearing rows carried a `heard` stamp in any seat arm', 'the listen coin was never reached – the churn produced no raise while he was working')
  }
  const noSeat = listenCells.filter((c) => c.arm === null).reduce((s, c) => s + c.stamped, 0)
  if (noSeat !== 0) {
    stall(`§1c: ${noSeat} rows carried a \`heard\` stamp with NO SEAT HIRED`, 'the stamp is supposed to be absent when nobody is teaching him to listen')
  }
}
console.log(
  `    ${pad('temperament', 12)}${pad('arm', 9)}${padL('rows raised', 13)}${padL('stamped', 9)}${padL('heard', 7)}${padL('realised', 10)}${padL('CI95 lo', 9)}${padL('CI95 hi', 9)}${padL('target', 8)}  verdict`,
)
for (const t of TEMPERAMENTS) {
  for (const arm of ARMS) {
    const cell = listenCells.find((c) => c.temperament === t && c.arm === arm)
    if (cell === undefined) throw new Error('missing cell')
    if (arm === null) {
      console.log(
        `    ${pad(t, 12)}${pad(armLabel(arm), 9)}${padL(String(cell.readBearing), 13)}${padL(String(cell.stamped), 9)}${padL(String(cell.heard), 7)}` +
          `${padL('–', 10)}${padL('–', 9)}${padL('–', 9)}${padL('–', 8)}  ← the control: no stamp, ever`,
      )
      continue
    }
    const target = ECONOMY.psychologist.listenClarity[arm]
    const realised = share(`§1c ${t}/${armLabel(arm)}`, cell.heard, cell.stamped, 1) / 100
    // ⚠ THE CI IS THE BINOMIAL ONE ON THE **TARGET**, not on the realised share: the question is «is
    //   a run of n coins at p=target consistent with what we saw», so the interval that decides it is
    //   the one the null hypothesis draws.
    const se = Math.sqrt((target * (1 - target)) / cell.stamped)
    // ⚠ CLAMPED TO [0, 1] IN BOTH THE TEST AND THE PRINT, never in one of the two. A share cannot
    //   exceed 1, so the normal approximation's tail above it is not a region the realised number can
    //   live in; clamping the printed interval while testing the unclamped one would show a reader a
    //   bar that is not the bar being applied.
    const lo = Math.max(0, target - 1.96 * se)
    const hi = Math.min(1, target + 1.96 * se)
    const ok = realised >= lo && realised <= hi
    const v = verdict(
      `§1c listen ${t} ${armLabel(arm)} realised clarity`,
      ok,
      `realised ${num(100 * realised, 1)}% outside the 95% CI [${num(100 * lo, 1)}%, ${num(100 * hi, 1)}%] of ${target} over n=${cell.stamped} – implicates ECONOMY.psychologist.listenClarity [${ECONOMY.psychologist.listenClarity.join(', ')}]`,
    )
    console.log(
      `    ${pad(t, 12)}${pad(armLabel(arm), 9)}${padL(String(cell.readBearing), 13)}${padL(String(cell.stamped), 9)}${padL(String(cell.heard), 7)}` +
        `${padL(pctS(100 * realised), 10)}${padL(pctS(100 * lo), 9)}${padL(pctS(100 * hi), 9)}${padL(target.toFixed(2), 8)}  ${v}`,
    )
  }
}
{
  // MONOTONICITY, pooled over the four temperaments – the spec's «matched-reaction share monotone».
  const pooled = RUNGS.map((r) => {
    const cells = listenCells.filter((c) => c.arm === r)
    const st = cells.reduce((s, c) => s + c.stamped, 0)
    const hd = cells.reduce((s, c) => s + c.heard, 0)
    return { r, st, hd, p: share(`§1c pooled rung ${r}`, hd, st, 1) }
  })
  const mono = pooled[0].p < pooled[1].p && pooled[1].p < pooled[2].p
  const v = verdict('§1c listen monotone in rung', mono, `pooled shares ${pooled.map((p) => pctS(p.p)).join(' / ')} are not strictly increasing`)
  console.log('')
  console.log(`    pooled over the four girls: ${pooled.map((p) => `rung ${p.r} ${pctS(p.p)} (n=${p.st})`).join(' · ')}   monotone ${v}`)
}
{
  // ⭐⭐⭐ THE BOND FENCE. Same seed, same seat, same rung, same money, same week – and the clarity
  //      table poked to 0 so every coin fails. The claim: the whole bond SERIES is byte-identical.
  //      ⚠ IT IS THE SERIES AND NOT THE FINAL VALUE, ruling K's own lesson one focus over: a terminal
  //      diff cannot see a career that took a different route to the same number.
  rule('§1c-bis. THE BOND FENCE – the clarity dial toggled, the bond series compared byte for byte')
  console.log('    !! THE CONTROL IS THE DIAL AND NOT THE HIRE, AND THAT IS A MEASURED CHOICE. Hiring moves')
  console.log('       `fundsCents`, the entry policy reads a reserve off the ledger, and the twin career then')
  console.log('       diverges – measured, 3 of 4 temperaments. «Hired vs not» prices the WALLET. The dial')
  console.log('       holds the money and toggles exactly the thing the claim is about: the wording.')
  console.log('')
  let pairs = 0
  let identical = 0
  let heardOn = 0
  let heardOff = 0
  const rows: string[] = []
  for (const t of TEMPERAMENTS) {
    for (let i = 0; i < Math.max(2, Math.round(WALLS_CAREERS / 2)); i++) {
      const seed = `psy-fence-${i}`
      PSY_DIAL.listenClarity = [...DIALS_SHIPPED.clarity]
      const on = walk(seed, t, { policy: CARING, focus: 'listen', rung: 1, weeks: LISTEN_TO, churn: true })
      PSY_DIAL.listenClarity = [0, 0, 0]
      const off = walk(seed, t, { policy: CARING, focus: 'listen', rung: 1, weeks: LISTEN_TO, churn: true })
      PSY_DIAL.listenClarity = [...DIALS_SHIPPED.clarity]
      pairs++
      heardOn += on.heardTrue
      heardOff += off.heardTrue
      const same =
        on.bondByWeek.length === off.bondByWeek.length && on.bondByWeek.every((b, k) => b === off.bondByWeek[k])
      if (same) identical++
      rows.push(
        `    ${pad(t, 12)}${pad(seed, 14)}${padL(String(on.weeks), 7)}${padL(String(on.readBearing), 13)}${padL(String(on.heardTrue), 11)}${padL(String(off.heardTrue), 12)}${padL(same ? 'yes' : '!! NO', 10)}`,
      )
    }
  }
  console.log(`    ${pad('temperament', 12)}${pad('seed', 14)}${padL('weeks', 7)}${padL('rows raised', 13)}${padL('heard on', 11)}${padL('heard off', 12)}${padL('bond ==', 10)}`)
  for (const r of rows) console.log(r)
  console.log('')
  // ⚠⚠ THE POSITIVE CONTROL, AND IT IS NOT A NICETY: two arms that produced the same wording would
  //    satisfy the equality trivially and prove nothing (CLAUDE.md, 17.08 – the byte-identical diff
  //    that was a thing compared with itself). The dial has to have DONE something.
  if (heardOn === 0) stall('§1c-bis: the clarity-on arm read NOTHING plainly', 'both arms wore the standing wording – the equality below is a thing compared with itself')
  if (heardOff !== 0) stall(`§1c-bis: the clarity-0 arm still read ${heardOff} rows plainly`, 'the dial did not reach the coin')
  const ok = identical === pairs
  const v = verdict('§1c-bis bond byte-identity across the listen toggle', ok, `${pairs - identical} of ${pairs} pairs moved bond – the focus is buying more than a wording`)
  console.log(`    pairs walked ${pairs} · bond series identical in ${identical}/${pairs}  ${v}`)
  console.log(`    positive control: the dial really toggled the wording – ${heardOn} rows read plainly ON, ${heardOff} OFF.`)
}

// =================================================================================================
// §1d. «WORKING ON HERSELF» – the anti-«hugged into an extravert» dam, and the flip ladder
// =================================================================================================
//
// ⚠⚠ THE HARD INVARIANT, NOT A CORRIDOR: beyond-baseline movement REQUIRES the focus. The CARING
// no-focus arm must show ZERO beyond-baseline flips and zero beyond-baseline weeks. who-she-is §2a:
// «without HER chosen work, her nature holds and only the relationship opens.» A single flip in that
// column is a design breach and not a tuning miss, and it is the only bar in this file whose failure
// would not be a ruling request.
//
// ⚠ RULING N DECIDES WHICH DIRECTION COUNTS. A flip is «the expressed pole on that axis is the
// opposite of birth», and each girl has exactly ONE armable direction per axis: a born-PRIVATE girl
// arms at +flipArm on `open` (her own work), a born-OPEN one at −flipArm (walls up). So a
// BEYOND-BASELINE flip is a flip on an axis where `growable(birth, axis)` – and a born-open girl's
// flip is a collapse, counted in the other column and never in this bar.

rule('§1d. «WORKING ON HERSELF» – beyond-baseline flips, and the dam   [walls constants = PROPOSALS]')
console.log(`    lean per week: rise ${ECONOMY.life.walls.risePerWeek} (kicked) · repair ${ECONOMY.life.walls.repairPerWeek} (cared for) · growth ${ECONOMY.life.walls.growthPerWeek} (focus + cared for)`)
console.log(`    arms at ±${ECONOMY.life.walls.flipArm}, releases at ±${ECONOMY.life.walls.flipRelease}, hazard ${ECONOMY.life.walls.flipHazardPerWeek}/wk × the rung scale [${ECONOMY.psychologist.wallsHazardScale.join(', ')}] (beyond-baseline only)`)
console.log(`    PREDICTION: the caring NO-FOCUS arm shows ZERO beyond-baseline weeks and ZERO beyond-baseline flips.`)
console.log(`    PREDICTION: flip medians monotone in rung – the hazard scale is ruled ×1/×1.5/×2.`)
console.log('')

interface HerselfCell {
  temperament: Temperament
  arm: Arm
  beyondFlips: number[]
  collapseFlips: number[]
  beyondWeeks: number[]
  armWeek: number[]
  focusRefusals: number
  focusSet: number
  n: number
  /** ⭐⭐⭐ THE WEEKS AN AXIS SPENT **ARMED** BEFORE THE FLIP FIRED – one observation per growable axis
   *  that both armed and fired. ⚠⚠ THIS IS WHERE THE RUNG SCALE ACTUALLY LIVES, and the flip COUNT is
   *  not: the lean saturates at ±`leanMax` and then sits armed for hundreds of weeks, so at every
   *  rung the flip is a near-certainty and the count is capped by how many growable axes the girl has
   *  (one for fiery and quiet, two for deep, NONE for sunny). What ×1/×1.5/×2 buys is the WAIT. */
  armedWeeks: number[]
  paid: number
  idle: number
  observedIdle: number
  held: number
  /** ⚠ THE NO-SEAT ARM'S CAREERS ARE RETAINED FOR §4, which needs exactly them: a walked career under
   *  the caring policy with nobody hired. Re-walking twenty of them for the elite-gate line would be
   *  twenty careers of machine time spent on a world this grid already has. */
  keep: Career[]
}
const herselfCells: HerselfCell[] = []
for (const t of TEMPERAMENTS) {
  for (const arm of ARMS) {
    const cell: HerselfCell = {
      temperament: t,
      arm,
      beyondFlips: [],
      collapseFlips: [],
      beyondWeeks: [],
      armWeek: [],
      focusRefusals: 0,
      focusSet: 0,
      n: 0,
      armedWeeks: [],
      paid: 0,
      idle: 0,
      observedIdle: 0,
      held: 0,
      keep: [],
    }
    for (let i = 0; i < WALLS_CAREERS; i++) {
      const c = walk(`psy-self-${i}`, t, { policy: CARING, focus: arm === null ? null : 'herself', rung: arm, weeks: WEEKS })
      cell.n++
      cell.paid += c.paidWeeks
      cell.idle += c.idleWeeks
      cell.observedIdle += c.observedIdle
      cell.held += c.hireWeek >= 0 ? c.weeks - c.hireWeek : 0
      if (arm === null) cell.keep.push(c)
      if (c.focusWeek >= 0) cell.focusSet++
      cell.focusRefusals += c.focusRefusals
      const beyond = WALLS_AXES.filter((ax) => growable(t, ax)).reduce((s, ax) => s + c.flipsUp[ax], 0)
      const collapse = WALLS_AXES.filter((ax) => !growable(t, ax)).reduce((s, ax) => s + c.flipsUp[ax], 0)
      cell.beyondFlips.push(beyond)
      cell.collapseFlips.push(collapse)
      cell.beyondWeeks.push(c.beyondWeeks)
      // the week the FIRST beyond-baseline flip fired, or the horizon – a median over «never» would
      // be a median of a censored column, so «never» is printed as its own count instead.
      let first = -1
      for (let w = 0; w < c.flippedByWeek.length && first < 0; w++) {
        const f = c.flippedByWeek[w]
        if (f !== undefined && WALLS_AXES.some((ax) => growable(t, ax) && f[ax])) first = w
      }
      if (first >= 0) cell.armWeek.push(first)
      // ⚠ THE ARMED WAIT, PER GROWABLE AXIS, READ OFF THE LEAN SERIES THE ENGINE WROTE. `toward` is
      //   ruling N's signed reading – the lean measured in the direction birth left open – and the
      //   axis is armed from the first week it reaches `flipArm`. The wait ends the week
      //   `wallsFlipped` toggles, which is the draw this ladder is about.
      for (const ax of WALLS_AXES) {
        if (!growable(t, ax)) continue
        let armedAt = -1
        for (let w = 0; w < c.leanByWeek.length; w++) {
          const lean = c.leanByWeek[w]
          const flipped = c.flippedByWeek[w]
          if (lean === undefined || flipped === undefined) continue
          if (armedAt < 0 && lean[ax] >= ECONOMY.life.walls.flipArm) armedAt = w
          if (armedAt >= 0 && flipped[ax]) {
            cell.armedWeeks.push(w - armedAt)
            break
          }
        }
      }
    }
    herselfCells.push(cell)
  }
}
{
  const seat = herselfCells.filter((c) => c.arm !== null)
  if (seat.reduce((s, c) => s + c.beyondFlips.reduce((a, b) => a + b, 0), 0) === 0) {
    stall('§1d: ZERO beyond-baseline flips in ANY seat arm', 'the growth branch never fired – nothing below can separate the rungs')
  }
  if (seat.reduce((s, c) => s + c.beyondWeeks.reduce((a, b) => a + b, 0), 0) === 0) {
    stall('§1d: ZERO beyond-baseline WEEKS in any seat arm', 'the lean never went positive – the arm cannot reach its subject')
  }
}
console.log(
  `    ${pad('temperament', 12)}${pad('arm', 9)}${padL('n', 4)}${padL('focus set', 11)}${padL('beyond wks', 12)}${padL('beyond flips', 14)}${padL('median', 8)}${padL('mean', 8)}${padL('SEM', 7)}${padL('1st flip wk', 13)}${padL('collapses', 11)}  verdict`,
)
for (const t of TEMPERAMENTS) {
  for (const arm of ARMS) {
    const cell = herselfCells.find((c) => c.temperament === t && c.arm === arm)
    if (cell === undefined) throw new Error('missing cell')
    const flips = sample(`§1d ${t}/${armLabel(arm)} flips`, cell.beyondFlips, 1)
    // ⚠ TAKEN THROUGH `sample()` EVEN THOUGH ONLY ITS TOTAL IS PRINTED: the guard is what makes «zero
    //   beyond-baseline weeks» impossible to confuse with «no careers in this cell», which is the
    //   whole difference between the dam holding and the arm being empty.
    sample(`§1d ${t}/${armLabel(arm)} weeks`, cell.beyondWeeks, 1)
    const totalFlips = cell.beyondFlips.reduce((a, b) => a + b, 0)
    const totalBeyond = cell.beyondWeeks.reduce((a, b) => a + b, 0)
    let v = '    '
    if (arm === null) {
      // THE DAM. A hard invariant: zero, exactly.
      const ok = totalFlips === 0 && totalBeyond === 0
      v = verdict(
        `§1d the anti-«hugged into an extravert» dam (${t}, caring, NO focus)`,
        ok,
        `${totalFlips} beyond-baseline flips and ${totalBeyond} beyond-baseline weeks with no focus held – this is a DESIGN BREACH (who-she-is §2a), not a constant`,
      )
    }
    console.log(
      `    ${pad(t, 12)}${pad(armLabel(arm), 9)}${padL(String(cell.n), 4)}${padL(`${cell.focusSet}/${cell.n}`, 11)}${padL(String(totalBeyond), 12)}${padL(String(totalFlips), 14)}` +
        `${padL(num(med(flips), 1), 8)}${padL(num(avg(flips), 3), 8)}${padL(num(sem(flips), 3), 7)}` +
        `${padL(cell.armWeek.length > 0 ? num(median([...cell.armWeek]), 0) : '–', 13)}${padL(String(cell.collapseFlips.reduce((a, b) => a + b, 0)), 11)}  ${v}`,
    )
  }
}
{
  // THE LADDER, pooled: flip counts monotone in rung. ⚠ POOLED BECAUSE THE PER-GIRL COLUMNS ARE
  // SPARSE BY CONSTRUCTION – two of the four girls have only ONE growable axis and the other two
  // have two, so a per-temperament median over a handful of careers is mostly the axis count.
  const pooled = RUNGS.map((r) => {
    const xs = herselfCells.filter((c) => c.arm === r).flatMap((c) => c.beyondFlips)
    return { r, s: sample(`§1d pooled rung ${r}`, xs, 1) }
  })
  console.log('')
  console.log(
    `    pooled flips/career : ${pooled.map((p) => `rung ${p.r} mean ${num(avg(p.s), 3)} ± ${num(sem(p.s), 3)} (n=${p.s.xs.length})`).join(' · ')}`,
  )
  for (const k of [1, 2] as const) {
    const lo = pooled[k - 1]
    const hi = pooled[k]
    const d = avg(hi.s) - avg(lo.s)
    const se = Math.sqrt(sem(hi.s) ** 2 + sem(lo.s) ** 2)
    const ok = d > 0
    const v = verdict(
      `§1d herself rung ${k} vs rung ${k - 1} flip count`,
      ok,
      `mean flips ${num(avg(lo.s), 3)} → ${num(avg(hi.s), 3)} (Δ ${num(d, 3)} ± ${num(se, 3)}) is not monotone – implicates ECONOMY.psychologist.wallsHazardScale [${ECONOMY.psychologist.wallsHazardScale.join(', ')}] and ECONOMY.life.walls.flipHazardPerWeek ${ECONOMY.life.walls.flipHazardPerWeek}`,
    )
    console.log(`    rung ${k - 1} → ${k}         : Δ ${num(d, 3)} ± ${num(se, 3)} flips/career   ${v}`)
  }
  const refused = herselfCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.focusRefusals, 0)
  console.log(`    focus refusals      : ${refused} (the consent gates – «she is not ready» at a strained/cold bond, and the 18+ joint decline)`)
}
{
  // ⭐⭐⭐ THE LADDER THE RUNG SCALE ACTUALLY MOVES – THE ARMED WAIT, not the flip count.
  // ⚠⚠ PREDICTED FROM THE ENGINE'S OWN HAZARD: an armed axis-week fires with p = `flipHazardPerWeek ×
  //    wallsHazardScale[rung]`, so the wait is geometric and its median is `ln 0.5 / ln(1 − p)`. That
  //    is a closed form over two shipped constants and is not read off this run.
  console.log('')
  console.log('    THE ARMED WAIT – weeks between an axis reaching `flipArm` and the flip firing.')
  console.log('    !! THE FLIP COUNT ABOVE CANNOT RANK THE RUNGS AND THIS IS WHY: the lean saturates at ±leanMax')
  console.log('       and then sits armed for HUNDREDS of weeks, so at every rung the flip is a near-certainty and')
  console.log('       the count is capped by how many growable axes she has. The rung buys the WAIT.')
  console.log('')
  console.log(`    ${pad('rung', 10)}${padL('hazard/wk', 11)}${padL('predicted median', 18)}${padL('n', 6)}${padL('median', 9)}${padL('mean', 9)}${padL('SEM', 8)}  verdict`)
  const waits = RUNGS.map((r) => {
    const xs = herselfCells.filter((c) => c.arm === r).flatMap((c) => c.armedWeeks)
    const p = ECONOMY.life.walls.flipHazardPerWeek * (ECONOMY.psychologist.wallsHazardScale[r] ?? 1)
    return { r, p, predicted: Math.log(0.5) / Math.log(1 - p), s: sample(`§1d armed wait rung ${r}`, xs, 1) }
  })
  for (const w of waits) {
    let v = '    '
    if (w.r > 0) {
      const lo = waits[w.r - 1]
      const d = avg(w.s) - avg(lo.s)
      const se = Math.sqrt(sem(w.s) ** 2 + sem(lo.s) ** 2)
      const ok = d < 0
      v = verdict(
        `§1d herself armed wait rung ${w.r} vs rung ${w.r - 1}`,
        ok,
        `mean wait ${num(avg(lo.s), 2)} → ${num(avg(w.s), 2)} weeks (Δ ${num(d, 2)} ± ${num(se, 2)}) is not shorter – implicates ECONOMY.psychologist.wallsHazardScale [${ECONOMY.psychologist.wallsHazardScale.join(', ')}]`,
      )
    }
    console.log(
      `    ${pad(`rung ${w.r}`, 10)}${padL(num(w.p, 4), 11)}${padL(num(w.predicted, 1), 18)}${padL(String(w.s.xs.length), 6)}${padL(num(med(w.s), 1), 9)}${padL(num(avg(w.s), 2), 9)}${padL(num(sem(w.s), 2), 8)}  ${v}`,
    )
  }
  console.log('')
  const sunny = herselfCells.filter((c) => c.temperament === 'sunny' && c.arm !== null)
  const sunnyBeyond = sunny.reduce((a, c) => a + c.beyondWeeks.reduce((x, y) => x + y, 0), 0)
  console.log('    !! AND ONE GIRL IN FOUR CAN NEVER BUY THIS FOCUS AT ALL, which is the finding this section')
  console.log(`       exists to surface. A SUNNY girl is born open AND steady, so ruling N clamps her positive lean`)
  console.log(`       at 0 on BOTH axes – she has nowhere to grow. Measured on this grid: ${sunnyBeyond} beyond-baseline weeks`)
  console.log('       across every sunny seat arm at every rung. The spec §5 says «the drift focus only means')
  console.log('       anything where a leaning has room to move», so this is the design – but a quarter of the')
  console.log('       roster paying a retainer for a year that can buy NOTHING is §2\'s corridor at its sharpest,')
  console.log('       and the card does not say so. REPORTED, not fixed.')
}

// =================================================================================================
// §1e. RULING M's FOURTH NUMBER – O6's ×0.75 against the tenths grid
// =================================================================================================
//
// ⚠⚠ THE PREDICTION IS ≈ ×0.733 AND NOT ×0.75, AND IT IS ARITHMETIC RATHER THAN A DEFECT. The lean is
// stored to ONE DECIMAL (`roundTenth`, spirit's own grid one concept over), so a slowed kicked week
// moves the lean by `roundTenth(risePerWeek × wallsRetentionSlow) = roundTenth(1.125) = 1.1` and the
// REALISED slow-down is 1.1 / 1.5 = 0.7333. Predicting 0.75 would report a correct implementation as
// a miss – ruling M's lesson, one focus over.
//
// ⚠ THE ARM IS A GRINDING CAREER WITH A RETAINED SEAT AT RUNG ≥ 2, ANY FOCUS (O6 is what the RETAINER
// buys and must not read `psychologistFocus`), against the same career with no seat. The measurement
// is the per-week lean STEP on kicked weeks, off the world's own numbers, and the clamped weeks are
// excluded – at ±`leanMax` the step is whatever is left of the gap and is not the rise.

rule('§1e. O6 – the retained seat slows the RISE, and the tenths grid eats part of it   [×0.75 = PROPOSAL]')
const O6_PREDICTED = Math.round(ECONOMY.life.walls.risePerWeek * ECONOMY.psychologist.wallsRetentionSlow * 10) / 10 / ECONOMY.life.walls.risePerWeek
/** ⚠⚠ THE WEEK THE PARENT TURNS, AND THE ARM CANNOT BE MEASURED WITHOUT IT – MEASURED, NOT PREFERRED.
 *  A plain grinding arm reports ×1.0000 with the two columns IDENTICAL TO FOUR DECIMALS, and that is
 *  the «two arms that moved together» family rather than a null result: under `grinder` the bond is
 *  already kicked in the first season, the lean reaches −`leanMax` in about 67 weeks, and the pro gate
 *  that unlocks the seat opens LATER THAN THAT – so every unsaturated kicked week in the career
 *  happens before there is anybody to pay, and the slowed weeks the arm is looking for do not exist.
 *  The fix is the parent who HIRES HIM AND THEN STARTS KICKING, which is also the sentence O6 is for
 *  («a good psychologist in the house makes the walls rise slower»): caring to this week – long
 *  enough to clear the gate and hire – and grinding after it, in BOTH arms. */
const O6_TURN = 200
let o6Collapses = 0
{
  /** The mean lean step on an unclamped kicked week. ⚠ MEASURED OFF THE LEAN SERIES rather than
   *  re-derived: the subject is what the engine actually did to `world.wallsLean`, and a bench that
   *  recomputed the branch would be checking its own copy of `driftWalls`. ⚠ AND IT IS CUT ON WEEKS
   *  THE SEAT WAS ACTUALLY WORKING, because O6 rides the billing predicate – a stood-down week is a
   *  ×1 week and pooling it would dilute the very multiplier being priced. */
  function riseSteps(c: Career, fromWeek: number): number[] {
    const out: number[] = []
    const max = ECONOMY.life.walls.leanMax
    for (let w = Math.max(1, fromWeek); w < c.leanByWeek.length; w++) {
      const now = c.leanByWeek[w]
      const before = c.leanByWeek[w - 1]
      const band = c.bondByWeek[w - 1]
      if (now === undefined || before === undefined || band === undefined) continue
      const kicked = bondBandOf(band) === 'strained' || bondBandOf(band) === 'cold'
      if (!kicked) continue
      for (const ax of WALLS_AXES) {
        // ⚠ the clamp weeks are not the rise: at −leanMax the step is whatever is left of the gap.
        if (before[ax] <= -max + ECONOMY.life.walls.risePerWeek + 0.05) continue
        const step = before[ax] - now[ax]
        if (step > 0) out.push(step)
      }
    }
    return out
  }
  const bare: number[] = []
  const retained: number[] = []
  let retainedCareers = 0
  let retainedHired = 0
  let hiredBeforeTurn = 0
  for (const t of TEMPERAMENTS) {
    for (let i = 0; i < Math.max(2, Math.round(WALLS_CAREERS / 2)); i++) {
      const seed = `psy-o6-${i}`
      const schedule = { policy: CARING, policyAfter: { week: O6_TURN, policy: GRINDING }, weeks: WEEKS }
      const a = walk(seed, t, { ...schedule, focus: null, rung: null })
      // ⚠ THE FOCUS IS `'coolhead'` AND NOT `'herself'` ON PURPOSE: at a strained/cold bond the engine
      //   REFUSES `'herself'` («she is not ready»), so a grinding arm that asked for it would hold no
      //   focus at all – and O6 is what the RETAINER buys, at any focus, by its own ruling. The pick
      //   is made before the turn, while the bond is still a care band.
      const b = walk(seed, t, { ...schedule, focus: 'coolhead', rung: 2 })
      retainedCareers++
      if (b.hireWeek >= 0) retainedHired++
      if (b.hireWeek >= 0 && b.hireWeek < O6_TURN) hiredBeforeTurn++
      o6Collapses += WALLS_AXES.filter((ax) => !growable(t, ax)).reduce((x, ax) => x + a.flipsUp[ax] + b.flipsUp[ax], 0)
      bare.push(...riseSteps(a, O6_TURN))
      retained.push(...riseSteps(b, O6_TURN))
    }
  }
  if (retainedHired === 0) stall('§1e: the retained arm never hired', 'the pro gate never opened before the turn – O6 cannot be measured on this arm')
  if (hiredBeforeTurn === 0) {
    stall(`§1e: no career hired before the turn at week ${O6_TURN}`, 'every measured kicked week is a week with nobody on the payroll – the two arms are one arm')
  }
  const sBare = sample('§1e bare rise steps', bare, 2)
  const sRet = sample('§1e retained rise steps', retained, 2)
  const realised = avg(sRet) / avg(sBare)
  // ⚠⚠ THE POSITIVE CONTROL FOR THIS ARM, and it is the one §1e's first draft did not have: if the
  //    two step lists are IDENTICAL the ratio is 1.0000 and reads as «the constant does nothing»,
  //    which is indistinguishable from «the arm never contained the constant». They must differ.
  const identical = sBare.xs.length === sRet.xs.length && sBare.xs.every((x, k) => x === sRet.xs[k])
  if (identical) {
    stall('§1e: the two step lists are byte-identical', 'the retained arm contains no slowed week – the ratio below would be 1.0000 by construction (CLAUDE.md, 17.08)')
  }
  const ok = Math.abs(realised - O6_PREDICTED) < 0.02
  const v = verdict(
    '§1e O6 realised slow-down',
    ok,
    `realised ×${num(realised, 4)} against the predicted ×${num(O6_PREDICTED, 4)} – implicates ECONOMY.psychologist.wallsRetentionSlow ${ECONOMY.psychologist.wallsRetentionSlow} and ECONOMY.life.walls.risePerWeek ${ECONOMY.life.walls.risePerWeek}`,
  )
  console.log(`    the constant is ×${ECONOMY.psychologist.wallsRetentionSlow}; the lean's tenths grid turns ${ECONOMY.life.walls.risePerWeek} × ${ECONOMY.psychologist.wallsRetentionSlow} = ${(ECONOMY.life.walls.risePerWeek * ECONOMY.psychologist.wallsRetentionSlow).toFixed(3)} into ${(Math.round(ECONOMY.life.walls.risePerWeek * ECONOMY.psychologist.wallsRetentionSlow * 10) / 10).toFixed(1)},`)
  console.log(`    so the PREDICTED realised slow-down is ×${O6_PREDICTED.toFixed(4)} (ruling M's fourth number), never ×${ECONOMY.psychologist.wallsRetentionSlow}.`)
  console.log(`    THE ARM: '${CARING.label}' to week ${O6_TURN} – long enough to clear the pro gate and hire – then '${GRINDING.label}' in BOTH columns.`)
  console.log('    !! A PLAIN GRINDING ARM CANNOT MEASURE THIS AND THE FIRST DRAFT OF THIS SECTION PROVED IT: two')
  console.log('       columns IDENTICAL TO FOUR DECIMALS and a ratio of exactly ×1.0000, because the walls saturate')
  console.log('       at ±leanMax about 67 kicked weeks in and the pro gate opens later than that. Every unsaturated')
  console.log('       kicked week happened before there was anybody to pay. That is the «two arms moved together»')
  console.log('       family, not a null result, and the schedule above is the repair.')
  console.log('')
  console.log(`    ${pad('arm', 30)}${padL('kicked axis-weeks', 19)}${padL('mean step', 11)}${padL('SEM', 9)}`)
  console.log(`    ${pad(`turned, no seat`, 30)}${padL(String(sBare.xs.length), 19)}${padL(num(avg(sBare), 4), 11)}${padL(num(sem(sBare), 4), 9)}`)
  console.log(`    ${pad(`turned, rung 2 held`, 30)}${padL(String(sRet.xs.length), 19)}${padL(num(avg(sRet), 4), 11)}${padL(num(sem(sRet), 4), 9)}`)
  console.log('')
  console.log(`    realised slow-down  : ×${num(realised, 4)}   predicted ×${num(O6_PREDICTED, 4)}   ${v}`)
  console.log(`    retained arms hired : ${retainedHired}/${retainedCareers} (${hiredBeforeTurn} before the turn)   ← a family that never reaches the pro gate buys nothing`)
  console.log(`    walls-UP flips seen : ${o6Collapses}   ← the collapse direction, which no CARING arm in this file can produce`)
}

// =================================================================================================
// §1f. THE FIFTH CELL – `'herself'` repair ×1.5, the one §4 number T10 shipped unpriced
// =================================================================================================
//
// Commissioned 14.09 by the owner («делаем, ждем числа») on the handoff's own debt row: «pricing it
// needs an arm that holds `'herself'` against a caring no-focus twin over a repair walk – a fifth
// grid cell». The schedule is §1e's INVERTED: grinding to the turn – deep walls, the pro gate
// cleared, the seat hired – then caring in BOTH columns, which is the sentence the multiplier is
// for: the parent who came back, with and without the year of work.
//
// ⚠ THE PREDICTION IS ×1.5000 EXACTLY, AND THE TENTHS GRID DOES NOT BITE HERE – ruling M's family
// check run BEFORE the measurement rather than after a miss: `roundTenth(repairPerWeek ×
// wallsHerselfRepair) = roundTenth(1.5) = 1.5`, so unlike O6's ×0.7333 the realised and the
// constant coincide. A measured value off 1.5000 implicates the branch, never the grid.
//
// ⚠ THE FOCUS LANDS LATE AND THE CUT KNOWS IT: `'herself'` is refused at a strained/cold bond
// («she is not ready»), so the arm's focus takes only once the caring phase has walked the bond
// back to `steady` – `focusRefusals` counts the refusals and the step cut starts at `focusWeek`,
// on weeks the seat was WORKING (`workingByWeek`, the billing predicate O6 already rides).
rule(`§1f. THE FIFTH CELL – 'herself' repair acceleration   [×${ECONOMY.psychologist.wallsHerselfRepair} = PROPOSAL, the last unpriced §4 number]`)
{
  const R_TURN = 156
  /** The mean lean step on an unclamped REPAIR week – §1e's `riseSteps`, run up the other slope:
   *  caring band, a negative lean walking home, the final clip into 0 excluded (there the step is
   *  whatever is left of the gap, not the rate). */
  function repairSteps(c: Career, since: number, requireWorking: boolean): number[] {
    const out: number[] = []
    const clip = ECONOMY.life.walls.repairPerWeek * ECONOMY.psychologist.wallsHerselfRepair + 0.05
    for (let w = Math.max(1, since); w < c.leanByWeek.length; w++) {
      const now = c.leanByWeek[w]
      const before = c.leanByWeek[w - 1]
      const band = c.bondByWeek[w - 1]
      if (now === undefined || before === undefined || band === undefined) continue
      const caring = bondBandOf(band) === 'steady' || bondBandOf(band) === 'close'
      if (!caring) continue
      if (requireWorking && c.workingByWeek[w] !== true) continue
      for (const ax of WALLS_AXES) {
        if (before[ax] >= -clip) continue
        const step = now[ax] - before[ax]
        if (step > 0) out.push(step)
      }
    }
    return out
  }
  /** Weeks from the turn until BOTH leans are home at 0 – the corridor the cap was sized for. */
  function weeksHome(c: Career): number | null {
    for (let w = R_TURN; w < c.leanByWeek.length; w++) {
      const lean = c.leanByWeek[w]
      if (lean !== undefined && lean.open >= 0 && lean.reg >= 0) return w - R_TURN
    }
    return null
  }
  const bare: number[] = []
  const held: number[] = []
  const homeBare: number[] = []
  const homeHeld: number[] = []
  const sunnySaved: number[] = []
  let focusLanded = 0
  let armCareers = 0
  for (const t of TEMPERAMENTS) {
    const homeB: number[] = []
    const homeH: number[] = []
    for (let i = 0; i < Math.max(2, Math.round(WALLS_CAREERS / 2)); i++) {
      const seed = `psy-repair-${i}`
      const schedule = { policy: GRINDING, policyAfter: { week: R_TURN, policy: CARING }, weeks: WEEKS }
      const a = walk(seed, t, { ...schedule, focus: null, rung: null })
      const b = walk(seed, t, { ...schedule, focus: 'herself', rung: 1 })
      armCareers++
      if (b.focusWeek >= 0) focusLanded++
      bare.push(...repairSteps(a, R_TURN, false))
      if (b.focusWeek >= 0) held.push(...repairSteps(b, b.focusWeek, true))
      const hA = weeksHome(a)
      const hB = weeksHome(b)
      if (hA !== null) { homeBare.push(hA); homeB.push(hA) }
      if (hB !== null) { homeHeld.push(hB); homeH.push(hB) }
    }
    if (t === 'sunny' && homeB.length > 0 && homeH.length > 0) {
      sunnySaved.push(med(sample('§1f sunny bare', homeB)) - med(sample('§1f sunny held', homeH)))
    }
  }
  if (held.length === 0) {
    stall('§1f: ZERO worked repair weeks in the focus arm', 'the focus never landed or the seat never worked a caring week – the cell cannot reach its subject')
  }
  const sBare = sample('§1f repair step, no focus', bare, 30)
  const sHeld = sample('§1f repair step, herself held', held, 30)
  const realised = avg(sHeld) / avg(sBare)
  const PREDICTED = ECONOMY.psychologist.wallsHerselfRepair
  const ok = Math.abs(realised - PREDICTED) < 0.02
  const v = verdict(
    '§1f herself repair acceleration',
    ok,
    `realised ×${num(realised, 4)} against the predicted ×${num(PREDICTED, 4)} – implicates ECONOMY.psychologist.wallsHerselfRepair ${PREDICTED} and ECONOMY.life.walls.repairPerWeek ${ECONOMY.life.walls.repairPerWeek}`,
  )
  console.log(`    THE ARM: '${GRINDING.label}' to week ${R_TURN} – deep walls, the gate cleared – then '${CARING.label}' in BOTH columns;`)
  console.log(`    the focus lands only once the bond is back at steady (refused «not ready» until then), and the cut starts there.`)
  console.log('')
  console.log(`    ${pad('arm', 30)}${padL('repair axis-weeks', 19)}${padL('mean step', 11)}${padL('SEM', 9)}`)
  console.log(`    ${pad('turned back, no seat', 30)}${padL(String(sBare.xs.length), 19)}${padL(num(avg(sBare), 4), 11)}${padL(num(sem(sBare), 4), 9)}`)
  console.log(`    ${pad('turned back, herself held', 30)}${padL(String(sHeld.xs.length), 19)}${padL(num(avg(sHeld), 4), 11)}${padL(num(sem(sHeld), 4), 9)}`)
  console.log('')
  console.log(`    realised acceleration : ×${num(realised, 4)}   predicted ×${num(PREDICTED, 4)}   ${v}`)
  console.log(`    weeks home (median)   : ${homeBare.length ? num(med(sample('§1f home bare', homeBare)), 1) : '–'} bare vs ${homeHeld.length ? num(med(sample('§1f home held', homeHeld)), 1) : '–'} held  (from the turn, both leans back at 0)`)
  console.log(`    focus landed          : ${focusLanded}/${armCareers} careers  ← «not ready» holds it out until the bond is back at steady`)
  if (sunnySaved.length > 0) {
    console.log(`    !! QUESTION 4's NUMBER (the sunny girl): a KICKED sunny career saves a median ${num(sunnySaved[0], 1)} weeks of the`)
    console.log(`       walk home with the year held – the focus's real product for the quarter of the roster with no growable axis.`)
  }
}

rule('§2. THE NEVER-FIRED CORRIDOR – paid weeks with nothing to do, per focus (rung 1, the default)')
console.log('    the spec §4 predicts the SHAPE: «cool head and the drift focus do slow work every held week,')
console.log('    so never-fired is mostly the recovery focus\'s exposure». That is the prediction; below is the number.')
console.log('')
console.log('    !! THREE OF THE FOUR ROWS ARE FOLDED OFF THE SAME RUNS §1 READ, not off a second grid – so the')
console.log('       corridor and the ladder cannot come to disagree about what a paid week was. Cool head needs a')
console.log('       WHOLE career (§1b stops a season after the hire) and has its own small grid, marked below.')
console.log('')
{
  interface Corridor {
    focus: PsyFocus
    paid: number
    idle: number
    held: number
    note: string
  }
  const corridors: Corridor[] = []
  const perTemperament: string[] = []

  function push(focus: PsyFocus, t: Temperament, paid: number, idle: number, held: number): void {
    perTemperament.push(
      `    ${pad(focus, 10)}${pad(t, 12)}${padL(String(paid), 10)}${padL(pctS(paid === 0 ? Number.NaN : (100 * idle) / paid), 13)}` +
        `${padL(pctS(held === 0 ? Number.NaN : (100 * (held - paid)) / held), 14)}`,
    )
  }

  // --- recovery, off §1a's rung-1 arm ------------------------------------------------------------
  {
    let paid = 0
    let idle = 0
    let held = 0
    for (const t of TEMPERAMENTS) {
      const cell = recoveryCells.find((c) => c.temperament === t && c.arm === 1)
      if (cell === undefined) throw new Error('missing recovery cell')
      push('recovery', t, cell.paid, cell.idle, cell.held)
      paid += cell.paid
      idle += cell.idle
      held += cell.held
    }
    corridors.push({ focus: 'recovery', paid, idle, held, note: '§1a\'s runs – TWO forced shocks in a career' })
  }
  // --- listen, off §1c's rung-1 arm --------------------------------------------------------------
  {
    let paid = 0
    let idle = 0
    let held = 0
    for (const t of TEMPERAMENTS) {
      const cell = listenCells.find((c) => c.temperament === t && c.arm === 1)
      if (cell === undefined) throw new Error('missing listen cell')
      // ⚠ THE LISTEN CORRIDOR IS THE ONE THAT CANNOT BE ASKED BEFORE THE TICK: the raise happens
      //   inside it. A paid week «fired» iff a read-bearing row was STAMPED on it, which is exactly
      //   «the coin was reached», so the idle count is the paid weeks minus the stamped rows.
      const cellIdle = Math.max(0, cell.paid - cell.stamped)
      push('listen', t, cell.paid, cellIdle, cell.held)
      paid += cell.paid
      idle += cellIdle
      held += cell.held
    }
    corridors.push({ focus: 'listen', paid, idle, held, note: '§1c\'s runs – the CHURN arm, i.e. the most generous case' })
  }
  // --- herself, off §1d's rung-1 arm -------------------------------------------------------------
  {
    let paid = 0
    let idle = 0
    let observed = 0
    let held = 0
    for (const t of TEMPERAMENTS) {
      const cell = herselfCells.find((c) => c.temperament === t && c.arm === 1)
      if (cell === undefined) throw new Error('missing herself cell')
      push('herself', t, cell.paid, cell.idle, cell.held)
      paid += cell.paid
      idle += cell.idle
      observed += cell.observedIdle
      held += cell.held
    }
    corridors.push({ focus: 'herself', paid, idle, held, note: '§1d\'s runs' })
    console.log(`    !! THE \`'herself'\` ROW CARRIES ITS OWN CROSS-CHECK: the state read (${pctS(share('§2 herself state', idle, paid, 1))}) against the`)
    console.log(`       lean's own transition (${pctS(share('§2 herself observed', observed, paid, 1))}). The two ask the same question from opposite ends – a`)
    console.log('       branch table read off the world, and what the accumulator actually did – and a gap between')
    console.log('       them would mean one of the two is wrong about what the focus bought.')
    console.log('')
  }
  // --- cool head, its own small grid: §1b's walk stops a season after the hire -------------------
  {
    let paid = 0
    let idle = 0
    let held = 0
    for (const t of TEMPERAMENTS) {
      let p = 0
      let d = 0
      let h = 0
      for (let i = 0; i < Math.max(2, Math.round(WALLS_CAREERS / 2)); i++) {
        const c = walk(`psy-corr-cool-${i}`, t, { policy: CARING, focus: 'coolhead', rung: 1, weeks: WEEKS })
        p += c.paidWeeks
        d += c.idleWeeks
        h += c.hireWeek >= 0 ? c.weeks - c.hireWeek : 0
      }
      push('coolhead', t, p, d, h)
      paid += p
      idle += d
      held += h
    }
    corridors.push({ focus: 'coolhead', paid, idle, held, note: 'its own whole-career grid – idle = AT THE CEILING (ruling M)' })
  }

  console.log(`    ${pad('focus', 10)}${pad('temperament', 12)}${padL('paid wks', 10)}${padL('never fired', 13)}${padL('stood down', 14)}`)
  for (const r of perTemperament) console.log(r)
  console.log('')
  console.log(`    ${pad('focus', 10)}${pad('POOLED', 12)}${padL('paid wks', 10)}${padL('never fired', 13)}${padL('stood down', 14)}   what it is measured on`)
  for (const r of corridors) {
    const idlePct = share(`§2 ${r.focus} corridor`, r.idle, r.paid, 1)
    console.log(
      `    ${pad(r.focus, 10)}${pad('', 12)}${padL(String(r.paid), 10)}${padL(pctS(idlePct), 13)}` +
        `${padL(pctS(r.held === 0 ? Number.NaN : (100 * (r.held - r.paid)) / r.held), 14)}   ${r.note}`,
    )
  }
  console.log('')
  console.log('    !! «STOOD DOWN» IS NOT «NEVER FIRED». A suspended week charges nothing (the masseur\'s own')
  console.log('       stand-down pair), so it is OUTSIDE the corridor\'s denominator and inside this column – and it')
  console.log('       is large, which is a fact about the seat the owner has not been told yet.')
  console.log('    !! NO BAR IS DRAWN HERE. The spec asks for the number PRINTED; what corridor is acceptable is the')
  console.log('       owner\'s ruling and not a bench\'s, and inventing one would be the defect ruling S names.')
}

// =================================================================================================
// §3. T12's LINE, CORRECTED BY RULING S
// =================================================================================================
//
// ⚠⚠ RULING H ASKED FOR A BAR THAT CANNOT BE MET AS WRITTEN: «profile labels partition the existing
// axes with no two profiles identical on all shown axes». A FOUR-VALUED LABEL CANNOT PARTITION
// SIXTEEN PEOPLE. Ruling S runs the measured claim instead, and this is it:
//   · (tier, style) is UNIQUE over the whole roster, so no two CARDS are identical on the shown axes;
//   · the label alone separates 4 classes of the 12 (tier, fit) cells;
//   · the distribution over the 64 cards the market can ever draw is above 16 · level 32 · under 8 ·
//     under-self 8.
// ⚠ PURE: no world, no seed, no walk. Every number is a function of `ECONOMY.coach.roster` and the two
// shipped factor tables, which is why it costs nothing and is exact rather than sampled.

rule('§3. T12 – the coach profile, ruling S\'s measured claim (predicted before the sweep)')
{
  const PREDICTED: Record<CoachProfileBand, number> = { above: 16, level: 32, under: 8, 'under-self': 8 }
  const STYLES: readonly PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
  const roster = ECONOMY.coach.roster
  const counts: Record<CoachProfileBand, number> = { above: 0, level: 0, under: 0, 'under-self': 0 }
  const byStyle = new Map<PlayStyle, Record<CoachProfileBand, number>>()
  for (const style of STYLES) byStyle.set(style, { above: 0, level: 0, under: 0, 'under-self': 0 })
  let cards = 0
  for (const slot of roster) {
    for (const style of STYLES) {
      const band = coachProfileBand(slot.tier, styleFitBetween(slot.style, style))
      counts[band]++
      byStyle.get(style)![band]++
      cards++
    }
  }
  const keys = roster.map((s) => `${s.tier}/${s.style}`)
  const unique = new Set(keys).size === keys.length
  console.log(`    roster ${roster.length} slots × ${STYLES.length} games she could play = ${cards} cards`)
  console.log('')
  console.log(`    ${pad('', 18)}${padL('above', 8)}${padL('level', 8)}${padL('under', 8)}${padL('under-self', 12)}`)
  console.log(`    ${pad('PREDICTED (ruling S)', 22)}${padL(String(PREDICTED.above), 4)}${padL(String(PREDICTED.level), 8)}${padL(String(PREDICTED.under), 8)}${padL(String(PREDICTED['under-self']), 12)}`)
  console.log(`    ${pad('MEASURED', 22)}${padL(String(counts.above), 4)}${padL(String(counts.level), 8)}${padL(String(counts.under), 8)}${padL(String(counts['under-self']), 12)}`)
  console.log('')
  for (const style of STYLES) {
    const c = byStyle.get(style)!
    console.log(`    ${pad(style, 22)}${padL(String(c.above), 4)}${padL(String(c.level), 8)}${padL(String(c.under), 8)}${padL(String(c['under-self']), 12)}`)
  }
  console.log('')
  const distOk = (Object.keys(PREDICTED) as CoachProfileBand[]).every((b) => counts[b] === PREDICTED[b])
  console.log(`    distribution matches the prediction   ${verdict('§3 T12 profile distribution', distOk, `measured above ${counts.above} / level ${counts.level} / under ${counts.under} / under-self ${counts['under-self']} against ruling S's 16/32/8/8`)}`)
  console.log(`    (tier, style) unique over the roster  ${verdict('§3 T12 card uniqueness', unique, `${keys.length - new Set(keys).size} duplicate (tier, style) pairs – two cards would read identically on the shown axes`)}`)
  console.log('')
  console.log('    !! THE AXIS THIS LINE DOES **NOT** TOUCH is the personal edge placement inside the tier\'s')
  console.log('       corridor. T12 refused it on `coach-match-edge` §4 («his own number is NOT on the card») and')
  console.log('       ruling S upheld the refusal; a profile naming the third would make the market readable at a')
  console.log('       glance, for free. Nothing here reads `coachEdgePlacement`.')
}

// =================================================================================================
// §4. T13's LINE – the elite gate's currency decays, and the number the owner's ruling needs
// =================================================================================================
//
// ⚠⚠ T13 MEASURED THAT THE GATE'S CURRENCY DECAYS: `kidPoints(world, 'domestic')` is a ROLLING 52-WEEK
// BEST-6, so a career crosses 150 at weeks 22–47, holds it 19–44 weeks, then sits BELOW for 310–349
// weeks and ends at 0 – because a professional stops playing the domestic rungs the gate is counted
// on. WHAT DID NOT EXIST is the number the owner's open question actually needs: the share of careers
// that would be REFUSED an Elite coach, over the life of a career.
//
// ⚠ REPORTED, NOT ACTED ON. This block changes no constant, proposes no fix and draws no bar. The
// brief's instruction is «report it; do not act on it».
//
// ⚠⚠ «BY CAREER DECADE» IS READ AS **TENTHS OF THE CAREER SHE ACTUALLY WALKED**, and the convention is
// named rather than assumed, because a career here is ~7–10 years and a literal decade would be one
// bucket. Each career is cut into ten equal blocks of its OWN length, so every career contributes to
// every column and a short career cannot empty the late ones.

rule('§4. T13 – the share of careers an Elite coach would REFUSE, by tenth of the career (REPORTED, not acted on)')
{
  const gate = ECONOMY.coach.eliteGate
  console.log(`    the gate: ${gate.enabled ? 'ON' : 'off'} · minPoints ${gate.minPoints} · read off \`kidPoints(world, 'domestic')\`, a rolling 52-week best-6`)
  console.log(`    «refused» = \`coachHireable\` would answer false for an Elite row that week, i.e. her domestic`)
  console.log(`    points are under ${gate.minPoints}. Careers walked under the '${CARING.label}' policy, the same grid §1d uses.`)
  console.log('')
  const TENTHS = 10
  const refusedByTenth: number[][] = Array.from({ length: TENTHS }, () => [])
  const crossWeeks: number[] = []
  const holdWeeks: number[] = []
  const endPoints: number[] = []
  let careers = 0
  let everOpen = 0
  // ⚠⚠ THESE ARE §1d's OWN NO-SEAT CAREERS, RETAINED RATHER THAN RE-WALKED. The elite gate reads
  //    `kidPoints(world, 'domestic')` and nothing about the psychologist, so the arm it needs is
  //    exactly «a caring career with nobody hired» – which §1d has already walked. Walking a second
  //    grid for it would spend the machine on a world this file is holding, and would invite the
  //    two grids to disagree.
  for (const t of TEMPERAMENTS) {
    for (const c of herselfCells.find((x) => x.temperament === t && x.arm === null)!.keep) {
      careers++
      const last = c.weeks
      if (last < TENTHS) continue
      let cross = -1
      let held = 0
      for (let w = 1; w <= last; w++) {
        const p = c.pointsByWeek[w]
        if (p === undefined) continue
        if (p >= gate.minPoints) {
          held++
          if (cross < 0) cross = w
        }
      }
      if (cross >= 0) {
        everOpen++
        crossWeeks.push(cross)
        holdWeeks.push(held)
      }
      endPoints.push(c.pointsByWeek[last] ?? 0)
      for (let k = 0; k < TENTHS; k++) {
        const from = Math.floor((k * last) / TENTHS) + 1
        const to = Math.floor(((k + 1) * last) / TENTHS)
        let refusedWeeks = 0
        let seen = 0
        for (let w = from; w <= to; w++) {
          const p = c.pointsByWeek[w]
          if (p === undefined) continue
          seen++
          if (p < gate.minPoints) refusedWeeks++
        }
        if (seen > 0) refusedByTenth[k].push((100 * refusedWeeks) / seen)
      }
    }
  }
  if (careers === 0) stall('§4: zero careers walked for the elite-gate line', 'the grid is empty')
  if (everOpen === 0) {
    stall('§4: NOT ONE career ever crossed the elite gate', 'the column below would be 100% by construction and would say nothing about the gate')
  }
  console.log(`    ${pad('tenth of career', 18)}${padL('n', 5)}${padL('mean weeks refused', 20)}${padL('median', 9)}${padL('careers refused ALL of it', 26)}`)
  for (let k = 0; k < TENTHS; k++) {
    const s = sample(`§4 tenth ${k + 1}`, refusedByTenth[k], 1)
    const allRefused = s.xs.filter((x) => x >= 100 - 1e-9).length
    console.log(
      `    ${pad(`${k + 1}${['st', 'nd', 'rd'][k] ?? 'th'} tenth`, 18)}${padL(String(s.xs.length), 5)}${padL(pctS(avg(s)), 20)}${padL(pctS(med(s)), 9)}` +
        `${padL(`${allRefused}/${s.xs.length} (${pctS((100 * allRefused) / s.xs.length)})`, 26)}`,
    )
  }
  console.log('')
  const cw = sample('§4 crossing week', crossWeeks, 1)
  const hw = sample('§4 weeks held', holdWeeks, 1)
  const ep = sample('§4 points at the end', endPoints, 1)
  console.log(`    careers that EVER cleared the gate : ${everOpen}/${careers} (${pctS((100 * everOpen) / careers)})`)
  console.log(`    first crossing, weeks             : median ${num(med(cw), 0)} · min ${Math.min(...cw.xs)} · max ${Math.max(...cw.xs)}   (T13 measured 22–47)`)
  console.log(`    weeks held above the gate         : median ${num(med(hw), 0)} · min ${Math.min(...hw.xs)} · max ${Math.max(...hw.xs)}   (T13 measured 19–44)`)
  console.log(`    domestic points at the horizon    : median ${num(med(ep), 1)} · max ${num(Math.max(...ep.xs), 1)}   (T13 measured «end at 0»)`)
  console.log('')
  console.log('    !! WHAT THIS SAYS, AND IT IS FOR THE OWNER AND NOT FOR THIS BENCH: the currency the gate is')
  console.log('       counted in is a DOMESTIC rolling best-6, and a professional career stops feeding it. So the')
  console.log('       rung the gate protects becomes unbuyable again exactly as she grows into being able to')
  console.log('       afford it. No constant was touched and no fix is proposed here.')
}

// =================================================================================================
// §5. THE ACTUATION RECEIPT – proof each arm reached its own subject, and the dials restored
// =================================================================================================

rule('§5. THE ACTUATION RECEIPT – every arm reached its subject, and the dials are back')
{
  const recShocks = recoveryCells.reduce((s, c) => s + c.shocks, 0)
  const recReceipts = recoveryCells.reduce((s, c) => s + c.receipts, 0)
  const recHired = recoveryCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.hired, 0)
  const coolSeasons = coolCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.gain.length, 0)
  const coolCeiling = coolCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.atCeiling, 0)
  const listenStamped = listenCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.stamped, 0)
  const listenHeard = listenCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.heard, 0)
  const selfFlips = herselfCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.beyondFlips.reduce((a, b) => a + b, 0), 0)
  const selfBeyond = herselfCells.filter((c) => c.arm !== null).reduce((s, c) => s + c.beyondWeeks.reduce((a, b) => a + b, 0), 0)
  // ⚠⚠ THE COLLAPSE COUNT IS ASKED OF §1e AND NOT OF §1d, AND THE FIRST DRAFT ASKED THE WRONG ARM.
  //    §1d is entirely CARING, so a walls-UP flip is impossible there by construction and the guard
  //    fired on a zero that was the design. The collapse direction lives where the kicks are.
  const collapses = o6Collapses + herselfCells.reduce((s, c) => s + c.collapseFlips.reduce((a, b) => a + b, 0), 0)
  const lines: [string, number, string][] = [
    ['shocks stamped by `rollEnds`', recShocks, '§1a would otherwise be reading an unshocked career'],
    ['recovery receipts printed', recReceipts, 'T4\'s clear line – zero means the focus never visibly worked'],
    ['seat arms hired before the shock', recHired, 'zero means every §1a column is the free road'],
    ['held seasons read', coolSeasons, '§1b has no rate without one'],
    ['seasons that STARTED at the ceiling', coolCeiling, 'ruling M\'s second number, reachable and reached'],
    ['read-bearing rows stamped', listenStamped, '§1c\'s coin was reached this many times'],
    ['rows read plainly', listenHeard, 'the legible wording actually fired'],
    ['beyond-baseline flips (seat arms)', selfFlips, '§1d\'s ladder has nothing to rank without them'],
    ['beyond-baseline weeks (seat arms)', selfBeyond, 'the growth branch ran'],
    ['walls-UP flips (collapses, §1e)', collapses, 'the other direction fired too – the model is not one-sided'],
  ]
  for (const [what, n, why] of lines) {
    console.log(`    ${pad(what, 38)}${padL(String(n), 8)}   ${n === 0 ? '!! ZERO – ' : ''}${why}`)
  }
  const zeroes = lines.filter(([, n]) => n === 0)
  if (zeroes.length > 0) {
    stall(`§5: ${zeroes.length} actuation column(s) read ZERO`, zeroes.map(([w]) => w).join(' · '))
  }
  console.log('')
  restoreDials()
  const restored =
    ECONOMY.life.arrivalPerWeek.minor === DIALS_SHIPPED.minor &&
    ECONOMY.life.arrivalPerWeek.adult === DIALS_SHIPPED.adult &&
    ECONOMY.life.endsPerWeek === DIALS_SHIPPED.ends &&
    ECONOMY.psychologist.listenClarity.every((c, i) => c === DIALS_SHIPPED.clarity[i])
  if (!restored) throw new Error('the dials did not restore – a later reader of ECONOMY in this process would see a poked constant')
  console.log(`    dials restored and CHECKED: arrival ${ECONOMY.life.arrivalPerWeek.minor}/${ECONOMY.life.arrivalPerWeek.adult} · ends ${ECONOMY.life.endsPerWeek} · clarity [${ECONOMY.psychologist.listenClarity.join(', ')}]`)
  console.log(`    MAIN is untouched by every arm above – the frozen capture (41550 / e6b0c709) cannot see this file.`)
}

// =================================================================================================
// §6. THE VERDICT SHEET
// =================================================================================================

rule('§6. THE VERDICT SHEET')
if (MISSES.length === 0) {
  console.log('    every bar HIT.')
  console.log('')
  process.exitCode = 0
} else {
  console.log(`    !! ${MISSES.length} BAR(S) MISSED. EACH IS A FINDING AND NONE IS AN ERROR – invariant 5: numbers are`)
  console.log('       MEASURED, never adjusted, and NO CONSTANT WAS TOUCHED BY THIS RUN. §4 of the wave brief lists')
  console.log('       every one of these as a PROPOSAL awaiting the owner\'s word, and a miss is what that word is for.')
  console.log('')
  for (const m of MISSES) console.log(`      MISS  ${m}`)
  console.log('')
  console.log('    THE EXIT CODE IS NON-ZERO because the T10 brief asks for two exit codes and «a bench that always')
  console.log('    exits 0 is a report, not a gate». No bench runs inside `npm run check`, so this reds nothing.')
  process.exitCode = 1
}
console.log('')
