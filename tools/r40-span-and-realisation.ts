/**
 * r40-span-and-realisation – ROUND 40 #5 AND #4, in one walk of the shipped card table.
 *
 * ⚠ #5 FIRST, BECAUSE IT MAY MOVE #4's TARGET. `world/coachMarket.ts` records «enumerating all 32
 * runs through the SHIPPED CARD TABLE gives a span of 1.87 (mean arrival 47.48 at the cheapest,
 * 49.35 at the dearest)». The promo recorder measured its two paths **2.49** apart. A difference
 * cannot exceed the span it lives in, so one of the two figures is wrong. The suspicion this probe
 * tests: the 32 are the five PAIRED decisions (2^5), and the tournament questions at 11, 12 and 13
 * are NOT among them – the recorder's path B says yes to all of them and path A declines.
 *
 * #4 rides along. `handoverBaseBand` reads ARRIVAL against the fresh-fourteen distribution, whose
 * bands are ~2.2 points wide, so 1.87 rarely crosses one (measured elsewhere: 40.9% of seeds).
 * REALISATION divides the same movement by HER OWN headroom instead, so this prints both and their
 * spans side by side. ⚠ It does NOT decide the copy – it decides whether there is anything to say.
 *
 * ⚠ Synthetic seeds only; the owner's saves are read-only and never fixtures.
 *
 * Run: npx vite-node tools/r40-span-and-realisation.ts [-- --seeds 200]
 */
import { childhoodArrival } from '../src/engine/childhood'
import { EMPTY_RUN, withOrigin, withPick, withEntry, yearsSoFar } from '../src/prologue/run'
import { startingSkills } from '../src/engine/world/player'
import { SKILL_KEYS, rollPotential } from '../src/engine/development'
import type { PlayerProfile } from '../src/shared/protocol/profile'
import type { PrologueRun } from '../src/prologue/run'

const args = process.argv.slice(2)
const nSeeds = (() => {
  const i = args.indexOf('--seeds')
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : 200
})()

const PROFILE: PlayerProfile = {
  kidName: 'Alice',
  kidLastName: 'Martin',
  gender: 'girl',
  country: 'IT',
  background: 'middle',
  coachTier: 'self',
  playStyle: 'all-court',
  birthMonth: 6,
  birthDay: 12,
}

/** The five paired decisions the 32-run enumeration varies, cheapest first. */
const PAIRS: readonly (readonly [number, string, string])[] = [
  [8, 'municipal', 'club'],
  [9, 'group', 'one-to-one'],
  [10, 'stay-home', 'enter'],
  [11, 'ordinary-school', 'sports-school'],
  [12, 'let-her-stop', 'give-her-the-year'],
]
/** The tournament questions the enumeration does NOT vary – #5's suspicion. */
const ASK_AGES = [11, 12, 13] as const

function build(mask: number, sayYes: boolean): PrologueRun {
  let run = withOrigin(EMPTY_RUN, 'middle')
  for (const [i, [age, cheap, dear]] of PAIRS.entries()) {
    run = withPick(run, age, (mask >> i) & 1 ? dear : cheap)
  }
  for (const age of ASK_AGES) run = withEntry(run, age, sayYes ? 'enter' : 'stay-home')
  return run
}

const meanOf = (s: Record<string, number>) => SKILL_KEYS.reduce((n, k) => n + (s as any)[k], 0) / SKILL_KEYS.length

type Row = { mask: number; yes: boolean; arrival: number; realised: number }

function measure(seed: string): Row[] {
  const born = startingSkills(seed, PROFILE)
  const pot = rollPotential(seed, born)
  const rows: Row[] = []
  for (let mask = 0; mask < 32; mask++) {
    for (const yes of [false, true]) {
      const run = build(mask, yes)
      const skills = childhoodArrival(born, yearsSoFar(run))
      const arrival = meanOf(skills as any)
      // ⚠ REALISATION AS ROUND 34 DEFINED IT: gained over the room she was BORN with, never over the
      // asymptote – that division is what stopped the verdict arriving earlier for the less gifted.
      let gained = 0
      let room = 0
      for (const k of SKILL_KEYS) {
        gained += (skills as any)[k] - (born as any)[k]
        room += (pot as any)[k] - (born as any)[k]
      }
      rows.push({ mask, yes, arrival, realised: room > 0 ? gained / room : 0 })
    }
  }
  return rows
}

