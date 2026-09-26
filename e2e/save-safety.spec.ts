// JOURNEY: THE TWO SAVE DOORS, IN A REAL BROWSER, WITH A REAL INDEXEDDB UNDER THEM.
//
// SEAMS OWNED: #2 (persistence across real storage) above all, plus #1 (the worker boundary) and #5
// (real input). ⭐ W1 · T1.6 of docs/plans/principles-fix-builder-2026-09.md, and the plan states its
// own reason in one line: «D-01 was proven in node over fake IndexedDB, and a harness is not the
// runtime.» Both findings below were reproduced, fixed and pinned one level down - D-01 through the
// real store and the real worker (tests/component/principles-d01-restore-previous.test.ts), D-02
// against `readLatestAutosave` (tests/saves.test.ts) - over `fake-indexeddb`, in node, with the
// generation rotation running against an in-memory shim.
//
// WHAT ONLY THIS LAYER CAN SAY, and it is one thing said twice:
//
//   * THE GENERATION PAIR IS A REAL PAIR OF RECORDS IN A REAL DATABASE. Both defects are about WHICH
//     of two autosave generations a door reads and which one it writes over, and the rotation is
//     decided inside one IndexedDB `readwrite` transaction that reads both rows and the careers row
//     (`runAutosaveTx`, src/db/saves.ts). A shim that answers those three `get`s from a Map cannot be
//     wrong about the ordering in the way a browser can, and the *assertion* both cases end on - what
//     is still on disk afterwards - is read straight out of the database through `page.evaluate`.
//   * AND THE STALE LIST IS A MOUNTED SCREEN'S, NOT A FIXTURE'S. D-01's list goes stale because
//     `game.slots` has exactly one reader and App.vue mounts it fresh on every visit to the tab; a
//     mounted test has to stage that mount, which is the thing under test.
//
// ⚠ NOT ASSERTED HERE: any rule inside the codec or the migration ladder (unit owns every one - see
// tests/saves.test.ts and tests/goldenSaves.test.ts), what the recovery screen looks like, and no
// figure the lower levels already own. Both cases assert a ROUTE and a DISK.
//
// ⭐⭐ MUTATION-VERIFIED, THREE ARMS, EACH ONE WATCHED RED IN A REAL BROWSER. Every arm was applied to
// `src/`, run, and reverted with `git apply -R`:
//
//   A. T1.1's first arm removed - the `watch` on `game.revision` off MoreScreen.vue. Case 1 red on the
//      poll after «Restore previous»: `Expected: "5,4" / Received: "refused"`. With the list stale
//      again, T1.1's SECOND arm refuses the restore («That action was based on an outdated screen...»)
//      rather than committing the present over the past - so the red here is a REFUSAL where a
//      successful restore was expected, which is why that poll returns the refusal by name.
//   B. D-02's catch-all restored - `readLatestAutosave`'s `corrupted`-only guard removed. Case 2 red
//      on the recovery heading, `element(s) not found`, against a page holding one control: «Tap to
//      start». The app had decided the newer generation was corruption and opened the older one.
//   C. BOTH of T1.1's arms removed (A plus the worker's revision comparison). Case 1 red on the DISK:
//      `physioActive` reads `[true, true]` where `[false, true]` was expected - both generations
//      holding the current world, and the pre-action career existing nowhere. That is D-01 itself,
//      and it is the arm the disk assertions exist for; the first draft asserted the SCREEN first and
//      never reached them on it, which is the §13 lesson this suite already paid for once.
//
// ⚠ EVERY SENTENCE THIS FILE MATCHES ON IS EXISTING COPY (CLAUDE.md invariant 4). W1 introduces no
// new string at all: the refusal is `game.ts`'s stale-screen line, the boot refusal is the migration
// ladder's own `Save schema N is newer than supported M`, and the recovery screen is U-01's. Each was
// copied out of the source file named beside it, never retyped from memory.
//
// ⚠ AND NOTHING HERE READS THE ENGINE. `tsconfig.e2e.json`'s rule («what must never be listed is
// anything that reaches the engine») is intact: the two payload fields read below - `schemaVersion`
// and `physioActive` - are read out of the product's own bytes with the platform's own
// `DecompressionStream`, which is the same primitive `src/engine/saveCodec.ts` uses. No second codec,
// no import, and a renamed field fails LOUDLY on the `typeof` assertion beside it.

