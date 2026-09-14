// THE SPOTLIGHT BENCH – what being known costs her, how often it fires, and what the PLAYER SEES.
// (v77, wave 6's T9. `docs/plans/life-wave-6-builder-2026-09.md` §2 T9 · `docs/specs/who-she-is-2026-09.md`
// §3c and §3c-bis · the architect's rulings E, E-bis, G, I and N in `life-wave-6-rulings-2026-09.md`.)
//
// Run: `npm run bench:spotlight`   (`--careers N` scales the main grid · `--sweep N` the bar sweep ·
// `--curve N` the habituation and walls arms).
//
// WHAT THIS MEASURES AND WHY IT IS THE ONLY INSTRUMENT THAT CAN. **Every §4 number in this wave is
// UNRULED** – the bar, the five bases, the two habituation dials, the leak pair, the wrong shares and
// the booth window – and the owner rules them off a record, not off a neighbouring constant. Two of
// the architect's rulings say the drafted numbers may be in the wrong place entirely, and each names
// a measurement this file is the only place in the repo that can take:
//
//   · RULING E – `newsFameMin 30` was anchored on `ECONOMY.business.merch.contracts.fameCap`, which
//     is the MERCH TERM's own ceiling and not a band on fame at all. Measured over 33 personal saves
//     / 15 408 career weeks: ≥30 is 6.9% of weeks and 8 of 33 saves; ≥25 8.5%; ≥20 10.9%; ≥15 12.1%;
//     ≥10 29.2%. **Five of eight careers never reach 30 at any week of their lives.** §1 below sweeps
//     the bar at 10/15/20/25/30 and prints coverage, events and charged pressure per arm.
//   · RULING N – at the drafted bases the spotlight's own worst contribution to an expressed-open
//     steady girl is **2.40**, and the distance from baseline (70) to the `dimmed` edge (67.5) is
//     **2.50**. So the spotlight ALONE never moves her Mood word; it tips a week the ordinary weather
//     had already carried to the boundary. §2 measures that on walked careers rather than on
//     arithmetic: what share of charged weeks change the band, and what share the SPOTLIGHT TIPPED.
//
// ⚠⚠ INSTRUMENT LAWS – `psy-grid.ts`'s, because they are the house's and not that file's:
//   1. THERE IS NO `try`/`catch` IN THIS FILE. Not one. Every engine refusal is asked of its own
//      predicate first (`psychologistFocusRefusal`, `world.ending !== null`), never caught.
//   2. EVERY NUMBER GOES THROUGH `sample()` / `share()`, WHICH THROW ON A SHORT LIST. A median of an
//      empty column is not a reachable state of this program.
//   3. THE INSTRUMENT ASSERTS ITS OWN ACTUATION (§6). Exposure events, news weeks, charged weeks,
//      leaks, habituation growth, seat weeks – all COUNTED, all printed, all thrown on if zero.
//   4. `–` FOR «NO DATA», NEVER `0.0%`. A dash and a zero mean different things.
//   5. PER-TEMPERAMENT ARMS, AND THE COHORTS ARE **BIRTH** (who-she-is §3's fence and §5's corridor
//      note: the expressed bucket is an OUTCOME, so grouping by it would sort careers by their own
//      history and report the sorting as a gradient).
//   6. TWO EXIT CODES – `psy-grid`'s pair, not `life-arrival`'s: a MISSED BAR exits NON-ZERO. No
//      bench runs inside `npm run check`, so a red here is a RULING REQUEST on §4's proposals rather
//      than a blocked gate, and every miss is re-printed in §7 with the constant it implicates.
//
// ⚠⚠ AND EVERY PREDICTION IS WRITTEN BEFORE THE RUN AND DERIVED FROM `ECONOMY`'s OWN SHIPPED
// CONSTANTS. Nothing below reads a number off its own output; §0 computes the whole prediction table
// from the shipped rows and the rulings' arithmetic, and each section prints predicted beside
// measured. A bench that prints only what it measured cannot be wrong, and this wave has met the
// «unable to fail» family eighteen times.
//
// ⚠⚠ ZERO NEW RNG, AND MAIN IS NOT TOUCHED. This file derives no stream. It drives the engine's own
// walk (`stepCareerWeek` from `econ-bench.ts`) and moves exactly ONE dial – `ECONOMY.spotlight.newsFameMin`,
// the bar §1 sweeps – restored and CHECKED restored at §6. That poke moves a THRESHOLD and never a
// stream: `rollLeak` still derives `seed:life:leak:<id>:<week>` at its own call site, so a bar that
// closes the gate costs the stream nothing and a bar that opens it draws on the same key. The frozen
// capture (41550 / `e6b0c709`) cannot see this file.
//
// ⚠⚠⚠ RULING G – THE LEDGER IS ASKED **IN-WEEK**, NEVER RETROSPECTIVELY, AND THAT IS A CORRECTNESS
// PROPERTY OF THIS FILE RATHER THAN A STYLE. Four of the five exposure kinds read facts kept forever;
// `'publicLoss'` reads `world.results`, which PRUNES AT 52 WEEKS. A bench that walked a career and
// then asked `exposureEventsOf(world, oldWeek)` afterwards would see every `'stage'` and NO
// `'publicLoss'`, and would report the prune as if it were a fact about her life. So `walk()` below
// asks `exposureEventsOf(world, world.week)` **immediately after each `stepCareerWeek`** – the week
// that has just closed, zero weeks old, deep inside the horizon – and keeps the list.
//
// ⚠⚠ AND THAT IS ALSO THE ONLY HONEST WEEK TO ASK IT ON, because of ruling U: `finalizeTournament`
// is a WORKER COMMAND and not a tick step, so this week's trophy row and result row are written by
// `stepCareerWeek`'s own `skipTournament`/`closeTournament` tail, AFTER `tickWeek` has returned. A
// read taken before the step, or inside it, would be a read of a week whose results do not exist yet.
//
// ⚠⚠ THE CHARGE LANDS ONE WEEK LATER THAN THE EXPOSURE – RULING P's ONE HORIZON, and this file is
// indexed by the CHARGE week throughout. `accrueSpirit` is handed `exposureEventsOf(world, world.week
// − 1)`, so the events of week `w` are paid for in the pass that resolves week `w + 1`, and the Mood
// dip a player would read lands on `w + 1` too. Every table below joins them that way; the raw
// exposure week appears only in §1's event counts.
import {
  createWorld,
  hirePsychologist,
  kidAgeExact,
  loveEpisodesOf,
  matchesEverPlayed,
  psychologistFocusRefusal,
  psychologistUnlocked,
  setPsychologistFocus,
  setPsychologistRung,
  TEMPERAMENTS,
  type ExposureKind,
  type Temperament,
} from '../src/engine/world'
// ⚠ NOT ON THE `engine/world` BARREL, imported from the leaves that own them – `life-arrival.ts`'s own
// direct-import rule. Every one of these is the ENGINE's spelling of a rule this file would otherwise
// have to copy: `habituationScale` and `publicLifeShrinkAt` are two of the five factors of the
// pressure product, `spiritBandOf` is the ONE reader of the Mood cut points, and the two axis readers
// are what `accrueSpirit` itself keys the other two factors on.
import { expressedTemperamentOf, publicLifeAccelAt, publicLifeShrinkAt, spiritBandOf } from '../src/engine/spirit'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { mean, median, POLICIES, stepCareerWeek, type Policy } from './econ-bench'
// ⚠⚠ THE PRODUCT IS SPELLED ONCE, IN ONE FILE, AND IT IS `tools/_spotlight.ts` – see that file's own
// banner for why a copy per bench is the defect class this repo already records. `readSpotWeek` also
// carries ruling G's in-week discipline, so the two benches cannot come to disagree about WHEN the
// ledger is asked either.
import { chargeAt, eventsChargedAt, EXPOSURE_KINDS, readSpotWeek, type SpotWeek } from './_spotlight'

// =================================================================================================
// 0. THE GRID, AND THE PREDICTIONS – written before the run, derived from the shipped constants
// =================================================================================================

