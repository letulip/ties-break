// ⭐⭐ C-04 – THE OPTIONS A RECORDED MATCH IS PLAYED UNDER, PINNED, AND THE REPLAY PER MATCH KIND.
//
// ⚠ WHY THE FIRST PIN IS AN EXACT OBJECT AND NOT A SUBSET. `recordedMatchOptions` is now the one
// owner of `{ surface, tour: JUNIOR_TOUR, seed }`, which is what a shipped save's matches were
// recorded under. A replay is a re-simulation off the stored seed, so ANY new key here re-plays every
// match in every save: the scoreline on screen would stop matching the row beside it, for every
// career that already exists. That is a behaviour change wearing a refactor's clothes, and the whole
// point of having one owner is that it becomes deliberate and loud instead of quiet and four-way.
// So this pin fails on an ADDED key as loudly as on a changed one, and a wave that means to add one
// updates it and says so.
//
// ⚠ THE RECORDED SHAPE WAS MEASURED, NOT ARGUED (27.09). Two arms in this worktree, the B arm at the
// commit that routes the three recorders through the primitive and the A arm with those three call
// sites put back on their historical literal: the hash of every record a career writes – seed,
// scoreline, winner, retirement – came back BYTE-IDENTICAL on all three kinds a probe can reach
// cheaply (5 tournament rounds over 4 careers, 3 friendlies, 9 prologue weekend matches over 6
// weekends). And the probe is not blind: an A' arm adding `firstServer: 1` to the tournament recorder
// moved the tournament hash and the prologue hash (which goes through the same recorder) and left the
// friendly hash alone, which is the recorder map confirmed from outside.
//
// ⚠ MUTATION-VERIFIED: adding `momentum: false` to `recordedMatchOptions`' return reddens the first
// case; adding it to ONE RECORDER instead reddens the per-kind cases below and the mounted net in
// `tests/component/principles-c04-replay-parity.test.ts`. Both outputs are in the wave report.
import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek, skipTournament, enterEvent, bookPractice, KID_ID } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { recordedMatchOptions } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { replayMatch } from '../src/composables/annotatedMatch'
import { playLocalOpen, prologueEntrant, herMatches } from '../src/prologue/pool'
import type { Surface } from '../src/engine/match/types'
import type { WorldMatch } from '../src/shared/protocol'

const RICH_CENTS = 9_999_999_00

/** The scoreline idiom every recording site writes onto a record, in one place. */
const scorelineOf = (sets: { a: number; b: number }[]): string => sets.map((s) => `${s.a}-${s.b}`).join(' ')

describe('C-04 – the recorded options are one object, and it is the historical one', () => {
  it('⭐⭐ returns exactly `{ surface, tour: JUNIOR_TOUR, seed }` – no more keys, on every surface', () => {
    for (const surface of ['hard', 'clay', 'grass'] as Surface[]) {
      const opts = recordedMatchOptions({ surface, seed: 'c04-pin' })
      // `toEqual` on the whole object, so an ADDED key is as red as a changed one – see the header.
      expect(opts, `${surface}: the options a recorded match is played under moved`).toEqual({
        surface,
        tour: JUNIOR_TOUR,
        seed: 'c04-pin',
      })
      expect(Object.keys(opts).sort(), `${surface}: a key arrived or left`).toEqual(['seed', 'surface', 'tour'])
    }
  })

  it('...and an absent seed is the replayers\' own `?? \'\'`, kept rather than turned into a throw', () => {
    // `MatchRecord.seed` is optional: an AI-AI row carries none because it resolved through the closed
    // form. Every recorder passes a seed it has just built, so this arm is reachable only from a screen
    // handed a row that cannot be replayed at all – which is exactly what those screens did before.
    expect(recordedMatchOptions({ surface: 'hard' }).seed).toBe('')
    expect(recordedMatchOptions({ surface: 'hard', seed: undefined }).seed).toBe('')
  })

  it('the tour constant is ONE binding – `season/tournament` re-exports the match package\'s', async () => {
    // The declaration moved so the owner of the options could read it without the match package
    // importing the season package back. 31 call sites import it from the season path; this is the
    // assertion that the re-export is the same value and not a second literal.
    const engine = await import('../src/engine/match/engine')
    const season = await import('../src/engine/season/tournament')
    expect(season.JUNIOR_TOUR).toBe(engine.JUNIOR_TOUR)
    expect(engine.JUNIOR_TOUR).toBe('wta')
  })
})

