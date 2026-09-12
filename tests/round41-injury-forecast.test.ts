// =================================================================================================
// ROUND 41 #19 – THE CLINIC'S SEVEN AND THE MASSEUR'S FOUR
// =================================================================================================
//
// The owner, 12.09: «мне написали, что травма отнимет 7 недель, а в итогах года было 4 недели.
// Видимо массажист очень хорошо работает, но в этом случае вообще на экране травмы можно писать
// сколько реально займет восстановление с текущим тиром массажиста.»
//
// BOTH NUMBERS WERE TRUE. `weeksOut` at onset already carries the PHYSIO's cut
// (`physioRecoveryFactor`, at most −16%); the MASSEUR's weeks are paid out afterwards, one per
// cadence step in `rollInjury`, and on the daily rung (`rehabExtraEveryNWeeks: 1`) a dealt 7 runs 4 –
// exactly, by arithmetic and not by luck. The announcement and the year-end total were never
// describing the same thing.
//
// ⚠⚠ THIS SUPERSEDES A RECORDED RULING AND SAYS SO. `world/injury.ts` and `world/masseur.ts` both
// state that the forecast is deliberately not displayed – «recovery you can watch», one receipt at a
// time. That reasoning still governs the COUNTDOWN, which does not move here: `weeksRemaining` is
// still the clinic's number and every «bought a week back» line still arrives. What his 12.09 report
// overturns is the narrower claim about the ANNOUNCEMENT, and both comments are amended in place
// rather than deleted – a ruling is a record, and the round that overturns one names itself.
//
// ⚠ THE FORECAST IS NOT A SECOND SPELLING OF THE CADENCE. `masseurRehabWeeksAhead` is the same
// forward replay round 34 #21's withdrawal sweep already trusts; arm C walks a real layoff to its end
// and checks the forecast against what the engine actually did, which is the only way to know.
import { describe, expect, it } from 'vitest'
import { rollInjury, toSnapshot } from '../src/engine/world'
import { onsetInjury } from '../src/engine/world/injury'
import { masseurRehabWeeksAhead, masseurRungOf } from '../src/engine/world/masseur'
import { BODY_REGIONS } from '../src/engine/body'
import { rngFromSeed } from '../src/engine/rng'
// ⚠ ONE FIXTURE, TWO SUITES – the component suite mounts the real dialog over these same worlds
// (tests/component/round41-injury-forecast.test.ts). See the helper's own header.
import { base, seedForExactLayoff, sevenWeeksAndADailyMasseur } from './helpers/r41InjuryForecast'

describe('round 41 #19 — the engine states the honest second number', () => {
  it('⭐ announced 7, daily rung: the view says 4 – his own arithmetic, reproduced', () => {
    // ⚠ THE MUTATION THAT MUST FAIL THIS: fill `expectedWeeks` from `world.injury.totalWeeks` in
    // world/snapshot.ts (i.e. hand the dialog the clinic's number twice) and this arm reds at 7.
    const world = sevenWeeksAndADailyMasseur('r41-19-seven')
    expect(world.injury!.totalWeeks).toBe(7)
    expect(masseurRungOf(world).rehabExtraEveryNWeeks, 'the daily rung').toBe(1)

    const injury = toSnapshot(world).injury!
    expect(injury.totalWeeks, 'the clinic still says seven').toBe(7)
    expect(injury.weeksRemaining, 'and the countdown is still the clinic\'s number').toBe(7)
    expect(injury.expectedWeeks, 'while the masseur is on course for four').toBe(4)
  })

  it('a career with no masseur carries no forecast at all – the row is what it always was', () => {
    const world = sevenWeeksAndADailyMasseur('r41-19-none', false)
    expect(world.masseurHired).toBe(false)
    const injury = toSnapshot(world).injury!
    expect(injury.totalWeeks).toBe(7)
    expect(injury.expectedWeeks, 'absent, not equal-to-total').toBeUndefined()
    expect(masseurRehabWeeksAhead(world)).toBe(0)
  })

  it('a layoff too short for the cadence carries none either (the niggle rule, at every rung)', () => {
    // «Nobody massages a one-week soreness away» – `totalWeeks > 2` is a guard in `rollInjury` and in
    // the forward replay both, so the daily rung cannot halve a two-week knock and the card cannot
    // promise that it will.
    const world = base('r41-19-niggle')
    world.masseurHired = true
    world.masseurSessionsPerWeek = 7
    onsetInjury(world, rngFromSeed(seedForExactLayoff(world, 2)), 'week', BODY_REGIONS)
    expect(world.injury!.totalWeeks).toBe(2)
    expect(toSnapshot(world).injury!.expectedWeeks).toBeUndefined()
  })

  it('⭐ and the forecast is HONEST – the layoff really does end when it says', () => {
    // The arm that makes the number a claim about the world rather than about a formula. It walks
    // the real `rollInjury` cadence week by week and counts the weeks she is actually out.
    const world = sevenWeeksAndADailyMasseur('r41-19-walk')
    const promised = toSnapshot(world).injury!.expectedWeeks!
    expect(promised).toBe(4)

    // ⚠ `rollInjury` TAKES NO RNG – the cadence reads (week − sinceWeek) and nothing else, which is
    // exactly why the forecast can replay it. Stated here because the walk below would otherwise look
    // like it had a stream to feed.
    let weeksOut = 0
    for (let i = 0; i < 20 && world.injury !== null; i++) {
      world.week += 1
      rollInjury(world)
      weeksOut += 1
    }
    expect(world.injury, 'she is back inside the window').toBeNull()
    expect(weeksOut, 'and the forecast named the week').toBe(promised)
  })

  it('the cheaper rungs forecast their own cadence, not the daily one', () => {
    // Every-other-day is every 2nd rehab week, twice a week every 3rd – so the same dealt seven runs
    // 5 and 6. Three rungs, three different honest numbers off ONE function.
    const byRung: Record<number, number | undefined> = {}
    for (const sessions of [2, 4, 7]) {
      const world = base(`r41-19-rung-${sessions}`)
      world.masseurHired = true
      world.masseurSessionsPerWeek = sessions
      onsetInjury(world, rngFromSeed(seedForExactLayoff(world, 7)), 'week', BODY_REGIONS)
      byRung[sessions] = toSnapshot(world).injury!.expectedWeeks
    }
    expect(byRung).toEqual({ 2: 6, 4: 5, 7: 4 })
  })

  it('⚠ the forecast never reaches the SAVE – it is a wire field and the world has no room for it', () => {
    // `WorldState.injury` is typed `SnapshotInjury`; `Snapshot.injury` is an `InjuryView`, which is
    // that plus this one derived number. A save that carried its own forecast is the failure mode
    // nothing here would catch, so the two types are what keeps it out.
    const world = sevenWeeksAndADailyMasseur('r41-19-schema')
    expect(toSnapshot(world).injury!.expectedWeeks).toBe(4)
    expect(Object.keys(world.injury!), 'the persisted object gained nothing').not.toContain('expectedWeeks')
  })

  it('⚠ and the weekly receipts still arrive – the product is not replaced by the forecast', () => {
    const world = sevenWeeksAndADailyMasseur('r41-19-receipts')
    const before = world.events.length
    world.week += 1
    rollInjury(world)
    const said = world.events.slice(before).map((e) => e.text)
    expect(said, 'the bought week still prints').toContain('Rehab ahead of schedule – the masseur bought a week back.')
    expect(world.injury!.weeksSaved).toBe(1)
  })
})
