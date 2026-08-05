// HOME: THE SEASON STRIP'S COLLAPSE, AND THE POST'S MARKER + CUE.
//
// ⚠ MOUNTED, NOT PINNED, AND THE DIFFERENCE IS THE WHOLE POINT HERE. The collapse rule this file
// covers ALREADY SHIPPED ONCE and did nothing on the owner's screen (05.08: «я просил спрятать
// вообще всё неактуальное кроме смежных турниров за точечки»). What existed to protect it was a
// rule written in a comment - "the window is contiguous in ladder order by construction" - and that
// sentence was false in the one career state that mattered. A source pin would have agreed with the
// comment. Only rendering the row against a real snapshot can tell you which chips come out.
//
// ⚠ THE FIXTURE IS A REAL WORLD THROUGH THE REAL PROTOCOL (the SeasonScreen net's discipline):
// createWorld + ticks + toSnapshot, so nothing here is a hand-written shape that can drift from
// `Snapshot`. The ONE field the strip tests overwrite is `tierOpen`, and deliberately: reaching the
// owner's state honestly costs 318 simulated weeks (measured: about a minute), and the claim under
// test is not "the engine opens these rungs" - it is "given THIS verdict, these chips render". The
// verdict itself is the engine's business and is covered in tests/tier-window.test.ts.
//
// The verdict used below is not invented either. It is the one read out of the running app on the
// owner's own 576-wide viewport, at age 20 on a professional career: {regional, w35, w50, w75} open,
// with national/j30/j60/j300/w15 dead in the hole between them, because `tierOutgrown` carries an
// age clause and the three rungs above the domestic ones are shut on age for ever.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { SPONSOR_TIERS } from '../../src/engine/offers'
import type { Snapshot, Offer, TierOpenMap } from '../../src/shared/protocol'
import type { TierId } from '../../src/engine/season/types'

// ⚠ THIS RUNNER HAS NO localStorage, AND THE MARKER IS ABOUT localStorage. Same finding and the
// same shim as tests/component/round20-ui.test.ts, quoted there in full: happy-dom is configured
// here without web storage, every reader in src/ wraps it in try/catch and answers "claim nothing"
// when it throws, and that correct production fallback makes a watermark UNTESTABLE by accident (it
// re-seeds to "now" on every read, so no marker can ever be lit). The test supplies the browser's
// own object rather than weakening the code to suit the runner.
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

const LADDER: TierId[] = [
  'local', 'regional', 'national', 'j30', 'j60', 'j300',
  'w15', 'w35', 'w50', 'w75', 'w100', 'wta125',
  'wta250', 'wta500', 'wta1000', 'slam',
]

function snapshotAfter(weeks: number, seed = 'component-home'): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** The snapshot with an explicit per-rung verdict. `tierOpen` is a TOTAL map on the protocol
 *  (`Record<TierId, boolean>`), so this answers for every rung rather than leaving holes that would
 *  be indistinguishable from "the engine did not say". */
function withWindow(snapshot: Snapshot, open: TierId[]): Snapshot {
  const tierOpen = Object.fromEntries(LADDER.map((id) => [id, open.includes(id)])) as TierOpenMap
  return { ...snapshot, tierOpen }
}

function mountHome(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  return mount(HomeScreen, {
    props: { recapFresh: false },
    global: { stubs: { teleport: true } },
  })
}

/** The rung chips actually on screen, as "<short> · <label>" – the ellipsis chips excluded. */
function rungChips(wrapper: ReturnType<typeof mountHome>): string[] {
  return wrapper
    .findAll('.season-strip .tier-chip')
    .filter((c) => !c.classes().includes('strip-more'))
    .map((c) => c.text())
}

function gapChips(wrapper: ReturnType<typeof mountHome>) {
  return wrapper.findAll('.season-strip .strip-more')
}

// =================================================================================================
// 1. THE SEASON STRIP
// =================================================================================================

