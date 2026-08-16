// ⭐ THE HOME SEASON STRIP'S WRAP, MEASURED IN A REAL BROWSER – the evidence behind STRIP_MAX_RUNGS.
//
//   node tools/strip-wrap-probe.mjs
//
// ⚠ WHY IT EXISTS. `e2e/responsive.spec.ts` is the only thing that can catch this row wrapping, and
// it is a whole browser suite the owner runs. A cap chosen without a measurement is a guess, and this
// row has been re-tuned three times. Same shape and the same argument as `tools/header-probe.mjs`:
// serve the worktree statically, load a page that reproduces the strip markup against the app's REAL
// stylesheet and REAL self-hosted faces, and read the boxes off Chromium.
//
// ⚠ IT MEASURES CHIP ROWS, NOT THE SPEC'S HEADING-TO-HEADING NUMBER, and that is deliberate: the
// absolute figure depends on the card chrome around the row, while the REGRESSION is always a
// wrapped row. One row of chips is 29.4px, which is the 178.28 - 148.9 the spec's own note records.
//
// THE CONTAINER IS 315px at a 375px viewport: 375 - 2x16 (--app-pad-x on #app) - 2x14 (Card's own
// padding). `.app-content` adds none.
// measures the Home season strip's wrap at 375px with the real stylesheet and real fonts.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from '@playwright/test'

const ROOT = new URL('..', import.meta.url).pathname
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2', '.js': 'text/javascript' }
const server = createServer(async (req, res) => {
  try {
    const rel = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]))
    // the stylesheet asks for /fonts/*.woff2, which live in public/
    const path = rel.startsWith('/fonts/') ? join(ROOT, 'public', rel) : join(ROOT, rel)
    const body = await readFile(path)
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
    res.end(body)
  } catch { res.writeHead(404).end('no') }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
await page.goto(`http://127.0.0.1:${port}/tools/strip-wrap-probe.html`)
// ⚠ `document.fonts.ready` IS NOT ENOUGH WITH `font-display: swap`: the face is fetched on first
// USE, so the first measurement lands on the fallback and the second on Manrope. Render once, load
// the faces explicitly, then wait for readiness again – measured drift without this: ~6px a chip.
await page.evaluate(() => window.render([{ state: 'waiting', text: 'warm the face' }]))
await page.evaluate(async () => {
  await Promise.all([document.fonts.load('400 12px Manrope'), document.fonts.load('500 12px Manrope')])
  await document.fonts.ready
})

// The five capped chips on the e2e `junior` fixture (age 15, week 120), measured off the engine by
// tools/tmp-strip-width.ts. Order: leading ellipsis, five rungs, trailing ellipsis.
const ARMS = {
  BEFORE: [
    { gap: true },
    { state: 'unlocked', text: 'J60 · Enter your first!' },
    { state: 'unlocked', text: 'J300 · Enter your first!' },
    { state: 'waiting', text: 'W15 · Used 10 of 10' },
    { state: 'locked', text: 'W35 · 🔒 Opens at 16' },
    { state: 'locked', text: 'W50 · 🔒 Opens at 16' },
    { gap: true },
  ],
  AFTER: [
    { gap: true },
    { state: 'unlocked', text: 'J60 · Enter your first!' },
    { state: 'unlocked', text: 'J300 · Enter your first!' },
    { state: 'waiting', text: 'W15 · Used 10 of 10' },
    { state: 'waiting', text: 'W35 · Used 10 of 10' },
    { state: 'locked', text: 'W50 · 🔒 Opens in the top 330' },
    { gap: true },
  ],
}
const GAP = 8
function rows(widths, container) {
  let n = 1, x = 0
  for (const w of widths) {
    const add = x === 0 ? w : GAP + w
    if (x + add > container + 0.01) { n++; x = w } else { x += add }
  }
  return n
}
const measured = {}
for (const [name, cells] of Object.entries(ARMS)) {
  const widths = await page.evaluate((c) => window.render(c), cells)
  const total = widths.reduce((s, w) => s + w, 0) + GAP * (widths.length - 1)
  console.log(`\n${name}: ${widths.length} boxes, intrinsic row width ${total.toFixed(1)}px`)
  console.log('  widths: ' + widths.map((w) => w.toFixed(1)).join(' '))
  const flips = []
  for (let c = 260; c <= 375; c += 1) flips.push([c, rows(widths, c)])
  measured[name] = widths
  const twoAt = flips.find(([, r]) => r <= 2)
  console.log(`  rows at container 280/300/320/343/360: ` +
    [280, 300, 320, 343, 360].map((c) => `${c}=>${rows(widths, c)}`).join('  '))
  console.log(`  narrowest container that still fits in TWO rows: ${twoAt ? twoAt[0] : '>375'}px`)
}

// ⭐ THE COMPARISON THAT ACTUALLY DECIDES IT: is AFTER ever taller than BEFORE, at any width the
// phone could give this row? Absolute row counts depend on the card's inner width, which this probe
// does not know; the DELTA does not.
let worse = [], better = [], same = 0
for (let c = 240; c <= 375; c++) {
  const b = rows(measured.BEFORE, c), a = rows(measured.AFTER, c)
  if (a > b) worse.push(`${c}px (${b}->${a})`)
  else if (a < b) better.push(`${c}px (${b}->${a})`)
  else same++
}
console.log(`\nSWEEP 240..375px – AFTER vs BEFORE row count`)
console.log(`  same:   ${same} widths`)
console.log(`  BETTER: ${better.length} widths` + (better.length ? ` -> ${better[0]} .. ${better[better.length-1]}` : ''))
console.log(`  WORSE:  ${worse.length} widths` + (worse.length ? ` -> ${worse.join(', ')}` : '  <- none'))

// ⭐ WHAT CAP FITS: the same AFTER labels, trimmed from the BOTTOM as `stripVisible` trims, measured
// at the Home card's real inner width (375 - 2x16 app pad - 2x14 card pad = 315px).
const RUNGS = ARMS.AFTER.filter((c) => !c.gap)
for (const cap of [5, 4, 3, 2]) {
  const kept = RUNGS.slice(Math.max(0, RUNGS.length - cap))
  const cells = [{ gap: true }, ...kept, { gap: true }]
  const widths = await page.evaluate((c) => window.render(c), cells)
  const at = (w) => rows(widths, w)
  console.log(`  cap ${cap}: ${at(315)} rows at 315px  (300px: ${at(300)} · 320px: ${at(320)} · 343px: ${at(343)})   [${kept.map((k)=>k.text.split(' \u00b7')[0]).join(',')}]`)
}
await browser.close()
server.close()
