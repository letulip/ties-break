// ⭐⭐ v73 – THE LIFE BEAT DIALOG, MOUNTED. The private life's wave 2, surface half
// (docs/plans/wave-2-the-reaction-surface-runbook-2026-09.md §5 / §6.7).
//
// ⚠ WHY MOUNTED AND NOT A SOURCE PIN. Every claim this surface makes is a claim about what is ON
// THE SCREEN: no way out that is not an answer, controls that say they SELECT, no sentence of the
// component's own, and – the one that stopped a career – the last control inside a phone. A source
// pin would assert that a class name exists; only a mounted card can say the screen holds it.
//
// ⚠ THE SNAPSHOT IS REAL AND THE PROMPT IS FABRICATED, on purpose. `toSnapshot` on a live world
// gives every other field its true shape; `lifeBeatPrompt` is built here from the `LifeBeatPrompt`
// TYPE, because the engine half's pools land in the same wave and this file may not wait on them.
// ⚠⚠ THE STRINGS BELOW ARE FIXTURES AND ARE NOT COPY. Not one of them reaches a player: the words
// the player reads are assembled engine-side from the owner-approved pools (invariant 4), and the
// claim this file actually makes about copy is the one in «the dialog owns no sentence» – that the
// rendered text is EXACTLY what the prompt handed over, whatever that turns out to say.
//
// ⚠⚠ EVERY MUTATION ARM IS WRITTEN DOWN – this wave's standing duty (§6, «the masseur's eight arms,
// eight catches»). Each was really run against the real component, watched going red, and put back;
// the count in brackets is how many of the 22 cases that one mutation took, because a mutation that
// reddens the WRONG case is as much a finding as one that reddens nothing.
//
//   THE ROUND-20 PIN (§5.4, and CLAUDE.md's popup law)
//   * the long-beat prompt with `.dialog-card`'s cap removed (`max-height: none; overflow-y:
//     visible`) -> RED [1]: "the content is taller than the screen and nothing scrolls, so the part
//     past the fold cannot be reached at all". This is round-20 #3 reproduced on THIS card, measured:
//     a content floor of 1274px inside 635px of room, on a 343px-wide card – the shape
//     `TourBriefingDialog` shipped in at 1078px. Restoring the two declarations turns it green again,
//     which is what says the CAP is the thing holding and not an accident of the fixture.
//   * the cap removed on TODAY'S copy (floor 306.7px, which fits unaided) -> RED [1] on the
//     content-independent half: "the card declares no height bound that fits". That is the arm that
//     still holds after somebody adds a sentence, and it is why both are here: the first mutation
//     cannot run on a card that fits, and the second proves nothing about one that does not.
//   * a `<p>` appended after `.life-beat-choices` inside the card (the controls no longer last in the
//     flow) -> RED [6]: all five fit cases fail on the structural precondition before any box is
//     measured, and "owns no sentence" fails on the extra text.
//
//   THE RADIO CONVENTIONS (§5.2, round 40's own)
//   * `role="radiogroup"` dropped from the container -> RED [1] on "a real radio group"; the census
//     of `role="radio"` stayed GREEN, which is why they are two assertions and not one.
//   * `role="radio"` dropped from the button -> RED [1] on the census.
//   * `:aria-checked` bound to `undefined` -> RED [3]: the state arm, the press arm and the arrow
//     arm (which asserts the arrows do NOT select). The group assertion stayed green.
//   * `.life-beat-mark` deleted from the template -> RED [2]: the mark arm and the legibility arm,
//     which measures the empty ball's own ring.
//   * `:disabled="busy"` narrowed to `:disabled="sending"` (the latch) -> RED [1] on "availability is
//     derived every render", `game.busy` arm; every other assertion stayed green.
//   * the arrow-key handler deleted -> RED [1] on the keyboard arm alone.
//   * `:class="{ 'is-first': ... }"` added to the row -> RED [1] on "nothing marks an answer".
//
//   THE LAWS
//   * `@click.self="answer(prompt.options[0].id)"` wired on the scrim -> RED [1]. ⚠⚠ AND IT WAS
//     GREEN [0] FIRST: see the scrim case below – the assertion this file inherited from
//     BirthdayDialog reads an `onclick` ATTRIBUTE that Vue 3 never sets.
//   * `useDialogFocus(card, () => { game.snapshot = null })` (an Escape that closes) -> RED [1].
//   * a kicker (`<p class="life-beat-kicker">Her week</p>`) above the heading -> RED [1] on "the
//     dialog owns no sentence". The same line carrying a bond figure ("Closer by +2") -> RED [2], on
//     that case and on the no-number arm.
//   * `answer()`'s guard `if (busy.value) return` removed -> RED [1]. ⚠⚠ AND THIS ONE WAS GREEN [0]
//     FIRST TOO, for a different reason: see the double-tap case.
//   * `if (prompt.value) chosen.value = null` removed -> RED [1] on the release arm.
//   * `blockingOverlay`'s `'life'` clause moved BELOW the fork's -> RED [1] on the queue order.
//   * `background: var(--card, #fff)` on `.life-beat-choice` (round-17 #3's own defect, put back)
//     -> RED [1] on the legibility arm.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET. Without it `var(--text)` resolves to nothing, `measureDialog` refuses
// outright, and every colour and every box below would be vacuous.
import '../../src/style.css'
import { assertLegible, contrastRatio, effectiveBackground, parseColor } from './contrast'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { blockingOverlay } from '../../src/composables/blockingOverlay'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type LifeBeatPrompt, type Snapshot } from '../../src/shared/protocol'

