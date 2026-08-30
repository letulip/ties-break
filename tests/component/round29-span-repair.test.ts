// =================================================================================================
// ⭐⭐ ROUND 29 #6 – THE MULTI-WEEK SKIP TOLD THREE LIES IN ONE PRESS, AND THIS IS THE REPAIR
// =================================================================================================
//
// The owner, on the shipped control (his words are in docs/rounds/round-29.md, where they may be
// quoted in his own language): he had a six-week gap, pressed, was shown the end-of-year message and
// a card reporting two weeks, and the calendar had not moved. Three separate wrongnesses:
//
//   1. THE BUTTON OFFERED FOUR AGAINST A SLOT OF SIX. `MULTI_WEEK_SPAN` was written on the label and
//      passed to the press, so the number was a fact about the engine's historical step and never
//      about the week the button was standing on. Now `multiSpanOf` -> `spanWeeksFor`.
//   2. THE YEAR END TRUNCATED IT. `advanceWeeks` broke on 'season-end', so a press made at the tail
//      of a season – the longest quiet gap a career has, and therefore exactly where the pill
//      appears – bought the two or three weeks before the wrap and stopped. `SPAN_REPORTS_ONLY`.
//   3. AND THE CALENDAR "DID NOT MOVE" because 1 and 2 together left him a few weeks further into
//      the same dead stretch he had pressed from.
//
// ⚠⚠ THE ASSERTIONS BELOW ARE ONE CHAIN AND THAT IS THE POINT: the LABEL, the COMMAND, the WEEK the
// world lands on and the CARD all name one number. Every one of the owner's three complaints is a
// break in that chain, and a test that checked any single link would have shipped the other two.
//
// ⭐ AND THE FIRST-USE LINE SHIPS WITH IT (part 3). Round 26 #1 was «Что за кнопка Next 4 weeks у
// меня появилась прямо под пальцем?» – the audit found that item produced a gate and never produced
// the sentence it actually asked for, so repairing the bugs without it would ship the complaint a
// third time.
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30_000 })
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE REAL STYLESHEET – `.span-hint` is a global rule and an unstyled mount would measure nothing.
import '../../src/style.css'

// The shell imports the service-worker registration and the component project resolves no virtual
// module for it – the same mock r2-13-span-report installs, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import WeekSpanReport from '../../src/components/WeekSpanReport.vue'
import { useGameStore } from '../../src/stores/game'
import {
  MULTI_WEEK_SPAN,
  advanceWeeks,
  createWorld,
  enterEvent,
  spanWeeksFor,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

// ⚠ THIS RUNNER HAS NO localStorage AND THE FIRST-USE LINE IS A WATERMARK. Same shim as
// r2-13-span-report / round26-span-gate-ui – supply the browser's object, do not weaken the app.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** The wrap-up week's own offset, read off the engine rather than written down: `advanceWeeks` stops
 *  the season at `week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS`. */
const WRAP_OFFSET = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

/** THE OWNER'S OWN WEEK, BUILT: standing three weeks short of the wrap-up with a six-week gap in
 *  front of her, so the span STRADDLES the year end – which is where the tail of a season always
 *  puts a player, because the calendar has nothing in weeks 46-51 by construction.
 *
 *  The gap is closed at exactly six by an entry seven weeks out: `spanWeeksFor` counts consecutive
 *  weeks with nothing of HERS in them, and an entered event is hers by `eventIsHers`. Seven and not
 *  six because the pill's own gate (`calendarClearAhead`, the owner's 25.08 rule) asks about five
 *  weeks – an event at +6 would still leave the pill on offer, and this fixture wants the count
 *  tested, not the gate. */
const SIX = 6
function sixWeekGap(seed: string): { world: WorldState; rng: () => number } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = WRAP_OFFSET - 3
  const event: SeasonEvent = {
    id: `${seed}-local`,
    week: world.week + SIX + 1,
    tier: 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: world.week + SIX,
  }
  world.season = [event]
  enterEvent(world, event.id)
  return { world, rng: resumeMain(world.rngMain) }
}

