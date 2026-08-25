// WHAT THE FAMILY CAN AFFORD, AS ONE FACT – the licence a line of copy asks for before it may
// assume a wallet. docs/specs/birthday-and-gifts.md §9.
//
// ⚠⚠ WHY IT EXISTS. Round 26 #4, the owner reading his own save:
//
//   «Очень странное пожелание на день рождения "She was looking fares home at two in the morning"
//    для студентки с кошельком 500к+ с предложением подарить велосипед.»
//
// The line is a good one for a family that cannot afford the fare. His family wallet held $584,375
// and her own account $59,220. Nothing in the catalogue had ever asked how much money there was,
// so a sentence written about a shoestring was printed over a fortune – the same defect class as
// R2-18's «Her own keys», which asserted a residence the model had not got, one axis along.
//
// ⚠⚠ AND IT IS A PREDICATE, NOT A WORD LIST – the standing rule, and the reason the old adult guard
// passed for a year. Nothing here scans copy for "fare", "cheap" or "afford"; the next hardship noun
// would walk straight past that exactly as "the hall mirror" walked past the week-note blacklist. A
// row DECLARES the fact its words rest on (`BirthdayGift.means`) and this file answers whether that
// fact is true of this family. A new line asserting poverty cannot reach a rich family by being
// worded differently, because the licence is not about the wording.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time) and `ECONOMY`
// is a leaf that imports nothing from the engine above `rng` – so this module has no runtime edge
// back into `world.ts` and cannot be in a cycle. That constraint is exactly why
// `STARTING_FUNDS_CENTS` moved into `economy.ts` in this round: the numbers below have to be
// readable from down here.
import { ECONOMY } from '../economy'
import type { WorldState } from '../world'

/** The three bands, named for what the family can DO rather than for a balance. */
export type FamilyMeans = 'tight' | 'comfortable' | 'moneyed'

// =================================================================================================
// ⭐⭐ THE THRESHOLDS, AND WHERE THEY ARE READ FROM. NEITHER OF THEM IS A NEW NUMBER.
// =================================================================================================
//
// The question the round asked is "what wallet makes a fare a hardship?", and the answer had to come
// out of the economy rather than out of taste. It does: the game already states, in exactly three
// numbers, what a poor family, an ordinary family and a rich family HAVE. They are the opening war
// chests – `ECONOMY.startingFundsCents`, working $8,000 / middle $25,000 / wealthy $120,000 – and
// they are the only BALANCES the design ever named. Everything else in `ECONOMY` is a weekly flow or
// a per-bill factor, and neither of those is what a girl scanning ticket prices is looking at.
//
// So the bands are the two ends of that table and nothing is invented:
//
//   TIGHT      at or below the POOREST family's opening reserve. Not "poor by a chosen figure" –
//              poorer than the game's own poorest family is on the day it starts, which is the
//              career the whole difficulty setting is built around.
//   MONEYED    at or above the RICHEST family's opening reserve. The economy's own picture of a
//              household that does not count.
//   COMFORTABLE between them, where neither claim may be made.
//
// ⚠ AND THE SANITY CHECK IS IN FARES, because that is the unit the copy is about. The dearest
// journey the domestic ladder prices is `TIERS.national.travelCostCents` at $400-900 (the
// international rungs run $900-3,200). At the TIGHT ceiling a $900 fare is 11.3% of everything the
// family has, which is a fare you look at twice at two in the morning; at the MONEYED floor it is
// 0.75%, and at the owner's own $643,595 it is 0.14%. That is the measurement the threshold is
// judged by – it is NOT how the threshold was chosen, and the difference matters: a number tuned
// against a fare would need re-tuning every time a tier's travel band moved.
//
// ⚠ INCLUSIVE AT BOTH ENDS, DELIBERATELY. A working family on week 0 holds EXACTLY the working
// reserve and is the family every hardship line in the game was written for; an exclusive `<` would
// have refused it its own copy on the one week it is most obviously true.
const TIGHT_AT_OR_BELOW = ECONOMY.startingFundsCents.working
const MONEYED_AT_OR_ABOVE = ECONOMY.startingFundsCents.wealthy

/** The band for a balance in cents. Exported for the sweeps, which ask about a number rather than
 *  about a world. Total: a bankrupt family (negative cents) is `tight`, which is the honest answer
 *  and not an edge case – `world.fundsCents` goes below zero for eight weeks before the latch. */
export function meansOfCents(walletCents: number): FamilyMeans {
  if (walletCents <= TIGHT_AT_OR_BELOW) return 'tight'
  if (walletCents >= MONEYED_AT_OR_ABOVE) return 'moneyed'
  return 'comfortable'
}

/** ⭐ EVERYTHING THE HOUSEHOLD CAN REACH – the family's war chest plus her own account.
 *
 *  ⚠ THE TWO PURSES ARE SUMMED, AND THAT IS A DECISION ABOUT WHAT THE COPY CLAIMS. v54 split them
 *  on purpose («a brand buys her face, not the family's») and nothing here merges them back: the
 *  ledger, the Money screen and the prize split are untouched. But a sentence like "she looked up
 *  fares and booked none" is false if EITHER purse could have bought the ticket without anybody
 *  noticing, so the question this predicate answers – is money scarce in this household – is asked
 *  of the money the household has. The owner's own report quoted both numbers in one breath.
 *
 *  Defensive `?? 0` because `kidFundsCents` arrived in v54 and probe worlds hand-built in tests
 *  predate it – the same courtesy `accrueFinance` extends to `careerTotals`. */
export function householdWalletCents(world: WorldState): number {
  return world.fundsCents + (world.kidFundsCents ?? 0)
}

/** ⭐ THE ONE QUESTION, ASKED ONCE. Same shape as `familyHomeVoice` / `collegeVoice` in
 *  `diary/words.ts` – a named predicate a copy table can ask for by name, rather than three tables
 *  each re-deriving a wealth test and disagreeing the day the rule gains a band. */
export function familyMeans(world: WorldState): FamilyMeans {
  return meansOfCents(householdWalletCents(world))
}

/** The two thresholds, exported so a test and a bench can quote the engine instead of a copy of it.
 *  In cents, like everything else in the engine. */
export const MEANS_BANDS = {
  tightAtOrBelowCents: TIGHT_AT_OR_BELOW,
  moneyedAtOrAboveCents: MONEYED_AT_OR_ABOVE,
} as const
