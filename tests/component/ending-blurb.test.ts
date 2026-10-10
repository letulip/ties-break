// ⭐ 10.10 – THE NINE `ENDING_BLURB` SENTENCES FIND THEIR SCREEN, MOUNTED (owner item 34, docs/decisions.md 10.10).
//
// THE OWNER, 10.10, about the nine epilogue paragraphs that no screen had ever drawn: «а может быть нам это как-то в наш финальный экран можно как раз
// гармонично встроить, раз такое дело?». The answer is ONE paragraph on the last page, in `.album-page`, directly under the ending's title and above the fact line
// (EndingScreen.vue's script block carries the placement and the reasons; docs/localization/ru-ending-screen-2026-10.md carries the nine rows). His live look gates both the
// placement and the wording, so everything below is asserted against the ENGINE's constant and never against a retyped sentence – a re-wording at his pass moves the
// assertion with the copy.
//
// SIX QUESTIONS, ASKED OF THE REAL COMPONENT, ON ALL NINE ENDINGS (the sweep is keyed on `ENDING_BLURB`'s own keys, so a tenth ending joins it by existing):
//   1. IT RENDERS     – one `<p class="album-blurb">` per ending, and its text is the engine's sentence to the character: nothing composed, trimmed or marked up.
//   2. WHERE IT SITS  – photo, title, PARAGRAPH, fact, date; above the footer's album door, figures and doors; the one child the page gained.
//   3. HOW IT IS SET  – the notes' own 14px at the title's measure, ink stepping down title > paragraph > fact > date, legible on the takeover's brightest ground.
//   4. THE LOCALE     – it is drawn through `t()`: the nine are catalog keys under the declared seat, a probe catalog re-draws them, a flip re-draws a MOUNTED page, `xx` brackets them.
//   5. THE PHONE LAW  – at 375x667 AND 320x568, `setViewport` BEFORE the mount (happy-dom caches a media query on its first computed-style read): on every ending the page is
//                       still the scrolling takeover, every control of the footer is reachable, the paragraph demands no more than the column, and the instrument SEES it
//                       (the modelled page grows when it is drawn) – so a green here cannot be a measurement of a page without it.
//   6. THE GUARD      – a hand-built snapshot whose type the record does not know draws no paragraph and does not throw.
//
// ⚠ THE ARMS, each applied to the real tree, run, and restored byte-identical (`cmp`) – measured 10.10, the red count beside each, out of the 42 cases the net had then (the 43rd, §1's constants-only
//   voice tripwire, came after and stays green under every arm):
//   A. the `<p v-if="blurb" class="album-blurb">` line deleted from EndingScreen.vue       -> 38 red: §1 (all nine), §2, §3, §4, §5
//   B. `blurb` returns the raw `ENDING_BLURB[type]` instead of `t(...)` of it                -> 4 red: §4's probe, flip and `xx` arms and §5's `xx` arm; §1, §2, §3 and §5's English arms stay green (the English is the same)
//   C. the paragraph moved under `.album-fact`                                               -> 1 red: §2's order arm
//   D. `.album-blurb { white-space: nowrap }`                                                -> 19 red: §5's width arm on all nine at both phones, and the `xx` arm
//   E. `.ending`'s `overflow-y: auto` -> `visible`                                           -> 20 red: §5's reach arm (the page stops being the scroller), the resumable college and the `xx` arm
//   F. `.album-blurb { font-size }` raised past the title's                                  -> 1 red: §3's size arm
//   G. the `type in ENDING_BLURB` guard removed from the computed                            -> 1 red: §6
//   H. the seat deleted from tools/i18n-seats.ts and the catalog regenerated                 -> 3 red: §4's catalog arm and both `xx` arms. With the catalog NOT regenerated the net stays green and
//                                                                                               `npm run i18n:check` goes red instead («UNDECLARED dynamic calls» + `catalog-stale`)
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { ENDING_BLURB, ENDING_TITLE } from '../../src/engine/ending'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertDismissReachable, availableWidth, demandedWidth, measureDialog, setViewport, type Viewport } from './fits'
import { contrastRatio, effectiveColor } from './contrast'
import { installPseudoLocale, pseudoCatalog } from './pseudoloc'
import type { AlbumPage, CareerEndingType, EndingView, Snapshot } from '../../src/shared/protocol'

