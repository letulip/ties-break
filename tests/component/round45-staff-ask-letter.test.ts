// ROUND 45 #3 AND #4 ON PAPER, MOUNTED – the raise request's two doors, and the psychologist's
// carry-over line rendered with real data. The engine halves are tests/round45-staff-ask.test.ts.
//
// ⚠ THE LETTERS ARE BUILT BY THE ENGINE'S OWN RAISERS (`raiseStaffAsk`, `raiseStaffLetter`), never
// typed here, so the terms rendered are the terms a career really carries.
// ⚠ ALL COPY UNDER TEST IS DRAFT (invariant 4, «R45 – DRAFT strings» in docs/rounds/round-45.md):
// the assertions are about figures, doors and the presence or absence of a line, never a whole sentence.
//
// ⚠ MUTATION-VERIFIED – M5: the carry-over `<li>` removed; M6: the doors shown on a settled paper.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { raiseStaffAsk, raiseStaffLetter } from '../../src/engine/offers'
import { seasonYear } from '../../src/shared/dates'
import type { Offer, OfferState } from '../../src/shared/protocol'

const WRAP = 257

function askLetter(state: OfferState = 'open'): Offer {
  const letter = raiseStaffAsk([], WRAP, 1, {
    seat: 'masseur',
    seasonIndex: 4,
    weeksServed: 52,
    ask: { fromCents: 75_00, toCents: 78_00 },
  })
  letter.state = state
  return letter
}

const mountLetter = (offer: Offer, week = WRAP + 1) => mount(OfferLetter, { props: { offer, week }, attachTo: document.body })

describe('round 45 #3 – the raise request sheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ a live request prints BOTH figures and offers BOTH doors, and each door answers with the letter`s id', async () => {
    const offer = askLetter()
    const w = mountLetter(offer)
    expect(w.text()).toContain('$75')
    expect(w.text()).toContain('$78')
    expect(w.text(), 'signs as the seat').toContain('Her masseur')
    const buttons = w.findAll('button')
    expect(buttons, 'two doors').toHaveLength(2)
    await w.find('.offer-refuse').trigger('click')
    await w.find('.offer-sign').trigger('click')
    expect(w.emitted('refuse')).toEqual([[offer.id]])
    expect(w.emitted('sign')).toEqual([[offer.id]])
    expect(w.text(), 'the house short dash only').not.toContain('—')
    w.unmount()
  })

  it('⭐⭐ a settled request shows NO doors and says how it ended, each in its own arm', () => {
    const arms: Array<[OfferState, string, string]> = [
      ['signed', 'Accepted', '$78'],
      ['refused', 'Declined', '$75'],
      ['expired', 'Lapsed', '$75'],
    ]
    for (const [state, word, figure] of arms) {
      const w = mountLetter(askLetter(state))
      expect(w.findAll('button'), `${state}: no doors on a settled paper`).toHaveLength(0)
      expect(w.find('.offer-window.settled').text(), `${state}`).toContain(word)
      expect(w.find('.offer-window.settled').text(), `${state}: the figure it left the rate at`).toContain(figure)
      w.unmount()
    }
  })
})

describe('round 45 #4 – the psychologist`s carry-over line', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  const psy = (extra: { focusCarriedFrom?: number }): Offer =>
    raiseStaffLetter([], WRAP, { seat: 'psychologist', seasonIndex: 4, weeksServed: 49, focus: 'coolhead', ...extra })

  it('⭐⭐⭐ a carried year says so, names the year the direction was last chosen for, and still names the direction', () => {
    const w = mountLetter(psy({ focusCarriedFrom: 2 }))
    expect(w.text()).toContain('did not choose a new direction')
    expect(w.text(), 'real data: the season the carried pick was bought for').toContain(String(seasonYear(2)))
    expect(w.text(), 'and the direction itself is still stated').toContain('tight games')
    w.unmount()
  })

  it('⭐⭐ a chosen year says nothing about carrying', () => {
    const w = mountLetter(psy({}))
    expect(w.text()).not.toContain('did not choose a new direction')
    expect(w.text()).toContain('tight games')
    w.unmount()
  })
})
