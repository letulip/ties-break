// ⭐⭐ THE TALENT BREAKDOWN – the same career, split by how much talent she was born with, college
// against the tour (17.08.2026, docs/specs/college-by-talent-2026-08.md).
//
//   npx vite-node tools/college-talent-bands.ts -- [--seeds N] [--to-age 32] [--only 0,1,2,3,4]
//                                                  [--edges 60.9,63.4,65.9] [--tag LABEL]
//
// THE QUESTION (owner, 17.08): «мне интересно посмотреть на разбивку по бесталанная, средняя,
// талантливая и одаренная по этому показателю. Кто на каком месте в колледж заходил, на какой позиции
// из колледжа выходил … и за какой срок каких результатов добивались. 22 года - это у нас вроде
// где-то на финальной части пути до максимума, верно?»
//
// ⚠⚠ THE FOUR NAMES ARE HIS AND THE GAME HAS NONE. There is no talent band anywhere in this engine.
// `rollPotential` (engine/development.ts) draws a CONTINUOUS per-attribute headroom out of
// `ECONOMY.development.potentialBand` = [4, 26] and adds it to the birth build; nothing names a slice
// of that, nothing displays it, and `decisions.md` #11 records that the ceiling is deliberately never
// shown. The ONE constant in the game that bands a ceiling at all is `ECONOMY.academy.ceilingBand`
// = [56, 70] – the scout's 0..1 ruler in `academy.ts`, whose own comment records the population it was
// measured against: «p10 56, p50 62, p90 69». So:
//
//   * the TALENT NUMBER is `ceilingOf(world.potential)` – engine/academy.ts's own definition, the mean
//     of the five attribute ceilings, and the only per-career talent scalar this codebase computes;
//   * the FOUR BANDS ARE MINE, quartiles of that number over the measured population, and they are
//     printed with the `ceilingBand` anchors beside them so a reader can see how our cut relates to
//     the one banding constant that exists. His four Russian words are a READING of these quartiles
//     and are deliberately not written into any source file.
//
// ⚠ THE EDGES ARE FIXED ACROSS ARMS, not recomputed per arm. `ceilingOf(potential)` is a function of
// `seed:potential` and the birth build alone – no field, no ladder, no fieldPros – so the same seed is
// in the same band in every arm by construction. `--edges` exists so a control worktree can be handed
// the B arm's cut and the identity checked rather than assumed (it is asserted below).
//
// ⚠ MEASUREMENT ONLY. Nothing is patched, no engine constant is written, and no career leaves here.
import {
  openCareer,
  stepCareerWeek,
  POLICIES,
  PRESETS,
  median,
  type Preset,
} from './econ-bench'
import { answerFork, answerRetirement, chooseGift, kidAgeExact, pendingBirthday, resumeFromCollege } from '../src/engine/world'
import { ceilingOf } from '../src/engine/academy'
// ⚠ FROM world/ladder, NOT world/snapshot (TB-07): kidLadderRank moved down to the ladder leaf so
// world/college.ts could stop importing the aggregate projection layer. Same function.
import { kidLadderRank } from '../src/engine/world/ladder'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import type { WorldState } from '../src/engine/world'
import type { Rng } from '../src/engine/rng'

// --- args --------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const strOf = (n: string): string | null => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
/** seeds PER PRESET. n = SEEDS x 9. */
const SEEDS = argOf('seeds', 12)
/** ⚠ THE HORIZON HAS TO OUTLIVE THE PEAK OR THE CAREER-HIGH COLUMN IS A READING OF THE CAP. The age
 *  curve plateaus 23-28 and declines from 29, and the 52-week ranking window lags the skill by a
 *  year, so a career high can legitimately land at 29-30. §5 prints the share that peaked in the last
 *  season as a saturation check – if it is large, this number is too small and the table says so. */
const TO_AGE = argOf('to-age', 32)
const WALK_CAP = argOf('cap', 340)
const TAG = strOf('tag') ?? 'B'
const EDGES_ARG = strOf('edges')
const ONLY = (() => {
  const i = args.indexOf('--only')
  return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',')) : null
})()
const wants = (s: string) => !ONLY || ONLY.has(s)
const POLICY = POLICIES[1]

