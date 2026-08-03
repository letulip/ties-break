// THE CALENDAR'S SHAPE – what the season OFFERS, before any career walks it (W2-WINDOW).
//
//   npx vite-node tools/calendar-shape.ts [--seeds N] [--blocks N] [--window w15,w35,w50]
//
// WHY IT EXISTS. Two defects were measured on the shipped calendar and neither was visible to any
// test in the suite, because every guard asks about ONE tier ("j30 is dense", "national never runs
// two weeks running") and both defects are properties of the WHOLE week grid:
//
//   1. THE TAIL DUMP. Every tier's event count was computed over 52 weeks while only ~48 are
//      placeable, so every tier's overflow compressed into the last playable weeks – measured
//      2-5 events a week through the year and then 45:5 46:5 47:8 48:11. The owner saw it as
//      "3 W35 in a row on weeks 47-48-49".
//   2. THE CALENDAR WAS SEED-INDEPENDENT. `buildSeason` took a seed and used it for surfaces and
//      travel costs only; the week/tier layout was a pure function of the tier table, so every
//      career in every world played the same calendar for ever.
//
// So this tool prints the grid itself: events per week, the histogram of pile heights, per-tier
// weeks and gaps, and – for a named window of rungs – the OFFERED rhythm (weeks that carry at
// least one event of the window, the longest run of blank weeks, the share of weeks offering a
// CHOICE of two). Plus the seed-difference check, which is a one-line yes/no.
//
// MEASUREMENT ONLY: it calls `buildSeason` and counts. No engine number is written from here.
import { buildSeason, TIERS, TIER_LADDER, isOffSeasonWeek, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const argStr = (name: string, fallback: string): string => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

const SEEDS = argOf('seeds', 6)
const BLOCKS = argOf('blocks', 3)
const VERBOSE = args.includes('--verbose')
const WINDOW = argStr('window', '').split(',').filter(Boolean) as TierId[]

interface BlockShape {
  seed: string
  block: number
  events: number
  /** events on each season-week offset 0..51 */
  perWeek: number[]
  weeksByTier: Map<TierId, number[]>
}

function shapeOf(seed: string, block: number): BlockShape {
  const events = buildSeason(`${seed}:s${block}`, block * WEEKS_PER_YEAR, WEEKS_PER_YEAR)
  const perWeek = Array.from({ length: WEEKS_PER_YEAR }, () => 0)
  const weeksByTier = new Map<TierId, number[]>()
  for (const e of events) {
    perWeek[e.week % WEEKS_PER_YEAR] += 1
    const list = weeksByTier.get(e.tier) ?? []
    list.push(e.week % WEEKS_PER_YEAR)
    weeksByTier.set(e.tier, list)
  }
  for (const list of weeksByTier.values()) list.sort((a, b) => a - b)
  return { seed, block, events: events.length, perWeek, weeksByTier }
}

/** The longest run of consecutive PLAYABLE weeks carrying no event of `tiers`. Off-season weeks are
 *  not gaps – nobody plays them and every career knows it. */
function longestGap(shape: BlockShape, tiers: readonly TierId[]): number {
  const has = (w: number) => tiers.some((t) => (shape.weeksByTier.get(t) ?? []).includes(w))
  let worst = 0
  let run = 0
  for (let w = 0; w < WEEKS_PER_YEAR; w++) {
    if (isOffSeasonWeek(w)) continue
    if (has(w)) run = 0
    else worst = Math.max(worst, ++run)
  }
  return worst
}

const shapes: BlockShape[] = []
for (let s = 0; s < SEEDS; s++) for (let b = 1; b <= BLOCKS; b++) shapes.push(shapeOf(`cal-shape-${s}`, b))

const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length)
const playable = WEEKS_PER_YEAR - Array.from({ length: WEEKS_PER_YEAR }, (_, w) => w).filter(isOffSeasonWeek).length

console.log(`THE CALENDAR'S SHAPE – ${SEEDS} seeds x ${BLOCKS} season blocks, ${playable} playable weeks of ${WEEKS_PER_YEAR}`)
console.log(`  events a season: mean ${mean(shapes.map((s) => s.events)).toFixed(1)} · min ${Math.min(...shapes.map((s) => s.events))} · max ${Math.max(...shapes.map((s) => s.events))}`)

// THE PILE HISTOGRAM – the tail dump's own fingerprint. A healthy grid has no tall bar at all.
const hist = new Map<number, number>()
for (const s of shapes) for (const n of s.perWeek) hist.set(n, (hist.get(n) ?? 0) + 1)
console.log(
  `  events on a week (pooled): ${[...hist.entries()].sort((a, b) => a[0] - b[0]).map(([n, w]) => `${n}->${w}`).join(' ')}` +
    `   TALLEST PILE ${Math.max(...shapes.flatMap((s) => s.perWeek))}`,
)

