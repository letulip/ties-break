// THE WORLD ABOVE HER – is the professional table a tour that can be climbed into, or a wall?
//
//   npx vite-node tools/world-turnover.ts [--seeds N] [--seasons N] [--no-live] [--verbose]
//
// WHY IT EXISTS. `docs/specs/money-decomposition-2026-08.md` measured 180 bench careers and found
// that the best professional rank any of them ever reached is #237, and that not one entered a
// WTA 250, 500, 1000 or Grand Slam (their acceptance cuts are #200 / #120 / #65 / #104). The
// development model's own written calibration target is "first points 17-18, top-100 about 4.5
// years later". Three probes ran on three hypotheses; this is the one that asks about the
// OPPOSITION rather than about her.
//
// THE PRIOR IS STRONG. `docs/specs/ai-w-onramp.md` had just found a closed loop of exactly this
// family on the COHORT side: the merged W standings sort on points, every derived field pro holds a
// three-figure book and every LIVE player starts on nought, so the whole cohort sat at positions
// 364+ of a 563-row table and could never be drawn into a W event at all. That was fixed for the
// cohort. The same question had never been asked about the SHAPE OF THE TABLE ITSELF.
//
// WHAT IT MEASURES, in five sections. Sections A, B, D and E are PURE DERIVATION – no world, no
// tick, no RNG the tick would walk – because the object under test (`fieldProsFor`) is itself a pure
// function of (seed, seasonIndex). Section C ticks real engine weeks.
//
//   A. THE SHAPE OF THE TABLE. The book held at each depth (#1, #10, #50, #100, #250, #364), across
//      N seasons of the same world. If the spread across seasons is ~0 the head of the world is a
//      frozen table: re-dealt every year to the same shape, so no place above her is ever vacated.
//   B. TURNOVER. Four different questions that "churn" can mean, all reported, because three of them
//      answer the wrong one:
//        · ID CHURN      – ids entering/leaving the top 100. `fp-N` is a slot, not a person.
//        · NAME CHURN    – the people. Re-dealt per season, so this is cosmetic by construction.
//        · SEAT CHURN    – how many top-100 seats a LIVE player (cohort or kid) ever holds. THIS is
//                          the one that decides whether the climb has anywhere to arrive.
//        · BOOK CHURN    – the points standing at position k, season over season. A living tour
//                          moves it; a re-dealt photograph does not.
//   C. THE LIVE RUN. The merged standings' composition by depth over N real seasons: pro / cohort /
//      kid, and how far a cohort graduate ever gets. Plus the in-season question – a pro plays the
//      canonical W draws now (W3-FIELD3), so does her book or her rank move across a season?
//   D. AGEING AND RETIREMENT. Does `fp-N` age one year per season the way a cohort player does? Does
//      anybody above her ever leave? Measured against the cohort's own conveyor as the control.
//   E. STRENGTH AS AN OPPONENT. What is standing at merged rank R, in the match engine's own terms:
//      `fastMatchProbability` for four reference builds (the owner's strong junior, and the p90 /
//      p99 / max of what `rollPotential` can ever produce) against the pro who holds that place.
//
// MEASUREMENT ONLY. No engine constant is written from here. How hard the elite should be is the
// owner's ruling and this file does not take it.

import {
  createWorld,
  tickWeek,
  inTrack,
  KID_ID,
  seasonIndexOf,
  recomputeKidRank,
  tierOpenFor,
  tierFloorOpen,
  tierOutgrown,
  isTierAgeOpen,
  ageAtWeek,
} from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking, windowedBestSum } from '../src/engine/season/ranking'
import { resumeMain } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { FIELD, fieldProsFor, isFieldProId, mergedWtaRanking, type FieldPro } from '../src/engine/season/fieldPros'
import { fastMatchProbability } from '../src/engine/match/engine'
import type { MatchPlayer } from '../src/engine/match/types'
import type { RankingRow, TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 3)
const SEASONS = argOf('seasons', 24)
const NO_LIVE = args.includes('--no-live')
const VERBOSE = args.includes('--verbose')