// --- formatting --------------------------------------------------------------------------------
const pad = (s: string | number, n: number) => String(s).padStart(n)
const padE = (s: string | number, n: number) => String(s).padEnd(n)
const rule = (n = 118) => '-'.repeat(n)
const pctOf = (k: number, d: number) => (d === 0 ? '  –' : `${((100 * k) / d).toFixed(0)}%`)
/** ⚠ EVERY CELL CARRIES ITS OWN DENOMINATOR. The owner has twice caught a median quoted without one
 *  and the whole point of this file is that the bands differ, so "n/N" is never optional. */
const withN = (v: string, k: number, d: number) => `${v} (${k}/${d})`
function section(title: string): void {
  console.log(`\n${rule()}\n${title}\n${rule()}`)
}
function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const i = (s.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo)
}
/** ⚠ THE DISTRIBUTION, NEVER A MEDIAN ALONE. Five order statistics and the n, in one cell-width. */
function spread(xs: number[], f: (x: number) => string = (x) => String(Math.round(x))): string {
  if (xs.length === 0) return `–`
  return `${f(quantile(xs, 0.1))}/${f(quantile(xs, 0.25))}/${f(median(xs))}/${f(quantile(xs, 0.75))}/${f(quantile(xs, 0.9))}`
}
const rk = (x: number) => `#${Math.round(x)}`
const yr = (x: number) => x.toFixed(1)

/** ⚠ `kidAgeExact` TAKES A WEEK AND A BIRTH MONTH, NOT A WORLD – and getting that wrong is why this
 *  file's first run reported "never ranked 18/18" with every career "still going". A world argument
 *  makes it NaN, `NaN < TO_AGE` is false, and the entire post-fork walk was skipped in silence: a
 *  broken arm that looks exactly like a null result (CLAUDE.md's own warning, and it caught me). The
 *  tell was the clock – 21s for eighteen careers that should have walked 830 weeks each. */
const ageOf = (w: WorldState): number => kidAgeExact(w.week, w.profile.birthMonth, w.profile.birthDay)

// --- the bands ---------------------------------------------------------------------------------

/** ⚠ MINE, NOT THE GAME'S. See the header. The names are the owner's own four words, transliterated
 *  only so this file stays free of Cyrillic; the CODE has no talent band and this array is a reading
 *  instrument, not a mechanic. */
const BAND_LABELS = ['untalented', 'average', 'talented', 'gifted'] as const
type BandIx = 0 | 1 | 2 | 3

function bandOf(ceiling: number, edges: readonly number[]): BandIx {
  if (ceiling < edges[0]) return 0
  if (ceiling < edges[1]) return 1
  if (ceiling < edges[2]) return 2
  return 3
}

// --- one career --------------------------------------------------------------------------------

type Arm = 'college' | 'tour'

interface Row {
  key: string
  preset: string
  seed: number
  arm: Arm
  /** `ceilingOf(potential)` – the engine's own talent scalar. Arm-independent by construction. */
  ceiling: number
  ageAtFork: number
  /** her professional rank the week the fork is asked. `null` is the COMMON case at nineteen and is
   *  not "ranked last": `RANKABLE_MIN` has not been met, so she is off the list entirely. */
  rankAtFork: number | null
  /** COLLEGE ONLY, and ⚠ IT IS AN ARTEFACT KEPT ON PURPOSE (tools/college-return-probe.ts's header):
   *  the graduation week is the one week of the career when the 52-week window is empty BY
   *  CONSTRUCTION. It can only ever print null. It stays in the output so the honest column beside it
   *  – `ageFirstRankedAfter` – cannot be mistaken for the same reading. */
  rankAtLeaving: number | null
  graduated: boolean
  /** the ending that stopped her inside the four years, if one did */
  endedInCollege: string | null

  /** ⭐ the career high over the WHOLE career, and the exact age she reached it */
  bestRank: number | null
  bestAge: number | null
  /** the career high restricted to weeks AFTER the fork – the half the two arms can differ on, since
   *  everything before the fork is the same world walked twice */
  bestRankAfterFork: number | null
  bestAgeAfterFork: number | null

