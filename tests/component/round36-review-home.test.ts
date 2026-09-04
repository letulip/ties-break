// ⭐⭐⭐ ROUND 36, HIS REVIEW OF THE BUILT WAVE – ITEMS 1–9 AND 18, MOUNTED.
//
// One file for the prologue's new shape, Home's desktop and tablet corrections, and the one global
// cap. His own words for each are quoted in `docs/rounds/round-36-review.md` and beside the rules
// themselves; nothing here restates a sentence of his in Cyrillic, because a test file may not
// (tests/template-copy-rules.test.ts is about templates, but the habit is the same – the words live
// once, in the document that is his).
//
// ⚠ WHAT THIS LAYER CAN AND CANNOT SAY. happy-dom parses CSS and does no layout, so every number
// here is a DECLARED value read through the real cascade at a real viewport – which is exactly the
// right instrument for «is this rule on at this width», and the wrong one for «does it fit». The
// FIT half of item 1 («скролла не будет») is measured in a real Chromium and the numbers are in the
// review document; this file measures the rules that produce it.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read. happy-dom evaluates a media query on an
// element's FIRST computed-style read and caches it, so a width set after the mount reads the
// previous test's screen – written down beside `TABLET` in fits.ts, and paid for once already.
//
// ⚠ AND THE SHELL IS MOUNTED INTO A REAL `#app`, because every rail rule is keyed on
// `#app:has(> nav.tab-bar)`. Carried from round36-desktop-shell.test.ts, where it is argued in full.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import PrologueCard from '../../src/components/PrologueCard.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { createWorld, enterEvent, toSnapshot } from '../../src/engine/world'
import type { SeasonEvent } from '../../src/engine/season/types'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { readFileSync } from 'node:fs'
import { PROLOGUE_CARDS } from '../../src/prologue/cards'
import { EMPTY_RUN, cardFor, moodAt, warmthAt } from '../../src/prologue/run'
import { OPENING_IDENTITY } from '../../src/prologue/identity'
import { formatCents } from '../../src/shared/money'
import type { Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

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

const CAREER_WEEKS = 60
const CAREER_SEED = 'r36-review-home'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/**
 * The tab shell, in a real `#app`, with the teleport LEFT ALONE.
 *
 * ⚠⚠ `stubs: { teleport: true }` IS DELIBERATELY NOT PASSED HERE, and that is the one difference
 * from the two round-36 files this helper is carried from. Review #3's whole claim is that the
 * avatar and the rank chip END UP INSIDE `nav.tab-bar`; a stubbed teleport renders them where they
 * were written instead, and every assertion about the rail would then pass on a build that teleports
 * nothing at all.
 */
async function mountShell(snapshot: Snapshot): Promise<VueWrapper> {
  const store = useGameStore()
  const wrapper = mount(App, { attachTo: document.body })
  await flushPromises()
  store.snapshot = snapshot
  store.ready = true
  store.phase = 'ready'
  await nextTick()
  wrapper.findComponent(SplashScreen).vm.$emit('done')
  await nextTick()
  const bar = wrapper.find('nav.tab-bar')
  if (!bar.exists()) throw new Error('the shell drew no navigation – there is no frame to name')
  const container = bar.element.parentElement
  if (!container) throw new Error('the bar has no parent – #app cannot be named')
  container.id = 'app'
  // The id has to be on the frame BEFORE the deferred teleport's target is looked up and before any
  // rail rule is read, so one more tick after naming it.
  await nextTick()
  return wrapper
}

/** ⚠ THE PATH IS A PLAIN VARIABLE AND NEVER AN INLINE LITERAL – Vite rewrites
 *  `new URL('…', import.meta.url)` into its own asset resolver and the result is not a `file:` URL
 *  under this runner. Same helper, same reason, as the two sibling round-36 files. */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

/** A career that has ENTERED something, so Home's Next-tournament card really draws its venue
 *  painting. ⚠ WITHOUT THIS THE #4 ARM IS VACUOUS: `.venue-art` lives inside `v-if="nearestEntered"`,
 *  and a measurement of an element that is not on the page passes on any rule at all – which is
 *  exactly the «four empty sets are equal» failure this round keeps writing down. */
function enteredCareer(seed: string): Snapshot {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const event = (n: number): SeasonEvent => ({
    id: `${seed}-local-${n}`,
    week: 2 + n,
    tier: 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: 1,
  })
  world.season = [event(1), event(2)]
  enterEvent(world, `${seed}-local-1`)
  const snap = toSnapshot(world)
  if (!snap.upcoming.some((e) => e.entered)) {
    throw new Error('the entry was refused – the venue painting would not be drawn')
  }
  return snap
}

/** …and a career whose rank chip is DRAWN. `rankChipTrack` returns null until a counting result
 *  lands somewhere, and a world ticked without entering anything never earns one – so the chip would
 *  be absent and review #3's arm would measure a rail it never reached. The rank is set on the
 *  SNAPSHOT (a plain transport object), which is the same kind of fixture shaping `enteredCareer`
 *  does to the calendar: nothing about how a rank is COMPUTED is claimed here. */
function rankedCareer(seed: string): Snapshot {
  const snap = careerSnapshot(CAREER_WEEKS, seed)
  const ladder = snap.ladders[snap.activeLadder]
  if (ladder.rank === null) ladder.rank = 96
  return snap
}

function css(selector: string): CSSStyleDeclaration {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`nothing matches ${selector} – the measurement below would be vacuous`)
  return getComputedStyle(el)
}

