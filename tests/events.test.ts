import { describe, it, expect } from 'vitest'
import {
  entryStatus,
  createWorld,
  tickWeek,
  advanceWeeks,
  enterEvent,
  withdrawEvent,
  recomputeKidRank,
  skipTournament,
  toSnapshot,
  KID_ID,
  PARENT_INCOME_CENTS,
  START_AGE_YEARS,
  type WorldState,
  pendingKnock,
  decideKnock,
} from '../src/engine/world'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type StopReason } from '../src/shared/protocol'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import { TIERS, isTierAgeOpen, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { simulateMatch } from '../src/engine/match/engine'
import type { SeasonEvent } from '../src/engine/season/types'
import type { SeasonResult } from '../src/engine/season/ranking'

/** ⚠ W4: ADVANCE THE WAY A PLAYER DOES - answering knocks as they arrive.
 *
 *  A knock BLOCKS `advanceWeeks` (it returns `['knock']` and ticks nothing) until the parent answers,
 *  which is the whole point of the feature: the owner's complaint was that training weeks «просто
 *  скипались». So a fixture that walks several weeks has to answer, exactly as the dialog does, or it
 *  stalls on the first sore ankle.
 *
 *  ⚠ IT ANSWERS 'rest', AND THAT IS THE CONSIDERED CHOICE. 'push' is the answer that changes least
 *  about the WEEK (she trains as planned) but the most about the CAREER: it multiplies the injury
 *  threshold for three weeks, and on the first draft of this helper that is exactly what happened -
 *  the fixture pushed through a knock in week 1, she tore something in week 2, and the advance under
 *  test reported 'injury' instead of the reason being asserted. Resting touches nothing these suites
 *  measure (a share of one week's development, +3 condition) and leaves the injury roll alone.
 *
 *  The protected fact is UNCHANGED: it still asserts that N weeks of advancing report the reason
 *  under test. It just no longer assumes nothing else can happen on the way. */
function advanceAnswering(world: WorldState, rng: Rng, weeks: number): StopReason[] {
  const seen = new Set<StopReason>()
  let left = weeks
  while (left > 0) {
    const before = world.week
    for (const r of advanceWeeks(world, rng, left)) seen.add(r)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    else if (world.week === before) break // a real stop, not the knock: leave it stopped
    left -= world.week - before
  }
  return STOP_PRECEDENCE.filter((r) => seen.has(r))
}


// The earliest event whose entry deadline has not yet passed.
//
// ⚠ ...AND WHOSE AGE GATE SHE CLEARS (task #17). `enterEligible` below can grant her any number of
// POINTS, in any table, but it cannot make her older, and three rungs now open at 16/16/17 against a
// career that starts at 14. These cases are about fees, refunds and duplicate entries – "the earliest
// enterable event" is fixture scaffolding, not the subject – so the filter simply says what the
// function's name already claimed. The events it skips are the ones a fourteen-year-old genuinely
// cannot enter, which is `enterEvent` working, not failing.
function firstEnterable(world: WorldState) {
  const age = START_AGE_YEARS + Math.floor(world.week / WEEKS_PER_YEAR)
  return world.season.find((e) => e.deadlineWeek >= world.week && isTierAgeOpen(e.tier, age))!
}

// r-gate (season-life-01b): points-based eligibility. These cases predate the ladder and aren't about
// it, so grant the kid throwaway results worth exactly what the rung asks ONLY for the enterEvent
// gate check, then drop them. enterEvent never ticks/recomputes, so nothing downstream
// (points/rank/gear) is perturbed – identical to the old set-and-restore trick.
//
// TWO LADDERS (docs/specs/two-ladders.md): one minPoints grant no longer covers every rung, because
// what "eligible" costs depends on which table the rung pays into.
//   * a DOMESTIC rung reads her domestic best-6 against its band – the old grant, unchanged (local's
//     min is 0, so it still needs nothing);
//   * J30, the on-ramp, is an ITF rung that reads her DOMESTIC standing, so its grant has to sit on
//     the domestic track. A marker tiered `j30` would pay into the ITF table and open nothing, which
//     is exactly what the old one-liner did once the tracks split;
//   * J60 / J300 are an ACCEPTANCE LIST: they read her ITF rank, and refuse to read a position at
//     all until she owns a counting ITF result. So they need a real international book AND
//     `recomputeKidRank` to put it in the cache the gate reads. Four J300 titles land her around
//     #21–#35 on every seed in this file – comfortably inside j300's top 50, with room for drift.
// The rank caches are saved and restored with the ledger, so the promise above still holds whole.
function enterEligible(world: WorldState, event: SeasonEvent): void {
  const def = TIERS[event.tier]
  const ledger = world.results
  const rank = world.kidRank
  const rankDomestic = world.kidRankDomestic
  const grant: SeasonResult[] = []
  if (def.enterPct === undefined) {
    const min = def.enterPointBand[0]
    // 'national' is a domestic row whatever the event is – which is the whole point for j30.
    if (min > 0) grant.push({ playerId: KID_ID, week: world.week, points: min, tier: 'national' })
  } else {
    for (let i = 0; i < 4; i++) grant.push({ playerId: KID_ID, week: world.week, points: 300, tier: 'j300' })
  }
  if (grant.length > 0) {
    world.results = [...ledger, ...grant]
    recomputeKidRank(world)
  }
  enterEvent(world, event.id)
  world.results = ledger
  world.kidRank = rank
  world.kidRankDomestic = rankDomestic
}

describe('entry validation', () => {
  it('charges the fee on enter and refunds it on withdraw, with News + ledger events', () => {
    const world = createWorld('entry')
    const event = firstEnterable(world)
    const fee = TIERS[event.tier].entryFeeCents
    const before = world.fundsCents

    enterEligible(world, event)
    expect(world.entries).toContain(event.id)
    expect(world.fundsCents).toBe(before - fee)
    // an expense (ledger) event and an entry (News) event are both emitted
    expect(world.events.some((e) => e.type === 'expense' && e.amountCents === -fee)).toBe(true)
    expect(world.events.some((e) => e.type === 'entry')).toBe(true)

    withdrawEvent(world, event.id)
    expect(world.entries).not.toContain(event.id)
    expect(world.fundsCents).toBe(before)
    expect(world.events.some((e) => e.type === 'income' && e.amountCents === fee)).toBe(true)
  })

  it('rejects a duplicate entry', () => {
    const world = createWorld('dup')
    const event = firstEnterable(world)
    enterEligible(world, event)
    expect(() => enterEvent(world, event.id)).toThrow(/already/i)
  })

  it('rejects entry once the deadline has passed', () => {
    const world = createWorld('late')
    const rng = rngFromSeed(world.seed)
    // an event a few weeks out; walk to the week AFTER its deadline but BEFORE the event
    const event = world.season.find((e) => e.week >= 5)!
    while (world.week < event.week - 1) tickWeek(world, rng)
    expect(world.week).toBeGreaterThan(event.deadlineWeek)
    expect(world.week).toBeLessThan(event.week)
    expect(() => enterEvent(world, event.id)).toThrow(/deadline/i)
  })

  it('rejects entry when funds are short', () => {
    const world = createWorld('broke')
    world.fundsCents = 10 // 10 cents — below any tier's entry fee
    const event = firstEnterable(world)
    expect(() => enterEvent(world, event.id)).toThrow(/funds/i)
  })

  it('a fresh career has no already-closed event at week 0 (round-5 item 2)', () => {
    for (const seed of ['fresh-a', 'fresh-b', 'fresh-c']) {
      const world = createWorld(seed)
      expect(world.week).toBe(0)
      for (const e of world.season) {
        expect(e.deadlineWeek).toBeGreaterThanOrEqual(1)
        expect(world.week).toBeLessThanOrEqual(e.deadlineWeek) // still enterable at start
      }
    }
  })
})

describe('weekly parent income', () => {
  it('emits an income event BEFORE costs each week, sized by family background', () => {
    for (const background of ['wealthy', 'middle', 'working'] as const) {
      const world = createWorld(`inc-${background}`, { ...DEFAULT_PROFILE, background })
      const rng = rngFromSeed(world.seed)
      const fundsBefore = world.fundsCents
      tickWeek(world, rng)
      const weekEvents = world.events.filter((e) => e.week === world.week).sort((a, b) => a.id - b.id)
      // R9-1 (re-pinned deliberately): the savings interest on the carried-in balance now opens
      // the week, so the parent contribution is the SECOND event – still before every cost.
      expect(weekEvents[0].category).toBe('interest')
      expect(weekEvents[1].type).toBe('income')
      expect(weekEvents[1].text).toContain("Parents' contribution")
      expect(weekEvents[1].amountCents).toBe(PARENT_INCOME_CENTS[background])
      const costIdx = weekEvents.findIndex((e) => e.type === 'expense')
      expect(costIdx).toBeGreaterThan(1)
      // funds moved by exactly income minus the week's net spend (income is added to funds)
      const netDelta = world.fundsCents - fundsBefore
      const totalSigned = weekEvents.reduce((s, e) => s + (e.amountCents ?? 0), 0)
      expect(netDelta).toBe(totalSigned)
    }
  })
})

describe('news match texts use short names for everyone', () => {
  it('renders the kid as "V. Last" and the opponent as "X. Last"', () => {
    const world = createWorld('short-names') // default profile: Vera Martin
    const rng = rngFromSeed(world.seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEligible(world, event)
    while (world.week < event.week) tickWeek(world, rng)
    // The tournament week pauses into a reveal; resolve it so the match events are emitted.
    expect(world.pendingTournament).toBeTruthy()
    skipTournament(world)
    const matchEv = world.events.find((e) => e.type === 'match' && e.week === event.week)!
    expect(matchEv.text).toContain('V. Martin')
    // opponent side also short-formed: an initial, a dot, a space, then a surname
    expect(matchEv.text).toMatch(/[A-Z]\. [A-Z][a-z]+/)
  })
})

describe('a tournament week the kid entered', () => {
  it('emits travel, per-round match and one tournament event, and awards ranking points', () => {
    // ⚠ SEED-WALKED by the random-draw change (28.07). This used to be the single seed
    // 'tourney-week': she met the top seed in every first round, so her run was predictable and a
    // fixed seed was safe. With a random draw an early exit banks NO points (wave B), so the
    // fixture now walks until it finds a run that scored - which is the case this test is about.
    let world!: WorldState
    let event!: SeasonEvent
    for (let i = 0; i < 30; i++) {
      const w = createWorld(`tourney-week-${i}`)
      const r = rngFromSeed(w.seed)
      const e = w.season.find((x) => x.week >= 5 && x.deadlineWeek >= w.week)!
      enterEligible(w, e)
      while (w.week < e.week) tickWeek(w, r)
      if (!w.pendingTournament) continue
      // Peek at the committed finishes without resolving: a scoring run is one she won a round of.
      const finish = w.pendingTournament.result.finishes[KID_ID]
      if (finish === undefined || finish >= Math.log2(TIERS[e.tier].drawSize)) continue
      world = w
      event = e
      break
    }
    expect(world, 'no seed in 30 produced a scoring run').toBeTruthy()
    expect(world.week).toBe(event.week)

    // travel is charged during the tick; the rest of the run is deferred to the reveal flow.
    expect(
      world.events.some((e) => e.type === 'expense' && e.week === event.week && e.text.includes('Travel')),
    ).toBe(true)
    expect(world.pendingTournament).toBeTruthy()
    // Resolve the whole run at once (the "skip tournament" path) and check the committed outcome.
    skipTournament(world)
    expect(world.pendingTournament!.finished).toBe(true)

    // one tournament summary event
    const summaries = world.events.filter((e) => e.type === 'tournament' && e.week === event.week)
    expect(summaries.length).toBe(1)

    // per-round kid match events, each replayable from its stored seed + skill snapshots
    const kidMatches = world.events.filter((e) => e.type === 'match' && e.week === event.week)
    expect(kidMatches.length).toBeGreaterThanOrEqual(1)
    for (const ev of kidMatches) {
      const m = ev.match!
      expect(m).toBeTruthy()
      expect(m.seed).toBeTruthy()
      expect([m.aId, m.bId]).toContain(KID_ID)
      const replay = simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed! })
      const winnerId = replay.winner === 0 ? m.aId : m.bId
      expect(winnerId).toBe(m.winnerId)
      expect(replay.sets.map((s) => `${s.a}-${s.b}`).join(' ')).toBe(m.score)
    }

    // the kid scored ranking points (every finish in these tiers is worth > 0)
    expect(world.results.some((r) => r.playerId === KID_ID && r.week === event.week)).toBe(true)
    // and AI results for the same event landed too (the canonical field always plays)
    expect(world.results.some((r) => r.playerId !== KID_ID && r.week === event.week)).toBe(true)
  })

  it('reports the tournament champion in the news when the kid did not win it', () => {
    // Over several seeds the kid rarely wins her first event; find one she didn't, and assert
    // a "won the ... " news line naming someone else appears that week.
    let checked = 0
    for (const seed of ['champ-a', 'champ-b', 'champ-c', 'champ-d', 'champ-e']) {
      const world = createWorld(seed)
      const rng = rngFromSeed(world.seed)
      const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
      enterEligible(world, event)
      while (world.week < event.week) tickWeek(world, rng)
      skipTournament(world)
      const kidWonIt = world.pendingTournament!.result.finishes[KID_ID] === 0
      const championLine = world.events.find((e) => e.week === event.week && / won the /.test(e.text))
      if (kidWonIt) {
        expect(championLine).toBeUndefined() // her own title is celebrated by the summary/milestone
      } else {
        expect(championLine).toBeTruthy()
        checked++
      }
    }
    expect(checked).toBeGreaterThan(0)
  })
})