const DEPTHS = [1, 5, 10, 25, 50, 100, 150, 200, 250, 300, 364, 400, 500] as const
/** The acceptance cuts a career is trying to reach, straight off the catalogue. */
const CUTS: { tier: keyof typeof TIERS; at: number }[] = (
  ['w75', 'w100', 'wta125', 'wta250', 'slam', 'wta500', 'wta1000'] as const
).map((t) => ({ tier: t, at: TIERS[t].acceptsRank ?? 0 }))

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const sd = (xs: number[]) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1))
}
const f = (x: number, d = 1) => x.toFixed(d)
const pad = (s: string | number, w: number) => String(s).padStart(w)

// =================================================================================================
// A + B + D – THE DERIVED TABLE, ON ITS OWN. No world is needed: the field is `fieldProsFor(seed,
// season)` and nothing else, so N seasons of it is N calls.
// =================================================================================================

interface SeasonField {
  season: number
  pros: FieldPro[]
  /** the pro-only table, sorted exactly as `mergedWtaRanking` sorts (points desc, generation order) */
  sorted: FieldPro[]
}

function derivedSeasons(seed: string, seasons: number): SeasonField[] {
  const out: SeasonField[] = []
  for (let s = 0; s < seasons; s++) {
    // No cohort names: the collision salt only ever changes NAMES, never a skill, a point or an age
    // (fieldPros.ts, `makeFieldPro`), so the table's shape is independent of the live roster.
    const pros = fieldProsFor(seed, s, [])
    const sorted = [...pros].sort((a, b) => b.wtaPoints - a.wtaPoints)
    out.push({ season: s, pros: [...pros], sorted })
  }
  return out
}

function sectionA(runs: SeasonField[][]): void {
  console.log('\n=== A. THE SHAPE OF THE TABLE – the book held at depth k, across seasons ===')
  console.log('    (pro-only table; the LIVE cohort adds rows BELOW these, never above – see section C)')
  console.log(
    `\n  depth |     mean |      min |      max |    sd | sd/mean | REAL WTA`,
  )
  // Real-curve anchors the repo already researched (fieldPros.ts's own calibration box).
  const real: Record<number, number> = { 1: 10500, 10: 4000, 50: 1400, 100: 850, 150: 520, 300: 190, 500: 75 }
  for (const d of DEPTHS) {
    if (d > FIELD.size) continue
    const vals: number[] = []
    for (const run of runs) for (const s of run) vals.push(s.sorted[d - 1]?.wtaPoints ?? 0)
    const m = mean(vals)
    console.log(
      `  ${pad('#' + d, 5)} | ${pad(f(m, 0), 8)} | ${pad(Math.min(...vals), 8)} | ${pad(Math.max(...vals), 8)} | ${pad(f(sd(vals), 0), 5)} | ${pad(f((100 * sd(vals)) / Math.max(1, m), 1) + '%', 7)} | ${real[d] !== undefined ? real[d] : '–'}`,
    )
  }
  // The seat count above a book – the number a climbing career has to displace.
  console.log('\n  SEATS HELD BY A PRO ABOVE A GIVEN BOOK (how many people she must pass to hold it)')
  console.log(`\n   book |     mean |  min |  max |   sd`)
  for (const p of [100, 200, 350, 500, 800, 1000, 1400, 2000, 4000]) {
    const vals: number[] = []
    for (const run of runs) for (const s of run) vals.push(s.sorted.filter((x) => x.wtaPoints > p).length)
    console.log(
      `  ${pad(p, 5)} | ${pad(f(mean(vals), 1), 8)} | ${pad(Math.min(...vals), 4)} | ${pad(Math.max(...vals), 4)} | ${pad(f(sd(vals), 2), 4)}`,
    )
  }
  // ...and the same question read the other way: what book does each acceptance cut demand?
  console.log('\n  WHAT EACH ACCEPTANCE CUT COSTS IN POINTS (the book of the pro standing on the cut)')
  console.log('    ⚠ a LOWER BOUND on what she must hold: every LIVE player who passes her adds one more seat above.')
  console.log(`\n  rung        | cut  |     mean book |   min |   max`)
  for (const c of [...CUTS].sort((a, b) => b.at - a.at)) {
    if (c.at > FIELD.size) {
      console.log(`  ${String(c.tier).padEnd(11)} | ${pad('#' + c.at, 4)} |  – past the end of a ${FIELD.size}-pro table: any W point clears it`)
      continue
    }
    const vals: number[] = []
    for (const run of runs) for (const s of run) vals.push(s.sorted[c.at - 1]?.wtaPoints ?? 0)
    console.log(
      `  ${String(c.tier).padEnd(11)} | ${pad('#' + c.at, 4)} | ${pad(f(mean(vals), 0), 13)} | ${pad(Math.min(...vals), 5)} | ${pad(Math.max(...vals), 5)}`,
    )
  }
}