// The mean grid, week by week – the tail dump reads as a ramp at the right-hand end.
const meanPerWeek = Array.from({ length: WEEKS_PER_YEAR }, (_, w) => mean(shapes.map((s) => s.perWeek[w])))
console.log('\n  mean events per season-week:')
for (let row = 0; row < 4; row++) {
  const from = row * 13
  console.log(
    '   ' +
      Array.from({ length: 13 }, (_, i) => `${String(from + i).padStart(2)}:${meanPerWeek[from + i].toFixed(1)}`).join(' '),
  )
}

console.log('\n  per rung: count, cadence, the widest gap between its own events, and the last week it uses')
for (const t of TIER_LADDER) {
  const counts = shapes.map((s) => (s.weeksByTier.get(t) ?? []).length)
  const lasts = shapes.map((s) => (s.weeksByTier.get(t) ?? []).slice(-1)[0] ?? -1)
  const spans = shapes.map((s) => {
    const ws = s.weeksByTier.get(t) ?? []
    return ws.length < 2 ? 0 : Math.max(...ws.slice(1).map((w, i) => w - ws[i]))
  })
  const tail = shapes.map((s) => (s.weeksByTier.get(t) ?? []).filter((w) => w >= playable - 4).length)
  console.log(
    `    ${t.padEnd(7)} n ${mean(counts).toFixed(1).padStart(5)}  every ${String(TIERS[t].everyNWeeks).padStart(2)}w` +
      `   widest own gap ${mean(spans).toFixed(1).padStart(5)}   last week ${mean(lasts).toFixed(1).padStart(5)}` +
      `   in the last 5 playable weeks ${mean(tail).toFixed(2)}`,
  )
}

// THE WINDOW'S RHYTHM – what a career at one stage of the ladder is actually offered.
const WINDOWS: readonly TierId[][] = WINDOW.length
  ? [WINDOW]
  : [
      ['local', 'regional', 'national'],
      ['regional', 'national', 'j30'],
      ['national', 'j30', 'j60'],
      ['j30', 'j60', 'j300'],
      ['j60', 'j300', 'w15'],
      ['j300', 'w15', 'w35'],
      ['w15', 'w35', 'w50'],
      ['w35', 'w50', 'w75'],
      ['w50', 'w75', 'w100'],
      ['w75', 'w100', 'wta125'],
    ]

console.log('\n  THE OFFERED RHYTHM per window – weeks that carry at least one of it, of the playable span')
console.log('    window                    weeks   per 8   widest blank run   2-in-a-week   3+-in-a-week')
for (const win of WINDOWS) {
  const carried = shapes.map((s) => {
    let n = 0
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      if (isOffSeasonWeek(w)) continue
      if (win.some((t) => (s.weeksByTier.get(t) ?? []).includes(w))) n += 1
    }
    return n
  })
  const twos = shapes.map((s) => {
    let n = 0
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      if (isOffSeasonWeek(w)) continue
      if (win.filter((t) => (s.weeksByTier.get(t) ?? []).includes(w)).length === 2) n += 1
    }
    return n
  })
  const threes = shapes.map((s) => {
    let n = 0
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      if (isOffSeasonWeek(w)) continue
      if (win.filter((t) => (s.weeksByTier.get(t) ?? []).includes(w)).length >= 3) n += 1
    }
    return n
  })
  const gaps = shapes.map((s) => longestGap(s, win))
  console.log(
    `    ${win.join('+').padEnd(24)} ${mean(carried).toFixed(1).padStart(5)}   ${((8 * mean(carried)) / playable).toFixed(1).padStart(5)}` +
      `   ${mean(gaps).toFixed(1).padStart(6)} (worst ${Math.max(...gaps)})` +
      `      ${mean(twos).toFixed(1).padStart(5)}         ${mean(threes).toFixed(1).padStart(5)}`,
  )
}

// TWO SEEDS, TWO CALENDARS – the A2 check, and its determinism twin.
const layout = (seed: string) =>
  buildSeason(`${seed}:s1`, WEEKS_PER_YEAR, WEEKS_PER_YEAR)
    .map((e) => `${e.week}:${e.tier}`)
    .join('|')
const la = layout('shape-seed-A')
const lb = layout('shape-seed-B')
const laAgain = layout('shape-seed-A')
console.log(
  `\n  SEED DEPENDENCE: A vs B ${la === lb ? 'IDENTICAL  <- the layout ignores its seed' : 'DIFFER  <- ok'}` +
    ` · A vs A ${la === laAgain ? 'reproduces  <- ok' : 'DIVERGES  <- determinism broken'}`,
)

if (VERBOSE) {
  for (const s of shapes.slice(0, 2)) {
    console.log(`\n  ${s.seed} block ${s.block}:`)
    for (const t of TIER_LADDER) console.log(`    ${t.padEnd(7)} ${(s.weeksByTier.get(t) ?? []).join(',')}`)
  }
}
