// THE CENSUS'S PURE TEXT HELPERS – hole handling and the comparison key (extracted from the walker, L1b).
//
// Pure functions and one constant, no scan: the walker (tools/copy-census-walk.ts) imports them, and so does
// the i18n importer, which must normalise an owner-table cell EXACTLY the way the census normalised a source
// literal – but must not pay the walker's 2 s scan on import to do it.

export const HOLE = '¤'

// ── text helpers ─────────────────────────────────────────────────────────────────────────────────
/** Every `${…}` (brace-depth aware, so `${f({a: 1})}` is one hole) becomes one HOLE character. */
export function holeify(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '$' && text[i + 1] === '{') {
      let depth = 1
      let j = i + 2
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') depth--
        j++
      }
      out += HOLE
      i = j - 1
    } else out += text[i]
  }
  return out
}
export const bareOf = (text: string): string => holeify(text).split(HOLE).join(' ').trim()
export const letterCount = (s: string): number => (s.match(/[\p{L}\p{N}]/gu) ?? []).length
export const wordsOf = (text: string): number => bareOf(text).split(/\s+/).filter(Boolean).length
export const hasHole = (text: string): boolean => holeify(text).includes(HOLE)
/** A comparison key that survives the doc's `{name}` / `{{ x }}` spellings and the source's `${…}`. */
export function normKey(s: string): string {
  const unified = s
    .replace(/\{\{[^}]*\}\}/g, '${x}')
    .replace(/(^|[^$])\{[A-Za-z_][\w.]*\}/g, '$1${x}')
    .replace(/\*[A-Za-z]{1,12}\*/g, '${x}') // the wave-7 tables write a hole as *N* / *finish*
  return holeify(unified).replace(/`¤`/g, HOLE).replace(/\s+/g, ' ').trim()
}

