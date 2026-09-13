// =================================================================================================
// ROUND 41 #20 – THE HOLIDAY THE CARD COUNTED AND THE COACH DID NOT
// =================================================================================================
//
// The owner, 12.09: «при выбранном отпуске надпись о exhausted с карточки будущего турнира ушла, а
// при попытке оставить на него заявку всё ещё предлагает продавить.»
//
// TWO SURFACES, ONE QUESTION, TWO PROJECTIONS – this repo's most-caught defect class. Round 34 #9
// taught the ENTRY GATE to count a booked holiday's recovery (`bookedRestGainBetween`), so the card
// stopped saying «Exhausted» once the arithmetic cleared the rung. The hired COACH's read of the same
// trip stayed on `world.condition`, i.e. today's – so his sentence survived the holiday that had just
// silenced the card, and SeasonScreen's confirm (`askEnter`) flips to «Enter anyway» on the mere
// presence of `coachCaution`. A warning with nothing above it, on a card the engine had already
// cleared.
//
// THE FIX: one projection, three readers – `projectedConditionAt` (world/medical.ts). The gate keeps
// the number it always had; `coachWarnsEntry` (whether he speaks) and `coachEntryLine` (which of his
// three sentences) are handed the same one.
//
// ⚠ WHAT IS DELIBERATELY NOT "FIXED", and arm C is here so nobody later mistakes it for a leftover:
// his margin sits ENTRY_MARGIN (8) points ABOVE the rung's floor by design – «a good one warns BEFORE
// the fatigue rule does» is the thing the coach rung sells. So a holiday can honestly clear the RULE
// and leave him still unhappy; what it may no longer do is leave him saying «She is empty» about a
// girl who will arrive at 43.
//
// ⚠ AND `coachLoad.ts` IS UNTOUCHED. The projection reaches him BY VALUE at the one call site, so the
// wave-3 T16b escalation machinery (`coachEscalates`/`strainOf`, which read `view.condition` for a
// decision about THIS week's knock) never sees a forecast. Arm E pins that.
import { describe, expect, it } from 'vitest'
import { availabilityStatus, coachLoadViewOf, toSnapshot, type WorldState } from '../src/engine/world'
import { bookedRestGainBetween, projectedConditionAt } from '../src/engine/world/medical'
import { ENTRY_MARGIN } from '../src/engine/coachLoad'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, type UpcomingEvent } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'
// ⚠ ONE FIXTURE, TWO SUITES – the component suite mounts the real SeasonScreen over these same
// worlds (tests/component/round41-vacation-entry.test.ts). See the helper's own header.
import {
  A_WEEK_SHORT,
  CLEARS_HIM,
  CLEARS_NOTHING,
  CLEARS_THE_RULE,
  EMPTY,
  EVENT_WEEK,
  FLOOR,
  SKIP_IT,
  TIRED,
  confirmLabelOf,
  tiredWithACoach,
} from './helpers/r41EntryWarning'

function cardFor(world: WorldState, event: SeasonEvent): UpcomingEvent {
  const card = toSnapshot(world).upcoming.find((u) => u.id === event.id)
  expect(card, 'the fixture event is inside the snapshot horizon').toBeDefined()
  return card!
}

describe('round 41 #20 — the fixture says what it claims to say', () => {
  it('she is tired, cleared, under the rung, and paying somebody who has a view', () => {
    expect(TIRED).toBeGreaterThanOrEqual(ECONOMY.availability.medicalFloor)
    expect(TIRED).toBeLessThan(FLOOR)
    const { world, event } = tiredWithACoach('r41-20-shape')
    expect(DEFAULT_PROFILE.coachTier, 'a hired rung, or there is nobody to warn').not.toBe('self')
    const card = cardFor(world, event)
    expect(card.eligible, 'the band is open, so the gate is answering about her BODY').toBe(true)
    // His threshold is above the floor by construction – stated here so arm C reads as design.
    const view = coachLoadViewOf(world)
    const threshold = FLOOR + ENTRY_MARGIN / Math.max(0.5, view.shownStamina / 50)
    expect(threshold).toBeGreaterThan(FLOOR)
    expect(view.condition, 'his knock view is TODAY, not a forecast').toBe(TIRED)
  })
})

describe('round 41 #20 — arm A: no holiday, nothing moves', () => {
  it('the card warns and so does he – byte-identical to before the fix', () => {
    const { world, event } = tiredWithACoach('r41-20-none')
    expect(bookedRestGainBetween(world, EVENT_WEEK), 'nothing booked').toBe(0)
    expect(projectedConditionAt(world, EVENT_WEEK), 'so the projection IS today').toBe(TIRED)

    const card = cardFor(world, event)
    expect(card.cautionReason).toBe('fatigued')
    expect(card.coachCaution).toBe(EMPTY)
    expect(confirmLabelOf(card), 'SeasonScreen askEnter: fatigued wins the verb').toBe('Push through')
  })
})

