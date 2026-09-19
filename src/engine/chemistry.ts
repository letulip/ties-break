// CHEMISTRY – the coach relationship as a trajectory (docs/specs/the-chemistry-2026-09.md, wave C1).
//
// WHAT THIS IS FOR, in the owner's own three messages of 16.09, each of which improved on the last:
//
//   «химия между ребёнком и тренером, а не просто стиль-метч»
//   «может как-то от её темперамента исходя, кстати, у нас их 4 разных»
//   «эта самая химия может как-то нарабатываться с разной динамикой – это может стать показателем,
//    насколько ей комфортно с тренером»
//
// ⭐⭐ THE FINDING THE SPEC OPENS ON, because it changes what this module has to do. A cheap coach who
// suits her ALREADY out-develops an expensive one who does not, and has since round 2: the tier
// ladder spans 21% (0.95 -> 1.15) and the fit pill spans 50% (0.75 -> 1.25). So this module is not
// inventing a truth – it is making an existing one LEGIBLE, by turning a static pill dealt at the
// moment of hire into a TRAJECTORY earned over seasons, different for the same two people in
// different careers. That is why the effect below can be modest and still deliver what he asked for.
//
// ⚠⚠ `manner` IS NOT `style`, AND THE WHOLE DESIGN RESTS ON THE DIFFERENCE. `style` is the game he
// PLAYED; it feeds the match-day edge and `styleFitBetween`, and this file does not read it. `manner`
// is how he WORKS; it feeds development through the affinity below, and the match engine does not
// read it. Two facts, two jobs, no overlap (spec §6 fence 1).
//
// THE FOUR THINGS THIS FILE OWNS, in the order a career meets them:
//
//   1. THE MANNER      his own 2x2 – how hard he pushes (hot/cool) x what he talks to (the person /
//                      the technique). Drawn per career in `buildCoachRoster`, never persisted,
//                      because the roster is a pure derivation of the seed and stays one.
//   2. THE AFFINITY    `A` in [-1, +1], drawn ONCE per pair around the (temperament x manner) cell.
//                      The pair's disposition; it never moves. It is NOT the rate – it is the
//                      CORRIDOR the rate lives in.
//   3. THE CORRIDOR    what a year can be worth at that affinity: a ceiling, a floor, and the drift
//                      between them where the weather sits when nothing is happening.
//   4. THE PHASE       the relationship's own weather – a slow, bounded, mean-reverting walk that
//                      makes flat stretches and long good runs instead of white noise.
//
// ⚠ RNG DISCIPLINE (CLAUDE.md invariant 2, spec §6 fence 4). THREE purpose-scoped sub-streams and
// ZERO draws on MAIN:
//
//   `${seed}:chemistry:${coachId}`          the affinity, once, re-derived at every call site
//   `${seed}:chemistry:${coachId}:${week}`  the week's weather shock, re-derived at the call site
//   `${seed}:chemistry:readable:${coachId}` the pair's own readable threshold (§8d, 18.09), likewise
//
// Both are `rngFromSeed` generators built from a string and thrown away; neither persists a position
// and neither can reach the weekly MAIN stream, so the frozen capture (41550 / e6b0c709) cannot see
// this module at all. ⚠ AND INPUT-INDEPENDENCE HOLDS BY CONSTRUCTION, which is the fairness property
// rather than a convenience: the week's shock is keyed on the coach's IDENTITY and the week NUMBER,
// so it is the same number whether the player hired him, fired him or never opened the market. What
// the player's choices change is what is DONE with that number – the post-draw-multiply pattern
// `growWeek`'s own `aim[k]` documents one module over.
//
// ⚠ A LEAF, AND IT MUST STAY ONE. This file imports `ECONOMY` and the two rng helpers and nothing
// else that carries a value; `Temperament` and `SpiritBand` arrive as TYPES and the band itself is
// handed in by the caller. Nothing here reaches `world.ts`, `coach.ts` or the season, so the module
// is benchable on its own – which is what B9 and B10 actually do.

import { ECONOMY } from './economy'
import { rngFromSeed } from './rng'
import type { SpiritBand } from './spirit'
import type { Temperament } from './spirit'

