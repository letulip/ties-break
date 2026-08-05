// THE POINTS ECONOMY – are the field's books and the player's book the same unit of account?
//
//   npx vite-node tools/points-economy.ts [--seeds N] [--age N] [--only 1,2,3]
//   npm run bench:points
//
// WHY IT EXISTS. Three probes landed in wave/endings-and-debts and between them eliminated every
// other suspect for why no career ever passes rank #237:
//
//   * docs/specs/ranking-ceiling-2026-08.md  – entry rights are not the constraint (fixed point #1).
//   * docs/specs/skill-model-audit-2026-08.md – the skill model is not the constraint (94.1%
//     realised; she is the world's #72 PLAYER and the #298 NAME on the list).
//   * docs/specs/world-strength-audit-2026-08.md – the static world was not it either (#237 -> #241).
//
// What is left is one number: HER SKILL RANK IS #72 OF 364 AND HER POINTS RANK IS #298. The
// mechanism this tool measures: the field's books are handed out in one stroke by a generator
// (`season/fieldPros.ts`, four storeys, 88..11,500 points) calibrated against the REAL WTA
// distribution, while hers is earned match by match on rungs that pay 10-125 a title. Two different
// processes produce the numbers that are then sorted into one table.
//
// THE OWNER'S RULING (04.08), quoted verbatim in docs/specs/points-economy-2026-08.md: reconcile the
// books the field is ISSUED with what a player of that strength would EARN by our own table, and
// find out the answer. So: price a pro's book through OUR OWN table and calendar.
//
// THE DERIVATION, and it is `tools/ceiling-walk.ts` inverted. That tool asks "at rank R, what does a
// PERFECT season pay?"; this one asks "at core C, what does an EXPECTED season pay?" – same doors,
// same sliding window, same real calendar, same one-entry-a-week rule, same best-16 fold, and the
// engine's own `mergedWtaRanking` for the book -> rank map. The only thing that changes is that each
// entered event pays its closed-form expectation against that rung's field instead of the title.
//
// ⚠ IT IS A FIXED POINT, because the window a player is offered depends on the rank her book buys.
// Start her at the bottom of the table, earn a season, read the rank, re-open the window there, and
// repeat until it stops moving. That is the same iteration the ceiling walk runs and for the same
// reason: a rung's supply is a function of standing, so "what does a player of core C earn" has no
// answer until you say where she stands, and where she stands is what you are computing.
//
// ⚠ SCALE INVARIANCE IS WHAT MAKES THIS WELL-POSED, AND IT IS ONLY HALF TRUE – §5a of the spec.
// Every gate in the ladder is RANK-denominated (`acceptsRank`) or PERCENTILE-denominated
// (`entrantPctBand`), so re-pricing the table's rows moves nobody's window: the field composition at
// a rung is a function of the points ORDER, not of the points SCALE. But the shipped storeys' CORE
// bands overlap while their points bands did not, so a re-pricing that makes points monotone in core
// also re-ORDERS the middle of the table – measured at up to 3.7 core points of drift in a rung's
// field. The derivation is therefore one step of a fixed point, not its limit, and §0 prints the
// rung fields on whichever arm it is run against so the drift is visible.
//
// THE SECTIONS. 0 the rungs and the control · 1 the issue in the field's own numbers · 2 the earn
// curve and 2a the ladder's valley · 3 the player · 4 what the real curve costs in win rate · 5 the
// self-consistent bands · 6 what the engine's own season would have paid each pro · 7 the four
// pricings (real / ladder / doors / free) · 8 how steep our field is against real WTA Elo · 9 the
// window sweep · 10 the earn curve as a table `fieldPros.ts` could carry · 11 the core-to-Elo
// exchange rate · 12 the compressed-field arm · 13 the arm-comparable seven-measurement block.
//
// MEASUREMENT ONLY. It calls engine predicates and counts. No engine number is written from here.

import { createWorld, acceptanceRank } from '../src/engine/world'
import {
  TIERS,
  TIER_LADDER,
  buildSeason,
  isTierAgeOpen,
  WEEKS_PER_YEAR,
} from '../src/engine/season/calendar'
import { BEST_N_BY_TRACK } from '../src/engine/season/ranking'
import { ECONOMY } from '../src/engine/economy'
import { power } from '../src/engine/season/cohort'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { selectEntrants } from '../src/engine/season/tournament'
import { rngFromSeed } from '../src/engine/rng'
import { fastMatchProbability } from '../src/engine/match/engine'
import {
  FIELD,
  fieldProsFor,
  mergedWtaRanking,
  universeForTier,
  type FieldPro,
} from '../src/engine/season/fieldPros'
import type { MatchPlayer } from '../src/engine/match/types'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 8)
const AGE = argOf('age', 24)
const ONLY = (() => {
  const i = args.indexOf('--only')
  return i >= 0 && args[i + 1] ? new Set(args[i + 1].split(',')) : null
})()
const wants = (s: string) => !ONLY || ONLY.has(s)

const W_RUNGS: readonly TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
const SEASON_BLOCK = 5
const PROBE_SEED = 'points-economy'
const PROBE_SEASON = 4

const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  if (!s.length) return 0
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 100) => '-'.repeat(n)

// =================================================================================================
// 0. THE WORLD UNDER TEST, and the rungs' fields
// =================================================================================================

const probeWorld = createWorld(`${PROBE_SEED}-doors`)
const DOORS = new Map<TierId, number | undefined>()
for (const t of W_RUNGS) DOORS.set(t, acceptanceRank(probeWorld, t))

const PROS = fieldProsFor(`${PROBE_SEED}-world`, PROBE_SEASON)
const CORE_OF = new Map<string, number>(PROS.map((p) => [p.id, power(p)]))

/** THE MERGED TABLE'S ROW COUNT, which the `entrantPctBand` shares are denominated in: the 364
 *  derived pros plus the LIVE cohort. Taken off a real world rather than spelled out. */
const TABLE_ROWS = PROS.length + probeWorld.cohort.length

/** WHO A RUNG'S FIELD IS – the ENGINE's own answer, `selectEntrants` run on real events of the rung
 *  against the real merged universe. Not a model of the band: the band is only the window, and the
 *  position bias (`key = position + rng x 32`), the age gate and the backfill all move the answer.
 *
 *  ⚠ CHECKED AGAINST THE MEASURED NUMBERS RATHER THAN TRUSTED. `tools/field-quality.ts` ran this
 *  same function over six W rungs on ticked worlds and calendar.ts records the answer (48.5 / 50.4 /
 *  55.1 / 60.0 / 65.9 / 70.7). Reproducing those six is what licenses the four rungs nobody has ever
 *  measured – 250/500/1000/Slam, which no career in the bench has ever entered. §0 prints both. */
function fieldCoreOf(tier: TierId): number {
  const live = probeWorld.cohort.map((p) => ({ playerId: p.id, points: 0, rank: 1 }))
  const ranking = mergedWtaRanking(live, PROS)
  const universe = universeForTier(tier, probeWorld.cohort, PROS)
  const cores: number[] = []
  for (let s = 0; s < 6; s++) {
    for (const e of seasonEvents(`fieldcore-${s}`, SEASON_BLOCK)) {
      if (e.tier !== tier) continue
      const rng = rngFromSeed(`${PROBE_SEED}:fieldcore:${e.id}`)
      const entrants = selectEntrants(e, universe, ranking, rng)
      cores.push(mean(entrants.map((p) => power(p))))
    }
  }
  return mean(cores)
}

/** The six W2-FIELD2 numbers as calendar.ts records them – the control for the approximation. */
const MEASURED_FIELD_CORE: Partial<Record<TierId, number>> = {
  w15: 48.5,
  w35: 50.4,
  w50: 55.1,
  w75: 60.0,
  w100: 65.9,
  wta125: 70.7,
}

const FIELD_CORE = new Map<TierId, number>()
for (const t of W_RUNGS) FIELD_CORE.set(t, fieldCoreOf(t))

// =================================================================================================
// 1. THE WINDOW – the same model ceiling-walk.ts verified against the engine, 4,500 pairs identical
// =================================================================================================

const WINDOW_RUNGS = 3
const TERMINAL_RUNGS = 4

function floorOpen(tier: TierId, rank: number): boolean {
  const accepts = DOORS.get(tier)
  if (accepts === undefined) return true
  return rank <= accepts
}
function outgrown(tier: TierId, rank: number, age: number, windowRungs = WINDOW_RUNGS): boolean {
  if (windowRungs <= 0) return false
  const i = TIER_LADDER.indexOf(tier)
  if (i < 0 || i >= TIER_LADDER.length - TERMINAL_RUNGS) return false
  const above = TIER_LADDER[i + windowRungs]
  if (!above) return false
  if (!isTierAgeOpen(above, age)) return false
  return floorOpen(above, rank)
}
function openAt(rank: number, age: number, windowRungs = WINDOW_RUNGS): TierId[] {
  return W_RUNGS.filter(
    (t) => isTierAgeOpen(t, age) && floorOpen(t, rank) && !outgrown(t, rank, age, windowRungs),
  )
}

