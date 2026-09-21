// THE KID AS A MATCH PLAYER: turning a career's persisted state into the two numbers the match
// engine actually consumes.
//
// ⚠ DEPENDENCY DIRECTION. This is a leaf: it takes a structural view of the world
// (`{ seed, profile, skills }`) rather than `WorldState` itself wherever it can, so the match
// surfaces, the planner and the tests can all build a player without importing the integration core.
//
// ⚠ RNG: `startingSkills` derives from the seed, it does not draw on MAIN – and neither does the
// coach's edge, which is a re-derivation off `seed:coachedge:<id>` (engine/coach.ts).
import { pickInt, rngFromSeed } from '../rng'
import { applySurfaceStyle } from '../match/style'
import { applyKit, kitWearAt, type KitWear } from '../equipment'
import { kitFreshCap } from '../offers'
import { conditionMatchFactor } from '../condition'
import { spiritMatchFactor } from '../spirit'
// ⭐⭐ v80, WAVE F1 – THE ONE READER OF `world.form`. `engine/form.ts` is a LEAF (it imports
// `ECONOMY` and nothing else), so this arrow closes nothing, exactly as `../spirit`'s does one line
// up. The arithmetic lives THERE and not here for the reason that module's own note gives: the radar
// calls the same function, so the composure a match is played at and the composure the coach draws
// can never be two different opinions of the same girl.
import { formComposureDelta } from '../form'
import { relativeAgeHeadStart, SKILL_KEYS, STARTING_SKILL_BAND, type KidSkills } from '../development'
import { coachEdgePp } from '../coach'
// ⚠⚠ THE EXCHANGE RATE, BY IMPORT AND NEVER BY COPY (wave 8b T3). `SKILL_LAW.eloPerCore` is the one
// spelling of «Elo per core point» in this engine, measured off its own closed form, and the comeback
// ramp is denominated in Elo since 21.09 – a `20.2` written here would be the second spelling that
// CLAUDE.md's barrel lesson is about. ⚠ ENGINE-INTERNAL and cycle-free: `season/fieldPros` imports
// `season/*` and `rng` only, and nothing in `season/` imports this file.
import { SKILL_LAW } from '../season/fieldPros'
// ⭐ v85 T6 – THE STAGED FACTOR'S OWN STAIRCASE. `engine/economy.ts` is the constants module and
// imports nothing from `world/`, exactly as `../coach` and `../condition` above do, so this leaf
// stays a leaf. What lives HERE is the last step: turning the research's months into the one number
// the composition can consume.
import { ECONOMY } from '../economy'
import type { MatchPlayer, Surface } from '../match/types'
import type { KitState, Offer, PlayerProfile } from '../../shared/protocol'
import { KID_ID } from './constants'
import { kidAgeExact } from './age'

// --- the kid as a match player -----------------------------------------------
// The kid has no persisted skills in Phase 3 (development lands in Phase 4), so the
// starting build is derived deterministically from the world seed. Stable across a
// career, and snapshotted into every kid-match event for replay.
/** The build she is BORN with – the pre-Phase-4 derivation, unchanged, from `seed:kid`.
 *  createWorld seeds `world.skills` with it and the v19 migration back-fills old saves with it, so
 *  adding development moved nobody's starting point by a hundredth.
 *
 *  ⚠ THE FIVE RANGES MOVED OUT TO `STARTING_SKILL_BAND` (engine/development.ts) AND NOT ONE OF THEM
 *  CHANGED. They are read here in the same order the literals stood in, which is `SKILL_KEYS`'s
 *  order, which is the order this sub-stream is walked in - so the draws are byte-identical and no
 *  career's birth build moves. The reason they are named at all is that the radar's axis top has to
 *  be DERIVED from them plus `potentialBand`; see the constant. */
export function startingSkills(seed: string, _profile: PlayerProfile): KidSkills {
  const r = rngFromSeed(seed + ':kid')
  return {
    serve: pickInt(r, ...STARTING_SKILL_BAND.serve),
    ret: pickInt(r, ...STARTING_SKILL_BAND.ret),
    composure: pickInt(r, ...STARTING_SKILL_BAND.composure),
    stamina: pickInt(r, ...STARTING_SKILL_BAND.stamina),
    // ⚠ APPENDED LAST, AND THAT POSITION IS THE WHOLE MIGRATION STORY (v25). A fifth draw at the END
    // of a purpose-scoped sub-stream leaves the four above byte-identical - verified, not assumed -
    // so every career that already exists keeps the exact build it was born with and simply learns
    // what its forehand was. Putting it anywhere else in this literal would re-roll the world.
    // The band matches serve/ret: she is a junior, and her groundstroke is neither her best nor her
    // worst wing by construction.
    groundstrokes: pickInt(r, ...STARTING_SKILL_BAND.groundstrokes),
  }
}

