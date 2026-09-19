// Film NO GOOD ENDING. NO BAD ENDING. – 828x1792, the real epilogue on real fixture careers.
//
// ⚠ NOTHING IS RE-SIMULATED AND NO GAME VALUE IS TYPED. Every career was walked and ended by
// `ending-fixtures.ts` through the shipped resolvers; this file installs them, boots the app into
// each one, navigates the real screens and holds. The strings it owns are the editorial captions,
// the small note under the phone and the voice badge.
//
// ⚠ CAPTURE. Playwright records at CSS resolution 1:1, so `--force-device-scale-factor=2` turns the
// 828-wide stage into a 1656x3584 screencast; the assembler halves it back to 828x1792.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || '/tmp/endfilm'
const FIXDIR = process.argv[3] || '/tmp/ending-fixtures'
const PORT = 5845
fs.mkdirSync(OUT, { recursive: true })

const T0 = Date.now()
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
let lastStep = 'boot'
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: no completion – last step: ${lastStep}`)
  process.exit(3)
}, Number(process.env.FILM_WATCHDOG_MS || 20 * 60 * 1000))
const step = (s) => {
  lastStep = s
  console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s] ${s}`)
}

// =================================================================================================
// THE SHOTS – the owner's script, each one naming the fixture career it stands on
// =================================================================================================
const SHOTS = [
  { key: 'fall-a', hold: 3.6, save: 'fall-pre', screen: 'stats',
    caption: ['She was **#13**.', 'One season later, she was **#59**.'],
    note: 'Stats → Professional · season by season, as recorded' },
  { key: 'fall-b', hold: 2.5, save: 'fall-pre', screen: 'stats',
    caption: ['And this time, the decision', 'may not be yours.'],
    note: 'Stats → Professional · season by season, as recorded' },

  { key: 'e1', hold: 1.1, save: 'stopped', screen: 'last-page', caption: ['Eight ways it ends.'], note: 'The album · the last page' },
  { key: 'e2', hold: 1.6, save: 'college', screen: 'college', caption: ['The only ending that resumes.'], note: 'College · she is away, and the career is waiting' },
  { key: 'e3', hold: 1.1, save: 'bankruptcy', screen: 'last-page', caption: [], note: 'The album · the last page' },
  { key: 'e4', hold: 1.1, save: 'injury', screen: 'last-page', caption: [], note: 'The album · the last page' },
  { key: 'e5', hold: 1.1, save: 'natural', screen: 'last-page', caption: [], note: 'The album · the last page' },
  { key: 'e6', hold: 1.1, save: 'plateau', screen: 'last-page', caption: [], note: 'The album · the last page' },
  { key: 'e7', hold: 1.1, save: 'fall', screen: 'last-page', caption: [], note: 'The album · the last page' },
  { key: 'e8', hold: 1.1, save: 'peak', screen: 'last-page', caption: [], note: 'The album · the last page' },

  { key: 'peak-slow', hold: 4.6, save: 'peak', screen: 'last-page',
    caption: ['She left at the top.'],
    badge: 'Expected across complete careers: 1.72%',
    note: 'Twenty-five or older, on the paid table, top ten or the top title' },

  { key: 'fall-1', hold: 2.6, save: 'fall-pre', screen: 'stats', caption: ['Most players continue.'], note: 'The two seasons, side by side' },
  { key: 'fall-2', hold: 2.2, save: 'fall', screen: 'last-page', caption: ['Some decide they are finished.'], note: '' },
  { key: 'fall-3', hold: 2.2, save: 'fall', screen: 'last-page', caption: ['**1%** per eligible winter.'], note: '' },
  { key: 'fall-4', hold: 2.2, save: 'fall', screen: 'last-page', caption: ['**1.12%** of complete careers.'], note: '' },

  { key: 'v-fiery', hold: 2.0, save: 'fall-fiery', screen: 'last-page', quoteFrom: 'fall-fiery', caption: [], badge: 'fiery', note: 'The same door, the same season' },
  { key: 'v-quiet', hold: 2.0, save: 'fall-quiet', screen: 'last-page', quoteFrom: 'fall-quiet', caption: [], badge: 'quiet', note: 'The same door, the same season' },
  { key: 'v-deep', hold: 2.0, save: 'fall', screen: 'last-page', quoteFrom: 'fall', caption: [], badge: 'deep', note: 'The same door, the same season' },
  { key: 'v-sunny', hold: 2.0, save: 'fall-sunny', screen: 'last-page', quoteFrom: 'fall-sunny', caption: [], badge: 'sunny', note: 'The same door, the same season' },
  { key: 'v-note', hold: 2.2, save: 'fall-sunny', screen: 'last-page',
    caption: ['Her personality changes', 'her words \u2013 not her odds.'], note: 'Four voices, one door, one season' },

  { key: 'al1', hold: 0.6, save: 'natural', screen: 'album:0', caption: ['Seven pages. One career.'], note: '' },
  { key: 'al2', hold: 0.6, save: 'natural', screen: 'album:1', caption: [], note: '' },
  { key: 'al3', hold: 0.6, save: 'natural', screen: 'album:2', caption: [], note: '' },
  { key: 'al4', hold: 0.6, save: 'natural', screen: 'album:3', caption: [], note: '' },
  { key: 'al5', hold: 0.6, save: 'natural', screen: 'album:4', caption: [], note: '' },
  { key: 'al6', hold: 0.6, save: 'natural', screen: 'album:5', caption: [], note: '' },
  { key: 'al7', hold: 0.6, save: 'natural', screen: 'album:6', caption: [], note: '' },
  { key: 'record', hold: 1.8, save: 'natural', screen: 'record', caption: ['The whole record.'], note: 'Every milestone, season by season' },

  { key: 'logo1', hold: 2.0, logo: 1, caption: ['No good ending. No bad ending.', 'Just what happened.'] },
  { key: 'logo2', hold: 2.4, logo: 2, caption: ['Would you ask her for', '**one more year?**'] },
]

