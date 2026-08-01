/**
 * CLONE BENCH – "what does the TB-03 candidate-state commit cost per command?"
 *
 * WHY IT EXISTS. The W1-INTEGRITY-A wave adopts Codex TB-03: every mutating command runs against a
 * candidate world (a structuredClone of the committed one, `rngMain` included), is persisted, and
 * only then replaces the authoritative pair. The proposal's own escape hatch says: *if whole-world
 * cloning proves too expensive, measure structured-clone cost first, then introduce copy-on-write
 * only around proven hot paths*. This tool is that measurement, run BEFORE the decision – the same
 * discipline as tools/load-bench.ts ("the baseline is worthless once the mechanism already exists").
 *
 * WHAT IT MEASURES, per career age (1 / 10 / 20 seasons – 20 is the restore-bench's own ceiling):
 *   clone     structuredClone(world)            – the NEW cost TB-03 adds to every mutation
 *   compress  compressWorld(world)              – the cost every mutation ALREADY pays (autosave:
 *                                                 JSON.stringify + gzip + sha256), i.e. the yardstick
 *   tick      one tickWeek                      – the cheapest command the clone can tax
 *   json      serialized size                   – scale context for the two numbers above
 *
 * The verdict rule, agreed in the wave brief: the clone is affordable if it stays a small fraction
 * of the persistence work the weekly path already does. If clone ~ compress or worse, the
 * copy-on-write fallback note in TB-03 applies instead.
 *
 * MEASUREMENT ONLY. Imports the engine, changes nothing, writes nothing.
 *
 * Run:  npx vite-node tools/clone-bench.ts
 */
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { compressWorld } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const REPS = 30

/** Same construction as tests/sim-worker-rng.test.ts `liveCareer`: draws through
 *  `resumeMain(world.rngMain)`, so the world is exactly what the worker would hold. */
function liveCareer(seed: string, weeks: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

function timedMs(fn: () => unknown): number {
  const t0 = performance.now()
  fn()
  return performance.now() - t0
}

const fmt = (x: number): string => `${x.toFixed(2)} ms`

async function main(): Promise<void> {
  console.log(`clone-bench: structuredClone vs the persistence work each mutation already does (${REPS} reps, median)`)
  for (const seasons of [1, 10, 20]) {
    const weeks = seasons * 52
    const world = liveCareer(`clone-bench-${seasons}`, weeks)
    const json = JSON.stringify(world)

    const clone = median(Array.from({ length: REPS }, () => timedMs(() => structuredClone(world))))
    const compressTimes: number[] = []
    for (let i = 0; i < REPS; i++) {
      const t0 = performance.now()
      await compressWorld(world)
      compressTimes.push(performance.now() - t0)
    }
    const compress = median(compressTimes)
    // one tick on a clone, so the bench world itself stays put across reps
    const tick = median(
      Array.from({ length: REPS }, () => {
        const w = structuredClone(world)
        const rng = resumeMain(w.rngMain)
        return timedMs(() => tickWeek(w, rng))
      }),
    )

    const ratio = ((clone / compress) * 100).toFixed(0)
    console.log(
      `${String(seasons).padStart(2)} seasons (${weeks} wk): clone ${fmt(clone)} | compress(existing) ${fmt(compress)} | one tick ${fmt(tick)} | json ${(json.length / 1024).toFixed(0)} KiB | clone = ${ratio}% of the existing persist cost`,
    )
  }
}

void main()