/** Her birth build plus the relative-age head start, clamped to the attribute range. Every skill moves by
 *  the same amount: eleven extra months of being a junior is not a specialisation. */
export function withHeadStart(skills: KidSkills, birthMonth: number): KidSkills {
  const bump = relativeAgeHeadStart(birthMonth)
  const out = { ...skills }
  for (const k of SKILL_KEYS) out[k] = Math.max(1, Math.min(100, Math.round((out[k] + bump) * 100) / 100))
  return out
}

export function kidMatchPlayer(world: { seed: string; profile: PlayerProfile; skills?: KidSkills }): MatchPlayer {
  // Her CURRENT build when the world has one (every world does since v19); the birth derivation is
  // the fallback for the handful of pure callers that build a player without a full world.
  const s = world.skills ?? startingSkills(world.seed, world.profile)
  return {
    id: KID_ID,
    // Round-7 item 17: full "First Last" (was first-name-only) so the match viewer's
    // under-court labels short-name the kid the same way the opponent already is
    // ("V. Martin", not "Vera"). formatShortName is applied at the display layer.
    name: `${world.profile.kidName} ${world.profile.kidLastName}`.trim(),
    serve: s.serve,
    ret: s.ret,
    composure: s.composure,
    stamina: s.stamina,
    groundstrokes: s.groundstrokes,
  }
}

// --- THE COACH'S EDGE, TURNED INTO TENNIS (docs/specs/coach-match-edge.md §3) --------------------
//
// The corridors and HIS OWN NUMBER live in engine/coach.ts, where every other fact about a coach
// lives - `coachEdgePp` is one uniform into his tier's corridor, drawn off his id, constant for as
// long as he is hers. What lives HERE is the last step: turning that percentage into the only thing
// the match engine can consume.
//
// ⚠ WHY IT IS A DELTA ON HER WINGS. A Markov engine has no "win chance" dial - matches are decided
// point by point - so the honest translation is a small additive delta on her five ON-COURT
// attributes at the composition point, the same seam kit and condition already use, calibrated so her
// mean match-win probability against her ACTUAL field moves by the corridor's percentage.
//
// ⚠ ZERO RNG ON MAIN. `coachEdgePp` draws on the purpose-scoped `seed:coachedge:<id>` sub-stream and
// this file only multiplies. The frozen capture (41550 / e6b0c709) cannot move, and only match
// OUTCOMES do - exactly like kit and condition.

/** PERCENT -> SKILL POINTS, and the one number that carries the whole calibration.
 *
 *  ⚠ MEASURED, NOT ASSUMED, AND THE ANCHOR TABLE IS WRITTEN DOWN HERE so nobody ever re-derives it by
 *  guess. `the-wall-2026-08.md` §M1: 1512 sampled states over 16 careers, her real field per rung -
 *
 *    target (pp per match)   measured delta (skill points, all five wings)
 *      0.45                    0.234
 *      0.65                    0.339
 *      0.85                    0.444
 *      1.05                    0.549
 *      2.10                    1.110
 *
 *  Linear to the eye: the ratio is 0.520 at 0.45 and 0.523 at 1.05, so ONE constant is accurate to
 *  under 1% everywhere inside the shipped corridors (0.2 - 1.1 pp). The 2.10 row is the 2x arm, at
 *  double the elite ceiling and outside anything that ships; the fit drifts to 1.1% there, which is
 *  why the claim is bounded to the corridors rather than stated flatly.
 *
 *  FOR SCALE: the visibility floor on one wing is 3 points (`TRAINING_FOG_FLOOR`), so no setting here
 *  is ever visible on the radar. That is correct rather than a limitation - the coach is worth a point
 *  of a MATCH, not a point of HER. */
export const COACH_EDGE_POINTS_PER_PP = 0.5225

