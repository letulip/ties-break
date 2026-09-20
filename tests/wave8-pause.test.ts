// THE PREGNANCY, WAVE 8 – T3: THE PAUSE AND THE MONTHS (life/wave-8;
// docs/plans/life-wave-8-builder-2026-09.md §2 T3, constants in `ECONOMY.motherhood`).
//
// T2 shipped the hazard, the `'expecting'` beat and the record. This is what the record DOES: from
// `world.pregnancy.pausesWeek` she stops entering tournaments, and the weeks go on passing.
//
// THREE CLAIMS, AND THE SECOND IS THE ONE THIS FILE EXISTS FOR:
//
//   1. THE CLOSE RIDES THE **ONE GATE**. `pauseCovering` is a branch of `availabilityStatus`, which
//      `entryVerdict` calls, which `entryStatus` / `tierVerdict` / `enterEvent` / the snapshot / the
//      advance stop all come through. §A asks the REAL gate and never a re-implementation of it.
//   2. ⚠⚠ IT IS THE **OPPOSITE OF THE INJURY LAYOFF**. A layoff auto-withdraws her from the entries
//      it covers and refunds them (`releaseEntry(world, id, 'injury')`); the pause releases NOTHING –
//      «already-booked events inside the window play out through the standing machinery». §B walks a
//      committed entry THROUGH the pause to its own week and plays it.
//   3. WEEKS TICK, with a thinner surface and no new machinery – the college precedent. §C advances
//      across the pause and asserts the household did not stop: the bills, the staff and the diary.
//
// §D is the one feed row the week the entries close (a DRAFT string, T8's table). §E is the
// zero-draw net: a KEY COUNT with a positive control, never an alignment comparison (wave 3's
// measured finding, the wave-4 brief's §0.1 law).
//
// MUTATION LEDGER – every arm run red-first against THIS file, applied by a scripted edit with an
// `APPLIED=yes` receipt and reverted by md5. ⚠ THE COUNTS ARE **MEASURED** REDS, NOT PREDICTIONS:
//   ARM 1  `pauseCovering`'s window read at `world.week` instead of  → 8 RED: every gate case in §A,
//          `week` – the R10-17 mistake, and the shape that turns       §B.2's arrival case and §E.1
//          the pause into a trap
//   ARM 2  the pause branch moved BELOW the blackout arm in          → 2 RED: §A.7's off-season case
//          `availabilityStatus` (the ranking slot, and the only        and §A.3, which asks about the
//          half of the slot a test can see – see §A.7)                 weeks past the due date
//   ARM 3  `releaseEntry(world, id, 'injury')` added to the tick     → 2 RED: both of §B's walks –
//          after `landPregnancyPause`, for every entry the window      the committed entry and the
//          covers – THE INJURY BUILT A SECOND TIME, the arm this       still-refundable one
//          file exists for
//   ARM 4  `>=` flipped to `>` in `pauseCovering` (off by one)       → 3 RED: §A.1, §A.2, §A.3
//   ARM 5  the week test AND the receipt dropped from               → 2 RED: §D.1's once-ness and
//          `landPregnancyPause`, so the row fires every week          §D.3's real walk
//   ARM 6  the pause branch deleted from `availabilityStatus`       → 6 RED: every gate case in §A
//          entirely                                                   plus §B.2
//   ARM 7  `resolveMasseur` stood down while a pregnancy stands –   → 1 RED: §C.1 – «she is off tour,
//          the household stopping WITH her, which is the mistake       the household is not» is a
//          §C exists to forbid                                         claim, not a decoration
//
// ⚠⚠ ONE HARNESS FAILURE IS IN THIS LEDGER ON PURPOSE. ARM 2 is a MOVE, and the first script did it
// as two edits (delete, then insert) – so its revert replaced the empty string and threw, leaving
// `medical.ts` mutated under the next two arms. ARM 3's first run therefore measured 3 RED, two of
// which were ARM 2's; the harness was re-cut as a single move-and-move-back with an md5 check at both
// ends, the tree was restored, a clean 17-green baseline was re-run, and every arm above was measured
// again on it. The contaminated 3 is recorded rather than quietly replaced: an arm measured on a tree
// that still carries the previous arm is not a measurement (CLAUDE.md's own «prove the arm contains
// the change and its reader», arriving from the other side).

