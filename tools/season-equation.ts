/**
 * season-equation – WHY A BREAKOUT SEASON IS FOLLOWED BY A COLLAPSE, AND WHAT THE TWO FATIGUE DIALS
 * ARE ACTUALLY WORTH. The measurement arm of docs/specs/the-season-equation-2026-09.md.
 *
 * THE OWNER, playing across the round-44 merge: «Был неудачный сезон на 56 или 59 месте, после этого
 * пришла волна наших правок, случился новый безумный сезон, который она закончила на 17 месте, а
 * потом полный провал обратно на 82 месте в рейтинге. это надо исследовать под номером 1.»
 *
 * And, separately, about the body: «мне кажется нам надо немного увеличить восстановление в неделю.
 * Получается, что я езжу в отпуск 1-2 раза в месяц, хотя вроде бы надо тренироваться» … «может быть
 * мы сильно много снимаем за турнир всё-таки, я вот думаю? Это тоже можно исследовать как рычаг».
 *
 * ⚠⚠ THIS TOOL MOVES NO SHIPPED CONSTANT. Every dial it touches is patched on the LIVE `ECONOMY`
 * object for the duration of one arm and restored in a `finally` – the fatigue bench's own
 * `withScenario` idiom, and the control discipline CLAUDE.md demands: a control is THIS tree with
 * THIS change reverted IN PLACE, never a different commit and never a different worktree. The
 * shipped values are one cell of every sweep, and they are the cell everything else is read against.
 *
 * FIVE SECTIONS, each its own flag (default: §1 and §2):
 *
 *   §0 --actuate    THE ARMS ARE WIRED. Both dials driven to absurd values in both directions, and
 *                   the headline figure printed for each. ⚠⚠ IF THESE DO NOT MOVE, EVERY OTHER
 *                   NUMBER IN THIS FILE IS A FICTION – CLAUDE.md's «a null result is a claim and
 *                   needs the same provenance check as a positive one».
 *   §1 --traj       THE DECOMPOSITION OF HIS TRAJECTORY. Real careers walked through the shipped
 *                   tick with the `player` policy; per season the body (median/min condition, weeks
 *                   under 50), the calendar (events, matches, depth, vacations), the damage (knocks,
 *                   injuries by door) and the year-end rank on her professional table.
 *   §2 --attrib     WHAT CAUSED THE FALL. The rank fall after a breakout is split into the part
 *                   POINTS DEFENCE explains (she is defending a year she cannot repeat – the
 *                   arithmetic every real tour has) and the part that is genuine deterioration, and
 *                   the second part is then priced by ablation arms (fatigue off, injuries off).
 *   §3 --grid       THE TWO DIALS AS A GRID. Per-match tier surcharge x `proPhaseRecoveryBase`,
 *                   shipped values included as the control cell.
 *   §4 --staffing   THE MASSEUR'S PREMISE, RE-CHECKED. `proPhaseRecoveryBase` fell 8 -> 5 on 22.08
 *                   precisely so the masseur would have something to add; this arm reports the same
 *                   headline figures with him daily and with him absent, so the 22.08 premise can be
 *                   checked against today's game rather than against August's.
 *   §5 --levers     ⭐⭐ THE 19.09 RULING, PRICED. The owner REJECTED §8a's «move nothing» and named
 *                   the direction himself: «нет, не подходит, надо либо немного уменьшить усталость
 *                   на глубоких турнирах, либо приподнять недельное восстановление, может быть за
 *                   счет массажиста, а может быть и массажист, и естественное. посмотри в эту
 *                   сторону и продолжай работу» – and then named the levers as FOUR rather than two:
 *                   «слив на глубине хода и турнирная работа массажиста, а также обычная работа
 *                   массажиста и естественное восстановление». So: (A) the CONCAVE depth curve,
 *                   (B) the masseur's TOURNAMENT relief, (C) the masseur's ORDINARY weekly bonus,
 *                   (D) NATURAL weekly recovery, (E) combinations drawing from all four.
 *
 *                   ⚠⚠ AND THE TARGET IS NOT THE ONE §1-§9 WERE SCORED AGAINST. On 19.09 he RELEASED
 *                   his own «arrive at the off-season door around 45-50» sentence: «давай изменим эту
 *                   цель, если она нам мешает. Цель – отпуска реже, а не после каждого турнира
 *                   ездить всё-таки». The bar is now HOLIDAY FREQUENCY and nothing else; the door
 *                   figure is REPORTED and left to float, because it is the very thing that forces
 *                   the holidays – a year spent near empty is the only way to arrive at 45.
 *
 * ⚠ THE WALK IS `stepCareerWeek` (tools/econ-bench.ts) PLUS THE STANDING DRAIN RECIPE
 * (`_lifeBeats`, `_birthday`, the fork, the retirement offer). A career does not advance on
 * `tickWeek` alone – it stalls at every pending decision – and `tools/r44-decline-seats.ts`'s
 * `answerWhateverIsOpen` is the shape every bench in this wave uses.
 *
 * Run: npm run bench:season-eq
 *      npm run bench:season-eq -- --actuate
 *      npm run bench:season-eq -- --grid --seeds 6
 *      npm run bench:season-eq -- --staffing
 *      npm run bench:season-eq -- --levers --seeds 10 --toAge 28
 */
import { ECONOMY } from '../src/engine/economy'
import { tournamentRunStrain } from '../src/engine/condition'
import {
  KID_ID,
  answerFork,
  answerRetirement,
  hireMasseur,
  pendingBirthday,
  setMasseurSessions,
  setMasseurTravels,
  type WorldState,
} from '../src/engine/world'
import { masseurUnlocked } from '../src/engine/world/masseur'
import { inTrack, rankingFor } from '../src/engine/world/ladder'
import { kidAgeExact } from '../src/engine/world/age'
import { BEST_N_BY_TRACK, WINDOW_BY_TRACK, windowedBestSum, type SeasonResult } from '../src/engine/season/ranking'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'
import { answerBirthdayNeutral } from './_birthday'
import { drainLifeBeats } from './_lifeBeats'

// =================================================================================================
// CLI
// =================================================================================================
const args = process.argv.slice(2)
const numOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = numOf('seeds', 6)
const TO_AGE = numOf('toAge', 27)
const ACTUATE = args.includes('--actuate')
const GRID = args.includes('--grid')
const STAFFING = args.includes('--staffing')
const LEVERS = args.includes('--levers')
const TRAJ = args.includes('--traj') || (!ACTUATE && !GRID && !STAFFING && !LEVERS)
/** skip §2b's ablation arms – they are four more full walks, and §1/§2 alone answer most questions */
const NO_ABLATION = args.includes('--noabl')

/** The season's last ordinary week – the off-season door (offset 49). */
const SEASON_WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

const f0 = (x: number) => x.toFixed(0)
const f1 = (x: number) => x.toFixed(1)
const f2 = (x: number) => x.toFixed(2)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)
const rule = (n = 108) => '='.repeat(n)
const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const median = (xs: number[]) => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const sem = (xs: number[]) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1) / xs.length)
}

// =================================================================================================
// THE DIALS – patched in place, restored in a finally. Nothing is written back to a file.
// =================================================================================================

/** The rungs a professional season is made of. The surcharge dial moves THESE and nothing else: the
 *  junior and domestic families are a separate calibration with their own guards
 *  (tests/fatigueReference.test.ts), and moving them here would re-price a schoolgirl's week to
 *  answer a question about a professional's. */
const PRO_RUNGS: readonly TierId[] = ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam']

interface Dials {
  /** added to `tierMatchFatigue` on every professional rung (0 = shipped) */
  surchargeDelta: number
  /** `ECONOMY.condition.proPhaseRecoveryBase` (null = shipped) */
  proRecovery: number | null
  /** kill the whole drain – the fatigue-off ablation arm */
  noDrain?: boolean
  /** kill the weekly injury roll – the injury-off ablation arm */
  noInjury?: boolean
  /** ⭐ §5 A – replace `runFatigueLadderWta` (the twelve 32-draw professional rungs). null = shipped */
  ladderWta?: number[] | null
  /** ⭐ §5 A – replace `runFatigueLadderDeep` (wta1000 and slam, the two draws over 32). null = shipped */
  ladderDeep?: number[] | null
  /** ⭐ §5 B – added to EVERY masseur rung's `conditionBonusPerWeek` (0 = shipped 1/2/3) */
  masseurBonusDelta?: number
  /** ⭐ §5 B – `ECONOMY.masseur.tourRecoveryPerRound` (null = shipped 2) */
  tourRelief?: number | null
}
const SHIPPED: Dials = { surchargeDelta: 0, proRecovery: null }

const CONDITION = ECONOMY.condition as unknown as {
  proPhaseRecoveryBase: number
  tierMatchFatigue: Record<TierId, number>
  matchFatigue: { straightSets: number; hardMatch: number; extraTiebreaks: number }
  runFatigueLadder: number[]
  runFatigueLadderWta: number[]
  runFatigueLadderDeep: number[]
}
const AVAILABILITY = ECONOMY.availability as unknown as {
  injuryBaseChance: number
  injuryFatigueSlope: number
  injuryPlayingMultiplier: number
}
/** ⭐ §5 B's two dials. `conditionBonusPerWeek` is the AT-HOME table (world/medical.ts accrueCondition,
 *  paid only on weeks she does NOT play) and `tourRecoveryPerRound` is the one that reaches a
 *  TOURNAMENT week (world/masseur.ts masseurTourRelief, per night between rounds at finalize) – which
 *  is the whole reason he is in this measurement at all: §3 found the ceiling, not the dial, is what
 *  a rest week runs into. */
const MASSEUR = ECONOMY.masseur as unknown as {
  rungs: { sessions: number; conditionBonusPerWeek: number }[]
  tourRecoveryPerRound: number
}

/** Run `body` with the dials applied, and put every one of them back afterwards. The restore is in a
 *  `finally`, so a throw inside one arm cannot leak a patched constant into the next – which is the
 *  one way a sweep like this can report a cell it never actually ran. */
