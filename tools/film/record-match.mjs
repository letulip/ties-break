// Film a LIVE tournament match: the pre-match card, "Watch match", the speed ladder 1x -> 2x -> 4x,
// and the shout used with several different phrases.
//
// ── AUDIO IS RECONSTRUCTED, NOT RECORDED ───────────────────────────────────────────────────────
// Playwright's video has NO audio track, so "hear the intro" cannot come from the capture. Instead
// every sound the page plays is logged with its timestamp by wrapping `HTMLMediaElement.play`, and
// the assembler mixes the real files back in at those times. That catches everything `playSfx()`
// reaches for (take-your-seats, hits, ooh, out, applause, clicks) without touching app code.
//   ⚠ `playbackRate` IS CAPTURED TOO: sfx.ts speeds hits up with the match, so a hit logged at 2x
//     has to be re-timed on the way back in or it will not sound like the one on screen.
//   ⚠ THE APP'S OWN THEME IS EXCLUDED by the assembler. audio/music.ts plays theme.mp3 in-page, and
//     the assembler lays the same track down itself - mixing both would double it.
//
// ── LIVE, AND WHY THAT MATTERS ─────────────────────────────────────────────────────────────────
// The shout renders under `mode === 'live' && !finished`. TournamentFlow's "Watch match" sets
// `replayAdvances = true`, which passes `mode="live"` - so the shout IS available on this path.
// "Watch again" (post-match) sets it false and the control is gone, by owner ruling.
//
// ⚠ DEFAULT SPEED IS 2x (`FALLBACK_SPEED` in composables/matchDefaults.ts), so localStorage is
// seeded to 1 - the match must OPEN at 1x rather than be visibly clicked down to it.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || '/tmp/matchfilm'
const URL = process.argv[3] || 'http://localhost:5711'
const SPLASH_HOLD = 3600
const SWEEP_MS = 3000 + 620 + 500
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({
  viewport: { width: 414, height: 896 },
  recordVideo: { dir: OUT, size: { width: 828, height: 1792 } },
})
const page = await ctx.newPage()
await page.addInitScript(() => {
  try { localStorage.setItem('tb-match-speed', '1') } catch {}
  window.__sfx = []
  const proto = HTMLMediaElement.prototype
  const orig = proto.play
  proto.play = function () {
    try {
      window.__sfx.push({ src: this.currentSrc || this.src, t: performance.now(), rate: this.playbackRate || 1 })
    } catch (e) {}
    return orig.apply(this, arguments)
  }
})

const t0 = Date.now()
const stamp = () => (Date.now() - t0) / 1000
const log = []
const mark = (what, extra = {}) => log.push({ what, t: stamp(), ...extra })

const click = async (re, timeout = 1500) => {
  try { await page.locator('button', { hasText: re }).first().click({ timeout }); return true } catch { return false }
}
const dlgBtn = async (re, timeout = 2500) => {
  try { await page.locator('.dialog-overlay').locator('button', { hasText: re }).first().click({ timeout }); return true } catch { return false }
}
const OVERLAY = '.dialog-overlay, .tournament-flow'
async function clearOverlays() {
  for (let i = 0; i < 5; i++) {
    if (!(await page.locator(OVERLAY).count())) return true
    const gift = page.locator('.birthday-choice').first()
    if (await gift.count()) { await gift.click({ timeout: 800 }).catch(() => {}); await page.waitForTimeout(300); continue }
    if (await click(/^(Book it|Proceed to Home|Continue|Close|Done|Got it|Cancel)$/, 500)) { await page.waitForTimeout(250); continue }
    const x = page.locator('.replay-close, [title="Close"]').first()
    if (await x.count()) { await x.click({ timeout: 500 }).catch(() => {}); await page.waitForTimeout(250); continue }
    await page.keyboard.press('Escape'); await page.waitForTimeout(250)
  }
  return !(await page.locator(OVERLAY).count())
}
/** The week CTA, found structurally - labels are not enumerable (see record-weeks.mjs). */
async function advanceWeek() {
  const btns = page.locator('button'); const n = await btns.count()
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i); const t = (await b.innerText().catch(() => '')).trim()
    if (!t || /^(Season|Calendar|Home|Stats|Trophies|\?)$/.test(t)) continue
    if (/W\d+\s*'\d\d/.test(t) || /^(Practice|Vacation|Booked)$/.test(t)) continue
    if (!(await b.isEnabled().catch(() => false))) continue
    if (await b.click({ timeout: 900 }).then(() => true).catch(() => false)) return t
  }
  return ''
}