  /** COLLEGE: weeks from the graduation week until she holds a professional rank again.
   *  TOUR: weeks from the SAME AGE (the graduation-equivalent) until she next holds one, so the two
   *  columns are the same measurement on the same clock and not two different questions. */
  weeksToRankFromExit: number | null
  ageFirstRankedAfterExit: number | null
  /** weeks from the exit week to the week the career high was set. Negative is impossible by
   *  construction for the college arm (nothing ranks inside the freeze); it CAN be negative on the
   *  tour arm, and that is a real finding rather than a bug – she peaked before twenty-three. */
  weeksExitToBest: number | null
  /** her rank at the exit age + 1 year and + 4 years – "what the four years bought", on both arms */
  rankExitPlus1: number | null
  rankExitPlus4: number | null

  endedType: string | null
  endedAge: number | null
  /** ⚠ SATURATION CHECK: did the career high land in the last season of the horizon? */
  bestAtHorizon: boolean
}

function toTheFork(preset: Preset, i: number): { world: WorldState; rng: Rng } | null {
  const { world, rng } = openCareer(preset, i, POLICY)
  for (let w = 0; w < WALK_CAP; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending && world.ending.type !== 'college') return null
    if (world.fork !== null && world.fork.answer === null) return { world, rng }
  }
  return null
}

/** ⚠ THE ARMS ARE RE-WALKED FROM WEEK 0, NOT CLONED. `rng` is a stateful closure over its own
 *  counter; there is no honest deep copy of it, and `tools/college-return-probe.ts` re-walks for the
 *  same reason. Costs ~260 weeks of the ~830 twice over and buys the guarantee that the two arms
 *  share the same world up to the fork exactly. */
function walkArm(preset: Preset, i: number, arm: Arm): Row | null {
  const at = toTheFork(preset, i)
  if (at === null) return null
  const { world, rng } = at
  const ceiling = ceilingOf(world.potential)
  const ageAtFork = ageOf(world)
  const rankAtFork = kidLadderRank(world, 'wta')

  // her career high before the fork – shared by both arms, and the reason the "after the fork"
  // columns exist at all
  let bestRank: number | null = null
  let bestAge: number | null = null
  let bestWeek: number | null = null
  const note = (): void => {
    const r = kidLadderRank(world, 'wta')
    if (r !== null && (bestRank === null || r < bestRank)) {
      bestRank = r
      bestAge = ageOf(world)
      bestWeek = world.week
    }
  }

  let endedInCollege: string | null = null
  let graduated = true
  /** the week the FREEZE ends on the college arm, and the same AGE on the tour arm */
  let exitWeek: number

  if (arm === 'college') {
    // ⚠ NO TIER IS PASSED, DELIBERATELY. `answerFork`'s own comment: a command with no tier is a
    // caller that never asked the player, and the cheapest open place «is the only default that
    // cannot be read as advice». The tier spread was measured separately (decisions.md 17.08:
    // the coaching is worth +0 / +8 / +2 on the top-100 row) and is not this file's question.
    answerFork(world, 'college')
    // Round 24: the year pauses on her birthday week – press, answer, press again.
    for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    graduated = world.ending === null
    endedInCollege = world.ending ? world.ending.type : null
    exitWeek = world.week
  } else {
    answerFork(world, 'continue')
    exitWeek = world.week + ENDINGS.collegeYears * WEEKS_PER_YEAR
  }
  const rankAtLeaving = arm === 'college' ? kidLadderRank(world, 'wta') : null

  // --- the walk to the horizon -----------------------------------------------------------------
  const bestBeforeExitWeek = bestWeek
  let weeksToRankFromExit: number | null = null
  let ageFirstRankedAfterExit: number | null = null
  let rankExitPlus1: number | null = null
  let rankExitPlus4: number | null = null
  let bestRankAfterFork: number | null = null
  let bestAgeAfterFork: number | null = null
  const forkWeek = arm === 'college' ? exitWeek - ENDINGS.collegeYears * WEEKS_PER_YEAR : world.week

  const noteAfter = (): void => {
    const r = kidLadderRank(world, 'wta')
    if (r === null) return
    if (bestRankAfterFork === null || r < bestRankAfterFork) {
      bestRankAfterFork = r
      bestAgeAfterFork = ageOf(world)
    }
    if (world.week > exitWeek && weeksToRankFromExit === null) {
      weeksToRankFromExit = world.week - exitWeek
      ageFirstRankedAfterExit = ageOf(world)
    }
  }

  if (arm === 'tour' || graduated) {
    while (world.ending === null && ageOf(world) < TO_AGE) {
      stepCareerWeek(world, rng, POLICY)
      if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
      if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
      note()
      noteAfter()
      if (world.week === exitWeek + WEEKS_PER_YEAR) rankExitPlus1 = kidLadderRank(world, 'wta')
      if (world.week === exitWeek + 4 * WEEKS_PER_YEAR) rankExitPlus4 = kidLadderRank(world, 'wta')
    }
  }
  void bestBeforeExitWeek
  void forkWeek

  return {
    key: `${preset.label}#${i}`,
    preset: preset.label,
    seed: i,
    arm,
    ceiling,
    ageAtFork,
    rankAtFork,
    rankAtLeaving,
    graduated,
    endedInCollege,
    bestRank,
    bestAge,
    bestRankAfterFork,
    bestAgeAfterFork,
    weeksToRankFromExit,
    ageFirstRankedAfterExit,
    weeksExitToBest: bestWeek === null ? null : bestWeek - exitWeek,
    rankExitPlus1,
    rankExitPlus4,
    endedType: world.ending ? world.ending.type : null,
    endedAge: world.ending ? ageOf(world) : null,
    bestAtHorizon: bestAge !== null && bestAge >= TO_AGE - 1,
  }
}

