// Phase 0c probe – the browser baseline (review 26.09, baseline 03d92221).
//
// Drives the PRODUCTION build (`vite preview` of dist/) in real Chromium, seeded with a committed e2e
// fixture exactly the way e2e/careerAt.ts seeds it (the product's own .tsave bytes, written inside the
// IndexedDB versionchange transaction before the app boots). Nothing in src/ is changed: the probe
// only OBSERVES, through
//   - page side: a Worker subclass installed by an init script that timestamps every message both
//     ways and keeps the reply objects so their size can be measured after the timed window;
//   - worker side: `worker.evaluate` wraps `self.onmessage`, `self.postMessage`,
//     `IDBDatabase.prototype.transaction` and `IDBObjectStore.prototype.put` in the live sim worker,
//     so the app's own autosave transaction is timed from creation to `complete`;
//   - the Pinia store reached through `#app.__vue_app__` (set by Vue in production builds too), used
//     to ISSUE commands (`advance(1)`, `setWeightEnabled(on)`) without the UI's calendar-sweep detour;
//   - a MutationObserver quiet window + a double rAF for "the DOM settled";
//   - CDP `Performance.getMetrics` deltas (renderer main thread) and, per scenario, one Chrome trace
//     for the main-thread / worker-thread split.
//
// Run from the tb-review worktree root:
//   node docs/review-principles-2026-09-26/probes/browser-perf.mjs <mode> <out.json> [args]
// modes:
//   explore <fixture...>                 boot each fixture, report its state, advance once, report again
//   toggle  <fixture> <N>                N setWeightEnabled round trips per screen (home/money/season/more)
//   advance <fixture> <screen> <N> [T]   N fresh contexts, each advancing ONE week with <screen> open,
//                                        then T more contexts traced (not timed)
//   series  <fixture> <screen> <N> [W]  W untimed then N timed CONSECUTIVE advances in one session
//   idbproxy <N>                         controlled IndexedDB puts of 58/78/81 KiB incompressible payloads
// env: TB_URL (default http://localhost:4390/)

import { chromium } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const URL_BASE = process.env.TB_URL ?? 'http://localhost:4390/'
const ROOT = fileURLToPath(new URL('../../../', import.meta.url)) // the worktree root
const FIX_DIR = `${ROOT}e2e/fixtures/`
const manifest = JSON.parse(readFileSync(`${FIX_DIR}manifest.json`, 'utf8'))

// src/db/saves.ts's constants, as e2e/careerAt.ts copies them
const DB_NAME = 'tennis-sim'
const DB_VERSION = 2
const HEADER = 44 // tools/e2e-fixtures-read.ts ENVELOPE_HEADER_BYTES
const SEEDED_AT = Date.UTC(2026, 7, 8, 12, 0, 0)

function seedPayload(name, storage) {
  const entry = manifest.fixtures.find((f) => f.name === name)
  if (!entry) throw new Error(`no fixture ${name}`)
  const bytes = readFileSync(`${FIX_DIR}${entry.file}`)
  const checksum = bytes.subarray(12, HEADER)
  const payload = bytes.subarray(HEADER)
  return {
    entry,
    seed: {
      dbName: DB_NAME,
      dbVersion: DB_VERSION,
      record: {
        slot: entry.slot,
        careerId: entry.careerId,
        savedAt: SEEDED_AT,
        week: entry.facts.week,
        seed: entry.seed,
        bytes: payload.byteLength,
        kidName: entry.profile.kidName,
        country: entry.profile.country,
        revision: 1,
        checksumB64: Buffer.from(checksum).toString('base64'),
        payloadB64: Buffer.from(payload).toString('base64'),
      },
      meta: {
        careerId: entry.careerId,
        kidName: entry.profile.kidName,
        country: entry.profile.country,
        seed: entry.seed,
        createdAt: SEEDED_AT,
        lastPlayedAt: SEEDED_AT,
        week: entry.facts.week,
        revision: 1,
      },
      storage,
    },
  }
}

