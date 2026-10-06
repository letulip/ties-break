// ⭐⭐⭐ THE SECONDARY MARKET, STEP S2 – THE LISTING AND ITS TWO COMMANDS (schema v90). docs/plans/secondary-market-builder-2026-09.md
// S2; spec docs/specs/secondary-market-2026-09.md §2a, §2e, §2i. `listAsset` / `unlistAsset` (world/shop.ts), the memory window
// (`freshnessCarryOf`, world/resale.ts) and the version step that lets a save carry them.
//
// ⚠⚠ THE TABLED SENTENCES ARE READ OUT OF THE STRINGS DOCUMENT, NOT TYPED HERE. A refusal arm compares the engine's message with
// the row of docs/plans/secondary-market-strings-2026-09.md, so the document, the code and this test are ONE truth: reword a row
// and its arm goes red beside the round-trip pin (`tests/secondary-market-strings-roundtrip.test.ts`) – never a third copy that
// can quietly disagree. The two refusals that REUSE a shipped sentence («The family does not own that», «That one cannot be sold
// right now») are compared with what `sellAsset` says for the same row, which is the claim: no new word.
//
// ⚠ WHAT IS DELIBERATELY NOT HERE: a buyer, a letter, a price. None exists until S3; this file owns the STATE a listing leaves.
//
// MUTATION-VERIFIED (30.09, S2), each arm applied ALONE to the source, watched, and restored byte-identical:
//   * `!secondaryOf(item)` guard removed from `listAsset`                       -> parked cash lists: the not-a-thing arm
//   * the academy's «every stage delivered» check removed                       -> the mid-build academy arm
//   * `sellableAsset` guard removed                                             -> the contract-in-delivery arm
//   * the already-listed guard removed                                          -> the double-list arm
//   * `unlistAsset`'s «actually listed» guard turned into a silent return       -> the unlist-unlisted arm
//   * `guardNotEndedForGood` removed from `listAsset`                           -> the ended-for-good arm
//   * `delete row.listedWeek` removed from `unlistAsset`                        -> the round trip and the lot's clear
//   * the academy's lot cut to the named row (`listingRows` -> `[owned]`)       -> the lot arms
//   * `freshnessCarryOf`'s `<=` -> `<`                                          -> the window's boundary arm
//   * the carry dropped from `unlistAsset`'s exposure sum                       -> the accumulation arm
//   * the v89 -> v90 step made to invent a `listedWeek`                         -> the migration arm
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { SAVE_SCHEMA_VERSION, createWorld, listAsset, sellAsset, unlistAsset, type WorldState } from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { ECONOMY } from '../src/engine/economy'
import { shopCatalogue, shopItem } from '../src/engine/world/assets'
import { freshnessCarryOf } from '../src/engine/world/resale'
import type { OwnedAsset } from '../src/shared/protocol'

const TABLE = 'docs/plans/secondary-market-strings-2026-09.md'
/** The placeholder as the strings document spells it, assembled so no lint rule mistakes it for a template. */
const LABEL = '$' + '{label}'

/** A tabled sentence, read out of the strings document. */
function tabled(id: string): string {
  for (const line of readFileSync(TABLE, 'utf8').split('\n')) {
    const m = new RegExp(String.raw`^\| ${id} \| \x60.+?\x60 \| (.+?) \| \x60DRAFT\x60 \|$`).exec(line)
    if (m) return m[1]
  }
  throw new Error(`${id} is not in ${TABLE}`)
}

const CAR = 'car-sensible'
const HOUSE = 'house-first'
/** parked cash: the rungs that keep today's instant partial sale */
const CASH = shopCatalogue()
  .filter((r) => r.family === 'investment')
  .map((r) => r.id)

/** A hand-built world at week 100 that owns exactly these rows, every one DELIVERED unless the caller says otherwise. */
function worldOwning(rows: Record<string, Partial<OwnedAsset>>): WorldState {
  const world = createWorld('sm-s2')
  world.week = 100
  world.assets = Object.entries(rows).map(([id, extra]) => {
    const item = shopItem(id)!
    return { id, boughtWeek: 0, paidCents: item.entryCents, valueCents: item.entryCents, entries: [{ week: 0, cents: item.entryCents }], ...extra }
  })
  return world
}
const rowOf = (world: WorldState, id: string): OwnedAsset => world.assets!.find((a) => a.id === id)!
const lastEvent = (world: WorldState) => world.events[world.events.length - 1]

/** What a command says when it refuses – or the marker that it did not. */
function refusal(fn: () => void): string {
  try {
    fn()
  } catch (e) {
    return (e as Error).message
  }
  return 'NO REFUSAL'
}

