// ⭐⭐⭐ R2-07 – ONE ACCESSIBLE BLOCKING-DIALOG SHELL, ADOPTED BY THE FOUR THAT NEVER TOOK IT
// (docs/review-principles-2026-08-23/07-proposals-and-roadmap.md, P1 by the review's own priority
// «because overlays block careers»).
//
// THE DEFECT, STATED. `useDialogFocus` and the `role`/`aria-modal`/`aria-labelledby`/`tabindex="-1"`
// card shipped with D1 and were taken by the dialogs written after it – the knock, the wrap-up, the
// birthday, the briefing, the college wrap. FOUR OLDER ONES WERE LEFT BEHIND, and they are the four
// that matter most: the FORK (three answers, two of which end the career), the RETIREMENT offer, the
// INJURY report, and the shared CONFIRM that eight callers put in front of every irreversible press
// in the app. `getByRole('dialog')` found nothing while any of them was open, no screen reader was
// told a blocking decision was up, and Tab walked out of the card into the tab bar behind it – on
// overlays the engine refuses to tick past.
//
// ⚠⚠ THE SHELL IS SHARED AND THE VOICE IS NOT, which is the review's own instruction and it is
// right: these four say very different things. Nothing here asserts a common schema of content or
// actions, and nothing in `src/` grew one. What is shared is exactly the keyboard contract.
//
// ⚠⚠ AND THE ESCAPE POLICY IS PER DIALOG, DELIBERATELY NOT UNIFORM. That is the one design decision
// in this wave and every dialog below states its own:
//
//   ForkDialog        NO Escape. Two of its three answers end the career and the engine refuses to
//                     tick until one is in, so a dismissal would strand the career and a resolution
//                     would pick for the player – ruling 4 («the card may not recommend») broken by
//                     a keystroke. There is nothing a fourth key could honestly mean.
//   RetirementDialog  NO Escape. Same shape, and the FINAL card proves it: at 38 it draws ONE
//                     button, so a key that closed it would end a career on a stray press. "One more
//                     year" is not the escape either – it is an ANSWER the engine records, and it is
//                     absent on the final card, which is exactly where a uniform policy ships a dead
//                     key.
//   InjuryStopDialog  ESCAPE CLOSES. It asks nothing; it reports. It has closed on a click outside
//                     it since it shipped, so the key is the keyboard's spelling of a gesture the
//                     mouse already had, and refusing it would trap a keyboard on a card whose exit
//                     is free. Same emit as the scrim and the button: one way out, not three.
//   ConfirmDialog     ESCAPE CANCELS, and may only ever cancel. It fronts irreversible acts, so the
//                     key is wired to the half that commits nothing – the same emit the scrim click
//                     sends. Escape on `confirm` would be a delete-career on a stray press.
//
// ⚠ OVERLAY PRECEDENCE IS UNTOUCHED. The app has ONE centralized priority – `visibleOverlay` in
// `src/composables/blockingOverlay.ts` – and this wave does not open that file. Its behaviour is
// covered by `tests/component/round21-popup-order.test.ts`, which mounts App and asserts the order;
// re-asserting it here would be a second opinion about a single fact.
//
// ⚠ HOW A TAB PRESS IS RESOLVED HERE. happy-dom implements no sequential focus navigation, so a
// `keydown` alone moves nobody. `pressTab` therefore emulates ONLY the platform's half – it steps
// focus to the next control when the trap did NOT `preventDefault()` – and leaves the trap's half to
// the real listener. That is precisely the division of labour `useDialogFocus` is written to: it
// intercepts the boundary presses and the ones that arrive from outside the card, and lets every
// other one through. A press the trap swallowed moves nobody in this model either, so a trap that
// stopped working shows up as a walk that leaves the ring rather than as a green test.
//
// ⚠⚠ MUTATION-VERIFIED, ELEVEN ARMS, AND THE COUNTS BELOW ARE THE MEASURED ONES rather than the
// ones that were predicted. Each arm reverts ONE behaviour in `src/` and the file is re-run:
//
//    1  fork: `role="dialog"` -> `data-role`             3 red
//    2  retirement: `aria-modal` dropped                 2 red (both cards, ordinary and final)
//    3  injury: `aria-labelledby` dropped                1 red
//    4  fork: `useDialogFocus(card)` removed             3 red
//    5  fork: Escape wired to `answerFork('stop')`       1 red
//    6  retirement: Escape wired to `answerRetirement`   1 red
//    7  injury: Escape handler removed                   1 red
//    8  confirm: Escape re-pointed at `confirm`          1 red
//    9  confirm: the message id made a fixed string      1 red
//   10  fork: the "Stop here" answer hard-disabled       1 red  (the keyboard-only arm)
//   11  style.css: `.dialog-card`'s cap stripped         5 red  (the four fit tests + the fork's
//                                                               strong arm)
//
// ⚠ TWO OF THOSE COUNTS ARE HIGHER THAN THE OBVIOUS ONE, AND THAT IS COUPLING WORTH KNOWING ABOUT
// rather than a fault. Arm 1 also reddens the fork's Escape test and the fork's keyboard walk,
// because BOTH locate the card the way a role-first test does – `[role="dialog"]` – so a card with
// no role is a card those tests cannot find. Arm 4 reddens the shell test, the restoration test and
// the keyboard walk together, because the role and the focus claims share one `it` for the fork.
// Neither is a hidden pass: the point of naming the counts is that a future arm producing FEWER
// reds than this table is a net that has quietly loosened.
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET. Without it `.dialog-card`'s cap is not in the cascade and every fit
// measurement below is vacuous – the same reason tour-briefing.test.ts imports it.
import '../../src/style.css'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import ForkDialog from '../../src/components/ForkDialog.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, measureCollegeOffer, tickWeek, toSnapshot } from '../../src/engine/world'
import { onsetInjury } from '../../src/engine/world/injury'
import { BODY_REGIONS } from '../../src/engine/body'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CollegeTier, type ForkAnswer, type Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

