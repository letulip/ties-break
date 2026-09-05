// ⭐⭐⭐ ROUND 36 PHASE 6 – THE RAIL'S MINI-DASHBOARD, MOUNTED.
//
// The owner's ruling of 04.09, in his own words:
//
//   «Надо создать новые компоненты и показывать их только на десктоп.»
//   «Карточки сквозные, одинаковые, как мини-дашборд живут всегда в вертикальной полоске, т.е. на
//    всех страницах.»
//   «Никаких контролов новых они не поставят, это просто шорт-кат с информацией из внутренних
//    разделов.»
//
// ⚠⚠ THIS FILE MEASURES THE HALF `e2e/parity.spec.ts` CANNOT. The browser suite proves the region is
// there, is desktop-only, holds no control and shows nothing the phone cannot reach. What it cannot
// cheaply prove is that each card prints THE SAME STRING AS THE SURFACE IT SHORTCUTS TO – for that
// you want one world and two components mounted against it, which is what §2 does. It is exactly the
// shape of `round28-household-shared.test.ts`, and for the same stated reason: two surfaces quoting
// one figure from two computations drift apart on the first template edit, and this app has already
// shipped that defect once (the coaching meter reading the roster row instead of `coachBilling`).
//
// ⚠ WHY §1 MOUNTS `App.vue` INTO A REAL `#app`. The dashboard's rules are keyed on
// `#app:has(> nav.tab-bar) > nav.tab-bar > .rail-dash` – it is a child of the rail, and the rail is
// the first column of the frame – and `@vue/test-utils` mounts into an anonymous div where that
// selector matches nothing. The whole argument, and the trap under it, is in
// `round36-desktop-shell.test.ts`'s header; this file borrows its `mountShell`.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read: happy-dom evaluates a media query on an
// element's FIRST computed-style read and caches it (measured in round 36 phase 2, written down
// beside `TABLET` in fits.ts).
//
// ⚠ MUTATION-VERIFIED – what each mutation actually reddened is recorded in docs/rounds/round-36.md
// under phase 6, including the two that did NOT bite here.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { regionToLast } from '../helpers/source'
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import RailDashboard from '../../src/components/RailDashboard.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { createWorld, enterEvent, toSnapshot } from '../../src/engine/world'
import type { SeasonEvent } from '../../src/engine/season/types'
import { formatCents } from '../../src/shared/money'
import { weekLabel } from '../../src/shared/dates'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

// This runner has no web storage and the shell reads it at setup – the same shim, and the same
// argument, as round28-top-notices.test.ts: the browser's own object is supplied rather than the
// component weakened to suit the runner.
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

/** ⚠ THE PATH IS A PLAIN VARIABLE AND NEVER AN INLINE LITERAL, and this file paid for the lesson
 *  before it was written down here: Vite rewrites `new URL('…', import.meta.url)` into its own asset
 *  resolver, and under this runner the result is an http URL, so `readFileSync` throws «The URL must
 *  be of scheme file». That is exactly why `tests/worldSource.ts`'s `componentFile()` – whose `SRC`
 *  is built from an inline literal – CANNOT be used from the `component` project at all, and it is
 *  the same trap `tests/helpers/career.ts`'s header names. `round36-desktop-shell.test.ts` carries
 *  the identical helper for the identical reason.
 *
 *  ⚠ AND IT IS STILL THE `.vue` ALONE, which is what the negative claims below require (CLAUDE.md's
 *  pin hygiene): this reads one file and never widens to the composables it imports. */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
}

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** The tab shell, on screen, inside an element with the id the shipped page gives it. Carried from
 *  `round36-desktop-shell.test.ts`; every line of it is argued there. */
async function mountShell(snapshot: Snapshot): Promise<VueWrapper> {
  const store = useGameStore()
  const wrapper = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
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
  return wrapper
}

/** The dashboard alone, against a snapshot – it takes no props, so there is nothing to hand it. */
function mountDash(snapshot: Snapshot): VueWrapper {
  useGameStore().snapshot = snapshot
  return mount(RailDashboard, { global: { stubs: { teleport: true } } })
}

