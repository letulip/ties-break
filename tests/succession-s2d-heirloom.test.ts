// ⭐⭐⭐ SUCCESSION S2d – THE MOTHER'S ALBUM, READ-ONLY, at the worker/protocol seam and in the engine's own reader (docs/specs/succession-2026-10.md §3, §8 S2d).
//
// The heirloom is the finished `AlbumBook` a generation-2 world carries in `world.legacy.heirloomAlbum` (S2b). S2d opens it from the new career's own album
// screen, and this file measures the half of that which is not a screen:
//
//   · THE READER   `heirloomBookOf` / `hasHeirloom` (engine/world/heirloom.ts) are the ONE reading both the flag and the query go through: the persisted book on
//                  a legacy world, null on a plain one, null for every hand-edited shape, and a COPY – what leaves cannot reach the world.
//   · THE QUERY    `heirloomAlbum` answers that book byte for byte for the loaded career – the real chain (a walked mother -> `legacyInputOf` ->
//                  `createLegacyWorld` -> the worker) and a POSED book – is refused while no career is loaded, answers a plain career with `book: null`, and
//                  is a PURE read: the committed world is equal before and after, no draw is made (`rngMain` equal) and the revision does not move.
//   · THE FLAG     `Snapshot.hasHeirloom` is true on a generation-2 career and false on every other – through `toSnapshot` and over the wire – and the
//                  snapshot carries the BIT and never the book (1 to 9 KB would ride every weekly tick otherwise).
//
// ⚠ NO WORDING IS ASSERTED HERE. The control's label is the album screen's, and its round trip against the spec's DRAFT table is the mounted file's
// (tests/component/album-mobile.test.ts, the S2d block).
// ⚠ THE POSED BOOK CARRIES A TITLE NO CAREER COULD ASSEMBLE, so a reader that answered ANOTHER book (the loaded career's own, an empty one) cannot match it.
//
// MUTATION-VERIFIED 06.10, each applied, this file run, and the source restored byte-identical (cmp, and one sha256 over the four files equal before and after):
//   · the engine's snapshot flag hard-coded false (`hasHeirloom: false`)          -> 1 red: the flag arm (true on generation 2, through `toSnapshot` and the wire)
//   · the worker answering `book: null` always                                     -> 2 red: the byte-for-byte arm and the posed arm
//   · the reader returning the world's own object (the `structuredClone` dropped)  -> 1 red: the copy law in the posed arm
//   · the reader's shape guard dropped (any object is a book)                      -> 1 red: the hand-edited-shapes arm
import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { hasHeirloom, heirloomBookOf } from '../src/engine/world/heirloom'
import { toSnapshot } from '../src/engine/world/snapshot'
import { createLegacyWorld, legacyInputOf } from '../src/engine/world/succession'
import { resumeMain } from '../src/engine/rng'
import { decodeExportFile, encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE, type AlbumBook, type PlayerProfile } from '../src/shared/protocol'
import { workerHarness } from './helpers/workerHarness'

interface Reply {
  id: number
  ok: boolean
  type?: string
  error?: string
  revision?: number
  bytes?: ArrayBuffer
  book?: AlbumBook | null
  snapshot?: { careerId: string; hasHeirloom: boolean }
}

/** Latched off every ok reply, the way tests/worker-reply-correlation.test.ts and S2c's file do. */
let lastRevision = 0
const { send } = workerHarness<Reply>((r) => {
  if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
})

beforeAll(async () => {
  await import('../src/worker/sim.worker')
})

const MOTHER: PlayerProfile = { ...DEFAULT_PROFILE, kidName: 'Mira', kidLastName: 'Okonkwo' }
const POSED_TITLE = 'The Mother Who Went First'
const POSED: AlbumBook = {
  chapters: [{ index: 1, title: POSED_TITLE, ageLabel: 'Age 5 – 8', sheetCount: 0, firstSheet: 0 }],
  sheets: [],
}

/** A lived career, forty weeks in – the finished career as far as the reader can tell (S2c's own stand-in). */
function walkedMother(): WorldState {
  const world = createWorld('s2d-mother', MOTHER)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 40; i++) tickWeek(world, rng)
  return world
}

