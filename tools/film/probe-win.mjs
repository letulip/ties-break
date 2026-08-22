// Find a career where Alice WINS her quarterfinal, and make it reproducible.
//
// ⚠ THE CAREER SEED IS UI-SIDE RANDOMNESS. stores/game.ts newCareer(): an empty seed becomes
// `${kidName}-${Math.random().toString(36)...}`. The ENGINE never calls Math.random (CLAUDE.md
// invariant 2), so replacing it in the page fixes the career without touching engine determinism -
// which is what lets a winning run be found once and then filmed on purpose.
import { chromium } from 'playwright'

const SEEDNUM = Number(process.argv[2] || 1)
const SEASONS = Number(process.argv[3] || 3)
const URL = 'http://localhost:5711'

const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 414, height: 896 } })
const p = await ctx.newPage()
await p.addInitScript((s) => {
  try { localStorage.setItem('tb-match-speed', '1') } catch (e) {}
  let x = (s >>> 0) || 1
  Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296 }
}, SEEDNUM)

const click = async (re, t = 1500) => { try { await p.locator('button', { hasText: re }).first().click({ timeout: t }); return true } catch { return false } }
const dlgBtn = async (re, t = 2500) => { try { await p.locator('.dialog-overlay').locator('button', { hasText: re }).first().click({ timeout: t }); return true } catch { return false } }
const OVERLAY = '.dialog-overlay, .tournament-flow'
const clearOverlays = async () => {
  for (let i = 0; i < 5; i++) {
    if (!(await p.locator(OVERLAY).count())) return true
    const g = p.locator('.birthday-choice').first()
    if (await g.count()) { await g.click({ timeout: 800 }).catch(()=>{}); await p.waitForTimeout(300); continue }
    if (await click(/^(Book it|Proceed to Home|Continue|Close|Done|Got it|Cancel)$/, 500)) { await p.waitForTimeout(250); continue }
    const x = p.locator('.replay-close, [title="Close"]').first()
    if (await x.count()) { await x.click({ timeout: 500 }).catch(()=>{}); await p.waitForTimeout(250); continue }
    await p.keyboard.press('Escape'); await p.waitForTimeout(250)
  }
  return !(await p.locator(OVERLAY).count())
}
const advance = async () => {
  const btns = p.locator('button'); const n = await btns.count()
  for (let i = 0; i < n; i++) {
    const el = btns.nth(i); const t = (await el.innerText().catch(()=> '')).trim()
    if (!t || /^(Season|Calendar|Home|Stats|Trophies|\?)$/.test(t)) continue
    if (/W\d+\s*'\d\d/.test(t) || /^(Practice|Vacation|Booked)$/.test(t)) continue
    if (!(await el.isEnabled().catch(()=>false))) continue
    if (await el.click({ timeout: 900 }).then(()=>true).catch(()=>false)) return t
  }
  return ''
}

await p.goto(URL, { waitUntil: 'networkidle' })
await p.waitForTimeout(2400)
await p.locator('.splash').click()
await p.waitForTimeout(900)

// --- the wizard, named ---------------------------------------------------------------------------
// ⚠ SOME STEPS WILL NOT LET YOU PAST UNTIL A CHOICE IS MADE (the country list is one), and on those
// "Next" simply is not clickable. Walking it with Next alone stopped dead on screen 2.
await click(/Begin/, 4000)
await p.waitForTimeout(900)
await p.fill('#ob-first', 'Alice').catch(()=>{})
await p.fill('#ob-last', 'Martin').catch(()=>{})
await p.waitForTimeout(300)
const tryNext = () => p.locator('button', { hasText: /^\s*Next\s*$/ }).first().click({ timeout: 1800 }).then(()=>true).catch(()=>false)
let started = false
for (let i = 0; i < 14; i++) {
  if (await p.locator('button', { hasText: /Start career/ }).count()) {
    await p.locator('button', { hasText: /Start career/ }).first().click({ timeout: 3000 })
    started = true
    break
  }
  let ok = await tryNext()
  if (!ok) {
    const opt = p.locator('button').filter({ hasNotText: /Back|Next|Start career/ }).first()
    await opt.click({ timeout: 1500 }).catch(()=>{})
    await p.waitForTimeout(350)
    ok = await tryNext()
  }
  if (!ok) break
  await p.waitForTimeout(450)
}
console.log('start career ->', started)
await p.waitForTimeout(1800)
for (let i = 0; i < 10; i++) { if (!(await p.locator('text=Skip tour').count())) break; await click(/^Skip tour$/, 700); await p.waitForTimeout(400) }
await clearOverlays()
const nameSeen = (await p.locator('body').innerText()).includes('Alice')
console.log('Alice on screen ->', nameSeen)

// --- grow her: the owner-sanctioned dev fast-forward ---------------------------------------------
// ⚠ MORE IS BEHIND THE SETTINGS ICON, not a text button - it has no label to match on.
await click(/^Home$/, 2000)
await p.waitForTimeout(700)
await p.locator('[aria-label="Settings"]').first().click({ timeout: 3000 }).catch(() => {})
await p.waitForTimeout(1100)
for (let s = 0; s < SEASONS; s++) {
  const ok = await click(/52 \(dev\)/, 4000)
  console.log(`  season ${s + 1} ->`, ok)
  await p.waitForTimeout(2500)
  await clearOverlays()
  await p.waitForTimeout(500)
}
const body = await p.locator('body').innerText()
console.log('age/rank:', (body.match(/(\d+) years old/) || [])[0], '|', (body.match(/#\d+/) || [])[0])

// --- enter a Local Open and skip to the result ----------------------------------------------------
await click(/^Season$/, 3000); await p.waitForTimeout(1100)
console.log('Enter ->', await click(/^\s*Enter\s*$/, 2500))
await p.waitForTimeout(700)
console.log('confirm ->', await dlgBtn(/Enter|Push through/))
await p.waitForTimeout(900); await clearOverlays()
await click(/^Calendar$/, 2000); await p.waitForTimeout(800)
let reached = false
for (let i = 0; i < 12 && !reached; i++) {
  const cta = await advance()
  if (!cta) { await clearOverlays(); await click(/^Calendar$/, 700); await p.waitForTimeout(400); continue }
  await p.waitForTimeout(4200); await p.waitForTimeout(600)
  if (await p.locator('button', { hasText: /Watch match/ }).count()) { reached = true; break }
  await clearOverlays(); await click(/^Calendar$/, 700); await p.waitForTimeout(500)
}
console.log('pre-match card ->', reached)
if (reached) {
  const card = await p.locator('body').innerText()
  console.log('  matchup:', card.split('\n').filter(l => /Age \d+|Unranked|#\d+/.test(l)).slice(0, 4).join(' / '))
  await click(/^\s*Skip\s*$/, 2500)
  await p.waitForTimeout(2500)
  const res = await p.locator('body').innerText()
  console.log('  RESULT:', res.split('\n').slice(0, 14).join(' | '))
}
await b.close()
