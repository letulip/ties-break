/**
 * band-vs-field – WHERE HER CEILING SITS AGAINST THE FIELD THE 17.08 FIT PUT UNDER IT.
 *
 * ⚠ MEASUREMENT ONLY, and pure arithmetic: no engine tick, no world, no memo, no career, no RNG
 * stream the game will ever walk again. It patches nothing that outlives the process – see the note
 * on the one-pass trick below for why it does not even need to.
 *
 * Companion to `tools/growth-pace-probe.ts --band lo,hi`, which measures CAREERS. This file answers
 * the half a career corpus cannot afford to: the shape of the ceiling distribution at 100,000
 * careers per band, and what the professional table is in the SAME currency.
 *
 * Two questions the career corpus cannot answer cheaply:
 *   A. For each candidate band, the distribution of her ROLLED CEILING in power()'s own currency
 *      (mean of the five attributes) and the worst wing.
 *   B. What the FIELD is, in that same currency, after the 17.08 fit – `coreForStanding(rank)` is
 *      pure arithmetic on SKILL_LAW, so the strength of the world's #100 is a number, not a sample.
 *
 * ⭐ THE BAND IS AN AFFINE TRANSFORM OF A FIXED DRAW, which is what makes this instant AND exact.
 * `rollPotential` is `start[k] + lo + u_k·(hi−lo)` and `u_k` comes off `seed:potential`, so the five
 * u's of a seed are the SAME in every band (potential-band-2026-08.md §4: "the percentile is
 * band-invariant"). One pass rolls the band [0,1] – whose headroom IS u_k – and every band after
 * that is arithmetic on the stored u's. No band is ever re-rolled and no seed is re-drawn, so every
 * arm below is the same population priced on a different scale.
 */
import { SKILL_KEYS, rollPotential } from '../src/engine/development'
import { startingSkills } from '../src/engine/world'
import { ECONOMY } from '../src/engine/economy'
import { coreForStanding, eloForStanding } from '../src/engine/season/fieldPros'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const N = Number(process.env.N ?? 200000)

const BANDS: [number, number][] = [
  [4, 26],
  [4, 20],
  [0, 22],
  [4, 16],
  [2, 18],
  [10, 20],
  [13, 17],
  [0, 16],
  [0, 12],
  [0, 8],
  [0, 4],
  [0, 0],
  [8, 30],
]

function q(sorted: number[], p: number): number {
  const pos = (sorted.length - 1) * p
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return lo === hi ? sorted[lo] : sorted[lo] * (hi - pos) + sorted[hi] * (pos - lo)
}

// ---- ONE PASS: every seed's start build and its five band-invariant u's -------------------------
const startMean: number[] = []
const uBar: number[] = []
const uMin: number[] = []
{
  const d = ECONOMY.development as unknown as { potentialBand: [number, number] }
  const lo0 = d.potentialBand[0]
  const hi0 = d.potentialBand[1]
  d.potentialBand[0] = 0
  d.potentialBand[1] = 1
  try {
    for (let i = 0; i < N; i++) {
      const seed = `scan-${i}`
      const start = startingSkills(seed, DEFAULT_PROFILE)
      const pot = rollPotential(seed, start)
      let s = 0
      let u = 0
      let mn = Infinity
      for (const k of SKILL_KEYS) {
        s += start[k]
        const uk = pot[k] - start[k] // band [0,1] -> the raw u
        u += uk
        mn = Math.min(mn, uk)
      }
      startMean.push(s / SKILL_KEYS.length)
      uBar.push(u / SKILL_KEYS.length)
      uMin.push(mn)
    }
  } finally {
    d.potentialBand[0] = lo0
    d.potentialBand[1] = hi0
  }
}

/** her mean-of-five CEILING under a band: start + lo + ū·(hi−lo) */
const ceilingsFor = (lo: number, hi: number): number[] =>
  startMean.map((s, i) => s + lo + uBar[i] * (hi - lo))
/** her WORST WING under a band: lo + u_min·(hi−lo) */
const worstFor = (lo: number, hi: number): number[] => uMin.map((u) => lo + u * (hi - lo))

