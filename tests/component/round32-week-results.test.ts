// =================================================================================================
// ⭐⭐ ROUND 32 #2 – THE RESULTS VIEW SHOWS RESULTS, AND THE TOURNAMENT WAITS ITS TURN
// =================================================================================================
//
// THE OWNER, 31.08: «на result of the week внизу под самими результатами висит кусок THIS WEEK где
// предстоящий турнир описан, как на экране самого турнира – надо турнир с result of the week всё-таки
// убрать». His words are also in docs/rounds/round-32.md item 2.
//
// ⚠⚠ THIS IS THE FOURTH PASS OVER THE SAME TWO BLOCKS AND THE COUNT IS THE FINDING, not the fix.
// Round 29 part two GREW the recap, round 30 #1 CUT it back, round 31 #1 MOVED the order on one
// arrival - and every one of those three changed more than the complaint in front of it asked for,
// which is why there was a fourth. So round 32 #2 is one expression and nothing else: the panel's
// `v-if` gains `&& (!showRecap || tournamentFirst)`. No copy moved, no spacing moved, no block
// changed place, and this file is written to fail if any of that stops being true.
//
// ⭐ WHAT THE SHAPE IS. Three states, and they are the three `describe`s below:
//   1. a STORY arrival with a story to tell  -> results, and no tournament plate;
//   2. the × that already dismisses the story -> and now the tournament is what is left;
//   3. a TOURNAMENT arrival (Home's plate)    -> the tournament, with the story below it, exactly
//      as round 31 #1 asked and byte for byte what `round31-week-entry.test.ts` still pins.
//
// ⚠ MUTATION-VERIFIED, EACH CLAIM AGAINST ITS OWN ARM (measured, not asserted):
//   * dropping the new `&& (!showRecap || tournamentFirst)` - the defect, rebuilt - reddens §1's
//     first arm and §2's ×, and leaves all of §3 green;
//   * narrowing it to `&& !showRecap` - i.e. forgetting round 31 #1 - reddens §3's order arm and
//     ONLY that one, with all of §1 and §2 green. Those two mutations fail apart, which is what
//     makes this a net rather than one claim written twice - and the second of them is the trade
//     rounds 30 #1 and 31 #1 were both spent undoing;
//   * hiding the recap instead of the panel (`WeekRecapCard v-if="showRecap && !tournamentFirst &&
//     !nearestEntered"`) reddens three arms, and the one that matters is §1's «the results are
//     still there»: it is the half of his complaint that must NOT be answered by removing the
//     other block.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { recapExists } from '../../src/composables/weekRecap'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/**
 * ONE career, walked by the real engine, with a real entry - `round31-week-entry.test.ts`'s own
 * fixture rule, and for its reason: every arm here is about TWO blocks, so a fixture missing either
 * of them would pass on nothing.
 *
 * ⚠ THE ENTRY IS SEVERAL WEEKS OUT ON PURPOSE. A tournament resolving on the tick sets `pending`,
 * `recapExists` answers false, and the story would be absent rather than showing - an arm that
 * cannot see the thing it is about. The fixture asserts that it is not in that state.
 */
function enteredCareer(seed: string): Snapshot {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12; i++) tickWeek(world, rng)
  const here = toSnapshot(world)
  const target = here.upcoming.find((e) => e.eligible && !e.entered && e.week >= here.week + 3)
  expect(target, 'the fixture must have something she may enter, and not this week').toBeTruthy()
  enterEvent(world, target!.id)
  const snap = toSnapshot(world)
  expect(recapExists(snap), 'the fixture must have a week story to tell').toBe(true)
  expect(snap.upcoming.some((e) => e.entered), 'and a tournament entered').toBe(true)
  return snap
}

/** WHAT IS ON THE PAGE, in document order - `round31-week-entry.test.ts`'s reader, kept identical so
 *  the two files cannot disagree about what they are looking at. `querySelectorAll` returns tree
 *  order, so one call answers «which blocks» and «in what order» together. */
