// ⭐⭐ THE SECONDARY MARKET, MEASURED – step S6 of docs/plans/secondary-market-builder-2026-09.md, spec §6 (invariant 5: tuning is measured, not
// guessed). Everything the spec asked to be MEASURED rather than asserted, in one run:
//
//   1. weeks to the FIRST LETTER, p10 / p50 / p90, per lot and per WINDOW – QUIET, IN-ARC and HANGOVER (his ruling §5.4);
//   2. price / worth at that first letter – mean, p10, p90 – per lot and window;
//   3. the share UNSOLD at 2× the family's median (the dead-listing rate: «the elite car and the yacht must show real ones, the first house must
//      not», spec §6's own sentence) and how often the quote's own p90 sits at the horizon;
//   4. the re-list effect: withdrawn after 8 weeks, re-listed 5 weeks later (inside the market's 12-week memory) against 20 weeks later (outside);
//   5. THE TABLE'S OWN PROMISE, END TO END – spec §2d's median for each family's ENTRY rung in a calm market, through the same corridor the game
//      runs, on a large seed set (`--calib`). S1b made the medians exact by construction; this is the run that proves it survives the raiser's call.
//      ⚠ THE GATE IS DETERMINISTIC (S6b, the architect's ruling): the EXACT p50 – the draw-free expectation of the raiser's own per-tick chances on the probe's own seeds and quiet
//      windows (exact cumulative at the median, exact integer p50 with the interpolated one beside it, the per-week density, SE(p50) at the calib N) – must sit within ±1 week of the
//      table; the sampled sold@med (the dice on the same seeds) corroborates within |z| < 2.5. Two verdict columns, because a 20000-seed p50 has a standard error of about a week at
//      the slow families (0.3–0.4 % of the ads sell in the median week) and ±1 on that integer fails by chance for a correct model.
//
// ⚠⚠ SCOPE, AND IT IS STATED HERE BECAUSE IT DECIDES WHAT THE NUMBERS MEAN: it drives the RESALE MODEL directly – `buyerWritesThisWeek` +
// `saleOfferPriceCents` + `assetSaleQuote` (world/resale.ts) over seeded week grids with REAL market paths (`marketCrash`, the crisis calendar the
// fund rides) – and NOT full world ticks. The tick wiring is S3's tested seam (`raiseSaleOffers`, world/shop.ts); the MODEL is what is measured here.
// The call is COPIED from the raiser, not improvised: an ad listed at week L is first drawn at the NEXT tick, week L+1, with `weeksListed = 1`; tick k
// asks `buyerWritesThisWeek(world, id, L+k, k, carry)` and, when a buyer wrote, `saleOfferPriceCents(world, id, L+k, k + carry)`, after
// `revalueAssets` has moved the card to that week (the tick's own order). ⚠ SINCE S6b (30.09) THE QUOTE AND THE SOLVE BEHIND THE TABLE'S MEDIANS COUNT THE SAME CLOCK
// (age k at tick k). S6 found them one step fresher (k−1) and printed both calls side by side, so the gap was a number on the page; that second call is retired with the
// convention it measured – the diagnosis lives in world/resale.ts's ⚠ note and in tests/resale-quote.test.ts's header.
//
// ⚠ POLICY: ACCEPT THE FIRST LETTER – that is what the medians were solved for («a first acceptable letter»). A family that waits for a better one
// would measure a different, longer thing; the corridor's own width (price/worth) is reported so the size of that choice is visible.
//
// ⚠ EVERY LOT IS BOUGHT THE WEEK IT IS LISTED (worth = what was paid), so an entry rung sits at the thin dampener's 1.0 – the lot the table's median is
// stated for – and a dearer rung's dampener is its price alone. The card then follows its own curve week by week (a car depreciates, a house rises).
// The academy is ONE LOT (spec §2e): its rungs are the stages built so far – land, +courts, +building, +staff – and the dearest is all four.
//
// ⚠ THE WINDOWS ARE CUT AT THE WEEK THE AD GOES UP, from the crisis calendar alone (never from what the letters did – that would be selecting on the
// outcome):
//   IN-ARC    a crash arc is open at the listing week;
//   HANGOVER  no arc is open, and one closed within the last `hangoverWeeks` (26) weeks;
//   QUIET     calm at the listing week (neither of the above) AND no arc opens in the next `medianWeeks` weeks of the family's table – the window the table's
//             median is stated over, so the CDF at the median cannot have met a crisis and the QUIET p50 IS the calm-market claim;
//   (other)   calm at the listing week but an arc opens inside that window – in none of the three, and printed in COVERAGE so the omission is visible.
//
// ⚠ IT PRICES OFF THE ENGINE'S OWN FUNCTIONS and restates none of the arithmetic (market-probe's own rule): a probe with its own copy of the model
// measures the copy. The windows read `marketCrash`; the memory carry is `freshnessCarryOf`; the horizon flag is the quote's own `atHorizon`.
//
//   npx vite-node tools/sale-probe.ts [--seeds 200] [--stride 6] [--calib 20000]
//
// Deterministic: fixed seed names, no clock, no Math.random – two runs print the same bytes. Waits are capped at the quote's own horizon
// (QUOTE_HORIZON_WEEKS); a percentile the cap swallows prints as «>520», the quote's own convention for «may not sell at all».
import { createWorld } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { ownedAssets, shopCatalogue, shopItem } from '../src/engine/world/assets'
import { revalueAssets } from '../src/engine/world/shop'
import { marketCrash } from '../src/engine/world/market'
import type { MarketCrash } from '../src/engine/world/market'
import {
  QUOTE_HORIZON_WEEKS,
  assetSaleQuote,
  buyerHazard,
  buyerWritesThisWeek,
  freshnessCarryOf,
  saleOfferPriceCents,
  secondaryOf,
} from '../src/engine/world/resale'
import { formatCents } from '../src/shared/money'
import type { OwnedAsset } from '../src/shared/protocol'

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback
}