/** A career with ONE event on the calendar, entered – the state the «My entries» card needs, and the
 *  same shape `round26-span-gate-ui.test.ts` builds it in. Week 3 rather than week 1 because
 *  `snapshot.upcoming` is filtered to `week > world.week` and an event she is already playing is not
 *  an entry she is holding. */
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
  // ⚠⚠ TWO EVENTS AND ONE ENTRY, AND THE SECOND EVENT IS NOT DECORATION. With a single event on the
  // calendar, «the entered ones» and «all of them» are the SAME LIST – so the arm below would be
  // green on a predicate that had stopped filtering at all. Measured: with one event, replacing
  // `enteredEvents`' filter with `slice()` reddened only the negative arm; with two, it reddens the
  // positive one too. A world that cannot tell the mutation from the truth is not a fixture.
  world.season = [event(1), event(2)]
  enterEvent(world, `${seed}-local-1`)
  return toSnapshot(world)
}

const title = (w: VueWrapper): string[] => w.findAll('.rail-dash-title').map((e) => e.text())
const figure = (w: VueWrapper): string[] => w.findAll('.rail-dash-figure').map((e) => e.text())

// =================================================================================================
// §1 – WHERE IT LIVES, AND WHEN IT IS ON SCREEN
// =================================================================================================
// MUTATION-VERIFIED, each applied alone:
//   * `.rail-dash { display: none }` deleted -> the phone arm and the tablet arm, together;
//   * the 1024 rung (`#app:has(> nav.tab-bar) > nav.tab-bar > .rail-dash`) deleted -> the desktop arm
//     alone, with the phone and tablet arms still green - which is the pair that makes «desktop-only»
//     a claim rather than «never drawn».
describe('round 36 phase 6 – the dashboard lives in the rail, and only on a desktop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  it('⭐ it is a child of the one navigation the app has – not a second rail beside it', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountShell(careerSnapshot(4, 'r36-rail-dash-home'))
    // «Живут всегда в вертикальной полоске» – the strip IS `nav.tab-bar` past 1024 (phase 3), so
    // being inside it is the whole of «on every page»: the shell owns it and no screen draws it.
    expect(wrapper.findAll('.rail-dash').length, 'exactly one dashboard').toBe(1)
    expect(
      wrapper.findAll('nav.tab-bar > .rail-dash').length,
      'the dashboard is a DIRECT child of the rail - the parity exemption is scoped to exactly that',
    ).toBe(1)
    wrapper.unmount()
  })

  it('⭐⭐ desktop-only, and it is the stylesheet that says so rather than a `v-if`', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountShell(careerSnapshot(4, 'r36-rail-dash-desktop'))
    const dash = wrapper.find('.rail-dash')
    expect(dash.exists(), 'the block is rendered').toBe(true)
    expect(getComputedStyle(dash.element).display, 'and it is laid out on a desktop').toBe('flex')
    wrapper.unmount()
  })

  for (const [name, viewport] of [
    ['a phone', PHONE],
    ['a tablet', TABLET],
  ] as const) {
    it(`⚠ …and on ${name} it draws nothing at all`, async () => {
      assertSheetPresent()
      setViewport(viewport)
      const wrapper = await mountShell(careerSnapshot(4, `r36-rail-dash-${name.replace(/\s/g, '-')}`))
      // ⚠ THE ELEMENT IS STILL IN THE DOM, AND THAT IS THE DESIGN. `display: none` gives it no box,
      // no paint and no accessibility node, so nothing below 1024 moves - which is this round's
      // identity contract - while the breakpoint stays written in exactly one place (the ladder at
      // the top of src/style.css). A `v-if` on a media query would be a second copy of 1024.
      const dash = wrapper.find('.rail-dash')
      expect(dash.exists(), 'the block is in the DOM at every width').toBe(true)
      expect(
        getComputedStyle(dash.element).display,
        `the rail dashboard is drawn on ${name}, and it is his desktop-only feature`,
      ).toBe('none')
      wrapper.unmount()
    })
  }
})