function has(selector: string): boolean {
  return document.querySelector(selector) !== null
}

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  assertSheetPresent()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

// =================================================================================================
// #1 – THE PROLOGUE'S PICTURE STOPS BEING THE COLUMN
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: deleting the `@media (min-width: 768px)` block from PrologueCard.vue reddens
// the tablet arm on the card's width AND on the hero's; deleting the 1024 block reddens the desktop
// arm on `display`.

function mountFirstCard(vp: { width: number; height: number }): VueWrapper {
  setViewport(vp)
  const card = cardFor(PROLOGUE_CARDS[0].age, EMPTY_RUN)
  return mount(PrologueCard, {
    attachTo: document.body,
    props: {
      card,
      warmth: warmthAt(card.age, EMPTY_RUN),
      mood: moodAt(card.age, EMPTY_RUN),
      identity: { ...OPENING_IDENTITY },
    },
  })
}

describe('round 36 review #1 – the prologue takes Home’s shape, and it overrules D28', () => {
  it('⭐ on a phone NOTHING moves: the 420 column and the full-bleed square are exactly as shipped', () => {
    wrapper = mountFirstCard(PHONE)
    const card = css('.prologue-card')
    const hero = css('.prologue-hero')
    expect(card.maxWidth, 'the phone column moved').toBe('420px')
    expect(card.display, 'the phone card became a grid').toBe('block')
    // The full-bleed trick: the shared card's 16px padding cancelled on both sides.
    expect(hero.width, 'the painting stopped spanning the phone').toBe('calc(100% + 32px)')
    expect(hero.aspectRatio, 'the painting is not square').toBe('1 / 1')
    expect(css('.prologue-answers').display, 'the answers stopped being one column').toBe('flex')
  })

  it('⭐⭐ on a tablet the TEXT gets the wider column and the PICTURE gets a size of its own', () => {
    wrapper = mountFirstCard(TABLET)
    const card = css('.prologue-card')
    const hero = css('.prologue-hero')
    expect(card.maxWidth, 'the column did not widen for the words').toBe('640px')
    // ⚠⚠ THE PICTURE'S *SIZE* IS NOT MEASURED HERE AND THE REASON IS STATED RATHER THAN WORKED
    // AROUND: the cap is `min(var(--plo-art), 33vh)` and happy-dom DROPS a declaration whose value
    // it cannot parse – measured, `width` computes to the phone's `calc(100% + 32px)` while every
    // other declaration in the same rule lands. So the size is measured in a real Chromium instead
    // (336 square at 768x1024, 297 at 768x900, and every card fitting at both – the numbers are in
    // docs/rounds/round-36-review.md), and what this arm proves is that the FULL-BLEED IS GONE,
    // which is the structural half of «the picture stops being the column».
    expect(hero.marginLeft, 'the painting is not centred').toBe('auto')
    expect(hero.marginRight).toBe('auto')
    // It has the card's own corner now, which a picture running off both edges of a phone cannot.
    expect(hero.borderRadius, 'the painting still has no edges of its own').not.toBe('0px')
    expect(hero.aspectRatio, 'the painting stopped being square').toBe('1 / 1')
    // …and the answers pair up, which is #18 arriving on this screen: one column of a 640px card is
    // a 608px button.
    expect(css('.prologue-answers').display, 'the answers are still one column').toBe('grid')
  })

  it('⭐⭐⭐ on a desktop the picture is BESIDE the words, and the decision is under both', () => {
    wrapper = mountFirstCard(DESKTOP)
    const card = css('.prologue-card')
    expect(card.display, 'the card is not a two-column spread').toBe('grid')
    expect(card.maxWidth).toBe('880px')
    expect(css('.prologue-hero').gridColumn, 'the painting is not in the first column').toBe('1')
    expect(css('.prologue-lede').gridColumn, 'the words are not beside the painting').toBe('2')
    // «ниже и шире»: the answers span both tracks, under the picture.
    expect(css('.prologue-answers').gridColumn, 'the decision is not under both columns').toBe('1 / -1')
  })
})

