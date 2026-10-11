// RU-22 (11.10) – THE BOOTH'S COUNTS, MOUNTED. docs/localization/ru-display-words-2026-10.md («The booth's counts»), src/i18n/words.ts, src/i18n/wordHoles.ts.
//
// WHAT THE UNIT NET CANNOT SAY. tests/i18n-display-words.test.ts §3c proves the seventeen booth messages read their count through the boundary (the table, the readers, the plural over digits) and that the
// commentary grid reaches sixteen of them. It cannot say whether the SCREEN draws the reading, and the carpet (`xxCarpet.ts`) mounts no match log at all – which is how «Five points in a row for …» went
// unseen: the commentary spells its counts in English (`numberWord(n)`, `Num(n)`) and EVERY match carries several (measured 11.10: 3 to 7 of them in each of forty seeded junior matches). This mounts the real
// MatchViewer over a real played match, skips to the result, and reads the log the player reads:
//
//   · English: every row is the sentence the builder composed, byte for byte (the reader is never asked under `en`);
//   · Russian, the REAL ru.json, the app's own context: every counted row carries the Russian reading of its count – the numeral where the row names nothing after it, the figure where the row's own plural
//     follows it – and no English count word is anywhere in the log;
//   · the control: the same log with the boundary's word hook SWITCHED OFF prints an English count word (or the whole English sentence, where a plural cannot read a word) – so the arm above can fail.
//
// ⚠ NO CYRILLIC IS TYPED HERE: every expectation is read from ru.json by key (`num|two` …) or asks `\p{Script=Cyrillic}`. The fake clock is the one of i18n-l3-7-viz-display.test.ts / i18n-l2-8.
import { vi } from 'vitest'

// the control arm needs the hook switchable between tests: the real readers, `holes` asked only while the gate is open
const gate = vi.hoisted(() => ({ hook: true }))
vi.mock('../../src/i18n/words', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/i18n/words')>()
  return {
    ...real,
    createWordReaders: (...args: Parameters<typeof real.createWordReaders>) => {
      const readers = real.createWordReaders(...args)
      return { ...readers, holes: (...asked: Parameters<typeof readers.holes>) => (gate.hook ? readers.holes(...asked) : asked[1]) }
    },
  }
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { buildCommentary, type Beat } from '../../src/viz/commentary'
import { isCopyRef, type CopyRef } from '../../src/shared/i18n'
import { HOLE_TABLE } from '../../src/i18n/wordHoles'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import type { AnnotatedMatch } from '../../src/shared/matchViz'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import { installMemoryStorage } from './setup'
import { PHONE, setViewport } from './fits'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>
const A: MatchPlayer = { id: 'a', name: 'Vera Novak', serve: 62, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, age: 15.2 }
const B: MatchPlayer = { id: 'b', name: 'Ines Duval', serve: 48, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, age: 16.9 }

type CountClass = 'count' | 'countOpen' | 'digits'
const CLASSES: readonly CountClass[] = ['count', 'countOpen', 'digits']
/** the booth messages the table claims, with the class and the hole – the same rows the readers are driven by (the two older rows of the classes are not the commentary's and never appear in a beat) */
const CLAIM = new Map<string, { cls: CountClass; hole: number }>()
for (const cls of CLASSES) for (const row of HOLE_TABLE[cls]) CLAIM.set(row[0], { cls, hole: row[1] as number })

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
const COUNT_WORD = new RegExp(`\\b(${WORDS.join('|')})\\b`, 'i')

/** every booth ref a beat's sentence carries, nested clauses included */
function boothRefs(b: Beat): Array<{ ref: CopyRef; cls: CountClass; word: string }> {
  const out: Array<{ ref: CopyRef; cls: CountClass; word: string }> = []
  const walk = (r: CopyRef): void => {
    const c = CLAIM.get(r.k)
    if (c) out.push({ ref: r, cls: c.cls, word: String(r.p?.[c.hole]) })
    for (const p of r.p ?? []) if (isCopyRef(p)) walk(p)
  }
  if (b.textC) walk(b.textC)
  return out
}

/** The Russian reading of a count, read from ru.json by key (nothing Russian is typed here): the numeral in lower case, the capital kept where the row opens with it, the figure where the row's plural follows it. */
function reading(cls: CountClass, word: string): string {
  const low = word.toLowerCase()
  if (cls === 'digits') return /^\d+$/.test(low) ? low : String(WORDS.indexOf(low))
  const ru = /^\d+$/.test(low) ? low : (RU[`num|${low}`] as string)
  expect(ru, `ru.json has a numeral for «${word}»`).toBeDefined()
  return cls === 'countOpen' ? ru.charAt(0).toUpperCase() + ru.slice(1) : ru
}
const standsAlone = (text: string, piece: string): boolean => new RegExp(`(^|[^\\p{L}\\d])${piece}($|[^\\p{L}\\d])`, 'u').test(text)

/** the first seeded junior match whose log carries all three classes of counted row – found, not hard-coded, so an engine change that reshuffles the seeds cannot hollow the test */
function theMatch(): { match: AnnotatedMatch; beats: Beat[]; seed: string } {
  for (let i = 0; i < 80; i++) {
    const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: `ru22-booth-${i}` }
    const match = annotateMatch(simulateMatch(A, B, opts), A, B, opts)
    const beats = buildCommentary(match, A.name, B.name, null)
    const classes = new Set(beats.flatMap((b) => boothRefs(b).map((r) => r.cls)))
    if (classes.size === 3) return { match, beats, seed: opts.seed }
  }
  throw new Error('no seeded match among eighty carries all three classes of counted booth row')
}
const PLAYED = theMatch()