// ⚠⚠ AUTO-UNMOUNT, AND IT IS LOAD-BEARING IN A FILE FULL OF FOCUS TRAPS. `useDialogFocus` registers
// its keydown listener on `document` and removes it in `onBeforeUnmount`, so a wrapper left mounted
// by a FAILED assertion keeps a live trap over every later test – and a trap whose card has been
// detached sees `!el.contains(activeElement)` on every Tab, swallows the press and focuses a node
// that is no longer in the document. Measured on the first run of this file: one wrong expectation
// in the fork's name cascaded into five red walks in three other describes, none of which had a
// defect. One failure must stay one failure.
enableAutoUnmount(afterEach)

// =================================================================================================
// FIXTURES – real careers through the real engine, so nothing below is a hand-built shape that could
// drift from `Snapshot`.
// =================================================================================================

/** A career standing at the fork, with the engine's own college offer on it – the same two lines
 *  `world/endings.ts` raises it with. Her junior record is the one thing set by hand, so the rows
 *  carry real awards instead of quietly all reading a walk-on (the round24-fork-places idiom). */
function forkSnapshot(seed = 'r2-07-fork'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, country: 'US' })
  world.bestFinishByTier.j300 = 3
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  return toSnapshot(world)
}

/** The off-season offer. `final` is the 38-year-old card, which draws ONE button – the shape the
 *  Escape policy below actually turns on. */
function retirementSnapshot(final = false): Snapshot {
  const snap = careerSnapshot(8, 'r2-07-retire')
  return {
    ...snap,
    ageYears: final ? 38 : 30,
    retirementOffer: { askedWeek: snap.week, seasonIndex: 3, reason: 'age', final },
  }
}

/** A real layoff, rolled by the engine's own onset path on a sub-stream of its own – so the report
 *  the card formats is one the world could really have produced. */
function injurySnapshot(seed = 'r2-07-injury'): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) tickWeek(world, rng)
  onsetInjury(world, rngFromSeed(`${seed}:onset`), 'week', BODY_REGIONS)
  const snap = toSnapshot(world)
  expect(snap.injury, 'the fixture must actually be hurt – nothing below is vacuous').toBeTruthy()
  return snap
}

/** A caller's message, long enough that the card really does want more than a phone. The words are
 *  a fixture and not product copy – every caller owns its own sentence, which is the whole point of
 *  the component. */
const CONFIRM_MESSAGE =
  'Sign the kit deal? It runs for the rest of her junior years, it pays on the schedule in the letter, ' +
  'and there is no way to unsign it later – the money and the obligations both start this week.'

// =================================================================================================
// THE SHELL, AS FOUR QUESTIONS ANY BLOCKING OVERLAY HAS TO ANSWER
// =================================================================================================

/** The first two steps of the real accessible-name algorithm, which are the only two these surfaces
 *  use, then name-from-content. Same helper shape as a11y-sweep.test.ts, on purpose: two files that
 *  disagreed about what a name is would be worse than one slightly simplified. */
