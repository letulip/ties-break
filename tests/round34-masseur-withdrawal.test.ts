// =================================================================================================
// ROUND 34 #21 – THE MASSEUR IS PAID TO SHORTEN THE LAYOFF, AND THE DESK CANCELLED HER ANYWAY
// =================================================================================================
//
// The owner: «С массажистом она выздоровела быстрее после травмы, а с турнира была снята тем не
// менее и теперь на турнир не зайти, надо учитывать наличие массажиста при автоматической отмене
// событий.»
//
// ⚠⚠ THE DEFECT IS AN ORDERING AND THIS FILE MEASURES IT AS ONE. `onsetInjury` (world/injury.ts)
// shortens `weeksOut` by the PHYSIO's factor, writes `world.injury`, and then sweeps the entries the
// layoff swallows. The MASSEUR's shortening is paid out one week at a time by `rollInjury`, which
// does not run until the following tick – so at the moment the sweep decided, one of the two people
// the family pays to shorten a layoff was inside the decision and the other was not.
//
// MEASURED at onset, the return week the sweep read against the return week she actually keeps:
//
//     rung             dealt   sweep read   she was back   entries pulled for a week she is fit
//     twice a week      4-12   w4 .. w12    w3 .. w9       1-3 weeks
//     every other day   3-12   w3 .. w12    w2 .. w8       1-4 weeks
//     daily             3-12   w3 .. w12    w2 .. w6       1-6 weeks
//
// THE FIXTURE BELOW IS ONE CELL OF THAT TABLE, walked end to end: a 8-week layoff at the daily rung,
// dealt in week 10. The sweep used to read "out until week 18" and she is in fact back in week 14 –
// so a National in week 15 was cancelled, its list closed two weeks out, and «на турнир не зайти».
import { describe, expect, it } from 'vitest'
import { createWorld, rollInjury, type WorldState } from '../src/engine/world'
import { onsetInjury } from '../src/engine/world/injury'
import { masseurRehabWeeksAhead } from '../src/engine/world/masseur'
import { ECONOMY } from '../src/engine/economy'
import { BODY_REGIONS } from '../src/engine/body'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

const ONSET_WEEK = 10
/** Inside the dealt layoff (10 + 8 = 18) and outside the one the masseur actually delivers (14). */
const EVENT_WEEK = 15
const ENTRY_ID = 'r34-21-national'

/** ⚠ THE DICE ARE SCRIPTED, NOT SEEDED, so the fixture is one cell of the table above rather than
 *  whatever a seed happens to hand out. `onsetInjury` spends exactly three pulls in this order –
 *  severity, weeks-out, body region – and its own header says so. 0.95 lands in the `major` band
 *  (cum 0.975, 8-14 weeks) and 0 takes the bottom of it: eight weeks. */
function scriptedDice(): () => number {
  const queue = [0.95, 0, 0]
  return () => queue.shift() ?? 0
}

function hurtCareer(seed: string, masseur: 'daily' | null): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = ONSET_WEEK
  world.physioActive = false
  if (masseur !== null) {
    world.masseurHired = true
    world.masseurSessionsPerWeek = 7 // the daily rung – one extra week off every rehab week
  }
  const event: SeasonEvent = {
    id: ENTRY_ID,
    week: EVENT_WEEK,
    tier: 'national',
    surface: 'hard',
    travelCostCents: 100_00,
    // Lists close two weeks out, which is what makes this cancellation the expensive one: past this
    // week the entry cannot be re-made, and it is the whole of «теперь на турнир не зайти».
    deadlineWeek: EVENT_WEEK - 2,
  }
  world.season.push(event)
  world.season.sort((a, b) => a.week - b.week)
  world.entries.push(ENTRY_ID)
  onsetInjury(world, scriptedDice(), 'week', BODY_REGIONS)
  return world
}

/** Walk her forward through the real countdown and report the week she is cleared in. */
function weekSheIsBack(world: WorldState, until: number): number {
  for (let w = world.week + 1; w <= until; w++) {
    world.week = w
    rollInjury(world)
    if (world.injury === null) return w
  }
  return Number.POSITIVE_INFINITY
}

