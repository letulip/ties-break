/**
 * ROUND 35 #9 – HER CUT OF THE BRAND, AND THE TRAP THE ITEM NAMES.
 *
 * THE OWNER: «доход от ее бренда давай тоже как проценты с призовых будем делить: т.е. в интерфейсе
 * напишем про ее долю, в недельном доходе будет семье на руки сумма меньше»
 *
 * ⚠⚠ THIS FILE EXISTS FOR THE MEASUREMENT THE ITEM DEMANDS AND NOT FOR THE FEATURE. The split has
 * ONE safe home – the BANKING site – and one forbidden one: `assetEarningsRateCents` is what
 * `brandGrossWorthCents` MULTIPLIES, so splitting the rate would quietly halve what the brand is
 * WORTH while looking exactly like the asked-for change on the weekly line. The item's words:
 * «after your change the brand's WORTH must not move, and its multiple must stay inside the 6–9x
 * corridor round 32 fixed and round 34 re-checked at 7.46x. Prove it with a before/after.»
 *
 * ⭐ SO THE THREE COLUMNS THAT MATTER ARE THE UNSPLIT ONES: `brandWeeklyGrossCents` (what the
 * valuation multiplies), `brandGrossWorthCents` (the worth) and their ratio over a year (the
 * multiple). A run of this file BEFORE the engine change and a run AFTER it must be
 * BYTE-IDENTICAL on those three. The two new columns – hers and the family's – are zero on the A
 * arm by construction, because the functions that produce them do not exist there.
 *
 * ⚠ THE ARM-DIVERGENCE HAZARD CLAUDE.md RECORDS IS ANSWERED BY SHAPE, NOT BY CARE. Both arms walk
 * the SAME seeds through the SAME `tools/econ-bench.ts` loop with zero draws of their own, and every
 * engine function read here is a pure fold over persisted records – so a difference in the three
 * unsplit columns can only come from the engine change, and there is nothing else in frame.
 *
 * ⚠ MEASUREMENT ONLY: writes no engine constant, persists nothing, and takes no draw of its own.
 *
 * Run:  npx vite-node tools/r35-brand-share.ts
 *       npx vite-node tools/r35-brand-share.ts -- --weeks 780 --seeds 6
 */
import {
  assetKidShareCents,
  assetWorthCents,
  brandGrossWorthCents,
  brandReachOf,
  brandSignalsOf,
  brandWeeklyGrossCents,
  buyAsset,
  createWorld,
  merchFamilyWeeklyIncomeCents,
  merchWeeklyIncomeCents,
  ownedAssets,
  shopItem,
} from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { kidAgeYears } from '../src/engine/world/age'
import { kidPrizeShareBps } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { formatCents } from '../src/shared/money'
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const num = (flag: string, fallback: number): number => {
  const i = args.indexOf(flag)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const WEEKS = num('--weeks', 780)
const SEEDS = num('--seeds', 6)

const MERCH = shopItem('merch-brand')!
/** the rung's own base multiple – read, never typed, so a retune moves this reading with it. */
const BASE_X = MERCH.earningsMultipleX!

interface Row {
  week: number
  /** what a WHOLE brand takes in this week, cents – the figure the VALUATION multiplies. */
  grossCents: number
  /** ...and what a whole brand is worth, cents, before the owned row's mark floor. */
  worthCents: number
  /** worth / a year of gross income – the corridor claim's own number. */
  multipleX: number
  /** her age ramp this week, in bps – 0 before eighteen. */
  herBps: number
}

function walk(presetIndex: number, seedIndex: number): Row[] {
  const { world, rng } = openCareer(PRESETS[presetIndex], seedIndex, POLICIES[0])
  const rows: Row[] = []
  for (let w = 0; w < WEEKS; w++) {
    stepCareerWeek(world, rng, POLICIES[0])
    const grossCents = brandWeeklyGrossCents(brandSignalsOf(world))
    if (grossCents <= 0) continue
    const worthCents = brandGrossWorthCents(brandSignalsOf(world), BASE_X)
    rows.push({
      week: world.week,
      grossCents,
      worthCents,
      multipleX: worthCents / (grossCents * WEEKS_PER_YEAR),
      herBps: kidPrizeShareBps(ageOf(world)),
    })
  }
  return rows
}

const ageOf = (world: WorldState): number =>
  kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)

