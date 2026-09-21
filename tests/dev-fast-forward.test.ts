import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  pendingKnock,
  pendingBirthday,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  shootClashOpen,
  decideKnock,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { workerHarness } from './helpers/workerHarness'
import { region } from './helpers/source'

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

  // ⚠ RE-AIMED AT W2-ENDINGS, and WIDENED rather than relaxed. The pin used to name the two
  // predicates literally (`world.pendingTournament || pendingKnock(world)`) in both positions. Since
  // v39 there are FIVE things the raw loop must not outrun - the two above plus the terminal latch,
  // the unanswered fork at nineteen and the natural end's open offer - so the worker folds them into
  // one `decisionOpen` predicate used in both positions, which is the only way the two can be kept
  // in step. The pin now asserts THAT: every one of the five is named, and the same function guards
  // entry and the loop. Layer 2 below still drives the real worker, which is what the header means
  // by "a guard whose only witness is a regex is a guard a refactor can silently drop".
  it("the worker's tick case refuses at entry and stops mid-loop, on every predicate advanceWeeks blocks on", () => {
    expect(worker).toMatch(/import \{[\s\S]*?pendingKnock,[\s\S]*?\} from '\.\.\/engine\/world'/)
    const tickCase = region(worker, "case 'tick':", "case 'advance':")
    // the predicate names every one, so nothing the engine blocks on can be missing from the loop
    // ⚠ WIDENED AT v48, NOT WEAKENED: the birthday is the sixth thing `advanceWeeks` refuses to tick
    // past, and the dev fast-forward ships in every build – so a `▶▶ 52` that outran it would carry a
    // year of her life past the one popup the owner asked to fire ALWAYS, with nobody answering it.
    // That is the exact hole this list exists to close, one member wider.
    // ⚠ WIDENED AGAIN AT v85 (T11b), AND THAT ONE WAS A REAL HOLE RATHER THAN A NEW MEMBER: a
    // BLOCKING LIFE BEAT has stopped both supervised paths since v73 (`advanceRefusal` returns
    // `'life'`, `advanceWeeks` adds the `'life'` stop) and was missing from this list the whole time,
    // so `▶▶ 52 (dev)` could tick a year past her card with nobody answering her. The layer-2 case
    // below is what MEASURES it – a source pin would have been green on the day the hole existed,
    // because there was nothing to read.
    expect(tickCase).toContain('w.pendingTournament !== null')
    expect(tickCase).toContain('pendingKnock(w)')
    expect(tickCase).toContain('pendingBirthday(w) !== null')
    expect(tickCase).toContain('pendingLifeBeat(w) !== null')
    expect(tickCase).toContain('w.ending !== null')
    expect(tickCase).toContain('w.fork !== null && w.fork.answer === null')
    expect(tickCase).toContain('w.retirementOffer !== null')
    // entry: a refusal, the typed error every handler uses
    expect(tickCase).toMatch(/if \(decisionOpen\(world\)\) \{\s*\n\s*throw new Error\(/)
    // mid-loop: a stop, on the SAME predicate
    expect(tickCase).toMatch(/if \(decisionOpen\(world\)\) break/)
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

/** The committed revision as of the last ok reply — what a real client tracks off responses and
 *  hands back as `baseRevision`. The guard tests below MUST send a live one: a stale value would
 *  be refused as STALE_REVISION before the tick guard even runs, and the suite would then be
 *  pinning the wrong refusal.
 *
 *  ⚠ THIS IS THE ONE THING THIS SUITE'S HARNESS DOES THAT THE OTHER THREE DO NOT, which is why
 *  tests/helpers/workerHarness.ts takes an `onReply` hook rather than flattening the four copies
 *  into one. The latch runs on every reply, before the waiter, exactly where it ran locally. */
let lastRevision = 0
// ⚠ TOP LEVEL, AND IT MUST STAY TOP LEVEL: the factory assigns `globalThis.self`, and the worker
// module reads it while evaluating – which is why the import of it below is dynamic.
const { send, workerGlobal } = workerHarness<Reply>((r) => {
  if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
})

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

/**
 * ⭐⭐⭐ v85 T11b – A WORLD STOPPED ON A BLOCKING LIFE BEAT AND ON **NOTHING ELSE**, which is the
 * whole of what makes the case below a measurement rather than a formality.
 *
 * ⚠⚠ THE SEVEN NEGATIVE ASSERTIONS ARE THE NET, NOT SCAFFOLDING. `decisionOpen` is one OR over seven
 * predicates, so a fixture holding a knock or a birthday alongside her card would refuse the tick
 * with the life-beat clause DELETED and the case would pass against the hole it exists to close. The
 * walk therefore parks on a week where her row is the only true member – and the assertions say so,
 * so a future engine change that starts raising something else on this seed fails HERE, naming the
 * member, instead of quietly hollowing out the case one file down.
 *
 * ⚠ IT IS A `'met'` ARRIVAL AND DELIBERATELY NOT THE FORK'S OWN ROW. `'fork-opinion'` is raised BY
 * the tick that opens the fork at nineteen (world/multiWeek.ts' own note: «both are live on the same
 * week by construction»), so a career walked to it holds `world.fork` unanswered too – which is the
 * fifth member of the predicate and would arm the case the wrong way. An arrival is blocking, sticky
 * (`answer: null` forever) and lands years before the fork.
 *
 * ⚠ THE KNOCK IS ANSWERED ON THE WAY RATHER THAN WALKED AROUND, through the engine's own command: a
 * knock is sticky too, so a walk that met one before her card would never reach a clean week. `'rest'`
 * is the answer e2e/journey.ts and tools/_knocks.ts both press – one branch, everywhere.
 *
 * The seed is the second of a deterministic enumeration (`devff-life-0…`); 0 and 1 were rejected by
 * the predicate above, and this one parks on week 144. Same arrangement as `pendingKnockWorld`.
 */
function pendingLifeBeatWorld(): WorldState {
  const world = createWorld('devff-life-2', { ...DEFAULT_PROFILE })
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 208 && pendingLifeBeat(world) === null; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    tickWeek(world, rng)
  }
  expect(pendingLifeBeat(world), 'the walk must end on an unanswered blocking beat').not.toBeNull()
  expect(pendingKnock(world), 'and on NO knock – see the note above').toBe(false)
  expect(world.pendingTournament, 'and on no tournament reveal').toBeNull()
  expect(pendingBirthday(world), 'and on no unanswered birthday').toBeNull()
  expect(world.fork, 'and on no open fork').toBeNull()
  expect(world.retirementOffer, 'and on no retirement offer').toBeNull()
  expect(world.ending, 'and on no ending').toBeNull()
  expect(shootClashOpen(world), 'and on no shoot/tournament collision').toBe(false)
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

  // ⭐⭐⭐ v85 T11b – AND A LIFE BEAT SHE HAS NOT BEEN ANSWERED ON, which is the member this list was
  // MISSING rather than the one it grew. The layer-1 pin above could not have caught it: a source pin
  // reads what is written, and until this commit there was nothing to read.
  //
  // ⚠ 52 WEEKS ASKED FOR AND ZERO TAKEN, WHICH IS THE POINT AND NOT A ROUND NUMBER. `▶▶ 52 (dev)`
  // sends exactly this message, and what the hole meant for a player is that one press ticked a year
  // of her life past her own card – answering her by walking away, in a build that ships to the owner
  // as his playtest device (his 01.08 ruling, in this file's header).
  it('an unanswered life beat refuses the tick and holds the week', async () => {
    const world = pendingLifeBeatWorld()
    // Read off the ENGINE before the world leaves for the worker: `answerLifeBeat` refuses an option
    // that was never on this row's card (`pendingLifeBeatOptions` is the one road to the priced set),
    // so the id has to be the row's own rather than a transcribed word.
    const herAnswer = pendingLifeBeatOptions(world)![0].id
    const week = await loadIntoWorker(world)

    const refusal = await send({ type: 'tick', weeks: 52, baseRevision: lastRevision })
    expect(refusal.ok).toBe(false)
    expect(refusal.error).toContain('resolve the tournament or knock')

    // ...and the world behind the refusal did not move: the next advance re-reports the SAME stop at
    // the SAME week. `'life'` is `advanceWeeks`' own name for it, so this line is also the assertion
    // that the raw loop and the supervised path are now refusing on the same state.
    const after = await send({ type: 'advance', weeks: 1, baseRevision: lastRevision })
    expect(after.ok).toBe(true)
    expect(after.snapshot!.week).toBe(week)
    expect(after.snapshot!.stopReasons).toContain('life')

    // ...and the refusal is HER card's, not the command's – the knock case's own closing half, and it
    // is what keeps this guard from being read as «tick is broken». The moment she is answered, the
    // same 52-week press is allowed in and really does move time.
    const answered = await send({ type: 'answerLifeBeat', optionId: herAnswer, baseRevision: lastRevision })
    expect(answered.ok, answered.error).toBe(true)
    const ticked = await send({ type: 'tick', weeks: 1, baseRevision: lastRevision })
    expect(ticked.ok, ticked.error).toBe(true)
    expect(ticked.snapshot!.week).toBe(week + 1)
  }, 60_000)
})
