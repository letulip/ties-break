// ⭐⭐⭐ ROUND 47 B1 – THE FIGURES ON THE LAST PAGE, MOUNTED (06.10; items 1-7 and 12 of docs/rounds/round-47.md).
//
// The owner played a twenty-season career to its end and sent the last page back with a screenshot and twelve
// asks about it. These arms are the MOUNTED half of the answer – what the screen actually renders, at the widths
// a phone has – and the engine half is `tests/round46-career-money.test.ts` (the round-47 describe at its end).
// His words are quoted on the ledger; a `.vue` file carries no Cyrillic, so this file paraphrases them too.
//
// ⚠ THE LABELS ARE HIS AND NOTHING HERE ASKS ONE TO CHANGE (invariant 4): every arm asserts the label strings as
// they were. What moved is the NUMBER's form, size, face and place.
//
// ⭐⭐⭐ RE-AIMED 07.10 BY HIS ROUND 48 (docs/rounds/round-48.md) – AND BY HIM, NOT BY THIS FILE. The paragraph above is
// the record of round 47, where «every arm asserts the label strings as they were» was true. Since then: #3 – his
// second ruling of 07.10 (docs/decisions.md, 07.10 second batch) removed the «Family's share» row and renamed
// «Spent» to «Tennis & trips», leaving three money rows; #4 – the page line reads «You said one more year N times.»;
// #6 – the two doors stand in ONE ROW inside `.ending-doors`. Each arm that moved says so beside it, with the date.
// A pin asserts what the string IS, so a moved pin is exactly what a ruled change looks like and the dated note is
// the only thing that makes it accountable. The new claims live in `tests/component/r48-b1-ending-page.test.ts`.
//
// ⚠ `setViewport` RUNS BEFORE THE MOUNT – happy-dom caches a media query on its first computed-style read, so a late
// call would measure the desktop column and the case could not redden (CLAUDE.md, the phone law).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { formatCentsCompact } from '../../src/shared/money'
import {
  buyAsset,
  closeTournament,
  createWorld,
  sellAsset,
  skipTournament,
  tickWeek,
  type WorldState,
} from '../../src/engine/world'
import { careerMoney } from '../../src/engine/world/reckoning'
import { rngFromSeed } from '../../src/engine/rng'
import { NARROW_PHONE, PHONE, assertDismissReachable, availableWidth, demandedWidth, measureDialog, setViewport } from './fits'
import type { AlbumPage, CareerEndingType, CareerMoney, EndingView, Snapshot } from '../../src/shared/protocol'
import '../../src/style.css'

const TOTALS = { earnedCents: 4_000_000_00, spentCents: 3_000_000_00, prizeCents: 1_500_000_00, weeksLostToInjury: 0 }
const WIDTHS = [NARROW_PHONE.width, PHONE.width, 430]

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
    ending: { type: 'natural' as CareerEndingType, week: 900, ageYears: 31, detail: 'she stopped', resumesWeek: null },
    closing: albumPage(7),
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: TOTALS,
    money: moneyOf(TOTALS, money),
    seasonsPlayed: 20,
    bestRank: 1,
    bestRankTrack: 'wta',
    titles: 127,
    oneMoreYearCount: 5,
    academy: null,
    lifetimeDeal: null,
    college: null,
    dynasty: dynastyOf(),
    ...over,
  }
}

function patch(view: EndingView): void {
  useGameStore().$patch({
    snapshot: {
      ageYears: 31,
      week: 900,
      kidRank: 1,
      fundsCents: 1234_00,
      careerTotals: TOTALS,
      careerMoney: view.money,
      ending: view,
    } as unknown as Snapshot,
  })
}

/** Mounted ATTACHED, because happy-dom resolves the stylesheet rules only for connected nodes. */
function mountEnding(view: EndingView = endingView()) {
  patch(view)
  return mount(EndingScreen, { attachTo: document.body })
}

const px = (v: string): number => Number.parseFloat(v)

