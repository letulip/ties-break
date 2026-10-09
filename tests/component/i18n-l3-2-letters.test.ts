// L3-2 (10.10) – THE LETTERS: the bodies of `OfferLetter.vue` go through `t()`, and the English they render does not move.
//
// ⚠ THE FINDING THIS NET PINS (the load-bearing one). A persisted `Offer` stores NO letter prose. `terms` holds numbers, enums, ids and
// names, and `OfferLetter` rebuilds every sentence from them each time the paper is read (the rule `AcademyLetterTerms` and
// `TourLetterTerms` both state in their own doc comments). So the letters are class (b) – assembled at render – and wire through `t()` with
// no schema move and no migration. Two terms fields are the exception, because the engine writes a finished English phrase into the save:
// `AdOfferTerms.trade` (six clauses) and `TourLetterTerms.requirements` (two shapes). `composables/letterCopy.ts` reads those as keys, and
// §4 below reads the ENGINE for every phrase its writers can produce, so a new house or a new rung fails here, not in a Russian inbox.
//
// §1  the twin's old arm, kept: `tests/fixtures/l3-2-letters/matrix.json` was captured on the PRE-WAVE tree (c41c201a) by this very file in
//     write mode, and the new tree must reproduce it, block for block, over every arm and branch the matrix poses
// §2  the paper never prints a placeholder or an `undefined`
// §3  the `xx` pseudo-locale: the WHOLE paper (bodies, foot, sign-off) leaves nothing unbracketed
// §4  the legacy adapter against the engine's own writers
// §5  a probe catalog with ASCII-only markers: the stored phrases, the unit word, a counted sentence and a two-clause sentence follow the locale
// §6  the engine's letter writers carry no letter prose (the claim the wave rests on), counted
// §7  OfferLetter has no script-local `t` any more (the four that shadowed the import)
//
// Regenerating §1 is deliberate and loud, and only ever on a tree whose English is the reference:
//   TB_WRITE_L32_MATRIX=1 npx vitest run --project component tests/component/i18n-l3-2-letters.test.ts -t "records the matrix"
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import ts from 'typescript'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'
import { KNOWN_TRADE_CLAUSES, requirementLine, staffAskPerPhrase, tradeClause } from '../../src/composables/letterCopy'
import { ECONOMY } from '../../src/engine/economy'
import { createWorld, KID_ID, type WorldState } from '../../src/engine/world'
import { settleTourSeasonNotice } from '../../src/engine/world/mandatory'
import type { TourLetterTerms } from '../../src/shared/protocol'
import { DEFAULT_ALLOW, hardcodeLeaks, installPseudoLocale } from './pseudoloc'
import { LIVE_WEEK, letterMatrix, type LetterCase } from './l32-letter-matrix'

const RECORD = resolve(process.cwd(), 'tests/fixtures/l3-2-letters/matrix.json')
const norm = (s: string): string => s.replace(/\s+/g, ' ').trim()

interface Captured {
  /** the paper's blocks in document order: every body paragraph, every list item, the sign-off, the foot's lines, the two doors, each image's alt */
  blocks: string[]
  /** everything the sheet says, one string (whitespace-collapsed) – kept to prove the blocks cover the sheet, never compared with the old arm's:
   *  the join of two text nodes loses an invisible edge space when a paragraph becomes one interpolation (L2-6b's class), and that is no change of copy */
  text: string
}

function mountLetter(c: LetterCase): VueWrapper {
  return mount(OfferLetter, { props: { offer: c.offer, week: c.week ?? LIVE_WEEK, offers: c.offers ?? [], saleLabel: c.saleLabel } as never }) as VueWrapper
}

function capture(c: LetterCase): Captured {
  const w = mountLetter(c)
  const blocks = Array.from<Element>(w.element.querySelectorAll('.offer-body, .offer-terms li, .offer-sign-off, .offer-window, button, img'))
    .map((el) => (el.tagName === 'IMG' ? `img:${el.getAttribute('alt') ?? ''}` : norm(el.textContent ?? '')))
  const out = { blocks, text: norm(w.text()) }
  w.unmount()
  return out
}

beforeEach(() => setActivePinia(createPinia()))
afterEach(() => resetI18nForTests(null))

