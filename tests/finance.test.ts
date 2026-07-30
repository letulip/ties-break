import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  tierOpenFor,
  skipTournament,
  closeTournament,
  toSnapshot,
  financeWindow,
  availabilityStatus,
  KID_ID,
  PARENT_INCOME_CENTS,
  type WorldState,
} from '../src/engine/world'
import { DEFAULT_PROFILE, type FinanceWeek } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import type { SeasonEvent } from '../src/engine/season/types'

// r-gate (season-life-01b): points-based eligibility. These cases aren't about the ladder, so grant
// the kid a throwaway result worth the tier's minPoints ONLY for the enterEvent gate check, then drop
// it – enterEvent never ticks, so nothing downstream (points/rank/gear) is perturbed. local's min is
// 0, so a fresh kid needs no grant at all there.
function enterEligible(world: WorldState, event: SeasonEvent): void {
  const min = TIERS[event.tier].enterPointBand[0]
  const marker = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
}

// Part A – the persisted per-week/per-category finance aggregate (financeWeeks) and the pure
// windowing helper that feeds the Money breakdown/ledger. The headline is the 60-event-cap
// immunity: the breakdown must stay window-accurate even when a tournament-heavy stretch pushes
// finance events out of the trailing 60-event snapshot feed.

// A busy tournament season: enter every affordable event she is ELIGIBLE for and resolve each run,
// so the mixed event feed floods with match/news lines and finance events get pushed past the
// 60-event cap.
//
// RE-PINNED by ladder-up Part A (cohort pre-history): this used to enter LOCAL events only. Against
// a real cohort table the local field is genuinely the weak end of the draw, so the kid now wins it
// and outgrows the tier's [0, 85] band about two thirds of the way through – the "busy" season went
// quiet and stopped flooding the feed, which is what the helper exists to do. Following the ladder
// up (local -> regional -> national, exactly as the entry policy the econ bench uses does) restores
// the intended pressure without weakening a single assertion.
function busyTournamentSeason(seed: string, weeks: number): WorldState {
  const world = createWorld(seed) // default profile: middle background
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    for (const e of world.season) {
      if (world.entries.includes(e.id) || e.deadlineWeek < world.week) continue
      // Ladder-up: the calendar stacks tiers on a week, and she can only play one of them.
      if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
      // r-gate: only enter tiers the kid is currently eligible for; enterEvent would otherwise
      // throw for a tier she has not reached yet or has already outgrown.
      //
      // TWO LADDERS (docs/specs/two-ladders.md): this asks the ENGINE'S OWN gate rather than
      // re-deriving one, the same correction the two benches took. `isTierEligible` is the DOMESTIC
      // half only – it reads a points band – and j60/j300 no longer have a meaningful one ([0, MAX]),
      // so it waved every international event through and enterEvent threw on the rank gate behind
      // it. One gate, one answer, and a policy that cannot drift from the game.
      if (!tierOpenFor(world, e.tier)) continue
      if (world.fundsCents < TIERS[e.tier].entryFeeCents + e.travelCostCents) continue
      // Season-Life: skip events under a HARD availability block (e.g. an event scheduled in a
      // school-exam week); enterEvent would throw 'unavailable'. Fatigue is soft, so it's not skipped.
      if (availabilityStatus(world, e).level === 'blocked') continue
      enterEvent(world, e.id)
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

describe('financeWeeks — the persisted per-week finance aggregate', () => {
  it('accumulates each finance category at its week; non-financial events never create an entry', () => {
    const world = createWorld('accrue')
    // week 0 emitted only the non-financial "career started" info event, so no week-0 aggregate.
    expect(world.financeWeeks.find((w) => w.week === 0)).toBeUndefined()

    const rng = rngFromSeed(world.seed)
    tickWeek(world, rng) // week 1: parent income (+) and the base coaching cost (-)
    const w1 = world.financeWeeks.find((w) => w.week === 1)
    expect(w1).toBeTruthy()
    expect(w1!.byCategory.income).toBe(PARENT_INCOME_CENTS.middle)
    expect(w1!.byCategory.coaching).toBeLessThan(0)
  })

  it('records entry fees under entry and travel under travel', () => {
    const world = createWorld('cats')
    const rng = rngFromSeed(world.seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEligible(world, event) // charges the entry fee at week 0
    const w0 = world.financeWeeks.find((w) => w.week === 0)!
    expect(w0.byCategory.entry).toBe(-TIERS[event.tier].entryFeeCents)

    while (world.week < event.week) tickWeek(world, rng)
    const wk = world.financeWeeks.find((w) => w.week === event.week)!
    expect(wk.byCategory.travel).toBe(-event.travelCostCents)
  })

  it('prunes entries older than the 60-week trailing window (keeps week >= currentWeek - 59)', () => {
    const world = createWorld('prune')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 70; i++) tickWeek(world, rng)
    expect(world.week).toBe(70)
    const weeks = world.financeWeeks.map((w) => w.week)
    expect(Math.min(...weeks)).toBe(70 - 59) // oldest retained week is exactly week 11
    expect(Math.max(...weeks)).toBe(70)
    expect(world.financeWeeks.some((w) => w.week < 11)).toBe(false)
    // the array stays week-ascending
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b))
  })

  it('skips $0 line-items – no cash moved, no zero-valued category entry', () => {
    // ⚠ FIXTURE RE-AIMED, NOT THE ASSERTION (30.07, tune/rank-numbers). THE PROTECTED FACT IS
    // UNCHANGED and is the only thing this case has ever been about: a $0 line-item is still EMITTED
    // as an event (so the Money breakdown can explain why something cost nothing) and must still
    // never leave a 0 sitting in the `financeWeeks` aggregate.
    //
    // WHAT MOVED IS WHERE A $0 ROW COMES FROM. It used to be forced through the product-sponsorship
    // valve, which halved or zeroed a gear line for a well-ranked kid. That valve is gone - it gated
    // a domestic reward on the international table and paid a share of a corridor-scaled bill, so it
    // is now a flat annual grant instead (see ECONOMY.sponsorship). No gear line is ever $0 again,
    // and a fixture that pushes a 100k result can no longer force this state at all.
    //
    // The surviving producer is the COACHING line on a competition week: `coachWorksThisWeek` is
    // false when `coachOnEventWeeks` is off (the default) and she is in a draw, and the row is still
    // emitted at $0 - "Competition week – no coaching billed" - for exactly the reason this test
    // guards. So the fixture enters her in a tournament, which is a more honest way to reach the
    // state anyway: it is the one the shipped game actually reaches every time she plays.
    const world = createWorld('zero', { ...DEFAULT_PROFILE, background: 'middle' })
    expect(world.coachOnEventWeeks).toBe(false) // ...the precondition the $0 coaching row needs
    const rng = rngFromSeed(world.seed)
    let entered = 0
    for (let i = 0; i < 40; i++) {
      // Enter every affordable local event as its deadline nears – local's floor is 0 points, so a
      // fresh kid qualifies without any grant.
      for (const e of world.season) {
        if (e.tier !== 'local' || world.entries.includes(e.id)) continue
        if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 2) continue
        if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
        if (!tierOpenFor(world, e.tier)) continue
        if (availabilityStatus(world, e).level === 'blocked') continue
        enterEvent(world, e.id)
        entered++
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(entered).toBeGreaterThan(0) // the fixture really did put her in draws
    // $0 line-items really are being emitted...
    expect(world.events.some((e) => e.amountCents === 0 && e.category === 'coaching')).toBe(true)
    // ...but they never leave a 0 sitting in the aggregate (skipped, since no cash moved).
    for (const wk of world.financeWeeks) {
      for (const v of Object.values(wk.byCategory)) expect(v).not.toBe(0)
    }
  })
})

describe('financeWindow — pure fold over financeWeeks', () => {
  it('sums a known fixture into byCategory / income / expense / net and honours the fromWeek cutoff', () => {
    const weeks: FinanceWeek[] = [
      { week: 2, byCategory: { income: 30_000, coaching: -40_000 } }, // excluded: week < fromWeek
      { week: 5, byCategory: { income: 30_000, coaching: -50_000, travel: -9_000 } },
      { week: 9, byCategory: { entry: -4_000, sponsor: 100_000 } },
    ]
    const win = financeWindow(weeks, 5)
    expect(win.startWeek).toBe(5)
    expect(win.byCategory).toEqual({ income: 30_000, coaching: -50_000, travel: -9_000, entry: -4_000, sponsor: 100_000 })
    expect(win.incomeCents).toBe(30_000 + 100_000) // positive categories only
    expect(win.expenseCents).toBe(50_000 + 9_000 + 4_000) // magnitude of the negatives
    expect(win.netCents).toBe(win.incomeCents - win.expenseCents)
    // net always equals the signed sum of byCategory
    const signed = Object.values(win.byCategory).reduce((s, v) => s + (v ?? 0), 0)
    expect(win.netCents).toBe(signed)
  })
})

describe('snapshot finance — immune to the 60-event cap (the owner-reported regression)', () => {
  it('the season/12w breakdown counts finance the trailing 60-event feed has already dropped', () => {
    const world = busyTournamentSeason('cap-regression', 45)
    const snap = toSnapshot(world)

    // The mixed 60-event feed no longer reaches the early weeks – week-1 coaching is long gone.
    const earliestFeedWeek = Math.min(...snap.events.map((e) => e.week))
    expect(earliestFeedWeek).toBeGreaterThan(1)

    // The season aggregate still spans the whole season block from week 0...
    expect(snap.finance.season.startWeek).toBe(0)
    // ...so it counts strictly more coaching spend than the starved feed would.
    const feedCoaching = snap.events
      .filter((e) => (e.amountCents ?? 0) < 0 && e.category === 'coaching')
      .reduce((s, e) => s + -(e.amountCents ?? 0), 0)
    const aggregateCoaching = -(snap.finance.season.byCategory.coaching ?? 0)
    expect(aggregateCoaching).toBeGreaterThan(feedCoaching)

    // the 12-week window is likewise a true 12-week slice, not a starved event scrape
    expect(snap.finance.window12w.startWeek).toBe(world.week - 11)
    expect(snap.finance.window12w.expenseCents).toBeGreaterThan(0)
  })

  it('financialEvents carries only financial events, id-ascending, and is not starved by news', () => {
    const world = busyTournamentSeason('fin-events', 30)
    const snap = toSnapshot(world)
    expect(snap.financialEvents.length).toBeGreaterThan(0)
    expect(snap.financialEvents.length).toBeLessThanOrEqual(50)
    expect(snap.financialEvents.every((e) => e.amountCents !== undefined)).toBe(true)
    const ids = snap.financialEvents.map((e) => e.id)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
    // the dedicated list reaches finance events the mixed 60-event feed dropped for news
    const feedFinancialIds = new Set(snap.events.filter((e) => e.amountCents !== undefined).map((e) => e.id))
    expect(snap.financialEvents.some((e) => !feedFinancialIds.has(e.id))).toBe(true)
  })
})
