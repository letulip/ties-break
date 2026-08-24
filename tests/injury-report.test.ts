// ⭐⭐ R2-02 – THE INJURY REPORT IS FACTS, AND THE FACTS COME OFF A WALKED WORLD.
//
// `InjuryStopDialog` recovered four domain facts out of the news feed's ENGLISH: the cancelled
// entries by `startsWith(RELEASE_LINE_PREFIX.injury)` (then sliced and `.replace`d to get the
// tournament's name back out of the sentence), the money by a RAW literal `startsWith('Entry
// refunded')`, the forfeits off an 8-week `upcoming` window, and – the one half that was already
// right – the circumstance off `WorldEvent.match.retiredId`. The first of those had already gone
// blind once, on 05.08, when `releasedBy` split the release sentence in two and nobody repointed the
// reader: a 9-week layoff released two Local Opens, refunded both fees, and the popup said
// "Nothing". A copy edit must not be able to break a domain fact.
//
// So `Snapshot.injuryReport` states them, and this file asserts that the state it is built from is
// the state the engine really produced. ⚠ NOTHING HERE IS HAND-BUILT: the retirement is found by
// running real draws through `runTournament` and revealed through the world's own reveal path, and
// the withdrawal arm enters real events off the real calendar and opens the layoff through
// `onsetInjury`, the same function `rollInjury` calls.
//
// ⚠ MUTATION ARMS – each projected field deleted in `buildInjuryReport`, and the test that went red:
//   * `kind` forced to 'off-court'      -> "a real mid-match retirement" red (kind + title source)
//   * `oppName` dropped                 -> "a real mid-match retirement" red (names the girl)
//   * `stage`/`eventLabel` dropped      -> "a real mid-match retirement" red (the round she reached)
//   * `cancelled` emptied               -> "the entries the layoff cancelled" red
//   * `refundCents` forced to 0         -> "the entries the layoff cancelled" red (the money)
//   * `stranded` emptied                -> "the entries the layoff stranded" red
// The mounted half of the net lives in tests/component/injury-cancelled-row.test.ts, including the
// wording mutation that is the whole point of the type.
import { describe, expect, it } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  entryStatus,
  skipTournament,
  closeTournament,
  kidMatchPlayer,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { onsetInjury } from '../src/engine/world/injury'
import { stageLabel } from '../src/engine/world/labels'
import { BODY_REGIONS } from '../src/engine/body'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS } from '../src/engine/season/calendar'
import { runTournament } from '../src/engine/season/tournament'
import { rivalMatchPlayer } from '../src/engine/season/rival'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { MatchPlayer } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'

/** A real career, eight weeks in, with money so nothing below is really about bankruptcy. */
function base(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.fundsCents = 500_000_00
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 8; i++) tickWeek(world, rng)
  return world
}

/** ⚠ THE LAYOFF LENGTH IS SEARCHED FOR, NOT ASSERTED INTO EXISTENCE (the shape
 *  `injury-cancelled-row.test.ts` already uses): `onsetInjury` draws severity and weeks-out off the
 *  stream it is handed, so a sub-stream seed is picked whose draw yields the length this test needs.
 *  The generator, the order and the arity are untouched, and the injury that lands is one the engine
 *  could really have rolled. */
function seedForLayoff(world: WorldState, min: number): string {
  for (let i = 0; i < 400; i++) {
    const probe = JSON.parse(JSON.stringify(world)) as WorldState
    onsetInjury(probe, rngFromSeed(`layoff-probe:${i}`), 'week', BODY_REGIONS)
    if ((probe.injury?.totalWeeks ?? 0) >= min) return `layoff-probe:${i}`
  }
  throw new Error(`no draw produced a layoff of ${min}+ weeks`)
}

function enterable(world: WorldState, from: number, to: number) {
  return world.season
    .filter(
      (e) =>
        e.week > from &&
        e.week <= to &&
        e.deadlineWeek >= world.week &&
        entryStatus(world, e).level !== 'blocked',
    )
    .sort((a, b) => a.week - b.week)
}

/** A career entered for two tournaments on CONSECUTIVE weeks, ticked to the first of them – so both
 *  lists have closed and neither week has resolved. Lifted from `injury-cancelled-row.test.ts`,
 *  where its own note explains why the seed is searched for rather than pinned: which rungs a
 *  calendar puts side by side is the calendar's business. */
