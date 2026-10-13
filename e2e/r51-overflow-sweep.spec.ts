// JOURNEY: NO SCREEN OF THE APP SCROLLS SIDEWAYS – AT ANY WIDTH, IN EITHER LANGUAGE – ROUND 51 №1b.
//
// SEAM OWNED: #4, real layout at real sizes. Happy-dom lays out nothing, so "the page is no wider than the screen" is a claim only a
// browser can make, and a component test can only ever pin the CSS that is meant to cause it.
//
// THE OWNER'S ASK (13.10, after the Family-budget strip): «И предполагаю, что где-то еще по приложению это может быть, надо взять
// агентов и проверить все части и страницы приложения на всех экранах (мобил, десктоп, планшет) на этот предмет». B13 fixed the one
// offender he had SEEN (the Russian chapter strip, `r51-money-tabs.spec.ts`); this file is the check of everything else, and it is built
// to be run again, so the next screen that grows a row wider than a phone is a red line with a name on it and not a playtest report.
//
// WHY THIS IS NOT JUST A SCROLLBAR. B13 MEASURED THE MECHANISM: any sideways page overflow makes Chromium's mobile layout viewport grow to
// fit it (433x938 on a 375x812 phone), and the `position: fixed` bottom bar is anchored to THAT, so it sits wholly off the visual viewport.
// An overflowing page is a page with no navigation, which is why the owner saw "no bottom menu" and not "a horizontal scrollbar".
//
// ⚠ THE INSTRUMENT'S LESSON, WRITTEN HERE AS WELL AS IN B13'S SPEC: `bottom <= innerHeight` IS BLIND – `innerHeight` inflates with the layout
// viewport, so the very failure it exists for makes it pass. What is asserted per state is therefore
//   (1) `documentElement.scrollWidth <= documentElement.clientWidth`  – the page does not scroll sideways;
//   (2) `window.innerWidth === the emulated width`                    – the layout viewport did not inflate (the consequence, caught even
//                                                                       if (1) were somehow masked);
//   (3) no visible `position: fixed` box reaches past the layout viewport's edge – the third door, which (1) CANNOT see: a fixed box's
//       overflow is not part of the document's scrollable area, so a floating bar wider than a 320 px phone is cut off on the glass while
//       `scrollWidth` reads a clean 320. (The week bar's two buttons are the standing candidate.)
//
// THE MATRIX: phones 320 / 336 / 352 / 360 / 375 / 390 / 414 / 430 (Chromium mobile emulation – `isMobile` + touch, because the layout-viewport
// inflation only exists there) and 576 / 768 / 900 / 1024 / 1280 (tablet and desktop, plain – the emulation is a CONTEXT option and cannot
// change mid-test, so the two classes are two contexts), in English and Russian, over the eleven stations of `e2e/stations.ts` PLUS the rows
// inside them (34 states a width on `pro`). Four boots in all, each walking its widths in-page (`setViewportSize` then a fresh mount – the
// idiom `parity.spec.ts` set). About 20 s for the lot, so it is cheap enough to be a habit and not an audit.
//
// WHAT IT FOUND ON ITS FIRST RUN (14.10, before any fix): English was clean at every width. Russian overflowed below 375 px, in four places –
// More's playback rows (+37 px at 320), More's three-pill chapter strip (+2), the About table (+49, still +8 at 360) and the week recap's second
// tile row on ThisWeek (+18 at 320, +2 at 336) – and every one of them also widened the layout viewport. The 320 / 375 / 414 the owner named
// would have caught the first three and missed nothing only by luck; the ladder is denser because the thresholds belong to the content.
//
// ⭐ EVERY OFFENDER IN ONE RUN. All assertions are soft and every state prints a `SWEEP_CATCH` line (screen, state, width, locale, px, the
// widest elements) so one red run IS the catch list; the first red run's log is the evidence the fixes cite. `SWEEP_SUMMARY` prints the
// DENOMINATOR (how many states were measured at each width) – a sweep that reached nothing must not be able to look green.
//
// ⚠ LABEL-AGNOSTIC BY CONSTRUCTION. Every name goes through `nameOf`, which follows the Russian catalog in both directions, and the doors
// on Home are the app's own `data-tour` hooks, so a translation landing never turns this into a red spec for the wrong reason. Pills are
// pressed BY POSITION inside a named group: the row decides how many there are, this file does not.
//
// ⚠ THE EXEMPTION TABLE IS EMPTY AND IS MEANT TO STAY SO. Anything INTENTIONALLY wider than the screen is a decision the owner takes, and
// a decision is dated: a row there carries the day it was taken, the reason and a ceiling in pixels, so a future exception can be audited
// and cannot quietly grow.
import { test, expect, TOUR_ANSWERED, type CareerAt } from './careerAt'
import { DOOR, nameOf, ruCareer, tabButton, whyFailed } from './lqa/kit'
import { SCREENS_ON_DISK, STATIONS } from './stations'
import type { Locator, Page } from '@playwright/test'

