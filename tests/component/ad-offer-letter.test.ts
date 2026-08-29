// ROUND 24 ITEM 2, STEP 1 – THE ADVERTISING LETTER RENDERS, AND THE ROW OPENS IT.
//
// The engine half (arrival, the gate, the money, the freeze) is measured in tests/ad-offer.test.ts
// against a walked career. What is asked here is the round24-academy-letter question, for the new
// paper: given this letter, does the inbox row say who wrote and what about, does the sheet render
// the terms off `terms`, and do the two buttons that make it a PROPOSAL actually emit.
//
// MOUNTED, NOT PINNED, per CLAUDE.md's own gotcha – every assertion is about the rendered surface.
// The fixture split is the academy file's: a real walked career for the list, a hand-built letter
// for the paper.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { useGameStore } from '../../src/stores/game'
import { ECONOMY } from '../../src/engine/economy'
import { adTermsForCategory, adCapstoneTerms } from '../../src/engine/offers'
import { chooseShootWeeks } from '../../src/engine/offers'
import { weekLabel } from '../../src/shared/dates'
import type { AdOfferTerms, Offer, Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'
// ⚠ THE APP'S OWN STYLESHEET – without it `.dialog-card`'s height cap is not in the cascade and the
// fit measurement below is vacuous. Same reason r2-07-dialog-shell.test.ts imports it.
import '../../src/style.css'
import { assertDismissReachable, setViewport, PHONE } from './fits'

const AD = ECONOMY.advertising
/** ⚠ THE CATALOGUE BECAME A LADDER (round 29 part two #19/#20) AND THEN A PORTFOLIO (part four
 *  P6/§8). Every claim in this file is about the shipped watch deal's SHAPE – papers exactly like
 *  it are persisted in real saves – so `WATCH` freezes that LEGACY paper: the fee off the watches
 *  category's ≤200 cell (the anchor, unchanged to the cent), the brand its first house, the
 *  52-week term and two-shoot ask the old letters carry. */
const WATCH = {
  brand: ECONOMY.advertising.categories.watches.houses[0],
  maxWtaRank: ECONOMY.advertising.bands[0].maxWtaRank,
  cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[0]!,
  termWeeks: 52,
  shootWeeksPerTerm: 2,
}

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

/** A letter as `raiseAdOffer` writes it – id/kind/deadline per the engine's own shapes, terms from
 *  the catalogue so the copy under test is the copy a player gets. */
function letter(overrides: Partial<Offer> = {}, terms: Partial<AdOfferTerms> = {}): Offer {
  const week = overrides.week ?? 300
  return {
    id: `ad-${week}`,
    kind: 'ad',
    week,
    deadlineWeek: week + AD.decideWeeks - 1,
    state: 'open',
    terms: { brand: WATCH.brand, cashCents: WATCH.cashCents, termWeeks: WATCH.termWeeks, shootCount: WATCH.shootWeeksPerTerm, ...terms },
    ...overrides,
  } as Offer
}

describe('OfferLetter – the advertising house has its own sheet', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the open letter states the fee, the term and the no-obligation line, and offers both answers', () => {
    const open = letter()
    const w = mount(OfferLetter, { props: { offer: open, week: open.week } as never })
    const text = w.text()
    // Who is writing, and that they are not a tennis house – the non-endemic half is the content.
    expect(text).toContain('We make watches')
    expect(text).toContain(WATCH.brand)
    // The fee, in real money, formatted once at the edge (cents in, dollars out).
    expect(text).toContain('$20,000')
    expect(text).toContain('paid the day this is signed')
    // The term, in a house's words rather than a numeral.
    expect(text).toContain('Twelve months')
    // ⚠ RE-AIMED FOR STEP 2 (owner ruling 22.08). Step 1's letter said «Nothing else is asked of
    // her: … no appearances scheduled» and the owner read that line and ruled it dead: «съемки
    // должны быть иногда и это надо как-то прописывать». The paper now states its price in time –
    // the shoot count in the house's words, the naming rule, and the cost said plainly WITHOUT an
    // engine figure – and bounds what is owed beyond it.
    // ⚠ RE-AIMED AGAIN BY ROUND 29 PART FOUR P9: the sentence was «Two weeks of her season are
    // shoot weeks … In season, spread apart», and the owner moved the shoot season into the winter
    // – the paper now says so («We book the winter first – the off-season is the shoot season») and
    // keeps the in-season clause for the overflow. The price-in-time content is unchanged.
    expect(text).toContain('Two weeks of her year are shoot weeks')
    expect(text).toContain('the off-season is the shoot season')
    expect(text).toContain('named the day this is signed')
    expect(text).toContain('she will rest less in it')
    expect(text).toContain('Beyond those weeks nothing is owed')
    expect(text).toContain('nothing to pay back')
    expect(text).not.toContain('Nothing else is asked of her')
    expect(text).not.toContain('no appearances scheduled')
    // A PROPOSAL: both controls, and the window under them.
    expect(text).toContain('Sign')
    expect(text).toContain('Refuse')
    expect(text).toContain(`${AD.decideWeeks} weeks to decide`)
    // ⚠ NO LETTERHEAD: the marks are keyed by kit rung and this house is on no rung – the sheet
    // signs itself like the desks' and the academy's do, and no art is invented for it.
    expect(w.find('img.offer-mark').exists()).toBe(false)
    w.unmount()
  })

  it('Sign and Refuse emit, with the letter\'s own id', async () => {
    const open = letter()
    const w = mount(OfferLetter, { props: { offer: open, week: open.week } as never })
    await w.find('button.offer-sign').trigger('click')
    await w.find('button.offer-refuse').trigger('click')
    expect(w.emitted('sign')).toEqual([[open.id]])
    expect(w.emitted('refuse')).toEqual([[open.id]])
    w.unmount()
  })

  it('the four settled states are four different sentences, and none offers a decision', () => {
    const signedRunning = letter(
      { state: 'signed', decidedWeek: 300, fromWeek: 300, untilWeek: 351 },
      { shootWeeks: [314, 340] },
    )
    const running = mount(OfferLetter, { props: { offer: signedRunning, week: 320 } as never })
    expect(running.text()).toContain('the campaign runs to')
    expect(running.text()).toContain('fee is banked')
    // ⭐ STEP 2: the record NAMES the weeks the signature chose, in the game's own calendar words –
    // the engine's `shootWeeks` verbatim, never a number the sheet worked out.
    expect(running.text()).toContain(`her shoot weeks are ${weekLabel(314)} and ${weekLabel(340)}`)
    running.unmount()

    const signedOver = mount(OfferLetter, { props: { offer: signedRunning, week: 400 } as never })
    expect(signedOver.text()).toContain('run its course')
    signedOver.unmount()

    const refused = mount(OfferLetter, {
      props: { offer: letter({ state: 'refused', decidedWeek: 301 }), week: 320 } as never,
    })
    expect(refused.text()).toContain('Turned down.')
    refused.unmount()

    const expired = mount(OfferLetter, {
      props: { offer: letter({ state: 'expired', decidedWeek: 304 }), week: 320 } as never,
    })
    expect(expired.text()).toContain('Expired')
    expired.unmount()

    // None of the settled papers may re-offer the decision.
    for (const offer of [signedRunning, letter({ state: 'refused', decidedWeek: 301 })]) {
      const w = mount(OfferLetter, { props: { offer, week: 400 } as never })
      expect(w.find('button.offer-sign').exists()).toBe(false)
      expect(w.find('button.offer-refuse').exists()).toBe(false)
      w.unmount()
    }
  })
})

