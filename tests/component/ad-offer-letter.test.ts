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
import { chooseShootWeeks } from '../../src/engine/offers'
import { weekLabel } from '../../src/shared/dates'
import type { AdOfferTerms, Offer, Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'
// ⚠ THE APP'S OWN STYLESHEET – without it `.dialog-card`'s height cap is not in the cascade and the
// fit measurement below is vacuous. Same reason r2-07-dialog-shell.test.ts imports it.
import '../../src/style.css'
import { assertDismissReachable, setViewport, PHONE } from './fits'

const AD = ECONOMY.advertising
/** ⚠ THE CATALOGUE BECAME A LADDER (round 29 part two #19/#20), so the five per-house numbers
 *  moved out of `ECONOMY.advertising` into `ECONOMY.advertising.houses`. Every claim in this
 *  file is about the rung that already shipped – Quiet Hour, $20,000, two shoot weeks – so it
 *  is REPOINTED and not re-aimed: `AD` still carries the mechanics every house shares (the age
 *  bar, the weekly chance, the decide weeks, the lead, the clash price) and `WATCH` carries
 *  that one house's own terms, which have not moved by a cent. */
const WATCH = ECONOMY.advertising.houses.watch

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
    expect(text).toContain('Two weeks of her season are shoot weeks')
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

describe('⭐⭐ OfferLetter – the LADDER on the paper (round 29 part two #19/#20)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ⚠ THE OPENING CLAUSE WAS HARD-CODED «We make watches» IN THE MARKUP while the catalogue had one
  // house. Three houses and a template that introduced all of them as watchmakers is the same class
  // of defect as a renewal that says «A kit deal for your daughter» – the letter would be false about
  // its own author. The clause now comes off the PAPER (`AdOfferTerms.trade`).
  it.each([['campaign'], ['house']] as const)('the %s rung`s letter says what THAT house makes and asks', (tier) => {
    const h = ECONOMY.advertising.houses[tier]
    const open = letter({}, { tier, brand: h.brand, trade: h.trade, cashCents: h.cashCents, shootCount: h.shootWeeksPerTerm })
    const w = mount(OfferLetter, { props: { offer: open, week: open.week } as never })
    const text = w.text()
    expect(text).toContain(h.trade)
    expect(text).toContain(h.brand)
    expect(text).not.toContain('We make watches')
    expect(text).toContain(`$${Math.round(h.cashCents / 100).toLocaleString('en-US')}`)
    // ...and the count in the house's own words, which now has to run to six.
    const word = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'][h.shootWeeksPerTerm]
    expect(text).toContain(`${word} weeks of her season are shoot weeks`)
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
  // control's box is inside a 375x667 viewport». Round 29 part two #19 lengthened this one – the ad
  // confirm names every shoot week the signature will choose, and the top rung asks SIX of them
  // where the shipped rung asked two, so the sentence grows by four dates. It is a BLOCKING overlay
  // and this is the failure mode round-20 #3 cost a career to: «a dialog grows by one honest
  // sentence at a time and nothing objects until it is taller than a phone».
  it('Rivelle`s six named weeks do not push the buttons off a 375x667 screen', async () => {
    setViewport(PHONE)
    const h = ECONOMY.advertising.houses.house
    const open = letter({}, { tier: 'house', brand: h.brand, trade: h.trade, cashCents: h.cashCents, shootCount: h.shootWeeksPerTerm })
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
    // The sentence really did grow: six dates on the paper, not two.
    expect(card.textContent).toContain(h.brand)
    expect((card.textContent ?? '').match(/W\d+ '\d+/g) ?? []).toHaveLength(h.shootWeeksPerTerm + 1)
    assertDismissReachable(card, dismiss, PHONE, "the six-shoot confirm (round 29 part two #19)")
    wrapper.unmount()
  })
})
