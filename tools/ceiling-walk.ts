// THE ARITHMETIC CEILING – how high can a player who wins EVERY match she is allowed to play climb,
// and which rule, if any, is what stops her?
//
//   npx vite-node tools/ceiling-walk.ts [--seeds N] [--age N] [--from 237] [--verbose]
//
// WHY IT EXISTS. `docs/specs/money-decomposition-2026-08.md` measured 180 bench careers and found the
// best professional rank any of them ever reached is **#237**, with all four rungs above #200 empty –
// against `ECONOMY.development.ageCurve`'s own written target of "first points 17-18, top-100 about
// 4.5 years later". Three hypotheses were opened at once, and this tool tests the first one, because
// if it is true the other two are irrelevant:
//
//     THE CEILING IS ARITHMETIC. No amount of skill can lift her past ~#200, because the rungs she is
//     PERMITTED to enter cannot produce a best-16 book big enough to rank her any higher.
//
// It is a points-and-doors calculation and it simulates NOT ONE MATCH. She wins everything; the only
// things allowed to stop her are the rules:
//
//   * THE DOORS – `TierDef.acceptsRank`, read out of the engine (`acceptanceRank`), never from a doc.
//   * THE SLIDING WINDOW – `tierFloorOpen` / `tierOutgrown`, WINDOW_RUNGS 3, TERMINAL_RUNGS 4. Which
//     rungs are OFFERED at a given rank, including the rungs that CLOSE beneath her as she climbs.
//   * THE CALENDAR – `buildSeason` for real: how many events of each rung a season actually holds,
//     and one entry per week (`enterEvent` refuses a second – she has one body).
//   * THE CAPS AND THE REGIME – the WTA age-eligibility allowance (`proPerYearByAge`: 12 at 16, 16 at
//     17, unlimited at 18+) and the mandatory tournaments, whose skips write a ZERO into her sixteen.
//   * THE BOOK – `BEST_N_BY_TRACK.wta` = 16, folded by the engine's own `recomputeKidRank` over the
//     real merged W table (364 derived pros carrying the real points-to-rank curve).
//
// THE FIXED POINT is the headline: give her a perfect season at rank R, read the rank her book
// produces, re-open the window at THAT rank, and repeat. Where the iteration lands is the highest
// rank the RULES permit, whatever a player is capable of.
//
// ⚠ IT IS AN UPPER BOUND, DELIBERATELY, AND IT IS THE ONLY HONEST SHAPE FOR A CEILING CLAIM. Three
// simplifications all point the same way – she never loses a match, her body never refuses a trip,
// and the LIVE cohort holds no professional points to stand in front of her. Every one of them can
// only make the computed ceiling HIGHER than a real career's. So "the ceiling is low" would be proof;
// "the ceiling is high" is proof of the converse – that whatever is holding careers at #237 is not
// arithmetic.
//
// MEASUREMENT ONLY. It calls engine predicates and counts. No engine number is written from here.

import {
  createWorld,
  recomputeKidRank,
  acceptanceRank,
  tierOpenFor,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import {
  TIERS,
  TIER_LADDER,
  buildSeason,
  seasonEventCount,
  isTierAgeOpen,
  WEEKS_PER_YEAR,
  OFF_SEASON_WEEKS,
} from '../src/engine/season/calendar'
import { BEST_N_BY_TRACK } from '../src/engine/season/ranking'
import { ECONOMY } from '../src/engine/economy'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 12)
/** The age the walk is run at. 18+ is the unrestricted one (`proPerYearByAge` default); 16 and 17
 *  carry the AER allowance and are reported as their own arm. */
const AGE = argOf('age', 19)
/** Where the iteration starts – the rank the shipped game actually delivers (money-decomposition). */
const FROM = argOf('from', 237)
const VERBOSE = args.includes('--verbose')

const W_RUNGS: readonly TierId[] = TIER_LADDER.filter((t) => TIERS[t].track === 'wta')
const PLAYABLE = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
/** A rank worse than any table position we ever need to name. */
const UNRANKED = 100_000

const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  if (!s.length) return 0
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

// =================================================================================================
// 1. THE DOORS AND THE WINDOW, read out of the engine and then modelled – with the model CHECKED
//    against the engine at every rank, so the sweep arms below cannot quietly answer a different
//    question from the shipped one.
// =================================================================================================

const probeWorld = createWorld('ceiling-doors')

/** The acceptance cut of every W rung, as the engine resolves it this week. `undefined` = the
 *  on-ramp (W15 has no acceptance list at all – it is opened by the junior table below it). */
function doors(): Map<TierId, number | undefined> {
  const out = new Map<TierId, number | undefined>()
  for (const t of W_RUNGS) out.set(t, acceptanceRank(probeWorld, t))
  return out
}
const DOORS = doors()

