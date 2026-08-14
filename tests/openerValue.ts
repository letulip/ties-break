// WHAT A FIRST-ROUND LOSS PAYS, IN ONE PLACE – the family split, stated once.
//
// ⚠⚠ WHY THIS FILE EXISTS, AND IT IS A SCAR. The split was written out as the same ternary in FIVE
// test files (next-goal, prize-money, rival-fatigue, rivals, wave-b-points). Four of them already
// carried a comment saying «see tests/wave-b-points.test.ts for the whole ruling» – they knew where
// the ruling lived and re-implemented it anyway. So when the owner ruled on 14.08 that the two
// biggest rungs pay the rulebook's real opener, a one-constant change to the engine turned into
// five identical test edits, and the CI failure that found the other four was the only thing that
// stopped one being missed.
//
// The values are stated HERE, independently of `TIERS`, on purpose: a test that asks the engine
// what the answer is can only ever agree with it, and this split is exactly the thing worth
// disagreeing about. `tests/wave-b-points.test.ts` W-B2 is where the two are held against each
// other; everybody else imports the statement rather than re-typing it.
import type { TierId } from '../src/engine/season/types'

/** The chart's nominal 1 at the door – research §4: "a nominal 1 point higher up", from W50 up,
 *  and W3-ACT2 added WTA 250/500 to the family.
 *
 *  ⚠ W100'S LAST ELEMENT STAYS 0 AND THAT IS CANON: the real chart pays it 1, but act2-pro-tour.md
 *  §2 rules the three shipped rows (w15/w35/w100) canon as-is – only the NEW rungs took the in-wave
 *  verification. So this set is exactly the W2-LADDER trio plus the two W3-ACT2 added. */
export const NOMINAL_ONE_TIERS: readonly TierId[] = ['w50', 'w75', 'wta125', 'wta250', 'wta500']

/** ⚠ THE THIRD BUCKET, AND ITS VALUE IS THE OWNER'S 14.08 RULING: «Платить настоящую цифру за первый
 *  круг: 10 и 10 – вполне можно, не вижу причины делать иначе.»
 *
 *  It was `{ wta1000: 65, slam: 130 }` until then, and those are the real 96- and 128-draw's **R32**
 *  values – what the tour pays a player who has already won two matches. Our draw is 32, so they
 *  were landing on somebody who had won nothing: eleven reserved openers came to 975 points a
 *  season, more than eighteen W50 titles (docs/specs/where-the-points-come-from-2026-08.md).
 *
 *  ⚠ THE BUCKET IS KEPT RATHER THAN FOLDED INTO THE NOMINAL-ONE FAMILY. Ten is still not one, it is
 *  still the only place in the game where an opener pays above the chart's nominal, and 130/70 come
 *  BACK the day the Slam draw is 128 (task #112) – they are not deleted, they are unearned at draw
 *  32. A third bucket currently holding one value is the honest shape. */
export const REAL_OPENER_TIERS: Readonly<Partial<Record<TierId, number>>> = { wta1000: 10, slam: 10 }

/** What losing your first match at `tier` pays. The one statement all five files now share. */
export function firstRoundValue(tier: TierId): number {
  return REAL_OPENER_TIERS[tier] ?? (NOMINAL_ONE_TIERS.includes(tier) ? 1 : 0)
}