// ---- runs in the page before any app script (stringified by addInitScript) ----
function initScript(p) {
  // localStorage first, synchronously (careerAt.ts's ordering argument)
  try {
    if (localStorage.getItem('tb-probe-seeded') === null) {
      localStorage.clear()
      for (const [k, v] of Object.entries(p.storage)) localStorage.setItem(k, v)
      localStorage.setItem('tb-probe-seeded', '1')
    }
  } catch {}
  const bytes = (b64) => {
    const bin = atob(b64)
    const out = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
    return out
  }
  const req = indexedDB.open(p.dbName, p.dbVersion)
  req.onupgradeneeded = () => {
    const db = req.result
    const tx = req.transaction
    if (!db.objectStoreNames.contains('saves')) db.createObjectStore('saves', { keyPath: 'slot' })
    if (!db.objectStoreNames.contains('careers')) db.createObjectStore('careers', { keyPath: 'careerId' })
    const { checksumB64, payloadB64, ...rest } = p.record
    tx.objectStore('saves').put({ ...rest, checksum: bytes(checksumB64), payload: bytes(payloadB64) })
    tx.objectStore('careers').put(p.meta)
  }
  req.onsuccess = () => req.result.close()

  // the message tap: timestamps both directions, keeps reply objects for sizing after the window
  const m = (window.__tbm = { recv: [], send: [] })
  const W = window.Worker
  window.Worker = class extends W {
    constructor(u, o) {
      super(u, o)
      // registered in the constructor, so it runs BEFORE the app's own `w.onmessage`:
      //   t      – the message event starts dispatching (before `e.data` is touched)
      //   td     – after `e.data` has been read (the structured-clone deserialisation, if lazy)
      //   tFlush – a MessageChannel task queued now runs after the app's handler AND the microtask
      //            drain that follows it (Vue's scheduler flush), i.e. "this reply has been rendered"
      //   tFrame – a double rAF queued now: the frame that carries the update has been produced
      const now = () => performance.timeOrigin + performance.now()
      this.addEventListener('message', (e) => {
        const rec = { t: now(), td: null, tFlush: null, tFrame: null, data: null }
        rec.data = e.data
        rec.td = now()
        m.recv.push(rec)
        const ch = new MessageChannel()
        ch.port1.onmessage = () => {
          rec.tFlush = now()
          ch.port1.close()
        }
        ch.port2.postMessage(0)
        requestAnimationFrame(() => requestAnimationFrame(() => (rec.tFrame = now())))
      })
      const post = this.postMessage.bind(this)
      this.postMessage = (msg, tr) => {
        m.send.push({ t: performance.timeOrigin + performance.now(), type: msg?.type, id: msg?.id })
        return post(msg, tr)
      }
    }
  }
}

// ---- runs inside the live sim worker (worker.evaluate) ----
function workerPatch() {
  if (self.__tbw) return 'already'
  const now = () => performance.timeOrigin + performance.now()
  const w = (self.__tbw = { cmds: [], replies: [], txs: [], puts: [] })
  const orig = self.onmessage
  self.onmessage = function (e) {
    w.cmds.push({ t: now(), type: e.data?.type, id: e.data?.id })
    return orig.call(this, e)
  }
  const op = self.postMessage.bind(self)
  self.postMessage = (msg, tr) => {
    w.replies.push({ t: now(), id: msg?.id, type: msg?.type })
    return op(msg, tr)
  }
  const tx0 = IDBDatabase.prototype.transaction
  IDBDatabase.prototype.transaction = function (stores, mode, ...rest) {
    const tx = tx0.call(this, stores, mode, ...rest)
    if (mode === 'readwrite') {
      const rec = { t0: now(), stores: [].concat(stores).join('+'), t1: null, end: null }
      w.txs.push(rec)
      tx.addEventListener('complete', () => {
        rec.t1 = now()
        rec.end = 'complete'
      })
      tx.addEventListener('abort', () => {
        rec.t1 = now()
        rec.end = 'abort'
      })
    }
    return tx
  }
  const put0 = IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put = function (...args) {
    const t = now()
    const r = put0.apply(this, args)
    w.puts.push({ t, dt: now() - t, store: this.name, payloadBytes: args[0]?.payload?.byteLength ?? null })
    return r
  }
  return 'patched'
}

