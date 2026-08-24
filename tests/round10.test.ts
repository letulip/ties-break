import { describe, it, expect } from 'vitest'
import { engineModuleSource, worldSource, worldFunction } from './worldSource'
import { readFileSync, readdirSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  withdrawEvent,
  cancelEntry,
  skipEvent,
  bookVacation,
  bookPractice,
  availabilityStatus,
  entryStatus,
  isTierEligible,
  kidPoints,
  toSnapshot,
  skipTournament,
  closeTournament,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { StopReason } from '../src/shared/protocol'
import { after, before, region, regions } from './helpers/source'

// ---------------------------------------------------------------------------
// Round 10 — the owner's playtest of the wave-3 build. Three correctness knots,
// all of them one-rule-read-twice bugs:
//
//   R10-17  the injury gate answered "is she hurt NOW?" for an event WEEKS away, so
//           every card in the 8-week horizon stayed locked long past her stated
//           return week ("out until W21" -> nothing enterable at W22+).
//   R10-5   the tier POINT BAND was re-implemented at three call sites and absent
//           from the fourth (the play week), so entry, display and resolution could
//           disagree about the same event.
//   R10-3   the resulting dead end: an entered event she had outgrown was hidden by
//           the calendar's declutter filter, which took the Withdraw control away with
//           it AND made the week look plannable while the engine still saw the entry.
//   R10-13  the escape hatch: CANCEL on a committed (post-deadline) entry, fee forfeited.
//
// ZERO new RNG draws anywhere in this round: every fix is pure state or display.
// ---------------------------------------------------------------------------

/** Add a controlled event to a world's calendar (mirrors the helper the other suites use). */
function injectEvent(
  world: WorldState,
  partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `r10-${partial.week}-${partial.tier}`,
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

function setInjury(world: WorldState, weeksRemaining: number): void {
  world.injury = {
    kind: 'ankle strain',
    severity: 'moderate',
    weeksRemaining,
    totalWeeks: weeksRemaining,
    sinceWeek: world.week,
  }
}

/** Count of MAIN-stream draws a callback consumes – the guard every round-10 fix must pass. */
function mainStreamDraws(run: (rng: () => number) => void): number {
  let n = 0
  run(() => {
    n++
    return 0.5
  })
  return n
}

// ===========================================================================
// R10-17 — the injury lock must lift exactly when the news says it does.
// ===========================================================================
describe('R10-17 — the injury gate is read against the EVENT week, not the current one', () => {
  it('blocks inside the layoff and clears AT the stated return week', () => {
    const w = createWorld('r10-17-boundary')
    w.season = []
    w.condition = 100
    setInjury(w, 5) // week 0, out 5 weeks -> the UI says "back wk 5"
    const backWeek = w.week + w.injury!.weeksRemaining
    expect(backWeek).toBe(5)

    // Every week strictly BEFORE the return week is a hard 'injured' block...
    for (let week = w.week + 1; week < backWeek; week++) {
      const ev = injectEvent(w, { week, tier: 'local', id: `inside-${week}`, deadlineWeek: w.week })
      const status = availabilityStatus(w, ev)
      expect(status.level, `W${week} must be blocked`).toBe('blocked')
      expect(status.reason).toBe('injured')
    }
    // ...and the return week itself, plus everything after it, is NOT.
    for (const week of [backWeek, backWeek + 1, backWeek + 4]) {
      const ev = injectEvent(w, { week, tier: 'local', id: `after-${week}`, deadlineWeek: w.week })
      const status = availabilityStatus(w, ev)
      expect(status.level, `W${week} must not be injury-blocked`).not.toBe('blocked')
      expect(status.reason).not.toBe('injured')
    }
  })

  // ⚠ RE-AIMED, round-17 #11, AND THE RE-AIM IS ONTO THE CLAIM THIS TEST'S OWN TITLE MAKES. It was
  // written to prove that ONE window comparison serves every surface - "the SAME boundary, one rule,
  // two surfaces" - and it used `bookVacation` as the second surface. `bookVacation` is no longer a
  // surface of that rule at all: the owner ruled that a family may travel while she is hurt
  // («люди путешествуют с травмами вообще»), so the layoff gate now applies to the FRIENDLY and not
  // to the holiday (see `assertPlannable`, which records why the block was incidental).
  //
  // So the parity claim moves to `bookPractice`, which IS still gated, and the vacation's new
  // behaviour is asserted positively rather than deleted. Nothing about the BOUNDARY changed: the
  // return week is still the first allowed week, on both surfaces that still have one.
  it('uses the SAME boundary the planner already uses (bookPractice) – one rule, two surfaces', () => {
    const w = createWorld('r10-17-planner-parity')
    w.season = []
    w.condition = 100
    w.fundsCents = 500_00
    setInjury(w, 3)
    const backWeek = w.week + 3

    // the planner's own rule: a FRIENDLY is refused inside the layoff, allowed from the return week
    expect(() => bookPractice(w, backWeek - 1, false)).toThrow('Injured')
    expect(() => bookPractice(w, backWeek, false)).not.toThrow()
    // ...and availabilityStatus answers identically for a tournament on those weeks
    const inside = injectEvent(w, { week: backWeek - 1, tier: 'local', id: 'p-in', deadlineWeek: w.week })
    const at = injectEvent(w, { week: backWeek + 1, tier: 'local', id: 'p-at', deadlineWeek: w.week })
    expect(availabilityStatus(w, inside).reason).toBe('injured')
    expect(availabilityStatus(w, at).reason).not.toBe('injured')
  })

  // ===============================================================================================
  // ⭐ ROUND-17 #11 – A FAMILY MAY TRAVEL WHILE SHE IS HURT
  // ===============================================================================================
  it('⭐ a vacation books INSIDE the layoff – the trip is rest, not tennis', () => {
    // The owner: «люди путешествуют с травмами вообще». The block was never a ruling - the comment
    // beside it argues the opposite for the condition floor ("a VACATION is rest, and refusing that
    // below the floor is how a week becomes a dead end") and the layoff arm carried no reason at all.
    // It also produced that dead end at a longer range: a twelve-week layoff was twelve weeks in
    // which nothing could be planned.
    const w = createWorld('r17-11-travel-hurt')
    w.season = []
    w.condition = 100
    w.fundsCents = 500_00
    setInjury(w, 6)
    // Every week of the layoff, including the one she is standing in the middle of.
    for (const week of [w.week + 1, w.week + 3, w.week + 5]) {
      expect(() => bookVacation(w, week, 'staycation'), `w${week} must be bookable`).not.toThrow()
    }
    expect(w.vacations).toHaveLength(3)
    // ...and the friendly on those same weeks is still refused, which is the half that stays.
    expect(() => bookPractice(w, w.week + 2, false)).toThrow('Injured')
  })

  it('the snapshot only locks the weeks she is actually out for', () => {
    const w = createWorld('r10-17-snapshot')
    w.season = []
    w.condition = 100
    setInjury(w, 2) // back at W2
    injectEvent(w, { week: 1, tier: 'local', id: 'w1', deadlineWeek: 0 })
    injectEvent(w, { week: 2, tier: 'local', id: 'w2', deadlineWeek: 0 })
    injectEvent(w, { week: 3, tier: 'local', id: 'w3', deadlineWeek: 0 })

    const up = toSnapshot(w).upcoming
    expect(up.find((e) => e.id === 'w1')!.ineligibleReason).toBe('injured')
    expect(up.find((e) => e.id === 'w2')!.ineligibleReason).toBeUndefined()
    expect(up.find((e) => e.id === 'w3')!.ineligibleReason).toBeUndefined()
    expect(up.find((e) => e.id === 'w3')!.eligible).toBe(true)
  })

  it("THE OWNER'S CASE: enter, injure, tick past the return week -> entry works again", () => {
    // "the news said she is out until week 21, but at week 22 and every week after,
    //  no tournament could be entered" – reproduced end to end.
    const w = createWorld('r10-17-owner')
    w.season = []
    w.condition = 100
    w.fundsCents = 5_000_00
    const rng = rngFromSeed(w.seed)

    const first = injectEvent(w, { week: 4, tier: 'local', id: 'before', deadlineWeek: 2 })
    enterEvent(w, first.id) // she IS enterable while healthy
    expect(w.entries).toContain(first.id)

    setInjury(w, 4) // out 4 weeks -> back at W4
    const theLayoff = w.injury! // ...and it is THIS one whose end the test is about – see below
    const backWeek = w.week + 4

    // While out, an event inside the layoff is refused – that part was always right.
    const during = injectEvent(w, { week: backWeek - 1, tier: 'local', id: 'during', deadlineWeek: 0 })
    expect(() => enterEvent(w, during.id)).toThrow('Injured')

    // Tick past the stated return week.
    while (w.week < backWeek + 1) {
      tickWeek(w, rng)
      if (w.pendingTournament) {
        skipTournament(w)
        closeTournament(w)
      }
    }
    // ⚠ RE-AIMED, NOT RELAXED (10.08, the retirement slice). This read `expect(w.injury).toBeNull()`
    // and it asserted two things at once while only meaning one. The week she comes back is the week
    // she PLAYS the tournament she entered eight lines up, and since the retirement slice ~2.7% of
    // matches end with somebody unable to continue – so a career driven through a real tournament can
    // legitimately arrive here carrying a DIFFERENT, newer injury (this fixture's does: a wrist
    // strain, onset on the return week). The claim this test has always made is that THE LAYOFF THAT
    // WAS SET really ended, and that is now asserted by its own identity rather than by the field
    // merely being empty – which is the stronger reading, because `injury === null` would also have
    // passed had the original layoff been silently replaced.
    expect(w.injury === theLayoff, 'the layoff that was set must be over').toBe(false)
    expect(w.injuryHistory.some((r) => r.kind === theLayoff.kind), 'and recorded as recovered').toBe(true)
    expect(w.week).toBeGreaterThan(backWeek)

    // ⚠ ...AND A FRESH ONE PICKED UP ON THE WAY IS CLEARED HERE, DELIBERATELY AND IN THE OPEN. A new
    // injury blocks entry for its own, correct reasons – that behaviour is pinned in C4 and in
    // tests/match-retirement.test.ts – and leaving it standing would turn this test from "the gate is
    // read against the EVENT week" into "she happened not to get hurt again", which is a different
    // question with a seed-dependent answer. Nothing about the R10-17 gate is weakened by it: the
    // assertions below are exactly the ones that were here.
    w.injury = null

    // ...and entry works again. THIS is what the owner could never do.
    const after = injectEvent(w, { week: w.week + 3, tier: 'local', id: 'after', deadlineWeek: w.week + 1 })
    expect(availabilityStatus(w, after).level).not.toBe('blocked')
    expect(() => enterEvent(w, after.id)).not.toThrow()
    expect(w.entries).toContain(after.id)
    expect(toSnapshot(w).upcoming.find((e) => e.id === after.id)!.entered).toBe(true)
  })

  it('costs ZERO main-stream draws (the gate is pure state)', () => {
    const w = createWorld('r10-17-draws')
    setInjury(w, 3)
    const ev = injectEvent(w, { week: 2, tier: 'local' })
    expect(mainStreamDraws(() => void availabilityStatus(w, ev))).toBe(0)
    expect(mainStreamDraws(() => void entryStatus(w, ev))).toBe(0)
  })
})

// ===========================================================================
// R10-5 — ONE rule for the point band. `entryStatus` is now the single gate that
// enterEvent, the snapshot and advanceWeeks all read; the band is never re-derived.
// ===========================================================================
describe('R10-5 — entry, display and the advance stop read ONE rule', () => {
  it('entryStatus folds the point band AND availability, band first', () => {
    // below the floor -> 'locked' with the threshold
    const low = createWorld('r10-5-low')
    low.condition = 100
    const nat = injectEvent(low, { week: 3, tier: 'national', deadlineWeek: 1 })
    const lockedStatus = entryStatus(low, nat)
    expect(lockedStatus.level).toBe('blocked')
    expect(lockedStatus.reason).toBe('locked')
    expect(lockedStatus.pointsToEnter).toBe(TIERS.national.enterPointBand[0])

    // ⚠ RE-AIMED 06.08 (docs/specs/ladder-floor-2026-08.md): above the ceiling used to be
    // `blocked/outgrown` and is now `outgrown` WITHOUT a block. R10-5's subject is untouched and is
    // what this case is for – one rule drives every surface – so the ceiling is still asserted here,
    // in the field it now lives in.
    const high = createWorld('r10-5-high')
    high.condition = 100
    giveKidPoints(high, 122) // the owner's figure – local's band is [0, 85]
    const loc = injectEvent(high, { week: 3, tier: 'local', deadlineWeek: 1 })
    const outgrown = entryStatus(high, loc)
    expect(outgrown.level).not.toBe('blocked')
    expect(outgrown.outgrown).toBe(true)

    // ⚠ ...AND THE PRECEDENCE CASE BELOW SWAPPED SIDES WITH IT, which is the honest consequence
    // rather than a loss. It pinned that the BAND outranks a hard availability block ("reason ===
    // 'outgrown'" on an injured week), and the band's ceiling no longer produces a reason at all –
    // so the injury is the only verdict left and it must be the one that speaks. The precedence that
    // still exists is still pinned: the LOCK half of the band outranks availability (`low` above is
    // asserted 'locked' with no injury; here the injured week reports the injury and carries the
    // ceiling as a label beside it).
    const both = createWorld('r10-5-both')
    giveKidPoints(both, 122)
    setInjury(both, 4)
    const locB = injectEvent(both, { week: 2, tier: 'local', deadlineWeek: 0 })
    const bothStatus = entryStatus(both, locB)
    expect(bothStatus.level).toBe('blocked')
    expect(bothStatus.reason).toBe('injured')
    expect(bothStatus.outgrown, 'the ceiling rides on every verdict, blocked or not').toBe(true)
  })

  // ⚠⚠ RE-AIMED 06.08 (docs/specs/ladder-floor-2026-08.md), TITLE INCLUDED, because the title was
  // half the claim. The owner's 122-point Local is no longer REFUSED – his later ruling on backlog
  // #84 is that a rung she has passed must stay playable – but "labelled by the snapshot" is the
  // half R10-5 is really about (one rule, every surface, no re-derivation) and it is asserted here
  // in full. The surface that used to prove it by THROWING now proves it by admitting her while
  // still knowing the fact.
  it("the owner's 122-point Local is playable AND labelled by every surface", () => {
    const w = createWorld('r10-5-surfaces')
    w.condition = 100
    w.fundsCents = 5_000_00
    w.season = []
    giveKidPoints(w, 122)
    const loc = injectEvent(w, { week: 3, tier: 'local', deadlineWeek: 1 })

    // surface 1: the entry is taken, and the gate carries the ceiling rather than throwing it
    expect(entryStatus(w, loc).outgrown).toBe(true)
    expect(() => enterEvent(w, loc.id)).not.toThrow()
    expect(w.entries).toEqual([loc.id])
    withdrawEvent(w, loc.id)
    // surface 2: the snapshot names the same fact, on an eligible card
    const up = toSnapshot(w).upcoming.find((e) => e.id === loc.id)!
    expect(up.eligible).toBe(true)
    expect(up.ineligibleReason).toBeUndefined()
    expect(up.outgrown).toBe(true)
    // surface 3: the advance never stops for a deadline she cannot act on
    const nat = injectEvent(w, { week: w.week + 3, tier: 'regional', deadlineWeek: w.week + 1, id: 'reg-ok' })
    expect(isTierEligible(nat.tier, kidPoints(w, 'domestic'))).toBe(true) // regional IS open at 122
    expect(availabilityStatus(w, nat).level).not.toBe('blocked')
  })

  it('the point band is derived in ONE place – no surface re-implements it', () => {
    const src = worldSource()
    // `enterPointBand` may only be read by the two pure band helpers; every gate goes
    // through entryStatus. (This is the structural guard against the R10-5 desync.)
    // ⚠ The `//` exclusion joined the `*` one when the coach branch met the two ladders: the Elite
    // gate's comment has to name `TIERS.national.enterPointBand[0]` to explain WHY its threshold is
    // 150, and prose cannot re-implement a band. This makes the guard measure what it always meant
    // - actual readers - rather than mentions. The count below is unchanged, which is the point.
    const readers = src
      .split('\n')
      .filter((l) => l.includes('enterPointBand') && !l.trim().startsWith('*') && !l.trim().startsWith('//'))
    // ⚠ RE-PINNED 3 -> 4 by the two ladders. The band gained one more legitimate reader and it is
    // INSIDE the same gate: `entryStatus`'s international branch reads it for the on-ramp rung,
    // whose bar is domestic points rather than an ITF rank. The protected fact is unchanged - no
    // SURFACE re-implements the band, every one of them still goes through entryStatus.
    // ⚠ RE-PINNED 4 -> 5 on 06.08 (docs/specs/ladder-floor-2026-08.md), and the new reader is a
    // SPLIT rather than an addition: `tierFloorOpen`'s domestic arm used to read the whole band
    // through `isTierEligible` and now reads `enterPointBand[0]` by name, because the ceiling had to
    // come OUT of the floor test when it stopped refusing. Had it not, the calendar would have shut
    // Local at 86 points while the turnstile admitted her – the R10-5 desync this guard is for,
    // arriving from the other side. Still zero surfaces: the reader is the ladder itself.
    expect(readers.length).toBeLessThanOrEqual(5)
    // enterEvent must not destructure the band itself any more
    const enterFn = worldFunction('enterEvent')
    expect(enterFn).not.toBe('')
    expect(enterFn).not.toContain('enterPointBand')
    expect(enterFn).toContain('entryStatus')
    // ...and neither may the snapshot builder
    const upcomingFn = region(src, 'function upcomingEvents', 'function computeCountingResults')
    expect(upcomingFn).not.toContain('enterPointBand')
    expect(upcomingFn).toContain('entryStatus')
  })

  it('a COMMITTED entry that survived the band crossing stays visible and playable', () => {
    // The documented owner rule (R8-7a, 25.07): a list that closed with her in band keeps her
    // on it – the fee is committed and the event still plays. What was broken is that the
    // snapshot then reported it as an ineligible 'outgrown' card, which the calendar HID.
    const w = createWorld('r10-5-committed')
    w.season = []
    w.condition = 100
    w.fundsCents = 5_000_00
    const ev = injectEvent(w, { week: 4, tier: 'local', deadlineWeek: 1 })
    enterEvent(w, ev.id) // in band (0 pts) while the list is open
    const rng = rngFromSeed(w.seed)
    tickWeek(w, rng) // W1 = the deadline week, still in band
    tickWeek(w, rng) // W2 – past the deadline
    expect(w.entries).toContain(ev.id)

    giveKidPoints(w, 122) // she outgrows local only AFTER the list closed
    // ⚠ 05.08: `releaseOutgrownEntries` used to stand at the top of this tick and had to be kept
    // off a CLOSED list. It is retired – an entry already taken is honoured on both sides of the
    // deadline now – so this line asserts the same fact against a simpler rule than it was written
    // for. The claim is unchanged and still worth guarding: nothing may take her off this list.
    tickWeek(w, rng) // W3 – past the deadline, and she stays entered
    expect(w.entries).toContain(ev.id)

    const row = toSnapshot(w).upcoming.find((e) => e.id === ev.id)!
    expect(row.entered).toBe(true) // she IS in it – the card must not vanish
    expect(row.cancellable).toBe(true) // ...and R10-13 gives her the way out

    // the play week resolves the committed run – the band gates ENTRY, not a closed list
    tickWeek(w, rng)
    expect(w.week).toBe(ev.week)
    expect(w.pendingTournament?.eventId).toBe(ev.id)
  })

  it('the calendar no longer hides an ENTERED event just because she outgrew it', () => {
    // ⚠ RE-AIMED by W2-LADDER §4: the entered-first arm MOVED, it did not weaken. visibleUpcoming
    // now delegates to the one feed rule, and `feedShows`' first clause is `e.entered ||` - the
    // R10-3 lesson carried into the new rule verbatim, and pinned there where every consumer
    // inherits it (the behavioural half is tests/tier-window.test.ts's "entered events always
    // show"). What this grep keeps asserting is that the SCREEN cannot re-grow a private filter.
    const src = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    const filter = region(src, 'const visibleUpcoming', 'const myEntries')
    expect(filter).toContain('feedShows')
    const rule = readFileSync(new URL('../src/composables/tierState.ts', import.meta.url), 'utf8')
    const shows = region(rule, 'export function feedShows', '}')
    expect(shows).toContain('e.entered ||') // an entered event is never decluttered away
  })
})

// ===========================================================================
// R10-3 — the dead end, and that it is gone.
// ===========================================================================
describe('R10-3 — the outgrown-entry dead end has a way out', () => {
  /** The exact knot: entered in band, the list closed, THEN she outgrew the tier and got tired. */
  function knot() {
    const w = createWorld('r10-3-knot')
    w.season = []
    w.condition = 100
    w.fundsCents = 20_000_00
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 2 })
    enterEvent(w, ev.id)
    const rng = rngFromSeed(w.seed)
    while (w.week <= ev.deadlineWeek) tickWeek(w, rng)
    giveKidPoints(w, 122) // outgrown, past the deadline
    w.condition = 40 // ...and worn out, so the rescue prompt wants this week for a vacation
    expect(w.entries).toContain(ev.id)
    return { w, ev, rng }
  }

  it('the old dead end really was a dead end (all three exits refused)', () => {
    const { w, ev } = knot()
    expect(() => withdrawEvent(w, ev.id)).toThrow('Cannot withdraw after the deadline')
    expect(() => bookVacation(w, ev.week, 'staycation')).toThrow('She is entered in a tournament that week')
    expect(() => bookPractice(w, ev.week, false)).toThrow('She is entered in a tournament that week')
  })

  it('cancelEntry unties it: the week becomes plannable again', () => {
    const { w, ev } = knot()
    cancelEntry(w, ev.id)
    expect(w.entries).not.toContain(ev.id)
    // a vacation on that week is now bookable – the R10-3 rescue offer finally works
    expect(() => bookVacation(w, ev.week, 'staycation')).not.toThrow()
  })

  it('...or a practice match, if the parent would rather she played', () => {
    const { w, ev } = knot()
    cancelEntry(w, ev.id)
    expect(() => bookPractice(w, ev.week, false)).not.toThrow()
  })

  it('the rescue offer can no longer point at a week the engine will refuse', () => {
    // The UI-side half of the knot: `plannable` was computed from a calendar the outgrown
    // filter had already emptied, so the rescue card offered an entered week.
    const src = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    const rows = region(src, 'const calendarRows', 'function packageLabel')
    expect(rows).toContain('!e.entered') // an entered week is never plannable
    // and the row source now includes entered-but-outgrown events (see visibleUpcoming above)
    expect(rows).toContain('visibleUpcoming')
  })
})