/** The sweep is keyed on the record itself: a tenth `CareerEndingType` is a tenth key here the day the four total records make the compiler ask for its line. */
const TYPES = Object.keys(ENDING_BLURB) as CareerEndingType[]

const TOTALS = { earnedCents: 4_000_000_00, spentCents: 3_000_000_00, prizeCents: 1_500_000_00, weeksLostToInjury: 0 }
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()

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

/** The closing page the way the engine writes it for this ending: the TITLE is the engine's own (`ENDING_TITLE`), so the title line wraps as long as it really does. */
function pageOf(type: CareerEndingType, over: Partial<AlbumPage> = {}): AlbumPage {
  return {
    slot: 7,
    why: ENDING_TITLE[type],
    caption: 'The last week',
    fact: 'Season 12, aged 31 – the detail of this ending',
    week: 364,
    seasonIndex: 12,
    stage: 'teen',
    emotion: 'norm',
    empty: false,
    ...over,
  }
}

// ⚠ 10.10 («при 0 надо починить»): a sweeping pose gives `natural` a refrain count – at count 0
// its sentence is false and the page draws NO line, which the dedicated count-0 case pins.
function posed(type: CareerEndingType): EndingView {
  return viewOf(type, type === 'natural' ? { oneMoreYearCount: 3 } : {})
}

function viewOf(type: CareerEndingType, over: Partial<EndingView> = {}): EndingView {
  return {
    ending: { type, week: 900, ageYears: 31, detail: 'she stopped', resumesWeek: null },
    closing: pageOf(type),
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: TOTALS,
    money: moneyOf(TOTALS, { prizeCents: 40_563_980_00, outlayCents: 254_383_557_00, herAccountCents: 321_120_108_00, portfolioCents: 269_490_541_00 }),
    seasonsPlayed: 20,
    bestRank: 1,
    bestRankTrack: 'wta',
    titles: 127,
    oneMoreYearCount: 0,
    academy: null,
    lifetimeDeal: null,
    college: null,
    dynasty: dynastyOf({ raisedOnTour: true }),
    ...over,
  }
}

function patch(view: EndingView): void {
  useGameStore().$patch({
    snapshot: { ageYears: 31, week: 900, kidRank: 1, fundsCents: 1234_00, careerTotals: TOTALS, careerMoney: view.money, ending: view } as unknown as Snapshot,
  })
}

/** Mounted ATTACHED (happy-dom resolves the stylesheet only for connected nodes), the viewport FIRST (fits.ts). */
function mountEnding(view: EndingView, vp: Viewport = PHONE): VueWrapper {
  setViewport(vp)
  patch(view)
  return mount(EndingScreen, { attachTo: document.body })
}

