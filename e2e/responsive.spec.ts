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
import { answerOpeningKnock, dismissTourBriefing, enterConfirmButton, openMoney } from './journey'
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
  // ⚠ MEASURED THIS WAY BECAUSE THE STRIP ITSELF COULD NOT BE ADDRESSED - and that half of the note
  // is now history, which is why it is re-aimed rather than deleted. Its tier chips WERE plain
  // `<span class="pill tier-chip">` - no role, no label, invisible to `getByRole` and to a screen
  // reader alike (defect D6 in docs/specs/e2e-coverage.md §12, fixed on fix/a11y-sweep: each rung is
  // a named image inside a group called `Season ladder`). The measurement below is UNCHANGED anyway,
  // and deliberately: the two bookends are what pin the strip's HEIGHT, which is the regression this
  // test exists for, and a chip you can now name still cannot tell you how many rows it wrapped to.
  // What the fix buys this file is the assertion under the measurement, not a different measurement.
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

  // ⚠ AND THE RUNGS INSIDE IT ARE REACHABLE NOW (a11y D6). This is the half the note above says the
  // fix buys: the strip is a named group, every rung in it is a named image, and the name carries
  // the STATE that used to live only in a CSS class - so a chip's colour is no longer the only place
  // "she has reached this" is written down. Asserted at this width because this is the one file that
  // renders the strip in a real browser; the shape of each name is
  // tests/component/a11y-sweep.test.ts's.
  //
  // ⚠ MUTATION-VERIFIED: the `role`/`aria-label` pair off `.season-strip` -> red on the group below,
  // while the heading-to-heading measurement above stays green. That split is the point of keeping
  // both: they are two different claims about the same row.
  const ladder = page.getByRole('group', { name: 'Season ladder' })
  await expect(ladder).toBeVisible()
  expect(await ladder.getByRole('img').count(), 'the ladder drew no addressable rung').toBeGreaterThan(1)

  // --- the two heaviest other screens ------------------------------------------------------------
  // Season is the widest content in the app (a planner grid and a calendar); Money carries a ledger
  // of full-width rows. If anything is going to push the page sideways at 375, it is one of these.
  await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()
  expect(await sideScroll(page), 'the Season screen overflows sideways at 375 px').toBeLessThanOrEqual(0)

  await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
  await openMoney(page)
  const chapters = page.getByRole('group', { name: 'Which part of the budget' })
  await chapters.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('heading', { name: 'All transactions' })).toBeVisible()
  expect(await sideScroll(page), 'the Money screen overflows sideways at 375 px').toBeLessThanOrEqual(0)

  // ⭐⭐ ROUND 30 #5 – THE TWO CHAPTERS THAT GREW A SECOND ROW OF TABS, and this is the file that can
  // answer for them. The owner asked for sub-tabs inside Bills and Shop; Shop's row carries SIX
  // segments (Invest / Cars / Property / Business / Water / Air), which at the shared pill metrics
  // is about 450px of control inside the 343px this viewport actually has. `.tab-row` is a bare
  // flex with no wrap, so without the `.money-subtabs` rule in MoneyScreen.vue that row would push
  // the DOCUMENT sideways – and "at 375 px the app does not scroll sideways" is what this file is
  // for. happy-dom cannot see this: it has no layout engine, so a mounted test would pass on the
  // broken version.
  //
  // ⚠ MEASURED, NOT ASSUMED, AND THE TWO HALVES OF THE FIX WERE MUTATED SEPARATELY. `.money-subtabs`
  // does two things – it tightens the shelf's pills, and it lets the row wrap rather than overflow –
  // and taking either one away ALONE leaves this file green:
  //   * tightening alone (no wrap)  -> the six fit one row at 375 and nothing overflows;
  //   * wrap alone (no tightening)  -> the row breaks to two lines, still inside the page.
  //   * NEITHER                     -> `the shelf sub-tabs overflow sideways at 375 px`, red.
  // So the tightening is what makes his «в ряд» true at the width he plays at, the wrap is the net
  // under it, and the two assertions below are aimed one at each: the overflow check answers for the
  // page, the one-row check answers for the design.
  await chapters.getByRole('button', { name: 'Bills' }).click()
  await expect(page.getByRole('group', { name: 'Which bills' })).toBeVisible()
  expect(await sideScroll(page), 'the Bills sub-tabs overflow sideways at 375 px').toBeLessThanOrEqual(0)

  await chapters.getByRole('button', { name: 'Shop' }).click()
  // ⚠ RE-AIMED BY ROUND 35 #3, AND ONLY THE WAY IN MOVED. The shop is TWO levels now: pressing Shop
  // lands on its home – six category cards – and the segments this arm measures live one press
  // deeper. Reading the group straight after the Shop click found nothing at all, which is a test
  // that has lost sight of its subject rather than one that disagrees with it. The overflow claim
  // below is untouched.
  await page.getByRole('button', { name: 'Invest' }).first().click()
  const shelf = page.getByRole('group', { name: 'Which part of the shelf' })
  await expect(shelf).toBeVisible()
  expect(await sideScroll(page), 'the shelf sub-tabs overflow sideways at 375 px').toBeLessThanOrEqual(0)
  // ...and every one of his six is really on the screen, not merely in the document: a segment
  // clipped off the right edge is a tab the player cannot reach. ⚠ AND THEY ARE ON ONE ROW, which is
  // «вкладки в ряд» as a measurement rather than as an intention – it is the assertion that reddens
  // when the pill tightening is taken away and the row breaks to two lines.
  const tops: number[] = []
  for (const segment of ['Invest', 'Cars', 'Property', 'Business', 'Water', 'Air']) {
    const box = await shelf.getByRole('button', { name: segment }).boundingBox()
    expect(box, `the ${segment} segment is not laid out`).not.toBeNull()
    expect(box!.x, `the ${segment} segment starts off the left of a 375px phone`).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, `the ${segment} segment runs off a 375px phone`).toBeLessThanOrEqual(375)
    tops.push(Math.round(box!.y))
  }
  expect(new Set(tops).size, 'his six segments are one row at 375 px, not two').toBe(1)
  // The rungs behind the open segment are cards laid on the page, and they fit it too.
  await shelf.getByRole('button', { name: 'Cars' }).click()
  expect(await sideScroll(page), 'the shelf cards overflow sideways at 375 px').toBeLessThanOrEqual(0)

  expect(crashes, 'the app threw at 375 px').toEqual([])
})