// =================================================================================================
const inFrame = (f, fn, arg) => f.evaluate(fn, arg)

async function dismissDialogs(f) {
  for (let i = 0; i < 10; i++) {
    const open = await inFrame(f, () => !!document.querySelector('.dialog-overlay'))
    if (!open) return
    await inFrame(f, () => {
      const bs = Array.from(document.querySelectorAll('.dialog-overlay button'))
      const pick = bs.find((b) => /^(continue|not now|close|later|ok|dismiss)/i.test((b.innerText || '').trim())) ?? bs[bs.length - 1]
      if (pick && !pick.disabled) pick.click()
    })
    await wait(500)
  }
  throw new Error('a dialog would not close')
}

async function bootFrame(page) {
  // wait for the frame to exist and the app to reach either the splash or a screen
  let f = null
  for (let i = 0; i < 80; i++) {
    f = page.frames().find((x) => x !== page.mainFrame())
    if (f) {
      const ready = await inFrame(f, () => document.readyState === 'complete' && !!document.querySelector('#app')).catch(() => false)
      if (ready) break
    }
    await wait(250)
  }
  if (!f) throw new Error('the window never appeared')
  for (let i = 0; i < 60; i++) {
    const s = await f.$('[aria-label="Tap to start"]').catch(() => null)
    if (s) {
      await s.click()
      break
    }
    await wait(300)
  }
  await wait(1800)
  await dismissDialogs(f)
  return f
}

async function goStats(f) {
  await inFrame(f, () => {
    const b = Array.from(document.querySelectorAll('.tab-btn')).find((x) => x.querySelector('.tab-label')?.textContent?.trim() === 'Stats')
    b?.click()
  })
  await wait(700)
  await dismissDialogs(f)
  await inFrame(f, () => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Professional')
    b?.click()
  })
  await wait(500)
  await inFrame(f, () => {
    const el = document.querySelector('#stats-seasons')
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - 16)
  })
  await wait(400)
}

async function goAlbumPage(f, index) {
  // The epilogue opens on page 0; `Next` walks forward and is disabled on the last page.
  await inFrame(f, (n) => {
    const nav = () => Array.from(document.querySelectorAll('.album-arrow'))
    const back = nav()[0]
    for (let i = 0; i < 12; i++) if (back && !back.disabled) back.click()
    for (let i = 0; i < n; i++) {
      const next = nav()[1]
      if (next && !next.disabled) next.click()
    }
  }, index)
  await wait(450)
}

