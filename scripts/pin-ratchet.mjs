#!/usr/bin/env node

// THE RAW-SLICE RATCHET – R2-12 / TOK-06. OLD DEBT STAYS LEGAL; NEW DEBT DOES NOT.
//
// ⚠ WHAT IT FORBIDS, AND WHY THAT EXACT SHAPE. A source-pin region cut with
// `src.slice(src.indexOf(a), src.indexOf(b))` does not fail when a marker rots – `indexOf` returns
// -1, `slice(start, -1)` runs to one character before the end of the string, and the region
// SILENTLY WIDENS to almost the whole file. The pin then reads text it was never talking about and
// stays green. Wave B found exactly that in `tests/round13-nav.test.ts`, whose end marker
// (`const showKidHint`) had moved to a different file entirely.
//
// `tests/helpers/source.ts` now carries `region` / `regionToLast` / `regions` / `after` / `before` /
// `at` / `lastAt` / `lineAt`, all of which THROW on an absent marker. The 176 raw slices that
// existed on 24.08 were migrated to them, so the baseline below is not a list of debt to tolerate –
// it is the short list of `.slice(… indexOf …)` expressions that are NOT marker regions at all
// (`url.slice(url.lastIndexOf('/') + 1)` is a basename, not a pin).
//
// ⚠ IT IS A ONE-WAY RATCHET, DELIBERATELY (TOK-02's shape). A new raw slice is an ERROR. A baseline
// entry that disappears is reported and never fails – tightening must not need a co-ordinated
// commit, or the next person simply adds their expression to the baseline instead.
//
// ⚠ WHAT IT DOES NOT CATCH, SAID OUT LOUD. The ordering family –
// `expect(a.indexOf(X)).toBeLessThan(a.indexOf(Y))`, which passes when X is absent – is the same
// bug, and the six instances of it on a source string were migrated to `at()` by hand. It is NOT
// ratcheted, because `STOP_PRECEDENCE.indexOf('injury')` is an ARRAY lookup written identically and
// there is no way to tell them apart without types. A gate that cannot separate the two would be
// noise, and a noisy gate is one people learn to ignore.
//
// ⚠ AND IT IS LINE-ORIENTED ON PURPOSE, not an AST. The rule is "an `indexOf` result reaches a
// `slice` bound in one expression", which is precisely where the -1 gets swallowed. Splitting the
// index onto its own line with an explicit guard – `const at = …; expect(at).toBeGreaterThan(-1)` –
// is a REAL fix, not an evasion, because the -1 can no longer reach the slice unnoticed. Two
// migrated sites use that form.

import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const update = args.has('--update')
const json = args.has('--json')

const BASELINE = 'tools/generated/source-pin-baseline.json'
const ROOTS = ['tests']

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/')
}

async function walk(dir) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) return walk(file)
        return entry.isFile() && entry.name.endsWith('.ts') ? [file] : []
      }),
  )
  return nested.flat()
}

/** The file with its comment LINES blanked out, so prose that quotes the forbidden shape – this
 *  header, `tests/helpers/source.ts`, `tests/worldSource.ts` – is not a finding. Blanked rather
 *  than removed so line numbers still point at the real row. */
function withoutCommentLines(text) {
  const lines = text.split(/\r?\n/)
  let inBlock = false
  return lines.map((line) => {
    const trimmed = line.trim()
    if (inBlock) {
      if (trimmed.includes('*/')) inBlock = false
      return ''
    }
    if (trimmed.startsWith('//')) return ''
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlock = true
      return ''
    }
    return line
  })
}

/** From the `(` at `open`, the balanced argument text and the index just past the `)`. */
function readArgs(text, open) {
  let depth = 0
  let quote = null
  for (let i = open; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '(' || c === '[' || c === '{') depth++
    else if (c === ')' || c === ']' || c === '}') {
      depth--
      if (depth === 0) return { args: text.slice(open + 1, i), end: i + 1 }
    }
  }
  return null
}

/** Every `X.slice(… indexOf(…) …)` in one file, as normalized expression text. */
function rawSlices(text) {
  const found = []
  const lines = withoutCommentLines(text)
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    let from = 0
    for (;;) {
      const at = line.indexOf('.slice(', from)
      if (at < 0) break
      const parsed = readArgs(line, at + 6)
      from = at + 7
      if (!parsed) continue
      if (!/(?:^|[^\w$])(?:last)?[iI]ndexOf\s*\(/.test(parsed.args)) continue
      const receiver = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)$/.exec(line.slice(0, at))
      const expression = `${receiver ? receiver[1] : '?'}.slice(${parsed.args})`.replace(/\s+/g, ' ')
      found.push({ line: index + 1, expression })
    }
  }
  return found
}

async function main() {
  const files = (await Promise.all(ROOTS.map((dir) => walk(path.join(root, dir))))).flat()
  const current = []
  for (const file of files.sort()) {
    const text = await fs.readFile(file, 'utf8')
    for (const hit of rawSlices(text)) {
      current.push({ file: relative(file), line: hit.line, key: `${relative(file)}\t${hit.expression}` })
    }
  }

  const baselinePath = path.join(root, BASELINE)
  let baseline = []
  try {
    baseline = JSON.parse(await fs.readFile(baselinePath, 'utf8')).allowed ?? []
  } catch {
    if (!update) {
      console.error(`pin ratchet: no baseline at ${BASELINE} – run \`npm run pins:baseline\` once to snapshot today.`)
      process.exitCode = 1
      return
    }
  }

  const allowed = new Set(baseline)
  const added = current.filter((hit) => !allowed.has(hit.key))
  const currentKeys = new Set(current.map((hit) => hit.key))
  const retired = baseline.filter((key) => !currentKeys.has(key))

  if (update) {
    const next = { allowed: [...currentKeys].sort() }
    await fs.mkdir(path.dirname(baselinePath), { recursive: true })
    await fs.writeFile(baselinePath, `${JSON.stringify(next, null, 2)}\n`)
    console.log(`pin ratchet: baseline written – ${next.allowed.length} allowed raw slices`)
    return
  }

  if (json) {
    console.log(JSON.stringify({ ok: added.length === 0, total: current.length, added, retired }, null, 2))
  } else {
    console.log('Source-pin ratchet')
    console.log(`  raw marker slices in tests/: ${current.length} (baseline allows ${baseline.length})`)
    if (retired.length) {
      console.log(`  ratchet tightened: ${retired.length} baseline ${retired.length === 1 ? 'entry is' : 'entries are'} gone – run \`npm run pins:baseline\` to bank it`)
      for (const key of retired) console.log(`    retired ${key.replace('\t', ': ')}`)
    }
    if (added.length) {
      console.log(`  errors: ${added.length}`)
      for (const hit of added) {
        console.log(`    ${hit.file}:${hit.line}: ${hit.key.split('\t')[1]}`)
      }
      console.log(
        '  ⚠ A raw `slice(indexOf(...))` WIDENS when a marker rots – it does not fail. Use the marker\n' +
          '    helpers in tests/helpers/source.ts (region / regionToLast / regions / after / before /\n' +
          '    at / lastAt / lineAt); every one of them throws on an absent marker.',
      )
    } else {
      console.log('  result: ok')
    }
  }

  if (added.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
