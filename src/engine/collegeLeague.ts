// ⭐⭐⭐ THE ONE COMPETITION A COLLEGE YEAR IS GUARANTEED – the student championship, as a leaf.
//
// THE OWNER'S BRIEF, 21.08: «я бы хотел, чтобы как минимум 1 турнир в год колледжа был. А вызов в
// сборную мы можем и подкрутить для этого… Или еще что-то добавить отдельное, какой-то студенческий
// турнир, например. Тогда вызов в сборную можно будет опереть на результаты студенческого и тогда у
// нас будет минимум 1, максимум 2 турнира на учебный год – по-моему хорошо выглядит»
//
// ⚠⚠ WHAT WAS MEASURED, AND IT IS WHY THIS FILE EXISTS. Over 12 careers × 4 years = 48 college
// years, a college year held THREE marked weeks in fifty-two: two squad trips
// (`COLLEGE_TRIP_WEEKS`) that write no rows and cannot be watched, and one national call-up that was
// a bare 40% roll – it landed in 19 of 48 years and she took the court in 17. **0.71 watchable
// matches per college year.** Two thirds of college years held one openable row and it was empty.
//
// TWO THINGS CHANGE AND THE SECOND IS THE FEATURE:
//   1. THIS FIXTURE IS NOT A ROLL. It is on the calendar, once per academic year, for every career
//      and at every tier – `COLLEGE_LEAGUE.seasonWeek` occurs exactly once in any fifty-two
//      consecutive weeks, so the floor is arithmetic rather than probability.
//   2. THE CALL-UP LEANS ON ITS RESULT. `NATIONAL_TEAM.callChanceByLeague` replaces the bare roll
//      with a ladder read off how far she went here, so a college year finally has stakes: the
//      selectors are watching the one tournament she is allowed to play.
//
// ⚠ A LEAF, exactly like `nationalTeam.ts`: it knows no `WorldState`, no calendar week of its own
// and no tier, and it draws on an `Rng` handed to it. `world/college.ts` is the seam that puts her
// on court, and it is the ONLY file that knows both this and the national side.
//
// ⚠⚠ AND IT AWARDS NOTHING, WHICH IS THE CONSTRAINT THAT SHAPED IT RATHER THAN A DETAIL. She is an
// amateur while she is there – that is what makes sponsors, the academy and the gear shop all shut
// inside the freeze (W2-ENDINGS, «nobody writes to an amateur») – so a student fixture that paid
// WTA/ITF ranking points would quietly turn four years of college into a ranking route and the fork
// would stop being a real choice. No points, no prize money, `world.results` untouched, and the rows
// carry `friendly: true` for the same reason a rubber does.
//
// ⚠ NAMES ARE FICTIONAL (CLAUDE.md Style). The real student championships are trademarks, so this
// one is named for its category the way every rung on the ladder is – "Local Open", "World Tour 75",
// "the Nations Cup".
import { stageLabel } from './world/labels'
import { FIRST_NAMES, SURNAMES } from './season/names'
import { pickInt, type Rng } from './rng'
import type { MatchPlayer } from './match/types'

/** ⚠ EVERY NUMBER HERE IS OURS AND SAYS SO. There is no research file behind a student championship
 *  the way `docs/research/national-team-competitions.md` sits behind the Nations Cup, so nothing
 *  below is marked `[R]` – and the honest form of that is to state the reasoning for each one rather
 *  than to enter a precise-looking figure with nothing under it (`acceptance-cuts-2026-08.md` §0). */
