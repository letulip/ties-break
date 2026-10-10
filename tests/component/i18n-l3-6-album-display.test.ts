// L3-6 (10.10) – THE ALBUM IS DRAWN FROM ITS REFS. The mounted half of tests/i18n-l3-6-endings-album.test.ts §9–§12: the engine proves every ref renders to the string beside it; THIS file proves the screen
// draws the ref and not the string, on real books from the posed set (a voice's whole book, a graduate's checklist, the heirloom's, the career whose Slam hangs the tail ticket).
//
// The method is the L3-4 / L3-5 one: mount the real screen under English and under a PROBE `ru` catalog whose values are ASCII markers (no Russian in this file), and read the DOM.
//   1. UNDER ENGLISH the screen draws exactly the strings the engine wrote (the mapping through `albumText.ts` is the identity on text)
//   2. UNDER A PROBE every field that has a ref follows the catalog - chapter heads, the rail, lines, notes, captions, alts, tickets, tags, the checklist - and a flip back restores the English
//   3. A FIELD WITH NO REF (a venue, a date line, a tier label) draws as the engine wrote it, under any locale
//   4. THE PLACEMENT MEASURES WHAT IS DRAWN: a long probe line wraps to more rows than the English one (the resolver reads the mapped sheet, not the engine's)
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import { shownChapter, shownSheet } from '../../src/composables/albumText'
import { placeSheet } from '../../src/components/album/albumPlacement'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { renderCopyRef, type CopyRef } from '../../src/shared/i18n'
import { installMemoryStorage } from './setup'
import { PHONE, setViewport } from './fits'
import { posedBooks } from '../helpers/l3-6-album-set'
import type { AlbumBook } from '../../src/shared/protocol'

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

/** every ref anywhere in a book */
function refsIn(value: unknown, acc: CopyRef[] = []): CopyRef[] {
  if (Array.isArray(value)) value.forEach((v) => refsIn(v, acc))
  else if (typeof value === 'object' && value !== null) {
    const o = value as Record<string, unknown>
    if (typeof o.k === 'string' && Object.keys(o).every((key) => key === 'k' || key === 'p')) acc.push(o as unknown as CopyRef)
    else Object.values(o).forEach((v) => refsIn(v, acc))
  }
  return acc
}

/** a catalog that marks every key the book can ask for: `K<index>`, the holes kept so the params are visible */
function probeOf(book: AlbumBook): { catalog: Record<string, string>; render: (c: CopyRef) => string } {
  const catalog: Record<string, string> = {}
  for (const ref of refsIn(book)) {
    if (catalog[ref.k] !== undefined) continue
    const holes = [...new Set([...ref.k.matchAll(/\{(\d+)\}/g)].map((m) => m[1]!))]
    catalog[ref.k] = `K${Object.keys(catalog).length}${holes.length ? `<${holes.map((h) => `{${h}}`).join('|')}>` : ''}`
  }
  return { catalog, render: (c) => renderCopyRef(c, { locale: 'ru', lookup: (k) => catalog[k] }) }
}

const SELECTORS = [
  '.album-head-title', '.album-head-age', '.album-rail-title', '.album-rail-age',
  '.album-a-line', '.album-b-line', '.album-c-line', '.tb-polaroid-caption', '.album-note-text', '.album-note-when span', '.album-note-list li',
  '.album-pass-foot span', '.album-pass-row span', '.album-tag-place span',
] as const

function drawn(w: VueWrapper): string[] {
  return SELECTORS.flatMap((s) => w.findAll(s).map((n) => flat(n.text())))
}
function alts(w: VueWrapper): string[] {
  return w.findAll('.album-photo img').map((n) => n.attributes('alt') ?? '')
}

function mountBook(book: AlbumBook): VueWrapper {
  setViewport(PHONE)
  return mount(AlbumScreen, { props: { book }, attachTo: document.body })
}

const BOOKS = ['ended natural / lean 1', 'ended peak / lean -1', 'graduate: four years', 'dynasty: rich', 'posed 7 / deep'] as const

