// Film THE CROSSING-OUT SWEEP across every week SHAPE the timetable has, including a booked family
// holiday, captured at 2x.
//
// ── CAPTURE ────────────────────────────────────────────────────────────────────────────────────
// Playwright records at CSS-pixel resolution, 1:1. Two things that look like they would help do NOT:
//   • `deviceScaleFactor: 2` — measured: the page renders 414x896 into the CORNER of the 828x1792
//     frame and pads the rest grey. That context option drives screenshots, not the video pipeline.
//   • `html { zoom: 2 }` — fills the frame and IS sharp, but `matchMedia('(min-width:768px)')` then
//     reports true while the layout box is only 414px wide, so desktop CSS could fire on a phone
//     layout. Rejected for that mismatch alone.
// The BROWSER flag `--force-device-scale-factor=2` is the one that works: `window.innerWidth` stays
// 414 (phone media queries intact) and the screencast lands at a true 828x1792. Nothing upscales.
//
// ── WEEK SHAPES ────────────────────────────────────────────────────────────────────────────────
// Classified from the grid's OWN `<Eyebrow>` (`.tb-eyebrow`), which renders `weekDays.ts`'s `title`.
// An earlier cut regexed the whole document and labelled a week "exams" while the header plainly
// said TRAINING WEEK; reading the element the viewer is looking at cannot drift like that.
//
// ── THE HOLIDAY ────────────────────────────────────────────────────────────────────────────────
// Three separate bugs cost three takes here, all fixed below:
//   • `PlanWeekSheet`'s close control is an ICON button (`.replay-close`, no text) and the walk only
//     clicked buttons BY TEXT, so it could never dismiss the sheet.
//   • `confirmVacation` (SeasonScreen) closes the sheet ITSELF and raises a ConfirmDialog whose
//     button reads "Book it" — a label the old cleanup regex (Continue|Close|Done) did not match.
//   • The "+ Plan week" buttons' textContent is "\n  + Plan week\n", so an anchored
//     /^\+?\s*Plan week$/ matched NOTHING and a take booked no holiday at all while reporting green.
//
// ⚠ TIMING FROM SOURCE: DAY_CROSS_PACE.brisk = { sweepMs: 3000, holdMs: 620 }. Nothing may be
// clicked while it runs — `skipSweep` ends the animation on ANY tap.
import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = process.argv[2] || '/tmp/filmweeks'
const URL = process.argv[3] || 'http://localhost:5711'
const TARGET = Number(process.argv[4] || 51)
const SWEEP_MS = 3000 + 620 + 500
const SPLASH_HOLD = 3600
fs.mkdirSync(OUT, { recursive: true })

/** The grid's own title -> the shape name used to pick segments (engine: composables/weekDays.ts). */
const KIND = {
  'Training week': 'training',
  'Summer block': 'school-break',
  Exams: 'exams',
  'Family week': 'vacation',
  'Off-season': 'off-season',
  'Tournament week': 'tournament',
  'On the bench': 'bench',
}

const browser = await chromium.launch({ args: ['--force-device-scale-factor=2', '--high-dpi-support=1'] })
const ctx = await browser.newContext({
  viewport: { width: 414, height: 896 },
  recordVideo: { dir: OUT, size: { width: 828, height: 1792 } },
})
const page = await ctx.newPage()
const t0 = Date.now()
const stamp = () => (Date.now() - t0) / 1000
const log = []

const click = async (re, timeout = 1000) => {
  try {
    await page.locator('button', { hasText: re }).first().click({ timeout })
    return true
  } catch {
    return false
  }
}
const weekNo = async () => Number(((await page.locator('body').innerText()).match(/W(\d+)\s+20\d\d/) || [])[1] || 0)

async function shapeOnScreen() {
  const eyebrows = await page.locator('.tb-eyebrow').allTextContents()
  for (const raw of eyebrows) {
    const t = raw.trim()
    for (const [title, kind] of Object.entries(KIND)) if (t.toLowerCase() === title.toLowerCase()) return kind
  }
  return 'training'
}

/** The week-advance CTA, WITHOUT having to know its label.
 *
 *  ⚠ ENUMERATING LABELS DOES NOT WORK. Each week shape names its own button and the set is not
 *  discoverable from one screen: a holiday says "Leave on vacation" — not "Holiday", not "Family
 *  week" — and a take that guessed those two clicked nothing 170 times and filmed ONE sweep in 200
 *  seconds. Identify it structurally instead: the only enabled button that is neither a nav tab, nor
 *  an event card (those carry a "W12 '31" stamp), nor the "?" help. */
async function advanceWeek() {
  const btns = page.locator('button')
  const n = await btns.count()
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i)
    const t = (await b.innerText().catch(() => '')).trim()
    if (!t) continue
    if (/^(Season|Calendar|Home|Stats|Trophies|\?)$/.test(t)) continue
    if (/W\d+\s*'\d\d/.test(t)) continue
    if (!(await b.isEnabled().catch(() => false))) continue
    if (await b.click({ timeout: 900 }).then(() => true).catch(() => false)) return t
  }
  return ''
}

