// L2-10 – THE NET UNDER RU-12A / RU-12C / RU-12G (THE LAST PAGE, ITS DOORS AND THE RETIREMENT CARD'S SHELL) AND, IN THE SECOND COMMIT,
// RU-12D / RU-12E (THE COLLEGE YEAR CARD, ITS GRADUATION CARD AND THE SCHOOL-LEAVING FORK).
// docs/specs/i18n-2026-10.md §8, docs/localization/ru-ending-screen-2026-10.md, ru-ending-doors-2026-10.md, ru-retirement-dialog-2026-10.md,
// ru-college-year-2026-10.md, ru-school-fork-2026-10.md.
//
// Six questions, asked of the REAL components mounted and of the REAL catalog (the L2-3 … L2-9 nets' shape):
//   1. PARITY. With no catalog the English renders as it shipped – the wiring changed no word (invariant 4).
//   2. COMPLETENESS. Every CERTAIN string homed in these components is a wired key; the engine's prose is NOT read through a key.
//   3. THE SEAMS. A locale flip re-labels a MOUNTED screen; what the engine wrote, and every number and sum of money, is left exactly as it was.
//   4. THE CONTEXT TAGS. Measured against every table with the importer's own row reader; the verdicts are asserted here.
//   5. THE RUSSIAN SMOKE. The REAL `src/i18n/ru.json` is installed and the locale flipped. ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE – every
//      expectation is READ from ru.json by key. ⚠ THIS FAMILY HOLDS THE FIRST VISIBLE RUSSIAN OF THE PRODUCT: three APPROVED rows
//      (`Tennis & trips`, `Raise another`, `Dynasty`) are wired on the last page, and the smoke proves they render.
//   6. THE `xx` SWEEP, AT 375x667: the ending's money block and the retirement card (a BLOCKING overlay whose answers are the only way out).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'

import EndingScreen from '../../src/components/EndingScreen.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { formatCentsCompact } from '../../src/shared/money'
import { formatShortName } from '../../src/shared/format'
import { lastWordLine, plateauLede } from '../../src/engine/ending'
import { declineRung, herLastWinterLine } from '../../src/composables/declineVoice'
import { listDocs, readRows } from '../../tools/i18n-import'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertDismissReachable, assertInlineRowFits, availableWidth, demandedWidth, setViewport, type Viewport } from './fits'
import { DEFAULT_ALLOW, expandRendered, hardcodeLeaks, installPseudoLocale } from './pseudoloc'
import type { AlbumPage, CareerEndingType, CareerMoney, EndingView, RetirementOffer, Snapshot } from '../../src/shared/protocol'

/** His approved Russian, as the importer compiled it. Every Russian expectation below is read from here by key. */
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const CATALOG = JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; wrapped?: true }> }
const SRC = (path: string): string => readFileSync(path, 'utf8')
const ROWS = readRows(listDocs()).rows

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

/** Every player-visible string under `root`: text nodes and the four copy attributes, in one string – for «is this word on screen». */
function seen(root: Element): string {
  const parts: string[] = [root.textContent ?? '']
  for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
    for (const a of ['title', 'aria-label', 'placeholder', 'alt']) {
      const v = el.getAttribute(a)
      if (v) parts.push(v)
    }
  }
  return parts.join('\n')
}
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()
const pct = (r: number): string => `${(r * 100).toFixed(0)}%`

/** What the §6 allowlist says plus two shapes of NUMBER the sweep must not charge: the compact money figure (`$40.6M` – locale-invariant by ruling,
 *  §9.6, and a letter in it is the unit) and the formatter's week label (RU-13D's). The chrome around them is still charged. */
