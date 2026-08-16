// ⭐⭐ THE OFFER ON THE FORK CARD (v51, docs/specs/what-the-college-place-costs-2026-08.md).
//
// The third answer used to promise "four years of student tennis on a college scholarship … the money
// goes the other way" and the engine then charged nothing at all. The card now says what is on the
// table: which programme, what the award covers, what is left for the family.
//
// ⚠ MOUNTED AND NOT PINNED (CLAUDE.md's gotcha). Every claim here is about what a player SEES on the
// most expensive click in the game, and a source pin would pass on a component that rendered none of
// it.
//
// FOUR PROPERTIES, and three of them are owner rulings rather than copy:
//   1. THE THIRD ANSWER IS STILL UNCONDITIONAL (owner, 16.08). No value of the offer removes a
//      button – including the one that says nobody funded her.
//   2. THE CARD MAY NOT RECOMMEND (ruling 4, 30.07). The offer is FIGURES, in the same register as
//      the four already on the card; no answer is styled, disabled or advised.
//   3. A MIGRATED CAREER IS NOT SHOWN A PRICE IT WAS NEVER QUOTED. `offer: null` = never measured.
//   4. AND IT STILL FITS A PHONE, proved by mutation – the card is longer than it was.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import type { CollegeOffer, Snapshot } from '../../src/shared/protocol'

const FUNDED: CollegeOffer = {
  programme: 'strong',
  athleticShare: 0.62,
  needShare: 0.1,
  costPerYearCents: 30_990_00,
  familyPerYearCents: 8_673_00,
}
const WALK_ON: CollegeOffer = {
  programme: null,
  athleticShare: 0,
  needShare: 0,
  costPerYearCents: 50_920_00,
  familyPerYearCents: 50_920_00,
}
const FREE_RIDE: CollegeOffer = {
  programme: 'strong',
  athleticShare: 0.88,
  needShare: 0.12,
  costPerYearCents: 30_990_00,
  familyPerYearCents: 0,
}

function snapshotWith(offer: CollegeOffer | null): Snapshot {
  return {
    ageYears: 19,
    week: 265,
    kidRank: 210,
    fundsCents: 41_200_00,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    fork: { askedWeek: 265, ageYears: 19, offer },
  } as unknown as Snapshot
}

function mountFork(offer: CollegeOffer | null, attach = false) {
  useGameStore().snapshot = snapshotWith(offer)
  return mount(ForkDialog, attach ? { attachTo: document.body } : {})
}