describe('L3-2 §1 – the pre-wave English, case for case', () => {
  const cases = letterMatrix()

  it('records the matrix (write mode only; asserts nothing)', () => {
    if (!process.env.TB_WRITE_L32_MATRIX) return
    const record: Record<string, Captured> = {}
    for (const c of cases) record[c.name] = capture(c)
    mkdirSync(dirname(RECORD), { recursive: true })
    writeFileSync(RECORD, `${JSON.stringify(record, null, 1)}\n`)
    console.log(`[L3-2] wrote ${RECORD}: ${cases.length} cases`)
  })

  it('the matrix poses every kind the inbox writes, and the record holds exactly its cases', () => {
    if (process.env.TB_WRITE_L32_MATRIX) return
    const record = JSON.parse(readFileSync(RECORD, 'utf8')) as Record<string, Captured>
    expect(Object.keys(record).sort()).toEqual(cases.map((c) => c.name).sort())
    const kinds = new Set(cases.map((c) => c.offer.kind))
    expect([...kinds].sort()).toEqual(['academy', 'ad', 'build', 'call-up', 'entry', 'kit', 'sale', 'staff', 'tour'])
    expect(cases.length, 'the matrix is not a stub').toBeGreaterThan(130)
  })

  it('every case renders the English the pre-wave tree rendered – every block, and the sheet as a whole', () => {
    if (process.env.TB_WRITE_L32_MATRIX) return
    const record = JSON.parse(readFileSync(RECORD, 'utf8')) as Record<string, Captured>
    let blocks = 0
    for (const c of cases) {
      const now = capture(c)
      expect(now.blocks, c.name).toEqual(record[c.name]!.blocks)
      // nothing is said outside the blocks: the blocks, whitespace removed, ARE the sheet's text (so the block list cannot be hiding a paragraph)
      expect(now.blocks.filter((b) => !b.startsWith('img:')).join('').replace(/\s/g, ''), c.name).toBe(now.text.replace(/\s/g, ''))
      blocks += now.blocks.length
    }
    expect(blocks, 'a real denominator: the blocks compared').toBeGreaterThan(700)
  })
})