function mountViewer(): VueWrapper {
  setViewport(PHONE)
  return mount(MatchViewer, {
    props: { match: PLAYED.match, playerA: A, playerB: B, surface: 'hard' as const, mode: 'live' as const, rankA: 12, rankB: 34, temperatureC: 21 },
    attachTo: document.body,
  })
}

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
/** the log's beat rows as the player reads them, NEWEST FIRST: the sentence after the bold lead */
function logBodies(w: VueWrapper): string[] {
  return w
    .findAll('.mv-beat')
    .filter((li) => !li.classes().includes('intro'))
    .map((li) => {
      const lead = li.find('.mv-beat-lead')
      const leadText = lead.exists() ? flat(lead.text()) : ''
      return flat(li.find('.mv-beat-text').text()).slice(leadText.length).trim()
    })
}

beforeEach(() => {
  gate.hook = true
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
  gate.hook = true
})

describe('RU-22 – the match log reads the commentary\'s counts through the display boundary', () => {
  const counted = PLAYED.beats.map((b, i) => ({ i, refs: boothRefs(b) })).filter((x) => x.refs.length > 0)

  it('the fixture is not vacuous: a played match whose log carries counted rows of all three classes', () => {
    expect(counted.length, `seed ${PLAYED.seed}`).toBeGreaterThanOrEqual(3)
    expect(new Set(counted.flatMap((x) => x.refs.map((r) => r.cls))).size).toBe(3)
  })

  it('English: every row is the sentence the builder composed, byte for byte', async () => {
    const w = mountViewer()
    await clock()
    await skipToResult(w)
    const bodies = logBodies(w)
    expect(bodies.length).toBe(PLAYED.beats.length)
    expect(bodies).toEqual([...PLAYED.beats].reverse().map((b) => flat(b.text)))
    w.unmount()
  })

  it('Russian, the real ru.json: every counted row shows its count in Russian, and no English count word is anywhere in the log', async () => {
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = mountViewer()
    await clock()
    await skipToResult(w)
    const bodies = logBodies(w)
    expect(bodies.length).toBe(PLAYED.beats.length)
    const newestFirst = [...PLAYED.beats].reverse()
    let checked = 0
    bodies.forEach((body, at) => {
      expect(COUNT_WORD.test(body), `an English count word in the Russian log: «${body}»`).toBe(false)
      expect(/\p{Script=Cyrillic}/u.test(body), `Russian: «${body}»`).toBe(true)
      for (const { cls, word } of boothRefs(newestFirst[at] as Beat)) {
        const expected = reading(cls, word)
        expect(standsAlone(body, expected), `«${body}» reads its ${cls} «${word}» as «${expected}»`).toBe(true)
        checked++
      }
    })
    expect(checked, 'counted rows were read').toBeGreaterThanOrEqual(3)
    w.unmount()
  })

  it('the control – the boundary\'s word hook switched off: the same Russian log prints an English count word, or the whole English sentence where a plural cannot read a word', async () => {
    gate.hook = false
    installCatalog('ru', RU)
    await setLocale('ru')
    const w = mountViewer()
    await clock()
    await skipToResult(w)
    const bodies = logBodies(w)
    const english = new Set(PLAYED.beats.map((b) => flat(b.text)))
    const leaking = bodies.filter((body) => COUNT_WORD.test(body) || english.has(body))
    expect(leaking.length, 'with the hook off the counted rows fall back to English words').toBeGreaterThanOrEqual(3)
    w.unmount()
  })
})