function sectionB(runs: SeasonField[][], seeds: string[]): void {
  console.log('\n=== B. TURNOVER – four things "churn" can mean, and only one of them is the question ===')
  const TOP = 100
  const idChurn: number[] = []
  const nameChurn: number[] = []
  const bookDelta: number[] = []
  const tierMoves: number[] = []
  for (const run of runs) {
    for (let i = 1; i < run.length; i++) {
      const prev = run[i - 1]
      const now = run[i]
      const prevIds = new Set(prev.sorted.slice(0, TOP).map((p) => p.id))
      const nowIds = now.sorted.slice(0, TOP).map((p) => p.id)
      idChurn.push(nowIds.filter((id) => !prevIds.has(id)).length)
      const prevNames = new Set(prev.sorted.slice(0, TOP).map((p) => p.name))
      nameChurn.push(now.sorted.slice(0, TOP).filter((p) => !prevNames.has(p.name)).length)
      // The book standing at each of the top-100 positions, season over season – RELATIVE, because
      // the head's absolute numbers are five times the #100's and would otherwise be the whole mean.
      let d = 0
      for (let k = 0; k < TOP; k++) {
        const a = prev.sorted[k].wtaPoints
        d += Math.abs(now.sorted[k].wtaPoints - a) / Math.max(1, a)
      }
      bookDelta.push((100 * d) / TOP)
      // Does any `fp-N` ever change storey? The literal's order IS the id order, so it cannot.
      const prevTier = new Map(prev.pros.map((p) => [p.id, p.strengthTier]))
      tierMoves.push(now.pros.filter((p) => prevTier.get(p.id) !== p.strengthTier).length)
    }
  }
  console.log(`\n  season-over-season, top ${TOP} of the derived table (${idChurn.length} transitions)`)
  console.log(`    ID CHURN    ${f(mean(idChurn), 2)} of ${TOP} ids enter the top 100 per season`)
  console.log(`    NAME CHURN  ${f(mean(nameChurn), 2)} of ${TOP} PEOPLE are new per season`)
  console.log(`    BOOK DELTA  ${f(mean(bookDelta), 1)}% mean |relative change| in the book held at a given position`)
  console.log(`    TIER MOVES  ${f(mean(tierMoves), 2)} of ${FIELD.size} pros change storey per season`)
  // The storey a given id belongs to, across every season of every seed – one line, because it is
  // the whole mechanism.
  const tierOfId = new Map<string, Set<string>>()
  for (const run of runs)
    for (const s of run)
      for (const p of s.pros) {
        let set = tierOfId.get(p.id)
        if (!set) tierOfId.set(p.id, (set = new Set()))
        set.add(p.strengthTier)
      }
  const multi = [...tierOfId.values()].filter((s) => s.size > 1).length
  console.log(
    `\n    ids whose storey EVER differs across ${runs.length} seeds x ${SEASONS} seasons: ${multi} of ${tierOfId.size}`,
  )
  // Seeds differ, seasons do not: is the table's SHAPE a per-seed fact or a global constant?
  console.log('\n  IS THE SHAPE A PER-SEED FACT? book at #100, by seed')
  for (let i = 0; i < runs.length; i++) {
    const vals = runs[i].map((s) => s.sorted[99].wtaPoints)
    console.log(
      `    ${seeds[i].padEnd(16)} mean ${pad(f(mean(vals), 0), 5)}  sd ${pad(f(sd(vals), 1), 5)}  range ${Math.min(...vals)}-${Math.max(...vals)}`,
    )
  }
}

