// ROUND 51 №3 – THE CAREERS ROW CARRIES ITS CAREER'S OWN EPOCH (the row builder's half).
//
// The Careers list dated every row in the ACTIVE career's epoch, so after a dynasty handover the mother's rows read her daughter's years. The fix has two halves: the row has to CARRY the epoch (this
// file) and the list has to READ it per row (tests/component/round51-careers-epoch.test.ts, which mounts the screen).
//
// ⚠ NO SCHEMA MOVE, AND THIS FILE IS WHY IT CAN SAY SO: `startYear` joins the index row exactly as `birthMonth`/`birthDay` did (messages.ts, `CareerMeta`). It is a COPY of a field the payload has held
// since v92, so there is no `SAVE_SCHEMA_VERSION` bump, no migration and no golden fixture to add.
//
// ⚠ `careerRowFor` IS PRIVATE, so the row is read the way the list reads it – through `listCareers()` after a real write – and BOTH write paths are asked separately, as D-P4 does
// (tests/principles-d05-one-commit.test.ts): a field added to one path and not the other is the failure the one-builder law exists to prevent, and a shared fixture would let one path vouch for the other.
//
// MUTATION ARM (measured 13.10): delete `startYear: world.startYear` from `careerRowFor` (db/saves.ts) → all three cases of the first block go RED, the two paths independently.
//
// THE LAST BLOCK IS THE IMPORT CONFIRM'S HALF: a file picked in More is described by the worker's `peekSave` reply, and the confirm dates the file's week in the epoch that reply carries. It drives the
// REAL handler through tests/helpers/workerHarness; delete `startYear: candidate.startYear` from the `peek` literal in sim.worker.ts → it goes RED (measured 13.10).
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { commitAutosave, writeNamed, listCareers } from '../src/db/saves'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_START_YEAR } from '../src/shared/dates'
import { workerHarness } from './helpers/workerHarness'

/** A few real ticks, THEN the epoch is posed: the row builder reads only `world.startYear`, and posing it last keeps the ticked trajectory identical to the default career's. */
function worldWithEpoch(seed: string, careerId: string, startYear: number): WorldState {
  const world = createWorld(seed)
  world.careerId = careerId
  const rng = rngFromSeed(seed)
  for (let i = 0; i < 3; i++) tickWeek(world, rng)
  world.startYear = startYear
  return world
}

const rowOf = async (careerId: string) => (await listCareers()).find((c) => c.careerId === careerId)

describe('⭐ r51 №3 – the careers row carries the career\'s own epoch', () => {
  it('the AUTOSAVE path puts `startYear` on the row – a 2066 daughter is not written as the 2031 default', async () => {
    const id = 'c-r51-epoch-auto'
    await commitAutosave(worldWithEpoch('r51-epoch-auto', id, 2066), 1)
    const row = await rowOf(id)
    expect(row, 'the autosave wrote a careers row').toBeTruthy()
    expect(row!.startYear, 'and the row says which calendar its weeks are counted in').toBe(2066)
  })

  it('...and the NAMED-SAVE path does too, on its own (a career whose first write is a named save)', async () => {
    const id = 'c-r51-epoch-named'
    await writeNamed(worldWithEpoch('r51-epoch-named', id, 2066), 'keep', 1)
    const row = await rowOf(id)
    expect(row, 'the named save wrote a careers row').toBeTruthy()
    expect(row!.startYear, 'the same field, from the same builder').toBe(2066)
  })

  it('a generation-1 career writes 2031 EXPLICITLY – a new row never leans on the reader\'s fallback', async () => {
    const id = 'c-r51-epoch-gen1'
    await commitAutosave(worldWithEpoch('r51-epoch-gen1', id, DEFAULT_START_YEAR), 1)
    const row = await rowOf(id)
    expect(row!.startYear, 'the default epoch is written, not omitted').toBe(DEFAULT_START_YEAR)
  })
})

// ⚠ THE WORKER MODULE ASSIGNS `self.onmessage` WHEN IT EVALUATES, so the harness installs the global first and the import is dynamic, in `beforeAll` – the order tests/dev-fast-forward.test.ts documents.
interface PeekReply {
  id: number
  ok: boolean
  type?: string
  peek?: { careerId: string; kidName: string; week: number; startYear?: number }
}
const { send } = workerHarness<PeekReply>()
beforeAll(async () => {
  await import('../src/worker/sim.worker')
})

async function peekOf(world: WorldState): Promise<PeekReply> {
  const file = await encodeExportFile(world)
  // A copy of exactly the file's bytes: `peekSave` takes the ArrayBuffer, and a view's `.buffer` can be wider than the view.
  return send({ type: 'peekSave', bytes: file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer })
}

describe('⭐ r51 №3 – the worker\'s peek of a file answers the FILE\'s own epoch', () => {
  it('a 2066 file peeks as 2066 – so the confirm dates its week in the file\'s calendar, not the active career\'s', async () => {
    const world = worldWithEpoch('r51-peek-gen2', 'c-r51-peek-gen2', 2066)
    const reply = await peekOf(world)
    expect(reply.ok, 'the strict gate accepted the file').toBe(true)
    expect(reply.type).toBe('peek')
    expect(reply.peek).toEqual({ careerId: world.careerId, kidName: world.profile.kidName, week: world.week, startYear: 2066 })
  })

  it('a default file peeks as 2031 explicitly', async () => {
    const world = worldWithEpoch('r51-peek-gen1', 'c-r51-peek-gen1', DEFAULT_START_YEAR)
    const reply = await peekOf(world)
    expect(reply.peek?.startYear).toBe(DEFAULT_START_YEAR)
  })
})
