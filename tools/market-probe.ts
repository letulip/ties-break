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
// ⭐ ROUND 30 #14 RE-AIMED IT AT THE UNIT PRICE and added claim 5 – averaging down, which is the
// decision the units exist to make possible: two entries, the second below the first, against one
// entry of the same money. That is «имеешь возможность усредниться», measured.
//
// ⚠ IT PRICES OFF THE ENGINE'S OWN FUNCTIONS (`unitPriceCents`, `assetValueCents`, the catalogue's
// `annualRateBps` / `volBps` / `unitBaseCents`) and never restates the arithmetic. A probe with its own copy of the
// model measures the copy – CLAUDE.md's own «two sides asking different functions about one
// question», in the one place it would be hardest to notice.
//
//   npx vite-node tools/market-probe.ts [--seeds 4000] [--vol 1800]
//
// `--vol` overrides the catalogue's `volBps` for a sweep, so the knob can be moved and re-measured
// without editing the constant – the owner will judge this by feel («я пощупаю и скажу свои
// ощущения потом») and the numbers have to be cheap to move.
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { assetValueCents, shopItem, unitPriceCents, type ShopItem } from '../src/engine/world/assets'
import {
  marketCrash,
  marketCrashFellIn,
  marketCrashLog,
  marketWave,
  worstCrashFreeRatio,
  worstMarketRatio,
} from '../src/engine/world/market'

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

/** ⭐⭐ ROUND 30 #14 – WHAT $1 IN THE FUND IS WORTH AFTER `weeks`, ENTERED AT `from`, **IN UNITS**.
 *  Money buys units at the price of its own week and is worth `units × price(now)` – the engine's
 *  own two functions, not a restatement of them. It is the same number the ratio form produced
 *  (`price(t)/price(f)` IS `(1+r)^span × index(t)/index(f)`), measured through the shape that now
 *  ships, which is the point of a probe that prices off the engine. */
