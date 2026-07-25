import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
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
// Round-8 R8-7a — entered, then OUTGROWN: entry lists close at the deadline, so a
// still-refundable (pre-deadline) entry whose tier the kid has outgrown is released
// on the weekly tick with a full refund (mirror of slice C's injury auto-withdraw).
// Pure state, ZERO RNG draws — the B1/C1 invariance freezes guard the main stream.
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

describe('R8-7a — entered-then-outgrown auto-withdraw + refund', () => {
  it('releases (refunds) a pre-deadline local entry on the tick where her points cross the band', () => {
    const w = createWorld('r8-outgrown')
    w.season = [] // controlled calendar: only the injected event exists
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id) // entered at 0 pts – inside local's [0, 85] band
    expect(w.entries).toContain(ev.id)

    // A big (simulated) result pushes her best-6 past local's ceiling of 85.
    giveKidPoints(w, 200)

    tickWeek(w, rngFromSeed(w.seed)) // week 1 – still <= deadline (4), so the entry is refundable
    expect(w.entries).not.toContain(ev.id)

    const refund = w.events.find((e) => e.week === 1 && e.text.startsWith('Entry refunded'))
    expect(refund).toBeDefined()
    expect(refund!.type).toBe('income')
    expect(refund!.amountCents).toBe(TIERS.local.entryFeeCents)

    const info = w.events.find((e) => e.week === 1 && e.type === 'info' && e.text.includes('outgrown'))
    expect(info).toBeDefined()
    expect(info!.text).toBe("Entry released – she's outgrown Local Open. Fee refunded.")
  })

  it('the refund lands in the finance ledger (income bucket) and on the snapshot ledger view', () => {
    const w = createWorld('r8-ledger')
    w.season = []
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id)
    giveKidPoints(w, 200)
    tickWeek(w, rngFromSeed(w.seed))

    // income bucket = the parent's weekly contribution + the refunded fee (middle never
    // banks the working-only sponsor cameo, and the refund reuses the 'income' category).
    const fold = financeWindow(w.financeWeeks, 0)
    expect(fold.byCategory.income).toBe(PARENT_INCOME_CENTS.middle + TIERS.local.entryFeeCents)

    const snap = toSnapshot(w)
    expect(snap.financialEvents.some((e) => e.text.startsWith('Entry refunded') && e.amountCents === TIERS.local.entryFeeCents)).toBe(true)
  })

  it('a post-deadline entry is NOT released – the list closed with her in band, the fee is committed', () => {
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
    expect(w.events.some((e) => e.type === 'info' && e.text.includes('outgrown'))).toBe(false)
  })

  it('in-band points never trigger a release', () => {
    const w = createWorld('r8-inband')
    w.season = []
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    enterEvent(w, ev.id)
    giveKidPoints(w, 50) // inside local's [0, 85]
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.entries).toContain(ev.id)
    expect(w.events.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
  })

  it('releases ONLY the outgrown tier: a still-in-band sibling entry stays', () => {
    const w = createWorld('r8-mixed')
    w.season = []
    const loc = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4, id: 'mix-local' })
    const reg = injectEvent(w, { week: 7, tier: 'regional', deadlineWeek: 5, id: 'mix-regional' })
    giveKidPoints(w, 70) // 70 pts: local (<= 85) AND regional (>= 65) both enterable
    enterEvent(w, loc.id)
    enterEvent(w, reg.id)

    giveKidPoints(w, 60) // best-6 sum 130: local outgrown (> 85), regional still in band (<= 230)
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.entries).not.toContain(loc.id)
    expect(w.entries).toContain(reg.id)
    const refunds = w.events.filter((e) => e.text.startsWith('Entry refunded'))
    expect(refunds).toHaveLength(1)
    expect(refunds[0].text).toBe('Entry refunded: Local Open')
  })
})