/** Put a world at an exact merged-W rank, with a professional book behind it, and nothing else
 *  touched. Deliberately sets the cache BY HAND rather than deriving it: the question this tool asks
 *  is "at rank R, what is open?", and pinning R is how you ask it. The gates read exactly two things
 *  – `kidPoints(world,'wta') > 0` and `world.kidRankWta` – plus the on-ramp latch, so all three are
 *  set and nothing else has to be true. */
function atRank(world: WorldState, rank: number, week: number): void {
  world.week = week
  world.results = world.results.filter((r) => r.playerId !== KID_ID)
  world.results.push({ playerId: KID_ID, week, points: 1, tier: 'w15' })
  world.onRampCleared = { itf: true, wta: true }
  world.kidRankWta = rank
  world.proEntryWeeks = []
}

/** The ENGINE's own answer: which W rungs are open to a player at `rank` in her `age` season.
 *
 *  ⚠ `tierOpenFor` AND THE AGE GATE ARE TWO SEPARATE PREDICATES IN THE ENGINE, and both are needed
 *  to answer "may she enter this". `tierOpenFor` is the LADDER's verdict (floor reached, not
 *  outgrown) and carries no age clause of its own; `entryStatus` applies `isTierAgeOpen` alongside it
 *  through `availabilityStatus`. Asking only the first would report a Grand Slam open to a
 *  sixteen-year-old. The pair below is what `enterEvent` actually enforces. */
function engineOpenAt(rank: number, age: number): TierId[] {
  const week = (age - 14) * WEEKS_PER_YEAR + 10
  atRank(probeWorld, rank, week)
  return W_RUNGS.filter((t) => tierOpenFor(probeWorld, t) && isTierAgeOpen(t, age))
}

/** ...and the MODEL of it, whose parameters the sweep can move. Reproduces `tierFloorOpen` and
 *  `tierOutgrown` for the W arm exactly: a rung's floor is its acceptance cut (the on-ramp's is
 *  always open for a player who already holds professional points), and a rung CLOSES when the rung
 *  `windowRungs` above it opens – except for the top `terminalRungs`, which never close. The age
 *  clause is the same one: a door she cannot walk through yet cannot close the one behind her. */
interface WindowParams {
  /** per-rung acceptance cut; undefined = no list (the on-ramp) */
  accepts: Map<TierId, number | undefined>
  windowRungs: number
  terminalRungs: number
  /** OFF = `tierOutgrown` disabled entirely – nothing ever closes beneath her */
  ceilingOn: boolean
}
const SHIPPED: WindowParams = {
  accepts: DOORS,
  windowRungs: 3,
  terminalRungs: 4,
  ceilingOn: true,
}

function floorOpen(tier: TierId, rank: number, p: WindowParams): boolean {
  const accepts = p.accepts.get(tier)
  if (accepts === undefined) return true // the on-ramp: latched, and she holds W points
  return rank <= accepts
}

function outgrown(tier: TierId, rank: number, age: number, p: WindowParams): boolean {
  if (!p.ceilingOn) return false
  const i = TIER_LADDER.indexOf(tier)
  if (i < 0 || i >= TIER_LADDER.length - p.terminalRungs) return false
  const above = TIER_LADDER[i + p.windowRungs]
  if (!above) return false
  if (!isTierAgeOpen(above, age)) return false
  return floorOpen(above, rank, p)
}

function modelOpenAt(rank: number, age: number, p: WindowParams = SHIPPED): TierId[] {
  return W_RUNGS.filter(
    (t) => isTierAgeOpen(t, age) && floorOpen(t, rank, p) && !outgrown(t, rank, age, p),
  )
}

/** The equivalence check. If this ever prints a disagreement the sweep arms below are measuring a
 *  ladder the game does not have, and every number in this file is void. */
function verifyModel(): { checked: number; disagreements: string[] } {
  const disagreements: string[] = []
  let checked = 0
  for (const age of [16, 17, 18, 19, 22]) {
    for (let rank = 1; rank <= 900; rank++) {
      const a = engineOpenAt(rank, age).join(',')
      const b = modelOpenAt(rank, age).join(',')
      checked += 1
      if (a !== b && disagreements.length < 8) disagreements.push(`age ${age} #${rank}: engine [${a}] vs model [${b}]`)
    }
  }
  return { checked, disagreements }
}

// =================================================================================================
// 2. THE PERFECT SEASON – the real calendar, one entry a week, and she wins them all.
// =================================================================================================

/** Every W event of one season block of one world, as `buildSeason` deals it. */
function seasonEvents(seed: string, block: number): SeasonEvent[] {
  return buildSeason(`${seed}:s${block}`, block * WEEKS_PER_YEAR, WEEKS_PER_YEAR)
}

