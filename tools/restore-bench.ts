/**
 * RESTORE BENCH – "what does loading a career cost, before and after v35?"
 *
 * WHY IT EXISTS. P3 (rng-persistence) retires the load-time RNG replay: until v35 every load of
 * every career ran one full `tickWeek` per elapsed week – AI brackets, ranking recompute, the lot –
 * just to advance one 32-bit register to the right position, so the bill grew linearly with career
 * length in a game whose pitch is a decade-plus career. v35 persists the position (`rngMain`) and a
 * load VERIFIES AND RESUMES in O(1). This bench is the receipt: the acceptance line is "a restore
 * step measured < 5 ms against ~1.5 ms/week before", and a claim like that gets measured on the
 * branch that makes it, not asserted from the proposal's memory.
 *
 * WHAT IT MEASURES, per synthetic career length (5 / 10 / 20 seasons, deterministic seeds):
 *   old per-load   the replay every single load used to pay (`replayMainState`, byte-identical to
 *                  the retired worker restore) – O(weeks), for ever;
 *   migration      the v34 -> v35 stamp: the SAME replay, paid ONCE per career at first load after
 *                  the update (a JSON clone of the career, rngMain stripped, schema set to 34, fed
 *                  to the real `migrateSave`);
 *   new per-load   what every load pays from then on: `migrateSave` passthrough + the verifier
 *                  (`mainStateConsistent` + the `maxMainDraws` bound) – O(1).
 *
 * ⚠ AND THE BENCH CHECKS THE ANSWER, NOT JUST THE STOPWATCH: the migration's stamped `{s, n}` must
 * equal the live pair the career actually carries – on a no-action career the probe replay and the
 * lived history are the same walk, so a mismatch here means the replay drifted, and a bench that
 * timed a wrong answer fast would be worse than no bench at all.
 *
 * THE REAL-WORLD CASE. `--save <path>` feeds an exported .tsave through the real import codec:
 * once as it is on disk (a pre-v35 file pays its one-time migration replay here), then re-encoded
 * and loaded again as a v35 file (the O(1) steady state). Pass the path at run time; nothing about
 * the file is read into the repo.
 *
 * DETERMINISTIC where it matters: seeds are fixed, careers are built by the engine's own tick, and
 * no Date.now touches simulation state – performance.now is wall-clock instrumentation only.
 *
 * Run:  npx vite-node tools/restore-bench.ts
 *       npx vite-node tools/restore-bench.ts -- --save ~/Downloads/tennis-sim_seed_w193.tsave
 */
import { readFileSync } from 'node:fs'
import { createWorld, tickWeek, replayMainState, maxMainDraws, type WorldState } from '../src/engine/world'
import { resumeMain, mainStateConsistent } from '../src/engine/rng'
import { migrateSave } from '../src/engine/migrations'
import { decodeExportFile, encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

const args = process.argv.slice(2)
function strFlag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : undefined
}

const REPS = 3
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const ms = (x: number): string => `${x.toFixed(x < 10 ? 2 : 1)} ms`

function timed<T>(fn: () => T): { out: T; ms: number } {
  const t0 = performance.now()
  const out = fn()
  return { out, ms: performance.now() - t0 }
}

/** A career the worker's own way: no entries, draws through the persisted pair. */
function buildCareer(seed: string, weeks: number): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return world
}

/** The career as a v34 save would carry it: no rngMain, old schema number. */
function asV34(world: WorldState): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
  delete clone.rngMain
  clone.schemaVersion = 34
  return clone
}

function benchSynthetic(seasons: number): void {
  const weeks = seasons * 52
  const world = buildCareer(`restore-bench-${seasons}s`, weeks)

  // OLD per-load: the replay the retired worker restore ran on every single load.
  const oldLoad = median(
    Array.from({ length: REPS }, () => timed(() => replayMainState(world.seed, world.profile, world.week)).ms),
  )

  // MIGRATION (once per career): the same replay inside the real v34 block. Fresh clone per rep –
  // migrateSave stamps in place and a second pass would time the no-op instead.
  const stamped: WorldState[] = []
  const migration = median(
    Array.from({ length: REPS }, () => {
      const t = timed(() => migrateSave(asV34(world)))
      stamped.push(t.out as WorldState)
      return t.ms
    }),
  )
  // The correctness half: the stamped position must BE the position the career lived.
  for (const s of stamped) {
    if (s.rngMain.s !== world.rngMain.s || s.rngMain.n !== world.rngMain.n) {
      throw new Error(
        `${seasons}s: migration stamped {s:${s.rngMain.s}, n:${s.rngMain.n}} but the career lived {s:${world.rngMain.s}, n:${world.rngMain.n}} – the replay has drifted`,
      )
    }
  }

  // NEW per-load: migrate passthrough + the verifier. O(1) whatever `weeks` is.
  const v35 = JSON.parse(JSON.stringify(world)) as Record<string, unknown>
  const newLoad = median(
    Array.from({ length: REPS }, () => {
      const clone = JSON.parse(JSON.stringify(v35))
      return timed(() => {
        const m = migrateSave(clone)
        if (!mainStateConsistent(m.seed, m.rngMain) || m.rngMain.n > maxMainDraws(m.week, m.cohort.length)) {
          throw new Error('verify failed on a clean save')
        }
      }).ms
    }),
  )

  const verdict = newLoad < 5 ? 'PASS (< 5 ms)' : 'FAIL (>= 5 ms)'
  console.log(
    `${String(seasons).padStart(2)} seasons (${weeks} weeks): old per-load ${ms(oldLoad)} | migration once ${ms(migration)} | new per-load ${ms(newLoad)} ${verdict}`,
  )
}

async function timedAsync<T>(fn: () => Promise<T>): Promise<{ out: T; ms: number }> {
  const t0 = performance.now()
  const out = await fn()
  return { out, ms: performance.now() - t0 }
}

async function benchRealSave(path: string): Promise<void> {
  const bytes = new Uint8Array(readFileSync(path))
  const fileSchema = new DataView(bytes.buffer, bytes.byteOffset).getUint32(8)

  // As it sits on disk: a pre-v35 file pays its one-time migration replay inside decode.
  const first = await timedAsync(() => decodeExportFile(new Uint8Array(bytes)))
  const world = first.out

  // Steady state: re-encode the migrated world (now v35, rngMain aboard) and load it again.
  const reEncoded = await encodeExportFile(world)
  const steadyRuns: number[] = []
  let reloaded = world
  for (let i = 0; i < REPS; i++) {
    const run = await timedAsync(() => decodeExportFile(new Uint8Array(reEncoded)))
    reloaded = run.out
    steadyRuns.push(run.ms)
  }
  const steadyMs = median(steadyRuns)
  if (!mainStateConsistent(reloaded.seed, reloaded.rngMain)) throw new Error('real save: verify failed after re-encode')

  console.log(
    `real save (${path.split('/').pop()}): file schema v${fileSchema}, week ${world.week}, seed "${world.seed}"`,
  )
  console.log(
    `  first load incl. one-time v${fileSchema}->v35 migration: ${ms(first.ms)} | steady-state v35 load: ${ms(steadyMs)} | rngMain {s:${reloaded.rngMain.s}, n:${reloaded.rngMain.n}}`,
  )
}

async function main(): Promise<void> {
  console.log('restore-bench – load cost before/after v35 (rng-persistence)')
  for (const seasons of [5, 10, 20]) benchSynthetic(seasons)
  const save = strFlag('save')
  if (save) await benchRealSave(save)
  else console.log('(pass --save <path.tsave> to time a real exported career through the import codec)')
}

void main()
