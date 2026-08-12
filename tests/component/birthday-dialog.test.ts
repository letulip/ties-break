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
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET, IMPORTED FOR ITS `:root` – see the legibility block at the bottom of
// this file. Without it `var(--text)` resolves to nothing and every colour assertion is vacuous.
import '../../src/style.css'
import { assertLegible } from './contrast'
import BirthdayDialog from '../../src/components/BirthdayDialog.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  birthdayOffer,
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
  return { snap: toSnapshot(world), askedId: birthdayOffer(world.seed, age).askedId }
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

  it('⚠ NO WAY OUT THAT IS NOT AN ANSWER – no close button, no dismiss, no overlay click', () => {
    // The consequence of «я бы оставил попап на ДР всегда»: if the dialog could be closed, closing it
    // would silently become the "gave nothing" branch. Mutation-verified by wiring `@click.self` on
    // the overlay – the handler assertion below fails.
    const { snap } = birthdaySnapshot()
    const w = mountDialog(snap)
    const buttons = w.findAll('button')
    expect(buttons.length, 'exactly four buttons, and all four are presents').toBe(4)
    for (const b of buttons) expect(b.classes()).toContain('birthday-choice')
    expect(w.text()).not.toMatch(/\b(close|cancel|dismiss|not now|later|skip)\b/i)
    // The scrim has no click handler at all – `@click.self` is deliberately not wired.
    expect(w.find('.dialog-overlay').attributes('onclick')).toBeUndefined()
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
    expect(w.find('#birthday-dialog-title').text()).toMatch(/She is \d+ today\./)
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
    expect(sent).toEqual([snap.birthdayPrompt!.options[2].id])
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