function consecutivePair() {
  for (let s = 0; s < 30; s++) {
    const state = base(`report-stranded-${s}`)
    const options = enterable(state, state.week + 2, state.week + 20)
    const first = options.find((a) => options.some((b) => b.week === a.week + 1))
    if (!first) continue
    const second = options.find((b) => b.week === first.week + 1)!
    enterEvent(state, first.id)
    enterEvent(state, second.id)
    const rng = rngFromSeed(state.seed)
    let ok = true
    while (state.week < first.week) {
      state.fundsCents = Math.max(state.fundsCents, 200_000_00)
      tickWeek(state, rng)
      if (state.week === first.week) break
      if (state.pendingTournament || state.entries.length !== 2 || state.injury) {
        ok = false
        break
      }
    }
    if (ok && state.week === first.week && state.entries.length === 2 && !state.injury) {
      return { state, pair: { first, second } }
    }
  }
  throw new Error('no seed produced two entered tournaments on consecutive weeks')
}

/** SHE STOPPED ON COURT, found by playing real draws until one of them ends that way – the same
 *  search `round23-retirement-news.test.ts` uses, then revealed through the world's own path so
 *  `finalizeTournament` opens the layoff exactly as a player's tap would. */
function driveKidRetirement(world: WorldState, tier: TierId) {
  const event = world.season.find((e) => e.tier === tier)!
  const kid = kidMatchPlayer(world)
  const field = world.cohort.slice(0, TIERS[tier].drawSize).map((p) => rivalMatchPlayer(p, event.surface))
  const players: Record<string, MatchPlayer> = { [KID_ID]: kid }
  for (const p of field) players[p.id] = p
  for (let s = 0; s < 900; s++) {
    const result = runTournament(event, field, kid, `dto-kidret-${tier}-${s}`, rngFromSeed(`dto-kidret-rng-${s}`))
    const m = result.matches.find((r) => r.retiredId === KID_ID)
    if (!m) continue
    world.pendingTournament = { eventId: event.id, result, revealedRounds: 0, finished: false, players }
    skipTournament(world)
    closeTournament(world)
    return { event, m }
  }
  throw new Error(`no kid retirement found at ${tier} in 900 seeded draws`)
}

