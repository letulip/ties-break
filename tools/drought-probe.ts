/**
 * drought-probe – HOW LONG DOES SHE GO WITHOUT WINNING ANYTHING? The owner's intuition, measured.
 *
 * The owner, 28.08, amending the sliding-window ruling on the strength of a feeling (verbatim,
 * because the claim is his and this file exists to check it rather than to agree with it):
 *
 *   «когда она только в своем коридоре, то вполне может случиться так, что она за год ни одного
 *    кубка не увидит, так что может быть всё-таки какие-то близкие outgrown и стоит оставить, чтобы
 *    можно было хотя бы где-то что-то выиграть. Иначе это вообще боль по ощущениям.»
 *
 * Four questions, in the order they have to be answered:
 *
 *   §1 THE DROUGHT ITSELF. Per career, per season: did she win ANY title at ANY rung? The
 *      distribution of CONSECUTIVE title-less seasons – median, p90, longest – and the share of
 *      careers that ever run 1, 2, 3+ of them.
 *   §2 WHO SUFFERS. The hypothesis under test is that it is the player who is WEAK FOR HER RANK –
 *      she climbed on points, cannot win inside her corridor, and the rungs below are shut to her by
 *      that same rank. Each career-season's core is compared against `coreForStanding(her rank)`,
 *      which is the professional pyramid's own statement of how strong the world number N is.
 *   §3 WHERE THE TITLES COME FROM. Bottom rung of her live corridor, middle, or spread. If they come
 *      overwhelmingly from the bottom, keeping the rung below is a fix; if they are spread, it is
 *      insurance.
 *   §4 THE CLIFF. After a season that drops her rank sharply, how many weeks pass before a lower
 *      rung actually re-opens? The hypothesis on the table is ~52 weeks, on the reading that the
 *      gates read a 52-week rolling ranking.
 *
 *   npx vite-node tools/drought-probe.ts [--seeds N] [--policy player|grinder|keepOutgrown]
 *                                        [--corridor|--noCorridor] [--json PATH]
 *
 * ⚠ MEASUREMENT ONLY. No engine constant is patched, shadowed or temporarily written; every career
 * is advanced through `stepCareerWeek`, the same public path `growth-pace-probe` and
 * `ladder-vs-targets` drive. The one policy literal this file adds (`KEEP_OUTGROWN`) is a BENCH
 * MANAGER, not an engine rule – it changes what the simulated parent enters, exactly as
 * `--policy grinder` does, and it is the only way to price the owner's amendment without touching
 * the ladder.
 *
 * ⚠⚠ WHY THE TITLE LEDGER AND NOT `bestFinishByTier`. `bestFinishByTier` is a HIGH-WATER MARK: it
 * holds one number per rung, carries no week, and cannot say whether a title was won this season or
 * nine seasons ago – which is precisely the question. `world.trophiesByTier[tier].titles` is an
 * append-only array of WEEK NUMBERS written at `world.ts:502-504` inside `finalizeTournament`, never
 * pruned (v31's own note: "five J30 titles were, until this line, one row and no years"). It is the
 * only structure in the save that can answer "which year did she last win something".
 *
 * ⚠⚠ ARM 1 IS `growth-pace-probe`'s AND IT IS NOT DECORATION. Everything read here is written by
 * `finalizeTournament`, which is reached only through `skipTournament`. `pro-season-probe.ts:388`
 * records three waves of a bench reading the body BEFORE the reveal finished and losing 57% of the
 * pro era's injury onsets to it. A title read one week early is the same defect: the cabinet has not
 * been pushed to yet. `assertResolved` therefore runs after EVERY step, and a half-revealed draw
 * throws instead of quietly under-counting silverware.
 *
 * ⚠⚠ AND THE CORRIDOR READS ARE A MEASURED HAZARD, NOT AN ASSUMED-SAFE ONE. `growth-pace-probe`'s
 * own §2c records a once-a-week `tableSize(world, 'wta')` call – a documented pure function – MOVING
 * ITS OWN CORPUS, because it reaches the memoised `fieldProsOf` at a week the engine would not have.
 * `tierOpenFor`/`hasOutgrown` reach further into that machinery than `tableSize` does. So §3 and §4's
 * per-week corridor sampling sits behind `--corridor` and the run is diffed against `--noCorridor`:
 * §1 and §2's numbers must be IDENTICAL across the two or the instrument is moving its subject and
 * the corridor half has to be quoted separately. The check is printed, not promised – see §5.
 */
import { openCareer, stepCareerWeek, PRESETS, POLICIES, type Preset, type Policy } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import {
  activeLadderOf,
  answerFork,
  answerRetirement,
  hasOutgrown,
  playDownBars,
  seasonIndexOf,
  tierOpenFor,
  PLAY_DOWN,
  type WorldState,
} from '../src/engine/world'
import { kidAgeExact } from '../src/engine/world/age'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { SKILL_KEYS } from '../src/engine/development'
import { coreForStanding } from '../src/engine/season/fieldPros'
import type { LadderTrack, TierId } from '../src/engine/season/types'
import { writeFileSync } from 'node:fs'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const argStr = (name: string): string | null => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
/** seeds PER PRESET. 9 presets x this = the corpus, the shape `how-fast-she-grows-2026-08.md` uses. */
const SEEDS = argOf('seeds', 10)
const JSON_OUT = argStr('json')

/** ⭐ THE AMENDMENT, PRICED AS A MANAGER AND NOT AS AN ENGINE CHANGE. `player` carries
 *  `skipOutgrown: true` – the parent declines the rungs she has passed, which is the corridor the
 *  owner is describing. This arm is that literal with ONE FIELD FLIPPED, so the comparison is
 *  single-variable in the sense CLAUDE.md demands: everything else (the reserve, the rest floor, her
 *  own table and up, the season coach review) is byte-identical to the arm §1 is measured on.
 *
 *  ⚠ IT IS NOT EXACTLY HIS AMENDMENT AND THIS FILE MUST NOT PRETEND IT IS. He asked for «какие-то
 *  близкие outgrown» – the two rungs nearest her. This keeps ALL of them, so it is the UPPER BOUND
 *  of what his amendment could buy. A null here is therefore a strong null (even the maximal version
 *  does nothing); a positive here is only an upper bound and the two-rung version would buy less. */
