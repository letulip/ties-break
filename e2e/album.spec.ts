// JOURNEY: THE ALBUM IS A PLACE A PLAYER CAN REACH, AND IT HAS HER CAREER IN IT.
//
// SEAMS OWNED: #1 (the Web Worker boundary), with #5 (real input) carrying the pan and the doors.
// ⭐ THE ONE NEW CASE THE ALBUM OWES (the owner's 29.08 rule: one e2e case per shipped mechanic).
//
// WHAT ONLY THIS LAYER CAN SAY, and here that is unusually sharp, because the album is the first
// view in this app assembled ON DEMAND rather than handed down in the weekly `Snapshot`. Spec §8b:
// «Сборка альбома – по требованию, не в недельном снимке». Every other half of the mechanic is
// pinned already – `assembleAlbum` over real worlds in tests/albumBook.test.ts, the three layouts and
// the pager mounted in tests/component/album-mobile.test.ts, the door on Home in
// tests/component/album-home-door.test.ts, and the wire's shape by the type system itself. What none
// of them can say is that THE QUERY EXISTS AND ANSWERS:
//
//   * that a career restored from IndexedDB into a real worker can be ASKED for its album at all –
//     the `{type:'album'}` arm, `game.loadAlbum()`, and the round trip between them;
//   * that the book which comes back is the one this career earned, rather than the empty chrome the
//     screen draws when the answer is null. Every mounted test above is handed a book by a fixture;
//     this is the only layer where something has to GO AND GET ONE;
//   * that the paintings the engine names are files the app actually serves. The ladder of spec §4
//     decides WHICH picture and spells the decision as a path; `tests/albumBook.test.ts` checks that
//     path against `public/` on disk, and this checks that the same string, having crossed the wire
//     and had `import.meta.env.BASE_URL` put in front of it, DECODES IN A BROWSER.
//
// ⚠⚠ AND THE SECOND VISIT IS NOT A REPETITION – IT IS THE OTHER HALF OF THE FETCH. `App.vue` clears
// `albumBook` on the way out of the section, so that a second career cannot be shown the first one's
// childhood while its own fetch is in flight. That clear is invisible from a browser by itself; what
// makes it observable is coming BACK. If the fetch ran only once, the second visit finds a null book
// and draws the empty chrome; if the clear never ran, the second visit would pass whether or not the
// query works at all. Only the pair – cleared AND re-fetched – puts the same sheet on screen twice.
//
// ⚠ WHAT THIS SPEC DELIBERATELY DOES NOT ASSERT, said out loud rather than quietly dropped:
//
//   * NOT THE HANDWRITING. Every sentence on a sheet is the owner's, generated into
//     `src/engine/world/albumCorpus.ts` (invariant 4), and `tests/component/album-mobile.test.ts` §9
//     already holds that no layer but the corpus writes one. Quoting a caption here would pin the
//     owner's draft copy in a fourth place and move with it, proving nothing.
//   * NOT THE SHEET COUNT. `pro` earns six sheets today, and that number is a property of where the
//     fixture generator's search stopped – it moves with `npm run e2e:fixtures` and with any balance
//     change that alters what she won. So the count is read off the screen and only its SHAPE is
//     asserted: at least two, because one sheet cannot be paged.
//   * NOT THE BASE ITSELF. The suite serves a build whose base is `/`, so a bare engine path would
//     load here too; the prefix is unit-owned, mutation-verified, in
//     tests/component/album-mobile.test.ts. What a browser adds is that the FILE is there.
//
// -------------------------------------------------------------------------------------------------
// ⭐ THE ARMS, WRITTEN DOWN (the standing rule since wave 2: «this wave writes each arm down»). All
// four were applied to the app, this file RUN against each, and reverted – 19.09, a real browser, the
// control green before and after. Two are RED and two are GREEN, and the two green ones are recorded
// rather than quietly dropped, because a reader would otherwise expect this file to guard them.
//
//   A. `App.vue`: the album watcher's `await game.loadAlbum()` replaced by `null` – the seam exactly
//      as the UI builder left it, a screen handed nothing.
//      -> RED at step 3: «the album opened with no sheets on it». This is the arm that makes every
//      assertion below a measurement: without it they would all be true of a fixture.
//   B. `App.vue`: the `if (now !== 'album')` clear deleted, so the book is never dropped.
//      -> GREEN. Recorded rather than corrected: with ONE career seeded there is nothing stale to
//      show, so this file cannot see the clear on its own – and `careerAt` refuses a second seeded
//      career by design, because its one-shot latch is the database's own existence. What step 7
//      really guards is the RE-FETCH, and arm A is what arms that.
//   C. `AlbumPhoto.vue`: `:src="src"` back to `:src="frame.art"`, the base prefix gone.
//      -> GREEN, as the note above predicts, because this build's base IS `/` and a bare path
//      resolves identically. Recorded so nobody mistakes this file for the deploy bug's witness –
//      `tests/component/album-mobile.test.ts` is, and its own two arms are written down there.
//   D. `albumBook.ts`: `PAINTING_DIR` misspelled (`images/fem-euro-brunnette/`).
//      -> RED at step 4: «paintings the engine named that the app does not serve». This is the arm
//      that makes the decode assertion a measurement rather than a formality – the images are still
//      in the DOM, still visible, still carry their `src`, and only `naturalWidth` knows.

