// THE COACH'S AGREED FEE – THE WRITE, AND THE TWO QUESTIONS A RAISE LETTER ASKS OF IT.
//
// ⭐⭐ ROUND 45 #3b (owner, 02.10): «тренер тоже вполне может просить повышения». The coach's yearly rise
// (round 42 #51) used to apply ITSELF on the anniversary, with a feed row. It is a two-door LETTER now, the
// masseur's own shape (`resolveCoachRaise` in `world/coachMarket.ts` writes it; `acceptOffer` answers it), so
// the write that a signature has to perform lives in a leaf BOTH can reach.
//
// ⚠⚠ WHY THIS IS NOT IN `coachMarket.ts`, WHERE IT WAS. `acceptOffer` is `world/sponsors.ts`'s, and
// `coachMarket.ts` already imports `sponsors.ts` (the coach's fare), so a value import the other way closes a
// cycle (`tests/import-cycles.test.ts`). The stored contract (`WorldState.coachDeal`) is the ONE place his
// fee lives – `coachRateCents` bills it, the card quotes it, the market's `current` row reads it – so the
// write is moved here WHOLE and `coachMarket.ts` imports it back: one spelling of «re-strike the deal»,
// reached by the anniversary handshake (`settleCoachDeal`) and by a signed raise alike.
//
// ⚠ A LEAF ON PURPOSE: it reaches the ladder, the development table and the calendar and NO seat module.
// PURE STATE WRITES, ZERO DRAWS on any stream; no save-schema move (`coachDeal` is v82's, unchanged).

import { SKILL_KEYS } from '../development'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { Offer, StaffLetterTerms } from '../../shared/protocol'
import { kidLadderRank } from './ladder'
import type { WorldState } from './state'

/** THE SUM OF HER ATTRIBUTES, and of her ceilings – the two marks the development component measures
 *  between. `SKILL_KEYS` and not `Object.values`, so a sixth attribute joins both sides at once or
 *  neither. */
export function skillSum(of: Record<(typeof SKILL_KEYS)[number], number>): number {
  return SKILL_KEYS.reduce((sum, k) => sum + of[k], 0)
}

/** The write itself – the contract and the marks, together, because a fee agreed against last year's
 *  marks would price the next ask on a year it was already paid for. Reached by the handshake
 *  (`settleCoachDeal`) and by a SIGNED raise (`settleCoachRaise`), which re-strikes the same deal at a
 *  new figure. */
export function restampCoachDeal(world: WorldState, coachId: string, labourCents: number, agreedWeek: number): void {
  world.coachDeal = {
    coachId,
    labourCents,
    agreedWeek,
    markWtaRank: kidLadderRank(world, 'wta'),
    markSkills: skillSum(world.skills),
    markPotential: skillSum(world.potential),
    residualSince: 0,
  }
}

/** DOES A COACH'S RAISE LETTER STILL STAND – the engine re-validates the paper against the world before it
 *  moves (CLAUDE.md invariant 1: the worker is not the gate).
 *
 *  ⭐ IT NEEDS NO FIELD ON THE LETTER NAMING WHICH COACH ASKED, and that is why the three-part schema move
 *  is not needed: the paper's ARRIVAL WEEK must be an anniversary of the contract that stands NOW. The
 *  anniversary is exact arithmetic on `agreedWeek` (`coachRaiseDue`'s own), so a coach who was released and
 *  replaced inside the four-week window – a new deal, dated from the new hire – fails it, and so does the
 *  same man re-hired (the deal is dated from the re-hire, a week after the paper). A letter that has
 *  already been signed re-dates the deal to its own week, so it stops standing the moment it is answered.
 *  Pure, zero draws. */
export function coachRaiseStands(world: WorldState, offer: Offer): boolean {
  const deal = world.coachDeal
  if (!world.coachId || !deal || deal.coachId !== world.coachId) return false
  const served = offer.week - deal.agreedWeek
  return served > 0 && served % WEEKS_PER_YEAR === 0
}

/** ⭐⭐ THE SIGNATURE MOVES THE ONE STORED FEE. `acceptOffer` calls this after the paper is marked signed:
 *  his labour rises by exactly what the paper printed (`toCents − fromCents` – the hourly figures differ
 *  by the labour alone, the court's share is the same on both) and the deal is re-struck DATED FROM THE
 *  PAPER'S OWN WEEK, so his next anniversary is a year after this one – the cadence the automatic rise had,
 *  whatever week within the window the parent answered on.
 *
 *  ⚠ A DECLINE OR A LAPSE NEVER REACHES HERE: nothing is written, the fee stays, and the marks stay with it
 *  – his score reads «the progress since this fee last stood», so a refused year is simply part of the
 *  next one. NOBODY LEAVES AND NOBODY IS PUNISHED (the 17.09 «no third branch» ruling, kept by the owner
 *  on 02.10 when this ask was made). Zero draws. */
export function settleCoachRaise(world: WorldState, offer: Offer): void {
  const ask = (offer.terms as StaffLetterTerms).ask
  const deal = world.coachDeal
  if (!ask || !deal || !coachRaiseStands(world, offer)) return
  restampCoachDeal(world, deal.coachId, deal.labourCents + (ask.toCents - ask.fromCents), offer.week)
}
