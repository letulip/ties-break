// THE SEEDING FIXTURE (S1b of docs/plans/playwright.md) - the join between S0's harness and S1a's
// five committed careers, and the load-bearing idea of the whole layer: A TEST STARTS AT WEEK 412
// INSTEAD OF CLICKING THROUGH 412 WEEKS.
//
// A spec asks for a state by name and gets the app already in it:
//
//     import { test, expect } from './careerAt'
//
//     test('week 412 is on screen', async ({ page, careerAt }) => {
//       const pro = await careerAt('pro')
//       await expect(page.getByText(weekDateLine(pro.facts.week))).toBeVisible()
//     })
//
// It is a FIXTURE and not a helper function on purpose: `test.extend` puts it in the test's
// lifecycle, so isolation and teardown are Playwright's problem rather than a rule people have to
// remember. Every test gets its own browser context, and a context's IndexedDB and localStorage are
// born empty - which is the whole reason the one-shot latch below can be as simple as it is.
//
// ⚠ THE BYTES ARE THE PRODUCT'S OWN, END TO END. The record written below is an envelope slice
// (`splitEnvelope`, tools/e2e-fixtures-read.ts) of a file the shipped `saveCodec` wrote, put into
// the object stores `src/db/saves.ts` defines, under the slot naming that file uses. Nothing here
// encodes, compresses or checksums anything: `decompressWorld` verifies THAT checksum against THOSE
// bytes on read, so a seeded record is not merely equivalent to one the app wrote - it is identical.
//
// ⚠ AND NOTHING HERE IS A TEST HOOK IN THE PRODUCT. The app has no idea it is being seeded. There is
// no query parameter, no exposed binding, no branch in `src/`; the only test-shaped switch in the
// whole layer is `VITE_TB_SW=off` on the webServer, which S0 argued for separately and which the
// smoke spec asserts is still in force.

import { test as base, expect, type Page } from '@playwright/test'
import {
  loadManifest,
  readFixtureBytes,
  splitEnvelope,
  type FixtureEntry,
  type FixtureName,
} from '../tools/e2e-fixtures-read'

// ⚠ THESE FOUR MIRROR `src/db/saves.ts` AND THAT FILE IS THE SOURCE OF TRUTH. They are copied rather
// than imported because `src/db/saves.ts` imports the engine and the Vue-facing protocol types, and
// dragging that into every Playwright worker to read four constants is the cost the reader module's
// header argues against at length. The copy is safe because the failure mode is LOUD: rename the
// database or a store and the app finds no career, so every fact assertion in seeded-careers.spec.ts
// goes red at once with the seeded value it expected printed beside the wizard it got. A silent pass
// is not reachable from here.
const DB_NAME = 'tennis-sim'
const DB_VERSION = 2
const SAVES_STORE = 'saves'
const CAREERS_STORE = 'careers'

/** A fixed, in-the-past wall clock for `savedAt` / `createdAt` / `lastPlayedAt`.
 *
 *  `Date.now()` would work and is what the app writes, but a suite whose seeded state changes every
 *  run has given up determinism for nothing - and this project's whole claim on a trustworthy e2e
 *  layer is that it is deterministic by construction. Nothing in the app compares these to the
 *  present: they order the careers list and the slot rows, and `nextSavedAt()` in src/db/saves.ts
 *  takes `Math.max(Date.now(), ...)`, so the first real autosave lands cleanly after this. */
const SEEDED_AT = Date.UTC(2026, 7, 8, 12, 0, 0)

/** The revision the seeded record claims to have committed.
 *
 *  W1-INTEGRITY-A: `readLatestAutosave` adopts `max(careers row, both generations)` and the next
 *  commit is that + 1, so any consistent number works. 1 is what a real career carries after its
 *  first `adoptAutosave` (`disk revision + 1` from zero), which is what a seeded career is standing
 *  in for. Writing it on BOTH the record and the careers row is the part that matters: they are the
 *  compare-and-swap pair, and a seeded pair that disagreed would be a torn write no real commit
 *  could produce. */
const SEEDED_REVISION = 1

/** The one-shot latch. See `seedOnce` - it is in localStorage because it has to be readable
 *  SYNCHRONOUSLY, before the app's first module reads a preference key. */
const LATCH_KEY = 'tb-e2e-seeded'