const SEEDS = arg('seeds', 200)
const STRIDE = arg('stride', 6)
const CALIB = arg('calib', 20000)
/** the listing weeks: fifteen seasons of a career, starting after the first opening weeks */
const FIRST_LIST_WEEK = 30
const LAST_LIST_WEEK = 780
/** the quote is a pure read and costs a 520-step loop, so it is sampled on a coarser grid than the waits */
const QUOTE_STRIDE = 26
const HORIZON = QUOTE_HORIZON_WEEKS
/** epochs 0..7 cover week 1663 – the last listing (780) plus the whole horizon (520) is 1300 */
const EPOCHS = 8
const secondary = ECONOMY.shop.secondary
/** §2i's scenario: withdrawn after this many weeks up… */
const WITHDRAWN_AFTER = 8
/** …and re-listed this many weeks after the withdrawal – inside the memory window, and outside it */
const RELIST_SOON = 5
const RELIST_LATE = 20

type Window = 'quiet' | 'arc' | 'hang' | 'other'
const WINDOWS: Window[] = ['quiet', 'arc', 'hang', 'other']

interface Lot {
  name: string
  family: string
  /** the rows that sell together: one rung, or for the academy every stage built so far */
  ids: string[]
  /** the id the market's sub-streams are keyed on – for the academy its first stage, the raiser's `lot.keyId` */
  keyId: string
  entryCents: number
  /** E: the family's entry rung, D: its dearest */
  tag: 'E' | 'D' | ''
  /** the table's median for the family (spec §2d) */
  medianWeeks: number
}

function medianOf(family: string): number {
  const rows = secondary.byFamily as Record<string, { medianWeeks: number }>
  return rows[family]!.medianWeeks
}

/** Every rung that can list, cheapest first as on the shelf; the academy's rungs are cumulative lots. */
function buildLots(): Lot[] {
  const rungs = shopCatalogue().filter((r) => secondaryOf(r) !== null)
  const families: string[] = []
  for (const r of rungs) if (!families.includes(r.family)) families.push(r.family)
  const lots: Lot[] = []
  for (const family of families) {
    const mine = rungs.filter((r) => r.family === family)
    mine.forEach((rung, i) => {
      const stages = family === 'academy' ? mine.slice(0, i + 1) : [rung]
      lots.push({
        name: family === 'academy' && i > 0 ? `academy +${rung.id.replace('academy-', '')}` : rung.id,
        family,
        ids: stages.map((s) => s.id),
        keyId: stages[0]!.id,
        entryCents: stages.reduce((sum, s) => sum + s.entryCents, 0),
        tag: i === 0 ? 'E' : i === mine.length - 1 ? 'D' : '',
        medianWeeks: medianOf(family),
      })
    })
  }
  return lots
}

