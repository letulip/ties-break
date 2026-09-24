// =================================================================================================
// ROUND 26 #1, SECOND PASS – WHERE THE PILL IS, AND WHAT THE BAR LOOKS LIKE IN EACH OF ITS STATES
// =================================================================================================
//
// The owner, 25.08: «давай сделаем ее во-первых слева от основной». The half of that ruling this
// file owns is POSITION, and it cannot be made by a source pin: a template can put the pill first
// and a `order: 1` in the cascade can put it back on the right, so the claim is only true of the
// two read TOGETHER. Everything here mounts the real shell against the real stylesheet.
//
// The gate itself – WHEN the pill appears – is `tests/round26-span-gate.test.ts`, walked against
// real careers. This file uses the gate only to reach the state it wants to look at.
//
// ⚠ A RUNNER-SIZED CEILING, ARITHMETIC WRITTEN OUT (round 26 #16's lesson, the shape
// `round26-college-card.test.ts` and `round24-college-shell.test.ts` already carry). The heavy
// shape here is mounting the whole App shell, five times, with `src/style.css` parsed into the
// document. Measured alone on a quiet machine the slowest case is 0.35 s and the file is 1.6 s;
// CI's 2-core runner is documented at 4–5x, which puts the slowest case near vitest's 5 s default
// with zero assertion failures. 30 s is ~85x the solo cost, so it can only fire on a genuine wedge.
// ⚠ If a case here ever takes tens of seconds ALONE, that is a real regression and this ceiling
// must not be raised to hide it.
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30_000 })
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { assertRowFits, demandedWidth, setViewport, NARROW_PHONE, PHONE } from './fits'
// ⚠ THE REAL STYLESHEET, or every width and every `order` below reads an empty cascade and passes
// vacuously. vitest only keeps stylesheets because the component project sets `css: true`, and a
// global sheet still has to be imported by the file that measures against it.
import '../../src/style.css'

// The shell imports the service-worker registration and the component project resolves no virtual
// module for it – the same mock r2-13-span-report / round19-wrapup install, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  MULTI_WEEK_SPAN,
  advanceWeeks,
  createWorld,
  enterEvent,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHELL'S WATERMARKS ARE localStorage. Same shim as
// r2-13-span-report / round19-wrapup / round20-ui – supply the browser's object, do not weaken the app.
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

/** A career on an ordinary training week with nothing on her calendar – and, since round 30 #3, a
 *  long layoff standing over it, which is what makes the bar carry two controls at all.
 *
 *  ⚠⚠ RE-AIMED, NOT WEAKENED. This file owns the POSITION half of round 26 #1 («давай сделаем ее
 *  во-первых слева от основной») and the phone-fit of a two-control bar; it uses the gate only to
 *  REACH the state it looks at. Round 30 #3 changed which state that is: the owner deleted the
 *  quiet-stretch arm outright – «давай вообще эту кнопку про 6 недель уберём. Её можно оставить
 *  только на длинные травмы» – so an empty calendar alone now draws ONE control and every width,
 *  order and mutation arm below would have measured a bar that is no longer the bar under test.
 *  The layoff is the reach; nothing about what is asserted has moved.
 *
 *  ⚠ 20 WEEKS, deliberately far above the horizon: `spanWeeksFor` caps at `weeksRemaining - 1`, so a
 *  short layoff would put the WINDOW in charge of the label this file's own arms read. It opened
 *  last week because `advanceWeeks` stops on a layoff that opened this one. */
function quietWorld(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.season = []
  world.injury = {
    kind: 'stress fracture',
    severity: 'major',
    weeksRemaining: 20,
    totalWeeks: 20,
    sinceWeek: world.week - 1,
  }
  return world
}