// ===========================================================================
// R10-13 — CANCEL on a committed entry: the fee is NOT refunded.
// ===========================================================================
describe('R10-13 — cancel a committed entry (fee forfeited)', () => {
  function committed(tier: TierId = 'local') {
    const w = createWorld('r10-13')
    w.season = []
    w.condition = 100
    w.fundsCents = 20_000_00
    const ev = injectEvent(w, { week: 6, tier, deadlineWeek: 2 }) // local, 0 pts -> in band
    enterEvent(w, ev.id)
    const rng = rngFromSeed(w.seed)
    while (w.week <= ev.deadlineWeek) tickWeek(w, rng)
    return { w, ev, rng }
  }

  it('drops the entry and does NOT hand the fee back', () => {
    const { w, ev } = committed()
    const before = w.fundsCents
    cancelEntry(w, ev.id)
    expect(w.entries).not.toContain(ev.id)
    expect(w.fundsCents).toBe(before) // the list closed with her on it – the fee is gone
    expect(w.events.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
  })

  it('says so in the news, in player copy (short dash, no Cyrillic)', () => {
    const { w, ev } = committed()
    cancelEntry(w, ev.id)
    const beat = w.events.find((e) => e.week === w.week && e.text.startsWith('Cancelled '))
    expect(beat).toBeDefined()
    expect(beat!.text).toContain('entry fee forfeited')
    expect(beat!.text).not.toMatch(/[—А-Яа-яЁё]/)
  })

  it('BEFORE the deadline it is a full refund instead (one command, the refund rule intact)', () => {
    const w = createWorld('r10-13-open')
    w.season = []
    w.condition = 100
    w.fundsCents = 20_000_00
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 4 })
    const before = w.fundsCents
    enterEvent(w, ev.id)
    expect(w.fundsCents).toBe(before - TIERS.local.entryFeeCents)
    cancelEntry(w, ev.id) // still refundable -> the withdrawal path
    expect(w.entries).not.toContain(ev.id)
    expect(w.fundsCents).toBe(before)
    expect(w.events.some((e) => e.text.startsWith('Entry refunded'))).toBe(true)
  })

  it('refuses once the event week has started – that week belongs to skipEvent', () => {
    const { w, ev, rng } = committed()
    while (w.week < ev.week) tickWeek(w, rng)
    expect(w.week).toBe(ev.week)
    expect(() => cancelEntry(w, ev.id)).toThrow()
  })

  it('is fee-coherent with skipEvent: both forfeit the entry fee', () => {
    // skipEvent (R9-9) pulls out ON the event week: fee forfeited, travel refunded (she never
    // boards). cancelEntry pulls out BEFORE it: same fee rule, and travel was never charged.
    const a = committed()
    while (a.w.week < a.ev.week) tickWeek(a.w, a.rng)
    const beforeSkip = a.w.fundsCents
    skipEvent(a.w, a.ev.id)
    expect(a.w.fundsCents).toBe(beforeSkip + a.ev.travelCostCents) // travel back, fee gone

    const b = committed()
    const beforeCancel = b.w.fundsCents
    cancelEntry(b.w, b.ev.id)
    expect(b.w.fundsCents).toBe(beforeCancel) // nothing back: no travel charged yet, fee gone
  })

  it('refuses an event she is not entered in', () => {
    const w = createWorld('r10-13-none')
    w.season = []
    const ev = injectEvent(w, { week: 6, tier: 'local', deadlineWeek: 2 })
    expect(() => cancelEntry(w, ev.id)).toThrow('Not entered in this event')
  })

  it('costs ZERO main-stream draws', () => {
    const { w, ev } = committed()
    expect(mainStreamDraws(() => cancelEntry(w, ev.id))).toBe(0)
  })

  it('is reachable from the UI: protocol message, store action, and a no-refund confirm', () => {
    // ⚠ RE-AIMED by R2-09 – the EXTRACTION, not the assertion. The command union left the barrel
    // for src/shared/protocol/messages.ts; the module-set reader finds it wherever it now lives.
    const protocol = engineModuleSource('../shared/protocol')
    expect(protocol).toContain("type: 'cancelEntry'")
    const worker = readFileSync(new URL('../src/worker/sim.worker.ts', import.meta.url), 'utf8')
    expect(worker).toContain("case 'cancelEntry'")
    const store = readFileSync(new URL('../src/stores/game.ts', import.meta.url), 'utf8')
    expect(store).toContain('async cancelEntry(')
    const screen = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(screen).toContain('game.cancelEntry(')
    // the confirm must state the fee is NOT refunded, and the control must say Cancel
    const ask = region(screen, 'function askCancelEntry', 'function runConfirm')
    expect(ask).toMatch(/not refunded/i)
    expect(ask).not.toMatch(/[—А-Яа-яЁё]/)
  })
})