/**
 * HOW THE BROWSER'S OWN STORAGE BEHAVES FOR THIS TEST.
 *
 * ⚠ THIS IS AN ENVIRONMENT CONDITION, NOT A CAREER STATE, and the distinction is what keeps
 * "fixtures are found, not forged" intact (docs/plans/e2e-fixtures.md). Every WORLD this harness
 * writes is one the engine played out and the shipped codec encoded. What varies here is the DATABASE
 * around it - which version it is at, and whether the newest generation survived the write - and both
 * of those are things a real browser does to a real player, on a path `src/db/saves.ts` already has
 * code for. Nothing about the career is poked into shape.
 *
 *   * `ok`          - the database the app expects, holding the fixture. The default.
 *   * `unreachable` - the record is there, in a database at a version this build cannot open. The
 *                     browser refuses the open with its own `VersionError`, which is the failure
 *                     `game.init()` turns into `phase === 'recovery'`. Reachable in play the moment a
 *                     `DB_VERSION` bump ships and an older bundle runs against it - which, in a PWA
 *                     with a precache and a `registerType: 'prompt'` update banner, is not exotic.
 *                     ⚠ THE APP NEVER REACHES THE SPLASH IN THIS STATE, so `careerAt` does not click
 *                     one; the recovery screen is deliberately rendered ahead of it (App.vue: "a
 *                     player whose database is broken must meet the choices, not a wordmark waiting
 *                     on data").
 */
export type StorageState = 'ok' | 'unreachable'

/**
 * WHETHER THE NEWEST AUTOSAVE GENERATION SURVIVED ITS WRITE.
 *
 * `damaged` seeds TWO generations: `b` carries a higher revision and a payload with one byte flipped,
 * `a` carries the fixture. `readLatestAutosave` takes the newest, fails its SHA-256, falls back to the
 * older one and reports `recovered: true` - the path behind the "Autosave was damaged" banner. The
 * flipped byte is the honest shape of the fault: a torn write or a bad block leaves a record that is
 * present, well-formed and wrong, which is exactly what a checksum is for.
 */
export type AutosaveState = 'intact' | 'damaged'

export interface CareerAtOptions {
  /** see `StorageState` */
  storage?: StorageState
  /** see `AutosaveState` */
  autosave?: AutosaveState
  /**
   * localStorage to write for this career, applied AFTER the clear.
   *
   * ⚠ READ THIS BEFORE WRITING A MAIL-MARKER SPEC. The default is an empty localStorage - a device
   * that has never met this career - and that is NOT the same as "everything is unseen". The
   * watermarks in `src/composables/inboxCue.ts` deliberately seed themselves to "now" the first time
   * they find no stored value ("claim nothing", and the ⚠ on `sync()` explains why leaving that
   * write out was a bug that hid itself). So on a freshly seeded career:
   *
   *   * `pro`'s two unopened kit letters raise the inbox dot through the ENGINE's half of the
   *     predicate (`snapshot.offerOpen` - a live offer is waiting), which is real and asserted;
   *   * the ARRIVAL half (`letterUnseen`) reads false, because the watermark was just written to the
   *     newest letter there is.
   *
   * A spec that wants the arrival half has to say so, by pinning the watermark behind the letters:
   *
   *     await careerAt('pro', { localStorage: { [`tb:lastSeenInboxLetter:${careerIdFor('pro')}`]: '' } })
   *
   * ('' is how that module stores an empty inbox - never the string "null", which its own header
   * calls a five-character id no letter will ever have.)
   */
  localStorage?: Record<string, string>
}

/**
 * ⚠ A WEEK-0 FIXTURE MEETS THE FIRST-RUN TOUR, AND A SPEC THAT IS NOT ABOUT ONBOARDING MUST SAY SO.
 *
 * The coach marks are offered to any device that has never ANSWERED them while the career is still
 * at week 0 (App.vue, `tourWanted`), and this fixture clears localStorage by design – so a spec
 * seeded with `fresh` boots straight into them. They are not blocking, but `.coach-tooltip` is a real
 * element with `pointer-events: auto`, so it can and does intercept a click on whatever it is over.
 *
 * Passing this retires the tour for that context, exactly as a player who has answered it once:
 *
 *     await careerAt('fresh', { localStorage: TOUR_ANSWERED })
 *
 * `e2e/onboarding-tour.spec.ts` is the spec that deliberately does NOT pass it.
 */
export const TOUR_ANSWERED: Record<string, string> = { 'tb:onboardingTourSeen': '1' }

