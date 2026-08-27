// =================================================================================================
// ⭐⭐⭐ ROUND 26 #6 / #7 – THE COLLEGE LEAGUE IS WALKED, AND ITS REPLAYS SURVIVE
// =================================================================================================
//
// The owner, after playing four college years, and he had asked once already:
//   #6 «За первый год в колледже турнир был, но опять сообщили только постфактум, в чем проблема
//      использовать наш флоу турниров полностью и дать возможность игроку их смотреть и
//      сопереживать? Я уже просил это сделать»
//   #7 «Реплеев этих матчей из п.6 нигде нет, ни в news feed, ни в календаре»
//
// ⚠⚠ WHAT HIS SAVE ACTUALLY HELD, MEASURED BEFORE A LINE WAS WRITTEN (`tennis-sim_alice-cfbv_w502`,
// v59, week 502, READ-ONLY and never a fixture). Round 25's claim was that the matches were played,
// recorded and watchable, and every part of that was TRUE in the save: four banked years, leagues at
// 1 / 3 / 0 / 1 rounds won, eight `college-w<week>-r<n>` rows in `world.events`, every one of them
// `friendly: true`, `keep: true`, carrying a full `WorldMatch` with its seed. Two things were false
// on his SCREEN, and they are the two items:
//
//   #6 THE YEAR NEVER STOPPED. `resumeFromCollege` added 'college-league' to the stop set and kept
//      ticking, so the championship was played on week 12 of the academic year and the screen came
//      back at week 52 – forty weeks and one banked year later. A summary line and three replay
//      buttons on a card is «сообщили постфактум» however good the tennis behind them was.
//   #7 THE ROWS FELL OUT OF THE WINDOW. `snapshot.events` was a positional `slice(-60)` over a
//      401-row ledger. At week 480, inside the freeze, sixty rows still reached back to week 273 and
//      all eight matches were openable from the Home feed. The week she graduated and the tour began
//      writing again, the window collapsed to weeks 493-502: twenty income rows, thirty expense
//      rows, nine info rows, one milestone – zero matches. The Home feed he was looking at had ten
//      rows in it, and the calendar has never held a past match of any kind, tour ones included.
//
// This file pins the fix for both, over careers walked through the real engine.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  answerFork,
  closeTournament,
  collegeLeagueMatchesOf,
  collegeLeagueRevealMatches,
  callUpRevealOpen,
  collegeLeagueRevealOpen,
  createWorld,
  chooseGift,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  toSnapshot,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { resumeMain, type Rng } from '../src/engine/rng'
import { COLLEGE_LEAGUE, leagueMatchesPlayed } from '../src/engine/collegeLeague'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { SNAPSHOT_EVENTS } from '../src/engine/world/constants'
import { DEFAULT_PROFILE, STOP_PRECEDENCE } from '../src/shared/protocol'

const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

/** A tour reveal, walked out – the loop every college fixture in this repo already carries. */
function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** ⭐⭐⭐ A CAREER THAT REALLY PLAYED TO THE FORK AND REALLY ANSWERED «college» – never a hand-built
 *  snapshot. The same opener `tests/component/round24-college-shell.test.ts` walks, including its one
 *  thumb on the scale: four years is 208 weeks of base costs and a career that went bankrupt inside
 *  them would be measuring the family budget instead of this. */
function atCollege(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}

/** Press until the championship's reveal is standing open, answering her birthday on the way.
 *  ⚠ IT THROWS IF IT NEVER GETS THERE, so a case cannot go green against a career that held no
 *  championship at all – the whole floor round 24 established. */
