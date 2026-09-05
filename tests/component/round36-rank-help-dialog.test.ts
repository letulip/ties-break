// ⚠⚠ U-06 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – THE FOURTEENTH DIALOG
// JOINS THE FOCUS-MANAGED SET.
//
// Thirteen components call `useDialogFocus`. `RankHelpDialog` was the one popup outside the set: a
// `.dialog-overlay` scrim with a `.guide-card`, a named close and a backdrop click, and NO `role`,
// no `aria-modal`, no trap and no Escape. `composables/dialogFocus.ts` makes the argument for why
// that is a defect rather than an omission – announcing modality without containing the keyboard is
// worse than doing neither – and this card had neither half, so Tab walked out of it into the tab
// bar behind the scrim and a screen reader was never told a card had opened.
//
// The four cases below are the ones `tests/component/a11y-sweep.test.ts` makes of the knock and the
// wrap-up (focus lands, focus returns, Tab wraps, Escape policy), asked of this card. The fifth is
// the phone-fit net the review noted this dialog is the only one without.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: dropping `useDialogFocus` reddens the
// focus, Tab and Escape cases; dropping `role="dialog"` reddens the first; dropping `max-height`
// from `.guide-card` reddens the fit case. The log is in the wave's scratch as `u06-red.log`.
import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { setViewport, PHONE } from './fits'
import RankHelpDialog from '../../src/components/RankHelpDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'

const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

function mountHelp() {
  useGameStore().snapshot = careerSnapshot(8, 'u06-rank-help')
  return mount(RankHelpDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('⚠⚠ U-06 – the rank explainer is a modal, and it holds the keyboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('it says it is a dialog, and its name is the title a reader sees', () => {
    const wrapper = mountHelp()
    const card = wrapper.find('.guide-card')
    // The defect, stated: this was none of the three.
    expect(card.attributes('role')).toBe('dialog')
    expect(card.attributes('aria-modal')).toBe('true')
    const labelledBy = card.attributes('aria-labelledby')
    expect(labelledBy, 'a modal with no accessible name').toBeTruthy()
    const title = document.getElementById(labelledBy!)
    expect(title, `aria-labelledby points at #${labelledBy}, which nothing owns`).toBeTruthy()
    // ⚠ THE COPY IS THE OWNER'S AND IS ONLY READ HERE, never asserted as a new string: what this
    // proves is that the reference resolves to the card's own visible title.
    expect(title!.textContent).toBe(wrapper.find('.guide-title').text())
    wrapper.unmount()
  })

  it('focus lands INSIDE the card when it opens, and comes back when it closes', () => {
    const opener = document.createElement('button')
    opener.textContent = 'rank chip'
    document.body.appendChild(opener)
    opener.focus()
    expect(document.activeElement).toBe(opener)

    const wrapper = mountHelp()
    const card = wrapper.find('.guide-card').element
    expect(
      card.contains(document.activeElement),
      'the explainer opened behind the page it is over',
    ).toBe(true)

    wrapper.unmount()
    expect(document.activeElement, 'the keyboard was left where the dialog used to be').toBe(opener)
    opener.remove()
  })

  // ⚠⚠ THE WRAP CASE a11y-sweep MAKES OF THE KNOCK WOULD BE VACUOUS HERE, AND THAT WAS FOUND BY
  // MUTATING. The knock is two buttons, so "the last wraps to the first" is a real journey; this card
  // is prose plus ONE control, so first IS last and the assertion passes with no trap at all – as it
  // did, alone among six, on the mutated tree. What discriminates on a one-control dialog is the
  // OTHER half of the trap, and it is the half `dialogFocus.ts` says it listens on the document in
  // capture mode for: the Tab pressed while focus has already escaped the card.
  it('Tab pulls focus BACK when something behind the scrim has taken it', () => {
    const outside = document.createElement('button')
    outside.textContent = 'a tab bar button behind the scrim'
    document.body.appendChild(outside)

    const wrapper = mountHelp()
    const card = wrapper.find('.guide-card').element
    const focusables = Array.from(
      card.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'),
    )
    expect(focusables.length, 'the card has nothing to trap – this assertion would be vacuous').toBeGreaterThan(0)

    outside.focus()
    expect(document.activeElement, 'the fixture could not put focus outside').toBe(outside)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(
      card.contains(document.activeElement),
      'Tab left the keyboard on the page a modal has told a screen reader to ignore',
    ).toBe(true)

    // ...and backwards, which a one-directional trap gets wrong.
    outside.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(card.contains(document.activeElement)).toBe(true)

    wrapper.unmount()
    outside.remove()
  })

  it('⚠ Escape closes it – the keyboard spelling of the backdrop tap it already had', () => {
    const wrapper = mountHelp()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('close'), 'Escape is not a way out of this card').toHaveLength(1)
    wrapper.unmount()
  })

  it('⚠ and it is bounded by the phone it is drawn on, with a way to reach what is past the fold', () => {
    // CLAUDE.md's standing rule, and the review notes this is the one dialog with no fit net. The
    // close is PINNED (`.replay-close`, absolute at the card's top) rather than last in the flow, so
    // `measureDialog`'s "read the dismiss box off the bottom edge" does not describe this card –
    // what does is round-20 #3's actual fix, which is content-independent: a declared bound that
    // fits, and a scroller so nothing past it is unreachable.
    const wrapper = mountHelp()
    const card = document.querySelector('.guide-card')!
    expect(document.head.querySelector('style'), 'no stylesheet – this measurement is vacuous').toBeTruthy()
    const cs = getComputedStyle(card)
    const cap = parseFloat(cs.maxHeight)
    expect(Number.isFinite(cap), 'the card declares no height bound, so it is as tall as its content').toBe(true)
    expect(cap, `the bound is ${cs.maxHeight} against ${PHONE.height}px of phone`).toBeLessThanOrEqual(PHONE.height)
    expect(cs.overflowY, 'bounded with no scroller hides the rest for good').toBe('auto')

    // ...and the way out is inside the card rather than somewhere the scroll can take it away.
    const close = card.querySelector('.replay-close')
    expect(close, 'the card has no close control').toBeTruthy()
    expect(getComputedStyle(close!).position).toBe('absolute')
    wrapper.unmount()
  })

  it('⚠ BOTH mount sites get this, because both mount THIS component', () => {
    // P2-6 gave the shell its own copy for the rail's rank chip while Home keeps the one for the
    // chip on the photograph. Exactly one is reachable at a width, but "both behave" is only true
    // while they are the same component – a second inline explainer would be a second answer.
    for (const rel of ['src/App.vue', 'src/components/screens/HomeScreen.vue']) {
      const src = repoFile(rel)
      expect(src, `${rel} does not mount the shared explainer`).toContain('<RankHelpDialog')
      expect(src, `${rel} imports something else by that name`).toMatch(
        /import RankHelpDialog from '[^']*RankHelpDialog\.vue'/,
      )
    }
  })
})
