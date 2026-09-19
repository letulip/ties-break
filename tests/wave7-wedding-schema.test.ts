// THE WEDDING, WAVE 7 – T1: THE v83 SCHEMA MOVE (life/wave-7; docs/plans/life-wave-7-builder-2026-09.md §2 T1).
//
// ⚠⚠ WHY A CRAFTED WITNESS EXISTS BESIDE THE GOLDEN CORPUS – the standing note over v78 in
// migrations.ts, obeyed rather than rediscovered: «a step that writes into a row writes its own
// witness». Every golden fixture below v83 carries `loveEpisodes: []`, so on all of them the v82 ->
// v83 walk executes ZERO times and a green regeneration proves nothing about it. v83.json is the
// FIRST golden save that holds a row (§B below reads it, which is what makes the corpus loop in
// tests/goldenSaves.test.ts bite at all – «a fixture happens to hold one is not a witness until
// something reads it», the v78 lesson) – and the walk itself is proved HERE, on a crafted v82
// payload carrying two rows, exactly as wave 6's §B proved v77's walk.
//
// MUTATION LEDGER (the walk's arms, run before this file was believed – the wave-6 file's own
// protocol):
//   ARM 1  the loop body commented out in migrations.ts         → §A.1 red on both rows
//   ARM 2  the loop made to skip its first row (`slice(1)`)     → §A.1 red on row 0, green on row 1
//   ARM 3  `??=` flipped to `||=` on `latchedWeek`              → §A.3 red (the 0-shaped latch clobbered)
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { migrateSave } from '../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../src/engine/world'

const SAVES = fileURLToPath(new URL('./fixtures/saves', import.meta.url))
const v82 = (): Record<string, unknown> => JSON.parse(readFileSync(`${SAVES}/v82.json`, 'utf8'))

/** The v82 shape of a row – the ten fields every save written before v83 holds, and what the
 *  migration is handed. Built by hand rather than off today's type, because a historical payload is
 *  JSON and not an instance of it (wave 6's `preV77Row`, one wave on). */
function preV83Row(sinceWeek: number, endedWeek: number | null): Record<string, unknown> {
  return {
    id: `p:${sinceWeek}`,
    sinceWeek,
    endedWeek,
    knownWeek: sinceWeek + 2,
    wants: 'open',
    partnerId: `p:${sinceWeek}`,
    publicWeek: null,
    publicWrong: false,
    airedMetWeek: null,
    airedEndedWeek: null,
  }
}

describe('v83 – the latch and the name seat arrive on every episode row', () => {
  it('walks the list: a live row AND an ended one both gain `latchedWeek`/`partnerName`, null', () => {
    // ⚠ TWO ROWS AND NOT ONE, which is the whole reason the step is a walk: «a career with two
    // attachments needs both rows repaired» (the v77 block's own sentence). A step that repaired
    // only the first row stays green against a one-row witness forever.
    const rows = [preV83Row(100, 120), preV83Row(200, null)]
    const lived = { ...v82(), schemaVersion: 82, loveEpisodes: JSON.parse(JSON.stringify(rows)) }
    const out = migrateSave(lived) as unknown as { schemaVersion: number; loveEpisodes: Record<string, unknown>[] }
    expect(out.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const [i, row] of out.loveEpisodes.entries()) {
      expect(row.latchedWeek, `row ${i}: no career has ever reached a wedding`).toBeNull()
      expect(row.partnerName, `row ${i}: nobody was ever named`).toBeNull()
      // ...and every field that was already there survives untouched – the whole-row half of the
      // claim, wave 6's own shape.
      for (const key of Object.keys(rows[i])) {
        expect(JSON.stringify(row[key]), `row ${i}: ${key} survives the step untouched`).toBe(JSON.stringify(rows[i][key]))
      }
      // ⚠ APPENDED AFTER THE TEN, for serialisation parity with the one writer: `rollArrival`'s
      // literal ends `…, latchedWeek, partnerName`, and the walk `??=`s them in that same order –
      // so a migrated row and a born row serialise identically and two careers with the same
      // history cannot hash apart (the v77 order pin's own argument, one version on).
      expect(Object.keys(row).slice(-2), `row ${i}: the two arrive last, in the literal's order`).toEqual(['latchedWeek', 'partnerName'])
    }
  })

  it('⚠ `??=` and never `||=`: a 0-shaped latch and a real name survive the walk', () => {
    // A v82 payload cannot historically hold either value – this is the guard-rail arm, not a
    // scenario: `latchedWeek ||= null` would clobber a live week-0 latch (0 is falsy), and the day
    // a hand-carried or re-walked payload meets the step, «already answered» must be kept whole.
    const row = { ...preV83Row(0, null), latchedWeek: 0, partnerName: 'Anton' }
    const lived = { ...v82(), schemaVersion: 82, loveEpisodes: [JSON.parse(JSON.stringify(row))] }
    const out = migrateSave(lived) as unknown as { loveEpisodes: Record<string, unknown>[] }
    expect(out.loveEpisodes[0].latchedWeek, 'the week-0 latch is kept, not clobbered').toBe(0)
    expect(out.loveEpisodes[0].partnerName, 'the name is kept, not re-nulled').toBe('Anton')
  })

  it('an empty list and an absent list are both handled, and neither throws', () => {
    // The two shapes the loop meets in the wild besides a real list – v77's own last case, verbatim
    // in a newer situation: `[]` is what every golden save below v83 carries; ABSENT is what a
    // hand-built probe world carries.
    expect((migrateSave({ ...v82(), schemaVersion: 82, loveEpisodes: [] }) as unknown as Record<string, unknown>).loveEpisodes).toEqual([])
    const noList = { ...v82(), schemaVersion: 82 } as Record<string, unknown>
    delete noList.loveEpisodes
    expect(() => migrateSave(noList), 'a payload with no list at all migrates rather than throwing').not.toThrow()
  })

  it('⭐ the v83 golden fixture HOLDS an episode row – the corpus finally witnesses a per-row walk', () => {
    // The premise the goldenSaves corpus loop stands on, asserted rather than assumed: v83.json is
    // generated from a PROBE career (played by the engine's own loop, never hand-crafted) that
    // reached an attachment, so it is the first fixture on which a per-row step executes at all.
    // If a regeneration ever replaces it with an empty-list save, this is the line that says the
    // corpus went blind again – re-probe rather than shrug.
    const fixture = JSON.parse(readFileSync(`${SAVES}/v83.json`, 'utf8')) as {
      schemaVersion: number
      loveEpisodes: Record<string, unknown>[]
    }
    expect(fixture.schemaVersion).toBe(83)
    expect(fixture.loveEpisodes.length, 'the probe career holds at least one attachment').toBeGreaterThan(0)
    for (const row of fixture.loveEpisodes) {
      expect(row.latchedWeek, 'no wedding can have fired on this tree before 23').toBeNull()
      expect(row.partnerName, 'no engagement, no name').toBeNull()
    }
  })
})