describe('InboxSheet – the letter is in the list, the row says what it is, the confirm restates it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  /** A real career's snapshot, with the house's letter added to the post it already has. */
  function mountInbox(offers: Offer[]) {
    const base: Snapshot = careerSnapshot(8, 'ad-inbox')
    const store = useGameStore()
    store.snapshot = { ...base, offers: [...base.offers, ...offers], week: offers[0]?.week ?? base.week }
    return mount(InboxSheet, { global: { stubs: { teleport: true } } })
  }

  it('the row is signed by the brand, the subject names the fee, and a live letter wears the pill', () => {
    const wrapper = mountInbox([letter()])
    const rows = wrapper.findAll('.inbox-row')
    const row = rows.map((r) => r.text()).find((t) => t.includes(WATCH.brand))
    expect(row).toBeTruthy()
    expect(row).toContain('Her face in a campaign – $20,000')
    // An open advertising letter is a DECISION, so – unlike the academy's notices – it must wear
    // the waiting pill the accent dot points at.
    expect(row).toContain('Needs an answer')
    wrapper.unmount()
  })

  it('clicking the row opens the paper, and pressing Sign raises the endorsement\'s OWN confirm', async () => {
    const open = letter()
    const wrapper = mountInbox([open])
    const row = wrapper.findAll('.inbox-open').find((b) => b.text().includes(WATCH.brand))
    expect(row).toBeTruthy()
    await row!.trigger('click')
    await nextTick()
    expect(wrapper.find('.offer-letter').exists()).toBe(true)
    expect(wrapper.text()).toContain('We make watches')

    await wrapper.find('button.offer-sign').trigger('click')
    await nextTick()
    const text = wrapper.text()
    // The last thing he reads is the deal in the paper's own words – the fee, where it lands, the
    // term – and the one thing the letter cannot say for itself.
    expect(text).toContain(`Sign with ${WATCH.brand}?`)
    expect(text).toContain('one-time fee')
    expect(text).toContain('paid to the family now')
    expect(text).toContain('This cannot be undone.')
    // ⭐ STEP 2 (⚠ re-aimed from step 1's «nothing else asked of her», which the owner ruled dead):
    // the confirm PREVIEWS the exact weeks the signature will name – the same `chooseShootWeeks`
    // call the engine makes, on the snapshot's own seed and week, so deciding happens with the
    // weeks in hand. The expectation computes them the same way; a drifted preview fails here.
    const store = useGameStore()
    const t = open.terms as AdOfferTerms
    const expected = chooseShootWeeks(
      store.snapshot!.seed,
      store.snapshot!.week,
      t.termWeeks,
      t.shootCount,
      ECONOMY.advertising.shootLeadWeeks,
    ).map((w) => weekLabel(w))
    expect(expected).toHaveLength(WATCH.shootWeeksPerTerm)
    expect(text).toContain(`with her shoot weeks on ${expected.join(' and ')}`)
    expect(text).toContain('working weeks, less rest in them')
    expect(text).not.toContain('nothing else asked of her')
    // ...and not the KIT confirm's sentence: the branch must not fall through to kit arithmetic.
    expect(text).not.toContain('tournaments a season')
    wrapper.unmount()
  })
})