function accName(el: Element): string {
  const label = el.getAttribute('aria-label')
  if (label !== null) return label
  const ids = el.getAttribute('aria-labelledby')
  if (ids !== null) {
    return ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim().replace(/\s+/g, ' ') ?? '')
      .join(' ')
  }
  return (el.textContent ?? '').trim().replace(/\s+/g, ' ')
}

/** Everything the keyboard can land on inside the card, in document order.
 *  ⚠ DELIBERATELY NOT `useDialogFocus`'s OWN SELECTOR. If the utility's idea of "focusable" ever
 *  regressed, a test that asked the utility would follow it down silently. These four cards are
 *  buttons and prose, which the assertion below states rather than assumes. */
function controlsIn(card: Element): HTMLElement[] {
  const buttons = [...card.querySelectorAll<HTMLElement>('button:not([disabled])')]
  const anythingElse = [...card.querySelectorAll('a[href], input, select, textarea, [tabindex]')].filter(
    (el) => el !== card,
  )
  expect(anythingElse, 'these cards are buttons and prose – a new focusable kind needs its own thinking').toHaveLength(0)
  return buttons
}

/**
 * One Tab press. The trap's half is the REAL listener on `document`; the platform's half – stepping
 * focus to the next control when nobody called `preventDefault()` – is emulated here, because
 * happy-dom has no sequential focus navigation at all. See the note in the file header.
 */
function pressTab(items: HTMLElement[], shift = false): void {
  const before = document.activeElement as HTMLElement | null
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true })
  ;(before ?? document.body).dispatchEvent(event)
  if (event.defaultPrevented) return
  const i = before ? items.indexOf(before) : -1
  items[i + (shift ? -1 : 1)]?.focus()
}

/** The whole keyboard contract of the shell, asked of one mounted dialog.
 *  Returns the controls, in the order the keyboard reaches them.
 *
 *  ⚠ THE NAME IS CHECKED AS A RESOLUTION, NOT AS A STRING. `nameIds` are the elements the card
 *  points `aria-labelledby` at; this asserts that they exist, that they are INSIDE the card, that
 *  none of them is empty, and that the computed name is exactly their text in that order. What the
 *  lines actually SAY is asserted at each call site, where the wording is the dialog's own and is
 *  stable – a name pinned here would make one helper the owner of four voices. */
function assertShell(opts: { label: string; nameIds: string[]; controls: number }): HTMLElement[] {
  const cards = document.querySelectorAll('[role="dialog"]')
  expect(cards, `${opts.label}: the defect, stated – this was zero`).toHaveLength(1)
  const card = cards[0]
  expect(card.getAttribute('aria-modal'), `${opts.label} is modal`).toBe('true')
  expect(card.getAttribute('tabindex'), `${opts.label} has somewhere to put focus with no controls`).toBe('-1')

  expect(card.getAttribute('aria-labelledby'), `${opts.label} is named by the lines a reader sees`).toBe(
    opts.nameIds.join(' '),
  )
  const parts = opts.nameIds.map((id) => {
    const el = document.getElementById(id)
    expect(el, `${opts.label}: aria-labelledby points at #${id}, which is not in the document`).toBeTruthy()
    expect(card.contains(el), `${opts.label}: #${id} is not inside the card it names`).toBe(true)
    const text = el!.textContent!.trim().replace(/\s+/g, ' ')
    expect(text.length, `${opts.label}: #${id} is part of the name and says nothing`).toBeGreaterThan(0)
    return text
  })
  expect(accName(card), `${opts.label}: the name is the card's own lines, in reading order`).toBe(parts.join(' '))

  // The scrim is what the dialog is OVER, not part of it – so the role may not be on the overlay.
  expect(document.querySelector('.dialog-overlay')!.getAttribute('role'), `${opts.label}: the scrim is not the dialog`).toBeNull()

  const items = controlsIn(card)
  expect(items, `${opts.label} draws the controls this case is about`).toHaveLength(opts.controls)

  // 1. FOCUS LANDS INSIDE, on the first control.
  expect(document.activeElement, `${opts.label} opened behind the page it is blocking`).toBe(items[0])

  // 2. THE RING IS CLOSED, FORWARD. N presses from the first control visit every control once and
  //    come back to the start – which is what "Tab cannot leave" means as a walk rather than as a
  //    single boundary press.
  const forward: HTMLElement[] = []
  for (let i = 0; i < items.length; i++) {
    pressTab(items)
    forward.push(document.activeElement as HTMLElement)
  }
  expect(forward.slice(0, -1), `${opts.label}: Tab visits its controls in document order`).toEqual(items.slice(1))
  expect(forward[forward.length - 1], `${opts.label}: Tab walked out of a modal and into the page behind it`).toBe(items[0])

  // 3. ...AND BACKWARD, which is the half a one-directional trap gets wrong.
  const back: HTMLElement[] = []
  for (let i = 0; i < items.length; i++) {
    pressTab(items, true)
    back.push(document.activeElement as HTMLElement)
  }
  expect(back[back.length - 1], `${opts.label}: Shift+Tab closes the ring too`).toBe(items[0])
  expect(new Set(back).size, `${opts.label}: backwards visits every control exactly once`).toBe(items.length)

  // 4. AND FOCUS THAT ESCAPED IS PULLED BACK. A click on the page behind the scrim, a browser
  //    control, a stray `.focus()` – the next Tab returns to the card instead of continuing the
  //    page's own order. This is the guard `aria-modal` alone cannot keep.
  const outside = document.createElement('button')
  outside.textContent = 'Behind the scrim'
  document.body.appendChild(outside)
  outside.focus()
  expect(document.activeElement).toBe(outside)
  pressTab(items)
  expect(document.activeElement, `${opts.label}: focus left the modal and Tab did not bring it back`).toBe(items[0])
  outside.remove()

  return items
}