type Locale = 'en' | 'ru'

/**
 * ⚠ THE LADDER IS DENSER THAN THE OWNER'S THREE POINTS, AND MEASURED WHY: an overflow starts at a WIDTH THE CONTENT CHOOSES. The week
 * recap's two tiles (Russian) need about 322 px of grid between them, so they overflow from 320 up to roughly 354 and are clean at 375
 * – a sweep that stepped 320 / 375 / 414 would have caught the narrowest phone and blessed every Galaxy-class 340–352 px screen in
 * between. 360 is the commonest Android width, 390 the current iPhone, 430 the Pro Max, 576 the suite's own default column, 900 the top
 * of the fluid tablet band. A width costs about a second a test, so the ladder is cheap and the points are not arbitrary.
 */
const PHONE_WIDTHS = [320, 336, 352, 360, 375, 390, 414, 430] as const
const WIDE_WIDTHS = [576, 768, 900, 1024, 1280] as const
const PHONE_HEIGHT = 812
const WIDE_HEIGHT = 900

/**
 * station@width → a DATED exemption for a box that is meant to be wider than the screen. `maxPx` is a CEILING: the page may overflow by
 * at most that much, so an exemption cannot absorb a later regression. EMPTY TODAY – round 51's sweep found nothing it could not fix.
 */
const EXEMPT: Readonly<Record<string, { decided: string; reason: string; maxPx: number }>> = {}

// =================================================================================================
// HOW EACH STATION IS REACHED – the same eleven as `STATIONS`, spelled so they work in both languages
// =================================================================================================
interface Route {
  visit: (page: Page) => Promise<void>
  arrived: (page: Page) => Locator
}

/** A visible element behind one of the app's own `data-tour` hooks (the rail can carry a second, hidden copy of a door). */
const hook = (page: Page, selector: string): Locator => page.locator(`${selector}:visible`).first()
/**
 * A dispatched click: the sweep measures LAYOUT, so it must still press a control on a page whose layout is exactly what is broken.
 * ⚠ BOUNDED, AND MEASURED WHY: `evaluate` waits for its element with no timeout of its own, so a door that is not on the screen at
 * some width (the first run: Kid's hook at 1024 px, where her block lives in the rail) hung to the TEST's timeout – five minutes of
 * four workers for one missing selector. An absent control is a finding and a red line, never a hang.
 */
const press = (target: Locator): Promise<void> => target.first().evaluate((el: HTMLElement) => el.click(), undefined, { timeout: 5_000 })
/**
 * A door on Home: the app's `data-tour` hook where it is on the screen, else the button by its name. From 1024 px her identity block
 * moves into the rail and its hook does not follow, but the BUTTON does – `stations.ts` reaches Kid by name for exactly that reason.
 */
