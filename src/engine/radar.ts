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
  groundstrokes: 'Groundstrokes',
}

/** Matches she must have played before "nobody has tested that wing yet" is a thing worth saying
 *  rather than a statement of the obvious. */
export const NOTE_UNTESTED_MIN_MATCHES = 4

/** ...and how weakly her opponents must have probed a wing to license it. */
export const NOTE_UNTESTED_MAX = 0.25

// --- WHAT MOVED THIS WEEK, AND THE KNOBS THAT KEEP IT HONEST ------------------------------------
//
// THE WEEKLY STORY'S TRAINING CARD (screen D). The design lists her skill gains for the week -
// "Fitness +6%, Backhand +2%, Serve +8%" - and this game may not draw that card, for a reason that
// is bigger than the card: PER-WEEK SKILL DELTAS MUST NOT REACH THE UI. Handed one every week, a
// player sums them from week one and reconstructs her exact current build, and every constant above
// this line becomes decoration. The owner's ruling, 29.07: «Правильная версия карточки - та же
// читка в тумане» / «если не сложно туманную - сделайте». So the card says WHAT MOVED and never BY
// HOW MUCH, and the reading lives HERE, beside the model that owns the truth, because it needs the
// same three things the contour needs: her build, her ceiling, and how sure anybody can be.
//
// THREE RULES, and they are the whole design.
//
//  1. IT IS FOGGED, NOT ROUNDED. The question is never "the number, vaguely" - it is CAN ANYONE
//     TELL YET. So movement is measured in FOG WIDTHS (`bandFor`), not in points: at a band of
//     twelve she must gain a great deal before anyone may honestly claim to see it, and while he
//     does not know her ON THE WHOLE - the MEAN of the four wings, not his best-read one - the card
//     says exactly that, out loud, week after week. A confident read on an axis nobody has evidence
//     for is the same leak in nicer words.
//
//  2. IT IS NOT A NUMERIC SIDE-CHANNEL. A card that spoke every week the serve moved by ANY amount
//     would hand over the SIGN of every weekly delta, and a patient player integrates that. Four
//     things stop it being that, and all four are needed:
//       - THE UNIT IS THE STRETCH, NOT THE WEEK. Nothing is said until cumulative movement crosses
//         a notch, and most weeks nothing has. A live career crosses roughly fifteen notches in
//         five years, against two hundred and sixty weeks.
//       - THE EARLY ONES ARE NEVER REPORTED. Below TRAINING_MIN_CONFIDENCE the card says nobody can
//         tell, so the biggest crossings of all - a fourteen-year-old's, when she improves fastest
//         and is understood least - are silently missing from any count anyone tries to keep.
//       - A SIXTH OF THE REST ARE NEVER MENTIONED EITHER (TRAINING_MENTION_CHANCE), drawn once per
//         notch. So the crossings a player DOES see are a subset with gaps of unknown size. This is
//         the weakest of the four legs and the constant says why.
//       - AND THE NOTCH'S WIDTH IS DENOMINATED IN THE FOG, which lifts for reasons that have
//         nothing to do with how much she gained: matches played, weeks with the man, his rung.
//     What reaches the player is a subset of crossings, of moving width, with unknown gaps. That
//     does not integrate to a number, and it was never going to.
//
//  3. THE VOICE IS THE ONE UPSTAIRS. Same coach, same room, same sentences as NOTE_POOL and Home's
//     COACH_QUOTES: short, plain, present tense, never a digit and never an arrow with a value.
//
// AND IT PERSISTS NOTHING, like everything else in this module. "How much has she gained" needs
// where she STARTED, which is stored nowhere and does not have to be: `startingSkills(seed)` in
// world.ts is a pure function of the seed, and `growWeek` is the ONLY thing in the whole engine that
// ever moves `world.skills`. So `skills - startSkills` IS her career's development, derivable at
// snapshot time off state that already exists. No schema bump, no migration, no golden save.