/** The edge she carries onto court today, in skill points on every wing - exactly 0 whenever nobody
 *  is hired, so the parent on the court is on the same code path she has always been on.
 *
 *  ⚠ IT READS `coachId`, NOT `profile.coachTier`. The profile's rung is the ONBOARDING record and
 *  `hireCoach` never touches it - every engine surface that wants the rung she is actually on derives
 *  it from the id (`tierOf(coachById(...))` in the snapshot and in knock.ts). Reading the profile here
 *  would hand a fired coach's edge to a self-coaching parent for the rest of the career.
 *
 *  So firing him removes the edge the same week - "the edge leaves with him", which is the owner's
 *  whole-career market for the rung - and re-hiring him hands back the same number, because the number
 *  is a fact about the man.
 *
 *  ⭐ AND IT DOUBLES WHEN HE IS ON THE TRIP (owner, 14.08 - the sentence is quoted over `coachEdgePp`,
 *  which owns the arithmetic). What arrives here is the two clauses of `coachTravelsWithHer` and
 *  nothing else: `coachOnEventWeeks` is THE STANCE, and «there is somebody to send» is the `coachId`
 *  clause this function already had and `coachEdgePp` already refuses on. So this is not a second copy
 *  of that predicate - it is the same two facts, one of them the edge has always owned - and
 *  tests/coach-travel-edge-helping.test.ts pins the two to the same answer on real worlds so they
 *  cannot drift apart.
 *
 *  ⚠ THE PREDICATE IS READ STRUCTURALLY RATHER THAN IMPORTED, and the reason is the file header's
 *  first line: this module is a LEAF. `coachTravelsWithHer` lives in world/coachMarket.ts, which
 *  imports the ledger, the ladder and world/sponsors at RUNTIME - importing it here would point a leaf
 *  back at the integration layer that imports it. The test is the anti-drift device instead.
 *
 *  ⚠ `coachOnEventWeeks` IS OPTIONAL FOR THE SAME REASON `coachId` IS: a pure caller that builds a
 *  player without a full world gets `false`, which is byte-identical to what it got before this
 *  shipped. Undefined means "she is not on a trip with anybody", which is the safe direction. */
export function coachMatchEdge(world: {
  seed: string
  coachId?: string | null
  /** THE STANCE, not the week: `world.coachOnEventWeeks`. See above for why the two-clause predicate
   *  is not imported, and for what the missing clause is. */
  coachOnEventWeeks?: boolean
}): number {
  return coachEdgePp(world.seed, world.coachId ?? null, world.coachOnEventWeeks ?? false) * COACH_EDGE_POINTS_PER_PP
}

