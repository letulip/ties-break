// ⭐⭐⭐ ROUND 39 #17 – THE CONSEQUENCE IS ON THE PAPER, AND THE MONEY IS ON THE CONFIRM.
//
// THE OWNER, 08.09: «если в межсезонье она решит подписать другого спонсора, то контракт обнулится…
// А игрок уже сам будет решать с кем подписывать.» He is asking for a DECISION, and a consequence a
// parent cannot price is not one.
//
// ⚠⚠ WAVE G3 RE-AIMED THIS WHOLE FILE, AND NOT ONE CLAIM IN IT WAS DROPPED – THEY CHANGED SURFACE.
// Wave G put the competitor's remaining fees on the rival house's own letterhead. The owner
// overturned that on 08.09: «ты правда думаешь, что в реальности при переподписании кто-то пишет
// точные суммы предыдущих контрактов конкурентов? я сомневаюсь в этом. Но дать понять это надо
// абсолютно точно». A rival apparel house does not know, and would never publish, a competitor's
// remaining contract value – an exclusivity CLAUSE on its paper is realistic, a rival's balance
// sheet is not – and the consequence must still land exactly.
//
// So the claim SPLIT in two, and both halves are asserted below:
//   * THE LETTER carries the clause and NO figures. The «no money» half is asserted as an ABSENCE of
//     the campaign's own numbers, not merely as the presence of the clause – a test that only looked
//     for the clause would stay green on the paper wave G shipped.
//   * THE CONFIRM carries the money, in its own voice, because its round-24 doctrine already says it
//     states the deal «and the one thing the letter cannot say». A competitor's figures are that.
//     It stays a RESTATEMENT and never an argument: the fact, then «This cannot be undone.»
//
// `apparelBondCost` – the engine's own function, the very one `signOffer` reads to end the campaign
// – is what BOTH surfaces read, so the paper, the confirm and the till cannot disagree.
//
// MOUNTED, NOT PINNED (CLAUDE.md's own gotcha). MUTATION-VERIFIED, and each arm restored – see the
// per-describe notes below.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import OfferLetter from '../../src/components/OfferLetter.vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { ECONOMY } from '../../src/engine/economy'
import { kitTermsFor, type SponsorStanding } from '../../src/engine/offers'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import type { AdOfferTerms, KitOfferTerms, Offer, Snapshot } from '../../src/shared/protocol'
// ⚠ THE APP'S OWN STYLESHEET – without it `.dialog-card`'s height cap is not in the cascade and the
// phone-fit measurement at the end of this file is vacuous. Same reason ad-offer-letter.test.ts
// imports it.
import '../../src/style.css'
import { assertDismissReachable, setViewport, PHONE } from './fits'

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

/** The clause the rival's paper carries, minus the brand – the marker every arm below reads for. */
const CLAUSE = 'she appears in no other apparel campaign'

