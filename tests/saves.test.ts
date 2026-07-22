import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { writeSlot, readSlot, listSlots, deleteSlot, autosave } from '../src/db/saves'
import { createWorld, tickWeek } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'

function worldAtWeek(seed: string, weeks: number) {
  const world = createWorld(seed)
  const rng = rngFromSeed(seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

describe('save slots (IndexedDB)', () => {
  it('writes, lists and reads back a slot', async () => {
    const world = worldAtWeek('idb-test', 30)
    const meta = await writeSlot('manual', world)
    expect(meta.week).toBe(30)
    expect(meta.bytes).toBeGreaterThan(0)

    const slots = await listSlots()
    expect(slots.some((s) => s.slot === 'manual')).toBe(true)

    const restored = await readSlot('manual')
    expect(restored).toEqual(world)
  })

  it('rotates autosaves across three slots, overwriting the oldest', async () => {
    for (let i = 1; i <= 5; i++) {
      await autosave(worldAtWeek('rotate', i))
    }
    const slots = (await listSlots()).filter((s) => s.slot.startsWith('auto-'))
    expect(slots).toHaveLength(3)
    const weeks = slots.map((s) => s.week).sort((a, b) => a - b)
    expect(weeks).toEqual([3, 4, 5])
  })

  it('deletes slots', async () => {
    await writeSlot('doomed', worldAtWeek('del', 1))
    await deleteSlot('doomed')
    await expect(readSlot('doomed')).rejects.toThrow(/no save/i)
  })
})
