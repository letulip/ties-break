// ⭐⭐⭐ THE PARITY HARNESS – «ВСЁ, ЧТО ЕСТЬ НА МОБИЛЕ, ДОЛЖНО БЫТЬ 1 К 1 НА ДРУГИХ ФОРМАТАХ».
//
// Round 36 phase 1 (docs/specs/responsive-2026-09.md). This file is built BEFORE any layout moves,
// and it is the instrument the whole responsive wave is measured by. The owner's acceptance
// criterion, in his own words and quoted in the spec:
//
//     «всё, что есть на мобиле, должно быть 1 к 1 по доступности быть и на других форматах»
//     «Все иконки наши, ничего нового по идее не должно появиться, как и старого уйти ничего не должно»
//
// ⚙ AND PLAYWRIGHT IS HIS OWN SUGGESTION – «возможно здесь как раз нас могу выручить playwright?».
// He is right, and it is the strictly stronger instrument for this question: `tests/component/` runs
// in happy-dom, which has NO LAYOUT ENGINE, so a mounted test can only prove a node EXISTS. A real
// browser proves it is in the accessibility tree, has a box, and is therefore reachable at a real
// viewport. `tests/component/fits.ts`'s whole header is this same argument from the other side.
//
// -------------------------------------------------------------------------------------------------
// WHAT IT DOES
// -------------------------------------------------------------------------------------------------
// For every screen the app has: walk to it at 375, record a FINGERPRINT, then walk to it again at
// 768, 900 and 1280 and assert the three wider fingerprints EQUAL the 375 one. A control present at
// 375 and absent at 1280 fails by name; a control that exists only at 1280 fails the same assertion
// from the other side, which is «ничего нового не должно появиться» as a machine check.
//
// ⭐⭐ ROUND 36 PHASE 3 WIDENED WHAT «IS ON THE SCREEN» MEANS, AND THE OWNER'S OWN WORDING IS WHY:
// every disclosure is opened, at every width, before the fingerprint is taken – so the claim is
// «the same things are REACHABLE at every width», not «the same things are drawn on arrival». See
// `openEveryDisclosure` below for the argument and for what it does not give up.
//
// -------------------------------------------------------------------------------------------------
// ⚠ WHAT IT CANNOT PROVE, SAID PLAINLY, BECAUSE A HARNESS THAT OVERSTATES ITSELF IS WORSE THAN NONE
// -------------------------------------------------------------------------------------------------
// It proves PRESENCE, VISIBILITY and REACHABILITY. It does not prove the layout is good, or that a
// screen is beautiful, or that the wide version is a design rather than a stretched phone. It cannot
// see a control that is on screen but ugly, mis-aligned, overlapping or too small for a thumb. That
// judgement is the owner's and he has said so – «я утром буду всё уже сам глазами смотреть».
//
// Three narrower limits, each of which is a real hole and not a quibble:
//   * IT IS BLIND TO ORDER. The fingerprint is a multiset, so a wide layout may reshuffle the same
//     controls freely. That is deliberate – rearranging IS the wave's job – but it means "the same
//     things are here" and not "in the same places".
//   * IT IS BLIND TO A DECORATIVE GLYPH THAT CARRIES NO FILE. Icons are counted by the asset they
//     load (see `paintFingerprint`), so an inline `<svg>` is counted by its class and a glyph drawn
//     with borders is not counted at all.
//   * IT SEES ONE STATE PER SCREEN. A screen has branches (an empty ledger, an injured week, an open
//     letter) and this walks one career through one route into each. A control that only ever exists
//     in a branch nobody walks is a control this cannot answer for.
//
// -------------------------------------------------------------------------------------------------
// ⚠⚠ AND IT IS BUILT SO A LATER PHASE CANNOT MAKE IT VACUOUS. Three separate mechanisms:
// -------------------------------------------------------------------------------------------------
//  1. THE SCREEN LIST IS DERIVED FROM THE FILESYSTEM, never written out. `src/components/screens/`
//     is a closed set – `coverage-map.spec.ts` already holds it against `docs/specs/e2e-coverage.md`
//     – and every file in it must have a station below or `every screen has a station` goes red
//     naming the file. A hand-written list is one forgotten screen away from proving nothing.
//  2. AN EMPTY FINGERPRINT IS THE OTHER WAY TO PROVE NOTHING, and it is the quiet one: four empty
//     sets are equal, so a station that silently failed to arrive would pass forever. So every
//     station asserts its own arrival against an anchor BEFORE it measures, and the measurement
//     itself has a floor (`FINGERPRINT_FLOOR`) fitted to the real numbers.
//  3. THE HEIGHT IS FIXED AT 900 FOR ALL FOUR WIDTHS. Only the width varies, so a difference cannot
//     be explained away by a taller viewport rendering more rows.
//
// ⚠ IT MUST BE GREEN THE DAY IT LANDS, and that is its own honesty check rather than a nice
// property: nothing has moved yet, the app is one column at every width, so a red run today would
// mean the harness is wrong. Green today and red the first time phase 2 drops a control is the
// entire point.