// =================================================================================================
// 1. THE MANNER – a new fact about the coach, orthogonal to his style
// =================================================================================================

/** HOW HE WORKS, on his own 2x2 (spec §3a). Her four temperaments already sit on `open/private x
 *  intense/steady`; his four sit on `hot/cool x person/technique`, and the affinity table is the
 *  join of the two.
 *
 *  ⚠ NEVER SHOWN AS A LABEL BY THIS WAVE. C1 ships the mechanic; the card marker and the gauge are
 *  C3's, and the coach's seasonal sentence is the owner's copy to rule. */
export type CoachManner = 'demanding' | 'warm' | 'analytical' | 'driving'

/** All four, in the order the two axis picks below produce them. Exported so a sweep walks the set
 *  by name instead of re-listing it – `TEMPERAMENTS`' own shape one module over. */
export const COACH_MANNERS: readonly CoachManner[] = ['demanding', 'warm', 'analytical', 'driving']

/** THE PUSH AXIS, projected. How hard he leans on her – and it is the axis a pair COMPLEMENTS on:
 *  the intense girl needs the cool head beside her, the steady one needs the heat. */
export function mannerPush(manner: CoachManner): 'hot' | 'cool' {
  return manner === 'demanding' || manner === 'driving' ? 'hot' : 'cool'
}

/** THE VOICE AXIS, projected – `mannerPush`'s twin. What he actually talks to, and it is the axis a
 *  pair MATCHES on: an open girl is reached through the person, a private one through the third
 *  ball.
 *
 *  ⚠ A PROJECTION AND NEVER A SECOND TRAIT, which is `temperamentOpenness`'s own rule quoted rather
 *  than re-argued: the mapping is stated in this section's header and lives HERE, once, beside its
 *  twin, so nothing downstream grows a second spelling of the same axis. */
export function mannerVoice(manner: CoachManner): 'person' | 'technique' {
  return manner === 'demanding' || manner === 'warm' ? 'person' : 'technique'
}

/** ⭐ THE COMPOSITION – the inverse of the two projections above, and the ONE spelling of it. Two
 *  axis poles in, one of the four manners out. `temperamentFromAxes`' shape, for the same reason it
 *  exists: the roster's draw and any later reader agree by construction instead of by two authors'
 *  care. */
export function mannerFromAxes(push: 'hot' | 'cool', voice: 'person' | 'technique'): CoachManner {
  return push === 'hot'
    ? voice === 'person'
      ? 'demanding'
      : 'driving'
    : voice === 'person'
      ? 'warm'
      : 'analytical'
}

// =================================================================================================
// 2. THE AFFINITY – drawn once per pair, and it is a CORRIDOR rather than a rate
// =================================================================================================

/** ONE PAIR – her and one coach – as it is persisted (v79, `WorldState.coachPairs`).
 *
 *  ⚠ ONE KEY WITH THREE NUMBERS AND NOT THREE PARALLEL MAPS (spec §10): all three are facts about
 *  one PAIR, written on the same week by the same pass, and three maps keyed on the same id would be
 *  three chances for them to disagree about who exists. */
export interface CoachPair {
  /** the level, -100 .. +100, starting at 0 – the integral of the weekly rate while he is hired */
  chem: number
  /** the weather, -1 .. +1 – slow, bounded, mean-reverting, and the reason the level has PERIODS */
  phase: number
  /** ⚠ WRITTEN AND NEVER READ ON THIS TREE – wave C2's (spec §4, the coach grows). See
   *  `WorldState.coachPairs` for the whole of why it is here, in one key, a wave early. */
  standing: number
}

/** A FRESH PAIR – «they have started working together and nothing has happened yet». Zero is the
 *  neutral working relationship (spec §2): two professionals, and it is where every pair begins. */
export function freshCoachPair(): CoachPair {
  return { chem: 0, phase: 0, standing: 0 }
}

/** THE CELL'S CENTRE, in affinity units – the (temperament x manner) table scaled by its one knob.
 *  Pure look-up; the principle behind the table is argued at `ECONOMY.chemistry.affinityCentre` and
 *  nowhere else. */
