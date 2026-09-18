// ⭐⭐⭐ ROUND 45 #3 – THE FIGURE INSIDE THE GAUGE IS CENTRED IN EVERY HOST. MOUNTED.
//
// The owner, on the deployed wave-7 build: «проверить выравнивание шрифта внутри гауджа – я вижу знак
// вопроса и он стоит выше середины». His words and the whole diagnosis live on `.tb-ring-value` in
// src/components/ui/ProgressRing.vue, with the browser table that measured it.
//
// ⚠⚠ THE QUESTION MARK IS NOT THE CAUSE, which is the finding this file exists to keep. `?` and a
// figure sit on the SAME baseline in that box – measured in a browser, their ink centres differ by
// 0.09px – so the glyph was never the variable. What was is the LINE BOX: the ring's optical nudge
// (`padding-top: 26%`) was fitted against `body`'s own `15px/1.45 var(--font-body)`, and it INHERITED
// both halves. Neither crosses a `<button>` – the app's global `button` rule declares a colour, a
// border, a radius, a padding and a size, and no `line-height` and no `font-family` – so inside one
// they fall back to the user agent's form-control defaults, the line box shrinks and the baseline
// rises with it. Home's ring, the Season card's and the Calendar's are hosted in ordinary elements
// and were always right; the coach market's marker lives in the bottom-right corner of a row that IS
// one `<button>`, so it was the one that drifted, and the question mark is simply the glyph that
// stands alone in an empty circle where 2px is unmissable.
//
// ⚠⚠⚠ WHAT THIS ENVIRONMENT CANNOT DO, MEASURED RATHER THAN ASSUMED, BECAUSE IT DECIDES THE SHAPE OF
// EVERY CASE BELOW. happy-dom has no layout engine – so no ink can be weighed against a circle here,
// and the browser table on the component is the measurement. AND IT DOES NOT APPLY THE USER AGENT'S
// FORM-CONTROL DEFAULTS EITHER: the first draft of this file mounted the ring in a `<div>` and in a
// `<button>` and asked whether a plain `<span>` inherited different type in the two, and it does NOT
// – both come out `1.45` and Manrope. That assertion was written as an explicit non-vacuity guard and
// it is the reason this note exists instead of a green that meant nothing.
//
// So the hostile host is WRITTEN OUT by hand: `line-height: normal; font-family: Arial` on the host
// element is the browser's own button default, declared where this environment can see it. Everything
// below then runs through the real cascade on the real component, and the claim is the one the fix
// actually buys: THE RING'S TYPE IS ITS OWN, and a host that hands down something else does not reach
// the figure.
//
// ⚠⚠ MUTATION ARMS – each APPLIED to the real component and RUN against this file, each red MEASURED:
//   ARM 1  `line-height: 1.45` dropped from `.tb-ring-value`      -> RED [3]
//   ARM 2  `font-family: var(--font-body)` dropped                -> RED [3]
//   ARM 3  both dropped (the shipped defect, restored exactly)    -> RED [3]
//   ARM 4  `padding-top: 26%` changed to a px literal             -> RED [1] (the nudge case – the
//          third term of the centring, pinned so it cannot be re-tuned silently)
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, h } from 'vue'
import '../../src/style.css'
import ProgressRing from '../../src/components/ui/ProgressRing.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { PHONE, setViewport } from './fits'

/** The type a real browser hands a control's children when nothing declares otherwise – the app's
 *  global `button` rule sets neither of these, which is the whole mechanism. */
const HOSTILE = 'line-height: normal; font-family: Arial'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

function type(el: Element): { lineHeight: string; fontFamily: string } {
  const cs = getComputedStyle(el)
  return { lineHeight: cs.lineHeight, fontFamily: cs.fontFamily }
}

/** One ring inside a host, attached. `hostile` puts the browser's own button defaults on the host, so
 *  this environment models the case the app actually broke in. The plain `<span>` beside the ring is
 *  the NON-VACUITY probe: it shows what the host really is handing its children. */
function ringIn(hostile: boolean, slot = '?') {
  const wrapper = mount(
    {
      render() {
        return h('div', { class: 'r45-host', style: hostile ? HOSTILE : '' }, [
          h('span', { class: 'r45-probe' }, 'x'),
          h(ProgressRing, { value: 0, size: 36, label: 'Chemistry with her: not known yet' }, () => [h('b', slot)]),
        ])
      },
    },
    { attachTo: document.body },
  )
  return {
    wrapper,
    value: document.querySelector('.r45-host .tb-ring-value')!,
    glyph: document.querySelector('.r45-host .tb-ring-value b')!,
    probe: document.querySelector('.r45-host .r45-probe')!,
  }
}