describe('C-04 – every kind of recorded match replays to its own scoreline, through the screens\' recipe', () => {
  /** THE CLAIM, ONE LINE: `replayMatch` is what the four replay surfaces call, so a record whose
   *  scoreline it cannot reproduce is a Watch button that opens on a different match. */
  const replaysToItsRecord = (m: WorldMatch): void => {
    expect(m.seed, 'a record with no seed cannot be replayed at all').toBeTruthy()
    expect(scorelineOf(replayMatch(m).result.sets), `${m.seed}: the replay is not the recorded match`).toBe(m.score)
  }

  it('⭐ KIND 1 – a tournament round (`season/tournament.ts` playMatch), which the prologue shares', () => {
    const world = createWorld('c04-kind-tour')
    const rng = rngFromSeed(world.seed)
    world.fundsCents = RICH_CENTS
    const ev = world.season.find((e) => e.tier === 'local' && e.week > world.week && e.deadlineWeek >= world.week)!
    enterEvent(world, ev.id)
    while (world.week < ev.week) tickWeek(world, rng)
    skipTournament(world)
    const run = world.events.filter((e) => e.type === 'match' && e.week === ev.week && e.match).map((e) => e.match!)
    expect(run.length, 'the run recorded no kid match').toBeGreaterThan(0)
    for (const m of run) replaysToItsRecord(m)
  })

  it('⭐ KIND 2 – a booked friendly (`world/planner.ts` resolvePractice)', () => {
    const world = createWorld('c04-kind-friendly')
    const rng = rngFromSeed(world.seed)
    let found: WorldMatch | null = null
    for (let i = 0; i < 40 && !found; i++) {
      try {
        world.fundsCents = RICH_CENTS
        bookPractice(world, world.week + 1, false)
      } catch {
        tickWeek(world, rng)
        if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
        continue
      }
      tickWeek(world, rng)
      if (world.pendingTournament && !world.pendingTournament.finished) skipTournament(world)
      const f = world.events.find((e) => e.type === 'match' && e.friendly && e.week === world.week && e.match)
      if (f) found = f.match!
    }
    expect(found, 'no practice match resolved').toBeTruthy()
    replaysToItsRecord(found!)
  })

  it('⭐ KIND 3 – the prologue Local Open weekend, whose record carries no surface of its own', () => {
    // ⚠ THE SURFACE COMES OFF THE WEEKEND'S EVENT. A prologue row is a `MatchRecord`, not a
    // `WorldMatch`, which is the reason `recordedMatchOptions` takes the two fields rather than the
    // row – and the reason `PrologueLocalOpen` composes the shape instead of handing over a record.
    const kid = prologueEntrant('c04-kind-prologue', KID_ID, 'Vera Novak', 10)
    const open = playLocalOpen('c04-kind-prologue', kid, 10)
    const mine = herMatches(open, KID_ID)
    expect(mine.length, 'she was not in her own draw').toBeGreaterThan(0)
    for (const rec of mine) {
      const oppId = rec.aId === KID_ID ? rec.bId : rec.aId
      const opp = open.field.find((p) => p.id === oppId)!
      const a = rec.aId === KID_ID ? kid : opp
      const b = rec.aId === KID_ID ? opp : kid
      const sets = replayMatch({ surface: open.event.surface, seed: rec.seed, a, b }).result.sets
      expect(scorelineOf(sets), `${rec.seed}: the replay is not the recorded match`).toBe(rec.score)
    }
  })

  // ⚠ KINDS 4 AND 5 – the national-team call-up rubber and the college-league round – are asserted in
  // their own suites, where the four-year walk they need already exists and is already budgeted:
  // `tests/round27-call-up-flow.test.ts`, `tests/college-second-act.test.ts` (rubbers) and
  // `tests/college-league.test.ts` (league rounds). All three were re-aimed at `replayMatch` on 27.09,
  // so every kind's "the stored record replays" claim is now made through the screens' own function.
  // Building a sixth college walk here would have copied a hand-posed fixture the next wave is about
  // to merge (F-01), for a claim that is already made.
})
