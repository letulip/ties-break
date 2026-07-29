// THE SKILLS RADAR (docs/specs/skills-radar.md) - a contour that sharpens as she is discovered.
//
// decisions.md #11, parked since round 3: "axes without numbers; contour sharpens as coach
// confidence grows (fog-of-war stats) - radar that respects 'talent is discovered'". It waited for
// two things that did not exist then and landed this week: a coach who is a LADDER, and development
// that actually moves. `world.potential` has been holding the seat the whole time - rolled once from
// `seed:potential`, never shown, and its own comment points here.
//
// WHAT THE UI GETS, and it is the whole contract: four `RadarAxis` rows, and NOT ONE of them
// carries a true value. The screen cannot leak what it has never been given.
//
//   shownValue   the ESTIMATE. At low confidence it is deliberately wrong.
//   band         how wide that error can be. This is the fog - and it is honest: the true value is
//                ALWAYS inside [shownValue - band, shownValue + band], by construction.
//   ceilingLo/Hi the outer haze over `potential`, which narrows toward a FLOOR and stops there.
//   note         the coach's sentence for that axis, in words, or null when he has nothing to say.
//
// THREE THINGS ARE LOAD-BEARING, and each one is a named constant below:
//
//  1. CEILING_FLOOR_HALF - the haze never narrows past it. `potential` is rolled once and never
//     moves, so an outer band that tightened without limit would let a patient player read the exact
//     ceiling off the screen, and the fog would have been theatre. YOU LEARN THE RANGE, NEVER THE
//     NUMBER. The band's CENTRE is misread too (CEILING_CENTRE_DRIFT), for the same reason: a haze
//     drawn symmetrically about the truth hands the number away as its own midpoint.
//
//  2. THE ESTIMATE MUST NOT SHIMMER. The error is drawn ONCE PER CAREER PER AXIS off
//     `seed:read:<axis>` - no week in the key - so its direction is fixed and only its MAGNITUDE
//     shrinks as evidence arrives. Her coach's misreading of her backhand is consistent until
//     evidence corrects it, which is also how misreading a person actually works. A value redrawn
//     each week would breathe, and a breathing contour reads as noise rather than as uncertainty.
//
//  3. NOTHING IS PERSISTED. Confidence is DERIVED at snapshot time, exactly like `coachMarket` -
//     no schema bump, no migration, no golden save. Everything it reads is a ledger the world
//     already keeps.
//
// RNG DISCIPLINE. Zero draws on the MAIN stream: this module runs at SNAPSHOT time, never inside
// the tick, and every number it draws comes off `seed:read:<axis>` / `seed:ceil:<axis>`, created
// fresh and thrown away. The frozen MAIN capture (41550 draws / e6b0c709) cannot move by
// construction.
//
// The module is PURE: it never imports world.ts (world.ts imports it), and everything it needs
// arrives as a narrow `RadarWorldView` the engine assembles in toSnapshot - the same shape of
// dependency engine/diary.ts already has, and for the same reason.

import { rngFromSeed } from './rng'
import { SKILL_KEYS, type KidSkills, type SkillKey } from './development'
import type { CoachTier, RadarAxis, WorldMatch } from '../shared/protocol'

// --- THE KNOBS ---------------------------------------------------------------------------------

/** The widest the inner contour's error can be, in skill points, at zero confidence. Sized against
 *  the range the game actually plays in (starting builds 35-60, ceilings out to the mid-80s): at
 *  twelve points a week-1 estimate can turn her best wing into her worst, which is the intended
 *  reading of "at low confidence it is deliberately WRONG". */
export const RADAR_BAND_MAX = 12

/** ⚠ THE LOAD-BEARING CONSTANT (spec §3). The half-width the outer haze narrows to AND STOPS AT.
 *
 *  `potential` is rolled once per career and never moves. If this were 0 - or merely small - a
 *  patient player would sit on the screen until the haze collapsed and read the exact ceiling off
 *  it, and every hour of fog before that would have been theatre. Four points means the tightest
 *  the haze ever gets is an EIGHT-POINT WINDOW: enough to know whether she is a top-of-the-band
 *  talent, never enough to know the number.
 *
 *  It is the difference between "talent is discovered" and "talent is displayed after a delay". */
export const CEILING_FLOOR_HALF = 4

