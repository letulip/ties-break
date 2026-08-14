// RUNOFF-PROBE – does the counter under the court still fit a phone after the word changed?
//
// ⚠ WHY THIS EXISTS AND NOT AN ARGUMENT. `CLAUDE.md`'s fourth gotcha is the one I earned in round
// 20: a reading grows one honest word at a time and nothing in the suite ever objects until it is
// wider than the screen. `.mv-runoff`'s own comment carries a MEASUREMENT of its tolerance - "the
// widest score the band can hold is '196 points' at ~85px, which is ~205px of a ~279px band on a
// 375pt phone" - and 14.08 made that string "196 points played". So the number in that comment has
// to be re-taken rather than reasoned about.
//
// It is `tools/header-probe.mjs`'s idiom, and deliberately the same one: serve the worktree, load a
// probe page at 375x667 in the real Chromium with the app's real self-hosted faces, measure.
//
// ⚠ THE TWO RULES ARE COPIED VERBATIM FROM MatchViewer.vue's <style> BLOCK and nowhere else. They
// are SFC-scoped, so no stylesheet can be linked for them; copying is the only honest option and
// the copy is marked so a future edit knows it has a second home. Everything else (the faces, the
// body font, the 375px width) is the app's own.
//
//   node tools/runoff-probe.mjs
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from '@playwright/test'

const ROOT = new URL('..', import.meta.url).pathname
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.js': 'text/javascript' }

const server = createServer(async (req, res) => {
  try {
    const path = join(ROOT, normalize(decodeURIComponent((req.url ?? '/').split('?')[0])))
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404).end('no')
  }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port

// The longest reading the band can ever hold. A five-set major cannot happen (best of three), so the
// ceiling is a long three-setter: the owner's own screenshot is 227, and `match-retirement.test.ts`
// puts FATIGUE_START at 120 points with retirements deep beyond it – 400 is comfortably past both
// and is here so the answer is a bound rather than a sample.
const READINGS = ['91 points played', '163 points played', '227 points played', '400 points played']

const page = await (await chromium.launch()).newPage({ viewport: { width: 375, height: 667 } })
await page.setContent(`<!doctype html><html><head>
<link rel="stylesheet" href="http://127.0.0.1:${port}/src/style.css">
<style>
  @font-face { font-family: 'Manrope'; font-weight: 400; src: url('http://127.0.0.1:${port}/public/fonts/manrope-400.woff2') format('woff2'); }
  @font-face { font-family: 'Manrope'; font-weight: 500; src: url('http://127.0.0.1:${port}/public/fonts/manrope-500.woff2') format('woff2'); }
  body { margin: 0; font: 15px/1.45 var(--font-body); }
  /* ⚠ THE COURT IS NOT THE SCREEN. The app container is 375 - 2 x --app-pad-x (16px) = 343px, and
     the card the court sits in insets further. The narrow row below reproduces the ~279px band the
     shipped comment measured, so the verdict is a BOUND rather than one convenient width. */
  .court { position: relative; width: 343px; height: 120px; }
  .court.narrow { width: 299px; }

  /* ===== VERBATIM FROM MatchViewer.vue - keep in step with it ===== */
  .mv-runoff {
    position: absolute; left: 10px; right: 10px; bottom: 6px;
    display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: baseline; gap: 8px; pointer-events: none;
  }
  .mv-score { grid-column: 2; grid-row: 1; text-align: center; font-size: 15px; font-weight: 700; line-height: 1; letter-spacing: 0.01em; }
  .mv-speed { grid-row: 1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: clip; }
  .mv-speed.left { grid-column: 1; text-align: left; }
  /* ===== end verbatim ===== */
</style></head><body>
${READINGS.map(
  (r, i) => `<div class="court${i >= READINGS.length / 2 ? ' narrow' : ''}" id="c${i}">
      <div class="mv-runoff">
        <span class="mv-speed num left">198<i>km/h</i></span>
        <span class="mv-score num">${r}</span>
      </div>
    </div>`,
).join('')}
</body></html>`)
await page.evaluate(() => document.fonts.ready)

const rows = await page.evaluate((n) => {
  const out = []
  for (let i = 0; i < n; i++) {
    const band = document.querySelector(`#c${i} .mv-runoff`)
    const score = document.querySelector(`#c${i} .mv-score`)
    const speed = document.querySelector(`#c${i} .mv-speed`)
    const b = band.getBoundingClientRect()
    const s = score.getBoundingClientRect()
    const v = speed.getBoundingClientRect()
    out.push({
      text: score.textContent,
      band: Math.round(b.width),
      score: Math.round(s.width),
      speed: Math.round(v.width),
      // The two failures worth naming: the reading spilling past the band, and it colliding with
      // the serve-speed reading at the left end (which only exists mid-rally, but must still hold).
      overflows: s.right > b.right + 0.5 || s.left < b.left - 0.5,
      collides: s.left < v.right - 0.5,
      centred: Math.abs((s.left + s.right) / 2 - (b.left + b.right) / 2) < 1,
    })
  }
  return out
}, READINGS.length)

console.log(`runoff-probe · 375x667 · the app's real faces · band = the shipped .mv-runoff grid\n`)
console.log('reading                    band   score   speed   fits   clear of speed   centred')
for (const r of rows) {
  console.log(
    `  ${r.text.padEnd(24)}${String(r.band).padStart(5)}px${String(r.score).padStart(7)}px${String(r.speed).padStart(7)}px` +
      `${(r.overflows ? '  NO ' : '  yes').padStart(7)}${(r.collides ? '  NO ' : '  yes').padStart(16)}${(r.centred ? '  yes' : '  no').padStart(10)}`,
  )
}
const bad = rows.filter((r) => r.overflows || r.collides)
console.log(`\n  verdict: ${bad.length === 0 ? 'OK – every reading fits the band and clears the speed' : `⚠ ${bad.length} reading(s) do not fit`}`)

await page.context().browser().close()
server.close()
process.exit(bad.length === 0 ? 0 : 1)