/** One shell of a career: the resale model reads its seed, its week and its rows, and nothing else – so the probe re-seeds it per cell. */
const world: WorldState = createWorld('sale-probe')

function ownedRow(id: string, week: number, extra: Partial<OwnedAsset> = {}): OwnedAsset {
  const item = shopItem(id)!
  return { id, boughtWeek: week, paidCents: item.entryCents, valueCents: item.entryCents, entries: [{ week, cents: item.entryCents }], ...extra }
}

/** The family buys the lot at `week` and holds the card at that week. */
function buy(lot: Lot, week: number): void {
  world.week = week
  world.assets = lot.ids.map((id) => ownedRow(id, week))
  revalueAssets(world)
}

function worthCents(): number {
  let sum = 0
  for (const a of ownedAssets(world)) sum += a.valueCents
  return sum
}

/** ⭐ THE RAISER'S CALL, WALKED: the first tick k (1, 2, …) at which a buyer writes, and the letter's price over the card's worth that week. `carry` is
 *  the market's memory of an earlier ad. Age k at tick k is the raiser's own clock – the one the solve and the quote count too since S6b. */
function firstLetter(lot: Lot, listWeek: number, carry: number): { k: number; ratio: number } | null {
  for (let k = 1; k <= HORIZON; k++) {
    const week = listWeek + k
    world.week = week
    revalueAssets(world)
    if (!buyerWritesThisWeek(world, lot.keyId, week, k, carry)) continue
    const price = saleOfferPriceCents(world, lot.keyId, week, k + carry)
    return { k, ratio: price / worthCents() }
  }
  return null
}

function arcsOf(seed: string): MarketCrash[] {
  return Array.from({ length: EPOCHS }, (_, e) => marketCrash(seed, e))
}

/** The window an ad listed at `week` belongs to (see the header) – a pure read of the crisis calendar. */
function windowOf(arcs: MarketCrash[], week: number, lookaheadWeeks: number): Window {
  let open = false
  let hang = false
  let soon = false
  for (const a of arcs) {
    // `marketCrashLog` is non-zero exactly on the OPEN interval (startWeek, endWeek)
    if (a.startWeek < week && week < a.endWeek) open = true
    else if (week >= a.endWeek && week - a.endWeek < secondary.hangoverWeeks) hang = true
    // an arc's non-zero weeks meet the next `lookahead` weeks (week, week + lookahead]
    if (a.startWeek < week + lookaheadWeeks && a.endWeek > week + 1) soon = true
  }
  if (open) return 'arc'
  if (hang) return 'hang'
  return soon ? 'other' : 'quiet'
}

const R_BIN = 0.0025
const R_BINS = 600

/** What one cell of the table remembers: how many ads were listed, when the first letter came (a histogram by week – exact percentiles, no sort of
 *  a million numbers) and what it offered against worth. */
class Acc {
  n = 0
  byWeek = new Uint32Array(HORIZON + 1)
  ratioSum = 0
  ratioN = 0
  ratioBins = new Uint32Array(R_BINS)

  add(hit: { k: number; ratio: number } | null): void {
    this.n++
    if (!hit) return
    this.byWeek[hit.k] = (this.byWeek[hit.k] ?? 0) + 1
    this.ratioSum += hit.ratio
    this.ratioN++
    const bin = Math.min(R_BINS - 1, Math.max(0, Math.floor(hit.ratio / R_BIN)))
    this.ratioBins[bin] = (this.ratioBins[bin] ?? 0) + 1
  }

  /** the smallest week by which at least `q` of ALL ads had a letter – null when the horizon comes first (an ad that never sold counts against it) */
  wait(q: number): number | null {
    const target = q * this.n
    let cum = 0
    for (let k = 1; k <= HORIZON; k++) {
      cum += this.byWeek[k] ?? 0
      if (cum >= target) return k
    }
    return null
  }

