// Lane B probe (26.09 review, baseline 03d92221). Read-only. The 05.09 E-02 probe, generalised.
// For EVERY top-level key of the newest golden save (tests/fixtures/saves/v89.json): delete it, push the
// payload through the import door's own gates (guardPayloadBounds -> guardDeclaredShape -> migrateSave),
// then the worker's load step (refreshDerivedRankCaches), toSnapshot and four ticks. A key whose removal
// PASSES the gate but THROWS in the snapshot or the tick is a "crash wearing a valid header"
// (saveGuard.ts's own phrase) – the E-02 class.
import { readFileSync } from 'node:fs'
import { guardDeclaredShape, guardPayloadBounds } from '../../../src/engine/saveGuard'
import { migrateSave } from '../../../src/engine/migrations'
import { refreshDerivedRankCaches, tickWeek, toSnapshot } from '../../../src/engine/world'
import { resumeMain } from '../../../src/engine/rng'

const file = process.argv[2] ?? 'tests/fixtures/saves/v89.json'
const base = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
const declared = base.schemaVersion as number
const rows: string[] = []
const survived: string[] = []
let passedThenThrew = 0, refused = 0, fine = 0
for (const key of Object.keys(base)) {
  if (key === 'schemaVersion') continue
  const p = structuredClone(base)
  delete p[key]
  let stage = 'gate'
  try {
    guardPayloadBounds(p)
    const c = guardDeclaredShape(p, declared)
    stage = 'migrate'
    const w = migrateSave(c)
    stage = 'load'
    refreshDerivedRankCaches(w)
    stage = 'snapshot'
    toSnapshot(w)
    stage = 'tick'
    const rng = resumeMain(w.rngMain)
    for (let i = 0; i < 4; i++) tickWeek(w, rng)
    stage = 'snapshot-after-tick'
    toSnapshot(w)
    fine++
    survived.push(key)
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e).slice(0, 90)
    if (stage === 'gate') { refused++; continue }
    passedThenThrew++
    rows.push(`${key.padEnd(30)} gate: passed | threw at ${stage}: ${msg}`)
  }
}
console.log(`${file} (v${declared}, week ${base.week}): ${Object.keys(base).length - 1} keys; refused at the gate ${refused}; passed and survived ${fine}; PASSED THE GATE THEN THREW ${passedThenThrew}`)
for (const r of rows) console.log('  ' + r)
console.log(`survived (gate passed, snapshot and four ticks ran): ${survived.join(', ')}`)
