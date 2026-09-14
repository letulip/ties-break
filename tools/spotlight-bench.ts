// THE SPOTLIGHT BENCH – what being known costs her, how often it fires, and what the PLAYER SEES.
// (v77, wave 6's T9. `docs/plans/life-wave-6-builder-2026-09.md` §2 T9 · `docs/specs/who-she-is-2026-09.md`
// §3c and §3c-bis · the architect's rulings E-bis, G, I and N in `life-wave-6-rulings-2026-09.md` ·
// the owner's D1 and D5, 14.09.)
//
// Run: `npm run bench:spotlight`   (`--careers N` scales the main grid · `--curve N` the habituation
// and walls arms).
//
// WHAT THIS MEASURES AND WHY IT IS THE ONLY INSTRUMENT THAT CAN. **Almost every §4 number in this
// wave is UNRULED** – the five bases, the two habituation dials, the leak pair, the wrong shares and
// the booth window – and the owner rules them off a record, not off a neighbouring constant. The one
// number that STOPPED being a proposal is the gate itself, and that is this header's own correction:
//
//   · ⚠⚠ D1 (14.09) – THE BAR BECAME THE OWNER'S OWN TWO RANK NUMBERS, AND THE SWEEP DIED WITH IT.
//     `newsFameMin` is gone; `newsStandingOf` (engine/world) reads live WTA points plus the cached
//     rank against `newsRankKnown` 100 / `newsRankNoticed` 200 («top-200 иногда, top-100 уверенно,
//     прямая аналогия – спонсорская лестница») and answers 'quiet' | 'noticed' | 'known'. Ruling E's
//     fame-bar measurement is history now, preserved in the decision log; there is nothing left to
//     sweep – the bands are HIS – so §1 stops being a five-arm re-walk and prints what stays
//     measured: their EFFECT. Coverage, event counts and leak attribution PER BAND, and D5's
//     freshness lever (`leakFreshWeeks`/`leakFreshMult`) with its own evidence line – the overtake.
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
// ⚠⚠ ZERO NEW RNG, MAIN IS NOT TOUCHED, AND – SINCE D1 – **NO DIAL IS MOVED AT ALL**. This file
// derives no stream and writes nothing into `ECONOMY`: the one poke it ever made was the bar the
// sweep moved, and the bar died with the sweep. `rollLeak` still derives
// `seed:life:leak:<id>:<week>` at its own call site, and the frozen capture (41550 / `e6b0c709`)
// cannot see this file.
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
  type NewsStanding,
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

/** Seeds per BIRTH temperament for the main grid – §1's band tables, §2's Mood column, §3's corridor. */
const CAREERS = flag('--careers', 6)
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

// ⚠ THERE IS NO DIAL SEAM IN THIS FILE ANY MORE, and the absence is D1's and deliberate: the sweep's
// named cast (`SPOTLIGHT_DIAL`), its verified `setBar` poke and §6's restore-and-check all died with
// `newsFameMin`. `ECONOMY` is read-only here now. A reader who wants the seam back should first want
// a constant that is a PROPOSAL again – the bands are the owner's own two numbers, not this bench's.

/** D1's three bands, in falling order of the light – the rows of every per-band table below. */
const STANDINGS: readonly NewsStanding[] = ['known', 'noticed', 'quiet']

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
  /** the leak rows, read back at the horizon – §1's leak column and the census's own subject.
   *  ⚠ `knownWeek` rides along for D5's overtake read: after `rollLeak`'s one-sided pull an
   *  overtaken row holds `knownWeek === publicWeek`, and a parent who was told first holds
   *  `knownWeek < publicWeek`. `null` is unreachable for engine-born rows and guarded anyway. */
  leaks: { sinceWeek: number; publicWeek: number; knownWeek: number | null; wrong: boolean }[]
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
    if (e.publicWeek !== null) c.leaks.push({ sinceWeek: e.sinceWeek, publicWeek: e.publicWeek, knownWeek: e.knownWeek, wrong: e.publicWrong })
  }
  return c
}

