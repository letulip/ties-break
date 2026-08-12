// ⚠ THE STYLESHEET IS PARSED AND CHECKED FOR ONE SHAPE: A SELECTOR LIST THAT SWALLOWED THE RULE
// UNDER IT.
//
// WHY IT EXISTS. On 12.08 the owner reported two regressions that looked nothing like each other –
// «у попапа с подтверждением записи на матч пропала подложка, остался только текст» and «весь блок
// draw и ниже стал сильно уже экрана» – and they were ONE broken comma. Round-17 #5 made the planner
// a takeover and removed `.plan-sheet` from the shared panel rule, but what went with the selector
// was the whole DECLARATION BLOCK:
//
//     .dialog-card,
//     .replay-card,
//     .tf-card,
//     .guide-card,
//     /* a comment explaining that .plan-sheet left */
//
//     .dialog-card { width: 100%; max-width: 320px }
//
// CSS does not stop at a comment or at a blank line. The parser read on, took `.dialog-card` as the
// list's last item and applied the NEXT rule's declarations to all five – so the panel treatment
// (background, hairline, radius, 16px) ceased to exist for four surfaces AND `max-width: 320px` was
// handed to `.tf-card` and `.guide-card`. Nothing was red. `npm run check` cannot see it: the file
// is still valid CSS, it simply says something else now.
//
// ⚠ AND THIS IS WHY IT IS A SHEET-WIDE RULE AND NOT TWO ASSERTIONS ABOUT TWO DIALOGS. The general
// fault is that a SHARED rule was deleted because ONE of its consumers stopped needing it. A mounted
// assertion per symptom would have caught these two and nothing about the next one; what has to be
// noticed is the shape itself. `tests/component/round17-surfaces.test.ts` carries the mounted half
// for the two surfaces the owner actually looked at.
//
// ⚠ MUTATION-VERIFIED. Both rules were watched failing against the real defect: restoring d506ed9's
// text (the trailing comma plus the comment) turns BOTH red – rule A on the repeated `.dialog-card`,
// rule B on the blank line inside the prelude – and each one alone would have been enough.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SHEET = 'src/style.css'
const css = readFileSync(resolve(process.cwd(), SHEET), 'utf8')

interface Rule {
  /** the text between the previous block and this rule's `{`, comments and all */
  raw: string
  /** ...and the same text with comments removed, which is what the browser actually reads */
  selectors: string
  /** 1-based, for an error a human can jump to */
  line: number
}

/** The prelude minus everything BEFORE the first selector – the rule's own block comment and the
 *  blank lines around it are not part of its selector list, and reading them as if they were is what
 *  made the first draft of rule B fire on four healthy rules. Leading whitespace and whole comments
 *  are dropped, in any order and any number; a comment AFTER a selector has started is kept, because
 *  that is the position the defect lives in. */
function fromFirstSelector(raw: string): string {
  let i = 0
  for (;;) {
    while (i < raw.length && /\s/.test(raw[i])) i++
    if (raw.slice(i, i + 2) !== '/*') break
    const end = raw.indexOf('*/', i + 2)
    if (end === -1) return ''
    i = end + 2
  }
  return raw.slice(i)
}

/** Every rule PRELUDE in the sheet, at any nesting depth, with `@`-rules and the insides of
 *  `@keyframes` left out – a keyframe selector list is `0%, 100%` and means something else. */
function preludes(source: string): Rule[] {
  const out: Rule[] = []
  let depth = 0
  let keyframesDepth = -1
  let start = 0
  let i = 0
  while (i < source.length) {
    const two = source.slice(i, i + 2)
    if (two === '/*') {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 2
      continue
    }
    const ch = source[i]
    if (ch === '"' || ch === "'") {
      const quote = ch
      i++
      while (i < source.length && source[i] !== quote) i += source[i] === '\\' ? 2 : 1
      i++
      continue
    }
    if (ch === '{') {
      const raw = fromFirstSelector(source.slice(start, i))
      const isAtRule = raw.startsWith('@')
      if (isAtRule && /^@keyframes\b/.test(raw) && keyframesDepth === -1) keyframesDepth = depth
      if (!isAtRule && keyframesDepth === -1 && raw.trim() !== '') {
        out.push({
          raw,
          selectors: raw.replace(/\/\*[\s\S]*?\*\//g, ' '),
          line: source.slice(0, i).split('\n').length,
        })
      }
      depth++
      i++
      start = i
      continue
    }
    if (ch === '}') {
      depth--
      if (keyframesDepth !== -1 && depth <= keyframesDepth) keyframesDepth = -1
      i++
      start = i
      continue
    }
    if (ch === ';' && depth === 0) {
      i++
      start = i
      continue
    }
    i++
  }
  return out
}

const rules = preludes(css)

describe(`${SHEET} – selector lists`, () => {
  it('has rules to check at all (the parser is not silently returning nothing)', () => {
    // ⚠ THE GUARD AGAINST A VACUOUS PASS. A scanner that returned [] would make every assertion
    // below true, which is the failure mode `contrast.ts` documents for a stylesheet-less mount.
    // A FLOOR AND NOT THE COUNT (it reads 400 today): this asserts the parser is working, not how
    // many rules the sheet is allowed to have, and a count would be a tripwire on every new rule.
    expect(rules.length).toBeGreaterThan(300)
  })

  // RULE A. A selector repeated inside ONE list is the fingerprint of a swallowed rule: the parser
  // ran a dangling list into the next rule's prelude, and the two overlapped. Nobody writes
  // `.a, .b, .a { }` on purpose, so this has no legitimate form to allow for.
  it('never names the same selector twice in one list', () => {
    const offenders: string[] = []
    for (const rule of rules) {
      const parts = rule.selectors
        .split(',')
        .map((s) => s.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
      const seen = new Set<string>()
      for (const part of parts) {
        if (seen.has(part)) offenders.push(`${SHEET}:${rule.line} repeats \`${part}\``)
        seen.add(part)
      }
    }
    expect(offenders).toEqual([])
  })

  // RULE B. A blank line INSIDE a selector list. The sheet's own style puts one rule per paragraph,
  // so a blank line between two selectors means a declaration block that used to be there is not –
  // which is the general shape, and it catches the case where the swallowed rule's selector happens
  // NOT to repeat one above it (rule A's blind spot).
  //
  // ⚠ COMMENTS ARE LEFT IN for this one, deliberately. A note explaining why a selector is in the
  // list is normal and must stay legal (`.a,\n/* why */\n.b {`); stripping comments first would
  // collapse that into a blank line and make this rule fire on good CSS.
  it('never runs a selector list across a blank line', () => {
    const offenders: string[] = []
    for (const rule of rules) {
      if (!rule.selectors.includes(',')) continue
      if (/\n[ \t]*\n/.test(rule.raw.trim())) {
        offenders.push(`${SHEET}:${rule.line} \`${rule.selectors.trim().split('\n')[0]} ...\``)
      }
    }
    expect(offenders).toEqual([])
  })
})