/** The half-width of the outer haze at zero confidence. Reached the floor at
 *  `1 - CEILING_FLOOR_HALF / CEILING_MAX_HALF` = confidence 2/3, and never narrows again. */
export const CEILING_MAX_HALF = 12

/** How far the haze's CENTRE may sit from the true ceiling, as a fraction of the current
 *  half-width. Strictly below 1, so the true potential is always inside [ceilingLo, ceilingHi] -
 *  the range is a real range and not a decoration - while the MIDPOINT is never the answer. At the
 *  floor this is 2.4 points of permanent, unresolvable offset. */
export const CEILING_CENTRE_DRIFT = 0.6

/** WHAT EACH RUNG SEES FROM THE PRACTICE COURT ALONE, before she has played anybody. The coach
 *  ladder's SECOND job (spec §1, source 1): a reason to pay that is completely independent of the
 *  development multiplier and of the ranking places the combined bench measured. An Elite coach
 *  tells you WHO SHE IS sooner. */
export const COACH_EYE: Record<CoachTier, number> = {
  self: 0.15,
  budget: 0.25,
  middle: 0.35,
  high: 0.45,
  elite: 0.55,
}

/** ...AND HOW WELL THAT RUNG CAN EVER KNOW HER. The spec's source 1 says a better coach reads a
 *  player "faster AND MORE ACCURATELY", and this is the second half of that sentence: a ceiling on
 *  confidence itself, so the rung keeps mattering after the first season instead of being overtaken
 *  by sheer match count.
 *
 *  The consequence, stated plainly because it is a design choice and not an accident: a family that
 *  never hires anybody finishes the career with a permanent ~3.4-point haze on the inner contour.
 *  They watched every match and still could not quite tell you what they were looking at. */
export const COACH_ACCURACY: Record<CoachTier, number> = {
  self: 0.72,
  budget: 0.82,
  middle: 0.89,
  high: 0.95,
  elite: 1.0,
}

/** What a coach sees in his FIRST week, as a fraction of what he will eventually see. Not zero: a
 *  good coach watching one session already has an opinion, and that is why an Elite rung shows a
 *  visibly thinner fog on a week-1 radar than the parent does. */
export const TENURE_FIRST_LOOK = 0.15

/** Weeks of working together at which the coach is HALFWAY to his full read of her (on top of the
 *  first look). Slow on purpose - "weeks together" is the trivial source and must not outrun the
 *  interesting one. */
export const TENURE_HALF_WEEKS = 30

/** The share of the REMAINING unknown one unit of match evidence removes. Saturating: the first
 *  match teaches far more than the fortieth.
 *
 *  ⚠ TUNED DOWN FROM 0.16 against the bench (tools/radar-bench.ts). At 0.16 the fog was over: an
 *  ordinary first season put every rung inside two points of the truth by week 30, and the radar was
 *  a static picture for the remaining four years of a career. At 0.07 the first season is genuinely
 *  uncertain, the second is where a well-coached girl resolves, and a self-coached one never quite
 *  does - which is the arc the spec describes. */
export const EVIDENCE_PER_UNIT = 0.07

/** A two-set match this long in games counts as a long one even without a deciding set. A best-of-3
 *  straight-setter tops out at 26 games (7-6 7-6); 22 is "they were on court a while". */
export const LONG_MATCH_GAMES = 22

/** What EVERY match teaches about a wing, before any question of whether it was tested. The rest of
 *  the unit is earned by the opponent (see `testedFraction`). */
export const TECHNICAL_BASE_UNIT = 0.3

/** The skill-point gap at which an opponent fully tests a wing (or fully fails to). A returner
 *  twelve points better than her serve examines it; one twelve points worse tells you nothing. */
export const TEST_SPAN = 12

/** Below this confidence the coach says nothing about an axis at all - `note` is null. He is not
 *  going to guess out loud. */
export const NOTE_MIN_CONFIDENCE = 0.3

/** How far a shown axis must stand above (or below) the mean of the other three before the coach
 *  will call it a weapon (or the job). A deliberately wide deadband: the notes must not flip every
 *  time a growth week nudges her over a line. */
export const NOTE_EDGE = 4

/** WHAT THE AXES ARE CALLED, and the engine owns the words for the same reason it owns
 *  `COACH_TIER_LABEL` and `TIER_SHORT`: a second copy in a screen is a second chance for two
 *  surfaces to call the same thing different things. `ret` in particular is an engine field name
 *  and must never reach a player as one. Short dash only; no numbers, ever. */
