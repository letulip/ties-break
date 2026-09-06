#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const docsRoot = path.join(root, 'docs')
const args = new Set(process.argv.slice(2))
const check = args.has('--check')
const json = args.has('--json')
const verbose = args.has('--verbose')
const updateBaseline = args.has('--update-baseline')

// --- THE BASELINE, AND IT IS A ONE-WAY RATCHET (R2-12; TOK-02, TOK-05) --------------------------
//
// ⚠ THE HOLE IT CLOSES. This audit counted 136 unclassified documents and 44 over-budget source
// files, and then let a 137th and a 45th join them in silence. A count that only ever goes up is a
// number, not a guard: the review's own words are "snapshot the legacy unclassified set and make it
// a one-way ratchet – a newly added document needs metadata; an existing unclassified document
// needs metadata when materially edited. Classify old files only when touched."
//
// SO THE TWO HALVES ARE DELIBERATELY DIFFERENT, and the difference is the whole design:
//
//   unclassified docs -> ERROR for a new one. Frontmatter costs six lines; there is no legitimate
//                        reason for a document added today to arrive without it.
//                        ...AND ERROR FOR AN EDITED GRANDFATHERED ONE – see the block below.
//   source size       -> WARNING, always, for both "newly over" and "grew fast". Everything the
//                        SOURCE_BUDGETS note below says still stands: a size trigger is a review
//                        question, not a defect, and a gate that goes red on the first honest
//                        commit is a gate somebody switches off. The review is explicit: no
//                        arbitrary line or comment hard cap.
//
// A baseline entry that DISAPPEARS never fails. Tightening must not require a co-ordinated commit,
// or the next person banks their new debt into the baseline instead of paying it.
const BASELINE_FILE = 'tools/generated/context-baseline.json'

// --- ...AND THE SECOND HALF OF THAT SENTENCE, WHICH THE CODE DID NOT KEEP (T-03, 05.09) ---------
//
// ⚠ THE GATE PROMISED A PROPERTY IT DID NOT ENFORCE, for two reviews running. The header above says
// «an existing unclassified document needs metadata when MATERIALLY EDITED», and the check was
// `unclassified.filter((file) => !legacyUnclassified.has(file))` – MEMBERSHIP ONLY. So a
// grandfathered document could be rewritten end to end, doubled in size, or repurposed into a
// different document under the same path, and the audit stayed green. 135 paths are grandfathered;
// that is 135 files with no governance and no ratchet on them at all. QA-35 said so on 2 September
// and the code was unchanged on 5 September.
//
// ⚠ A GATE WHOSE COMMENT OVERSTATES IT IS WORSE THAN A GATE THAT DOES LESS AND SAYS SO, because the
// next reader stops looking. That is the actual defect here – the enforcement gap is a day's work,
// the false confidence had already survived two reviews.
//
// SO: the baseline records a CONTENT HASH per grandfathered path, and an edit that leaves the file
// still unclassified is an ERROR naming it. Three properties, all deliberate:
//
//   * CONTENT, NOT mtime AND NOT THE GIT INDEX. mtime moves on a checkout, a stash pop and a clone,
//     so it would redden a gate for work nobody did; the index needs git to be present and the
//     script runs in `check` before anything else. A hash of the bytes is exactly the question
//     being asked – "is this a different document than the one we grandfathered?" – and needs
//     neither a network call nor a repository.
//   * IT IS STILL ONE-WAY. Classifying the file removes it from `unclassified` and the hash stops
//     being consulted; deleting it does the same. Only "edited AND still ungoverned" is an error,
//     and the fix is the four frontmatter lines the document should have had.
//   * A PATH WITH NO RECORDED HASH IS A WARNING, NOT AN ERROR. A baseline written by the version of
//     this script that predates the hashes cannot arm this half, and a gate that goes red because
//     its own baseline is old is a gate people delete. It says so and asks for `context:baseline`.
const HASH_LENGTH = 16 // 64 bits of sha256 – a collision here would have to be a crafted document

