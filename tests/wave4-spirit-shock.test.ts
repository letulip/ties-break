// =================================================================================================
// WAVE 4, T1 – IT ENDS: THE v75 SCHEMA MOVE, AND THE TWO FIELDS IT CARRIES
// =================================================================================================
//
// `docs/plans/life-wave-4-builder-2026-09.md` §2 T1, design `docs/plans/the-private-life-build.md`
// §5 step 4. T1 ships TWO seats and deliberately no writer for either: `world.spiritShock` (the mark
// an ending leaves on her – `rollEnds` is T2 and the shock itself is T3) and `WorldEvent.lifeKind?`
// (the feed's life-row discriminator – the two write sites are T5's). So every assertion below is
// about a SHAPE and about what the migration does and does not do to an old save; nothing here
// exercises a behaviour, because the step has none, and that is the claim rather than a shortfall.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts no player-facing sentence, because this step raises none
// (invariant 4) – the strings are T6's and land through the architect's read.
//
// ⚠⚠ THE TWO FIELDS ARE NOT SYMMETRICAL AND THE FILE IS SHAPED AROUND THAT. `spiritShock` is a WORLD
// key and is back-filled, so it gets the three-part move's full ledger (A). `lifeKind` is an OPTIONAL
// field on a feed ROW and is deliberately NOT back-filled, so what it gets is the pair of assertions
// that a non-back-fill actually needs (B): the migration must not INVENT a stamp, and it must not
// STRIP one. Both directions are asserted because only asserting one of them would leave a migration
// free to fail in the other.
//
// ⚠⚠ EVERY ARM IS RECORDED, the wave-2/wave-3 duty kept verbatim – a net nobody watched fail proves
// nothing, so what was broken and what went red is written down here rather than in a commit message
// nobody re-reads. All five were RUN against this file, red, and re-edited back by hand:
//
//   ARM 1  the v74 -> v75 step's `??=` written as `=`         1 RED – «is idempotent, and never
//          overwrites a shock a save already has»: expected `null` to equal `{week: 300, …}`
//   ARM 2  the v74 -> v75 step deleted entirely               6 RED – every case that walks the
//          ladder throws «Save schema 74 is newer than supported 75»
//   ARM 3  the step back-fills `'met'` onto every `'life'`    1 RED – «invents no stamp on an old
//          row (`e.lifeKind ??= 'met'`)                            row»: `'lifeKind' in row` was true
//   ARM 4  the step strips the field (`delete e.lifeKind`)    1 RED – «keeps a stamp a row already
//                                                                  carries»: expected undefined to be 'met'
//   ARM 5  `spiritShock` hand-edited in the golden fixture    2 RED – «ships a golden fixture of its
//          from `null` to `{week: 1, kind: 'breakup'}`              own shape» AND «the fixture is the
//                                                                  real migration's own output»
//
// ⚠ ARM 5 WENT RED TWICE AND THE LEDGER SAYS SO RATHER THAN ROUNDING IT DOWN – it was predicted as
// one. Both cases read the file, and that pair is the honest shape: the shape case catches an edit
// that puts a wrong VALUE in the fixture, the equality case catches one that puts a value there the
// migration would never have written. A single red would have meant one of the two was redundant.
//
// ⚠ AND THE SIXTH ARM LIVES IN ANOTHER FILE, named here so this ledger is not read as the whole of
// what was watched: dropping the `spiritShock` peel from `careerHashAtSchema`
// (tests/coachTravelEdgeFixtures.ts) takes **13 RED** across every rollback rung in
// tests/coach-travel-edge.test.ts, the new v75 case among them. Its record is in that file's own
// header block, where the constants it guards are.
//
// ⚠⚠ AND ARM 1 IS WHY THIS LEDGER IS RUN AND NOT REASONED – wave 3's T1 recorded exactly this trap
// one rung down and it is re-armed here rather than re-discovered. `migrateSave` MUTATES ITS PAYLOAD
// IN PLACE, so an idempotency line that compares the result with the very field the step just
// replaced compares a thing with itself and stays green under the mutation. The expected value is
// therefore frozen in a separate object BEFORE the call and the payload handed over is a deep copy.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import type { WorldEvent } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** A fresh deep copy of the v74 golden save every time – `migrateSave` mutates in place, so a shared
 *  payload would let one case decide what the next one sees. */
