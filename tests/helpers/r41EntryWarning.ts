// ROUND 41 #20's FIXTURE – one tired career, two suites.
//
// The unit suite (tests/round41-vacation-entry-warning.test.ts) asks the ENGINE what the card says;
// the component suite (tests/component/round41-vacation-entry.test.ts) mounts the real SeasonScreen
// over the same worlds and reads the confirm button. Two questions about one fixture, so the fixture
// is written once – which is the discipline the item itself is about.
//
// ⚠ NOTHING VUE IN HERE. It is imported by the `unit` project as well as `component`, so it may only
// touch the engine and the protocol (see tests/helpers/mountSeason.ts for the other rule).
import { createWorld, KID_ID, type WorldState } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type UpcomingEvent } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

export const TODAY = 10
export const EVENT_WEEK = 16
export const HOLIDAY_WEEK = 12
/** Tired, cleared to play, and under the rung – the zone the caution is written for. Round 34 #9's
 *  own fixture numbers, so the two files measure the same body. */
export const TIRED = 25
export const FLOOR = ECONOMY.availability.minConditionToEnter.national

/** The three packages the arms turn on, named for what they do to THIS fixture rather than by their
 *  catalogue labels: 25 + 26 clears his margin, 25 + 18 clears only the rung, 25 + 10 clears neither. */
export const CLEARS_HIM = 'camping' // +26 -> 51
export const CLEARS_THE_RULE = 'grandma' // +18 -> 43
export const CLEARS_NOTHING = 'staycation' // +10 -> 35

export const EMPTY = 'Your coach would not take her. She is empty.'
export const SKIP_IT = 'Your coach would skip this one and get her legs back.'
export const A_WEEK_SHORT = 'Your coach thinks she is a week short of her best for this.'
export const EVENT_ID = 'r41-20-national'

/** A tired career with a hired coach (DEFAULT_PROFILE is 'middle'), enough national points that the
 *  rung's band is not what the gate is answering about, and one National six weeks out. */
export function tiredWithACoach(seed: string, packageId?: string): { world: WorldState; event: SeasonEvent } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  world.week = TODAY
  world.condition = TIRED
  // ⚠ THE POINTS ARE NOT DECORATION. Without them every card below is 'locked' and the coach never
  // speaks at all – he only ever gives a view on trips she could actually take.
  world.results.push({ playerId: KID_ID, week: TODAY - 1, points: 200, tier: 'national' })
  const event: SeasonEvent = {
    id: EVENT_ID,
    week: EVENT_WEEK,
    tier: 'national',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: EVENT_WEEK - 2,
  }
  world.season.push(event)
  world.season.sort((a, b) => a.week - b.week)
  if (packageId) world.vacations.push({ week: HOLIDAY_WEEK, packageId, paidCents: 0 })
  return { world, event }
}

/** ⚠ SeasonScreen's `askEnter` RULE, restated rather than re-decided: «Push through» on a fatigued
 *  card, «Enter anyway» when only the coach objects, a plain «Enter» otherwise
 *  (src/components/screens/SeasonScreen.vue, `confirmLabel:`). The component suite mounts the real
 *  screen and reads the real button, which is what makes this a convenience and not the evidence. */
export function confirmLabelOf(card: UpcomingEvent): string {
  return card.cautionReason === 'fatigued' ? 'Push through' : card.coachCaution ? 'Enter anyway' : 'Enter'
}
