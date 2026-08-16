// THE ONE WEEK OF THE YEAR THAT IS NOT HERS – the national-team call-up, as a leaf.
//
// A LEAF, like `ending.ts`: it knows nothing about a `WorldState`, imports no calendar constant and
// draws on an `Rng` handed to it. `world/college.ts` is the seam that builds the view and banks what
// this returns. Sourced end to end from `docs/research/national-team-competitions.md`; every number
// below that the research does not give is marked as ours.
//
// ⚠⚠ WHY THE SENIOR COMPETITION AND NOT THE JUNIOR ONE THE RESEARCH RECOMMENDS. §11.3's proposal is
// to build the 14-and-under world team championship "or its 16U twin", and that is right for the
// question it was answering. It is the wrong answer for THIS one, and the reason is an age fact
// rather than a judgement:
//
//     | competition                      | real age band          | our college years |
//     | World Junior Tennis (14U)        | 11-14  (research §2.1) | 19 -> 23          |
//     | BJK Cup Juniors (16U)            | 13-16  (research §3.1) | 19 -> 23          |
//     | the senior competition           | 14 and over (§5.7)     | 19 -> 23   <-     |
//
// The fork is at nineteen (`ENDINGS.forkAgeYears`). Both junior bands closed years before it. The
// plan asked for the CALENDAR OF THE COLLEGE YEARS, so the only national-team competition that can
// be it is the senior one – which the research puts last, and for a reason that does not bite here:
// its objection (§11.3) is to "four levels, promotion and relegation, a Nations Ranking, three
// different tie formats", i.e. to the LADDER-SHAPED version. **None of that is here.** What is here
// is §11.3's own recommended shape – "the letter", one week, arriving rather than chosen – aimed at
// the age band college actually occupies.
//
// ⚠ AND IT PAYS NOTHING. Not "not modelled yet": nothing, by the rulebook, in both currencies.
//   * NO RANKING POINTS. Research §0.4 / §5.5: the 2026 WTA Ranking Point Chart has no row for it,
//     and the competition's own regulations carry no player ranking-points provision at all.
//   * NO PRIZE MONEY THAT REACHES HER. Research §5.6: player prize money exists "For the Finals
//     only"; below that a player's compensation is entirely at her federation's discretion, which
//     in this game is nothing. The whole family of competitions pays no prize money anywhere at
//     junior level either (§0.2), which is exactly why it is the tennis an amateur may play.
//   So `finalizeTournament`'s "a result cannot award one without the other" invariant is not being
//   bent here: this is NOT a tournament, it awards neither, and it never touches `world.results`.
//
// ⚠ A TIE IS TWO SINGLES AND A DOUBLES AND WE MODEL THE SINGLES ONLY – a deviation written down
//   rather than discovered (research §11.2e: "this engine has no doubles at all"). Her week is
//   counted in SINGLES RUBBERS, and the copy never says the word doubles.
//
// ⚠ NAMES ARE FICTIONAL (CLAUDE.md Style): the real competitions are trademarks, so this one is
//   named for its category the way every rung on the ladder is – "Local Open", "World Tour 75",
//   "Grand Slam". No nation of ours is ever named either; her country is `profile.country`.
import type { Rng } from './rng'

/** ⚠ EVERY NUMBER THE RESEARCH GIVES IS MARKED `[R]` AND CARRIES ITS SECTION. Everything else is
 *  OURS and says so – the failure `acceptance-cuts-2026-08.md` §0 was written about is a number
 *  entered without a citation and then quoted back as evidence. */
export const NATIONAL_TEAM = {
  /** the competition's name in this game. FICTIONAL – see the file note. */
  label: 'the Nations Cup',

  /** `[R]` §5.7, Reg 13.1.1: minimum age fourteen, reached by the first day of the tie. It is here
   *  because it is the fact that decided which competition this file is about, and a later wave that
   *  wires the junior bands will need it to sit beside theirs. */
  minAgeYears: 14,

  /** `[R]` §5.4: the qualifying round is played in April. Our season is 52 weeks from week 0, so
   *  offset 14 is early April – the week a nation that must qualify plays, which is the week a
   *  college player's nation is most likely to be at. One week, never two: §5.4's own ceiling is
   *  "two weeks, and it is the same two weeks for a weak nation as a strong one", and the second is
   *  the Finals, which a nation at her level does not reach. */
  seasonWeek: 14,

  /** `[R]` §5.3, Reg 37.3: three to five players plus a captain. Ours is the middle of that. */
  squadSize: 4,

  /** `[R]` §5.4, Reg 23.4.1: a Regional Group nation plays ONE event a year and that event runs up
   *  to seven days – several ties in the week, not one. Three is our reading of "up to seven days"
   *  at two days a tie; the research does not fix the number. OURS. */
  tiesInTheWeek: 3,

  /** ⚠ OURS, AND IT IS THE ONE NUMBER IN THIS FILE WITH NO SOURCE BEHIND IT AT ALL. The research
   *  establishes that a National Association nominates three to five players in an order of merit
   *  driven by WTA singles ranking (§5.3, Reg 37.2.1) – so a player whose ranking has expired at
   *  college sits LOW in that order, and the honest model is "sometimes". There is no published
   *  rate for "what share of eligible players are nominated in a given year" and inventing a
   *  precise-looking one would be the §0 failure. This is a design choice: the letter should be a
   *  real event when it comes and the years it does not come should outnumber it, so that it is
   *  never routine. */
  callChance: 0.4,

  /** ⚠ OURS. Her rubbers are counted, not played: this file does NOT run the match engine. A week
   *  that is one line in the record does not get a bracket, and the two constants below are what
   *  stands in for one. `standard` is the skill mean at which she is an even bet in a rubber and
   *  `slope` is what a point of skill either side of it is worth. Calibrated in
   *  `docs/specs/college-as-a-second-act-2026-08.md` §4 against the measured skill mean at the fork,
   *  so a nineteen-year-old at the median comes out near even. */
  rubber: { standard: 62, slope: 0.02, floor: 0.08, ceiling: 0.92 },

  /** `[R]` §5.1: the level she is at holds fourteen nations in seven ties. Her nation finishes
   *  somewhere in it, and – this is the whole point of the week – WHERE IS NOT ABOUT HER. */
  nationsAtHerLevel: 14,
} as const

