import { describe, it, expect, beforeEach, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import { request } from '../src/worker/client'
import { CommandRejected, useGameStore } from '../src/stores/game'
import {
  DEFAULT_PROFILE,
  REPLY_BY_COMMAND,
  WEEK_PLAN_PRESETS,
  type AlbumBook,
  type PrologueHandover,
  type SavePeek,
  type Snapshot,
  type ToUI,
} from '../src/shared/protocol'
import { dynastyOf } from './helpers/dynastyHandover'
// Comments are not code, and a missing marker is an error rather than a wider slice – the house
// helpers (CLAUDE.md: never cut a source region with a raw `indexOf`).
import { after, codeOf } from './helpers/source'

// =================================================================================================
// D-08 · THE REACTIVE-PROXY BOUNDARY, GUARDED AS A CLASS RATHER THAN ONE PAYLOAD AT A TIME
// (the 26.09 principles review, 04-worker-protocol-persistence.md · D-08; T5.5 of the fix plan).
//
// THE DEFECT THIS FILE IS THE ANSWER TO. Every object the store hands `postMessage` must be
// structured-cloneable, and a Vue reactive proxy is not: the browser refuses it outright with
// «#<Object> could not be cloned.» `plainDynasty` (stores/game.ts) exists because of exactly that,
// found on the first e2e run that reached the inheritance handover – every unit and mounted test
// passed, because they call `createWorld` directly or stub the store and none of them crosses the
// boundary. The review's verdict: the copy is right, but the CLASS is re-proven by hand at every new
// object payload and the only net is e2e. No test even named `plainDynasty`.
//
// ⚠⚠ WHAT MAKES THIS A CLASS GUARD AND NOT A THIRD COPY OF THE SAME CHECK: THE ENUMERATION IS THE
// STORE'S OWN. The actions are read out of `src/stores/game.ts` – every action whose body calls
// `request(` – and the test refuses to run against a hand-kept subset (`the store's senders are
// exactly the ones this file drives`, below). A list written here by hand would be the same defect
// with a test in front of it: the day somebody adds an action carrying a new object, a hand list
// stays green and says nothing.
//
// ⚠ AND THE GUARANTEE IS NOT IN ONE PLACE, WHICH IS WHY THE THIRD CASE ENUMERATES WHERE IT LIVES.
// Only `dynasty` is made plain BY THE STORE (`plainDynasty`). `profile` and `prologue` are plain
// because their call sites build them fresh (`settleIdentity`'s spread, the prologue's own literal –
// stores/game.ts's own note says so and says what happens to a caller that stops), `plan` because
// `planFromWeek` copies the days or the caller passes `WEEK_PLAN_PRESETS`, and `bytes` because it is
// an `ArrayBuffer` off a `File`. So this file drives each payload with WHAT ITS REAL CALL SITE
// PRODUCES – a reactive dynasty, because the block starts life on `Snapshot.ending.dynasty` which
// Pinia has made reactive, and plain objects where the call site's own shape is the guarantee. It
// asserts no requirement the store does not have; what it pins is that the arrangement holds, and
// that a NEW object payload cannot appear without a reader here noticing.
//
// ⚠ NO WORKER AND NO MOUNT. `worker/client` must not import Vue (invariant 1), so the check cannot
// live at `request()`; it lives here, where the store's own message is in hand.
//
// MUTATION ARM (the one the finding names): replace `plainDynasty(dynasty)` with `dynasty` in
// stores/game.ts → the `new` message carries the proxy and the first case goes red on
// «DataCloneError: #<Object> could not be cloned.»
// =================================================================================================

vi.mock('../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})

const mockRequest = vi.mocked(request)

/** One crossing of the store → worker boundary, as `postMessage` would see it. */
interface Crossing {
  type: string
  /** the payload fields holding a non-primitive – the class D-08 is about */
  objectFields: string[]
  /** null when `structuredClone` accepted the message; the failure otherwise */
  cloneError: string | null
}

let crossings: Crossing[] = []

/** THE PROBE: what `postMessage` does to this message, done here so a refusal is a test failure
 *  instead of a browser-only one. `run()` swallows every throw into `store.error`, so the verdict is
 *  recorded at the boundary rather than read off the action's outcome. */
function record(msg: Record<string, unknown>): void {
  const objectFields = Object.keys(msg).filter((k) => typeof msg[k] === 'object' && msg[k] !== null)
  let cloneError: string | null = null
  try {
    structuredClone(msg)
  } catch (err) {
    cloneError = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }
  crossings.push({ type: String(msg.type), objectFields, cloneError })
}

const snap = (): Snapshot => ({ careerId: 'c-d08', week: 12 }) as unknown as Snapshot

/** The ok arm each command answers with, keyed by the PROTOCOL's own table rather than by a second
 *  hand-written pairing – `REPLY_BY_COMMAND` is the same value `worker/client.ts` checks against. */
const REPLY_BY_ARM: Record<(typeof REPLY_BY_COMMAND)[keyof typeof REPLY_BY_COMMAND], () => ToUI> = {
  snapshot: () => ({ id: 0, ok: true, type: 'snapshot', snapshot: snap(), revision: 1 }),
  slots: () => ({ id: 0, ok: true, type: 'slots', slots: [], revision: 1 }),
  careers: () => ({ id: 0, ok: true, type: 'careers', careers: [], revision: 1 }),
  album: () => ({ id: 0, ok: true, type: 'album', album: {} as AlbumBook, revision: 1 }),
  // ⚠ RE-AIMED, NOT WIDENED (T6.2 · D-07, 28.09): the record is TOTAL over the protocol's reply arms.
  // `inbox` carries a LIST OUT of the worker, which is the direction D-08 is not about – the finding is
  // about objects the store sends IN – but the arm still has to exist for the sweep to run.
  inbox: () => ({ id: 0, ok: true, type: 'inbox', inbox: [], revision: 1 }),
  exported: () => ({ id: 0, ok: true, type: 'exported', bytes: new ArrayBuffer(8), filename: 'c.tsave', revision: 1 }),
  peek: () => ({ id: 0, ok: true, type: 'peek', peek: {} as SavePeek, revision: 1 }),
}

/** What its real call site hands the store: a spread, not the module constant itself. */
const plainProfile = () => ({ ...DEFAULT_PROFILE })
/** ...and the prologue's own literal (`traceOf` / `chosenYears` build the fields fresh). */
const plainPrologue = (): PrologueHandover => ({ years: [], spentCents: 0 })
/** ⚠ REACTIVE ON PURPOSE. The inheritance block starts life on `Snapshot.ending.dynasty`, which
 *  Pinia has made reactive; `plainDynasty` is what makes it crossable. This IS the real call site. */
const liveDynasty = () => reactive(dynastyOf())
/** Something the door can read twice; the bytes' CONTENT is the worker's business, not this file's. */
const tsaveFile = () => new File(['d08-export-bytes'], 'career.tsave')

type Store = ReturnType<typeof useGameStore>

/** One driver per message-sending action, each called the way its real caller calls it. Its KEYS are
 *  checked against the store's source below – this table may not quietly hold fewer names. */
function driversFor(s: Store): Record<string, () => unknown> {
  return {
    init: () => s.init(),
    reloadAfterRestart: () => s.reloadAfterRestart(),
    refreshAfterStale: () => s.refreshAfterStale(new CommandRejected('stale', 'STALE_REVISION', 3)),
    newCareer: () => s.newCareer('d08-seed', plainProfile(), plainPrologue(), liveDynasty(), true),
    // ⭐ D-05 (28.09): the one body every mutation goes through, driven DIRECTLY as well as through
    // its 41 callers – because `commit` is what spreads the caller's message, so it is the step that
    // could stop the copy being crossable. Driven with the one mutation payload that carries an
    // object, so the carriers table below is asked the same question about the same type either way.
    commit: () => s.commit({ type: 'setPlan', plan: WEEK_PLAN_PRESETS.balanced }),
    loadAlbum: () => s.loadAlbum(),
    // ⚠ T6.2 · D-07, 28.09 – the new sending action, driven because the enumeration below is EQUALITY
    // in both directions: a sender left undriven is exactly the defect D-08 describes coming back.
    loadInbox: () => s.loadInbox(),
    tick: () => s.tick(1),
    advance: () => s.advance(2),
    enterEvent: () => s.enterEvent('e-1'),
    answerFork: () => s.answerFork('college', 'state'),
    answerRetirement: () => s.answerRetirement(false),
    resumeFromCollege: () => s.resumeFromCollege(),
    endCollegeEarly: () => s.endCollegeEarly(),
    withdrawEvent: () => s.withdrawEvent('e-1'),
    cancelEntry: () => s.cancelEntry('e-1'),
    skipEvent: () => s.skipEvent('e-1'),
    tournamentReveal: () => s.tournamentReveal(),
    tournamentSkip: () => s.tournamentSkip(),
    tournamentClose: () => s.tournamentClose(),
    bookVacation: () => s.bookVacation(30, 'pkg-coast'),
    cancelVacation: () => s.cancelVacation(30),
    buyAsset: () => s.buyAsset('asset-1', 100_00, 'The flat'),
    sellAsset: () => s.sellAsset('asset-1', 50_00),
    bookPractice: () => s.bookPractice(11, true),
    hireCoach: () => s.hireCoach('coach-1'),
    hireMasseur: () => s.hireMasseur(true),
    setMasseurSessions: () => s.setMasseurSessions(2),
    setMasseurTravels: () => s.setMasseurTravels(true),
    hireSparring: () => s.hireSparring(true),
    setSparringRung: () => s.setSparringRung(2),
    setSparringTravels: () => s.setSparringTravels(false),
    hirePsychologist: () => s.hirePsychologist(true),
    setPsychologistRung: () => s.setPsychologistRung(1),
    setPsychologistFocus: () => s.setPsychologistFocus('coolhead'),
    setCoachOnEventWeeks: () => s.setCoachOnEventWeeks(true),
    setWeightEnabled: () => s.setWeightEnabled(true),
    setCoachOnJuniorEvents: () => s.setCoachOnJuniorEvents(false),
    cancelPractice: () => s.cancelPractice(11),
    setPlan: () => s.setPlan(WEEK_PLAN_PRESETS.balanced),
    decideKnock: () => s.decideKnock('rest'),
    answerShootClash: () => s.answerShootClash('play-both'),
    chooseGift: () => s.chooseGift('gift-1'),
    answerLifeBeat: () => s.answerLifeBeat('option-1'),
    signOffer: () => s.signOffer('offer-1'),
    refuseOffer: () => s.refuseOffer('offer-1'),
    setPhysio: () => s.setPhysio(true),
    setKitGrade: () => s.setKitGrade('strings', 'pro'),
    saveManual: () => s.saveManual(),
    restoreSlot: () => s.restoreSlot('manual'),
    saveNamed: () => s.saveNamed('a named save'),
    loadCareer: () => s.loadCareer('c-d08'),
    deleteSlot: () => s.deleteSlot('manual'),
    // ⚠ a DIFFERENT career: deleting the active one nulls the snapshot mid-drive, and
    // `reloadAfterRestart` needs one to have a career to reload.
    deleteCareer: () => s.deleteCareer('c-other'),
    refreshSlots: () => s.refreshSlots(),
    refreshCareers: () => s.refreshCareers(),
    exportSave: () => s.exportSave(),
    peekSave: () => s.peekSave(tsaveFile()),
    importSave: () => s.importSave(tsaveFile()),
  }
}

/** Every action in `src/stores/game.ts` that puts a message on the wire – read from the source, with
 *  the prose stripped first so a mention in a comment cannot enrol one.
 *
 *  ⚠⚠ RE-AIMED 28.09 BY D-05 (T6.1), AND WIDENED RATHER THAN WEAKENED. This read `request(` alone,
 *  which was the whole story while all 41 mutations posted their own message. D-05 collapsed those 41
 *  bodies into one private `commit(msg)`, so on that tree `request(` found SIXTEEN senders against
 *  the 57 driven below and the equality went red – with nothing wrong: the actions still cross the
 *  boundary, one level down. `this.commit(` is the second spelling of "this action posts a message",
 *  so it is matched too, and `commit` itself is enrolled (it calls `request`) and driven below. The
 *  question the case asks is unchanged and the set it asks it about is the same 57 plus `commit`.
 *  ⚠ WHY NOT JUST DROP THE EQUALITY: because the equality is the guard. A table that may hold fewer
 *  names than the store has senders is D-08's own defect with a test in front of it. */
function storeSenders(): string[] {
  const src = codeOf(readFileSync(new URL('../src/stores/game.ts', import.meta.url), 'utf8'))
  const block = after(src, '  actions: {')
  const heads = [...block.matchAll(/^ {4}(?:async )?([A-Za-z]\w*)\s*[(<]/gm)]
  return heads
    .filter((h, i) => {
      const body = block.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : block.length)
      return /\brequest\(/.test(body) || /\bthis\.commit\(/.test(body)
    })
    .map((h) => h[1])
}

let driven: string[] = []

beforeEach(async () => {
  setActivePinia(createPinia())
  mockRequest.mockReset()
  crossings = []
  driven = []
  const store = useGameStore()
  // `reloadAfterRestart` reloads the career the player is IN, so it needs one to be in.
  store.snapshot = snap()
  mockRequest.mockImplementation(async (msg) => {
    record(msg as unknown as Record<string, unknown>)
    return REPLY_BY_ARM[REPLY_BY_COMMAND[msg.type]]()
  })
  for (const [name, drive] of Object.entries(driversFor(store))) {
    // The store's own error handling is not this test's subject – `run()` swallows every throw into
    // `store.error`, and the verdict this file reads was recorded at the boundary before that.
    try {
      await drive()
    } catch {
      /* deliberately ignored – see above */
    }
    driven.push(name)
  }
})

describe('D-08 – every object the store posts to the worker is structured-cloneable', () => {
  it('no message the store sends would be refused by postMessage', () => {
    expect(crossings.length, 'the drive sent nothing – the mock or the drivers are wrong').toBeGreaterThan(0)
    const refused = crossings.filter((c) => c.cloneError !== null)
    expect(refused.map((c) => `${c.type}: ${c.cloneError}`), 'a payload postMessage would refuse').toEqual([])
  })

  it("the store's senders are exactly the ones this file drives - the enumeration is mechanical", () => {
    const senders = storeSenders()
    // Not a vacuous pass: the parse found actions at all.
    expect(senders.length, 'no sending action was found in the store source – the parse is broken').toBeGreaterThan(0)
    // ⚠ EQUALITY, NOT CONTAINMENT, IN BOTH DIRECTIONS. A new sending action left undriven is the
    // defect D-08 describes coming back; a driver for something that no longer sends is a table
    // rotting quietly. Either one has to be looked at, so either one is red.
    expect(new Set(driven)).toEqual(new Set(senders))
    // ...and every driven action really did reach the boundary at least once.
    expect(new Set(crossings.map((c) => c.type)).size).toBeGreaterThan(0)
  })

  it('the payloads that carry an object are these, and each one has a named source of plainness', () => {
    const carriers: Record<string, string[]> = {}
    for (const c of crossings) if (c.objectFields.length) carriers[c.type] = c.objectFields
    expect(Object.keys(carriers).length, 'nothing carried an object – this file would prove nothing').toBeGreaterThan(0)
    // ⚠ A NEW ROW HERE IS A QUESTION, NOT A CHORE: where does this one's plainness come from?
    //   new.profile      – the wizard's spread and `settleIdentity` build it fresh
    //   new.prologue     – `traceOf` / `chosenYears` build it fresh
    //   new.dynasty      – `plainDynasty`, THE STORE'S OWN copy (the arm the mutation below breaks)
    //   setPlan.plan     – `planFromWeek` copies the days, or a `WEEK_PLAN_PRESETS` constant
    //   peekSave.bytes   – an `ArrayBuffer` off the `File`, and `request` transfers it
    //   importSave.bytes – the same, its own read (a File can be read twice)
    expect(carriers).toEqual({
      new: ['profile', 'prologue', 'dynasty'],
      setPlan: ['plan'],
      peekSave: ['bytes'],
      importSave: ['bytes'],
    })
  })

  it('the inheritance block crosses as a plain, faithful copy - and the arm is live', () => {
    const live = liveDynasty()
    // ⚠ THE LIVENESS CHECK, AND IT IS WHAT STOPS THIS FILE GOING GREEN FOR THE WRONG REASON. If a
    // future Vue made a reactive proxy cloneable, every assertion above would pass while measuring
    // nothing. So the same object this test hands the store is refused HERE, in one line.
    expect(() => structuredClone(live)).toThrow(/could not be cloned/i)

    const sent = crossings.find((c) => c.type === 'new')
    expect(sent?.cloneError, 'the handover crossed').toBeNull()
    const payload = mockRequest.mock.calls.map(([m]) => m).find((m) => m.type === 'new')
    expect(payload).toBeTruthy()
    const dynasty = (payload as { dynasty?: unknown }).dynasty
    // A COPY, not the caller's object – so neither side aliases the other's state.
    expect(dynasty).not.toBe(live)
    // ...and a FAITHFUL one. This is the v89 hazard `plainDynasty`'s own note names: a field added to
    // `DynastyHandover` and not added to the copy reaches the worker as `undefined`, on a real
    // handover and on nothing else.
    expect(dynasty).toEqual(dynastyOf())
  })
})