// =================================================================================================
// 2. THE EARN CURVE – what OUR OWN table and calendar pay a player of core C
// =================================================================================================

function flatPlayer(core: number, id: string, age = 24): MatchPlayer {
  return { id, name: id, serve: core, ret: core, composure: core, stamina: core, groundstrokes: core, age }
}

/** P(a player of core C beats the mean member of `tier`'s field), closed form, both fresh. */
const pCache = new Map<string, number>()
function pWin(core: number, tier: TierId): number {
  const key = `${core.toFixed(3)} ${tier}`
  const hit = pCache.get(key)
  if (hit !== undefined) return hit
  const p = fastMatchProbability(
    flatPlayer(core, 'me'),
    flatPlayer(FIELD_CORE.get(tier) ?? 50, tier),
    { surface: 'hard', tour: 'wta', seed: '' },
  )
  pCache.set(key, p)
  return p
}

/** E[points] for ONE event of `tier` at per-match probability `p`. A draw of size D is log2(D)
 *  rounds of the same coin, so the finish distribution is closed form and `TIERS[tier].points`
 *  prices it. Rounds come off the tier's own `drawSize` rather than a hard-coded five: the Slam and
 *  the 1000s ship at 32 today but the field is read, not assumed. */
function expectedPoints(tier: TierId, p: number): number {
  const pts = TIERS[tier].points
  const rounds = Math.round(Math.log2(TIERS[tier].drawSize))
  let e = 0
  for (let lost = 0; lost <= rounds; lost++) {
    // lost = 0 -> champion (rounds wins); lost = k -> she won (rounds - k) then lost one.
    const wins = rounds - lost
    const prob = lost === 0 ? Math.pow(p, rounds) : Math.pow(p, wins) * (1 - p)
    // `points` is indexed champion-first and is exactly `rounds + 1` long on every shipped W rung;
    // clamp anyway so a future draw-size change degrades instead of reading undefined.
    e += prob * (pts[Math.min(lost, pts.length - 1)] ?? 0)
  }
  return e
}

interface EarnedSeason {
  book: number
  entered: number
  slots: number
  perTier: Map<TierId, number>
}

/** THE SEASON A PLAYER OF CORE C EARNS AT RANK R – the real calendar, one entry a week, the AER
 *  allowance, best-16.
 *
 *  ⚠ THE GREEDY IS ON EXPECTED VALUE, NOT ON TITLE VALUE, and that is the one place this differs
 *  from ceiling-walk's. A perfect player always prefers the bigger title; a real one may prefer a
 *  W75 she can win to a WTA 1000 where she loses in the first round for 65. Sorting on E[points]
 *  makes the schedule the one a rational player would actually pick, which is the honest upper bound
 *  on what she can HOLD. (It is still a partition matroid – one event per week – so greedy on the
 *  weight is optimal.) */
function earnSeason(core: number, rank: number, age: number, events: SeasonEvent[]): EarnedSeason {
  const open = new Set(openAt(rank, age))
  const value = new Map<TierId, number>()
  for (const t of open) value.set(t, expectedPoints(t, pWin(core, t)))
  const candidates = events
    .filter((e) => open.has(e.tier))
    .sort((a, b) => (value.get(b.tier) ?? 0) - (value.get(a.tier) ?? 0) || a.week - b.week)
  const limit = ECONOMY.entryCap.proPerYearByAge[age] ?? ECONOMY.entryCap.proPerYearByAge.default
  const weeks = new Set<number>()
  const values: number[] = []
  const perTier = new Map<TierId, number>()
  for (const e of candidates) {
    if (weeks.has(e.week)) continue
    if (values.length >= limit) continue
    weeks.add(e.week)
    values.push(value.get(e.tier) ?? 0)
    perTier.set(e.tier, (perTier.get(e.tier) ?? 0) + 1)
  }
  values.sort((a, b) => b - a)
  const counted = values.slice(0, BEST_N_BY_TRACK.wta)
  return {
    book: counted.reduce((s, x) => s + x, 0),
    entered: values.length,
    slots: counted.length,
    perTier,
  }
}

// --- the book -> rank map, folded by the engine over the real merged table -------------------------

/** The same question against ONE derived field, with no live rows at all – the pure table. Used for
 *  the storey derivation, where the live cohort is not part of the question. */
function rankInField(points: number, pros: readonly FieldPro[] = PROS): number {
  const merged = mergedWtaRanking([{ playerId: 'probe', points, rank: 0 }], pros)
  return merged.find((r) => r.playerId === 'probe')?.rank ?? merged.length
}

function seasonEvents(seed: string, block: number): SeasonEvent[] {
  return buildSeason(`${seed}:s${block}`, block * WEEKS_PER_YEAR, WEEKS_PER_YEAR)
}
const EVENTS: SeasonEvent[][] = Array.from({ length: SEEDS }, (_, s) =>
  seasonEvents(`points-economy-${s}`, SEASON_BLOCK),
)

interface EarnPoint {
  core: number
  book: number
  rank: number
  window: TierId[]
  entered: number
  steps: number
}

/** THE FIXED POINT for a player of core `core`: climb from the bottom of the table until the rank
 *  her book buys stops moving. Deliberately started from UNRANKED, so nothing is assumed about where
 *  she "should" be – the ladder is walked from the on-ramp exactly as a career walks it. */
function earnFixedPoint(core: number, age = AGE, maxSteps = 16): EarnPoint {
  let rank = TABLE_ROWS
  let last: { book: number; entered: number; window: TierId[] } = { book: 0, entered: 0, window: [] }
  let steps = 0
  const seen = new Set<number>()
  for (let n = 0; n < maxSteps; n++) {
    steps = n + 1
    const window = openAt(rank, age)
    const books: number[] = []
    const entereds: number[] = []
    for (let s = 0; s < SEEDS; s++) {
      const season = earnSeason(core, rank, age, EVENTS[s])
      books.push(season.book)
      entereds.push(season.entered)
    }
    const book = median(books)
    last = { book, entered: mean(entereds), window }
    const next = Math.round(median(Array.from({ length: SEEDS }, () => rankInField(Math.round(book)))))
    if (next === rank || seen.has(next)) {
      rank = next
      break
    }
    seen.add(rank)
    rank = next
  }
  return { core, book: Math.round(last.book), rank, window: last.window, entered: last.entered, steps }
}

// =================================================================================================
// THE REPORT
// =================================================================================================

console.log(rule())
console.log('THE POINTS ECONOMY – are the field\'s books and the player\'s book the same unit?')
console.log(`  ${SEEDS} calendars · age ${AGE} · best-${BEST_N_BY_TRACK.wta} · merged table ${TABLE_ROWS} rows`)
console.log(rule())

// -------------------------------------------------------------------------------------------------
if (wants('0')) {
  console.log('\n0. THE RUNGS – who is in the field, and the control for the four nobody has measured')
  console.log('   rung      accepts to   title   draw   E-field core   MEASURED (field-quality)   delta')
  for (const t of W_RUNGS) {
    const a = DOORS.get(t)
    const m = MEASURED_FIELD_CORE[t]
    const c = FIELD_CORE.get(t) ?? 0
    console.log(
      `   ${padE(t, 9)} ${pad(a === undefined ? 'on-ramp' : '#' + a, 10)}   ${pad(TIERS[t].points[0], 5)}` +
        `   ${pad(TIERS[t].drawSize, 4)}   ${pad(c.toFixed(1), 12)}   ${pad(m === undefined ? '-' : m.toFixed(1), 24)}` +
        `   ${pad(m === undefined ? '-' : (c - m).toFixed(1), 5)}`,
    )
  }
}

// -------------------------------------------------------------------------------------------------
if (wants('1')) {
  console.log('\n1. THE ISSUE, IN THE FIELD\'S OWN NUMBERS – skill order against points order')
  console.log(
    '   For every derived pro: her POINTS rank (the table as shipped) against her SKILL rank (how',
  )
  console.log('   many of the other 363 beat her more often than not, closed form, both fresh).')
  // Skill rank inside the field: sort by core. (Core order and pairwise-beat order agree for flat
  // builds; the pros are not flat, so this is computed pairwise and the disagreement is reported.)
  const byPoints = [...PROS].sort((a, b) => b.wtaPoints - a.wtaPoints)
  const pointsRank = new Map<string, number>()
  byPoints.forEach((p, i) => pointsRank.set(p.id, i + 1))

  const builds = new Map<string, MatchPlayer>(
    PROS.map((p) => [p.id, rivalMatchPlayer(p, 'hard', ECONOMY.condition.max)]),
  )
  const skillRank = new Map<string, number>()
  for (const p of PROS) {
    let losses = 0
    const me = builds.get(p.id)!
    for (const q of PROS) {
      if (q.id === p.id) continue
      if (fastMatchProbability(me, builds.get(q.id)!, { surface: 'hard', tour: 'wta', seed: '' }) < 0.5) losses++
    }
    skillRank.set(p.id, losses + 1)
  }
  const xs = PROS.map((p) => skillRank.get(p.id)!)
  const ys = PROS.map((p) => pointsRank.get(p.id)!)
  console.log(`   Spearman(skill rank, points rank) over the field: ${spearman(xs, ys).toFixed(3)}`)
  console.log(`   mean |skill rank - points rank| : ${mean(PROS.map((p) => Math.abs(skillRank.get(p.id)! - pointsRank.get(p.id)!))).toFixed(1)} places`)
}