// =================================================================================================
// §2 – EVERY FIGURE IS THE SURFACE'S OWN. ONE WORLD, TWO COMPONENTS, THE SAME STRING.
// =================================================================================================
// ⚠⚠ THIS IS THE LOAD-BEARING BLOCK IN THIS FILE. A rail card is a SHORTCUT; the moment it computes
// its own version of a number, the desktop shows two answers to one question SIDE BY SIDE - the card
// in the rail and the screen in the column, on screen at the same moment. That is strictly worse
// than the round-28 defect this pattern was invented for, where the two surfaces were at least on
// different tabs.
//
// MUTATION-VERIFIED, each applied alone – see the ledger for the two that did not bite.
describe('round 36 phase 6 – each card prints what the screen it shortcuts to prints', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  it('⭐⭐ «In the account» is Home\'s own balance, to the character', () => {
    const snap = careerSnapshot(6, 'r36-dash-funds')
    const dash = mountDash(snap)
    const home = mount(HomeScreen, {
      props: { recapFresh: false },
      global: { stubs: { teleport: true } },
    })

    const onHome = home.find('.budget-total').text()
    // ⚠ REBUILT FROM THE SNAPSHOT rather than read back off the other component, so this cannot pass
    // by comparing a thing with itself: the claim is that BOTH render `formatCents(fundsCents)`.
    expect(onHome, "Home's Family-budget card prints the balance").toBe(formatCents(snap.fundsCents))
    expect(
      figure(dash)[0],
      'the rail card and the Family-budget card disagree about the balance',
    ).toBe(onHome)
    expect(title(dash)[0]).toBe('In the account')
    dash.unmount()
    home.unmount()
  })

  it('⭐⭐ «Coaching budget» is the Coach Market meter\'s own free figure', async () => {
    const snap = careerSnapshot(6, 'r36-dash-coach')
    const dash = mountDash(snap)
    const market = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
    await nextTick()

    // ⚠⚠ REBUILT FROM THE SNAPSHOT'S OTHER FIELDS, never read back off the other component – and
    // this file's first draft got it wrong in exactly the way CLAUDE.md warns about. Comparing the
    // two RENDERS is a SHARING claim only: mutate the shared computed and both move together, so the
    // arm stays green on any arithmetic at all. It is the «comparing a thing with itself yields a
    // byte-identical diff» failure, measured here rather than argued: `freeCents` reduced to the cap
    // alone reddened `round21-coach.test.ts` and left this arm passing. So the expected value is the
    // engine's own two fields, and the sharing claim is the SECOND assertion below.
    const expectedFree =
      snap.coachBilling.weeklyIncomeCents -
      (snap.coachMarket.find((r) => r.current)?.weeklyCents ?? 0)
    expect(expectedFree, 'this career has room in the budget, or the arm measures a floor').toBeGreaterThan(0)

    const onMarket = market.find('.budget-free strong').text()
    expect(onMarket, 'the market draws the free figure the engine implies').toBe(formatCents(expectedFree))
    expect(
      figure(dash)[1],
      'the rail card and the budget meter disagree about what is free this week. They read one ' +
        'computed (`composables/coachingBudget.ts`) precisely so they cannot.',
    ).toBe(onMarket)
    expect(title(dash)[1]).toBe('Coaching budget')
    dash.unmount()
    market.unmount()
  })

  it('⭐⭐ «My entries» is the Season strip\'s own list, entry for entry', () => {
    const snap = enteredCareer('r36-dash-entries')
    expect(snap.upcoming.filter((e) => e.entered).length, 'the career really is entered for one').toBe(1)

    const dash = mountDash(snap)
    const season = mount(SeasonScreen, { global: { stubs: { teleport: true } } })

    // ⚠ THE EXPECTED LIST IS BUILT FROM THE SNAPSHOT, for the reason spelled out in the coaching arm
    // above: two renders of one predicate agree with each other whatever the predicate says.
    const expected = snap.upcoming
      .filter((e) => e.entered)
      .map((e) => `${e.label} · ${weekLabel(e.week)}`)
    const strip = season.findAll('.entries-strip .pill').map((p) => p.text())
    expect(strip, 'the Season strip drew the entries the snapshot holds').toEqual(expected)
    expect(
      dash.findAll('.rail-dash-entry').map((p) => p.text()),
      'the rail card and the Season strip disagree about what she is entered for',
    ).toEqual(strip)
    expect(title(dash)[2]).toBe('My entries')
    dash.unmount()
    season.unmount()
  })

  it('⚠ …and the card is SILENT with nothing entered, exactly as the strip is', () => {
    // The negative half, so the arm above cannot pass on a card that always draws a list.
    const snap = careerSnapshot(2, 'r36-dash-no-entries')
    expect(snap.upcoming.filter((e) => e.entered).length, 'this career has entered nothing').toBe(0)
    const dash = mountDash(snap)
    const season = mount(SeasonScreen, { global: { stubs: { teleport: true } } })
    expect(season.find('.entries-strip').exists(), 'the Season strip is silent').toBe(false)
    expect(title(dash), 'so the rail draws two cards and not three').toEqual([
      'In the account',
      'Coaching budget',
    ])
    dash.unmount()
    season.unmount()
  })
})

