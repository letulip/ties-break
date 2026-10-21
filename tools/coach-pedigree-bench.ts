// THE FAMOUS-NAMES BENCH (docs/specs/coach-pay-ladder-2026-10.md §4.3) – `npx vite-node tools/coach-pedigree-bench.ts`.
// PREDICTIONS ARE IN THE SPEC BEFORE THIS RAN: share ≈ 25% of elite slots, markets with none ≈ 32%, chemistry warm share up
// by ~10–20 points at week 52, ad arrivals ×1.33 (cadence 0.75), top rung = middle rung, ceiling +2.
import { ECONOMY } from '../src/engine/economy'
import { COACH_PEDIGREE, coachPedigree } from '../src/engine/coachPedigree'
import { accrueChemistry, accrueWarmChemistry, freshCoachPair, quietWeek, type CoachPair } from '../src/engine/chemistry'
import { adWritesAt } from '../src/engine/offers'
import { rngFromSeed } from '../src/engine/rng'

const elite = ECONOMY.coach.roster.filter((r) => r.tier === 'elite').map((r) => r.portrait)
let slots = 0, famous = 0, none = 0
const trades: Record<string, number> = {}, kinds: Record<string, number> = {}
for (let i = 0; i < 200; i++) {
  let any = false
  for (const id of elite) {
    slots++
    const p = coachPedigree(`bench-${i}`, id, 'elite')
    if (p) { famous++; any = true; trades[p.trade] = (trades[p.trade] ?? 0) + 1; kinds[p.kind] = (kinds[p.kind] ?? 0) + 1 }
  }
  if (!any) none++
}
console.log(`SHARE famous/slots ${(famous / slots * 100).toFixed(1)}%  markets with none ${(none / 2).toFixed(1)}%  elite slots ${elite.length}`, JSON.stringify(trades), JSON.stringify(kinds))

// chemistry: 4000 pairs, affinity triangular around 0 (the table's centre ± spread), 52 quiet weeks
const warmAt = (famousArm: boolean): number => {
  let warm = 0, sum = 0
  for (let i = 0; i < 4000; i++) {
    const r = rngFromSeed(`bench-aff-${i}`)
    const affinity = Math.max(-1, Math.min(1, (r() + r() - 1) * 0.8))
    let pair: CoachPair | undefined
    for (let w = 0; w < 52; w++) {
      pair = famousArm
        ? accrueWarmChemistry(pair, affinity, `bench-c-${i}`, 'elit-1', w, quietWeek('steady' as never))
        : accrueChemistry(pair ?? freshCoachPair(), affinity, `bench-c-${i}`, 'elit-1', w, quietWeek('steady' as never))
    }
    if (pair!.chem > 0) warm++
    sum += pair!.chem
  }
  return warm / 40 // percent of 4000
}
console.log(`CHEMISTRY share chem>0 at week 52: plain ${warmAt(false).toFixed(1)}%  famous ${warmAt(true).toFixed(1)}%`)

// sponsors: arrivals over 40 seeds × 52 weeks × 3 categories at the bar and at bar/0.75
const bar = ECONOMY.advertising.offerChance
let plain = 0, fast = 0
for (let i = 0; i < 40; i++) for (let w = 300; w < 352; w++) for (const c of ['watches', 'cars', 'drinks'] as const) {
  if (adWritesAt(`bench-ad-${i}`, w, bar, c)) plain++
  if (adWritesAt(`bench-ad-${i}`, w, Math.min(1, bar / COACH_PEDIGREE.sponsorCadenceFactor), c)) fast++
}
console.log(`SPONSORS arrivals per 40 seasons×3 categories: plain ${plain}  famous ${fast}  ratio ${(fast / plain).toFixed(2)}  fee x${COACH_PEDIGREE.sponsorFeeFactor}`)
console.log(`SPARRING top rung ${ECONOMY.sparring.rungs[2].weeklyCents / 100} -> middle rung ${ECONOMY.sparring.rungs[1].weeklyCents / 100} per week; CEILING +${COACH_PEDIGREE.ceilingPoints} points`)