/** list at 100, take off at 108, list again at 113 (five later), take off at 116 (three later) – the brief's own walk. */
function endedAt116(): WorldState {
  const world = worldOwning({ [CAR]: {} })
  listAsset(world, CAR)
  world.week = 108
  unlistAsset(world, CAR)
  world.week = 113
  listAsset(world, CAR)
  world.week = 116
  unlistAsset(world, CAR)
  return world
}

describe('S2 · every guard refuses, engine-side, with its tabled sentence', () => {
  it('parked cash is money, not a thing: the deposit and the fund refuse BOTH commands with SM1 and stay unlisted', () => {
    expect(CASH.length, 'the shelf has parked cash to refuse').toBeGreaterThanOrEqual(2)
    for (const id of CASH) {
      const world = worldOwning({ [id]: {} })
      expect(refusal(() => listAsset(world, id)), `list ${id}`).toBe(tabled('SM1'))
      expect(refusal(() => unlistAsset(world, id)), `unlist ${id}`).toBe(tabled('SM1'))
      expect(rowOf(world, id).listedWeek, `${id} stays unlisted`).toBeUndefined()
    }
  })

  it('the academy is one lot: while ANY stage is being built, NEITHER stage id lists (SM2) and nothing is half-marked', () => {
    const world = worldOwning({ 'academy-land': {}, 'academy-courts': { readyWeek: 106 } })
    for (const id of ['academy-land', 'academy-courts']) expect(refusal(() => listAsset(world, id)), id).toBe(tabled('SM2'))
    expect(world.assets!.every((a) => a.listedWeek === undefined), 'no stage was marked').toBe(true)
  })

  it('a contract still in delivery cannot list – with sellAsset\'s own sentence, not a new one', () => {
    const world = worldOwning({ [CAR]: { readyWeek: 110 } })
    const sold = refusal(() => sellAsset(world, CAR))
    expect(sold, 'sellAsset refuses the same row').not.toBe('NO REFUSAL')
    expect(refusal(() => listAsset(world, CAR))).toBe(sold)
    expect(rowOf(world, CAR).listedWeek).toBeUndefined()
  })

  it('not owned: the sentence sellAsset gives, from both commands', () => {
    const world = worldOwning({ [HOUSE]: {} })
    const sold = refusal(() => sellAsset(world, CAR))
    expect(sold).not.toBe('NO REFUSAL')
    expect(refusal(() => listAsset(world, CAR))).toBe(sold)
    expect(refusal(() => unlistAsset(world, CAR))).toBe(sold)
  })

  it('listing twice refuses with SM3, and taking off what is not on the market refuses with SM4 – neither moves the row', () => {
    const world = worldOwning({ [CAR]: {} })
    expect(refusal(() => unlistAsset(world, CAR)), 'unlist an unlisted row').toBe(tabled('SM4'))
    expect(rowOf(world, CAR).lastListing, 'the refusal wrote no memory').toBeUndefined()
    listAsset(world, CAR)
    world.week = 105
    expect(refusal(() => listAsset(world, CAR)), 'list a listed row').toBe(tabled('SM3'))
    expect(rowOf(world, CAR).listedWeek, 'the refusal did not re-stamp the week').toBe(100)
  })

  it('an ended career refuses both with the guard\'s own sentence; the college freeze is not an ended career', () => {
    const ended = worldOwning({ [CAR]: { listedWeek: 100 } })
    ended.ending = { type: 'breakup' } as unknown as WorldState['ending']
    const soldMsg = refusal(() => sellAsset(ended, CAR))
    expect(soldMsg, 'sellAsset refuses on the same latch').not.toBe('NO REFUSAL')
    expect(refusal(() => listAsset(ended, CAR)), 'list').toBe(soldMsg)
    expect(refusal(() => unlistAsset(ended, CAR)), 'unlist').toBe(soldMsg)
    expect(rowOf(ended, CAR).listedWeek, 'and nothing moved').toBe(100)

    const freeze = worldOwning({ [CAR]: {} })
    freeze.ending = { type: 'college' } as unknown as WorldState['ending']
    expect(() => listAsset(freeze, CAR), 'the freeze lets a shop command through').not.toThrow()
    expect(() => unlistAsset(freeze, CAR)).not.toThrow()
  })
})