describe('Home season strip – the row is the engine window, not the span across it', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('THE REGRESSION: a dead rung BETWEEN two open ones is hidden, not printed', () => {
    // The owner's own screen. Under the shipped span rule this row was `[firstOpen, lastOpen + 1]`
    // FILLED, so all five rungs in the hole rendered - and three of them were the junior rungs he
    // circled. Mutating `stripVisible` back to a span makes this fail on the first assertion.
    const snap = withWindow(snapshotAfter(6), ['regional', 'w35', 'w50', 'w75'])
    const wrapper = mountHome(snap)
    const chips = rungChips(wrapper).join(' | ')

    for (const dead of ['J30', 'J60', 'J300', 'W15', 'National']) {
      expect(chips, `${dead} is not open and is not the aspiration – it must not cost a line`).not.toContain(dead)
    }
    // ...and what IS open is all there, in ladder order, with the one rung above the top of the
    // window beside it («плюс один верхний недоступный уровень»).
    expect(rungChips(wrapper).map((t) => t.split(' ·')[0])).toEqual(['Regional', 'W35', 'W50', 'W75', 'W100'])
    wrapper.unmount()
  })

  it('the hole gets its own ellipsis, and every hidden run gets one', () => {
    // Three runs are hidden: {local}, {national..w15}, {wta125..slam}. An affordance per elision,
    // where the elision is - a paginator's shape - rather than one control at each end of the row.
    const wrapper = mountHome(withWindow(snapshotAfter(6), ['regional', 'w35', 'w50', 'w75']))
    const gaps = gapChips(wrapper)
    expect(gaps).toHaveLength(3)
    // Each one says how many rungs it is standing in for; "…" that hides one and "…" that hides five
    // are different promises. Counted from the ladder, so the arithmetic is the code's: below is
    // {local}, the hole is {national, j30, j60, j300, w15}, above is {wta125, wta250, wta500,
    // wta1000, slam} - and the singular is a real case, not a rounding of it.
    expect(gaps.map((g) => g.attributes('aria-label'))).toEqual([
      'Show 1 more level',
      'Show 5 more levels',
      'Show 5 more levels',
    ])
    expect(gaps[0].attributes('title')).toContain('1 level hidden (Local)')
    expect(gaps[1].attributes('title')).toContain('(National to W15)')
    wrapper.unmount()
  })

  it('the aspiration rung keeps its unlock condition – the goal text stays legible', () => {
    const wrapper = mountHome(withWindow(snapshotAfter(6), ['regional', 'w35', 'w50', 'w75']))
    const w100 = rungChips(wrapper).find((t) => t.startsWith('W100'))
    // Not "locked" as a mood: the rung above the window is the one whose CONDITION is the goal, so
    // it must print a condition rather than a padlock alone.
    expect(w100).toBeTruthy()
    expect(w100!.length, 'the aspiration chip carries its unlock note, not just a name').toBeGreaterThan('W100 · '.length)
    wrapper.unmount()
  })

  it('tapping an ellipsis expands the WHOLE ladder in place – nothing is deleted', async () => {
    const wrapper = mountHome(withWindow(snapshotAfter(6), ['regional', 'w35', 'w50', 'w75']))
    expect(rungChips(wrapper).length).toBe(5)
    await gapChips(wrapper)[0].trigger('click')
    expect(rungChips(wrapper).length).toBe(LADDER.length)
    // ...including the outgrown rungs, with their finishes intact - the objection the collapse had
    // to answer rather than ignore.
    expect(rungChips(wrapper).join(' | ')).toContain('J30')
    // ...and the way back is offered.
    expect(gapChips(wrapper)).toHaveLength(1)
    await gapChips(wrapper)[0].trigger('click')
    expect(rungChips(wrapper).length).toBe(5)
    wrapper.unmount()
  })

  it('a contiguous window is unchanged by the fix – no regression on the common case', () => {
    // The mid-career shape, which the span rule already rendered tightly. The set rule must not make
    // it worse, or the fix would be trading one screen for another.
    const wrapper = mountHome(withWindow(snapshotAfter(6), ['w35', 'w50', 'w75']))
    expect(rungChips(wrapper).map((t) => t.split(' ·')[0])).toEqual(['W35', 'W50', 'W75', 'W100'])
    wrapper.unmount()
  })

  it('no verdict at all shows the whole ladder – the safe direction for an old fixture', () => {
    // `tierOpen` is required by the protocol TODAY, so this state is only reachable from a snapshot
    // that predates it – an old golden fixture, or a payload from a stale worker. The cast is the
    // point of the test rather than a way round the types: `feedContext` treats a missing verdict as
    // "hide nothing", and this asserts the strip inherits that instead of collapsing to an empty row.
    const snap = snapshotAfter(6)
    const wrapper = mountHome({ ...snap, tierOpen: undefined as unknown as TierOpenMap })
    expect(rungChips(wrapper).length).toBe(LADDER.length)
    wrapper.unmount()
  })

  it('the top of the ladder needs no ellipsis above it', () => {
    // `slam` open means the aspiration clamps to the last rung, and a gap chip standing in for
    // nothing would be a control that lies about having something behind it.
    const wrapper = mountHome(withWindow(snapshotAfter(6), ['wta1000', 'slam']))
    expect(rungChips(wrapper).map((t) => t.split(' ·')[0])).toEqual(['WTA 1000', 'Slam'])
    expect(gapChips(wrapper)).toHaveLength(1) // the one below, nothing above
    wrapper.unmount()
  })
})

