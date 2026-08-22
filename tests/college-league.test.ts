// ⭐⭐⭐ ROUND 24 – THE ONE TOURNAMENT A COLLEGE YEAR IS GUARANTEED, AND THE LETTER THAT IS EARNED
// OFF IT (the owner, 21.08).
//
// > «я бы хотел, чтобы как минимум 1 турнир в год колледжа был. А вызов в сборную мы можем и
// > подкрутить для этого… Или еще что-то добавить отдельное, какой-то студенческий турнир, например.
// > Тогда вызов в сборную можно будет опереть на результаты студенческого и тогда у нас будет
// > минимум 1, максимум 2 турнира на учебный год»
//
// ⚠⚠ THE MEASUREMENT THE ITEM CAME OUT OF, and the units every assertion here is written in
// (`tools/college-year-content.ts`, 12 careers × 4 years = 48 college years):
//   * THREE marked weeks in fifty-two – two squad trips and one call-up;
//   * the trips WRITE NO ROWS and cannot be watched;
//   * the call-up was a BARE ROLL at 40%: it landed in 19 of 48 years, she played in 17;
//   * **0.71 watchable matches per college year** – on two thirds of them the calendar held one
//     openable row and it was empty.
//
// FOUR PROPERTIES ARE PINNED HERE AND EACH IS A FACT ABOUT THE WORLD RATHER THAN A STRING:
//   THE FLOOR    every college year, of every career, at every tier, holds a student championship.
//                It is arithmetic and not probability: a college year is fifty-two consecutive
//                ticked weeks and `COLLEGE_LEAGUE.seasonWeek` occurs in it exactly once.
//   THE CEILING  never a third tournament in an academic year – the owner's own bound.
//   THE LEAN     the call-up follows the championship's RESULT. Pinned as a mechanism (identical
//                draws, only the result different) and end to end (a real walk, every year's letter
//                predicted from the result the selectors read), never as one seed's outcome.
//   THE PRICE    it awards nothing. She is an amateur while she is there; a student fixture paying
//                ranking points would make four years of college a ranking route and the fork would
//                stop being a real choice.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  createWorld,
  answerFork,
  chooseGift,
  pendingBirthday,
  resumeFromCollege,
  collegeLeagueMatchId,
  collegeLeagueMatchesOf,
  collegeLeagueWeek,
  callUpRubbersOf,
  lastLeagueRun,
  inCollege,
  toSnapshot,
  tickWeek,
  KID_ID,
  SAVE_SCHEMA_VERSION,
  type WorldState,
} from '../src/engine/world'
import { COLLEGE_TRIP_WEEKS } from '../src/engine/world/college'
import { kidAgeYears } from '../src/engine/world/age'
import {
  COLLEGE_LEAGUE,
  COLLEGE_LEAGUE_ROUNDS,
  collegeLeagueLine,
  collegeLeagueOpponent,
  leagueExitLabel,
  leagueMatchesPlayed,
  wonTheLeague,
} from '../src/engine/collegeLeague'
import { NATIONAL_TEAM, callChanceFor, rollCallUp } from '../src/engine/nationalTeam'
import { migrateSave } from '../src/engine/migrations'
import { simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { COLLEGE_TIER_ORDER } from '../src/engine/collegeOffer'
import { fullRanking } from '../src/engine/world/ladder'
import { rngFromSeed, resumeMain, initMainState, type Rng } from '../src/engine/rng'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type CollegeTier, type CollegeYear } from '../src/shared/protocol'

/** A career standing at the fork – the same cheap opener `college-second-act.test.ts` uses. */
function atTheFork(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  world.fork = { askedWeek: world.week, answer: null, offer: null }
  return { world, rng: rngFromSeed(world.seed) }
}

/** Four years, spent one at a time exactly as the Home shell's «Another year» spends them.
 *
 *  ⚠ RE-AIMED BY THE COLLEGE BIRTHDAY (round 24, «да, день рождения делай»): a year now PAUSES on
 *  her birthday week so the gift dialog can be answered, so spending it is press-answer-press. The
 *  day together is the one option every birthday offers, so it is always a legal answer here. */
function walkFourYears(seed: string, tier?: CollegeTier): WorldState {
  const { world, rng } = atTheFork(seed)
  answerFork(world, 'college', tier)
  for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  return world
}

