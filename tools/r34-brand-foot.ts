// ROUND 34 items 7/11/12/13/17 – THE FOOT OF THE SPONSOR LADDER AND THE BRAND, READ OFF HIS SAVE.
//
//   npx vite-node tools/r34-brand-foot.ts -- --save ~/Downloads/tennis-sim_vera-8oem_w569.tsave
//
// ⚠ READ-ONLY LAW, the same standing tools/injury-saves-read.ts carries: the save is personal, is
// handed in on the command line, is read through the game's own import door (`decodeExportFile`)
// and is NEVER copied into the repo or made a fixture. What the repo keeps is the DERIVED numbers
// printed here and recorded in docs/rounds/round-34.md – never the career.
//
// WHAT IT PRINTS, in the order the four builds need it:
//   1. WHO SHE IS – week, WTA rank, seasons, the season-end ladder she has actually walked.
//   2. F1 – the trophy shelf per tier, titles and FINALS, and what the finals are worth.
//   3. F2 – academy reputation, the rungs her seasons matched, and the career cap.
//   4. F3 – the live ad deals and their annual value, and the band the market writes her at.
//   5. F4 – fame, the brand's weekly, its worth and the multiple that joins them.
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { ECONOMY } from '../src/engine/economy'
import { fameAt, fameFloorOf, fameShootMultOf } from '../src/engine/world/fame'
import { brandSignalsOf, brandGrossWorthCents, brandMultipleX, brandReachOf, brandWeeklyGrossCents } from '../src/engine/world/brand'
import { academyReputationOf } from '../src/engine/world/business'
import { shopItem } from '../src/engine/world/assets'
import { activeAdDeals, adBandFor, adBandOfTerms, adCategoryOf } from '../src/engine/offers'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { formatCents } from '../src/shared/money'
import type { TierId } from '../src/engine/season/types'
import type { AdOfferTerms } from '../src/shared/protocol'
import type { BrandSignals } from '../src/engine/world/brand'

const args = process.argv.slice(2)
let savePath = ''
for (let i = 0; i < args.length; i++) if (args[i] === '--save' && args[i + 1]) savePath = args[++i]
if (!savePath) {
  console.error('usage: npx vite-node tools/r34-brand-foot.ts -- --save /path/career.tsave')
  process.exit(1)
}

const world = await decodeExportFile(new Uint8Array(readFileSync(savePath)))
const week = world.week

console.log('=== 1. WHO SHE IS ===')
console.log(`week ${week}   kidRankWta ${world.kidRankWta ?? '-'}   seasons ${world.seasonHistory?.length ?? 0}`)
const rows = (world.seasonHistory ?? []).filter((r) => r.byTrack?.wta?.endRank != null)
console.log(`pro seasons (a WTA end-rank recorded): ${rows.length}`)
console.log(`end ranks: ${rows.map((r) => r.byTrack!.wta!.endRank).join(', ')}`)

console.log('')
console.log('=== 2. F1 – THE SHELF ===')
let finalsAll = 0
let finalsPro = 0
const F = ECONOMY.fame
for (const [tier, shelf] of Object.entries(world.trophiesByTier ?? {}) as [TierId, { titles: number[]; finals: number[] }][]) {
  if (!shelf) continue
  if (shelf.titles.length === 0 && shelf.finals.length === 0) continue
  finalsAll += shelf.finals.length
  if (F.titleFloor[tier] != null) finalsPro += shelf.finals.length
  console.log(
    `  ${tier.padEnd(8)} titles ${String(shelf.titles.length).padStart(2)}  finals ${String(shelf.finals.length).padStart(2)}` +
      `   titleFloor ${String(F.titleFloor[tier] ?? '-').padStart(5)}   finals weeks [${shelf.finals.join(', ')}]`,
  )
}
console.log(`  finals on every shelf: ${finalsAll}   of them on a tier fame prices: ${finalsPro}`)

console.log('')
console.log('=== 3. F2 – THE SEASON-END LADDER ===')
const A = ECONOMY.business.academy
for (const r of rows) {
  const endRank = r.byTrack!.wta!.endRank!
  const band = A.reputationBands.find((b) => endRank <= b.maxEndRank)
  console.log(`  season ${String(r.seasonIndex).padStart(2)}  end #${String(endRank).padStart(4)}  rung ${band ? `top-${band.maxEndRank} +${band.add}` : 'NONE'}`)
}
const rep = academyReputationOf(world)
console.log(`  reputation ${rep.toFixed(3)}   ladder total above the 1.0 base ${(rep - 1).toFixed(3)}   cap ${A.reputationCapBase} + ${A.reputationCapPerSeason}/season = ${A.reputationCapBase + A.reputationCapPerSeason * rows.length}`)

