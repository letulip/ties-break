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
import { ECONOMY, kidPrizeShareCents } from '../economy'
// ⭐ ROUND 35 #9 – HER AGE, off her own birth date, because the ramp is read at her REAL age and
// never the ITF band's (the one-clock ruling of 09.08, which `finalizeTournament` follows to the
// line). `world/age.ts` is a leaf and imports nothing from this package.
import { kidAgeYears } from './age'
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
 *  sells nothing).
 *
 *  ⚠⚠ THIS IS THE GROSS AND SINCE ROUND 35 #9 THAT WORD IS LOAD-BEARING. It is what a WHOLE brand
 *  takes in, before her cut – the same figure `brandGrossWorthCents` multiplies – and it is NOT
 *  what the family banks. Every surface that describes the FAMILY's money asks
 *  `merchFamilyWeeklyIncomeCents` below. */
export function merchWeeklyIncomeCents(world: WorldState): number {
  return assetWeeklyIncomeCents(world, 'merch-brand')
}

// =================================================================================================
// ⭐⭐⭐ ROUND 35 #9 – HER CUT OF THE BRAND, ON THE PRIZE RAMP
// =================================================================================================
//
// THE OWNER: «доход от ее бренда давай тоже как проценты с призовых будем делить: т.е. в интерфейсе
// напишем про ее долю, в недельном доходе будет семье на руки сумма меньше»
//
// ⚠⚠ «КАК С ПРИЗОВЫХ» IS THE RULE AND NOT AN ANALOGY, so this reads `kidPrizeShareBps` – the very
// function `finalizeTournament` divides a cheque by – rather than a second ramp of its own. There is
// one age ladder in this game (10% at 18, +5 a birthday, half from 26) and a brand that copied it
// would be free to drift from it on the first retune.
//
// ⚠⚠⚠ AND THE SPLIT IS AT THE BANKING SITE, NEVER IN THE RATE. `assetEarningsRateCents` is the ONE
// place a career becomes a weekly cheque – and it is also what `brandGrossWorthCents` MULTIPLIES to
// price the brand. A `× (1 − ramp)` inside it would have looked exactly like this change on the
// weekly line while quietly HALVING what the brand is worth on the shelf card beside it. So the rate
// is untouched, the worth is untouched, and what changes is who the money is paid to.
// ⭐ Measured before and after rather than argued: `tools/r35-brand-share.ts` prints the weekly
// gross, the worth and the multiple over the bench careers, and the three columns are identical
// across the change – the reading is in docs/rounds/round-35.md item 9.
//
// ⚠ ONE ROUNDING, AND THE FAMILY GETS THE REMAINDER – `kidPrizeShareCents`' own discipline, and the
// same shape `bankSponsorCheque` uses with the sides swapped. A pair of independent `Math.round`s
// loses or invents a cent on half the weeks, and this money lands in two balances a player can add
// up on screen.
//
// ⚠ NO NEW WAY FOR THE PARENT TO GO NEGATIVE, the standing «мы ни за что не наказываем» check: this
// is an INCOME line, `herShare <= gross` for every rate the ramp can produce (`capBps` is 5000), so
// the week can only ever add LESS. It can never subtract.
//
// ⚠ ZERO DRAWS, and nothing here is persisted. Integer arithmetic on a figure the fame fold has
// already decided, so the frozen MAIN capture (41550 / e6b0c709) cannot see it – and a career before
// her eighteenth is byte-identical, because the ramp answers zero there and `gross − 0` is `gross`.

/** ⭐⭐ ROUND 35 #9 – HER CUT OF ONE OWNED RUNG'S WEEK, in whole cents, rounded ONCE.
 *
 *  ⚠ ZERO FOR EVERY RUNG THAT IS NOT HER BRAND, and the academy is the rung that makes the guard
 *  matter rather than a hypothetical: it earns on the same line, in the same tick, out of the same
 *  function – and it is the PARENT's business, built with the parent's money, which is the whole
 *  reason §3g put it in a different family from the merch. Only «доход от ЕЁ бренда» is split. */
export function assetKidShareCents(world: WorldState, id: string): number {
  const item = shopItem(id)
  if (!item || item.family !== 'business') return 0
  return kidPrizeShareCents(
    assetWeeklyIncomeCents(world, id),
    kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
  )
}

/** ⭐⭐ ROUND 35 #9 – WHAT THE FAMILY ACTUALLY BANKS out of one owned rung's week: the gross less her
 *  cut, BY SUBTRACTION so the two halves re-add to the cheque exactly.
 *
 *  ⚠⚠ THIS IS THE FIGURE EVERY «WEEKLY INCOME» SURFACE READS – «в недельном доходе будет семье на
 *  руки сумма меньше». The till (`resolveBusinessIncome`), the coach market's cap
 *  (`familyWeeklyIncomeCents`), the household strip and the shop card all ask this one function, so
 *  they cannot quote four different takings for one brand – this file's own «ONE DEFINITION, MANY
 *  READERS» rule, extended to the side of the split the family gets. */
export function assetWeeklyFamilyIncomeCents(world: WorldState, id: string): number {
  return assetWeeklyIncomeCents(world, id) - assetKidShareCents(world, id)
}

/** ⭐ THE BRAND'S WEEK AS THE FAMILY BANKS IT – `merchWeeklyIncomeCents` less her ramp. */
export function merchFamilyWeeklyIncomeCents(world: WorldState): number {
  return assetWeeklyFamilyIncomeCents(world, 'merch-brand')
}

/** ⭐ REPUTATION – 1.0 base plus the BEST band of every finished season, counted once per season,
 *  capped. The fold the round-29 ledger proposed off `seasonHistory[].byTrack.wta.endRank` (his
 *  own save reads 1.925 since round 34's two new rungs, 1.75 before them). A season with
 *  no recorded WTA end-rank – a pre-v46 row, a null rank – counts nothing: «not recorded» is not
 *  «top-100», the season mirror's own distinction.
 *
 *  ⭐⭐ ROUND 34 #17 (03.09) – AND THE CAP IS THE CAREER'S OWN, `capBase + capPerSeason x the
 *  PROFESSIONAL seasons played`. The owner: a long professional career should be worth something
 *  and a short one should not. ⚠ «PROFESSIONAL SEASONS» IS THE SAME COUNT THE LADDER ITSELF WALKS –
 *  the rows carrying a WTA end-rank, `BrandSignals.proSeasons`' own definition – so the cap and the
 *  ladder can never disagree about what a season is. ⚠ Measured: at 4 + 0.5 the cap no longer binds
 *  below THIRTY professional seasons; see the constants' own header. */
export function academyReputationOf(world: WorldState): number {
  const A = ECONOMY.business.academy
  let rep = 1
  let proSeasons = 0
  for (const row of world.seasonHistory ?? []) {
    const endRank = row.byTrack?.wta?.endRank
    if (endRank == null) continue
    proSeasons++
    // bands are strongest-first; the FIRST that holds is the season's best and the only one counted
    const band = A.reputationBands.find((b) => endRank <= b.maxEndRank)
    if (band) rep += band.add
  }
  return Math.min(A.reputationCapBase + A.reputationCapPerSeason * proSeasons, rep)
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