function spearman(a: number[], b: number[]): number {
  const n = a.length
  const ra = rankify(a)
  const rb = rankify(b)
  const ma = mean(ra)
  const mb = mean(rb)
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < n; i++) {
    num += (ra[i] - ma) * (rb[i] - mb)
    da += (ra[i] - ma) ** 2
    db += (rb[i] - mb) ** 2
  }
  return num / Math.sqrt(da * db)
}
function rankify(xs: number[]): number[] {
  const idx = xs.map((x, i) => ({ x, i })).sort((p, q) => p.x - q.x)
  const out = new Array<number>(xs.length)
  idx.forEach((e, r) => (out[e.i] = r + 1))
  return out
}

// -------------------------------------------------------------------------------------------------
if (wants('2')) {
  console.log('\n2. THE EARN CURVE – what OUR table and calendar pay a player of core C, per season')
  console.log('   (fixed point: climb from unranked, re-open the window at the rank the book buys)')
  console.log(
    '   core   skill rank   window at the fixed point                          entered   EARNED   -> rank   ISSUED   ratio',
  )
  const CORES = [38, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 77, 80, 85]
  const issuedAt = issuedBookFor()
  for (const core of CORES) {
    const e = earnFixedPoint(core)
    const issued = issuedAt(core)
    console.log(
      `   ${pad(core, 4)}   ${pad('#' + skillRankOfCore(core), 10)}   ${padE(e.window.join(',') || '(nothing)', 48)} ${pad(e.entered.toFixed(1), 7)}` +
        `   ${pad(e.book, 6)}   ${pad('#' + e.rank, 6)}   ${pad(issued === null ? '-' : Math.round(issued), 6)}` +
        `   ${pad(issued === null || issued === 0 ? '-' : (issued / Math.max(1, e.book)).toFixed(1) + 'x', 6)}`,
    )
  }

  // ⚠ THE TRAP. The ceiling walk proved there is no band where a PERFECT player's window slides into
  // rungs worth less than the ones it closed. That proof does not survive a real win rate: a rung
  // that pays five times more per title is worth LESS to a player who loses in the second round. So
  // the same sweep, in EXPECTED points, at every band – and it is not monotone.
  console.log('\n2a. THE SAME PLAYER, PINNED AT EACH BAND – is her book monotone in her standing?')
  const BANDS = [400, 350, 300, 250, 200, 150, 120, 100, 75, 50, 25, 10, 1]
  console.log(`   core   ${BANDS.map((b) => pad('#' + b, 7)).join('')}`)
  for (const core of [48, 54, 60, 66, 72, 77]) {
    const cells = BANDS.map((b) =>
      pad(Math.round(median(EVENTS.map((ev) => bookAtCore(core, b, AGE, ev)))), 7),
    )
    console.log(`   ${pad(core, 4)}   ${cells.join('')}`)
  }
}

/** What the SHIPPED generator issues to a pro of core C – read off the population itself rather than
 *  re-implemented, so this column stays honest whichever pricing the engine carries. Median book of
 *  every pro within ±1 core point; null when the population holds nobody there. */
function issuedBookFor(): (core: number) => number | null {
  return (core: number) => {
    const near = PROS.filter((p) => Math.abs(power(p) - core) <= 1).map((p) => p.wtaPoints)
    return near.length ? median(near) : null
  }
}

// -------------------------------------------------------------------------------------------------
if (wants('3')) {
  console.log('\n3. THE PLAYER – the three builds the skill audit measured, priced the same way')
  const BUILDS: { label: string; core: number }[] = [
    { label: 'median managed career (skill #72)', core: 59.6 },
    { label: 'best managed career (skill #27)', core: 64.1 },
    { label: 'top-of-band prodigy (skill #21)', core: 73.1 },
    { label: 'the athletic ceiling (skill #1)', core: 84.8 },
  ]
  console.log('   build                                 core   EARNED book   -> rank   skill rank in this field')
  for (const b of BUILDS) {
    const e = earnFixedPoint(b.core)
    const sr = skillRankOfCore(b.core)
    console.log(
      `   ${padE(b.label, 36)} ${pad(b.core.toFixed(1), 6)}   ${pad(e.book, 11)}   ${pad('#' + e.rank, 6)}   ${pad('#' + sr, 8)}`,
    )
  }
}

function skillRankOfCore(core: number): number {
  const me = flatPlayer(core, 'me')
  let losses = 0
  for (const p of PROS) {
    const opp = rivalMatchPlayer(p, 'hard', ECONOMY.condition.max)
    if (fastMatchProbability(me, opp, { surface: 'hard', tour: 'wta', seed: '' }) < 0.5) losses++
  }
  return losses + 1
}

// -------------------------------------------------------------------------------------------------
if (wants('4')) {
  console.log('\n4. THE SCALE QUESTION – what the real WTA curve costs in win rate')
  console.log('   For each anchor of the real curve, the per-match probability a player would need')
  console.log('   against her own band\'s field to earn that book on OUR calendar.')
  console.log('   rank   REAL book   window at that rank                              p needed   our best core reaches')
  const ANCHORS: { rank: number; real: number }[] = [
    { rank: 1, real: 10500 },
    { rank: 10, real: 4000 },
    { rank: 50, real: 1400 },
    { rank: 100, real: 850 },
    { rank: 150, real: 520 },
    { rank: 300, real: 190 },
  ]
  for (const a of ANCHORS) {
    const window = openAt(a.rank, AGE)
    // bisect on a flat per-match probability applied to every open rung
    let lo = 0
    let hi = 1
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      const book = median(EVENTS.map((ev) => bookAtFlatP(mid, a.rank, AGE, ev)))
      if (book >= a.real) hi = mid
      else lo = mid
    }
    const best = median(EVENTS.map((ev) => bookAtCore(85, a.rank, AGE, ev)))
    console.log(
      `   ${pad('#' + a.rank, 5)}   ${pad(a.real, 9)}   ${padE(window.join(','), 46)}   ${pad(hi >= 0.999 ? '>0.999' : hi.toFixed(3), 8)}` +
        `   ${pad(Math.round(best), 10)} pts`,
    )
  }
}

function bookAtFlatP(p: number, rank: number, age: number, events: SeasonEvent[]): number {
  const open = new Set(openAt(rank, age))
  const value = new Map<TierId, number>()
  for (const t of open) value.set(t, expectedPoints(t, p))
  return foldSeason(events, open, value, age)
}
function bookAtCore(
  core: number,
  rank: number,
  age: number,
  events: SeasonEvent[],
  windowRungs = WINDOW_RUNGS,
): number {
  const open = new Set(openAt(rank, age, windowRungs))
  const value = new Map<TierId, number>()
  for (const t of open) value.set(t, expectedPoints(t, pWin(core, t)))
  return foldSeason(events, open, value, age)
}
function foldSeason(
  events: SeasonEvent[],
  open: Set<TierId>,
  value: Map<TierId, number>,
  age: number,
): number {
  const limit = ECONOMY.entryCap.proPerYearByAge[age] ?? ECONOMY.entryCap.proPerYearByAge.default
  const weeks = new Set<number>()
  const values: number[] = []
  for (const e of events
    .filter((x) => open.has(x.tier))
    .sort((a, b) => (value.get(b.tier) ?? 0) - (value.get(a.tier) ?? 0) || a.week - b.week)) {
    if (weeks.has(e.week) || values.length >= limit) continue
    weeks.add(e.week)
    values.push(value.get(e.tier) ?? 0)
  }
  values.sort((a, b) => b - a)
  return values.slice(0, BEST_N_BY_TRACK.wta).reduce((s, x) => s + x, 0)
}