console.log('')
console.log('====================================================================================================')
console.log('  THE SPOTLIGHT BENCH – npm run bench:spotlight')
console.log('  docs/specs/who-she-is-2026-09.md §3c/§3c-bis · docs/plans/life-wave-6-builder-2026-09.md §2 T9')
console.log('  the owner\'s D1 (the bands) and D5 (the fresh leak), 14.09 · rulings E-bis (the policy), G (in-week), I (fame), N (the Mood band)')
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
console.log(`    seeds/temperament  : ${CAREERS} main · ${CURVE_CAREERS} curve + walls`)
console.log(`    the caring parent  : '${CARING.label}' – ruling E-bis's actuating arm (policy 0 peaks at fame 0.0, policy 1 at 53.2)`)
console.log(`    the grinding one   : '${GRINDING.label}' – used ONLY where a wall is the subject`)
console.log('')
console.log(`    the bands (D1)     : known ≤ ${ECONOMY.spotlight.newsRankKnown} WTA · noticed ≤ ${ECONOMY.spotlight.newsRankNoticed} WTA, live points required   [THE OWNER'S OWN two numbers – NOT proposals]`)
console.log(`    the bases          : ${EXPOSURE_KINDS.map((k) => `${k} ${ECONOMY.spotlight.pressureBase[k]}`).join(' · ')}   [PROPOSALS]`)
console.log(`    openness scale     : open ×${ECONOMY.spotlight.opennessScale.open} / private ×${ECONOMY.spotlight.opennessScale.private}   [ANCHORED by the spec – the one ruled pair]`)
console.log(`    intensity scale    : steady ×${ECONOMY.spirit.perturbationScale.steady} / intense ×${ECONOMY.spirit.perturbationScale.intense}   [the STANDING perturbationScale, not a new constant]`)
console.log(`    habituation        : full at ${ECONOMY.spotlight.habituationFullWeeks} weeks lived 'known' · floor ×${ECONOMY.spotlight.habituationFloor}   [PROPOSALS · D1: grows ONLY at 'known']`)
console.log(`    the fifth focus    : shrink [${ECONOMY.psychologist.publicLifeShrink.join(', ')}] · accel [${ECONOMY.psychologist.publicLifeAccel.join(', ')}]   [PROPOSALS]`)
console.log(`    the leak           : base ${ECONOMY.spotlight.leakBasePerWeek}/wk × openness (open ×${ECONOMY.spotlight.leakOpennessMult.open} / private ×${ECONOMY.spotlight.leakOpennessMult.private}) × fame/${ECONOMY.fame.cap}   [ruling I]`)
console.log(`                         × ${ECONOMY.spotlight.noticedLeakScale} at 'noticed' (D1) · × ${ECONOMY.spotlight.leakFreshMult} while the episode is ≤ ${ECONOMY.spotlight.leakFreshWeeks} weeks old (D5)   [PROPOSALS]`)
console.log(`    the row's floor    : |charge| ≥ ${ECONOMY.spotlight.rowMinCharge} before the feed names the week out loud (D1b) – the CHARGE is untouched, so no table here moves`)
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
  /** ...and the 'KNOWN' WEEKS to a full habituation at each rung, `habituationFullWeeks /
   *  accel[rung]` – D1's clock: the counter moves only on a week she lives `'known'`. */
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
console.log(`      'known'-weeks to a full habituation           : no seat ${num(PRED.capWeeksNoSeat, 1)} · rung 0 ${num(PRED.capWeeks[0], 1)} · rung 1 ${num(PRED.capWeeks[1], 1)} · rung 2 ${num(PRED.capWeeks[2], 1)}`)
console.log('')
console.log('    PREDICTION (D1): the bands are the owner\'s own two numbers, so there is no coverage left to rule –')
console.log('      what §1 must show is their EFFECT. Habituation moves ONLY on \'known\' weeks; every exposure kind')
console.log('      may fire in BOTH non-quiet bands; and events on a recorded \'quiet\' week should be rare boundary')
console.log('      cases (a reveal-week rank re-fold crossing a band edge between the tick\'s own gate and this')
console.log('      file\'s end-of-step read).')
console.log('    PREDICTION (D5, written before the run): under the flat hazard the founding scene fired 0 times in')
console.log(`      93 leaks across 160 bench careers. At ×${ECONOMY.spotlight.leakFreshMult} for the first ${ECONOMY.spotlight.leakFreshWeeks} episode-weeks the fresh window now carries`)
console.log(`      roughly ${ECONOMY.spotlight.leakFreshMult}× its flat-hazard mass, so a visible share of leaks should land FRESH – and at least one`)
console.log('      should reach the parent as a headline (the overtake, §1\'s own D5 verdict).')
console.log('')
console.log('    PREDICTION (the masseur §4 law, benched in psy-grid): pressure-shrink and habituation-acceleration')
console.log('      monotone in rung, each step > 2×SEM. This file prices the same ladder from the SPOTLIGHT side –')
console.log('      the habituation curve of §4 – and psy-grid\'s fifth column prices it from the seat\'s.')
console.log('')

