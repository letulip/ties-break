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
// ⭐ PHASE 2 (12.10, r49 №2 ф2) – the week-only labels joined: `weekLabel`, `weekYearLabel` and
// `seasonWeekRange` fill the FORMAT REGISTRY's patterns (src/i18n/formats.ts, the one reader of
// formats.ru.json – his compiled cells, so the expectations here read THAT file, never a Cyrillic
// literal); `weeksLeftBracket` rides catalog keys (ICU plural – a pattern cannot pluralise); and an
// engine-baked label in a `t()` hole re-spells through the `week` hole class (`localizedWeekLabel`).
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
import { formatMessage, translate } from '../../src/shared/i18n'
import { installCatalog, resetI18nForTests, setLocale, t } from '../../src/i18n'
import { careerSnapshot } from '../helpers/career'
import { installMemoryStorage } from './setup'
import { PHONE, setViewport } from './fits'
import type { AlbumNote, AlbumSheetModel, Snapshot } from '../../src/shared/protocol'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
/** His compiled row, rendered by the real formatter – the one way a Russian word enters an expectation here. */
const ru = (key: string, params?: Record<string, string | number>): string => translate(key, params, { locale: 'ru', lookup: (k) => RU[k] })
/** ⭐ ф2 – his compiled REGISTRY pattern (formats.ru.json), filled: the one way a Russian week form enters an expectation here. */
const FORMATS = JSON.parse(readFileSync('src/i18n/formats.ru.json', 'utf8')) as Record<string, string>
const pat = (id: string, params: Record<string, string | number>): string => formatMessage(FORMATS[id]!, params, { locale: 'ru' })

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

  it('⭐ ф2 – the four week-only names, every branch, the default and a succession epoch', () => {
    for (const w of WEEKS) {
      expect(display.weekLabel(w)).toBe(shared.weekLabel(w))
      expect(display.weekYearLabel(w)).toBe(shared.weekYearLabel(w))
      expect(display.weekLabel(w, 2048)).toBe(shared.weekLabel(w, 2048))
      expect(display.weekYearLabel(w, 2048)).toBe(shared.weekYearLabel(w, 2048))
    }
    for (const [a, b] of [[0, 9], [0, 0], [9, 33], [41, 51]] as const) expect(display.seasonWeekRange(a, b)).toBe(shared.seasonWeekRange(a, b))
    // the bracket's three branches: left <= 0, left === 1, left > 1
    for (const [until, at] of [[6, 6], [5, 6], [7, 6], [20, 6], [27, 26]] as const) expect(display.weeksLeftBracket(until, at)).toBe(shared.weeksLeftBracket(until, at))
    expect(display.localizedWeekLabel("W14 '31")).toBe("W14 '31")
    expect(display.localizedWeekLabel('W27 2033')).toBe('W27 2033')
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

  it('weekDateLine: the week half rides the registry pattern (the retired key `W{week} {year}` compiles nowhere), the span is the collapsed form', () => {
    // ⚠ RE-AIMED 12.10 r49 №2 ф2 – the wiring round the pin was waiting for (spec :198): one home per fact – the week half IS `dates.weekYearLabel`'s fill.
    expect(display.weekDateLine(26)).toBe(`${pat('dates.weekYearLabel', { week: 27, year: 2031 })} · ${ru('July {day}', { day: '7–13' })}`)
    expect(RU['W{week} {year}'], 'the phase-1 stand-in key RETIRED into the registry').toBeUndefined()
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

  it('⭐ ф2 – the week-only labels are the REGISTRY patterns, filled: his compiled cells, never a literal', () => {
    // ⚠ RE-AIMED 12.10 r49 №2 ф2 (this arm was «phase 2 is untouched»): the shared English is frozen as ever; the display names fill formats.ru.json.
    expect(shared.weekLabel(13)).toBe("W14 '31")
    expect(shared.seasonWeekRange(0, 9)).toBe('W1-10')
    expect(RU["W14 '31"], 'a formatter output still compiles into the registry, never the catalog').toBeUndefined()
    expect(display.weekLabel(13)).toBe(pat('dates.weekLabel', { week: 14, yy: '31' }))
    expect(display.weekLabel(13)).not.toBe("W14 '31")
    expect(display.weekYearLabel(26, 2033)).toBe(pat('dates.weekYearLabel', { week: 27, year: 2033 }))
    expect(display.seasonWeekRange(0, 9)).toBe(pat('dates.seasonWeekRange', { a: 1, b: 10 }))
    expect(display.seasonWeekRange(0, 9)).not.toBe('W1-10')
  })

  it('⭐ ф2 – the weeks-left bracket is three catalog keys, the counted one an ICU plural over his two samples', () => {
    expect(display.weeksLeftBracket(6, 6)).toBe(ru('(last week)'))
    expect(display.weeksLeftBracket(7, 6)).toBe(ru('(1 week left)'))
    expect(display.weeksLeftBracket(20, 6)).toBe(ru('({weeks} weeks left)', { weeks: 14 }))
    // the plural arms his samples imply (one / many), read from the compiled rows – never typed here
    expect(ru('({weeks} weeks left)', { weeks: 21 })).toContain('21')
    expect(ru('({weeks} weeks left)', { weeks: 14 })).not.toBe('({weeks} weeks left)')
    expect(display.weeksLeftBracket(20, 6)).not.toBe('(14 weeks left)')
  })

  it('⭐ ф2 – an engine-baked label in a t() hole re-spells through the `week` class: ru is the registry form, en is byte-identical', async () => {
    // the real path end to end: the app's own t() (src/i18n) over the real ru.json, the words hook included
    installCatalog('ru', RU)
    await setLocale('ru')
    const out = t('Booked: {0} – {1}', ['Camping road-trip', "W33 '31"])
    expect(out).toContain(pat('dates.weekLabel', { week: 33, yy: '31' }))
    expect(out).not.toContain("W33 '31")
    // and the named diary row rides the same reader
    const diary = t('Out with the {injury} – back {week}.', { injury: 'knee strain', week: "W12 '31" })
    expect(diary).toContain(pat('dates.weekLabel', { week: 12, yy: '31' }))
    expect(diary).not.toContain("W12 '31")
    // en byte-identity: the SAME call under en is the sentence as the engine wrote it
    resetI18nForTests(null)
    expect(t('Booked: {0} – {1}', ['Camping road-trip', "W33 '31"])).toBe("Booked: Camping road-trip – W33 '31")
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
    // ⚠ RE-AIMED 12.10 r49 №2 ф2: the week half is the REGISTRY pattern now (`dates.weekYearLabel` – the stand-in key retired)
    const line = `${pat('dates.weekYearLabel', { week: snap.week + 1, year: snap.startYear ?? 2031 })} · ${ru('January {day}', { day: `${p.startDay}–${p.endDay}` })}`
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