// -------------------------------------------------------------------------------------------------
if (wants('5')) {
  console.log('\n5. THE SELF-CONSISTENT BANDS – what each storey WOULD carry if its book were earned')
  console.log('   storey        core band     issued at lo/hi        earned at lo    earned at hi')
  const issuedNear = issuedBookFor()
  for (const tier of FIELD.tiers) {
    const [lo, hi] = tier.core
    const eLo = earnFixedPoint(lo)
    const eHi = earnFixedPoint(hi)
    console.log(
      `   ${padE(tier.id, 12)}  ${padE(`${lo}-${hi}`, 12)}` +
        `  ${padE(`${Math.round(issuedNear(lo) ?? 0)}-${Math.round(issuedNear(hi) ?? 0)}`, 20)}` +
        `  ${pad(eLo.book, 12)}    ${pad(eHi.book, 12)}`,
    )
  }
  // The shape inside a band: where does the earn curve bend? gamma is fitted to it in §6 of the spec.
  console.log('\n   the earn curve inside each band (for the gamma fit):')
  for (const tier of FIELD.tiers) {
    const [lo, hi] = tier.core
    const cells = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const c = lo + (hi - lo) * t
      return `${t.toFixed(2)}->${earnFixedPoint(c).book}`
    })
    console.log(`   ${padE(tier.id, 12)}  ${cells.join('  ')}`)
  }
}

// =================================================================================================
// 6. THE SCHEDULE THE ENGINE ACTUALLY DEALS HER – the honest reading of "what our table would pay"
// =================================================================================================
//
// §2 asks what the LADDER would permit a climbing player of core C. That is the right question for
// the KID, whose entries are gated by `tierOpenFor`. It is the wrong question for a FIELD PRO: she
// never asks that gate. `selectEntrants` puts her in a draw when her POSITION falls inside the
// rung's `entrantPctBand`, and the engine already runs those draws every week – it simply throws the
// result away (`runAiTournament` skips the ledger row for an `fp-` id).
//
// So the literal answer to the owner's question is: RUN THE SEASON THE ENGINE ALREADY RUNS, and
// count what it would have paid. No model of who plays where; the engine's own selection, the
// engine's own week-exclusivity rule, the tier's own points array, and the same best-16 fold every
// LIVE player is folded by.
//
// ⚠ EXPECTED, NOT SIMULATED, and deliberately: a bracket is one sample and a book is a season's
// worth of them, so pricing each appearance by its closed-form expectation against THAT event's own
// field removes a variance that would otherwise need hundreds of runs to see through. The finish
// distribution is exact for a knockout of equal-strength rounds; the approximation is that every
// opponent is the field's mean rather than the specific woman on the other side of the net.

interface ProSeason {
  id: string
  core: number
  storey: string
  issued: number
  earned: number
  events: number
}

function proSeasonBooks(seed: string, block: number): ProSeason[] {
  const live = probeWorld.cohort.map((p) => ({ playerId: p.id, points: 0, rank: 1 }))
  const ranking = mergedWtaRanking(live, PROS)
  const season = seasonEvents(seed, block)
  const perPro = new Map<string, number[]>()
  const wEvents = season.filter((e) => TIERS[e.tier].track === 'wta')
  const byWeek = new Map<number, SeasonEvent[]>()
  for (const e of wEvents) {
    const list = byWeek.get(e.week)
    if (list) list.push(e)
    else byWeek.set(e.week, [e])
  }
  for (const [, evs] of byWeek) {
    // Strongest rung first, exactly as `weekFieldExclusion` resolves a shared week: one body, one
    // week, and the higher rung draws first.
    const ordered = [...evs].sort(
      (a, b) =>
        TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier) ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    )
    const booked = new Set<string>()
    for (const e of ordered) {
      const universe = universeForTier(e.tier, probeWorld.cohort, PROS)
      const rng = rngFromSeed(`${seed}:kidtour:${e.id}`)
      const entrants = selectEntrants(e, universe, ranking, rng, undefined, booked)
      const cores = entrants.map((p) => CORE_OF.get(p.id) ?? power(p))
      const total = cores.reduce((a, b) => a + b, 0)
      for (let i = 0; i < entrants.length; i++) {
        booked.add(entrants[i].id)
        const p = entrants[i]
        if (!CORE_OF.has(p.id)) continue
        // the field she meets is everyone else in this draw
        const oppCore = (total - cores[i]) / Math.max(1, cores.length - 1)
        const pw = fastMatchProbability(
          rivalMatchPlayer(p as FieldPro, 'hard', ECONOMY.condition.max),
          flatPlayer(oppCore, 'field'),
          { surface: 'hard', tour: 'wta', seed: '' },
        )
        const list = perPro.get(p.id)
        const v = expectedPoints(e.tier, pw)
        if (list) list.push(v)
        else perPro.set(p.id, [v])
      }
    }
  }
  return PROS.map((p) => {
    const vals = (perPro.get(p.id) ?? []).sort((a, b) => b - a)
    return {
      id: p.id,
      core: power(p),
      storey: p.strengthTier,
      issued: p.wtaPoints,
      earned: vals.slice(0, BEST_N_BY_TRACK.wta).reduce((s, x) => s + x, 0),
      events: vals.length,
    }
  })
}

if (wants('6')) {
  console.log('\n6. WHAT THE ENGINE\'S OWN SEASON WOULD HAVE PAID EACH PRO (selectEntrants, best-16)')
  const runs = Array.from({ length: SEEDS }, (_, s) => proSeasonBooks(`points-economy-${s}`, SEASON_BLOCK))
  const byId = new Map<string, { core: number; storey: string; issued: number; earned: number[]; events: number[] }>()
  for (const run of runs) {
    for (const r of run) {
      const cur = byId.get(r.id)
      if (cur) {
        cur.earned.push(r.earned)
        cur.events.push(r.events)
      } else byId.set(r.id, { core: r.core, storey: r.storey, issued: r.issued, earned: [r.earned], events: [r.events] })
    }
  }
  const rows = [...byId.entries()].map(([id, v]) => ({
    id,
    core: v.core,
    storey: v.storey,
    issued: v.issued,
    earned: median(v.earned),
    events: mean(v.events),
  }))
  console.log('   storey        n     mean core   events/season   ISSUED (median)   EARNED (median)   ratio')
  for (const tier of FIELD.tiers) {
    const s = rows.filter((r) => r.storey === tier.id)
    console.log(
      `   ${padE(tier.id, 12)}  ${pad(s.length, 4)}  ${pad(mean(s.map((r) => r.core)).toFixed(1), 9)}` +
        `   ${pad(mean(s.map((r) => r.events)).toFixed(1), 13)}   ${pad(Math.round(median(s.map((r) => r.issued))), 15)}` +
        `   ${pad(Math.round(median(s.map((r) => r.earned))), 15)}   ${pad((median(s.map((r) => r.issued)) / Math.max(1, median(s.map((r) => r.earned)))).toFixed(1) + 'x', 5)}`,
    )
  }
  const all = rows
  console.log(
    `\n   population total: issued ${Math.round(all.reduce((s, r) => s + r.issued, 0)).toLocaleString('en-US')} pts` +
      ` · earned ${Math.round(all.reduce((s, r) => s + r.earned, 0)).toLocaleString('en-US')} pts` +
      ` · ratio ${(all.reduce((s, r) => s + r.issued, 0) / Math.max(1, all.reduce((s, r) => s + r.earned, 0))).toFixed(2)}x`,
  )
  const sortedEarn = [...all].sort((a, b) => b.earned - a.earned)
  console.log(
    '   the EARNED table\'s head: ' +
      [1, 10, 50, 100, 150, 200, 300, 364]
        .map((k) => `#${k} ${Math.round(sortedEarn[k - 1]?.earned ?? 0)}`)
        .join(' · '),
  )
  const sortedIssue = [...all].sort((a, b) => b.issued - a.issued)
  console.log(
    '   the ISSUED table\'s head: ' +
      [1, 10, 50, 100, 150, 200, 300, 364]
        .map((k) => `#${k} ${Math.round(sortedIssue[k - 1]?.issued ?? 0)}`)
        .join(' · '),
  )
  // How well each pricing agrees with the skill order.
  const cores = all.map((r) => r.core)
  console.log(
    `\n   Spearman(core, issued) ${spearman(cores, all.map((r) => r.issued)).toFixed(3)}` +
      ` · Spearman(core, earned) ${spearman(cores, all.map((r) => r.earned)).toFixed(3)}`,
  )
  // and the earn curve by core decile, which is what a new pts band has to reproduce
  console.log('\n   the earn curve by core, over the whole population:')
  const byCore = [...all].sort((a, b) => a.core - b.core)
  for (let q = 0; q < 10; q++) {
    const lo = Math.floor((q * byCore.length) / 10)
    const hi = Math.floor(((q + 1) * byCore.length) / 10)
    const s = byCore.slice(lo, hi)
    console.log(
      `     decile ${q + 1}  core ${pad(mean(s.map((r) => r.core)).toFixed(1), 5)}` +
        `  issued ${pad(Math.round(median(s.map((r) => r.issued))), 6)}  earned ${pad(Math.round(median(s.map((r) => r.earned))), 6)}` +
        `  events ${pad(mean(s.map((r) => r.events)).toFixed(1), 5)}`,
    )
  }
}

