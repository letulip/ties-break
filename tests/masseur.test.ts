import { describe, it, expect } from 'vitest'
import {
  createWorld,
  hireMasseur,
  masseurUnlocked,
  masseurWorksThisWeek,
  masseurRoomNote,
  masseurRungOf,
  masseurWeeklyCents,
  masseurTourRelief,
  masseurTravelFareFor,
  setMasseurSessions,
  setMasseurTravels,
  resolveMasseur,
  rollInjury,
  accrueCondition,
  toSnapshot,
  MASSEUR_CHANGE_KEY,
  MASSEUR_LOCKED_DETAIL,
  MASSEUR_NOTE_WINDOW_WEEKS,
  COLLEGE_FREEZE_REFUSAL,
  type WorldState,
} from '../src/engine/world'
import { chargeMasseurTravel } from '../src/engine/world/sponsors'
import { coachTravelFareFor } from '../src/engine/world'
import { kitTermsFor } from '../src/engine/offers'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { CareerEnding, CollegeState, Offer } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

// =================================================================================================
// THE MASSEUR – travelling team step 1 (docs/specs/the-masseur-2026-08.md).
//
// What this file pins, in the order the feature can fail:
//   1. THE GATE – pro career only, and the refusal is the card's own sentence; inside the college
//      freeze the refusal is the COLLEGE sentence (guardNotEnded, not a second guard).
//   2. THE HIRE – the coach's shape: flag + kept, tagged ledger row; release always allowed.
//   3. THE BILL – a flat salary under its own 'staff' category, SUSPENDED (not cancelled) at
//      college and on booked family weeks – the coach's own stand-down pair.
//   4. THE EFFECT – the rung's condition bonus through the same predicate as the bill (at-home
//      weeks only since step 2), and the rehab cadence that takes one week off an active layoff
//      every Nth rehab week AT THE RUNG'S OWN N, with the receipts and the honest accounting
//      (weeksOut = weeks she was ACTUALLY out).
//   5. THE SENTENCE – the §4 room note: four states, no digits, '' unhired.
//   6. THE SAVE – v58 -> v59 migration: hired false, the dial on the middle rung, travel off.
//   7. ⭐ STEP 2, THE DIAL – the owner's sessions-per-week setting: rung-priced flat bill,
//      engine-validated, refused inside the freeze with the college sentence.
//   8. ⭐ STEP 2, THE FARE – the coach's price rule asked for one more seat: printed price at a
//      paying rung, zero at a junior one, the brand's share off both seats (Meridian's half), and
//      the coach-parity identity (one implementation, two seats).
//   9. ⭐ STEP 2, WHAT THE FARE BUYS – `masseurTourRelief`: per night between rounds, capped at
//      the strain, zero when he stayed home, zero on a one-match week.
//
// ⚠ RNG: every assertion here is exercised WITHOUT touching any stream – the hire, the bill and
// the cadence are deterministic by design, and the frozen MAIN capture (41550 / e6b0c709) in
// tests/condition.test.ts is the cross-file witness.
// =================================================================================================

/** A career standing on the professional table: her first counting W-series finish is on the
 *  never-pruned mark, which is exactly the one-way door `masseurUnlocked` reads. */
function proWorld(seed = 'masseur-pro'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0 // a W15 title: TIERS.w15.points[0] > 0, so wtaEverCounted is true
  return world
}

const collegeEnding: CareerEnding = {
  type: 'college',
  week: 200,
  ageYears: 19,
  detail: 'test freeze',
  resumesWeek: 400,
}

