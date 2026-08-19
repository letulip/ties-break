// HER WEEK, MOUNTED – docs/specs/training-dials.md §9, the screen half of the v47 wave.
//
// ⚠ WHY EVERY CLAIM HERE IS A MOUNT AND NOT A SOURCE PIN. This tab is nothing BUT rendered state:
// which boxes are ticked, which are disabled and why, what the hours on each title line add up to,
// and what a press dispatches. A pin asserting that the file contains `PLAN_MAX_SESSIONS` would
// restate the diff and prove nothing about any of the four. The store's command is stubbed where a
// test needs to see one dispatched (no worker is spawned - src/worker/client.ts creates one lazily,
// so a pre-filled store touches nothing), and the snapshot is a real career through the real engine.
//
// ⚠ MUTATION-VERIFIED – eight mutations, each one watched failing before the test was believed, and
// each one named with the test it turned red and the tests it did NOT:
//   1. the `capacity` arm dropped from `locked()` -> "one session a day" AND "a locked box
//      dispatches nothing" go red, and the two volume tests stay green.
//   2. the `PLAN_MAX_SESSIONS` arm dropped -> the six-session test goes red ALONE.
//   3. the `PLAN_MIN_SESSIONS` arm dropped -> the four-session test goes red ALONE.
//      Three arms, three tests, because one test covering all three would pass on two of the bugs.
//   4. `planFromWeek(next)` swapped for `{ ...plan, week: next }` -> the projection test goes red:
//      the command's pair stops tracking its own matrix.
//   5. `perKind` pinned to a constant -> the hours test goes red while everything else passes.
//   6. the `dots` loop bound to 1 instead of `capacity` -> the school-free test goes red.
//   7. `activePreset` reading `plan.train` instead of comparing the matrix -> red on the HAND-BUILT
//      week only, which is the case that motivated it.
//   8. the market screen defaulted to the `coaches` tab -> both tab tests go red.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HerWeekTab from '../../src/components/HerWeekTab.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { calendarWeekFor } from '../../src/composables/weekDays'
import { useGameStore } from '../../src/stores/game'
import {
  PLAN_MAX_SESSIONS,
  PLAN_MIN_SESSIONS,
  planSessions,
  planTrainPct,
} from '../../src/engine/plan'
import {
  DEFAULT_PROFILE,
  SESSION_KINDS,
  type SessionKind,
  type Snapshot,
  type WeekPlan,
} from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

/** A real career through the real protocol, so nothing here is a hand-written shape that can drift
 *  from `Snapshot`. Same fixture discipline as season-screen.test.ts. */
const snapshotAfter = (weeks = 12, seed = 'dials-screen', coachTier = DEFAULT_PROFILE.coachTier): Snapshot =>
  careerSnapshot(weeks, seed, { ...DEFAULT_PROFILE, coachTier })

/** The tab, mounted over a snapshot poked into the shape a test is about. `setPlan` is stubbed: the
 *  worker is not running, and what these tests want to see is the COMMAND, not a round trip.
 *
 *  ⚠ AND THE CAREER IS SELF-COACHED, since round-18 #4. Every claim in this file is about the LIVE
 *  panel - which box is disabled and why, what a press dispatches - and the live panel is now the
 *  self-coached one: with a coach hired the whole grid is his and nothing in it can be pressed. The
 *  fixture moved rather than the claims, because none of these limits changed; the lock is a
 *  separate rule with its own file (tests/component/round18-self-coaching.test.ts). */
function mountTab(over: Partial<Snapshot> = {}) {
  const store = useGameStore()
  store.snapshot = { ...snapshotAfter(12, 'dials-screen', 'self'), ...over }
  // Typed with the argument it receives, so `mock.calls[0][0]` is a `WeekPlan` rather than `never` –
  // and so a command that stopped carrying a week would be a TYPE error here as well as a red test.
  const setPlan = vi.fn(async (_plan: WeekPlan) => {})
  store.setPlan = setPlan as unknown as typeof store.setPlan
  const wrapper = mount(HerWeekTab, { global: { stubs: { teleport: true } } })
  return { wrapper, store, setPlan }
}

function plan(week: SessionKind[][]): WeekPlan {
  return { train: planTrainPct(planSessions(week)), rest: 100 - planTrainPct(planSessions(week)), week }
}