describe('S2 · the two ledger lines (SM5, SM6): amount-less, info, in the shop category, worded as tabled', () => {
  it('a listing and a withdrawal each write ONE row, and it moves no money', () => {
    const world = worldOwning({ [CAR]: {} })
    const label = shopItem(CAR)!.label
    const funds = world.fundsCents
    const before = world.events.length
    listAsset(world, CAR)
    const put = lastEvent(world)
    world.week = 101
    unlistAsset(world, CAR)
    const off = lastEvent(world)
    expect(world.events.length - before, 'one row per command').toBe(2)
    expect(put.text).toBe(tabled('SM5').replace(LABEL, label))
    expect(off.text).toBe(tabled('SM6').replace(LABEL, label))
    for (const ev of [put, off]) {
      expect(ev.type).toBe('info')
      expect(ev.category).toBe('shop')
      expect(ev.amountCents, 'nothing moved').toBeUndefined()
    }
    expect(world.fundsCents, 'the wallet is untouched').toBe(funds)
  })
})

describe('S2 · list → unlist is a round trip: the world is identical except the feed rows and `lastListing`', () => {
  it('canonical JSON minus the two feed rows, the row counter, the clock and the memory equals the world before', () => {
    const world = worldOwning({ [CAR]: {}, [HOUSE]: {} })
    const before = JSON.parse(JSON.stringify(world))
    listAsset(world, CAR)
    expect(rowOf(world, CAR).listedWeek, 'it really was listed in between').toBe(100)
    world.week = 108
    unlistAsset(world, CAR)
    const after = JSON.parse(JSON.stringify(world))

    expect(after.events.length, 'two feed rows').toBe(before.events.length + 2)
    expect(after.nextEventId, 'and the row counter that goes with them').toBe(before.nextEventId + 2)
    after.events.length = before.events.length
    after.nextEventId = before.nextEventId
    after.week = before.week // the test moved the clock; nothing else did
    const car = after.assets.find((a: OwnedAsset) => a.id === CAR)
    expect(car.lastListing, 'the one thing a withdrawal leaves behind').toEqual({ endedWeek: 108, exposedWeeks: 8 })
    delete car.lastListing
    expect(after).toEqual(before)
  })
})

describe('S2 · the academy is ONE LOT (spec §2e)', () => {
  it('listing ANY stage marks every stage together, and the feed line names the family\'s academy once', () => {
    const world = worldOwning({ 'academy-land': { name: 'Ace Academy' }, 'academy-courts': {}, 'academy-building': {} })
    const before = world.events.length
    listAsset(world, 'academy-courts')
    for (const a of world.assets!) expect(a.listedWeek, `${a.id} is in the lot`).toBe(100)
    expect(world.events.length - before, 'one row for the lot, not one per stage').toBe(1)
    expect(lastEvent(world).text).toBe(tabled('SM5').replace(LABEL, 'Ace Academy'))
    expect(refusal(() => listAsset(world, 'academy-land')), 'naming another stage is the same lot').toBe(tabled('SM3'))
  })

  it('unlisting ANY stage clears the whole lot together, and every stage carries the same memory', () => {
    const world = worldOwning({ 'academy-land': {}, 'academy-courts': {}, 'academy-building': {} })
    listAsset(world, 'academy-land')
    world.week = 107
    unlistAsset(world, 'academy-building')
    for (const a of world.assets!) {
      expect(a.listedWeek, `${a.id} left the market`).toBeUndefined()
      expect(a.lastListing, `${a.id} remembers the lot's ad`).toEqual({ endedWeek: 107, exposedWeeks: 7 })
    }
    expect(refusal(() => unlistAsset(world, 'academy-courts')), 'and it is off, whichever stage asks').toBe(tabled('SM4'))
  })
})