// ---- runs in the page: issue one store command and wait for the DOM to settle ----
async function pageMeasure({ cmd, arg, quietMs, capMs }) {
  const store = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('game')
  const m = window.__tbm
  const now = () => performance.timeOrigin + performance.now()
  let last = null
  let mutations = 0
  let frameAfterLast = null
  let frameToken = 0
  const mo = new MutationObserver((recs) => {
    last = now()
    mutations += recs.length
    const token = ++frameToken
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (token === frameToken) frameAfterLast = now()
      }),
    )
  })
  mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
  const recv0 = m.recv.length
  const send0 = m.send.length
  const week0 = store.snapshot?.week
  const t0 = now()
  let err = null
  try {
    if (cmd === 'advance') await store.advance(arg)
    else if (cmd === 'setWeightEnabled') await store.setWeightEnabled(arg)
    else throw new Error('unknown cmd ' + cmd)
  } catch (e) {
    err = String(e)
  }
  const tResolved = now()
  // quiet window: wait until no mutation for quietMs, capped
  let timedOut = false
  for (;;) {
    await new Promise((r) => setTimeout(r, 20))
    const ref = last ?? tResolved
    if (now() - ref >= quietMs && (frameAfterLast !== null || last === null)) break
    if (now() - t0 > capMs) {
      timedOut = true
      break
    }
  }
  mo.disconnect()
  const recv = m.recv.slice(recv0)
  const send = m.send.slice(send0)
  const snap = recv.find((r) => r.data?.type === 'snapshot')
  // wait for every reply's flush / frame stamp to land before reading them
  for (let i = 0; i < 50 && recv.some((r) => r.tFlush === null || r.tFrame === null); i++) await new Promise((r) => setTimeout(r, 20))
  const sizes = recv.map((r) => ({
    type: r.data?.type,
    id: r.data?.id,
    t: r.t,
    td: r.td,
    tFlush: r.tFlush,
    tFrame: r.tFrame,
    jsonChars: JSON.stringify(r.data).length,
    snapshotJsonChars: r.data?.snapshot ? JSON.stringify(r.data.snapshot).length : null,
  }))
  // drop references so the next iteration does not carry them
  m.recv.length = 0
  m.send.length = 0
  return {
    err,
    t0,
    tResolved,
    tSnap: snap?.t ?? null,
    tLastMutation: last,
    tFrameAfterLast: frameAfterLast,
    mutations,
    timedOut,
    week0,
    week1: store.snapshot?.week,
    busy: store.busy,
    error: store.error,
    sends: send.map((s) => ({ type: s.type, id: s.id, t: s.t })),
    replies: sizes,
  }
}

async function idleMutations(page, ms) {
  return page.evaluate(async (ms) => {
    let n = 0
    const mo = new MutationObserver((recs) => (n += recs.length))
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
    await new Promise((r) => setTimeout(r, ms))
    mo.disconnect()
    return n
  }, ms)
}

const STORAGE = {
  'tb:onboardingTourSeen': '1',
  // the week story would take the tab on every advance; off, a resolved week goes Home
  'tb-week-story-off': '1',
}