function fundAt(seed: string, from: number, weeks: number): number {
  return unitPriceCents(seed, from + weeks, rung) / unitPriceCents(seed, from, rung)
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
for (const seed of seeds.slice(0, Math.min(400, SEEDS))) {
  for (let w = 0; w <= 780; w++) {
    maxAbsWave = Math.max(maxAbsWave, Math.abs(marketWave(seed, w)))
  }
}
console.log(`\nBOUND  max |wave| over 400 seeds x 780 weeks: ${maxAbsWave.toFixed(4)}  (must be <= 1)`)
console.log(`       crash-free worst ratio e^-2vol = ${worstCrashFreeRatio(VOL).toFixed(4)}`)
console.log(`       total worst ratio (sell at the deepest trough) = ${worstMarketRatio(VOL).toFixed(4)}`)

// --- THE CRASH CALENDAR, REALISED (his extension, 29.08) -----------------------------------------
// «раз в 3-5 лет» – measure it: gaps between consecutive crash starts, drawn depths, and how often
// the FIRST season of a career contains a fall (his «стартовый сезон уже может быть как раз с -20%»).
{
  const gaps: number[] = []
  const depths: number[] = []
  let firstSeasonCrashes = 0
  for (const seed of seeds) {
    let prev = -1
    for (let epoch = 0; epoch * 208 <= 780; epoch++) {
      const c = marketCrash(seed, epoch)
      if (prev >= 0) gaps.push(c.startWeek - prev)
      prev = c.startWeek
      depths.push(Math.exp(c.depthLog) - 1)
    }
    if (marketCrashFellIn(seed, 0, WEEKS_PER_YEAR)) firstSeasonCrashes++
  }
  gaps.sort((a, b) => a - b)
  depths.sort((a, b) => a - b)
  const inBand = gaps.filter((g) => g >= 3 * WEEKS_PER_YEAR && g <= 5 * WEEKS_PER_YEAR).length
  const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  console.log(`\nCRASHES  ${depths.length.toLocaleString()} crises over ${SEEDS} seeds x 15 seasons`)
  console.log(
    `  interval: mean ${(meanGap / WEEKS_PER_YEAR).toFixed(2)}y  min ${(gaps[0] / WEEKS_PER_YEAR).toFixed(1)}y  max ${(gaps[gaps.length - 1] / WEEKS_PER_YEAR).toFixed(1)}y  in the 3-5y band ${((inBand / gaps.length) * 100).toFixed(1)}%`,
  )
  console.log(
    `  drawn depth: median ${(depths[Math.floor(depths.length / 2)] * 100).toFixed(1)}%  range ${(depths[0] * 100).toFixed(1)}%…${(depths[depths.length - 1] * 100).toFixed(1)}%`,
  )
  console.log(`  a career whose FIRST season contains a fall: ${((firstSeasonCrashes / SEEDS) * 100).toFixed(1)}%`)
}

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
const crashSeasonMoves: number[] = []
for (const seed of seeds) {
  for (let w = WEEKS_PER_YEAR; w <= 780; w += WEEKS_PER_YEAR) {
    if (!marketCrashFellIn(seed, w - WEEKS_PER_YEAR, w)) continue
    crashSeasonMoves.push(fundAt(seed, w - WEEKS_PER_YEAR, WEEKS_PER_YEAR) - 1)
  }
}
crashSeasonMoves.sort((a, b) => a - b)
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
// ⭐ ROUND 30 #14 – THE TWO ENDS HE ACTUALLY QUOTED («+65/-15 это то, что я видел»), so the tuning
// can be judged against what he saw rather than against a percentile he never met.
console.log(
  `  p99 ${(pct(0.99) * 100).toFixed(1)}%  best ${(sorted[sorted.length - 1] * 100).toFixed(1)}%  worst ${(sorted[0] * 100).toFixed(1)}%` +
    `   – seasons over +50%: ${((sorted.filter((m) => m > 0.5).length / sorted.length) * 100).toFixed(2)}%`,
)
const csm = (q: number) => crashSeasonMoves[Math.floor(q * (crashSeasonMoves.length - 1))]
console.log(
  `  CRASH seasons (a fall touched the calendar year, ${crashSeasonMoves.length.toLocaleString()} of them): ` +
    `median ${(csm(0.5) * 100).toFixed(1)}%  p10 ${(csm(0.1) * 100).toFixed(1)}%  worst ${(csm(0) * 100).toFixed(1)}%`,
)

// --- 2. THE FUND AGAINST THE DEPOSIT, AT FOUR HORIZONS -------------------------------------------
console.log(`\nHORIZON   samples      fund beats deposit     fund mean   deposit   worst fund   losers selling in calm`)
for (const yrs of [1, 3, 5, 10]) {
  const weeks = yrs * WEEKS_PER_YEAR
  const dep = depositAt(weeks)
  let n = 0
  let beat = 0
  let sum = 0
  let worst = Infinity
  let calmLosers = 0
  for (const seed of seeds) {
    for (const from of ENTRIES) {
      const v = fundAt(seed, from, weeks)
      n++
      sum += v
      if (v < worst) worst = v
      if (v > dep) beat++
      // ⚠ THE TWO-TIER BOUND'S RECEIPT: a loser whose SELL week carries no crash excursion would
      // break the crash-free tier. Expected: zero at 5y and 10y, every loser mid-arc.
      else if (marketCrashLog(seed, from + weeks) === 0) calmLosers++
    }
  }
  console.log(
    `  ${String(yrs).padStart(2)}y   ${String(n).padStart(8)}   ${((beat / n) * 100).toFixed(2).padStart(7)}%  (${(n - beat).toLocaleString()} lose)   ` +
      `${((sum / n - 1) * 100).toFixed(1).padStart(7)}%   ${((dep - 1) * 100).toFixed(1).padStart(6)}%   ${((worst - 1) * 100).toFixed(1).padStart(7)}%   ${String(calmLosers).padStart(6)}`,
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

// --- 5. ⭐⭐ AVERAGING DOWN, THE MOVE THE UNITS EXIST FOR (round 30 #14) --------------------------
// «Или зашёл на пике при цене 7-8к и увидел просадку на следующий год – имеешь возможность
// усредниться или зафиксировать убыток.» So: enter at week `from`, and a season later, IF the price
// has fallen, put the same money in again. Against the control – all of it at week `from` – and
// against the family that waited and put all of it in at the lower price.
//
// ⚠ IT IS A MEASUREMENT AND NOT A RECOMMENDATION. The interesting number is not «averaging wins»
// (it must, arithmetically, whenever the second price is lower) but HOW OFTEN THE SITUATION ARISES
// and how much it is worth – if a drawdown a season after entry is rare, the decision he asked for
// is a decision nobody meets.
{
  const HOLD = 10 * WEEKS_PER_YEAR
  let met = 0
  let n = 0
  let avgGain = 0
  let worstAvg = Infinity
  for (const seed of seeds) {
    for (const from of ENTRIES) {
      n++
      const p0 = unitPriceCents(seed, from, rung)
      const p1 = unitPriceCents(seed, from + WEEKS_PER_YEAR, rung)
      if (p1 >= p0) continue
      met++
      const pEnd = unitPriceCents(seed, from + HOLD, rung)
      // $100k at the peak, $100k a season later at the lower price…
      const averaged = (100 / p0 + 100 / p1) * pEnd
      // …against $200k all at the peak.
      const allAtOnce = (200 / p0) * pEnd
      avgGain += averaged / allAtOnce - 1
      worstAvg = Math.min(worstAvg, averaged / allAtOnce - 1)
    }
  }
  console.log(`\nAVERAGING DOWN  the price is lower a season after entry in ${((met / n) * 100).toFixed(1)}% of entries`)
  console.log(
    `  and the second tranche is worth ${((avgGain / met) * 100).toFixed(1)}% more at ten years than doubling in at the peak ` +
      `(worst case ${(worstAvg * 100).toFixed(1)}%, which must be > 0 or the units are not doing anything)`,
  )
}