/** ⚠ DELIBERATELY ABOVE `NOTE_MIN_CONFIDENCE` (0.3), and the gap is the point. "Her serve is her
 *  weapon" is a CHARACTERISATION - a coach forms one from a few sessions and is allowed to be
 *  wrong. "It has come on these last weeks" is a claim to have measured her TWICE and compared, and
 *  that is a stronger thing to assert. Below this the card says nobody can tell yet, which is both
 *  true and the only honest sentence available.
 *
 *  It is also what makes the coach ladder show up on this card: measured on a live career, a
 *  self-coached family clears this on the serve around week twenty and on composure never, while an
 *  Elite rung is reading three wings before the first season is out. */
export const TRAINING_MIN_CONFIDENCE = 0.55

/** The narrowest fog movement is ever measured against, in skill points. Sibling of
 *  CEILING_FLOOR_HALF and there for a related reason: without it, a fully-discovered girl (an Elite
 *  rung converges to a band of zero) would divide by nothing and the coach would remark on every
 *  hundredth she gained - which is a per-week delta channel wearing a sentence. At three points the
 *  tightest a notch ever gets is three points of real improvement, which is a thing a person can
 *  actually see happen to a tennis player. */
export const TRAINING_FOG_FLOOR = 3

/** How many fog widths of cumulative movement make one notch. One: a gain the size of the whole
 *  error bar on that axis is the smallest movement anybody can claim to have SEEN rather than
 *  guessed at. */
export const TRAINING_STEP = 1

/** The share of notches he ever mentions at all, drawn once per notch off `seed:trainstep:*`. Not
 *  one, and that is rule 2's third leg: a player who counts the remarks is counting a SAMPLE, with
 *  gaps he cannot see. It is also true to life - a coach does not comment on every improvement he
 *  notices.
 *
 *  ⚠ WHY NOT LOWER, measured rather than assumed. It was 0.7, which silences a notch nearly a third
 *  of the time; with only two or three wings eligible that stacks, and eight careers per rung showed
 *  stretches of a YEAR with nothing said. This leg is also the weakest of the four - an adversary
 *  reading the TIER of the sentence ("starting to show" / "has come on" / "unrecognisable") already
 *  learns which bracket the notch is in without counting anything, so a coin that hides whole
 *  crossings buys less than it costs. Legs one, two and four are structural and carry the argument;
 *  this one only has to stop a naive tally, and a sixth of them missing does that. */
export const TRAINING_MENTION_CHANCE = 0.85

/** ...and on a week when ANYTHING is standing, the chance he says something rather than getting on
 *  with the session. The card should be quiet most weeks: a notch stands for thirty to fifty weeks
 *  on a live career, so this makes each one a remark passed two or three times over a stretch
 *  rather than a status line that is always on.
 *
 *  ⚠ ONE COIN FOR THE WEEK, NOT ONE PER WING, and it was the other way round until a playtest.
 *  Per-wing coins make the rate scale with how many wings happen to be eligible, and that swings
 *  between famine and feast for reasons the player cannot see: a measured career ran four wings
 *  eligible one season and one the next, which at six percent each is a line every four cards and
 *  then a line every seventeen. One live window went twenty-nine cards without a word. Deciding
 *  FIRST whether he speaks and only THEN which wing holds the rhythm steady wherever she is. */
export const TRAINING_SAY_CHANCE = 0.14

/** How long the "nobody can tell yet" line holds its wording before rotating to the next one.
 *
 *  Home's coach note has used exactly this idiom since round 7 - `Math.floor(week / 4) % 5` - for
 *  exactly this reason, and the owner settled it there: a coach's read on the kid should SETTLE for
 *  a while, not flip every week. Four weeks of the same sentence reads as a standing state; nine of
 *  them in a row, which is what a fourteen-year-old's first season actually produces, reads as a
 *  broken card. */
export const TRAINING_FOG_ROTATE_WEEKS = 4

/** How far a notch must be past the first before the claim escalates from "starting to show" to
 *  "has come on", and again to "unrecognisable". */
export const TRAINING_TIER_CLEAR = 2
export const TRAINING_TIER_DEEP = 4

// --- the view ----------------------------------------------------------------------------------

/** The narrow slice of the world the radar is allowed to read. Assembled by toSnapshot - the
 *  structural type is what keeps this module free of a world.ts import cycle. */