// ⚠ A PASSTHROUGH RECORDER, NOT A STUB – wave 3's §B apparatus, verbatim and for its reason (see
// tests/wave8-pregnancy.test.ts, one task back). Every draw is the engine's own; the mock exists only
// so §E can COUNT the keys a step reached.
const rngKeys = vi.hoisted(() => [] as string[])
vi.mock('../src/engine/rng', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/rng')>()
  return {
    ...actual,
    rngFromSeed: (seed: string) => {
      rngKeys.push(seed)
      return actual.rngFromSeed(seed)
    },
  }
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  arrivalStatus,
  availabilityStatus,
  closeTournament,
  createWorld,
  enterEvent,
  entryStatus,
  kidAgeExact,
  landPregnancyPause,
  pauseCovering,
  pregnancyChanceAt,
  rollPregnancy,
  skipTournament,
  tickWeek,
  toSnapshot,
  PREGNANCY_PAUSE_DETAIL,
  type WorldState,
} from '../src/engine/world'
// ⚠ `tierVerdict` IS NOT ON THE `engine/world` BARREL – it is `world/medical.ts`'s own export and
// `world/snapshot.ts` imports it straight from there. Imported the same way rather than widened: the
// barrel's public API is «hundreds of files» wide (CLAUDE.md) and a test does not get to grow it.
import { tierVerdict } from '../src/engine/world/medical'
import { rngFromSeed } from '../src/engine/rng'
import { isOffSeasonWeek, TIER_LADDER } from '../src/engine/season/calendar'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { LoveEpisode } from '../src/shared/protocol'

// ⚠⚠ THE BRIEF'S OWN LITERALS, TRANSCRIBED AND NEVER READ OFF `ECONOMY.motherhood` – wave 3's ARM 2
// law, inherited through T2's own §BRIEF block: an expectation read out of the thing under test moves
// with it, so a silent retune of `playsOnWeeks` has to walk past THIS line.
const BRIEF = { playsOnWeeks: 8, termWeeks: 31 } as const

beforeEach(() => {
  rngKeys.length = 0
})

// -------------------------------------------------------------------------------------------------
// FIXTURES
// -------------------------------------------------------------------------------------------------

/** The FIRST week she reads at or above `years` – walked on the engine's own clock (T2's helper). */
function weekAtAge(world: WorldState, years: number): number {
  for (let w = 0; w < 40 * 52; w++) {
    if (kidAgeExact(w, world.profile.birthMonth, world.profile.birthDay) >= years) return w
  }
  throw new Error(`no week reaches age ${years}`)
}

/** A married row of the v83 shape – `latchedWeek` non-null, `endedWeek` null (T2's helper). */
function married(sinceWeek: number, latchedWeek: number): LoveEpisode {
  return {
    id: `p:${sinceWeek}`, sinceWeek, endedWeek: null, knownWeek: sinceWeek + 2, wants: 'open',
    partnerId: `p:${sinceWeek}`, publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek, partnerName: 'Anton',
  }
}

/** A married career standing at `age`, funded, fit, and with an EMPTY calendar – every case builds
 *  the events it needs, so nothing the season generator happens to schedule can decide a verdict. */
function wedded(seed: string, age = 28): WorldState {
  const world = createWorld(seed)
  const week = weekAtAge(world, age)
  world.season = []
  world.week = week
  world.loveEpisodes = [married(week - 104, week - 52)]
  world.condition = 100
  world.fundsCents = 5_000_00
  return world
}