export function affinityCentre(temperament: Temperament, manner: CoachManner): number {
  return ECONOMY.chemistry.affinityCentre[temperament][manner] * ECONOMY.chemistry.centreScale
}

/** ⭐⭐ THE PAIR'S DISPOSITION – `A` in [-1, +1], drawn ONCE and never moved (spec §3.1).
 *
 *  A TRIANGULAR draw around the cell's centre: two uniforms summed, so the middle is likelier than
 *  the ends and a corner pairing is genuinely rare rather than merely possible. The clamp at the
 *  ends is real and wanted – it is what makes «the click» and «the anti-match» reachable rather than
 *  asymptotic.
 *
 *  ⚠ PURE IN (seed, coachId, temperament, manner) AND RE-DERIVED AT EVERY CALL SITE, which is why
 *  the affinity is the half of this mechanic that needs no save key: same seed, same career, same
 *  number, to the bit. The LEVEL and the PHASE are path-dependent and are persisted (spec §10); this
 *  is not.
 *
 *  ⚠ AND THE DRAW IS KEYED ON THE COACH'S IDENTITY, NOT ON WHEN OR WHETHER HE WAS HIRED. A player
 *  who shops the market for a decade and a player who hires in week one meet the same sixteen
 *  dispositions – input-independence read literally. */
export function affinityFor(
  seed: string,
  coachId: string,
  temperament: Temperament,
  manner: CoachManner,
): number {
  const r = rngFromSeed(`${seed}:chemistry:${coachId}`)
  const tri = r() + r() - 1
  return clamp(affinityCentre(temperament, manner) + ECONOMY.chemistry.spread * tri, -1, 1)
}

// =================================================================================================
// 3. THE CORRIDOR – what a YEAR can be worth at this affinity
// =================================================================================================
//
// ⚠⚠ THE CEILING COLUMN IS THE OWNER'S AND IS NOT AN AGENT'S TO MOVE (spec §3.2): +33 a year at a
// perfect pair, +5 with SHORT ups at no match, «small and rare» at the anti-match. The FLOOR he was
// explicit about not being sure of – «вниз не уверен» – so only its two ends are quoted from him and
// its middle was fitted by the bench (B7). Both columns are `ECONOMY.chemistry`; this section is
// nothing but the interpolation between the three anchors each of them names.
//
// ⭐ TWO THINGS MOVE AS AFFINITY FALLS, NOT ONE, and that is the whole shape of his sentence: the
// dips get DEEPER and they get MORE FREQUENT. The depth is the floor column. The frequency is not a
// second knob – it falls out of the corridor's own geometry, because as `A` drops the DRIFT falls
// faster than the floor does, so a larger share of the weather's range sits below zero. A pair with
// no match is not «a slower version of a good pair»; it is a relationship that keeps almost breaking.

/** the top of the corridor at this affinity, in chemistry points a YEAR */
export function chemistryCeilingPerYear(affinity: number): number {
  const c = ECONOMY.chemistry
  return affinity >= 0
    ? lerp(c.ceilingAtNone, c.ceilingAtPerfect, affinity)
    : lerp(c.ceilingAtNone, c.ceilingAtAnti, -affinity)
}

/** ...and the bottom. Linear across the whole range: the two ends are his and the middle is the
 *  bench's, and a straight line between them is the fit B7 measured rather than a shape invented to
 *  look interesting. */
export function chemistryFloorPerYear(affinity: number): number {
  const c = ECONOMY.chemistry
  return affinity >= 0
    ? lerp(c.floorAtNone, c.floorAtPerfect, affinity)
    : lerp(c.floorAtNone, c.floorAtAnti, -affinity)
}