import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Locator, Page } from '@playwright/test'
import { test, expect, type CareerAt } from './careerAt'
import { answerOpeningKnock, dismissTourBriefing } from './journey'

// =================================================================================================
// HIS LADDER, AS THE FOUR WIDTHS THAT ARE ACTUALLY WALKED
// =================================================================================================
//
// One width per band of docs/specs/responsive-2026-09.md, so a rung that breaks names its own band:
//
//     375   the phone – the BASE every other width is compared against
//     768   the bottom of the tablet band, where the column first grows past the phone
//     900   the top of the fluid tablet band and the value the 901–1023 plateau pins to
//    1280   desktop, past the 1200 cap, so the column is capped AND centred
//
// ⚠ 375 IS THE BASE AND NOT 576. The suite's usual viewport is the owner's own phone; this file
// drops to the narrowest width the app supports because that is where «всё, что есть на мобиле»
// is measured – the smallest set is the one the wider formats must match.
const BASE_WIDTH = 375
const WIDER_WIDTHS = [768, 900, 1280] as const
const WIDTHS = [BASE_WIDTH, ...WIDER_WIDTHS] as const

/** ⚠ THE SAME HEIGHT AT EVERY WIDTH. Only the width is the variable under test; a viewport that got
 *  taller as it got wider would let "more rows fit" masquerade as a difference, and would let a real
 *  difference hide behind one. 900 is tall enough that no screen here is height-clipped. */
const VIEWPORT_HEIGHT = 900

// =================================================================================================
// THE SCREEN LIST, DERIVED
// =================================================================================================
const SCREEN_DIR = fileURLToPath(new URL('../src/components/screens/', import.meta.url))
const SCREENS_ON_DISK = readdirSync(SCREEN_DIR)
  .filter((f) => f.endsWith('.vue'))
  .sort()

interface Station {
  /** Walk from HOME to this screen, the way a player reaches it. */
  visit: (page: Page) => Promise<void>
  /**
   * Proof of arrival, asserted before anything is measured.
   *
   * ⚠ ROLE AND ACCESSIBLE NAME ONLY (e2e/README.md, journey.ts's header). Not one CSS selector:
   * an anchor addressed by class would keep finding its screen through a rename that broke every
   * real user of it, and this is the assertion the whole file's honesty rests on.
   */
  arrived: (page: Page) => Locator
}

