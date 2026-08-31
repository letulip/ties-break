// ⭐ R2-10 STEP 2, PHASE 4 – BOTH SIDES OF THE LADDER MOVE, AND SHE HAS A LIFE.
//
// THE FOURTH NAMED PHASE OF THE WEEKLY TICK: the cohort's weekly drift and her own development on
// adjacent lines – deliberately, because the whole point is that the ladder moves under her as fast
// as she climbs it – then the thing that ARRIVES this week (a knock off the training court, or,
// inside the college freeze, the student championship and the call-up that reads it), then the
// three dates on the family's calendar: her birthday, the September she does not go back to school,
// and the one time the game says the coach can travel too.
//
// ⚠ A MOVE AND NOT A REWRITE: `tickWeek`'s steps 3 to 3f in their original order, comment for
// comment, step numbers unrenumbered. No private helper came with them – every callee below was
// already a leaf, which is what made this the cleanest of the five cuts.
//
// ⚠ THE MAIN STREAM: `driftCohort` SPENDS EXACTLY 4 DRAWS PER COHORT PLAYER, and it is the SECOND
// and last MAIN consumer of a tick (the first is `resolveBaseCosts`, in world/phaseFinance.ts).
// Its position – after her competition, before the canonical AI brackets – is unchanged, and it is
// the only line in this phase that touches MAIN at all: `growWeek` reads `seed:growth:<week>`,
// `rollKnock` reads `seed:knock:<week>`, the championship reads `seed:collegeleague:<week>` plus
// one `seed:collegematch:<week>:<r>` a round, the call-up reads `seed:callup:<week>`, and the three
// dates draw nothing at all. That is why the phase's signature takes `rng` and hands it to one
// line: the frozen capture (41550 / e6b0c709) sees `driftCohort` and nothing else in here.
import type { Rng } from '../rng'
import type { WorldState } from './state'
import { driftCohort } from '../season/cohort'
import { ageCurveOf, growWeek, physicalMean } from '../development'
// ⚠ THE ONE ANSWER TO "HOW MANY WEEKS HAS THIS BODY LOST", and not a second one taken off
// `careerTotals` directly: `weeksLostSoFar` is the max of the monotone v40 total and what the pruned
// `injuryHistory` still holds, which is the reading the career-ending injury already judges her by.
import { weeksLostSoFar } from '../ending'
import { coachById } from '../coach'
import { KNOCK_REST_GROWTH, knockRestWeek } from '../knock'
import { coachWorksThisWeek } from './phaseFinance'
import { ageAtWeek, kidAgeExact, markBirthday } from './age'
import { markCoachTravelOpen, markSchoolEnd } from './milestones'
import {
  collegeCoachFactor,
  collegeMatchesThisWeek,
  inCollege,
  resolveCallUp,
  resolveCollegeLeague,
  settleCallUpLetter,
} from './college'
import { rollKnock } from './knock'
import { summerLoadFactor } from './summer'

/** ⭐ PHASE 4 OF THE WEEKLY TICK – the ladder moves, she develops, and her life happens.
 *
 *  Called from `tickWeek` after her competition has resolved and before the canonical AI brackets
 *  run. `rng` is the MAIN stream and reaches exactly one line, `driftCohort`; see the header. */