const spans: { arrivalAll: number[]; arrivalNoAsk: number[]; realisedAll: number[]; realisedNoAsk: number[] } = {
  arrivalAll: [], arrivalNoAsk: [], realisedAll: [], realisedNoAsk: [],
}
for (let i = 0; i < nSeeds; i++) {
  const rows = measure(`span-${i}`)
  const noAsk = rows.filter((r) => !r.yes)
  const span = (xs: number[]) => Math.max(...xs) - Math.min(...xs)
  spans.arrivalAll.push(span(rows.map((r) => r.arrival)))
  spans.arrivalNoAsk.push(span(noAsk.map((r) => r.arrival)))
  spans.realisedAll.push(span(rows.map((r) => r.realised)))
  spans.realisedNoAsk.push(span(noAsk.map((r) => r.realised)))
}
const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]

console.log(`\nCORPUS: ${nSeeds} seeds x 32 paired runs x {declines, enters 11/12/13}\n`)
console.log('#5 – THE SPAN, and whether the tournament questions are the missing part')
console.log(`  arrival span, the 32 pairs ONLY (the enumeration's own shape)   median ${med(spans.arrivalNoAsk).toFixed(2)} points`)
console.log(`  arrival span, WITH the 11/12/13 questions varied               median ${med(spans.arrivalAll).toFixed(2)} points`)
console.log(`  the recorded figure to compare against: 1.87; the film measured 2.49`)

console.log('\n#4 – ARRIVAL AGAINST REALISATION, the same movement read two ways')
console.log(`  realisation span, the 32 pairs only                            median ${(med(spans.realisedNoAsk) * 100).toFixed(1)} percentage points`)
console.log(`  realisation span, with the questions varied                    median ${(med(spans.realisedAll) * 100).toFixed(1)} percentage points`)

// ⭐⭐ THE NUMBER THE DECISION ACTUALLY HANGS ON. A wider span is worth nothing if the SENTENCE does
// not change with it, and the arrival band moves on a measured 40.9% of seeds. So cut realisation the
// way the arrival cuts were cut - p20/p80 of its own distribution at fourteen - and ask the same
// question of it: on what share of seeds do the cheapest and dearest childhoods land in different
// bands? Anything at or below 40.9% means the reading is not worth changing.
const allReal: number[] = []
for (let i = 0; i < nSeeds; i++) for (const r of measure(`span-${i}`)) allReal.push(r.realised)
allReal.sort((a, b) => a - b)
const q = (p2: number) => allReal[Math.floor(allReal.length * p2)]
const [lo, hi] = [q(0.2), q(0.8)]
const bandOf = (x: number) => (x < lo ? 0 : x > hi ? 2 : 1)
let moved = 0
let movedArrival = 0
const ARR_LO = 46.3
const ARR_HI = 50.7
const arrBand = (x: number) => (x < ARR_LO ? 0 : x > ARR_HI ? 2 : 1)
for (let i = 0; i < nSeeds; i++) {
  const rows = measure(`span-${i}`)
  const cheap = rows.reduce((a, b) => (a.arrival <= b.arrival ? a : b))
  const dear = rows.reduce((a, b) => (a.arrival >= b.arrival ? a : b))
  if (bandOf(cheap.realised) !== bandOf(dear.realised)) moved++
  if (arrBand(cheap.arrival) !== arrBand(dear.arrival)) movedArrival++
}
console.log('\n⭐ DOES THE SENTENCE MOVE? cheapest vs dearest childhood, same seed')
console.log(`  realisation cuts (its own p20/p80): ${(lo * 100).toFixed(1)}% / ${(hi * 100).toFixed(1)}%`)
console.log(`  the REALISATION band differs on   ${moved} of ${nSeeds}  (${((moved / nSeeds) * 100).toFixed(1)}%)`)
console.log(`  the ARRIVAL band differs on       ${movedArrival} of ${nSeeds}  (${((movedArrival / nSeeds) * 100).toFixed(1)}%)  – the shipped reading`)
console.log(`  ⚠ realisation goes NEGATIVE for a neglected childhood: min ${(allReal[0] * 100).toFixed(1)}%, max ${(allReal[allReal.length - 1] * 100).toFixed(1)}%`)

const sample = measure('span-0')
const cheapest = sample.reduce((a, b) => (a.arrival <= b.arrival ? a : b))
const dearest = sample.reduce((a, b) => (a.arrival >= b.arrival ? a : b))
console.log('\nONE SEED, END TO END (span-0)')
console.log(`  cheapest childhood  arrival ${cheapest.arrival.toFixed(2)}  realised ${(cheapest.realised * 100).toFixed(1)}%`)
console.log(`  dearest childhood   arrival ${dearest.arrival.toFixed(2)}  realised ${(dearest.realised * 100).toFixed(1)}%`)
console.log(`  the two differ by   ${(dearest.arrival - cheapest.arrival).toFixed(2)} points of arrival · ${((dearest.realised - cheapest.realised) * 100).toFixed(1)} points of realisation`)
