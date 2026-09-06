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

// =================================================================================================
// ITEM 13 – «КНОПКА NEXT ROUND ПО ПРЕЖНЕМУ ОЧЕНЬ ШИРОКАЯ, ДАВАЙ ТОЖЕ 500 ОГРАНИЧИМ»
// =================================================================================================
// ⚠ THIS IS THE LAYER THAT CAN REACH THE CONTROL AT ALL. The spectate card only exists after she is
// beaten before the Final, and getting there runs `showResult()` – an RPC to the worker – so the
// mounted layer holds the rule and the room while this one holds the button.
//
// ⚠ MUTATION-VERIFIED: `.tf-actions button { max-width: 500px }` deleted -> the width arm («expected
// 814 to be less than or equal to 500»); `.tf-actions { justify-content: center }` deleted -> the
// centring arm alone.
test('item 13 – the lone Next round control stops at 500 and is centred', async ({
  page,
  careerAt,
}) => {
  await resize(page, 1280, 900)
  await careerAt('junior')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)
  await weekButton(page).click()
  await page.getByRole('button', { name: 'Begin', exact: true }).click()

  // ⚠ THE PAIR FIRST, AS THE CONTROL ARM. Four of the five surfaces that use `.tf-actions` put TWO
  // controls in it, and each half is well inside the cap – so a cap that changed them would be a
  // redesign of the row rather than the fix he asked for. Measured before this item and after it:
  // 418px each at 848 of shell.
  const pair = page.locator('.tf-actions button')
  await expect(pair).toHaveCount(2)
  const pairWidths = await pair.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)))
  expect(pairWidths, 'the pre-match pair is unchanged and never met the cap').toEqual([418, 418])

  // Walk her run out: skip each round's match, take the box score's Next, until she is beaten before
  // the Final and the flow offers the spectate card – the one action row in the app with a single
  // control in it.
  const spectate = page.locator('.tf-spectate')
  for (let step = 0; step < 12 && !(await spectate.count()); step++) {
    const skip = page.getByRole('button', { name: 'Skip', exact: true })
    if (await skip.isVisible().catch(() => false)) {
      // `click()` auto-waits for the control to be enabled, which is what the reveal RPC turns off.
      await skip.click()
      await expect(page.locator('.tf-result-head'), 'the skip lands on a box score').toBeVisible()
      continue
    }
    const next = page.getByRole('button', { name: 'Next', exact: true })
    if (await next.isVisible().catch(() => false)) {
      await next.click()
      await expect(page.locator('.tf-scene, .tf-spectate, .tf-poster').first()).toBeVisible()
      continue
    }
    break
  }
  await expect(spectate, 'her run has to end short of the Final, or there is nothing to measure').toHaveCount(1)

  const lone = spectate.locator('.tf-actions button')
  await expect(lone, 'and the spectate card really holds exactly one control').toHaveCount(1)

  for (const screen of [768, 900, 1024, 1280]) {
    await resize(page, screen, 900)
    const row = (await spectate.locator('.tf-actions').boundingBox())!
    const button = (await lone.boundingBox())!
    // Before this item: 702px at 768 and 814px at 900, 1024 and 1280 alike – «очень широкая».
    expect(Math.round(button.width), `at ${screen} the control`).toBeLessThanOrEqual(500)
    // ...and the precondition that keeps that from being vacuous: the row it sits in is wider than
    // the cap, so the cap is what is holding it.
    expect(row.width, `at ${screen} the row is wide enough for the cap to matter`).toBeGreaterThan(500)
    // «С выравниванием по центру» – his own words for the same rule in review #18.
    const leftGap = button.x - row.x
    const rightGap = row.x + row.width - (button.x + button.width)
    expect(Math.abs(leftGap - rightGap), `at ${screen} the control is centred in its row`).toBeLessThan(1)
  }
})

// =================================================================================================
// ITEM 14 – THE RAIL'S LEFT INSET
// =================================================================================================
// «Слева сделаем такой же отступ, как и справа (меньше то есть)», and «под рейлом навигации остается
// пустое пространство 50-60 пикселей примерно».
//
// ⚠ MUTATION-VERIFIED: the rail's `padding-left` put back to `calc(12px + var(--app-pad-x))` -> the
// item 14 arms; its `margin-bottom` put back to `0` -> the item 15 arms, with the band measuring
// 48.0px again.
test('item 14 – the rail’s left inset is its right one', async ({
  page,
  careerAt,
}) => {
  await resize(page, 1280, 900)
  await careerAt('junior')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)

  for (const [screen, height] of [
    [1024, 800],
    [1280, 900],
    // ⚠ A SHORT WINDOW TOO. The rail is `height: 100vh` and scrolls itself; at 600px of window its
    // own content is 728px, so it has a fold of its own – which is NOT the band this item is about,
    // and measuring here is what keeps the two apart.
    [1280, 600],
  ] as const) {
    await resize(page, screen, height)

    // --- ITEM 14: the two insets ----------------------------------------------------------------
    const inset = await page.evaluate(() => {
      const rail = document.querySelector('nav.tab-bar') as HTMLElement
      const cs = getComputedStyle(rail)
      const r = rail.getBoundingClientRect()
      const label = document.querySelector('nav.tab-bar .tab-label') as HTMLElement
      const button = document.querySelector('nav.tab-bar .tab-btn') as HTMLElement
      return {
        padLeft: parseFloat(cs.paddingLeft),
        padRight: parseFloat(cs.paddingRight),
        left: r.x,
        right: r.right,
        labelLeft: label.getBoundingClientRect().x,
        buttonLeft: button.getBoundingClientRect().x,
        buttonRight: button.getBoundingClientRect().right,
      }
    })
    expect(inset.padLeft, `at ${screen} the rail's left inset is its right one`).toBe(inset.padRight)
    expect(inset.padLeft, 'and it is the 12 the right side has always had').toBe(12)
    // The measurement he is actually looking at: what stands between the rail's own edge and the
    // first thing printed on it. Before this item the left was 28 against a right of 12.
    expect(inset.buttonLeft - inset.left, `at ${screen} the tab starts 12px in`).toBeCloseTo(12, 1)
    expect(inset.right - inset.buttonRight, 'and stops 12px + the hairline short of the edge').toBeCloseTo(
      13,
      1,
    )
    expect(inset.labelLeft - inset.left, 'the label rides in with it').toBeLessThan(60)

  }
})

test('item 14 – and below 1024 the bar across the bottom is untouched', async ({
  page,
  careerAt,
}) => {
  await resize(page, 375, 812)
  await careerAt('junior')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)

  for (const [screen, height] of [
    [375, 812],
    [768, 1024],
    [900, 900],
  ] as const) {
    await resize(page, screen, height)
    const bar = await page.evaluate(() => {
      const el = document.querySelector('nav.tab-bar') as HTMLElement
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        position: cs.position,
        bottom: r.bottom,
        marginBottom: parseFloat(cs.marginBottom) || 0,
        marginLeft: parseFloat(cs.marginLeft) || 0,
        paddingLeft: parseFloat(cs.paddingLeft) || 0,
      }
    })
    expect(bar.position, `at ${screen} the bar is still pinned to the window`).toBe('fixed')
    expect(bar.bottom, 'at the bottom of it').toBeCloseTo(height, 0)
    expect(bar.marginLeft, 'no negative margin below 1024').toBe(0)
    expect(bar.paddingLeft, 'and no rail padding either').toBe(0)
  }
})
