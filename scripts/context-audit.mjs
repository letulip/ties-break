#!/usr/bin/env node

import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const docsRoot = path.join(root, 'docs')
const args = new Set(process.argv.slice(2))
const check = args.has('--check')
const json = args.has('--json')
const verbose = args.has('--verbose')

const requiredFiles = [
  'AGENTS.md',
  'docs/context-index.md',
  'docs/context/saves-and-worker.md',
  'docs/context/simulation-and-balance.md',
  'docs/context/economy-and-progression.md',
  'docs/context/ui-and-design.md',
  'docs/context/product-and-narrative.md',
]

const allowedStatuses = new Set([
  'current',
  'draft',
  'reference',
  'audit',
  'historical',
  'superseded',
])

const sizeBudgets = new Map([
  ['AGENTS.md', 7_000],
  ['docs/context-index.md', 9_000],
  ['docs/context/saves-and-worker.md', 6_500],
  ['docs/context/simulation-and-balance.md', 6_500],
  ['docs/context/economy-and-progression.md', 6_500],
  ['docs/context/ui-and-design.md', 6_500],
  ['docs/context/product-and-narrative.md', 6_500],
])

// --- SIZE BUDGETS, AND THEY ARE WARNINGS ON PURPOSE (TOK-8) -------------------------------------
//
// The review's own framing, and it is the whole design: "Files may exceed the warning with a
// written reason: migrations, curated commentary, and tuning catalogues are legitimate exceptions.
// A hard line cap would incentivize micro-files and worse retrieval."
//
// ⚠ SO THIS NEVER FAILS A BUILD, and that is not timidity. Every hub in this repo is already over
// the suggested trigger and two of them GREW while the review sat unread - a gate that went red on
// the first commit would be switched off the same afternoon, and then nobody has the number at all.
// The trigger is a REVIEW QUESTION ("more than one reason to change?"), not a defect, so it is
// reported, counted, and left to a human. Nothing below is allowed to touch `errors`.
//
// A file may answer the question in writing: a `size-budget:` line anywhere in it records the
// reason and moves the file from the warning list to the acknowledged count. That is the written
// exception the review asks for, kept next to the code it excuses rather than in a side list.
const SOURCE_BUDGETS = {
  tsLines: 1_000,
  tsCommentCharacters: 20_000,
  vueScriptLines: 800,
}
const BUDGET_WAIVER = /size-budget:/
const SOURCE_ROOTS = ['src']

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/')
}

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.'))
      .map(async (entry) => {
        const file = path.join(dir, entry.name)
        if (entry.isDirectory()) return walkMarkdown(file)
        return entry.isFile() && entry.name.endsWith('.md') ? [file] : []
      }),
  )
  return nested.flat()
}

async function walkSource(dir) {
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
        if (entry.isDirectory()) return walkSource(file)
        return entry.isFile() && /\.(ts|vue)$/.test(entry.name) ? [file] : []
      }),
  )
  return nested.flat()
}

/** Comment volume, classified BY LINE the way the review's own table was.
 *
 *  ⚠ Deliberately not a tokenizer. A character-level scanner has to tell `//` inside a regex
 *  literal from a comment, gets it wrong on `/^\/\//`, and silently over-counts - and this number
 *  only ever raises a question for a human, so robustness beats precision. A line whose content
 *  begins with `//`, `/*` or a block-comment continuation is comment; everything else is code,
 *  including a trailing comment on a line of code (which is under-counting, and the safe
 *  direction). */
function commentMetrics(text) {
  const lines = text.split(/\r?\n/)
  let inBlock = false
  let commentLines = 0
  let commentCharacters = 0

  for (const line of lines) {
    const trimmed = line.trim()
    let isComment = inBlock
    if (!inBlock) {
      if (trimmed.startsWith('//')) isComment = true
      else if (trimmed.startsWith('/*')) {
        isComment = true
        if (!trimmed.includes('*/')) inBlock = true
      }
    } else if (trimmed.includes('*/')) {
      inBlock = false
    }
    if (isComment) {
      commentLines += 1
      commentCharacters += line.length + 1
    }
  }

  return { commentLines, commentCharacters }
}