describe('⭐⭐⭐ round 47 #1 – the last page has no panel behind it, and the content takes the width the panel held', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`⭐ at ${vp.width}px the section opts out of the global panel – no padding, no panel, the takeover's ground stays`, () => {
      setViewport(vp)
      const w = mountEnding()
      const takeover = w.find('.ending').element
      const section = w.find('.ending-album').element
      const cs = getComputedStyle(section)
      // ⚠⚠ THE ARM. Take `bare` off the section (the global `section` rule paints it as a panel with 16px of
      // padding and a 1px line again) and the first three lines go red: measured 06.10, RED [1 case per width].
      // Before this item the column at 375 was 309px (375 - 32 gutter - 34 panel); it is 343 now.
      expect(section.classList.contains('bare'), 'the existing opt-out, not a second panel reset').toBe(true)
      expect(px(cs.paddingLeft), 'no padding on the left').toBe(0)
      expect(px(cs.paddingRight), 'no padding on the right').toBe(0)
      expect(availableWidth(w.find('.ending-totals').element, vp), `the figure column at ${vp.width}px`).toBeGreaterThanOrEqual(
        vp.width - 32,
      )
      // ...and the screen KEEPS its own ground and its own takeover shape: nothing but the panel left.
      const ground = getComputedStyle(takeover)
      expect(`${ground.background} ${ground.backgroundImage}`, 'the takeover paints its own ground').toMatch(/celebration-bg|gradient/)
      expect(ground.position).toBe('fixed')
      w.unmount()
    })
  }
})

describe('⭐⭐⭐ round 47 #2 – every money figure of a million or more is the compact form', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  // ⭐⭐⭐ RE-AIMED 07.10 BY HIS ROUND 48 #3 (his second ruling of that day, docs/decisions.md 07.10 second batch): the
  // title read «$40.6M, $254.4M, $321.1M, $269.5M» and the first of those was the «Family's share» row's figure, which
  // left the page. The fixture STILL poses it (40,563,980) – so the absence below is a real claim and not an empty one.
  it('⭐⭐⭐ his own career, figure by figure: $254.4M, $321.1M, $269.5M – and not one long form', () => {
    // His measured figures (week 1037, the career he sent): the family's share 40,563,980, her account 321,120,108 and
    // the portfolio 269,490,541 are as the engine printed them for that save. «Spent» (now «Tennis & trips», 07.10) is
    // posed at the PRE-fix 254,383,557 on purpose – this arm is about the FORM of a big number; the engine fold's own
    // figure for that save ($16.5M after the fix) is item 3's arm below.
    const w = mountEnding(
      endingView(
        {},
        { prizeCents: 40_563_980_00, outlayCents: 254_383_557_00, herAccountCents: 321_120_108_00, portfolioCents: 269_490_541_00 },
      ),
    )
    const text = w.find('.ending-totals').text()
    // ⚠⚠ THE ARM. Print \`formatCents\` (the long form) in the template and every line below goes red: measured
    // 06.10, RED [1 test, 8 assertions]. (That count is the 06.10 shape; since 07.10 it is three compact lines and four
    // long-form ones, and the arm still reddens on the first.)
    for (const compact of ['$254.4M', '$321.1M', '$269.5M']) expect(text).toContain(compact)
    // ⭐ RE-AIMED 07.10: the family's share figure is ABSENT now, not present – the row is gone from the page.
    expect(text, 'the removed «Family\'s share» row\'s figure is not on the page').not.toContain('$40.6M')
    for (const long of ['40,563,980', '254,383,557', '321,120,108', '269,490,541']) expect(text).not.toContain(long)
    // The labels. ⭐ RE-AIMED 07.10 (round 48 #3): «Family's share» left and «Spent» became «Tennis & trips»; the other
    // four are byte-identical. It read ["Family's share", 'Spent', 'Her account', "Family's portfolio", 'Best rank', 'Titles',
    // 'Seasons'] here, and the order of what remains is his: the tennis row, the portfolio, then her account last.
    const labels = w.findAll('.ending-totals dt').map((d) => d.text())
    expect(labels).toEqual(['Tennis & trips', "Family's portfolio", 'Her account', 'Best rank', 'Titles', 'Seasons'])
    w.unmount()
  })

  it('⭐ below a million the page reads exactly what it always read, and the boundary is the helper\'s own', () => {
    // ⭐ RE-AIMED 07.10 (round 48 #3): the $735,472 used to be posed as the family's PRIZE share, whose row left the page,
    // so it is posed as her account now – a row that is still there – and the arm keeps exercising the long form.
    const w = mountEnding(
      endingView({}, { prizeCents: 0, outlayCents: 999_999_00, herAccountCents: 735_472_00, portfolioCents: 1_000_000_00 }),
    )
    const text = w.find('.ending-totals').text()
    expect(text).toContain('$735,472')
    expect(text).toContain('$999,999')
    expect(text, 'exactly one million is the first compact figure').toContain(formatCentsCompact(1_000_000_00))
    expect(text).toContain('$1.0M')
    w.unmount()
  })

  it('⭐ the money inside the notes is compact too – the academy\'s weekly income and the lifetime deal', () => {
    const w = mountEnding(
      endingView({
        academy: { stagesBuilt: 4, totalStages: 4, weeklyIncomeCents: 1_240_000_00 } as never,
        lifetimeDeal: { brand: 'Baseline Athletic', cashCents: 2_500_000_00 } as never,
      }),
    )
    const notes = w.findAll('.ending-note').map((n) => n.text())
    expect(notes.join(' | ')).toContain('it earns $1.2M a week')
    expect(notes.join(' | ')).toContain('The Baseline Athletic deal never ran out – $2.5M a year, for life.')
    // ⭐ RE-AIMED 07.10 BY HIS ROUND 48 #4: it read «She said one more year 5 times.» – and it was not her who said it, it was
    // the parent who proposed it. The sentence is the draft R47-S4 of round 47's ledger, and the pluralisation is as it was.
    expect(notes.join(' | ')).toContain('You said one more year 5 times.')
    w.unmount()
  })
})

