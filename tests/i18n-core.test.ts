// THE LOCALIZATION CORE – src/shared/i18n.ts (wave L1a, docs/specs/i18n-2026-10.md §3.2–§3.3).
//
// ⚠ THE MATRIX BELOW IS THE STYLE GUIDE'S §5 «COUNTS» TABLE, NOT A PICKED SAMPLE. 1/21/31… are `one`,
// 2–4/22–24… `few`, 0 and 5–20/25–30… `many`, and the cases that break a naive «last digit» rule are
// listed by name: 11–14 (last digit 1–4 but `many`), 101 and 121 (`one` again), 111 and 112 (`many`
// again). The Russian words are TEST FIXTURES for the plural machinery (the style guide's own
// example, «неделя / недели / недель»); no product copy is written here.
//
// ⚠ MUTATION ARMS (watched red before this file was believed; the outputs are in the wave report):
//   1. `pluralCategory` asks `'en'` rules whatever the locale -> the whole RU matrix goes red.
//   2. `pluralCategory` swaps `few` and `many` -> the matrix goes red on 2–4 and 5–20.
//   3. `translate` stops falling back (returns the catalog hit unformatted / drops onMiss) -> the
//      fallback and miss cases go red.
import { describe, expect, it, vi } from 'vitest'
import {
  cp,
  formatMessage,
  isCopyRef,
  MessageError,
  pluralCategory,
  renderCopyRef,
  splitContext,
  translate,
  type CopyRef,
  type RenderContext,
} from '../src/shared/i18n'

const EN: RenderContext = { locale: 'en' }
const RU: RenderContext = { locale: 'ru' }

const WEEKS = '{n, plural, one{{n} неделя} few{{n} недели} many{{n} недель} other{{n} недели}}'
const WEEKS_HASH = '{n, plural, one{# неделя} few{# недели} many{# недель} other{# недели}}'

// [n, expected category, the form the style guide §5 prints]
const RU_MATRIX: Array<[number, string, string]> = [
  [0, 'many', 'недель'],
  [1, 'one', 'неделя'],
  [2, 'few', 'недели'],
  [3, 'few', 'недели'],
  [4, 'few', 'недели'],
  [5, 'many', 'недель'],
  [10, 'many', 'недель'],
  [11, 'many', 'недель'],
  [12, 'many', 'недель'],
  [13, 'many', 'недель'],
  [14, 'many', 'недель'],
  [15, 'many', 'недель'],
  [19, 'many', 'недель'],
  [20, 'many', 'недель'],
  [21, 'one', 'неделя'],
  [22, 'few', 'недели'],
  [24, 'few', 'недели'],
  [25, 'many', 'недель'],
  [30, 'many', 'недель'],
  [31, 'one', 'неделя'],
  [100, 'many', 'недель'],
  [101, 'one', 'неделя'],
  [102, 'few', 'недели'],
  [104, 'few', 'недели'],
  [105, 'many', 'недель'],
  [111, 'many', 'недель'],
  [112, 'many', 'недель'],
  [121, 'one', 'неделя'],
  [1000, 'many', 'недель'],
  [1001, 'one', 'неделя'],
]

describe('plural categories – the Russian table (style guide §5), from Intl.PluralRules', () => {
  it.each(RU_MATRIX)('%i is %s in Russian', (n, category) => {
    expect(pluralCategory('ru', n)).toBe(category)
  })

  it.each(RU_MATRIX)('{n, plural, …} renders %i with the form «%s»', (n, _category, word) => {
    expect(formatMessage(WEEKS, { n }, RU)).toBe(`${n} ${word}`)
  })

  it.each(RU_MATRIX)('`#` prints the number inside a branch: %i', (n, _category, word) => {
    expect(formatMessage(WEEKS_HASH, { n }, RU)).toBe(`${n} ${word}`)
  })

  it('a fraction is `other` in Russian, so a half-week never takes the `many` form', () => {
    expect(pluralCategory('ru', 1.5)).toBe('other')
    expect(formatMessage(WEEKS, { n: 1.5 }, RU)).toBe('1.5 недели')
  })

  it('English has two categories only – the rules follow the locale, not a fixed table', () => {
    expect(pluralCategory('en', 1)).toBe('one')
    expect(pluralCategory('en', 2)).toBe('other')
    expect(pluralCategory('en', 21)).toBe('other')
    expect(pluralCategory('en', 0)).toBe('other')
  })

  it('=N beats the category, and a numeric string is a number', () => {
    const msg = '{n, plural, =0{no weeks} one{# week} other{# weeks}}'
    expect(formatMessage(msg, { n: 0 }, EN)).toBe('no weeks')
    expect(formatMessage(msg, { n: 1 }, EN)).toBe('1 week')
    expect(formatMessage(msg, { n: '7' }, EN)).toBe('7 weeks')
  })

  it('a plural argument that is not a number is an error the formatter reports', () => {
    expect(() => formatMessage(WEEKS, {}, RU)).toThrow(MessageError)
    expect(() => formatMessage(WEEKS, { n: 'soon' }, RU)).toThrow(MessageError)
  })
})

