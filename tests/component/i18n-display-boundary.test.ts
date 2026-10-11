// RU-22 (11.10) – THE DISPLAY BOUNDARY, MOUNTED. docs/localization/ru-display-words-2026-10.md, src/i18n/words.ts.
//
// WHAT THE UNIT NET CANNOT SAY. tests/i18n-display-words.test.ts proves the readers answer in Russian and the table names the right holes; it cannot say whether a SCREEN draws the reading. The engine hands the screen
// an English label (`row.label`, `ev.surface`, `option.note` …) and the screen used to print it; now it reads it through `engineText` / `engineWord`. This file mounts the real components on real data and asks, per site:
//
//   · English: the text drawn is the engine's label, byte for byte (the reader returns its input under `en`, so nothing a player reads today has moved);
//   · Russian (the real ru.json, installed the way the app does it): the text drawn is THAT label's Russian row, read by key – and never the English;
//   · the carpet's ru arm (`xxCarpet.ts` `ruRawWords`) sees no engine word of the vocabulary left on the surface – and, with the label rows deleted from the catalog, it SEES them (the mutation arm).
//
// ⚠ NO CYRILLIC IS TYPED HERE: every expectation is read from ru.json by key. The hook-off control (the same card with `RenderContext.words` switched off) is tests/component/i18n-display-boundary-off.test.ts.
import { vi } from 'vitest'

vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn(async () => ({ ok: false })) }
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { Component } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import SupportStaffTab from '../../src/components/SupportStaffTab.vue'
import SkillsRadar from '../../src/components/SkillsRadar.vue'
import SurfaceMark from '../../src/components/ui/SurfaceMark.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { ECONOMY } from '../../src/engine/economy'
import { PSY_FOCUS_LABEL, PSY_FOCUS_LINE } from '../../src/engine/world/psychologist'
import { useGameStore } from '../../src/stores/game'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import type { Snapshot } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'
import { coached, fresh, selfCoached, shopSnap } from './xxPoses'
import { SHELL, posed, ruRawWords, type Surface } from './xxCarpet'

Element.prototype.scrollIntoView = function () {}

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const reading = (english: string): string => {
  const v = RU[english]
  expect(v, `ru.json carries a row for «${english}»`).toBeDefined()
  return v as string
}

/** Mount a component on a snapshot the way the carpet does (attached, teleports in place). */
async function mountOn(comp: Component, snap: Snapshot, props: Record<string, unknown> = {}, after?: (w: VueWrapper) => Promise<void>): Promise<VueWrapper> {
  useGameStore().snapshot = snap
  const w = mount(comp, { ...SHELL, ...props }) as VueWrapper
  if (after) await after(w)
  await flushPromises()
  return w
}
const texts = (w: VueWrapper, selector: string): string[] => w.findAll(selector).map((e) => e.text().replace(/\s+/g, ' ').trim())

async function inRussian(): Promise<void> {
  installCatalog('ru', RU)
  await setLocale('ru')
}

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  document.body.innerHTML = ''
  resetI18nForTests(null)
  document.documentElement.lang = 'en'
})

interface Site {
  id: string
  /** mount the component and return the wrapper – a fresh one per language */
  mount: () => Promise<VueWrapper>
  /** the selectors whose text is an engine label, and the English labels they may carry */
  reads: Array<{ selector: string; english: readonly string[]; atLeast: number }>
}

const staff = (hired: boolean): Snapshot =>
  ({ ...coached(), masseurUnlocked: true, psychologistUnlocked: true, sparringUnlocked: true, masseurHired: hired, psychologistHired: hired, sparringHired: hired }) as unknown as Snapshot

const rungLabels = [...ECONOMY.masseur.rungs, ...ECONOMY.psychologist.rungs, ...ECONOMY.sparring.rungs].map((r) => r.label)
const vacationLabels = ECONOMY.vacation.packages.map((p) => p.label)
const vacationBlurbs = ECONOMY.vacation.packages.map((p) => p.blurb)

const SITES: Site[] = [
  {
    id: 'PlanWeekSheet – the vacation packages',
    mount: () => mountOn(PlanWeekSheet, fresh(), { props: { week: 20, initialTab: 'vacation' } }),
    reads: [
      { selector: '.pkg-label', english: vacationLabels, atLeast: 5 },
      { selector: '.pkg-blurb', english: vacationBlurbs, atLeast: 5 },
    ],
  },
  {
    id: 'SupportStaffTab – the rungs, their notes and the psychologist\'s years',
    mount: () => mountOn(SupportStaffTab, staff(true)),
    reads: [
      { selector: '.rung-label', english: rungLabels, atLeast: 6 },
      { selector: '.rung-note', english: ECONOMY.sparring.rungs.map((r) => r.note), atLeast: 1 },
      { selector: '.staff-focus-name', english: Object.values(PSY_FOCUS_LABEL), atLeast: 3 },
      { selector: '.staff-focus-blurb', english: Object.values(PSY_FOCUS_LINE), atLeast: 3 },
    ],
  },
  {
    id: 'SkillsRadar – the coach\'s notes',
    mount: () => mountOn(SkillsRadar, selfCoached(), { props: { axes: selfCoached().radar, title: 'chart' } }),
    reads: [{ selector: '.radar-note-text', english: (selfCoached().radar ?? []).flatMap((a) => (a.note ? [a.note] : [])), atLeast: 1 }],
  },
]