// ---- #3: the page prints the engine's figure ----------------------------------------------------------
function walkedCareer(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

// ⭐⭐⭐ RE-AIMED 07.10 BY HIS ROUND 48 #3: the label this describe is about is «Tennis & trips» now – he renamed «Spent» in
// his second ruling of that day (docs/decisions.md, 07.10 second batch). The FIGURE under it is exactly the one round 47
// #3 repaired (`careerMoney`'s `outlayCents`) and the arm below is unchanged except for the label it looks the row up by.
describe('⭐⭐⭐ round 47 #3 – «Spent» (now «Tennis & trips», 07.10) is the engine\'s tennis figure, not the gross the fund round trips inflate', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ a family that used the fund as a till: the screen prints `careerMoney`\'s outlay, and not the gross', () => {
    const world = walkedCareer('r47-b1-parity', 30)
    world.fundsCents += 20_000_000_00
    buyAsset(world, 'index-fund', 5_000_000_00)
    sellAsset(world, 'index-fund', 2_000_000_00)
    const money = careerMoney(world)
    const gross = money.spentCents - money.heldCents - money.upkeepCents
    expect(gross - money.outlayCents, 'the posed round trip is exactly what the pre-fix reading overstated').toBe(2_000_000_00)

    const w = mountEnding(endingView({}, money))
    // ⭐ RE-AIMED 07.10 (round 48 #3): the row is found by its NEW label, «Tennis & trips»; it was «Spent».
    const spent = w.findAll('.ending-money > div').find((row) => row.text().startsWith('Tennis & trips'))!
    // ⚠⚠ THE ARM (the screen half): point the template at \`view.totals.spentCents\` and this goes red – the
    // fixture's totals say $3.0M. ⚠⚠ THE ARM (the engine half) is in tests/round46-career-money.test.ts: drop
    // \`- soldCostCents\` from the fold and the engine figure moves by $2,000,000 and so does this one.
    expect(spent.text(), 'the page prints the engine\'s figure, through the compact form').toBe(
      `Tennis & trips${formatCentsCompact(money.outlayCents)}`,
    )
    expect(spent.text(), 'and not the gross the round trip inflated').not.toBe(`Tennis & trips${formatCentsCompact(gross)}`)
    w.unmount()
  })
})