describe('⭐⭐ R2-02 – what the injury DID, as a typed view', () => {
  it('a real mid-match retirement: the door, the girl across the net, and the round she had reached', () => {
    const world = base('report-retirement')
    const { event, m } = driveKidRetirement(world, 'local')
    expect(world.injury, 'the reveal opened a layoff').not.toBeNull()

    const snap = toSnapshot(world)
    const report = snap.injuryReport
    expect(report, 'a live injury carries a report').toBeTruthy()

    // THE DOOR. `retiredId === KID_ID` is the whole test, and it is a persisted fact rather than a
    // sentence – the same field `travelHome` and the season plaque read.
    expect(report!.kind).toBe('retired-match')

    // ...AND THE FACTS OFF THE SAME ROW, cross-checked against the record the draw actually produced
    // rather than against a string this file also wrote.
    const row = world.events.find((e) => e.week === world.week && e.match?.retiredId === KID_ID)
    expect(row, 'the world wrote a retirement match row').toBeTruthy()
    expect(report!.oppName, 'the opponent is named off the record').toBe(row!.match!.oppName)
    expect(report!.stage, 'and the round, said the way a draw sheet says it').toBe(
      stageLabel(m.round, TIERS[event.tier].drawSize),
    )
    expect(report!.eventLabel, 'and the tournament').toBe(TIERS[event.tier].label)

    // eslint-disable-next-line no-console
    console.log(
      `\nR2-02 retirement report: kind=${report!.kind} opp=${report!.oppName} stage=${report!.stage} ` +
        `event=${report!.eventLabel} cancelled=${report!.cancelled.length} stranded=${report!.stranded.length} ` +
        `refund=${report!.refundCents}c\n`,
    )
  })

  it('the entries the layoff CANCELLED, their weeks, and the fees that came back', () => {
    const world = base('report-cancelled')
    const wk = world.week
    // Two events far enough out that their lists are still open when the injury lands – the desk
    // withdrew her BEFORE the tournament, which is the other arm of the report.
    const open = enterable(world, wk + 2, wk + 6).slice(0, 2)
    expect(open.length, 'two enterable events with open lists').toBe(2)
    for (const e of open) enterEvent(world, e.id)

    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)
    expect(world.entries.length, 'the engine released both').toBe(0)

    const report = toSnapshot(world).injuryReport!
    // The IDS, which is the fact no sentence ever carried – the release line spells a label and a
    // week, and two events of the same rung in the same window are indistinguishable by either.
    expect(report.cancelled.map((r) => r.id).sort()).toEqual(open.map((e) => e.id).sort())
    for (const e of open) {
      const got = report.cancelled.find((r) => r.id === e.id)!
      expect(got.label, 'the tier label').toBe(TIERS[e.tier].label)
      expect(got.week, 'the week the tournament is PLAYED in, not the week of the row').toBe(e.week)
    }
    const fees = open.reduce((s, e) => s + TIERS[e.tier].entryFeeCents, 0)
    expect(report.refundCents, 'the money, in cents, off the signed rows').toBe(fees)
    expect(report.stranded, 'nothing was stranded – both lists were open').toEqual([])
    expect(report.kind, 'the weekly roll leaves no on-court record, and the report does not invent one').toBe('off-court')
    expect(report.oppName).toBeUndefined()
    expect(report.stage).toBeUndefined()
  })

  it('⭐ the report survives a REWORDING of every line the engine wrote about it', () => {
    // The property the type exists for, asserted at the wire before it is asserted on a screen: the
    // facts are read off `entryRef`/`match`, so the sentences can say anything at all.
    const world = base('report-cancelled')
    const wk = world.week
    const open = enterable(world, wk + 2, wk + 6).slice(0, 2)
    for (const e of open) enterEvent(world, e.id)
    onsetInjury(world, rngFromSeed(seedForLayoff(world, 8)), 'week', BODY_REGIONS)

    const before = toSnapshot(world).injuryReport!
    // The copy editor's pass: every sentence in the feed replaced, structure untouched.
    for (const e of world.events) e.text = `copy-edited row ${e.id}`
    const after = toSnapshot(world).injuryReport!

    expect(after, 'the report is a projection of state, so it did not move').toEqual(before)
    expect(after.cancelled.length, 'and it still names both').toBe(2)
    expect(after.refundCents, 'and still totals the money').toBe(
      open.reduce((s, e) => s + TIERS[e.tier].entryFeeCents, 0),
    )
    // ...and the two predicates the OLD dialog used are provably blind on this same input, which is
    // why this test could not be written against it at all.
    expect(world.events.filter((e) => e.text.startsWith('Taken out of ')).length).toBe(0)
    expect(world.events.filter((e) => e.text.startsWith('Entry refunded')).length).toBe(0)
  })

  it('the entries the layoff STRANDED – closed lists, fee committed, no appearance', () => {
    // Lists close two weeks out, so an entry the layoff reaches whose list has ALREADY shut cannot
    // be withdrawn at all: she keeps her place, does not appear, and the week resolves as a
    // walkover. "Nothing cancelled" is not "nothing lost" (round-20 #2), and the owner reported that
    // shape twice running as two tournaments on consecutive weeks.
    const { state, pair } = consecutivePair()
    const wk = state.week
    expect(wk, 'the first list has shut').toBeGreaterThan(pair.first.deadlineWeek)
    expect(wk, 'and so has the second').toBeGreaterThan(pair.second.deadlineWeek)

    onsetInjury(state, rngFromSeed(seedForLayoff(state, 3)), 'week', BODY_REGIONS)
    const report = toSnapshot(state).injuryReport!
    expect(report.cancelled, 'nothing could be cancelled – both lists were shut').toEqual([])
    expect(report.refundCents).toBe(0)

    // ⭐ BOTH OF THEM, INCLUDING THE ONE ON THE INJURY'S OWN WEEK. The dialog used to read these off
    // `upcoming`, which starts at week+1 and stops at UPCOMING_WEEKS – so the tournament she was
    // entered in THIS week was invisible to the row whose job is to say what the layoff costs, and
    // so was every forfeit past the eighth week of a long absence. The report is recomputed from
    // `world.entries` against the engine's own `layoffCovering`, which has neither edge.
    expect(report.stranded.map((r) => r.id)).toEqual([pair.first.id, pair.second.id])
    for (const e of [pair.first, pair.second]) {
      const got = report.stranded.find((r) => r.id === e.id)!
      expect(got.label).toBe(TIERS[e.tier].label)
      expect(got.week).toBe(e.week)
    }
  })

  it('no injury, no report – and a healthy world does not carry one', () => {
    const world = base('report-healthy')
    expect(world.injury).toBeNull()
    expect(toSnapshot(world).injuryReport).toBeNull()
  })
})
