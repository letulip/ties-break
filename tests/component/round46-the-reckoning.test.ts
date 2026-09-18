// ⭐⭐⭐ ROUND 46 #9 – THE EPILOGUE'S RECKONING, MOUNTED.
//
// The owner finished a career holding $10M+ liquid, a $20M+ fund, houses, an academy and a brand,
// and this page told him «$13M won against $83M spent». It is the LAST page of the game, so the
// figure gets a mounted net rather than a source pin – the engine arms live in
// `tests/round46-career-money.test.ts`, and this is about what the screen actually renders.
//
// ⚠ THE WORDS ARE HIS AND NOTHING HERE ASKS THEM TO CHANGE (invariant 4). «Won», «Spent»,
// «Seasons», «Best rank» and «Titles» are asserted present and unmoved; the two new rows are DRAFTS
// (docs/plans/life-wave-7-strings-2026-09.md, R46-1 / R46-2) and are asserted to be ABSENT on a
// career that has nothing for them to say – which is what keeps every existing career's page the
// page it already was.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { formatCents } from '../../src/shared/money'
import type { AlbumPage, CareerEndingType, CareerMoney, EndingView, Snapshot } from '../../src/shared/protocol'
import '../../src/style.css'

const TOTALS = { earnedCents: 4_000_000_00, spentCents: 3_000_000_00, prizeCents: 1_500_000_00, weeksLostToInjury: 0 }

function albumPage(slot: number): AlbumPage {
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
  }
}

function endingView(over: Partial<EndingView> = {}, money: Partial<CareerMoney> = {}): EndingView {
  return {
    ending: {
      type: 'natural' as CareerEndingType,
      week: 900,
      ageYears: 31,
      detail: 'she stopped at thirty-one',
      resumesWeek: null,
    },
    album: [1, 2, 3, 4, 5, 6, 7].map(albumPage),
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: TOTALS,
    money: moneyOf(TOTALS, money),
    seasonsPlayed: 15,
    bestRank: 17,
    titles: 9,
    oneMoreYearCount: 0,
    academy: null,
    lifetimeDeal: null,
    college: null,
    ...over,
  }
}

function patch(view: EndingView): void {
  useGameStore().$patch({
    snapshot: {
      ageYears: 31,
      week: 900,
      kidRank: 17,
      fundsCents: 1234_00,
      careerTotals: TOTALS,
      careerMoney: view.money,
      ending: view,
    } as unknown as Snapshot,
  })
}

/** The last page is where the totals live – turn to it. */
async function lastPage(w: ReturnType<typeof mount>): Promise<void> {
  for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
}

describe('⭐⭐⭐ round 46 #9 – what the epilogue prints for «Spent»', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ prints the money that LEFT, never the total that counts the family\'s own holdings', async () => {
    // A family that put $2,000,000 of its $3,000,000 outgoings into things it still owns.
    patch(endingView({}, { heldCents: 2_000_000_00, outlayCents: 1_000_000_00, holdingsCents: 2_600_000_00 }))
    const w = mount(EndingScreen)
    await lastPage(w)
    const totals = w.find('.ending-totals')
    expect(totals.text(), 'the label is his and does not move').toContain('Spent')
    // ⚠⚠ THE ARM. Point the template back at `view.totals.spentCents` and this pair flips: measured
    // 18.09, 1 of the 5 tests in this file goes red (this one, on both of its assertions).
    expect(totals.text(), 'what left for good').toContain(formatCents(1_000_000_00))
    expect(totals.text(), 'and not the gross that includes the fund and the house').not.toContain(
      formatCents(3_000_000_00),
    )
    w.unmount()
  })

  it('⭐⭐ names her own account and what the family still owns – the two figures the page never had', async () => {
    patch(
      endingView({}, { heldCents: 2_000_000_00, outlayCents: 1_000_000_00, holdingsCents: 2_600_000_00, herAccountCents: 900_000_00 }),
    )
    const w = mount(EndingScreen)
    await lastPage(w)
    const totals = w.find('.ending-totals')
    expect(totals.text()).toContain('Her account')
    expect(totals.text()).toContain(formatCents(900_000_00))
    expect(totals.text()).toContain('Still owned')
    expect(totals.text()).toContain(formatCents(2_600_000_00))
    w.unmount()
  })

  it('⚠ ...and says NOTHING about either on a career that owned nothing and was never paid a cheque of her own', async () => {
    patch(endingView())
    const w = mount(EndingScreen)
    await lastPage(w)
    const totals = w.find('.ending-totals')
    expect(totals.text(), 'no row about an account she has not got').not.toContain('Her account')
    expect(totals.text(), 'and none about holdings that do not exist').not.toContain('Still owned')
    // ...and «Spent» is the accumulator, unchanged, which is what every career before the shelf reads.
    expect(totals.text()).toContain(formatCents(TOTALS.spentCents))
    w.unmount()
  })

  it('⚠ the five labels the owner wrote are all still on the page, in his order', async () => {
    patch(endingView({}, { herAccountCents: 900_000_00, holdingsCents: 2_600_000_00 }))
    const w = mount(EndingScreen)
    await lastPage(w)
    const labels = w.findAll('.ending-totals dt').map((d) => d.text())
    expect(labels[0]).toBe('Won')
    expect(labels[1]).toBe('Spent')
    expect(labels.slice(-3)).toEqual(['Seasons', 'Best rank', 'Titles'])
    w.unmount()
  })
})