// =================================================================================================
// ⭐⭐ ROUND 30 #6 – THE NEXT-TOURNAMENT SCREEN, WHOSE PICTURE IS NOW SQUARE.
//
// The owner asked for the tournament picture to be square «по примеру главной», with part of the
// description, `The read`, the weather and the trip laid ON it. A square at the full width of the
// phone is the tallest that block has ever been, and this is the only layer that can say whether the
// screen still fits: happy-dom has no layout engine, so a mounted test measures zeros.
//
// ⭐⭐ AND ROUND 30 #18 SENT IT TO THE EDGE, which makes that square 32px wider and 32px taller than
// it was at this width. The full-bleed assertions are inline below, with the page-level "does not
// scroll sideways" check above them – a photograph that cancels the shell's gutter is exactly the
// kind of object that takes a phone sideways if the cancellation is off by a pixel.
//
// ⚠ THE ENTRY IS MADE RATHER THAN ASSUMED, and that is the difference between this and a dead guard.
// The panel is drawn only for an ENTERED tournament (`upcoming.find(e => e.entered)`), and a seeded
// career has entered nothing – a version of this test that simply opened the tab would have measured
// a screen with no panel on it and passed on every broken layout. So it enters one first, through
// the two controls a player uses, and then asserts the panel is really there before measuring it.
test('at 375 px the Next-tournament screen fits, square picture and all', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  await careerAt('pro')
  await answerOpeningKnock(page)
  // The `pro` fixture opens onto the tour briefing, and it is a BLOCKING overlay – the same one
  // round-20 #3 was about. Dismissed the way a player dismisses it.
  await dismissTourBriefing(page)

  // Season -> the first thing she may enter, and its confirm. Both locators are journey.ts's own
  // closed sets, so a fourth verb or a renamed pill goes red here rather than passing quietly.
  await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()
  const entry = page.getByRole('button', { name: /^Enter the / }).first()
  await expect(entry, 'the fixture must have something she may enter').toBeVisible()
  await entry.click()
  await enterConfirmButton(page).click()

  // Home -> the card he clicks, which is the door this panel lives behind.
  await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
  await page.getByRole('button', { name: /^Next tournament/ }).click()
  const panel = page.locator('.next-tourn')
  await expect(panel, 'the entry really opened onto the panel').toBeVisible()
  // ⭐⭐ ROUND 33 #1 – AND THE WEEK IS NOT ON IT. This line read «the Training plan heading is
  // visible» for three rounds, which is precisely the state the owner came back about a fifth time:
  // «опять экран next tournament содержит next week ... это разные экраны, нужны для разных вещей»
  // (docs/rounds/round-33.md item 1). Home's plate opens `ThisWeekScreen` with `entry: 'tournament'`
  // and that arrival is now the tournament alone, so the assertion is inverted rather than deleted -
  // this is the only layer that sees the real cascade, and «not rendered» and «rendered off-screen»
  // are the same thing to a mounted test.
  await expect(page.getByRole('heading', { name: 'Training plan', level: 2 })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'This week', level: 2 })).toHaveCount(0)
  // ...and the way off it is real, which is the round-20 #3 rule applied to a screen that has just
  // lost the story's × and its Proceed pill along with the story.
  await expect(page.getByRole('button', { name: 'Back to Home' })).toBeVisible()

  expect(await sideScroll(page), 'the Next-tournament screen overflows sideways at 375 px').toBeLessThanOrEqual(0)

  // ⭐ THE PICTURE IS SQUARE ON A REAL PHONE, measured rather than read off a stylesheet. `aspect-ratio`
  // is a floor here and not a clamp (the read can push the box taller on a narrow phone), so this
  // asserts it is AT LEAST square and never wider than the column it sits in.
  const hero = (await panel.locator('.nt-hero').boundingBox())!
  expect(hero, 'the hero is laid out').not.toBeNull()
  expect(hero.width, 'the picture is inside the phone').toBeLessThanOrEqual(375)
  expect(hero.height / hero.width, 'square, or taller when the read needs the room').toBeGreaterThanOrEqual(0.99)

  // ⭐⭐ ROUND 30 #18 – AND NOW IT RUNS TO THE EDGE: «в край, как hero картинка на главной». #6 left
  // this open on purpose and asked; the owner ruled, and this is the layer that can answer for it.
  // `.nt-hero` cancels `--app-pad-x` with a negative margin, which happy-dom can only read as a
  // DECLARATION – it has no layout engine, so a mounted test cannot tell a margin that reaches the
  // phone's edge from one that is simply written down.
  //
  // ⚠ THE ASSERTION ABOVE IS RE-AIMED, NOT REPLACED. «inside the phone» is now an equality at both
  // edges, and it keeps guarding the direction that must never relax: wider than 375 is overflow,
  // and the page-level check further up is what that would break.
  expect(hero.x, 'the picture does not start at the left edge of a 375px phone').toBeLessThanOrEqual(0.5)
  expect(hero.x + hero.width, 'the picture does not reach the right edge of a 375px phone').toBeGreaterThanOrEqual(374.5)

  // ...and the plate below does NOT follow it out of the gutter – «И плашки дальше как на главной на
  // своих подложках». That is Home's composition exactly: the photograph is the page, and every
  // object after it is laid ON the page, inset. A full-bleed hero with a full-bleed plate under it
  // is a different screen from the one he described, and this is the assertion that tells them apart.
  const plate = (await panel.locator('.nt-first').boundingBox())!
  expect(plate, 'the rounds plate is laid out').not.toBeNull()
  expect(plate.x, 'the rounds plate lost the app gutter on the left').toBeGreaterThanOrEqual(15.5)
  expect(plate.x + plate.width, 'the rounds plate lost the app gutter on the right').toBeLessThanOrEqual(359.5)
  // ...and the four icons under it are all on the screen, in one row, which is the clause a square
  // picture plus four cells is most likely to break.
  const facts = panel.locator('.nt-fact')
  expect(await facts.count()).toBe(4)
  const boxes = await facts.all()
  const tops = await Promise.all(boxes.map(async (f) => (await f.boundingBox())!.y))
  expect(new Set(tops.map((t) => Math.round(t))).size, 'the four icons are one row, not two').toBe(1)
  for (const f of boxes) {
    const b = (await f.boundingBox())!
    expect(b.x, 'an icon starts off the left of a 375px phone').toBeGreaterThanOrEqual(0)
    expect(b.x + b.width, 'an icon runs off a 375px phone').toBeLessThanOrEqual(375)
  }

  expect(crashes, 'the app threw at 375 px').toEqual([])
})