export const COLLEGE_LEAGUE = {
  /** the competition's name in this game. FICTIONAL – see the file note. ⚠ IT MATCHES THE ART
   *  OCCASION KEY (`RunglessOccasion` = 'college-league', `src/art/venues.ts`), which is the owner's
   *  own round-24 #4 decision: «Картинки для студенческих турниров… как раз для студенческих лиг». */
  label: 'the College League',

  /** ⚠⚠ TWO WEEKS BEFORE THE NATIONS CUP, AND THE GAP IS THE WHOLE MECHANISM RATHER THAN A LAYOUT.
   *  `NATIONAL_TEAM.seasonWeek` is 14 (early April, the qualifying round) and the selectors have to
   *  have something to read when they pick. A championship played AFTER the call-up could not be
   *  leaned on, so the owner's «вызов в сборную можно будет опереть на результаты студенческого»
   *  would be a sentence with nothing behind it.
   *
   *  ⚠ AND IT IS ITS OWN WEEK RATHER THAN ONE OF `COLLEGE_TRIP_WEEKS` (8, 20). Two reasons, and the
   *  first is causality: a trip week at 20 is after the call-up, and taking the one at 8 would put
   *  the championship a month before the season it is supposed to crown. The second is that the
   *  trips are the DUAL-MATCH SEASON – a count that feeds `growWeek`'s `matchesThisWeek` and writes
   *  no rows – so folding the championship into one would make a single week mean two different
   *  things AND delete development the tier was paid for, which is a balance change CLAUDE.md
   *  invariant 4 owns. The year now holds four marked weeks and TWO tournaments, which is exactly
   *  the owner's ceiling: «минимум 1, максимум 2 турнира на учебный год». */
  seasonWeek: 12,

  /** ⚠ OURS. Eight, so she plays at most three matches and at least one. A draw of 16 would put up
   *  to four watchable matches inside a single week of a freeze the owner designed as the SHORTCUT
   *  («перелистывание 1 года за клик»); a draw of 4 makes the championship two matches, which is
   *  thin for the one tournament of the year. Eight is also what `stageLabel` reads as
   *  Quarterfinal / Semifinal / Final with no draw-size special case. */
  drawSize: 8,

  /** ⚠ OURS, AND IT IS DELIBERATELY BELOW THE SENIOR INTERNATIONAL ONE. `NATIONAL_TEAM.rubber.standard`
   *  is 62 – the level at which a nineteen-year-old at the median is an even bet against a SELECTED
   *  SENIOR. The women at a student championship are the other girls on the other scholarships, so
   *  the field is drawn six points under that, and `spread` is wider than the national side's 10
   *  because a college field is not selected at all.
   *
   *  ⚠⚠ THE FIELD DOES NOT SCALE WITH HER TIER, AND THAT IS A RULING RATHER THAN AN OMISSION. Making
   *  a dearer programme play a stronger championship field would mean paying more for a WORSE chance
   *  of the letter, which is the perverse arm of the same knob. The tier already reaches this
   *  fixture the honest way round: it buys `collegeCoachFactor` and `matchesPerWeek`, those raise her
   *  skill, and her skill is what wins matches here. Tier -> development -> result -> the letter,
   *  with no second knob anywhere on the path. */
  field: { standard: 56, spread: 12 },

  /** ⚠ OURS. The age band a student field draws from – she is meeting undergraduates, not the
   *  18-28 seniors of `NATIONAL_TEAM.opponentAgeBand`. It exists for the same mechanical reason that
   *  one does: `MatchPlayer.age` is the age half of the serve-speed curve (`match/serveSpeed.ts`). */
  opponentAgeBand: [18, 23] as const,

  /** ⚠ OURS, AND A CHOICE RATHER THAN A DRAW, on `NATIONAL_TEAM.surface`'s own argument: a surface
   *  drawn per year would be one more invented number and the only thing it changes is a decorative
   *  mark on the viewer. */
  surface: 'hard' as const,
} as const

/** How many rounds a run through this draw has – 3 for a draw of 8. ⚠ DERIVED, NEVER A SECOND
 *  CONSTANT: two numbers for one fact is how a draw size and a round count come to disagree. */
export const COLLEGE_LEAGUE_ROUNDS = Math.log2(COLLEGE_LEAGUE.drawSize)

/** ONE CHAMPIONSHIP, AS IT HAPPENED. ⚠ NO WEEK ON IT, WHICH IS THE SAME SPLIT `CallUp` KEEPS
 *  AGAINST `CollegeCallUp`: the leaf returns the RESULT and the seam files it under a week. The
 *  persisted shape is `CollegeLeagueRun` in `shared/protocol.ts` and is this plus the week, so every
 *  reader below takes one and is happy with either. */