const door = (page: Page, selector: string, name: RegExp): Locator =>
  page.locator(`${selector}:visible`).or(page.getByRole('button', { name })).first()
const heading = (page: Page, en: string, level?: number): Locator =>
  page.getByRole('heading', level ? { name: nameOf(en), level } : { name: nameOf(en) }).first()

const ROUTES: Record<string, Route> = {
  'HomeScreen.vue': { visit: async () => undefined, arrived: (page) => hook(page, DOOR.budget) },
  'SeasonScreen.vue': { visit: (page) => press(tabButton(page, 'play')), arrived: (page) => heading(page, 'Season Planner') },
  'CalendarScreen.vue': { visit: (page) => press(tabButton(page, 'calendar')), arrived: (page) => heading(page, 'Calendar', 2) },
  'StatsScreen.vue': { visit: (page) => press(tabButton(page, 'stats')), arrived: (page) => heading(page, 'Stats', 2) },
  'TrophiesScreen.vue': { visit: (page) => press(tabButton(page, 'trophies')), arrived: (page) => heading(page, 'Trophy cabinet', 1) },
  'MoneyScreen.vue': {
    visit: (page) => press(door(page, DOOR.budget, nameOf('Family budget', 'prefix'))),
    arrived: (page) => heading(page, 'Family Budget'),
  },
  'MoreScreen.vue': {
    visit: (page) => press(door(page, DOOR.settings, nameOf('Settings'))),
    arrived: (page) => page.getByRole('group', { name: nameOf('Which settings') }).first(),
  },
  'KidScreen.vue': {
    visit: (page) => press(door(page, DOOR.kid, nameOf('Open her profile'))),
    arrived: (page) => heading(page, 'Important moments', 3),
  },
  'AlbumScreen.vue': {
    visit: (page) => press(page.getByRole('button', { name: nameOf('Recent memory', 'prefix') })),
    arrived: (page) => page.getByRole('button', { name: nameOf('Next sheet') }).first(),
  },
  'CoachMarketScreen.vue': {
    visit: (page) => press(page.getByRole('button', { name: nameOf('Coach note – open the Coach Market') })),
    arrived: (page) => heading(page, 'Coach Market', 2),
  },
  'ThisWeekScreen.vue': {
    visit: (page) => press(door(page, DOOR.tournament, nameOf('Next tournament', 'prefix'))),
    arrived: (page) => heading(page, 'This week', 2),
  },
}

// =================================================================================================
// THE ROWS INSIDE A STATION – every pill of every segmented row, pressed in turn, because a row's overflow only shows when its widest
// state is the one on screen (a chapter can be wider than the one that opens first)
// =================================================================================================
interface Row {
  /** The row's accessible group name, in English – `nameOf` follows the catalog. */
  group: string
  /** Whatever must happen for this row to be on the screen (the shop's front door has to be passed before its shelf row exists). */
  open?: (page: Page) => Promise<void>
  /** Rows that appear under a pressed pill of this one. Absent ones are skipped: most chapters have none of them. */
  children?: Row[]
}

const openFirstShelf = async (page: Page): Promise<void> => {
  const card = page.locator('.shelf-cats .shelf-cat:visible').first()
  if ((await card.count()) > 0) await press(card)
}

const ROWS: Record<string, Row[]> = {
  'MoneyScreen.vue': [
    {
      group: 'Which part of the budget',
      children: [{ group: 'Budget period' }, { group: 'Which bills' }, { group: 'Which part of the shelf', open: openFirstShelf }],
    },
  ],
  'CoachMarketScreen.vue': [{ group: 'What this screen is about' }],
  'StatsScreen.vue': [{ group: 'Which ranking table' }],
  'MoreScreen.vue': [{ group: 'Which settings' }],
}

