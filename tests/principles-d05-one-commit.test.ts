// ⭐⭐ D-05 (principles review of 26.09, docs/review-principles-2026-09-26/04-worker-protocol-persistence.md)
// – ONE `commit(msg)` IN THE STORE, AND `listSlots` READS ITS OWN CAREER.
//
// THE TWO FACTS THIS FILE MEASURES, both of them baseline behaviour the review reproduced:
//   1. THE ROUND TRIPS. Each of the 43 mutation actions (41 at 28.09; +listAsset/+unlistAsset, the secondary market, 30.09) was a hand-copied body, and 26 of them ended
//      in `refreshSlots()` while 15 did not, with no rule behind the split (`buyAsset`'s own comment
//      said "refreshSlots because money moved", and `SlotMeta` carries no money). An `advance` was
//      THREE round trips – advance, listSlots, listCareers – and a settings command two, every one of
//      them serialised behind the next command in the worker's queue, to refresh two lists that feed
//      ONE screen. The lists are refreshed where they are READ now (MoreScreen's mount + revision
//      watches, D-01's shape), so a mutation is one round trip.
//   2. WHAT `listSlots` READS. It called `getAll()` on the whole `saves` store – every record of
//      every career, gzipped payloads included – and then filtered by `careerId`. The review's own
//      probe measured 10 records and 391,905 payload bytes materialised to return 2 metas of 239
//      bytes of JSON. The keys are career-scoped by construction (`auto:{careerId}:{gen}`,
//      `manual:{careerId}:{name}`), so two key ranges answer the same question. No DB upgrade: a
//      range is a read, and `DB_VERSION` does not move.
//
// ⚠ THE ENUMERATION IS THE WIRE'S, NOT A LIST KEPT HERE. The mutation commands are read out of
// `shared/protocol/messages.ts` – every command arm that declares `baseRevision`, which is what
// MAKES it a mutation (the worker refuses a stale one). A hand list here would go green on the day a
// forty-second mutation arrives carrying a refresh tail, which is the D-05 defect with a test in
// front of it.
//
// ⚠⚠ MUTATION ARMS, each watched red before this file was believed (28.09):
//   A. THE ROUND TRIPS – the RED arm is the unfixed tree itself, by construction. On 03d92221's shape
//      («every mutation body carries its own `refreshSlots()`») the first case reports
//      `advance sent 3 requests (advance, listSlots, listCareers)` against an expected 1, and
//      `setWeightEnabled sent 2`. Restoring either tail in `stores/game.ts` reddens it again.
//   B. WHAT `listSlots` READS – the RED arm is the same tree: `getAll()` with no query materialises
//      all 10 records of the five careers. Putting the unbounded `getAll()` back in `db/saves.ts`
//      reddens «reads only its own career's two key ranges» with `recordsMaterialised: 10`.
//   C. THE KEY/`careerId` AGREEMENT – delete `careerId: world.careerId` from `runAutosaveTx`'s record
//      (or write the key off anything but `world.careerId`) → «every record's key names its own
//      career» goes red. That agreement is what makes the two ranges equivalent to the old scan, and
//      it is asserted rather than assumed because nothing else in the file states it.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { request } from '../src/worker/client'
import { REPLY_BY_COMMAND, type Snapshot, type ToUI } from '../src/shared/protocol'
import { commitAutosave, closeDb, listCareers, listSlots, writeNamed } from '../src/db/saves'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
// Comments are not code, and a missing marker throws rather than widening the slice – the house
// helpers (CLAUDE.md: never cut a source region with a raw `indexOf`).
import { codeOf } from './helpers/source'