describe('1. the gate – a professional operation only', () => {
  it('a fresh junior career is locked, and the refusal is the card sentence', () => {
    const world = createWorld('masseur-junior', DEFAULT_PROFILE)
    expect(masseurUnlocked(world)).toBe(false)
    expect(() => hireMasseur(world, true)).toThrow(MASSEUR_LOCKED_DETAIL)
    expect(world.masseurHired).toBe(false)
  })

  it('her first counting W-series result opens the door for good', () => {
    const world = proWorld()
    expect(masseurUnlocked(world)).toBe(true)
    hireMasseur(world, true)
    expect(world.masseurHired).toBe(true)
  })

  it('⚠ inside the college freeze the refusal is the COLLEGE sentence – guardNotEnded, no second guard', () => {
    const world = proWorld('masseur-freeze')
    world.ending = { ...collegeEnding }
    expect(() => hireMasseur(world, true)).toThrow(COLLEGE_FREEZE_REFUSAL)
    // ...and the release direction refuses identically: the freeze is total, the hire only SUSPENDS.
    world.ending = null
    hireMasseur(world, true)
    world.ending = { ...collegeEnding }
    expect(() => hireMasseur(world, false)).toThrow(COLLEGE_FREEZE_REFUSAL)
    expect(world.masseurHired, 'the hire survives the freeze').toBe(true)
  })
})

describe('2. the hire – the coach machinery, second seat', () => {
  it('writes a kept, tagged ledger row on each direction, and repeats are no-ops', () => {
    const world = proWorld('masseur-hire')
    hireMasseur(world, true)
    const hired = world.events.find((e) => e.milestoneKey === `${MASSEUR_CHANGE_KEY}${world.week}`)
    expect(hired, 'the hire row exists, tagged with the week').toBeTruthy()
    expect(hired!.keep, 'and it is kept – the radar trick, one row per change').toBe(true)
    const count = world.events.length
    hireMasseur(world, true) // a repeat is a no-op, not a second row
    expect(world.events.length).toBe(count)
    world.week += 3
    hireMasseur(world, false)
    expect(world.masseurHired).toBe(false)
    expect(world.events.some((e) => e.milestoneKey === `${MASSEUR_CHANGE_KEY}${world.week}`)).toBe(true)
  })
})

describe('3. the bill – a flat rung salary that suspends where the coach stands down', () => {
  it('charges exactly the rung`s flat weekly bill under its own category', () => {
    const world = proWorld('masseur-bill')
    hireMasseur(world, true)
    const before = world.fundsCents
    resolveMasseur(world)
    expect(before - world.fundsCents).toBe(masseurWeeklyCents(world))
    const row = world.events.find((e) => e.category === 'staff')
    expect(row, 'the ledger row is its own bucket, never physio').toBeTruthy()
    expect(row!.amountCents).toBe(-masseurWeeklyCents(world))
  })

  it('⭐ the dial prices the bill: sessions × the professional session rate, flat, every rung', () => {
    for (const rung of ECONOMY.masseur.rungs) {
      const world = proWorld(`masseur-bill-${rung.sessions}`)
      hireMasseur(world, true)
      setMasseurSessions(world, rung.sessions)
      const before = world.fundsCents
      resolveMasseur(world)
      expect(before - world.fundsCents, rung.label).toBe(rung.sessions * ECONOMY.masseur.perSessionCents)
    }
  })

  it('charges nothing without a hire, and nothing at college or on a booked family week', () => {
    const world = proWorld('masseur-suspend')
    const before = world.fundsCents
    resolveMasseur(world)
    expect(world.fundsCents, 'no hire, no bill').toBe(before)

    hireMasseur(world, true)
    world.college = { untilWeek: world.week + 100 } as CollegeState
    expect(masseurWorksThisWeek(world), 'the freeze suspends him').toBe(false)
    resolveMasseur(world)
    expect(world.fundsCents, 'no charge at college – suspended, not cancelled').toBe(before)
    expect(world.masseurHired, 'and the hire survives').toBe(true)

    world.college = null
    world.vacations = [{ week: world.week, packageId: 'grandma', paidCents: 0 }]
    expect(masseurWorksThisWeek(world), 'a family week away stands him down').toBe(false)
    resolveMasseur(world)
    expect(world.fundsCents).toBe(before)

    world.vacations = []
    resolveMasseur(world)
    expect(before - world.fundsCents, 'an ordinary week bills').toBe(masseurWeeklyCents(world))
  })
})

