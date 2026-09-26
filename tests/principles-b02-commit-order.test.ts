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
//
// ⭐⭐ AND THE SECOND DESCRIBE IS B-02's LAST LIFECYCLE PATH, `loadCareer` (26.09). B-02's own
// proposal handed it to lane D – "the load-side fallback … is lane D's line" – and no task picked it
// up, so `loadCareer` kept the order every mutation has just lost: `touchCareer` → `world = loaded`
// → `snapshotMsg`, which renders at reply time. W1's own fuzz corpus (tests/save-doors-fuzz.test.ts)
// then measured it from outside: the active career `{"careerId":"c-e2e-pro","week":413}` became a
// reply with no snapshot at all and every later `getSnapshot` threw, so the screen the player was on
// was gone until a reload. Nothing reaches the saves store on that path, which is what makes it an
// IN-MEMORY loss rather than a corrupt save – and `touchCareer` made it self-reproducing: it marked
// the career as just-played BEFORE the render, so the career that cannot render became the one the
// next boot opens first, and the reload landed on the same wall.
//
// ⚠ MUTATION-VERIFIED TOO: move `const snapshot = toSnapshot(loaded)` back behind `touchCareer` and
// the two assignments in `loadCareer`, and the first case below goes red on the held career's id
// («the held career was replaced by the one that cannot render: expected 'legacy-b02-load-refused'
// to be 'legacy-b02-load-held'»). The SECOND case is green either way on purpose – it is the proof
// that this is an ordering fix and not a behaviour change, and a reply that moved would make it red.
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
  // `touchCareer` is spied for the same reason `commitAutosave` is: on the load path it is the one
  // WRITE the ordering moves, and a spy answers "did it run at all" without reading the clock.
  return { ...actual, commitAutosave: vi.fn(actual.commitAutosave), touchCareer: vi.fn(actual.touchCareer) }
})

import { createWorld, refreshDerivedRankCaches, tickWeek, toSnapshot, type WorldState } from '../src/engine/world'
import { commitAutosave, listCareers, listSlots, touchCareer } from '../src/db/saves'

interface Reply {
  id: number
  ok: boolean
  error?: string
  code?: WorkerErrorCode
  revision?: number
  snapshot?: { week: number; careerId: string }
}

/** A reply as the wire carries it, for a field-for-field comparison: `toEqual` over two JSON
 *  projections is the whole reply – every field, no extra key – rather than the handful `Reply`
 *  happens to declare. */
const plain = (v: unknown): unknown => JSON.parse(JSON.stringify(v))

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

// -------------------------------------------------------------------------------------------------
// ⭐⭐ B-02's LAST LIFECYCLE PATH – `loadCareer`.
//
// ⚠ THE MARKER IS SET BY HAND RATHER THAN READ OFF THE CLOCK. `touchCareer(id, at = Date.now())`
// writes `lastPlayedAt`, and comparing two wall-clock reads inside one millisecond is a coin toss; a
// fixed number the fix cannot produce makes "the row did not move" an assertion instead of a race.
// -------------------------------------------------------------------------------------------------
const MARKER = 1_000