interface PerfectSeason {
  /** what she entered, tier by tier */
  entered: Map<TierId, number>
  /** every title's points value, descending */
  values: number[]
  /** the best-16 fold – her book at the end of the season */
  book: number
  /** how many of the sixteen slots she could actually fill */
  slotsFilled: number
  /** entries refused because the season's pro allowance ran out (AER) */
  cappedOut: number
  /** events of an OPEN rung she could not take because that week was already committed */
  weekClashes: number
}

/** The best season a perfect player can extract from `events`, given the open window.
 *
 *  ⚠ GREEDY IS OPTIMAL HERE AND THAT IS A FACT ABOUT THE PROBLEM, not an approximation. "At most one
 *  event per week" is a partition matroid, so taking events in descending value and keeping any whose
 *  week is still free maximises the chosen set's weight – and because the greedy takes the biggest
 *  values first, the top sixteen of its set is also the best sixteen available. Nothing smarter can
 *  beat it, which is what a CEILING needs. */
function perfectSeason(events: SeasonEvent[], open: TierId[], age: number): PerfectSeason {
  const openSet = new Set(open)
  const candidates = events
    .filter((e) => openSet.has(e.tier))
    .sort((a, b) => TIERS[b.tier].points[0] - TIERS[a.tier].points[0] || a.week - b.week)
  const takenWeeks = new Set<number>()
  const entered = new Map<TierId, number>()
  const values: number[] = []
  let cappedOut = 0
  let weekClashes = 0
  const limit = ECONOMY.entryCap.proPerYearByAge[age] ?? ECONOMY.entryCap.proPerYearByAge.default
  for (const e of candidates) {
    if (takenWeeks.has(e.week)) {
      weekClashes += 1
      continue
    }
    if (values.length >= limit) {
      cappedOut += 1
      continue
    }
    takenWeeks.add(e.week)
    entered.set(e.tier, (entered.get(e.tier) ?? 0) + 1)
    values.push(TIERS[e.tier].points[0])
  }
  const bestN = BEST_N_BY_TRACK.wta
  const counted = values.slice(0, bestN)
  return {
    entered,
    values,
    book: counted.reduce((s, x) => s + x, 0),
    slotsFilled: counted.length,
    cappedOut,
    weekClashes,
  }
}

// =================================================================================================
// 3. THE BOOK -> RANK MAP, folded by the engine over the real merged table.
// =================================================================================================

const rankWorlds = new Map<string, WorldState>()
function rankWorldFor(seed: string): WorldState {
  let w = rankWorlds.get(seed)
  if (!w) {
    w = createWorld(`ceiling-${seed}`)
    rankWorlds.set(seed, w)
  }
  return w
}

/** Where a book of `values` (one row per title) puts her in the merged W table. Uses
 *  `recomputeKidRank` – the game's own one writer – so this is the number every surface in the game
 *  would read, best-16 fold and field interleave included. */
function rankOfBook(seed: string, values: number[], week: number): number {
  const world = rankWorldFor(seed)
  world.week = week
  world.results = world.results.filter((r) => r.playerId !== KID_ID)
  for (const v of values) world.results.push({ playerId: KID_ID, week, points: v, tier: 'wta250' })
  world.onRampCleared = { itf: true, wta: true }
  recomputeKidRank(world)
  return world.kidRankWta ?? UNRANKED
}

/** The points-to-rank curve itself, for the report: what a flat book of `points` is worth. */
function rankOfPoints(seed: string, points: number, week: number): number {
  return rankOfBook(seed, points > 0 ? [points] : [], week)
}

// =================================================================================================
// 4. THE ITERATION – a perfect season, re-opened at the rank it produced, until it stops moving.
// =================================================================================================

interface Step {
  rank: number
  open: TierId[]
  supply: number
  entered: number
  book: number
  slotsFilled: number
  next: number
  cappedOut: number
  weekClashes: number
}

function walk(fromRank: number, age: number, p: WindowParams, maxSteps = 12): Step[] {
  const week = (age - 14) * WEEKS_PER_YEAR + 10
  const steps: Step[] = []
  const seen = new Set<number>()
  let rank = fromRank
  for (let n = 0; n < maxSteps; n++) {
    const open = modelOpenAt(rank, age, p)
    const books: number[] = []
    const nexts: number[] = []
    const entereds: number[] = []
    const supplies: number[] = []
    const slots: number[] = []
    const capped: number[] = []
    const clashes: number[] = []
    for (let s = 0; s < SEEDS; s++) {
      const seed = `ceiling-${s}`
      const events = seasonEvents(seed, 5 + (age - 19))
      const season = perfectSeason(events, open, age)
      books.push(season.book)
      entereds.push(season.values.length)
      supplies.push(events.filter((e) => open.includes(e.tier)).length)
      slots.push(season.slotsFilled)
      capped.push(season.cappedOut)
      clashes.push(season.weekClashes)
      nexts.push(rankOfBook(seed, season.values.slice(0, BEST_N_BY_TRACK.wta), week))
    }
    const next = Math.round(median(nexts))
    steps.push({
      rank,
      open,
      supply: mean(supplies),
      entered: mean(entereds),
      book: median(books),
      slotsFilled: mean(slots),
      next,
      cappedOut: mean(capped),
      weekClashes: mean(clashes),
    })
    if (seen.has(rank) || next === rank) break
    seen.add(rank)
    // The fixed point is where the iteration STOPS CLIMBING, which includes the case where a season
    // at rank R lands her worse than R – then R is already the best she can hold.
    if (next > rank) break
    rank = next
  }
  return steps
}

