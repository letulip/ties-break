// JOURNEY: THE APP'S FRAME AT REAL SIZES – ROUND 37's THIRD PASS, ITEMS 12 TO 15.
//
// SEAM OWNED: #4, real layout at real sizes. Every claim in this file is a NUMBER OF PIXELS, and
// pixels are the one thing `tests/component/` cannot produce: happy-dom parses the cascade and then
// does no layout at all, so «the shell is 992px wide», «the commentary gained 144 of them», «the
// label moved 16px left» and «there is no band under the rail» are unaskable there.
// `tests/component/round37-frame.test.ts` holds the other half – which rule reaches which element at
// which width – and the two files are deliberately aimed at different questions.
//
// ⚠ AND «ONLY THE MATCH» IS ASSERTED IN BOTH LAYERS ON PURPOSE. Item 12's rule is scoped with
// `:has()`, and happy-dom mis-evaluates a `:has()` whose argument starts with a combinator – probed
// 06.09, `:has(> .tf-body > .mv)` matched a takeover with no match in it, `:has(.mv)` did not. The
// selector is the descendant form because of that, and a real browser walking the real flow is what
// says the scoping holds on the screens a player actually passes through.
//
// ⚠ NO SCREENSHOTS AND NO BASELINE IMAGES, the same rule `responsive.spec.ts` states: these are
// arithmetic invariants that survive a restyle, not a visual diff that goes red on every one.

import { test, expect } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing, weekButton } from './journey'
import type { Locator, Page } from '@playwright/test'

/** The width of a box, or `null` when it is not laid out. Rounded to a tenth: sub-pixel noise is a
 *  property of the fractional page width, never of a rule. */
async function width(locator: Locator): Promise<number | null> {
  const box = await locator.boundingBox()
  return box ? Math.round(box.width * 10) / 10 : null
}

async function resize(page: Page, w: number, h: number): Promise<void> {
  await page.setViewportSize({ width: w, height: h })
  await page.waitForFunction((expected) => window.innerWidth === expected, w)
}

/** Open a live match through the doors a player uses: the week bar, the splash, the pre-match card. */
async function intoTheMatch(page: Page): Promise<void> {
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)
  await weekButton(page).click()
  const begin = page.getByRole('button', { name: 'Begin', exact: true })
  await expect(begin, 'the fixture must wake on a tournament week').toBeVisible()
  await begin.click()
  const watch = page.getByRole('button', { name: 'Watch match' })
  await expect(watch).toBeVisible()
  await watch.click()
  await expect(page.locator('.mv'), 'the viewer is on screen').toBeVisible()
}

