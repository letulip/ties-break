// =================================================================================================
// WAVE 3, T1 – SOMEONE EXISTS: THE v74 SCHEMA MOVE, AND THE SELECTOR THAT REPLACES A SLOT
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T1, design `docs/plans/the-private-life-build.md`
// §4 step 3. T1 ships the LIST, the migration and the derived selector – and deliberately no writer:
// the arrival hazard is T3, so on this tree `world.loveEpisodes` is `[]` on every career that exists
// and every row this file reads it against is placed by hand.
//
// ⚠ WHAT THIS FILE DOES NOT DO. It asserts no player-facing sentence, because this step raises none
// (invariant 4). The nearest thing to copy it touches is `wants`, which is a machine value and never
// a rendered word.
//
// ⚠⚠ EVERY ARM IS RECORDED, the wave-2 duty kept verbatim – a net nobody watched fail proves
// nothing, so what was broken and what went red is written down here rather than in a commit message
// nobody re-reads:
//
//   ARM 1  `activeEpisode` SCANS BACK for the last open row            1 RED – «an OPEN row followed
//          by a LATER ENDED one»: expected `p:300` to be null
//          ⚠ RE-AIMED 11.09 WITH THE TAIL RULING, NOT DROPPED. It was the mirror of this before the
//          reversal («reads the last index», 1 RED on the same case) – the case still separates the
//          two readings and still has exactly one arm; which side is the mutation swapped.
//   ARM 2  `activeEpisode` drops its `endedWeek === null` test         2 RED – «a row that has ENDED
//          reads null» (`p:300` came back), and the tail case (`p:320` came back for null)
//   ARM 3  `activeEpisode` returns the FIRST match, not the last       1 RED – «two open rows read
//          the LAST»: `p:300` for `p:340`
//   ARM 4  the v73 -> v74 step's `??=` written as `=`                  1 RED – «is idempotent…»:
//          expected `[]` to equal the two rows
//   ARM 5  the v73 -> v74 step deleted entirely                        4 RED – every case that walks
//          the ladder throws «Save schema 73 is newer than supported 74»
//
// ⚠⚠ AND ARM 4 IS THE REASON THIS LEDGER IS RUN AND NOT REASONED. The first version of the
// idempotency case PASSED under it, green, because `migrateSave` mutates its payload in place and the
// assertion compared the result with `lived.loveEpisodes` – the very array the step had just
// replaced. A net nobody watched fail proves nothing; this one was watched, failed to fail, and was
// fixed. The line now freezes the expected rows in a separate object before the call, and says so.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { activeEpisode, createWorld, loveEpisodesOf, SAVE_SCHEMA_VERSION, type WorldState } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import type { LoveEpisode } from '../src/shared/protocol'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** A row of the shape T1 froze. `endedWeek: null` is «still going», which is the only kind of row
 *  this wave can ever produce – wave 4 writes the other kind. */
function episode(sinceWeek: number, endedWeek: number | null): LoveEpisode {
  return {
    id: `p:${sinceWeek}`,
    sinceWeek,
    endedWeek,
    knownWeek: null,
    wants: 'private',
    partnerId: `p:${sinceWeek}`,
  }
}

/** A real career, then the rows placed on it by hand. Real rather than a `{}` cast on purpose – the
 *  empty case below is then `createWorld`'s OWN init rather than a shape this file posed, which is
 *  one pin bought for nothing. */
function worldWith(...rows: LoveEpisode[]): WorldState {
  const world = createWorld('wave3-t1')
  world.loveEpisodes = rows
  return world
}