/** A generation-2 world over the mother's REAL assembled book, or over `book` when one is posed. */
function daughterWorld(mother: WorldState, book?: AlbumBook): WorldState {
  const input = legacyInputOf(mother)
  return createLegacyWorld(book ? { ...input, heirloomAlbum: book } : input, 's2d-gen2', 'Ilka', {
    ...DEFAULT_PROFILE,
    kidName: 'Ilka',
    kidLastName: input.surname,
  })
}

async function load(world: WorldState): Promise<void> {
  const bytes = (await encodeExportFile(world)).slice().buffer as ArrayBuffer
  const reply = await send({ type: 'importSave', bytes })
  expect(reply.ok, `the career was not imported: ${reply.error}`).toBe(true)
}

/** The worker's committed world, read the one way a test can: through the real export file. */
async function committedWorld(): Promise<WorldState> {
  const reply = await send({ type: 'exportSave' })
  expect(reply.ok, 'exportSave answered').toBe(true)
  return decodeExportFile(new Uint8Array(reply.bytes!))
}

/** The FIRST path at which two worlds differ, or null – a failure that prints one line instead of two whole worlds. `undefined` equals absent. */
function firstDiff(a: unknown, b: unknown, path = '$'): string | null {
  if (a === b) return null
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return `${path}: ${JSON.stringify(a)?.slice(0, 80)} vs ${JSON.stringify(b)?.slice(0, 80)}`
  }
  if (Array.isArray(a) !== Array.isArray(b)) return `${path}: array vs object`
  const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
  for (const key of [...keys].sort()) {
    const av = (a as Record<string, unknown>)[key]
    const bv = (b as Record<string, unknown>)[key]
    if (av === undefined && bv === undefined) continue
    const diff = firstDiff(av, bv, `${path}.${key}`)
    if (diff !== null) return diff
  }
  return null
}

describe('S2d – the heirloomAlbum query', () => {
  // ⚠ FIRST IN THE FILE ON PURPOSE: it needs a worker with nothing loaded, and every later case loads a career.
  it('is refused while no career is loaded, and says so', async () => {
    const reply = await send({ type: 'heirloomAlbum' })
    expect(reply.ok).toBe(false)
    expect(reply.error, 'a refusal carries a reason').toBeTruthy()
    expect(reply.type, 'the failure arm has no reply type').toBeUndefined()
  })

  it('⭐⭐⭐ answers the persisted book byte for byte – the real chain: a walked mother, the reader, the creation, the worker', async () => {
    const mother = walkedMother()
    const daughter = daughterWorld(mother)
    await load(daughter)

    const reply = await send({ type: 'heirloomAlbum' })
    expect(reply.ok, reply.error).toBe(true)
    expect(reply.type).toBe('heirloomAlbum')
    // The book the world persisted, through export and import and the wire...
    expect(JSON.stringify(reply.book)).toBe(JSON.stringify(daughter.legacy!.heirloomAlbum))
    // ...and it IS the mother's own, as the reader assembled it for her – not the daughter's (week 0) book.
    expect(JSON.stringify(reply.book)).toBe(JSON.stringify(legacyInputOf(mother).heirloomAlbum))
  })

  it('⭐ answers a POSED book as posed – and what leaves the reader is a copy the world cannot be reached through', async () => {
    const daughter = daughterWorld(walkedMother(), POSED)
    await load(daughter)

    const reply = await send({ type: 'heirloomAlbum' })
    expect(reply.ok, reply.error).toBe(true)
    expect(reply.book, 'the posed book, as posed').toEqual(POSED)
    expect(reply.book!.chapters[0].title).toBe(POSED_TITLE)

    // The copy law, at the reader (the worker's `postMessage` clones as well – this is the half that does not depend on the transport).
    const out = heirloomBookOf(daughter)!
    expect(out).toEqual(POSED)
    expect(out, 'a copy, not the world’s own object').not.toBe(daughter.legacy!.heirloomAlbum)
    out.chapters[0].title = 'scribbled over by a caller'
    expect((daughter.legacy!.heirloomAlbum as AlbumBook).chapters[0].title, 'the world is out of reach').toBe(POSED_TITLE)
  })

  it('⭐⭐ is a PURE read: the committed world is equal before and after, no draw is made and the revision does not move', async () => {
    await load(daughterWorld(walkedMother(), POSED))
    const revisionBefore = lastRevision
    const before = await committedWorld()

    const first = await send({ type: 'heirloomAlbum' })
    const again = await send({ type: 'heirloomAlbum' })
    const after = await committedWorld()

    expect(first.ok, first.error).toBe(true)
    expect(first.revision, 'a query reports the revision unchanged').toBe(revisionBefore)
    expect(again.book, 'asking twice gives the same answer').toEqual(first.book)
    expect(after.rngMain, 'no draw: MAIN is exactly where it was').toEqual(before.rngMain)
    expect(firstDiff(after, before), 'the query changed the world').toBeNull()
    // PLAIN DATA: it crosses `postMessage` as it is, and a structured clone is equal to it.
    expect(structuredClone(first.book)).toEqual(first.book)
  })

  it('a career with no heirloom answers `book: null` – a legal question with a plain answer, not a refusal', async () => {
    await load(createWorld('s2d-plain', MOTHER))
    const reply = await send({ type: 'heirloomAlbum' })
    expect(reply.ok, reply.error).toBe(true)
    expect(reply.type).toBe('heirloomAlbum')
    expect(reply.book).toBeNull()
  })
})

