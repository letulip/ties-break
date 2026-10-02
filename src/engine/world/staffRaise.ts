// ROUND 45 #3 – THE RAISE REQUEST, THE SEATS' COMMON HALF.
//
// THE OWNER: «Письма с прогрессом от специалистов приходят, а повышение они так и не просят, только
// массажист растёт сам по себе тихо ежегодно». B2 turned the masseur's silent yearly index into an OPEN
// staff letter (`raiseStaffAsk` in offers.ts, written from `resolveMasseurRaise`). This file is the SAME
// mechanism asked of the two seats that bill by the WEEK – the psychologist and the hitting partner – so
// a seat's service clock, its anniversary, its request and the drift of its fee are ONE spelling here
// rather than three.
//
// ⚠ A LEAF ON PURPOSE. It reaches `economy`, `offers`, `season/calendar` and `world/ledger`, and NO seat
// module: each seat module imports THIS, so a seat that bills through it can never close a cycle
// (`tests/import-cycles.test.ts`). The hire / release tag a seat's clock reads is therefore an ARGUMENT
// (`PSYCHOLOGIST_CHANGE_KEY`, `SPARRING_CHANGE_KEY`), handed over by the seat that owns it.
//
// ⭐⭐ THE ONE DIFFERENCE FROM THE MASSEUR'S FEE, AND WHY IT IS NOT A SECOND RULE. His rate is
// `opening × (1+step)^(yearsServed − asksWithheld)`: before round 45 it rose silently every year, so a
// save with no request papers had to keep every raise it was already paying – the exponent counts the
// years and subtracts the ones the family refused. These two seats NEVER rose: a save with no papers
// paid the opening price and has to go on paying it, so their exponent is the number of requests the
// family SIGNED. On a career that has had every anniversary's request the two are the same number
// (tests/round45-staff-ask-seats.test.ts pins that against the masseur); they part only on a save that
// predates the papers, which is exactly where counting the years would have raised a bill on the day
// this shipped, with no letter – the very thing the owner objected to.
//
// ⚠⚠ NOTHING IS PERSISTED AND NOTHING DRAWS. The fee is derived from the signed papers and the hire
// ledger, so there is no save-schema move, and the writer below reads state only – no stream, no
// `Math.random`, no wall clock.

import { ECONOMY } from '../economy'
import { raiseStaffAsk, staffAskId, staffAsks } from '../offers'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { Offer, StaffSeat } from '../../shared/protocol'
import { seasonIndexOf } from './ledger'
import type { WorldState } from './state'

/** ⚠ A DEFAULTED PARAMETER, FLAGGED AS ONE. The step a granted raise adds is the MASSEUR'S own
 *  `ECONOMY.masseur.raisePerYear` (4%, ruled and benched in round 43), lent to the two weekly seats
 *  because the owner's ask named «the specialists» and gave no figure for them. It is read at call
 *  time, so a bench that moves the masseur's knob moves the others with it, and it is the ONE seam
 *  where a seat gets its own number the day the owner picks one. It is deliberately NOT a new
 *  `ECONOMY` key: that table is hash-pinned (`tests/principles-t73-economy-identity.test.ts`) and a
 *  knob nobody has ruled on should not be dressed as one. */
export function staffRaisePerYear(): number {
  return ECONOMY.masseur.raisePerYear
}

/** WHAT A RATE COSTS AFTER `grants` GRANTED RAISES – compounding, because that is what a rise IS (each
 *  year's ask is against what the seat is paid now), rounded to WHOLE DOLLARS from the UNROUNDED power
 *  and never year-on-year from the rounded one: the house prices these seats in whole dollars, and
 *  rounding once keeps the quote, the ledger row and the arithmetic a player can do in his head one
 *  number. The masseur's `masseurRateAfter` is the same line; the parity test pins them together.
 *  A floor of zero: a negative count has no meaning and the opening price is the identity element. */
export function staffRateAfter(baseCents: number, grants: number): number {
  const drifted = baseCents * (1 + staffRaisePerYear()) ** Math.max(0, grants)
  return Math.round(drifted / 100) * 100
}

/** EVERY WEEK A SEAT WAS ON THE PAYROLL, up to and including `week` – the sum of the hired spans the
 *  hire ledger records, never «weeks since the hire» (a clock that reset on a re-hire would let a
 *  family fire a seat for a week to buy the entry price back). `world/masseur.ts`
 *  `masseurWeeksServedAt` is the same read for one key; its note on why the rows alternate hire /
 *  release by construction applies word for word, and so does its courtesy to a hand-built probe world
 *  with the flag set and no tagged row: ZERO weeks, the identity element, rather than a crash.
 *  Pure read, zero draws. */
