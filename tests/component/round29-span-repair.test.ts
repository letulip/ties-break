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
// ⭐ AND THE FIRST-USE LINE SHIPPED WITH IT (part 3). Round 26 #1 was «Что за кнопка Next 4 weeks у
// меня появилась прямо под пальцем?» – the audit found that item produced a gate and never produced
// the sentence it actually asked for, so repairing the bugs without it would have shipped the
// complaint a third time.
//
// =================================================================================================
// ⚠⚠⚠ RE-AIMED BY ROUND 30 #3 – EVERY ARM BELOW IS KEPT AND NONE OF THEM MEANS WHAT IT MEANT
// =================================================================================================
//
// The owner played the repaired control and deleted it (30.08):
//
//   «Странная серая нечитаемая надпись над кнопками… Quiet stretch ahead… Идея хорошая, реализация
//    не очень. Нам в это время приходят письма и идёт запись на новые турниры – давай вообще эту
//    кнопку про 6 недель уберём. Её можно оставить только на длинные травмы и с обязательным
//    правилом "минус 1 день от длины окна" – иначе даже на турниры не записаться никак. Плохой
//    паттерн»
//
// TWO THINGS CHANGED AND THE FILE FOLLOWS BOTH:
//   * THE PILL IS LAYOFF-ONLY. `spanWorthOffering` has lost its `calendarClearAhead` arm, so the
//     six-week gap this file was built on no longer offers anything by itself. The fixture is now
//     the SAME six-week gap with a long layoff standing over it, which keeps every number in the
//     chain (six on the label, six on the press, six on the calendar, six on the card) and moves
//     only the reason the control is on offer at all.
//   * THE SPAN STOPS ONE WEEK SHORT OF THE WINDOW («минус 1 день от длины окна»), so a seven-week
//     layoff is what makes a six-week press possible. §4 is a new block asserting exactly that, and
//     it is the reason the fixture's layoff is seven and not six.
//   * §3's FIRST-USE LINE IS GONE, with the control it explained. The block is kept, INVERTED, and
//     it is the record: it now asserts the line is not on screen, on the same week that used to
//     carry it. ⚠ Deleting the block would have left nothing to notice a line that came back.
//
// ⚠ NOTHING HERE IS A WEAKENING. The chain assertion is the same chain; what moved is the premise.
//
// ⚠ MUTATION-VERIFIED (round 30 #3) – each applied to the shipped source, this file run, the source
// restored from a FILE COPY:
//   * `calendarClearAhead(week, calendar) ||` put back in front of `longLayoff` -> §4's DELETION arm,
//     and `round26-span-gate.test.ts`'s two walked arms.
//     ⚠⚠ IT DID NOT REDDEN AT FIRST, AND THAT IS WHY §4 NOW ASSERTS THE RULE AS WELL AS THE SCREEN.
//     `spanWeeksFor`'s own window guard also returns 0 off a layoff, so the pill stayed absent and
//     the case stayed green while the rule under it had moved. TWO rules, ONE visible effect: a case
//     that reads only the screen cannot say which of them it is testing.
//   * the `- 1` dropped from `weeksRemaining - 1`                -> §4's MINUS ONE arm, alone.
//   * a `<p class="span-hint">` put back into the shell          -> §3's first arm, alone.
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
  calendarClearAhead,
  createWorld,
  enterEvent,
  spanWeeksFor,
  spanWorthOffering,
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
 *  weeks with nothing of HERS in them, and an entered event is hers by `eventIsHers`.
 *
 *  ⚠⚠ ROUND 30 #3 PUT A LAYOFF OVER IT, AND THE FIXTURE IS NOW TWO FACTS INSTEAD OF ONE. A quiet
 *  calendar no longer offers a span at all – «давай вообще эту кнопку про 6 недель уберём» – so a
 *  gap alone would give this file no pill to test and every arm would pass vacuously on an absent
 *  control. The layoff is what makes the pill legal, and its length is what makes the press six:
 *  `spanWeeksFor` caps at `weeksRemaining - 1`, so SEVEN remaining buys six. ⚠ SEVEN AND NOT SIX,
 *  deliberately – a six-week layoff would buy five and the whole chain's number would move, hiding
 *  the «минус 1 день» rule inside a coincidence instead of testing it. §4 tests it head-on.
 *
 *  ⚠ THE LAYOFF OPENED LAST WEEK (`sinceWeek === world.week - 1`), because `advanceWeeks` stops on
 *  a layoff that opened THIS week (`injury.sinceWeek === world.week`) and a fixture that halted on
 *  its own first tick would prove nothing about a six-week press. */
