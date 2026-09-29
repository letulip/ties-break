// Lane D probe (26.09 review, baseline 03d92221) – the E-02 method re-run on the CURRENT golden.
//
// For every top-level field of tests/fixtures/saves/v<SAVE_SCHEMA_VERSION>.json: delete it, then push
// the result through the import door's own steps in the worker's order –
//   guardPayloadBounds -> guardDeclaredShape -> migrateSave        (decodeExportFile, saveCodec.ts)
//   refreshDerivedRankCaches                                       (ensureMainState, sim.worker.ts)
//   toSnapshot                                                     (built BEFORE adopt since E-02)
//   tickWeek x1 via resumeMain(world.rngMain)                      (the first `advance` after import)
// and print one line per field: where it was refused or threw, or "ok".
//
// Run from the tb-review worktree root:
//   npx vite-node docs/review-principles-2026-09-26/probes/d-spine-sweep.ts > <out> 2>&1; echo "X_EXIT=$?" >> <out>
// Output is data only; no timing is taken.

import { readFileSync } from 'node:fs'
import { guardPayloadBounds, guardDeclaredShape } from '../../../src/engine/saveGuard'
import { migrateSave } from '../../../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../../../src/engine/world/state'
import { toSnapshot, tickWeek, refreshDerivedRankCaches, type WorldState } from '../../../src/engine/world'
import { resumeMain } from '../../../src/engine/rng'

const path = `tests/fixtures/saves/v${SAVE_SCHEMA_VERSION}.json`
const text = readFileSync(path, 'utf8')
const base = JSON.parse(text) as Record<string, unknown>
const keys = Object.keys(base)

function stage<T>(name: string, fn: () => T): { ok: true; v: T } | { ok: false; why: string } {
  try {
    return { ok: true, v: fn() }
  } catch (err) {
    const msg = err instanceof Error ? `${err.constructor.name}: ${err.message}` : String(err)
    return { ok: false, why: `${name} THREW ${msg.slice(0, 140)}` }
  }
}

console.log(`fixture ${path} schema ${base.schemaVersion} week ${base.week} – ${keys.length} top-level fields`)
const tally = { refusedAtGate: 0, snapshotThrew: 0, tickThrew: 0, ok: 0, migrateThrew: 0 }
const snapshotOrTick: string[] = []
for (const key of keys) {
  if (key === 'schemaVersion') continue
  const parsed = JSON.parse(text) as Record<string, unknown>
  delete parsed[key]
  const gate = stage('gate', () => {
    guardPayloadBounds(parsed)
    return guardDeclaredShape(parsed, SAVE_SCHEMA_VERSION)
  })
  if (!gate.ok) {
    tally.refusedAtGate++
    console.log(`${key.padEnd(34)} REFUSED at gate`)
    continue
  }
  const mig = stage('migrateSave', () => migrateSave(gate.v))
  if (!mig.ok) {
    tally.migrateThrew++
    console.log(`${key.padEnd(34)} gate passed | ${mig.why}`)
    continue
  }
  const w = mig.v as WorldState
  const snap = stage('snapshot', () => {
    refreshDerivedRankCaches(w)
    return toSnapshot(w)
  })
  if (!snap.ok) {
    tally.snapshotThrew++
    snapshotOrTick.push(key)
    console.log(`${key.padEnd(34)} gate passed | ${snap.why}`)
    continue
  }
  const tick = stage('first tick', () => {
    const c = structuredClone(w)
    tickWeek(c, resumeMain(c.rngMain))
    return c
  })
  if (!tick.ok) {
    tally.tickThrew++
    snapshotOrTick.push(key)
    console.log(`${key.padEnd(34)} gate passed | snapshot ok | ${tick.why}`)
    continue
  }
  tally.ok++
  console.log(`${key.padEnd(34)} gate passed | snapshot ok | first tick ok`)
}
console.log('TALLY', JSON.stringify(tally))
console.log('PASSED_GATE_BUT_THREW', JSON.stringify(snapshotOrTick))
