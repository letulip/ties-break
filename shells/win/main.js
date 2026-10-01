'use strict'
/*
 * Ties Break – the Windows/Steam shell (S2 of docs/specs/app-shells-2026-10.md).
 *
 * ⚠ THE PWA STAYS THE PRODUCT. This file is a costume: it opens the SAME dist/ bytes every other
 * shell wraps, with no preload, no IPC and no bridge, so nothing in src/ can tell it is inside
 * Electron. The feedback adapter's native-bridge slot is left empty ON PURPOSE – the app takes its
 * mailto: fallback path here, and the one thing this file owes that path is routing mailto: out of
 * the window (docs/handoff/feedback-channel.md). Everything else the shell adds is below.
 *
 * ⚠ SCHEME – SHIPPED: a registered `app://` scheme, NOT file://. Measured, not reasoned, and the
 * SHELL_SCHEME=file switch keeps the losing arm runnable so the decision can be re-measured: the dist
 * is built with `base: '/'` (vite.config.ts), so index.html asks for src="/assets/index-….js", and on
 * file:// that is file:///assets/…, which does not exist – #app never mounts (SHELL_SMOKE, same dist:
 * mounted=0 on file://, mounted=1 on app://). Wrapping the same bytes rules out rebuilding with a
 * relative base, so a scheme that serves dist/ as its root is the fix. It also gives the app a real,
 * stable, secure origin for IndexedDB saves, isSecureContext, fetch, module workers and Range requests
 * for the audio.
 *
 * ⚠ NO SERVICE WORKER HERE, ON PURPOSE. The scheme is not registered with allowServiceWorkers: dist/
 * is already on disk, so true offline needs no worker, and one would copy the whole install into
 * Cache Storage and open a SECOND update channel (src/pwa.ts's Update banner) beside the installer.
 * src/pwa.ts swallows the failed registration; nothing on screen mentions it, and the smoke asserts
 * the refusal rather than assuming it.
 *
 * Environment: SHELL_SMOKE=1 (headless-ish self-test, see smoke()), STEAM_SHELL=1 or --steam (Steam
 * init; also on when Steam itself launched us – it sets SteamAppId), SHELL_SCHEME=file (measurement).
 */
const { app, BrowserWindow, Menu, nativeImage, protocol, shell } = require('electron')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const SMOKE = process.env.SHELL_SMOKE === '1'
// Steam launches the exe with SteamAppId in the environment, so the owner's launch options need not
// carry --steam; the two explicit triggers are for a Steam-free machine that wants the overlay path.
const STEAM = process.argv.includes('--steam') || process.env.STEAM_SHELL === '1' || Boolean(process.env.SteamAppId)
const SCHEME = process.env.SHELL_SCHEME === 'file' ? 'file' : 'app'
const HOST = 'ties-break'
const APP_ORIGIN = `app://${HOST}/`
const FALLBACK_BACKGROUND = '#0a0e13' // = style.css --bg; only the net under the built manifest's own value

function readJson(candidates) {
  for (const file of candidates) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      // next candidate
    }
  }
  return undefined
}

// Packaged: electron-builder.config.cjs copies dist/ and config.json beside this file. From a
// checkout (`npm start` in shells/win) they sit two and one levels up.
const DIST = [path.join(__dirname, 'dist'), path.join(__dirname, '..', '..', 'dist')].find((dir) =>
  fs.existsSync(path.join(dir, 'index.html')),
)
const config = readJson([path.join(__dirname, 'config.json'), path.join(__dirname, '..', 'config.json')]) ?? {}
const PRODUCT_NAME = config.productName || 'Ties Break'
const FILE_ROOT = DIST ? pathToFileURL(DIST).href + '/' : ''

// The matching rule for what may leave the window. One regexp, used by both routes below.
const EXTERNAL = /^(https?|mailto):/i
const externalOpened = [] // SHELL_SMOKE only: the stub records instead of launching a mail client

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
])

if (SMOKE) {
  // The smoke must never touch the machine's real saves: a throwaway profile, removed on exit.
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-shell-smoke-'))
  app.setPath('userData', profile)
  app.on('quit', () => fs.rmSync(profile, { recursive: true, force: true }))
} else {
  app.setName(PRODUCT_NAME)
}

function openExternal(url) {
  if (SMOKE) {
    externalOpened.push(url)
    return
  }
  shell.openExternal(url).catch((err) => console.error('openExternal failed', url, err))
}

function isInApp(url) {
  return SCHEME === 'app' ? url.startsWith(APP_ORIGIN) : url.startsWith(FILE_ROOT)
}

// Every webContents, including the first: mailto: and http(s) go to the OS, nothing else leaves the
// window, and window.open never creates a second Electron window.
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (EXTERNAL.test(url)) openExternal(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event, url) => {
    if (isInApp(url)) return
    event.preventDefault()
    if (EXTERNAL.test(url)) openExternal(url)
  })
})