// =================================================================================================
// 1. IT RENDERS
// =================================================================================================
describe('⭐ 10.10 §1 – every ending draws its own paragraph, the engine\'s sentence to the character', () => {
  it('the denominator: nine endings, nine DISTINCT sentences – nothing is shared between two of them', () => {
    // A tenth ending raises this number on purpose. Distinct, because the family's second sentence was moved on 21.09 precisely so it stopped borrowing the peak's (wave 8b, C4).
    expect(TYPES).toHaveLength(9)
    expect(new Set(TYPES.map((type) => ENDING_BLURB[type])).size).toBe(9)
  })

  for (const type of TYPES) {
    it(`${type}: exactly one paragraph, and it is ENDING_BLURB.${type} – nothing composed, trimmed or marked up`, () => {
      // ⚠ 10.10 (owner: «при 0 надо починить») – `natural` mounts with a refrain count, because at
      // count 0 its sentence («for years she said one more») is false and the page draws NO line;
      // the dedicated case below pins that skip.
      const w = mountEnding(posed(type))
      const lines = w.findAll('.album-blurb')
      // ⚠⚠ ARM A (the `<p>` deleted) goes red here on all nine: «expected [] to have a length of 1».
      expect(lines, 'one paragraph').toHaveLength(1)
      expect(lines[0].element.tagName).toBe('P')
      expect(lines[0].text(), 'the engine\'s sentence, to the character').toBe(ENDING_BLURB[type])
      expect(lines[0].element.children.length, 'plain text – no bold, no break, no figure').toBe(0)
      expect(w.text().split(ENDING_BLURB[type]).length - 1, 'printed once on the whole screen').toBe(1)
      w.unmount()
    })
  }

  it('⚠ 10.10 «при 0 надо починить»: a natural career that never heard «one more year» draws NO paragraph – the sentence would be false', () => {
    const silent = mountEnding(viewOf('natural', { oneMoreYearCount: 0 }))
    expect(silent.findAll('.album-blurb'), 'count 0: no line rather than a false one').toHaveLength(0)
    silent.unmount()
    const spoken = mountEnding(viewOf('natural', { oneMoreYearCount: 1 }))
    expect(spoken.findAll('.album-blurb'), 'count 1: the line is back').toHaveLength(1)
    spoken.unmount()
  })

  it('⚠ HIS ROUND-48 #4 VOICE RULING («nothing credits her with saying one more year») holds for EIGHT of the nine paragraphs – the ninth, `natural`, is the named open exception', () => {
    // The engine's `natural` sentence – «… for years she said one more.» – predates the ruling and was left «for the owner's eye» (docs/rounds/round-48.md, item 4). It is his wording, so it is
    // drawn as it stands and the exception is NAMED here and in tests/component/r48-b1-ending-page.test.ts, which goes red the day it moves; this arm is that net's twin from the paragraph side.
    const credits = /\bshe (has |had )?said one more/i
    expect(TYPES.filter((type) => credits.test(ENDING_BLURB[type]))).toEqual(['natural'])
  })

  it('the ending is read off the SNAPSHOT: the same page mounted as two endings draws two different paragraphs', () => {
    const drawn = TYPES.map((type) => {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const w = mountEnding(posed(type))
      const text = w.get('.album-blurb').text()
      w.unmount()
      return text
    })
    expect(new Set(drawn).size, 'nine mounts, nine paragraphs').toBe(9)
  })
})

// =================================================================================================
// 2. WHERE IT SITS
// =================================================================================================
describe('⭐ 10.10 §2 – under the title, over the fact, over the figures: the one child the page gained', () => {
  const ORDER = ['album-photo', 'album-why', 'album-blurb', 'album-fact', 'album-when']
  const namesOf = (w: VueWrapper): string[] =>
    Array.from(w.get('.album-page').element.children).map((el) => ORDER.find((c) => el.classList.contains(c)) ?? el.tagName)

  it('photograph, title, PARAGRAPH, fact, date – in that order, and nothing else is a child of the page', () => {
    for (const type of TYPES) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const w = mountEnding(posed(type))
      // ⚠⚠ ARM C (the paragraph moved under `.album-fact`) goes red here: the order reads photo, title, fact, paragraph, date.
      expect(namesOf(w), type).toEqual(ORDER)
      w.unmount()
    }
  })

  it('an empty last slot (no fact, no date) still reads title then paragraph', () => {
    const w = mountEnding(viewOf('stopped', { closing: pageOf('stopped', { fact: null, week: null, empty: true }) }))
    expect(namesOf(w)).toEqual(['album-photo', 'album-why', 'album-blurb'])
    w.unmount()
  })

  it('it is part of the page and NOT of the footer: above the album door, the figures and both doors', () => {
    const w = mountEnding(viewOf('natural', { oneMoreYearCount: 4 }))
    const blurb = w.get('.album-blurb').element
    expect(w.get('.ending-foot').element.contains(blurb), 'not in the footer').toBe(false)
    for (const selector of ['.ending-door-album', '.ending-totals', '.ending-money', '.ending-facts', '.ending-note', '.ending-doors']) {
      expect(blurb.compareDocumentPosition(w.get(selector).element) & Node.DOCUMENT_POSITION_FOLLOWING, `${selector} comes after the paragraph`).toBeTruthy()
    }
    w.unmount()
  })

  it('it carries no label of its own and moves none: the figures\' labels and both doors read exactly as before', () => {
    const w = mountEnding(viewOf('stopped'))
    expect(w.findAll('.ending-totals dt').map((d) => d.text())).toEqual(['Tennis & trips', "Family's portfolio", 'Her account', 'Best rank', 'Titles', 'Seasons'])
    expect(w.get('.ending-door-start').text()).toBe('Raise another')
    expect(w.get('.ending-line').text()).toBe('Raise her daughter')
    expect(w.get('.ending-door-album').text()).toBe('View the album')
    w.unmount()
  })
})

