// ROUND 45 #3b ON PAPER, MOUNTED – the COACH's raise request. The same two-door sheet as the other seats'
// (tests/component/round45-staff-ask-letter.test.ts is its pattern), with the unit «an hour»: the coach's
// bill is built from an HOURLY rate, so the paper quotes that and says so. The engine halves are
// tests/round45-staff-ask-floating.test.ts §F.
//
// ⚠ THE LETTER IS BUILT BY THE ENGINE'S OWN RAISER (`raiseStaffAsk`), never typed here, so the terms
// rendered are the terms a career really carries.
// ⚠ ALL COPY UNDER TEST IS DRAFT (invariant 4, R45-S23..S27 in docs/rounds/round-45.md): the assertions are
// about figures, doors, the unit and the pronoun rule, never a whole sentence.
//
// ⚠ NOT MUTATION-RUN IN THIS WAVE (the budget went to the engine arms): the arm that should redden it is
// `staffAskPer('coach')` returning «a hour» (the first test), and `staffAskUnit('coach')` falling back to
// «week» (the foot test).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { raiseStaffAsk, staffAskPer } from '../../src/engine/offers'
import type { Offer, OfferState } from '../../src/shared/protocol'

const WRAP = 257

function coachLetter(state: OfferState = 'open'): Offer {
  const letter = raiseStaffAsk([], WRAP, 1, {
    seat: 'coach',
    seasonIndex: 4,
    weeksServed: 52,
    ask: { fromCents: 60_00, toCents: 66_00 },
  })
  letter.state = state
  return letter
}

const mountLetter = (offer: Offer, week = WRAP + 1) => mount(OfferLetter, { props: { offer, week }, attachTo: document.body })

describe('round 45 #3b – the coach`s raise request sheet', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ a live request prints BOTH hourly figures with the unit «an hour», signs as her coach, and offers BOTH doors', async () => {
    expect(staffAskPer('coach'), 'the article is part of the phrase – «a hour» is the sentence that would ship otherwise').toBe('an hour')
    const offer = coachLetter()
    const w = mountLetter(offer)
    expect(w.text()).toContain('$60')
    expect(w.text()).toContain('$66')
    expect(w.text(), 'the unit the coach`s bill is built from').toContain('an hour')
    expect(w.text()).not.toContain('a hour')
    expect(w.text(), 'signs as the seat').toContain('Her coach')
    expect(w.text(), 'R15-7: no masculine pronoun for the coach').not.toMatch(/\b(he|him|his)\b/i)
    expect(w.text(), 'the house short dash only').not.toContain('—')
    expect(w.findAll('button'), 'two doors').toHaveLength(2)
    await w.find('.offer-refuse').trigger('click')
    await w.find('.offer-sign').trigger('click')
    expect(w.emitted('refuse')).toEqual([[offer.id]])
    expect(w.emitted('sign')).toEqual([[offer.id]])
    w.unmount()
  })

  it('⭐⭐ a settled request shows NO doors, says how it ended in its own arm, and keeps the hourly unit', () => {
    const arms: Array<[OfferState, string, string]> = [
      ['signed', 'Accepted', '$66'],
      ['refused', 'Declined', '$60'],
      ['expired', 'Lapsed', '$60'],
    ]
    for (const [state, word, figure] of arms) {
      const w = mountLetter(coachLetter(state))
      expect(w.findAll('button'), `${state}: no doors on a settled paper`).toHaveLength(0)
      const foot = w.find('.offer-window.settled').text()
      expect(foot, state).toContain(word)
      expect(foot, `${state}: the figure it left the rate at`).toContain(figure)
      expect(foot, `${state}: an hourly rate`).toContain('an hour')
      w.unmount()
    }
  })
})
