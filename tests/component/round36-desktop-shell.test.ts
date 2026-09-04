// ⭐⭐⭐ ROUND 36 PHASE 3 – THE DESKTOP SHELL, MOUNTED.
//
// The owner's design for 1024–1200, in his own words (quoted in full in
// docs/specs/responsive-2026-09.md and docs/rounds/round-36.md):
//
//   «Рельса слева, на всю высоту, скроллится при переполнении, одинаковая на каждой странице.»
//   «Жёлтая кнопка как на мобиле – прижата к низу с отступом от края, дополнительных слов возле
//    кнопки нет.»
//
// ⚠⚠ THE RAIL IS THE BOTTOM BAR STANDING UP, AND THAT IS THE ONLY READING HIS OWN ACCEPTANCE
// CRITERION ALLOWS. A rail that DUPLICATED the five tabs would put five buttons on a desktop that
// are not on a phone, and `e2e/parity.spec.ts` fails «ничего нового по идее не должно появиться» by
// name. So there is one `nav.tab-bar` at every width and the media query only re-lays it – which is
// what the first block below measures, from both ends.
//
// ⚠ WHY THIS FILE MOUNTS `App.vue` INTO A REAL `#app`. The rail's rules are keyed on
// `#app:has(> nav.tab-bar)` – the frame is the grid and the bar is its first column – and
// `@vue/test-utils` mounts into an anonymous div, where that selector matches nothing and every
// assertion below would pass on a build with no rail at all. The container is given the id the
// shipped `index.html` gives it, which is the only thing that makes this measurement real.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read: happy-dom evaluates a media query on an
// element's FIRST computed-style read and caches it (measured in round 36 phase 2, written down
// beside `TABLET` in fits.ts). Setting the width after the mount reads the previous test's screen.
//
// ⚠ MUTATION-VERIFIED – see the note above each block for what each mutation reddened.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { region } from '../helpers/source'
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

// This runner has no web storage and three of the screens below read it at setup. The same shim,
// and the same argument, as tests/component/round28-top-notices.test.ts: the browser's own object is
// supplied rather than the component weakened to suit the runner.
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

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** ⚠ THE PATH IS A PLAIN VARIABLE AND NEVER AN INLINE LITERAL, which round30-next-tournament-layout
 *  records the reason for: Vite rewrites `new URL('…', import.meta.url)` into its own asset
 *  resolver, and under this runner the result is not a `file:` URL, so the read throws on a path
 *  nobody wrote. Regions are cut with `helpers/source`, which throws on an absent marker. */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

function sheet(): string {
  return sfc('../../src/style.css')
}

/**
 * The tab shell, on screen, INSIDE an element with the id the shipped page gives it.
 *
 * The store is filled after the mount for the reason round28-top-notices.test.ts records at length:
 * `App.vue` calls `game.init()` in `onMounted`, which reaches for a Web Worker this runner has not
 * got, so the store flips to `recovery` and the shell draws the storage-failure screen instead of
 * the game. Letting that settle and THEN declaring the store ready is what puts the tabs up.
 */
async function mountShell(): Promise<VueWrapper> {
  const store = useGameStore()
  // `attachTo` is mandatory rather than tidy: happy-dom applies no rule at all to a detached tree,
  // so every computed value below would be an initial one (round17-surfaces.test.ts's header).
  const wrapper = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  await flushPromises()
  store.snapshot = careerSnapshot(4, 'r36-desktop-shell')
  store.ready = true
  store.phase = 'ready'
  await nextTick()
  wrapper.findComponent(SplashScreen).vm.$emit('done')
  await nextTick()
  // ⚠⚠ THE ID GOES ON THE ELEMENT THAT REALLY IS THE FRAME, AND IT IS FOUND RATHER THAN MADE.
  // `@vue/test-utils` mounts into a div of its own (`vue-test-utils.cjs.js`: `document.createElement`
  // then `attachTo.appendChild`), and `App.vue` has SEVERAL root nodes – so that div is the parent
  // of the bar, exactly as `#app` is in the shipped `index.html`. Creating our own wrapper and
  // passing it as `attachTo` puts VTU's div BETWEEN the two, and `:has(> nav.tab-bar)` is a CHILD
  // selector – every rail assertion below would then pass on a build with no rail at all. The id is
  // set before anything is measured, and nothing here has read a computed style yet.
  const bar = wrapper.find('nav.tab-bar')
  if (!bar.exists()) throw new Error('the shell drew no navigation – there is no frame to name')
  const container = bar.element.parentElement
  if (!container) throw new Error('the bar has no parent – #app cannot be named')
  container.id = 'app'
  return wrapper
}

