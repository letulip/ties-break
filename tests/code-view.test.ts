// THE READING TOOL'S KEEP RULE, ON A FIXTURE THAT CARRIES ALL THREE MARKERS – T5.13 / H-04 O1.
//
// ⚠⚠ WHAT THIS FILE IS DEFENDING. `scripts/code-view.mjs` hides comment lines, and the comments in
// this codebase are where the owner's rulings live. A reader that dropped «мы ни за что не
// наказываем» would be worse than no reader: it would hand the next agent a file that looks as if it
// had no rules in it, and the agent would then "fix" something the owner decided. So the keep rule –
// ⚠⚠, a «» quote, any Cyrillic – is asserted three ways on a fixture built for it, and once more
// against a REAL engine module, because a fixture can be written to pass.
//
// ⚠ MUTATION ARMS, each named where it bites:
//   · drop `[«»]` from `KEEP` in scripts/code-view.mjs -> «мы ни за что не наказываем» is swallowed
//     into a `[N lines: …]` marker and the quote cases go red (both the fixture and body.ts);
//   · drop `[\u0400-\u04FF]` -> the Cyrillic-only line goes red;
//   · drop `⚠⚠` -> the double-warning case goes red;
//   · stop printing a block's FIRST line -> every collapse case goes red, because each one asserts
//     the headline is there.
// Verified 26.09 by making each edit and re-running: quoted in the wave report.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
// Plain ESM JS with a `.d.mts` beside it – the house shape for a script a test drives
// (`scripts/optimize-art.mjs`, `scripts/heavy-tests.mjs`).
import { codeView, classifyLines, KEEP } from '../scripts/code-view.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))

/**
 * THE FIXTURE. Every line here is deliberate: a `//` block whose middle lines are ordinary prose, one
 * ⚠⚠ line, one «» quote in the owner's own words, one line that is Cyrillic with no quote marks at
 * all, a JSDoc block, a code line carrying a trailing comment, and a code line that only LOOKS like a
 * comment because a string holds a double slash.
 */
const FIXTURE = [
  '// THE HEADLINE OF THE FIRST BLOCK – always printed, whatever else happens.',
  '// an ordinary prose line that may be collapsed',
  '// another ordinary prose line that may be collapsed',
  '// ⚠⚠ THIS HAS ALREADY GONE WRONG ONCE, so it is never collapsed.',
  '// one more ordinary line',
  '// «мы ни за что не наказываем» – the ruling, and it must survive verbatim.',
  '// и эта строка тоже его голос, без кавычек',
  '// a last ordinary line',
  'const weeks = 52 // a trailing comment rides with its code line',
  '',
  '/**',
  ' * A BLOCK COMMENT HEADLINE.',
  ' * a middle line nobody needs',
  ' */',
  "const url = 'https://example.test//not-a-comment'",
  '// a two-line block: the second line collapses on its own',
  '// the second line',
  '// A TAIL BLOCK, carrying the «» arm on its own.',
  '// «looks wrong to us is not the same as wrong to him» – a quoted ruling in Latin letters.',
].join('\n')

const view = codeView(FIXTURE)
const rendered = view.lines.join('\n')
/** The rendered line whose gutter number is `n`, without the gutter. */
const at = (n: number) => {
  const line = view.lines.find((l) => l.trimStart().startsWith(`${n}  `))
  return line ? line.slice(line.indexOf(`${n}  `) + `${n}  `.length) : null
}

describe('code-view keeps the rulings and collapses the prose', () => {
  it('prints code lines byte-identical, with their own line numbers', () => {
    expect(at(9)).toBe('const weeks = 52 // a trailing comment rides with its code line')
    // ⚠ A string holding `//` is CODE. The grammar only calls a line a comment when it STARTS with
    // one, which is what keeps this honest without a second TypeScript in the script.
    expect(at(15)).toBe("const url = 'https://example.test//not-a-comment'")
    expect(classifyLines(FIXTURE.split('\n'))[14]).toBe('code')
  })

  it('collapses a comment block to its first line plus [N lines: L-M]', () => {
    expect(at(1)).toBe('// THE HEADLINE OF THE FIRST BLOCK – always printed, whatever else happens.')
    expect(rendered).toContain('… [2 lines: 2-3]')
    // Lines 2 and 3 are gone as lines, not merely shortened.
    expect(rendered).not.toContain('an ordinary prose line that may be collapsed')
  })

  it('...and says «1 line» when exactly one line is hidden', () => {
    expect(rendered).toContain('… [1 line: 17]')
  })

  it('KEEPS a ⚠⚠ line in full, inside a collapsed block', () => {
    expect(at(4)).toBe('// ⚠⚠ THIS HAS ALREADY GONE WRONG ONCE, so it is never collapsed.')
  })

  it('KEEPS a «» quote in full – the owner\'s voice is the thing being defended', () => {
    expect(at(6)).toBe('// «мы ни за что не наказываем» – the ruling, and it must survive verbatim.')
    expect(rendered).toContain('«мы ни за что не наказываем»')
    // ⚠⚠ AND THE «» ARM NEEDS A LATIN LINE OR IT IS NOT TESTED AT ALL. The first draft of this file
    // asserted only the Russian quote, and deleting `[«»]` from KEEP left every case GREEN – the
    // Cyrillic clause was keeping that line. Half this codebase's «» quotes are in English
    // («Not open yet», «tests added or UPDATED»), so the arm is real and it was unguarded.
    expect(at(19)).toBe('// «looks wrong to us is not the same as wrong to him» – a quoted ruling in Latin letters.')
  })

  it('KEEPS a Cyrillic line with no quote marks at all', () => {
    expect(at(7)).toBe('// и эта строка тоже его голос, без кавычек')
  })

  it('every hidden line really is markerless – the rule has no gap', () => {
    const lines = FIXTURE.split('\n')
    const kinds = classifyLines(lines)
    const printed = new Set(
      view.lines.flatMap((l) => {
        const match = /^\s*(\d+) {2}/.exec(l)
        return match ? [Number(match[1])] : []
      }),
    )
    const swallowed = lines
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line, number }) => kinds[number - 1] === 'comment' && KEEP.test(line) && !printed.has(number))
    expect(swallowed.map((row) => row.number)).toEqual([])
  })

  it('a JSDoc block collapses the same way – and its headline is the line that SAYS something', () => {
    // ⚠ `/**` says nothing, so the first line with content is printed beside it. A view whose
    // headline is `/**` has hidden the one sentence it promised to show.
    expect(at(11)).toBe('/**')
    expect(at(12)).toBe(' * A BLOCK COMMENT HEADLINE.')
    expect(rendered).toContain('… [2 lines: 13-14]')
    expect(rendered).not.toContain('a middle line nobody needs')
  })

  it('...and on a REAL engine module the ruling survives, where a fixture could be written to pass', () => {
    // `src/engine/body.ts:104` carries «мы ни за что не наказываем» in the MIDDLE of a long block –
    // exactly the line an unconditional collapse would eat.
    const body = readFileSync(join(ROOT, 'src/engine/body.ts'), 'utf8')
    const real = codeView(body)
    const quoted = body.split('\n').filter((line) => line.includes('«мы ни за что не наказываем»'))
    expect(quoted.length).toBeGreaterThan(0) // the fixture has something to say
    for (const line of quoted) expect(real.lines.some((l) => l.endsWith(line))).toBe(true)
    // ...and it is still a saving: the point of the tool is that most of the prose does go.
    expect(real.stats.hidden).toBeGreaterThan(100)
    expect(real.lines.length).toBeLessThan(real.stats.total)
  })
})
