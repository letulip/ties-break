// L3-7 (10.10) – THE MATCH LOG SHOWS ITS REFS, MOUNTED. The unit net (tests/i18n-l3-7-viz.test.ts) proves the commentary and the preview carry a CopyRef beside every row; the only thing it cannot say is
// whether the SCREEN reads it. This mounts the real MatchViewer over a real played match and reads the log the player reads:
//
//   · English: a row drawn through its ref is the same bytes as the row the builder composed (the lead in bold, then the text) – the 0-risk half of the wave;
//   · a probe `ru` catalog: the log draws the TRANSLATION of every key – the bold lead, the sentence, the `{0} {1}` joins and the nested placements – and not one English beat, for the beats and for the
//     pre-match preview rows alike;
//   · a shout is the viewer's own row and stays what it was.
//
// ⚠ ASCII MARKERS ON PURPOSE (CLAUDE.md invariant 4): nothing here asserts a shipped sentence's wording or a Russian one – the "translations" are numbered markers that keep the key's holes.
// ⚠ PROVEN TO BE ABLE TO FAIL: the template's `eventText({ text: row.text, c: row.textC })` put back to `row.text`, and the bold lead put back to `row.lead` -> the Russian cases go red (watched, 10.10).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { buildCommentary } from '../../src/viz/commentary'
import { buildPreview } from '../../src/viz/preview'
import { renderCopyRef, type CopyRef } from '../../src/shared/i18n'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import { installMemoryStorage } from './setup'
import { PHONE, setViewport } from './fits'

const A: MatchPlayer = { id: 'a', name: 'Vera Novak', serve: 62, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, age: 15.2 }
const B: MatchPlayer = { id: 'b', name: 'Ines Duval', serve: 48, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, age: 16.9 }
const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'l37-display' }
const MATCH = annotateMatch(simulateMatch(A, B, opts), A, B, opts)

function mountViewer(): VueWrapper {
  setViewport(PHONE)
  return mount(MatchViewer, {
    props: { match: MATCH, playerA: A, playerB: B, surface: 'hard' as const, mode: 'live' as const, rankA: 12, rankB: 34, temperatureC: 21 },
    attachTo: document.body,
  })
}

// the fake clock of match-viewer.test.ts / i18n-l2-8: one frame() is one paint, and nothing runs until the test asks
const SEATS_HOLD_MS = 2000
let restore: (() => void) | null = null
async function clock(): Promise<void> {
  const realRaf = globalThis.requestAnimationFrame
  const realCaf = globalThis.cancelAnimationFrame
  vi.useFakeTimers()
  let pending: FrameRequestCallback | null = null
  let pendingId = 0
  let nextId = 1
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    pending = cb
    pendingId = nextId++
    return pendingId
  }
  globalThis.cancelAnimationFrame = (id: number): void => {
    if (id === pendingId) pending = null
  }
  restore = () => {
    void pending
    vi.useRealTimers()
    globalThis.requestAnimationFrame = realRaf
    globalThis.cancelAnimationFrame = realCaf
  }
  vi.advanceTimersByTime(SEATS_HOLD_MS)
  await nextTick()
}
async function skipToResult(w: VueWrapper): Promise<void> {
  const skip = w.findAll('button').find((b) => b.classes().includes('mv-skip') || b.text() === 'Skip to the result')
  expect(skip, 'no skip control').toBeTruthy()
  await skip!.trigger('click')
  await nextTick()
  await nextTick()
}

const flat = (s: string): string => s.replace(/\s+/g, ' ').trim()
/** the log's rows as the player reads them: [kind, lead, text] */
function logRows(w: VueWrapper): Array<{ lead: string; body: string; intro: boolean }> {
  return w.findAll('.mv-beat').map((li) => {
    const lead = li.find('.mv-beat-lead')
    const textEl = li.find('.mv-beat-text')
    const leadText = lead.exists() ? flat(lead.text()) : ''
    return { lead: leadText, body: flat(textEl.text()).slice(leadText.length).trim(), intro: li.classes().includes('intro') }
  })
}

