#!/usr/bin/env node

// THE READING TOOL – H-04 option O1, T5.13 of the principles fix (26.09). `npm run code:view -- <file>`
//
// WHAT IT IS FOR, PRICED. 75.6 % of `src`'s tokens are comments (78.3 % of `src/engine`), and the
// share is growing at 1.99 comment lines per code line added. An agent that needs `lifeBeat.ts`'s
// LOGIC pays 165,558 tokens to load the file, of which 27,805 is the logic – about 6x. This prints
// the code with its line numbers and collapses each comment block to its first line plus
// `[N lines: L-M]`, so a reader takes the shape of the file first and opens a block by line range
// when it turns out to matter.
//
// ⚠⚠ THE KEEP RULE IS THE WHOLE POINT, AND IT IS NOT AN OPTIMISATION. The comments in this codebase
// carry the OWNER'S RULINGS – «Я это не просил. Верни как было пожалуйста», «надо добрать, не вижу
// проблем» – and a reader that hid «мы ни за что не наказываем» would be worse than no reader at
// all: it would hand an agent a file that looks like it has no rules in it. So three markers are
// ALWAYS printed in full, wherever they sit inside a collapsed block:
//   ⚠⚠   the double warning – the class this codebase reserves for «this has already gone wrong»
//   «»   a quote, which here almost always means the owner said it
//   Cyrillic – he writes in Russian, so a Cyrillic line is his voice verbatim
// A single ⚠ is NOT in the set, deliberately: the finding's own mitigation is that a block's
// HEADLINE line is always printed, and single-⚠ blocks lead with it. Nothing is ever paraphrased and
// nothing is rewritten – every line this prints is byte-identical to the file's.
//
// ⚠ IT READS, IT NEVER WRITES. No file in the repository changes, no pin moves, no ruling moves.
// H-04's options O2 (chronicles behind a pointer) and O3 (a growth ratchet) are the owner's calls and
// are not this tool.
//
// The comment grammar is deliberately shallow, because a full parse would be a second TypeScript:
// a line is a comment when it STARTS with `//`, `/*` or `<!--` (after whitespace), or sits inside an
// unclosed `/* … */` or `<!-- … -->`. A trailing comment on a code line is part of the code line and
// is printed. `const url = 'http://x'` is code, because the line does not start with `//`.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** ⚠⚠, a «» quote, or any Cyrillic letter: the three marks that are never collapsed. */
export const KEEP = /⚠⚠|[«»]|[\u0400-\u04FF]/

/**
 * Does a comment line SAY anything? `/**`, `*` and a bare `//` do not, and a block that opens on one
 * would otherwise print a headline of `/**` – which is the one shape that makes a collapsed view
 * useless, because the sentence the reader needs is the line below it.
 */
function hasContent(raw) {
  return (
    raw
      .trim()
      .replace(/^(\/\/+|\/\*+|\*+|<!--)/, '')
      .replace(/(\*\/|-->)$/, '')
      .trim() !== ''
  )
}

/** `'comment' | 'code' | 'blank'` per line, in one pass. */
export function classifyLines(lines) {
  const kinds = []
  let closer = null
  for (const raw of lines) {
    const line = raw.trim()
    if (closer) {
      kinds.push('comment')
      if (line.includes(closer)) closer = null
      continue
    }
    if (line === '') {
      kinds.push('blank')
      continue
    }
    if (line.startsWith('//')) {
      kinds.push('comment')
      continue
    }
    if (line.startsWith('/*') || line.startsWith('<!--')) {
      const end = line.startsWith('/*') ? '*/' : '-->'
      kinds.push('comment')
      if (!line.slice(2).includes(end)) closer = end
      continue
    }
    kinds.push('code')
  }
  return kinds
}

/**
 * The view, as lines plus what it cost. Pure – takes text, returns strings; the CLI below does the
 * reading and the printing, and the test drives this.
 */
export function codeView(text) {
  const lines = text.split('\n')
  // A trailing newline leaves one empty element; dropping it makes `total` the file's own line count.
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  const kinds = classifyLines(lines)
  const width = String(lines.length).length
  const gutter = (number) => `${String(number).padStart(width)}  `
  const blank = `${' '.repeat(width)}  `

  const out = []
  const stats = { total: lines.length, blocks: 0, collapsed: 0, hidden: 0, kept: 0 }
  let index = 0
  while (index < lines.length) {
    if (kinds[index] !== 'comment') {
      out.push(`${gutter(index + 1)}${lines[index]}`.trimEnd())
      index += 1
      continue
    }
    let end = index
    while (end < lines.length && kinds[end] === 'comment') end += 1
    stats.blocks += 1
    // The block's first line is always printed – it is the headline, and it is what makes a
    // single-⚠ block visible at all. ⚠ A `/**` opener says nothing, so the first line that DOES say
    // something is printed too: a view whose headline is `/**` has hidden the sentence it promised.
    out.push(`${gutter(index + 1)}${lines[index]}`.trimEnd())
    let needHeadline = !hasContent(lines[index])
    let run = []
    const flushRun = () => {
      if (!run.length) return
      const span = run.length === 1 ? `1 line: ${run[0]}` : `${run.length} lines: ${run[0]}-${run[run.length - 1]}`
      out.push(`${blank}… [${span}]`)
      stats.hidden += run.length
      stats.collapsed += 1
      run = []
    }
    for (let at = index + 1; at < end; at += 1) {
      if (needHeadline && hasContent(lines[at])) {
        flushRun()
        out.push(`${gutter(at + 1)}${lines[at]}`.trimEnd())
        needHeadline = false
      } else if (KEEP.test(lines[at])) {
        flushRun()
        out.push(`${gutter(at + 1)}${lines[at]}`.trimEnd())
        stats.kept += 1
      } else {
        run.push(at + 1)
      }
    }
    flushRun()
    index = end
  }
  return { lines: out, stats }
}

/** The one-line verdict, so a reader knows how much was hidden and where the rule bit. */
export function summarise(stats, printed) {
  const share = stats.total ? ((printed / stats.total) * 100).toFixed(1) : '0.0'
  return (
    `— code-view: ${printed} of ${stats.total} lines (${share} %); ` +
    `${stats.hidden} comment lines collapsed into ${stats.collapsed} markers over ${stats.blocks} blocks, ` +
    `${stats.kept} kept whole for ⚠⚠/«»/Cyrillic`
  )
}

// Standalone only. Imported by tests/code-view.test.ts, which must not trigger the CLI.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2]
  if (!file) {
    console.error('usage: node scripts/code-view.mjs <file>   (or: npm run code:view -- <file>)')
    process.exit(1)
  }
  let text
  try {
    text = await readFile(resolve(file), 'utf8')
  } catch {
    console.error(`code-view: cannot read ${file}`)
    process.exit(1)
  }
  const { lines, stats } = codeView(text)
  console.log(lines.join('\n'))
  console.log(summarise(stats, lines.length))
}
