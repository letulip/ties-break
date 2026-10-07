// ⭐⭐⭐ ROUND 48 B1 – THE LAST PAGE AND THE RETIREMENT CARD, MOUNTED (07.10; items 3a, 4, 5 and 6 of
// docs/rounds/round-48.md – the owner's first detailed pass over the merged round 47).
//
// WHAT IS ASSERTED, BY ITEM:
//   3a  the money list is THREE rows – «Tennis & trips», «Family's portfolio», «Her account» last – after his
//       second ruling of 07.10 (docs/decisions.md, 07.10 second batch): the «Family's share» row goes, «Spent» is
//       renamed to the label he typed, and «three numbers are left». The first ruling of the day (a four-row reorder)
//       was superseded before it shipped and is not asserted anywhere.
//   4   «one more year» is the parent's word at the two TEMPLATE sites (the page line and the note under the
//       button) and, rendered through the card, at the engine's sites; the final offer's opening stays hers.
//       The engine strings are asserted to the byte in `tests/r48-b1-voice-flip.test.ts`.
//   5   «for life» is bold.
//   6   the two doors are ONE ROW, the second one reads «A child came later», and the row fits a phone.
//
// ⚠⚠ THE WORDS ARE HIS (invariant 4) AND EVERY WORDING MOVE HERE WAS ASKED FOR: the rename in 3a and the child in 6
// are his own spellings, the voice flip in 4 is his ruling, and «for life» in 5 is a weight and no word at all. Every
// other label on the page is asserted byte-identical, which is what keeps this file from being the place a
// stray rename hides.
//
// ⚠ `setViewport` RUNS BEFORE THE MOUNT, or happy-dom's cached media query measures the desktop column and the phone
// arms cannot redden (CLAUDE.md, the phone law). happy-dom has NO LAYOUT ENGINE: `offsetTop` and every bounding box
// are zero, so «one row» is proved the way fits.ts proves every row in this project – from the real cascade (a flex
// row, no wrapping, equal shares that may shrink) plus the shared `assertInlineRowFits` – and not from a position.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { formatCentsCompact } from '../../src/shared/money'
import { LAST_WORD_OPENING, lastWordLine, plateauLede } from '../../src/engine/ending'
import { NARROW_PHONE, PHONE, assertDismissReachable, assertInlineRowFits, demandedWidth, setViewport } from './fits'
import type {
  AlbumPage,
  CareerEndingType,
  CareerMoney,
  EndingView,
  RetirementOffer,
  Snapshot,
} from '../../src/shared/protocol'
import '../../src/style.css'

const TOTALS = { earnedCents: 4_000_000_00, spentCents: 3_000_000_00, prizeCents: 1_500_000_00, weeksLostToInjury: 0 }

/** The figures off the owner's own 20-season save (round 47's probe): the family's prize share, the engine's tennis
 *  outlay, her account and the portfolio. Four DISTINCT numbers, so a figure that travelled to the wrong label shows. */
const HIS_SAVE = {
  prizeCents: 40_563_980_00,
  outlayCents: 254_383_557_00,
  herAccountCents: 321_120_108_00,
  portfolioCents: 269_490_541_00,
}

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
    oneMoreYearCount: 4,
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

/** Rendered text with the template's own indentation collapsed – what a reader sees, not how the `.vue` file wraps. */
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()