// ⚠ THE HASHES WERE ADDED WITHOUT RE-SNAPSHOTTING THE SIZE HALF, ON PURPOSE. Running
// `--update-baseline` would also have re-recorded `sourceOverBudget` and `sourceMeasures` at
// today's tree, silently discarding sixteen live "growing fast" deltas (world/coachMarket.ts
// 1,303 -> 1,742 lines and fifteen others) – which is precisely the "bank the new debt into the
// baseline" move the note above forbids. So `unclassifiedDocHashes` was written beside the
// untouched 2026-08-24 fields, and carries its own date.

// A file joins the watch list at 60% of a trigger, not at 100%: the interesting warning is the one
// that arrives BEFORE the threshold, and a baseline listing only over-budget files cannot produce a
// growth delta for the file that is about to cross.
const WATCH_FRACTION = 0.6

// What counts as "fast growing" between two runs. Percentage alone flags a 40-line file that gained
// four; an absolute floor alone never fires on the hubs. Both must hold.
const GROWTH = { fraction: 0.1, lines: 100, commentCharacters: 4_000, scriptLines: 80 }

const requiredFiles = [
  // ⚠ CLAUDE.md IS THE MOST EXPENSIVE RECURRING DOCUMENT IN THE REPO and it was the only one this
  // audit did not see (R2-04, 23.08): every session loads it whole, so a paragraph added here is a
  // paragraph paid on every future turn – exactly what the budget mechanism exists to make visible.
  'CLAUDE.md',
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
  // Measured 20,189 characters on 23.08; the ceiling leaves ~9% for the invariants to grow into and
  // turns the next large addition into a decision rather than a drift.
  ['CLAUDE.md', 22_000],
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
  // ⚠ MEASURED FOR EVERY FILE, RECORDED FOR THE WATCH LIST ONLY. The delta report needs a previous
  // number to subtract, and a baseline holding all 189 files would churn on every commit while the
  // interesting warning – the file about to cross – would still be missing. See WATCH_FRACTION.
  const measures = {}
  let acknowledged = 0

  for (const file of files.sort()) {
    const text = await fs.readFile(file, 'utf8')
    const rel = relative(file)
    const triggers = []
    const measured = {}

    if (rel.endsWith('.vue')) {
      const lines = scriptLines(text)
      measured.scriptLines = lines
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
      measured.lines = lines
      if (lines > SOURCE_BUDGETS.tsLines) {
        triggers.push({
          measure: 'lines',
          value: lines,
          trigger: SOURCE_BUDGETS.tsLines,
          question: 'more than one reason to change?',
        })
      }
      const { commentCharacters } = commentMetrics(text)
      measured.commentCharacters = commentCharacters
      if (commentCharacters > SOURCE_BUDGETS.tsCommentCharacters) {
        triggers.push({
          measure: 'comment characters',
          value: commentCharacters,
          trigger: SOURCE_BUDGETS.tsCommentCharacters,
          question: 'is the history compressible to an invariant plus a decision link?',
        })
      }
    }

    const watched =
      (measured.lines ?? 0) >= SOURCE_BUDGETS.tsLines * WATCH_FRACTION ||
      (measured.commentCharacters ?? 0) >= SOURCE_BUDGETS.tsCommentCharacters * WATCH_FRACTION ||
      (measured.scriptLines ?? 0) >= SOURCE_BUDGETS.vueScriptLines * WATCH_FRACTION
    if (watched) measures[rel] = measured

    if (!triggers.length) continue
    if (BUDGET_WAIVER.test(text)) {
      acknowledged += 1
      continue
    }
    over.push({ file: rel, triggers, worst: Math.max(...triggers.map((t) => t.value / t.trigger)) })
  }

  over.sort((a, b) => b.worst - a.worst)
  return { files: files.length, over, acknowledged, measures }
}

/** The committed snapshot the ratchet and the delta report are measured against. */
/** The document's bytes, as a short sha256. See the HASH_LENGTH note. */
function contentHash(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, HASH_LENGTH)
}

async function readBaseline() {
  try {
    return JSON.parse(await fs.readFile(path.join(root, BASELINE_FILE), 'utf8'))
  } catch {
    return null
  }
}

const MEASURE_LABEL = { lines: 'lines', commentCharacters: 'comment characters', scriptLines: 'script lines' }

