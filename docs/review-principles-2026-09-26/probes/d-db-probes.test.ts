// Lane D probe (26.09 review, baseline 03d92221). A VITEST file: it is authored here and run as a
// copy at /Users/letulip/Projects/Claude/tb-review/tests/zz-review-d-db-probes.test.ts (imports are
// written relative to tests/), then deleted from there:
//   npx vitest run --project unit tests/zz-review-d-db-probes.test.ts > <out> 2>&1; echo "X_EXIT=$?" >> <out>
// It asserts what the baseline DOES (every expectation below passed at 03d92221) and logs the facts
// the lane report cites. No timing is taken.

import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive, toRaw } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import {
  commitAutosave,
  readLatestAutosave,
  readSlot,
  listSlots,
  closeDb,
} from '../src/db/saves'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world/state'
import { SaveFileError } from '../src/engine/saveGuard'
import type { DynastyHandover } from '../src/shared/protocol'

const sent: unknown[] = []
vi.mock('../src/worker/client', () => ({
  WorkerRestartError: class extends Error {},
  request: vi.fn(async (msg: unknown) => {
    // the real client hands this object to Worker.postMessage, which structured-clones it
    sent.push(structuredClone(msg))
    return { id: 0, ok: false, error: 'probe: no worker' }
  }),
}))
import { useGameStore } from '../src/stores/game'

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

beforeEach(async () => {
  await closeDb()
  await deleteDatabase()
})

describe('lane D – the DB door and a save newer than this build', () => {
  it('a newer-schema generation is treated as CORRUPTION: the older one loads as "recovered", and two commits later the newer one is gone', async () => {
    const cid = 'c-straddle'
    await commitAutosave(worldAt('str', 1, cid), 1) // gen a, this build's schema
    const newer = worldAt('str', 2, cid)
    newer.schemaVersion = SAVE_SCHEMA_VERSION + 1 // what a newer build would have written
    await commitAutosave(newer, 2) // gen b

    // the DB door's refusal of the newer generation, as thrown
    let thrown: unknown = null
    try {
      await readSlot(`auto:${cid}:b`)
    } catch (err) {
      thrown = err
    }
    console.log('D-PROBE too-new DB-door error:', (thrown as Error).constructor.name, '|', (thrown as Error).message)
    expect(thrown).toBeInstanceOf(Error)
    expect(thrown instanceof SaveFileError).toBe(false) // no code crosses: not 'future-schema'

    const latest = await readLatestAutosave(cid)
    console.log('D-PROBE readLatestAutosave:', JSON.stringify({ week: latest.world.week, recovered: latest.recovered, revision: latest.revision }))
    expect(latest.recovered).toBe(true) // the player is told the career was "repaired"
    expect(latest.world.week).toBe(1) // ...and is handed the OLDER week

    // the worker then commits revision+1, +2 on the older world (the next two commands)
    await commitAutosave(latest.world, latest.revision + 1)
    const afterOne = (await listSlots(cid)).map((s) => `${s.slot}@rev${s.revision}`)
    await commitAutosave(latest.world, latest.revision + 2)
    const afterTwo = (await listSlots(cid)).map((s) => `${s.slot}@rev${s.revision}`)
    console.log('D-PROBE after one commit:', JSON.stringify(afterOne), '| after two:', JSON.stringify(afterTwo))
    const survivors = await Promise.all(
      (await listSlots(cid)).map(async (s) => {
        try {
          return (await readSlot(s.slot)).schemaVersion
        } catch {
          return 'unreadable'
        }
      }),
    )
    console.log('D-PROBE schema of surviving generations:', JSON.stringify(survivors))
    expect(survivors).not.toContain('unreadable') // the newer build's generation has been overwritten
  })

  it('listSlots materialises EVERY record in the store (all careers, payloads included) to answer for one career', async () => {
    for (let c = 0; c < 5; c++) {
      for (let r = 1; r <= 2; r++) await commitAutosave(worldAt(`ls${c}`, r * 20, `c-ls-${c}`), r)
    }
    // what `getAll()` on the saves store returns – the same call listSlots makes (db/saves.ts:395)
    const all = await new Promise<{ payload: Uint8Array }[]>((resolve, reject) => {
      const open = indexedDB.open('tennis-sim')
      open.onsuccess = () => {
        const req = open.result.transaction('saves', 'readonly').objectStore('saves').getAll()
        req.onsuccess = () => {
          resolve(req.result as { payload: Uint8Array }[])
          open.result.close()
        }
        req.onerror = () => reject(req.error)
      }
    })
    const bytes = all.reduce((n, r) => n + r.payload.byteLength, 0)
    const mine = await listSlots('c-ls-0')
    console.log('D-PROBE listSlots:', JSON.stringify({ recordsInStore: all.length, payloadBytesMaterialised: bytes, metasReturned: mine.length, metaJsonBytes: JSON.stringify(mine).length }))
    expect(all.length).toBe(10)
    expect(mine.length).toBe(2)
  })
})

describe('lane D – lead 4, what crosses postMessage from the store', () => {
  const block: DynastyHandover = {
    generation: 1,
    childSeed: 'kid-seed',
    background: 'middle',
    raisedOnTour: false,
    motherName: { first: 'Alice', last: 'Martin' },
    motherCountry: 'NZ',
    childBirthdays: [{ month: 3, day: 4 }],
    motherTemperament: 'steady' as DynastyHandover['motherTemperament'],
    motherCareer: {
      titles: 3,
      proTitles: 1,
      collegeTitles: 0,
      bestRank: 40,
      slams: 0,
      endedWeek: 1200,
      endingKind: 'natural',
    },
  }

  it('a reactive block is not cloneable; plainDynasty makes it so; toRaw+structuredClone works only while nothing nested is a proxy', async () => {
    const live = reactive(structuredClone(block))
    expect(() => structuredClone(live)).toThrow() // the wave-10 defect, reproduced
    expect(() => structuredClone(toRaw(live))).not.toThrow() // the alternative, on a whole reactive
    const composed = { ...toRaw(live), motherName: live.motherName } // one nested proxy
    expect(() => structuredClone(toRaw(composed))).toThrow() // toRaw is shallow: the alternative fails

    setActivePinia(createPinia())
    const game = useGameStore()
    sent.length = 0
    await game.newCareer('s', undefined, undefined, live as unknown as DynastyHandover)
    const newMsg = sent.find((m) => (m as { type: string }).type === 'new') as { dynasty: DynastyHandover }
    console.log('D-PROBE new() crossed with dynasty keys:', Object.keys(newMsg.dynasty).length, 'motherCareer keys:', Object.keys(newMsg.dynasty.motherCareer).length)
    expect(newMsg.dynasty).toEqual(block)

    // setPlan with a plan built from reactive state – plain today only because planFromWeek copies days
    sent.length = 0
    const plan = reactive({ train: 75, rest: 25, week: [['general'], [], [], [], [], [], []] })
    await game.setPlan(plan as never)
    console.log('D-PROBE setPlan with a reactive plan crossed:', sent.length === 1 ? 'yes' : 'NO – postMessage would throw')
  })
})
