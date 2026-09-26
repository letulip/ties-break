import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { drainLifeBeats } from './helpers/career'
import { resumeMain } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
import { readLatestAutosave } from '../src/db/saves'
import { DEFAULT_PROFILE, type WorkerErrorCode } from '../src/shared/protocol'
import { workerHarness } from './helpers/workerHarness'

// =================================================================================================
// ⭐⭐ B-02 (principles review of 26.09, docs/review-principles-2026-09-26/02-engine-core.md) –
// `mutate` COMMITTED THE CANDIDATE BEFORE IT COULD RENDER.
//
// E-02's ordering rule – "the reply is DECIDED before the world is ADOPTED" – was applied to the
// three lifecycle paths (`new`, `restoreSlot`, `importSave`) and not to the everyday one: all 41
// `return mutate(` commands ran `commitAutosave` → `world = candidate` → `snapshotMsg`, and
// `snapshotMsg` builds `toSnapshot` at reply time. So any engine bug that makes `toSnapshot` throw
// turned "the command was refused" into "the career is persisted in a state that cannot load" – the
// difference between a toast and a lost save. The class has already bricked one: round 42 #15, a soft
// small-talk row re-worded at a stage with no line ("`smallTalkOpener` throws inside the snapshot the
// whole app renders from. Rare, silent to write, and fatal to the save", world/lifeBeat.ts).
//
// ⚠ THE INJECTED THROW IS THE ONLY HONEST WAY TO MEASURE THIS. The ordering cannot be seen from
// outside while `toSnapshot` works, and the throw sites that make it real (`lifeBeatSaid` alone
// carries five) are reached by data this suite cannot manufacture. So the wrapper below throws once,
// on command, and the assertions are about what is left behind: the queue, the disk and the revision.
//
// ⚠ MUTATION-VERIFIED: swap the order back in `mutate` (build the snapshot after `commitAutosave`)
// and this file goes red on the committed week and the autosave's revision.
// =================================================================================================

/** One-shot, set by the case that wants it – `vi.hoisted` so the mock factory can close over it. */
const oracle = vi.hoisted(() => ({ throwNextSnapshot: false, calls: 0 }))

vi.mock('../src/engine/world', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/world')>()
  return {
    ...actual,
    toSnapshot: (...args: Parameters<typeof actual.toSnapshot>) => {
      oracle.calls += 1
      if (oracle.throwNextSnapshot) {
        oracle.throwNextSnapshot = false
        throw new Error('B-02 probe: toSnapshot threw on this candidate')
      }
      return actual.toSnapshot(...args)
    },
  }
})

vi.mock('../src/db/saves', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/db/saves')>()
  return { ...actual, commitAutosave: vi.fn(actual.commitAutosave) }
})

import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { commitAutosave } from '../src/db/saves'

interface Reply {
  id: number
  ok: boolean
  error?: string
  code?: WorkerErrorCode
  revision?: number
  snapshot?: { week: number; careerId: string }
}

// ⚠ TOP LEVEL: the factory assigns `globalThis.self`, which the worker reads while it evaluates.
const { send, workerGlobal } = workerHarness<Reply>()

/** The pipeline suite's own fixture: a career parked so that every advance moves exactly one week. */
function quietCareer(seed: string, weeks = 10): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  drainLifeBeats(world)
  return world
}

async function importIntoWorker(world: WorldState): Promise<Reply> {
  const bytes = (await encodeExportFile(world)).slice()
  const res = await send({ type: 'importSave', bytes: bytes.buffer as ArrayBuffer })
  expect(res.ok, res.error).toBe(true)
  return res
}

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
})

describe('⭐⭐ B-02 – a mutation commits only what can render', () => {
  it('⭐ a snapshot that throws refuses the command and leaves world, disk and revision untouched', async () => {
    const world = quietCareer('b02-order')
    const imported = await importIntoWorker(world)
    const rev = imported.revision!
    const week = imported.snapshot!.week
    const careerId = imported.snapshot!.careerId
    const committedBefore = vi.mocked(commitAutosave).mock.calls.length

    oracle.throwNextSnapshot = true
    const refused = await send({ type: 'advance', weeks: 1, baseRevision: rev })

    expect(refused.ok, 'the command is refused, not half-applied').toBe(false)
    expect(refused.error).toContain('toSnapshot threw')
    expect(
      vi.mocked(commitAutosave).mock.calls.length,
      'nothing was written: the autosave never ran',
    ).toBe(committedBefore)

    // The committed pair – memory, disk and the revision ledger – is where it was.
    const snap = await send({ type: 'getSnapshot' })
    expect(snap.ok, snap.error).toBe(true)
    expect(snap.revision, 'the revision ledger did not move').toBe(rev)
    expect(snap.snapshot!.week, 'the world did not move').toBe(week)
    const onDisk = await readLatestAutosave(careerId)
    expect(onDisk.revision, 'the newest autosave is still the pre-command one').toBe(rev)
    expect(onDisk.world.week).toBe(week)
    expect(onDisk.recovered, 'and it is readable without a generation fallback').toBe(false)

    // ...and the same command, retried against the same base, now applies exactly once.
    const retried = await send({ type: 'advance', weeks: 1, baseRevision: rev })
    expect(retried.ok, retried.error).toBe(true)
    expect(retried.revision).toBe(rev + 1)
    expect(retried.snapshot!.week).toBe(week + 1)
  }, 60_000)

  it('⭐ the reply carries the snapshot built from the candidate, not a second one built later', async () => {
    const imported = await importIntoWorker(quietCareer('b02-once'))
    const rev = imported.revision!
    const before = oracle.calls

    const res = await send({ type: 'advance', weeks: 1, baseRevision: rev })
    expect(res.ok, res.error).toBe(true)
    // ONE build per mutation, which is what makes the reordering free: the snapshot every command
    // already paid for is the one the reply carries.
    expect(oracle.calls - before, 'the mutation built exactly one snapshot').toBe(1)
    expect(res.revision, 'the revision is still read off committedRevision at reply time').toBe(rev + 1)
  }, 60_000)
})
