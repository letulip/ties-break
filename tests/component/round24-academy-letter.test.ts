// ROUND 24 #1 – THE SCHOLARSHIP HAS A PLACE TO GO, AND THE PLAYER CAN GET TO IT.
//
// The owner, 20.08: «сейчас как-то незаметно появляется один маленький попапчик сверху, который
// призывает изучить scholarship и кнопка dismiss. Я бы и рад изучить, да только далее не знаю где.»
//
// MOUNTED, NOT PINNED, per CLAUDE.md's own gotcha: the claim is that the inbox LISTS the letter and
// that opening the row RENDERS it, and neither of those is a fact about the source text. Every
// assertion below was mutation-verified – see the report for the arms.
//
// ⚠ THE FIXTURE IS A REAL WALKED CAREER FOR THE LIST, AND A HAND-BUILT LETTER FOR THE PAPER, and the
// split is deliberate. Whether the ENGINE writes these letters is the engine file's question and it
// is measured there against eight walked seasons. What is asked here is: given this letter, does the
// row say who wrote and what about, and does the sheet render the numbers off `terms`.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { useGameStore } from '../../src/stores/game'
import type { AcademyLetterTerms, Offer, Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

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

function letter(terms: Partial<AcademyLetterTerms>, week = 104): Offer {
  return {
    id: `academy-${Math.floor(week / 52)}`,
    kind: 'academy',
    week,
    deadlineWeek: week,
    state: 'info',
    terms: { notice: 'arrived', sharePct: 33, sinceWeek: 52, seasonIndex: Math.floor(week / 52), ...terms },
  } as unknown as Offer
}

const ARRIVED = letter({ notice: 'arrived', sharePct: 33, sinceWeek: 52, grantCents: 39_600 }, 52)
const REVIEWED = letter({ notice: 'reviewed', sharePct: 41, wasPct: 33, sinceWeek: 52 }, 104)
const ENDED = letter({ notice: 'ended', sharePct: 0, reason: 'aged-out', sinceWeek: 52 }, 312)

describe('OfferLetter – the academy has its own sheet', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the arrival states the share, and the grant in real money', () => {
    const w = mount(OfferLetter, { props: { offer: ARRIVED, week: 52 } as never })
    expect(w.text()).toContain('we would like to take her on')
    expect(w.text()).toContain('33%')
    // Money is in cents in the engine and formatted once, at the edge: 39_600 is $396.00.
    expect(w.text()).toContain('$396')
    expect(w.text()).toContain('The academy')
    // A notice, not a proposal: no decision may be offered on this paper.
    expect(w.text()).not.toContain('Sign')
    expect(w.text()).not.toContain('Refuse')
    w.unmount()
  })

  it('a review carries BOTH ends of the move and names its direction', () => {
    const up = mount(OfferLetter, { props: { offer: REVIEWED, week: 104 } as never })
    expect(up.text()).toContain('goes up')
    expect(up.text()).toContain('41%')
    expect(up.text()).toContain('33%')
    up.unmount()

    const down = mount(OfferLetter, {
      props: { offer: letter({ notice: 'reviewed', sharePct: 12, wasPct: 33 }, 156), week: 156 } as never,
    })
    expect(down.text()).toContain('comes down')
    expect(down.text()).not.toContain('goes up')
    down.unmount()
  })

  it('the three endings are three different stories, and none of them tells the player off', () => {
    const bodies = (['aged-out', 'stopped-playing', 'not-this-year'] as const).map((reason) => {
      const w = mount(OfferLetter, {
        props: { offer: letter({ notice: 'ended', sharePct: 0, reason }, 312), week: 312 } as never,
      })
      const text = w.text()
      w.unmount()
      return text
    })
    expect(new Set(bodies).size).toBe(3)
    expect(bodies[0]).toContain('grown out of the age')
    expect(bodies[1]).toContain('too few tournaments')
    expect(bodies[2]).toContain('about our list rather than about her')
    // ⚠ ROUND-23 #2'S LESSON, HELD HERE TOO: what survives is said as a PRESENCE, never as a denial
    // of something nobody proposed («Nothing is owed and nothing is taken back» is what that item
    // had to unwrite).
    for (const body of bodies) {
      expect(body).toContain('The kit she has is hers')
      expect(body).not.toContain('Nothing is taken back')
    }
  })
})

describe('InboxSheet – the letter is in the list, and the row opens it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  /** A real career's snapshot, with the academy's post added to the letters it already has. */
  function mountInbox(offers: Offer[]) {
    const base: Snapshot = careerSnapshot(8, 'r24-inbox')
    const store = useGameStore()
    store.snapshot = { ...base, offers: [...base.offers, ...offers] }
    return mount(InboxSheet, { global: { stubs: { teleport: true } } })
  }

  it('all three notices are listed, signed by the academy, and each subject says which it is', () => {
    const wrapper = mountInbox([ARRIVED, REVIEWED, ENDED])
    const rows = wrapper.findAll('.inbox-row')
    const text = rows.map((r) => r.text())
    expect(text.filter((t) => t.includes('The academy'))).toHaveLength(3)
    expect(text.some((t) => t.includes('A scholarship – 33% of her travel'))).toBe(true)
    expect(text.some((t) => t.includes('Scholarship review – 41% of her travel'))).toBe(true)
    expect(text.some((t) => t.includes('The scholarship has ended'))).toBe(true)
    // ⚠ AND IT IS NOT A DECISION. The inbox's accent pill is for letters still waiting on an answer;
    // an academy notice must never wear it, and `state: 'info'` is what keeps it off.
    expect(wrapper.text()).not.toContain('Needs an answer')
    wrapper.unmount()
  })

  it('...and clicking the row opens the letter he was told to go and read', async () => {
    const wrapper = mountInbox([ARRIVED])
    const row = wrapper.findAll('.inbox-open').find((b) => b.text().includes('The academy'))
    expect(row, 'the academy letter must have a row to press').toBeTruthy()
    await row!.trigger('click')
    await nextTick()
    // The list is gone and the paper is on screen, with the number he went looking for on it.
    expect(wrapper.findAll('.inbox-row')).toHaveLength(0)
    expect(wrapper.find('.offer-letter').exists()).toBe(true)
    expect(wrapper.text()).toContain('33%')
    expect(wrapper.text()).toContain('we would like to take her on')
    wrapper.unmount()
  })

  it('the newest post is the academy, so the mail cue has something to point at', async () => {
    // `newestLetterId` is the LAST element of `snapshot.offers` – the fact the bell's second dot
    // reads. It deliberately does not ask `state`, which is what lets an `info` notice announce
    // itself; this pins that an academy letter is a letter for that purpose.
    const { newestLetterId } = await import('../../src/composables/inboxCue')
    const base: Snapshot = careerSnapshot(8, 'r24-inbox')
    const snap: Snapshot = { ...base, offers: [...base.offers, ARRIVED] }
    expect(newestLetterId(snap)).toBe(ARRIVED.id)
  })
})