// --- open --------------------------------------------------------------------------------------
await page.goto(URL, { waitUntil: 'networkidle' })
const perfAt = await page.evaluate(() => performance.now())
const videoAt = stamp() // the video second that `perfAt` corresponds to - the sfx clock's anchor
await page.waitForTimeout(SPLASH_HOLD)
log.push({ what: 'splash', t: 0.25, end: stamp() })
await page.locator('.splash').click()
await page.waitForTimeout(900)
await click(/Skip for now/, 5000)
await page.waitForTimeout(1200)
for (let i = 0; i < 10; i++) {
  if (!(await page.locator('text=Skip tour').count())) break
  if (!(await click(/^Skip tour$/, 700))) await page.mouse.click(207, 700)
  await page.waitForTimeout(400)
}
if (await page.locator('text=Skip tour').count()) throw new Error('tour still up')

// --- enter a Local Open, then walk to its week ---------------------------------------------------
await click(/^Season$/, 3000)
await page.waitForTimeout(1000)
if (!(await click(/^\s*Enter\s*$/, 2500))) throw new Error('no Enter button on the season screen')
await page.waitForTimeout(700)
// ⚠ SCOPE THE CONFIRM TO THE DIALOG: the event card behind it carries its own "Enter", and a
// page-wide .first() picks that one - the dialog stays up and nothing is entered.
if (!(await dlgBtn(/Enter|Push through/))) throw new Error('entry confirm did not take')
await page.waitForTimeout(900)
await clearOverlays()
await click(/^Calendar$/, 2000)
await page.waitForTimeout(800)

let reached = false
for (let i = 0; i < 10 && !reached; i++) {
  const cta = await advanceWeek()
  if (!cta) { await clearOverlays(); await click(/^Calendar$/, 700); await page.waitForTimeout(400); continue }
  await page.waitForTimeout(SWEEP_MS)
  await page.waitForTimeout(700)
  if (await page.locator('button', { hasText: /Watch match/ }).count()) { reached = true; break }
  await clearOverlays()
  await click(/^Calendar$/, 700)
  await page.waitForTimeout(500)
}
if (!reached) throw new Error('never reached a pre-match card')

// --- the tournament card, then the match ---------------------------------------------------------
await page.waitForTimeout(700)
mark('tournament')
await page.waitForTimeout(3600) // hold on the pre-match card, music up

await page.locator('button', { hasText: /Watch match/ }).first().click({ timeout: 3000 })
mark('watch')
await page.waitForTimeout(6200) // 1x - the take-your-seats beat and the first rallies

const speedPill = (label) => page.locator('.mv-seg').locator('button', { hasText: label }).first()
async function setSpeed(label, what) {
  const p = speedPill(label)
  if (await p.count()) { await p.click({ timeout: 1500 }).catch(() => {}); mark(what) }
}
async function shout(phrase, what) {
  const sel = page.locator('select.mv-shout-pick').first()
  if (!(await sel.count())) return false
  await sel.selectOption(phrase).catch(() => {})
  await page.waitForTimeout(450)
  await page.locator('button.mv-shout-go').first().click({ timeout: 1500 }).catch(() => {})
  mark(what, { phrase })
  return true
}

await setSpeed('2×', 'speed2')
await page.waitForTimeout(2600)
await shout('Take your time.', 'shout1')
await page.waitForTimeout(2600)

await setSpeed('4×', 'speed4')
await page.waitForTimeout(2400)
await shout('I saw that.', 'shout2')
await page.waitForTimeout(3000)
await shout('Enjoy it.', 'shout3')
await page.waitForTimeout(4000)
await shout('Drink something.', 'shout4')
await page.waitForTimeout(6000)

mark('end')
const sfx = await page.evaluate(() => window.__sfx)
fs.writeFileSync(`${OUT}/log.json`, JSON.stringify({ marks: log, sfx, perfAt, videoAt }, null, 1))
await ctx.close()
await browser.close()

const kinds = {}
for (const e of sfx) { const k = (e.src.split('/').pop() || '').replace('.mp3', ''); kinds[k] = (kinds[k] || 0) + 1 }
console.log('marks:', log.map((m) => `${m.what}@${m.t.toFixed(1)}`).join(' '))
console.log('sfx events:', sfx.length, JSON.stringify(kinds))
