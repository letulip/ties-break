// =================================================================================================
// ⭐⭐⭐ ROUND 42 #8 – SELECT-THEN-PROCEED EVERYWHERE, AND NO AUTO-FOCUS ON ANSWERS. MOUNTED.
// =================================================================================================
//
// The owner, on the deployed wave-5 build: dialogs answered on the FIRST tap and his double-tap
// picked an option before he could read («нажал на плашку… не сразу открылась, а потому мой второй
// автоклик выбрал какой-то пункт»); ruled 15.09, two halves: «вот не надо нам там фокус и да, надо
// Proceed добавить» – the prologue's round-41 #9 pattern for EVERY life-beat dialog, and the scope
// grew to `KnockDialog`, the same single-tap family (his six unremembered `push` choices at weeks
// 210–350 are almost certainly fast taps on that card – item 27's own working explanation).
//
// LifeBeatDialog's re-aimed contract lives in life-beat-dialog.test.ts (four cases carry ⚠ notes
// naming this round). THIS file owns what that one does not:
//   * the KNOCK's whole select+Proceed contract – it had no behavioural component net of its own;
//   * focus-at-open is the CARD and never an answer, on BOTH dialogs (the a11y sweep's knock case
//     was re-aimed; the life beat's half is here);
//   * the close does NOT hand focus back to the week button (round 42 #17 mechanism c);
//   * the SOFT entrance obeys the same two-tap contract (small-talk included – the ruling's words);
//   * the round-20 phone fit of the SELECTED state, whose way out is the Proceed.
//
// ⚠⚠ MUTATION ARMS – each run against the real components on 15.09, watched red, restored. The
// counts are MEASURED, not predicted:
//   ARM 1  KnockDialog's `select` wired back to the single tap (a `decideKnock` call added beside
//          the mark) -> RED [2]: «the first tap SELECTS and records NOTHING» and the double-Proceed
//          case both counted commands that should not exist. Round 42 #8's headline claim,
//          falsified and caught. (The same mutation on LifeBeatDialog's `select` -> RED [4], all in
//          life-beat-dialog.test.ts and this file's soft-entrance case.)
//   ARM 2  `if (choice === null || sending.value) return` narrowed to drop the `sending` half in
//          KnockDialog's `confirm()` -> RED [1]: the double-Proceed case counts two commands.
//   ARM 3  `{ focusOn: 'card', restore: false }` dropped from KnockDialog's `useDialogFocus` ->
//          RED [2]: this file's knock focus case and a11y-sweep's re-aimed D1 case (focus opened on
//          «Rest it»). The same drop on LifeBeatDialog -> RED [1] on this file's life-beat focus
//          case, whose last assertion is #17(c)'s not-back-on-the-week-button half.
//   ARM 5  the knock Proceed rendered unconditionally (`v-if="chosen !== null"` removed) -> RED
//          [1]: the census case counts three buttons on arrival where the question offers two.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { contrastRatio, effectiveBackground, parseColor } from './contrast'
import { assertDismissReachable, setViewport, NARROW_PHONE, PHONE } from './fits'
import KnockDialog from '../../src/components/KnockDialog.vue'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type KnockPrompt, type LifeBeatPrompt, type Snapshot } from '../../src/shared/protocol'

// --- fixtures ------------------------------------------------------------------------------------

/** A knock prompt in the wire's own shape. FIXTURE strings, not copy – the words the player reads
 *  come from `buildKnockPrompt`, and no case below asserts them. */
const KNOCK: KnockPrompt = {
  part: 'hip',
  repeat: false,
  line: 'FIXTURE – she came off court rubbing it.',
  read: 'FIXTURE – the coach thinks a week off would settle it.',
  restCost: 'FIXTURE rest cost sentence.',
  pushCost: 'FIXTURE push cost sentence.',
}

/** A life-beat prompt – life-beat-dialog.test.ts's own fixture shape, `confirm` included. */
const BEAT: LifeBeatPrompt = {
  week: 640,
  kind: 'fork-opinion',
  heading: 'FIXTURE heading',
  said: 'FIXTURE line of hers.',
  options: [
    { id: 'back-her', label: 'FIXTURE answer one' },
    { id: 'press-other-way', label: 'FIXTURE answer two' },
  ],
  // ⚠ RE-AIMED BY ROUND 42 #15/#24: `listenFollowUp: null` became an empty `followUps` list – the
  // same claim, that no answer on this fixture earns a second line, which is what keeps this file's
  // subject (select + Proceed) the thing it is measuring.
  followUps: [],
  confirm: 'FIXTURE proceed',
}