const ALLOW: readonly RegExp[] = [...DEFAULT_ALLOW, /^\$[\d.,]+[KMB]$/, /^W\d+ '\d\d$/]

/** The rows of every table whose clean English cell is exactly `english`, with the importer's own reader. */
const rowsFor = (english: string) => ROWS.filter((r) => r.english === english)

// ===================================================================================================================
// RU-12A / RU-12C – THE LAST PAGE AND ITS DOORS (L2-10a)
// ===================================================================================================================

const TOTALS = { earnedCents: 4_000_000_00, spentCents: 3_000_000_00, prizeCents: 1_500_000_00, weeksLostToInjury: 0 }
const MONEY = { prizeCents: 40_563_980_00, outlayCents: 254_383_557_00, herAccountCents: 321_120_108_00, portfolioCents: 269_490_541_00 }
const ACADEMY_INCOME = 40_600_000_00
const DEAL_CASH = 5_250_000_00

const ENGINE_PAGE = { why: 'why seven', caption: 'caption seven', fact: 'fact seven' }

function albumPage(): AlbumPage {
  return {
    slot: 7,
    why: ENGINE_PAGE.why,
    caption: ENGINE_PAGE.caption,
    fact: ENGINE_PAGE.fact,
    week: 364,
    seasonIndex: 7,
    stage: 'teen',
    emotion: 'norm',
    empty: false,
  }
}

function endingView(over: Partial<EndingView> = {}, money: Partial<CareerMoney> = MONEY): EndingView {
  return {
    ending: { type: 'natural' as CareerEndingType, week: 900, ageYears: 31, detail: 'she stopped', resumesWeek: null },
    closing: albumPage(),
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: TOTALS,
    money: moneyOf(TOTALS, money),
    seasonsPlayed: 20,
    bestRank: 1,
    bestRankTrack: 'wta',
    titles: 127,
    oneMoreYearCount: 4,
    academy: { stagesBuilt: 3, totalStages: 5, weeklyIncomeCents: ACADEMY_INCOME },
    lifetimeDeal: { brand: 'Acme', cashCents: DEAL_CASH },
    college: null,
    dynasty: dynastyOf(),
    ...over,
  }
}

function patchEnding(view: EndingView): void {
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

/** Mounted ATTACHED, because happy-dom resolves the stylesheet rules only for connected nodes. The viewport comes FIRST (fits.ts). */
function mountEnding(view: EndingView = endingView(), vp: Viewport = PHONE): VueWrapper {
  setViewport(vp)
  patchEnding(view)
  return mount(EndingScreen, { attachTo: document.body })
}

const textsOf = (w: VueWrapper, selector: string): string[] => w.findAll(selector).map((n) => flat(n.text()))
const noteOf = (w: VueWrapper, needle: string): string => flat(w.findAll('.ending-note').find((p) => p.text().includes(needle))?.text() ?? '')

describe('L2-10a parity – the last page as it shipped, with no catalog', () => {
  it('every label, heading, door and fixed sentence reads exactly what it read before the wiring', () => {
    const w = mountEnding()
    expect(w.get('[role="dialog"]').attributes('aria-label')).toBe('Epilogue')
    expect(flat(w.get('.ending-head h2').text())).toBe('The last page')
    expect(textsOf(w, '.ending-money dt')).toEqual(['Tennis & trips', "Family's portfolio", 'Her account'])
    expect(textsOf(w, '.ending-facts dt')).toEqual(['Best rank', 'Titles', 'Seasons'])
    expect(textsOf(w, '.ending-facts dd')).toEqual(['#1', '127', '20'])
    expect(textsOf(w, '.ending-money dd')).toEqual(
      [MONEY.outlayCents, MONEY.portfolioCents, MONEY.herAccountCents].map((c) => formatCentsCompact(c)),
    )
    expect(flat(w.get('.ending-door-album').text())).toBe('View the album')
    expect(flat(w.get('.ending-door-start').text())).toBe('Raise another')
    expect(flat(w.get('.ending-line').text())).toBe('Dynasty')
    expect(textsOf(w, 'button.ending-link')).toEqual(['The whole record', 'Export save (dev)'])
    expect(w.get('img[alt^="Aged"]').attributes('alt')).toBe('Aged teen')
    // the engine's page is printed verbatim
    expect(flat(w.get('.album-why').text())).toBe(ENGINE_PAGE.why)
    expect(flat(w.get('.album-fact').text())).toBe(ENGINE_PAGE.fact)
    w.unmount()
  })

  it('the three notes that carry a bold figure read character for character, and the markup around the figures is where it was', () => {
    const w = mountEnding()
    expect(noteOf(w, 'one more year')).toBe('You said one more year 4 times.')
    expect(noteOf(w, 'academy')).toBe(`Her academy stands – 3 of 5 stages built – and it earns ${formatCentsCompact(ACADEMY_INCOME)} a week.`)
    expect(noteOf(w, 'deal')).toBe(`The Acme deal never ran out – ${formatCentsCompact(DEAL_CASH)} a year, for life.`)
    // the figures are `b.ending-fig`; «for life» is the one PLAIN `b` (round 48 #5 – words, not a figure)
    const notes = w.findAll('.ending-note')
    expect(notes).toHaveLength(3)
    expect(notes[0]!.findAll('b.ending-fig').map((b) => b.text())).toEqual(['4'])
    expect(notes[1]!.findAll('b.ending-fig').map((b) => b.text())).toEqual(['3', '5', formatCentsCompact(ACADEMY_INCOME)])
    expect(notes[2]!.findAll('b.ending-fig').map((b) => b.text())).toEqual([formatCentsCompact(DEAL_CASH)])
    const plain = notes[2]!.findAll('b').filter((b) => !b.classes('ending-fig'))
    expect(plain.map((b) => b.text())).toEqual(['for life'])
    w.unmount()
  })

  it('the variants: one time, an academy that does not earn yet, an unranked career, the other dynasty label, and the college ending\'s lone door', () => {
    const one = mountEnding(endingView({ oneMoreYearCount: 1, academy: { stagesBuilt: 2, totalStages: 5, weeklyIncomeCents: 0 }, lifetimeDeal: null, bestRank: null }))
    expect(noteOf(one, 'one more year')).toBe('You said one more year 1 time.')
    expect(noteOf(one, 'academy')).toBe('Her academy is begun – 2 of 5 stages built.')
    expect(one.findAll('.ending-note')).toHaveLength(2)
    expect(textsOf(one, '.ending-facts dd')[0]).toBe('–')
    one.unmount()
    const lived = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
    expect(flat(lived.get('.ending-line').text())).toBe('Raise her daughter')
    lived.unmount()
    const college = mountEnding(endingView({ ending: { type: 'college', week: 900, ageYears: 19, detail: 'x', resumesWeek: 910 }, handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 910, resumesAgeYears: 19 } }))
    expect(textsOf(college, '.ending-doors .tb-pill')).toEqual(['Another year –'])
    college.unmount()
  })

  it('the record layer: heading, return link, the season\'s age line and the empty note', async () => {
    const view = endingView({ scroll: [{ seasonIndex: 3, year: 2030, ageYears: 17, rows: [{ week: 160, label: 'engine row label', detail: 'engine row detail' }] }] })
    const w = mountEnding(view)
    await w.get('button.ending-link').trigger('click')
    expect(flat(w.get('.ending-head h2').text())).toBe('The whole record')
    expect(flat(w.get('.ending-head .ending-link').text())).toBe('Back to the album')
    expect(flat(w.get('.scroll-year span').text())).toBe('she was 17')
    expect(flat(w.get('.scroll-label').text())).toBe('engine row label')
    expect(flat(w.get('.scroll-detail').text())).toBe('engine row detail')
    w.unmount()
    const empty = mountEnding(endingView({ scroll: [] }))
    await empty.get('button.ending-link').trigger('click')
    expect(flat(empty.get('.scroll-empty').text())).toBe('Nothing was ever written down. That happens.')
    empty.unmount()
  })
})

describe('L2-10a completeness – the chrome is wired, the engine\'s page and records are left raw on purpose', () => {
  const FILE = 'src/components/EndingScreen.vue'
  it('no CERTAIN string homed in EndingScreen is left unwrapped, and the cut sentences keep their markup', () => {
    const open = Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes(FILE) && !v.wrapped).map(([k]) => k)
    expect(open).toEqual([])
    const source = SRC(FILE)
    for (const call of [
      "{{ t('You said one more year') }}",
      "view.oneMoreYearCount === 1 ? t('time.') : t('times.')",
      "{{ t('Her academy stands –') }}",
      "{{ t('stages built – and it earns') }}",
      "{{ t('Her academy is begun –') }}",
      "{{ t('stages built.') }}",
      "t('The {0} deal never ran out –', [view.lifetimeDeal.brand])",
      "{{ t('a year,') }} <b>{{ t('for life') }}</b>.",
      "t('#{rank}', { rank: view.bestRank })",
      "t('Aged {0}', [closing.stage])",
      "t('she was {0}', [s.ageYears])",
      "const DYNASTY_LIVED = (): string => t('Raise her daughter')",
      "const DYNASTY_AFTER = (): string => t('Dynasty')",
    ]) {
      expect(source, call).toContain(call)
    }
    // the markup is still elements, not message text
    expect(source).toContain('<b class="ending-fig">{{ view.oneMoreYearCount }}</b>')
  })

  it('the engine\'s page, the record\'s rows and the ending\'s own sentences are NOT read through a key – they are L3', () => {
    const source = SRC(FILE)
    for (const bare of ['{{ closing.why }}', '{{ closing.fact }}', ':caption="closing.caption"', '{{ r.label }}', '{{ r.detail }}']) expect(source, bare).toContain(bare)
    for (const file of ['src/engine/ending.ts', 'src/engine/world/endings.ts']) {
      expect(/from '(?:\.\.\/)+i18n'/.test(SRC(file)), `${file} learned to call t()`).toBe(false)
    }
  })
})

