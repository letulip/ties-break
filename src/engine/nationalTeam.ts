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
//
// ⭐⭐ AND SINCE THE COLLEGE WAVE THE RUBBERS ARE PLAYED RATHER THAN COUNTED. The owner's brief
// (19.08): «в каждом году минимум одни соревнования, которые можно смотреть так же, как и наши
// текущие, т.е. тот же самый механизм в точности, кроме названий турниров». The fixture below is
// unchanged – the letter, how many ties she is on court for, where her nation finishes – and what
// changed is that the RESULT of each rubber now comes out of `simulateMatch`, off a stored seed,
// through the same record shape a tournament match and a practice friendly already use. So the
// week is watchable in the app's own viewer instead of arriving as one summary line.
//
// ⚠ `binomial` AND `rubberWinChance` ARE THE CALIBRATION TARGET NOW, NOT DEAD CODE. Two different
// things keep them here and they are worth separating. THE DRAW stays inside `rollCallUp` because
// removing it would re-map every later draw on `seed:callup:<week>` – `nationFinish` is taken after
// it – and because the count may not depend on the outcome. THE CURVE stays because it is what the
// played result is measured against: `tests/college-second-act.test.ts` carries the two side by side
// over the whole skill band, so a match engine that quietly stopped agreeing with the calibration is
// caught rather than assumed. The seam (`world/college.ts`) overwrites `rubbersWon` with what
// actually happened on court.
import type { MatchPlayer } from './match/types'
import { FIRST_NAMES, NATION_POOL, SURNAMES } from './season/names'
import { pickInt, type Rng } from './rng'

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

  /** ⚠ OURS. `standard` is the skill mean at which she is an even bet in a rubber and `slope` is
   *  what a point of skill either side of it is worth. Calibrated in
   *  `docs/specs/college-as-a-second-act-2026-08.md` §4 against the measured skill mean at the fork,
   *  so a nineteen-year-old at the median comes out near even.
   *
   *  ⚠⚠ AND `standard` IS NOW A PLAYER RATHER THAN A THRESHOLD, which is the whole of the college
   *  wave's change to this file. It used to be the midpoint of a probability curve that decided the
   *  rubbers without playing them; it is now the SKILL MEAN OF THE WOMAN ACROSS THE NET
   *  (`callUpOpponent` below), and the rubber is decided by `simulateMatch` between the two of them.
   *  The constant means the same thing either way – "the level at which this is an even match" – so
   *  nothing was re-tuned to make the change; what moved is who resolves it. */
  rubber: { standard: 62, slope: 0.02, floor: 0.08, ceiling: 0.92 },

  /** ⚠ OURS. How far either side of `rubber.standard` one of her opponent's five attributes may
   *  land. A national side is not five identical women, and a fixture where every rubber is the
   *  same mirror match would read as one match played three times. The band is symmetric, so the
   *  EXPECTED opponent is exactly `standard` and the calibration above is untouched in the mean. */
  opponentSpread: 10,

  /** ⚠ OURS. The age band a senior national side draws from. It exists because `MatchPlayer.age`
   *  is the age half of the serve-speed curve (`match/serveSpeed.ts`), so an opponent with no age
   *  would serve at the type's fallback rather than like a grown woman. The floor is the
   *  competition's own `minAgeYears` + 4 – she is meeting selected seniors, not the youngest
   *  eligible girl in the country. */
  opponentAgeBand: [18, 28] as const,

  /** ⚠ OURS, AND IT IS A CHOICE RATHER THAN A DRAW. Real ties are played on whatever the hosting
   *  nation has; ours are on hard, because a surface drawn per week would be a fourth invented
   *  number and the ONE thing it would change is a decorative mark on the viewer. */
  surface: 'hard' as const,

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
  // ⚠ ONE DRAW FOR THE WHOLE RUBBER SET, AND IT IS AN INVERSE CDF RATHER THAN A LOOP OF COMPARISONS.
  // The draw count has to be fixed (see above), so the number of rubbers she wins is drawn as a
  // BINOMIAL(played, p) through its own cumulative distribution – which is exact: every rubber has
  // marginal probability `p` and the count is monotone in the uniform, so a better player is never
  // worse off. The obvious shortcut – reusing one uniform against `played` different thresholds –
  // is NOT this, and it is wrong in a way that flatters her: the thresholds have to grow to stay
  // monotone, so the second and third rubbers end up easier than the first.
  //
  // ⚠⚠ AND SINCE THE COLLEGE WAVE THIS IS THE MODEL, NOT THE RESULT. `world/college.ts` plays the
  // rubbers through `simulateMatch` and overwrites this count with what happened on court. The draw
  // STAYS – deleting it would re-map `nationFinish`, which is taken off this same stream one line
  // down, and the count may not depend on the outcome. Same shape as the sponsor gift's discarded
  // payout: the roll happens, only the value is thrown away.
  const won = binomial(played, rubberWinChance(view.skillMean), rng())
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