// ⭐⭐⭐ ROUND 36 PHASE 5 – THE THIRD CARD OF A WEEK IS REACHABLE WITHOUT A FINGER.
//
// The owner: «Давай уберем свайп css и сделаем js функционал для листания горизонтального, тогда
// будет полный паритет на всех устройствах и ничего не надо изобретать» – and «у нас на всех
// устройствах могут появиться стрелки для листания в дополнение к JS свайпу».
//
// ⚠⚠ WHY THIS IS A BROWSER TEST AND CANNOT BE ANYTHING ELSE. The claim is about a card that is off
// the side of a scroll container and about the two routes to it. `tests/component/` runs in
// happy-dom, where `scrollWidth`, `clientWidth` and every rect are ZERO, so "the card is off screen"
// and "the press brought it back" are both unaskable there. The arithmetic is held in
// `tests/weekPager.test.ts`; the arrows' presence at four widths is held by `e2e/parity.spec.ts`;
// what is held HERE is the thing neither can say – that a real Chromium, driven by a real keyboard
// and a real click, arrives at the card.
//
// ⚠ AND IT IS THE HOLE ROUND 34 SHIPPED WITH. `.week-stack.swipeable` had `overflow-x: auto` and no
// `tabindex`, so on a MOUSE the only routes to the second card were shift+wheel, a trackpad's
// two-finger gesture and drag-to-select autoscroll – none of which a player guesses, and the last of
// which `user-select: none` has since removed. From a keyboard there was no route at all. The parity
// harness cannot see that: it compares controls across widths, not input devices.
test('the last card of a stacked week is reachable by keyboard and by an arrow', async ({
  page,
  careerAt,
}) => {
  // ⚠ `sinking`, NOT `pro`. A pager only exists on a week that stacks several rungs she may enter,
  // and `pro` – eight seasons in, on the WTA rung alone – has none: its Season feed is three rows of
  // one card. `sinking` draws two stacked weeks. Measured, not assumed: the overflow is asserted
  // below before anything is pressed.
  await careerAt('sinking')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)

  const seasonTab = page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true })
  await seasonTab.click()
  await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()

  const row = page.locator('.week-row:has(.week-stack.swipeable)').first()
  const strip = row.locator('.week-stack.swipeable')
  await expect(strip).toBeVisible()

  /** Is the strip's LAST card wholly inside its window, and is the control on it pressable? */
  const lastCardState = () =>
    strip.evaluate((el) => {
      const cards = Array.from(el.querySelectorAll('.event-card'))
      const last = cards[cards.length - 1]
      const window = el.getBoundingClientRect()
      const box = last.getBoundingClientRect()
      const control = last.querySelector('.controls button, .controls .pill')
      const cbox = control?.getBoundingClientRect() ?? null
      return {
        cards: cards.length,
        overflow: el.scrollWidth - el.clientWidth,
        scrollLeft: el.scrollLeft,
        whollyInside: box.left >= window.left - 1 && box.right <= window.right + 1,
        controlInside:
          !!cbox && cbox.width > 0 && cbox.left >= window.left - 1 && cbox.right <= window.right + 1,
      }
    })

  const start = await lastCardState()
  // THE PRECONDITION, ASSERTED RATHER THAN ASSUMED: if the week did not stack, or the strip did not
  // overflow, everything below would pass about nothing.
  expect(start.cards, 'the fixture must stack more than one card on a week').toBeGreaterThan(1)
  expect(start.overflow, 'and the strip must actually overflow at 375, or there is nothing to reach').toBeGreaterThan(0)
  expect(start.whollyInside, 'the last card starts off the side of the strip').toBe(false)
  expect(start.controlInside, 'and so does the control on it').toBe(false)

  // --- ROUTE 1: THE KEYBOARD, AND NOTHING BUT THE KEYBOARD -----------------------------------
  //
  // ⚠ FOCUS IS TAKEN BY TABBING, NEVER BY `.focus()` OR A CLICK. Calling `focus()` would prove a
  // route a player has no way to walk, which is precisely the gap this test exists for: before the
  // strip became a tab stop there was NO number of Tab presses that reached it.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  let onStrip = false
  for (let press = 0; press < 200 && !onStrip; press++) {
    await page.keyboard.press('Tab')
    onStrip = await strip.evaluate((el) => el === document.activeElement)
  }
  expect(onStrip, 'no number of Tab presses reached the strip – it is not a tab stop').toBe(true)

  await page.keyboard.press('ArrowRight')
  await expect
    .poll(() => strip.evaluate((el) => el.scrollLeft), {
      message: 'ArrowRight on the focused strip moved nothing',
    })
    .toBeGreaterThan(start.scrollLeft)
  // ⚠ THE POLL IS ON THE STRICTER HALF, AND THAT IS NOT A DETAIL. The scroll is animated, and the
  // card's CONTROL (bottom left) crosses into the window several frames before the card's own right
  // edge does – polling on the control passed mid-animation and then the assertion under it read a
  // strip that was still moving. Measured on the first run.
  await expect
    .poll(async () => (await lastCardState()).whollyInside, {
      message: 'the keyboard never brought the last card fully into the strip',
    })
    .toBe(true)
  expect((await lastCardState()).controlInside, 'and the control on it is pressable').toBe(true)

  // --- ROUTE 2: THE ARROW, from a fresh mount so the first route cannot be doing the work -------
  await page.getByRole('navigation').getByRole('button', { name: 'Trophies', exact: true }).click()
  await seasonTab.click()
  await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()
  expect((await lastCardState()).whollyInside, 'the remount starts at the head of the strip again').toBe(false)

  const next = row.getByRole('button', { name: 'Next', exact: true })
  // ⭐ THE ARROWS ARE STATEFUL AND THAT IS PART OF THE CLAIM: Back is dead at the head of the strip,
  // Next is live because there is something past the edge.
  await expect(row.getByRole('button', { name: 'Back', exact: true })).toBeDisabled()
  await expect(next).toBeEnabled()
  await next.click()
  await expect
    .poll(async () => (await lastCardState()).whollyInside, {
      message: 'pressing Next never brought the last card fully into the strip',
    })
    .toBe(true)
  expect((await lastCardState()).controlInside, 'and the control on it is pressable').toBe(true)
  await expect(next, 'and at the end of the strip the arrow goes quiet').toBeDisabled()
  await expect(row.getByRole('button', { name: 'Back', exact: true })).toBeEnabled()
})