describe('L2-10a seams – a flip re-labels a MOUNTED last page; the engine\'s words, every number and every sum of money stay exactly as they were', () => {
  it('labels, doors and the cut sentences follow the locale; the page, the figures and the brand do not', async () => {
    const w = mountEnding()
    const before = { figs: textsOf(w, '.ending-fig'), why: flat(w.get('.album-why').text()), caption: seen(w.element).includes(ENGINE_PAGE.caption) }
    installCatalog('ru', {
      'The last page': 'LAST-PAGE',
      'Tennis & trips': 'TT-LABEL',
      'Raise another': 'RA-DOOR',
      Dynasty: 'DY-DOOR',
      'View the album': 'VA-DOOR',
      '#{rank}': 'NO.{rank}',
      'time.': 'TM.',
      'times.': 'TMS.',
      'You said one more year': 'YSOMY',
      'for life': 'FL-BOLD',
      'The {0} deal never ran out –': 'DEAL<{0}>',
      'a year,': 'AY,',
      Epilogue: 'EPI',
    })
    await setLocale('ru')
    await nextTick()
    expect(flat(w.get('.ending-head h2').text())).toBe('LAST-PAGE')
    expect(textsOf(w, '.ending-money dt')[0]).toBe('TT-LABEL')
    expect(textsOf(w, '.ending-money dt')[1]).toBe("Family's portfolio") // no row in the stand-in: English, counted
    expect(flat(w.get('.ending-door-start').text())).toBe('RA-DOOR')
    expect(flat(w.get('.ending-line').text())).toBe('DY-DOOR')
    expect(flat(w.get('.ending-door-album').text())).toBe('VA-DOOR')
    expect(w.get('[role="dialog"]').attributes('aria-label')).toBe('EPI')
    expect(noteOf(w, 'YSOMY')).toBe('YSOMY 4 TMS.')
    expect(noteOf(w, 'DEAL')).toBe(`DEAL<Acme> ${formatCentsCompact(DEAL_CASH)} AY, FL-BOLD.`)
    // the structure survived the flip: the same bold elements around the same figures
    expect(w.findAll('.ending-note b').filter((b) => !b.classes('ending-fig')).map((b) => b.text())).toEqual(['FL-BOLD'])
    expect(textsOf(w, '.ending-facts dd')[0]).toBe('NO.1')
    // NUMBERS AND MONEY ARE LOCALE-INVARIANT (§9.6): every figure the page prints is the string it printed in English
    expect(textsOf(w, '.ending-fig').filter((s) => !s.startsWith('NO.'))).toEqual(before.figs.filter((s) => s !== '#1'))
    expect(flat(w.get('.album-why').text())).toBe(before.why)
    expect(seen(w.element).includes(ENGINE_PAGE.caption)).toBe(before.caption)
    w.unmount()
  })
})

