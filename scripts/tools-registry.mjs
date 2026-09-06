#!/usr/bin/env node

// THE TOOLS REGISTRY – R2-12 / TOK-09. WHICH FILE IN `tools/` IS AN INSTRUMENT.
//
// ⚠ THE PROBLEM. "All 136 tools enter the primary TypeScript project, but only a subset has package
// commands. A reader cannot cheaply distinguish supported benchmark, reproducibility instrument and
// scratch probe." Two costs follow: every build typechecks a hundred one-shot probes, and a reader
// looking for "the bench that answers X" has a directory of filenames and no signal.
// ⚠ THE COUNTS THAT USED TO BE ON THESE THREE LINES ARE GONE (02.09). This script PRINTS the live
// figures every time it runs, and three documents that copied them out by hand – this header,
// tsconfig.tools.json and docs/context-index.md – had all rotted to 24/114 against a real 26/146.
//
// ⚠ NOTHING IS DELETED, AND THAT IS THE REVIEW'S OWN RULE: "Do not delete measurement instruments
// solely to reduce file count." An archival probe is EVIDENCE – the reproduction that settled an
// argument – and it keeps its place on disk, in git, and in this registry. It just stops being
// typechecked on every `vite build`.
//
// HOW THE SPLIT IS DERIVED (mostly machine, one hand-maintained list):
//
//   live / command    a `package.json` script runs it. Machine-read; cannot drift.
//   live / imported   a test, an e2e file or another live tool imports it. Machine-read.
//   live / instrument the hand-maintained list below: no command, still run by hand when a question
//                     comes back. Each entry carries the reason it is not archival.
//   archival          everything else – a one-shot probe kept as evidence.
//
// The registry is written to `tools/README.md` and checked by `npm run tools:registry:check`, which
// ALSO asserts that `tsconfig.app.json`'s `tools/` entries are exactly the live set. That second
// assertion is the one that matters: without it the two lists drift and the build quietly grows
// back to the whole directory.

import { promises as fs } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const check = args.has('--check')

const README = 'tools/README.md'
const APP_TSCONFIG = 'tsconfig.app.json'
const TOOLS_TSCONFIG = 'tsconfig.tools.json'

// --- THE HAND-MAINTAINED HALF. Everything else on this page is read out of the repository. -------
//
// ⚠ A TOOL EARNS A LINE HERE BY BEING RUN AGAIN, not by looking useful. The test is: has a question
// come back to this instrument after the wave that wrote it? If not, it is archival, and archival
// is not an insult – it is the correct filing for a reproduction.
const INSTRUMENTS = {
  'frozen-key-diff.ts':
    'diffs a frozen RNG capture against a live run – the instrument for "which draw moved?" when the pinned hash changes',
  'injury-landscape.ts':
    'the whole-career injury census behind docs/specs/the-injury-landscape-2026-08.md; re-run whenever injury rates are touched',
  'demo-save.ts': 'writes the demo career used for screenshots and manual playtests',
  'e2e-fixtures.ts': 'generates the deterministic saves the Playwright suite loads',
}

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
        return entry.isFile() ? [file] : []
      }),
  )
  return nested.flat()
}

/** Every `tools/<name>` imported from a set of files, as bare tool basenames. */
async function importedTools(files) {
  const hit = new Set()
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8')
    for (const match of text.matchAll(/from '(?:\.\.\/)+tools\/([A-Za-z0-9_-]+)'/g)) hit.add(`${match[1]}.ts`)
  }
  return hit
}

/** Every `./<name>` imported by one tool. */
function siblingImports(text) {
  return [...text.matchAll(/from '\.\/([A-Za-z0-9_-]+)'/g)].map((match) => `${match[1]}.ts`)
}

async function classify() {
  const toolFiles = (await walk(path.join(root, 'tools')))
    .map(relative)
    .filter((file) => file.endsWith('.ts') && !file.startsWith('tools/generated/'))
    .sort()

  const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'))
  const commandOf = new Map()
  for (const [name, command] of Object.entries(packageJson.scripts)) {
    for (const match of command.matchAll(/tools\/([A-Za-z0-9_-]+)\.ts/g)) {
      if (!commandOf.has(`${match[1]}.ts`)) commandOf.set(`${match[1]}.ts`, name)
    }
  }

  const testFiles = [...(await walk(path.join(root, 'tests'))), ...(await walk(path.join(root, 'e2e')))].filter((f) =>
    f.endsWith('.ts'),
  )
  const fromTests = await importedTools(testFiles)

  const source = new Map()
  for (const file of toolFiles) source.set(path.basename(file), await fs.readFile(path.join(root, file), 'utf8'))

  // Roots are the commanded tools, the hand-listed instruments and anything a test imports; live
  // spreads down through sibling imports, because a bench that imports a helper needs the helper.
  const role = new Map()
  const queue = []
  for (const name of source.keys()) {
    if (commandOf.has(name)) { role.set(name, 'command'); queue.push(name) }
    else if (INSTRUMENTS[name]) { role.set(name, 'instrument'); queue.push(name) }
    else if (fromTests.has(name)) { role.set(name, 'imported'); queue.push(name) }
  }
  while (queue.length) {
    const name = queue.shift()
    for (const dependency of siblingImports(source.get(name) ?? '')) {
      if (!source.has(dependency) || role.has(dependency)) continue
      role.set(dependency, 'imported')
      queue.push(dependency)
    }
  }

  const live = toolFiles.filter((file) => role.has(path.basename(file)))
  const archival = toolFiles.filter((file) => !role.has(path.basename(file)))
  return { toolFiles, live, archival, role, commandOf, fromTests }
}