async function openShell(world: WorldState) {
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  game.snapshot = toSnapshot(world)
  const w = mount(App, { global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

/** The store is the ONLY thing stubbed, and it is stubbed onto the REAL engine: the worker is not
 *  available here, so `advance` runs `advanceWeeks` in-process and republishes the snapshot – which
 *  is precisely what `sim.worker.ts`'s `advance` handler does. `r2-13-span-report.test.ts`'s idiom. */
function wireAdvance(game: ReturnType<typeof useGameStore>, world: WorldState, rng: () => number) {
  return vi.spyOn(game, 'advance').mockImplementation(async (weeks) => {
    advanceWeeks(world, rng, weeks)
    game.snapshot = toSnapshot(world)
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
})

// =================================================================================================
// 0 – THE FIXTURE IS THE OWNER'S WEEK
// =================================================================================================
describe('round 29 #6 – the fixture', () => {
  it('a six-week gap that straddles the year end, on a week the pill is offered', () => {
    const { world } = sixWeekGap('r29-6-fixture')
    const snap = toSnapshot(world)
    expect(spanWeeksFor(world.week, snap.upcoming), 'the gap is not six weeks wide').toBe(SIX)
    expect(SIX, 'a six-week gap that equalled the old constant would prove nothing').not.toBe(MULTI_WEEK_SPAN)
    // The wrap falls INSIDE the span – three weeks in – which is the whole of complaint 2.
    expect((world.week + 3) % WEEKS_PER_YEAR, 'the year end is not inside this span').toBe(WRAP_OFFSET)
  })
})

// =================================================================================================
// 1 – THE LABEL, THE PRESS, THE CALENDAR AND THE CARD ALL SAY SIX
// =================================================================================================
describe('round 29 #6 – one number, from the button to the report', () => {
  it('⭐⭐ THE CHAIN: the pill says six, the press buys six, the calendar moves six, the card says six', async () => {
    const { world, rng } = sixWeekGap('r29-6-chain')
    const { w, game } = await openShell(world)
    const from = world.week
    const advance = wireAdvance(game, world, rng)

    // ⚠ 1. THE LABEL. This is where the owner's complaint starts: he read four on a gap of six.
    const pill = w.find('.span-weeks-btn')
    expect(pill.exists(), 'the pill is not even on offer – nothing below would mean anything').toBe(true)
    expect(pill.text()).toBe(`Next ${SIX} weeks`)

    await pill.trigger('click')
    await flushPromises()

    // ⚠ 2. THE PRESS – the command carries the number the button printed, not the code's constant.
    expect(advance, 'the press bought a different number from the one on the button').toHaveBeenCalledWith(SIX)
    // ⚠ 3. THE CALENDAR – «а календарь так и остался на 51й неделе». It moves six, and it moves
    // ACROSS the year end into the new season rather than stopping short of it.
    expect(game.snapshot?.week, 'the calendar did not move the whole span').toBe(from + SIX)
    expect(world.week % WEEKS_PER_YEAR, 'the span stopped inside the old season').toBe((from + SIX) % WEEKS_PER_YEAR)
    expect(world.week, 'and it really crossed the wrap-up week').toBeGreaterThan(from + 3)

    // ⚠ 4. THE CARD – «странное окошко с отчётом о двух пройденных днях».
    const report = w.findComponent(WeekSpanReport)
    expect(report.exists(), 'the report is up').toBe(true)
    expect(report.text(), 'the card reports a number of its own').toContain(`${SIX} weeks passed`)
    w.unmount()
  })

  it('⚠ the year end is still REPORTED, so nothing about the season wrap was deleted', async () => {
    // The stop reason survives in its `STOP_PRECEDENCE` place (R11-1); only the break moved. Read
    // off the engine directly, because the shell's own recap dialog reads the SNAPSHOT and would
    // pass whether or not the reason was returned.
    const { world, rng } = sixWeekGap('r29-6-chain')
    const stops = advanceWeeks(world, rng, SIX)
    expect(world.week % WEEKS_PER_YEAR, 'this arm did not reach the wrap – it stopped for something else').toBe(0)
    expect(stops, 'the wrap-up stopped being reported at all').toContain('season-end')
  })
})

// =================================================================================================
// 2 – AND THE NUMBER IS NOT A NEW CONSTANT: A DIFFERENT WEEK OFFERS A DIFFERENT SPAN
// =================================================================================================
describe('round 29 #6 – the span is the week\'s, not the code\'s', () => {
  it('a wide-open calendar offers the snapshot horizon, and a six-week gap offers six', async () => {
    // Two fixtures that differ ONLY in what is on her calendar. One number that follows it is the
    // whole repair; two fixtures printing the same label would mean the constant simply moved.
    const open = createWorld('r29-6-open', { ...DEFAULT_PROFILE, coachTier: 'self' })
    open.season = []
    const { w: wOpen } = await openShell(open)
    const openLabel = wOpen.find('.span-weeks-btn').text()
    wOpen.unmount()

    setActivePinia(createPinia())
    backing.clear()
    const { world } = sixWeekGap('r29-6-narrow')
    const { w: wSix } = await openShell(world)
    const sixLabel = wSix.find('.span-weeks-btn').text()
    wSix.unmount()

    expect(sixLabel).toBe(`Next ${SIX} weeks`)
    expect(openLabel, 'both weeks print the same span, so nothing is reading the calendar').not.toBe(sixLabel)
  })
})

// =================================================================================================
// 3 – THE FIRST-USE LINE (round 26 #1's actual ask)
// =================================================================================================
describe('round 29 #6 – the control introduces itself, once', () => {
  it('⭐ the line is there the first time the pill is, beside it', async () => {
    const { world } = sixWeekGap('r29-6-hint-first')
    const { w } = await openShell(world)
    const hint = w.find('.span-hint')
    expect(hint.exists(), 'the control arrived without a word again').toBe(true)
    expect(hint.text().length, 'an empty line is not an introduction').toBeGreaterThan(20)
    // House law: no Cyrillic in a user-facing string, and the short dash only.
    expect(hint.text()).not.toMatch(/[Ѐ-ӿ]/)
    expect(hint.text()).not.toContain('—')
    w.unmount()
  })

  it('⭐⭐ ...and it is gone after the press, and stays gone on a fresh mount', async () => {
    const { world, rng } = sixWeekGap('r29-6-hint-once')
    const { w, game } = await openShell(world)
    wireAdvance(game, world, rng)
    expect(w.find('.span-hint').exists(), 'nothing to spend').toBe(true)

    await w.find('.span-weeks-btn').trigger('click')
    await flushPromises()
    expect(w.find('.span-hint').exists(), 'the line survived its own first use').toBe(false)
    w.unmount()

    // ⚠ THE SECOND HALF IS THE ONE A LOCAL `ref` WOULD FAIL: the mark is per career in localStorage,
    // so re-opening the app on another quiet week must not re-introduce a control already used.
    setActivePinia(createPinia())
    const { world: later } = sixWeekGap('r29-6-hint-once')
    const { w: again } = await openShell(later)
    expect(again.find('.span-weeks-btn').exists(), 'the pill is not offered – the check is vacuous').toBe(true)
    expect(again.find('.span-hint').exists(), 'the introduction came back').toBe(false)
    again.unmount()
  })

  it('⚠ it never renders where the control it explains does not', async () => {
    // A busy week: her entry is on the week ahead, so `multiOffered` is false and there is no pill.
    const world = createWorld('r29-6-hint-busy', DEFAULT_PROFILE)
    const event: SeasonEvent = { id: 'r29-6-busy', week: 1, tier: 'local', surface: 'hard', travelCostCents: 100_00, deadlineWeek: 0 }
    world.season = [event]
    enterEvent(world, event.id)
    const { w } = await openShell(world)
    expect(w.find('.span-weeks-btn').exists(), 'the fixture is not the busy week it claims to be').toBe(false)
    expect(w.find('.span-hint').exists(), 'a line explaining a button that is not there').toBe(false)
    w.unmount()
  })
})
