#!/usr/bin/env node
// DOES AN UPDATE FETCH ONLY WHAT CHANGED? THE MEASUREMENT, NOT THE ASSUMPTION.
//
// Round 29 part two #7, the owner, and it is the harder half of his ruling: «А с обновлением
// догружать то, чего нет или обновлять то, что обновилось, а не весь сет.» The art went into the
// PWA install in the same item – 313 entries, 12.3 MB – so a deploy that re-downloaded the set
// would be strictly worse on a phone than the black plates it replaced.
//
// ⚠ WORKBOX IS *DOCUMENTED* TO HAVE THIS PROPERTY AND THAT IS NOT EVIDENCE. The precache manifest
// is revision-keyed (`{url, revision}`, the revision being the md5 of the file's own bytes) and
// `PrecacheController.install()` is supposed to fetch an entry only when that url+revision pair is
// missing from the cache. Whether it holds for 205 newly-added images, under this build, with this
// plugin version, is a question about a running browser. So this tool asks a running browser.
//
// WHAT IT DOES
//
//   1. `vite build` -> copy dist to A.
//   2. Overwrite ONE painting with the bytes of another (a real content change, one file), build
//      again -> copy dist to B, restore the painting from a byte copy taken before step 1.
//      ⚠ RESTORED FROM A FILE COPY, NEVER `git checkout` – checkout restores from the INDEX and
//      would delete anybody's unstaged work in the same path.
//   3. Serve A over HTTP from a root this process can swap. Every response carries
//      `Cache-Control: no-store`, so the browser's HTTP cache cannot hide a fetch from the count –
//      the measurement is deliberately biased AGAINST the claim.
//   4. Drive a real Chromium to the page, wait until the worker has precached all of A.
//   5. Reload so the page is CONTROLLED by that worker – without it the next worker never passes
//      through `waiting` and there is nothing to wait on (see the note at the reload).
//   6. Reset the request log, swap the served root to B, call `registration.update()`, and wait for
//      the second worker to reach `waiting` – i.e. for its precache install to have resolved.
//   7. Print every request the server saw during that install.
//
// THE ARMS
//
//   --arm=one   (default) B differs from A by one painting. The claim: 1 image fetched.
//   --arm=all               B is A with EVERY revision string in sw.js rewritten. Not one file was
//                           rebuilt; only the manifest says they changed. The claim: everything is
//                           fetched.
//                           ⚠ THIS ARM IS THE INSTRUMENT'S OWN CONTROL. A counter that cannot
//                           report a full re-download is not evidence that there wasn't one, and
//                           this repo has spent the week finding guards that could only go green.
//
// MEASURED 29.08 on r29p2c/full-offline-precache. The build prints 313 entries / 12255 KiB; the
// cache holds 307 KEYS, six of the entries being duplicates (see precacheKeys below).
//
//     arm   requests the second install made   of them images   bytes served
//     one                                  3                1        120.8 KiB
//     all                                305              205      11263.8 KiB
//
// ⭐ ONE PAINTING OF 205, 120.8 KiB OF 12.3 MB – and both of the other two requests are the worker
// scripts themselves, which a browser re-fetches to notice an update at all. The re-download his
// ruling forbids does not happen, and the arm that would have caught it does catch it.
//
// ⚠ `all` fetches 303 assets, not 307, and the four it skips are the right four: `assets/*` are
// content-hashed filenames and carry `revision:null`, so the URL IS the key and rewriting revisions
// cannot touch them. A hashed bundle that did not change is not re-downloaded either.
//
//     node tools/precache-delta.mjs [--arm=one|all] [--keep]

import { execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
// ⚠ `@playwright/test`, NOT `playwright` (T-11 of the 05.09 review). This line used to import the
// bare `playwright` package, which is NOT in package.json – it resolved only because
// `@playwright/test` hoists it into node_modules, so the tool worked by accident and would break
// the day npm flattened the tree differently. `@playwright/test` re-exports the same `chromium`
// and IS declared, so the fix is the import rather than a new dependency.
import { chromium } from '@playwright/test'
import {
  cpSync,
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const WORK = join(ROOT, '.tmp', 'precache-delta')

/** The painting the `one` arm alters, and what it is overwritten with. Two real, shipped courts. */
const VICTIM = 'public/images/fields/local-clay-1.webp'
const DONOR = 'public/images/fields/local-hard-1.webp'

const args = new Set(process.argv.slice(2))
const arm = [...args].find((a) => a.startsWith('--arm='))?.slice('--arm='.length) ?? 'one'
if (arm !== 'one' && arm !== 'all') throw new Error(`unknown --arm=${arm} (one|all)`)

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.md': 'text/markdown',
}

function build(into) {
  execFileSync('npx', ['vite', 'build'], { cwd: ROOT, stdio: 'pipe' })
  rmSync(into, { recursive: true, force: true })
  cpSync(join(ROOT, 'dist'), into, { recursive: true })
}

/**
 * How many CACHE KEYS a built `sw.js` will write, read out of its own manifest – no second source
 * of truth.
 *
 * ⚠ NOT the entry count the build prints, and the difference is real: `includeAssets` and
 * `globPatterns` both name ball.svg, favicon.png and the four pwa icons, so the manifest lists
 * those SIX twice. Workbox writes one cache key per distinct url+revision pair, so the cache holds
 * 307 where the build says 313 – and a run that expected 313 waits for a 314th entry that is never
 * coming. Found the hard way on the first run of this tool.
 */
function precacheKeys(dist) {
  const src = readFileSync(join(dist, 'sw.js'), 'utf8')
  const pairs = [...src.matchAll(/\{url:"(.*?)",revision:(null|"[0-9a-f]+")\}/g)]
  return new Set(pairs.map((m) => `${m[1]}|${m[2]}`)).size
}

async function main() {
  mkdirSync(WORK, { recursive: true })
  const A = join(WORK, 'a')
  const B = join(WORK, 'b')
  const backup = join(WORK, 'victim.webp.orig')

  copyFileSync(join(ROOT, VICTIM), backup)
  let restored = false
  const restore = () => {
    if (restored) return
    copyFileSync(backup, join(ROOT, VICTIM))
    restored = true
  }
  process.on('exit', restore)

  try {
    process.stdout.write('build A ...\n')
    build(A)

    if (arm === 'one') {
      process.stdout.write(`build B (${VICTIM} <- ${DONOR}) ...\n`)
      copyFileSync(join(ROOT, DONOR), join(ROOT, VICTIM))
      build(B)
      restore()
    } else {
      // B is A byte-for-byte except that every revision in the manifest is a different string.
      // Nothing was rebuilt: this arm measures the counter, not the build.
      process.stdout.write('build B (A with every manifest revision rewritten) ...\n')
      rmSync(B, { recursive: true, force: true })
      cpSync(A, B, { recursive: true })
      const sw = readFileSync(join(B, 'sw.js'), 'utf8')
      writeFileSync(
        join(B, 'sw.js'),
        sw.replace(/revision:"([0-9a-f]{32})"/g, (_m, r) => `revision:"${r.slice(1)}f"`),
      )
    }
  } catch (error) {
    restore()
    throw error
  }

  const entries = precacheKeys(A)
  process.stdout.write(`precache: ${entries} cache keys\n`)

  // --- the server, whose root this process can swap under the browser ---------------------------
  let root = A
  /** @type {{path: string, bytes: number}[]} */
  let log = []
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const path = url.pathname === '/' ? '/index.html' : url.pathname
    const file = join(root, path)
    // ⚠ no-store on EVERYTHING: the browser's own HTTP cache must not be able to answer a fetch the
    // service worker made, or an entry that WAS re-downloaded would never reach this counter.
    res.setHeader('Cache-Control', 'no-store')
    if (!existsSync(file) || !statSync(file).isFile()) {
      log.push({ path, bytes: 0 })
      res.writeHead(404).end('not found')
      return
    }
    log.push({ path, bytes: statSync(file).size })
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const origin = `http://127.0.0.1:${server.address().port}`

  const browser = await chromium.launch()
  const context = await browser.newContext({ serviceWorkers: 'allow' })
  const page = await context.newPage()

  try {
    await page.goto(origin, { waitUntil: 'load' })
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))

    // The worker is "ready" the moment it activates, which is after install has resolved – but the
    // count is asserted rather than assumed, because a partial precache would make arm `one` look
    // like a win for the wrong reason.
    const precached = async () =>
      page.evaluate(async () => {
        const names = await caches.keys()
        const name = names.find((n) => n.startsWith('workbox-precache'))
        if (!name) return 0
        return (await (await caches.open(name)).keys()).length
      })
    const deadline = Date.now() + 120_000
    while ((await precached()) < entries && Date.now() < deadline) await page.waitForTimeout(250)
    const installed = await precached()
    if (installed < entries) throw new Error(`first install cached ${installed} of ${entries}`)
    process.stdout.write(`first install: ${installed} entries cached\n`)

    // ⚠ THE RELOAD IS LOAD-BEARING, NOT TIDINESS – the first run of this tool hung here for two
    // minutes waiting for a `waiting` worker that was never coming. A worker installs on the first
    // visit and only CONTROLS the page after a navigation (registerType 'prompt' never claims
    // clients); with no controlled client to protect, the browser activates the next worker
    // immediately and it never passes through `waiting` at all. Reloading puts the page under the
    // worker, which is both the state a returning player is in and the only one with a stop
    // condition this tool can wait on.
    await page.reload({ waitUntil: 'load' })
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 60_000,
    })

    // --- everything from here is the SECOND install ---------------------------------------------
    log = []
    root = B
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration()
      await reg.update()
      // `waiting` is where a worker lands once its precache install has RESOLVED. With
      // registerType 'prompt' it stays there until the player taps Update, which is exactly the
      // moment to stop counting: everything the install was going to fetch, it has fetched.
      const until = Date.now() + 120_000
      while (!reg.waiting && Date.now() < until) await new Promise((r) => setTimeout(r, 100))
      if (!reg.waiting) throw new Error('no second worker reached the waiting state')
    })

    const images = log.filter((r) => r.path.startsWith('/images/'))
    const bytes = log.reduce((a, r) => a + r.bytes, 0)
    process.stdout.write(
      `\n=== SECOND INSTALL, arm=${arm} ===\n` +
        `precache entries in the build : ${entries}\n` +
        `requests the server saw       : ${log.length}\n` +
        `of them under /images/        : ${images.length}\n` +
        `bytes served                  : ${(bytes / 1024).toFixed(1)} KiB\n\n` +
        log
          .map((r) => `  ${(r.bytes / 1024).toFixed(1).padStart(9)} KiB  ${r.path}`)
          .slice(0, 40)
          .join('\n') +
        (log.length > 40 ? `\n  ... and ${log.length - 40} more\n` : '\n'),
    )
  } finally {
    await browser.close()
    server.close()
    restore()
    if (!args.has('--keep')) rmSync(WORK, { recursive: true, force: true })
  }
}

await main()