// =================================================================================================
// #2 and #3 – THE CHROME COMES OFF THE PHOTOGRAPH
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: removing `.diary-head > .diary-tools { display: none }` from the 1024 block
// reddens «exactly one copy» with two visible rows; removing the `<Teleport>` reddens the rail arm
// by finding no avatar inside the navigation.

/** ⚠ SIXTY WEEKS AND NOT SIX. The rank chip is drawn only once something COUNTS somewhere
 *  (`rankChipTrack` returns null before that), so a six-week career measures a rail whose chip was
 *  never rendered – a null arm that looks like a null result. */
async function homeAt(vp: { width: number; height: number }, snapshot?: Snapshot): Promise<void> {
  setViewport(vp)
  wrapper = await mountShell(snapshot ?? careerSnapshot(CAREER_WEEKS, CAREER_SEED))
  await nextTick()
}

describe('round 36 review #2 – the bell, the mail and the gear leave the picture', () => {
  it('⭐ the two copies name the SAME three controls, so neither can drift from the other', async () => {
    await homeAt(PHONE)
    const names = (root: Element): string[] =>
      [...root.querySelectorAll('button.diary-tool')].map((b) => b.getAttribute('aria-label') ?? '')
    const hero = document.querySelector('.diary-head > .diary-tools')
    const page = document.querySelector('.diary-tools-page')
    expect(hero, 'the hero’s own row is gone').toBeTruthy()
    expect(page, 'the page copy was never rendered').toBeTruthy()
    expect(names(page!), 'the two copies offer different controls').toEqual(names(hero!))
    expect(names(page!)).toEqual(['Go to the news feed', 'Open the inbox', 'Settings'])
  })

  it('⭐⭐ …and exactly ONE of them is on screen at any width – the phone keeps the photograph’s', async () => {
    await homeAt(PHONE)
    expect(css('.diary-head > .diary-tools').display, 'the hero’s row went out on a phone').toBe('flex')
    expect(css('.diary-tools-page').display, 'the page copy is showing on a phone').toBe('none')
  })

  it('⭐⭐ …and the desktop keeps the page’s, in the corner of the container', async () => {
    await homeAt(DESKTOP)
    expect(css('.diary-head > .diary-tools').display, 'the icons are still on the photograph').toBe('none')
    const page = css('.diary-tools-page')
    expect(page.display, 'the page copy did not take over').toBe('flex')
    expect(page.position, 'the row is in the grid rather than above it').toBe('absolute')
    expect(page.top).toBe('0px')
    expect(page.right, 'it is not in the RIGHT corner').toBe('0px')
  })
})