// =================================================================================================
// 7. THE THREE PRICINGS AT EACH RANK – which of the routes the numbers support
// =================================================================================================
//
// §6 answers "what does the engine's own season pay her" and finds that 150 of 364 professionals are
// never drawn into a single event, so their honest book is zero. That is a fact about
// `selectEntrants`' bands, not about a player of that strength: the KID of the same core enters
// fourteen to twenty-one events a season. Pricing the field on an accident of the draw and the
// player on a full season would compare two different things – and would hand her the middle of the
// table for nothing, which is the failure mode this whole wave is guarded against.
//
// So the pricing that can be compared like with like is: WHAT WOULD A PLAYER OF THIS STRENGTH EARN
// IF SHE PLAYED THE SEASON THE LADDER OFFERS HER AT THAT STANDING? Three columns, and the gaps
// between them are the three routes:
//
//   REAL      – the real WTA curve's book at that rank (the calibration act2-pro-tour.md §11 hit)
//   LADDER    – our table, our calendar, the SHIPPED sliding window at that rank
//   FREE      – our table, our calendar, and any rung she likes (the window relaxed entirely)
//
// LADDER < REAL and FREE ~ REAL  => the LADDER's shape is the culprit (route b).
// FREE < REAL at every rank      => the TABLES pay too little (route a).
// FREE ~ LADDER, both < REAL     => neither; the scale is simply different (route c).

/** The core standing at skill rank R of this field – the population's own strength curve. */
const CORE_BY_RANK = [...PROS].map((p) => power(p)).sort((a, b) => b - a)
function coreAtRank(rank: number): number {
  return CORE_BY_RANK[Math.max(0, Math.min(CORE_BY_RANK.length - 1, rank - 1))]
}

/** Her book if she may enter ANY W rung she can physically fit – window relaxed, doors relaxed.
 *
 *  ⚠ READ THIS COLUMN WITH THE FIRST-ROUND CHEQUE IN MIND. Removing `acceptsRank` lets a #300 player
 *  into four Grand Slams and eight WTA 1000s, where our own points arrays pay a first-round loser
 *  130 and 65 – real WTA rows, and the reason the column reads ~1,050 for every rank below #150. It
 *  is not "the calendar could pay her that"; it is "participation money at rungs the doors exist to
 *  keep her out of". The DOORS column below is the honest one. */
function freeBook(core: number, age: number, events: SeasonEvent[]): number {
  const open = new Set(W_RUNGS.filter((t) => isTierAgeOpen(t, age)))
  const value = new Map<TierId, number>()
  for (const t of open) value.set(t, expectedPoints(t, pWin(core, t)))
  return foldSeason(events, open, value, age)
}

/** Her book with the ACCEPTANCE CUTS respected but nothing ever closing beneath her – `tierOutgrown`
 *  off. This is the one arm that separates the ladder's SLIDING WINDOW from its DOORS, and the gap
 *  between it and LADDER is exactly what the window's closure costs a static population. */
function doorsBook(core: number, rank: number, age: number, events: SeasonEvent[]): number {
  const open = new Set(W_RUNGS.filter((t) => isTierAgeOpen(t, age) && floorOpen(t, rank)))
  const value = new Map<TierId, number>()
  for (const t of open) value.set(t, expectedPoints(t, pWin(core, t)))
  return foldSeason(events, open, value, age)
}

if (wants('7')) {
  console.log('\n7. THE FOUR PRICINGS – real curve vs our ladder vs the doors alone vs no rule at all')
  console.log('   rank   core there   REAL book   ISSUED   LADDER   DOORS-only   FREE   window at that rank')
  const REAL: { rank: number; book: number }[] = [
    { rank: 1, book: 10500 },
    { rank: 10, book: 4000 },
    { rank: 25, book: 2200 },
    { rank: 50, book: 1400 },
    { rank: 75, book: 1050 },
    { rank: 100, book: 850 },
    { rank: 150, book: 520 },
    { rank: 200, book: 350 },
    { rank: 250, book: 260 },
    { rank: 300, book: 190 },
    { rank: 364, book: 130 },
  ]
  const issuedSorted = [...PROS].map((p) => p.wtaPoints).sort((a, b) => b - a)
  for (const r of REAL) {
    const core = coreAtRank(r.rank)
    const ladder = median(EVENTS.map((ev) => bookAtCore(core, r.rank, AGE, ev)))
    const doorsOnly = median(EVENTS.map((ev) => doorsBook(core, r.rank, AGE, ev)))
    const free = median(EVENTS.map((ev) => freeBook(core, AGE, ev)))
    console.log(
      `   ${pad('#' + r.rank, 5)}   ${pad(core.toFixed(1), 10)}   ${pad(r.book, 9)}   ${pad(issuedSorted[r.rank - 1], 6)}` +
        `   ${pad(Math.round(ladder), 6)}   ${pad(Math.round(doorsOnly), 10)}   ${pad(Math.round(free), 4)}   ${openAt(r.rank, AGE).join(',')}`,
    )
  }
  console.log(
    '\n   ⚠ the FREE column is an upper bound on what OUR TABLE can pay a player of that strength on',
  )
  console.log('     OUR CALENDAR: perfect entry, no fatigue, no money, best rung she can pick, best-16.')
}

// =================================================================================================
// 8. THE FIELD'S OWN STRENGTH SPREAD, against real tennis
// =================================================================================================
//
// If a player at rank R cannot earn rank R's book, either the book is too big or she is too weak
// FOR HER OWN RANK. The second is measurable and has a real-world control: how often does the
// higher-ranked player beat the lower-ranked one? Real WTA (Elo/market implied) is a famously FLAT
// curve – the world #1 beats the world #100 about 85% of the time, not 99%.

if (wants('8')) {
  console.log('\n8. HOW STEEP IS OUR FIELD – P(the field\'s #A beats the field\'s #B)')
  const builds = [...PROS]
    .sort((a, b) => power(b) - power(a))
    .map((p) => rivalMatchPlayer(p, 'hard', ECONOMY.condition.max))
  const pAt = (a: number, b: number) =>
    fastMatchProbability(builds[a - 1], builds[b - 1], { surface: 'hard', tour: 'wta', seed: '' })
  const PAIRS: { a: number; b: number; real: number }[] = [
    { a: 1, b: 10, real: 0.68 },
    { a: 1, b: 50, real: 0.8 },
    { a: 1, b: 100, real: 0.85 },
    { a: 10, b: 50, real: 0.66 },
    { a: 10, b: 100, real: 0.73 },
    { a: 50, b: 100, real: 0.58 },
    { a: 50, b: 150, real: 0.62 },
    { a: 100, b: 200, real: 0.58 },
    { a: 100, b: 300, real: 0.65 },
    { a: 150, b: 300, real: 0.6 },
    { a: 200, b: 364, real: 0.57 },
  ]
  console.log('   pair          our P     real WTA (approx)   delta')
  for (const p of PAIRS) {
    const ours = pAt(p.a, p.b)
    console.log(
      `   #${padE(p.a + ' v #' + p.b, 12)} ${pad((100 * ours).toFixed(1) + '%', 6)}    ${pad((100 * p.real).toFixed(0) + '%', 12)}` +
        `        ${pad(((ours - p.real) * 100).toFixed(1) + 'pp', 7)}`,
    )
  }
  const cores = builds.map((_, i) => power([...PROS].sort((a, b) => power(b) - power(a))[i]))
  console.log(
    `\n   core spread over the 364: #1 ${cores[0].toFixed(1)} · #50 ${cores[49].toFixed(1)} · #100 ${cores[99].toFixed(1)}` +
      ` · #200 ${cores[199].toFixed(1)} · #364 ${cores[363].toFixed(1)}  (range ${(cores[0] - cores[363]).toFixed(1)} points of core)`,
  )
}

// =================================================================================================
// 9. WHAT THE WINDOW'S WIDTH IS WORTH TO A REAL PLAYER (the ceiling walk measured it for a perfect one)
// =================================================================================================

if (wants('9')) {
  console.log('\n9. THE WINDOW SWEEP – the same earn curve at WINDOW_RUNGS 3 (shipped), 4, 5 and off')
  const BANDS = [400, 300, 250, 200, 150, 120, 100, 75, 50]
  for (const w of [3, 4, 5, 0]) {
    console.log(`\n   WINDOW_RUNGS ${w === 0 ? 'OFF (nothing ever closes)' : w}`)
    console.log(`   core   ${BANDS.map((b) => pad('#' + b, 7)).join('')}   monotone?`)
    for (const core of [48, 54, 60, 66, 72]) {
      const vals = BANDS.map((b) => Math.round(median(EVENTS.map((ev) => bookAtCore(core, b, AGE, ev, w)))))
      let mono = true
      for (let i = 1; i < vals.length; i++) if (vals[i] < vals[i - 1]) mono = false
      console.log(`   ${pad(core, 4)}   ${vals.map((v) => pad(v, 7)).join('')}   ${mono ? 'yes' : 'NO'}`)
    }
  }
}

