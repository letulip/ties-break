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
import type { AdOfferTerms, Offer, Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

const AD = ECONOMY.advertising

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
    terms: { brand: AD.brand, cashCents: AD.cashCents, termWeeks: AD.termWeeks, ...terms },
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
    expect(text).toContain(AD.brand)
    // The fee, in real money, formatted once at the edge (cents in, dollars out).
    expect(text).toContain('$20,000')
    expect(text).toContain('paid the day this is signed')
    // The term, in a house's words rather than a numeral.
    expect(text).toContain('Twelve months')
    // ⚠ STEP 1'S WHOLE DEAL, SAID OUT LOUD: no consequence may go unstated, and here the
    // consequence IS that there is none.
    expect(text).toContain('Nothing else is asked of her')
    expect(text).toContain('nothing to pay back')
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
    const signedRunning = letter({ state: 'signed', decidedWeek: 300, fromWeek: 300, untilWeek: 351 })
    const running = mount(OfferLetter, { props: { offer: signedRunning, week: 320 } as never })
    expect(running.text()).toContain('the campaign runs to')
    expect(running.text()).toContain('fee is banked')
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
    const row = rows.map((r) => r.text()).find((t) => t.includes(AD.brand))
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
    const row = wrapper.findAll('.inbox-open').find((b) => b.text().includes(AD.brand))
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
    expect(text).toContain(`Sign with ${AD.brand}?`)
    expect(text).toContain('one-time fee')
    expect(text).toContain('paid to the family now')
    expect(text).toContain('This cannot be undone.')
    // ...and not the KIT confirm's sentence: the branch must not fall through to kit arithmetic.
    expect(text).not.toContain('tournaments a season')
    wrapper.unmount()
  })
})
