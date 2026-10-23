// R53 L1 (21.10) – the medical-team sentence is ONE BLOCK UNDER EACH TIER'S TITLE, not a line on every card.
// The owner: the same last phrase repeats four times and the cards are already over-full. The words are the
// engine's `coachLoadNote(tier)` – read from the engine here, never retyped.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { coachLoadNote } from '../../src/engine/world/coachMarket'
import { HIREABLE_TIERS } from '../../src/engine/coach'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { SHELL } from './xxCarpet'
import { NARROW_PHONE, PHONE, assertInlineRowFits, availableWidth, demandedWidth, setViewport, type Viewport } from './fits'

Element.prototype.scrollIntoView = function () {}
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

async function market(vp: Viewport): Promise<VueWrapper> {
  // ⚠ the viewport BEFORE the mount – happy-dom caches a media query on the first computed-style read
  setViewport(vp)
  const snap = toSnapshot(createWorld('r53-tier-note', { ...DEFAULT_PROFILE, coachTier: 'middle' }))
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

describe('R53 L1 – the tier\'s medical-team sentence', () => {
  it('prints once per tier, directly under the header, in the engine\'s words; no card carries it', async () => {
    await setLocale('en')
    const w = await market(PHONE)
    const blocks = w.findAll('.tier-block')
    expect(blocks.length, 'the market shows tiers').toBeGreaterThan(0)
    const seen = new Set<string>()
    for (const block of blocks) {
      const tier = block.attributes('id')!.replace('coach-tier-', '') as (typeof HIREABLE_TIERS)[number]
      const notes = block.findAll('.tier-note')
      expect(notes.length, `${tier}: exactly one block`).toBe(1)
      expect(notes[0].text()).toBe(coachLoadNote(tier))
      expect(block.element.children[1], `${tier}: right under .tier-head`).toBe(notes[0].element)
      expect(block.element.children[0].classList.contains('tier-head')).toBe(true)
      seen.add(notes[0].text())
      for (const card of block.findAll('.cm-row')) {
        expect(card.text(), `${tier}: the card repeats nothing of it`).not.toContain(coachLoadNote(tier))
        expect(card.find('.cm-load').exists()).toBe(false)
      }
    }
    expect(seen.size, 'a different sentence per rung').toBe(blocks.length)
    w.unmount()
  })

  it('under ru the block prints the RU row (catalog entry of the engine\'s sentence)', async () => {
    resetI18nForTests(null)
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = await market(PHONE)
    for (const block of w.findAll('.tier-block')) {
      const tier = block.attributes('id')!.replace('coach-tier-', '') as (typeof HIREABLE_TIERS)[number]
      expect(block.get('.tier-note').text()).toBe(RU[coachLoadNote(tier)])
    }
    w.unmount()
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`fits at ${vp.width}x${vp.height}: the header's four spans stay on their line and the block cannot widen the page`, async () => {
      await setLocale('en')
      const w = await market(vp)
      for (const block of w.findAll('.tier-block')) {
        const head = block.get('.tier-head').element
        const note = block.get('.tier-note').element
        assertInlineRowFits(head, Array.from(head.children), vp, `${block.attributes('id')} header`)
        const room = availableWidth(note, vp)
        expect(demandedWidth(note, room), `${block.attributes('id')} note`).toBeLessThanOrEqual(room)
        expect(getComputedStyle(note).whiteSpace).not.toBe('nowrap')
        expect(getComputedStyle(note).display).toBe('block')
      }
      w.unmount()
    })
  }
})