describe('round 41 #20 — arm B: the holiday he can see, which is the item', () => {
  // ⚠ THE MUTATION THAT MUST FAIL THIS: put `world.condition` back into the two coach reads in
  // `upcomingEvents` (world/snapshot.ts) and this arm reds – `coachCaution` comes back as «She is
  // empty» over a card with no caution on it, and the confirm reads «Enter anyway».
  it('card quiet, coach quiet, and the confirm is a plain Enter', () => {
    const { world, event } = tiredWithACoach('r41-20-clears', CLEARS_HIM)
    expect(bookedRestGainBetween(world, EVENT_WEEK)).toBe(26)
    expect(projectedConditionAt(world, EVENT_WEEK)).toBe(TIRED + 26)

    const card = cardFor(world, event)
    expect(availabilityStatus(world, event).level, 'the gate is clear').toBe('ok')
    expect(card.cautionReason, 'no Exhausted on the card').toBeUndefined()
    expect(card.coachCaution, 'and nothing from the coach either').toBeUndefined()
    expect(confirmLabelOf(card)).toBe('Enter')
  })
})

describe('round 41 #20 — arm C: the holiday that clears the RULE but not his MARGIN', () => {
  it('he still speaks, and his sentence is the mild one rather than «She is empty»', () => {
    // This is the model working, not a leftover. The rung asks for 40 and she will arrive at 43, so
    // the engine's caution goes; his own bar is 40 + 8/trust and 43 is under it, so he says the
    // third of his three sentences. Before the fix he read 25 and said the FIRST one – a coach
    // calling a girl empty about a week she will start eighteen points fresher than he thinks.
    const { world, event } = tiredWithACoach('r41-20-margin', CLEARS_THE_RULE)
    expect(projectedConditionAt(world, EVENT_WEEK)).toBe(TIRED + 18)
    expect(TIRED + 18, 'over the rung').toBeGreaterThanOrEqual(FLOOR)

    const card = cardFor(world, event)
    expect(card.cautionReason).toBeUndefined()
    expect(card.coachCaution, 'the mildest of the three').toBe(A_WEEK_SHORT)
    expect(card.coachCaution).not.toBe(EMPTY)
    expect(confirmLabelOf(card)).toBe('Enter anyway')
  })
})

describe('round 41 #20 — arm D: a holiday too small, and the two halves now agree', () => {
  it('the card still warns, and he warns about the same body it is warning about', () => {
    // 25 + 10 = 35 and the rung asks 40: the word stays (round 34 #9's own arm B). What changed is
    // WHICH sentence he says – «would skip this one» at 35 rather than «she is empty» at 25. The two
    // surfaces are now describing one girl in one week.
    const { world, event } = tiredWithACoach('r41-20-small', CLEARS_NOTHING)
    expect(projectedConditionAt(world, EVENT_WEEK)).toBe(TIRED + 10)

    const card = cardFor(world, event)
    expect(card.cautionReason).toBe('fatigued')
    expect(card.coachCaution).toBe(SKIP_IT)
    expect(confirmLabelOf(card)).toBe('Push through')
  })
})

describe('round 41 #20 — arm E: what the fix may not touch', () => {
  it('the knock view keeps TODAY – no forecast reaches the T16b escalation machinery', () => {
    // `coachEscalates`/`strainOf` decide whether he brings THIS week's knock to the parent. That is a
    // question about a body that exists, and a holiday three weeks out has no business in it. The
    // projection is applied at the one snapshot call site and nowhere else, so the view that reaches
    // the knock is untouched at every rung.
    const { world } = tiredWithACoach('r41-20-knock', CLEARS_HIM)
    expect(coachLoadViewOf(world).condition).toBe(TIRED)
    expect(coachLoadViewOf(world).condition).not.toBe(projectedConditionAt(world, EVENT_WEEK))
  })

  it('the doctor is still not given the forecast (round 34 #9 kept, one function later)', () => {
    const { world, event } = tiredWithACoach('r41-20-doctor', CLEARS_HIM)
    world.condition = ECONOMY.availability.medicalFloor - 1
    const status = availabilityStatus(world, event)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('medical')
  })

  it('`projectedConditionAt` is the gate\'s own arithmetic, clamped and draw-free', () => {
    const { world } = tiredWithACoach('r41-20-pure', CLEARS_HIM)
    const c = ECONOMY.condition
    expect(projectedConditionAt(world, EVENT_WEEK)).toBe(
      Math.min(c.max, Math.max(c.min, world.condition + bookedRestGainBetween(world, EVENT_WEEK))),
    )
    // ...and it cannot promise more than a body can hold.
    world.condition = c.max
    expect(projectedConditionAt(world, EVENT_WEEK)).toBe(c.max)
  })
})