  /** the share of ads that had a letter by week `k` */
  soldBy(k: number): number {
    let cum = 0
    for (let i = 1; i <= k && i <= HORIZON; i++) cum += this.byWeek[i] ?? 0
    return this.n > 0 ? cum / this.n : Number.NaN
  }

  /** the q-quantile of price/worth among the ads that DID get a letter */
  ratioQ(q: number): number {
    const target = q * this.ratioN
    let cum = 0
    for (let b = 0; b < R_BINS; b++) {
      cum += this.ratioBins[b] ?? 0
      if (cum >= target) return (b + 0.5) * R_BIN
    }
    return Number.NaN
  }

  ratioMean(): number {
    return this.ratioN > 0 ? this.ratioSum / this.ratioN : Number.NaN
  }
}

const padL = (s: string | number, w: number): string => String(s).padStart(w)
const padR = (s: string | number, w: number): string => String(s).padEnd(w)
const wk = (v: number | null): string => (v === null ? `>${HORIZON}` : String(v))
const pct = (x: number): string => (Number.isNaN(x) ? '-' : (x * 100).toFixed(1))
const r3 = (x: number): string => (Number.isNaN(x) ? '-' : x.toFixed(3))

const lots = buildLots()
const listWeeks: number[] = []
for (let w = FIRST_LIST_WEEK; w <= LAST_LIST_WEEK; w += STRIDE) listWeeks.push(w)

console.log(`sale-probe – ${SEEDS} seeds x ${listWeeks.length} listing weeks (stride ${STRIDE}, weeks ${FIRST_LIST_WEEK}..${LAST_LIST_WEEK}) x ${lots.length} lots`)
console.log(`  policy: accept the FIRST letter · waits capped at ${HORIZON} weeks (">${HORIZON}" = not reached) · memory window ${secondary.memoryWeeks} weeks · hangover ${secondary.hangoverWeeks} weeks`)
console.log(`  calibration: ${CALIB} seeds, one calm listing each, per family's entry rung`)

// --- THE GRID: every lot, every seed, every listing week -----------------------------------------------------------------------------------
const stats = new Map<string, { byWindow: Record<Window, Acc>; all: Acc }>()
for (const lot of lots) {
  stats.set(lot.name, { byWindow: { quiet: new Acc(), arc: new Acc(), hang: new Acc(), other: new Acc() }, all: new Acc() })
}
for (let s = 0; s < SEEDS; s++) {
  const seed = `sale-probe-${s}`
  world.seed = seed
  const arcs = arcsOf(seed)
  for (const week of listWeeks) {
    for (const lot of lots) {
      const window = windowOf(arcs, week, lot.medianWeeks)
      buy(lot, week)
      const hit = firstLetter(lot, week, 0)
      const st = stats.get(lot.name)!
      st.byWindow[window].add(hit)
      st.all.add(hit)
    }
  }
}

// --- THE QUOTE'S OWN HORIZON: how often the popup would have no upper end to print ------------------------------------------------------------
const horizon = new Map<string, { n: number; at: number; disagree: number }>()
for (const lot of lots) horizon.set(lot.name, { n: 0, at: 0, disagree: 0 })
for (let s = 0; s < SEEDS; s++) {
  world.seed = `sale-probe-${s}`
  for (let week = FIRST_LIST_WEEK; week <= LAST_LIST_WEEK; week += QUOTE_STRIDE) {
    for (const lot of lots) {
      buy(lot, week)
      const q = assetSaleQuote(world, lot.keyId)
      if (!q) continue
      const h = horizon.get(lot.name)!
      h.n++
      if (q.atHorizon) h.at++
      // the flag and the clamped week are one decision – any disagreement is a defect the table would otherwise hide
      if (q.atHorizon !== q.weeksHi >= HORIZON) h.disagree++
    }
  }
}

// --- THE CALIBRATION: the table's median, end to end, on a large seed set --------------------------------------------------------------------
/** ⭐ THE DRAW-FREE WALK (S6b's gate): the raiser's own per-tick chances for the lot – age k at tick k, the card revalued each tick, walked exactly as `firstLetter` walks it –
 *  multiplied out into the cumulative chance a buyer has written by tick k. No dice: it is the expectation of what `firstLetter` samples, on the same listing week. */
