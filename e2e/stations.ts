// ⭐⭐ THE STATION MAP – HOW A TEST REACHES EVERY SCREEN THE APP HAS, AND WHAT PROVES IT ARRIVED.
//
// ⚠⚠ THIS FILE IS A MOVE, NOT A NEW IDEA (06.09, T-09). Every line below was written for
// `e2e/parity.spec.ts` in round 36 and lived inside it until a SECOND harness needed the same
// walk: `e2e/a11y.spec.ts` runs axe over each of these screens, and a browser-level accessibility
// pass that could not reach a screen would be answering about the ones it happened to know.
//
// ⚠ AND THE ALTERNATIVE WAS A SECOND MAP, WHICH IS THE THING PARITY'S OWN HEADER ARGUES AGAINST.
// Its mechanism 1 is «the screen list is derived from the filesystem, never written out … a
// hand-written list is one forgotten screen away from proving nothing». A copied station map is
// that failure with an extra step: both files would still derive the LIST, so both would still go
// red on a new screen, but the two walks would drift apart and the day they disagreed nobody would
// know which one was the app. One map, two questions.
//
// ⚠ NOTHING WAS RE-WORDED ON THE WAY OUT. The comments below are round 36's, verbatim, including
// the ones that argue with parity.spec.ts by name – they are the reasoning behind non-obvious
// choices and CLAUDE.md says to preserve them when moving code. Where a comment says «this file»
// it means the harness that walks these stations, which is now either of two.

import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, type Locator, type Page } from '@playwright/test'
import type { FixtureName } from '../tools/e2e-fixtures-read'

// =================================================================================================
// THE SCREEN LIST, DERIVED
// =================================================================================================
const SCREEN_DIR = fileURLToPath(new URL('../src/components/screens/', import.meta.url))
export const SCREENS_ON_DISK = readdirSync(SCREEN_DIR)
  .filter((f) => f.endsWith('.vue'))
  .sort()