// =================================================================================================
// 2. THE POST'S MARKER
// =================================================================================================

function letter(id: string): Offer {
  // A NOTICE, which is the case the marker was missing: `state: 'info'` is never a live offer, so
  // `offerOpen` stays false and the icon used to stay dark for exactly the letters the owner said
  // he never saw arrive.
  return {
    id,
    kind: 'kit',
    state: 'info',
    week: 3,
    deadlineWeek: 99,
    terms: { kind: 'kit', tier: 'local', weeklyCents: 0, seasons: 1, covers: [] },
  } as unknown as Offer
}

describe('Home inbox marker – a letter that asks for no decision still shows up', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  const dot = (w: ReturnType<typeof mountHome>) =>
    w.find('button[aria-label="Open the inbox"]').find('.diary-tool-dot').exists()

  it('lights for an arrival even though no offer is open', async () => {
    const base = snapshotAfter(6)
    const snap: Snapshot = { ...base, offerOpen: false, offers: [letter('L1')] }
    const wrapper = mountHome(snap)
    // The FIRST evaluation seeds the watermark - a career restored from a file must not claim that
    // post arrived while he watched (inboxCue's "a missing watermark is the current value").
    expect(dot(wrapper), 'a loaded career does not invent an arrival').toBe(false)

    // ...and now one really lands.
    useGameStore().snapshot = { ...snap, offers: [letter('L1'), letter('L2')] }
    await nextTick()
    expect(dot(wrapper), 'a notice letter raises the marker even with offerOpen false').toBe(true)
    wrapper.unmount()
  })

  it('clears when he opens the inbox, and STAYS clear across a remount (save/load)', async () => {
    const base = snapshotAfter(6)
    const store = useGameStore()
    const wrapper = mountHome({ ...base, offerOpen: false, offers: [letter('L1')] })
    store.snapshot = { ...store.snapshot!, offers: [letter('L1'), letter('L2')] }
    await nextTick()
    expect(dot(wrapper)).toBe(true)

    await wrapper.find('button[aria-label="Open the inbox"]').trigger('click')
    expect(dot(wrapper), 'reading the post puts the marker out').toBe(false)

    // The watermark is per-career localStorage, so a reload finds it again. Remounting is the test's
    // stand-in for that: App.vue mounts every screen FRESH on each tab visit, so a marker that did
    // not persist would come straight back on the next visit - the exact bug inboxCue's `sync()`
    // note was written for.
    const stored = localStorage.getItem(`tb:lastSeenInboxLetter:${base.careerId}`)
    expect(stored, 'the watermark is written under this career’s own key').toBe('L2')
    wrapper.unmount()

    const again = mountHome(store.snapshot!)
    expect(dot(again), 'a save/load does not resurrect a marker he already cleared').toBe(false)
    again.unmount()
  })

  it('still lights for a LIVE offer – the engine fact it has always shown is untouched', () => {
    const base = snapshotAfter(6)
    const wrapper = mountHome({ ...base, offerOpen: true, offers: [] })
    expect(dot(wrapper)).toBe(true)
    wrapper.unmount()
  })
})

