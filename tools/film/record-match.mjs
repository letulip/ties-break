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
const SEEDNUM = Number(process.argv[4] || 1)
const SEASONS = Number(process.argv[5] || 0)
await page.addInitScript((s) => {
  try { localStorage.setItem('tb-match-speed', '1') } catch (e) {}
  // ⚠ THE CAREER SEED IS UI-SIDE RANDOMNESS: stores/game.ts turns an empty seed into
  // `${kidName}-${Math.random()...}`. The ENGINE never calls Math.random (CLAUDE.md invariant 2),
  // so fixing it here makes the whole career reproducible - which is what lets a match she WINS be
  // found once and then filmed on purpose - without touching engine determinism.
  let x = (s >>> 0) || 1
  Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296 }
  window.__sfx = []
  const proto = HTMLMediaElement.prototype
  const orig = proto.play
  proto.play = function () {
    try {
      window.__sfx.push({ src: this.currentSrc || this.src, t: performance.now(), rate: this.playbackRate || 1 })
    } catch (e) {}
    return orig.apply(this, arguments)
  }
}, SEEDNUM)

const t0 = Date.now()
const stamp = () => (Date.now() - t0) / 1000
const log = []

// ⚠ A WATCHDOG, BECAUSE A TAKE ONCE HUNG FOR 78 MINUTES AT 0% CPU AND SAID NOTHING. Every Playwright
// call here is individually bounded, so the hang was somewhere between them - which is exactly the
// case a per-call timeout cannot cover. Bound the WHOLE run instead, and narrate each step so a
// stall names itself.
const WATCHDOG_MS = Number(process.env.FILM_WATCHDOG_MS || 9 * 60 * 1000)
const watchdog = setTimeout(() => {
  console.error(`WATCHDOG: no completion after ${(WATCHDOG_MS / 1000).toFixed(0)}s - last step: ${lastStep}`)
  process.exit(3)
}, WATCHDOG_MS)
let lastStep = 'boot'
const step = (s) => {
  lastStep = s
  console.log(`[${stamp().toFixed(1)}s] ${s}`)
}
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
step('goto')
await page.goto(URL, { waitUntil: 'networkidle' })
const perfAt = await page.evaluate(() => performance.now())
const videoAt = stamp() // the video second that `perfAt` corresponds to - the sfx clock's anchor
await page.waitForTimeout(SPLASH_HOLD)
log.push({ what: 'splash', t: 0.25, end: stamp() })
step('splash tap')
await page.locator('.splash').click()
await page.waitForTimeout(900)