describe('round 36 review #3 – her face and her rank move into the menu', () => {
  it('⭐⭐⭐ they are teleported INSIDE the one navigation the app has, above every menu item', async () => {
    await homeAt(DESKTOP, rankedCareer('r36-review-rank'))
    const slot = document.querySelector('#app > nav.tab-bar > .rail-id')
    expect(slot, 'the identity block is not a child of the navigation').toBeTruthy()
    expect(slot!.querySelector('button[aria-label="Open her profile"]'), 'her face did not travel').toBeTruthy()
    expect(slot!.querySelector('button[aria-label="How ranking points work"]'), 'the rank chip did not travel').toBeTruthy()
    // «над всеми пунктами» – and it has to beat the Home tab's own `order: -1` (review #8).
    expect(getComputedStyle(slot!).order, 'the block is not above the menu items').toBe('-2')
    // …and the hero's own pair stands down, so exactly one of each is on screen.
    expect(css('.diary-head > .diary-avatar-btn').display, 'her face is still on the photograph').toBe('none')
    expect(css('.diary-id > .diary-rank').display, 'the rank chip is still on the photograph').toBe('none')
  })

  it('⚠ …and on a phone the rail block draws nothing at all, so the bottom bar is unchanged', async () => {
    await homeAt(PHONE)
    expect(has('#app > nav.tab-bar > .rail-id'), 'the slot is in the DOM at every width').toBe(true)
    expect(css('#app > nav.tab-bar > .rail-id').display, 'the bottom bar grew a face').toBe('none')
    expect(css('.diary-head > .diary-avatar-btn').display, 'the phone lost her face').not.toBe('none')
  })
})

// =================================================================================================
// #4, #5, #6, #7 – THE CARDS
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: raising `.card-short`'s floor on the tournament card back to `.note-card`'s
// 186 reddens #4; `display: grid` on `.card-pair` below 1024 reddens #5's phone arm.

describe('round 36 review #4 – Next tournament is the shorter of the pair, and its picture grows', () => {
  it('⭐ on the desktop its floor is the SHORT card’s, which is what leaves Family budget the room', async () => {
    await homeAt(DESKTOP)
    const nt = css('[data-tour="next-tournament"].note-card')
    const fb = css('[data-tour="family-budget"].note-card')
    expect(nt.minHeight, 'the tournament card did not come down').toBe('138px')
    expect(fb.minHeight, 'the budget card came down with it').toBe('186px')
  })

  it('⭐⭐ the venue painting is sized by the card’s HEIGHT past 768, at the mobile card’s own ratio', async () => {
    await homeAt(TABLET, enteredCareer('r36-review-venue'))
    const art = css('.venue-art')
    expect(art.height, 'the painting is still a flat pixel height').toBe('84%')
    expect(art.aspectRatio, 'it stopped keeping the mobile card’s proportion').toBe('112 / 136')
  })

  it('⚠ …and on a phone it is the export’s own 112x136, untouched', async () => {
    await homeAt(PHONE, enteredCareer('r36-review-venue'))
    expect(css('.venue-art').width, 'the phone’s venue art moved').toBe('112px')
    expect(css('.venue-art').height).toBe('136px')
  })
})

