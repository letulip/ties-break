// Lane B probe (26.09 review, baseline 03d92221). Read-only. Companion to b-spine-sweep.ts: for a few
// keys whose removal PASSES the gate and SURVIVES the snapshot and four ticks, what does the world hold
// afterwards – a sane default, or a silent NaN / undefined riding on into the next autosave?
import { readFileSync } from 'node:fs'
import { guardDeclaredShape, guardPayloadBounds } from '../../../src/engine/saveGuard'
import { migrateSave } from '../../../src/engine/migrations'
import { refreshDerivedRankCaches, tickWeek, toSnapshot } from '../../../src/engine/world'
import { resumeMain } from '../../../src/engine/rng'

const base = JSON.parse(readFileSync('tests/fixtures/saves/v89.json', 'utf8')) as Record<string, unknown>
for (const key of ['condition', 'seasonWins', 'coachId', 'kidFundsCents', 'bond', 'spirit', 'physioActive', 'oneMoreYearCount', 'peakPhysical', 'composureBonus']) {
  const p = structuredClone(base)
  const was = JSON.stringify(p[key])
  delete p[key]
  guardPayloadBounds(p)
  const w = migrateSave(guardDeclaredShape(p, base.schemaVersion as number)) as unknown as Record<string, unknown>
  refreshDerivedRankCaches(w as never)
  const snap = toSnapshot(w as never) as unknown as Record<string, unknown>
  const rng = resumeMain((w as { rngMain: { s: number; n: number } }).rngMain)
  for (let i = 0; i < 4; i++) tickWeek(w as never, rng)
  const after = w[key]
  const snapAfter = toSnapshot(w as never) as unknown as Record<string, unknown>
  const show = (v: unknown): string => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v === undefined ? 'undefined' : JSON.stringify(v))
  const snapKey = key in snapAfter ? show(snapAfter[key]) : '(not on snapshot)'
  console.log(`${key.padEnd(18)} fixture=${String(was).slice(0, 20).padEnd(20)} after-load snapshot=${(key in snap ? show(snap[key]) : '(not on snapshot)').slice(0, 18).padEnd(18)} after 4 ticks world=${show(after).slice(0, 20)} snapshot=${snapKey.slice(0, 20)}`)
}