// =================================================================================================
// THE INSTRUMENT
// =================================================================================================
interface Reading {
  sw: number
  cw: number
  iw: number
  /** The elements that widen the page – the OUTERMOST boxes past the edge that no scrolling ancestor inside the page contains. */
  culprits: string[]
  /** The deepest of those boxes, with the first words they hold – the unbreakable thing that made the block wide. */
  deepest: string[]
  /** Visible `position: fixed` boxes reaching past the layout viewport's left or right edge. */
  fixedOut: string[]
}

function readPage(page: Page): Promise<Reading> {
  return page.evaluate((): Reading => {
    const de = document.documentElement
    const cw = de.clientWidth
    const sw = de.scrollWidth
    const describe = (el: Element): string => {
      const classes = (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).slice(0, 3).join('.')
      const r = el.getBoundingClientRect()
      return `${el.tagName.toLowerCase()}${classes ? `.${classes}` : ''}[${Math.round(r.left)}..${Math.round(r.right)}]`
    }
    const everything = Array.from(document.body.querySelectorAll('*'))

    const fixedOut: Element[] = []
    for (const el of everything) {
      const style = getComputedStyle(el)
      if (style.position !== 'fixed' || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.left < -1 || r.right > cw + 1) fixedOut.push(el)
    }

    let culprits: string[] = []
    let deepest: string[] = []
    if (sw > cw) {
      const wide: Element[] = []
      // A fixed box is sized by the LAYOUT viewport, which the overflow itself inflated: it is a consequence (and `fixedOut` says it), never the cause.
      const insideFixed = (el: Element): boolean => {
        for (let p: Element | null = el; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).position === 'fixed') return true
        return false
      }
      for (const el of everything) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.right <= cw + 0.5 || insideFixed(el)) continue
        // A box inside a scroll/clip container that itself fits the page is the container's business, not the page's.
        let contained = false
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          if (getComputedStyle(p).overflowX === 'visible') continue
          if (p.getBoundingClientRect().right <= cw + 0.5) {
            contained = true
            break
          }
        }
        if (!contained) wide.push(el)
      }
      const byRight = (a: Element, b: Element): number => b.getBoundingClientRect().right - a.getBoundingClientRect().right
      // The OUTERMOST boxes say which block is wide; the DEEPEST ones, with their words, say which unbreakable thing made it so.
      culprits = wide
        .filter((el) => !el.parentElement || !wide.includes(el.parentElement))
        .sort(byRight)
        .slice(0, 3)
        .map(describe)
      deepest = wide
        .filter((el) => !wide.some((o) => o !== el && el.contains(o)))
        .sort(byRight)
        .slice(0, 4)
        .map((el) => `${describe(el)} "${(el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32)}"`)
    }

    return {
      sw,
      cw,
      iw: window.innerWidth,
      culprits,
      deepest,
      fixedOut: fixedOut.filter((el) => !fixedOut.some((o) => o !== el && o.contains(el))).map(describe),
    }
  })
}

/** Fonts and the finite animations have settled: a measurement taken in the fallback face or mid-slide is a measurement of the wrong page. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const frame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()))
    await document.fonts.ready
    await frame()
    await frame()
    const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
    await Promise.race([Promise.all(finite.map((a) => a.finished.catch(() => undefined))), new Promise((done) => setTimeout(done, 1_500))])
  })
}

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

async function goHome(page: Page): Promise<void> {
  await press(tabButton(page, 'home'))
  await expect(hook(page, DOOR.budget), 'the walk did not get back to Home').toBeVisible({ timeout: 5_000 })
}

/** Home, through a different screen, so Home itself is MOUNTED FRESH at the new width (parity.spec's `park`, in both languages). */
async function park(page: Page): Promise<void> {
  await press(tabButton(page, 'trophies'))
  await expect(heading(page, 'Trophy cabinet', 1)).toBeVisible({ timeout: 5_000 })
  await goHome(page)
}

// =================================================================================================
// THE SWEEP
// =================================================================================================
interface Tally {
  stations: number
  states: number
  catches: number
}