export type CareerAt = (name: FixtureName, options?: CareerAtOptions) => Promise<FixtureEntry>

/**
 * THE ENVIRONMENT COMES BACK: rebuild the database at the version this build asks for, holding the
 * same career, WITHOUT NAVIGATING.
 *
 * ⚠ THE "WITHOUT NAVIGATING" IS THE WHOLE POINT, and it is what the spec that uses this is about.
 * `src/db/saves.ts` memoises its connection promise, and it used to memoise a REJECTED one with equal
 * enthusiasm: a single denied open at boot poisoned every later call, including the recovery screen's
 * own Retry, until the tab was reloaded (W1-INTEGRITY-B / TB-06). The fix - clearing the cache on the
 * way out of a rejection - can only be observed by asking a live page to open the database a second
 * time and succeed. A reload would prove nothing, because a reload works either way.
 *
 * What this does to the browser is exactly what the recovery screen promises a player: the storage
 * comes back and the careers are still there. The bytes are the same product-written bytes the seed
 * carried in, replayed from the page where the init script parked them - nothing is re-encoded, and
 * the app has no idea anything happened.
 */
export type StorageComesBack = () => Promise<void>

/** The manifest is read once per worker process, not once per test: it is a 7 KiB JSON file and
 *  five saves totalling 281 KiB, and re-reading them for every test would be the one slow thing in
 *  a fixture whose entire selling point is that it is fast. */
const manifest = loadManifest()

/** What the browser side is handed. Every field is JSON-safe: Playwright serialises `addInitScript`
 *  arguments, and a `Uint8Array` does NOT survive that trip - it arrives as `{0: 31, 1: 139, ...}`,
 *  a plain object that `decompressWorld` would refuse. So the two byte fields cross as base64 and
 *  are rebuilt into real typed arrays inside the page, where structured clone can store them. */
interface SeedRecord {
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
}

interface SeedPayload {
  dbName: string
  /** the version the database is CREATED at. `DB_VERSION` normally; one higher for `unreachable`. */
  dbVersion: number
  /** the version the app will ask for - what a repair has to rebuild at */
  appDbVersion: number
  savesStore: string
  careersStore: string
  latchKey: string
  /** ⚠ A LIST, NOT ONE RECORD, because the two autosave generations are the point of the `damaged`
   *  case. Ordinarily it holds exactly one: generation `a`, the fixture. */
  records: SeedRecord[]
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
  storage: Record<string, string>
}

/** The seed's own report, read back after the app has booted. `page.evaluate` awaits a promise, so
 *  awaiting this is awaiting the transaction's `complete` event - not a guess about it. */
type SeedState = 'seeded' | 'already-seeded'

/** One byte of a real payload, flipped. See `AutosaveState`: the fault a checksum exists to catch is
 *  a record that is present and well-formed and wrong, not one that is missing. The byte is picked
 *  deep inside the gzip stream rather than at index 0 so the damage is a corrupt member rather than a
 *  wrong magic - either fails, and this one fails the way disk rot does. */
function flipOneByte(payload: Uint8Array): Uint8Array {
  const damaged = Uint8Array.from(payload)
  const at = Math.floor(damaged.length / 2)
  damaged[at] = damaged[at] ^ 0xff
  return damaged
}