/** Press until exactly `years` are banked – the boundary the college card is read at. */
function spendYears(world: WorldState, rng: Rng, years: number): void {
  for (let press = 0; press < 3 * years && world.college!.years.length < years && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
}

/** ⚠ A RANGE OF CAREERS AND NOT ONE LUCKY SEED – the whole point of the floor. Walked once and
 *  shared, because the guarantee is the same question asked of every one of them. */
const SEEDS = ['r24-league-a', 'r24-league-b', 'r24-league-c', 'r24-league-d', 'r24-league-e', 'r24-league-f']
let walkedCache: WorldState[] | null = null
function walked(): WorldState[] {
  if (!walkedCache) walkedCache = SEEDS.map((s) => walkFourYears(s))
  return walkedCache
}

function yearsOf(world: WorldState): CollegeYear[] {
  return world.college?.years ?? []
}

/** ⚠⚠ THE FLOOR IS A CLAIM ABOUT A YEAR THAT WAS LIVED, AND THIS IS THE HONEST EDGE OF IT. A year
 *  can be CUT SHORT – `resumeFromCollege` breaks on a fresh ending, because a career-ending injury
 *  can land at college (she is playing a lot of tennis) – and `bankCollegeYear` banks the stub as it
 *  stood. If it ended before `COLLEGE_LEAGUE.seasonWeek` came round it really held no championship,
 *  and inventing one for it would be a fixture asserting a week that did not happen.
 *
 *  Measured over 100 careers (`tools/college-year-content.ts`): ONE such year in 399. Every case
 *  below scopes to full years and then asserts the walked careers are all full, so the scoping can
 *  never quietly swallow a regression. */
function isFullYear(year: CollegeYear): boolean {
  return year.untilWeek - year.fromWeek >= WEEKS_PER_YEAR
}

/** The world week inside `[from, until)` whose season week is `seasonWeek`. Exactly one exists in a
 *  52-week span – which is the arithmetic the entire guarantee rests on. */
function weekOfSeasonWeek(from: number, until: number, seasonWeek: number): number | null {
  for (let w = from; w < until; w++) if (w % WEEKS_PER_YEAR === seasonWeek) return w
  return null
}

// =================================================================================================
// ⭐⭐⭐ 1. THE FLOOR – A TOURNAMENT IN EVERY COLLEGE YEAR, AND IT IS NOT A ROLL
// =================================================================================================
describe('the floor: every college year holds a student tournament', () => {
  it('⭐⭐⭐ every year of every walked career has a championship, with matches in the feed', () => {
    let years = 0
    for (const world of walked()) {
      const list = yearsOf(world)
      expect(list, `${world.seed}: four years spent`).toHaveLength(ENDINGS.collegeYears)
      for (const year of list) {
        expect(isFullYear(year), `${world.seed} year ${year.index}: a full year, so the floor applies`).toBe(true)
        years += 1
        expect(year.league, `${world.seed} year ${year.index}: a championship, every year`).not.toBeNull()
        expect(year.league!.week).toBeGreaterThanOrEqual(year.fromWeek)
        expect(year.league!.week).toBeLessThan(year.untilWeek)
        // ⚠ AND IT IS A PLAYED TOURNAMENT RATHER THAN A ROW OF STATE. Between one and three real
        // matches, which is the difference between this and the squad trips it sits beside.
        const matches = collegeLeagueMatchesOf(world, year.league!.week)
        expect(matches.length, `${world.seed} year ${year.index}: at least one match`).toBeGreaterThanOrEqual(1)
        expect(matches.length).toBeLessThanOrEqual(COLLEGE_LEAGUE_ROUNDS)
        expect(matches.length, 'the run and its matches agree').toBe(leagueMatchesPlayed(year.league!))
      }
    }
    expect(years, 'six careers × four years').toBe(SEEDS.length * ENDINGS.collegeYears)
  }, 240_000)

  it('⭐⭐ the floor is not a property of the dear places – it holds at every tier', () => {
    // The tier buys development (`collegeCoachFactor`, `matchesPerWeek`); it does not buy the
    // fixture. A guarantee that only the expensive programme kept would be a paywall on content.
    for (const tier of COLLEGE_TIER_ORDER) {
      const world = walkFourYears(`r24-tier-${tier}`, tier)
      const list = yearsOf(world)
      expect(list.length, `${tier}: four years`).toBe(ENDINGS.collegeYears)
      for (const year of list) expect(year.league, `${tier} year ${year.index}`).not.toBeNull()
    }
  }, 240_000)

  it('⚠ it is ARITHMETIC and not probability – the week occurs exactly once in every college year', () => {
    // The property the guarantee rests on, asserted directly on the calendar rather than inferred
    // from the walk: any 52 consecutive weeks contain each season week exactly once.
    for (const world of walked()) {
      for (const year of yearsOf(world)) {
        const hits: number[] = []
        for (let w = year.fromWeek + 1; w <= year.untilWeek; w++) {
          if (w % WEEKS_PER_YEAR === COLLEGE_LEAGUE.seasonWeek) hits.push(w)
        }
        expect(hits, `${world.seed} year ${year.index}`).toHaveLength(1)
        expect(year.league!.week).toBe(hits[0])
      }
    }
  }, 240_000)

  it('⚠ and the predicate refuses outside the freeze – a girl on the tour is not in a student draw', () => {
    const { world, rng } = atTheFork('r24-league-scope')
    world.week = COLLEGE_LEAGUE.seasonWeek
    expect(inCollege(world)).toBe(false)
    expect(collegeLeagueWeek(world)).toBe(false)
    // Three seasons on the tour and not one student championship row.
    const tour = createWorld('r24-league-tour', { ...DEFAULT_PROFILE })
    const tourRng = rngFromSeed(tour.seed)
    for (let i = 0; i < 2 * WEEKS_PER_YEAR; i++) tickWeek(tour, tourRng)
    expect(tour.events.filter((e) => e.text.includes(COLLEGE_LEAGUE.label))).toHaveLength(0)
    void rng
  }, 120_000)
})

// =================================================================================================
// ⭐⭐ 2. THE CEILING – «минимум 1, максимум 2 турнира на учебный год»
// =================================================================================================
describe('the ceiling: never a third tournament in one academic year', () => {
  it('⭐⭐ no walked year ever holds three, and the maximum of two is really reached', () => {
    let two = 0
    for (const world of walked()) {
      for (const year of yearsOf(world)) {
        const n = (year.league ? 1 : 0) + (year.callUp ? 1 : 0)
        expect(n, `${world.seed} year ${year.index}: the owner's ceiling`).toBeLessThanOrEqual(2)
        expect(n, `${world.seed} year ${year.index}: the owner's floor`).toBeGreaterThanOrEqual(1)
        if (n === 2) two += 1
      }
    }
    expect(two, 'and both tournaments really do co-occur, or the ceiling is untested').toBeGreaterThan(0)
  }, 240_000)

  it('⚠ the three marked kinds of week are three DIFFERENT weeks, so none can silently merge', () => {
    // A trip landing on the championship week would make one week mean two things and would delete
    // the beat rather than add one – the same argument `COLLEGE_TRIP_WEEKS` already makes about the
    // call-up week.
    expect(COLLEGE_LEAGUE.seasonWeek).not.toBe(NATIONAL_TEAM.seasonWeek)
    expect(COLLEGE_TRIP_WEEKS as readonly number[]).not.toContain(COLLEGE_LEAGUE.seasonWeek)
    expect(COLLEGE_TRIP_WEEKS as readonly number[]).not.toContain(NATIONAL_TEAM.seasonWeek)
  })

  it('⭐⭐ and the championship comes BEFORE the call-up, which is what makes the lean possible', () => {
    // The gap is the mechanism rather than a layout: a championship played after the selectors have
    // picked could not be leaned on. Two weeks, on the season clock.
    expect(COLLEGE_LEAGUE.seasonWeek).toBeLessThan(NATIONAL_TEAM.seasonWeek)
    // ...and in a walked career it really lands earlier in the same academic year.
    let sameYearOrder = 0
    for (const world of walked()) {
      for (const year of yearsOf(world)) {
        const callWeek = weekOfSeasonWeek(year.fromWeek + 1, year.untilWeek + 1, NATIONAL_TEAM.seasonWeek)!
        if (year.league!.week < callWeek) sameYearOrder += 1
      }
    }
    expect(sameYearOrder, 'the ordinary case is the championship first, in the same year').toBe(
      SEEDS.length * ENDINGS.collegeYears,
    )
  }, 240_000)

  it('⚠ exactly ONE championship summary row per college year – it cannot fire twice', () => {
    for (const world of walked()) {
      for (const year of yearsOf(world)) {
        const rows = world.events.filter(
          (e) =>
            e.week > year.fromWeek &&
            e.week <= year.untilWeek &&
            e.match === undefined &&
            e.text.includes(COLLEGE_LEAGUE.label),
        )
        expect(rows, `${world.seed} year ${year.index}`).toHaveLength(1)
      }
    }
  }, 240_000)
})

// =================================================================================================
// ⭐⭐⭐ 3. THE LEAN – THE LETTER IS EARNED, AND THIS IS THE HALF THAT MAKES THE ROUND WORTH BUILDING
// =================================================================================================
describe('the call-up leans on the championship result', () => {
  it('⭐⭐⭐ the ladder is MONOTONE and its ends are far apart – playing better is never worse', () => {
    // The one shape this may never have is a dip: it would mean a better championship made the
    // letter less likely. Asserted over the whole ladder rather than at its ends.
    for (let r = 1; r <= COLLEGE_LEAGUE_ROUNDS; r++) {
      expect(callChanceFor(r), `rung ${r} over rung ${r - 1}`).toBeGreaterThan(callChanceFor(r - 1))
    }
    // ⚠ AND THE SPREAD IS THE FEATURE. A ladder that rose by a hair would be a lean nobody could
    // feel – decorative, which is exactly the failure mode this case exists to catch.
    expect(callChanceFor(COLLEGE_LEAGUE_ROUNDS) - callChanceFor(0)).toBeGreaterThanOrEqual(0.5)
    // ⚠ NO CHAMPIONSHIP ON RECORD, NO LETTER. The mechanism, not a guard against a missing value.
    expect(callChanceFor(null)).toBe(0)
    // One rung per possible result, so no result can read off the end of the ladder.
    expect(NATIONAL_TEAM.callChanceByLeague).toHaveLength(COLLEGE_LEAGUE_ROUNDS + 1)
  })

  it('⭐⭐⭐ IDENTICAL DRAWS, ONLY THE RESULT DIFFERENT: the champion is called where the loser is not', () => {
    // ⚠ THE MECHANISM AND NOT ONE SEED'S OUTCOME. Every arm below is the SAME sub-stream, the same
    // age and the same skill mean – the only thing that moves is what she did at the championship.
    // So a difference in the letters can only be the lean.
    const rungs = [0, 1, 2, 3]
    const called: number[][] = rungs.map(() => [])
    for (let week = 0; week < 600; week++) {
      for (const r of rungs) {
        const out = rollCallUp(
          { ageYears: 20, skillMean: 60, leagueRoundsWon: r },
          rngFromSeed(`lean:callup:${week}`),
        )
        if (out) called[r].push(week)
      }
    }
    // Strictly nested: a champion is called on every week a first-round loser is, and on more.
    for (let r = 1; r <= 3; r++) {
      for (const week of called[r - 1]) expect(called[r], `rung ${r} contains rung ${r - 1}`).toContain(week)
      expect(called[r].length, `rung ${r} is called more often than rung ${r - 1}`).toBeGreaterThan(called[r - 1].length)
    }
    // And the ends are far apart in the realised rate, not only in the constant.
    expect(called[3].length / 600).toBeGreaterThan(0.75)
    expect(called[0].length / 600).toBeLessThan(0.25)
    // ⚠ NO CHAMPIONSHIP AT ALL – no letter, on any week.
    for (let week = 0; week < 600; week++) {
      expect(rollCallUp({ ageYears: 20, skillMean: 60, leagueRoundsWon: null }, rngFromSeed(`lean:callup:${week}`))).toBeNull()
    }
  })

  it('⚠ FOUR DRAWS STILL, whatever the result – the count cannot depend on the ladder', () => {
    // The post-draw discipline `rollCallUp` has always kept, re-asserted across the new dimension:
    // a threshold that changed the number of pulls would re-map `nationFinish` per result.
    for (const r of [null, 0, 1, 2, 3]) {
      const inner = rngFromSeed(`count:callup:${r}`)
      let pulls = 0
      const counting: Rng = () => {
        pulls += 1
        return inner()
      }
      rollCallUp({ ageYears: 20, skillMean: 60, leagueRoundsWon: r }, counting)
      expect(pulls, `result ${r}`).toBe(4)
    }
  })

  it('⭐⭐⭐ END TO END, THROUGH THE REAL TICK: every year\'s letter matches the result the selectors read', () => {
    // ⚠⚠ THIS IS THE WIRING GUARD AND IT IS THE ONE THAT MATTERS. The case above drives the leaf by
    // hand, so it would stay green if `resolveCallUp` stopped reading the championship altogether –
    // which is exactly the failure this round has already seen twice. Here nothing is injected: six
    // careers are walked through `resumeFromCollege`, and for every college year the letter is
    // PREDICTED from the championship on record at that week and compared with what the engine did.
    // If the seam went back to a bare roll the two would disagree wherever a uniform falls between
    // the old constant and the rung, which over 24 years is not a coincidence anybody can survive.
    let years = 0
    let onTheHighRungs = 0
    for (const world of walked()) {
      const runs = yearsOf(world)
        .map((y) => y.league)
        .filter((l): l is NonNullable<typeof l> => l !== null)
      for (const year of yearsOf(world)) {
        const callWeek = weekOfSeasonWeek(year.fromWeek + 1, year.untilWeek + 1, NATIONAL_TEAM.seasonWeek)!
        const before = runs.filter((r) => r.week < callWeek)
        const read = before.length ? before[before.length - 1].roundsWon : null
        const chance = callChanceFor(read)
        // ⚠ THE AGE GATE IS PART OF THE PREDICTION AND NOT AN EXCUSE, and leaving it out is what made
        // this case fail on its first run. `atTheFork` forces the question on week 0 to keep the walk
        // cheap, so year one of these fixtures is played at THIRTEEN – and `rollCallUp` correctly
        // refuses anybody under `minAgeYears`, whatever she did at the championship. In real play the
        // fork is at nineteen and this clause is always true; here it is the difference between
        // predicting the engine and predicting half of it.
        const predicted =
          kidAgeYears(callWeek, world.profile.birthMonth, world.profile.birthDay) >= NATIONAL_TEAM.minAgeYears &&
          rngFromSeed(`${world.seed}:callup:${callWeek}`)() < chance
        expect(year.callUp !== null, `${world.seed} w${callWeek}: read ${read}, chance ${chance}`).toBe(predicted)
        years += 1
        if (chance > NATIONAL_TEAM.callChance) onTheHighRungs += 1
      }
    }
    expect(years).toBe(SEEDS.length * ENDINGS.collegeYears)
    // ⚠ AND THE SAMPLE REALLY CONTAINS YEARS THE OLD CONSTANT WOULD HAVE JUDGED DIFFERENTLY, or the
    // case above would pass against a reverted seam by accident.
    expect(onTheHighRungs, 'years whose rung is above the historical bare roll').toBeGreaterThan(0)
  }, 240_000)

  it('⚠ the middle rung IS the historical bare roll, so the mechanic was re-shaped and not re-tuned', () => {
    expect(callChanceFor(1)).toBe(NATIONAL_TEAM.callChance)
  })
})

// =================================================================================================
// ⭐⭐ 4. WATCHABLE – IT REACHES THE SHELL AND IT CAN BE OPENED
// =================================================================================================
describe('the championship is watchable', () => {
  it('⭐⭐ every stored match REPLAYS – the same simulateMatch under the same seed, point for point', () => {
    // This is literally what `MatchReplay` does, so a record that failed here is a Watch button that
    // opens on nothing.
    let checked = 0
    for (const world of walked()) {
      for (const year of yearsOf(world)) {
        for (const m of collegeLeagueMatchesOf(world, year.league!.week)) {
          // ⚠ THE SEED IS ASSERTED PRESENT RATHER THAN DEFAULTED. `WorldMatch.seed` is optional on
          // the type (old rows have none) and a record without one cannot be replayed at all – a
          // `?? ''` here would have quietly re-run a DIFFERENT match and compared it to nothing.
          expect(m.seed, `${m.eventId}: a record with no seed is a Watch button that opens on air`).toBeTruthy()
          const again = simulateMatch(m.a, m.b, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed! })
          expect(again.sets.map((s) => `${s.a}-${s.b}`).join(' '), m.eventId).toBe(m.score ?? '')
          expect(again.winner === 0 ? KID_ID : m.bId).toBe(m.winnerId)
          checked += 1
        }
      }
    }
    expect(checked, 'and there was something to replay').toBeGreaterThan(SEEDS.length * ENDINGS.collegeYears)
  }, 240_000)

  it('⭐⭐ it reaches the SNAPSHOT the college card reads – the run and its matches, together', () => {
    // ⚠ THE CARD IS DRAWN AT A YEAR BOUNDARY, where the ending is latched. The FOURTH year takes the
    // latch off for good (`finishCollege`), so the state the player actually reads is a boundary
    // BEFORE that – two years spent, the question still open.
    const three = atTheFork('r24-league-shell')
    answerFork(three.world, 'college')
    spendYears(three.world, three.rng, 2)
    const snap = toSnapshot(three.world)
    const college = snap.ending?.college ?? null
    expect(college, 'the college card has a view to draw').not.toBeNull()
    expect(college!.league, 'and it names the championship').not.toBeNull()
    expect(college!.leagueMatches.length, 'and hands it the records to open').toBeGreaterThanOrEqual(1)
    for (const m of college!.leagueMatches) {
      expect(m.eventId.startsWith(`college-w${college!.league!.week}-r`)).toBe(true)
      expect(m.seed, 'a record with no seed cannot be replayed').toBeTruthy()
    }
  }, 240_000)

  it('⚠ the id names no tier, exactly like a rubber, so nothing invents a rung for it', () => {
    expect(collegeLeagueMatchId(300, 1)).toBe('college-w300-r1')
    // `tierFromEventId` reads the LAST dash-segment; `r1` is not a tier, which is the property.
    expect(collegeLeagueMatchId(300, 1).split('-').pop()).toBe('r1')
  })

  it('⚠ the two competitions do not read each other\'s rows', () => {
    const world = walked()[0]
    for (const year of yearsOf(world)) {
      const league = collegeLeagueMatchesOf(world, year.league!.week)
      expect(league.every((m) => m.eventId.startsWith('college-w'))).toBe(true)
      if (year.callUp) {
        const rubbers = callUpRubbersOf(world, year.callUp.week)
        // ⚠⚠ THE COUNT FIRST, AND A MUTATION ARM IS WHY. `.every()` on an EMPTY array is true, so a
        // version of this case that only checked the prefixes passed with the call-up's rows deleted
        // outright – measured, by an arm that removed the wrong `addEvent` of the two identical ones
        // in this file and went green. An assertion that survives the feature's deletion is not an
        // assertion, so the count is checked before the shape.
        expect(rubbers, `${world.seed} w${year.callUp.week}`).toHaveLength(year.callUp.rubbersPlayed)
        expect(rubbers.every((m) => m.eventId.startsWith('nations-w'))).toBe(true)
      }
    }
  }, 240_000)

  it('⚠ and the week reports itself out of the year-long loop – it cannot pass in silence', () => {
    const { world, rng } = atTheFork('r24-league-stop')
    answerFork(world, 'college')
    const stops = resumeFromCollege(world, rng)
    expect(stops, 'every college year raises it, because the championship always happens').toContain('college-league')
    // ⚠ AND IT LEADS THE CALL-UP WHERE BOTH FIRED – causal order (STOP_PRECEDENCE).
    expect(STOP_PRECEDENCE.indexOf('college-league')).toBeLessThan(STOP_PRECEDENCE.indexOf('call-up'))
    if (stops.includes('call-up')) {
      expect(stops.indexOf('college-league')).toBeLessThan(stops.indexOf('call-up'))
    }
  }, 120_000)
})

