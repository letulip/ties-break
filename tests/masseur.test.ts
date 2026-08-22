import { describe, it, expect } from 'vitest'
import {
  createWorld,
  hireMasseur,
  masseurUnlocked,
  masseurWorksThisWeek,
  masseurRoomNote,
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
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { CareerEnding, CollegeState } from '../src/shared/protocol'

// =================================================================================================
// THE MASSEUR – travelling team step 1 (docs/specs/the-masseur-2026-08.md).
//
// What this file pins, in the order the feature can fail:
//   1. THE GATE – pro career only, and the refusal is the card's own sentence; inside the college
//      freeze the refusal is the COLLEGE sentence (guardNotEnded, not a second guard).
//   2. THE HIRE – the coach's shape: flag + kept, tagged ledger row; release always allowed.
//   3. THE BILL – a flat salary under its own 'staff' category, SUSPENDED (not cancelled) at
//      college and on booked family weeks – the coach's own stand-down pair.
//   4. THE EFFECT – +1 condition through the same predicate as the bill, and the rehab cadence
//      that takes one week off an active layoff every Nth rehab week, with the receipts and the
//      honest accounting (weeksOut = weeks she was ACTUALLY out).
//   5. THE SENTENCE – the §4 room note: four states, no digits, '' unhired.
//   6. THE SAVE – v58 -> v59 migration writes false and nothing else.
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

describe('3. the bill – a flat salary that suspends where the coach stands down', () => {
  it('charges exactly the flat salary under its own category', () => {
    const world = proWorld('masseur-bill')
    hireMasseur(world, true)
    const before = world.fundsCents
    resolveMasseur(world)
    expect(before - world.fundsCents).toBe(ECONOMY.masseur.salaryPerWeekCents)
    const row = world.events.find((e) => e.category === 'staff')
    expect(row, 'the ledger row is its own bucket, never physio').toBeTruthy()
    expect(row!.amountCents).toBe(-ECONOMY.masseur.salaryPerWeekCents)
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
    expect(before - world.fundsCents, 'an ordinary week bills').toBe(ECONOMY.masseur.salaryPerWeekCents)
  })
})

describe('4a. the effect – condition, through the same predicate as the bill', () => {
  it('a masseur week recovers exactly conditionBonusPerWeek more than the same week without him', () => {
    const with_ = proWorld('masseur-cond')
    const without = proWorld('masseur-cond')
    hireMasseur(with_, true)
    with_.condition = 50
    without.condition = 50
    accrueCondition(with_, false)
    accrueCondition(without, false)
    expect(with_.condition - without.condition).toBe(ECONOMY.masseur.conditionBonusPerWeek)
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
    expect(masseurRoomNote(world)).toBe('On the table twice a day – the rehab is in professional hands.')
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
    const states = [
      masseurRoomNote(world),
      MASSEUR_LOCKED_DETAIL,
      ...world.events.filter((e) => e.milestoneKey?.startsWith(MASSEUR_CHANGE_KEY)).map((e) => e.text),
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

  it('the snapshot carries all four card facts, derived', () => {
    const world = proWorld('masseur-snap')
    hireMasseur(world, true)
    const snap = toSnapshot(world)
    expect(snap.masseurHired).toBe(true)
    expect(snap.masseurUnlocked).toBe(true)
    expect(snap.masseurSalaryCents).toBe(ECONOMY.masseur.salaryPerWeekCents)
    expect(snap.masseurNote).toBe('Fresh legs – the weekly table work keeps her body ahead of the grind.')
  })
})

describe('6. the save – v58 -> v59', () => {
  it('the real v58 fixture migrates to masseurHired: false, and nothing invents a hire', () => {
    const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
    const save = migrateSave(JSON.parse(readFileSync(`${DIR}/v58.json`, 'utf8')))
    expect(save.schemaVersion).toBe(59)
    expect(save.masseurHired).toBe(false)
    // No injuryHistory row of an old save carries the v59 key – nothing is back-filled.
    for (const row of save.injuryHistory) expect('weeksSaved' in row).toBe(false)
  })

  it('a fresh world opens with the seat empty', () => {
    expect(createWorld('masseur-fresh', DEFAULT_PROFILE).masseurHired).toBe(false)
  })
})
