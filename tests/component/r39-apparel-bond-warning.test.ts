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
import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { ECONOMY } from '../../src/engine/economy'
import { kitTermsFor, type SponsorStanding } from '../../src/engine/offers'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { AdOfferTerms, KitOfferTerms, Offer } from '../../src/shared/protocol'

// The inbox annotates letters with two per-device facts (read / binned) and both live in
// localStorage; this runner has none. Same shim, and the same argument, as the other mail suites.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

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

// =================================================================================================
// ⭐⭐⭐ WAVE G2 – AND THE GUARANTEED LETTER IS A RENEWAL NOTICE, WHICH IS A THING THE PAPER SAYS.
//
// HIS RULING, 08.09: «мы можем прислать не просто новое письмо Meridian Sport с целью "подпиши, если
// пропустишь, то без формы", а уведомление о продлении». The house is already dressing her and
// already paying for the posters – it is CONTINUING, not competing – and the whole of the refinement
// is that the letter is written in that voice. ⚠ It is still SIGNED BY HAND: an auto-renewal would
// delete the decision the mechanism exists to create, so the controls, the deadline and every clause
// below the opening line are the ordinary letter's.
//
// ⚠ AND IT IS NOT `renewal`, WHICH IS THE INCUMBENT'S OWN FLAG. That letter offers the SAME contract
// again («the same deal, another year» – `raiseKitRenewal` copies its terms verbatim); this one
// carries the rung her ranking earns TODAY (ruling 2), so borrowing that sentence would misdescribe
// the only numbers a parent can check. Two flags, two voices, asserted apart here.
//
// MUTATION-VERIFIED, each restored:
//   * `apparelBond: true` removed from `apparelBondLetter`'s terms -> the paper falls back to «We
//     have been watching your daughter play all season» and the subject to «A kit deal for your
//     daughter»: both renewal cases red, every warning case still green;
//   * the `v-if="terms.apparelBond"` arm swapped for `v-if="terms.renewal"` ordering (the bond arm
//     moved below) -> the bond letter renders the stranger's opening, red;
//   * `apparelBondCost`'s brand test inverted -> the rival-renewal warning case goes red on its
//     number, and the bond letter starts warning about its own campaign.
describe('round 39 #17 wave G2 – the notice reads as a renewal, and the warning is where it was', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The guaranteed letter as `apparelBondLetter` writes it: the rung she clears today, X's name,
   *  and the flag that carries the voice. Built from `kitTermsFor` so a retuned ladder moves it. */
  function bondNotice(): Offer {
    return {
      id: `kit-bond-${WEEK - 1}`,
      kind: 'kit',
      week: WEEK,
      deadlineWeek: WEEK + 4,
      terms: { ...kitTermsFor(standing, 'icon')!, brand: S.premium.brand, apparelBond: true },
      state: 'open',
    }
  }

  it('⭐⭐⭐ THE PAPER OPENS AS A RENEWAL, not as a stranger introducing itself', () => {
    const offers = [campaign(S.premium.brand, 4)]
    const w = render(bondNotice(), offers)
    const text = w.text()
    expect(text).toContain('Her face is already on our posters')
    expect(text).toContain('this is us renewing it')
    // ⚠ THE DEFECT IT REPLACES, stated as the thing that must not be on this paper: the house that
    // is paying to photograph her does not say it has «been watching your daughter play all season».
    expect(text).not.toContain('We have been watching your daughter play all season')
    // ...and it does not borrow the incumbent's sentence either, because its terms are not that deal.
    expect(text).not.toContain('the same deal, another year')
    w.unmount()
  })

  it('⭐⭐ ...and it is still a DECISION – the deal, the deadline and the controls are all there', () => {
    // «а игрок уже сам будет решать с кем подписывать». An auto-renewal would be the one letter in
    // the inbox that is not answered by hand, so every clause under the opening line still stands.
    const offers = [campaign(S.premium.brand, 4)]
    const w = render(bondNotice(), offers)
    const text = w.text()
    expect(text).toContain("And while she is in our kit she is in nobody else's.")
    expect(text).toMatch(/to decide/)
    expect(text).toMatch(/fall short/i)
    w.unmount()
  })

  it('⚠ it warns about nothing, because signing it ends nothing – it IS the house shooting her', () => {
    const offers = [campaign(S.premium.brand, 4)]
    const w = render(bondNotice(), offers)
    expect(w.text()).not.toContain('Signing us ends her campaign')
    w.unmount()
  })

  it('⭐⭐⭐ AND WHERE A RIVAL LETTER WOULD, THE WARNING AND ITS NUMBER ARE STILL THERE', () => {
    // The half wave G shipped, re-asserted against the refinement: a renewal-framed paper does not
    // silence the clause. This is the strongest form of it – a letter that IS a renewal (the
    // incumbent's own flag) from a house that is NOT the one shooting her still names the campaign
    // its signature would end, and the money.
    const offers = [campaign(S.premium.brand, 4)]
    const rival = kitLetter('icon')
    rival.terms = { ...(rival.terms as KitOfferTerms), renewal: true }
    const w = render(rival, offers)
    const text = w.text()
    expect(text).toContain('the same deal, another year')
    expect(text).toContain(`Signing us ends her campaign with ${S.premium.brand}`)
    expect(text).toContain('$200,000')
    w.unmount()
  })
})

// =================================================================================================
describe('round 39 #17 wave G2 – and the inbox names it a renewal before he opens it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  /** Every subject the sheet renders, off a real career snapshot – `round29-inbox-subjects`' idiom,
   *  because `subjectOf` is private to a `<script setup>` and what he reads is `.inbox-subject`. */
  function subjects(offers: Offer[]): string[] {
    const base = careerSnapshot(8, 'r39-17-g2-inbox')
    const store = useGameStore()
    store.snapshot = { ...base, offers: [...base.offers, ...offers], week: WEEK }
    const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
    const out = wrapper.findAll('.inbox-subject').map((n) => n.text().replace(/\s+/g, ' ').trim())
    wrapper.unmount()
    return out
  }

  it('⭐⭐ the notice’s subject says it is a renewal, and it is NOT the incumbent’s', () => {
    const notice: Offer = {
      id: `kit-bond-${WEEK - 1}`,
      kind: 'kit',
      week: WEEK,
      deadlineWeek: WEEK + 4,
      terms: { ...kitTermsFor(standing, 'icon')!, brand: S.premium.brand, apparelBond: true },
      state: 'open',
    }
    const lines = subjects([notice])
    expect(lines).toContain('Renewing her kit with us')
    // ⚠ AND NOT the stranger's line, which is the defect this arm exists to stop – round 28 #17's
    // own reasoning: a subject that introduces a house already paying to photograph her is false.
    expect(lines).not.toContain('A kit deal for your daughter')
    expect(lines).not.toContain('Another year in our kit')
  })

  it('⚠ CONTROL – an ordinary kit letter still says what it always said', () => {
    const plain: Offer = {
      id: `kit-${WEEK}`, kind: 'kit', week: WEEK, deadlineWeek: WEEK + 4,
      terms: kitTermsFor(standing, 'icon')!, state: 'open',
    }
    expect(subjects([plain])).toContain('A kit deal for your daughter')
  })
})
