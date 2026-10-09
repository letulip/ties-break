// L4-1 · THE RUSSIAN TYPE, MOUNTED (P3 T3, 10.10). The real stylesheet, a real shipped component, and the language switched under it.
//
// WHAT IS MEASURED. `LocalePrompt` is mounted with the REAL `src/style.css`; `document.documentElement.lang` is flipped the way
// `src/i18n/locale.ts` flips it; and the COMPUTED font-family chain of three real elements is read back: a heading (the shared
// heading token), a paragraph (the body token) and a handwriting probe (the hand token). Then each chain is asked the question
// that matters for Russian: which member of it is a family the sheet declares a CYRILLIC face for?
//
//   English        heading: Sora, then the system tail – NO Cyrillic-capable family, i.e. today's chain untouched.
//   Russian        heading: Sora first (Latin letters in a Russian heading keep the brand face), the Cyrillic-capable family SECOND.
//   the seam       --font-heading-cyr: 'Onest' on the root slots Onest between Sora and the body face – the one-line pick – and
//                  does nothing at all under English.
//
// ⚠ WHAT HAPPY-DOM CANNOT SAY, and the report says it too: it does not load a font, so «the browser picks the Cyrillic file for a
// Cyrillic letter» is not asserted here; what is asserted is the chain a browser would walk, and the declarations it would walk it
// against (a Cyrillic-range face per family). The overlap rule («the later face wins on a Cyrillic code point and the earlier one
// stays the only candidate for Latin») was measured in Chromium with a scratch page; the record is in the spec's T3 section.
// ⚠ And it is why the sheet scopes with `[lang|='ru']` and not `:lang(ru)`: happy-dom implements the first and not the second
// (`matches(':lang(ru)')` is false for lang="ru"), so the attribute form is the one this smoke can truly flip.
//
// ⚠ NO CYRILLIC LETTER IS SPELT HERE: the question «which families carry Cyrillic» is answered from the sheet's own unicode-range
// declarations, with the probe code points written as numbers.
//
// MUTATION ARMS (watched red; outputs in the wave report):
//   1. the override's selector changed to `[lang|='de']`     -> the Russian-chain case goes red.
//   2. `var(--font-body-cyr)` dropped from the override      -> the seam-fallback case goes red.
//   3. the Manrope Cyrillic block's unicode-range removed    -> the declarations case goes red (and the unit net's «Latin only» arm).
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import LocalePrompt from '../../src/components/LocalePrompt.vue'
import '../../src/style.css'

const css = readFileSync(resolve(__dirname, '../../src/style.css'), 'utf8')

/** The families the sheet declares at least one face for whose unicode-range claims a Russian letter (A, and the IO letters). */
function cyrillicFamilies(): Set<string> {
  const out = new Set<string>()
  for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const body = m[1] ?? ''
    const family = /font-family:\s*'([^']+)'/.exec(body)?.[1]
    const range = /unicode-range:\s*([^;]+);/.exec(body)?.[1]
    if (!family || !range) continue
    const covers = (cp: number): boolean =>
      range.split(',').some((part) => {
        const [a, b] = part.trim().replace(/^U\+/i, '').split('-')
        return cp >= parseInt(a ?? '', 16) && cp <= parseInt(b ?? a ?? '', 16)
      })
    if (covers(0x410) && covers(0x401) && covers(0x451)) out.add(family)
  }
  return out
}