const pct = (xs: number[], p: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))]
}

console.log(`=== ROUND 35 #9 – THE BRAND'S WORTH, ITS MULTIPLE, AND HER RAMP ===`)
console.log(`weeks ${WEEKS}   seeds/preset ${SEEDS}   baseX ${BASE_X}   price ${formatCents(MERCH.entryCents)}`)
console.log('')

const allMultiples: number[] = []
let peakWorthCents = 0
let peakGrossCents = 0
let peakMultipleX = 0
let earningWeeks = 0
let herWeeks = 0
/** the exactness check the item asks for, run on the ARITHMETIC rather than on the till: her share
 *  rounded once and the family taking the remainder must re-add to the gross on EVERY week. */
let splitMismatches = 0
let grossTotalCents = 0
let herTotalCents = 0
let familyTotalCents = 0

for (let p = 0; p < PRESETS.length; p++) {
  const preset = PRESETS[p]
  const multiples: number[] = []
  let worthPeak = 0
  let grossPeak = 0
  for (let s = 0; s < SEEDS; s++) {
    for (const row of walk(p, s)) {
      earningWeeks++
      multiples.push(row.multipleX)
      allMultiples.push(row.multipleX)
      if (row.worthCents > worthPeak) worthPeak = row.worthCents
      if (row.grossCents > grossPeak) grossPeak = row.grossCents
      if (row.worthCents > peakWorthCents) {
        peakWorthCents = row.worthCents
        peakGrossCents = row.grossCents
        peakMultipleX = row.multipleX
      }
      // The split, computed exactly as the banking site computes it: ONE rounding, remainder by
      // subtraction. `kidPrizeShareCents`' own discipline, checked here rather than trusted.
      const hers = Math.round((row.grossCents * row.herBps) / 10_000)
      const family = row.grossCents - hers
      if (hers + family !== row.grossCents) splitMismatches++
      if (hers > 0) herWeeks++
      grossTotalCents += row.grossCents
      herTotalCents += hers
      familyTotalCents += family
    }
  }
  if (multiples.length === 0) {
    console.log(`${preset.label.padEnd(26)} no earning week`)
    continue
  }
  console.log(
    `${preset.label.padEnd(26)} weeks ${String(multiples.length).padStart(5)}   ` +
      `multiple min ${pct(multiples, 0).toFixed(2)}x  p50 ${pct(multiples, 50).toFixed(2)}x  max ${pct(multiples, 100).toFixed(2)}x   ` +
      `peak weekly ${formatCents(grossPeak).padStart(12)}   peak worth ${formatCents(worthPeak).padStart(14)}`,
  )
}

console.log('')
console.log('=== THE CORRIDOR (round 32 fixed it, round 34 re-checked at 7.46x) ===')
console.log(`earning weeks measured : ${earningWeeks}`)
console.log(
  `multiple across all    : min ${pct(allMultiples, 0).toFixed(4)}x   p50 ${pct(allMultiples, 50).toFixed(4)}x   ` +
    `max ${pct(allMultiples, 100).toFixed(4)}x`,
)
console.log(`PEAK worth             : ${formatCents(peakWorthCents)}`)
console.log(`  its weekly gross     : ${formatCents(peakGrossCents)}`)
console.log(`  its multiple         : ${peakMultipleX.toFixed(4)}x`)
console.log('')
console.log('=== HER RAMP AGAINST THE SAME WEEKS (zero on the A arm before the change ships) ===')
console.log(`weeks her ramp is live : ${herWeeks} of ${earningWeeks}`)
console.log(`brand gross, all careers: ${formatCents(grossTotalCents)}`)
console.log(`  hers                  : ${formatCents(herTotalCents)}`)
console.log(`  the family's          : ${formatCents(familyTotalCents)}`)
console.log(`  re-add exactly        : ${splitMismatches === 0 ? 'YES, every week' : `NO – ${splitMismatches} weeks`}`)