/** Focus something outside, mount, and prove the keyboard is handed back on close. */
function withOpener(run: (opener: HTMLElement) => void): void {
  const opener = document.createElement('button')
  opener.textContent = 'Next week'
  document.body.appendChild(opener)
  opener.focus()
  expect(document.activeElement).toBe(opener)
  run(opener)
  opener.remove()
}

function escape(): void {
  // ⚠ DISPATCHED ON `document`, WHERE `useDialogFocus` LISTENS (capture phase). A `trigger` on the
  // card never reaches that listener, so asking the card would be a vacuous test – measured on
  // TourBriefingDialog, where the card-scoped version stayed green against a live handler.
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
}

function reset(): void {
  setActivePinia(createPinia())
  setViewport(PHONE)
  document.body.innerHTML = ''
}

// =================================================================================================
// 1. THE FORK – the most expensive click in the game
// =================================================================================================

describe('R2-07 ForkDialog – the shell, and NO Escape', () => {
  beforeEach(reset)

  function mountFork() {
    useGameStore().snapshot = forkSnapshot()
    return mount(ForkDialog, { attachTo: document.body })
  }

  it('it is a dialog, it is modal, and its name is the two lines a reader sees', () => {
    const w = mountFork()
    // Three answers plus the college places that are open to her – the ring is whatever the card
    // actually draws, which is why the count is read rather than pinned.
    const card = document.querySelector('[role="dialog"]')!
    const controls = card.querySelectorAll('button:not([disabled])').length
    expect(controls, 'three answers at minimum').toBeGreaterThanOrEqual(3)
    assertShell({ label: 'ForkDialog', nameIds: ['fork-dialog-kicker', 'fork-dialog-title'], controls })
    // The wording, where it is this card's own: her age off the fork's record, and the one line
    // that says which question this is. ⚠ The AGE is read as a shape rather than pinned – the fixture
    // is a fresh world and the card is drawn whenever the engine raises the fork.
    expect(document.getElementById('fork-dialog-kicker')!.textContent!.trim()).toMatch(/^She is \d+$/)
    expect(document.getElementById('fork-dialog-title')!.textContent!.trim()).toBe('School is over.')
    w.unmount()
  })

  it('focus comes back to the control the card replaced', () => {
    withOpener((opener) => {
      const w = mountFork()
      expect(document.activeElement, 'focus went into the card').not.toBe(opener)
      w.unmount()
      expect(document.activeElement, 'the keyboard was left on an element the dialog had replaced').toBe(opener)
    })
  })

  it('⚠⚠ ESCAPE IS NOT A WAY OUT – the card is still up and nothing was answered', async () => {
    const answered: ForkAnswer[] = []
    const store = useGameStore()
    store.answerFork = async (a: ForkAnswer) => void answered.push(a)
    const w = mountFork()

    escape()
    await w.vm.$nextTick()

    expect(document.querySelectorAll('[role="dialog"]'), 'a stray Escape dismissed the fork').toHaveLength(1)
    expect(answered, 'a stray Escape ANSWERED the fork, which is worse').toEqual([])
    w.unmount()
  })
})