// --- name her, through the real wizard -----------------------------------------------------------
// ⚠ SOME WIZARD STEPS WILL NOT LET YOU PAST UNTIL A CHOICE IS MADE (the country list is one) and on
// those "Next" is simply not clickable, so a Next-only walk stops dead on screen 2.
step('wizard: Begin')
await click(/Begin/, 5000)
await page.waitForTimeout(900)
await page.fill('#ob-first', 'Alice').catch(() => {})
await page.fill('#ob-last', 'Martin').catch(() => {})
await page.waitForTimeout(300)
const tryNext = () => page.locator('button', { hasText: /^\s*Next\s*$/ }).first().click({ timeout: 1800 }).then(() => true).catch(() => false)
let started = false
for (let i = 0; i < 14; i++) {
  if (await page.locator('button', { hasText: /Start career/ }).count()) {
    await page.locator('button', { hasText: /Start career/ }).first().click({ timeout: 3000 })
    started = true
    break
  }
  let ok = await tryNext()
  if (!ok) {
    await page.locator('button').filter({ hasNotText: /Back|Next|Start career/ }).first().click({ timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(350)
    ok = await tryNext()
  }
  if (!ok) break
  await page.waitForTimeout(450)
}
step('wizard: started=' + started)
if (!started) throw new Error('the onboarding wizard did not finish')
await page.waitForTimeout(1800)
for (let i = 0; i < 10; i++) {
  if (!(await page.locator('text=Skip tour').count())) break
  if (!(await click(/^Skip tour$/, 700))) await page.mouse.click(207, 700)
  await page.waitForTimeout(400)
}
await clearOverlays()

// --- optional: grow her with the dev control -------------------------------------------------------
// ⚠ DEFAULT IS ZERO SEASONS, AND THAT IS A FINDING. `game.tick(52)` blocks the page for minutes
// while it simulates, and every Playwright query queues behind it - a take sat at 0% CPU for 78
// minutes on this exact call before a watchdog pinned it. Strength comes from the DRAW instead:
// probe-seed.mjs searches career seeds for a first round she wins (seed 6 beats a #76 at 13).
if (SEASONS > 0) {
  await click(/^Home$/, 2000)
  await page.waitForTimeout(700)
  await page.locator('[aria-label="Settings"]').first().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(1000)
  step('More > Saves')
  await click(/^\s*Saves\s*$/, 2500)
  await page.waitForTimeout(800)
  const devBtn = () => page.locator('button', { hasText: /52 \(dev\)/ }).first()
  async function devTick() {
    await clearOverlays()
    for (let i = 0; i < 40; i++) { if (await devBtn().isEnabled().catch(() => false)) break; await page.waitForTimeout(500) }
    const ok = await devBtn().click({ timeout: 3000 }).then(() => true).catch(() => false)
    for (let i = 0; i < 80; i++) {
      await page.waitForTimeout(500)
      await clearOverlays()
      if (await devBtn().isEnabled().catch(() => false)) break
    }
    return ok
  }
  let seasons = 0
  for (let s = 0; s < SEASONS; s++) { step(`dev tick ${s + 1}/${SEASONS}`); if (await devTick()) seasons++ }
  console.log('seasons fast-forwarded:', seasons)
}

// --- enter a Local Open, then walk to its week ---------------------------------------------------
step('enter a Local Open')
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

// ⚠ TWO SCREENS, NOT ONE, AND THE CLIP OPENS ON THE FIRST. Playing a tournament week lands on the
// BRIEFING - the venue, the surface, the dates - and only its "Begin" opens the pre-match card with
// the full-height painting. The previous cut opened on the second and skipped the location entirely.
let atBriefing = false
for (let i = 0; i < 12 && !atBriefing; i++) {
  const cta = await advanceWeek()
  if (!cta) { await clearOverlays(); await click(/^Calendar$/, 700); await page.waitForTimeout(400); continue }
  await page.waitForTimeout(SWEEP_MS)
  await page.waitForTimeout(700)
  if (await page.locator('button', { hasText: /^\s*Begin\s*$/ }).count()) { atBriefing = true; break }
  if (await page.locator('button', { hasText: /Watch match/ }).count()) { atBriefing = true; break }
  await clearOverlays()
  await click(/^Calendar$/, 700)
  await page.waitForTimeout(500)
}
step('briefing reached')
if (!atBriefing) throw new Error('never reached the tournament briefing')

// --- the briefing (where the tournament IS), then the pre-match card ------------------------------
await page.waitForTimeout(600)
mark('briefing')
await page.waitForTimeout(3400) // hold on the venue, music up
if (await page.locator('button', { hasText: /^\s*Begin\s*$/ }).count()) {
  await page.locator('button', { hasText: /^\s*Begin\s*$/ }).first().click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(900)
}
mark('tournament')
await page.waitForTimeout(3400) // hold on the full-height card, music still up

step('watch match')
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
await page.waitForTimeout(4000)

// ⚠ WAIT FOR THE MATCH TO ACTUALLY FINISH. The previous take stopped with her 5-3 up in set one,
// which is a good frame but not a win. When the match ends the control bar is replaced by the
// proceed pill ("To the result"), and the shout goes with it - so that button IS the finish line.
step('waiting for the match to finish')
let finished = false
for (let i = 0; i < 120; i++) {
  if (await page.locator('button', { hasText: /To the result/ }).count()) { finished = true; break }
  await page.waitForTimeout(1000)
}
mark('matchdone', { finished })
await page.waitForTimeout(finished ? 2600 : 600)

step('done')
clearTimeout(watchdog)
mark('end')
const sfx = await page.evaluate(() => window.__sfx)
fs.writeFileSync(`${OUT}/log.json`, JSON.stringify({ marks: log, sfx, perfAt, videoAt }, null, 1))
await ctx.close()
await browser.close()

const kinds = {}
for (const e of sfx) { const k = (e.src.split('/').pop() || '').replace('.mp3', ''); kinds[k] = (kinds[k] || 0) + 1 }
console.log('marks:', log.map((m) => `${m.what}@${m.t.toFixed(1)}`).join(' '))
console.log('sfx events:', sfx.length, JSON.stringify(kinds))