function sectionD(runs: SeasonField[][]): void {
  console.log('\n=== D. AGEING AND RETIREMENT ABOVE HER ===')
  let aged = 0
  let same = 0
  let younger = 0
  let pairs = 0
  const dAges: number[] = []
  const left: number[] = []
  const meanAge: number[] = []
  for (const run of runs) {
    for (const s of run) meanAge.push(mean(s.pros.map((p) => p.ageYears)))
    for (let i = 1; i < run.length; i++) {
      const prev = new Map(run[i - 1].pros.map((p) => [p.id, p.ageYears]))
      for (const p of run[i].pros) {
        const was = prev.get(p.id)
        // An id with no previous season is a genuine ARRIVAL; `left` below counts the departures,
        // and both are 0 by construction because the id set is `fp-0`..`fp-363` for ever.
        if (was === undefined) continue
        pairs += 1
        const d = p.ageYears - was
        dAges.push(d)
        if (d === 1) aged += 1
        else if (d === 0) same += 1
        else if (d < 0) younger += 1
      }
      left.push(run[i - 1].pros.filter((p) => !run[i].pros.some((q) => q.id === p.id)).length)
    }
  }
  const band = FIELD.ageBand[1] - FIELD.ageBand[0] + 1
  console.log(`\n  ${pairs} (id, season -> season+1) pairs`)
  console.log(`    aged by exactly +1 : ${f((100 * aged) / pairs, 1)}%   (a real career: 100%; pure chance: ${f(100 / band, 1)}%)`)
  console.log(`    same age           : ${f((100 * same) / pairs, 1)}%`)
  console.log(`    got YOUNGER        : ${f((100 * younger) / pairs, 1)}%   (a real career: 0%)`)
  console.log(`    mean |delta age|   : ${f(mean(dAges.map(Math.abs)), 2)} years`)
  console.log(`\n    pros who LEAVE the population between seasons: ${f(mean(left), 2)} of ${FIELD.size}`)
  console.log(`    population mean age: ${f(mean(meanAge), 2)} (sd across seasons ${f(sd(meanAge), 3)})`)
  console.log(`    age band ${FIELD.ageBand[0]}-${FIELD.ageBand[1]}, drawn uniform -> expected mean ${f((FIELD.ageBand[0] + FIELD.ageBand[1]) / 2, 1)}`)
  // Does the top of the world grow old? A tour that never retires anyone would show a rising mean.
  const topAge: number[] = []
  for (const run of runs) for (const s of run) topAge.push(mean(s.sorted.slice(0, 100).map((p) => p.ageYears)))
  console.log(`    mean age of the top 100: ${f(mean(topAge), 2)} (sd ${f(sd(topAge), 3)})`)
}

// =================================================================================================
// E – STRENGTH AS AN OPPONENT. What is standing at merged rank R.
// =================================================================================================

/** A flat-core opponent/reference, built exactly as tools/field-quality.ts's storey probe builds
 *  one: bare `MatchPlayer`s on both sides, so the number is the closed form's own answer and no
 *  surface/style/condition term is smuggled in on one side only. */
const REFS: { label: string; note: string; core: number; build?: MatchPlayer }[] = [
  {
    label: 'strong junior',
    note: "the owner's ITF-#6 girl, five W15 titles in a row",
    core: 56.75,
    build: { id: 'ref', name: 'ref', serve: 66, ret: 50, composure: 57, stamina: 54, groundstrokes: 65 },
  },
  { label: 'p90 career', note: 'rollPotential p90 – a good career fully realised', core: 68.8 },
  { label: 'p99 career', note: 'rollPotential p99 – one career in a hundred', core: 73.2 },
  { label: 'max talent', note: 'rollPotential max over 20k rolls – nobody is better', core: 80.8 },
]

