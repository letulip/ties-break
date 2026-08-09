// JOURNEY: THE LAYOUT AT THE WIDTH THAT HURTS.
//
// SEAM OWNED: #4, real layout at real sizes - and it is the seam with the cleanest argument of the
// six. `tests/component/` runs in happy-dom, which parses CSS and then does nothing with it: there
// is no layout engine, every `getBoundingClientRect()` is zeros, and nothing can wrap, overflow or
// clip. A mounted test can prove a chip is in the DOM. Only a real browser can prove it FITS.
//
// ⚠ 375 px, NOT THE SUITE'S USUAL 576. The rest of the suite runs at the owner's own phone width;
// this file drops to 375 because that is the narrowest width the app is expected to survive and it
// is where every wrap decision goes wrong first. The two assertions below are the two failures this
// app has actually shipped: a strip that wrapped to four rows instead of two (recorded in
// docs/specs/home-season-strip.md, found by hand, in a browser, once), and sideways scroll.
//
// ⚠ AND NEITHER ASSERTION NAMES A COLOUR, A FONT OR A PIXEL POSITION. This is not visual regression
// - there are no screenshots here and no baseline images to bless. These are two invariants that
// hold for any design: the page does not scroll sideways, and one section does not eat the screen.
// A screenshot suite would go red on every deliberate restyle; these two go red only when the layout
// is actually broken.

import { test, expect } from './careerAt'
import { answerOpeningKnock, openMoney } from './journey'
import type { Page } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })

/** Does the document scroll sideways? The one-line definition of "it does not fit".
 *
 *  Read off `documentElement` rather than off any element's box: a child that overflows its parent
 *  is a design decision (a horizontally scrolling strip is a real pattern), but a child that widens
 *  the PAGE is a bug on every screen at once, and it is the bug a narrow phone finds. */
async function sideScroll(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

test('at 375 px the app does not scroll sideways, and the season strip stays short', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  await careerAt('junior')
  await answerOpeningKnock(page)

  // --- Home ------------------------------------------------------------------------------------
  expect(await sideScroll(page), 'Home overflows sideways at 375 px').toBeLessThanOrEqual(0)

  // THE SEASON STRIP, pinned by the distance between two headings that both have real roles.
  //
  // ⚠ MEASURED THIS WAY BECAUSE THE STRIP ITSELF CANNOT BE ADDRESSED. Its tier chips are plain
  // `<span class="pill tier-chip">` - no role, no label, invisible to `getByRole` and to a screen
  // reader alike (recorded in docs/specs/e2e-coverage.md's gap table). Rather than reach for a CSS
  // selector, the section is measured by its two bookends: the `Season` heading and the `News`
  // heading are both `role=heading`, so the gap between their tops IS the strip's block, addressed
  // entirely by role.
  //
  // THE CEILING IS MEASURED, NOT GUESSED (CLAUDE.md invariant 4). Measured on this build at this
  // width: 148.9 px, heading to heading. The ceiling below leaves ~21 px of headroom - enough for a
  // font or padding tweak, and less than one wrapped row of chips costs, which is the regression
  // this pin exists for (docs/specs/home-season-strip.md: four rows at 111 px, fixed to two at 52,
  // by hand, in a browser, once, with nothing keeping it there until now).
  const seasonTop = (await page.getByRole('heading', { name: 'Season', level: 2 }).boundingBox())?.y
  const newsTop = (await page.getByRole('heading', { name: 'News', level: 2 }).boundingBox())?.y
  expect(seasonTop, 'the Season heading is not laid out').toBeDefined()
  expect(newsTop, 'the News heading is not laid out').toBeDefined()
  expect(
    newsTop! - seasonTop!,
    'the Home season strip has grown - it wrapped to four rows once before and was fixed to two',
  ).toBeLessThan(170)

  // --- the two heaviest other screens ------------------------------------------------------------
  // Season is the widest content in the app (a planner grid and a calendar); Money carries a ledger
  // of full-width rows. If anything is going to push the page sideways at 375, it is one of these.
  await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()
  expect(await sideScroll(page), 'the Season screen overflows sideways at 375 px').toBeLessThanOrEqual(0)

  await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
  await openMoney(page)
  await page.getByRole('group', { name: 'Which part of the budget' })
    .getByRole('button', { name: 'History' })
    .click()
  await expect(page.getByRole('heading', { name: 'All transactions' })).toBeVisible()
  expect(await sideScroll(page), 'the Money screen overflows sideways at 375 px').toBeLessThanOrEqual(0)

  expect(crashes, 'the app threw at 375 px').toEqual([])
})
