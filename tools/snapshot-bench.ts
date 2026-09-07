/**
 * SNAPSHOT BENCH – "what does one `toSnapshot` cost, per command kind, on three careers?"
 *
 * WHY IT EXISTS, AND WHY IT EXISTS *FIRST* (Wave A step A1, docs/specs/next-waves-2026-09.md).
 * `toSnapshot` runs after EVERY command – entering an event, changing a plan, buying a racket – and
 * the 05.09 performance review measured it at 13 ms hot / 22-28 ms cold against 6.4 ms for the week
 * tick itself (docs/review-principles-2026-09-05/04-performance.md §B-C, finding P-02). The wave's
 * remedy is a content-keyed memo of the two tables the projection re-derives from scratch on each
 * call; the memo's whole claim is a NUMBER, and before this file there was no instrument in the repo
 * that printed it. A step whose "after" has no "before" is not done.
 *
 * ⚠ IT MEASURES THE WORKER'S REAL LOOP, NOT A MICRO-BENCHMARK OF ONE FUNCTION. `mutate` in
 * `src/worker/sim.worker.ts` does `structuredClone(world)` → run the command → `toSnapshot(candidate)`,
 * and the clone is the reason an identity-keyed cache is worthless here (the wave spec's rejected
 * design 2). So every arm below clones first, exactly as the worker does, and the clone's own cost is
 * reported beside the snapshot's rather than folded into it.
 *
 * THE COMMAND KINDS, and each one is a different question about the cache:
 *   repeat    no command at all, the same world snapshotted again – the ceiling of what a memo can buy
 *   setPlan   `world.plan` rewritten – touches nothing either table reads
 *   setPhysio a boolean – the cheapest possible mutation
 *   buyKit    `setKitGrade` – money and equipment, still nothing either table reads
 *   enterEvent`world.entries` grows – the entry gates move, the ranking does not
 *   tick      `tickWeek` – the week moves and results are appended, so EVERY key legitimately misses.
 *             This arm must NOT get faster; if it does, the key is not reading the ledger.
 *
 * MEASUREMENT ONLY. Imports the engine, reads snapshots, changes nothing on disk.
 *
 * Run:  npm run bench:snapshot
 *       npm run bench:snapshot -- --repeats 40 --fixtures pro
 *       TB_SNAPSHOT_CACHE=off npm run bench:snapshot     # the "before" arm, on the same tree
 *
 * ⚠ THE CONTROL IS THE ENV SWITCH, NOT A WORKTREE (CLAUDE.md: in a shared checkout the control is
 * your commit with your change reverted). `TB_SNAPSHOT_CACHE=off` disables the memo inside
 * `src/engine/world/derivedCache.ts` and leaves everything else on this tree identical, so the two
 * arms differ by the memo and by nothing else – no second checkout, no second build, and no chance
 * of measuring somebody else's commit. The cache reports its own hit/miss counters below, which is
 * the null-arm check CLAUDE.md asks for: an arm that reports zero lookups is not measuring the memo.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { decodeExportFile } from '../src/engine/saveCodec'
import { migrateSave } from '../src/engine/migrations'
import { enterEvent, entryStatus, kitStateOf, setKitGrade, tickWeek, toSnapshot, type WorldState } from '../src/engine/world'
import { planWeek } from '../src/engine/plan'
import { resumeMain } from '../src/engine/rng'
import type { KitGrade } from '../src/shared/protocol'
import { derivedCacheStats, resetDerivedCacheStats, snapshotCacheEnabled } from '../src/engine/world/derivedCache'

const args = process.argv.slice(2)
function flag(name: string, fallback: number): number {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
function text(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}

/** 25 by default. The review's own figures are medians of 50-200; 25 is what fits an iteration loop
 *  and is already far past the JIT's warm-up on every arm measured here. */