// ===========================================================================
// R10-16 — the empty popup, and the injury dialog's corner radius.
// ===========================================================================

/** The radius a rule actually renders, in px, whether it is written as a number or as a rung of
 *  THE RADIUS LADDER (owner, 29.07 — every radius in the sheet is a `--radius-*` token now).
 *  Resolving the token rather than accepting any token is the point: a test that only checked
 *  "it uses some variable" would pass on `var(--radius-pill)`, which is exactly the mistake the
 *  radius tests below exist to catch. */
function resolveRadius(css: string, rule: string): number {
  const direct = /border-radius:\s*(\d+(?:\.\d+)?)px/.exec(rule)
  if (direct) return Number(direct[1])
  const token = /border-radius:\s*var\((--[\w-]+)\)/.exec(rule)?.[1]
  if (!token) return NaN
  const root = region(css, ':root {', '\n}\n')
  const declared = new RegExp(`\\n\\s*${token}:\\s*([^;]+);`).exec(root)?.[1]?.trim()
  return Number(/^(\d+(?:\.\d+)?)px$/.exec(declared ?? '')?.[1] ?? NaN)
}

describe('R10-16 — no popup may render without copy', () => {
  const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')

  it('the stop toast is gated on HAVING copy, not merely on a stop reason', () => {
    const gate = region(app, 'const showStopToast', 'const showSeasonSummary')
    // The empty popup: stopReason 'injury' was excluded from STOP_REASON_TEXT (it owns a blocking
    // dialog) but NOT from the toast's condition, so the toast rendered with an empty <span>.
    expect(gate).toContain('stopReasonText')
  })

  it('every StopReason either has toast copy or an owning dialog – and none is both', () => {
    const reasons: StopReason[] = ['tournament', 'deadline', 'funds', 'season-end', 'injury', 'medical']
    const map = region(app, 'const STOP_REASON_TEXT', 'const stopReasonText')
    const owned: Record<string, boolean> = {
      tournament: true, // TournamentFlow
      'season-end': true, // SeasonSummaryDialog
      injury: true, // InjuryStopDialog
    }
    for (const r of reasons) {
      const hasCopy = map.includes(`${r}:`) || map.includes(`'${r}':`)
      expect(hasCopy || owned[r], `StopReason '${r}' has neither copy nor an owner`).toBe(true)
      if (owned[r]) expect(hasCopy, `StopReason '${r}' would render an empty toast`).toBe(false)
    }
  })

  it('the injury dialog uses the squarer radius of the top popups, not a pill', () => {
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
    const block = after(css, '.injury-stop {')
    const rule = before(block, '}')
    expect(rule).toContain('border-radius')
    // the top popups (.stop-toast / .recovered-banner) sit at the panel rung; the capsule idiom is
    // var(--radius-pill) – see the two tests below for why it is a token and not a bare 999px.
    // ⚠ RE-AIMED by the css-dry pass (docs/specs/css-dry-audit.md): `.stop-toast` and
    // `.recovered-banner` were eleven identical declarations written out twice and are now ONE
    // rule, so the radius this reads lives in a shared body. The selector list deliberately ENDS
    // with `.stop-toast`, so `.stop-toast {` still names the rule that declares it and the fact
    // being pinned – the injury dialog wears the top popups' radius, not a pill – is unchanged.
    // What the merge actually strengthened: the two popups can no longer drift apart at all, so
    // there is no longer a version of this file where .recovered-banner and .stop-toast disagree
    // about the radius that this test then checks only one of.
    // ⚠ RE-AIMED AGAIN by the radius ladder (owner, 29.07: "надо приводить в порядок всё с чётными
    // значениями"). Both rules now say `var(--radius-panel)` instead of a bare `10px`, so reading
    // a number straight out of the rule finds nothing. It resolves the token off :root instead —
    // which pins MORE than before: the two must still agree, the value must still be squarer than
    // a pill, AND the radius has to be a rung of the ladder rather than a number someone typed.
    const radius = resolveRadius(css, rule)
    const toast = after(css, '.stop-toast {')
    const toastRadius = resolveRadius(css, before(toast, '}'))
    expect(radius).toBe(toastRadius)
    expect(radius).toBeLessThanOrEqual(12)
    expect(radius % 2, 'every rung of the radius ladder is even').toBe(0)
  })

  // ---------------------------------------------------------------------------
  // THE CAPSULE-vs-CIRCLE CONVENTION (owner 26.07, a follow-up to the item above).
  //
  // He went hunting for the round border, expected to find "50%", found a bare `999px`, and asked
  // for every 999px to become 50%. They are not interchangeable: on a WIDE element 999px is clamped
  // by the browser to half the HEIGHT, so the ends are true semicircles and the sides stay flat (a
  // capsule); 50% takes half the WIDTH as well, which is an ELLIPSE. Measured in the browser on the
  // real chip: 294 x 21 px, so the capsule radius renders as 10.7px and 50% would render as
  // 147 x 10.7px – a lens. The same swap turns .prob-bar into a leaf and the sound switch's track
  // into an egg. So the answer to the ask was a NAME (the magic number is now findable by grep),
  // not a value change, plus the one squarer radius he actually wanted. Both halves are pinned here.
  // ---------------------------------------------------------------------------
  // ⚠ RE-AIMED by U4 (screen I): `.prob-bar` left this list because it left the app. The design's
  // match panel has no win-probability bar – its Momentum sparkline is the same reading – so the
  // rule was deleted along with the rest of the viewer's sheet rules when screen I's styles moved
  // into MatchViewer.vue. The protected fact is unchanged and now reaches FURTHER than it did: the
  // capsule radius is still a named token, a bare `999px` declaration is still forbidden, and the
  // sweep for one now covers every component's scoped block as well as the sheet – which is where
  // screen styles live from U0 onward, and therefore where the next bare 999px would have hidden.
  const CAPSULES = ['.pill', '.option-pill', '.tf-replay-round', '.tf-badge', '.sound-switch-track', '.tab-row', '.tab-pill']

  it('the capsule radius is a named token, and no bare 999px is left to hunt for', () => {
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
    expect(css).toContain('--radius-pill: 999px')
    // Every other mention must be prose in a comment, never a declaration – that is the whole point.
    // Components too, now that a screen's styles live in its SFC.
    const sfcs = (dir: URL): [string, string][] => {
      const out: [string, string][] = []
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) out.push(...sfcs(new URL(`${e.name}/`, dir)))
        else if (e.name.endsWith('.vue')) out.push([e.name, readFileSync(new URL(e.name, dir), 'utf8')])
      }
      return out
    }
    const componentSources = sfcs(new URL('../src/components/', import.meta.url))
    expect(componentSources.length, 'the component sweep found no SFCs').toBeGreaterThan(10)
    for (const [name, text] of [['src/style.css', css] as [string, string], ...componentSources]) {
      const declarations = text
        .split('\n')
        .filter((l) => l.includes('999px') && l.includes('border-radius'))
      expect(declarations, name).toEqual([])
    }
    // EVERY occurrence of the selector, not the first: `.bt-tabs .tab-pill` (a flex-only override)
    // sits ~200 lines above `.tab-pill` itself, so a plain indexOf reads the wrong block and the
    // test lies about a passing file. Learned the hard way one run before this comment existed.
    const bodies = (sel: string): string[] => regions(css, `${sel} {`, '}')
    for (const sel of CAPSULES) {
      const declaring = bodies(sel).filter((b) => b.includes('border-radius'))
      expect(declaring.length, `${sel} declares a radius somewhere`).toBeGreaterThan(0)
      for (const body of declaring) expect(body, sel).toContain('border-radius: var(--radius-pill)')
    }
  })

  it('the availability chip is the one pill that is NOT a capsule (owner: "make this one less round")', () => {
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
    const rule = after(css, '.avail-chip {')
    // ⚠ RE-AIMED by the radius ladder (owner, 29.07): the chip says `var(--radius-chip)` now
    // instead of a bare `6px`, so the number is read through :root. The owner's 6 did NOT move —
    // it was already even and it is the rung the whole chip family sits on — and the bounds below
    // are untouched, so this still fails if anyone rounds the chip back toward the capsule.
    const radius = resolveRadius(css, before(rule, '}'))
    // Squarer than the capsule it would otherwise inherit from .pill. The bound is the MEASURED
    // rendered capsule radius (10.7px at the chip's 21px height): anything at or above it is not a
    // visible change, which is why 10px – the panel radius – was rejected as too subtle to see.
    // The owner picked 6 off a rendered 10 / 8 / 6 comparison; the range stays a range, so a later
    // taste change does not have to touch this test.
    expect(radius).toBeLessThan(10.7)
    expect(radius).toBeGreaterThan(3) // still a chip, not a box
  })
})