describe('⭐⭐ OfferLetter – the PORTFOLIO on the paper (round 29 part four P6/§8)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ⚠ THE OPENING CLAUSE WAS HARD-CODED «We make watches» IN THE MARKUP while the catalogue had one
  // house. A shelf of categories and a template that introduced all of them as watchmakers is the
  // same class of defect as a renewal that says «A kit deal for your daughter» – the letter would be
  // false about its own author. The clause comes off the PAPER (`AdOfferTerms.trade`), and since P6
  // the paper also states its per-year money, its 1–3 year term and its CATEGORY-scoped
  // exclusivity clause.
  it.each([['airline', 1], ['fragrance', 3]] as const)('the %s category`s letter says what THAT house makes and asks', (category, band) => {
    const def = ECONOMY.advertising.categories[category]
    const t = adTermsForCategory(category, band, 2, def.houses[0])!
    const open = letter({}, t)
    const w = mount(OfferLetter, { props: { offer: open, week: open.week } as never })
    const text = w.text()
    expect(text).toContain(def.trade)
    expect(text).toContain(def.houses[0])
    expect(text).not.toContain('We make watches')
    // the PER-YEAR fee and where the rest of it lands – P6's multi-year money, stated on the paper
    expect(text).toContain(`$${Math.round(t.cashCents / 100).toLocaleString('en-US')}`)
    expect(text).toContain('for each contract year')
    expect(text).toContain('Two years')
    // the exclusivity clause is the CATEGORY's, not the whole post's – the portfolio's own rule
    expect(text).toContain(`in no other ${category} campaign while that runs`)
    // ...and the shoot ask, per year, preferring the winter (P9's own sentence on the paper).
    const word = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][t.shootCount]
    expect(text).toContain(`${word} ${t.shootCount === 1 ? 'week' : 'weeks'} of her year`)
    expect(text).toContain('the off-season is the shoot season')
    w.unmount()
  })

  it('⚠ a letter written BEFORE the ladder still reads exactly what it read the day it arrived', () => {
    // The optional-widening promise, on the surface: an old ad letter carries no `tier` and no
    // `trade`, and every one of those is a Quiet Hour letter by construction – so the fallback is
    // exact rather than a guess, and his own inbox does not rewrite itself.
    const old = letter({}, { trade: undefined, tier: undefined })
    const w = mount(OfferLetter, { props: { offer: old, week: old.week } as never })
    expect(w.text()).toContain('We make watches')
    w.unmount()
  })
})

describe('⚠ the confirm the BIGGEST house produces still fits a phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  // CLAUDE.md's own rule: «any dialog you add or LENGTHEN gets a mounted assertion that its dismiss
  // control's box is inside a 375x667 viewport». Round 29 part four P6 lengthened this one AGAIN –
  // the longest paper is now the CAPSTONE, eight years at two shoots a year = sixteen named weeks –
  // so the confirm caps the list at six dates and counts the rest, and this test mounts the worst
  // case to prove the cap holds the dialog on a phone. It is a BLOCKING overlay and this is the
  // failure mode round-20 #3 cost a career to: «a dialog grows by one honest sentence at a time and
  // nothing objects until it is taller than a phone».
  it('the capstone`s sixteen shoot weeks do not push the buttons off a 375x667 screen', async () => {
    setViewport(PHONE)
    const h = { brand: adCapstoneTerms('Aurelia').brand, trade: 'We make her kit' }
    const open = letter({}, adCapstoneTerms('Aurelia'))
    const base: Snapshot = careerSnapshot(8, 'ad-inbox-fit')
    const store = useGameStore()
    store.snapshot = { ...base, offers: [...base.offers, open], week: open.week }
    const wrapper = mount(InboxSheet, { attachTo: document.body })
    const row = wrapper.findAll('.inbox-open').find((b) => b.text().includes(h.brand))!
    await row.trigger('click')
    await nextTick()
    await wrapper.find('button.offer-sign').trigger('click')
    await nextTick()

    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    // The sentence really did grow – and then CAPPED: six named dates plus the term's end, with
    // the remaining ten counted in words rather than listed. A mutant that lists all sixteen fails
    // the reachability assertion below on this very mount.
    expect(card.textContent).toContain(h.brand)
    expect((card.textContent ?? '').match(/W\d+ '\d+/g) ?? []).toHaveLength(6 + 1)
    expect(card.textContent).toContain('10 more across the term')
    assertDismissReachable(card, dismiss, PHONE, "the capstone confirm (round 29 part four P6)")
    wrapper.unmount()
  })
})
