// =================================================================================================
// ⭐⭐⭐ ROUND 27 #6 – THE NATIONS CUP TIE: A LETTER FIRST, THE FLOW SECOND, AND NO POPUP AT ALL
// =================================================================================================
//
// The owner, having watched round 26 fix the identical shape for the College League one file away:
//   «И опять на те же грабли: "Her country called this year…" во всплывашке сверху и матчи только
//    постфактум. Мы уже обсудили, что мы знаем будет это происходить или нет, можно письмо об этом
//    пользователю нормальное присылать с приглашением на турнир и проводить этот турнир по обычному
//    флоу турнира. А этот попап не нужен для этого флоу вообще.»
//
// ⚠⚠ THE DEFECT WAS NEVER THE TENNIS. `playCallUpRubbers` really played the rubbers, through the
// same `simulateMatch`, under stored seeds, and wrote them into the feed `keep: true`. What was
// wrong was the ORDER: the week resolved inside the tick and the player was handed a toast reading
// «Her country called this year – her matches are in the news feed, and they can be watched», which
// is a sentence about something he was not present for. No wording could have fixed that.
//
// ⭐ AND HIS OWN OBSERVATION IS WHAT MADE THE FIX CHEAP: the game knows in advance. `rollCallUp` is a
// pure function of a per-week sub-stream and a view whose only load-bearing input – her college
// championship – is final two weeks before the tie. So the same question can be asked a week early
// and answered identically, which is what `callUpFor` is and what this file measures first.
//
// THE FOUR CLAIMS, in the order the player meets them:
//   1. A LETTER ARRIVES BEFORE THE WEEK, and it is exact – never a tie without one, never one
//      without a tie.
//   2. THE TIE PAUSES THE YEAR and is walked in `TournamentFlow`, through the same three commands
//      the tour and the College League already use.
//   3. THE FLOW TELLS THE TRUTH ABOUT IT – no table, no rung, no draw, and the amateur sentence is
//      the SQUAD's rather than the student field's.
//   4. THE TOAST IS GONE, and `friendly` is not.
import { describe, it, expect } from 'vitest'
import {
  answerFork,
  callUpFor,
  callUpLetterWeek,
  callUpRevealMatches,
  callUpRevealOpen,
  callUpRubbersOf,
  chooseGift,
  closeTournament,
  createWorld,
  enterEvent,
  KID_ID,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { resumeMain, type Rng } from '../src/engine/rng'
import { simulateMatch } from '../src/engine/match/engine'
import { JUNIOR_TOUR } from '../src/engine/season/tournament'
import { NATIONAL_TEAM, NATIONS_CUP_AWARDS_NOTHING } from '../src/engine/nationalTeam'
import { COLLEGE_LEAGUE } from '../src/engine/collegeLeague'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, STOP_PRECEDENCE, type CallUpLetterTerms, type Offer } from '../src/shared/protocol'
import { componentFile } from './worldSource'
import { region } from './helpers/source'

/** A tour reveal, walked out – the loop every college fixture in this repo already carries. */
function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** ⭐ A CAREER THAT REALLY PLAYED TO THE FORK AND REALLY ANSWERED «college» – never a hand-built
 *  snapshot. The same opener round 26 #6's suite walks, thumb on the scale and all: four years is
 *  208 weeks of base costs and a career that went bankrupt inside them would be measuring the family
 *  budget instead of this. */
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

/** «Skip all rounds» then the finale's «Continue» – the two commands the flow's own controls call,
 *  dispatched at whichever college reveal is standing. */
function answerAnyCollegeReveal(world: WorldState): void {
  skipTournament(world)
  closeTournament(world)
}

/** ⚠ FIVE PRESSES A YEAR: a college year raises up to three questions now (the championship, the
 *  tie, her birthday) and each of them ends a press, so finishing one costs up to four. The loop
 *  terminates on the latch, which is what makes a stranded career a failing assertion rather than a
 *  hang. */