describe('class-flavored expenses (round-5 item 10)', () => {
  it('working swaps the video-session line for a public-courts clinic', () => {
    const world = createWorld('flavor-working', { ...DEFAULT_PROFILE, background: 'working' })
    world.plan = { train: 85, rest: 15 } // train-heavy → train flavor list
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 200; i++) tickWeek(world, rng)
    const flavors = world.events.filter((e) => e.type === 'expense').map((e) => e.text)
    expect(flavors).not.toContain('Video session: studying her last matches')
    expect(flavors).toContain('Group clinic at the public courts')
  })

  it('wealthy adds premium recovery lines to the rest pool', () => {
    const world = createWorld('flavor-wealthy', { ...DEFAULT_PROFILE, background: 'wealthy' })
    world.plan = { train: 60, rest: 40 } // rest-heavy → rest flavor list
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 300; i++) tickWeek(world, rng)
    const flavors = new Set(world.events.filter((e) => e.type === 'expense').map((e) => e.text))
    expect(flavors.has('Physio session') || flavors.has('Massage & recovery')).toBe(true)
  })

  // ⚠ RE-AIMED TWICE, AND IT IS BACK TO WHAT IT ALWAYS SAID. Round 1 inverted this test - the coach
  // TIER was going to express the family's price level, so scaling by background as well would have
  // charged it twice. Round 2 restored it, because the owner's model is better and is a different
  // claim: the wealth corridor is not a discount for being poor, it is THE MARKET SHE TRAINS IN.
  // The same rung of coach costs different money in a working-class club, an ordinary academy and a
  // premium one, so this block's original assertion is right again and the wealthy family paying
  // most is the point rather than a side effect.
  //
  // The block's own subject was never in doubt through either round: class flavours this line. What
  // moved was only whether it flavours the amount as well as the text. It does.
  it('scales the base expense by background (working < middle < wealthy) for the same draw', () => {
    const baseCost = (background: 'working' | 'middle' | 'wealthy') => {
      const w = createWorld('bg-cost', { ...DEFAULT_PROFILE, background })
      const rng = rngFromSeed(w.seed)
      tickWeek(w, rng)
      // no entries → the only week-1 expense event is the base cost
      const ev = w.events.find((e) => e.type === 'expense' && e.week === 1)!
      return -ev.amountCents!
    }
    expect(baseCost('working')).toBeLessThan(baseCost('middle'))
    expect(baseCost('middle')).toBeLessThan(baseCost('wealthy'))
  })

  it('cohort drift + AI results are identical across backgrounds (RNG discipline extended)', () => {
    const run = (background: 'working' | 'wealthy') => {
      const w = createWorld('bg-discipline', { ...DEFAULT_PROFILE, background })
      const rng = rngFromSeed(w.seed)
      for (let i = 0; i < 60; i++) tickWeek(w, rng)
      return w
    }
    const working = run('working')
    const wealthy = run('wealthy')
    // Background only changes funds/flavor text – never the main-stream draw sequence.
    expect(working.cohort).toEqual(wealthy.cohort)
    expect(working.results.filter((r) => r.playerId !== KID_ID)).toEqual(
      wealthy.results.filter((r) => r.playerId !== KID_ID),
    )
  })
})

