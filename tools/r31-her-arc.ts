/** r31 #7b – her age and her skill-derived rating across the kept saves. MEASUREMENT ONLY. */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidAgeAt } from '../src/engine/world/age'
import { ratingOf } from '../src/engine/match/rating'
import { kidMatchPlayerFor } from '../src/engine/world/player'

console.log(['week', 'age', 'hard', 'clay', 'grass', 'condition'].join('\t'))
for (const p of process.argv.slice(2).filter((a) => a.endsWith('.tsave'))) {
  const w = (await decodeExportFile(new Uint8Array(readFileSync(p)))) as WorldState
  const r = (['hard', 'clay', 'grass'] as const).map((s) => ratingOf(kidMatchPlayerFor(w, s, false), s, 'wta'))
  console.log([w.week, kidAgeAt(w, w.week).toFixed(1), r[0], r[1], r[2], Math.round(w.condition)].join('\t'))
}