/** A fixture prompt. ⚠ NOT COPY – see the header. Built off the type so this file compiles against
 *  the contract rather than against the engine half's progress. */
const BEAT: LifeBeatPrompt = {
  week: 640,
  kind: 'fork-opinion',
  heading: 'FIXTURE heading, standing in for the pool line',
  said: 'FIXTURE line, standing in for what she says in her own voice on this beat.',
  options: [
    { id: 'back-her', label: 'FIXTURE answer one' },
    { id: 'press-other-way', label: 'FIXTURE answer two' },
    { id: 'say-nothing', label: 'FIXTURE answer three' },
  ],
}

/** ⭐ THE TOO-TALL VARIANT, and it is the mutation the round-20 law asks for. A beat is copy, and
 *  copy grows – «a dialog grows by one honest sentence at a time and nothing objects until it is
 *  taller than a phone». This is that card, so the assertion below can be watched failing on it.
 *
 *  ⚠ IT IS PROVED TALL RATHER THAN ASSUMED TALL: the fit case asserts `contentFloor` really does
 *  exceed the room, or the mutation measures nothing. */
const LONG_SENTENCE = 'She has been turning it over for weeks and this is the whole of it at last. '
const TOO_TALL: LifeBeatPrompt = {
  ...BEAT,
  said: LONG_SENTENCE.repeat(22).trim(),
  options: BEAT.options.map((o) => ({ ...o, label: `${o.label} – ${LONG_SENTENCE.trim()}` })),
}

/** A real snapshot with the one fabricated field on it. Everything else is a live world's. */
function snapshotWith(prompt: LifeBeatPrompt | null, seed = 'life-beat-ui'): Snapshot {
  return { ...toSnapshot(createWorld(seed, DEFAULT_PROFILE)), lifeBeatPrompt: prompt }
}

function mountDialog(prompt: LifeBeatPrompt | null) {
  useGameStore().snapshot = snapshotWith(prompt)
  return mount(LifeBeatDialog, { global: { stubs: { teleport: true } } })
}

/** Attached to the document, which is the only place the cascade is the player's. */
function mountAttached(prompt: LifeBeatPrompt, vp = PHONE) {
  // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time, and a media query
  // is cached on an element's first read, so a size set after the mount measures the previous screen.
  setViewport(vp)
  useGameStore().snapshot = snapshotWith(prompt)
  const w = mount(LifeBeatDialog, { attachTo: document.body })
  const card = document.querySelector('.life-beat-dialog')!
  expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
  return { w, card }
}

/** Whitespace-insensitive text, so the template's own indentation is not part of any claim. */
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()

/** Every run of text the card actually prints, in reading order. ⚠ TEXT NODES AND NOT `textContent`:
 *  the compiler condenses the whitespace between elements away, so a joined string would depend on
 *  that condensing and would read as one run. A list names WHICH sentence is extra when one is. */