// =================================================================================================
// §1. ⚠⚠ THE BANDS – D1's TWO RANK NUMBERS, AND WHAT EACH BAND ACTUALLY HELD
// =================================================================================================
//
// ⚠⚠ THE SWEEP THAT USED TO LIVE HERE IS GONE, AND THE ABSENCE IS THE RULING BEING HONOURED: the bar
// became the owner's own two rank numbers (D1, 14.09 – the sponsor ladder's own analogy) and a bench
// does not sweep a ruling. What stays measured is their EFFECT, on ONE walked grid: how much of a
// career each band holds, which kinds fire in it, where the leaks land – and D5's freshness lever,
// whose evidence line (the overtake) this section owns. The five-arm re-walk, its `BarRow`s and the
// dial it poked are all deleted rather than parked, because a sweep with nothing to sweep is dead
// infrastructure wearing a section number.
//
// ⚠ ATTRIBUTION IS BY THE RECORDED WEEK'S OWN BAND. `readSpotWeek` takes `newsStandingOf(world)` at
// the end of the step; the tick's gates read the same predicate mid-tick, so on a reveal week whose
// step-tail rank re-fold crossed a band edge the two can disagree. Such weeks are boundary cases by
// construction, and the 'quiet' row of the kind table below is exactly where they would show.
//
// ⚠ THE CHARGE ROWS ARE INDEXED BY THE EXPOSURE WEEK'S BAND, NOT THE CHARGE WEEK'S: `chargeAt(wk, w)`
// pays for week `w − 1`'s cameras (ruling P), so the band that EARNED the charge is `wk[w − 1]`'s.

rule("§1. ⚠⚠ THE BANDS – 'known' / 'noticed' / 'quiet' coverage, events and leaks   [D1 14.09 · the owner's own two numbers]")

const mainCareers: Career[] = []
for (const t of TEMPERAMENTS) {
  for (let i = 0; i < CAREERS; i++) {
    mainCareers.push(walk(`spot-main-${i}`, t, { policy: CARING, rung: null, focus: null, weeks: WEEKS }))
  }
}

/** A zeroed per-kind counter – built off `EXPOSURE_KINDS` so a sixth kind cannot be silently missed. */
function kindZero(): Record<ExposureKind, number> {
  const z = {} as Record<ExposureKind, number>
  for (const k of EXPOSURE_KINDS) z[k] = 0
  return z
}

