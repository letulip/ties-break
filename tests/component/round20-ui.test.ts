// ROUND 20 (owner's 04.08 list) - MOUNTED NETS FOR THE FIVE ITEMS THAT ARE BEHAVIOUR.
//
// ⚠ WHY MOUNTED AND NOT PINNED. Every claim below is about what a screen RENDERS for a given world:
// which blocks a tab shows, which rungs a strip draws, whether a dot is in the DOM. A source pin
// ("the file contains `screenTab === 'bills'`") would pass on a component that renders nothing, and
// would break on a rename that changed no behaviour at all. The house rule is in CLAUDE.md's
// Gotchas and this file follows it: mount the real SFC against a real snapshot.
//
// Same fixture discipline as tests/component/season-screen.test.ts: a REAL world through the REAL
// protocol (createWorld + tickWeek + toSnapshot) pushed into a real Pinia store, never a hand-written
// snapshot shape that can drift. No worker is spawned - the screens only read the store.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: item 3 (the Stats switcher's 10px). It is one CSS declaration in
// a scoped <style> block, and @vue/test-utils does not apply scoped styles under happy-dom - a test
// asserting it would be asserting nothing. It was verified in the browser instead, by measuring the
// gap between the switcher and the block under it on all three tracks (10 / 10 / 10, was 0 / 10 / 0).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, nextTick } from 'vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { TIER_LADDER, TIER_SHORT } from '../../src/engine/season/calendar'
import { latestNewsId, newestLetterId, useLetterWatermark } from '../../src/composables/inboxCue'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

/** A real career, walked `weeks` weeks. */
const snapshotAfter = (weeks: number, seed = 'component-round20'): Snapshot => careerSnapshot(weeks, seed)

function withSnapshot(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return store
}

/** MoreScreen and nothing else calls the WORKER on mount (`onMounted(() => game.refreshCareers())`,
 *  which exists so the careers list cannot go stale while the player ticks weeks on Home). There is
 *  no `Worker` under happy-dom, so leaving it alone means an unhandled rejection per mount and
 *  vitest's own "this might cause false positive tests" warning on a green run. The action is
 *  replaced rather than the screen changed: what is under test here is which sections render, and
 *  refreshing a list of careers from a worker is not part of that question. */
function mountMore(snapshot: Snapshot) {
  const store = withSnapshot(snapshot)
  store.refreshCareers = async () => {}
  return mount(MoreScreen, mountOpts)
}

const mountOpts = { global: { stubs: { teleport: true } } }

// ⚠ THIS RUNNER HAS NO localStorage, AND THE WATERMARKS ARE ABOUT localStorage. happy-dom is
// configured here without web storage (probed: `typeof localStorage === 'undefined'`, and it is not
// on `window` either), which is exactly why every reader in src/ wraps it in try/catch and answers
// "claim nothing" when it throws. That fallback is correct in production and it makes the dot
// UNTESTABLE by accident: with no storage, a watermark re-seeds to "now" on every read and no dot can
// ever be lit. So the test supplies the browser's own object - a Map behind the four methods the app
// uses - rather than weakening the code to suit the runner.
const backing = new Map<string, string>()
const memoryStorage = {
  getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
  setItem: (k: string, v: string) => void backing.set(k, String(v)),
  removeItem: (k: string) => void backing.delete(k),
  clear: () => backing.clear(),
  key: (i: number) => [...backing.keys()][i] ?? null,
  get length() {
    return backing.size
  },
}
Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true })

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
})