/** A computed `font-family`, as the list of family names a browser would walk. */
const chain = (el: Element): string[] =>
  getComputedStyle(el)
    .fontFamily.split(',')
    .map((f) => f.trim().replace(/^["']|["']$/g, ''))

const SYSTEM_TAIL = ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif']

let wrapper: VueWrapper
let title: Element
let paragraph: Element
let hand: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ''
  document.documentElement.lang = 'en'
  wrapper = mount(LocalePrompt, { attachTo: document.body })
  title = document.querySelector('.dialog-title') as Element
  paragraph = document.querySelector('.dialog-message') as Element
  // The hand token has no consumer on this card, so a probe element asks for it the way every handwriting rule in the sheet does.
  hand = document.createElement('span')
  hand.style.fontFamily = 'var(--font-hand)'
  document.body.appendChild(hand)
})
afterEach(() => {
  wrapper.unmount()
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--font-heading-cyr')
  document.documentElement.lang = 'en'
})

describe('L4-1 · the Russian chain, mounted against the real stylesheet', () => {
  it('the premise: the sheet declares a Cyrillic face for the body and hand families and for no other', () => {
    expect([...cyrillicFamilies()].sort()).toEqual(['Caveat', 'Manrope'])
  })

  it('ENGLISH: the heading chain is the shipped one, with no Cyrillic-capable family in it', () => {
    expect(chain(title)).toEqual(['Sora', ...SYSTEM_TAIL])
    expect(chain(title).some((f) => cyrillicFamilies().has(f)), 'English headings walk no Cyrillic family').toBe(false)
    expect(chain(paragraph)).toEqual(['Manrope', ...SYSTEM_TAIL])
    expect(chain(hand)).toEqual(['Caveat', 'Bradley Hand', 'Segoe Script', 'cursive'])
  })

  it('RUSSIAN: Sora stays first, and the Cyrillic-capable family is the second stop of the heading chain', () => {
    for (const lang of ['ru', 'ru-RU']) {
      document.documentElement.lang = lang
      const headings = chain(title)
      expect(headings[0], `${lang}: Latin letters in a Russian heading keep the heading face`).toBe('Sora')
      expect(headings.slice(1, 3), `${lang}: heading-cyr, then body-cyr – both Manrope until the owner picks`).toEqual(['Manrope', 'Manrope'])
      expect(headings.slice(3), `${lang}: the system tail is the shipped tail`).toEqual(SYSTEM_TAIL)
      expect(cyrillicFamilies().has(headings[1] ?? ''), 'the family it falls through to HAS a Cyrillic face declared').toBe(true)
    }
  })

  it("RUSSIAN: the body and hand chains are IDENTICAL to English – their Cyrillic arrives through the same family's unicode-range face", () => {
    document.documentElement.lang = 'ru'
    expect(chain(paragraph)).toEqual(['Manrope', ...SYSTEM_TAIL])
    expect(chain(hand)).toEqual(['Caveat', 'Bradley Hand', 'Segoe Script', 'cursive'])
    for (const el of [paragraph, hand]) {
      expect(cyrillicFamilies().has(chain(el)[0] ?? ''), 'the first family of the chain carries the Cyrillic face').toBe(true)
    }
  })

  it('the language flip is live in both directions: en -> ru -> en returns to the shipped chain', () => {
    const shipped = chain(title)
    document.documentElement.lang = 'ru'
    expect(chain(title)).not.toEqual(shipped)
    document.documentElement.lang = 'en'
    expect(chain(title)).toEqual(shipped)
  })

  it('THE SEAM: --font-heading-cyr slots the owner\'s pick between Sora and the body face, and only under Russian', () => {
    const root = document.documentElement
    root.style.setProperty('--font-heading-cyr', "'Onest'")
    // English ignores the seam entirely: the override is Russian-scoped, so the shipped token is what resolves.
    expect(chain(title), 'English is unmoved by the seam').toEqual(['Sora', ...SYSTEM_TAIL])
    root.lang = 'ru'
    expect(chain(title), 'Sora, the pick, the body face behind it, then the tail').toEqual(['Sora', 'Onest', 'Manrope', ...SYSTEM_TAIL])
    root.style.removeProperty('--font-heading-cyr')
    expect(chain(title), 'unset again: back to the default, heading-cyr = body-cyr').toEqual(['Sora', 'Manrope', 'Manrope', ...SYSTEM_TAIL])
  })
})