// =================================================================================================
// 3. HOW IT IS SET
// =================================================================================================
describe('⭐ 10.10 §3 – one rung under the title: the notes\' own size, the title\'s measure, ink stepping down', () => {
  const px = (v: string): number => Number.parseFloat(v)
  /** The brightest stop of the takeover's own ground (`--celebration-bg`) – the weakest ground for light text. Held against the stylesheet below. */
  const BRIGHTEST_GROUND: [number, number, number] = [0x16, 0x28, 0x3b]

  it('14px like the notes, smaller than the title and larger than the date, at the title\'s measure', () => {
    const w = mountEnding(viewOf('natural', { oneMoreYearCount: 4 }))
    const cs = (selector: string): CSSStyleDeclaration => getComputedStyle(w.get(selector).element)
    // ⚠⚠ ARM F (the paragraph given a size past the title's) goes red on the second line.
    expect(cs('.album-blurb').fontSize, 'the notes\' own size').toBe(cs('.ending-note').fontSize)
    expect(px(cs('.album-blurb').fontSize), 'under the title').toBeLessThan(px(cs('.album-why').fontSize))
    expect(px(cs('.album-blurb').fontSize), 'over the date').toBeGreaterThan(px(cs('.album-when').fontSize))
    expect(cs('.album-blurb').maxWidth, 'the title\'s own measure').toBe(cs('.album-why').maxWidth)
    w.unmount()
  })

  it('the ink steps down one rung at a time – title, paragraph, fact, date – and the paragraph reads on the brightest ground', () => {
    const w = mountEnding(viewOf('stopped'))
    // the ground the measurement assumes is the one the stylesheet declares (a moved ground must move this constant with it)
    expect(getComputedStyle(document.documentElement).getPropertyValue('--celebration-bg').toLowerCase(), 'the ground\'s brightest stop').toContain('#16283b')
    const ratio = (selector: string): number => contrastRatio(effectiveColor(w.get(selector).element).slice(0, 3) as [number, number, number], BRIGHTEST_GROUND)
    const [title, blurb, fact, date] = ['.album-why', '.album-blurb', '.album-fact', '.album-when'].map(ratio)
    expect(title, 'the title is the loudest ink').toBeGreaterThan(blurb)
    expect(blurb, 'the paragraph reads before the record\'s terse line').toBeGreaterThan(fact)
    expect(fact).toBeGreaterThan(date)
    expect(blurb, 'AAA for body text on the brightest ground').toBeGreaterThanOrEqual(7)
    w.unmount()
  })
})