const SIX = 6
/** «минус 1 день от длины окна»: the window that buys a press of `SIX`. */
const LAYOFF = SIX + 1
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
  world.injury = {
    kind: 'stress fracture',
    severity: 'major',
    weeksRemaining: LAYOFF,
    totalWeeks: LAYOFF,
    sinceWeek: world.week - 1,
  }
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
    expect(spanWeeksFor(world.week, snap.upcoming, snap.injury), 'the gap is not six weeks wide').toBe(SIX)
    expect(SIX, 'a six-week gap that equalled the old constant would prove nothing').not.toBe(MULTI_WEEK_SPAN)
    // The wrap falls INSIDE the span – three weeks in – which is the whole of complaint 2.
    expect((world.week + 3) % WEEKS_PER_YEAR, 'the year end is not inside this span').toBe(WRAP_OFFSET)
    // ⚠ ROUND 30 #3 – AND THE FIXTURE'S SECOND FACT, ASSERTED RATHER THAN ASSUMED. Without the
    // layoff there is no pill at all now, so an arm that quietly lost it would pass on an empty bar.
    expect(snap.injury?.weeksRemaining, 'the layoff that makes the pill legal').toBe(LAYOFF)
    expect(
      spanWeeksFor(world.week, [], null),
      'the gap on its own still offers a span – the layoff-only rule is not in force',
    ).toBe(0)
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
    // ⚠ ROUND 30 #3 – BOTH FIXTURES NOW CARRY A LAYOFF, because a quiet calendar alone offers no
    // pill and this arm would otherwise compare two empty strings and pass on nothing. The open
    // world's layoff is deliberately LONGER than the horizon (`weeksRemaining - 1 >= 8`) so the
    // number that comes out is still the SNAPSHOT's horizon and not the window – which is what makes
    // the two labels differ for the reason this arm is about.
    const open = createWorld('r29-6-open', { ...DEFAULT_PROFILE, coachTier: 'self' })
    open.season = []
    open.injury = {
      kind: 'stress fracture',
      severity: 'major',
      weeksRemaining: 20,
      totalWeeks: 20,
      sinceWeek: open.week - 1,
    }
    const { w: wOpen } = await openShell(open)
    const openLabel = wOpen.find('.span-weeks-btn').text()
    expect(openLabel, 'the open fixture offers no pill – the comparison below is vacuous').not.toBe('')
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
// 3 – THE FIRST-USE LINE IS GONE (round 30 #3), AND THIS BLOCK IS ITS RECORD
// =================================================================================================
//
// ⚠⚠ INVERTED, NOT DELETED. It used to assert three things about `.span-hint`: that it was there the
// first time the pill was, that it cleared on the press and stayed cleared on a fresh mount, and
// that it never rendered where the pill did not. The owner deleted the line – «Странная серая
// нечитаемая надпись над кнопками… Quiet stretch ahead… Идея хорошая, реализация не очень» – and it
// went with the control it explained, because that control is layoff-only now and «Quiet stretch
// ahead» would be a sentence about a week that offers nothing.
//
// ⚠ THE BLOCK STAYS BECAUSE A DELETED TEST NOTICES NOTHING. These arms are what would catch the
// sentence coming back on the next wave that reaches for a first-use line, and they carry the reason
// it went so the next reader does not re-derive it from the diff.
describe('round 30 #3 – the first-use line is gone, on the week that used to carry it', () => {
  it('⭐⭐ no `.span-hint` on the very week the pill is offered – the exact fixture that had one', async () => {
    const { world } = sixWeekGap('r30-3-hint-gone')
    const { w } = await openShell(world)
    expect(w.find('.span-weeks-btn').exists(), 'the pill is not on offer – this arm would be vacuous').toBe(true)
    expect(w.find('.span-hint').exists(), 'the line he called unreadable is back').toBe(false)
    // ⚠ AND NOT MERELY THE CLASS: the sentence itself is gone from the shell, so a rename could not
    // slip it past this arm.
    expect(w.text(), 'the sentence survived under another class').not.toContain('Quiet stretch ahead')
    w.unmount()
  })

  it('⚠ ...and pressing the pill still works without it – the mark it spent went with it', async () => {
    // The line cleared itself on the press (`markSpanHintUsed`, before the await). That call is gone
    // too, and this is the arm that proves its removal did not take the press with it.
    const { world, rng } = sixWeekGap('r30-3-hint-press')
    const { w, game } = await openShell(world)
    const advance = wireAdvance(game, world, rng)
    await w.find('.span-weeks-btn').trigger('click')
    await flushPromises()
    expect(advance, 'the press stopped working when the hint was removed').toHaveBeenCalledWith(SIX)
    expect(w.find('.span-hint').exists()).toBe(false)
    w.unmount()
  })

  it('⚠ and there is no pill at all on a busy week, which is unchanged', async () => {
    // A busy week: her entry is on the week ahead, so `multiOffered` is false and there is no pill.
    const world = createWorld('r29-6-hint-busy', DEFAULT_PROFILE)
    const event: SeasonEvent = { id: 'r29-6-busy', week: 1, tier: 'local', surface: 'hard', travelCostCents: 100_00, deadlineWeek: 0 }
    world.season = [event]
    enterEvent(world, event.id)
    const { w } = await openShell(world)
    expect(w.find('.span-weeks-btn').exists(), 'the fixture is not the busy week it claims to be').toBe(false)
    expect(w.find('.span-hint').exists()).toBe(false)
    w.unmount()
  })
})