// =================================================================================================
// ⚠⚠ THE CUT IS TAKEN BEFORE ANY CAREER IS WALKED, AND THAT IS THE POINT.
//
// The obvious way to band is to walk the careers and take quartiles of the survivors. It is wrong for
// a two-arm comparison, quietly: a career that ends before nineteen never reaches the fork and never
// enters the population, and WHICH careers those are depends on the field – i.e. on the very commit
// the control arm reverts. Two arms would then have two different cuts, and every per-band difference
// would be part talent and part "these are not the same girls".
//
// `ceilingOf(rollPotential(seed, startingSkills(seed, profile)))` reads `seed:potential`, the birth
// build and `ECONOMY.development.potentialBand` and NOTHING ELSE – no field, no ladder, no fieldPros –
// so a cut taken at week 0 over ALL the seeds is identical on every arm by construction, and §0
// asserts it against a supplied `--edges` rather than trusting the argument.
const CUT_POPULATION = PRESETS.flatMap((preset) =>
  Array.from({ length: SEEDS }, (_, i) => ceilingOf(openCareer(preset, i, POLICY).world.potential)),
)

const t0 = Date.now()
const rows: Row[] = []
let neverReachedFork = 0
for (const preset of PRESETS) {
  for (let i = 0; i < SEEDS; i++) {
    const c = walkArm(preset, i, 'college')
    const t = walkArm(preset, i, 'tour')
    if (c === null || t === null) {
      neverReachedFork++
      continue
    }
    rows.push(c, t)
  }
}

const college = rows.filter((r) => r.arm === 'college')
const tour = rows.filter((r) => r.arm === 'tour')
const N = college.length

// --- the cut -------------------------------------------------------------------------------------
const ceilings = college.map((r) => r.ceiling)
const measuredEdges = [
  quantile(CUT_POPULATION, 0.25),
  quantile(CUT_POPULATION, 0.5),
  quantile(CUT_POPULATION, 0.75),
]
const EDGES = EDGES_ARG ? EDGES_ARG.split(',').map(Number) : measuredEdges
const band = (r: Row) => bandOf(r.ceiling, EDGES)
const inBand = (rs: Row[], b: BandIx) => rs.filter((r) => band(r) === b)

console.log(`\n⭐⭐ THE TALENT BREAKDOWN [arm tag ${TAG}] – ${N} careers x 2 arms, fourteen to ${TO_AGE}`)
console.log(
  `   POLICY ${POLICY.label} · ${PRESETS.length} presets x ${SEEDS} seeds · ${neverReachedFork} never reached the fork · ${((Date.now() - t0) / 1000).toFixed(0)}s`,
)