// =================================================================================================
// 2. THE RETIREMENT OFFER – and the final card is why the policy is what it is
// =================================================================================================

describe('R2-07 RetirementDialog – the shell, and NO Escape', () => {
  beforeEach(reset)

  function mountRetirement(final = false) {
    useGameStore().snapshot = retirementSnapshot(final)
    return mount(RetirementDialog, { attachTo: document.body })
  }

  const RETIRE_IDS = ['retire-dialog-kicker', 'retire-dialog-title']

  it('it is a dialog, it is modal, and it is named by the winter it is asked in', () => {
    const w = mountRetirement()
    assertShell({ label: 'RetirementDialog', nameIds: RETIRE_IDS, controls: 2 })
    expect(accName(document.querySelector('[role="dialog"]')!)).toBe(
      'Off-season – she is 30 Is there another year in this?',
    )
    w.unmount()
  })

  it('⚠ the FINAL card is a one-button modal, and the shell holds there too', () => {
    const w = mountRetirement(true)
    assertShell({ label: 'RetirementDialog (final)', nameIds: RETIRE_IDS, controls: 1 })
    // ⚠ THE THREE HEADINGS SHARE ONE id AND EXACTLY ONE IS EVER RENDERED, which is what makes that
    // safe – so the name tracks WHICH question this winter is, and the final card says so.
    expect(document.querySelectorAll('#retire-dialog-title'), 'one heading in the document, not three').toHaveLength(1)
    expect(accName(document.querySelector('[role="dialog"]')!)).toBe(
      'Off-season – she is 38 Nobody is going to ask her again.',
    )
    w.unmount()
  })

  it('focus comes back to the control the card replaced', () => {
    withOpener((opener) => {
      const w = mountRetirement()
      expect(document.activeElement).not.toBe(opener)
      w.unmount()
      expect(document.activeElement).toBe(opener)
    })
  })

  it('⚠⚠ ESCAPE IS NOT A WAY OUT – on either card, and the FINAL one is the reason', async () => {
    for (const final of [false, true]) {
      reset()
      const answers: boolean[] = []
      const store = useGameStore()
      store.answerRetirement = async (retire: boolean) => void answers.push(retire)
      const w = mountRetirement(final)

      escape()
      await w.vm.$nextTick()

      expect(document.querySelectorAll('[role="dialog"]'), `final=${final}: Escape dismissed the offer`).toHaveLength(1)
      // The one that would really hurt: at 38 the only button ends the career.
      expect(answers, `final=${final}: Escape answered for her`).toEqual([])
      w.unmount()
    }
  })
})

// =================================================================================================
// 3. THE INJURY REPORT – it asks nothing, so Escape closes it
// =================================================================================================