function withDials<T>(d: Dials, body: () => T): T {
  const saved = {
    pro: CONDITION.proPhaseRecoveryBase,
    tier: { ...CONDITION.tierMatchFatigue },
    match: { ...CONDITION.matchFatigue },
    ladder: [...CONDITION.runFatigueLadder],
    ladderW: [...CONDITION.runFatigueLadderWta],
    ladderD: [...CONDITION.runFatigueLadderDeep],
    inj: { ...AVAILABILITY },
    // ⚠ THE RUNG OBJECTS ARE SHARED, so the bonus is saved VALUE BY VALUE rather than by spreading
    // the array: `[...rungs]` copies the references and would restore nothing at all.
    masseurBonus: MASSEUR.rungs.map((r) => r.conditionBonusPerWeek),
    tourRelief: MASSEUR.tourRecoveryPerRound,
  }
  try {
    if (d.proRecovery !== null) CONDITION.proPhaseRecoveryBase = d.proRecovery
    if (d.surchargeDelta !== 0) {
      for (const t of PRO_RUNGS) CONDITION.tierMatchFatigue[t] = Math.max(0, saved.tier[t] + d.surchargeDelta)
    }
    if (d.ladderWta != null) CONDITION.runFatigueLadderWta = [...d.ladderWta]
    if (d.ladderDeep != null) CONDITION.runFatigueLadderDeep = [...d.ladderDeep]
    if (d.masseurBonusDelta !== undefined && d.masseurBonusDelta !== 0) {
      MASSEUR.rungs.forEach((r, i) => (r.conditionBonusPerWeek = Math.max(0, saved.masseurBonus[i] + d.masseurBonusDelta!)))
    }
    if (d.tourRelief != null) MASSEUR.tourRecoveryPerRound = d.tourRelief
    if (d.noDrain === true) {
      for (const t of TIER_LADDER) CONDITION.tierMatchFatigue[t] = 0
      CONDITION.matchFatigue.straightSets = 0
      CONDITION.matchFatigue.hardMatch = 0
      CONDITION.matchFatigue.extraTiebreaks = 0
      CONDITION.runFatigueLadder = CONDITION.runFatigueLadder.map(() => 0)
      CONDITION.runFatigueLadderWta = CONDITION.runFatigueLadderWta.map(() => 0)
      CONDITION.runFatigueLadderDeep = CONDITION.runFatigueLadderDeep.map(() => 0)
    }
    if (d.noInjury === true) {
      AVAILABILITY.injuryBaseChance = 0
      AVAILABILITY.injuryFatigueSlope = 0
      AVAILABILITY.injuryPlayingMultiplier = 0
    }
    return body()
  } finally {
    CONDITION.proPhaseRecoveryBase = saved.pro
    for (const t of Object.keys(saved.tier) as TierId[]) CONDITION.tierMatchFatigue[t] = saved.tier[t]
    CONDITION.matchFatigue.straightSets = saved.match.straightSets
    CONDITION.matchFatigue.hardMatch = saved.match.hardMatch
    CONDITION.matchFatigue.extraTiebreaks = saved.match.extraTiebreaks
    CONDITION.runFatigueLadder = saved.ladder
    CONDITION.runFatigueLadderWta = saved.ladderW
    CONDITION.runFatigueLadderDeep = saved.ladderD
    AVAILABILITY.injuryBaseChance = saved.inj.injuryBaseChance
    AVAILABILITY.injuryFatigueSlope = saved.inj.injuryFatigueSlope
    AVAILABILITY.injuryPlayingMultiplier = saved.inj.injuryPlayingMultiplier
    MASSEUR.rungs.forEach((r, i) => (r.conditionBonusPerWeek = saved.masseurBonus[i]))
    MASSEUR.tourRecoveryPerRound = saved.tourRelief
  }
}

// =================================================================================================
// THE WALK
// =================================================================================================

/** One of her result rows, KEPT BY THIS BENCH rather than read back off the world. `pruneResults`
 *  holds a rolling window, so last season's rows are gone by the time the next season wraps – and
 *  §2's counterfactual is precisely «what if she had played THAT season again». A copy taken the
 *  week it was scored is the only ledger that survives. */
interface KeptResult {
  week: number
  tier: TierId
  points: number
}

interface SeasonRow {
  season: number
  age: number
  /** COMPETITION WEEKS – one per week she actually walked on court, scoreless first-round exits
   *  included (see the note at the read). `proEvents` is the subset played on a W rung. */
  events: number
  proEvents: number
  /** ⚠ DERIVED FROM THE POINTS BOARD and therefore blind to a scoreless exit, which by definition
   *  won nothing – so this is a true count of wins and NOT of matches. `matchesPlayed` is the count
   *  of matches, read off her own counters. */
  matchesWon: number
  matchesPlayed: number
  /** competition weeks whose rung could not be named – the honesty column for the two reads above */
  eventsUnattributed: number
  entriesByTier: Partial<Record<TierId, number>>
  condMin: number
  condMedian: number
  condMean: number
  weeksUnder50: number
  weeksSubKnee: number
  /** condition at the off-season door (offset 49) and at the last off-season week (offset 51) */
  atOffSeasonDoor: number
  afterOffSeason: number
  vacations: number
  knocks: number
  injuryOnsets: number
  onsetsWeekly: number
  onsetsRetire: number
  weeksInjured: number
  /** what a TOURNAMENT WEEK actually took off the bar – the number he reads off the screen */
  weekSpend: number[]
  weekSpendByTier: Partial<Record<TierId, number[]>>
  /** ⭐ WHAT A WEEK COSTS BY HOW DEEP SHE WENT IN IT – the key to his «~25 за турнир». The drain is
   *  charged PER MATCH, so a first-round exit and a title are two different weeks wearing one name,
   *  and an average over both is a number nobody ever sees on screen. */
  weekSpendByMatches: Record<number, number[]>
  /** what a NON-playing, non-vacation, non-injured week gave back. ⚠ `restGainFree` is the same
   *  number on the weeks the CEILING cannot swallow it (she started below 100 − 12), which is the
   *  only honest read of «what a rest week returns»: at this schedule she spends most weeks near the
   *  top, where a +9 week banks +3 and the clamp, not the dial, is what the average measures. */
  restGain: number[]
  restGainFree: number[]
  /** what a booked FAMILY WEEK gave back – the package on top of the weekly ladder */
  vacationGain: number[]
  vacationWeeks: number
  pointsEarnedWta: number
  rankWta: number
  rankItf: number
  wtaPointsAtWrap: number
  /** where she would have stood at THIS wrap had she re-played the previous season's card, and the
   *  one before that (§2's counterfactual). 0 when there is no such season yet. */
  rankIfPrevRepeated: number
  rankIfTwoBackRepeated: number
  rows: KeptResult[]
  retirementOffers: number
}

interface CareerRow {
  seed: string
  label: string
  seasons: SeasonRow[]
  ending: string | null
  endAge: number
}

/** ⚠ THE STANDING DRAIN RECIPE, verbatim from tools/r44-decline-seats.ts. A career stalls at every
 *  pending decision, and a walk that answers none of them measures a girl who never got out of bed. */
function answerWhateverIsOpen(world: WorldState, row: SeasonRow): void {
  if (world.fork !== null && world.fork.answer === null) {
    drainLifeBeats(world)
    answerFork(world, 'continue')
  }
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
  if (world.retirementOffer !== null) {
    row.retirementOffers += 1
    // «one more year» until the game stops asking – `final: true` is the offer she cannot decline.
    answerRetirement(world, world.retirementOffer.final)
  }
}

/** HOW MANY MATCHES A ROW WON – the inverse of `TIERS[t].points`, which is indexed by finish, so a
 *  row's points value identifies the round she went out in and `log2(drawSize) - finish` is how many
 *  matches she won to get there. tools/two-seasons-read.ts's own derivation; null when the value is
 *  not on that tier's board, which is the only way it can lie. */
function winsOf(tier: TierId, points: number): number | null {
  const i = TIERS[tier].points.indexOf(points)
  if (i < 0) return null
  return Math.log2(TIERS[tier].drawSize) - i
}

function emptySeason(season: number, age: number): SeasonRow {
  return {
    season,
    age,
    events: 0,
    proEvents: 0,
    matchesWon: 0,
    matchesPlayed: 0,
    eventsUnattributed: 0,
    entriesByTier: {},
    condMin: ECONOMY.condition.max,
    condMedian: 0,
    condMean: 0,
    weeksUnder50: 0,
    weeksSubKnee: 0,
    atOffSeasonDoor: 0,
    afterOffSeason: 0,
    vacations: 0,
    knocks: 0,
    injuryOnsets: 0,
    onsetsWeekly: 0,
    onsetsRetire: 0,
    weeksInjured: 0,
    weekSpend: [],
    weekSpendByTier: {},
    weekSpendByMatches: {},
    restGain: [],
    restGainFree: [],
    vacationGain: [],
    vacationWeeks: 0,
    pointsEarnedWta: 0,
    rankWta: 0,
    rankItf: 0,
    wtaPointsAtWrap: 0,
    rankIfPrevRepeated: 0,
    rankIfTwoBackRepeated: 0,
    rows: [],
    retirementOffers: 0,
  }
}

/** WHERE A POINTS TOTAL WOULD PLACE HER on the table she is actually on, at the week the world is
 *  standing on. Competition ranks ("1224"): rank = 1 + how many players sit strictly ahead. Her own
 *  row is dropped first, because the counterfactual replaces it. */
function rankForPoints(world: WorldState, points: number): number {
  const rows = rankingFor(world, 'wta').filter((r) => r.playerId !== KID_ID)
  return 1 + rows.filter((r) => r.points > points).length
}

/** THE COUNTERFACTUAL FOLD – what her professional total would be at this week had the rows she
 *  scored in `donor` been the rows she scored in the twelve months ending here. The donor rows are
 *  shifted forward by whole seasons so they land in the same weeks of today's window, and nothing
 *  that is not hers is touched. Same fold the table itself runs (`windowedBestSum` at the track's
 *  own width and window), so this cannot drift from what the game would have scored. */
function counterfactualPoints(donor: KeptResult[], week: number, seasonsForward: number): number {
  const shifted: SeasonResult[] = donor.map((r) => ({
    playerId: KID_ID,
    week: r.week + seasonsForward * WEEKS_PER_YEAR,
    points: r.points,
    tier: r.tier,
  }))
  return windowedBestSum(shifted, week, KID_ID, BEST_N_BY_TRACK.wta, inTrack('wta'), WINDOW_BY_TRACK.wta)
}

