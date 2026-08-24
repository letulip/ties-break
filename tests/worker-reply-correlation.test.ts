import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { resumeMain } from '../src/engine/rng'
import { encodeExportFile } from '../src/engine/saveCodec'
import { DEFAULT_PROFILE, REPLY_BY_COMMAND, type ToWorker, type WorkerErrorCode } from '../src/shared/protocol'
import { workerHarness, type WorkerMsg } from './helpers/workerHarness'
import { scriptCodeOf } from './helpers/source'

// =================================================================================================
// R2-05 (TB-06 / PR-07) — THE WORKER'S HALF OF THE REQUEST/REPLY CORRELATION.
//
// `src/shared/protocol.ts` now states, once, which reply each command answers with. The compiler
// holds the UI side to that table (`ReplyFor<K>`, and tests/worker-reply-pairs.types.ts proves a
// wrong pairing will not typecheck). It CANNOT hold the worker to it: a Worker is a separate
// program on the other side of `postMessage`, and `handle` is declared to return the whole `ToUI`
// union because that is honestly what a message channel carries.
//
// So the worker is held to the table HERE, by running it. Every key of `REPLY_BY_COMMAND` is sent
// to the real switch and the real reply's arm is compared to the row. A case that started answering
// with the wrong shape – the exact defect the typing cannot see – fails this suite.
//
// AND THE FOUR THINGS THE TYPING WAVE PROMISED NOT TO DISTURB are pinned alongside it, because a
// seam is only stabilised if the behaviour under it is nailed down first:
//   * the explicit switch (no dynamic dispatch)          -> 'the dispatcher is a switch…'
//   * transfer lists for save bytes                      -> 'the export reply transfers its buffer…'
//   * transactional commit-before-swap / revision / error -> tests/sim-worker-pipeline.test.ts,
//     which is untouched by this wave and still the owner of those three.
// =================================================================================================

interface Reply {
  id: number
  ok: boolean
  type?: string
  error?: string
  code?: WorkerErrorCode
  revision?: number
  bytes?: ArrayBuffer
  peek?: { careerId: string }
  snapshot?: { week: number; careerId: string }
}

/** Latched off every ok reply: mutating commands need a LIVE `baseRevision` or the worker refuses
 *  them as STALE_REVISION before their own case ever runs – the same reason
 *  tests/dev-fast-forward.test.ts latches it (see the workerHarness header). */
let lastRevision = 0
const { send, workerGlobal } = workerHarness<Reply>((r) => {
  if (r.ok && typeof r.revision === 'number') lastRevision = r.revision
})

/** Every `postMessage` the worker made, with the transfer list it passed. The harness ignores the
 *  second argument; this wrapper is the only thing in the suite that looks at it. */
const posts: { reply: Reply; transfer: Transferable[] | undefined }[] = []
const deliver = workerGlobal.postMessage.bind(workerGlobal)
workerGlobal.postMessage = (m: unknown, transfer?: Transferable[]) => {
  posts.push({ reply: m as Reply, transfer })
  deliver(m)
}

/** The knock-cooldown fixture the pipeline suite uses: no open knock and no entries, so an advance
 *  moves exactly one week and cannot stop on a decision. */
function quietCareer(seed: string, weeks = 10): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  world.knock = null
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
  return world
}

async function saveBytes(world: WorldState): Promise<ArrayBuffer> {
  return (await encodeExportFile(world)).slice().buffer as ArrayBuffer
}

beforeAll(async () => {
  await import('../src/worker/sim.worker')
  expect(workerGlobal.onmessage, 'the worker module registered its handler').not.toBeNull()
})