function flat(core: number): MatchPlayer {
  return { id: 'ref', name: 'ref', serve: core, ret: core, composure: core, stamina: core, groundstrokes: core }
}

function proMatchPlayer(p: FieldPro): MatchPlayer {
  return {
    id: p.id,
    name: p.name,
    age: p.ageYears,
    serve: p.serve,
    ret: p.ret,
    composure: p.composure,
    stamina: p.stamina,
    groundstrokes: p.groundstrokes,
  }
}

function sectionE(runs: SeasonField[][]): void {
  console.log('\n=== E. THEIR STRENGTH AS OPPONENTS – P(reference build wins), by merged rank ===')
  console.log('    closed form (fastMatchProbability), hard court, wta tour, both sides bare builds')
  const BANDS: [number, number][] = [
    [1, 10], [11, 25], [26, 50], [51, 100], [101, 150], [151, 200],
    [201, 250], [251, 300], [301, 364],
  ]
  const header = REFS.map((r) => pad(r.label, 14)).join(' |')
  console.log(`\n  rank band   |  n  | mean core | mean book | ${header}`)
  for (const [lo, hi] of BANDS) {
    const opps: FieldPro[] = []
    for (const run of runs) for (const s of run) opps.push(...s.sorted.slice(lo - 1, hi))
    const cores = opps.map((p) => (p.serve + p.ret + p.composure + p.stamina) / 4)
    const cells = REFS.map((r) => {
      const me = r.build ?? flat(r.core)
      const ps = opps.map((o) =>
        fastMatchProbability(me, proMatchPlayer(o), { surface: 'hard', tour: 'wta', seed: '' }),
      )
      return pad(f(100 * mean(ps), 1) + '%', 14)
    })
    console.log(
      `  ${pad('#' + lo + '-' + hi, 11)} | ${pad(opps.length, 3)} | ${pad(f(mean(cores), 1), 9)} | ${pad(f(mean(opps.map((p) => p.wtaPoints)), 0), 9)} | ${cells.join(' |')}`,
    )
  }
  // A title is seven matches at a 32-draw (five here – log2(32) = 5).
  const rounds = Math.log2(32)
  console.log(`\n  ...and a TITLE at a ${32}-draw is ${rounds} of those in a row (independent-match approximation):`)
  console.log(`\n  rank band   | ${REFS.map((r) => pad(r.label, 14)).join(' |')}`)
  for (const [lo, hi] of BANDS.slice(0, 6)) {
    const opps: FieldPro[] = []
    for (const run of runs) for (const s of run) opps.push(...s.sorted.slice(lo - 1, hi))
    const cells = REFS.map((r) => {
      const me = r.build ?? flat(r.core)
      const ps = opps.map((o) =>
        fastMatchProbability(me, proMatchPlayer(o), { surface: 'hard', tour: 'wta', seed: '' }),
      )
      return pad(f(100 * Math.pow(mean(ps), rounds), 2) + '%', 14)
    })
    console.log(`  ${pad('#' + lo + '-' + hi, 11)} | ${cells.join(' |')}`)
  }
}

// =================================================================================================
// C – THE LIVE RUN. Real engine weeks, the real merged standings.
// =================================================================================================

function mergedTable(world: WorldState): RankingRow[] {
  const pros = fieldProsFor(world.seed, seasonIndexOf(world.week), world.cohort.map((p) => p.name))
  const live = computeRanking(
    world.results,
    world.week,
    BEST_N_BY_TRACK.wta,
    [...world.cohort.map((p) => p.id), KID_ID],
    inTrack('wta'),
  )
  return mergedWtaRanking(live, pros)
}

