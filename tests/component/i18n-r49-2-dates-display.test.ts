// ⭐ r49 №2 (12.10) – THE DISPLAY TWIN OF `shared/dates.ts` (src/i18n/dates.ts): month-bearing dates in
// the player's language, phase 1 of the owner's «Даты остались на английском, возможно не только в
// альбоме». Three questions:
//   1. BYTE-IDENTITY UNDER `en` – invariant 4 as an equation: every display formatter equals its shared
//      twin verbatim, over every branch (same month, cross-month, cross-year, a non-default epoch).
//   2. THE RUSSIAN FORMS ARE HIS TABLE'S (ru-formatters-countries-2026-10.md), read from ru.json by key
//      – ⚠ NO CYRILLIC LITERAL LIVES IN THIS FILE (the l2-11 rule): every expectation is composed from
//      the compiled rows through the real formatter (`translate` over the ru catalog).
//   3. THE SCREENS AND THE ALBUM: a mounted ThisWeek header renders the ru date line (and the same mount
//      under en renders the shared formatter's bytes); the album's baked «Jun 3 – Jun 9» re-renders
//      collapsed through `shownSheet`; an unparseable label passes through unchanged.
// Week-only labels (`W14 '31`, `W1-10`, the weeks-left bracket) are phase 2 and still English under ru.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import AlbumNoteCard from '../../src/components/album/AlbumNoteCard.vue'
import { useGameStore } from '../../src/stores/game'
import { shownSheet } from '../../src/composables/albumText'
import * as display from '../../src/i18n/dates'
import * as shared from '../../src/shared/dates'
import { translate } from '../../src/shared/i18n'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import { installMemoryStorage } from './setup'
import { PHONE, setViewport } from './fits'
import type { AlbumNote, AlbumSheetModel, Snapshot } from '../../src/shared/protocol'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
/** His compiled row, rendered by the real formatter – the one way a Russian word enters an expectation here. */
const ru = (key: string, params?: Record<string, string | number>): string => translate(key, params, { locale: 'ru', lookup: (k) => RU[k] })

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

// the branches, by construction of the 2031 calendar: 0 same-month, 3 cross-month, 51 cross-year
const WEEKS = [0, 1, 3, 26, 51, 52, 103, -1]

describe('r49 №2 – byte-identity under en: the display module IS the shared formatter', () => {
  it('all five names, every branch, the default and a succession epoch', () => {
    for (const w of WEEKS) {
      expect(display.monthLabel(w)).toBe(shared.monthLabel(w))
      expect(display.weekSpan(w)).toBe(shared.weekSpan(w))
      expect(display.weekDateLine(w)).toBe(shared.weekDateLine(w))
      expect(display.weekRange(w)).toBe(shared.weekRange(w))
      expect(display.monthLabel(w, 2048)).toBe(shared.monthLabel(w, 2048))
      expect(display.weekRange(w, 2048)).toBe(shared.weekRange(w, 2048))
      expect(display.weekDateLine(w, 2048)).toBe(shared.weekDateLine(w, 2048))
    }
    for (const [m, d] of [[6, 12], [1, 31], [12, 31], [2, 29]] as const) {
      expect(display.birthDateLabel(m, d)).toBe(shared.birthDateLabel(m, d))
    }
    expect(display.localizedDateSpanLabel('Jun 3 – Jun 9')).toBe('Jun 3 – Jun 9')
  })
})