describe('S2d – the flag on the snapshot', () => {
  it('⭐⭐ `hasHeirloom` is true on a generation-2 career and false on every other – through `toSnapshot` and over the wire', async () => {
    const mother = walkedMother()
    const daughter = daughterWorld(mother, POSED)
    const plain = createWorld('s2d-plain', MOTHER)

    expect(toSnapshot(daughter).hasHeirloom, 'the daughter carries her mother’s book').toBe(true)
    expect(toSnapshot(plain).hasHeirloom, 'a plain career carries none').toBe(false)
    expect(toSnapshot(mother).hasHeirloom, 'the mother’s own career is a first generation').toBe(false)

    await load(daughter)
    const wire = await send({ type: 'getSnapshot' })
    expect(wire.snapshot!.hasHeirloom, 'over the wire, generation 2').toBe(true)
    await load(plain)
    const wirePlain = await send({ type: 'getSnapshot' })
    expect(wirePlain.snapshot!.hasHeirloom, 'over the wire, a plain career').toBe(false)
  })

  it('⭐ the snapshot carries the BIT and never the book', () => {
    const snapshot = toSnapshot(daughterWorld(walkedMother(), POSED))
    expect(typeof snapshot.hasHeirloom).toBe('boolean')
    expect(JSON.stringify(snapshot), 'the posed book must not ride the weekly wire').not.toContain(POSED_TITLE)
  })
})

describe('S2d – the reader judges the shape, in one place', () => {
  it('⭐ a hand-edited block is NO heirloom on both readings – never a control that opens onto nothing', () => {
    const base = daughterWorld(walkedMother(), POSED)
    const bad: unknown[] = [null, undefined, 'a string', 7, {}, { chapters: [] }, { sheets: [] }, { chapters: 'x', sheets: [] }]
    for (const shape of bad) {
      const world = structuredClone(base)
      world.legacy!.heirloomAlbum = shape
      expect(hasHeirloom(world), `the flag for ${JSON.stringify(shape)}`).toBe(false)
      expect(heirloomBookOf(world), `the book for ${JSON.stringify(shape)}`).toBeNull()
      expect(toSnapshot(world).hasHeirloom, `the snapshot for ${JSON.stringify(shape)}`).toBe(false)
    }
    // The right shape IS a heirloom however empty its arrays: the flag asks for a book, not for a verdict on what it holds.
    const empty = structuredClone(base)
    empty.legacy!.heirloomAlbum = { chapters: [], sheets: [] }
    expect(hasHeirloom(empty)).toBe(true)
    // And a career with no `legacy` block at all is a first generation.
    const first = structuredClone(base)
    delete first.legacy
    expect(hasHeirloom(first)).toBe(false)
    expect(heirloomBookOf(first)).toBeNull()
  })
})