describe('L3-2 §2 – no placeholder, no undefined', () => {
  it('no posed letter prints a hole, an undefined or a NaN', () => {
    for (const c of letterMatrix()) {
      const { text } = capture(c)
      expect(text, c.name).not.toMatch(/\{\d+\}|undefined|NaN|\[object|null/)
      expect(text.length, c.name).toBeGreaterThan(20)
    }
  })
})

describe('L3-2 §3 – the whole paper under xx', () => {
  /** names and figures a letter carries as DATA: a brand, a label, a lot's name – and the engine-formatted ones (money, a week, a rank) */
  const dataOf = (c: LetterCase): Set<string> => {
    const out = new Set<string>(c.saleLabel ? [c.saleLabel] : [])
    const walk = (v: unknown): void => {
      if (typeof v === 'string') out.add(v)
      else if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === 'object') Object.values(v).forEach(walk)
    }
    walk(c.offer.terms)
    for (const o of c.offers ?? []) walk(o.terms)
    return out
  }
  const ENGINE_BORN: RegExp[] = [/^W\d+( \d{4}| ['’]\d{2})?$/, /^[−-]?\$[\d,.]+[KMB]?$/, /^#\d+$/, /^[\d,]+$/]

  it('no case leaves a paragraph, a list item, the sign-off or the foot unbracketed', async () => {
    await installPseudoLocale()
    const leaked: [string, string[]][] = []
    for (const c of letterMatrix()) {
      const w = mountLetter(c)
      const data = dataOf(c)
      const leaks = hardcodeLeaks(w.element, [...DEFAULT_ALLOW, ...ENGINE_BORN]).filter((l) => {
        const bare = l.replace(/^– (?=\S)/, '')
        return !data.has(bare) && !data.has(l)
      })
      if (leaks.length) leaked.push([c.name, leaks])
      w.unmount()
    }
    expect(leaked, 'text on a paper that did not come through t()').toEqual([])
  })
})

describe('L3-2 §4 – the legacy adapter against the engine', () => {
  /** every string literal assigned to a property called `trade` in the engine's own sources – the writers of `AdOfferTerms.trade` */
  function writtenTrades(): string[] {
    const found: string[] = []
    for (const rel of ['src/engine/economy/advertising.ts', 'src/engine/offers.ts']) {
      const sf = ts.createSourceFile(rel, readFileSync(rel, 'utf8'), ts.ScriptTarget.Latest, true)
      const visit = (n: ts.Node): void => {
        if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name) && n.name.text === 'trade' && ts.isStringLiteral(n.initializer)) found.push(n.initializer.text)
        ts.forEachChild(n, visit)
      }
      visit(sf)
    }
    return found
  }

  it('knows every clause a writer can put in `AdOfferTerms.trade` (the engine is read, so a seventh house fails here)', () => {
    const written = new Set(writtenTrades())
    expect(written.size, 'the scan found the writers').toBeGreaterThanOrEqual(6)
    const catalogue = Object.values(ECONOMY.advertising.categories as unknown as Record<string, { trade: string }>).map((c) => c.trade)
    for (const clause of [...written, ...catalogue]) expect(KNOWN_TRADE_CLAUSES, `a writer produces «${clause}» and the adapter has no key for it`).toContain(clause)
  })

  function boundWorld(rank = 34): WorldState {
    const world = createWorld('l32-requirements')
    world.results.push({ playerId: KID_ID, week: world.week, points: 250, tier: 'wta250' })
    world.kidRankWta = rank
    return world
  }

  it('reverses every requirement the engine really writes onto a season notice, through t() and not through the fallback', async () => {
    const world = boundWorld()
    settleTourSeasonNotice(world)
    const notice = world.offers.find((o) => o.kind === 'tour')
    const stored = (notice?.terms as TourLetterTerms | undefined)?.requirements ?? []
    expect(stored.length, 'a bound world writes a season notice with requirements').toBeGreaterThanOrEqual(3)
    await installPseudoLocale()
    for (const line of stored) {
      const shown = requirementLine(line)
      expect(shown, `«${line}» fell through to the stored English`).not.toBe(line)
      expect(shown, `«${line}» did not come through t()`).toMatch(/^⟦/)
    }
  })

  it('English: a requirement reads back to the very phrase the writer stored (both shapes, singular and plural)', () => {
    for (const line of ['All 4 Grand Slams', 'All 8 World Tour 1000s', '6 of the 10 World Tour 500s', 'All 1 Grand Slam', 'All 2 Cups']) {
      expect(requirementLine(line)).toBe(line)
    }
    // a phrase no writer produces is returned as stored, never thrown on and never guessed at
    expect(requirementLine('Whatever a later rule says')).toBe('Whatever a later rule says')
    expect(tradeClause('We sell something else')).toBe('We sell something else')
  })
})

describe('L3-2 §5 – the locale reaches the stored phrases and the unit word (a probe catalog, ASCII markers)', () => {
  it('follows the active catalog', async () => {
    installCatalog('ru', {
      'We make watches': 'P1',
      'All {0} {1}s': 'P2 {0}/{1}',
      'All {0} {1}': 'P2one {0}/{1}',
      '{0} of the {1} {2}s': 'P3 {0}/{1}/{2}',
      'rate|a session': 'P4',
      'rate|an hour': 'P5',
      '{0} penalty points have been recorded {1}.': 'P6 {0} {1}',
      'for the {0}': 'P7 {0}',
    })
    await setLocale('ru')
    expect(tradeClause('We make watches')).toBe('P1')
    expect(tradeClause('We make cars')).toBe('We make cars') // an unmapped key renders itself
    expect(requirementLine('All 4 Grand Slams')).toBe('P2 4/Grand Slam')
    expect(requirementLine('All 1 Grand Slam')).toBe('P2one 1/Grand Slam')
    expect(requirementLine('6 of the 10 World Tour 500s')).toBe('P3 6/10/World Tour 500')
    expect(staffAskPerPhrase('a session')).toBe('P4')
    expect(staffAskPerPhrase('an hour')).toBe('P5')
    const penalty = letterMatrix().find((c) => c.name === 'tour/penalty-3-label')!
    const w = mountLetter(penalty)
    expect(w.find('.offer-body').text(), 'the lead is ONE message with its event clause as a param').toBe('P6 3 P7 World Tour 500 Alpha')
    w.unmount()
  })
})

describe('L3-2 §6 – the engine writes no letter prose (the finding, counted)', () => {
  /** prose-sized string literals (4+ words) in a source file, by AST so a comment can never count */
  function prose(rel: string): string[] {
    const sf = ts.createSourceFile(rel, readFileSync(rel, 'utf8'), ts.ScriptTarget.Latest, true)
    const out: string[] = []
    const visit = (n: ts.Node): void => {
      if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && n.text.trim().split(/\s+/).length >= 4) out.push(n.text)
      else if (ts.isTemplateExpression(n)) {
        const text = n.getText().slice(1, -1)
        if (text.trim().split(/\s+/).length >= 4) out.push(text)
      }
      ts.forEachChild(n, visit)
    }
    visit(sf)
    return out
  }

  it('offers.ts holds only the four answer errors and the apparel house\'s own trade clause; staffLetters.ts holds none', () => {
    expect(prose('src/engine/offers.ts').sort()).toEqual([
      'That deal is already signed.',
      'That letter is not in the inbox.',
      'That offer has already gone.',
      'She is already signed for next season.',
      'We make her kit',
      'We make her kit',
    ].sort())
    expect(prose('src/engine/world/staffLetters.ts')).toEqual([])
  })
})

describe('L3-2 §7 – the script-local `t`s are gone', () => {
  it('OfferLetter declares no `t` of its own (the four that shadowed the i18n import are `tm`)', () => {
    // read by path: the component project runs under happy-dom, whose URL is not the file one `componentFile` builds (the inbox-identity net's note)
    const script = readFileSync(resolve(process.cwd(), 'src/components/OfferLetter.vue'), 'utf8')
    expect(script.length, 'the file was read').toBeGreaterThan(10000)
    expect(script).not.toMatch(/\b(?:const|let|var)\s+t\s*=/)
    expect(existsSync(resolve(process.cwd(), 'src/composables/letterCopy.ts'))).toBe(true)
  })
})
