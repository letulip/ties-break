// THE CARPET'S OWN PROOF – wave L4-2. A sweep that has never been seen to fail proves nothing (CLAUDE.md: «mutate the thing you think you are
// covering and watch it fail»), so every judgement the carpet makes is made here on a surface built to deserve it, in both directions:
//   · the ALLOWLIST: shapes never match a word; an engine word is absolved by its exact value; frame copy with a name in it is not;
//   · the OVERFLOW instrument: a word wider than its room is flagged, the same word in a sideways scroller is counted not flagged,
//     a visually hidden description is skipped;
//   · the DISMISS verdict: a real dialog is `ok` at both phones, and strip its height cap and the SAME verdict goes red (the round-20 #3 law);
//   · the LEDGER arithmetic and the REPORT table.
// ⚠ MUTATION ARMS (watched red, outputs in the wave report): (1) `isEngineBorn` returning true -> «frame copy with a name» goes red;
// (2) `measure` ignoring `overflow` -> the flagged-word case goes red; (3) `verdictOf` swallowing the failure -> the stripped-cap case goes red;
// (4) one ledger row deleted / one invented -> the carpet case for that surface goes red (observed vs ledger, both ways).
import { readdirSync, readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'

vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import LocalePrompt from '../../src/components/LocalePrompt.vue'
import { resetI18nForTests } from '../../src/i18n'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, setViewport } from './fits'
import { SHAPES, WORDS, allowlistSize, engineWords, isEngineBorn } from './xxAllowlist'
import { SHELL, findingsOf, measure, renderReport, verdictOf, type Boxes, type Mounted, type Row } from './xxCarpet'
import { FINDINGS } from './xxFindings'
import { CONTAINED, NOT_MOUNTED } from './xxInventory'

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

describe('the allowlist – a shape is never a word, an engine word is an exact value', () => {
  it('no shape matches a heading, a name or a button (the L2-5 lesson: a capitalised unwrapped heading must not pass)', () => {
    for (const word of ['Season Planner', 'Marco Ricci', 'Local Open', 'Continue', 'Quarterfinal', 'Professional', 'National Unranked', 'Close', 'Regional Championship – locked']) {
      expect(SHAPES.filter((re) => re.test(word)).map(String), `«${word}» is copy`).toEqual([])
    }
  })

  it('the shapes it does carry: week labels, dates, money, ranks, tier codes, the product mark', () => {
    for (const shape of ['W12', "W45 '31", 'W45 2031', '$1,234', '-$86', '$254.4M', '#34', 'Oct 20–26, 2031', "Jan '38", 'entry $40', 'x8', 'WTA 250', 'Ties Break', '12', '+3']) {
      expect(SHAPES.some((re) => re.test(shape)), `«${shape}» is not copy`).toBe(true)
    }
    expect(WORDS).toEqual(['hard', 'clay', 'grass', 'carpet'])
    const size = allowlistSize()
    expect(size.shapes).toBe(SHAPES.length)
    expect(size.tableLeaves, 'the engine tables contribute their values').toBeGreaterThan(50)
  })

  it('an engine word is absolved by its EXACT value; frame copy around it, or a fragment of it, is not', () => {
    const words = engineWords([{ name: 'Vera Novak', line: 'Huge potential – most of her game is still ahead of her', title: 'Season 2031 recap' }])
    expect(isEngineBorn(words, 'Vera Novak')).toBe(true)
    expect(isEngineBorn(words, 'V. Novak'), 'the formatter short form of a full name the snapshot carries').toBe(true)
    expect(isEngineBorn(words, 'Vera Novak · W12'), 'engine words and a shape joined by glue').toBe(true)
    expect(isEngineBorn(words, 'Huge potential'), 'the label half of a «label – note» leaf').toBe(true)
    expect(isEngineBorn(words, '– most of her game is still ahead of her'), 'the note half, with its dash').toBe(true)
    expect(isEngineBorn(words, 'Congratulations, Vera Novak!'), 'frame copy with a name in it is a LEAK').toBe(false)
    expect(isEngineBorn(words, 'Season'), 'a fragment of a leaf is not the leaf').toBe(false)
    expect(isEngineBorn(words, 'M'), 'a single letter is «in» every snapshot and proves nothing').toBe(false)
  })
})

