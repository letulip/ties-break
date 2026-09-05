// Film THREE RANKINGS, ONE CAREER. The rig plays its own timeline (with its own 300ms crossfades) and the
// recorder simply rolls through it, so the cut is one continuous window and no crossfade is ever
// split across a segment boundary.
//
// ⚠ CAPTURE, settled by measurement in the earlier films: Playwright records at CSS resolution 1:1.
// `deviceScaleFactor: 2` renders into the CORNER of the frame; `html{zoom:2}` breaks the phone media
// queries. `--force-device-scale-factor=2` is the one that works - innerWidth stays 414, the
// screencast lands at a native 828x1792, nothing upscales.
//
// ⚠ NOTHING IS CLICKED. The rig is driven through __filmPlay(), so no pointer ever appears.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || '/tmp/rankfilm'
const URL = process.argv[3] || 'http://localhost:5711'
fs.mkdirSync(OUT, { recursive: true })

const WATCHDOG_MS = Number(process.env.FILM_WATCHDOG_MS || 6 * 60 * 1000)
let lastStep = 'boot'
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: no completion - last step: ${lastStep}`)
  process.exit(3)
}, WATCHDOG_MS)

const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({
  viewport: { width: 414, height: 896 },
  recordVideo: { dir: OUT, size: { width: 828, height: 1792 } },
})
const page = await ctx.newPage()
const t0 = Date.now()
const stamp = () => (Date.now() - t0) / 1000
const step = (s) => { lastStep = s; console.log(`[${stamp().toFixed(1)}s] ${s}`) }
const log = []

step('goto rig')
await page.goto(`${URL}/tools/film/rank-film.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.__filmPlay === 'function', null, { timeout: 30000 })
await page.waitForTimeout(1200) // let the fonts and the first screen settle before rolling

const filmStart = stamp()
step('play')
await page.evaluate(() => window.__filmPlay())
const total = await page.evaluate(() => window.__filmTotal)
await page.waitForFunction(() => window.__filmDone === true, null, { timeout: 120000 })
const marks = await page.evaluate(() => window.__filmMarks)
const report = await page.evaluate(() => window.__filmReport)
log.push({ what: 'film', t: filmStart, end: filmStart + total })
for (const m of marks) log.push({ what: 'scene', key: m.key, t: filmStart + m.start, end: filmStart + m.end })
await page.waitForTimeout(500)

// --- the logo card: the app's own splash, filmed on load and used as the tail ---------------------
// Verified frame by frame in the earlier films: it ANIMATES - "Ties Break" paints first and
// "Ace Parent" is still easing in at 1.2s - so the card is entered early to buy the whole reveal.
step('splash')
const splashStart = stamp()
await page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4000)
log.push({ what: 'splash', t: splashStart, end: stamp() })

fs.writeFileSync(`${OUT}/log.json`, JSON.stringify({ marks: log, report, total }, null, 1))
clearTimeout(watchdog)
await ctx.close()
await browser.close()
console.log('film total:', total.toFixed(2) + 's', '| scenes:', marks.map((m) => m.key).join(' > '))
console.log('seed', report.seed, '| age', report.ageYears, '| nat', report.afterJ30.dom.points, 'pts | itf', report.afterJ30.itf.points, 'pts rank', report.afterJ30.itf.rank)
