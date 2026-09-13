// THE ARRIVAL CENSUS – «показать разные персоналии», turned into numbers a bar can be drawn against.
//
// Run: `npm run bench:life-arrival`  (`--careers N` shrinks the grid for a smoke run, `--pairs N`
// the input-independence arm).
//
// WHAT IT MEASURES. who-she-is-2026-09.md §4's census paragraph, and the wave-3 builder brief's §2
// T11 which names the same numbers as this step's acceptance table:
//
//   * romance-count medians, and they must SEPARATE : fiery >= 4 · sunny 2–3 · deep <= 3 · quiet <= 2
//   * first-arrival age medians                     : quiet >= 17.5 · fiery <= 17
//   * late-feed share by openness                   : private >= 60% told late · open <= 25%
//   * the latch proxy (carried into year two)       : NOT a bar in this wave – see §5 below
//   * the input-independence arm                    : one seed, two ways of playing it, one list of
//                                                     arrival weeks – ASSERTED, never eyeballed
//
// ⭐⭐⭐ CENSUS v2 (v75, wave 4's T7, 12.09) – **THE POKED MODE IS RETIRED AND EVERY BAR BELOW IS
// WALKED.** The paragraph that stood here is kept in full, one screen down, because a deleted
// measuring path has to be readable as a history rather than as an absence – and because the two
// modes did NOT measure the same thing, which is the finding this retirement is worth.
//
// Wave 4 ships `rollEnds` (world/lifeBeat.ts §8): an attachment ends on its own weekly hazard, the
// row is dated by `endEpisode`, and `arrivalEligible`'s cooldown clause bites for the first time in
// the game's life. So every number in this file now comes off the engine – the counts, the durations,
// the cooldown gaps – and this tool writes NOTHING to any world. `--careers N` still shrinks the grid.
//
// ⚠⚠ WHAT THE POKE MEASURED, AND WHAT IT COULD NOT. Wave 3's mode wrote `endedWeek` tool-side at a
// FIXED duration per temperament (sunny 94w · fiery 36w · quiet 156w · deep 62w, off §4's «median
// duration» column). It bought the only thing it could: the cooldown and the re-arrival were
// exercised at all, so the count medians were about the ARRIVAL hazard rather than about the wave's
// scope. It could not say ONE WORD about the spread of romance counts that comes from the spread of
// durations – its own banner said so – because a constant has no spread. Walked, the duration is
// exponential with mean `1 / (endsPerWeek × endsMult[t])`, which is between two and three times the
// poke's fixed number for three of the four girls; so the walked counts are LOWER and their spread
// is real. §2 below is the retirement record: the two columns, on the same seeds, measured before
// the poke was deleted.
//
// ⚠⚠ ZERO NEW RNG. This file creates no stream. It drives the engine's own walk (`stepCareerWeek`
// from `econ-bench.ts`) and re-reads the engine's own exported draw functions (`drawRawLag`) to show
// the raw lag beside the shaved one. MAIN is never touched, so the frozen capture 41550 / e6b0c709
// cannot see this file – `tests/condition.test.ts` is where that is proven, not here.
//
// ⚠⚠⚠ AND IT REFUSES TO PRINT A BAR IT DID NOT MEASURE, WHICH IS THE ONE THING THIS STEP HAD TO GET
// RIGHT. Earlier in this wave `npm run bench:spirit` ran, printed a full census table and exited 0
// while answering nothing: 842 beat rows raised, 0 answered, both fork columns empty, `bond@fork`
// blank, no error anywhere, because a `try/catch` swallowed the throw. Had anybody trusted it, a
// stall would have been filed as a measurement. Three rules follow, and they are structural rather
// than a promise:
//
//   1. THERE IS NO `try`/`catch` IN THIS FILE. Not one. A throw from anywhere – the engine, the
//      drain, a guard below – ends the run non-zero with the stack still attached.
//   2. EVERY NUMBER GOES THROUGH `sample()`, which THROWS on a short list. A median of an empty
//      array is not reachable from here: there is no code path that formats `xs` without having
//      asked `sample()` for it first, and `sample()` prints a red line naming the empty column
//      before it throws. Every printed row carries the `n` it actually GOT, never the n asked for.
//   3. THE INSTRUMENT ASSERTS ITS OWN ACTUATION (`assertReceipt`). Careers walked, weeks resolved,
//      arrivals appended, `'met'` rows raised AND ANSWERED, and – since v75 – ENDINGS WALKED by the
//      engine's own hazard: all counted, all checked. «Raised 842, answered 0» is the exact shape
//      this guard exists to catch, and it is checked per temperament rather than pooled, because a
//      pooled total hides a dead arm. ⚠ THE RE-AIM IS THE POINT: the clause used to read «episodes
//      ended by the poke» and a zero there meant the tool had stopped writing. It now reads «episodes
//      ended by `rollEnds`» and a zero there means the ENGINE has stopped ending them, which is a
//      strictly stronger thing for this file to be able to say.
//
// A MISSED CORRIDOR IS NOT A FAILURE OF THE INSTRUMENT. A bar off its corridor is a finding for the
// architect (invariant 5: numbers are measured, never adjusted) and the run still exits 0 with the
// miss printed. An UNMEASURABLE column is a broken instrument and exits non-zero. The two are
// deliberately different exits.
import {
  createWorld,
  // ⚠ `activeEpisode` IS GONE FROM THIS LIST WITH THE POKE (v75 T7). It was imported for one reason –
  // the poke asked «is somebody there» before it wrote `endedWeek` – and `rollEnds` asks it now,
  // inside the engine, through `endsEligible`. A bench that still held the selector would be holding
  // the one tool it needs to end an attachment behind the engine's back.
  answerFork,
  answerRetirement,
  birthdayOfferFor,
  chooseGift,
  drawRawLag,
  // ⭐ v75 T7 – the shipped end hazard, asked of the engine so §3a's closed form and the printed
  // banner cannot come to disagree with `ECONOMY.life.endsMult` (its own primitives doctrine: it
  // takes a temperament, not a world, so the census sweeps the table without posing four careers).
  endsHazardFor,
  kidAgeExact,
  loveEpisodesOf,
  lifeLogOf,
  pendingBirthday,
  TEMPERAMENTS,
  type Temperament,
  type WorldState,
} from '../src/engine/world'
// ⚠ THESE TWO ARE NOT ON THE `engine/world` BARREL and are imported from the leaf that owns them –
// the same direct import `endings-bench.ts` takes on `engine/ending`. `bondBandOf` is the band the
// shave is keyed on and `temperamentOpenness` is the register the lag table is keyed on; asking the
// engine for both is what stops this file growing a second copy of either rule.
import { bondBandOf, temperamentOpenness } from '../src/engine/spirit'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { BondBand, LifeBeatKind, LoveEpisode } from '../src/shared/protocol/narrative'
import { rngFromSeed } from '../src/engine/rng'
import { median, mean, stepCareerWeek, POLICIES, type Policy, type EntryVeto } from './econ-bench'
import { drainKnock } from './_knocks'
import { drainLifeBeatsTallied, drainSkewLine, emptyDrainCounts } from './_lifeBeats'

// =================================================================================================
// 1. THE GRID
// =================================================================================================

/** The brief's own number: «200 careers PER TEMPERAMENT». */
const CAREERS_PER_TEMPERAMENT = flag('--careers', 200)
/** How many (no-action, action-laden) pairs the independence arm walks, per temperament. The brief
 *  asks for «one seed»; four is one seed four times over, and a single pair whose career happened to
 *  meet nobody would have asserted an equality between two empty lists. */
const PAIRS_PER_TEMPERAMENT = flag('--pairs', 4)

/** ⚠⚠ HER AGE IS ASKED OF THE ENGINE AND NEVER COMPUTED HERE, and this is the second time that rule
 *  has been the difference between a bar and a mistake. The first draft of this file read
 *  `14 + week / 52`, which is `ageAtWeek` – the COACH MARKET'S RESTOCKING CLOCK – wearing her name,
 *  and `world/age.ts`'s own banner says in as many words that it is the wrong function to ask how old
 *  she is (the owner's ruling of 09.08: «Есть год рождения и дата. Это всё»). `DEFAULT_PROFILE` is
 *  born on 15 June, so at week 0 she is **13.5**, not 14: every first-arrival age this bench printed
 *  was HALF A YEAR TOO OLD, and bar 2's two verdicts were both being read off the wrong number.
 *  `kidAgeExact` is the same function `arrivalEligible` gates on, so the bench and the rule cannot
 *  come to disagree about when she turned sixteen. */
const AGE_AT = (week: number): number => kidAgeExact(week, DEFAULT_PROFILE.birthMonth, DEFAULT_PROFILE.birthDay)

/** ⚠ THE WINDOW IS §4's OWN, AND IT IS DERIVED RATHER THAN QUOTED. The census table's rightmost
 *  column reads «expected biography, ages 16→24 (before the latch truncates)», so the walk runs from
 *  week 0 to the week she turns 24 – computed off `kidAgeExact`, so a birth-date change moves the
 *  horizon instead of silently invalidating it. A longer walk would price romances §4 never counted;
 *  a shorter one would truncate the ones it did. */
const CENSUS_TO_AGE = 24
const WEEKS = weekSheTurns(CENSUS_TO_AGE)
/** The first week `arrivalEligible`'s age clause can be true – printed, because «she is eligible from
 *  week 128, not week 104» is the fact the first-arrival medians are read against. */
const ELIGIBLE_FROM = weekSheTurns(ECONOMY.life.ageGate)

function weekSheTurns(age: number): number {
  for (let w = 0; w < 40 * WEEKS_PER_YEAR; w++) if (AGE_AT(w) >= age) return w
  throw new Error(`she never reaches ${age} inside forty years – the calendar moved under this bench`)
}