export interface RadarWorldView {
  seed: string
  week: number
  kidId: string
  /** her true build. Never leaves the engine. */
  skills: KidSkills
  /** THE BUILD SHE WAS BORN WITH - `startingSkills(seed)`, a pure function of the seed and stored
   *  nowhere. `skills - startSkills` is her whole career's development, which is what the Weekly
   *  Story's Training card reads (see `buildTrainingRead`). Never leaves the engine either: the
   *  difference is turned into a sentence here and the sentence is all the UI is given. */
  startSkills: KidSkills
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

/** THE THREE TECHNICAL WINGS, and which of the other girl's shots examines each (v25).
 *
 *  Serve and return are CROSS-paired: her serve is examined by the other girl's return and her return
 *  by the other girl's serve. The groundstroke is SELF-paired - hers are examined by groundstrokes as
 *  good as hers - because a baseline exchange is a MUTUAL examination, which is true of tennis and is
 *  a genuinely different question from the other four axes' (see docs/specs/skills-radar.md §5.4).
 *
 *  This is why the whole family shares one function: "was the wing tested" is one idea with three
 *  pairings, and a second copy of the saturating curve would be a second chance for one axis's fog to
 *  behave unlike the others'. */
const TESTED_BY: Record<TechnicalAxis, TechnicalAxis> = {
  serve: 'ret',
  ret: 'serve',
  groundstrokes: 'groundstrokes',
}

export type TechnicalAxis = 'serve' | 'ret' | 'groundstrokes'

/** SERVE, RETURN AND GROUNDSTROKES SHARPEN WITH MATCHES GENERALLY, AND FASTER AGAINST OPPONENTS WHO
 *  TESTED THEM. The cross- and self-pairings are `TESTED_BY` above.
 *
 *  Both builds come off the match record itself (`WorldMatch.a` / `.b`), which is who actually took
 *  the court that day - condition, surface and style already folded in. */
export function technicalUnitsOf(axis: TechnicalAxis, her: WorldMatch['a'], opp: WorldMatch['a']): number {
  return TECHNICAL_BASE_UNIT + (1 - TECHNICAL_BASE_UNIT) * testedOf(axis, her, opp)
}

/** How hard the other girl probed ONE technical wing. `null` when the record cannot say, which is a
 *  real state and not a defensive shrug - see `axisEvidence`. */
function testedOf(axis: TechnicalAxis, her: WorldMatch['a'], opp: WorldMatch['a']): number {
  return testedFraction(opp[TESTED_BY[axis]] - her[axis])
}

/** ⚠ CAN THIS RECORD SPEAK ABOUT THIS AXIS AT ALL. Pre-v25 match snapshots carry no `groundstrokes`
 *  - `WorldMatch.a/.b` are `MatchPlayer` blobs frozen at match time, so a career running since v24
 *  has a rolling window of matches where the field is simply absent.
 *
 *  A MISSING VALUE MUST COUNT FOR NOTHING, NOT FOR ZERO. Read as 0 it would say she was out-hit by
 *  every opponent she ever played, which is a confident false claim rather than an absence of one.
 *  Excluding the record from `seen` as well as from the sum keeps the per-match RATE honest, so the
 *  imputation over `matchesPlayed` is not diluted either: a migrated career opens at maximum fog on
 *  the new axis, hears the coach say so, and sharpens from her next real match onward. */
function recordSpeaksOf(axis: SkillKey, her: WorldMatch['a'], opp: WorldMatch['a']): boolean {
  if (axis !== 'groundstrokes') return true
  return Number.isFinite(her.groundstrokes) && Number.isFinite(opp.groundstrokes)
}

// --- the evidence fold -------------------------------------------------------------------------

/** What her match history has shown about ONE axis. */
export interface AxisEvidence {
  /** weighted matches' worth of evidence, imputed over the whole career (see below) */
  units: number
  /** `units` turned into a 0..1 read via the saturating curve */
  level: number
  /** how hard opponents have probed this wing on average, 0..1. Only meaningful for the three
   *  TECHNICAL axes (serve / ret / groundstrokes); 0 for the two the scoreline speaks for. */
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
  /** every match of HERS in the window, whether or not it can speak about THIS axis */
  let heard = 0
  for (const m of view.matches) {
    const her = m.aId === view.kidId ? m.a : m.bId === view.kidId ? m.b : null
    const opp = m.aId === view.kidId ? m.b : m.bId === view.kidId ? m.a : null
    if (!her || !opp) continue
    heard++
    if (!recordSpeaksOf(axis, her, opp)) continue
    seen++
    if (axis === 'serve' || axis === 'ret' || axis === 'groundstrokes') {
      sum += technicalUnitsOf(axis, her, opp)
      tested += testedOf(axis, her, opp)
    } else {
      const s = readScoreline(m.score)
      sum += axis === 'stamina' ? staminaUnitsOf(s) : composureUnitsOf(s)
    }
  }
  const meanPerMatch = seen > 0 ? sum / seen : 0
  // The window is a SAMPLE of a career that may be longer than it. Matches it no longer holds are
  // counted at the rate it does hold, so `units` can only grow as she plays.
  //
  // ⚠ ...AND THE IMPUTATION IS SCALED BY HOW MUCH OF THE WINDOW CAN ACTUALLY SPEAK (v25). This is 1
  // for every axis except a freshly migrated `groundstrokes`, so for the original four and for any
  // career born at v25 the line below is byte-identical to the one it replaces.
  //
  // WHY IT IS NEEDED, and it is a real hole rather than a defensive flourish: without it, the FIRST
  // v25 match of a migrated career measures a rate over ONE record and then imputes it across sixty
  // matches she played before the attribute existed. Measured, that jumps the new axis from maximum
  // fog to near-certainty in a single week - a contour that snaps into focus, which is the same sin
  // as one that shimmers. Scaling by the speaking share instead lets the axis sharpen roughly as fast
  // as her recent history turns over: one speaking record in thirty is worth one match's imputation,
  // not sixty's, and by the time the window is all v25 she has her whole career's credit back.
  //
  // Monotone, which the fold's whole design depends on: pruning takes the OLDEST rows first, so the
  // non-speaking share can only fall, and `matchesPlayed` only rises.
  const speaks = heard > 0 ? seen / heard : 1
  const units = meanPerMatch * Math.max(seen, view.matchesPlayed * speaks)
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
  // --- groundstrokes (v25) ----------------------------------------------------------------------
  // The absence lines are licensed the way serve's and return's are - off `tested`, not off `units` -
  // because every match contains rallies, so "she has not been tested" is a claim about the OPPONENTS
  // she has met and not about whether she has rallied at all. That is the difference between this axis
  // and the two the scoreline speaks for, where the absence really is "it has never happened".
  {
    key: 'groundstrokes',
    text: 'Nobody has out-hit her yet. We do not know what she has.',
    license: (r) => r.matchesPlayed >= NOTE_UNTESTED_MIN_MATCHES && r.tested < NOTE_UNTESTED_MAX,
    absence: true,
  },
  {
    key: 'groundstrokes',
    text: 'She has not met a girl who could hurt her from the back.',
    license: (r) => r.matchesPlayed >= NOTE_UNTESTED_MIN_MATCHES && r.tested < NOTE_UNTESTED_MAX,
    absence: true,
  },
  {
    key: 'groundstrokes',
    text: 'She hits through people. That ends points on its own.',
    license: (r) => r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'groundstrokes',
    text: 'The forehand is a shot other girls are afraid of.',
    license: (r) => r.shownEdge >= NOTE_EDGE,
  },
  {
    key: 'groundstrokes',
    text: 'She cannot hurt anybody off the ground yet.',
    license: (r) => r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'groundstrokes',
    text: 'The rally is where she loses matches. That is the work.',
    license: (r) => r.shownEdge <= -NOTE_EDGE,
  },
  {
    key: 'groundstrokes',
    text: 'She holds the rally. Winning it is the next thing.',
    license: (r) => Math.abs(r.shownEdge) < NOTE_EDGE,
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

/** WHAT HER RECORD SHOWS, per axis, and how sure that makes anybody - the fold BOTH surfaces stand
 *  on, done once.
 *
 *  ⚠ IT IS A PARAMETER OF `buildRadar` AND `buildTrainingRead` RATHER THAN A THIRD CALL INSIDE EACH,
 *  and that is the only reason it is public. `axisEvidence` walks the whole retained match window
 *  four times over; before this was hoisted, adding the training read to the snapshot walked it a
 *  second four times for the same girl in the same week. Callers with one view and two questions
 *  (i.e. `toSnapshot`) pass this in; anyone with one question can leave it out. */
export function axisReadings(view: RadarWorldView): Record<SkillKey, { evidence: AxisEvidence; confidence: number }> {
  const weeksTogether = Math.max(0, view.week - view.coachSinceWeek)
  const out = {} as Record<SkillKey, { evidence: AxisEvidence; confidence: number }>
  for (const key of SKILL_KEYS) {
    const evidence = axisEvidence(view, key)
    out[key] = { evidence, confidence: axisConfidence(view.coachTier, weeksTogether, evidence.level) }
  }
  return out
}

/** THE FOUR ROWS THE UI DRAWS. Called once per snapshot; nothing here is persisted and nothing here
 *  touches the MAIN stream.
 *
 *  The order is `SKILL_KEYS`, which is the order every other surface in the engine lists her
 *  attributes in - so the radar's axes cannot end up in a different order from the coach market's
 *  uplift projection or the save's own skill block. */
/**
 * WHAT THE COACH THINKS ONE SKILL IS - her true value, displaced by his rung's haze.
 *
 * ⚠ ONE DRAW PER CAREER PER AXIS - no week in the key. The DIRECTION of the misreading is fixed for the
 * whole career and only its MAGNITUDE shrinks, so the contour converges instead of breathing. Clamping
 * can only ever move the estimate TOWARDS her true value (which is itself inside 0..100), so
 * `buildRadar`'s honesty invariant survives it.
 *
 * EXTRACTED FROM `buildRadar` BY THE LOAD SLICE (docs/specs/coach-as-load-manager.md §8), which needs
 * exactly one axis at knock time and must not spell this a second way. If the coach's belief about her
 * stamina were computed by its own formula, the number he acts on and the number the radar draws could
 * drift - and the whole point of §8 is that they are the SAME belief. Cheap enough to call alone: it is
 * one hash and one multiply once the band is known.
 */
export function shownSkill(view: RadarWorldView, key: SkillKey, confidence: number): number {
  const u = rngFromSeed(`${view.seed}:read:${key}`)()
  return clamp(view.skills[key] + (2 * u - 1) * bandFor(confidence), 0, 100)
}

export function buildRadar(view: RadarWorldView, readings: ReturnType<typeof axisReadings> = axisReadings(view)): RadarAxis[] {
  const evidence = {} as Record<SkillKey, AxisEvidence>
  const confidence = {} as Record<SkillKey, number>
  const shown = {} as Record<SkillKey, number>
  const band = {} as Record<SkillKey, number>

  for (const key of SKILL_KEYS) {
    evidence[key] = readings[key].evidence
    confidence[key] = readings[key].confidence
    band[key] = bandFor(confidence[key])
    shown[key] = shownSkill(view, key, confidence[key])
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

// --- WHAT MOVED THIS WEEK, IN WORDS -------------------------------------------------------------
// The reading itself. See the block above TRAINING_MIN_CONFIDENCE for why it is shaped this way.

/** THE WEEKLY STORY'S TRAINING LINE, or null on a week with nothing to say - which is most weeks,
 *  and is the point. Carries NOT ONE NUMBER: the card is handed a wing and a sentence, and the
 *  amount she moved by stays in the engine with everything else that is true. */
export interface TrainingRead {
  /** the wing the line is about, or null when the line is about the FOG rather than about her */
  key: SkillKey | null
  /** `RADAR_AXIS_LABEL[key]` - the engine's own word for that wing, so `ret` can never reach a
   *  player as "Ret". Null on a fog line, which is about no wing in particular. */
  label: string | null
  /** the coach's sentence. Words only, no digits, ever. */
  text: string
}

/** How loud the claim is allowed to be, by how far the movement has got. */
type MoveTier = 'early' | 'clear' | 'deep'

function moveTierOf(step: number): MoveTier {
  if (step >= TRAINING_TIER_DEEP) return 'deep'
  if (step >= TRAINING_TIER_CLEAR) return 'clear'
  return 'early'
}

// SAME VOICE AS `NOTE_POOL` ABOVE and as Home's COACH_QUOTES - one coach, three surfaces. Every
// line is a claim about MOVEMENT and nothing else: not how good the wing is (the radar's own note
// says that), not how much it moved by (nobody gets that), just that it has come along and roughly
// how far. Player copy: English, short dash only, and SHORT - this renders in a half-width tile on
// a 390px frame, so anything past about forty-five characters wraps to a third line.
const MOVE_POOL: Record<SkillKey, Record<MoveTier, readonly string[]>> = {
  serve: {
    early: [
      'The serve work is starting to show.',
      'Something has changed on that serve.',
      'The serve is beginning to look like a shot.',
    ],
    clear: [
      'The serve has come on. People notice it.',
      'She wins free points she never used to.',
      'That serve has moved on a long way.',
    ],
    deep: [
      'The serve is not the one she arrived with.',
      'Her old serve would be unrecognisable now.',
      'The serve is a real weapon. That is the work.',
    ],
  },
  ret: {
    early: [
      'The return is starting to look different.',
      'She is meeting the ball earlier now.',
      'The return work is beginning to show.',
    ],
    clear: [
      'The return has come on a long way.',
      'She hurts people with the return now.',
      'Big serves do not push her back like they did.',
    ],
    deep: [
      'The return is a different shot entirely.',
      'She takes the serve early now. All of it work.',
      'Nothing gets past her the way it once did.',
    ],
  },
  composure: {
    early: [
      'She is steadier in the tight games.',
      'The head is quieter than it was.',
      'She is starting to hold on in close ones.',
    ],
    clear: [
      'The big points do not shake her now.',
      'She has grown up out there.',
      'Nothing rattles her the way it used to.',
    ],
    deep: [
      'She is the calmest girl on the court now.',
      'The pressure does not touch her any more.',
      'You would not know she was ever nervous.',
    ],
  },
  stamina: {
    early: [
      'She is fresher late in matches.',
      'The legs are holding up better.',
      'The gym work is starting to tell.',
    ],
    clear: [
      'A third set does not frighten her now.',
      'She finishes stronger than she starts.',
      'The legs have come on a long way.',
    ],
    deep: [
      'She can go all afternoon now.',
      'Nobody outlasts her any more.',
      'The other girl breaks first these days.',
    ],
  },
  groundstrokes: {
    early: [
      'There is more on the ball than there was.',
      'The forehand is starting to bite.',
      'She is standing up to the rally better.',
    ],
    clear: [
      'She hits through girls she used to rally with.',
      'The ball comes off her strings differently.',
      'She ends points off the ground now.',
    ],
    deep: [
      'Nobody wants a rally with her any more.',
      'The forehand has become the whole match.',
      'She hits like a girl three years older.',
    ],
  },
}

/** WHAT HE SAYS WHILE HE CANNOT READ HER AT ALL - rule 1, and the honest state of a fourteen-year-old
 *  with a coach who met her last month. It is a statement about the FOG and not about her, so it
 *  carries no information whatever about what moved, which is exactly why it is safe to show every
 *  single week. It ROTATES on a four-week block (see TRAINING_FOG_ROTATE_WEEKS) from an offset drawn
 *  per coaching arrangement, so a new man says it his own way and nobody reads the same sentence
 *  nine weeks running. */
const FOG_POOL: readonly string[] = [
  'Too early to tell what the work is doing.',
  'She puts the hours in. Nobody can read it yet.',
  'We are still learning what we have here.',
  'The work goes in. What it is worth, nobody knows.',
  'Give it a season. There is nothing to read yet.',
]

/** THE TRAINING CARD'S LINE for one week, or null for a quiet one.
 *
 *  Pure, and every draw is on a purpose-scoped sub-stream created fresh and thrown away - like the
 *  rest of the module, it runs at SNAPSHOT time and cannot move the frozen MAIN capture.
 *
 *  ⚠ THE STEP IS NOT MONOTONE, AND THAT IS WANTED. `gained` only ever grows (before the decline
 *  years), but the band it is divided by JUMPS WIDER when she changes coach, so a notch she had
 *  passed can be un-passed and crossed again later. That is the right behaviour and not a bug: the
 *  new man has not seen what the old one saw, and he has to watch her improve for himself before he
 *  will say it happened. It also costs a would-be integrator another unknown.
 *
 *  ⚠ NOTHING IS SAID ABOUT DECLINE. Past the peak `gained` falls and `step` goes to zero, so the
 *  card simply goes quiet on a veteran instead of narrating her losing it. The adult tour
 *  (docs/specs/adult-tour-and-endings.md) is where that would be worth writing, with its own pool
 *  and its own licence; it is deliberately not smuggled in here. */
export function buildTrainingRead(
  view: RadarWorldView,
  readings: ReturnType<typeof axisReadings> = axisReadings(view),
): TrainingRead | null {
  const standing: { key: SkillKey; step: number }[] = []
  let readable = 0

  for (const key of SKILL_KEYS) {
    const confidence = readings[key].confidence
    // ⚠ THE MEAN, NOT THE MAXIMUM, and it was the maximum until a playtest. "He can read her" is a
    // statement about the GIRL, not about her best-understood wing: keyed on the max, one early
    // reading of her serve switched the "nobody can tell yet" line off while three wings were still
    // strangers, and the card then went blank for the fifty-odd cards before anything had moved a
    // whole fog-width. Measured on eight careers a rung, that was the single longest silence the
    // card produced, and it sat right at the start of the game.
    readable += confidence / SKILL_KEYS.length
    // Rule 1: he does not remark on movement he cannot see. This gate runs BEFORE anything is
    // computed from her true build, so a wing under the floor contributes nothing at all - not a
    // sentence, not a silence anybody could read a sign off.
    if (confidence < TRAINING_MIN_CONFIDENCE) continue
    const gained = view.skills[key] - view.startSkills[key]
    const step = Math.floor(gained / Math.max(bandFor(confidence), TRAINING_FOG_FLOOR) / TRAINING_STEP)
    if (step < 1) continue
    // ...and a fifth of the notches he never mentions at all. One draw per notch, no week in the
    // key, so a notch he keeps quiet about stays quiet for as long as she stands on it.
    if (rngFromSeed(`${view.seed}:trainstep:${key}:${step}`)() >= TRAINING_MENTION_CHANCE) continue
    standing.push({ key, step })
  }

  // DOES HE SAY ANYTHING THIS WEEK, and only then WHICH WING - both off one stream, because they
  // are one decision. Taking them in this order is what keeps the rhythm independent of how many
  // wings happen to be eligible (see TRAINING_SAY_CHANCE), and picking among them rather than always
  // taking the furthest-travelled one is what stops a single wing owning the card for a season.
  const say = rngFromSeed(`${view.seed}:trainsay:${view.week}`)
  if (standing.length > 0 && say() < TRAINING_SAY_CHANCE) {
    const best = standing[Math.floor(say() * standing.length)]
    const pool = MOVE_POOL[best.key][moveTierOf(best.step)]
    // ⚠ THE WEEK IS IN THIS KEY, unlike `axisNote`'s, and the two rules are different on purpose.
    // The radar's note is a STANDING VERDICT printed beside an axis, and a verdict that reworded
    // itself weekly would read as noise. This is a man SAYING something on a particular Sunday: the
    // claim is fixed by the notch, but the words he puts it in are his own that day. Varying them
    // leaks nothing - the key holds no fact about her - and it is the difference between a coach and
    // a label that keeps reappearing.
    const rng = rngFromSeed(`${view.seed}:trainline:${best.key}:${best.step}:${view.week}`)
    return {
      key: best.key,
      label: RADAR_AXIS_LABEL[best.key],
      text: pool[Math.floor(rng() * pool.length)],
    }
  }

  // He knows her, on the whole, and nothing has anything worth saying this week. Silence, and the
  // card falls back to what it has always shown: the plan and the seven days.
  if (readable >= TRAINING_MIN_CONFIDENCE) return null

  // ONE DRAW PER COACHING ARRANGEMENT picks where in the pool this man starts; the block index then
  // STEPS through it, so consecutive blocks can never repeat a sentence and the whole pool is seen.
  // (A second draw per block would repeat one time in five, which is the thing this is here to fix.)
  const offset = Math.floor(rngFromSeed(`${view.seed}:trainfog:${view.coachSinceWeek}`)() * FOG_POOL.length)
  const block = Math.floor(view.week / TRAINING_FOG_ROTATE_WEEKS)
  return { key: null, label: null, text: FOG_POOL[(offset + block) % FOG_POOL.length] }
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
