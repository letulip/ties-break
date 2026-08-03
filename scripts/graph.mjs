#!/usr/bin/env node

// THE CODE GRAPH: build it, and tell the truth about whether it is stale.
//
// ⚠ WHAT THIS IS FOR, AND WHAT IT IS NOT. Measured against the 17 real test breakages of the
// world.ts and diary.ts decompositions (docs/research/graph-tooling-benchmark.md):
//   USE IT      – named-symbol lookup (5/5 exact, and it indexes tests/ which a hand grep forgets),
//                 `god-nodes` for architectural hubs, `path`/`explain` for an unfamiliar seam.
//   DO NOT      – `affected` as a pre-split impact check (26% precision here; a re-exported move
//                 keeps every import intact, so imports are exactly what does NOT break), and
//                 natural-language `query` (lexically noisy on this corpus).
//   FOR IMPACT  – `git grep -l "engine/<module>.ts'" -- tests/` — 100% recall, measured.
//
// ⚠ A STALE GRAPH IS WORSE THAN NO GRAPH, which is the whole reason for `--check`. The build is
// ~4.5 s and zero model tokens, so there is never a reason to reason from an old one.

import { promises as fs } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const checkOnly = args.has('--check')
const graphFile = path.join(root, 'graphify-out', 'graph.json')

/** Where the binary can legitimately live, most explicit first. The skill installer creates its own
 *  venv and symlinks the binary onto PATH, so PATH is the normal case. */
function findGraphify() {
  if (process.env.GRAPHIFY_BIN) return existsSync(process.env.GRAPHIFY_BIN) ? process.env.GRAPHIFY_BIN : null
  // PATH scanned in-process rather than through `command -v`: spawning with shell:true to resolve a
  // binary earns a DEP0190 warning on every run, and there is nothing here a shell is needed for.
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue
    const candidate = path.join(dir, 'graphify')
    if (existsSync(candidate)) return candidate
  }
  const skillVenv = path.join(os.homedir(), '.claude', 'skills', 'graphify', '.venv', 'bin', 'graphify')
  return existsSync(skillVenv) ? skillVenv : null
}

const SETUP = `  graphify is not installed. It is a dev-time tool, not a project dependency:

    pip install graphifyy && graphify install --platform claude

  The installer creates its own venv (~161 MB) under ~/.claude/skills/graphify and symlinks the
  binary onto PATH. Nothing is added to package.json, and graphify-out/ is gitignored.
  Set GRAPHIFY_BIN to override the location.`

/** Newest mtime under the directories the graph is built from. */
async function newestSourceMtime() {
  const roots = ['src', 'tests', 'tools', 'scripts'].map((d) => path.join(root, d))
  let newest = 0
  async function walk(dir) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) await walk(full)
      else if (/\.(ts|vue|mjs|js)$/.test(e.name)) {
        const { mtimeMs } = await fs.stat(full)
        if (mtimeMs > newest) newest = mtimeMs
      }
    }
  }
  await Promise.all(roots.map(walk))
  return newest
}

async function graphStats() {
  try {
    const raw = JSON.parse(await fs.readFile(graphFile, 'utf8'))
    const nodes = Array.isArray(raw.nodes) ? raw.nodes.length : '?'
    // the graph writes edges under `links`; `edges` is not a key it emits
    const edges = Array.isArray(raw.links) ? raw.links.length : Array.isArray(raw.edges) ? raw.edges.length : '?'
    const { mtimeMs } = await fs.stat(graphFile)
    return { nodes, edges, mtimeMs }
  } catch {
    return null
  }
}

async function main() {
  const stats = await graphStats()
  const newest = await newestSourceMtime()

  if (checkOnly) {
    if (!stats) {
      console.log('  graph: absent — run `npm run graph`')
      process.exitCode = 1
      return
    }
    const stale = newest > stats.mtimeMs
    const ageMin = Math.round((Date.now() - stats.mtimeMs) / 60000)
    console.log(`  graph: ${stats.nodes} nodes / ${stats.edges} edges, built ${ageMin} min ago`)
    if (stale) {
      console.log('  ⚠ STALE: source has changed since the build — run `npm run graph` before trusting it')
      process.exitCode = 1
    } else {
      console.log('  result: fresh')
    }
    return
  }

  const bin = findGraphify()
  if (!bin) {
    console.error(SETUP)
    process.exitCode = 1
    return
  }

  const started = Date.now()
  const run = spawnSync(bin, ['update', '.', '--no-cluster'], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' })
  if (run.status !== 0) {
    console.error(run.stderr || run.stdout || 'graphify failed')
    process.exitCode = 1
    return
  }
  const after = await graphStats()
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  console.log(`  graph: ${after?.nodes ?? '?'} nodes / ${after?.edges ?? '?'} edges in ${secs}s, 0 model tokens`)
  console.log('  result: ok')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