describe('S2 · the market remembers a withdrawn ad for `memoryWeeks` (spec §2i)', () => {
  const M = ECONOMY.shop.secondary.memoryWeeks

  it('an ad that ran 8 weeks writes exposedWeeks 8; a re-list 5 weeks later that runs 3 more writes 8 + 3 = 11 – it RESUMED', () => {
    const world = worldOwning({ [CAR]: {} })
    listAsset(world, CAR)
    world.week = 108
    unlistAsset(world, CAR)
    expect(rowOf(world, CAR).lastListing).toEqual({ endedWeek: 108, exposedWeeks: 8 })
    world.week = 113
    listAsset(world, CAR)
    world.week = 116
    unlistAsset(world, CAR)
    expect(rowOf(world, CAR).lastListing, 'the exposure ACCUMULATES across an ad that resumed').toEqual({ endedWeek: 116, exposedWeeks: 11 })
  })

  it('the window is INCLUSIVE at `memoryWeeks` and gone one week later – asked through the one reader, freshnessCarryOf', () => {
    const row = rowOf(endedAt116(), CAR)
    expect(freshnessCarryOf(row, 116), 'the week it ended').toBe(11)
    expect(freshnessCarryOf(row, 116 + M), `${M} weeks after – the last remembered week`).toBe(11)
    expect(freshnessCarryOf(row, 116 + M + 1), `${M + 1} weeks after – forgotten`).toBe(0)
    expect(freshnessCarryOf({ id: CAR, boughtWeek: 0, paidCents: 1, valueCents: 1, entries: [] }, 5), 'never listed – nothing to remember').toBe(0)
  })

  it('re-listing on the last remembered week RESUMES (2 + 11 = 13); one week later starts FRESH (2)', () => {
    const resumed = endedAt116()
    resumed.week = 116 + M
    listAsset(resumed, CAR)
    resumed.week += 2
    unlistAsset(resumed, CAR)
    expect(rowOf(resumed, CAR).lastListing?.exposedWeeks, 'inside the window').toBe(13)

    const fresh = endedAt116()
    fresh.week = 116 + M + 1
    listAsset(fresh, CAR)
    fresh.week += 2
    unlistAsset(fresh, CAR)
    expect(rowOf(fresh, CAR).lastListing?.exposedWeeks, 'past the window – the old ad is forgotten').toBe(2)
  })
})

describe('S2 · zero draws in both commands', () => {
  it('no Math.random, no `Rng` parameter, and the same world gives the same world', () => {
    expect(listAsset.length, 'listAsset takes (world, itemId) and nothing else').toBe(2)
    expect(unlistAsset.length, 'unlistAsset takes (world, itemId) and nothing else').toBe(2)
    const run = (): string => {
      const world = worldOwning({ [CAR]: {}, 'academy-land': {}, 'academy-courts': {} })
      const spy = vi.spyOn(Math, 'random')
      try {
        listAsset(world, CAR)
        listAsset(world, 'academy-land')
        world.week = 109
        unlistAsset(world, CAR)
        unlistAsset(world, 'academy-courts')
        expect(spy, 'nothing was drawn').not.toHaveBeenCalled()
      } finally {
        spy.mockRestore()
      }
      return JSON.stringify(world)
    }
    expect(run(), 'reproducible to the byte').toBe(run())
  })
})

describe('S2 · schema v90 – the migration writes nothing (spec §2i)', () => {
  const FIX = 'tests/fixtures/saves'
  const read = (v: number): Parameters<typeof migrateSave>[0] => JSON.parse(readFileSync(`${FIX}/v${v}.json`, 'utf8'))

  it('v90 is in the ladder, and its golden fixture is the real migration\'s own output on v89.json', () => {
    // ⚠ RE-AIMED AT v91 (02.10, round 45 #5 – the first-touch latch), NOT WEAKENED: v90 is no longer the head, so the head half follows the
    // ladder (`>=`) and the recipe half compares v89's load against v90.json with ONLY the head's version number moved – which is the claim
    // v90 made («the step writes nothing»), now carried through v91's step, which writes nothing on a save whose cached ranks are not 1.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(90)
    // ⚠ RE-AIMED AGAIN AT v92 (06.10, succession S1): the v92 step writes `startYear: 2031` on every
    // older save, so the carried-recipe expectation names it beside the moved head number.
    expect(migrateSave(read(89)), 'the recipe every fixture since v25 uses').toEqual({ ...(read(90) as object), schemaVersion: SAVE_SCHEMA_VERSION, startYear: 2031 })
  })

  it('a v89 save loads with BOTH fields absent and nothing invented on any row', () => {
    const save = read(89) as unknown as Record<string, unknown>
    const rows = [
      { id: CAR, boughtWeek: 10, paidCents: 100, valueCents: 90 },
      { id: 'academy-land', boughtWeek: 1, paidCents: 5, valueCents: 5, name: 'Ace Academy' },
    ]
    save.assets = structuredClone(rows)
    const out = migrateSave(save as never)
    expect(out.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    for (const a of out.assets ?? []) {
      expect('listedWeek' in a, `${a.id}: no listing invented`).toBe(false)
      expect('lastListing' in a, `${a.id}: no memory invented`).toBe(false)
    }
    expect(out.assets, 'and nothing dropped or changed').toEqual(rows)
  })

  it('a v90 save keeps its listing and its memory through a load', () => {
    const save = read(90) as unknown as Record<string, unknown>
    const rows = [{ id: CAR, boughtWeek: 10, paidCents: 100, valueCents: 90, listedWeek: 95, lastListing: { endedWeek: 90, exposedWeeks: 6 } }]
    save.assets = structuredClone(rows)
    expect(migrateSave(save as never).assets).toEqual(rows)
  })
})