console.log('')
console.log('=== 4. F3 – THE AD MARKET ===')
for (const offer of world.offers ?? []) {
  if (offer.kind !== 'ad') continue
  const t = offer.terms as AdOfferTerms
  console.log(
    `  ${String(offer.state).padEnd(8)} ${String(adCategoryOf(t)).padEnd(10)} ${formatCents(t.cashCents ?? 0).padStart(12)}/yr` +
      `  band ${adBandOfTerms(t)}  from ${offer.fromWeek ?? '-'} until ${offer.untilWeek ?? '-'}  shoots ${(t.shootWeeks ?? []).length}`,
  )
}
let liveAnnual = 0
for (const o of activeAdDeals(world.offers ?? [], week)) liveAnnual += (o.terms as AdOfferTerms).cashCents ?? 0
console.log(`  LIVE annual contract value: ${formatCents(liveAnnual)}`)
const standing = sponsorStandingOf(world)
console.log(`  standing wtaRank ${standing.wtaRank} ranked ${standing.wtaRanked}  -> adBandFor ${adBandFor(standing)}`)

console.log('')
console.log('=== 5. F4 – THE BRAND ===')
const signals = brandSignalsOf(world, week)
const baseX = shopItem('merch-brand')?.earningsMultipleX ?? 0
console.log(`  fame ${fameAt(world, week).toFixed(3)}  (floor ${fameFloorOf(world, week).toFixed(3)} x shootMult ${fameShootMultOf(world, week).toFixed(3)})`)
console.log(`  strength ${signals.strength.toFixed(3)}   proSeasons ${signals.proSeasons}   topSeasons ${signals.topSeasons}   finalsLost ${signals.finalsLost}`)
console.log(`  roomSize ${signals.roomSize.toFixed(1)}   winRate ${signals.winRate.toFixed(3)}   baseX ${baseX}`)
console.log(`  contractFame ${signals.contractFame.toFixed(3)}   reach ${brandReachOf(signals).toFixed(3)}`)
console.log(`  weekly ${formatCents(brandWeeklyGrossCents(signals))}   multiple ${brandMultipleX(signals, baseX).toFixed(2)}x`)
console.log(`  worth  ${formatCents(brandGrossWorthCents(signals, baseX))}`)

console.log('')
console.log('=== 6. THE APPROVED TARGET ROWS, AS SCENARIOS ===')
const row = (label: string, ownFame: number, dealCents: number, sig: BrandSignals): void => {
  const s2: BrandSignals = { ...sig, fame: ownFame, strength: ownFame, contractFame: Math.min(30, dealCents / 50_000_00) }
  const wk = brandWeeklyGrossCents(s2)
  const worth = brandGrossWorthCents(s2, baseX)
  console.log(
    `  ${label.padEnd(34)} reach ${brandReachOf(s2).toFixed(1).padStart(5)}  weekly ${formatCents(wk).padStart(9)}` +
      `  a year ${formatCents(wk * 52).padStart(11)}  worth ${formatCents(worth).padStart(12)}  ${brandMultipleX(s2, baseX).toFixed(2)}x`,
  )
}
// a plain top-100 professional: the shelf and the room of a career at that rung, her own fame 6
row('top-100, $600k deals, own fame 6', 6, 600_000_00, { ...signals, proSeasons: 6, topSeasons: 0, finalsLost: 4 })
row('his save signals, $1M, own fame 8.9', 8.925, 1_000_000_00, signals)
row('his save signals, $550k (measured)', 8.925, 550_000_00, signals)

console.log('')
console.log('=== 7. F1 ALONE, contracts held out – the approved F1 row ===')
const f1only: BrandSignals = { ...signals, contractFame: 0 }
console.log(
  `  reach ${brandReachOf(f1only).toFixed(3)}  weekly ${formatCents(brandWeeklyGrossCents(f1only))}` +
    `  multiple ${brandMultipleX(f1only, baseX).toFixed(2)}x  worth ${formatCents(brandGrossWorthCents(f1only, baseX))}`,
)
// ...and the same row with the valuation's own `finalX` term held out, which is the double-count
// question: does the multiple still sit inside the 6-9x corridor with BOTH terms live?
const V = ECONOMY.business.merch.value
const noFinalX: BrandSignals = { ...f1only, finalsLost: 0 }
console.log(
  `  finalX held out: multiple ${brandMultipleX(noFinalX, baseX).toFixed(2)}x` +
    `  worth ${formatCents(brandGrossWorthCents(noFinalX, baseX))}   (finalX=${V.finalX} x ${Math.min(f1only.finalsLost, V.finalCapN)} = ${(V.finalX * Math.min(f1only.finalsLost, V.finalCapN)).toFixed(2)} of the multiple)`,
)
