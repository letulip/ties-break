// ⭐⭐ C-04 / F-08 – THE SCREEN'S REPLAY AGAINST THE ENGINE'S RECORD, THROUGH A MOUNTED COMPONENT.
//
// ⚠ WHAT WAS MISSING, AND IT IS THE WHOLE REASON THIS FILE EXISTS. A replay is a RE-SIMULATION:
// `simulateMatch(a, b, opts)` on the stored seed, so the only link between what a screen plays and
// the scoreline the feed prints beside it is OPTION EQUALITY. The engine records with its own literal
// at four sites and the four screens rebuilt that literal at four more, matched by convention. Ten
// tests re-spelled the same recipe a third time and therefore proved that the TESTS' spelling
// reproduces the engine – not that the screens' does. No test in the repository drove a recorded
// match through a mounted replay surface and compared what it played with the record.
//
// ⚠ SO THE FIXTURE IS A REAL CAREER AND NOT A HAND-BUILT ROW. A `WorldMatch` literal typed out here
// would carry a `score` a human chose, and a recorder that started recording under different options
// would keep matching it for ever. Both arms walk the real engine, let it RECORD, and then ask the
// real screen what it plays – so a recorder that drifts alone shows up as a scoreline on screen that
// disagrees with the row underneath it, which is the defect in the owner's own terms.
//
// ⚠ AND IT READS THE RENDERED SCOREBOARD, never the component's internals – the rule
// `tests/component/match-viewer.test.ts` is written under. The set cells are what a player looks at.
//
// ⚠ MUTATION-VERIFIED (27.09), AND THE ARM IS THE FINDING'S OWN: adding `momentum: false` to ONE
// recorder – `season/tournament.ts`' `playMatch` – turns the tournament arm red on the SCORELINE with
// the record's own numbers in the message, and leaves the friendly arm (a different recording site)
// green. Both outputs are quoted in the wave report. The asymmetry is the point: one recorder drifting
// alone is exactly what this file exists to catch, and the other arm staying green is what proves the
// net is aimed at the recorder rather than at the fixture.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MatchReplay from '../../src/components/MatchReplay.vue'
import { createWorld, tickWeek, skipTournament, enterEvent, bookPractice, KID_ID } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { WorldMatch } from '../../src/shared/protocol'

/** The control that jumps the viewer to the decided result – named once, as `match-viewer.test.ts`
 *  names it, because a typo would silently find no button and the case would pass on "Not started". */
const SKIP_LABEL = 'Skip to the result'

/** Enough money that a fee is never what a fixture dies on. It is not what any of this is about. */
const RICH_CENTS = 9_999_999_00

/** Her first Local Open, resolved – a match RECORDED by `season/tournament.ts`' `playMatch`, which is
 *  the recorder every tournament in the game (and the prologue weekend) goes through.
 *
 *  ⚠ THE `local` RUNG IS CHOSEN SO THE FIXTURE NEEDS NO ELIGIBILITY SCAFFOLDING. Its
 *  `enterPointBand` starts at 0 – "a fresh kid always starts here" – so `enterEvent` is the whole of
 *  entering it, and this file copies none of the six local `enterEligible` helpers that exist to
 *  grant a ranking the higher rungs ask for. */
function recordedTournamentRun(seed: string): WorldMatch[] {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  world.fundsCents = RICH_CENTS
  const event = world.season.find((e) => e.tier === 'local' && e.week > world.week && e.deadlineWeek >= world.week)
  expect(event, 'the calendar offered no Local Open to enter').toBeTruthy()
  enterEvent(world, event!.id)
  while (world.week < event!.week) tickWeek(world, rng)
  // The tournament week pauses into a reveal; resolving the whole run is what commits the per-round
  // match events (the "skip tournament" path).
  expect(world.pendingTournament, 'the tournament week did not pause into a reveal').toBeTruthy()
  skipTournament(world)
  const run = world.events
    .filter((e) => e.type === 'match' && e.week === event!.week && e.match)
    .map((e) => e.match!)
  expect(run.length, 'the resolved run emitted no kid match').toBeGreaterThan(1)
  return run
}

/** A booked friendly, resolved – a match RECORDED by `world/planner.ts`' `resolvePractice`, on its
 *  own `seed:practicematch:<week>:m` stream. The walk is `tests/round10-view.test.ts`' own. */
function recordedFriendly(seed: string): WorldMatch {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 40; i++) {
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
    const friendly = world.events.find((e) => e.type === 'match' && e.friendly && e.week === world.week && e.match)
    if (friendly) return friendly.match!
  }
  throw new Error('no practice match resolved')
}

/**
 * WHAT THE SCREEN IS SHOWING, read off the rendered scoreboard and nothing else.
 *
 * `MatchViewer` draws one row per side (`.mv-prow`, sides in order) with three set cells in each
 * (`.mv-cell`), and a cell no set reached prints an en dash. So the played sets are the cells holding
 * numbers, and joining them `a-b` produces exactly the string every recording site writes onto the
 * record: `res.sets.map((s) => `${s.a}-${s.b}`).join(' ')`.
 */