const KEEP_OUTGROWN: Policy = { ...POLICIES[1], label: 'player + keeps outgrown rungs', skipOutgrown: false }
const policyArg = argStr('policy') ?? 'player'
const POLICY: Policy =
  policyArg === 'keepOutgrown' ? KEEP_OUTGROWN : (POLICIES.find((p) => p.id === policyArg) ?? POLICIES[1])
/** default ON: §3 and §4 are half the question. `--noCorridor` builds the control arm for §5. */
const CORRIDOR = !args.includes('--noCorridor')

// -------------------------------------------------------------------------------------------------
// ARM 1 – nothing below may read a half-revealed draw
// -------------------------------------------------------------------------------------------------
function assertResolved(world: WorldState, where: string): void {
  if (world.pendingTournament !== null) {
    throw new Error(
      `drought-probe: READ BEFORE RESOLUTION at ${where} – week ${world.week} still holds a ` +
        `pendingTournament (${world.pendingTournament.eventId}). The trophy cabinet is pushed to ` +
        `inside finalizeTournament, so a read here loses titles. STOP.`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
// what one season looks like
// -------------------------------------------------------------------------------------------------
interface SeasonRow {
  seasonIndex: number
  /** her age at the first week of the season this bench actually simulated */
  age: number
  /** weeks of this season the career actually lived – a season cut short by an ending is PARTIAL */
  weeksLived: number
  complete: boolean
  /** events committed this season, by track and in total */
  events: number
  eventsByTrack: Record<LadderTrack, number>
  /** titles won this season, and at which rungs */
  titles: number
  titleTiers: TierId[]
  /** her professional-table rank at the LAST live week of the season (paid-guarded) */
  rankEnd: number | null
  /** ...and the same at the FIRST live week, so §4 can see the season move her */
  rankStart: number | null
  /** her power() mean – the same ruler `coreForStanding` and `FIELD.tiers[].core` are on */
  core: number
  /** what the pyramid says the world number `rankEnd` is worth */
  expectedCore: number | null
  /** core - expectedCore. POSITIVE = she is STRONGER than her rank implies. */
  strength: number | null
}

interface TitleRow {
  week: number
  seasonIndex: number
  tier: TierId
  age: number
  /** rung index inside her live corridor at that week, 0 = the bottom rung she may enter */
  corridorPos: number | null
  corridorWidth: number | null
  /** had she OUTGROWN the rung she won? (`hasOutgrown` – the label, not a refusal) */
  outgrown: boolean | null
  /** rung index inside the set she actually PLAYED that season, 0 = the lowest she entered */
  playedPos: number | null
  playedWidth: number | null
}

/** one week of the corridor trace, sampled only under `--corridor` */
interface CorridorWeek {
  week: number
  rank: number | null
  /** every rung `tierOpenFor` says yes to this week, as TIER_LADDER indices.
   *
   *  ⚠⚠ THIS IS NOT THE CORRIDOR AND THE FIRST VERSION OF THIS FILE MEASURED IT AS IF IT WERE.
   *  `tierOpenFor` IS `tierFloorOpen` (ladder.ts:422-424) since the owner's 06.08 ruling – «пусть
   *  играет, просто по приоритету более актуальный турнир показывать» – so a rung she has ever
   *  reached NEVER SHUTS again on the floor test, and the open set is a PREFIX `{0..H}` broken only
   *  where `playDownBars` punches a hole in the W series. Measured on it, "the bottom open rung" is
   *  `local` in every career for every week of every career, and §4's "how long until a lower rung
   *  re-opens" came back n=0 in 9 careers – not because nothing re-opens, but because nothing ever
   *  closed. Kept as the denominator, and as the thing the hole-punching is visible against. */
  open: number[]
  /** ⭐ THE CORRIDOR ITSELF – open AND not passed. `hasOutgrown` is the engine's own three-ceiling
   *  answer (`outgrewTier` OR `tierOutgrown` OR `playDownBars`, ladder.ts:944) and it is what
   *  `Snapshot.tierOutgrown` and the feed's `working` set are built from (snapshot.ts:1266,
   *  composables/tierState.ts:207-261). This is the window the owner means by «в своем коридоре»:
   *  her working rung plus the two below it, widening to four at the top. */
  working: number[]
  /** ...restricted to her ACTIVE ladder – the corridor she is actually climbing */
  workingHere: number[]
  /** the two W-series rungs `PLAY_DOWN` can bar her from, and whether they are barred THIS week */
  barredLowW: boolean
  barredAllW: boolean
}

interface Career {
  cell: string
  index: number
  weeks: number
  ending: string | null
  reachedHorizon: boolean
  seasons: SeasonRow[]
  titles: TitleRow[]
  corridor: CorridorWeek[]
  /** career-best professional rank */
  bestWta: number | null
}

const skillMeanOf = (w: WorldState): number =>
  SKILL_KEYS.reduce((a, k) => a + w.skills[k], 0) / SKILL_KEYS.length

/** `ladder-vs-targets.ts:249`'s paid guard, verbatim: a dense rank in a table where nobody holds a
 *  point ties the whole field at one, so a rank is only a place once she has been paid. */
const paidRank = (w: WorldState): number | null => {
  const raw = w.kidRankWta
  return w.careerTotals.prizeCents > 0 && typeof raw === 'number' ? raw : null
}

function zeroTracks(): Record<LadderTrack, number> {
  return { domestic: 0, itf: 0, wta: 0 }
}

function runCareer(cell: string, preset: Preset, index: number, policy: Policy): Career {
  const { world, rng } = openCareer(preset, index, policy)
  const { birthMonth, birthDay } = world.profile
  const ageAt = (week: number): number => kidAgeExact(week, birthMonth, birthDay)

  // per-season accumulators, keyed by seasonIndex
  const seasons = new Map<number, SeasonRow>()
  const titles: TitleRow[] = []
  const corridor: CorridorWeek[] = []
  /** how many titles this bench has already banked at each rung – the diff is this week's silverware */
  const seenTitles = new Map<TierId, number>()
  /** the rungs she committed to in each season, for §3's PLAYED corridor */
  const playedTiers = new Map<number, Set<TierId>>()
  let bestWta: number | null = null
  let weeks = 0

  const rowFor = (seasonIndex: number, week: number): SeasonRow => {
    let row = seasons.get(seasonIndex)
    if (row === undefined) {
      row = {
        seasonIndex,
        age: ageAt(week),
        weeksLived: 0,
        complete: false,
        events: 0,
        eventsByTrack: zeroTracks(),
        titles: 0,
        titleTiers: [],
        rankEnd: null,
        rankStart: null,
        core: 0,
        expectedCore: null,
        strength: null,
      }
      seasons.set(seasonIndex, row)
    }
    return row
  }

  for (; weeks < FULL_CAREER_WEEKS && world.ending === null; weeks++) {
    // The COMMIT week – `stepCareerWeek` enters BEFORE it ticks, so an entry belongs to this week.
    const commitWeek = world.week
    const commitSeason = seasonIndexOf(commitWeek)
    const row = rowFor(commitSeason, commitWeek)
    row.weeksLived++

    // ⚠ THE CORRIDOR IS SAMPLED BEFORE THE STEP, not after: `stepCareerWeek` asks `tierOpenFor` of
    // every candidate event itself, so a read here is a read the engine is about to make anyway.
    // It is still behind the flag – see the header note on the `tableSize` precedent.
    if (CORRIDOR) {
      const here = activeLadderOf(world)
      const open: number[] = []
      const working: number[] = []
      const workingHere: number[] = []
      for (let i = 0; i < TIER_LADDER.length; i++) {
        const t = TIER_LADDER[i]
        if (!tierOpenFor(world, t)) continue
        open.push(i)
        if (hasOutgrown(world, t)) continue
        working.push(i)
        if (TIERS[t].track === here) workingHere.push(i)
      }
      corridor.push({
        week: commitWeek,
        rank: paidRank(world),
        open,
        working,
        workingHere,
        barredLowW: playDownBars(world, PLAY_DOWN.lowW[0]),
        barredAllW: playDownBars(world, 'w75'),
      })
    }

    const entered = stepCareerWeek(world, rng, policy)
    // ⚠⚠ ARM 1. Nothing below this line may run against a half-revealed draw.
    assertResolved(world, `${cell}/${index} after step`)

    let played = playedTiers.get(commitSeason)
    if (played === undefined) {
      played = new Set()
      playedTiers.set(commitSeason, played)
    }
    for (const t of TIER_LADDER) {
      const n = entered[t]
      if (n <= 0) continue
      row.events += n
      row.eventsByTrack[TIERS[t].track] += n
      played.add(t)
    }

    // --- THE CABINET, diffed ------------------------------------------------------------------
    // `trophiesByTier[t].titles` gains a WEEK inside `finalizeTournament`. A title landing this
    // week is credited to the season the tick has stepped INTO, which is the season the week
    // number itself names – `finalizeTournament` stamps `world.week`, so the ledger's own week is
    // the authority and this file never has to decide.
    for (const t of TIER_LADDER) {
      const cabinet = world.trophiesByTier[t]
      if (cabinet === undefined) continue
      const seen = seenTitles.get(t) ?? 0
      if (cabinet.titles.length <= seen) continue
      for (let k = seen; k < cabinet.titles.length; k++) {
        const wk = cabinet.titles[k]
        const si = seasonIndexOf(wk)
        const tRow = rowFor(si, wk)
        tRow.titles++
        tRow.titleTiers.push(t)
        titles.push({
          week: wk,
          seasonIndex: si,
          tier: t,
          age: ageAt(wk),
          corridorPos: null,
          corridorWidth: null,
          outgrown: CORRIDOR ? hasOutgrown(world, t) : null,
          playedPos: null,
          playedWidth: null,
        })
      }
      seenTitles.set(t, cabinet.titles.length)
    }

    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)

    // --- the rank / strength watch, written at the LAST live week of each season ---------------
    const rank = paidRank(world)
    if (rank !== null && (bestWta === null || rank < bestWta)) bestWta = rank
    if (row.rankStart === null) row.rankStart = rank
    row.rankEnd = rank
    row.core = skillMeanOf(world)
    row.expectedCore = rank === null ? null : coreForStanding(rank)
    row.strength = rank === null ? null : row.core - coreForStanding(rank)
  }

  // §3's PLAYED corridor, resolved once the whole career is known.
  for (const t of titles) {
    const played = playedTiers.get(t.seasonIndex)
    if (played !== undefined && played.size > 0) {
      const idx = [...played].map((x) => TIER_LADDER.indexOf(x)).sort((a, b) => a - b)
      t.playedWidth = idx.length
      t.playedPos = idx.indexOf(TIER_LADDER.indexOf(t.tier))
    }
  }
  if (CORRIDOR) {
    const byWeek = new Map(corridor.map((c) => [c.week, c]))
    for (const t of titles) {
      // the corridor as it stood the week the trophy landed; the entry was taken a few weeks
      // earlier, so §3 also prints the PLAYED reading, which cannot drift at all.
      const c = byWeek.get(t.week)
      if (c === undefined || c.working.length === 0) continue
      t.corridorWidth = c.working.length
      t.corridorPos = c.working.indexOf(TIER_LADDER.indexOf(t.tier))
    }
  }

  const endingRow = world.ending
  const ending = endingRow?.type ?? null
  const rows = [...seasons.values()].sort((a, b) => a.seasonIndex - b.seasonIndex)
  for (const r of rows) r.complete = r.weeksLived >= WEEKS_PER_YEAR

  return {
    cell,
    index,
    weeks,
    ending,
    reachedHorizon: ending !== 'bankruptcy' && ending !== 'stopped' && ending !== 'college',
    seasons: rows,
    titles,
    corridor,
    bestWta,
  }
}

// -------------------------------------------------------------------------------------------------
// statistics
// -------------------------------------------------------------------------------------------------
const quantile = (xs: number[], q: number): number => {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const i = (s.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return lo === hi ? s[lo] : s[lo] + (i - lo) * (s[hi] - s[lo])
}
const meanOf = (xs: number[]): number => (xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length)
const pct = (k: number, n: number): string => (n === 0 ? '   n/a' : `${((100 * k) / n).toFixed(1)}%`)
const f1 = (x: number): string => (Number.isFinite(x) ? x.toFixed(1) : '–')
const f2 = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : '–')

/** Wilson 95%, because a share on 90 careers without an interval is a number nobody can act on. */
function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [NaN, NaN]
  const z = 1.96
  const p = k / n
  const d = 1 + (z * z) / n
  const c = p + (z * z) / (2 * n)
  const s = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return [(c - s) / d, (c + s) / d]
}
const ci = (k: number, n: number): string => {
  const [lo, hi] = wilson(k, n)
  return n === 0 ? '' : ` [${(100 * lo).toFixed(1)}–${(100 * hi).toFixed(1)}]`
}

/** Pearson r – reported with its n, and reported as "none" honestly when it is one. */
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return NaN
  const mx = meanOf(xs)
  const my = meanOf(ys)
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx
    const dy = ys[i] - my
    sxy += dx * dy
    sxx += dx * dx
    syy += dy * dy
  }
  return sxx === 0 || syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy)
}

