/**
 * wall-freeze-probe – THE INERTNESS PROOF for the L1 scaffolding hook (docs/specs/the-wall-2026-08.md §3).
 *
 * The wall spec's scaffolding exception allows the measurement worktree to add the smallest possible
 * hook at the kid's composition point, and it MUST prove the default inert two ways. This file is the
 * second way: one full 208-week career, canonically serialised, byte-identical against the base
 * commit's run. (The first way is the frozen MAIN capture in tests/condition.test.ts re-deriving.)
 *
 * ⚠ THIS FILE DELIBERATELY NEVER IMPORTS THE HOOK. It has to produce the identical program at the
 * base commit (where the hook does not exist) and at the measurement commit (where it does, at its
 * inert default) – so it only touches the public career loop the benches already share. Run it at
 * both revisions and diff the output; the diff IS the verdict.
 *
 *   npx vite-node tools/wall-freeze-probe.ts            # both careers, ~30s
 *
 * What is hashed: `sha256(JSON.stringify(world))` – the exact serialisation `compressWorld`
 * (src/engine/saveCodec.ts) feeds gzip, so "byte-identical here" is "byte-identical in a save".
 * Checkpoints every 52 weeks catch a divergence early instead of reporting one bit at the end.
 *
 * Two careers, chosen so BOTH branches of the hook's read are exercised at their default:
 *   - bench-working-0 · self-coached  (the hook reads the 'self' entry)
 *   - bench-middle-0  · middle coach  (the hook reads a hired tier's entry)
 * Both under the `player` policy – the arm every wall measurement runs.
 */
import { createHash } from 'node:crypto'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

const WEEKS = 208 // 14 -> 18, the spec's "one full 208-week career"

function sha(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

function runOne(presetIndex: number): void {
  const preset = PRESETS[presetIndex]
  const { world, rng, seed } = openCareer(preset, 0, POLICIES[1])
  console.log(`\n${preset.label}   seed ${seed}   policy ${POLICIES[1].id}`)
  for (let w = 1; w <= WEEKS; w++) {
    stepCareerWeek(world, rng, POLICIES[1])
    if (w % 52 === 0) {
      console.log(`  week ${String(w).padStart(3)}  sha256 ${sha(JSON.stringify(world))}`)
    }
  }
  console.log(`  final    week ${world.week}  funds ${world.fundsCents}  rngMain n=${world.rngMain.n}`)
  console.log(`  final    sha256 ${sha(JSON.stringify(world))}`)
}

runOne(0) // 8k · working · self-coached
runOne(5) // 25k · middle · middle coach