describe('round 45 #3 – the ring owns the type its optical nudge was fitted against', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('⭐⭐⭐ A HOSTILE HOST DOES NOT REACH THE FIGURE (ARM 1, ARM 2, ARM 3)', () => {
    assertSheetPresent()
    const friendly = ringIn(false)
    const good = { value: type(friendly.value), glyph: type(friendly.glyph), probe: type(friendly.probe) }
    friendly.wrapper.unmount()
    document.body.innerHTML = ''

    const hostile = ringIn(true)
    const bad = { value: type(hostile.value), glyph: type(hostile.glyph), probe: type(hostile.probe) }
    hostile.wrapper.unmount()

    // ⚠ NON-VACUITY FIRST, and it is not a formality – the first draft of this file died here. The
    // two hosts must really hand their children different type, or «the ring is the same in both» is
    // a statement about a cascade that never ran.
    expect(
      bad.probe,
      'a plain span beside the ring has to feel the hostile host – otherwise nothing below is a measurement',
    ).not.toEqual(good.probe)

    expect(bad.value, 'the value box declares its own leading and face, so the host cannot move it').toEqual(good.value)
    expect(bad.glyph, 'and the glyph inside it takes the ring\'s type, not the host\'s').toEqual(good.glyph)
  })

  it('⭐ ...and what it declares is the app\'s OWN body type, not a second opinion about it', () => {
    // The nudge was fitted against `body { font: 15px/1.45 var(--font-body) }`. Restating those two
    // is the fix; inventing different ones would be a third typography nobody reviewed. Both are read
    // off the real `body` rather than typed here, so the two cannot drift apart.
    assertSheetPresent()
    const body = type(document.body)
    const { wrapper, value, glyph } = ringIn(true)
    expect(type(value), 'the ring is set in the app\'s own body leading and face').toEqual(body)
    expect(type(glyph), 'and the figure in it inherits exactly that').toEqual(body)
    wrapper.unmount()
  })

  it('⭐ the optical nudge is still the proportional 26% the three sizes share (ARM 4)', () => {
    // The third term of the centring. It is a percentage precisely so a ring that comes in three
    // sizes carries ONE optical correction; a px literal here is the defect this rule already paid
    // for once (the 56px ring on screen C, «проценты кондишна надо выровнять по вертикали»).
    assertSheetPresent()
    const { wrapper, value } = ringIn(false)
    const cs = getComputedStyle(value)
    expect(cs.paddingTop, 'the nudge is declared as a share of the box, not as pixels').toBe('26%')
    expect(cs.alignItems, 'and the figure and its sign sit on one baseline').toBe('baseline')
    wrapper.unmount()
  })

  it('⚠⚠ ON THE SCREEN HE WAS LOOKING AT: the marker in the coach card, which is inside a button', async () => {
    // The end-to-end arm. The coach row IS one `<button>`, which is why this ring was the one that
    // drifted, and the hostile type is put on that real row rather than on a fixture host – so what
    // is measured is the shipped markup with the browser's own default written where happy-dom can
    // see it.
    assertSheetPresent()
    const world: WorldState = createWorld('r45-ring', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    useGameStore().snapshot = toSnapshot(world)
    const wrapper = mount(CoachMarketScreen, { attachTo: document.body })
    const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
    await pill!.trigger('click')
    await nextTick()

    const row = wrapper.find('.cm-row')
    expect(row.element.tagName, 'the row really is a button – that is the whole mechanism').toBe('BUTTON')
    const marker = row.find('.cm-chem .tb-ring-value')
    expect(marker.text(), 'a career with nothing on the pair yet draws the question mark').toBe('?')

    ;(row.element as HTMLElement).setAttribute('style', HOSTILE)
    await nextTick()
    const body = type(document.body)
    expect(type(row.find('.cm-name').element), 'the row really is handing its children the hostile type').not.toEqual(body)
    expect(type(marker.element), 'and the marker ignores it, exactly as the four other rings do').toEqual(body)
    expect(type(marker.find('b').element), 'right down to the glyph the owner was looking at').toEqual(body)
    wrapper.unmount()
  })
})
