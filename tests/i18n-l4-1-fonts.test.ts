// L4-1 – THE RUSSIAN TYPE'S NETS (P3 T1 + T3, 10.10). docs/specs/ru-typography-2026-09.md.
//
// WHAT THIS FILE PROVES, and what it cannot. It reads `src/style.css` and `public/fonts/` as text and bytes, which is the honest
// instrument for four claims that are ABOUT THE SHEET: (1) English is byte-identical – the three Latin faces and the three tokens
// are exactly what shipped; (2) every new face claims Cyrillic code points and nothing else, so no Latin character can reach it;
// (3) a declared file is either on disk or on the graceful-absence ledger, and the ledger shrinks the day a file lands;
// (4) the heading seam is the chain the spec describes. The BEHAVIOUR (a Russian locale resolves the chain) is measured by
// tests/component/l4-1-ru-fonts.test.ts against the real stylesheet.
//
// ⚠ WHAT NEITHER CAN SEE: whether a browser actually fetches a Cyrillic face for Cyrillic text and ignores it for Latin. That
// needs a font engine and the generated files; the overlap rule it rests on (the later rule wins) was measured once in Chromium
// with a scratch page, and the record is in the spec's T3 section. Not one Cyrillic letter is spelt in this file: code points only.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { GRACEFUL_ABSENT_FONTS as GRACEFUL_ABSENT } from './helpers/fontLedger'
import { region } from './helpers/source'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const css = readFileSync(join(ROOT, 'src/style.css'), 'utf8')

interface Face { family: string; weight: string; display: string; url: string; range: string | null }
const faces: Face[] = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
  const body = m[1] ?? ''
  const pick = (re: RegExp): string => re.exec(body)?.[1]?.trim() ?? ''
  return {
    family: pick(/font-family:\s*'([^']+)'/),
    weight: pick(/font-weight:\s*([^;]+);/),
    display: pick(/font-display:\s*([^;]+);/),
    url: pick(/url\('([^']+)'\)/),
    range: /unicode-range:\s*([^;]+);/.exec(body)?.[1]?.trim() ?? null,
  }
})

/** `U+0400-045F, U+2116` -> [[0x400, 0x45f], [0x2116, 0x2116]] */
const parseRange = (spec: string): [number, number][] =>
  spec.split(',').map((part) => {
    const [a, b] = part.trim().replace(/^U\+/i, '').split('-')
    return [parseInt(a ?? '', 16), parseInt(b ?? a ?? '', 16)]
  })

// ⭐ THE THREE FACES AND THE THREE TOKENS, AS THEY SHIPPED BEFORE THE RUSSIAN TYPE. Copied from the tree at a02ae105, verbatim.
// English renders from exactly these bytes; this is the pin that makes «zero visual change for English» a statement about text and
// not about intent. The diff of the wave that added the Cyrillic faces deletes no line of the sheet (`git diff --numstat`: 0).
const LATIN_FACES = `@font-face {
  font-family: 'Sora';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url('/fonts/sora-var.woff2') format('woff2');
}

@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-weight: 200 800;
  font-display: swap;
  src: url('/fonts/manrope-var.woff2') format('woff2');
}

@font-face {
  font-family: 'Caveat';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/caveat-600.woff2') format('woff2');
}`
const LATIN_TOKENS = [
  `--font-heading: 'Sora', system-ui, -apple-system, 'Segoe UI', sans-serif;`,
  `--font-body: 'Manrope', system-ui, -apple-system, 'Segoe UI', sans-serif;`,
  `--font-hand: 'Caveat', 'Bradley Hand', 'Segoe Script', cursive;`,
]

describe('L4-1 · English is byte-identical', () => {
  it('the three Latin faces are verbatim what shipped, in the order they shipped', () => {
    expect(css, 'the three original @font-face declarations, contiguous and unchanged').toContain(LATIN_FACES)
  })

  it('the three font tokens are verbatim, each declared once outside the Russian scope', () => {
    for (const token of LATIN_TOKENS) {
      expect(css.split(token).length - 1, `${token} appears exactly once`).toBe(1)
    }
  })

  it('exactly three faces claim the whole range – the Latin ones – and every other face claims Cyrillic code points ONLY', () => {
    const whole = faces.filter((f) => f.range === null).map((f) => f.url)
    expect(whole.sort(), 'the only unrestricted faces are the three shipped Latin files').toEqual([
      '/fonts/caveat-600.woff2',
      '/fonts/manrope-var.woff2',
      '/fonts/sora-var.woff2',
    ])
    const restricted = faces.filter((f) => f.range !== null)
    expect(restricted.length, 'one Cyrillic face for the body family, one for the hand').toBe(2)
    for (const face of restricted) {
      for (const [lo, hi] of parseRange(face.range ?? '')) {
        // U+0400..U+052F is the Cyrillic block and its supplement; U+2116 is the numero sign, which only Russian text types.
        const cyrillic = lo >= 0x400 && hi <= 0x52f
        const numero = lo === 0x2116 && hi === 0x2116
        expect(cyrillic || numero, `${face.family}: U+${lo.toString(16)}-${hi.toString(16)} is Cyrillic and nothing else`).toBe(true)
      }
    }
  })
})