describe('4a. the effect – condition, through the same predicate as the bill', () => {
  it('a masseur week recovers exactly the rung`s bonus more than the same week without him', () => {
    const with_ = proWorld('masseur-cond')
    const without = proWorld('masseur-cond')
    hireMasseur(with_, true)
    with_.condition = 50
    without.condition = 50
    accrueCondition(with_, false)
    accrueCondition(without, false)
    expect(with_.condition - without.condition).toBe(masseurRungOf(with_).conditionBonusPerWeek)
  })

  it('⭐ the dial scales the table: the daily rung recovers more than the lower two', () => {
    const daily = proWorld('masseur-cond-daily')
    const twice = proWorld('masseur-cond-daily')
    hireMasseur(daily, true)
    hireMasseur(twice, true)
    setMasseurSessions(daily, 7)
    setMasseurSessions(twice, 2)
    daily.condition = 50
    twice.condition = 50
    accrueCondition(daily, false)
    accrueCondition(twice, false)
    expect(masseurRungOf(daily).conditionBonusPerWeek).toBeGreaterThan(masseurRungOf(twice).conditionBonusPerWeek)
    expect(daily.condition - twice.condition).toBe(
      masseurRungOf(daily).conditionBonusPerWeek - masseurRungOf(twice).conditionBonusPerWeek,
    )
  })

  it('⭐ step 2: a week she PLAYS earns no at-home bonus – nobody is on the table (the trips are the stance`s business)', () => {
    const with_ = proWorld('masseur-cond-played')
    const without = proWorld('masseur-cond-played')
    hireMasseur(with_, true)
    with_.condition = 50
    without.condition = 50
    accrueCondition(with_, true)
    accrueCondition(without, true)
    expect(with_.condition, 'a played week is identical with and without the hire').toBe(without.condition)
  })

  it('...and a suspended week buys nothing – the paid week and the bought week are the same week', () => {
    const world = proWorld('masseur-cond-college')
    const control = proWorld('masseur-cond-college')
    hireMasseur(world, true)
    world.college = { untilWeek: world.week + 100 } as CollegeState
    control.college = { untilWeek: control.week + 100 } as CollegeState
    world.condition = 50
    control.condition = 50
    accrueCondition(world, false)
    accrueCondition(control, false)
    expect(world.condition).toBe(control.condition)
  })
})