// ===========================================================================
// R10-14 — VERIFIED CORRECT, pinned so nobody "fixes" it.
//
// ⚠ RE-PINNED 6 → 9 (26.07, MATCH BASE RAISE: straightSets 1 → 2, hardMatch 2 → 3). This is the
// owner's own reference run – two straight-sets wins and a three-setter at a Local – and it is the
// headline number of the change: the per-match half went 4 → 7 (2 + 2 + 3), the ladder half is
// unchanged at 2. Nothing was "fixed" here; the knob moved by decision.
// Same case, same numbers, in tests/fatigueReference.test.ts + docs/specs/fatigue-reference.md.
//
// ⚠ RE-PINNED 9 → 12 (03.08, W2-WINDOW's DOMESTIC RE-PRICE: tierMatchFatigue local 0 → 1, the
// owner's «мы могли бы легко брать больше condition за них... чуть сложнее и интереснее»). Same
// reference run, one more lever moved: the per-match half went 7 → 10 (3 + 3 + 4), the ladder half
// is unchanged at 2 for the second time running. Nothing was "fixed" here either.
// ===========================================================================
describe('R10-14 — three Local matches cost exactly 12 condition (domestic repriced, pinned)', () => {
  it('10 per-match + 2 ladder = 12', async () => {
    const { matchDrain, tournamentRunStrain } = await import('../src/engine/condition')
    const run = [{ score: '6-4 6-4' }, { score: '6-3 6-2' }, { score: '6-4 3-6 7-5' }]
    const perMatch = run.reduce((s, m) => s + matchDrain('local', m.score), 0)
    expect(perMatch).toBe(10)
    expect(tournamentRunStrain('local', run)).toBe(12)
  })
})