export const RADAR_AXIS_LABEL: Record<SkillKey, string> = {
  serve: 'Serve',
  ret: 'Return',
  composure: 'Composure',
  stamina: 'Stamina',
}

/** Matches she must have played before "nobody has tested that wing yet" is a thing worth saying
 *  rather than a statement of the obvious. */
export const NOTE_UNTESTED_MIN_MATCHES = 4

/** ...and how weakly her opponents must have probed a wing to license it. */
export const NOTE_UNTESTED_MAX = 0.25

// --- the view ----------------------------------------------------------------------------------

/** The narrow slice of the world the radar is allowed to read. Assembled by toSnapshot - the
 *  structural type is what keeps this module free of a world.ts import cycle. */
export interface RadarWorldView {
  seed: string
  week: number
  kidId: string
  /** her true build. Never leaves the engine. */
  skills: KidSkills
  /** her true ceiling. Never leaves the engine. */
  potential: KidSkills
  /** the rung she trains at TODAY */
  coachTier: CoachTier
  /** the week the current coaching arrangement began (career start, or the last hire/release) */
  coachSinceWeek: number
  /** every COMPETITIVE match she has ever played, from the durable season counters - see
   *  `matchesEverPlayed` in world.ts for why this and not the length of the array below. */
  matchesPlayed: number
  /** her own match records still retained in the event log, oldest first. A ROLLING WINDOW: the
   *  event feed prunes at 400 rows, so this is roughly the last year and a half of her matches. */
  matches: readonly WorldMatch[]
}

// --- reading a scoreline -----------------------------------------------------------------------

/** What a scoreline says about the AFTERNOON, not about who won it. Symmetric between the two
 *  players, so the kid's side never has to be worked out first.
 *
 *  Sibling of `matchDrain` in engine/condition.ts, which asks the same string a narrower question
 *  (how tired is she). Kept separate rather than shared: that one is pinned integer arithmetic on a
 *  hot path and needs two facts, this one needs five. */
export interface ScoreRead {
  /** sets played (2 or 3 in best-of-3) */
  sets: number
  /** total games across the match */
  games: number
  /** sets decided in a tiebreak (7-6 / 6-7) */
  tiebreaks: number
  /** sets won 7-5 - the other way a set goes to the wire */
  narrowSets: number
  /** it went to a deciding set */
  decider: boolean
}

export function readScoreline(score: string | undefined): ScoreRead {
  const sets = (score ?? '').split(' ').filter((s) => s.includes('-'))
  let games = 0
  let tiebreaks = 0
  let narrowSets = 0
  for (const s of sets) {
    const [a, b] = s.split('-').map((n) => Number.parseInt(n, 10))
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue
    games += a + b
    if ((a === 7 && b === 6) || (a === 6 && b === 7)) tiebreaks++
    else if ((a === 7 && b === 5) || (a === 5 && b === 7)) narrowSets++
  }
  return { sets: sets.length, games, tiebreaks, narrowSets, decider: sets.length >= 3 }
}

// --- what ONE match teaches, per axis ----------------------------------------------------------

/** STAMINA IS UNKNOWN UNTIL SHE HAS PLAYED A LONG MATCH (spec §1, source 3). A straight-sets win
 *  teaches NOTHING about her legs, and that is the point: it is true about her. A deciding set is
 *  the full unit; a two-setter that simply went on and on is worth most of one. */
export function staminaUnitsOf(s: ScoreRead): number {
  if (s.decider) return 1
  return s.games >= LONG_MATCH_GAMES ? 0.6 : 0
}

/** COMPOSURE IS UNKNOWN UNTIL SHE HAS PLAYED A TIGHT ONE. Nothing is learned from a comfortable
 *  afternoon. A deciding set is a third of a unit on its own, every tiebreak set the same again,
 *  and a 7-5 a little. A three-tiebreak epic saturates - there is only so much one match can prove.
 *
 *  ⚠ THE DECIDER'S SHARE WAS 0.5 AND IS 0.35, off the bench: this engine's juniors are closely
 *  matched, so a third set is the ORDINARY afternoon here (a live career runs 0.24-0.43 composure
 *  units a match) rather than the rare one the number was written for. At 0.5 the axis separated
 *  almost nothing between careers. */
