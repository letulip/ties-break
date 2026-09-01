// =================================================================================================
// ⭐⭐ ROUND 33 #1 – THE TOURNAMENT ARRIVAL IS A SCREEN, AND THIS FILE SAYS WHAT IS ON IT
// =================================================================================================
//
// THE OWNER, 01.09: «опять экран next tournament содержит next week – объясни мне пожалуйста, почему
// вообще получилось так, что эти два на одном экране постоянно оказываются? это разные экраны, нужны
// для разных вещей, мне кажется у них ничего общего нет. На экране family budget ведь нет ничего
// такого. На экране конца недели теперь нет информации о next tournament и это правильно.» His words
// are also in docs/rounds/round-33.md item 1.
//
// ⭐⭐ THE ANSWER TO HIS QUESTION IS STRUCTURAL, AND IT IS WHY FOUR ROUNDS FAILED TO LAND IT: THERE IS
// NO TOURNAMENT SCREEN. `src/components/screens/` holds ten screens and not one of them is one.
// Home's plate emits `navigate -> 'week:tournament'`; App.vue's `openWeek('tournament')` sets
// `tab = 'week'` and hands `ThisWeekScreen` an `entry` prop. The «next tournament screen» IS the
// This-week screen wearing a prop - so rounds 29, 30, 31 and 32 were each rearranging blocks INSIDE
// one screen while he was describing two, and none of them could give him what he asked for. His own
// comparison is the proof: the family budget has `MoneyScreen.vue` AND a door of its own.
//
// ⚠⚠ WHY THIS FILE ASSERTS A LIST AND NOT A HANDFUL OF `exists()` CALLS. This is the FIFTH pass over
// these blocks and every previous one drifted - round 29 grew the recap, round 30 cut it back, round
// 31 moved the order, round 32 took the panel off the other arrival. A test that says «the plan is
// not here» goes green again the moment somebody adds the status pill back; a test that says «the
// page is exactly these three things, in this order» cannot. `screenBlocks` below enumerates every
// block this screen can draw, so ANYTHING returning to the tournament arrival reddens §1, and
// anything leaving the week's arrival reddens §2.
//
// ⚠ MUTATION-VERIFIED, EACH CLAIM AGAINST ITS OWN ARM (measured, not asserted - see the round file):
//   * putting back the second `<WeekRecapCard v-if="showRecap && tournamentOnly" />` - round 31 #1's
//     shape - reddens §1's list and §1's story arm, and leaves every arm of §2 green;
//   * dropping `v-if="!tournamentOnly"` from the «This week» heading, from the status pill or from
//     the training-plan section reddens §1's list ALONE, one entry at a time, and nothing else;
//   * building the arrival by DISMISSING the story instead of by not rendering it (calling
//     `dismissRecap` on mount) leaves §1 entirely green and reddens §3's «not silenced» arm - which
//     is the whole reason that arm exists, since `dismissedRecapKey` is module scope and a dismissal
//     would cost the owner a week's story for good;
//   * removing the header's back control reddens §3's two navigation arms and §1's list;
//   * `entry` defaulting to `'tournament'` reddens all of §2.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, enterEvent, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { recapExists } from '../../src/composables/weekRecap'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage, AND `HomeScreen` READS IT AT SETUP - the shim and the argument
// are `round28-top-notices.test.ts`'s, quoted there in full. The test supplies the browser's object;
// it does not weaken the code.
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

/**
 * ONE career, walked by the real engine, with something really ENTERED and a week story to tell -
 * `round31-week-entry.test.ts`'s fixture rule and its reason: every arm here is about which blocks
 * are on a page, so a fixture missing one of them would pass on nothing.
 *
 * ⚠ THE ENTRY IS SEVERAL WEEKS OUT ON PURPOSE. A tournament resolving on the tick sets `pending`,
 * `recapExists` answers false, and the story would be absent rather than moved - an arm that cannot
 * see the thing it is about. The fixture asserts it is not in that state.
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

/**
 * ⭐⭐ WHAT IS ON THE PAGE - EVERY BLOCK THE SCREEN CAN DRAW, NAMED, IN DOCUMENT ORDER.
 *
 * The selector list is the point: it covers the header's three slots, both of the screen's own
 * sections part by part, the story, the panel and the footer. `querySelectorAll` returns tree order,
 * so one call answers «which blocks» and «in what order» together - and an equality against the whole
 * list fails when something is ADDED as loudly as when something is missing. Four previous rounds
 * each put something back on this screen that nobody had asked for; this is the reader that notices.
 */
const BLOCKS: [selector: string, name: string][] = [
  ['.back-link', 'back to Home'],
  ['.week-topbar-line', 'date line'],
  ['.week-close', "the story's close"],
  ['.recap-card', 'the story'],
  ['.next-tourn', 'the tournament'],
  ['.this-week-status', "the week's status"],
  ['.option-row', 'the plan presets'],
  ['.this-week-plan', 'the plan line'],
  ['.spend-row', 'the planned spend'],
  ['.week-proceed-btn', 'Proceed to Home'],
]