const v74 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v74.json`, 'utf8'))

/** A wave-3 career's own feed row, in the shape `deliverKnownPartner` writes it (`world/ledger.ts`
 *  `addEvent`, no `amountCents` – a life beat is never a purchase). The golden corpus holds no `'life'`
 *  row of its own: v74.json was produced by migrating a save older than the layer, so a row of this
 *  kind has to be placed here for B's assertions to have a target at all. */
function lifeRow(id: number, lifeKind?: 'met'): WorldEvent {
  return { id, week: 300, type: 'life', text: 'There is someone.', keep: true, ...(lifeKind ? { lifeKind } : {}) }
}

// =================================================================================================
// A. THE SCHEMA MOVE (CLAUDE.md invariant 3) – v75's own rung
// =================================================================================================
describe('wave 4 T1 A – v75, the three-part move', () => {
  it('bumps the version and ships a golden fixture of its own shape', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(75)
    const v75 = JSON.parse(readFileSync(`${SAVES}/v75.json`, 'utf8'))
    expect(v75.schemaVersion).toBe(75)
    // ⚠ `toBeNull` rather than `toBeUndefined`, and the difference is the whole shape: the key must be
    // PRESENT and null, because an absent key is the v74 shape and would migrate again on every load.
    expect('spiritShock' in v75, 'the fixture carries the key this version added').toBe(true)
    expect(v75.spiritShock, 'and carries it empty, which is what a career with nothing behind it means')
      .toBeNull()
  })

  it('⭐⭐ back-fills a NULL shock, which is exactly true rather than a bargain with a pruned log', () => {
    const before = v74()
    expect(before.spiritShock, 'the older shape genuinely has no such key').toBeUndefined()
    const migrated = migrateSave(v74())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠ A career that predates the layer carries no live shock, because nothing in its past could
    // have shocked her – v74's own claim one rung down, and it is the TRUE value rather than a
    // placeholder for one.
    expect(migrated.spiritShock).toBeNull()
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. Asserted, so a hand edit to either one goes red here
    // (ARM 5). ⚠ This line is the one the NEXT wave will have to re-aim, exactly as this wave re-aimed
    // v74's and wave 3 re-aimed v73's: `migrateSave` always walks to the LADDER'S HEAD, so the direct
    // equality holds only while 75 IS the head. The re-aim is the converging form, not a deletion.
    expect(JSON.parse(readFileSync(`${SAVES}/v75.json`, 'utf8'))).toEqual(migrated)
  })

  it('is idempotent, and never overwrites a shock a save already has', () => {
    const once = migrateSave(v74())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // The `??=` said out loud: a save already carrying a live shock keeps it. T3 will produce exactly
    // this shape on a live career, and a second load must not wipe the mark off a girl who is still
    // under her line.
    //
    // ⚠⚠ THE EXPECTED VALUE IS A SEPARATE OBJECT, AND THAT IS THE WHOLE ASSERTION RATHER THAN A
    // TIDINESS – wave 3's ARM 4, re-armed here rather than re-discovered. `migrateSave` MUTATES THE
    // PAYLOAD IN PLACE, so `expect(migrateSave(lived).spiritShock).toEqual(lived.spiritShock)` compares
    // the result with ITSELF: a step written `=` instead of `??=` replaces the value on `lived` and
    // both sides move together, green. The expected shock is therefore frozen in `kept` before the
    // call, and the payload handed over is a deep copy.
    const kept = { week: 300, kind: 'breakup' as const }
    const lived = { ...v74(), schemaVersion: 74, spiritShock: JSON.parse(JSON.stringify(kept)) }
    expect(migrateSave(lived).spiritShock, 'a shock already on the record is kept whole').toEqual(kept)
  })

  it('⚠ takes NOTHING from any stream – the persisted MAIN position is byte-identical', () => {
    // The strongest form available: the step writes one literal and reaches no sub-stream at all, so
    // the frozen capture (41550 / e6b0c709, tests/condition.test.ts) is untouched by construction
    // rather than by measurement. This asserts the construction.
    const before = JSON.stringify(v74().rngMain)
    expect(JSON.stringify(migrateSave(v74()).rngMain)).toBe(before)
  })

  it('every older fixture reaches v75 carrying the key', () => {
    // The corpus floor, restated on this rung: `goldenSaves.test.ts` walks every fixture and this asks
    // the one question that is about THIS step – the key is PRESENT on all of them, however old, so no
    // reader downstream needs an `undefined` branch beside its `null` one. ⚠ `in` rather than a value
    // check, deliberately: `spiritShock === null` would pass on an absent key too, and «absent» is the
    // exact shape this step exists to abolish.
    for (const v of [0, 25, 35, 60, 70, 72, 73, 74]) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${SAVES}/v${v}.json`, 'utf8')))
      expect('spiritShock' in migrated, `v${v}.json`).toBe(true)
      expect(migrated.spiritShock, `v${v}.json`).toBeNull()
    }
  }, 30_000)
})