// =================================================================================================
// ITEM 12 – «В МАТЧЕ ШИРИНА ОКНА ВНУТРИ ОГРАНИЧЕНА 880PX … ДО 1024 РЕЗИНОВО … ЗА СЧЕТ ЧАТА»
// =================================================================================================
// ⚠ MUTATION-VERIFIED, each applied alone (the red messages are quoted in the round's report):
//   * the `.tournament-flow:has(> .tf-body > .mv)` override deleted -> the shell arm;
//   * its `@media (min-width: 768px)` gate removed -> the «below 768 nothing moves» arm at 576;
//   * `max(344px, …)` reverted to a bare `344px` -> the tablet-band commentary arm;
//   * `min(60%, …)` reverted to a bare `60%` -> the desktop court-and-log arm.
test('item 12 – the match takes the width it is given, and the room goes to the commentary', async ({
  page,
  careerAt,
}) => {
  await resize(page, 1280, 900)
  await careerAt('junior')
  await intoTheMatch(page)

  const body = page.locator('.tf-body')
  const top = page.locator('.tf-top')
  const court = page.locator('.mv-court')
  const log = page.locator('.mv-log')

  // --- HIS SENTENCE, AS A TABLE ------------------------------------------------------------------
  // «Уже в 880 начиная можно по ширине экрана место занимать и до 1024 резиново расширять.» Before
  // this item every row below read 880.
  for (const [screen, shell] of [
    [880, 880],
    [900, 900],
    [960, 960],
    [1024, 1024],
    [1100, 1024],
    [1280, 1024],
  ] as const) {
    await resize(page, screen, 900)
    expect(await width(body), `at ${screen} the match's shell`).toBe(shell)
    // The header is the same column as the body – `.tf-top` reads the same token, and a title on a
    // 880px rail over a 1024px screen is the half a cap change forgets.
    expect(await width(top), `at ${screen} the header goes with it`).toBe(shell)
  }

  // --- ...AND WHERE THE NEW ROOM WENT -------------------------------------------------------------
  // «Как раз за счет расширения чата.» The two frames spend width differently, so both bands are
  // measured: on a tablet the court is a full-width row above two columns, on a desktop it is the
  // left column. In neither does it get a pixel of the new room.
  await resize(page, 880, 900)
  const courtAt880 = await width(court)
  const logAt880 = await width(log)
  expect(courtAt880, 'the tablet court is its own drawing surface').toBe(680)
  expect(logAt880, 'and the commentary is his 344').toBe(344)

  await resize(page, 960, 900)
  expect(await width(court), 'at 960 the court has not moved').toBe(courtAt880)
  expect(await width(log), 'and the 80px the shell gained are the commentary’s').toBe(logAt880! + 80)

  await resize(page, 1024, 900)
  const courtWide = await width(court)
  const logWide = await width(log)
  // The desktop frame draws a narrower court on purpose («ширину на десктопе получает только она»),
  // and item 12 does not touch it: 508.8 of column, less the panel's own hairlines.
  expect(courtWide, 'the desktop court is the same picture it was before this item').toBe(506.8)
  expect(logWide, 'and the commentary took all 144 new pixels').toBe(473.2)

  await resize(page, 1280, 900)
  expect(await width(court), 'and nothing moves again past 1024 – the cap is 1024').toBe(courtWide)
  expect(await width(log), 'the commentary included').toBe(logWide)
})

test('item 12 – …and only the match: the flow’s other screens keep their 880', async ({
  page,
  careerAt,
}) => {
  // ⚠⚠ THE ARM THAT PROTECTS THE OTHER TWO SURFACES. `--app-max-width` caps the onboarding wizard
  // and the tour briefing as well, and the last time it was laddered
  // `tests/component/tour-briefing.test.ts` went red with «expected 1200 to be 880». The override is
  // scoped by `:has()` to a shell with a match in it, and what this layer adds is the walk: the same
  // `.tf-body`, on the same career, measured on three consecutive screens of one takeover.
  await resize(page, 1280, 900)
  await careerAt('junior')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)
  await weekButton(page).click()

  const body = page.locator('.tf-body')
  await expect(page.getByRole('button', { name: 'Begin', exact: true })).toBeVisible()
  expect(await width(body), 'the tournament splash is an ordinary takeover').toBe(880)

  await page.getByRole('button', { name: 'Begin', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Watch match' })).toBeVisible()
  expect(await width(body), 'and so is the pre-match card').toBe(880)

  await page.getByRole('button', { name: 'Watch match' }).click()
  await expect(page.locator('.mv')).toBeVisible()
  expect(await width(body), 'the match, and only the match, takes the window').toBe(1024)
})

test('item 12 – below 768 not one pixel of the match moves', async ({ page, careerAt }) => {
  // ⚠ 576 IS THE OWNER'S OWN PHONE and it is the width this rule really broke on before the media
  // gate went round it: `min(100%, 1024px)` is SMALLER than the takeover's 480 at 375 and BIGGER at
  // 576, so a 375-only check would have passed the defect.
  await resize(page, 375, 812)
  await careerAt('junior')
  await intoTheMatch(page)

  const body = page.locator('.tf-body')
  for (const [screen, height, shell] of [
    [375, 812, 375],
    [576, 1280, 480],
    [768, 1024, 768],
  ] as const) {
    await resize(page, screen, height)
    expect(await width(body), `at ${screen} the match's shell is what it always was`).toBe(shell)
  }
  // ⚠ AND A SHORT WINDOW STILL SCROLLS, which is round 37's own earlier fix on this screen: the
  // panel keeps its content height and `.tf-body` outgrows the port rather than clipping it.
  await resize(page, 1280, 600)
  const scroll = await page.locator('.tf-body').evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }))
  expect(scroll.scrollHeight, 'a short desktop window has something to scroll to').toBeGreaterThan(
    scroll.clientHeight,
  )
})