export function growAndLive(world: WorldState, rng: Rng): void {
  // 3. cohort drift (main stream, fixed 4-draws-per-player)
  //
  // ⚠ THE SEED JOINED THE SIGNATURE IN ROUND 31 #13 AND IT SPENDS NOTHING ON THIS STREAM. The cohort
  // gets the same per-player decline spread the kid gets («полностью согласен, если это реализуемо»),
  // and a spread stored on the row would be persisted state on 199 players; derived per read off
  // `seed:decline:<id>` it costs one sub-stream and moves no draw here. Still exactly four.
  driftCohort(world.cohort, rng, world.seed)

  // 3b. SHE DEVELOPS (Phase 4). Deliberately here, beside the cohort's own drift: the whole point
  //     is that both sides of the ladder move, and putting them on adjacent lines is the cheapest
  //     way to keep it that way. ZERO main-stream draws – `growWeek` reads `seed:growth:<week>`,
  //     its own stream – so the frozen capture cannot move.
  //
  //     The matches that feed it are the ones she has actually played, so a tournament week teaches
  //     her and a training week does not pretend to.
  //
  // ⚠ LAST WEEK'S, NOT THIS WEEK'S, AND THE OFF-BY-ONE WAS A BUG THAT MADE THIS TERM DEAD CODE.
  //   This line used to read `e.week === world.week`, described as "counted off the ledger she just
  //   wrote". She had not written it. `tickWeek` increments `world.week` at its first statement and
  //   reaches here at step 3b; the draw for this week is only COMPUTED here (step 2 sets
  //   `pendingTournament`) and its match rows are written later, by `revealNextRound` /
  //   `skipTournament`, which are COMMANDS the caller issues after the tick returns. So the filter
  //   asked for rows that could not exist yet, and `matchesThisWeek` was 0 on every week of every
  //   career: `matchBonus` (up to +54% on a week's rate, `1 + min(m, 3) x 0.18`) had never once
  //   fired. Measured before the fix, tools/skill-ceiling.ts: 0 firing weeks over 31,000 weeks of
  //   career against 20,659 matches actually played.
  //
  //   `world.week - 1` is the honest read and needs no new state: `advanceWeeks` refuses to move
  //   while a reveal is open, so by the time the next tick runs, the previous week's rows are
  //   complete and final. The sentence the model tells is now "the competition she played last week
  //   is in her legs this week", which is also the truer one - a girl does not learn from a match
  //   on the morning she plays it.
  //
  //   ZERO RNG IMPLICATIONS: `growWeek` spends exactly one draw off `seed:growth:<week>` whatever
  //   this number is, and this file's own MAIN budget (base costs + 4 x cohort) is untouched, so the
  //   frozen capture (41550 / e6b0c709) cannot move. What DOES move is her skills, and through them
  //   the results she goes on to produce - see docs/specs/skill-model-audit-2026-08.md for the
  //   measured size (peak skill +0.3 on a managed career, +1.0 on a grinder).
  const matchesThisWeek = world.events.filter(
    (e) => e.week === world.week - 1 && e.type === 'match' && !e.friendly,
  ).length
  world.skills = growWeek({
    skills: world.skills,
    potential: world.potential,
    // ⚠ HER REAL AGE, not the band's - and this REPLACED a hybrid that said the same thing worse. It used
    // to be `ageAtWeek(week) + relativeAgeYears(birthMonth)`: the band's age plus an offset standing in
    // for a birthday. `kidAgeExact` is the birthday itself, off the game's own calendar, so the number is
    // now a fact rather than a correction - and a December girl develops at 13 because she IS 13, which is
    // the owner's point. Same magnitude, one concept instead of two. No new draw: `growWeek` keeps
    // `seed:growth:<week>`.
    ageYears: kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay),
    plan: world.plan,
    // ⚠ HE ONLY COACHES THE WEEKS HE IS PAID FOR, and since 08.08 that is every week except college
    //     and a booked family holiday. The pairing is the invariant, not the list: a week the family
    //     is billed for is a week he is there, and a week it is not billed for develops at the
    //     self-coached rate. Same predicate the bill used at step 1, so the two can never disagree
    //     about whether he came - which is what made the R4 reversal a one-line change here.
    coach: coachWorksThisWeek(world) ? coachById(world.seed, ageAtWeek(world.week), world.coachId) : null,
    playStyle: world.profile.playStyle,
    // ⭐⭐ AND AT COLLEGE THE MATCHES ARE THE SQUAD'S (17.08, docs/specs/the-college-choice-2026-08.md).
    //
    // `world.events` has no match rows inside the freeze – she enters nothing – so this term was 0 for
    // 208 weeks and a college programme was, developmentally, a girl practising alone. It is the one
    // thing a dearer place buys her tennis: a stronger squad plays a longer, harder dual-match season.
    //
    // ⚠ THE ADDITION IS SAFE BECAUSE EXACTLY ONE OF THE TWO IS EVER NON-ZERO. `collegeMatchesThisWeek`
    // returns 0 outside the freeze, and inside it the filter above finds nothing. ⚠ AND IT SPENDS THE
    // ENGINE'S OWN TUNED TERM RATHER THAN A NEW ONE – `matchBonus` / `matchBonusCap` are unchanged, so
    // this phase cannot inflate its own dimension by raising the ceiling on what a match is worth.
    // ⚠ ZERO DRAWS: a count, not a roll.
    matchesThisWeek: matchesThisWeek + collegeMatchesThisWeek(world),
    // ⭐⭐⭐ AND AT COLLEGE THE PROGRAMME COACHES HER (round 21, the owner's ruling of 17.08:
    // «она училась и работала»). `undefined` on every other week of every career, so this line is
    // provably inert outside the freeze – see `collegeCoachFactor`, which returns undefined the
    // moment `inCollege` is false or the career was never quoted a place.
    //
    // ⚠ THE `coach:` LINE ABOVE STAYS AS IT IS AND IS STILL `null` HERE, because `coachWorksThisWeek`
    // is what the BILL reads: the family is not paying for the programme's coaching and must not be.
    // The override replaces the rate; it does not hire anybody.
    coachFactorOverride: collegeCoachFactor(world),
    // ⭐⭐⭐ HER OWN CURVE (round 31 #10/#13). `ageCurveOf` answers the shipped 23/29 pair until the
    // fork at nineteen is answered and for every career the v68 pin covers, so this line is inert on
    // the whole junior era and on every save that already existed. See `WorldState.ageCurve`.
    bounds: ageCurveOf(world.ageCurve, weeksLostSoFar(world)),
    seed: world.seed,
    week: world.week,
    // ⚠ W4 – THE PRICE OF RESTING A KNOCK, and the whole reason `growWeek` gained this knob. She is
    // doing rehab and light hitting, not training, so the week earns KNOCK_REST_GROWTH of what it
    // would have. Expressed HERE as a multiplier on the week rather than as a lower `plan.train`
    // because `trainFactor` clamps below 60 – a career already on Light would otherwise have rested
    // for free, which is the farming hole this shape closes (knock.ts, note (a)).
    //
    // ⚠ W3-SUMMER – AND THE OTHER DIRECTION, ON THE SAME KNOB. The holidays have no school in them, so
    // she is on court twice a day, and the owner's ruling is that this is VOLUME rather than a better
    // multiplier: «если мы летом сделаем реальную нагрузку с 2 тренировками в день... это как раз
    // частично компенсирует недостаток тренерских недель в другие периоды». `loadFactor` is exactly
    // the right channel - its own note calls it "HOW MUCH OF THE WEEK SHE ACTUALLY TRAINED" - and the
    // coach, the plan slider and the luck draw are all untouched, which is what keeps summer from
    // being a second, hidden coach.
    //
    // The two never multiply into nonsense: `summerBlockWeek` refuses on a rested knock (she is off
    // the training court, so she cannot also be on it twice a day), so exactly one of these is ever
    // different from 1. ZERO draw implications - `growWeek` keeps `seed:growth:<week>`, one pull.
    loadFactor: (knockRestWeek(world.knock, world.week) ? KNOCK_REST_GROWTH : 1) * summerLoadFactor(world),
  })

  // 3b-bis. ⭐⭐⭐ ...AND THE BEST HER BODY HAS EVER BEEN IS REMEMBERED (v62, the long goodbye step 1 –
  //     docs/specs/the-long-goodbye-2026-08.md §3b). Nothing reads it yet; step 2 is what puts the
  //     last retirement offer on a share of THIS number instead of on her 38th birthday.
  //
  // ⚠ IMMEDIATELY AFTER `growWeek` AND FOR A MECHANICAL REASON, not for tidiness: `growWeek` is the
  //   ONLY thing in the engine that moves `world.skills` (world/knock.ts says so at `radarViewOf`,
  //   and `git grep 'world.skills ='` finds this one assignment). So a maximum taken on the line
  //   after it has seen every value her build has ever held – no other phase, command or migration
  //   can slip a build past it, which is what makes a running maximum honest rather than a sample.
  //
  // ⚠ A MAXIMUM, SO THE INTERRUPTIONS COST HER PROPERLY. A knock rest week develops at
  //   `KNOCK_REST_GROWTH` of the rate and a layoff at the college freeze's, so a career full of them
  //   arrives at 29 with a LOWER peak and therefore starts its last chapter from a lower number –
  //   which is §3's whole point, that the ending reads her body rather than her birthday. What it
  //   cannot do is fall: a bad week lowers `skills`, and `Math.max` simply keeps the number the good
  //   week already earned.
  //
  // ⚠ ZERO DRAWS ON ANY STREAM – a comparison over state `growWeek` has already computed. The frozen
  //   MAIN capture (41550 / e6b0c709) cannot see this line.
  world.peakPhysical = Math.max(world.peakPhysical, physicalMean(world.skills))

  // 3c. W4 – AND SHE CAME OFF COURT SORE. Deliberately LAST of the things that happen to her body,
  //     and after `growWeek`: the week's work is done and banked, and the knock is what she is left
  //     with on the Friday. Anything earlier would read as a knock she then trained through anyway.
  //
  //     ZERO main-stream draws – `drawKnock` reads `seed:knock:<week>`, its own per-week sub-stream,
  //     exactly as `rollInjury` reads `seed:injury:<week>` – so the frozen capture (41550 /
  //     e6b0c709) cannot move. `ordinaryTrainingWeek` also rules out every week with a pending
  //     tournament, so a knock can never arrive on a week the reveal flow still owns.
  // ⚠ AND NOT AT COLLEGE, for a mechanical reason as well as a fictional one: a knock BLOCKS the
  //   advance until the parent answers it, and there is no parent in the loop for those four years -
  //   an unanswered knock raised inside the freeze would strand the jump. `seed:knock:<week>` is a
  //   sub-stream, so the skipped draw is invisible to the MAIN capture.
  // ⭐ P5 – AND AT COLLEGE THE THING THAT HAPPENS TO HER IS A LETTER INSTEAD. Deliberately the same
  //   slot as the knock, because it is the same KIND of step: something arriving from outside that
  //   she did not ask for and cannot refuse. `resolveCallUp` fires at most once a year, only inside
  //   the freeze, and draws on `seed:callup:<week>` – its own sub-stream, exactly as `rollKnock`
  //   reads `seed:knock:<week>` – so the frozen MAIN capture cannot see it either.
  //   It pays NO money and NO ranking points, because the sport awards neither: it never touches
  //   `world.results` and no rank is recomputed for it. See engine/nationalTeam.ts for the sources.
  // ⭐⭐⭐ ROUND 24 – AND ONE WEEK OF THE YEAR IS HERS: THE STUDENT CHAMPIONSHIP. The owner, 21.08:
  //   «как минимум 1 турнир в год колледжа… тогда вызов в сборную можно будет опереть на результаты
  //   студенческого». Measured before it: 48 college years held 0.71 watchable matches between them,
  //   because the two squad trips write no rows and the letter was a 40% roll.
  //   ⚠ THE LEAGUE IS RESOLVED FIRST AND THAT IS CAUSAL ORDER RATHER THAN NEED. The two fire on
  //   different weeks (season 12 and 14), so neither can see the other's tick; the order here says
  //   which one the reader should understand first, and `resolveCallUp` reads the championship
  //   through `lastLeagueRun` rather than through anything this line arranges.
  //   ⚠ ITS OWN SUB-STREAM, `seed:collegeleague:<week>`, plus one `seed:collegematch:<week>:<r>` per
  //   round – so `seed:callup:<week>` is byte-identical to what it was and the frozen MAIN capture
  //   (41550 / e6b0c709) cannot see either of them.
  // ⭐⭐⭐ ROUND 27 #6 – AND THE LETTER GOES OUT ON THE CHAMPIONSHIP WEEK, TWO AHEAD OF THE TIE. The
  //   owner: «мы знаем будет это происходить или нет, можно письмо об этом пользователю нормальное
  //   присылать с приглашением на турнир». It is called immediately AFTER `resolveCollegeLeague`
  //   because that is the causality as well as the calendar: the selectors read the championship this
  //   very line has just played, and `lastLeagueRun` is what they read. ⚠ AND THE ORDER IS
  //   LOAD-BEARING – called before it, the paper would quote LAST year's form.
  //   ⚠ IT WRITES TO `world.offers` AND NOTHING ELSE, and it re-derives `seed:callup:<tieWeek>` – the
  //   SAME sub-stream `resolveCallUp` will derive two weeks later, never a new one – so the frozen
  //   MAIN capture (41550 / e6b0c709) still cannot see any of this block.
  if (!inCollege(world)) rollKnock(world)
  else {
    resolveCollegeLeague(world)
    settleCallUpLetter(world)
    resolveCallUp(world)
  }

  // 3d. AND SHE HAS A BIRTHDAY. The owner, 30.07: the birth month should show up in the notes.
  //
  //     ONE WEEK A YEAR, and it is the first thing in the game that says her birth month out loud. The
  //     player picks it in onboarding and until now it fed one cosmetic line on screen C - so the number
  //     deciding her whole relative-age story was invisible. Now the week it names stops and says so.
  //     ZERO DRAWS: a calendar comparison. Placed after `rollKnock` so a birthday week that also carries
  //     a knock reads in the order it happened - she came off court sore, and it was her birthday.
  //     ⭐⭐⭐ ROUND 24: ...AND THE COLLEGE YEARS GET THE DIALOG NOW, SO THE SPECIAL LINE IS GONE
  //     (owner, 22.08: «да, день рождения делай», superseding 19.08's feed-line substitute). The
  //     prompt is raised inside the freeze too - `resumeFromCollege` pauses the year on this very
  //     week - so the line is one sentence for every birthday of her life; see `markBirthday`.
  markBirthday(world)

  // 3e. ...AND ONE SEPTEMBER SHE DOES NOT GO BACK (W4-SCHOOL). The owner: «Школа должна когда-то
  //     закончиться, ей уже 21» and «Конец школы – в конце учебного года». Beside the birthday for
  //     the same reason the birthday is here: it is a date on the family's calendar rather than a
  //     result, it fires at most once, and it costs one integer comparison and no draws. AFTER the
  //     birthday, because the year she leaves she is already eighteen and the two lines read in that
  //     order.
  markSchoolEnd(world)

  // 3f. ⭐ ROUND-21 #2 – ...AND THE ONE TIME THE GAME TELLS HER THE COACH CAN COME TOO. The owner
  //     asked for this notice on 08.08 and `docs/decisions.md` recorded that it could not be built
  //     while travel could never happen. It can now. Beside the two dates above for the same reasons
  //     they are beside each other: at most once per career, a comparison and a scan, zero draws.
  markCoachTravelOpen(world)
}