describe('select – gender, with `other` as the neutral shape the style guide asks for', () => {
  const msg = '{g, select, f{она} m{он} other{они}}'
  it('picks the branch and falls to `other` for a missing or unknown value', () => {
    expect(formatMessage(msg, { g: 'f' }, RU)).toBe('она')
    expect(formatMessage(msg, { g: 'm' }, RU)).toBe('он')
    expect(formatMessage(msg, { g: 'x' }, RU)).toBe('они')
    expect(formatMessage(msg, {}, RU)).toBe('они')
  })

  it('nests inside a plural and `#` still means the plural number', () => {
    const nested = '{n, plural, one{{g, select, f{она # неделю} other{# неделю}}} other{# недели}}'
    expect(formatMessage(nested, { n: 1, g: 'f' }, RU)).toBe('она 1 неделю')
    expect(formatMessage(nested, { n: 1 }, RU)).toBe('1 неделю')
    expect(formatMessage(nested, { n: 3, g: 'f' }, RU)).toBe('3 недели')
  })
})

describe('interpolation', () => {
  it('fills named and positional params', () => {
    expect(formatMessage('Week {week} of {total}', { week: 3, total: 52 }, EN)).toBe('Week 3 of 52')
    expect(formatMessage("Rain washed out {0}'s practice", ['Emma'], EN)).toBe("Rain washed out Emma's practice")
  })

  it('a forgotten param stays visible as its placeholder, never as `undefined`', () => {
    expect(formatMessage('Hello {name}', {}, EN)).toBe('Hello {name}')
    expect(formatMessage('Hello {0}', [], EN)).toBe('Hello {0}')
    expect(formatMessage('Hello {name}', { name: null }, EN)).toBe('Hello {name}')
  })

  it('does not reach the prototype for a param name', () => {
    expect(formatMessage('{constructor}', {}, EN)).toBe('{constructor}')
  })

  // §9.6 – money and numbers keep ONE form across locales; the core formats no numbers.
  it('a number prints as String(n) in EVERY locale – no grouping, no Intl.NumberFormat', () => {
    expect(formatMessage('{n} weeks', { n: 12500 }, EN)).toBe('12500 weeks')
    expect(formatMessage('{n} weeks', { n: 12500 }, RU)).toBe('12500 weeks')
    expect(formatMessage('{n}', { n: 0.5 }, RU)).toBe('0.5')
  })

  it('an already-formatted money string passes through untouched', () => {
    expect(formatMessage('You earned {amount}', { amount: '$12,500.40' }, RU)).toBe('You earned $12,500.40')
    expect(formatMessage('Pot: {amount}', { amount: '$40.6M' }, RU)).toBe('Pot: $40.6M')
  })

  it('an apostrophe is plain text – it is NOT an ICU quote in this dialect', () => {
    expect(formatMessage("Saved games can't be reached – {n}'s", { n: 'x' }, EN)).toBe("Saved games can't be reached – x's")
  })

  it('a backslash escapes { } # \\ and nothing else', () => {
    expect(formatMessage('use \\{braces\\}', {}, EN)).toBe('use {braces}')
    expect(formatMessage('a \\\\ b', {}, EN)).toBe('a \\ b')
    expect(formatMessage('{n, plural, other{\\# of #}}', { n: 4 }, EN)).toBe('# of 4')
    expect(formatMessage('keep \\d as is', {}, EN)).toBe('keep \\d as is')
  })

  it('# outside a plural is plain text', () => {
    expect(formatMessage('Draw #3', {}, EN)).toBe('Draw #3')
  })
})

