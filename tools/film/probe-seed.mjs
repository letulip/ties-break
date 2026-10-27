// Find a seed where Alice WINS her first-round tournament match. No video, no fast-forward.
//
// ⚠ THE DEV FAST-FORWARD IS NOT USABLE HERE. `game.tick(52)` blocks the page for minutes, and while
// it does EVERY Playwright query hangs behind it - a take once sat at 0% CPU for 78 minutes on
// exactly that call. Strength has to come from the draw instead of from the clock, so this searches
// seeds: the opponent has already been seen anywhere from #29 to #72 across runs.
//
// ⚠ THE SEED IS UI-SIDE RANDOMNESS (stores/game.ts builds it from Math.random when none is given).
// The engine never calls Math.random, so pinning it is reproducible without touching determinism.
import { chromium } from 'playwright'

const FROM = Number(process.argv[2] || 1)
const TO = Number(process.argv[3] || 8)
const URL = 'http://localhost:5711'
const browser = await chromium.launch()

async function trySeed(seedNum) {
  const ctx = await browser.newContext({ viewport: { width: 414, height: 896 } })
  const p = await ctx.newPage()
  const done = { verdict: 'error', opp: '', seedNum }
  const kill = setTimeout(() => {}, 0)
  try {
    await p.addInitScript((s) => {
      try { localStorage.setItem('tb-match-speed', '1') } catch (e) {}
      let x = (s >>> 0) || 1
      Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296 }
    }, seedNum)
    const click = async (re, t = 1500) => { try { await p.locator('button', { hasText: re }).first().click({ timeout: t }); return true } catch (e) { return false } }
    const dlg = async (re, t = 2500) => { try { await p.locator('.dialog-overlay').locator('button', { hasText: re }).first().click({ timeout: t }); return true } catch (e) { return false } }
    const OVERLAY = '.dialog-overlay, .tournament-flow'
    const clear = async () => {
      for (let i = 0; i < 5; i++) {
        if (!(await p.locator(OVERLAY).count())) return true
        const g = p.locator('.birthday-choice').first()
        if (await g.count()) { await g.click({ timeout: 800 }).catch(() => {}); await p.waitForTimeout(300); continue }
        if (await click(/^(Book it|Proceed to Home|Continue|Close|Done|Got it|Cancel)$/, 500)) { await p.waitForTimeout(250); continue }
        const x = p.locator('.replay-close, [title="Close"]').first()
        if (await x.count()) { await x.click({ timeout: 500 }).catch(() => {}); await p.waitForTimeout(250); continue }
        await p.keyboard.press('Escape'); await p.waitForTimeout(250)
      }
      return false
    }
    const advance = async () => {
      const btns = p.locator('button'); const n = await btns.count()
      for (let i = 0; i < n; i++) {
        const el = btns.nth(i); const t = (await el.innerText().catch(() => '')).trim()
        if (!t || /^(Season|Calendar|Home|Stats|Trophies|\?)$/.test(t)) continue
        if (/W\d+\s*'\d\d/.test(t) || /^(Practice|Vacation|Booked)$/.test(t)) continue
        if (!(await el.isEnabled().catch(() => false))) continue
        if (await el.click({ timeout: 900 }).then(() => true).catch(() => false)) return t
      }
      return ''
    }

    await p.goto(URL, { waitUntil: 'networkidle' })
    await p.waitForTimeout(2300)
    await p.locator('.splash').click()
    await p.waitForTimeout(900)
    await click(/Begin/, 5000)
    await p.waitForTimeout(800)
    await p.fill('#ob-first', 'Alice').catch(() => {})
    await p.fill('#ob-last', 'Martin').catch(() => {})
    const next = () => p.locator('button', { hasText: /^\s*Next\s*$/ }).first().click({ timeout: 1600 }).then(() => true).catch(() => false)
    for (let i = 0; i < 14; i++) {
      if (await p.locator('button', { hasText: /Start career/ }).count()) { await p.locator('button', { hasText: /Start career/ }).first().click({ timeout: 3000 }); break }
      let ok = await next()
      if (!ok) { await p.locator('button').filter({ hasNotText: /Back|Next|Start career/ }).first().click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(300); ok = await next() }
      if (!ok) break
      await p.waitForTimeout(400)
    }
    await p.waitForTimeout(1600)
    for (let i = 0; i < 8; i++) { if (!(await p.locator('text=Skip tour').count())) break; await click(/Skip tour/, 700); await p.waitForTimeout(350) }
    await clear()

    await click(/^Season$/, 3000); await p.waitForTimeout(900)
    if (!(await click(/^\s*Enter\s*$/, 2500))) { done.verdict = 'no-enter'; return done }
    await p.waitForTimeout(600)
    await dlg(/Enter|Push through/)
    await p.waitForTimeout(800); await clear()
    await click(/^Calendar$/, 2000); await p.waitForTimeout(700)

    let card = false
    for (let i = 0; i < 10 && !card; i++) {
      const cta = await advance()
      if (!cta) { await clear(); await click(/^Calendar$/, 700); await p.waitForTimeout(400); continue }
      await p.waitForTimeout(4200); await p.waitForTimeout(500)
      if (await p.locator('button', { hasText: /^\s*Begin\s*$/ }).count()) { await click(/^\s*Begin\s*$/, 2000); await p.waitForTimeout(800) }
      if (await p.locator('button', { hasText: /Watch match/ }).count()) { card = true; break }
      await clear(); await click(/^Calendar$/, 700); await p.waitForTimeout(400)
    }
    if (!card) { done.verdict = 'no-card'; return done }

    const pre = await p.locator('body').innerText()
    done.opp = (pre.split('\n').find((l) => /#\d+/.test(l)) || '').trim()

    // resolve it without watching: Skip, then read whether the flow offers ANOTHER round
    await click(/^\s*Skip\s*$/, 2500)
    await p.waitForTimeout(3200)
    await clear().catch(() => {})
    await p.waitForTimeout(800)
    const after = await p.locator('body').innerText()
    const advanced = /Semifinal|Final/i.test(after) && !/Local trip|bus home/i.test(after)
    done.verdict = advanced ? 'WIN' : 'loss'
    done.tail = after.split('\n').filter(Boolean).slice(0, 6).join(' | ').slice(0, 150)
  } catch (e) {
    done.verdict = 'error:' + String(e).slice(0, 60)
  } finally {
    clearTimeout(kill)
    await ctx.close().catch(() => {})
  }
  return done
}

for (let s = FROM; s <= TO; s++) {
  const r = await trySeed(s)
  console.log(`seed ${s}: ${r.verdict}  opp="${r.opp}"  ${r.tail || ''}`)
  if (r.verdict === 'WIN') { console.log(`>>> USE SEED ${s}`); break }
}
await browser.close()