// =================================================================================================
if (wants('0')) {
  section(`0. ⚠ THE BANDS ARE MINE. THE GAME HAS NONE – and this section is the proof, not a preamble`)
  console.log(
    `  the game's ONLY talent constant is ECONOMY.academy.ceilingBand = [${ECONOMY.academy.ceilingBand.join(', ')}]`,
  )
  console.log(
    `  ECONOMY.development.potentialBand = [${ECONOMY.development.potentialBand.join(', ')}] – a CONTINUOUS per-attribute headroom, no slices, never displayed`,
  )
  console.log(
    `\n  ⚠ the CUT is taken at week 0 over all ${CUT_POPULATION.length} seeds, before a career is walked – see the note at CUT_POPULATION`,
  )
  console.log(
    `    cut edges p25/p50/p75 = ${measuredEdges.map((e) => e.toFixed(3)).join(' / ')} over ${CUT_POPULATION.length}`,
  )
  console.log(`\n  the talent scalar = ceilingOf(potential), engine/academy.ts – over the ${N} that reached the fork:`)
  console.log(
    `    p10 ${quantile(ceilings, 0.1).toFixed(1)} · p25 ${quantile(ceilings, 0.25).toFixed(1)} · p50 ${median(ceilings).toFixed(1)} · p75 ${quantile(ceilings, 0.75).toFixed(1)} · p90 ${quantile(ceilings, 0.9).toFixed(1)} · min ${Math.min(...ceilings).toFixed(1)} · max ${Math.max(...ceilings).toFixed(1)}`,
  )
  console.log(
    `    ⚠ ceilingBand's own comment claims the population is «p10 56, p50 62, p90 69» – compare the row above`,
  )
  console.log(`\n  ${padE('band (MINE)', 14)}${padE('ceiling', 18)}${pad('n', 5)}${pad('scoutScore 0..1', 18)}`)
  console.log(`  ${rule(58)}`)
  const [lo, hi] = ECONOMY.academy.ceilingBand
  for (let b = 0 as BandIx; b < 4; b = (b + 1) as BandIx) {
    const rs = inBand(college, b)
    const cs = rs.map((r) => r.ceiling)
    const range =
      b === 0
        ? `< ${EDGES[0].toFixed(1)}`
        : b === 3
          ? `>= ${EDGES[2].toFixed(1)}`
          : `${EDGES[b - 1].toFixed(1)} .. ${EDGES[b].toFixed(1)}`
    const sc = cs.length ? `${((median(cs) - lo) / (hi - lo)).toFixed(2)}` : '–'
    console.log(`  ${padE(BAND_LABELS[b], 14)}${padE(range, 18)}${pad(rs.length, 5)}${pad(sc, 18)}`)
  }
  if (EDGES_ARG) {
    const same = measuredEdges.every((e, k) => Math.abs(e - EDGES[k]) < 1e-9)
    console.log(
      `\n  ⚠ EDGES SUPPLIED: [${EDGES.map((e) => e.toFixed(3)).join(', ')}] vs this arm's own [${measuredEdges.map((e) => e.toFixed(3)).join(', ')}] – ${same ? 'IDENTICAL, as the header claims' : '⚠⚠ DIFFERENT: the arms are not the same careers'}`,
    )
  }
}

// =================================================================================================
if (wants('1')) {
  section(`1. ⭐⭐ IN AND OUT – where she stood at nineteen and at twenty-three, per band, per arm`)
  console.log(
    `  every cell is p10/p25/MEDIAN/p75/p90 over the careers that HELD a rank, with (held/n) beside it`,
  )
  console.log(
    `\n  ${padE('band', 12)}${padE('arm', 9)}${pad('n', 4)}  ${padE('rank at 19 (the fork)', 34)}${padE('rank at 23 (exit)', 34)}`,
  )
  console.log(`  ${rule(96)}`)
  for (let b = 0 as BandIx; b < 4; b = (b + 1) as BandIx) {
    for (const [label, rs] of [
      ['college', inBand(college, b)],
      ['tour', inBand(tour, b)],
    ] as const) {
      const fork = rs.map((r) => r.rankAtFork).filter((x): x is number => x !== null)
      const exit =
        label === 'college'
          ? rs.map((r) => r.rankAtLeaving).filter((x): x is number => x !== null)
          : rs.map((r) => r.rankExitPlus1).filter((x): x is number => x !== null)
      console.log(
        `  ${padE(label === 'college' ? BAND_LABELS[b] : '', 12)}${padE(label, 9)}${pad(rs.length, 4)}  ` +
          `${padE(withN(spread(fork, rk), fork.length, rs.length), 34)}` +
          `${padE(withN(spread(exit, rk), exit.length, rs.length), 34)}`,
      )
    }
  }
  console.log(
    `\n  ⚠⚠ THE COLLEGE "rank at 23" COLUMN IS AN ARTEFACT AND IS PRINTED SO IT CANNOT BE MISREAD. The`,
  )
  console.log(
    `     graduation week is the ONE week of a career when the 52-week window is empty by construction:`,
  )
  console.log(`     she entered nothing for four years, so it can only ever print "–". §3 is the honest column.`)
  console.log(
    `     The tour column at the same age is her real rank one year past the equivalent week, not an artefact.`,
  )
}

