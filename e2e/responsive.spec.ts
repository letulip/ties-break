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