describe('the overflow instrument – a word wider than its room is flagged, a scroller and a hidden description are not', () => {
  const WORD = 'Supercalifragilisticexpialidocious'
  const run = (html: string): Boxes => {
    document.body.innerHTML = html
    setViewport(PHONE)
    return measure(document.body, PHONE)
  }

  it('flags an unbreakable word wider than the box it sits in – and not a short one', () => {
    expect(run(`<div style="width:100px"><p>${WORD}</p></div>`).overflow).toEqual([WORD])
    expect(run('<div style="width:100px"><p>Short</p></div>').overflow).toEqual([])
  })

  it('counts, and does not flag, the same word inside a sideways scroller', () => {
    const r = run(`<div style="width:100px; overflow-x:auto"><p>${WORD}</p></div>`)
    expect(r.overflow).toEqual([])
    expect(r.scrolled).toBe(1)
    expect(r.scrolledAt, 'listed by name, so a near-miss inside a scroller is never silent').toEqual([WORD])
  })

  it('skips the shared `.sr-only` description (spoken, not seen) but still counts its characters', () => {
    const r = run(`<div style="width:100px"><span class="sr-only">${WORD}</span></div>`)
    expect(r.overflow).toEqual([])
    expect(r.chars).toBe(WORD.length)
  })
})

describe('the dismiss verdict – a real blocking card is reachable at both phones, and without its height cap the SAME verdict goes red', () => {
  const surface = (): Mounted => {
    const w = mount(LocalePrompt, SHELL)
    return {
      unmount: () => w.unmount(),
      card: () => document.querySelector('.locale-prompt .dialog-card')!,
      dismiss: () => document.querySelector('.dialog-actions')!,
    }
  }

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`${vp.width}x${vp.height}: ok with the cap, red without it`, () => {
      setViewport(vp) // BEFORE the mount: happy-dom caches a media query on the first computed-style read
      const m = surface()
      expect(verdictOf(m, vp, 'LocalePrompt').ok).toBe(true)
      const card = m.card!() as HTMLElement
      card.style.maxHeight = 'none'
      card.style.overflowY = 'visible'
      const red = verdictOf(m, vp, 'LocalePrompt (cap removed)')
      expect(red.ok, 'the cap could be removed and the carpet would not notice').toBe(false)
      expect(red.why).toMatch(/declares no height bound|taller than the screen|outside the viewport/)
      card.style.maxHeight = ''
      card.style.overflowY = ''
      expect(verdictOf(m, vp, 'LocalePrompt (cap restored)').ok).toBe(true)
      m.unmount()
    })
  }
})