/** Newly over budget, and growing fast – both WARNINGS, never errors. See the BASELINE_FILE note. */
function sourceDeltas(source, baseline) {
  if (!baseline) return { newlyOver: [], growing: [], shrunk: [] }
  const wasOver = new Set(baseline.sourceOverBudget ?? [])
  const before = baseline.sourceMeasures ?? {}

  const newlyOver = source.over.filter((entry) => !wasOver.has(entry.file)).map((entry) => ({
    file: entry.file,
    triggers: entry.triggers.map((t) => `${t.value.toLocaleString('en-US')} ${t.measure} over ${t.trigger.toLocaleString('en-US')}`),
  }))

  const growing = []
  const shrunk = []
  for (const [file, now] of Object.entries(source.measures)) {
    const then = before[file]
    if (!then) continue
    for (const key of ['lines', 'commentCharacters', 'scriptLines']) {
      if (typeof now[key] !== 'number' || typeof then[key] !== 'number') continue
      const delta = now[key] - then[key]
      if (delta === 0) continue
      const fast = delta >= GROWTH[key] && delta >= then[key] * GROWTH.fraction
      const entry = {
        file,
        measure: MEASURE_LABEL[key],
        from: then[key],
        to: now[key],
        delta,
        percent: Math.round((delta / Math.max(then[key], 1)) * 1000) / 10,
      }
      if (fast) growing.push(entry)
      else if (delta <= -GROWTH[key]) shrunk.push(entry)
    }
  }
  growing.sort((a, b) => b.delta - a.delta)
  shrunk.sort((a, b) => a.delta - b.delta)
  return { newlyOver, growing, shrunk }
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
  // ⚠ CLAUDE.md IS IN THIS LIST NOW, AND IT WAS NOT (24.08). It was already declared required and
  // already carried a 22,000-character budget – but the budget was never measured, because the file
  // never entered `records`, so `budgets` skipped it with `if (!record) continue`. A ceiling nobody
  // computes is a comment. R2-04's own words: "the most expensive recurring document in the repo and
  // it was the only one this audit did not see." Measured on the day it joined: 20,891 of 22,000.
  const linkedFiles = [
    path.join(root, 'CLAUDE.md'),
    path.join(root, 'AGENTS.md'),
    path.join(root, 'README.md'),
    ...docs,
  ].filter(
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
      // The whole file, frontmatter included: a document that GAINS frontmatter leaves the
      // unclassified list altogether, so the hash is never consulted for it again.
      sha: contentHash(text),
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
  const baseline = await readBaseline()

  if (updateBaseline) {
    const today = new Date().toISOString().slice(0, 10)
    const next = {
      note: 'Generated by `npm run context:baseline`. A one-way ratchet – see scripts/context-audit.mjs.',
      updated: today,
      unclassifiedDocs: [...unclassified].sort(),
      // The edit half of the document ratchet: what each grandfathered path CONTAINED when it was
      // grandfathered. Rewriting one of these without adding frontmatter is an error, not a shrug.
      unclassifiedDocHashesUpdated: today,
      unclassifiedDocHashes: Object.fromEntries(
        [...unclassified].sort().map((file) => [file, byFile.get(file).sha]),
      ),
      sourceOverBudget: source.over.map((entry) => entry.file).sort(),
      sourceMeasures: Object.fromEntries(Object.entries(source.measures).sort(([a], [b]) => (a < b ? -1 : 1))),
    }
    await fs.mkdir(path.dirname(path.join(root, BASELINE_FILE)), { recursive: true })
    await fs.writeFile(path.join(root, BASELINE_FILE), `${JSON.stringify(next, null, 2)}\n`)
    console.log(
      `context baseline written: ${next.unclassifiedDocs.length} unclassified docs ` +
        `(${Object.keys(next.unclassifiedDocHashes).length} hashed), ` +
        `${next.sourceOverBudget.length} over budget, ${Object.keys(next.sourceMeasures).length} watched source files`,
    )
    return
  }

  // --- THE DOCUMENT RATCHET. A NEW UNCLASSIFIED DOCUMENT IS AN ERROR; THE LEGACY 136 ARE NOT. ----
  const legacyUnclassified = new Set(baseline?.unclassifiedDocs ?? [])
  const newlyUnclassified = baseline ? unclassified.filter((file) => !legacyUnclassified.has(file)) : []
  const classifiedSinceBaseline = baseline
    ? [...legacyUnclassified].filter((file) => !unclassified.includes(file) && byFile.has(file)).sort()
    : []
  for (const file of newlyUnclassified) {
    errors.push(
      `${file}: new document with no governance frontmatter – add type/status/area/last-reviewed ` +
        `(the legacy ${legacyUnclassified.size} are grandfathered, a new one is not)`,
    )
  }

  // ...AND THE EDIT HALF – T-03. Grandfathered is not the same as exempt: the promise at the head of
  // this file is that an EDITED legacy document has to gain metadata, and until now nothing looked.
  const legacyHashes = baseline?.unclassifiedDocHashes ?? {}
  const editedUnclassified = unclassified
    .filter((file) => legacyUnclassified.has(file) && legacyHashes[file] && byFile.get(file)?.sha !== legacyHashes[file])
    .sort()
  const unhashedLegacy = [...legacyUnclassified].filter((file) => unclassified.includes(file) && !legacyHashes[file])
  for (const file of editedUnclassified) {
    errors.push(
      `${file}: grandfathered document EDITED and still has no governance frontmatter – add ` +
        `type/status/area/last-reviewed (baseline ${legacyHashes[file]}, now ${byFile.get(file).sha}). ` +
        `Grandfathered means "not classified yet", not "exempt": the day it is touched is the day it is classified`,
    )
  }
  if (baseline && unhashedLegacy.length) {
    warnings.push(
      `${unhashedLegacy.length} grandfathered ${unhashedLegacy.length === 1 ? 'document has' : 'documents have'} ` +
        `no recorded hash, so the EDIT half of the ratchet is unarmed for ${unhashedLegacy.length === 1 ? 'it' : 'them'} – ` +
        `run \`npm run context:baseline\``,
    )
  }
  if (!baseline) {
    warnings.push(`no ${BASELINE_FILE} – run \`npm run context:baseline\` once to arm the ratchet`)
  }

  const deltas = sourceDeltas(source, baseline)

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
    // ⚠ ALSO OUTSIDE `errors` AND `warnings`, for the same reason `sourceBudgets` is: a delta is a
    // review question with a number attached. The review's ruling stands – no line or comment cap.
    ratchet: {
      baseline: baseline ? `${BASELINE_FILE} (${baseline.updated})` : null,
      newUnclassifiedDocs: newlyUnclassified,
      editedUnclassifiedDocs: editedUnclassified,
      unhashedGrandfathered: unhashedLegacy.length,
      classifiedSinceBaseline,
      newlyOverBudget: deltas.newlyOver,
      growing: deltas.growing,
      shrunk: deltas.shrunk,
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
    // ⚠ THE DELTA REPORT, AND IT IS A WARNING BY CONSTRUCTION. Nothing below touches `errors`.
    console.log(
      `  since ${baseline ? `the baseline of ${baseline.updated}` : 'no baseline (run npm run context:baseline)'}:` +
        (baseline
          ? ` ${deltas.newlyOver.length} newly over a trigger, ${deltas.growing.length} growing fast, ` +
            `${deltas.shrunk.length} smaller, ${classifiedSinceBaseline.length} docs classified, ` +
            `${editedUnclassified.length} grandfathered docs edited without classifying ` +
            `(${legacyUnclassified.size - unhashedLegacy.length} of ${legacyUnclassified.size} hashed)`
          : ''),
    )
    for (const entry of deltas.newlyOver) {
      console.log(`    WARNING newly over: ${entry.file} – ${entry.triggers.join('; ')}`)
    }
    for (const entry of deltas.growing) {
      console.log(
        `    WARNING growing: ${entry.file} ${entry.measure} ${entry.from.toLocaleString('en-US')} -> ` +
          `${entry.to.toLocaleString('en-US')} (+${entry.delta.toLocaleString('en-US')}, +${entry.percent}%)`,
      )
    }
    for (const entry of deltas.shrunk.slice(0, verbose ? deltas.shrunk.length : 5)) {
      console.log(
        `    smaller: ${entry.file} ${entry.measure} ${entry.from.toLocaleString('en-US')} -> ` +
          `${entry.to.toLocaleString('en-US')} (${entry.delta.toLocaleString('en-US')}, ${entry.percent}%)`,
      )
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

