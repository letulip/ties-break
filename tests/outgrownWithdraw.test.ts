import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  cancelEntry,
  arrivalStatus,
  recomputeKidRank,
  tierOutgrown,
  financeWindow,
  toSnapshot,
  KID_ID,
  PARENT_INCOME_CENTS,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// R8-7a — entered, then OUTGROWN.
//
// ⚠⚠ RE-AIMED 05.08 (fix/outgrown-entry), NOT WEAKENED, AND THIS COMMENT IS THE REASON.
//
// This file used to pin the OPPOSITE of what it pins now: R8-7a released a still-refundable
// (pre-deadline) entry the moment either ceiling closed under her, refunded the fee and wrote an
// info beat. Five tests asserted that release in detail. The owner played into it —
//
//   «моя уже 22 летняя выиграла 2 w50 подряд и ее автоматом сняли с 3-го письмом без объяснения
//    причины – я понимаю, что она переросла, но это ощущается очень странно. Надо поправить.»
//
// — and the ruling is that an entry ALREADY TAKEN is honoured. In the sport, acceptance into a draw
// is not revoked because your ranking improved between the entry deadline and the tournament: you
// play, and it is your last event at that level. A rung closing governs what she may enter NEXT.
//
// NOTHING HERE IS DELETED. Every claim the old file made that survives the ruling is still asserted
// (a post-deadline entry is untouched; an in-band entry is untouched; a sibling entry is untouched)
// and the three that the ruling INVERTS are asserted in their new direction, plus the three facts
// the old behaviour made unreachable: she PLAYS it, the fee stays committed, and no letter and no
// feed row claim she pulled out. The cases are the same cases; the expected answers moved.
// ---------------------------------------------------------------------------

// Add a controlled event to a world's calendar (id-targeted, so the generated season
// around it is irrelevant). deadlineWeek defaults to week - 2 (the engine convention).
function injectEvent(world: WorldState, partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number }): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `inj-${partial.week}-${partial.tier}`,
    week: partial.week,
    tier: partial.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek ?? partial.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

function giveKidPoints(world: WorldState, points: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
}