// =================================================================================================
// 10. THE DERIVATION – the earn curve as a table `fieldPros.ts` can carry
// =================================================================================================
//
// THE OWNER'S EXPERIMENT, built. A pro of core C stands at the rank her STRENGTH puts her at (the
// field's own core order – nothing about the points scale enters, which is what makes this one step
// rather than a fixed point). The ladder opens a window at that rank; the real calendar supplies the
// events; her closed-form finish distribution against each rung's real field prices them; best-16
// folds them. That number IS her book.
//
// ⚠ MONOTONISED BY RUNNING MAXIMUM, and the places where that bites are the finding of §2a: the
// window is monotone in TITLE value and not in EXPECTED value, so the raw curve dips wherever a rung
// she can win closes underneath a rung she cannot. A points table that dipped there would rank a
// stronger player below a weaker one for ever, which is the exact defect this wave exists to remove.
// The dips are printed beside the monotonised value so nothing is hidden.

if (wants('10')) {
  console.log('\n10. THE EARN CURVE AS A TABLE – core -> the book our own economy pays')
  console.log('    core   skill rank   window there                                     RAW    MONOTONE   shipped')
  const issuedAt = issuedBookFor()
  const GRID: number[] = []
  for (let c = 34; c <= 82; c += 2) GRID.push(c)
  let running = 0
  const out: { core: number; book: number }[] = []
  for (const core of GRID) {
    const rank = skillRankOfCore(core)
    const raw = Math.round(median(EVENTS.map((ev) => bookAtCore(core, rank, AGE, ev))))
    running = Math.max(running, raw)
    out.push({ core, book: running })
    const issued = issuedAt(core)
    console.log(
      `    ${pad(core, 4)}   ${pad('#' + rank, 10)}   ${padE(openAt(rank, AGE).join(','), 46)} ${pad(raw, 6)}` +
        `   ${pad(running, 8)}${raw < running ? ' <- dip' : ''}   ${pad(issued === null ? '-' : Math.round(issued), 7)}`,
    )
  }
  console.log('\n    as a literal for FIELD.earnCurve (core, book):')
  console.log('      ' + out.map((o) => `[${o.core}, ${o.book}]`).join(', '))
}

// =================================================================================================
// 11. THE EXCHANGE RATE – how many core points is one place in the table worth?
// =================================================================================================
//
// §8 says our field is far too steep in the middle and slightly too flat at the head. This section
// prices that in the only unit both sides share: the match engine's own core -> probability curve,
// read as an Elo scale, against real WTA Elo (Tennis Abstract's published curve, rounded).

const REAL_ELO: { rank: number; elo: number }[] = [
  { rank: 1, elo: 2200 },
  { rank: 10, elo: 2050 },
  { rank: 25, elo: 1965 },
  { rank: 50, elo: 1900 },
  { rank: 100, elo: 1830 },
  { rank: 150, elo: 1790 },
  { rank: 200, elo: 1755 },
  { rank: 300, elo: 1705 },
  { rank: 364, elo: 1685 },
  // ⚠ THE TAIL IS EXTRAPOLATED, NOT PUBLISHED, AND IT IS LABELLED SO (population-1600, 05.08). The
  // curve above is Tennis Abstract's, which stops where a top-364 study stops. A 1,600-strong table
  // needs the tail, and the only honest way to get it is the curve's own slope: #200 -> #300 is
  // -284 Elo per decade of rank and #300 -> #364 is -239, so -250 is the tail's own gradient read
  // off its last two published segments. Used ONLY by the compressed-field arms (§12, §14b); no
  // shipped constant is derived from a row below this line without that being said where it lands.
  { rank: 520, elo: 1646 },
  { rank: 1000, elo: 1575 },
  { rank: 1600, elo: 1524 },
]

if (wants('11')) {
  console.log('\n11. THE EXCHANGE RATE – core points per Elo point, and the spread each implies')
  console.log('    delta core   P(stronger wins)   implied Elo gap')
  const BASE = 55
  const rows: { d: number; p: number; elo: number }[] = []
  for (const d of [1, 2, 4, 6, 8, 10, 14, 18, 22, 26, 30]) {
    const p = fastMatchProbability(flatPlayer(BASE + d, 'a'), flatPlayer(BASE, 'b'), {
      surface: 'hard',
      tour: 'wta',
      seed: '',
    })
    const elo = -400 * Math.log10(1 / Math.min(0.9999, p) - 1)
    rows.push({ d, p, elo })
    console.log(`    ${pad(d, 10)}   ${pad((100 * p).toFixed(1) + '%', 16)}   ${pad(elo.toFixed(0), 15)}`)
  }
  // Local slope near the middle of the field: Elo per core point.
  const slope = rows[5].elo / rows[5].d
  console.log(`\n    ~${slope.toFixed(0)} Elo per core point around core ${BASE}.`)
  console.log(
    `    REAL WTA #1..#364 spans ${REAL_ELO[0].elo - REAL_ELO[REAL_ELO.length - 1].elo} Elo` +
      ` = ${((REAL_ELO[0].elo - REAL_ELO[REAL_ELO.length - 1].elo) / slope).toFixed(1)} core points.`,
  )
  console.log(
    `    OURS spans ${(CORE_BY_RANK[0] - CORE_BY_RANK[CORE_BY_RANK.length - 1]).toFixed(1)} core points` +
      ` = ${((CORE_BY_RANK[0] - CORE_BY_RANK[CORE_BY_RANK.length - 1]) * slope).toFixed(0)} Elo.`,
  )
  console.log('\n    the real curve translated into cores, anchored on our own world #1:')
  const top = CORE_BY_RANK[0]
  for (const r of REAL_ELO) {
    const core = top - (REAL_ELO[0].elo - r.elo) / slope
    console.log(
      `      #${padE(r.rank, 5)} real Elo ${pad(r.elo, 5)}  ->  core ${pad(core.toFixed(1), 5)}` +
        `   (ours: ${CORE_BY_RANK[Math.min(CORE_BY_RANK.length - 1, r.rank - 1)].toFixed(1)})`,
    )
  }
}

// =================================================================================================
// 12. THE OTHER DIRECTION – compress the FIELD'S STRENGTH instead of deflating its BOOKS
// =================================================================================================
//
// "Align the field's issued books with what a player of that strength would earn by our own table"
// has two solutions and §10 only builds one of them. The other one holds the books – which are a
// faithful copy of the real WTA curve, and act2-pro-tour.md §11 calls that a deliberate achievement –
// and moves the STRENGTH, which is the side with no real-world calibration behind its spread
// (`FIELD.tiers`' cores were derived from `rollPotential`'s output band, a fact about the PLAYER).
//
// This arm re-deals the field's cores off the real Elo curve at our engine's own exchange rate
// (§11), re-measures every rung's field, and asks the same question: does a player of the core that
// now stands at rank R earn rank R's book?
//
// ⚠ HYPOTHETICAL, AND NOTHING IS WRITTEN. The arm re-prices field cores in a local copy; the shipped
// FIELD table is untouched by this file.