/**
 * HOW EVERY SCREEN IS REACHED, and every route is the one a player uses.
 *
 * ⚠ THE APP HAS NO ROUTER. `App.vue` owns a single `tab` ref and that is the whole of its
 * navigation, so there is no URL to `goto` – docs/specs/e2e-coverage.md's "reached by" column is the
 * map, and journey.ts's `openMoney` / `openMore` are the two of these that already existed. The five
 * tabless screens are doors on Home: her photograph, the budget card, the coach note, the
 * next-tournament plate and the gear.
 *
 * ⚠ EVERY `visit` STARTS ON HOME, which is a contract with `park()` below rather than a coincidence:
 * the walker returns to Home between widths so each screen is MOUNTED FRESH at each width. A screen
 * that was merely re-laid-out would hide a `v-if` that reads the viewport – which is exactly the
 * kind of code phases 2 and 3 are about to add.
 */
const STATIONS: Record<string, Station> = {
  'HomeScreen.vue': {
    visit: async () => {
      // `park()` has already put us here; Home is where every other route begins.
    },
    // The date line is Home's `<p role="heading" aria-level="1">` – `dateLine`, the app's own
    // rendering of the career week (see journey.ts's `onScreenWeek` for the same idea).
    arrived: (page) => page.getByRole('heading', { name: /^W\d+ \d{4} · /, level: 1 }),
  },

  'SeasonScreen.vue': {
    visit: (page) => navTab(page, 'Season'),
    arrived: (page) => page.getByRole('heading', { name: 'Season Planner' }),
  },

  'CalendarScreen.vue': {
    visit: (page) => navTab(page, 'Calendar'),
    arrived: (page) => page.getByRole('heading', { name: 'Calendar', level: 2 }),
  },

  'StatsScreen.vue': {
    visit: (page) => navTab(page, 'Stats'),
    arrived: (page) => page.getByRole('heading', { name: 'Stats', level: 2 }),
  },

  'TrophiesScreen.vue': {
    visit: (page) => navTab(page, 'Trophies'),
    arrived: (page) => page.getByRole('heading', { name: 'Trophy cabinet', level: 1 }),
  },

  'MoneyScreen.vue': {
    // journey.ts's `openMoney` route, inline because this file needs the click without its assertion
    // (the arrival is asserted by `arrived` below, once, for every station).
    visit: (page) => page.getByRole('button', { name: /^Family budget/ }).click(),
    arrived: (page) => page.getByRole('heading', { name: 'Family Budget' }),
  },

  'MoreScreen.vue': {
    visit: (page) => page.getByRole('button', { name: 'Settings', exact: true }).first().click(),
    arrived: (page) => page.getByRole('group', { name: 'Which settings' }),
  },

  'KidScreen.vue': {
    visit: (page) => page.getByRole('button', { name: 'Open her profile' }).click(),
    // Her hero photograph carries her name as its `alt`, but so does Home's headline; this panel
    // title exists on no other screen.
    arrived: (page) => page.getByRole('heading', { name: 'Important moments', level: 3 }),
  },

  'CoachMarketScreen.vue': {
    visit: (page) => page.getByRole('button', { name: 'Coach note - open the Coach Market' }).click(),
    arrived: (page) => page.getByRole('heading', { name: 'Coach Market', level: 2 }),
  },

  'ThisWeekScreen.vue': {
    // ⚠ THE PLATE IS ALWAYS THERE, the tournament on it is not. `HomeScreen.vue` renders the
    // next-tournament `<Card as="button">` unconditionally and only its CONTENTS depend on an entry,
    // so this door opens on every career. Round 31 #1 made it carry `entry: 'tournament'`; with
    // nothing entered `tournamentOnly` is false and the screen draws its own "This week".
    visit: (page) => page.getByRole('button', { name: /^Next tournament/ }).click(),
    arrived: (page) => page.getByRole('heading', { name: 'This week', level: 2 }),
  },
}

/** The bottom bar, which is the app's whole navigation. Scoped to the `navigation` landmark because
 *  a tab's name is not unique on the page – `CalendarScreen` renders its own advance CTA with the
 *  same label set journey.ts's `WEEK_ACTION_NAME` transcribes. */
function navTab(page: Page, name: string): Promise<void> {
  return page.getByRole('navigation').getByRole('button', { name, exact: true }).click()
}