describe('R2-07 InjuryStopDialog – the shell, and Escape CLOSES', () => {
  beforeEach(reset)

  function mountInjury() {
    useGameStore().snapshot = injurySnapshot()
    return mount(InjuryStopDialog, { attachTo: document.body })
  }

  it('it is a dialog, it is modal, and it is named by the week and by what happened', () => {
    const w = mountInjury()
    assertShell({ label: 'InjuryStopDialog', nameIds: ['injury-stop-kicker', 'injury-stop-title'], controls: 1 })
    // The week comes off the app's own `weekLabel`, so this cannot drift into pinning a date format
    // the product stopped using; the title is one of the card's two sentences.
    expect(document.getElementById('injury-stop-kicker')!.textContent!.trim()).toMatch(/^Injury – W\d+ '\d{2}$/)
    expect(['She had to stop.', "She's hurt."]).toContain(
      document.getElementById('injury-stop-title')!.textContent!.trim(),
    )
    w.unmount()
  })

  it('focus comes back to the control the card replaced', () => {
    withOpener((opener) => {
      const w = mountInjury()
      expect(document.activeElement).not.toBe(opener)
      w.unmount()
      expect(document.activeElement).toBe(opener)
    })
  })

  it('⚠ ESCAPE CLOSES IT – the same emit the scrim and the button send, so there is ONE way out', async () => {
    const w = mountInjury()
    escape()
    await w.vm.$nextTick()
    expect(w.emitted('continue'), 'Escape is the keyboard spelling of the click outside').toHaveLength(1)
    w.unmount()
  })

  it('...and the scrim and the button still send that same one', async () => {
    const scrim = mountInjury()
    await scrim.find('.dialog-overlay').trigger('click')
    expect(scrim.emitted('continue')).toHaveLength(1)
    scrim.unmount()

    const pressed = mountInjury()
    await pressed.find('.dialog-actions button').trigger('click')
    expect(pressed.emitted('continue')).toHaveLength(1)
    pressed.unmount()
  })
})

// =================================================================================================
// 4. THE SHARED CONFIRM – eight callers, every irreversible press in the app
// =================================================================================================

describe('R2-07 ConfirmDialog – the shell, and Escape CANCELS', () => {
  beforeEach(reset)

  function mountConfirm(props: Record<string, unknown> = {}) {
    return mount(ConfirmDialog, {
      props: { message: CONFIRM_MESSAGE, confirmLabel: 'Sign it', ...props },
      attachTo: document.body,
    })
  }

  it('it is a dialog, it is modal, and THE CALLER\'S MESSAGE IS THE NAME', () => {
    const w = mountConfirm()
    const id = document.querySelector('[role="dialog"]')!.getAttribute('aria-labelledby')!
    assertShell({ label: 'ConfirmDialog', nameIds: [id], controls: 2 })
    // A generic "Confirm" would be the same defect one step on: eight callers, one name. The name
    // is the caller's whole sentence, so no two of the eight can collide.
    expect(accName(document.querySelector('[role="dialog"]')!)).toBe(CONFIRM_MESSAGE)
    expect(document.getElementById(id)!.classList.contains('dialog-message')).toBe(true)
    w.unmount()
  })

  it('⚠ the name is per INSTANCE – two confirms in one document do not share an id', () => {
    // CoachMarketScreen alone renders five of these in one template. A fixed id would make
    // `aria-labelledby` resolve to whichever came first: the wrong question over the right buttons.
    const a = mountConfirm({ message: 'Delete the career?' })
    const b = mountConfirm({ message: 'Delete the save?' })
    const cards = [...document.querySelectorAll('[role="dialog"]')]
    expect(cards).toHaveLength(2)
    const ids = cards.map((c) => c.getAttribute('aria-labelledby'))
    expect(new Set(ids).size, 'two live confirms answering to one id').toBe(2)
    expect(cards.map(accName)).toEqual(['Delete the career?', 'Delete the save?'])
    b.unmount()
    a.unmount()
  })

  it('⚠ INITIAL FOCUS IS CANCEL – the half that commits nothing', () => {
    const w = mountConfirm()
    const buttons = [...document.querySelectorAll<HTMLElement>('.dialog-actions button')]
    expect(buttons.map((b) => b.textContent!.trim())).toEqual(['Cancel', 'Sign it'])
    expect(document.activeElement, 'a keyboard answer before reading must back OUT of the act').toBe(buttons[0])
    w.unmount()
  })

  it('focus comes back to the control that opened it', () => {
    withOpener((opener) => {
      const w = mountConfirm()
      expect(document.activeElement).not.toBe(opener)
      w.unmount()
      expect(document.activeElement).toBe(opener)
    })
  })

  it('⚠⚠ ESCAPE CANCELS AND NEVER CONFIRMS – this card fronts the irreversible presses', async () => {
    const w = mountConfirm()
    escape()
    await w.vm.$nextTick()
    expect(w.emitted('cancel'), 'Escape backs out of the act').toHaveLength(1)
    expect(w.emitted('confirm'), 'Escape signed a letter / deleted a career').toBeUndefined()
    w.unmount()
  })
})

// =================================================================================================
// 5. THE KEYBOARD-ONLY PASS – wave 1's stop/go check, in its own words:
//    «keyboard-only player must complete every irreversible dialog»
// =================================================================================================
//
// ⚠ WHAT "ACTIVATE" MEANS HERE, HONESTLY. Enter and Space on a focused native `<button>` are the
// PLATFORM's activation, not this app's – happy-dom does not synthesize the resulting click, and
// faking a keypress that produced one would be testing the fake. So each walk asserts what the app
// actually owes: the control is reached by Tab alone, it is an enabled native BUTTON when focus
// lands on it (which is what makes Enter/Space work at all), and activating THE FOCUSED ELEMENT –
// never a queried one – files the decision. The mouse is never used: no `trigger('click')` on an
// element the walk did not arrive at.

/** Tab from the opening position until `match` is focused, then activate it. Returns the number of
 *  presses – a walk that never arrives fails rather than looping. */
function keyboardActivate(items: HTMLElement[], match: (el: HTMLElement) => boolean): number {
  for (let presses = 0; presses <= items.length; presses++) {
    const active = document.activeElement as HTMLElement
    expect(active.tagName, 'the keyboard is parked on something Enter cannot press').toBe('BUTTON')
    expect((active as HTMLButtonElement).disabled, 'the keyboard is parked on a dead control').toBe(false)
    if (match(active)) {
      active.click() // what Enter and Space do to a focused button
      return presses
    }
    pressTab(items)
  }
  throw new Error('the walk never reached the control – a keyboard-only player cannot finish this dialog')
}

describe('R2-07 – every irreversible dialog can be completed without a mouse', () => {
  beforeEach(reset)

  function mountConfirmFor(confirmLabel: string) {
    return mount(ConfirmDialog, {
      props: { message: CONFIRM_MESSAGE, confirmLabel },
      attachTo: document.body,
    })
  }

  it('⭐ THE FORK: all three answers are reachable and pressable by keyboard alone', async () => {
    // Each answer gets its own mount, because the first one ends the question.
    for (const [label, expected] of [
      ['Turn professional', 'continue'],
      ['Reserve the college place', 'college'],
      ['Stop here', 'stop'],
    ] as const) {
      reset()
      const answered: Array<{ answer: ForkAnswer; tier?: CollegeTier }> = []
      const store = useGameStore()
      store.answerFork = async (answer: ForkAnswer, tier?: CollegeTier) => void answered.push({ answer, tier })
      store.snapshot = forkSnapshot()
      const w = mount(ForkDialog, { attachTo: document.body })

      const items = controlsIn(document.querySelector('[role="dialog"]')!)
      keyboardActivate(items, (el) => el.textContent!.includes(label))
      await w.vm.$nextTick()

      expect(answered.map((a) => a.answer), `${label} was not filed by the keyboard`).toEqual([expected])
      // ⚠ AND THE COLLEGE ANSWER CARRIES A PLACE. The card's stated default is the cheapest place
      // open to her; a keyboard press that sent no tier would take a different road than the one
      // printed under the button.
      if (expected === 'college') expect(answered[0].tier, 'the keyboard answer named no place').toBeTruthy()
      w.unmount()
    }
  })

  it('⭐ THE RETIREMENT: both answers, and the FINAL card\'s only answer', async () => {
    for (const [final, label, expected] of [
      [false, 'That is enough', true],
      [false, 'One more year', false],
      [true, 'That is enough', true],
    ] as const) {
      reset()
      const answers: boolean[] = []
      const store = useGameStore()
      store.answerRetirement = async (retire: boolean) => void answers.push(retire)
      store.snapshot = retirementSnapshot(final)
      const w = mount(RetirementDialog, { attachTo: document.body })

      const items = controlsIn(document.querySelector('[role="dialog"]')!)
      keyboardActivate(items, (el) => el.textContent!.includes(label))
      await w.vm.$nextTick()

      expect(answers, `final=${final}: "${label}" was not filed by the keyboard`).toEqual([expected])
      w.unmount()
    }
  })

  it('⭐ THE CONFIRM: the irreversible half is reachable, and so is the way out', async () => {
    const signed = mountConfirmFor('Sign it')
    keyboardActivate(controlsIn(document.querySelector('[role="dialog"]')!), (el) => el.textContent!.trim() === 'Sign it')
    await signed.vm.$nextTick()
    expect(signed.emitted('confirm'), 'the one irreversible press in the inbox needs a mouse').toHaveLength(1)
    signed.unmount()

    reset()
    const cancelled = mountConfirmFor('Sign it')
    keyboardActivate(controlsIn(document.querySelector('[role="dialog"]')!), (el) => el.textContent!.trim() === 'Cancel')
    await cancelled.vm.$nextTick()
    expect(cancelled.emitted('cancel')).toHaveLength(1)
    expect(cancelled.emitted('confirm'), 'backing out must not commit the act').toBeUndefined()
    cancelled.unmount()
  })

  it('⭐ THE REPORT: Continue is reachable by keyboard alone', async () => {
    // Not irreversible – the injury is already in the world – but a blocking overlay all the same,
    // and the stop/go check is about a keyboard-only player finishing what is in front of him.
    useGameStore().snapshot = injurySnapshot()
    const dialog = mount(InjuryStopDialog, { attachTo: document.body })
    keyboardActivate(controlsIn(document.querySelector('[role="dialog"]')!), (el) => el.textContent!.trim() === 'Continue')
    await dialog.vm.$nextTick()
    expect(dialog.emitted('continue')).toHaveLength(1)
    dialog.unmount()
  })
})

// =================================================================================================
// 6. ROUND-20 #3 ON ALL FOUR – the dismiss/decision controls are inside a 375x667 phone
// =================================================================================================
//
// ⚠ THE HOUSE LAW, AND IT IS NOT NEW HERE: CLAUDE.md's gotcha («any dialog you add or lengthen gets
// a mounted assertion that its dismiss control's box is inside a 375x667 viewport»), earned by
// `TourBriefingDialog` shipping 1078px of card inside 635px of room with Continue at y=821..855 on a
// BLOCKING overlay – «сейчас его даже не закрыть». Three of the four already carry an assertion of
// this shape elsewhere (round24-fork-places / college-warning for the fork and the confirm,
// injury-cancelled-row for the report); RETIREMENT had none, and the R2-07 net states all four in
// one place because all four just changed.
//
// ⚠ THE CONTROL MEASURED IS THE DECISION BLOCK, not a Cancel: on the fork and the retirement there
// is no dismiss that is not an answer, so "reachable" means the ANSWERS are reachable. It is the
// same measurement – `measureDialog` reads the box off the card's own bottom edge, and on all four
// the decision block is the last thing in the card's flow.

interface Measured {
  w: VueWrapper
  card: Element
  dismiss: Element
}

function mountForFit(which: 'fork' | 'retirement' | 'injury' | 'confirm'): Measured {
  setViewport(PHONE)
  const store = useGameStore()
  let w: VueWrapper
  let dismissSelector: string
  if (which === 'fork') {
    store.snapshot = forkSnapshot()
    w = mount(ForkDialog, { attachTo: document.body })
    dismissSelector = '.fork-answers'
  } else if (which === 'retirement') {
    store.snapshot = retirementSnapshot()
    w = mount(RetirementDialog, { attachTo: document.body })
    dismissSelector = '.retire-answers'
  } else if (which === 'injury') {
    store.snapshot = injurySnapshot()
    w = mount(InjuryStopDialog, { attachTo: document.body })
    dismissSelector = '.dialog-actions'
  } else {
    w = mount(ConfirmDialog, {
      props: { message: CONFIRM_MESSAGE, confirmLabel: 'Sign it' },
      attachTo: document.body,
    })
    dismissSelector = '.dialog-actions'
  }
  const card = document.querySelector('.dialog-overlay .dialog-card')!
  const dismiss = document.querySelector(`.dialog-overlay ${dismissSelector}`)!
  expect(card, `${which}: the card is up – nothing below is vacuous`).toBeTruthy()
  expect(dismiss.querySelectorAll('button').length, `${which}: the decision block IS the way out`).toBeGreaterThan(0)
  return { w, card, dismiss }
}

const FOUR = ['fork', 'retirement', 'injury', 'confirm'] as const

describe('R2-07 – round-20 #3 on all four: the decision is inside the phone', () => {
  beforeEach(reset)

  for (const which of FOUR) {
    it(`⚠ ${which}: at 375x667 the decision controls are inside the viewport`, () => {
      const { w, card, dismiss } = mountForFit(which)
      const fit = assertDismissReachable(card, dismiss, PHONE, `${which} (R2-07)`)
      // The scrim leaves 667 - 2x16 = 635, and the card is bounded by it.
      expect(fit.available.height).toBe(635)
      expect(fit.cap).toBeLessThanOrEqual(635)
      w.unmount()
    })
  }

  it('⚠⚠ MUTATION PROOF – strip the height cap and the SAME assertion goes red on all four', () => {
    for (const which of FOUR) {
      reset()
      const { w, card, dismiss } = mountForFit(which)
      ;(card as HTMLElement).style.maxHeight = 'none'
      ;(card as HTMLElement).style.overflowY = 'visible'
      expect(
        () => assertDismissReachable(card, dismiss, PHONE, `${which} (cap removed)`),
        `${which}: the cap could be removed and this test would not notice`,
      ).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      w.unmount()
    }
  })

  it('⚠⚠ ...and on the FORK the mutation is the round-20 defect itself, not just a missing declaration', () => {
    // The strong arm: this card's content genuinely wants more than a phone (art, five figures,
    // three priced places and three answers), so without the bound the answers leave the screen
    // rather than merely being unbounded. That is exactly the shape the owner's career stopped in.
    const { w, card, dismiss } = mountForFit('fork')
    const before = assertDismissReachable(card, dismiss, PHONE, 'fork (bounded)')
    expect(before.contentFloor, 'if this card fitted, the arm below would prove nothing').toBeGreaterThan(
      before.available.height,
    )
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'fork (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})