interface LiveSeason {
  season: number
  /** LIVE (cohort + kid) rows inside each depth of the merged standings */
  liveAt: number[]
  /** the best LIVE non-kid merged rank, and what it took */
  bestLiveRank: number
  bestLivePoints: number
  /** cohort ids that left the world this season (the conveyor's own retirements) – the CONTROL */
  cohortLeft: number
  /** ids holding a counting W row but no longer in the cohort (retired-but-still-listed) */
  ghosts: number
  /** IN-SEASON: of the pros holding the first 100 chairs in WEEK 0 of this season, how many still
   *  hold one in WEEK 51 of the SAME season – no re-deal in between, a full season of canonical W
   *  draws played. A living tour moves this; a frozen one cannot. */
  top100Held: number
  top100MeanShift: number
  /** ACROSS THE BOUNDARY: the same 100 ids after the re-deal – the churn that is NOT competition. */
  top100HeldAfterRedeal: number
  /** her own merged rank, if she has one */
  kidRank: number
}

function runLive(seed: string): LiveSeason[] {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  const out: LiveSeason[] = []
  let season = 0
  let cohortAtStart = new Set(world.cohort.map((p) => p.id))
  // The first 100 chairs as they stood in WEEK 0 of the season now running, by POSITION rather than
  // by rank number: competition ranking collapses ~185 point-less live players onto one shared rank,
  // so "rank <= 100" and "one of the first 100 chairs" are different questions and only the second
  // one is about seats.
  let top100AtWeek0: string[] = mergedTable(world).slice(0, 100).map((r) => r.playerId)
  let endOfSeasonPos = new Map<string, number>()

  for (let w = 0; w < SEASONS * WEEKS_PER_YEAR; w++) {
    tickWeek(world, rng)
    // THE LAST WEEK OF THE SEASON, read BEFORE the boundary re-deals the field: the in-season answer.
    if (world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - 1) {
      endOfSeasonPos = new Map(mergedTable(world).map((r, i) => [r.playerId, i + 1]))
    }
    if (seasonIndexOf(world.week) === season) continue
    // Season boundary: `world.week` has crossed, so this table is the NEXT season's field.
    const table = mergedTable(world)
    const posOf = new Map(table.map((r, i) => [r.playerId, i + 1]))
    let bestLiveRank = Number.MAX_SAFE_INTEGER
    let bestLivePoints = 0
    for (const p of world.cohort) {
      const r = posOf.get(p.id)
      if (r !== undefined && r < bestLiveRank) {
        bestLiveRank = r
        bestLivePoints = windowedBestSum(world.results, world.week, p.id, BEST_N_BY_TRACK.wta, inTrack('wta'))
      }
    }
    const cohortNow = new Set(world.cohort.map((p) => p.id))
    const ghosts = new Set<string>()
    for (const r of world.results) {
      if (r.playerId === KID_ID || isFieldProId(r.playerId)) continue
      if (world.week - r.week > 52 || r.points <= 0) continue
      if (!cohortNow.has(r.playerId)) ghosts.add(r.playerId)
    }
    const shifts = top100AtWeek0.map((id) => Math.abs((endOfSeasonPos.get(id) ?? 999) - (top100AtWeek0.indexOf(id) + 1)))
    out.push({
      season,
      liveAt: DEPTHS.map(
        (d) => table.slice(0, d).filter((r) => !isFieldProId(r.playerId)).length,
      ),
      bestLiveRank: bestLiveRank === Number.MAX_SAFE_INTEGER ? -1 : bestLiveRank,
      bestLivePoints,
      cohortLeft: [...cohortAtStart].filter((id) => !cohortNow.has(id)).length,
      ghosts: ghosts.size,
      top100Held: top100AtWeek0.filter((id) => (endOfSeasonPos.get(id) ?? 999) <= 100).length,
      top100MeanShift: mean(shifts),
      top100HeldAfterRedeal: top100AtWeek0.filter((id) => (posOf.get(id) ?? 999) <= 100).length,
      kidRank: posOf.get(KID_ID) ?? -1,
    })
    season = seasonIndexOf(world.week)
    cohortAtStart = cohortNow
    top100AtWeek0 = table.slice(0, 100).map((r) => r.playerId)
  }
  return out
}