function pressToTheChampionship(world: WorldState, rng: Rng): { stops: string[]; press: number } {
  for (let press = 1; press <= 4; press++) {
    const stops = resumeFromCollege(world, rng)
    if (collegeLeagueRevealOpen(world)) return { stops, press }
    // ⚠ ROUND 27 #6: a career whose enrolment week falls between the two fixtures meets the tie
    // first, so the walk has to be able to step past one to reach a championship.
    if (callUpRevealOpen(world)) answerTheReveal(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    if (world.ending?.type !== 'college') break
  }
  throw new Error('the walk never reached a championship')
}

/** «Skip all rounds» then the finale's «Continue» – the two commands the flow's own controls call.
 ⭐⭐⭐ ROUND 27 #6 RE-AIM – IT ANSWERS THE NATIONS CUP TIE TOO.
 *  ⚠ IT USED TO CLAIM: «the championship is the only reveal a college year raises» (round 26 #6).
 *  ⚠ WHY IT MOVED: the call-up now pauses the year and is walked in the same flow, so a walk that
 *  answered one of the two would hang on the other. The assertions in this file are untouched. */
function answerTheReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world) && !callUpRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}

// =================================================================================================
// ⭐⭐⭐ 1. #6 – THE YEAR STOPS ON THE FIXTURE
// =================================================================================================
describe('#6 the championship stops the year instead of being reported after it', () => {
  it('⭐⭐⭐ one press lands ON the championship week: nothing banked, the latch back on, the reveal open', () => {
    const { world, rng } = atCollege('r26-stop-a')
    const { stops } = pressToTheChampionship(world, rng)

    expect(stops, 'the week reports itself, as it always did').toContain('college-league')
    expect(world.week % WEEKS_PER_YEAR, 'and the world is standing ON the fixture week').toBe(COLLEGE_LEAGUE.seasonWeek)
    expect(world.college!.years, 'the year is NOT banked – it is paused, not spent').toHaveLength(0)
    expect(world.college!.pendingYearStart, 'its opening is persisted for the press that finishes it').not.toBeNull()
    expect(world.ending?.type, 'the latch is back on, so the Home shell draws').toBe('college')
    expect(world.college!.leagueReveal, 'and the reveal is open at round zero').toEqual({
      week: world.week,
      revealed: 0,
    })
  })

  it('⭐⭐⭐ ...and the matches he is being offered are the ones the tick really played', () => {
    const { world, rng } = atCollege('r26-stop-b')
    pressToTheChampionship(world, rng)
    const run = world.college!.pendingLeague!
    const matches = collegeLeagueRevealMatches(world)
    expect(matches, 'the reveal walks the run, not a copy of it').toEqual(collegeLeagueMatchesOf(world, run.week))
    expect(matches.length, 'as many as she played – between one and three in a draw of eight').toBe(
      leagueMatchesPlayed(run),
    )
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(matches.every((m) => typeof m.seed === 'string' && m.seed.length > 0), 'every one replayable').toBe(true)
  })

  it('⭐⭐⭐ EVERY year of a walked career raises one, and every one of them is answerable', () => {
    const { world, rng } = atCollege('r26-stop-c')
    let reveals = 0
    for (let press = 0; press < 6 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      if (collegeLeagueRevealOpen(world)) reveals++
      // ⚠ ROUND 27 #6: the tie pauses the year too, and this walk counts CHAMPIONSHIPS – so the
      // answer is unconditional and only the count is gated. A walk that answered one reveal and not
      // the other would stall on the first call-up and report one championship a career.
      answerTheReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(world.college!.years, 'she graduated – the reveals never stranded the career').toHaveLength(
      ENDINGS.collegeYears,
    )
    expect(world.ending?.type, 'the latch is off for good').not.toBe('college')
    expect(reveals, 'one championship a year, exactly the floor round 24 built').toBe(ENDINGS.collegeYears)
  })
})

// =================================================================================================
// ⭐⭐⭐ 2. THE STOP'S DESIGN – B1's law is EXTENDED, never weakened
// =================================================================================================
describe('#6 the stop, and round 24 rule 2 still holding underneath it', () => {
  it('⭐⭐⭐ a press over an open reveal ticks NOTHING and draws NOTHING – the no-op report', () => {
    const { world, rng } = atCollege('r26-guard-a')
    pressToTheChampionship(world, rng)
    const week = world.week
    const rngBefore = { ...world.rngMain }
    const funds = world.fundsCents
    const events = world.events.length

    const refused = resumeFromCollege(world, rng)
    expect(refused, 'refused with the reason, and nothing else').toEqual(['college-league'])
    expect(world.week, 'not one week ticked').toBe(week)
    expect(world.rngMain, 'and not one MAIN draw spent').toEqual(rngBefore)
    expect(world.fundsCents, 'no bill, because no week happened').toBe(funds)
    expect(world.events.length, 'and no row written').toBe(events)

    // ...and answering it makes the same press work, which is the whole contract.
    answerTheReveal(world)
    const after = resumeFromCollege(world, rng)
    expect(world.week, 'the year moves again').toBeGreaterThan(week)
    expect(after).not.toEqual(['college-league'])
  })

  it('⭐⭐⭐ `world.pendingTournament` is NEVER written inside the freeze – rule 2 guards a state that still cannot occur', () => {
    // ⚠⚠ THIS IS THE RECONCILIATION, MEASURED. Round 24's refusal THROWS because a `pendingTournament`
    // raised in the freeze had no surface in the app at all. The College League reveal is a DIFFERENT
    // field with a surface (the Home shell draws it), so it RETURNS a stop instead – and the throw
    // above it is left guarding exactly what it always guarded. If this ever goes red, the amateur
    // reveal has leaked into the tour's own field and `finalizeTournament` is reachable from college.
    const { world, rng } = atCollege('r26-guard-b')
    for (let press = 0; press < 6 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      expect(world.pendingTournament, 'no tour reveal, on any press, in any college year').toBeNull()
      answerTheReveal(world)
      expect(world.pendingTournament, 'and none after answering one either').toBeNull()
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(world.college!.years).toHaveLength(ENDINGS.collegeYears)
  })

  it('⚠ the reveal outranks the cake at the entry guard, because that is the order the screen shows them in', () => {
    // A birthday landing on the championship week pauses the year for BOTH (R11-1: one week can be
    // several things). The takeover is what the player sees – `popupMayShow` holds the gift dialog
    // behind `snapshot.pending` – so the engine's entry guard has to answer in the same order, or the
    // dialog would be demanded from behind a screen that is covering it.
    const { world, rng } = atCollege('r26-guard-c')
    pressToTheChampionship(world, rng)
    world.birthdays = []
    // Force the collision by hand: the state is what matters, not the calendar arithmetic behind it.
    if (pendingBirthday(world) === null) {
      expect(resumeFromCollege(world, rng), 'no cake pending: the reveal is the only answer').toEqual([
        'college-league',
      ])
    }
    expect(STOP_PRECEDENCE.indexOf('college-league')).toBeLessThan(STOP_PRECEDENCE.indexOf('birthday'))
  })
})

// =================================================================================================
// ⭐⭐⭐ 3. THE FLOW – the tour's own road, reached by the tour's own commands
// =================================================================================================
describe('#6 the reveal is the tour flow, and it is reached through the tour flow', () => {
  it('⭐⭐⭐ it reaches `snapshot.pending` – which is the field TournamentFlow, the college bar and screenBusy all read', () => {
    const { world, rng } = atCollege('r26-flow-a')
    pressToTheChampionship(world, rng)
    const snap = toSnapshot(world)
    const p = snap.pending!
    expect(p, 'the takeover has something to mount over').toBeTruthy()
    expect(p.tierLabel, 'and it names the competition, not a rung').toBe(COLLEGE_LEAGUE.label)
    expect(p.surface).toBe(COLLEGE_LEAGUE.surface)
    expect(p.eventId).toBe(`college-w${world.week}`)
    expect(p.finished, 'nothing has been shown yet').toBe(false)
    expect(p.bracket, 'so her path is empty').toHaveLength(0)
    expect(p.kidMatch, 'and the first round is on deck').toBeTruthy()
    expect(p.kidMatch!.eventId).toBe(collegeLeagueRevealMatches(world)[0].eventId)
    expect(snap.ending?.ending.type, 'under a latch that draws the Home shell').toBe('college')
    expect(snap.ending?.college, 'the resumable one, not the album').not.toBeNull()
  })

  it('⭐⭐⭐ `tournamentReveal` walks it round by round – the same command a tour reveal uses', () => {
    const { world, rng } = atCollege('r26-flow-b')
    pressToTheChampionship(world, rng)
    const played = collegeLeagueRevealMatches(world).length
    for (let i = 1; i <= played; i++) {
      revealTournamentRound(world)
      const p = toSnapshot(world).pending!
      expect(world.college!.leagueReveal!.revealed, `round ${i} shown`).toBe(i)
      expect(p.bracket, 'and her path has grown by one').toHaveLength(i)
      expect(p.finished, 'finished exactly at the last one').toBe(i === played)
    }
    // Idempotent past the end, exactly like `revealTournamentRound` on a finished tour run.
    revealTournamentRound(world)
    expect(world.college!.leagueReveal!.revealed).toBe(played)

    closeTournament(world)
    expect(world.college!.leagueReveal, 'the finale`s Continue clears it').toBeNull()
    expect(toSnapshot(world).pending, 'and the takeover comes down').toBeUndefined()
  })

  it('⭐⭐ `tournamentSkip` goes straight to the finale, and the finale reads the run', () => {
    const { world, rng } = atCollege('r26-flow-c')
    pressToTheChampionship(world, rng)
    const run = world.college!.pendingLeague!
    skipTournament(world)
    const p = toSnapshot(world).pending!
    expect(p.finished, 'the finale').toBe(true)
    expect(p.kidChampion).toBe(run.roundsWon >= run.rounds)
    expect(p.bracket, 'with her whole path on the poster').toHaveLength(leagueMatchesPlayed(run))
    // The finish is the draw sheet's own word, off the run – never a second idea of what a round is.
    const expected = ['Champion', 'Runner-up', 'Semifinalist', 'Quarterfinalist'][run.rounds - run.roundsWon]
    expect(p.finishLabel).toBe(expected)
  })

  it('⭐⭐ the reveal survives a save and a load, which is why it is persisted at all', () => {
    const { world, rng } = atCollege('r26-flow-d')
    pressToTheChampionship(world, rng)
    revealTournamentRound(world)
    const reloaded = migrateSave(JSON.parse(JSON.stringify(world)))
    expect(reloaded.college!.leagueReveal, 'he comes back where he left off').toEqual(
      world.college!.leagueReveal,
    )
    const p = toSnapshot(reloaded).pending!
    expect(p.bracket, 'the walked rounds are still walked').toHaveLength(1)
    expect(p.tierLabel).toBe(COLLEGE_LEAGUE.label)
  })
})

// =================================================================================================
// ⭐⭐⭐ 4. THE AMATEUR LINE – playability smuggles in neither currency (round 25's ruling)
// =================================================================================================
describe('#6 the flow awards nothing, which is what keeps the fork a real choice', () => {
  it('⭐⭐⭐ no ranking points, no prize money, no silverware – across a whole walked reveal', () => {
    const { world, rng } = atCollege('r26-amateur-a')
    pressToTheChampionship(world, rng)
    const before = {
      funds: world.fundsCents,
      kidFunds: world.kidFundsCents,
      results: world.results.length,
      trophies: JSON.stringify(world.trophiesByTier),
      best: JSON.stringify(world.bestFinishByTier),
      wins: world.seasonWins,
      losses: world.seasonLosses,
      main: { ...world.rngMain },
    }
    // The whole walk: every round, then the finale's Continue.
    const played = collegeLeagueRevealMatches(world).length
    for (let i = 0; i <= played; i++) revealTournamentRound(world)
    closeTournament(world)

    expect(world.fundsCents, 'not a cent to the family').toBe(before.funds)
    expect(world.kidFundsCents, 'and not a cent to her account').toBe(before.kidFunds)
    expect(world.results.length, '`world.results` is never touched – there is no result').toBe(before.results)
    expect(JSON.stringify(world.trophiesByTier), 'nothing entered the cabinet').toBe(before.trophies)
    expect(JSON.stringify(world.bestFinishByTier), 'no rung gained a high-water mark').toBe(before.best)
    expect(world.seasonWins, 'the season record is untouched').toBe(before.wins)
    expect(world.seasonLosses).toBe(before.losses)
    // ⚠ AND THE VIEW SAYS SO IN THE TWO FIELDS THE POSTER PRINTS FROM.
    const p = toSnapshot(world).pending
    expect(p, 'closed').toBeUndefined()
  })

  it('⭐⭐⭐ the view carries the amateur answers, so no screen can invent a rung for it', () => {
    const { world, rng } = atCollege('r26-amateur-b')
    pressToTheChampionship(world, rng)
    const p = toSnapshot(world).pending!
    expect(p.tier, 'THE discriminator: there is no rung behind a student field').toBeNull()
    expect(p.points, 'and no points on the poster').toBe(0)
    expect(p.kidRank, 'no professional rank quoted in a table this is not played in').toBeNull()
    expect(p.opponent.rank, 'and none for the student across the net').toBeNull()
    expect(p.opponent.nation, 'no flag: a student draw is not a tie between countries').toBe('')
    expect(p.crowd, 'we do not model a student gate, and the screen omits the cell').toBe(0)
    expect(p.fullBracket, 'only her matches were ever simulated').toHaveLength(0)
  })

  it('⭐⭐⭐ RNG: the whole reveal is FREE – zero MAIN draws (invariant 2)', () => {
    const { world, rng } = atCollege('r26-amateur-c')
    pressToTheChampionship(world, rng)
    const main = { ...world.rngMain }
    const played = collegeLeagueRevealMatches(world).length
    for (let i = 0; i <= played; i++) revealTournamentRound(world)
    skipTournament(world)
    closeTournament(world)
    expect(world.rngMain, 'watching cannot re-roll the world`s dice').toEqual(main)
  })
})

// =================================================================================================
// ⭐⭐ 5. THE MIGRATION – a championship already lived is history
// =================================================================================================
describe('#6 v59 -> v60: nothing is back-filled and nothing is halted', () => {
  it('⭐⭐ the golden v59 college save migrates to a null reveal and is not re-offered a lived year', () => {
    const raw = JSON.parse(readFileSync(`${DIR}/v59.json`, 'utf8'))
    const world = migrateSave(raw)
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(world.college, 'the fixture is a career inside the freeze').not.toBeNull()
    expect(world.college!.leagueReveal ?? null, 'no reveal is opened over a year already lived').toBeNull()
    expect(collegeLeagueRevealOpen(world)).toBe(false)
    expect(toSnapshot(world).pending, 'so no takeover mounts on load').toBeUndefined()
  })

  it('⚠ a save with no college at all falls straight through', () => {
    // ⚠ `college = null` IS THE FIXTURE, exactly as `tests/college-league.test.ts` sets it for the
    // v56 migration's own version of this claim: the golden saves are careers that reached the fork,
    // and the case being made here is about the ones that never did.
    const raw = JSON.parse(readFileSync(`${DIR}/v54.json`, 'utf8'))
    raw.college = null
    expect(() => migrateSave(raw)).not.toThrow()
    const world = migrateSave(raw)
    expect(world.college).toBeNull()
    expect(collegeLeagueRevealOpen(world)).toBe(false)
  })

  it('⚠ the migration is idempotent – a v60 save is not touched again', () => {
    const once = migrateSave(JSON.parse(readFileSync(`${DIR}/v59.json`, 'utf8')))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once))
  })

  it('⭐⭐ and its REMAINING years get the flow – the migration declines a past year, not the feature', () => {
    const world = migrateSave(JSON.parse(readFileSync(`${DIR}/v59.json`, 'utf8')))
    const rng = resumeMain(world.rngMain)
    let sawOne = false
    for (let press = 0; press < 8 && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      if (collegeLeagueRevealOpen(world)) {
        sawOne = true
        answerTheReveal(world)
      }
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(sawOne, 'the next championship it plays is walked like everyone else`s').toBe(true)
  })
})

// =================================================================================================
// ⭐⭐⭐ 6. #7 – THE REPLAY SURVIVES THE WINDOW
// =================================================================================================
describe('#7 a kept match row stays reachable in the feed, however long the career runs', () => {
  it('⭐⭐⭐ a walked degree`s championship matches are STILL in the feed after she graduates and plays on', () => {
    // ⚠⚠ THIS IS HIS OWN FAILURE, REPRODUCED FROM A WALK. Before the fix the rows were in
    // `world.events` and out of `snapshot.events`, because the snapshot's window is positional and
    // the tour writes an order of magnitude more rows a week than a college year does. So the test
    // walks the four years, GRADUATES, and then plays real tour weeks until the trailing window can
    // no longer reach back into the freeze – which is exactly the state his w502 save was in.
    const { world, rng } = atCollege('r26-feed-a')
    for (let press = 0; press < 6 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      answerTheReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(world.college!.years, 'four years really lived').toHaveLength(ENDINGS.collegeYears)

    const collegeRows = world.events.filter((e) => e.match?.eventId.startsWith('college-w'))
    expect(collegeRows.length, 'and they really produced watchable matches').toBeGreaterThanOrEqual(
      ENDINGS.collegeYears,
    )
    expect(collegeRows.every((e) => e.keep === true), 'every one marked to survive the prune').toBe(true)

    // Now play on, the way he did, until the ordinary window has left the freeze behind.
    for (let i = 0; i < 60; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }
    const tail = world.events.slice(-SNAPSHOT_EVENTS)
    expect(
      tail.filter((e) => e.match?.eventId.startsWith('college-w')).length,
      'the plain trailing window really has lost them – this is the defect, reproduced',
    ).toBe(0)

    const snap = toSnapshot(world)
    const reachable = snap.events.filter((e) => e.match?.eventId.startsWith('college-w'))
    expect(reachable.length, 'and the feed carries every one of them anyway').toBe(collegeRows.length)
    expect(reachable.every((e) => typeof e.match!.seed === 'string' && e.match!.seed.length > 0)).toBe(true)
  }, 240_000)

  it('⚠ and the feed is still ONE chronological list, with nothing said twice', () => {
    const { world, rng } = atCollege('r26-feed-b')
    for (let press = 0; press < 6 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      answerTheReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    for (let i = 0; i < 40; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }
    const rows = toSnapshot(world).events
    expect(rows.every((e, i) => i === 0 || rows[i - 1].week <= e.week), 'week order, or the groups break').toBe(true)
    expect(new Set(rows.map((e) => e.id)).size, 'no row appears twice').toBe(rows.length)
    // ⚠ THE WIDENING IS BOUNDED, which is the other half of the claim. `keep` is also carried by
    // milestones; only the rows with a MATCH on them are pinned, and the engine's own note bounds
    // those at «twelve at the very outside, over a whole degree».
    const extra = rows.length - Math.min(world.events.length, SNAPSHOT_EVENTS)
    expect(extra, 'a dozen rows at the outside, never a second whole ledger').toBeLessThanOrEqual(20)
  }, 240_000)

  it('⚠ a career that never went to college pays nothing for this at all', () => {
    const world = createWorld('r26-feed-tour', { ...DEFAULT_PROFILE })
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < 160; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }
    expect(world.events.length, 'a real ledger, past the window').toBeGreaterThan(SNAPSHOT_EVENTS)
    expect(
      world.events.filter((e) => e.keep === true && e.match !== undefined),
      'the tour marks no match row to keep – only the amateur competitions do',
    ).toHaveLength(0)
    expect(toSnapshot(world).events, 'so the feed is byte-for-byte the trailing window').toEqual(
      world.events.slice(-SNAPSHOT_EVENTS),
    )
  }, 240_000)
})
