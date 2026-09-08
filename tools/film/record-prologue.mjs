// Film THE NINE YEARS BEFORE THE CAREER BEGINS – 1080x1080, two real childhoods side by side.
//
// ⚠ CAPTURE. The earlier vertical films settled this by measurement: Playwright records at CSS
// resolution 1:1, `deviceScaleFactor: 2` on the context renders into the CORNER of the frame, and
// `html{zoom:2}` on the TOP-LEVEL document breaks the phone media queries. The browser flag
// `--force-device-scale-factor=2` is the one that works. Here the stage is 1080 CSS px square, so
// the flag lands a 2160x2160 screencast and the assembler halves it – a supersampled 1080, which is
// worth having on a frame this dense with 14px type.
//
// ⚠ THE `zoom` INSIDE THE FRAMES IS A DIFFERENT LEVER AND IT IS SAFE. Each phone document sets root
// `zoom` and the stage sizes the element to match, so the LAYOUT BOX stays 414 CSS px while the
// raster scale moves. The guard below is not decoration: if either frame ever reports
// `matchMedia('(min-width: 768px)')` true, the film is shooting desktop CSS on a phone layout and
// the take is thrown away rather than shipped.
//
// ⚠ NOTHING IS CLICKED FROM OUT HERE. The rig drives both frames itself through `__filmPlay()`, so
// no pointer ever appears in shot.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || '/tmp/prologuefilm'
const URL = process.argv[3] || 'http://localhost:5841'
fs.mkdirSync(OUT, { recursive: true })

const WATCHDOG_MS = Number(process.env.FILM_WATCHDOG_MS || 8 * 60 * 1000)
let lastStep = 'boot'
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: no completion – last step: ${lastStep}`)
  process.exit(3)
}, WATCHDOG_MS)

const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({
  viewport: { width: 1080, height: 1080 },
  recordVideo: { dir: OUT, size: { width: 2160, height: 2160 } },
})
const page = await ctx.newPage()
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))

const t0 = Date.now()
const stamp = () => (Date.now() - t0) / 1000
const step = (s) => {
  lastStep = s
  console.log(`[${stamp().toFixed(1)}s] ${s}`)
}

step('goto rig')
await page.goto(`${URL}/tools/film/prologue-film.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.__filmPlay === 'function' && window.__filmReady?.(), null, { timeout: 45000 })
await page.waitForTimeout(1800) // fonts, art and both worker boots settle before the first frame

const seeds = await page.evaluate(() =>
  Array.from(document.querySelectorAll('iframe')).map((el) => el.contentWindow.__phone.seed()),
)
step(`seeds ${JSON.stringify(seeds)}`)
if (seeds[0] !== seeds[1]) {
  console.error('REFUSED: the two halves are different childhoods')
  process.exit(2)
}

const filmStart = stamp()
step('play')
await page.evaluate(() => window.__filmPlay())
const total = await page.evaluate(() => window.__filmTotal)
await page.waitForFunction(() => window.__filmDone === true, null, { timeout: 180000 })
const marks = await page.evaluate(() => window.__filmMarks)
const report = await page.evaluate(() => window.__filmReport)
step('done')
await page.waitForTimeout(600)

for (const which of ['probeA', 'probeB']) {
  const p = report[which]
  if (!p || p.desktopArm) {
    console.error(`REFUSED: ${which} reports the desktop media arm live –`, JSON.stringify(p))
    process.exit(2)
  }
}
if (!report.sameSeed) {
  console.error('REFUSED: seeds diverged during the run')
  process.exit(2)
}

fs.writeFileSync(
  `${OUT}/log.json`,
  JSON.stringify({ filmStart, total, marks: marks.map((m) => ({ ...m, start: filmStart + m.start, end: filmStart + m.end })), report }, null, 1),
)
clearTimeout(watchdog)
await ctx.close()
await browser.close()

const sa = report.snapA
const sb = report.snapB
const ceilings = (s) => JSON.stringify((s?.radar ?? []).map((r) => [r.ceilingLo, r.ceilingHi]))
console.log('\nfilm total', total.toFixed(2) + 's | starts at', filmStart.toFixed(2) + 's in the recording')
console.log('beats:', marks.map((m) => m.key).join(' > '))
console.log('career seed A', sa?.seed, '| B', sb?.seed, '| same:', sa?.seed === sb?.seed)
console.log('band A', sa?.handoverBand, '/', sa?.handoverBaseBand, '| B', sb?.handoverBand, '/', sb?.handoverBaseBand)
console.log('spent A', report.runA && '$' + (0).toFixed(0), '| funds A', sa?.fundsCents, 'B', sb?.fundsCents)
console.log('coach tier A', sa?.profile?.coachTier, '| B', sb?.profile?.coachTier, '| style', sa?.profile?.playStyle, '/', sb?.profile?.playStyle)
console.log('B opens:', (report.runB?.opens ?? []).map((o) => `${o.age}:${o.outcome}`).join(' '))
console.log('radar ceilings identical (fogged):', ceilings(sa) === ceilings(sb))