function blockOrder(root: Element): string[] {
  return [...root.querySelectorAll('.recap-card, .next-tourn')].map((el) =>
    el.classList.contains('recap-card') ? 'story' : 'tournament',
  )
}

function screenOn(snap: Snapshot, entry?: 'story' | 'tournament'): VueWrapper {
  useGameStore().snapshot = snap
  return mount(ThisWeekScreen, {
    ...(entry ? { props: { entry } } : {}),
    attachTo: document.body,
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

// =================================================================================================
// §1 – HIS COMPLAINT: the results view, with nothing but the results on it
// =================================================================================================
describe('round 32 #2 §1 – the week results do not carry the tournament underneath', () => {
  it('⚠⚠ the defect itself: a story arrival with a recap shows NO tournament panel', () => {
    // ⚠ MUTATION: drop `&& (!showRecap || tournamentFirst)` from the panel's `v-if` and this reddens
    // on its own - it is the state he was looking at, rebuilt.
    const w = screenOn(enteredCareer('r32-results-only'))
    expect(blockOrder(w.element), 'results, and nothing else').toEqual(['story'])
    expect(w.find('.next-tourn').exists(), 'the tournament plate is off the results view').toBe(false)
    w.unmount()
  })

  it('⭐ ...and the results themselves are untouched, which is the half he did NOT complain about', () => {
    // ⚠ MUTATION: answer his complaint by hiding the RECAP instead of the panel and this reddens.
    // He asked for the tournament to come off the results view; a results view with no results on it
    // is the round-30 #1 trade all over again - one reading fixed by another going wrong.
    const w = screenOn(enteredCareer('r32-results-intact'))
    expect(w.find('.recap-card').exists(), "the week's story is the page").toBe(true)
    expect(w.find('.week-close').exists(), 'with the × still in its header').toBe(true)
    expect(w.find('.week-proceed-btn').exists(), 'and its way off the page still under it').toBe(true)
    w.unmount()
  })

  it('⚠ the rest of the screen is exactly what it was: the heading, the pill and the plan', () => {
    // ⚠ THE ANTI-SCOPE-CREEP ARM, and it is the reason this file exists as much as §1's first arm.
    // Three passes over these blocks each moved something nobody asked about. What comes off is the
    // PANEL; the section it lived in keeps its heading and the pill that names the entry, and the
    // training plan is still the last thing on the page (round 30 #6).
    const snap = enteredCareer('r32-nothing-else-moved')
    const entered = snap.upcoming.find((e) => e.entered)!
    const w = screenOn(snap)
    expect(w.text(), 'the section is still headed').toContain('This week')
    expect(w.text(), 'and the entry is still named on it').toContain(entered.label)
    expect(w.text(), 'and the plan is still on the page').toContain('Training plan')
    expect(w.text(), 'and this is not the no-event state').not.toContain('No event – training week')
    w.unmount()
  })

  it('⭐⭐ AND THE FRAME FOLLOWS THE PANEL, because `section.bare` says it does', () => {
    // ⚠ `section.bare` un-frames the block so the plate is the only object on the page - and its own
    // comment reads «ONLY WHEN THE PANEL IS THERE». When the panel learned to wait for the story,
    // that sentence and its binding parted company: the results view un-framed a section holding
    // nothing but a heading and a pill. This arm is why they cannot part again.
    // ⚠ MUTATION: bind the class back to `!!nearestEntered` and the first expectation reddens alone.
    const shown = screenOn(enteredCareer('r32-frame-story'))
    expect(shown.find('section.bare').exists(), 'no frame is dropped while the plate is away').toBe(false)
    shown.unmount()

    const first = screenOn(enteredCareer('r32-frame-tournament'), 'tournament')
    expect(first.find('section.bare').exists(), '...and it is dropped when the plate is there').toBe(true)
    first.unmount()
  })

  it('⚠ a week with nothing entered is untouched by this item', () => {
    // There is no panel to take off, so nothing about this state may move. Home's plate opens onto
    // it too (round 31 #1's own training-week arm).
    const world = createWorld('r32-training-week', DEFAULT_PROFILE)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 12; i++) tickWeek(world, rng)
    const snap = toSnapshot(world)
    snap.upcoming = snap.upcoming.map((e) => ({ ...e, entered: false }))
    const w = screenOn(snap)
    expect(w.find('.next-tourn').exists(), 'nothing is entered, so there is no panel either way').toBe(false)
    expect(w.text(), 'and the hint it always showed is still the hint').toContain('No event – training week')
    w.unmount()
  })
})

// =================================================================================================
// §2 – THE × THAT WAS ALREADY THERE IS THE DOOR: dismiss the story, and what is next is underneath
// =================================================================================================
describe('round 32 #2 §2 – dismissing the story reveals what is next', () => {
  it('⭐⭐ the × takes the results away and the tournament is what is left', async () => {
    // ⚠ NOTHING NEW WAS BUILT FOR THIS. The × has silenced one week since R9-18 and the panel simply
    // stops being suppressed when it does - which is what makes «the tournament is still reachable»
    // an existing control rather than a promise.
    const w = screenOn(enteredCareer('r32-dismiss-reveals'))
    expect(blockOrder(w.element), 'the results, alone').toEqual(['story'])

    await w.find('.week-close').trigger('click')
    await nextTick()

    expect(blockOrder(w.element), 'and now the tournament is what the screen is about').toEqual([
      'tournament',
    ])
    expect(w.find('.recap-card').exists(), 'the story is the thing that was dismissed').toBe(false)
    w.unmount()
  })

  it('⚠ the footer control does the same thing, because it is the same handler', async () => {
    // `dismissRecap` is bound to both the × and the Proceed pill (ThisWeekScreen's own «ONE HANDLER,
    // TWO CONTROLS»). An arm on one and not the other would pass while the other rotted.
    const w = screenOn(enteredCareer('r32-proceed-reveals'))
    await w.find('.week-proceed-btn').trigger('click')
    await nextTick()
    expect(blockOrder(w.element)).toEqual(['tournament'])
    w.unmount()
  })
})

// =================================================================================================
// §3 – ROUND 31 #1 IS INTACT: the arrival through Home's plate still opens on the tournament
// =================================================================================================
describe('round 32 #2 §3 – the tournament arrival keeps everything round 31 #1 gave it', () => {
  it('⭐⭐ `entry="tournament"` still shows the panel, with the story below it', () => {
    // ⚠ MUTATION: narrow the condition to `&& !showRecap` - forgetting round 31 #1 - and this
    // reddens while §1 and §2 stay green. That is the trade this round had to avoid making, and it
    // is the trade rounds 30 #1 and 31 #1 were both spent undoing.
    const w = screenOn(enteredCareer('r32-tournament-arrival'), 'tournament')
    expect(blockOrder(w.element), "his tap's own order, unchanged").toEqual(['tournament', 'story'])
    w.unmount()
  })

  it('⚠ ...and the story on that arrival is still whole, not a stub', () => {
    const w = screenOn(enteredCareer('r32-tournament-story-whole'), 'tournament')
    expect(w.find('.recap-card').exists(), 'the story is on the page').toBe(true)
    expect(w.find('.week-close').exists(), 'with its × in the header').toBe(true)
    expect(w.find('.week-proceed-btn').exists(), 'and its way off the page').toBe(true)
    w.unmount()
  })

  it('⚠ dismissing the story on THAT arrival leaves the tournament where it already was', async () => {
    // The × is the same control on both arrivals and it may not reorder the page it is on.
    const w = screenOn(enteredCareer('r32-tournament-dismiss'), 'tournament')
    await w.find('.week-close').trigger('click')
    await nextTick()
    expect(blockOrder(w.element), 'the panel does not move when the story goes').toEqual(['tournament'])
    w.unmount()
  })
})