describe('round 36 review #5 – the bottom pair has its own grid and the two are equal', () => {
  it('⭐ below 1024 the wrapper has NO BOX, so not one phone pixel moves', async () => {
    await homeAt(PHONE)
    expect(css('.card-pair').display, 'the wrapper generates a box on a phone').toBe('contents')
  })

  it('⭐⭐ …and from 1024 it is a grid of two equal tracks, spanning the page', async () => {
    await homeAt(DESKTOP)
    const pair = css('.card-pair')
    expect(pair.display).toBe('grid')
    expect(pair.gridColumn, 'the pair does not span the page').toBe('1 / -1')
    expect(pair.gridTemplateColumns, 'the two are not equal').toBe('minmax(0, 1fr) minmax(0, 1fr)')
  })
})

describe('round 36 review #6 and #7 – the memory’s photograph and the type on both cards', () => {
  it('⭐ on a phone every one of the six values is the one that shipped', async () => {
    await homeAt(PHONE)
    expect(css('.memory-polaroid').width).toBe('68px')
    expect(css('.memory-polaroid').right).toBe('-4px')
    expect(css('.coach-line').fontSize).toBe('12px')
    expect(css('.coach-sign').fontSize).toBe('17px')
    expect(css('.memory-line').fontSize).toBe('17px')
    expect(css('.memory-when').fontSize).toBe('12.5px')
  })

  it('⭐⭐ …and from 768 the photograph is bigger, off the edge and toward the words', async () => {
    await homeAt(TABLET)
    const p = css('.memory-polaroid')
    expect(Number.parseFloat(p.width), 'the photograph did not grow').toBeGreaterThan(68)
    expect(p.width).toBe('104px')
    // «чуть дальше от края»: it hung 4px off the card and now sits 14px inside it.
    expect(p.right).toBe('14px')
  })

  it('⭐⭐ …and the type on both cards is one rung up, in the families they were already set in', async () => {
    await homeAt(TABLET)
    expect(css('.coach-line').fontSize).toBe('14px')
    expect(css('.coach-sign').fontSize).toBe('19px')
    expect(css('.memory-line').fontSize).toBe('20px')
    expect(css('.memory-when').fontSize).toBe('14px')
    // ⚠ AND NOT ONE OF THEM CHANGED FAMILY, which is the half a size assertion cannot see: he asked
    // for bigger, not for different.
    expect(css('.memory-line').fontFamily, 'the memory line left Caveat').toContain('Caveat')
    expect(css('.coach-sign').fontFamily, 'the signature left Caveat').toContain('Caveat')
    expect(css('.coach-line').fontFamily, 'the coach’s read left Manrope').toContain('Manrope')
  })
})

// =================================================================================================
// #8 – HOME FIRST IN THE RAIL
// =================================================================================================

describe('round 36 review #8 – Home leads the side menu', () => {
  it('⭐ it is the FIRST item on the rail, and the array the phone reads is untouched', async () => {
    await homeAt(DESKTOP)
    const home = document.querySelector('#app > nav.tab-bar .tab-btn[data-tour="tab-home"]')
    expect(home, 'there is no Home tab to lead with').toBeTruthy()
    expect(getComputedStyle(home!).order, 'Home is not first on the rail').toBe('-1')
    // The bottom bar's own order is `TABS`, and its middle seat is Home – the property
    // tests/round13-nav.test.ts pins. Nothing here may move it.
    const ids = [...document.querySelectorAll('#app > nav.tab-bar .tab-btn')].map((b) =>
      (b.getAttribute('data-tour') ?? '').replace('tab-', ''),
    )
    expect(ids[Math.floor(ids.length / 2)], 'the document order stopped putting Home in the middle').toBe('home')
  })

  it('⚠ …and on a phone no tab carries an order at all', async () => {
    await homeAt(PHONE)
    const home = document.querySelector('#app > nav.tab-bar .tab-btn[data-tour="tab-home"]')!
    // happy-dom returns '' for a property no rule sets, which is the same claim as `0`.
    expect(['', '0'], 'the phone bar was re-ordered').toContain(getComputedStyle(home).order)
  })
})

// =================================================================================================
// #9 – COACHING BUDGET CARRIES MORE
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: dropping `committedCents` back out of RailDashboard.vue reddens the first arm
// by finding one legend line where two are expected.