describe('r49 №2 – the Russian forms are the compiled rows, assembled as RU-13D spells them', () => {
  beforeEach(async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
  })

  it('weekSpan: a same-month week COLLAPSES, a cross-month week names both genitives', () => {
    // week 26 of 2031 is Jul 7 – Jul 13 (shared pins it in l2-11); week 3 is Jan 27 – Feb 2
    expect(display.weekSpan(26)).toBe(ru('July {day}', { day: '7–13' }))
    expect(display.weekSpan(3)).toBe(`${ru('January {day}', { day: 27 })} – ${ru('February {day}', { day: 2 })}`)
  })

  it('monthLabel: the axis abbreviation + the typographic short year', () => {
    expect(display.monthLabel(0)).toBe(`${ru('mon|Jan')} ’31`)
    expect(display.monthLabel(26)).toBe(`${ru('mon|Jul')} ’31`)
  })

  it('weekDateLine: the week half rides its own key, the span is the collapsed form', () => {
    expect(display.weekDateLine(26)).toBe(`${ru('W{week} {year}', { week: 27, year: 2031 })} · ${ru('July {day}', { day: '7–13' })}`)
  })

  it('weekRange: the year tail is one key, and a cross-year span carries its first year bare', () => {
    expect(display.weekRange(0)).toBe(ru('{span}, {year}', { span: ru('January {day}', { day: '6–12' }), year: 2031 }))
    expect(display.weekRange(3)).toBe(ru('{span}, {year}', { span: `${ru('January {day}', { day: 27 })} – ${ru('February {day}', { day: 2 })}`, year: 2031 }))
    expect(display.weekRange(51)).toBe(
      ru('{span}, {year}', { span: `${ru('December {day}', { day: 29 })} 2031 – ${ru('January {day}', { day: 4 })}`, year: 2032 }),
    )
  })

  it('birthDateLabel: «12 июня», day first, genitive month, no year and no week', () => {
    expect(display.birthDateLabel(6, 12)).toBe(ru('June {day}', { day: 12 }))
  })

  it('phase 2 is untouched: the week-only labels still print the shared English under ru', () => {
    expect(shared.weekLabel(13)).toBe("W14 '31")
    expect(shared.seasonWeekRange(0, 9)).toBe('W1-10')
    expect(RU["W14 '31"], 'the short-year row still compiles nowhere').toBeUndefined()
  })
})

describe('r49 №2 – the screens and the album draw the localized date', () => {
  function mountWeek(snapshot: Snapshot) {
    setViewport(PHONE)
    useGameStore().snapshot = snapshot
    return mount(ThisWeekScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  }

  it('ThisWeek header: the en mount is the shared formatter verbatim; the ru mount is the display line', async () => {
    const snap = careerSnapshot(2, 'r49n2-dates')
    const en = mountWeek(snap)
    expect(en.text()).toContain(shared.weekDateLine(snap.week, snap.startYear))
    en.unmount()

    installCatalog('ru', RU)
    await setLocale('ru')
    const p = shared.weekSpanParts(snap.week, snap.startYear)
    expect(p.startMonth, 'week 2 of 2031 stays inside January – the collapsed branch').toBe(p.endMonth)
    const line = `${ru('W{week} {year}', { week: snap.week + 1, year: snap.startYear ?? 2031 })} · ${ru('January {day}', { day: `${p.startDay}–${p.endDay}` })}`
    const w = mountWeek(snap)
    expect(w.text()).toContain(line)
    expect(w.text()).not.toContain(shared.weekDateLine(snap.week, snap.startYear))
    w.unmount()
  })

  it('the album note card re-renders the baked «Jun 3 – Jun 9» collapsed; an unparseable label passes through', async () => {
    const note: AlbumNote = { text: 'First trophy', dateLabel: 'Jun 3 – Jun 9', ageLabel: null, lines: [] }
    const sheet = { chapterTitle: '', ageLabel: '', line: '', frames: [], note, ticket: null, tag: null } as unknown as AlbumSheetModel
    expect(shownSheet(sheet).note!.dateLabel).toBe('Jun 3 – Jun 9')

    installCatalog('ru', RU)
    await setLocale('ru')
    const mapped = shownSheet(sheet)
    expect(mapped.note!.dateLabel).toBe(ru('June {day}', { day: '3–9' }))
    const card = mount(AlbumNoteCard, { props: { note: mapped.note! }, attachTo: document.body })
    expect(card.get('.album-note-when').text()).toContain(ru('June {day}', { day: '3–9' }))
    card.unmount()

    const odd = shownSheet({ ...sheet, note: { ...note, dateLabel: 'Opening day' } })
    expect(odd.note!.dateLabel).toBe('Opening day')
    const cross = shownSheet({ ...sheet, note: { ...note, dateLabel: 'Jun 30 – Jul 6' } })
    expect(cross.note!.dateLabel).toBe(`${ru('June {day}', { day: 30 })} – ${ru('July {day}', { day: 6 })}`)
  })
})