{
  interface BandRow {
    weeks: number
    events: number
    chargedWeeks: number
    perEvent: number[]
    leaks: number
    byKind: Record<ExposureKind, number>
  }
  const bandRow = (): BandRow => ({ weeks: 0, events: 0, chargedWeeks: 0, perEvent: [], leaks: 0, byKind: kindZero() })
  const bands: Record<NewsStanding, BandRow> = { quiet: bandRow(), noticed: bandRow(), known: bandRow() }
  let weeksTotal = 0
  let eventsTotal = 0
  let everNews = 0
  for (const c of mainCareers) {
    let sawNews = false
    for (let w = 0; w < c.wk.length; w++) {
      const week = c.wk[w]
      if (week === undefined) continue
      weeksTotal++
      const band = bands[week.standing]
      band.weeks++
      band.events += week.exposure.length
      eventsTotal += week.exposure.length
      for (const k of week.exposure) band.byKind[k]++
      if (week.news) sawNews = true
      const charge = chargeAt(c.wk, w)
      if (charge !== 0) {
        // ⚠ THE CHARGE BELONGS TO THE EXPOSURE WEEK'S BAND (ruling P: week `w`'s pass pays for week
        //   `w − 1`'s cameras), and PER EVENT rather than per week – a week that held two events is
        //   two charges, and the column says «what one exposure costs», not «what a busy week costs».
        const owner = c.wk[w - 1]
        if (owner !== undefined) {
          const ob = bands[owner.standing]
          ob.chargedWeeks++
          const n = eventsChargedAt(c.wk, w)
          if (n > 0) ob.perEvent.push(charge / n)
        }
      }
    }
    if (sawNews) everNews++
    for (const l of c.leaks) {
      const at = c.wk[l.publicWeek]
      if (at !== undefined) bands[at.standing].leaks++
    }
  }

  console.log(`    grid : ${mainCareers.length} careers · ${weeksTotal} recorded weeks · ${everNews}/${mainCareers.length} careers ever left 'quiet'`)
  console.log('')
  console.log(
    `    ${pad('band', 10)}${padL('weeks', 9)}${padL('share', 9)}${padL('events', 9)}${padL('ev/100wk', 10)}${padL('charged wks', 13)}${padL('mean/event', 12)}${padL('leaks', 7)}`,
  )
  for (const s of STANDINGS) {
    const b = bands[s]
    console.log(
      `    ${pad(s, 10)}${padL(String(b.weeks), 9)}${padL(pctS(share(`§1 ${s} weeks`, b.weeks, weeksTotal)), 9)}` +
        `${padL(String(b.events), 9)}${padL(b.weeks > 0 ? num((100 * b.events) / b.weeks, 1) : '–', 10)}` +
        `${padL(String(b.chargedWeeks), 13)}${padL(b.perEvent.length > 0 ? num(avg(sample(`§1 ${s} per-event`, b.perEvent))) : '–', 12)}` +
        `${padL(String(b.leaks), 7)}`,
    )
  }
  console.log('')
  console.log('    ...and the same grid broken out by KIND, because the bands decide where each kind can fire at all:')
  console.log('    ⚠⚠ `shoot` IS STRUCTURALLY UNREACHABLE ON THIS HARNESS AND THE COLUMN IS NOT A FINDING ABOUT THE BANDS.')
  console.log('       The kind fires on a DELIVERED shoot week, and a shoot week only exists on a SIGNED ad letter –')
  console.log('       `stepCareerWeek` (econ-bench\'s parent) signs none, at any preset, at any policy. So every event')
  console.log('       count in the table above is a LOWER BOUND, short by exactly the SHALLOWEST kind the wave has')
  console.log(`       (\`pressureBase.shoot\` ${ECONOMY.spotlight.pressureBase.shoot} against ${ECONOMY.spotlight.pressureBase.publicLoss} for a public loss). \`tools/ad-shoot-bench.ts\` is the instrument that signs`)
  console.log('       letters, and pairing the two is a task this bench deliberately did not invent for itself.')
  console.log(`    ${pad('band', 10)}${EXPOSURE_KINDS.map((k) => padL(k, 12)).join('')}`)
  for (const s of STANDINGS) {
    console.log(`    ${pad(s, 10)}${EXPOSURE_KINDS.map((k) => padL(String(bands[s].byKind[k]), 12)).join('')}`)
  }
  console.log('      ⚠ THE \'quiet\' ROW IS A BOUNDARY COUNTER, NOT A HOLE IN THE GATE: every kind is gated on a non-quiet')
  console.log('        standing INSIDE the tick, so a non-zero here is a reveal week whose step-tail rank re-fold crossed')
  console.log('        a band edge between the tick\'s own gate and this file\'s end-of-step read. Rare by construction.')
  console.log('')
  if (eventsTotal === 0) {
    stall(
      '§1: ZERO exposure events on the whole grid',
      'not one camera found her – ruling E-bis: check the POLICY, not the money (policy 0 peaks at fame 0.0)',
    )
  }

  // --- D5's OWN EVIDENCE LINE – the fresh leak, and the overtake ---------------------------------
  //
  // ⚠⚠ THE OVERTAKE IS READ OFF THE ROWS, NEVER RE-DERIVED: `rollLeak`'s pull is one-sided
  // (`knownWeek` never moves later), so an overtaken row holds `knownWeek === publicWeek` and a
  // parent who was told first holds `knownWeek < publicWeek`. ⚠ ONE HONEST AMBIGUITY, stated rather
  // than hidden: a scheduled disclosure landing on the LEAK's own week also reads `knownWeek ===
  // publicWeek` – the engine breaks that tie as «already told» (its condition is `knownWeek >
  // world.week`) – so this count can overstate by exactly those same-week coincidences: a one-week
  // window against a multi-week lag distribution. Stated, not corrected.
  const SPOT = ECONOMY.spotlight
  const leaks = mainCareers.flatMap((c) => c.leaks)
  console.log("    ...and D5's freshness lever, on the same careers – the founding scene's own evidence line:")
  if (leaks.length === 0) {
    console.log('      leaks landed : 0 – the lever is UNMEASURED on this grid. No share is printed off an empty')
    console.log("                     denominator (instrument law 4), and §6's actuation receipt stalls on exactly")
    console.log('                     this zero, with the stack attached.')
  } else {
    const ages = leaks.map((l) => l.publicWeek - l.sinceWeek)
    const fresh = leaks.filter((l) => l.publicWeek - l.sinceWeek <= SPOT.leakFreshWeeks)
    const overtakes = leaks.filter((l) => l.knownWeek !== null && l.publicWeek <= l.knownWeek)
    console.log(
      `      leaks landed : ${leaks.length} · FRESH (age ≤ ${SPOT.leakFreshWeeks} wks at landing): ${fresh.length} (${pctS(share('§1 D5 fresh', fresh.length, leaks.length))}) · median age at landing ${num(median([...ages]), 0)} wks`,
    )
    console.log(
      `      the OVERTAKE : ${overtakes.length} of ${leaks.length} (${pctS(share('§1 D5 overtake', overtakes.length, leaks.length))}) reached the parent as a headline – «a parent learning about a boyfriend from a photograph»`,
    )
    console.log(
      `      the founding scene fires on this grid   ${verdict('§1 D5 – the founding scene fires', overtakes.length > 0, `0 overtakes in ${leaks.length} leaks – the flat-hazard result (0 in 93) survived leakFreshWeeks ${SPOT.leakFreshWeeks} / leakFreshMult ${SPOT.leakFreshMult}; implicates ECONOMY.spotlight.leakFreshWeeks and leakFreshMult`)}`,
    )
  }
  console.log('')

  // --- the section's own bar ---------------------------------------------------------------------
  // THE BANDS ARE NOT A PASS/FAIL – they are the owner's own numbers. What IS a bar here is
  // ACTUATION: a band with zero weeks leaves its own constants (`noticedLeakScale`, habituation's
  // 'known'-only gate) unmeasured, and an unmeasured lever must not read as a quiet pass.
  const bothWalked = bands.known.weeks > 0 && bands.noticed.weeks > 0
  console.log(
    `    both non-quiet bands were actually walked   ${verdict('§1 D1 – both bands occur on this grid', bothWalked, `known ${bands.known.weeks} wks · noticed ${bands.noticed.weeks} wks – a band with zero weeks leaves its own levers unmeasured on this grid; implicates the GRID (policy, horizon) before any constant`)}`,
  )
  console.log('')
  console.log('    !! WHAT THIS TABLE IS FOR. Every mechanic in the wave sits behind ONE predicate and these are its')
  console.log("       three answers. The bands themselves are the owner's (D1) and are not on trial; what he reads here")
  console.log("       is what each band BUYS – 'known' grows habituation, 'noticed' discounts the leak, 'quiet' is")
  console.log('       nothing – and whether the freshness lever (D5) finally makes the founding scene reachable.')
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

// ⚠ THE CAREERS ARE §1's – one grid, walked once, read three times (§1 bands, §2 Mood, §3 corridor).

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
// ⚠ THE X AXIS IS **'KNOWN' WEEKS**, NOT CALENDAR WEEKS AND NOT `news` ONES – D1's own clock: since
// 14.09 the counter moves ONLY on a week she lives 'known' (a girl the light merely visits at
// 'noticed' never gets used to it), so a career that spent 40 weeks known and one that spent 400
// are not two speeds of the same walk, and a 'noticed' season is not on this axis at all.

rule("§4. THE HABITUATION CURVE – 'known'-weeks to the floor, walled vs unwalled vs focus-held")

interface CurveCell {
  label: string
  arm: 'unwalled' | 'focus-held' | 'walled'
  knownToCap: number[]
  capReached: number
  n: number
  finalHab: number[]
  knownWeeks: number[]
  walledWeeks: number[]
  frozenKnownWeeks: number[]
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
    const cell: CurveCell = { label: a.label, arm: a.arm, knownToCap: [], capReached: 0, n: 0, finalHab: [], knownWeeks: [], walledWeeks: [], frozenKnownWeeks: [] }
    for (const t of TEMPERAMENTS) {
      for (let i = 0; i < CURVE_CAREERS; i++) {
        const c = walk(`spot-curve-${i}`, t, { ...a.opts, weeks: WEEKS })
        cell.n++
        let known = 0
        let walledW = 0
        let frozen = 0
        let toCap = -1
        const cap = ECONOMY.spotlight.habituationFullWeeks
        for (let w = 0; w < c.wk.length; w++) {
          const week = c.wk[w]
          if (week === undefined) continue
          // ⚠⚠ THE GATE IS 'known' AT `w − 1` – ONE CORRECTION PER RULING, BOTH LOAD-BEARING. D1
          //    (14.09): `growHabituation` is handed `newsStandingOf(world) === 'known'`, so a
          //    'noticed' week grows NOTHING and a counter keyed on `news` would overshoot the cap
          //    exactly the way the first draft's off-by-one did (105 against a shipped 104). And the
          //    `w − 1`: the pass reads the standing whose cached rank is «as of the last closed
          //    fold» (the predicate's own contract), which at week `w`'s pass is the fold this file
          //    recorded at the END of step `w − 1` – so «a week the counter could have grown on» is
          //    a fact about the PREVIOUS recorded week's BAND.
          const gate = c.wk[w - 1]
          if (gate !== undefined && gate.standing === 'known') known++
          if (week.walled) walledW++
          if (gate !== undefined && gate.standing === 'known' && week.walled) frozen++
          if (toCap < 0 && week.habituation >= cap - 1e-9) toCap = known
        }
        cell.knownWeeks.push(known)
        cell.walledWeeks.push(walledW)
        cell.frozenKnownWeeks.push(frozen)
        const last = [...c.wk].reverse().find((x) => x !== undefined)
        cell.finalHab.push(last?.habituation ?? 0)
        if (toCap >= 0) {
          cell.knownToCap.push(toCap)
          cell.capReached++
        }
      }
    }
    curveCells.push(cell)
  }
}
console.log(`    ${pad('arm', 44)}${padL('n', 4)}${padL('known wks', 11)}${padL('walled wks', 12)}${padL('FROZEN known wks', 18)}${padL('final hab', 11)}${padL('reached cap', 13)}${padL('known wks to cap', 18)}${padL('predicted', 11)}`)
for (const cell of curveCells) {
  const predicted = cell.arm === 'unwalled' ? PRED.capWeeksNoSeat : cell.arm === 'focus-held' ? PRED.capWeeks[2] : Number.NaN
  console.log(
    `    ${pad(cell.label, 44)}${padL(String(cell.n), 4)}${padL(num(avg(sample(`§4 ${cell.arm} known`, cell.knownWeeks)), 1), 11)}` +
      `${padL(num(avg(sample(`§4 ${cell.arm} walled`, cell.walledWeeks)), 1), 12)}${padL(num(avg(sample(`§4 ${cell.arm} frozen`, cell.frozenKnownWeeks)), 1), 18)}` +
      `${padL(num(avg(sample(`§4 ${cell.arm} final`, cell.finalHab)), 1), 11)}${padL(`${cell.capReached}/${cell.n}`, 13)}` +
      `${padL(cell.knownToCap.length > 0 ? num(median([...cell.knownToCap]), 0) : '–', 18)}${padL(num(predicted, 1), 11)}`,
  )
}
console.log('')
{
  const un = curveCells.find((c) => c.arm === 'unwalled')!
  const fo = curveCells.find((c) => c.arm === 'focus-held')!
  const wa = curveCells.find((c) => c.arm === 'walled')!
  if (un.knownToCap.length === 0 && fo.knownToCap.length === 0) {
    stall('§4: NOT ONE career reached the habituation cap in any arm', 'the curve has no end point and «the veteran shrugs» cannot be priced')
  }
  // THE ACCELERATION, measured the only way that is not the multiplier read back to itself: 'KNOWN'
  // WEEKS SPENT, not calendar weeks and not the counter. ⚠ The two arms are the same seeds.
  if (un.knownToCap.length > 0 && fo.knownToCap.length > 0) {
    const u = sample('§4 unwalled known-to-cap', un.knownToCap, 1)
    const f = sample('§4 focus known-to-cap', fo.knownToCap, 1)
    const d = avg(f) - avg(u)
    const se = Math.sqrt(sem(u) ** 2 + sem(f) ** 2)
    const ok = d < 0
    console.log(
      `    the seat SHORTENS the walk : ${num(avg(u), 1)} → ${num(avg(f), 1)} 'known' weeks (Δ ${num(d, 1)} ± ${num(se, 1)})   ${verdict('§4 habituation acceleration, rung 2 vs no seat', ok, `the focus-held arm did not reach the cap sooner – implicates ECONOMY.psychologist.publicLifeAccel [${ECONOMY.psychologist.publicLifeAccel.join(', ')}]`)}`,
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
    console.log('      ⚠ AND THE PREDICTED COLUMN ASSUMES THE YEAR IS HELD FROM HER FIRST \'known\' WEEK, WHICH NO CAREER CAN')
    console.log('        DO. The seat cannot be hired before `psychologistUnlocked` and the focus waits on the consent gates,')
    console.log('        so the first stretch of \'known\' weeks grows at ×1 whatever the rung. A measured walk LONGER than the')
    console.log('        prediction is that delay, not a weak accelerator; the gap between them is what the delay costs.')
  } else {
    console.log('    the seat SHORTENS the walk : – (one of the two arms never reached the cap; the comparison is UNMEASURED)')
    verdict('§4 habituation acceleration, rung 2 vs no seat', false, 'one of the two arms never reached the cap – the comparison could not be taken')
  }
  // THE FREEZE. ⚠ IT IS A COUNT OF **'KNOWN' WEEKS SPENT WALLED**, which is the number ruling H's ×0
  //    actually consumes since D1, and it is the actuation receipt for this arm at the same time.
  const frozenTotal = wa.frozenKnownWeeks.reduce((a, b) => a + b, 0)
  console.log(
    `    the walls FREEZE it        : the grinding arm spent ${frozenTotal} 'known' weeks behind a flipped wall, and the counter did not move on one of them (ruling H, ×0 on EITHER axis).`,
  )
  if (frozenTotal === 0) {
    console.log('      !! ZERO – the grinding arm never met a \'known\' week with a wall up, so this line is a statement about')
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
    knownWeeks: number[]
    frozenKnown: number[]
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
      knownWeeks: [],
      frozenKnown: [],
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
        let known = 0
        let frozen = 0
        let charge = 0
        let events = 0
        let uk = 0
        for (let w = 0; w < c.wk.length; w++) {
          const week = c.wk[w]
          if (week === undefined) continue
          // ⚠ THE GATE IS 'known' AT `w − 1`, §4's own two corrections applied here too: since D1
          //   `growHabituation` is handed `newsStandingOf(world) === 'known'`, and the fold that
          //   read describes is the one recorded at the END of the previous step – so «a week the
          //   counter could have grown on» is a fact about the PREVIOUS recorded week's BAND.
          const gate = c.wk[w - 1]
          if (gate !== undefined && gate.standing === 'known') known++
          if (gate !== undefined && gate.standing === 'known' && week.walled) frozen++
          if (week.spirit < ECONOMY.spirit.knee) uk++
          const ch = chargeAt(c.wk, w)
          charge += ch
          events += eventsChargedAt(c.wk, w)
        }
        const last = [...c.wk].reverse().find((x) => x !== undefined)
        cell.finalHab.push(last?.habituation ?? 0)
        cell.knownWeeks.push(known)
        cell.frozenKnown.push(frozen)
        cell.totalCharge.push(charge)
        cell.underKnee.push(uk)
        if (events > 0) cell.meanPerEvent.push(charge / events)
        if (last?.walled === true) cell.flippedAtEnd++
      }
    }
    cells.push(cell)
  }
  console.log(`    ${pad('arm', 44)}${padL('n', 4)}${padL('known wks', 11)}${padL('frozen known', 14)}${padL('final hab', 11)}${padL('walled at end', 15)}${padL('mean/event', 12)}${padL('spirit-wks < knee', 19)}`)
  for (const cell of cells) {
    console.log(
      `    ${pad(cell.label, 44)}${padL(String(cell.n), 4)}${padL(num(avg(sample(`§5 ${cell.label} known`, cell.knownWeeks)), 1), 11)}` +
        `${padL(num(avg(sample(`§5 ${cell.label} frozen`, cell.frozenKnown)), 1), 14)}${padL(num(avg(sample(`§5 ${cell.label} hab`, cell.finalHab)), 1), 11)}` +
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
  console.log('       can reach a different standing. The «known wks» column is printed for exactly that reason – read the')
  console.log('       habituation delta against it, and treat a repaired arm that is merely MORE FAMOUS as an unproven')
  console.log('       claim rather than a confirmed one. The arms ARE byte-identical up to the wall week, which is what')
  console.log(`       makes the comparison worth taking at all: they are one career until week ${REPAIR_ON}.`)
}

// =================================================================================================
// §6. THE ACTUATION RECEIPT – proof each arm reached its own subject
// =================================================================================================

rule('§6. THE ACTUATION RECEIPT – every arm reached its subject, and no dial was ever poked')
{
  const allCareers = mainCareers
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
    ['news weeks walked', newsWeeks, "zero means not one career ever left 'quiet' – ruling E-bis: check the POLICY"],
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
  console.log('    no dial to restore        : D1 removed the one poke this file ever made – ECONOMY was read-only for the whole run.')
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
