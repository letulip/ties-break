// ⭐ THE BIRTHDAY POPUP, MOUNTED – docs/specs/birthday-and-gifts.md.
//
// ⚠ WHY MOUNTED AND NOT A SOURCE PIN. Every claim this feature makes is a claim about what is ON THE
// SCREEN: four rows and not three, a column and not a grid, no way out that is not an answer, and –
// the one the owner ruled on twice – NOTHING marking which row answers the ask. A source pin would
// assert that a class name exists; only a mounted card can say that no row differs from the others.
// CLAUDE.md: "Mutate the thing you think you are covering and watch it fail before you believe a
// green run." Each block below names what was mutated to prove it.
//
// The snapshot is a REAL one, ticked to a real birthday through the real engine, so the words being
// asserted are the engine's own rather than a fixture's.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET, IMPORTED FOR ITS `:root` – see the legibility block at the bottom of
// this file. Without it `var(--text)` resolves to nothing and every colour assertion is vacuous.
import '../../src/style.css'
import { assertLegible, contrastRatio, effectiveBackground, parseColor } from './contrast'
import { assertDismissReachable, NARROW_PHONE, PHONE, setViewport } from './fits'
import BirthdayDialog from '../../src/components/BirthdayDialog.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  birthdayOfferFor,
  createWorld,
  decideKnock,
  pendingBirthday,
  pendingKnock,
  tickWeek,
  toSnapshot,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A real career ticked to a real birthday. Born 15 June, so it lands mid-season. */
function birthdaySnapshot(seed = 'bday-ui'): { snap: Snapshot; askedId: string } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60 && pendingBirthday(world) === null; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  const age = pendingBirthday(world)
  if (age === null) throw new Error('the fixture never reached a birthday')
  // ⚠ ROUND 42 #26 – THE ENGINE'S OWN SEAM, NOT A REBUILT OFFER. `birthdayOffer(world.seed, age)` is a
  // SECOND derivation of the four rows and it diverges the moment a given durable leaves the card, so
  // `chooseGift` refuses the answer – the R2-18 failure `tests/round23-kid-life.test.ts` wrote down.
  return { snap: toSnapshot(world), askedId: birthdayOfferFor(world, age).askedId }
}

function mountDialog(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(BirthdayDialog, { global: { stubs: { teleport: true } } })
}