// ===========================================================================
// Invariance — none of the above may move the weekly draw sequence.
// ===========================================================================
describe('round-10 invariance — the main weekly stream is untouched', () => {
  it('a career that cancels a committed entry every chance it gets draws the same as one that never does', () => {
    function draws(cancel: boolean): number[] {
      const w = createWorld('r10-invariance')
      w.fundsCents = 500_000_00
      const seen: number[] = []
      const base = rngFromSeed(w.seed)
      const rng = () => {
        const v = base()
        seen.push(v)
        return v
      }
      for (let i = 0; i < 24; i++) {
        const points = kidPoints(w, 'domestic')
        for (const e of w.season) {
          if (e.week <= w.week || w.week > e.deadlineWeek || w.entries.includes(e.id)) continue
          if (entryStatus(w, e).level === 'blocked') continue
          if (w.season.some((x) => x.week === e.week && w.entries.includes(x.id))) continue
          if (!isTierEligible(e.tier, points)) continue
          try {
            enterEvent(w, e.id)
          } catch {
            /* one per week / funds */
          }
        }
        if (cancel) {
          for (const id of [...w.entries]) {
            const e = w.season.find((x) => x.id === id)
            if (e && w.week > e.deadlineWeek && e.week > w.week) cancelEntry(w, id)
          }
        }
        tickWeek(w, rng)
        if (w.pendingTournament) {
          skipTournament(w)
          closeTournament(w)
        }
      }
      return seen
    }
    const a = draws(false)
    const b = draws(true)
    expect(b.length).toBe(a.length)
    expect(b).toEqual(a)
  })

  it('advanceWeeks still reads the same one rule for its deadline stop', () => {
    const w = createWorld('r10-advance-stop')
    w.season = []
    w.fundsCents = 500_00
    w.condition = 100
    // a regional deadline next week, but she is 0 pts (locked) -> no stop
    injectEvent(w, { week: 3, tier: 'regional', deadlineWeek: 1 })
    // R11-1: advanceWeeks reports the SET of reasons the week stopped it, not a single one.
    const stop: StopReason[] = advanceWeeks(w, rngFromSeed(w.seed), 4)
    expect(stop).not.toContain('deadline')
  })
})