export function composureUnitsOf(s: ScoreRead): number {
  if (s.sets === 0) return 0
  const u = (s.decider ? 0.35 : 0) + 0.35 * s.tiebreaks + 0.2 * s.narrowSets
  return Math.min(u, 1.2)
}

/** How thoroughly an opponent examined a wing: 0 when she was twelve points better than whatever
 *  was pointed at it, 1 when she was twelve points worse, linear between. */
export function testedFraction(oppMinusHer: number): number {
  return clamp01((oppMinusHer + TEST_SPAN) / (2 * TEST_SPAN))
}

/** SERVE AND RETURN SHARPEN WITH MATCHES GENERALLY, AND FASTER AGAINST OPPONENTS WHO TESTED THEM.
 *  Her serve is examined by the other girl's RETURN and her return by the other girl's SERVE - the
 *  cross-pairing is what makes "tested" mean something in tennis rather than in arithmetic.
 *
 *  Both builds come off the match record itself (`WorldMatch.a` / `.b`), which is who actually took
 *  the court that day - condition, surface and style already folded in. */
export function technicalUnitsOf(axis: 'serve' | 'ret', her: WorldMatch['a'], opp: WorldMatch['a']): number {
  const tested = axis === 'serve' ? testedFraction(opp.ret - her.serve) : testedFraction(opp.serve - her.ret)
  return TECHNICAL_BASE_UNIT + (1 - TECHNICAL_BASE_UNIT) * tested
}

// --- the evidence fold -------------------------------------------------------------------------

/** What her match history has shown about ONE axis. */
export interface AxisEvidence {
  /** weighted matches' worth of evidence, imputed over the whole career (see below) */
  units: number
  /** `units` turned into a 0..1 read via the saturating curve */
  level: number
  /** how hard opponents have probed this wing on average, 0..1. Only meaningful for serve/ret;
   *  0 for the two axes the scoreline speaks for. */
  tested: number
}

/** THE READ OVER `WorldMatch`, per axis - and the one place the whole design lives.
 *
 *  ⚠ WHY THE RETAINED WINDOW IS NOT COUNTED DIRECTLY. `world.events` prunes at 400 rows, so her
 *  match records are a ROLLING window of roughly the last year and a half - measured on a busy
 *  career it holds 20-40 matches and OSCILLATES rather than grows. Counting it directly would make
 *  confidence fall as often as it rises, and a contour that re-thickens on its own is precisely the
 *  shimmer the spec forbids.
 *
 *  So the two halves come from two ledgers, each used for what it is good for:
 *   - HOW MANY matches she has played comes from `matchesPlayed`, which is the season W-L counters
 *     plus the season-history rows - durable, never pruned, monotone by construction;
 *   - WHAT KIND of matches they were comes from the retained window, as a RATE per match.
 *  Matches that have fallen out of the window are then counted at the rate the surviving ones show,
 *  which is the honest imputation and keeps the total monotone in the number of matches played.
 *
 *  PRACTICE FRIENDLIES ARE NOT EVIDENCE. R11-2 already rules that a friendly is not a result her
 *  face reports on, and the same reading applies to what one teaches you about her: nothing was on
 *  the line. It also keeps this fold monotone - a friendly leaves no durable trace to impute from,
 *  so counting them would reintroduce exactly the oscillation the paragraph above removes. */
export function axisEvidence(view: RadarWorldView, axis: SkillKey): AxisEvidence {
  let sum = 0
  let tested = 0
  let seen = 0
  for (const m of view.matches) {
    const her = m.aId === view.kidId ? m.a : m.bId === view.kidId ? m.b : null
    const opp = m.aId === view.kidId ? m.b : m.bId === view.kidId ? m.a : null
    if (!her || !opp) continue
    seen++
    if (axis === 'serve' || axis === 'ret') {
      sum += technicalUnitsOf(axis, her, opp)
      tested +=
        axis === 'serve' ? testedFraction(opp.ret - her.serve) : testedFraction(opp.serve - her.ret)
    } else {
      const s = readScoreline(m.score)
      sum += axis === 'stamina' ? staminaUnitsOf(s) : composureUnitsOf(s)
    }
  }
  const meanPerMatch = seen > 0 ? sum / seen : 0
  // The window is a SAMPLE of a career that may be longer than it. Matches it no longer holds are
  // counted at the rate it does hold, so `units` can only grow as she plays.
  const units = meanPerMatch * Math.max(seen, view.matchesPlayed)
  return {
    units,
    level: 1 - Math.pow(1 - EVIDENCE_PER_UNIT, units),
    tested: seen > 0 ? tested / seen : 0,
  }
}