import { createHash } from 'node:crypto'
import { gunzipSync, gzipSync } from 'node:zlib'
import type { Page } from '@playwright/test'
import { test, expect } from './careerAt'
import { answerOpeningKnock, goHome, onScreenWeek, openMoney, openMore, openSaves } from './journey'
import { loadManifest, readFixtureBytes, splitEnvelope, type FixtureEntry } from '../tools/e2e-fixtures-read'

const manifest = loadManifest()
const fixture = (name: string): FixtureEntry => manifest.fixtures.find((f) => f.name === name)!

// ⚠ THESE FOUR MIRROR `src/db/saves.ts`, AND THE ARGUMENT FOR COPYING THEM RATHER THAN IMPORTING
// THEM IS ALREADY WRITTEN OUT - at the head of e2e/careerAt.ts, which carries the same four for the
// same reason (that file imports the engine and the Vue-facing protocol types). Not imported from
// `careerAt.ts` either: it does not export them, and this file is not the one to widen its surface.
// The copy is safe because the failure mode is LOUD - rename the database or a store and the reader
// below returns an empty list, which every precondition in this file asserts against by name.
const DB_NAME = 'tennis-sim'
const DB_VERSION = 2
const SAVES_STORE = 'saves'
const CAREERS_STORE = 'careers'

/** A fixed, in-the-past wall clock for the seeded rows – `careerAt.ts`'s `SEEDED_AT`, and its note
 *  there is the argument (a suite whose seeded state changes every run has given up determinism for
 *  nothing). Only case 2 seeds by hand; case 1 goes through `careerAt` like every other spec. */
const SEEDED_AT = Date.UTC(2026, 7, 8, 12, 0, 0)

/** ⚠ TRANSCRIBED, AND THE SOURCE FILE IS NAMED SO THE COPY CAN BE CHECKED: `src/stores/game.ts`'s
 *  `refreshAfterStale`. It is the EXISTING stale-command refusal (TB-02), which D-01's second arm
 *  reuses rather than adding a sentence – so this file matches on it and never on a new one. */
const STALE_SCREEN_REFUSAL = 'That action was based on an outdated screen – it was refreshed. Try again.'

/** ⚠ TRANSCRIBED from `src/App.vue`'s autosave strip. Asserted only as an ABSENCE, in case 2: it is
 *  the sentence a silent roll-back to the older generation prints, and D-02 is precisely the claim
 *  that a newer build's save does not print it. e2e/storage-recovery.spec.ts owns the positive half,
 *  on the fault this one really is for (a checksum that does not match). */
const AUTOSAVE_RECOVERED_NOTICE = 'Autosave was damaged – restored the previous one.'

/** The three doors out of recovery, by the names on them – e2e/storage-recovery.spec.ts's own list,
 *  because case 2 lands on that same existing screen and the claim is that it is reached at all. */
const DOORS = ['Retry', 'Import a save file', 'Start a new career']

/** The recovery screen's heading, transcribed from `src/App.vue`. */
const RECOVERY_HEADING = "Saved games can't be reached"

// =================================================================================================
// READING THE DISK, which is the half of both cases no screen can answer
// =================================================================================================

/** One autosave generation as it really sits in IndexedDB. */
interface GenerationOnDisk {
  slot: string
  revision: number
  week: number
  /** `sha256(payload)`, hex – the record's own `checksum` field re-derived. Two generations holding
   *  the same world have the same digest, which is exactly what D-01's loss looks like on disk. */
  digest: string
  /** off the decoded payload – case 2's whole point */
  schemaVersion: number
  /** off the decoded payload – the one field case 1 moves */
  physioActive: boolean
}

/**
 * Every `auto:<careerId>:*` record in the database, newest revision first.
 *
 * ⚠ IT OPENS WITHOUT A VERSION, DELIBERATELY. `indexedDB.open(name)` attaches to whatever version is
 * there instead of asking for one, so the day `DB_VERSION` moves this reader keeps reading instead of
 * becoming a `VersionError` in a spec that is not about versions. The constant above is still needed
 * by case 2, which CREATES the database.
 *
 * ⚠ A MISSING STORE RETURNS AN EMPTY LIST rather than throwing: a failed seed then fails on the
 * precondition that names it, instead of on a `NotFoundError` inside a helper.
 */