/** WHAT THE CALL-UP RULE READS, and it is the whole of what it reads. Deliberately three numbers:
 *  the leaf may not reach for a world, a calendar or a rung. */
export interface CallUpView {
  /** her age in whole years on the week the tie is played */
  ageYears: number
  /** her skill mean, 0-100 – the only thing about her that decides a rubber */
  skillMean: number
}

/** ONE WEEK OF NATIONAL-TEAM TENNIS, or `null` in a year nobody wrote to her.
 *
 *  ⚠ FOUR DRAWS, ALWAYS, IN THE SAME ORDER, WHETHER OR NOT THE LETTER COMES. The first decides the
 *  letter and the other three are taken regardless and discarded when it does not – the same
 *  post-draw discipline the sponsor gift keeps (`world.ts`: *"the roll and the gift draw BOTH still
 *  happen, and only the payout is discarded"*). It costs four pulls of a per-week sub-stream and it
 *  buys the property that this function's draw count cannot depend on its own outcome.
 *
 *  ⚠ AND THE RNG MUST BE A PURPOSE-SCOPED SUB-STREAM, NEVER MAIN (CLAUDE.md invariant 2). The one
 *  caller derives `seed:callup:<week>` at the call site. */
export function rollCallUp(view: CallUpView, rng: Rng): CallUp | null {
  const called = rng() < NATIONAL_TEAM.callChance
  // ⚠ SHE MAY BE NAMED AND NEVER TAKE THE COURT, and that is the regulation rather than a shortcut.
  // Research §0.7: the captain alone picks who plays out of the nomination, and §5.7 records that
  // representation "is deemed to occur ON NOMINATION, not on playing". A squad of four for three
  // ties means one of them sits, so the share of the week she is on court for is a real draw.
  const played = Math.min(
    NATIONAL_TEAM.tiesInTheWeek,
    Math.round(rng() * NATIONAL_TEAM.tiesInTheWeek),
  )
  const p = rubberWinChance(view.skillMean)
  // One draw for the whole rubber set rather than one per rubber, so the draw count is fixed.
  const roll = rng()
  let won = 0
  for (let i = 0; i < played; i++) if (roll < p ** (i === 0 ? 1 : 1 / (i + 1))) won++
  // ⚠ AND HER NATION'S FINISH IS DRAWN FLAT AND IS NOT ABOUT HER. This is the property the research
  // calls the reason to build the thing at all (§11.1.2): "Nothing else we model pays her on
  // somebody else's result." Here the payment is zero either way, which is the sharper version of
  // the same point – she can win every rubber she is given and go home with a placing she had no
  // say in. Nothing in this expression reads `view`.
  const nationFinish = 1 + Math.floor(rng() * NATIONAL_TEAM.nationsAtHerLevel)
  if (!called) return null
  if (view.ageYears < NATIONAL_TEAM.minAgeYears) return null
  return { rubbersPlayed: played, rubbersWon: won, nationFinish }
}

/** What one rubber is worth to her, as a probability. Ours – see `NATIONAL_TEAM.rubber`. */
export function rubberWinChance(skillMean: number): number {
  const { standard, slope, floor, ceiling } = NATIONAL_TEAM.rubber
  const raw = 0.5 + (skillMean - standard) * slope
  return Math.max(floor, Math.min(ceiling, raw))
}

/** The week, as it happened. Persisted inside `CollegeYear` – see `shared/protocol.ts`. */
export interface CallUp {
  rubbersPlayed: number
  rubbersWon: number
  /** 1..`nationsAtHerLevel`; 1 is the level won */
  nationFinish: number
}

/** THE LINE THE RECORD KEEPS, and it says the two things that make the week what it is: she did not
 *  choose it, and it paid her nothing.
 *
 *  ⚠ IT NEVER GRADES HER (the album's own rule, `career-contract-v1.md` §6). It states the rubbers
 *  and the placing and stops – no adjective, no "unlucky", no "deserved better". The gap between
 *  "she won two of three" and "her nation finished eleventh" is the whole content and it is left for
 *  the reader to notice. */
export function callUpLine(call: CallUp, label: string = NATIONAL_TEAM.label): string {
  const bench =
    call.rubbersPlayed === 0
      ? 'She was named in the squad and never took the court'
      : `She played ${call.rubbersPlayed} ${call.rubbersPlayed === 1 ? 'rubber' : 'rubbers'} and won ${call.rubbersWon}`
  return `${label}: her country called and there was no declining it. ${bench}; the nation finished ${ordinal(call.nationFinish)} of ${NATIONAL_TEAM.nationsAtHerLevel}. No prize money and no ranking points – there are none to award.`
}

function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}