// =================================================================================================
if (wants('2')) {
  section(`2. ⭐⭐ THE CAREER HIGH AND THE AGE SHE REACHED IT – the owner's «за какой срок каких результатов»`)
  console.log(`  ${padE('band', 12)}${padE('arm', 9)}${pad('n', 4)}  ${padE('career high', 30)}${padE('age at it', 26)}${padE('ever ranked', 14)}`)
  console.log(`  ${rule(100)}`)
  for (let b = 0 as BandIx; b < 4; b = (b + 1) as BandIx) {
    for (const [label, rs] of [
      ['college', inBand(college, b)],
      ['tour', inBand(tour, b)],
    ] as const) {
      const best = rs.map((r) => r.bestRank).filter((x): x is number => x !== null)
      const age = rs.map((r) => r.bestAge).filter((x): x is number => x !== null)
      console.log(
        `  ${padE(label === 'college' ? BAND_LABELS[b] : '', 12)}${padE(label, 9)}${pad(rs.length, 4)}  ` +
          `${padE(spread(best, rk), 30)}${padE(spread(age, yr), 26)}${padE(withN('', best.length, rs.length), 14)}`,
      )
    }
  }

  console.log(`\n  ⭐ THE SAME, RESTRICTED TO WEEKS AFTER THE FORK – the only half the two arms can differ on`)
  console.log(`  ${padE('band', 12)}${padE('arm', 9)}${pad('n', 4)}  ${padE('best after 19', 30)}${padE('age at it', 26)}`)
  console.log(`  ${rule(86)}`)
  for (let b = 0 as BandIx; b < 4; b = (b + 1) as BandIx) {
    for (const [label, rs] of [
      ['college', inBand(college, b)],
      ['tour', inBand(tour, b)],
    ] as const) {
      const best = rs.map((r) => r.bestRankAfterFork).filter((x): x is number => x !== null)
      const age = rs.map((r) => r.bestAgeAfterFork).filter((x): x is number => x !== null)
      console.log(
        `  ${padE(label === 'college' ? BAND_LABELS[b] : '', 12)}${padE(label, 9)}${pad(rs.length, 4)}  ` +
          `${padE(withN(spread(best, rk), best.length, rs.length), 30)}${padE(spread(age, yr), 26)}`,
      )
    }
  }
}

// =================================================================================================
if (wants('3')) {
  section(`3. ⭐⭐ THE ROAD BACK – how long from the exit to a rank, and to the career high`)
  console.log(
    `  ⚠ THE TOUR ARM IS MEASURED ON THE SAME CLOCK: "exit" is the graduation week on the college arm`,
  )
  console.log(`     and the SAME AGE on the tour arm, so the two columns answer one question.`)
  console.log(
    `\n  ${padE('band', 12)}${padE('arm', 9)}${pad('n', 4)}  ${padE('weeks exit -> ranked', 30)}${padE('weeks exit -> career high', 32)}${padE('rank +4y from exit', 26)}`,
  )
  console.log(`  ${rule(114)}`)
  for (let b = 0 as BandIx; b < 4; b = (b + 1) as BandIx) {
    for (const [label, rs] of [
      ['college', inBand(college, b)],
      ['tour', inBand(tour, b)],
    ] as const) {
      const wk = rs.map((r) => r.weeksToRankFromExit).filter((x): x is number => x !== null)
      const toBest = rs.map((r) => r.weeksExitToBest).filter((x): x is number => x !== null)
      const p4 = rs.map((r) => r.rankExitPlus4).filter((x): x is number => x !== null)
      console.log(
        `  ${padE(label === 'college' ? BAND_LABELS[b] : '', 12)}${padE(label, 9)}${pad(rs.length, 4)}  ` +
          `${padE(withN(spread(wk), wk.length, rs.length), 30)}` +
          `${padE(spread(toBest), 32)}` +
          `${padE(withN(spread(p4, rk), p4.length, rs.length), 26)}`,
      )
    }
  }
}

