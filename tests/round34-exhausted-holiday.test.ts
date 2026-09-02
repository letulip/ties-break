// =================================================================================================
// ROUND 34 #9 – "Exhausted" AND THE HOLIDAY THAT IS ALREADY IN THE DIARY
// =================================================================================================
//
// The owner, reading a tournament card in the season list: «Если отпуск назначен, то на карточке
// турнира в сезоне надо убрать Exhausted … Или считать из отпуска восстановится ли и тогда убирать
// Exhausted.»
//
// ⚠⚠ HE NAMED TWO FIXES AND THE SECOND ONE IS THE ONLY HONEST ONE, which is why this file has TWO
// ARMS and would be worthless with one. Hiding the word whenever a holiday exists passes an "it is
// gone" test and prints "she is fine" over exactly the careers that matter – a girl at 25 with one
// staycation between her and a National is still going to arrive under the floor. So the property
// is not "a holiday removes the word": it is "the word survives iff she is still under the floor
// when she gets there".
//
// WHAT THE ENGINE DOES: `availabilityStatus` (world/medical.ts) reads the layoff at the EVENT's
// week (R10-17) and read the CONDITION at today's. `bookedRestGainBetween` adds the package gains of
// the holidays booked strictly between the two weeks – and nothing else, deliberately: a booked
// holiday is a hard blackout, so it cannot turn into a match week and `resolveVacation` pays its
// gain unconditionally. Every other week in between is the unknowable kind and contributes nothing.
import { describe, expect, it } from 'vitest'
import { availabilityStatus, createWorld, type WorldState } from '../src/engine/world'
import { bookedRestGainBetween } from '../src/engine/world/medical'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

/** The rung this file measures at, and the two numbers that make the arms mean something.
 *  `national` asks for 40 to start a week; the doctor's veto sits far below at 15, so a condition of
 *  25 is tired-but-cleared – the exact zone the caution is written for. */
const FLOOR = ECONOMY.availability.minConditionToEnter.national
const TIRED = 25

/** The two packages the arms turn on, taken from the catalogue rather than typed in – 'grandma' is
 *  worth 18 and clears 25 + 18 = 43 over the floor of 40; 'staycation' is worth 10 and 35 does not. */
const RESTORES = 'grandma'
const DOES_NOT = 'staycation'

const EXHAUSTED = 'Exhausted – racing risks injury.'
const TODAY = 10
const EVENT_WEEK = 16

function tiredCareer(seed: string): { world: WorldState; event: SeasonEvent } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = TODAY
  world.condition = TIRED
  const event: SeasonEvent = {
    id: 'r34-9-national',
    week: EVENT_WEEK,
    tier: 'national',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: EVENT_WEEK - 2,
  }
  world.season.push(event)
  world.season.sort((a, b) => a.week - b.week)
  return { world, event }
}

function bookHoliday(world: WorldState, week: number, packageId: string): void {
  world.vacations.push({ week, packageId, paidCents: 0 })
}