async function goLastPage(f) {
  await inFrame(f, () => {
    for (let i = 0; i < 12; i++) {
      const next = Array.from(document.querySelectorAll('.album-arrow'))[1]
      if (!next || next.disabled) break
      next.click()
    }
  })
  await wait(450)
}

async function goRecord(f) {
  await goLastPage(f)
  await inFrame(f, () => {
    const b = Array.from(document.querySelectorAll('.ending-link')).find((x) => /whole record/i.test(x.innerText || ''))
    b?.click()
  })
  await wait(600)
}

async function goCollege(f) {
  await inFrame(f, () => {
    const b = Array.from(document.querySelectorAll('.tab-btn')).find((x) => x.querySelector('.tab-label')?.textContent?.trim() === 'Home')
    b?.click()
  })
  await wait(700)
  await dismissDialogs(f)
  await inFrame(f, () => {
    const el = document.querySelector('.college-card')
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - 16)
  })
  await wait(400)
}

async function goScreen(f, screen) {
  if (!screen) return
  if (screen === 'stats') return goStats(f)
  if (screen === 'last-page') return goLastPage(f)
  if (screen === 'record') return goRecord(f)
  if (screen === 'college') return goCollege(f)
  if (screen.startsWith('album:')) return goAlbumPage(f, Number(screen.split(':')[1]))
  throw new Error(`unknown screen ${screen}`)
}

// =================================================================================================
const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({
  viewport: { width: 828, height: 1792 },
  recordVideo: { dir: OUT, size: { width: 1656, height: 3584 } },
})
const page = await ctx.newPage()
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))