describe('L2-10a context tags – none, each measured against every batch table with the importer\'s own row reader', () => {
  it('the last page\'s words each have ONE Russian across the tables, so no tag is needed; the new fragments are bare keys', () => {
    // «Family's portfolio» is also the season popup's label: two rows, ONE Russian
    const portfolio = rowsFor("Family's portfolio")
    expect(portfolio.length).toBeGreaterThanOrEqual(2)
    expect(new Set(portfolio.map((r) => r.russian)).size, 'the two surfaces agree').toBe(1)
    expect(CATALOG.keys["Family's portfolio"]?.home).toEqual(expect.arrayContaining(['src/components/EndingScreen.vue', 'src/components/SeasonSummaryDialog.vue']))
    // «View the album» and «Export save (dev)» each have two rows and one Russian
    for (const english of ['View the album', 'Export save (dev)']) {
      const rows = rowsFor(english)
      expect(rows.length, english).toBeGreaterThanOrEqual(2)
      expect(new Set(rows.map((r) => r.russian)).size, english).toBe(1)
    }
    // the words that have exactly one row anywhere
    for (const english of ['Epilogue', 'The last page', 'The whole record', 'Back to the album', 'Her account', 'Best rank', 'Titles', 'Seasons', 'Another year –', 'Raise another', 'Dynasty', 'Raise her daughter']) {
      expect(rowsFor(english).length, english).toBe(1)
    }
    // …and no key of the family grew a tag
    for (const english of ['Epilogue', 'The last page', 'The whole record', 'Tennis & trips', 'Raise another', 'Dynasty', 'time.', 'times.', 'of', 'for life']) {
      expect(Object.keys(CATALOG.keys).filter((k) => k.endsWith(`|${english}`)), english).toEqual([])
    }
    // the rank text is HOME'S key (`#{rank}`), shared – the table's №-form reaches the last page with no second key
    expect(CATALOG.keys['#{rank}']?.home).toContain('src/components/EndingScreen.vue')
  })
})

describe('L2-10a Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('⭐ THE WAKES: three APPROVED rows are wired on the last page and RENDER – the first visible Russian of the product; every unapproved word renders English and is counted', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const w = mountEnding()
    const wired = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.includes('src/components/EndingScreen.vue')).sort()
    expect(wired, 'exactly the three approved rows homed on the ending').toEqual(['Dynasty', 'Raise another', 'Tennis & trips'])
    // the money label (the CSS uppercases it; the DOM text is his word as written)
    expect(textsOf(w, '.ending-money dt')[0]).toBe(RU['Tennis & trips'])
    expect(flat(w.get('.ending-door-start').text())).toBe(RU['Raise another'])
    expect(flat(w.get('.ending-line').text())).toBe(RU.Dynasty)
    // …and a word with no approved row stays English, counted
    expect(textsOf(w, '.ending-money dt')[1]).toBe("Family's portfolio")
    expect(missedKeys()).toEqual(expect.arrayContaining(["Family's portfolio", 'Her account', 'View the album', 'The last page']))
    expect(missedKeys()).not.toEqual(expect.arrayContaining(wired))
    expect(missCount()).toBeGreaterThan(10)
    console.log(
      `[L2-10a smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on the last page: ${wired.length} -> ` +
        `«${textsOf(w, '.ending-money dt')[0]}» (Tennis & trips), «${flat(w.get('.ending-door-start').text())}» (Raise another), «${flat(w.get('.ending-line').text())}» (Dynasty); ` +
        `distinct misses on the page: ${missedKeys().length}`,
    )
    w.unmount()
  })
})