// ⚠⚠ RE-AIMED BY WAVE G3, NOT DELETED. The first two cases used to assert the MONEY on the letter
// («$200,000 … of fees still to come on it» / «Every fee it owed her is already banked»); the owner
// ruled that a rival house cannot print a competitor's figures, so the same two careers now assert
// the CLAUSE and the ABSENCE of those figures, and the money they were about is asserted on the
// confirm at the foot of this file. The three controls are untouched apart from the marker string.
//
// MUTATION-VERIFIED, each restored:
//   * the `<li v-if="bondCost">` clause deleted from OfferLetter -> both clause cases red, the three
//     «no clause» controls still green (which is what says they are controls);
//   * `apparelBondCost`'s brand test inverted (`t.brand !== brand` -> `===`) -> the incumbent's own
//     letter starts carrying a clause its signature cannot trigger, and that control goes red;
//   * wave G's money arms restored on the paper -> both «no figures» assertions go red, which is
//     what makes this a test of the ruling and not merely of the clause.
describe('round 39 #17 – the rival house states the clause, and NOT the competitor’s money', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ a RIVAL letter says the campaign would end – with no figure from a rival’s books', () => {
    // Meridian Sport is shooting her; Aurelia is writing. Four contract years, one anniversary
    // already banked, so TWO fees of $100,000 are still to come – and the paper says NEITHER number.
    const offers = [campaign(S.premium.brand, 4)]
    const w = render(kitLetter('icon'), offers)
    const text = w.text()
    expect(text).toContain(CLAUSE)
    expect(text).toContain(`hers with ${S.premium.brand} would end on signature`)
    // ⚠ THE HALF THE RULING IS ABOUT, asserted as an absence: the remaining value, and the single
    // fee it is built from, are a competitor's balance sheet and this house has no way to know them.
    expect(text, 'the rival letter prints the campaign’s remaining value').not.toContain('$200,000')
    expect(text, 'the rival letter prints the campaign’s yearly fee').not.toContain('$100,000')
    expect(text).not.toContain('of fees still to come on it')
    w.unmount()
  })

  it('⭐⭐ ...and the clause does not change when the term has played out – one arm, not two', () => {
    // A one-year campaign: the whole fee was banked at signature, so leaving costs no money at all.
    // With no money on the paper there is nothing for the two cases to differ about, so the sentence
    // is the same one – and wave G's second arm, which spoke about banked fees, is gone from here.
    const offers = [campaign(S.premium.brand, 1, WEEK - 10)]
    const w = render(kitLetter('icon'), offers)
    const text = w.text()
    expect(text).toContain(CLAUSE)
    expect(text).toContain(`hers with ${S.premium.brand} would end on signature`)
    expect(text).not.toContain('already banked and stays hers')
    expect(text).not.toContain('still to come on it')
    w.unmount()
  })

  it('⚠ CONTROL – the house ALREADY shooting her carries no such clause: signing it ends nothing', () => {
    const offers = [campaign(S.icon.brand, 4)]
    const w = render(kitLetter('icon'), offers)
    expect(w.text()).not.toContain(CLAUSE)
    w.unmount()
  })

  it('⚠ CONTROL – with no campaign running the letter is exactly the letter it always was', () => {
    const w = render(kitLetter('icon'), [])
    const text = w.text()
    expect(text).not.toContain(CLAUSE)
    // ...and the clauses that were always there still are.
    expect(text).toContain("And while she is in our kit she is in nobody else's.")
    w.unmount()
  })

  it('⚠ CONTROL – a caller that hands no inbox gets the old paper, unchanged', () => {
    // `offers` is optional, so every existing call site (and every fixture) reads as it always did.
    const w = mount(OfferLetter, { props: { offer: kitLetter('icon'), week: WEEK } as never })
    expect(w.text()).not.toContain(CLAUSE)
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

  it('⚠ it carries no such clause, because signing it ends nothing – it IS the house shooting her', () => {
    const offers = [campaign(S.premium.brand, 4)]
    const w = render(bondNotice(), offers)
    expect(w.text()).not.toContain(CLAUSE)
    w.unmount()
  })

  it('⭐⭐⭐ AND WHERE A RIVAL LETTER WOULD, THE CLAUSE IS STILL THERE – still without the figures', () => {
    // ⚠ RE-AIMED BY WAVE G3: this used to end on «and the money». It does not, because the money
    // left this surface; what it protects is unchanged and is the reason it exists – a
    // renewal-framed paper does not silence the clause. This is the strongest form of it: a letter
    // that IS a renewal (the incumbent's own flag) from a house that is NOT the one shooting her
    // still states that its signature would end the campaign. The money it costs is asserted on the
    // confirm, at the foot of this file.
    const offers = [campaign(S.premium.brand, 4)]
    const rival = kitLetter('icon')
    rival.terms = { ...(rival.terms as KitOfferTerms), renewal: true }
    const w = render(rival, offers)
    const text = w.text()
    expect(text).toContain('the same deal, another year')
    expect(text).toContain(CLAUSE)
    expect(text).toContain(`hers with ${S.premium.brand} would end on signature`)
    expect(text).not.toContain('$200,000')
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

// =================================================================================================
// ⭐⭐⭐ WAVE G3 – AND THE MONEY IS ON THE CONFIRM, WHICH IS WHERE THE RULING PUT IT.
//
// «Но дать понять это надо абсолютно точно.» The rival's paper cannot carry a competitor's figures;
// the confirm can, and by its own doctrine must – round 24 item 2's rule is that the last thing he
// reads restates the deal AND «the one thing the letter cannot say». A competitor's remaining fees
// are exactly that class of fact, so the cost is stated there, in the confirm's own voice, off
// `apparelBondCost` – the SAME engine function the paper reads to decide whether its clause appears
// at all, called on the same inbox and the same week. The two surfaces cannot answer differently.
//
// ⚠ IT REMAINS A RESTATEMENT AND NEVER AN ARGUMENT (this dialog's own standing rule): the fact, then
// «This cannot be undone.» No persuasion, no «are you sure you want to lose this», and nothing about
// the exclusivity term itself – that IS on the paper, and tests/offers.test.ts guards that negative.
//
// MUTATION-VERIFIED, each restored:
//   * `bondClause` deleted from `confirmMessage` (always '') -> both money cases red, the two
//     «gains nothing» controls green, and the untouched-arms case green – which is what says the
//     controls are controls and that the rest of the confirm is not being carried by this clause;
//   * the wrong arm forced (`bond.cents > 0` -> `bond.cents >= 0`) -> the played-out case goes red
//     on the owner's own sentence while the fees case stays green;
//   * the wrong arm forced the other way (`bond.cents > 0` -> `false`) -> the fees case goes red on
//     its figure while the played-out case stays green;
//   * `apparelBondCost`'s brand test inverted (`t.brand !== brand` -> `===`) -> the incumbent's own
//     confirm starts quoting a cost its signature cannot charge, red.
describe('round 39 #17 wave G3 – the sign confirm carries the cost the letter cannot state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  /** Open a kit letter in a real career's inbox and press Sign; returns the mounted sheet.
   *
   *  ⚠ THE POST IS EXACTLY WHAT EACH CASE HANDS IT – the walked career's own letters are replaced
   *  rather than appended to. The incumbent case deliberately puts the kit letter and the campaign
   *  under ONE brand, so a row picked by sender would be ambiguous; picking by subject is only
   *  unambiguous if nothing else in the pile wears that subject, and the assertion below says so. */
  async function pressSign(letter: Offer, running: Offer[]) {
    const base: Snapshot = careerSnapshot(8, 'r39-17-g3-confirm')
    const store = useGameStore()
    store.snapshot = { ...base, offers: [...running, letter], week: WEEK }
    // ⚠ ATTACHED TO THE REAL DOCUMENT, like ad-offer-letter.test.ts' own fit case: `.dialog-card`'s
    // height cap only exists in the cascade for an element the document can style, so a detached
    // mount would make the phone measurement at the end of this block vacuous.
    const wrapper = mount(InboxSheet, { attachTo: document.body })
    const rows = wrapper.findAll('.inbox-open').filter((b) => b.text().includes('A kit deal for your daughter'))
    expect(rows, 'exactly one kit letter should be openable in this pile').toHaveLength(1)
    await rows[0]!.trigger('click')
    await nextTick()
    await wrapper.find('button.offer-sign').trigger('click')
    await nextTick()
    return wrapper
  }

  /** ⚠ THE CONFIRM'S OWN VOICE, AND NOTHING ELSE. The letter is still mounted UNDER the overlay, so
   *  a `wrapper.text()` read would hand every negative assertion the paper's sentences as well –
   *  including the exclusivity clause this dialog must not repeat. `.dialog-message` is the one
   *  element `ConfirmDialog` renders the message into. */
  const said = (w: Awaited<ReturnType<typeof pressSign>>): string => w.find('.dialog-message').text()

  it('⭐⭐⭐ signing a RIVAL names the campaign it ends AND the fees still to come on it', async () => {
    // The same career as the letter's first case: four contract years, one anniversary banked, two
    // fees of $100,000 still to come. The paper says none of that; this dialog says all of it.
    const w = await pressSign(kitLetter('icon'), [campaign(S.premium.brand, 4)])
    const text = said(w)
    expect(text).toContain(`Signing ends her campaign with ${S.premium.brand} – $200,000 of fees still to come on it.`)
    w.unmount()
  })

  it('⭐⭐⭐ ...and when the term has played out it says so – the owner’s own sentence, verbatim', async () => {
    // A one-year campaign, banked at signature: leaving costs no money at all, and stating THAT is
    // the accurate half of the same fact rather than a consolation.
    const w = await pressSign(kitLetter('icon'), [campaign(S.premium.brand, 1, WEEK - 10)])
    const text = said(w)
    expect(text).toContain(`Signing ends her campaign with ${S.premium.brand}. Every fee it owed her is already banked and stays hers.`)
    expect(text, 'the played-out arm must not quote a figure that is not there').not.toContain('still to come on it')
    w.unmount()
  })

  it('⭐⭐ the confirm’s OWN arms are untouched, and it still stops at the fact', async () => {
    // ⚠ THE HALF THAT IS NOT NEW. The kit confirm has restated the coverage, the term, the week it
    // runs to and the events she owes since 09.08, and the bond sentence is an insertion, not a
    // rewrite. And the standing rule holds visibly: the clause states the fact and the dialog ends
    // on «This cannot be undone.» – no persuasion after it, and the exclusivity TERM (which is on
    // the paper) is not argued here.
    const w = await pressSign(kitLetter('icon'), [campaign(S.premium.brand, 4)])
    const text = said(w)
    expect(text).toContain(`Sign with ${S.icon.brand}?`)
    expect(text).toContain('They cover her')
    expect(text).toMatch(/tournaments a season/)
    expect(text).toContain('This cannot be undone.')
    expect(text).toMatch(/still to come on it\.\s*This cannot be undone\./)
    expect(text, 'the confirm must not argue the exclusivity term').not.toContain('nobody else')
    expect(text).not.toMatch(/are you sure/i)
    w.unmount()
  })

  it('⚠ CONTROL – a kit letter with no campaign running gains nothing on its confirm', async () => {
    const w = await pressSign(kitLetter('icon'), [])
    const text = said(w)
    expect(text).toContain(`Sign with ${S.icon.brand}?`)
    expect(text).not.toContain('Signing ends her campaign')
    w.unmount()
  })

  it('⚠ CONTROL – the house ALREADY shooting her charges nothing, and its confirm says nothing', async () => {
    // Signing the house that is already writing her campaign ends nothing, so there is no cost to
    // state. `apparelBondCost` answers null and the sentence folds away.
    const w = await pressSign(kitLetter('premium'), [campaign(S.premium.brand, 4)])
    const text = said(w)
    expect(text).toContain(`Sign with ${S.premium.brand}?`)
    expect(text).not.toContain('Signing ends her campaign')
    w.unmount()
  })

  it('⚠ AND THE LONGER CONFIRM STILL FITS A PHONE (round-20 #3, CLAUDE.md)', async () => {
    // The rule for any dialog this wave LENGTHENS. The worst case is the one that adds the most: the
    // fees arm, with a brand name and a figure in it, on top of the full kit restatement.
    setViewport(PHONE)
    const w = await pressSign(kitLetter('icon'), [campaign(S.premium.brand, 4)])
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the sign confirm did not render').toBeTruthy()
    assertDismissReachable(card, dismiss, PHONE, 'the kit sign confirm with the apparel-bond cost (wave G3)')
    w.unmount()
  })
})
