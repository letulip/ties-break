// TEMPORARY – a look at the Her week tab in a real browser at the two sizes §9c is written about.
// Deleted before the branch is pushed; it exists to measure, not to assert.
import { test, expect } from './careerAt'
import { answerOpeningKnock } from './journey'

const SIZES = [
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
]

for (const size of SIZES) {
  test(`her week at ${size.name}`, async ({ page, careerAt }) => {
    await page.setViewportSize({ width: size.width, height: size.height })
    await careerAt('junior')
    await answerOpeningKnock(page)
    // Reach the market through the door a player uses: Home's coach note card.
    await page.getByRole('button', { name: 'Coach note - open the Coach Market' }).click()
    const tab = page.getByRole('button', { name: 'Her week' })
    await expect(tab).toBeVisible({ timeout: 10000 })
    await tab.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: `/private/tmp/dials-${size.name}-top.png` })
    const metrics = await page.evaluate(() => {
      const cells = [...document.querySelectorAll('.hw-row')][0]?.children ?? []
      const rects = [...cells].map((c) => c.getBoundingClientRect())
      const heads = [...(document.querySelector('.hw-heads')?.children ?? [])].map((c) =>
        c.getBoundingClientRect(),
      )
      const hw = document.querySelector('.hw') as HTMLElement | null
      const scroller = (() => {
        let el: HTMLElement | null = hw
        while (el) {
          if (el.scrollHeight > el.clientHeight + 2) return el
          el = el.parentElement
        }
        return null
      })()
      return {
        cellWidths: rects.map((r) => Math.round(r.width * 100) / 100),
        cellHeights: rects.map((r) => Math.round(r.height * 100) / 100),
        gap: rects.length > 1 ? Math.round((rects[1].left - rects[0].right) * 100) / 100 : null,
        headWidth: heads[0] ? Math.round(heads[0].width * 100) / 100 : null,
        tabHeight: hw ? Math.round(hw.getBoundingClientRect().height) : null,
        scrollerClass: scroller?.className ?? null,
        scrollHeight: scroller?.scrollHeight ?? null,
        clientHeight: scroller?.clientHeight ?? null,
        docScroll: document.documentElement.scrollHeight,
        docClient: document.documentElement.clientHeight,
        bodyOverflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        readout: document.querySelector('.hw-readout')?.textContent ?? null,
        limit: document.querySelector('.hw-limit')?.textContent ?? null,
        notNow: document.querySelector('.hw-not-now')?.textContent ?? null,
        dots: [...document.querySelectorAll('.hw-head')].map((h) => ({
          label: h.getAttribute('aria-label'),
          total: h.querySelectorAll('.hw-dot').length,
          full: h.querySelectorAll('.hw-dot.full').length,
        })),
        hours: [...document.querySelectorAll('.hw-block-hours')].map((n) => n.textContent),
      }
    })
    console.log(`METRICS ${size.name} ` + JSON.stringify(metrics, null, 1))
    // scroll to the bottom of the tab and shoot again
    await page.evaluate(() => {
      const el = document.querySelector('.app-scroll, .screen, body') as HTMLElement
      el?.scrollTo?.(0, 99999)
      window.scrollTo(0, 99999)
    })
    await page.waitForTimeout(250)
    await page.screenshot({ path: `/private/tmp/dials-${size.name}-bottom.png` })
  })
}

test('a tick goes through the worker and comes back', async ({ page, careerAt }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await careerAt('junior')
  await answerOpeningKnock(page)
  await page.getByRole('button', { name: 'Coach note - open the Coach Market' }).click()
  await page.getByRole('button', { name: 'Her week' }).click()
  const before = await page.locator('.hw-readout').textContent()
  await page.getByRole('checkbox', { name: 'Fitness on Wednesday' }).click()
  await page.waitForTimeout(600)
  const after = await page.locator('.hw-readout').textContent()
  const hours = await page.locator('.hw-block-hours').allTextContents()
  const dots = await page.evaluate(() =>
    [...document.querySelectorAll('.hw-head')].map((h) => h.getAttribute('aria-label')),
  )
  const limit = await page.locator('.hw-limit').textContent().catch(() => null)
  console.log(`TICK before=${before} after=${after} hours=${JSON.stringify(hours)} limit=${limit}`)
  console.log(`TICK dots=${JSON.stringify(dots)}`)
  await page.screenshot({ path: '/private/tmp/dials-ticked.png' })
  // ...and the Calendar now draws a gym on the day it was ticked, which is the mine this wave defused.
  await page.getByRole('button', { name: 'Calendar' }).click()
  await page.waitForTimeout(500)
  const cal = await page.evaluate(() => document.body.innerText.slice(0, 900))
  console.log(`CALENDAR ${cal}`)
  await page.screenshot({ path: '/private/tmp/dials-calendar.png' })
})

test('a school-free week grows the second dot', async ({ page, careerAt }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await careerAt('pro')
  await answerOpeningKnock(page)
  await page.getByRole('button', { name: 'Coach note - open the Coach Market' }).click()
  await page.getByRole('button', { name: 'Her week' }).click()
  const dots = await page.evaluate(() =>
    [...document.querySelectorAll('.hw-head')].map((h) => ({
      label: h.getAttribute('aria-label'),
      total: h.querySelectorAll('.hw-dot').length,
    })),
  )
  const capacity = await page.locator('.hw-capacity').textContent()
  console.log(`PRO dots=${JSON.stringify(dots)} capacity=${capacity}`)
  // double a day and watch the read-out say so
  await page.getByRole('checkbox', { name: 'Serve & return on Monday' }).click()
  await page.waitForTimeout(600)
  console.log(`PRO readout=${await page.locator('.hw-readout').textContent()}`)
  await page.screenshot({ path: '/private/tmp/dials-pro.png' })
})
