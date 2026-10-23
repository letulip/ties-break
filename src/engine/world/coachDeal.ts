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
import { coachBandAskOf } from '../offers'
import { COACH_PEDIGREE, coachPedigree, type CoachPedigree, type PedigreeTrade } from '../coachPedigree'
import { ECONOMY } from '../economy'
import { coachById, coachLabourCents, coachRetainerBand, coachWeeklyCents, facilityRateCents, type Coach } from '../coach'
import { ageAtWeek } from './age'
import { kidLadderRank } from './ladder'
import type { WorldState } from './state'

// =================================================================================================
// ⭐⭐⭐ ROUND 53 №1 – THE BAND SHE HAS ENTERED, AND THE LETTER THAT PRICES IT
//     (docs/specs/coach-pay-ladder-2026-10.md §3.3, the owner's word of 21.10)
// =================================================================================================
//
// «50–11 тренер с письмом повышает цену и в таблице все тренеры тоже должны подорожать соответственно, 1–10
// еще дороже, но механизм остается», and «выход из диапазона цену не снижает». Round 42 #19 multiplied his
// labour by her LIVE rank, silently; this round the market reprices on the band she has ENTERED, and the man
// already on the payroll moves only through a letter the family signs or refuses.
//
// ⚠⚠ «ENTERED» IS DERIVED, NOT STORED – no schema move. Three facts the save already holds, each a high-water
// mark of a different kind, and the band is the best of them:
//   1. her live WTA rank (`kidLadderRank`, the cache the till already reads) – the crossing itself;
//   2. every BAND LETTER a coach ever wrote her (`coachBandAskId` rows in `world.offers`, never pruned –
//      `raiseStaffAsk`'s own note), whatever became of it: a letter is written only the week she stands in
//      the band, so the row IS the remembered crossing, signed or not;
//   3. every season-end WTA rank in `seasonHistory` (the year-end row `seasonRankRead` reads), and the #1
//      latch `firstNo1.wta`.
// ⚠ THE ONE GAP, stated rather than discovered: a career with NO coach on the payroll that touches #50 in
// mid-season and falls out of the band before the season closes leaves none of the three behind, so its
// market returns to the base. A coached career cannot have the gap (2. holds it), and that is the career
// whose bill this is about. Closing it would need a stored high-water rank – a schema move this round did
// not take.
//
// ZERO DRAWS on any stream: three folds over state the tick already wrote.

/** ⭐ THE BAND THE MARKET PRICES – the best of the three facts above. 1 for every junior career and every
 *  career that has never stood in the top fifty, which keeps the middle game byte-identical. */
export function coachEnteredBand(world: WorldState): number {
  let band = coachRetainerBand(kidLadderRank(world, 'wta'))
  if (world.firstNo1?.wta !== undefined) band = Math.max(band, coachRetainerBand(1))
  for (const season of world.seasonHistory ?? []) {
    const rank = season.byTrack?.wta?.endRank
    if (typeof rank === 'number') band = Math.max(band, coachRetainerBand(rank))
  }
  for (const offer of world.offers) {
    const letter = coachBandAskOf(offer)
    if (letter) band = Math.max(band, letter.band)
  }
  return band
}

/** WHAT THIS MAN'S LABOUR COSTS ON THE MARKET TODAY at the band she has entered – the quote's labour and the
 *  ceiling his own fee is clamped at. Moved here from `coachMarket.ts` (which re-exports it under its old
 *  name) so the sparring cap can read the coach's week without closing an import cycle. Zero draws. */
export function marketLabourCentsFor(world: WorldState, coach: Coach): number {
  const labour = coachLabourCents(coach.rateCents, ageAtWeek(world.week), coach.tier, coachEnteredBand(world))
  // ⭐ ROUND 53 №2 – A FAMOUS NAME'S LABOUR IS +50% ON TOP OF THE LADDER (spec §3.4). THE ONE PLACE, and on the
  // labour only: the court is the club's rent and is not his to inflate. Zero draws (a sub-stream re-derived).
  return coachPedigree(world.seed, coach.id, coach.tier) ? Math.round(labour * COACH_PEDIGREE.labourFactor) : labour
}

/** ⭐ ROUND 53 №2 – THE PEDIGREE OF THE MAN IN THE CHAIR, or null: nobody hired, a non-elite, or no past.
 *  «In the chair» is `world.coachId` read at the seam – nothing persisted, so a release ends every trade the
 *  same week. The tier comes off the roster slot of his portrait id (the id IS the slot), so this reads no roster
 *  build. Zero draws on any stream but his own sub-stream. */
export function pedigreeInChair(world: WorldState): CoachPedigree | null {
  const id = world.coachId
  if (!id) return null
  const slot = ECONOMY.coach.roster.find((r) => r.portrait === id)
  return slot ? coachPedigree(world.seed, id, slot.tier) : null
}

/** the chair's trade, if it is `trade` */
export function pedigreeTradeInChair(world: WorldState, trade: PedigreeTrade): boolean {
  return pedigreeInChair(world)?.trade === trade
}

/** THE HOURLY RATE THE TILL BILLS for the man she has: court at today's price plus the agreed labour,
 *  clamped at the market's own quote (see `coachRateCents` in `coachMarket.ts` for the whole argument). */
export function agreedRateCentsFor(world: WorldState, coach: Coach): number {
  const court = facilityRateCents(ageAtWeek(world.week), coach.tier)
  const market = marketLabourCentsFor(world, coach)
  const deal = world.coachDeal
  if (!deal || deal.coachId !== coach.id) return court + market
  return court + Math.min(deal.labourCents, market)
}

/** ⭐ THE HIRED COACH'S WEEK AT THE CURRENT PLAN – the quote's own figure (`coachWeeklyCents` at the corridor
 *  midpoint, the number his card prints), or null with nobody on the payroll. What the sparring cap is a
 *  share of (§3.2). Zero draws: the midpoint, never the week's roll. */
export function hiredCoachWeeklyCents(world: WorldState): number | null {
  const coach = coachById(world.seed, ageAtWeek(world.week), world.coachId)
  if (!coach) return null
  return coachWeeklyCents(agreedRateCentsFor(world, coach), world.plan, world.profile.background, coach.tier)
}

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
  // ⭐ ROUND 53 – A BAND LETTER STANDS WHILE ITS MAN IS STILL THE ONE ON THE PAYROLL: its id names him, so a
  // coach released inside the window leaves a paper that cannot raise his successor's fee.
  const band = coachBandAskOf(offer)
  if (band) return band.coachId === world.coachId
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
