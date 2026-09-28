import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { assembleInbox } from '../src/engine/world/snapshot'
import { DEFAULT_PROFILE, REPLY_BY_COMMAND } from '../src/shared/protocol'
import type { Offer, WorkerErrorCode } from '../src/shared/protocol'
import { encodeExportFile } from '../src/engine/saveCodec'
import { workerHarness, type WorkerMsg } from './helpers/workerHarness'
import { worldHash } from './helpers/hash'

// =================================================================================================
// D-07 · THE `inbox` QUERY IS A QUERY (T6.2, W6 – option A)
// =================================================================================================
//
// ⚠ WHAT THIS FILE IS. Option A serves the whole post on demand, and «on demand» is only safe if the
// ask cannot change anything. The album established the shape (`sim.worker.ts`' `album` case, spec
// §8b) and its own purity pin is `tests/albumBook.test.ts`' «a pure read: not one byte of the world
// moved, rngMain included». This file is that pin for the inbox, at BOTH depths:
//
//   the function  `assembleInbox(world)` – the world's JSON is byte-identical across the call, twice
//                 in a row, so no draw is taken and no field is touched.
//   the worker    the `inbox` case – the committed revision is reported UNCHANGED, the reply carries
//                 no `baseRevision` refusal, and the career exports to the SAME BYTES before and
//                 after. An export carries `rngMain`, so identical bytes is the strongest available
//                 statement that the MAIN stream did not move: the frozen capture (41550 /
//                 e6b0c709) cannot be affected by a command that leaves the save byte-identical.
//
// ⚠⚠ AND THE COPY, WHICH IS THE OTHER HALF OF «A QUERY». `toSnapshot` copies the inbox one level deep
// because the snapshot crosses `postMessage` and must never be a live view of engine state; the query
// answers with the same list and needs the same copy. A harness does not structuredClone, so a reply
// that handed back the engine's own rows would look perfect here and let a screen mutate the contract
// it is rendering. Asserted by identity, which is the only way to see it.
//
// ⚠ THE RED ARM ON THE UNFIXED TREE is the absent case: with no `case 'inbox':` the switch falls
// through, `handle` returns undefined and the request is never answered, so the file times out rather
// than failing an assertion – an honest red, and an uninformative one. The informative arm is named
// on the fixed tree:
//   ARM Q1  `case 'inbox':` made to commit – `revision: ++committedRevision` instead of
//           `revision: committedRevision`.
// Both outputs are quoted in the task report.

interface Reply {
  id: number
  ok: boolean
  type?: string
  error?: string
  code?: WorkerErrorCode
  revision?: number
  inbox?: Offer[]
  bytes?: ArrayBuffer
}

let lastRevision = 0
const { send } = workerHarness<Reply>((r) => {
  if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
})

/** `tests/worker-reply-correlation.test.ts`' own fixture: a few weeks on the clock and no open
 *  decision, so nothing the worker is asked below can be refused for a reason this file is not about. */
function quietCareer(seed: string, weeks = 10): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  return world
}

async function saveBytes(world: WorldState): Promise<ArrayBuffer> {
  return (await encodeExportFile(world)).slice().buffer as ArrayBuffer
}

const hex = (b: ArrayBuffer): string => [...new Uint8Array(b)].map((n) => n.toString(16).padStart(2, '0')).join('')