vi.mock('../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})
import { useGameStore } from '../src/stores/game'

const mockRequest = vi.mocked(request)

const snap = (): Snapshot => ({ careerId: 'c-d05', week: 7 }) as unknown as Snapshot

/** The ok arm each command answers with, off the PROTOCOL's own table rather than a second pairing
 *  written here – the same value `worker/client.ts` checks a reply against. */
const REPLY_BY_ARM: Record<(typeof REPLY_BY_COMMAND)[keyof typeof REPLY_BY_COMMAND], () => ToUI> = {
  snapshot: () => ({ id: 0, ok: true, type: 'snapshot', snapshot: snap(), revision: 1 }),
  slots: () => ({ id: 0, ok: true, type: 'slots', slots: [], revision: 1 }),
  careers: () => ({ id: 0, ok: true, type: 'careers', careers: [], revision: 1 }),
  album: () => ({ id: 0, ok: true, type: 'album', album: {} as never, revision: 1 }),
  // ⚠ RE-AIMED, NOT WIDENED (T6.2 · D-07, 28.09): the record is TOTAL over the protocol's reply
  // arms, so the inbox query's arm had to join it the moment the arm existed – which is the record's
  // job. Nothing about D-05's claim moves; a query was never one of the 43 mutations.
  inbox: () => ({ id: 0, ok: true, type: 'inbox', inbox: [], revision: 1 }),
  // ⚠ RE-AIMED, NOT WIDENED (SUCCESSION S2c, 06.10): the record is TOTAL over the reply arms, so the dynasty door's query arm joins it. A query is
  // not one of the 43 mutations and D-05's claim does not move.
  legacyInput: () => ({ id: 0, ok: true, type: 'legacyInput', legacy: {} as never, revision: 1 }),
  // ⚠ RE-AIMED, NOT WIDENED AGAIN (SUCCESSION S2d, 06.10): the record is TOTAL over the reply arms, so the mother's-album query's arm joins it. A query is not one of the 43 mutations.
  heirloomAlbum: () => ({ id: 0, ok: true, type: 'heirloomAlbum', book: null, revision: 1 }),
  exported: () => ({ id: 0, ok: true, type: 'exported', bytes: new ArrayBuffer(8), filename: 'c.tsave', revision: 1 }),
  peek: () => ({ id: 0, ok: true, type: 'peek', peek: {} as never, revision: 1 }),
}

/** Every command the wire declares with a `baseRevision` – D-05's 43 mutations (dated above), read off the
 *  protocol source. `baseRevision` is the field that makes a command a mutation: the worker refuses
 *  one that does not match its committed revision (W1-INTEGRITY-A), and queries carry none. */
function mutationCommands(): string[] {
  const src = codeOf(readFileSync(new URL('../src/shared/protocol/messages.ts', import.meta.url), 'utf8'))
  const arms = src.split('\n').filter((l) => l.includes('baseRevision') && /type: '(\w+)'/.test(l))
  return arms.map((l) => /type: '(\w+)'/.exec(l)![1])
}

describe('D-05 (1) – a mutation is ONE round trip', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockRequest.mockReset()
    mockRequest.mockImplementation(async (msg) => REPLY_BY_ARM[REPLY_BY_COMMAND[msg.type]]())
  })

  it('⚠ the mutation set is the wire\'s own and it was found – the sweep below is not vacuous', () => {
    const commands = mutationCommands()
    // ⚠ THE COUNT IS A MEASUREMENT OF THE PROTOCOL, and it is here rather than in prose because a
    // number a document states about itself survives a full gate (CLAUDE.md). D-05 counted 41 on
    // 26.09. A forty-second mutation moves this line – and has to be one round trip below, which is
    // the whole reason the number is checked at all.
    expect(commands.length, 'the commands that carry a baseRevision').toBe(43) // 41 at 28.09; +2 30.09: listAsset, unlistAsset
    // ...and each one is reachable as a store action under its own name, which is what lets the
    // sweep drive them without a second table.
    const store = useGameStore() as unknown as Record<string, unknown>
    const missing = commands.filter((c) => typeof store[c] !== 'function')
    expect(missing, 'every mutation command is a store action of the same name').toEqual([])
  })

  it('⭐⭐ every mutation command sends exactly one request – no list refresh rides along', async () => {
    const store = useGameStore() as unknown as Record<string, () => Promise<void>>
    const perCommand: Record<string, string[]> = {}
    for (const command of mutationCommands()) {
      mockRequest.mockClear()
      // The arguments do not matter: `request` is mocked, so what is measured is how many times the
      // action crosses the boundary, not what it carries (D-08 owns the payloads).
      await store[command]()
      perCommand[command] = mockRequest.mock.calls.map(([m]) => m.type)
    }
    const extra = Object.entries(perCommand)
      .filter(([, sent]) => sent.length !== 1)
      .map(([command, sent]) => `${command} sent ${sent.length} requests (${sent.join(', ')})`)
    expect(extra, 'a mutation that is more than one round trip').toEqual([])
  })

  it('⚠ and the one request it sends is the command itself, not something adjacent', async () => {
    const store = useGameStore()
    mockRequest.mockClear()
    await store.advance(2)
    expect(mockRequest.mock.calls.map(([m]) => m.type)).toEqual(['advance'])
    mockRequest.mockClear()
    await store.setWeightEnabled(true)
    expect(mockRequest.mock.calls.map(([m]) => m.type)).toEqual(['setWeightEnabled'])
    // ...and it still carries the base revision the worker checks it against – the collapse must not
    // cost the optimistic-concurrency token (W1-INTEGRITY-A).
    expect(mockRequest.mock.calls[0][0]).toMatchObject({ type: 'setWeightEnabled', on: true, baseRevision: 1 })
  })
})