/** The physical lines inside an SFC's `<script>` blocks – the measure the review budgets, because
 *  a template is not the thing that makes a component expensive to reason about. */
function scriptLines(text) {
  let total = 0
  for (const match of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    total += match[1].split(/\r?\n/).length
  }
  return total
}

async function sourceBudgets() {
  const files = (await Promise.all(SOURCE_ROOTS.map((dir) => walkSource(path.join(root, dir))))).flat()
  const over = []
  let acknowledged = 0

  for (const file of files.sort()) {
    const text = await fs.readFile(file, 'utf8')
    const rel = relative(file)
    const triggers = []

    if (rel.endsWith('.vue')) {
      const lines = scriptLines(text)
      if (lines > SOURCE_BUDGETS.vueScriptLines) {
        triggers.push({
          measure: 'script lines',
          value: lines,
          trigger: SOURCE_BUDGETS.vueScriptLines,
          question: 'multiple state owners or independently testable panels?',
        })
      }
    } else {
      const lines = text.split(/\r?\n/).length
      if (lines > SOURCE_BUDGETS.tsLines) {
        triggers.push({
          measure: 'lines',
          value: lines,
          trigger: SOURCE_BUDGETS.tsLines,
          question: 'more than one reason to change?',
        })
      }
      const { commentCharacters } = commentMetrics(text)
      if (commentCharacters > SOURCE_BUDGETS.tsCommentCharacters) {
        triggers.push({
          measure: 'comment characters',
          value: commentCharacters,
          trigger: SOURCE_BUDGETS.tsCommentCharacters,
          question: 'is the history compressible to an invariant plus a decision link?',
        })
      }
    }

    if (!triggers.length) continue
    if (BUDGET_WAIVER.test(text)) {
      acknowledged += 1
      continue
    }
    over.push({ file: rel, triggers, worst: Math.max(...triggers.map((t) => t.value / t.trigger)) })
  }

  over.sort((a, b) => b.worst - a.worst)
  return { files: files.length, over, acknowledged }
}

// --- THE CORRECTION PAIR: ONE MECHANIC, TWO DOCUMENTS, BOTH STILL CURRENT ------------------------
//
// ⚠ THE HOLE THIS CLOSES. Everything else here asks whether a document is well-formed; nothing
// asked whether TWO of them describe the same mechanic with different answers. The corpus writes a
// correction as a sibling file - `x-corrected-2026-08.md` beside `x-2026-08.md` - and the audit
// waved both through as `current`, so a reader who found the older one had no signal at all that a
// document three lines away in the same directory says something else. Two such pairs existed.
//
// ⚠ NARROW BY THE SAME RULE AS THE AGE GRID. It reads the FILENAME CONVENTION and nothing else: no
// prose similarity, no title matching, no guessing at what "the same mechanic" means. A correction
// that does not use the convention is not caught, and that is the trade - this fires only where the
// author already declared the relationship in the name, which is why it cannot produce a false
// positive that costs somebody an afternoon.
const CORRECTION_SEGMENTS = new Set(['corrected', 'correction'])

/** The document a `-corrected-` file is the correction OF, if the corpus holds one. */
function correctionBases(rel) {
  const directory = rel.slice(0, rel.lastIndexOf('/'))
  const name = rel.slice(rel.lastIndexOf('/') + 1).replace(/\.md$/, '')
  const parts = name.split('-')
  const bases = []
  for (let index = 0; index < parts.length; index++) {
    if (!CORRECTION_SEGMENTS.has(parts[index])) continue
    const without = [...parts.slice(0, index), ...parts.slice(index + 1)]
    if (without.length) bases.push(`${directory}/${without.join('-')}.md`)
  }
  return bases
}