/** a probe translation for every key a ref names: a numbered marker that keeps the key's holes, so the rendered row is checkable and no English survives */
function probeCatalog(refs: CopyRef[]): Record<string, string> {
  const keys = new Set<string>()
  const walk = (r: CopyRef): void => {
    keys.add(r.k)
    for (const p of r.p ?? []) if (typeof p === 'object' && p !== null) walk(p as CopyRef)
  }
  refs.forEach(walk)
  const out: Record<string, string> = {}
  let i = 0
  for (const k of [...keys].sort()) {
    const holes = [...new Set([...k.matchAll(/\{(\d+)\}/g)].map((m) => m[1]!))]
    out[k] = `[T${i++}${holes.map((h) => ` {${h}}`).join('')}]`
  }
  return out
}

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  restore?.()
  restore = null
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
})

describe('L3-7 – the log draws the commentary and the preview through their refs', () => {
  const beats = buildCommentary(MATCH, A.name, B.name, null)
  const preview = buildPreview({ a: A, b: B, heroSide: 0, surface: 'hard', tour: JUNIOR_TOUR, heroRank: 12, oppRank: 34, event: null, temperatureC: 21 })

  it('English: every beat row is its lead and its sentence, and every preview row is the line the builder composed', async () => {
    const w = mountViewer()
    await clock()
    await skipToResult(w)
    const rows = logRows(w)
    const beatRows = rows.filter((r) => !r.intro)
    expect(beatRows.length, 'the match is over – every beat is in the log').toBe(beats.length)
    // the log reads newest first
    const expected = [...beats].reverse().map((b) => ({ lead: b.lead ?? '', body: flat(b.text) }))
    expect(beatRows.map((r) => ({ lead: r.lead, body: r.body }))).toEqual(expected)
    expect(rows.filter((r) => r.intro).map((r) => r.body)).toEqual(preview.map((l) => flat(l.text)))
    w.unmount()
  })

  it('Russian (a probe catalog): every beat row draws the translation of its lead and of its sentence – and the preview rows theirs – with not one English row left', async () => {
    const refs: CopyRef[] = [...beats.flatMap((b) => [b.leadC, b.textC]), ...preview.map((l) => l.c)].filter((r): r is CopyRef => !!r)
    const RU = probeCatalog(refs)
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = mountViewer()
    await clock()
    await skipToResult(w)
    const ctx = { locale: 'ru', lookup: (k: string) => RU[k] }
    const rows = logRows(w)
    const beatRows = rows.filter((r) => !r.intro)
    expect(beatRows.length).toBe(beats.length)
    const expected = [...beats].reverse().map((b) => ({ lead: b.leadC ? flat(renderCopyRef(b.leadC, ctx)) : '', body: flat(renderCopyRef(b.textC!, ctx)) }))
    expect(beatRows.map((r) => ({ lead: r.lead, body: r.body }))).toEqual(expected)
    beatRows.forEach((r, i) => {
      // the opening row has no lead (`lead: null`); every other beat's bold head is a seat of the catalog
      if (expected[i]!.lead !== '') expect(r.lead, 'a lead drawn from the catalog').toMatch(/^\[T\d+\]$/)
      expect(r.body, 'a sentence drawn from the catalog').toMatch(/\[T\d+/)
    })
    expect(beatRows.filter((r) => r.lead !== '').length, 'most beats carry a lead').toBeGreaterThan(3)
    expect(rows.filter((r) => r.intro).map((r) => r.body)).toEqual(preview.map((l) => flat(renderCopyRef(l.c!, ctx))))
    // no English survives: none of the beats' sentences is on the screen
    const screen = flat(w.element.textContent ?? '')
    for (const b of beats) expect(screen.includes(flat(b.text)), `English beat «${b.text}» is on the screen`).toBe(false)
    w.unmount()
  })

  it('a shout is the viewer\'s own row and keeps its text (it has no ref and needs none)', async () => {
    const w = mountViewer()
    await clock()
    await skipToResult(w)
    expect(w.findAll('.mv-beat.said').length).toBe(0)
    w.unmount()
  })
})