/** Five general sessions in the standard shape – what a migrated career reads back as. */
const FIVE_GENERAL: SessionKind[][] = [
  ['general'], ['general'], [], ['general'], ['general'], ['general'], [],
]

/** The boxes of one block, in day order. */
function boxes(wrapper: ReturnType<typeof mountTab>['wrapper'], kind: SessionKind) {
  const index = SESSION_KINDS.indexOf(kind)
  return wrapper.findAll('.hw-row')[index].findAll('input[type="checkbox"]')
}

describe('the layout the owner asked for: a line, and seven boxes under it', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is five blocks of seven boxes – one per kind, one per weekday', () => {
    const { wrapper } = mountTab({ plan: plan(FIVE_GENERAL) })
    const rows = wrapper.findAll('.hw-row')
    expect(rows.length, 'one block per kind of session').toBe(SESSION_KINDS.length)
    for (const row of rows) {
      expect(row.findAll('input[type="checkbox"]').length, 'seven days').toBe(7)
    }
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(35)
    wrapper.unmount()
  })

  it('⚠ REST IS THE ABSENCE OF A TICK – there is no sixth block and no control for it', () => {
    const { wrapper } = mountTab({ plan: plan(FIVE_GENERAL) })
    const names = wrapper.findAll('.hw-block-name').map((n) => n.text())
    expect(names.length).toBe(5)
    for (const n of names) expect(n.toLowerCase()).not.toContain('rest')
    // ...and the two untouched days really are days off, which is the other half of the claim.
    expect(wrapper.find('.hw-readout').text()).toContain('2 days off')
    wrapper.unmount()
  })

  it('every box says which session on which day, so nothing in a column has to be legible', () => {
    const { wrapper } = mountTab({ plan: plan(FIVE_GENERAL) })
    const names = wrapper.findAll('input[type="checkbox"]').map((b) => b.attributes('aria-label'))
    expect(new Set(names).size, 'thirty-five distinct controls').toBe(35)
    expect(names).toContain('Serve & return on Monday')
    expect(names).toContain('Fitness on Sunday')
    wrapper.unmount()
  })

  it('⚠ NO `data-testid` ANYWHERE – this repo has none and the policy is what files defects', () => {
    const file = readFileSync(resolve(__dirname, '../../src/components/HerWeekTab.vue'), 'utf8')
    expect(file).not.toContain('data-testid')
    // ...and the player-copy rules, on the one template this wave adds.
    const template = file.slice(file.indexOf('<template>'), file.lastIndexOf('</template>'))
    expect(template).not.toContain('—')
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
  })
})

describe('what a session costs in time, which he asked for by name', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('each block spends its own hours on its own title line', () => {
    const week: SessionKind[][] = [['general'], ['serve'], [], ['serve'], ['fitness'], ['general'], []]
    const { wrapper } = mountTab({ plan: plan(week) })
    const hours = wrapper.findAll('.hw-block-hours').map((n) => n.text())
    // SESSION_KINDS order: general, serve, rally, fitness, matchplay.
    expect(hours).toEqual(['2 h', '2 h', '0 h', '1 h', '0 h'])
    wrapper.unmount()
  })

  it('the read-out says the sessions, the hours, the days off and what the week costs', () => {
    const { wrapper, store } = mountTab({ plan: plan(FIVE_GENERAL) })
    const text = wrapper.find('.hw-readout').text()
    expect(text).toContain('5 sessions, 5 hours')
    expect(text).toContain('2 days off')
    // The price is the ENGINE's, so this asserts the number the snapshot carries rather than a
    // format - a screen doing its own bill arithmetic is the thing this assertion exists against.
    expect(store.snapshot!.coachBilling.weeklyCents).toBeGreaterThan(0)
    expect(text).toMatch(/\$[\d,]+ this week\./)
    wrapper.unmount()
  })
})

