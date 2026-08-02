// THE KID AS A MATCH PLAYER: turning a career's persisted state into the two numbers the match
// engine actually consumes.
//
// ⚠ DEPENDENCY DIRECTION. This is a leaf: it takes a structural view of the world
// (`{ seed, profile, skills }`) rather than `WorldState` itself wherever it can, so the match
// surfaces, the planner and the tests can all build a player without importing the integration core.
//
// ⚠ RNG: `startingSkills` derives from the seed, it does not draw on MAIN.
import { pickInt, rngFromSeed } from '../rng'
import { applySurfaceStyle } from '../match/style'
import { applyKit, kitWearAt } from '../equipment'
import { kitFreshCap } from '../offers'
import { conditionMatchFactor } from '../condition'
import { relativeAgeHeadStart, SKILL_KEYS, type KidSkills } from '../development'
import type { MatchPlayer, Surface } from '../match/types'
import type { Offer, PlayerProfile } from '../../shared/protocol'
import { KID_ID } from './constants'
import { kidAgeExact } from './age'

// --- the kid as a match player -----------------------------------------------
// The kid has no persisted skills in Phase 3 (development lands in Phase 4), so the
// starting build is derived deterministically from the world seed. Stable across a
// career, and snapshotted into every kid-match event for replay.
/** The build she is BORN with – the pre-Phase-4 derivation, unchanged, from `seed:kid`.
 *  createWorld seeds `world.skills` with it and the v19 migration back-fills old saves with it, so
 *  adding development moved nobody's starting point by a hundredth. */
export function startingSkills(seed: string, _profile: PlayerProfile): KidSkills {
  const r = rngFromSeed(seed + ':kid')
  return {
    serve: pickInt(r, 40, 58),
    ret: pickInt(r, 40, 58),
    composure: pickInt(r, 35, 55),
    stamina: pickInt(r, 40, 60),
    // ⚠ APPENDED LAST, AND THAT POSITION IS THE WHOLE MIGRATION STORY (v25). A fifth draw at the END
    // of a purpose-scoped sub-stream leaves the four above byte-identical - verified, not assumed -
    // so every career that already exists keeps the exact build it was born with and simply learns
    // what its forehand was. Putting it anywhere else in this literal would re-roll the world.
    // The band matches serve/ret: she is a junior, and her groundstroke is neither her best nor her
    // worst wing by construction.
    groundstrokes: pickInt(r, 40, 58),
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
  world: { seed: string; profile: PlayerProfile; condition: number; week: number; offers?: Offer[] },
  surface: Surface,
): MatchPlayer {
  const raw = kidMatchPlayer(world)
  const factor = conditionMatchFactor(world.condition)
  return applyKit(
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
    kitWearAt(world.seed, world.profile.background, world.week, kitFreshCap(world.offers ?? [], world.week)),
  )
}