export interface CollegeLeagueResult {
  /** 0..`rounds` – how many matches she won before she went out. `rounds` means she won it. */
  roundsWon: number
  /** the draw's round count, stored beside the result so a re-tuned `drawSize` cannot re-read an
   *  old career's run as something it was not */
  rounds: number
}

/** Did she win it? Derived and never stored – `roundsWon === rounds` is the whole of the question,
 *  and a persisted `champion` flag would be a second copy of a fact that can drift from the first. */
export function wonTheLeague(run: CollegeLeagueResult): boolean {
  return run.roundsWon >= run.rounds
}

/** How many matches a run of `roundsWon` actually contained. ⚠ THE CHAMPION PLAYS NO EXTRA MATCH:
 *  winning the final is the third win, not a fourth fixture, and `roundsWon + 1` would have printed
 *  four matches in a draw of eight. */
export function leagueMatchesPlayed(run: CollegeLeagueResult): number {
  return Math.min(run.roundsWon + 1, run.rounds)
}

/** ⭐ WHERE SHE WENT OUT, in the draw sheet's own words – `stageLabel`, the engine's own namer, so a
 *  second idea of what a round is called cannot get in (the rule `occasionOf` is written under). */
export function leagueExitLabel(run: CollegeLeagueResult): string {
  return stageLabel(Math.min(run.roundsWon, run.rounds - 1), COLLEGE_LEAGUE.drawSize)
}

/** ⭐⭐ THE WOMAN ACROSS THE NET AT A STUDENT CHAMPIONSHIP – one opponent for one round.
 *
 *  ⚠ EIGHT DRAWS, ALWAYS, IN THIS ORDER, and the caller composes one per ROUND OF THE DRAW whether
 *  or not she reaches it – the same post-draw discipline `callUpOpponent`'s caller keeps, so who was
 *  waiting in the semifinal is a fact about the draw rather than about how far she got.
 *
 *  ⚠ NO NATION, unlike a Nations Cup rubber, and the difference is the fixture rather than an
 *  economy: a tie is her country against another country and the shirt is the point of it; a college
 *  championship is a draw of students, and hanging a flag on each of them would say something about
 *  this competition that is not true of it. */
export function collegeLeagueOpponent(id: string, rng: Rng): MatchPlayer {
  const first = FIRST_NAMES[pickInt(rng, 0, FIRST_NAMES.length - 1)]
  const last = SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
  const { standard, spread } = COLLEGE_LEAGUE.field
  const attr = (): number => pickInt(rng, standard - spread, standard + spread)
  const serve = attr()
  const ret = attr()
  const composure = attr()
  const stamina = attr()
  // ⚠ THE FIFTH ATTRIBUTE IS DRAWN AND NOT DERIVED, for `callUpOpponent`'s own stated reason: these
  // women are composed once, for one match, off a stream re-derived at the call site, so the
  // personality is already in the four draws above and a `gs:<id>` sub-stream would be a stream with
  // nothing to remember.
  const groundstrokes = attr()
  const [ageLo, ageHi] = COLLEGE_LEAGUE.opponentAgeBand
  return {
    id,
    name: `${first} ${last}`,
    serve,
    ret,
    composure,
    stamina,
    groundstrokes,
    age: pickInt(rng, ageLo, ageHi),
  }
}

/** THE LINE THE RECORD KEEPS. It says how far she went and what it paid, and it stops.
 *
 *  ⚠ IT NEVER GRADES HER (`career-contract-v1.md` §6, the same rule `callUpLine` keeps). No "only",
 *  no "unlucky", no "at least" – a first-round exit and a title are stated in the same voice and the
 *  reader decides what either was worth. */
export function collegeLeagueLine(run: CollegeLeagueResult, label: string = COLLEGE_LEAGUE.label): string {
  const played = leagueMatchesPlayed(run)
  const matches = `${played} ${played === 1 ? 'match' : 'matches'}, ${run.roundsWon} ${run.roundsWon === 1 ? 'win' : 'wins'}`
  const run_ = wonTheLeague(run) ? 'she won it' : `she went out in the ${leagueExitLabel(run)}`
  return `${label}: ${run_} – ${matches}. No prize money and no ranking points – a student field awards neither.`
}