if (wants('12')) {
  console.log('\n12. THE COMPRESSED-FIELD ARM – the real Elo curve, translated at our exchange rate')
  const slope = (() => {
    const p = fastMatchProbability(flatPlayer(65, 'a'), flatPlayer(55, 'b'), {
      surface: 'hard',
      tour: 'wta',
      seed: '',
    })
    return -400 * Math.log10(1 / p - 1) / 10
  })()
  const TOP = CORE_BY_RANK[0]
  const eloAt = (rank: number): number => {
    const pts = REAL_ELO
    if (rank <= pts[0].rank) return pts[0].elo
    for (let i = 1; i < pts.length; i++) {
      if (rank <= pts[i].rank) {
        const t = (Math.log(rank) - Math.log(pts[i - 1].rank)) / (Math.log(pts[i].rank) - Math.log(pts[i - 1].rank))
        return pts[i - 1].elo + t * (pts[i].elo - pts[i - 1].elo)
      }
    }
    return pts[pts.length - 1].elo
  }
  /** core of the pro standing at rank R under the compressed curve */
  const coreAtRankC = (rank: number) => TOP - (REAL_ELO[0].elo - eloAt(rank)) / slope

  // Re-measure each rung's field under the compressed cores: the SAME positions are drawn (the bands
  // are percentile-denominated and the order does not change), so a rung's field core is the mean of
  // `coreAtRankC` over the positions `selectEntrants` actually picked in §0.
  const live = probeWorld.cohort.map((p) => ({ playerId: p.id, points: 0, rank: 1 }))
  const ranking = mergedWtaRanking(live, PROS)
  const posOf = new Map(ranking.map((r, i) => [r.playerId, i + 1]))
  const compressedFieldCore = new Map<TierId, number>()
  for (const t of W_RUNGS) {
    const universe = universeForTier(t, probeWorld.cohort, PROS)
    const picks: number[] = []
    for (let s = 0; s < 4; s++) {
      for (const e of seasonEvents(`fieldcore-${s}`, SEASON_BLOCK)) {
        if (e.tier !== t) continue
        const rng = rngFromSeed(`${PROBE_SEED}:fieldcore:${e.id}`)
        for (const p of selectEntrants(e, universe, ranking, rng)) {
          const pos = posOf.get(p.id) ?? ranking.length
          picks.push(pos <= PROS.length ? coreAtRankC(pos) : coreAtRankC(PROS.length))
        }
      }
    }
    compressedFieldCore.set(t, mean(picks))
  }
  console.log('    rung      field core NOW   field core COMPRESSED')
  for (const t of W_RUNGS) {
    console.log(
      `    ${padE(t, 9)} ${pad((FIELD_CORE.get(t) ?? 0).toFixed(1), 14)}   ${pad((compressedFieldCore.get(t) ?? 0).toFixed(1), 21)}`,
    )
  }

  const pWinC = (core: number, tier: TierId) =>
    fastMatchProbability(flatPlayer(core, 'me'), flatPlayer(compressedFieldCore.get(tier) ?? 50, tier), {
      surface: 'hard',
      tour: 'wta',
      seed: '',
    })
  const bookC = (core: number, rank: number, events: SeasonEvent[]): number => {
    const open = new Set(openAt(rank, AGE))
    const value = new Map<TierId, number>()
    for (const t of open) value.set(t, expectedPoints(t, pWinC(core, t)))
    return foldSeason(events, open, value, AGE)
  }
  console.log('\n    rank   core now -> compressed   REAL book   EARNED under compression   ratio')
  for (const r of [1, 10, 25, 50, 75, 100, 150, 200, 250, 300, 364]) {
    const cNow = CORE_BY_RANK[Math.min(CORE_BY_RANK.length - 1, r - 1)]
    const cNew = coreAtRankC(r)
    const real = [10500, 4000, 2200, 1400, 1050, 850, 520, 350, 260, 190, 130][
      [1, 10, 25, 50, 75, 100, 150, 200, 250, 300, 364].indexOf(r)
    ]
    const earned = median(EVENTS.map((ev) => bookC(cNew, r, ev)))
    console.log(
      `    ${pad('#' + r, 5)}   ${pad(cNow.toFixed(1) + ' -> ' + cNew.toFixed(1), 20)}   ${pad(real, 9)}` +
        `   ${pad(Math.round(earned), 24)}   ${pad((earned / real).toFixed(2) + 'x', 5)}`,
    )
  }
  // And what it does to the two things the compression would cost.
  console.log('\n    what it costs: the reference strong junior (power 56.75) against each rung')
  console.log('    rung      P(match) NOW   P(match) COMPRESSED   P(title, 5 rounds) NOW -> COMPRESSED')
  for (const t of W_RUNGS) {
    const now = fastMatchProbability(flatPlayer(56.75, 'ref'), flatPlayer(FIELD_CORE.get(t) ?? 50, t), {
      surface: 'hard',
      tour: 'wta',
      seed: '',
    })
    const comp = pWinC(56.75, t)
    console.log(
      `    ${padE(t, 9)} ${pad((100 * now).toFixed(1) + '%', 12)}   ${pad((100 * comp).toFixed(1) + '%', 19)}` +
        `   ${pad((100 * Math.pow(now, 5)).toFixed(1) + '%', 10)} -> ${pad((100 * Math.pow(comp, 5)).toFixed(1) + '%', 8)}`,
    )
  }
}

// =================================================================================================
// 13. THE SEVEN MEASUREMENTS – the arm-comparable summary block
// =================================================================================================
//
// One block, printed identically on both arms of the A/B, so the spec's before/after table is a diff
// of two runs and not a hand-assembled collection. Measurements 2, 6 and 7 need real careers and
// live in `npm run bench:money`; 1, 3, 4 and 5 are table facts and live here.

if (wants('13')) {
  console.log('\n13. THE SEVEN MEASUREMENTS (table half – careers are bench:money)')

  // --- 1. ability rank vs points rank, over the whole population -----------------------------------
  const builds = new Map<string, MatchPlayer>(
    PROS.map((p) => [p.id, rivalMatchPlayer(p, 'hard', ECONOMY.condition.max)]),
  )
  const skillRank = new Map<string, number>()
  for (const p of PROS) {
    let losses = 0
    const me = builds.get(p.id)!
    for (const q of PROS) {
      if (q.id === p.id) continue
      if (fastMatchProbability(me, builds.get(q.id)!, { surface: 'hard', tour: 'wta', seed: '' }) < 0.5) losses++
    }
    skillRank.set(p.id, losses + 1)
  }
  const byPoints = [...PROS].sort((a, b) => b.wtaPoints - a.wtaPoints)
  const pointsRank = new Map<string, number>()
  byPoints.forEach((p, i) => pointsRank.set(p.id, i + 1))
  const xs = PROS.map((p) => skillRank.get(p.id)!)
  const ys = PROS.map((p) => pointsRank.get(p.id)!)
  console.log(
    `  1. FIELD  Spearman(skill, points) ${spearman(xs, ys).toFixed(3)} · mean |skill - points| ` +
      `${mean(PROS.map((p) => Math.abs(skillRank.get(p.id)! - pointsRank.get(p.id)!))).toFixed(1)} places`,
  )
  // ...and the same question for HER, which is the headline the wave exists for.
  for (const b of [
    { label: 'median managed career', core: 59.6 },
    { label: 'best managed career', core: 64.1 },
    { label: 'top-of-band prodigy', core: 73.1 },
  ]) {
    const sr = skillRankOfCore(b.core)
    const e = earnFixedPoint(b.core)
    console.log(
      `     ${padE(b.label, 24)} core ${b.core.toFixed(1)}  SKILL #${pad(sr, 3)}  ->  earns ${pad(e.book, 5)} pts  ->  POINTS #${e.rank}`,
    )
  }

  // --- 3. the table's shape ------------------------------------------------------------------------
  const live = probeWorld.cohort.map((p) => ({ playerId: p.id, points: 0, rank: 1 }))
  const merged = mergedWtaRanking(live, PROS)
  const REAL: Record<number, number> = { 1: 10500, 10: 4000, 50: 1400, 100: 850, 150: 520, 250: 260, 300: 190 }
  console.log(
    '  3. SHAPE  ' +
      [1, 10, 50, 100, 150, 250, 300].map((k) => `#${k} ${merged[k - 1].points}(real ${REAL[k]})`).join(' · '),
  )
  console.log(
    `     rows holding any points: ${merged.filter((r) => r.points > 0).length} of ${merged.length}`,
  )

  // --- 4. do the doors still gate? -----------------------------------------------------------------
  console.log('  4. DOORS  rung / acceptsRank / the book standing on that cut / does the cut refuse anybody?')
  for (const t of W_RUNGS) {
    const cut = DOORS.get(t)
    if (cut === undefined) {
      console.log(`     ${padE(t, 9)} on-ramp`)
      continue
    }
    const row = merged[Math.min(merged.length - 1, cut - 1)]
    const pointed = merged.filter((r) => r.points > 0).length
    console.log(
      `     ${padE(t, 9)} #${padE(cut, 5)} book ${pad(row.points, 6)}` +
        `   ${cut >= merged.length ? 'INERT (past the table)' : cut > pointed ? 'INERT (past the pointed rows)' : 'gates'}`,
    )
  }

  // --- 5. the prodigy ------------------------------------------------------------------------------
  console.log(
    `  5. PRODIGY  core 73.1 is SKILL #${skillRankOfCore(73.1)} of ${PROS.length}; her earned book ` +
      `${earnFixedPoint(73.1).book} pts sits at POINTS #${earnFixedPoint(73.1).rank}`,
  )

  // --- 7. cost -------------------------------------------------------------------------------------
  // The pricing is the only thing that changed, so the honest measurement is the derivation itself:
  // a cold `fieldProsFor` for 364 pros, memo defeated by walking distinct seasons. The tick never
  // calls it more than once per (seed, season, cohort names).
  {
    const t0 = Date.now()
    let acc = 0
    for (let s = 0; s < 200; s++) acc += fieldProsFor(`cost-${s % 5}`, s)[0].wtaPoints
    const ms = Date.now() - t0
    console.log(
      `  7. COST  200 cold fieldProsFor derivations (${200 * FIELD.size} pros) in ${ms} ms ` +
        `= ${(ms / 200).toFixed(2)} ms per season-boundary derivation  [checksum ${acc}]`,
    )
  }

  // --- the pacing pin, printed on both arms ---------------------------------------------------------
  // tests/season/fieldPros.test.ts's honest-rank promise: five W15 titles is 50 W points, and the
  // number the pin exists to kill is a two-figure world ranking for a season at the ENTRY rung.
  for (const book of [10, 50, 100, 250, 500, 1000]) {
    const merged2 = mergedWtaRanking([{ playerId: 'kid', points: book, rank: 0 }], PROS)
    const r = merged2.find((x) => x.playerId === 'kid')?.rank ?? merged2.length
    console.log(`     a LIVE book of ${pad(book, 5)} pts stands at #${r} of ${merged2.length}`)
  }
}