// ⭐⭐⭐ ROUND 36 PHASE 7 – THE COMPLEMENT, AND HIS RULING TURNED IT ROUND.
//
// It used to assert that at 1280 the same week's arrows «are there and disabled», which was phase
// 5's answer and which `weekPager.ts` argued for. He looked at it in the shipped build and ruled the
// other way: «на десктопе неделя из двух карточек показывает две серые стрелки, которые ей никогда
// не понадобятся. Спрятать – да, показываем только если есть что листать.» So this now measures the
// ruling – nothing past the edge, no pager – and the price is a stated exemption in
// `e2e/parity.spec.ts`, whose honest half holds the other direction.
//
// ⚠⚠ AND IT ANSWERS THE KEYBOARD QUESTION RATHER THAN ASSUMING IT. Left/Right are handled on the
// ROW, never on the arrows, so hiding the arrows cannot take the keyboard route away – but «cannot»
// is a claim, and this is where it is checked. What the check finds is the honest answer: the strip
// is still a tab stop at 1280 and Left/Right still reach the pager, and they move NOTHING, because a
// strip with nothing past its edge has nowhere to go. The route survives; there is simply no journey.
test('at 1280 the same week needs no paging, so it has no arrows – and the keyboard route survives', async ({
  page,
  careerAt,
}) => {
  await careerAt('sinking')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('navigation').getByRole('button', { name: 'Season', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Season Planner' })).toBeVisible()

  const row = page.locator('.week-row:has(.week-stack.swipeable)').first()
  const strip = row.locator('.week-stack.swipeable')
  const state = await strip.evaluate((el) => ({
    cards: el.querySelectorAll('.event-card').length,
    overflow: el.scrollWidth - el.clientWidth,
  }))
  // ⚠ RE-AIMED BY R37-3 (05.09) – THE ASSERTION IS UNTOUCHED AND ITS REASON IS NOT. It said «D16's
  // finding, read back in a browser: three cards fit at this width», which was true while the desktop
  // column was a third of the row. The owner then asked for the tablet's grid on the desktop –
  // «сетку на 2 карточки desktop (как на tablet) по дефолту» – so three no longer fit, and a two-card
  // week fits whole for the OTHER reason: the pair now fills the row exactly (measured in Chromium on
  // this fixture, 468px + 12px + 468px = 948px of row at 1280). Either way there is nothing past the
  // edge, which is what this test is about – but a comment that kept the old reason would be a lie
  // the day somebody read it, and the three-card case is measured in
  // tests/component/round34-week-stack.test.ts's `R37-3` arms instead.
  expect(state.cards).toBeGreaterThan(1)
  expect(state.overflow, 'a two-card week fits whole at 1280').toBe(0)
  await expect(row.locator('.week-arrow'), 'a week that fits whole draws no pager').toHaveCount(0)
  await expect(
    row.locator('.week-pager'),
    'and the container the parity exemption names goes with them',
  ).toHaveCount(0)

  // --- THE KEYBOARD, WITHOUT ARROWS TO PRESS -------------------------------------------------
  //
  // ⚠ TABBED TO, NEVER `.focus()`ed – the same rule the test above gives its reason for: a route a
  // player cannot walk is not a route.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  let onStrip = false
  for (let press = 0; press < 200 && !onStrip; press++) {
    await page.keyboard.press('Tab')
    onStrip = await strip.evaluate((el) => el === document.activeElement)
  }
  expect(
    onStrip,
    'the strip stopped being a tab stop when its arrows went – the two are separate and must stay so',
  ).toBe(true)

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(400)
  expect(
    await strip.evaluate((el) => el.scrollLeft),
    'ArrowRight on a strip that fits whole moved it – there is nowhere to move to',
  ).toBe(0)
  // ⭐ AND THE SAME KEY DOES REACH THE PAGER, which is the difference between «the route survives»
  // and «the route was quietly removed». `pager.key` calls `preventDefault` on every Left/Right
  // inside a week's row, arrows or no arrows, so a swallowed key is the proof the handler ran.
  const reached = await row.evaluate(
    // `dispatchEvent` returns false exactly when a handler called `preventDefault`, which is the
    // one observable trace `pager.key` leaves on a strip it cannot scroll.
    (el) =>
      !el.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      ),
  )
  expect(reached, 'Left/Right no longer reach the pager on a week with no arrows').toBe(true)
})

// =================================================================================================
// ⭐⭐⭐ ROUND 36, THE SECOND PASS FROM HIS STAND (05.09.2026) – HOME'S DESKTOP, IN A REAL BROWSER
// =================================================================================================
//
// Three of the four items in this pass are claims about BOXES, and this is the only layer that can
// answer them: `tests/component/` parses the cascade and does no layout, so it can prove a rule is
// ON at a width and never that two cards are the same width. His own words are in
// docs/rounds/round-36-review.md; the readings are in docs/specs/responsive-decisions-2026-09.md.

/** Every box this pass is about, at one width, as the browser measures it. */
async function homeBoxes(page: Page): Promise<Record<string, { x: number; w: number } | null>> {
  return page.evaluate(() => {
    const box = (sel: string): { x: number; w: number } | null => {
      const el = document.querySelector(sel)
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { x: +b.x.toFixed(2), w: +b.width.toFixed(2) }
    }
    return {
      hero: box('.diary-hero'),
      coach: box('.card-pair .coach-card'),
      memory: box('.card-pair > .note-card:not(.coach-card)'),
      season: box('.strip-pair > *:not(#diary-news)'),
      news: box('#diary-news'),
    }
  })
}

/**
 * ⭐⭐⭐ P2-2 – «сетка на главной на десктоп не исправлена (см. мои правки предыдущие, мне нужно
 * продублировать или нашел?)»
 *
 * Found. Review #5's «нижний блок карточек имеет свою сетку, они равны по ширине» was built for ONE
 * row and he meant every row below the photograph. Measured on the build he played, at 1024:
 *
 *     coach note + recent memory   236 / 627.5, both 380.5 wide   – review #5's grid
 *     season + news                236 / 698,   451 and 310 wide  – still the HERO's tracks
 *
 * ⚠ THE ASSERTIONS ARE RELATIONS, NOT LITERALS, and deliberately: the two tracks are `1fr 1fr` of
 * whatever the frame is, so a pinned 380.5 would go red the day the app's padding changed and would
 * say nothing about the thing he is looking at. What he is looking at is that the two rows line up –
 * same widths, same left edges, one gutter – and that is what is asserted, at both ends of the band.
 */
test('P2-2: Home’s two rows below the photograph are ONE grid, at 1024 and at 1280', async ({
  page,
  careerAt,
}) => {
  await careerAt('pro')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)

  for (const width of [1024, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
    await expect(page.getByRole('heading', { name: /^W\d+ \d{4} · /, level: 1 })).toBeVisible()
    const b = await homeBoxes(page)
    for (const [name, value] of Object.entries(b)) {
      expect(value, `${name} is not on the page at ${width}, so this measures nothing`).not.toBeNull()
    }
    const { hero, coach, memory, season, news } = b as Record<string, { x: number; w: number }>

    // ⭐ THE FOUR CARDS BELOW THE HERO ARE ONE WIDTH – «они равны по ширине», his own words, now for
    // both rows rather than for the upper one alone.
    expect(coach.w, `the coach note and the memory disagree at ${width}`).toBe(memory.w)
    expect(season.w, `the season ladder is not the coach note's width at ${width}`).toBe(coach.w)
    expect(news.w, `the news feed is not the memory's width at ${width}`).toBe(memory.w)

    // ⭐⭐ AND ONE GUTTER: the left edges of both rows agree, so the channel between the two columns
    // is a single straight line down the page. This is the defect as he sees it – before the fix the
    // lower row's gutter sat 70px away from the one above it at 1024.
    expect(season.x, `the lower row does not start where the upper one does at ${width}`).toBe(coach.x)
    expect(news.x, `the two gutters are not the same gutter at ${width}`).toBe(memory.x)
    expect(
      +(memory.x - (coach.x + coach.w)).toFixed(2),
      `the gutter is not the grid's own 11px gap at ${width}`,
    ).toBe(11)

    // ⚠ AND THE HERO'S ROW KEEPS ITS OWN ASYMMETRIC TRACKS – review #4 is his own measurement
    // («ширина этих карточек в макете около 310 пикселей») and this item does not touch it.
    expect(
      hero.w,
      `the photograph's row was flattened into the equal pair at ${width} – #4 asked for the opposite`,
    ).not.toBe(season.w)
    expect(hero.x, 'the photograph moved off the left edge of the grid').toBe(coach.x)
  }
})

/**
 * ⭐⭐⭐ P2-4 – «если колокольчик, письмо и шестеренка только на главной работают - давай их вернем на
 * картинку в угол правый верхний». It reverses `D74`, on his own premise: the second half of review
 * #2 («доступно на всех экранах») is not built and `D76` says why, so three controls that only work
 * on Home belong on Home's photograph.
 */
test('P2-4: the bell, the letter and the gear are in the photograph’s top-right corner at 1280', async ({
  page,
  careerAt,
}) => {
  await careerAt('pro')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
    await expect(page.getByRole('heading', { name: /^W\d+ \d{4} · /, level: 1 })).toBeVisible()

    const placed = await page.evaluate(() => {
      const hero = document.querySelector('.diary-hero')
      const tools = document.querySelector('.diary-head > .diary-tools')
      if (!hero || !tools) return null
      const h = hero.getBoundingClientRect()
      const t = tools.getBoundingClientRect()
      return {
        icons: tools.querySelectorAll('button.diary-tool').length,
        onPage: document.querySelectorAll('button.diary-tool').length,
        pageCopies: document.querySelectorAll('.diary-tools-page').length,
        // Inside the picture, hard against its right edge and its top.
        fromRight: +(h.right - t.right).toFixed(2),
        fromTop: +(t.top - h.top).toFixed(2),
        insideX: t.left >= h.left && t.right <= h.right,
        insideY: t.top >= h.top && t.bottom <= h.bottom,
      }
    })
    expect(placed, `the hero or its tool row is missing at ${width}`).not.toBeNull()
    expect(placed!.icons, `there are not three icons on the photograph at ${width}`).toBe(3)
    expect(placed!.onPage, `a second copy of the row is drawn at ${width}`).toBe(3)
    expect(placed!.pageCopies, `D74's off-picture copy is still rendered at ${width}`).toBe(0)
    expect(placed!.insideX && placed!.insideY, `the row is off the photograph at ${width}`).toBe(true)
    // `.diary-head` insets the row 18px from the picture's right edge and 20px from its top, at
    // every width – the same two numbers a phone has always used.
    expect(placed!.fromRight, `the row is not against the right edge at ${width}`).toBe(18)
    expect(placed!.fromTop, `the row is not at the top of the picture at ${width}`).toBeLessThan(40)
  }
})