export interface Station {
  /**
   * ⭐⭐ ROUND 36 PHASE 5 – WHICH CAREER THIS STATION IS WALKED ON. `pro` for every station that does
   * not say otherwise, which is what the whole map used before and why the default is here rather
   * than at each call site: it is the heaviest career the fixtures offer.
   *
   * ⚠⚠ IT EXISTS BECAUSE A CONTROL THIS ROUND ADDED IS INVISIBLE ON `pro`. Phase 5's week pager
   * draws its two arrows only on a week that stacks SEVERAL rungs she may enter, and `pro` – eight
   * seasons in, on the WTA rung alone – has no such week: measured, its Season feed is three rows of
   * ONE card. So the harness would have compared four fingerprints that never contained an arrow and
   * reported perfect parity about a control it had not seen. `sinking` has two stacked weeks and is
   * where the room below walks. Same lesson as phase 4's shop rooms: a map that cannot reach a state
   * proves nothing about it, and the honest fix is to reach it.
   */
  career?: FixtureName
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
  /**
   * ⭐⭐ ROUND 36 ITEM 17 – HOW THIS STATION GETS BACK TO ITS STARTING POINT BETWEEN WIDTHS, for the
   * one room where `park()` below cannot be walked.
   *
   * ⚠⚠ IT EXISTS BECAUSE A TAKEOVER COVERS THE APP'S ONLY NAVIGATION. `park()` is Trophies-then-Home
   * through the tab bar, and the live match is drawn inside `ui/TakeoverShell.vue`, which is a
   * page-coloured layer pinned OVER the tab bar – so every tab button is in the accessibility tree,
   * has a box, and cannot receive a click. The default park would time out on the second width.
   *
   * ⭐ AND THE PROPERTY `park` EXISTS FOR IS KEPT RATHER THAN WAIVED: the point of returning home is
   * that each screen is MOUNTED FRESH at each width, so a `v-if` reading the viewport cannot hide
   * behind a component that was merely re-laid-out. A reload is the strongest possible version of
   * that – a new document, a new app, a new viewer – and `careerAt`'s seed is a one-shot latch that
   * deliberately does NOT re-fire on a navigation (see its own header, written for the persistence
   * specs), so the career the walk comes back to is the one the walk left.
   */
  park?: (page: Page) => Promise<void>
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
export const STATIONS: Record<string, Station> = {
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

  /**
   * ⭐ THE ALBUM (19.09, the seam wave), reached the one way a player reaches it: Home's recent-memory
   * card (spec §8b, his ruling – «можно сделать вход в альбом как раз с плашки home где у нас recent
   * memory»). It is a `button` only when there is a memory behind it, so the click is already half the
   * proof the walk arrived somewhere real.
   *
   * ⚠⚠ AN ANCHOR HERE HAS TO SURVIVE ALL FOUR WIDTHS, AND TWO CANDIDATES FAILED THAT BEFORE THIS ONE
   * – both measured, both worth writing down, because this map is walked by three harnesses at four
   * widths and a station is the one place that mistake is invisible until it is expensive:
   *   · `Back to Home` – present at every width, but FOUR screens carry that label (Money, This week,
   *     Kid and this one). An arrival anchor that matches four screens proves arrival at none.
   *   · `Chapters` – unique to this screen, and `display: none` from 768 up: past that width the
   *     chapters come out from behind their button as a rail, so the button is a phone-only door.
   *     It cost three red parity tests, all reporting «the walk did not arrive» at 768 and 1280 –
   *     including two that are about the desktop RAIL and have nothing to do with the album, because
   *     they walk every station in this map.
   * `Next sheet` is the pager's own control: unique in the app (the only `label="Next sheet"`), and
   * the footer is restyled but never hidden at any width.
   *
   * ⚠⚠ IT IS ALSO THE ONLY STATION IN THIS MAP WHOSE SCREEN FETCHES ITS OWN DATA, so unlike every
   * other arrival here, this one goes red if the worker's `album` query stops answering – the footer
   * it anchors on is `v-if="sheets.length"`. That is deliberate and is stated so a reader who meets
   * it red looks at the query before the walk. `pro` earns six sheets (measured 19.09).
   *
   * ⚠⚠⚠ AND THIS STATION WAS RED ON ARRIVAL, ON PURPOSE, BECAUSE THE ANSWER WAS THE OWNER'S AND NOT
   * A BUILDER'S. Measured the moment the album joined the walk (19.09):
   *
   *     AlbumScreen.vue: these are on the phone at 375px and NOT at 768px
   *       button "Chapters"   button "Next half"
   *
   * Both are deliberate in `AlbumScreen.vue` and both have a written reason – past 768 the chapters
   * come out from behind their button as a rail, and the pan affordance «is not hidden, it is gone»
   * because there is nothing left to pan to. Neither reason was the point. The point was that every
   * one of the three exemptions in `parity.spec.ts` was a QUOTED OWNER RULING obtained BEFORE the
   * exemption was written – that file's own history: «D35 put the price to him in those words before
   * he ruled. He ruled.» – and D35 is «всё, что есть на мобиле, должно быть 1 к 1 на других
   * форматах». A fourth exemption written by whoever happened to add the station would have been the
   * hole those four-part guards exist to prevent.
   *
   * ⭐ IT IS GREEN NOW, UNDER `parity.spec.ts`'s FOURTH EXEMPTION (19.09, same day), AND THAT
   * EXEMPTION IS FLAGGED TO HIM FOR REVERSAL – its provenance is the owner's own design README
   * («390: кнопка «Chapters» — рейл занял бы полэкрана») READ by an architect rather than a sentence
   * he typed in answer to this check, which is a weaker warrant than the other three have and says so
   * in its own header. ⚠ SO THIS PARAGRAPH IS NOT HISTORY YET: delete that exemption and this station
   * is red again with exactly the two tokens above, which is the state to come back to if he
   * disagrees. Removing the station instead would put the album back outside every browser-level
   * gate, which is how the `scrollable-region-focusable` defect fixed in the same wave survived to
   * ship in the first place.
   */
  'AlbumScreen.vue': {
    visit: (page) => page.getByRole('button', { name: /^Recent memory/ }).click(),
    arrived: (page) => page.getByRole('button', { name: 'Next sheet' }),
  },

  'CoachMarketScreen.vue': {
    visit: (page) => page.getByRole('button', { name: 'Coach note – open the Coach Market' }).click(),
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
export function navTab(page: Page, name: string): Promise<void> {
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
export async function park(page: Page): Promise<void> {
  await navTab(page, 'Trophies')
  await expect(page.getByRole('heading', { name: 'Trophy cabinet', level: 1 })).toBeVisible()
  await navTab(page, 'Home')
  await expect(page.getByRole('heading', { name: /^W\d+ \d{4} · /, level: 1 })).toBeVisible()
}