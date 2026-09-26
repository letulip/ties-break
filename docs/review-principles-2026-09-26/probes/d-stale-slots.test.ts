// Lane D probe (26.09 review, baseline 03d92221). A VITEST file: authored here, run as a copy at
// /Users/letulip/Projects/Claude/tb-review/tests/zz-review-d-stale-slots.test.ts (imports are relative
// to tests/), then deleted from there:
//   npx vitest run --project unit tests/zz-review-d-stale-slots.test.ts > <out> 2>&1; echo "X_EXIT=$?" >> <out>
//
// THE REAL STORE OVER THE REAL WORKER. `request` (worker/client.ts) is replaced by a router into the
// real `sim.worker.ts` handler through tests/helpers/workerHarness (the pipeline suite's own harness),
// with a structuredClone on each leg standing in for postMessage; IndexedDB is fake-indexeddb.
//
// The question: after a mutation whose store action does NOT call `refreshSlots` (15 of 41), what does
// MoreScreen's «Restore previous» (MoreScreen.vue:218-240 – `autoSlots` sorted by `savedAt`, [1]) do?
// Every assertion states what the baseline DOES; all passed at 03d92221.

import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { workerHarness } from './helpers/workerHarness'
import { drainLifeBeats } from './helpers/career'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { adoptAutosave, readSlot, listSlots } from '../src/db/saves'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const harness = vi.hoisted(() => ({ send: null as null | ((m: unknown) => Promise<unknown>) }))
vi.mock('../src/worker/client', () => ({
  WorkerRestartError: class extends Error {},
  request: async (msg: unknown) => structuredClone(await harness.send!(structuredClone(msg))),
}))
import { useGameStore } from '../src/stores/game'

const { send, workerGlobal } = workerHarness<{ id: number }>()
harness.send = send as (m: unknown) => Promise<unknown>

function quietCareer(seed: string, weeks = 10): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  drainLifeBeats(world)
  return world
}

/** MoreScreen.vue:218-222, verbatim logic */
function moreScreenPrevious(slots: { slot: string; savedAt: number }[]): string | undefined {
  return slots.filter((s) => s.slot.startsWith('auto:')).sort((a, b) => b.savedAt - a.savedAt)[1]?.slot
}

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage).not.toBeNull()
})

describe('lane D – «Restore previous» after a mutation that does not refresh the slot list', () => {
  it('restores the CURRENT state and overwrites the real previous generation', async () => {
    setActivePinia(createPinia())
    const game = useGameStore()
    const world = quietCareer('stale-slots')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1) // refreshes slots: the list is true here
    expect(game.error).toBe('')
    const weekBefore = game.snapshot!.week
    const physioBefore = game.snapshot!.physioActive as boolean

    // one of the 15 mutations whose action has no refreshSlots (game.ts:767-772)
    await game.setPhysio(!physioBefore)
    expect(game.error).toBe('')
    expect(game.snapshot!.physioActive).toBe(!physioBefore)

    const prev = moreScreenPrevious(game.slots)!
    const heldByPrev = await readSlot(prev)
    const onDisk = await listSlots(world.careerId)
    console.log(
      'D-PROBE store slots (stale):',
      JSON.stringify(game.slots.map((s) => `${s.slot}@rev${s.revision}`)),
      '| disk:',
      JSON.stringify(onDisk.map((s) => `${s.slot}@rev${s.revision}`)),
    )
    console.log('D-PROBE «Restore previous» targets', prev, 'which holds physioActive =', heldByPrev.physioActive, '(current is', !physioBefore, ')')
    expect(heldByPrev.physioActive).toBe(!physioBefore) // the "previous" slot holds the CURRENT state

    await game.restoreSlot(prev)
    expect(game.error).toBe('')
    const gens = await Promise.all(
      (await listSlots(world.careerId)).filter((s) => s.slot.startsWith('auto:')).map((s) => readSlot(s.slot)),
    )
    console.log('D-PROBE after restore, both generations physioActive =', JSON.stringify(gens.map((g) => g.physioActive)), 'week', JSON.stringify(gens.map((g) => g.week)))
    // the restore changed nothing the player can see, and no generation holds the pre-toggle state any more
    expect(game.snapshot!.physioActive).toBe(!physioBefore)
    expect(gens.every((g) => g.physioActive === !physioBefore)).toBe(true)
    expect(game.snapshot!.week).toBe(weekBefore)
  })

  it('control: after a mutation that DOES refresh (setWeightEnabled), «Restore previous» undoes it', async () => {
    setActivePinia(createPinia())
    const game = useGameStore()
    const world = quietCareer('stale-slots-control')
    await adoptAutosave(world)
    await game.loadCareer(world.careerId)
    await game.advance(1)
    const before = game.snapshot!.weightEnabled as boolean
    await game.setWeightEnabled(!before)
    expect(game.error).toBe('')
    const prev = moreScreenPrevious(game.slots)!
    await game.restoreSlot(prev)
    console.log('D-PROBE control: weightEnabled before', before, 'after restore', game.snapshot!.weightEnabled)
    expect(game.snapshot!.weightEnabled).toBe(before)
  })
})