describe('every command answers with the arm REPLY_BY_COMMAND names for it', () => {
  /**
   * One valid-shaped message per command.
   *
   * ⚠ THE `satisfies` IS WHAT KEEPS THIS HONEST. A new `ToWorker` arm with no sample here fails to
   * compile, and so does a sample for a command that no longer exists – so this table cannot fall
   * behind the protocol the way a hand-maintained list of names would.
   *
   * ⚠ THE ORDER IS DELIBERATE and it is the reason the run is not vacuous: reads and saves first,
   * then the mutations, then the three that REPLACE or DELETE the active career. Sent the other way
   * round, half the commands would answer "No active career" and the suite would be asserting
   * almost nothing. The vacuity guard below turns that reasoning into an assertion.
   */
  function samples(ctx: { careerId: string; slot: string; bytes: ArrayBuffer; freshBytes: ArrayBuffer }) {
    return {
      // -- queries and persistence, against the imported career -----------------------------
      getSnapshot: { type: 'getSnapshot' },
      listSlots: { type: 'listSlots' },
      listCareers: { type: 'listCareers' },
      exportSave: { type: 'exportSave' },
      peekSave: { type: 'peekSave', bytes: ctx.bytes },
      save: { type: 'save', slot: 'manual' },
      saveNamed: { type: 'saveNamed', name: 'conformance' },
      // -- mutations. Several of these are refused by the engine on a quiet career (no knock, no
      //    pending tournament, no fork, no offer) and a refusal is a legitimate answer to any
      //    command – see the assertion. The ones that DO commit prove the snapshot arm for real.
      //
      //    ⚠ THE TWO TIME-MOVERS COME LAST OF THE MUTATIONS, AND `advance` BEFORE `tick`. Everything
      //    above them leaves the week alone, so `advance` meets the imported career exactly as the
      //    fixture built it – no open decision, so it commits and the must-succeed list can name it.
      //    `tick` runs after a week has passed and may legitimately meet a birthday, which is a
      //    refusal by design (dev-fast-forward's guard) – so it is not on that list.
      setPhysio: { type: 'setPhysio', active: true, baseRevision: 0 },
      setPlan: { type: 'setPlan', plan: { train: 60, rest: 40 }, baseRevision: 0 },
      hireCoach: { type: 'hireCoach', coachId: null, baseRevision: 0 },
      setCoachOnEventWeeks: { type: 'setCoachOnEventWeeks', on: false, baseRevision: 0 },
      setCoachOnJuniorEvents: { type: 'setCoachOnJuniorEvents', on: false, baseRevision: 0 },
      hireMasseur: { type: 'hireMasseur', hire: false, baseRevision: 0 },
      setMasseurSessions: { type: 'setMasseurSessions', sessions: 0, baseRevision: 0 },
      setMasseurTravels: { type: 'setMasseurTravels', on: false, baseRevision: 0 },
      setKitGrade: { type: 'setKitGrade', line: 'strings', grade: 'composite', baseRevision: 0 },
      bookPractice: { type: 'bookPractice', week: 9999, withCoach: false, baseRevision: 0 },
      cancelPractice: { type: 'cancelPractice', week: 9999, baseRevision: 0 },
      bookVacation: { type: 'bookVacation', week: 9999, packageId: 'nope', baseRevision: 0 },
      cancelVacation: { type: 'cancelVacation', week: 9999, baseRevision: 0 },
      enterEvent: { type: 'enterEvent', eventId: 'no-such-event', baseRevision: 0 },
      withdrawEvent: { type: 'withdrawEvent', eventId: 'no-such-event', baseRevision: 0 },
      cancelEntry: { type: 'cancelEntry', eventId: 'no-such-event', baseRevision: 0 },
      skipEvent: { type: 'skipEvent', eventId: 'no-such-event', baseRevision: 0 },
      tournamentReveal: { type: 'tournamentReveal', baseRevision: 0 },
      tournamentSkip: { type: 'tournamentSkip', baseRevision: 0 },
      tournamentClose: { type: 'tournamentClose', baseRevision: 0 },
      decideKnock: { type: 'decideKnock', choice: 'rest', baseRevision: 0 },
      chooseGift: { type: 'chooseGift', giftId: 'no-such-gift', baseRevision: 0 },
      signOffer: { type: 'signOffer', offerId: 'no-such-offer', baseRevision: 0 },
      refuseOffer: { type: 'refuseOffer', offerId: 'no-such-offer', baseRevision: 0 },
      answerFork: { type: 'answerFork', answer: 'continue', baseRevision: 0 },
      answerRetirement: { type: 'answerRetirement', retire: false, baseRevision: 0 },
      resumeFromCollege: { type: 'resumeFromCollege', baseRevision: 0 },
      endCollegeEarly: { type: 'endCollegeEarly', baseRevision: 0 },
      advance: { type: 'advance', weeks: 1, baseRevision: 0 },
      tick: { type: 'tick', weeks: 1, baseRevision: 0 },
      // -- the lifecycle commands that replace or remove the active career, last -------------
      restoreSlot: { type: 'restoreSlot', slot: ctx.slot },
      loadCareer: { type: 'loadCareer', careerId: ctx.careerId },
      deleteSlot: { type: 'deleteSlot', slot: ctx.slot },
      importSave: { type: 'importSave', bytes: ctx.freshBytes },
      new: { type: 'new', seed: 'conformance-new', profile: DEFAULT_PROFILE },
      deleteCareer: { type: 'deleteCareer', careerId: ctx.careerId },
    } satisfies { [K in ToWorker['type']]: Extract<WorkerMsg, { type: K }> }
  }

  it('drives the real switch over every row of the table and no reply is off-contract', async () => {
    const world = quietCareer('reply-conformance')
    const imported = await send({ type: 'importSave', bytes: await saveBytes(world) })
    expect(imported.ok, imported.error).toBe(true)
    const careerId = imported.snapshot!.careerId
    const named = await send({ type: 'saveNamed', name: 'conformance' })
    expect(named.ok, named.error).toBe(true)

    const table = samples({
      careerId,
      slot: `manual:${careerId}:conformance`,
      bytes: await saveBytes(world),
      freshBytes: await saveBytes(quietCareer('reply-conformance-import')),
    })

    // The keys come from the PROTOCOL's table, not from the samples: this loop is the thing that
    // proves the worker covers it, so it must be driven by the side it is being measured against.
    const commands = Object.keys(REPLY_BY_COMMAND) as ToWorker['type'][]
    // ⚠ COUNTED, NOT QUOTED (CLAUDE.md). No literal number lives here: the sample table's coverage
    // is compile-bound by its `satisfies`, and this restates the same fact at runtime so a reader
    // does not have to take the type system's word for what the loop is about to cover.
    expect([...Object.keys(table)].sort()).toEqual([...commands].sort())

    const arms = new Map<ToWorker['type'], string | 'refused'>()
    for (const command of commands) {
      const msg = { ...table[command] } as WorkerMsg
      if ('baseRevision' in msg) (msg as { baseRevision: number }).baseRevision = lastRevision
      const reply = await send(msg)
      if (!reply.ok) {
        // A refusal is a legitimate answer to ANY command and carries no `type` at all – that is
        // exactly why REPLY_BY_COMMAND only names ok arms and `ReplyFor` unions in the error arm.
        expect(reply.error, `'${command}' refused without saying why`).toBeTruthy()
        expect(reply.type, 'the failure arm has no reply type').toBeUndefined()
        arms.set(command, 'refused')
        continue
      }
      expect(reply.type, `'${command}' answered off-contract`).toBe(REPLY_BY_COMMAND[command])
      arms.set(command, reply.type!)
    }

    // ⚠ THE VACUITY GUARD. "error or the right arm" is satisfied by a worker that refuses
    // everything, so the run has to prove it actually exercised each SHAPE. All five arms of
    // ToUI's ok half must have been produced by a real command in the loop above.
    const seen = new Set([...arms.values()].filter((a) => a !== 'refused'))
    expect([...seen].sort()).toEqual(['careers', 'exported', 'peek', 'slots', 'snapshot'])
    // ...and these seven in particular must have COMMITTED, one per arm plus the two mutation
    // paths, so a future refusal creeping into a load-bearing command cannot hide inside the set.
    for (const command of ['getSnapshot', 'listSlots', 'listCareers', 'exportSave', 'peekSave', 'advance', 'saveNamed'] as const) {
      expect(arms.get(command), `'${command}' must succeed on a quiet career`).toBe(REPLY_BY_COMMAND[command])
    }
  }, 60_000)
})

