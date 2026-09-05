// NO TEMPLATE COMMENT MAY QUOTE ITS OWN TERMINATOR (round 36 second pass, P2-1).
//
// ⚠ THIS IS A SHIPPED DEFECT MADE INTO A RULE, not a hypothetical. The owner opened
// Money -> Shop -> Water on the stand and found a paragraph of English prose under the family
// heading, beside the first card, ending in the literal terminator. The cause: an HTML comment in
// `MoneyScreen.vue` recorded a real rule about `tests/coach-voice.test.ts` and, to name the thing
// the rule is about, QUOTED an HTML comment terminator inside itself. HTML comments do not nest -
// the first terminator wins - so the comment closed there and its remaining eight lines became a
// TEXT NODE. It sat inside the `v-for` over families, so it rendered under EVERY shop family, on
// every shop page. A comment that names the thing it must not contain.
//
// WHY THIS FILE RATHER THAN A GREP. `tests/template-copy-rules.test.ts` scans the template block as
// TEXT, and text is exactly the wrong altitude here: to a regex the offending line is inside a
// comment, and that is what the browser disagrees with. This parses every component with the SFC
// compiler and walks the real AST, so the question asked is the browser's question - "what does
// this file RENDER?" - and a leaked comment is a text node whether or not it looks like one.
//
// THE THREE SHAPES, and each one is a leak rather than a style:
//   - a text node containing a terminator: a comment closed early, this is its tail;
//   - a text node containing an opener: a comment never closed, this is what followed it;
//   - a text node starting with a backtick: the tail of a sentence cut mid-quote, which is the
//     exact fingerprint of the shipped bug and the first thing the owner saw on screen.
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'
import { parse } from 'vue/compiler-sfc'

const SRC = fileURLToPath(new URL('../src', import.meta.url))

/** Every `.vue` under src/, read off the directory tree - never a list. A hard-coded list is a
 *  guard that stops covering the file somebody adds tomorrow, which is when this bug shipped. */
function vueFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) vueFiles(full, out)
    else if (entry.endsWith('.vue')) out.push(full)
  }
  return out
}

/** The compiler's AST is a union of node kinds keyed by a numeric `type`. This is the shape the
 *  walk needs and nothing else, so the file does not depend on which of compiler-core's types the
 *  `vue/compiler-sfc` entry happens to re-export. */
interface AstNode {
  type: number
  content?: unknown
  children?: unknown
  loc?: { start?: { line?: number } }
}

function isAstNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && typeof (value as { type?: unknown }).type === 'number'
}

/** ⚠ THE NODE KINDS ARE DERIVED, NOT WRITTEN DOWN. `NodeTypes` is a const enum that the
 *  `vue/compiler-sfc` entry does not re-export at runtime, and a hard-coded `2` is a number that
 *  goes quietly wrong on a compiler upgrade - it would not throw, it would just stop finding text
 *  and pass. So parse a probe whose text and comment are known and read the two kinds back off it. */
function probeNodeKinds(): { text: number; comment: number } {
  const probe = parse('<template><div>PROBE_TEXT<!--PROBE_COMMENT--></div></template>').descriptor.template
  const children = (probe?.ast?.children?.[0] as AstNode | undefined)?.children
  const nodes = Array.isArray(children) ? children.filter(isAstNode) : []
  const text = nodes.find((n) => n.content === 'PROBE_TEXT')
  const comment = nodes.find((n) => n.content === 'PROBE_COMMENT')
  if (!text || !comment) throw new Error('the SFC probe did not produce both a text and a comment node')
  return { text: text.type, comment: comment.type }
}

const KIND = probeNodeKinds()

interface Leak {
  file: string
  line: number
  why: string
  excerpt: string
}

/** Every TEXT node of one component, in document order, with the line it starts on. */
function textNodes(root: unknown, out: AstNode[] = []): AstNode[] {
  if (!isAstNode(root)) return out
  if (root.type === KIND.text) out.push(root)
  if (Array.isArray(root.children)) for (const child of root.children) textNodes(child, out)
  return out
}

const OPENER = '<!--'
const TERMINATOR = '-->'

const scanned = vueFiles(SRC).map((path) => {
  const name = relative(SRC, path)
  const { descriptor, errors } = parse(readFileSync(path, 'utf8'), { filename: path })
  const texts = descriptor.template ? textNodes(descriptor.template.ast) : []
  const leaks: Leak[] = []
  for (const node of texts) {
    const content = typeof node.content === 'string' ? node.content : ''
    const line = node.loc?.start?.line ?? 0
    const excerpt = content.trim().replace(/\s+/g, ' ').slice(0, 110)
    if (content.includes(TERMINATOR)) leaks.push({ file: name, line, why: 'comment terminator in rendered text', excerpt })
    else if (content.includes(OPENER)) leaks.push({ file: name, line, why: 'comment opener in rendered text', excerpt })
    else if (content.trim().startsWith('`')) leaks.push({ file: name, line, why: 'rendered text starts mid-quote', excerpt })
  }
  return { name, hasTemplate: Boolean(descriptor.template), textCount: texts.length, parseErrors: errors.length, leaks }
})

describe('no Vue template leaks a comment into the page (P2-1)', () => {
  it('the two node kinds are read off the compiler, and they are different', () => {
    expect(KIND.text).not.toBe(KIND.comment)
  })

  it('the scan parses the real component tree - a walk that sees nothing passes everything', () => {
    expect(scanned.length).toBeGreaterThan(30)
    expect(scanned.filter((f) => f.hasTemplate).length).toBeGreaterThan(30)
    // And it must actually reach TEXT nodes, or every assertion below is vacuous.
    expect(scanned.reduce((n, f) => n + f.textCount, 0)).toBeGreaterThan(100)
    expect(scanned.filter((f) => f.parseErrors > 0).map((f) => f.name)).toEqual([])
  })

  it('no rendered text node carries an HTML comment opener, a terminator, or an open quote', () => {
    // The message names file, line and the words the player would read, because "somewhere in 68
    // components" is not an actionable guard - the fix is to reword the comment so its body never
    // spells either delimiter.
    const offenders = scanned.flatMap((f) => f.leaks).map((l) => `${l.file}:${l.line} - ${l.why}: ${l.excerpt}`)
    expect(offenders).toEqual([])
  })
})