// =================================================================================================
// ⚠⚠ THE SECTION THAT PROVES THE ARM CONTAINS THE READER
// =================================================================================================
//
// CLAUDE.md: «BEFORE YOU BELIEVE A NULL RESULT, PROVE THE ARM CONTAINS BOTH THE CHANGE AND ITS
// READER.» The walk above is a real null and a WEAK one on its own: the bench policy never buys a
// shop rung, so `merchWeeklyIncomeCents` is zero for every career in it and the split never fires.
// A before/after that agrees because neither arm ran the new code is not evidence.
//
// ⭐ SO THIS SECTION OWNS A BRAND. The world is hand-planted at a fixed week – no affordability
// feedback, so nothing here can drift between arms for a reason other than the change – and it
// prints, side by side:
//   * the WHOLE brand's weekly gross and worth, and the multiple joining them  (must not move)
//   * her cut and the family's, out of that same week                          (must be live)
//   * ⭐⭐ THE COUNTERFACTUAL: what the worth would read if the split had been put UPSTREAM, in the
//     income the valuation multiplies, instead of at the banking site. That is the trap the item
//     names, and printing it is the sensitivity check – a measurement that cannot show the defect
//     is not a measurement that can rule it out.
const HAND = (() => {
  const world = createWorld('r35-9-owned', { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = 500
  world.trophiesByTier.wta1000.titles.push(world.week - 4)
  world.trophiesByTier.slam.finals.push(world.week - 30)
  world.seasonHistory = [411, 198, 155, 106, 97, 385, 173, 98, 106, 42, 23].map((endRank, seasonIndex) => ({
    seasonIndex,
    endRank: 40,
    points: 0,
    wins: 30,
    losses: 20,
    byTrack: {
      domestic: { points: 0, wins: 0, losses: 0 },
      itf: { points: 0, wins: 0, losses: 0 },
      wta: { endRank, points: 0, wins: 30, losses: 20 },
    },
    fundsDeltaCents: 0,
    endFundsCents: 0,
  }))
  world.fundsCents = 15_000_000_00
  buyAsset(world, 'merch-brand')
  return world
})()

const ownedRow = ownedAssets(HAND).find((row) => row.id === 'merch-brand')!
const handGrossCents = merchWeeklyIncomeCents(HAND)
const handWorthCents = assetWorthCents(HAND, ownedRow, MERCH)
const handSignals = brandSignalsOf(HAND)
const handMultipleX = handWorthCents / (handGrossCents * WEEKS_PER_YEAR)
const handHerCents = assetKidShareCents(HAND, 'merch-brand')
const handFamilyCents = merchFamilyWeeklyIncomeCents(HAND)
/** ⚠ THE WRONG PLACEMENT, PRICED. If the ramp had been applied to the income the valuation reads,
 *  the worth would fall by exactly her share – which at the cap is HALF the brand. */
const upstreamWorthCents = Math.round(handWorthCents * (1 - handHerCents / Math.max(1, handGrossCents)))

console.log('')
console.log('=== THE READER IS PRESENT: A CAREER THAT ACTUALLY OWNS THE BRAND ===')
console.log(`week ${HAND.week}   her age ${ageOf(HAND)}   ramp ${kidPrizeShareBps(ageOf(HAND)) / 100}%`)
console.log(`brand weekly GROSS     : ${formatCents(handGrossCents)}   (what the valuation multiplies)`)
console.log(`  her cut              : ${formatCents(handHerCents)}`)
console.log(`  the family banks     : ${formatCents(handFamilyCents)}`)
console.log(`  re-add exactly       : ${handHerCents + handFamilyCents === handGrossCents ? 'YES' : 'NO'}`)
console.log(`  split is LIVE        : ${handHerCents > 0 ? 'YES – the arm runs the new code' : 'NO – ARM IS EMPTY'}`)
console.log(`brand WORTH (the card) : ${formatCents(handWorthCents)}`)
console.log(`  its multiple         : ${handMultipleX.toFixed(4)}x`)
console.log(`  reach ${brandReachOf(handSignals).toFixed(2)}   proSeasons ${handSignals.proSeasons}   topSeasons ${handSignals.topSeasons}`)
console.log('')
console.log('--- the counterfactual: the SAME split placed UPSTREAM, in the income the worth reads ---')
console.log(`worth if split in the rate : ${formatCents(upstreamWorthCents)}`)
console.log(`  i.e. the trap would cost : ${formatCents(handWorthCents - upstreamWorthCents)}`)
console.log(
  `  the measurement can see it: ${upstreamWorthCents !== handWorthCents ? 'YES – it moves when the defect is present' : 'NO – INSENSITIVE'}`,
)