function frame(): HTMLElement {
  const el = document.querySelector<HTMLElement>('#app')
  if (!el) throw new Error('the shell was not mounted into #app – the rail rules key on that id')
  return el
}

/** A real career through the real protocol, for the two screens that need one of their own. */
function screenSnapshot(seed: string): Snapshot {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

// =================================================================================================
// THE RAIL
// =================================================================================================
// MUTATION-VERIFIED, each applied alone:
//   * the `#app:has(> nav.tab-bar)` grid rule deleted -> the frame arm and the column arm;
//   * `position: sticky` on the rail reverted to `fixed` -> the standing-up arm alone;
//   * the `#app:has(> nav.tab-bar) > .app-content { width: 100% }` rule deleted -> the fill arm
//     alone (and that rule is not cosmetic: without it a grid item with auto inline margins falls
//     back to max-content, which measured 698.89px of a 948px track on Season in Chromium).
describe('round 36 phase 3 – the bar stands up and becomes the rail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  it('⭐ the frame is two columns on a desktop, and the rail is the first of them', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountShell()
    const shell = getComputedStyle(frame())
    expect(shell.display, 'the frame lays a grid once there is a bar to put in it').toBe('grid')
    expect(
      shell.gridTemplateColumns.replace(/\s+/g, ' '),
      'the rail takes a fixed strip and the page takes the rest',
      // happy-dom resolves the `var()` and leaves the rest, so this reads the rail's own 196px as
      // well as the shape of the frame.
    ).toBe('196px minmax(0, 1fr)')

    const bar = wrapper.find('nav.tab-bar')
    expect(bar.exists(), 'the shell drew its navigation, or this measures nothing').toBe(true)
    const rail = getComputedStyle(bar.element)
    expect(rail.gridColumn.replace(/\s+/g, ''), 'the bar is the first column').toBe('1')
    // ...and the page is the second, which is the half that makes the first a claim.
    const main = wrapper.find('main.app-content')
    expect(main.exists(), 'the shell drew a screen').toBe(true)
    expect(getComputedStyle(main.element).gridColumn.replace(/\s+/g, ''), 'the screen is the second').toBe('2')
    wrapper.unmount()
  })

  it('⭐ it stands up: a full-height sticky column that scrolls itself', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountShell()
    const rail = getComputedStyle(wrapper.find('nav.tab-bar').element)
    // «На всю высоту, скроллится при переполнении.» `sticky` rather than `fixed` is what lets the
    // rail be a COLUMN of the centred frame instead of a box positioned against the window – there
    // is no viewport arithmetic anywhere in this shell, which is why it survives the 1200px cap.
    expect(rail.position, 'the rail is a column of the frame, not a box on the window').toBe('sticky')
    expect(rail.top, 'and it holds the top of the page').toBe('0px')
    // `100vh`, resolved against this viewport's own height – so the assertion is «the rail is as
    // tall as the window», not «the rule spells vh».
    expect(rail.height, 'on the full height of the window').toBe(`${DESKTOP.height}px`)
    expect(['auto', 'scroll'].includes(rail.overflowY), 'and scrolls itself when it overflows').toBe(true)
    expect(rail.flexDirection, 'the tabs run down it, not across').toBe('column')
    wrapper.unmount()
  })

  it('⚠ …and the phone still has a bar across the bottom', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = await mountShell()
    const shell = getComputedStyle(frame())
    expect(shell.display === '' || shell.display === 'block', 'a phone frame is not a grid').toBe(true)
    const bar = getComputedStyle(wrapper.find('nav.tab-bar').element)
    expect(bar.position, 'the phone bar is pinned to the window').toBe('fixed')
    expect(bar.bottom, 'at the bottom of it').toBe('0px')
    expect(bar.flexDirection === '' || bar.flexDirection === 'row', 'and the tabs run across').toBe(true)
    wrapper.unmount()
  })

  it('⚠ …and so does the tablet – the plateau at 900 is a tablet, not a small desktop', async () => {
    assertSheetPresent()
    setViewport(TABLET)
    const wrapper = await mountShell()
    expect(getComputedStyle(frame()).display === '' || getComputedStyle(frame()).display === 'block').toBe(true)
    expect(getComputedStyle(wrapper.find('nav.tab-bar').element).position).toBe('fixed')
    wrapper.unmount()
  })

  it('⭐⭐ the rail IS the navigation – there is one nav and it holds all five tabs', async () => {
    // «Одинаковая на каждой странице» is satisfied by the bar being the SHELL's, which it has always
    // been; what this arm holds is the other half of his criterion – that standing it up did not
    // grow a second one. A duplicated rail is the exact failure `e2e/parity.spec.ts` would name at
    // 1280, and this is the same claim one layer in, where it is cheap to run.
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountShell()
    expect(wrapper.findAll('nav.tab-bar').length, 'exactly one navigation').toBe(1)
    const labels = wrapper.findAll('nav.tab-bar .tab-btn').map((b) => b.attributes('aria-label'))
    expect(labels, 'the same five tabs the phone carries, in the same order').toEqual([
      'Season',
      'Calendar',
      'Home',
      'Stats',
      'Trophies',
    ])
    // Every tab keeps its icon and its label: «все иконки наши, ничего нового и ничего старого».
    expect(wrapper.findAll('nav.tab-bar .tab-icon').length, 'every tab keeps its icon').toBe(5)
    expect(wrapper.findAll('nav.tab-bar .tab-label').length, 'and its label').toBe(5)
    wrapper.unmount()
  })

  it('⚠ the reading column fills its track – the auto-margin trap, pinned', async () => {
    // ⚠⚠ THIS IS A REGRESSION PIN ON A DEFECT THAT SHIPPED FOR ONE BUILD OF THIS PHASE.
    // `.app-content` is `max-width: var(--app-col-max); margin: 0 auto`, and a grid item with AUTO
    // INLINE MARGINS does not stretch: auto margins beat `justify-self: stretch`, so the box falls
    // back to max-content and the margins centre what is left. Measured in Chromium: Home filled its
    // 948px track (its cards are wider than that) and Season came out 698.89px wide with 124px of
    // page down each side. The same screen at the same width, two different column widths, from one
    // declaration written for a block layout.
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountShell()
    expect(getComputedStyle(wrapper.find('main.app-content').element).width, 'the column fills the track').toBe(
      '100%',
    )
    wrapper.unmount()
  })
})

