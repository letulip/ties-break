#!/usr/bin/env node
/**
 * ⭐⭐ THE SHELF-LIFE CHECK – round 30 item 25, 30.08.
 *
 * FAILS WHEN THIS BRANCH'S `SAVE_SCHEMA_VERSION` EQUALS `origin/main`'s AND THE MIGRATION STEP THAT
 * PRODUCES THAT VERSION IS NOT BYTE-IDENTICAL TO MAIN'S. That is the exact signature of the defect
 * this script was written for: a step amended in place after the version it belongs to had shipped,
 * so `migrateSave` sees the version already on the save and skips the amendment for ever.
 *
 * ⚠⚠ WHY THIS IS A CI STEP AND NOT A VITEST FILE, WHICH IS THE ONE INTERESTING DECISION HERE.
 * A test that reads `origin/main` reads a REMOTE-TRACKING REF, and a remote-tracking ref is only as
 * fresh as the last `git fetch`. An agent whose `origin/main` predates the merge would be told
 * «main is at 65, carry on» – the same wrong answer, from the same stale fact, for the same reason.
 * A guard that can reproduce the bug it guards against is worse than none, so the check has to run
 * somewhere that fetches FIRST. Making the unit suite fetch is not an option: `npm run check` is
 * offline and deterministic, and it is run dozens of times a wave. CI already has the network, and
 * a PR is exactly «the moment you bump» – so the fetch is one line in the workflow and this script
 * assumes it has happened.
 *
 * ⚠ RUN LOCALLY IT IS ADVISORY, AND IT SAYS SO OUT LOUD. Without `origin/main` it exits 0 with a
 * SKIPPED line naming what it could not read; with a possibly-stale one it prints the ref's own age
 * so the number can be disbelieved. It never silently passes.
 *
 *   node scripts/schema-ladder.mjs            # advisory locally, hard gate in CI
 *   node scripts/schema-ladder.mjs --require  # missing ref is a FAILURE (what CI passes)
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const REQUIRE = process.argv.includes('--require')
const STATE = 'src/engine/world/state.ts'
const MIGRATIONS = 'src/engine/migrations.ts'

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function fail(msg) {
  console.error(`SCHEMA LADDER: ${msg}`)
  process.exit(1)
}

/** The version constant, read out of a file's text rather than imported – this script must be able
 *  to read MAIN's copy, which is a blob and not a module. */
function versionOf(text, where) {
  const m = text.match(/export const SAVE_SCHEMA_VERSION = (\d+)/)
  if (!m) fail(`could not find SAVE_SCHEMA_VERSION in ${where}`)
  return Number(m[1])
}

/** The step that produces version `n`: `if (v === n-1) { … }`, cut by BRACE COUNTING from its own
 *  opening line. ⚠ Not by `indexOf` of a closing brace – the house rule (CLAUDE.md: every source
 *  region gets a helper that THROWS on an absent marker) applies to this script too, so an absent
 *  opener is a hard failure and never a silently empty region. */
function stepFor(text, n, where) {
  const open = `  if (v === ${n - 1}) {\n`
  const at = text.indexOf(open)
  if (at === -1) fail(`no migration step producing v${n} in ${where} (looked for \`${open.trim()}\`)`)
  let depth = 0
  let i = at + open.length - 2 // sit on the opening brace
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) return text.slice(at, i + 1)
    }
  }
  fail(`unbalanced braces reading the v${n} step in ${where}`)
}

let mainState
try {
  mainState = git(['show', 'origin/main:' + STATE])
} catch {
  const msg =
    'origin/main is not available locally – nothing to compare against. ' +
    'In CI this must run after `git fetch --depth=1 origin main`.'
  if (REQUIRE) fail(msg)
  console.log(`SCHEMA LADDER: SKIPPED – ${msg}`)
  process.exit(0)
}

const mainVersion = versionOf(mainState, 'origin/main:' + STATE)
const hereVersion = versionOf(readFileSync(STATE, 'utf8'), STATE)

let age = ''
try {
  age = ` (origin/main ref: ${git(['log', '-1', '--format=%cr', 'origin/main']).trim()})`
} catch {
  /* a ref with no reachable commit object is still worth reporting on without the age */
}

if (hereVersion > mainVersion) {
  console.log(`SCHEMA LADDER: OK – this branch is at v${hereVersion}, main at v${mainVersion}${age}`)
  process.exit(0)
}
if (hereVersion < mainVersion) {
  fail(
    `this branch declares v${hereVersion} but main is already at v${mainVersion}${age}. ` +
      'The branch is behind the shipped ladder – rebase before bumping.',
  )
}

// hereVersion === mainVersion: the version is SHIPPED, so its step is frozen.
const mainMig = git(['show', 'origin/main:' + MIGRATIONS])
const hereMig = readFileSync(MIGRATIONS, 'utf8')
const mainStep = stepFor(mainMig, mainVersion, 'origin/main:' + MIGRATIONS)
const hereStep = stepFor(hereMig, hereVersion, MIGRATIONS)

if (mainStep === hereStep) {
  console.log(`SCHEMA LADDER: OK – v${hereVersion} is shipped and its step matches main's${age}`)
  process.exit(0)
}

fail(
  `v${hereVersion} IS SHIPPED – main declares it too${age} – but this branch's ` +
    `v${hereVersion - 1} -> v${hereVersion} step differs from main's.\n\n` +
    '  A save written by main already says schemaVersion ' +
    `${hereVersion}, so migrateSave will SKIP this step and the amendment will never run on any\n` +
    '  career in play. This is not a merge conflict and no test below the rung can see it.\n\n' +
    `  THE FIX: take v${hereVersion + 1}, move the amendment to it, and leave the v${hereVersion} ` +
    "step byte-identical to main's.\n" +
    `  See the header of ${MIGRATIONS} and docs/rounds/round-30.md item 25.\n\n` +
    `  git diff <(git show origin/main:${MIGRATIONS}) ${MIGRATIONS}   # to see it`,
)