describe('the ledger arithmetic and the report', () => {
  const boxes = (over: Partial<Boxes> = {}): Boxes => ({ boxes: 4, chars: 40, line: { r: 0.2, at: 'a' }, word: { r: 0.5, at: 'Apparel' }, overflow: [], scrolled: 0, scrolledAt: [], clipped: 0, ...over })
  const row = (over: Partial<Row> = {}): Row => ({
    area: 'screens', id: 'Synthetic', kind: 'screen', swept: '', en: boxes(), xx: boxes({ chars: 60 }), padReached: 3, leakNodes: 0, leaks: [], engineAbsolved: 0,
    engineWordCount: 10, rendered: [], dismiss: null, ...over,
  })

  it('findingsOf: a leak, an overflow that is new under xx, one that was already English, and the dismiss verdicts by phone', () => {
    expect(findingsOf(row())).toEqual([])
    expect(findingsOf(row({ leaks: ['Close'], xx: boxes({ overflow: ['Wide word', 'Old word'] }), en: boxes({ overflow: ['Old word'] }) }))).toEqual(
      ['leak: Close', 'overflow-en: Old word', 'overflow: Wide word'].sort(),
    )
    expect(findingsOf(row({ leaks: ['Locked: 65 more pts (she has 0 of 65)', 'Locked: 70 more pts (she has 0 of 70)'] })), 'digits are tuning: the key keeps the words').toEqual([
      'leak: Locked: N more pts (she has N of N)',
    ])
    const blocking = row({ kind: 'blocking', dismiss: { en375: 'ok', xx375: 'ok', en320: 'ok', xx320: 'outside the viewport' } })
    expect(findingsOf(blocking)).toEqual(['dismiss: 320x568: outside the viewport'])
    const already = row({ kind: 'blocking', dismiss: { en375: 'outside the viewport', xx375: 'outside the viewport', en320: 'ok', xx320: 'ok' } })
    expect(findingsOf(already), 'a failure already in English is `dismiss-en` once, not twice').toEqual(['dismiss-en: 375x667: outside the viewport'])
  })

  it('renderReport: the counts in the header, the tightest margins, one line per surface sorted by area then id', () => {
    const text = renderReport([row({ id: 'B', leaks: ['x'] }), row({ id: 'A', xx: boxes({ chars: 60, word: { r: 0.94, at: 'photograph' } }) })])
    expect(text).toContain('surfaces: 2')
    expect(text).toContain('leaks: 1')
    expect(text).toContain('A 94% («photograph»)')
    expect(text.indexOf('| screens | A |')).toBeLessThan(text.indexOf('| screens | B |'))
  })

  it('the ledger is well formed: no duplicate row, every row explained, a detail is never a ratio, a dismiss detail names its phone', () => {
    const keys = FINDINGS.map((f) => `${f.area}|${f.surface}|${f.kind}|${f.detail}`)
    expect(new Set(keys).size, 'a row twice').toBe(keys.length)
    for (const f of FINDINGS) {
      expect(f.note.length, `${f.surface}: ${f.detail} has no note`).toBeGreaterThan(20)
      if (f.kind === 'dismiss' || f.kind === 'dismiss-en') expect(f.detail).toMatch(/^(?:375x667|320x568): /)
      if (f.kind === 'overflow' || f.kind === 'overflow-en') expect(f.detail, 'a ratio in a key churns the ledger on every layout nudge').not.toMatch(/\d+%/)
    }
  })
})

describe('the inventory – every component under src/components is mounted, contained in a mounted surface, or named as a gap', () => {
  const COMPONENTS = (readdirSync('src/components', { recursive: true }) as string[]).filter((f) => f.endsWith('.vue')).map((f) => f.replace(/^.*\//, '').replace(/\.vue$/, '')).sort()
  /** What the four registries import is what they mount: the import line is the declaration, so there is no second list to keep in sync. */
  const MOUNTED = new Set(
    ['screens', 'cards', 'overlays', 'takeovers'].flatMap((area) =>
      Array.from(readFileSync(`tests/component/i18n-l4-2-xx-carpet-${area}.test.ts`, 'utf8').matchAll(/src\/components\/(?:[a-z]+\/)?([A-Za-z]+)\.vue'/g), (m) => m[1]!),
    ),
  )

  it('the three sets partition the directory: nothing unaccounted for, nothing in two places, nothing named that does not exist', () => {
    const contained = Object.keys(CONTAINED)
    const gaps = Object.keys(NOT_MOUNTED)
    const accounted = [...MOUNTED, ...contained, ...gaps]
    expect(new Set(accounted).size, 'a component in two of the three sets').toBe(accounted.length)
    expect(COMPONENTS.filter((c) => !accounted.includes(c)), 'components the carpet has no decision about – mount one, or name it in NOT_MOUNTED with its reason').toEqual([])
    expect(accounted.filter((c) => !COMPONENTS.includes(c)), 'names that are no component (a rename, a deletion)').toEqual([])
  })

  it('every gap has a reason, and every containment names a surface the registries define', () => {
    for (const [name, why] of Object.entries(NOT_MOUNTED)) expect(why.length, `${name}: no reason`).toBeGreaterThan(30)
    const ids = new Set(
      ['screens', 'cards', 'overlays', 'takeovers'].flatMap((area) =>
        Array.from(readFileSync(`tests/component/i18n-l4-2-xx-carpet-${area}.test.ts`, 'utf8').matchAll(/(?:screen|money|more|card|blocking|ending|takeover|inbox|shell|posed|sceneSurface)\(\s*'([^']+)'|id: '([^']+)'/g), (m) => m[1] ?? m[2]!),
      ),
    )
    for (const [name, surface] of Object.entries(CONTAINED)) expect(ids.has(surface) || surface.startsWith('PrologueCard:'), `${name}: «${surface}» is no surface of the registries`).toBe(true)
  })
})