function payloadFor(entry: FixtureEntry, options: CareerAtOptions): SeedPayload {
  const { checksum, payload } = splitEnvelope(readFixtureBytes(entry.file))
  const b64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString('base64')
  const damaged = options.autosave === 'damaged'
  const unreachable = options.storage === 'unreachable'

  const generation = (gen: 'a' | 'b', bytes: Uint8Array, revision: number): SeedRecord => ({
    // The slot naming is src/db/saves.ts's own (`auto:{careerId}:{gen}`); the manifest already
    // carries generation `a`, so only the second one is composed here.
    slot: gen === 'a' ? entry.slot : `auto:${entry.careerId}:b`,
    careerId: entry.careerId,
    savedAt: SEEDED_AT + (gen === 'b' ? 1 : 0),
    week: entry.facts.week,
    seed: entry.seed,
    // ⚠ THE PAYLOAD'S LENGTH, NOT THE FILE'S. src/db/saves.ts writes `bytes: payload.byteLength`,
    // so the manifest's `bytes` (the whole envelope, header included) is the wrong one of the two
    // and would show the player a save 44 bytes larger than it is.
    bytes: bytes.byteLength,
    kidName: entry.profile.kidName,
    country: entry.profile.country,
    revision,
    checksumB64: b64(checksum),
    payloadB64: b64(bytes),
  })

  // ⚠ THE DAMAGED GENERATION IS THE NEWER ONE, AND ITS CHECKSUM IS THE UNDAMAGED ONE'S. That pairing
  // is the fault: `compressWorld` wrote a checksum over bytes that are no longer the bytes on disk,
  // which is precisely what `decompressWorld`'s `verifyChecksum` is there to notice. Generation `b`
  // carries the higher revision, so `recNewer` picks it first and the fallback to `a` is a real
  // fallback rather than an ordering accident.
  const records = damaged
    ? [generation('a', payload, SEEDED_REVISION), generation('b', flipOneByte(payload), SEEDED_REVISION + 1)]
    : [generation('a', payload, SEEDED_REVISION)]

  return {
    dbName: DB_NAME,
    // ⚠ ONE HIGHER, WHICH IS A VERSION IndexedDB WILL NOT LET THE APP DOWNGRADE TO. Derived from
    // `DB_VERSION` rather than written as a literal, so the day the schema of the DATABASE moves,
    // this stays "one the app cannot open" instead of quietly becoming one it can.
    dbVersion: unreachable ? DB_VERSION + 1 : DB_VERSION,
    appDbVersion: DB_VERSION,
    savesStore: SAVES_STORE,
    careersStore: CAREERS_STORE,
    latchKey: LATCH_KEY,
    records,
    meta: {
      careerId: entry.careerId,
      kidName: entry.profile.kidName,
      country: entry.profile.country,
      seed: entry.seed,
      createdAt: SEEDED_AT,
      lastPlayedAt: SEEDED_AT,
      week: entry.facts.week,
      // The compare-and-swap anchor has to agree with the newest generation, or the pair is a torn
      // write no real commit could produce (see SEEDED_REVISION).
      revision: records[records.length - 1].revision,
    },
    storage: options.localStorage ?? {},
  }
}

/**
 * THE SEED, and the ordering argument is the whole of it.
 *
 * This function is stringified and run by `page.addInitScript`, so it executes in the page BEFORE
 * any of the app's own scripts - but "before" is not by itself enough, and assuming it was is the
 * trap this fixture exists to avoid. The app boots once. `game.init()` asks the worker to
 * `listCareers` exactly one time, and an empty answer hands the player to the six-step wizard and
 * never knocks on the database again. IndexedDB writes are asynchronous. So a seed that merely
 * STARTS first can still finish second, and when it does nothing fails - the spec quietly runs
 * against a fresh career and asserts whatever a fresh career happens to satisfy.
 *
 * ⚠ SO THE WRITE HAPPENS INSIDE THE VERSIONCHANGE TRANSACTION, and that is not a stylistic choice.
 * IndexedDB processes opens against one database through a single ordered queue, and an open cannot
 * complete while an upgrade transaction is running on that database. Two facts follow, and together
 * they are the guarantee:
 *
 *   1. This `open` is queued at document-start, before the app's bundle has been fetched, let alone
 *      before it has constructed the Web Worker that will do the reading.
 *   2. The app's own `openDB` therefore queues behind it, and BLOCKS until this upgrade transaction
 *      has committed - the record and the careers row with it.
 *
 * The app cannot read this database before the seed is in it. Not "usually"; not "with enough
 * margin". The zero-flake budget in e2e/README.md is met by construction rather than by a retry.
 *
 * ⚠ AND IT IS A ONE-SHOT, WHICH THE RELOAD SPECS NEED. `addInitScript` runs again on every
 * navigation, including `page.reload()`. Re-seeding there would be a disaster hiding as a
 * convenience: S2's headline spec is "a career survives a reload with its funds, rank and week
 * intact", and a seed that fires on the reload would restore the original bytes and pass that spec
 * whether or not persistence works at all. `onupgradeneeded` only fires when the database is being
 * created, so the second navigation finds v2 already there and writes nothing. The latch is the
 * database's own existence; there is nothing to remember to reset.
 *
 * ⚠ AND IT PARKS ITS OWN PAYLOAD, for `storageComesBack`. A repair has to write the SAME product
 * bytes, and the only copy of them inside the page is the one this argument carried in - re-sending
 * them from Node would be a second delivery of the same 77 KiB and a second thing to keep in step.
 */