// ===================================================================================================================
// RU-12G – THE RETIREMENT CARD'S SHELL (L2-10a)
// ===================================================================================================================

const AGE: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const PLATEAU: RetirementOffer = { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false }
const FINAL: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true }
const ON_TOUR = {
  activeLadder: 'wta',
  ladders: { domestic: { rank: 5, points: 300 }, itf: { rank: 84, points: 0 }, wta: { rank: 106, points: 420 } },
}
/** Two adjacent winters, the second worse – the «last winter / this one» sentence. */
const ADJACENT = [
  { seasonIndex: 10, byTrack: { wta: { endRank: 40 } } },
  { seasonIndex: 11, byTrack: { wta: { endRank: 55 } } },
]
/** A gap, and the last worse than the best – the «my best year finished» sentence. */
const GAPPED = [
  { seasonIndex: 8, byTrack: { wta: { endRank: 40 } } },
  { seasonIndex: 11, byTrack: { wta: { endRank: 55 } } },
]
const COACH = [{ current: true, name: 'Ana Petrova' }]

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
function mountRetire(offer: RetirementOffer, over: Record<string, unknown> = {}, vp: Viewport = PHONE): VueWrapper {
  setViewport(vp)
  showOffer(offer, over)
  return mount(RetirementDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}
/** Each answer as [its strong label, its note] – the two are sibling elements, so a joined text has no space between them. */
const answersOf = (w: VueWrapper): [string, string][] => w.findAll('.retire-answer').map((b) => [flat(b.get('strong').text()), flat(b.get('span').text())])
/** The sentences the engine or a composable writes onto the card (L3) – raw by design. */
function engineLines(w: VueWrapper): string[] {
  return ['.retire-lede', '.retire-rung', '.retire-last-winter'].flatMap((s) => w.findAll(s).map((n) => flat(n.text())))
}

describe('L2-10a parity – the retirement card as it shipped, with no catalog', () => {
  it('the ordinary question: kicker, title, the lede, both answers and the parent\'s note', () => {
    const w = mountRetire(AGE)
    expect(flat(w.get('.retire-kicker').text())).toBe('Off-season – she is 30')
    expect(flat(w.get('.retire-title').text())).toBe('Is there another year in this?')
    expect(flat(w.get('.retire-lede').text())).toBe(
      'Twenty-nine is when the question starts being asked, not a countdown to anything. There is no wrong answer, and she can say no for as many winters as her body gives her.',
    )
    expect(answersOf(w)).toEqual([
      ['That is enough', 'She stops here, on her own terms.'],
      ['One more year', 'The same answer you gave last winter.'],
    ])
    w.unmount()
  })

  it('the plateau card and the final card: their titles and the answers; the final card has no «One more year»', () => {
    const plateau = mountRetire(PLATEAU, { ageYears: 26, oneMoreYearCount: 2, ...ON_TOUR })
    expect(flat(plateau.get('.retire-title').text())).toBe('She said it in the car.')
    expect(flat(plateau.get('.retire-lede').text())).toBe(plateauLede(2, 'professional'))
    expect(answersOf(plateau)[0]).toEqual(['That is enough', 'She stops here, on her own terms.'])
    plateau.unmount()
    const final = mountRetire(FINAL, { ageYears: 41, oneMoreYearCount: 4 })
    expect(flat(final.get('.retire-title').text())).toBe('She told you at the end of the season.')
    expect(flat(final.get('.retire-lede').text())).toBe(lastWordLine(4))
    expect(answersOf(final)).toEqual([['All right', 'Nothing to answer here. She has told you what happens next.']])
    final.unmount()
  })

  it('her words and the coach\'s, built on the dialog\'s side from the season history\'s integers: character for character against the old composition', () => {
    const adjacent = mountRetire(AGE, { seasonHistory: ADJACENT, physicalShare: 0.9, coachMarket: COACH })
    expect(flat(adjacent.get('.retire-season').text())).toBe('«#40 last winter, #55 this one. I can read a table as well as you can.»')
    expect(flat(adjacent.get('.retire-season-coach').text())).toBe(
      `${formatShortName('Ana Petrova')} does not argue with her. The work holds what she has left; it stopped adding to it a while ago.`,
    )
    adjacent.unmount()
    const gapped = mountRetire(AGE, { seasonHistory: GAPPED })
    expect(flat(gapped.get('.retire-season').text())).toBe('«#55 this winter. My best year finished #40, and I know the difference.»')
    expect(gapped.find('.retire-season-coach').exists(), 'no coach line without a coach and a past-peak share').toBe(false)
    gapped.unmount()
  })
})

describe('L2-10a completeness – the card\'s shell is wired; the engine\'s and the composable\'s sentences are left raw on purpose', () => {
  const FILE = 'src/components/RetirementDialog.vue'
  it('no CERTAIN string homed in RetirementDialog is left unwrapped, and the file asks for the dialog\'s own sentences', () => {
    const open = Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes(FILE) && !v.wrapped).map(([k]) => k)
    expect(open).toEqual([])
    const source = SRC(FILE)
    for (const call of [
      "t('Off-season – she is {0}', [age])",
      "t('«#{0} last winter, #{1} this one. I can read a table as well as you can.»', [prev.rank, last.rank])",
      "t('«#{0} this winter. My best year finished #{1}, and I know the difference.»', [last.rank, best.rank])",
      "t('All right') : t('That is enough')",
      "{{ t('One more year') }}",
    ]) {
      expect(source, call).toContain(call)
    }
  })

  it('`lastWordLine`, `plateauLede`, the decline rung and the last-winter line are NOT read through a key: engine / composable prose, L3', () => {
    const source = SRC(FILE)
    for (const bare of ['{{ lastWord }}', '{{ plateauLine }}', '{{ rung }}', '{{ lastWinterWord }}']) expect(source, bare).toContain(bare)
    for (const file of ['src/engine/ending.ts', 'src/composables/declineVoice.ts']) {
      expect(/from '(?:\.\.\/)+i18n'/.test(SRC(file)), `${file} learned to call t()`).toBe(false)
    }
  })
})