async function boot(browser, name, { patchWorker = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 576, height: 1280 }, serviceWorkers: 'block' })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  let worker = null
  page.on('worker', (w) => {
    if (/sim\.worker/.test(w.url())) worker = w
  })
  const { entry, seed } = seedPayload(name, STORAGE)
  await page.addInitScript(initScript, seed)
  const tNav = Date.now()
  await page.goto(URL_BASE)
  await page.getByRole('button', { name: 'Tap to start' }).click({ timeout: 30_000 })
  await page.waitForFunction(() => {
    const a = document.querySelector('#app')?.__vue_app__
    const s = a?.config.globalProperties.$pinia?._s.get('game')
    return s && s.ready && s.snapshot && !s.busy
  }, null, { timeout: 30_000 })
  const bootMs = Date.now() - tNav
  // step through the boot doorways the journeys step through (e2e/journey.ts)
  const briefing = page.getByRole('heading', { name: 'The commitment rules now apply.' })
  if (await briefing.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
  }
  const rest = page.getByRole('radio', { name: /^Rest it/ })
  if (await rest.isVisible().catch(() => false)) {
    await rest.click()
    await page.getByRole('dialog').getByRole('button', { name: 'Proceed', exact: true }).click()
    await page.waitForFunction(() => !document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('game').busy)
  }
  if (patchWorker) {
    for (let i = 0; i < 50 && !worker; i++) await new Promise((r) => setTimeout(r, 50))
    if (!worker) throw new Error('sim worker not seen')
    const r = await worker.evaluate(workerPatch)
    if (r !== 'patched') throw new Error('worker patch: ' + r)
  }
  return { context, page, worker, entry, errors, bootMs }
}

async function state(page) {
  return page.evaluate(() => {
    const s = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('game')
    const sn = s.snapshot
    return {
      week: sn?.week,
      pending: !!sn?.pending,
      dialogs: [...document.querySelectorAll('[role="dialog"],[role="alertdialog"]')].map((d) => (d.getAttribute('aria-label') ?? d.textContent ?? '').slice(0, 80)),
      nodes: document.querySelectorAll('*').length,
      busy: s.busy,
      error: s.error,
      snapshotKeys: sn ? Object.keys(sn).length : 0,
      weightEnabled: sn?.weightEnabled,
    }
  })
}

async function openScreen(page, screen) {
  const nav = page.getByRole('navigation', { name: /./ }).first()
  if (screen === 'home') {
    await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
  } else if (screen === 'season') {
    await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()
  } else if (screen === 'money') {
    await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
    await page.getByRole('button', { name: /^Family budget/ }).click()
    await page.getByRole('heading', { name: 'Family Budget' }).waitFor()
  } else if (screen === 'more') {
    await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByRole('group', { name: 'Which settings' }).waitFor()
  } else throw new Error('screen ' + screen)
  void nav
  await new Promise((r) => setTimeout(r, 400))
}

async function workerLog(worker) {
  return worker.evaluate(() => {
    const w = self.__tbw
    const out = { cmds: w.cmds.slice(), replies: w.replies.slice(), txs: w.txs.slice(), puts: w.puts.slice() }
    w.cmds.length = 0
    w.replies.length = 0
    w.txs.length = 0
    w.puts.length = 0
    return out
  })
}

async function metrics(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics')
  const o = {}
  for (const m of metrics) o[m.name] = m.value
  return o
}

function delta(a, b) {
  const keys = ['ScriptDuration', 'TaskDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount', 'JSHeapUsedSize', 'Nodes']
  const o = {}
  for (const k of keys) o[k] = (b[k] ?? 0) - (a[k] ?? 0)
  return o
}