describe('syntax errors are errors, not pass-throughs', () => {
  it.each([
    ['an unclosed brace', 'Hello {name'],
    ['an unmatched close brace', 'Hello }'],
    ['a plural with no `other`', '{n, plural, one{x}}'],
    ['a select with no `other`', '{g, select, f{x}}'],
    ['an unsupported type', '{n, number}'],
    ['selectordinal', '{n, selectordinal, other{x}}'],
    ['a plural offset', '{n, plural, offset:1 other{x}}'],
    ['a category that does not exist', '{n, plural, several{x} other{y}}'],
    ['a duplicate branch', '{n, plural, one{x} one{y} other{z}}'],
    ['a malformed exact selector', '{n, plural, =x{x} other{y}}'],
    ['an unclosed branch', '{n, plural, other{x}'],
  ])('%s', (_name, template) => {
    expect(() => formatMessage(template, { n: 1, name: 'x', g: 'f' }, EN)).toThrow(MessageError)
  })
})

describe('context tags (spec §3.1)', () => {
  it('splits a short lowercase tag from the English text, and leaves everything else alone', () => {
    expect(splitContext('nav|Stats')).toEqual({ ctx: 'nav', text: 'Stats' })
    expect(splitContext('heading|Stats')).toEqual({ ctx: 'heading', text: 'Stats' })
    expect(splitContext('Win | Lose')).toEqual({ ctx: null, text: 'Win | Lose' })
    expect(splitContext('Draw|Seed')).toEqual({ ctx: null, text: 'Draw|Seed' })
    expect(splitContext('Stats')).toEqual({ ctx: null, text: 'Stats' })
  })

  it('English shows the text without the tag; the catalog is asked for the FULL key', () => {
    expect(translate('nav|Stats', undefined, EN)).toBe('Stats')
    const lookup = vi.fn((key: string) => (key === 'nav|Stats' ? 'NAV-RU' : key === 'heading|Stats' ? 'HEAD-RU' : undefined))
    expect(translate('nav|Stats', undefined, { locale: 'ru', lookup })).toBe('NAV-RU')
    expect(translate('heading|Stats', undefined, { locale: 'ru', lookup })).toBe('HEAD-RU')
    // …and a miss renders the English text, not «nav|Stats».
    const onMiss = vi.fn()
    expect(translate('nav|Trophies', undefined, { locale: 'ru', lookup, onMiss })).toBe('Trophies')
    expect(onMiss).toHaveBeenCalledWith('nav|Trophies', 'missing')
  })
})

describe('translate – the fallback law (spec §6, ruling 4 as a number)', () => {
  it('English is the identity: the SAME string back, the catalog never asked, nothing counted', () => {
    const lookup = vi.fn(() => 'SHOULD NOT BE USED')
    const onMiss = vi.fn()
    const key = 'Start a new career'
    const out = translate(key, undefined, { locale: 'en', lookup, onMiss })
    expect(out).toBe(key)
    expect(lookup).not.toHaveBeenCalled()
    expect(onMiss).not.toHaveBeenCalled()
  })

  it('a key the catalog has renders the translation, params filled', () => {
    const lookup = (key: string): string | undefined => (key === 'Next {weeks} weeks' ? `Вперёд на ${WEEKS_HASH.replace('{n,', '{weeks,')}` : undefined)
    expect(translate('Next {weeks} weeks', { weeks: 5 }, { locale: 'ru', lookup })).toBe('Вперёд на 5 недель')
    expect(translate('Next {weeks} weeks', { weeks: 22 }, { locale: 'ru', lookup })).toBe('Вперёд на 22 недели')
  })

  it('a missing key renders ENGLISH, interpolated, and is counted once with reason `missing`', () => {
    const onMiss = vi.fn()
    const out = translate('Week {week} of {total}', { week: 3, total: 52 }, { locale: 'ru', lookup: () => undefined, onMiss })
    expect(out).toBe('Week 3 of 52')
    expect(onMiss).toHaveBeenCalledTimes(1)
    expect(onMiss).toHaveBeenCalledWith('Week {week} of {total}', 'missing')
  })

  it('no lookup at all (no catalog) is every key missing', () => {
    const onMiss = vi.fn()
    expect(translate('Home', undefined, { locale: 'ru', onMiss })).toBe('Home')
    expect(onMiss).toHaveBeenCalledWith('Home', 'missing')
  })

  it('an EMPTY catalog value is a miss – a blank control is never shipped as a translation', () => {
    const onMiss = vi.fn()
    expect(translate('Home', undefined, { locale: 'ru', lookup: () => '', onMiss })).toBe('Home')
    expect(onMiss).toHaveBeenCalledWith('Home', 'missing')
  })

  it('a translation that will not render falls back to English and is counted as `invalid`', () => {
    const onMiss = vi.fn()
    const lookup = (key: string): string | undefined => (key === 'Hello {name}' ? 'Привет {name' : undefined)
    expect(translate('Hello {name}', { name: 'Emma' }, { locale: 'ru', lookup, onMiss })).toBe('Hello Emma')
    expect(onMiss).toHaveBeenCalledWith('Hello {name}', 'invalid')
  })

  it('a plural whose count param is missing is `invalid`, not a crash', () => {
    const onMiss = vi.fn()
    const lookup = (): string => WEEKS
    expect(translate('{n} weeks', {}, { locale: 'ru', lookup, onMiss })).toBe('{n} weeks')
    expect(onMiss).toHaveBeenCalledWith('{n} weeks', 'invalid')
  })

  it('a source literal that does not format comes back as written, never as a throw', () => {
    expect(translate('Broken {', undefined, EN)).toBe('Broken {')
  })
})