// ---- B. THE FIELD, in power()'s currency -------------------------------------------------------
console.log(`\n=== THE FIELD AFTER THE 17.08 FIT (a412162) – coreForStanding, pure arithmetic ===`)
console.log(`  rank      Elo    core`)
for (const r of [1, 10, 30, 50, 64, 94, 100, 150, 200, 250, 365, 500, 800, 1200, 1600]) {
  console.log(
    `  #${String(r).padStart(5)}  ${eloForStanding(r).toFixed(0).padStart(5)}   ${coreForStanding(r).toFixed(2).padStart(6)}`,
  )
}
const T100 = coreForStanding(100)
const T250 = coreForStanding(250)

// ---- A. HER CEILING, per band ------------------------------------------------------------------
console.log(`\n=== HER ROLLED CEILING, mean-of-five (power()'s currency), ${N} careers per band ===`)
console.log(
  `  band       mean width |    p1    p5   p10   p25   p50   p75   p90   p95   p99   max | worstWing p50 | >core#100 >core#250`,
)
for (const [lo, hi] of BANDS) {
  const ceil = ceilingsFor(lo, hi).sort((a, b) => a - b)
  const worst = worstFor(lo, hi).sort((a, b) => a - b)
  const over = (t: number): string => `${((100 * ceil.filter((c) => c > t).length) / N).toFixed(1)}%`
  console.log(
    `  [${String(lo).padStart(2)},${String(hi).padStart(3)}] ` +
      `${((lo + hi) / 2).toFixed(1).padStart(5)} ${(hi - lo).toFixed(0).padStart(5)} | ` +
      [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
        .map((p) => q(ceil, p).toFixed(1).padStart(5))
        .join(' ') +
      ` ${ceil[ceil.length - 1].toFixed(1).padStart(5)} | ` +
      `${q(worst, 0.5).toFixed(1).padStart(13)} | ` +
      `${over(T100).padStart(9)} ${over(T250).padStart(9)}`,
  )
}
console.log(
  `\n  core(#100) = ${T100.toFixed(2)} · core(#250) = ${T250.toFixed(2)} · world #1 = ${coreForStanding(1).toFixed(2)}` +
    ` · median START build = ${q([...startMean].sort((a, b) => a - b), 0.5).toFixed(2)}`,
)

/** ⭐ THE INVERSE OF THE LAW – what standing a given power() IS. Printed rather than hand-computed,
 *  because "the median career is born at the world's #X" is the page's headline sentence and a
 *  hand-interpolated X in a document is exactly the number that goes quietly stale. */
function standingForCore(core: number): number {
  let lo = 1
  let hi = 5000
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (coreForStanding(mid) > core) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
{
  const sortedStart = [...startMean].sort((a, b) => a - b)
  const startP50 = q(sortedStart, 0.5)
  const ceilShipped = ceilingsFor(4, 26).sort((a, b) => a - b)
  console.log(
    `\n  ⭐ THE MEDIAN CAREER, PLACED ON THE FITTED LADDER:` +
      `\n     born at power ${startP50.toFixed(2)}  =  the world's #${standingForCore(startP50).toFixed(0)}` +
      `\n     ceiling at    ${q(ceilShipped, 0.5).toFixed(2)}  =  the world's #${standingForCore(q(ceilShipped, 0.5)).toFixed(0)}   (shipped band)` +
      `\n     and ${((100 * sortedStart.filter((s) => s > T100).length) / N).toFixed(1)}% are BORN above the world #100's own core.`,
  )
}

// ---- the inverse -------------------------------------------------------------------------------
console.log(`\n=== THE INVERSE – what band MEAN puts S% of ceilings above the world #100's own core ===`)
console.log(`  (exact, by bisection on the affine transform; width held at each row's value)`)
for (const width of [22, 16, 10, 4, 0]) {
  const shareAt = (m: number): number => {
    const lo = m - width / 2
    const hi = m + width / 2
    let k = 0
    for (let i = 0; i < N; i++) if (startMean[i] + lo + uBar[i] * (hi - lo) > T100) k++
    return (100 * k) / N
  }
  const row: string[] = []
  for (const target of [50, 25, 10, 6, 4.5, 3, 1]) {
    let lo = -40
    let hi = 40
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2
      if (shareAt(mid) > target) hi = mid
      else lo = mid
    }
    const m = (lo + hi) / 2
    row.push(`${target}%: ${m.toFixed(1)} [${(m - width / 2).toFixed(1)},${(m + width / 2).toFixed(1)}]`)
  }
  console.log(`  width ${String(width).padStart(2)}  ${row.join('  ')}`)
}
console.log('')