/** ⭐ ...AND WHERE THE WEATHER SITS WHEN NOTHING IS HAPPENING – the pair's expected annual rate.
 *
 *  ⚠⚠ THIS IS THE NUMBER THAT KEEPS «33% A YEAR» A CEILING RATHER THAN A RATE, which is the owner's
 *  own 16.09 correction of the first draft. A perfect pair drifts at `driftAtPerfect` and REACHES 33
 *  only in a year the weather ran high throughout; «за 3 года 100%» is therefore the lucky run he
 *  said it was («такое тоже возможно»), not the schedule.
 *
 *  ⚠ AND THE DRIFT AT AFFINITY 0 IS EXACTLY ZERO, WHICH IS CORNER E AND IS NOT AN ACCIDENT. The
 *  majority of careers click with nobody and repel nobody, and an ordinary pair that quietly bled to
 *  -40 over a decade would have made every median career worse than the one this game already ships.
 *  What his «чаще» buys instead is the SHAPE around that zero: the corridor below the drift is four
 *  times the corridor above it at `A = 0`, so an ordinary relationship has many small good weeks and
 *  fewer, larger bad ones, and wears very slowly rather than not at all. */
export function chemistryDriftPerYear(affinity: number): number {
  const c = ECONOMY.chemistry
  return affinity >= 0 ? lerp(0, c.driftAtPerfect, affinity) : lerp(0, c.driftAtAnti, -affinity)
}

/** ⭐⭐ THE WEEK'S RATE, in chemistry points – the corridor read at this week's weather.
 *
 *  A TWO-SIDED lerp about the drift rather than one straight line from floor to ceiling: `phase = 0`
 *  is the drift, `+1` is the ceiling, `-1` is the floor. That is what lets the corridor be
 *  ASYMMETRIC – which it must be, because his two anchors at `A = 0` are +5 up and «deeper» down,
 *  and a single lerp would have had to put the neutral point somewhere arbitrary to honour them. */
export function chemistryWeeklyRate(affinity: number, phase: number): number {
  const drift = chemistryDriftPerYear(affinity)
  const reach =
    phase >= 0
      ? (chemistryCeilingPerYear(affinity) - drift) * phase
      : (drift - chemistryFloorPerYear(affinity)) * phase
  return (drift + reach) / 52
}

// =================================================================================================
// 4. THE WEATHER – and «periods» is the load-bearing word
// =================================================================================================

/** WHAT THE WEEK DID TO THE PAIR, as facts rather than as a number – the three channels of spec
 *  §3.4. Assembled by the caller, which is the one place that can see her week; this module stays a
 *  leaf and stays benchable. */
export interface ChemistryWeek {
  /** matches she won last week (ranked only – a friendly is not a week they went through) */
  wins: number
  /** ...and lost */
  losses: number
  /** titles taken last week. On TOP of the wins that produced it. */
  titles: number
  /** her state, as the world's one reading of it (`spiritBandOf`) */
  band: SpiritBand
}

/** A WEEK WITH NOTHING IN IT – the shape a caller hands in when she did not compete. Exported so the
 *  bench and the tests spell «no events» one way. */
export function quietWeek(band: SpiritBand): ChemistryWeek {
  return { wins: 0, losses: 0, titles: 0, band }
}

/** WHAT THE THREE CHANNELS PUSH THE WEATHER BY, before the walk moves it.
 *
 *  ⭐⭐ C13, RULED 16.09 – «окей, давай слегка». The RESULTS read is lightly damped, and the reason is
 *  named rather than assumed: results also pay into §4's `standing` (wave C2, the coach grows), so a
 *  great career would otherwise compound on both axes at full weight. A fence would have deleted a
 *  true effect – winning together honestly does both things – so the second read takes a fraction of
 *  its own weight instead. HER STATE is not damped: spirit pays into no second ledger.
 *
 *  ⚠⚠ AND THE WIN AND LOSS WEIGHTS ARE EXACT MIRRORS, WHICH THE BENCH DECIDED AND NOT THE AUTHOR.
 *  `ECONOMY.chemistry.phasePerWin` carries the measurement: an asymmetric pair, plus a separate
 *  first-round-exit charge, drove the MEDIAN career to a standing phase of -0.36 over 208 weeks –
 *  a flat tax, because in a knockout sport every event but one ends in a loss. Symmetric weights make
 *  `wins - losses` the whole read, and that difference already IS the depth of the run.
 *
 *  ⚠ AND THE STATE CHANNEL IS ONE NUDGE AND NOT TWO RULES. §3.4 asks that `heavy`/`dimmed` «damp the
 *  climb AND deepen the dip»; a downward phase does exactly both, because the corridor is steeper
 *  below the drift than above it. The shape does that work, so there is no second multiplier here
 *  for a reader to keep in step with this one. */
