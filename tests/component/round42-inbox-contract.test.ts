// =================================================================================================
// ⭐⭐⭐ ROUND 42 #39a – THE INBOX SAYS WHAT IS RUNNING, AND UNTIL WHEN
// =================================================================================================
//
// THE OWNER, 15.09, on four winters in which no kit letter arrived at all: «я вообще ничего не понял.
// Почему остальные контракты работают корректно, а этот нет? Это надо починить.» (His words are here
// and not in a template: tests/round13-nav.test.ts bans Cyrillic inside one.)
//
// ⚠ WHAT THE MEASUREMENT SAID, because this file exists for the SECOND finding rather than the
// first. Nothing misbehaves per contract: a signed kit deal turns away only kit letters, advertising
// is a separate family with its own slots, and every family runs one live deal at a time. What bit
// him is structural – `rungTurnedAway` lets only a STRICTLY stronger rung interrupt a running deal,
// and at the top rung there is no stronger rung, so an `icon` contract means four winters of silence
// BY CONSTRUCTION. Three of his four empty winters are exactly that.
//
// ⚠⚠ SO THIS IS LEGIBILITY AND NOT A MECHANIC, AND THE MECHANIC HALF IS CLOSED BY HIS OWN RULING.
// #39b proposed letting a rival court her in a term's last season; he refused it (item 45, 15.09:
// «кончился контракт - можно свежие слать»), so the post really does stay shut for the term except
// to a bigger rung. All that changes here is that the screen says what a player could not otherwise
// find out: she is under contract, and until when.
//
// ⚠ THE SENTENCE IS A DRAFT and the round's handoff reports it verbatim for his read. What this file
// pins is its FACTS – the brand, the end week and the gate – each read off the engine rather than
// typed, so his rewording moves the screen and this file together.
//
// ⚠⚠ MUTATION ARMS, each applied alone, run, and reverted (control: this file 5/5 green, plus
// round29-inbox-subjects 6/6 and round14-group-c). The counts are MEASURED:
//   ARM A  `contractNote` returns '' always – the shipped defect, the silence he reported.
//          **3 RED** here; the two sibling inbox files stay green, which is what says the line is
//          new surface rather than a change to the list.
//   ARM B  the note reads `dealUntilWeek(deal)` instead of the signed `untilWeek` – a plausible
//          re-derivation of the same number from the paper's `seasons`.
//          **1 RED** here (the end-week case), alone.
//   ARM C  the gate drops `activeKitDeal`'s `untilWeek` term, i.e. a lapsed contract keeps talking.
//          **1 RED** here (the after-it-ends case), alone.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN SHEET. `.hint` and `.inbox-contract` live in src/style.css and in the SFC, and
// without it every computed value in the sweep below is the initial one – a fit measured against no
// stylesheet is a measurement of nothing (round 21 #11's own note).
import '../../src/style.css'
import InboxSheet from '../../src/components/InboxSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { acceptOffer, createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { activeKitDeal, raiseKitOffers } from '../../src/engine/offers'
import { weekLabel } from '../../src/shared/dates'
// ⭐ HIS STANDING RULE OF 14.09 – the visual pass is a deliverable, at the wave gate's parity widths.
import { availableWidth, boxOf, setViewport, DESKTOP, PHONE, TABLET, type Viewport } from './fits'
import { DEFAULT_PROFILE, type KitOfferTerms, type Snapshot } from '../../src/shared/protocol'
import type { SponsorStanding } from '../../src/engine/offers'

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

const WIDE: Viewport = { width: 900, height: 900 }
const SWEEP: Viewport[] = [PHONE, TABLET, WIDE, DESKTOP]

/** The week the shop writes in – the sponsor window of the first season, as offers.test.ts uses it. */
const LETTER_WEEK = 49

/** A standing the local rungs clear – `tests/offers.test.ts`'s own `domestic` helper, verbatim, so
 *  the fixture is the one the sponsor suite already trusts. The letter is REAL: `raiseKitOffers` is
 *  the shipped producer and the roll is a separate question from the gate, so seeds are walked until
 *  one is written to rather than a letter being hand-built with terms this file chose. */
const domestic = (nationalRank: number): SponsorStanding => ({
  nationalRank,
  itfRank: 999,
  itfRanked: false,
  wtaRank: 999,
  wtaRanked: false,
})

/** A career with a kit contract SIGNED and running – the state his four winters were spent in. */
function underContract(seed: string): { world: WorldState; terms: KitOfferTerms; untilWeek: number } {
  for (let attempt = 0; attempt < 20; attempt++) {
    const world = createWorld(`${seed}-${attempt}`, DEFAULT_PROFILE)
    world.week = LETTER_WEEK
    const [offer] = raiseKitOffers({
      offers: world.offers,
      seed: world.seed,
      week: LETTER_WEEK,
      standing: domestic(1),
    })
    if (!offer) continue
    acceptOffer(world, offer.id)
    expect(offer.state, 'the fixture really signed a paper').toBe('signed')
    // ⚠ THE DEAL IS THE ENGINE'S OWN READ, not «the offer we just signed»: `activeKitDeal` is what
    // the screen asks, so the fixture and the screen agree about what running means.
    world.week = offer.untilWeek! - 1
    const deal = activeKitDeal(world.offers, world.week)
    expect(deal, 'and the engine says she is under it this week').toBeTruthy()
    return { world, terms: offer.terms as KitOfferTerms, untilWeek: offer.untilWeek! }
  }
  throw new Error(`no seed near "${seed}" was written to in 20 tries – the offer roll has broken`)
}

function noteOn(snapshot: Snapshot): string | null {
  useGameStore().snapshot = snapshot
  const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
  const el = wrapper.find('.inbox-contract')
  const text = el.exists() ? el.text().replace(/\s+/g, ' ').trim() : null
  wrapper.unmount()
  return text
}