// ---- trace parsing: per-thread busy time (top-level RunTask) and scripting (top-level JS events) ----
const JS_EVENTS = new Set(['FunctionCall', 'EvaluateScript', 'v8.evaluateModule', 'RunMicrotasks', 'TimerFire', 'EventDispatch', 'FireAnimationFrame', 'v8.compile', 'v8.compileModule', 'V8.Execute', 'v8.run'])
function parseTrace(buf) {
  const json = JSON.parse(buf.toString('utf8'))
  const events = Array.isArray(json) ? json : json.traceEvents
  const names = new Map()
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name') names.set(`${e.pid}:${e.tid}`, e.args?.name)
  const per = new Map()
  const byThread = new Map()
  for (const e of events) {
    if (e.ph !== 'X' || typeof e.dur !== 'number') continue
    const key = `${e.pid}:${e.tid}`
    if (!byThread.has(key)) byThread.set(key, [])
    byThread.get(key).push(e)
  }
  for (const [key, list] of byThread) {
    const tname = names.get(key) ?? key
    if (!/CrRendererMain|DedicatedWorker/.test(tname)) continue
    list.sort((a, b) => a.ts - b.ts)
    let busy = 0
    let busyEnd = -1
    let js = 0
    let jsEnd = -1
    let gc = 0
    for (const e of list) {
      if (e.name === 'RunTask' || e.name === 'ThreadControllerImpl::RunTask') {
        if (e.ts >= busyEnd) {
          busy += e.dur
          busyEnd = e.ts + e.dur
        }
      }
      if (JS_EVENTS.has(e.name) && e.ts >= jsEnd) {
        js += e.dur
        jsEnd = e.ts + e.dur
      }
      if (/^(MinorGC|MajorGC|V8\.GC_SCAVENGER|V8\.GCScavenger|V8\.GCFinalizeMC|BlinkGC)/.test(e.name)) gc += e.dur
    }
    const label = /DedicatedWorker/.test(tname) ? 'worker' : 'main'
    const prev = per.get(label) ?? { busyMs: 0, jsMs: 0, gcMs: 0, threads: 0 }
    prev.busyMs += busy / 1000
    prev.jsMs += js / 1000
    prev.gcMs += gc / 1000
    prev.threads += 1
    per.set(label, prev)
  }
  return Object.fromEntries(per)
}

function summarise(iter, wlog) {
  // join page-side and worker-side rows on the command id
  return iter
}

async function modeExplore(out, names) {
  const browser = await chromium.launch()
  const res = []
  for (const name of names) {
    const b = await boot(browser, name)
    const before = await state(b.page)
    const idle = await idleMutations(b.page, 1000)
    const adv = await b.page.evaluate(pageMeasure, { cmd: 'advance', arg: 1, quietMs: 300, capMs: 8000 })
    const wlog = await workerLog(b.worker)
    const after = await state(b.page)
    const adv2 = await b.page.evaluate(pageMeasure, { cmd: 'advance', arg: 1, quietMs: 300, capMs: 8000 })
    const after2 = await state(b.page)
    res.push({ name, bootMs: b.bootMs, before, idleMutationsPerSec: idle, adv, wlog, after, adv2: { err: adv2.err, week0: adv2.week0, week1: adv2.week1 }, after2, errors: b.errors })
    await b.context.close()
  }
  await browser.close()
  writeFileSync(out, JSON.stringify(res, null, 1))
}

async function modeToggle(out, name, n) {
  const browser = await chromium.launch()
  const b = await boot(browser, name)
  const cdp = await b.context.newCDPSession(b.page)
  await cdp.send('Performance.enable')
  const res = { fixture: name, week: b.entry.facts.week, n, screens: {} }
  let on = !(await state(b.page)).weightEnabled
  for (const screen of ['more', 'home', 'money', 'season', 'more2']) {
    await openScreen(b.page, screen === 'more2' ? 'more' : screen)
    const st = await state(b.page)
    const idle = await idleMutations(b.page, 1000)
    // warm-up: 3 untimed round trips on this screen
    for (let i = 0; i < 3; i++) {
      await b.page.evaluate(pageMeasure, { cmd: 'setWeightEnabled', arg: on, quietMs: 150, capMs: 4000 })
      on = !on
    }
    await workerLog(b.worker)
    const rows = []
    for (let i = 0; i < n; i++) {
      const m0 = await metrics(cdp)
      const r = await b.page.evaluate(pageMeasure, { cmd: 'setWeightEnabled', arg: on, quietMs: 150, capMs: 4000 })
      const m1 = await metrics(cdp)
      on = !on
      r.cdp = delta(m0, m1)
      r.worker = await workerLog(b.worker)
      rows.push(r)
    }
    // one trace over 5 more iterations
    await browser.startTracing(b.page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'disabled-by-default-v8.gc'] })
    const tr0 = Date.now()
    for (let i = 0; i < 5; i++) {
      await b.page.evaluate(pageMeasure, { cmd: 'setWeightEnabled', arg: on, quietMs: 150, capMs: 4000 })
      on = !on
    }
    const buf = await browser.stopTracing()
    await workerLog(b.worker)
    const trace = parseTrace(buf)
    res.screens[screen] = { state: st, idleMutationsPerSec: idle, rows, trace: { iterations: 5, wallMs: Date.now() - tr0, perThread: trace } }
  }
  res.errors = b.errors
  await b.context.close()
  await browser.close()
  writeFileSync(out, JSON.stringify(res, null, 1))
}