function fixedPointOf(steps: Step[]): number {
  return Math.min(...steps.map((s) => Math.min(s.rank, s.next)))
}

// =================================================================================================
// THE REPORT
// =================================================================================================

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)

console.log(
  `THE ARITHMETIC CEILING – a player who wins EVERY match, on the real calendar, ${SEEDS} worlds, age ${AGE}`,
)
console.log(
  `  best-N on the professional table: ${BEST_N_BY_TRACK.wta} · playable weeks ${PLAYABLE}/${WEEKS_PER_YEAR} ` +
    `· pro entry allowance at ${AGE}: ${ECONOMY.entryCap.proPerYearByAge[AGE] ?? 'unlimited'}`,
)

// --- the doors ----------------------------------------------------------------------------------
console.log('\n1. THE DOORS – acceptance cut, title value, and how many of the rung a season holds')
console.log('   rung      accepts to   closes at   title   events/season   a season of nothing but this rung')
for (const t of W_RUNGS) {
  const accepts = DOORS.get(t)
  const i = TIER_LADDER.indexOf(t)
  const above = TIER_LADDER[i + SHIPPED.windowRungs]
  const closesAt =
    i >= TIER_LADDER.length - SHIPPED.terminalRungs ? 'never' : `#${DOORS.get(above) ?? '-'}`
  const n = seasonEventCount(t)
  const maxBook = Math.min(n, BEST_N_BY_TRACK.wta) * TIERS[t].points[0]
  console.log(
    `   ${padE(t, 9)} ${pad(accepts === undefined ? 'on-ramp' : '#' + accepts, 10)}   ${pad(closesAt, 9)}   ` +
      `${pad(TIERS[t].points[0], 5)}   ${pad(n, 13)}   ${pad(maxBook + ' pts', 12)}`,
  )
}

// --- the model check ----------------------------------------------------------------------------
const check = verifyModel()
console.log(
  `\n2. THE WINDOW MODEL vs THE ENGINE – ${check.checked} (rank, age) pairs checked against ` +
    `tierOpenFor: ${check.disagreements.length === 0 ? 'IDENTICAL' : 'DISAGREES'}`,
)
for (const d of check.disagreements) console.log(`     ${d}`)

// --- the window at every band -------------------------------------------------------------------
const BANDS: number[] = [800, 700, 550, 450, 350, 250, 237, 200, 120, 104, 65, 20, 1]

/** One band, measured over every world: what the window offers and what a perfect season of it pays. */
interface BandRow {
  rank: number
  open: TierId[]
  supply: number
  entered: number
  clashes: number
  slots: number
  book: number
  next: number
}
function bandRow(rank: number, age: number, p: WindowParams = SHIPPED, block = 5): BandRow {
  const open = modelOpenAt(rank, age, p)
  const week = (age - 14) * WEEKS_PER_YEAR + 10
  const supplies: number[] = []
  const entereds: number[] = []
  const clashes: number[] = []
  const slots: number[] = []
  const books: number[] = []
  const nexts: number[] = []
  for (let s = 0; s < SEEDS; s++) {
    const seed = `ceiling-${s}`
    const events = seasonEvents(seed, block)
    const season = perfectSeason(events, open, age)
    supplies.push(events.filter((e) => open.includes(e.tier)).length)
    entereds.push(season.values.length)
    clashes.push(season.weekClashes)
    slots.push(season.slotsFilled)
    books.push(season.book)
    nexts.push(rankOfBook(seed, season.values.slice(0, BEST_N_BY_TRACK.wta), week))
  }
  return {
    rank,
    open,
    supply: mean(supplies),
    entered: mean(entereds),
    clashes: mean(clashes),
    slots: mean(slots),
    book: median(books),
    next: Math.round(median(nexts)),
  }
}

console.log('\n3. WHAT IS OFFERED, AND WHAT A PERFECT SEASON OF IT IS WORTH')
console.log(
  `   at rank   rungs open                        supply  entered  clash  slots/${BEST_N_BY_TRACK.wta}  best-16 book   ->  rank`,
)
for (const rank of BANDS) {
  const r = bandRow(rank, AGE)
  console.log(
    `   ${pad('#' + r.rank, 7)}   ${padE(r.open.join(',') || '(nothing)', 32)} ${pad(r.supply.toFixed(1), 6)}` +
      `  ${pad(r.entered.toFixed(1), 7)}  ${pad(r.clashes.toFixed(1), 5)}  ${pad(r.slots.toFixed(1), 8)}` +
      `  ${pad(r.book, 12)}   ->  ${pad('#' + r.next, 5)}`,
  )
}