function seedIndexedDb(payload: SeedPayload): void {
  const bytes = (b64: string): Uint8Array => {
    const binary = atob(b64)
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
    return out
  }
  ;(window as unknown as { __tbSeedPayload?: SeedPayload }).__tbSeedPayload = payload

  // localStorage is done FIRST and synchronously, before a single byte of app code runs. It has to
  // be: `src/audio/sfx.ts` reads `tb-muted` while its module is evaluating, and a preference written
  // from inside the async database callback below could land after that read. Its own latch, because
  // this half has no versionchange transaction to hide behind - see the header on re-runs.
  try {
    if (localStorage.getItem(payload.latchKey) === null) {
      // The honest starting point for a career this browser has never met, and the state a fresh
      // Playwright context is already in. The clear earns its place on the SECOND navigation of a
      // test, where the app has since written watermarks of its own.
      localStorage.clear()
      for (const [key, value] of Object.entries(payload.storage)) localStorage.setItem(key, value)
      localStorage.setItem(payload.latchKey, '1')
    }
  } catch {
    // Storage denied. Nothing to do about it here; the fact assertions will say so.
  }

  const report: { state: SeedState | null; error: string | null } = { state: null, error: null }
  const done = new Promise<SeedState>((resolve, reject) => {
    const request = indexedDB.open(payload.dbName, payload.dbVersion)

    request.onupgradeneeded = () => {
      const db = request.result
      const transaction = request.transaction
      if (!transaction) {
        report.error = 'no versionchange transaction on upgradeneeded'
        return
      }
      // Created exactly as src/db/saves.ts creates them, keyPaths included - a seeded database the
      // app would have to migrate is a seeded database that proves nothing about today's app.
      if (!db.objectStoreNames.contains(payload.savesStore)) {
        db.createObjectStore(payload.savesStore, { keyPath: 'slot' })
      }
      if (!db.objectStoreNames.contains(payload.careersStore)) {
        db.createObjectStore(payload.careersStore, { keyPath: 'careerId' })
      }
      const saves = transaction.objectStore(payload.savesStore)
      for (const { checksumB64, payloadB64, ...rest } of payload.records) {
        saves.put({ ...rest, checksum: bytes(checksumB64), payload: bytes(payloadB64) })
      }
      transaction.objectStore(payload.careersStore).put(payload.meta)
      report.state = 'seeded'
    }

    request.onsuccess = () => {
      // Let go of the connection: the app opens its own, and a connection left open here would
      // block a future schema bump's upgrade instead of letting it run.
      request.result.close()
      if (report.error) reject(new Error(report.error))
      else resolve(report.state ?? 'already-seeded')
    }
    request.onerror = () => reject(request.error ?? new Error('indexedDB.open failed'))
    request.onblocked = () => reject(new Error('indexedDB.open was blocked by another connection'))
  })

  // Parked on the window so the fixture can await the outcome after navigation. A REJECTED promise
  // left unhandled is a console error, so it is caught here and re-thrown when it is read.
  const parked = done.then(
    (state) => ({ state, error: null as string | null }),
    (err: unknown) => ({ state: null, error: err instanceof Error ? err.message : String(err) }),
  )
  ;(window as unknown as { __tbSeed?: Promise<{ state: SeedState | null; error: string | null }> }).__tbSeed = parked
}

/** Read the seed's own report back. Separate from the fact assertions on purpose: this says whether
 *  the BYTES landed, so a broken seed reports "the seed never wrote" instead of leaving a spec to
 *  report "expected W49 2038, found the onboarding wizard" and a reader to work out why. */
async function seedOutcome(page: Page): Promise<{ state: SeedState | null; error: string | null }> {
  return page.evaluate(() => {
    const parked = (
      window as unknown as { __tbSeed?: Promise<{ state: SeedState | null; error: string | null }> }
    ).__tbSeed
    return parked ?? { state: null, error: 'the init script never ran' }
  })
}

/**
 * Rebuild the database at the version the app asks for, holding the same records.
 *
 * Runs in the page through `page.evaluate`, off the payload `seedIndexedDb` parked there. Deleting
 * first is what makes it a DOWNGRADE, which IndexedDB has no other route to: a database at v3 cannot
 * be reopened at v2, and that refusal is the fault being repaired.
 */