async function modeAdvance(out, name, screen, n, traceReps) {
  const browser = await chromium.launch()
  const res = { fixture: name, screen, n, traceReps, rows: [] }
  for (let i = 0; i < n + traceReps; i++) {
    const b = await boot(browser, name)
    const cdp = await b.context.newCDPSession(b.page)
    await cdp.send('Performance.enable')
    await openScreen(b.page, screen)
    // warm the snapshot/render path once with a non-advancing command (setWeightEnabled round trip)
    const st = await state(b.page)
    await b.page.evaluate(pageMeasure, { cmd: 'setWeightEnabled', arg: !st.weightEnabled, quietMs: 150, capMs: 4000 })
    await b.page.evaluate(pageMeasure, { cmd: 'setWeightEnabled', arg: st.weightEnabled, quietMs: 150, capMs: 4000 })
    await workerLog(b.worker)
    const nodes0 = (await state(b.page)).nodes
    // traced reps come AFTER the n timed ones, so tracing overhead never reaches a timed row
    const tracing = i >= n
    if (tracing) await browser.startTracing(b.page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'disabled-by-default-v8.gc'] })
    const m0 = await metrics(cdp)
    const r = await b.page.evaluate(pageMeasure, { cmd: 'advance', arg: 1, quietMs: 300, capMs: 8000 })
    const m1 = await metrics(cdp)
    if (tracing) r.trace = parseTrace(await browser.stopTracing())
    r.cdp = delta(m0, m1)
    r.worker = await workerLog(b.worker)
    const after = await state(b.page)
    r.nodes0 = nodes0
    r.traced = tracing
    r.after = after
    r.bootMs = b.bootMs
    r.errors = b.errors
    res.rows.push(r)
    await b.context.close()
  }
  await browser.close()
  writeFileSync(out, JSON.stringify(res, null, 1))
}

async function modeIdbProxy(out, n) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ serviceWorkers: 'block' })
  const page = await context.newPage()
  await page.goto(URL_BASE)
  // §B.5 stored payloads, KiB: w100 58.2, w200 77.2, end 79.9 – rounded to 58 / 78 / 81 (the largest)
  const sizes = [58, 78, 81]
  const res = await page.evaluate(async ({ n, sizes }) => {
    const open = () =>
      new Promise((res, rej) => {
        const r = indexedDB.open('tb-probe-idb', 1)
        r.onupgradeneeded = () => r.result.createObjectStore('saves', { keyPath: 'slot' })
        r.onsuccess = () => res(r.result)
        r.onerror = () => rej(r.error)
      })
    const db = await open()
    const out = {}
    for (const kib of sizes) {
      const rows = []
      for (let i = 0; i < n + 3; i++) {
        const payload = new Uint8Array(kib * 1024)
        crypto.getRandomValues(payload.subarray(0, Math.min(payload.length, 65536)))
        if (payload.length > 65536) crypto.getRandomValues(payload.subarray(65536))
        const rec = { slot: 'auto:probe:' + (i % 2 ? 'b' : 'a'), careerId: 'probe', savedAt: Date.now(), week: i, payload, checksum: new Uint8Array(32) }
        const t0 = performance.now()
        const done = new Promise((res, rej) => {
          const tx = db.transaction(['saves'], 'readwrite')
          tx.oncomplete = () => res(performance.now())
          tx.onabort = () => rej(tx.error)
          const s = performance.now()
          tx.objectStore('saves').put(rec)
          rec._putMs = performance.now() - s
        })
        const t1 = await done
        if (i >= 3) rows.push({ totalMs: t1 - t0, putSyncMs: rec._putMs })
      }
      out[kib] = rows
    }
    db.close()
    await new Promise((r) => {
      const d = indexedDB.deleteDatabase('tb-probe-idb')
      d.onsuccess = d.onerror = d.onblocked = () => r()
    })
    return out
  }, { n, sizes })
  await context.close()
  await browser.close()
  writeFileSync(out, JSON.stringify(res, null, 1))
}