describe('4b. the effect – the rehab cadence, the channel the player can watch', () => {
  /** An active layoff, dealt `totalWeeks`, opened THIS week. */
  function withLayoff(world: WorldState, totalWeeks: number): void {
    world.injury = {
      kind: 'ankle strain',
      severity: 'moderate',
      weeksRemaining: totalWeeks,
      totalWeeks,
      sinceWeek: world.week,
    }
  }
  /** Walk rehab ticks until she clears; returns the number of weeks she was actually out. */
  function walkOut(world: WorldState, cap = 30): number {
    const start = world.week
    for (let i = 0; i < cap; i++) {
      world.week += 1
      rollInjury(world)
      if (world.injury === null) return world.week - start
    }
    throw new Error('layoff never cleared')
  }

  it('a 6-week layoff clears in 4 – two bought weeks, two receipts, honest accounting', () => {
    const world = proWorld('masseur-rehab')
    hireMasseur(world, true)
    withLayoff(world, 6)
    const out = walkOut(world)
    expect(out).toBe(6 - 2)
    expect(world.events.filter((e) => e.text.includes('the masseur bought a week back')).length).toBe(2)
    const row = world.injuryHistory[world.injuryHistory.length - 1]
    expect(row.weeksOut, 'the record keeps the weeks she was ACTUALLY out').toBe(4)
    expect(row.weeksSaved).toBe(2)
    expect(world.careerTotals.weeksLostToInjury, 'the ending hazard reads the fact, not the forecast').toBe(4)
    expect(world.events.some((e) => e.type === 'recovery' && e.text.includes('ahead of schedule'))).toBe(true)
  })

  it('the same 6-week layoff without him runs its full course, byte-identical accounting', () => {
    const world = proWorld('masseur-rehab-none')
    withLayoff(world, 6)
    const out = walkOut(world)
    expect(out).toBe(6)
    const row = world.injuryHistory[world.injuryHistory.length - 1]
    expect(row.weeksOut).toBe(6)
    expect('weeksSaved' in row, 'the key is written only when he saved something').toBe(false)
    expect(world.careerTotals.weeksLostToInjury).toBe(6)
  })

  it('a niggle gains nothing – nobody massages a one-week soreness away', () => {
    for (const totalWeeks of [1, 2]) {
      const world = proWorld(`masseur-niggle-${totalWeeks}`)
      hireMasseur(world, true)
      withLayoff(world, totalWeeks)
      expect(walkOut(world), `a ${totalWeeks}-week layoff is not shortened`).toBe(totalWeeks)
      expect(world.injuryHistory[world.injuryHistory.length - 1].weeksOut).toBe(totalWeeks)
    }
  })

  it('a long layoff loses roughly a third: 9 dealt, 6 served', () => {
    const world = proWorld('masseur-rehab-long')
    hireMasseur(world, true)
    withLayoff(world, 9)
    expect(walkOut(world)).toBe(6)
    expect(world.injuryHistory[world.injuryHistory.length - 1].weeksSaved).toBe(3)
  })

  it('⭐ the dial scales the cadence, and every rung measurably beats the one below it', () => {
    // The same 6-week layoff, walked at each rung: N=3 buys one week, N=2 buys two, N=1 halves it.
    const outAt: Record<number, number> = {}
    for (const rung of ECONOMY.masseur.rungs) {
      const world = proWorld(`masseur-dial-${rung.sessions}`)
      hireMasseur(world, true)
      setMasseurSessions(world, rung.sessions)
      withLayoff(world, 6)
      outAt[rung.sessions] = walkOut(world)
    }
    expect(outAt[2], 'twice a week: one week bought').toBe(5)
    expect(outAt[4], 'every other day: two weeks bought (step 1`s measured arm)').toBe(4)
    expect(outAt[7], 'daily: the layoff is halved').toBe(3)
  })

  it('⚠ the niggle rule holds at EVERY rung – daily hands do not massage a two-week soreness away', () => {
    for (const totalWeeks of [1, 2]) {
      const world = proWorld(`masseur-daily-niggle-${totalWeeks}`)
      hireMasseur(world, true)
      setMasseurSessions(world, 7)
      withLayoff(world, totalWeeks)
      expect(walkOut(world), `a ${totalWeeks}-week layoff is not shortened even daily`).toBe(totalWeeks)
    }
  })

  it('⚠ a suspended week is not a rehab week he works – the cadence skips a family week away', () => {
    const world = proWorld('masseur-rehab-vac')
    hireMasseur(world, true)
    withLayoff(world, 6)
    // A cadence week (rehab week 2) is booked as a family week away: that extra never fires, the
    // week-4 one still does, so she is out 5 instead of the worked-through 4.
    world.vacations = [{ week: world.week + 2, packageId: 'grandma', paidCents: 0 }]
    expect(walkOut(world), 'a stood-down week buys nothing; the next worked cadence week still does').toBe(5)
    expect(world.injuryHistory[world.injuryHistory.length - 1].weeksSaved).toBe(1)
  })
})

