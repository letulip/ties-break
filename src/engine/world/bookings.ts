// THE BOOKINGS, read side: what the family has put in the diary for a given week.
//
// ⚠ DEPENDENCY DIRECTION. Three accessors and one formatter, split out from the planner so the
// availability gate can ask 'is that week already spoken for?' without importing the planner's
// command surface – which would have been a cycle, since the planner asks the gate whether a week
// is bookable at all. `WorldState` is a TYPE-ONLY import.
import { vacationPackage } from '../economy'
import { weekLabel } from '../../shared/dates'
import type { SeasonEvent } from '../season/types'
import { addEvent } from './ledger'
import type { PracticeBooking, VacationBooking } from '../../shared/protocol'
import type { WorldState } from '../world'

/** The vacation booked for `week`, if any. */
export function vacationForWeek(world: WorldState, week: number): VacationBooking | undefined {
  return world.vacations.find((v) => v.week === week)
}

/** The practice match booked for `week`, if any. */
export function practiceForWeek(world: WorldState, week: number): PracticeBooking | undefined {
  return world.practices.find((p) => p.week === week)
}

/** The availability copy for a booked vacation week: "Family vacation – {package}" (spec §3). */
export function vacationBlackoutDetail(booking: VacationBooking): string {
  return `Family vacation – ${vacationPackage(booking.packageId)?.label ?? booking.packageId}`
}

/** The scheduled event with this id, if the calendar still carries it. */
export function eventById(world: WorldState, id: string): SeasonEvent | undefined {
  return world.season.find((e) => e.id === id)
}

/** Drop a practice booking and hand the rental back (shared by the player cancel, the injury hook
 *  and the doctor's arrival check, so the money story is identical whichever one fires). */
export function refundPractice(world: WorldState, booking: PracticeBooking, reason: 'Cancelled' | 'Injured' | 'Medical'): void {
  world.practices = world.practices.filter((p) => p !== booking)
  world.fundsCents += booking.paidCents
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'practice',
    text: `Court rental refunded – ${weekLabel(booking.week)}`,
    amountCents: booking.paidCents,
  })
  addEvent(world, {
    week: world.week,
    type: 'entry',
    text:
      reason === 'Injured'
        ? `Practice match called off – ${weekLabel(booking.week)} (she is hurt)`
        : reason === 'Medical'
          ? `Practice match called off – ${weekLabel(booking.week)} (not cleared to play)`
          : `Cancelled the practice match – ${weekLabel(booking.week)}`,
  })
}
