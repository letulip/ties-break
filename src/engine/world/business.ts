// ⭐⭐ THE PARENT'S BUSINESSES – round 29 part four P7, parts two and three of his order:
// «нам нужен мерч, растущий от частоты и обилия рекламных контрактов, съемок, выступлений, титулов
// и прочего» and «нам нужна академия, которая зарабатывает».
//
// TWO INSTRUMENTS, TWO AXES, AND THE SPLIT IS THE DESIGN (P7's own chain, and the fame spec's §4):
//
//   * MERCH follows FAME – the accounted fold over what he listed (contracts held reach it through
//     the shoots they book, plus titles, Slam finals, top-10 seasons – world/fame.ts). NOT rank:
//     the census's whole finding is that off-court money is not ordered by ranking.
//   * THE ACADEMY follows REPUTATION – seasons ended in band (`seasonHistory[].byTrack.wta
//     .endRank`), the P2 ruling «чем выше и дольше место – тем выше будет доход». Each of the four
//     stages earns once DELIVERED, scaling with the stage and with reputation.
//
// ⚠⚠ INCOME ONLY, NEVER NEGATIVE – «мы ни за что не наказываем». Both functions return a
// non-negative magnitude by construction: fame and reputation are bounded below, the stage table
// holds no negative cell, and there is no cost side here at all (the shelf's upkeep, where a rung
// has one, stays its own SEPARATE line – round 29 #10's lesson: never net two facts silently).
//
// ⚠⚠ ZERO DRAWS ON ANY STREAM. Everything below is arithmetic on the catalogue and on persisted
// records; there is no `Rng` argument, no clock and no `Math.random`, so the frozen MAIN capture
// (41550 / e6b0c709) cannot see any of it and a career that owns no business is byte-identical to
// one that never heard of them. `tests/round29p5-business.test.ts` proves it on a ticked world.
//
// ⚠ ONE DEFINITION, MANY READERS – this file is the only arithmetic for both lines. The till
// (`resolveBusinessIncome`) charges them, the household meter (`householdWeekly`) quotes them, the
// shop card (`shopView`) prints them: three surfaces, one function each, so they cannot disagree –
// the repo's most-repeated defect, refused the way `weeklyAssetUpkeepCents` refuses it.
import { ECONOMY } from '../economy'
// ⭐⭐ ROUND 30 #9 MOVED THE MERCH RATE ONE FILE DOWN, and «one arithmetic» is exactly why. The
// brand now carries a VALUE as well as an income (`assetWorthCents`), and that valuation lives in
// `world/assets.ts` – which this file imports, so the rate had to be reachable from there or there
// would be two copies of `fame x the dial`. `assetEarningsRateCents` is that one copy; everything
// this file adds to it is the ownership and delivery guards.
import { assetEarningsRateCents, deliveredAssets, shopItem } from './assets'
import type { WorldState } from '../world'

/** ⭐⭐ WHAT ONE OWNED RUNG BRINGS IN THIS WEEK, in whole cents – THE arithmetic, and the only
 *  one: the till's two lines and the shop card's per-row figure are all sums of this, so a stage
 *  row's quote and the ledger's academy line agree to the cent by construction (each rung rounded
 *  once, here, and the totals are sums of already-whole cents).
 *
 *  Zero for a rung not owned, a rung still on order (`assetDelivered` – a contract is not a
 *  business), and every rung that simply does not earn – which is the whole shelf outside the
 *  merch brand and the academy's stages. */
export function assetWeeklyIncomeCents(world: WorldState, id: string): number {
  if (!deliveredAssets(world).some((row) => row.owned.id === id)) return 0
  // ⭐ ROUND 30 #9 – THE RATE IS ASKED OF `world/assets.ts` RATHER THAN COMPUTED HERE, so the weekly
  // cheque and the brand's own worth are the same fame times the same dial. What this file still
  // owns is everything the valuation must NOT ask: is it theirs, and has it been delivered.
  const item = shopItem(id)
  if (item && item.family === 'business') return assetEarningsRateCents(world, item)
  const baseCents = ECONOMY.business.academy.stageIncomeCents[id] ?? 0
  if (baseCents <= 0) return 0
  return Math.round(baseCents * academyReputationOf(world))
}

/** ⭐ WHAT THE MERCH BRAND BRINGS IN THIS WEEK – fame times the dial, zero when the family never
 *  started one (and zero at fame zero, which is the mechanic: a brand with nobody's name on it
 *  sells nothing). */
export function merchWeeklyIncomeCents(world: WorldState): number {
  return assetWeeklyIncomeCents(world, 'merch-brand')
}

/** ⭐ REPUTATION – 1.0 base plus the BEST band of every finished season, counted once per season,
 *  capped. The fold the round-29 ledger proposed off `seasonHistory[].byTrack.wta.endRank` (his
 *  own save reads 1.75: two seasons inside #100, one inside #50, one inside #25). A season with
 *  no recorded WTA end-rank – a pre-v46 row, a null rank – counts nothing: «not recorded» is not
 *  «top-100», the season mirror's own distinction. */
export function academyReputationOf(world: WorldState): number {
  const A = ECONOMY.business.academy
  let rep = 1
  for (const row of world.seasonHistory ?? []) {
    const endRank = row.byTrack?.wta?.endRank
    if (endRank == null) continue
    // bands are strongest-first; the FIRST that holds is the season's best and the only one counted
    const band = A.reputationBands.find((b) => endRank <= b.maxEndRank)
    if (band) rep += band.add
  }
  return Math.min(A.reputationCap, rep)
}

/** ⭐⭐ WHAT THE ACADEMY BRINGS IN THIS WEEK, in whole cents – the DELIVERED stages' own figures,
 *  summed. The land alone is a field and earns nothing (its base is 0); a half-built academy
 *  earns its built half, which is «a half-built academy is a real state the player can sit in»
 *  (§3g) extended to the money. ONE number a week reaches the ledger – the row's sentence names
 *  the Nadal split (programmes, lodging, the academy's own sponsors) as flavour, never as four
 *  lines. */
export function academyWeeklyIncomeCents(world: WorldState): number {
  let total = 0
  for (const id of Object.keys(ECONOMY.business.academy.stageIncomeCents)) {
    total += assetWeeklyIncomeCents(world, id)
  }
  return total
}
