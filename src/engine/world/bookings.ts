// THE BOOKINGS, read side: what the family has put in the diary for a given week.
//
// ⚠ DEPENDENCY DIRECTION. Three accessors and one formatter, split out from the planner so the
// availability gate can ask 'is that week already spoken for?' without importing the planner's
// command surface – which would have been a cycle, since the planner asks the gate whether a week
// is bookable at all. `WorldState` is a TYPE-ONLY import.
import { vacationPackage } from '../economy'
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
