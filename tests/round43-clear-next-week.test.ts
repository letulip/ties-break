// ROUND 43 – §8d.5's FIFTH FACT, WRITTEN SO R17 CAN SHIP.
//
// The corpus row `the-week-with-nothing-in-it` (R17) declared a gate `clear-next-week` that no
// `SmallTalkFact` carried, and `SMALL_TALK_FACT` is a TOTAL record over the union - so the row could
// not ship until somebody wrote the read. The owner, 17.09: «пиши гейт по R17, давай сделаем, раз
// это возможно и дешево».
//
// ⚠⚠ THE PROPOSED GATE WAS ONE CLAUSE AND IT WOULD HAVE BEEN TRUE ALL WINTER. «The season holds no
// event she is entered in next week» is satisfied by every week of the off-season and every week
// inside the college freeze, where the calendar is empty by construction - and «I've got a
// completely empty week and I don't know what to do with myself» is a worry in July and a
// description of February. The kernel says «rest or an ABSENCE», and an absence needs something to
// be absent from, so the week must also HOLD an event she could have been at.
//
// ⭐ THE THIRD TEST IS THE ONE THAT MATTERS: delete the `ahead.length > 0` clause from
// `nextWeekIsClear` and only that test goes red. Both halves are pinned, and neither passes on the
// other's version.
//
// ⚠ The read is asked BEFORE the situation is drawn (`reachableSituations`), is pure, and takes no
// draw on any stream - the four siblings' own contract. Nothing here touches MAIN.
import { describe, expect, it } from 'vitest'

import { createWorld, nextWeekIsClear, SMALL_TALK_FACTS, type WorldState } from '../src/engine/world'

/** A career parked at a week, with the calendar and the entry list under the test's control. */
function careerAt(seed: string, week: number): WorldState {
  const world = createWorld(seed)
  world.week = week
  return world
}

/** Put exactly one event on a week, and say whether she is in it. */
function weekHolds(world: WorldState, week: number, entered: boolean): void {
  const id = `ev-${week}`
  world.season = [{ ...world.season[0], id, week }]
  world.entries = entered ? [id] : []
}

describe('round 43 – `clear-next-week`, the fifth competitive claim', () => {
  it('⭐ is in the roster, and the predicate record is total over it', () => {
    expect(SMALL_TALK_FACTS, 'the union must carry the claim R17 names').toContain('clear-next-week')
  })

  it('⭐⭐ TRUE when next week holds an event she is not in - the gap R17 is about', () => {
    const world = careerAt('clear-gap', 200)
    weekHolds(world, 201, false)
    expect(nextWeekIsClear(world), 'a tournament she is not entered in is exactly the empty week').toBe(true)
  })

  it('⭐⭐ FALSE when she is entered in next week - she is playing, there is no gap', () => {
    const world = careerAt('clear-entered', 200)
    weekHolds(world, 201, true)
    expect(nextWeekIsClear(world), 'she has a match, so the week is not empty').toBe(false)
  })

  it('⭐⭐⭐ FALSE when the calendar holds nothing at all - February is not a worry', () => {
    const world = careerAt('clear-winter', 200)
    world.season = []
    world.entries = []
    expect(
      nextWeekIsClear(world),
      'an empty calendar is not a gap in her season - this is the clause the one-clause gate was missing',
    ).toBe(false)
  })

  it('⚠ THIS week is not next week - the read is one week forward, like its sibling', () => {
    const world = careerAt('clear-offset', 200)
    weekHolds(world, 200, false)
    expect(nextWeekIsClear(world), 'an event on THIS week says nothing about the one ahead').toBe(false)
  })
})