// --- confidence --------------------------------------------------------------------------------

/** Weeks together, as a fraction of the read they eventually buy. Saturating, and never zero -
 *  see TENURE_FIRST_LOOK. */
export function tenureRamp(weeksTogether: number): number {
  const w = Math.max(0, weeksTogether)
  return TENURE_FIRST_LOOK + (1 - TENURE_FIRST_LOOK) * (w / (w + TENURE_HALF_WEEKS))
}

/** `confidence(axis) = f(weeksWithCoach, coachTier, evidence(axis))` - the spec's own signature.
 *
 *  The two sources COMPOUND rather than add: each removes a share of what is still unknown, so a
 *  coach who has watched her for a year and a season of real matches together get further than
 *  either alone, and neither can carry the axis on its own. The rung then CAPS the result
 *  (COACH_ACCURACY) - the "more accurately" half of source 1.
 *
 *  Pure, and total over every input: 0..1 whatever is handed to it. */
export function axisConfidence(tier: CoachTier, weeksTogether: number, evidence: number): number {
  const eye = COACH_EYE[tier] * tenureRamp(weeksTogether)
  const combined = 1 - (1 - eye) * (1 - clamp01(evidence))
  return clamp01(combined * COACH_ACCURACY[tier])
}

/** The inner contour's half-width at a given confidence. Converges to ZERO - the inner contour is
 *  the one that is allowed to arrive at the truth (subject to the rung's accuracy cap). */
export function bandFor(confidence: number): number {
  return RADAR_BAND_MAX * (1 - clamp01(confidence))
}

/** ⚠ THE OUTER HAZE'S half-width, AND ITS FLOOR. Narrows with confidence and then STOPS: below
 *  `CEILING_FLOOR_HALF` it does not go, at any confidence, ever. See the constant. */
export function ceilingHalfWidth(confidence: number): number {
  return Math.max(CEILING_FLOOR_HALF, CEILING_MAX_HALF * (1 - clamp01(confidence)))
}

// --- the coach's read, in words ----------------------------------------------------------------

/** Everything a note is allowed to know about an axis. Deliberately NOT the true value: a note is
 *  licensed off what the family can SEE, so a low-confidence misread produces a confident, wrong
 *  verdict - which is the fog doing its job rather than a bug. */
export interface AxisRead {
  key: SkillKey
  confidence: number
  units: number
  tested: number
  shownValue: number
  /** shown value minus the mean of the other three SHOWN values, in points */
  shownEdge: number
  /** competitive matches she has played in her career */
  matchesPlayed: number
}

interface NoteLine {
  key: SkillKey
  text: string
  license: (r: AxisRead) => boolean
  /** ABSENCE LINES assert what has NOT happened to her ("nobody knows yet"), never what she is - so
   *  they need no read behind them and speak below the confidence floor. Every other line is a
   *  VERDICT and is silent until the family has earned one. */
  absence?: true
}