function judge(reading: Reading, ctx: { locale: Locale; width: number; screen: string; state: string }, tally: Tally): void {
  tally.states++
  const over = Math.max(0, reading.sw - reading.cw)
  const problems: string[] = []
  if (over > 0) {
    problems.push(`the page scrolls sideways by ${over}px (scrollWidth ${reading.sw} > clientWidth ${reading.cw}); widest: ${reading.culprits.join(' | ') || 'none found'}; deepest: ${reading.deepest.join(' | ') || 'none found'}`)
  }
  if (reading.iw !== ctx.width) problems.push(`the layout viewport inflated to ${reading.iw}px on a ${ctx.width}px screen`)
  if (reading.fixedOut.length > 0) problems.push(`a fixed box reaches past the screen edge: ${reading.fixedOut.join(' | ')}`)
  if (problems.length === 0) return

  const exemption = EXEMPT[`${ctx.screen}@${ctx.width}`]
  if (exemption && over <= exemption.maxPx && reading.fixedOut.length === 0) {
    console.log(`SWEEP_EXEMPT ${JSON.stringify({ ...ctx, over, decided: exemption.decided, reason: exemption.reason })}`)
    return
  }
  tally.catches++
  console.log(`SWEEP_CATCH ${JSON.stringify({ ...ctx, over, sw: reading.sw, cw: reading.cw, iw: reading.iw, culprits: reading.culprits, deepest: reading.deepest, fixedOut: reading.fixedOut })}`)
  expect.soft(problems, `[${ctx.locale} ${ctx.width}px] ${ctx.state}: ${problems.join('; ')}`).toEqual([])
}

/** Press a pill and say whether the row took it – a disabled or absent segment is skipped, not failed: the sweep measures what is there. */
async function pressPill(pill: Locator): Promise<boolean> {
  try {
    await press(pill)
    await expect(pill).toHaveAttribute('aria-pressed', 'true', { timeout: 1_500 })
    return true
  } catch {
    return false
  }
}

async function walkRow(page: Page, row: Row, trail: string, top: boolean, visit: (state: string) => Promise<void>): Promise<void> {
  if (row.open) await row.open(page).catch(() => undefined)
  const group = page.getByRole('group', { name: nameOf(row.group) }).first()
  if ((await group.count()) === 0) {
    expect.soft(top, `${trail}: the "${row.group}" row was not on the screen, so its pills were not swept`).toBe(false)
    return
  }
  const pills = group.getByRole('button')
  const n = await pills.count()
  for (let i = 0; i < n; i++) {
    if (!(await pressPill(pills.nth(i)))) continue
    await settle(page)
    const state = `${trail} › ${row.group} ${i + 1}/${n}`
    await visit(state)
    for (const child of row.children ?? []) await walkRow(page, child, state, false, visit)
  }
}

