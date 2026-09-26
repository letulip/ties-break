/**
 * Lane G probe (principles review 26.09, baseline 03d92221) – COUNTS ONLY, no timing.
 *
 * ⚠ RUNS ONLY AGAINST AN INSTRUMENTED SCRATCH WORKTREE, never against tb-review or the product.
 * Question: on the first `toSnapshot` after a week advance, how many far-preview memo misses
 * (src/engine/world/snapshot.ts:530) compute the W-week exclusion set (`wtaExclusionFor` →
 * `weekFieldExclusion`, src/engine/season/tournament.ts:761) that a far card never reads
 * (`firstRoundDraw` returns null past DRAW_LEAD_WEEKS, src/engine/season/preview.ts:655)?
 *
 * Reproduce:
 *   git -C tb-review worktree add --detach ../tb-review-G 03d92221
 *   ln -s ../tb-review/node_modules tb-review-G/node_modules
 *   apply the two one-line counters below (a `globalThis.__wx` tally; nothing else changes):
 *     src/engine/season/tournament.ts, in weekFieldExclusion just before `for (const e of above) {`:
 *       { const g = globalThis as { __wx?: Record<string, number> }; if (g.__wx) { const far = (new Error().stack ?? '').includes('memoise'); const k = far ? 'far' : 'other'; g.__wx[k + 'Calls'] = (g.__wx[k + 'Calls'] ?? 0) + 1; g.__wx[k + 'SelectEntrants'] = (g.__wx[k + 'SelectEntrants'] ?? 0) + above.length } }
 *     src/engine/world/snapshot.ts, first line inside `memoise('preview', key, () => {`:
 *       { const g = globalThis as { __wx?: Record<string, number> }; if (g.__wx) g.__wx.farMisses = (g.__wx.farMisses ?? 0) + 1 }
 *   copy this file to tb-review-G/docs/review-principles-2026-09-26/probes/ and run from tb-review-G:
 *     npx vite-node docs/review-principles-2026-09-26/probes/wx-count.ts
 *   then `git -C tb-review worktree remove --force ../tb-review-G`.
 * The run of 26.09 is RAW/G/wx-count.log (X_EXIT=0); the patch is RAW/G/wx-instrument.patch.
 */
import { PRESETS, POLICIES, openCareer, stepCareerWeek } from '../../../tools/econ-bench'
import { drainLifeBeats } from '../../../tools/_lifeBeats'
import { answerBirthdayNeutral } from '../../../tools/_birthday'
import { answerFork, answerRetirement, pendingBirthday, toSnapshot, type WorldState } from '../../../src/engine/world'
const PLAYER = POLICIES[1]
function resolveOpen(world: WorldState): void {
  if (world.ending !== null) return
  drainLifeBeats(world)
  if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
}
const g = globalThis as { __wx?: Record<string, number> }
for (const [preset, idx] of [[5, 0], [2, 0], [7, 0]] as const) {
  const opened = openCareer(PRESETS[preset], idx, PLAYER)
  const world = opened.world
  const out: string[] = []
  for (let w = 0; w < 2600 && world.ending === null; w++) {
    stepCareerWeek(world, opened.rng, PLAYER)
    resolveOpen(world)
    if (![100, 200, 300, 400, 600, 800, 1000, 1200].includes(world.week)) continue
    g.__wx = {}
    const s = toSnapshot(world)
    const a = g.__wx
    g.__wx = {}
    toSnapshot(structuredClone(world))
    const b = g.__wx
    g.__wx = undefined
    const wCards = s.upcoming.length
    out.push(`w${world.week}: upcoming ${wCards}, farMisses ${a.farMisses ?? 0}, exclusion calls far/other ${a.farCalls ?? 0}/${a.otherCalls ?? 0}, selectEntrants far/other ${a.farSelectEntrants ?? 0}/${a.otherSelectEntrants ?? 0} | same-week next: far ${b.farCalls ?? 0}/${b.farSelectEntrants ?? 0} other ${b.otherCalls ?? 0}/${b.otherSelectEntrants ?? 0}`)
  }
  console.log(`== ${opened.seed}`)
  console.log(out.join('\n'))
}