describe('5. ⭐ the sentence – the §4 room note, four states and no digits', () => {
  it('is empty while nobody is hired', () => {
    expect(masseurRoomNote(proWorld('masseur-note-0'))).toBe('')
  })

  it('names the working rehab once he has moved the return date', () => {
    const world = proWorld('masseur-note-1')
    hireMasseur(world, true)
    world.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 3, totalWeeks: 6, sinceWeek: world.week - 3, weeksSaved: 1 }
    expect(masseurRoomNote(world)).toBe('Working the rehab – her return is closer than the clinic promised.')
    world.injury.weeksSaved = undefined
    // ⚠ Cadence-neutral since the dial: «twice a day» would be a lie on the twice-a-week rung.
    expect(masseurRoomNote(world)).toBe('On the table through the layoff – the rehab is in professional hands.')
  })

  it('⭐ the flagship: a recent layoff that ended early reads as the weeks his hands did not lose', () => {
    const world = proWorld('masseur-note-2')
    hireMasseur(world, true)
    world.injuryHistory.push({ kind: 'ankle strain', severity: 'moderate', week: world.week - 4, weeksOut: 4, weeksSaved: 1 })
    expect(masseurRoomNote(world)).toBe('Weeks bought back – the last layoff ended sooner than it should have.')
    // ...and it goes quiet once the window closes – "this month", not "once, ever".
    world.injuryHistory[world.injuryHistory.length - 1].week = world.week - MASSEUR_NOTE_WINDOW_WEEKS - 1
    expect(masseurRoomNote(world)).toBe('Fresh legs – the weekly table work keeps her body ahead of the grind.')
  })

  it('house law on every masseur string: no digits in the note, no Cyrillic, short dash only', () => {
    const world = proWorld('masseur-note-law')
    hireMasseur(world, true)
    // ...and the step-2 surfaces: the stance switch both ways and the dial's re-cut line, all
    // written while hired so each prints its feed row.
    setMasseurTravels(world, true)
    setMasseurTravels(world, false)
    setMasseurSessions(world, 7)
    const states = [
      masseurRoomNote(world),
      MASSEUR_LOCKED_DETAIL,
      ...world.events.filter((e) => e.milestoneKey?.startsWith(MASSEUR_CHANGE_KEY)).map((e) => e.text),
      ...world.events.filter((e) => e.text.startsWith('The masseur')).map((e) => e.text),
    ]
    world.injury = { kind: 'x', severity: 'moderate', weeksRemaining: 2, totalWeeks: 4, sinceWeek: world.week, weeksSaved: 1 }
    states.push(masseurRoomNote(world))
    world.injury.weeksSaved = undefined
    states.push(masseurRoomNote(world))
    for (const s of states) {
      expect(s.length).toBeGreaterThan(0)
      expect(s, `no digits: "${s}"`).not.toMatch(/\d/)
      expect(s, `no Cyrillic: "${s}"`).not.toMatch(/[Ѐ-ӿ]/)
      expect(s, `short dash only: "${s}"`).not.toMatch(/—/)
    }
  })

  it('the snapshot carries every card fact, derived – the dial and the stance included', () => {
    const world = proWorld('masseur-snap')
    hireMasseur(world, true)
    setMasseurSessions(world, 7)
    const snap = toSnapshot(world)
    expect(snap.masseurHired).toBe(true)
    expect(snap.masseurUnlocked).toBe(true)
    expect(snap.masseurSalaryCents, 'the RUNG`s price, not a constant').toBe(masseurWeeklyCents(world))
    expect(snap.masseurSalaryCents).toBe(7 * ECONOMY.masseur.perSessionCents)
    expect(snap.masseurSessionsPerWeek).toBe(7)
    expect(snap.masseurTravels).toBe(false)
    expect(snap.masseurNote).toBe('Fresh legs – the weekly table work keeps her body ahead of the grind.')
    // The as-if travel quote: numbers only, and only for booked paying trips (none here).
    expect(snap.masseurTravelTrips).toBe(0)
    expect(snap.masseurTravelFareCents).toBe(0)
  })
})