function sectionC(runs: LiveSeason[][]): void {
  console.log('\n=== C. THE LIVE RUN – the merged standings as the engine actually builds them ===')
  console.log(`    ${runs.length} worlds x ${SEASONS} seasons of real tickWeek; the kid does nothing (the question is whether the WORLD moves)`)
  console.log(`\n  LIVE (cohort + kid) players holding one of the first N CHAIRS – mean [max] over every season of every world`)
  console.log('    (chairs, not rank numbers: competition ranking puts ~185 point-less live players on ONE shared rank)')
  const all = runs.flat()
  console.log(`\n  ${DEPTHS.map((d) => pad('#' + d, 10)).join(' |')}`)
  console.log(
    `  ${DEPTHS.map((_, i) => pad(`${f(mean(all.map((s) => s.liveAt[i])), 2)} [${Math.max(...all.map((s) => s.liveAt[i]))}]`, 10)).join(' |')}`,
  )
  console.log(`\n  best cohort graduate: chair ${f(mean(all.map((s) => s.bestLiveRank)), 0)} mean, ${Math.min(...all.map((s) => s.bestLiveRank).filter((x) => x > 0))} best ever, on ${f(mean(all.map((s) => s.bestLivePoints)), 0)} pts mean`)
  console.log(`  retired-but-still-listed ids holding a counting W row in the LEDGER: ${f(mean(all.map((s) => s.ghosts)), 2)} per season boundary`)
  console.log('    (they are correctly kept OUT of the table – computeRanking treats its roster as a filter, junior-conveyor.md)')
  console.log(`\n  THE CONTROL – the cohort's own conveyor retires ${f(mean(all.map((s) => s.cohortLeft)), 1)} of 199 players a season.`)
  console.log(
    `  THE TEST    – of the 100 players holding the first 100 chairs in WEEK 0 of a season, ${f(mean(all.map((s) => s.top100Held)), 2)} still hold one`,
  )
  console.log(
    `                in WEEK 51 of the SAME season, after a full year of canonical W draws. Mean |chair shift| ${f(mean(all.map((s) => s.top100MeanShift)), 3)}.`,
  )
  console.log(
    `  THE RE-DEAL – across the season boundary the same 100 ids hold ${f(mean(all.map((s) => s.top100HeldAfterRedeal)), 2)} of the first 100 chairs. That is`,
  )
  console.log('                not competition: it is the same fixed storeys re-rolled, and the seats are the same seats.')
  if (VERBOSE) {
    console.log('\n  per-season detail, world 0')
    for (const s of runs[0]) {
      console.log(
        `    s${pad(s.season, 2)}  live-in-100 ${pad(s.liveAt[DEPTHS.indexOf(100)], 3)}  best cohort #${pad(s.bestLiveRank, 4)} (${pad(s.bestLivePoints, 4)} pts)  kid #${pad(s.kidRank, 4)}  cohort left ${pad(s.cohortLeft, 3)}  top100 held in-season ${pad(s.top100Held, 3)}  after re-deal ${pad(s.top100HeldAfterRedeal, 3)}`,
      )
    }
  }
}

// =================================================================================================
// F – THE DOOR WALK. Which rungs the merged table lets her through, as a pure function of the book
// she holds. The engine's OWN predicates (`tierOpenFor` / `tierFloorOpen` / `tierOutgrown`) read off
// a real `WorldState` whose ledger has been given a synthetic W book – the same patch-and-read idiom
// tools/best16-bench.ts uses on `BEST_N_BY_TRACK`. Nothing is written back to any file.
//
// WHY IT IS HERE AND NOT IN tools/ladder-walk.ts: that file walks a REAL career, so points, age and
// rung all move together and no single one of them can be held still. This isolates the TABLE's own
// gate – one variable, and it is the book.
// =================================================================================================

const W_RUNGS: TierId[] = ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam']