// ==================================================================================================================
// 3a – THE MONEY LIST IS THREE ROWS
// ==================================================================================================================
describe('⭐⭐⭐ round 48 #3a – the money list is Tennis & trips, Family\'s portfolio, Her account – and «Family\'s share» is gone', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ exactly three labels, in his order, her account LAST', () => {
    const w = mountEnding(endingView({}, HIS_SAVE))
    const labels = w.findAll('.ending-money dt').map((d) => d.text())
    // ⚠⚠ THE ARM (the ORDER half). Swap the portfolio and her-account rows in the template and this goes red: measured
    // 07.10, RED [3 tests here – this one, the figures-travel arm and the facts arm – and 1 in r47-b1-ending-figures].
    expect(labels).toEqual(['Tennis & trips', "Family's portfolio", 'Her account'])
    w.unmount()
  })

  it('⭐⭐⭐ «Family\'s share» is GONE – no row, no label, and the figure it printed is not on the page at all', () => {
    const w = mountEnding(endingView({}, HIS_SAVE))
    const labels = w.findAll('.ending-totals dt').map((d) => d.text())
    // ⚠⚠ THE ARM (the ABSENCE half – a different mutation from the order half). Put a `<div><dt>Family's share</dt>…
    // prizeCents…</div>` row back under the first row and this goes red: measured 07.10, RED [5 tests here – this one,
    // the three-label sequence, the figures-travel arm, the conditional-account arm and the facts arm – plus 1 in
    // r47-b1-ending-figures and 2 in round46-the-reckoning]. A CSS `display: none` would leave the row in the DOM and
    // its words in `textContent`, which is why the label and the figure are asserted absent from the TEXT: the row is
    // removed, not hidden.
    expect(labels, 'the label is gone from the whole totals block, facts row included').not.toContain("Family's share")
    expect(w.text(), 'and from the whole page').not.toContain("Family's share")
    expect(w.find('.ending-totals').text(), `${formatCentsCompact(HIS_SAVE.prizeCents)} was its figure`).not.toContain(
      formatCentsCompact(HIS_SAVE.prizeCents),
    )
    w.unmount()
  })

  it('⭐⭐⭐ «Spent» is RENAMED, not duplicated – the old label is gone and the new one carries the engine\'s outlay', () => {
    const w = mountEnding(endingView({}, HIS_SAVE))
    const labels = w.findAll('.ending-totals dt').map((d) => d.text())
    expect(labels, 'the old label is gone').not.toContain('Spent')
    expect(labels, 'nothing acquired the draft word from round 46 either').not.toContain('Won')
    const row = w.findAll('.ending-money > div').find((r) => r.get('dt').text() === 'Tennis & trips')!
    // ⚠⚠ THE ARM. Point the template at `view.money.prizeCents` (the share row's old figure) and this goes red:
    // measured 07.10, RED [3 tests here – this one, the figures-travel arm and the absence arm, which finds its `$40.6M`
    // back on the page]. The reckoning itself is untouched – the figure is `careerMoney`'s own `outlayCents`.
    expect(row.get('dd').text()).toBe(formatCentsCompact(HIS_SAVE.outlayCents))
    w.unmount()
  })

  it('⭐ every figure travels with its OWN label after the move – four distinct numbers, three rows', () => {
    const w = mountEnding(endingView({}, HIS_SAVE))
    const rows = w.findAll('.ending-money > div').map((r) => [r.get('dt').text(), r.get('dd').text()])
    expect(rows).toEqual([
      ['Tennis & trips', formatCentsCompact(HIS_SAVE.outlayCents)],
      ["Family's portfolio", formatCentsCompact(HIS_SAVE.portfolioCents)],
      ['Her account', formatCentsCompact(HIS_SAVE.herAccountCents)],
    ])
    w.unmount()
  })

  it('⭐ her account is STILL conditional, and the two rows that remain keep their order without it', () => {
    // The owner's «three numbers» is the career that HAS an account; the row's own rule (it renders only when her
    // account ever received a cheque, round 46 R46-1) is not part of this ruling and has not moved.
    const w = mountEnding(endingView({}, { ...HIS_SAVE, herAccountCents: 0 }))
    expect(w.findAll('.ending-money dt').map((d) => d.text())).toEqual(['Tennis & trips', "Family's portfolio"])
    w.unmount()
  })

  it('⭐⭐⭐ HIS CAPS: the label is written as a label and the page SHOWS it as he typed it', () => {
    // He typed TENNIS & TRIPS. The `dt` rule already uppercases every label in this block, so the source spelling is
    // the one every other label here uses – and the page reads in his capitals. ⚠⚠ THE ARM. Take
    // `text-transform: uppercase` off `.ending-totals dt` and the page shows «Tennis & trips», which is NOT what he
    // typed, and this goes red: measured 07.10, RED [1 test].
    const w = mountEnding(endingView({}, HIS_SAVE))
    const first = w.get('.ending-money dt').element
    expect(first.textContent).toBe('Tennis & trips')
    expect(getComputedStyle(first).textTransform, 'the label is drawn in capitals').toBe('uppercase')
    w.unmount()
  })

  it('⚠ the three career facts under the list, and every other label on the page, are UNTOUCHED', () => {
    const w = mountEnding(endingView({}, HIS_SAVE))
    expect(w.findAll('.ending-facts dt').map((d) => d.text())).toEqual(['Best rank', 'Titles', 'Seasons'])
    expect(w.findAll('.ending-totals dt').map((d) => d.text())).toEqual([
      'Tennis & trips',
      "Family's portfolio",
      'Her account',
      'Best rank',
      'Titles',
      'Seasons',
    ])
    w.unmount()
  })
})

