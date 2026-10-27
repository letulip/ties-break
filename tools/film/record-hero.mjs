// Film the HERO screen across all five portrait bands, then the logo card.
//
// ⚠ CAPTURE, settled by measurement in the weeks film and unchanged here: Playwright records at CSS
// resolution 1:1. `deviceScaleFactor: 2` renders the page into the CORNER of the frame and pads the
// rest grey; `html{zoom:2}` fills it but makes `matchMedia('(min-width:768px)')` true against a
// 414px layout. The BROWSER flag `--force-device-scale-factor=2` is the one that works: innerWidth
// stays 414, the screencast lands at a native 828x1792, and nothing upscales.
//
// ⚠ PLAYBACK IS DRIVEN, NOT AWAITED. The rig does not auto-start (an rAF loop begun on mount ran to
// completion while the tab was busy, and the first check caught setup 1 frozen at age 23). This
// calls __filmPlay() when the recorder is actually rolling and reads __filmMarks back for the cut,
// so no segment boundary is ever guessed.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || "/tmp/herofilm"
const URL = process.argv[3] || 'http://localhost:5711'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({
  viewport: { width: 414, height: 896 },
  recordVideo: { dir: OUT, size: { width: 828, height: 1792 } },
})
const page = await ctx.newPage()
const t0 = Date.now()
const stamp = () => (Date.now() - t0) / 1000
const log = []

await page.goto(`${URL}/tools/film/hero-film.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.__filmPlay === 'function', null, { timeout: 15000 })
await page.waitForTimeout(900) // a beat on the first contour before anything moves

const filmStart = stamp()
await page.evaluate(() => window.__filmPlay())
const plan = await page.evaluate(() => window.__filmPlan)
await page.waitForFunction(() => window.__filmDone === true, null, { timeout: 120000 })
const marks = await page.evaluate(() => window.__filmMarks)
for (const m of marks) {
  log.push({ what: 'tier', index: m.index, tier: `${m.band} (${m.age})`, t: filmStart + m.start, end: filmStart + m.end })
}
await page.waitForTimeout(400)

// --- the logo card: the app's REAL splash, filmed on load and used as the tail -------------------
// Verified frame by frame in the weeks film: it is an ANIMATION – "Ties Break" paints first and
// "Ace Parent" is still easing in at 1.2s – so the card is entered early to buy the whole reveal.
const splashStart = stamp()
await page.goto(`${URL}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(4200)
log.push({ what: 'splash', t: splashStart, end: stamp() })

fs.writeFileSync(`${OUT}/log.json`, JSON.stringify(log, null, 1))
await ctx.close()
await browser.close()
console.log('bands:', marks.length, '| hold:', plan.hold + 's', '| film ends', stamp().toFixed(1) + 's')
for (const m of marks) console.log('  ', m.index, m.band, 'age', m.age)