function parseScalar(value) {
  const trimmed = value.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== '---') return null
  const end = lines.indexOf('---', 1)
  if (end === -1) return null

  const metadata = {}
  for (const line of lines.slice(1, end)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (match) metadata[match[1]] = parseScalar(match[2])
  }
  return { metadata, body: lines.slice(end + 1).join('\n') }
}

function estimateTokens(text) {
  // Deliberately a rough, tokenizer-independent planning number. English prose/code commonly
  // clusters near four characters per token; use API usage fields for billing-grade counts.
  return Math.ceil(text.length / 4)
}

function markdownTargets(text) {
  const targets = []
  const lines = text.split(/\r?\n/)
  let fence = null

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const fenceMatch = /^\s*(```+|~~~+)/.exec(line)
    if (fenceMatch) {
      const marker = fenceMatch[1][0]
      fence = fence === marker ? null : fence ?? marker
      continue
    }
    if (fence) continue

    const withoutInlineCode = line.replace(/`[^`]*`/g, '')
    const pattern = /!?\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g
    for (const match of withoutInlineCode.matchAll(pattern)) {
      let target = match[1]
      if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1)
      targets.push({ target, line: index + 1 })
    }
  }

  return targets
}

function isExternalTarget(target) {
  return (
    target.startsWith('#') ||
    target.startsWith('/') ||
    target.startsWith('mailto:') ||
    target.startsWith('tel:') ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  )
}

async function resolveLocalTarget(source, rawTarget) {
  const unescaped = rawTarget.replace(/\\([() ])/g, '$1')
  const pathPart = unescaped.split('#', 1)[0].split('?', 1)[0]
  if (!pathPart) return null

  let decoded
  try {
    decoded = decodeURIComponent(pathPart)
  } catch {
    decoded = pathPart
  }

  const candidate = path.resolve(path.dirname(source), decoded)
  if (await exists(candidate)) return candidate

  // Some review documents preserve source locations as `file.ts:123`. Accept the link when the
  // file before the line suffix exists; the audit checks reachability, not line freshness.
  const withoutLine = candidate.replace(/:\d+(?::\d+)?$/, '')
  if (withoutLine !== candidate && (await exists(withoutLine))) return withoutLine
  return candidate
}

// --- THE AGE GRID, CHECKED AGAINST THE CONSTANTS RATHER THAN AGAINST CARE ------------------------
//
// ⚠⚠ WHY THIS EXISTS, AND IT IS A MEASURED FAILURE RATHER THAN A TIDINESS RULE (16.08). The age grid
// was RESTATED IN PROSE, in its own words, in every spec that happened to mention it - each one
// honestly describing the constants on the day it was written. The copies drifted, and the owner was
// handed the same contradiction about what a W15 field is TWICE before he closed it: «у нас есть
// регламент, точка. Разрули противоречия и оставь один источник истины, хватит мне это возвращать.»
//
// One sweep found 33 offending lines across the corpus. It found something worse as well: the design
// pillar those documents were defending - "a sixteen-to-eighteen-year-old holds both tours at once" -
// was quoted as `adult-tour-and-endings.md` §4.1's own words in FOUR places and §4.1 never contained
// it. A paraphrase was re-quoted until it became a citation. Care had already failed; the answer had
// to be mechanical.
//
// THE RULE: a documentation line that names a tier AND an age which disagrees with that tier's
// `minAgeYears` is an error - UNLESS the file links the grid's one prose copy, in which case a stale
// number is legal because the correction is next to it. That is exactly what §0a declares in words.
//
// ⚠ DELIBERATELY NARROW. It reads only `minAgeYears`, only when tier and age sit on ONE line, and it
// says nothing about ceilings, allowances or the AER. A looser "any grid-shaped line needs the
// pointer" variant was measured on this corpus at 95 lines in 31 files, 12 of them failing and about
// 7 of those legitimately - too noisy to ship, and a noisy gate is one people learn to ignore.
const GRID_POINTER = 'college-is-its-own-branch-2026-08.md'