describe('R8-7a re-aimed — an entry already taken is HONOURED', () => {
  it('a pre-deadline entry SURVIVES the tick on which her points cross the band', () => {
    const w = createWorld('r8-outgrown')
    w.season = [] // controlled calendar: only the injected event exists
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id) // entered at 0 pts – inside local's [0, 85] band
    expect(w.entries).toContain(ev.id)

    // A big (simulated) result pushes her best-6 past local's ceiling of 85.
    giveKidPoints(w, 200)

    tickWeek(w, rngFromSeed(w.seed)) // week 1 – inside the deadline (4), where the release used to fire
    expect(w.entries).toContain(ev.id)
    // ...and none of the three things the release used to write exists.
    expect(w.events.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
    expect(w.events.some((e) => e.type === 'info' && e.text.startsWith('Entry released'))).toBe(false)
    expect(w.events.some((e) => e.type === 'entry' && e.text.startsWith('Withdrew'))).toBe(false)
  })

  it('and she PLAYS it – the week resolves as a tournament, with the verdict saying it is outgrown', () => {
    const w = createWorld('r8-plays')
    w.season = []
    w.fundsCents = 1_000_000_00
    w.condition = 100
    const ev = injectEvent(w, { week: 4, tier: 'local', deadlineWeek: 2 })
    enterEvent(w, ev.id)
    giveKidPoints(w, 200) // past local's ceiling while the list is still open
    // The arrival verdict is the R12-3 one, and it now governs BOTH sides of the deadline.
    expect(arrivalStatus(w, ev).outgrown).toBe(true)
    expect(arrivalStatus(w, ev).verdict).toBe('play')
    advanceWeeks(w, rngFromSeed(w.seed), 4)
    expect(w.week).toBe(4)
    expect(w.pendingTournament).not.toBeNull()
  })

  it('the fee stays COMMITTED – no refund reaches the ledger or the snapshot', () => {
    const w = createWorld('r8-ledger')
    w.season = []
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id)
    giveKidPoints(w, 200)
    tickWeek(w, rngFromSeed(w.seed))

    // income bucket = the parent's weekly contribution alone (the fee is not handed back).
    const fold = financeWindow(w.financeWeeks, 0)
    expect(fold.byCategory.income).toBe(PARENT_INCOME_CENTS.middle)

    const snap = toSnapshot(w)
    expect(snap.financialEvents.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
  })

  it('the parent can still take her out himself – the escape hatch is the exit, and it refunds', () => {
    // ⚠ THE HALF THE RULING DEPENDS ON. Honouring the entry is only honest if declining it stays
    // possible: R10-13's `cancelEntry` is the parent's own door, and inside the deadline it is a
    // full-refund withdrawal. The engine stopped deciding; the player did not stop being able to.
    const w = createWorld('r8-hatch')
    w.season = []
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id)
    giveKidPoints(w, 200)
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.entries).toContain(ev.id)
    cancelEntry(w, ev.id)
    expect(w.entries).not.toContain(ev.id)
    const refund = w.events.find((e) => e.text.startsWith('Entry refunded'))
    expect(refund).toBeDefined()
    expect(refund!.amountCents).toBe(TIERS.local.entryFeeCents)
    // ...and because HE did it, the feed says so in his verb.
    expect(w.events.some((e) => e.type === 'entry' && e.text.startsWith('Withdrew from Local Open'))).toBe(true)
  })

  it('a post-deadline entry is untouched – unchanged by the ruling, and now the same rule', () => {
    const w = createWorld('r8-closed')
    w.season = []
    const ev = injectEvent(w, { week: 4, tier: 'local', deadlineWeek: 1 })
    enterEvent(w, ev.id)
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng) // week 1 (deadline week) – 0 pts, nothing to release
    expect(w.entries).toContain(ev.id)

    giveKidPoints(w, 200) // she outgrows local only AFTER the list closed
    tickWeek(w, rng) // week 2 – past the deadline: no release, no refund
    expect(w.entries).toContain(ev.id)
    expect(w.events.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
    expect(w.events.some((e) => e.type === 'info' && e.text.startsWith('Entry released'))).toBe(false)
  })

  it('in-band points change nothing either – the two sides of the ceiling now agree', () => {
    const w = createWorld('r8-inband')
    w.season = []
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id)
    giveKidPoints(w, 50) // inside local's [0, 85]
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.entries).toContain(ev.id)
    expect(w.events.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
  })

  it('a mixed pair: the outgrown entry and the in-band sibling BOTH stand', () => {
    const w = createWorld('r8-mixed')
    w.season = []
    const loc = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4, id: 'mix-local' })
    const reg = injectEvent(w, { week: 7, tier: 'regional', deadlineWeek: 5, id: 'mix-regional' })
    giveKidPoints(w, 70) // 70 pts: local (<= 85) AND regional (>= 65) both enterable
    enterEvent(w, loc.id)
    enterEvent(w, reg.id)

    giveKidPoints(w, 60) // best-6 sum 130: local outgrown (> 85), regional still in band (<= 230)
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.entries).toContain(loc.id)
    expect(w.entries).toContain(reg.id)
    expect(w.events.filter((e) => e.text.startsWith('Entry refunded'))).toHaveLength(0)
  })

  it('the LADDER ceiling behaves identically to the domestic one – the two must not diverge', () => {
    // ⚠ THE OLD COMMENT'S OWN DEMAND, KEPT: `outgrewTier` (domestic band) and `tierOutgrown` (the
    // sliding window) "are the same event for the player and must have the same consequence". They
    // did, as a release; they still do, as no release. This is the case the OWNER hit – a W rung
    // closed by the ladder, not by the domestic band – and it is the one that used to raise a letter.
    const w = createWorld('r8-ladder')
    w.season = []
    w.fundsCents = 9_999_999_00
    w.week = 8 * 52 + 10 // her age-22 season
    for (let i = 0; i < 8; i++) {
      w.results.push({ playerId: KID_ID, week: w.week - 6 - i, points: 30, tier: 'w50' })
    }
    recomputeKidRank(w)
    const ev = injectEvent(w, { week: w.week + 6, tier: 'w50', deadlineWeek: w.week + 4 })
    enterEvent(w, ev.id)
    expect(w.offers.filter((o) => o.kind === 'entry')).toHaveLength(1) // the registration letter

    // Two W50 titles: the points close the rung under her while the list is still open.
    w.results.push({ playerId: KID_ID, week: w.week - 1, points: TIERS.w50.points[0], tier: 'w50' })
    w.results.push({ playerId: KID_ID, week: w.week, points: TIERS.w50.points[0], tier: 'w50' })
    recomputeKidRank(w)
    expect(tierOutgrown(w, 'w50')).toBe(true) // the ladder ceiling HAS closed under her
    tickWeek(w, rngFromSeed(w.seed))

    expect(w.entries).toContain(ev.id)
    // ...and the inbox has exactly ONE letter about this event: the one saying she is entered.
    const letters = w.offers.filter((o) => o.kind === 'entry')
    expect(letters).toHaveLength(1)
    expect((letters[0].terms as { cancelled?: boolean }).cancelled).toBeUndefined()
  })
})