// --- the fixed point ----------------------------------------------------------------------------
console.log(`\n4. THE FIXED POINT – start at the rank the game delivers (#${FROM}) and iterate`)
const main = walk(FROM, AGE, SHIPPED)
for (const s of main) {
  console.log(
    `   #${padE(s.rank, 5)} window [${padE(s.open.join(','), 30)}] supply ${pad(s.supply.toFixed(1), 5)}` +
      `  entered ${pad(s.entered.toFixed(1), 5)}  slots ${pad(s.slotsFilled.toFixed(1), 4)}/${BEST_N_BY_TRACK.wta}` +
      `  book ${pad(s.book, 6)}  ->  #${s.next}`,
  )
}
const FIXED = fixedPointOf(main)
console.log(`   FIXED POINT: #${FIXED}`)

console.log('\n   ...and from the bottom of the professional table, to show the climb is not path-dependent:')
for (const start of [900, 600, 500, 400, 300]) {
  const w = walk(start, AGE, SHIPPED)
  console.log(
    `     from #${padE(start, 4)}: ${w.map((s) => '#' + s.rank).join(' -> ')} -> #${w[w.length - 1].next}` +
      `   fixed point #${fixedPointOf(w)}`,
  )
}

// --- the two rules a perfect season could still trip on -------------------------------------------
//
// THE MANDATORY REGIME writes a ZERO into one of her sixteen counted slots for every obligation she
// skips (`SeasonResult.mandatoryMiss`), so it is the one rule in the game that can make a season
// worth LESS than the events she played. And a season she cannot afford is a season she does not
// play. Both are checked rather than assumed – the brief names them, and "the ceiling ignores them"
// is not an answer.
console.log('\n5. THE REGIME AND THE MONEY – the two rules a perfect season could still trip on')
console.log(
  `   regime: top-${ECONOMY.mandatory.maxRank}, ${ECONOMY.mandatory.perEventTiers.join('+')} bind per event, ` +
    `${ECONOMY.mandatory.quotaTier} is a quota of ${ECONOMY.mandatory.quota}; ` +
    `${ECONOMY.mandatory.suspensionAt} penalty points in ${ECONOMY.mandatory.windowWeeks} weeks = ` +
    `${ECONOMY.mandatory.suspensionWeeks} weeks out`,
)
console.log('   at rank   skipped obligations   quota shortfall   penalty pts   fees+travel   prize money   net')
for (const rank of [FROM, 50, 20, 1]) {
  const open = modelOpenAt(rank, AGE)
  const skips: number[] = []
  const shorts: number[] = []
  const costs: number[] = []
  const prizes: number[] = []
  const limit = ECONOMY.entryCap.proPerYearByAge[AGE] ?? ECONOMY.entryCap.proPerYearByAge.default
  for (let s = 0; s < SEEDS; s++) {
    const events = seasonEvents(`ceiling-${s}`, 5)
    // The same greedy `perfectSeason` runs, kept as EVENTS rather than as points values so the two
    // audits below read one season – which rungs, which weeks, which cheques.
    const openSet = new Set(open)
    const taken: SeasonEvent[] = []
    const weeks = new Set<number>()
    for (const e of events
      .filter((x) => openSet.has(x.tier))
      .sort((a, b) => TIERS[b.tier].points[0] - TIERS[a.tier].points[0] || a.week - b.week)) {
      if (weeks.has(e.week) || taken.length >= limit) continue
      weeks.add(e.week)
      taken.push(e)
    }
    const takenIds = new Set(taken.map((e) => e.id))
    // `mandatoryBinds`, restated for a hypothetical rank: the rung obliges her only if she is inside
    // the regime's standing, inside the rung's own acceptance list, old enough, and not already
    // committed that week (one body, one week – an obligation she could not meet is not one).
    let skipped = 0
    for (const e of events) {
      if (!ECONOMY.mandatory.perEventTiers.includes(e.tier)) continue
      if (rank > ECONOMY.mandatory.maxRank) continue
      const accepts = DOORS.get(e.tier)
      if (accepts !== undefined && rank > accepts) continue
      if (!isTierAgeOpen(e.tier, AGE)) continue
      if (takenIds.has(e.id)) continue
      if (weeks.has(e.week)) continue // committed elsewhere that week
      skipped += 1
    }
    const offered =
      rank <= ECONOMY.mandatory.maxRank
        ? events.filter(
            (e) =>
              e.tier === ECONOMY.mandatory.quotaTier &&
              rank <= (DOORS.get(e.tier) ?? UNRANKED) &&
              isTierAgeOpen(e.tier, AGE),
          ).length
        : 0
    const played = taken.filter((e) => e.tier === ECONOMY.mandatory.quotaTier).length
    skips.push(skipped)
    shorts.push(Math.max(0, Math.min(ECONOMY.mandatory.quota, offered) - played))
    costs.push(
      taken.reduce((sum, e) => sum + TIERS[e.tier].entryFeeCents + e.travelCostCents, 0) / 100,
    )
    prizes.push(taken.reduce((sum, e) => sum + (TIERS[e.tier].prizeCents?.[0] ?? 0), 0) / 100)
  }
  const pts =
    mean(skips) * ECONOMY.mandatory.skipPoints + mean(shorts) * ECONOMY.mandatory.quotaShortfallPoints
  console.log(
    `   ${pad('#' + rank, 7)}   ${pad(mean(skips).toFixed(1), 19)}   ${pad(mean(shorts).toFixed(1), 15)}   ` +
      `${pad(pts.toFixed(1), 11)}   ${pad('$' + Math.round(mean(costs)).toLocaleString('en-US'), 11)}   ` +
      `${pad('$' + Math.round(mean(prizes)).toLocaleString('en-US'), 11)}   ` +
      `${pad('$' + Math.round(mean(prizes) - mean(costs)).toLocaleString('en-US'), 10)}`,
  )
}