/** A controlled event on a world's calendar (round10.test.ts's helper, one wave on). */
function injectEvent(
  world: WorldState,
  partial: { week: number; tier?: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `t3-${partial.week}-${partial.tier ?? 'local'}`,
    week: partial.week,
    tier: partial.tier ?? 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek ?? partial.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** ⭐⭐ THE PAUSE WEEK A CASE IS POSED ON, CHOSEN THROUGH THE **REAL GATE** AND NOT BY ARITHMETIC.
 *
 *  ⚠ THE FIXTURE MUST NOT BE POSED ON AN OFF-SEASON OR EXAM WEEK, or «she is open at `pausesWeek` − 1»
 *  would be asserted about a week the game shuts for everybody – a case that passes for the wrong
 *  reason on some seeds and fails for the wrong reason on others. So the pair of weeks is probed with
 *  `entryStatus` on a world with NO pregnancy: if both are open, they are a fair boundary to close. */
function openPairFrom(world: WorldState, from: number): number {
  const before = world.season
  for (let w = from; w < from + 80; w++) {
    world.season = []
    const a = injectEvent(world, { week: w - 1, id: 'probe-a' })
    const b = injectEvent(world, { week: w, id: 'probe-b' })
    const open = entryStatus(world, a).level !== 'blocked' && entryStatus(world, b).level !== 'blocked'
    world.season = before
    if (open) return w
  }
  throw new Error(`no open pair of weeks from ${from}`)
}

/** The record T2's `rollPregnancy` writes, hand-built on the BRIEF's own arithmetic so a case can
 *  choose the week it is posed on. `support` is `null` – the true reading of a card nobody answered
 *  (T1's own note), and no `lifeLog` row is raised, so nothing here blocks a tick. */
function expectingFrom(world: WorldState, pausesWeek: number): WorldState {
  world.pregnancy = {
    episodeId: world.loveEpisodes[0].id,
    announcedWeek: pausesWeek - BRIEF.playsOnWeeks,
    pausesWeek,
    dueWeek: pausesWeek + BRIEF.termWeeks,
    support: null,
    // ⚠ v85 T6 – null here on purpose: §A walks the REAL pause week and reads the capture back.
    rankAtPause: null,
  }
  return world
}

/** A married career parked on a week whose pregnancy uniform is a real HIT, on the engine's own
 *  stream and at the engine's own age-shaped chance (T2's `onHitWeek`, verbatim in spirit). */
function onHitWeek(base: string): WorldState {
  for (let i = 0; i < 200; i++) {
    const seed = i === 0 ? base : `${base}-${i}`
    const probe = createWorld(seed)
    const to = weekAtAge(probe, 35)
    for (let w = weekAtAge(probe, 24); w < to; w++) {
      probe.week = w
      const chance = pregnancyChanceAt(probe)
      if (chance > 0 && rngFromSeed(`${seed}:life:pregnancy:${w}`)() < chance) {
        const world = createWorld(seed)
        world.season = []
        world.week = w
        world.loveEpisodes = [married(w - 104, w - 52)]
        world.condition = 100
        world.fundsCents = 5_000_00
        return world
      }
    }
  }
  throw new Error(`no pregnancy hit inside the window for any seed from ${base}`)
}

/** Tick one week and answer anything the reveal opens, so a walk cannot stall on a tournament. */
function tickThrough(world: WorldState, rng: () => number): void {
  tickWeek(world, rng)
  if (world.pendingTournament) {
    skipTournament(world)
    closeTournament(world)
  }
}

// =================================================================================================
// A. THE ENTRIES CLOSE – on the ONE gate, at the record's own week, and nowhere else
// =================================================================================================
describe('wave 8 T3 A – the pause is a branch of `availabilityStatus`, read at the EVENT\'s week', () => {
  it('⭐ the record the ENGINE writes is the one the gate reads – `pausesWeek` is not re-derived', () => {
    // The whole chain, once: T2's hazard fires on a real hit week, writes the record, and the two
    // dates on it are the brief's own arithmetic. Every case below poses a record on this shape.
    const world = onHitWeek('w8-t3-chain')
    const announced = world.week
    rollPregnancy(world)
    const p = world.pregnancy
    expect(p, 'the hazard fired on the week the fixture found').not.toBeNull()
    expect(p!.announcedWeek, 'she told him this week').toBe(announced)
    expect(p!.pausesWeek, 'and she plays on for the drafted eight').toBe(announced + BRIEF.playsOnWeeks)
    expect(p!.dueWeek, 'the birth is the term past the pause').toBe(p!.pausesWeek + BRIEF.termWeeks)
    // ⚠ AND THE GATE READS THAT FIELD RATHER THAN RE-COMPUTING IT: move the record's own date and
    // the close moves with it. This is what «you read it; you do not recompute it» means mechanically
    // – a second site that knew `playsOnWeeks` would ignore this edit.
    p!.pausesWeek += 20
    expect(pauseCovering(world, p!.pausesWeek - 1), 'the window followed the record').toBeNull()
    expect(pauseCovering(world, p!.pausesWeek), 'and opens where the record says').not.toBeNull()
  })

  it('⭐⭐⭐ OPEN at `pausesWeek` − 1 and SHUT at `pausesWeek`, through `entryStatus` itself', () => {
    const world = wedded('w8-t3-boundary')
    const pausesWeek = openPairFrom(world, world.week + 6)
    const before = injectEvent(world, { week: pausesWeek - 1, id: 'before' })
    const at = injectEvent(world, { week: pausesWeek, id: 'at' })
    // ⚠⚠ THE CONTROL FIRST, ON THESE TWO EVENTS: with no pregnancy both weeks are hers. Without it
    // «shut at `pausesWeek`» would be satisfied by an exam week, an off-season week or an empty
    // wallet, and the case would pass while proving nothing about the pause.
    expect(entryStatus(world, before).level, 'control: the week before is open').not.toBe('blocked')
    expect(entryStatus(world, at).level, 'control: the pause week is open too').not.toBe('blocked')
    expectingFrom(world, pausesWeek)
    expect(entryStatus(world, before).level, 'she plays into the early months').not.toBe('blocked')
    expect(entryStatus(world, at)).toMatchObject({
      level: 'blocked',
      reason: 'unavailable',
      detail: PREGNANCY_PAUSE_DETAIL,
    })
  })

  it('and it does not re-open – every week from the pause on is shut, out past the due date', () => {
    // ⚠ THE «NAMES NO RETURN» CLAIM, MECHANICALLY. The window has no upper bound in this wave: the
    // record's own lifetime IS the window, and T5/T6 are what clear it. So a week months past the
    // birth is refused exactly as the first one is.
    const world = wedded('w8-t3-open-ended')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    const due = world.pregnancy!.dueWeek
    for (const week of [pausesWeek, pausesWeek + 1, pausesWeek + 12, due, due + 10, due + 40]) {
      const event = injectEvent(world, { week, id: `shut-${week}` })
      expect(entryStatus(world, event).level, `W${week} must be shut`).toBe('blocked')
      expect(entryStatus(world, event).detail, `W${week} must say why`).toBe(PREGNANCY_PAUSE_DETAIL)
    }
    // ...and clearing the record is the ONE thing that re-opens them, which is the seam T6 will use.
    world.pregnancy = null
    const after = injectEvent(world, { week: due + 12, id: 'reopened' })
    expect(entryStatus(world, after).level, 'the window closes with the record').not.toBe('blocked')
  })

  it('⭐⭐ THE ONE GATE: `enterEvent` refuses with the gate\'s own sentence, and takes no money', () => {
    const world = wedded('w8-t3-one-gate')
    const pausesWeek = openPairFrom(world, world.week + 6)
    const event = injectEvent(world, { week: pausesWeek + 2, id: 'refused', deadlineWeek: pausesWeek + 1 })
    expect(() => enterEvent(world, event.id), 'control: she could enter it').not.toThrow()
    // back out the control entry so the refusal below is about the pause and not about a duplicate
    world.entries = world.entries.filter((id) => id !== event.id)
    const funds = world.fundsCents
    const entries = [...world.entries]
    expectingFrom(world, pausesWeek)
    // ⚠ THE TURNSTILE THROWS THE GATE'S OWN `detail`, which is what makes this the ONE gate rather
    // than a second one that happens to agree: `enterEvent` re-reads `entryStatus` and quotes it.
    expect(() => enterEvent(world, event.id)).toThrow(PREGNANCY_PAUSE_DETAIL)
    expect(world.fundsCents, 'a refused entry charges nothing').toBe(funds)
    expect(world.entries, 'and books nothing').toEqual(entries)
  })

  it('⭐⭐ a RUNG\'s card is untouched – the pause is a fact about a WEEK, not about a rung', () => {
    // `tierVerdict` asks the same `entryVerdict` with the availability tail OFF, which is where a
    // world-level condition belongs NOT to be: `entryVerdict`'s own note measured 27 disagreements the
    // day one was let in, «every one of them ALL rungs of one world at once». A layoff behaves the
    // same way, and so must this.
    const world = wedded('w8-t3-rung')
    const pausesWeek = openPairFrom(world, world.week + 6)
    const beforeRefusals = TIER_LADDER.map((t) => tierVerdict(world, t).detail)
    expectingFrom(world, pausesWeek)
    expect(
      TIER_LADDER.map((t) => tierVerdict(world, t).detail),
      'no rung learned about the pregnancy',
    ).toEqual(beforeRefusals)
    expect(
      TIER_LADDER.filter((t) => tierVerdict(world, t).detail === PREGNANCY_PAUSE_DETAIL),
      'and none of them says the pause',
    ).toEqual([])
  })

  it('⭐⭐⭐ IT IS THE **EVENT\'S** WEEK, NOT TODAY\'S – the week she announces, the window is already shut', () => {
    // ⚠⚠ THE TRAP THIS PREVENTS, and the reason the R10-17 reading is load-bearing here. Read at
    // `world.week`, the gate would stay OPEN for the eight weeks she is still playing – and she could
    // commit to a tournament eight months out that nothing in this wave would ever take her back off.
    // She would arrive to play it at full term. Read at the event's week, the far end is shut the
    // moment she says it, and the near weeks stay hers.
    const world = wedded('w8-t3-event-week')
    const pausesWeek = openPairFrom(world, world.week + 10)
    expectingFrom(world, pausesWeek)
    expect(world.week, 'she is standing before the pause, still playing').toBeLessThan(pausesWeek)
    const near = injectEvent(world, { week: pausesWeek - 2, id: 'near' })
    const far = injectEvent(world, { week: pausesWeek + 24, id: 'far', deadlineWeek: world.week + 1 })
    expect(entryStatus(world, near).level, 'a week inside the early months is hers').not.toBe('blocked')
    expect(entryStatus(world, far).detail, 'a week deep in the term is already refused TODAY').toBe(PREGNANCY_PAUSE_DETAIL)
    expect(() => enterEvent(world, far.id), 'and the turnstile agrees today').toThrow(PREGNANCY_PAUSE_DETAIL)
  })

  it('the slot: BELOW the layoff, ABOVE the week-level blackouts', () => {
    const world = wedded('w8-t3-rank')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    // ABOVE the blackout: an off-season week inside the window says the PAUSE, not «the tour is
    // closed». The larger truth is the one the card prints.
    let offSeason = pausesWeek
    while (!isOffSeasonWeek(offSeason)) offSeason++
    const shut = injectEvent(world, { week: offSeason, id: 'off-season' })
    expect(availabilityStatus(world, shut).detail, 'the pause out-ranks the closed tour').toBe(PREGNANCY_PAUSE_DETAIL)
    // BELOW the layoff: a layoff is the fresher news and it names a return week – the file's own
    // sentence, which is what puts the pause under it.
    world.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 6, totalWeeks: 6, sinceWeek: world.week }
    const hurt = injectEvent(world, { week: world.week + 1, id: 'hurt' })
    expect(availabilityStatus(world, hurt).reason, 'a layoff still speaks first').toBe('injured')
  })
})

// =================================================================================================
// B. ⚠⚠ ALREADY-BOOKED EVENTS PLAY OUT – the OPPOSITE of the injury layoff
// =================================================================================================
describe('wave 8 T3 B – the pause releases NOTHING', () => {
  it('⭐⭐⭐ an entry taken BEFORE the announcement, for a week INSIDE the window, survives and plays', () => {
    const world = wedded('w8-t3-booked')
    const rng = rngFromSeed('w8-t3-booked:walk')
    const pausesWeek = openPairFrom(world, world.week + 6)
    // She enters it while the calendar is still hers – the deadline is real and the fee is charged.
    const event = injectEvent(world, { week: pausesWeek + 3, id: 'committed', deadlineWeek: world.week + 1 })
    enterEvent(world, event.id)
    expect(world.entries, 'the commitment is on the record').toContain(event.id)
    const afterFee = world.fundsCents
    expectingFrom(world, pausesWeek)
    // ⚠⚠ THE CLAIM: nothing takes it back off her. Walk the weeks – the pause arrives, passes, and
    // the entry is still there on the morning of the tournament. ARM 3 (a release added to
    // `landPregnancyPause`) is what this loop catches.
    // ⚠ THE LOOP STOPS ON THE **EVE**, and the first draft of it did not, which is worth the line:
    // the play week itself CONSUMES the entry (`finalizeTournament` takes her off the list once the
    // tournament has been played), so an assertion inside the last iteration fails on the engine
    // doing exactly what it should. Measured on the first run of this file.
    while (world.week + 1 < event.week) {
      tickThrough(world, rng)
      expect(world.entries, `W${world.week}: the entry is still hers`).toContain(event.id)
    }
    expect(world.week + 1, 'the walk reached the eve of the tournament').toBe(event.week)
    expect(world.entries, 'and on the eve it is still hers').toContain(event.id)
    expect(world.week, 'which is well past the week the entries closed').toBeGreaterThanOrEqual(pausesWeek)
    tickThrough(world, rng)
    expect(world.week, 'the walk reached the tournament').toBe(event.week)
    // ...and it PLAYED: the week produced a tournament row, which is the standing machinery working
    // rather than anything this task wrote.
    expect(
      world.events.some((e) => e.type === 'tournament' && e.week === event.week),
      'the tournament resolved on its own week',
    ).toBe(true)
    // ⚠⚠ AND NO RELEASE WAS EVER WRITTEN ABOUT IT. `releaseEntry` refunds the fee and stamps BOTH
    // rows it emits with `entryRef` – the income row and the feed line – so the absence of any row
    // carrying this entry's id is the exact, structural statement of «nothing took her off the list».
    // ⚠ NOT A FUNDS COMPARISON, and the first draft of this line was one: she WON money at the
    // tournament (measured – funds ended higher than they started), so «the wallet did not grow» is
    // not the same claim at all and would have gone red on the engine working.
    expect(
      world.events.filter((e) => e.entryRef?.id === event.id),
      'the pause releases nothing – no release row exists about this entry',
    ).toEqual([])
    expect(
      world.events.filter((e) => e.category === 'income' && (e.text ?? '').startsWith('Entry refunded')),
      'and nothing was refunded on any entry',
    ).toEqual([])
    expect(afterFee, 'the fee really was charged when she entered').toBeLessThan(5_000_00)
  })

  it('the ARRIVAL gate is not given the pause – the play week asks about her BODY', () => {
    // `arrivalStatus` answers «what will this entered week actually do», and its two refusals are the
    // layoff and the doctor. A pause added there would be the release built by another route: the
    // week would resolve as a walkover on an entry nothing had returned the fee for.
    const world = wedded('w8-t3-arrival')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    const event = injectEvent(world, { week: pausesWeek + 1, id: 'plays' })
    expect(entryStatus(world, event).level, 'she may not ENTER it').toBe('blocked')
    expect(arrivalStatus(world, event).verdict, 'but an entry already made PLAYS').toBe('play')
  })

  it('⚠⚠ and nothing ANYWHERE in the tick releases a STILL-REFUNDABLE entry when the pause arrives', () => {
    // ⚠ THE SHARPEST SHAPE OF THE MISTAKE, and the reason this case is not the one above with fewer
    // weeks: `releaseEntry` REFUSES past the deadline, so an entry whose list has closed is safe from
    // a mis-built release by accident rather than by design. The dangerous entry is the one that is
    // still refundable ON the pause week – exactly the one an injury-shaped implementation would pull
    // her out of and hand the money back for. So the fixture keeps the deadline open across the pause
    // and walks the REAL tick, which catches a release added anywhere in the week and not only in
    // `landPregnancyPause`.
    const world = wedded('w8-t3-refundable')
    const rng = rngFromSeed('w8-t3-refundable:walk')
    const pausesWeek = openPairFrom(world, world.week + 6)
    const event = injectEvent(world, { week: pausesWeek + 6, id: 'still-open', deadlineWeek: pausesWeek + 3 })
    enterEvent(world, event.id)
    expectingFrom(world, pausesWeek)
    const before = [...world.entries]
    while (world.week <= pausesWeek + 1) tickThrough(world, rng)
    expect(world.week, 'the walk really crossed the pause week').toBeGreaterThan(pausesWeek)
    expect(world.week, '...with her list still open').toBeLessThanOrEqual(event.deadlineWeek)
    expect(world.entries, 'a refundable entry inside the window is still hers').toEqual(before)
    expect(
      world.events.filter((e) => e.entryRef !== undefined),
      'and no release row was written about anything',
    ).toEqual([])
  })
})

// =================================================================================================
// C. THE WEEKS TICK – she is off tour, the household is not
// =================================================================================================
describe('wave 8 T3 C – no latch, no fast-forward machinery, no new kind of week', () => {
  it('⭐⭐ the parent still lives: the bills, the staff and the diary all move across the pause', () => {
    const world = wedded('w8-t3-ticks')
    // A hired masseur so the STAFF line is a real row rather than an absence asserted.
    world.masseurHired = true
    const rng = rngFromSeed('w8-t3-ticks:walk')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    const startWeek = world.week
    const startFunds = world.fundsCents
    const target = pausesWeek + 8
    while (world.week < target) tickThrough(world, rng)
    expect(world.week, 'time moved, and it moved the whole way').toBe(target)
    expect(world.fundsCents, 'the family kept spending').not.toBe(startFunds)
    // The two bills, both asked about weeks INSIDE the pause so an assertion cannot be satisfied by
    // the weeks before it.
    const inPause = (category: string) =>
      world.events.filter((e) => e.category === category && e.week >= pausesWeek && e.week <= target)
    expect(inPause('coaching').length, 'the court was billed every week of the pause').toBeGreaterThan(0)
    expect(inPause('staff').length, 'and so was the masseur').toBeGreaterThan(0)
    // ...and the diary still has something to say about a week she did not play.
    const snap = toSnapshot(world)
    expect(snap.diary, 'the diary is still being written').toBeTruthy()
    expect(snap.week, 'and the snapshot is the week the world is on').toBe(target)
    expect(startWeek, 'the fixture really did start before the pause').toBeLessThan(pausesWeek)
  })

  it('⚠ and nothing new blocks the week – no latch, no pending state of its own', () => {
    const world = wedded('w8-t3-no-latch')
    const rng = rngFromSeed('w8-t3-no-latch:walk')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    const record = { ...world.pregnancy! }
    while (world.week < pausesWeek + 4) tickThrough(world, rng)
    // ⚠ THE RECORD IS UNTOUCHED BY THE PAUSE, field for field. T3 writes nothing to it: the dates
    // were settled at the announcement, `support` is the parent's and `returnPlan` is T6's.
    expect(world.pregnancy, 'ticking through the pause changes no field of it').toEqual(record)
  })
})

// =================================================================================================
// D. THE PAUSE WEEK'S ONE FEED ROW – texture, thin on purpose (⚠ the string is a DRAFT, T8's table)
// =================================================================================================
describe('wave 8 T3 D – the week the entries close is announced once', () => {
  // ⚠ STRUCTURAL AND NOT A TEXT MATCH: the row is found by its TYPE and its STAMP, so T8's rewording
  // of a DRAFT string cannot quietly empty this whole section (a pin that reads copy is a pin the
  // wording pass breaks).
  const pauseRows = (world: WorldState) =>
    world.events.filter((e) => e.type === 'life' && e.lifeKind === 'expecting')

  it('fires ON `pausesWeek`, exactly once, and is kept past the prune', () => {
    const world = wedded('w8-t3-row')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    world.week = pausesWeek - 1
    landPregnancyPause(world)
    expect(pauseRows(world), 'the week before says nothing').toEqual([])
    world.week = pausesWeek
    landPregnancyPause(world)
    expect(pauseRows(world).length, 'the pause week says it once').toBe(1)
    landPregnancyPause(world)
    expect(pauseRows(world).length, 'and a second pass on the same week does not double it – the receipt').toBe(1)
    const row = pauseRows(world)[0]
    expect(row.keep, 'the arc outlives the sixty-week prune, so the row must too').toBe(true)
    expect(row.amountCents, '⚠ a life row is never a purchase – no cents on this week').toBeUndefined()
    world.week = pausesWeek + 1
    landPregnancyPause(world)
    expect(pauseRows(world).length, 'and the week after adds nothing').toBe(1)
  })

  it('a career with no pregnancy never sees it', () => {
    const world = wedded('w8-t3-row-control')
    for (let i = 0; i < 5; i++) {
      world.week += 1
      landPregnancyPause(world)
    }
    expect(pauseRows(world), 'nothing to announce').toEqual([])
  })

  it('and the row lands in a real WALK, not only when it is called by hand', () => {
    const world = wedded('w8-t3-row-walk')
    const rng = rngFromSeed('w8-t3-row-walk:walk')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    while (world.week < pausesWeek + 3) tickThrough(world, rng)
    const rows = pauseRows(world)
    expect(rows.length, 'the tick pipeline raised it').toBe(1)
    expect(rows[0].week, 'on the record\'s own week').toBe(pausesWeek)
  })
})

// =================================================================================================
// E. ZERO DRAWS – a KEY COUNT with a positive control, never an alignment comparison
// =================================================================================================
describe('wave 8 T3 E – the pause moves no stream, and MAIN least of all', () => {
  /** MAIN-stream draws a callback consumes (round10.test.ts's own guard). */
  function mainStreamDraws(run: (rng: () => number) => void): number {
    let n = 0
    run(() => {
      n++
      return 0.5
    })
    return n
  }

  it('⚠⚠ the gate and the pause step derive NO key at all – counted, with a positive control', () => {
    const world = wedded('w8-t3-keys')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    const event = injectEvent(world, { week: pausesWeek + 1, id: 'counted' })
    rngKeys.length = 0
    expect(pauseCovering(world, event.week), 'the window is the thing under test').not.toBeNull()
    expect(rngKeys, 'the window read derives nothing').toEqual([])
    world.week = pausesWeek
    landPregnancyPause(world)
    expect(rngKeys, 'and neither does the pause step').toEqual([])
    // ⚠ THE POSITIVE CONTROL: the recorder is live, and it is live in THIS file. Without it an empty
    // list is equally good evidence that the mock was never wired up.
    const hit = onHitWeek('w8-t3-keys-control')
    rngKeys.length = 0
    rollPregnancy(hit)
    expect(
      rngKeys.filter((k) => k.includes(':life:pregnancy:')),
      'the recorder sees a real draw when one happens',
    ).toEqual([`${hit.seed}:life:pregnancy:${hit.week}`])
  })

  it('⚠⚠ and nothing on the refusal path touches MAIN', () => {
    const world = wedded('w8-t3-main')
    const pausesWeek = openPairFrom(world, world.week + 6)
    expectingFrom(world, pausesWeek)
    const event = injectEvent(world, { week: pausesWeek + 1, id: 'main' })
    expect(mainStreamDraws(() => void availabilityStatus(world, event)), 'the availability gate').toBe(0)
    expect(mainStreamDraws(() => void entryStatus(world, event)), 'the entry gate').toBe(0)
    expect(mainStreamDraws(() => void tierVerdict(world, 'local')), 'the rung card').toBe(0)
    expect(
      mainStreamDraws(() => {
        world.week = pausesWeek
        landPregnancyPause(world)
      }),
      'and the pause step',
    ).toBe(0)
    // the counter itself works – the same positive control the key net carries
    expect(mainStreamDraws((rng) => void rng()), 'the counter fires when a draw is taken').toBe(1)
  })
})
