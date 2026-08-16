// JOURNEY: THE FILE DOOR - A CAREER LEAVES THE APP AND COMES BACK, AND A BAD FILE DOES NOT.
//
// SEAM OWNED: #6, the file round trip, and it is the one seam with real security logic behind it.
// `decodeExportFile` is the ONLY place this app accepts bytes it did not write: a 16 MiB size cap, a
// magic check, a declared-version check made BEFORE anything is decompressed, a SHA-256, a bounded
// inflate that aborts past 64 MiB, a bounds walk over the parsed object, a spine check, and only
// then the migration ladder. `tests/` owns every one of those rules in isolation.
//
// WHAT THIS FILE OWNS INSTEAD, and no other layer can: that the rules are actually WIRED to the
// door. A guard that is perfect and unreachable protects nothing. So this drives real
// `<input type="file">` traffic through a real file chooser, in a real browser, and asserts the
// refusal reaches the player's screen and the career on disk is untouched.
//
// ⚠ NOTHING HERE HARD-CODES A SCHEMA VERSION. The future-schema file below is built from
// `manifest.schemaVersion + 1`, read out of e2e/fixtures/manifest.json - so the day agent A or B
// bumps `SAVE_SCHEMA_VERSION` and the fixtures are regenerated, this spec keeps asking the right
// question with no edit. That was a design requirement, not a convenience.

import { test, expect, TOUR_ANSWERED } from './careerAt'
import type { Page } from '@playwright/test'
import { loadManifest, readFixtureBytes } from '../tools/e2e-fixtures-read'
import { onScreenWeek, openMore } from './journey'

const manifest = loadManifest()
const fixture = (name: string): (typeof manifest.fixtures)[number] =>
  manifest.fixtures.find((f) => f.name === name)!

/** More > Saves - where both doors live.
 *
 *  ⚠ THE ONE ASSERTION ON THE WAY THROUGH IS NOT NAVIGATION SCAFFOLDING, and it is here rather than
 *  inside a test because this is the only journey in the suite that opens More at all. The screen
 *  lands on its Play tab first, which holds five `role="switch"` controls that until this wave were
 *  ALL called `ON` or `OFF`: their visible labels were unassociated siblings, so five controls
 *  shared two names between them and `getByRole('switch', { name: 'Sound effects' })` could not
 *  work (defect D2, docs/specs/e2e-coverage.md §12). One named switch is enough to say the
 *  association reaches a real browser; which five, and what each is called, is
 *  tests/component/a11y-sweep.test.ts's claim.
 *
 *  ⚠ MUTATION-VERIFIED: `aria-labelledby` off the sound switch -> both tests in this file go red on
 *  this line, which is what a helper on the shared path is supposed to do. */
async function openSaves(page: Page): Promise<void> {
  await openMore(page)
  await expect(page.getByRole('switch', { name: 'Sound effects' })).toBeVisible()
  await page.getByRole('group', { name: 'Which settings' }).getByRole('button', { name: 'Saves' }).click()
  await expect(page.getByRole('button', { name: 'Export to file' })).toBeVisible()
}

/**
 * Hand the app a file, through the control a player presses.
 *
 * ⚠ THE FILE CHOOSER, NOT THE INPUT. `MoreScreen.vue` keeps a `hidden` `<input type="file">` and
 * clicks it from a visible button - a normal, correct pattern, and it means the input itself has no
 * role and no accessible name, so `getByRole` cannot reach it. The tempting workaround is
 * `page.locator('input[type="file"]')`, which is a CSS selector and against this suite's policy for
 * good reason: it would test a DOM detail instead of the door. Driving `filechooser` off the real
 * button keeps the whole path honest - the button, its handler, the input, and the change event.
 */
async function importFile(page: Page, name: string, bytes: Buffer): Promise<void> {
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Import from file' }).click()
  await (await chooser).setFiles({ name, mimeType: 'application/octet-stream', buffer: bytes })
  // ⚠ AND THE FILE IS NOT ADOPTED UNTIL THE PLAYER SAYS SO (round-21 #1). Picking a file now opens a
  // ConfirmDialog whose copy is chosen from what `peekSave` found INSIDE it – so the affirmative
  // button is 'Overwrite' when this device already holds that career and 'Import' when it does not,
  // and an unreadable file takes the cautious wording with 'Import'. Matching both, anchored, is the
  // honest way to say "confirm whichever this is": `^Import$` cannot collide with the 'Import from
  // file' button that opened the picker, and asserting one specific word here would make this helper
  // a hostage to which fixture each test hands it.
  await page.getByRole('button', { name: /^(Import|Overwrite)$/ }).click()
}

async function goHome(page: Page): Promise<void> {
  await page.getByRole('navigation').getByRole('button', { name: 'Home', exact: true }).click()
}

