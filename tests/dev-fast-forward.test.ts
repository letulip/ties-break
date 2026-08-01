import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  pendingKnock,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type ToWorker } from '../src/shared/protocol'

// =================================================================================================
// P6 (c) — THE DEV FAST-FORWARD CANNOT OUTRUN A DECISION, in two layers.
//
// The `▶▶ 52 (dev)` button used to ship in production AND bypass the engine's blocking contract:
// the worker's raw `tick` loop skipped `advanceWeeks`' guards, so with a reveal open tickWeek kept
// running — skipping recomputeRankAndMilestones/housekeep/maybeFireSeasonWrapUp every subsequent
// week and able to overwrite the unresolved reveal with a fresh computeShadowTournament. The exact
// "weeks just got skipped" failure the W4 knock slice exists to prevent.
//
// ⚠ RE-AIMED THE SAME DAY IT LANDED, by the owner (01.08): «у нас не прод и нет игроков. Если
// нужна для разработки - можно вернуть». The v-if layer is GONE - the deployed build is the
// owner's own playtest device and the button is his tool, so hiding it there took the tool from
// the only person it was built for. What this suite still pins, and harder than before:
//   * the BUTTON EXISTS UNGATED - so a future hand re-reading P6 cannot silently re-hide it
//     without meeting this test and the ruling in its comment (when the game has players who are
//     not the owner, that is the moment the one-line v-if returns, deliberately);
//   * the WORKER GUARD - the half that ever protected a save - is untouched: no caller of the raw
//     `tick` command, button or not, can tick through an open knock or an unrevealed tournament.
// Source pins hold the visibility ruling; a real worker round-trip holds the guard, because a
// guard whose only witness is a regex is a guard a refactor can silently drop.
// =================================================================================================