// =================================================================================================
// ⚠⚠ 5. THE PRICE – SHE IS AN AMATEUR, AND THAT IS LOAD-BEARING
// =================================================================================================
describe('the championship awards nothing, and that is the constraint', () => {
  it('⚠⚠ no ranking points and no prize money – it never touches world.results', () => {
    // W2-ENDINGS: «nobody writes to an amateur» is why the sponsors, the academy and the gear shop
    // are all shut inside the freeze. A student fixture paying points would quietly make four years
    // of college a ranking route and the fork would stop being a real choice.
    for (const world of walked()) {
      // ⚠ NOT ONE ROW IN HER COLUMN over the whole freeze – `SeasonResult` has no event id, so the
      // precise form of "the championship awards nothing" is that the weeks it was played on wrote
      // her nothing at all. The rest of the table keeps filling, which is B1's fix still working.
      expect(world.results.filter((r) => r.playerId === KID_ID), `${world.seed}`).toHaveLength(0)
      for (const year of yearsOf(world)) {
        const week = year.league!.week
        expect(world.results.filter((r) => r.week === week && r.playerId === KID_ID)).toHaveLength(0)
      }
    }
  }, 240_000)

  it('⚠ every match row is a FRIENDLY and is KEPT – it is not evidence, and it is not prunable', () => {
    // `friendly` is the one predicate the radar, the avatar's emotion, the knock history and the
    // Weekly Story read to decide whether a match is evidence about her form. `keep` is why the
    // rows are still there four years later, when everything else about the week has been pruned.
    for (const world of walked()) {
      const rows = world.events.filter((e) => e.match?.eventId.startsWith('college-w'))
      expect(rows.length).toBeGreaterThan(0)
      for (const row of rows) {
        expect(row.friendly, `${row.week}: not evidence`).toBe(true)
        expect(row.keep, `${row.week}: survives the prune`).toBe(true)
        expect(row.type).toBe('match')
      }
      const summaries = world.events.filter((e) => e.match === undefined && e.text.includes(COLLEGE_LEAGUE.label))
      for (const row of summaries) {
        expect(row.type).toBe('milestone')
        expect(row.keep).toBe(true)
        expect(row.amountCents, 'no cheque, in either direction').toBeUndefined()
      }
    }
  }, 240_000)

  it('⚠ the line states the two facts and grades nothing (career-contract §6)', () => {
    const line = collegeLeagueLine({ roundsWon: 1, rounds: 3 })
    expect(line).toContain('No prize money and no ranking points')
    expect(line.toLowerCase()).not.toMatch(/unlucky|deserved|brave|sadly|at least|only |but /)
    expect(collegeLeagueLine({ roundsWon: 3, rounds: 3 })).toContain('she won it')
    expect(collegeLeagueLine({ roundsWon: 0, rounds: 3 })).toContain('Quarterfinal')
  })

  it('⚠ names are FICTIONAL – no trademark is constructible from the label', () => {
    const label = COLLEGE_LEAGUE.label.toLowerCase()
    for (const word of ['ncaa', 'itf', 'wta', 'atp', 'ivy', 'pac-12', 'big ten', 'olympic']) {
      expect(label, `"${word}" must not appear in a shipped event name`).not.toContain(word)
    }
  })

  it('⚠ the record\'s own readers agree with each other', () => {
    expect(wonTheLeague({ roundsWon: 3, rounds: 3 })).toBe(true)
    expect(wonTheLeague({ roundsWon: 2, rounds: 3 })).toBe(false)
    // ⚠ THE CHAMPION PLAYS NO EXTRA MATCH: three wins is three fixtures, not four.
    expect(leagueMatchesPlayed({ roundsWon: 3, rounds: 3 })).toBe(3)
    expect(leagueMatchesPlayed({ roundsWon: 0, rounds: 3 })).toBe(1)
    expect(leagueExitLabel({ roundsWon: 2, rounds: 3 })).toBe('Final')
    expect(leagueExitLabel({ roundsWon: 0, rounds: 3 })).toBe('Quarterfinal')
  })

  it('⚠ the whole draw is composed before a ball is struck – who was waiting is a fact about the draw', () => {
    // The same post-draw discipline `rollCallUp` and `playCallUpRubbers` keep: a loop that composed
    // as it went would make the eventual finalist's identity depend on her own first-round result.
    const a = rngFromSeed('draw:x')
    const b = rngFromSeed('draw:x')
    const first = [0, 1, 2].map((r) => collegeLeagueOpponent(collegeLeagueMatchId(100, r), a))
    const again = [0, 1, 2].map((r) => collegeLeagueOpponent(collegeLeagueMatchId(100, r), b))
    expect(first).toEqual(again)
    expect(new Set(first.map((p) => p.id)).size, 'three different women').toBe(3)
  })
})

