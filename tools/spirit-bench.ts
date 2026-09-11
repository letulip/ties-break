// THE SPIRIT BENCH (wave 1, runbook §6; wave 2's bench duty, runbook §7) - `npm run bench:spirit`.
// Same shape as the econ / fatigue / knock / radar benches: a measurement harness, run by hand,
// never part of a gate.
//
// ⭐⭐⭐ WHAT WAVE 2 ADDED, AND WHAT IT FOUND (09.09, who-she-is §4a-w2). Bar 3 was re-aimed to wave 2
// by the owner's ruling, so the two arms now ANSWER her at the fork instead of listening: care backs
// her want and matches it, grind presses and contradicts. The census in section [3] then measured
// that the arms never run - her opinion is raised by the tick that opens the fork, week 242, and the
// bar grid ends at week 208 with bar 3's own reading at week 156. `--fork` walks past 242 to price
// the deltas where they land; that row is a diagnostic and is not a bar.
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
  // ⚠ the two the SWEEP block below needs, and nothing the default run reads: the intensity axis
  // (bar 1 is read per intensity arm, not pooled) and the weekly rule itself (sweep 2 measures the
  // heal time through the engine's own function rather than as 25/rate).
  temperamentIntensity,
  accrueSpirit,
  // ⚠⚠ WAVE 2 - THE FOUR THE BEAT ARMS NEED. `answerLifeBeat` is what makes the two arms ANSWER her
  // rather than leave her standing there, `answerFork` is where the second delta lands, and
  // `forkWantOf` / `FORK_WANT_ANSWER` are how the bench knows what "matching her want" IS without
  // re-deriving her want (and without a second reading that could disagree with the engine's).
  pendingLifeBeat,
  answerLifeBeat,
  answerFork,
  forkWantOf,
  FORK_WANT_ANSWER,
  // ⚠ v74 – the engine's own refusal string, so the drain below can tell a terminal latch (which is
  // tolerated) from a beat kind with no bond-neutral answer (which must never be swallowed here).
  CAREER_ENDED_REFUSAL,
  // ⚠⚠ T12 – the attachment slot, read for ONE purpose: `accrueSpirit` walks toward
  // `baseline + attachmentLift` while it returns a row, so "weeks under the baseline" has to know
  // how many of the pair's weeks were lived above a LIFTED target. It is also an invariance probe –
  // the arrival is keyed on (seed, calendar) alone, so the two arms must hold it on the same weeks.
  activeEpisode,
} from '../src/engine/world'
import type { Temperament, WorldState } from '../src/engine/world'
// ⚠ T12 reads two knock facts the barrel does not re-export, from the leaf that owns them – the same
// direct-to-leaf shape this file already uses for `ECONOMY`, `isExamWeek` and `schoolEndWeek`.
// `knockGoverns` is the engine's OWN answer to "is this week one the push is being paid for", so the
// governed-week count below is the rule itself rather than a bench re-derivation of 3 weeks a push.
import { knockGoverns, KNOCK_PUSH_WEEKS, KNOCK_REST_GROWTH } from '../src/engine/knock'
import { drainLifeBeats } from './_lifeBeats'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { isExamWeek, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { schoolIsOver, schoolEndWeek } from '../src/engine/kidLife'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'

// =================================================================================================
// THE GRID
// =================================================================================================

const SEASONS = 4
/** Season 3's LAST week - the moment bar 3 reads bond at. ⚠ THE SAME NUMBER IN EVERY MODE below:
 *  bar 3 is «the gap AT SEASON 3» and a diagnostic that moved its reading would be answering a
 *  different question under the bar's name. */
const SEASON_3_WEEK = 3 * WEEKS_PER_YEAR
const SEED_COUNT = seedCount()
const ARMS = ['care', 'grind'] as const
type Arm = (typeof ARMS)[number]

/** ⭐⭐⭐ WAVE 2 - THE WEEK HER OPINION EXISTS, DERIVED AND NEVER QUOTED. `raiseForkOpinion` is
 *  called by the tick that opens the fork (`world/endings.ts`), the fork opens on `schoolEndWeek`,
 *  and the bench's profile is `DEFAULT_PROFILE` with only `background` overridden - so this is the
 *  earliest week any career on this grid can hold a `'fork-opinion'` row.
 *
 *  ⚠⚠ IT IS 242, THE DEFAULT GRID ENDS AT 208, AND BAR 3 READS AT 156. That ordering is the whole
 *  of what section [3] found in wave 2 and it is computed here rather than asserted, so a later
 *  birth-month or school-length change moves the print instead of silently invalidating it. */
const FORK_WEEK = schoolEndWeek(DEFAULT_PROFILE.birthMonth)

/** ⚠ THE DIAGNOSTIC GRID, `--fork`, AND IT IS NOT THE BAR GRID. The default walk is the runbook's
 *  four seasons, unchanged from wave 1, and every bar in this file is read off it. `--fork` walks
 *  one week past `FORK_WEEK` INSTEAD, for one purpose only: to price what the wave-2 deltas are
 *  worth on the week they land, since on the bar grid they never land at all. Bars 1/2/4/5/6 read a
 *  longer week series in that mode and are NOT comparable with wave 1; bar 3 is, because its reading
 *  is week 156 in both and the two walks are byte-identical up to week 208. */
const FORK_MODE = process.argv.includes('--fork')
const WEEKS = FORK_MODE ? FORK_WEEK + 1 : SEASONS * WEEKS_PER_YEAR

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
  /** ⭐⭐ WAVE 2's CENSUS, AND IT EXISTS TO MAKE A NULL RESULT FALSIFIABLE. CLAUDE.md's rule -
   *  «before you believe a null result, prove the arm contains both the change and its reader» - is
   *  unprovable from a bond number alone: an arm that answers her and an arm whose answering code
   *  never runs produce the SAME gap if the beat is out of the grid's reach. These four counters are
   *  what tells those two apart, and section [3] prints them beside the bar. */
  /** `'fork-opinion'` rows this career ever held (0 or 1 - the fork is raised once). */
  beatsRaised: number
  /** what he SAID, by option id, in `lifeLog` order - `back` in the care arm, `press` in grind. */
  beatAnswers: string[]
  /** what he DID at the fork, priced against her recorded want, or null if he never answered one. */
  forkCongruence: 'with' | 'against' | null
  /** bond immediately after the fork was answered - the week the two wave-2 deltas have landed.
   *  NaN for every career that never reached one, which on the bar grid is all of them. */
  bondAtFork: number
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
    beatsRaised: 0,
    beatAnswers: [],
    forkCongruence: null,
    bondAtFork: Number.NaN,
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
    // ⭐⭐⭐ WAVE 2 - AND THE ORDER OF THESE TWO IS THE ENGINE'S, NOT THE BENCH'S. `answerFork`
    // refuses while her row is unanswered (`FORK_UNHEARD_REFUSAL`), so the words come before the
    // deed here because they come before the deed in the world.
    answerTheLifeBeat(world, arm, career)
    answerTheForkTheWayThisArmWould(world, arm, career)

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
 *  refusals the way the screen does: an unbookable week is simply a week the family does not get.
 *
 *  ⚠ THE COUNTER IS TAKEN STRUCTURALLY (`{ vacations: number }`) RATHER THAN AS A `Career`, so T12's
 *  pair below books its family weeks through THIS function instead of growing a second copy of the
 *  off-season rule. Nothing about the care arm changed: a `Career` still satisfies the shape. */
function bookTheFamilyWeeks(world: WorldState, career: { vacations: number }): void {
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
 *  this is deliberately not an arm difference. The ask itself is what §6's print wants.
 *
 *  ⚠ `{ asks: string[] }` FOR THE SAME REASON `bookTheFamilyWeeks` TAKES A SHAPE: T12's pair answers
 *  the birthday identically in both of ITS arms too, and one implementation is what guarantees the
 *  two walks cannot drift into answering her differently. */
function answerTheBirthday(world: WorldState, career: { asks: string[] }): void {
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
// ⭐⭐⭐ WAVE 2 - THE TWO ARMS ANSWER HER, AND THEY ANSWER HER DIFFERENTLY
// =================================================================================================
//
// ⚠⚠ WHY THIS IS NOT `answerLifeBeat(world, 'listen')`. Forty tools and several suites gained
// `if (pendingLifeBeat(world)) answerLifeBeat(world, 'listen')` when the fork refusal landed, because
// every harness that walks a career to the fork must now answer her before it may answer the fork.
// That line is correct for a harness measuring something else and WRONG here: `beatListened` is 0 on
// the bond table, so a bench that listened in both arms would be measuring a NEUTRAL world and
// reporting wave 1's number back with a wave-2 date on it. This bench is the one place the answer is
// itself the variable, so the arms answer deliberately - and the census counters above are what
// prove the code ran rather than merely existing.
//
//   care    backs her want (+2) and MATCHES it at the fork (+3)      = +5 over the two deltas
//   grind   presses the other way (−2) and CONTRADICTS it (−4)       = −6
//
// 11 raw points of arm separation, which is the whole of what wave 2 can be worth to bar 3.
//
// ⚠⚠ AND THE SAME PARAGRAPH IS WHY v74 NEARLY KILLED THIS FILE IN SILENCE. Wave 3's T6 added a
// second beat kind, `'met'`, raised on `knownWeek` – any week from her sixteenth on, which is inside
// this bench's own four seasons. `'back'` and `'press'` are not among ITS answers, so every attempt
// threw, the `try/catch` below swallowed the throw, and the row stayed open forever: `answerFork`
// refuses behind an unanswered beat, so from her sixteenth birthday on this bench answered NOTHING
// and measured NOTHING, while exiting 0. Measured on a 4-seed grid before the repair:
//
//     arm       careers   beats   back  press  listen  fork with  fork against  bond @ fork
//     care           16     379      0      0       0          0             0            –
//     grind          16     463      0      0       0          0             0            –
//
// 842 rows raised, zero answered, both fork columns empty - and no error anywhere. The distinction
// the block above draws is UNCHANGED: the two arms still answer a `'fork-opinion'` row and only that
// row, deliberately, and `'listen'` is still in neither arm. What changed is that a beat this bench
// never meant to price is now DRAINED bond-neutrally instead of being left to block her.

/** WHAT HE SAYS. One answer per arm, from `LIFE_BEAT_OPTIONS`' own ids, and no third case: `listen`
 *  is deliberately in neither arm (see the block above).
 *
 *  ⚠ THE DRAIN GOES FIRST AND IS NOT AN ARM (v74, T6b). Any row that is not the fork opinion is a
 *  beat this file does not measure – it takes the bond-neutral answer of its own kind (`metWary` is
 *  0), so it cannot move bar 3 and cannot sit in front of the one row the arms are about. The arms
 *  themselves are untouched: `beatsRaised` and `beatAnswers` still count ONLY `'fork-opinion'`, which
 *  is what the census columns have always meant. */
function answerTheLifeBeat(world: WorldState, arm: Arm, career: Career): void {
  try {
    drainLifeBeats(world, 'fork-opinion')
  } catch (e) {
    // ⚠ ONLY the terminal latch is tolerated, and the test is the engine's own refusal string.
    // Anything else – a beat kind that has no bond-neutral answer – is rethrown on purpose: a
    // swallowed drain is the exact defect the block above records, and it cost this file a wave.
    if (!(e instanceof Error) || e.message !== CAREER_ENDED_REFUSAL) throw e
  }
  const pending = pendingLifeBeat(world)
  if (pending === null) return
  career.beatsRaised++
  const said = arm === 'care' ? 'back' : 'press'
  try {
    answerLifeBeat(world, said)
    career.beatAnswers.push(said)
  } catch {
    /* a terminal latch – `guardNotEndedForGood` refuses, and the row stays open for nobody */
  }
}

/** ⭐⭐ WHAT HE DOES, priced against the want the ENGINE recorded rather than against a want the
 *  bench re-drew - `forkWantOf` reads the `lifeLog` row, so the two readings cannot disagree.
 *
 *  ⚠ THE CARE ARM MATCHES HER, WHATEVER SHE SAID, `'stop'` INCLUDED. Doing what she asked is the
 *  definition of the arm, and a bench that quietly declined to match the one want that ends a career
 *  would be scoring the care arm on an answer it did not give.
 *
 *  ⚠⚠ THE GRIND ARM'S CONTRADICTION NEVER PICKS `'stop'`, AND THAT IS A MEASUREMENT DECISION WITH A
 *  REASON. Two of the three fork answers end the career; `'stop'` ends it for good. A contradicting
 *  arm that sometimes retired her and sometimes did not would fold "he took the decision away" and
 *  "the career stopped here" into one number, and bar 3 would again be measuring two things at once
 *  (the same argument the header makes for the identical entry policy). So the grind arm keeps her
 *  playing when she wanted anything else, and sends her to college when she wanted the tour - the
 *  contradiction in both directions, and never the ending. */
function answerTheForkTheWayThisArmWould(world: WorldState, arm: Arm, career: Career): void {
  if (world.fork === null || world.fork.answer !== null) return
  const want = forkWantOf(world)
  if (want === null) return
  const hers = FORK_WANT_ANSWER[want]
  const answer = arm === 'care' ? hers : hers === 'continue' ? 'college' : 'continue'
  try {
    answerFork(world, answer)
    career.forkCongruence = answer === hers ? 'with' : 'against'
    career.bondAtFork = world.bond
  } catch {
    /* her row is still open, or the fork closed under us - either way nothing was answered */
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
// ⭐ SWEEP MODE – `npm run bench:spirit -- --sweep=return` and `-- --sweep=bond`
// =================================================================================================
//
// ⚠⚠ THIS CHANGES NOTHING AND PROPOSES NOTHING. Two of the six bars above fail by ARITHMETIC – the
// weekly return is larger than almost every perturbation (bar 1), and the flat bond regression is
// larger than what either arm's decisions are worth per week (bar 3) – and the owner's ruling on a
// failed bar is the file header's: *a bar that fails is a finding for him, never a licence to touch
// a constant.* So this mode does not propose a value. It walks a dial across a handful of settings
// and prints, for each one, WHAT THE BAR WOULD READ **and what the setting costs elsewhere**, so
// the ruling is made on numbers instead of on an opinion. The shipped value is always the FIRST row
// of each table, and it is the row every other row has to be read against.
//
// ⚠⚠ NOTHING IN `src/` IS EDITED, AND NO SEAM WAS CARVED TO MAKE THIS WORK. `ECONOMY` is declared
// `as const`, which is a TYPE-level readonly and nothing more – at runtime it is an ordinary object
// and is never frozen – and `accrueSpirit` reads `ECONOMY.spirit.returnPerWeek` /
// `ECONOMY.bond.regressionPerWeek` INSIDE the weekly call rather than caching either at module
// load. So the bench writes the dial in its own process, runs the grid, and puts the shipped value
// back before it exits. The default run (`npm run bench:spirit`, no arguments) never enters this
// branch at all and its output is byte-identical to what it was before this mode existed.
//
// ⚠ AND EVERY ROW IS A FULL RE-RUN OF THE SAME GRID – the same 32 seeds, the same four temperaments,
// the same two arms, the same entry policy – so two rows differ in the dial and in nothing else.

type Sweep = 'return' | 'bond' | 'return-deep'

/** `--sweep=return` / `--sweep=bond` / `--sweep=return-deep`; absent = the ordinary bench, untouched. */
function sweepMode(): Sweep | null {
  const flag = process.argv.find((a) => a.startsWith('--sweep='))
  if (flag === undefined) return null
  const value = flag.slice('--sweep='.length)
  if (value === 'return' || value === 'bond' || value === 'return-deep') return value
  console.error(`unknown --sweep=${value} – the sweeps are 'return', 'return-deep' and 'bond'`)
  process.exit(2)
}

/** The five settings of each dial, shipped value FIRST. */
const RETURN_VALUES: readonly { steady: number; intense: number }[] = [
  { steady: 5, intense: 3 },
  { steady: 4, intense: 2.5 },
  { steady: 3, intense: 2 },
  { steady: 2, intense: 1.5 },
  { steady: 1.5, intense: 1 },
]
/** ⚠ BEYOND THE FIVE, AND SEPARATE FROM THEM ON PURPOSE. Sweep 1 answers "what would each of these
 *  five settings read" and NOT ONE OF THEM clears bar 1 on the STEADY arm – it tops out at 1.52
 *  against a bar of 2.00. So the question "what would" has no answer inside the requested range,
 *  and this second list exists only to BOUND it. It is its own flag (`--sweep=return-deep`) so the
 *  five the owner asked for are reported exactly as asked, unpadded; its first row REPEATS the last
 *  row of sweep 1 as the anchor that proves the two runs are the same grid. It proposes nothing:
 *  every row here is far outside anything who-she-is §4 has ruled on. */
const RETURN_DEEP_VALUES: readonly { steady: number; intense: number }[] = [
  { steady: 1.5, intense: 1 },
  { steady: 1, intense: 0.7 },
  { steady: 0.75, intense: 0.5 },
  { steady: 0.5, intense: 0.35 },
]
const REGRESSION_VALUES: readonly number[] = [0.5, 0.4, 0.3, 0.2, 0.1]

/** How long a probe is given to heal before "never" is the honest answer. Four seasons is the
 *  whole grid; 2000 weeks is ~38 of them. */
const HEAL_CAP = 2000

/** The whole grid, once. */
function runGrid(): Career[] {
  const cs: Career[] = []
  for (const arm of ARMS) {
    for (const temperament of TEMPERAMENTS) {
      for (let s = 0; s < SEED_COUNT; s++) cs.push(runCareer(`spirit-${s}`, arm, temperament))
    }
  }
  return cs
}

const flat = (cs: readonly Career[], pick: (c: Career) => number[]) => cs.flatMap(pick)

/** BAR 1's OWN STATISTIC, over any slice of careers: the mean per-career sd of spirit over weeks. */
function meanCareerSd(cs: readonly Career[]): number {
  return mean(cs.map((c) => sd(c.spirit)))
}

/** ⚠ THE FAIRNESS CORRIDOR, RECOMPUTED FROM SCRATCH FOR EVERY ROW – bar 5 is a HARD bar and a
 *  slower return is not allowed to buy bar 1 by breaching it. Same paired construction as section
 *  [5]: seed-for-seed and arm-for-arm, the two careers in a delta differing in nothing but who she
 *  is. Returns the worst pair's |mean Δ| in points of win rate. */
function fairnessWorst(cs: readonly Career[]): number {
  const winRate = new Map<string, number>()
  for (const c of cs) {
    winRate.set(`${c.arm}|${c.temperament}|${c.seed}`, c.matchesPlayed === 0 ? Number.NaN : pct(c.matchesWon, c.matchesPlayed))
  }
  let worst = 0
  for (let i = 0; i < TEMPERAMENTS.length; i++) {
    for (let j = i + 1; j < TEMPERAMENTS.length; j++) {
      const deltas: number[] = []
      for (const arm of ARMS) {
        for (let s = 0; s < SEED_COUNT; s++) {
          const x = winRate.get(`${arm}|${TEMPERAMENTS[i]}|spirit-${s}`)
          const y = winRate.get(`${arm}|${TEMPERAMENTS[j]}|spirit-${s}`)
          if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) continue
          deltas.push(x - y)
        }
      }
      worst = Math.max(worst, Math.abs(mean(deltas)))
    }
  }
  return worst
}

/** SECTION [6]'s DP, lifted out so a sweep row can call it – identical arithmetic, plus the ONE
 *  number section [6] does not print and the owner is actually choosing on: THE WIDTH OF THE
 *  NARROWEST BAND. Five words are five contiguous bands, and the two outer ones are open-ended, so
 *  the width that can be measured is an INTERIOR band's: the distance between two adjacent cut
 *  points. A band 0.3 points wide is a tile that changes word on a rounding difference. */
function cutSearch(xs: readonly number[]): { bestShare: number; cuts: number[]; narrowest: number } {
  const distinct = [...new Set(xs)].sort((a, b) => a - b)
  if (distinct.length < 5) return { bestShare: 0, cuts: [], narrowest: Number.NaN }
  const counts = new Map<number, number>()
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1)
  const cum: number[] = []
  let running = 0
  for (const v of distinct) {
    running += counts.get(v) ?? 0
    cum.push(running)
  }
  const upto = (index: number) => (index < 0 ? 0 : cum[index])
  const massOf = (from: number, to: number) => upto(to) - upto(from - 1)
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
  const edges: number[] = []
  let k = 5
  let i = distinct.length - 1
  while (k > 1) {
    const j = cutAt[k][i]
    edges.unshift(j)
    i = j
    k--
  }
  const cuts = edges.map((e) => distinct[e + 1])
  let narrowest = Number.POSITIVE_INFINITY
  for (let b = 1; b < cuts.length; b++) narrowest = Math.min(narrowest, cuts[b] - cuts[b - 1])
  return { bestShare: pct(best[5][distinct.length - 1], xs.length), cuts, narrowest }
}

/** BAR 3's OWN STATISTIC: the mean of the 32 PAIRED per-seed care−grind differences at the end of
 *  season 3, with the paired SEM – over the 32 seeds and never over the 128 careers. */
function bondGapAtSeason3(cs: readonly Career[]): { gap: number; sem: number; n: number } {
  const seedIds = [...new Set(cs.map((c) => c.seed))]
  const perSeed = (arm: Arm) =>
    seedIds.map((s) =>
      mean(cs.filter((c) => c.arm === arm && c.seed === s).map((c) => c.bondAtSeason3).filter((x) => !Number.isNaN(x))),
    )
  const care = perSeed('care')
  const grind = perSeed('grind')
  const gaps = care.map((x, idx) => x - grind[idx]).filter((d) => !Number.isNaN(d))
  return { gap: mean(gaps), sem: sem(gaps), n: gaps.length }
}

/** ⚠⚠ THE COST HALF OF SWEEP 2, AND IT IS MEASURED THROUGH THE ENGINE'S OWN WEEKLY RULE rather
 *  than computed as 25 / rate. `accrueSpirit` is the only writer of the regression and it rounds
 *  EVERY write onto `ECONOMY.bond.step` (0.5), so "how many weeks does a −25 season take to heal"
 *  is the number of times that function has to run at the dial as currently set – which is not
 *  always 25 / rate, and the table is the place to find that out rather than the shipping build.
 *  A probe world is held at a non-wrap week so the zero-vacations row cannot fire into the answer;
 *  a week that moves nothing at all is reported as never, not as a large number. */
function healWeeksForMinus25(): number {
  const world = createWorld('bond-heal-probe', { ...DEFAULT_PROFILE, background: 'wealthy' })
  world.week = 5
  world.bond = ECONOMY.bond.start - 25
  for (let w = 1; w <= HEAL_CAP; w++) {
    const before = world.bond
    accrueSpirit(world)
    if (world.bond >= ECONOMY.bond.start) return w
    if (world.bond === before) return Number.POSITIVE_INFINITY
  }
  return Number.POSITIVE_INFINITY
}

/** ⚠⚠ THE OTHER HALF OF THE SAME PROOF, AND THE REASON THREE ROWS OF SWEEP 2 READ IDENTICALLY.
 *  What ONE week of the regression is actually worth at the dial as currently set, measured by
 *  running `accrueSpirit` exactly once on the same probe world. It is NOT the dial: every bond
 *  write goes through the engine's `roundHalf`, which lands the result on `ECONOMY.bond.step`
 *  (0.5), so a rate of 0.4 or 0.3 rounds UP to a full half-point and a rate of 0.2 or 0.1 rounds
 *  DOWN to nothing. Printed rather than argued, so a row that looks like a dial that failed to
 *  apply can be read as the quantisation it is – and so the injection itself is visibly working,
 *  since a dial that never reached the engine would print one number in every row. */
function effectiveBondStep(): number {
  const world = createWorld('bond-heal-probe', { ...DEFAULT_PROFILE, background: 'wealthy' })
  world.week = 5
  world.bond = ECONOMY.bond.start - 25
  const before = world.bond
  accrueSpirit(world)
  return world.bond - before
}

/** BAR 2, SAID IN ONE CELL WITHOUT COLLAPSING ITS TWO HALVES INTO ONE WORD. */
function bar2Label(rails: boolean, meanOk: boolean): string {
  if (rails && meanOk) return 'PASS'
  if (!rails && !meanOk) return 'FAIL both'
  return rails ? 'FAIL mean' : 'FAIL rails'
}

function healLabel(weeks: number): string {
  return Number.isFinite(weeks) ? `${weeks} wk` : 'never'
}

/** ⚠ THE ONE SEAM. `ECONOMY` is `as const` at the TYPE level only; at runtime it is a plain object
 *  and `accrueSpirit` re-reads it every week. The casts widen the literal types the `as const`
 *  produced; they write no file and the shipped values go back before the process exits. */
const RETURN_DIAL = ECONOMY.spirit.returnPerWeek as unknown as { steady: number; intense: number }
const BOND_DIAL = ECONOMY.bond as unknown as { regressionPerWeek: number }

function runSweep(mode: Sweep): void {
  const shippedReturn = { steady: RETURN_DIAL.steady, intense: RETURN_DIAL.intense }
  const shippedRegression = BOND_DIAL.regressionPerWeek
  const startedSweep = Date.now()
  try {
    if (mode === 'return') sweepReturn(RETURN_VALUES, false)
    else if (mode === 'return-deep') sweepReturn(RETURN_DEEP_VALUES, true)
    else sweepBond()
  } finally {
    RETURN_DIAL.steady = shippedReturn.steady
    RETURN_DIAL.intense = shippedReturn.intense
    BOND_DIAL.regressionPerWeek = shippedRegression
    console.log(
      `\n    dials restored to the shipped values: returnPerWeek ${RETURN_DIAL.steady} / ${RETURN_DIAL.intense} · ` +
        `bond.regressionPerWeek ${BOND_DIAL.regressionPerWeek}`,
    )
    console.log(`    ${((Date.now() - startedSweep) / 1000).toFixed(1)}s`)
  }
}

// --- SWEEP 1: THE WEEKLY RETURN ------------------------------------------------------------------

interface ReturnRow {
  label: string
  /** the 2×2 of bar 1's own statistic: policy arm × intensity arm */
  careSteady: number
  careIntense: number
  grindSteady: number
  grindIntense: number
  steady: number
  intense: number
  care: number
  grind: number
  at70all: number
  at70care: number
  under60: number
  meanAll: number
  /** BAR 2's TWO HALVES, KEPT APART. "the drift bar failed" is not a reading – the rails half and
   *  the 70 ± 4 half fail for different reasons and cost different things, and a row whose mean is
   *  still 69.30 has plainly failed the OTHER one. */
  bar2rails: boolean
  bar2mean: boolean
  fairWorst: number
  minBand: number
  narrowest: number
  cuts: number[]
}

function sweepReturn(values: readonly { steady: number; intense: number }[], deep: boolean): void {
  rule(
    (deep
      ? `SWEEP 1-DEEP – ECONOMY.spirit.returnPerWeek BELOW the five, to bound a bar none of them clears\n`
      : `SWEEP 1 – ECONOMY.spirit.returnPerWeek, everything else held at the shipped value\n`) +
      `${SEED_COUNT} seeds × ${SEASONS} seasons × {care, grind} × 4 temperaments, the whole grid re-run per row\n` +
      (deep
        ? `⚠⚠ THESE ARE NOT PROPOSALS AND NOT THE OWNER'S FIVE. Sweep 1's slowest requested setting leaves the\n` +
          `  STEADY arm at 1.52 against a bar of 2.00, so "the smallest change that makes bar 1 pass" has no\n` +
          `  answer inside the requested range. These rows bound it and nothing else. The FIRST row repeats\n` +
          `  sweep 1's last so the two runs can be checked against each other.`
        : `⚠ BAR 1 IS READ PER INTENSITY ARM AND NOT POOLED. The return rate IS the intensity axis – 5 for a\n` +
          `  steady girl, 3 for an intense one – so the care arm's shipped 2.00 is the mean of a 1.21 and a\n` +
          `  2.79 and is a property of NEITHER population. The 2×2 below is the honest reading of that bar.`),
  )
  const rows: ReturnRow[] = []
  for (const value of values) {
    RETURN_DIAL.steady = value.steady
    RETURN_DIAL.intense = value.intense
    const cs = runGrid()
    const slice = (arm: Arm | null, intensity: 'steady' | 'intense' | null) =>
      cs.filter((c) => (arm === null || c.arm === arm) && (intensity === null || temperamentIntensity(c.temperament) === intensity))
    const all = flat(cs, (c) => c.spirit)
    const care = flat(slice('care', null), (c) => c.spirit)
    const base = ECONOMY.spirit.baseline
    // ⚠ BAR 2 IS A HARD BAR TOO, AND A SLOWER RETURN IS EXACTLY WHAT WOULD BREAK IT: the return is
    // the only restoring force spirit has, so weakening it widens the distribution around 70. Held
    // PER TEMPERAMENT ARM, both halves, the same way section [2] holds it – a row that buys bar 1
    // by drifting out of 70 ± 4, or by pushing 2% of weeks past a rail, has not bought anything.
    let bar2rails = true
    let bar2mean = true
    for (const armName of ARMS) {
      for (const t of TEMPERAMENTS) {
        const xs = flat(cs.filter((c) => c.arm === armName && c.temperament === t), (c) => c.spirit)
        bar2rails &&= pct(xs.filter((x) => x < 20 || x > 95).length, xs.length) < 2
        bar2mean &&= Math.abs(mean(xs) - 70) <= 4
      }
    }
    const cut = cutSearch(care)
    rows.push({
      label: `${value.steady} / ${value.intense}${value.steady === 5 && value.intense === 3 ? ' ◄ shipped' : ''}`,
      careSteady: meanCareerSd(slice('care', 'steady')),
      careIntense: meanCareerSd(slice('care', 'intense')),
      grindSteady: meanCareerSd(slice('grind', 'steady')),
      grindIntense: meanCareerSd(slice('grind', 'intense')),
      steady: meanCareerSd(slice(null, 'steady')),
      intense: meanCareerSd(slice(null, 'intense')),
      care: meanCareerSd(slice('care', null)),
      grind: meanCareerSd(slice('grind', null)),
      at70all: pct(all.filter((x) => x === base).length, all.length),
      at70care: pct(care.filter((x) => x === base).length, care.length),
      under60: pct(all.filter((x) => x < ECONOMY.spirit.knee).length, all.length),
      meanAll: mean(all),
      bar2rails,
      bar2mean,
      fairWorst: fairnessWorst(cs),
      minBand: cut.bestShare,
      narrowest: cut.narrowest,
      cuts: cut.cuts,
    })
  }

  console.log(`\n    1A · BAR 1 – the mean per-career sd of spirit, cut BOTH ways. The bar is ≥ 2.00.`)
  console.log(
    `    ${pad('steady/intense', 16)}${padL('care·std', 10)}${padL('care·int', 10)}${padL('grind·std', 11)}${padL('grind·int', 11)}` +
      `${padL('STEADY', 9)}${padL('INTENSE', 9)}${padL('care', 8)}${padL('grind', 8)}${padL('both int.', 11)}${padL('both pol.', 11)}`,
  )
  console.log(`    ${'─'.repeat(114)}`)
  for (const r of rows) {
    console.log(
      `    ${pad(r.label, 16)}${padL(r.careSteady.toFixed(2), 10)}${padL(r.careIntense.toFixed(2), 10)}` +
        `${padL(r.grindSteady.toFixed(2), 11)}${padL(r.grindIntense.toFixed(2), 11)}` +
        `${padL(r.steady.toFixed(2), 9)}${padL(r.intense.toFixed(2), 9)}${padL(r.care.toFixed(2), 8)}${padL(r.grind.toFixed(2), 8)}` +
        `${padL(verdict(r.steady >= 2 && r.intense >= 2), 11)}${padL(verdict(r.care >= 2 && r.grind >= 2), 11)}`,
    )
  }
  console.log(`    ${'─'.repeat(114)}`)
  console.log('    "STEADY"/"INTENSE" pool the two policy arms; "care"/"grind" pool the two intensity arms – section [1]\'s own reading.')
  console.log('    "both int." = both INTENSITY arms ≥ 2.00 · "both pol." = both POLICY arms ≥ 2.00, which is how section [1] states it.')

  console.log(`\n    1B · WHAT THE SETTING COSTS. Every column is measured on the same run as its 1A row.`)
  console.log(
    `    ${pad('steady/intense', 16)}${padL('@70.0 all', 11)}${padL('@70.0 care', 12)}${padL('< 60 knee', 11)}${padL('mean', 8)}${padL('bar 2', 12)}` +
      `${padL('fair worst', 12)}${padL('bar 5', 8)}${padL('min band', 10)}${padL('narrowest', 11)}   cut points (descending)`,
  )
  console.log(`    ${'─'.repeat(144)}`)
  for (const r of rows) {
    console.log(
      `    ${pad(r.label, 16)}${padL(r.at70all.toFixed(2) + '%', 11)}${padL(r.at70care.toFixed(2) + '%', 12)}` +
        `${padL(r.under60.toFixed(2) + '%', 11)}${padL(r.meanAll.toFixed(2), 8)}${padL(bar2Label(r.bar2rails, r.bar2mean), 12)}` +
        `${padL(r.fairWorst.toFixed(3) + 'pp', 12)}${padL(verdict(r.fairWorst <= 1.5), 8)}` +
        `${padL(r.minBand.toFixed(2) + '%', 10)}${padL(Number.isFinite(r.narrowest) ? r.narrowest.toFixed(1) : '–', 11)}   ` +
        `${[...r.cuts].reverse().map((c) => c.toFixed(1)).join('  ·  ')}`,
    )
  }
  console.log(`    ${'─'.repeat(144)}`)
  console.log('    "@70.0" = weeks sitting at EXACTLY the baseline – the erasure bar 1 fails on. "< 60 knee" = the only weeks')
  console.log('      `spiritMatchFactor` is not 1.0, i.e. the only weeks either number reaches the tennis at all.')
  console.log('    "mean"/"bar 2" = the long-run spirit mean over all weeks, and BAR 2 held PER TEMPERAMENT ARM. Its two halves are')
  console.log('      reported apart: "FAIL rails" = some arm put ≥ 2% of weeks below 20 or above 95, "FAIL mean" = some arm drifted')
  console.log('      out of 70 ± 4, "FAIL both" = both. They fail for different reasons and cost different things.')
  console.log('    ⚠ "fair worst"/"bar 5" = the worst temperament pair\'s |mean Δ| lifetime win rate against the ±1.5 pp corridor.')
  console.log('      A HARD BAR, recomputed on every row: a slower return may not buy bar 1 by breaching who-she-is §4.')
  console.log('    "min band" = the largest share the SMALLEST of five Mood words can hold, cut points free (bar 6 is ≥ 2%).')
  console.log('    ⚠ "narrowest" = the WIDTH IN SPIRIT POINTS of the narrowest INTERIOR band of that best split, and it is the')
  console.log('      number a tile actually lives on: at the shipped value the best cuts make one word 0.3 points wide, which is')
  console.log('      a word that changes on a rounding difference. The two outer bands are open-ended and have no width to measure.')
}

// --- SWEEP 2: THE BOND REGRESSION ----------------------------------------------------------------

function sweepBond(): void {
  rule(
    `SWEEP 2 – ECONOMY.bond.regressionPerWeek, everything else held at the shipped value\n` +
      `${SEED_COUNT} seeds × ${SEASONS} seasons × {care, grind} × 4 temperaments, re-run per row\n` +
      `⚠⚠ THE COST IS IN THE SAME TABLE, ON THE SAME ROW. Build plan §1d states the memory property as\n` +
      `  «a −25 season heals in ~50 weeks, which is §4a.3's recoverability», and 25 / 0.5 = 50 IS the\n` +
      `  shipped value. Lowering this dial buys bar 3 and sells recoverability; both halves are here.`,
  )
  console.log(
    `    ${pad('regression', 16)}${padL('gap @ S3', 11)}${padL('± SEM', 9)}${padL('≥ 12', 7)}${padL('> 2×SEM', 10)}` +
      `${padL('care med', 10)}${padL('grind med', 11)}${padL('at 0 %', 9)}${padL('at 100 %', 10)}${padL('clamped', 9)}` +
      `${padL('eff. step/wk', 14)}${padL('−25 heals in', 14)}${padL('sd care', 10)}${padL('fair worst', 12)}`,
  )
  console.log(`    ${'─'.repeat(153)}`)
  for (const value of REGRESSION_VALUES) {
    BOND_DIAL.regressionPerWeek = value
    const cs = runGrid()
    const g = bondGapAtSeason3(cs)
    const bondOf = (arm: Arm) => flat(cs.filter((c) => c.arm === arm), (c) => c.bond)
    const careBond = bondOf('care')
    const grindBond = bondOf('grind')
    const bothBond = [...careBond, ...grindBond]
    const careMed = median(careBond)
    const grindMed = median(grindBond)
    const clamped = [careMed, grindMed].some((m) => m === ECONOMY.bond.min || m === ECONOMY.bond.max)
    const step = effectiveBondStep()
    const heal = healWeeksForMinus25()
    const label = `${value.toFixed(1)}${value === 0.5 ? ' ◄ shipped' : ''}`
    console.log(
      `    ${pad(label, 16)}${padL(g.gap.toFixed(2), 11)}${padL(g.sem.toFixed(3), 9)}${padL(verdict(g.gap >= 12), 7)}` +
        `${padL(verdict(g.gap > 2 * g.sem), 10)}${padL(careMed.toFixed(2), 10)}${padL(grindMed.toFixed(2), 11)}` +
        `${padL(pct(bothBond.filter((x) => x === ECONOMY.bond.min).length, bothBond.length).toFixed(2) + '%', 9)}` +
        `${padL(pct(bothBond.filter((x) => x === ECONOMY.bond.max).length, bothBond.length).toFixed(2) + '%', 10)}` +
        `${padL(clamped ? 'YES' : 'no', 9)}${padL(step.toFixed(2), 14)}${padL(healLabel(heal), 14)}` +
        `${padL(meanCareerSd(cs.filter((c) => c.arm === 'care')).toFixed(2), 10)}${padL(fairnessWorst(cs).toFixed(3) + 'pp', 12)}`,
    )
  }
  console.log(`    ${'─'.repeat(153)}`)
  console.log(`    "gap @ S3" = the mean of ${SEED_COUNT} PAIRED per-seed care−grind differences at the end of season 3; BAR 3 is ≥ 12 AND > 2×SEM.`)
  console.log('    "care med"/"grind med" = the arm\'s bond median over every resolved week (bar 4\'s own reading); "clamped" = either median at 0 or 100.')
  console.log('    ⚠⚠ "eff. step/wk" = what ONE week of the regression is actually worth at that dial, measured by running `accrueSpirit`')
  console.log('       once. It is NOT the dial: `roundHalf` lands every bond write on `ECONOMY.bond.step` (0.5), so 0.4 and 0.3 round UP')
  console.log('       to a full half-point and 0.2 and 0.1 round DOWN to zero. Rows that read identically are that quantisation, not a')
  console.log('       dial that failed to apply – a dial that never reached the engine would print ONE number down the whole column.')
  console.log('    ⚠⚠ "−25 heals in" = weeks of `accrueSpirit` for a bond of 45 to reach 70 again, MEASURED through the engine\'s own')
  console.log('       weekly rule and NOT computed as 25/rate – every bond write is rounded onto `ECONOMY.bond.step` (0.5), so a rate')
  console.log('       below half a step can move nothing at all and "never" is then the honest reading, not a large number.')
  console.log('    "sd care" and "fair worst" are invariance checks: bond has no reader anywhere in the match, so they should not move.')
}

const SWEEP = sweepMode()
if (SWEEP !== null) {
  runSweep(SWEEP)
  process.exit(0)
}

// =================================================================================================
// ⭐⭐⭐ T12 – THE PUSH-THROUGH PAIR – `npm run bench:spirit -- --push`
// =================================================================================================
//
// ⚠⚠ WHAT THIS IS. Wave 1 shipped the push-through PRICE – bond +1 / −3 / −5 at `decideKnock`, and
// spirit −2 on every week a push governs – and shipped it WITHOUT the paired measurement CLAUDE.md
// invariant 5 owes every balance change («balance changes ship with a bench run and a spec recording
// predicted vs measured»). That debt is wave 3's T12 and this block is the payment: one clean pair,
// identical policy except the knock answer, 64 seeds × 4 temperaments.
//
// ⚠⚠ IT DOES NOT TOUCH THE TWO ARMS ABOVE AND MUST NOT. `care` / `grind` move THREE decisions at
// once (the knock, the family week, the exam plan) because they are pricing the BOND, and they
// answer her beats non-neutrally on purpose – that is the runbook's grid and every bar in this file
// is read off it. A pair that prices ONE decision cannot be carved out of a grid that moves three,
// so this is its own walk with its own policy. The `--push` flag exits before THE RUN below, exactly
// as `--sweep` does, so the default printout is byte-identical to what it was before this existed.
//
// THE PAIR, and every clause is HELD EQUAL rather than merely unmentioned:
//
//   arm A  rest    `decideKnock(world, 'rest')` on every knock
//   arm B  push    `decideKnock(world, 'push')` on every knock
//
//   · `balanced` every week in both arms, so the exam row (`train >= examTrainFloor`) cannot fire in
//     either. The care/grind arms vary the exam plan deliberately; a knock pair must not.
//   · THE FAMILY WEEKS ARE BOOKED IN BOTH ARMS (off-season 50/51, `staycation`, free at `wealthy`),
//     so the season-wrap `seasonWithNoVacation` row (−3 bond AND −3 spirit) cannot fire in either.
//     Both of those rows would cancel in a paired difference anyway – they are held out because they
//     are worth four weeks under the baseline apiece, and number 2 below counts weeks.
//   · the same entry policy (`enterWhatSheCan`), the same birthday answer (`answerTheBirthday`), and
//     every life beat drained at its own bond-neutral price in both arms.
//   · `wealthy`, `DEFAULT_PROFILE`, assigned temperament – this file's own three choices, unchanged.
//
// ⚠⚠ AND THE CAREER IS SELF-COACHED (`coachTier: 'self'`), WHICH IS THE ONE POLICY CHOICE THIS BLOCK
// MAKES THAT THE BAR GRID DOES NOT – MEASURED, not preferred. `DEFAULT_PROFILE` is `middle`, and
// `coachManagesLoad` is true for every rung but `self`: a hired coach ANSWERS most knocks himself
// inside the tick (`coachDecidesKnock`), escalating to the parent only when `coachEscalates` says
// so, and his answer moves no bond at all («the hired coach answering on his own is the one knock
// path the parent did not take» – world/knock.ts). Two things follow and both are fatal to this
// pair: the parent is asked about only a fraction of her knocks, so "arm A rests EVERY knock" is
// simply not what the walk does; and the push-governed weeks in arm A are then NOT zero – they are
// the coach's, and the spirit row fires for a decision neither arm made. Run
// `npm run bench:spirit -- --push --coached` to reproduce that reading at the shipped `middle` rung:
// it prints the same census with the coach's own column filled in, and it is why the default is
// `self`. ⚠ `'self'` is a first-class rung (`CoachTier`, «the parent on the court»), not a poke: it
// reaches the world through `openingCoachId`, which returns null for it, and nothing is written
// behind the engine's back.
//
// ⚠⚠ THE ANTI-STALL CONTRACT, AND IT IS THE POINT OF THE BLOCK RATHER THAN A PRECAUTION. This file
// spent a wave printing a full census while answering NOTHING (842 beats raised, 0 answered, exit 0
// – see the wave-2 banner above §"THE TWO ARMS ANSWER HER"), so a pair that can report a price it
// did not measure is not an instrument. Four properties, and the run DIES rather than prints if any
// of them fails:
//
//   1. THE ARMS ARE COUNTED, NOT ASSUMED. Every knock that ARRIVED is counted, every one the parent
//      was asked about is counted, every answer is counted, and BOTH ledgers have to balance:
//      `asked + coach-decided === arrived` and `answered + latched === asked`, per arm. Arm B must
//      record pushes > 0 and arm A rests > 0 – printed beside every price, never in a comment.
//   2. NO `try/catch` STANDS BETWEEN A KNOCK AND ITS ANSWER. `decideKnock` is called bare. Its one
//      legitimate refusal on this walk – `guardNotEnded`, when the tick that raised the knock also
//      ended the career – is handled by TESTING the latch instead of catching its throw, and those
//      knocks are counted into their own printed column. Any other refusal propagates and kills the
//      run, which is the behaviour the swallowed throw of v74 did not have.
//   3. THE TWO ARMS ARE PROVEN TO HAVE TAPPED ONE MAIN STREAM, per week, by a counting wrapper that
//      takes no draw of its own – see `runPushCareer`. A pair whose draw counts or draw hashes
//      diverge is measuring the seed and not the choice, and is a hard failure.
//   4. EVERY PRINTED NUMBER CARRIES ITS OWN `n`, and a number with n = 0 is a failure, not a dash.
//
// ⚠⚠ AND NOTHING HERE CHANGES A CONSTANT. Same ruling as the sweeps and the bars: a measurement that
// disagrees with the delta table's prediction IS the finding, and retuning is the owner's call on
// the record (who-she-is §4a).

/** ⚠⚠ THE ARM **IS** THE KNOCK ANSWER, which is the strongest statement of «the two arms differ only
 *  in the knock answer» that can be made in code rather than in prose: the arm label is a
 *  `KnockChoice`, the walker reads `arm` in exactly ONE expression (`decideKnock(world, arm)`), and
 *  there is no second branch anywhere in this block for a difference to hide in. */
const PUSH_ARMS = ['rest', 'push'] as const
type PushArm = (typeof PUSH_ARMS)[number]

const PUSH_MODE = process.argv.includes('--push')
/** ⚠ THE CONTROL FOR THE PARAGRAPH ABOVE, NOT A SECOND MEASUREMENT. `--push --coached` runs the same
 *  pair at `DEFAULT_PROFILE`'s shipped `middle` rung, where the coach answers most knocks himself –
 *  so the reason the default is self-coached is a command anyone can re-run rather than a number
 *  quoted in a comment. Its arms are NOT "rest/push every knock" and its printout says so. */
const PUSH_COACHED = process.argv.includes('--coached')
const PUSH_COACH_TIER = PUSH_COACHED ? DEFAULT_PROFILE.coachTier : 'self'

/** The brief's grid is 64 seed-pairs; `--seeds=N` shrinks it for a smoke run and the printout says
 *  so in its own header rather than letting a 4-seed run be read as the measurement. */
const PUSH_SEEDS_ASKED = 64
function pushSeedCount(): number {
  const flag = process.argv.find((a) => a.startsWith('--seeds='))
  if (flag === undefined) return PUSH_SEEDS_ASKED
  const n = Number(flag.slice('--seeds='.length))
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : PUSH_SEEDS_ASKED
}

interface PairCareer {
  seed: string
  arm: PushArm
  temperament: Temperament
  weeks: number
  endedAs: string | null
  // --- the census that makes a stall visible ----------------------------------------------------
  /** every knock that ARRIVED in this career, whoever ended up answering it. */
  knocksArrived: number
  /** ...of which the coach answered inside the tick and the parent was never asked about. Zero is
   *  the whole point of the self-coached profile, and it is CHECKED rather than assumed. */
  knocksCoachDecided: number
  /** ...and of which the parent was asked (`pendingKnock` true after the tick). */
  knocksAsked: number
  knocksAnswered: number
  /** asked by the same tick that ended the career – `decideKnock` would refuse, so it is COUNTED
   *  and printed instead of being caught. `answered + latched === asked` is checked. */
  knocksLatched: number
  rests: number
  pushesFirst: number
  pushesRepeat: number
  /** weeks `knockGoverns` says a push is being paid for – the engine's own rule, not 3 × pushes. */
  pushGovernedWeeks: number
  /** ⭐ THE DELTA TABLE, MEASURED AT THE DECISION ITSELF: what `world.bond` actually moved by across
   *  each `decideKnock` call, against what `ECONOMY.bond.delta` says that answer is worth. This is
   *  the ONE reading that can tell «the delta never landed» from «the delta landed and the weekly
   *  regression paid it back», which is the whole question [P1] below turns on. */
  knockBondMeasured: number
  knockBondPredicted: number
  knockDeltaMismatches: number
  // --- the three prices -------------------------------------------------------------------------
  bond: number[]
  spirit: number[]
  weeksUnderBaseline: number
  weeksUnderKnee: number
  minSpirit: number
  matchesPlayed: number
  matchesWon: number
  injuries: number
  weeksInjured: number
  attachedWeeks: number
  episodeWeeks: number[]
  /** how many life beats `drainLifeBeats` cleared – printed for the same reason every other counter
   *  in this block is: a drain that never ran is indistinguishable from a walk with nothing to drain
   *  until somebody prints the number. */
  beatsDrained: number
  /** the two the SHARED helpers write - `bookTheFamilyWeeks` and `answerTheBirthday`. They are here
   *  so this pair can call the bar grid's own implementations instead of growing a second copy of
   *  the off-season rule and the birthday answer. */
  vacations: number
  asks: string[]
  // --- the invariance trace ---------------------------------------------------------------------
  /** cumulative MAIN draws after every resolved week, and a cumulative hash of the VALUES drawn. */
  mainDrawsAtWeek: number[]
  mainHashAtWeek: number[]
}

/** Every life beat, answered at its own bond-neutral price, in BOTH arms – this pair prices one
 *  decision and a beat is not it.
 *
 *  ⚠ THE ONE TOLERATED REFUSAL IS THE TERMINAL LATCH, tested against the engine's OWN string, and
 *  ANYTHING ELSE IS RETHROWN on purpose. A beat kind with no bond-neutral answer must stop this run,
 *  not be swallowed: the swallowed version of this exact `catch` is what left the census above
 *  printing 842 beats raised and zero answered while exiting 0. */
function drainEveryBeat(world: WorldState): number {
  try {
    return drainLifeBeats(world)
  } catch (e) {
    if (!(e instanceof Error) || e.message !== CAREER_ENDED_REFUSAL) throw e
    return 0
  }
}

function runPushCareer(seed: string, arm: PushArm, temperament: Temperament): PairCareer {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachTier: PUSH_COACH_TIER })
  // ⚠ the same single field the bar grid writes, for the same reason – see the file header.
  world.temperament = temperament

  // ⚠⚠ THE COUNTING WRAPPER TAKES NO DRAW OF ITS OWN. It calls the same generator, in the same
  // order, and returns the same value; what it adds is a POSITION, which is the only way two arms
  // can be proven to have tapped one stream instead of being expected to. `rngFromSeed(world.seed)`
  // is the world's own MAIN, exactly as every other bench drives it – zero new RNG, on any stream.
  const main = rngFromSeed(world.seed)
  let draws = 0
  let hash = 0x811c9dc5 | 0
  const rng: Rng = () => {
    const v = main()
    draws++
    hash = Math.imul(hash ^ Math.floor(v * 0x100000000), 16777619) | 0
    return v
  }

  const career: PairCareer = {
    seed,
    arm,
    temperament,
    weeks: 0,
    endedAs: null,
    knocksArrived: 0,
    knocksCoachDecided: 0,
    knocksAsked: 0,
    knocksAnswered: 0,
    knocksLatched: 0,
    rests: 0,
    pushesFirst: 0,
    pushesRepeat: 0,
    pushGovernedWeeks: 0,
    knockBondMeasured: 0,
    knockBondPredicted: 0,
    knockDeltaMismatches: 0,
    bond: [],
    spirit: [],
    weeksUnderBaseline: 0,
    weeksUnderKnee: 0,
    minSpirit: Number.POSITIVE_INFINITY,
    matchesPlayed: 0,
    matchesWon: 0,
    injuries: 0,
    weeksInjured: 0,
    attachedWeeks: 0,
    episodeWeeks: [],
    beatsDrained: 0,
    vacations: 0,
    asks: [],
    mainDrawsAtWeek: [],
    mainHashAtWeek: [],
  }

  for (let i = 0; i < WEEKS; i++) {
    if (world.ending !== null) break
    // The family weeks are booked in BOTH arms - see the block header for why this is held equal
    // rather than made an arm difference.
    if (world.week % WEEKS_PER_YEAR === 0) bookTheFamilyWeeks(world, career)
    world.plan = { ...WEEK_PLAN_PRESETS.balanced }
    enterWhatSheCan(world)

    tickWeek(world, rng)
    career.weeks++
    career.mainDrawsAtWeek.push(draws)
    career.mainHashAtWeek.push(hash)
    career.spirit.push(world.spirit)
    if (world.spirit < ECONOMY.spirit.baseline) career.weeksUnderBaseline++
    if (world.spirit < ECONOMY.spirit.knee) career.weeksUnderKnee++
    career.minSpirit = Math.min(career.minSpirit, world.spirit)
    if (activeEpisode(world) !== null) career.attachedWeeks++
    // ⚠ READ HERE, BEFORE THIS WEEK'S DECISIONS: `accrueSpirit` has already run inside the tick and
    // has already asked this same question, so this counts the weeks the `knockPushedWeek` row
    // actually fired rather than the weeks a bench thinks it should have.
    if (knockGoverns(world.knock, world.week) && world.knock?.choice === 'push') career.pushGovernedWeeks++
    if (world.injury !== null) {
      career.weeksInjured++
      if (world.injury.sinceWeek === world.week) career.injuries++
    }

    while (world.pendingTournament) {
      if (!world.pendingTournament.finished) skipTournament(world)
      closeTournament(world)
    }

    // --- ⭐⭐⭐ THE ONE DECISION THE ARMS DISAGREE ABOUT, AND THE ONLY READ OF `arm` IN THIS WALK ----
    //
    // ⚠ THE ARRIVAL IS COUNTED SEPARATELY FROM THE ASK, because they are not the same number on a
    // coached career: `rollKnock` calls `coachDecidesKnock` inside the tick, and a knock he answered
    // himself never reaches `pendingKnock`. Both ledgers are printed and both have to balance.
    if (world.knock !== null && world.knock.sinceWeek === world.week) {
      career.knocksArrived++
      if (!pendingKnock(world)) career.knocksCoachDecided++
    }
    if (pendingKnock(world)) {
      career.knocksAsked++
      if (world.ending === null) {
        // ⚠ the repeat flag is the WORLD's (`k.repeat`, engine/knock.ts `pushedParts`), read before
        // the answer so the −3 and the −5 rows can be predicted apart from the delta table below.
        const repeat = world.knock?.repeat === true
        const predicted =
          arm === 'rest' ? ECONOMY.bond.delta.knockRest : repeat ? ECONOMY.bond.delta.knockPushRepeatPart : ECONOMY.bond.delta.knockPush
        const bondBeforeDecision = world.bond
        // ⚠⚠ NO `try/catch`. `decideKnock`'s only legitimate refusal on this walk is `guardNotEnded`
        // on a career the same tick ended, and that case is TESTED above rather than caught – so any
        // other refusal propagates, kills the run, and cannot be mistaken for a measurement.
        decideKnock(world, arm)
        const landed = world.bond - bondBeforeDecision
        career.knockBondMeasured += landed
        career.knockBondPredicted += predicted
        // ⚠ A CLAMP IS THE ONLY LEGAL DISAGREEMENT (`ECONOMY.bond.min`/`max`); anything else would be
        // a delta that did not land, which is exactly what this counter exists to make visible.
        if (landed !== predicted) career.knockDeltaMismatches++
        career.knocksAnswered++
        if (arm === 'rest') career.rests++
        else if (repeat) career.pushesRepeat++
        else career.pushesFirst++
      } else {
        career.knocksLatched++
      }
    }
    answerTheBirthday(world, career)
    career.beatsDrained += drainEveryBeat(world)

    career.bond.push(world.bond)
  }

  career.endedAs = world.ending === null ? null : world.ending.type
  career.matchesPlayed = matchesEverPlayed(world)
  career.matchesWon = world.seasonWins + world.seasonHistory.reduce((sum, h) => sum + h.wins, 0)
  career.episodeWeeks = (world.loveEpisodes ?? []).map((e) => e.sinceWeek)
  return career
}

interface Pair {
  seed: string
  temperament: Temperament
  rest: PairCareer
  push: PairCareer
  /** the last week BOTH arms resolved – a pushed career that ended early is a shorter arm, and a
   *  reading taken off a week one of the two never saw is not a paired reading. */
  horizon: number
  full: boolean
}

interface Stat {
  mean: number
  sem: number
  n: number
}

function stat(xs: readonly number[]): Stat {
  const d = xs.filter((x) => !Number.isNaN(x))
  return { mean: mean(d), sem: sem(d), n: d.length }
}

/** ⚠⚠ EVERY HEADLINE NUMBER IS FOLDED TO ONE VALUE PER SEED BEFORE ITS SEM IS TAKEN – section [3]'s
 *  own construction, and here it is not a refinement but a correction. The four temperament arms are
 *  the SAME seeds played four times over, and in wave 1 `temperament` is read by nothing but
 *  `temperamentIntensity` inside `accrueSpirit`, while `spiritMatchFactor` is flat 1.0 above the
 *  knee – so for the bond gap and the match-pp cost the four rows are four REPLICAS, not four
 *  samples. MEASURED rather than argued: the per-temperament table below prints an identical knock
 *  census, an identical bond gap and an identical Δ pp down all four rows. Pooling 4 × 64 as if it
 *  were 256 independent pairs would halve every SEM in this block for free. */
function foldBySeed(pairs: readonly Pair[], pick: (p: Pair) => number): number[] {
  const seedIds = [...new Set(pairs.map((p) => p.seed))]
  return seedIds.map((s) => mean(pairs.filter((p) => p.seed === s).map(pick).filter((x) => !Number.isNaN(x))))
}

function say(s: Stat, digits = 2): string {
  return s.n === 0 ? 'n=0 ⚠' : `${s.mean.toFixed(digits)} ± ${s.sem.toFixed(digits + 1)} (n ${s.n})`
}

/** ⚠⚠ THE RUN DIES HERE RATHER THAN PRINTING A PRICE. Every caller is a property the pair has to
 *  have before any of its three numbers means anything; the exit code is what a gate reads. */
function stall(headline: string, detail: string): never {
  console.error(`\n${'!'.repeat(100)}`)
  console.error(`THE PUSH PAIR MEASURED NOTHING – NO PRICE IS PRINTED`)
  console.error(`  ${headline}`)
  console.error(`  ${detail}`)
  console.error(
    `  ⚠ This is the anti-stall contract firing, not a crash. A pair that cannot prove it answered\n` +
      `    knocks in both arms, on one MAIN stream, is a stall wearing a census – see the block header.`,
  )
  console.error(`${'!'.repeat(100)}\n`)
  process.exit(1)
}

function winRateOf(c: PairCareer): number {
  return c.matchesPlayed === 0 ? Number.NaN : pct(c.matchesWon, c.matchesPlayed)
}

function runPushPair(): void {
  const startedPair = Date.now()
  /** The delta table itself, read once – every "predicted" number in this block comes off it. */
  const d0 = ECONOMY.bond.delta
  const seedCountHere = pushSeedCount()
  const careers: PairCareer[] = []
  for (const arm of PUSH_ARMS) {
    for (const temperament of TEMPERAMENTS) {
      for (let s = 0; s < seedCountHere; s++) careers.push(runPushCareer(`push-${s}`, arm, temperament))
    }
  }
  const armOf = (arm: PushArm) => careers.filter((c) => c.arm === arm)
  const find = (arm: PushArm, t: Temperament, seed: string) =>
    careers.find((c) => c.arm === arm && c.temperament === t && c.seed === seed)

  const pairs: Pair[] = []
  for (const t of TEMPERAMENTS) {
    for (let s = 0; s < seedCountHere; s++) {
      const seed = `push-${s}`
      const rest = find('rest', t, seed)
      const push = find('push', t, seed)
      if (rest === undefined || push === undefined) stall('a pair is missing an arm', `${t} / ${seed}`)
      const horizon = Math.min(rest.weeks, push.weeks)
      pairs.push({ seed, temperament: t, rest, push, horizon, full: rest.weeks === WEEKS && push.weeks === WEEKS })
    }
  }

  rule(
    `THE PUSH-THROUGH PAIR (T12) – wave 1's measurement debt, paid · ${seedCountHere} seeds × 4 temperaments × {rest, push}\n` +
      `${pairs.length} seed-pairs, ${careers.length} careers, ${careers.reduce((a, c) => a + c.weeks, 0).toLocaleString('en-US')} resolved weeks · ` +
      `the grid is ${WEEKS} weeks (${FORK_MODE ? '--fork' : `${SEASONS} seasons`})\n` +
      `IDENTICAL POLICY EXCEPT THE KNOCK ANSWER: balanced plan every week in both arms · the family weeks booked in BOTH ·\n` +
      `  one entry policy · one birthday answer · every life beat drained bond-neutrally in both · constants read, none changed\n` +
      `coach rung: ${PUSH_COACH_TIER}` +
      (PUSH_COACHED
        ? `  ⚠⚠ --coached: THE CONTROL, NOT THE MEASUREMENT. At this rung \`coachDecidesKnock\` answers most knocks inside\n` +
          `   the tick and moves no bond, so NEITHER arm rests-or-pushes every knock and the three prices below are not T12's.\n` +
          `   It exists to print the "coach decided" column the default run has to show as zero.\n`
        : `  (self-coached on purpose – see the block header; the "coach decided" column below is the proof, and it must be 0)\n`) +
      (seedCountHere < PUSH_SEEDS_ASKED
        ? `⚠⚠ SMOKE RUN – ${seedCountHere} seeds is BELOW the brief's ${PUSH_SEEDS_ASKED} seed-pairs and these numbers are not the measurement.\n`
        : ''),
  )

  // --- P0. THE ARMS DID THE THING -----------------------------------------------------------------
  console.log(`\n    [P0] THE ARMS DID THE THING – counted, never assumed. Every price below is void if a cell here is wrong.`)
  console.log(
    `    ${pad('arm', 8)}${padL('careers', 9)}${padL('arrived', 9)}${padL('coach did', 11)}${padL('asked', 8)}${padL('answered', 10)}${padL('latched', 9)}` +
      `${padL('rests', 8)}${padL('push 1st', 10)}${padL('push rpt', 10)}${padL('gov. wks', 10)}${padL('per career', 12)}`,
  )
  console.log(`    ${'─'.repeat(114)}`)
  interface ArmTotals {
    arrived: number
    coach: number
    asked: number
    answered: number
    latched: number
    rests: number
    first: number
    repeat: number
    gov: number
    beats: number
    bondMeasured: number
    bondPredicted: number
    deltaMismatches: number
  }
  const zero = (): ArmTotals => ({
    arrived: 0, coach: 0, asked: 0, answered: 0, latched: 0, rests: 0, first: 0, repeat: 0, gov: 0, beats: 0,
    bondMeasured: 0, bondPredicted: 0, deltaMismatches: 0,
  })
  const armTotals: Record<PushArm, ArmTotals> = { rest: zero(), push: zero() }
  for (const arm of PUSH_ARMS) {
    const cs = armOf(arm)
    const tot = armTotals[arm]
    for (const c of cs) {
      tot.arrived += c.knocksArrived
      tot.coach += c.knocksCoachDecided
      tot.asked += c.knocksAsked
      tot.answered += c.knocksAnswered
      tot.latched += c.knocksLatched
      tot.rests += c.rests
      tot.first += c.pushesFirst
      tot.repeat += c.pushesRepeat
      tot.gov += c.pushGovernedWeeks
      tot.beats += c.beatsDrained
      tot.bondMeasured += c.knockBondMeasured
      tot.bondPredicted += c.knockBondPredicted
      tot.deltaMismatches += c.knockDeltaMismatches
    }
    console.log(
      `    ${pad(arm, 8)}${padL(cs.length, 9)}${padL(tot.arrived, 9)}${padL(tot.coach, 11)}${padL(tot.asked, 8)}${padL(tot.answered, 10)}${padL(tot.latched, 9)}` +
        `${padL(tot.rests, 8)}${padL(tot.first, 10)}${padL(tot.repeat, 10)}${padL(tot.gov, 10)}${padL((tot.answered / cs.length).toFixed(2), 12)}`,
    )
  }
  console.log(`    ${'─'.repeat(114)}`)
  console.log(`    "coach did" = answered inside the tick by \`coachDecidesKnock\`, which moves no bond – MUST be 0 on the self-coached default.`)
  console.log(`    "latched" = asked by the tick that ALSO ended the career, so \`decideKnock\` would refuse – tested, not caught.`)
  console.log(`    "gov. wks" = weeks \`knockGoverns\` says a push is being paid for (the engine's own rule, not ${KNOCK_PUSH_WEEKS} × pushes).`)
  console.log(
    `    ⚠ THE TWO ARMS DO NOT SEE THE SAME NUMBER OF KNOCKS, and that is the answer working rather than a broken pairing:\n` +
      `      \`knockUntilWeek\` holds a pushed knock for ${KNOCK_PUSH_WEEKS} weeks against the rested one's 1, and the cooldown runs from the\n` +
      `      RETIREMENT, so pushing buys fewer future knocks. The prediction in [P1] is therefore computed off each arm's OWN\n` +
      `      counts, never off a shared one.`,
  )

  // --- P0a. THE DELTA TABLE, MEASURED AT THE DECISION ITSELF --------------------------------------
  console.log(`\n    [P0a] THE DELTA TABLE LANDED – what \`world.bond\` moved by across each \`decideKnock\`, against the table.`)
  console.log(`    ${pad('arm', 8)}${padL('decisions', 11)}${padL('predicted', 11)}${padL('measured', 11)}${padL('per decision', 14)}${padL('mismatches', 12)}`)
  console.log(`    ${'─'.repeat(67)}`)
  for (const arm of PUSH_ARMS) {
    const tot = armTotals[arm]
    console.log(
      `    ${pad(arm, 8)}${padL(tot.answered, 11)}${padL(tot.bondPredicted.toFixed(1), 11)}${padL(tot.bondMeasured.toFixed(1), 11)}` +
        `${padL(tot.answered === 0 ? '–' : (tot.bondMeasured / tot.answered).toFixed(3), 14)}${padL(tot.deltaMismatches, 12)}`,
    )
  }
  console.log(`    ${'─'.repeat(67)}`)
  console.log(
    `    \`knockRest\` ${d0.knockRest} · \`knockPush\` ${d0.knockPush} · \`knockPushRepeatPart\` ${d0.knockPushRepeatPart}. "mismatches" = decisions where the bond moved by\n` +
      `    something other than the table says – only a clamp at ${ECONOMY.bond.min}/${ECONOMY.bond.max} can do that legally, and a non-zero column with\n` +
      `    no clamped career is a delta that did not land. ⚠ THIS ROW IS WHAT SEPARATES «the price is nothing» from «the price\n` +
      `    was paid and the ${ECONOMY.bond.regressionPerWeek}/wk regression took it back», which is the whole of [P1].`,
  )

  // THE HARD CHECKS. Order matters: a price is printed only after every one of them passes.
  for (const arm of PUSH_ARMS) {
    const tot = armTotals[arm]
    if (tot.asked + tot.coach !== tot.arrived) {
      stall(
        `arm '${arm}': the arrival ledger does not balance`,
        `asked ${tot.asked} + coach-decided ${tot.coach} ≠ arrived ${tot.arrived} – a knock nobody is recorded as having handled.`,
      )
    }
    if (tot.answered + tot.latched !== tot.asked) {
      stall(
        `arm '${arm}' was asked about ${tot.asked} knocks and accounted for ${tot.answered + tot.latched}`,
        `answered ${tot.answered} + latched ${tot.latched} ≠ asked ${tot.asked} – a knock this arm never answered is an arm that did not run.`,
      )
    }
  }
  if (!PUSH_COACHED && armTotals.rest.coach + armTotals.push.coach !== 0) {
    stall(
      `the coach answered ${armTotals.rest.coach + armTotals.push.coach} knocks on a self-coached grid`,
      `arm A would not be resting every knock and arm B would not be pushing every one – the pair is not the pair.`,
    )
  }
  if (armTotals.rest.rests === 0) {
    stall(`arm A recorded ZERO rests`, `${armTotals.rest.asked} knocks reached the parent in the rest arm and none of them was rested.`)
  }
  if (armTotals.push.first + armTotals.push.repeat === 0) {
    stall(`arm B recorded ZERO pushes`, `${armTotals.push.asked} knocks reached the parent in the push arm and none of them was pushed through.`)
  }
  if (armTotals.push.gov === 0) {
    stall(
      `arm B pushed ${armTotals.push.first + armTotals.push.repeat} knocks and NO week was ever governed by one`,
      `\`knockPushedWeek\` therefore never fired, so number 2 below would be pricing a spirit row that never ran.`,
    )
  }
  if (armTotals.rest.first + armTotals.rest.repeat !== 0 || armTotals.push.rests !== 0) {
    stall(`the arms answered each other's answer`, `rest arm pushes ${armTotals.rest.first + armTotals.rest.repeat}, push arm rests ${armTotals.push.rests}.`)
  }
  if (armTotals.rest.bondMeasured <= 0 || armTotals.push.bondMeasured >= 0) {
    stall(
      `the knock deltas did not land on the ledger`,
      `rest arm moved bond by ${armTotals.rest.bondMeasured.toFixed(1)} (expected > 0) and the push arm by ${armTotals.push.bondMeasured.toFixed(1)} (expected < 0) across their decisions.`,
    )
  }

  // --- P0b. ONE MAIN STREAM -----------------------------------------------------------------------
  let drawMismatch = 0
  let hashMismatch = 0
  let episodeMismatch = 0
  let firstBad = ''
  for (const p of pairs) {
    for (let w = 0; w < p.horizon; w++) {
      if (p.rest.mainDrawsAtWeek[w] !== p.push.mainDrawsAtWeek[w]) {
        drawMismatch++
        if (firstBad === '') firstBad = `${p.temperament}/${p.seed} week ${w + 1}: rest ${p.rest.mainDrawsAtWeek[w]} draws vs push ${p.push.mainDrawsAtWeek[w]}`
        break
      }
      if (p.rest.mainHashAtWeek[w] !== p.push.mainHashAtWeek[w]) {
        hashMismatch++
        if (firstBad === '') firstBad = `${p.temperament}/${p.seed} week ${w + 1}: the same draw COUNT and a different value hash`
        break
      }
    }
    const upTo = (c: PairCareer) => c.episodeWeeks.filter((w) => w <= p.horizon).join(',')
    if (upTo(p.rest) !== upTo(p.push)) episodeMismatch++
  }
  console.log(`\n    [P0b] ONE MAIN STREAM, MEASURED – the two arms may not re-roll the world's dice (CLAUDE.md invariant 2).`)
  console.log(
    `    ${pad('pairs checked', 20)}${padL(pairs.length, 8)}   ` +
      `draw-count mismatches ${drawMismatch} · draw-value hash mismatches ${hashMismatch} · arrival-week mismatches ${episodeMismatch}`,
  )
  console.log(
    `    Compared week by week to each pair's COMMON horizon (a career the push ended early is a shorter arm, not a\n` +
      `    divergent stream). The counting wrapper adds a position and no draw; the hash is over the VALUES drawn.`,
  )
  if (drawMismatch > 0 || hashMismatch > 0) {
    stall(`the two arms did NOT tap the same MAIN stream`, `${drawMismatch} draw-count and ${hashMismatch} hash mismatches – first: ${firstBad}`)
  }
  if (episodeMismatch > 0) {
    stall(
      `the two arms drew DIFFERENT arrival weeks (${episodeMismatch} pairs)`,
      `the arrival is keyed on (seed, calendar) alone, so a knock answer that moves it is a broken invariant, not a price.`,
    )
  }
  console.log(`    → the arms differ in the knock answer and in nothing the dice can see.`)

  // --- P0c. WHAT THE WALK COST --------------------------------------------------------------------
  console.log(`\n    [P0c] THE SHAPE OF THE TWO WALKS – printed because a truncated arm cannot be read at season end.`)
  console.log(
    `    ${pad('arm', 8)}${padL('ran full', 10)}${padL('ended early', 13)}${padL('injuries', 10)}${padL('wks injured', 13)}` +
      `${padL('family wks', 12)}${padL('birthdays', 11)}${padL('beats drained', 15)}${padL('attached wks', 14)}${padL('min spirit', 12)}${padL('wks < knee', 12)}  endings`,
  )
  console.log(`    ${'─'.repeat(146)}`)
  for (const arm of PUSH_ARMS) {
    const cs = armOf(arm)
    const full = cs.filter((c) => c.weeks === WEEKS).length
    const kinds = [...new Set(cs.filter((c) => c.endedAs !== null).map((c) => c.endedAs))]
      .map((k) => `${k} ${cs.filter((c) => c.endedAs === k).length}`)
      .join(', ')
    console.log(
      `    ${pad(arm, 8)}${padL(`${full}/${cs.length}`, 10)}${padL(cs.length - full, 13)}` +
        `${padL(cs.reduce((a, c) => a + c.injuries, 0), 10)}${padL(cs.reduce((a, c) => a + c.weeksInjured, 0), 13)}` +
        `${padL(cs.reduce((a, c) => a + c.vacations, 0), 12)}${padL(cs.reduce((a, c) => a + c.asks.length, 0), 11)}` +
        `${padL(cs.reduce((a, c) => a + c.beatsDrained, 0), 15)}${padL(cs.reduce((a, c) => a + c.attachedWeeks, 0), 14)}` +
        `${padL(Math.min(...cs.map((c) => c.minSpirit)).toFixed(1), 12)}${padL(cs.reduce((a, c) => a + c.weeksUnderKnee, 0), 12)}  ${kinds || '–'}`,
    )
  }
  console.log(`    ${'─'.repeat(146)}`)
  console.log(`    ⚠ "family wks" and "birthdays" are the HELD-EQUAL columns: both arms book the same off-season weeks and give her the`)
  console.log(`      thing she asked for. They differ only where a pushed career ended early and stopped booking – see "ended early".`)
  console.log(`    "beats drained" = rows \`drainLifeBeats\` cleared at their own bond-neutral price. Printed, not assumed: a drain that`)
  console.log(`      never ran and a walk with nothing to drain look the same until somebody counts.`)
  if (armTotals.rest.beats + armTotals.push.beats === 0) {
    console.log(`    ⚠⚠ ZERO BEATS DRAINED over the whole grid – the \`'met'\` row is raised from her sixteenth on, which is inside this`)
    console.log(`       grid, so this is a finding about the beat and not about the price. No number below reads it either way.`)
  }
  const cleanPairs = pairs.filter((p) => p.full)
  console.log(
    `    ${cleanPairs.length}/${pairs.length} pairs ran the whole ${WEEKS}-week grid in BOTH arms. The season-end readings below are those pairs;\n` +
      `    the common-horizon rows beside them use every pair, so the dropped ones cannot hide inside a selection.`,
  )
  if (cleanPairs.length === 0) {
    stall(`no pair ran the full grid in both arms`, `there is no season-end week both arms saw, so no season-end gap can be reported.`)
  }

  // --- P1. THE BOND TRAJECTORY GAP ----------------------------------------------------------------
  rule('[P1] BOND – the delta table\'s PREDICTION against the gap MEASURED at season end')
  const predictedOf = (p: Pair) =>
    p.rest.rests * d0.knockRest - (p.push.pushesFirst * d0.knockPush + p.push.pushesRepeat * d0.knockPushRepeatPart)
  const endBond = (c: PairCareer) => c.bond[c.bond.length - 1]
  const predicted = stat(foldBySeed(cleanPairs, predictedOf))
  const measuredEnd = stat(foldBySeed(cleanPairs, (p) => endBond(p.rest) - endBond(p.push)))
  const measuredCommon = stat(foldBySeed(pairs, (p) => p.rest.bond[p.horizon - 1] - p.push.bond[p.horizon - 1]))
  const measuredTrajectory = stat(foldBySeed(pairs, (p) => mean(p.rest.bond.slice(0, p.horizon)) - mean(p.push.bond.slice(0, p.horizon))))
  const seasonEnds: number[] = []
  for (let s = 1; s * WEEKS_PER_YEAR <= WEEKS; s++) seasonEnds.push(s * WEEKS_PER_YEAR)
  console.log(
    `    PREDICTED, straight off \`ECONOMY.bond.delta\` and each arm's OWN measured knock counts:\n` +
      `      rest  ${(armTotals.rest.rests / armOf('rest').length).toFixed(2)} rests × ${d0.knockRest} per career · ` +
      `push  ${(armTotals.push.first / armOf('push').length).toFixed(2)} × ${d0.knockPush} + ${(armTotals.push.repeat / armOf('push').length).toFixed(2)} × ${d0.knockPushRepeatPart} per career\n` +
      `      → ${predicted.mean.toFixed(2)} raw bond points of separation per pair over the career (± ${predicted.sem.toFixed(3)}, n ${predicted.n} seeds),\n` +
      `        and [P0a] above has already shown those points LANDING on the ledger, decision by decision.`,
  )
  console.log(
    `\n    ${pad('reading', 40)}${padL('gap', 10)}${padL('± SEM', 10)}${padL('n', 7)}   what it is`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  console.log(
    `    ${pad('PREDICTED (delta table, raw)', 40)}${padL(predicted.mean.toFixed(2), 10)}${padL(predicted.sem.toFixed(3), 10)}${padL(predicted.n, 7)}   every knock delta the two arms took, summed`,
  )
  console.log(
    `    ${pad('MEASURED at season end (week ' + WEEKS + ')', 40)}${padL(measuredEnd.mean.toFixed(2), 10)}${padL(measuredEnd.sem.toFixed(3), 10)}${padL(measuredEnd.n, 7)}   bond(rest) − bond(push), full-grid pairs`,
  )
  console.log(
    `    ${pad('MEASURED at the common horizon', 40)}${padL(measuredCommon.mean.toFixed(2), 10)}${padL(measuredCommon.sem.toFixed(3), 10)}${padL(measuredCommon.n, 7)}   the same, every pair, at min(weeks)`,
  )
  console.log(
    `    ${pad('MEASURED over the whole trajectory', 40)}${padL(measuredTrajectory.mean.toFixed(2), 10)}${padL(measuredTrajectory.sem.toFixed(3), 10)}${padL(measuredTrajectory.n, 7)}   mean weekly bond gap, the area between the curves`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  // ⚠ EVERY SEASON END AND NOT JUST THE LAST ONE, because "at season end" is a reading week and the
  // last week of this grid is an OFF-SEASON week with no knock anywhere near it. Four readings turn
  // "the endpoint is uninformative" from an excuse into a measurement.
  console.log(`    ⚠ the same gap at EVERY season end, so the choice of reading week cannot flatter or bury it:`)
  console.log(
    `      ` +
      seasonEnds
        .map((w) => {
          const g = stat(foldBySeed(pairs.filter((p) => p.horizon >= w), (p) => p.rest.bond[w - 1] - p.push.bond[w - 1]))
          return `week ${w}: ${g.n === 0 ? 'n=0' : `${g.mean.toFixed(2)} ± ${g.sem.toFixed(3)} (n ${g.n})`}`
        })
        .join('   ·   '),
  )
  // THE BRIDGE between the two, computed from the constants the way section [3] computes its own.
  const restWeeks = armOf('rest').reduce((a, c) => a + c.weeks, 0)
  const pushWeeks = armOf('push').reduce((a, c) => a + c.weeks, 0)
  const restRate = armTotals.rest.answered / restWeeks
  const pushRate = armTotals.push.answered / pushWeeks
  const restPerWeek = armTotals.rest.bondMeasured / restWeeks
  const pushPerWeek = armTotals.push.bondMeasured / pushWeeks
  console.log(
    `\n    ⚠ THE ARITHMETIC CEILING, and it is why those rows disagree with the prediction. Bond regresses a FLAT\n` +
      `      ${ECONOMY.bond.regressionPerWeek}/week toward ${ECONOMY.bond.start}, so a displacement survives only while the arm's decisions are worth ≥ ${ECONOMY.bond.regressionPerWeek}/week:\n` +
      `        rest  ${restRate.toFixed(4)} decisions/wk, ${restPerWeek.toFixed(4)} bond/wk   ${Math.abs(restPerWeek) >= ECONOMY.bond.regressionPerWeek ? '≥' : '<'} ${ECONOMY.bond.regressionPerWeek}\n` +
      `        push  ${pushRate.toFixed(4)} decisions/wk, ${pushPerWeek.toFixed(4)} bond/wk   ${Math.abs(pushPerWeek) >= ECONOMY.bond.regressionPerWeek ? '≥' : '<'} ${ECONOMY.bond.regressionPerWeek}\n` +
      `      Neither arm is worth half a point a week, so the ${predicted.mean.toFixed(2)} raw points ARE paid (see [P0a]) and are then paid\n` +
      `      BACK between knocks. What survives to a reading week is a snapshot of how recently a knock landed.`,
  )

  // --- P2. SPIRIT WEEKS UNDER THE BASELINE ---------------------------------------------------------
  rule('[P2] SPIRIT – the weeks under the baseline that PUSHING is responsible for')
  // ⚠ THE PREDICTION IS THE DIFFERENCE IN GOVERNED WEEKS AND NOT ARM B's COUNT. On the self-coached
  // default arm A's count is zero and the two are the same number; under `--coached` it is not,
  // because the coach pushes her in BOTH arms and those weeks belong to neither arm's answer.
  const predictedWeeks = stat(foldBySeed(cleanPairs, (p) => p.push.pushGovernedWeeks - p.rest.pushGovernedWeeks))
  const measuredWeeks = stat(foldBySeed(cleanPairs, (p) => p.push.weeksUnderBaseline - p.rest.weeksUnderBaseline))
  const measuredWeeksCommon = stat(
    foldBySeed(
      pairs,
      (p) =>
        p.push.spirit.slice(0, p.horizon).filter((x) => x < ECONOMY.spirit.baseline).length -
        p.rest.spirit.slice(0, p.horizon).filter((x) => x < ECONOMY.spirit.baseline).length,
    ),
  )
  console.log(
    `    PREDICTED: the spirit table has exactly ONE row for this decision – \`perturb.knockPushedWeek\` ${ECONOMY.spirit.perturb.knockPushedWeek}, scaled by\n` +
      `      \`perturbationScale\` (${ECONOMY.spirit.perturbationScale.steady} steady / ${ECONOMY.spirit.perturbationScale.intense} intense) – and it fires on every week \`knockGoverns\` reports a push,\n` +
      `      which is ${KNOCK_PUSH_WEEKS} weeks per push. The return runs FIRST and then the row lands, so a girl sitting at the baseline ends\n` +
      `      that week under it: predicted extra weeks under ${ECONOMY.spirit.baseline} = the governed weeks arm B has and arm A does not.`,
  )
  console.log(
    `\n    ${pad('reading', 44)}${padL('weeks', 10)}${padL('± SEM', 10)}${padL('n', 7)}   what it is`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  console.log(
    `    ${pad('PREDICTED (governed weeks, B − A)', 44)}${padL(predictedWeeks.mean.toFixed(2), 10)}${padL(predictedWeeks.sem.toFixed(3), 10)}${padL(predictedWeeks.n, 7)}   weeks the \`knockPushedWeek\` row fired`,
  )
  console.log(
    `    ${pad('MEASURED (paired, full-grid pairs)', 44)}${padL(measuredWeeks.mean.toFixed(2), 10)}${padL(measuredWeeks.sem.toFixed(3), 10)}${padL(measuredWeeks.n, 7)}   weeks < ${ECONOMY.spirit.baseline}: push − rest`,
  )
  console.log(
    `    ${pad('MEASURED (paired, common horizon)', 44)}${padL(measuredWeeksCommon.mean.toFixed(2), 10)}${padL(measuredWeeksCommon.sem.toFixed(3), 10)}${padL(measuredWeeksCommon.n, 7)}   the same, every pair, to min(weeks)`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  const attachedRest = armOf('rest').reduce((a, c) => a + c.attachedWeeks, 0)
  const injuriesGap = stat(foldBySeed(cleanPairs, (p) => p.push.weeksInjured - p.rest.weeksInjured))
  const onsetGap = stat(foldBySeed(cleanPairs, (p) => p.push.injuries - p.rest.injuries))
  console.log(
    `    ⚠ THE TWO NAMED LEAKS BETWEEN THEM, so the difference is read rather than guessed:\n` +
      `      (a) THE ATTACHMENT LIFT. \`accrueSpirit\` walks toward ${ECONOMY.spirit.baseline} + ${ECONOMY.spirit.attachmentLift} while \`activeEpisode\` returns a row, so a pushed\n` +
      `          week lived at a LIFTED target lands at ~${(ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.intense).toFixed(1)}–${(ECONOMY.spirit.baseline + ECONOMY.spirit.attachmentLift + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.steady).toFixed(1)} and is NOT under the baseline. ${attachedRest} attached weeks in the rest arm.\n` +
      `      (b) THE INJURY CHANNEL. Pushing multiplies the injury threshold, and \`injuryOnset\` ${ECONOMY.spirit.perturb.injuryOnset} / \`laidUpWeek\` ${ECONOMY.spirit.perturb.laidUpWeek} put her\n` +
      `          under the baseline for weeks the knock row never wrote: ${say(onsetGap)} extra onsets and ${say(injuriesGap)} extra injured\n` +
      `          weeks per pair. ⚠ The arm totals in [P0c] are the blunter reading of the same thing and are the larger signal.\n` +
      `      Both are consequences of pushing rather than confounds – the prediction is the ROW's own weeks, the measurement is\n` +
      `      the decision's, and the distance between them is what the row alone does not tell the owner.`,
  )

  // --- P3. THE PAIRED MATCH-PP COST ----------------------------------------------------------------
  rule('[P3] THE PAIRED MATCH-pp COST OF PUSHING – paired seed-for-seed, temperament-for-temperament')
  const ppClean = stat(foldBySeed(cleanPairs, (p) => winRateOf(p.push) - winRateOf(p.rest)))
  const ppAll = stat(foldBySeed(pairs, (p) => winRateOf(p.push) - winRateOf(p.rest)))
  const matchesGap = stat(foldBySeed(cleanPairs, (p) => p.push.matchesPlayed - p.rest.matchesPlayed))
  const kneeWeeks = PUSH_ARMS.map((a) => `${a} ${armOf(a).reduce((x, c) => x + c.weeksUnderKnee, 0)}`).join(' · ')
  const allWeeks = careers.reduce((a, c) => a + c.weeks, 0)
  console.log(
    `    PREDICTED through the SPIRIT channel: 0.000 pp. \`spiritMatchFactor\` is flat 1.0 at and above the knee (${ECONOMY.spirit.knee})\n` +
      `      and the push row alone lands her at ~${(ECONOMY.spirit.baseline + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.intense).toFixed(1)}–${(ECONOMY.spirit.baseline + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.steady).toFixed(1)}, which is ${(ECONOMY.spirit.baseline + ECONOMY.spirit.perturb.knockPushedWeek * ECONOMY.spirit.perturbationScale.intense - ECONOMY.spirit.knee).toFixed(1)} points clear of it – so pushing cannot reach the\n` +
      `      match through spirit. ⚠ MEASURED rather than asserted: weeks under the knee, ${kneeWeeks}, out of ${allWeeks.toLocaleString('en-US')}. Not zero (an\n` +
      `      injury onset is ${(ECONOMY.spirit.perturb.injuryOnset * ECONOMY.spirit.perturbationScale.intense).toFixed(1)} and gets there on its own), and far too rare to carry a win rate.\n` +
      `      Whatever the measurement shows is therefore the OTHER trade: resting gives up ${(100 * (1 - KNOCK_REST_GROWTH)).toFixed(0)}% of a week's development\n` +
      `      (\`KNOCK_REST_GROWTH\` ${KNOCK_REST_GROWTH}), pushing keeps the week whole and buys a loaded injury roll. The delta table predicts no sign.`,
  )
  console.log(`\n    ${pad('reading', 44)}${padL('Δ pp', 10)}${padL('± SEM', 10)}${padL('n', 7)}   what it is`)
  console.log(`    ${'─'.repeat(112)}`)
  console.log(`    ${pad('PREDICTED (spirit channel)', 44)}${padL('0.000', 10)}${padL('–', 10)}${padL('–', 7)}   the factor never leaves 1.0 above the knee`)
  console.log(
    `    ${pad('MEASURED (full-grid pairs)', 44)}${padL(ppClean.mean.toFixed(3), 10)}${padL(ppClean.sem.toFixed(3), 10)}${padL(ppClean.n, 7)}   win rate: push − rest`,
  )
  console.log(
    `    ${pad('MEASURED (every pair)', 44)}${padL(ppAll.mean.toFixed(3), 10)}${padL(ppAll.sem.toFixed(3), 10)}${padL(ppAll.n, 7)}   the same, truncated arms included`,
  )
  console.log(
    `    ${pad('matches PLAYED (full-grid pairs)', 44)}${padL(matchesGap.mean.toFixed(2), 10)}${padL(matchesGap.sem.toFixed(3), 10)}${padL(matchesGap.n, 7)}   push − rest, in matches`,
  )
  console.log(`    ${'─'.repeat(112)}`)
  console.log(
    `    ${pad('lifetime win rate', 22)}` +
      PUSH_ARMS.map((a) => `${a} ${mean(armOf(a).map(winRateOf).filter((x) => !Number.isNaN(x))).toFixed(2)}%`).join('  ·  ') +
      `   ⚠ unpaired, for scale only – the paired rows above are the reading.`,
  )

  // --- PER TEMPERAMENT -----------------------------------------------------------------------------
  console.log(`\n    PER TEMPERAMENT – A DIAGNOSTIC AND NOT FOUR SAMPLES. It is also the EVIDENCE for the fold above: the knock`)
  console.log(`    census, the bond gap and the Δ pp read identically down all four rows, because in wave 1 \`temperament\` reaches`)
  console.log(`    nothing but \`accrueSpirit\` and spirit never reaches the match above the knee. Only "wks < 70" is allowed to move.`)
  console.log(
    `    ${pad('temperament', 14)}${padL('pairs', 7)}${padL('full', 7)}${padL('pred bond', 11)}${padL('bond @ end', 12)}` +
      `${padL('pred wks', 10)}${padL('wks < 70', 10)}${padL('Δ pp', 10)}${padL('pushes', 9)}${padL('rests', 8)}`,
  )
  console.log(`    ${'─'.repeat(98)}`)
  for (const t of TEMPERAMENTS) {
    const ps = pairs.filter((p) => p.temperament === t)
    const cl = ps.filter((p) => p.full)
    const pushes = ps.reduce((a, p) => a + p.push.pushesFirst + p.push.pushesRepeat, 0)
    const rests = ps.reduce((a, p) => a + p.rest.rests, 0)
    console.log(
      `    ${pad(t, 14)}${padL(ps.length, 7)}${padL(cl.length, 7)}${padL(stat(cl.map(predictedOf)).mean.toFixed(2), 11)}` +
        `${padL(stat(cl.map((p) => endBond(p.rest) - endBond(p.push))).mean.toFixed(2), 12)}` +
        `${padL(stat(cl.map((p) => p.push.pushGovernedWeeks - p.rest.pushGovernedWeeks)).mean.toFixed(2), 10)}` +
        `${padL(stat(cl.map((p) => p.push.weeksUnderBaseline - p.rest.weeksUnderBaseline)).mean.toFixed(2), 10)}` +
        `${padL(stat(cl.map((p) => winRateOf(p.push) - winRateOf(p.rest))).mean.toFixed(3), 10)}${padL(pushes, 9)}${padL(rests, 8)}`,
    )
  }
  console.log(`    ${'─'.repeat(98)}`)

  // --- THE VERDICT ---------------------------------------------------------------------------------
  rule('T12 – THE THREE NUMBERS, PREDICTED AGAINST MEASURED')
  // ⚠⚠ THE TEST IS ON THE PAIRED RESIDUAL AND NOT ON TWO MEANS. Both columns are per-seed readings
  // of the SAME seeds, so "predicted − measured" is itself a paired quantity with its own SEM;
  // comparing a prediction against the measurement's SEM alone would ignore the pairing and hand the
  // verdict whichever answer the noisier column wanted. Same argument section [3] makes for its gap.
  const residual = (pred: readonly number[], meas: readonly number[]) =>
    stat(pred.map((x, i) => x - meas[i]))
  const line = (label: string, pred: string, measured: string, res: Stat, why: string) => {
    const ok = Math.abs(res.mean) <= 2 * res.sem
    console.log(
      `    ${pad(label, 38)}${padL(pred, 11)}${padL(measured, 25)}${padL(say(res), 25)}   ${ok ? 'AGREE   ' : 'DISAGREE'}  ${why}`,
    )
  }
  console.log(`    ${pad('number', 38)}${padL('predicted', 11)}${padL('measured', 25)}${padL('predicted − measured', 25)}   verdict   why`)
  console.log(`    ${'─'.repeat(170)}`)
  line(
    '1  bond gap at season end',
    predicted.mean.toFixed(2),
    say(measuredEnd),
    residual(foldBySeed(cleanPairs, predictedOf), foldBySeed(cleanPairs, (p) => endBond(p.rest) - endBond(p.push))),
    `the ${ECONOMY.bond.regressionPerWeek}/wk regression pays the raw deltas back between knocks`,
  )
  line(
    '2  spirit weeks under the baseline',
    predictedWeeks.mean.toFixed(2),
    say(measuredWeeks),
    residual(
      foldBySeed(cleanPairs, (p) => p.push.pushGovernedWeeks - p.rest.pushGovernedWeeks),
      foldBySeed(cleanPairs, (p) => p.push.weeksUnderBaseline - p.rest.weeksUnderBaseline),
    ),
    `the row's own weeks against the decision's – the lift and the injury channel`,
  )
  line(
    '3  match-win cost of pushing (pp)',
    '0.000',
    say(ppClean, 3),
    residual(
      foldBySeed(cleanPairs, () => 0),
      foldBySeed(cleanPairs, (p) => winRateOf(p.push) - winRateOf(p.rest)),
    ),
    `pushing cannot reach the match through spirit above the knee (${ECONOMY.spirit.knee})`,
  )
  console.log(`    ${'─'.repeat(170)}`)
  console.log(`    "AGREE" = the PAIRED residual's mean sits inside its own ± 2 SEM. It is a READING, not a bar: nothing here passes or fails.`)
  console.log(`    ⚠ Every n above is a SEED, not a career: the four temperament arms are the same seeds replayed – see the fold's own note.`)
  console.log(
    `\n    ⚠⚠ A DISAGREEMENT IS THE FINDING AND NOT A LICENCE. This block read \`ECONOMY.bond.delta\`, \`ECONOMY.spirit.perturb\`\n` +
      `       and \`ECONOMY.bond.regressionPerWeek\` and changed none of them; retuning is the owner's call on the record.`,
  )
  console.log(
    `\n    ⚠ AND THE PRICES ABOVE ARE ONLY AS REAL AS [P0]: rests ${armTotals.rest.rests} · pushes ${armTotals.push.first + armTotals.push.repeat} ` +
      `(${armTotals.push.first} first, ${armTotals.push.repeat} repeat) · push-governed weeks ${armTotals.push.gov} (arm A ${armTotals.rest.gov}) ·\n` +
      `      coach-decided knocks ${armTotals.rest.coach + armTotals.push.coach} · knocks unaccounted for 0 · ` +
      `bond moved at the decisions ${armTotals.rest.bondMeasured.toFixed(1)} / ${armTotals.push.bondMeasured.toFixed(1)}.`,
  )
  console.log(`\n    ${((Date.now() - startedPair) / 1000).toFixed(1)}s`)
}

if (PUSH_MODE) {
  runPushPair()
  process.exit(0)
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
  `SPIRIT BENCH – runbook §6 (wave 1's six bars) + §7 (wave 2's beat arms) · ${SEED_COUNT} seeds × ` +
    `${FORK_MODE ? `${WEEKS} weeks` : `${SEASONS} seasons`} × {care, grind} × 4 temperaments\n` +
    (FORK_MODE
      ? `⚠⚠ --fork: THE DIAGNOSTIC GRID, NOT THE BAR GRID. The walk runs to week ${WEEKS} so the fork at ${FORK_WEEK} is\n` +
        `   reached and the wave-2 deltas can be priced. Bar 3 still reads week ${SEASON_3_WEEK} and is comparable; bars\n` +
        `   1/2/4/5/6 read a longer week series here and are NOT comparable with the four-season run.\n`
      : '') +
    `${careers.length} careers, ${careers.reduce((a, c) => a + c.weeks, 0).toLocaleString('en-US')} resolved weeks · ` +
    `constants read from ECONOMY.spirit / ECONOMY.bond, none changed\n` +
    // ⚠ A CAREER THAT ENDED EARLY IS A SHORTER ARM, and a season-3 reading taken off one that no
    // longer exists is a lie. Printed rather than assumed, so truncation can never hide in a mean.
    `careers that ran all ${FORK_MODE ? `${WEEKS} weeks` : `${SEASONS} seasons`}: ${full}/${careers.length}` +
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

// --- 3w2. ⭐⭐⭐ WAVE 2's OWN CENSUS – DID THE ARMS ACTUALLY RUN? ----------------------------------
//
// ⚠⚠ THIS BLOCK IS THE ANSWER TO CLAUDE.md's «before you believe a null result, prove the arm
// contains both the change and its reader». The bond gap above cannot distinguish "the two arms
// answered her differently and it was worth nothing" from "the answering code never executed". These
// counters can, and they are printed beside the bar rather than in a comment for exactly that reason.
console.log(`\n    ⭐ WAVE 2 – THE BEAT ARMS, COUNTED (care backs and matches · grind presses and contradicts)`)
console.log(
  `    ${pad('arm', 8)}${padL('careers', 9)}${padL('beats', 8)}${padL('back', 7)}${padL('press', 7)}${padL('listen', 8)}` +
    `${padL('fork with', 11)}${padL('fork against', 14)}${padL('bond @ fork', 13)}`,
)
console.log(`    ${'─'.repeat(77)}`)
const bondAtFork: Record<Arm, number[]> = { care: perSeed('care', (c) => c.bondAtFork), grind: perSeed('grind', (c) => c.bondAtFork) }
for (const arm of ARMS) {
  const cs = of(arm)
  const answers = cs.flatMap((c) => c.beatAnswers)
  const forkBond = cs.map((c) => c.bondAtFork).filter((x) => !Number.isNaN(x))
  console.log(
    `    ${pad(arm, 8)}${padL(cs.length, 9)}${padL(cs.reduce((a, c) => a + c.beatsRaised, 0), 8)}` +
      `${padL(answers.filter((a) => a === 'back').length, 7)}${padL(answers.filter((a) => a === 'press').length, 7)}` +
      `${padL(answers.filter((a) => a === 'listen').length, 8)}` +
      `${padL(cs.filter((c) => c.forkCongruence === 'with').length, 11)}${padL(cs.filter((c) => c.forkCongruence === 'against').length, 14)}` +
      `${padL(forkBond.length === 0 ? '–' : mean(forkBond).toFixed(2), 13)}`,
  )
}
console.log(`    ${'─'.repeat(77)}`)
const beatsFired = careers.reduce((a, c) => a + c.beatsRaised, 0)
// ⭐⭐ THE ARITHMETIC OF WHAT WAVE 2 IS WORTH, OFF THE CONSTANTS AND NOT OFF A GUESS. Both deltas are
// per-career and one-shot, so the separation they can add to the gap is a single subtraction.
const armSpread =
  ECONOMY.bond.delta.beatBacked +
  ECONOMY.bond.delta.forkWithHerWant -
  (ECONOMY.bond.delta.beatPressed + ECONOMY.bond.delta.forkAgainstHerWant)
console.log(
  `    the two wave-2 deltas are worth ${ECONOMY.bond.delta.beatBacked} + ${ECONOMY.bond.delta.forkWithHerWant} = ` +
    `${ECONOMY.bond.delta.beatBacked + ECONOMY.bond.delta.forkWithHerWant} to care and ` +
    `${ECONOMY.bond.delta.beatPressed} ${ECONOMY.bond.delta.forkAgainstHerWant} = ` +
    `${ECONOMY.bond.delta.beatPressed + ECONOMY.bond.delta.forkAgainstHerWant} to grind → ${armSpread} raw points of separation, once per career.`,
)
if (beatsFired === 0) {
  // ⚠⚠ THE FINDING WAVE 2 ACTUALLY MADE, PRINTED BY THE INSTRUMENT ITSELF so that it cannot be
  // mistaken for a quiet pass. Every number in this sentence is derived above, none is quoted.
  console.log(
    `    ⚠⚠ NO BEAT FIRED, AND THE ARMS ABOVE THEREFORE MEASURE NOTHING: her opinion is raised by the tick that\n` +
      `       OPENS THE FORK, which is week ${FORK_WEEK} (schoolEndWeek, birth month ${DEFAULT_PROFILE.birthMonth}); this grid ends at week ${WEEKS};\n` +
      `       and bar 3 reads bond at week ${SEASON_3_WEEK}. ${FORK_WEEK} > ${WEEKS} > ${SEASON_3_WEEK}, so the wave-2 deltas are ` +
      `${FORK_WEEK - SEASON_3_WEEK} weeks LATER than\n` +
      `       the number this bar reports. The gap above is wave 1's, re-measured – not wave 2 failing to move it.\n` +
      `       ⚠ Run \`npm run bench:spirit -- --fork\` to walk past week ${FORK_WEEK} and price the two deltas where they land.`,
  )
} else {
  const forkGaps = paired(bondAtFork.care, bondAtFork.grind)
  // ⚠ NaN IS DROPPED FROM THE ARM COLUMNS AND NEVER SUBSTITUTED, on `bondAtSeason3`'s own argument
  // one screen up: a seed whose careers all ended before the fork contributes no fork reading, and
  // a mean that swallowed it would be reporting a week those careers never saw. The paired gap
  // already drops the seed entirely, which is why its n can be smaller than either column's.
  const defined = (xs: readonly number[]) => xs.filter((x) => !Number.isNaN(x))
  console.log(
    `    ⭐ FORK-WEEK READING (diagnostic, NOT bar 3 – bar 3 is week ${SEASON_3_WEEK} and this is week ${FORK_WEEK}):\n` +
      `       care ${mean(defined(bondAtFork.care)).toFixed(2)} ± ${sem(defined(bondAtFork.care)).toFixed(3)} (n ${defined(bondAtFork.care).length}) · ` +
      `grind ${mean(defined(bondAtFork.grind)).toFixed(2)} ± ${sem(defined(bondAtFork.grind)).toFixed(3)} (n ${defined(bondAtFork.grind).length}) · ` +
      `gap ${mean(forkGaps).toFixed(2)} over ${forkGaps.length} paired seeds, 2×SEM ${(2 * sem(forkGaps)).toFixed(3)}\n` +
      `       ⚠ THIS IS NOT A BAR AND CANNOT BECOME ONE. Bar 3's reading week is the owner's; this row exists only to\n` +
      `       price what a re-aim would be buying, and it changes no constant.`,
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