// ---- the app:// scheme: dist/ is its root ------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm',
}
const served = new Set() // SHELL_SMOKE only

async function serveDist(request) {
  let rel
  try {
    rel = decodeURIComponent(new URL(request.url).pathname)
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  if (rel.endsWith('/')) rel += 'index.html'
  const file = path.join(DIST, rel) // path.join collapses any `..`
  if (file !== DIST && !file.startsWith(DIST + path.sep)) return new Response('Forbidden', { status: 403 })

  let target = file
  let stat = await fs.promises.stat(target).catch(() => undefined)
  if (!stat || stat.isDirectory()) {
    // An extension-less miss is a client-side route: hand the app its index, as any static host would.
    if (path.extname(rel) !== '') return new Response('Not found', { status: 404 })
    target = path.join(DIST, 'index.html')
    stat = await fs.promises.stat(target).catch(() => undefined)
    if (!stat) return new Response('Not found', { status: 404 })
  }
  if (SMOKE) served.add(path.relative(DIST, target).split(path.sep).join('/'))

  const data = await fs.promises.readFile(target)
  const headers = {
    'Content-Type': MIME[path.extname(target).toLowerCase()] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
  }
  // Range: the audio element seeks with it, and a 200 for everything leaves a looped track stuck.
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '')
  if (range && (range[1] || range[2])) {
    const total = data.length
    const start = range[1] === '' ? Math.max(0, total - Number(range[2])) : Number(range[1])
    const end = range[1] === '' || range[2] === '' ? total - 1 : Math.min(Number(range[2]), total - 1)
    if (start > end || start >= total) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } })
    }
    return new Response(data.subarray(start, end + 1), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(end - start + 1) },
    })
  }
  return new Response(data, { status: 200, headers: { ...headers, 'Content-Length': String(data.length) } })
}

// ---- window ------------------------------------------------------------------------------------
function pageBackground() {
  // The app's own colour, from the manifest it was built with – so the shell cannot drift from it.
  const manifest = readJson([path.join(DIST, 'manifest.webmanifest')])
  return (manifest && manifest.background_color) || FALLBACK_BACKGROUND
}

function loadIcon() {
  try {
    // fs, not a path handed to the C++ side: the packaged dist/ lives inside app.asar.
    return nativeImage.createFromBuffer(fs.readFileSync(path.join(DIST, 'pwa-512.png')))
  } catch {
    return undefined
  }
}

function createWindow() {
  const icon = loadIcon()
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 375,
    minHeight: 667,
    useContentSize: true,
    show: false,
    backgroundColor: pageBackground(),
    ...(icon ? { icon } : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: !SMOKE, // a hidden smoke window must still run its timers
    },
  })
  if (!SMOKE) win.once('ready-to-show', () => win.show())
  if (SCHEME === 'app') void win.loadURL(APP_ORIGIN)
  else void win.loadFile(path.join(DIST, 'index.html'))
  return win
}

// ---- Steam -------------------------------------------------------------------------------------
// ⚠ UNTESTED AGAINST A REAL STEAM CLIENT – there is none on the build machine and no app id yet. What
// is proven: with no Steam client present (a Mac here) the call below lands in the catch, logs one
// line and the shell runs on. Shape follows steamworks.js's README: init, then electronEnableSteamOverlay
// at module level, i.e. BEFORE app ready, which is where it expects to run.
function initSteam() {
  // require inside try/catch IS the dynamic import: steamworks.js is an optional dependency, and
  // nothing may reference it at load time or a Steam-free machine without it would not start.
  try {
    const steamworks = require('steamworks.js')
    const client = steamworks.init(config.steamAppId ? Number(config.steamAppId) : undefined)
    if (typeof steamworks.electronEnableSteamOverlay === 'function') steamworks.electronEnableSteamOverlay()
    console.log(`STEAM_OK name=${client.localplayer.getName()}`)
  } catch (err) {
    console.log(`STEAM_UNAVAILABLE ${err && err.message ? err.message : err}`)
  }
}
if (STEAM) initSteam()

