// W2-ENDINGS – the epilogue and the two blocking questions, MOUNTED.
//
// Mounted rather than source-pinned on purpose (CLAUDE.md's own gotcha: "prefer a mounted test to a
// source pin"). What these assert is behaviour the album cannot be refactored out of: seven pages
// turned one at a time, the selection rule visible on every one of them, the caption on the
// polaroid's own lip, and an empty slot 3 that says the money never came without softening it.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { useGameStore } from '../../src/stores/game'
import type { AlbumPage, CareerEndingType, EndingView, Snapshot } from '../../src/shared/protocol'

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

function endingView(type: CareerEndingType = 'stopped', over: Partial<EndingView> = {}): EndingView {
  return {
    ending: { type, week: 265, ageYears: 19, detail: 'she stopped at nineteen', resumesWeek: null },
    album: [1, 2, 3, 4, 5, 6, 7].map((s) =>
      s === 3 ? albumPage(3, { empty: true, fact: null, week: null, why: 'The first cheque – there was never one' }) : albumPage(s),
    ),
    scroll: [
      { seasonIndex: 0, year: 2031, ageYears: 14, rows: [{ week: 12, label: 'Title', detail: 'Local Open' }] },
    ],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: { earnedCents: 100_00, spentCents: 50_000_00, prizeCents: 0 },
    seasonsPlayed: 5,
    bestRank: 88,
    titles: 2,
    oneMoreYearCount: 0,
    ...over,
  }
}

function patchSnapshot(fields: Record<string, unknown>): void {
  const game = useGameStore()
  game.$patch({ snapshot: { ageYears: 19, week: 265, kidRank: 88, fundsCents: 1234_00, careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 }, ...fields } as unknown as Snapshot })
}

describe('the album', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows ONE page at a time, and turns', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    expect(w.findAll('.album-page')).toHaveLength(1)
    expect(w.text()).toContain('why 1')
    expect(w.text()).toContain('1 / 7')
    await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).toContain('why 2')
    expect(w.text()).not.toContain('why 1')
    w.unmount()
  })

  it('⚠ the caption is ON THE POLAROID, in the handwriting face – the owner asked for it there', () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    const caption = w.find('.tb-polaroid .tb-polaroid-caption')
    expect(caption.exists()).toBe(true)
    expect(caption.text()).toBe('caption 1')
    w.unmount()
  })

  it('⚠ the selection rule is on EVERY page, empty ones included', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    for (let i = 0; i < 7; i++) {
      expect(w.find('.album-why').text().length).toBeGreaterThan(0)
      if (i < 6) await w.findAll('.album-arrow')[1].trigger('click')
    }
    w.unmount()
  })

  it('⚠ slot 3 can be EMPTY, and it says so with no fact and no consolation', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    await w.findAll('.album-arrow')[1].trigger('click')
    await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).toContain('there was never one')
    expect(w.find('.album-fact').exists()).toBe(false)
    expect(w.find('.album-when').exists()).toBe(false)
    w.unmount()
  })

  it('the hand-off is an OFFER on the last page, and the record is reachable from it', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.find('.ending-foot').exists()).toBe(true)
    expect(w.text()).toContain('Raise another')
    await w.find('.ending-link').trigger('click')
    expect(w.text()).toContain('The whole record')
    expect(w.text()).toContain('Local Open')
    w.unmount()
  })

  it('⚠ COLLEGE offers four years instead of a new career – the only ending that resumes', async () => {
    patchSnapshot({
      ending: endingView('college', {
        ending: { type: 'college', week: 265, ageYears: 19, detail: 'x', resumesWeek: 473 },
        handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 473, resumesAgeYears: 23 },
      }),
    })
    const w = mount(EndingScreen)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).toContain('Four years later')
    expect(w.text()).not.toContain('Raise another')
    w.unmount()
  })

  it('renders for the nineteen-year-old who never turned pro – seven pages, two of them empty', () => {
    patchSnapshot({
      ending: endingView('stopped', {
        album: [1, 2, 3, 4, 5, 6, 7].map((s) =>
          s === 3 || s === 6 ? albumPage(s, { empty: true, fact: null, week: null }) : albumPage(s),
        ),
        totals: { earnedCents: 0, spentCents: 41_000_00, prizeCents: 0 },
      }),
    })
    const w = mount(EndingScreen)
    expect(w.findAll('.album-dots i')).toHaveLength(7)
    expect(w.findAll('.album-dots i.off')).toHaveLength(2)
    w.unmount()
  })
})

describe('the fork at nineteen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('offers three answers and has no way out that is not one of them', () => {
    patchSnapshot({ fork: { askedWeek: 265, ageYears: 19 } })
    const w = mount(ForkDialog)
    const answers = w.findAll('.fork-answer')
    expect(answers).toHaveLength(3)
    expect(w.text()).toContain('Turn professional')
    expect(w.text()).toContain('Take the scholarship')
    expect(w.text()).toContain('Stop here')
    // ⚠ NO PRIMARY. «Stop» must be able to be the right answer, so the card may not style one of
    // them as the correct one - all three carry the same class and none is a PrimaryPill.
    expect(w.findAll('.tb-pill')).toHaveLength(0)
    w.unmount()
  })

  it('an answer is a command, and it is the only exit', async () => {
    patchSnapshot({ fork: { askedWeek: 265, ageYears: 19 } })
    const game = useGameStore()
    const spy = vi.spyOn(game, 'answerFork').mockResolvedValue(undefined)
    const w = mount(ForkDialog)
    await w.findAll('.fork-answer')[2].trigger('click')
    expect(spy).toHaveBeenCalledWith('stop')
    w.unmount()
  })
})

describe('the natural end', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('from 29 she may always refuse', () => {
    patchSnapshot({ ageYears: 30, retirementOffer: { askedWeek: 900, seasonIndex: 16, reason: 'age', final: false } })
    const w = mount(RetirementDialog)
    expect(w.findAll('.retire-answer')).toHaveLength(2)
    expect(w.text()).toContain('One more year')
    w.unmount()
  })

  it('⚠ at 38 the LAST offer is made and taken – one button, and the copy says the question ran out', () => {
    patchSnapshot({ ageYears: 38, retirementOffer: { askedWeek: 1250, seasonIndex: 24, reason: 'age', final: true } })
    const w = mount(RetirementDialog)
    expect(w.findAll('.retire-answer')).toHaveLength(1)
    expect(w.text()).toContain('Nobody is going to ask her again')
    // It must NOT read as a rule that retires her.
    expect(w.text().toLowerCase()).not.toContain('you must')
    w.unmount()
  })

  it('the plateau is the same offer asked early, and the card says which reading it was', () => {
    patchSnapshot({ ageYears: 26, retirementOffer: { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false } })
    const w = mount(RetirementDialog)
    expect(w.text()).toContain('the table has not moved')
    expect(w.findAll('.retire-answer')).toHaveLength(2)
    w.unmount()
  })
})