function screenBlocks(root: Element): string[] {
  const selector = [...BLOCKS.map(([s]) => s), 'section > h2'].join(', ')
  return [...root.querySelectorAll(selector)].map((el) => {
    const hit = BLOCKS.find(([s]) => el.matches(s))
    return hit ? hit[1] : `heading "${el.textContent?.trim()}"`
  })
}

function screenOn(snap: Snapshot, entry?: 'story' | 'tournament'): VueWrapper {
  useGameStore().snapshot = snap
  return mount(ThisWeekScreen, {
    ...(entry ? { props: { entry } } : {}),
    attachTo: document.body,
  })
}

/** The shell, past the splash, sitting on Home - `round31-week-entry.test.ts`'s helper and its
 *  argument: `game.init()` reaches for a Web Worker this runner has not got, so the store is filled
 *  AFTER the mount has settled into `recovery` and then declared ready. */
async function mountShell(snapshot: Snapshot): Promise<VueWrapper> {
  const store = useGameStore()
  const wrapper = mount(App, { global: { stubs: { teleport: true } } })
  await flushPromises()
  store.snapshot = snapshot
  store.ready = true
  store.phase = 'ready'
  await nextTick()
  wrapper.findComponent(SplashScreen).vm.$emit('done')
  await nextTick()
  return wrapper
}

function weekScreenOf(wrapper: VueWrapper): Element {
  const screen = wrapper.findComponent(ThisWeekScreen)
  expect(screen.exists(), 'the This-week screen must be the one on show').toBe(true)
  return screen.element
}

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
})

// =================================================================================================
// §1 – HIS COMPLAINT: the screen his plate opens is the tournament, and nothing else
// =================================================================================================
describe('round 33 #1 §1 – the tournament arrival carries no part of the week', () => {
  it('⭐⭐ the whole page, as a list: the way back, the date line, the tournament', () => {
    // ⚠ THE LIST IS THE ASSERTION. Anything added back - the heading, the pill, the plan, the story -
    // appears here and reddens, which is the property four previous passes over this screen did not
    // have. The three entries are exactly what round 33 decided the arrival keeps: the header with
    // its date line, the way off the page, and the thing the plate is a door to.
    const w = screenOn(enteredCareer('r33-tournament-page'), 'tournament')
    expect(screenBlocks(w.element)).toEqual(['back to Home', 'date line', 'the tournament'])
    w.unmount()
  })

  it('⭐⭐ ...and it is really his tap that produces it, through the shell he is playing', async () => {
    // The prop above is the mechanism; this is the journey. Home's plate is a real `<button>`
    // (`Card as="button"`), reached the way his thumb reaches it.
    const wrapper = await mountShell(enteredCareer('r33-plate-tap'))
    const plate = wrapper.find('[data-tour="next-tournament"]')
    expect(plate.exists(), "Home's next-tournament plate must be on screen").toBe(true)
    await plate.trigger('click')
    await nextTick()

    expect(screenBlocks(weekScreenOf(wrapper)), 'the tournament, and no week around it').toEqual([
      'back to Home',
      'date line',
      'the tournament',
    ])
    wrapper.unmount()
  })

  it('⚠ the frame is still off it, which is round 30 #6 and is unchanged', () => {
    // `section.bare` - «the cards themselves are the only objects on the page» - now says something
    // literally true: the plate IS the only object on the page. The section survives as the panel's
    // host precisely so this rule, and round 32 #2's re-binding of it, keep their meaning.
    const w = screenOn(enteredCareer('r33-frame'), 'tournament')
    const section = w.find('.next-tourn').element.closest('section')!
    expect(section.classList.contains('bare'), 'the panel is unframed as it was').toBe(true)
    w.unmount()
  })
})