/** ⭐⭐⭐ v75 T7 – §4's «expected biography» COLUMN, KEPT AS THE PREDICTION IT ALWAYS WAS AND NO LONGER
 *  AS A POKE. These four seasons-figures used to be WRITTEN INTO the worlds this bench walked
 *  (`BENCH_ONLY_DURATION_WEEKS`, deleted with the mode); they are now what §3a's measured median is
 *  read AGAINST. Same table, opposite direction – which is the whole of what retiring the poke does.
 *
 *  ⚠ AND THE CLOSED FORM IS DERIVED FROM THE ENGINE, NOT FROM THESE. `endsHazardFor` is the shipped
 *  rate; the median of a geometric wait is `ln 2 / −ln(1 − h)`. The two are printed side by side so a
 *  reader can see that §4's prose column and `ECONOMY.life.endsMult` still agree – they do, to within
 *  a rounding, which is worth being able to check rather than assume. */
const SPEC_DURATION_SEASONS: Record<Temperament, number> = { sunny: 1.8, fiery: 0.7, quiet: 3, deep: 1.2 }
/** The median duration §4's OWN end column implies, in weeks, off the engine's shipped hazard. */
function closedFormMedianWeeks(t: Temperament): number {
  const h = endsHazardFor(t)
  return Math.log(2) / -Math.log(1 - h)
}

