import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  ADVANCE_REFUSALS,
  advanceWeeks,
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  openQuestions,
  pendingKnock,
  pendingBirthday,
  pendingLifeBeat,
  pendingLifeBeatOptions,
  shootClashOpen,
  decideKnock,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed, resumeMain } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
import { ECONOMY } from '../src/engine/economy'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type StopReason } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'
import { drainLifeBeats } from './helpers/career'
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

  // ⚠⚠ RE-AIMED 26.09 (A-01 = D-03) AND IT IS THE WHOLE POINT OF THAT TASK. This case used to assert
  // SEVEN `toContain` spellings of the worker's own copy of the blocking list – «every predicate
  // advanceWeeks blocks on», in its own title – and the list has held EIGHT since round 29 #3. It
  // never named `shootClashOpen(w)`, so replacing that clause with `false` in the worker left this
  // file 5 passed: measured three times in the principles review and a fourth time immediately before
  // the fix. A pin that reads a copy character by character is exactly as complete as whoever wrote
  // it, and it cannot notice the member it never learned about.
  //
  // What replaces it is ONE pin plus behaviour. The pin: the tick case ASKS `advanceRefusal`, the
  // engine's own refusal, and keeps no clause of its own – so there is no copy left to fall behind.
  // The behaviour: layer 2 below drives the real worker over every member of `ADVANCE_REFUSALS`, and
  // the mutation that proves those cases lives in the OWNER (`openQuestions`, engine/world/
  // multiWeek.ts) rather than in a spelling here – drop a clause there and the case for that member
  // goes red, which is the thing the seven spellings could not do.
  //
  // ⚠ NOTHING WAS WEAKENED. The two positions are still pinned as one function (`decisionOpen` at
  // entry AND mid-loop), the negative below is NEW – no clause of the old copy may come back – and
  // the eight members are now covered by cases rather than by a transcription.
  it("the worker's tick case asks the engine which questions stop time, and keeps no copy of the list", () => {
    expect(worker).toMatch(/import \{[\s\S]*?advanceRefusal,[\s\S]*?\} from '\.\.\/engine\/world'/)
    const tickCase = region(worker, "case 'tick':", "case 'advance':")
    // THE ONE PIN: the predicate is the engine's, asked, and it is one line.
    expect(tickCase).toContain('const decisionOpen = (w: WorldState): boolean => advanceRefusal(w) !== null')
    // ...and NOT ONE CLAUSE OF THE COPY CAME BACK. Comments stripped first: this file's own note
    // above names `shootClashOpen(w)` and the worker's note names the four imports it dropped, so a
    // scan over raw source would fire on the prose explaining the rule (worker-reply-correlation's
    // own idiom, same reason).
    const code = tickCase
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n')
    for (const clause of [
      'w.pendingTournament',
      'pendingKnock(',
      'pendingBirthday(',
      'pendingLifeBeat(',
      'w.ending',
      'w.fork',
      'w.retirementOffer',
      'shootClashOpen(',
    ]) {
      expect(code, `the tick case re-asks '${clause}' instead of the engine`).not.toContain(clause)
    }
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

// =================================================================================================
// ⭐⭐⭐ layer 2b (A-01 = D-03, 26.09) – THE FIVE MEMBERS NOBODY HAD EVER DRIVEN THROUGH THE WORKER
// =================================================================================================
//
// The three cases above drive a reveal, a knock and her card. `ADVANCE_REFUSALS` holds EIGHT, and the
// other five – the birthday, the fork, the retirement offer, the terminal latch and the shoot/
// tournament collision – were covered by nothing but seven `toContain` spellings of the worker's own
// copy of the list, one of which (the collision) was never written. That is why deleting the clash
// clause from the worker left this file 5 passed, three times in the review and once more before the
// fix: nothing in the repository sent a `tick` to a world holding a clash.
//
// ⚠⚠ EVERY FIXTURE HOLDS EXACTLY ONE OPEN QUESTION, and the `openQuestions(world)` precondition in
// each builder says so. This is the whole difference between a net and a formality: `decisionOpen` is
// now ONE call into an eight-clause owner, so a fixture holding a knock alongside the member under
// test would refuse the tick with that member's clause DELETED, and the case would pass against the
// hole it exists to close. The life-beat fixture above makes the same argument in seven negatives;
// this says it in one line by asking the owner itself.
//
// ⚠ BUILT THE CHEAPEST HONEST WAY, which is `tests/r2-13-advance-span.test.ts`' refusal table's own
// rule: the point is that the EIGHT are the eight, not how each one is reached. Three of these five
// write the pending record directly – there is no second boolean to set – and every one of them then
// travels the real save codec into the real worker, which is what layer 2 is for.
//
// ⚠ THE CLASH FIXTURE IS A FOURTH COPY OF `clashWorld` AND W5's T5.11 IS WHERE IT STOPS BEING ONE
// (`tests/helpers/scenarios/`, the principles plan §7). Left local and named here rather than
// half-extracted in a wave that owns neither file.

/** A career with an empty calendar, walked `weeks` weeks with nothing left standing. `season = []` is
 *  `quietCareer`'s own move (r2-13) and for its reason: a case about one refusal must not also be a
 *  case about the tournament desk. */
function quietWalk(seed: string, weeks: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  world.season = []
  // ⚠ `resumeMain` AND NOT `rngFromSeed`, which is r2-13's own note: the persisted position only moves
  // when the draws go through the pair on the world, and this world is about to be ENCODED and read
  // back by the real worker, whose `ensureMainState` compares the two.
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    drainLifeBeats(world)
    tickWeek(world, rng)
  }
  if (pendingKnock(world)) decideKnock(world, 'rest')
  drainLifeBeats(world)
  return world
}

/** ONE SIGNED CAMPAIGN NAMING `shootWeek` – `signShootAt`'s shape from r2-13, kept field for field. */
function signShootAt(world: WorldState, shootWeek: number): void {
  world.offers.push({
    id: `devff-ad-${shootWeek}`,
    kind: 'ad',
    week: world.week - 5,
    deadlineWeek: world.week - 2,
    state: 'signed',
    decidedWeek: world.week - 5,
    fromWeek: world.week - 5,
    untilWeek: world.week + 40,
    terms: {
      brand: ECONOMY.advertising.categories.watches.houses[0],
      cashCents: ECONOMY.advertising.categories.watches.feeCentsByBand[1]!,
      termWeeks: 52,
      shootCount: 2,
      shootWeeks: [shootWeek],
    },
  })
}

interface RefusalFixture {
  reason: StopReason
  /** what `advanceWeeks` re-reports at the same week, which is always the member itself */
  build: () => WorldState
}

const FIXTURES: RefusalFixture[] = [
  {
    // ⭐ v48's member, and the walk stops on it rather than counting to a week: `birthdayTurning`'s
    // marked week has moved twice (round 34 #3 alone shifted it by one), so a hand-typed week number
    // here would be a third spelling of her calendar.
    reason: 'birthday',
    build: () => {
      const world = createWorld('devff-bday', { ...DEFAULT_PROFILE })
      world.season = []
      const rng = resumeMain(world.rngMain)
      for (let i = 0; i < 208 && pendingBirthday(world) === null; i++) {
        if (pendingKnock(world)) decideKnock(world, 'rest')
        drainLifeBeats(world)
        tickWeek(world, rng)
      }
      drainLifeBeats(world)
      return world
    },
  },
  {
    // The fork is asked at nineteen; the record IS the pending state and there is no second boolean,
    // so a fresh career carrying an unanswered row is the state, reached honestly.
    reason: 'fork',
    build: () => {
      const world = quietWalk('devff-fork', 4)
      world.fork = { askedWeek: world.week, answer: null, offer: null, departsWeek: null }
      return world
    },
  },
  {
    reason: 'retirement',
    build: () => {
      const world = quietWalk('devff-retire', 4)
      world.retirementOffer = { askedWeek: world.week, seasonIndex: 0, reason: 'age', final: false }
      return world
    },
  },
  {
    // ⚠ THE LATCH IS THE ENGINE'S OWN, NOT A WRITTEN FIELD. `world.ending` is the one member of this
    // table whose record carries a type, a week, an age and a detail line the epilogue renders, so an
    // invented one would be a fixture about this test's imagination. A career that cannot pay walks
    // into the real one in a handful of weeks (r2-13's `gate-ending` row, same arrangement).
    reason: 'ending',
    build: () => {
      const world = createWorld('devff-ending', { ...DEFAULT_PROFILE })
      world.season = []
      world.fundsCents = -100_000_00
      const rng = resumeMain(world.rngMain)
      for (let i = 0; i < 60 && world.ending === null; i++) {
        if (pendingKnock(world)) decideKnock(world, 'rest')
        drainLifeBeats(world)
        advanceWeeks(world, rng, 1)
      }
      return world
    },
  },
  {
    // ⭐⭐ ROUND 29 #3's member – THE ONE THE OLD PIN NEVER NAMED AND NO TEST EVER DROVE. A signed
    // campaign names the week ahead and she is entered in it: two of the parent's four answers stop
    // being possible the moment that week begins.
    reason: 'shoot-clash',
    build: () => {
      const world = quietWalk('devff-clash', 10)
      const shootWeek = world.week + 1
      const event: SeasonEvent = {
        id: `devff-clash-${shootWeek}`,
        week: shootWeek,
        tier: 'local',
        surface: 'hard',
        travelCostCents: 100_00,
        deadlineWeek: world.week,
      }
      world.season = [event]
      enterEvent(world, event.id)
      signShootAt(world, shootWeek)
      expect(shootClashOpen(world), 'the collision really is standing').toBe(true)
      return world
    },
  },
]

describe('layer 2b — every other member of ADVANCE_REFUSALS refuses the tick, driven through the worker', () => {
  for (const fixture of FIXTURES) {
    it(`an open '${fixture.reason}' refuses the tick and holds the week`, async () => {
      const world = fixture.build()
      // ⚠⚠ THE PRECONDITION IS THE NET. One question standing and no other, asked of the owner the
      // worker now reads – so this case can only pass while `openQuestions`' own clause for this
      // member is live. Delete the clause and the tick goes through.
      expect(openQuestions(world), `${fixture.reason}: exactly one question stands`).toEqual([fixture.reason])
      const week = await loadIntoWorker(world)

      const refusal = await send({ type: 'tick', weeks: 52, baseRevision: lastRevision })
      expect(refusal.ok, `${fixture.reason}: the tick is refused`).toBe(false)
      expect(refusal.error).toContain('resolve the tournament or knock')

      // ...and the world behind the refusal is exactly where it was: the supervised path re-reports
      // the SAME reason at the SAME week, which is also the assertion that the raw loop and
      // `advanceWeeks` are refusing on one state.
      const after = await send({ type: 'advance', weeks: 1, baseRevision: lastRevision })
      expect(after.ok, after.error).toBe(true)
      expect(after.snapshot!.week, `${fixture.reason}: not one week moved`).toBe(week)
      expect(after.snapshot!.stopReasons, `${fixture.reason}: the engine names it`).toContain(fixture.reason)
    }, 120_000)
  }

  // ⚠⚠ AND A NINTH MEMBER CANNOT BE ADDED WITHOUT THIS FILE NOTICING. The pin above no longer counts
  // clauses – it asserts the copy is GONE – so this is what makes the behaviour cover the list: the
  // three named cases plus this table's five are exactly `ADVANCE_REFUSALS`, and a new blocking kind
  // lands here as a missing case rather than as a silently untested one.
  it('⚠⚠ the eight members of ADVANCE_REFUSALS are exactly the eight this file drives', () => {
    const NAMED = ['tournament', 'knock', 'life'] as const
    const driven = [...NAMED, ...FIXTURES.map((f) => f.reason)]
    expect([...driven].sort()).toEqual([...ADVANCE_REFUSALS].sort())
    expect(new Set(driven).size, 'no member is driven twice').toBe(driven.length)
  })
})