describe('⭐⭐ B-02 – a load adopts only what can render', () => {
  it('⭐ a load whose snapshot throws refuses, and the career the worker was holding is still there', async () => {
    // The career the player is ON, held by the worker and durable.
    const held = await importIntoWorker(quietCareer('b02-load-held'))
    const heldId = held.snapshot!.careerId
    const heldRev = held.revision!
    const heldWeek = held.snapshot!.week

    // A second career on disk whose newest generation cannot render. The throw is INJECTED for the
    // reason the header gives – the data that makes `toSnapshot` throw for real is a hostile save
    // this file does not build – and the corpus next door drives the real thing on 14 of them.
    const other = quietCareer('b02-load-refused', 6)
    await commitAutosave(other, 1)
    await touchCareer(other.careerId, MARKER)
    const slotsBefore = JSON.stringify(await listSlots(other.careerId))
    const heldSlotsBefore = JSON.stringify(await listSlots(heldId))
    vi.mocked(touchCareer).mockClear()

    oracle.throwNextSnapshot = true
    const refused = await send({ type: 'loadCareer', careerId: other.careerId })

    expect(refused.ok, 'the load is refused, not half-adopted').toBe(false)
    expect(refused.error).toContain('toSnapshot threw')
    // ⚠ NO SENTENCE IS ASSERTED HERE ON PURPOSE. Which copy a refused load should carry is the open
    // question the fuzz corpus reports as its own finding and the owner's to answer (CLAUDE.md
    // invariant 4); this file asserts only that the refusal left the world alone.

    // The career the player was on is still the worker's, and still ANSWERABLE.
    //
    // ⚠ THE ONE-SHOT THROW MAKES THIS THE MILDER HALF OF THE DEFECT, and that is why the assertion
    // names the careerId. The injected throw fires once, so the wrongly-adopted career RENDERS on the
    // next ask: the pre-fix tell here is that `getSnapshot` answers somebody else's week. The corpus
    // next door drives the harder version, where the data itself is broken and every later
    // `getSnapshot` throws – the screen the player was on gone until a reload.
    const snap = await send({ type: 'getSnapshot' })
    expect(snap.ok, snap.error).toBe(true)
    expect(snap.snapshot!.careerId, 'the held career was replaced by the one that cannot render').toBe(heldId)
    expect(snap.snapshot!.week, 'the held career did not move').toBe(heldWeek)
    expect(snap.revision, 'the revision ledger did not move').toBe(heldRev)

    expect(vi.mocked(touchCareer).mock.calls.length, 'a refused load marks nothing as just-played').toBe(0)
    const row = (await listCareers()).find((c) => c.careerId === other.careerId)!
    expect(row.lastPlayedAt, 'the careers row still carries the marker, so the next boot is unmoved').toBe(MARKER)

    // A load is a READ: neither career's slots moved.
    expect(JSON.stringify(await listSlots(other.careerId)), "the refused career's slots moved").toBe(slotsBefore)
    expect(JSON.stringify(await listSlots(heldId)), "the held career's slots moved").toBe(heldSlotsBefore)

    // ...and the retry adopts it, marks it as just-played and answers its week: the touch is
    // DEFERRED by this fix, never dropped. `touchCareer`'s own ruling still holds – "opening it
    // counts as playing it, or the next boot ignores the choice" – for every load that can render.
    const loaded = await send({ type: 'loadCareer', careerId: other.careerId })
    expect(loaded.ok, loaded.error).toBe(true)
    expect(loaded.snapshot!.week).toBe(other.week)
    expect(vi.mocked(touchCareer).mock.calls.length, 'a load that renders still touches').toBe(1)
    const touched = (await listCareers()).find((c) => c.careerId === other.careerId)!
    expect(touched.lastPlayedAt, 'and the row moves off the marker').toBeGreaterThan(MARKER)
  }, 60_000)

  it('⭐ a successful load answers exactly what it answered before the reorder, field for field', async () => {
    const world = quietCareer('b02-load-identical', 8)
    await commitAutosave(world, 1)

    // THE PRE-FIX SHAPE, ASSEMBLED FROM THE PRE-FIX CODE'S OWN ARGUMENTS. `snapshotMsg` with no
    // `snapshot` in its opts built `toSnapshot(loaded, undefined)` at reply time and read `revision`
    // off `committedRevision`, which the load had just set to `readLatestAutosave`'s number. So the
    // expected reply is: that world, after `ensureMainState`'s deterministic cache refresh, rendered
    // with no stop reasons, under the disk's highest known revision – and `recovered` ABSENT, since
    // `snapshotMsg` only ever adds it when true.
    const { world: onDisk, recovered, revision } = await readLatestAutosave(world.careerId)
    expect(recovered, 'the fixture loads without a generation fallback').toBe(false)
    refreshDerivedRankCaches(onDisk)
    const expected = { id: 0, ok: true, type: 'snapshot', snapshot: toSnapshot(onDisk), revision }

    const reply = await send({ type: 'loadCareer', careerId: world.careerId })
    expect(reply.ok, reply.error).toBe(true)
    expect(plain(reply), 'the reorder moved WHEN the snapshot is built, not what the reply says').toEqual(
      plain({ ...expected, id: reply.id }),
    )
  }, 60_000)
})