// ==================================================================================================================
// 4 – «ONE MORE YEAR» IS THE PARENT'S WORD
// ==================================================================================================================
const AGE: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const PLATEAU: RetirementOffer = { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false }
const FINAL: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true }

/** The professional table, which is what `activeLadderOfSnapshot` resolves off these rows – the fixture
 *  `last-word.test.ts` and `r40-plateau-lede.test.ts` use for the plateau card. */
const ON_TOUR = {
  activeLadder: 'wta',
  ladders: { domestic: { rank: 5, points: 300 }, itf: { rank: 84, points: 0 }, wta: { rank: 106, points: 420 } },
}

function showOffer(offer: RetirementOffer, over: Record<string, unknown> = {}): void {
  useGameStore().$patch({
    snapshot: {
      ageYears: 30,
      week: 1453,
      kidRank: 88,
      fundsCents: 1234_00,
      oneMoreYearCount: 0,
      physicalShare: 1,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
      retirementOffer: offer,
      ...over,
    } as unknown as Snapshot,
  })
}

describe('⭐⭐⭐ round 48 #4 – the page line is the parent\'s: «You said one more year N times.»', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const noteOf = (w: ReturnType<typeof mountEnding>) => w.findAll('.ending-note').find((p) => p.text().includes('one more year'))

  it('⭐⭐⭐ the line reads «You said one more year N times.», with `time` / `times` kept', () => {
    for (const [count, noun] of [
      [1, 'time'],
      [2, 'times'],
      [5, 'times'],
      [27, 'times'],
    ] as const) {
      setActivePinia(createPinia())
      const w = mountEnding(endingView({ oneMoreYearCount: count }))
      // ⚠⚠ THE ARM. Put «She said» back in the template and this goes red on its first count: measured 07.10, RED
      // [2 tests here – this one and the no-credit tripwire below – plus 1 in endings-ui and 1 in r47-b1-ending-figures].
      // The sentence is the draft R47-S4 he blessed – «You said one more year N times.» – verbatim.
      expect(noteOf(w)?.text(), `count ${count}`).toBe(`You said one more year ${count} ${noun}.`)
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('⭐ ...and the number is still a figure – bold, in the display face – inside the sentence', () => {
    const w = mountEnding(endingView({ oneMoreYearCount: 5 }))
    const figure = noteOf(w)!.get('b.ending-fig')
    expect(figure.text()).toBe('5')
    w.unmount()
  })

  it('⭐ a career that never said it prints no such line, as before', () => {
    const w = mountEnding(endingView({ oneMoreYearCount: 0 }))
    expect(noteOf(w), 'a line about a count of zero').toBeUndefined()
    w.unmount()
  })

  it('⚠⚠ nothing on the last page credits her with saying it', () => {
    const w = mountEnding(endingView({ oneMoreYearCount: 5 }))
    expect(w.text()).not.toMatch(/\bshe (has |had )?said one more/i)
    w.unmount()
  })
})

describe('⭐⭐⭐ round 48 #4 – the retirement card: the note under the button and the lede, in the parent\'s voice', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ the note under «One more year» is «The same answer you gave last winter.»', () => {
    for (const offer of [AGE, PLATEAU]) {
      setActivePinia(createPinia())
      showOffer(offer, offer === PLATEAU ? { ageYears: 26, ...ON_TOUR } : {})
      const w = mount(RetirementDialog)
      const controls = w.findAll('.retire-answer')
      expect(controls, `${offer.reason}: both answers are drawn`).toHaveLength(2)
      expect(controls[1].get('strong').text(), 'the label is his and is not what moved').toBe('One more year')
      // ⚠⚠ THE ARM. Put «she gave» back and this goes red on its first offer: measured 07.10, RED [1 test here, and the
      // byte-identity pin in last-word.test.ts].
      expect(said(controls[1].get('span').text()), offer.reason).toBe('The same answer you gave last winter.')
      w.unmount()
    }
  })

  it('⭐⭐⭐ the FINAL card: her opening is hers and untouched, and only the count sentence is the parent\'s', () => {
    showOffer(FINAL, { ageYears: 41, oneMoreYearCount: 4 })
    const w = mount(RetirementDialog)
    const lede = said(w.get('.retire-lede').text())
    // The exception, to the byte: the decision at the final offer genuinely belongs to her.
    expect(lede.startsWith('Nobody asked her this time. She said it herself, and she said it steadily.')).toBe(true)
    expect(lede).toContain(LAST_WORD_OPENING)
    expect(lede).toBe(lastWordLine(4))
    expect(lede).toContain('You have said one more year 4 times, and this season was the last one.')
    expect(lede).not.toMatch(/\bshe (has |had )?said one more/i)
    w.unmount()
  })

  it('⭐⭐ the plateau card\'s counting bands read «You have said one more year…» on screen', () => {
    for (const [count, fragment] of [
      [1, 'You have said one more year once already'],
      [4, 'You have said one more year 4 times'],
    ] as const) {
      setActivePinia(createPinia())
      showOffer(PLATEAU, { ageYears: 26, oneMoreYearCount: count, ...ON_TOUR })
      const w = mount(RetirementDialog)
      const lede = said(w.get('.retire-lede').text())
      expect(lede, `count ${count}`).toBe(plateauLede(count, 'professional'))
      expect(lede, `count ${count}`).toContain(fragment)
      expect(lede, `count ${count}`).not.toMatch(/\bshe (has |had )?said one more/i)
      w.unmount()
    }
  })
})