interface WalkOpts {
  toAge: number
  /** hire the masseur at his top rung the week the gate opens ('daily'), or never ('none') */
  masseur: 'daily' | 'none'
  /** ⭐ THE PARENT WHO NEVER TAKES THE RESCUE. `POLICIES[1]` books a family week whenever she falls
   *  below `ECONOMY.practice.rescueCondition` (80) – which is the week the GAME ITSELF offers the
   *  rescue card, so the arm is «a parent who does what the game suggests». `'never'` is the same
   *  parent with that one rule removed and the off-season week kept, and it is the only way to price
   *  what the vacation table is actually carrying. A POLICY arm, not a dial: no constant moves. */
  rescue?: 'as-shipped' | 'never'
}

/** ⚠⚠ A BENCH DEVICE, STATED RATHER THAN HIDDEN – tools/r44-decline-seats.ts's own instrument and its
 *  own sentence. Every arm is held above the same cash floor every week, so the entry policy's
 *  reserve test reads the same in all of them and MONEY IS A NON-FACTOR BY CONSTRUCTION rather than
 *  by hope. Measured without it, both of the first two careers this file ever walked went bankrupt at
 *  16 and never entered a professional event at all – which is not a measurement of a season
 *  equation, it is a measurement of a wallet, and the wallet has its own bench (tools/econ-bench.ts).
 *  ⚠ IT DOES NOT MAKE THE VACATIONS FREE IN THE SENSE THAT MATTERS: `recommendVacationPackage` picks
 *  the CHEAPEST package that restores her to the target, so a rich family still books the small ones
 *  unless she is genuinely run down. What the count measures here is NEED, which is the thing he is
 *  complaining about. */
const SUBSIDY_CENTS = 5_000_000_00

function walkCareer(preset: Preset, index: number, policy: Policy, opts: WalkOpts): CareerRow {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const out: CareerRow = { seed, label: preset.label, seasons: [], ending: null, endAge: 14 }
  const kidRows = () => world.results.filter((r) => r.playerId === KID_ID)
  let lastKnockSince: number | null = null

  for (let s = 0; s <= opts.toAge - 14; s++) {
    const ageNow = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    if (ageNow >= opts.toAge || world.ending !== null) break
    const row = emptySeason(Math.floor(world.week / WEEKS_PER_YEAR), Math.floor(ageNow))
    const conds: number[] = []
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      if (world.ending !== null) break
      world.fundsCents = Math.max(world.fundsCents, SUBSIDY_CENTS)
      // THE MASSEUR, THROUGH THE REAL COMMANDS AND THE REAL GATE (`masseurUnlocked` is her first
      // counting W-series result), so a career that never turns professional never hires one and the
      // bench can never buy a seat the game would refuse.
      if (opts.masseur === 'daily' && !(world.masseurHired ?? false) && masseurUnlocked(world)) {
        try {
          hireMasseur(world, true)
          setMasseurSessions(world, ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions)
          setMasseurTravels(world, true)
        } catch {
          /* the college freeze, or an ended career – she is not hiring this week */
        }
      }
      const condBefore = world.condition
      const injuredBefore = world.injury !== null
      const vacationsBefore = world.vacations.length
      const eidBefore = world.nextEventId
      // ⚠⚠ "DID SHE PLAY THIS WEEK" IS READ OFF HER MATCH COUNTERS, NOT OFF THE RESULTS LEDGER, and
      // the first draft of this file got it wrong in TWO ways at once. `world.results` is PRUNED
      // every tick (`pruneResults`, RESULTS_WINDOW), so a count taken before the step is not an index
      // into the same array afterwards; and `finalizeTournament` only pushes a row `if (points > 0)`,
      // so a first-round exit that pays nothing scores no row at all. The two together hid whole
      // tournament weeks: the mean "rest week" came out NEGATIVE (−1.8) because 21-point drains were
      // being filed as rest. `seasonWins + seasonLosses` is incremented per MATCH, survives pruning,
      // and counts the scoreless exits – which are exactly the weeks a tired player has.
      const playedBefore = world.seasonWins + world.seasonLosses
      // The entry that is about to be played: `tickWeek` increments the week FIRST, so the week this
      // step resolves is `world.week + 1`. Read here because `housekeep` prunes the entry away at the
      // end of the very tick that plays it.
      const entryNext = world.season.find((e) => e.week === world.week + 1 && world.entries.includes(e.id))
      if (condBefore < 50) row.weeksUnder50 += 1
      if (condBefore < ECONOMY.condition.matchStrengthKnee) row.weeksSubKnee += 1

      stepCareerWeek(world, rng, policy)
      answerWhateverIsOpen(world, row)

      // --- what the week did to the body, split by the kind of week it was ----------------------
      const matchesThisWeek = Math.max(0, world.seasonWins + world.seasonLosses - playedBefore)
      const fresh = kidRows().filter((r) => r.week === world.week)
      if (matchesThisWeek > 0) {
        row.weekSpend.push(condBefore - world.condition)
        ;(row.weekSpendByMatches[matchesThisWeek] ??= []).push(condBefore - world.condition)
        row.matchesPlayed += matchesThisWeek
        const tier = (fresh[0]?.tier as TierId | undefined) ?? entryNext?.tier
        if (tier === undefined) {
          row.eventsUnattributed += 1
        } else {
          row.events += 1
          row.entriesByTier[tier] = (row.entriesByTier[tier] ?? 0) + 1
          if (TIERS[tier].track === 'wta') row.proEvents += 1
          ;(row.weekSpendByTier[tier] ??= []).push(condBefore - world.condition)
        }
        for (const r of fresh) {
          const rowTier = r.tier as TierId | undefined
          if (rowTier === undefined) continue
          if (TIERS[rowTier].track === 'wta') row.pointsEarnedWta += r.points
          const wins = winsOf(rowTier, r.points)
          if (wins !== null) row.matchesWon += wins
          row.rows.push({ week: r.week, tier: rowTier, points: r.points })
        }
      } else if (world.injury === null) {
        // ⚠ THE WEEK THE TICK JUST RESOLVED IS `world.week`, not the week we started on: `tickWeek`
        // increments FIRST (world.ts step 0), and `planRecoveryWeek` books `week + 1` – so the family
        // week booked a moment ago is the very week this step resolved.
        if (world.vacations.some((v) => v.week === world.week)) {
          row.vacationWeeks += 1
          row.vacationGain.push(world.condition - condBefore)
        } else {
          row.restGain.push(world.condition - condBefore)
          if (condBefore <= ECONOMY.condition.max - 12) row.restGainFree.push(world.condition - condBefore)
        }
      }
      if (world.vacations.length > vacationsBefore) row.vacations += world.vacations.length - vacationsBefore
      if (world.knock !== null && world.knock.sinceWeek !== lastKnockSince) {
        row.knocks += 1
        lastKnockSince = world.knock.sinceWeek
      }
      if (world.injury !== null) {
        row.weeksInjured += 1
        if (!injuredBefore) {
          row.injuryOnsets += 1
          // WHICH DOOR – tools/injury-landscape.ts's own read: the retirement door's news lines are
          // "She had to stop…" / "She stopped, and this time it is serious…".
          const retired = world.events.some(
            (ev) =>
              ev.id >= eidBefore &&
              ev.type === 'injury' &&
              (ev.text.startsWith('She had to stop') || ev.text.startsWith('She stopped,')),
          )
          if (retired) row.onsetsRetire += 1
          else row.onsetsWeekly += 1
        }
      }
      conds.push(world.condition)
      row.condMin = Math.min(row.condMin, world.condition)
      const offset = world.week % WEEKS_PER_YEAR
      if (offset === SEASON_WRAP_OFFSET) row.atOffSeasonDoor = world.condition
      if (offset === WEEKS_PER_YEAR - 1) row.afterOffSeason = world.condition
    }
    row.condMedian = median(conds)
    row.condMean = mean(conds)
    row.rankWta = world.kidRankWta ?? 0
    row.rankItf = world.kidRank
    row.wtaPointsAtWrap = windowedBestSum(
      world.results,
      world.week,
      KID_ID,
      BEST_N_BY_TRACK.wta,
      inTrack('wta'),
      WINDOW_BY_TRACK.wta,
    )
    // ⚠ THE COUNTERFACTUALS ARE TAKEN HERE, WITH THE WORLD STANDING AT THE WRAP, and they could not
    // be taken afterwards: the field she is folded against is a fact about this week, and her own
    // older rows have been pruned out of `world.results` by now. §2's whole decomposition rests on
    // asking the question at the only moment it can be asked truthfully.
    const prev = out.seasons[out.seasons.length - 1]
    const twoBack = out.seasons[out.seasons.length - 2]
    if (prev !== undefined && prev.rows.length > 0) {
      row.rankIfPrevRepeated = rankForPoints(world, counterfactualPoints(prev.rows, world.week, row.season - prev.season))
    }
    if (twoBack !== undefined && twoBack.rows.length > 0) {
      row.rankIfTwoBackRepeated = rankForPoints(
        world,
        counterfactualPoints(twoBack.rows, world.week, row.season - twoBack.season),
      )
    }
    out.seasons.push(row)
  }
  out.ending = world.ending?.type ?? null
  out.endAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  return out
}

/** One arm: the same seeds, the same presets, the same policy, under one set of dials. */
function runArm(dials: Dials, opts: WalkOpts, presets: Preset[], seeds = SEEDS): CareerRow[] {
  const policy: Policy = opts.rescue === 'never' ? { ...POLICIES[1], rescueBelow: null } : POLICIES[1]
  return withDials(dials, () => {
    const out: CareerRow[] = []
    for (const preset of presets) {
      for (let i = 0; i < seeds; i++) out.push(walkCareer(preset, i, policy, opts))
    }
    return out
  })
}

const DEFAULT_PRESETS = [PRESETS[8], PRESETS[6]] // 120k wealthy elite, 25k middle high

// =================================================================================================
// THE SHAPES – every consecutive pair of her professional seasons, and what the second one's place
// is made of. §2, §3 and §4 all read this one fold, so a cell cannot be scored on a second rule.
// =================================================================================================

/** A BREAKOUT and a COLLAPSE, both defined before the data was looked at, and both out of his own
 *  sentence: «на 56 или 59 месте … закончила на 17 месте … полный провал обратно на 82 месте».
 *  A breakout gains at least `BREAKOUT_MIN_GAIN` places and finishes inside the top
 *  `BREAKOUT_MAX_RANK`; a collapse is the next season losing at least `COLLAPSE_MIN` of them. His
 *  own numbers are a gain of 39-42 into #17 and a fall of 65. */
