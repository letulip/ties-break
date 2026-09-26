// Lane D probe (26.09 review, baseline 03d92221). A VITEST file: authored here, run as a copy at
// /Users/letulip/Projects/Claude/tb-review/tests/zz-review-d-import-holes.test.ts (imports relative to
// tests/), then deleted from there:
//   npx vitest run --project unit tests/zz-review-d-import-holes.test.ts > <out> 2>&1; echo "X_EXIT=$?" >> <out>
//
// d-spine-sweep.ts found fields whose absence passes the import gate. This drives two of them through
// the REAL worker (tests/helpers/workerHarness, fake-indexeddb): one that throws in `toSnapshot`
// (`skills`) and one that throws only on the first tick (`children`). Assertions state what the
// baseline DOES; all passed at 03d92221.

import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { describe, it, expect, beforeAll } from 'vitest'
import { workerHarness } from './helpers/workerHarness'
import { encodeExportFile } from '../src/engine/saveCodec'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world/state'
import { readLatestAutosave } from '../src/db/saves'
import type { WorldState } from '../src/engine/world'

interface Reply {
  id: number
  ok: boolean
  error?: string
  code?: string
  revision?: number
  snapshot?: { week: number; careerId: string }
}
const { send, workerGlobal } = workerHarness<Reply>()

function golden(without: string): WorldState {
  const w = JSON.parse(readFileSync(`tests/fixtures/saves/v${SAVE_SCHEMA_VERSION}.json`, 'utf8')) as Record<string, unknown>
  delete w[without]
  return w as unknown as WorldState
}

async function importWorld(world: WorldState): Promise<Reply> {
  const bytes = (await encodeExportFile(world)).slice()
  return send({ type: 'importSave', bytes: bytes.buffer as ArrayBuffer })
}

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage).not.toBeNull()
})

describe('lane D – fields the import gate lets through', () => {
  it('`skills` missing: refused (E-02 ordering holds) but with a bare TypeError and no code', async () => {
    const res = await importWorld(golden('skills'))
    console.log('D-PROBE skills-less import reply:', JSON.stringify({ ok: res.ok, code: res.code ?? null, error: res.error }))
    expect(res.ok).toBe(false)
    expect(res.code).toBeUndefined()
    expect(res.error).toMatch(/Cannot read properties of undefined/)
  })

  it('`children` missing: ADOPTED and persisted, then every advance throws', async () => {
    const res = await importWorld(golden('children'))
    expect(res.ok, res.error).toBe(true)
    const careerId = res.snapshot!.careerId
    const persisted = await readLatestAutosave(careerId)
    console.log('D-PROBE children-less import: ok, persisted as revision', persisted.revision, 'children on disk:', (persisted.world as unknown as Record<string, unknown>).children)
    const adv1 = await send({ type: 'advance', weeks: 1, baseRevision: res.revision! })
    const adv2 = await send({ type: 'advance', weeks: 1, baseRevision: res.revision! })
    console.log('D-PROBE advance after it:', JSON.stringify({ ok: adv1.ok, code: adv1.code ?? null, error: adv1.error }), '| again:', JSON.stringify({ ok: adv2.ok, error: adv2.error }))
    expect(adv1.ok).toBe(false)
    expect(adv2.ok).toBe(false)
    expect(adv1.error).toMatch(/Cannot read properties of undefined/)
  })
})
