// R17 #9 – MEASURE THE HEADER BEFORE COMMITTING TO IT (the brief's own instruction).
// Serves the worktree statically, loads tools/header-probe.html at 375x667 in the real Chromium
// with the app's real self-hosted faces, and reports the two numbers the item turns on:
// the vertical pixels the one-line header buys, and whether the longest strings still fit.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
// `@playwright/test` is the declared devDependency (playwright.config.ts's own), and it re-exports
// the browser launchers - so this reaches for the package the repo actually pins rather than the
// transitive `playwright` underneath it.
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

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 375, height: 667 } })
await page.goto(`http://127.0.0.1:${port}/tools/header-probe.html`)
await page.evaluate(() => document.fonts.ready)

const out = await page.evaluate(() => {
  const box = (id) => document.getElementById(id).getBoundingClientRect()
  const rulerTitle = document.getElementById('ruler-title')
  const rulerMeta = document.getElementById('ruler-meta')
  const widthOf = (el, text) => {
    el.textContent = text
    return +el.getBoundingClientRect().width.toFixed(1)
  }
  // ⚠ THE HEADER'S OWN NAMES, i.e. `shortTierLabel`'d (owner, R17 #9: "Championship" comes off in
  // the header). The three that lose a word are the three that have a generic one.
  const TIERS = [
    'Local', 'Regional', 'National',
    'Junior Tour 30', 'Junior Tour 60', 'Junior Tour 300',
    'World Tour 15', 'World Tour 35', 'World Tour 50', 'World Tour 75', 'World Tour 100',
    'WTA 125', 'WTA 250', 'WTA 500', 'WTA 1000', 'Grand Slam',
  ]
  const ROUNDS = ['Final', 'Semifinal', 'Quarterfinal', 'Round of 16', 'Round of 32', 'Round of 64', 'Round of 128']
  const SHORT = ['F', 'SF', 'QF', 'R16', 'R32', 'R64', 'R128']
  return {
    before: box('before').height,
    after: box('after').height,
    exitW: box('exit-after').width,
    exitH: box('exit-after').height,
    headlineH: box('headline').height,
    afterTitleW: box('after-title').width,
    titleEllipsised: document.getElementById('after-title').scrollWidth > document.getElementById('after-title').clientWidth + 0.5,
    tierWidths: TIERS.map((t) => [t, widthOf(rulerTitle, t)]),
    weekWidth: widthOf(rulerMeta, "W36 '35"),
    roundWidths: ROUNDS.map((r) => [r, widthOf(rulerMeta, r)]),
    shortWidths: SHORT.map((r) => [r, widthOf(rulerMeta, r)]),
  }
})

console.log('viewport 375x667, real Sora/Manrope')
console.log(`header BEFORE (title + sub line, 24px gutter): ${out.before.toFixed(2)}px`)
console.log(`header AFTER  (one line, 16px gutter)        : ${out.after.toFixed(2)}px`)
console.log(`DELTA (vertical pixels bought)               : ${(out.before - out.after).toFixed(2)}px`)
console.log(`headline row height ${out.headlineH.toFixed(2)}px, exit control ${out.exitW.toFixed(1)}x${out.exitH.toFixed(1)}px`)
console.log(`title box after ellipsis: ${out.afterTitleW.toFixed(1)}px, ellipsised: ${out.titleEllipsised}`)

const room = 375 - 32 - out.exitW - 12 // 16px gutter each side, .tf-top's 12px gap
console.log(`\nroom for the headline at a 16px gutter: ${room.toFixed(1)}px`)
console.log('\ntier label widths @17px/600 Sora:')
for (const [t, w] of out.tierWidths) console.log(`  ${t.padEnd(24)} ${w}`)
console.log(`\nweek label "W36 '35" @11.5px : ${out.weekWidth}`)
console.log('round labels @11.5px, full vs the draw\'s own short form:')
for (let i = 0; i < out.roundWidths.length; i++) {
  console.log(`  ${out.roundWidths[i][0].padEnd(14)} ${String(out.roundWidths[i][1]).padStart(6)}   ${out.shortWidths[i][0].padEnd(5)} ${out.shortWidths[i][1]}`)
}

const worstTier = Math.max(...out.tierWidths.map(([, w]) => w))
const worstRound = Math.max(...out.roundWidths.map(([, w]) => w))
const worstShort = Math.max(...out.shortWidths.map(([, w]) => w))
console.log(`\nWORST LINE, full round labels : ${(worstTier + 8 + out.weekWidth + 8 + worstRound).toFixed(1)}px vs ${room.toFixed(1)}px  ${worstTier + 16 + out.weekWidth + worstRound <= room ? 'FITS' : 'OVER'}`)
console.log(`WORST LINE, short round labels: ${(worstTier + 8 + out.weekWidth + 8 + worstShort).toFixed(1)}px vs ${room.toFixed(1)}px  ${worstTier + 16 + out.weekWidth + worstShort <= room ? 'FITS' : 'OVER'}`)

await browser.close()
server.close()