describe('⭐⭐⭐ round 47 #4/#5/#7 – one grid, two shapes, and every figure is Sora, bold and larger', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ every figure is the display face, bold, and larger than the 16px it was', () => {
    const w = mountEnding(
      endingView(
        { academy: { stagesBuilt: 2, totalStages: 4, weeklyIncomeCents: 5_000_00 } as never },
        { herAccountCents: 900_000_00, portfolioCents: 269_490_541_00 },
      ),
    )
    const heading = getComputedStyle(document.documentElement).getPropertyValue('--font-heading')
    expect(heading, 'the token is the Sora stack').toContain('Sora')
    // ⭐ RE-AIMED 07.10 (round 48 #3 and #5): the grid is SIX cells now (three money rows, three facts – the share row left),
    // so the notes carry four of the ten (the academy's three and the one-more-year count). And the notes' selector is
    // `b.ending-fig` and no longer a bare `b`: «for life» is a plain `<b>` (round 48 #5) – WORDS, not a figure – and this
    // arm is about FIGURES being Sora, so it must not be asked to turn a word into a number. This fixture carries no
    // lifetime deal, so it never met that `<b>`; the narrowing keeps the next fixture that does from tripping on it.
    const figures = [...document.querySelectorAll('.ending-totals dd, .ending-note b.ending-fig')]
    expect(figures.length, 'six in the grid, four in the notes').toBeGreaterThanOrEqual(10)
    for (const fig of figures) {
      const cs = getComputedStyle(fig)
      // ⚠⚠ THE ARM. Drop \`font-family\` from \`.ending-fig\`, or set it back to the body face, and this goes red
      // for all ten figures at once: measured 06.10, RED [1 test, 10 assertions].
      expect(`${cs.fontFamily}`, `font-family of "${fig.textContent}"`).toMatch(/Sora|var\(--font-heading\)/)
      expect(Number(cs.fontWeight), `weight of "${fig.textContent}"`).toBeGreaterThanOrEqual(700)
    }
    const size = (sel: string): number => px(getComputedStyle(document.querySelector(sel)!).fontSize)
    expect(size('.ending-money dd'), 'the money figures grew from 16px').toBeGreaterThan(16)
    expect(size('.ending-facts dd'), 'the career facts are the biggest figures on the page').toBeGreaterThan(size('.ending-money dd'))
    w.unmount()
  })

  it('⭐⭐⭐ best rank, titles and seasons are ONE row of three, in the order he named them', () => {
    const w = mountEnding()
    const facts = document.querySelector('.ending-facts')!
    expect([...facts.querySelectorAll('dt')].map((d) => d.textContent)).toEqual(['Best rank', 'Titles', 'Seasons'])
    expect(facts.querySelectorAll(':scope > div')).toHaveLength(3)
    // ⚠⚠ THE ARM. Move one of the three into the money list, or make the columns \`repeat(2, ...)\`, and this
    // goes red: measured 06.10, RED [1 test, 2 assertions].
    expect(getComputedStyle(facts).gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
    expect(document.querySelector('.ending-money')!.textContent, 'none of the three is in the money list').not.toMatch(
      /Best rank|Titles|Seasons/,
    )
    w.unmount()
  })

  it('⭐⭐⭐ the money rows are a label|figure grid whose row wrappers are `display: contents`, at 320, 375 and 430 alike', () => {
    const seen: string[] = []
    for (const width of WIDTHS) {
      setViewport({ width, height: 800 })
      const w = mountEnding(endingView({}, { herAccountCents: 900_000_00, portfolioCents: 269_490_541_00 }))
      const money = document.querySelector('.ending-money')!
      const cs = getComputedStyle(money)
      expect(cs.display, 'a grid').toBe('grid')
      // ⚠⚠ THE ARM. Put \`repeat(auto-fit, minmax(84px, 1fr))\` back and the column string changes with the width,
      // which is the dance he reported: measured 06.10, RED [1 test].
      expect(cs.gridTemplateColumns).toContain('minmax(0, 1fr)')
      expect(cs.gridTemplateColumns).not.toContain('auto-fit')
      for (const row of money.querySelectorAll(':scope > div')) {
        expect(getComputedStyle(row).display, 'the row wrapper is not a box, so the labels and figures of ALL rows share the columns').toBe('contents')
      }
      seen.push(`${cs.gridTemplateColumns}|${getComputedStyle(document.querySelector('.ending-facts')!).gridTemplateColumns}`)
      w.unmount()
      document.body.innerHTML = ''
    }
    expect(new Set(seen).size, 'the same columns at every width: nothing re-flows between 320 and 430').toBe(1)
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`⭐ at ${vp.width}px the widest figure leaves its label room, and each of the three facts fits its tile`, () => {
      setViewport(vp)
      const w = mountEnding(endingView({}, { herAccountCents: 321_120_108_00, portfolioCents: 269_490_541_00 }))
      const room = availableWidth(w.find('.ending-album').element, vp)
      const column = Math.min(room, 460)
      for (const dd of document.querySelectorAll('.ending-money dd')) {
        expect(demandedWidth(dd, column), `"${dd.textContent}" takes less than half the row`).toBeLessThanOrEqual(column / 2)
      }
      const tile = (column - 16) / 3
      for (const dd of document.querySelectorAll('.ending-facts dd')) {
        expect(demandedWidth(dd, tile), `"${dd.textContent}" fits one of three tiles`).toBeLessThanOrEqual(tile)
      }
      w.unmount()
    })
  }
})

