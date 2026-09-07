// =================================================================================================
// WAVE B / B1 – THE FOUR "HAS THE PLAYER SEEN THIS TAB" WATCHERS, AS BEHAVIOUR
// =================================================================================================
//
// WHY THIS FILE EXISTS, AND WHY IT EXISTS *BEFORE* THE MOVE. Wave B takes App.vue's four tab-seen
// watchers, their per-device marks and their dot computeds out into `composables/tabSeen.ts`
// (docs/specs/next-waves-2026-09.md §Wave B; docs/review-principles-2026-09-05/03-ui.md, U-04). The
// spec's own warning is the reason for the order: «the four watchers are exactly the kind of thing
// that "still works" while firing at the wrong moment». A source pin cannot see a moment. So the
// behaviour is pinned here first, mounted, through the doors a player actually uses, and the same
// file is re-run unchanged after the move.
//
// ⚠ WHAT A "REAL TRIGGER" IS HERE, one per watcher, and none of them pokes `tab` directly:
//   * Season    – the Season button in the bottom bar.
//   * This-week – Home's NEXT TOURNAMENT plate, which is that screen's only door since the tab left
//                 the bar (`navigate('week:tournament')` -> `openWeek` -> `tab = 'week'`).
//   * Home      – the Home button in the bottom bar, arrived at from another tab.
//   * Trophies  – the Trophies button in the bottom bar.
//
// ⚠ EACH BLOCK ASSERTS THREE THINGS, and the third is the one an inverted condition trips:
//   1. the dot is UP before the visit (the arm's own honesty check – a dot that was never lit
//      cannot prove it went out);
//   2. the visit WRITES the right value under the right per-career key – the mark is a number with
//      a meaning, not a boolean, so "it wrote something" is not the claim;
//   3. a visit to SOME OTHER tab writes NOTHING and leaves the dot standing. This is the timing
//      half. `if (t === 'play')` inverted to `if (t !== 'play')` keeps every dot working and clears
//      it from the wrong screen; only 3 can see that.
//
// ⚠ AND THE MARKS ARE PER-DEVICE, NEVER IN THE SAVE. Every key below is web storage, scoped
// `prefix:careerId` by `careerKey`. The literal key strings are written out here rather than
// imported: they ARE the on-device contract, and a pin that imported them would follow a rename
// that silently orphans every player's marks.
//
// ⚠ MUTATION-VERIFIED. See the wave report for the red runs: inverting any one of the four
// conditions (`t === 'play'` -> `t !== 'play'`, and the same for 'week' / 'home' / 'trophies')
// turns this file red, and the season inversion is quoted there in full.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { latestNewsId, newestLetterId } from '../../src/composables/inboxCue'
import { recapExists } from '../../src/composables/weekRecap'
import { trophyPieces } from '../../src/composables/trophyArrival'
import type { Offer, Snapshot, WorldEvent } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage, AND THE SHELL'S SCREENS READ IT AT SETUP. Same shim and same
// argument as tests/component/round28-top-notices.test.ts and round31-week-entry.test.ts, quoted
// there in full: happy-dom is configured here without web storage. The test supplies the browser's
// object; it does not weaken the code. `backing` is also what the assertions read – the marks ARE
// storage, so reading them anywhere else would be reading a copy.
//
// ⚠ `storageThrows` IS THE PRIVATE WINDOW, AND IT IS A DIFFERENT FAILURE FROM AN ABSENT ONE. A
// browser that blocks site data raises `SecurityError` on the PROPERTY ACCESS; `localStorage` being
// missing is a `ReferenceError` at a different moment, and code that survives one can die on the
// other. Arm 6 needs the throwing kind. Same distinction career-watermarks.test.ts draws for the
// helper; this file draws it for the shell that now mounts through the helper.
const backing = new Map<string, string>()
let storageThrows = false
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => {
      if (storageThrows) throw new DOMException('The operation is insecure.', 'SecurityError')
      return backing.has(k) ? backing.get(k)! : null
    },
    setItem: (k: string, v: string) => {
      if (storageThrows) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      backing.set(k, String(v))
    },
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