/**
 * BACK TO HOME, THROUGH A DIFFERENT SCREEN, so the next station really re-mounts.
 *
 * ⚠ THE DETOUR IS THE POINT. `App.vue` renders its screens under one `v-if`/`v-else-if` chain, so
 * clicking Home while already on Home changes nothing and the next measurement would read a
 * component mounted at the PREVIOUS width. Trophies is the detour because it is a tab (reachable
 * from every station, including the tabless ones, which all keep the bar) and because it is the one
 * screen no station's route passes through on its way anywhere else.
 */
async function park(page: Page): Promise<void> {
  await navTab(page, 'Trophies')
  await expect(page.getByRole('heading', { name: 'Trophy cabinet', level: 1 })).toBeVisible()
  await navTab(page, 'Home')
  await expect(page.getByRole('heading', { name: /^W\d+ \d{4} · /, level: 1 })).toBeVisible()
}

// =================================================================================================
// THE FINGERPRINT
// =================================================================================================

/** The roles that carry the owner's criterion: something you can press, type in or read as a
 *  landmark heading, and something drawn that SAYS what it is.
 *
 *  ⚠ A CLOSED SET, for the reason journey.ts gives for its own two: a fingerprint over "every role"
 *  would fold in `text`, `paragraph`, `generic` and every list item on the page, and would then go
 *  red on a copy edit rather than on a lost control – which is the fastest way to teach somebody to
 *  ignore this gate. What is here is what «1 к 1» is about. */
const FINGERPRINTED_ROLES = new Set([
  'button',
  'link',
  'checkbox',
  'radio',
  'switch',
  'textbox',
  'searchbox',
  'combobox',
  'listbox',
  'option',
  'slider',
  'spinbutton',
  'tab',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'heading',
  'img',
  'figure',
  'meter',
  'progressbar',
  'table',
])

/**
 * The accessibility tree, as a list of `role "name"` tokens.
 *
 * ⚠ PLAYWRIGHT'S OWN ENGINE COMPUTES THE NAMES, and that is why this is an aria snapshot rather than
 * a hand-rolled DOM walk. An accessible name is `aria-labelledby`, then `aria-label`, then `alt`,
 * then the element's own text, with whitespace folded – four fallbacks and a normalisation that a
 * spec re-implementing them would get subtly wrong and then assert against itself.
 *
 * ⚠ AND THE SNAPSHOT IS ALREADY VISIBILITY-FILTERED, which is the property this file needs and the
 * reason a `querySelectorAll` walk would be weaker: `display: none`, `visibility: hidden` and
 * `aria-hidden` are all absent from the a11y tree, so a control hidden at 1280 by any of the three
 * disappears from this list and is named by the diff.
 */
async function ariaFingerprint(page: Page): Promise<string[]> {
  const yaml = await page.locator('body').ariaSnapshot()
  const tokens: string[] = []
  for (const line of yaml.split('\n')) {
    // `- button "Home"`, `- heading "Season" [level=2]`, `- img "Season ladder rung"`, and the
    // unnamed `- button`. A `- /url: "#x"` child line cannot match: it does not start with a letter.
    const match = /^\s*-\s+([a-z][a-z-]*)(?:\s+"((?:[^"\\]|\\.)*)")?/.exec(line)
    if (!match) continue
    const [, role, rawName] = match
    if (!FINGERPRINTED_ROLES.has(role)) continue
    const level = role === 'heading' ? (/\[level=(\d+)\]/.exec(line)?.[1] ?? '?') : ''
    const name = rawName === undefined ? '<unnamed>' : rawName.replace(/\\"/g, '"')
    tokens.push(`${role}${level} "${name}"`)
  }
  return tokens
}