// ---- the smoke ---------------------------------------------------------------------------------
// SHELL_SMOKE=1: load the app in a hidden window, wait for Vue to mount, prove the three routes
// (mailto:, window.open to https, navigation to https) leave through the OS stub and the window stays
// in the app, prove the service worker is refused, print the facts, and quit. SHELL_SMOKE_OK is printed
// only when every one of them held.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const PAGE_FACTS = `(async () => {
  const out = {}
  const root = document.getElementById('app')
  out.mounted = root ? root.childElementCount : 0
  out.secure = window.isSecureContext
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await registration.unregister()
    out.sw = 'registered'
  } catch (err) { out.sw = 'refused:' + (err && err.name) }
  try {
    out.idb = await new Promise((resolve, reject) => {
      const open = indexedDB.open('tb-shell-smoke', 1)
      open.onsuccess = () => { open.result.close(); indexedDB.deleteDatabase('tb-shell-smoke'); resolve('ok') }
      open.onerror = () => reject(open.error)
    })
  } catch (err) { out.idb = 'fail:' + err }
  try {
    const res = await fetch('/pwa-512.png', { headers: { Range: 'bytes=0-99' } })
    out.range = res.status + '/' + (await res.arrayBuffer()).byteLength
  } catch (err) { out.range = 'fail:' + err }
  return JSON.stringify(out)
})()`

function smoke(win) {
  const wc = win.webContents
  const consoleLines = []
  const bail = (reason) => {
    console.log(`SHELL_SMOKE_FAIL reason=${reason}`)
    app.exit(1)
  }
  const watchdog = setTimeout(() => bail('timeout'), 45_000)
  wc.on('console-message', (...args) => {
    const detail = args[0] && typeof args[0].message === 'string' ? args[0] : { level: args[1], message: args[2] }
    const level = String(detail.level)
    const message = String(detail.message)
    // Electron's dev-mode CSP nag is about the shell, not the app, and would bury a real warning.
    if (message.includes('Electron Security Warning')) return
    if ((level === 'error' || level === 'warning' || level === '2' || level === '3') && consoleLines.length < 8) {
      consoleLines.push(`SHELL_SMOKE_CONSOLE ${level} ${message.slice(0, 200)}`)
    }
  })
  wc.once('did-fail-load', (_event, code, description, url) => bail(`did-fail-load ${code} ${description} ${url}`))
  wc.once('render-process-gone', (_event, details) => bail(`render-process-gone ${details.reason}`))
  wc.once('did-finish-load', async () => {
    try {
      let mounted = 0
      for (let waited = 0; waited < 15_000 && mounted === 0; waited += 150) {
        mounted = await wc.executeJavaScript(`(document.getElementById('app') || { childElementCount: 0 }).childElementCount`)
        if (mounted === 0) await sleep(150)
      }
      await sleep(250) // one settled tick
      const facts = JSON.parse(await wc.executeJavaScript(PAGE_FACTS))

      const probe = (code) => wc.executeJavaScript(code, true).catch(() => undefined)
      await probe(`void (location.href = 'mailto:smoke@example.invalid?subject=tb')`)
      await probe(`void window.open('https://example.invalid/via-window-open', '_blank')`)
      await probe(`void (location.href = 'https://example.invalid/via-navigation')`)
      await sleep(400)
      const routed = {
        mailto: externalOpened.includes('mailto:smoke@example.invalid?subject=tb'),
        popup: externalOpened.includes('https://example.invalid/via-window-open'),
        nav: externalOpened.includes('https://example.invalid/via-navigation'),
        held: isInApp(wc.getURL()),
      }

      const title = win.getTitle()
      const worker = [...served].some((name) => /worker/i.test(name))
      console.log(
        `SHELL_SMOKE_FACTS scheme=${SCHEME} steam=${STEAM} url=${wc.getURL()} mounted=${facts.mounted} secure=${facts.secure} ` +
          `idb=${facts.idb} range=${facts.range} sw=${facts.sw} served=${served.size} worker=${worker} ` +
          `mailto=${routed.mailto} popup=${routed.popup} nav=${routed.nav} held=${routed.held}`,
      )
      for (const line of consoleLines) console.log(line)

      const failures = []
      if (!title) failures.push('no-title')
      if (!mounted) failures.push('not-mounted')
      if (facts.sw === 'registered') failures.push('sw-registered')
      for (const [name, ok] of Object.entries(routed)) if (!ok) failures.push(`${name}-failed`)
      clearTimeout(watchdog)
      if (failures.length) return bail(failures.join(','))
      console.log(`SHELL_SMOKE_OK title=${title}`)
      app.quit()
    } catch (err) {
      bail(`exception ${err && err.message ? err.message : err}`)
    }
  })
}

// ---- start -------------------------------------------------------------------------------------
async function start() {
  if (!DIST) {
    console.error('SHELL_NO_DIST dist/index.html not found – run `npx vite build` at the repo root first')
    app.exit(1)
    return
  }
  app.setAppUserModelId(config.appId || 'com.tiesbreak.aceparent')
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null)
  protocol.handle('app', serveDist)
  const win = createWindow()
  if (SMOKE) smoke(win)
}

// A second launch of the same career would be a second writer on the same IndexedDB: focus the first.
if (!SMOKE && !app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })
  app.on('window-all-closed', () => app.quit())
  void app.whenReady().then(start)
}