describe('⭐⭐⭐ round 47 #12 – «The whole record» is under the doors, and only the service export is below it', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the footer reads: album door, the doors, the record link, the export – in that order', () => {
    const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
    const kids = [...w.find('.ending-foot').element.children]
    const at = (pred: (el: Element) => boolean): number => kids.findIndex(pred)
    const text = (el: Element): string => (el.textContent ?? '').trim()
    // ⭐⭐⭐ RE-AIMED 07.10 BY HIS ROUND 48 #6 («Raise another» and the succession door in one row): the two doors are
    // children of ONE `.ending-doors` row now, which is a single child of the footer – so they are looked up INSIDE it,
    // in their order, and «under BOTH doors» reads «under the row that holds both». It looked them up as two direct
    // children of the footer. Nothing else about the order moved: the album door leads, the link is under the doors,
    // only the export is below it, and the export is last.
    const album = at((k) => k.classList.contains('ending-door-album'))
    const doorsRow = at((k) => k.classList.contains('ending-doors'))
    const inRow = doorsRow >= 0 ? [...kids[doorsRow].children] : []
    const raise = inRow.findIndex((k) => text(k) === 'Raise another')
    const line = inRow.findIndex((k) => k.classList.contains('ending-line'))
    const record = at((k) => text(k) === 'The whole record')
    const dev = at((k) => k.classList.contains('ending-dev'))
    for (const [name, i] of Object.entries({ album, doorsRow, raise, line, record, dev })) expect(i, `${name} is on the page`).toBeGreaterThanOrEqual(0)
    expect(raise, '«Raise another» comes first in the row, the line door beside it').toBeLessThan(line)
    // ⚠⚠ THE ARM. Put the link back above the pills and \`record\` is lower than the row: measured 06.10, RED [1 test,
    // 2 assertions] (then, with two direct children; the same arm reddens the re-aimed form on its `record` line).
    expect(album, 'the album door still leads').toBe(0)
    expect(record, 'the record link is under BOTH doors – the row that holds them').toBeGreaterThan(doorsRow)
    expect(dev, 'only the export is below it').toBe(record + 1)
    expect(dev, 'and the export is the last thing on the page').toBe(kids.length - 1)
    w.unmount()
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`⭐ at ${vp.width}x${vp.height}: the takeover still scrolls, and the doors, the record link and the export are reachable`, () => {
      setViewport(vp)
      const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
      const card = w.find('.ending-album').element
      // ⭐ RE-AIMED 07.10 (round 48 #6): `.ending-foot > button` became `.ending-foot button` – the two doors are inside the
      // `.ending-doors` row now, so they are no longer DIRECT children of the footer. The set is the same five controls in
      // the same document order (album door filtered out): raise another, the line, the record link, the export.
      const controls = [...card.querySelectorAll('.ending-foot button')].filter((b) => !b.classList.contains('ending-door-album'))
      expect(controls.length, 'raise another, the line, the record, the export').toBeGreaterThanOrEqual(4)
      // ⚠⚠ THE ARM (the b6 note's own): `.ending`'s `overflow-y: auto` -> `visible` and \`measureDialog\` reports the
      // takeover as no longer the scroller, so every control below the fold becomes unreachable: measured 06.10, RED.
      expect(measureDialog(card, controls[0], vp).overlayScrolls, 'the grown page still scrolls').toBe(true)
      for (const control of controls) assertDismissReachable(card, control, vp, `epilogue ${(control.textContent ?? '').trim()}`)
      w.unmount()
    })
  }
})
