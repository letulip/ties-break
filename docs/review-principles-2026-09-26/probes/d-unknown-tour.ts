// Lane D probe (26.09 review, baseline 03d92221) – the August review's "non-terminating match loop on
// malformed data" (docs/review/06-performance-robustness.md:34): does `simulateMatch` with a tour the
// table does not know still run away? Run with a heap cap and a wall-clock kill from the shell:
//   timeout 60 node --max-old-space-size=512 node_modules/vite-node/vite-node.mjs docs/review-principles-2026-09-26/probes/d-unknown-tour.ts
import { simulateMatch } from '../../../src/engine/match/engine'
import type { MatchPlayer, MatchOptions } from '../../../src/engine/match/types'

const p = (id: string): MatchPlayer => ({ id, name: id, serve: 55, ret: 50, composure: 50, stamina: 50, groundstrokes: 52, age: 16 })
for (const tour of ['itf', 'nope']) {
  const res = simulateMatch(p('a'), p('b'), { surface: 'hard', tour, seed: `d-tour-${tour}` } as unknown as MatchOptions)
  const r = res as unknown as { winner?: unknown; sets?: unknown; points?: unknown[] }
  console.log(`tour=${tour} finished winner=${JSON.stringify(r.winner)} points=${Array.isArray(r.points) ? r.points.length : '?'}`)
}