describe('round 36 review #9 – the dashboard is pinned to the menu, and one card says more', () => {
  it('⭐ the tiles hang off the navigation above them rather than off the foot of the window', async () => {
    await homeAt(DESKTOP)
    expect(css('#app > nav.tab-bar > .rail-dash').marginTop, 'the cards are still pushed to the foot').toBe('0px')
  })

  it('⭐⭐ «больше информации» is the METER’S OWN SET, and every figure is the meter’s computed', async () => {
    const snap = careerSnapshot(CAREER_WEEKS, CAREER_SEED)
    await homeAt(DESKTOP, snap)
    const legend = [...document.querySelectorAll('#app > nav.tab-bar > .rail-dash .budget-legend')].map((p) =>
      (p.textContent ?? '').trim(),
    )
    expect(legend.length, 'the card gained no legend at all').toBe(2)
    expect(document.querySelector('#app > nav.tab-bar > .rail-dash .budget-bar'), 'the meter’s bar did not come with it').toBeTruthy()

    // ⚠⚠ REBUILT FROM THE SNAPSHOT'S OWN FIELDS, never read back off the market – the sibling file's
    // hard-won rule: comparing two renders of one computed is a SHARING claim and stays green on any
    // arithmetic at all.
    const committed = snap.coachMarket.find((r) => r.current)?.weeklyCents ?? 0
    const cap = snap.coachBilling.weeklyIncomeCents
    expect(legend[0], 'the committed figure is not the engine’s').toBe(`${formatCents(committed)} committed`)
    expect(legend[1], 'the weekly cap is not the engine’s').toBe(`${formatCents(cap)} weekly cap`)
  })

  it('⚠ …and the two words are the market’s own, not a new pair invented for the rail', () => {
    // The round's rule where the frame and the app differ: take the words off the surface the data
    // already lives on. Both are `.budget-legend`'s, verbatim – the same check the sibling file makes
    // for the three card titles, and the reason «no new strings» survives this item.
    const market = sfc('../../src/components/screens/CoachMarketScreen.vue')
    expect(market, 'the market stopped saying «committed»').toContain(' committed')
    expect(market, 'the market stopped saying «weekly cap»').toContain(' weekly cap')
  })
})

// =================================================================================================
// #18 – NO BUTTON OVER 500, CENTRED
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: removing the cap from src/style.css reddens the tablet arm with `none`.

describe('round 36 review #18 – the app’s CTA pill is capped and centred', () => {
  it('⭐ on a phone it is uncapped, because nothing there can reach 500 anyway', async () => {
    setViewport(PHONE)
    wrapper = await mountShell(careerSnapshot(6, 'r36-review-cap'))
    const probe = document.createElement('button')
    probe.className = 'primary tb-pill tb-pill--cta'
    document.querySelector('#app')!.appendChild(probe)
    const cs = getComputedStyle(probe)
    // happy-dom returns '' for a property no rule sets – the same claim as `none`.
    expect(['', 'none'], 'a phone box moved').toContain(cs.maxWidth)
  })

  it('⭐⭐ …and from 768 it stops at his 500 and centres itself inside the frame', async () => {
    setViewport(TABLET)
    wrapper = await mountShell(careerSnapshot(6, 'r36-review-cap-wide'))
    const probe = document.createElement('button')
    probe.className = 'primary tb-pill tb-pill--cta'
    document.querySelector('#app')!.appendChild(probe)
    const cs = getComputedStyle(probe)
    expect(cs.maxWidth, 'his cap is not on').toBe('500px')
    // «с выравниванием по центру», and `display: block` is what makes auto margins do it to a button.
    expect(cs.display, 'a button is inline-level, so auto margins would not centre it').toBe('block')
    expect(cs.marginLeft).toBe('auto')
    expect(cs.marginRight).toBe('auto')
  })
})