// =================================================================================================
// ⚠⚠ 6. WHAT THIS ROUND MAY NOT UNDO – B1's FIX, AND THE MAIN STREAM
// =================================================================================================
describe('the freeze still behaves', () => {
  it('⚠⚠ four years at college still leave a PLAYABLE world – calendar, results, rank', () => {
    // B1's round-24 fix, re-asserted from this round's side: the championship must not become a
    // second way to strand a career inside the freeze.
    for (const world of walked()) {
      expect(world.ending, `${world.seed}: the latch is off at graduation`).toBeNull()
      expect(world.pendingTournament, 'and the championship opens no reveal').toBeNull()
      expect(world.season.filter((e) => e.week > world.week).length, 'a calendar to enter').toBeGreaterThan(0)
      expect(world.results.length, 'a world that has been playing').toBeGreaterThan(0)
      expect(fullRanking(world).filter((r) => r.points > 0).length, 'somebody holds a point').toBeGreaterThan(0)
      expect(world.entries, 'nothing stale survived the freeze').toHaveLength(0)
    }
  }, 240_000)

  it('⚠⚠ the championship costs the MAIN stream NOTHING – input-independence (invariant 2)', () => {
    // Its draws are `seed:collegeleague:<week>` and `seed:collegematch:<week>:<r>`, both re-derived
    // at the call site. A career that answered «college» and one that did not must sit in the SAME
    // position on MAIN after the same number of weeks.
    const college = createWorld('r24-league-main', { ...DEFAULT_PROFILE })
    const control = createWorld('r24-league-main', { ...DEFAULT_PROFILE })
    college.rngMain = initMainState(college.seed)
    control.rngMain = initMainState(control.seed)
    const rngA = rngFromSeed(college.seed)
    const rngB = rngFromSeed(control.seed)
    college.fork = { askedWeek: college.week, answer: null, offer: null }
    answerFork(college, 'college')
    // ⚠ ROUND 24: the year pauses on her birthday and the gift is answered mid-walk – which makes
    // this arm STRONGER, not different: a paused, answered, resumed year must still sit in the SAME
    // MAIN position as fifty-two uninterrupted control ticks, or the birthday moved the world's dice.
    for (let press = 0; press < 4 && college.week < WEEKS_PER_YEAR; press++) {
      resumeFromCollege(college, rngA)
      if (pendingBirthday(college) !== null) chooseGift(college, 'day')
    }
    for (let i = 0; i < WEEKS_PER_YEAR; i++) tickWeek(control, rngB)
    expect(college.week).toBe(control.week)
    expect(college.rngMain.n, 'the same number of MAIN draws').toBe(control.rngMain.n)
    expect(rngA()).toBe(rngB())
  }, 120_000)

  it('⚠ the same seed and week give the same championship, however often it is asked', () => {
    const a = walkFourYears('r24-league-repeat')
    const b = walkFourYears('r24-league-repeat')
    expect(yearsOf(a).map((y) => y.league)).toEqual(yearsOf(b).map((y) => y.league))
  }, 240_000)
})

