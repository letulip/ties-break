#!/usr/bin/env node

// THE END-TO-END SUITE: real Chromium, a real production build, and two preconditions checked
// before any of it starts.
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
// ⚠ NOT PART OF `npm run check`, ON PURPOSE. The pre-push gate is already ~4 minutes and this is a
// browser suite; the PR gate calls it as its own job (.github/workflows/ci.yml). See e2e/README.md.

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { chromium } from '@playwright/test'

/** Parsed out of playwright.config.ts so the two cannot drift - the same idiom scripts/sim.mjs uses
 *  to read HEAVY_SIM_FILES out of vite.config.ts. A port checked here that the config no longer
 *  serves on would be worse than not checking at all. */
function servePort() {
  const config = readFileSync(new URL('../playwright.config.ts', import.meta.url), 'utf8')
  const match = config.match(/^const PORT = (\d+)$/m)
  if (!match) throw new Error('scripts/e2e.mjs: PORT not found in playwright.config.ts')
  return Number(match[1])
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

const port = servePort()
if (!(await portIsFree(port))) {
  console.error(`  e2e: port ${port} is already in use, and the suite serves its own build there.`)
  console.error('       A leftover `npm run preview` is the usual culprit - stop it and re-run.')
  console.error(`       (The config sets strictPort + reuseExistingServer:false so a stale dist can`)
  console.error('        never be tested by accident. See playwright.config.ts.)')
  process.exit(1)
}

const started = Date.now()
const run = spawnSync('npx', ['playwright', 'test', ...args], { stdio: 'inherit' })
const secs = ((Date.now() - started) / 1000).toFixed(0)

if (run.status === 0) {
  console.log(`  e2e: green in ${secs}s`)
} else {
  // The HTML report is the thing to open, and it is also what CI uploads - so name it in both
  // places rather than leaving a failed run to guess.
  console.error(`  e2e: FAILED (${secs}s) - open the report with \`npx playwright show-report\``)
  process.exitCode = run.status ?? 1
}