/** ⚠⚠ A LOOP, NOT `Math.min(...xs)`, AND THAT IS A CRASH THIS FILE ALREADY TOOK. The spread form
 *  passes every element as an ARGUMENT, so on the per-career-week series §6 prints – 90 careers x
 *  1,612 weeks ~ 145,000 numbers – it blows the stack: `RangeError: Maximum call stack size
 *  exceeded`, thrown after sixteen minutes of simulation and with nothing written. It survived the
 *  9-career smoke because 14,500 arguments still fit. Every min/max over a series goes through
 *  these two. */
const minOf = (xs: readonly number[]): number => {
  let m = Infinity
  for (const x of xs) if (x < m) m = x
  return m
}
const maxOf = (xs: readonly number[]): number => {
  let m = -Infinity
  for (const x of xs) if (x > m) m = x
  return m
}

function dist(label: string, xs: number[], fmt: (x: number) => string = f2): string {
  if (xs.length === 0) return `  ${label.padEnd(44)} – (n=0)`
  return (
    `  ${label.padEnd(44)} n=${String(xs.length).padStart(5)}  ` +
    `min ${fmt(minOf(xs)).padStart(7)}  p25 ${fmt(quantile(xs, 0.25)).padStart(7)}  ` +
    `med ${fmt(quantile(xs, 0.5)).padStart(7)}  p75 ${fmt(quantile(xs, 0.75)).padStart(7)}  ` +
    `p90 ${fmt(quantile(xs, 0.9)).padStart(7)}  max ${fmt(maxOf(xs)).padStart(7)}`
  )
}