describe('the wrapped sites draw the engine\'s label in English and its Russian row under ru.json', () => {
  for (const site of SITES) {
    it(`${site.id}: English is the label as written`, async () => {
      const w = await site.mount()
      for (const r of site.reads) {
        const got = texts(w, r.selector)
        expect(got.length, `${site.id}: ${r.selector} drawn (a vacuous read is red)`).toBeGreaterThanOrEqual(r.atLeast)
        for (const text of got) expect(r.english, `${r.selector}: «${text}» is one of the engine's labels`).toContain(text)
      }
      w.unmount()
    })

    it(`${site.id}: Russian is the label's own row, read by key – and the English is nowhere`, async () => {
      await inRussian()
      const w = await site.mount()
      for (const r of site.reads) {
        const got = texts(w, r.selector)
        expect(got.length, `${site.id}: ${r.selector} drawn`).toBeGreaterThanOrEqual(r.atLeast)
        const allowed = new Set(r.english.map((e) => RU[e]?.replace(/\s+/g, ' ').trim()).filter((v): v is string => v !== undefined))
        for (const text of got) {
          expect(r.english, `${r.selector}: «${text}» is not the English label`).not.toContain(text)
          expect(allowed.has(text), `${r.selector}: «${text}» is the Russian row of one of the labels`).toBe(true)
        }
      }
      w.unmount()
    })
  }

  it('SurfaceMark: the court is the lower-case Russian word under ru.json and the engine\'s id under English', async () => {
    for (const surface of ['hard', 'clay', 'grass'] as const) {
      const en = mount(SurfaceMark, { props: { surface } })
      expect(en.text()).toBe(surface)
      en.unmount()
    }
    await inRussian()
    for (const [surface, key] of [['hard', 'Hard'], ['clay', 'Clay'], ['grass', 'Grass']] as const) {
      const ru = mount(SurfaceMark, { props: { surface } })
      expect(ru.text()).toBe(reading(key).toLowerCase())
      ru.unmount()
    }
  })

  it('the shop: every row of every shelf names its asset and its blurb in Russian', async () => {
    const assets = ECONOMY.shop.catalogue
    const english = new Set<string>(assets.flatMap((a) => [a.label, a.blurb]))
    let rowsSeen = 0
    for (const lang of ['en', 'ru'] as const) {
      if (lang === 'ru') await inRussian()
      for (let cat = 0; cat < 6; cat++) {
        document.body.innerHTML = ''
        setActivePinia(createPinia())
        const w = await mountOn(MoneyScreen, shopSnap(), {}, async (m) => {
          await m.findAll('.money-tabs button')[3]!.trigger('click')
          await flushPromises()
          const cats = m.findAll('.shelf-cat')
          if (cats[cat]) await cats[cat]!.trigger('click')
        })
        const got = [...texts(w, '.shop-row-name'), ...texts(w, '.shop-row-blurb')]
        rowsSeen += got.length
        for (const text of got) {
          if (lang === 'en') expect(english.has(text), `English «${text}» is the engine's label or blurb`).toBe(true)
          else {
            expect(english.has(text), `Russian: «${text}» is still the English`).toBe(false)
            expect(CYR.test(text), `Russian: «${text}»`).toBe(true)
          }
        }
        w.unmount()
      }
    }
    expect(rowsSeen, 'the shelves drew rows in both languages (a vacuous walk is red)').toBeGreaterThan(20)
  })
})

const CYR = /\p{Script=Cyrillic}/u

describe('the carpet\'s ru arm bites: with the label rows deleted from the catalog, the same surfaces print engine words', () => {
  const surfaces: Surface[] = [
    posed('PlanWeekSheet: vacation', 'card', '', PlanWeekSheet, fresh, { props: { week: 20, initialTab: 'vacation' } }),
    posed('SupportStaffTab: all hired', 'card', '', SupportStaffTab, () => staff(true)),
    posed('SkillsRadar', 'card', '', SkillsRadar, selfCoached, () => ({ props: { axes: selfCoached().radar, title: 'chart' } }), undefined, { words: () => ['chart'] }),
  ]
  for (const s of surfaces) {
    it(`${s.id}: the real catalog – nothing raw; the catalog without the label rows – the labels come back`, async () => {
      expect(await ruRawWords(s)).toEqual([])
      const cut = await ruRawWords(s, (ru) => {
        for (const label of [...vacationLabels, ...vacationBlurbs, ...rungLabels, ...ECONOMY.sparring.rungs.map((r) => r.note), ...Object.values(PSY_FOCUS_LABEL), ...Object.values(PSY_FOCUS_LINE), ...(selfCoached().radar ?? []).flatMap((a) => (a.note ? [a.note] : []))]) delete ru[label]
        return ru
      })
      expect(cut.length, `${s.id}: deleting the rows must put engine words back on the surface`).toBeGreaterThan(0)
    })
  }
})