/**
 * ⭐⭐⭐ P2-3 and P2-6 – «давай на главной десктопе текущую дату всю вынесем в 2 строки и поставим
 * справа от аватарки круглой, тогда она будет всегда видна и будет удобно», and «и аватар с текущей
 * позицией и рангом (так же, как и все остальные плашки) на десктоп в боковом меню живут на всех
 * страницах неизменно».
 *
 * The presence-on-every-screen half is `e2e/parity.spec.ts`'s, beside the exemption it costs. What
 * is measured here is the one thing only a browser can see: the two lines really are two lines, and
 * they really are to the RIGHT of her face rather than under it.
 */
test('P2-3: the week stands beside her face in the rail, on two lines, at 1280', async ({
  page,
  careerAt,
}) => {
  await careerAt('pro')
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.getByRole('navigation').getByRole('button', { name: 'Stats', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Stats', level: 2 })).toBeVisible()

  const seen = await page.evaluate(() => {
    const avatar = document.querySelector('#app > nav.tab-bar > .rail-id .diary-avatar-btn')
    const date = document.querySelector('#app > nav.tab-bar > .rail-id .rail-id-date')
    const week = document.querySelector('#app > nav.tab-bar > .rail-id .rail-id-week')
    const range = document.querySelector('#app > nav.tab-bar > .rail-id .rail-id-range')
    if (!avatar || !date || !week || !range) return null
    const a = avatar.getBoundingClientRect()
    const d = date.getBoundingClientRect()
    const w = week.getBoundingClientRect()
    const r = range.getBoundingClientRect()
    return {
      // «справа от аватарки»: the date's left edge is past the avatar's right edge, and the two
      // share a horizontal band rather than being stacked.
      toTheRight: d.left >= a.right,
      overlapsVertically: d.top < a.bottom && d.bottom > a.top,
      // «в 2 строки»: the second line starts below the first, and the two do not share a baseline.
      twoLines: r.top >= w.bottom - 1,
      lines: [week.textContent?.trim() ?? '', range.textContent?.trim() ?? ''],
      widthUsed: +d.width.toFixed(2),
      railWidth: +(document.querySelector('#app > nav.tab-bar')?.getBoundingClientRect().width ?? 0).toFixed(2),
    }
  })
  expect(seen, 'the rail draws no date beside her face at 1280').not.toBeNull()
  expect(seen!.toTheRight, 'the week is not to the right of the round avatar').toBe(true)
  expect(seen!.overlapsVertically, 'the week is under her face rather than beside it').toBe(true)
  expect(seen!.twoLines, 'the week is one line, not two').toBe(true)
  // The two lines put back together with the heading's own separator ARE the heading on the
  // photograph – the machine version of «всю». `tests/dates.test.ts` pins the join itself.
  expect(seen!.lines[0], 'the first line is not our week label').toMatch(/^W\d+ \d{4}$/)
  expect(seen!.lines[1], 'the second line is not the week’s days').toMatch(/^[A-Z][a-z]{2} \d+ – [A-Z][a-z]{2} \d+$/)
  // …and it fits the strip it lives in, which is the fit half a mounted test cannot answer.
  expect(seen!.widthUsed, 'the date is wider than the rail it sits in').toBeLessThan(seen!.railWidth)
})