describe('the four behaviours this typing wave promised not to disturb', () => {
  const worker = readFileSync(new URL('../src/worker/sim.worker.ts', import.meta.url), 'utf8')
  // ⚠ COMMENTS STRIPPED FIRST. This file documents the very thing the negative pin forbids – its
  // own header says "no handler table, no dynamic dispatch on msg.type" – so a scan over raw source
  // would fire on the note explaining the rule. `scriptCodeOf` is the house helper for a `.ts` pin.
  const code = scriptCodeOf(worker)

  it('the dispatcher is a switch with one explicit case per command, not a handler table', () => {
    expect(code).toContain('switch (msg.type) {')
    const missing = (Object.keys(REPLY_BY_COMMAND) as ToWorker['type'][]).filter(
      (command) => !code.includes(`case '${command}':`),
    )
    expect(missing, 'every command in the protocol table has its own case').toEqual([])
    // The negative half: no lookup table, no computed handler, nothing indexed by the message type.
    expect(code, 'no dynamic dispatch on the message type').not.toMatch(/\[\s*msg\.type\s*\]/)
    expect(code, 'no handler registry').not.toMatch(/Record<\s*ToWorker\['type'\]/)
  })

  it('the export reply transfers its buffer – a save is never structured-cloned', async () => {
    const world = quietCareer('reply-transfer')
    const imported = await send({ type: 'importSave', bytes: await saveBytes(world) })
    expect(imported.ok, imported.error).toBe(true)

    posts.length = 0
    const exported = await send({ type: 'exportSave' })
    expect(exported.ok, exported.error).toBe(true)
    const post = posts.find((p) => p.reply.id === exported.id)!

    // ⚠⚠ THE LOAD-BEARING ASSERTION OF THIS FILE. Without the transfer list the whole save is
    // structured-CLONED across the boundary – the bytes exist twice, in both heaps, on every
    // export, and nothing else in the suite would ever notice. Identity, not length: a list
    // holding some other buffer would satisfy a count.
    expect(post.transfer, 'the export posts a transfer list').toHaveLength(1)
    expect(post.transfer![0], "and the thing transferred IS the reply's own buffer").toBe(exported.bytes)
  }, 60_000)

  it('a reply with no buffer transfers nothing – the list is not a blanket', async () => {
    posts.length = 0
    const listed = await send({ type: 'listSlots' })
    expect(listed.ok, listed.error).toBe(true)
    const post = posts.find((p) => p.reply.id === listed.id)!
    expect(post.transfer, 'nothing to detach, so nothing is offered').toEqual([])
  })
})

describe('the compile-time test exists and is still armed', () => {
  // ⚠ WHAT THIS CAN AND CANNOT PROVE. The real assertions of the fixture are made by
  // `vue-tsc -b --force`, which is where they belong – this only notices if the file is deleted or
  // emptied, which no compiler run would report as an error. It is a smoke alarm, not the fire door.
  it('tests/worker-reply-pairs.types.ts carries its expect-error directives', () => {
    const path = new URL('./worker-reply-pairs.types.ts', import.meta.url)
    expect(existsSync(path), 'the compile-time fixture is still in the tree').toBe(true)
    const fixture = readFileSync(path, 'utf8')
    const armed = fixture.match(/^\s*\/\/ @ts-expect-error/gm) ?? []
    // 11 as it stands: 5 wrong field/arm pairings, 3 wrong appliers, 3 request payloads. A floor
    // rather than an equality, so adding an arm does not have to come back and edit a number.
    expect(armed.length, 'a wrong pairing per arm, plus the payload checks').toBeGreaterThanOrEqual(11)
    expect(fixture, 'it exercises the real client, not a copy of its types').toContain(
      "from '../src/worker/client'",
    )
  })
})
