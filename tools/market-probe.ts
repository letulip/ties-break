// ⭐⭐ THE MARKET, MEASURED – round 29 part three #16. Everything the item asked to be MEASURED
// rather than asserted, in one run:
//
//   1. how often a year is negative («roughly one year in four or five»),
//   2. the fund against the 3.17% deposit at 1 / 3 / 5 / 10 years, across many seeds and every
//      entry week («⚠⚠ On a long horizon the fund MUST beat Savings»),
//   3. the bound |wave| <= 1 that makes claim 2 a PROOF and not a sample,
//   4. what the path actually looks like – the annual volatility and the deepest drawdown a career
//      can sit in, because «enough that the risk is felt» is a number too.
//
// ⚠ IT PRICES OFF THE ENGINE'S OWN FUNCTIONS (`assetValueCents`, `marketRatio`, the catalogue's
// `annualRateBps` / `volBps`) and never restates the arithmetic. A probe with its own copy of the
// model measures the copy – CLAUDE.md's own «two sides asking different functions about one
// question», in the one place it would be hardest to notice.
//
//   npx vite-node tools/market-probe.ts [--seeds 4000] [--vol 1800]
//
// `--vol` overrides the catalogue's `volBps` for a sweep, so the knob can be moved and re-measured
// without editing the constant – the owner will judge this by feel («я пощупаю и скажу свои
// ощущения потом») and the numbers have to be cheap to move.
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { assetValueCents, shopItem, type ShopItem } from '../src/engine/world/assets'
import { marketRatio, marketWave, worstMarketRatio } from '../src/engine/world/market'

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback
}

const SEEDS = arg('seeds', 4000)
const fund = shopItem('index-fund')!
const deposit = shopItem('deposit')!
const VOL = arg('vol', fund.volBps ?? 0)
// The rung as the sweep wants it – a copy with the swept volatility, so `--vol` reaches the same
// arithmetic the engine uses rather than a second one.
const rung: ShopItem = { ...fund, volBps: VOL }

/** What $1 in the fund is worth after `weeks`, entered at `from`. The ENGINE's arithmetic. */
function fundAt(seed: string, from: number, weeks: number): number {
  const to = from + weeks
  return assetValueCents(rung, 1_000_000_00, weeks, marketRatio(seed, from, to, VOL)) / 1_000_000_00
}
/** ...and the same dollar in the deposit, off the deposit's own rate. */
function depositAt(weeks: number): number {
  return assetValueCents(deposit, 1_000_000_00, weeks) / 1_000_000_00
}

const seeds = Array.from({ length: SEEDS }, (_, i) => `market-probe-${i}`)
// Entry weeks spread over the first twelve seasons – a career can open the fund at any of them, and
// «the fund beats savings» has to be true for the unlucky entrant, not for the average one.
const ENTRIES = [0, 17, 34, 52, 91, 130, 182, 234, 312, 416, 520, 624]

console.log(`market-probe – ${SEEDS} seeds x ${ENTRIES.length} entry weeks, vol ${VOL} bps`)
console.log(`  fund ${fund.annualRateBps} bps/yr · deposit ${deposit.annualRateBps} bps/yr`)

// --- 3. THE BOUND, first, because every other claim leans on it ----------------------------------
let maxAbsWave = 0
let maxRatioSeen = 0
let minRatioSeen = Infinity
for (const seed of seeds.slice(0, Math.min(400, SEEDS))) {
  for (let w = 0; w <= 780; w++) {
    maxAbsWave = Math.max(maxAbsWave, Math.abs(marketWave(seed, w)))
  }
}
console.log(`\nBOUND  max |wave| over 400 seeds x 780 weeks: ${maxAbsWave.toFixed(4)}  (must be <= 1)`)
console.log(`       worst possible ratio e^-2vol = ${worstMarketRatio(VOL).toFixed(4)}`)

// --- 1. HOW OFTEN IS A YEAR NEGATIVE? ------------------------------------------------------------
let years = 0
let negativeYears = 0
const yearMoves: number[] = []
for (const seed of seeds) {
  for (let w = 0; w + WEEKS_PER_YEAR <= 780; w += 13) {
    const move = fundAt(seed, w, WEEKS_PER_YEAR) - 1
    yearMoves.push(move)
    years++
    if (move < 0) negativeYears++
  }
}
const meanYear = yearMoves.reduce((a, b) => a + b, 0) / yearMoves.length
const sdYear = Math.sqrt(yearMoves.reduce((a, b) => a + (b - meanYear) ** 2, 0) / yearMoves.length)
const sorted = [...yearMoves].sort((a, b) => a - b)
const pct = (p: number) => sorted[Math.floor(p * (sorted.length - 1))]
console.log(`\nYEARS  ${years.toLocaleString()} rolling seasons`)
console.log(`  negative: ${negativeYears.toLocaleString()} (${((negativeYears / years) * 100).toFixed(1)}%)`)
console.log(`  mean ${(meanYear * 100).toFixed(2)}%  sd ${(sdYear * 100).toFixed(2)}%`)
console.log(
  `  p5 ${(pct(0.05) * 100).toFixed(1)}%  p25 ${(pct(0.25) * 100).toFixed(1)}%  p50 ${(pct(0.5) * 100).toFixed(1)}%  p75 ${(pct(0.75) * 100).toFixed(1)}%  p95 ${(pct(0.95) * 100).toFixed(1)}%`,
)

// --- 2. THE FUND AGAINST THE DEPOSIT, AT FOUR HORIZONS -------------------------------------------
console.log(`\nHORIZON   samples      fund beats deposit     fund mean   deposit   worst fund`)
for (const yrs of [1, 3, 5, 10]) {
  const weeks = yrs * WEEKS_PER_YEAR
  const dep = depositAt(weeks)
  let n = 0
  let beat = 0
  let sum = 0
  let worst = Infinity
  for (const seed of seeds) {
    for (const from of ENTRIES) {
      const v = fundAt(seed, from, weeks)
      n++
      sum += v
      if (v < worst) worst = v
      if (v > dep) beat++
    }
  }
  console.log(
    `  ${String(yrs).padStart(2)}y   ${String(n).padStart(8)}   ${((beat / n) * 100).toFixed(2).padStart(7)}%  (${(n - beat).toLocaleString()} lose)   ` +
      `${((sum / n - 1) * 100).toFixed(1).padStart(7)}%   ${((dep - 1) * 100).toFixed(1).padStart(6)}%   ${((worst - 1) * 100).toFixed(1).padStart(7)}%`,
  )
}

// --- 4. THE DEEPEST HOLE A CAREER CAN SIT IN -----------------------------------------------------
// From the peak of a holding opened at week 0 to its lowest point afterwards – what «the risk is
// felt» costs at its worst, and the figure the owner will meet first if he is unlucky.
let deepest = 0
let deepestSeed = ''
for (const seed of seeds.slice(0, Math.min(1000, SEEDS))) {
  let peak = 0
  for (let w = 0; w <= 780; w += 4) {
    const v = fundAt(seed, 0, w)
    peak = Math.max(peak, v)
    const dd = v / peak - 1
    if (dd < deepest) {
      deepest = dd
      deepestSeed = seed
    }
  }
}
console.log(`\nDRAWDOWN  worst peak-to-trough on a week-0 holding: ${(deepest * 100).toFixed(1)}%  (${deepestSeed})`)