function exactCumulative(lot: Lot, listWeek: number, ticks: number): Float64Array {
  const cum = new Float64Array(ticks + 1)
  let survive = 1
  for (let k = 1; k <= ticks; k++) {
    const week = listWeek + k
    world.week = week
    revalueAssets(world)
    survive *= 1 - buyerHazard(world, lot.keyId, week, k, 0)
    cum[k] = 1 - survive
  }
  return cum
}
/** the exact walk runs this many weeks past the table's median – the p50 sits within a few weeks of it */
const EXACT_TAIL = 24
/** the sampled sold@med is corroboration: it passes inside this many standard errors of the exact cumulative */
const Z_GATE = 2.5
interface Calibration {
  lot: Lot
  seeds: number
  skipped: number
  tick: Acc
  soon: Acc
  late: Acc
  carrySoon: number
  carryLate: number
  /** the sum over seeds of the exact cumulative by tick k (k = 0 … median + EXACT_TAIL) – divide by `seeds` for the mean */
  exactSum: Float64Array
  /** the smallest and largest exact cumulative AT THE MEDIAN over the seeds – the proof that the expectation does not depend on which seed it is asked of */
  exactLo: number
  exactHi: number
}
const calibrations: Calibration[] = []
for (const lot of lots.filter((l) => l.tag === 'E')) {
  const ticks = lot.medianWeeks + EXACT_TAIL
  const c: Calibration = {
    lot,
    seeds: 0,
    skipped: 0,
    tick: new Acc(),
    soon: new Acc(),
    late: new Acc(),
    carrySoon: -1,
    carryLate: -1,
    exactSum: new Float64Array(ticks + 1),
    exactLo: 1,
    exactHi: 0,
  }
  for (let i = 0; i < CALIB; i++) {
    const seed = `sale-calib-${i}`
    world.seed = seed
    const arcs = arcsOf(seed)
    let week = -1
    for (let w = 40; w <= 1200; w++) {
      if (windowOf(arcs, w, lot.medianWeeks) === 'quiet') {
        week = w
        break
      }
    }
    if (week < 0) {
      c.skipped++
      continue
    }
    c.seeds++
    // the median claim: the raiser's own call (the dice) and, on the same listing week, the draw-free walk of the same chances (the expectation the dice scatter around)
    buy(lot, week)
    c.tick.add(firstLetter(lot, week, 0))
    buy(lot, week)
    const exact = exactCumulative(lot, week, ticks)
    for (let k = 1; k <= ticks; k++) c.exactSum[k] = (c.exactSum[k] ?? 0) + exact[k]!
    c.exactLo = Math.min(c.exactLo, exact[lot.medianWeeks]!)
    c.exactHi = Math.max(c.exactHi, exact[lot.medianWeeks]!)
    // the re-list pair: the carry is the ENGINE's own reader, asked at the week the new ad goes up; both arms share every draw, so the gap is the memory alone
    const soonRow = ownedRow(lot.keyId, week, { lastListing: { endedWeek: week - RELIST_SOON, exposedWeeks: WITHDRAWN_AFTER } })
    const lateRow = ownedRow(lot.keyId, week, { lastListing: { endedWeek: week - RELIST_LATE, exposedWeeks: WITHDRAWN_AFTER } })
    c.carrySoon = freshnessCarryOf(soonRow, week)
    c.carryLate = freshnessCarryOf(lateRow, week)
    buy(lot, week)
    c.soon.add(firstLetter(lot, week, c.carrySoon))
    buy(lot, week)
    c.late.add(firstLetter(lot, week, c.carryLate))
  }
  calibrations.push(c)
}

// --- PRINT -----------------------------------------------------------------------------------------------------------------------------------
console.log('\nCOVERAGE – ads listed per window (n per lot), and what the card is worth a year on (worth / paid)')
console.log(`${padR('lot', 20)}${padR('fam', 9)} E/D ${padL('entry', 12)} ${padL('a year on', 9)} ${padL('QUIET', 7)} ${padL('IN-ARC', 7)} ${padL('HANGOVR', 8)} ${padL('other', 7)}`)
for (const lot of lots) {
  const st = stats.get(lot.name)!
  buy(lot, 100)
  world.week = 152
  revalueAssets(world)
  const drift = worthCents() / lot.entryCents
  console.log(
    `${padR(lot.name, 20)}${padR(lot.family, 9)} ${padR(lot.tag, 3)} ${padL(formatCents(lot.entryCents), 12)} ${padL(drift.toFixed(3), 9)} ` +
      WINDOWS.map((w, i) => padL(st.byWindow[w].n, i === 2 ? 8 : 7)).join(' '),
  )
}