// --- the young arm ------------------------------------------------------------------------------
console.log('\n5b. THE AGE-ELIGIBILITY ARM – the same walk at 16 and 17, where the AER allowance binds')
for (const age of [16, 17, 18]) {
  const w = walk(FROM, age, SHIPPED)
  const first = w[0]
  console.log(
    `   age ${age} (allowance ${ECONOMY.entryCap.proPerYearByAge[age] ?? 'unlimited'}): ` +
      `window [${padE(first.open.join(','), 30)}] entered ${first.entered.toFixed(1)} ` +
      `capped-out ${first.cappedOut.toFixed(1)}  book ${first.book}  ->  #${first.next}   fixed point #${fixedPointOf(w)}`,
  )
}

// --- what binds it ------------------------------------------------------------------------------
//
// ⚠ MEASURED AT THE DELIVERED RANK, NOT AT THE FIXED POINT, AND THE REASON IS THE RESULT ITSELF. If
// the shipped fixed point is already the top of the table, "relax a rule and read the fixed point"
// can only print the same number over and over – every arm is saturated, and a saturated table ranks
// nothing. The question that still has an answer is what each rule costs a perfect season AT THE RANK
// THE GAME ACTUALLY DELIVERS, which is where a real career meets these rules. Both columns are
// printed: the season's book at #FROM, and the fixed point, so a rule that binds either shows up.
const OPEN_DOORS = new Map<TierId, number | undefined>()
for (const t of W_RUNGS) OPEN_DOORS.set(t, UNRANKED)

interface Arm {
  id: string
  what: string
  row: () => BandRow
  fixed: () => number
}
const bestN = BEST_N_BY_TRACK.wta
const arms: Arm[] = [
  {
    id: 'shipped',
    what: 'nothing relaxed',
    row: () => bandRow(FROM, AGE),
    fixed: () => FIXED,
  },
  {
    id: 'doors',
    what: 'acceptsRank removed – every rung admits anyone',
    row: () => bandRow(FROM, AGE, { ...SHIPPED, accepts: OPEN_DOORS }),
    fixed: () => fixedPointOf(walk(FROM, AGE, { ...SHIPPED, accepts: OPEN_DOORS })),
  },
  {
    id: 'no-close',
    what: 'tierOutgrown OFF – no rung ever closes beneath her',
    row: () => bandRow(FROM, AGE, { ...SHIPPED, ceilingOn: false }),
    fixed: () => fixedPointOf(walk(FROM, AGE, { ...SHIPPED, ceilingOn: false })),
  },
  {
    id: 'window 4',
    what: 'WINDOW_RUNGS 3 -> 4 (one more rung live at once)',
    row: () => bandRow(FROM, AGE, { ...SHIPPED, windowRungs: 4 }),
    fixed: () => fixedPointOf(walk(FROM, AGE, { ...SHIPPED, windowRungs: 4 })),
  },
  {
    id: 'window 2',
    what: 'WINDOW_RUNGS 3 -> 2 (one fewer rung live at once)',
    row: () => bandRow(FROM, AGE, { ...SHIPPED, windowRungs: 2 }),
    fixed: () => fixedPointOf(walk(FROM, AGE, { ...SHIPPED, windowRungs: 2 })),
  },
  {
    id: 'terminal 8',
    what: 'TERMINAL_RUNGS 4 -> 8 (the top half never closes)',
    row: () => bandRow(FROM, AGE, { ...SHIPPED, terminalRungs: 8 }),
    fixed: () => fixedPointOf(walk(FROM, AGE, { ...SHIPPED, terminalRungs: 8 })),
  },
]

