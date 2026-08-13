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
import { applyKit, kitWearAt } from '../equipment'
import { kitFreshCap } from '../offers'
import { conditionMatchFactor } from '../condition'
import { relativeAgeHeadStart, SKILL_KEYS, STARTING_SKILL_BAND, type KidSkills } from '../development'
import { coachEdgePp } from '../coach'
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
 *  is a fact about the man. */
export function coachMatchEdge(world: { seed: string; coachId?: string | null }): number {
  return coachEdgePp(world.seed, world.coachId ?? null) * COACH_EDGE_POINTS_PER_PP
}

/** THE COMPOSITION POINT: the kid exactly as she steps on court. Her raw build, scaled by the
 *  CONDITION factor (R9-19), then by the surface x play-style table (docs/specs/surface-style.md),
 *  then by the condition of her EQUIPMENT (docs/specs/equipment-and-serve-speed.md §2). All three
 *  are pure arithmetic with ZERO RNG, they compose multiplicatively, and every path that puts her in
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
    /** her CURRENT build. Optional for the same reason `offers` is – a pure caller without one gets
     *  the birth build, exactly as `kidMatchPlayer`. */
    skills?: KidSkills
    /** WHO IS IN HER CORNER, and the only input the coach's edge has. Optional for the same reason
     *  `offers` is: a pure caller that builds a player without a full world gets no coach and so no
     *  edge, which is byte-identical to what it got before this shipped. Every path that actually
     *  puts her on court passes the whole `WorldState`, which carries it. */
    coachId?: string | null
  },
  surface: Surface,
): MatchPlayer {
  const raw = kidMatchPlayer(world)
  const factor = conditionMatchFactor(world.condition)
  const composed = applyKit(
    applySurfaceStyle(
      {
        ...raw,
        age: kidAgeExact(world.week, world.profile.birthMonth),
        serve: raw.serve * factor,
        ret: raw.ret * factor,
        composure: raw.composure * factor,
        stamina: raw.stamina * factor,
        groundstrokes: raw.groundstrokes * factor,
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
    kitWearAt(
      world.seed,
      world.profile.background,
      world.week,
      kitFreshCap(world.offers ?? [], world.week),
      world.kit ?? null,
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
  const edge = coachMatchEdge(world)
  if (edge === 0) return composed
  return {
    ...composed,
    serve: composed.serve + edge,
    ret: composed.ret + edge,
    composure: composed.composure + edge,
    stamina: composed.stamina + edge,
    groundstrokes: composed.groundstrokes + edge,
  }
}