describe('L2-10a seams – a flip re-labels a MOUNTED retirement card and leaves her prose, the choice and the numbers alone', () => {
  it('the kicker, the title, the lede and both answers follow the locale; the plateau lede, the rung, her words and the coach\'s do not', async () => {
    const w = mountRetire(AGE, { seasonHistory: ADJACENT, physicalShare: 0.9, coachMarket: COACH, lastWinterIn: 2 })
    const raw = engineLines(w).filter((s) => s !== flat(w.get('.retire-lede').text()))
    const her = flat(w.get('.retire-season').text())
    installCatalog('ru', {
      'Off-season – she is {0}': 'OFF<{0}>',
      'Is there another year in this?': 'ANOTHER?',
      'That is enough': 'ENOUGH',
      'One more year': 'ONE-MORE',
      'The same answer you gave last winter.': 'SAME-ANSWER',
      '«#{0} last winter, #{1} this one. I can read a table as well as you can.»': 'HERS<{0}|{1}>',
    })
    await setLocale('ru')
    await nextTick()
    expect(flat(w.get('.retire-kicker').text())).toBe('OFF<30>')
    expect(flat(w.get('.retire-title').text())).toBe('ANOTHER?')
    expect(answersOf(w)[0]).toEqual(['ENOUGH', 'She stops here, on her own terms.'])
    expect(answersOf(w)[1]).toEqual(['ONE-MORE', 'SAME-ANSWER'])
    expect(flat(w.get('.retire-season').text()), 'her words are a dialog-authored sentence, so they follow').toBe('HERS<40|55>')
    expect(her).toBe('«#40 last winter, #55 this one. I can read a table as well as you can.»')
    // the composable's prose (rung, last winter) is untouched by the flip
    expect(flat(w.get('.retire-rung').text())).toBe(declineRung(0.9))
    expect(flat(w.get('.retire-last-winter').text())).toBe(herLastWinterLine(2))
    expect(engineLines(w).filter((s) => raw.includes(s))).toEqual(raw)
    w.unmount()
  })
})

describe('L2-10a context tags – none for the retirement card', () => {
  it('every word of the shell has one row or one Russian; nothing grew a tag', () => {
    for (const english of ['One more year', 'All right', 'That is enough', 'Is there another year in this?']) {
      const rows = rowsFor(english)
      expect(rows.length, english).toBeGreaterThanOrEqual(1)
      expect(new Set(rows.map((r) => r.russian)).size, english).toBe(1)
      expect(Object.keys(CATALOG.keys).filter((k) => k.endsWith(`|${english}`)), english).toEqual([])
    }
    // the kicker's English is wired as a positional spelling; the doc's `{age}` joins it by position
    expect(CATALOG.keys['Off-season – she is {0}']?.wrapped).toBe(true)
  })
})