describe('round 34 #21 – the automatic withdrawal reads the recovery date she actually keeps', () => {
  it('the fixture really is the ordering, or nothing below means anything', () => {
    // The daily rung's cadence is 1, the guard needs a layoff longer than two weeks, and the dice
    // above have to have produced the eight-week layoff the arms are written around.
    expect(ECONOMY.masseur.rungs.find((r) => r.sessions === 7)?.rehabExtraEveryNWeeks).toBe(1)
    const world = hurtCareer('r34-21-fixture', 'daily')
    expect(world.injury?.totalWeeks, 'the scripted dice deal eight weeks').toBe(8)
    expect(world.injury?.sinceWeek).toBe(ONSET_WEEK)
    // ⚠ THE TWO DATES, SIDE BY SIDE. The clinic's number puts her out until week 18; his hands take
    // four weeks off it, so she is back in week 14 and the event in week 15 is hers.
    expect(ONSET_WEEK + world.injury!.totalWeeks, 'the date the sweep used to read').toBe(18)
    expect(masseurRehabWeeksAhead(world), 'and the weeks the forecast takes off it').toBe(4)
    expect(EVENT_WEEK, 'the event sits between the two').toBeGreaterThanOrEqual(14)
    expect(EVENT_WEEK).toBeLessThan(18)
  })

  it('⭐⭐ WITH the masseur the entry survives – and she really is fit on the day', () => {
    const world = hurtCareer('r34-21-kept', 'daily')
    expect(world.entries, 'the desk did not pull her out').toContain(ENTRY_ID)

    // ⚠ AND THE FORECAST IS CHECKED AGAINST THE COUNTDOWN, not taken on trust: this is the arm that
    // says the entry was kept for a real reason rather than by a lucky comparison.
    expect(weekSheIsBack(world, EVENT_WEEK), 'cleared before the tournament week').toBe(14)
    expect(world.injury, 'and healthy when it comes round').toBeNull()
  })

  it('⭐⭐ WITHOUT the masseur the same injury still cancels it – the rule did not go soft', () => {
    const world = hurtCareer('r34-21-pulled', null)
    expect(world.injury?.totalWeeks, 'the identical eight-week layoff').toBe(8)
    expect(masseurRehabWeeksAhead(world), 'nobody is buying weeks back').toBe(0)
    expect(world.entries, 'so the desk withdraws her, exactly as before').not.toContain(ENTRY_ID)
    // ...and she genuinely is not fit for it: the countdown runs past the tournament.
    expect(weekSheIsBack(world, EVENT_WEEK)).toBe(Number.POSITIVE_INFINITY)
    expect(world.injury, 'still laid up on the week she would have played').not.toBeNull()
  })

  it('⚠ an event the masseur cannot reach is STILL cancelled – the forecast is not an exemption', () => {
    // Week 13 is inside the layoff on both readings, so a masseur must not save it. This is the arm
    // that fails if the fix had been «if a masseur is hired, skip the sweep».
    const world = createWorld('r34-21-still-out', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = ONSET_WEEK
    world.physioActive = false
    world.masseurHired = true
    world.masseurSessionsPerWeek = 7
    const event: SeasonEvent = {
      id: 'r34-21-inside',
      week: 13,
      tier: 'national',
      surface: 'hard',
      travelCostCents: 100_00,
      deadlineWeek: 11,
    }
    world.season.push(event)
    world.entries.push(event.id)
    onsetInjury(world, scriptedDice(), 'week', BODY_REGIONS)
    expect(world.entries, 'she is out that week however hard his hands work').not.toContain(event.id)
  })

  it('⚠ the countdown on screen is NOT rewritten – his weeks still arrive one receipt at a time', () => {
    // The forecast governs the withdrawal and nothing else: `weeksRemaining` is still the clinic's
    // dealt number at onset, which is what the "back in N weeks" the player is watching reads, and
    // the receipts are what make his work legible (world/masseur.ts). A fix that folded the forecast
    // into the field would pass every arm above and delete the feature.
    const world = hurtCareer('r34-21-countdown', 'daily')
    expect(world.injury?.weeksRemaining, 'the clinic dealt eight and the screen says eight').toBe(8)
    const before = world.events.length
    world.week = ONSET_WEEK + 1
    rollInjury(world)
    expect(world.injury?.weeksRemaining, 'one for the week, one bought back').toBe(6)
    expect(
      world.events.slice(before).map((e) => e.text).join(' | '),
      'and the week he bought prints a receipt',
    ).toMatch(/masseur bought a week back/i)
  })

  it('⚠ a holiday inside the layoff buys nothing that week, and the forecast knows it', () => {
    // `masseurWorksInWeek`'s own stand-downs, walked forward rather than assumed from today: on a
    // booked family week nobody is on his table, so the cadence misses and the layoff is longer.
    const world = hurtCareer('r34-21-holiday', 'daily')
    const plain = masseurRehabWeeksAhead(world)
    world.vacations.push({ week: ONSET_WEEK + 1, packageId: 'staycation', paidCents: 0 })
    world.vacations.push({ week: ONSET_WEEK + 2, packageId: 'staycation', paidCents: 0 })
    expect(masseurRehabWeeksAhead(world), 'two weeks away is two weeks his hands did not work').toBeLessThan(plain)
  })
})
