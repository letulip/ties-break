// R53 M8b (22.10) – the famous-name coach card, MOUNTED: a pedigreed elite row prints its two lines (`.cm-pedigree-past`,
// `.cm-pedigree-trade`) in the engine's words, a plain elite row prints neither, and under ru the catalog rows speak.
// M8 shipped the lines without this net (tests/round53-coach-pedigree.test.ts reads the engine half only).
//
// The snapshot is DOCTORED on purpose: whether a seed's elite slots happen to carry a past is the engine's draw and not
// this file's question. One elite row gets a `pedigree` built by the engine's own `pedigreeCardLines`-shaped tables
// (`PEDIGREE_PAST_LINE` / `PEDIGREE_TRADE_LINE` – never retyped), every other row has none.
//
// ⚠ happy-dom does no layout (scrollWidth/clientWidth are 0, so `scrollWidth <= clientWidth` would be `0 <= 0` on a broken
// card too). The fit is therefore the suite's own width model (`fits.ts`): the room each line is left by its ancestors,
// against what it demands, plus "may it wrap".
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { PEDIGREE_PAST_LINE, PEDIGREE_TRADE_LINE } from '../../src/engine/world/coachMarket'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'
import { NARROW_PHONE, PHONE, availableWidth, demandedWidth, setViewport, type Viewport } from './fits'

Element.prototype.scrollIntoView = function () {}
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

const PAST = PEDIGREE_PAST_LINE['former-no1']
const TRADE = PEDIGREE_TRADE_LINE.sponsors

let famousName = ''

async function market(vp: Viewport): Promise<VueWrapper> {
  // ⚠ the viewport BEFORE the mount – happy-dom caches a media query on the first computed-style read
  setViewport(vp)
  const snap = toSnapshot(createWorld('r53-pedigree-card', { ...DEFAULT_PROFILE, coachTier: 'middle' }))
  const elite = snap.coachMarket.filter((r) => r.tier === 'elite')
  expect(elite.length, 'the fixture needs two elite rows').toBeGreaterThanOrEqual(2)
  for (const r of snap.coachMarket) delete r.pedigree
  elite[0].pedigree = { past: PAST, trade: TRADE }
  famousName = elite[0].name
  useGameStore().snapshot = snap
  const w = mount(CoachMarketScreen, SHELL) as VueWrapper
  await flushPromises()
  const pill = w.findAll('.tb-seg .tab-pill').find((b) => ['Coaches', 'Тренеры'].includes(b.text()))
  if (pill) {
    await pill.trigger('click')
    await flushPromises()
  }
  return w
}

function eliteCards(w: VueWrapper) {
  // the tier block is sorted by fit and price, so the cards are found by NAME and not by position
  const cards = w.get('#coach-tier-elite').findAll('.cm-row')
  expect(cards.length).toBeGreaterThanOrEqual(2)
  const famous = cards.find((c) => (c.attributes('aria-label') ?? '').startsWith(famousName))
  expect(famous, `the card of ${famousName}`).toBeTruthy()
  const plain = cards.find((c) => c !== famous)!
  return { famous: famous!, plain }
}

beforeEach(() => {
  installMemoryStorage()
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  resetI18nForTests(null)
})
afterEach(() => {
  document.body.innerHTML = ''
  resetI18nForTests(null)
  document.documentElement.lang = 'en'
})

describe('R53 M8b – the famous-name card', () => {
  it('prints the past and the trade in the engine\'s words; the plain elite card prints neither', async () => {
    await setLocale('en')
    const w = await market(PHONE)
    const { famous, plain } = eliteCards(w)
    expect(famous.get('.cm-pedigree-past').text()).toBe(PAST)
    expect(famous.get('.cm-pedigree-trade').text()).toBe(TRADE)
    expect(plain.find('.cm-pedigree-past').exists()).toBe(false)
    expect(plain.find('.cm-pedigree-trade').exists()).toBe(false)
    expect(plain.text()).not.toContain(PAST)
    expect(plain.text()).not.toContain(TRADE)
    // exactly one pedigreed card on the whole market
    expect(w.findAll('.cm-pedigree-past').length).toBe(1)
    expect(w.findAll('.cm-pedigree-trade').length).toBe(1)
    w.unmount()
  })

  it('under ru the lines are the catalog rows of the engine\'s sentences', async () => {
    resetI18nForTests(null)
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = await market(PHONE)
    const { famous, plain } = eliteCards(w)
    expect(RU[PAST], 'RU row exists').toBeTruthy()
    expect(RU[TRADE], 'RU row exists').toBeTruthy()
    expect(famous.get('.cm-pedigree-past').text()).toBe(RU[PAST])
    expect(famous.get('.cm-pedigree-trade').text()).toBe(RU[TRADE])
    expect(plain.find('.cm-pedigree-past').exists()).toBe(false)
    expect(plain.find('.cm-pedigree-trade').exists()).toBe(false)
    w.unmount()
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    for (const lang of ['en', 'ru'] as const) {
      it(`fits at ${vp.width}x${vp.height} (${lang}): both lines wrap inside the card and the hire row stays on the phone`, async () => {
        if (lang === 'ru') {
          resetI18nForTests(null)
          installCatalog('ru', RU)
        }
        await setLocale(lang)
        const w = await market(vp)
        const { famous } = eliteCards(w)
        const row = famous.element
        // the card (the Hire row is the whole button) is left no more than the phone and still some room
        const rowRoom = availableWidth(row, vp)
        expect(rowRoom, 'the card has room').toBeGreaterThan(0)
        expect(rowRoom, 'the card is inside the phone').toBeLessThanOrEqual(vp.width)
        expect(famous.text().length).toBeGreaterThan(0)
        for (const sel of ['.cm-pedigree-past', '.cm-pedigree-trade']) {
          const el = famous.get(sel).element
          const room = availableWidth(el, vp)
          expect(room, `${sel} room`).toBeGreaterThan(0)
          expect(room, `${sel} room is inside the phone`).toBeLessThanOrEqual(vp.width)
          expect(getComputedStyle(el).whiteSpace, `${sel} may wrap`).not.toBe('nowrap')
          expect(demandedWidth(el, room), `${sel} demands no more than its room`).toBeLessThanOrEqual(room)
        }
        w.unmount()
      })
    }
  }
})
