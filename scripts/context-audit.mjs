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