describe('L2-10a Russian smoke – the retirement card has no approved row yet: English, counted', () => {
  it('under the REAL ru.json every word of the shell renders as written and each is a counted miss', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const w = mountRetire(AGE, { seasonHistory: ADJACENT, physicalShare: 0.9, coachMarket: COACH })
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.includes('src/components/RetirementDialog.vue'))
    for (const key of wiredHere) expect(seen(w.element), `${key} is approved and wired`).toContain(RU[key]!)
    expect(flat(w.get('.retire-title').text())).toBe('Is there another year in this?')
    for (const key of ['Off-season – she is {0}', 'Is there another year in this?', 'That is enough', 'One more year']) expect(missedKeys(), key).toContain(key)
    console.log(`[L2-10a smoke] retirement card: approved AND wired: ${wiredHere.length}; distinct misses: ${missedKeys().length}`)
    w.unmount()
  })
})

// ===================================================================================================================
// THE `xx` SWEEP, 375x667 – THE ENDING'S MONEY BLOCK AND THE RETIREMENT CARD (L2-10a)
// ===================================================================================================================

/** Every text box under `root`: how much of the room its widest line wants, and the longest unbreakable word (the L2-7 instrument). */
function widest(root: Element, vp: Viewport): { boxes: number; chars: number; line: { r: number; at: string }; word: { r: number; at: string } } {
  let boxes = 0
  let chars = 0
  const line = { r: 0, at: '' }
  const word = { r: 0, at: '' }
  for (const el of Array.from(root.querySelectorAll('*'))) {
    const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.nodeValue ?? '').join(' ').replace(/\s+/g, ' ').trim()
    if (!/\p{L}/u.test(own)) continue
    boxes++
    chars += own.length
    const room = Math.max(1, availableWidth(el, vp))
    const lineRatio = demandedWidth(el, room) / room
    if (lineRatio > line.r) Object.assign(line, { r: lineRatio, at: own.slice(0, 28) })
    const longest = own.split(' ').reduce((a, b) => (b.length > a.length ? b : a), '')
    const probe = document.createElement('span')
    probe.textContent = longest + longest.slice(0, Math.ceil(longest.length * 0.4))
    probe.style.whiteSpace = 'nowrap'
    probe.style.fontSize = getComputedStyle(el).fontSize
    el.appendChild(probe)
    const wordRatio = demandedWidth(probe, room) / room
    probe.remove()
    if (wordRatio > word.r) Object.assign(word, { r: wordRatio, at: longest })
  }
  return { boxes, chars, line, word }
}

describe('L2-10a xx sweep – the last page: nothing the chrome wrote is unbracketed, and the money block and the doors hold a 375x667 phone with every word longer', () => {
  /** The strings the SNAPSHOT carries are the engine's – the sweep charges the chrome and allows what the engine wrote (counted, L3). */
  const ENGINE = new Set([ENGINE_PAGE.why, ENGINE_PAGE.caption, ENGINE_PAGE.fact, 'Acme'])
  async function leaks(view: EndingView): Promise<string[]> {
    await installPseudoLocale()
    const w = mountEnding(view)
    const found = hardcodeLeaks(w.element, ALLOW).filter((l) => !ENGINE.has(l))
    w.unmount()
    return found
  }

  it('zero leaks beyond the engine\'s own words on the last page, the college ending\'s door and the record layer', async () => {
    const page = await leaks(endingView())
    console.log(`[L2-10a xx] last page leaks beyond the ${ENGINE.size} engine-written strings: ${JSON.stringify(page)}`)
    expect(page).toEqual([])
    const college = await leaks(endingView({ ending: { type: 'college', week: 900, ageYears: 19, detail: 'x', resumesWeek: 910 }, handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 910, resumesAgeYears: 19 } }))
    expect(college).toEqual([])
  })

  it('375x667: the money block (three rows, three facts) and the doors, English -> xx – printed; no unbreakable word wider than its room, both doors reachable', async () => {
    const measure = async (xx: boolean): Promise<{ money: ReturnType<typeof widest>; foot: ReturnType<typeof widest>; doors: number[] }> => {
      if (xx) await installPseudoLocale()
      const w = mountEnding(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }), PHONE)
      if (xx) expandRendered(w.element, ALLOW)
      const money = widest(w.get('.ending-totals').element, PHONE)
      const foot = widest(w.get('.ending-doors').element, PHONE)
      const row = w.get('.ending-doors').element
      const [raise, line] = [w.get('.ending-door-start').element, w.get('.ending-line').element]
      const card = w.get('.ending-album').element
      const doors = [raise, line].map((control) => {
        const fit = assertDismissReachable(card, control, PHONE, `epilogue door ${xx ? 'xx' : 'en'} ${(control.textContent ?? '').trim().slice(0, 24)}`)
        expect(fit.shape, 'a scrolling takeover, not a scrim with a bounded card').toBe('overlay-scrolls')
        return fit.dismissBottom
      })
      if (!xx) assertInlineRowFits(row, [raise, line], PHONE, 'epilogue doors (English)')
      w.unmount()
      return { money, foot, doors }
    }
    const en = await measure(false)
    resetI18nForTests(null)
    const xx = await measure(true)
    console.log(
      `[L2-10a xx] 375x667, English -> xx: money block ${en.money.boxes} text boxes, ${en.money.chars} -> ${xx.money.chars} chars; widest line ${pct(en.money.line.r)} («${en.money.line.at}») -> ${pct(xx.money.line.r)} («${xx.money.line.at}»); ` +
        `longest word ${pct(en.money.word.r)} («${en.money.word.at}») -> ${pct(xx.money.word.r)} («${xx.money.word.at}»); ` +
        `doors ${en.foot.chars} -> ${xx.foot.chars} chars, widest line ${pct(en.foot.line.r)} -> ${pct(xx.foot.line.r)}, longest word ${pct(en.foot.word.r)} -> ${pct(xx.foot.word.r)}; ` +
        `both doors rest on y=${en.doors.map((d) => d.toFixed(0)).join('/')} -> ${xx.doors.map((d) => d.toFixed(0)).join('/')}`,
    )
    expect(xx.money.chars, 'xx made the block longer – the measurement saw the words').toBeGreaterThan(en.money.chars)
    expect(xx.money.word.r, `the money block: «${xx.money.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
    expect(xx.foot.word.r, `the doors: «${xx.foot.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
  })
})