// The four key prefixes, in the shell's own spelling. `careerKey` appends `:careerId`.
const SEASON_KEY = 'tb:lastSeenSeasonWeek'
const WEEK_KEY = 'tb:lastSeenThisWeek'
const NEWS_KEY = 'tb:lastSeenNewsId'
const LETTER_KEY = 'tb:lastSeenLetter'
const TROPHY_KEY = 'tb:lastSeenTrophies'

const SEASON_MARK_TEXT = 'New events on the calendar'

/** A NOTICE in the post – `state: 'info'`, so `offerOpen` stays false and only the letter watermark
 *  can see it. The shape is home-strip-and-mail.test.ts's, for the same reason it is there. */
function letter(id: string): Offer {
  return {
    id,
    kind: 'kit',
    state: 'info',
    week: 3,
    deadlineWeek: 99,
    terms: { kind: 'kit', tier: 'local', weeklyCents: 0, seasons: 1, covers: [] },
  } as unknown as Offer
}

/**
 * ONE career, walked by the real engine, carrying all four facts at once.
 *
 * ⚠ THE FOUR FACTS ARE ADDED TO THE SNAPSHOT RATHER THAN WAITED FOR, and that is deliberate. Each
 * dot is a comparison between a number the snapshot carries and a number in storage; which WEEK a
 * seeded career happens to emit a calendar marker on, or first put silverware on a shelf, is not
 * what this file is about, and a fixture that waited for all four to coincide would be a career
 * length nobody could justify and a red run the day the calendar moved. The walk is real; the four
 * facts are stated. Every one of them is asserted present below before it is used.
 */
function fixture(seed: string): Snapshot {
  const base = careerSnapshot(12, seed)
  const marker: WorldEvent = {
    id: 900_001,
    week: base.week,
    type: 'info',
    text: SEASON_MARK_TEXT,
  }
  const shelves = { ...base.trophiesByTier, local: { titles: [1, 2], finals: [3] } }
  const snap: Snapshot = {
    ...base,
    events: [...base.events, marker],
    offers: [letter('L1')],
    trophiesByTier: shelves,
  }

  // The fixture's own honesty checks. Every arm below asserts that a dot goes OUT; an arm whose dot
  // was never lit would pass on nothing at all.
  expect(snap.week, 'the career has really been walked').toBeGreaterThan(0)
  expect(recapExists(snap), 'there is a week story, so the This-week dot can light').toBe(true)
  expect(latestNewsId(snap), 'there is news, so the Home dot can light').toBeGreaterThan(-1)
  expect(newestLetterId(snap), 'there is post, so the Home dot has its second fact').toBe('L1')
  expect(trophyPieces(snap), 'the cabinet holds silverware, so its dot can light').toBe(3)
  return snap
}

/**
 * THE NEXT TICK'S POST – one more news line and one more letter, on the SAME career.
 *
 * ⚠ THE HOME DOT HAS TO BE EARNED BY AN ARRIVAL THE PLAYER IS NOT LOOKING AT, and that is the
 * shell's own rule rather than a quirk of the fixture: `if (tab.value === 'home') markHomeSeen()`
 * runs in the arrival watcher, so news that lands while Home is up is seen the moment it lands – the
 * clause that stops a dot appearing on the very screen that would clear it. A career loading onto
 * Home is exactly that case. So the unseen state is made the way the owner made it («missing news
 * entirely while week-skipping»): step off Home, and let the post arrive behind you.
 *
 * ⚠ THE NEW LINE IS DELIBERATELY NOT A CALENDAR MARKER. `latestSeasonMarkWeek` only counts the text
 * 'New events on the calendar', so this moves the news watermark and leaves the season one alone,
 * which is what keeps the arms independent of each other.
 */