describe('CopyRef – the engine emits data, the UI renders it (spec §3.2)', () => {
  it('`cp` builds { k, p } from a tagged template; no params, no `p`', () => {
    const name = 'Emma'
    expect(cp`Rain washed out ${name}'s practice`).toEqual({ k: "Rain washed out {0}'s practice", p: ['Emma'] })
    expect(cp`Rest week`).toEqual({ k: 'Rest week' })
    expect(cp`${1} and ${2}`).toEqual({ k: '{0} and {1}', p: [1, 2] })
  })

  it('isCopyRef accepts exactly the shape', () => {
    expect(isCopyRef({ k: 'x' })).toBe(true)
    expect(isCopyRef({ k: 'x', p: [] })).toBe(true)
    expect(isCopyRef({ k: 'x', p: 'no' })).toBe(false)
    expect(isCopyRef({ k: 1 })).toBe(false)
    expect(isCopyRef(null)).toBe(false)
    expect(isCopyRef(['x'])).toBe(false)
    expect(isCopyRef('x')).toBe(false)
  })

  it('renders in English with nested CopyRefs, recursing through the params', () => {
    const session: CopyRef = cp`the ${'hitting'} session`
    const ref = cp`Rain washed out ${session}`
    expect(renderCopyRef(ref, EN)).toBe('Rain washed out the hitting session')
    // a letter holds paragraphs: three levels deep
    const letter = cp`Dear ${'Emma'}, ${ref}. ${cp`See you ${cp`on ${'Friday'}`}`}`
    expect(renderCopyRef(letter, EN)).toBe('Dear Emma, Rain washed out the hitting session. See you on Friday')
  })

  it('under a locale, EACH nested key is looked up on its own and each miss is counted on its own', () => {
    const lookup = (key: string): string | undefined => (key === 'the {0} session' ? '[ru] {0}' : undefined)
    const onMiss = vi.fn()
    const ref = cp`Rain washed out ${cp`the ${'hitting'} session`}`
    // the outer key is missing (English template), the inner one is translated
    expect(renderCopyRef(ref, { locale: 'ru', lookup, onMiss })).toBe('Rain washed out [ru] hitting')
    expect(onMiss).toHaveBeenCalledTimes(1)
    expect(onMiss).toHaveBeenCalledWith('Rain washed out {0}', 'missing')
  })

  it('a CopyRef can be a plural/select argument carrier – the params are the call\'s, not the key\'s', () => {
    const lookup = (): string => 'Вперёд на {0, plural, one{# неделю} few{# недели} many{# недель} other{# недели}}'
    expect(renderCopyRef({ k: 'Next {0} weeks', p: [4] }, { locale: 'ru', lookup })).toBe('Вперёд на 4 недели')
  })

  it('survives a JSON round trip, because L3 stores it in saves', () => {
    const ref = cp`Rain washed out ${cp`the ${'hitting'} session`} ${3} times`
    const back = JSON.parse(JSON.stringify(ref)) as CopyRef
    expect(renderCopyRef(back, EN)).toBe(renderCopyRef(ref, EN))
  })

  it('a cyclic CopyRef is bounded: it ends in a string instead of hanging (JSON from a save cannot be cyclic – this is a bug net)', () => {
    const a: CopyRef = { k: 'loop {0}', p: [] }
    a.p!.push(a)
    const out = renderCopyRef(a, EN)
    expect(out.startsWith('loop ')).toBe(true)
    expect(out.length).toBeLessThan(200)
  })
})