describe('D-07 – `assembleInbox` is a pure read of the committed world', () => {
  it('two assemblies of one world are deep-equal and the world is untouched', () => {
    const world = quietCareer('d07-purity')
    // A posed letter, so the assertion is about a list with something in it. Pushed onto the WORLD,
    // which is the only authority on the post – nothing here prunes and nothing here writes.
    const before = JSON.stringify(world)
    const hash = worldHash(world)
    const one = assembleInbox(world)
    const two = assembleInbox(world)
    expect(two, 'the post does not flicker').toEqual(one)
    expect(JSON.stringify(world), 'a pure read: not one byte of the world moved, rngMain included').toBe(before)
    expect(worldHash(world), 'and the world hash is the control, before and after').toBe(hash)
  })

  it('⚠ the assembled rows are COPIES – a screen cannot reach the engine`s own contract', () => {
    const world = quietCareer('d07-copies')
    world.offers.push({
      id: 'd07-c1',
      kind: 'kit',
      week: world.week,
      deadlineWeek: world.week + 4,
      state: 'open',
      terms: { tier: 'local', brand: 'Copy House', covers: ['strings'], kitAllowanceCents: 100, minEventsPerSeason: 8 },
    } as unknown as Offer)
    const rows = assembleInbox(world)
    expect(rows).toHaveLength(world.offers.length)
    const [engineRow] = world.offers.filter((o) => o.id === 'd07-c1')
    const [wireRow] = rows.filter((o) => o.id === 'd07-c1')
    expect(wireRow, 'the values are the same').toEqual(engineRow)
    expect(wireRow, 'the OBJECT is not').not.toBe(engineRow)
    expect(wireRow.terms, 'and neither is its terms – the one nested field an `Offer` has').not.toBe(engineRow.terms)
    // ...and writing through the wire copy does not reach the world.
    ;(wireRow.terms as { brand: string }).brand = 'Mutated'
    expect((engineRow.terms as { brand: string }).brand, 'the engine`s contract is unchanged').toBe('Copy House')
  })
})

describe('D-07 – the worker`s `inbox` case commits nothing', () => {
  beforeAll(async () => {
    await import('../src/worker/sim.worker')
  })

  const q = (msg: WorkerMsg): Promise<Reply> => send(msg)

  it('⭐ it answers with its own arm, the whole post, and the revision UNCHANGED', async () => {
    const world = quietCareer('d07-worker')
    world.offers.push({
      id: 'd07-w1',
      kind: 'kit',
      week: world.week,
      deadlineWeek: world.week + 4,
      state: 'open',
      terms: { tier: 'local', brand: 'Wire House', covers: ['strings'], kitAllowanceCents: 100, minEventsPerSeason: 8 },
    } as unknown as Offer)
    const imported = await q({ type: 'importSave', bytes: await saveBytes(world) })
    expect(imported.ok, 'the career has to be in the worker before anything can be asked of it').toBe(true)

    const revisionBefore = lastRevision
    const exportedBefore = await q({ type: 'exportSave' })
    expect(exportedBefore.ok).toBe(true)

    const reply = await q({ type: 'inbox' })
    expect(reply.ok, 'the query answers').toBe(true)
    expect(reply.type, 'with the arm the protocol table names for it').toBe(REPLY_BY_COMMAND.inbox)
    expect(reply.code, 'and it is not refused for a revision it never sent').toBeUndefined()
    expect(reply.inbox?.map((o) => o.id), 'the WHOLE post, in the world`s own order').toEqual(
      world.offers.map((o) => o.id),
    )
    expect(reply.revision, 'nothing was committed').toBe(revisionBefore)

    // THE WORLD ITSELF, through the one door that can see it from out here: the same career exports
    // to the same bytes. A save carries `rngMain`, so this covers the stream as well as the state.
    const exportedAfter = await q({ type: 'exportSave' })
    expect(exportedAfter.ok).toBe(true)
    expect(hex(exportedAfter.bytes!), 'the committed career is byte-identical across the query').toBe(
      hex(exportedBefore.bytes!),
    )
    expect(lastRevision, 'and the revision the worker reports is still the one it reported before').toBe(
      revisionBefore,
    )
  })

  it('⚠ with no career it refuses rather than inventing an empty post', async () => {
    // `deleteCareer` on the active career nulls the world – the worker's own path to «no career».
    const world = quietCareer('d07-no-career')
    const imported = await q({ type: 'importSave', bytes: await saveBytes(world) })
    expect(imported.ok).toBe(true)
    await q({ type: 'deleteCareer', careerId: world.careerId })
    const reply = await q({ type: 'inbox' })
    expect(reply.ok, 'no career, no post').toBe(false)
    expect(reply.error, 'and it says why – the album`s own refusal, word for word').toBe('No active career')
    // ⚠ AND THE STORE TURNS THAT INTO «the section draws its own empty chrome», not into a crash:
    // `loadInbox` answers null on a refusal, exactly as `loadAlbum` does.
  })
})