async function autoGenerations(page: Page, careerId: string): Promise<GenerationOnDisk[]> {
  return page.evaluate(
    async ({ dbName, store, prefix }) => {
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('indexedDB.open failed'))
      })
      if (!database.objectStoreNames.contains(store)) {
        database.close()
        return []
      }
      const rows = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const request = database.transaction(store, 'readonly').objectStore(store).getAll()
        request.onsuccess = () => resolve(request.result as Record<string, unknown>[])
        request.onerror = () => reject(request.error ?? new Error('getAll failed'))
      })
      database.close()

      const hex = (bytes: Uint8Array): string =>
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

      const out: GenerationOnDisk[] = []
      for (const row of rows) {
        if (typeof row.slot !== 'string' || !row.slot.startsWith(prefix)) continue
        const payload = row.payload as Uint8Array
        const stream = new Blob([payload as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
        const world = JSON.parse(await new Response(stream).text()) as Record<string, unknown>
        out.push({
          slot: row.slot,
          revision: (row.revision as number | undefined) ?? 0,
          week: row.week as number,
          digest: hex(new Uint8Array(await crypto.subtle.digest('SHA-256', payload as BufferSource))),
          schemaVersion: world.schemaVersion as number,
          physioActive: world.physioActive as boolean,
        })
      }
      return out.sort((a, b) => b.revision - a.revision)
    },
    { dbName: DB_NAME, store: SAVES_STORE, prefix: `auto:${careerId}:` },
  )
}

/** The revisions on disk, newest first – the shape every step of case 1 is expressed as. */
async function revisionsOnDisk(page: Page, careerId: string): Promise<number[]> {
  return (await autoGenerations(page, careerId)).map((g) => g.revision)
}

/**
 * Wait until the generation pair on disk reads exactly this, newest revision first.
 *
 * ⚠ THIS IS THE WAIT AFTER EVERY COMMAND IN CASE 1, and it is a real one rather than a sleep (banned
 * outright, e2e/README.md). `mutate` writes the autosave and THEN answers, so a generation arriving at
 * revision N+1 IS the command having committed – observed where it landed rather than inferred from a
 * repaint.
 *
 * ⚠ AND A POLL RATHER THAN A ONE-SHOT READ, WHICH THE FIRST DRAFT PAID FOR. `physio.click()` returns
 * when the click has been dispatched, not when the worker has answered it, so a read taken on the next
 * line saw the pair from before the commit (`[3, 2]` where `[4, 3]` was expected) – a false red with
 * nothing wrong in the app. `expect.poll` retries the same read, which is what this directory allows
 * instead of `page.waitForTimeout`.
 */
async function expectRevisions(
  page: Page,
  careerId: string,
  revisions: number[],
  message: string,
): Promise<void> {
  await expect.poll(() => revisionsOnDisk(page, careerId), { message }).toEqual(revisions)
}

// =================================================================================================
// CASE 1 · A RESTORE AFTER A NON-REFRESHING ACTION (D-01, both arms in one walk)
// =================================================================================================

/** Money's Bills chapter, where the physio lever is (R9-5: «recurring budget levers live with the
 *  money»). The chapter row is the same named group four other specs address it by.
 *
 *  ⚠ `exact` ON THE PANEL'S HEADING, MEASURED RATHER THAN GUESSED: Money's own screen title is
 *  «Family Budget» and the levers panel's eyebrow is «Budget», so a substring match on the second is
 *  a strict-mode collision with the first. The first run of this file found it. */
async function openBills(page: Page): Promise<void> {
  await page
    .getByRole('group', { name: 'Which part of the budget' })
    .getByRole('button', { name: 'Bills', exact: true })
    .click()
  await expect(page.getByRole('heading', { name: 'Budget', exact: true })).toBeVisible()
}