// SAME VOICE AS THE HOME COACH NOTE (HomeScreen's COACH_QUOTES): his read on her, out loud, in the
// first person plural, never a number and never a hedge he would not say to a parent's face. Player
// copy: English, short dash "-" only.
//
// "Nobody knows yet" IS A VERDICT, not an absence. The two lines the spec quotes by name live at the
// top of the composure and stamina pools, and they fire on `units === 0` regardless of confidence:
// that she has never been in a third set is a FACT about her, and the most useful thing anyone can
// say about that axis until she has been.
const NOTE_POOL: readonly NoteLine[] = [
  // --- serve ------------------------------------------------------------------------------------
  {
    key: 'serve',
    text: 'Nobody has really made her serve yet.',
    license: (r) => r.matchesPlayed >= NOTE_UNTESTED_MIN_MATCHES && r.tested < NOTE_UNTESTED_MAX,
    absence: true,
  },
  {
    key: 'serve',
    text: 'She has not met a returner who could hurt her yet.',
    license: (r) => r.matchesPlayed >= NOTE_UNTESTED_MIN_MATCHES && r.tested < NOTE_UNTESTED_MAX,
    absence: true,
  },
  {
    key: 'serve',
    text: 'Her serve is her weapon – we build the rest around it.',
    license: (r) => r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'serve',
    text: 'She holds serve in her sleep. That travels.',
    license: (r) => r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'serve',
    text: 'The serve is the job this year.',
    license: (r) => r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'serve',
    text: 'She gives away too many free points behind the second ball.',
    license: (r) => r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'serve',
    text: 'The serve is honest. It will not win her matches on its own.',
    license: (r) => Math.abs(r.shownEdge) < NOTE_EDGE,
  },
  // --- return -----------------------------------------------------------------------------------
  {
    key: 'ret',
    text: 'She has not faced a serve that troubled her yet.',
    license: (r) => r.matchesPlayed >= NOTE_UNTESTED_MIN_MATCHES && r.tested < NOTE_UNTESTED_MAX,
    absence: true,
  },
  {
    key: 'ret',
    text: 'Nobody has served her off the court yet – so we do not know.',
    license: (r) => r.matchesPlayed >= NOTE_UNTESTED_MIN_MATCHES && r.tested < NOTE_UNTESTED_MAX,
    absence: true,
  },
  {
    key: 'ret',
    text: 'She returns better than anyone her age I work with.',
    license: (r) => r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'ret',
    text: 'Every serve comes back. That is a whole career on its own.',
    license: (r) => r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'ret',
    text: 'The return is where the work is.',
    license: (r) => r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'ret',
    text: 'Big serves still push her off the court.',
    license: (r) => r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'ret',
    text: 'She gets the return in. Hurting people with it comes next.',
    license: (r) => Math.abs(r.shownEdge) < NOTE_EDGE,
  },
  // --- composure --------------------------------------------------------------------------------
  {
    key: 'composure',
    text: 'Nobody knows yet how she holds up when it is tight.',
    license: (r) => r.units === 0,
    absence: true,
  },
  {
    key: 'composure',
    text: 'She has not been in a close one yet. We will find out.',
    license: (r) => r.units === 0,
    absence: true,
  },
  {
    key: 'composure',
    text: 'Tight sets do not frighten her.',
    license: (r) => r.units > 0 && r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'composure',
    text: 'The bigger the point, the calmer she gets. You cannot teach that.',
    license: (r) => r.units > 0 && r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'composure',
    text: 'The big points still get to her.',
    license: (r) => r.units > 0 && r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'composure',
    text: 'She plays the occasion instead of the ball when it matters.',
    license: (r) => r.units > 0 && r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'composure',
    text: 'She holds her nerve most days.',
    license: (r) => r.units > 0 && Math.abs(r.shownEdge) < NOTE_EDGE,
  },
  // --- stamina ----------------------------------------------------------------------------------
  {
    key: 'stamina',
    text: 'Nobody knows yet how she holds up in a third set.',
    license: (r) => r.units === 0,
    absence: true,
  },
  {
    key: 'stamina',
    text: 'She has never been taken the distance. That is still an open question.',
    license: (r) => r.units === 0,
    absence: true,
  },
  {
    key: 'stamina',
    text: 'She is still fresh in a third set, and that is rare at her age.',
    license: (r) => r.units > 0 && r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'stamina',
    text: 'Long matches suit her. The other girl tires first.',
    license: (r) => r.units > 0 && r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'stamina',
    text: 'The legs go before the head does. We fix that in the gym.',
    license: (r) => r.units > 0 && r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'stamina',
    text: 'A third set costs her more than it should.',
    license: (r) => r.units > 0 && r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'stamina',
    text: 'She lasts. A long week still costs her.',
    license: (r) => r.units > 0 && Math.abs(r.shownEdge) < NOTE_EDGE,
  },
]

/** The coach's sentence for one axis, or null when he has nothing to say yet.
 *
 *  SILENCE IS A STATE, not a fallback: below NOTE_MIN_CONFIDENCE he does not guess out loud, and a
 *  week-1 radar therefore has two nulls (serve, return) beside the two "nobody knows yet" lines that
 *  the scoreline axes earn by their own emptiness.
 *
 *  Selected off `seed:radarnote:<axis>` - no week in the key, so the line is stable for the whole
 *  career and changes only when the LICENCE changes, i.e. when the read of her genuinely changes. */