// =================================================================================================
// (2) WHAT `listSlots` READS – instrumented at IndexedDB, not inferred
// =================================================================================================

interface GetAllCall {
  store: string
  /** null for the unbounded scan D-05 found; an IDBKeyRange for a scoped read */
  query: unknown
  req: IDBRequest<unknown[]>
}

let getAllCalls: GetAllCall[] = []
const realGetAll = IDBObjectStore.prototype.getAll

/** THE PROBE. `getAll` is the one read path both shapes use, so recording the QUERY and the request
 *  answers "what did this call materialise" directly rather than by arithmetic – the request's
 *  `result` is still readable once it has succeeded, so nothing has to race the promise. */
function instrumentGetAll(): void {
  IDBObjectStore.prototype.getAll = function (
    this: IDBObjectStore,
    query?: IDBValidKey | IDBKeyRange | null,
    count?: number,
  ): IDBRequest<unknown[]> {
    const req = realGetAll.call(this, query as never, count as never) as IDBRequest<unknown[]>
    getAllCalls.push({ store: this.name, query: query ?? null, req })
    return req
  } as typeof realGetAll
}

interface Materialised {
  records: number
  payloadBytes: number
  slots: string[]
  unbounded: number
}

/** What the recorded reads of the `saves` store actually pulled into memory. */
function materialisedFromSaves(): Materialised {
  const mine = getAllCalls.filter((c) => c.store === 'saves')
  const rows = mine.flatMap((c) => (c.req.result ?? []) as { slot: string; payload?: Uint8Array }[])
  return {
    records: rows.length,
    payloadBytes: rows.reduce((n, r) => n + (r.payload?.byteLength ?? 0), 0),
    slots: rows.map((r) => r.slot),
    unbounded: mine.filter((c) => c.query === null).length,
  }
}

function worldAt(seed: string, weeks: number, careerId: string): WorldState {
  const world = createWorld(seed)
  world.careerId = careerId
  const rng = rngFromSeed(seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

function deleteDatabase(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase('tennis-sim')
    req.onsuccess = () => resolve()
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  })
}

const CAREERS_IN_DB = 5
const TARGET = 'c-d05-ls-0'

/** Five careers, two autosave generations and one named save each – the review's probe shape, plus
 *  the named slot so BOTH key prefixes are exercised. */
async function buildFiveCareers(): Promise<void> {
  for (let c = 0; c < CAREERS_IN_DB; c++) {
    const careerId = `c-d05-ls-${c}`
    await commitAutosave(worldAt(`d05ls${c}`, 6, careerId), 1)
    await commitAutosave(worldAt(`d05ls${c}`, 8, careerId), 2)
    await writeNamed(worldAt(`d05ls${c}`, 8, careerId), 'backup', 2)
  }
}