async function clearOverlays() {
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('.dialog-overlay').count())) return true
    if (await click(/^(Book it|Proceed to Home|Continue|Close|Done|Got it|Cancel)$/, 500)) {
      await page.waitForTimeout(250)
      continue
    }
    const x = page.locator('.replay-close, [title="Close"]').first()
    if (await x.count()) {
      await x.click({ timeout: 500 }).catch(() => {})
      await page.waitForTimeout(250)
      continue
    }
    await page.keyboard.press('Escape')
    await page.waitForTimeout(250)
  }
  return !(await page.locator('.dialog-overlay').count())
}

// --- open ------------------------------------------------------------------------------------------
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForTimeout(SPLASH_HOLD)
log.push({ t: 0.4, end: stamp(), what: 'splash' })
await page.locator('.splash').click()
await page.waitForTimeout(900)
await click(/Skip for now/, 5000)
await page.waitForTimeout(1100)
for (let i = 0; i < 12; i++) {
  if (!(await page.locator('text=Skip tour').count())) break
  if (!(await click(/^Skip tour$/, 700))) await page.mouse.click(207, 700)
  await page.waitForTimeout(400)
}
if (await page.locator('text=Skip tour').count()) throw new Error('tour still up — it would overlay every frame')
await page.waitForTimeout(500)

// --- book the family holiday -------------------------------------------------------------------------
let booked = ''
await click(/^Season$/, 2000)
await page.waitForTimeout(900)
const planners = page.locator('button', { hasText: /Plan week/ })
const plannerCount = await planners.count()
// Start at the SECOND plannable week so the film opens on an ordinary training week rather than on a
// holiday — the contrast only reads if the normal week comes first.
for (let i = 1; i < Math.min(plannerCount, 4) && !booked; i++) {
  await planners.nth(i).click({ timeout: 1500 }).catch(() => {})
  await page.waitForTimeout(800)
  if (!(await page.locator('.dialog-overlay').count())) continue

  await page.locator('.option-pill', { hasText: /Vacation/ }).first().click({ timeout: 1500 }).catch(() => {})
  await page.waitForTimeout(700)

  // Package order follows ECONOMY.vacation.packages: staycation, grandma, camping, SEASIDE,
  // sports-recovery, elite. Index 3 is the seaside trip; fall back to any enabled row rather than
  // filming no holiday at all.
  const books = page.locator('button', { hasText: /^\s*Book\s*$/ })
  const n = await books.count()
  let asked = false
  for (const k of [3, ...Array.from({ length: n }, (_, j) => j)]) {
    if (k >= n) continue
    if (!(await books.nth(k).isEnabled().catch(() => false))) continue
    await books.nth(k).click({ timeout: 1500 }).catch(() => {})
    asked = true
    break
  }
  if (!asked) {
    await clearOverlays()
    continue
  }
  await page.waitForTimeout(700)
  booked = (await page.locator('.dialog-overlay').innerText().catch(() => '')).split('\n')[0] || ''
  if (!(await click(/Book it/, 2500))) booked = ''
  await page.waitForTimeout(900)
  await clearOverlays()
}
log.push({ t: stamp(), what: 'booked', ok: !!booked, what_booked: booked })

await click(/^Calendar$/, 2000)
await page.waitForTimeout(800)
await clearOverlays()
log.push({ t: stamp(), what: 'ready' })

// --- the walk ----------------------------------------------------------------------------------------
const seen = new Set()
let guard = 0
let last = await weekNo()
while (last < TARGET && guard++ < 170) {
  if ((await page.locator('.dialog-overlay').count()) && !(await clearOverlays())) break
  const kind = await shapeOnScreen()

  const started = stamp()
  const cta = await advanceWeek()
  if (!cta) {
    if (await clearOverlays()) {
      await click(/^Calendar$/, 700)
      await page.waitForTimeout(300)
    }
    continue
  }

  await page.waitForTimeout(SWEEP_MS) // ⚠ hands off — this is the shot
  log.push({ t: started, end: stamp(), what: 'sweep', week: `W${last}`, kind, cta, fresh: !seen.has(kind) })
  seen.add(kind)

  await clearOverlays()
  await click(/^Calendar$/, 700)
  await page.waitForTimeout(500)
  const wk = await weekNo()
  if (wk && wk !== last) last = wk
}

log.push({ t: stamp(), what: 'end' })
fs.writeFileSync(`${OUT}/log.json`, JSON.stringify(log, null, 1))
await ctx.close()
await browser.close()

const s = log.filter((e) => e.what === 'sweep')
const kinds = {}
for (const e of s) kinds[e.kind] = (kinds[e.kind] || 0) + 1
console.log('sweeps:', s.length, '| kinds:', JSON.stringify(kinds), '| booked:', booked || 'NONE', '| reached W' + last)