export function axisNote(read: AxisRead, seed: string): string | null {
  const speaks = read.confidence >= NOTE_MIN_CONFIDENCE
  const licensed = NOTE_POOL.filter(
    (n) => n.key === read.key && (speaks || n.absence === true) && n.license(read),
  )
  if (licensed.length === 0) return null
  const rng = rngFromSeed(`${seed}:radarnote:${read.key}`)
  return licensed[Math.floor(rng() * licensed.length)].text
}

// --- the snapshot's radar ----------------------------------------------------------------------

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

/** THE FOUR ROWS THE UI DRAWS. Called once per snapshot; nothing here is persisted and nothing here
 *  touches the MAIN stream.
 *
 *  The order is `SKILL_KEYS`, which is the order every other surface in the engine lists her
 *  attributes in - so the radar's axes cannot end up in a different order from the coach market's
 *  uplift projection or the save's own skill block. */
export function buildRadar(view: RadarWorldView): RadarAxis[] {
  const weeksTogether = Math.max(0, view.week - view.coachSinceWeek)
  const evidence = {} as Record<SkillKey, AxisEvidence>
  const confidence = {} as Record<SkillKey, number>
  const shown = {} as Record<SkillKey, number>
  const band = {} as Record<SkillKey, number>

  for (const key of SKILL_KEYS) {
    evidence[key] = axisEvidence(view, key)
    confidence[key] = axisConfidence(view.coachTier, weeksTogether, evidence[key].level)
    band[key] = bandFor(confidence[key])
    // ⚠ ONE DRAW PER CAREER PER AXIS - no week in the key. The DIRECTION of the misreading is fixed
    // for the whole career and only its magnitude shrinks, so the contour converges instead of
    // breathing. Clamping can only ever move the estimate TOWARDS her true value (which is itself
    // inside 0..100), so the honesty invariant below survives it.
    const u = rngFromSeed(`${view.seed}:read:${key}`)()
    shown[key] = clamp(view.skills[key] + (2 * u - 1) * band[key], 0, 100)
  }

  const shownTotal = SKILL_KEYS.reduce((sum, k) => sum + shown[k], 0)

  return SKILL_KEYS.map((key) => {
    // The haze's own misreading, on its own sub-stream: without it the midpoint of [lo, hi] would BE
    // the ceiling, and the floor width would have protected nothing.
    const half = ceilingHalfWidth(confidence[key])
    const v = rngFromSeed(`${view.seed}:ceil:${key}`)()
    const centre = view.potential[key] + (2 * v - 1) * CEILING_CENTRE_DRIFT * half
    // `ceilingHi >= potential` holds by construction (|centre - potential| < half), so the range
    // always CONTAINS the truth. The low edge is additionally never drawn below the inner contour -
    // a ceiling under where she already stands is incoherent, and the screen would draw the haze
    // inside the shape it is supposed to enclose.
    const hi = clamp(Math.max(centre + half, shown[key]), 0, 100)
    const lo = clamp(centre - half, shown[key], hi)
    const others = (shownTotal - shown[key]) / (SKILL_KEYS.length - 1)
    return {
      key,
      shownValue: shown[key],
      band: band[key],
      ceilingLo: lo,
      ceilingHi: hi,
      note: axisNote(
        {
          key,
          confidence: confidence[key],
          units: evidence[key].units,
          tested: evidence[key].tested,
          shownValue: shown[key],
          shownEdge: shown[key] - others,
          matchesPlayed: view.matchesPlayed,
        },
        view.seed,
      ),
    }
  })
}

/** The per-axis confidence behind a radar, for the bench and the tests. Deliberately NOT on the
 *  snapshot: the UI is told how wide the fog is (`band`), which is the same fact in the units the
 *  screen actually draws in, and one number cannot then disagree with the other. */
export function radarConfidence(view: RadarWorldView): Record<SkillKey, number> {
  const weeksTogether = Math.max(0, view.week - view.coachSinceWeek)
  const out = {} as Record<SkillKey, number>
  for (const key of SKILL_KEYS) {
    out[key] = axisConfidence(view.coachTier, weeksTogether, axisEvidence(view, key).level)
  }
  return out
}