console.log(
  `\n6. WHAT BINDS IT – relax exactly one rule; the season is measured at the delivered rank #${FROM}`,
)
console.log('   arm          what was relaxed                                    entered   book   ->  rank   fixed point')
for (const arm of arms) {
  const r = arm.row()
  console.log(
    `   ${padE(arm.id, 12)} ${padE(arm.what, 50)} ${pad(r.entered.toFixed(1), 7)}  ${pad(r.book, 5)}   ->  ` +
      `${pad('#' + r.next, 5)}   ${pad('#' + arm.fixed(), 6)}`,
  )
}
for (const n of [8, 12, 24, 32]) {
  BEST_N_BY_TRACK.wta = n
  const r = bandRow(FROM, AGE)
  console.log(
    `   ${padE('best-' + n, 12)} ${padE(`BEST_N_BY_TRACK.wta ${bestN} -> ${n}`, 50)} ${pad(r.entered.toFixed(1), 7)}  ${pad(r.book, 5)}   ->  ` +
      `${pad('#' + r.next, 5)}   ${pad('#' + fixedPointOf(walk(FROM, AGE, SHIPPED)), 6)}`,
  )
}
BEST_N_BY_TRACK.wta = bestN

// ⚠ THE ONE ARM THE PARAMETER MODEL CANNOT EXPRESS: week exclusivity. `enterEvent` refuses a second
// entry in the same week because she has one body, so it is not a knob – but it IS a constraint that
// costs her events at the thin bands, and the ceiling report has to price it.
{
  const open = modelOpenAt(FROM, AGE)
  const week = (AGE - 14) * WEEKS_PER_YEAR + 10
  const books: number[] = []
  const nexts: number[] = []
  for (let s = 0; s < SEEDS; s++) {
    const seed = `ceiling-${s}`
    const values = seasonEvents(seed, 5)
      .filter((e) => open.includes(e.tier))
      .map((e) => TIERS[e.tier].points[0])
      .sort((a, b) => b - a)
      .slice(0, BEST_N_BY_TRACK.wta)
    books.push(values.reduce((a, b) => a + b, 0))
    nexts.push(rankOfBook(seed, values, week))
  }
  console.log(
    `   ${padE('two-a-week', 12)} ${padE('week exclusivity OFF – she may play every open event', 50)} ` +
      `${pad('-', 7)}  ${pad(median(books), 5)}   ->  ${pad('#' + Math.round(median(nexts)), 5)}   ${pad('-', 6)}`,
  )
}

// --- how good must she be -----------------------------------------------------------------------
//
// THE BRIDGE TO THE OTHER TWO PROBES. The ceiling above assumes she wins every match; this table
// prices the assumption. For each window, what her book and her rank are if EVERY event she enters
// ends at the same finish – champion, finalist, semi-finalist, and so on.
console.log('\n7. HOW GOOD SHE HAS TO BE – the same seasons, but every event ends at one fixed finish')
console.log('   at rank   rungs open                        W       F       SF      QF      R16     R32')
for (const rank of [800, 450, 350, 250, 237, 200, 120, 65]) {
  const open = modelOpenAt(rank, AGE)
  const cells: string[] = []
  for (let finish = 0; finish < 6; finish++) {
    const ranks: number[] = []
    for (let s = 0; s < SEEDS; s++) {
      const seed = `ceiling-${s}`
      const events = seasonEvents(seed, 5)
      const season = perfectSeason(events, open, AGE)
      // her entries are unchanged – only what each one PAYS moves
      const vals = season.values
        .map((v) => {
          const tier = W_RUNGS.find((t) => TIERS[t].points[0] === v) ?? open[0]
          return TIERS[tier].points[Math.min(finish, TIERS[tier].points.length - 1)]
        })
        .sort((a, b) => b - a)
        .slice(0, BEST_N_BY_TRACK.wta)
      ranks.push(rankOfBook(seed, vals, (AGE - 14) * WEEKS_PER_YEAR + 10))
    }
    cells.push(pad('#' + Math.round(median(ranks)), 7))
  }
  console.log(`   ${pad('#' + rank, 7)}   ${padE(open.join(','), 32)}${cells.join(' ')}`)
}

// --- the curve itself ---------------------------------------------------------------------------
console.log('\n8. THE POINTS-TO-RANK CURVE the merged table actually carries (median over worlds)')
const CURVE = [10, 50, 100, 160, 250, 400, 650, 1000, 1200, 1400, 1500, 2000, 2900, 4000, 6500, 10000, 18000]
console.log(
  '   ' +
    CURVE.map((p) => {
      const r = median(
        Array.from({ length: SEEDS }, (_, s) => rankOfPoints(`ceiling-${s}`, p, (AGE - 14) * WEEKS_PER_YEAR + 10)),
      )
      return `${p}->#${Math.round(r)}`
    }).join('  '),
)