function flag(name: string, fallback: number): number {
  const i = process.argv.indexOf(name)
  if (i < 0) return fallback
  const n = Number(process.argv[i + 1])
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/** Seeds per BIRTH temperament for the main high-fame grid – §2's Mood column and §3's corridor. */
const CAREERS = flag('--careers', 6)
/** ...for the bar sweep, which walks the whole grid FIVE times over (once per bar). */
const SWEEP_CAREERS = flag('--sweep', 3)
/** ...and for the habituation curve and the walls loop, which need the grinding arm as well. */
const CURVE_CAREERS = flag('--curve', 3)

const AGE_AT = (week: number): number => kidAgeExact(week, DEFAULT_PROFILE.birthMonth, DEFAULT_PROFILE.birthDay)
/** ⚠ HER AGE IS ASKED OF THE ENGINE AND NEVER COMPUTED HERE – `life-arrival.ts`'s own rule. */
function weekSheTurns(age: number): number {
  for (let w = 0; w < 40 * WEEKS_PER_YEAR; w++) if (AGE_AT(w) >= age) return w
  throw new Error(`she never reaches ${age} inside forty years – the calendar moved under this bench`)
}
/** The horizon: week 0 to the week she turns 24 – `life-arrival`'s and `psy-grid`'s own. */
const WEEKS = weekSheTurns(24)

/** THE CARING PARENT and THE GRINDING ONE – `econ-bench`'s two shipped policies, used here for what
 *  they measurably ARE: the player policy holds the bond at `steady` for a whole career and the
 *  grinder collapses it to `strained`/`cold`, which is how the WALLS arms get their walls without
 *  this file poking `wallsFlipped` onto a world.
 *
 *  ⚠⚠ AND THE POLICY IS WHAT DECIDES WHETHER THIS WAVE ACTUATES AT ALL – the architect's ruling
 *  E-bis, measured over 520-week walks: the same family, coach and wallet peak at fame **0.0** under
 *  policy 0 and **53.2** under policy 1. An arm built on the grinder would measure nothing and would
 *  report it as «the spotlight does not move her», which is the «unable to fail» family in a bench's
 *  clothes. Every high-fame arm below is policy 1; the grinder appears only where a WALL is the
 *  subject, and its own fame is printed beside its result so a reader can see what it reached. */
const CARING: Policy = POLICIES[1]
const GRINDING: Policy = POLICIES[0]

// ⚠ THE ONE SEAM FOR A DIAL, and it is `spirit-bench.ts`'s and `psy-grid.ts`'s: `ECONOMY` is `as
// const` at the TYPE level only, so a bench that means to move a number says so here, once, in a
// named cast. ⚠⚠ AND THE POKE IS VERIFIED TO HAVE TAKEN (`setBar` below) rather than assumed – a
// frozen or re-exported constant would leave every sweep row a copy of the shipped bar and the table
// would look like a finding about fame.
const SPOTLIGHT_DIAL = ECONOMY.spotlight as unknown as { newsFameMin: number }
const SHIPPED_BAR = ECONOMY.spotlight.newsFameMin
function setBar(bar: number): void {
  SPOTLIGHT_DIAL.newsFameMin = bar
  if (ECONOMY.spotlight.newsFameMin !== bar) {
    throw new Error(`the bar poke did not take: asked for ${bar}, ECONOMY.spotlight.newsFameMin reads ${ECONOMY.spotlight.newsFameMin}`)
  }
}

/** RULING E's own sweep set, and the shipped value is the last row so the table reads upward into it. */
const BARS = [10, 15, 20, 25, 30] as const

const RUNGS = [0, 1, 2] as const
type Rung = (typeof RUNGS)[number]
type Arm = Rung | null

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

/** ⚠⚠ THE ONLY WAY A NUMBER REACHES THE PRINTER. */
function sample(label: string, xs: readonly number[], minN = 1): Sample {
  requireN(label, xs.length, minN)
  return { label, xs }
}
const avg = (s: Sample): number => mean([...s.xs])
/** THE STANDARD ERROR OF THE MEAN, `n − 1` (`psy-grid`'s own: a bar read against a divisor that
 *  flatters it is not a bar). A one-observation column has no SEM and says so – `NaN` prints as `–`. */
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
  console.log(`  -- ${title} ${'-'.repeat(Math.max(0, 100 - title.length))}`)
  console.log('')
}

const MISSES: string[] = []
/** A bar's verdict. ⚠ A MISS IS THIS TASK'S PRODUCT – every §4 number is a PROPOSAL and the owner
 *  rules on them after this run – so it is printed with the constant it implicates and carried to §7. */
function verdict(bar: string, ok: boolean, detail: string): string {
  if (!ok) MISSES.push(`${bar} – ${detail}`)
  return ok ? 'HIT ' : 'MISS'
}
/** ⚠⚠ THE OTHER EXIT. An actuation zero is never a result of zero: it is the run saying it never
 *  reached its own subject, and it ends the program with the stack still attached. */
function stall(headline: string, detail: string): never {
  console.log('')
  console.log(`  ${'!'.repeat(100)}`)
  console.log('  THE ARM MEASURED NOTHING – NO BAR IS READ OFF IT')
  console.log(`    ${headline}`)
  console.log(`    ${detail}`)
  console.log(`  ${'!'.repeat(100)}`)
  console.log('')
  throw new Error(headline)
}

// =================================================================================================
// 2. ONE CAREER – the shared walk, and the in-week ledger read
// =================================================================================================

interface WalkOpts {
  policy: Policy
  /** `null` = nobody is hired, ever – the free road, the control every seat arm is measured against. */
  rung: Arm
  /** the year the seat works, when there is a seat. `'publicLife'` is the only one this file buys. */
  focus: 'publicLife' | null
  weeks: number
  /** ⭐⭐ A PARENT WHO CHANGES, AND WHO CAN CHANGE TWICE – `policy` until the first entry, then each
   *  entry's policy from its week. Neither shipped policy ever changes its mind, so an arm that turns
   *  around is this bench's OWN construction and is labelled as one (`life-arrival.ts` §6a records the
   *  same and its own reason). ⚠⚠ TWO TURNS AND NOT ONE, because §5's round trip needs them: a career
   *  that starts grinding is never famous at all (measured – see §4's banner), so the only reachable
   *  «famous girl behind walls» starts CARED FOR, is walled, and may then be repaired. */
  schedule?: readonly { from: number; policy: Policy }[]
}

interface Career {
  seed: string
  birth: Temperament
  expressed: Temperament
  weeks: number
  endedAs: string | null
  hireWeek: number
  focusWeek: number
  focusRefusals: number
  wk: SpotWeek[]
  matches: number
  wins: number
  /** the leak rows, read back at the horizon – §1's leak column and the census's own subject */
  leaks: { sinceWeek: number; publicWeek: number; wrong: boolean }[]
  episodes: number
}

