#!/usr/bin/env node

// THE END-TO-END SUITE: real Chromium, a real production build, three preconditions checked before
// any of it starts, and one post-condition over what the run produced.
//
// ⚠ WHY THIS IS A SCRIPT AND NOT `"test:e2e": "playwright test"`. Both of the ways this run fails
// before it has run anything produce an error that names the wrong thing:
//
//   1. THE BROWSER IS NOT DOWNLOADED. `@playwright/test` is an npm dependency; the ~273 MiB of
//      Chromium it drives is NOT, and `npm ci` does not fetch it. A fresh clone therefore fails
//      inside a worker with a stack trace about an executable, which reads like a broken suite
//      rather than a missing one-line install. Same reasoning as scripts/graph.mjs, which prints
//      graphify's install line rather than letting a missing binary look like a bug.
//   2. THE PORT IS TAKEN. playwright.config.ts serves the build on 4173 with `--strictPort` and
//      `reuseExistingServer: false` - deliberately, because the webServer command BUILDS the app and
//      reusing whatever is already listening means testing a stale dist. The cost of that choice is
//      that a `npm run preview` left running in another terminal kills the run with vite's own
//      "Port 4173 is already in use", buried under Playwright's webServer timeout. Said plainly
//      here, it is a five-second fix.
//
// Everything else is passed straight through, so the usual flags all work:
//
//     npm run test:e2e -- --headed          watch it happen
//     npm run test:e2e -- --debug           step through with the inspector
//     npm run test:e2e -- -g "week 1"       one spec by name
//     npm run test:e2e:ui                   the time-travel UI (this script, with --ui)
//
// ⚠ NOT PART OF `npm run check`, ON PURPOSE. The pre-push gate is already ~7 minutes (429 s,
// measured on a quiet machine 02.09; this line said ~4 until then) and this is a
// browser suite; the PR gate calls it as its own job (.github/workflows/ci.yml). See e2e/README.md.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { staleBaselineEntries } from './lib/a11y-baseline.mjs'

/** Parsed out of playwright.config.ts so the two cannot drift - the same idiom scripts/sim.mjs uses
 *  to read HEAVY_SIM_FILES out of vite.config.ts. A port checked here that the config no longer
 *  serves on would be worse than not checking at all. */
function servePorts() {
  const config = readFileSync(new URL('../playwright.config.ts', import.meta.url), 'utf8')
  // ⚠ BOTH PORTS, NOT ONE. Since S2 the config serves TWO production builds: the ordinary one on
  // PORT, and a second on SW_PORT built without VITE_TB_SW so `offline.spec.ts` meets a real service
  // worker. Either being occupied kills the run the same way, so both are checked - and the pattern
  // matches any `*_PORT` const so a third server would be picked up without editing this line.
  const ports = [...config.matchAll(/^const (?:\w+_)?PORT = (\d+)$/gm)].map((m) => Number(m[1]))
  if (ports.length === 0) throw new Error('scripts/e2e.mjs: no PORT const found in playwright.config.ts')
  return ports
}

/** Is anything already listening? Asked by binding, which is the only answer that cannot be stale. */
function portIsFree(port) {
  return new Promise((resolve) => {
    const probe = createServer()
    probe.once('error', () => resolve(false))
    probe.once('listening', () => probe.close(() => resolve(true)))
    probe.listen(port, '127.0.0.1')
  })
}

const args = process.argv.slice(2)

// The browser binary lives in a shared per-user cache, not in node_modules - ask Playwright where it
// put it rather than guessing at ~/Library/Caches vs ~/.cache vs %LOCALAPPDATA%.
if (!existsSync(chromium.executablePath())) {
  console.error('  e2e: Chromium is not installed for this Playwright version.')
  console.error('       Run:  npx playwright install chromium')
  console.error('       (~273 MiB, once per machine per Playwright release - not per checkout.)')
  process.exit(1)
}

for (const port of servePorts()) {
  if (await portIsFree(port)) continue
  console.error(`  e2e: port ${port} is already in use, and the suite serves its own build there.`)
  console.error('       A leftover `npm run preview` is the usual culprit - stop it and re-run.')
  console.error(`       (The config sets strictPort + reuseExistingServer:false so a stale dist can`)
  console.error('        never be tested by accident. See playwright.config.ts.)')
  process.exit(1)
}

