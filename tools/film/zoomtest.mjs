import { chromium } from 'playwright'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1080, height: 1080 } })
const p = await ctx.newPage()
for (const z of [1, 1.15, 1.6]) {
  await p.goto(`http://localhost:5841/tools/film/prologue-phone.html?zoom=${z}`, { waitUntil: 'networkidle' })
  await p.setViewportSize({ width: Math.round(414 * z), height: Math.round(896 * z) })
  await p.waitForTimeout(600)
  const m = await p.evaluate(() => {
    const card = document.querySelector('.dialog-card')
    const h2 = document.querySelector('h2')
    return {
      rootZoom: getComputedStyle(document.documentElement).zoom,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      desktop: window.matchMedia('(min-width: 768px)').matches,
      cardPx: card ? Math.round(card.getBoundingClientRect().width) : null,
      h2Px: h2 ? Math.round(h2.getBoundingClientRect().height) : null,
      h2Font: h2 ? getComputedStyle(h2).fontSize : null,
    }
  })
  console.log('zoom', z, JSON.stringify(m))
}
await b.close()
