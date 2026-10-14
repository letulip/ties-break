// JOURNEY: EVERY BUTTON THE GAME DRAWS SPEAKS THE APP'S FONT – ROUND 52, THE OWNER'S RULING OF 14.10 №2.
//
// SEAM OWNED: #4, real layout at real sizes. Happy-dom resolves no cascade against a loaded web font and lays out no text, so "this button
// is drawn in Manrope" and "this label still fits its pill once it is" are claims only a browser can make.
//
// THE RULING (docs/decisions.md, «ROUND 52, HIS ANSWERS ON THE CLOSE» №2): «Every button speaks the app's font» – `font-family: inherit` in
// the global `button` rule of style.css, shipped with a real-Chromium overflow sweep and before/after screenshots for his eye, because it
// changes how EVERY button no component patched for itself looks. A browser does not let a <button> inherit the body's face, so those
// buttons drew the browser's default (Arial in Chromium, the system face on a phone): on the first three screens of a new game, 12 of 12
// visible buttons drew Arial and none drew Manrope.
//
// TWO HALVES, AND ONLY THE FIRST RUNS IN THE ORDINARY SUITE.
//   THE NET (always on, a few seconds): on a device that has never run the game – the language choice, the prologue's first card and two
//   onboarding steps – and on Home, every visible button's first face is an app face (Manrope, Sora or Caveat). MUTATION-VERIFIED: with the
//   `font-family: inherit` line out of the global `button` rule it is red on all of them, and restored it is green.
//   THE CENSUS (BUTTON_CENSUS=1): the same walk over every pre-career screen and the eleven stations of `stations.ts`, in English and
//   Russian, at 375x667 and 320x568 (Chromium's mobile emulation, as the r51 sweep has it), after `document.fonts.ready`. It records per
//   visible button the first face, whether the label overflows its box (`scrollWidth > clientWidth + 1`) and its number of text lines, and
//   writes one JSON per (walk, locale, size) into BUTTON_CENSUS_OUT. BUTTON_SHOTS=<dir> saves the screenshots the owner looks at.
//
//   BUTTON_CENSUS=1 BUTTON_CENSUS_OUT=<dir> npx playwright test e2e/r52-button-font.spec.ts --project=chromium
//   BUTTON_SHOTS=<dir>                      npx playwright test e2e/r52-button-font.spec.ts --project=chromium
//
// ⚠ THE CONTROL ARM IS THE TREE WITHOUT THE CHANGE, run first and on the same machine: `webServer` builds whatever is on disk, so the
// "before" census is simply this file run before the style.css line exists. An arm that counted zero buttons is not a measurement, which is
// why every walk asserts its denominator (screens reached, buttons counted on each) and prints it as CENSUS_ROW / CENSUS_TOTAL.
//
// ⚠ `<button>` ELEMENTS ONLY. The title screen's "Tap to start" is a div with role="button" and the global rule does not reach it, so the
// title reads zero buttons by design; a <select> or <input> is a different rule and was not part of the ruling.
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Locator, Page } from '@playwright/test'
import { test, expect, TOUR_ANSWERED, type CareerAt } from './careerAt'
import { DOOR, nameOf, ruCareer, tabButton, whyFailed } from './lqa/kit'
import { SCREENS_ON_DISK } from './stations'

type Locale = 'en' | 'ru'
interface Size {
  width: number
  height: number
}

/** The three faces the app ships: `--font-heading` (Sora), `--font-body` (Manrope) and `--font-hand` (Caveat) in style.css. */
const APP_FACE = /^(Manrope|Sora|Caveat)$/

/** The owner's phone is 375x667; 320x568 is the narrowest and shortest screen the app supports (round-20 #3). */
const PHONES: readonly Size[] = [
  { width: 375, height: 667 },
  { width: 320, height: 568 },
]

/** A device that has never run the game: no `tb-locale`, no save – the language question comes first. */
const NEVER_RUN = { cookies: [], origins: [] }

// =================================================================================================
// THE INSTRUMENT
// =================================================================================================
interface Btn {
  /** Position among the screen's visible buttons, in document order. */
  i: number
  /** The visible words; the aria-label for an icon-only button. */
  label: string
  cls: string
  /** The first family of the computed `font-family`, quotes stripped. */
  face: string
  /** The whole computed stack, for a survivor's diagnosis. */
  stack: string
  px: number
  /** The layout box (offsetWidth / offsetHeight – unmoved by a transform that is still settling). */
  w: number
  h: number
  /** The label is wider than its box. */
  over: boolean
  /** Lines of text, by the client rects of its text nodes. A tile that stacks a flag over a name reads 2 by design; only a CHANGE means anything. */
  lines: number
}