/** the longest run of consecutive `true`s in a sequence, and every run length in it */
function runs(flags: boolean[]): number[] {
  const out: number[] = []
  let cur = 0
  for (const f of flags) {
    if (f) cur++
    else if (cur > 0) {
      out.push(cur)
      cur = 0
    }
  }
  if (cur > 0) out.push(cur)
  return out
}

// -------------------------------------------------------------------------------------------------
// main
// -------------------------------------------------------------------------------------------------
function main(): void {
  const t0 = Date.now()
  const careers: Career[] = []
  console.log(
    `drought-probe · ${PRESETS.length} presets x ${SEEDS} seeds = ${PRESETS.length * SEEDS} careers · ` +
      `policy ${POLICY.label} · corridor ${CORRIDOR ? 'ON' : 'OFF'} · fourteen to the horizon ` +
      `(${FULL_CAREER_WEEKS} weeks max)`,
  )
  for (const preset of PRESETS) {
    for (let i = 0; i < SEEDS; i++) careers.push(runCareer(preset.label, preset, i, POLICY))
  }
  const all = careers.length

  // =============================================================================================
  // §1 THE DROUGHT
  // =============================================================================================
  console.log(`\n=== §1 THE DROUGHT – seasons with no title at any rung ===`)
  // ⚠ ONLY COMPLETE SEASONS COUNT. A season the career ended halfway through is not a title-less
  // year, it is half a year, and counting it would manufacture the very drought under test.
  const complete = careers.map((c) => c.seasons.filter((s) => s.complete))
  const allSeasons = complete.flat()
  const partial = careers.flatMap((c) => c.seasons.filter((s) => !s.complete)).length
  console.log(
    `  careers ${all} · complete seasons ${allSeasons.length} · partial seasons dropped ${partial} · ` +
      `reached the horizon ${pct(careers.filter((c) => c.reachedHorizon).length, all)}`,
  )
  console.log(dist('titles per complete season', allSeasons.map((s) => s.titles), f1))
  console.log(
    `  complete seasons with NO title: ${allSeasons.filter((s) => s.titles === 0).length} of ` +
      `${allSeasons.length} = ${pct(allSeasons.filter((s) => s.titles === 0).length, allSeasons.length)}` +
      `${ci(allSeasons.filter((s) => s.titles === 0).length, allSeasons.length)}`,
  )
  // ⚠ AND THE PRO-ERA SPLIT, because a title-less season at fifteen and one at twenty-six are not
  // the same complaint. His is about the corridor, which only exists once she is on the W ladder.
  const proSeasons = allSeasons.filter((s) => s.eventsByTrack.wta > 0)
  console.log(
    `  ...of the ${proSeasons.length} seasons carrying at least one PROFESSIONAL entry: ` +
      `${pct(proSeasons.filter((s) => s.titles === 0).length, proSeasons.length)}` +
      `${ci(proSeasons.filter((s) => s.titles === 0).length, proSeasons.length)}`,
  )

  const longest: number[] = []
  const everN = new Map<number, number>()
  const runLengths: number[] = []
  for (const seasons of complete) {
    const r = runs(seasons.map((s) => s.titles === 0))
    runLengths.push(...r)
    const mx = r.length === 0 ? 0 : Math.max(...r)
    longest.push(mx)
    for (let n = 1; n <= 8; n++) if (mx >= n) everN.set(n, (everN.get(n) ?? 0) + 1)
  }
  console.log(dist("each career's LONGEST title-less run (seasons)", longest, f1))
  console.log(dist('every title-less run, its length', runLengths, f1))
  console.log(`  careers that EVER run a title-less streak of at least:`)
  for (const n of [1, 2, 3, 4, 5]) {
    const k = everN.get(n) ?? 0
    console.log(`    ${n} season${n > 1 ? 's' : ''}: ${String(k).padStart(4)} of ${all} = ${pct(k, all)}${ci(k, all)}`)
  }
  const never = careers.filter((_c, i) => complete[i].every((s) => s.titles === 0)).length
  const noneEver = careers.filter((c) => c.titles.length === 0).length
  console.log(
    `  careers that NEVER win a title in any complete season: ${pct(never, all)}${ci(never, all)} · ` +
      `never win one at all, ever: ${pct(noneEver, all)}${ci(noneEver, all)}`,
  )
  // ⚠ THE AGE SPLIT, because a title-less year at fifteen and one at twenty-eight are not the same
  // complaint. His is about the adult corridor.
  console.log(`  drought rate by her age at the start of the season:`)
  for (const [lo, hi] of [[14, 17], [18, 21], [22, 25], [26, 29], [30, 99]] as const) {
    const inB = allSeasons.filter((s) => s.age >= lo && s.age < hi + 1)
    const k = inB.filter((s) => s.titles === 0).length
    console.log(
      `    ${String(lo).padStart(2)}-${hi === 99 ? '+ ' : String(hi)}  n=${String(inB.length).padStart(5)}  ` +
        `no title ${pct(k, inB.length).padStart(6)}${ci(k, inB.length)}  · mean titles ${f2(meanOf(inB.map((s) => s.titles)))}`,
    )
  }
  // ⭐ AND THE COMPLAINT HE ACTUALLY FILED (round 28 #16): «в 35 году она взяла 2 250 победой, а с тех
  // пор... В 500 вообще пусто» – a drought at the TOP of the ladder while the bottom still produces.
  const bigTiers = new Set<TierId>(TIER_LADDER.slice(TIER_LADDER.indexOf('w75')))
  const bigDry: number[] = []
  for (const seasons of complete) {
    const r = runs(seasons.map((s) => s.titleTiers.every((t) => !bigTiers.has(t))))
    bigDry.push(r.length === 0 ? 0 : Math.max(...r))
  }
  console.log(
    dist('longest run with no title at w75 OR ABOVE', bigDry, f1) +
      `\n    (seasons with a w75+ title: ${pct(allSeasons.filter((s) => s.titleTiers.some((t) => bigTiers.has(t))).length, allSeasons.length)})`,
  )

  // =============================================================================================
  // §2 WHO SUFFERS – the strength-for-rank hypothesis
  // =============================================================================================
  console.log(`\n=== §2 IS IT THE PLAYER WHO IS WEAK FOR HER RANK? ===`)
  console.log(
    `  strength = her power() mean MINUS coreForStanding(her WTA rank). POSITIVE = stronger than her\n` +
      `  rank implies (she under-ranks her game); NEGATIVE = she out-ranks her game, which is the case\n` +
      `  the hypothesis says should starve.`,
  )
  const ranked = allSeasons.filter((s) => s.strength !== null && s.rankEnd !== null)
  console.log(dist('strength, all ranked complete seasons', ranked.map((s) => s.strength as number)))
  const dry = ranked.filter((s) => s.titles === 0)
  const wet = ranked.filter((s) => s.titles > 0)
  console.log(dist('  ...seasons with NO title', dry.map((s) => s.strength as number)))
  console.log(dist('  ...seasons WITH a title', wet.map((s) => s.strength as number)))
  const r = pearson(ranked.map((s) => s.strength as number), ranked.map((s) => s.titles))
  const rBin = pearson(ranked.map((s) => s.strength as number), ranked.map((s) => (s.titles === 0 ? 1 : 0)))
  console.log(
    `  Pearson r(strength, titles that season) = ${f2(r)} · r(strength, IS a drought season) = ${f2(rBin)}  (n=${ranked.length})`,
  )
  // the split he asked for, in the plainest form there is: quartiles of strength, drought rate in each
  const qs = [0.25, 0.5, 0.75].map((q) => quantile(ranked.map((s) => s.strength as number), q))
  const bucket = (x: number): number => (x < qs[0] ? 0 : x < qs[1] ? 1 : x < qs[2] ? 2 : 3)
  const names = [
    `weakest quartile (strength < ${f1(qs[0])})`,
    `2nd (${f1(qs[0])}..${f1(qs[1])})`,
    `3rd (${f1(qs[1])}..${f1(qs[2])})`,
    `strongest (> ${f1(qs[2])})`,
  ]
  console.log(`  drought rate by strength quartile of the season:`)
  for (let b = 0; b < 4; b++) {
    const inB = ranked.filter((s) => bucket(s.strength as number) === b)
    const k = inB.filter((s) => s.titles === 0).length
    console.log(
      `    ${names[b].padEnd(34)} n=${String(inB.length).padStart(5)}  no title ${pct(k, inB.length).padStart(6)}` +
        `${ci(k, inB.length)}  · mean titles ${f2(meanOf(inB.map((s) => s.titles)))}`,
    )
  }
  // ⚠⚠ AND THE SAME SPLIT WITH AGE HELD OUT, because age is the obvious confound and the quartile
  // table above cannot see it: a fifteen-year-old is weak in absolute terms AND ranked nowhere, so
  // she can be "weak for her rank" and still sweep the local circuit. Restricted to the ADULT PRO
  // era – 20 and over, on the professional table – the confound is gone and the hypothesis has to
  // stand on its own.
  const adult = ranked.filter((s) => s.age >= 20 && s.eventsByTrack.wta > 0)
  const aq = [0.25, 0.5, 0.75].map((q) => quantile(adult.map((s) => s.strength as number), q))
  console.log(`  ...and with AGE HELD OUT (20+, professional entries only, n=${adult.length}):`)
  for (let b = 0; b < 4; b++) {
    const lo = b === 0 ? -Infinity : aq[b - 1]
    const hi = b === 3 ? Infinity : aq[b]
    const inB = adult.filter((s) => (s.strength as number) >= lo && (s.strength as number) < hi)
    const k = inB.filter((s) => s.titles === 0).length
    console.log(
      `    strength ${(b === 0 ? '  -inf' : f1(lo)).padStart(6)}..${(b === 3 ? '+inf' : f1(hi)).padStart(6)}   ` +
        `n=${String(inB.length).padStart(5)}  no title ${pct(k, inB.length).padStart(6)}${ci(k, inB.length)}` +
        `  · mean titles ${f2(meanOf(inB.map((s) => s.titles)))}`,
    )
  }
  console.log(
    `    r(strength, IS a drought season) among 20+ pros = ` +
      `${f2(pearson(adult.map((s) => s.strength as number), adult.map((s) => (s.titles === 0 ? 1 : 0))))}  (n=${adult.length})`,
  )
  // and the same question asked of the CAREER rather than the season – the owner is describing a
  // player, not a year.
  const careerStrength = careers.map((_c, i) => {
    const rs = complete[i].filter((s) => s.strength !== null)
    return { longest: longest[i], strength: rs.length === 0 ? NaN : meanOf(rs.map((s) => s.strength as number)) }
  })
  const cs = careerStrength.filter((x) => Number.isFinite(x.strength))
  console.log(
    `  career level: r(mean strength, longest title-less run) = ${f2(pearson(cs.map((x) => x.strength), cs.map((x) => x.longest)))}  (n=${cs.length})`,
  )
  // ⚠ AND THE RANK ITSELF, as the rival explanation. A drought may simply be "she is ranked low".
  const rankOf = ranked.map((s) => Math.log2(s.rankEnd as number))
  console.log(
    `  the rival explanation: r(log2 rank, IS a drought season) = ` +
      `${f2(pearson(rankOf, ranked.map((s) => (s.titles === 0 ? 1 : 0))))} · ` +
      `median rank in drought seasons #${f1(quantile(dry.map((s) => s.rankEnd as number), 0.5))} vs ` +
      `#${f1(quantile(wet.map((s) => s.rankEnd as number), 0.5))} in title seasons`,
  )

  // =============================================================================================
  // §3 WHERE THE TITLES COME FROM
  // =============================================================================================
  const allTitles = careers.flatMap((c) => c.titles)
  console.log(`\n=== §3 WHICH RUNG PRODUCES THE SILVERWARE (${allTitles.length} titles) ===`)
  const byTier = new Map<TierId, number>()
  for (const t of allTitles) byTier.set(t.tier, (byTier.get(t.tier) ?? 0) + 1)
  for (const t of TIER_LADDER) {
    const k = byTier.get(t) ?? 0
    if (k === 0) continue
    console.log(`    ${t.padEnd(10)} ${TIERS[t].track.padEnd(9)} ${String(k).padStart(5)} = ${pct(k, allTitles.length)}`)
  }
  const withPlayed = allTitles.filter((t) => t.playedPos !== null)
  console.log(
    `\n  position inside the set of rungs she ACTUALLY ENTERED that season (0 = the lowest she played):`,
  )
  const posShare = (pred: (t: TitleRow) => boolean, of: TitleRow[]): string =>
    `${String(of.filter(pred).length).padStart(5)} = ${pct(of.filter(pred).length, of.length)}${ci(of.filter(pred).length, of.length)}`
  console.log(`    the BOTTOM rung she played that season : ${posShare((t) => t.playedPos === 0, withPlayed)}`)
  console.log(`    the second from the bottom             : ${posShare((t) => t.playedPos === 1, withPlayed)}`)
  console.log(
    `    the TOP rung she played that season    : ${posShare((t) => t.playedPos === (t.playedWidth ?? 0) - 1, withPlayed)}`,
  )
  console.log(
    dist(
      '    normalised position, 0=bottom 1=top',
      withPlayed
        .filter((t) => (t.playedWidth ?? 0) > 1)
        .map((t) => (t.playedPos as number) / ((t.playedWidth as number) - 1)),
    ),
  )
  if (CORRIDOR) {
    const withCorr = allTitles.filter((t) => t.corridorPos !== null && (t.corridorPos as number) >= 0)
    const outside = allTitles.filter((t) => t.corridorPos === -1).length
    console.log(
      `\n  ...and inside the LIVE CORRIDOR (open AND not \`hasOutgrown\`) the week the trophy landed:`,
    )
    console.log(`    the BOTTOM rung of the corridor        : ${posShare((t) => t.corridorPos === 0, withCorr)}`)
    console.log(`    the middle rung                        : ${posShare((t) => t.corridorPos === 1, withCorr)}`)
    console.log(
      `    the TOP rung of the corridor           : ${posShare((t) => t.corridorPos === (t.corridorWidth ?? 0) - 1, withCorr)}`,
    )
    console.log(
      `    ⚠ won OUTSIDE the corridor entirely    : ${String(outside).padStart(5)} = ${pct(outside, allTitles.length)} ` +
        `(a rung she had already passed by the week it finished)`,
    )
    console.log(dist('    corridor width at that week', withCorr.map((t) => t.corridorWidth as number), f1))
    // ⭐⭐ THE DIRECT TEST OF HIS AMENDMENT: is a rung she has OUTGROWN still producing silverware?
    const og = allTitles.filter((t) => t.outgrown !== null)
    console.log(
      `\n  ⭐ titles won at a rung \`hasOutgrown\` calls PASSED: ` +
        `${posShare((t) => t.outgrown === true, og)}  – under a policy whose \`skipOutgrown\` is ` +
        `${POLICY.skipOutgrown ? 'TRUE (she declines them)' : 'FALSE (she plays them)'}`,
    )
  }

  // =============================================================================================
  // §4 THE CLIFF
  // =============================================================================================
  if (CORRIDOR) {
    console.log(`\n=== §4 THE CLIFF – what a slump actually does to the corridor ===`)
    // The mechanism, stated so the numbers can be read against it. `tierOpenFor` === `tierFloorOpen`
    // (ladder.ts:422). Its W arm asks `playDownBars` FIRST – a live read of `kidRankWta` against
    // PLAY_DOWN – and then the acceptance cut. Nothing on that path is latched, so the ONLY lag
    // available to it is the lag inside the RANK. §4a asks whether that is true in the trace.
    console.log(
      `  PLAY_DOWN: rank 1-${PLAY_DOWN.fromAllW} barred from every W-series event; ` +
        `1-${PLAY_DOWN.fromLowW} barred from ${PLAY_DOWN.lowW.join('/')}.`,
    )
    // §4a – THE CORRIDOR FLOOR MOVES, AND THIS IS HOW LONG IT TAKES. The corridor is the WORKING
    // set, not the open one (see `CorridorWeek.open`'s note). Its floor rises as she climbs and has
    // to fall again for a lower rung to come back.
    const reopenLag: number[] = []
    const closeLag: number[] = []
    for (const c of careers) {
      const tr = c.corridor
      for (let i = 1; i < tr.length; i++) {
        const prev = tr[i - 1]
        const cur = tr[i]
        if (prev.working.length === 0 || cur.working.length === 0) continue
        const pFloor = Math.min(...prev.working)
        const cFloor = Math.min(...cur.working)
        if (cFloor < pFloor) {
          // A LOWER RUNG CAME BACK. How long had it been out of the corridor?
          let j = i - 1
          while (j > 0 && !tr[j].working.includes(cFloor)) j--
          if (tr[j].working.includes(cFloor)) reopenLag.push(cur.week - tr[j].week)
        }
        if (cFloor > pFloor) {
          let j = i - 1
          while (j > 0 && tr[j].working.includes(pFloor)) j--
          closeLag.push(cur.week - tr[j + 1].week)
        }
      }
    }
    console.log(
      dist('weeks a rung stayed OUT of the corridor before returning', reopenLag, f1) +
        `\n    ⭐ the hypothesis on the table is ~${WEEKS_PER_YEAR} weeks; the trace says median ${f1(quantile(reopenLag, 0.5))}`,
    )
    console.log(dist('weeks a rung stayed IN the corridor before leaving', closeLag, f1))

    // §4b – THE PLAY-DOWN BAR ON ITS OWN, which is the gate whose copy he quoted. It is a pure live
    // read of `kidRankWta` against PLAY_DOWN with nothing latched, so its lag is the answer to "does
    // the gate itself hold a rung shut for a year, or does the RANK take a year to move".
    const barSpells: number[] = []
    const unbarSpells: number[] = []
    for (const c of careers) {
      const tr = c.corridor
      let runStart: number | null = null
      let runVal = false
      for (let i = 0; i < tr.length; i++) {
        const v = tr[i].barredLowW
        if (runStart === null) {
          runStart = tr[i].week
          runVal = v
          continue
        }
        if (v !== runVal) {
          ;(runVal ? barSpells : unbarSpells).push(tr[i].week - runStart)
          runStart = tr[i].week
          runVal = v
        }
      }
    }
    console.log(
      dist(`weeks ${PLAY_DOWN.lowW.join('/')} stayed BARRED in one spell`, barSpells, f1),
    )
    console.log(dist('   ...and unbarred in one spell', unbarSpells, f1))

    // §4c – the sharp-drop case he named, at the SEASON level so it is legible, measured on the
    // corridor rather than on the open prefix.
    const dropLags: number[] = []
    const dropNoReopen: number[] = []
    const dropRankBack: number[] = []
    // ⚠ THE DIAGNOSTIC, because "no lower rung ever opened" is exactly the shape a BROKEN
    // instrument produces and it must be told apart from a real null. If the floor is already at
    // the bottom of what can ever return to her, "it never falls" is arithmetic, not a defect.
    const dropFloor0: number[] = []
    const dropFloorMin: number[] = []
    for (const c of careers) {
      const byWeek = new Map(c.corridor.map((w) => [w.week, w]))
      for (let s = 1; s < c.seasons.length; s++) {
        const prev = c.seasons[s - 1]
        const cur = c.seasons[s]
        if (prev.rankEnd === null || cur.rankEnd === null) continue
        // a SHARP drop: her rank number at least half again as large as a season earlier
        if (cur.rankEnd < prev.rankEnd * 1.5) continue
        const w0 = (cur.seasonIndex + 1) * WEEKS_PER_YEAR
        const at0 = byWeek.get(w0)
        if (at0 === undefined || at0.working.length === 0) continue
        const floor0 = Math.min(...at0.working)
        let found: number | null = null
        let floorMin = floor0
        for (let w = w0; w < w0 + 3 * WEEKS_PER_YEAR; w++) {
          const wk = byWeek.get(w)
          if (wk === undefined || wk.working.length === 0) continue
          const f = Math.min(...wk.working)
          if (f < floorMin) floorMin = f
          if (f < floor0 && found === null) found = w - w0
        }
        dropFloor0.push(floor0)
        dropFloorMin.push(floorMin)
        if (found === null) dropNoReopen.push(1)
        else dropLags.push(found)
        // ...and how long the RANK itself took to give the corridor a reason to move: the first week
        // it is back inside the rank it held before the drop.
        for (let w = w0; w < w0 + 3 * WEEKS_PER_YEAR; w++) {
          const wk = byWeek.get(w)
          if (wk === undefined || wk.rank === null) continue
          if (wk.rank <= prev.rankEnd) {
            dropRankBack.push(w - w0)
            break
          }
        }
      }
    }
    console.log(
      `  after a season that made her rank at least 50% worse (n=${dropLags.length + dropNoReopen.length}):`,
    )
    console.log(dist('    weeks until a LOWER rung joins the corridor', dropLags, f1))
    console.log(
      `    no lower rung joined within 3 seasons: ${dropNoReopen.length} of ${dropLags.length + dropNoReopen.length}`,
    )
    console.log(dist('    weeks until her RANK recovers to the old mark', dropRankBack, f1))
    console.log(
      dist('    corridor floor at the drop (TIER_LADDER index)', dropFloor0, f1) +
        `\n` +
        dist('    lowest floor reached in the 3 seasons after', dropFloorMin, f1),
    )
    // ...and the floor's whole distribution over every career-week, so the reader can see whether it
    // has anywhere left to fall.
    const floors = careers.flatMap((c) => c.corridor.filter((w) => w.working.length > 0).map((w) => Math.min(...w.working)))
    console.log(dist('  the corridor floor, every career-week', floors, f1))
    const tops = careers.flatMap((c) => c.corridor.filter((w) => w.working.length > 0).map((w) => Math.max(...w.working)))
    console.log(dist('  the corridor top,   every career-week', tops, f1))
    console.log(dist('  the corridor WIDTH, every career-week', careers.flatMap((c) => c.corridor.map((w) => w.working.length)), f1))
    console.log(
      `  (TIER_LADDER indices: ${TIER_LADDER.map((t, i) => `${i}=${t}`).join(' ')})`,
    )
    const weeksAll = careers.reduce((n, c) => n + c.corridor.length, 0)
    const empty = careers.reduce((n, c) => n + c.corridor.filter((w) => w.working.length === 0).length, 0)
    console.log(`  weeks with an EMPTY corridor (nothing open she has not passed): ${pct(empty, weeksAll)} of ${weeksAll}`)
  }

  // =============================================================================================
  // §5 the reproducibility / non-interference receipts
  // =============================================================================================
  console.log(`\n=== §5 RECEIPTS ===`)
  console.log(
    `  policy ${POLICY.label} (skipOutgrown=${POLICY.skipOutgrown}, onlyHerTable=${POLICY.onlyHerTable}) · ` +
      `corridor reads ${CORRIDOR ? 'ON' : 'OFF'} · seeds ${SEEDS}/preset · ${all} careers`,
  )
  console.log(
    `  FINGERPRINT titles=${allTitles.length} seasons=${allSeasons.length} ` +
      `dry=${allSeasons.filter((s) => s.titles === 0).length} ` +
      `longestSum=${longest.reduce((a, b) => a + b, 0)} ` +
      `bestSum=${careers.reduce((a, c) => a + (c.bestWta ?? 0), 0)}`,
  )
  console.log(`  (run the same command with --noCorridor: the FINGERPRINT line must be identical.)`)
  console.log(`  elapsed ${((Date.now() - t0) / 1000).toFixed(0)}s`)

  if (JSON_OUT !== null) {
    // ⚠ THE CORRIDOR TRACE IS DROPPED – 1,612 weeks x 90 careers of rung vectors is tens of
    // megabytes and nothing downstream re-slices it. Seasons and titles are the re-sliceable half.
    writeFileSync(
      JSON_OUT,
      JSON.stringify(
        {
          policy: POLICY.label,
          skipOutgrown: POLICY.skipOutgrown,
          corridor: CORRIDOR,
          seeds: SEEDS,
          careers: careers.map((c) => ({
            cell: c.cell,
            index: c.index,
            weeks: c.weeks,
            ending: c.ending,
            bestWta: c.bestWta,
            seasons: c.seasons,
            titles: c.titles,
          })),
        },
        null,
        0,
      ),
    )
    console.log(`  wrote ${JSON_OUT}`)
  }
  console.log('')
}

// ⚠ UNCONDITIONAL, for `growth-pace-probe`'s reason: vite-node 3.2.4 strips the ENTRY FILE from
// `process.argv`, so an `argv.some(a => a.includes(...))` guard is false on a bare
// `npx vite-node tools/<file>.ts` and the bench prints nothing and exits 0. The `VITEST` clause
// stays – a test that imports this file must not run a 90-career corpus.
// ⚠ AND NEVER WITH `TB_BENCH_RUN=1`: it imports econ-bench and endings-bench, whose manual autorun
// override that variable is.
if (!process.env.VITEST) {
  main()
}