/**
 * EVERY ICON AND EVERY PAINTING, BY THE FILE IT LOADS – the half the accessibility tree cannot see.
 *
 * ⚠ THIS EXISTS BECAUSE OUR ICONS ARE DELIBERATELY INVISIBLE TO IT. `ui/AppIcon.vue` draws a glyph
 * as a masked `<span aria-hidden="true">` – a mask takes only the SVG's alpha so one file serves
 * every colour – and Home's hero is `<img alt="">`. Both are correct accessibility (they are
 * decoration beside a named control), and both mean the owner's «все иконки наши» would be
 * unmeasured if `ariaFingerprint` were the whole instrument. So the glyphs are counted by the ASSET
 * they load, which is stable under a re-tint, a resize and a re-theme.
 *
 * ⚠ VISIBILITY IS MEASURED, NOT DECLARED: a box with no client rects, or no area, or
 * `visibility: hidden` is not on the screen whatever the stylesheet says. This is the check
 * happy-dom cannot make – it has no layout engine, so every rect there is zero.
 */
async function paintFingerprint(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const assetOf = (value: string): string | null => {
      const url = /url\(\s*["']?([^"')]+)["']?\s*\)/.exec(value)
      if (!url) return null
      const raw = url[1]
      // A data URI has no name worth printing; its length is a stable enough identity for a diff.
      if (raw.startsWith('data:')) return `data:${raw.length}`
      return raw.split('?')[0].split('/').pop() || raw
    }

    const tokens: string[] = []
    for (const el of Array.from(document.querySelectorAll('*'))) {
      if (el.getClientRects().length === 0) continue
      const box = el.getBoundingClientRect()
      if (box.width <= 0 || box.height <= 0) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden') continue

      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src')
        if (src) tokens.push(`art ${assetOf(`url(${src})`) ?? src}`)
        continue
      }
      if (el.tagName === 'svg') {
        tokens.push(`svg ${el.getAttribute('class') ?? '<unclassed>'}`)
        continue
      }
      const mask =
        assetOf(cs.getPropertyValue('mask-image')) ??
        assetOf(cs.getPropertyValue('-webkit-mask-image'))
      if (mask) tokens.push(`icon ${mask}`)
      const background = assetOf(cs.backgroundImage)
      if (background) tokens.push(`art ${background}`)
    }
    return tokens
  })
}

/**
 * ⚠⚠ SCROLL THE WHOLE SCREEN BEFORE MEASURING IT, AND THIS WAS FOUND THE HARD WAY.
 *
 * The first run of this file went red on `CoachMarketScreen.vue` with fifteen coach portraits
 * "appearing" at 768 that were "missing" at 375 – and every one of them was a false alarm. The
 * portraits are `loading="lazy"`, the market is a long list, and a narrow column is a TALLER page:
 * at 375 the ones far below the fold had never been fetched, so they measured 0x0 and dropped out of
 * the fingerprint. Nothing about the app differed. The measurement did.
 *
 * ⭐ THE FIX IS THE STRONGER CLAIM, WHICH IS WHY IT IS A SETTLE STEP AND NOT AN EXEMPTION FOR
 * `<img loading=lazy>`. «Всё, что есть на мобиле» is about what the SCREEN holds, not about what
 * happens to be inside the first 900px of it, so the walker rides the page to the bottom – in
 * viewport-sized steps, because Chromium arms lazy images as they approach rather than on a jump –
 * comes back to the top, and waits for every image to finish. Then the census is of the whole
 * screen at every width, which is the question actually being asked.
 *
 * ⚠ AND IT CHANGES NOTHING ELSE ABOUT THE MEASUREMENT: `paintFingerprint` records sizes, never
 * positions, and a scroll moves boxes without resizing them.
 */