// =================================================================================================
// ⭐ 7. A SAVE ALREADY INSIDE THE FREEZE – what v55 -> v56 does to it, exactly
// =================================================================================================
describe('a career migrated mid-college', () => {
  const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

  it('⭐ v55 mid-college migrates to null championships – and its REMAINING years get real ones', () => {
    // ⚠ NULL IS THE TRUE VALUE, NOT A PLACEHOLDER (v30's case). The banked year was lived before this
    // fixture existed, so it held no championship; reconstructing one would write a scoreline into a
    // week that did not have one.
    const raw = JSON.parse(readFileSync(`${DIR}/v55.json`, 'utf8'))
    const world = migrateSave(raw)
    expect(world.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(world.college, 'the fixture is a career inside the freeze').not.toBeNull()
    expect(world.college!.doneWeek).toBeNull()
    expect(world.college!.pendingLeague).toBeNull()
    expect(world.college!.years.length).toBeGreaterThan(0)
    for (const y of world.college!.years) expect(y.league, 'a year it really lived without one').toBeNull()
    expect(lastLeagueRun(world.college!), 'so the selectors have nothing to read yet').toBeNull()

    // ...and the years it has LEFT are ordinary years: the next one holds a championship.
    // ⚠ Round 24: an ordinary year pauses on her birthday too – a migrated career's remaining years
    // are asked properly, so the walk is press-answer-press like everyone else's.
    const before = world.college!.years.length
    const rng = resumeMain(world.rngMain)
    for (let press = 0; press < 3 && world.college!.years.length === before && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    const banked = world.college!.years
    expect(banked.length).toBe(before + 1)
    expect(banked[banked.length - 1].league, 'the first year it plays under v56 has one').not.toBeNull()
    expect(lastLeagueRun(world.college!)).not.toBeNull()
  }, 120_000)

  it('⚠ a save with no college at all falls straight through the migration', () => {
    const raw = JSON.parse(readFileSync(`${DIR}/v54.json`, 'utf8'))
    raw.college = null
    expect(() => migrateSave(raw)).not.toThrow()
    expect(migrateSave(raw).college).toBeNull()
  })

  it('⚠ the migration is idempotent – a v56 save is not touched again', () => {
    const raw = JSON.parse(readFileSync(`${DIR}/v56.json`, 'utf8'))
    const once = migrateSave(JSON.parse(JSON.stringify(raw)))
    const twice = migrateSave(JSON.parse(JSON.stringify(once)))
    expect(twice.college).toEqual(once.college)
  })
})