test('«Restore previous» after a non-refreshing action gives back the previous world, and keeps the later one', async ({
  page,
  careerAt,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  const junior = await careerAt('junior')
  const careerId = junior.careerId

  // ONE generation, the seed's own, at the revision careerAt writes on both halves of the CAS pair.
  // Asserted before anything is pressed so every later reading is a difference from a known start.
  expect(await revisionsOnDisk(page, careerId), 'the seeded career is one generation at revision 1').toEqual([1])

  // -----------------------------------------------------------------------------------------------
  // 1. A NON-REFRESHING ACTION, THROUGH THE UI. `decideKnock` is the plan's own «natural one» and it
  //    is one of D-01's fifteen: it commits an autosave into the OLDER generation and does NOT
  //    refresh `game.slots` (src/stores/game.ts, `decideKnock` – no `refreshSlots()` in its body).
  // -----------------------------------------------------------------------------------------------
  // ⚠ A SECOND READING OF week-advance.spec.ts's CANARY, and it is load-bearing HERE rather than
  // decorative: if `junior` ever boots clean, `answerOpeningKnock` steps through nothing, no
  // unrefreshed commit happens, and everything below would pass against a career this case never
  // put into the state it is about. Said with the fixture's name so a regeneration reports itself.
  await expect(
    page.getByRole('radio', { name: /^Rest it/ }),
    `the '${junior.name}' fixture is expected to boot holding an open knock – answering it is this ` +
      "case's non-refreshing action. If this is the only red line here, the regenerated save no " +
      'longer holds one: move the case to a fixture that does, or reach another of D-01\'s fifteen.',
  ).toBeVisible()
  await answerOpeningKnock(page)
  await expectRevisions(page, careerId, [2, 1], 'answering the knock committed a second generation')

  // -----------------------------------------------------------------------------------------------
  // 2. AND A REFRESHING ONE, so the screen has TWO rows to be stale about.
  // -----------------------------------------------------------------------------------------------
  // ⚠ THIS STEP IS THE REVIEW'S OWN SETUP AND NOT PADDING (D-01's evidence: «Advance, then
  // setPhysio»). The loss needs a list that is stale about a generation that has since ROTATED, which
  // takes one correct refresh and then one missing one; with a single generation on disk More draws
  // no «Restore previous» at all. `setWeightEnabled` is chosen because it refreshes (game.ts) and
  // because it moves nothing else – no tick, no draw, no dialog - so the walk stays deterministic.
  // Its row's name is transcribed by e2e/weight.spec.ts off `WEIGHT_COPY.title`; the state is asserted
  // on `aria-checked` for that file's reason (the state is on the control, the word beside it is copy).
  await openMore(page)
  const weight = page.getByRole('switch', { name: 'The weight' })
  await expect(weight).toHaveAttribute('aria-checked', 'false')
  await weight.click()
  await expect(weight, 'the press round-tripped through the worker').toHaveAttribute('aria-checked', 'true')
  await expectRevisions(page, careerId, [3, 2], 'a refreshing command rotated into the older generation')

  // -----------------------------------------------------------------------------------------------
  // 3. THE ACTION THE REVIEW MEASURED: `setPhysio`, the last of the fifteen and the one D-01's probe
  //    used. Money > Bills, one lever, one commit, no refresh.
  // -----------------------------------------------------------------------------------------------
  await goHome(page)
  await openMoney(page)
  await openBills(page)
  const physio = page.getByRole('checkbox', { name: /^Physio recovery/ })
  await expect(physio, 'the Budget lever is reachable by its own name').toBeVisible()
  // ⚠ READ, NOT ASSUMED. Whether a fixture opens with the retainer on is a property of the coaching
  // rung its recipe hired (`coachIncludesPhysio`), which is not this case's business – what matters
  // is that the value MOVES and then comes back.
  const wasActive = await physio.isChecked()
  await physio.click()
  await expectRevisions(
    page,
    careerId,
    [4, 3],
    'the physio toggle committed, into the generation the previous commit left older',
  )

  // AND THE TWO GENERATIONS NOW HOLD TWO DIFFERENT WORLDS, which is the state «Restore previous» is
  // FOR. Read off the payloads rather than off the screen: the pre-action career exists in exactly
  // one place in the world now, and that place is a row in this database.
  const beforeRestore = await autoGenerations(page, careerId)
  expect(typeof beforeRestore[0]?.physioActive, 'the payload still carries `physioActive`').toBe('boolean')
  expect(
    beforeRestore.map((g) => g.physioActive),
    'newest generation = after the toggle, older = before it',
  ).toEqual([!wasActive, wasActive])
  const later = beforeRestore[0]
  const previous = beforeRestore[1]

  // -----------------------------------------------------------------------------------------------
  // 4. MORE > SAVES, «RESTORE PREVIOUS».
  // -----------------------------------------------------------------------------------------------
  // ⚠ WHAT THE SCREEN HAS TO GET RIGHT HERE is which row «previous» is. `autoSlots[1]` is sorted off
  // the RECORD's `savedAt`, so a list read before the last commit names the generation that holds the
  // CURRENT state – and the restore then commits the present over the past. T1.1's `watch` on
  // `game.revision` (`immediate`, so it fires on this very mount) is what makes the list the disk's.
  await goHome(page)
  await openSaves(page)
  const restore = page.getByRole('button', { name: 'Restore previous', exact: true })
  await expect(restore, 'a second generation exists, so the screen offers the restore').toBeVisible()
  await restore.click()
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()

  // ⚠⚠ ONE POLL, TWO OUTCOMES, AND THAT IS ON PURPOSE. With T1.1's first arm reverted the restore is
  // not silently destructive any more – its SECOND arm refuses it, because the revision the stale row
  // claimed is not the revision that record holds (`StaleRevisionError`, sim.worker.ts). So the red
  // this case must produce is «a refusal where a successful restore was expected», and a bare wait on
  // the disk would report it as a timeout on a number. This returns the refusal instead, so the
  // failure message says what happened rather than what did not.
  await expect
    .poll(
      async () => {
        if ((await page.getByText(STALE_SCREEN_REFUSAL).count()) > 0) return 'refused'
        return (await revisionsOnDisk(page, careerId)).join(',')
      },
      {
        message:
          'the restore should have committed the previous generation as the newest one. "refused" ' +
          'means More was working from a stale slot list and the worker turned the restore down – ' +
          "which is D-01's first arm missing, caught by its second.",
      },
    )
    .toBe('5,4')

  // -----------------------------------------------------------------------------------------------
  // 5. WHAT IS ON DISK: THE PREVIOUS WORLD CAME BACK AND THE LATER ONE IS STILL THERE, BYTE FOR BYTE.
  // -----------------------------------------------------------------------------------------------
  // ⚠ THE DISK IS READ BEFORE THE SCREEN, MEASURED RATHER THAN PREFERRED. With BOTH of T1.1's arms
  // reverted the restore is not refused – it succeeds, at revision 5, holding the CURRENT world – and
  // in the first draft the screen assertion below fired first, so this block was never reached on the
  // one arm that breaks it. A claim that cannot fail is decoration (docs/specs/e2e-coverage.md §13
  // records this suite learning that once already, the expensive way), so the order is the other way
  // round now: the FIRST line below is the one that was then watched red, `[true, true]` against
  // `[false, true]`. The three beside it read the same loss from three other angles and are kept
  // because they cost one `page.evaluate` that has already happened.
  //
  // ⚠ AND IT IS WRITTEN AS A DIFFERENCE RATHER THAN AS A PRESENCE. Under the defect BOTH generations
  // end up holding the current world – the restore reads the row that holds the present and commits it
  // over the only row that held the past – so «two rows exist» stays green straight through it. The
  // claim is that the pair still holds TWO DIFFERENT WORLDS, and that the one the player restored away
  // from was not touched on the way.
  const afterRestore = await autoGenerations(page, careerId)
  expect(
    afterRestore.map((g) => g.physioActive),
    'the two generations still hold two different worlds – the restored one and the one it undid',
  ).toEqual([wasActive, !wasActive])
  expect(
    new Set(afterRestore.map((g) => g.digest)).size,
    'two generations, two payloads: a restore that copied the present over the past would print ' +
      'one digest twice',
  ).toBe(2)
  expect(
    afterRestore.find((g) => g.slot === later.slot),
    'the generation holding the post-action world was not written over by the restore',
  ).toEqual(later)
  // The pre-action generation's own bytes are what came back: the newest record now carries the
  // digest the older one carried before the restore.
  expect(afterRestore[0]?.digest, 'the newest generation IS the previous one, re-committed').toBe(previous.digest)

  // -----------------------------------------------------------------------------------------------
  // 6. AND THE SCREEN THE ACTION WAS TAKEN ON AGREES.
  // -----------------------------------------------------------------------------------------------
  // The same lever, read back through the whole chain – worker to snapshot to checkbox – which is the
  // side a player sees the restore from and the only proof that what landed on disk is also what the
  // app is now playing.
  await goHome(page)
  await openMoney(page)
  await openBills(page)
  await expect(
    page.getByRole('checkbox', { name: /^Physio recovery/ }),
    'the restore gave back the world as it was BEFORE the unrefreshed command',
  ).toBeChecked({ checked: wasActive })

  expect(crashes, 'the app threw while restoring the previous autosave').toEqual([])
})

// =================================================================================================
// CASE 2 · BOOTING BESIDE A NEWER BUILD'S SAVE (D-02)
// =================================================================================================

/** What the browser side of case 2's seed is handed. Every field is JSON-safe: `addInitScript`
 *  serialises its argument and a `Uint8Array` does not survive that trip (careerAt.ts's own note), so
 *  the two byte fields cross as base64 and are rebuilt inside the page. */
interface StraddleSeed {
  dbName: string
  dbVersion: number
  savesStore: string
  careersStore: string
  records: {
    slot: string
    careerId: string
    savedAt: number
    week: number
    seed: string
    bytes: number
    kidName: string
    country: string
    revision: number
    checksumB64: string
    payloadB64: string
  }[]
  meta: {
    careerId: string
    kidName: string
    country: string
    seed: string
    createdAt: number
    lastPlayedAt: number
    week: number
    revision: number
  }
}

/**
 * THE ONE RECORD IN THIS SUITE THAT IS RE-ENCODED RATHER THAN SLICED, AND IT SAYS SO.
 *
 * `e2e/careerAt.ts` seeds by SLICING an envelope the product's own `compressWorld` wrote – «nothing
 * here encodes, compresses or checksums anything» – and that contract is why a seeded record is
 * identical to one the app wrote. Case 2 needs a record this build CANNOT read, which no slice of any
 * committed fixture is: so the payload is decoded, `schemaVersion` is moved by one, and it is
 * re-gzipped with a checksum over the new bytes. The plan sanctions exactly this
 * (docs/plans/principles-fix-builder-2026-09.md T1.6.2: «encode a fixture, bump the field,
 * re-encode») and it is NOT a save-schema move: `SAVE_SCHEMA_VERSION` is untouched, one test
 * fixture's bytes claim a version that does not exist yet, which is precisely the field condition.
 *
 * ⚠ AND ONLY THAT ONE FIELD MOVES. No world is poked into shape (docs/plans/e2e-fixtures.md's rule):
 * both generations hold the career the engine played out, and what differs between them is the
 * version one of them CLAIMS to have been written by - which is the real state of a device whose
 * newer tab, or newer installed shell, committed once (`registerType: 'prompt'`, src/pwa.ts: «a
 * player can sit on the OLD worker for days»).
 */
function futureSchemaPayload(payload: Uint8Array, schemaVersion: number): { payload: Uint8Array; checksum: Uint8Array } {
  const world = JSON.parse(gunzipSync(payload).toString('utf8')) as Record<string, unknown>
  if (typeof world.schemaVersion !== 'number') {
    throw new Error('the fixture payload carries no numeric schemaVersion – the bump has nothing to move')
  }
  world.schemaVersion = schemaVersion
  const bumped = gzipSync(Buffer.from(JSON.stringify(world), 'utf8'))
  return {
    payload: new Uint8Array(bumped),
    // `sha256` over the gzip payload – saveCodec.ts's own layout comment: "sha256(32) of gzip payload".
    checksum: new Uint8Array(createHash('sha256').update(bumped).digest()),
  }
}

/** The straddle: generation `a` is the fixture, generation `b` is one schema ahead and one revision
 *  newer, so `recNewer` reaches for it first. The careers row agrees with `b`, because a pair that
 *  disagreed would be a torn write no real commit could produce (careerAt.ts's `SEEDED_REVISION`). */
function straddleSeedFor(entry: FixtureEntry, futureVersion: number): StraddleSeed {
  const { checksum, payload } = splitEnvelope(readFixtureBytes(entry.file))
  const future = futureSchemaPayload(payload, futureVersion)
  const b64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64')
  const row = (
    slot: string,
    bytes: Uint8Array,
    sum: Uint8Array,
    revision: number,
  ): StraddleSeed['records'][number] => ({
    slot,
    careerId: entry.careerId,
    savedAt: SEEDED_AT + revision,
    week: entry.facts.week,
    seed: entry.seed,
    // The PAYLOAD's length, not the file's – src/db/saves.ts writes `bytes: payload.byteLength`.
    bytes: bytes.byteLength,
    kidName: entry.profile.kidName,
    country: entry.profile.country,
    revision,
    checksumB64: b64(sum),
    payloadB64: b64(bytes),
  })

  return {
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    savesStore: SAVES_STORE,
    careersStore: CAREERS_STORE,
    records: [
      row(entry.slot, payload, checksum, 1),
      row(`auto:${entry.careerId}:b`, future.payload, future.checksum, 2),
    ],
    meta: {
      careerId: entry.careerId,
      kidName: entry.profile.kidName,
      country: entry.profile.country,
      seed: entry.seed,
      createdAt: SEEDED_AT,
      lastPlayedAt: SEEDED_AT,
      week: entry.facts.week,
      revision: 2,
    },
  }
}

/**
 * Written INSIDE the versionchange transaction, which is the ordering guarantee and not a margin –
 * `e2e/careerAt.ts`'s `seedIndexedDb` carries the full argument and it is not repeated here. The
 * one-shot is the database's own existence, so the reload in this case re-runs this script and writes
 * nothing.
 */
function seedStraddledPair(seed: StraddleSeed): void {
  const bytes = (b64: string): Uint8Array => {
    const binary = atob(b64)
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
    return out
  }
  const request = indexedDB.open(seed.dbName, seed.dbVersion)
  request.onupgradeneeded = () => {
    const database = request.result
    const transaction = request.transaction
    if (!transaction) {
      ;(window as unknown as { __tbStraddleError?: string }).__tbStraddleError =
        'no versionchange transaction on upgradeneeded'
      return
    }
    // Created exactly as src/db/saves.ts creates them, keyPaths included.
    if (!database.objectStoreNames.contains(seed.savesStore)) {
      database.createObjectStore(seed.savesStore, { keyPath: 'slot' })
    }
    if (!database.objectStoreNames.contains(seed.careersStore)) {
      database.createObjectStore(seed.careersStore, { keyPath: 'careerId' })
    }
    const saves = transaction.objectStore(seed.savesStore)
    for (const { checksumB64, payloadB64, ...rest } of seed.records) {
      saves.put({ ...rest, checksum: bytes(checksumB64), payload: bytes(payloadB64) })
    }
    transaction.objectStore(seed.careersStore).put(seed.meta)
  }
  request.onsuccess = () => request.result.close()
  request.onerror = () => {
    ;(window as unknown as { __tbStraddleError?: string }).__tbStraddleError =
      request.error?.message ?? 'indexedDB.open failed'
  }
}

/** The seed's own report, read back after the app has booted – `careerAt.ts`'s `seedOutcome` in
 *  miniature, and here for its reason: a broken seed must say «the bytes never landed» rather than
 *  leave a spec to report a screen it cannot explain. */
async function straddleSeedError(page: Page): Promise<string | null> {
  return page.evaluate(
    () => (window as unknown as { __tbStraddleError?: string }).__tbStraddleError ?? null,
  )
}

test('a newest generation from a newer build is refused at the boot door, and is still there afterwards', async ({
  page,
}) => {
  const crashes: string[] = []
  page.on('pageerror', (error) => crashes.push(error.message))

  // ⚠ NOTHING HERE HARD-CODES A SCHEMA VERSION – e2e/save-file.spec.ts's design requirement, applied
  // to the other door. The version is the manifest's plus one, so the day `SAVE_SCHEMA_VERSION` moves
  // and the fixtures are regenerated this case keeps asking the right question with no edit.
  const entry = fixture('junior')
  const future = manifest.schemaVersion + 1
  await page.addInitScript(seedStraddledPair, straddleSeedFor(entry, future))
  await page.goto('/')

  // -----------------------------------------------------------------------------------------------
  // 0. THE PREMISE, OFF THE DISK: two generations, the newer one a schema ahead.
  // -----------------------------------------------------------------------------------------------
  expect(await straddleSeedError(page), 'seeding the straddled pair failed before the app read it').toBeNull()
  const seeded = await autoGenerations(page, entry.careerId)
  expect(
    seeded.map((g) => ({ revision: g.revision, schemaVersion: g.schemaVersion })),
    'the database holds a newer-build newest generation beside a valid older one',
  ).toEqual([
    { revision: 2, schemaVersion: future },
    { revision: 1, schemaVersion: manifest.schemaVersion },
  ])

  // -----------------------------------------------------------------------------------------------
  // 1. THE EXISTING ERROR SURFACE SHOWS – U-01's recovery exit, with no new sentence anywhere.
  // -----------------------------------------------------------------------------------------------
  // ⚠ THE SENTENCE IS THE MIGRATION LADDER'S OWN, BYTE FOR BYTE (`engine/migrations.ts`, and
  // `decompressWorld` reuses it verbatim so no copy moved): it travels from a `SaveFileError` in the
  // worker, through `errorMsg`'s `future-schema` code and `loadCareer`'s refusal, into `initError`,
  // which App.vue renders as it arrives. That whole chain is why this is an e2e claim: every link is
  // in a different module and only a booting browser has all of them at once.
  await expect(page.getByRole('heading', { name: RECOVERY_HEADING })).toBeVisible()
  await expect(
    page.getByText(`Save schema ${future} is newer than supported ${manifest.schemaVersion}`),
    "the door's own reason reached the player, in the ladder's words",
  ).toBeVisible()
  for (const door of DOORS) {
    await expect(page.getByRole('button', { name: door, exact: true })).toBeEnabled()
  }

  // -----------------------------------------------------------------------------------------------
  // 2. AND THE OLDER GENERATION WAS NOT SILENTLY OPENED.
  // -----------------------------------------------------------------------------------------------
  // ⚠ THIS IS THE DEFECT, AND WHAT IT LOOKS LIKE WAS MEASURED RATHER THAN GUESSED AT.
  // `readLatestAutosave` caught ANY throw from the newer generation and loaded the older one with
  // `recovered: true`; with the guard removed this page takes the ORDINARY LAUNCH instead – the
  // screenshot from that arm holds one control, «Tap to start» – and behind it the older week with the
  // repair notice over it, then the newer generation overwritten by the next two commits.
  //
  // So the two lines that discriminate are the heading above and the splash below: a booting app that
  // reaches its own splash here has already decided this career is readable. The notice and the week
  // are asserted beside them because they cost nothing and because they name the thing that makes the
  // roll-back a LIE rather than merely a loss – the app saying «this was corruption and I fixed it»
  // about a save that is neither. They sit behind the splash in today's shell, so they are the claim
  // that would still hold a change which skipped it.
  await expect(page.getByRole('button', { name: 'Tap to start' })).toHaveCount(0)
  await expect(
    page.getByText(AUTOSAVE_RECOVERED_NOTICE),
    'a save from a newer build was reported to the player as a repaired one',
  ).toHaveCount(0)
  await expect(
    page.getByText(onScreenWeek(entry.facts.week)),
    'the older generation was opened behind the refusal',
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Family budget/ })).toHaveCount(0)
  // ...and no fresh install either, which is the other lie this screen exists to stop telling.
  await expect(page.getByRole('heading', { name: 'Raise a Champion. Together.' })).toHaveCount(0)

  // -----------------------------------------------------------------------------------------------
  // 3. TWO MORE COMMANDS, AND BOTH GENERATIONS ARE STILL BYTE-IDENTICAL.
  // -----------------------------------------------------------------------------------------------
  // ⚠ THE TWO COMMANDS ARE A SECOND BOOT'S, AND THAT IS A CORRECTED PREMISE RATHER THAN A SHORTCUT.
  // The plan asks for «after two commands the newer generation is still on disk», because the review
  // measured the loss as taking exactly two COMMITS on that career: with the fallback in place the
  // app opened the older generation and its next two autosaves rotated over the v90 record. With the
  // refusal in place that career never loads, so there is no surface from which a commit on it can be
  // issued at all – the two commands available here are the ones a reload re-issues, `listCareers`
  // and `loadCareer`, through a brand-new worker. That is also the trigger's own shape: a player
  // reopening the app after the newer tab wrote once.
  await page.reload()
  await expect(
    page.getByRole('heading', { name: RECOVERY_HEADING }),
    'the refusal is the door\'s standing answer, not a first-boot accident',
  ).toBeVisible()
  await expect(page.getByText(AUTOSAVE_RECOVERED_NOTICE)).toHaveCount(0)

  expect(
    await autoGenerations(page, entry.careerId),
    'a refused boot leaves both generations exactly where they were – revision, bytes and payload',
  ).toEqual(seeded)

  expect(crashes, "the app threw while refusing a newer build's save").toEqual([])
})
