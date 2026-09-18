// ⭐⭐⭐ THE RECKONING – the one fold that answers «what did this career earn, and what did it cost».
//
// ⚠⚠ WHY IT IS ITS OWN FILE, which is the first thing to know about it. This lived in
// `world/ledger.ts` until 18.09, beside the accumulators it reads, and ruling 5 made it need the
// career-long upkeep fold in `world/assets.ts`. A value import of that file from `ledger.ts` closes
// a TWELVE-MODULE runtime cycle – ledger -> assets -> brand -> season/preview -> season/tournament
// -> season/cohort -> season/rival -> kidLife -> world/age -> ledger – and it is not a theoretical
// one: `tests/import-cycles.test.ts` caught it and four season suites died at import with
// `NATION_POOL is not iterable`. So the fold moved UP, to a module nothing in that component
// imports, and is NOT re-exported from `ledger.ts`, because a re-export would restore the edge.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time). Nothing here
// writes the world and nothing here draws on any RNG stream: it is arithmetic over three fields the
// save already carries, so the frozen MAIN capture cannot notice this file.
import { careerAssetUpkeepCents } from './assets'
import type { CareerMoney } from '../../shared/protocol'
import type { WorldState } from '../world'

/** ⭐⭐⭐ ROUND 46 #9 – WHAT A CAREER EARNED AND WHAT IT ACTUALLY COST, told apart.
 *
 *  THE OWNER, 18.09, off his finished career: «наша математика затрат и заработков… сказала в
 *  альбоме, что заработано было 13млн (причем вообще не ясно откуда эта цифра), а потрачено 83млн…
 *  мы как-то некорректно читаем траты на теннис (о которых речь) и заработки. Эта математика
 *  критична.» He finished holding $10M+ liquid, a $20M+ fund, houses, an academy and a brand.
 *
 *  ⚠⚠ BOTH HALVES OF HIS READING WERE WRONG AND BOTH WERE MEASURED BEFORE THIS WAS WRITTEN
 *  (`tools/album-money-probe.ts`, one walked career that buys the way he does – no bench in `tools/`
 *  had ever contained an asset purchase, which is why nothing caught this):
 *
 *    * «SPENT» was `careerTotals.spentCents`, every cent that ever left the wallet – and on the
 *      probe career **59.7% of it was the `'shop'` category**: $15,490,000 of a $25,935,355 total,
 *      being a house, the brand and the fund deposits. That money did not get SPENT, it got MOVED,
 *      and it was sitting in the same save under `assets` worth $39,327,362.
 *      ⚠ CORRECTED 18.09: this sentence used to say «and the academy», which the probe's own
 *      readout does not support – arm 0 walks to exactly three rows, and the academy is never
 *      reached because its own fund deposits keep the wallet under the $4,000,000 that rung needs.
 *      The spec's §1b code block was right; only the prose here had drifted. A career that really
 *      does build the academy is what `--arm 1` exists to walk (§6.1).
 *    * «WON» was `careerTotals.prizeCents`, which is documented as prize money THE FAMILY KEPT – so
 *      it excludes her own half of every cheque (`kidFundsCents`, $28,749,334 on the same career:
 *      MORE than the family's $17,164,973), and it excludes the parent's wages, the sponsors, the
 *      grants and the businesses the family built ($10,862,617 between them). Hence «не ясно откуда
 *      эта цифра»: it is one slice of one stream, printed where a reckoning was expected.
 *
 *  ⚠⚠ NOTHING NEW IS PERSISTED AND `SAVE_SCHEMA_VERSION` DOES NOT MOVE. Every term below is already
 *  on the save: `careerTotals` (v39), `assets[].paidCents` (v63) and `kidFundsCents` (v54). The
 *  accumulators in `accrueFinance` are UNTOUCHED – their meaning is what every migrated career's
 *  figures already are, and a reader is allowed to be smarter than a counter without rewriting the
 *  counter's history.
 *
 *  ⚠ `paidCents` RATHER THAN `valueCents` IS THE LOAD-BEARING CHOICE. What is being taken back out
 *  of «spent» is the CASH that went in, not what the thing turned out to be worth; the worth is a
 *  separate fact and gets its own field. That is also what keeps a SOLD asset honest with no extra
 *  bookkeeping: the purchase stays inside `spentCents` and the proceeds stay inside `earnedCents`,
 *  the row is gone from `assets`, and the pair therefore nets to the realised gain or loss – which
 *  is exactly right, because a car sold for less than it cost really was consumed. A PART sale is
 *  the same statement one step smaller: `sellAsset` already subtracts the sold part's cost from
 *  `paidCents`, so only the part still held is excused.
 *
 *  ⚠ THE IDENTITY, PINNED IN `tests/round46-career-money.test.ts` RATHER THAN CLAIMED:
 *      cameInCents − outlayCents === (fundsCents − starting funds) + heldCents + herAccountCents
 *  – everything that came in, minus everything that went for good, is what the household ended up
 *  with: the wallet's growth, the cash sunk in what it owns, and her account.
 *
 *  ⚠ CLAMPED AT ZERO, AND THE CLAMP IS FOR MIGRATED SAVES RATHER THAN FOR TIDINESS. `careerTotals`
 *  was reconstructed by the v38 -> v39 step off a ledger already pruned to sixty weeks and is
 *  documented there as «EXACT FOR A YOUNG CAREER AND A DOCUMENTED UNDERCOUNT FOR AN OLD ONE», so an
 *  old career can hold assets that cost more than its `spentCents` remembers. A negative outlay is
 *  not a number to print; zero is the honest floor and the holdings still say what was bought.
 *
 *  =================================================================================================
 *  ⭐⭐⭐ AMENDED 18.09 – RULING 5: THE UPKEEP GOES OUT WITH THE THING IT KEEPS
 *  =================================================================================================
 *
 *  THE OWNER, on the version above, which took the PURCHASE out of «spent» and left the weekly bill
 *  in – §2b of the spec called that «one imperfection, taken knowingly» and he read the note:
 *
 *  > «вообще не про теннис, мимо (машины, дома, яхты, самолеты). Мне кажется это уже не теннис,
 *  > честно говоря. За уши можно притянуть, но лучше нет.»
 *
 *  ⚠⚠ SO THIS IS A THIRD TERM AND NOT A WIDER `heldCents`, BECAUSE THE UPKEEP IS NOT HELD. A yacht's
 *  crew is paid and gone; what the ruling says about it is not «the family still has it» but «it is
 *  not the tennis». Two different exclusions with two different reasons, and folding them into one
 *  figure would make the identity below false – which is exactly how a reckoning stops being able to
 *  prove itself. `careerAssetUpkeepCents` (world/assets.ts) carries the replay and its residual.
 *
 *  ⚠ AND THE BRAND AND THE ACADEMY ARE DELIBERATELY NOT IN EITHER EXCLUSION – ruling 6 of the same
 *  day: «А вот бренд и академия вполне могут быть и расходами и доходами, здесь не вижу
 *  противоречий.» Their COST is `heldCents`' one concession and their INCOME is already inside
 *  `earnedCents` (and therefore `cameInCents`), which is the «both sides» he asked for on the
 *  reckoning. What is NOT yet applied is their cost in the break-even GATE – see `captureBreakEven`
 *  and docs/specs/the-reckoning-2026-09.md §6, where the measurement and the reason are recorded.
 *
 *  ⚠ THE IDENTITY GAINS ITS THIRD TERM AND IS STILL PROVED RATHER THAN CLAIMED:
 *      cameInCents − outlayCents === (fundsCents − starting funds) + heldCents + herAccountCents
 *                                   + upkeepCents
 *  – everything that came in, minus everything the reckoning calls spending, is the wallet's growth,
 *  the cash sunk in what it owns, her account, and the money the toys ate on the way.
 *
 *  A pure read: no draw, no clock, no world mutation – the whole file's guarantee. */
export function careerMoney(world: WorldState): CareerMoney {
  const totals = world.careerTotals ?? { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
  let heldCents = 0
  let holdingsCents = 0
  for (const owned of world.assets ?? []) {
    heldCents += owned.paidCents
    holdingsCents += owned.valueCents
  }
  const upkeepCents = careerAssetUpkeepCents(world)
  const herAccountCents = world.kidFundsCents ?? 0
  return {
    earnedCents: totals.earnedCents,
    prizeCents: totals.prizeCents,
    herAccountCents,
    cameInCents: totals.earnedCents + herAccountCents,
    spentCents: totals.spentCents,
    heldCents,
    upkeepCents,
    outlayCents: Math.max(0, totals.spentCents - heldCents - upkeepCents),
    holdingsCents,
  }
}
