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
import CollegeYearCard from '../../src/components/CollegeYearCard.vue'
import CollegeDoneDialog from '../../src/components/CollegeDoneDialog.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import LifeMomentOverlay from '../../src/components/LifeMomentOverlay.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { formatCents, formatCentsCompact } from '../../src/shared/money'
import { formatShortName } from '../../src/shared/format'
import { ENDINGS, lastWordLine, plateauLede } from '../../src/engine/ending'
import { declineRung, herLastWinterLine } from '../../src/composables/declineVoice'
import { COLLEGE_LEAGUE, leagueExitLabel, leagueMatchesPlayed, wonTheLeague } from '../../src/engine/collegeLeague'
import { NATIONAL_TEAM } from '../../src/engine/nationalTeam'
import { COLLEGE_TIERS, COLLEGE_TIER_NAME, COLLEGE_TIER_ODDS, canAfford, coveredShareOf, fundingBandOf } from '../../src/engine/collegeOffer'
import { TIERS, TIER_SHORT, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { KID_ID } from '../../src/engine/world/constants'
import { createWorld, measureCollegeOffer, toSnapshot, type WorldState } from '../../src/engine/world'
import { LIFE_MOMENT_CONFIRM } from '../../src/engine/world/lifeMomentCopy'
import { resetLifeMomentForTests } from '../../src/composables/lifeMoment'
import { ladderName } from '../../src/composables/kidIdentity'
import { buildCatalog } from '../../tools/i18n-extract'
import { DEFAULT_PROFILE, activeLadderOfSnapshot } from '../../src/shared/protocol'
import { listDocs, readRows } from '../../tools/i18n-import'
import { installCatalog, missCount, missedKeys, resetI18nForTests, resetMisses, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertDismissReachable, assertInlineRowFits, availableWidth, demandedWidth, setViewport, type Viewport } from './fits'
import { DEFAULT_ALLOW, expandRendered, hardcodeLeaks, installPseudoLocale } from './pseudoloc'
import type { AlbumPage, CareerEndingType, CareerMoney, CollegeProgressView, CollegeYear, EndingView, RetirementOffer, Snapshot, WorldMatch } from '../../src/shared/protocol'

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

  // ⭐ RE-AIMED 10.10 BY L3-6 (the endings and the album): this pin said «they are L3» and held the page's five engine strings BARE in the template. They are drawn through `eventText({ text, c })` now –
  // the engine's page carries a ref beside each string (`AlbumPage.whyC` / `captionC` / `factC`, the scroll's `labelC` / `detailC`), and the English falls out unchanged when a ref is absent. The
  // engine files still do not call `t()` – the refs are the engine's way to speak, the catalog is the screen's – and that half of the pin stands. The mounted proof is
  // tests/component/i18n-l3-6-ending-display.test.ts.
  it('the engine\'s page, the record\'s rows and the ending\'s own sentences are read through the refs the engine sends beside them (L3-6) – and the engine still never calls `t()`', () => {
    const source = SRC(FILE)
    for (const drawn of [
      '{{ eventText({ text: closing.why, c: closing.whyC }) }}',
      '{{ eventText({ text: closing.fact, c: closing.factC }) }}',
      ':caption="eventText({ text: closing.caption, c: closing.captionC })"',
      '{{ eventText({ text: r.label, c: r.labelC }) }}',
      '{{ eventText({ text: r.detail, c: r.detailC }) }}',
    ]) expect(source, drawn).toContain(drawn)
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
      // ⭐ RE-AIMED 10.10 BY L3-6: this said «expandRendered reached the composable's words» (>= 1) because the lede, the rung and her warning were RAW then and needed padding by hand. They ride refs now – keys of the
      // catalog like any other – so the xx catalog brackets and pads them itself and there is nothing raw left to reach. The claim is stronger for it: no word on the card comes through no key.
      expect(padded, 'a word on the card came through no key').toBe(0)
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

// ===================================================================================================================
// RU-12D – THE COLLEGE YEAR CARD AND THE GRADUATION CARD (L2-10b)
// ===================================================================================================================

function collegeYear(over: Partial<CollegeYear> = {}): CollegeYear {
  return {
    index: 1,
    fromWeek: 281,
    untilWeek: 333,
    startSkill: 58.6,
    endSkill: 58.9,
    startRank: null,
    endRank: null,
    fundsDeltaCents: -3_806_075,
    callUp: null,
    league: { week: 293, roundsWon: 2, rounds: 3 },
    ...over,
  } as CollegeYear
}

function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  return {
    yearsDone: 1,
    totalYears: ENDINGS.collegeYears,
    last: collegeYear(),
    final: false,
    billPerYearCents: 8_673_00,
    tier: 'state',
    rubbers: [],
    league: { week: 293, roundsWon: 2, rounds: 3 },
    leagueMatches: [],
    yearInProgress: false,
    leagueIsNextStop: false,
    callUpIsNextStop: false,
    ...over,
  } as CollegeProgressView
}

function fixture(eventId: string, opp: string, winnerId: string, score: string, retiredId?: string): WorldMatch {
  return { eventId, round: 0, oppName: opp, winnerId, score, retiredId, surface: 'hard' } as unknown as WorldMatch
}

function mountCard(view: CollegeProgressView, vp: Viewport = PHONE): VueWrapper {
  setViewport(vp)
  // ⚠ ASSIGNED, NOT `$patch`ed: a patch deep-merges into the snapshot already in the store, and a second mount in one test would overwrite the arrays of the FIRST view –
  // the shared fixtures below (CARD_STATES) were being emptied that way, and a later arm saw a card with no rubbers.
  useGameStore().snapshot = { week: 281, seed: 'l210-card', ending: { college: view }, college: { untilWeek: 333 } } as unknown as Snapshot
  return mount(CollegeYearCard, { attachTo: document.body })
}

// ---- the OLD composition, recomputed: the template literals the wiring replaced, copied here so the parity is character for character ----
const oldMark = (r: number | null): string => (r === null ? '–' : `#${r}`)
function oldHeading(c: CollegeProgressView): string {
  if (c.yearsDone >= c.totalYears) return `All ${c.totalYears} years spent`
  const spent = c.yearsDone === 0 ? 'none spent' : `${c.yearsDone} spent`
  return c.yearInProgress ? `Year ${c.yearsDone + 1} of ${c.totalYears} under way – ${spent}` : `Year ${c.yearsDone + 1} of ${c.totalYears} is next – ${spent}`
}
function oldLead(c: CollegeProgressView): string {
  if (c.yearsDone === 0) {
    const place = c.tier ? `${COLLEGE_TIER_NAME[c.tier]}. ` : ''
    return `${place}A scholarship, and the family pays whatever the award does not. She can leave at the end of any year.`
  }
  if (c.final) return 'One year of the scholarship left. After it she is out either way.'
  return `${c.yearsDone} ${c.yearsDone === 1 ? 'year' : 'years'} spent, ${c.totalYears - c.yearsDone} left on the scholarship.`
}
const oldBill = (c: CollegeProgressView): string | null => ((c.billPerYearCents ?? 0) <= 0 ? null : `${formatCents(c.billPerYearCents)} for the year, charged weekly`)
function oldNext(c: CollegeProgressView): string {
  const bill = oldBill(c)
  return bill === null ? 'Student tennis again, and the award covers the whole year.' : `Student tennis again – ${bill}.`
}
function oldCall(y: CollegeYear): string {
  if (y.callUp === null) return 'Nobody wrote to her this year.'
  const c = y.callUp
  const court = c.rubbersPlayed === 0 ? 'named in the squad, never on court' : `${c.rubbersWon} of ${c.rubbersPlayed} rubbers won`
  return `Her country called – ${court}, and the nation finished ${c.nationFinish}th.`
}
function oldLeagueNote(run: { roundsWon: number; rounds: number }): string {
  const played = leagueMatchesPlayed(run)
  const matches = `${played} ${played === 1 ? 'match' : 'matches'}, ${run.roundsWon} ${run.roundsWon === 1 ? 'win' : 'wins'}`
  return wonTheLeague(run) ? `She won it – ${matches}.` : `She went out in the ${leagueExitLabel(run)} – ${matches}.`
}
function oldOutcome(m: WorldMatch): string {
  const verb = m.winnerId === KID_ID ? 'Won' : 'Lost'
  return `${verb} ${m.score ?? ''}${m.retiredId ? ' ret' : ''}`.trim()
}

const CALL_UP = (over: Record<string, number> = {}) => ({ rubbersPlayed: 2, rubbersWon: 1, nationFinish: 2, ...over }) as unknown as CollegeYear['callUp']
/** Five states of the card, each a real shape the engine can bank, between them every branch of every sentence. */
const CARD_STATES: { label: string; view: CollegeProgressView }[] = [
  { label: 'year one under way (no report yet)', view: collegeView({ yearsDone: 0, last: null, yearInProgress: true, league: null, leagueMatches: [] }) },
  { label: 'year two next, a spent year, out in the final', view: collegeView({ yearsDone: 1, last: collegeYear({ startRank: null, endRank: 12 }) }) },
  {
    label: 'a banked year, a title, an unplayed call-up, no bill',
    view: collegeView({
      yearsDone: 2,
      last: collegeYear({ index: 2, fundsDeltaCents: 1_250_00, startRank: 40, endRank: 12, callUp: CALL_UP({ rubbersPlayed: 0, rubbersWon: 0, nationFinish: 3 }) }),
      billPerYearCents: 0,
      league: { week: 293, roundsWon: 3, rounds: 3 },
    }),
  },
  {
    label: 'the last year ahead, two rubbers played',
    view: collegeView({
      yearsDone: 3,
      final: true,
      last: collegeYear({ index: 3, startRank: 12, endRank: null, callUp: CALL_UP() }),
      league: { week: 293, roundsWon: 0, rounds: 3 },
      rubbers: [fixture('r1', 'Ana Petrova', KID_ID, '6-3 6-4'), fixture('r2', 'Ina Boll', 'opp', '3-6', 'kid')],
      leagueMatches: [fixture('l1', 'Eva Roth', 'opp', '2-6 1-6')],
    }),
  },
  { label: 'every year spent, a place unknown', view: collegeView({ yearsDone: ENDINGS.collegeYears, tier: null, last: collegeYear({ index: ENDINGS.collegeYears }) }) },
]

describe('L2-10b parity – the year card as it shipped, with no catalog: every sentence against the OLD composition recomputed', () => {
  for (const { label, view } of CARD_STATES) {
    it(`${label}`, () => {
      const w = mountCard(view)
      expect(flat(w.get('.college-card h2').text())).toBe('College')
      expect(flat(w.get('.college-heading').text())).toBe(oldHeading(view))
      expect(flat(w.get('.college-lead').text())).toBe(oldLead(view))
      expect(flat(w.get('.college-rule').text())).toBe('None of it pays ranking points or prize money. A student field and a national squad award neither.')
      expect(flat(w.get('.college-next').text())).toBe(oldNext(view))
      const y = view.last
      expect(w.find('.college-report-head').exists()).toBe(y !== null)
      if (y !== null) {
        expect(flat(w.get('.college-report-head').text())).toBe(`Year ${y.index}, as it happened`)
        const facts = w.findAll('.college-facts > div').map((d) => [flat(d.get('dt').text()), flat(d.get('dd').text())])
        expect(facts[0]).toEqual([y.fundsDeltaCents < 0 ? 'Spent' : 'Banked', formatCents(Math.abs(y.fundsDeltaCents))])
        const hasBill = oldBill(view) !== null
        expect(facts.some(([k]) => k === 'Tuition'), 'the tuition fact follows the bill').toBe(hasBill)
        expect(facts.find(([k]) => k === 'Rank')?.[1]).toBe(`${oldMark(y.startRank)} to ${oldMark(y.endRank)}`)
        expect(flat(w.get('.college-call').text())).toBe(oldCall(y))
      }
      if (view.league) {
        expect(flat(w.get('.college-league-note').text())).toBe(oldLeagueNote(view.league))
        expect(flat(w.get('.college-league-stake').text())).toBe(`${NATIONAL_TEAM.label} selectors read this result when they pick the squad.`)
        expect(flat(w.get('.college-league-head').text())).toBe(COLLEGE_LEAGUE.label)
        const fact = w.findAll('.college-facts .college-fact-wide dd')
        if (y !== null) expect(fact).toHaveLength(1)
      }
      const rows = w.findAll('.college-rubber')
      expect(rows.map((r) => flat(r.get('.rubber-score').text()))).toEqual([...view.leagueMatches, ...view.rubbers].map((m) => oldOutcome(m)))
      for (const r of rows) expect(flat(r.get('.rubber-watch').text())).toBe('Watch')
      w.unmount()
    })
  }

  it('the eight shapes of the championship sentence, against the old template over every run the engine can bank', () => {
    const runs = [
      { roundsWon: 0, rounds: 3 },
      { roundsWon: 1, rounds: 3 },
      { roundsWon: 2, rounds: 3 },
      { roundsWon: 3, rounds: 3 },
      { roundsWon: 1, rounds: 1 },
      { roundsWon: 0, rounds: 1 },
    ]
    for (const run of runs) {
      const w = mountCard(collegeView({ league: { week: 293, ...run } }))
      expect(flat(w.get('.college-league-note').text()), JSON.stringify(run)).toBe(oldLeagueNote(run))
      w.unmount()
    }
  })

  it('the rubber rows and the year-ahead calendar: labels, outcomes, the trip count and its unknown form', () => {
    const w = mountCard(CARD_STATES[3]!.view)
    expect(w.findAll('.college-rubbers').at(-1)!.findAll('.rubber-who').map((n) => flat(n.text()))).toEqual([`Rubber 1 – ${formatShortName('Ana Petrova')}`, `Rubber 2 – ${formatShortName('Ina Boll')}`])
    expect(flat(w.get('.college-calendar-head').text())).toBe('The year ahead')
    const rowsOf = (m: VueWrapper) => m.findAll('.college-calendar li').map((li) => [flat(li.get('.college-week-label').text()), flat(li.get('.college-week-what').text())])
    const trips = COLLEGE_TIERS.state.matchesPerWeek
    expect(rowsOf(w)).toEqual(
      expect.arrayContaining([
        [COLLEGE_LEAGUE.label, `A draw of ${COLLEGE_LEAGUE.drawSize}, every year – her matches can be watched`],
        [NATIONAL_TEAM.label, 'If the selectors call her off the championship, the rubbers can be watched'],
        ['Squad trip', trips === 1 ? '1 dual match for the programme' : `${trips} dual matches for the programme`],
      ]),
    )
    w.unmount()
    const none = mountCard(collegeView({ tier: null }))
    expect(rowsOf(none)).toEqual(expect.arrayContaining([['Squad trip', 'Dual matches for the programme']]))
    none.unmount()
  })
})

describe('L2-10b parity – the graduation card as it shipped', () => {
  function mountDone(years: CollegeYear[], doneWeek: number | null = 590, vp: Viewport = PHONE): VueWrapper {
    setViewport(vp)
    useGameStore().snapshot = { week: 590, college: { years, doneWeek } } as unknown as Snapshot
    return mount(CollegeDoneDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
  }
  const years = (n: number, callUps: number): CollegeYear[] =>
    Array.from({ length: n }, (_, i) => collegeYear({ index: i + 1, startRank: i === 0 ? null : 30 - i, endRank: 28 - i, fundsDeltaCents: i % 2 === 0 ? -3_000_00 : 1_200_00, callUp: i < callUps ? CALL_UP() : null }))

  it('a graduate with two call-ups, and a leaver who was never called', () => {
    const grad = mountDone(years(ENDINGS.collegeYears, 2))
    expect(flat(grad.get('.season-summary-kicker').text())).toMatch(/^College · W\d+ '\d\d$/)
    expect(flat(grad.get('.season-summary-title').text())).toBe('She has graduated.')
    expect(grad.findAll('.college-done-year').map((n) => flat(n.text()))).toEqual(Array.from({ length: ENDINGS.collegeYears }, (_, i) => `Year ${i + 1}`))
    expect(flat(grad.get('.college-done-rank').text())).toBe('– to #28')
    expect(grad.findAll('.college-done-totals dt').map((n) => flat(n.text()))).toEqual(['Years', 'Banked'])
    expect(flat(grad.get('.college-done-call').text())).toBe('Her country called in 2 of them, and paid her nothing, which is what it pays everybody.')
    expect(flat(grad.get('.college-done-next').text())).toBe('Qualifying is the way forward again. Her week is on the home screen.')
    expect(flat(grad.get('.college-done-actions').text())).toBe('Continue')
    grad.unmount()
    const left = mountDone(years(1, 0))
    expect(flat(left.get('.season-summary-title').text())).toBe('She has left the scholarship.')
    expect(flat(left.get('.college-done-call').text())).toBe('Her country never called.')
    left.unmount()
  })
})

describe('L2-10b completeness – the college cards are wired; the engine\'s words and receipts are holes or raw', () => {
  it('no CERTAIN string homed in either college component is left unwrapped', () => {
    for (const file of ['src/components/CollegeYearCard.vue', 'src/components/CollegeDoneDialog.vue']) {
      const open = Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes(file) && !v.wrapped).map(([k]) => k)
      expect(open, file).toEqual([])
    }
  })

  it('all eight championship sentences, the four outcome rows and the three call-up shapes exist as keys, and the card asks for them', () => {
    const source = SRC('src/components/CollegeYearCard.vue')
    const keys = [
      'She won it – 1 match, 1 win.',
      'She won it – 1 match, {0} wins.',
      'She won it – {0} matches, 1 win.',
      'She won it – {0} matches, {1} wins.',
      'She went out in the {0} – 1 match, 1 win.',
      'She went out in the {0} – 1 match, {1} wins.',
      'She went out in the {0} – {1} matches, 1 win.',
      'She went out in the {0} – {1} matches, {2} wins.',
      'Won {0}',
      'Lost {0}',
      'Won {0} ret',
      'Lost {0} ret',
      'Nobody wrote to her this year.',
      'Her country called – named in the squad, never on court, and the nation finished {0}th.',
      'Her country called – {0} of {1} rubbers won, and the nation finished {2}th.',
    ]
    for (const key of keys) {
      expect(CATALOG.keys[key]?.wrapped, key).toBe(true)
      expect(source, key).toContain(`t('${key}'`)
    }
    // the engine's words are holes, never keys of this card
    for (const hole of ['COLLEGE_PLACE[c.tier]', 'NATIONAL_TEAM.label', 'leagueExitLabel(run)', 'formatShortName(match.oppName)']) expect(source, hole).toContain(hole)
    for (const bare of ['{{ COLLEGE_LEAGUE.label }}', '{{ row.label }}', '{{ weekLabel(row.week, startYear) }}']) expect(source, bare).toContain(bare)
  })

  it('`engine/collegeLeague.ts`, `engine/nationalTeam.ts` and `engine/collegeOffer.ts` still do not call `t()` (invariant 1)', () => {
    for (const file of ['src/engine/collegeLeague.ts', 'src/engine/nationalTeam.ts', 'src/engine/collegeOffer.ts']) {
      expect(/from '(?:\.\.\/)+i18n'/.test(SRC(file)), `${file} learned to call t()`).toBe(false)
    }
  })
})

describe('L2-10b seams – a flip re-labels a MOUNTED year card; the engine\'s names, the scores and every sum of money stay exactly as they were', () => {
  it('labels, sentences and the counted clauses follow the locale; the place, the league, the opponents and the money do not', async () => {
    const view = CARD_STATES[1]!.view
    const w = mountCard(view)
    const money = w.findAll('.college-facts dd').map((n) => flat(n.text()))
    const before = { place: flat(w.get('.college-lead').text()), league: flat(w.get('.college-league-head').text()) }
    installCatalog('ru', {
      College: 'COLL',
      Spent: 'SPENT-L',
      Tuition: 'TUIT-L',
      Rank: 'RANK-L',
      'Year {0} of {1} is next – {2} spent': 'NEXT<{0}|{1}|{2}>',
      '{0} to {1}': 'SPAN<{0}|{1}>',
      '#{rank}': 'N{rank}',
      'She went out in the {0} – {1} matches, {2} wins.': 'OUT<{0}|{1}|{2}>',
      'The year ahead': 'AHEAD-L',
      '{0} for the year, charged weekly': 'BILL<{0}>',
    })
    await setLocale('ru')
    await nextTick()
    expect(flat(w.get('.college-card h2').text())).toBe('COLL')
    expect(flat(w.get('.college-heading').text())).toBe(`NEXT<2|${ENDINGS.collegeYears}|1>`)
    expect(w.findAll('.college-facts dt').map((n) => flat(n.text()))).toEqual(expect.arrayContaining(['SPENT-L', 'TUIT-L', 'RANK-L']))
    expect(flat(w.get('.college-facts').text())).toContain('SPAN<–|N12>')
    expect(flat(w.get('.college-league-note').text())).toBe(`OUT<${leagueExitLabel(view.league!)}|3|2>`)
    expect(flat(w.get('.college-calendar-head').text())).toBe('AHEAD-L')
    // the engine's words and the money stay as they were
    expect(w.findAll('.college-facts dd').map((n) => flat(n.text())).filter((s) => s.startsWith('$'))).toEqual(money.filter((s) => s.startsWith('$')))
    expect(flat(w.get('.college-league-head').text())).toBe(before.league)
    expect(flat(w.get('.college-lead').text()), 'the lead has no stand-in: English, counted').toBe(before.place)
    w.unmount()
  })
})

// ===================================================================================================================
// RU-12E – THE SCHOOL-LEAVING FORK (L2-10b)
// ===================================================================================================================

/** ⚠ A REAL CAREER STANDING AT THE FORK (round24-fork-places' recipe): the offer is the engine's own, her junior record is set by hand so the awards are non-zero. */
function atTheFork(seed: string, country: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, country })
  world.bestFinishByTier.j300 = 3
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  return world
}
function mountFork(world: WorldState, vp: Viewport = PHONE, tweak?: (s: Snapshot) => void): { w: VueWrapper; snap: Snapshot } {
  setViewport(vp)
  const snap = toSnapshot(world)
  tweak?.(snap)
  useGameStore().snapshot = snap
  return { w: mount(ForkDialog, { attachTo: document.body, global: { stubs: { teleport: true } } }), snap }
}
const pctOf = (share: number): string => `${Math.round(share * 100)}%`
const BAND: Record<string, string> = { full: 'A full ride', most: 'Most of the bill', half: 'About half the bill', part: 'Part of the bill', none: 'Nothing at all' }
/** The old composition of one place's three lines. */
type ForkOffer = NonNullable<NonNullable<Snapshot['fork']>['offer']>
type ForkQuote = ForkOffer['quotes'][number]
function oldRow(q: ForkQuote, offer: ForkOffer) {
  return {
    name: COLLEGE_TIER_NAME[q.tier],
    odds: `${COLLEGE_TIER_ODDS[q.tier].top100In100} in 100 reach the world top 100`,
    price: `${formatCents(q.costPerYearCents)} a year`,
    award: q.athleticShare <= 0 && q.needShare <= 0 ? 'Walk-on, no award' : `${BAND[fundingBandOf(coveredShareOf(q))]} (${pctOf(coveredShareOf(q))})`,
    bill:
      q.familyPerYearCents <= 0
        ? 'Family pays nothing'
        : `Family pays ${formatCents(Math.round(q.familyPerYearCents / WEEKS_PER_YEAR))} a week – ${formatCents(q.familyPerYearCents)} a year`,
    beyond: !canAfford(offer, q),
  }
}
const oldSummary = (q: ForkQuote): string => {
  const course = q.familyPerYearCents <= 0 ? 'Nothing to pay' : `${formatCents(q.familyPerYearCents * ENDINGS.collegeYears)} over ${ENDINGS.collegeYears} years`
  return `${COLLEGE_TIER_NAME[q.tier]}. ${course}, and no ranking points.`
}

describe('L2-10b parity – the school-leaving fork as it shipped, with no catalog: a real career at the fork against the OLD composition', () => {
  for (const country of ['US', 'CZ']) {
    it(`${country}: kicker, title, lede, the five facts, three quotes with their award and bill lines, the note and the three answers`, async () => {
      const world = atTheFork(`l210-fork-${country}`, country)
      const { w, snap } = mountFork(world)
      const ladder = activeLadderOfSnapshot(snap)
      expect(flat(w.get('.fork-kicker').text())).toBe(`She is ${snap.fork!.ageYears}`)
      expect(flat(w.get('.fork-title').text())).toBe('School is over.')
      expect(flat(w.get('.fork-lede').text())).toContain('The junior rungs close on age at nineteen – the season ahead is the last of them. A college place is reserved today and taken up when the academic year starts (')
      expect(flat(w.get('.fork-lede').text())).toMatch(/the other two roads begin now\. Nobody has to keep going\.$/)
      const departs = /\(([^)]+)\); the other two roads begin now\./.exec(flat(w.get('.fork-lede').text()))?.[1]
      expect(departs, 'the hole is a week label on a live career and the fixed fallback otherwise').toBe(snap.collegeDepartsWeek == null ? 'next September' : departs)
      if (snap.collegeDepartsWeek != null) expect(departs).toMatch(/^W\d+ '\d\d$/)
      const facts = w.findAll('.fork-facts > div').map((d) => [flat(d.get('dt').text()), flat(d.get('dd').text())])
      expect(facts[0]).toEqual(['The family has', formatCents(snap.fundsCents)])
      expect(facts[1]).toEqual([`Her ${ladder.label.toLowerCase()} rank`, ladder.rank === null ? 'unranked' : `#${ladder.rank}`])
      expect(facts[2]).toEqual(['Spent so far', formatCents(snap.careerMoney.outlayCents)])
      expect(facts[3]).toEqual(['The tennis has paid', formatCents(snap.careerMoney.prizeCents)])
      const cutoff = TIERS.wta250.acceptsRank ?? null
      if (cutoff !== null) expect(facts[4]).toEqual([`${TIER_SHORT.wta250} admits down to`, `#${cutoff}`])
      expect(flat(w.get('.fork-places-head').text())).toBe('If she goes to college, these are the three places')
      const offer = snap.fork!.offer!
      const quotes = offer.quotes
      const places = w.findAll('.fork-place')
      expect(places).toHaveLength(quotes.length)
      quotes.forEach((q, i) => {
        const o = oldRow(q, offer)
        const p = places[i]!
        expect(flat(p.get('strong').text())).toBe(o.name)
        expect(flat(p.get('em').text())).toBe(o.price)
        const lines = p.findAll('.fork-place-line').map((l) => flat(l.text()))
        expect(lines.slice(0, 2)).toEqual([`${o.odds} · ${o.award}`, o.bill])
        expect(lines.includes('Beyond what the family has'), `${o.name}: the affordability line`).toBe(o.beyond)
      })
      expect(flat(w.get('.fork-places-note').text())).toBe('Four years after she leaves, over 53 careers.')
      const answers = w.findAll('.fork-answer').map((b) => [flat(b.get('strong').text()), flat(b.get('span').text())])
      expect(answers[0]).toEqual(['Turn professional', 'W15 and up. Real cheques, real bills, and the family keeps paying.'])
      expect(answers[1]![0]).toBe('Reserve the college place')
      expect(answers[1]![1], 'the summary under the answer that commits her: the CHEAPEST place by default').toBe(oldSummary(quotes[0]!))
      expect(answers[2]).toEqual(['Stop here', 'She had a childhood in the sport. That is a whole thing to have had.'])
      // picking a place moves the summary to it, whichever branch (fully funded / family pays) it falls in
      for (let i = 0; i < places.length; i++) {
        await places[i]!.trigger('click')
        expect(flat(w.findAll('.fork-answer')[1]!.get('span').text()), `place ${i}`).toBe(oldSummary(quotes[i]!))
      }
      w.unmount()
    })
  }

  it('the migrated fixture: a fork with no offer prints the fixed summary sentence and no quotes', () => {
    const { w } = mountFork(atTheFork('l210-fork-migrated', 'US'), PHONE, (s) => {
      s.fork = { ...s.fork!, offer: undefined as never }
    })
    expect(flat(w.findAll('.fork-answer')[1]!.get('span').text())).toBe('Four years of student tennis on a college scholarship, from the next academic year. No ranking points.')
    expect(w.find('.fork-places-block').exists()).toBe(false)
    w.unmount()
  })
})

describe('L2-10b completeness – the fork\'s own words are wired; the engine\'s place names stay holes', () => {
  const FILE = 'src/components/ForkDialog.vue'
  it('no CERTAIN string homed in ForkDialog is left unwrapped, and the funding bands are a table of getters that keeps its type', () => {
    const open = Object.entries(CATALOG.keys).filter(([, v]) => v.home.includes(FILE) && !v.wrapped).map(([k]) => k)
    expect(open).toEqual([])
    const source = SRC(FILE)
    expect(source).toContain('const BAND_LABEL: Record<CollegeFundingBand, string> = {')
    for (const band of ["return t('A full ride')", "return t('Most of the bill')", "return t('About half the bill')", "return t('Part of the bill')", "return t('Nothing at all')"]) {
      expect(source, band).toContain(band)
    }
    for (const call of [
      "t('Her {0} rank', [ladderName(ladder.value.track).toLowerCase()])",
      "t('{0} admits down to', [TIER_SHORT[TOUR_RUNG]])",
      "t('{0}. Nothing to pay, and no ranking points.', [TIER_LABEL[q.tier]])",
      "t('{0}. {1} over {2} years, and no ranking points.', [",
      "t('Family pays {0} a week – {1} a year', [",
      "t('{0} in 100 reach the world top 100', [COLLEGE_TIER_ODDS[q.tier].top100In100])",
    ]) {
      expect(source, call).toContain(call)
    }
    expect(source, 'the place names are the engine\'s').toContain('name: TIER_LABEL[q.tier]')
  })

  it('the ladder\'s name for the rank head is the chip\'s own word, lowercased where English lowercased it: the three tracks agree with the protocol label', () => {
    for (const track of ['domestic', 'itf', 'wta'] as const) {
      expect(ladderName(track).toLowerCase()).toBe(activeLadderOfSnapshot({ activeLadder: track, ladders: {} } as unknown as Snapshot).label.toLowerCase())
    }
  })
})

describe('L2-10b seams – a flip re-labels a MOUNTED fork; the place names, the odds, the money and her choice stay as they were', () => {
  it('the frame, the facts and the answers follow the locale; the picked place survives the flip and keeps the engine\'s name', async () => {
    const { w, snap } = mountFork(atTheFork('l210-fork-seam', 'US'))
    const quotes = snap.fork!.offer!.quotes
    await w.findAll('.fork-place')[1]!.trigger('click')
    installCatalog('ru', {
      'School is over.': 'SCHOOL-L',
      'Turn professional': 'PRO-L',
      'Stop here': 'STOP-L',
      'The family has': 'HAS-L',
      'unranked': 'UNR-L',
      '#{rank}': 'N{rank}',
      '{0}. {1} over {2} years, and no ranking points.': 'SUM<{0}|{1}|{2}>',
      '{0}. Nothing to pay, and no ranking points.': 'FREE<{0}>',
      'Family pays {0} a week – {1} a year': 'FAM<{0}|{1}>',
      'A full ride': 'FULL-L',
    })
    await setLocale('ru')
    await nextTick()
    expect(flat(w.get('.fork-title').text())).toBe('SCHOOL-L')
    expect(w.findAll('.fork-answer').map((b) => flat(b.get('strong').text()))).toEqual(['PRO-L', 'Reserve the college place', 'STOP-L'])
    expect(flat(w.get('.fork-facts').text())).toContain('HAS-L')
    const q = quotes[1]!
    expect(w.findAll('.fork-place')[1]!.classes('is-picked'), 'the choice survives the flip').toBe(true)
    expect(flat(w.findAll('.fork-place')[1]!.get('strong').text()), 'the engine\'s name of the place').toBe(COLLEGE_TIER_NAME[q.tier])
    const summary = flat(w.findAll('.fork-answer')[1]!.get('span').text())
    expect(summary).toBe(q.familyPerYearCents <= 0 ? `FREE<${COLLEGE_TIER_NAME[q.tier]}>` : `SUM<${COLLEGE_TIER_NAME[q.tier]}|${formatCents(q.familyPerYearCents * ENDINGS.collegeYears)}|${ENDINGS.collegeYears}>`)
    w.unmount()
  })
})

// ===================================================================================================================
// THE ONE MORE DYNAMIC SEAT – LifeMomentOverlay's `Continue` (L2-10b)
// ===================================================================================================================

function mountMoment(vp: Viewport = PHONE, line = 'engine line for the day'): VueWrapper {
  setViewport(vp)
  resetLifeMomentForTests()
  useGameStore().snapshot = {
    ageYears: 24,
    lifeMoment: { kind: 'wedding', week: 1200, face: 'bride', line, confirm: LIFE_MOMENT_CONFIRM },
  } as unknown as Snapshot
  return mount(LifeMomentOverlay, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('L2-10b dynamic seat – LifeMomentOverlay reads the engine\'s one control label through the catalog and owns no sentence', () => {
  it('parity: the card prints the engine\'s line and the engine\'s label and nothing else', () => {
    const w = mountMoment()
    expect(w.text()).toBe(`engine line for the day${LIFE_MOMENT_CONFIRM}`)
    expect(LIFE_MOMENT_CONFIRM).toBe('Continue')
    w.unmount()
  })

  it('completeness: exactly ONE dynamic seat in the file; the only string the engine hands it is a wired catalog key; the gate counts four dynamic calls in all', () => {
    const source = SRC('src/components/LifeMomentOverlay.vue')
    expect(source.match(/\{\{\s*t\(/g)?.length, 'exactly one dynamic seat').toBe(1)
    expect(source).toContain('{{ t(moment.confirm) }}')
    // ⚠ RE-AIMED 09.10 BY v93 (the localization rig L3-0, `WorldEvent.c`): the line is still the feed's kept text and the overlay still owns no sentence – it is now shown through
    // `eventText`, so a row that carries a ref (`lineC`, copied by the engine) follows the locale and a row that does not stays verbatim, as the seams case below still measures.
    expect(source).toContain('{{ eventText({ text: moment.line, c: moment.lineC }) }}')
    expect(CATALOG.keys[LIFE_MOMENT_CONFIRM]?.wrapped, 'the label is a wired key').toBe(true)
    const lines = SRC('src/engine/world/lifeMomentCopy.ts').match(/LIFE_MOMENT_CONFIRM\s*=/g) ?? []
    expect(lines, 'one label constant, one string').toHaveLength(1)
    expect(/from '(?:\.\.\/)+i18n'/.test(SRC('src/engine/world/lifeMomentCopy.ts'))).toBe(false)
    const { stats } = buildCatalog()
    // ⭐ L3-5 (10.10): 4 -> 5 – the fridge note's picked line is read through `t(fridgeNote)` in CalendarScreen (a dynamic seat, the engine's own literal looked up as a key, L2-9b's shape)
    expect(stats.dynamicCalls, 'the gate\'s «dynamic t() calls unreadable»: 3 (L2-9b) + L2-10 + the fridge seat (L3-5)').toBe(5)
  })

  it('seams: the label follows the locale, the line does not; a label with no row falls back to the engine\'s English and is COUNTED', async () => {
    const w = mountMoment()
    installCatalog('ru', { Continue: 'GO-ON' })
    await setLocale('ru')
    await nextTick()
    expect(flat(w.get('.life-moment-go').text())).toBe('GO-ON')
    expect(flat(w.get('.life-moment-line').text())).toBe('engine line for the day')
    installCatalog('ru', {})
    resetMisses()
    await setLocale('ru')
    await nextTick()
    w.unmount()
    const bare = mountMoment()
    expect(flat(bare.get('.life-moment-go').text())).toBe('Continue')
    expect(missedKeys()).toContain('Continue')
    bare.unmount()
  })

  it('smoke and sweep: under the REAL ru.json «Continue» is not approved (English, counted); under xx it is bracketed, and the one control stays inside a 375x667 phone', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const w = mountMoment()
    expect(RU.Continue, 'no approved row for «Continue» yet – the day one is, this arm wakes').toBeUndefined()
    expect(flat(w.get('.life-moment-go').text())).toBe('Continue')
    expect(missedKeys()).toContain('Continue')
    w.unmount()
    resetI18nForTests(null)
    await installPseudoLocale()
    const x = mountMoment(PHONE)
    const engine = new Set(['engine line for the day'])
    expect(hardcodeLeaks(x.element, ALLOW).filter((l) => !engine.has(l)), 'the label is bracketed – the proof the dynamic seat reaches the catalog').toEqual([])
    expandRendered(x.element, ALLOW)
    const card = document.querySelector('.life-moment') as HTMLElement
    const fit = assertDismissReachable(card, card.querySelector('.life-moment-go')!, PHONE, 'LifeMomentOverlay (xx)')
    console.log(`[L2-10b xx] life-moment overlay 375x667: the one control at y=${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${PHONE.height}`)
    x.unmount()
  })
})

// ===================================================================================================================
// CONTEXT TAGS, SMOKE AND SWEEP FOR THE SECOND BATCH (L2-10b)
// ===================================================================================================================

describe('L2-10b context tags – `Spent` and `Banked`, measured with the importer\'s own row reader', () => {
  it('⚠ THE SPENT TRAP: two rows carry the English «Spent» with two Russians – the year card\'s (RU-12D) and the weekly recap\'s (RU-03, already `recap|Spent`) – and the ending screen\'s row is gone; the card keeps the BARE key because the other live surface already took its tag', () => {
    const rows = rowsFor('Spent')
    expect(rows.map((r) => r.doc.replace(/^ru-|-2026-\d\d\.md$/g, '')).sort()).toEqual(['college-year', 'home-weekly'])
    expect(new Set(rows.map((r) => r.russian)).size, 'two surfaces, two Russians').toBe(2)
    expect(CATALOG.keys['recap|Spent'], 'the recap\'s side took its tag in L2-3').toBeTruthy()
    expect(CATALOG.keys.Spent?.home, 'the bare key is the year card\'s alone').toEqual(['src/components/CollegeYearCard.vue'])
    expect(CATALOG.keys.Spent?.wrapped).toBe(true)
    // the ending screen's old «Spent» is not a surface any more (it became «Tennis & trips», round 48 #3) – nothing there asks for the word
    expect(SRC('src/components/EndingScreen.vue')).not.toMatch(/['>]Spent['<]/)
    expect(Object.keys(CATALOG.keys).filter((k) => k.endsWith('|Spent'))).toEqual(['recap|Spent'])
  })

  it('«Banked» has two rows with two Russians inside ONE table (the year card\'s balance ROSE; the graduation card\'s SIGNED total): the card keeps the bare key, the graduation card takes `total|Banked`', () => {
    const rows = rowsFor('Banked')
    expect(rows).toHaveLength(2)
    expect(new Set(rows.map((r) => r.russian)).size).toBe(2)
    expect(CATALOG.keys.Banked?.home).toEqual(['src/components/CollegeYearCard.vue'])
    expect(CATALOG.keys['total|Banked']?.home).toEqual(['src/components/CollegeDoneDialog.vue'])
    expect(SRC('src/components/CollegeDoneDialog.vue')).toContain("{{ t('total|Banked') }}")
  })

  it('every other word of the two college cards and the fork has one Russian across the tables, so it stays bare', () => {
    for (const english of ['Watch', 'College', 'Continue', 'Rank', 'Tuition', 'Years', 'The year ahead', 'Won it', 'Squad trip', 'Spent so far', 'The family has', 'The tennis has paid', 'unranked', 'Stop here', 'Turn professional', 'Reserve the college place']) {
      const rows = rowsFor(english)
      expect(rows.length, english).toBeGreaterThanOrEqual(1)
      expect(new Set(rows.map((r) => r.russian)).size, `${english}: the tables agree`).toBe(1)
      expect(Object.keys(CATALOG.keys).filter((k) => k.endsWith(`|${english}`) && !['recap|Spent'].includes(k)), `${english} grew a tag`).toEqual([])
    }
  })

  it('the pairs that cannot join a cut key are reported, not hidden: the rank span (`#` is inside the holes because a null rank is a dash) and `She is {age}` (two Russians, two key spellings)', () => {
    expect(rowsFor('#{start} to #{end}').length, 'the two owner rows for the span').toBe(2)
    expect(CATALOG.keys['{0} to {1}']?.wrapped).toBe(true)
    expect(CATALOG.keys['She is {0}']?.wrapped, 'the fork\'s positional spelling').toBe(true)
    expect(CATALOG.keys['She is {age}']?.wrapped, 'the prologue\'s named spelling (L2-2)').toBe(true)
    expect(new Set(rowsFor('She is {age}').map((r) => r.russian)).size, 'two surfaces, two Russians').toBe(2)
  })
})

describe('L2-10b Russian smoke – ru.json read by key, no Cyrillic typed here', () => {
  it('no row of these cards is approved yet: English on screen, each word a counted miss', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    resetMisses()
    const card = mountCard(CARD_STATES[3]!.view)
    const fork = mountFork(atTheFork('l210-fork-smoke', 'US'))
    const homes = ['src/components/CollegeYearCard.vue', 'src/components/CollegeDoneDialog.vue', 'src/components/ForkDialog.vue']
    const wiredHere = Object.keys(RU).filter((k) => CATALOG.keys[k]?.wrapped && CATALOG.keys[k]!.home.some((h) => homes.includes(h)))
    for (const key of wiredHere) expect(seen(card.element) + seen(fork.w.element), `${key} is approved and wired`).toContain(RU[key]!)
    expect(flat(card.get('.college-card h2').text())).toBe('College')
    for (const key of ['College', 'Spent', 'Rank', 'Tuition', 'Watch', 'The year ahead']) expect(missedKeys(), key).toContain(key)
    for (const key of ['School is over.', 'Turn professional', 'Stop here', 'The family has']) expect(missedKeys(), key).toContain(key)
    console.log(`[L2-10b smoke] ru.json: ${Object.keys(RU).length} keys; approved AND wired on the college cards and the fork: ${wiredHere.length}; distinct misses on two mounted surfaces: ${missedKeys().length}`)
    card.unmount()
    fork.w.unmount()
  })
})

describe('L2-10b xx sweep – nothing the chrome wrote is unbracketed, and the BLOCKING fork and graduation card keep their ways on inside a 375x667 phone with every word longer', () => {
  /** The engine's words the sweep allows (counted): the places, the league and squad names, the stage words, the opponents. */
  const engineWords = (): Set<string> =>
    new Set([...Object.values(COLLEGE_TIER_NAME), COLLEGE_LEAGUE.label, NATIONAL_TEAM.label, 'Ana Petrova', 'Ina Boll', 'Eva Roth', 'A. Petrova', 'I. Boll', 'E. Roth', 'Quarterfinal', 'Final', 'Semifinal'])

  it('zero leaks beyond the engine\'s words on the year card (five states), the graduation card and the fork', async () => {
    await installPseudoLocale()
    // `leagueLabel` stays raw on purpose: its owner row is the identity `{stage} – {opponent}`, and both halves are the engine's (a round word, an opponent's name)
    const allow = [...ALLOW, /^(?:Q|S)F$|^R\d+$|^F$/, /^(?:Round of \d+|Quarterfinal|Semifinal|Final)$/, /^the (?:College League|Nations Cup)$/, /^[A-Za-z0-9 ]+ – [A-Z]\. [A-Za-z]+$/]
    const eng = engineWords()
    for (const { label, view } of CARD_STATES) {
      const w = mountCard(view)
      const leaks = hardcodeLeaks(w.element, allow).filter((l) => !eng.has(l))
      console.log(`[L2-10b xx] year card (${label}) leaks: ${JSON.stringify(leaks)}`)
      expect(leaks, label).toEqual([])
      w.unmount()
    }
    const { w, snap } = mountFork(atTheFork('l210-fork-xx', 'CZ'))
    const forkLeaks = hardcodeLeaks(w.element, allow).filter((l) => !eng.has(l) && !/^W\d+ '\d\d$/.test(l))
    console.log(`[L2-10b xx] fork leaks: ${JSON.stringify(forkLeaks)} (${snap.fork!.offer!.quotes.length} places)`)
    expect(forkLeaks).toEqual([])
    w.unmount()
  })

  it('375x667: the year card (a Home card) holds the phone with every word longer – numbers printed, no unbreakable word wider than its room', async () => {
    const measure = async (xx: boolean) => {
      if (xx) await installPseudoLocale()
      const w = mountCard(CARD_STATES[3]!.view)
      if (xx) expandRendered(w.element, ALLOW)
      const r = widest(w.get('.college-card').element, PHONE)
      w.unmount()
      return r
    }
    const en = await measure(false)
    resetI18nForTests(null)
    const xx = await measure(true)
    console.log(
      `[L2-10b xx] year card 375x667: ${en.boxes} text boxes, ${en.chars} -> ${xx.chars} chars; widest line ${pct(en.line.r)} («${en.line.at}») -> ${pct(xx.line.r)} («${xx.line.at}»); longest word ${pct(en.word.r)} («${en.word.at}») -> ${pct(xx.word.r)} («${xx.word.at}»)`,
    )
    expect(xx.chars).toBeGreaterThan(en.chars)
    expect(xx.word.r, `the card: «${xx.word.at}» overflows its box under xx`).toBeLessThanOrEqual(1)
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`${vp.width}x${vp.height}: the fork (the longest of two careers, a place selected) – the last answer is reachable under xx; strip the cap and the SAME assertion goes red`, async () => {
      const worlds = ['CZ', 'US'].map((c) => atTheFork(`l210-fork-fit-${c}`, c))
      const en = mountFork(worlds[0]!, vp)
      let card = document.querySelector('.fork-card') as HTMLElement
      const enFit = assertDismissReachable(card, card.querySelector('.fork-answers')!.lastElementChild!, vp, `ForkDialog (English, ${vp.width}x${vp.height})`)
      const english = (card.textContent ?? '').length
      en.w.unmount()
      await installPseudoLocale()
      const x = mountFork(worlds[0]!, vp)
      card = document.querySelector('.fork-card') as HTMLElement
      card.querySelector('.fork-place')!.dispatchEvent(new Event('click'))
      await nextTick()
      const last = card.querySelector('.fork-answers')!.lastElementChild as HTMLElement
      expandRendered(card, ALLOW)
      const xxChars = (card.textContent ?? '').length
      expect(xxChars).toBeGreaterThan(english)
      const fit = assertDismissReachable(card, last, vp, `ForkDialog (xx, ${vp.width}x${vp.height})`)
      console.log(
        `[L2-10b xx] fork ${vp.width}x${vp.height}: card text ${english} -> ${xxChars} chars; content wants ${enFit.contentFloor.toFixed(0)} -> ${fit.contentFloor.toFixed(0)}px of a ${fit.available.height.toFixed(0)}px room ` +
          `(${fit.contentFloor > fit.available.height ? 'scrolls inside the cap' : 'fits whole'}); the last answer at ${enFit.dismissTop.toFixed(0)}..${enFit.dismissBottom.toFixed(0)} -> ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height}`,
      )
      expect(fit.dismissBottom).toBeLessThanOrEqual(vp.height)
      card.style.maxHeight = 'none'
      card.style.overflowY = 'visible'
      expect(() => assertDismissReachable(card, last, vp, 'ForkDialog (xx, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      card.style.maxHeight = ''
      card.style.overflowY = ''
      assertDismissReachable(card, last, vp, 'ForkDialog (xx, cap restored)')
      x.w.unmount()
    })

    it(`${vp.width}x${vp.height}: the graduation card (a graduate with all her years) – Continue is reachable under xx; strip the cap and the SAME assertion goes red`, async () => {
      const yrs = Array.from({ length: ENDINGS.collegeYears }, (_, i) => collegeYear({ index: i + 1, startRank: 30 - i, endRank: 28 - i, callUp: CALL_UP() }))
      const mountDoneCard = (): VueWrapper => {
        setViewport(vp)
        useGameStore().snapshot = { week: 590, college: { years: yrs, doneWeek: 590 } } as unknown as Snapshot
        return mount(CollegeDoneDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
      }
      const en = mountDoneCard()
      let card = document.querySelector('.college-done') as HTMLElement
      const enFit = assertDismissReachable(card, card.querySelector('.college-done-actions > *')!, vp, `CollegeDoneDialog (English, ${vp.width}x${vp.height})`)
      const english = (card.textContent ?? '').length
      en.unmount()
      await installPseudoLocale()
      const x = mountDoneCard()
      card = document.querySelector('.college-done') as HTMLElement
      const go = card.querySelector('.college-done-actions > *') as HTMLElement
      expandRendered(card, ALLOW)
      const xxChars = (card.textContent ?? '').length
      expect(xxChars).toBeGreaterThan(english)
      const fit = assertDismissReachable(card, go, vp, `CollegeDoneDialog (xx, ${vp.width}x${vp.height})`)
      console.log(
        `[L2-10b xx] graduation card ${vp.width}x${vp.height}: card text ${english} -> ${xxChars} chars; content wants ${enFit.contentFloor.toFixed(0)} -> ${fit.contentFloor.toFixed(0)}px of a ${fit.available.height.toFixed(0)}px room; Continue at ${enFit.dismissTop.toFixed(0)}..${enFit.dismissBottom.toFixed(0)} -> ${fit.dismissTop.toFixed(0)}..${fit.dismissBottom.toFixed(0)} of ${vp.height}`,
      )
      expect(fit.dismissBottom).toBeLessThanOrEqual(vp.height)
      card.style.maxHeight = 'none'
      card.style.overflowY = 'visible'
      expect(() => assertDismissReachable(card, go, vp, 'CollegeDoneDialog (xx, unbounded)')).toThrow(/declares no height bound|taller than the screen|outside the viewport/)
      card.style.maxHeight = ''
      card.style.overflowY = ''
      assertDismissReachable(card, go, vp, 'CollegeDoneDialog (xx, cap restored)')
      x.unmount()
    })
  }
})