function doorWalk(seed: string): void {
  console.log('\n=== F. THE DOOR WALK – which rungs the merged table opens, by the book she holds ===')
  console.log('    engine predicates (tierOpenFor / tierFloorOpen / tierOutgrown), real WorldState, synthetic W ledger.')
  console.log('    The ITF on-ramp is latched so the ONLY variable is the professional book.')
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  // A live mid-career world: real weeks, so the cohort has its own W rows and the table she is
  // measured against is the one a career actually meets rather than week 0's all-zero one.
  const setAge = (age: number) => {
    while (ageAtWeek(world.week) < age) tickWeek(world, rng)
  }
  const books = [0, 1, 10, 30, 60, 100, 137, 160, 200, 256, 300, 345, 400, 500, 710, 828, 1000, 1177, 1400]
  const setBook = (book: number) => {
    // One synthetic W row per slice, inside the best-16 window, so the book is exactly `book` and
    // the ledger's SHAPE is not a second variable.
    world.results = world.results.filter((r) => r.playerId !== KID_ID)
    if (book > 0) {
      const per = Math.ceil(book / 16)
      let left = book
      for (let i = 0; i < 16 && left > 0; i++) {
        const pts = Math.min(per, left)
        world.results.push({ playerId: KID_ID, week: world.week - i, points: pts, tier: 'w15' })
        left -= pts
      }
    }
    // The ITF on-ramp is a LATCH in the engine (`onRampCleared`); set it directly. Nothing else
    // about the world is touched and nothing is written back to any file.
    world.onRampCleared = { itf: true, wta: true }
    recomputeKidRank(world)
  }

  for (const age of [16, 17, 18, 20]) {
    setAge(age)
    setBook(0)
    const table0 = mergedTable(world)
    const pointed = table0.filter((r) => r.points > 0).length
    console.log(
      `\n  --- AGE ${age} (week ${world.week}) – table ${table0.length} rows, ${pointed} of them holding a point ---`,
    )
    console.log(
      `      any acceptance cut looser than #${pointed} refuses nobody who holds one W point: ` +
        W_RUNGS.filter((t) => (TIERS[t].acceptsRank ?? 0) > pointed).map((t) => `${t} #${TIERS[t].acceptsRank}`).join(' · '),
    )
    console.log(`\n   W book | merged chair | open rungs                          | closed by the window`)
    for (const book of books) {
      setBook(book)
      const table = mergedTable(world)
      const chair = table.findIndex((r) => r.playerId === KID_ID) + 1
      const age0 = ageAtWeek(world.week)
      const open = W_RUNGS.filter((t) => tierOpenFor(world, t) && isTierAgeOpen(t, age0))
      const shut = W_RUNGS.filter((t) => tierFloorOpen(world, t) && tierOutgrown(world, t) && isTierAgeOpen(t, age0))
      console.log(
        `  ${pad(book, 7)} | ${pad('#' + chair, 12)} | ${open.join(' ').padEnd(35)} | ${shut.join(' ') || '–'}`,
      )
    }
    setBook(0)
  }
  console.log(
    '\n  ⚠ THE DESIGN THIS IS MEASURED AGAINST is `tierOutgrown`\'s own worked example, which names the stages\n' +
      '    {j60, j300, w15} -> {j300, w15, w35} -> {w15, w35, w50} -> {w35, w50, w75} -> ... one rung at a time.\n' +
      '    tests/tier-window.test.ts pins that slide – but it STUBS `tierFloorOpen` ("the point is the CEILING\'s\n' +
      '    arithmetic"), so nothing anywhere checks that the engine\'s real floors open one at a time.',
  )
}

// =================================================================================================

const seeds = Array.from({ length: SEEDS }, (_, i) => `world-turnover-${i}`)
console.log(
  `WORLD TURNOVER – ${SEEDS} worlds x ${SEASONS} seasons, FIELD.size ${FIELD.size}, storeys ${FIELD.tiers.map((t) => `${t.id}:${t.count}`).join(' ')}`,
)

const derived = seeds.map((s) => derivedSeasons(s, SEASONS))
sectionA(derived)
sectionB(derived, seeds)
sectionD(derived)
sectionE(derived)

if (!NO_LIVE) {
  const t0 = performance.now()
  const live = seeds.map((s) => runLive(s))
  sectionC(live)
  console.log(`\n  (live run: ${f((performance.now() - t0) / 1000, 1)}s for ${SEEDS * SEASONS * WEEKS_PER_YEAR} ticks)`)
  doorWalk('world-turnover-doors')
}