const REPEATS = flag('repeats', 25)
const WARMUP = flag('warmup', 20)
const WANTED = text('fixtures', 'junior,pro,golden')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// --- the three careers ---------------------------------------------------------------------------
//
// The same three the 05.09 review profiled: the e2e `junior` (week 120) and `pro` (week 412)
// fixtures, and the golden `v70` save (week 333). They are the deepest careers the repo keeps, they
// are deterministic, and none of them is a personal save.
const E2E_DIR = fileURLToPath(new URL('../e2e/fixtures/', import.meta.url))
const GOLDEN_DIR = fileURLToPath(new URL('../tests/fixtures/saves/', import.meta.url))

async function loadFixture(name: string): Promise<WorldState> {
  if (name === 'golden') return migrateSave(JSON.parse(readFileSync(`${GOLDEN_DIR}v70.json`, 'utf8')))
  return decodeExportFile(new Uint8Array(readFileSync(`${E2E_DIR}${name}.tsave`)))
}

// --- the arms ------------------------------------------------------------------------------------

type Arm = { name: string; run: (world: WorldState) => void }

/** The kit ladder's own order – `KIT_GRADES` in engine/equipment.ts walks the same one. */
const LADDER: KitGrade[] = ['alloy', 'composite', 'performance', 'pro']

/** The commands, spelled the way `sim.worker.ts` spells them. `setPlan` and `setPhysio` write the
 *  field the handler writes; the other three go through the engine function the handler calls, so a
 *  refusal here is a refusal the player would have seen. */
const ARMS: Arm[] = [
  { name: 'repeat', run: () => {} },
  {
    name: 'setPlan',
    run: (w) => {
      const plan = { train: 60, rest: 40 }
      w.plan = { ...plan, week: planWeek(plan) }
    },
  },
  { name: 'setPhysio', run: (w) => { w.physioActive = !w.physioActive } },
  {
    name: 'buyKit',
    run: (w) => {
      // One rung up on the strings, or one rung down when she is already at the top. Every repeat
      // starts from a fresh clone of the same base world, so the move is the same one every time.
      // `setKitGrade` re-validates and charges, which is the point – it is a WALLET command, and the
      // wallet is not something either cached table reads.
      const at = LADDER.indexOf(kitStateOf(w).grade.strings)
      setKitGrade(w, 'strings', LADDER[at + 1] ?? LADDER[Math.max(0, at - 1)]!)
    },
  },
  {
    name: 'enterEvent',
    run: (w) => {
      const open = w.season.find((e) => e.week > w.week && !w.entries.includes(e.id) && entryStatus(w, e).level !== 'blocked')
      if (open) enterEvent(w, open.id)
    },
  },
  {
    name: 'tick',
    run: (w) => {
      // ⚠ THE ARM THAT MUST NOT GET FASTER. The week moves and results are appended, so every
      // content key legitimately misses. A `tick` row that improved with the memo would mean the key
      // is blind to the ledger, which is the one failure mode this wave is bounded by.
      tickWeek(w, resumeMain(w.rngMain))
    },
  },
]

// --- timing ---------------------------------------------------------------------------------------

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[Math.floor(s.length / 2)]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2
}

interface Row {
  fixture: string
  arm: string
  cloneMs: number
  commandMs: number
  coldMs: number
  hotMs: number
  /** why this arm produced no numbers – a career the engine refuses the command on */
  refused?: string
}