function knockSnapshot(): Snapshot {
  return { ...toSnapshot(createWorld('r42-knock-ui', DEFAULT_PROFILE)), knockPrompt: KNOCK }
}

function mountKnock(attach = false) {
  useGameStore().snapshot = knockSnapshot()
  return mount(KnockDialog, attach ? { attachTo: document.body } : { global: { stubs: { teleport: true } } })
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
})

// =================================================================================================
// THE KNOCK – the second member of the single-tap family, joined to the pattern
// =================================================================================================
describe('ROUND 42 #8 – KnockDialog selects, and only the Proceed decides', () => {
  it('⭐⭐⭐ the first tap SELECTS and records NOTHING; only the Proceed calls decideKnock', async () => {
    const store = useGameStore()
    store.snapshot = knockSnapshot()
    const decided: string[] = []
    store.decideKnock = async (choice: 'rest' | 'push') => {
      decided.push(choice)
    }
    const w = mount(KnockDialog, { global: { stubs: { teleport: true } } })

    const rows = w.findAll('button.knock-choice')
    expect(rows).toHaveLength(2)
    await rows[1].trigger('click') // «Train through it»
    expect(decided, 'the tap that used to commit a push commits nothing now').toEqual([])
    expect(rows[1].attributes('aria-checked'), 'it is a selection, and it says so').toBe('true')
    expect(rows[0].attributes('aria-checked')).toBe('false')

    // Re-choosing is free – a selection is not a commitment.
    await rows[0].trigger('click')
    expect(decided).toEqual([])
    expect(rows[0].attributes('aria-checked')).toBe('true')
    expect(rows[1].attributes('aria-checked')).toBe('false')

    const proceed = w.find('.knock-proceed')
    expect(proceed.exists(), 'the way on appeared under the answered question').toBe(true)
    await proceed.trigger('click')
    expect(decided, 'the Proceed records the SELECTED branch – the last one marked').toEqual(['rest'])
    w.unmount()
  })

  it('⭐ nothing is selected on arrival, and the Proceed is not offered before a selection', () => {
    const w = mountKnock()
    const rows = w.findAll('button.knock-choice')
    for (const row of rows) {
      expect(row.attributes('role'), 'a control that selects says so').toBe('radio')
      expect(row.attributes('aria-checked'), 'nothing marked before he marks it').toBe('false')
    }
    expect(w.find('[role="radiogroup"]').attributes('aria-labelledby'), 'the group is named by the part of her').toBe(
      'knock-dialog-title',
    )
    // The census: two answers and NOTHING else on arrival – a Proceed with nothing selected would
    // be a way on off an unanswered question (ARM 5).
    expect(w.findAll('button')).toHaveLength(2)
    expect(w.find('.knock-proceed').exists()).toBe(false)
    // ...and the marks are drawn, decorative, on both rows – the round-40 ball.
    for (const row of rows) {
      const mark = row.find('.knock-mark')
      expect(mark.exists(), 'a selection is drawn as a selection').toBe(true)
      expect(mark.attributes('aria-hidden')).toBe('true')
    }
    w.unmount()
  })

  it('⚠ a double-tap on the Proceed decides ONCE (ARM 2), and a held flight disables the card', async () => {
    const store = useGameStore()
    store.snapshot = knockSnapshot()
    const decided: string[] = []
    let release: () => void = () => {}
    store.decideKnock = async (choice: 'rest' | 'push') => {
      decided.push(choice)
      await new Promise<void>((resolve) => {
        release = resolve
      })
    }
    const w = mount(KnockDialog, { global: { stubs: { teleport: true } } })
    await w.findAll('button.knock-choice')[1].trigger('click')
    const proceed = w.find('.knock-proceed')
    // Both clicks in ONE tick – the DOM has not patched `disabled` yet, so the guard in `confirm()`
    // is the only thing standing (the same shape life-beat-dialog.test.ts records at length).
    proceed.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    proceed.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(decided, 'one decision, not two').toEqual(['push'])
    for (const b of w.findAll('button')) {
      expect(b.attributes('disabled'), 'in flight, every control stands down').toBeDefined()
    }
    release()
    w.unmount()
  })

  it('⭐ the arrows walk the branches and do not select – the group convention, on this card too', async () => {
    const w = mountKnock(true)
    const rows = [...document.querySelectorAll<HTMLButtonElement>('button.knock-choice')]
    rows[0].focus()
    const group = document.querySelector('.knock-choices')!
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(document.activeElement, 'the arrow moves the focus').toBe(rows[1])
    for (const row of rows) expect(row.getAttribute('aria-checked')).toBe('false')
    w.unmount()
  })

  it('⭐ the empty ball is visible on BOTH rows – the warned branch included (WCAG 1.4.11)', () => {
    // The life-beat net measures its ball against `--card-top`; the knock's rows sit on the accent
    // and warning washes, so the 3:1 verdict is re-taken against the grounds THIS card really paints.
    setViewport(PHONE)
    const w = mountKnock(true)
    const rows = document.querySelectorAll('button.knock-choice')
    expect(rows.length, 'not vacuous – there are rows to measure').toBe(2)
    for (const row of rows) {
      const mark = row.querySelector('.knock-mark')!
      const ring = parseColor(getComputedStyle(mark).borderTopColor)
      const under = effectiveBackground(row)
      const ratio = contrastRatio([ring[0], ring[1], ring[2]], under)
      expect(ratio, `the empty ball against ${row.className}`).toBeGreaterThanOrEqual(3)
    }
    w.unmount()
  })

  it('⚠⚠ ROUND-20 – the SELECTED state fits the phone: the Proceed is the way out and it is reachable', async () => {
    // The fit nets that already existed measure the card on arrival, where the branches are the
    // last thing in the flow. The selected state is one control taller, and the way out of it is
    // the Proceed – so the round-20 verdict is re-taken on the state the player actually leaves by.
    for (const vp of [PHONE, NARROW_PHONE]) {
      document.body.innerHTML = ''
      setViewport(vp)
      const w = mountKnock(true)
      const card = document.querySelector('.knock-dialog')!
      ;(document.querySelectorAll<HTMLButtonElement>('button.knock-choice')[1]).click()
      await w.vm.$nextTick()
      const proceed = card.querySelector('.knock-proceed')!
      expect(proceed, 'the selected state is up – nothing below is vacuous').toBeTruthy()
      expect(card.lastElementChild, 'the Proceed is the card\'s last element while rendered').toBe(proceed)
      assertDismissReachable(card, proceed, vp, `KnockDialog (selected, ${vp.width}x${vp.height})`)
      w.unmount()
    }
  })

  it('⚠⚠ MUTATION PROOF – strip the height cap and the SAME selected-state assertion goes red', async () => {
    // The round-20 law's own demand: «prove it by mutating – a test that cannot fail on the
    // too-tall version is not this test». The cap is the shared `.dialog-card`'s, so this is the
    // arm that says the selected state is safe from the next honest sentence rather than by luck.
    setViewport(PHONE)
    const w = mountKnock(true)
    const card = document.querySelector('.knock-dialog')!
    ;(document.querySelectorAll<HTMLButtonElement>('button.knock-choice')[0]).click()
    await w.vm.$nextTick()
    const proceed = card.querySelector('.knock-proceed')!
    assertDismissReachable(card, proceed, PHONE, 'KnockDialog (selected, bounded)')
    ;(card as HTMLElement).style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, proceed, PHONE, 'KnockDialog (selected, unbounded)')).toThrow(
      /declares no height bound|taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})

// =================================================================================================
// THE LIFE BEAT'S SELECTED STATE – lengthened by one control, so the round-20 law re-measures it
// =================================================================================================
describe('ROUND 42 #8 – the life beat\'s selected state fits the phone', () => {
  const LONG = 'She has been turning it over for weeks and this is the whole of it at last. '
  /** The card four sentences from now, selected – copy grows, and the Proceed must survive it. */
  const TALL: LifeBeatPrompt = {
    ...BEAT,
    said: LONG.repeat(22).trim(),
    options: BEAT.options.map((o) => ({ ...o, label: `${o.label} – ${LONG.trim()}` })),
  }

  async function mountSelected(prompt: LifeBeatPrompt, vp = PHONE) {
    setViewport(vp)
    useGameStore().snapshot = { ...toSnapshot(createWorld('r42-beat-fit', DEFAULT_PROFILE)), lifeBeatPrompt: prompt }
    const w = mount(LifeBeatDialog, { attachTo: document.body })
    const card = document.querySelector('.life-beat-dialog')!
    ;(document.querySelectorAll<HTMLButtonElement>('button.life-beat-choice')[0]).click()
    await w.vm.$nextTick()
    const proceed = card.querySelector('.life-beat-proceed')!
    expect(proceed, 'the selected state is up – nothing below is vacuous').toBeTruthy()
    expect(card.lastElementChild, 'the Proceed is the card\'s last element while rendered').toBe(proceed)
    return { w, card, proceed }
  }

  it('⚠⚠ the Proceed is inside 375x667 and 320x568, on a long beat, and the card scrolls', async () => {
    for (const vp of [PHONE, NARROW_PHONE]) {
      document.body.innerHTML = ''
      const { w, card, proceed } = await mountSelected(TALL, vp)
      const fit = assertDismissReachable(card, proceed, vp, `LifeBeatDialog (selected, ${vp.width}x${vp.height})`)
      expect(fit.scrollable, 'what is past the fold can be reached').toBe(true)
      w.unmount()
    }
  })

  it('⚠⚠ MUTATION PROOF – round-20 #3 put back on the selected long beat, and the SAME call goes red', async () => {
    const { w, card, proceed } = await mountSelected(TALL)
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, proceed, PHONE, 'LifeBeatDialog (selected, cap removed)')).toThrow(
      /taller than the screen|outside the viewport|declares no height bound/,
    )
    // ...and putting it back is green again, which is what says the CAP is what holds.
    ;(card as HTMLElement).style.maxHeight = ''
    ;(card as HTMLElement).style.overflowY = ''
    assertDismissReachable(card, proceed, PHONE, 'LifeBeatDialog (selected, cap restored)')
    w.unmount()
  })
})