/**
 * ⭐⭐⭐ ROUND 36 PHASE 3 – OPEN EVERY DISCLOSURE, AT EVERY WIDTH, BEFORE MEASURING ANYTHING.
 *
 * THIS CHANGES WHAT THE HARNESS CLAIMS, AND IT IS A STRENGTHENING RATHER THAN A LOOSENING. Phase 1
 * fingerprinted what a screen PAINTS on arrival. That was already one reading of «1 к 1» too narrow
 * for the owner's own sentence, which is about ACCESS:
 *
 *     «всё, что есть на мобиле, должно быть 1 к 1 ПО ДОСТУПНОСТИ быть и на других форматах»
 *
 * A control behind a disclosure is on the phone, and a wide screen that draws the same control
 * without the disclosure has neither added nor removed anything – it has spent a tap. Measuring the
 * first paint would call that a difference and be wrong; measuring the REACHABLE set calls it what
 * it is. It came up on Home's season ladder – the owner, 04.09: at 768 and up the ladder may be
 * drawn already open, «это ничему не противоречит» – and it is D9 in
 * docs/specs/responsive-decisions-2026-09.md.
 *
 * ⚠ IT DOES NOT WEAKEN THE CRITERION. A control that is genuinely absent at one width is still
 * absent after every disclosure is open, and still fails by name; a control that exists ONLY at
 * 1280 still fails from the other side. What it stops failing on is a screen that shows the same
 * things behind one fewer press.
 *
 * ⚠ AND IT IS A LOOP RATHER THAN ONE PASS, because opening one disclosure can reveal another (and
 * on Home the ellipsis chips come in pairs – above the window and below it – where pressing either
 * closes both). The cap is a guard against a control that toggles rather than opens: without it a
 * pair of buttons that re-collapse each other would spin here for ever instead of failing.
 */
async function openEveryDisclosure(page: Page): Promise<void> {
  for (let pass = 0; pass < 12; pass++) {
    const shut = page.locator('[aria-expanded="false"]:visible')
    const count = await shut.count()
    if (count === 0) return
    for (let i = count - 1; i >= 0; i--) {
      const control = shut.nth(i)
      // Re-checked rather than assumed: the press before this one may have re-rendered the row.
      if (await control.isVisible().catch(() => false)) {
        await control.click({ timeout: 2_000 }).catch(() => undefined)
      }
    }
  }
  throw new Error(
    'a disclosure on this screen never stayed open after 12 passes - it toggles rather than ' +
      'opens, and the fingerprint below would depend on how many times it was pressed',
  )
}

async function settleScreen(page: Page): Promise<void> {
  await openEveryDisclosure(page)
  await page.evaluate(async () => {
    const frame = (): Promise<void> => new Promise((done) => requestAnimationFrame(() => done()))
    for (let y = 0; y <= document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y)
      await frame()
    }
    window.scrollTo(0, 0)
    await frame()
  })
  // Web-first, so this is a retry rather than a sleep – `page.waitForTimeout` is banned in this
  // directory (e2e/README.md) and a guess about a fetch queue is exactly what it would be.
  await expect
    .poll(() => page.evaluate(() => Array.from(document.images).every((img) => img.complete)), {
      message: 'an image on this screen never finished loading, so its box cannot be measured',
    })
    .toBe(true)
}

async function fingerprint(page: Page): Promise<string[]> {
  await settleScreen(page)
  const [aria, paint] = await Promise.all([ariaFingerprint(page), paintFingerprint(page)])
  return [...aria, ...paint].sort()
}

/**
 * ⚠⚠ THE FLOOR THAT STOPS AN EMPTY MEASUREMENT PASSING. Four empty sets are equal, so a station
 * whose walk silently landed nowhere would be green forever – the exact failure mode round 35's
 * three blind tests had, and the one the spec's own warning is about.
 *
 * MEASURED, NOT GUESSED (CLAUDE.md invariant 5). Every station's fingerprint was counted on this
 * build at 375, and the ten came out:
 *
 *     Calendar 19 · Stats 20 · ThisWeek 25 · Kid 31 · More 32 · Money 35
 *     Season 46 · Home 52 · Trophies 59 · CoachMarket 60
 *
 * – identical at 768, 900 and 1280, which is the harness passing. The floor is set under the
 * smallest of them with room to spare: it is a tripwire for a walk that collapsed, not a pin on how
 * much any screen happens to draw, and a screen legitimately losing four controls should not have
 * to come here. The run is recorded in docs/rounds/round-36.md.
 */