// =================================================================================================
// B. `WorldEvent.lifeKind?` – OPTIONAL, ADDITIVE, AND OWED NO BACK-FILL
// =================================================================================================
describe('wave 4 T1 B – the life-row discriminator, and the back-fill that is deliberately absent', () => {
  it('⭐⭐ invents no stamp on an old row – the migration leaves a `life` row exactly as it found it', () => {
    // ⚠⚠ THE TARGET IS PROVED TO EXIST BEFORE IT IS ASSERTED ABSENT, which is the whole reason this
    // case is shaped this way. «No row carries a stamp» is trivially true of a payload with no `'life'`
    // rows in it at all, and v74.json is exactly such a payload – it was produced by migrating a save
    // older than the layer, so its 401 events hold not one `'life'` row. A negative assertion over
    // nothing is the emptiest kind of green there is.
    const payload = v74()
    const events = payload.events as WorldEvent[]
    payload.events = [...events, lifeRow(9001), lifeRow(9002)]
    const before = (payload.events as WorldEvent[]).filter((e) => e.type === 'life')
    expect(before.length, 'the rows this case is about are really in the payload').toBe(2)
    expect(before.every((e) => !('lifeKind' in e)), 'and they really start unstamped').toBe(true)

    const rows = migrateSave(payload).events.filter((e) => e.type === 'life')
    expect(rows.length, 'both rows survive the ladder').toBe(2)
    for (const row of rows) {
      // ⚠ `in` rather than `=== undefined`: the claim is that the KEY was never written, and a key
      // written as `undefined` would pass a value check while changing the shape a save serialises to.
      expect('lifeKind' in row, 'the migration invented no discriminator').toBe(false)
    }
    // ⚠ AND THIS IS WHAT KEEPS THE FEED HONEST RATHER THAN A TIDINESS POINT. The glyph column reads
    // `lifeKind ?? 'met'` (components/screens/lifeRowGlyphs.ts, T5), so an unstamped row keeps its 🤍;
    // a migration that guessed `'met'` onto every old `'life'` row would be re-deriving a fact from
    // prose and calling the guess a record, which is what v70's draw back-fill refused for the same
    // reason. Some of those rows will be ENDINGS once T2 ships, and nothing in an old save can say so.
  })

  it('⭐⭐ keeps a stamp a row already carries, whole and unchanged', () => {
    // The other direction, and it needs asserting separately: «does not invent» and «does not strip»
    // are two different failures and a migration is free to have either. T5 writes this field, so a
    // save written from that version on arrives here already stamped and must come out the far side
    // identical.
    //
    // ⚠⚠ THE EXPECTED VALUE IS HELD IN A COPY THE CODE UNDER TEST CANNOT REACH – A's ARM-1 lesson
    // applied to a row rather than to a world key. `migrateSave` mutates the payload in place, so an
    // assertion that read the expected stamp back off `payload.events` would be reading whatever the
    // step left there.
    const payload = v74()
    payload.events = [...(payload.events as WorldEvent[]), lifeRow(9001, 'met')]
    const expected = JSON.parse(JSON.stringify(lifeRow(9001, 'met'))) as WorldEvent
    expect(expected.lifeKind, 'the control really carries the stamp').toBe('met')

    const row = migrateSave(payload).events.find((e) => e.id === 9001)
    expect(row, 'the row survives the ladder').toBeDefined()
    expect(row).toEqual(expected)
  })

  it('⚠ is OPTIONAL on the wire, and the compiler is the reader of that claim', () => {
    // ⚠ A COMPILE SHAPE STATED AT RUNTIME, and it is labelled as one rather than dressed up as a net:
    // «`lifeKind` may be omitted» is a property `vue-tsc` checks in `npm run check`, and no runtime
    // mutation of the migration can make this line fail. It is here because a reader who is not a
    // compiler still needs to see the claim written down – the same division of labour
    // `LifeRowGlyphs`' own note describes for its empty-or-total gate.
    const unstamped: WorldEvent = { id: 1, week: 0, type: 'life', text: 'x' }
    const stamped: WorldEvent = { ...unstamped, lifeKind: 'met' }
    expect(unstamped.lifeKind).toBeUndefined()
    expect(stamped.lifeKind).toBe('met')
  })
})
