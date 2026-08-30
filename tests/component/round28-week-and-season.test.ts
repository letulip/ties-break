// ROUND 28 #1, #4 AND #6 – THE WEEK: HOW IT IS PLANNED, HOW IT IS LABELLED, HOW IT IS SHOWN.
//
// Three of the owner's items land on one week and are tested together because they contradict each
// other if they are not. His words are in docs/rounds/round-28.md, where they may be quoted in his
// own language; in English:
//
//   #1 with a masseur hired, put the massage sessions the chosen TIER buys into the week's schedule.
//   #4 a sponsor's shoot week needs its own plate, or at least some mark, in the season calendar.
//   #6 the button before a shoot week should say `Shooting week`, and the week itself should
//      COMBINE training days with the shoot's slots rather than the shoot eating the week.
//
// ⚠⚠ AND THE CONTRADICTION IS REAL, WHICH IS WHY THEY ARE ONE FILE. `accrueCondition` charges a
// shoot week at the TRAVEL figure and takes the masseur's at-home table off it in the same breath –
// «lights and flights, not his table». So a shoot week that ALSO drew massage sessions would be the
// picture promising an hour the ledger does not buy, which is exactly the two-surfaces-disagreeing
// defect this codebase's comments spend their length on. The last block below asserts it.
//
// ⚠ MUTATION-VERIFIED, and each block names its own mutation. Nothing here was believed on a green
// run alone.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { mountSeason } from '../helpers/mountSeason'
import { careerSnapshot } from '../helpers/career'
import { calendarWeekFor } from '../../src/composables/weekDays'
import { ECONOMY } from '../../src/engine/economy'
import type { Snapshot } from '../../src/shared/protocol'

// ⚠ THE FIXTURE WEEK IS CHOSEN AND THEN PROVED, NOT ASSUMED. `useCalendarWeek` draws `week + 1`
// always, so the career has to be standing one week before an ORDINARY training week or every claim
// below is about the wrong branch of `calendarWeekFor`. Week 8 of this career draws week 9: a plain
// five-session week with rest on Wednesday and Sunday. The first test proves both halves and goes
// red if a balance change ever moves them, rather than letting the rest of the file quietly assert
// about a tournament week.
const SEED = 'r28-week'
const AT = 8
const FREE_DAYS = [2, 6]

const base = (): Snapshot => careerSnapshot(AT, SEED)

/** The brand and the weeks a signed endorsement names. `toSnapshot` derives `adShoots` from the
 *  deal's own frozen terms; a test that walked a career until a letter arrived AND was signed AND
 *  named this week would be testing `chooseShootWeeks`, which `tests/ad-offer.test.ts` already
 *  owns. What is under test here is what the SCREENS do with the fact. */
const BRAND = 'Quiet Hour'

/** A career whose signed deal has a shoot on the week the calendar is about (`AT + 1`). */
function shootingNext(): Snapshot {
  return { ...base(), adShoots: [{ brand: BRAND, weeks: [AT + 1] }] }
}

/** ...and one with a masseur at `sessions` a week, which must be one of the shipped rungs. */
function withMasseur(snapshot: Snapshot, sessions: number): Snapshot {
  expect(
    ECONOMY.masseur.rungs.map((r) => r.sessions),
    'the test is dialling a rung the game does not sell',
  ).toContain(sessions)
  return { ...snapshot, masseurHired: true, masseurSessionsPerWeek: sessions, masseurTravels: false }
}

function mountCalendar(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(CalendarScreen, { global: { stubs: { teleport: true } } })
}
type Wrapper = ReturnType<typeof mountCalendar>