// =================================================================================================
// 3. THE CUE
// =================================================================================================
//
// The sound cannot be heard here, so what is asserted is the code path: which URL the key resolves
// to, that a real <audio> is asked to play it, and that the app's ONE mute preference silences it.
describe('the mail cue – the owner’s own recording, on the app’s one mute switch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('resolves to the file the owner shipped, and PLAYS it', async () => {
    const played: string[] = []
    const srcs: string[] = []
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'audio/mpeg' } })))
    vi.stubGlobal('Audio', class {
      volume = 1
      preload = ''
      currentTime = 0
      readyState = 0
      playbackRate = 1
      constructor(public src: string) { srcs.push(src) }
      load() {}
      play() { played.push(this.src); return Promise.resolve() }
    })
    const sfx = await import('../../src/audio/sfx')
    sfx.setMuted(false)
    sfx.initSfx() // the gate a real user gesture flips
    sfx.playSfx('mail')
    await new Promise((r) => setTimeout(r, 0))

    expect(srcs.some((s) => s.endsWith('music/email-notification.mp3')), `asked for: ${srcs.join()}`).toBe(true)
    expect(played.some((s) => s.endsWith('music/email-notification.mp3'))).toBe(true)
    // ...and it is NOT looked for in sounds/, which is where every other key lives - the owner put
    // this file in music/ and nothing renamed it to suit the module's default folder.
    expect(srcs.some((s) => s.includes('sounds/email-notification'))).toBe(false)
    vi.unstubAllGlobals()
  })

  it('IS SILENT WHILE MUTED – a cue that cannot be turned off is a bug', async () => {
    const played: string[] = []
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'audio/mpeg' } })))
    vi.stubGlobal('Audio', class {
      volume = 1
      preload = ''
      currentTime = 0
      readyState = 0
      playbackRate = 1
      constructor(public src: string) {}
      load() {}
      play() { played.push('played'); return Promise.resolve() }
    })
    const sfx = await import('../../src/audio/sfx')
    sfx.initSfx()
    // The SAME persisted flag behind More's "Sound effects" row (`tb-muted`) - no second preference
    // was invented for the post.
    sfx.setMuted(true)
    expect(localStorage.getItem('tb-muted')).toBe('1')
    sfx.playSfx('mail')
    await new Promise((r) => setTimeout(r, 0))
    expect(played, 'the mail cue obeys the existing mute').toEqual([])
    vi.unstubAllGlobals()
  })

  it('is silent before any user gesture, like every other cue', async () => {
    const played: string[] = []
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'audio/mpeg' } })))
    vi.stubGlobal('Audio', class {
      volume = 1
      preload = ''
      currentTime = 0
      readyState = 0
      playbackRate = 1
      constructor(public src: string) {}
      load() {}
      play() { played.push('played'); return Promise.resolve() }
    })
    const sfx = await import('../../src/audio/sfx')
    sfx.setMuted(false)
    sfx.playSfx('mail') // no initSfx() – browsers block autoplay, and so does this module
    await new Promise((r) => setTimeout(r, 0))
    expect(played).toEqual([])
    vi.unstubAllGlobals()
  })
})

// =================================================================================================
// 4. THE SPONSOR LETTERHEADS
// =================================================================================================

describe('OfferLetter – every rung prints its OWN mark now', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the three professional rungs no longer borrow the global mark', () => {
    // The redirect (`sponsorArtKey`) sent tour/premium/icon to global.webp. The owner drew all three,
    // it was deleted, and this is the behavioural half of that: mount the letter and read the src.
    for (const tier of ['tour', 'premium', 'icon'] as const) {
      const offer = {
        id: `o-${tier}`,
        kind: 'kit',
        state: 'open',
        week: 3,
        deadlineWeek: 9,
        terms: { kind: 'kit', tier, weeklyCents: 5000, seasons: 1, covers: ['racket'] },
      } as unknown as Offer
      const wrapper = mount(OfferLetter, { props: { offer } as never })
      const src = wrapper.find('img').attributes('src') ?? ''
      expect(src, `${tier} must print its own letterhead`).toContain(`sponsors/${tier}.webp`)
      expect(src, `${tier} must not fall back to the global mark`).not.toContain('sponsors/global.webp')
      wrapper.unmount()
    }
  })

  it('the ladder has six rungs and each one is a distinct key', () => {
    expect(new Set(SPONSOR_TIERS).size).toBe(SPONSOR_TIERS.length)
    expect(SPONSOR_TIERS).toHaveLength(6)
  })
})

// =================================================================================================
// 5. THE TOURNAMENT DESK'S THREE ARMS – entered / withdrew / released (fix/outgrown-entry, 05.08)
// =================================================================================================
//
// ⚠ WHAT THE OWNER WAS SHOWN, AND WHY A THIRD ARM RATHER THAN BETTER WORDS ON THE SECOND. His inbox
// said, for an entry the ENGINE had cancelled: «Your withdrawal from the World Tour 50 (Mar 28 –
// Apr 3, 2039) is confirmed – in time, free of charge, and nothing is recorded against her. The
// entry fee is on its way back. – Tournament desk». He had taken no decision. Three things are
// wrong in that paragraph and they compound: the AGENCY is misattributed ("your withdrawal"), there
// is no CAUSE, and the reassurances answer a question only a voluntary exit asks. Rewording the
// second arm would fix the third of those and leave the first two.
//
// Mounted rather than source-pinned, per CLAUDE.md's own gotcha, and every assertion below was
// mutation-verified against the pre-fix component (which renders the withdrawal arm for all three).
function entryLetter(terms: Record<string, unknown>): Offer {
  return {
    id: 'entry-x-1',
    kind: 'entry',
    week: 426,
    deadlineWeek: 430,
    state: 'info',
    terms,
  } as unknown as Offer
}