// =================================================================================================
// ITEM 1 - THE MONEY SCREEN IS FOUR TABS
//
// ⚠ RE-AIMED BY THE SHOP (v63, docs/specs/the-shop-2026-08.md §2), NOT WEAKENED. Round 20 grouped the
// budget into THREE chapters and this exact-equality list is what has held that shape ever since -
// which is why a fourth entry had to come through here deliberately rather than by loosening the
// assertion to `toContain`. The owner's own placement is «на вкладку Family budget отдельным
// пунктом», so the shop is a fourth chapter and not a fourth screen, and the list still says exactly
// which chapters exist and in what order. The three original arms below are untouched.
// =================================================================================================
describe('MoneyScreen - the budget is grouped into tabs', () => {
  it('opens on Spending, and Spending is the arm that owns the period switcher', () => {
    withSnapshot(snapshotAfter(20))
    const wrapper = mount(MoneyScreen, mountOpts)
    const tabs = wrapper.findAll('.money-tabs .tab-pill')
    expect(tabs.map((t) => t.text())).toEqual(['Spending', 'Bills', 'History', 'Shop'])
    expect(tabs[0].attributes('aria-pressed')).toBe('true')
    // The summary and the 12w/season switcher are reads of one period, so they share one tab.
    expect(wrapper.find('.money-summary').exists()).toBe(true)
    expect(wrapper.find('.money-window').exists()).toBe(true)
    wrapper.unmount()
  })

  it('each tab shows its own blocks and hides the other two arms', async () => {
    withSnapshot(snapshotAfter(60))
    const wrapper = mount(MoneyScreen, mountOpts)
    const tab = (label: string) =>
      wrapper.findAll('.money-tabs .tab-pill').find((t) => t.text() === label)!

    // Spending: the breakdown, and none of the bills or the ledger.
    expect(wrapper.find('.money-summary').exists()).toBe(true)
    expect(wrapper.find('.money-kit').exists()).toBe(false)
    expect(wrapper.find('.money-years').exists()).toBe(false)

    await tab('Bills').trigger('click')
    expect(wrapper.find('.money-kit').exists()).toBe(true)
    expect(wrapper.find('.money-summary').exists()).toBe(false)
    expect(wrapper.find('.money-years').exists()).toBe(false)

    await tab('History').trigger('click')
    expect(wrapper.find('.money-years').exists()).toBe(true)
    expect(wrapper.find('.money-kit').exists()).toBe(false)
    expect(wrapper.find('.money-summary').exists()).toBe(false)
    wrapper.unmount()
  })

  it('"View all transactions" OPENS the tab the ledger is now behind', async () => {
    // ⚠ THE REGRESSION THIS EXISTS FOR: the CTA used to scroll to a ledger that was always in the
    // document. Behind a tab it is not, so a CTA that only scrolled would silently do nothing.
    withSnapshot(snapshotAfter(30))
    const wrapper = mount(MoneyScreen, mountOpts)
    expect(wrapper.find('.money-years').exists()).toBe(false)
    await wrapper.find('.money-cta').trigger('click')
    expect(wrapper.find('.money-years').exists()).toBe(true)
    expect(
      wrapper.findAll('.money-tabs .tab-pill').find((t) => t.text() === 'History')!.attributes('aria-pressed'),
    ).toBe('true')
    wrapper.unmount()
  })

  // =================================================================================================
  // THE BILL SPLIT (v44, docs/specs/split-the-bill-2026-08.md) - MOUNTED, because the whole slice is
  // about what the family can SEE. A source pin on EXPENSE_META would pass on a screen that renders
  // no rows at all, which is precisely the failure this has to catch: the owner's report is that he
  // could not read his own wallet.
  // =================================================================================================
  it('shows the coach and the court as two rows, and says why neither is exactly the quote', () => {
    withSnapshot(snapshotAfter(30))
    const wrapper = mount(MoneyScreen, mountOpts)
    const labels = wrapper.findAll('.money-list .money-row').map((r) => r.text())
    expect(labels.some((t) => t.includes('Coaching'))).toBe(true)
    expect(labels.some((t) => t.includes('Courts & facility'))).toBe(true)

    // The jitter, explained where it is met. Every figure in it is the engine's own, so this asserts
    // the SHAPE of the sentence rather than a number that a retune would move.
    const note = wrapper.find('.money-bill-note')
    expect(note.exists()).toBe(true)
    const text = note.text()
    expect(text).toContain('Training quotes at')
    expect(text).toContain('coaching')
    expect(text).toContain('courts')
    expect(text).toContain('No week bills exactly that')
    // Player copy rules: short dash only, no Cyrillic.
    expect(text).not.toContain('—')
    expect(text).not.toMatch(/[Ѐ-ӿ]/)
    wrapper.unmount()
  })

  it('tells a self-coached family it has no coaching line at all', () => {
    // ⚠ THE WORST OF WHAT THE OLD MODEL SHOWED HIM. `self` is priced at exactly the court rental, so
    // the row labelled "Coaching" was 100% court hire for a parent who works free. Asserted on the
    // rendered screen, because the fix is a thing the player reads.
    const world = createWorld('component-self-coached', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    withSnapshot(toSnapshot(world))
    const wrapper = mount(MoneyScreen, mountOpts)
    const labels = wrapper.findAll('.money-list .money-row').map((r) => r.text())
    expect(labels.some((t) => t.includes('Courts & facility'))).toBe(true)
    expect(labels.some((t) => t.includes('Coaching'))).toBe(false)
    expect(wrapper.find('.money-bill-note').text()).toContain('you coach her, so there is no coaching line')
    wrapper.unmount()
  })
})

// =================================================================================================
// ITEM 2 - THE SETTINGS SCREEN IS THREE TABS
// =================================================================================================
describe('MoreScreen - the settings are grouped into tabs', () => {
  it('opens on Play - the preferences, which is what the player came to find', () => {
    const wrapper = mountMore(snapshotAfter(4))
    const tabs = wrapper.findAll('.more-tabs .tab-pill')
    expect(tabs.map((t) => t.text())).toEqual(['Play', 'Saves', 'About'])
    const headings = wrapper.findAll('section h2').map((h) => h.text())
    expect(headings).toContain('Sound')
    expect(headings).toContain('Match playback')
    // ...and nothing that can destroy data is on this tab.
    expect(headings).not.toContain('Danger zone')
    expect(headings).not.toContain('Careers')
    wrapper.unmount()
  })

  it('Saves holds everything that writes or destroys, About holds what changes nothing', async () => {
    const wrapper = mountMore(snapshotAfter(4))
    const tab = (label: string) => wrapper.findAll('.more-tabs .tab-pill').find((t) => t.text() === label)!
    const headings = () => wrapper.findAll('section h2').map((h) => h.text())

    await tab('Saves').trigger('click')
    expect(headings()).toEqual(expect.arrayContaining(['Careers', 'Saves', 'Danger zone']))
    expect(headings()).not.toContain('Sound')

    await tab('About').trigger('click')
    expect(headings()).toEqual(['About'])
    wrapper.unmount()
  })
})

// =================================================================================================
// ITEM 4 / 5 - THE BELL'S DOT, AND THE INBOX WATERMARK BEHIND THE HOME CUE
// =================================================================================================
describe('the news and letter watermarks', () => {
  it('latestNewsId ignores the money ledger and tracks the feed', () => {
    const snapshot = snapshotAfter(30)
    const news = snapshot.events.filter((e) => e.type !== 'expense' && e.type !== 'income')
    expect(news.length).toBeGreaterThan(0)
    expect(latestNewsId(snapshot)).toBe(Math.max(...news.map((e) => e.id)))
    // ...and it is NOT simply the highest id in the feed, which is the mistake it exists to avoid.
    expect(latestNewsId(null)).toBe(-1)
  })

  // ⚠ THE LETTER ARM HAS NO BROWSER EVIDENCE AND THIS IS WHY IT IS TESTED HARDER. Driving the dev
  // server to a career that actually receives a sponsor letter takes seasons of play; the news arm of
  // the same dot WAS verified live (lit, then cleared by a tap). So the letter watermark is exercised
  // here through a component, the way App.vue uses it, rather than left on inspection alone.
  it('a letter landing turns the cue on, and marking it seen turns it off and STAYS off', async () => {
    const base = snapshotAfter(20)
    const store = withSnapshot({ ...base, offers: [] as unknown as Snapshot['offers'] })
    let api: ReturnType<typeof useLetterWatermark> | null = null
    const Probe = defineComponent({
      setup() {
        api = useLetterWatermark('tb:lastSeenLetter')
        return () => h('i', { class: api!.unseen.value ? 'dot' : 'no-dot' })
      },
    })
    const wrapper = mount(Probe)
    // An empty inbox is never "new" - there is nothing to have arrived.
    expect(wrapper.find('.dot').exists()).toBe(false)

    const letter = { id: 'kit-end-x' } as unknown as Snapshot['offers'][number]
    store.snapshot = { ...base, offers: [letter] as unknown as Snapshot['offers'] }
    await nextTick()
    expect(wrapper.find('.dot').exists()).toBe(true)

    api!.markSeen()
    await nextTick()
    expect(wrapper.find('.dot').exists()).toBe(false)
    // ...and a fresh mount (App remounts screens on every tab change) reads the persisted mark.
    wrapper.unmount()
    const again = mount(Probe)
    expect(again.find('.dot').exists()).toBe(false)
    again.unmount()
  })

  it('newestLetterId is the last letter, whatever its state', () => {
    expect(newestLetterId(null)).toBe(null)
    const snapshot = snapshotAfter(4)
    expect(newestLetterId({ ...snapshot, offers: [] })).toBe(null)
    const offers = [{ id: 'a' }, { id: 'b' }] as unknown as Snapshot['offers']
    expect(newestLetterId({ ...snapshot, offers })).toBe('b')
  })
})

describe('HomeScreen - the bell dot clears (item 5)', () => {
  it('is lit while the feed has something newer than the last visit to it', () => {
    const snapshot = snapshotAfter(30)
    const store = withSnapshot(snapshot)
    // The player last looked before the newest story landed.
    localStorage.setItem(`tb:lastSeenBellNewsId:${store.snapshot!.careerId}`, String(latestNewsId(snapshot) - 1))
    const wrapper = mount(HomeScreen, mountOpts)
    const bell = wrapper.find('button[aria-label="Go to the news feed"]')
    expect(bell.find('.diary-tool-dot').exists()).toBe(true)
    wrapper.unmount()
  })

  it('...and TAPPING THE BELL puts it out, which is the whole bug', async () => {
    const snapshot = snapshotAfter(30)
    const store = withSnapshot(snapshot)
    localStorage.setItem(`tb:lastSeenBellNewsId:${store.snapshot!.careerId}`, String(latestNewsId(snapshot) - 1))
    const wrapper = mount(HomeScreen, mountOpts)
    const bell = wrapper.find('button[aria-label="Go to the news feed"]')
    expect(bell.find('.diary-tool-dot').exists()).toBe(true)
    await bell.trigger('click')
    expect(wrapper.find('button[aria-label="Go to the news feed"]').find('.diary-tool-dot').exists()).toBe(false)
    // ...and it stays out across a remount, because the watermark persisted. (Before the fix there
    // was no watermark at all and the dot came back on the next render.)
    expect(localStorage.getItem(`tb:lastSeenBellNewsId:${store.snapshot!.careerId}`)).toBe(
      String(latestNewsId(snapshot)),
    )
    wrapper.unmount()
    const again = mount(HomeScreen, mountOpts)
    expect(again.find('button[aria-label="Go to the news feed"]').find('.diary-tool-dot').exists()).toBe(false)
    again.unmount()
  })

  it('a career with no unseen news shows no dot - so the test above is not vacuous', () => {
    const snapshot = snapshotAfter(30)
    const store = withSnapshot(snapshot)
    localStorage.setItem(`tb:lastSeenBellNewsId:${store.snapshot!.careerId}`, String(latestNewsId(snapshot)))
    const wrapper = mount(HomeScreen, mountOpts)
    expect(wrapper.find('button[aria-label="Go to the news feed"]').find('.diary-tool-dot').exists()).toBe(false)
    wrapper.unmount()
  })
})

// =================================================================================================
// ITEM 6 - HER AGE SITS AT THE FOOT OF THE PAINTING
// =================================================================================================
describe('KidScreen - the age moved off her face (item 6)', () => {
  it('the age line is a child of the hero, not of the header block over her face', () => {
    const snapshot = snapshotAfter(10)
    withSnapshot(snapshot)
    const wrapper = mount(KidScreen, mountOpts)
    const age = wrapper.find('.kid-age')
    expect(age.exists()).toBe(true)
    expect(age.text()).toContain(String(snapshot.ageYears))
    // It is in the hero (so it can be pinned to its bottom edge) and NOT inside `.kid-id`, which is
    // the top-left identity block the name lives in and which is what was covering her face.
    expect(wrapper.find('.kid-hero > .kid-age').exists()).toBe(true)
    expect(wrapper.find('.kid-id .kid-age').exists()).toBe(false)
    wrapper.unmount()
  })

  it('the painting is untouched - same element, no crop or scale added', () => {
    withSnapshot(snapshotAfter(10))
    const wrapper = mount(KidScreen, mountOpts)
    const img = wrapper.find('.kid-hero-img')
    expect(img.exists()).toBe(true)
    // The standing ruling: the art is shown whole. Nothing on the call site may resize it.
    expect(img.attributes('style')).toBeUndefined()
    wrapper.unmount()
  })
})

// =================================================================================================
// ITEM 7 - THE HOME SEASON BLOCK SHOWS THE ENGINE'S WINDOW, PLUS ONE
// =================================================================================================
describe('HomeScreen - the season strip is the window plus one (item 7)', () => {
  it('draws fewer than the whole ladder, and never more rungs than the engine holds open plus one', () => {
    const snapshot = snapshotAfter(30)
    withSnapshot(snapshot)
    const open = TIER_LADDER.filter((t) => snapshot.tierOpen?.[t])
    expect(open.length).toBeGreaterThan(0)
    expect(open.length).toBeLessThan(TIER_LADDER.length)
    const wrapper = mount(HomeScreen, mountOpts)
    const chips = wrapper.findAll('.season-strip .tier-chip:not(.strip-more)')
    expect(chips.length).toBeLessThan(TIER_LADDER.length)
    expect(chips.length).toBeLessThanOrEqual(open.length + 1)
    wrapper.unmount()
  })

  it('every rung the engine holds open is on screen, and so is exactly one above them', () => {
    const snapshot = snapshotAfter(30)
    withSnapshot(snapshot)
    const open = TIER_LADDER.filter((t) => snapshot.tierOpen?.[t])
    const highest = TIER_LADDER.indexOf(open[open.length - 1])
    const aspirational = TIER_LADDER[Math.min(highest + 1, TIER_LADDER.length - 1)]
    const wrapper = mount(HomeScreen, mountOpts)
    const text = wrapper.find('.season-strip').text()
    // Chips print the tier's SHORT name, which is what the strip's own array carries.
    for (const id of open) expect(text).toContain(shortOf(id))
    expect(text).toContain(shortOf(aspirational))
    wrapper.unmount()
  })

  it('the rest is behind an ellipsis, and the ellipsis really opens it', async () => {
    withSnapshot(snapshotAfter(30))
    const wrapper = mount(HomeScreen, mountOpts)
    const more = wrapper.findAll('.season-strip .strip-more')
    expect(more.length).toBeGreaterThan(0)
    const collapsed = wrapper.findAll('.season-strip .tier-chip:not(.strip-more)').length
    await more[more.length - 1].trigger('click')
    const expanded = wrapper.findAll('.season-strip .tier-chip:not(.strip-more)').length
    expect(expanded).toBe(TIER_LADDER.length)
    expect(expanded).toBeGreaterThan(collapsed)
    // ...and it collapses back, so the affordance is a toggle rather than a one-way door.
    const back = wrapper.findAll('.season-strip .strip-more')
    await back[back.length - 1].trigger('click')
    expect(wrapper.findAll('.season-strip .tier-chip:not(.strip-more)').length).toBe(collapsed)
    wrapper.unmount()
  })

  it('with no engine verdict at all the whole ladder is drawn - the safe direction', () => {
    // ⚠ `tierOpen` is REQUIRED on the live Snapshot, so this state is not reachable from the current
    // protocol - it is the OLD-FIXTURE case `feedContext` documents ("absent means hide nothing"),
    // and the cast is how a test reaches a shape the type system has since closed off. The claim is
    // the one that matters for a window read from the engine: with no verdict, hide nothing.
    const snapshot = snapshotAfter(30)
    withSnapshot({ ...snapshot, tierOpen: undefined } as unknown as Snapshot)
    const wrapper = mount(HomeScreen, mountOpts)
    expect(wrapper.findAll('.season-strip .tier-chip:not(.strip-more)').length).toBe(TIER_LADDER.length)
    expect(wrapper.findAll('.season-strip .strip-more').length).toBe(0)
    wrapper.unmount()
  })
})

/** The strip prints the tier's SHORT name - the one shared table, so this test cannot invent a
 *  second spelling for a rung (the R10-7 rule). */
function shortOf(id: (typeof TIER_LADDER)[number]): string {
  return TIER_SHORT[id]
}
