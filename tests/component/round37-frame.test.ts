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
