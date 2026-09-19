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
import { loadManifest, readFixtureBytes } from '../tools/e2e-fixtures-read'
import { goHome, importFile, onScreenWeek, openSaves } from './journey'

const manifest = loadManifest()
const fixture = (name: string): (typeof manifest.fixtures)[number] =>
  manifest.fixtures.find((f) => f.name === name)!

// ⚠ `openSaves`, `importFile` AND `goHome` MOVED TO e2e/journey.ts (v83 T11, 19.09) WITH THEIR
// ARGUMENTS INTACT, unchanged in every other way. e2e/wedding.spec.ts carries a married career
// through both of these doors, and e2e/stations.ts' header carries the reason a second copy was not
// made instead: two walks that drift apart, with nobody able to say which one is the app.

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
  // ⚠ ROUND 42 #8: the branches are radios that only select; the Proceed records.
  await expect(page.getByRole('radio', { name: /^Rest it/ })).toBeVisible()
  await page.getByRole('radio', { name: /^Rest it/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Proceed', exact: true }).click()

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