describe('layer 1 — the source carries the ruling and the guard', () => {
  const more = readFileSync(new URL('../src/components/screens/MoreScreen.vue', import.meta.url), 'utf8')
  const worker = readFileSync(new URL('../src/worker/sim.worker.ts', import.meta.url), 'utf8')

  it('the ▶▶ button ships UNGATED — the owner ruling, not an accident', () => {
    const button = more.split('\n').find((l) => l.includes('▶▶ 52 (dev)'))
    expect(button, 'the fast-forward button exists').toBeDefined()
    expect(button, 'no build gate on the button - see the ruling in the component comment').not.toContain('v-if')
    expect(more, 'the dead flag went with the gate').not.toContain('const isDev')
  })

  it("the worker's tick case refuses at entry and stops mid-loop, on the same two predicates advanceWeeks blocks on", () => {
    expect(worker).toMatch(/import \{[\s\S]*?pendingKnock,[\s\S]*?\} from '\.\.\/engine\/world'/)
    const tickCase = worker.slice(worker.indexOf("case 'tick':"), worker.indexOf("case 'advance':"))
    // entry: a refusal, the typed error every handler uses
    expect(tickCase).toContain('world.pendingTournament || pendingKnock(world)')
    expect(tickCase).toMatch(/if \(world\.pendingTournament \|\| pendingKnock\(world\)\) \{\s*\n\s*throw new Error\(/)
    // mid-loop: a stop before the tick that would run through the decision
    expect(tickCase).toMatch(/if \(world\.pendingTournament \|\| pendingKnock\(world\)\) break/)
  })
})

// =================================================================================================
// layer 2 — the worker itself, driven over its own protocol.
//
// The worker module is written for a Worker global (`self.onmessage` / `self.postMessage`), so the
// test provides that global BEFORE importing it — the import is dynamic for exactly that reason —
// and IndexedDB comes from fake-indexeddb (the saves suite's own arrangement). The pending worlds
// are built with the ENGINE here in the test, exported through the real save codec, and handed to
// the worker over `importSave`: every byte the worker sees travelled the same path a player's file
// would.
// =================================================================================================

interface Reply {
  id: number
  ok: boolean
  error?: string
  snapshot?: { week: number; stopReasons?: string[] }
  /** W1-INTEGRITY-A: every ok reply carries the committed revision; mutations must send it back */
  revision?: number
}

const waiters = new Map<number, (r: Reply) => void>()
/** The committed revision as of the last ok reply — what a real client tracks off responses and
 *  hands back as `baseRevision`. The guard tests below MUST send a live one: a stale value would
 *  be refused as STALE_REVISION before the tick guard even runs, and the suite would then be
 *  pinning the wrong refusal. */
let lastRevision = 0
const workerGlobal = {
  onmessage: null as null | ((e: { data: ToWorker }) => void),
  postMessage(m: unknown) {
    const r = m as Reply
    if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
    waiters.get(r.id)?.(r)
    waiters.delete(r.id)
  },
}
// Must exist before the worker module evaluates (it assigns self.onmessage at top level).
;(globalThis as unknown as { self: unknown }).self = workerGlobal

/** Omit that DISTRIBUTES over a union: plain Omit<ToWorker, 'id'> collapses the message union to
 *  its common keys ({ id, type }) and rejects every payload field. */
type WorkerMsg<T = ToWorker> = T extends { id: number } ? Omit<T, 'id'> : never

let nextId = 1
function send(msg: WorkerMsg): Promise<Reply> {
  return new Promise((resolve) => {
    const id = nextId++
    waiters.set(id, resolve)
    workerGlobal.onmessage!({ data: { ...msg, id } as ToWorker })
  })
}

/** A world stopped ON an open reveal: enter the nearest enterable event, walk to its week. */
function pendingTournamentWorld(): WorldState {
  const world = createWorld('devff-reveal', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let guard = 0; guard < 104 && !world.pendingTournament; guard++) {
    const e = world.season.find(
      (ev) => ev.week > world.week && !world.entries.includes(ev.id) && entryStatus(world, ev).level !== 'blocked',
    )
    if (e) {
      try {
        enterEvent(world, e.id)
      } catch {
        // a deadline can pass between the check and the entry; the next week offers another event
      }
    }
    tickWeek(world, rng)
  }
  expect(world.pendingTournament, 'the walk must end on an open reveal').not.toBeNull()
  return world
}

/** A world stopped ON an unanswered knock. Seed and plan are knock.test.ts's own fixture
 *  (`playAnswering('bench-working-0', 52, ...)` asserts knocks arrive inside one season there),
 *  so the walk below is bounded and deterministic. */
function pendingKnockWorld(): WorldState {
  const world = createWorld('bench-working-0', { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 208 && !pendingKnock(world); i++) tickWeek(world, rng)
  expect(pendingKnock(world), 'the walk must end on an unanswered knock').toBe(true)
  return world
}

async function loadIntoWorker(world: WorldState): Promise<number> {
  const bytes = (await encodeExportFile(world)).slice()
  const res = await send({ type: 'importSave', bytes: bytes.buffer as ArrayBuffer })
  expect(res.ok, res.error).toBe(true)
  return res.snapshot!.week
}

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
})

describe('layer 2 — a pending decision makes tick throw, and the world does not move', () => {
  it('an open tournament reveal refuses the tick and holds the week', async () => {
    const week = await loadIntoWorker(pendingTournamentWorld())

    const refusal = await send({ type: 'tick', weeks: 52, baseRevision: lastRevision })
    expect(refusal.ok).toBe(false)
    expect(refusal.error).toContain('resolve the tournament or knock')

    // ...and the world behind the refusal is exactly where it was: the next advance re-reports the
    // SAME stop at the SAME week instead of having silently ticked past it. (Same baseRevision on
    // purpose: a refused command commits nothing, so the revision did not move either.)
    const after = await send({ type: 'advance', weeks: 1, baseRevision: lastRevision })
    expect(after.ok).toBe(true)
    expect(after.snapshot!.week).toBe(week)
    expect(after.snapshot!.stopReasons).toContain('tournament')
  }, 60_000)

  it('an unanswered knock refuses the tick and holds the week', async () => {
    const week = await loadIntoWorker(pendingKnockWorld())

    const refusal = await send({ type: 'tick', weeks: 1, baseRevision: lastRevision })
    expect(refusal.ok).toBe(false)
    expect(refusal.error).toContain('resolve the tournament or knock')

    const after = await send({ type: 'advance', weeks: 1, baseRevision: lastRevision })
    expect(after.ok).toBe(true)
    expect(after.snapshot!.week).toBe(week)
    expect(after.snapshot!.stopReasons).toContain('knock')

    // ...and the refusal is the DECISION's, not the command's: the moment the knock is answered,
    // the same tick goes through. This is what keeps the guard from being read as "tick is broken".
    const decided = await send({ type: 'decideKnock', choice: 'rest', baseRevision: lastRevision })
    expect(decided.ok).toBe(true)
    const ticked = await send({ type: 'tick', weeks: 1, baseRevision: lastRevision })
    expect(ticked.ok, ticked.error).toBe(true)
    expect(ticked.snapshot!.week).toBe(week + 1)
  }, 60_000)
})