const BREAKOUT_MIN_GAIN = 15
const BREAKOUT_MAX_RANK = 60
const COLLAPSE_MIN = 20

interface Shape {
  seed: string
  /** the season whose place we are explaining (C), and the one before it (B) */
  ageB: number
  ageC: number
  rankA: number
  rankB: number
  rankC: number
  breakout: boolean
  collapse: boolean
  /** C's place minus B's – positive is a fall */
  fall: number
  /** ⭐ THE TWO TERMS THE FALL IS MADE OF, AND THEY ADD UP TO IT EXACTLY.
   *
   *  `drift` is where she would stand at C's wrap having re-played B's card EXACTLY – the same
   *  results, the same weeks, one year later. Everything in it is the table moving underneath her:
   *  the field's own year, and the window having rolled her old rows out and her new ones in. It is
   *  POINTS DEFENCE priced to the place, and it is the arithmetic every real tour has.
   *
   *  `shortfall` is the rest: she did not re-play the card. That is the only part any body, any
   *  injury or any dial can be responsible for. */
  drift: number
  shortfall: number
  rankIfPrevRepeated: number
  eventsB: number
  eventsC: number
  matchesB: number
  matchesC: number
  /** ⭐ THE PROMOTION COLUMNS. A season that ends inside the top 20 opens the biggest draws in the
   *  game for the season after it – so «she won fewer matches» and «she was worse» are two different
   *  claims, and the rung she was playing on is what tells them apart. `rungB/rungC` is the mean
   *  position on TIER_LADDER of the events she entered; `bigB/bigC` is the share of them that were
   *  1000s or Slams. */
  playedB: number
  playedC: number
  winRateB: number
  winRateC: number
  rungB: number
  rungC: number
  bigB: number
  bigC: number
  pointsB: number
  pointsC: number
  /** points per professional event – the DEPTH half of the points decomposition */
  ppeB: number
  ppeC: number
  condB: number
  condC: number
  under50B: number
  under50C: number
  onsetsB: number
  onsetsC: number
  weeksOutB: number
  weeksOutC: number
  vacationsB: number
  vacationsC: number
  doorB: number
}

/** The mean position on `TIER_LADDER` of the professional events she entered that season – 0 is the
 *  bottom of the whole ladder and the top is a Slam. A season that moves up the ladder meets stronger
 *  fields in bigger draws for the same entry. */
function meanRungOf(s: SeasonRow): number {
  const rungs: number[] = []
  for (const [t, n] of Object.entries(s.entriesByTier)) {
    if (TIERS[t as TierId].track !== 'wta') continue
    for (let i = 0; i < (n as number); i++) rungs.push(TIER_LADDER.indexOf(t as TierId))
  }
  return mean(rungs)
}

/** …and the share of them that were the two biggest draws in the game. */
function bigShareOf(s: SeasonRow): number {
  let big = 0
  let all = 0
  for (const [t, n] of Object.entries(s.entriesByTier)) {
    if (TIERS[t as TierId].track !== 'wta') continue
    all += n as number
    if (t === 'wta1000' || t === 'slam') big += n as number
  }
  return all === 0 ? 0 : big / all
}

function shapesOf(careers: CareerRow[]): Shape[] {
  const out: Shape[] = []
  for (const c of careers) {
    for (let i = 1; i < c.seasons.length; i++) {
      const b = c.seasons[i - 1]
      const d = c.seasons[i]
      if (b.proEvents === 0 || d.proEvents === 0) continue
      const a = c.seasons[i - 2]
      const rankA = a?.rankWta ?? 0
      out.push({
        seed: c.seed,
        ageB: b.age,
        ageC: d.age,
        rankA,
        rankB: b.rankWta,
        rankC: d.rankWta,
        breakout: a !== undefined && a.proEvents > 0 && rankA - b.rankWta >= BREAKOUT_MIN_GAIN && b.rankWta <= BREAKOUT_MAX_RANK,
        collapse: d.rankWta - b.rankWta >= COLLAPSE_MIN,
        fall: d.rankWta - b.rankWta,
        drift: d.rankIfPrevRepeated - b.rankWta,
        shortfall: d.rankWta - d.rankIfPrevRepeated,
        rankIfPrevRepeated: d.rankIfPrevRepeated,
        eventsB: b.proEvents,
        eventsC: d.proEvents,
        matchesB: b.matchesWon,
        matchesC: d.matchesWon,
        playedB: b.matchesPlayed,
        playedC: d.matchesPlayed,
        winRateB: b.matchesPlayed > 0 ? b.matchesWon / b.matchesPlayed : 0,
        winRateC: d.matchesPlayed > 0 ? d.matchesWon / d.matchesPlayed : 0,
        rungB: meanRungOf(b),
        rungC: meanRungOf(d),
        bigB: bigShareOf(b),
        bigC: bigShareOf(d),
        pointsB: b.pointsEarnedWta,
        pointsC: d.pointsEarnedWta,
        ppeB: b.pointsEarnedWta / Math.max(1, b.proEvents),
        ppeC: d.pointsEarnedWta / Math.max(1, d.proEvents),
        condB: b.condMedian,
        condC: d.condMedian,
        under50B: b.weeksUnder50,
        under50C: d.weeksUnder50,
        onsetsB: b.injuryOnsets,
        onsetsC: d.injuryOnsets,
        weeksOutB: b.weeksInjured,
        weeksOutC: d.weeksInjured,
        vacationsB: b.vacations,
        vacationsC: d.vacations,
        doorB: b.atOffSeasonDoor,
      })
    }
  }
  return out
}

// =================================================================================================
// HEADLINE FIGURES – one fold, used by §3 and §4 alike so the cells cannot be read on two rules
// =================================================================================================

interface Headline {
  /** professional seasons folded */
  n: number
  door: number
  vacations: number
  /** ⭐⭐ THE NEW BAR IS FREQUENCY, SO THE MEAN IS THE WRONG INSTRUMENT ON ITS OWN. «Отпуска реже»
   *  is about how often the decision is FORCED, and a mean of 4 can be every season at 4 or half the
   *  seasons at 8. `vacMedian` and the three shares below are the distribution he is actually asking
   *  about; `vacNever` is the OTHER EDGE – the share of seasons whose only family week is the
   *  off-season one the policy books unconditionally, i.e. seasons in which the holiday stopped
   *  being a decision at all. His complaint is that it is compulsory, not that it should be free. */
  vacMedian: number
  vacLo: number
  vacMid: number
  vacHi: number
  vacNever: number
  injuryPrevalence: number
  onsets: number
  knocks: number
  condMedian: number
  /** the mean over seasons of each season's WORST week – the column that catches a cell buying
   *  holidays by letting her bottom out instead */
  condMin: number
  weeksUnder50: number
  events: number
  /** matches per professional event – §5's «mean depth», the axis arm A is bending */
  depth: number
  matchesPlayed: number
  matchesWon: number
  eventSpend: number
  restGain: number
  restGainFree: number
  /** how often a breakout season is followed by a collapse, and how big those falls are */
  breakouts: number
  collapsesAfterBreakout: number
  collapseRate: number
  fall: number
  rankBest: number
}

function headlineOf(careers: CareerRow[]): Headline {
  const pro = careers.flatMap((c) => c.seasons.filter((s) => s.proEvents > 0))
  const shapes = shapesOf(careers)
  const breakouts = shapes.filter((s) => s.breakout)
  const best = careers.map((c) => Math.min(...c.seasons.filter((s) => s.proEvents > 0).map((s) => s.rankWta), 9999))
  return {
    n: pro.length,
    door: mean(pro.map((s) => s.atOffSeasonDoor)),
    vacations: mean(pro.map((s) => s.vacations)),
    vacMedian: median(pro.map((s) => s.vacations)),
    vacLo: (100 * pro.filter((s) => s.vacations <= 2).length) / Math.max(1, pro.length),
    vacMid: (100 * pro.filter((s) => s.vacations >= 3 && s.vacations <= 4).length) / Math.max(1, pro.length),
    vacHi: (100 * pro.filter((s) => s.vacations >= 5).length) / Math.max(1, pro.length),
    vacNever: (100 * pro.filter((s) => s.vacations <= 1).length) / Math.max(1, pro.length),
    injuryPrevalence: (100 * pro.filter((s) => s.injuryOnsets > 0).length) / Math.max(1, pro.length),
    onsets: mean(pro.map((s) => s.injuryOnsets)),
    knocks: mean(pro.map((s) => s.knocks)),
    condMedian: mean(pro.map((s) => s.condMedian)),
    condMin: mean(pro.map((s) => s.condMin)),
    weeksUnder50: mean(pro.map((s) => s.weeksUnder50)),
    events: mean(pro.map((s) => s.proEvents)),
    depth: mean(pro.filter((s) => s.events > 0).map((s) => s.matchesPlayed / s.events)),
    matchesPlayed: mean(pro.map((s) => s.matchesPlayed)),
    matchesWon: mean(pro.map((s) => s.matchesWon)),
    eventSpend: mean(pro.flatMap((s) => s.weekSpend)),
    restGain: mean(pro.flatMap((s) => s.restGain)),
    restGainFree: mean(pro.flatMap((s) => s.restGainFree)),
    breakouts: breakouts.length,
    collapsesAfterBreakout: breakouts.filter((s) => s.collapse).length,
    collapseRate: (100 * breakouts.filter((s) => s.collapse).length) / Math.max(1, breakouts.length),
    fall: mean(breakouts.map((s) => s.fall)),
    rankBest: median(best.filter((r) => r < 9999)),
  }
}

// =================================================================================================
// §1 THE TRAJECTORY
// =================================================================================================