describe('6. the save – v58 -> v59 (extended in place by step 2, on the same unmerged branch)', () => {
  it('the real v58 fixture migrates to hired false, the middle rung, travel off – and nothing invents a hire', () => {
    const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
    const save = migrateSave(JSON.parse(readFileSync(`${DIR}/v58.json`, 'utf8')))
    expect(save.schemaVersion).toBe(59)
    expect(save.masseurHired).toBe(false)
    expect(save.masseurSessionsPerWeek, 'the dial opens on the professional default').toBe(4)
    expect(save.masseurSessionsPerWeek).toBe(ECONOMY.masseur.defaultSessions)
    expect(save.masseurTravels, 'a migration never buys a seat').toBe(false)
    // No injuryHistory row of an old save carries the v59 key – nothing is back-filled.
    for (const row of save.injuryHistory) expect('weeksSaved' in row).toBe(false)
  })

  it('a fresh world opens with the seat empty, the dial on the default, the stance off', () => {
    const world = createWorld('masseur-fresh', DEFAULT_PROFILE)
    expect(world.masseurHired).toBe(false)
    expect(world.masseurSessionsPerWeek).toBe(ECONOMY.masseur.defaultSessions)
    expect(world.masseurTravels).toBe(false)
  })
})

describe('7. ⭐ the dial – the owner`s sessions-per-week setting (step 2)', () => {
  it('the engine refuses an arrangement the market does not sell', () => {
    const world = proWorld('masseur-dial-refuse')
    hireMasseur(world, true)
    expect(() => setMasseurSessions(world, 5)).toThrow('No such arrangement')
    expect(world.masseurSessionsPerWeek).toBe(ECONOMY.masseur.defaultSessions)
  })

  it('a repeat is a no-op; a real change while hired writes one feed line', () => {
    const world = proWorld('masseur-dial-events')
    hireMasseur(world, true)
    const count = world.events.length
    setMasseurSessions(world, ECONOMY.masseur.defaultSessions)
    expect(world.events.length, 'same rung, no row').toBe(count)
    setMasseurSessions(world, 7)
    expect(world.masseurSessionsPerWeek).toBe(7)
    expect(world.events.length).toBe(count + 1)
    expect(world.events[world.events.length - 1].text).toContain('re-cut')
  })

  it('an UNHIRED change is a recorded stance, silently – it prices the card, it bills nobody', () => {
    const world = proWorld('masseur-dial-unhired')
    const count = world.events.length
    setMasseurSessions(world, 2)
    expect(world.masseurSessionsPerWeek).toBe(2)
    expect(world.events.length, 'no feed line for a hire that does not exist').toBe(count)
  })

  it('⚠ inside the college freeze both step-2 commands refuse with the COLLEGE sentence', () => {
    const world = proWorld('masseur-dial-freeze')
    world.ending = { ...collegeEnding }
    expect(() => setMasseurSessions(world, 7)).toThrow(COLLEGE_FREEZE_REFUSAL)
    expect(() => setMasseurTravels(world, true)).toThrow(COLLEGE_FREEZE_REFUSAL)
  })
})