// ==================================================================================================================
// 5 – «FOR LIFE» IS BOLD
// ==================================================================================================================
/** Every text node under `root`, in document order. A tree walker would do, and a plain recursion needs nothing from
 *  the DOM implementation. */
function textNodes(root: Node): Text[] {
  const out: Text[] = []
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === 3) out.push(child as Text)
    else out.push(...textNodes(child))
  }
  return out
}

describe('⭐⭐⭐ round 48 #5 – «for life» is bold', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function lifetimeNote() {
    const w = mountEnding(endingView({ lifetimeDeal: { brand: 'Baseline Athletic', cashCents: 2_500_000_00 } as never }))
    const note = w.findAll('.ending-note').find((p) => p.text().includes('never ran out'))!
    return { w, note }
  }

  it('⭐⭐⭐ the words «for life» are a text node inside a bold element, and only those two words are in it', () => {
    const { w, note } = lifetimeNote()
    const hits = textNodes(note.element).filter((n) => n.data === 'for life')
    expect(hits, 'the two words stand alone in a node of their own').toHaveLength(1)
    const bold = hits[0].parentElement!.closest('b, strong')
    // ⚠⚠ THE ARMS, each alone, measured 07.10, each RED [2 tests – this one and the byte-identical/bold-set one]: take
    // the `<b>` off the two words and no text node reads «for life» on its own; widen the bold to «a year, for life»
    // and the bold set stops reading [figure, «for life»]. That is what makes «only those words» a claim and not a hope.
    expect(bold, 'the words sit inside a bold element').not.toBeNull()
    expect(bold!.textContent, 'and the bold element holds nothing else').toBe('for life')
    w.unmount()
  })

  it('⭐⭐⭐ the sentence is otherwise byte-identical, and the only bold things in it are the figure and those words', () => {
    const { w, note } = lifetimeNote()
    expect(said(note.text())).toBe('The Baseline Athletic deal never ran out – $2.5M a year, for life.')
    expect(note.findAll('b').map((b) => b.text())).toEqual(['$2.5M', 'for life'])
    w.unmount()
  })

  // ⚠ WHY THE PROOF IS THE ELEMENT AND NOT A COMPUTED WEIGHT: happy-dom does not apply the user-agent default
  // (`b { font-weight: bolder }`) – measured 07.10, it reports «normal» for a bare `<b>` – so a computed-weight
  // assertion here would be RED on the very markup it is meant to bless. A `<b>` is bold by definition in a real
  // browser, and style.css carries no rule that resets `b` or `strong` (grep, 07.10), so the element IS the weight.
})