/** ⭐⭐⭐ v85 T6, **RE-DENOMINATED IN ELO AT WAVE 8b T3 ON HIS WORD OF 21.09 («да, деноминируем»)** –
 *  THE COMEBACK RAMP, AS A MULTIPLIER ON HER FIVE WINGS. −200 / −100 / −50 / 0 **Elo** over 0–3 /
 *  3–6 / 6–12 / 12+ months after the week she came back, converted to a factor PER PLAYER here:
 *
 *      C = her overall(4) that week · factor = max(0.5, (C − dElo / eloPerCore) / C)
 *
 *  The staircase lives in `ECONOMY.motherhood.comebackStages`, where the re-denomination and the
 *  research behind it are argued; this function is the last step and nothing else, exactly as
 *  `COACH_EDGE_POINTS_PER_PP` above turns the coach's corridor into tennis.
 *
 *  ⚠⚠ **`eloPerCore` COMES BY IMPORT FROM `season/fieldPros` AND IS NEVER A COPIED `20.2`.** Two
 *  spellings of one exchange rate is precisely the drift CLAUDE.md's barrel lesson exists for: the
 *  rate is «measured off this engine's own closed form» and its own note says it moves only if
 *  `SKILL_K`/`RALLY_K` move, «in which case every anchor must be re-derived, not rescaled by eye» –
 *  a second copy here would be the anchor nobody re-derived. ⚠ It is an ENGINE-INTERNAL import and
 *  purity is untouched (`season/fieldPros` reaches `season/*` and `rng` only, so no cycle).
 *
 *  ⚠⚠ **IT IS A FUNCTION OF TWO WEEK NUMBERS AND A BUILD, AND THE SIGNATURE IS STILL THE FENCE.**
 *  `docs/specs/form-and-slump.md` (results-driven form) is OWNER-PARKED and the wave brief's §0 says
 *  this must not become it by the back door. The third argument is her CORE – the mean of four
 *  attributes, which is what she IS – and emphatically not a result, a rank or a world. A factor that
 *  cannot be HANDED a result cannot read one, and `tests/wave8-comeback-factor.test.ts` §D pins that
 *  from both sides: behaviourally, by replacing a career's whole match history and watching the
 *  number sit still, and structurally, by reading this function's own text.
 *
 *  ⚠ WHY THE CORE AT ALL: an Elo handicap is not a fixed fraction of anybody. The same −200 costs a
 *  #15 and a #200 the same number of RATING points, which is what the currency means, and therefore a
 *  different fraction of each one's wings – which is the whole content of the re-denomination.
 *
 *  ⚠ THE FLOOR IS 0.5 AND IT IS A SAFETY RAIL RATHER THAN A TUNING KNOB: at the shipped rungs it is
 *  never reached (−200 Elo is ~9.9 core, and a returner at the bottom of the professional table is
 *  far above twice that), so it changes no shipped number. What it forbids is the arithmetic going
 *  negative on a hand-built probe with a tiny build, which would flip her wings' sign.
 *
 *  ⚠ THE LAST RUNG SHE HAS REACHED WINS, `pregnancyChanceAt`'s own loop (`world/lifeBeat.ts` §14) and
 *  its own reason: the table is read in order so that «ascending» is what the code actually depends
 *  on, which is what a test can then pin.
 *
 *  ⭐ A WEEK **BEFORE** THE RETURN TAKES NO RUNG AND COMES BACK EXACTLY 1.0 – `back` is negative, no
 *  `fromWeeksBack` is reached, `dElo` stays 0 and `(C − 0) / C` is exactly 1 in IEEE-754. So is the
 *  last rung, whose `dElo` is exactly 0. Both identities are EXACT rather than rounded, which is what
 *  keeps a stored `WorldMatch` from before the pause – and a career twelve months back – composing
 *  byte-identically. Pure arithmetic, ZERO RNG, no world. */
export function comebackMatchFactor(returnedWeek: number, week: number, core: number): number {
  const back = week - returnedWeek
  let dElo = 0
  for (const stage of ECONOMY.motherhood.comebackStages) if (back >= stage.fromWeeksBack) dElo = stage.dElo
  if (core <= 0) return 1
  return Math.max(0.5, (core - dElo / SKILL_LAW.eloPerCore) / core)
}

/** THE COMPOSITION POINT: the kid exactly as she steps on court. Her raw build, scaled by the
 *  CONDITION factor (R9-19) and – since v72 – by her SPIRIT (docs/specs/who-she-is-2026-09.md §4;
 *  absent or at/above the knee ⇒ 1.0), then by the surface x play-style table
 *  (docs/specs/surface-style.md), then by the condition of her EQUIPMENT
 *  (docs/specs/equipment-and-serve-speed.md §2). All of them are pure arithmetic with ZERO RNG, they
 *  compose multiplicatively, and every path that puts her in
 *  a match – the shadow tournament, the practice friendly, the exhibition viewer – builds her here,
 *  so the modifiers land exactly once per match. `all-court` (and any untouched attribute, and every
 *  attribute of a girl in fresh kit) comes back byte-identical to the pre-slice scaling.
 *
 *  ⚠ AND HER AGE IS STAMPED HERE, not resolved when a box score is drawn. `age` is not a skill and
 *  `basePServe` never reads it; it is the age half of the serve-speed curve (match/serveSpeed.ts).
 *  It belongs on the snapshot because `WorldMatch.a/.b` freeze this object into the save - a box
 *  score re-opened three seasons later has to report the serve of the girl who played the match. Her
 *  REAL age, `kidAgeExact`, not the band's: a December girl genuinely serves a shade slower than a
 *  January girl in the same draw, which is the relative age effect turning up somewhere it belongs. */