describe('BirthdayDialog – the four presents', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ FOUR ROWS, IN A COLUMN, and every one of them is a real button', () => {
    // Owner, 11.08: «в колонку ставь, там хватит места». Mutation-verified by slicing the engine's
    // options to three: the count assertion fails.
    const { snap } = birthdaySnapshot()
    const w = mountDialog(snap)
    const rows = w.findAll('button.birthday-choice')
    expect(rows.length, 'three gifts plus the day together').toBe(4)
    for (const row of rows) {
      expect(row.attributes('disabled'), 'all four are live').toBeUndefined()
      expect(row.text().length, 'and every one says what it is').toBeGreaterThan(10)
    }
    // A COLUMN and not a row: the container is a flex column, which is what makes four fit at 375px.
    expect(w.find('.birthday-choices').exists()).toBe(true)
    w.unmount()
  })

  it('⭐ NOTHING MARKS THE ANSWER – all four rows carry the identical classes', () => {
    // The owner, twice: «не помечай, пусть игрок читает». The strongest form of this claim a mounted
    // test can make: the row that answers the ask is INDISTINGUISHABLE from the three that do not, in
    // class, in attributes and in structure. Mutation-verified by adding `:class="{ answer: ... }"` to
    // the row – the set below grows to two entries and this fails.
    const { snap, askedId } = birthdaySnapshot()
    const w = mountDialog(snap)
    const rows = w.findAll('button.birthday-choice')
    const shapes = new Set(
      rows.map((r) => JSON.stringify({
        class: (r.attributes('class') ?? '').split(/\s+/).sort(),
        keys: Object.keys(r.attributes()).sort(),
        children: r.element.children.length,
        childClasses: [...r.element.children].map((c) => c.className),
      })),
    )
    expect(shapes.size, 'one shape for all four rows').toBe(1)
    // ...and the answer really IS among them, or the test above is vacuous.
    expect(snap.birthdayPrompt!.options.some((o) => o.id === askedId)).toBe(true)
    // ...and no row's text names it as the answer.
    for (const r of rows) expect(r.text()).not.toMatch(/what she asked|she wants this|correct/i)
    w.unmount()
  })

  it('⭐ the ask is printed in PROSE, above the rows', () => {
    const { snap } = birthdaySnapshot()
    const w = mountDialog(snap)
    const ask = w.find('.birthday-ask')
    expect(ask.exists(), 'she asks for something').toBe(true)
    expect(ask.text()).toBe(snap.birthdayPrompt!.ask)
    expect(ask.text().length, 'a sentence, not a label').toBeGreaterThan(20)
    // The engine's words, not the component's: the ask is on the snapshot.
    expect(w.text()).toContain(snap.birthdayPrompt!.ask)
    w.unmount()
  })

  it('⚠ NO PRICE ANYWHERE ON THE SCREEN', () => {
    // «про цену момент, давай не будем это учитывать в нашем кошельке вообще» – and a displayed price
    // that is never taken would be a lie on the screen. Mutation-verified by adding a `$120` to one
    // gift's note in the catalogue: this fails.
    const { snap } = birthdaySnapshot()
    const w = mountDialog(snap)
    expect(w.text()).not.toMatch(/[$€£]/)
    expect(w.text()).not.toMatch(/\bcosts?\b|\bcents?\b|\bfree\b/i)
    w.unmount()
  })

  it('⚠ NO WAY OUT THAT IS NOT AN ANSWER – no close button, no dismiss, no overlay click', async () => {
    // The consequence of «я бы оставил попап на ДР всегда»: if the dialog could be closed, closing it
    // would silently become the "gave nothing" branch. Mutation-verified by wiring `@click.self` on
    // the overlay – the handler assertion below fails.
    const { snap } = birthdaySnapshot()
    const w = mountDialog(snap)
    const buttons = w.findAll('button')
    expect(buttons.length, 'exactly four buttons, and all four are presents').toBe(4)
    for (const b of buttons) expect(b.classes()).toContain('birthday-choice')
    expect(w.text()).not.toMatch(/\b(close|cancel|dismiss|not now|later|skip)\b/i)
    // ⚠⚠ RE-AIMED 09.09, AND THE OLD FORM WAS VACUOUS. This read
    // `expect(w.find('.dialog-overlay').attributes('onclick')).toBeUndefined()` – but Vue 3 binds
    // `@click` with `addEventListener`, so the `onclick` ATTRIBUTE is undefined whatever the
    // template says. Measured while wave 2 built the same law into its own dialog: wiring
    // `@click.self` on that overlay left every case in its file GREEN under the attribute form. So
    // the sentence above this file has always made – «mutation-verified by wiring `@click.self`» –
    // was not true of this assertion, and the scrim half of the law has been unguarded since it
    // shipped.
    // ⚠ The honest form dispatches a REAL click at the scrim and at the card and asserts that
    // nothing was answered. It goes red on exactly the mutation the old one was supposed to catch.
    const sent: string[] = []
    useGameStore().chooseGift = async (giftId: string) => {
      sent.push(giftId)
      await Promise.resolve()
    }
    // ⚠ THROUGH THE WRAPPER, NOT `document`. `mount()` renders into a DETACHED container, so
    // `document.querySelector('.dialog-overlay')` is null here and an optional-chained dispatch on it
    // is a second vacuous assertion wearing a fix. Caught by mutation, which is the only reason this
    // line reads the way it does.
    for (const sel of ['.dialog-overlay', '.dialog-card']) {
      const el = w.find(sel)
      expect(el.exists(), `${sel} has to be in the tree for this assertion to mean anything`).toBe(true)
      el.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
    await nextTick()
    expect(sent, 'clicking the scrim or the card must not answer for him').toEqual([])
    w.unmount()
  })

  it('it is a MODAL and says so (a11y D1)', () => {
    const { snap } = birthdaySnapshot()
    const w = mountDialog(snap)
    const card = w.find('[role="dialog"]')
    expect(card.exists()).toBe(true)
    expect(card.attributes('aria-modal')).toBe('true')
    // Labelled by the two heading lines, in the order they are read.
    expect(card.attributes('aria-labelledby')).toBe('birthday-dialog-kicker birthday-dialog-title')
    expect(w.find('#birthday-dialog-title').text()).toBe(snap.birthdayPrompt!.heading)
    w.unmount()
  })

  it('it is not up on a week that is not her birthday – so every test above is not vacuous', () => {
    const world = createWorld('quiet-week', { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 15 })
    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng)
    useGameStore().snapshot = toSnapshot(world)
    const w = mount(BirthdayDialog, { global: { stubs: { teleport: true } } })
    expect(w.find('[role="dialog"]').exists()).toBe(false)
    expect(w.findAll('button').length).toBe(0)
    w.unmount()
  })

  // =============================================================================================
  // ⭐ ROUND-17 #3 – THE LABELS ARE LEGIBLE AGAINST THE BUTTON THEY SIT ON
  // =============================================================================================
  // WHAT SHIPPED: `background: var(--card, #fff)` on the row and `color: var(--ink, #1c1c1e)` on the
  // label. `--card` is declared nowhere in this app, so the fallback won and the button was WHITE;
  // `--ink` is declared, at `#f2f6f8`, so the label was near-white. Measured on the real cascade:
  // 1.09:1, both the label and the note. Four unreadable buttons, on the one dialog with no way out
  // that is not an answer – the player could not read the options and could not leave.
  //
  // ⚠ AND NOTHING IN THIS FILE COULD SEE IT. Every block above asserts structure – four rows, one
  // shape, no price, no exit – and all of them passed on the broken build, because a mounted test
  // that never looks at a colour cannot fail on one. `tests/design-tokens.test.ts` rule A was blind
  // to it for a different reason: it skips any `var()` carrying a fallback, and both broken
  // references carried one. THIS is why the assertion is a measured ratio and not a token-name pin -
  // a pin on `var(--text)` would pass the day somebody redefines `--text`.
  //
  // Mutation-verified, twice, and the numbers are recorded because they are the measurement:
  //   * `background: var(--card, #fff)` restored -> label 1.09:1, FAILS
  //   * `color: var(--muted)` -> `color: var(--ink-dim)` on the note -> 3.63:1, FAILS
  // Green today: label 14.73:1, note 5.62:1, ask 16.60:1.
  it('⭐ #3 – every label and note clears WCAG AA against its own background', () => {
    const { snap } = birthdaySnapshot()
    // attachTo: the cascade is only real for elements that are IN the document.
    useGameStore().snapshot = snap
    const w = mount(BirthdayDialog, { attachTo: document.body })

    const rows = document.querySelectorAll('button.birthday-choice')
    expect(rows.length, 'not vacuous – there are rows to measure').toBe(4)
    for (const row of rows) {
      const label = row.querySelector('.birthday-choice-label')!
      const note = row.querySelector('.birthday-choice-note')!
      expect(label.textContent!.trim().length, 'and the label has words in it').toBeGreaterThan(0)
      // 15px/600 is not "large text" by WCAG (that starts at 18.66px bold), so it is the 4.5:1 bar.
      assertLegible(label, 'birthday-choice-label')
      assertLegible(note, 'birthday-choice-note')
    }
    // The ask is the line that tells her want – it is the reason the scene works, and it is on the
    // card rather than on a row, so it is measured separately.
    assertLegible(document.querySelector('.birthday-ask')!, 'birthday-ask')
    w.unmount()
  })

  it('a choice sends the id and nothing else, and the row disables while it is in flight', async () => {
    // ⚠ RE-AIMED BY ROUND 45 #1: the tap that used to send is a SELECTION now, so the send is read
    // off the Proceed. The claim is unchanged – the id that reaches `chooseGift` is the engine's own
    // option id and nothing else crosses – which is why this case kept its name.
    const { snap } = birthdaySnapshot()
    const store = useGameStore()
    store.snapshot = snap
    const sent: string[] = []
    // Intercept the store action rather than the worker: this is the seam the component owns.
    store.chooseGift = async (giftId: string) => {
      sent.push(giftId)
      await Promise.resolve()
    }
    const w = mount(BirthdayDialog, { global: { stubs: { teleport: true } } })
    await w.findAll('button.birthday-choice')[2].trigger('click')
    await w.find('.birthday-proceed').trigger('click')
    expect(sent).toEqual([snap.birthdayPrompt!.options[2].id])
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 45 #1 – THE PRESENTS SELECT, AND A PROCEED GIVES. MOUNTED.
// =================================================================================================
//
// The owner, on the deployed build: «в попапе дня рождения надо такой же паттерн использовать, как и
// в других местах – выбрали ответ – подтвердили кнопкой, чтобы не было случайных нажатий», and he
// named the donor himself when the psychologist's confirm was offered instead: «скорее попап смол
// тока здесь больше подойдет». So this is `LifeBeatDialog`'s round-42 #8 shape – the one
// `KnockDialog` already wears – arriving on the last single-tap card in the app.
//
// ⚠⚠ MUTATION ARMS – each APPLIED to the real component and RUN against this block, each red
// recorded as MEASURED rather than predicted; the restored tree is green.
//   ARM 1  `select()` wired back to the single tap (a `chooseGift` call beside the mark)
//          -> RED [3]: the select case, the re-aimed send case and the double-Proceed case all count
//          a present given before the Proceed. Round 45 #1's headline claim, falsified and caught.
//   ARM 2  the `sending` half dropped from `confirm()`'s guard -> RED [1]: two presents for one
//          birthday on a double-tap.
//   ARM 3  the Proceed rendered unconditionally (`v-if="chosen !== null"` removed) -> RED [2]: the
//          arrival census counts five buttons where the question offers four, and the no-way-out
//          case above counts a fifth button that is not a present.
//   ARM 4  `.birthday-mark` dropped from the row -> RED [2]: the ball census and the 3:1 case.
//   ARM 5  `.dialog-card`'s height cap stripped -> RED [1]: the selected-state phone fit.
//   ARM 6  the `watch` that clears the selection when the prompt goes away, removed -> RED [1]: the
//          card re-opens a year later with last year's present still marked.
describe('ROUND 45 #1 – the birthday selects, and only the Proceed gives', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ the first tap SELECTS and gives NOTHING; only the Proceed calls chooseGift', async () => {
    const { snap } = birthdaySnapshot()
    const store = useGameStore()
    store.snapshot = snap
    const given: string[] = []
    store.chooseGift = async (giftId: string) => {
      given.push(giftId)
    }
    const w = mount(BirthdayDialog, { global: { stubs: { teleport: true } } })

    const rows = w.findAll('button.birthday-choice')
    expect(rows).toHaveLength(4)
    await rows[3].trigger('click')
    expect(given, 'the tap that used to hand her a present hands her nothing now').toEqual([])
    expect(rows[3].attributes('aria-checked'), 'it is a selection, and it says so').toBe('true')
    for (const other of [0, 1, 2]) expect(rows[other].attributes('aria-checked')).toBe('false')

    // Re-choosing is free – a selection is not a present.
    await rows[1].trigger('click')
    expect(given).toEqual([])
    expect(rows[1].attributes('aria-checked')).toBe('true')
    expect(rows[3].attributes('aria-checked')).toBe('false')

    const proceed = w.find('.birthday-proceed')
    expect(proceed.exists(), 'the way on appeared under the answered question').toBe(true)
    expect(proceed.text(), 'the prologue\'s shipped confirm word, reused and not coined').toBe('Proceed')
    await proceed.trigger('click')
    expect(given, 'the Proceed gives the SELECTED present – the last one marked').toEqual([
      snap.birthdayPrompt!.options[1].id,
    ])
    w.unmount()
  })

  it('⭐ nothing is selected on arrival, and the Proceed is not offered before a selection (ARM 3)', () => {
    const { snap } = birthdaySnapshot()
    const w = mountDialog(snap)
    const rows = w.findAll('button.birthday-choice')
    for (const row of rows) {
      expect(row.attributes('role'), 'a control that selects says so').toBe('radio')
      expect(row.attributes('aria-checked'), 'nothing marked before he marks it').toBe('false')
      // ...and the ball is drawn, decorative, on all four (ARM 4).
      const mark = row.find('.birthday-mark')
      expect(mark.exists(), 'a selection is drawn as a selection').toBe(true)
      expect(mark.attributes('aria-hidden')).toBe('true')
    }
    // The census: four presents and NOTHING else on arrival.
    expect(w.findAll('button')).toHaveLength(4)
    expect(w.find('.birthday-proceed').exists()).toBe(false)
    // The group is named by the ask, which is the sentence these four answer.
    expect(w.find('[role="radiogroup"]').attributes('aria-labelledby')).toBe('birthday-ask')
    expect(w.find('#birthday-ask').text()).toBe(snap.birthdayPrompt!.ask)
    w.unmount()
  })

  it('⭐ AND THE FOUR ROWS ARE STILL ONE SHAPE – selecting did not give the card a way to mark an answer', () => {
    // «не помечай, пусть игрок читает» survives the conversion, and this is the strongest form of it:
    // with a selection idiom on the row there are now TWO attributes a later hand could single a row
    // out with, so the shape census is re-taken over both.
    const { snap, askedId } = birthdaySnapshot()
    const w = mountDialog(snap)
    const rows = w.findAll('button.birthday-choice')
    const shapes = new Set(
      rows.map((r) =>
        JSON.stringify({
          class: (r.attributes('class') ?? '').split(/\s+/).sort(),
          attrs: Object.entries(r.attributes())
            .filter(([k]) => k !== 'id')
            .map(([k, v]) => `${k}=${v}`)
            .sort(),
          childClasses: [...r.element.children].map((c) => c.className),
        }),
      ),
    )
    expect(shapes.size, 'one shape for all four rows, marks included').toBe(1)
    expect(snap.birthdayPrompt!.options.some((o) => o.id === askedId), 'and the answer is among them').toBe(true)
    w.unmount()
  })

  it('⚠ THE SELECTION DIES WITH THE CARD – next year opens with nothing marked (ARM 6)', async () => {
    // `App.vue` mounts this dialog under a `v-if`, so in the shipped app the instance is destroyed
    // between birthdays and the reset can never fire. It is guarded anyway because the guarantee
    // belongs to the CARD: a mount that outlived its prompt – which is exactly how every case in this
    // file mounts it – would open next year with last year's present already marked and a Proceed
    // standing under an unanswered question. That is «случайные нажатия» arriving by another door.
    const { snap } = birthdaySnapshot()
    const store = useGameStore()
    store.snapshot = snap
    const w = mount(BirthdayDialog, { global: { stubs: { teleport: true } } })
    await w.findAll('button.birthday-choice')[0].trigger('click')
    expect(w.find('.birthday-proceed').exists(), 'a present is marked').toBe(true)

    // the birthday is answered and the week moves on...
    store.snapshot = { ...snap, birthdayPrompt: null }
    await nextTick()
    expect(w.find('[role="dialog"]').exists(), 'the card is gone').toBe(false)

    // ...and a year later the same card comes back, asking.
    store.snapshot = snap
    await nextTick()
    expect(w.find('.birthday-proceed').exists(), 'no way on under a question nobody has answered').toBe(false)
    for (const row of w.findAll('button.birthday-choice')) {
      expect(row.attributes('aria-checked'), 'and last year\'s present is not marked').toBe('false')
    }
    w.unmount()
  })

  it('⚠ a double-tap on the Proceed gives ONCE (ARM 2), and a held flight disables the card', async () => {
    const { snap } = birthdaySnapshot()
    const store = useGameStore()
    store.snapshot = snap
    const given: string[] = []
    let release: () => void = () => {}
    store.chooseGift = async (giftId: string) => {
      given.push(giftId)
      await new Promise<void>((resolve) => {
        release = resolve
      })
    }
    const w = mount(BirthdayDialog, { global: { stubs: { teleport: true } } })
    await w.findAll('button.birthday-choice')[0].trigger('click')
    const proceed = w.find('.birthday-proceed')
    // Both clicks in ONE tick – the DOM has not patched `disabled` yet, so the guard in `confirm()`
    // is the only thing standing.
    proceed.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    proceed.element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(given, 'one present, not two').toEqual([snap.birthdayPrompt!.options[0].id])
    for (const b of w.findAll('button')) {
      expect(b.attributes('disabled'), 'in flight, every control stands down').toBeDefined()
    }
    release()
    w.unmount()
  })

  it('⭐ the arrows walk the presents and do not select – the group convention, on this card too', async () => {
    const { snap } = birthdaySnapshot()
    useGameStore().snapshot = snap
    const w = mount(BirthdayDialog, { attachTo: document.body })
    const rows = [...document.querySelectorAll<HTMLButtonElement>('button.birthday-choice')]
    rows[0].focus()
    document
      .querySelector('.birthday-choices')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(document.activeElement, 'the arrow moves the focus').toBe(rows[1])
    for (const row of rows) expect(row.getAttribute('aria-checked'), 'and marks nothing').toBe('false')
    w.unmount()
  })

  it('⭐ the empty ball is visible on every row (WCAG 1.4.11, ARM 4)', () => {
    // The ring is what makes the control findable at all before anything is selected, and these rows
    // sit on the accent wash rather than on the life beat's `--card-top`, so the 3:1 verdict is
    // re-taken against the ground THIS card really paints.
    setViewport(PHONE)
    const { snap } = birthdaySnapshot()
    useGameStore().snapshot = snap
    const w = mount(BirthdayDialog, { attachTo: document.body })
    const rows = document.querySelectorAll('button.birthday-choice')
    expect(rows.length, 'not vacuous – there are rows to measure').toBe(4)
    for (const row of rows) {
      const mark = row.querySelector('.birthday-mark')!
      const ring = parseColor(getComputedStyle(mark).borderTopColor)
      const ratio = contrastRatio([ring[0], ring[1], ring[2]], effectiveBackground(row))
      expect(ratio, 'the empty ball against the present it marks').toBeGreaterThanOrEqual(3)
    }
    w.unmount()
  })

  it('⚠⚠ ROUND-20 – the SELECTED state fits the phone: the Proceed is the way out and it is reachable', async () => {
    // The fit net in `r2-07-dialog-shell.test.ts` measures this card on ARRIVAL, where the four rows
    // are the last thing in the flow. The selected state is one control taller, and the way out of it
    // is the Proceed – so the round-20 verdict is re-taken on the state the player actually leaves by.
    for (const vp of [PHONE, NARROW_PHONE]) {
      document.body.innerHTML = ''
      setViewport(vp)
      const { snap } = birthdaySnapshot()
      useGameStore().snapshot = snap
      const w = mount(BirthdayDialog, { attachTo: document.body })
      const card = document.querySelector('.birthday-dialog')!
      document.querySelectorAll<HTMLButtonElement>('button.birthday-choice')[0].click()
      await nextTick()
      const proceed = card.querySelector('.birthday-proceed')!
      expect(proceed, 'the selected state is up – nothing below is vacuous').toBeTruthy()
      expect(card.lastElementChild, 'the Proceed is the card\'s last element while rendered').toBe(proceed)
      assertDismissReachable(card, proceed, vp, `BirthdayDialog (selected, ${vp.width}x${vp.height})`)
      w.unmount()
    }
  })

  it('⚠⚠ MUTATION PROOF (ARM 5) – strip the height cap and the SAME selected-state assertion goes red', async () => {
    // The round-20 law's own demand: «prove it by mutating – a test that cannot fail on the too-tall
    // version is not this test». The cap is the shared `.dialog-card`'s, so this is the arm that says
    // the selected state is safe from the next honest sentence rather than by luck.
    document.body.innerHTML = ''
    setViewport(PHONE)
    const { snap } = birthdaySnapshot()
    useGameStore().snapshot = snap
    const w = mount(BirthdayDialog, { attachTo: document.body })
    const card = document.querySelector('.birthday-dialog')! as HTMLElement
    document.querySelectorAll<HTMLButtonElement>('button.birthday-choice')[0].click()
    await nextTick()
    const proceed = card.querySelector('.birthday-proceed')!
    assertDismissReachable(card, proceed, PHONE, 'BirthdayDialog (selected, bounded)')
    card.style.maxHeight = 'none'
    card.style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, proceed, PHONE, 'BirthdayDialog (selected, unbounded)')).toThrow(
      /declares no height bound|taller than the screen|outside the viewport/,
    )
    // ...and putting it back is green again, which is what says the CAP is what holds.
    card.style.maxHeight = ''
    card.style.overflowY = ''
    assertDismissReachable(card, proceed, PHONE, 'BirthdayDialog (selected, cap restored)')
    w.unmount()
  })
})