function trajectory(careers: CareerRow[]): void {
  console.log(rule())
  console.log('§1 THE TRAJECTORY, SEASON BY SEASON – the body, the calendar, the damage, the place')
  console.log(rule())
  console.log('')
  console.log('  age  events  pro  matches  depth   cond med  min  wk<50  wk<knee  vac  knock  inj wk/ret  door49  WTA rank  n')
  const bySeason = new Map<number, SeasonRow[]>()
  for (const c of careers) {
    for (const s of c.seasons) {
      const list = bySeason.get(s.age) ?? []
      list.push(s)
      bySeason.set(s.age, list)
    }
  }
  for (const age of [...bySeason.keys()].sort((a, b) => a - b)) {
    const rows = bySeason.get(age)!
    const g = (pick: (r: SeasonRow) => number) => mean(rows.map(pick))
    const ranked = rows.filter((r) => r.proEvents > 0)
    console.log(
      `  ${padL(age, 3)}  ${padL(f1(g((r) => r.events)), 6)}  ${padL(f1(g((r) => r.proEvents)), 3)}` +
        `  ${padL(f1(g((r) => r.matchesPlayed)), 7)}  ${padL(f2(g((r) => (r.events > 0 ? r.matchesPlayed / r.events : 0))), 5)}` +
        `  ${padL(f0(g((r) => r.condMedian)), 8)}  ${padL(f0(g((r) => r.condMin)), 3)}` +
        `  ${padL(f1(g((r) => r.weeksUnder50)), 5)}  ${padL(f1(g((r) => r.weeksSubKnee)), 7)}` +
        `  ${padL(f1(g((r) => r.vacations)), 3)}  ${padL(f1(g((r) => r.knocks)), 5)}` +
        `  ${padL(f2(g((r) => r.onsetsWeekly)), 5)}/${padL(f2(g((r) => r.onsetsRetire)), 4)}` +
        `  ${padL(f0(g((r) => r.atOffSeasonDoor)), 6)}` +
        `  ${padL(ranked.length > 0 ? f0(mean(ranked.map((r) => r.rankWta))) : '-', 8)}  ${padL(rows.length, 2)}`,
    )
  }

  // --- HIS TWO NUMBERS, MEASURED ---------------------------------------------------------------
  const pro = careers.flatMap((c) => c.seasons.filter((s) => s.proEvents > 0))
  const spend = pro.flatMap((s) => s.weekSpend)
  const gains = pro.flatMap((s) => s.restGain)
  const free = pro.flatMap((s) => s.restGainFree)
  const vac = pro.flatMap((s) => s.vacationGain)
  const sorted = [...spend].sort((a, b) => a - b)
  console.log('')
  console.log('  HIS TWO NUMBERS, MEASURED ON THE SAME WALK (professional seasons only)')
  console.log(
    `    a TOURNAMENT WEEK takes off the bar   mean ${padL(f1(mean(spend)), 5)}  median ${padL(f1(median(spend)), 5)}` +
      `  p75 ${padL(f1(sorted[Math.floor(sorted.length * 0.75)] ?? 0), 5)}  p90 ${padL(
        f1(sorted[Math.floor(sorted.length * 0.9)] ?? 0),
        5,
      )}  max ${padL(f1(sorted[sorted.length - 1] ?? 0), 5)}   (he reads ~25, 33-34 at a Slam)`,
  )
  console.log(
    `    a NON-PLAYING week gives back         mean ${padL(f1(mean(gains)), 5)}  median ${padL(f1(median(gains)), 5)}` +
      `   …and ${padL(f1(mean(free)), 5)} on the weeks the CEILING cannot swallow it  (he reads 9-10)`,
  )
  console.log(
    `    a booked FAMILY WEEK gives back       mean ${padL(f1(mean(vac)), 5)}  median ${padL(f1(median(vac)), 5)}` +
      `   over ${vac.length} of them – the package ON TOP of the weekly ladder`,
  )
  const seasonGiven = mean(pro.map((s) => s.restGain.reduce((a, b) => a + b, 0)))
  const seasonVac = mean(pro.map((s) => s.vacationGain.reduce((a, b) => a + b, 0)))
  const seasonSpent = mean(pro.map((s) => s.weekSpend.reduce((a, b) => a + b, 0)))
  console.log(
    `    OVER A WHOLE SEASON: tennis takes ${padL(f0(seasonSpent), 5)} · ordinary weeks give back ` +
      `${padL(f0(seasonGiven), 5)} · family weeks give back ${padL(f0(seasonVac), 5)}` +
      `  = the family weeks are ${f0((100 * seasonVac) / Math.max(1, seasonVac + seasonGiven))}% of all the recovery she gets`,
  )
  const byTier = new Map<TierId, number[]>()
  for (const s of pro) {
    for (const [t, xs] of Object.entries(s.weekSpendByTier)) {
      byTier.set(t as TierId, [...(byTier.get(t as TierId) ?? []), ...(xs as number[])])
    }
  }
  const tierLine = [...byTier.entries()]
    .filter(([t]) => TIERS[t].track === 'wta')
    .sort((a, b) => TIER_LADDER.indexOf(a[0]) - TIER_LADDER.indexOf(b[0]))
    .map(([t, xs]) => `${t} ${f1(mean(xs))}`)
  console.log(`    by rung: ${tierLine.join(' · ')}`)
  // ⭐ AND THE SAME NUMBER BY DEPTH, which is the whole of his question: the drain is charged PER
  // MATCH, so «what a tournament costs» is not one number and the mean is a number nobody sees.
  const byDepth = new Map<number, number[]>()
  for (const s of pro) {
    for (const [n, xs] of Object.entries(s.weekSpendByMatches)) {
      byDepth.set(Number(n), [...(byDepth.get(Number(n)) ?? []), ...(xs as number[])])
    }
  }
  console.log(
    `    by DEPTH: ${[...byDepth.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([n, xs]) => `${n}m ${f1(mean(xs))} (${xs.length})`)
      .join(' · ')}`,
  )
  const unattributed = pro.reduce((a, s) => a + s.eventsUnattributed, 0)
  const events = pro.reduce((a, s) => a + s.events, 0)
  console.log(
    `    (${unattributed} of ${events + unattributed} competition weeks could not be filed under a rung – ` +
      `${f1((100 * unattributed) / Math.max(1, events + unattributed))}%; they are counted in the weeks above and` +
      ` left out of the per-rung line)`,
  )
  console.log('')
  // --- THE SHAPE, CAREER BY CAREER -------------------------------------------------------------
  // The table above is a mean, and a mean is exactly the wrong instrument for the thing he saw: his
  // complaint is about ONE career's zig-zag, which an average over careers flattens away. So every
  // career's own professional ranks are printed in a row, age by age.
  console.log('')
  console.log('  HER PLACE, CAREER BY CAREER (professional table, at each season\'s wrap · "-" = no professional season)')
  const ages = [...new Set(careers.flatMap((c) => c.seasons.map((s) => s.age)))].sort((a, b) => a - b)
  console.log(`  ${padR('seed', 22)} ${ages.map((a) => padL(a, 5)).join('')}`)
  for (const c of careers) {
    const cells = ages.map((a) => {
      const s = c.seasons.find((x) => x.age === a)
      return padL(s === undefined || s.proEvents === 0 ? '-' : s.rankWta, 5)
    })
    console.log(`  ${padR(c.seed, 22)} ${cells.join('')}`)
  }
  console.log('')
  const endings = new Map<string, number>()
  for (const c of careers) endings.set(c.ending ?? 'still playing', (endings.get(c.ending ?? 'still playing') ?? 0) + 1)
  console.log(
    `  careers ${careers.length}, walked to ${f1(mean(careers.map((c) => c.endAge)))} on average · endings: ` +
      [...endings.entries()].map(([k, v]) => `${k} ${v}`).join(' · '),
  )
}

// =================================================================================================
// §2 THE ATTRIBUTION
// =================================================================================================