// =================================================================================================
if (wants('4')) {
  section(`4. ⭐⭐ THE ODDS OF A BAND, per talent band, per arm – every cell has its denominator`)
  const BANDS = [500, 200, 100, 50, 10] as const
  console.log(`  ${padE('band', 12)}${padE('arm', 9)}${pad('n', 4)}  ${BANDS.map((x) => padE(`top ${x}`, 15)).join('')}`)
  console.log(`  ${rule(100)}`)
  for (let b = 0 as BandIx; b < 4; b = (b + 1) as BandIx) {
    for (const [label, rs] of [
      ['college', inBand(college, b)],
      ['tour', inBand(tour, b)],
    ] as const) {
      console.log(
        `  ${padE(label === 'college' ? BAND_LABELS[b] : '', 12)}${padE(label, 9)}${pad(rs.length, 4)}  ` +
          BANDS.map((x) => {
            const k = rs.filter((r) => r.bestRank !== null && r.bestRank <= x).length
            return padE(`${k}/${rs.length} ${pctOf(k, rs.length)}`, 15)
          }).join(''),
      )
    }
  }
  console.log(`\n  ⭐ THE WHOLE POPULATION, both arms, for the row the card quotes`)
  for (const [label, rs] of [
    ['college', college],
    ['tour', tour],
  ] as const) {
    console.log(
      `  ${padE(label, 12)}${pad(rs.length, 4)}  ` +
        BANDS.map((x) => {
          const k = rs.filter((r) => r.bestRank !== null && r.bestRank <= x).length
          return padE(`${k}/${rs.length} ${pctOf(k, rs.length)}`, 15)
        }).join(''),
    )
  }
}

// =================================================================================================
if (wants('5')) {
  section(`5. ⚠ WHAT COULD INVALIDATE THE TABLE ABOVE – run these before quoting it`)
  const sat = rows.filter((r) => r.bestAtHorizon).length
  console.log(
    `  SATURATION: ${sat}/${rows.length} ${pctOf(sat, rows.length)} of careers set their high in the LAST season before ${TO_AGE}.`,
  )
  console.log(`     A large share means the horizon, not the age curve, is what stopped the climb.`)
  const neverRanked = rows.filter((r) => r.bestRank === null).length
  console.log(`  NEVER RANKED AT ALL: ${neverRanked}/${rows.length} ${pctOf(neverRanked, rows.length)}`)
  const cEnd = college.filter((r) => r.endedInCollege !== null).length
  console.log(`  ENDED INSIDE THE FOUR YEARS: ${cEnd}/${N} ${pctOf(cEnd, N)} – these carry no return columns`)
  console.log(`\n  ENDINGS, per arm (the denominators of every "of n" above)`)
  for (const [label, rs] of [
    ['college', college],
    ['tour', tour],
  ] as const) {
    const kinds = new Map<string, number>()
    for (const r of rs) kinds.set(r.endedType ?? 'still going', (kinds.get(r.endedType ?? 'still going') ?? 0) + 1)
    console.log(
      `  ${padE(label, 10)}${[...kinds.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
    )
    const ea = rs.map((r) => r.endedAge).filter((x): x is number => x !== null)
    console.log(`  ${padE('', 10)}age at the end: ${spread(ea, yr)} (${ea.length}/${rs.length})`)
  }
  console.log(
    `\n  ⚠ THE BAND IS ARM-INDEPENDENT BY CONSTRUCTION and this asserts it rather than claiming it:`,
  )
  let mismatched = 0
  for (let i = 0; i < college.length; i++) {
    const t = tour.find((x) => x.key === college[i].key)
    if (!t || Math.abs(t.ceiling - college[i].ceiling) > 1e-9) mismatched++
  }
  console.log(
    `     ${mismatched} of ${college.length} careers have a different ceiling on the two arms ${mismatched === 0 ? '– as expected' : '– ⚠⚠ THE ARMS ARE NOT THE SAME CAREERS'}`,
  )
}

console.log()