describe('KidScreen – ⭐ B-Day on the bio page', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ prints the day and the month beside her age, and NO week and NO year', () => {
    // Owner, 11.08: «на странице био девочки тоже можно день и месяц рождения добавить возле
    // возраста» and «а можно просто день и месяц без недель? B-Day 12 june или вроде того».
    // Mutation-verified by switching `birthDateLabel` to the three-letter month: "12 June" fails.
    const world = createWorld('bio-bday', { ...DEFAULT_PROFILE, birthMonth: 6, birthDay: 12 })
    useGameStore().snapshot = toSnapshot(world)
    const w = mount(KidScreen, { global: { stubs: { teleport: true } } })
    const line = w.find('.kid-age').text()
    expect(line).toContain('B-Day 12 June')
    // ...beside her age, on the same line.
    expect(line).toMatch(/^\d+ years old · B-Day 12 June$/)
    // NO WEEK and NO YEAR – both would be derivable and both would only add width.
    expect(line).not.toMatch(/\bW\d|\b(19|20)\d\d\b|week/i)
    w.unmount()
  })

  it('...and it follows the profile rather than being a constant', () => {
    const world = createWorld('bio-bday-2', { ...DEFAULT_PROFILE, birthMonth: 11, birthDay: 3 })
    useGameStore().snapshot = toSnapshot(world)
    const w = mount(KidScreen, { global: { stubs: { teleport: true } } })
    expect(w.find('.kid-age').text()).toContain('B-Day 3 November')
    w.unmount()
  })
})