function attribution(base: CareerRow[]): void {
  console.log('')
  console.log(rule())
  console.log('§2 THE ATTRIBUTION – what the fall after a breakout is actually made of')
  console.log(rule())
  const shapes = shapesOf(base)
  const breakouts = shapes.filter((s) => s.breakout)
  if (breakouts.length === 0) {
    console.log('  no breakout season in this arm – nothing to attribute (widen --seeds or --toAge)')
    return
  }
  const collapses = breakouts.filter((s) => s.collapse)
  console.log('')
  console.log(
    `  ${shapes.length} consecutive professional season pairs · ${breakouts.length} of them follow a BREAKOUT` +
      ` (>= ${BREAKOUT_MIN_GAIN} places gained into the top ${BREAKOUT_MAX_RANK})`,
  )
  console.log(
    `  ${collapses.length} of those ${breakouts.length} then COLLAPSE (>= ${COLLAPSE_MIN} places lost) = ` +
      `${f0((100 * collapses.length) / breakouts.length)}% – his shape's own frequency`,
  )
  console.log('')
  console.log('  HIS SHAPE, CAREER BY CAREER (the breakout seasons, and what happened next)')
  console.log('  seed                    ageB  before  breakout  after   fall   if-repeated   drift  shortfall   ev B->C  pts B->C')
  for (const s of breakouts.slice(0, 30)) {
    console.log(
      `  ${padR(s.seed, 22)}  ${padL(s.ageB, 4)}  ${padL(s.rankA, 6)}  ${padL(s.rankB, 8)}  ${padL(s.rankC, 5)}` +
        `  ${padL(s.fall, 5)}  ${padL(s.rankIfPrevRepeated, 11)}  ${padL(s.drift, 6)}  ${padL(s.shortfall, 9)}` +
        `  ${padL(s.eventsB, 3)}->${padL(s.eventsC, 3)}  ${padL(f0(s.pointsB), 5)}->${padL(f0(s.pointsC), 5)}`,
    )
  }
  if (breakouts.length > 30) console.log(`  … and ${breakouts.length - 30} more`)

  const split = (list: Shape[], label: string) => {
    if (list.length === 0) return
    const falls = list.map((s) => s.fall)
    const drift = list.map((s) => s.drift)
    const short = list.map((s) => s.shortfall)
    console.log('')
    console.log(`  ${label} (n=${list.length})`)
    console.log(
      `    the fall, in places                 ${padL(f1(mean(falls)), 7)} ± ${f1(sem(falls))}   (median ${f1(median(falls))})`,
    )
    // ⚠ THE SHARE IS PRINTED ONLY WHEN THERE IS A FALL TO TAKE A SHARE OF. A set of season pairs
    // whose mean fall is ~0 (or negative – she improved) has no denominator, and dividing by it
    // produces the 505000% this line printed on its first run.
    const share = (x: number) => (mean(falls) >= 5 ? `= ${padL(f0((100 * x) / mean(falls)), 3)}%` : '  (n/a)')
    console.log(
      `    …(b) POINTS DEFENCE – the drift     ${padL(f1(mean(drift)), 7)} ± ${f1(sem(drift))}   ${share(
        mean(drift),
      )}  she re-plays last year's card EXACTLY and still lands here`,
    )
    console.log(
      `    …everything else – the shortfall    ${padL(f1(mean(short)), 7)} ± ${f1(sem(short))}   ${share(
        mean(short),
      )}  she did not re-play the card`,
    )
    // THE SHORTFALL IN POINTS, SPLIT INTO ITS TWO FACTORS – exact and additive:
    //   ΔP = (events_C − events_B) x ppe_B   [VOLUME: she entered fewer]
    //      + events_C x (ppe_C − ppe_B)      [YIELD: each one paid less]
    const volume = mean(list.map((s) => (s.eventsC - s.eventsB) * s.ppeB))
    const yield_ = mean(list.map((s) => s.eventsC * (s.ppeC - s.ppeB)))
    const dP = mean(list.map((s) => s.pointsC - s.pointsB))
    console.log(
      `    …and the points behind it           ${padL(f0(dP), 7)}     = volume ${f0(volume)} (events ` +
        `${f1(mean(list.map((s) => s.eventsB)))} -> ${f1(mean(list.map((s) => s.eventsC)))})` +
        ` + yield ${f0(yield_)} (points per event ${f0(mean(list.map((s) => s.ppeB)))} -> ${f0(mean(list.map((s) => s.ppeC)))})`,
    )
    const p = (pick: (s: Shape) => number, q: (s: Shape) => number, lab: string, d = 1) =>
      console.log(
        `    ${padR(lab, 34)}${padL(mean(list.map(pick)).toFixed(d), 6)} -> ${padL(mean(list.map(q)).toFixed(d), 6)}` +
          `   (${mean(list.map(q)) - mean(list.map(pick)) >= 0 ? '+' : ''}${(mean(list.map(q)) - mean(list.map(pick))).toFixed(d)})`,
      )
    p((s) => s.condB, (s) => s.condC, '(a) median condition', 0)
    p((s) => s.under50B, (s) => s.under50C, '(a) weeks under 50')
    p((s) => s.vacationsB, (s) => s.vacationsC, '(a) family weeks booked')
    p((s) => s.onsetsB, (s) => s.onsetsC, '(d) injury onsets', 2)
    p((s) => s.weeksOutB, (s) => s.weeksOutC, '(d) weeks out injured')
    p((s) => s.matchesB, (s) => s.matchesC, '    matches won')
    p((s) => s.playedB, (s) => s.playedC, '    matches played')
    p((s) => s.winRateB, (s) => s.winRateC, '    win rate', 3)
    p((s) => s.rungB, (s) => s.rungC, '    mean rung entered (TIER_LADDER)', 2)
    p((s) => s.bigB, (s) => s.bigC, '    share of entries at a 1000 or a Slam', 2)
  }
  split(breakouts, 'THE SPLIT over every breakout season')
  split(collapses, 'THE SPLIT over the ones that actually collapsed – his case')
  // ⭐ AND THE SAME QUESTION ASKED OF A BIGGER SAMPLE. A collapse after a BREAKOUT is his exact
  // sequence and it is rare, so the three-case row above cannot carry an attribution on its own.
  // Every fall of the same size out of a top-60 season is the same phenomenon with the breakout
  // condition dropped – ten times the cases, and if the two rows say the same thing, the small one
  // is not a fluke.
  split(
    shapes.filter((s) => s.collapse && s.rankB <= BREAKOUT_MAX_RANK),
    `EVERY fall of >= ${COLLAPSE_MIN} places out of a top-${BREAKOUT_MAX_RANK} season, breakout or not`,
  )
  split(
    shapes.filter((s) => !s.breakout),
    'THE SAME SPLIT over ordinary (non-breakout) season pairs, for contrast',
  )

  console.log('')
  console.log(
    `  (c) AGE: the breakout seasons above run ${Math.min(...breakouts.map((s) => s.ageB))}-${Math.max(
      ...breakouts.map((s) => s.ageB),
    )} and \`declineStart\` is ${ECONOMY.development.ageCurve.declineStart}+ – ` +
      `${breakouts.filter((s) => s.ageC >= ECONOMY.development.ageCurve.declineStart).length} of ${breakouts.length}` +
      ` collapse seasons are inside the decline at all.`,
  )
  console.log('      Age is a NULL ARM here BY CONSTRUCTION, and that is a bound rather than a measurement.')
  const offers = base.reduce((a, c) => a + c.seasons.reduce((x, s) => x + s.retirementOffers, 0), 0)
  const endings = [...new Set(base.map((c) => c.ending ?? 'still playing'))]
    .map((k) => `${k} ${base.filter((c) => (c.ending ?? 'still playing') === k).length}`)
    .join(' · ')
  console.log(
    `  (e) THE RETIREMENT DOORS: ${offers} offers raised across ${base.length} careers walked to a mean age of ` +
      `${f1(mean(base.map((c) => c.endAge)))} · endings: ${endings}`,
  )
}

/** THE ABLATION ARMS. Each is this tree with ONE mechanism switched off in place and restored after,
 *  so what moves between an arm and the control is that mechanism and nothing else. */
function ablations(base: CareerRow[], opts: WalkOpts, presets: Preset[]): void {
  console.log('')
  console.log(rule())
  console.log('§2b THE ABLATION ARMS – each parent of the fall, switched off in place')
  console.log(rule())
  console.log('')
  const arms: { label: string; dials: Dials; opts?: WalkOpts }[] = [
    { label: 'control (shipped)', dials: SHIPPED },
    { label: 'FATIGUE OFF (no drain at all)', dials: { ...SHIPPED, noDrain: true } },
    { label: 'INJURIES OFF (weekly roll)', dials: { ...SHIPPED, noInjury: true } },
    { label: 'BOTH OFF', dials: { ...SHIPPED, noDrain: true, noInjury: true } },
    // ⭐ NOT A DIAL BUT A DECISION, and it is the one that prices the vacation table: the same
    // parent with the rescue booking removed. The off-season family week stays – his own design has
    // one – so what this arm subtracts is exactly the MID-SEASON rescue he is complaining about
    // taking «1-2 раза в месяц».
    { label: 'NO MID-SEASON RESCUE (policy)', dials: SHIPPED, opts: { ...opts, rescue: 'never' } },
  ]
  console.log(
    '  arm                             breakouts  collapse%   fall   drift  shortfall   cond med  wk<50  onsets  vac  events  best',
  )
  for (const arm of arms) {
    const careers = arm.label.startsWith('control') ? base : runArm(arm.dials, arm.opts ?? opts, presets)
    const b = shapesOf(careers).filter((s) => s.breakout)
    const h = headlineOf(careers)
    console.log(
      `  ${padR(arm.label, 31)} ${padL(b.length, 8)}  ${padL(f0(h.collapseRate) + '%', 8)}` +
        `  ${padL(f1(mean(b.map((x) => x.fall))), 6)}  ${padL(f1(mean(b.map((x) => x.drift))), 6)}` +
        `  ${padL(f1(mean(b.map((x) => x.shortfall))), 8)}  ${padL(f0(h.condMedian), 9)}  ${padL(f1(h.weeksUnder50), 5)}` +
        `  ${padL(f2(h.onsets), 6)}  ${padL(f1(h.vacations), 4)}  ${padL(f1(h.events), 6)}  ${padL(f0(h.rankBest), 4)}`,
    )
  }
}

// =================================================================================================
// §3 THE GRID
// =================================================================================================

function grid(opts: WalkOpts, presets: Preset[]): void {
  console.log(rule())
  console.log('§3 THE TWO DIALS AS A GRID – per-match tier surcharge x proPhaseRecoveryBase')
  console.log(rule())
  console.log('')
  console.log(
    `  shipped: surcharge delta 0 (w15-w50 ${ECONOMY.condition.tierMatchFatigue.w15}, wta250/500 ` +
      `${ECONOMY.condition.tierMatchFatigue.wta250}, 1000/slam ${ECONOMY.condition.tierMatchFatigue.slam}) x ` +
      `proPhaseRecoveryBase ${ECONOMY.condition.proPhaseRecoveryBase}. Every cell is THIS tree with the dial ` +
      `patched in place and restored after.`,
  )
  console.log('')
  console.log(
    '  surcharge  proRec   door49  vac/seas  inj prev  onsets  knocks  cond med  wk<50  events  spend  breakouts collapse%  fall  best',
  )
  for (const surchargeDelta of [-1, 0, 1]) {
    for (const proRecovery of [4, 5, 7]) {
      const careers = runArm({ surchargeDelta, proRecovery }, opts, presets)
      const h = headlineOf(careers)
      const control = surchargeDelta === 0 && proRecovery === ECONOMY.condition.proPhaseRecoveryBase
      console.log(
        `  ${padL(surchargeDelta >= 0 ? `+${surchargeDelta}` : surchargeDelta, 9)}  ${padL(proRecovery, 6)}` +
          `  ${padL(f0(h.door), 6)}  ${padL(f1(h.vacations), 8)}  ${padL(f0(h.injuryPrevalence) + '%', 8)}` +
          `  ${padL(f2(h.onsets), 6)}  ${padL(f1(h.knocks), 6)}  ${padL(f0(h.condMedian), 8)}` +
          `  ${padL(f1(h.weeksUnder50), 5)}  ${padL(f1(h.events), 6)}  ${padL(f1(h.eventSpend), 5)}` +
          `  ${padL(h.breakouts, 9)}  ${padL(f0(h.collapseRate) + '%', 8)}` +
          `  ${padL(f1(h.fall), 5)}  ${padL(f0(h.rankBest), 4)}${control ? '   <- SHIPPED' : ''}`,
      )
    }
  }
}

// =================================================================================================
// §4 THE STAFFED / UNSTAFFED SPLIT
// =================================================================================================