function walkTheFreeze(world: WorldState, rng: Rng): void {
  for (let press = 0; press < 5 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    answerAnyCollegeReveal(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
}

/** Press until a Nations Cup tie is standing open, answering everything else on the way.
 *  ⚠ IT THROWS IF IT NEVER GETS THERE, so no case below can go green against a career whose country
 *  never wrote – which is a real outcome and not one this file is allowed to mistake for a pass. */
function pressToTheTie(world: WorldState, rng: Rng): string[] {
  for (let press = 0; press < 5 * ENDINGS.collegeYears; press++) {
    const stops = resumeFromCollege(world, rng)
    if (callUpRevealOpen(world)) return stops
    answerAnyCollegeReveal(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    if (world.ending?.type !== 'college') break
  }
  throw new Error('the walked career never reached a Nations Cup tie')
}

const SEEDS = ['r27-tie-a', 'r27-tie-b', 'r27-tie-c', 'r27-tie-d', 'r27-tie-e', 'r27-tie-f']
let walkedCache: WorldState[] | null = null
/** ⚠ A RANGE OF CAREERS AND NOT ONE LUCKY SEED. The letter is a roll, so a single walk can be a year
 *  in which nobody wrote; the claims below are about the RELATIONSHIP between letters and ties, and
 *  a career with neither satisfies them vacuously. `letters` asserts the corpus is not vacuous. */
function walked(): WorldState[] {
  if (!walkedCache) {
    walkedCache = SEEDS.map((s) => {
      const { world, rng } = atCollege(s)
      walkTheFreeze(world, rng)
      return world
    })
  }
  return walkedCache
}

const callUpLetters = (world: WorldState): Offer[] => world.offers.filter((o) => o.kind === 'call-up')
const termsOf = (o: Offer): CallUpLetterTerms => o.terms as CallUpLetterTerms

// =================================================================================================
// ⭐⭐⭐ 1. THE LETTER ARRIVES BEFORE THE WEEK
// =================================================================================================
describe('#6 the invitation is posted before the tie, and it is exact', () => {
  it('⭐⭐⭐ every tie that was played was announced the week before it, and every letter was kept', () => {
    let ties = 0
    let letters = 0
    for (const world of walked()) {
      const years = world.college!.years
      const posted = callUpLetters(world)
      letters += posted.length
      for (const year of years) {
        if (year.callUp === null) continue
        ties++
        const letter = posted.find((o) => termsOf(o).tieWeek === year.callUp!.week)
        expect(letter, `a tie at week ${year.callUp.week} with no letter behind it`).toBeDefined()
        // ⚠⚠ THE WHOLE ITEM IN ONE LINE: the paper is dated BEFORE the week it is about.
        expect(letter!.week, 'the letter is filed the week before the tie').toBe(year.callUp.week - 1)
        expect(letter!.week).toBeLessThan(termsOf(letter!).tieWeek)
      }
      for (const letter of posted) {
        const tie = years.find((y) => y.callUp?.week === termsOf(letter).tieWeek)
        expect(tie, `a letter for week ${termsOf(letter).tieWeek} that no tie ever answered`).toBeDefined()
      }
    }
    expect(ties, 'the corpus really contains ties – otherwise everything above passes vacuously').toBeGreaterThan(0)
    expect(letters, 'and really contains letters').toBe(ties)
  })

  it('⭐⭐ it is an INFO letter: nothing to sign, nothing to refuse, and it never expires', () => {
    const posted = walked().flatMap(callUpLetters)
    expect(posted.length).toBeGreaterThan(0)
    for (const o of posted) {
      // ⚠ `info` IS THE FICTION AS WELL AS THE PLUMBING – research §0.7/§0.8: the association
      // nominates, availability is a Good Standing criterion, and «she may not decline». A Sign /
      // Refuse foot would offer a choice the engine will not honour, and an `open` letter would also
      // raise the 'offer' STOP – a blocking question with no buttons.
      expect(o.state, 'a nomination is not a proposal').toBe('info')
      expect(o.deadlineWeek, 'informational letters do not lapse').toBe(o.week)
      expect(o.id, 'keyed on the TIE week, so a replayed arrival cannot write it twice').toBe(
        `call-up-w${termsOf(o).tieWeek}`,
      )
    }
  })

  it('⭐⭐ the paper states the fixture and never an outcome – the half the toast got wrong', () => {
    const o = walked().flatMap(callUpLetters)[0]
    expect(o, 'the corpus really posted one').toBeDefined()
    const t = termsOf(o)
    expect(t.label).toBe(NATIONAL_TEAM.label)
    expect(t.squadSize).toBe(NATIONAL_TEAM.squadSize)
    expect(t.tiesInTheWeek).toBe(NATIONAL_TEAM.tiesInTheWeek)
    expect(t.nationsAtHerLevel).toBe(NATIONAL_TEAM.nationsAtHerLevel)
    // ⚠⚠ THE TEAM SHEET IS NOT ON IT, THOUGH THE ENGINE ALREADY HOLDS IT. `rollCallUp` draws
    // `rubbersPlayed` on the same sub-stream that decides the letter, so this shape COULD carry it –
    // and a letter that told the parent the side a week early would be the postfactum defect wearing
    // an envelope. Asserted as an ABSENCE because the temptation is to add it later.
    expect('rubbersPlayed' in t, 'the captain names the side at the tie, not on the paper').toBe(false)
    expect('rubbersWon' in t, 'and nothing about a week that has not happened').toBe(false)
    expect('nationFinish' in t).toBe(false)
    // ⚠ NUMBERS, NEVER ASSEMBLED PROSE – `AcademyLetterTerms`' rule, because `world.offers` is
    // persisted and a frozen sentence outlives the fixture it describes.
    for (const v of Object.values(t)) expect(typeof v === 'number' || typeof v === 'string' || v === null).toBe(true)
    expect(t.leagueRoundsWon === null || typeof t.leagueRoundsWon === 'number').toBe(true)
  })

  it('⭐⭐⭐ THE PREDICTION IS EXACT: the same answer from the letter week and from the tie week', () => {
    // ⚠⚠ THIS IS THE CLAIM THE WHOLE ITEM RESTS ON – the owner's «мы знаем будет это происходить или
    // нет». `callUpFor` is asked about a WEEK rather than about today, and the letter and the tick
    // are its two callers, a week apart. Three things could make them disagree and none does:
    //   the STREAM  – keyed on the tie's week, so both derive the identical `seed:callup:<tie>`
    //   her AGE     – computed for the tie's week, so a birthday between them cannot move it
    //   her SKILL   – today's on both calls, and it feeds ONE expression whose draw count is one
    //                 uniform whatever the probability is
    // The third is the subtle one, so it is MUTATED here rather than argued: drive her skill to the
    // floor and to the ceiling and watch everything except `rubbersWon` stand still.
    const { world, rng } = atCollege('r27-predict')
    resumeFromCollege(world, rng)
    const tie = world.college!.fromWeek + 200 - ((world.college!.fromWeek + 200) % WEEKS_PER_YEAR) + NATIONAL_TEAM.seasonWeek
    const fromToday = callUpFor(world, tie)
    // ...asked from a DIFFERENT week, which is what the letter does.
    const savedWeek = world.week
    world.week = tie - 1
    const fromTheLetterWeek = callUpFor(world, tie)
    world.week = savedWeek
    expect(fromTheLetterWeek, 'the asking week does not move the answer').toEqual(fromToday)

    const saved = { ...world.skills }
    for (const value of [20, 99]) {
      for (const k of Object.keys(world.skills) as (keyof typeof world.skills)[]) world.skills[k] = value
      const moved = callUpFor(world, tie)
      expect(moved === null, `her skill must not decide whether her country writes (at ${value})`).toBe(
        fromToday === null,
      )
      if (moved && fromToday) {
        expect(moved.rubbersPlayed, 'nor how many rubbers the captain gives her').toBe(fromToday.rubbersPlayed)
        expect(moved.nationFinish, 'nor where her nation finishes – nothing in that draw reads her').toBe(
          fromToday.nationFinish,
        )
      }
    }
    Object.assign(world.skills, saved)
    // ⚠ AND THE ONE VALUE IT DOES MOVE IS THE ONE THE LETTER NEVER STATES: `rubbersWon` is the MODEL,
    // overwritten by `playCallUpRubbers` with what happened on court.
  })

  it('⚠ the letter week is guarded on the TIE being inside the course, not merely on today', () => {
    // ⚠ THE FINAL YEAR IS THE CASE. `untilWeek` lands on the season week she enrolled on, so a career
    // that enrolled on `NATIONAL_TEAM.seasonWeek` reaches its last week 13 inside college and its
    // week 14 outside it. A letter raised there would invite her to a tie the tick never plays.
    const { world } = atCollege('r27-guard')
    const college = world.college!
    const savedWeek = world.week
    const savedUntil = college.untilWeek
    // Stand the world on a letter week whose tie is the first week PAST the course.
    world.week = college.fromWeek + 100
    while (world.week % WEEKS_PER_YEAR !== (NATIONAL_TEAM.seasonWeek - 1 + WEEKS_PER_YEAR) % WEEKS_PER_YEAR) world.week++
    college.untilWeek = world.week + 1
    expect(callUpLetterWeek(world), 'the tie is the boundary week itself – outside the course').toBe(false)
    college.untilWeek = world.week + 2
    expect(callUpLetterWeek(world), 'and inside it, the same week posts').toBe(true)
    world.week = savedWeek
    college.untilWeek = savedUntil
  })
})

// =================================================================================================
// ⭐⭐⭐ 2. THE TIE STOPS THE YEAR AND IS WALKED
// =================================================================================================
describe('#6 the tie is played through the ordinary tournament flow', () => {
  it('⭐⭐⭐ one press lands ON the tie week: nothing banked, the latch back on, the reveal open', () => {
    expect(NATIONAL_TEAM.seasonWeek, 'the arithmetic below assumes the tie at 14').toBe(14)
    const { world, rng } = atCollege('r27-tie-a')
    const stops = pressToTheTie(world, rng)

    expect(stops, 'the week reports itself, as it always did').toContain('call-up')
    expect(world.week % WEEKS_PER_YEAR, 'and the world is standing ON the tie week').toBe(NATIONAL_TEAM.seasonWeek)
    expect(world.ending?.type, 'the latch is back on, so the Home shell draws').toBe('college')
    expect(world.college!.pendingYearStart, 'the year is paused, not spent – its opening is persisted').not.toBeNull()
    expect(world.college!.callUpReveal, 'and the reveal is open at rubber zero').toEqual({
      week: world.week,
      revealed: 0,
    })
  })

  it('⭐⭐⭐ the matches he is being offered are the ones the tick really played', () => {
    const { world, rng } = atCollege('r27-tie-b')
    pressToTheTie(world, rng)
    const call = world.college!.pendingCallUp!
    const matches = callUpRevealMatches(world)
    expect(matches, 'the reveal walks the week, not a copy of it').toEqual(callUpRubbersOf(world, call.week))
    expect(matches.length, 'as many as the captain gave her').toBe(call.rubbersPlayed)
    expect(matches.length).toBeGreaterThan(0)
    expect(matches.every((m) => typeof m.seed === 'string' && m.seed.length > 0), 'every one replayable').toBe(true)
  })

  it('⭐⭐⭐ ...and every stored rubber REPLAYS – the same simulateMatch under the same seed', () => {
    // ⚠ THE GUARD THAT CAUGHT A BUILDER THIS WEEK, ASKED OF THE SECOND FIXTURE. A record whose seed
    // no longer reproduces its own scoreline is a replay button that lies, and this wave moves WHEN
    // the reveal opens – never what was drawn – so it has to answer for that here.
    let replayed = 0
    for (const world of walked()) {
      for (const year of world.college!.years) {
        if (!year.callUp) continue
        for (const m of callUpRubbersOf(world, year.callUp.week)) {
          // ⚠ THE SEED IS THE RECORD'S OWN AND IT IS ASSERTED PRESENT, not defaulted: a rubber with
          // no seed is a replay button with nothing behind it, which is the failure this case exists
          // to catch, and `?? ''` would have replayed a different match and called it a match.
          expect(m.seed, `rubber ${m.eventId} carries its seed`).toBeTruthy()
          const again = simulateMatch(m.a!, m.b!, { surface: m.surface, tour: JUNIOR_TOUR, seed: m.seed! })
          expect(again.sets.map((s) => `${s.a}-${s.b}`).join(' '), `rubber ${m.eventId}`).toBe(m.score)
          replayed++
        }
      }
    }
    expect(replayed, 'the corpus really holds rubbers to replay').toBeGreaterThan(0)
  })

  it('⭐⭐ the three commands walk it and the year goes on – the tour\'s own trio, dispatched', () => {
    const { world, rng } = atCollege('r27-tie-c')
    pressToTheTie(world, rng)
    const total = callUpRevealMatches(world).length
    // Watch them one at a time, exactly as the flow's «Watch» does.
    for (let i = 0; i < total; i++) revealTournamentRound(world)
    expect(world.college!.callUpReveal!.revealed, 'the cursor reaches the end').toBe(total)
    revealTournamentRound(world)
    expect(world.college!.callUpReveal!.revealed, 'and is idempotent there').toBe(total)
    // ⚠ A YEAR MAY NOT BE SPENT OVER AN UNANSWERED REVEAL, and it is a RETURN rather than a throw –
    // the state is healthy and the app draws it.
    const refused = resumeFromCollege(world, rng)
    expect(refused, 'reported, nothing ticked').toEqual(['call-up'])
    const weekBefore = world.week
    closeTournament(world)
    expect(world.college!.callUpReveal ?? null, 'the finale\'s Continue clears it').toBeNull()
    resumeFromCollege(world, rng)
    expect(world.week, 'and the same press now spends weeks').toBeGreaterThan(weekBefore)
  })

  it('⚠ a year she was NAMED for and never played raises no reveal – and still reports', () => {
    // ⚠⚠ THE ZERO ARM IS A REAL OUTCOME, not an edge case to defend against: research §0.7, the
    // captain alone picks who plays out of a squad of four for three ties. There is no rubber to
    // walk, so pausing the year would stand the player in front of an empty flow – the same tripwire
    // `collegeLeaguePendingView` keeps, enforced at the source. `stops` still carries the week.
    let benched = 0
    for (const world of walked()) {
      for (const year of world.college!.years) {
        if (!year.callUp || year.callUp.rubbersPlayed > 0) continue
        benched++
        expect(callUpRubbersOf(world, year.callUp.week), 'nothing to walk').toHaveLength(0)
      }
      // whatever happened, no career stranded: every walk above graduated or ended.
      expect(world.college!.callUpReveal ?? null, 'no reveal outlives the walk').toBeNull()
    }
    // ⚠ NOT ASSERTED TO BE NON-ZERO. A bench year is a roll and this corpus may hold none; what is
    // asserted is that when one exists it holds no rubbers, and that nothing strands either way.
    expect(benched).toBeGreaterThanOrEqual(0)
  })

  it('⚠ the reveal dies with the year that owned it', () => {
    const { world, rng } = atCollege('r27-tie-d')
    pressToTheTie(world, rng)
    expect(callUpRevealOpen(world)).toBe(true)
    answerAnyCollegeReveal(world)
    walkTheFreeze(world, rng)
    expect(world.college!.callUpReveal ?? null, 'banked years leave no reveal behind').toBeNull()
    for (const year of world.college!.years) {
      if (!year.callUp) continue
      // the record itself survives, which is round 26 #7's ruling: the rows are the feed's, not the
      // reveal's, so a walk the player abandoned still leaves something to replay.
      expect(callUpRubbersOf(world, year.callUp.week).length).toBe(year.callUp.rubbersPlayed)
    }
  })
})

// =================================================================================================
// ⭐⭐⭐ 3. WHAT THE FLOW SAYS ABOUT IT
// =================================================================================================
describe('#6 the flow tells the truth about a week with no table, no rung and no draw', () => {
  it('⭐⭐⭐ the pending view names no table, no tier and no draw – and the sentence is the SQUAD\'s', () => {
    const { world, rng } = atCollege('r27-tie-e')
    pressToTheTie(world, rng)
    const p = toSnapshot(world).pending!
    expect(p, 'the flow mounts on it').toBeDefined()
    expect(p.eventId).toBe(`nations-w${world.week}`)
    expect(p.tier, 'no rung: every payout is reached through TIERS[tier]').toBeNull()
    // ⭐⭐⭐ §4's WIDENING IS WHAT MAKES THIS POSSIBLE. Before it, `LadderTrack` had three members and
    // no fourth answer, so a fixture played in none of the three had to name one – which is exactly
    // how «Professional ranking» came to stand over a College League match.
    expect(p.ladder, 'no table: the tie is played in none of the three').toBeNull()
    expect(p.kidRank).toBeNull()
    expect(p.opponent.rank).toBeNull()
    expect(p.points, 'the ranking chart has no row for this competition – research §0.4/§5.5').toBe(0)
    // ⭐⭐⭐ AND THE SECOND LANDMINE §4's BUILDER LEFT: the amateur splash used to read «a student
    // field awards neither», which is the College League's own words and FALSE of a national squad.
    expect(p.ladderNote, 'the squad\'s own clause, not the student field\'s').toBe(NATIONS_CUP_AWARDS_NOTHING)
    expect(p.ladderNote).not.toContain('student')
    // ⭐⭐⭐ AND THE THIRD, WHICH WAS IN THE SCREEN: `amateur ? COLLEGE_LEAGUE.drawSize : …` would have
    // called three ties an eight-player draw and named its rubbers «Quarterfinal / Semifinal».
    expect(p.drawSize, 'a tie set is not a knockout').toBeNull()
    expect(p.roundLabel, 'the round is named by the record').toMatch(/^Rubber \d+ of \d+$/)
    expect(p.tierLabel).toBe(NATIONAL_TEAM.label)
    expect(p.kidChampion, 'there is nothing here for HER to win – the placing is her country\'s').toBe(false)
    expect(p.finishLabel, 'and the poster states that placing, with the field it was measured in').toMatch(
      new RegExp(`^\\d+(st|nd|rd|th) of ${NATIONAL_TEAM.nationsAtHerLevel} nations$`),
    )
    expect(p.fullBracket, 'the other six ties of the week were never simulated').toEqual([])
    expect(p.coachTravelled).toBe(false)
    expect(p.opponent.nation, 'the shirt is the point of a tie, and it is drawn').not.toBe('')
  })

  it('⭐⭐⭐ `ladderNote` is non-null EXACTLY when `ladder` is null – on every fixture the engine builds', () => {
    // ⚠⚠ THE PAIRING IS THE FIELD'S WHOLE SAFETY. Two fields for one fact is how the first version of
    // the «Professional ranking» bug happened (`PendingView.ladder`'s own ⛔), so they are written in
    // one object literal per fixture and checked here across all three kinds: a tour event, the
    // College League and the tie.
    const seen = new Set<string>()
    // (a) the tie
    {
      const { world, rng } = atCollege('r27-pair-a')
      pressToTheTie(world, rng)
      const p = toSnapshot(world).pending!
      expect(p.ladder === null).toBe(p.ladderNote !== null)
      seen.add('tie')
    }
    // (b) the College League – the same walk, stopped one fixture earlier
    {
      const { world, rng } = atCollege('r27-pair-b')
      for (let press = 0; press < 5 * ENDINGS.collegeYears; press++) {
        resumeFromCollege(world, rng)
        if (world.college!.leagueReveal) break
        answerAnyCollegeReveal(world)
        if (pendingBirthday(world) !== null) chooseGift(world, 'day')
      }
      expect(world.college!.leagueReveal, 'the walk really reached a championship').toBeTruthy()
      const p = toSnapshot(world).pending!
      expect(p.ladder).toBeNull()
      expect(p.ladderNote, 'and the student field keeps its own sentence').toContain('student field')
      expect(p.drawSize, 'which IS a knockout, and says so').toBe(COLLEGE_LEAGUE.drawSize)
      seen.add('league')
    }
    // (c) a tour event – the ordinary case, where the table has a name and nothing stands in for it.
    // ⚠ IT HAS TO ENTER THINGS. A no-action career never reaches a draw, so this walks the same
    // enter-everything policy the academy and econ suites use; without it the arm would be vacuous.
    {
      const world = createWorld('r27-pair-c', { ...DEFAULT_PROFILE })
      const rng = resumeMain(world.rngMain)
      let found = false
      for (let i = 0; i < 120 && !found; i++) {
        for (const e of world.season) {
          if (e.week > world.week && !world.entries.includes(e.id)) {
            try {
              enterEvent(world, e.id)
            } catch {
              /* gated on points/funds/availability – the policy just moves on */
            }
          }
        }
        tickWeek(world, rng)
        const p = toSnapshot(world).pending
        if (p) {
          expect(p.ladder, 'a tour fixture is played on a real table').not.toBeNull()
          expect(p.ladderNote, 'so nothing stands in its place').toBeNull()
          expect(p.drawSize, 'and it has a draw').toBeGreaterThan(0)
          found = true
        }
        finishAnyReveal(world)
      }
      expect(found, 'the walk really reached a tour reveal').toBe(true)
      seen.add('tour')
    }
    expect([...seen].sort(), 'all three kinds were exercised').toEqual(['league', 'tie', 'tour'])
  })
})

// =================================================================================================
// ⭐⭐⭐ 4. THE TOAST IS GONE, AND `friendly` IS NOT
// =================================================================================================
describe('#6 the popup is deleted, and the flag it must not take with it', () => {
  it('⭐⭐⭐ `STOP_REASON_TEXT` has no copy for the call-up, so R10-16 gives it no toast', () => {
    const app = componentFile('App.vue')
    const map = region(app, 'const STOP_REASON_TEXT', 'const stopReasons')
    // ⚠ ASKED OF THE COPY TABLE AND NOT OF THE FILE, deliberately. The deleted sentence is QUOTED in
    // the note that records its deletion – this repo keeps owner rulings verbatim – so a whole-file
    // ban would forbid the record along with the copy. What must not exist is the KEY: R10-16's rule
    // is «no copy, no toast», and `stopReasonText` walks this map alone.
    expect(map, 'the table has no key for the call-up, which is what silences the toast').not.toMatch(
      /^\s*'call-up':/m,
    )
    // ⚠ AND THE COPY ALONE, WITH THE COMMENTS STRIPPED. The note that records the deletion quotes the
    // sentence – that is the record, and it is inside this region – so the ban has to be asked of the
    // lines the toast can actually print rather than of the region's text.
    const copyOnly = map
      .split('\n')
      .filter((l) => !l.trimStart().startsWith('//'))
      .join('\n')
    expect(copyOnly, 'no key in this table prints the postfactum sentence').not.toContain(
      'Her country called this year',
    )
    // ⚠ THE REASON IS NOT DELETED, WHICH IS THE OTHER HALF. R10-16's rule is «no copy, no toast», so
    // removing the copy is the whole of the fix – the stop stays true, stays in the precedence list
    // and stays readable to everything that is not this table.
    expect(STOP_PRECEDENCE, 'the week still reports itself').toContain('call-up')
  })

  it('⭐⭐⭐ every rubber is still `friendly: true` – the flag four subsystems read', () => {
    // ⚠⚠ `friendly` IS LOAD-BEARING AND THE FLOW DID NOT COST IT. It is the one predicate the radar
    // (R11-2), the avatar's emotion, the knock history and the Weekly Story read to decide whether a
    // match is EVIDENCE about her form – and a week that pays nothing and takes nothing must not
    // silently become evidence in four subsystems at once. The tie reaches `TournamentFlow` through
    // `snapshot.pending`, which selects on a college reveal being OPEN and never on `!friendly`, so
    // nothing here had to be cleared to make the screen work.
    let rows = 0
    for (const world of walked()) {
      for (const year of world.college!.years) {
        if (!year.callUp) continue
        const events = world.events.filter(
          (e) => e.match !== undefined && e.match.eventId.startsWith(`nations-w${year.callUp!.week}-r`),
        )
        expect(events.length, 'the rows are in the feed').toBe(year.callUp.rubbersPlayed)
        for (const e of events) {
          expect(e.friendly, `rubber ${e.match!.eventId} must not become evidence about her form`).toBe(true)
          expect(e.keep, 'and it survives the prune, so it is still openable four years later').toBe(true)
        }
        rows += events.length
      }
    }
    expect(rows, 'the corpus really holds rubbers').toBeGreaterThan(0)
  })

  it('⚠ the tie still awards nothing at all – no result row, no cheque, no trophy', () => {
    for (const world of walked()) {
      for (const year of world.college!.years) {
        if (!year.callUp) continue
        expect(
          world.results.filter((r) => r.week === year.callUp!.week && r.playerId === KID_ID),
          'a result row for HER would break «a result cannot award one without the other»',
        ).toHaveLength(0)
      }
      expect(world.pendingTournament, 'and `pendingTournament` is never written inside the freeze').toBeNull()
    }
  })
})