// =================================================================================================
// 4 – ROUND 30 #3: THE PILL IS LAYOFF-ONLY, AND IT STOPS ONE WEEK SHORT OF THE WINDOW
// =================================================================================================
//
// «Её можно оставить только на длинные травмы и с обязательным правилом "минус 1 день от длины
// окна" – иначе даже на турниры не записаться никак. Плохой паттерн»
describe('round 30 #3 – the quiet stretch offers nothing, and a layoff stops one week short', () => {
  it('⭐⭐ THE DELETION: the same six-week gap with NO layoff offers no pill at all', async () => {
    const { world } = sixWeekGap('r30-3-no-layoff')
    world.injury = null
    const snap = toSnapshot(world)
    // ⚠⚠ THE RULE ITSELF, ASSERTED SEPARATELY FROM THE SCREEN, AND A MUTATION IS WHY. Putting
    // `calendarClearAhead(week, calendar) ||` back in front of `longLayoff` left the pill absent and
    // this case GREEN, because `spanWeeksFor`'s own window guard also returns 0 off a layoff – two
    // rules, one visible effect, and a case that reads only the screen cannot tell which one it is
    // testing. So his ruling is pinned where it is written, and the screen is pinned below it.
    expect(
      calendarClearAhead(world.week, snap.upcoming),
      'the fixture is not the quiet stretch it claims to be – nothing below means anything',
    ).toBe(true)
    expect(
      spanWorthOffering(world.week, snap.upcoming, snap.injury),
      'a clear calendar is a reason to offer a skip again – the deleted arm is back',
    ).toBe(false)

    const { w } = await openShell(world)
    expect(w.find('.next-week-bar').exists(), 'the week bar itself vanished – wrong failure').toBe(true)
    expect(w.find('.span-weeks-btn').exists(), 'the quiet stretch still offers a skip').toBe(false)
    w.unmount()
  })

  it('⭐⭐ THE MINUS ONE: a layoff of N buys N-1, so a week is always left to enter something in', () => {
    // ⚠ Read off the engine rather than the screen, at four window lengths, so the rule is a
    // FUNCTION and not one fixture's coincidence. The calendar is empty, so the only cap in play is
    // the window – which is exactly the arm the label test above cannot isolate.
    const world = createWorld('r30-3-minus-one', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.season = []
    for (const remaining of [5, 6, 7, 9]) {
      world.injury = {
        kind: 'stress fracture',
        severity: 'major',
        weeksRemaining: remaining,
        totalWeeks: remaining,
        sinceWeek: world.week - 1,
      }
      const snap = toSnapshot(world)
      expect(
        spanWeeksFor(world.week, snap.upcoming, snap.injury),
        `a ${remaining}-week layoff spent the whole window`,
      ).toBe(remaining - 1)
    }
  })

  it('⚠ ...and the last week of the window is genuinely still hers – the reason for the rule', () => {
    // «иначе даже на турниры не записаться никак». The press lands her INSIDE the layoff with one
    // week of it left, which is the week an entry list or a letter can still be answered in.
    const { world, rng } = sixWeekGap('r30-3-week-left')
    const from = world.week
    advanceWeeks(world, rng, SIX)
    expect(world.week, 'the press did not buy the whole span').toBe(from + SIX)
    expect(world.injury, 'the layoff was spent entirely – no week left inside it').not.toBeNull()
    expect(world.injury!.weeksRemaining, 'a week of the window survives the press').toBeGreaterThanOrEqual(1)
  })
})
