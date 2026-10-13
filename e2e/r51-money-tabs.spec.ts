// JOURNEY: THE FAMILY BUDGET'S CHAPTER STRIP IN RUSSIAN ON A PHONE – ROUND 51 №1a AND №18.
//
// SEAM OWNED: #4, real layout at real sizes. The claim is a NUMBER OF PIXELS and happy-dom lays out nothing:
// `tests/component/r51-money-tabs-strip.test.ts` holds the CSS contract (which rule reaches the strip) and the
// wiring (a chapter change scrolls the strip), and this file holds the part only a browser can say – that the page
// really does not scroll sideways, that the strip really does, and where the bottom bar really is.
//
// THE RULING (owner, 13.10): «нужен скролл самих пилюль горизонтальный в этом случае без горизонтального скролла
// страницы». In Russian the four chapter words ask about 430 px of the 343 a 375 px phone leaves the row; the pills
// scroll inside their own strip and the PAGE must not move sideways. (The wrap that guarded the row under 360 px since
// R-L4 is gone – one mechanism at every width.)
//
// №18 IS THE SECOND QUESTION OF THE SAME BOOT, AND IT IS A HYPOTHESIS BEING TESTED, NOT A FIX BEING CLAIMED. The owner:
// on the Family budget «нижнего основного меню не видно… появляется только при прямом скролле сверху-вниз». The code
// proves no hide-on-scroll and no containing-block trap (the bar is `position: fixed; bottom: 0`, a sibling of `main`),
// so the working guess (H1) is that the Russian page's layout was WIDER than the screen – the strip's overflow – and a
// fixed bar anchored to a layout wider than the screen is not where the eye is until a scroll resyncs them. If that is
// right the strip fix closes №18 for free, and the third step below is the discriminator: the bar's rectangle on entry
// and after two chapter switches.
//
// ⚠ THE GEOMETRY IS PRINTED, NOT ONLY ASSERTED (`B13_GEOM` lines): a green run and a red run must both leave the
// numbers behind, because the verdict on №18 needs them either way – and because the assertions about the bar are SOFT,
// so a red first step does not hide the bar's numbers. ⚠ THE INSTRUMENT'S LIMIT, STATED HERE AND NOT ONLY IN THE
// REPORT: this is Chromium's mobile emulation (`isMobile`, touch). Whether iOS WebKit lays a widened page out the same
// way is not something this file can say; a green run proves the bar is on screen in Chromium once the strip is
// contained, and a red run on the pre-fix CSS is what would make that green mean something.
//
// ⚠ ONE BOOT, LABEL-AGNOSTIC WHERE IT CAN BE. The fixture is the `pro` career in Russian (`e2e/lqa/kit.ts` is the
// precedent), so the blocking cards at boot are answered by shape (answers then the last control; buttons then the
// first), not by their English names. The pills are addressed by position and checked by `nameOf`, which follows the
// catalog in both directions – this spec must not go red on the day a translation changes.
import { test, expect } from './careerAt'
import { DOOR, nameOf, ruCareer } from './lqa/kit'
import type { Locator, Page } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

/** Whatever the boot put in front of Home, answered by shape (the LQA kit's `clearBlockingCards`, minus the recorder). Bounded. */
async function clearBlockingCards(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog')
  for (let i = 0; i < 6; i++) {
    if ((await dialog.count()) === 0) return
    const card = dialog.first()
    const radios = card.getByRole('radio')
    if (await radios.count()) {
      await radios.first().click()
      await card.getByRole('button').last().click()
    } else {
      await card.getByRole('button').first().click()
    }
    await expect(card, 'the blocking card did not go away').toBeHidden({ timeout: 2_000 }).catch(() => undefined)
  }
}