import { test, expect } from './careerAt'
import type { Locator, Page } from '@playwright/test'
import { answerOpeningKnock, dismissTourBriefing, onScreenWeek } from './journey'

/** Home's recent-memory card – the album's one door (spec §8b, his ruling of 19.09: «можно сделать
 *  вход в альбом как раз с плашки home где у нас recent memory»).
 *
 *  ⚠ BY ITS EYEBROW, WHICH IS THE OPPOSITE OF WHAT THE MOUNTED TEST DOES, AND BOTH ARE RIGHT.
 *  `tests/component/album-home-door.test.ts` finds this card STRUCTURALLY, because it goes on to
 *  assert the eyebrow's wording and an anchor on that word would make the assertion circular. This
 *  file asserts no wording at all, and a class name is not a thing a player can see – so here the
 *  accessible name is the honest handle, and it is also the one that fails loudly if the card stops
 *  being a button. */
function memoryCard(page: Page): Locator {
  return page.getByRole('button', { name: /^Recent memory/ })
}

/** «Sheet N of M», the counter at the foot – the only place the album says where it is. */
function sheetCount(page: Page): Locator {
  return page.getByText(/^Sheet \d+ of \d+$/)
}

test.describe('the album', () => {
  test('opens from Home with the career in it, pans, and gives the screen back', async ({
    page,
    careerAt,
  }) => {
    // 1. EIGHT SEASONS IN. `pro` is the corpus's heavy-state career – week 412, ledgers full – and
    //    it is the fixture the album needs for the reason the manifest's own purpose line gives: a
    //    book has chapters only where something was LIVED AND EARNED, so a young career earns one
    //    chapter and a fresh one earns none at all. It is not `ending`, deliberately: that career's
    //    epilogue REPLACES the tab shell, so Home's door is not on screen to press.
    const pro = await careerAt('pro')
    await answerOpeningKnock(page)
    await dismissTourBriefing(page)
    await expect(page.getByText(onScreenWeek(pro.facts.week))).toBeVisible()

    // 2. THE DOOR IS A DOOR. It is a button only when there is a memory behind it – Home draws an
    //    `article` and «Too early for memories.» otherwise – so finding it by role is already the
    //    assertion that this career has one.
    await expect(memoryCard(page)).toBeVisible()
    await memoryCard(page).click()

    // 3. ⭐⭐ AND THE BOOK CAME BACK. This is the query: the screen renders whatever prop it is
    //    handed, so a counter at all means `{type:'album'}` crossed the worker boundary, `assembleAlbum`
    //    ran over the restored world, and the answer reached the prop. Arm A dies here.
    await expect(page.getByRole('button', { name: 'Back to Home' })).toBeVisible()
    await expect(sheetCount(page), 'the album opened with no sheets on it').toBeVisible()

    const counted = (await sheetCount(page).textContent()) ?? ''
    const total = Number(counted.match(/of (\d+)$/)?.[1])
    expect(total, `«${counted}» is not a count this career could have earned`).toBeGreaterThanOrEqual(2)
    await expect(sheetCount(page)).toHaveText(`Sheet 1 of ${total}`)

    // ...and the sheet on screen names its chapter, which is the engine's banding of her life and
    // not a constant: the heading is «Chapter 1 of N» over a title the assembly chose.
    //
    // ⚠ THE `\s*` IS LOAD-BEARING AND IT COST A RUN. `getByText` normalizes whitespace for a STRING
    // and does NOT for a REGEX, so `^…$` is anchored against the node's raw text – and this line is
    // an interpolation spread over three lines of the template, so its `textContent` opens and closes
    // with a newline and eleven spaces. The counter above is matched by the same shape of regex and
    // passed, because ITS template line is a single line: the difference is invisible on screen and
    // total in the matcher. ⭐ Kept anchored rather than loosened to an unanchored `/Chapter 1 of/`:
    // the anchors are what stop this matching the header DIV that contains the line plus the title
    // plus the age, which would turn a missing chapter line into a strict-mode violation reported as
    // something else.
    await expect(page.getByText(/^\s*Chapter 1 of \d+\s*$/)).toBeVisible()

    // 4. ⭐⭐ THE PAINTINGS ARE REAL FILES. The §4 ladder decided which picture and spelled it as a
    //    path; the browser has now fetched and DECODED it. `naturalWidth` is the only honest form of
    //    this claim – an `<img>` with a 404 behind it is still in the DOM, still visible, and still
    //    has its `src`. Arm D dies here.
    // ⚠ BY LANDMARK AND ROLE, NEVER `.album-pan img` – e2e/README.md: «Never CSS classes or DOM
    // structure». The scope matters as much as the role here: past 1024 the desktop rail carries her
    // avatar, which is an image on the page that is not a photograph in the album, and `main` is the
    // landmark the shell puts the section inside. An `<img>` with an empty alt has role presentation
    // and would not be counted, which is also right – the album's trimmings are drawn, not pictured.
    const shown = page.getByRole('main').getByRole('img')
    await expect(shown.first()).toBeVisible()
    const widths = await shown.evaluateAll((nodes) =>
      nodes.map((n) => (n as HTMLImageElement).naturalWidth),
    )
    expect(widths.length, 'no photographs on any sheet of the film').toBeGreaterThan(0)
    expect(
      widths.filter((w) => w === 0),
      'paintings the engine named that the app does not serve',
    ).toEqual([])

    // 5. IT PAGES. The chevron moves the film by one sheet – the unit of paging is half a spread
    //    (spec §3), and the counter is the pager's own state rather than a second source of truth,
    //    so this is also the assertion that the scroller and the counter agree.
    await page.getByRole('button', { name: 'Next sheet' }).click()
    await expect(sheetCount(page)).toHaveText(`Sheet 2 of ${total}`)

    // 6. BACK GOES HOME – the control that only exists because the album stopped being the last
    //    screen of a career (spec §8b). The week line is the proof it is really Home and not a
    //    blank: it is the fixture's own week, rendered the way the app renders it.
    await page.getByRole('button', { name: 'Back to Home' }).click()
    await expect(page.getByText(onScreenWeek(pro.facts.week))).toBeVisible()
    await expect(sheetCount(page)).toHaveCount(0)

    // 7. ⭐⭐ AND IT OPENS AGAIN, WHICH IS THE FETCH'S OTHER HALF. See the header: the book is
    //    dropped on the way out, so a second visit that still shows a sheet can only be a second
    //    round trip. It reopens at sheet 1 – the screen is `v-if`'d and mounts fresh – which is the
    //    same fact from the other side.
    await memoryCard(page).click()
    await expect(sheetCount(page)).toHaveText(`Sheet 1 of ${total}`)
    await expect(page.getByRole('main').getByRole('img').first()).toBeVisible()
  })
})