console.log(`\nWAITS – weeks to the first letter, p10 / p50 / p90 per window (n = 0 prints "-")`)
console.log(`${padR('lot', 20)}${padR('fam', 9)} E/D | ${padR('QUIET', 17)}| ${padR('IN-ARC', 17)}| HANGOVER`)
for (const lot of lots) {
  const st = stats.get(lot.name)!
  const cell = (a: Acc): string => (a.n === 0 ? padL('-', 17) : `${padL(wk(a.wait(0.1)), 5)} ${padL(wk(a.wait(0.5)), 5)} ${padL(wk(a.wait(0.9)), 5)}`)
  console.log(`${padR(lot.name, 20)}${padR(lot.family, 9)} ${padR(lot.tag, 3)} | ${cell(st.byWindow.quiet)} | ${cell(st.byWindow.arc)} | ${cell(st.byWindow.hang)}`)
}

console.log('\nPRICE / WORTH at the first letter – mean [p10 - p90] per window')
console.log(`${padR('lot', 20)}${padR('fam', 9)} E/D | ${padR('QUIET', 21)}| ${padR('IN-ARC', 21)}| HANGOVER`)
for (const lot of lots) {
  const st = stats.get(lot.name)!
  const cell = (a: Acc): string => (a.ratioN === 0 ? padL('-', 21) : `${r3(a.ratioMean())} [${r3(a.ratioQ(0.1))} - ${r3(a.ratioQ(0.9))}]`.padStart(21))
  console.log(`${padR(lot.name, 20)}${padR(lot.family, 9)} ${padR(lot.tag, 3)} | ${cell(st.byWindow.quiet)} | ${cell(st.byWindow.arc)} | ${cell(st.byWindow.hang)}`)
}

console.log('\nUNSOLD at 2x the family median (the dead-listing rate), and how often the quote sits at the horizon')
console.log(`${padR('lot', 20)}${padR('fam', 9)} E/D ${padL('2x med', 7)} ${padL('QUIET %', 9)} ${padL('all wks %', 10)} ${padL('quote at 520 %', 15)}`)
for (const lot of lots) {
  const st = stats.get(lot.name)!
  const cut = 2 * lot.medianWeeks
  const h = horizon.get(lot.name)!
  console.log(
    `${padR(lot.name, 20)}${padR(lot.family, 9)} ${padR(lot.tag, 3)} ${padL(cut, 7)} ${padL(pct(1 - st.byWindow.quiet.soldBy(cut)), 9)} ${padL(pct(1 - st.all.soldBy(cut)), 10)} ${padL(pct(h.n > 0 ? h.at / h.n : Number.NaN), 15)}`,
  )
}
const disagreements = [...horizon.values()].reduce((sum, h) => sum + h.disagree, 0)
console.log(`  (the quote's atHorizon flag against its clamped weeksHi: ${disagreements} disagreements in ${[...horizon.values()].reduce((sum, h) => sum + h.n, 0)} quotes)`)

