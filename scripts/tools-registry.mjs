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
//
// ⚠⚠ THE REGISTRY READS THE INDEX, NOT THE DIRECTORY (H-03, 26.09). It used to walk `tools/` with
// `fs.readdir`, so its verdict was a function of whatever else sat in the checkout rather than of
// the commit. The owner's own tree holds seven untracked `.ts` files from another live session
// (`tools/_devlog_*`, `tools/devlog/`), and they made `--check` print «tools/README.md is stale» on
// product-identical code – which is why this wave's gates have been run in a clean worktree for
// three waves. `git ls-files` lists tracked plus staged, so an untracked probe is invisible here and
// a `git add`ed one is not. It has already shipped a wrong registry once from the other direction
// (`836afb3c`, 23.09: a regeneration in a dirty tree listed five files the repository does not hold).
//
// ⚠⚠ AND `check:tools` COMPILES THIS SCRIPT'S OWN LIST (H-03, H-17). `tsconfig.tools.json` used to
// glob `tools/**/*.ts`, which is the same defect one layer down – an untracked probe with a type
// error is compiled by a gate that is supposed to judge the commit. It now inherits a GENERATED
// `files` list (`tsconfig.tools.files.json`), written here, so exactly one place in the repository
// decides what a tool is. The list is the tracked tools MINUS the frozen archival ones below.

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const root = process.cwd()
const args = new Set(process.argv.slice(2))
const check = args.has('--check')

const README = 'tools/README.md'
const APP_TSCONFIG = 'tsconfig.app.json'
const TOOLS_TSCONFIG = 'tsconfig.tools.json'
const TOOLS_FILES = 'tsconfig.tools.files.json'
const FROZEN = 'tools/generated/archival-frozen.json'

// ⚠ THE FREEZE'S BASELINE IS A COMMIT, NEVER A DATE (H-17, 26.09). `98e3560b` is the 05.09 review's
// own base – the commit its «114 of the 211 archival tools were last touched before 05.09» was
// measured against. A wall-clock cutoff would make this gate's verdict a function of TODAY, which is
// the very defect H-03 above removes; a commit makes it a function of history. Dormant therefore
// means: archival by the classification below, AND byte-identical to its content at this commit –
// no question has come back to it and no repair has touched it in the 22 days the review measured.
// A tool that is edited leaves the freeze by itself on the next regeneration, and re-enters
// `check:tools` with it. That is the promotion path; there is nothing to hand-edit.
const FREEZE_BASELINE = '98e3560b'

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
  'small-talk-corpus-emit.ts':
    'writes src/engine/world/smallTalkCorpus.ts out of docs/specs/small-talk-corpus-2026-09.md – the ONLY legitimate way to change the 43, because the catalogue is generated from the document and never retyped; re-run with --write after any owner edit to that spec',
  'album-corpus-emit.ts':
    'writes src/engine/world/albumCorpus.ts out of docs/specs/album-corpus-2026-09.md – the ONLY legitimate way to change the album\'s 400 handwritten strings, because the catalogue is generated from the document and never retyped; re-run with --write after any owner edit to that spec',
}

