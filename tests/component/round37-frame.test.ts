// ⭐⭐⭐ ROUND 37, THIRD PASS – THE APP'S FRAME: THE MATCH'S WIDTH, THE RAIL, AND ONE WIDE BUTTON.
//
// Four items the owner filed off the stand on 06.09, all of them about the box the app is drawn in
// rather than about anything inside it. His words, in full, are in docs/rounds/round-37.md and on
// each rule in src/style.css; the short version of each is on its own describe below.
//
// ⚠ WHY MOUNTED AND NOT SOURCE-PINNED. Three of the four are media-query rules that only exist past
// 768 or past 1024, and one of them (item 12) is a token OVERRIDE that has to reach two elements it
// does not name. A grep for the declaration proves it was typed; only the cascade proves it arrives.
//
// ⚠ WHAT THIS LAYER CANNOT DO, AND WHERE IT IS DONE INSTEAD. happy-dom has no layout engine, so
// every `getBoundingClientRect()` here is zeros: «the label moved 16px left» and «the band under the
// rail is gone» are unaskable in this runner. `e2e/r37-frame.spec.ts` measures those in Chromium at
// real sizes, and the two layers are aimed at different halves on purpose – this one holds the
// CASCADE (which rule reaches which element at which width), that one holds the PIXELS.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read: happy-dom evaluates a media query on an
// element's FIRST computed-style read and then caches it (measured in round 36 phase 2, written down
// beside `TABLET` in fits.ts). Setting the width after the mount reads the previous test's screen.
//
// ⚠ MUTATION-VERIFIED – each block names what was reverted to watch it fail.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import TakeoverShell from '../../src/components/ui/TakeoverShell.vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import {
  createWorld,
  decideKnock,
  enterEvent,
  pendingKnock,
  tickWeek,
  toSnapshot,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import type { Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, availableWidth, lengthPx, setViewport, type Viewport } from './fits'

// This runner has no web storage and App.vue's screens read it at setup – the same shim, and the
// same argument, as round36-desktop-shell.test.ts: supply the browser's own object rather than
// weaken a component to suit the runner.
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

/** ⭐ ROUND 37 – the two rungs of his ladder item 12 lives on, as viewports this runner can set.
 *  900 is the top of the tablet band («768 как раз тоже можно до 900 тянуть») and 1024 is where the
 *  desktop begins; both are widths where the match's cap used to be 880 and is now the window. */
const TABLET_TOP: Viewport = { width: 900, height: 900 }
const DESKTOP_ENTRY: Viewport = { width: 1024, height: 800 }

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** The token ladder, read off the document the way a rule reads it. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function maxWidthOf(selector: string): string {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`${selector} is not on the screen – there is nothing to measure`)
  return getComputedStyle(el).maxWidth || 'none'
}

/**
 * A computed length that may still be wearing a `calc(-1 * …)`.
 *
 * ⚠ MEASURED, NOT ASSUMED: happy-dom substitutes `var()` but does NOT evaluate the arithmetic
 * around it, so the rail's `calc(-1 * var(--app-pad-x))` computes to the string
 * `calc(-1 * 16px)` – which `fits.ts`'s `lengthPx` reads as NaN («no bound»), correctly for its own
 * question and uselessly for this one. This is the same shape written three times on that rule, so
 * it is parsed once here rather than asserted as a string three times.
 */
function pxOf(value: string): number {
  const negated = /^calc\(\s*-1\s*\*\s*(-?[\d.]+)px\s*\)$/.exec(value.trim())
  if (negated) return -Number(negated[1])
  return lengthPx(value, 0)
}

