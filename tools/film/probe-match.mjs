// Route to a live tournament match, dumping state at each step, so the recorder does not discover
// the path with the camera running.
import { chromium } from 'playwright'
const URL = 'http://localhost:5711'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 414, height: 896 } })
const p = await ctx.newPage()
await p.addInitScript(() => { try { localStorage.setItem('tb-match-speed', '1') } catch {} })
const click = async (re, t = 1500) => { try { await p.locator('button', { hasText: re }).first().click({ timeout: t }); return true } catch { return false } }
const OVERLAY = '.dialog-overlay, .tournament-flow'
const dump = async (tag) => {
  const t = await p.locator('body').innerText()
  const btns = (await p.locator('button').allTextContents()).map(x => x.trim().replace(/\s+/g,' ')).filter(Boolean)
  console.log(`\n[${tag}] week=${(t.match(/W\d+\s+20\d\d/)||[])[0]||'-'} overlays=${await p.locator(OVERLAY).count()}`)
  console.log('  btns:', JSON.stringify(btns.slice(0, 12)))
}
const clearOverlays = async () => {
  for (let i = 0; i < 5; i++) {
    if (!(await p.locator(OVERLAY).count())) return true
    const gift = p.locator('.birthday-choice').first()
    if (await gift.count()) { await gift.click({ timeout: 800 }).catch(()=>{}); await p.waitForTimeout(300); continue }
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
await p.waitForTimeout(2600)
await p.locator('.splash').click()
await p.waitForTimeout(900)
await click(/Skip for now/, 5000)
await p.waitForTimeout(1200)
for (let i = 0; i < 10; i++) { if (!(await p.locator('text=Skip tour').count())) break; await click(/^Skip tour$/, 700); await p.waitForTimeout(400) }

// enter the first tournament on offer
await click(/^Season$/, 3000); await p.waitForTimeout(1000)
await dump('season')
console.log('Enter ->', await click(/^\s*Enter\s*$/, 2000))
await p.waitForTimeout(700)
await dump('after Enter (confirm?)')
// ⚠ SCOPE THE CONFIRM TO THE DIALOG. The event card behind it also has an "Enter", and a
// page-wide `.first()` picks THAT one - the dialog stays up and the entry never happens.
const dlgBtn = async (re, t = 2500) => {
  try { await p.locator('.dialog-overlay').locator('button', { hasText: re }).first().click({ timeout: t }); return true } catch { return false }
}
console.log('confirm ->', await dlgBtn(/Enter|Push through/))
await p.waitForTimeout(900)
await clearOverlays()

// walk to the tournament week
await click(/^Calendar$/, 2000); await p.waitForTimeout(800)
for (let i = 0; i < 8; i++) {
  const cta = await advance()
  console.log(`  advance ${i}: "${cta}"`)
  if (!cta) break
  await p.waitForTimeout(4200)
  await p.waitForTimeout(600)
  if (await p.locator('button', { hasText: /Watch match/ }).count()) { console.log('  >> Watch match is on screen'); break }
  await clearOverlays()
  await click(/^Calendar$/, 700); await p.waitForTimeout(500)
}
await dump('tournament?')
await p.screenshot({ path: '/tmp/probe-tourn.png' })
await b.close()