describe('L2-10a xx sweep – the retirement card: the shell is bracketed, and the BLOCKING card keeps its answers inside a 375x667 phone with every word longer', () => {
  async function leaksOf(offer: RetirementOffer, over: Record<string, unknown>): Promise<string[]> {
    await installPseudoLocale()
    const w = mountRetire(offer, over)
    const engine = new Set(engineLines(w))
    const found = hardcodeLeaks(w.element, [...ALLOW, /^«#\d+ /]).filter((l) => !engine.has(l))
    w.unmount()
    return found
  }

  it('zero leaks beyond the composable\'s and the engine\'s own sentences: ordinary (with her words and the coach), plateau and final', async () => {
    const ordinary = await leaksOf(AGE, { seasonHistory: ADJACENT, physicalShare: 0.9, coachMarket: COACH, lastWinterIn: 2 })
    console.log(`[L2-10a xx] retirement card (ordinary) leaks: ${JSON.stringify(ordinary)}`)
    expect(ordinary).toEqual([])
    expect(await leaksOf(PLATEAU, { ageYears: 26, oneMoreYearCount: 3, ...ON_TOUR })).toEqual([])
    expect(await leaksOf(FINAL, { ageYears: 41, oneMoreYearCount: 4 })).toEqual([])
  })

  const WORST = { seasonHistory: ADJACENT, physicalShare: 0.9, coachMarket: COACH, lastWinterIn: 2 }
  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`${vp.width}x${vp.height}: every line padded +30% (the shell through the xx catalog, the engine's words through expandRendered) – the last answer is reachable; strip the cap and the SAME assertion goes red`, async () => {
      const en = mountRetire(AGE, WORST, vp)
      let card = document.querySelector('.retire-card') as HTMLElement
      const enFit = assertDismissReachable(card, card.querySelector('.retire-answers')!.lastElementChild!, vp, `RetirementDialog (English, ${vp.width}x${vp.height})`)
      const english = (card.textContent ?? '').length
      en.unmount()
      await installPseudoLocale()
      const w = mountRetire(AGE, WORST, vp)
      card = document.querySelector('.retire-card') as HTMLElement
      const last = card.querySelector('.retire-answers')!.lastElementChild as HTMLElement
      const padded = expandRendered(card, ALLOW)
      const xxChars = (card.textContent ?? '').length
      expect(padded, 'expandRendered reached the composable\'s words').toBeGreaterThanOrEqual(1)
      expect(xxChars, 'xx made the card longer').toBeGreaterThan(english)
      const fit = assertDismissReachable(card, last, vp, `RetirementDialog (xx, ${vp.width}x${vp.height})`)
      console.log(
        `[L2-10a xx] retirement card ${vp.width}x${vp.height}: card text ${english} -> ${xxChars} chars; content wants ${enFit.contentFloor.toFixed(0)} -> ${fit.contentFloor.toFixed(0)}px of a ${fit.available.height.toFixed(0)}px room ` +
          `(${fit.contentFloor > fit.available.height ? 'scrolls inside the cap' : 'fits whole'}); the last answer at ${enFit.dismissTop.toFixed(0)}..${enFit.dismissBottom.toFixed(0)} -> ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height}`,
      )
      expect(fit.dismissBottom).toBeLessThanOrEqual(vp.height)
      // THE MUTATION: the shared cap is what holds – strip it and the same assertion must go red, then put it back and it is green again
      card.style.maxHeight = 'none'
      card.style.overflowY = 'visible'
      expect(() => assertDismissReachable(card, last, vp, 'RetirementDialog (xx, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      card.style.maxHeight = ''
      card.style.overflowY = ''
      assertDismissReachable(card, last, vp, 'RetirementDialog (xx, cap restored)')
      w.unmount()
    })
  }
})