export function chemistryEventNudge(week: ChemistryWeek): number {
  const c = ECONOMY.chemistry
  const results = week.wins * c.phasePerWin + week.losses * c.phasePerLoss + week.titles * c.phasePerTitle
  return results * c.resultsDamp + c.phasePerBand[week.band]
}

/** ⭐⭐ THE WEEK'S WEATHER – a slow, bounded, mean-reverting walk on its own sub-stream (spec §3.3).
 *
 *  ⚠⚠ THIS IS THE FUNCTION THAT SEPARATES THE DESIGN FROM RANDOM NOISE, and B9 is the bench that can
 *  say so. White noise around a mean produces a wobbly line and no story; what he described is «есть
 *  в периодах и плоские года, и взлёты и падения даже», which requires the weekly step to be
 *  AUTOCORRELATED. `phaseRevert` is the whole of that: the time constant is 1/it in weeks, so weeks
 *  near each other share a phase and seasons apart do not.
 *
 *  ⚠ ONE DRAW A WEEK, ON `${seed}:chemistry:${coachId}:${week}`, re-derived here and persisting
 *  nothing. TRIANGULAR like the affinity's, for the same reason: a middling week is likelier than an
 *  extreme one. ZERO MAIN.
 *
 *  ⚠ THE CLAMP IS THE BOUND AND IT IS DELIBERATE. A relationship at the top of its corridor cannot
 *  get better than the top of its corridor, and the walk piling against +1 for a season is exactly
 *  the long good run the design is for. */
export function nextChemistryPhase(
  phase: number,
  seed: string,
  coachId: string,
  week: number,
  events: ChemistryWeek,
): number {
  const c = ECONOMY.chemistry
  const r = rngFromSeed(`${seed}:chemistry:${coachId}:${week}`)
  const tri = r() + r() - 1
  return clamp(
    phase * (1 - c.phaseRevert) + c.phaseShock * tri + chemistryEventNudge(events),
    -1,
    1,
  )
}

/** ⭐⭐⭐ ONE WEEK OF THE RELATIONSHIP – the whole accrual, in one call, so the tick has one line and
 *  the bench measures the same arithmetic the engine runs.
 *
 *  ⚠ THE ORDER IS A DECISION: the WEATHER moves first and the level is then accrued at the rate the
 *  new weather says. `world/phaseGrowth.ts`'s `composureBonus` has the same order for the same
 *  argument – what a week bought is available to be spent on the week it is bought, rather than a
 *  week late for ever.
 *
 *  ⚠ `standing` IS CARRIED THROUGH UNTOUCHED. It is wave C2's, and this pass must not invent a value
 *  for it; a reader who finds it constant here is reading a scheduling decision. */
export function accrueChemistry(
  pair: CoachPair,
  affinity: number,
  seed: string,
  coachId: string,
  week: number,
  events: ChemistryWeek,
): CoachPair {
  const phase = nextChemistryPhase(pair.phase, seed, coachId, week, events)
  return {
    chem: clamp(pair.chem + chemistryWeeklyRate(affinity, phase), -100, 100),
    phase,
    standing: pair.standing,
  }
}

// =================================================================================================
// 5. THE READING – the one number that crosses the wire, and the one place that decides it
// =================================================================================================