/** A real match, played by the real engine – round36-phase4.test.ts's own fixture. */
function matchFixture() {
  const p = (over: Partial<MatchPlayer>): MatchPlayer => ({
    id: 'p',
    name: 'P',
    serve: 50,
    ret: 50,
    composure: 50,
    stamina: 50,
    groundstrokes: 50,
    ...over,
  })
  const a = p({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = p({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'r37-frame' }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

/**
 * The match, in the shell all four of its callers put it in.
 *
 * ⚠ THIS IS THE REAL COMPOSITION AND NOT A STAND-IN: TournamentFlow, PracticeFlow, MatchReplay and
 * Season's sandbox all pass `MatchViewer` as `TakeoverShell`'s default slot, so `.mv` is a child of
 * `.tf-body` in every one of them – which is the fact item 12's `:has()` selector reads.
 */
function mountMatchTakeover() {
  const { a, b, match } = matchFixture()
  return mount(TakeoverShell, {
    attachTo: document.body,
    props: { title: 'Clay Open' },
    slots: {
      default: () => h(MatchViewer, { match, playerA: a, playerB: b, surface: 'hard', mode: 'replay' }),
      exit: () => h('button', 'To result'),
    },
  })
}

/** The same shell with an ordinary screen in it – the control arm for every match-only claim. */
function mountPlainTakeover() {
  return mount(TakeoverShell, {
    attachTo: document.body,
    props: { title: 'Clay Open' },
    slots: { default: '<p>a screen in the body</p>', exit: '<button>To result</button>' },
  })
}

// =================================================================================================
// ITEM 12 – «В МАТЧЕ ШИРИНА ОКНА ВНУТРИ ОГРАНИЧЕНА 880PX … ДО 1024 РЕЗИНОВО РАСШИРЯТЬ»
// =================================================================================================
// ⚠⚠ THE POINT OF THE ITEM IS THAT THE TOKEN DID NOT MOVE. 880 is `--app-max-width`, and it caps
// THREE surfaces: the onboarding wizard (R14-9), the tour briefing, and – through
// `--takeover-col-max` – every takeover in the app. So the match overrides the token for its own
// subtree and the other two are asserted to be exactly where they were, which is the half a
// widening change gets wrong.
//
// MUTATION-VERIFIED, each applied alone:
//   * the `.tournament-flow:has(> .tf-body > .mv)` rule deleted -> both wide arms of the first
//     block go red («expected '880px' to be 'min(100%, 1024px)'»), the control arms stay green;
//   * the `@media (min-width: 768px)` gate around it removed -> the phone arm alone goes red
//     («expected '375px' to be '480px'» at 375, and the 576 arm with it) – which is the defect this
//     rule really shipped with for one measurement;
//   * `--mv-drawn`'s ceiling dropped from the 1024 track list -> the desktop track arm alone.
describe('round 37 item 12 – the match takes the width it is given, and only the match', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** `[header, body]` – the two boxes that make up the takeover's one column. */
  async function caps(vp: Viewport, mounter: () => VueWrapper): Promise<[string, string]> {
    setViewport(vp)
    const wrapper = mounter()
    await nextTick()
    const out: [string, string] = [maxWidthOf('.tf-top'), maxWidthOf('.tf-body')]
    wrapper.unmount()
    document.body.innerHTML = ''
    return out
  }

  it('⭐⭐ past 768 the match’s shell is the window, fluid to 1024 – header and body together', async () => {
    assertSheetPresent()
    // His sentence, as one declaration: «по ширине экрана место занимать и до 1024 резиново». The
    // `100%` term is the window (`.tf-body` is `width: 100%` in a full-screen takeover) and the
    // 1024 is where it stops. `e2e/r37-frame.spec.ts` measures what that computes to in pixels.
    const his = 'min(100%, 1024px)'
    expect(await caps(TABLET, mountMatchTakeover), 'at 768').toEqual([his, his])
    expect(await caps(TABLET_TOP, mountMatchTakeover), 'at 900').toEqual([his, his])
    expect(await caps(DESKTOP_ENTRY, mountMatchTakeover), 'at 1024').toEqual([his, his])
    expect(await caps(DESKTOP, mountMatchTakeover), 'at 1280').toEqual([his, his])
  })

  it('⭐⭐⭐ …and the token itself did NOT move – the wizard and the briefing keep their 880', async () => {
    assertSheetPresent()
    // THE LOAD-BEARING ARM. `--app-max-width` caps the onboarding wizard (R14-9) and the tour
    // briefing as well as the takeovers, and `tests/component/tour-briefing.test.ts` measures the
    // briefing's own 880 – it went red with «expected 1200 to be 880» the last time this token was
    // laddered. Item 12 is an override on ONE subtree, so the declaration is untouched.
    expect(token('--app-max-width'), 'the takeover cap is still 880').toBe('880px')
    expect(
      getComputedStyle(document.documentElement).getPropertyValue('--takeover-col-max').trim(),
      'and the takeovers’ own token is still the base 480 – the override is not on :root',
    ).toBe('480px')
    const cap = '880px'
    // ⚠⚠ AND THE OTHER HALF: A TAKEOVER WITH NO MATCH IN IT IS UNTOUCHED. This is the arm the
    // `:has()` scoping exists for, and it is the reason the selector is the DESCENDANT form. Probed
    // on happy-dom 06.09: it supports `:has()` but mis-evaluates a relative selector that starts
    // with a combinator – `.tournament-flow:has(> .tf-body > .mv)` matched the plain shell below as
    // well as the match's, so this arm was a false red, and it is also `round36-phase4.test.ts`'s
    // own «the header and the body read ONE token» arm. `:has(.mv)` answers correctly on both, and
    // nothing else in the app draws a `.mv`, so no precision is given up.
    expect(await caps(DESKTOP, mountPlainTakeover), 'a takeover with no match in it is untouched').toEqual([
      cap,
      cap,
    ])
    expect(await caps(TABLET, mountPlainTakeover), 'at 768 as well').toEqual([cap, cap])
  })

  it('⚠ …and below 768 not one pixel moves – 480 on a phone, match or no match', async () => {
    assertSheetPresent()
    // ⚠⚠ THIS ARM CAUGHT A REAL DEFECT AND IS THE REASON THE RULE IS GATED. `min(100%, 1024px)` cuts
    // BOTH ways: 480 is bigger than a 375px phone but SMALLER than a 576px one, so an ungated rule
    // took the friendly's viewer from 480 to 576 at exactly the owner's own screen width – and a 375
    // arm alone would have passed it, because there `100%` is 375 either way.
    const phone = '480px'
    expect(await caps(PHONE, mountMatchTakeover), 'at 375').toEqual([phone, phone])
    expect(await caps({ width: 576, height: 1280 }, mountMatchTakeover), 'at 576 – HIS screen').toEqual([
      phone,
      phone,
    ])
    expect(await caps({ width: 576, height: 1280 }, mountPlainTakeover), 'and the plain shell too').toEqual([
      phone,
      phone,
    ])
  })
})

// =================================================================================================
// ITEM 12, THE OTHER HALF – «КАК РАЗ ЗА СЧЕТ РАСШИРЕНИЯ ЧАТА»
// =================================================================================================
// Widening the shell is not the whole ask: he said where the room should go. Left alone, both of the
// viewer's frames spend it on the COURT's side – the tablet's `1fr` is the transport column and the
// desktop's `60%` is a ratio that grows with the shell – so the two track lists carry a ceiling now.
//
// ⚠ WHAT THIS RUNNER CAN AND CANNOT SEE. happy-dom substitutes `var()` into the track list but does
// not evaluate `max()` / `min()` / `calc()`, so what is asserted here is that the ceiling is IN the
// list and derived from the tokens rather than typed as a literal. The pixels it produces – 344 ->
// 364 -> 424 across the tablet band, and a court held at 508.8 while the log goes 329.2 -> 473.2 –
// are measured in `e2e/r37-frame.spec.ts`.
describe('round 37 item 12 – and the new room goes to the commentary', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  async function tracks(vp: Viewport): Promise<string> {
    setViewport(vp)
    const wrapper = mountMatchTakeover()
    await nextTick()
    const mv = document.querySelector('.mv')
    if (!mv) throw new Error('the viewer did not draw – there is nothing to measure')
    const list = getComputedStyle(mv).gridTemplateColumns.replace(/\s+/g, ' ').trim()
    wrapper.unmount()
    document.body.innerHTML = ''
    return list
  }

  it('⭐ the tablet’s commentary is 344 plus whatever the shell gained past the old cap', async () => {
    assertSheetPresent()
    const list = await tracks(TABLET)
    // The left track is untouched: `1fr` is the transport's column and it keeps the 494px it had.
    expect(list.startsWith('minmax(0, 1fr)'), `the transport column is still the flexible one (${list})`).toBe(
      true,
    )
    // `max(344px, …)` is what makes the tablet band stand still below the old cap and grow past it:
    // under 848 of shell the second term is negative and his 344 wins.
    expect(list, 'his 344 is the floor').toContain('max(344px')
    // ⚠ DERIVED, NOT TYPED. A literal 848 here would be a copy of two tokens – the `--app-pad-x`
    // lesson – so the ceiling is spelled out of them, and this runner resolves the `var()`s and
    // leaves the arithmetic, which is what makes the derivation itself readable.
    expect(list, 'and the shell it counts from is the two tokens, not an 848').toContain(
      'calc(880px - 2 * 16px)',
    )
  })

  it('⭐⭐ the desktop’s 60% court becomes a CEILING, so every new pixel is the log’s', async () => {
    assertSheetPresent()
    const list = await tracks(DESKTOP)
    expect(list, 'his AV ratio is still there').toContain('60%')
    expect(list, 'but it cannot grow past what it drew on the old shell').toContain('min(60%')
    expect(list, 'and that ceiling is derived from the same token').toContain(
      'calc(0.6 * calc(880px - 2 * 16px))',
    )
    expect(list.endsWith('minmax(0, 1fr)'), `the log is the track that gives (${list})`).toBe(true)
  })

  it('⚠ …and a phone has no grid at all, so neither ceiling is in its reach', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = mountMatchTakeover()
    await nextTick()
    const cs = getComputedStyle(document.querySelector('.mv')!)
    expect(cs.display, 'below 768 the viewer is the flex column it has always been').toBe('flex')
    expect(cs.flexDirection).toBe('column')
    wrapper.unmount()
  })
})

// =================================================================================================
// ITEM 13 – «КНОПКА NEXT ROUND ПО ПРЕЖНЕМУ ОЧЕНЬ ШИРОКАЯ, ДАВАЙ ТОЖЕ 500 ОГРАНИЧИМ»
// =================================================================================================
// «Тоже» – the same 500 round 36's review #18 put on every affirmative CTA, and the same sentence:
// «кнопок в 700 пикселей не должно быть, максимум 500 пожалуйста с выравниванием по центру».
//
// ⚠ WHY #18's SWEEP MISSED THIS ONE. That rule caps a CLASS – `PrimaryPill variant="cta"` – and a
// takeover's action row is a bare `<button class="primary">` in `.tf-actions`, which is a flex row
// with `flex: 1` on its children. A row holding a PAIR gives each half ~418px at 848 of shell, which
// is inside the cap; the spectate card is the one surface that puts a SINGLE button in that row, and
// a lone `flex: 1` child is a button as wide as its card.
//
// ⚠ THE LONE BUTTON ITSELF IS MEASURED IN CHROMIUM (`e2e/r37-frame.spec.ts`: 702 -> 500 at 768 and
// 814 -> 500 at 900, 1024 and 1280). Reaching the spectate card needs the worker – `showResult()` is
// an RPC – so what this layer holds is the rule and the ROOM: how wide a single child of that row
// would be if nothing capped it.
//
// MUTATION-VERIFIED, each alone:
//   * `.tf-actions button { max-width: 500px }` deleted -> the cap arm and the room arm;
//   * `.tf-actions { justify-content: center }` deleted -> the centring arm alone;
//   * the `@media (min-width: 768px)` gate widened to every width -> the phone arm alone.
describe('round 37 item 13 – a lone control in a takeover’s action row stops at 500', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** A career parked on a revealed tournament – round36-phase4.test.ts's own recipe. */
  function atTournament(seed: string): Snapshot {
    const world = createWorld(seed)
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 160; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* eligibility and caps are the engine's business */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) return toSnapshot(world)
    }
    throw new Error('no tournament reached – the fixture is broken, not the assertion')
  }

  /** The real row, on the real screen, at `vp`: its first control and the room the row has. */
  async function actionRow(vp: Viewport) {
    setViewport(vp)
    useGameStore().snapshot = atTournament('r37-item13')
    const wrapper = mount(TournamentFlow, { attachTo: document.body })
    await nextTick()
    // ⚠ THE FLOW OPENS ON ITS SPLASH AND THE ACTION ROW IS ONE PRESS IN. `beginFromSplash` is
    // synchronous – it only swaps the phase – so this runner can walk it without a worker, which is
    // exactly what `showResult()` (an RPC) is why the spectate card cannot be reached here.
    const begin = wrapper.findAll('button').find((b) => b.text().trim() === 'Begin')
    if (begin) {
      await begin.trigger('click')
      await nextTick()
    }
    const row = document.querySelector('.tf-actions')
    if (!row) throw new Error('the flow drew no action row – there is nothing to measure')
    const button = row.querySelector('button')
    if (!button) throw new Error('the action row holds no control')
    // ⚠ THE ROW'S CONTENT WIDTH IS WHAT A LONE `flex: 1` CHILD TAKES, which is exactly the spectate
    // card's shape. `availableWidth` walks every padding, border, margin and cap between the
    // document and the button's parent, so this is the real chain and not an assumption about it.
    // ⚠ THE ROW'S OWN DECLARATIONS ARE READ BEFORE THE WALK, and that is not tidiness. happy-dom
    // caches a computed declaration on the element and re-derives it when another element is
    // measured; `availableWidth` walks every ancestor, and a `cs.justifyContent` read after that
    // walk came back as the empty string while the same read before it came back as `center`
    // (measured 06.09, on this file). Everything this function needs off the row is taken up front.
    const cs = getComputedStyle(row)
    const rowStyle = {
      justify: cs.justifyContent,
      padLeft: cs.paddingLeft,
      padRight: cs.paddingRight,
    }
    const cap = lengthPx(getComputedStyle(button).maxWidth, 0)
    const outer = availableWidth(button, vp)
    const room =
      outer - (lengthPx(rowStyle.padLeft, outer) || 0) - (lengthPx(rowStyle.padRight, outer) || 0)
    wrapper.unmount()
    document.body.innerHTML = ''
    return { room, cap, justify: rowStyle.justify }
  }

  it('⭐⭐ the room is over 500 at every desktop width, and the cap is what holds it there', async () => {
    assertSheetPresent()
    for (const vp of [TABLET, TABLET_TOP, DESKTOP_ENTRY, DESKTOP]) {
      const { room, cap } = await actionRow(vp)
      // The precondition, asserted rather than assumed: without it the cap arm below would pass on a
      // row that was never wide enough to need capping.
      expect(room, `at ${vp.width} the row is wide enough for the cap to matter`).toBeGreaterThan(500)
      expect(cap, `at ${vp.width} a lone control in this row stops at 500`).toBe(500)
      expect(Math.min(room, cap), `at ${vp.width} that is what it takes across`).toBe(500)
    }
  })

  it('⭐ …and «с выравниванием по центру» – the row centres what is left', async () => {
    assertSheetPresent()
    // A capped `flex: 1` child leaves free space in the line, and a flex line's default
    // `flex-start` would leave the button against the left edge of the card. `#app .tb-pill--cta`
    // solves the same problem with `display: block` and auto margins; a flex child cannot.
    expect((await actionRow(DESKTOP)).justify, 'at 1280').toBe('center')
    expect((await actionRow(TABLET)).justify, 'at 768').toBe('center')
  })

  it('⚠ …and a phone is untouched: no cap, no centring, the room is under 500 anyway', async () => {
    assertSheetPresent()
    const { room, cap, justify } = await actionRow(PHONE)
    expect(Number.isNaN(cap), 'below 768 the button declares no width bound at all').toBe(true)
    expect(justify === '' || justify === 'normal' || justify === 'flex-start').toBe(true)
    expect(room, 'and it could not reach 500 there in any case').toBeLessThan(500)
  })
})