describe('round 34 #9 – a scheduled holiday and the Exhausted caution', () => {
  it('the fixture really is exhausted and really is cleared to play, or nothing below means anything', () => {
    // ⚠ THE ARM THAT MAKES THE OTHER TWO READABLE. If she were under the doctor's floor the card
    // would say "Not cleared to play" and no holiday arithmetic would ever be reached; if she were
    // over the tier's floor there would be no word to remove.
    expect(TIRED, 'above the medical veto, so the fatigue branch is the one that answers').toBeGreaterThanOrEqual(
      ECONOMY.availability.medicalFloor,
    )
    expect(TIRED, 'and under the rung she is looking at').toBeLessThan(FLOOR)
    const { world, event } = tiredCareer('r34-9-baseline')
    const status = availabilityStatus(world, event)
    expect(status.level).toBe('caution')
    expect(status.reason).toBe('fatigued')
    expect(status.detail).toBe(EXHAUSTED)
  })

  it('⭐ ARM A – a holiday that DOES restore her: the word is gone', () => {
    const { world, event } = tiredCareer('r34-9-restores')
    bookHoliday(world, 12, RESTORES)
    // The claim is arithmetic before it is a verdict: what she will arrive with clears the rung.
    expect(bookedRestGainBetween(world, EVENT_WEEK), 'the package the family booked').toBe(18)
    expect(TIRED + 18, 'so she arrives over the floor').toBeGreaterThanOrEqual(FLOOR)

    const status = availabilityStatus(world, event)
    expect(status.level, 'the card is clear').toBe('ok')
    expect(status.reason).toBeUndefined()
    expect(status.detail ?? '', 'and it does not say Exhausted').not.toContain('Exhausted')
  })

  it('⭐ ARM B – a holiday that does NOT restore her: the word stays', () => {
    // ⚠⚠ THE ARM THE "just hide it when a holiday exists" FIX FAILS. There IS a holiday in the
    // diary and the card must still warn him, because 25 + 10 is 35 and the rung asks for 40.
    const { world, event } = tiredCareer('r34-9-not-enough')
    bookHoliday(world, 12, DOES_NOT)
    expect(bookedRestGainBetween(world, EVENT_WEEK), 'a free week at home is worth ten').toBe(10)
    expect(TIRED + 10, 'and that is still under the floor').toBeLessThan(FLOOR)

    const status = availabilityStatus(world, event)
    expect(status.level, 'the warning survives the holiday').toBe('caution')
    expect(status.reason).toBe('fatigued')
    expect(status.detail).toBe(EXHAUSTED)
  })

  it('⭐ ...and two small holidays that add up to enough DO clear it – it is the arithmetic, not the flag', () => {
    const { world, event } = tiredCareer('r34-9-two-small')
    bookHoliday(world, 12, DOES_NOT)
    bookHoliday(world, 13, DOES_NOT)
    expect(bookedRestGainBetween(world, EVENT_WEEK)).toBe(20)
    expect(availabilityStatus(world, event).level).toBe('ok')
  })

  it('⚠ a holiday BEHIND the event does nothing – the weeks counted are the weeks in between', () => {
    // Booked after the tournament, so it cannot help her get to it. The same guard the other way:
    // a holiday on THIS week has already been paid into `world.condition` by the tick.
    const { world, event } = tiredCareer('r34-9-after')
    bookHoliday(world, EVENT_WEEK + 1, RESTORES)
    expect(bookedRestGainBetween(world, EVENT_WEEK)).toBe(0)
    expect(availabilityStatus(world, event).detail).toBe(EXHAUSTED)

    const past = tiredCareer('r34-9-past')
    bookHoliday(past.world, TODAY, RESTORES)
    expect(bookedRestGainBetween(past.world, EVENT_WEEK)).toBe(0)
    expect(availabilityStatus(past.world, past.event).detail).toBe(EXHAUSTED)
  })

  it('⚠ a career that books nothing is byte-identical – the gain is zero and so is the change', () => {
    const { world, event } = tiredCareer('r34-9-nothing')
    expect(world.vacations, 'no holiday in the diary').toEqual([])
    expect(bookedRestGainBetween(world, event.week)).toBe(0)
    expect(availabilityStatus(world, event).detail).toBe(EXHAUSTED)
  })

  it('⚠ the doctor is NOT given the forecast – a holiday cannot clear a body that is not cleared today', () => {
    // The owner asked about the Exhausted caution. Under the medical floor the answer is a hard
    // refusal about her body TODAY, and a holiday that has not happened may not lift it.
    const { world, event } = tiredCareer('r34-9-medical')
    world.condition = ECONOMY.availability.medicalFloor - 1
    bookHoliday(world, 12, RESTORES)
    const status = availabilityStatus(world, event)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('medical')
  })
})