const W50 = { tier: 'w50', label: 'World Tour 50', eventWeek: 432, freeUntilWeek: 430 }

describe("OfferLetter – the desk's letter says WHO ended the entry", () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the registration arm is unchanged: she is in the draw', () => {
    const w = mount(OfferLetter, { props: { offer: entryLetter({ ...W50 }), week: 426 } as never })
    expect(w.text()).toContain('Your entry for the World Tour 50 is confirmed')
    // ("Withdrawal is free until..." is the registration arm's own third term – the claim here is
    //  only that neither EXIT arm has rendered.)
    expect(w.text()).not.toContain('Your withdrawal')
    expect(w.text()).not.toContain('We have taken her name off')
    w.unmount()
  })

  it("the parent's own withdrawal keeps its words exactly – it is the one case where they are true", () => {
    const w = mount(OfferLetter, {
      props: { offer: entryLetter({ ...W50, cancelled: true }), week: 427 } as never,
    })
    expect(w.text()).toContain('Your withdrawal from the World Tour 50')
    expect(w.text()).toContain('in time, free of charge, and nothing is recorded against her')
    w.unmount()
  })

  it('a letter with no releasedBy at all – every save written before the field – reads as HIS withdrawal', () => {
    // The back-compatibility claim, mounted: absent must not fall into the released arm.
    const terms = { ...W50, cancelled: true }
    expect('releasedBy' in terms).toBe(false)
    const w = mount(OfferLetter, { props: { offer: entryLetter(terms), week: 427 } as never })
    expect(w.text()).toContain('Your withdrawal from the World Tour 50')
    w.unmount()
  })

  it('a RELEASED entry never says he withdrew her – the desk names itself as the actor', () => {
    const w = mount(OfferLetter, {
      props: { offer: entryLetter({ ...W50, cancelled: true, releasedBy: 'injury' }), week: 427 } as never,
    })
    const text = w.text()
    // 1. THE AGENCY. The defect he actually reported, and the first thing the paragraph must fix.
    expect(text).not.toContain('Your withdrawal')
    expect(text).toContain('We have taken her name off the entry list')
    expect(text).toContain('we have withdrawn her ourselves')
    // 2. THE CAUSE, in the desk's own voice rather than as a system code.
    expect(text).toContain('She is not fit to play that week')
    // 3. THE REASSURANCES THAT BELONG TO A VOLUNTARY EXIT ARE GONE, and the one that belongs here
    //    is re-pointed at the right subject: it is the DESK's decision, not hers.
    expect(text).not.toContain('in time, free of charge')
    expect(text).toContain('This is our decision, not hers')
    expect(text).toContain('The entry fee is refunded in full')
    // ...and it is still the desk's paper: same sheet, same sign-off, no buttons.
    expect(text).toContain('– Tournament desk')
    expect(w.findAll('button')).toHaveLength(0)
    w.unmount()
  })

  it('an UNKNOWN desk-side reason falls back to a true sentence, never to the voluntary one', () => {
    // ⚠ THE TRAP THIS CLOSES IS THE BUG ITSELF ARRIVING BY INHERITANCE. A reason the template has no
    // arm for must not land in "Your withdrawal is confirmed" – so the fallback says only what is
    // true of every desk-side release. (The engine's own copy switch will not compile against a new
    // reason, so this is a second line of defence, not a substitute for writing the arm.)
    const w = mount(OfferLetter, {
      props: { offer: entryLetter({ ...W50, cancelled: true, releasedBy: 'suspension' }), week: 427 } as never,
    })
    const text = w.text()
    expect(text).not.toContain('Your withdrawal')
    expect(text).toContain('We have taken her name off the entry list')
    expect(text).toContain('This is our decision, not hers')
    // ...and it must NOT claim a cause it was not told about.
    expect(text).not.toContain('not fit to play')
    w.unmount()
  })

  it('the released arm carries no long dash and no Cyrillic – the copy rules, on the rendered text', () => {
    const w = mount(OfferLetter, {
      props: { offer: entryLetter({ ...W50, cancelled: true, releasedBy: 'injury' }), week: 427 } as never,
    })
    expect(w.text()).not.toContain('—')
    expect(w.text()).not.toMatch(/[Ѐ-ӿ]/)
    w.unmount()
  })
})