// =================================================================================================
// THE FLOATING CTA
// =================================================================================================
// MUTATION-VERIFIED: `--app-bar-left`'s 1024 rung deleted -> the offset arm alone;
// `--app-bar-bottom`'s 1024 rung deleted -> the margin arm alone; either literal put back into one
// of the three boxes -> the three-copies arm alone.
describe('round 36 phase 3 – the yellow button is the mobile one, moved off the corner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  function tokenAt(vp: typeof PHONE, name: string): string {
    setViewport(vp)
    // A fresh element, because a media query is cached on an element's first read.
    const probe = document.createElement('div')
    document.body.appendChild(probe)
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).replace(/\s+/g, ' ').trim()
    probe.remove()
    return value
  }

  it('⭐ it is centred on the COLUMN once a rail takes a strip off the page', () => {
    assertSheetPresent()
    expect(tokenAt(PHONE, '--app-bar-left'), 'a phone has no rail, so the middle is the middle').toBe('50%')
    expect(tokenAt(TABLET, '--app-bar-left'), 'and neither has a tablet').toBe('50%')
    // ⚠ THE VALUE COMES BACK WITH THE RAIL'S OWN TOKENS ALREADY SUBSTITUTED (happy-dom resolves a
    // `var()` and leaves the `calc()` unevaluated), so this reads the two numbers the shell was
    // built with as well as the shape of the offset.
    expect(
      tokenAt(DESKTOP, '--app-bar-left'),
      'a desktop shifts it by half the strip the rail takes',
    ).toBe('calc(50% + (196px + 24px) / 2)')
  })

  it('⭐ …and it sits a margin off the bottom edge, because there is no bar to clear', () => {
    assertSheetPresent()
    // 58px is «clear of the 52px bar plus six». Past 1024 the bar is a rail down the left, so the
    // number stops being a clearance and becomes what he asked for in its place – «прижата к низу с
    // отступом от края». The frame's own top inset is that margin.
    expect(tokenAt(PHONE, '--app-bar-bottom'), 'a phone clears its bar').toBe('58px')
    expect(tokenAt(DESKTOP, '--app-pad-top'), 'the frame insets the page by 24px').toBe('24px')
    expect(tokenAt(DESKTOP, '--app-bar-bottom'), 'and a desktop CTA clears the edge by that').toBe('24px')
  })

  it('⚠ all three copies of the floating box read the tokens, not the numbers', () => {
    // Phase 1 found five rules carrying a literal 520 and phase 2 found two more; this is the same
    // shape of finding for the other two properties. The shell's own rule is in the sheet, and the
    // Calendar's and This Week's are copies of it in their own SFCs – so a token that only the sheet
    // reads would move one box of three and leave two behind, which is precisely how `.cal-go` and
    // `.week-proceed` kept a 520px cap through the whole of phase 1.
    const shellBar = region(sheet(), '.next-week-bar {', '}')
    expect(shellBar, "the shell's own button").toContain('left: var(--app-bar-left)')
    expect(shellBar).toContain('bottom: var(--app-bar-bottom)')
    const calendar = region(sfc('../../src/components/screens/CalendarScreen.vue'), '.cal-go {', '}')
    expect(calendar, "the calendar's advance CTA").toContain('left: var(--app-bar-left)')
    expect(calendar).toContain('bottom: var(--app-bar-bottom)')
    const week = region(sfc('../../src/components/screens/ThisWeekScreen.vue'), '.week-proceed {', '}')
    expect(week, "the story's Proceed").toContain('left: var(--app-bar-left)')
    expect(week).toContain('bottom: var(--app-bar-bottom)')
  })
})