// =================================================================================================
// 4. THE LOCALE – THROUGH t()
// =================================================================================================
describe('⭐ 10.10 §4 – drawn through t(): the nine are catalog keys under a declared seat, and the paragraph follows the locale', () => {
  const CATALOG = (JSON.parse(readFileSync('src/i18n/catalog.en.json', 'utf8')) as { keys: Record<string, { home: string[]; area: string[]; wrapped?: true; seat?: string[] }> }).keys

  it('the nine sentences are WIRED catalog keys, homed on engine/ending.ts, reached by the seat `ending.blurb` and by nothing else', () => {
    for (const type of TYPES) {
      const entry = CATALOG[ENDING_BLURB[type]]
      // ⚠⚠ ARM H (the seat deleted, the catalog regenerated) goes red here – and in `npm run i18n:check`, whose gate counts a `t(expr)` no seat declares.
      expect(entry, `${type}: the sentence is a catalog key – run npm run i18n:extract`).toBeDefined()
      expect(entry.wrapped, type).toBe(true)
      expect(entry.seat, type).toEqual(['ending.blurb'])
      expect(entry.home, type).toEqual(['src/engine/ending.ts'])
      expect(entry.area, type).toEqual(['engine'])
    }
  })

  it('a probe catalog keyed by the English sentence re-draws every paragraph; the engine\'s title and fact stay as the engine wrote them', async () => {
    installCatalog('ru', Object.fromEntries(TYPES.map((type) => [ENDING_BLURB[type], `PROBE<${type}>`])))
    await setLocale('ru')
    for (const type of TYPES) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const w = mountEnding(posed(type))
      // ⚠⚠ ARM B (the raw constant instead of `t(...)` of it) goes red here: the paragraph stays English under the probe locale.
      expect(w.get('.album-blurb').text(), type).toBe(`PROBE<${type}>`)
      expect(w.get('.album-why').text(), 'the title is the engine\'s page, not this seat\'s').toBe(ENDING_TITLE[type])
      expect(w.text(), 'and the English sentence is nowhere on a probed page').not.toContain(ENDING_BLURB[type])
      w.unmount()
    }
  })

  it('a locale flip re-draws a MOUNTED page, and a locale with no row for the sentence draws the English one (the state of every unapproved row)', async () => {
    const w = mountEnding(viewOf('plateau'))
    expect(w.get('.album-blurb').text()).toBe(ENDING_BLURB.plateau)
    installCatalog('ru', { [ENDING_BLURB.plateau]: 'PROBE<plateau>' })
    await setLocale('ru')
    await nextTick()
    expect(w.get('.album-blurb').text(), 'the flip re-drew the paragraph without a remount').toBe('PROBE<plateau>')
    w.unmount()

    resetI18nForTests(null)
    installCatalog('ru', {})
    await setLocale('ru')
    const bare = mountEnding(viewOf('plateau'))
    expect(bare.get('.album-blurb').text(), 'no row -> the English sentence, as for every DRAFT row').toBe(ENDING_BLURB.plateau)
    bare.unmount()
  })

  it('under `xx` every paragraph is its pseudo-localized sentence – so the pseudo catalog (built from the English keys) HAS the nine', async () => {
    await installPseudoLocale()
    for (const type of TYPES) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const expected = pseudoCatalog()[ENDING_BLURB[type]]
      expect(expected, `${type}: the sentence is a key of the pseudo catalog`).toBeDefined()
      const w = mountEnding(posed(type))
      expect(w.get('.album-blurb').text(), type).toBe(expected)
      expect(w.get('.album-blurb').text(), `${type}: not the English`).not.toBe(ENDING_BLURB[type])
      w.unmount()
    }
  })
})

