// Surface x play-style (docs/specs/surface-style.md). The kid's ONE build choice meets the
// calendar's one physical axis.
//
// WHAT THIS IS NOT. The engine already knows about surfaces as PHYSICS: point.ts adds
// SURFACE_SERVE_BONUS (grass +0.015 / hard 0 / clay -0.015) to p, and rally.ts scales the ace rate
// (grass x1.5, clay x0.6) and rally length (clay +1 shot, grass -1). All of that is SYMMETRIC – both
// players get the same term, so it changes what a match on grass FEELS like without tilting the
// matchup by one point. This table is the first thing that makes a surface favour a PLAYER, so it
// composes with the physics instead of restating it: the physics say "grass is a serving surface",
// the table says "and SHE is a server".
//
// MAGNITUDE (the knob). Everything is a delta on ONE attribute: +0.05 means that attribute plays 5%
// bigger on this surface for this style. Calibration against the engine's own numbers, at the kid's
// starting build (attributes ~40-58, so ~50):
//
//   point.ts SKILL_K = 0.0016 p per skill point, so +5% serve = +2.5 pts = +0.004 p on her serve
//   points. The engine's own surface serve bonus is 0.015 – so the biggest single knob here is
//   about a QUARTER of the physics term, and unlike the physics it lands on one side only. In
//   match-win terms that is a couple of percentage points per event: enough to steer a calendar
//   over a season, never enough to decide one match. Stamina deltas are smaller still – stamina
//   only enters past point 120 and is capped at 0.03 – so they read as flavour with a late-match
//   edge, which is exactly what "she is built for the long clay rally" should be worth.
//
// NO FREE LUNCH. For every style, every attribute's deltas sum to ZERO across the three surfaces.
// A specialist TRADES surfaces; she is never handed a net bonus for existing. That is what keeps
// `all-court` – the all-zero row – from being dominated: its payoff is the absence of a bad week.
//
// KID ONLY, for now. `AiPlayer` carries no style, so nothing here is applied to the cohort; the
// asymmetry is fair because the style also carries the penalties. The functions below are pure over
// (MatchPlayer, PlayStyle, Surface) and never touch world state, so the planned later slice that
// DERIVES a style for each AI from her attributes can reuse them verbatim.

import type { MatchPlayer, Surface } from './types'
import type { PlayStyle } from '../../shared/protocol'

/** The MatchPlayer fields a court can move. `composure` is deliberately never touched by any row:
 *  big-point nerves are hers, not the court's. */
export type SkillKey = 'serve' | 'ret' | 'composure' | 'stamina'

/** Signed multiplicative deltas by attribute; absent = 0 = untouched (kept byte-identical). */
export type StyleDeltas = Partial<Record<SkillKey, number>>

// --- the knobs ---------------------------------------------------------------
/** Her weapon, amplified or muted: the surface either gives her the shot or takes it away. */
const BIG = 0.05
/** The legs behind a grinding style. */
const MID = 0.04
/** A tilt, not a weapon – used where a surface only helps a bit (and doubled where a style is
 *  favoured on TWO surfaces, so the third still balances the row to zero). */
const SMALL = 0.03

/** The largest single delta in the table – the guard rail the spec asks for (±3-6%). */
export const SURFACE_STYLE_MAX_DELTA = 2 * SMALL

/**
 * The table. Read a row as "on this court, these attributes of hers play bigger/smaller".
 *
 *  | style          | clay          | hard          | grass         |
 *  |----------------|---------------|---------------|---------------|
 *  | serve-first    | −             | 0             | +             |
 *  | counterpuncher | +             | 0             | −             |
 *  | aggressive     | −−            | +             | +             |
 *  | all-court      | 0             | 0             | 0             |
 */
export const SURFACE_STYLE_DELTAS: Record<PlayStyle, Record<Surface, StyleDeltas>> = {
  // Grass: low skid, short points, the engine's own ace rate x1.5 – her serve is a free-point
  // machine and she spends less to win a point. Clay: the high bounce sits up on the returner's
  // strings, the free point is gone and every rally is one ball longer than her game wants.
  'serve-first': {
    grass: { serve: +BIG, stamina: +SMALL },
    hard: {},
    clay: { serve: -BIG, stamina: -SMALL },
  },
  // Clay: the extra half-second is her whole game – she gets to the ball and the ball comes back.
  // Grass: nothing to retrieve on a 3-shot point, and the skid takes away the time she lives on.
  counterpuncher: {
    clay: { ret: +BIG, stamina: +MID },
    hard: {},
    grass: { ret: -BIG, stamina: -MID },
  },
  // Hard: a true bounce at a hittable height – first-strike tennis in its natural home, on serve
  // AND on the return. Grass rewards the first strike too, but the low ball is not what she'd
  // order. Clay is the punishment: the court gives her winners back, so the drag is double (the
  // price of being favoured on two of three surfaces – the row still sums to zero).
  aggressive: {
    hard: { serve: +SMALL, ret: +SMALL },
    grass: { serve: +SMALL },
    clay: { serve: -2 * SMALL, ret: -SMALL },
  },
  // The zero row. No home surface, no away surface – the build that never draws a bad week.
  'all-court': { hard: {}, clay: {}, grass: {} },
}

const SKILLS: SkillKey[] = ['serve', 'ret', 'composure', 'stamina']

/** Per-attribute multipliers (1 = untouched) for a style on a surface. */
export function surfaceStyleMultipliers(style: PlayStyle, surface: Surface): Record<SkillKey, number> {
  const deltas = SURFACE_STYLE_DELTAS[style][surface]
  const out = {} as Record<SkillKey, number>
  for (const k of SKILLS) out[k] = 1 + (deltas[k] ?? 0)
  return out
}

/**
 * The kid's (or, later, anyone's) MatchPlayer as this surface lets her play. Pure arithmetic, ZERO
 * RNG, no world state: a new MatchPlayer, the input untouched. An untouched attribute – and every
 * attribute of an `all-court` player – comes back byte-identical, which is what lets the frozen
 * main-stream pins stay valid.
 */
export function applySurfaceStyle(player: MatchPlayer, style: PlayStyle, surface: Surface): MatchPlayer {
  const deltas = SURFACE_STYLE_DELTAS[style][surface]
  const scale = (k: SkillKey): number => {
    const d = deltas[k]
    return d ? player[k] * (1 + d) : player[k]
  }
  return {
    ...player,
    serve: scale('serve'),
    ret: scale('ret'),
    composure: scale('composure'),
    stamina: scale('stamina'),
  }
}

/** How a surface reads for a style – derived from the table itself, so the UI hint can never drift
 *  from the maths. */
export function surfaceStyleAffinity(style: PlayStyle, surface: Surface): 'suits' | 'against' | 'neutral' {
  const deltas = SURFACE_STYLE_DELTAS[style][surface]
  let sum = 0
  for (const k of SKILLS) sum += deltas[k] ?? 0
  return sum > 0 ? 'suits' : sum < 0 ? 'against' : 'neutral'
}

const SURFACE_LABEL: Record<Surface, string> = { hard: 'Hard', clay: 'Clay', grass: 'Grass' }

/** Player-facing one-liner for the calendar card; null when the court is neutral for her (silence
 *  beats a line of noise). Lives here so the copy can never drift from the table. Short dash. */
export function surfaceStyleHint(style: PlayStyle, surface: Surface): string | null {
  const affinity = surfaceStyleAffinity(style, surface)
  if (affinity === 'neutral') return null
  return `${SURFACE_LABEL[surface]} – ${affinity === 'suits' ? 'suits her game' : 'not her surface'}`
}