describe('⭐⭐ v51 – the card says what the college answer costs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('states the programme, both funding layers and the family bill', () => {
    const w = mountFork(FUNDED)
    const rows = w.findAll('.fork-offer dd').map((d) => d.text())
    expect(rows[0]).toContain('strong programme')
    // Two layers, on one line, and they are two numbers because they are two different things.
    expect(rows[1]).toContain('62%')
    expect(rows[1]).toContain('10%')
    expect(rows[1]).toContain('need-based')
    expect(rows[2]).toContain('$8,673')
    w.unmount()
  })

  // ⚠⚠ PROPERTY 1, AND IT IS THE OWNER'S RULING RATHER THAN A UI NICETY. The worst offer the engine
  // can produce is "nobody funded her", and it must still be three answers and still be pressable.
  it('⭐⭐ still draws three live answers when no programme offered a place', () => {
    const w = mountFork(WALK_ON)
    expect(w.findAll('.fork-answer')).toHaveLength(3)
    expect(w.text()).toContain('Take the college place')
    for (const a of w.findAll('.fork-answer')) expect(a.attributes('disabled')).toBeUndefined()
    const rows = w.findAll('.fork-offer dd').map((d) => d.text())
    expect(rows[0]).toContain('No programme has offered a place')
    expect(rows[1]).toContain('Walk-on')
    expect(rows[2]).toContain('$50,920')
    // ⚠ AND IT MAY NOT SAY THE ANSWER IS GONE, which is the sentence the 16.08 ruling deleted.
    // ⚠ SCOPED TO THE THIRD ANSWER AND ITS OWN ROWS, because the card's lede legitimately contains
    // the word "closed" – about the JUNIOR ladder, which really is shut on age. A whole-card regex
    // here was over-broad in exactly the way `pin-hygiene` warns a widened negative always is.
    const third = w.findAll('.fork-answer')[1].text() + w.find('.fork-offer').text()
    expect(third).not.toMatch(/no longer|not available|door is closed|cannot go|unavailable/i)
    w.unmount()
  })

  it('says "Nothing" rather than $0 when both layers cover the year', () => {
    const w = mountFork(FREE_RIDE)
    expect(w.findAll('.fork-offer dd')[2].text()).toBe('Nothing')
    w.unmount()
  })

  it('drops the need row entirely when there is no need-based layer', () => {
    const w = mountFork({ ...FUNDED, needShare: 0, familyPerYearCents: 11_776_00 })
    const award = w.findAll('.fork-offer dd')[1].text()
    expect(award).toContain('62%')
    expect(award, 'no empty "+ 0% need-based" tail').not.toContain('need-based')
    w.unmount()
  })

  // ⚠⚠ PROPERTY 3 – the v51 migration's promise, kept on the surface. A career that reached the fork
  // before this phase existed carries `offer: null`, was never quoted a price, and is charged none.
  it('⭐ shows a migrated career the pre-v51 line and no bill at all', () => {
    const w = mountFork(null)
    expect(w.find('.fork-offer').exists(), 'no offer block').toBe(false)
    expect(w.findAll('.fork-answer')).toHaveLength(3)
    expect(w.text()).toContain('the money goes the other way')
    // ⚠ AND NO INVENTED PRICE ON THE THIRD ANSWER. Scoped to that button: the card's FACTS list
    // legitimately prints her funds and her prize money in dollars, and always has.
    expect(w.findAll('.fork-answer')[1].text(), 'no price quoted').not.toMatch(/\$\d/)
    w.unmount()
  })

  // ⚠ PROPERTY 2 – ruling 4. The offer is detail, not emphasis: it sits OUTSIDE the answer buttons,
  // so the three answers keep the equal weight the ruling requires. A card that put three extra rows
  // inside one button would be recommending it in whitespace.
  it('⚠ does not turn the third answer into a recommendation', () => {
    const w = mountFork(FUNDED)
    expect(w.find('.fork-answer .fork-offer').exists(), 'the offer is not inside a button').toBe(false)
    expect(w.findAll('.fork-offer button')).toHaveLength(0)
    // Every answer is still an equal, undecorated control.
    for (const a of w.findAll('.fork-answer')) {
      expect(a.attributes('disabled')).toBeUndefined()
      expect(a.classes()).toEqual(['fork-answer'])
    }
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐ PROPERTY 4 – AND THE LONGER CARD STILL FITS A PHONE (CLAUDE.md's round-20 #3 rule)
// =================================================================================================
//
// This wave added three rows to a BLOCKING overlay, which is exactly the growth the rule names. The
// last case is what makes the first two mean anything: it puts the round-20 defect back on this card
// – the shape `TourBriefingDialog` shipped in – and asserts the same helper reports it.
describe('⭐⭐ the fork card, with the offer on it, fits 375x667', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function attached(offer: CollegeOffer | null, vp = PHONE) {
    // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time.
    setViewport(vp)
    const w = mountFork(offer, true)
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
    expect(document.querySelector('.fork-offer'), 'and the offer is on it').toBeTruthy()
    // ⚠ THE WAY OUT IS THE LAST ANSWER, and `measureDialog` reads the dismiss box off the card's own
    // bottom edge, so the control it measures has to be the last thing in the flow.
    expect(dismiss.lastElementChild?.textContent).toContain('Stop here')
    return { w, card, dismiss }
  }

  it('keeps the three answers inside the screen', () => {
    const { w, card, dismiss } = attached(FUNDED)
    const fit = assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (v51 offer)')
    expect(fit.available.height).toBe(635)
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = attached(WALK_ON, NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ForkDialog (v51 walk-on)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on this card and the SAME assertion goes red', () => {
    const { w, card, dismiss } = attached(FUNDED)
    const before = measureDialog(card, dismiss, PHONE)
    expect(
      before.contentFloor,
      'the card really is taller than the phone, or the mutation is vacuous',
    ).toBeGreaterThan(before.available.height)
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    w.unmount()
  })

  // ⚠ AND THE SECOND HALF OF THE MUTATION: the offer really is what made it longer. Without this the
  // fit cases could be passing on a card the offer never reached.
  it('⚠ the offer measurably lengthens the card, so the cases above are about it', () => {
    setViewport(PHONE)
    const withOffer = mountFork(FUNDED, true)
    const a = measureDialog(document.querySelector('.fork-card')!, document.querySelector('.fork-answers')!, PHONE)
    withOffer.unmount()
    document.body.innerHTML = ''
    const without = mountFork(null, true)
    const b = measureDialog(document.querySelector('.fork-card')!, document.querySelector('.fork-answers')!, PHONE)
    without.unmount()
    expect(a.contentFloor).toBeGreaterThan(b.contentFloor)
  })
})