// ==================================================================================================================
// 6 – THE TWO DOORS ARE ONE ROW, AND THE SECOND ONE SAYS «A CHILD CAME LATER»
// ==================================================================================================================
describe('⭐⭐⭐ round 48 #6 – the dynasty door reads «A child came later»', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the epilogue variant is «A child came later», and the old label is nowhere on the page', () => {
    const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: false }) }))
    // ⚠⚠ THE ARM. Put `DYNASTY_AFTER` back to its old word and this goes red: measured 07.10, RED [2 tests here – this one
    // and the row-structure test, which reads the label too – plus 1 in wave10-dynasty-door].
    expect(w.get('.ending-line').text()).toBe('A child came later')
    expect(w.text()).not.toContain('daughter came later')
    w.unmount()
  })

  it('⚠ the LIVED variant is untouched – the rename was asked for one of the two labels', () => {
    const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
    expect(w.get('.ending-line').text()).toBe('Raise her daughter')
    w.unmount()
  })
})

describe('⭐⭐⭐ round 48 #6 – «Raise another» and the line door share ONE row', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  const VARIANTS = [
    { raisedOnTour: false, label: 'A child came later' },
    { raisedOnTour: true, label: 'Raise her daughter' },
  ] as const

  function doors(w: ReturnType<typeof mountEnding>) {
    const row = w.get('.ending-doors').element
    const [raise, line] = Array.from(row.children)
    return { row, raise, line }
  }

  for (const { raisedOnTour, label } of VARIANTS) {
    it(`⭐⭐⭐ (${label}) both doors are children of ONE flex row, in order, that does not wrap`, () => {
      setViewport(PHONE)
      const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour }) }))
      const { row, raise, line } = doors(w)
      expect(Array.from(row.children), 'exactly the two doors').toHaveLength(2)
      expect((raise.textContent ?? '').trim()).toBe('Raise another')
      expect((line.textContent ?? '').trim()).toBe(label)
      expect(line.classList.contains('ending-line'), 'the line door keeps its hook').toBe(true)
      const cs = getComputedStyle(row)
      // ⚠⚠ THE ARMS, each alone, measured 07.10: `display` -> block is RED [6 tests here – these two and the four phone
      // ones – plus 1 in wave10-dynasty-door]; `flex-direction` -> column is RED [the same 6 and 1]; `flex-wrap` -> wrap
      // is RED [these two only]. Every one of them is what turns «one row» into two on the owner's phone.
      expect(cs.display, 'a flex row').toBe('flex')
      expect(cs.flexDirection, 'a ROW').toBe('row')
      expect(cs.flexWrap, 'a wrapping row spends a second line instead of failing').not.toBe('wrap')
      w.unmount()
    })
  }

  it('⭐⭐⭐ the two doors take EQUAL shares and may shrink, so neither can push the other off the row', () => {
    setViewport(PHONE)
    const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: false }) }))
    const { raise, line } = doors(w)
    const [a, b] = [getComputedStyle(raise), getComputedStyle(line)]
    expect(Number(a.flexGrow), 'it takes a share of the row').toBeGreaterThan(0)
    expect(a.flexGrow, 'equal shares').toBe(b.flexGrow)
    expect(a.flexBasis, 'from the same basis').toBe(b.flexBasis)
    expect(Number(a.flexShrink), 'and may shrink').toBeGreaterThan(0)
    expect(a.minWidth, 'below its own text – the label wraps inside the pill instead of overflowing the row').toMatch(/^0(px)?$/)
    expect(b.minWidth).toMatch(/^0(px)?$/)
    w.unmount()
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    for (const { raisedOnTour, label } of VARIANTS) {
      it(`⭐⭐⭐ at ${vp.width}x${vp.height} (${label}): the doors fit one row, each half is inside the screen, both are reachable`, () => {
        setViewport(vp)
        const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour }) }))
        const { row, raise, line } = doors(w)
        const card = w.get('.ending-album').element

        // (1) THE SHARED INSTRUMENT: both controls stand beside each other inside the row. ⚠⚠ THE ARM – give the pills
        // `.next-week-btn`'s own `min-width: 206px` and this goes red («the controls demand 424px of a 375px row» at 375,
        // «… of a 320px row» at 320): measured 07.10, RED [the four phone tests and the equal-shares test]. ⚠ NOTE THE
        // «375px» IN THAT MESSAGE, and read (2).
        assertInlineRowFits(row, [raise, line], vp, `epilogue doors (${label})`)

        // (2) THE BOXES: two equal halves of the room the row really has – the viewport less the takeover's two gutters –
        // so neither half can leave the screen. ⚠ THE GUTTERS ARE READ OFF `:root` HERE AND NOT FROM `availableWidth`:
        // `.ending` pads with `var(--app-pad-x)`, happy-dom reports that padding as unresolved, and the shared walk then
        // hands back the WHOLE viewport – measured 07.10, (1)'s message above says «a 375px row» where the real column is
        // 343 – so (1) alone passes a pair of pills up to 32px too wide for the page. The token itself does resolve.
        // ⚠⚠ THE ARM FOR (2), which is why it is not a duplicate of (1): `min-width: 170px` on the pills passes (1) at 375
        // (340 + the gap, of a 375px row) and goes RED here – «Raise another» wants 170 of a 165.5px half: measured 07.10,
        // RED [the four phone tests and the equal-shares test]; at 320 both (1) and (2) fire.
        const gutter = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-pad-x'))
        expect(Number.isFinite(gutter), '`--app-pad-x` resolves on :root, so the room below is a number').toBe(true)
        const room = vp.width - 2 * gutter
        const gap = Number.parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap)
        const half = (room - gap) / 2
        expect(half, 'a half has a width at all').toBeGreaterThan(0)
        expect(half * 2 + gap, `the two halves and the gap inside the ${room}px column`).toBeLessThanOrEqual(room)
        expect(demandedWidth(raise, half), '«Raise another» fits its half').toBeLessThanOrEqual(half)
        expect(demandedWidth(line, half), `«${label}» fits its half`).toBeLessThanOrEqual(half)

        // (3) THE PHONE LAW: the takeover scrolls and both ways off this screen are reachable, in the overlay shape.
        const fits = [raise, line].map((control) => {
          const fit = assertDismissReachable(card, control, vp, `epilogue door ${(control.textContent ?? '').trim()}`)
          expect(fit.shape, 'a scrolling takeover, not a scrim with a bounded card').toBe('overlay-scrolls')
          return fit
        })

        // (4) ONE ROW MEANS ONE BOTTOM: both doors rest on the same line, because the tail the tail-walk sees under
        // them is the same record link and export. ⚠⚠ THE ARM – a column (the old shape) stacks them, so the first
        // door's bottom is a whole pill higher than the second's (515.1 against 565.4 at 375, 416.1 against 466.4 at
        // 320): measured 07.10, RED on all four phone tests – (1), (2) and (3) all pass a column, which is why (4) exists.
        expect(fits[0].dismissBottom, 'the two doors are drawn on one line').toBeCloseTo(fits[1].dismissBottom, 6)
        w.unmount()
      })
    }
  }

  it('⭐ the footer order is unchanged around them: the album door leads, the record link and the export follow the row', () => {
    const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
    const kids = Array.from(w.get('.ending-foot').element.children)
    const at = (pred: (el: Element) => boolean): number => kids.findIndex(pred)
    const album = at((k) => k.classList.contains('ending-door-album'))
    const row = at((k) => k.classList.contains('ending-doors'))
    const record = at((k) => (k.textContent ?? '').trim() === 'The whole record')
    const dev = at((k) => k.classList.contains('ending-dev'))
    for (const [name, i] of Object.entries({ album, row, record, dev })) expect(i, `${name} is on the page`).toBeGreaterThanOrEqual(0)
    expect(album, 'the album door still leads').toBe(0)
    expect(row, 'the doors row is under the album door').toBeGreaterThan(album)
    expect(record, 'the record link is under the row').toBeGreaterThan(row)
    expect(dev, 'only the export is below it').toBe(record + 1)
    w.unmount()
  })

  it('⚠ a college ending that can still be RESUMED keeps its single way forward and no second door beside it', () => {
    const w = mountEnding(
      endingView({
        ending: { type: 'college', week: 300, ageYears: 20, detail: 'she went to college', resumesWeek: 508 },
        handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 508, resumesAgeYears: 23 },
      }),
    )
    expect(w.find('.ending-line').exists(), 'no line while there is still a season to play').toBe(false)
    const row = w.get('.ending-doors').element
    expect(Array.from(row.children), 'the one control, alone in its row').toHaveLength(1)
    expect((row.textContent ?? '').trim()).toContain('Another year')
    // ...and a lone pill is NOT stretched into half a row: the share rule is for the pair.
    // (happy-dom reports an unset `flex-grow` as an empty string, so «no share» is read as `|| 0`.)
    expect(Number(getComputedStyle(row.children[0]).flexGrow || 0), 'the lone pill keeps the width its label gives it').toBe(0)
    w.unmount()
  })
})