console.log(`\nCALM ENTRY MEDIAN – spec §2d's table against the game (entry rung bought in a calm week, one listing per seed)`)
console.log(`  GATE (S6b): the EXACT p50 – the draw-free expectation of the raiser's own per-tick chances on these very seeds – within ±1 week of the table.`)
console.log(`  CORROBORATION: the SAMPLED sold@med against the exact cumulative at the median, |z| < ${Z_GATE}; the sampled p50's own standard error is printed beside it.`)
console.log(
  `${padR('family', 9)} ${padL('table', 5)} ${padL('seeds', 6)} | ${padL('exact cum@m', 11)} ${padL('seed spread', 11)} ${padL('exact p50', 9)} ${padL('interp', 6)} ${padL('dens %/wk', 9)} ${padL('verdict', 7)} | ` +
    `${padL('sampled p50', 11)} ${padL('SE(p50)', 7)} ${padL('sold@med %', 10)} ${padL('z', 5)} ${padL('verdict', 7)}`,
)
for (const c of calibrations) {
  const m = c.lot.medianWeeks
  const ticks = m + EXACT_TAIL
  const mean = (k: number): number => (c.seeds > 0 ? (c.exactSum[k] ?? 0) / c.seeds : Number.NaN)
  let exactP50: number | null = null
  for (let k = 1; k <= ticks; k++) {
    if (mean(k) >= 0.5) {
      exactP50 = k
      break
    }
  }
  const interp = exactP50 !== null && exactP50 > 1 ? exactP50 - 1 + (0.5 - mean(exactP50 - 1)) / (mean(exactP50) - mean(exactP50 - 1)) : Number.NaN
  const cumAtMedian = mean(m)
  const density = mean(m) - mean(m - 1)
  const se = Math.sqrt(0.25 / c.seeds) / density
  const sold = c.tick.soldBy(m)
  const z = (sold - cumAtMedian) / Math.sqrt((cumAtMedian * (1 - cumAtMedian)) / c.seeds)
  const exactVerdict = exactP50 !== null && Math.abs(exactP50 - m) <= 1 ? 'ok' : 'MISS'
  const sampledVerdict = Math.abs(z) < Z_GATE ? 'ok' : 'MISS'
  console.log(
    `${padR(c.lot.family, 9)} ${padL(m, 5)} ${padL(c.seeds, 6)} | ${padL(Number.isNaN(cumAtMedian) ? '-' : cumAtMedian.toFixed(4), 11)} ${padL((c.exactHi - c.exactLo).toExponential(1), 11)} ${padL(exactP50 ?? '-', 9)} ${padL(Number.isNaN(interp) ? '-' : interp.toFixed(2), 6)} ${padL(Number.isNaN(density) ? '-' : (density * 100).toFixed(3), 9)} ${padL(exactVerdict, 7)} | ` +
      `${padL(wk(c.tick.wait(0.5)), 11)} ${padL(Number.isNaN(se) ? '-' : se.toFixed(2), 7)} ${padL(pct(sold), 10)} ${padL(Number.isNaN(z) ? '-' : z.toFixed(2), 5)} ${padL(sampledVerdict, 7)}`,
  )
}

console.log(
  `\nRE-LIST – withdrawn after ${WITHDRAWN_AFTER} weeks up; re-listed ${RELIST_SOON} weeks later (inside the memory: the old staleness resumes) vs ${RELIST_LATE} weeks later (outside: a fresh ad)`,
)
console.log(
  `${padR('family', 9)} ${padL('carry', 5)} ${padL('carry', 5)} | ${padL('p50 soon', 8)} ${padL('p50 late', 8)} | ${padL('p90 soon', 8)} ${padL('p90 late', 8)} | ${padL('mean soon', 9)} ${padL('mean late', 9)} | ${padL('px/wo soon', 10)} ${padL('px/wo late', 10)}`,
)
for (const c of calibrations) {
  const meanWait = (a: Acc): string => {
    let sum = 0
    for (let k = 1; k <= HORIZON; k++) sum += k * (a.byWeek[k] ?? 0)
    return a.ratioN > 0 ? (sum / a.ratioN).toFixed(1) : '-'
  }
  console.log(
    `${padR(c.lot.family, 9)} ${padL(c.carrySoon, 5)} ${padL(c.carryLate, 5)} | ${padL(wk(c.soon.wait(0.5)), 8)} ${padL(wk(c.late.wait(0.5)), 8)} | ${padL(wk(c.soon.wait(0.9)), 8)} ${padL(wk(c.late.wait(0.9)), 8)} | ${padL(meanWait(c.soon), 9)} ${padL(meanWait(c.late), 9)} | ${padL(r3(c.soon.ratioMean()), 10)} ${padL(r3(c.late.ratioMean()), 10)}`,
  )
}
console.log('  (mean wait counts only ads that sold inside the horizon; p50 / p90 count every ad, an unsold one against it)')

console.log('\nPROBE_DONE')
