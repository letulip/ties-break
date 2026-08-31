/** r31 #9 – how far past peak is she, in the engine's own number? MEASUREMENT ONLY. */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidAgeAt } from '../src/engine/world/age'
import { physicalMean } from '../src/engine/development'

for (const p of process.argv.slice(2).filter((a) => a.endsWith('.tsave'))) {
  const w = (await decodeExportFile(new Uint8Array(readFileSync(p)))) as WorldState
  const peak = (w as unknown as { peakPhysical: number }).peakPhysical
  const now = physicalMean(w.skills)
  const share = peak > 0 ? now / peak : 1
  console.log(
    `week ${w.week}  age ${kidAgeAt(w, w.week).toFixed(1)}  physical ${now.toFixed(2)} of peak ${peak.toFixed(2)}  share ${(share * 100).toFixed(1)}%`,
  )
}
