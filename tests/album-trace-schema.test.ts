// THE ALBUM's ONE SCHEMA MOVE – v84: `world.prologueTrace` (docs/specs/the-album-2026-09.md §3,
// his ruling of 19.09 – path (а): the childhood finally leaves a record).
//
// ⚠⚠ WHY A CRAFTED WITNESS EXISTS BESIDE THE GOLDEN CORPUS – the standing rule over v78 in
// migrations.ts, obeyed rather than rediscovered: a walked probe SKIPS the prologue by construction,
// so no engine-played golden fixture can ever hold a non-null trace, and v84.json (the v25 recipe
// resumed on the v83 probe – its README row records the choice) witnesses the BACK-FILL and nothing
// else. The NON-NULL shape is proved HERE, through the real writer and nothing but the real writer:
// a `PrologueRun` walked through the run's own API, its weekends played by the pool's own bracket,
// `traceOf` on the finished run, and `createWorld` handed the same handover the walk sends.
//
// MUTATION LEDGER (run before this file was believed – the wave-6/wave-7 files' own protocol):
//   ARM 1  the v83 -> v84 step commented out in migrations.ts   → §A.1 red («Save schema 83 is
//          newer than supported» – the ladder refuses to arrive)
//   ARM 2  the back-fill writing `{}` instead of `null`         → §A.1 red (the corpus's claim)
//   ARM 3  `??=` flipped to a bare `=` on `prologueTrace`       → §A.2 red (a hand-carried trace
//          clobbered; `??=` vs `||=` is indistinguishable on this key's domain – null | object –
//          so the assignment arm is the one that bites, and §A.2 is written against it)
//   ARM 4  `createWorld` writing the wire object by reference   → §B.3 red (the aliasing guard)
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { createWorld, KID_ID, SAVE_SCHEMA_VERSION } from '../src/engine/world'
import {
  EMPTY_RUN,
  askOn,
  cardFor,
  chosenYears,
  enteredAges,
  isComplete,
  spentCents,
  traceOf,
  withEntry,
  withOpen,
  withOrigin,
  withPick,
  yearsLivedBy,
  yearsSoFar,
  type PrologueRun,
} from '../src/prologue/run'
import { CARD_AGES, TOURNAMENT_ANSWER } from '../src/prologue/cards'
import { localOpensAt, outcomeOf, playLocalOpen, prologueEntrant } from '../src/prologue/pool'
import { DEFAULT_PROFILE, type PrologueHandover, type PrologueTraceOpen } from '../src/shared/protocol'
import type { PlayedOpen } from '../src/prologue/run'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const v83 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v83.json`, 'utf8'))

/** A REAL childhood, walked through the run's own API exactly as `ChildhoodPrologue.vue` walks it:
 *  every decision card answered (the first option on its own resolved face – `cardFor`, so the
 *  twelfth's two faces are honoured), every tournament ask answered, the year at eleven ENTERED and
 *  its weekends PLAYED through the pool's own bracket. Zero hand-written results anywhere. */
function walkedRun(seed: string): PrologueRun {
  let run = withOrigin(EMPTY_RUN, 'middle')
  for (const age of CARD_AGES) {
    const card = cardFor(age, run)
    if (card.options) run = withPick(run, age, card.options[0].id)
    const ask = askOn(age, run)
    if (ask) run = withEntry(run, age, age === 11 ? TOURNAMENT_ANSWER.enter : TOURNAMENT_ANSWER.decline)
  }
  // The weekends the entry at eleven bought, played in order by the pool's real bracket – the same
  // call chain `playNext` makes in the walk (`prologueEntrant` -> `playLocalOpen` -> `withOpen`).
  const count = localOpensAt(yearsSoFar(run), 11, enteredAges(run))
  for (let index = 0; index < count; index++) {
    const kid = prologueEntrant(seed, KID_ID, 'Vera Test', 11, yearsLivedBy(run, 11))
    const open = playLocalOpen(seed, kid, 11, index)
    const filed: PlayedOpen = {
      age: 11,
      index,
      finish: open.finish,
      rounds: open.rounds,
      wins: open.wins,
      outcome: outcomeOf(open),
    }
    run = withOpen(run, filed)
  }
  return run
}

function handoverOf(seed: string): { run: PrologueRun; handover: PrologueHandover } {
  const run = walkedRun(seed)
  return { run, handover: { years: chosenYears(run), spentCents: spentCents(run), trace: traceOf(run) } }
}

describe('v84 §A – the migration back-fills the trace, and only ever with the truth', () => {
  it('a v83 payload arrives at the head carrying `prologueTrace: null`, and nothing else of it moves', () => {
    const raw = v83()
    const before = JSON.stringify(raw)
    const out = migrateSave(JSON.parse(before)) as unknown as Record<string, unknown>
    expect(out.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(out.prologueTrace, 'no save written before v84 kept a childhood record – null is the truth').toBeNull()
    // ...and the step wrote nothing else: every pre-existing key survives byte-identical.
    const b = JSON.parse(before) as Record<string, unknown>
    for (const key of Object.keys(b)) {
      if (key === 'schemaVersion') continue
      expect(JSON.stringify(out[key]), `${key} survives the step untouched`).toBe(JSON.stringify(b[key]))
    }
  })

  it('⚠ `??=` and never an assignment: a hand-carried trace survives the walk whole', () => {
    // A v83 payload cannot historically hold one – this is the guard-rail arm, not a scenario
    // (wave 7's own 0-shaped-latch shape): the day a re-walked or hand-carried payload meets the
    // step, «already recorded» must be kept whole, and a bare `=` would erase a childhood.
    const trace = { picks: { 5: 'a' }, entries: { 11: 'enter-open' }, opens: [] }
    const lived = { ...v83(), prologueTrace: JSON.parse(JSON.stringify(trace)) }
    const out = migrateSave(lived) as unknown as { prologueTrace: unknown }
    expect(JSON.stringify(out.prologueTrace), 'the carried record is kept, not re-nulled').toBe(JSON.stringify(trace))
  })

  it('is idempotent – migrating the migrated save changes nothing', () => {
    const once = migrateSave(v83())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(twice.prologueTrace).toBeNull()
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))
  })
})

describe('v84 §B – the one writer, at the handover, and nowhere else', () => {
  it('a prologue career persists the finished run – picks, entries and PLAYED weekends – once, at birth', () => {
    const { run, handover } = handoverOf('album-trace-witness')
    // The witness is real, not vacuous: the childhood is complete and she genuinely played.
    expect(isComplete(run), 'the walked run answers every card and every ask').toBe(true)
    expect(run.opens.length, 'the year she was entered held at least one weekend').toBeGreaterThan(0)
    const world = createWorld('album-trace-witness', DEFAULT_PROFILE, 'c-test', handover)
    expect(world.prologueTrace, 'the record is on the world').not.toBeNull()
    expect(world.prologueTrace).toEqual(traceOf(run))
    // ...and it survives a save/load round-trip through the real ladder, untouched.
    const reloaded = migrateSave(JSON.parse(JSON.stringify(world)))
    expect(reloaded.prologueTrace).toEqual(traceOf(run))
  })

  it('a wizard career and a trace-less handover both persist null – absence invents nothing', () => {
    expect(createWorld('album-trace-wizard').prologueTrace, 'the wizard walks no childhood').toBeNull()
    const { handover } = handoverOf('album-trace-benchless')
    const bench: PrologueHandover = { years: handover.years, spentCents: handover.spentCents }
    expect(
      createWorld('album-trace-benchless', DEFAULT_PROFILE, 'c-test', bench).prologueTrace,
      'a handover built before the field – a bench, a probe – hands over a childhood with no record',
    ).toBeNull()
  })

  it('⚠ a fresh copy, never the wire object – mutating the handover after birth moves nothing', () => {
    const { handover } = handoverOf('album-trace-alias')
    const world = createWorld('album-trace-alias', DEFAULT_PROFILE, 'c-test', handover)
    const before = JSON.stringify(world.prologueTrace)
    // the caller's own object is mauled after the fact – a worker message is outside the engine's
    // ownership, and a persisted field must not alias it
    ;(handover.trace!.opens as PrologueTraceOpen[]).length = 0
    ;(handover.trace!.picks as Record<number, string>)[5] = 'clobbered'
    expect(JSON.stringify(world.prologueTrace), 'the persisted record did not move').toBe(before)
  })

  it('⚠ the key lands AFTER `coachDeal` – the peel-rung parity the frozen careers depend on', () => {
    // `careerHashAtSchema` reproduces older shapes by dropping keys in reverse order of arrival,
    // which only works while every key stays where it was appended (the masseur trio's own rule,
    // spelled at the literal). The returned world is not the literal alone – `recomputeKidRank`
    // appends its optional caches after it – so the assertable half of «last key of the literal» is
    // the RELATIVE order against the key that handed over lastness: v82's `coachDeal`.
    const keys = Object.keys(createWorld('album-trace-order'))
    expect(keys.filter((k) => k === 'coachDeal' || k === 'prologueTrace')).toEqual(['coachDeal', 'prologueTrace'])
  })

  it('the run\'s own `PlayedOpen` is the wire row – the two shapes cannot drift', () => {
    // Assignability in the direction the walk uses it (a filed weekend IS a trace row); a widened
    // or renamed field on either side goes red here at compile time, `PrologueYear`'s own guard.
    const open: PlayedOpen = { age: 11, index: 0, finish: 0, rounds: 3, wins: 3, outcome: 'won' }
    const row: PrologueTraceOpen = open
    expect(row).toEqual(open)
  })
})