function printed(el: Node, out: string[] = []): string[] {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = flat(node.textContent)
      if (text) out.push(text)
    } else {
      printed(node, out)
    }
  }
  return out
}

describe('LifeBeatDialog – she said something, and he answers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // ===============================================================================================
  // ⚠⚠ THE LAW: EVERY BUTTON IS AN ANSWER, AND THERE IS NO X
  // ===============================================================================================
  it('⚠⚠ no way out that is not an answer – no close, no dismiss, no overlay click', async () => {
    // The birthday's law, stronger here: the beat is HER SPEAKING, so a card that could be dismissed
    // would answer her by walking away and the week would move on as if she had said nothing.
    //
    // ⚠⚠ THE SCRIM HALF IS A DISPATCHED CLICK, NOT `attributes('onclick')`, AND THAT IS A REAL
    // CATCH RATHER THAN A STYLE CHOICE. BirthdayDialog's own test asserts the scrim's `onclick`
    // attribute is undefined – and Vue 3 binds `@click` with `addEventListener`, storing the invoker
    // on the element, so that attribute is undefined WHATEVER the template says. Verified by
    // mutation: wiring `@click.self="answer(prompt.options[0].id)"` on the overlay left all 22 cases
    // GREEN under the attribute form. The dispatched click below goes red on the same mutation,
    // which is the difference between a guard and a sentence about one.
    const store = useGameStore()
    const sent: string[] = []
    store.answerLifeBeat = async (optionId: string) => { sent.push(optionId) }
    const { w } = mountAttached(BEAT)

    const buttons = [...document.querySelectorAll('button')]
    expect(buttons.length, 'exactly the answers the engine offered, and nothing else').toBe(BEAT.options.length)
    for (const b of buttons) expect(b.classList.contains('life-beat-choice')).toBe(true)
    expect(w.text()).not.toMatch(/\b(close|cancel|dismiss|not now|later|skip|maybe)\b/i)

    // A tap beside the card, and a tap on the card itself: neither is an answer and neither closes.
    for (const target of ['.dialog-overlay', '.life-beat-dialog']) {
      document.querySelector(target)!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await nextTick()
      expect(sent, `a tap on ${target} answered her`).toEqual([])
      expect(document.querySelector('.life-beat-dialog'), 'still asking').toBeTruthy()
    }
    w.unmount()
  })

  it('⚠ Escape does not answer her either – the card is still up after it', async () => {
    // `useDialogFocus` is passed no `onEscape`, which is the same decision KnockDialog makes and for
    // the same reason. Mutation-verified by passing `() => { shown = false }` as the second argument:
    // the card disappears and this goes red.
    const { w } = mountAttached(BEAT)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(document.querySelector('.life-beat-dialog'), 'still asking').toBeTruthy()
    w.unmount()
  })

  // ===============================================================================================
  // ⚠⚠ THE LAW: THE DIALOG OWNS NO SENTENCE
  // ===============================================================================================
  it('⚠⚠ the rendered text is EXACTLY the prompt – the component adds not one word', () => {
    // Invariant 4 with the loophole closed. The engine hands over the heading, her line and every
    // label already written; this card prints them and stops. Stated as a TOTAL over the rendered
    // text rather than as three `toContain`s, because `toContain` cannot see a kicker.
    // Mutation-verified twice: a `<p class="life-beat-kicker">Her week</p>` above the heading goes
    // red naming the extra words, and so does a bond figure added the same way.
    const w = mountDialog(BEAT)
    const card = w.find('.life-beat-dialog')
    expect(printed(card.element)).toEqual([BEAT.heading, BEAT.said, ...BEAT.options.map((o) => o.label)])
    // ...and each of the three is where it belongs, or the list above could be satisfied by a
    // heading and a line that had swapped places.
    expect(w.find('#life-beat-heading').text()).toBe(BEAT.heading)
    expect(w.find('#life-beat-said').text()).toBe(BEAT.said)
    expect(w.findAll('.life-beat-choice-label').map((n) => n.text())).toEqual(BEAT.options.map((o) => o.label))
    w.unmount()
  })

  it('⚠ NO NUMBER ON THIS SCREEN – no bond meter, no count, no price', () => {
    // The wave's fence: his words move `bond` twice and none of it may be shown, and an answer is
    // never a purchase. The assertion above already forbids a figure the component invents; this
    // names the shapes so a failure says WHICH rule broke.
    const w = mountDialog(BEAT)
    expect(w.text()).not.toMatch(/[$€£]/)
    expect(w.text()).not.toMatch(/[+-]\s?\d/)
    expect(w.text()).not.toMatch(/\bcosts?\b|\bcents?\b|\bbond\b|\bpoints?\b/i)
    expect(w.find('progress').exists(), 'no meter').toBe(false)
    expect(w.find('meter').exists(), 'and no bar').toBe(false)
    w.unmount()
  })

  // ===============================================================================================
  // ⭐⭐⭐ ROUND 40'S CONVENTIONS – A CONTROL THAT SELECTS SAYS SO
  // ===============================================================================================
  it('⭐ the answers are a REAL radio group, named by her line', () => {
    // Mutation-verified by dropping `role="radiogroup"`: this goes red and the census below stays
    // green, which is exactly why they are two.
    const w = mountDialog(BEAT)
    const group = w.find('.life-beat-choices')
    expect(group.attributes('role')).toBe('radiogroup')
    // Named by what the answers are answering – her line, not the heading.
    expect(group.attributes('aria-labelledby')).toBe('life-beat-said')
    expect(w.find('#life-beat-said').exists(), 'and that id is really on the page').toBe(true)
    w.unmount()
  })

  it('⭐ every answer is a radio, it announces its state, and nothing is checked on arrival', () => {
    // Mutation-verified by dropping `role="radio"` (census red) and by binding `:aria-checked` to
    // `undefined` (the state arm red, the census green).
    const w = mountDialog(BEAT)
    const rows = w.findAll('button.life-beat-choice')
    expect(rows.length).toBe(BEAT.options.length)
    for (const row of rows) {
      expect(row.attributes('role'), 'a control that selects says so').toBe('radio')
      // ⚠ NOTHING IS CHECKED ON ARRIVAL: a preselected answer would be the card recommending one.
      expect(row.attributes('aria-checked'), 'nothing is pressed before he presses it').toBe('false')
      expect(row.attributes('disabled'), 'and all of them are live').toBeUndefined()
    }
    w.unmount()
  })

  it('⭐ the mark is the ball, on every control, and it is decorative', () => {
    // Round 40 #1's visual, the same span and the same tokens PrologueCard uses. Mutation-verified
    // by deleting `.life-beat-mark` from the template: this goes red, everything else stays green.
    const w = mountDialog(BEAT)
    const rows = w.findAll('button.life-beat-choice')
    for (const row of rows) {
      const mark = row.find('.life-beat-mark')
      expect(mark.exists(), 'a selection is drawn as a selection').toBe(true)
      // The state is on the BUTTON; a circle that announced itself would say it twice.
      expect(mark.attributes('aria-hidden')).toBe('true')
      expect(mark.text(), 'a disc, not a glyph').toBe('')
    }
    w.unmount()
  })

  it('⭐ NOTHING MARKS AN ANSWER – all the rows carry the identical shape', () => {
    // The fork's ruling 4 arriving on this card: it may not recommend. The strongest form a mounted
    // test can make – no row differs from the others in class, attribute or structure. Mutation-
    // verified by adding `:class="{ 'is-first': index === 0 }"`: the set grows to two and this fails.
    const w = mountDialog(BEAT)
    const rows = w.findAll('button.life-beat-choice')
    const shapes = new Set(
      rows.map((r) =>
        JSON.stringify({
          class: (r.attributes('class') ?? '').split(/\s+/).sort(),
          keys: Object.keys(r.attributes()).sort(),
          children: [...r.element.children].map((c) => c.className),
        }),
      ),
    )
    expect(shapes.size, 'one shape for every answer').toBe(1)
    w.unmount()
  })

  it('⭐ availability is DERIVED every render, not latched – the store\'s own busy disables them', async () => {
    // Round 40's third convention. Mutation-verified by narrowing `:disabled="busy"` to
    // `:disabled="sending"`: the `game.busy` arm goes red and every other assertion stays green.
    const store = useGameStore()
    const w = mountDialog(BEAT)
    for (const b of w.findAll('button.life-beat-choice')) expect(b.attributes('disabled')).toBeUndefined()
    store.busy = true
    await nextTick()
    for (const b of w.findAll('button.life-beat-choice')) {
      expect(b.attributes('disabled'), 'a command is in flight somewhere else').toBeDefined()
    }
    // ...and DERIVED means it comes back on its own when the flag drops, with no reset to call.
    store.busy = false
    await nextTick()
    for (const b of w.findAll('button.life-beat-choice')) expect(b.attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('⭐ the arrows walk the group and do not select', async () => {
    // WAI-ARIA's documented variation, PrologueCard's own: selecting on focus would answer her with
    // an arrow key and take the week with it. Mutation-verified by deleting the handler – the focus
    // arm goes red alone.
    const { w } = mountAttached(BEAT)
    const rows = [...document.querySelectorAll<HTMLButtonElement>('button.life-beat-choice')]
    rows[0].focus()
    const group = document.querySelector('.life-beat-choices')!
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(document.activeElement, 'the arrow moves the focus').toBe(rows[1])
    // ...and it did NOT answer: nothing is checked and the card is still asking.
    for (const row of rows) expect(row.getAttribute('aria-checked')).toBe('false')
    expect(document.querySelector('.life-beat-dialog')).toBeTruthy()
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    await nextTick()
    expect(document.activeElement, 'and back round the other way').toBe(rows[0])
    w.unmount()
  })

  // ===============================================================================================
  // THE PRESS
  // ===============================================================================================
  it('a press sends the option id and nothing else', async () => {
    // Intercept the STORE action rather than the worker: that is the seam this component owns.
    const store = useGameStore()
    store.snapshot = snapshotWith(BEAT)
    const sent: string[] = []
    store.answerLifeBeat = async (optionId: string) => {
      sent.push(optionId)
      await Promise.resolve()
    }
    const w = mount(LifeBeatDialog, { global: { stubs: { teleport: true } } })
    await w.findAll('button.life-beat-choice')[1].trigger('click')
    expect(sent).toEqual([BEAT.options[1].id])
    w.unmount()
  })

  it('⭐ the press marks the answer while it is in flight, and releases it if it did not land', async () => {
    // The mark exists because the press round-trips through the worker: without it the tap that
    // stops the week looks like it did nothing. ⚠ AND IT IS RELEASED rather than latched – a refused
    // command leaves the prompt standing, and a card still asking may not claim a decision the world
    // never took. Mutation-verified by binding `:aria-checked` to `undefined` (the in-flight arm goes
    // red) and by dropping the `if (prompt.value) chosen.value = null` line (the release arm does).
    const store = useGameStore()
    store.snapshot = snapshotWith(BEAT)
    let release: () => void = () => {}
    store.answerLifeBeat = () => new Promise<void>((resolve) => { release = resolve })
    const w = mount(LifeBeatDialog, { global: { stubs: { teleport: true } } })

    const rows = () => w.findAll('button.life-beat-choice')
    await rows()[0].trigger('click')
    expect(rows()[0].attributes('aria-checked'), 'his answer, while the worker has it').toBe('true')
    expect(rows()[1].attributes('aria-checked'), 'and only his').toBe('false')
    for (const b of rows()) expect(b.attributes('disabled'), 'nothing else can be pressed').toBeDefined()

    release()
    await nextTick()
    await nextTick()
    // The prompt is still up (the stub changed no snapshot), so the answer did not take.
    expect(rows()[0].attributes('aria-checked'), 'released – the card is still asking').toBe('false')
    for (const b of rows()) expect(b.attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('⚠ a double-tap sends ONE answer – the second press in the same tick is dropped', async () => {
    // `answerLifeBeat` throws on a beat that is already answered, so without the guard a fast second
    // press surfaces an error toast for a decision that actually succeeded.
    //
    // ⚠⚠ BOTH CLICKS ARE DISPATCHED IN ONE TICK, AND THAT IS WHAT MAKES THIS A TEST OF THE GUARD.
    // `sending` is set synchronously but the `disabled` attribute is patched on the next tick, so a
    // real double-tap arrives at a button the DOM still thinks is live – and `if (busy.value)
    // return` is the only thing that stops the second. Written with `trigger('click')` and an await
    // between the two, this case passed with the guard DELETED (measured), because
    // `DOMWrapper.trigger` returns early on a disabled element: the awaited version was asserting
    // the `:disabled` binding a case above it already owns.
    const store = useGameStore()
    store.snapshot = snapshotWith(BEAT)
    const sent: string[] = []
    let release: () => void = () => {}
    store.answerLifeBeat = async (optionId: string) => {
      sent.push(optionId)
      await new Promise<void>((resolve) => { release = resolve })
    }
    const w = mount(LifeBeatDialog, { global: { stubs: { teleport: true } } })
    const rows = w.findAll('button.life-beat-choice')
    rows[0].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    rows[1].element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(sent, 'the second press in the same tick is not a second answer').toEqual([BEAT.options[0].id])
    release()
    w.unmount()
  })

  // ===============================================================================================
  // THE SHELL
  // ===============================================================================================
  it('it is a MODAL and says so (a11y D1)', () => {
    const w = mountDialog(BEAT)
    const card = w.find('[role="dialog"]')
    expect(card.exists()).toBe(true)
    expect(card.attributes('aria-modal')).toBe('true')
    expect(card.attributes('aria-labelledby')).toBe('life-beat-heading')
    expect(card.attributes('tabindex'), 'somewhere to land the trap').toBe('-1')
    w.unmount()
  })

  it('it is not up when no beat is pending – so nothing above is vacuous', () => {
    const w = mountDialog(null)
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(w.findAll('button').length).toBe(0)
    w.unmount()
  })

  it('⭐ the queue puts her BEFORE the fork and behind the birthday', () => {
    // The order is the feature, and it is the engine's own `STOP_PRECEDENCE`. Mutation-verified by
    // moving the `lifeBeatPrompt` clause below the `fork` one in `blockingOverlay`: the first
    // assertion answers 'fork' and this goes red.
    const base = snapshotWith(BEAT)
    expect(blockingOverlay({ ...base, fork: {} as never }), 'he hears her out first').toBe('life')
    expect(
      blockingOverlay({ ...base, birthdayPrompt: {} as never }),
      'but the birthday is still told first',
    ).toBe('birthday')
    expect(blockingOverlay(snapshotWith(null)), 'and nothing is raised on a quiet week').toBeNull()
  })

  // ===============================================================================================
  // ⭐ ROUND-17 #3 – THE ANSWERS ARE LEGIBLE AGAINST THE ROW THEY SIT ON
  // ===============================================================================================
  it('⭐ her line and every answer clear WCAG AA, and the empty ball can be seen', () => {
    // A structural test cannot fail on a colour: the birthday's four rows shipped at a measured
    // 1.09:1 with every structural assertion green, on a dialog with no way out. So this is a
    // measured ratio through the real cascade and not a token-name pin.
    // Mutation-verified by restoring the shipped defect – `background: var(--card, #fff)` on
    // `.life-beat-choice` – which puts the label at 1.09:1 and goes red.
    const { w } = mountAttached(BEAT)
    assertLegible(document.querySelector('#life-beat-said')!, 'life-beat-said')
    const rows = document.querySelectorAll('button.life-beat-choice')
    expect(rows.length, 'not vacuous – there are rows to measure').toBe(BEAT.options.length)
    for (const row of rows) {
      assertLegible(row.querySelector('.life-beat-choice-label')!, 'life-beat-choice-label')
      // ⚠ AND THE UNCHECKED BALL HAS TO BE VISIBLE – a radio nobody can see until after they press
      // it is not a radio. WCAG 2.1 1.4.11 asks 3:1 of a control's own boundary.
      const mark = row.querySelector('.life-beat-mark')!
      const ring = parseColor(getComputedStyle(mark).borderTopColor)
      const under = effectiveBackground(row)
      const ratio = contrastRatio([ring[0], ring[1], ring[2]], under)
      expect(ratio, 'the empty ball against the row it sits on').toBeGreaterThanOrEqual(3)
    }
    w.unmount()
  })
})

// =================================================================================================
// ⚠⚠ THE ROUND-20 POPUP LAW – THE LAST CONTROL IS INSIDE A 375x667 PHONE
// =================================================================================================
//
// CLAUDE.md's gotcha, in its own words: "any dialog you add or lengthen gets a mounted assertion
// that its dismiss control's box is inside a 375x667 viewport, and prove it by mutating: a test that
// cannot fail on the too-tall version is not this test."
//
// ⚠ THE STAKE, RECORDED BECAUSE IT IS THE REASON. `TourBriefingDialog` shipped on the shared
// `dialog-card` with a lead, a list, five bullets and a closing line: 1078px of card inside 635px of
// room, Continue at y=821..855, on a BLOCKING overlay. The owner's career stopped there and could
// not be resumed. This card is blocking too, and its way out IS its last answer – there is nothing
// else to press.
describe('⚠⚠ the life beat fits a phone, and the last answer can be reached', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  /** ⚠ THE STRUCTURAL PRECONDITION, ASSERTED BEFORE ANY MEASUREMENT. `measureDialog` reads the
   *  control's box off the CARD's own bottom edge, so the answers have to be the last thing in the
   *  flow – anything appended after them would make every number below quietly wrong while every
   *  assertion stayed green. Mutation-verified by moving `.life-beat-choices` above
   *  `.life-beat-said` in the template: this throws before the fit is ever measured. */
  function lastControl(card: Element): Element {
    const choices = card.querySelector('.life-beat-choices')!
    expect(choices, 'the answers are on the card').toBeTruthy()
    expect(card.lastElementChild, 'the answers are the card\'s last element').toBe(choices)
    const last = choices.lastElementChild!
    expect(last.classList.contains('life-beat-choice'), 'and the last of them is an answer').toBe(true)
    return last
  }

  it('the last answer is inside the screen, and the card is bounded and scrolls', () => {
    const { w, card } = mountAttached(BEAT)
    const fit = assertDismissReachable(card, lastControl(card), PHONE, 'LifeBeatDialog (the answers)')
    expect(fit.available.height, 'the scrim leaves 667 minus its own 16 either side').toBe(635)
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen the app supports', () => {
    const { w, card } = mountAttached(BEAT, NARROW_PHONE)
    assertDismissReachable(card, lastControl(card), NARROW_PHONE, 'LifeBeatDialog (320x568)')
    w.unmount()
  })

  it('⚠ a beat whose copy runs long still lands its last answer on the phone', () => {
    // The whole point of the cap: the pools are copy and copy grows. A prompt far longer than any
    // approved one still leaves the last answer reachable, because the card scrolls instead of
    // overflowing the scrim at both ends.
    const { w, card } = mountAttached(TOO_TALL)
    const fit = assertDismissReachable(card, lastControl(card), PHONE, 'LifeBeatDialog (a long beat)')
    expect(
      fit.contentFloor,
      'the long beat really is taller than the phone, or the case below measures nothing',
    ).toBeGreaterThan(fit.available.height)
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on the long beat and the SAME assertion goes red', () => {
    // The card `TourBriefingDialog` shipped as: content past the fold and no scroller anywhere in
    // the chain to reach it. Measured here at contentFloor 1071px against 635px of room.
    const { w, card } = mountAttached(TOO_TALL)
    const dismiss = lastControl(card)
    const before = measureDialog(card, dismiss, PHONE)
    expect(before.contentFloor, 'the mutation is not vacuous').toBeGreaterThan(before.available.height)
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'LifeBeatDialog (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    // ...and putting it back makes it green again, which is what says the cap is the thing that
    // holds and not some accident of the fixture.
    ;(card as HTMLElement).style.maxHeight = ''
    ;(card as HTMLElement).style.overflowY = ''
    assertDismissReachable(card, dismiss, PHONE, 'LifeBeatDialog (cap restored)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF, THE OTHER HALF – the cap is asserted even on copy that fits today', () => {
    // The content-independent arm, and it is the one that still holds after the next sentence is
    // added. Today's fixture DOES fit, so the first mutation could not run on it – this one can, and
    // between them both branches of `assertDismissReachable` are exercised.
    const { w, card } = mountAttached(BEAT)
    const dismiss = lastControl(card)
    expect(
      measureDialog(card, dismiss, PHONE).contentFloor,
      'this fixture fits unaided, which is why this arm is separate',
    ).toBeLessThan(635)
    ;(card as HTMLElement).style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'LifeBeatDialog (unbounded)')).toThrow(
      /declares no height bound that fits/,
    )
    w.unmount()
  })
})