function timeArm(fixture: string, base: WorldState, arm: Arm): Row {
  const clones: number[] = []
  const commands: number[] = []
  const snaps: number[] = []
  for (let i = 0; i < REPEATS; i++) {
    const t0 = performance.now()
    const candidate = structuredClone(base)
    const t1 = performance.now()
    // ⚠ A REFUSAL IS A ROW, NOT A CRASH. The golden `v70` career is at college, and the college
    // freeze refuses every command that moves her life – `guardNotEnded`, `src/engine/world/
    // constants.ts`. That is the engine being right, so the arm reports the refusal and the run
    // keeps its other two careers instead of dying on the third.
    try {
      arm.run(candidate)
    } catch (e) {
      return { fixture, arm: arm.name, cloneMs: 0, commandMs: 0, coldMs: 0, hotMs: 0, refused: String((e as Error).message).slice(0, 48) }
    }
    const t2 = performance.now()
    toSnapshot(candidate)
    const t3 = performance.now()
    clones.push(t1 - t0)
    commands.push(t2 - t1)
    snaps.push(t3 - t2)
  }
  return {
    fixture,
    arm: arm.name,
    cloneMs: median(clones),
    commandMs: median(commands),
    coldMs: snaps[0]!,
    hotMs: median(snaps.slice(1)),
  }
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}
function padStart(s: string, n: number): string {
  return s.length >= n ? s : ' '.repeat(n - s.length) + s
}

async function main(): Promise<void> {
  console.log(`snapshot bench – ${REPEATS} repeats per arm, cache ${snapshotCacheEnabled() ? 'ON' : 'OFF'}`)
  console.log('')

  const rows: Row[] = []
  for (const name of WANTED) {
    const base = await loadFixture(name)
    // ⚠ THE WARM-UP IS MEASURED RATHER THAN PICKED, AND IT IS WHAT MAKES THE TABLE COMPARABLE ACROSS
    // ROWS. With one warm-up the FIRST arm read 32.8 ms hot against 21.1 ms for the identical work in
    // the second (`junior`, 25 repeats); with five it still read 30.2 against 18.8. V8 tiers these
    // folds up somewhere inside the first ~30 calls, so with fewer than that the table says something
    // about the ORDER OF THE ROWS rather than about the commands. At 20 the first arm and its
    // neighbours agree. "cold" below is therefore the first call of THIS ARM, never the first in the
    // process – the review's own 22-28 ms cold figure is a different measurement (a fresh worker).
    for (let i = 0; i < WARMUP; i++) toSnapshot(structuredClone(base))
    for (const arm of ARMS) rows.push(timeArm(`${name}@w${base.week}`, base, arm))
  }

  const widths = {
    fixture: Math.max(9, ...rows.map((r) => r.fixture.length)),
    arm: Math.max(7, ...rows.map((r) => r.arm.length)),
  }
  console.log(
    `${pad('fixture', widths.fixture)}  ${pad('command', widths.arm)}  ${padStart('clone', 8)}  ${padStart('cmd', 8)}  ${padStart('snap cold', 10)}  ${padStart('snap hot', 9)}`,
  )
  console.log('-'.repeat(widths.fixture + widths.arm + 45))
  for (const r of rows) {
    const head = `${pad(r.fixture, widths.fixture)}  ${pad(r.arm, widths.arm)}`
    if (r.refused) {
      console.log(`${head}  ${padStart('refused', 8)}  ${r.refused}`)
      continue
    }
    console.log(
      `${head}  ${padStart(r.cloneMs.toFixed(2), 8)}  ${padStart(r.commandMs.toFixed(2), 8)}  ${padStart(r.coldMs.toFixed(2), 10)}  ${padStart(r.hotMs.toFixed(2), 9)}`,
    )
  }
  console.log('')
  console.log('ms, median of the repeats (cold = the first snapshot of the arm). Lower is better.')

  // ⚠ THE NULL-ARM CHECK, PRINTED RATHER THAN ASSUMED (CLAUDE.md: prove the arm contains both the
  // change and its reader). With the cache off these are all zero; with it on, a run that reports no
  // lookups is not measuring the memo whatever the timings say.
  const stats = derivedCacheStats()
  console.log('')
  console.log(
    `cache: ranking ${stats.ranking.hit} hit / ${stats.ranking.miss} miss · preview ${stats.preview.hit} hit / ${stats.preview.miss} miss · rated ${stats.rated.hit} hit / ${stats.rated.miss} miss`,
  )
}

resetDerivedCacheStats()
await main()
