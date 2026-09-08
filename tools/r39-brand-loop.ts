/**
 * ROUND 39 #5 (REOPENED) – THE BRAND SELL-AND-REBUY LOOP, MEASURED BEFORE AND AFTER THE A+C FIX.
 *
 * The owner, 08.09: «Я завел бренд у Инэс, он за несколько недель стал стоить 22 млн, я его продал.
 * Потом купил новый за 250к, а он снова за несколько недель уже 30+ стоит.» His approval of A+C:
 * «давай попробуем». Two dials moved and this tool prints what each one did:
 *
 *   C. `worthRamp.minHalfLifeWeeks` 13 → 52 – the RE-BUY CURVE at the fame cap (week 1/5/13/26/52),
 *      before against after.
 *   A. a REPEAT founding priced at the market's current derived worth (`assetEntryPriceCents`) –
 *      the FULL CYCLE YIELD (sell at the worth → re-found), before against after.
 *
 * ⚠⚠ THE WORLD IS SYNTHETIC, deliberately: his saves in ~/Downloads are READ-ONLY and never
 * fixtures (the round-39 header's own law). The state here is the round30-brand-value fixture idiom
 * – a professional world with dated slam titles stuffed onto the trophy ledger until fame sits at
 * the cap – so the numbers are the mechanism's own, not a copy of his career.
 *
 * ⚠ THE BEFORE-ARM IS THE SHIPPED CURVE UNDER THE OLD FLOOR, computed through the SAME
 * `rampedWorthCents` the engine runs, with the half-life clamp restated at the old 13-week floor
 * (`min(416, max(13, 104/pace))` – the constants' own arithmetic as they stood at round 38). The
 * reader and the change share one tree, so neither arm can be the null-arm CLAUDE.md warns about;
 * the one restated literal is the floor under measurement.
 *
 * MEASUREMENT ONLY: reads the engine, writes no constant, draws on no persisted stream.
 *
 * Run:  npx vite-node tools/r39-brand-loop.ts
 */
import {
  assetEntryPriceCents,
  assetWorthCents,
  brandGrossWorthCents,
  brandSignalsOf,
  buyAsset,
  closeTournament,
  createWorld,
  fameAt,
  ownedAssets,
  revalueAssets,
  sellAsset,
  shopItem,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../src/engine/world'
import { rampedWorthCents, worthRampHalfLife } from '../src/engine/world/assets'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { formatCents } from '../src/shared/money'

const MERCH = 'merch-brand'
const PRICE = 250_000_00
const R = ECONOMY.shop.worthRamp

/** The old clamp, restated for the A arm: round 38 shipped `min(max, max(13, halfLife/pace))`. */
function halfLifeUnderOldFloor(driver: number): number {
  const pace = Math.max(0, driver) / R.medianFame
  if (!(pace > 0)) return R.maxHalfLifeWeeks
  return Math.min(R.maxHalfLifeWeeks, Math.max(13, R.halfLifeWeeks / pace))
}

function capFameWorld(seed: string): WorldState {
  const world = createWorld(seed)
  world.bestFinishByTier.wta250 = 3
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  // Fame is a fold over dated records, never a field – so the cap is reached the way a career
  // reaches it: titles on the ledger. Recent weeks, so the decay kernel is ~1 for all of them.
  world.trophiesByTier.slam ??= { titles: [], finals: [] }
  for (let k = 0; k < 12; k++) world.trophiesByTier.slam!.titles.push(1 + k)
  world.trophiesByTier.wta1000 ??= { titles: [], finals: [] }
  for (let k = 0; k < 8; k++) world.trophiesByTier.wta1000!.titles.push(2 + k)
  world.fundsCents = 500_000_000_00
  return world
}

const owned = (w: WorldState) => ownedAssets(w).find((a) => a.id === MERCH)

function main(): void {
  const w = capFameWorld('r39-brand-loop')
  const item = shopItem(MERCH)!
  const fame = fameAt(w)
  const halfAfter = worthRampHalfLife(fame, R.medianFame)
  const halfBefore = halfLifeUnderOldFloor(fame)
  console.log(`fame at purchase: ${fame.toFixed(1)} of ${ECONOMY.fame.cap}`)
  console.log(`half-life: before ${halfBefore.toFixed(1)}w (floor 13) -> after ${halfAfter.toFixed(1)}w (floor ${R.minHalfLifeWeeks})`)

  // --- C: the re-buy curve – what a brand bought TODAY for $250,000 is worth `weeks` on ---------
  buyAsset(w, MERCH)
  const row = owned(w)!
  console.log(`\nre-buy curve at the cap (paid ${formatCents(PRICE)}):`)
  console.log('  week |            before |             after |    derived that week')
  for (const weeks of [1, 5, 13, 26, 52]) {
    const at = { ...w, week: w.week + weeks } as WorldState
    const derived = Math.max(
      row.paidCents * ECONOMY.shop.businessValueFloorShare,
      brandGrossWorthCents(brandSignalsOf(w, w.week + weeks), item.earningsMultipleX!),
    )
    const after = assetWorthCents(at, row, item)
    const before = rampedWorthCents(row.paidCents, derived, weeks, halfLifeUnderOldFloor(brandSignalsOf(w, w.week + weeks).fame))
    console.log(
      `  ${String(weeks).padStart(4)} | ${formatCents(before).padStart(17)} | ${formatCents(after).padStart(17)} | ${formatCents(Math.round(derived)).padStart(20)}`,
    )
  }

  // --- A: the full cycle – sell a converged brand, found again the same week --------------------
  // Held to convergence the fixture way: the row aged eight (new) half-lives back, then revalued by
  // the engine's own writer, so the sale pays what the engine itself stores.
  row.boughtWeek -= 8 * R.minHalfLifeWeeks
  revalueAssets(w)
  const proceeds = owned(w)!.valueCents
  sellAsset(w, MERCH)
  const repeatPrice = assetEntryPriceCents(w, item)
  const cashBefore = w.fundsCents
  buyAsset(w, MERCH)
  const charged = cashBefore - w.fundsCents
  console.log(`\nfull cycle at the cap (sell a converged brand, re-found the same week):`)
  console.log(`  sold for            ${formatCents(proceeds)}`)
  console.log(`  re-buy price BEFORE ${formatCents(PRICE)}  ->  yield ${formatCents(proceeds - PRICE)}`)
  console.log(`  re-buy price AFTER  ${formatCents(charged)}  ->  yield ${formatCents(proceeds - charged)}`)
  if (charged !== repeatPrice) throw new Error('the door and the pricing function disagree – investigate before trusting any number above')
}

main()