interface Box {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

interface Geometry {
  doc: { scrollWidth: number; clientWidth: number; scrollLeft: number; scrollTop: number }
  win: { innerWidth: number; innerHeight: number }
  vv: { width: number; height: number; scale: number; offsetLeft: number; offsetTop: number } | null
  strip: { scrollWidth: number; clientWidth: number; scrollLeft: number } | null
  nav: Box | null
  /** True when the element painted at the bar's centre is the bar (or inside it): nothing sits over it, and it is not off screen. */
  navHit: boolean
}

/** Everything the two questions need, in one round trip, printed as a `B13_GEOM` line so the numbers survive a green run. */
async function geometry(page: Page, label: string): Promise<Geometry> {
  const g = await page.evaluate((): Geometry => {
    const de = document.documentElement
    const box = (el: Element | null): Box | null => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
    }
    const strip = document.querySelector<HTMLElement>('.money-tabs')
    const nav = document.querySelector('nav.tab-bar')
    const navBox = box(nav)
    const hit = navBox ? document.elementFromPoint(navBox.left + navBox.width / 2, navBox.top + navBox.height / 2) : null
    const vv = window.visualViewport
    return {
      doc: { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, scrollLeft: de.scrollLeft, scrollTop: de.scrollTop },
      win: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
      vv: vv ? { width: vv.width, height: vv.height, scale: vv.scale, offsetLeft: vv.offsetLeft, offsetTop: vv.offsetTop } : null,
      strip: strip ? { scrollWidth: strip.scrollWidth, clientWidth: strip.clientWidth, scrollLeft: strip.scrollLeft } : null,
      nav: navBox,
      navHit: !!(nav && hit && nav.contains(hit)),
    }
  })
  console.log(`B13_GEOM ${label} ${JSON.stringify(g)}`)
  return g
}

/**
 * №18's discriminator: the bottom bar's rectangle lies fully inside what the player SEES, and nothing is painted over it. SOFT, so every
 * state reports.
 *
 * ⚠⚠ THE BOUNDS ARE THE VISUAL VIEWPORT, NOT `window.innerHeight` – MEASURED, AND IT IS THE REASON THIS IS NOT THE LITERAL CHECK. On the
 * build before the strip fix (Russian, 375x812) Chromium widened the LAYOUT viewport to fit the overflowing page: `innerWidth` 433 and
 * `innerHeight` 938, while the visual viewport stayed 375x812. The `position: fixed; bottom: 0` bar is anchored to the layout viewport, so
 * it sat at y 886..938 – wholly below the 812 rows the player sees – and `bottom <= innerHeight` still PASSED (938 <= 938): the literal
 * check is blind to exactly the failure it exists for, because the number it compares against is the inflated one. The visual viewport is
 * the only box that says what is on the glass. The `innerHeight` line stays, as the cheap form of the same claim on a healthy page.
 */
function expectBarOnScreen(g: Geometry, where: string): void {
  expect.soft(g.nav, `${where}: the bottom bar is not in the document`).not.toBeNull()
  if (!g.nav) return
  const n = g.nav
  const seen = g.vv
    ? { left: g.vv.offsetLeft, top: g.vv.offsetTop, right: g.vv.offsetLeft + g.vv.width, bottom: g.vv.offsetTop + g.vv.height }
    : { left: 0, top: 0, right: g.win.innerWidth, bottom: g.win.innerHeight }
  expect.soft(n.bottom, `${where}: the bar's bottom edge (${n.bottom}) is below what is on screen (${seen.bottom})`).toBeLessThanOrEqual(seen.bottom + 0.5)
  expect.soft(n.top, `${where}: the bar's top edge (${n.top}) is above what is on screen (${seen.top})`).toBeGreaterThanOrEqual(seen.top - 0.5)
  expect.soft(n.left, `${where}: the bar starts left of the screen (${n.left} vs ${seen.left})`).toBeGreaterThanOrEqual(seen.left - 0.5)
  expect.soft(n.right, `${where}: the bar runs past the screen's right edge (${n.right} of ${seen.right})`).toBeLessThanOrEqual(seen.right + 0.5)
  expect.soft(n.bottom, `${where}: the literal check – bottom (${n.bottom}) <= innerHeight (${g.win.innerHeight})`).toBeLessThanOrEqual(g.win.innerHeight + 0.5)
  expect.soft(g.navHit, `${where}: the point at the bar's centre does not belong to the bar – it is covered`).toBe(true)
}

/** The pill's box lies inside the strip's own box: fully visible, not cut by either edge. */
async function insideStrip(pill: Locator, strip: Locator): Promise<boolean> {
  const p = await pill.boundingBox()
  const s = await strip.boundingBox()
  return !!p && !!s && p.x >= s.x - 0.5 && p.x + p.width <= s.x + s.width + 0.5
}