/** ⭐⭐⭐ WHEN THIS PAIR BECOMES READABLE – drawn once per pair, re-derived at every read, persisting
 *  nothing (spec §8d, ruled 18.09).
 *
 *  The owner, having played the shipped single bar: «мне кажется медленно, какие-то цифры, пусть и
 *  небольшие 1-2% мы всяко может раньше видеть. Но здесь тоже можно включить вариативность.» So the
 *  threshold is no longer one number for the whole game; it is a number for this pair, inside the
 *  corridor `ECONOMY.chemistry.readableFloor .. readableCeiling`, where the whole argument for those
 *  two anchors lives.
 *
 *  ⚠ UNIFORM, AND NOT THE TRIANGULAR DRAW THE OTHER TWO USE. `affinityFor` and `nextChemistryPhase`
 *  are triangular because a middling DISPOSITION and a middling WEEK ought to be likelier than an
 *  extreme one – that is a claim about the thing being drawn. A threshold is not a thing that
 *  happens; it is the position of a line, and clustering the lines would cluster the first sightings,
 *  which is the opposite of the variability he asked for. One draw, spread flat across the corridor.
 *
 *  ⚠⚠ KEYED ON THE COACH'S IDENTITY AND NOTHING ELSE – `affinityFor`'s own rule for the same reason.
 *  The threshold is the same number whether the player hired him in week one, shopped for a decade
 *  first or never opened the market, so a choice cannot move it. ONE DRAW, ON A PURPOSE-SCOPED
 *  SUB-STREAM, ZERO MAIN: the frozen capture cannot see this function at all.
 *
 *  ⚠ THE ONE SPELLING. `chemistryReading` below is the only caller, and `coachMarket` calls that –
 *  so a second copy of this arithmetic cannot appear without deleting this sentence first. */
export function chemistryReadableAt(seed: string, coachId: string): number {
  const c = ECONOMY.chemistry
  const r = rngFromSeed(`${seed}:chemistry:readable:${coachId}`)
  return c.readableFloor + (c.readableCeiling - c.readableFloor) * r()
}

/** ⭐⭐⭐ WHAT THE CARD IS ALLOWED TO SHOW ABOUT THIS PAIR: the level, signed, or `null` while there
 *  is nothing to read (spec §8b, ruling C7; §8d for the corridor).
 *
 *  ⚠⚠ THIS FUNCTION IS THE WHOLE OF WHY THE MECHANIC WAS INVISIBLE FOR A ROUND. `coachPairs` was
 *  read in seven engine files and never crossed into `shared/protocol`, so the UI was structurally
 *  unable to render a number it could not see – the owner played a career and reported «я не увидел
 *  её в игре нигде». The fix is this one derivation plus one field on `CoachMarketRow`; the gauge is
 *  the easy half and could not have existed before it.
 *
 *  ⚠ ONE NUMBER AND NOT THREE. `phase` is the pair's WEATHER – a draw the player must not be able to
 *  read, because reading it would turn a seeded relationship into a forecast (§8's anti-shopping
 *  argument, applied to this wave's own field) – and `standing` is wave C2's, written and not yet
 *  read anywhere. Neither belongs on the wire, and a band NAME beside the level would be a second
 *  spelling of one fact for the UI to disagree with.
 *
 *  ⚠ THE SIGN IS CARRIED BY THE NUMBER ITSELF, which is what lets the gauge answer C11 and C12 out
 *  of one field: the hue family is `level < 0`, the fill is `|level| / 100`, and the figure is the
 *  level printed with its own minus.
 *
 *  ⚠ `null` COVERS BOTH SILENCES AND THE CARD DRAWS ONE GLYPH FOR THEM, because they are the same
 *  sentence: «nobody knows until you work together». She has never worked with him (no row at all),
 *  or they have worked together and nothing has come of it yet (`chemistryReadableAt`).
 *
 *  ⚠⚠ THE SIGNATURE GREW ON 18.09 AND THAT IS THE HONEST FORM OF IT. The gate is PER PAIR now, so
 *  this function needs what identifies the pair – and the pair is (career, coach), which is exactly
 *  `seed` and `coachId`. The alternatives were both worse: caching the threshold in module state
 *  would make a pure derivation stateful and order-dependent, and persisting it would be a save key
 *  spent on something re-derivable to the bit. Every caller has both values already; `coachMarket` is
 *  the only one in `src/`. */
export function chemistryReading(pair: CoachPair | undefined, seed: string, coachId: string): number | null {
  if (!pair) return null
  return Math.abs(pair.chem) >= chemistryReadableAt(seed, coachId) ? pair.chem : null
}

// --- the two helpers, once ----------------------------------------------------------------------

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