/** Every block in the drawn week carrying `label`, counted off the RENDERED grid. */
function blocksSaying(wrapper: Wrapper, label: string): number {
  return wrapper.findAll('.cal-block').filter((b) => b.text() === label).length
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
// THE FIXTURE
// =================================================================================================
describe('round 28 - the fixture is the week these three items are about', () => {
  it('draws an ORDINARY training week, with two free days in it', () => {
    const week = calendarWeekFor(base(), AT + 1)
    expect(week.title, 'the fixture week is not the ordinary branch any more').toBe('Training week')
    expect(week.planDays.flatMap((r, d) => (r === 'rest' ? [d] : []))).toEqual(FREE_DAYS)
    // ...and nobody is hired and nothing is signed, so every count below starts from zero.
    expect(week.masseurDays).toEqual([])
    expect(week.shoot).toBeNull()
  })
})

// =================================================================================================
// #1 – THE MASSEUR IS IN THE SCHEDULE, AND THE TIER IS WHAT DECIDES HOW OFTEN
// =================================================================================================
describe('round 28 #1 - the masseur\'s sessions are in the week', () => {
  // ⚠ MUTATION: make `masseurDaysFor` ignore its `sessions` argument (return every day, or a fixed
  // two) and the two rungs stop differing – the first two assertions go red together.
  it('a hired masseur draws his sessions, and a second tier draws a different number', () => {
    const cheap = ECONOMY.masseur.rungs[0].sessions
    const daily = ECONOMY.masseur.rungs[2].sessions
    expect(cheap, 'the dial has stopped being a dial').not.toBe(daily)

    const low = mountCalendar(withMasseur(base(), cheap))
    const lowCount = blocksSaying(low, 'Body work')
    low.unmount()

    setActivePinia(createPinia())
    const high = mountCalendar(withMasseur(base(), daily))
    const highCount = blocksSaying(high, 'Body work')
    high.unmount()

    // The claim, in the owner's own terms: the sessions SHOWN follow the tier CHOSEN.
    expect(lowCount).toBe(cheap)
    expect(highCount).toBe(daily)
    expect(highCount).toBeGreaterThan(lowCount)
  })

  it('...and the middle rung lands between them, so the two above are not a two-value coincidence', () => {
    const mid = ECONOMY.masseur.rungs[1].sessions
    const wrapper = mountCalendar(withMasseur(base(), mid))
    expect(blocksSaying(wrapper, 'Body work')).toBe(mid)
    wrapper.unmount()
  })

  // ⚠ MUTATION: drop the `masseurHired` clause in `calendarWeekFor` and this goes red on the first
  // line. It is the half that stops the fix from being decoration painted on every career.
  it('nobody hired, nothing drawn - the week is exactly as it was', () => {
    const wrapper = mountCalendar(base())
    expect(blocksSaying(wrapper, 'Body work')).toBe(0)
    wrapper.unmount()
  })

  it('the hours he takes are real hours: nothing overlaps anything else in the day', () => {
    // The rule `addMasseurTable` claims for itself, checked on the RENDERED week rather than on the
    // table it was written against - the block is placed against whatever survived the composition
    // rules, so this is the only place the claim can honestly be made.
    const week = calendarWeekFor(withMasseur(base(), ECONOMY.masseur.rungs[2].sessions), AT + 1)
    expect(week.masseurDays.length).toBe(ECONOMY.masseur.rungs[2].sessions)
    const wrapper = mountCalendar(withMasseur(base(), ECONOMY.masseur.rungs[2].sessions))
    for (const column of wrapper.findAll('.cal-col')) {
      const tops = column.findAll('.cal-block').map((b) => ({
        top: parseFloat(b.attributes('style')?.match(/top:\s*([\d.]+)%/)?.[1] ?? '0'),
        height: parseFloat(b.attributes('style')?.match(/height:\s*([\d.]+)%/)?.[1] ?? '0'),
        label: b.text(),
      }))
      tops.sort((a, b) => a.top - b.top)
      for (let i = 1; i < tops.length; i++) {
        expect(
          tops[i].top,
          `"${tops[i].label}" starts inside "${tops[i - 1].label}"`,
        ).toBeGreaterThanOrEqual(tops[i - 1].top + tops[i - 1].height - 0.01)
      }
    }
    wrapper.unmount()
  })
})

// =================================================================================================
// #6 – THE BUTTON SAYS IT, AND THE WEEK COMBINES
// =================================================================================================
describe('round 28 #6 - the button before a shoot week names it', () => {
  // ⚠ MUTATION: delete the `adShoots` branch in `useWeekAhead` and the label falls back to
  // "Training week" - this goes red and the training-week control below stays green, so no single
  // mutation satisfies both.
  it('the week button reads `Shooting week`', () => {
    const wrapper = mountCalendar(shootingNext())
    expect(wrapper.find('.cal-go-btn').text()).toBe('Shooting week')
    wrapper.unmount()
  })

  it('...and an ordinary week still reads `Training week`, so the label tracks the data', () => {
    const wrapper = mountCalendar(base())
    expect(wrapper.find('.cal-go-btn').text()).toBe('Training week')
    wrapper.unmount()
  })

  it('the week the button lands on is titled the same thing', () => {
    // One week, one phrase. A press that says "Shooting week" and a page that says "Training week"
    // would be the two surfaces this repo keeps having to reconcile, on the same screen this time.
    //
    // ⚠ THE EYEBROW SPECIFICALLY, not `wrapper.text()`. The button is on the same page, so a text
    // search would be satisfied by the assertion one test up and this one would prove nothing.
    const shooting = mountCalendar(shootingNext())
    expect(shooting.find('.cal-week-head .tb-eyebrow').text()).toBe('Shooting week')
    shooting.unmount()

    setActivePinia(createPinia())
    const plain = mountCalendar(base())
    expect(plain.find('.cal-week-head .tb-eyebrow').text()).toBe('Training week')
    plain.unmount()
  })
})

describe('round 28 #6 - the shoot week carries BOTH training days and shoot slots', () => {
  // ⚠ MUTATION: make `shootDaysFor` return every index and the training assertion goes red (the
  // shoot has eaten the week); make it return [] and the shoot assertion goes red.
  it('the drawn week has training blocks AND shoot blocks in it', () => {
    const wrapper = mountCalendar(shootingNext())
    const shootDays = wrapper.findAll('.cal-col').filter((c) => c.text().includes('Shoot'))
    const trainingDays = wrapper
      .findAll('.cal-col')
      .filter((c) => c.text().includes('Tennis') || c.text().includes('drills') || c.text().includes('Gym'))
    expect(shootDays.length, 'no day of the shoot week is at the shoot').toBeGreaterThan(0)
    expect(trainingDays.length, 'the shoot ate the training week').toBeGreaterThan(0)
    // ...and the two sets are different days: a column cannot be both.
    expect(shootDays.length + trainingDays.length).toBeLessThanOrEqual(7)
    wrapper.unmount()
  })

  it('the shoot takes the plan\'s FREE days and leaves every session standing', () => {
    // The rule stated exactly, because "some of each" is satisfiable by an accident. The engine
    // charges a shoot week by forfeiting the REST (`accrueCondition` pays the travel figure), so the
    // days that change are exactly the days the plan left free – and her session count does not move.
    const plain = calendarWeekFor(base(), AT + 1)
    const shooting = calendarWeekFor(shootingNext(), AT + 1)
    expect(shooting.shoot).not.toBeNull()
    expect(shooting.shoot!.days).toEqual(FREE_DAYS)
    expect(shooting.shoot!.brand).toBe(BRAND)
    expect(shooting.sessions, 'the shoot took a session off her').toBe(plain.sessions)
    expect(
      shooting.days.filter((d) => d.kind === 'shoot').map((d) => d.index),
      'the shoot landed on a day the plan had bought',
    ).toEqual(FREE_DAYS)
    for (const day of shooting.days) {
      if (FREE_DAYS.includes(day.index)) continue
      expect(day.kind, `day ${day.index} lost its plan to the shoot`).toBe(plain.days[day.index].kind)
    }
  })

  it('the read-out under the grid names the brand as well as the plan', () => {
    const wrapper = mountCalendar(shootingNext())
    const readout = wrapper.find('.cal-readout').text()
    expect(readout, 'the shoot replaced the plan sentence instead of adding to it').toContain('sessions')
    expect(readout).toContain(BRAND)
    wrapper.unmount()
  })
})

// =================================================================================================
// #4 – THE PLATE IN THE SEASON CALENDAR
// =================================================================================================
describe('round 28 #4 - a shoot week is marked in the season feed', () => {
  // ⚠ MUTATION: drop the `shoot` field from `calendarRows` (or the chip from the template) and the
  // first assertion goes red; make the chip unconditional and the second does.
  it('a shoot week renders its mark, and a training week does not', () => {
    const shooting = mountSeason(shootingNext())
    expect(shooting.findAll('.shoot-chip').length, 'no mark on a shoot week').toBeGreaterThan(0)
    shooting.unmount()

    setActivePinia(createPinia())
    const plain = mountSeason(base())
    expect(plain.findAll('.shoot-chip').length, 'every week is wearing the shoot mark').toBe(0)
    plain.unmount()
  })

  it('...and it marks exactly the weeks the letter named, not one more', () => {
    // The feed draws `UPCOMING_WEEKS` rows; two named weeks inside that horizon must produce two
    // marks. A chip that appeared on the whole feed would satisfy the test above and fail this one.
    const two = { ...base(), adShoots: [{ brand: BRAND, weeks: [AT + 1, AT + 3] }] }
    const wrapper = mountSeason(two)
    expect(wrapper.findAll('.shoot-chip').length).toBe(2)
    wrapper.unmount()
  })

  it('a shoot week with nothing else on it says so in words too', () => {
    const wrapper = mountSeason(shootingNext())
    expect(wrapper.text()).toContain('Shooting week')
    wrapper.unmount()
  })
})

// =================================================================================================
// WHERE #1 AND #6 MEET – and the engine settles it
// =================================================================================================
//
// ⚠⚠ RE-AIMED AT ROUND 29 #3, AND THE CLAIM IS NOW ITS OWN OPPOSITE – NOT DELETED, REVERSED, because
// the sentence it was built on was FALSE and this block is the only place that ever checked it.
//
// What it asserted: "a shoot week buys no table, because the engine does not pay for one." The
// second half was never true. `resolveMasseur` bills the salary through `masseurWorksThisWeek`,
// whose three stand-downs are hired / college / a booked family week – a shoot is not one of them.
// So the engine DID pay for one, on every shoot week of every career, and this block was pinning a
// calendar that drew none of it: «вы заплатили и не можете этого заметить», the exact failure the
// travelling-team plan bans specialists for. The owner found it from first principles while reading
// an answer built on the same wrong sentence – «Если есть турнир или тренировки, то есть и
// массажист» (docs/rounds/round-29.md #3).
//
// ⚠ WHAT THE OLD BLOCK QUOTED IS STILL TRUE AND IS A DIFFERENT SENTENCE. `accrueCondition`'s
// «lights and flights, not his table» is about the CONDITION SUM – a shoot week recovers at the
// travel figure and the masseur's condition term comes off it – and that arithmetic is deliberately
// UNTOUCHED by round 29. What moved is the drawing, which now matches the BILL.
describe('round 28 #1 x #6, re-aimed at round 29 #3 - a shoot week draws his table, because the engine bills for one', () => {
  // ⚠ MUTATION: put `&& !shooting` back into the masseur predicate in `calendarWeekFor` (the shipped
  // defect) and the first assertion goes red while every other block in the file stays green.
  it('a masseur at the top rung draws all of his sessions on a shoot week', () => {
    const daily = ECONOMY.masseur.rungs[2].sessions
    const wrapper = mountCalendar(withMasseur(shootingNext(), daily))
    expect(blocksSaying(wrapper, 'Body work')).toBe(daily)
    wrapper.unmount()
  })

  it('...and the same rung draws exactly as many on the week before, so the shoot changed nothing', () => {
    // The control, kept from the original block and re-pointed: it used to prove that "0" was not
    // "he never draws at all"; it now proves the shoot week's count is not an accident of the
    // fixture. Same career, same rung, a week the letter did not name.
    const daily = ECONOMY.masseur.rungs[2].sessions
    const elsewhere = { ...base(), adShoots: [{ brand: BRAND, weeks: [AT + 4] }] }
    const wrapper = mountCalendar(withMasseur(elsewhere, daily))
    expect(blocksSaying(wrapper, 'Body work')).toBe(daily)
    wrapper.unmount()
  })

  it('⚠ and the negative it USED to be still exists – on a week the engine really does stand him down', () => {
    // The block's original shape survives, pointed at a stand-down the ENGINE holds: a booked family
    // week. Without this, "he always draws" would satisfy both tests above.
    const daily = ECONOMY.masseur.rungs[2].sessions
    const booked: Snapshot = {
      ...shootingNext(),
      vacations: [{ week: AT + 1, packageId: ECONOMY.vacation.packages[0].id, paidCents: 0 }],
    }
    const wrapper = mountCalendar(withMasseur(booked, daily))
    expect(blocksSaying(wrapper, 'Body work')).toBe(0)
    wrapper.unmount()
  })
})