describe('kid counting-results transparency (round-5 item 1b)', () => {
  it('exposes the best-6 counted results whose points sum equals the standings points', () => {
    // ⚠ Wave B ("first-round loss pays ZERO") made a losing opener bank nothing, so a single
    // hard-coded seed is no longer guaranteed to produce a counting result at all – and a run that
    // scores nothing cannot exercise the transparency claim (0 === 0 passes vacuously). Walk seeds
    // until she actually WINS a match and banks something, which is the state this test is about.
    // The walk is deterministic and bounded; the assertions below are unchanged.
    let world!: WorldState
    for (let i = 0; i < 40; i++) {
      const w = createWorld(`counting-${i}`)
      const rng = rngFromSeed(w.seed)
      const event = w.season.find((e) => e.week >= 5 && e.deadlineWeek >= w.week)
      if (!event) continue
      enterEligible(w, event)
      while (w.week < event.week) tickWeek(w, rng)
      if (!w.pendingTournament) continue // injured out / withdrawn – not this test's subject
      skipTournament(w)
      if (w.results.some((r) => r.playerId === KID_ID)) {
        world = w
        break
      }
    }
    expect(world).toBeDefined()
    const snap = toSnapshot(world)
    // ⚠ RE-AIMED by the two ladders: this list explains the ITF ranking beside it, so it holds ITF
    // results only and is honestly empty until she owns one. The transparency claim - the list sums
    // to the rank it sits next to - is unchanged and is the assertion at the end.
    expect(snap.countingResults.every((c) => ['j30', 'j60', 'j300'].includes(c.tier ?? ''))).toBe(true)
    // each counted kid result carries the tier it was earned at (new r5 field)
    expect(snap.countingResults.every((c) => typeof c.tier === 'string')).toBe(true)
    // the list sum equals the kid's standings points (the whole point of the transparency)
    const kidStanding = snap.standings.find((row) => row.isKid)!
    const sum = snap.countingResults.reduce((s, c) => s + c.points, 0)
    expect(sum).toBe(kidStanding.points)
  })
})