describe('L3-6 – the album draws the refs the engine sends', () => {
  for (const label of BOOKS) {
    it(`${label}: English is the engine's bytes; a probe catalog moves every refed field; a flip back restores the English`, async () => {
      const book = posedBooks().find((b) => b.label === label)!.book
      const { catalog, render } = probeOf(book)
      const w = mountBook(book)
      const english = { text: drawn(w), alts: alts(w) }
      expect(english.text.length, 'the screen drew text').toBeGreaterThan(4)

      // 1. English: every drawn string is a string of the wire (the identity of the mapping)
      const wire = new Set<string>()
      for (const s of book.sheets) {
        wire.add(s.chapterTitle).add(s.ageLabel).add(s.line)
        s.frames.forEach((f) => wire.add(f.caption))
        if (s.note) {
          wire.add(s.note.text)
          if (s.note.dateLabel) wire.add(s.note.dateLabel)
          if (s.note.ageLabel) wire.add(s.note.ageLabel)
          s.note.lines.forEach((l) => wire.add(l))
        }
        if (s.ticket) [s.ticket.gate, s.ticket.row, s.ticket.seat, s.ticket.dateLabel].forEach((x) => wire.add(x))
        if (s.tag) [s.tag.place, s.tag.ageLabel].forEach((x) => wire.add(x))
      }
      for (const c of book.chapters) wire.add(c.title).add(c.ageLabel)
      expect(english.text.filter((t) => !wire.has(t)), 'a drawn string the engine did not write').toEqual([])

      // 2. the probe: every drawn string is either a refed field's probe rendering or a field with no ref, unchanged
      await (async () => {
        installCatalog('ru', catalog)
        await setLocale('ru')
        await nextTick()
      })()
      const expectedProbe = new Set<string>()
      const bareFields = new Set<string>()
      const add = (text: string | null, c: CopyRef | null | undefined): void => {
        if (text === null || text === '') return
        if (c) expectedProbe.add(render(c))
        else bareFields.add(text)
      }
      for (const s of book.sheets) {
        add(s.chapterTitle, s.chapterTitleC)
        add(s.ageLabel, s.ageLabelC)
        add(s.line, s.lineC)
        s.frames.forEach((f) => add(f.caption, f.captionC))
        if (s.note) {
          add(s.note.text, s.note.textC)
          add(s.note.dateLabel, undefined)
          add(s.note.ageLabel, s.note.ageLabelC)
          s.note.lines.forEach((l, i) => add(l, s.note!.linesC?.[i] ?? undefined))
        }
        if (s.ticket) {
          add(s.ticket.gate, s.ticket.gateC)
          add(s.ticket.row, s.ticket.rowC)
          add(s.ticket.seat, s.ticket.seatC)
          add(s.ticket.dateLabel, undefined)
        }
        if (s.tag) {
          add(s.tag.place, undefined)
          add(s.tag.ageLabel, s.tag.ageLabelC)
        }
      }
      for (const c of book.chapters) {
        add(c.title, c.titleC)
        add(c.ageLabel, c.ageLabelC)
      }
      const probe = drawn(w)
      expect(probe.filter((t) => !expectedProbe.has(t) && !bareFields.has(t)), 'a drawn string that is neither a ref\'s rendering nor a bare field').toEqual([])
      const moved = probe.filter((t, i) => t !== english.text[i])
      expect(moved.length, 'the probe moved the page').toBeGreaterThan(5)
      // every English string that HAS a ref is gone from the page
      const refed = new Set<string>()
      for (const s of book.sheets) {
        if (s.lineC) refed.add(s.line)
        s.frames.forEach((f) => f.captionC && refed.add(f.caption))
        if (s.note?.textC) refed.add(s.note.text)
        if (s.note?.ageLabelC && s.note.ageLabel) refed.add(s.note.ageLabel)
        if (s.ticket?.gateC) refed.add(s.ticket.gate)
      }
      expect(probe.filter((t) => refed.has(t)), 'a refed English string stayed on the page').toEqual([])
      expect(alts(w).every((a) => a === '' || expectedProbe.has(a) || /^K\d+$/.test(a)), 'an alt stayed English').toBe(true)

      // 3. a flip back
      await setLocale('en')
      await nextTick()
      expect(drawn(w)).toEqual(english.text)
      expect(alts(w)).toEqual(english.alts)
      w.unmount()
    })
  }

  it('the checklists: the heirloom\'s numbers and the graduate\'s league rows follow the catalog through the mapping; the mother\'s name does not', async () => {
    // ⚠ THIS WAS A FINDING, NOT FIXED IN L3-6: `AlbumNoteCard.vue` drew the list only when the note had NO prose (`v-else-if`) and `noteOf` never leaves the prose empty (every corpus note is a
    // sentence), so these lines were on the wire and in the heirloom but on no screen. CLOSED 10.10 by LB-note (decisions.md №38): the card draws the sentence and the list under it, and
    // `tests/component/lb-note-checklist-under.test.ts` holds that. What THIS case proves is still the mapping through the catalog.
    const heir = posedBooks().find((b) => b.label === 'dynasty: rich')!.book.sheets.find((s) => (s.note?.lines.length ?? 0) > 0)!
    expect(shownSheet(heir).note!.lines).toEqual(['Vera Kowalski', 'Best ranking: #4', 'Titles: 5', 'Slams: 1', 'Generation 2'])
    installCatalog('ru', { 'Best ranking: #{0}': 'BEST<{0}>', 'Titles: {0}': 'TITLES<{0}>', 'Slams: {0}': 'SLAMS<{0}>', 'Generation {0}': 'GEN<{0}>' })
    await setLocale('ru')
    await nextTick()
    expect(shownSheet(heir).note!.lines).toEqual(['Vera Kowalski', 'BEST<4>', 'TITLES<5>', 'SLAMS<1>', 'GEN<2>'])
    await setLocale('en')

    const grad = posedBooks().find((b) => b.label === 'graduate: four years')!.book.sheets.find((s) => (s.note?.lines.length ?? 0) > 0)!
    expect(grad.note!.lines).toHaveLength(3)
    expect(shownSheet(grad).note!.lines).toEqual([...grad.note!.lines])
    installCatalog('ru', { 'Year {0}, {1}: Won it': 'WON<{0}|{1}>', 'Year {0}, {1}: Went out in the {2}': 'OUT<{0}|{1}|{2}>' })
    await setLocale('ru')
    await nextTick()
    expect(shownSheet(grad).note!.lines).toEqual(grad.note!.linesC!.map((c) => `${c!.k.endsWith('Won it') ? 'WON' : 'OUT'}<${c!.p!.join('|')}>`))
  })

  it('the mapping is the identity on a book that carries no refs (an older fixture, an heirloom stored by older code)', () => {
    const book = posedBooks().find((b) => b.label === 'posed 7 / deep')!.book
    const bare = JSON.parse(JSON.stringify(book, (key, value) => (/C$/.test(key) && typeof value === 'object' && value !== null ? undefined : value))) as AlbumBook
    for (const s of bare.sheets) {
      const mapped = shownSheet(s)
      expect(JSON.parse(JSON.stringify(mapped))).toEqual(JSON.parse(JSON.stringify(s)))
    }
    for (const c of bare.chapters) expect(shownChapter(c)).toEqual(c)
  })

  it('under English the mapping changes no text of a book that does carry refs', () => {
    const book = posedBooks().find((b) => b.label === 'dynasty: rich')!.book
    for (const s of book.sheets) {
      const mapped = shownSheet(s)
      expect(mapped.chapterTitle).toBe(s.chapterTitle)
      expect(mapped.line).toBe(s.line)
      expect(mapped.note?.lines).toEqual(s.note?.lines)
      expect(mapped.frames.map((f) => [f.alt, f.caption])).toEqual(s.frames.map((f) => [f.alt, f.caption]))
    }
  })

  it('a field with no ref draws as the engine wrote it under any locale: the date line, the venue and the tier on a pass', async () => {
    const book = posedBooks().find((b) => b.label === 'ended natural / lean 1')!.book
    const sheet = book.sheets.find((s) => s.ticket)!
    installCatalog('ru', { [sheet.ticket!.gateC!.k]: 'GATE<{0}>' })
    await setLocale('ru')
    const mapped = shownSheet(sheet)
    expect(mapped.ticket!.gate).toBe(`GATE<${sheet.ticket!.gateC!.p![0]}>`)
    expect(mapped.ticket!.venue).toBe(sheet.ticket!.venue)
    expect(mapped.ticket!.tier).toBe(sheet.ticket!.tier)
    expect(mapped.ticket!.dateLabel).toBe(sheet.ticket!.dateLabel)
    expect(mapped.patch?.name).toBe(sheet.patch?.name)
  })

  it('the placement resolver measures the line the player READS: a longer probe line takes more rows than the English one', async () => {
    const book = posedBooks().find((b) => b.label === 'posed 7 / deep')!.book
    const sheet = book.sheets.find((s) => s.line.length > 10 && s.lineC)!
    const before = placeSheet(shownSheet(sheet))
    installCatalog('ru', { [sheet.lineC!.k]: sheet.line.repeat(4) })
    await setLocale('ru')
    const shown = shownSheet(sheet)
    expect(shown.line).toBe(sheet.line.repeat(4))
    const after = placeSheet(shown)
    // the engine's own (English) sheet through the resolver gives the English geometry; the mapped one gives the geometry of what is drawn
    expect(JSON.stringify(placeSheet(sheet))).toBe(JSON.stringify(before))
    expect(JSON.stringify(after)).not.toBe(JSON.stringify(before))
  })
})