const FINGERPRINT_FLOOR = 15

/** Everything in `a` that `b` does not also have, COUNTED – so losing one of three identical pills
 *  is a difference, not a rounding error. Rendered as `name ×2` when the count is what moved. */
function missingFrom(a: string[], b: string[]): string[] {
  const left = new Map<string, number>()
  for (const token of a) left.set(token, (left.get(token) ?? 0) + 1)
  for (const token of b) {
    const seen = left.get(token)
    if (seen) left.set(token, seen - 1)
  }
  return [...left.entries()]
    .filter(([, count]) => count > 0)
    .map(([token, count]) => (count === 1 ? token : `${token} ×${count}`))
    .sort()
}

// =================================================================================================
// THE WALK
// =================================================================================================

test.describe('every screen is 1 to 1 at 375, 768, 900 and 1280', () => {
  test('every screen in src/components/screens/ has a station in this file', () => {
    // ⚠ THE ASSERTION THAT KEEPS THE LIST DERIVED, and the same shape coverage-map.spec.ts uses on
    // the same directory. A screen added by a later phase with no route here fails BY FILENAME, so
    // "which screens does the parity harness cover" can never quietly become "the ones somebody
    // remembered". The reverse holds too: a station outliving its screen is a route to nowhere.
    expect(
      Object.keys(STATIONS).sort(),
      'e2e/parity.spec.ts and src/components/screens/ disagree. A new screen needs a station – ' +
        'the door a player uses to reach it, and an anchor that proves the walk arrived.',
    ).toEqual(SCREENS_ON_DISK)
  })

  for (const [screen, station] of Object.entries(STATIONS)) {
    test(`${screen} carries the same controls at every width`, async ({ page, careerAt }) => {
      await walkOneScreen(page, careerAt, screen, station)
    })
  }
})

// =================================================================================================
// ⭐⭐ ROUND 36 PHASE 4 – THE ROOMS BEHIND A CHAPTER, AND WHY THEY NEED A SECOND MAP
// =================================================================================================
//
// The map above is DERIVED from `src/components/screens/`, which is what stops it becoming «the
// screens somebody remembered». Its cost is that a screen file is the unit: `MoneyScreen.vue` has
// ONE station, and that station lands on the Spending chapter. Everything behind the other three
// chapter buttons – History, Bills and, since round 35, a two-level SHOP – is in the same file and
// therefore already «covered» as far as the derivation is concerned, while no fingerprint has ever
// been taken of it.
//
// ⚠⚠ AND PHASE 4 FOUND THAT OUT THE HONEST WAY: its own deliberate break had to be aimed at the
// chapter ROW, because a control hidden inside the shop would not have been seen at all. Phase 4
// rebuilt the shop's front door and its shelf rows for wide screens, so «1 к 1» on those two rooms
// is exactly the claim this round is about, and it was unmeasured.
//
// ⚠ SO THIS MAP IS HAND-WRITTEN AND SAYS SO. It cannot be derived – there is no directory of
// chapters – which is the property the map above has and this one has not. What keeps it honest is
// the same three mechanisms: an arrival anchor before anything is measured, the fingerprint floor,
// and one fresh career per station. A room that stops being reachable fails at its anchor.
const ROOMS: Record<string, Station> = {
  'MoneyScreen.vue – the shop’s front door': {
    visit: async (page) => {
      await page.getByRole('button', { name: /^Family budget/ }).click()
      await page
        .getByRole('group', { name: 'Which part of the budget' })
        .getByRole('button', { name: 'Shop' })
        .click()
    },
    // Round 35 #3's six category cards. `Invest` is the first of them and is a card, not a segment:
    // the shelf's own switcher is one press deeper, which is what makes this the FRONT DOOR.
    arrived: (page) => page.getByRole('button', { name: 'Invest' }).first(),
  },

  'MoneyScreen.vue – a shelf inside the shop': {
    visit: async (page) => {
      await page.getByRole('button', { name: /^Family budget/ }).click()
      await page
        .getByRole('group', { name: 'Which part of the budget' })
        .getByRole('button', { name: 'Shop' })
        .click()
      await page.getByRole('button', { name: 'Cars' }).first().click()
    },
    arrived: (page) => page.getByRole('group', { name: 'Which part of the shelf' }),
  },
}