export function kidMatchPlayerFor(
  world: {
    seed: string
    profile: PlayerProfile
    condition: number
    week: number
    offers?: Offer[]
    /** W3-KIT (v37): the rung she is on per line. Optional for the same reason `offers` is - a pure
     *  caller that builds a player without a full world gets the shipped rung, byte-identical. */
    kit?: KitState
    /** ROUND-29 #20: the weeks a booked family holiday stood her kit down, so the wear clock counts
     *  the weeks she PLAYED. Optional for the same reason `kit` is – a pure caller without one gets
     *  the elapsed-calendar answer, which is byte-identical to what this function always gave. */
    gearRestWeeks?: number[]
    /** ⭐ HER KIT'S WEAR, OVERRIDDEN – the SEVENTH reading and still not a seventh term, exactly like
     *  the sponsor's floor, the rung and the holiday stand-down before it: what arrives here is the
     *  WEAR that goes into `applyKit`, never the arithmetic. Absent ⇒ `kitWearAt` reads the clock, so
     *  every existing caller composes byte-identically.
     *
     *  ⚠ IT EXISTS FOR ONE CALLER AND THE REASON IS THE SAME ONE `condition` HAS. The field-strength
     *  BAND compares a RUNG's level with hers, and `season/preview.ts` has argued since wave 2 that a
     *  level comparison must not quote a transient – *"their exhaustion today says nothing about their
     *  condition on a week that has not happened"*. Kit wear is that same transient one seam along: it
     *  runs a saw-tooth as strings go and are replaced, and measured on the owner's w933 save it moved
     *  her rested rating by **7 points a week** while her five skills moved by one. The BAND therefore
     *  reads her at `FRESH_KIT`, exactly as it reads the field at `ECONOMY.condition.max` – both sides
     *  at their best, which is the only way the comparison is like-for-like. ⚠ THE RING IS UNTOUCHED
     *  and still plays her in the racket she owns this week. */
    kitWear?: KitWear
    /** her CURRENT build. Optional for the same reason `offers` is – a pure caller without one gets
     *  the birth build, exactly as `kidMatchPlayer`. */
    skills?: KidSkills
    /** WHO IS IN HER CORNER, and the only input the coach's edge has. Optional for the same reason
     *  `offers` is: a pure caller that builds a player without a full world gets no coach and so no
     *  edge, which is byte-identical to what it got before this shipped. Every path that actually
     *  puts her on court passes the whole `WorldState`, which carries it. */
    coachId?: string | null
    /** ⭐ ...AND WHETHER HE COMES WITH HER, which is the only other input it has (see
     *  `coachMatchEdge`). Optional and false-by-default, exactly like `coachId`: a pure caller
     *  without one composes byte-identically to what it did before the travel helping shipped. */
    coachOnEventWeeks?: boolean
    /** ⭐ v72 – HER SPIRIT, the EIGHTH optional field and still not an eighth term. Optional for the
     *  same reason `offers`, `kit`, `skills` and `coachId` are, and it is the strongest form of that
     *  argument this file has: ABSENT ⇒ `spiritMatchFactor` is not called at all and the factor is
     *  1.0, so every pure caller AND every stored `WorldMatch` replay composes byte-identically to
     *  what it did before this shipped. A migrated career reads 70, which is above the knee, so it
     *  is byte-identical too until something actually moves her.
     *
     *  ⚠ THE KID ONLY. Rivals have no private life and read nothing of this – their side of the
     *  cohort question is form-and-slump §4.4's, deferred with it. */
    spirit?: number
    /** ⭐⭐⭐ v80 – HER FORM, THE NINTH optional field and still not a ninth term
     *  (`docs/specs/the-form-and-the-sparring-2026-09.md` §2). Optional for exactly the reason
     *  `spirit` one line up is, and it is the strongest form of that argument this file has: ABSENT
     *  ⇒ `formComposureDelta` returns a literal 0, the sum below is `composure + edge` unchanged, and
     *  every pure caller AND every stored `WorldMatch` replay composes byte-identically to what it
     *  did before this shipped. A migrated career reads 0, which is the same 0, so it is
     *  byte-identical too until a match or a gap actually moves her.
     *
     *  ⚠ THE KID ONLY, v1 (O6, the owner's 16.09 ruling). Rivals carry no form – the population cost
     *  of 199 cohort rows plus the 1,600-strong professional scalar is measured at F3 and ruled
     *  then, which is the parked spec's own caution kept. */
    form?: number
    /** ⭐⭐⭐ v85 T6 – **HER COMEBACK'S CLOCK**, and it is the **TENTH** optional field rather than the
     *  ninth the brief predicted: `form` (v80, wave F1) took the ninth seat before this wave opened.
     *  Reported rather than quietly renumbered – the SYMBOL the brief names is right and the ORDINAL
     *  is one behind.
     *
     *  Optional for exactly the reason `spirit` and `form` above are, and it is the strongest form of
     *  that argument this file has: ABSENT (or `null`) ⇒ `comebackMatchFactor` is not called at all,
     *  the factor is a literal 1, and `x * 1` is exact in IEEE-754 – so every pure caller AND every
     *  stored `WorldMatch` replay composes BYTE-IDENTICALLY to what it did before this shipped. A
     *  career that never paused carries `comeback: null` and is on the same code path it has always
     *  been on.
     *
     *  ⚠⚠ **AND THE TYPE IS THE PARKED-SPEC FENCE, NOT ONLY A NARROWING.**
     *  `docs/specs/form-and-slump.md` (results-driven form) is OWNER-PARKED, and §0 of the wave brief
     *  says the staged factor «is NOT that spec and must not become it by the back door». What is
     *  declared here is `returnedWeek` AND NOTHING ELSE – not `ComebackState`, which would have
     *  carried the freeze in with it, and emphatically not the world. A factor that cannot be HANDED a
     *  result cannot read one, which is the boundary expressed as a type rather than as a promise.
     *  `world.comeback` satisfies it structurally, so no caller had to change.
     *
     *  ⚠ THE KID ONLY, `spirit`'s own fence one field up: rivals have no private life, and their side
     *  of the question is form-and-slump §4.4's, deferred with it. */
    comeback?: { returnedWeek: number } | null
  },
  surface: Surface,
  /** ⭐⭐ IS HE ON **THIS** TRIP – the owner's ruling, 15.08: «поездки С тренером открываются на w
   *  серии с призами», and «я такого не говорил» to the reading that the helping applies everywhere.
   *
   *  ⚠ WHY IT IS AN ARGUMENT AND NOT `world.coachOnEventWeeks`. That field is the STANDING STANCE –
   *  "send him when there is somewhere worth sending him" – and reading it here gave the doubled
   *  edge to two weeks it was never meant for: a JUNIOR event, where `coachTravelFareFor` charges
   *  nothing because the rung pays nothing, and a HOME PRACTICE FRIENDLY, which is not a trip at
   *  all. Free help in both. The stance is a policy; whether he is standing at this particular
   *  court is a fact about the week, and only the caller knows it.
   *
   *  ⚠ AND THE ONE SOURCE OF TRUTH IS THE FARE. `coachTravelFareFor(world, event) > 0` already
   *  answers "did he come to this one" – it carries the stance, the "somebody to send" clause and
   *  the W-series gate together – so the helping follows the money by construction and the two can
   *  never disagree. Omitted ⇒ false, which is the safe direction and keeps every pure caller
   *  byte-identical. */
  onThisTrip?: boolean,
): MatchPlayer {
  const raw = kidMatchPlayer(world)
  const factor = conditionMatchFactor(world.condition)
  // ⭐⭐ v72 – AND HOW SHE IS IN HERSELF, on the identical seam and beside condition's own factor: a
  // SECOND multiplicative factor on the same five wings, pure arithmetic, zero RNG, applied exactly
  // once per match because every path that puts her on court builds her here (this file's contract).
  //
  // ⚠ ABSENT ⇒ 1.0, AND IT IS AN `undefined` CHECK RATHER THAN A `?? 70` DEFAULT ON PURPOSE. The
  // literal 1 is the identity element for a product, so a pure caller without a spirit gets the same
  // object it always got – not "a girl at baseline", which would be a claim about her.
  //
  // ⚠ NOT A SECOND SPELLING OF THE CURVE: `spiritMatchFactor` is the one implementation, in
  // engine/spirit.ts beside `conditionMatchFactor`, and the two are the same curve family with
  // different knees and floors (60/0.90 against 70/0.55 – spirit's worst is gentler than fatigue's
  // at every point, which is the design's own bound).
  const spiritF = world.spirit === undefined ? 1 : spiritMatchFactor(world.spirit)
  // ⭐⭐⭐ v85 T6 – AND THE MONTHS SHE WAS AWAY, ON THE IDENTICAL SEAM AND BESIDE THE OTHER TWO: a
  // THIRD multiplicative factor on the same five wings, pure arithmetic, zero RNG, applied exactly
  // once per match because every path that puts her on court builds her here (this file's contract).
  // The staircase is the research's own shape (−40% → −20% → −10% → full over 0–3 / 3–6 / 6–12 / 12+
  // months) DENOMINATED IN ELO since wave 8b T3, and lives in `ECONOMY.motherhood.comebackStages`;
  // `comebackMatchFactor` above is the reading.
  //
  // ⚠ THE CORE IS TAKEN OFF `raw` – her BUILD, before condition, spirit and the surface touch it –
  // which is the scale `eloPerCore` was measured on («two flat builds ten core apart»). Reading it
  // after the other two factors would price the handicap against a tired girl's wings and make the
  // ramp deeper on exactly the weeks she is already worst, which is a second mechanic nobody drafted.
  // ⚠ FOUR ATTRIBUTES AND NOT FIVE: overall(4) is serve/ret/composure/stamina, `coreForStanding`'s own
  // measure and the one the whole professional table is built on. `groundstrokes` is derived from the
  // style and is not part of it.
  //
  // ⚠ ABSENT ⇒ 1.0, AND IT IS A PRESENCE CHECK RATHER THAN A DEFAULT WEEK, `spirit`'s own line one
  // above: the literal 1 is the identity element for a product, so a career that never paused gets
  // the same object it always got – not «a girl who came back a long time ago», which would be a
  // claim about her.
  //
  // ⚠⚠ IT MULTIPLIES THE WINGS AND NOT THE OUTCOME. Whether the comeback WORKS is emergent and is
  // MEASURED (T9's arm, and T5's own «nothing here may ever become a success rate» read one task on):
  // this makes her a weaker player for a year, and the tour does the rest.
  const comebackF = world.comeback
    ? comebackMatchFactor(
        world.comeback.returnedWeek,
        world.week,
        (raw.serve + raw.ret + raw.composure + raw.stamina) / 4,
      )
    : 1
  const composed = applyKit(
    applySurfaceStyle(
      {
        ...raw,
        age: kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay),
        // ⭐ AND THE CONDITION ITSELF, beside the factor it produced (27.08). `factor` is the
        // STRENGTH half of condition and it is already inside the five attributes below; this is the
        // BREAKABILITY half, which `retireHazard` reads through `retireDurability` and which nothing
        // else reads at all. Written from the SAME `world.condition` one line above `factor` is, so
        // the two halves of one number cannot disagree about the girl who took the court - and it is
        // frozen into `WorldMatch.a` beside her skills, so a re-watch three seasons later replays
        // the match that was played (`MatchPlayer.condition` argues that in full).
        //
        // ⚠ NEITHER `applySurfaceStyle` NOR `applyKit` TOUCHES IT, and neither should: a hard court
        // and a dead frame change how she PLAYS, not how worn out she turned up. Both spread the
        // player through, so it survives the composition unchanged - which is the whole reason it can
        // be written at the top of it.
        condition: world.condition,
        serve: raw.serve * factor * spiritF * comebackF,
        ret: raw.ret * factor * spiritF * comebackF,
        composure: raw.composure * factor * spiritF * comebackF,
        stamina: raw.stamina * factor * spiritF * comebackF,
        groundstrokes: raw.groundstrokes * factor * spiritF * comebackF,
      },
      world.profile.playStyle,
      surface,
    ),
    // ⚠ AND THE SPONSOR'S FLOOR UNDER HER KIT, WHICH IS A FOURTH READING AND NOT A FOURTH TERM. The
    // multiplication is unchanged - it is still exactly `applyKit(applySurfaceStyle(raw × factor))` -
    // and what a signed kit deal moves is the WEAR that goes in, never the arithmetic. `kitFreshCap`
    // is null for every career that has not signed one, so an unsponsored girl is byte-identical to
    // what she was.
    //
    // ⚠ AND THE RUNG SHE IS ON, WHICH IS A FIFTH READING AND STILL NOT A FIFTH TERM (W3-KIT, v37).
    // Same shape as the sponsor's floor: what the ladder moves is the WEAR that goes in - where on
    // her line's curve a brand-new one of these starts, and how long that curve is - never the
    // arithmetic. `undefined` is the shipped rung, so a save from before v37 composes byte-identically.
    //
    // ⚠ AND THE WEEKS SHE DID NOT PLAY, WHICH IS A SIXTH READING AND STILL NOT A SIXTH TERM
    // (round-29 #20, the owner's ruling 5 of 09.08). Same shape again: a booked family holiday moves
    // the WEAR that goes in - the clock stands down while nobody is on court - never the arithmetic.
    // An empty ledger is the identity element, so a career that never booked a holiday composes
    // byte-identically to what it did before this shipped.
    world.kitWear ??
      kitWearAt(
        world.seed,
        world.profile.background,
        world.week,
        kitFreshCap(world.offers ?? [], world.week),
        world.kit ?? null,
        world.gearRestWeeks ?? [],
      ),
  )
  // ⚠ AND THE COACH IN HER CORNER, WHICH IS A SIXTH READING AND THE FIRST ADDITIVE ONE (see
  // COACH_EDGE_POINTS_PER_PP above). A zero edge - nobody hired - returns the composed player
  // UNTOUCHED, the same object byte for byte, not even an `x + 0`; that is what keeps a self-coached
  // career identical to the one it was before this shipped, and it is invariant 4 of the spec.
  //
  // A hired coach's edge lands AFTER the whole composition, additively on all five wings, so "she
  // steps on court with +δ per wing" is literally what the number says – the coach in the corner, not
  // a better racket and not a fresher body. Additive rather than multiplicative on purpose: the
  // calibration was measured as a flat delta on the five wings, and a multiplier would make the same
  // coach worth more to a girl who is already good, which is the opposite of what coaching is.
  //
  // ⭐ AND A COACH WHO TRAVELS WITH HER IS THAT SAME DELTA TWICE - still one reading, still one term,
  // still the same zero for a girl with nobody. The doubling happens inside `coachEdgePp`, on the man
  // rather than on the composition, so nothing about the seam above changes and the early return
  // below is still the whole of the self-coached path.
  // ⭐ THE STANCE IS NOT THE WEEK – see `onThisTrip` on the signature. `world.coachOnEventWeeks` is
  // the policy; whether he is standing at THIS court is a fact only the caller has.
  const edge = coachMatchEdge({ ...world, coachOnEventWeeks: onThisTrip ?? false })
  // ⭐⭐⭐ v80, WAVE F1 – AND HOW SHE IS PLAYING, which is the SECOND additive reading and lands on
  // ONE wing where the coach's lands on five. `composureEff = composure + form × K`, the parked
  // spec's own choice kept verbatim, because it is the cheapest honest seam: the radar, the box
  // score, the live commentary and the coach's read all INHERIT it with zero new surfaces, and her
  // serve wobbling in a slump is the same composure the commentary already knows how to talk about.
  //
  // ⚠ ONE WING AND NOT FIVE, DELIBERATELY. The coach's edge is a flat delta on all five because that
  // is what a coach is; form is NERVE, and spreading it would make a slump a worse SERVE, which is a
  // claim about her technique rather than about her week. §2 of the spec names composure as the one
  // reader and this line is the whole of it.
  //
  // ⚠ AFTER THE WHOLE COMPOSITION, beside the coach's edge and for its reason: the corridor is
  // priced in COMPOSURE POINTS at the clamps (±6 at `K = 0.6`), and a term applied before
  // `conditionMatchFactor` would be worth less to a tired girl than to a fresh one – form scaled by
  // fatigue, which is two mechanics wearing one number.
  const formDelta = formComposureDelta(world.form)
  // ⚠ THE EARLY RETURN NOW ASKS BOTH QUESTIONS, and that is what keeps «a self-coached career is
  // identical to the one it was before this shipped» literally true one wave on: a girl with nobody
  // hired and form at neutral gets the composed object back UNTOUCHED, the same object byte for
  // byte, not even an `x + 0`.
  if (edge === 0 && formDelta === 0) return composed
  return {
    ...composed,
    serve: composed.serve + edge,
    ret: composed.ret + edge,
    // ⚠ THE FLOOR IS ON THE FORM PATH ONLY, and the ternary is how the no-form path stays PROVABLY
    // byte-identical rather than merely equal in practice. `Math.max(0, x)` returns `x` for every
    // positive `x`, so a clamp on both branches would be right too – and «right in practice» is
    // exactly the claim a stored replay cannot afford. At `formDelta === 0` the expression is the
    // one that shipped in v79, character for character.
    composure:
      formDelta === 0 ? composed.composure + edge : Math.max(0, composed.composure + edge + formDelta),
    stamina: composed.stamina + edge,
    groundstrokes: composed.groundstrokes + edge,
  }
}