function readButtons(page: Page): Promise<Btn[]> {
  return page.evaluate((): Btn[] => {
    const shown = (el: Element): boolean => {
      for (let p: Element | null = el; p; p = p.parentElement) {
        const s = getComputedStyle(p)
        if (s.display === 'none' || Number(s.opacity) === 0) return false
      }
      return getComputedStyle(el).visibility !== 'hidden' && el.getClientRects().length > 0
    }
    const linesOf = (el: Element): number => {
      const rects: DOMRect[] = []
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!(n.textContent ?? '').trim()) continue
        const range = document.createRange()
        range.selectNodeContents(n)
        for (const q of Array.from(range.getClientRects())) if (q.width > 0 && q.height > 0) rects.push(q)
      }
      rects.sort((a, b) => a.top - b.top)
      let lines = 0
      let bottom = -Infinity
      for (const q of rects) {
        if (q.top + q.height / 2 > bottom) {
          lines++
          bottom = q.bottom
        } else bottom = Math.max(bottom, q.bottom)
      }
      return lines
    }
    const out: Btn[] = []
    for (const b of Array.from(document.querySelectorAll('button'))) {
      if (!shown(b)) continue
      const s = getComputedStyle(b)
      const words = (b.textContent ?? '').replace(/\s+/g, ' ').trim()
      out.push({
        i: out.length,
        label: (words || b.getAttribute('aria-label') || '').slice(0, 48),
        cls: (b.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).slice(0, 3).join('.'),
        face: (s.fontFamily.split(',')[0] ?? '').trim().replace(/^["']|["']$/g, ''),
        stack: s.fontFamily,
        px: parseFloat(s.fontSize),
        w: b.offsetWidth,
        h: b.offsetHeight,
        over: b.scrollWidth > b.clientWidth + 1,
        lines: linesOf(b),
      })
    }
    return out
  })
}

/** Fonts and the finite animations have settled: a measurement taken in the fallback face or mid-slide is a measurement of the wrong page (r51's `settle`). */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const frame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()))
    await document.fonts.ready
    await frame()
    await frame()
    await document.fonts.ready
    const finite = document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
    await Promise.race([Promise.all(finite.map((a) => a.finished.catch(() => undefined))), new Promise((done) => setTimeout(done, 1_500))])
  })
}

type Visit = (screen: string) => Promise<void>

// =================================================================================================
// WALK 1 – A DEVICE THAT HAS NEVER RUN THE GAME
// =================================================================================================
/** The onboarding step's own pane, by step number – the wizard's `ob-*` classes (the step rail's text is a translated sentence). */
const STEP_PANES = ['.ob-welcome', '.ob-fields', '.ob-country', '.ob-family', '.ob-styles', '.ob-summary'] as const

/**
 * Language choice → title → the prologue's first card → onboarding steps 1..`lastStep`. Every control is reached by structure or by the
 * catalog (`nameOf`), never by an English word, so the same walk is the Russian one. The way out of the childhood is the LAST control on the
 * card, which is how smoke.spec.ts takes it too: every sentence there is a draft the owner rewrites, and a spec that named it would be red
 * for the wrong reason.
 */
async function walkFirstRun(page: Page, locale: Locale, visit: Visit, lastStep: number): Promise<void> {
  await page.goto('/')
  const prompt = page.getByRole('dialog')
  await expect(prompt.getByRole('button', { name: 'English' }), 'the language choice did not appear on a device that has never answered it').toBeVisible()
  await settle(page)
  await visit('Language choice')
  await prompt.getByRole('button', { name: locale === 'en' ? 'English' : 'Русский' }).click()

  const start = page.getByRole('button', { name: nameOf('Tap to start') })
  await expect(start).toBeVisible()
  await settle(page)
  await visit('Title')
  await start.click()

  await expect(page.locator('.prologue-card')).toBeVisible()
  await settle(page)
  await visit('Prologue card 1')
  await page.getByRole('dialog').getByRole('button').last().click()

  for (let step = 1; step <= lastStep; step++) {
    await expect(page.locator(STEP_PANES[step - 1] ?? '.ob-pane'), `onboarding step ${step} did not appear`).toBeVisible()
    await settle(page)
    await visit(`Onboarding step ${step}`)
    if (step === lastStep) return
    // Step 3's Next stays disabled until a country is picked (smoke.spec.ts); the first tile is as good as any.
    if (step === 3) await page.locator('.ob-tiles .ob-tile').first().click()
    await page.locator('.ob-foot .ob-cta').click()
  }
}

// =================================================================================================
// WALK 2 – THE ELEVEN STATIONS OF A CAREER
// =================================================================================================
// ⚠ COPIED FROM e2e/r51-overflow-sweep.spec.ts, NOT IMPORTED: Playwright refuses one spec importing another (the import would register the
// other file's tests here), and the helper is not worth a module of its own for two readers. It is the same eleven routes, spelled to work
// in both languages; the guard in the census compares the key set with the screens on disk, as r51's does, so a twelfth screen is a red line
// here as well as there.
interface Route {
  visit: (page: Page) => Promise<void>
  arrived: (page: Page) => Locator
}