function git(argv) {
  return execFileSync('git', argv, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
}

/**
 * Every TRACKED OR STAGED file under `dirs`, repo-relative and POSIX-separated. This is the whole of
 * H-03's fix: `git ls-files` reads the index, so another session's untracked probes cannot move this
 * script's verdict, and a `git add`ed file cannot hide from it.
 */
function tracked(...dirs) {
  let out
  try {
    out = git(['ls-files', '-z', '--', ...dirs])
  } catch (error) {
    console.error(
      'tools registry: `git ls-files` failed – this script reads the INDEX, not the directory (H-03),\n' +
        '  so it needs a git repository. Run it from a checkout.',
    )
    throw error
  }
  return out.split('\0').filter(Boolean)
}

/** A file's git blob id, computed from its bytes – no subprocess, and no history needed to verify it. */
function blobSha(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

/**
 * Tools whose content differs from `FREEZE_BASELINE` – the baseline tree against the WORKING TREE, so
 * an uncommitted edit counts as a touch and the file is not frozen. `null` when the baseline commit
 * is unreachable (a shallow clone), which is the one case where regeneration must keep its hands off
 * the existing list rather than guess.
 */
function touchedSinceBaseline() {
  try {
    git(['cat-file', '-e', `${FREEZE_BASELINE}^{commit}`])
  } catch {
    return null
  }
  return new Set(
    git(['diff', '--name-only', '-z', FREEZE_BASELINE, '--', 'tools'])
      .split('\0')
      .filter(Boolean),
  )
}

/**
 * A tracked file's bytes. A path can be in the index and absent from the working tree (an `rm`
 * without a `git rm`), and the ENOENT that produces says nothing about why the registry cares – so
 * it is named here rather than thrown raw.
 */
async function readTracked(rel) {
  try {
    return await fs.readFile(path.join(root, rel))
  } catch {
    throw new Error(
      `tools registry: ${rel} is tracked but not in the working tree.\n` +
        '  Restore it, or `git rm` it – the registry reads the index for the LIST and the disk for the CONTENT.',
    )
  }
}

/** Every `tools/<name>` imported from a set of files, as bare tool basenames. */
async function importedTools(files) {
  const hit = new Set()
  for (const file of files) {
    const text = await readTracked(file)
    for (const match of text.toString('utf8').matchAll(/from '(?:\.\.\/)+tools\/([A-Za-z0-9_-]+)'/g))
      hit.add(`${match[1]}.ts`)
  }
  return hit
}

/** Every `./<name>` imported by one tool. */
function siblingImports(text) {
  return [...text.matchAll(/from '\.\/([A-Za-z0-9_-]+)'/g)].map((match) => `${match[1]}.ts`)
}

async function classify() {
  const toolFiles = tracked('tools')
    .filter((file) => file.endsWith('.ts') && !file.startsWith('tools/generated/'))
    .sort()

  const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'))
  const commandOf = new Map()
  for (const [name, command] of Object.entries(packageJson.scripts)) {
    for (const match of command.matchAll(/tools\/([A-Za-z0-9_-]+)\.ts/g)) {
      if (!commandOf.has(`${match[1]}.ts`)) commandOf.set(`${match[1]}.ts`, name)
    }
  }

  const fromTests = await importedTools(tracked('tests', 'e2e').filter((file) => file.endsWith('.ts')))

  const source = new Map()
  const bytes = new Map()
  for (const file of toolFiles) {
    const buffer = await readTracked(file)
    bytes.set(file, buffer)
    source.set(path.basename(file), buffer.toString('utf8'))
  }

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
  return { toolFiles, live, archival, role, commandOf, fromTests, bytes }
}

/**
 * The frozen half of the archive, re-derived: archival AND unchanged since `FREEZE_BASELINE`, each
 * recorded with the blob id it is frozen at. `null` when the baseline is unreachable – the caller
 * then keeps the committed list, because a shallow clone knows less than the file does.
 */
function freezeList({ archival, bytes }) {
  const touched = touchedSinceBaseline()
  if (!touched) return null
  const frozen = {}
  for (const file of archival) if (!touched.has(file)) frozen[file] = blobSha(bytes.get(file))
  return frozen
}

function renderReadme({ toolFiles, live, archival, role, commandOf, fromTests }, frozen) {
  const reasonFor = (file) => {
    const name = path.basename(file)
    if (role.get(name) === 'command') return `\`npm run ${commandOf.get(name)}\``
    if (role.get(name) === 'instrument') return INSTRUMENTS[name]
    return fromTests.has(name) ? 'imported by the test suite' : 'imported by a live tool'
  }
  const frozenFiles = archival.filter((file) => frozen[file])
  const sweptFiles = archival.filter((file) => !frozen[file])
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
    `${toolFiles.length} TRACKED TypeScript files: **${live.length} live**, **${archival.length} archival**`,
    `(of which **${frozenFiles.length} frozen** out of \`check:tools\` and **${sweptFiles.length} still swept**).`,
    '',
    '## Why the split exists',
    '',
    'Every one of these files used to enter the primary TypeScript project, so `vite build` typechecked',
    'a hundred one-shot probes on every run, and a reader had a flat directory with no signal about',
    'which ones are supported. The live set stays in `tsconfig.app.json`; the swept half is typechecked',
    'by `npm run check:tools` (`tsconfig.tools.json`) – which runs inside `npm run check` and as its own',
    'CI step since 02.09. It used to run on demand, which meant it ran never, and the 02.09 review found',
    'it red with nine errors across six tools.',
    '',
    '⚠ **Archival is not dead.** A probe here is the reproduction that settled an argument, and the',
    "review's rule is explicit: do not delete measurement instruments to reduce a file count. If a",
    'question comes back to one, run it, and if it answers again, give it a line in `INSTRUMENTS` in',
    '`scripts/tools-registry.mjs` – that is what promotes it back to live.',
    '',
    '⚠ **The list is read off the INDEX, not the directory** (H-03, 26.09). An untracked probe sitting',
    'in `tools/` is invisible here and is not compiled by `check:tools`; a `git add`ed one is both. A',
    "gate's verdict is a function of the commit, never of whatever else a checkout happens to hold.",
    '',
    '## Live',
    '',
    '| Tool | Why it is live |',
    '| --- | --- |',
    ...live.map((file) => `| \`${path.basename(file)}\` | ${reasonFor(file)} |`),
    '',
    '## Archival – swept',
    '',
    'One-shot probes and reproductions that have been touched since the 05.09 baseline. Kept as',
    'evidence and typechecked by `npm run check:tools`, which the gate runs – so evidence that stops',
    'compiling reddens a pull request instead of rotting.',
    '',
    ...chunk(sweptFiles.map((file) => `\`${path.basename(file)}\``), 4).map((row) => `- ${row.join(' · ')}`),
    '',
    '## Archival – frozen at their blob id',
    '',
    `${frozenFiles.length} probes that have not moved since \`${FREEZE_BASELINE}\` (the 05.09 review's own base).`,
    'They are OUT of `check:tools` – `tools/generated/archival-frozen.json` records the blob each one is',
    'frozen at, and `npm run tools:registry:check` fails if one of them changes while frozen.',
    '',
    '⚠ **Why a frozen probe is not a neglected one** (H-17). A repair to keep a dormant tool compiling',
    'silently changes what a quoted probe measured, and two such repairs landed in 22 days. Freezing is',
    'the opposite of deleting: nothing moves, all 689 path references from the docs still resolve, and',
    'the file still says exactly what it said when it was cited. Edit one and it leaves the freeze on',
    'the next `npm run tools:registry` – and re-enters the typecheck with it, which is the point.',
    '',
    '⚠ A frozen probe that a SWEPT or live tool imports is still compiled, as an import rather than as',
    'a root. The freeze removes roots; TypeScript follows edges.',
    '',
    ...chunk(frozenFiles.map((file) => `\`${path.basename(file)}\``), 4).map((row) => `- ${row.join(' · ')}`),
    '',
  ]
  return `${lines.join('\n')}`
}

function chunk(list, size) {
  const out = []
  for (let index = 0; index < list.length; index += size) out.push(list.slice(index, index + size))
  return out
}

/** `tools/generated/archival-frozen.json` – the registry-kept freeze, path -> the blob it is frozen at. */
function renderFrozen(frozen) {
  const body = {
    generatedBy: 'npm run tools:registry',
    why: 'H-17: dormant archival probes leave `check:tools` so a repair can never silently change what a quoted probe measured. Every entry is archival (no command, no importer, no INSTRUMENTS line) and byte-identical to its content at the baseline below. Edit one and it leaves this list on the next regeneration – and re-enters the typecheck with it.',
    baseline: FREEZE_BASELINE,
    count: Object.keys(frozen).length,
    // The blob id is what makes `--check` history-free: a shallow clone (CI is one) cannot reach the
    // baseline commit, but it can hash the bytes it holds.
    frozen,
  }
  return `${JSON.stringify(body, null, 2)}\n`
}

/**
 * `tsconfig.tools.files.json` – the `files` list `tsconfig.tools.json` inherits. jsonc, because a
 * generated tsconfig fragment with no explanation is the next thing somebody hand-edits.
 */
function renderToolsFiles(compiled) {
  return `${[
    '{',
    '  // GENERATED by `npm run tools:registry`. Do not hand-edit – `npm run tools:registry:check`',
    '  // fails when this list and the repository disagree, and prints the command that fixes it.',
    '  //',
    '  // ⚠ WHY A LIST AND NOT `tools/**/*.ts` (H-03). A glob compiles whatever sits in the checkout,',
    '  // so another session\'s untracked probe – the owner\'s tree holds seven – is judged by a gate',
    '  // that is supposed to judge the commit. These are the TRACKED tools minus the frozen archival',
    '  // ones (`tools/generated/archival-frozen.json`). `tsconfig.tools.json` inherits this through',
    '  // `extends` and declares `"include": []`, so these paths are the program\'s only roots.',
    '  "files": [',
    ...compiled.map((file, index) => `    "${file}"${index === compiled.length - 1 ? '' : ','}`),
    '  ]',
    '}',
  ].join('\n')}\n`
}

async function main() {
  const classified = await classify()
  const expectedInclude = classified.live.slice().sort()

  // ⚠ REGENERATION RE-DERIVES THE FREEZE; `--check` NEVER DOES. The derivation needs the baseline
  // commit, and `actions/checkout` is shallow – so the committed list is the artefact CI verifies, by
  // blob id, and nothing in the check path touches history. A write in a shallow clone keeps the
  // committed list rather than emptying it.
  const committedFrozen = await fs
    .readFile(path.join(root, FROZEN), 'utf8')
    .then((text) => JSON.parse(text).frozen ?? {})
    .catch(() => ({}))
  const rederived = check ? null : freezeList(classified)
  const frozen = rederived ?? committedFrozen
  const shallow = !check && rederived === null

  const compiled = classified.toolFiles.filter((file) => !frozen[file])
  const readme = renderReadme(classified, frozen)
  const toolsFiles = renderToolsFiles(compiled)

  const appConfig = await fs.readFile(path.join(root, APP_TSCONFIG), 'utf8')
  const listed = [...appConfig.matchAll(/"(tools\/[^"]+)"/g)].map((match) => match[1]).sort()
  const sameInclude = listed.length === expectedInclude.length && listed.every((file, i) => file === expectedInclude[i])

  if (!check) {
    await fs.writeFile(path.join(root, README), readme)
    await fs.writeFile(path.join(root, FROZEN), renderFrozen(frozen))
    await fs.writeFile(path.join(root, TOOLS_FILES), toolsFiles)
    console.log(
      `tools registry: written – ${classified.live.length} live, ${classified.archival.length} archival ` +
        `(${Object.keys(frozen).length} frozen), ${compiled.length} files in check:tools` +
        (shallow
          ? `\n  ⚠ ${FREEZE_BASELINE} is unreachable (a shallow clone) – the committed freeze was kept, not re-derived.`
          : '') +
        (sameInclude ? '' : `\n  ⚠ ${APP_TSCONFIG} does not list the live set. It should be exactly:\n` +
          expectedInclude.map((file) => `    "${file}",`).join('\n')),
    )
    if (!sameInclude) process.exitCode = 1
    return
  }

  const errors = []
  const current = await fs.readFile(path.join(root, README), 'utf8').catch(() => null)
  if (current !== readme) errors.push(`${README} is stale – run \`npm run tools:registry\``)
  try {
    await fs.access(path.join(root, FROZEN))
  } catch {
    errors.push(`${FROZEN} is missing – run \`npm run tools:registry\` (it is the list \`check:tools\` excludes)`)
  }
  const currentToolsFiles = await fs.readFile(path.join(root, TOOLS_FILES), 'utf8').catch(() => null)
  if (currentToolsFiles !== toolsFiles) {
    errors.push(
      `${TOOLS_FILES} is stale – run \`npm run tools:registry\`` +
        `\n    it is what \`npm run check:tools\` compiles, so a stale list is a gate looking at the wrong files`,
    )
  }
  // The freeze's own invariants, all three history-free so a shallow clone can check them.
  for (const [file, sha] of Object.entries(frozen)) {
    const buffer = classified.bytes.get(file)
    if (!buffer) {
      errors.push(`${file} is frozen out of \`check:tools\` but is no longer a tracked tool – run \`npm run tools:registry\``)
      continue
    }
    if (blobSha(buffer) !== sha) {
      errors.push(
        `${file} has CHANGED while frozen out of \`check:tools\` – run \`npm run tools:registry\`` +
          '\n    it will then leave the freeze and be typechecked again, which is what an edited probe wants',
      )
    }
    if (classified.role.has(path.basename(file))) {
      errors.push(`${file} is frozen out of \`check:tools\` and is now LIVE – run \`npm run tools:registry\``)
    }
  }
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
  console.log(
    `tools registry: ok – ${classified.live.length} live, ${classified.archival.length} archival ` +
      `(${Object.keys(frozen).length} frozen), ${compiled.length} files in check:tools`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
