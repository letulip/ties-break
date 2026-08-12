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
import { relativeAgeHeadStart, rollPotential, SKILL_KEYS, STARTING_SKILL_BAND, type KidSkills } from '../development'
import type { MatchPlayer, Surface } from '../match/types'
import type { CoachTier, KitState, Offer, PlayerProfile } from '../../shared/protocol'
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

// --- L1 measurement scaffolding (docs/specs/the-wall-2026-08.md §2 L1, §3) -----------------------
//
// ⚠ MEASUREMENT SCAFFOLDING, DEFAULT INERT. The wall spec's L1 lever – the owner's "the coach adds
// a small per-match edge, for as long as he is paid" – has no existing knob: a Markov engine has no
// "win chance" dial, so the honest translation is a small additive delta on her ON-COURT attributes
// at the composition point, calibrated per tier so her mean match-win probability against her actual
// field moves by the owner's percentage (tools/wall-l1-bench.ts is the calibration and the sweep).
//
// The defaults below are EXACTLY today's behaviour: every tier 0, decay off, and `kidMatchPlayerFor`
// returns the identical object it always built (the zero-edge early return below). Proved inert two
// ways per the spec – the frozen MAIN capture re-derives (tests/condition.test.ts) and a full
// 208-week career reproduces byte-identically (tools/wall-freeze-probe.ts). SHIPPING a non-zero
// value is a separate decision that waits on the measured numbers; nothing in the app writes these.
//
// ⚠ ZERO RNG. The edge is pure arithmetic over state (and, in decay mode, over `seed:kid` /
// `seed:potential` sub-stream DERIVATIONS, which are re-derived pure functions – no stream advances).
// MAIN cannot see this knob at any setting; only match OUTCOMES move, exactly like kit and condition.
/** Per-coach-tier additive edge on every on-court attribute, in skill points. All zeros = shipped
 *  behaviour. Read at composition from `profile.coachTier`, so firing the coach removes the edge the
 *  same week – "the edge leaves with him", which is the owner's whole-career market for the rung. */
export const COACH_MATCH_EDGE: Record<CoachTier, number> = { self: 0, budget: 0, middle: 0, high: 0, elite: 0 }
/** The owner's decay variant (addendum, 12.08: the edge falls as she fills up, «но не у всех
 *  0.0-0.1» – it must never reach zero). Curve: `edge × (floor + (1 − floor) × headroomShare)` with
 *  headroomShare = remaining headroom / total headroom, summed over the five wings – 1 at birth,
 *  falling toward `floor` as she approaches her ceiling, never below it. Off = flat, the default. */
export const COACH_MATCH_EDGE_DECAY: { on: boolean; floor: number } = { on: false, floor: 0.5 }

/** The edge she carries onto court today – 0 for every career under the shipped defaults. */
export function coachMatchEdge(world: { seed: string; profile: PlayerProfile; skills?: KidSkills }): number {
  const base = COACH_MATCH_EDGE[world.profile.coachTier] ?? 0
  if (base === 0) return 0
  if (!COACH_MATCH_EDGE_DECAY.on) return base
  const start = startingSkills(world.seed, world.profile)
  const potential = rollPotential(world.seed, start)
  const s = world.skills ?? start
  let left = 0
  let total = 0
  for (const k of SKILL_KEYS) {
    left += Math.max(0, potential[k] - s[k])
    total += potential[k] - start[k]
  }
  const share = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0
  return base * (COACH_MATCH_EDGE_DECAY.floor + (1 - COACH_MATCH_EDGE_DECAY.floor) * share)
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
    /** L1 scaffolding: her CURRENT build, read only by the decay curve. Optional for the same reason
     *  `offers` is – a pure caller without one gets the birth build, exactly as `kidMatchPlayer`. */
    skills?: KidSkills
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
  // L1 scaffolding (see COACH_MATCH_EDGE above): a zero edge returns the composed player UNTOUCHED –
  // the shipped object, byte for byte, not even an `x + 0`. A non-zero edge lands AFTER the whole
  // composition, additively on all five wings, so "she steps on court with +δ per wing" is literally
  // what the dial says – the coach in the corner, not a better racket and not a fresher body.
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