function flag(name: string, fallback: number): number {
  const i = process.argv.indexOf(name)
  if (i < 0) return fallback
  const n = Number(process.argv[i + 1])
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

// =================================================================================================
// 2. ONE CAREER
// =================================================================================================

interface EpisodeRow {
  seed: string
  temperament: Temperament
  /** 0 for the first attachment of the career, 1 for the next, … */
  ordinal: number
  sinceWeek: number
  /** never null on a row this engine wrote – `rollArrival` computes it at the arrival */
  knownWeek: number
  wants: LoveEpisode['wants']
  /** `knownWeek − sinceWeek`: the lag the parent actually waited, AFTER the bond shave */
  shavedLag: number
  /** the same episode's lag BEFORE the shave, re-read off the engine's own `seed:life:partner:<w>:lag`
   *  stream. ⚠ NOT A NEW DRAW: `drawRawLag` is the engine's exported function, `rngFromSeed` is
   *  re-derived at the call site and persists nothing, and the value is the one the arrival used. */
  rawLag: number
  /** the bond band the career carried INTO the arrival week – the shave's own input, recorded so a
   *  late-share miss can be attributed to the table or to the shave rather than guessed at */
  bandAtArrival: BondBand
  endedWeek: number | null
}

interface CareerRow {
  seed: string
  temperament: Temperament
  /** weeks actually resolved – short of `WEEKS` only when the career ended */
  weeks: number
  /** the engine's own `world.week` when the walk stopped – the week an unanswered row must sit on */
  endWeek: number
  endedAs: string | null
  /** ⚠⚠ THE ONE LEGAL WAY A `'met'` ROW GOES UNANSWERED, recorded per row rather than tolerated as a
   *  count. `answerLifeBeat` runs `guardNotEndedForGood`, so a row raised by the very tick that
   *  latched a career-ending injury can never be answered – not by this bench and not by a player at
   *  a screen. The walk breaks on the ending BEFORE it drains (which is what keeps this file free of
   *  a try/catch), so such a row stays open forever, honestly. `assertReceipt` checks each one
   *  against that story – the career ended, and the row landed on the ending week – and throws on
   *  anything else, because «a row nobody answered» is otherwise exactly the stall this bench exists
   *  to refuse to print around. */
  metUnanswered: number[]
  episodes: EpisodeRow[]
  metRaised: number
  metAnswered: number
  beatsRaised: number
  beatsAnswered: number
  /** ⭐ v75 T7 – endings the ENGINE wrote on this career. It replaces `endedByPoke` and the rename is
   *  the retirement in one field: nothing in this file can increment it. */
  endedWalked: number
  /** ...and how many of them the parent was actually SHOWN – `rollEnds` raises `'ended'` only behind
   *  the `'met'` receipt (ruling B), so the two numbers are different questions and both are counted. */
  endedCards: number
  bondFinal: number
}

interface WalkOpts {
  /** the entry policy the family plays under */
  policy: Policy
  /** a veto that refuses every entry – the no-action arm's whole definition */
  veto?: EntryVeto
  /** does the parent take the optional decisions (the knock, the birthday)? */
  decides: boolean
  weeks: number
}

/** THE CENSUS ARM'S OWN PARENT, and `--policy grinder` is the other one.
 *
 *  ⚠⚠ THE DEFAULT IS `player` – econ-bench's «MODEL OF A REASONABLE PARENT» (POLICIES[1]: a reserve
 *  in weeks of the family's own bills, a rest floor of condition 80, the coach on event weeks, the
 *  off-season family week) – plus every knock rested and the birthday she asked for. It is the
 *  default because of what the OTHER arm measured, and the finding belongs here where the choice is
 *  made: walked ten years under the `grinder` policy (enter everything, refuse nothing) the family's
 *  BOND COLLAPSES – on the smoke grid 67% of arrivals landed at `cold` and not one at `close` –
 *  because the played-hurt −4 fires on every draw she enters hurt and the 0.5/week regression toward
 *  70 cannot carry it. A census read off that arm would be reading `ECONOMY.life.bondShave`'s
 *  identity row for almost every episode and calling it the game.
 *
 *  ⚠ ONE POLICY AT A TIME AND NO ARMS, DELIBERATELY. This bench measures HER – the temperament
 *  table's arrival hazard, its cooldown and its lag – and the only place a player choice reaches any
 *  of those is the BOND SHAVE on the lag. So the band the careers actually sat in is PRINTED beside
 *  the late-share bar, and the bar is ALSO broken out per band, which is strictly more useful than
 *  an arm: it says what the shave does at every band, whichever band this parent produced. The one
 *  arm pair this file runs is §7's independence assertion, and it exists to prove that choices reach
 *  `knownWeek` and NOT `sinceWeek`. */
const CENSUS_POLICY: Policy = process.argv.includes('--policy') && process.argv[process.argv.indexOf('--policy') + 1] === 'grinder' ? POLICIES[0] : POLICIES[1]
const CENSUS: WalkOpts = { policy: CENSUS_POLICY, decides: true, weeks: WEEKS }

function walk(seed: string, temperament: Temperament, opts: WalkOpts): CareerRow {
  // ⚠ THE TEMPERAMENT IS ASSIGNED AND NOT DRAWN, which is what makes the four columns PAIRED:
  // the same 200 seeds are played four times over, so a difference between two columns is who she
  // is and not which careers happened to land in which column. `tools/spirit-bench.ts` records the
  // same construction and the same reason; the override moves no draw, because `temperament` rides
  // its own `seed:temperament` sub-stream and nothing re-derives it once the field is set.
  //
  // ⚠ `wealthy` FOR THE SAME REASON THE SPIRIT BENCH USES IT: a family that goes bankrupt at
  // seventeen truncates the census, and a truncated career is a missing biography rather than a
  // short one. The census is about the years 16→24 and every career has to be able to reach them.
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy' })
  world.temperament = temperament
  const rng = rngFromSeed(world.seed)
  const row: CareerRow = {
    seed,
    temperament,
    weeks: 0,
    endWeek: 0,
    endedAs: null,
    metUnanswered: [],
    episodes: [],
    metRaised: 0,
    metAnswered: 0,
    beatsRaised: 0,
    beatsAnswered: 0,
    endedWalked: 0,
    endedCards: 0,
    bondFinal: Number.NaN,
  }
  const openness = temperamentOpenness(temperament)
  /** bond entering the week – the value `rollArrival` shaves with, because the roll runs before
   *  `accrueSpirit` (see the call-site note in `world/phaseHerWeek.ts`) and `accrueSpirit` is what
   *  regresses bond. Recorded before the step so the band is the one the arrival read. */
  let bondEntering = world.bond
  let seen = 0

  for (let i = 0; i < opts.weeks; i++) {
    bondEntering = world.bond
    // ⚠ `drainKnocks: false` – `decides` IS AN ARM OF THIS BENCH, so the shared drain may not answer
    // a knock this walk deliberately leaves open (the T6b law). The `opts.decides` branch below calls
    // `drainKnock` itself, which keeps the arm exactly where it was.
    stepCareerWeek(world, rng, opts.policy, opts.veto, { drainKnocks: false })
    row.weeks++
    // --- what the week appended to her life ----------------------------------------------------
    //
    // ⚠⚠ IT RUNS **BEFORE** THE ENDING BREAK, AND THAT ORDER IS A REPAIR (v75 T7, 12.09) RATHER THAN
    // A PREFERENCE. It used to sit after it, and on the tick where a career-ending injury landed in
    // the same week as an arrival the row the engine had just written was never recorded: `seen`
    // stopped short, the episode existed in `world.loveEpisodes` and in no column of this census, and
    // NOTHING said so – wave 3's version had no reader that could notice. Census v2's end-of-walk
    // sync is that reader, and it threw on the full grid («life-142: episode p:383 is in the world and
    // not in this bench's record»). A romance that began in the week she got hurt is a real arrival
    // and the census owes it a row.
    //
    // ⚠ IT IS SAFE ON AN ENDED CAREER BECAUSE IT ISSUES NO COMMAND. `loveEpisodesOf` is a read and
    // `drawRawLag` is a pure re-derivation off (seed, week); the terminal latch refuses ANSWERS, and
    // the break below still stands in front of every one of them.
    const episodes = loveEpisodesOf(world)
    for (; seen < episodes.length; seen++) {
      const e = episodes[seen]
      // ⚠ `knownWeek` IS NEVER NULL ON A ROW THIS ENGINE WROTE – `rollArrival` computes it at the
      // arrival – so this is a narrowing rather than a default, and a null here would be a new
      // writer that this bench must not silently average over.
      if (e.knownWeek === null) throw new Error(`${seed}: episode ${e.id} has no knownWeek – a writer this bench does not know about`)
      row.episodes.push({
        seed,
        temperament,
        ordinal: seen,
        sinceWeek: e.sinceWeek,
        knownWeek: e.knownWeek,
        wants: e.wants,
        shavedLag: e.knownWeek - e.sinceWeek,
        rawLag: drawRawLag(world.seed, e.sinceWeek, openness),
        bandAtArrival: bondBandOf(bondEntering),
        endedWeek: null,
      })
    }

    // ⚠ THE ENDING IS READ BEFORE ANYTHING IS ANSWERED, and that is what lets this file have no
    // `try`/`catch`: `answerLifeBeat`, `decideKnock`, `chooseGift`, `answerFork` and
    // `answerRetirement` all refuse behind a terminal latch, so a walk that answered after the
    // latch would need a swallowed throw to survive it. Breaking here means every command below
    // runs on a career that still has a next week.
    if (world.ending !== null) break

    // --- the parent answers whatever the engine is waiting on ----------------------------------
    //
    // ⚠⚠ THE DRAIN IS NOT OPTIONAL AND IT IS NOT AN ARM. `advanceWeeks` refuses to tick while a
    // BLOCKING row is unanswered and `answerFork` refuses outright (`FORK_UNHEARD_REFUSAL`), so a
    // walk that does not drain stalls – silently, in the shape this file's banner describes. It is
    // bond-neutral by construction (`tools/_lifeBeats.ts`), so the answer cannot move the shave this
    // bench is measuring. Tier-1 `'small-talk'` rows are NON-blocking since T15 and are never seen
    // by the drain; they stay in `lifeLog` unanswered for the life of the career, which is the
    // ruling and not a leak.
    // ⭐ v75 T3b – TALLIED RATHER THAN COUNTED, so §8 can print what the drain cost this run. Same
    // walk, same answers; `drainLifeBeats` is this call's `cleared` field and nothing else.
    const drained = drainLifeBeatsTallied(world)
    row.beatsAnswered += drained.cleared
    for (const kind of Object.keys(drained.byKind) as LifeBeatKind[]) DRAINED[kind] += drained.byKind[kind]
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
    if (opts.decides) {
      drainKnock(world)
      answerTheBirthday(world)
    }

    // ⭐⭐⭐ v75 T7 – AND HERE IS WHERE THE POKE WAS. Nothing replaces it: `rollEnds` runs inside
    // `stepCareerWeek`'s tick, four calls above, and this bench now writes to no world at all. The
    // deletion is the step; what the block DID, and what it could not say, is described in full in
    // this file's banner so that «what the two modes measured differently» survives the code that
    // answered it.
  }

  // ⭐⭐⭐ v75 T7 – THE ENDINGS, READ BACK OFF THE ENGINE'S OWN ROWS AT THE END OF THE WALK. A row is
  // recorded the week it ARRIVES and dated the week it ENDS, and the two are different weeks, so the
  // date cannot be captured by the append loop above. ⚠ IT IS A READ AND NEVER A WRITE: `rollEnds`
  // put every one of these dates there, and the one line in this loop that touches the bench's own
  // record is the copy.
  for (const e of loveEpisodesOf(world)) {
    const mine = row.episodes.find((x) => x.sinceWeek === e.sinceWeek)
    if (mine === undefined) throw new Error(`${seed}: episode ${e.id} is in the world and not in this bench's record`)
    mine.endedWeek = e.endedWeek
    if (e.endedWeek !== null) row.endedWalked++
  }
  row.endWeek = world.week
  row.endedAs = world.ending === null ? null : world.ending.type
  row.bondFinal = world.bond
  for (const beat of lifeLogOf(world)) {
    if (beat.kind === 'met') {
      row.metRaised++
      if (beat.answer !== null) row.metAnswered++
      else row.metUnanswered.push(beat.week)
    }
    if (beat.kind === 'ended') row.endedCards++
    if (beat.kind === 'met' || beat.kind === 'fork-opinion' || beat.kind === 'ended') row.beatsRaised++
  }
  return row
}

/** She gets the thing she asked for, in every arm that decides anything at all – `spirit-bench`'s
 *  own construction and its own reason: the birthday is not one of this file's variables, so making
 *  it one would hand a bar a gap it did not earn. */
function answerTheBirthday(world: WorldState): void {
  const age = pendingBirthday(world)
  if (age === null) return
  const { options, askedId } = birthdayOfferFor(world, age)
  if (options.length === 0) return
  chooseGift(world, options.some((g) => g.id === askedId) ? askedId : options[0].id)
}

// =================================================================================================
// 3. THE GUARD THAT MAKES AN EMPTY COLUMN IMPOSSIBLE TO MISTAKE FOR A MEASUREMENT
// =================================================================================================

interface Sample {
  readonly label: string
  readonly xs: readonly number[]
}

/** ⚠⚠ THE ONLY WAY A NUMBER REACHES THE PRINTER. Formatting helpers below take a `Sample` and never
 *  an array, so «median of an empty list» is not a reachable state of this program: there is no
 *  overload that skips the check. An under-sized column prints a red line NAMING ITSELF and then
 *  throws, which ends the run non-zero – there is no `try`/`catch` anywhere in this file to catch it.
 *
 *  ⚠ THE `n` IT RETURNS IS THE ONE IT GOT. Every row this file prints carries `n=` from the sample
 *  itself, never from the grid size, so «200 careers» and «7 arrivals» can never look like the same
 *  denominator. */
function requireN(label: string, n: number, minN: number): void {
  if (n >= minN) return
  console.log('')
  console.log(`  ⚠⚠ RED – ${label}: ${n} observation(s), ${minN} required.`)
  console.log('     This bench does not print a median or a share of an empty list. The column is')
  console.log('     UNMEASURED, which is a broken instrument and not a missed corridor – exiting non-zero.')
  console.log('')
  throw new Error(`unmeasured column: ${label} (n=${n}, need ${minN})`)
}

function sample(label: string, xs: readonly number[], minN = 1): Sample {
  requireN(label, xs.length, minN)
  return { label, xs }
}

function med(s: Sample): number {
  return median([...s.xs])
}

/** The same guard for a RATE. ⚠ A share of nothing is the other way an empty column looks like a
 *  measurement – `0/0` formats as `NaN%` and a reader skims past it – so the denominator goes
 *  through the identical check before the division is allowed to happen. */
function share(label: string, hits: number, of: number, minN = 1): { pct: number; n: number } {
  requireN(label, of, minN)
  return { pct: (100 * hits) / of, n: of }
}

/** The floor every sampled column is held to. ⚠ SCALED TO THE GRID so a `--careers 8` smoke run is
 *  still legal, and 30 on the grid the bars are read off (the brief's 200 per temperament). */
const MIN_N = Math.max(1, Math.min(30, Math.floor(CAREERS_PER_TEMPERAMENT / 4)))

function pad(s: string, w: number): string {
  return s.length >= w ? s : s + ' '.repeat(w - s.length)
}
function padL(s: string, w: number): string {
  return s.length >= w ? s : ' '.repeat(w - s.length) + s
}
function rule(title: string): void {
  console.log('')
  console.log(`  ── ${title} ${'─'.repeat(Math.max(0, 94 - title.length))}`)
  console.log('')
}

const MISSES: string[] = []

/** ⭐⭐ v75 T3b – EVERY BEAT THIS BENCH DRAINED, BY KIND, FOLDED ACROSS EVERY WALK IN THE RUN.
 *
 *  ⚠⚠ IT EXISTS SO THE SKEW IS ARITHMETIC RATHER THAN NOISE (wave-4 brief §0.2). This file walks
 *  3,200-odd careers and answers whatever the engine is waiting on so the walks do not stall; those
 *  answers move `bond`, and `bond` is a number §5 and §6 read. Until 12.09 the drain took whatever
 *  priced at ZERO, so the skew was nil by construction and nobody had to say so; the amendment
 *  replaced that with a REGISTERED answer per kind whose price is merely READ-INDEPENDENT – still
 *  zero for every kind that exists today, and −1 for the `'ended'` beat that follows. A bench that
 *  did not print it would be carrying an unstated offset into its own bond figures, which is exactly
 *  the thing `tools/_lifeBeats.ts` was written to prevent.
 *
 *  ⚠ THE ZEROES COME FROM THE REGISTRY'S OWN KEYS (`emptyDrainCounts`), so a kind added next wave is
 *  counted here without this file being edited. */
const DRAINED = emptyDrainCounts()
/** A bar's verdict. ⚠ A MISS IS A FINDING AND NOT AN ERROR – invariant 5: numbers are measured, never
 *  adjusted, and «off the corridor» is information the architect asked for. The run still exits 0;
 *  the misses are re-printed together at the end so none can be lost in the scroll. */
function verdict(bar: string, ok: boolean, detail: string): string {
  if (!ok) MISSES.push(`${bar} – ${detail}`)
  return ok ? 'HIT ' : 'MISS'
}

// =================================================================================================
// 4. THE RUN
// =================================================================================================

console.log('')
console.log('══════════════════════════════════════════════════════════════════════════════════════════════')
console.log('  THE ARRIVAL CENSUS – npm run bench:life-arrival')
console.log('  who-she-is-2026-09.md §4 «The census» · docs/plans/life-wave-3-builder-2026-09.md §2 T11')
console.log('══════════════════════════════════════════════════════════════════════════════════════════════')
console.log('')
console.log('  ⭐⭐⭐ CENSUS v2 (v75, T7) – **EVERY BAR BELOW IS WALKED. THE POKED MODE IS RETIRED.**')
console.log('       Wave 4 ships `rollEnds`, so an attachment ends on the engine\'s own weekly hazard')
console.log('       (' + `${TEMPERAMENTS.map((t) => `${t} ${(100 * endsHazardFor(t)).toFixed(2)}%/wk`).join(' · ')})` + ')')
console.log('       and `arrivalEligible`\'s cooldown clause bites for the first time in the game\'s life.')
console.log('       THIS TOOL WRITES NOTHING TO ANY WORLD: no poke, no draw, no stream, no engine change.')
console.log('       ⚠ §2 is the retirement record – what the poked mode measured, beside what this one does.')
console.log('')
console.log('  ⚠ ZERO NEW RNG: this file derives no stream of its own. MAIN is untouched (41550 / e6b0c709).')
console.log('  ⚠ NO try/catch ANYWHERE IN THIS FILE, and every number is taken through `sample()`, which')
console.log('    throws on a short list. A MISSED CORRIDOR is a finding and exits 0; an UNMEASURED column')
console.log('    is a broken instrument and exits non-zero.')

rule('§0. THE GRID')
console.log(`    careers            : ${CAREERS_PER_TEMPERAMENT} per temperament × 4 = ${CAREERS_PER_TEMPERAMENT * 4}`)
console.log(`    walk               : week 0 → week ${WEEKS}, i.e. she is ${AGE_AT(0).toFixed(2)} at the start and ${CENSUS_TO_AGE} at the end`)
console.log(`                         (§4's own «ages 16→24» window; the horizon is DERIVED off \`kidAgeExact\`,`)
console.log(`                         never off 14 + week/52 – that is the coach market's clock, not hers)`)
console.log(`    eligible from      : week ${ELIGIBLE_FROM} – the week \`kidAgeExact\` first reads ${ECONOMY.life.ageGate}`)
console.log(`    family             : wealthy (no bankruptcy may truncate a biography)`)
console.log(`    parent             : the '${CENSUS_POLICY.label}' entry policy · every knock rested · the birthday she asked for`)
console.log(`    temperament        : ASSIGNED after createWorld – the same ${CAREERS_PER_TEMPERAMENT} seeds played four times, so the`)
console.log(`                         four columns are PAIRED and a difference between them is who she is`)
console.log(`    age gate           : ${ECONOMY.life.ageGate} · hazard/wk ${ECONOMY.life.arrivalPerWeek.minor} under ${ECONOMY.life.adultFrom} (to week ${weekSheTurns(ECONOMY.life.adultFrom)}), ${ECONOMY.life.arrivalPerWeek.adult} from ${ECONOMY.life.adultFrom}`)
console.log(`    × temperament      : ${TEMPERAMENTS.map((t) => `${t} ${ECONOMY.life.temperamentMult[t]}`).join(' · ')}`)
console.log(`    cooldown (wks)     : ${TEMPERAMENTS.map((t) => `${t} ${ECONOMY.life.cooldownWeeks[t]}`).join(' · ')}`)
console.log(`    bond shave         : ${(Object.keys(ECONOMY.life.bondShave) as BondBand[]).map((b) => `${b} ⌊/${ECONOMY.life.bondShave[b]}⌋`).join(' · ')}`)

const careers: CareerRow[] = []
for (const t of TEMPERAMENTS) {
  for (let i = 0; i < CAREERS_PER_TEMPERAMENT; i++) careers.push(walk(`life-${i}`, t, CENSUS))
}
const byT = (t: Temperament): CareerRow[] => careers.filter((c) => c.temperament === t)
const episodesOf = (t: Temperament): EpisodeRow[] => byT(t).flatMap((c) => c.episodes)

// =================================================================================================
// §1. THE RECEIPT – what the walk actually produced
// =================================================================================================
//
// ⚠⚠ THIS TABLE EXISTS BECAUSE A NULL RESULT HAS TO BE FALSIFIABLE. A census table alone cannot tell
// «the hazard is this rare» from «the walk never reached her sixteenth birthday» or from «every beat
// raised sat unanswered and the career stalled». These columns are what tell those apart, and
// `assertReceipt` below turns each of them into a check rather than a thing to read.

rule('§1. THE RECEIPT – the instrument asserting its own actuation')
console.log(
  `    ${pad('temperament', 13)}${padL('careers', 9)}${padL('weeks', 9)}${padL('full walk', 11)}${padL('episodes', 10)}${padL('≥1 arrival', 12)}${padL('met raised', 12)}${padL('answered', 10)}${padL('unanswerable', 14)}${padL('ended WALKED', 14)}${padL(`'ended' cards`, 15)}`,
)
for (const t of TEMPERAMENTS) {
  const cs = byT(t)
  console.log(
    `    ${pad(t, 13)}${padL(String(cs.length), 9)}${padL(String(cs.reduce((s, c) => s + c.weeks, 0)), 9)}` +
      `${padL(String(cs.filter((c) => c.weeks === WEEKS).length), 11)}${padL(String(cs.reduce((s, c) => s + c.episodes.length, 0)), 10)}` +
      `${padL(String(cs.filter((c) => c.episodes.length > 0).length), 12)}${padL(String(cs.reduce((s, c) => s + c.metRaised, 0)), 12)}` +
      `${padL(String(cs.reduce((s, c) => s + c.metAnswered, 0)), 10)}${padL(String(cs.reduce((s, c) => s + c.metUnanswered.length, 0)), 14)}` +
      `${padL(String(cs.reduce((s, c) => s + c.endedWalked, 0)), 14)}${padL(String(cs.reduce((s, c) => s + c.endedCards, 0)), 15)}`,
  )
}
const endings = new Map<string, number>()
for (const c of careers) if (c.endedAs !== null) endings.set(c.endedAs, (endings.get(c.endedAs) ?? 0) + 1)
console.log('')
console.log(
  `    careers that did NOT walk the full ${WEEKS} weeks: ${careers.filter((c) => c.weeks < WEEKS).length}/${careers.length}` +
    `${endings.size ? ` (${[...endings].map(([k, v]) => `${k} ${v}`).join(' · ')})` : ''}`,
)

/** ⚠⚠ PER TEMPERAMENT AND NEVER POOLED. A pooled total passes while one whole column is dead, which
 *  is the failure this guard is named after: `bench:spirit` printed a full table with 842 rows
 *  raised and 0 answered and exited 0. Every clause below is the sentence that run could not have
 *  said about itself. */
function assertReceipt(): void {
  for (const t of TEMPERAMENTS) {
    const cs = byT(t)
    const weeks = cs.reduce((s, c) => s + c.weeks, 0)
    if (weeks === 0) throw new Error(`${t}: the walk resolved 0 weeks – nothing was measured`)
    const eps = cs.reduce((s, c) => s + c.episodes.length, 0)
    if (eps === 0) {
      console.log('')
      console.log(`  ⚠⚠ RED – ${t}: ZERO arrivals over ${cs.length} careers and ${weeks} weeks.`)
      console.log('     Every bar this temperament contributes to is UNMEASURED. Exiting non-zero rather')
      console.log('     than printing a median of an empty list.')
      throw new Error(`${t}: zero arrivals – the column is unmeasured`)
    }
    const raised = cs.reduce((s, c) => s + c.metRaised, 0)
    const answered = cs.reduce((s, c) => s + c.metAnswered, 0)
    if (raised === 0) throw new Error(`${t}: ${eps} episodes and ZERO 'met' rows – delivery never ran`)
    // ⚠⚠ EVERY BLOCKING ROW IS ANSWERED, AND THE WALK IS WHY: the drain runs every week, so a row
    // raised on week W is answered on week W. A gap here means the drain stopped clearing – the
    // «842 raised, 0 answered» shape – and it is caught before a single bar is printed.
    //
    // ⚠⚠ WITH EXACTLY ONE LEGAL EXCEPTION, AND IT IS THE ENGINE'S RULE RATHER THAN A TOLERANCE. This
    // guard threw on the first full grid – «fiery: 1081 'met' rows raised, 1080 answered» – and the
    // one row was real: a career-ending injury latched on the same tick that delivered her news, and
    // `answerLifeBeat` runs `guardNotEndedForGood`, so NOBODY can answer that row, at a bench or at a
    // screen. The walk breaks on the ending before it drains, which is what keeps this file free of
    // the `try`/`catch` the banner forswears. So the exception is CHECKED ROW BY ROW against its own
    // story – the career ended, and the row landed on the ending week – and never counted off as
    // slack: a row open in a career that is still running, or open weeks before its ending, is the
    // stall, and it throws with the offending rows named.
    const stalled = cs.flatMap((c) =>
      c.metUnanswered
        .filter((week) => c.endedAs === null || week !== c.endWeek)
        .map((week) => `${c.seed} (row week ${week}, career ${c.endedAs ?? 'STILL RUNNING'} at week ${c.endWeek})`),
    )
    if (stalled.length > 0) {
      throw new Error(`${t}: ${stalled.length} 'met' row(s) unanswered outside the ending week – the drain is not draining: ${stalled.join(' · ')}`)
    }
    const unanswerable = cs.reduce((s, c) => s + c.metUnanswered.length, 0)
    if (answered !== raised - unanswerable) {
      throw new Error(`${t}: ${raised} raised, ${answered} answered, ${unanswerable} unanswerable – the three do not add up`)
    }
    // ⭐⭐⭐ v75 T7 – THE RE-AIMED ACTUATION CLAUSE, AND IT IS STRICTLY STRONGER THAN THE ONE IT
    // REPLACES. It read «the bench-only poke never fired»; a zero then meant the TOOL had stopped
    // writing. It now reads the engine: a zero means `rollEnds` never ended an attachment for this
    // temperament over the whole grid, which would make every count median read the shipped 1 and
    // every duration column empty. Same sentence, asked of the thing being measured.
    const ended = cs.reduce((s, c) => s + c.endedWalked, 0)
    if (ended === 0) throw new Error(`${t}: ZERO endings over ${cs.length} careers – \`rollEnds\` never fired and the count bars are unmeasured`)
    // ⚠ AND THE CARD IS ITS OWN CLAUSE. An ending the parent is never SHOWN is half the mechanic:
    // `rollEnds` raises `'ended'` only behind the `'met'` receipt (ruling B), so a zero here with a
    // non-zero above would mean every ending in this column happened before he had been told – which
    // is a real scene and not a plausible whole column.
    const cards = cs.reduce((s, c) => s + c.endedCards, 0)
    if (cards === 0) throw new Error(`${t}: ${ended} endings and ZERO 'ended' cards – the told-now branch never fired`)
  }
}
assertReceipt()
console.log('')
console.log('    ✓ every temperament: weeks resolved, arrivals appended, `met` rows raised AND ANSWERED,')
console.log('      `rollEnds` ended attachments and the `\'ended\'` card was raised AND answered. No column below is empty.')
console.log('    ⚠ `unanswerable` is the one legal gap and it is checked row by row, never counted off as')
console.log('      slack: a career-ending injury latching on the very tick that delivered her news leaves a')
console.log('      row `answerLifeBeat` refuses forever (`guardNotEndedForGood`) – nobody can answer it, at a')
console.log('      bench or at a screen. Any OTHER unanswered row throws with its seed and week named.')

// =================================================================================================
// §2. THE RETIREMENT RECORD, AND THE CONTROL THAT REPLACED THE POKE'S
// =================================================================================================
//
// ⚠⚠ WHAT THIS SECTION USED TO BE, AND WHY IT COULD NOT STAY. Wave 3's §2 walked the same seeds with
// the poke OFF and REFUSED to continue if any career held more than one episode – «something writes
// `endedWeek`, and the bench-only note at the top of this printout is now a lie». That refusal was
// correct and it was a WAVE-3 PREMISE: it guarded the claim that the count table was the tool's and
// not the game's. Wave 4 invalidates the premise on purpose, so the refusal went red before this
// task touched anything, and the honest repair is not to weaken it but to replace it with the
// control the walked mode actually needs.
//
// ⚠⚠ AND THE CONTROL A WALKED CENSUS NEEDS IS NOT «DOES THE TOOL WRITE» – it is «is the thing the
// engine wrote LEGAL». Three properties, each of them a rule the engine states somewhere else, each
// asserted here over every episode on the grid rather than sampled:
//
//   1. RULING F – `endedWeek >= sinceWeek + 1`. `rollEnds` runs BEFORE `rollArrival` in the tick, so
//      the row this week's arrival appends does not exist yet when the hazard is asked, and no
//      attachment can end in its own arrival week. The shortest romance the engine can produce is
//      exactly one week long, and a zero-week row would be the order having silently moved.
//   2. THE COOLDOWN, which is reachable for the FIRST TIME in this wave. `arrivalEligible` clause 3
//      refuses an arrival for `cooldownWeeks[t]` weeks from the last ending; so for every re-arrival
//      `sinceWeek − previous endedWeek >= cooldownWeeks[t]`, with no exception anywhere on the grid.
//      Wave 3 shipped that clause DORMANT and tested it against hand-built worlds; this is the first
//      time it has been asked of careers the engine actually walked.
//   3. NOBODY ARRIVES ON THE AFTERNOON OF A BREAK-UP – the same ordering read from the other end, and
//      a consequence of 2 rather than a second rule, so it is COUNTED and printed rather than
//      asserted twice.
//
// ⚠ THE «FIRST ARRIVAL IDENTICAL» CROSS-CHECK IS GONE WITH THE POKE IT CONFINED, and that is a
// deletion worth naming: it existed to prove the tool's write could not reach an arrival week. There
// is no write left to confine. What replaced it as the guard on the arrival numbers is §7's
// input-independence arm, which was always the stronger of the two.

rule('§2. THE ENDINGS ARE THE ENGINE\'S – the control that replaced the poke\'s')
const allEpisodesEverywhere = careers.flatMap((c) => c.episodes)
const ended = allEpisodesEverywhere.filter((e) => e.endedWeek !== null)
const sameWeek = ended.filter((e) => e.endedWeek! <= e.sinceWeek)
if (sameWeek.length > 0) {
  throw new Error(
    `${sameWeek.length} episode(s) ended on or before their own arrival week – ruling F is broken ` +
      `(e.g. ${sameWeek[0].seed}/${sameWeek[0].temperament}: ${sameWeek[0].sinceWeek} → ${sameWeek[0].endedWeek})`,
  )
}
/** Every re-arrival on the grid, as (gap from the previous ending, the cooldown it had to clear). */
const reArrivals: { seed: string; temperament: Temperament; gap: number; owed: number }[] = []
for (const c of careers) {
  for (let i = 1; i < c.episodes.length; i++) {
    const prev = c.episodes[i - 1]
    if (prev.endedWeek === null) {
      throw new Error(`${c.seed}/${c.temperament}: episode ${i} arrived while episode ${i - 1} was still open – clause 2 is broken`)
    }
    reArrivals.push({
      seed: c.seed,
      temperament: c.temperament,
      gap: c.episodes[i].sinceWeek - prev.endedWeek,
      owed: ECONOMY.life.cooldownWeeks[c.temperament],
    })
  }
}
const tooSoon = reArrivals.filter((r) => r.gap < r.owed)
if (tooSoon.length > 0) {
  throw new Error(
    `${tooSoon.length} re-arrival(s) inside the cooldown – \`arrivalEligible\` clause 3 is broken ` +
      `(e.g. ${tooSoon[0].seed}/${tooSoon[0].temperament}: gap ${tooSoon[0].gap}w against ${tooSoon[0].owed}w owed)`,
  )
}
const sameTick = reArrivals.filter((r) => r.gap === 0).length
console.log(`    episodes on the grid                 : ${allEpisodesEverywhere.length}, of which ${ended.length} ENDED and ${allEpisodesEverywhere.length - ended.length} were still open at week ${WEEKS}`)
console.log(`    shortest romance the engine produced : ${ended.length === 0 ? '–' : `${Math.min(...ended.map((e) => e.endedWeek! - e.sinceWeek))}w`}   ← ruling F: it can never be 0`)
console.log(`    episodes that ended in their arrival week: ${sameWeek.length}   ← ASSERTED zero, not printed and hoped over`)
console.log(`    re-arrivals on the grid              : ${reArrivals.length}`)
console.log(`    ...of which INSIDE the cooldown      : ${tooSoon.length}   ← ASSERTED zero (clause 3, live for the first time this wave)`)
console.log(`    ...of which on the ending's own week : ${sameTick}   ← nobody arrives on the afternoon of a break-up`)
console.log(`    tightest gap seen, per temperament   : ${TEMPERAMENTS.map((t) => {
  const gs = reArrivals.filter((r) => r.temperament === t).map((r) => r.gap)
  return `${t} ${gs.length === 0 ? '–' : `${Math.min(...gs)}w/${ECONOMY.life.cooldownWeeks[t]}w`}`
}).join(' · ')}`)
console.log('')
console.log('    ⚠ THE RETIREMENT RECORD. The poked mode was measured against the walked one on the same seeds')
console.log('      before it was deleted – both columns are in who-she-is-2026-09.md §4a\'s wave-4 entry. In one')
console.log('      line: the poke wrote a CONSTANT duration and could say nothing about the spread of counts;')
console.log('      walked durations are exponential and two to three times longer for three of the four girls,')
console.log('      so every walked count median below is LOWER than the poked one it replaces.')

// =================================================================================================
// §3. BAR 1 – THE ROMANCE COUNTS (WALKED)
// =================================================================================================

rule('§3. BAR 1 – romance-count medians, and they must SEPARATE   ⭐ WALKED (the poked mode is retired)')
console.log(`    ${pad('temperament', 13)}${padL('n', 6)}${padL('median', 9)}${padL('mean', 8)}${padL('min', 6)}${padL('max', 6)}${padL('0 romances', 12)}   corridor        verdict`)
const COUNT_BAR: Record<Temperament, { text: string; ok: (m: number) => boolean }> = {
  fiery: { text: '>= 4', ok: (m) => m >= 4 },
  sunny: { text: '2 – 3', ok: (m) => m >= 2 && m <= 3 },
  deep: { text: '<= 3', ok: (m) => m <= 3 },
  quiet: { text: '<= 2', ok: (m) => m <= 2 },
}
const countMedian: Partial<Record<Temperament, number>> = {}
for (const t of ['fiery', 'sunny', 'deep', 'quiet'] as Temperament[]) {
  // ⚠ THE DENOMINATOR IS THE CAREERS THAT WALKED THE WHOLE WINDOW, and it has to be: a career that
  // ended at twenty had fewer YEARS to meet anybody, not a quieter disposition, and pooling it in
  // would price the endings model as a personality. The excluded count is printed above.
  const cs = byT(t).filter((c) => c.weeks === WEEKS)
  const s = sample(`romance count · ${t}`, cs.map((c) => c.episodes.length), MIN_N)
  const m = med(s)
  countMedian[t] = m
  const bar = COUNT_BAR[t]
  console.log(
    `    ${pad(t, 13)}${padL(String(s.xs.length), 6)}${padL(m.toFixed(1), 9)}${padL(mean([...s.xs]).toFixed(2), 8)}` +
      `${padL(String(Math.min(...s.xs)), 6)}${padL(String(Math.max(...s.xs)), 6)}` +
      `${padL(`${((100 * s.xs.filter((x) => x === 0).length) / s.xs.length).toFixed(1)}%`, 12)}   ${pad(bar.text, 16)}${verdict(`bar 1 · ${t} count median ${bar.text}`, bar.ok(m), `measured ${m.toFixed(1)}`)}`,
  )
}
const sep =
  countMedian.fiery! > countMedian.sunny! && countMedian.sunny! >= countMedian.quiet! && countMedian.sunny! >= countMedian.deep!
console.log('')
console.log(
  `    the medians SEPARATE (fiery > sunny >= quiet/deep): ${verdict('bar 1 · the medians separate', sep, `fiery ${countMedian.fiery} · sunny ${countMedian.sunny} · deep ${countMedian.deep} · quiet ${countMedian.quiet}`)}`,
)

// =================================================================================================
// §3a. BAR 1b – HOW LONG THEY LAST  ⭐ NEW IN CENSUS v2: the poke's own table, read the other way
// =================================================================================================
//
// ⚠⚠ THE MEDIAN OF THE COMPLETED ONES IS THE WRONG NUMBER AND IT IS PRINTED ANYWAY. A census that
// stops at week 543 sees short romances whole and long ones truncated, so «the median of the rows
// that ended» is biased DOWN by exactly the amount §4's quiet row cares about: a quiet girl's median
// duration is about three seasons and a fair share of her episodes are still open when the walk
// stops. Taking that number as the measurement would report the censoring as a personality.
//
// ⚠⚠ SO THE BAR IS READ OFF THE HAZARD, WHICH CENSORING CANNOT BIAS. Every episode contributes the
// weeks it was EXPOSED (`endedWeek ?? the last week the career walked` − `sinceWeek`) and, if it
// ended, one event. `endings / exposure` is the maximum-likelihood weekly rate for a geometric wait
// under right-censoring, and the median it implies is `ln 2 / −ln(1 − ĥ)`. Both numbers are in the
// table – the biased one labelled as what it is – because a reader who cannot see the raw median
// cannot check the correction.
//
// ⚠ THE BARS ARE §4's TWO NAMED ROWS (quiet ≈ 3 seasons, fiery ≈ 0.7) AND THE TOLERANCE IS THE
// BENCH'S, stated rather than smuggled: ±20 % of the spec row. The other two temperaments are §4's
// too and print without a bar, which is the wave-4 brief's own list.

rule('§3a. BAR 1b – duration medians, WALKED   (the hazard estimate is the reading; the raw median is printed beside it)')
console.log('    ⚠ «exposure» is every week an episode was open inside the walk, ended or not – so a romance still')
console.log('      running at week ' + WEEKS + ' contributes its weeks WITHOUT contributing an ending, which is what makes')
console.log('      the hazard estimate immune to the horizon that truncates the raw median.')
console.log('')
console.log(
  `    ${pad('temperament', 13)}${padL('episodes', 10)}${padL('ended', 8)}${padL('open', 7)}${padL('exposure wks', 14)}${padL('ĥ /wk', 10)}${padL('shipped h', 11)}` +
    `${padL('median (ĥ)', 12)}${padL('in seasons', 12)}${padL('raw median', 12)}${padL('§4 says', 9)}   corridor          verdict`,
)
const DURATION_BAR: Partial<Record<Temperament, { text: string; ok: (seasons: number) => boolean }>> = {
  quiet: { text: '3 seasons ±20%', ok: (x) => x >= 0.8 * SPEC_DURATION_SEASONS.quiet && x <= 1.2 * SPEC_DURATION_SEASONS.quiet },
  fiery: { text: '0.7 seasons ±20%', ok: (x) => x >= 0.8 * SPEC_DURATION_SEASONS.fiery && x <= 1.2 * SPEC_DURATION_SEASONS.fiery },
}
for (const t of TEMPERAMENTS) {
  const cs = byT(t)
  const eps = cs.flatMap((c) => c.episodes.map((e) => ({ e, last: c.weeks })))
  const exposure = eps.reduce((n, { e, last }) => n + ((e.endedWeek ?? last) - e.sinceWeek), 0)
  const events = eps.filter(({ e }) => e.endedWeek !== null).length
  // ⚠ THROUGH `sample()` LIKE EVERY OTHER NUMBER IN THIS FILE: a temperament with no ended episode
  // has no measurable duration and the run stops rather than printing a rate of 0/0.
  const raw = sample(`duration · ${t}`, eps.filter(({ e }) => e.endedWeek !== null).map(({ e }) => e.endedWeek! - e.sinceWeek), MIN_N)
  if (exposure === 0) throw new Error(`${t}: zero exposure weeks – no episode was open for a single week`)
  const hHat = events / exposure
  const medianWeeks = Math.log(2) / -Math.log(1 - hHat)
  const seasons = medianWeeks / WEEKS_PER_YEAR
  const bar = DURATION_BAR[t]
  console.log(
    `    ${pad(t, 13)}${padL(String(eps.length), 10)}${padL(String(events), 8)}${padL(String(eps.length - events), 7)}${padL(String(exposure), 14)}` +
      `${padL(`${(100 * hHat).toFixed(3)}%`, 10)}${padL(`${(100 * endsHazardFor(t)).toFixed(3)}%`, 11)}` +
      `${padL(`${medianWeeks.toFixed(1)}w`, 12)}${padL(seasons.toFixed(2), 12)}${padL(`${med(raw).toFixed(1)}w`, 12)}${padL(String(SPEC_DURATION_SEASONS[t]), 9)}   ` +
      `${pad(bar ? bar.text : '(no bar)', 18)}${bar ? verdict(`bar 1b · ${t} duration ${bar.text}`, bar.ok(seasons), `measured ${seasons.toFixed(2)} seasons (raw median ${med(raw).toFixed(1)}w)`) : '–'}`,
  )
}
console.log('')
console.log(`    ⚠ «shipped h» is \`endsHazardFor\` – \`ECONOMY.life.endsPerWeek\` × \`endsMult[t]\`, asked of the engine. ĥ is what`)
console.log('      the walk PRODUCED. The two agreeing is the sharpest single statement this section makes: it says the')
console.log('      hazard reaches the world at the rate the table names, with no eligibility clause quietly eating weeks.')
console.log(`    ⚠ the closed form off the shipped rate: ${TEMPERAMENTS.map((t) => `${t} ${(closedFormMedianWeeks(t) / WEEKS_PER_YEAR).toFixed(2)}`).join(' · ')} seasons – §4's own prose column re-derived.`)

// =================================================================================================
// §3b. THE COOLDOWN CENSUS – ⭐ THE FIRST WAVE IT IS REACHABLE AT ALL
// =================================================================================================
//
// ⚠⚠ WAVE 3 SHIPPED `arrivalEligible`'s CLAUSE 3 DORMANT, with its own tests, against hand-built
// worlds carrying an ended row – because nothing in that wave could write one. This is the first
// time the clause has been asked of careers the engine walked, and §2 has already asserted that not
// one re-arrival on the grid broke it. This section is the other half: HOW HARD IT BITES.
//
// ⚠ IT CARRIES NO BAR, AND THAT IS §4's DOING RATHER THAN A CHOICE. The spec gives the cooldown a
// column of numbers and no corridor; what a census owes it is the distribution it actually produced,
// so that a later wave arguing about 12 against 26 has something to argue from.

rule('§3b. THE COOLDOWN CENSUS, per temperament   ⚠ NO BAR – §4 gives the cooldown a column, not a corridor')
console.log(
  `    ${pad('temperament', 13)}${padL('cooldown', 10)}${padL('re-arrivals', 13)}${padL('min gap', 9)}${padL('median gap', 12)}${padL('p90 gap', 9)}` +
    `${padL('within +4w', 12)}${padL('endings never re-armed', 24)}`,
)
for (const t of TEMPERAMENTS) {
  const owed = ECONOMY.life.cooldownWeeks[t]
  const gaps = reArrivals.filter((r) => r.temperament === t).map((r) => r.gap)
  // ⚠ THE DENOMINATOR IS ENDINGS THAT HAD ROOM TO BE FOLLOWED, not endings: a break-up at week 540
  // has three weeks left and no cooldown on earth lets anybody arrive in them. Counting it as «never
  // re-armed» would price the horizon as reticence.
  const endingsWithRoom = careers
    .filter((c) => c.temperament === t)
    .flatMap((c) => c.episodes.filter((e) => e.endedWeek !== null && e.endedWeek + owed <= c.weeks)).length
  const followed = careers
    .filter((c) => c.temperament === t)
    .flatMap((c) =>
      c.episodes.filter((e, i) => e.endedWeek !== null && e.endedWeek + owed <= c.weeks && c.episodes[i + 1] !== undefined),
    ).length
  if (gaps.length === 0) {
    console.log(
      `    ${pad(t, 13)}${padL(`${owed}w`, 10)}${padL('0', 13)}${padL('–', 9)}${padL('–', 12)}${padL('–', 9)}${padL('–', 12)}` +
        `${padL(`${endingsWithRoom - followed}/${endingsWithRoom}`, 24)}`,
    )
    continue
  }
  const sorted = [...gaps].sort((a, b) => a - b)
  console.log(
    `    ${pad(t, 13)}${padL(`${owed}w`, 10)}${padL(String(gaps.length), 13)}${padL(`${Math.min(...gaps)}w`, 9)}` +
      `${padL(`${med(sample(`cooldown gap · ${t}`, gaps, 1)).toFixed(1)}w`, 12)}${padL(`${sorted[Math.floor(0.9 * (sorted.length - 1))]}w`, 9)}` +
      `${padL(`${((100 * gaps.filter((g) => g < owed + 4).length) / gaps.length).toFixed(1)}%`, 12)}` +
      `${padL(`${endingsWithRoom - followed}/${endingsWithRoom}`, 24)}`,
  )
}
console.log('')
console.log('    «within +4w» = re-arrivals that happened in the first four weeks AFTER the cooldown expired – how')
console.log('    tightly the clause is actually binding, rather than how long it is on paper. «never re-armed» counts')
console.log('    endings that had a full cooldown of room left in the walk and were still never followed by anybody.')

// =================================================================================================
// §4. BAR 2 – THE FIRST ARRIVAL
// =================================================================================================

rule('§4. BAR 2 – first-arrival age medians   ⭐ WALKED (§7\'s independence arm is what guards these now)')
console.log(`    ${pad('temperament', 13)}${padL('n', 6)}${padL('never', 8)}${padL('median age', 12)}${padL('p10', 8)}${padL('p90', 8)}   corridor        verdict`)
const AGE_BAR: Partial<Record<Temperament, { text: string; ok: (m: number) => boolean }>> = {
  quiet: { text: '>= 17.5', ok: (m) => m >= 17.5 },
  fiery: { text: '<= 17', ok: (m) => m <= 17 },
}
for (const t of TEMPERAMENTS) {
  const cs = byT(t)
  // ⚠ THE HONEST DENOMINATOR IS «CAREERS THAT MET SOMEBODY», and the ones that never did are printed
  // in their own column rather than folded in at some invented age – `endings-bench`'s own rule about
  // a family that went under before it was ever offered anything.
  const ages = cs.filter((c) => c.episodes.length > 0).map((c) => AGE_AT(c.episodes[0].sinceWeek))
  const s = sample(`first arrival · ${t}`, ages, MIN_N)
  const sorted = [...s.xs].sort((a, b) => a - b)
  const m = med(s)
  const bar = AGE_BAR[t]
  console.log(
    `    ${pad(t, 13)}${padL(String(s.xs.length), 6)}${padL(String(cs.length - s.xs.length), 8)}${padL(m.toFixed(2), 12)}` +
      `${padL(sorted[Math.floor(0.1 * (sorted.length - 1))].toFixed(2), 8)}${padL(sorted[Math.floor(0.9 * (sorted.length - 1))].toFixed(2), 8)}   ` +
      `${pad(bar ? bar.text : '(no bar)', 16)}${bar ? verdict(`bar 2 · ${t} first arrival ${bar.text}`, bar.ok(m), `measured ${m.toFixed(2)}`) : '–'}`,
  )
}

// =================================================================================================
// §5. BAR 3 – THE LATE SHARE, AND THE SHAVE THAT MOVES IT
// =================================================================================================

rule('§5. BAR 3 – late-feed share by openness (told late = lag > 0 after the bond shave)')
console.log('    ⚠ THE VERDICT READS THE SHIPPED POPULATION – FIRST episodes only. The «all episodes»')
console.log('      column beside it is every LATER episode as well – a larger sample of the same draw, and since')
console.log('      census v2 those later episodes are the engine\'s own re-arrivals rather than a tool\'s.')
console.log('    ⚠ AND THE RAW COLUMN IS THE DRAW BEFORE `ECONOMY.life.bondShave` TOUCHED IT, re-read off')
console.log('      the engine\'s own `seed:life:partner:<w>:lag` stream – so a miss can be attributed to')
console.log('      §4\'s lag table or to the architect\'s shave instead of being guessed at.')
console.log('')
console.log(`    ${pad('openness', 11)}${padL('n first', 9)}${padL('late', 8)}${padL('n all', 8)}${padL('late', 8)}${padL('raw late', 10)}${padL('mean lag', 10)}${padL('mean raw', 10)}   corridor    verdict`)
const LATE_BAR: Record<'private' | 'open', { text: string; ok: (p: number) => boolean }> = {
  private: { text: '>= 60%', ok: (p) => p >= 60 },
  open: { text: '<= 25%', ok: (p) => p <= 25 },
}
for (const openness of ['private', 'open'] as const) {
  const ts = TEMPERAMENTS.filter((t) => temperamentOpenness(t) === openness)
  const all = ts.flatMap((t) => episodesOf(t))
  const first = all.filter((e) => e.ordinal === 0)
  const firstShare = share(`late share · first episodes · ${openness}`, first.filter((e) => e.shavedLag > 0).length, first.length, MIN_N)
  const allShare = share(`late share · all episodes · ${openness}`, all.filter((e) => e.shavedLag > 0).length, all.length, MIN_N)
  const rawShare = share(`raw late share · ${openness}`, all.filter((e) => e.rawLag > 0).length, all.length, MIN_N)
  const bar = LATE_BAR[openness]
  console.log(
    `    ${pad(openness, 11)}${padL(String(firstShare.n), 9)}${padL(`${firstShare.pct.toFixed(1)}%`, 8)}` +
      `${padL(String(allShare.n), 8)}${padL(`${allShare.pct.toFixed(1)}%`, 8)}${padL(`${rawShare.pct.toFixed(1)}%`, 10)}` +
      `${padL(mean(all.map((e) => e.shavedLag)).toFixed(2), 10)}${padL(mean(all.map((e) => e.rawLag)).toFixed(2), 10)}   ` +
      `${pad(bar.text, 12)}${verdict(`bar 3 · ${openness} late share ${bar.text}`, bar.ok(firstShare.pct), `measured ${firstShare.pct.toFixed(1)}% (first episodes, n=${firstShare.n})`)}`,
  )
}
console.log('')
console.log('    ⚠⚠ AND THE SAME BAR PER BOND BAND, which is what makes a miss ATTRIBUTABLE. The shave is the')
console.log('       architect\'s concretisation (brief §4, marked ⚠ there) and this is its price list: what')
console.log('       the lag table costs at each band, whichever band this particular parent produced.')
console.log('')
const allEpisodes = TEMPERAMENTS.flatMap((t) => episodesOf(t))
const bands = ['close', 'steady', 'strained', 'cold'] as const
console.log(`    ${pad('band', 11)}${pad('divisor', 10)}${padL('episodes', 10)}${padL('share of all', 14)}${padL('private late', 14)}${padL('open late', 12)}${padL('mean raw', 10)}${padL('mean shaved', 13)}`)
for (const b of bands) {
  const rows = allEpisodes.filter((e) => e.bandAtArrival === b)
  // ⚠ A BAND NO CAREER REACHED PRINTS «–», NEVER A 0.0%. A zero share and an absent denominator are
  // different facts and this table is not allowed to render them the same – `sample()`'s own rule,
  // applied to a row that is legitimately allowed to be empty.
  const cell = (xs: EpisodeRow[], hit: (e: EpisodeRow) => boolean): string =>
    xs.length === 0 ? '–' : `${((100 * xs.filter(hit).length) / xs.length).toFixed(1)}%`
  const priv = rows.filter((e) => temperamentOpenness(e.temperament) === 'private')
  const open = rows.filter((e) => temperamentOpenness(e.temperament) === 'open')
  console.log(
    `    ${pad(b, 11)}${pad(`⌊/${ECONOMY.life.bondShave[b]}⌋`, 10)}${padL(String(rows.length), 10)}` +
      `${padL(`${((100 * rows.length) / allEpisodes.length).toFixed(1)}%`, 14)}${padL(cell(priv, (e) => e.shavedLag > 0), 14)}` +
      `${padL(cell(open, (e) => e.shavedLag > 0), 12)}${padL(rows.length === 0 ? '–' : mean(rows.map((e) => e.rawLag)).toFixed(2), 10)}` +
      `${padL(rows.length === 0 ? '–' : mean(rows.map((e) => e.shavedLag)).toFixed(2), 13)}`,
  )
}
console.log('')
console.log(`    and what she asked for, drawn on its own key (§4: «~70% toward her own register»):`)
for (const openness of ['private', 'open'] as const) {
  const all = TEMPERAMENTS.filter((t) => temperamentOpenness(t) === openness).flatMap((t) => episodesOf(t))
  const own = share(`wants · ${openness}`, all.filter((e) => e.wants === openness).length, all.length, MIN_N)
  console.log(`      ${pad(`${openness} girls`, 16)}drew '${openness}' ${own.pct.toFixed(1)}% of ${own.n}   (proposal 70%, no bar)`)
}

// =================================================================================================
// §6. THE LATCH PROXY – ⚠ PRINTED, AND IT IS NOT A BAR IN THIS WAVE
// =================================================================================================

rule('§6. THE LATCH PROXY – carried into year two   ⚠⚠ PRINTED AND UNSIGNED (step 6\'s, not this wave\'s)')
console.log('    §4\'s bar is «first or second love reaches the latch» (quiet >= 50%, fiery <= 20%).')
console.log('    ⭐ RE-AIMED BY CENSUS v2 AND STILL UNSIGNED, WHICH IS THE HONEST HALF. Wave 3 could not read this')
console.log('    column at all – nothing ended an attachment, so the share was 100% by construction in the game and')
console.log('    a readback of the tool\'s own duration table in the poked mode. Neither was a property of the sim.')
console.log('    The number below IS one now: it is the engine\'s own ending hazard against a year. What it still is')
console.log('    NOT is the LATCH – there is no marriage, no moving in and no step-6 mechanic on this tree, so «a year')
console.log('    without ending» is a PROXY the architect chose and not the bar §4 wrote. It is printed for step 6 to')
console.log('    land on, and it is marked so nobody signs it. NO VERDICT.')
console.log('')
console.log(`    ${pad('temperament', 13)}${padL('episodes with a year to run', 29)}${padL('still open at +52w', 20)}${padL('closed form', 14)}`)
for (const t of TEMPERAMENTS) {
  const cs = byT(t)
  const eligible = cs.flatMap((c) => c.episodes.filter((e) => e.sinceWeek + WEEKS_PER_YEAR <= c.weeks))
  const s = sample(`latch proxy · ${t}`, eligible.map((e) => e.sinceWeek), 1)
  const carried = eligible.filter((e) => e.endedWeek === null || e.endedWeek - e.sinceWeek >= WEEKS_PER_YEAR).length
  console.log(
    `    ${pad(t, 13)}${padL(String(s.xs.length), 29)}${padL(`${((100 * carried) / s.xs.length).toFixed(1)}%`, 20)}${padL(`${(100 * (1 - endsHazardFor(t)) ** WEEKS_PER_YEAR).toFixed(1)}%`, 14)}`,
  )
}

// =================================================================================================
// §7. THE INPUT-INDEPENDENCE ARM – ASSERTED, NOT EYEBALLED
// =================================================================================================
//
// CLAUDE.md invariant 2: «A no-action run and an action-laden run under the same code must tap
// identical MAIN sequences. Player choices may never re-roll the world's dice.» For this layer the
// property has a sharper form, written down in `shaveLag`'s own banner and in the brief's §0.2:
//
//     `sinceWeek` is keyed on (seed, calendar) and MUST be identical across the two runs;
//     `knownWeek` MAY differ, deliberately, because the bond shave is the relationship the player
//     built – disclosure moving with the relationship is the design, not a re-roll.
//
// ⚠⚠ SO THE ARM CARRIES ITS OWN POSITIVE CONTROL, and it is not a nicety. Two arms that turned out
// to be the SAME career would pass the `sinceWeek` equality trivially and prove nothing – the
// byte-identical-diff failure CLAUDE.md records from 17.08. So the arm ALSO requires that the two
// runs genuinely diverged somewhere (bond), and it throws if they did not.
//
// ⭐⭐ v75 T7 – AND THE ARM IS STRICTLY STRONGER WALKED THAN IT WAS POKED. It used to compare lists
// whose SECOND and later entries existed only because the tool had ended the first at a fixed week;
// now every entry after the first is downstream of `seed:life:ends:<week>` and of the cooldown, so
// the equality being asserted covers the ENDING hazard's key as well as the arrival's. Neither key
// can see a player choice, and this is where that is proven rather than argued.

rule('§7. THE INPUT-INDEPENDENCE ARM – identical `sinceWeek` lists, asserted')
console.log('    no-action  : enters nothing, books nothing, reviews no coach, answers no knock and no')
console.log('                 birthday – it answers ONLY what the engine refuses to move without (her')
console.log('                 beats, bond-neutrally; the fork; the retirement offer).')
console.log('    action-laden: the `player` policy – reserve, rest floor, the coach on event weeks, the')
console.log('                 off-season family week, the mid-season rescue – plus every knock rested and')
console.log('                 every birthday answered.')
console.log('')
const NO_ACTION: WalkOpts = { policy: POLICIES[0], veto: () => true, decides: false, weeks: WEEKS }
const LADEN: WalkOpts = { policy: POLICIES[1], decides: true, weeks: WEEKS }
let pairs = 0
let arrivalsCompared = 0
let sinceMismatch = 0
let knownDiffer = 0
let bondDiffer = 0
let truncated = 0
console.log(`    ${pad('seed', 12)}${pad('temperament', 13)}${padL('weeks A', 9)}${padL('weeks B', 9)}  ${pad('bands A / B', 20)}${padL('sinceWeek list', 48)}   identical`)
for (const t of TEMPERAMENTS) {
  for (let i = 0; i < PAIRS_PER_TEMPERAMENT; i++) {
    const seed = `indep-${i}`
    const a = walk(seed, t, NO_ACTION)
    const b = walk(seed, t, LADEN)
    pairs++
    // ⚠ THE COMMON PREFIX, NOT THE WHOLE LIST, when the two careers are not the same LENGTH. A career
    // that ended early in one arm has fewer weeks in which to meet anybody, and comparing a 520-week
    // list with a 300-week one would report a calendar difference as a fairness breach. The
    // truncation is COUNTED and printed, because an arm pair that never lines up is not evidence.
    const horizon = Math.min(a.weeks, b.weeks)
    if (a.weeks !== b.weeks) truncated++
    const sa = a.episodes.filter((e) => e.sinceWeek <= horizon).map((e) => e.sinceWeek)
    const sb = b.episodes.filter((e) => e.sinceWeek <= horizon).map((e) => e.sinceWeek)
    const same = sa.length === sb.length && sa.every((w, k) => w === sb[k])
    if (!same) sinceMismatch++
    arrivalsCompared += sa.length
    for (let k = 0; k < Math.min(sa.length, sb.length); k++) {
      if (a.episodes[k].knownWeek !== b.episodes[k].knownWeek) knownDiffer++
    }
    if (a.bondFinal !== b.bondFinal) bondDiffer++
    // ⚠ THE BANDS ARE PRINTED BECAUSE A `knownWeek` THAT DID NOT MOVE IS NOT THE SAME CLAIM AS A
    // `knownWeek` THAT COULD NOT MOVE. The shave is a STEP function of the band (⌊/3⌋ · ⌊/2⌋ · ⌊/1⌋),
    // so two arms whose arrivals all landed inside ONE step divide by the same number and agree by
    // arithmetic rather than by law. This column is what says which of the two the run saw.
    const bandsOf = (c: CareerRow): string => [...new Set(c.episodes.map((e) => e.bandAtArrival))].join('+') || '–'
    console.log(
      `    ${pad(seed, 12)}${pad(t, 13)}${padL(String(a.weeks), 9)}${padL(String(b.weeks), 9)}  ${pad(`${bandsOf(a)} / ${bandsOf(b)}`, 20)}${padL(`[${sa.join(',')}] vs [${sb.join(',')}]`, 48)}   ${same ? 'yes' : '⚠⚠ NO'}`,
    )
  }
}
console.log('')
console.log(`    pairs walked                      : ${pairs}   (${PAIRS_PER_TEMPERAMENT} per temperament)`)
console.log(`    arrival weeks compared            : ${arrivalsCompared}`)
console.log(`    pairs whose walks differ in length: ${truncated}   (compared on the common prefix)`)
console.log(`    pairs whose FINAL BOND differs    : ${bondDiffer}/${pairs}   ← the positive control: the two arms really are two careers`)
console.log(`    episodes whose knownWeek differs  : ${knownDiffer}   ← ALLOWED by the brief (§0.2: the bond shave is the`)
console.log('                                          relationship the player built, not the world\'s dice). A ZERO here is')
console.log('                                          not a failure: the shave is a STEP function of the band, so two arms')
console.log('                                          inside one band divide by the same number – read the bands column.')
console.log('')
// ⚠⚠ THE ASSERTIONS. Not a printed «yes» – three throws.
if (arrivalsCompared === 0) {
  throw new Error('the independence arm compared ZERO arrival weeks – it asserted an equality between two empty lists')
}
if (bondDiffer === 0) {
  throw new Error(
    'the two independence arms produced identical bond in every pair – they are the same career, ' +
      'and the `sinceWeek` equality below would be comparing a thing with itself (CLAUDE.md, 17.08)',
  )
}
if (sinceMismatch > 0) {
  throw new Error(`INPUT-INDEPENDENCE VIOLATED: ${sinceMismatch}/${pairs} pairs produced different arrival weeks`)
}
console.log(`    ✓ ASSERTED: ${arrivalsCompared} arrival weeks over ${pairs} pairs, ZERO mismatches. A player choice does not`)
console.log('      reach `seed:life:arrival:<week>` – CLAUDE.md invariant 2, for this layer.')
console.log(`    ✓ AND THE ARM IS NOT VACUOUS: the two runs really are two careers – final bond differs in`)
console.log(`      ${bondDiffer}/${pairs} pairs. Disclosure – knownWeek – moved in ${knownDiffer} episodes.`)

// =================================================================================================
// §8. THE VERDICT SHEET
// =================================================================================================

rule('§8. THE VERDICT SHEET')
if (MISSES.length === 0) {
  console.log('    every corridor HIT.')
} else {
  console.log(`    ⚠⚠ ${MISSES.length} BAR(S) OFF CORRIDOR. These are FINDINGS FOR THE ARCHITECT and this run`)
  console.log('       exits 0: invariant 5 – numbers are MEASURED, never adjusted. No constant was touched.')
  console.log('')
  for (const m of MISSES) console.log(`      MISS  ${m}`)
}
console.log('')
console.log('    ⚠ Reminder for whoever reads the count table: §3 is WALKED. Every ending on this grid was')
console.log('      written by `rollEnds`, and §2 is the control that proves each one of them legal.')
console.log('')
// ⭐⭐ v75 T3b – WHAT THE DRAIN PUT ON THE SCALE, AS ARITHMETIC. Zero today, and the line is printed
// anyway: «the harness answered 2,700 beats and none of them cost anything» is the claim every bond
// figure above rests on, and an unprinted claim is one nobody can check.
console.log(`    drain skew this run: ${drainSkewLine(DRAINED)}`)
console.log('      ⚠ these answers are the harness\'s, not a player\'s. The registry that picks them is')
console.log('        `DRAIN_ANSWER` in tools/_lifeBeats.ts and its price is read-independent by law.')
console.log('')