/** ⭐⭐ THE WOMAN ACROSS THE NET, composed – one opponent for one rubber.
 *
 *  ⚠⚠ SHE IS DRAWN AROUND `rubber.standard` AND THAT IS THE WHOLE OF THE MODEL. The old code took
 *  one uniform against `rubberWinChance(herSkillMean)`; this builds an opponent whose EXPECTED skill
 *  mean is the same `standard` that probability curve was centred on, and hands both players to
 *  `simulateMatch`. Nothing was re-tuned to make that swap – the constant already meant "the level at
 *  which she is an even bet", and it now means it as a person instead of as a midpoint.
 *
 *  ⚠ THE CURVE IS STEEPER THAN THE ONE IT REPLACES, MEASURED RATHER THAN GUESSED, and it costs
 *  nothing: a rubber pays no ranking points and no prize money, takes no condition and feeds no
 *  development, so what moved is the LINE IN THE RECORD and not a balance. The figures are in
 *  `tests/college-second-act.test.ts` ("the played rubber tracks the model it replaced").
 *
 *  ⚠ NINE DRAWS, ALWAYS, IN THIS ORDER. The caller composes one of these per tie in the week –
 *  `tiesInTheWeek` of them, whether or not she is on court for all of them – so who her nation drew
 *  is a fact about the week rather than about how many rubbers she was given. That is the same
 *  post-draw discipline `rollCallUp` keeps for its own four.
 *
 *  ⚠ A LEAF, STILL. This composes numbers and a name off the world's own naming vocabulary
 *  (`season/names.ts`, which imports nothing but the RNG); it knows no `WorldState`, no calendar and
 *  no tier. `world/college.ts` is what puts her on court. */
export function callUpOpponent(id: string, rng: Rng): CallUpOpponent {
  const first = FIRST_NAMES[pickInt(rng, 0, FIRST_NAMES.length - 1)]
  const last = SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
  const nation = NATION_POOL[pickInt(rng, 0, NATION_POOL.length - 1)]
  const attr = (): number =>
    pickInt(rng, NATIONAL_TEAM.rubber.standard - NATIONAL_TEAM.opponentSpread, NATIONAL_TEAM.rubber.standard + NATIONAL_TEAM.opponentSpread)
  const serve = attr()
  const ret = attr()
  const composure = attr()
  const stamina = attr()
  // ⚠ THE FIFTH ATTRIBUTE IS DRAWN AND NOT DERIVED, which is the one place this deviates from a
  // cohort rival. `rivalGroundstrokes` folds the other four and adds a per-id personality offset off
  // its own `gs:<id>` sub-stream – correct for a player who is PERSISTED and has to answer the same
  // way every week she is looked up. These women are composed once, for one rubber, from a stream
  // that is re-derived at the call site, so the personality is already in the four draws above and a
  // second sub-stream to hold it would be a stream with nothing to remember.
  const groundstrokes = attr()
  const [ageLo, ageHi] = NATIONAL_TEAM.opponentAgeBand
  return {
    nation,
    player: {
      id,
      name: `${first} ${last}`,
      serve,
      ret,
      composure,
      stamina,
      groundstrokes,
      age: pickInt(rng, ageLo, ageHi),
    },
  }
}

/** One rubber's opponent: the player the match engine takes, and the country on her shirt.
 *
 *  ⚠ THE NATION RIDES BESIDE HER RATHER THAN ON HER, because `MatchPlayer` has no such field and
 *  giving it one would touch every match in the game to decorate three a year. */
export interface CallUpOpponent {
  player: MatchPlayer
  /** ISO-2, out of the same `NATION_POOL` the cohort and the professional field are drawn from */
  nation: string
}

/** How many of `n` rubbers she wins at probability `p`, drawn from one uniform `u` in [0,1).
 *
 *  The binomial's inverse CDF, walked term by term. `n` is at most `tiesInTheWeek`, so the factorials
 *  are three at the outside and there is nothing to optimise. Returns `n` if the accumulated mass
 *  falls a floating-point hair short of 1. */
export function binomial(n: number, p: number, u: number): number {
  let cumulative = 0
  for (let k = 0; k < n; k++) {
    cumulative += choose(n, k) * p ** k * (1 - p) ** (n - k)
    if (u < cumulative) return k
  }
  return n
}

function choose(n: number, k: number): number {
  let out = 1
  for (let i = 0; i < k; i++) out = (out * (n - i)) / (i + 1)
  return out
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
  /** ⚠ WHAT SHE ACTUALLY WON ON COURT since the college wave. `rollCallUp` fills this from the
   *  binomial model and `resolveCallUp` overwrites it with the count of rubbers `simulateMatch`
   *  gave her. The field's shape and meaning are unchanged, which is why this needed no schema
   *  bump: a career saved before the rubbers were played reads exactly the same. */
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
