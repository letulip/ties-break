// ⭐⭐⭐ ROUND 46 #9 + #10 – THE EPILOGUE'S RECKONING, MOUNTED.
//
// The owner finished a career holding $10M+ liquid, a $20M+ fund, houses, an academy and a brand,
// and this page told him «$13M won against $83M spent» and a best rank of #27 over a career that
// touched #17. Both numbers are the LAST page of the game, so both get a mounted net rather than a
// source pin – the engine arms live in `tests/round46-career-money.test.ts` and
// `tests/round46-best-rank.test.ts`, and these are about what the screen actually renders.
//
// ⚠ THE WORDS ARE HIS AND NOTHING HERE ASKS THEM TO CHANGE (invariant 4). «Won», «Spent»,
// «Seasons», «Best rank» and «Titles» are asserted present and unmoved; the two new rows are DRAFTS
// (docs/plans/life-wave-7-strings-2026-09.md, R46-1 / R46-2) and are asserted to be ABSENT on a
// career that has nothing for them to say – which is what keeps every existing career's page the
// page it already was.
//
// ⭐⭐⭐ RE-AIMED 18.09 BY RULING 2 OF THAT DAY, AND BY HIM RATHER THAN BY THIS FILE. R46-3 put the
// first label to him as a draft – «Won» prints `prizeCents`, which is only the family's HALF of the
// prize cheques – and he answered «да, пойдет». So the first label is now «The family's share»; the
// FIGURE under it did not move and neither did the other four. The paragraph above is left as
// written because it is the record of what was true before he ruled.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { formatCents } from '../../src/shared/money'
import { dynastyOf } from '../helpers/dynastyHandover'
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
    bestRankTrack: 'wta',
    titles: 9,
    oneMoreYearCount: 0,
    academy: null,
    lifetimeDeal: null,
    college: null,
    // ⚠ WAVE 10 T1 – the ending view carries the inheritance block on EVERY ending (his 20.09
    // ruling: the door never closes), so the type requires it here too. `dynastyOf`'s default is the
    // humblest block the engine can produce, so this fixture means exactly what it meant before.
    dynasty: dynastyOf(),
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

  it('⭐⭐⭐ RULING A, 18.09 – the family\'s portfolio gets its own row, and it renders on EVERY career', async () => {
    // «А отдельной строчкой напишем целиковый срез портфеля семьи по деньгам в кошельке и всем
    // магазине на круг» – the wallet plus the shelf at value, folded engine-side by `careerMoney`.
    patch(endingView({}, { holdingsCents: 2_600_000_00, portfolioCents: 2_812_340_00 }))
    const w = mount(EndingScreen)
    await lastPage(w)
    const totals = w.find('.ending-totals')
    // ⚠⚠ THE ARM. Delete the row from the template and this goes red on its first assertion –
    // measured 18.09, RED [1 test].
    expect(totals.text(), 'the drafted label – R46-7').toContain("Family's portfolio")
    expect(totals.text(), 'and the engine\'s own figure, not a sum done in the template').toContain(
      formatCents(2_812_340_00),
    )
    // ...and it sits between what the family still owns and the three counting rows, so the pins
    // below on his own five labels are untouched by it.
    const labels = w.findAll('.ending-totals dt').map((d) => d.text())
    expect(labels.indexOf("Family's portfolio")).toBeGreaterThan(labels.indexOf('Still owned'))
    expect(labels.indexOf("Family's portfolio")).toBeLessThan(labels.indexOf('Seasons'))
    w.unmount()

    // ⚠ AND IT IS NOT CONDITIONAL, unlike the two draft rows above it. A family that owns nothing
    // still HAS a portfolio – it is the wallet – and a row that vanished on a poor career would
    // answer his question for rich careers only.
    setActivePinia(createPinia())
    patch(endingView({}, { portfolioCents: 1234_00 }))
    const w2 = mount(EndingScreen)
    await lastPage(w2)
    expect(w2.find('.ending-totals').text(), 'the poor career gets the row too').toContain("Family's portfolio")
    w2.unmount()
  })

  it('⚠ an EIGHTH row cannot push the page sideways – the property the new row leans on', async () => {
    // ⚠⚠ THE ONE LAYOUT CLAIM RULING A MAKES, CHECKED RATHER THAN ASSUMED. The epilogue's `<dl>` now
    // carries up to eight cells and the longest label on it is the new one. What makes that safe is
    // not taste, it is two declarations: the grid AUTO-FITS (so cells wrap to a new line instead of
    // narrowing past 84px) and the label may WRAP (so a long word gives ground vertically). The page
    // itself scrolls – `.ending` is `overflow-y: auto` – so vertical growth is free. ⚠ This is NOT
    // the dialog rule: the epilogue is a scrolling takeover, not a blocking overlay with no
    // max-height, which is the shape that ruling exists for.
    // ⚠⚠ THE ARM. Put `white-space: nowrap` on `.ending-totals dt`, or pin the grid to a fixed column
    // count, and this goes red – measured 18.09, RED [1 test, 1 assertion each].
    patch(endingView({}, { herAccountCents: 900_000_00, holdingsCents: 2_600_000_00, portfolioCents: 2_812_340_00 }))
    const w = mount(EndingScreen, { attachTo: document.body })
    await lastPage(w)
    const dl = document.querySelector('.ending-totals')!
    expect(dl.querySelectorAll('dt')).toHaveLength(8)
    expect(getComputedStyle(dl).gridTemplateColumns, 'the cells wrap rather than narrow').toContain('auto-fit')
    const label = [...dl.querySelectorAll('dt')].find((d) => d.textContent === "Family's portfolio")!
    expect(getComputedStyle(label).whiteSpace, 'the longest label may give ground vertically').not.toBe('nowrap')
    w.unmount()
    document.body.innerHTML = ''
  })

  it('⚠ the five labels are all still on the page, in his order, and the first is the one HE renamed', async () => {
    patch(endingView({}, { herAccountCents: 900_000_00, holdingsCents: 2_600_000_00 }))
    const w = mount(EndingScreen)
    await lastPage(w)
    const labels = w.findAll('.ending-totals dt').map((d) => d.text())
    // ⭐⭐⭐ RULING 2, 18.09 («да, пойдет» on draft R46-3) – and this is the assertion that moved with
    // it. ⚠ THE PIN ASSERTS WHAT THE STRING IS, so a pin moving is exactly what a ruled rename looks
    // like and is the ONE diff no test can catch on its own: it is the dated note beside it that
    // makes the move accountable, not the green run. ⚠⚠ THE ARM, for what the pin CAN do – put
    // `Won` back in the template and this goes red: measured 18.09, RED [1 test].
    //
    // ⭐ RE-AIMED LATER THE SAME DAY BY RULING B, AND AGAIN BY HIM RATHER THAN BY THIS FILE:
    // «давай Family's share напишем?» – the article goes. The paragraph above is left as written
    // because it is the record of the first spelling; this is the second, and the figure under the
    // label has still never moved. ⚠⚠ THE ARM. Put the article back and this goes red: measured
    // 18.09, RED [1 test, 1 assertion].
    expect(labels[0], 'his own spelling, one word shorter than the one he ruled this morning').toBe("Family's share")
    expect(labels, 'and nothing else acquired the old word').not.toContain('Won')
    expect(labels[1]).toBe('Spent')
    expect(labels.slice(-3)).toEqual(['Seasons', 'Best rank', 'Titles'])
    w.unmount()
  })
})

describe('⭐⭐ round 46 #10 – the best rank the epilogue prints', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ prints the rank the engine hands it, and a dash when she never held one', async () => {
    patch(endingView({ bestRank: 17, bestRankTrack: 'wta' }))
    const w = mount(EndingScreen)
    await lastPage(w)
    expect(w.find('.ending-totals').text()).toContain('#17')
    w.unmount()

    setActivePinia(createPinia())
    patch(endingView({ bestRank: null, bestRankTrack: null }))
    const w2 = mount(EndingScreen)
    await lastPage(w2)
    const row = w2.findAll('.ending-totals div').find((d) => d.text().includes('Best rank'))
    expect(row?.text(), 'a rank she never had is a dash, never a number').toContain('–')
    w2.unmount()
  })
})