// =================================================================================================
// 14. THE TAPER – the owner's approved title-chance ladder, measured for HER AT HER OWN RUNG
// =================================================================================================
//
// THE TARGET, approved verbatim (docs/specs/population-1600-2026-08.md): W15/W35 15-35% · W50/W75/
// W100 10-20% · WTA 125/250 5-12% · 500/1000 2-6% · Slam rare. His reasoning governs the design –
// «иначе это вообще боль, у нас всё-таки игра» – against the counter-pressure that a flat band
// everywhere makes the rung she stands on meaningless.
//
// ⚠⚠ WHOSE TITLE CHANCE. This is the whole methodological question and it is settled here rather
// than by whichever build was convenient. A FIXED reference build measured against ten fields of
// rising strength tapers by construction and says nothing about whether the rung SHE STANDS ON is
// winnable; a band that only holds for a prodigy is not a band. So:
//
//   HER OWN RUNG = THE RUNG THE ENGINE'S OWN SCHEDULER PUTS HER ON. §3's fixed point already maps a
//   core to the rank her book buys and the window that rank opens; `earnSeason` then picks the
//   season a rational player of that strength would actually enter (greedy on expected value over
//   the real calendar, one entry a week, the AER cap). The rung that season enters MOST is hers.
//
// That maps every core to exactly one rung and every rung to a span of cores, so "the title chance
// at rung X" is asked of the player the ladder has actually placed there. A rung no core is ever
// scheduled onto is printed as ABSENT rather than given an invented occupant.
//
// P(title) = p^5 against the rung's own field: every rung in this game draws 32, so five rounds.
// ⚠ THE CLOSED FORM IS USED AND IT IS NOT AN APPROXIMATION OF THE INSTRUMENT – IT REPRODUCES IT.
// At ladder-pace step 1, field core 47.1 against power 56.75 gives P(match) 75.5%, and 0.755^5 =
// 24.5%, which is what tools/field-quality.ts measured by running the real brackets. Same at the
// baseline (70.7% -> 17.7%) and on the step-2 arm (51.2% -> 3.5%). Three agreements to a tenth.

const TAPER_BANDS: { rungs: TierId[]; lo: number; hi: number; label: string }[] = [
  { rungs: ['w15', 'w35'], lo: 15, hi: 35, label: '15-35%' },
  { rungs: ['w50', 'w75', 'w100'], lo: 10, hi: 20, label: '10-20%' },
  { rungs: ['wta125', 'wta250'], lo: 5, hi: 12, label: '5-12%' },
  { rungs: ['wta500', 'wta1000'], lo: 2, hi: 6, label: '2-6%' },
  { rungs: ['slam'], lo: 0, hi: 2, label: 'rare (<2%)' },
]
const bandFor = (t: TierId) => TAPER_BANDS.find((b) => b.rungs.includes(t))

if (wants('14')) {
  console.log('\n14. THE TAPER – title chance at HER OWN RUNG (the rung the scheduler puts her on)')

  // --- 14a. core -> her own rung, by what the season actually enters -------------------------------
  const CORE_LO = 30
  const CORE_HI = 78
  const STEP = 0.5
  const modalOf = new Map<number, TierId | null>()
  const rankOf = new Map<number, number>()
  for (let c = CORE_LO; c <= CORE_HI + 1e-9; c += STEP) {
    const core = Math.round(c * 2) / 2
    const fp = earnFixedPoint(core)
    rankOf.set(core, fp.rank)
    // The season a player of this strength, standing where her book puts her, would really enter.
    const counts = new Map<TierId, number>()
    for (let s = 0; s < SEEDS; s++) {
      for (const [t, n] of earnSeason(core, fp.rank, AGE, EVENTS[s]).perTier) {
        counts.set(t, (counts.get(t) ?? 0) + n)
      }
    }
    let best: TierId | null = null
    let bestN = 0
    for (const [t, n] of counts) if (n > bestN) ((bestN = n), (best = t))
    modalOf.set(core, best)
  }

  const spanOf = new Map<TierId, number[]>()
  for (const [core, t] of modalOf) {
    if (!t) continue
    const list = spanOf.get(t) ?? []
    list.push(core)
    spanOf.set(t, list)
  }
  for (const list of spanOf.values()) list.sort((a, b) => a - b)

  console.log('    rung      cores the scheduler puts here     C(X)   her rank there   field core   P(match)   P(TITLE)   band        verdict')
  const measured = new Map<TierId, number>()
  for (const t of W_RUNGS) {
    const span = spanOf.get(t)
    const band = bandFor(t)
    if (!span || !span.length) {
      console.log(`    ${padE(t, 9)} ${padE('ABSENT – no core is ever scheduled here', 32)} ${padE('', 51)}${band?.label ?? ''}`)
      continue
    }
    const cx = span[Math.floor(span.length / 2)]
    const f = FIELD_CORE.get(t) ?? 50
    const p = pWin(cx, t)
    const title = 100 * Math.pow(p, 5)
    measured.set(t, title)
    const ok = band ? title >= band.lo && title <= band.hi : true
    console.log(
      `    ${padE(t, 9)} ${padE(`${span[0].toFixed(1)}-${span[span.length - 1].toFixed(1)} (${span.length})`, 32)}` +
        ` ${pad(cx.toFixed(1), 5)}   ${pad('#' + rankOf.get(cx), 13)}   ${pad(f.toFixed(1), 10)}` +
        `   ${pad((100 * p).toFixed(1) + '%', 8)}   ${pad(title.toFixed(1) + '%', 8)}   ${padE(band?.label ?? '-', 11)} ${ok ? 'IN BAND' : '✗ OUT'}`,
    )
  }
  const seq = W_RUNGS.map((t) => measured.get(t)).filter((x): x is number => x !== undefined)
  const monotone = seq.every((x, i) => i === 0 || x <= seq[i - 1] + 1e-9)
  const inBand = W_RUNGS.filter((t) => {
    const v = measured.get(t)
    const b = bandFor(t)
    return v !== undefined && b && v >= b.lo && v <= b.hi
  }).length
  console.log(
    `    SHIP RULE 5:  (a) w15 in 15-35%: ${(() => {
      const v = measured.get('w15')
      return v !== undefined && v >= 15 && v <= 35 ? `✓ ${v.toFixed(1)}%` : `✗ ${v === undefined ? 'absent' : v.toFixed(1) + '%'}`
    })()}` +
      `  ·  (b) monotone non-increasing: ${monotone ? '✓' : '✗'}` +
      `  ·  (c) ${inBand} of ${W_RUNGS.length} in band (need 8)` +
      `  ·  (d) slam < 2%: ${(() => {
        const v = measured.get('slam')
        return v === undefined ? 'absent' : v < 2 ? `✓ ${v.toFixed(2)}%` : `✗ ${v.toFixed(2)}%`
      })()}`,
  )

  // --- 14b. the continuity column – the SHIPPED instrument's fixed reference build ------------------
  // Reported, never scored: she is the origin of the 15-35% band and the only figure comparable
  // across every previous wave, but she is one player against ten fields (see the ⚠⚠ above).
  console.log('\n    continuity: the fixed reference strong junior (power 56.75), the shipped instrument')
  console.log(
    '      ' +
      W_RUNGS.map((t) => `${t} ${(100 * Math.pow(pWin(56.75, t), 5)).toFixed(1)}%`).join(' · '),
  )
  // --- 14c. the band floors, as absolute positions – the knob the taper is tuned on ----------------
  console.log('\n    where each rung DRAWS FROM: entrantPctBand floor as an absolute position of the merged table')
  console.log(
    '      ' +
      W_RUNGS.map((t) => {
        const b = TIERS[t].entrantPctBand
        return `${t} #${b ? Math.round(b[0] * TABLE_ROWS) : 0}-${b ? Math.round(b[1] * TABLE_ROWS) : TABLE_ROWS}`
      }).join(' · '),
  )
}

console.log(`\n${rule()}`)
