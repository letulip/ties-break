// ⭐⭐⭐ ROUND 45 #3 AND #3b – THE FIGURE INSIDE THE GAUGE: WHERE IT SITS, AND WHAT IT SAYS. MOUNTED.
//
// Two rulings of the owner's, on the same corner of the same card, on the same day. #3 is the
// alignment and it is the first half of this file; #3b is the sign and it is the last describe.
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

// =================================================================================================
// ⭐⭐ ROUND 45 #3b – THE PLUS LEAVES THE GAUGE, AND THE SHORT MINUS STAYS
// =================================================================================================
//
// The owner, 18.09, in the same message as the alignment: «и по гауджу на тренерской карточке еще
// один момент, кроме вертикального выравнивания: знак плюс убрать. Минус короткий пусть останется при
// этом.»
//
// ⚠⚠ IT IS THE DRAWN FIGURE AND NOT THE SPOKEN ONE, and the split is the whole subject of this
// block. On the CARD the direction is carried twice before the figure gets to it – the gradient
// family (C11: green up, orange into red down) and the sweep – so the drawn plus is a third spelling
// of a fact the picture has already made. A LISTENER has neither the gradient nor the sweep: for that
// reader the sign in the row's accessible name is the only thing left carrying direction, and it is
// exactly the reader C12 («для тех, кто плохо считывает цвета или расположение шкалы») was written
// for. So the one function became two, the ruling was applied to the drawn one, and whether the
// spoken one should follow is HIS call and is in the round's report as a question.
//
// ⭐⭐⭐ AMENDED 18.09 – HE ANSWERED THE QUESTION AND THE ANSWER WAS «CUT IT THERE TOO» (ruling 7):
// «да, потому что все числа по умолчанию положительные, а отрицательные как раз озвучиваются
// дополнительно.» The paragraph above stands as the record of the split; ARM 7 below now measures
// the merged behaviour, and the two surfaces give one answer again.
//
// ⚠⚠ MUTATION ARMS – applied to the real component and run against this file AND round44's,
// re-measured 18.09 after the ruling closed the split. Each red is a COUNT OF TESTS:
//   ARM 5  `chemDrawn` given the plus back                                        -> RED [4] – the
//          positive case here, the spoken case with it, and two of round44's
//   ARM 6  `chemDrawn`'s minus dropped as well                                    -> RED [5] – the
//          drawn negative case, the spoken one behind it, and three of round44's
//   ARM 7  `chemSpoken` given its plus back (i.e. the pre-ruling behaviour)       -> RED [1]
// ⚠ ARMS 5 AND 6 GOT BIGGER BECAUSE THE SPLIT CLOSED, which is the honest reading of the count: a
// mutation to `chemDrawn` now reaches the spoken surface too, so one defect is caught twice. That is
// what «one writer» buys, and it is also why arm 7 stayed at one – the spoken side is the only
// place a separate answer could still be written.
describe('round 45 #3b – the drawn figure loses its plus and keeps its minus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** The coach she has, at a level, with the board up. One mount at a time – the screen reads its
   *  snapshot off the shared store, so two live boards in one case measure the same career twice
   *  (round44-chemistry-card.test.ts paid for that lesson and records it). */
  async function markerAt(chem: number) {
    const world: WorldState = createWorld('r45-sign', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    if (!world.coachId) throw new Error('this profile is supposed to start with a coach on the payroll')
    world.coachPairs[world.coachId] = { chem, phase: 0, standing: 0 }
    const snapshot = toSnapshot(world)
    const mine = snapshot.coachMarket.find((r) => r.current)
    expect(mine?.chemistry, `the wire carries a reading at ${chem} – otherwise this case is vacuous`).not.toBeNull()
    useGameStore().snapshot = snapshot
    const wrapper = mount(CoachMarketScreen, { attachTo: document.body })
    const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
    await pill!.trigger('click')
    await nextTick()
    const row = wrapper.findAll('.cm-row').find((r) => r.classes('current'))!
    return { wrapper, drawn: row.find('.cm-chem .tb-ring-value').text(), spoken: row.attributes('aria-label') ?? '' }
  }

  it('⭐⭐ A POSITIVE READING IS DRAWN WITH NO SIGN AT ALL (ARM 5)', async () => {
    for (const [chem, reads] of [
      [8.2, '8%'],
      [64.4, '64%'],
      [100, '100%'],
    ] as const) {
      document.body.innerHTML = ''
      const { wrapper, drawn } = await markerAt(chem)
      expect(drawn, `the gauge at ${chem}`).toBe(reads)
      expect(drawn, 'and there is no plus anywhere on it').not.toContain('+')
      wrapper.unmount()
    }
  })

  it('⭐ ...and a negative one keeps the SHORT minus, exactly the character it already carried (ARM 6)', async () => {
    for (const [chem, reads] of [
      [-8.2, '-8%'],
      [-12.5, '-13%'],
      [-100, '-100%'],
    ] as const) {
      document.body.innerHTML = ''
      const { wrapper, drawn } = await markerAt(chem)
      expect(drawn, `the gauge at ${chem}`).toBe(reads)
      // ⚠ THE SHORT ONE. He named it, so it is the ASCII hyphen-minus it has always been and not a
      // typographic minus or an en dash – a character swap here would be a wording change nobody
      // asked for, in the one place a test can still catch it.
      expect(drawn.codePointAt(0), 'U+002D, the short minus he named').toBe(0x2d)
      wrapper.unmount()
    }
  })

  // ⭐⭐⭐ RE-AIMED 18.09 BY RULING 7 OF THAT DAY, AND THE RE-AIM IS THE ANSWER TO THIS TEST'S OWN
  // QUESTION. The version below asserted `chemistry +33%` and said in as many words that whether the
  // spoken plus should go was HIS call. He called it:
  //
  //   «да, потому что все числа по умолчанию положительные, а отрицательные как раз озвучиваются
  //   дополнительно.»
  //
  // ⚠ SO C12'S READER IS NOT BEING SHORT-CHANGED, WHICH IS WHAT THE OLD ARM WAS PROTECTING. The
  // listener still learns the direction – from the absence of a sign, which is what «по умолчанию
  // положительные» means – and still learns it explicitly when it is downward, because the minus
  // stays. The two functions now give one answer, so the arm below tests the NEW invariant: drawn
  // and spoken agree, and neither carries a plus.
  it('⭐⭐ THE SPOKEN NAME DROPS ITS PLUS AND KEEPS ITS MINUS – his ruling of 18.09 (ARM 7)', async () => {
    document.body.innerHTML = ''
    const up = await markerAt(33.2)
    expect(up.spoken, 'no plus is announced – a bare number IS the positive one').toContain('chemistry 33%')
    expect(up.spoken, 'and there is no plus anywhere in the name').not.toContain('+')
    expect(up.drawn, 'the gauge beside it says the same thing, which is now the point').toBe('33%')
    up.wrapper.unmount()

    document.body.innerHTML = ''
    const down = await markerAt(-33.2)
    // ⚠ THE MINUS IS THE HALF HE KEPT, on both surfaces – «отрицательные как раз озвучиваются
    // дополнительно». Cutting it here would take the listener's one explicit channel away, which is
    // the reading of C12 that survives his ruling intact.
    expect(down.spoken, '...and downward the sign is still said out loud').toContain('chemistry -33%')
    expect(down.drawn, 'exactly as it is still drawn').toBe('-33%')
    down.wrapper.unmount()
  })
})
