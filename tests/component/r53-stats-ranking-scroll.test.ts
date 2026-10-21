// R53 N6 (22.10) – the Stats ranking table scrolls inside its own box. The closing e2e (r51-overflow-sweep, ru 320px) found the
// page 4px wider than the phone with the points column the deepest element: the table sat bare in the section.
// happy-dom does no layout, so the fit is the suite's width model (`fits.ts`) plus the wrapper's computed overflow.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, availableWidth, setViewport } from './fits'

Element.prototype.scrollIntoView = function () {}
const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

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

async function mountStats(): Promise<VueWrapper> {
  // ⚠ the viewport BEFORE the mount – happy-dom caches a media query on the first computed-style read
  setViewport(NARROW_PHONE)
  useGameStore().snapshot = toSnapshot(createWorld('r53-stats-scroll', { ...DEFAULT_PROFILE }))
  return mount(StatsScreen, { global: { stubs: { teleport: true } }, attachTo: document.body }) as VueWrapper
}

describe('R53 N6 – the ranking table keeps the page at 320px', () => {
  for (const lang of ['en', 'ru'] as const) {
    it(`(${lang}) the table sits in its own overflow-x box and that box is no wider than the phone`, async () => {
      if (lang === 'ru') installCatalog('ru', RU)
      await setLocale(lang)
      const w = await mountStats()
      const table = w.get('#stats-ranking table').element
      const box = table.parentElement as HTMLElement
      expect(box.classList.contains('stats-ranking-scroll'), 'the table has a scroller parent').toBe(true)
      expect(getComputedStyle(box).overflowX, 'the table scrolls in its own box, never the document').toMatch(/auto|scroll/)
      const room = availableWidth(table, NARROW_PHONE)
      expect(room, 'the scroller has room').toBeGreaterThan(0)
      expect(room, 'the scroller is inside the phone').toBeLessThanOrEqual(NARROW_PHONE.width)
      w.unmount()
    })
  }
})