const hook = (page: Page, selector: string): Locator => page.locator(`${selector}:visible`).first()
/** A dispatched click, bounded: the census measures drawing, and a missing control is a red line, never a hang (r51's `press`). */
const press = (target: Locator): Promise<void> => target.first().evaluate((el: HTMLElement) => el.click(), undefined, { timeout: 5_000 })
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

/** Whatever the boot put in front of Home, answered by shape (r51's `clearBlockingCards`). Bounded. */
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

/** Boot the `pro` career in the locale and bring up Home with nothing in front of it. */
async function bootHome(page: Page, careerAt: CareerAt, locale: Locale): Promise<void> {
  await careerAt('pro', locale === 'ru' ? ruCareer() : { localStorage: TOUR_ANSWERED })
  await clearBlockingCards(page)
  await goHome(page)
  await settle(page)
}

async function walkStations(page: Page, careerAt: CareerAt, locale: Locale, visit: Visit): Promise<void> {
  await bootHome(page, careerAt, locale)
  for (const [screen, route] of Object.entries(ROUTES)) {
    try {
      await goHome(page)
      await route.visit(page)
      await expect(route.arrived(page), `${screen}: the walk did not arrive`).toBeVisible({ timeout: 5_000 })
    } catch (error) {
      expect.soft(false, `[${locale}] ${screen} could not be reached, so it was not measured: ${whyFailed(error)}`).toBe(true)
      continue
    }
    await settle(page)
    await visit(screen)
  }
}

// =================================================================================================
// THE NET – ALWAYS ON
// =================================================================================================
type Capture = Record<string, Btn[]>

const describeBtn = (b: Btn): string => `"${b.label}" (${b.cls || 'button'}) draws ${b.face}`

function expectAppFaces(screen: string, buttons: readonly Btn[]): void {
  const offenders = buttons.filter((b) => !APP_FACE.test(b.face))
  expect.soft(buttons.length, `${screen}: no visible button was counted, so nothing was measured`).toBeGreaterThan(0)
  expect.soft(offenders.map(describeBtn), `${screen}: ${offenders.length} of ${buttons.length} visible buttons are not drawn in an app face`).toEqual([])
}

test.describe('round 52 №2 – every button speaks the app’s font', () => {
  test.use({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true })

  test.describe('a device that has never run the game', () => {
    test.use({ storageState: NEVER_RUN })
    test('the language choice, the prologue card and two onboarding steps draw every button in an app face', async ({ page }) => {
      test.setTimeout(120_000)
      const got: Capture = {}
      await walkFirstRun(page, 'en', async (screen) => void (got[screen] = await readButtons(page)), 3)
      for (const screen of ['Language choice', 'Prologue card 1', 'Onboarding step 1', 'Onboarding step 3']) expectAppFaces(screen, got[screen] ?? [])
    })
  })

  test('Home draws every button in an app face', async ({ page, careerAt }) => {
    await bootHome(page, careerAt, 'en')
    expectAppFaces('Home', await readButtons(page))
  })
})

// =================================================================================================
// THE CENSUS AND THE SCREENSHOTS – ENV-GATED, SO THE ORDINARY SUITE STAYS FAST
// =================================================================================================
const CENSUS = process.env.BUTTON_CENSUS === '1'
const CENSUS_DIR = process.env.BUTTON_CENSUS_OUT ?? join(process.cwd(), 'test-results', 'r52-button-census')
const SHOTS_DIR = process.env.BUTTON_SHOTS

/** Write one run's readings and print its denominator: every screen with the buttons counted on it. */
function report(kind: 'first-run' | 'stations', locale: Locale, size: Size, got: Capture, expectedScreens: number): void {
  const tag = `${kind} ${locale} ${size.width}x${size.height}`
  mkdirSync(CENSUS_DIR, { recursive: true })
  writeFileSync(join(CENSUS_DIR, `${kind}-${locale}-${size.width}x${size.height}.json`), JSON.stringify({ kind, locale, ...size, screens: got }, null, 1))
  let total = 0
  let notApp = 0
  for (const [screen, buttons] of Object.entries(got)) {
    const off = buttons.filter((b) => !APP_FACE.test(b.face)).length
    total += buttons.length
    notApp += off
    console.log(`CENSUS_ROW ${tag} | ${screen}: ${buttons.length} buttons, ${off} not in an app face, ${buttons.filter((b) => b.over).length} overflowing`)
  }
  console.log(`CENSUS_TOTAL ${tag} | ${Object.keys(got).length} screens, ${total} buttons, ${notApp} not in an app face`)
  expect(Object.keys(got).length, `${tag}: screens reached`).toBe(expectedScreens)
  for (const [screen, buttons] of Object.entries(got)) {
    // The title is a div with role="button"; every other screen has real <button>s, and one that reads zero was not measured.
    if (screen !== 'Title') expect.soft(buttons.length, `${tag} | ${screen}: buttons counted`).toBeGreaterThan(0)
  }
}