describe('advance stop reasons', () => {
  it('stops on the entered tournament week (stopReason: tournament)', () => {
    const world = createWorld('adv-tournament')
    const rng = rngFromSeed(world.seed)
    const event = world.season.find((e) => e.week >= 5 && e.deadlineWeek >= world.week)!
    enterEligible(world, event)
    // fast-forward to the week just before the event, so advance hits it on the first tick
    while (world.week < event.week - 1) tickWeek(world, rng)
    expect(world.week).toBe(event.week - 1)

    // ⚠ W4: answering knocks on the way - see advanceAnswering.
    const stop = advanceAnswering(world, rng, 4)
    expect(world.week).toBe(event.week)
    expect(stop).toContain('tournament')
  })

  // *** RE-PINNED 25.07 (season-planner slice, round-9 leftover FIX): the deadline stop now
  // AND-s in the POINT-BAND eligibility, so the sim no longer halts for a regional/national
  // deadline the kid could not enter anyway (the owner saw it at W1/W3 with 0 pts). The old
  // assertion (a FRESH 0-point career stops for the first regional deadline) is therefore
  // inverted: a fresh kid must NOT be stopped, and a point-eligible kid must still be. ***
  it('never stops a 0-point kid for a regional+ deadline she cannot enter (round-9 fix)', () => {
    // ⚠ RE-AIMED by the two ladders (29.07). The old claim was "a 0-point kid can only enter Local",
    // which was true when ONE points ladder gated everything. There are two now: the domestic rungs
    // still open by points and in order, and the international ones are an acceptance list. A J30
    // has no acceptance bar at all - the research is explicit that an unranked thirteen-year-old
    // near home gets into one, and that the gate up the ladder is the QUEUE, not the fee. So a
    // point-less kid is legitimately stopped by a J30 deadline: she really can enter it, if the
    // family can pay for the plane. The protected fact is unchanged and is now stated exactly:
    // she is not stopped for a rung she cannot enter.
    const world = createWorld('adv-deadline')
    const rng = rngFromSeed(world.seed)
    // ample funds, no entries, ZERO ranking points -> regional (min 65) / national (min 150)
    // are both out of reach, so no deadline may interrupt the advance.
    // ⚠ RE-AIMED by the two ladders: a J30 has no acceptance bar, so a point-less kid CAN enter one
    // and a J30 deadline may legitimately stop her. What must still never stop her is a rung she
    // cannot enter, which is what is asserted now.
    const stop = advanceWeeks(world, rng, 20)
    if (stop.includes('deadline')) {
      const stoppable = world.season.filter((e) => entryStatus(world, e).level !== 'blocked')
      for (const e of stoppable) expect(['local', 'j30']).toContain(e.tier)
    }
  })

  it('stops before an imminent affordable regional+ deadline she IS eligible for', () => {
    const world = createWorld('adv-deadline')
    const rng = rngFromSeed(world.seed)
    // one counting result puts her inside the regional band [65, 230]
    world.results.push({ playerId: KID_ID, week: world.week, points: 80, tier: 'regional' })
    const stop = advanceWeeks(world, rng, 20)
    expect(stop).toContain('deadline')
    expect(world.week).toBeLessThan(20)
    const soon = world.season.some(
      (e) =>
        (e.tier === 'regional' || e.tier === 'national') &&
        !world.entries.includes(e.id) &&
        world.fundsCents >= TIERS[e.tier].entryFeeCents &&
        (e.deadlineWeek === world.week || e.deadlineWeek === world.week + 1),
    )
    expect(soon).toBe(true)
  })

  it('stops when funds are below zero (stopReason: funds)', () => {
    const world = createWorld('adv-funds')
    const rng = rngFromSeed(world.seed)
    // start deep in debt: no single sponsor gift can lift funds back to >= 0 in one tick
    world.fundsCents = -50_000_00
    const stop = advanceWeeks(world, rng, 4)
    expect(world.fundsCents).toBeLessThan(0)
    expect(stop).toContain('funds')
  })
})