async function sweep(
  page: Page,
  careerAt: CareerAt,
  locale: Locale,
  widths: readonly number[],
  height: number,
  testInfoAttach: (name: string, body: string) => void,
): Promise<void> {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))
  const started = Date.now()

  await careerAt('pro', locale === 'ru' ? ruCareer() : { localStorage: TOUR_ANSWERED })
  await clearBlockingCards(page)

  const perWidth: Record<number, Tally> = {}
  for (const width of widths) {
    const tally: Tally = { stations: 0, states: 0, catches: 0 }
    perWidth[width] = tally
    await page.setViewportSize({ width, height })
    await park(page)

    for (const [screen, route] of Object.entries(ROUTES)) {
      const visit = async (state: string): Promise<void> => {
        judge(await readPage(page), { locale, width, screen, state }, tally)
      }
      try {
        await goHome(page)
        await route.visit(page)
        await expect(route.arrived(page), `${screen}: the walk did not arrive`).toBeVisible({ timeout: 5_000 })
      } catch (error) {
        expect.soft(false, `[${locale} ${width}px] ${screen} could not be reached, so it was not swept: ${whyFailed(error)}`).toBe(true)
        continue
      }
      tally.stations++
      await settle(page)
      await visit(screen)
      for (const row of ROWS[screen] ?? []) await walkRow(page, row, screen, true, visit)
    }
    // The denominator: every station was reached at this width. A sweep that walked nothing reads as green, and this is what stops that.
    expect.soft(tally.stations, `[${locale} ${width}px] stations reached`).toBe(Object.keys(ROUTES).length)
    // The rows are the half of the denominator the station count cannot see: a child row that stops rendering (Bills' tabs, the shelf's) is
    // skipped BY DESIGN – most chapters have none of them – so without a floor the sweep would quietly stop measuring it. 34 a width on `pro` (14.10).
    expect.soft(tally.states, `[${locale} ${width}px] states measured – the rows inside the stations went missing`).toBeGreaterThanOrEqual(30)
  }

  const summary = widths.map((w) => `${w}px: ${perWidth[w].stations} stations, ${perWidth[w].states} states, ${perWidth[w].catches} catches`).join(' | ')
  console.log(`SWEEP_SUMMARY ${locale} ${widths.join('/')} – ${summary} – ${Math.round((Date.now() - started) / 1000)}s`)
  testInfoAttach('sweep-summary', summary)
  expect(crashes, 'the app threw while the sweep walked it').toEqual([])
}

// =================================================================================================
// THE SPECS
// =================================================================================================
test.describe('round 51 №1b – the page never scrolls sideways', () => {
  test('the sweep covers every screen the app has, on the one career it boots, and every exemption is dated', () => {
    expect(Object.keys(ROUTES).sort(), 'e2e/r51-overflow-sweep.spec.ts, e2e/stations.ts and src/components/screens/ disagree – a new screen needs a route here').toEqual(SCREENS_ON_DISK)
    expect(Object.keys(STATIONS).sort()).toEqual(SCREENS_ON_DISK)
    for (const [screen, station] of Object.entries(STATIONS)) {
      // One boot per locale is the design; a station that needs another career is a second boot, and it must be written, not assumed.
      expect(station.career ?? 'pro', `${screen} needs a career this sweep does not boot`).toBe('pro')
    }
    for (const [key, ex] of Object.entries(EXEMPT)) {
      expect(key, 'an exemption is keyed screen@width').toMatch(/^[A-Za-z]+Screen\.vue@\d+$/)
      expect(ex.decided, `${key}: an exemption carries the day it was decided`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(ex.reason.length, `${key}: an exemption carries its reason`).toBeGreaterThan(20)
      expect(ex.maxPx, `${key}: an exemption is a ceiling in pixels`).toBeGreaterThan(0)
    }
  })

  test.describe('phones – 320 to 430 px, Chromium mobile emulation', () => {
    test.use({ viewport: { width: 375, height: PHONE_HEIGHT }, isMobile: true, hasTouch: true })
    for (const locale of ['en', 'ru'] as const) {
      test(`${locale}: every station and every row, at every phone width`, async ({ page, careerAt }, testInfo) => {
        test.setTimeout(120_000)
        await sweep(page, careerAt, locale, PHONE_WIDTHS, PHONE_HEIGHT, (name, body) => void testInfo.attach(name, { body }))
      })
    }
  })

  test.describe('tablets and desktops – 576 to 1280 px, plain', () => {
    test.use({ viewport: { width: 1280, height: WIDE_HEIGHT } })
    for (const locale of ['en', 'ru'] as const) {
      test(`${locale}: every station and every row, at every wide width`, async ({ page, careerAt }, testInfo) => {
        test.setTimeout(120_000)
        await sweep(page, careerAt, locale, WIDE_WIDTHS, WIDE_HEIGHT, (name, body) => void testInfo.attach(name, { body }))
      })
    }
  })
})