test.describe('the rooms behind a chapter are 1 to 1 too', () => {
  for (const [room, station] of Object.entries(ROOMS)) {
    test(`${room} carries the same controls at every width`, async ({ page, careerAt }) => {
      await walkOneScreen(page, careerAt, room, station)
    })
  }
})

/**
 * ONE WALK, USED BY BOTH MAPS – extracted in phase 4 rather than copied, because a second copy of
 * this body is a second place for the arrival check, the floor and the two-way diff to drift out of.
 */
async function walkOneScreen(
  page: Page,
  careerAt: CareerAt,
  screen: string,
  station: Station,
): Promise<void> {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // ⚠ THE HEAVIEST CAREER, on purpose. `pro` is "eight seasons in, inside the sponsor window,
  // ledgers full – the heavy-state screens" (e2e/fixtures/manifest.json), so every screen here
  // is drawn with something on it. A fingerprint taken against an empty career would be a
  // smaller claim wearing the same green tick.
  await page.setViewportSize({ width: BASE_WIDTH, height: VIEWPORT_HEIGHT })
  await careerAt('pro')
  // Both are doorways rather than assertions – journey.ts argues each at length. The knock is a
  // blocking decision every seeded career wakes up holding; the briefing fires on the boot of
  // any career already inside the top 50, which `pro` is.
  await answerOpeningKnock(page)
  await dismissTourBriefing(page)

  const seen = new Map<number, string[]>()
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
    await park(page)
    await station.visit(page)
    // ⚠ ARRIVAL BEFORE MEASUREMENT, ALWAYS. This is mechanism 2 of the three in the header: a
    // walk that landed on the wrong screen would otherwise fingerprint that one four times and
    // report perfect parity about a screen it never visited.
    await expect(
      station.arrived(page),
      `${screen} at ${width}px – the walk did not arrive, so there is nothing to compare`,
    ).toBeVisible()
    seen.set(width, await fingerprint(page))
  }

  const base = seen.get(BASE_WIDTH)!
  expect(
    base.length,
    `${screen} fingerprints only ${base.length} things at ${BASE_WIDTH}px. Either the screen ` +
      'draws almost nothing or the walk did not really arrive - and four near-empty sets are ' +
      'equal, which is this harness passing while proving nothing.',
  ).toBeGreaterThanOrEqual(FINGERPRINT_FLOOR)

  for (const width of WIDER_WIDTHS) {
    const wide = seen.get(width)!
    // ⭐ THE OWNER'S CRITERION, BOTH WAYS ROUND. First half: «старого уйти ничего не должно».
    expect(
      missingFrom(base, wide),
      `${screen}: these are on the phone at ${BASE_WIDTH}px and NOT at ${width}px. ` +
        '«всё, что есть на мобиле, должно быть 1 к 1 на других форматах»',
    ).toEqual([])
    // ⭐ Second half: «ничего нового не должно появиться». A control that exists only on the
    // wide format is as much a break of «1 к 1» as one that vanished.
    expect(
      missingFrom(wide, base),
      `${screen}: these are at ${width}px and NOT on the phone at ${BASE_WIDTH}px. ` +
        '«Все иконки наши, ничего нового по идее не должно появиться»',
    ).toEqual([])
  }

  expect(crashes, `${screen} threw while being walked at four widths`).toEqual([])
}