async function openShell(world: WorldState, vp = PHONE) {
  // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time, so a viewport set
  // after the mount measures the previous screen.
  setViewport(vp)
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  game.snapshot = toSnapshot(world)
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

describe('round 26 #1 – the span pill sits to the LEFT of the week button', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐⭐ IT IS THE FIRST CONTROL IN THE BAR, and nothing in the cascade puts it back', async () => {
    const { w } = await openShell(quietWorld('r26-pos-left'))
    const bar = w.find('.next-week-bar')
    expect(bar.exists(), 'the bar is drawn on Home').toBe(true)
    const kids = [...bar.element.children]
    expect(kids.length, 'two controls, and only two').toBe(2)

    const pill = w.find('.span-weeks-btn').element
    const cta = w.find('.next-week-btn').element
    // 1. SOURCE ORDER.
    expect(kids.indexOf(pill), 'the pill is first in the bar').toBe(0)
    expect(kids.indexOf(cta), 'and the week button follows it').toBe(1)

    // 2. ...AND THE CASCADE AGREES, which is the half a template pin cannot make. In a plain
    // `flex-direction: row` with equal `order`, first-in-source IS left-on-screen; either an
    // `order` override or a `row-reverse` would silently swap them and leave the DOM looking right.
    const barCs = getComputedStyle(bar.element)
    expect(barCs.display, 'the bar is a flex row').toContain('flex')
    expect(barCs.flexDirection === '' || barCs.flexDirection === 'row', `flex-direction is \`${barCs.flexDirection}\``).toBe(true)
    const orderOf = (el: Element) => {
      const o = getComputedStyle(el).order
      return o === '' ? 0 : Number(o)
    }
    expect(orderOf(pill), 'no order override on the pill').toBe(0)
    expect(orderOf(cta), 'nor on the week button').toBe(0)
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – an `order` that reverses them is caught, and so is `row-reverse`', () => {
    // A test that cannot fail on the broken version is not this test. Both halves of the assertion
    // above are exercised against the two ways this exact bug ships.
    const bar = document.createElement('div')
    bar.style.display = 'flex'
    const a = document.createElement('button')
    const b = document.createElement('button')
    bar.append(a, b)
    document.body.append(bar)
    const orderOf = (el: Element) => {
      const o = getComputedStyle(el).order
      return o === '' ? 0 : Number(o)
    }
    expect(orderOf(a)).toBe(0)
    a.style.order = '1'
    expect(orderOf(a), 'an order override is visible to this measurement').toBe(1)
    bar.style.flexDirection = 'row-reverse'
    expect(getComputedStyle(bar).flexDirection, 'and so is a reversed row').toBe('row-reverse')
    bar.remove()
  })
})

describe('round 26 #1 – the bar, in each of its states', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐ QUIET WEEK: two controls, the pill then the CTA, and the CTA drops its 206px floor', async () => {
    const { w } = await openShell(quietWorld('r26-bar-two'))
    const bar = w.find('.next-week-bar')
    expect(bar.classes(), 'the bar knows it has a sibling in it').toContain('with-span')
    expect(bar.element.children.length).toBe(2)
    // The relaxation is what stops the pair overflowing: 206 + 8 + the pill does not fit 343px.
    // happy-dom serialises a zero length without its unit, so both spellings are accepted – the
    // claim is the number, not the string.
    expect(['0', '0px'], 'the CTA gives up its floor').toContain(getComputedStyle(w.find('.next-week-btn').element).minWidth)
    w.unmount()
  })

  it('⚠ BUSY WEEK: one control, and it is the week button at its full width', async () => {
    // Her entry arrives next week, so `useWeekAhead` says "Play LOC" and the owner's gate is moot –
    // this is the state the bar is in for the overwhelming majority of a career.
    const world = createWorld('r26-bar-one', DEFAULT_PROFILE)
    const event: SeasonEvent = { id: 'r26-1-local', week: 1, tier: 'local', surface: 'hard', travelCostCents: 100_00, deadlineWeek: 0 }
    world.season = [event]
    enterEvent(world, event.id)
    const { w, game } = await openShell(world)
    expect(game.snapshot?.arrival, 'the entry really is on the week ahead').not.toBeNull()
    const bar = w.find('.next-week-bar')
    expect(bar.element.children.length, 'the week button, alone').toBe(1)
    expect(bar.classes(), 'and the bar is not in its two-control mode').not.toContain('with-span')
    expect(w.find('.span-weeks-btn').exists()).toBe(false)
    expect(getComputedStyle(w.find('.next-week-btn').element).minWidth, 'so the CTA keeps its floor').toBe('206px')
    w.unmount()
  })

  it('⚠⚠ PAUSED REVEAL: the global resume arm is ALONE in the bar – the pill can never join it', async () => {
    // The bar is drawn on every tab while a reveal is pending (it is the only way back into the
    // overlay), and that arm must not grow a second control: `multiOffered` returns false on
    // `snap.pending` before it reaches the owner's rule. Asserted rather than assumed, because the
    // pill sitting next to a resume button would be a skip offered on top of a paused tournament.
    const world = createWorld('r26-bar-pending', DEFAULT_PROFILE)
    const event: SeasonEvent = { id: 'r26-2-local', week: 2, tier: 'local', surface: 'hard', travelCostCents: 100_00, deadlineWeek: 0 }
    world.season = [event]
    enterEvent(world, event.id)
    advanceWeeks(world, resumeMain(world.rngMain), MULTI_WEEK_SPAN)
    expect(world.pendingTournament, 'the fixture really is standing on a reveal').not.toBeNull()
    const { w } = await openShell(world)
    const bar = w.find('.next-week-bar')
    expect(bar.exists(), 'the resume arm is drawn').toBe(true)
    expect(bar.element.children.length, 'and it is one control').toBe(1)
    expect(w.find('.span-weeks-btn').exists()).toBe(false)
    w.unmount()
  })
})