// consecutive advances in ONE session with <screen> re-opened (untimed) before each: the warm path.
// Stops at the first advance the engine does not take (a blocking card, a tournament, an ending).
async function modeSeries(out, name, screen, n, warm) {
  const browser = await chromium.launch()
  const b = await boot(browser, name)
  const cdp = await b.context.newCDPSession(b.page)
  await cdp.send('Performance.enable')
  const res = { fixture: name, screen, n, warm, rows: [], stoppedAt: null }
  for (let i = 0; i < n + warm; i++) {
    await openScreen(b.page, screen)
    await workerLog(b.worker)
    const m0 = await metrics(cdp)
    const r = await b.page.evaluate(pageMeasure, { cmd: 'advance', arg: 1, quietMs: 300, capMs: 8000 })
    const m1 = await metrics(cdp)
    r.cdp = delta(m0, m1)
    r.worker = await workerLog(b.worker)
    r.after = await state(b.page)
    r.warmup = i < warm
    res.rows.push(r)
    // a card raised by the week (a birthday, a season wrap-up, a life beat) is answered through the
    // UI, untimed, the way a player would: pick the first option if it offers radios, then press the
    // dialog's last enabled button, up to 6 times. Anything still blocking after that ends the series.
    let cleared = 0
    for (let k = 0; k < 6 && !r.err && !r.after.pending && r.after.dialogs.length; k++) {
      const dlg = b.page.getByRole('dialog').first()
      const radio = dlg.getByRole('radio').first()
      if (await radio.isVisible().catch(() => false)) await radio.click().catch(() => {})
      const btn = dlg.locator('button:not([disabled])').last()
      if (await btn.isVisible().catch(() => false)) await btn.click().catch(() => {})
      await b.page.waitForFunction(() => !document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('game').busy)
      await new Promise((res) => setTimeout(res, 300))
      r.after = await state(b.page)
      cleared++
    }
    r.clearedDialogs = cleared
    if (r.err || r.week1 === r.week0 || r.after.pending || r.after.dialogs.length) {
      res.stoppedAt = { i, week: r.week1, err: r.err, pending: r.after.pending, dialogs: r.after.dialogs }
      break
    }
  }
  res.errors = b.errors
  await b.context.close()
  await browser.close()
  writeFileSync(out, JSON.stringify(res, null, 1))
}

const [mode, out, ...args] = process.argv.slice(2)
if (mode === 'series') await modeSeries(out, args[0], args[1], Number(args[2] ?? 25), Number(args[3] ?? 3))
else
if (mode === 'explore') await modeExplore(out, args)
else if (mode === 'toggle') await modeToggle(out, args[0], Number(args[1] ?? 25))
else if (mode === 'advance') await modeAdvance(out, args[0], args[1], Number(args[2] ?? 20), Number(args[3] ?? 0))
else if (mode === 'idbproxy') await modeIdbProxy(out, Number(args[0] ?? 30))
else throw new Error('mode?')
void summarise