// =================================================================================================
// A. `activeEpisode` – THE DERIVATION THAT REPLACED A SLOT
// =================================================================================================
describe('wave 3 T1 A – the active attachment is derived, never stored', () => {
  it('⭐ a career nobody has arrived in reads null, and that is `createWorld`\'s own shape', () => {
    const fresh = createWorld('wave3-t1')
    // The empty case is not posed, it is the literal `createWorld` writes – so this line is also the
    // pin that the v74 key is initialised at birth and not lazily on first use.
    expect(fresh.loveEpisodes, 'the key exists and is empty from week 0').toEqual([])
    expect(activeEpisode(fresh)).toBeNull()
  })

  it('⭐ one open row IS the active attachment', () => {
    const row = episode(300, null)
    expect(activeEpisode(worldWith(row))).toBe(row)
  })

  it('⭐ a row that has ENDED reads null – an attachment that is over is not an attachment', () => {
    // The plain «open row, then ended» case: ONE episode that ran its course. Wave 4 writes the
    // `endedWeek`; this wave only has to be sure the selector stops reporting her as attached the
    // moment it appears.
    expect(activeEpisode(worldWith(episode(300, 320)))).toBeNull()
  })

  it('⚠⚠ an OPEN row followed by a LATER ENDED one reads NULL – the TAIL decides, and that is a ruling', () => {
    // ⚠⚠ THIS IS THE ONE CASE WHERE «the last row with `endedWeek === null`» (the brief's PROSE) and
    // «the last row, if it is open» (the brief's own enumerated TEST LIST) DISAGREE. The builder
    // implemented the prose; the architect reversed it on 11.09 and the tail wins. Written as its own
    // case so nobody has to guess which one the code means – see `activeEpisode`'s own comment for the
    // three grounds, of which this is the load-bearing one:
    //
    // ⚠ A BACKWARD SCAN FAILS STUCK WHERE THE TAIL FAILS SAFE. This shape is UNREACHABLE today – the
    // arrival hazard (T3) refuses to draw while `activeEpisode` is non-null, so at most one row is
    // open and a later row cannot end before an earlier one still going. But if some future bug ever
    // produced it, a scan would answer «someone is there» for the rest of the career: no arrival ever
    // again, a permanent +5 baseline lift, and nothing anywhere saying why. The tail reading lets the
    // cooldown run and the career recover. A selector's behaviour on an impossible state is exactly
    // what gets decided by accident once something depends on the answer, so it is decided here.
    //
    // ⚠ AND THE ROW IS NOT LOST: `loveEpisodes` still holds it, which is what the list is for. This
    // function answers only «is someone there NOW».
    const open = episode(300, null)
    const rows = worldWith(open, episode(320, 340))
    expect(activeEpisode(rows)).toBeNull()
    expect(loveEpisodesOf(rows), 'and the open row is still on the record').toContain(open)
  })

  it('⭐⭐ an ENDED row followed by an OPEN one reads the OPEN one – the LAST match, not the first', () => {
    const open = episode(340, null)
    const found = activeEpisode(worldWith(episode(300, 320), open))
    expect(found).toBe(open)
    // Named, not merely identical: `toBe` on a row this test built cannot tell a reader WHICH row
    // came back if the selector ever hands over the wrong one, and the id can.
    expect(found?.id).toBe('p:340')
  })

  it('⚠ two open rows read the LAST – «the current attachment is the most recent one»', () => {
    // ⚠ THE CASE THAT SEPARATES «the last open row» FROM «the first open row», which every case above
    // leaves undecided because they all hold at most one open row. The two readings agree today and
    // stop agreeing the moment anything can raise a second attachment while the first still stands;
    // the newest is the right answer then, and this is where that is decided rather than discovered.
    // ⚠ `pendingLifeBeat` takes the FIRST unanswered row for the opposite and equally deliberate
    // reason – a queue that answered its newest entry first would lose the oldest.
    const newer = episode(340, null)
    expect(activeEpisode(worldWith(episode(300, null), newer))).toBe(newer)
  })

  it('⚠ `loveEpisodesOf` extends `lifeLogOf`\'s courtesy to a probe world that predates the field', () => {
    // Not a save – a hand-built object of the kind tests have always poked at the engine with. It
    // has no business crashing a read, and the `?? []` is what says so.
    const probe = {} as unknown as WorldState
    expect(loveEpisodesOf(probe)).toEqual([])
    expect(activeEpisode(probe)).toBeNull()
  })
})