describe("D-05 (2) – listSlots reads only its own career's two key ranges", () => {
  beforeEach(async () => {
    await closeDb()
    await deleteDatabase()
    getAllCalls = []
    IDBObjectStore.prototype.getAll = realGetAll
  })

  it('⭐⭐ a five-career database materialises the target career\'s records and nothing else', async () => {
    await buildFiveCareers()
    instrumentGetAll()
    const metas = await listSlots(TARGET)
    IDBObjectStore.prototype.getAll = realGetAll

    const read = materialisedFromSaves()
    // The verdict, logged so the report can quote it either way round.
    console.log(
      'D-05 listSlots:',
      JSON.stringify({
        careersInDb: CAREERS_IN_DB,
        recordsMaterialised: read.records,
        payloadBytesMaterialised: read.payloadBytes,
        unboundedScans: read.unbounded,
        metasReturned: metas.length,
        metaJsonBytes: JSON.stringify(metas).length,
      }),
    )

    // The answer is unchanged: two generations and one named save, newest first.
    expect(metas.map((m) => m.slot).sort()).toEqual(
      [`auto:${TARGET}:a`, `auto:${TARGET}:b`, `manual:${TARGET}:backup`].sort(),
    )
    // ⚠ THE ITEM. Not "fewer records" – only the career's own, and not one unbounded scan of the
    // store. With five careers the old shape pulled 15 records and every gzipped payload in the
    // database to answer for three of them.
    expect(read.unbounded, 'no read of the saves store may be unscoped').toBe(0)
    expect(read.records, 'records materialised').toBe(3)
    expect(read.slots.every((s) => s.includes(TARGET)), 'every record read belongs to the target career').toBe(true)
  })

  it('⚠ two ranges, one per key prefix – the named saves are not lost with the scan', async () => {
    await buildFiveCareers()
    instrumentGetAll()
    await listSlots(TARGET)
    IDBObjectStore.prototype.getAll = realGetAll
    const queries = getAllCalls.filter((c) => c.store === 'saves').map((c) => c.query)
    expect(queries.length, 'one read per key prefix').toBe(2)
    expect(
      queries.every((q) => q instanceof IDBKeyRange),
      'both reads are key ranges',
    ).toBe(true)
    const lowers = (queries as IDBKeyRange[]).map((q) => String(q.lower)).sort()
    expect(lowers).toEqual([`auto:${TARGET}:`, `manual:${TARGET}:`])
  })

  it('⭐ every record\'s key names its own career – the agreement the two ranges rest on', async () => {
    await buildFiveCareers()
    const rows = await new Promise<{ slot: string; careerId: string }[]>((resolve, reject) => {
      const open = indexedDB.open('tennis-sim')
      open.onsuccess = () => {
        const req = open.result.transaction('saves', 'readonly').objectStore('saves').getAll()
        req.onsuccess = () => {
          resolve(req.result as { slot: string; careerId: string }[])
          open.result.close()
        }
        req.onerror = () => reject(req.error)
      }
    })
    expect(rows.length, 'the fixture wrote records at all').toBe(CAREERS_IN_DB * 3)
    // ⚠ WHY THIS IS THE LOAD-BEARING ASSERTION OF THE NARROWING. `getAll()` + a `careerId` filter and
    // two key ranges return the same set only if every record whose `careerId` is X also has a key
    // prefixed `auto:X:` or `manual:X:`. Every writer in db/saves.ts builds the key FROM the careerId
    // it stamps (`autoSlot`/`namedSlot`, including `migrateV1toV2`'s `rescope`), so the agreement
    // holds by construction – and this is where a writer that stops doing so is caught.
    const disagreeing = rows.filter(
      (r) => !r.slot.startsWith(`auto:${r.careerId}:`) && !r.slot.startsWith(`manual:${r.careerId}:`),
    )
    expect(disagreeing.map((r) => `${r.slot} claims ${r.careerId}`), 'a key that disagrees with its own row').toEqual([])
  })

  // ===============================================================================================
  // (3) D-P4 – ONE BUILDER FOR THE CAREERS ROW, AND THE HARM THE FINDING NAMES
  // ===============================================================================================
  //
  // The review's evidence for folding the two hand-built rows together is not tidiness, it is a cost
  // already paid: when the age clock needed her birthday on the Careers list (09.08), `birthMonth` and
  // `birthDay` had to be added in TWO places, and a field added to one path only reaches the list for
  // autosaves and not for named saves, with nothing to say so. So this case drives BOTH write paths
  // and asks the same question of both rows.
  //
  // ⚠ MUTATION ARM (measured 28.09): delete `birthDay: world.profile.birthDay` from `careerRowFor`
  // (db/saves.ts) → «both write paths put her birthday on the row» goes RED on both paths at once,
  // which is the property one builder buys. Before D-P4 the same deletion in ONE of the two literals
  // reddened nothing, because no test asked either path.
  it('⭐ D-P4 – both write paths put the same career row on disk, her birthday included', async () => {
    const careerId = 'c-d05-row'
    const world = worldAt('d05row', 6, careerId)
    world.profile = { ...world.profile, birthMonth: 3, birthDay: 17 }

    await commitAutosave(world, 1)
    const afterAuto = (await listCareers()).find((c) => c.careerId === careerId)!
    expect(afterAuto, 'the autosave path wrote a careers row').toBeTruthy()
    expect(afterAuto.birthMonth, 'the autosave row carries her birth month').toBe(3)
    expect(afterAuto.birthDay, 'the autosave row carries her birth day').toBe(17)

    await writeNamed(world, 'backup', 2)
    const afterNamed = (await listCareers()).find((c) => c.careerId === careerId)!
    expect(afterNamed.birthMonth, 'the named row carries her birth month too').toBe(3)
    expect(afterNamed.birthDay, 'the named row carries her birth day too').toBe(17)

    // ⚠ AND THE FORWARD-ONLY RULE IS `writeNamed`'s, SHARED WITHOUT BECOMING THE AUTOSAVE PATH'S
    // PROBLEM. A named save whose revision is BEHIND the row must not drag the resume pointer back;
    // the autosave path can never be behind, because its own CAS refuses anything that is not
    // strictly ahead. Both halves matter, so both are asserted.
    const ahead = worldAt('d05row', 40, careerId)
    ahead.profile = { ...ahead.profile, birthMonth: 3, birthDay: 17 }
    await commitAutosave(ahead, 3)
    const atThree = (await listCareers()).find((c) => c.careerId === careerId)!
    expect(atThree.revision, 'the autosave moved the row forward').toBe(3)

    const stale = worldAt('d05row', 6, careerId)
    stale.profile = { ...stale.profile, birthMonth: 3, birthDay: 17 }
    await writeNamed(stale, 'from-a-stale-tab', 2)
    const afterStale = (await listCareers()).find((c) => c.careerId === careerId)!
    expect(afterStale.revision, 'a behind-the-row named save did not regress the revision').toBe(3)
    expect(afterStale.week, '...nor the week the resume pointer reads').toBe(atThree.week)
    expect(afterStale.lastPlayedAt, '...and saving still counts as playing').toBeGreaterThan(atThree.lastPlayedAt)
  })

  it('⚠ the careerId filter is a BELT and it earns its place: one careerId may prefix another', async () => {
    // `makeCareerId` is `c-{seed}-{base36}` and the seed is whatever the player typed, so a careerId
    // CAN contain a colon – and then one career's key range is a prefix of another's:
    // `auto:c-x:y:a` starts with `auto:c-x:`. The range alone would hand the shorter career the
    // longer one's records; the `careerId` equality filter kept from the old scan is what refuses it.
    await commitAutosave(worldAt('d05belt', 4, 'c-x'), 1)
    await commitAutosave(worldAt('d05belt', 4, 'c-x:y'), 1)
    const shorter = await listSlots('c-x')
    const longer = await listSlots('c-x:y')
    expect(shorter.map((m) => m.slot)).toEqual(['auto:c-x:a'])
    expect(longer.map((m) => m.slot)).toEqual(['auto:c-x:y:a'])
  })
})