/** Tier id -> minAgeYears, parsed out of the engine. THE CONSTANTS ARE THE TRUTH and this reads them
 *  rather than carrying a second copy, which would be the very defect it exists to catch. */
async function tierFloors() {
  const source = await fs.readFile(path.join(root, 'src/engine/season/calendar.ts'), 'utf8')
  const floors = new Map()
  // Each tier opens `  <id>: {` at one indent and the field sits inside it; the first floor after a
  // header belongs to that header. Tolerant by design: a tier with no floor simply never lands.
  const pattern = /^ {2}(\w+): \{$|^ {4}minAgeYears: (\d+),/gm
  let current = null
  for (const match of source.matchAll(pattern)) {
    if (match[1]) current = match[1]
    else if (current && !floors.has(current)) floors.set(current, Number(match[2]))
  }
  return floors
}

/** How each tier is written in prose. The docs say "W15" and "WTA 250", never `w15` or `wta250`. */
function tierPhrases(id) {
  if (id.startsWith('wta')) return [`WTA ${id.slice(3)}`]
  if (id === 'slam') return ['Grand Slam', 'Slam']
  return [id.toUpperCase()]
}

/** Lines that name a tier and an age contradicting its floor. */
function gridContradictions(rel, body, floors, lineOffset) {
  if (body.includes(GRID_POINTER)) return []
  const hits = []
  const lines = body.split(/\r?\n/)
  for (const [id, floor] of floors) {
    for (const phrase of tierPhrases(id)) {
      // The age has to sit within a short reach of the tier's own name, or every long paragraph that
      // happens to contain both a rung and a number becomes a finding.
      // ⚠ THE VERB LIST IS THE WHOLE PRECISION, AND THE FIRST DRAFT'S WAS NOT. It included a bare
      // "from", which turned "careers entering a WTA 125 from 27 to 64" (a COUNT) and "the ratio goes
      // from 16.6%" (a PERCENTAGE) into age findings - two false positives out of three hits on the
      // first run. Only phrasings that can mean an age survive, the number must be inside the grid's
      // own range, and a decimal point or a percent sign after it disqualifies it.
      const near = new RegExp(
        `${phrase}\\b[^.\\n]{0,60}?\\b(?:opens? (?:at|in)|open(?:s|ed)? to|floor (?:is|of)|minAgeYears:?|from age|at age) (?:age )?(1[3-8])\\b(?![.%])`,
        'i',
      )
      lines.forEach((line, i) => {
        const found = near.exec(line)
        if (found && Number(found[1]) !== floor) {
          hits.push(`${rel}:${i + 1 + lineOffset} says ${phrase} at ${found[1]}, the constant is ${floor}`)
        }
      })
    }
  }
  return hits
}

async function main() {
  const errors = []
  const warnings = []

  for (const file of requiredFiles) {
    if (!(await exists(path.join(root, file)))) errors.push(`missing required file: ${file}`)
  }

  const docs = (await walkMarkdown(docsRoot)).sort()
  const linkedFiles = [path.join(root, 'AGENTS.md'), path.join(root, 'README.md'), ...docs].filter(
    (file) => requiredFiles.includes(relative(file)) || relative(file) === 'README.md' || file.startsWith(docsRoot),
  )
  const records = []
  const brokenLinks = []

  for (const file of linkedFiles) {
    if (!(await exists(file))) continue
    const text = await fs.readFile(file, 'utf8')
    const frontmatter = parseFrontmatter(text)
    const rel = relative(file)
    records.push({
      file: rel,
      characters: text.length,
      lines: text.split(/\r?\n/).length,
      estimatedTokens: estimateTokens(text),
      metadata: frontmatter?.metadata ?? null,
      body: frontmatter?.body ?? text,
      // ⚠ HOW MANY LINES THE FRONTMATTER ATE. Without it a body-relative line number is reported as a
      // file line number, and the reader opens the file at the wrong row - which is worse than no
      // number at all, because it looks authoritative. Caught the first time the grid rule fired.
      bodyLineOffset: text.split(/\r?\n/).length - (frontmatter?.body ?? text).split(/\r?\n/).length,
    })

    for (const { target, line } of markdownTargets(text)) {
      if (isExternalTarget(target)) continue
      const resolved = await resolveLocalTarget(file, target)
      if (resolved && !(await exists(resolved))) brokenLinks.push(`${rel}:${line} -> ${target}`)
    }
  }

  const docsRecords = records.filter((record) => record.file.startsWith('docs/'))
  const governed = docsRecords.filter((record) => record.metadata)
  const canonical = governed.filter((record) => record.metadata.canonical === true)
  const unclassified = docsRecords.filter((record) => !record.metadata).map((record) => record.file)
  const canonicalByArea = new Map()

  for (const record of governed) {
    const { metadata } = record
    if (metadata.status && !allowedStatuses.has(metadata.status)) {
      errors.push(`${record.file}: unsupported status '${metadata.status}'`)
    }
    if (metadata.status === 'superseded' && !metadata['superseded-by']) {
      errors.push(`${record.file}: superseded document has no superseded-by`)
    }
    if (!metadata.type || !metadata.status || !metadata.area || !metadata['last-reviewed']) {
      warnings.push(`${record.file}: incomplete governance metadata`)
    }
    if (metadata.canonical === true) {
      const missing = ['type', 'status', 'area', 'last-reviewed'].filter((field) => !metadata[field])
      if (missing.length) errors.push(`${record.file}: canonical document missing ${missing.join(', ')}`)
      if (metadata.status !== 'current') {
        errors.push(`${record.file}: canonical document must have status current`)
      }
      if (!/^## Current truth\s*$/m.test(record.body)) {
        errors.push(`${record.file}: canonical document needs a '## Current truth' section`)
      }
      const areaFiles = canonicalByArea.get(metadata.area) ?? []
      areaFiles.push(record.file)
      canonicalByArea.set(metadata.area, areaFiles)
    }
  }

  for (const [area, files] of canonicalByArea) {
    if (files.length > 1) errors.push(`canonical area '${area}' has multiple documents: ${files.join(', ')}`)
  }

  const byFile = new Map(records.map((record) => [record.file, record]))
  const correctionPairs = []
  for (const record of docsRecords) {
    for (const base of correctionBases(record.file)) {
      const superseded = byFile.get(base)
      if (!superseded) continue
      correctionPairs.push({ correction: record.file, base })
      const status = superseded.metadata?.status ?? 'unclassified'
      if (status !== 'superseded') {
        errors.push(
          `correction pair: ${record.file} corrects ${base}, but ${base} is still '${status}' - ` +
            `set status: superseded and superseded-by: ${record.file}`,
        )
        continue
      }
      const pointer = superseded.metadata['superseded-by']
      if (pointer !== record.file) {
        warnings.push(
          `correction pair: ${base} is superseded by '${pointer}' rather than by its own correction ${record.file}`,
        )
      }
    }
  }

  for (const link of brokenLinks) errors.push(`broken local link: ${link}`)

  const budgets = []
  for (const [file, maximum] of sizeBudgets) {
    const record = records.find((candidate) => candidate.file === file)
    if (!record) continue
    const result = {
      file,
      characters: record.characters,
      estimatedTokens: record.estimatedTokens,
      maximumCharacters: maximum,
      ok: record.characters <= maximum,
    }
    budgets.push(result)
    if (!result.ok) errors.push(`${file}: ${record.characters} characters exceeds ${maximum} context budget`)
  }

  // ⚠ THE ONE CHECK THAT READS THE ENGINE. Everything else in this file is about the corpus's own
  // shape; this asks whether the corpus still agrees with the code, which is the question that kept
  // reaching the owner. See the note on `GRID_POINTER`.
  const floors = await tierFloors()
  const gridDrift = docsRecords.flatMap((record) => gridContradictions(record.file, record.body, floors, record.bodyLineOffset))
  for (const drift of gridDrift) errors.push(`age grid: ${drift}`)

  const totals = records.reduce(
    (sum, record) => ({
      characters: sum.characters + record.characters,
      lines: sum.lines + record.lines,
      estimatedTokens: sum.estimatedTokens + record.estimatedTokens,
    }),
    { characters: 0, lines: 0, estimatedTokens: 0 },
  )

  const largest = [...docsRecords]
    .sort((a, b) => b.estimatedTokens - a.estimatedTokens)
    .slice(0, 5)
    .map(({ file, estimatedTokens, lines }) => ({ file, estimatedTokens, lines }))

  const source = await sourceBudgets()

  const result = {
    ok: errors.length === 0,
    check,
    totals: { files: records.length, ...totals },
    governance: {
      documents: docsRecords.length,
      governed: governed.length,
      canonical: canonical.length,
      unclassified: unclassified.length,
    },
    budgets,
    correctionPairs,
    // ⚠ A SEPARATE FIELD FROM `errors` AND FROM `warnings`, DELIBERATELY. Not `errors` because a
    // size trigger is a question, not a defect (see SOURCE_BUDGETS); not `warnings` because a dozen
    // hub files would crowd out the governance warnings that DO need answering.
    sourceBudgets: {
      files: source.files,
      trigger: SOURCE_BUDGETS,
      acknowledged: source.acknowledged,
      over: source.over.map(({ file, triggers }) => ({ file, triggers })),
    },
    largest,
    errors,
    warnings,
    ...(verbose ? { unclassifiedFiles: unclassified } : {}),
  }

  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log('Context audit')
    console.log(
      `  corpus: ${result.totals.files} Markdown files, ${result.totals.lines.toLocaleString('en-US')} lines, ~${result.totals.estimatedTokens.toLocaleString('en-US')} tokens`,
    )
    console.log(
      `  governance: ${governed.length}/${docsRecords.length} docs classified, ${canonical.length} canonical, ${unclassified.length} unclassified`,
    )
    console.log('  recurring context budgets:')
    for (const budget of budgets) {
      console.log(
        `    ${budget.ok ? 'ok' : 'FAIL'} ${budget.file}: ~${budget.estimatedTokens.toLocaleString('en-US')} tokens`,
      )
    }
    console.log('  largest documents (do not load by default):')
    for (const record of largest) {
      console.log(
        `    ${record.file}: ~${record.estimatedTokens.toLocaleString('en-US')} tokens / ${record.lines.toLocaleString('en-US')} lines`,
      )
    }
    // ⚠ WARNINGS. This block never fails the run – see SOURCE_BUDGETS.
    console.log(
      `  size budgets (warnings, never a failure): ${source.over.length} of ${source.files} source files over a review trigger` +
        (source.acknowledged ? `, ${source.acknowledged} with a written reason` : ''),
    )
    const shown = verbose ? source.over : source.over.slice(0, 8)
    for (const entry of shown) {
      for (const trigger of entry.triggers) {
        console.log(
          `    ${entry.file}: ${trigger.value.toLocaleString('en-US')} ${trigger.measure} over ${trigger.trigger.toLocaleString('en-US')} - ${trigger.question}`,
        )
      }
    }
    if (source.over.length > shown.length) {
      console.log(`    ... and ${source.over.length - shown.length} more (--verbose to list)`)
    }
    if (correctionPairs.length) {
      console.log(`  correction pairs: ${correctionPairs.length}`)
      for (const pair of correctionPairs) console.log(`    ${pair.correction} corrects ${pair.base}`)
    }
    if (warnings.length) {
      console.log(`  warnings: ${warnings.length}`)
      for (const warning of warnings.slice(0, verbose ? warnings.length : 10)) console.log(`    ${warning}`)
    }
    if (errors.length) {
      console.log(`  errors: ${errors.length}`)
      for (const error of errors) console.log(`    ${error}`)
    } else {
      console.log('  result: ok')
    }
    if (unclassified.length && !verbose) console.log('  hint: use --verbose to list unclassified documents')
  }

  if (check && errors.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})

