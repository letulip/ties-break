// Drive the stage once with no video and photograph every beat, so a broken walk costs a minute
// rather than a take. Exits non-zero on the first thing that is not what the film claims.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || '/tmp/prologue-stills'
const URL = process.argv[3] || 'http://localhost:5841'
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1080 } })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message))
page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE:', m.text()) })

await page.goto(`${URL}/tools/film/prologue-film.html`, { waitUntil: 'networkidle' })
await page.waitForFunction(() => typeof window.__filmPlay === 'function' && window.__filmReady?.(), null, { timeout: 30000 })
await page.waitForTimeout(1500)

const probe = await page.evaluate(() => {
  const f = document.querySelectorAll('iframe')
  return Array.from(f).map((el) => el.contentWindow.__phone.probe())
})
console.log('probe:', JSON.stringify(probe))

const seeds = await page.evaluate(() => Array.from(document.querySelectorAll('iframe')).map((el) => el.contentWindow.__phone.seed()))
console.log('seeds:', JSON.stringify(seeds))
if (seeds[0] !== seeds[1]) { console.error('SEEDS DIFFER'); process.exit(2) }

await page.evaluate(() => window.__filmPlay())
const total = await page.evaluate(() => window.__filmTotal)
console.log('film total', total.toFixed(2), 's')

// photograph the middle of each beat, keyed off the rig's own beat marker so a still is never
// caught inside a dip
let shot = 0
const seen = new Set()
const t0 = Date.now()
while (Date.now() - t0 < (total + 12) * 1000) {
  const beat = await page.evaluate(() => window.__filmBeat)
  const done = await page.evaluate(() => window.__filmDone)
  if (beat && !seen.has(beat)) {
    seen.add(beat)
    await page.waitForTimeout(Number(process.env.SHOT_AT || 420))
    const st = await page.evaluate(() => ({
      eyebrow: document.querySelector('.eyebrow')?.textContent ?? '',
      cap: Array.from(document.querySelectorAll('.cap')).map((n) => n.textContent).join(' / '),
      a: document.querySelectorAll('iframe')[0]?.contentWindow?.__phone?.state?.() ?? null,
      b: document.querySelectorAll('iframe')[1]?.contentWindow?.__phone?.state?.() ?? null,
    }))
    await page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, '0')}-${beat}.png` })
    console.log(`  ${String(shot).padStart(2, '0')} ${beat.padEnd(9)} ${st.eyebrow || '-'} | A ${st.a?.age}${st.a?.handover ? ' HANDOVER' : ''} | B ${st.b?.age}${st.b?.open ? ' OPEN' : ''}${st.b?.result ? ' RESULT' : ''}${st.b?.handover ? ' HANDOVER' : ''} | "${st.cap}"`)
  }
  if (done) break
  await page.waitForTimeout(120)
}

const tr = await page.evaluate(() => window.__filmTrace)
console.log('\nTRACE:'); for (const line of tr) console.log('  ' + line)
const report = await page.evaluate(() => window.__filmReport)
const sa = report.snapA, sb = report.snapB
const axes = (s) => (s?.radar ?? []).map((r) => `${r.key}:${r.shownValue.toFixed(2)}/${r.ceilingLo.toFixed(2)}-${r.ceilingHi.toFixed(2)}`).join(' ')
console.log('\n── the two careers ──')
console.log('  seed   A', sa?.seed, '| B', sb?.seed, '| same:', sa?.seed === sb?.seed)
console.log('  band   A', sa?.handoverBand, '/', sa?.handoverBaseBand, '| B', sb?.handoverBand, '/', sb?.handoverBaseBand)
console.log('  funds  A', sa?.fundsCents, '| B', sb?.fundsCents)
console.log('  coach  A', sa?.profile?.coachTier, '| B', sb?.profile?.coachTier, '| style A', sa?.profile?.playStyle, 'B', sb?.profile?.playStyle)
console.log('  axes A', axes(sa))
console.log('  axes B', axes(sb))
console.log('  ceilings identical:', JSON.stringify((sa?.radar ?? []).map((r) => [r.ceilingLo, r.ceilingHi])) === JSON.stringify((sb?.radar ?? []).map((r) => [r.ceilingLo, r.ceilingHi])))
console.log('\nRUN A', JSON.stringify(report.runA?.picks), 'entries', JSON.stringify(report.runA?.entries))
console.log('RUN B', JSON.stringify(report.runB?.picks), 'entries', JSON.stringify(report.runB?.entries), 'opens', JSON.stringify((report.runB?.opens ?? []).map((o) => `${o.age}:${o.outcome}`)))
await browser.close()