// =================================================================================================
// HOME, AS FRAME AC LAYS IT
// =================================================================================================
// MUTATION-VERIFIED: `display: contents` reverted to `grid` -> the dissolve arm alone; the
// `grid-row: span 2` dropped from `.diary-hero` -> the span arm alone; the whole 1024 block moved
// out of its media query -> every arm here AND the phone arm below.
describe('round 36 phase 3 – Home is frame AC, and it is Home\'s own DOM re-flowed', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  function mountHome(vp: typeof PHONE) {
    setViewport(vp)
    useGameStore().snapshot = screenSnapshot('r36-home-desktop')
    return mount(HomeScreen, {
      props: { recapFresh: false },
      global: { stubs: { teleport: true } },
      attachTo: document.body,
    })
  }

  it('⭐ the notecard wrapper dissolves, so its four cards become cells of the page', () => {
    assertSheetPresent()
    const w = mountHome(DESKTOP)
    const grid = w.find('.card-grid')
    expect(grid.exists(), 'the wrapper is still in the DOM – nothing was deleted').toBe(true)
    // ⚠ `display: contents` removes only the WRAPPER's box. That is what lets the four notecards be
    // items of the shell's own grid without any of them moving in the DOM – and it is why
    // `e2e/parity.spec.ts` sees the same elements at 1280 that it sees at 375.
    expect(getComputedStyle(grid.element).display, 'the wrapper has no box of its own').toBe('contents')
    expect(w.findAll('.card-grid .note-card').length, 'and all four cards are still inside it').toBe(4)
    w.unmount()
  })

  it('⭐ the photograph stands beside them, two rows deep and capped', () => {
    assertSheetPresent()
    const w = mountHome(DESKTOP)
    const hero = getComputedStyle(w.find('.diary-hero').element)
    // AC lays the hero down the left with the next-tournament and family-budget cards stacked
    // beside it. A spanning item sizes the tracks it crosses, so when the photograph is the taller
    // of the pair the two cards grow to meet it and the row closes.
    expect(hero.gridRow.replace(/\s+/g, ' '), 'the hero spans the two card rows').toBe('span 2')
    // ...and `align-self: start` is what stops the reverse case from silently overriding the shape
    // token: a stretched box takes its height from the row and its width from the column, and the
    // aspect ratio is simply not applied. `--hero-aspect` has to stay honest here – it is the join
    // `.nt-hero` reads (tests/component/round30-next-tournament-layout.test.ts).
    expect(hero.alignSelf, 'and it keeps its own shape rather than the row\'s').toBe('start')
    expect(hero.maxWidth, 'capped at the width both heroes share').toBe('512px')
    w.unmount()
  })

  it('⚠ and the phone is untouched – the four cards are still a 2x2 grid of their own', () => {
    assertSheetPresent()
    const w = mountHome(PHONE)
    const grid = getComputedStyle(w.find('.card-grid').element)
    expect(grid.display, 'a phone still lays the notecards itself').toBe('grid')
    expect(grid.gridTemplateColumns.replace(/\s+/g, ' '), 'two up, as they have always been').toBe('1fr 1fr')
    const hero = getComputedStyle(w.find('.diary-hero').element)
    expect(hero.gridRow === '' || hero.gridRow === 'auto', 'and the hero spans nothing').toBe(true)
    // A3's full bleed, which the desktop drops and the phone must not: the photograph reaches both
    // edges of the screen by cancelling the shell's own gutter.
    expect(hero.marginLeft, 'the phone hero still breaks the gutter').toBe('calc(-1 * 16px)')
    w.unmount()
  })
})