function renderReadme({ toolFiles, live, archival, role, commandOf, fromTests }) {
  const reasonFor = (file) => {
    const name = path.basename(file)
    if (role.get(name) === 'command') return `\`npm run ${commandOf.get(name)}\``
    if (role.get(name) === 'instrument') return INSTRUMENTS[name]
    return fromTests.has(name) ? 'imported by the test suite' : 'imported by a live tool'
  }
  const lines = [
    '---',
    'type: reference',
    'status: current',
    'area: tooling',
    'last-reviewed: 2026-08-24',
    '---',
    '',
    '# `tools/` – the registry',
    '',
    '**Generated** by `npm run tools:registry`. Do not hand-edit: `npm run tools:registry:check` fails',
    'when this page and the repository disagree, and it also asserts that `tsconfig.app.json` lists',
    'exactly the live set.',
    '',
    `${toolFiles.length} TypeScript files: **${live.length} live**, **${archival.length} archival**.`,
    '',
    '## Why the split exists',
    '',
    'Every one of these files used to enter the primary TypeScript project, so `vite build` typechecked',
    'a hundred one-shot probes on every run, and a reader had a flat directory with no signal about',
    'which ones are supported. The live set stays in `tsconfig.app.json`; the whole directory is still',
    'typechecked by `npm run check:tools` (`tsconfig.tools.json`) – which runs inside `npm run check`',
    'and as its own CI step since 02.09. It used to run on demand, which meant it ran never, and the',
    '02.09 review found it red with nine errors across six tools.',
    '',
    '⚠ **Archival is not dead.** A probe here is the reproduction that settled an argument, and the',
    "review's rule is explicit: do not delete measurement instruments to reduce a file count. If a",
    'question comes back to one, run it, and if it answers again, give it a line in `INSTRUMENTS` in',
    '`scripts/tools-registry.mjs` – that is what promotes it back to live.',
    '',
    '## Live',
    '',
    '| Tool | Why it is live |',
    '| --- | --- |',
    ...live.map((file) => `| \`${path.basename(file)}\` | ${reasonFor(file)} |`),
    '',
    '## Archival',
    '',
    'One-shot probes and reproductions. Kept as evidence; typechecked by `npm run check:tools`, which',
    'the gate now runs – so evidence that stops compiling reddens a pull request instead of rotting.',
    '',
    ...chunk(archival.map((file) => `\`${path.basename(file)}\``), 4).map((row) => `- ${row.join(' · ')}`),
    '',
  ]
  return `${lines.join('\n')}`
}

function chunk(list, size) {
  const out = []
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size))
  return out
}

async function main() {
  const classified = await classify()
  const readme = renderReadme(classified)
  const expectedInclude = classified.live.slice().sort()

  const appConfig = await fs.readFile(path.join(root, APP_TSCONFIG), 'utf8')
  const listed = [...appConfig.matchAll(/"(tools\/[^"]+)"/g)].map((match) => match[1]).sort()
  const sameInclude = listed.length === expectedInclude.length && listed.every((file, i) => file === expectedInclude[i])

  if (!check) {
    await fs.writeFile(path.join(root, README), readme)
    console.log(
      `tools registry: written – ${classified.live.length} live, ${classified.archival.length} archival` +
        (sameInclude ? '' : `\n  ⚠ ${APP_TSCONFIG} does not list the live set. It should be exactly:\n` +
          expectedInclude.map((file) => `    "${file}",`).join('\n')),
    )
    if (!sameInclude) process.exitCode = 1
    return
  }

  const errors = []
  const current = await fs.readFile(path.join(root, README), 'utf8').catch(() => null)
  if (current !== readme) errors.push(`${README} is stale – run \`npm run tools:registry\``)
  if (!sameInclude) {
    const missing = expectedInclude.filter((file) => !listed.includes(file))
    const extra = listed.filter((file) => !expectedInclude.includes(file))
    errors.push(
      `${APP_TSCONFIG} lists ${listed.length} tools, the registry says ${expectedInclude.length} are live` +
        (missing.length ? `\n    missing: ${missing.join(', ')}` : '') +
        (extra.length ? `\n    archival but still built every time: ${extra.join(', ')}` : ''),
    )
  }
  try {
    await fs.access(path.join(root, TOOLS_TSCONFIG))
  } catch {
    // ⚠ «the on-demand sweep» until 05.09, and it had stopped being on demand on 02.09 (T-10 of
    // the 05.09 review). `check:tools` is a step of `npm run check` and a step of ci.yml, so a
    // missing tsconfig now breaks the gate rather than a sweep somebody might run – which is a
    // louder failure than the sentence was promising. The README this script writes says the same
    // thing twenty lines up; only the error text had rotted.
    errors.push(`${TOOLS_TSCONFIG} is missing – \`npm run check:tools\` has nowhere to run, and it is a step of \`npm run check\` and of ci.yml`)
  }

  if (errors.length) {
    console.log('Tools registry')
    for (const error of errors) console.log(`  error: ${error}`)
    process.exitCode = 1
    return
  }
  console.log(`tools registry: ok – ${classified.live.length} live, ${classified.archival.length} archival`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