test('a career round-trips through a real file: out of the app, and back in', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // TOUR_ANSWERED: this spec is about a file round trip, not about onboarding, and a week-0
  // fixture otherwise boots into the first-run coach marks – see careerAt.ts.
  const fresh = await careerAt('fresh', { localStorage: TOUR_ANSWERED })
  await openSaves(page)

  // --- out -------------------------------------------------------------------------------------
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export to file' }).click()
  const download = await downloadPromise

  // The name the worker built out of the world it was holding. Both halves come from the manifest,
  // so this asserts the exported file describes THE SEEDED CAREER rather than some default - which
  // is the cheapest possible proof that the export read the right world.
  expect(download.suggestedFilename()).toBe(
    `tennis-sim_${fresh.seed}_w${fresh.facts.week}.tsave`,
  )
  const chunks: Buffer[] = []
  for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer)
  const exported = Buffer.concat(chunks)
  expect(exported.byteLength, 'the exported file is empty').toBeGreaterThan(0)

  // --- and back in, as a DIFFERENT career --------------------------------------------------------
  // ⚠ THE ASSERTION IS UNAMBIGUOUS BY CONSTRUCTION. This browser holds `fresh`, at week 0. The file
  // handed to it is `junior`, at week 120. A week-120 date line on screen afterwards cannot come
  // from anywhere except that file: not from the seed (one-shot, already spent), not from the
  // database (it holds week 0), not from a default. One import, one number, no other explanation.
  const junior = fixture('junior')
  await importFile(page, junior.file, Buffer.from(readFixtureBytes(junior.file)))

  // ⚠ AND THE WHOLE WORLD CAME, NOT A SUMMARY OF IT. `junior` is parked on an unanswered knock, and
  // the imported career arrives parked on it too - a decision waiting on the player, restored across
  // a file boundary into a browser that had never seen it. It appears here, over the settings screen
  // the import was started from, before anything has been navigated. Discovered the honest way: the
  // first draft of this spec was blocked by this very dialog, twice. It is answered because the tab
  // bar is behind it. (Same fixture dependency the canary in week-advance.spec.ts pins.)
  await expect(page.getByRole('button', { name: /^Rest it/ })).toBeVisible()
  await page.getByRole('button', { name: /^Rest it/ }).click()

  await goHome(page)
  await expect(page.getByText(onScreenWeek(junior.facts.week))).toBeVisible()
  await expect(page.getByText(onScreenWeek(fresh.facts.week))).toHaveCount(0)

  // --- and the bytes the app itself wrote are readable by the app itself -------------------------
  // The other half of "round trip", and the half most suites skip: an export nobody can import is a
  // backup that is not a backup. `encodeExportFile` wrote these bytes; `decodeExportFile` - a
  // different function, with the whole guard chain in front of it - has to accept them.
  await openSaves(page)
  await importFile(page, download.suggestedFilename(), exported)
  await goHome(page)
  await expect(page.getByText(onScreenWeek(fresh.facts.week))).toBeVisible()

  expect(crashes, 'the app threw during a save round trip').toEqual([])
})

test('an untrusted file is refused at the door, and the career on disk is untouched', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // TOUR_ANSWERED: this spec is about a file round trip, not about onboarding, and a week-0
  // fixture otherwise boots into the first-run coach marks – see careerAt.ts.
  const fresh = await careerAt('fresh', { localStorage: TOUR_ANSWERED })
  const junior = fixture('junior')
  await openSaves(page)

  // --- 1. a damaged payload ---------------------------------------------------------------------
  // One flipped byte past the 44-byte header, i.e. inside the gzip the SHA-256 covers. This is what
  // a truncated download, a bad USB stick or a helpful text editor actually produces, and it is the
  // guard that catches it: the checksum, before the payload is ever handed to a decompressor.
  const damaged = Buffer.from(readFixtureBytes(junior.file))
  damaged[100] ^= 0xff
  await importFile(page, junior.file, damaged)
  await expect(page.getByText(/Save checksum mismatch/)).toBeVisible()

  // ⚠ AND THE CAREER SURVIVED THE ATTEMPT. This is the assertion that makes the refusal worth
  // anything: a guard that throws AFTER swapping the world in would report a clean error over a
  // wrecked career. `saveCodec` works entirely on locals and touches no global until it has finished
  // - this is where that design is actually exercised, with a real career on the other side of it.
  await goHome(page)
  await expect(page.getByText(onScreenWeek(fresh.facts.week))).toBeVisible()
  await expect(page.getByText(onScreenWeek(junior.facts.week))).toHaveCount(0)

  // --- 2. a save from a build that does not exist yet --------------------------------------------
  // The version is read from the manifest and incremented, so this spec cannot rot into asserting a
  // version the repo has moved past. The header's u32 lives at offset 8, big-endian, OUTSIDE the
  // checksum - which is exactly why the guard checks it before decompressing anything: a file
  // claiming a future schema is refused without its payload ever being touched.
  const future = Buffer.from(readFixtureBytes(junior.file))
  future.writeUInt32BE(manifest.schemaVersion + 1, 8)
  await openSaves(page)
  await importFile(page, junior.file, future)
  await expect(page.getByText(/newer version of the game/)).toBeVisible()

  await goHome(page)
  await expect(page.getByText(onScreenWeek(fresh.facts.week))).toBeVisible()

  expect(crashes, 'the app threw while refusing a bad save file').toEqual([])
})