async function replayed(match: WorldMatch): Promise<{ scoreline: string; setsWonBySide: [number, number]; unmount: () => void }> {
  const wrapper = mount(MatchReplay, { props: { match } })
  const skip = wrapper.findAll('button').find((b) => b.text() === SKIP_LABEL)
  expect(skip, `no "${SKIP_LABEL}" control on the replay`).toBeTruthy()
  await skip!.trigger('click')
  await wrapper.vm.$nextTick()
  const rows = wrapper.findAll('.mv-prow')
  expect(rows.length, 'the scoreboard drew no player rows').toBe(2)
  const cells = [rows[0].findAll('.mv-cell').map((c) => c.text()), rows[1].findAll('.mv-cell').map((c) => c.text())]
  expect(cells[0].length, 'the two rows disagree on how many set cells there are').toBe(cells[1].length)
  const played: string[] = []
  const setsWon: [number, number] = [0, 0]
  for (let i = 0; i < cells[0].length; i++) {
    const a = Number(cells[0][i])
    const b = Number(cells[1][i])
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue // a set the match never reached
    played.push(`${cells[0][i]}-${cells[1][i]}`)
    if (a > b) setsWon[0] += 1
    else if (b > a) setsWon[1] += 1
  }
  return { scoreline: played.join(' '), setsWonBySide: setsWon, unmount: () => wrapper.unmount() }
}

describe('C-04 – a re-watch on screen plays the match the engine recorded', () => {
  /** The two claims, per record: the rendered scoreline IS the row's own, and the scoreboard has the
   *  recorded player winning. The winner is read off the CELLS rather than off the record, because
   *  both names render whoever won – "the winner's name is on screen" is a claim that cannot fail. */
  async function assertReplayMatchesRecord(m: WorldMatch): Promise<void> {
    expect(m.seed, 'a record with no seed cannot be replayed at all').toBeTruthy()
    expect(m.score, 'the recorder wrote no scoreline to compare with').toBeTruthy()
    // ⚠ A PRECONDITION, NOT A CLAIM ABOUT THE FIX: on the ~2.7% of matches that end in a retirement
    // the sets do not name the winner, so the winner half would be measuring the seed. If this fires,
    // move the fixture's seed rather than dropping the claim.
    expect(m.retiredId, `${m.seed}: this fixture is a retirement – pick another seed`).toBeUndefined()
    const { scoreline, setsWonBySide, unmount } = await replayed(m)
    // THE ASSERTION THE WHOLE FILE IS FOR: the screen's re-simulation resolved the recorded match.
    expect(scoreline, `${m.seed}: the replay played a different match from the one the engine recorded`).toBe(m.score)
    const shown = setsWonBySide[0] > setsWonBySide[1] ? m.aId : m.bId
    expect(shown, `${m.seed}: the scoreboard has the other player winning`).toBe(m.winnerId)
    unmount()
  }

  it('⭐⭐ a tournament run: every round MatchReplay re-watches ends on the recorded scoreline', async () => {
    // ⚠ THE WHOLE RUN AND NOT ITS FIRST MATCH, AND THAT IS A MEASUREMENT RATHER THAN THOROUGHNESS.
    // The mutation arm was run against one record first and came back GREEN: `momentum: false` is a
    // 0.015 nudge that only applies on a streak of three, so it flips a served point only when the
    // uniform falls inside that window, and this fixture's FIRST round happens not to contain one.
    // Measured on the same seed, the run's three rounds diverged 2 of 3 – so the corpus is the floor
    // here exactly as it is in `tests/match/match-annotation-parity.test.ts`: a net aimed at one
    // record would have been measuring the seed and reporting the recorder.
    for (const m of recordedTournamentRun('c04-tournament')) await assertReplayMatchesRecord(m)
  })

  it('⭐ a booked friendly: the same, through the other recorder', async () => {
    // ⚠ A DIFFERENT RECORDING SITE, DELIBERATELY. `resolvePractice` records the friendly and
    // `playMatch` records the tournament round; an arm each is what makes the mutation asymmetric.
    const m = recordedFriendly('c04-friendly')
    expect(m.seed, 'a record with no seed cannot be replayed at all').toContain(':practicematch:')
    expect([m.aId, m.bId], 'the friendly is not her match').toContain(KID_ID)
    await assertReplayMatchesRecord(m)
  })

  // ⚠ NOT VACUOUS. The arms above would pass on a one-point walkover, and they would pass on a reader
  // that returned the record instead of the screen. The floors are here.
  it('...and the reading is real: the cells hold played matches, and two records read differently', async () => {
    const run = recordedTournamentRun('c04-tournament')
    const friendly = recordedFriendly('c04-friendly')
    const first = await replayed(run[0])
    expect(first.scoreline, 'the scoreline is not a scoreline').toMatch(/^\d+-\d+( \d+-\d+)+$/)
    expect(first.setsWonBySide[0] + first.setsWonBySide[1], 'nobody won a set').toBeGreaterThan(1)
    first.unmount()
    const second = await replayed(friendly)
    // Two careers, two recorders, two matches: a reader returning a constant shows up right here.
    expect(second.scoreline).not.toBe(first.scoreline)
    second.unmount()
  })
})
