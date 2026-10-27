// How tall is every card the film shows, at 414 logical px? The answers have to be on screen.
import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1080, height: 1080 } })
const p = await ctx.newPage()
await p.goto('http://localhost:5841/tools/film/prologue-phone.html?zoom=1', { waitUntil: 'networkidle' })
await p.setViewportSize({ width: 414, height: 1400 })
await p.waitForTimeout(500)
const steps = [
  ['A city, and the bills are paid.', 5],
  ['Sign her up', 6],
  ['A year passes', 7],
  ['The club across town', 8],
  ['Buy the hour, one to one', 9],
  ['Enter her', 10],
]
const read = async (tag) => {
  const f = await p.evaluate(() => ({ ...window.__phone.fit(), age: window.__phone.state().age, title: window.__phone.state().title }))
  console.log(`  age ${String(f.age).padEnd(2)} card ${String(f.card).padEnd(5)} ${tag}  "${f.title}"`)
  return f
}
await read('start')
for (const [label] of steps) {
  await p.evaluate((l) => window.__phone.tap(l), label)
  await p.waitForTimeout(320)
  await read('after ' + label)
}
// the local open + result
await p.evaluate(() => window.__phone.tap('Skip the rest of the weekend'))
await p.waitForTimeout(400)
await read('result card')
await p.evaluate(() => window.__phone.tap('Go on'))
await p.waitForTimeout(300)
await read('age 11')
for (const l of ['The sports school', 'Put her name down']) { await p.evaluate((x) => window.__phone.tap(x), l); await p.waitForTimeout(320) }
await p.evaluate(() => window.__phone.tap('Skip the rest of the weekend')); await p.waitForTimeout(400)
await p.evaluate(() => window.__phone.tap('Go on')); await p.waitForTimeout(400)
await read('age 12')
for (const l of ['Give her the year she is asking for', 'Put her name down']) { await p.evaluate((x) => window.__phone.tap(x), l); await p.waitForTimeout(320) }
await p.evaluate(() => window.__phone.tap('Skip the rest of the weekend')); await p.waitForTimeout(400)
await p.evaluate(() => window.__phone.tap('Go on')); await p.waitForTimeout(400)
await read('age 13')
await p.evaluate(() => window.__phone.tap('Put her name down')); await p.waitForTimeout(400)
await p.evaluate(() => window.__phone.tap('Skip the rest of the weekend')); await p.waitForTimeout(600)
await p.evaluate(() => window.__phone.tap('Go on')); await p.waitForTimeout(2500)
await read('HANDOVER')
await b.close()