export function staffWeeksServedAt(world: WorldState, changeKey: string, week: number): number {
  const marks: number[] = []
  for (const e of world.events) {
    if (e.milestoneKey?.startsWith(changeKey) && e.week <= week) marks.push(e.week)
  }
  marks.sort((a, b) => a - b)
  let served = 0
  for (let i = 0; i < marks.length; i += 2) {
    // An odd tail is the span still running – it closes at the week being asked about.
    const until = i + 1 < marks.length ? marks[i + 1] : week
    served += Math.max(0, until - marks[i])
  }
  return served
}

/** HOW MANY ANNIVERSARIES A SEAT HAS REACHED – one per completed year on the payroll. */
export function staffYearsServed(world: WorldState, changeKey: string): number {
  return Math.floor(staffWeeksServedAt(world, changeKey, world.week) / WEEKS_PER_YEAR)
}

/** IS THIS THE WEEK THE SEAT ASKS – the week its service count crosses a whole year. ⚠ It asks LAST
 *  WEEK TOO, for `masseurRaiseDue`'s reason: the count does not move on the week a span opens, so
 *  «divisible by 52» alone would also be true on a RE-HIRE week that already sits on a multiple, and
 *  the honest question is whether the counter INCREMENTED into a year this week. Pure, zero draws. */
export function staffRaiseDue(world: WorldState, hired: boolean, changeKey: string): boolean {
  if (!hired) return false
  const served = staffWeeksServedAt(world, changeKey, world.week)
  if (served <= 0 || served % WEEKS_PER_YEAR !== 0) return false
  return staffWeeksServedAt(world, changeKey, world.week - 1) === served - 1
}

/** HOW MANY OF A SEAT'S REQUESTS THE FAMILY SIGNED – the exponent of the weekly seats' fee (see the head
 *  of this file for why it is not the masseur's `years − withheld`). An open, refused or lapsed request
 *  counts for nothing, so Decline and a lapse leave the fee where it was and the forgone year is not
 *  banked. `offers` may be absent on a hand-built probe world: no papers, no raise. */
export function staffRaisesGranted(offers: Offer[] | undefined, seat: StaffSeat): number {
  return staffAsks(offers ?? [], seat).filter((o) => o.state === 'signed').length
}

/** ⭐⭐⭐ THE ANNIVERSARY WRITES THE REQUEST. On the week a seat's service count crosses a whole year this
 *  writes ONE open staff letter (`raiseStaffAsk`: the sponsor letters' four-week window, answered through
 *  `acceptOffer` / `declineOffer`) quoting what the seat is paid now and one step above it, both at the
 *  rung the family is on. `baseCents` is that rung's OPENING price; the two figures are frozen on the
 *  paper (a rung switched inside the window moves the bill, not the paper).
 *
 *  ⚠ ONE REQUEST PER YEAR OF SERVICE, idempotent on `staffAskId`, so a re-hire week already sitting on a
 *  year cannot write a second. ⚠ An ask that would not move the rate is no ask – unreachable on the
 *  shipped prices and 4%, guarded so a retune cannot write a letter about nothing. ⚠ NO CASH MOVES here:
 *  the letter is paper, and the bill that follows is the seat's own `resolve*`, at whatever the derived
 *  fee then is. */
export function writeStaffRaise(
  world: WorldState,
  seat: StaffSeat,
  changeKey: string,
  hired: boolean,
  baseCents: number,
): void {
  if (!staffRaiseDue(world, hired, changeKey)) return
  const year = staffYearsServed(world, changeKey)
  if (world.offers.some((o) => o.id === staffAskId(seat, year))) return
  const granted = staffRaisesGranted(world.offers, seat)
  const fromCents = staffRateAfter(baseCents, granted)
  const toCents = staffRateAfter(baseCents, granted + 1)
  if (toCents <= fromCents) return
  raiseStaffAsk(world.offers, world.week, year, {
    seat,
    seasonIndex: seasonIndexOf(world.week),
    // The total weeks on the payroll at the anniversary – a whole number of years by construction.
    weeksServed: staffWeeksServedAt(world, changeKey, world.week),
    ask: { fromCents, toCents },
  })
}