// =================================================================================================
// 5. THE PHONE LAW
// =================================================================================================
describe('⭐ 10.10 §5 – the phone law: the paragraph pushes nothing off a 375x667 or a 320x568 phone, on any of the nine', () => {
  /** What the instrument charged for the paragraph, per phone and ending – printed once below, so the number a green verdict rests on is on the record. */
  const grew = new Map<string, number>()
  afterAll(() => {
    const line = (vp: Viewport): string => TYPES.map((type) => `${type} +${(grew.get(`${vp.width}:${type}`) ?? 0).toFixed(0)}`).join(', ')
    console.log(`[10.10] modelled growth of the page by its paragraph (px) – ${PHONE.width}x${PHONE.height}: ${line(PHONE)}; ${NARROW_PHONE.width}x${NARROW_PHONE.height}: ${line(NARROW_PHONE)}`)
  })
  for (const vp of [PHONE, NARROW_PHONE]) {
    for (const type of TYPES) {
      it(`${vp.width}x${vp.height} · ${type}: still the scrolling takeover, every control reachable, the paragraph inside the column – and the instrument sees it`, () => {
        const w = mountEnding(posed(type), vp)
        const card = w.get('.ending-album').element
        const blurb = w.get('.album-blurb').element
        const controls = ['.ending-door-album', '.ending-door-start', '.ending-line', '.ending-dev'].map((selector) => w.get(selector).element)

        // (1) THE COLUMN: a wrapping paragraph demands none of its own, so what it asks of the row is its padding – and a line that cannot wrap demands its whole length.
        // ⚠⚠ ARM D (`white-space: nowrap` on the paragraph) goes red here on all eighteen: «… demands 1000-odd px of a 343px column».
        const room = availableWidth(blurb, vp)
        expect(demandedWidth(blurb, room), `the paragraph's demand against the ${room}px column`).toBeLessThanOrEqual(room)

        // (2) THE REACH: the takeover is the scroller and every way off it rests inside the screen when scrolled to the end.
        // ⚠⚠ ARM E (`.ending { overflow-y: visible }`) goes red here on all eighteen: «the content is taller than the screen and nothing scrolls».
        for (const control of controls) {
          const fit = assertDismissReachable(card, control, vp, `epilogue ${type} · ${(control.textContent ?? '').trim()}`)
          expect(fit.shape, 'a scrolling takeover, not a scrim with a bounded card').toBe('overlay-scrolls')
        }

        // (3) THE INSTRUMENT SEES IT: the modelled page is taller with the paragraph than without, so (2) is a verdict on a page that has it.
        const withIt = measureDialog(card, controls[1], vp).contentFloor
        blurb.remove()
        const without = measureDialog(card, controls[1], vp).contentFloor
        grew.set(`${vp.width}:${type}`, withIt - without)
        expect(withIt - without, `the modelled page grew by the ${type} paragraph (${withIt.toFixed(0)} against ${without.toFixed(0)})`).toBeGreaterThan(30)
        w.unmount()
      })
    }
  }

  it('a college that can still be RESUMED: the paragraph is drawn over the lone door, and the door is reachable on both phones', () => {
    for (const vp of [PHONE, NARROW_PHONE]) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      const w = mountEnding(
        viewOf('college', {
          ending: { type: 'college', week: 900, ageYears: 19, detail: 'x', resumesWeek: 910 },
          handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 910, resumesAgeYears: 19 },
        }),
        vp,
      )
      expect(w.get('.album-blurb').text()).toBe(ENDING_BLURB.college)
      const lone = w.get('.ending-doors .tb-pill').element
      expect(lone.textContent?.trim()).toBe('Another year –')
      assertDismissReachable(w.get('.ending-album').element, lone, vp, `epilogue college (resumable) at ${vp.width}x${vp.height}`)
      w.unmount()
    }
  })

  it('under `xx` (every word longer) the same holds at both phones on all nine: the paragraph is bracketed and no control leaves the screen', async () => {
    await installPseudoLocale()
    for (const vp of [PHONE, NARROW_PHONE]) {
      for (const type of TYPES) {
        setActivePinia(createPinia())
        document.body.innerHTML = ''
        const w = mountEnding(posed(type), vp)
        const card = w.get('.ending-album').element
        expect(flat(w.get('.album-blurb').text()).length, `${type}: xx made the paragraph longer`).toBeGreaterThan(ENDING_BLURB[type].length)
        expect(demandedWidth(w.get('.album-blurb').element, availableWidth(w.get('.album-blurb').element, vp))).toBeLessThanOrEqual(availableWidth(w.get('.album-blurb').element, vp))
        for (const selector of ['.ending-door-album', '.ending-door-start', '.ending-line']) {
          assertDismissReachable(card, w.get(selector).element, vp, `epilogue ${type} under xx at ${vp.width}x${vp.height}`)
        }
        w.unmount()
      }
    }
  })
})

// =================================================================================================
// 6. THE GUARD
// =================================================================================================
describe('⭐ 10.10 §6 – a type the record does not know draws no paragraph and does not throw', () => {
  it('a hand-built snapshot (a probe fixture) keeps the rest of the page and loses only the line', () => {
    // ⚠⚠ ARM G (the `type in ENDING_BLURB` guard removed) goes red here: `t(undefined)` is not a lookup.
    const w = mountEnding(viewOf('stopped', { ending: { type: 'not-an-ending' as CareerEndingType, week: 900, ageYears: 31, detail: 'x', resumesWeek: null } }))
    expect(w.find('.album-blurb').exists(), 'no paragraph').toBe(false)
    expect(w.find('.album-why').exists(), 'the title is still drawn').toBe(true)
    expect(w.find('.ending-door-album').exists(), 'and so is the footer').toBe(true)
    w.unmount()
  })
})