// =================================================================================================
// §2 – THE OTHER SCREEN, UNTOUCHED: the week keeps every part of itself
// =================================================================================================
describe('round 33 #1 §2 – the week\'s own arrival is exactly what it was', () => {
  it('⭐⭐ the whole page, as a list: the story, the week, the plan', () => {
    // ⚠ THE MIRROR OF §1, AND THE ARM THAT STOPS THIS ITEM BECOMING A DELETION. Round 32 #2's shape
    // is in this list entry for entry: the results view shows results and no tournament plate
    // («на экране конца недели теперь нет информации о next tournament и это правильно»), the story's
    // × is in the header, the section keeps its heading and its pill, and the training plan is still
    // the last thing on the page (round 30 #6).
    const w = screenOn(enteredCareer('r33-week-page'))
    expect(screenBlocks(w.element)).toEqual([
      'date line',
      "the story's close",
      'the story',
      'heading "This week"',
      "the week's status",
      'heading "Training plan"',
      'the plan presets',
      'the plan line',
      'the planned spend',
      'Proceed to Home',
    ])
    w.unmount()
  })

  it('⭐ ...and once the story is dismissed the tournament is what is left, as round 32 #2 built it', async () => {
    // Round 32 #2 §2, re-read through this file's own reader: the × silences the week's story and
    // the panel it was waiting behind takes its place - on the WEEK's arrival, which is the one that
    // has a story to dismiss.
    const w = screenOn(enteredCareer('r33-week-dismiss'))
    await w.find('.week-close').trigger('click')
    await nextTick()
    expect(screenBlocks(w.element)).toEqual([
      'date line',
      'heading "This week"',
      "the week's status",
      'the tournament',
      'heading "Training plan"',
      'the plan presets',
      'the plan line',
      'the planned spend',
    ])
    w.unmount()
  })

  it('⚠ a training week is untouched by this item, on either arrival', () => {
    // There is no tournament to be a screen about, so Home's plate falls back to the week - round
    // 31 #1's own training-week arm, restated through the list so a future pass cannot quietly empty
    // this state instead.
    const world = createWorld('r33-training-week', DEFAULT_PROFILE)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 12; i++) tickWeek(world, rng)
    const snap = toSnapshot(world)
    snap.upcoming = snap.upcoming.map((e) => ({ ...e, entered: false }))

    for (const entry of [undefined, 'tournament'] as const) {
      const w = screenOn(snap, entry)
      expect(w.find('.next-tourn').exists(), 'nothing is entered, so there is no panel').toBe(false)
      expect(screenBlocks(w.element), `the ${entry ?? 'story'} arrival keeps the week`).toEqual([
        'date line',
        "the story's close",
        'the story',
        'heading "This week"',
        "the week's status",
        'heading "Training plan"',
        'the plan presets',
        'the plan line',
        'the planned spend',
        'Proceed to Home',
      ])
      w.unmount()
    }
  })
})

// =================================================================================================
// §3 – THE WAY OFF, AND THE THING IT MUST NOT COST HIM
// =================================================================================================
describe('round 33 #1 §3 – a screen of its own needs a door of its own', () => {
  it('⭐⭐ the tournament arrival has a way off the page, and it goes Home', async () => {
    // ⚠ ROUND 20 #3 IS THE REASON THIS ARM IS NOT OPTIONAL. `week` has no seat in the bottom bar, so
    // the screen that arrives with none of its own controls would be leavable only by the tab bar -
    // and the story's × and Proceed pill, which used to be the way off this arrival, went with the
    // story. The control is the app's own back link (MoneyScreen's and KidScreen's), so no new
    // wording enters the app (CLAUDE.md invariant 4).
    const w = screenOn(enteredCareer('r33-way-off'), 'tournament')
    const back = w.find('.back-link')
    expect(back.exists(), 'there is a way off the tournament screen').toBe(true)
    expect(back.attributes('aria-label'), 'and it says where it goes').toBe('Back to Home')
    await back.trigger('click')
    expect(w.emitted('close'), 'the screen asks the shell to leave, as every screen here does').toHaveLength(1)
    w.unmount()
  })

  it('⭐⭐ ...and the shell really takes him Home when he presses it', async () => {
    const wrapper = await mountShell(enteredCareer('r33-way-off-shell'))
    await wrapper.find('[data-tour="next-tournament"]').trigger('click')
    await nextTick()
    expect(wrapper.findComponent(ThisWeekScreen).exists(), 'he is on the tournament').toBe(true)

    await wrapper.find('.back-link').trigger('click')
    await nextTick()
    expect(wrapper.findComponent(ThisWeekScreen).exists(), 'and now he is not').toBe(false)
    expect(wrapper.find('[data-tour="next-tournament"]').exists(), 'he is back on Home').toBe(true)
    wrapper.unmount()
  })

  it("⭐⭐ ...and the trip does NOT cost him the week's story", () => {
    // ⚠⚠ THE HAZARD THIS ARM IS ABOUT IS REAL AND IS ONE LINE AWAY. `dismissedRecapKey` is MODULE
    // scope (R9-18) and survives every unmount, so an arrival built by DISMISSING the story rather
    // than by not rendering it would silence that week for good - the owner would tap a plate on Home
    // and lose a week's story he had never been shown. Same career, same week, second mount: exactly
    // the key such a dismissal would have written.
    const snap = enteredCareer('r33-not-silenced')
    const first = screenOn(snap, 'tournament')
    expect(first.find('.recap-card').exists(), 'the tournament arrival does not show it').toBe(false)
    first.unmount()

    const second = screenOn(snap)
    expect(second.find('.recap-card').exists(), "and the week still has its story").toBe(true)
    expect(second.find('.week-close').exists(), 'with its × in the header').toBe(true)
    expect(second.find('.week-proceed-btn').exists(), 'and its way off the page').toBe(true)
    second.unmount()
  })
})
