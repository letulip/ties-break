// Where does the app actually land after splash + onboarding on CURRENT main? The weeks recorder
// filmed 170 "sweeps" at week 0, clicking a button called "Practice" every time, which means it was
// never on the calendar at all. Dump every step rather than guess.
import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 414, height: 896 } })
const p = await ctx.newPage()
const click = async (re, t = 1500) => {
  try { await p.locator('button', { hasText: re }).first().click({ timeout: t }); return true } catch { return false }
}
const dump = async (tag) => {
  const btns = (await p.locator('button').allTextContents()).map((t) => t.trim().replace(/\s+/g, ' ')).filter(Boolean)
  const body = await p.locator('body').innerText()
  const wk = (body.match(/W\d+\s+20\d\d/) || [])[0] || 'NO WEEK'
  console.log(`\n[${tag}] week=${wk} overlays=${await p.locator('.dialog-overlay').count()}`)
  console.log('  h1/h2:', JSON.stringify((await p.locator('h1, h2').allTextContents()).map((t) => t.trim()).slice(0, 4)))
  console.log('  buttons:', JSON.stringify(btns.slice(0, 14)))
}

await p.goto('http://localhost:5711', { waitUntil: 'networkidle' })
await p.waitForTimeout(2600)
await dump('after load')
await p.locator('.splash').click().catch(() => {})
await p.waitForTimeout(1000)
await dump('after splash tap')

console.log('\nSkip for now ->', await click(/Skip for now/, 5000))
await p.waitForTimeout(1400)
await dump('after Skip for now')

for (let i = 0; i < 8; i++) {
  if (!(await p.locator('text=Skip tour').count())) break
  await click(/^Skip tour$/, 700)
  await p.waitForTimeout(400)
}
await dump('after Skip tour')

console.log('\nCalendar ->', await click(/^Calendar$/, 2000))
await p.waitForTimeout(1200)
await dump('after Calendar tap')
await p.screenshot({ path: '/tmp/probe-open.png' })
await b.close()