function arrive(snap: Snapshot): Snapshot {
  const line: WorldEvent = { id: 900_002, week: snap.week, type: 'info', text: 'Her rank moved' }
  return { ...snap, events: [...snap.events, line], offers: [...snap.offers, letter('L2')] }
}

/**
 * The shell, mounted, past the splash, sitting on Home with a real career loaded.
 *
 * ⚠ THE STORE IS FILLED AFTER THE MOUNT – round28-top-notices.test.ts's finding, argued there in
 * full: `App.vue` calls `game.init()` in `onMounted`, reaches for a Web Worker this runner does not
 * have, and the store flips itself to `phase: 'recovery'`.
 *
 * ⚠ AND THE THREE CLAIM-NOTHING MARKS ARE SEEDED STALE BEFORE THE CAREER LANDS. The trophy, news
 * and letter watermarks read a MISSING key as "the current value" and write it back (inboxCue.ts's
 * `absent`-omitted form and its seeding write), so a career that simply appears asserts no arrival –
 * which is correct, and which would leave three of the four dots dark here. Storing a stale mark
 * first is the player who HAS been here before and has not seen what has landed since. The season
 * and This-week marks are the SENTINEL form: a missing key already reads as -1 and is not seeded, so
 * they are left absent on purpose and their absence is itself asserted below.
 */
async function mountShell(snapshot: Snapshot): Promise<VueWrapper> {
  const store = useGameStore()
  const wrapper = mount(App, { global: { stubs: { teleport: true } } })
  await flushPromises()
  backing.set(`${TROPHY_KEY}:${snapshot.careerId}`, '0')
  backing.set(`${NEWS_KEY}:${snapshot.careerId}`, '-1')
  backing.set(`${LETTER_KEY}:${snapshot.careerId}`, '')
  store.snapshot = snapshot
  store.ready = true
  store.phase = 'ready'
  await nextTick()
  wrapper.findComponent(SplashScreen).vm.$emit('done')
  await nextTick()
  return wrapper
}

/** Is the accent dot drawn on this bar tab? The element is `v-if`'d on `tabDot(id)`, so its presence
 *  is the dot – there is no hidden state to read. */
function barDot(wrapper: VueWrapper, id: string): boolean {
  return wrapper.find(`nav.tab-bar .tab-btn[data-tour="tab-${id}"] .tab-dot`).exists()
}

/** The This-week dot does NOT live in the bar – the tab left it (see App.vue's TABS comment). It
 *  travels to Home as `recap-fresh`, which is the prop HomeScreen draws on its plate. */
function weekDot(wrapper: VueWrapper): boolean {
  const home = wrapper.findComponent(HomeScreen)
  expect(home.exists(), 'the This-week dot is read off Home, so Home has to be up').toBe(true)
  return home.props('recapFresh') === true
}

async function tapBar(wrapper: VueWrapper, id: string): Promise<void> {
  const button = wrapper.find(`nav.tab-bar .tab-btn[data-tour="tab-${id}"]`)
  expect(button.exists(), `the bar has a ${id} tab`).toBe(true)
  await button.trigger('click')
  await nextTick()
}

const mark = (prefix: string, snap: Snapshot): string | undefined =>
  backing.get(`${prefix}:${snap.careerId}`)

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  storageThrows = false
})