// ⚠⚠ THE THIRD PRECONDITION, AND IT IS A WARNING RATHER THAN A STOP (T-09, 06.09). `e2e/a11y.spec.ts`
// runs axe-core over every screen and every overlay; `@axe-core/playwright` is not yet in
// `package.json`, so those tests SKIP and the rest of the suite is untouched. This is the same
// argument as the two stops above and as scripts/graph.mjs's: a dependency that is merely absent
// must announce itself in one line, because the failure mode otherwise is a suite that quietly
// stops asking - and a skipped a11y pass looks exactly like a passing one in a summary.
//
// ⚠ IT DOES NOT EXIT. The missing package costs the run 23 scans; it costs it no coverage that ever
// existed, and the keyboard half of that spec - focus trap, Escape policy, focus restoration - needs
// no dependency and runs today. Failing the whole suite over it would take the parity harness and
// the seven journeys down with it, which is a worse trade than a loud line.
//
// The one command is in e2e/axe.ts's header along with the reason it is not already run: adding the
// package to `package.json` WITHOUT `package-lock.json` breaks `npm ci`, which is the first step of
// the CI e2e job, so the two files have to move together and only an install moves them together.
const require = createRequire(import.meta.url)
try {
  require.resolve('@axe-core/playwright')
} catch {
  console.warn('  e2e: @axe-core/playwright is not installed - the accessibility SCAN will skip.')
  console.warn('       Run:  npm i -D @axe-core/playwright')
  console.warn('       (~640 KiB, once. It updates package.json AND package-lock.json together,')
  console.warn('        which is what keeps `npm ci` - and the CI e2e job - valid.)')
  console.warn('       The keyboard half of e2e/a11y.spec.ts needs no dependency and still runs.')
}

// ⚠ `--report` IS THE SHOWCASE MODE, AND IT IS A SECOND MODE ON PURPOSE (S3). The default run is
// deliberately fast and quiet: `trace: 'on-first-retry'` in playwright.config.ts records nothing at
// all on a green run, because a trace is tens of MB and the only run anyone opens is the one that
// went wrong. `npm run test:e2e:report` inverts that for one run - a trace for EVERY test, green
// ones included, and the HTML report opened at the end. That is the artefact to hand somebody: a
// browsable recording with a DOM snapshot per action, the console, and the exact locator each step
// used. It is not a tax on every run, which is the whole reason it lives behind a flag.
const wantsReport = args.includes('--report')
const passThrough = args.filter((a) => a !== '--report')
const playwrightArgs = wantsReport
  ? ['playwright', 'test', '--trace', 'on', '--reporter=html,list', ...passThrough]
  : ['playwright', 'test', ...passThrough]

const started = Date.now()
const run = spawnSync('npx', playwrightArgs, { stdio: 'inherit' })
const secs = ((Date.now() - started) / 1000).toFixed(0)

if (wantsReport) {
  // Opened regardless of the result: in this mode the report IS the output, and a green report with
  // traces is the thing worth showing. `show-report` serves it and blocks until Ctrl-C, which is
  // what makes it browsable rather than a folder of JSON.
  console.log(`  e2e: ${run.status === 0 ? 'green' : 'FAILED'} in ${secs}s - opening the report`)
  spawnSync('npx', ['playwright', 'show-report'], { stdio: 'inherit' })
  process.exitCode = run.status ?? 1
} else if (run.status === 0) {
  console.log(`  e2e: green in ${secs}s`)
  pruneA11yBaseline(passThrough)
} else {
  // The HTML report is the thing to open, and it is also what CI uploads - so name it in both
  // places rather than leaving a failed run to guess.
  console.error(`  e2e: FAILED (${secs}s) - open the report with \`npx playwright show-report\``)
  process.exitCode = run.status ?? 1
}

// ⭐⭐ THE ACCESSIBILITY BASELINE'S ONE-WAY RATCHET – the shrink direction, once, after the suite.
//
// `e2e/a11y.spec.ts` fails a screen when a NEW violation appears; it deliberately does not fail when
// one disappears. The cost of that choice is a debt file that only ever grows, and an unpruned debt
// file is an allowlist wearing a different hat. The whole argument, and why this is not a Playwright
// test, is in scripts/lib/a11y-baseline.mjs.
//
// ⚠⚠ TWO PRECONDITIONS, AND BOTH MAKE AN HONEST "CANNOT TELL" RATHER THAN A WRONG ANSWER:
//   * A GREEN RUN ONLY (the caller). A red run may have stopped a screen before it scanned.
//   * NO ARGUMENTS AT ALL. This is deliberately blunt rather than a list of "filtering" flags:
//     `-g`, a spec path, `--shard`, `--last-failed` and `--only-changed` all run a SUBSET, and every
//     surface a subset did not visit would look like a fixed defect. Enumerating them is a list that
//     rots the next time Playwright adds one. `npm run test:e2e` with no arguments is what CI runs
//     and what a pre-PR check runs, which is where this needs to be right.
function pruneA11yBaseline(passedArgs) {
  if (passedArgs.length > 0) return

  const stale = staleBaselineEntries(
    fileURLToPath(new URL('../test-results/a11y-findings.jsonl', import.meta.url)),
    fileURLToPath(new URL('../e2e/a11y-baseline.json', import.meta.url)),
  )
  if (stale === null || stale.length === 0) return

  console.error('  e2e: these accessibility baseline entries no longer describe anything:')
  for (const entry of stale) console.error(`         ${entry}`)
  console.error('       The violations they recorded are FIXED. Delete those entries from')
  console.error('       e2e/a11y-baseline.json - an entry that guards nothing is how a debt file')
  console.error('       turns into an allowlist, which is the one thing that file must not become.')
  process.exitCode = 1
}