describe('round 26 #1 – and the two-control bar still fits a phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`both controls are pressable at ${vp.width}x${vp.height}`, async () => {
      const { w } = await openShell(quietWorld('r26-fit'), vp)
      const bar = w.find('.next-week-bar').element
      const items = [w.find('.span-weeks-btn').element, w.find('.next-week-btn').element]
      const slack = assertRowFits(bar, items, vp, 'App (week bar, quiet week)')
      // ⚠ AND THE MEASUREMENT IS NOT VACUOUS: the pill really does demand width. A control that
      // measured as zero would make the fit check pass on any bar at all.
      expect(demandedWidth(items[0], vp.width - 32), 'the pill cannot shrink below its own text').toBeGreaterThan(80)
      // Measured 25.08: the pill demanded 107.3px and the CTA 140.6px, so a 375px phone kept 87.1px
      // spare of its 343px bar and a 320px one 32.1px of 288px. ⚠ RE-MEASURED 24.09, when `fits.ts`
      // started charging a label per glyph instead of at the average advance: the pill demands
      // **99.4px** and the CTA **128.1px**, leaving **107.5px** of 343 and **52.5px** of 288. The
      // numbers went UP because the model went DOWN – it was over-billing the spaces and the narrow
      // letters – so the browser's own widths (99.4 is a floor under a real 116.6, 128.1 under 143.3)
      // have not moved and neither has the bar. The 320 margin is still the one a third control or a
      // longer label would spend first.
      expect(slack, `${vp.width}px leaves ${slack.toFixed(0)}px spare`).toBeGreaterThanOrEqual(0)
      w.unmount()
    })
  }

  // ===============================================================================================
  // ⚠⚠ RE-AIMED 24.09 WHEN `fits.ts`'s WIDTH MODEL BECAME PER-GLYPH HONEST – AND THE MOVE IS
  // REPORTED AS A NUMBER RATHER THAN ABSORBED
  // ===============================================================================================
  //
  // ⚠⚠ WHAT HAPPENED, AND IT IS THE INTERESTING DIRECTION. This arm's red came from the CTA's TEXT
  // charge, because `.next-week-bar.with-span .next-week-btn` drops the 206px floor when the pill is
  // present («the min-width relaxation is geometry, not taste», src/style.css) – so with two controls
  // in the bar the CTA is as wide as «Training week» and nothing else. `fits.ts` charged that label
  // `13 * 14.5 * 0.47 = 88.59px` at the average glyph advance; the browser draws it at **91.30**, and
  // the average was ONLY that close because it over-bills the space and the two `i`s. Charged per
  // glyph the label is **76.12**, so the mutated bar models **342.1px of its 343px room** and the
  // shared floor passes it by 0.9px where it used to refuse it by 11.6px.
  //
  // ⚠ THE ROW HAS NOT STARTED FITTING – CONFIRMED IN A BROWSER, WHICH IS THE POINT. The real demand
  // is 206 (the mutated pill) + 8 (the gap) + 52 (the CTA's own padding) + 91.30 (its label) =
  // **357.3px of 343**, still **14.3px OVER**. So the mutation is a genuine overflow that the shared
  // FLOOR can no longer see, which is the price of the false red going away (`fits.ts`'s header
  // carries the census and says so in the same words).
  //
  // ⚠⚠ SO THE GUARD IS RE-AIMED, NOT DELETED, IN TWO HALVES: the helper's own red moves to 320x568,
  // where the identical mutation is 54px over and the floor still refuses it, and the 375x667 claim
  // is asserted from the BROWSER's width instead of the model's – which is exactly
  // `college-scene-ui.test.ts`'s `MEASURED_PX` argument, one file over. Nothing here is loosened: the
  // mutation is the same 206px, and both viewports still say the bar overflows.
  it('⭐⭐ MUTATION PROOF – give the pill the week button\'s own min-width and the same check goes red', async () => {
    // The exact mistake a future wave makes by styling the pair "like the week button".
    // `.next-week-btn` carries `min-width: 206px`, which is right for ONE floating pill: 206 for the
    // pill plus the CTA's own text plus the 8px gap is more than the 288px a 320px phone has – and
    // more than the 343px of a 375px one, which the browser half below is about.
    const { w } = await openShell(quietWorld('r26-fit-mut'), NARROW_PHONE)
    const bar = w.find('.next-week-bar').element
    const pill = w.find('.span-weeks-btn').element as HTMLElement
    const items = [pill, w.find('.next-week-btn').element]
    assertRowFits(bar, items, NARROW_PHONE, 'App (week bar, quiet week)') // green before the mutation
    pill.style.minWidth = '206px'
    expect(() => assertRowFits(bar, items, NARROW_PHONE, 'App (week bar, mutated)')).toThrow(/off the side of the phone/)
    w.unmount()
  })

  it('⭐⭐ ...AND AT 375x667 THE SAME MUTATION IS STILL AN OVERFLOW – measured, not modelled', async () => {
    // ⚠ ONE BROWSER-MEASURED WIDTH, WITH ITS PROVENANCE, because the shared floor is 15.2px short of
    // the truth on this label and the claim is about the truth. One-off headless Chromium (playwright,
    // `deviceScaleFactor: 1`), 24.09, over the repo's real `src/style.css` and its own self-hosted
    // `public/fonts/manrope-var.woff2`: «Training week» as `.next-week-btn` sets it – 14.5px, weight
    // 500 (`button.primary` wins the cascade, see the rule's own note), `letter-spacing: -0.01em`
    // resolving to -0.145px – measured `width: max-content` at **91.296875px**. ⚠ RE-MEASURE IT WITH
    // THE SAME HARNESS IF THE LABEL, THE SIZE, THE WEIGHT OR THE TRACKING EVER MOVES; a stale constant
    // here is a pin arguing with the screen. (`fits.ts`'s header documents the harness.)
    const TRAINING_WEEK_PX = 91.296875
    const { w } = await openShell(quietWorld('r26-fit-mut-375'), PHONE)
    const bar = w.find('.next-week-bar').element
    const pill = w.find('.span-weeks-btn').element as HTMLElement
    const cta = w.find('.next-week-btn').element
    // The label really is the one that was measured, or the constant above is about another screen.
    expect((cta.textContent ?? '').trim(), 'the CTA holds the label that was measured').toBe('Training week')
    const ccs = getComputedStyle(cta)
    expect(parseFloat(ccs.fontSize), 'at the size it was measured at').toBeCloseTo(14.5, 2)
    expect(ccs.fontWeight, '...and the weight').toBe('500')
    // ⚠ AND THE RELAXATION IS WHY THE TEXT DECIDES: two controls in the bar means the CTA has no
    // min-width floor left, so its demand IS its label. A rule that put the 206 back would make this
    // arm about arithmetic instead of about type.
    expect(parseFloat(ccs.minWidth), 'the CTA drops its 206px floor beside the pill').toBe(0)

    const bcs = getComputedStyle(bar)
    const room =
      Math.min(PHONE.width, parseFloat(bcs.maxWidth)) - parseFloat(bcs.paddingLeft) - parseFloat(bcs.paddingRight)
    expect(room, 'the bar\'s room on a 375px phone').toBeCloseTo(343, 1)
    const gap = parseFloat(bcs.columnGap || bcs.gap)
    const chrome = parseFloat(ccs.paddingLeft) + parseFloat(ccs.paddingRight)

    pill.style.minWidth = '206px'
    const real = 206 + gap + chrome + TRAINING_WEEK_PX
    expect(
      real,
      `the mutated bar really needs ${real.toFixed(1)}px of a ${room.toFixed(0)}px bar – the browser's own width for the label`,
    ).toBeGreaterThan(room)
    // ⚠⚠ AND THE FLOOR IS UNDER THE TRUTH, WHICH IS THE PROPERTY `fits.ts` PROMISES AND THE ONE THAT
    // MUST NOT ROT. The value is not pinned – `LABEL_ADVANCE` and its table are FITTED, and a later
    // wave may legitimately re-fit them – but the DIRECTION is: if the shared model ever overtakes a
    // browser measurement, it has stopped being a floor and this file needs re-reading.
    const modelled = demandedWidth(pill, room) + gap + demandedWidth(cta, room)
    expect(
      modelled,
      `the shared floor models ${modelled.toFixed(1)}px of the same bar – under the browser's ${real.toFixed(1)}, as a floor must be`,
    ).toBeLessThan(real)
    w.unmount()
  })

  it('⭐ AND THE PINNING FAILS TOO – a bar that stops being fixed is caught', async () => {
    // The other way this surface strands a player: the bar scrolls away with the page, so the week
    // button goes with it and the career cannot be advanced from Home at all.
    const { w } = await openShell(quietWorld('r26-fit-fixed'), PHONE)
    const bar = w.find('.next-week-bar').element as HTMLElement
    const items = [w.find('.span-weeks-btn').element, w.find('.next-week-btn').element]
    bar.style.position = 'static'
    expect(() => assertRowFits(bar, items, PHONE, 'App (week bar, unpinned)')).toThrow(/not `fixed`/)
    w.unmount()
  })
})