// =================================================================================================
// ITEMS 14 AND 15 – THE RAIL'S LEFT INSET, AND THE BAND UNDER IT
// =================================================================================================
// «На вертикальном рейле навигации на десктопе слева сделаем такой же отступ, как и справа (меньше
// то есть)», and «при прокручивании страницы вниз на десктоп под рейлом навигации остается пустое
// пространство 50-60 пикселей примерно».
//
// ⚠ THE TWO ARE ONE RULE'S TWO EDGES. The rail is pulled out of the frame's TOP and LEFT gutters by
// negative margins so it meets the frame's own edge, and the left gutter was then re-spent as the
// rail's own left padding so the labels kept the page's inset. Item 14 stops re-spending it; item 15
// adds the BOTTOM gutter to the list of edges the rail is pulled through, which is what the band
// turned out to be – `#app`'s own `--app-pad-bottom`, 48px, measured in Chromium and NOT the phone
// bottom bar's reservation, which lives inside `.app-content` in the other column.
//
// ⚠ MOUNTING `App.vue` INTO A REAL `#app` IS MANDATORY: every rail rule is keyed on
// `#app:has(> nav.tab-bar)` and VTU mounts into an anonymous div. Same helper, same reasoning, as
// round36-desktop-shell.test.ts.
//
// MUTATION-VERIFIED, each alone:
//   * the rail's `padding-left` put back to `calc(12px + var(--app-pad-x))` -> the item 14 arms;
//   * the rail's `margin-bottom` put back to `0` -> the item 15 arms;
//   * the negative left margin deleted -> the «the rail still meets the frame's edge» arm alone.
describe('round 37 items 14 and 15 – the rail’s own edges', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** The tab shell, on screen, inside an element with the id the shipped page gives it. */
  async function mountShell(): Promise<VueWrapper> {
    const store = useGameStore()
    const wrapper = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
    await flushPromises()
    store.snapshot = careerSnapshot(4, 'r37-frame')
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

  async function rail(vp: Viewport) {
    setViewport(vp)
    const wrapper = await mountShell()
    const cs = getComputedStyle(wrapper.find('nav.tab-bar').element)
    const out = {
      padLeft: cs.paddingLeft,
      padRight: cs.paddingRight,
      padTop: cs.paddingTop,
      marginLeft: cs.marginLeft,
      marginTop: cs.marginTop,
      marginBottom: cs.marginBottom,
      gridRow: cs.gridRow.replace(/\s+/g, ' ').trim(),
    }
    wrapper.unmount()
    document.body.innerHTML = ''
    return out
  }

  it('⭐⭐ ITEM 14 – the left inset is the right one: 12 against 12', async () => {
    assertSheetPresent()
    for (const vp of [DESKTOP_ENTRY, DESKTOP]) {
      const r = await rail(vp)
      expect(r.padLeft, `at ${vp.width} the rail’s left inset`).toBe('12px')
      expect(r.padLeft, `at ${vp.width} …is the same as its right one`).toBe(r.padRight)
      // «Меньше то есть» – smaller, not merely equal. `--app-pad-x` is what it used to carry on top.
      expect(lengthPx(r.padLeft, 0), 'and smaller than the 12 + gutter it was').toBeLessThan(
        12 + lengthPx(token('--app-pad-x'), 0),
      )
      expect(r.padTop, 'the top inset is the 20 it has always been').toBe('20px')
    }
  })

  it('⚠ ITEM 14 – …and the rail still meets the frame’s edge: the negative margin stays', async () => {
    assertSheetPresent()
    // The other half of the asymmetry, and it is NOT part of his ask. Dropping it would move the
    // rail's own edge right by the gutter and put the labels back where they are today – which is
    // neither a smaller inset nor the thing he pointed at. Measured both ways in Chromium at 1024:
    // with the margin the rail stands at x=0 and the labels at 56; without it, x=16 and 72.
    const gutter = lengthPx(token('--app-pad-x'), 0)
    const r = await rail(DESKTOP)
    expect(pxOf(r.marginLeft), 'the rail is still pulled out to the frame’s own edge').toBe(-gutter)
  })

  it('⭐⭐⭐ ITEM 15 – the frame’s bottom gutter is pulled through too, so no band is left', async () => {
    assertSheetPresent()
    // WHAT THE BAND ACTUALLY WAS, as arithmetic rather than as a guess: the rail spans
    // `grid-row: 1 / -1`, the grid's rows fill `#app`'s CONTENT box, so the rail's sticky travel
    // stopped `--app-pad-bottom` above the last pixel of the document. Measured in Chromium at the
    // foot of the page: 48.0px on Home and Season, at 1280x900, 1024x800 and 1280x600 alike.
    const gutter = lengthPx(token('--app-pad-bottom'), 0)
    expect(gutter, 'the frame’s bottom gutter is the 48 the band measured').toBe(48)
    for (const vp of [DESKTOP_ENTRY, DESKTOP]) {
      const r = await rail(vp)
      expect(pxOf(r.marginBottom), `at ${vp.width} the rail travels the gutter’s full depth`).toBe(-gutter)
      // The three facts that make that margin mean «no band»: the rail spans every row, it is the
      // sticky column, and its own bottom padding is untouched, so its last card is no closer to the
      // edge than it was.
      expect(r.gridRow, 'and it still spans the whole grid').toBe('1 / -1')
      expect(pxOf(r.marginTop), 'the top gutter is unwound exactly as before').toBe(
        -lengthPx(token('--app-pad-top'), 0),
      )
      expect(r.padTop, 'and the rail’s own room for its first tab is unchanged').toBe('20px')
    }
  })

  it('⚠ …and neither item reaches a phone or a tablet – the bar is untouched below 1024', async () => {
    assertSheetPresent()
    for (const vp of [PHONE, TABLET, TABLET_TOP]) {
      const r = await rail(vp)
      expect(pxOf(r.marginLeft) || 0, `at ${vp.width} no negative margin`).toBe(0)
      expect(pxOf(r.marginBottom) || 0, `at ${vp.width} no bottom pull`).toBe(0)
      expect(r.padLeft === '' || r.padLeft === '0px', `at ${vp.width} the bar has no rail padding`).toBe(true)
    }
  })
})
