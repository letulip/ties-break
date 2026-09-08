// ⭐ ROUND 39 #3 – THE LIFETIME LETTER'S SURFACES, MOUNTED («А некоторые и пожизненно», owner 08.09
// «давай так попробуем, как ты предложил»).
//
// The engine half (gate, once-per-career, the for-ever window, the anniversaries, the epilogue
// fact) is tests/r39-term-ladder.test.ts against walked probes. What is asked HERE is what a player
// actually reads: the letter states a fee with no last year and asks no shoot weeks, the signed
// record says it never runs out, and the epilogue names the deal – with a CONTROL on an ordinary
// letter for every absence claim, so the v-if gating cannot rot silently.
//
// MOUNTED, NOT PINNED, per CLAUDE.md's own gotcha. All lifetime copy is DRAFT for the owner's
// review, like every new sentence in this wave; these arms pin what ships so a drive-by rewording
// is caught, not to freeze his wording decision.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OfferLetter from '../../src/components/OfferLetter.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { ECONOMY } from '../../src/engine/economy'
import { adLifetimeTerms } from '../../src/engine/offers'
import type { AlbumPage, CareerEndingType, EndingView, Offer, Snapshot } from '../../src/shared/protocol'
import '../../src/style.css'

const AD = ECONOMY.advertising

/** A lifetime letter as `raiseAdOffer` writes it – terms from the engine's own builder. */
function lifetimeLetter(overrides: Partial<Offer> = {}): Offer {
  const week = overrides.week ?? 700
  return {
    id: `ad-lifetime-${week}`,
    kind: 'ad',
    week,
    deadlineWeek: week + AD.decideWeeks - 1,
    state: 'open',
    terms: adLifetimeTerms('Baseline Athletic'),
    ...overrides,
  } as Offer
}

/** ...and an ordinary watches letter, the CONTROL for every absence claim below. */
function watchLetter(): Offer {
  const week = 700
  return {
    id: `ad-watches-${week}`,
    kind: 'ad',
    week,
    deadlineWeek: week + AD.decideWeeks - 1,
    state: 'open',
    terms: {
      category: 'watches',
      brand: AD.categories.watches.houses[0],
      trade: AD.categories.watches.trade,
      cashCents: AD.categories.watches.feeCentsByBand[4]!,
      termYears: 3,
      termWeeks: 156,
      shootCount: 2,
    },
  } as Offer
}

describe('OfferLetter – the lifetime paper', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ the open letter: a yearly fee with no last one, no shoot ask, and both answers', () => {
    const open = lifetimeLetter()
    const w = mount(OfferLetter, { props: { offer: open, week: open.week } as never })
    const text = w.text()
    expect(text).toContain('every year, for as long as she lives')
    expect(text).toContain('with no last one')
    expect(text).toContain('$2,500,000')
    expect(text).toContain('her name is with us for life')
    expect(text).toContain('one of these is ever written')
    // it asks NOTHING back – the shoot clause is not on this paper, and its own bound stands instead
    expect(text).not.toContain('shoot week')
    expect(text).toContain('Nothing is owed, ever')
    expect(text).toContain('the name she made is the whole of it')
    expect(text).toContain('Sign')
    expect(text).toContain('Refuse')
    w.unmount()
  })

  it('⚠ the CONTROL: an ordinary letter keeps its shoot clause and none of the lifetime sentences', () => {
    const w = mount(OfferLetter, { props: { offer: watchLetter(), week: 700 } as never })
    const text = w.text()
    expect(text).toContain('shoot weeks')
    expect(text).toContain('Beyond those weeks nothing is owed')
    expect(text).not.toContain('for as long as she lives')
    expect(text).not.toContain('Nothing is owed, ever')
    expect(text).not.toContain('for life')
    w.unmount()
  })

  it('⭐ signed, the record says it never runs out – whatever week reads it', () => {
    const signed = lifetimeLetter({ state: 'signed', decidedWeek: 700, fromWeek: 700 })
    // read DECADES past the signature: a finite paper would long have «run its course»
    const w = mount(OfferLetter, { props: { offer: signed, week: 700 + 30 * 52 } as never })
    expect(w.text()).toContain('it comes again every year, for life')
    expect(w.text()).not.toContain('run its course')
    expect(w.text()).not.toContain('runs to')
    w.unmount()
  })
})

// The epilogue line – the endings-ui fixture idiom, whole, so the album paging is the real one.
function albumPage(slot: number, over: Partial<AlbumPage> = {}): AlbumPage {
  return {
    slot,
    why: `why ${slot}`,
    caption: `caption ${slot}`,
    fact: `fact ${slot}`,
    week: 52 * slot,
    seasonIndex: slot,
    stage: 'teen',
    emotion: 'norm',
    empty: false,
    ...over,
  }
}

function endingView(type: CareerEndingType = 'natural', over: Partial<EndingView> = {}): EndingView {
  return {
    ending: { type, week: 900, ageYears: 31, detail: 'she stopped at thirty-one', resumesWeek: null },
    album: [1, 2, 3, 4, 5, 6, 7].map((s) => albumPage(s)),
    scroll: [{ seasonIndex: 0, year: 2031, ageYears: 14, rows: [{ week: 12, label: 'Title', detail: 'Local Open' }] }],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: { earnedCents: 100_00, spentCents: 50_000_00, prizeCents: 0, weeksLostToInjury: 0 },
    seasonsPlayed: 15,
    bestRank: 2,
    titles: 12,
    oneMoreYearCount: 0,
    academy: null,
    lifetimeDeal: null,
    college: null,
    ...over,
  }
}

function patchSnapshot(fields: Record<string, unknown>): void {
  const game = useGameStore()
  game.$patch({ snapshot: { ageYears: 31, week: 900, kidRank: 2, fundsCents: 1234_00, careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 }, ...fields } as unknown as Snapshot })
}

describe('EndingScreen – the lifetime deal survives into the epilogue', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ the last page names the deal – brand and yearly fee, off the engine\'s facts', async () => {
    patchSnapshot({
      ending: endingView('natural', { lifetimeDeal: { brand: 'Baseline Athletic', cashCents: AD.lifetime.cashCents } }),
    })
    const w = mount(EndingScreen)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).toContain('The Baseline Athletic deal never ran out – $2,500,000 a year, for life.')
    w.unmount()
  })

  it('⚠ and no deal is NO line – the null arm every other epilogue fixture already carries', async () => {
    patchSnapshot({ ending: endingView('natural') })
    const w = mount(EndingScreen)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).not.toContain('never ran out')
    expect(w.text()).not.toContain('for life')
    w.unmount()
  })
})