function rebuildIndexedDb(): Promise<'rebuilt'> {
  const payload = (window as unknown as { __tbSeedPayload?: SeedPayload }).__tbSeedPayload
  if (!payload) return Promise.reject(new Error('the init script never parked its payload'))

  const bytes = (b64: string): Uint8Array => {
    const binary = atob(b64)
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
    return out
  }

  return new Promise<'rebuilt'>((resolve, reject) => {
    const drop = indexedDB.deleteDatabase(payload.dbName)
    // ⚠ `onblocked` IS AN ASSERTION, NOT HOUSEKEEPING. A delete is blocked only while some connection
    // is still open on that database, and in this state there should be none - the app's open FAILED,
    // so it never got one. If this ever fires, the premise of the spec using it is wrong and it must
    // say so rather than hang until Playwright's timeout blames the wrong thing.
    drop.onblocked = () => reject(new Error('deleteDatabase was blocked - something still holds the database open'))
    drop.onerror = () => reject(drop.error ?? new Error('deleteDatabase failed'))
    drop.onsuccess = () => {
      const request = indexedDB.open(payload.dbName, payload.appDbVersion)
      request.onupgradeneeded = () => {
        const db = request.result
        const transaction = request.transaction!
        if (!db.objectStoreNames.contains(payload.savesStore)) {
          db.createObjectStore(payload.savesStore, { keyPath: 'slot' })
        }
        if (!db.objectStoreNames.contains(payload.careersStore)) {
          db.createObjectStore(payload.careersStore, { keyPath: 'careerId' })
        }
        const saves = transaction.objectStore(payload.savesStore)
        for (const { checksumB64, payloadB64, ...rest } of payload.records) {
          saves.put({ ...rest, checksum: bytes(checksumB64), payload: bytes(payloadB64) })
        }
        transaction.objectStore(payload.careersStore).put(payload.meta)
      }
      request.onsuccess = () => {
        request.result.close()
        resolve('rebuilt')
      }
      request.onerror = () => reject(request.error ?? new Error('re-open failed'))
    }
  })
}

export const test = base.extend<{ careerAt: CareerAt; storageComesBack: StorageComesBack }>({
  storageComesBack: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(rebuildIndexedDb)
    })
  },

  careerAt: async ({ page }, use) => {
    let seeded: FixtureName | null = null

    await use(async (name, options = {}) => {
      // ⚠ ONCE PER TEST, AND THE REFUSAL IS THE POINT. The one-shot latch above is the database's own
      // existence, so a second call would write nothing and return a career the app never loaded -
      // exactly the silent no-op this whole fixture is built to make impossible. Said out loud here
      // rather than discovered later in a spec that tests the wrong career.
      if (seeded !== null) {
        throw new Error(
          `careerAt('${name}') was called after careerAt('${seeded}') in the same test. The seed runs ` +
            'once, inside the database-creation transaction; a second one cannot land. Use one ' +
            'fixture per test, or extend the payload to seed several careers in that one transaction.',
        )
      }
      seeded = name

      const entry = manifest.fixtures.find((f) => f.name === name)
      if (!entry) {
        throw new Error(`No fixture named '${name}' in e2e/fixtures/manifest.json`)
      }

      await page.addInitScript(seedIndexedDb, payloadFor(entry, options))
      await page.goto('/')

      const outcome = await seedOutcome(page)
      expect(
        outcome.error,
        `seeding '${name}' into IndexedDB failed before the app could read it`,
      ).toBeNull()
      expect(
        outcome.state,
        `seeding '${name}' wrote nothing - the database already existed when the page loaded`,
      ).toBe('seeded')

      // ⚠ NO SPLASH TO CLICK WHEN THE DATABASE CANNOT BE OPENED, and that is the app's own decision
      // rather than a gap here: App.vue branches on `phase === 'recovery'` AHEAD of the splash, so a
      // player whose storage is broken meets the three doors instead of a wordmark waiting on data
      // that will never arrive. Clicking for one would hang until Playwright's timeout and blame the
      // splash for a database fault.
      if (options.storage === 'unreachable') return entry

      // The splash shows on EVERY launch and waits for `game.init()` to settle, so this click is
      // also the wait for the store to have finished asking the worker for its careers. Clicking it
      // by name is a web-first action: it retries until the control is really there, and no spec
      // below needs to know that the app spends its first moments on "Loading…".
      await page.getByRole('button', { name: 'Tap to start' }).click()

      return entry
    })
  },
})

export { expect }