function staffing(presets: Preset[]): void {
  console.log(rule())
  console.log('§4 THE MASSEUR\'S PREMISE – the 22.08 drop 8 -> 5 was made so he would have something to add')
  console.log(rule())
  console.log('')
  console.log(
    `  his top rung is ${ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].label} at +` +
      `${ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].conditionBonusPerWeek} a week, and it is paid on` +
      ` weeks she does NOT play (world/medical.ts accrueCondition).`,
  )
  console.log('')
  console.log('  arm                     door49   vac/seas  inj prev  onsets  cond med  wk<50   rest gain  events  matchW  best')
  for (const masseur of ['daily', 'none'] as const) {
    const careers = runArm(SHIPPED, { toAge: TO_AGE, masseur }, presets)
    const h = headlineOf(careers)
    console.log(
      `  ${padR(masseur === 'daily' ? 'masseur DAILY' : 'masseur ABSENT', 22)}  ${padL(f0(h.door), 6)}` +
        `  ${padL(f1(h.vacations), 8)}  ${padL(f0(h.injuryPrevalence) + '%', 8)}  ${padL(f2(h.onsets), 6)}` +
        `  ${padL(f0(h.condMedian), 8)}  ${padL(f1(h.weeksUnder50), 5)}  ${padL(f1(h.restGain), 9)}` +
        `  ${padL(f1(h.events), 6)}  ${padL(f1(h.matchesWon), 6)}  ${padL(f0(h.rankBest), 4)}`,
    )
  }
  console.log('')
  console.log('  …and the same two arms with the pro base back at the junior 8, which is what the masseur was')
  console.log('  asked to replace:')
  for (const masseur of ['daily', 'none'] as const) {
    const careers = runArm({ surchargeDelta: 0, proRecovery: 8 }, { toAge: TO_AGE, masseur }, presets)
    const h = headlineOf(careers)
    console.log(
      `  ${padR(`base 8, masseur ${masseur === 'daily' ? 'DAILY' : 'ABSENT'}`, 22)}  ${padL(f0(h.door), 6)}` +
        `  ${padL(f1(h.vacations), 8)}  ${padL(f0(h.injuryPrevalence) + '%', 8)}  ${padL(f2(h.onsets), 6)}` +
        `  ${padL(f0(h.condMedian), 8)}  ${padL(f1(h.weeksUnder50), 5)}  ${padL(f1(h.restGain), 9)}` +
        `  ${padL(f1(h.events), 6)}  ${padL(f1(h.matchesWon), 6)}  ${padL(f0(h.rankBest), 4)}`,
    )
  }
}

// =================================================================================================
// §5 THE 19.09 RULING, PRICED – the four families of lever the owner named, against his own target
// =================================================================================================

/** The professional rungs of ONE ladder family: the twelve 32-draws run on `runFatigueLadderWta`,
 *  the two bigger draws on `runFatigueLadderDeep` (engine/condition.ts `ladderFor`). Derived from
 *  the catalogue rather than listed, so a new rung joins the right family by construction. */
const famRungs = (deep: boolean): TierId[] =>
  TIER_LADDER.filter((t) => TIERS[t].track === 'wta' && TIERS[t].drawSize > 32 === deep)
/** How many matches the family's biggest draw holds – log2(drawSize): 5 for a 32, 7 for a Slam. */
const famLongest = (deep: boolean): number => Math.max(...famRungs(deep).map((t) => Math.log2(TIERS[t].drawSize)))
/** The family's CHEAPEST per-match surcharge, which is how far a discount may go (see below). */
const famFloor = (deep: boolean): number => Math.min(...famRungs(deep).map((t) => ECONOMY.condition.tierMatchFatigue[t]))

/** ⭐⭐ ARM A – THE CONCAVE DEPTH CURVE, AND IT IS ONE LINE OF ARITHMETIC:
 *
 *      ladder[i] = shipped[i] − floor(k · max(0, i − plateau)),   floored at −(the family's
 *                                                                 cheapest per-match surcharge)
 *
 *  `plateau` is the index at which the SHIPPED ladder first reaches its final value (1 for the W
 *  family's [0,1,1,1,1], 2 for the deep draws' [-2,-1,0]), so EVERY ARM LEAVES THE OWNER'S OWN
 *  RAMP-IN EXACTLY WHERE HE PUT IT on 14.08 – «min 5 6 7 7 7 7 7» – and bends only the tail after
 *  it. What changes is that the plateau stops being a plateau and starts coming down: the fifth and
 *  sixth match of one event cost less than the third.
 *
 *  ⚠⚠ THE FLOOR IS WHAT MAKES THE TOTAL MONOTONE, AND THE TOTAL BEING MONOTONE IS NON-NEGOTIABLE:
 *  winning one more match may never make the WEEK cheaper outright. Floored at the family's cheapest
 *  surcharge, the discount can at most give back the tier's own travel tax and never touches the
 *  scoreline – so the marginal match still costs at least `matchFatigue.straightSets` (2) and the
 *  running total is strictly increasing in depth. `monotoneWitness` below PROVES it per cell rather
 *  than trusting this paragraph.
 *
 *  ⚠ INTEGER BY CONSTRUCTION (`Math.floor` on the decay): the condition accumulator is integer
 *  arithmetic end to end – the `tierMatchFatigue` block note's own rule – so k = 0.5 means «one
 *  point every second match», not a fractional charge. */
function concaveLadder(shipped: number[], k: number, deep: boolean): number[] {
  const plateau = shipped.indexOf(shipped[shipped.length - 1])
  const floor = famFloor(deep)
  const out: number[] = []
  for (let i = 0; i < famLongest(deep); i++) {
    const base = shipped[Math.min(i, shipped.length - 1)]
    out.push(Math.max(-floor, base - Math.floor(k * Math.max(0, i - plateau))))
  }
  return out
}

const shapeA = (k: number): Dials => ({
  surchargeDelta: 0,
  proRecovery: null,
  ladderWta: concaveLadder(ECONOMY.condition.runFatigueLadderWta, k, false),
  ladderDeep: concaveLadder(ECONOMY.condition.runFatigueLadderDeep, k, true),
})

const SIMPLE_SCORE = '6-3 6-4'

/** ⚠⚠ THE PROOF THAT A DEEP RUN NEVER COSTS LESS IN TOTAL THAN A SHALLOW ONE. Walks the whole-run
 *  cost by depth on the family's cheapest rung and its dearest, under the dials in force, and returns
 *  the smallest MARGINAL match anywhere in it. A cell whose witness is <= 0 is not a softer tail, it
 *  is an inverted one, and it must not be read as a result. */
function monotoneWitness(): { worst: number; lines: string[] } {
  let worst = Infinity
  const lines: string[] = []
  for (const deep of [false, true]) {
    const rungs = famRungs(deep)
    for (const t of [rungs[0], rungs[rungs.length - 1]]) {
      const depths = Array.from({ length: Math.log2(TIERS[t].drawSize) }, (_, i) => i + 1)
      const totals = depths.map((n) => tournamentRunStrain(t, new Array(n).fill({ score: SIMPLE_SCORE })))
      for (let i = 0; i < totals.length; i++) worst = Math.min(worst, totals[i] - (i === 0 ? 0 : totals[i - 1]))
      lines.push(`${padR(t, 8)} ${totals.map((x) => padL(x, 4)).join('')}`)
    }
  }
  return { worst, lines }
}