// =================================================================================================
// FOCUS – «вот не надо нам там фокус», and #17(c)'s close half, on both dialogs
// =================================================================================================
describe('ROUND 42 #8/#17(c) – focus opens on the card and never returns to the week button', () => {
  function opener(): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.textContent = 'Next week'
    document.body.appendChild(btn)
    btn.focus()
    expect(document.activeElement).toBe(btn)
    return btn
  }

  it('⭐ the life beat opens with focus on the CARD – an arriving Enter presses nothing (ARM 3)', () => {
    const btn = opener()
    useGameStore().snapshot = { ...toSnapshot(createWorld('r42-beat-ui', DEFAULT_PROFILE)), lifeBeatPrompt: BEAT }
    const w = mount(LifeBeatDialog, { attachTo: document.body })
    const card = document.querySelector('.life-beat-dialog')!
    expect(document.activeElement, 'focus went into the modal').toBe(card)
    expect(
      (document.activeElement as HTMLElement).closest('button'),
      'and it is on no control at all – a held Enter answers nothing',
    ).toBeNull()
    w.unmount()
    expect(document.activeElement, 'ARM 3: the close must not re-arm the week button').not.toBe(btn)
    btn.remove()
  })

  it('⭐ ...and the knock the same, and neither hands the keyboard back to the press that raised it', () => {
    const btn = opener()
    const w = mountKnock(true)
    expect(document.activeElement, 'the card itself').toBe(document.querySelector('.knock-dialog'))
    w.unmount()
    expect(document.activeElement, 'not back on Proceed – #17(c)').not.toBe(btn)
    btn.remove()
  })
})

// =================================================================================================
// THE SOFT ENTRANCE – «all kinds, small-talk included»
// =================================================================================================
describe('ROUND 42 #8 – the soft entrance obeys the same two taps', () => {
  it('⭐ on the soft prompt the first tap selects only, and the Proceed dispatches', async () => {
    // The dialog is ONE component on one prompt contract (v74 T15's whole point), so this is the
    // ruling's «small-talk included» made a rendered fact rather than an inference.
    const store = useGameStore()
    store.snapshot = {
      ...toSnapshot(createWorld('r42-soft-ui', DEFAULT_PROFILE)),
      softBeat: { card: 'FIXTURE invitation', prompt: BEAT },
    }
    const sent: string[] = []
    store.answerLifeBeat = async (optionId: string) => {
      sent.push(optionId)
    }
    const w = mount(LifeBeatDialog, { props: { soft: true }, global: { stubs: { teleport: true } } })
    await w.findAll('button.life-beat-choice')[0].trigger('click')
    expect(sent, 'the soft card cannot be answered by a stray tap either').toEqual([])
    await w.find('.life-beat-proceed').trigger('click')
    expect(sent).toEqual([BEAT.options[0].id])
    w.unmount()
  })
})