describe('the three limits, shown before he bumps into them', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('ONE SESSION A DAY AT SCHOOL: a day that is full disables every other kind on it', () => {
    const { wrapper } = mountTab({ plan: plan(FIVE_GENERAL), planDayCapacity: 1 })
    // Monday is taken by General, so Serve on Monday is not available...
    expect(boxes(wrapper, 'serve')[0].attributes('disabled')).toBeDefined()
    // ...and Wednesday, which is empty, is.
    expect(boxes(wrapper, 'serve')[2].attributes('disabled')).toBeUndefined()
    // The day heads say the same thing, in dots and in words.
    const heads = wrapper.findAll('.hw-head')
    expect(heads[0].attributes('aria-label')).toBe('Monday – 1 of 1 sessions')
    expect(heads[2].attributes('aria-label')).toBe('Wednesday – 0 of 1 sessions')
    expect(heads[0].findAll('.hw-dot').length).toBe(1)
    expect(wrapper.find('.hw-capacity').text()).toContain('One session a day')
    wrapper.unmount()
  })

  it('TWO WITHOUT SCHOOL: the day head grows a second slot and the full day opens up', () => {
    const { wrapper } = mountTab({ plan: plan(FIVE_GENERAL), planDayCapacity: 2 })
    expect(wrapper.findAll('.hw-head')[0].findAll('.hw-dot').length).toBe(2)
    expect(wrapper.findAll('.hw-head')[0].attributes('aria-label')).toBe('Monday – 1 of 2 sessions')
    // The SAME box that was disabled at capacity 1 is available now, which is the whole difference.
    expect(boxes(wrapper, 'serve')[0].attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.hw-capacity').text()).toContain('two sessions')
    wrapper.unmount()
  })

  it(`${PLAN_MAX_SESSIONS} IS HER MAXIMUM: at the top of the band nothing further can be ticked`, () => {
    const six: SessionKind[][] = [
      ['general'], ['general'], ['general'], ['general'], ['general'], ['general'], [],
    ]
    const { wrapper } = mountTab({ plan: plan(six), planDayCapacity: 2 })
    expect(planSessions(six)).toBe(PLAN_MAX_SESSIONS)
    // Sunday is free and the day has room, so only the VOLUME can be refusing it.
    expect(boxes(wrapper, 'serve')[6].attributes('disabled')).toBeDefined()
    // ...and a ticked box is still tickable OFF, or the week could never be changed again.
    expect(boxes(wrapper, 'general')[0].attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.hw-limit').text()).toContain('maximum')
    wrapper.unmount()
  })

  it(`${PLAN_MIN_SESSIONS} IS HER MINIMUM: at the bottom of the band nothing can be taken away`, () => {
    const four: SessionKind[][] = [['general'], ['general'], [], ['general'], ['general'], [], []]
    const { wrapper } = mountTab({ plan: plan(four) })
    expect(planSessions(four)).toBe(PLAN_MIN_SESSIONS)
    expect(boxes(wrapper, 'general')[0].attributes('disabled')).toBeDefined()
    // ...and adding is still open, which is the direction out of the corner.
    expect(boxes(wrapper, 'serve')[2].attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.hw-limit').text()).toContain('minimum')
    wrapper.unmount()
  })
})

describe('a tick is a command, and the engine is the only writer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('ticking a box dispatches the whole week, with train/rest DERIVED from it', async () => {
    const { wrapper, setPlan } = mountTab({ plan: plan(FIVE_GENERAL), planDayCapacity: 1 })
    await boxes(wrapper, 'fitness')[2].trigger('change')

    expect(setPlan).toHaveBeenCalledTimes(1)
    const sent = setPlan.mock.calls[0][0]
    expect(sent.week![2], 'the Wednesday he pressed').toEqual(['fitness'])
    expect(planSessions(sent.week!)).toBe(6)
    // ⚠ THE PAIR IS `planFromWeek`'s PROJECTION, not a copy of the old one. The worker ignores what
    // we send and derives its own, so a stale pair could never corrupt a career - but a command that
    // carries a pair contradicting its own matrix is a screen telling two stories about one week.
    expect(sent.train).toBe(planTrainPct(6))
    expect(sent.rest).toBe(100 - planTrainPct(6))
    wrapper.unmount()
  })

  it('unticking removes exactly the one session, and nothing else moves', async () => {
    const { wrapper, setPlan } = mountTab({ plan: plan(FIVE_GENERAL), planDayCapacity: 1 })
    await boxes(wrapper, 'general')[0].trigger('change')
    const sent = setPlan.mock.calls[0][0]
    expect(sent.week![0]).toEqual([])
    expect(sent.week!.slice(1)).toEqual(FIVE_GENERAL.slice(1))
    wrapper.unmount()
  })

  it('a locked box dispatches nothing at all – the refusal is local and silent', async () => {
    const { wrapper, setPlan } = mountTab({ plan: plan(FIVE_GENERAL), planDayCapacity: 1 })
    await boxes(wrapper, 'serve')[0].trigger('change')
    expect(setPlan).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('⚠ A WHOLE WEEK OF ONE THING IS LEGAL – «может вообще всю неделю из одного и того же собрать»', async () => {
    // Owner, and it is his right. Five serve sessions, built one tick at a time from four, is a week
    // the tab must let him assemble - there is no rule against it anywhere and there must be none here.
    const fourServe: SessionKind[][] = [['serve'], ['serve'], [], ['serve'], ['serve'], [], []]
    const { wrapper, setPlan } = mountTab({ plan: plan(fourServe), planDayCapacity: 1 })
    await boxes(wrapper, 'serve')[2].trigger('change')
    const sent = setPlan.mock.calls[0][0]
    expect(sent.week!.flat().every((k) => k === 'serve')).toBe(true)
    expect(planSessions(sent.week!)).toBe(5)
    wrapper.unmount()
  })

  it('the presets are a fast path, and one is selected only when the week IS its week', async () => {
    const { wrapper, setPlan } = mountTab({ plan: plan(FIVE_GENERAL), planDayCapacity: 1 })
    const pills = wrapper.findAll('.hw-presets .option-pill')
    expect(pills.map((p) => p.text())).toEqual(['Light', 'Balanced', 'Grind'])
    // The migrated five-general week IS Balanced's own arrangement.
    expect(pills[1].classes()).toContain('selected')
    await pills[2].trigger('click')
    expect(setPlan).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('...and a hand-built week that PROJECTS to a preset lights no pill', () => {
    // Five sessions arranged by hand project to the same 75/25 as Balanced (`planTrainPct`), so a
    // pill read off `plan.train` would light under a week the pill would not produce.
    const handBuilt: SessionKind[][] = [['serve'], [], ['rally'], ['general'], [], ['matchplay'], ['general']]
    const { wrapper } = mountTab({ plan: plan(handBuilt), planDayCapacity: 1 })
    expect(planSessions(handBuilt)).toBe(5)
    expect(wrapper.find('.hw-presets .option-pill.selected').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('the tab it lives on', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is `Her week` / `Coaches` on the app\'s own segmented row, and either pill reaches its half', async () => {
    const store = useGameStore()
    store.snapshot = snapshotAfter()
    const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })

    const pills = wrapper.findAll('.tb-seg .tab-pill')
    expect(pills.map((p) => p.text())).toEqual(['Her week', 'Coaches'])
    // ⚠ NOT `Self-coaching` / `Coaches` (§9a): one ladder, self on the bottom rung, and two tabs on
    // that axis would hide the one comparison this screen exists to make.
    expect(wrapper.text()).not.toContain('Self-coaching')

    // ⚠ THIS USED TO ASSERT "IT OPENS ON THE WEEK", AND ROUND-18 #3 DELIBERATELY CHANGED THAT: the
    // landing tab now follows `coachId`, because Home's coach note is a door into this screen and
    // sending a tap on his face to the training dials was the defect. `snapshotAfter()` is
    // `createWorld` on DEFAULT_PROFILE, whose `coachTier` is `middle`, so this fixture HAS a coach
    // and lands on the coaches. The landing rule itself is not this file's claim - it is pinned on
    // both branches in tests/component/round18-coach.test.ts; what stays here is the SWITCHER: two
    // correctly named pills, and each one reaching its own half.
    expect(wrapper.findAll('.cm-row').length).toBeGreaterThan(3)
    expect(wrapper.findAll('.hw-row').length).toBe(0)

    await pills[0].trigger('click')
    expect(wrapper.findAll('.hw-row').length).toBe(5)
    expect(wrapper.findAll('.cm-row').length).toBe(0)

    await pills[1].trigger('click')
    expect(wrapper.findAll('.cm-row').length).toBeGreaterThan(3)
    expect(wrapper.findAll('.hw-row').length).toBe(0)
    wrapper.unmount()
  })

  it('⚠ IS A SWITCHER AND NOT AN ACCORDION – nothing expands in place', async () => {
    const store = useGameStore()
    store.snapshot = snapshotAfter()
    const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
    // The two halves are never on the page together, which is what keeps the screen one viewport
    // tall - the longread he is avoiding. `<details>` is how an accordion would arrive.
    expect(wrapper.findAll('details').length).toBe(0)
    // ⚠ WRITTEN AS "EXACTLY ONE HALF IS DRAWN", NOT AS A ROW COUNT. The old form added the two up
    // and expected 5, which quietly assumed WHICH half had opened - so round-18 #3's landing rule
    // reddened a test about accordions. The claim was never about the number 5; it is that opening
    // one half closes the other, and it is now checked on both landings.
    const onlyOneHalf = () => {
      const week = wrapper.findAll('.hw-row').length
      const coaches = wrapper.findAll('.cm-row').length
      expect(Math.min(week, coaches), 'both halves are on the page at once').toBe(0)
      expect(Math.max(week, coaches), 'neither half is on the page').toBeGreaterThan(0)
    }
    onlyOneHalf()
    const pills = wrapper.findAll('.tb-seg .tab-pill')
    await pills[0].trigger('click')
    onlyOneHalf()
    await pills[1].trigger('click')
    onlyOneHalf()
    wrapper.unmount()
  })
})

// =================================================================================================
// ONE RULE, BOTH ENDS OF THE WEEK – the thing a source pin could not say
// =================================================================================================
// tests/calendar-screen.test.ts has pinned "the card imports the calendar's rule" since round 7,
// because the two once spread the same week differently and the calendar drew Sunday off on the way
// INTO a week while the story drew her on court that Sunday on the way out of it. That pin can only
// ever assert an IMPORT. The claim underneath it is that the two DRAW the same days - which was
// unfalsifiable while every plan that could exist was a preset, and is falsifiable now.
//
// ⚠ MUTATION-VERIFIED: `dayDots` put back to `sessionDays(sessionsForPlan(plan.value.train))` -> this
// goes red on the hand-built week and stays green on the preset, which is exactly the gap that made
// the old spelling look safe.
describe('the week story and the calendar draw the same days', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function dotsFor(snapshot: Snapshot): ('train' | 'rest')[] {
    useGameStore().snapshot = snapshot
    const wrapper = mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
    const dots = wrapper.findAll('.recap-dot').map((d) => (d.classes().includes('rest') ? 'rest' : 'train'))
    wrapper.unmount()
    return dots as ('train' | 'rest')[]
  }

  it('agrees on a HAND-BUILT week, which is the case the old spelling could not see', () => {
    // Sunday on, Monday off - the exact inversion of the preset arrangement, so a card still reading
    // the scalar would answer the calendar's week rather than his.
    const hand: SessionKind[][] = [[], ['serve'], ['general'], [], ['fitness'], ['general'], ['general']]
    const snapshot = { ...snapshotAfter(), plan: plan(hand) }
    const dots = dotsFor(snapshot)
    expect(dots.length).toBe(7)
    const week = calendarWeekFor({ ...snapshot, planDayCapacity: 1 }, snapshot.week + 1)
    expect(dots).toEqual(week.planDays.map((r) => (r === 'rest' ? 'rest' : 'train')))
    // ...and it is really his week, not the preset's: Monday off, Sunday on.
    expect(dots[0]).toBe('rest')
    expect(dots[6]).toBe('train')
  })

  it('...and still agrees on a legacy career, whose plan carries no matrix at all', () => {
    const snapshot = { ...snapshotAfter(), plan: { train: 75, rest: 25 } }
    const dots = dotsFor(snapshot)
    const week = calendarWeekFor({ ...snapshot, planDayCapacity: 1 }, snapshot.week + 1)
    expect(dots).toEqual(week.planDays.map((r) => (r === 'rest' ? 'rest' : 'train')))
    // The week the calendar has always drawn for that scalar: five on, Sunday and Wednesday off.
    expect(dots).toEqual(['train', 'train', 'rest', 'train', 'train', 'train', 'rest'])
  })
})