// =================================================================================================
// §3 – IT IS INFORMATION, NOT A CONTROL – AND THAT IS HIS CONSTRAINT, NOT OUR TASTE
// =================================================================================================
describe('round 36 phase 6 – the cards put no control on the desktop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐⭐ nothing in the rendered dashboard is pressable, with the entries card up', () => {
    const dash = mountDash(enteredCareer('r36-dash-no-controls'))
    expect(dash.findAll('button').length, 'a button is inside the rail dashboard').toBe(0)
    expect(dash.findAll('a').length, 'a link is inside the rail dashboard').toBe(0)
    expect(dash.findAll('input, select, textarea, summary').length).toBe(0)
    expect(dash.findAll('[tabindex]').length, 'a focus stop is inside the rail dashboard').toBe(0)
    expect(dash.findAll('[role]').length, 'an explicit role is inside the rail dashboard').toBe(0)
    dash.unmount()
  })

  it('⚠⚠ …and the FILE declares no handler, which is the half a render cannot show', () => {
    // ⚠ A NEGATIVE CLAIM ABOUT THIS FILE, SO IT READS THE `.vue` ALONE (`componentFile`, never
    // `componentLogic` – tests/pin-hygiene.test.ts enforces the distinction mechanically). It is the
    // one net that catches a Vue listener: `@click` on a div attaches no DOM attribute, so the
    // rendered checks above and `e2e/parity.spec.ts`'s accessibility net would both miss it.
    // ⚠ CUT WITH THE MARKER HELPER, never a raw `indexOf` slice: `regionToLast` THROWS when a marker
    // rots, where `slice(indexOf(...))` silently returns the whole file (CLAUDE.md's ratchet, and
    // `npm run pins:check` refused this file's first draft for exactly that line).
    const template = regionToLast(
      sfc('../../src/components/RailDashboard.vue'),
      '<template>',
      '</template>',
    )
    for (const forbidden of ['@click', 'v-on', '<button', 'IconButton', 'tabindex', 'role=']) {
      expect(
        template.includes(forbidden),
        `RailDashboard.vue's template carries \`${forbidden}\`. His ruling: the cards are a shortcut ` +
          'to information and put no new controls up. If a card wants one, that is a question for ' +
          'him - and it also moves the parity exemption\'s boundary.',
      ).toBe(false)
    }
  })
})

// =================================================================================================
// §4 – THE THREE TITLES WERE TAKEN, NOT INVENTED
// =================================================================================================
describe('round 36 phase 6 – no new strings beyond the three card titles', () => {
  it('⭐ every title is already a phrase on the surface the figure lives on', () => {
    // ⚠ THE ROUND'S RULE WHERE THE FRAME AND THE APP DIFFER: «take the title from the surface the
    // data already lives on rather than from the frame». All three do, so the suspension of «no new
    // strings» costs the app no new vocabulary at all - only three new PLACES for three words it
    // already says. `AC` writes them in capitals; `Eyebrow` uppercases in CSS, so even the case is
    // the app's own rule rather than a second spelling.
    expect(
      sfc('../../src/components/screens/MoneyScreen.vue'),
      'the Family Budget screen is where «in the account» is already said',
    ).toContain('in the account')
    expect(
      sfc('../../src/components/screens/CoachMarketScreen.vue'),
      'the market\'s meter is where «Coaching budget» is already said',
    ).toContain('Coaching budget')
    expect(
      sfc('../../src/components/screens/SeasonScreen.vue'),
      'the Season strip is where «My entries» is already said',
    ).toContain('My entries')
  })
})