describe('L4-1 · the Cyrillic faces', () => {
  const cyr = faces.filter((f) => f.range !== null)

  it('reuse the body and hand family names, mirror the Latin face weights, and point at the -cyr files', () => {
    const byFamily = new Map(cyr.map((f) => [f.family, f]))
    expect([...byFamily.keys()].sort(), 'body (Manrope) and hand (Caveat); the heading face waits for the owner').toEqual(['Caveat', 'Manrope'])
    expect(byFamily.get('Manrope')).toMatchObject({ weight: '200 800', display: 'swap', url: '/fonts/manrope-cyr.woff2' })
    expect(byFamily.get('Caveat')).toMatchObject({ weight: '600', display: 'swap', url: '/fonts/caveat-cyr.woff2' })
  })

  it('both claim the letters Russian needs, IO included (U+0401 and U+0451 sit inside U+0400-045F)', () => {
    for (const face of cyr) {
      const covers = (cp: number): boolean => parseRange(face.range ?? '').some(([lo, hi]) => cp >= lo && cp <= hi)
      expect(covers(0x401) && covers(0x451), `${face.family} claims both IO letters`).toBe(true)
      expect(covers(0x410) && covers(0x44f), `${face.family} claims A..YA and a..ya`).toBe(true)
    }
  })

  it('GRACEFUL ABSENCE IS A LEDGER: every declared file is on disk or listed, and a listed file that has landed must leave the list', () => {
    for (const face of faces) {
      const onDisk = existsSync(join(ROOT, 'public', face.url))
      const listed = GRACEFUL_ABSENT.includes(face.url)
      expect(onDisk || listed, `${face.url} is declared but neither on disk nor on the graceful-absence ledger`).toBe(true)
      expect(onDisk && listed, `${face.url} now exists – delete it from tests/helpers/fontLedger.ts, name it in public/fonts/README.md and run: npm run fonts:probe -- --require-cyrillic ${face.url.replace('/fonts/', 'public/fonts/')}`).toBe(false)
    }
  })

  it('T1 was measured on THESE bytes: the three shipped files are unchanged, so the recorded verdict (no Cyrillic) still stands', () => {
    // The spec records «0 of 256 in U+0400-04FF, 0 of 66 Russian letters» for each of the three. A prose number is only a number
    // until something ties it to the thing: this ties it to the inputs. If a file is swapped, re-run `npm run fonts:probe`, re-record
    // the verdict in docs/specs/ru-typography-2026-09.md, and re-think the Cyrillic blocks (a file that now carries Cyrillic may
    // make its block redundant).
    const sha = (file: string): string => createHash('sha256').update(readFileSync(join(ROOT, 'public/fonts', file))).digest('hex')
    expect(sha('sora-var.woff2')).toBe('3902474d3ece89c8580d5ef3325cf58753e6e45a86f9957b4dacc4fce2e7fde1')
    expect(sha('manrope-var.woff2')).toBe('e310b55a7fd9677f5e3555e6c6c4d064fa1f1d24393f0ddbe217cea12a8c432f')
    expect(sha('caveat-600.woff2')).toBe('1c591acdadd5ea398bad6aa21b36498dde59035ad366d1dbb05bbc0e537e7bc9')
  })
})

describe('L4-1 · the heading seam', () => {
  it('declares the two seam tokens with the body face as the default', () => {
    expect(css).toContain(`  --font-body-cyr: 'Manrope';\n  --font-heading-cyr: var(--font-body-cyr);`)
  })

  it('the seam sits AFTER the main token block: every test that cuts the token block from the first `:root {` must still get it', () => {
    // redesign-home, round10 and round12-view cut the token block with region(css, ':root {', '\n}\n'), which starts at the FIRST
    // `:root {` in the sheet. A small block above the main one would be read as THE token block and every colour pin would go red
    // (caught by a grep for the cutters while the first full-check run of this wave was in flight; that run was stopped and restarted).
    const first = region(css, ':root {', '\n}\n')
    expect(first, 'the first :root block is the token block').toContain('--bg: #0a0e13;')
    expect(first, 'and the seam is not in it').not.toContain('--font-heading-cyr')
  })

  it("the ONLY Russian-scoped rule overrides --font-heading alone: Sora first, then heading-cyr, then body-cyr, then today's system tail", () => {
    const scoped = [...css.matchAll(/:root\[lang\|='ru'\]\s*\{([^}]*)\}/g)].map((m) => m[1] ?? '')
    expect(scoped.length, 'one lang-scoped rule').toBe(1)
    const declarations = (scoped[0] ?? '').split(';').map((d) => d.trim()).filter(Boolean)
    expect(declarations, 'it sets exactly one property').toEqual([
      `--font-heading: 'Sora', var(--font-heading-cyr), var(--font-body-cyr), system-ui, -apple-system, 'Segoe UI', sans-serif`,
    ])
    // The body and hand tokens are NOT overridden for Russian: their Cyrillic arrives through the unicode-range faces of the same
    // family, so the chain they resolve to is identical in both languages.
    expect(css.split('--font-body:').length - 1, '--font-body declared once').toBe(1)
    expect(css.split('--font-hand:').length - 1, '--font-hand declared once').toBe(1)
    expect(css.split('--font-heading:').length - 1, '--font-heading declared twice: the shipped token and the Russian override').toBe(2)
  })
})