describe('8. ⭐ the fare – the coach`s price rule asked for one more seat (step 2)', () => {
  /** A paying rung's event and a junior one, hand-built on the calendar's own shape. */
  const wEvent: SeasonEvent = { id: 'x-w35', week: 10, tier: 'w35', surface: 'hard', travelCostCents: 900_00, deadlineWeek: 8 }
  const jEvent: SeasonEvent = { id: 'x-j60', week: 10, tier: 'j60', surface: 'hard', travelCostCents: 900_00, deadlineWeek: 8 }

  function travellingWorld(seed: string): WorldState {
    const world = proWorld(seed)
    hireMasseur(world, true)
    setMasseurTravels(world, true)
    return world
  }

  it('gates: no hire, no stance, or a rung that pays nothing – no fare', () => {
    const unhired = proWorld('masseur-fare-unhired')
    setMasseurTravels(unhired, true)
    expect(masseurTravelFareFor(unhired, wEvent)).toBe(0)
    const home = proWorld('masseur-fare-home')
    hireMasseur(home, true)
    expect(masseurTravelFareFor(home, wEvent), 'the switch is what buys the seat').toBe(0)
    const travelling = travellingWorld('masseur-fare-junior')
    expect(masseurTravelFareFor(travelling, jEvent), 'no seat to a rung that pays no prize money').toBe(0)
  })

  it('the seat is the calendar`s own printed price at a paying rung – GROSS, no scholarship reaches it', () => {
    const world = travellingWorld('masseur-fare-price')
    expect(masseurTravelFareFor(world, wEvent)).toBe(wEvent.travelCostCents)
  })

  it('⭐ coach parity: one price rule, two seats – the same world quotes the same fare for both', () => {
    const world = travellingWorld('masseur-fare-parity')
    world.coachId = 'any-coach'
    world.coachOnEventWeeks = true
    expect(masseurTravelFareFor(world, wEvent), 'the seats price identically by construction').toBe(
      coachTravelFareFor(world, wEvent),
    )
  })

  it('⭐ Meridian`s half lands on this seat too: the brand`s travel share comes off both seats', () => {
    const world = travellingWorld('masseur-fare-meridian')
    const terms = kitTermsFor({ nationalRank: 1, itfRank: 1, itfRanked: true, wtaRank: 1, wtaRanked: true }, 'premium')!
    expect(terms.travelShare, 'the fixture rung is the 50% one').toBe(0.5)
    const deal: Offer = {
      id: 'kit-meridian',
      kind: 'kit',
      week: world.week,
      deadlineWeek: world.week + 4,
      state: 'signed',
      terms,
      decidedWeek: world.week,
      fromWeek: world.week,
      untilWeek: world.week + 200,
    }
    world.offers.push(deal)
    expect(masseurTravelFareFor(world, wEvent), 'half of the printed price, exactly').toBe(
      wEvent.travelCostCents - Math.round(wEvent.travelCostCents * 0.5),
    )
  })

  it('the charge books one travel row at the fare and returns it – and a zero fare books nothing', () => {
    const world = travellingWorld('masseur-fare-charge')
    const before = world.fundsCents
    const fare = chargeMasseurTravel(world, wEvent)
    expect(fare).toBe(wEvent.travelCostCents)
    expect(before - world.fundsCents).toBe(fare)
    const row = world.events[world.events.length - 1]
    expect(row.category).toBe('travel')
    expect(row.text).toContain('masseur travels')
    expect(row.amountCents).toBe(-fare)
    const homebody = proWorld('masseur-fare-charge-none')
    hireMasseur(homebody, true)
    const count = homebody.events.length
    expect(chargeMasseurTravel(homebody, wEvent)).toBe(0)
    expect(homebody.events.length, 'no row for a trip nobody took').toBe(count)
  })
})

describe('9. ⭐ what the fare buys – recovery between rounds, by depth (step 2)', () => {
  it('is zero when he stayed home, whatever the run', () => {
    expect(masseurTourRelief(5, 30, false)).toBe(0)
  })

  it('is per night between rounds: a first-round exit buys nothing, a deep run buys the most', () => {
    const per = ECONOMY.masseur.tourRecoveryPerRound
    expect(masseurTourRelief(1, 10, true), 'one match, no nights between rounds').toBe(0)
    expect(masseurTourRelief(3, 30, true)).toBe(2 * per)
    expect(masseurTourRelief(5, 30, true)).toBe(4 * per)
  })

  it('is capped at the strain itself – hands cannot make a week restful, only less expensive', () => {
    expect(masseurTourRelief(5, 3, true)).toBe(3)
    expect(masseurTourRelief(5, 0, true)).toBe(0)
  })
})