test('the Family budget in Russian at 375 px: the pills scroll inside their own strip, the page does not, and the bottom bar stays in sight', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  await careerAt('pro', ruCareer())
  await clearBlockingCards(page)
  await page.locator(DOOR.budget).click()

  const strip = page.locator('.money-tabs')
  await expect(strip, 'the budget screen opened').toBeVisible()
  const pills = strip.locator('button.tab-pill')
  await expect(pills).toHaveCount(4)
  // The chapters under test, by catalog and not by spelling – so a changed translation does not make this a red spec for the wrong reason.
  // (`contains`: a pill's text carries a trailing space after the label, and `exact` anchors at both ends.)
  await expect(pills.nth(1)).toHaveText(nameOf('Bills', 'contains'))
  await expect(pills.nth(3)).toHaveText(nameOf('Shop', 'contains'))

  // ---------------------------------------------------------------------------------------------
  // (a) THE PAGE DOES NOT SCROLL SIDEWAYS; THE STRIP DOES. Read off `documentElement`, the one-line definition of
  // "it does not fit" that responsive.spec.ts uses: a child that overflows its parent is a design decision, a
  // child that widens the PAGE is a bug on every screen at once.
  // ---------------------------------------------------------------------------------------------
  const entry = await geometry(page, 'entry')
  expect.soft(entry.doc.scrollWidth - entry.doc.clientWidth, `(a) the page scrolls sideways: scrollWidth ${entry.doc.scrollWidth} vs clientWidth ${entry.doc.clientWidth}`).toBeLessThanOrEqual(0)
  expect.soft(entry.strip, 'the strip is on the page').not.toBeNull()
  expect
    .soft(entry.strip!.scrollWidth, `(a) the four Russian pills must overflow the strip (scrollWidth ${entry.strip!.scrollWidth}, clientWidth ${entry.strip!.clientWidth}) – the scroll lives INSIDE it`)
    .toBeGreaterThan(entry.strip!.clientWidth)
  // The precondition of №18's hypothesis, asserted rather than assumed: the layout viewport IS the device width, nothing zoomed out.
  expect.soft(entry.win.innerWidth, '(a) the layout viewport is the device width').toBe(375)

  // ---------------------------------------------------------------------------------------------
  // (b) ALL FOUR PILLS ARE REACHABLE: scrolled to its end the strip shows the last pill whole, inside the screen, and the
  // page did not move with it.
  // ---------------------------------------------------------------------------------------------
  await strip.evaluate((el) => {
    el.scrollLeft = el.scrollWidth
  })
  const last = pills.nth(3)
  const atEnd = await geometry(page, 'strip-at-end')
  expect.soft(await insideStrip(last, strip), '(b) the last pill is cut by the strip\'s edge at the end of the scroll').toBe(true)
  const lastBox = await last.boundingBox()
  expect.soft(lastBox!.x + lastBox!.width, '(b) the last pill ends past the screen').toBeLessThanOrEqual(375 + 0.5)
  expect.soft(atEnd.doc.scrollLeft, '(b) scrolling the strip moved the PAGE sideways').toBe(0)
  expect.soft(atEnd.doc.scrollWidth - atEnd.doc.clientWidth, '(b) the page scrolls sideways at the end of the strip').toBeLessThanOrEqual(0)
  await strip.evaluate((el) => {
    el.scrollLeft = 0
  })

  // ---------------------------------------------------------------------------------------------
  // (c) №18's DISCRIMINATOR. The bar on entry (measured above, before the strip was touched) and after two chapter switches.
  // The first switch is a real tap on a pill that is on screen; the second is the one that needs the reveal: the strip is at
  // its start, the pressed pill is off the edge, and the chapter changes by a click that scrolls nothing itself – the way the
  // ledger button and the shop's front door change it.
  // ---------------------------------------------------------------------------------------------
  expectBarOnScreen(entry, '(c) on entry')

  await pills.nth(1).tap()
  await expect(pills.nth(1)).toHaveAttribute('aria-pressed', 'true')
  const afterBills = await geometry(page, 'after-bills')
  expectBarOnScreen(afterBills, '(c) after the second chapter')

  await pills.nth(3).evaluate((el: HTMLElement) => el.click())
  await expect(pills.nth(3)).toHaveAttribute('aria-pressed', 'true')
  // The reveal glides (the system did not ask for less motion), so it is waited for web-first – no sleep, as everywhere in this directory.
  // SOFT, like the bar's rectangle below it: a missing reveal must not hide the bar's numbers on the chapter after it.
  await expect
    .configure({ soft: true })
    .poll(() => insideStrip(last, strip), { message: '(c) the pressed chapter\'s pill was left hanging off the edge of the strip', timeout: 3_000 })
    .toBe(true)
  const afterShop = await geometry(page, 'after-shop')
  expectBarOnScreen(afterShop, '(c) after the fourth chapter')
  expect.soft(afterShop.doc.scrollLeft, 'revealing the pill moved the PAGE sideways').toBe(0)
  expect.soft(afterShop.doc.scrollWidth - afterShop.doc.clientWidth, 'the page scrolls sideways on the last chapter').toBeLessThanOrEqual(0)

  expect(crashes, 'the app threw while the strip was driven').toEqual([])
})