// --- install every fixture on this origin --------------------------------------------------------
step('install the fixture careers')
await page.goto(`http://localhost:${PORT}/tools/film/install-ending.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.__install === 'function', null, { timeout: 45000 })
const installed = {}
for (const file of fs.readdirSync(FIXDIR).filter((f) => f.endsWith('.tsave')).sort()) {
  const name = file.replace(/\.tsave$/, '')
  const b64 = fs.readFileSync(`${FIXDIR}/${file}`).toString('base64')
  const meta = await page.evaluate((b) => window.__install(b), b64)
  installed[name] = meta
  step(`  ${name.padEnd(12)} ${meta.kid} | wk ${meta.week} | ending ${meta.ending ?? '-'} | ${String(meta.detail ?? '').slice(0, 54)}`)
}
for (const shot of SHOTS) if (shot.save && !installed[shot.save]) throw new Error(`shot ${shot.key} wants fixture "${shot.save}" and it was not built`)

// --- the stage -----------------------------------------------------------------------------------
step('open the stage')
await page.goto(`http://localhost:${PORT}/tools/film/endings-film.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.__stage === 'object', null, { timeout: 45000 })
await page.evaluate(() => document.fonts.ready.then(() => true))
if (!(await page.evaluate(() => document.fonts.check('600 40px Sora')))) {
  console.error('REFUSED: Sora is not loaded on the stage')
  process.exit(2)
}
await page.evaluate(() => {
  window.__stage.lit(false)
  window.__stage.panel(false)
})

const marks = []
const shotLog = []
const filmStart = (Date.now() - T0) / 1000
await page.evaluate(() => window.__stage.lit(true))

let currentSave = null
let frame = null
for (const shot of SHOTS) {
  step(`shot ${shot.key}`)
  await page.evaluate(() => window.__stage.panel(false))
  await wait(320)

  if (shot.logo) {
    await page.evaluate((n) => {
      window.__stage.mode('logo')
      window.__stage.logoStep(n)
      window.__stage.badge('')
      window.__stage.note('')
    }, shot.logo)
  } else {
    await page.evaluate(() => window.__stage.mode('phone'))
    if (shot.save !== currentSave) {
      // Make this fixture the most recent career, then re-point the window: `init()` boots into it.
      await page.goto(`http://localhost:${PORT}/tools/film/install-ending.html`, { waitUntil: 'domcontentloaded' })
      await page.waitForFunction(() => typeof window.__touch === 'function', null, { timeout: 20000 })
      await page.evaluate((id) => window.__touch(id), installed[shot.save].careerId)
      await page.goto(`http://localhost:${PORT}/tools/film/endings-film.html`, { waitUntil: 'networkidle' })
      await page.waitForFunction(() => typeof window.__stage === 'object', null, { timeout: 30000 })
      await page.evaluate(() => document.fonts.ready.then(() => true))
      await page.evaluate(() => {
        window.__stage.panel(false)
        window.__stage.lit(true)
      })
      frame = await bootFrame(page)
      currentSave = shot.save
    }
    await goScreen(frame, shot.screen)
    await inFrame(frame, () => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined))
  }

  // ⭐ HER LINE IS QUOTED OFF THE SAVE, never typed here: `__install` read it out of the world's own
  // diary, where `resolveLeaving` wrote `leavingLine(door, temperament)`.
  const quote = shot.quoteFrom ? installed[shot.quoteFrom].line : ''
  if (shot.quoteFrom && !quote) throw new Error(`[${shot.key}] fixture ${shot.quoteFrom} carries no exit line`)
  await page.evaluate(
    ([cap, note, badge, q]) => {
      window.__stage.quote(q ?? '')
      window.__stage.caption(cap.length ? cap : [])
      window.__stage.note(note ?? '')
      window.__stage.badge(badge ?? '')
    },
    [shot.caption ?? [], shot.note ?? '', shot.badge ?? '', quote],
  )
  await wait(80)
  await page.evaluate(() => window.__stage.panel(true))
  await wait(340)

  // ⚠ THE CAPTION LANE IS A RULE, SO IT IS CHECKED. Two lines, inside the lane, never over the phone.
  const fit = await page.evaluate(() => {
    const lane = document.querySelector('.lane')
    const q = document.querySelector('.quote')
    if (q) {
      const lr = lane.getBoundingClientRect()
      const qr = q.getBoundingClientRect()
      return { lines: 0, rows: [], fits: qr.top >= lr.top - 1 && qr.bottom <= lr.bottom + 1, quote: true }
    }
    const el = document.querySelector('.cap')
    if (!el) return { lines: 0, rows: [], fits: true }
    const lh = parseFloat(getComputedStyle(el).fontSize) * 1.26
    const rows = Array.from(el.querySelectorAll('.cap-line')).map((n) => ({
      text: n.textContent,
      wrapped: n.getBoundingClientRect().height > lh * 1.35,
    }))
    const r = el.getBoundingClientRect()
    const l = lane.getBoundingClientRect()
    return { lines: rows.length, rows, fits: r.top >= l.top - 1 && r.bottom <= l.bottom + 1 }
  })
  if (fit.lines > 2) throw new Error(`[${shot.key}] the caption is ${fit.lines} lines – the brief allows two`)
  const wrapped = (fit.rows ?? []).filter((x) => x.wrapped)
  if (wrapped.length) throw new Error(`[${shot.key}] a caption line wrapped: ${JSON.stringify(wrapped.map((x) => x.text))}`)
  if (!fit.fits) throw new Error(`[${shot.key}] the caption is outside its lane`)

  const holdStart = (Date.now() - T0) / 1000
  await wait((shot.hold + 0.9) * 1000)
  marks.push({ key: shot.key, holdStart, hold: shot.hold, end: (Date.now() - T0) / 1000, caption: shot.caption ?? [], quote })
  shotLog.push({
    key: shot.key, save: shot.save ?? null, screen: shot.screen ?? (shot.logo ? `logo:${shot.logo}` : null),
    caption: shot.caption ?? [], note: shot.note ?? '', badge: shot.badge ?? '', quote,
    onScreen: shot.logo ? null : await inFrame(frame, () => document.body.innerText.replace(/\s+/g, ' ').slice(0, 320)),
  })
}

await page.evaluate(() => window.__stage.lit(false))
await wait(400)
const total = (Date.now() - T0) / 1000 - filmStart
step(`done – ${total.toFixed(2)}s recorded`)
fs.writeFileSync(`${OUT}/log.json`, JSON.stringify({ filmStart, total, marks, shots: shotLog, installed, stage: await page.evaluate(() => window.__stage.report()) }, null, 1))
clearTimeout(watchdog)
await ctx.close()
await browser.close()

console.log('\nbeats:')
for (const m of marks) console.log(`  ${m.key.padEnd(10)} hold from ${m.holdStart.toFixed(2)} for ${m.hold.toFixed(2)}s`)
console.log('\nscripted length:', SHOTS.reduce((n, s) => n + s.hold, 0).toFixed(2) + 's')