// =================================================================================================
describe('B1 – the four tab-seen watchers, mounted, through their real doors', () => {
  it('0. all four dots are up on arrival, so every arm below has something to put out', async () => {
    const snap = fixture('r38-b1-arrival')
    const wrapper = await mountShell(snap)

    expect(barDot(wrapper, 'play'), 'the season calendar has a new marker').toBe(true)
    expect(barDot(wrapper, 'trophies'), 'the cabinet has gained pieces since the stored mark').toBe(true)
    expect(weekDot(wrapper), 'a fresh recap the tab has not been visited for').toBe(true)
    // ⚠ THE HOME DOT IS THE ONE THAT CANNOT BE UP HERE, and that is the rule rather than a gap:
    // `homeHasNews` is `tab !== 'home' && …`, so the dot for the screen you are standing on is never
    // drawn. The Home arm below moves off Home first, which is the player's own path to it.
    expect(barDot(wrapper, 'home'), 'no dot on the tab the player is already on').toBe(false)

    // The two sentinel marks are absent until a visit – nothing seeds them (see `mountShell`).
    expect(mark(SEASON_KEY, snap), 'nothing has marked the season yet').toBeUndefined()
    expect(mark(WEEK_KEY, snap), 'nothing has marked this week yet').toBeUndefined()
    wrapper.unmount()
  })

  // ===============================================================================================
  it('1. SEASON – the Season tab marks the newest calendar marker, and no other tab does', async () => {
    const snap = fixture('r38-b1-season')
    const wrapper = await mountShell(snap)

    // The timing half FIRST, on the way past: three other tabs, none of which is Season.
    for (const id of ['calendar', 'stats', 'trophies']) {
      await tapBar(wrapper, id)
      expect(mark(SEASON_KEY, snap), `${id} is not the season, so it marks nothing`).toBeUndefined()
      expect(barDot(wrapper, 'play'), `the season dot survives ${id}`).toBe(true)
    }

    await tapBar(wrapper, 'play')
    // ⚠ THE MARK NAMES THE MARKER'S WEEK, NOT THE VISIT'S – App.vue's own note at
    // `latestSeasonMarkWeek`, and the reason this asserts a number rather than "a key exists".
    expect(mark(SEASON_KEY, snap), 'the visit stores the newest marker week').toBe(String(snap.week))
    expect(barDot(wrapper, 'play'), 'and the dot goes out').toBe(false)
    wrapper.unmount()
  })

  // ===============================================================================================
  it('2. THIS-WEEK – the plate on Home marks the week, and no bar tab does', async () => {
    const snap = fixture('r38-b1-week')
    const wrapper = await mountShell(snap)

    for (const id of ['play', 'calendar', 'stats', 'trophies', 'home']) {
      await tapBar(wrapper, id)
      expect(mark(WEEK_KEY, snap), `${id} is not the week screen, so it marks nothing`).toBeUndefined()
    }

    // Back on Home, where the plate lives, with the dot still up: nothing above has spent it.
    await tapBar(wrapper, 'home')
    expect(weekDot(wrapper), 'five tab moves later the recap is still fresh').toBe(true)

    // The screen's only door. `navigate('week:tournament')` is what the plate emits.
    const plate = wrapper.find('[data-tour="next-tournament"]')
    expect(plate.exists(), 'the next-tournament plate is the door to the week screen').toBe(true)
    await plate.trigger('click')
    await nextTick()

    expect(mark(WEEK_KEY, snap), 'the visit stores the snapshot week').toBe(String(snap.week))
    // Back to Home to read the dot off the plate again – it is Home's prop, so Home has to be up.
    await tapBar(wrapper, 'home')
    expect(weekDot(wrapper), 'and the recap is no longer fresh').toBe(false)
    wrapper.unmount()
  })

  // ===============================================================================================
  it('3. HOME – arriving on Home marks BOTH the news and the post, and no other tab does', async () => {
    const snap = fixture('r38-b1-home')
    const wrapper = await mountShell(snap)
    // The career landed while the player was standing on Home, so the shell marked it seen there and
    // then – see `arrive`. That is the state the dot has to be earned out of.
    expect(mark(NEWS_KEY, snap), 'a career that lands on Home is read on Home').toBe('900001')
    expect(mark(LETTER_KEY, snap), 'and so is its post').toBe('L1')

    // Off Home, and only THEN does the post arrive.
    await tapBar(wrapper, 'play')
    const later = arrive(snap)
    useGameStore().snapshot = later
    await nextTick()
    expect(barDot(wrapper, 'home'), 'news and a letter landed while he was on the season').toBe(true)

    for (const id of ['calendar', 'stats', 'trophies']) {
      await tapBar(wrapper, id)
      expect(mark(NEWS_KEY, snap), `${id} does not read the feed`).toBe('900001')
      expect(mark(LETTER_KEY, snap), `${id} does not open the post`).toBe('L1')
      expect(barDot(wrapper, 'home'), `the home dot survives ${id}`).toBe(true)
    }

    await tapBar(wrapper, 'home')
    // ⚠ ONE DOT, TWO FACTS (App.vue: «ONE DOT ON THE HOME TAB, TWO FACTS BEHIND IT»), so the visit
    // has to clear both marks. A `markHomeSeen` that forgot one would leave the dot lit the moment
    // the player stepped off Home again, which is the shape of the bug the second assertion holds.
    expect(mark(NEWS_KEY, snap), 'the feed is marked read to its newest id').toBe(String(latestNewsId(later)))
    expect(mark(LETTER_KEY, snap), 'and the post to its newest letter').toBe('L2')

    await tapBar(wrapper, 'play')
    expect(barDot(wrapper, 'home'), 'stepping off Home again finds nothing unseen').toBe(false)
    wrapper.unmount()
  })

  // ===============================================================================================
  it('4. TROPHIES – opening the cabinet marks the piece COUNT, and no other tab does', async () => {
    const snap = fixture('r38-b1-trophies')
    const wrapper = await mountShell(snap)

    for (const id of ['play', 'calendar', 'stats', 'home']) {
      await tapBar(wrapper, id)
      expect(mark(TROPHY_KEY, snap), `${id} is not the cabinet`).toBe('0')
      expect(barDot(wrapper, 'trophies'), `the cabinet dot survives ${id}`).toBe(true)
    }

    await tapBar(wrapper, 'trophies')
    // ⚠ THE COUNT, NOT A FLAG – trophyArrival.ts: «IT COUNTS OBJECTS, NOT TIERS». Two titles and a
    // lost final is three pieces, and the next piece to land is what the next dot is about.
    expect(mark(TROPHY_KEY, snap), 'the visit stores the count it was opened at').toBe('3')
    expect(barDot(wrapper, 'trophies'), 'and the dot goes out').toBe(false)
    wrapper.unmount()
  })

  // ===============================================================================================
  it('5. ...and one visit clears exactly one dot – the four marks do not share a trigger', async () => {
    // The cross-check, and the arm an inversion cannot survive quietly. Four independent watchers
    // that all fired on any tab change would pass every block above and fail this one.
    const snap = fixture('r38-b1-crosstalk')
    const wrapper = await mountShell(snap)

    // Stats first: a tab with no mark of its own, so stepping onto it must move nothing at all. Then
    // the post arrives behind him, which is what puts the Home dot up (see `arrive`).
    await tapBar(wrapper, 'stats')
    // ⚠ THE ONE PLACE ALL FOUR CONDITIONS ARE ASSERTED AT ONCE. Stats owns no mark, so every one of
    // the five keys must still read what the mount left it at. Any of the four `t === 'x'` tests
    // inverted to `t !== 'x'` fires here, on a tab none of them is about.
    expect(mark(SEASON_KEY, snap), 'stats does not mark the season').toBeUndefined()
    expect(mark(WEEK_KEY, snap), 'stats does not mark the week').toBeUndefined()
    expect(mark(TROPHY_KEY, snap), 'stats does not open the cabinet').toBe('0')
    expect(mark(NEWS_KEY, snap), 'stats does not read the feed').toBe('900001')
    expect(mark(LETTER_KEY, snap), 'stats does not open the post').toBe('L1')

    useGameStore().snapshot = arrive(snap)
    await nextTick()
    expect(barDot(wrapper, 'home'), 'the home dot is up and stays up until Home is opened').toBe(true)

    await tapBar(wrapper, 'trophies')
    expect(mark(TROPHY_KEY, snap), 'the cabinet was opened').toBe('3')
    expect(mark(SEASON_KEY, snap), 'the season was not').toBeUndefined()
    expect(mark(WEEK_KEY, snap), 'the week screen was not').toBeUndefined()
    expect(mark(NEWS_KEY, snap), 'the feed was not').toBe('900001')
    expect(mark(LETTER_KEY, snap), 'the post was not').toBe('L1')
    expect(barDot(wrapper, 'play'), 'the season dot is still up').toBe(true)
    expect(barDot(wrapper, 'home'), 'and so is the home dot').toBe(true)

    await tapBar(wrapper, 'play')
    expect(mark(SEASON_KEY, snap), 'and now the season is marked too').toBe(String(snap.week))
    expect(mark(WEEK_KEY, snap), 'the week screen still is not').toBeUndefined()
    expect(mark(NEWS_KEY, snap), 'and neither is the feed').toBe('900001')
    expect(barDot(wrapper, 'home'), 'the home dot is untouched by the season').toBe(true)
    wrapper.unmount()
  })

  // ===============================================================================================
  it('6. ⚠ A PRIVATE WINDOW COSTS THE DOTS, NEVER THE SHELL', async () => {
    // ⚠ ADDED AFTER THE MOVE, and deliberately not folded into the five arms above: those five are
    // the before/after pin and are byte-identical across B2, which is what makes "green, unchanged"
    // a statement about behaviour. THIS arm is about the composable, which did not exist when they
    // were written.
    //
    // THE PROPERTY (spec §Wave B; U-07). The four marks are per-device web storage, and a browser
    // that blocks site data throws on the PROPERTY ACCESS itself - there is no `?.` that helps. The
    // composable is called at `<script setup>` time, ABOVE every screen, so an unguarded read there
    // is not a missing dot, it is a blank career on the app's first screen. Nothing in tabSeen.ts
    // touches `localStorage`: `inboxCue.ts`'s watermark owns every read and write and swallows both.
    //
    // ⚠ MUTATION-VERIFIED: dropping the try/catch around `useWatermark`'s `getItem` turns this red on
    // the mount itself, before any assertion - which is exactly the failure it is here to prevent.
    storageThrows = true
    const snap = fixture('r38-b1-private')
    const store = useGameStore()
    const wrapper = mount(App, { global: { stubs: { teleport: true } } })
    await flushPromises()
    store.snapshot = snap
    store.ready = true
    store.phase = 'ready'
    await nextTick()
    wrapper.findComponent(SplashScreen).vm.$emit('done')
    await nextTick()

    expect(wrapper.find('nav.tab-bar').exists(), 'the shell is on screen, not a blank career').toBe(true)
    // ...and the dots answer the way each one's missing-key rule says it must, which is the second
    // half of the property: storage being unreachable is the same case as a key that is not there.
    // The SENTINEL marks read -1 and still light; the CLAIM-NOTHING ones read the current value and
    // stay dark, because a cabinet that cannot know whether it was opened must not say it was.
    expect(barDot(wrapper, 'play'), 'a sentinel mark still lights its dot').toBe(true)
    expect(weekDot(wrapper), 'and so does the This-week one').toBe(true)
    expect(barDot(wrapper, 'trophies'), 'a claim-nothing mark asserts nothing it cannot know').toBe(false)

    // The bar still navigates, and the write that a visit makes goes nowhere instead of throwing.
    await tapBar(wrapper, 'play')
    expect(wrapper.find('nav.tab-bar').exists(), 'the visit did not take the shell down').toBe(true)
    expect(backing.size, 'nothing reached storage, and nothing escaped setup').toBe(0)
    wrapper.unmount()
  })
})