// =================================================================================================
// B. THE SCHEMA MOVE (§4) – the three-part law on this wave's own rung
// =================================================================================================
describe('wave 3 T1 B – v74, the three-part move', () => {
  const v73 = () => JSON.parse(readFileSync(`${SAVES}/v73.json`, 'utf8'))

  it('bumps the version and ships a golden fixture of its own shape', () => {
    // ⚠ RE-AIMED AT v75 (12.09, the private life's wave 4 took the next rung – `spiritShock`), NOT
    // LOOSENED, and on `tests/wave2-life-beat.test.ts`'s own precedent one version down, verbatim –
    // which took it from `tests/spirit.test.ts` one version below that. This case is about v74's OWN
    // RUNG – that the move happened and left a fixture of ITS OWN SHAPE behind – and never about the
    // ladder's head, which moves with every wave. So the head is asserted as a FLOOR and the two
    // claims that actually belong to this rung (the fixture says 74, and it carries the key 74 added)
    // are asserted exactly as before. The head's own guard – «a bump forces a new golden save» – lives
    // in tests/goldenSaves.test.ts and is the only place that should ever name a number that changes.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(74)
    const v74 = JSON.parse(readFileSync(`${SAVES}/v74.json`, 'utf8'))
    expect(v74.schemaVersion).toBe(74)
    expect(v74.loveEpisodes, 'and the fixture carries the key this version added').toEqual([])
  })

  it('⭐⭐ back-fills an EMPTY life, which is exactly true rather than a bargain with a pruned log', () => {
    const before = v73()
    expect(before.loveEpisodes, 'the older shape genuinely has no such key').toBeUndefined()
    const migrated = migrateSave(v73())
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    // ⚠ A career that predates the layer has lived no attachments, because there were none to live –
    // v73's own claim one rung down, and it is the TRUE value rather than a placeholder for one.
    expect(migrated.loveEpisodes).toEqual([])
    expect(activeEpisode(migrated), 'so she arrives at this version with nobody').toBeNull()
    // ⚠ AND THE FIXTURE IS THE REAL MIGRATION'S OWN OUTPUT, not a hand-written file beside it – the
    // recipe every fixture since v25 uses. Asserted, so a hand edit to either one goes red here.
    //
    // ⚠⚠ RE-AIMED AT v75 (12.09, wave 4's `spiritShock`), NOT WEAKENED, AND THIS ONE HAD TO BE – the
    // exact move `tests/wave2-life-beat.test.ts` made one version down, for the exact reason.
    // `migrateSave` always walks to the LADDER'S HEAD, so the moment the head moved past 74 the
    // migrated payload stopped being a v74 save and the direct equality could never hold again. The
    // claim is unchanged and is made where it stays true: the v74 FIXTURE and the migrated v73
    // CONVERGE at the head, byte for byte, which is «the fixture is the migration's own output»
    // carried one rung forward. A hand edit to either file still goes red here, which is the whole
    // point of the line; v74's own shape is pinned by the case above (`schemaVersion` 74,
    // `loveEpisodes` present), and v75's own «produced by the real migration» equality lives at its
    // own rung in tests/wave4-spirit-shock.test.ts.
    expect(migrateSave(JSON.parse(readFileSync(`${SAVES}/v74.json`, 'utf8')))).toEqual(migrated)
  })

  it('is idempotent, and never overwrites a life a save already has', () => {
    const once = migrateSave(v73())
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))

    // The `??=` said out loud: a save already carrying rows keeps every one of them. Wave 4 will
    // produce exactly this shape on a live career, and a second load must not erase it.
    //
    // ⚠⚠ THE EXPECTED VALUE IS A SEPARATE OBJECT, AND THAT IS THE WHOLE ASSERTION RATHER THAN A
    // TIDINESS. `migrateSave` MUTATES THE PAYLOAD IN PLACE, so `expect(migrateSave(lived).loveEpisodes)
    // .toEqual(lived.loveEpisodes)` compares the result with ITSELF: a step written `=` instead of
    // `??=` replaces the array on `lived` and both sides of the comparison move together, green.
    // Measured, not reasoned – ARM 4 above was exactly that mutation, and the first version of this
    // line PASSED under it. The rows are therefore frozen in `kept` before the call, and the payload
    // handed over is a deep copy.
    const kept = [episode(300, 320), episode(340, null)]
    const lived = { ...v73(), schemaVersion: 73, loveEpisodes: JSON.parse(JSON.stringify(kept)) }
    expect(migrateSave(lived).loveEpisodes, 'an attachment already on the record is kept whole').toEqual(kept)
  })

  it('⚠ takes NOTHING from any stream – the persisted MAIN position is byte-identical', () => {
    // The strongest form available: the step writes two literals and reaches no sub-stream at all,
    // so the frozen capture (41550 / e6b0c709, tests/condition.test.ts) is untouched by construction
    // rather than by measurement. This asserts the construction.
    const before = JSON.stringify(v73().rngMain)
    expect(JSON.stringify(migrateSave(v73()).rngMain)).toBe(before)
  })

  it('every older fixture reaches v74 carrying the field', () => {
    // The corpus floor, restated on this rung: `goldenSaves.test.ts` walks every fixture and this
    // asks the one question that is about THIS step – the key is present and is an array on all of
    // them, however old, so no reader downstream needs an `undefined` branch.
    for (const v of [0, 25, 35, 60, 70, 72, 73]) {
      const migrated = migrateSave(JSON.parse(readFileSync(`${SAVES}/v${v}.json`, 'utf8')))
      expect(Array.isArray(migrated.loveEpisodes), `v${v}.json`).toBe(true)
    }
  }, 30_000)
})