describe('round 42 #39a – a quiet winter is explained instead of mysterious', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⭐⭐⭐ the inbox names the brand she is under', () => {
    const { world, terms } = underContract('r42-39a-brand')
    const note = noteOn(toSnapshot(world))
    expect(note, 'the sheet draws the contract line at all').not.toBeNull()
    // ⚠ THE BRAND IS THE PAPER'S OWN, read off the terms rather than typed – a line naming the wrong
    // house would be worse than silence, which is the whole standard the subject lines are held to.
    expect(note, 'and it is the house that is actually dressing her').toContain(terms.brand)
  })

  it('⭐⭐⭐ ...and until WHEN, in the week the engine wrote onto the contract', () => {
    const { world, untilWeek } = underContract('r42-39a-until')
    const note = noteOn(toSnapshot(world))
    // ⚠ `offer.untilWeek` IS WHAT `signOffer` WROTE, and it is not the same number as a term
    // re-derived from `terms.seasons`: a deal signed inside a window is anchored on the season's own
    // end. The confirm dialog learnt this the hard way (`dealUntilWeek`'s note in InboxSheet), so the
    // line quotes the signed week and this asserts that it does.
    expect(note).toContain(weekLabel(untilWeek))
  })

  it('⭐⭐ it explains the silence WITHOUT over-claiming – only a bigger name can write', () => {
    // ⚠ THE CLAUSE IS CAREFUL AND THE CARE IS THE POINT. «Nobody writes while a deal runs» would be
    // FALSE at every rung but the last: round 29 part two #12 lets a strictly stronger rung interrupt
    // a running term, measured over 191 winters. So the sentence names the one thing that is true at
    // every rung, and at the top of the ladder – where there is no bigger name – it reads as his own
    // four winters without the screen having to know which rung she is on.
    const { world } = underContract('r42-39a-clause')
    const note = noteOn(toSnapshot(world)) ?? ''
    expect(note, 'the sentence says what a running deal does to the post').toContain('only a bigger name can write')
    expect(note.toLowerCase(), 'and never promises total silence').not.toContain('nobody')
    // Player copy: short dash only, plain ASCII (the module's own sweep, applied to a new sentence).
    expect(note).not.toContain('—')
    expect(note).toMatch(/^[\x20-\x7e–’']+$/)
  })

  it('⚠ SILENT when nobody is dressing her – before the first deal, and after one ends', () => {
    // The negative that makes the three arms above mean something: a line that were always drawn
    // would satisfy every «contains» assertion above and would be a lie for most of a career.
    const fresh = createWorld('r42-39a-nobody', DEFAULT_PROFILE)
    expect(activeKitDeal(fresh.offers, fresh.week), 'the control: she really is under nobody').toBeNull()
    expect(noteOn(toSnapshot(fresh)), 'no contract, no sentence').toBeNull()

    const { world, untilWeek } = underContract('r42-39a-lapsed')
    world.week = untilWeek + 1
    expect(activeKitDeal(world.offers, world.week), 'the term has run out').toBeNull()
    expect(noteOn(toSnapshot(world)), 'a lapsed contract stops talking').toBeNull()
  })

  it('⭐ THE LINE FITS at 375 / 768 / 900 / 1280 – his standing rule of 14.09', () => {
    // «визуальную проверку на всех экранах надо тоже заложить в билдера в спеку». A brand name plus a
    // week label plus a clause is longer than a phone's line, so what is measured is that it WRAPS as
    // prose rather than being cut, and that the block it makes has real height inside the room the
    // takeover leaves it. `fits.ts` is the instrument; happy-dom has no layout engine, so this is the
    // real cascade plus the repo's own wrap model, never an opinion about how it reads.
    const { world } = underContract('r42-39a-fits')
    const snap = toSnapshot(world)
    for (const vp of SWEEP) {
      setViewport(vp)
      useGameStore().snapshot = snap
      // ⚠ ATTACHED, because happy-dom computes nothing for a detached tree: `getComputedStyle` on an
      // unattached element returns empty strings, and a sweep reading those would measure zero and
      // pass for ever.
      const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } }, attachTo: document.body })
      const note = wrapper.find('.inbox-contract').element
      const cs = getComputedStyle(note)
      expect(cs.whiteSpace, `${vp.width}: the sentence is allowed to wrap`).not.toBe('nowrap')
      expect(cs.textOverflow, `${vp.width}: and is never cut`).not.toBe('ellipsis')
      const room = availableWidth(note, vp)
      const h = boxOf(note, room).h
      expect(room, `${vp.width}: the note has real room`).toBeGreaterThan(100)
      expect(h, `${vp.width}: and a rendered box inside it`).toBeGreaterThan(0)
      if (process.env.R42_SWEEP) {
        console.log(`SWEEP 39a-line ${vp.width}: room ${room.toFixed(1)}px, note box ${h.toFixed(1)}px`)
      }
      wrapper.unmount()
    }
    setViewport(DESKTOP)
  })

  it('⚠ AND IT IS AN EXPLANATION, NOT A LETTER – the list below it is untouched', () => {
    // The note sits above the post, in the app's `hint` register, and adds no row: a player counting
    // his letters must not find one more than the engine wrote.
    const { world } = underContract('r42-39a-rows')
    const snap = toSnapshot(world)
    useGameStore().snapshot = snap
    const wrapper = mount(InboxSheet, { global: { stubs: { teleport: true } } })
    expect(wrapper.findAll('.inbox-row').length, 'one row per letter the engine wrote').toBe(snap.offers.length)
    expect(wrapper.find('.inbox-contract').classes(), 'and the line is a hint, not a row').toContain('hint')
    wrapper.unmount()
  })
})