// --- the gap ------------------------------------------------------------------------------------
//
// THE HANDOVER TO THE OTHER TWO PROBES, in one number. If the ceiling is not the constraint, then the
// distance between what the rules permit at the delivered rank and what the delivered rank IS is the
// size of the real problem – and it is a share of a season's book, which is a win-rate question.
console.log('\n9. THE GAP – what the rules permit at #' + FROM + ' against what the game delivers there')
const week9 = (AGE - 14) * WEEKS_PER_YEAR + 10
/** Invert the curve: the smallest whole book that reaches `target`, by bisection on the real table. */
function bookForRank(target: number): number {
  let lo = 0
  let hi = 20000
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const r = median(Array.from({ length: SEEDS }, (_, s) => rankOfPoints(`ceiling-${s}`, mid, week9)))
    if (r <= target) hi = mid
    else lo = mid + 1
  }
  return lo
}
const delivered = bookForRank(FROM)
const perfect = bandRow(FROM, AGE).book
for (const target of [FROM, 200, 150, 100, 50, 10]) {
  const need = bookForRank(target)
  console.log(
    `   to reach #${padE(target, 4)} she needs ${pad(need, 6)} pts` +
      `  =  ${pad(((100 * need) / perfect).toFixed(0) + '%', 5)} of one perfect season at the #${FROM} window (${perfect} pts)`,
  )
}
console.log(
  `   the shipped game's best career (money-decomposition, 180 careers) peaked at #${FROM} ` +
    `= about ${delivered} points, i.e. ${((100 * delivered) / perfect).toFixed(0)}% of the book its own window offered it.`,
)

// --- the one simplification that could move the answer --------------------------------------------
//
// ⚠ THE LIVE COHORT IS ASSUMED EMPTY EVERYWHERE ABOVE, and that is the only assumption in this file
// that could flatter the ceiling by more than rounding. The merged W table is 364 derived pros plus
// whatever the 199 LIVE rivals have earned, and the tool builds its books against a fresh world where
// the rivals hold nothing. Every live row above her book pushes her down one place. So: TICK real
// worlds with no player entries at all, and count them. `--live N` is opt-in because it is the only
// part of this tool that simulates anything.
const LIVE = argOf('live', 0)
if (LIVE > 0) {
  console.log(`\n10. THE LIVE COHORT – how many EARNED rows would stand in front of her (${LIVE} worlds, ticked)`)
  const { tickWeek } = await import('../src/engine/world')
  const { resumeMain } = await import('../src/engine/rng')
  const { computeRanking } = await import('../src/engine/season/ranking')
  const { inTrack } = await import('../src/engine/world')
  const LEVELS = [278, 532, 859, 1325, 2738]
  const rows: number[][] = LEVELS.map(() => [])
  // ⚠ AND THE BEST LIVE ROW IS PRINTED BESIDE THE COUNTS, so a row of zeroes reads as "the cohort
  // holds nothing at these levels" rather than as "the measurement is broken". They are different
  // findings and only one of them supports the claim.
  const bests: number[] = []
  const earners: number[] = []
  for (let s = 0; s < LIVE; s++) {
    const world = createWorld(`ceiling-live-${s}`)
    const rng = resumeMain(world.rngMain)
    for (let w = 0; w < (AGE - 14 + 1) * WEEKS_PER_YEAR; w++) tickWeek(world, rng)
    const live = computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.wta,
      world.cohort.map((p) => p.id),
      inTrack('wta'),
    )
    LEVELS.forEach((lvl, i) => rows[i].push(live.filter((r) => r.points >= lvl).length))
    bests.push(live[0]?.points ?? 0)
    earners.push(live.filter((r) => r.points > 0).length)
  }
  console.log(
    '   live rivals holding at least: ' +
      LEVELS.map((lvl, i) => `${lvl} pts -> ${mean(rows[i]).toFixed(1)}`).join('  ·  '),
  )
  console.log(
    `   for scale: the BEST live W row is ${mean(bests).toFixed(0)} pts and ${mean(earners).toFixed(0)} of ` +
      `${199} rivals hold any at all – so the cohort is measurably playing, and measurably nowhere near her book.`,
  )
  console.log(
    '   (each one costs her one place. The books above are therefore optimistic by exactly this many' +
      ' ranks – which is the direction a CEILING claim needs.)',
  )
}

if (VERBOSE) {
  console.log('\n   VERBOSE – one world, the terminal window, week by week:')
  const open = modelOpenAt(1, AGE)
  const events = seasonEvents('ceiling-0', 5).filter((e) => open.includes(e.tier))
  for (const e of events.sort((a, b) => a.week - b.week)) {
    console.log(`     w${e.week % WEEKS_PER_YEAR}  ${e.tier}  ${TIERS[e.tier].points[0]}`)
  }
}