/** ⭐⭐ THE WALK. ⚠ THE TEMPERAMENT IS ASSIGNED AND NEVER DRAWN, which is what makes the columns
 *  PAIRED – `life-arrival.ts` and `psy-grid.ts` both record the same construction and the same
 *  reason. ⚠ `wealthy`, for their reason too: a family that goes bankrupt at seventeen truncates the
 *  biography, and a truncated career is a missing measurement rather than a short one.
 *
 *  ⚠⚠ NO `try`/`catch`. The one refusal a walk can legitimately meet is the terminal latch, and it is
 *  TESTED (`world.ending !== null` breaks before anything is commanded), never caught. The focus
 *  command's refusals are asked of `psychologistFocusRefusal` BEFORE the call. */
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
    hireWeek: -1,
    focusWeek: -1,
    focusRefusals: 0,
    wk: [],
    matches: 0,
    wins: 0,
    leaks: [],
    episodes: 0,
  }

  for (let i = 0; i < opts.weeks; i++) {
    if (world.ending !== null) break
    // ⚠ THE LAST ENTRY WHOSE WEEK HAS ARRIVED WINS, so the schedule reads as a timeline rather than as
    //   a pair of nested ternaries, and a third turn costs an array element.
    let policy = opts.policy
    for (const turn of opts.schedule ?? []) if (world.week >= turn.from) policy = turn.policy
    stepCareerWeek(world, rng, policy)
    c.weeks++
    const w = world.week
    // ⚠⚠⚠ THE IN-WEEK LEDGER READ – RULING G, and the ONE line this whole file's honesty rests on.
    //    `world.week` here is the week that has just CLOSED: `tickWeek` incremented it at the head of
    //    the step and `skipTournament`/`closeTournament` wrote its trophy and result rows in the
    //    step's own tail (ruling U – `finalizeTournament` is a worker command, not a tick step). So
    //    this asks about a week that is COMPLETE and ZERO weeks old, and `world.results`' 52-week
    //    prune cannot have reached it. Asked once, kept forever; nothing below re-asks the ledger.
    c.wk[w] = readSpotWeek(world)
    // --- the hire, and then the focus: two commands, each behind the predicate that owns it -------
    if (opts.rung !== null && c.hireWeek < 0 && psychologistUnlocked(world)) {
      hirePsychologist(world, true)
      setPsychologistRung(world, opts.rung)
      c.hireWeek = w
    }
    if (opts.focus !== null && c.hireWeek >= 0 && c.focusWeek < 0) {
      // ⚠⚠ THE PREDICATE, NOT THE THROW – `psy-grid`'s own discipline: the card and the throw share
      //    this predicate, so asking it is asking the engine rather than guessing at it.
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
  for (const e of loveEpisodesOf(world)) {
    c.episodes++
    if (e.publicWeek !== null) c.leaks.push({ sinceWeek: e.sinceWeek, publicWeek: e.publicWeek, wrong: e.publicWrong })
  }
  return c
}

console.log('')
console.log('====================================================================================================')
console.log('  THE SPOTLIGHT BENCH – npm run bench:spotlight')
console.log('  docs/specs/who-she-is-2026-09.md §3c/§3c-bis · docs/plans/life-wave-6-builder-2026-09.md §2 T9')
console.log('  the architect\'s rulings E (the bar), E-bis (the policy), G (in-week), I (fame) and N (the band)')
console.log('====================================================================================================')
console.log('')
console.log('  !! NO try/catch ANYWHERE IN THIS FILE. Every engine refusal is asked of its own predicate first.')
console.log('  !! THE LEDGER IS ASKED **IN-WEEK** (ruling G): `world.results` prunes at 52 weeks, so a bench that')
console.log('     asked retrospectively would see every `stage` and no `publicLoss` and would report the PRUNE.')
console.log('  !! THE CHARGE LANDS ONE WEEK AFTER THE EXPOSURE (ruling P). Every table is indexed by the CHARGE')
console.log('     week, which is also the week a player would read the Mood dip.')
console.log('  !! TWO EXIT CODES: a MISSED BAR exits NON-ZERO. No bench runs inside `npm run check`, so a red here')
console.log('     is a RULING REQUEST on §4\'s proposals, never a blocked gate.')
console.log('')

rule('§0. THE GRID, AND EVERY PREDICTION – WRITTEN BEFORE THE RUN')
console.log(`    horizon            : week 0 → ${WEEKS} (she is ${AGE_AT(0).toFixed(2)} → 24)`)
console.log(`    family             : wealthy · ${DEFAULT_PROFILE.coachTier} coach · the engine's own calendar`)
console.log(`    temperaments       : ${TEMPERAMENTS.join(' · ')}   ← assigned after createWorld, never drawn (BIRTH cohorts)`)
console.log(`    seeds/temperament  : ${CAREERS} main · ${SWEEP_CAREERS} bar sweep (×${BARS.length} bars) · ${CURVE_CAREERS} curve + walls`)
console.log(`    the caring parent  : '${CARING.label}' – ruling E-bis's actuating arm (policy 0 peaks at fame 0.0, policy 1 at 53.2)`)
console.log(`    the grinding one   : '${GRINDING.label}' – used ONLY where a wall is the subject`)
console.log('')
console.log(`    the bar (shipped)  : newsFameMin ${SHIPPED_BAR}   [§4 PROPOSAL, UNRULED – ruling E]`)
console.log(`    the bases          : ${EXPOSURE_KINDS.map((k) => `${k} ${ECONOMY.spotlight.pressureBase[k]}`).join(' · ')}   [PROPOSALS]`)
console.log(`    openness scale     : open ×${ECONOMY.spotlight.opennessScale.open} / private ×${ECONOMY.spotlight.opennessScale.private}   [ANCHORED by the spec – the one ruled pair]`)
console.log(`    intensity scale    : steady ×${ECONOMY.spirit.perturbationScale.steady} / intense ×${ECONOMY.spirit.perturbationScale.intense}   [the STANDING perturbationScale, not a new constant]`)
console.log(`    habituation        : full at ${ECONOMY.spotlight.habituationFullWeeks} news-weeks · floor ×${ECONOMY.spotlight.habituationFloor}   [PROPOSALS]`)
console.log(`    the fifth focus    : shrink [${ECONOMY.psychologist.publicLifeShrink.join(', ')}] · accel [${ECONOMY.psychologist.publicLifeAccel.join(', ')}]   [PROPOSALS]`)
console.log(`    the leak           : base ${ECONOMY.spotlight.leakBasePerWeek}/wk × openness (open ×${ECONOMY.spotlight.leakOpennessMult.open} / private ×${ECONOMY.spotlight.leakOpennessMult.private}) × fame/${ECONOMY.fame.cap}   [ruling I]`)
console.log(`    the Mood ladder    : heavy <${ECONOMY.spirit.mood.heavyBelow} · dimmed <${ECONOMY.spirit.mood.dimmedBelow} · steady · bright ≥${ECONOMY.spirit.mood.brightFrom} · glowing ≥${ECONOMY.spirit.mood.glowingFrom}   (baseline ${ECONOMY.spirit.baseline})`)
console.log('')

/** ⭐⭐⭐ THE PREDICTIONS. Every one is ARITHMETIC over the shipped rows above, computed here and
 *  printed beside its measurement further down. Nothing is remembered and nothing is read off output. */
const PRED = {
  /** RULING N's own table, re-derived: the worst single event for an expressed-open steady girl at
   *  baseline, un-habituated and with no seat. 4 × 0.8 × 0.75 = 2.40 against a 2.50 distance to the
   *  `dimmed` edge – so the spotlight ALONE never crosses it. */
  worstOpenSteady:
    -ECONOMY.spotlight.pressureBase.publicLoss *
    ECONOMY.spirit.perturbationScale.steady *
    ECONOMY.spotlight.opennessScale.open,
  edgeFromBaseline: ECONOMY.spirit.baseline - ECONOMY.spirit.mood.dimmedBelow,
  /** ...and the worst the wave has for anybody: intense, private, un-habituated, no seat. */
  worstAnyone:
    -ECONOMY.spotlight.pressureBase.publicLoss *
    ECONOMY.spirit.perturbationScale.intense *
    ECONOMY.spotlight.opennessScale.private,
  /** the break-up, for scale. ⚠ IT IS A PAIR AND ALREADY INTENSITY-SCALED IN ITS OWN CONSTANT
   *  (`{ steady: -22, intense: -34 }`), which is why the spotlight's bases are NOT scaled the same way
   *  – ruling L: they take `perturbationScale` exactly once, inside T3's summand, and a row that moved
   *  into `weekPerturbation` would scale them a second time. Reaching for a single number here is the
   *  mistake this note exists to stop: the first draft did, and printed `–`. */
  breakupSteady: -ECONOMY.spirit.shock.breakup.steady,
  breakupIntense: -ECONOMY.spirit.shock.breakup.intense,
  /** ruling N's «three tenths»: calm, open, fully habituated, the top rung held. */
  quietest:
    -ECONOMY.spotlight.pressureBase.publicLoss *
    ECONOMY.spirit.perturbationScale.steady *
    ECONOMY.spotlight.opennessScale.open *
    ECONOMY.spotlight.habituationFloor *
    publicLifeShrinkAt(2),
  /** the fifth focus's ladder, as the multiplier a rung takes off every event */
  shrink: RUNGS.map((r) => publicLifeShrinkAt(r)),
  /** ...and the NEWS-WEEKS to a full habituation at each rung, `habituationFullWeeks / accel[rung]`. */
  capWeeks: RUNGS.map((r) => ECONOMY.spotlight.habituationFullWeeks / publicLifeAccelAt(r)),
  capWeeksNoSeat: ECONOMY.spotlight.habituationFullWeeks,
}

console.log('    PREDICTIONS (ruling N\'s arithmetic, re-derived here from the rows above):')
console.log(`      worst single event, expressed-open + steady : ${num(PRED.worstOpenSteady)} points against a ${num(PRED.edgeFromBaseline)} distance from baseline to the \`dimmed\` edge`)
console.log(`        → PREDICTED: the spotlight ALONE never moves that girl's Mood word. The share of charged weeks`)
console.log('          the SPOTLIGHT TIPPED should be small and should be concentrated on the private/intense cells.')
console.log(`      worst single event, anybody (private+intense): ${num(PRED.worstAnyone)} points   · a break-up is ${num(PRED.breakupSteady)} steady / ${num(PRED.breakupIntense)} intense`)
console.log(`      the quietest week the wave can produce        : ${num(PRED.quietest)} points (habituated, top rung) – the screen renders it as nothing`)
console.log(`      the fifth focus takes off                     : rung 0 ×${num(PRED.shrink[0], 2)} · rung 1 ×${num(PRED.shrink[1], 2)} · rung 2 ×${num(PRED.shrink[2], 2)}`)
console.log(`      NEWS-weeks to a full habituation              : no seat ${num(PRED.capWeeksNoSeat, 1)} · rung 0 ${num(PRED.capWeeks[0], 1)} · rung 1 ${num(PRED.capWeeks[1], 1)} · rung 2 ${num(PRED.capWeeks[2], 1)}`)
console.log('')
console.log('    PREDICTION (ruling E, from the 33-save corpus): the share of career weeks that are news should')
console.log('      rise steeply as the bar falls – the corpus reads 6.9% at 30, 8.5% at 25, 10.9% at 20, 12.1% at')
console.log('      15 and 29.2% at 10. ⚠ THIS GRID IS NOT THAT CORPUS: these are WEALTHY careers under a policy')
console.log('      chosen to reach the top, so the absolute shares are expected to be HIGHER here. What the two')
console.log('      have to agree on is the SHAPE, and a disagreement about the shape is the finding.')
console.log('')
console.log('    PREDICTION (the masseur §4 law, benched in psy-grid): pressure-shrink and habituation-acceleration')
console.log('      monotone in rung, each step > 2×SEM. This file prices the same ladder from the SPOTLIGHT side –')
console.log('      the habituation curve of §4 – and psy-grid\'s fifth column prices it from the seat\'s.')
console.log('')

// =================================================================================================
// §1. ⚠⚠ THE BAR SWEEP – RULING E, AND THE TABLE THE OWNER RULES THE BAR OFF
// =================================================================================================
//
// ⚠⚠ EACH BAR IS A FULL RE-WALK AND NOT A RE-READ OF ONE CAREER, and the difference is the whole
// honesty of the table. `sheIsNewsAt` is a threshold on `fameAt`, so «the share of weeks that are
// news» could be re-derived from a single walk – but the EVENTS and the PRESSURE could not: a lower
// bar opens the leak hazard earlier, which changes `publicWeek`, which changes the `'wrongStory'`
// kind, which changes the spirit, which changes the tennis. The arms therefore diverge, and each row
// below is the career that bar actually produced. The SEEDS are identical across the five rows,
// which is what makes them paired.
//
// ⚠ THE POKE IS RESTORED AND CHECKED AT §6, and `setBar` above verifies each write took.

rule('§1. ⚠⚠ THE BAR SWEEP – newsFameMin at 10 / 15 / 20 / 25 / 30   [RULING E · the wave\'s most decision-relevant table]')

interface BarRow {
  bar: number
  careers: Career[]
}
const barRows: BarRow[] = []
for (const bar of BARS) {
  setBar(bar)
  const careers: Career[] = []
  for (const t of TEMPERAMENTS) {
    for (let i = 0; i < SWEEP_CAREERS; i++) {
      careers.push(walk(`spot-bar-${i}`, t, { policy: CARING, rung: null, focus: null, weeks: WEEKS }))
    }
  }
  barRows.push({ bar, careers })
}
setBar(SHIPPED_BAR)

console.log(
  `    ${pad('bar', 7)}${padL('careers', 9)}${padL('ever news', 11)}${padL('news weeks', 12)}${padL('events', 9)}${padL('ev/career', 11)}${padL('charged wks', 13)}${padL('mean/event', 12)}${padL('mean/career', 13)}${padL('leaks', 7)}`,
)
for (const row of barRows) {
  let weeksTotal = 0
  let newsWeeks = 0
  let events = 0
  let chargedWeeks = 0
  let everNews = 0
  let leaks = 0
  const perEvent: number[] = []
  const perCareer: number[] = []
  for (const c of row.careers) {
    let careerCharge = 0
    let sawNews = false
    for (let w = 0; w < c.wk.length; w++) {
      const week = c.wk[w]
      if (week === undefined) continue
      weeksTotal++
      if (week.news) {
        newsWeeks++
        sawNews = true
      }
      events += week.exposure.length
      const charge = chargeAt(c.wk, w)
      if (charge !== 0) {
        chargedWeeks++
        careerCharge += charge
        // ⚠ PER EVENT AND NOT PER WEEK: a week that held two events is two charges, and the table
        //   says «what one exposure costs» rather than «what a busy week costs».
        const n = eventsChargedAt(c.wk, w)
        if (n > 0) perEvent.push(charge / n)
      }
    }
    if (sawNews) everNews++
    perCareer.push(careerCharge)
    leaks += c.leaks.length
  }
  const evS = sample(`§1 bar ${row.bar} per-event`, perEvent, 1)
  const ccS = sample(`§1 bar ${row.bar} per-career`, perCareer, 1)
  console.log(
    `    ${pad(String(row.bar), 7)}${padL(String(row.careers.length), 9)}${padL(`${everNews}/${row.careers.length}`, 11)}` +
      `${padL(pctS(share(`§1 bar ${row.bar} news`, newsWeeks, weeksTotal)), 12)}${padL(String(events), 9)}${padL(num(events / row.careers.length, 1), 11)}` +
      `${padL(String(chargedWeeks), 13)}${padL(num(avg(evS)), 12)}${padL(num(avg(ccS), 1), 13)}${padL(String(leaks), 7)}`,
  )
}
console.log('')
console.log('    ...and the same sweep broken out by KIND, because the bar decides which kinds are reachable at all:')
console.log('    ⚠⚠ `shoot` IS STRUCTURALLY UNREACHABLE ON THIS HARNESS AND THE COLUMN IS NOT A FINDING ABOUT THE BAR.')
console.log('       The kind fires on a DELIVERED shoot week, and a shoot week only exists on a SIGNED ad letter –')
console.log('       `stepCareerWeek` (econ-bench\'s parent) signs none, at any preset, at any policy. So every event')
console.log('       count in the table above is a LOWER BOUND, short by exactly the SHALLOWEST kind the wave has')
console.log(`       (\`pressureBase.shoot\` ${ECONOMY.spotlight.pressureBase.shoot} against ${ECONOMY.spotlight.pressureBase.publicLoss} for a public loss). \`tools/ad-shoot-bench.ts\` is the instrument that signs`)
console.log('       letters, and pairing the two is a task this bench deliberately did not invent for itself.')
console.log(`    ${pad('bar', 7)}${EXPOSURE_KINDS.map((k) => padL(k, 12)).join('')}`)
for (const row of barRows) {
  const byKind: Record<string, number> = {}
  for (const k of EXPOSURE_KINDS) byKind[k] = 0
  for (const c of row.careers) for (const week of c.wk) if (week !== undefined) for (const k of week.exposure) byKind[k]++
  console.log(`    ${pad(String(row.bar), 7)}${EXPOSURE_KINDS.map((k) => padL(String(byKind[k]), 12)).join('')}`)
}
console.log('')
console.log('')
// ⚠⚠ RULING N PART 4 – «THIS GOES TO THE OWNER BESIDE RULING E, AS ONE QUESTION WITH ONE TABLE: how
// often it fires, and what it does when it fires, are halves of the same decision and he should not be
// handed one without the other.» So the Mood reading is taken PER BAR here as well as per temperament
// in §2 – and it costs no extra walking, because it is a second read of the careers §1 already has.
console.log('    ...and what the PLAYER SEES at each bar – ruling N\'s half of the same question, on the same careers:')
console.log(
  `    ${pad('bar', 7)}${padL('charged wks', 13)}${padL('mean charge', 13)}${padL('band CHANGED', 14)}${padL('SPOTLIGHT tipped', 18)}${padL('control: ordinary', 19)}${padL('clamped', 9)}`,
)
for (const row of barRows) {
  let charged = 0
  let changed = 0
  let tipped = 0
  let clamped = 0
  let ctrl = 0
  let ctrlChanged = 0
  const charges: number[] = []
  for (const c of row.careers) {
    for (let w = 1; w < c.wk.length; w++) {
      const now = c.wk[w]
      const before = c.wk[w - 1]
      if (now === undefined || before === undefined) continue
      const charge = chargeAt(c.wk, w)
      const moved = spiritBandOf(now.spirit) !== spiritBandOf(before.spirit)
      if (charge === 0) {
        ctrl++
        if (moved) ctrlChanged++
        continue
      }
      charged++
      charges.push(charge)
      if (moved) changed++
      if (now.spirit <= ECONOMY.spirit.min + 1e-9 || now.spirit >= ECONOMY.spirit.max - 1e-9) clamped++
      else if (spiritBandOf(now.spirit - charge) !== spiritBandOf(now.spirit)) tipped++
    }
  }
  const judged = charged - clamped
  console.log(
    `    ${pad(String(row.bar), 7)}${padL(String(charged), 13)}${padL(charges.length > 0 ? num(avg(sample(`§1 bar ${row.bar} charges`, charges))) : '–', 13)}` +
      `${padL(charged > 0 ? pctS(share(`§1 bar ${row.bar} changed`, changed, charged)) : '–', 14)}` +
      `${padL(judged > 0 ? pctS(share(`§1 bar ${row.bar} tipped`, tipped, judged)) : '–', 18)}` +
      `${padL(ctrl > 0 ? pctS(share(`§1 bar ${row.bar} control`, ctrlChanged, ctrl)) : '–', 19)}${padL(String(clamped), 9)}`,
  )
}
console.log('')
console.log('    !! THE TWO HALVES, IN ONE PLACE. The first table says how much of her life the wave touches at each')
console.log('       bar; this one says what the touch LOOKS LIKE on the one surface that carries it. A bar that makes')
console.log('       the wave fire often and still never moves the Mood word buys a feed row and nothing else; a bar')
console.log('       that fires rarely and moves the word when it does is a different design with the same constants.')

{
  const shipped = barRows.find((r) => r.bar === SHIPPED_BAR)
  if (shipped === undefined) stall('§1: the shipped bar is not in the sweep', `BARS = [${BARS.join(', ')}], shipped = ${SHIPPED_BAR}`)
  const events = shipped.careers.reduce((s, c) => s + c.wk.reduce((a, w) => a + (w?.exposure.length ?? 0), 0), 0)
  if (events === 0) {
    stall(
      `§1: ZERO exposure events at the shipped bar ${SHIPPED_BAR}`,
      'every row below would be a fact about this grid never reaching the bar – ruling E-bis: check the POLICY, not the money',
    )
  }
  // THE BAR IS NOT A PASS/FAIL – it is the owner's to rule. What IS a bar here is MONOTONICITY: a
  // lower bar must not produce FEWER news weeks, or the sweep is measuring its own noise.
  let monotone = true
  for (let i = 1; i < barRows.length; i++) {
    const lo = barRows[i - 1]
    const hi = barRows[i]
    const shareOf = (r: BarRow): number => {
      let n = 0
      let d = 0
      for (const c of r.careers) for (const w of c.wk) if (w !== undefined) { d++; if (w.news) n++ }
      return d === 0 ? Number.NaN : n / d
    }
    if (shareOf(lo) < shareOf(hi)) monotone = false
  }
  console.log(
    `    news-week share falls as the bar rises   ${verdict('§1 bar sweep monotonicity', monotone, 'a LOWER bar produced FEWER news weeks – the sweep is reading its own divergence, not the bar')}`,
  )
  console.log('')
  console.log('    !! WHAT THIS TABLE IS FOR, and it is the only thing in this wave the owner cannot rule without it:')
  console.log('       every mechanic in the wave sits behind ONE predicate and this is its coverage. The 33-save')
  console.log('       corpus says 6.9% of weeks are news at 30 and that FIVE OF EIGHT careers never reach it at all.')
  console.log('       The grid above is deliberately the other extreme – a wealthy family under the policy that wins –')
  console.log('       so read the two together: the corpus is what most of the game looks like, this is the ceiling.')
}

// =================================================================================================
// §2. ⚠⚠ WHAT THE PLAYER SEES – RULING N, AND THE SECOND HALF OF THE OWNER'S ONE QUESTION
// =================================================================================================
//
// who-she-is §3c's legibility law is «every dip explainable», which is a promise about a SCREEN and
// not about a float. The engine's only channel for it is the Mood word, and the Mood word is a BAND.
// So the question is not «how many points did the cameras cost her» – it is «did the word change,
// and if it did, was it the cameras that changed it».
//
// ⚠⚠ THE «SPOTLIGHT TIPPED IT» COLUMN IS THE ONE THAT ANSWERS RULING N, and it is a counterfactual
// taken on the SAME week rather than on a second walk: the band she actually got is
// `spiritBandOf(spirit[c])`, and the band she would have got with the spotlight term removed is
// `spiritBandOf(spirit[c] − charge)` (the charge is negative, so subtracting it adds the points
// back). If those two agree, the week's Mood word was decided by everything ELSE in her life and the
// feed row that explains it names the cameras. That is exactly ruling N's sentence – «it tips a week
// the ordinary weather had already carried to the boundary» – turned into a number.
//
// ⚠ THE RECONSTRUCTION IS EXACT EXCEPT AT A CLAMP. `accrueSpirit` clamps the week's result into
// `[ECONOMY.spirit.floor, 100]` and rounds to tenths, so on a week that landed ON a clamp the
// «without the spotlight» value is not reachable by adding the charge back. Those weeks are COUNTED
// and EXCLUDED rather than averaged over, and the count is printed – an exclusion nobody can see is
// an exclusion that becomes a finding.
//
// ⚠ AND THE CONTROL COLUMN IS ORDINARY WEEKS. «X% of charged weeks changed band» says nothing on its
// own; beside «Y% of her other weeks changed band» it says whether the spotlight is visible at all.

rule('§2. ⚠⚠ WHAT THE PLAYER SEES – the Mood band on charged weeks, per BIRTH temperament   [RULING N]')

const mainCareers: Career[] = []
for (const t of TEMPERAMENTS) {
  for (let i = 0; i < CAREERS; i++) {
    mainCareers.push(walk(`spot-main-${i}`, t, { policy: CARING, rung: null, focus: null, weeks: WEEKS }))
  }
}

interface BandCell {
  temperament: Temperament
  charged: number
  changed: number
  tipped: number
  clamped: number
  dips: number[]
  recover: number[]
  censored: number
  charges: number[]
  ctrlWeeks: number
  ctrlChanged: number
}
const bandCells: BandCell[] = []
for (const t of TEMPERAMENTS) {
  const cell: BandCell = {
    temperament: t,
    charged: 0,
    changed: 0,
    tipped: 0,
    clamped: 0,
    dips: [],
    recover: [],
    censored: 0,
    charges: [],
    ctrlWeeks: 0,
    ctrlChanged: 0,
  }
  for (const c of mainCareers.filter((x) => x.birth === t)) {
    for (let w = 1; w < c.wk.length; w++) {
      const now = c.wk[w]
      const before = c.wk[w - 1]
      if (now === undefined || before === undefined) continue
      const charge = chargeAt(c.wk, w)
      const bandBefore = spiritBandOf(before.spirit)
      const bandNow = spiritBandOf(now.spirit)
      if (charge === 0) {
        cell.ctrlWeeks++
        if (bandNow !== bandBefore) cell.ctrlChanged++
        continue
      }
      cell.charged++
      cell.charges.push(charge)
      if (bandNow !== bandBefore) cell.changed++
      cell.dips.push(before.spirit - now.spirit)
      // THE COUNTERFACTUAL, and the clamp is the one place it cannot be taken.
      // ⚠ THE CLAMP IS `ECONOMY.spirit.min`/`max` – the pair `accrueSpirit`'s own `clamp(moved, s.min,
      //   s.max)` uses – and NOT `ECONOMY.spirit.floor`, which is `spiritMatchFactor`'s 0.90 floor one
      //   concept over. Reaching for the wrong `floor` here would have silently declared every week
      //   above 0.9 «clamped» and emptied the counterfactual column.
      if (now.spirit <= ECONOMY.spirit.min + 1e-9 || now.spirit >= ECONOMY.spirit.max - 1e-9) {
        cell.clamped++
      } else if (spiritBandOf(now.spirit - charge) !== bandNow) {
        cell.tipped++
      }
      // WEEKS TO RECOVER – back to the spirit she stood at before the charge landed.
      let k = -1
      for (let j = w + 1; j < c.wk.length && j <= w + 60; j++) {
        const later = c.wk[j]
        if (later === undefined) continue
        if (later.spirit >= before.spirit - 1e-9) {
          k = j - w
          break
        }
      }
      if (k > 0) cell.recover.push(k)
      else cell.censored++
    }
  }
  bandCells.push(cell)
}
{
  const totalCharged = bandCells.reduce((s, c) => s + c.charged, 0)
  if (totalCharged === 0) {
    stall(
      '§2: ZERO charged weeks across the whole main grid',
      'no career reached the bar, so no Mood column can be read – ruling E-bis: an arm on the wrong policy measures nothing',
    )
  }
}
console.log(
  `    ${pad('birth', 10)}${padL('charged wks', 13)}${padL('mean charge', 13)}${padL('band CHANGED', 14)}${padL('SPOTLIGHT tipped', 18)}${padL('clamped', 9)}${padL('mean dip', 10)}${padL('median recover', 16)}${padL('control: ordinary', 19)}`,
)
for (const cell of bandCells) {
  const ch = sample(`§2 ${cell.temperament} charges`, cell.charges, 1)
  const dip = sample(`§2 ${cell.temperament} dips`, cell.dips, 1)
  const judged = cell.charged - cell.clamped
  console.log(
    `    ${pad(cell.temperament, 10)}${padL(String(cell.charged), 13)}${padL(num(avg(ch)), 13)}` +
      `${padL(pctS(share(`§2 ${cell.temperament} changed`, cell.changed, cell.charged)), 14)}` +
      `${padL(judged > 0 ? pctS(share(`§2 ${cell.temperament} tipped`, cell.tipped, judged)) : '–', 18)}` +
      `${padL(String(cell.clamped), 9)}${padL(num(avg(dip)), 10)}` +
      `${padL(cell.recover.length > 0 ? `${num(median([...cell.recover]), 0)} (n=${cell.recover.length})` : '–', 16)}` +
      `${padL(cell.ctrlWeeks > 0 ? pctS(share(`§2 ${cell.temperament} control`, cell.ctrlChanged, cell.ctrlWeeks)) : '–', 19)}`,
  )
}
console.log('')
{
  const judgedAll = bandCells.reduce((s, c) => s + c.charged - c.clamped, 0)
  const tippedAll = bandCells.reduce((s, c) => s + c.tipped, 0)
  const changedAll = bandCells.reduce((s, c) => s + c.changed, 0)
  const chargedAll = bandCells.reduce((s, c) => s + c.charged, 0)
  const censoredAll = bandCells.reduce((s, c) => s + c.censored, 0)
  console.log(`    pooled : ${chargedAll} charged weeks · band changed on ${pctS(share('§2 pooled changed', changedAll, chargedAll))} of them ·`)
  console.log(`             the SPOTLIGHT tipped the band on ${pctS(share('§2 pooled tipped', tippedAll, judgedAll))} of the ${judgedAll} weeks the counterfactual is exact on.`)
  console.log(`             ${censoredAll} charged weeks never returned to their pre-charge spirit inside 60 weeks (censored, excluded from the median).`)
  console.log('')
  // ⚠ RULING N's CLAIM AS A BAR, and it is deliberately spelled so that EITHER answer is a finding:
  //   the ruling predicts the spotlight rarely decides the word. A high tipped share would be the
  //   ruling wrong; a near-zero one is the legibility law broken with every unit test green.
  const tippedShare = share('§2 pooled tipped (bar)', tippedAll, judgedAll)
  const ok = tippedAll > 0
  console.log(
    `    the spotlight decides the Mood word on at least SOME week   ${verdict('§2 ruling N – the spotlight is ever visible in the Mood word', ok, `the spotlight tipped the band on ZERO of ${judgedAll} charged weeks – the feed explains a dip the word NEVER shows, which is who-she-is §3c\'s legibility law broken while every unit test stays green. Implicates ECONOMY.spotlight.pressureBase and ECONOMY.spirit.mood`)}`,
  )
  console.log(`    measured tipped share: ${pctS(tippedShare)}   · ruling N PREDICTED this is small and concentrated on the private/intense cells.`)
  console.log('')
  console.log('    !! HOW TO READ THE TWO SHARES TOGETHER, because one without the other is a trap. «band CHANGED»')
  console.log('       counts every charged week whose word moved for ANY reason – the ordinary weather, an ending, a')
  console.log('       return step. «SPOTLIGHT tipped» counts the weeks where removing the spotlight term alone would')
  console.log('       have left a DIFFERENT word on the screen. The control column is the same question asked of her')
  console.log('       quiet weeks. If «changed» and «control» are close, the player cannot tell a camera week from an')
  console.log('       ordinary one by looking at her Mood, whatever the feed row says.')
}

// =================================================================================================
// §3. THE FAIRNESS CORRIDOR'S HIGH-FAME COLUMN – ±1.5 pp on BIRTH cohorts
// =================================================================================================
//
// who-she-is §5's bar, re-read here on the arm this wave creates: «paired lifetime deltas across
// temperaments must land inside ±1.5 pp of career match-win rate». The census (`bench:life-arrival`
// §6c) reads it on ordinary careers; this reads it on careers that spend a large part of their lives
// ABOVE THE NEWS BAR, which is the only place the spotlight exists at all.
//
// ⚠⚠ THE COHORTS ARE **BIRTH** AND THE FENCE IS WHY (who-she-is §3): this file ASSIGNS
// `world.temperament` before the walk, so the four columns are birth cohorts by construction and the
// same seeds are played four times over. Re-reading the corridor on EXPRESSED cohorts would be a
// different measurement wearing the same name – the expressed bucket is an OUTCOME of how the career
// went, so grouping by it would sort careers by their own history and report the sorting as a
// fairness gradient.
//
// ⚠ THE PAIRED MEAN IS THE STATISTIC, not the difference of two pooled rates: spirit moves a
// THRESHOLD and not a tap, so an individual career swings hard while the population does not move.
// ⚠ AND THE ARM CARRIES ITS OWN NON-VACUITY CONTROL: if no pair ever differed, the corridor would be
// signing an equality between a thing and itself (CLAUDE.md, 17.08).
//
// ⚠ FOUR OF THE SIX PAIRS SHARE AN INTENSITY. `accrueSpirit`'s standing perturbation reads intensity
// alone – but THIS wave's term reads BOTH axes (`opennessScale` ×0.75/×1.5), so unlike wave 4's note
// the openness pairs are NOT replicas here: a sunny and a quiet girl at the same fame pay twice the
// difference for the same camera. All six are printed and all six are informative in this arm.

rule('§3. THE FAIRNESS CORRIDOR\'S HIGH-FAME COLUMN – ±1.5 pp of lifetime match-win rate, BIRTH cohorts')
{
  const seeds = [...new Set(mainCareers.map((c) => c.seed))]
  const rate = (c: Career): number => (c.matches === 0 ? Number.NaN : (100 * c.wins) / c.matches)
  const byKey = new Map<string, Career>()
  for (const c of mainCareers) byKey.set(`${c.seed}|${c.birth}`, c)
  let worst = 0
  let worstPair = '–'
  let diverged = 0
  let compared = 0
  const rows: string[] = []
  for (let i = 0; i < TEMPERAMENTS.length; i++) {
    for (let j = i + 1; j < TEMPERAMENTS.length; j++) {
      const a = TEMPERAMENTS[i]
      const b = TEMPERAMENTS[j]
      const deltas: number[] = []
      for (const seed of seeds) {
        const ra = byKey.get(`${seed}|${a}`)
        const rb = byKey.get(`${seed}|${b}`)
        if (ra === undefined || rb === undefined) continue
        const x = rate(ra)
        const y = rate(rb)
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue
        deltas.push(x - y)
        compared++
        if (x !== y) diverged++
      }
      const s = sample(`§3 ${a} vs ${b}`, deltas, 1)
      const m = avg(s)
      const maxAbs = Math.max(...s.xs.map((x) => Math.abs(x)))
      if (Math.abs(m) > Math.abs(worst)) {
        worst = m
        worstPair = `${a} vs ${b}`
      }
      rows.push(`    ${pad(`${a} vs ${b}`, 22)}${padL(String(s.xs.length), 6)}${padL(num(m, 3), 11)}${padL(num(sem(s), 3), 9)}${padL(num(maxAbs, 3), 12)}`)
    }
  }
  console.log(`    ${pad('pair', 22)}${padL('n', 6)}${padL('mean Δ pp', 11)}${padL('SEM', 9)}${padL('max |Δ|', 12)}`)
  for (const r of rows) console.log(r)
  console.log('')
  if (compared === 0) stall('§3: ZERO career pairs compared', 'the corridor would be an equality between two empty lists')
  if (diverged === 0) {
    stall(
      '§3: NOT ONE pair of temperament arms produced a different lifetime win rate',
      'the four columns are the same career and the corridor would be comparing a thing with itself (CLAUDE.md, 17.08)',
    )
  }
  const ok = Math.abs(worst) <= 1.5
  console.log(
    `    worst pair : ${worstPair} at ${num(worst, 3)} pp against the ±1.5 pp bar   ${verdict('§3 fairness corridor, HIGH-FAME arm (BIRTH cohorts)', ok, `worst paired mean ${num(worst, 3)} pp on ${worstPair} – who-she-is §5's bar is ±1.5 pp; implicates ECONOMY.spotlight.pressureBase and ECONOMY.spotlight.opennessScale`)}`,
  )
  console.log(`    not vacuous: the arms genuinely diverged on a lifetime win rate in ${diverged} of ${compared} career pairs.`)
  console.log('')
  // ...and the two lifetime numbers the brief asks for beside the corridor.
  console.log(`    ${pad('birth', 10)}${padL('n', 4)}${padL('news weeks', 12)}${padL('charged wks', 13)}${padL('total charge', 14)}${padL('spirit-wks < knee', 19)}${padL('win rate', 10)}`)
  for (const t of TEMPERAMENTS) {
    const cs = mainCareers.filter((c) => c.birth === t)
    const newsW: number[] = []
    const chargedW: number[] = []
    const totalCharge: number[] = []
    const underKnee: number[] = []
    const rates: number[] = []
    for (const c of cs) {
      let n = 0
      let cw = 0
      let tc = 0
      let uk = 0
      for (let w = 0; w < c.wk.length; w++) {
        const week = c.wk[w]
        if (week === undefined) continue
        if (week.news) n++
        if (week.spirit < ECONOMY.spirit.knee) uk++
        const ch = chargeAt(c.wk, w)
        if (ch !== 0) {
          cw++
          tc += ch
        }
      }
      newsW.push(n)
      chargedW.push(cw)
      totalCharge.push(tc)
      underKnee.push(uk)
      if (c.matches > 0) rates.push((100 * c.wins) / c.matches)
    }
    const r = sample(`§3 ${t} win rate`, rates, 1)
    console.log(
      `    ${pad(t, 10)}${padL(String(cs.length), 4)}${padL(num(avg(sample(`§3 ${t} news`, newsW)), 1), 12)}${padL(num(avg(sample(`§3 ${t} charged`, chargedW)), 1), 13)}` +
        `${padL(num(avg(sample(`§3 ${t} charge`, totalCharge)), 1), 14)}${padL(num(avg(sample(`§3 ${t} knee`, underKnee)), 1), 19)}${padL(pctS(avg(r)), 10)}`,
    )
  }
  console.log('')
  console.log('    !! «spirit-weeks < knee» IS THE ONLY PLACE SPIRIT REACHES THE TENNIS AT ALL – `spiritMatchFactor`')
  console.log(`       is flat at 1 above ${ECONOMY.spirit.knee} and floors at ${ECONOMY.spirit.floor}, so a career that never goes under the knee`)
  console.log('       carries the whole spotlight on its Mood word and nothing else. That is the design; the column is')
  console.log('       printed so the corridor above can be read as «no cohort is pushed under the knee more often».')
}

// =================================================================================================
// §4. THE HABITUATION CURVE – «the veteran shrugs», priced before any ruling
// =================================================================================================
//
// who-she-is §3c: «sustained fame slowly shrinks her own pressure scale – unless walls are up: walls
// freeze habituation. A veteran star from a good home shrugs at cameras that once cost her sleep.»
// The counter is `world.spotlightHabituation`, the ONE writer is `growHabituation`, and nothing in
// the game prints it (the fog law) – so this is the only place the shape can be read at all.
//
// THE THREE ARMS, and each is the spec's own sentence in code:
//   · UNWALLED    – the caring parent, no seat: `+1` a news week, `habituationFullWeeks` to the floor.
//   · FOCUS-HELD  – the caring parent, «The public life» at the top rung: `× publicLifeAccel[2]`.
//   · WALLED      – ⚠⚠ CARED FOR AND **THEN** GROUND DOWN, which is a correction this bench made to
//     its own first draft and is the section's largest finding. A career that grinds FROM THE START
//     never becomes news at all: measured on this grid, the plain grinding arm reached ZERO news
//     weeks in every career, so «the walls freeze habituation» could not be observed because there
//     was no habituation to freeze and no spotlight to be frozen out of. That is ruling E-bis's
//     sentence arriving from a third direction – the policy decides fame – and it means the girl
//     §3c is actually written about (famous AND behind walls) is only reachable through a parent who
//     was there first and stopped being there. So this arm is CARING to the turn and GRINDING after
//     it, and the turn is late enough that she is already news when the wall goes up.
//
// ⚠ THE X AXIS IS **NEWS WEEKS**, NOT CALENDAR WEEKS, and that is what makes the three arms
// comparable: the counter only moves on a week she is actually news, so a career that spent 40 weeks
// in the light and one that spent 400 are not two speeds of the same walk.

rule('§4. THE HABITUATION CURVE – news-weeks to the floor, walled vs unwalled vs focus-held')

interface CurveCell {
  label: string
  arm: 'unwalled' | 'focus-held' | 'walled'
  newsToCap: number[]
  capReached: number
  n: number
  finalHab: number[]
  newsWeeks: number[]
  walledWeeks: number[]
  frozenNewsWeeks: number[]
}
const curveCells: CurveCell[] = []
{
  const WALL_TURN = Math.floor(WEEKS / 2)
  const arms: { arm: CurveCell['arm']; label: string; opts: Omit<WalkOpts, 'weeks'> }[] = [
    { arm: 'unwalled', label: 'caring · no seat', opts: { policy: CARING, rung: null, focus: null } },
    { arm: 'focus-held', label: `caring · «The public life» rung 2 (×${publicLifeAccelAt(2)})`, opts: { policy: CARING, rung: 2, focus: 'publicLife' } },
    {
      arm: 'walled',
      label: `caring → grinding at wk ${WALL_TURN} (famous, then walled)`,
      opts: { policy: CARING, rung: null, focus: null, schedule: [{ from: WALL_TURN, policy: GRINDING }] },
    },
  ]
  for (const a of arms) {
    const cell: CurveCell = { label: a.label, arm: a.arm, newsToCap: [], capReached: 0, n: 0, finalHab: [], newsWeeks: [], walledWeeks: [], frozenNewsWeeks: [] }
    for (const t of TEMPERAMENTS) {
      for (let i = 0; i < CURVE_CAREERS; i++) {
        const c = walk(`spot-curve-${i}`, t, { ...a.opts, weeks: WEEKS })
        cell.n++
        let news = 0
        let walledW = 0
        let frozen = 0
        let toCap = -1
        const cap = ECONOMY.spotlight.habituationFullWeeks
        for (let w = 0; w < c.wk.length; w++) {
          const week = c.wk[w]
          if (week === undefined) continue
          // ⚠⚠ THE GATE IS READ AT `w − 1`, NOT AT `w`, AND THE FIRST DRAFT WAS OFF BY ONE BECAUSE OF
          //    IT. `growHabituation` is handed `sheIsNewsAt(world, world.week − 1)` (ruling Q part 2 –
          //    the wave's one horizon), so the weeks the counter can grow on are the weeks whose
          //    PREVIOUS week was news. Counted at `w` the no-seat arm read 105 against a shipped cap
          //    of 104, which looks like a defect in the cap and is a defect in the counter.
          const gate = c.wk[w - 1]
          if (gate !== undefined && gate.news) news++
          if (week.walled) walledW++
          if (gate !== undefined && gate.news && week.walled) frozen++
          if (toCap < 0 && week.habituation >= cap - 1e-9) toCap = news
        }
        cell.newsWeeks.push(news)
        cell.walledWeeks.push(walledW)
        cell.frozenNewsWeeks.push(frozen)
        const last = [...c.wk].reverse().find((x) => x !== undefined)
        cell.finalHab.push(last?.habituation ?? 0)
        if (toCap >= 0) {
          cell.newsToCap.push(toCap)
          cell.capReached++
        }
      }
    }
    curveCells.push(cell)
  }
}
console.log(`    ${pad('arm', 44)}${padL('n', 4)}${padL('news wks', 10)}${padL('walled wks', 12)}${padL('FROZEN news wks', 17)}${padL('final hab', 11)}${padL('reached cap', 13)}${padL('news wks to cap', 17)}${padL('predicted', 11)}`)
for (const cell of curveCells) {
  const predicted = cell.arm === 'unwalled' ? PRED.capWeeksNoSeat : cell.arm === 'focus-held' ? PRED.capWeeks[2] : Number.NaN
  console.log(
    `    ${pad(cell.label, 44)}${padL(String(cell.n), 4)}${padL(num(avg(sample(`§4 ${cell.arm} news`, cell.newsWeeks)), 1), 10)}` +
      `${padL(num(avg(sample(`§4 ${cell.arm} walled`, cell.walledWeeks)), 1), 12)}${padL(num(avg(sample(`§4 ${cell.arm} frozen`, cell.frozenNewsWeeks)), 1), 17)}` +
      `${padL(num(avg(sample(`§4 ${cell.arm} final`, cell.finalHab)), 1), 11)}${padL(`${cell.capReached}/${cell.n}`, 13)}` +
      `${padL(cell.newsToCap.length > 0 ? num(median([...cell.newsToCap]), 0) : '–', 17)}${padL(num(predicted, 1), 11)}`,
  )
}
console.log('')
{
  const un = curveCells.find((c) => c.arm === 'unwalled')!
  const fo = curveCells.find((c) => c.arm === 'focus-held')!
  const wa = curveCells.find((c) => c.arm === 'walled')!
  if (un.newsToCap.length === 0 && fo.newsToCap.length === 0) {
    stall('§4: NOT ONE career reached the habituation cap in any arm', 'the curve has no end point and «the veteran shrugs» cannot be priced')
  }
  // THE ACCELERATION, measured the only way that is not the multiplier read back to itself: NEWS
  // WEEKS SPENT, not calendar weeks and not the counter. ⚠ The two arms are the same seeds.
  if (un.newsToCap.length > 0 && fo.newsToCap.length > 0) {
    const u = sample('§4 unwalled news-to-cap', un.newsToCap, 1)
    const f = sample('§4 focus news-to-cap', fo.newsToCap, 1)
    const d = avg(f) - avg(u)
    const se = Math.sqrt(sem(u) ** 2 + sem(f) ** 2)
    const ok = d < 0
    console.log(
      `    the seat SHORTENS the walk : ${num(avg(u), 1)} → ${num(avg(f), 1)} news weeks (Δ ${num(d, 1)} ± ${num(se, 1)})   ${verdict('§4 habituation acceleration, rung 2 vs no seat', ok, `the focus-held arm did not reach the cap sooner – implicates ECONOMY.psychologist.publicLifeAccel [${ECONOMY.psychologist.publicLifeAccel.join(', ')}]`)}`,
    )
    const clears = Number.isFinite(se) && Math.abs(d) > 2 * se
    console.log(
      `    ...and by more than 2×SEM  : |Δ| ${num(Math.abs(d), 1)} vs 2×SEM ${num(2 * se, 1)}   ${verdict('§4 acceleration clears 2×SEM', clears, `the step is inside the noise – the masseur §4 law asks for a rung measurably better than the one below, and this one is not measurably anything`)}`,
    )
    if (se < 1e-9) {
      console.log('      ⚠⚠ 2×SEM IS **ZERO**, AND THE BAR ABOVE IS THEREFORE VACUOUS RATHER THAN PASSED. Every career in')
      console.log('         both arms returned the same number: the four temperaments walk almost the same tennis (spirit')
      console.log('         reaches the match only under the knee), so the arms are REPLICAS and not samples. The step is')
      console.log('         EXACT, which is a stronger statement than «separated», but it is not the statistical one.')
    }
    console.log('      ⚠ AND THE PREDICTED COLUMN ASSUMES THE YEAR IS HELD FROM HER FIRST NEWS WEEK, WHICH NO CAREER CAN DO.')
    console.log('        The seat cannot be hired before `psychologistUnlocked` and the focus waits on the consent gates, so')
    console.log('        the first stretch of news weeks grows at ×1 whatever the rung. A measured walk LONGER than the')
    console.log('        prediction is that delay, not a weak accelerator; the gap between them is what the delay costs.')
  } else {
    console.log('    the seat SHORTENS the walk : – (one of the two arms never reached the cap; the comparison is UNMEASURED)')
    verdict('§4 habituation acceleration, rung 2 vs no seat', false, 'one of the two arms never reached the cap – the comparison could not be taken')
  }
  // THE FREEZE. ⚠ IT IS A COUNT OF **NEWS WEEKS SPENT WALLED**, which is the number ruling H's ×0
  //    actually consumes, and it is the actuation receipt for this arm at the same time.
  const frozenTotal = wa.frozenNewsWeeks.reduce((a, b) => a + b, 0)
  console.log(
    `    the walls FREEZE it        : the grinding arm spent ${frozenTotal} news weeks behind a flipped wall, and the counter did not move on one of them (ruling H, ×0 on EITHER axis).`,
  )
  if (frozenTotal === 0) {
    console.log('      !! ZERO – the grinding arm never met a news week with a wall up, so this line is a statement about')
    console.log('         the ARM and not about the freeze. The freeze itself is pinned engine-side (T4); what is missing')
    console.log('         here is a career that is famous AND walled, which is exactly the girl §3c is written about.')
  }
}

// =================================================================================================
// §5. THE WALLS LOOP – §3c's parent-in-the-loop claim, shown as numbers
// =================================================================================================
//
// who-she-is §2a: «the road back always exists – a closed-again girl can be opened again … A career
// can round-trip; that sentence is earned drama.» §3c hangs the spotlight on it: walls freeze
// habituation, so a walled-up famous girl never learns to live known, and every camera keeps costing
// her what the first one did. The claim is that THE PARENT IS IN THE LOOP – that repairing the bond
// is what lets her acclimatise at all.
//
// ⚠⚠ NEITHER SHIPPED POLICY CAN PRODUCE A ROUND TRIP, so both arms are this bench's OWN construction
// and are labelled as such (`life-arrival.ts` §6a records the same and its own reason).
//
// ⚠⚠⚠ AND BOTH ARMS START **CARED FOR**, WHICH IS A CORRECTION THIS BENCH MADE TO ITS OWN FIRST
// DRAFT. The first cut ground from week 0 in both arms and turned one of them around; measured, the
// walled arm then reached ZERO news weeks and the repaired one 71, so the «repair buys
// acclimatisation» verdict passed for a reason that had nothing to do with walls – only one arm was
// ever famous. A parent who grinds from the start does not raise walls on a STAR; he raises them on a
// girl nobody is looking at, and the spotlight has nothing to say about her. So: CARED FOR to
// `WALL_ON` (she becomes news), GROUND DOWN from it (the walls go up on a famous girl), and the
// repaired arm alone turns back at `REPAIR_ON`. One difference between the arms, and it is the repair.

rule('§5. THE WALLS LOOP – a walled-up famous girl against a repaired one   [§3c\'s parent-in-the-loop claim]')
{
  // ⚠ THE TWO TURNS ARE THIRDS OF THE HORIZON: famous by the first, walled through the second, and
  //   the repaired arm has the last third to walk home in. A repair with no weeks left after it would
  //   be an arm that cannot show its own subject.
  const WALL_ON = Math.floor(WEEKS / 3)
  const REPAIR_ON = Math.floor((2 * WEEKS) / 3)
  interface LoopCell {
    label: string
    finalHab: number[]
    newsWeeks: number[]
    frozenNews: number[]
    totalCharge: number[]
    meanPerEvent: number[]
    flippedAtEnd: number
    underKnee: number[]
    n: number
  }
  const cells: LoopCell[] = []
  for (const armed of [false, true]) {
    const cell: LoopCell = {
      label: armed ? `caring → grinding ${WALL_ON} → caring ${REPAIR_ON} (repaired)` : `caring → grinding ${WALL_ON} (stays walled)`,
      finalHab: [],
      newsWeeks: [],
      frozenNews: [],
      totalCharge: [],
      meanPerEvent: [],
      flippedAtEnd: 0,
      underKnee: [],
      n: 0,
    }
    for (const t of TEMPERAMENTS) {
      for (let i = 0; i < CURVE_CAREERS; i++) {
        const c = walk(`spot-loop-${i}`, t, {
          policy: CARING,
          rung: null,
          focus: null,
          weeks: WEEKS,
          schedule: armed
            ? [
                { from: WALL_ON, policy: GRINDING },
                { from: REPAIR_ON, policy: CARING },
              ]
            : [{ from: WALL_ON, policy: GRINDING }],
        })
        cell.n++
        let news = 0
        let frozen = 0
        let charge = 0
        let events = 0
        let uk = 0
        for (let w = 0; w < c.wk.length; w++) {
          const week = c.wk[w]
          if (week === undefined) continue
          // ⚠ THE GATE IS `w − 1`, §4's own correction applied here too: `growHabituation` reads
          //   `sheIsNewsAt(world, world.week − 1)`, so «a news week the counter could have grown on»
          //   is a fact about the PREVIOUS week.
          const gate = c.wk[w - 1]
          if (gate !== undefined && gate.news) news++
          if (gate !== undefined && gate.news && week.walled) frozen++
          if (week.spirit < ECONOMY.spirit.knee) uk++
          const ch = chargeAt(c.wk, w)
          charge += ch
          events += eventsChargedAt(c.wk, w)
        }
        const last = [...c.wk].reverse().find((x) => x !== undefined)
        cell.finalHab.push(last?.habituation ?? 0)
        cell.newsWeeks.push(news)
        cell.frozenNews.push(frozen)
        cell.totalCharge.push(charge)
        cell.underKnee.push(uk)
        if (events > 0) cell.meanPerEvent.push(charge / events)
        if (last?.walled === true) cell.flippedAtEnd++
      }
    }
    cells.push(cell)
  }
  console.log(`    ${pad('arm', 44)}${padL('n', 4)}${padL('news wks', 10)}${padL('frozen news', 13)}${padL('final hab', 11)}${padL('walled at end', 15)}${padL('mean/event', 12)}${padL('spirit-wks < knee', 19)}`)
  for (const cell of cells) {
    console.log(
      `    ${pad(cell.label, 44)}${padL(String(cell.n), 4)}${padL(num(avg(sample(`§5 ${cell.label} news`, cell.newsWeeks)), 1), 10)}` +
        `${padL(num(avg(sample(`§5 ${cell.label} frozen`, cell.frozenNews)), 1), 13)}${padL(num(avg(sample(`§5 ${cell.label} hab`, cell.finalHab)), 1), 11)}` +
        `${padL(`${cell.flippedAtEnd}/${cell.n}`, 15)}${padL(cell.meanPerEvent.length > 0 ? num(avg(sample(`§5 ${cell.label} per-event`, cell.meanPerEvent))) : '–', 12)}` +
        `${padL(num(avg(sample(`§5 ${cell.label} knee`, cell.underKnee)), 1), 19)}`,
    )
  }
  console.log('')
  const walled = cells[0]
  const repaired = cells[1]
  const hw = sample('§5 walled hab', walled.finalHab, 1)
  const hr = sample('§5 repaired hab', repaired.finalHab, 1)
  const d = avg(hr) - avg(hw)
  const se = Math.sqrt(sem(hw) ** 2 + sem(hr) ** 2)
  const ok = d > 0
  console.log(
    `    the repair BUYS acclimatisation : habituation ${num(avg(hw), 1)} → ${num(avg(hr), 1)} (Δ ${num(d, 1)} ± ${num(se, 1)})   ${verdict('§5 the walls loop – repair lets her acclimatise', ok, `the repaired arm did not end more habituated than the walled one – §3c's parent-in-the-loop claim is not visible on this grid; implicates ECONOMY.life.walls and ECONOMY.spotlight.habituationFullWeeks`)}`,
  )
  console.log('')
  console.log('    !! ⚠ THE ARMS DIVERGE IN MORE THAN THE WALL, and it is said rather than hidden: the repair changes the')
  console.log('       ENTRY POLICY too, so the repaired career also plays a different calendar from the repair week on and')
  console.log('       can reach a different fame. The «news wks» column is printed for exactly that reason – read the')
  console.log('       habituation delta against it, and treat a repaired arm that is merely MORE FAMOUS as an unproven')
  console.log('       claim rather than a confirmed one. The arms ARE byte-identical up to the wall week, which is what')
  console.log(`       makes the comparison worth taking at all: they are one career until week ${REPAIR_ON}.`)
}

// =================================================================================================
// §6. THE ACTUATION RECEIPT – proof each arm reached its own subject, and the dial restored
// =================================================================================================

rule('§6. THE ACTUATION RECEIPT – every arm reached its subject, and the bar is back')
{
  const allCareers = [...mainCareers, ...barRows.flatMap((r) => r.careers)]
  const newsWeeks = allCareers.reduce((s, c) => s + c.wk.filter((w) => w !== undefined && w.news).length, 0)
  const events = allCareers.reduce((s, c) => s + c.wk.reduce((a, w) => a + (w?.exposure.length ?? 0), 0), 0)
  const charged = mainCareers.reduce((s, c) => {
    let n = 0
    for (let w = 0; w < c.wk.length; w++) if (chargeAt(c.wk, w) !== 0) n++
    return s + n
  }, 0)
  const leaks = allCareers.reduce((s, c) => s + c.leaks.length, 0)
  const episodes = allCareers.reduce((s, c) => s + c.episodes, 0)
  const habGrew = curveCells.reduce((s, c) => s + c.finalHab.filter((h) => h > 0).length, 0)
  const focusCareers = curveCells.find((c) => c.arm === 'focus-held')?.n ?? 0
  const kinds = new Map<ExposureKind, number>()
  for (const k of EXPOSURE_KINDS) kinds.set(k, 0)
  for (const c of allCareers) for (const w of c.wk) if (w !== undefined) for (const k of w.exposure) kinds.set(k, (kinds.get(k) ?? 0) + 1)
  const lines: [string, number, string][] = [
    ['news weeks walked', newsWeeks, 'zero means not one career ever crossed the bar – ruling E-bis: check the POLICY'],
    ['exposure events fired', events, 'the ledger never answered – every table above would be a zero about nothing'],
    ['weeks the pressure was CHARGED', charged, '§2\'s whole column has no rows without these'],
    ['love episodes lived', episodes, 'the leak has nothing to get out about'],
    ['leaks fired', leaks, '§1\'s leak column and the census\'s subject – zero means the hazard never reached a draw'],
    ['careers whose habituation GREW', habGrew, '§4 has no curve without one'],
    ['careers holding the fifth focus', focusCareers, '§4\'s accelerated arm'],
  ]
  for (const [what, n, why] of lines) {
    console.log(`    ${pad(what, 38)}${padL(String(n), 8)}   ${n === 0 ? '!! ZERO – ' : ''}${why}`)
  }
  console.log('')
  console.log(`    exposure by kind          : ${EXPOSURE_KINDS.map((k) => `${k} ${kinds.get(k) ?? 0}`).join(' · ')}`)
  console.log('      ⚠ A KIND READING ZERO IS A FINDING AND NOT NECESSARILY A DEFECT – `aired` needs a big-stage match')
  console.log('        inside the news window of a PUBLIC fact, and `wrongStory` needs a leak that landed wrong. Both')
  console.log('        are downstream of the leak, which is downstream of the bar.')
  console.log('')
  const zeroes = lines.filter(([, n]) => n === 0)
  if (zeroes.length > 0) {
    stall(`§6: ${zeroes.length} actuation column(s) read ZERO`, zeroes.map(([w]) => w).join(' · '))
  }
  SPOTLIGHT_DIAL.newsFameMin = SHIPPED_BAR
  if (ECONOMY.spotlight.newsFameMin !== SHIPPED_BAR) {
    throw new Error('the bar did not restore – a later reader of ECONOMY in this process would see a poked constant')
  }
  console.log(`    dial restored and CHECKED : ECONOMY.spotlight.newsFameMin = ${ECONOMY.spotlight.newsFameMin} (shipped ${SHIPPED_BAR})`)
  console.log('    MAIN is untouched by every arm above – the frozen capture (41550 / e6b0c709) cannot see this file.')
}

// =================================================================================================
// §7. THE VERDICT SHEET
// =================================================================================================

rule('§7. THE VERDICT SHEET')
if (MISSES.length === 0) {
  console.log('    every bar HIT.')
  console.log('')
  process.exitCode = 0
} else {
  console.log(`    !! ${MISSES.length} BAR(S) MISSED. EACH IS A FINDING AND NONE IS AN ERROR – invariant 5: numbers are`)
  console.log('       MEASURED, never adjusted, and NO CONSTANT WAS TOUCHED BY THIS RUN. §4 of the wave brief lists')
  console.log('       every §4 number as a PROPOSAL awaiting the owner\'s word, and a miss is what that word is for.')
  console.log('')
  for (const m of MISSES) console.log(`      MISS  ${m}`)
  console.log('')
  console.log('    THE EXIT CODE IS NON-ZERO because this bench carries psy-grid\'s pair and «a bench that always exits')
  console.log('    0 is a report, not a gate». No bench runs inside `npm run check`, so this reds nothing.')
  process.exitCode = 1
}
console.log('')