if (CENSUS) {
  test.describe('round 52 №2 – the census', () => {
    test('the eleven routes are the screens on disk', () => {
      expect(Object.keys(ROUTES).sort(), 'a new screen needs a route here, as it needs one in r51-overflow-sweep.spec.ts').toEqual(SCREENS_ON_DISK)
    })
    for (const size of PHONES) {
      test.describe(`${size.width}x${size.height}`, () => {
        test.use({ viewport: size, isMobile: true, hasTouch: true })
        for (const locale of ['en', 'ru'] as const) {
          test.describe(`first run, ${locale}`, () => {
            test.use({ storageState: NEVER_RUN })
            test('every pre-career screen', async ({ page }) => {
              test.setTimeout(120_000)
              const got: Capture = {}
              await walkFirstRun(page, locale, async (screen) => void (got[screen] = await readButtons(page)), 6)
              report('first-run', locale, size, got, 9)
            })
          })
          test(`stations, ${locale}`, async ({ page, careerAt }) => {
            test.setTimeout(120_000)
            const got: Capture = {}
            await walkStations(page, careerAt, locale, async (screen) => void (got[screen] = await readButtons(page)))
            report('stations', locale, size, got, Object.keys(ROUTES).length)
          })
        }
      })
    }
  })
}

if (SHOTS_DIR) {
  /** What the owner looks at, in the order of his list; the onboarding step is chosen by its button count after the walk. */
  const SHOT_OF: Readonly<Record<string, string>> = {
    'Language choice': 'language-choice',
    'Prologue card 1': 'prologue-card-1',
    'HomeScreen.vue': 'home',
    'SeasonScreen.vue': 'season',
    'KidScreen.vue': 'kid',
    'CoachMarketScreen.vue': 'coach-market',
  }
  test.describe('round 52 №2 – the screenshots', () => {
    // 2x so the letterforms are readable on the owner's laptop; the layout in CSS pixels is the 375x667 phone's.
    test.use({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const shoot = async (page: Page, name: string, locale: Locale): Promise<string> => {
      mkdirSync(SHOTS_DIR, { recursive: true })
      const path = join(SHOTS_DIR, `${name}-${locale}.jpg`)
      await page.screenshot({ path, type: 'jpeg', quality: 80 })
      return path
    }
    for (const locale of ['en', 'ru'] as const) {
      test.describe(`${locale}`, () => {
        test.describe('first run', () => {
          test.use({ storageState: NEVER_RUN })
          test('language choice, the prologue card, the busiest onboarding step', async ({ page }) => {
            test.setTimeout(120_000)
            const steps: { screen: string; count: number; path: string }[] = []
            await walkFirstRun(
              page,
              locale,
              async (screen) => {
                const name = SHOT_OF[screen]
                if (name) await shoot(page, name, locale)
                if (screen === 'Prologue card 1') {
                  // The card scrolls on a phone and its answers sit under the painting: the shot above shows the story, this one shows the buttons.
                  await page.locator('.prologue-card').evaluate((el) => void (el.scrollTop = el.scrollHeight))
                  await settle(page)
                  await shoot(page, 'prologue-card-1-answers', locale)
                }
                if (screen.startsWith('Onboarding step ')) {
                  const count = (await readButtons(page)).length
                  steps.push({ screen, count, path: await shoot(page, `onboarding-step${screen.slice(-1)}`, locale) })
                }
              },
              6,
            )
            const busiest = steps.reduce((a, b) => (b.count > a.count ? b : a))
            for (const s of steps) if (s !== busiest) unlinkSync(s.path)
            console.log(`SHOTS_ONBOARDING ${locale} | ${steps.map((s) => `${s.screen}: ${s.count}`).join(', ')} | kept ${busiest.screen}`)
          })
        })
        test('Home, Season, Kid, Coach Market', async ({ page, careerAt }) => {
          test.setTimeout(120_000)
          await walkStations(page, careerAt, locale, async (screen) => {
            const name = SHOT_OF[screen]
            if (name) await shoot(page, name, locale)
            if (screen === 'CoachMarketScreen.vue') {
              // Each coach row is a button holding a paragraph – the rows are where the new face costs the most lines, and they start below the first screenful.
              await page.locator('.cm-row').first().evaluate((el) => el.scrollIntoView({ block: 'center' }))
              await settle(page)
              await shoot(page, 'coach-market-rows', locale)
            }
          })
        })
      })
    }
  })
}
