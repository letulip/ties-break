// ⭐⭐⭐ ROUND 39 #17 – THE WARNING IS THE MECHANISM, AND IT IS ON THE PAPER WITH ITS NUMBER.
//
// THE OWNER, 08.09: «если в межсезонье она решит подписать другого спонсора, то контракт обнулится…
// А игрок уже сам будет решать с кем подписывать.» He is asking for a DECISION, and a consequence a
// parent cannot price is not one – the ledger's own line: «without the number it is a trap; with it,
// it is the decision he is asking for».
//
// So a RIVAL house's kit letter must say, on its own face, that signing ends her running clothing
// campaign, and must name the money that costs. This file asserts the rendered paper, not the
// source: `apparelBondCost` – the very function `signOffer` reads to end the campaign – is what the
// sheet prints, so the letter and the till cannot say different things.
//
// MOUNTED, NOT PINNED (CLAUDE.md's own gotcha). MUTATION-VERIFIED, and each arm restored:
//   * the `<li v-if="bondCost">` clause deleted from OfferLetter -> both warning cases go red and
//     the two «no warning» controls stay green (which is what says they are controls);
//   * `apparelBondCost`'s brand test inverted (`t.brand !== brand` -> `===`) -> the incumbent's own
//     letter starts warning about a campaign signing it cannot end, and that control goes red;
//   * the money clause reduced to the bare sentence (the `formatCents` half removed) -> the number
//     case goes red while the zero-fee case stays green.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { ECONOMY } from '../../src/engine/economy'
import { kitTermsFor, type SponsorStanding } from '../../src/engine/offers'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { AdOfferTerms, Offer } from '../../src/shared/protocol'

const S = ECONOMY.sponsorship
const FEE = 100_000_00
const WEEK = 52 * 12 + 47

const standing: SponsorStanding = { nationalRank: 400, itfRank: 999, itfRanked: false, wtaRank: 5, wtaRanked: true }

/** A signed clothing campaign from `brand`, `years` long, banked one year in. */
function campaign(brand: string, years: number, from = WEEK - 60): Offer {
  const terms: AdOfferTerms = {
    category: 'clothing',
    brand,
    trade: 'We make her kit',
    cashCents: FEE,
    termYears: years,
    termWeeks: years * WEEKS_PER_YEAR,
    shootCount: 1,
  }
  return {
    id: `ad-clothing-${from}`,
    kind: 'ad',
    week: from,
    deadlineWeek: from + 4,
    terms,
    state: 'signed',
    decidedWeek: from,
    fromWeek: from,
    untilWeek: from + years * WEEKS_PER_YEAR - 1,
  }
}

/** An open kit letter from a named rung – the paper a parent is actually handed. */
function kitLetter(tier: 'tour' | 'premium' | 'icon'): Offer {
  return {
    id: `kit-${WEEK}`,
    kind: 'kit',
    week: WEEK,
    deadlineWeek: WEEK + 4,
    terms: kitTermsFor(standing, tier)!,
    state: 'open',
  }
}

const render = (offer: Offer, offers: Offer[]) =>
  mount(OfferLetter, { props: { offer, week: WEEK, offers } as never })

describe('round 39 #17 – the rival house names the campaign it would end, and the money', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ a RIVAL letter says signing ends the campaign AND prints the fees still to come', () => {
    // Meridian Sport is shooting her; Aurelia is writing. Four contract years, one anniversary
    // already banked, so TWO are still to come at $100,000 each – and the paper says $200,000.
    const offers = [campaign(S.premium.brand, 4)]
    const w = render(kitLetter('icon'), offers)
    const text = w.text()
    expect(text).toContain(`Signing us ends her campaign with ${S.premium.brand}`)
    expect(text).toContain('$200,000')
    expect(text).toContain('of fees still to come on it')
    w.unmount()
  })

  it('⭐⭐ ...and when nothing is left to come it says THAT, rather than a number that is not there', () => {
    // A one-year campaign: the whole fee was banked at signature, so leaving costs no money at all.
    // The consequence is still stated – the campaign ends – which is the half that is never zero.
    const offers = [campaign(S.premium.brand, 1, WEEK - 10)]
    const w = render(kitLetter('icon'), offers)
    const text = w.text()
    expect(text).toContain(`Signing us ends her campaign with ${S.premium.brand}`)
    expect(text).toContain('Every fee it owed her is already banked and stays hers')
    expect(text).not.toContain('still to come on it')
    w.unmount()
  })

  it('⚠ CONTROL – the house ALREADY shooting her warns about nothing: signing it ends nothing', () => {
    const offers = [campaign(S.icon.brand, 4)]
    const w = render(kitLetter('icon'), offers)
    expect(w.text()).not.toContain('Signing us ends her campaign')
    w.unmount()
  })

  it('⚠ CONTROL – with no campaign running the letter is exactly the letter it always was', () => {
    const w = render(kitLetter('icon'), [])
    const text = w.text()
    expect(text).not.toContain('Signing us ends her campaign')
    // ...and the clauses that were always there still are.
    expect(text).toContain("And while she is in our kit she is in nobody else's.")
    w.unmount()
  })

  it('⚠ CONTROL – a caller that hands no inbox gets the old paper, unchanged', () => {
    // `offers` is optional, so every existing call site (and every fixture) reads as it always did.
    const w = mount(OfferLetter, { props: { offer: kitLetter('icon'), week: WEEK } as never })
    expect(w.text()).not.toContain('Signing us ends her campaign')
    w.unmount()
  })
})