function levers(opts: WalkOpts, presets: Preset[]): void {
  console.log(rule(140))
  console.log('§5 THE 19.09 RULING, PRICED – FOUR LEVERS, IN HIS OWN LIST: «слив на глубине хода и турнирная работа')
  console.log('   массажиста, а также обычная работа массажиста и естественное восстановление»')
  console.log(rule(140))
  console.log('')
  console.log('  ⚠⚠ THE BAR CHANGED ON 19.09 AND IT IS NOT THE ONE §1-§9 WERE SCORED AGAINST.')
  console.log('     He RELEASED his own «arrive at the off-season door around 45-50» sentence – the design clause')
  console.log('     ECONOMY.condition quotes as its authority – in as many words: «давай изменим эту цель, если она')
  console.log('     нам мешает. Цель – отпуска реже, а не после каждого турнира ездить всё-таки.»')
  console.log('')
  console.log('     So the bar is HOLIDAY FREQUENCY and nothing else, and `door49` below is REPORTED, NOT CONSTRAINED:')
  console.log('     a low arrival is the very thing that forces the holidays, and a cell that arrives at 70 having taken')
  console.log('     two of them is a BETTER answer under the new bar, not a worse one. §3 measured 8 a season.')
  console.log('')
  console.log('  ⚠ AND THE OTHER EDGE IS A FAILURE TOO. `never` is the share of seasons whose ONLY family week is the')
  console.log('     off-season one the policy books unconditionally – seasons where the holiday stopped being a decision.')
  console.log('     His complaint is that it is COMPULSORY, not that it should be free.')
  console.log('')

  // --- THE SHAPES, WRITTEN OUT AND PROVED MONOTONE BEFORE A SINGLE CAREER IS WALKED ---------------
  console.log('  ARM A – THE CONCAVE DEPTH CURVE. ladder[i] = shipped[i] − floor(k·max(0, i − plateau)), floored at')
  console.log('  −(the family\'s cheapest surcharge). The ramp-IN is the owner\'s own 14.08 curve, untouched; the TAIL bends.')
  console.log('')
  console.log('  k       W family (32 draws, 5 matches)   deep draws (1000 / Slam, up to 7)   whole-run cost by depth, simple sets')
  for (const k of [0, 0.5, 1, 2, 4]) {
    const d = k === 0 ? SHIPPED : shapeA(k)
    withDials(d, () => {
      const w = monotoneWitness()
      console.log(
        `  ${padR(k === 0 ? 'shipped' : `k=${k}`, 6)}  ${padR(`[${(d.ladderWta ?? ECONOMY.condition.runFatigueLadderWta).join(',')}]`, 30)}` +
          `  ${padR(`[${(d.ladderDeep ?? ECONOMY.condition.runFatigueLadderDeep).join(',')}]`, 34)}` +
          `  ${w.lines[0]}`,
      )
      for (const line of w.lines.slice(1)) console.log(`  ${padR('', 6)}  ${padR('', 30)}  ${padR('', 34)}  ${line}`)
      console.log(
        `  ${padR('', 6)}  ⤷ smallest MARGINAL match anywhere in the family: ${w.worst}` +
          `${w.worst > 0 ? '  – the total is strictly increasing in depth ✔' : '  ⚠⚠ NOT MONOTONE – DO NOT READ THIS CELL'}`,
      )
    })
  }
  console.log('')

  // --- THE CELLS – FOUR SINGLE-LEVER FAMILIES, THEN COMBINATIONS DRAWING FROM ALL FOUR -----------
  // ⚠ EVERY LEVER IS MEASURED ALONE BEFORE IT IS MEASURED IN COMPANY, including the one §8c already
  // refused (D, the natural base): he named it on 19.09, and a measured refusal on today's tree is
  // worth more than an inherited one from a document written against a different target.
  const cells: { group: string; label: string; dials: Dials }[] = [
    { group: '–', label: 'SHIPPED (control)', dials: SHIPPED },
    // (A) «слив на глубине хода» – the drain at depth
    ...([0.5, 1, 2] as const).map((k, i) => ({ group: 'A', label: `A${i + 1} concave depth k=${k}`, dials: shapeA(k) })),
    // (B) «турнирная работа массажиста» – the half of him that reaches a TOURNAMENT week
    { group: 'B', label: 'B1 tour relief 2->3', dials: { ...SHIPPED, tourRelief: 3 } },
    { group: 'B', label: 'B2 tour relief 2->4', dials: { ...SHIPPED, tourRelief: 4 } },
    { group: 'B', label: 'B3 tour relief 2->6', dials: { ...SHIPPED, tourRelief: 6 } },
    // (C) «обычная работа массажиста» – the at-home table, on the weeks she does not play
    { group: 'C', label: 'C1 home rungs +1 (2/3/4)', dials: { ...SHIPPED, masseurBonusDelta: 1 } },
    { group: 'C', label: 'C2 home rungs +2 (3/4/5)', dials: { ...SHIPPED, masseurBonusDelta: 2 } },
    { group: 'C', label: 'C3 home rungs +3 (4/5/6)', dials: { ...SHIPPED, masseurBonusDelta: 3 } },
    // (D) «естественное восстановление» – the phase's own base
    { group: 'D', label: 'D1 proRecoveryBase 5->6', dials: { surchargeDelta: 0, proRecovery: 6 } },
    { group: 'D', label: 'D2 proRecoveryBase 5->7', dials: { surchargeDelta: 0, proRecovery: 7 } },
    { group: 'D', label: 'D3 proRecoveryBase 5->9', dials: { surchargeDelta: 0, proRecovery: 9 } },
    // (E) combinations, named BEFORE the single-lever numbers are read, so the mix is a design and
    // not a search over the grid that produced it.
    { group: 'E', label: 'E1 A2 + B1', dials: { ...shapeA(1), tourRelief: 3 } },
    { group: 'E', label: 'E2 A3 + B2', dials: { ...shapeA(2), tourRelief: 4 } },
    { group: 'E', label: 'E3 A3 + B2 + C1', dials: { ...shapeA(2), tourRelief: 4, masseurBonusDelta: 1 } },
    { group: 'E', label: 'E4 A3 + B2 + C1 + D1', dials: { ...shapeA(2), tourRelief: 4, masseurBonusDelta: 1, proRecovery: 6 } },
    // ⚠⚠ NOT A CANDIDATE – A BOUND. All four levers, all driven hard. If «реже» is not reachable
    // HERE it is not reachable through the levers he named at all, and the honest answer is a
    // measured refusal rather than a cell that pretends.
    {
      group: 'E',
      label: 'E-MAX (a bound, not a cell)',
      dials: { ...shapeA(4), tourRelief: 8, masseurBonusDelta: 3, proRecovery: 9 },
    },
  ]

  // ⚠⚠ `spend` AND `restFree` ARE THE ACTUATION COLUMNS, and they are in this table rather than in a
  // separate arm because two of the four levers can only be told from a NULL ARM by them. A and B
  // land in what a TOURNAMENT WEEK costs (`spend`); C and D land in the SAME accumulator as each
  // other (`accrueCondition`'s `base + masseurRungOf(world).conditionBonusPerWeek`), and both are
  // read on the weeks the ceiling has room – which is what `restFree` measures. A C row that is flat
  // on holidays while `restFree` moves is a real null RESULT (the ceiling eating it, §3's finding);
  // a C row flat on BOTH would be a null ARM, and CLAUDE.md's rule is that the two must never be
  // confused. Read them before reading anything else in the row.
  console.log(
    '  cell                       HOLIDAYS/SEASON      the DISTRIBUTION of them      door49  wk<50  cond med  min' +
      '  inj prev  onsets  knocks  events  depth  spend  restFree  best',
  )
  console.log(
    '                             mean  median   vs 8    <=2    3-4    5+   never' +
      '                                                        (A,B actuate)(C,D)     ',
  )
  let control: Headline | null = null
  for (const c of cells) {
    const h = headlineOf(runArm(c.dials, opts, presets))
    if (control === null) control = h
    const vs = h.vacations - control.vacations
    console.log(
      `  ${padR(c.label, 25)}  ${padL(f1(h.vacations), 4)}  ${padL(f1(h.vacMedian), 6)}  ${padL(
        `${vs >= 0 ? '+' : ''}${f1(vs)}`,
        5,
      )}  ${padL(f0(h.vacLo) + '%', 5)}  ${padL(f0(h.vacMid) + '%', 5)}  ${padL(f0(h.vacHi) + '%', 5)}` +
        `  ${padL(f0(h.vacNever) + '%', 5)}  ${padL(f0(h.door), 6)}  ${padL(f1(h.weeksUnder50), 5)}` +
        `  ${padL(f0(h.condMedian), 8)}  ${padL(f0(h.condMin), 3)}  ${padL(f0(h.injuryPrevalence) + '%', 8)}` +
        `  ${padL(f2(h.onsets), 6)}  ${padL(f1(h.knocks), 6)}  ${padL(f1(h.events), 6)}  ${padL(f2(h.depth), 5)}` +
        `  ${padL(f1(h.eventSpend), 5)}  ${padL(f1(h.restGainFree), 8)}  ${padL(f0(h.rankBest), 4)}`,
    )
  }
  console.log('')
  console.log('  HOW TO READ A CELL, all three ways it can be wrong:')
  console.log('   · `best` (median of each career\'s best professional place) and `depth` – a cell that buys rarity by')
  console.log('     making her WORSE shows it there.')
  console.log('   · `cond min` and `wk<50` – a cell that buys rarity by letting her BOTTOM OUT shows it there.')
  console.log('   · `never` – a cell that buys rarity by making the holiday POINTLESS shows it there, and that is a')
  console.log('     failure of its own: he asked for it to stop being compulsory, not for it to stop existing.')
  console.log('   · `door49` is REPORTED AND UNCONSTRAINED (the 19.09 release). It is not a pass/fail column.')
}

// =================================================================================================
// §0 THE ACTUATION ARM
// =================================================================================================

function actuate(presets: Preset[]): void {
  console.log(rule())
  console.log('§0 THE ARMS ARE WIRED – both dials driven to absurd values, in both directions')
  console.log(rule())
  console.log('')
  console.log('  ⚠⚠ If these do not move, every other number in this file is a fiction.')
  console.log('')
  const opts: WalkOpts = { toAge: 22, masseur: 'daily' }
  const cells: { label: string; dials: Dials }[] = [
    { label: 'surcharge -3', dials: { surchargeDelta: -3, proRecovery: null } },
    { label: 'shipped', dials: SHIPPED },
    { label: 'surcharge +6', dials: { surchargeDelta: 6, proRecovery: null } },
    { label: 'proRecovery 0', dials: { surchargeDelta: 0, proRecovery: 0 } },
    { label: 'proRecovery 20', dials: { surchargeDelta: 0, proRecovery: 20 } },
    { label: 'no drain', dials: { surchargeDelta: 0, proRecovery: null, noDrain: true } },
    { label: 'no injury roll', dials: { surchargeDelta: 0, proRecovery: null, noInjury: true } },
  ]
  console.log('  cell               cond med   door49   event spend   rest gain   …unclamped   vac/seas   onsets   events')
  for (const c of cells) {
    const careers = runArm(c.dials, opts, presets, Math.min(3, SEEDS))
    const h = headlineOf(careers)
    console.log(
      `  ${padR(c.label, 17)}  ${padL(f1(h.condMedian), 8)}  ${padL(f1(h.door), 6)}  ${padL(f1(h.eventSpend), 11)}` +
        `  ${padL(f1(h.restGain), 9)}  ${padL(f1(h.restGainFree), 10)}  ${padL(f1(h.vacations), 8)}` +
        `  ${padL(f2(h.onsets), 7)}  ${padL(f1(h.events), 6)}`,
    )
  }
}

// =================================================================================================
// MAIN
// =================================================================================================

const started = Date.now()
console.log(rule())
console.log('THE SEASON EQUATION – tools/season-equation.ts')
console.log(rule())
console.log(
  `  ${SEEDS} seeds x ${DEFAULT_PRESETS.length} presets, walked to age ${TO_AGE} on the \`player\` policy` +
    ` (rests, skips, books the week away).`,
)
console.log(
  `  shipped dials: proPhaseRecoveryBase ${ECONOMY.condition.proPhaseRecoveryBase} (junior ` +
    `${ECONOMY.condition.recoveryBase}) · surcharges w15 ${ECONOMY.condition.tierMatchFatigue.w15} / wta250 ` +
    `${ECONOMY.condition.tierMatchFatigue.wta250} / slam ${ECONOMY.condition.tierMatchFatigue.slam} · matchFatigue ` +
    `${ECONOMY.condition.matchFatigue.straightSets}/${ECONOMY.condition.matchFatigue.hardMatch} · W ladder [` +
    `${ECONOMY.condition.runFatigueLadderWta.join(',')}] · deep ladder [${ECONOMY.condition.runFatigueLadderDeep.join(',')}]`,
)
console.log('')

const walkOpts: WalkOpts = { toAge: TO_AGE, masseur: 'daily' }
if (ACTUATE) actuate(DEFAULT_PRESETS)
if (TRAJ) {
  const base = runArm(SHIPPED, walkOpts, DEFAULT_PRESETS)
  trajectory(base)
  attribution(base)
  if (!NO_ABLATION) ablations(base, walkOpts, DEFAULT_PRESETS)
}
if (GRID) grid(walkOpts, DEFAULT_PRESETS)
if (STAFFING) staffing(DEFAULT_PRESETS)
if (LEVERS) levers(walkOpts, DEFAULT_PRESETS)
console.log('')
console.log(`  (${f1((Date.now() - started) / 1000)}s)`)
