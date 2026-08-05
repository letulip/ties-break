// THE FIELD TIER, PHASE W – the professional population behind the W tables (01.08, the owner:
// «Население - это критично»). docs/specs/living-field.md §3 names three rings; this module is the
// FIELD ring's first landing, scoped to the W track only.
//
// WHY IT EXISTS, measured before a line was written: the game holds ONE population of 199 juniors
// serving three ranking tables, so a W15 – the entry rung of the WOMEN'S PROFESSIONAL TOUR – drew
// its field by percentile band over a MIXED-currency table. The median W15 entrant sat at position
// ~53/200 with mean core skill 50.2, WEAKER than a J300 field (median position 20, skill 53.9).
// The owner's ITF-#6 girl won five W15 titles in a row losing one match total (26-1). A real W15
// is full of hungry professionals aged 17-30; ours was full of resting fourteen-year-olds.
//
// THE DESIGN, in one sentence: ~300 professional players exist for the W track, DERIVED and NEVER
// PERSISTED – a pure function of (worldSeed, seasonIndex) – holding virtual W-table points so the
// merged W standings interleave them honestly with the LIVE players' earned rows.
//
// =================================================================================================
// ⚠ THE INVARIANT THIS MODULE IS BUILT AROUND: the frozen MAIN capture (41550 draws / e6b0c709)
// CANNOT move, BY CONSTRUCTION rather than by care.
// =================================================================================================
//
// Every number here comes off `rngFromSeed(`${seed}:field:${seasonIndex}:<n>`)` – a fresh,
// purpose-scoped generator per player, created, read in a fixed order and thrown away. Not one draw
// is taken from any stream the tick walks: not the MAIN weekly stream (base costs + driftCohort's
// 4×199 and nothing else), not `seed:aitour:`, not `seed:kidtour:`. Field pros are not in
// `world.cohort`, so `driftCohort` never sees them (no fifth weekly draw, no schema bump), the
// conveyor never rolls for them, and the save never carries them. Delete this file and every save
// still loads – that is what "derived" means here.
//
// WHAT MAY LEGITIMATELY CHANGE DOWNSTREAM: the composition of the W rungs' event sub-streams
// (`seed:kidtour:<id>` for her shadow runs and previews, and since W3-FIELD3 `seed:aitour:<id>` for
// the canonical W brackets too). Entrant sets are a documented mutable class – they have changed
// with every band/age re-pick – and the candidate-count-per-window discipline in selectEntrants is
// preserved (one draw per candidate, count a function of the window and the universe size, never of
// results content and never of player input).
//
// ⚠ THE CANONICAL W BRACKETS ARE NO LONGER BYTE-IDENTICAL, AND THAT IS THE POINT OF W3-FIELD3 (see
// the superseded fence on `universeForTier` below). A W event's `seed:aitour:<id>` sub-stream now
// spends one draw per candidate of a 563-row merged universe instead of a 199-row one, so every W
// result the engine writes from this branch on differs from the one it wrote yesterday. The MAIN
// weekly stream is untouched – 41550 / e6b0c709 re-derives byte-for-byte, which is the invariant
// this box states – and the six non-W rungs are byte-identical because `universeForTier` hands them
// back the same cohort array instance it was given.
//
// ⚠⚠ THE TURNOVER MODEL CHANGED IN W4-LIVES (04.08) AND THIS PARAGRAPH IS ITS EPITAPH. It used to
// read: "PER-SEASON REGENERATION (`seasonIndex` in the key) is the phase-W turnover model: a new
// season deals a new field... honest enough until phase 2 gives the pros real aging and careers."
// It was not honest enough, and the audit that measured it says why in numbers
// (docs/specs/world-strength-audit-2026-08.md §§3-4): 47% of professionals got YOUNGER year on year,
// 0.00 of 364 ever retired, and over 96 measured seasons not one simulated athlete ever held a
// top-100 chair. The owner's ruling: they must age, they must leave, somebody may hold the top for
// several years, and the world must be one a player has a real chance of climbing into.
//
// SO THE KEY IS THE CAREER, NOT THE SEASON. A chair (`fp-<n>`) keeps its storey; the person in it
// has a debut age, a retirement age and a span, and `careerAt` walks that succession. Age is
// `debutAge + (season - debutSeason)` – the owner's own "+1 when the season ends", computed rather
// than stored. Stored state for a field pro is STILL ZERO, which is §2.3's "one card index,
// generated lazily" holding for the pro contour, and which is why this was buildable without a
// schema bump, a migration or a golden save.

import { rngFromSeed, pickInt } from '../rng'
import { FIRST_NAMES, NATION_POOL, SURNAMES } from './cohort'
import { rivalGroundstrokes } from './rival'
import { TIERS, WEEKS_PER_YEAR } from './calendar'
import type { AiPlayer, RankingRow, TierId } from './types'

/** Which storey of the professional pyramid a pro was generated into. Labels, not numbers, so a
 *  bench printout reads as people; the ordering the ranking needs comes from `wtaPoints`.
 *
 *  ⚠ FOUR STOREYS SINCE W2-FIELD2 (act2-pro-tour.md §8.1). `tourElite` is the top of the WORLD, not
 *  the top of our calendar: she plays the 250/500/1000/Slam tour that is act-3 content, which is why
 *  her points are in the thousands while our own top rung pays 125 a title. See FIELD.tiers. */
export type FieldStrengthTier = 'tourElite' | 'elite' | 'contender' | 'journeyman' | 'circuit'

/** One professional of the FIELD tier. An `AiPlayer` on purpose – she flows through the SAME
 *  machinery a cohort rival does (`selectEntrants`' age gate and bands, `rivalMatchPlayer`'s
 *  surface/style/condition build) with zero new code paths – plus what makes her a pro:
 *
 *  - `groundstrokes` is stored EQUAL to what `rivalGroundstrokes` derives for her id, so the type
 *    carries the fifth attribute the brief asks for while the engine's derived read agrees with it
 *    byte-for-byte (one meaning, two access paths, no divergence possible).
 *  - `wtaPoints` is her virtual standing row – see `mergedWtaRanking`.
 *  - `growth`/`potential` exist to satisfy the AiPlayer contract and are inert: a pro's four
 *    attributes are drawn once for her whole career and never drifted (she is not in
 *    `world.cohort`), so growth is 1 and the ceiling is where she stands. Since W4-LIVES her BOOK
 *    moves with her career (`careerArc`) while her GAME does not – see that function for why the
 *    two were split, and phase 2's pro contour for where a real body curve belongs. */
export interface FieldPro extends AiPlayer {
  strengthTier: FieldStrengthTier
  groundstrokes: number
  /** her derived W-table points for THIS season – the virtual standing row's value */
  wtaPoints: number
}

// =================================================================================================
// THE CALIBRATION TABLE – every strength constant of the field, in ONE place (bench-first
// discipline: these numbers move only with a tools/field-quality.ts re-run in hand).
// =================================================================================================
//
// THE PYRAMID: the top ~30 clearly stronger than today's best juniors, a middle ~120 at
// strong-junior level, a tail ~150 the strong junior can beat but must respect. Core = the mean of
// the four generated attributes, the same `power()` the conveyor reads, so the bench compares like
// with like.
//
// ⚠ THE BANDS WERE TUNED DOWN FROM THE FIRST DRAFT, WITH THE BENCH IN HAND (01.08) – this is the
// brief's own "tune the strength distribution constants and re-run" clause being exercised, and
// the arithmetic that forced it is worth keeping: W15's entrant window opens at percentile 0.15 of
// the merged ~500-row table, and entry is position-biased, so a W15 field IS roughly the players
// ranked #75-140. Under ANY points curve that rises with skill, those positions hold the 75th-140th
// strongest pros – with the draft pyramid (elite 60-70 / middle 52-62 / tail 45-55) that meant mean
// core 56.8, dead level with the reference strong junior (power 56.75), and her title chance
// measured 3% against a 15-35% target. No points-curve shape can fix that (rank order ≈ skill
// order); only the pyramid itself can. One notch down, the window holds the top journeymen and the
// contenders' middle – beatable but real – and the elite storey still towers over every junior.
//
// THE POINTS BANDS speak the W table's own currency (a W15 title pays 10, a W35 title 20, a W100
// title 100, best-6 window): journeymen hold W15-round money, contenders hold W15-title-to-W35
// money, elites hold W35-title-to-W100 money. Two shaping terms on top, both measured:
//
//  * `careerArc` (was `ageRamp`, widened by W4-LIVES): points also scale with where in her CAREER
//    she is. A 19-year-old with a contender's game has not accumulated a contender's ranking yet –
//    she is exactly the hungry riser a real W15 field is full of – so young pros sit deeper in the
//    table than their skill says, and a W15 window carries the occasional under-ranked shark. Since
//    W4-LIVES the same term also brings her back DOWN past `career.peakTo`, so a chair is climbed
//    into, held for a plateau of years, and vacated. (This term deliberately blurs strict
//    tier-monotonicity of points: age is allowed to outrank youth at equal skill, which is how the
//    real table reads.)
//  * `jitter`: a small multiplicative wobble so equal cores do not produce a points staircase.
//
// CALIBRATED 01.08 against tools/field-quality.ts (targets from the brief): the reference
// strong-junior build (serve 66/ret 50/comp 57/stam 54/ground 65) wins a W15 title in 15-35% of
// entered events; a 50-point LIVE row (five W15 titles) lands ~#40-80 of the merged table, not #9;
// a W35 field is measurably stronger than a W15 field. Measured numbers live beside the pin in
// tests/season/fieldPros.test.ts and in docs/specs/living-field.md.
//
// RE-CALIBRATED 02.08 (W2-FIELD2), same bench, 16 worlds × up to 400 events a rung. Two of those
// three targets hold and the third moved for a reason worth stating in the table it lives in:
//
//   ✓ W15 title probability 20.3% (it had drifted to 8.8% on this branch before the wave — see the
//     W family's band note in calendar.ts for the arithmetic that did it).
//   ✓ six rungs, six measurably different fields: 48.3 < 50.5 < 55.2 < 59.8 < 65.8 < 70.8.
//   ⚠ A 50-POINT LIVE ROW NOW LANDS #365 OF 564, NOT #40-80, AND THAT IS THE PACING REQUIREMENT
//     RATHER THAN A REGRESSION. Five W15 titles is 50 WTA points; in the real table 50 points is
//     past #600. #40-80 was only ever reachable because the field held nobody in the middle — it IS
//     the "top of the world in two seasons" defect, seen from her side of the table. The property
//     the old target defended survives and is stronger: the number this pin exists to kill is "#9",
//     and the head she is now measured against is a real one. The pin in
//     tests/season/fieldPros.test.ts is re-aimed to the measured band, not deleted.
//   ⚠⚠ AND THE ONE THING THE OWNER MUST DECIDE BEFORE THIS MERGES: the ACCEPTANCE CUTS were left
//     exactly where W2-LADDER measured them (`enterPct`, a share of the merged table), and against
//     the lifted curve those shares now bite in points rather than in places. Measured, fresh world:
//         50 pts -> #365   100 -> #365   160 -> #331   250 -> #252   400 -> #183   650 -> #132
//         1000 -> #87      1400 -> #49
//     against cuts of w35 top 282 · w50 226 · w75 169 · w100 141 · wta125 113. So a W35 needs ~250
//     W points, and a best-16 window filled with nothing but W15 TITLES caps at 160 — the rung
//     above the entry rung is unreachable from the entry rung alone. That is a change beyond this
//     table (it is `enterPct`'s derivation, or a different acceptance rule), so it is REPORTED and
//     not invented: the numbers are here, the decision is the owner's.
// =================================================================================================
// ⚠ THE FOURTH STOREY (W2-FIELD2, 02.08 – act2-pro-tour.md §8.1, owner ruling 3 intact: still
// DERIVED, still PER-SEASON, no persistence, no schema).
// =================================================================================================
//
// WHY: the shipped ceiling was 450 points, which the spec reads as roughly world #130 – fine while
// W15/W35/W100 were the whole ladder, absurd the day W2-LADDER shipped a WTA 125, whose real
// champion is a top-100 player. And it broke the family from the other end, MEASURED before a line
// of this was written (tools/field-quality.ts, 16 worlds, this branch at 2aebe4f):
//
//     rung      field mean core   median entrant pos   P(ref build wins the title)
//     w15            51.4            105/499                  8.8%
//     w35            53.8             87/499                  6.8%
//     w50            57.3             52/499                  1.6%
//     w75            59.7             33/499                  0.6%
//     w100           59.7             33/499                  1.0%
//     wta125         59.7             33/499                  2.1%
//
// The top THREE rungs draw the SAME field, to one decimal place, because entry is position-biased
// (`key = position + rng × 32`) and all three windows open at the same head of a table whose head is
// one thirty-strong storey. There was nothing above for the 125 to reach for. L6's own guard says
// so in as many words and names this wave as the fix.
//
// WHERE THE BAND COMES FROM – two measurements, and they meet (`--storey-probe`):
//
//   * THE TOP is bounded by what a CAREER can become. `rollPotential` gives every attribute
//     `startingSkills` + U(4, 26); 20,000 rolls read as the mean-of-four this table is denominated
//     in: p50 63.2 · p90 68.8 · p99 73.2 · max 80.8. A world #1 above the MAX is a backdrop nobody
//     can ever climb; a world #1 at the p99 is one every good career equals. So the storey's top
//     sits at the midpoint of those two, core 77 – reachable, and only by a career that rolled
//     near-max talent and spent a decade realising it.
//   * THE MEDIAN is bounded by the match engine. `fastMatchProbability`, reference build (power
//     56.75) vs a flat core: 61.8 → 47.3% · 70 → 25.9% · 72 → 21.6% · 74 → 17.7% · 77 → ~12%. The
//     storey's median (core 72) therefore holds the girl who is meant to win 15-35% of her W15s to
//     21.6% – the same number, which is the point: a median elite is a coin flip for her and a
//     median tourElite is a W15 title. That is a storey rather than a re-labelling.
//
// Floor = elite's ceiling + 1 = 67; top = 77; the ±6 attribute spread and the gamma-bent points
// lerp copy the storey below unchanged.
//
// THE POINTS BANDS ARE BORROWED FROM A TOUR WE DO NOT SIMULATE, and that is deliberate rather than
// sloppy: the real WTA scale is earned at the 250/500/1000/Slam rungs act 3 will build. Our own
// calendar tops out at 125 a title, so no derived pro and no career can EARN a five-figure row
// inside this game today – the storeys describe the world these people live in, seen from the ITF
// rungs where the career actually is.
//
// =================================================================================================
// ⚠⚠ THE WHOLE DISTRIBUTION WAS LIFTED, NOT JUST TOPPED (W2-FIELD2, the owner's pacing requirement
// via the architect: «the climb must take roughly as long as it does in life, not 1-2 seasons»).
// =================================================================================================
//
// THE DEFECT, measured on the pre-wave table: our points-to-rank curve was FLAT UNDER HER. A
// 104-point girl read as world #27 in a table whose #300 held 9 points and whose #500 held 0, while
// 104 real WTA points is somewhere around #350-400. A 14x position error, and it is the whole reason
// a career reached the top of the world in two seasons: the table had nobody in the middle for her
// to have to pass. Adding a storey ON TOP fixes the head and leaves that untouched, which is why
// this table's shipped shape is a lift of all four storeys rather than a fourth one bolted on.
//
// THE TARGET IS THE REAL CURVE'S OWN ANCHORS, and the achieved fit is measured, not asserted
// (tools/field-quality.ts prints `merged table head` on every run):
//
//     rank      #1      #10     #50    #100    #150    #300    #500
//     REAL   ~10500    4000    1400     850     520     190      75
//     OURS    10469    4308    1340     822     513     189       0   <- see the ⚠ below
//
// ⚠ #500 IS THE ONE ANCHOR THIS TABLE CANNOT REACH, AND IT IS A POPULATION LIMIT RATHER THAN A
// CALIBRATION ONE. 364 derived pros hold points; rows 365+ of the merged table are the LIVE cohort,
// most of them on zero. Matching #500 = 75 needs a fifth storey and FIELD.size somewhere near 520,
// which re-opens every `entrantPctBand` and the sponsor derivation that reads this size. Flagged for
// the owner, deliberately NOT taken here.
//
// =================================================================================================
// ⚠⚠ ...AND IT IS TAKEN NOW – LADDER-PACE STEP 1 (05.08). The paragraph above is its own to-do list
// and the owner approved working through it - "I support it, we should try"
// (docs/specs/points-economy-2026-08.md §10, ordered 1 depth · 2 compression · 3 window · 4 price).
// =================================================================================================
//
// WHY DEPTH IS FIRST AND NOT LAST. Three separate measurements all reduce to the table being too
// SHORT rather than wrong:
//
//   * world-strength-audit §6b: three of the ten acceptance cuts (W35 #700, W50 #550, W75 #450) sit
//     PAST the end of the pointed table, so they refuse nobody. §6c is the consequence – one W
//     ranking point clears W75's inert cut, `tierOutgrown` shuts W15 behind her, and the documented
//     three-stage slide {w15,w35,w50} -> {w35,w50,w75} -> {w50,w75,w100} never happens. That is the
//     owner's own "the 35s finished VERY quickly" seen from the engine's side.
//   * points-economy §3b: `selectEntrants` fills a rung's percentile band from its TOP, so the
//     bottom 150 pros are dealt zero draws a season while holding a median 207 points each.
//   * points-economy §4a: on a 564-row table `entrantPctBand` maps every W rung onto a slice two to
//     four times better-ranked than the real rung draws – which is why compressing the strength
//     spread (step 2) put the reference junior's W15 title chance at 2.3% against a 15-35% target.
//     Compression NEEDS the depth underneath it or it destroys the on-ramp.
//
// WHAT CHANGES, AND WHAT DELIBERATELY DOES NOT. A fifth storey is APPENDED, so `fp-0`..`fp-363`
// keep their chairs, their storeys and their draws byte-for-byte: the top 364 rows of this table are
// the same 364 people they were yesterday, and every number the four storeys above were calibrated
// on is untouched. What moves is that 156 more professionals now stand BELOW them.
//
// THE POINTS BAND IS THE REAL CURVE'S OWN TAIL, read from the same anchors the lift above used:
// #364 ~130 · #500 ~75. So the storey spans base 70-155 (the ceiling deliberately overlapping
// journeyman's 150 floor, exactly as tourElite's 1400 floor meets elite's 1400 ceiling – the seam
// is continuous by construction, not by luck).
//
// THE CORE BAND IS THE PYRAMID'S OWN ARITHMETIC CONTINUED: every storey steps down five and spans
// ten (67-77, 56-66, 43-53, 38-48), so the fifth is 33-43. ⚠ THAT MAKES THE WORLD MORE SPREAD OUT,
// NOT LESS, AND IT IS ON PURPOSE FOR ONE STEP ONLY: step 1 must be depth and NOTHING else or its
// effect is not attributable. Step 2 re-deals every core in this table off the real Elo curve and
// is where the spread is fixed. Read the two together, never this one alone.
//
// THE NAME. Not a federation's and not a trademark: on the real tour the players ranked past ~#350
// are the ones who qualify for everything and are resident nowhere - the circuit's rank and file.
//
// WHAT THE FIT BUYS, checked against act2-pro-tour.md §2's own season arithmetic — which was written
// as a design target and was not true of the old table: year 3 ("≈ 400-650 pts → #150-200") now
// measures #183 at 400 and #132 at 650; year 4 ("700-1,000 → top-100") measures #87 at 1,000; year
// 5+ ("1,400+ → top-50") measures #49 at 1,400. The spec's own ladder is the curve's, to the place.
//
// gamma 6.5 on the top storey is what makes the head read like a real one rather than 64 co-#1s.
export const FIELD = {
  /** id prefix – the namespace that keeps field ids disjoint from `ai-*` / `ai-s*-*` / 'kid' */
  idPrefix: 'fp-',
  /** professionals per season. 300 → 364 with the fourth storey; 364 → **520** with the fifth
   *  (ladder-pace step 1 – see the ⚠⚠ box above). Against 199 juniors that is the merged ~720-row
   *  W table, still one derivation per read and still zero persisted bytes.
   *
   *  ⚠ THE PYRAMID HAS GROWN AT BOTH ENDS AND NEVER IN THE MIDDLE, WHICH IS WHAT KEEPS EVERY
   *  CALIBRATION THIS FILE CARRIES. The fourth storey was added on top and the three below it kept
   *  their counts; the fifth is added underneath and the four above it keep theirs. `fieldProsFor`
   *  walks `tiers` in order handing out `fp-<n>`, so appending a storey shifts nobody's id. */
  size: 520,
  /** THE AGES A PROFESSIONAL CAN BE SEEN AT – 16 (the ITF age-eligibility floor the W rungs use) to
   *  the hard end of a career. NO LONGER THE DRAW: since W4-LIVES an age is `debutAge + seasons
   *  since her debut`, and this pair is the envelope that span can occupy plus the anchor the points
   *  arc is denominated in. See `FIELD.career`. */
  ageBand: [16, 34] as [number, number],
  /** the pyramid, top first. `core` is the band the tier's mean-of-four is drawn from; `pts` is
   *  the tier's points band, lerped by where her core sits in the band (`gamma` bends the lerp –
   *  2 makes the elite top-heavy, so one or two 300+ names exist and the median elite does not).
   *  Bands are disjoint in base points, so points are monotone in strength BEFORE the age ramp
   *  and jitter blur the seams – which they are allowed to do (see above).
   *
   *  ⚠ ORDER IS THE ID ORDER. `fieldProsFor` walks this array and hands out `fp-<n>` in sequence,
   *  so putting the new storey FIRST shifts every other pro's `n` by 64 and re-deals every seed's
   *  field. That is free here and nowhere else: field pros are never persisted, never referenced
   *  across a season boundary, and are re-derived from scratch on every read. Top-first is how the
   *  table reads, and a storey appended at the bottom of the literal would put the world #1 at
   *  `fp-300`. */
  tiers: [
    { id: 'tourElite' as const, count: 64, core: [67, 77] as [number, number], pts: [1400, 11500] as [number, number], gamma: 6.5 },
    { id: 'elite' as const, count: 30, core: [56, 66] as [number, number], pts: [1000, 1400] as [number, number], gamma: 1 },
    { id: 'contender' as const, count: 120, core: [43, 53] as [number, number], pts: [350, 1000] as [number, number], gamma: 1.6 },
    { id: 'journeyman' as const, count: 150, core: [38, 48] as [number, number], pts: [150, 350] as [number, number], gamma: 1.4 },
    // ⚠ THE FIFTH STOREY (ladder-pace step 1, 05.08). Appended, never inserted – see `size` above
    // for why the position in this literal is load-bearing. Count 156 takes the field to 520 and the
    // merged table to ~720 rows, which is what puts W75's #450 cut and W50's #550 cut back INSIDE
    // the pointed table so they can refuse somebody again.
    { id: 'circuit' as const, count: 156, core: [33, 43] as [number, number], pts: [70, 155] as [number, number], gamma: 1.4 },
  ],
  /** per-attribute spread around the drawn core (uniform ± this), so a pro has a shape, not a bar */
  attrSpread: 6,
  // ===============================================================================================
  // ⚠ W4-LIVES (04.08) – THE PROFESSIONALS HAVE CAREERS. The owner's ruling, verbatim in substance:
  // they must age (*"when the season ends can we not just add +1 to everyone's age?"*), they must
  // leave, somebody may sit at the top for several years running, and the purpose is a living world
  // in which the player has a real CHANCE at the top.
  //
  // THE ANSWER TO HIS QUESTION IS YES, AND IT IS EXACTLY THAT SIMPLE – computed rather than stored.
  // A slot (`fp-<n>`) is a chair with a fixed storey; the PERSON in it has a debut age, a retirement
  // age and therefore a span of seasons. Age at season s is `debutAge + (s - debutSeason)`, which is
  // "+1 every season" as a pure function. Nothing is persisted, no schema moved, and the whole
  // timeline re-derives from (seed, n) – see `careerAt`.
  //
  // WHAT WAS THERE BEFORE, and why it had to go (docs/specs/world-strength-audit-2026-08.md §4):
  // age was an i.i.d. uniform draw EVERY season, so 47% of professionals got YOUNGER year on year,
  // 0.00 of 364 ever left, and the population mean age was 23.01 with sd 0.229 for ever.
  // ===============================================================================================
  career: {
    /** the age a professional arrives on the table. A real tour's intake, not a single birthday. */
    debutAge: [16, 19] as [number, number],
    /** ...and the age she leaves it. Drawn once per career, so a career is 7-18 seasons and the
     *  MEDIAN is ~12 – long enough that a top-100 chair is held for years, which is the owner's own
     *  framing, and short enough that the top is not one unbroken reign. */
    retireAge: [26, 34] as [number, number],
    /** THE POINTS ARC's plateau: she is at her full skill-implied book between these two ages.
     *  22-28 is the real sport's own peak window, and it is also what the arc-probe arithmetic
     *  wanted – see `declineFloor`. */
    peakFrom: 22,
    peakTo: 28,
    /** ...and what the arc is worth at the hard end of `ageBand`. Together with `ageRampFloor` this
     *  is the whole life cycle: rise, plateau, decline.
     *
     *  ⚠ TUNED TO PRESERVE THE TABLE, NOT TO CHANGE IT (CLAUDE.md invariant 4, and the ruling's own
     *  limit: it licenses ageing and retirement, NOT a re-balance of how strong the tour is). The
     *  population's mean multiplier under the OLD uniform-16-30 draw was 0.9067, and the job of
     *  these four numbers is to land the new steady state on that same figure – so the merged
     *  table's points-to-rank curve, the one thing in this file with a real calibration behind it,
     *  does not move while the people standing in it start living.
     *
     *  PREDICTED vs MEASURED (`npm run bench:world -- --arc-probe`, 52,416 (pro, season) samples
     *  past the burn-in). First cut (plateau 23-27, floor 0.55) measured 0.8873, a -2.14% drift –
     *  a systematic weakening of the tour, small but not noise. Re-derived from the probe's own age
     *  histogram: widening the plateau to the sport's real peak window 22-28 predicted **0.9095
     *  (+0.31%)**; measured **0.9095 (+0.30%)**. The decline was NOT flattened to buy the number,
     *  which was the other way to reach it and would have cost the tenure this wave is for. */
    declineFloor: 0.55,
  },
  /** how much of her skill-implied points a debutante has banked (ramps to 1 by `career.peakFrom`) */
  ageRampFloor: 0.65,
  /** multiplicative points wobble: ×(1 ± this) */
  jitter: 0.1,
  /** salted re-draw attempts on a name collision before the collision is accepted (the LIVE cohort
   *  itself carries two "Uma Tamm" – persisted, not ours to fix – so acceptance is the precedent) */
  nameRedraws: 8,
} as const

/** Field-pro ids live in their own namespace. One predicate, exported, so every surface that must
 *  resolve an id (the full-bracket view, the champion news line, the VS card's rank) asks the same
 *  question instead of re-spelling a prefix. */
export function isFieldProId(id: string): boolean {
  return id.startsWith(FIELD.idPrefix)
}

/** THE SEASON A WEEK BELONGS TO – deliberately the same arithmetic as world.ts's `seasonIndexOf`.
 *  It is re-stated here because season/* cannot import world.ts (module layering: world.ts imports
 *  season/*), and the two MUST agree or the field would turn over on a different week than the
 *  conveyor does. Pinned against the world's own function in tests/season/fieldPros.test.ts. */
export function fieldSeasonOf(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR)
}

function clamp01to100(x: number): number {
  return x < 0 ? 0 : x > 100 ? 100 : x
}

/** A tier's points for a core drawn inside its band: the band lerp, bent by gamma. */
function pointsForCore(tier: (typeof FIELD.tiers)[number], core: number): number {
  const [cLo, cHi] = tier.core
  const t = Math.max(0, Math.min(1, (core - cLo) / (cHi - cLo)))
  const [pLo, pHi] = tier.pts
  return pLo + (pHi - pLo) * Math.pow(t, tier.gamma)
}

/** HER PLACE IN HER OWN CAREER, as a multiplier on her skill-implied book: rise, plateau, decline.
 *
 *  ⚠ THIS MOVES HER RANKING AND NOT HER GAME, AND THE SPLIT IS DELIBERATE (W4-LIVES). Her four
 *  attributes are drawn once and never move for the whole career; only this multiplier does. Three
 *  reasons, in order of weight:
 *
 *   1. THE RULING'S OWN LIMIT. Ageing and retirement were licensed; a skill decline curve would
 *      change every match the field plays against her, which is a re-balance of how strong the tour
 *      is and is not this branch's to take.
 *   2. IT IS THE HONEST MODEL OF THE THING BEING SIMULATED. A ranking is a rolling window of
 *      RESULTS. A player past her peak genuinely holds fewer points long before she hits the ball
 *      appreciably worse – she plays a thinner schedule, loses earlier, defends less. The book is
 *      what the arc is about; the body is `growth`/`potential`, which stay inert.
 *   3. IT IS WHAT PRODUCES THE TURNOVER HE ASKED FOR. Without it a slot's book is constant for
 *      12 seasons and the top 100 is one unbroken reign per chair; with it a career climbs into the
 *      top band, holds it for the plateau, and falls out of it before she retires.
 *
 *  The rise half is the shipped `ageRamp` unchanged in shape and floor – see FIELD's own note on
 *  what it was for ("a 19-year-old with a contender's game has not accumulated a contender's ranking
 *  yet"). The plateau and the decline are the new half. */
export function careerArc(age: number): number {
  const c = FIELD.career
  const [lo, hi] = FIELD.ageBand
  if (age < c.peakFrom) {
    const t = (age - lo) / (c.peakFrom - lo)
    return FIELD.ageRampFloor + (1 - FIELD.ageRampFloor) * Math.max(0, Math.min(1, t))
  }
  if (age <= c.peakTo) return 1
  const t = (age - c.peakTo) / (hi - c.peakTo)
  return 1 - (1 - c.declineFloor) * Math.max(0, Math.min(1, t))
}

// =================================================================================================
// THE CAREER TIMELINE OF ONE CHAIR – W4-LIVES, and the whole of "they age and they leave".
// =================================================================================================
//
// A slot `fp-<n>` is a CHAIR with a fixed storey. The person sitting in it has a debut age, a
// retirement age, and therefore a span of seasons; when she goes, the next one sits down. Walking
// that succession forward from a fixed origin makes (age, identity, retirement, replacement) a pure
// function of (seed, n, season) – so the module keeps every property its own header box claims:
// zero persisted bytes, zero schema, delete-the-file-and-saves-still-load.
//
// ⚠ WHY THE CHAIR KEEPS ITS STOREY WHEN THE PERSON CHANGES. The pyramid (64/30/120/150) is the one
// thing in this file with a real calibration behind it, and it describes the WORLD's shape rather
// than any individual: a tour always has about so many top-100 players. Letting slots change storey
// would re-deal that shape every season, which is the defect this wave is fixing, not a feature.
// So: the chair is the world's, the career is the player's.
//
// ⚠ RNG DISCIPLINE. Every draw here comes off `${seed}:fieldcareer:${n}:${k}` – one fresh
// purpose-scoped generator per CAREER, never per season, and never MAIN. The frozen capture
// (41550 / e6b0c709) cannot see this file, exactly as before.
//
// ⚠ THE ORIGIN IS A TOUR ALREADY IN PROGRESS, not a founding class. Career 0 of every chair is
// given a CURRENT AGE at season 0 drawn across her own span, so week 0 of a new career meets a
// professional population with the same age spread it always had – and from season 1 everybody in
// it ages by one, which is the ruling.

interface ProCareer {
  /** which career of this chair – 0 is the one already sitting there at season 0 */
  index: number
  /** the season she arrived. NEGATIVE for career 0: she was already playing before week 0. */
  debutSeason: number
  debutAge: number
  retireAge: number
}

/** The last season this career is still on the table. */
function retireSeason(c: ProCareer): number {
  return c.debutSeason + (c.retireAge - c.debutAge)
}

function drawSpan(seed: string, n: number, k: number): { debutAge: number; retireAge: number; rng: () => number } {
  const rng = rngFromSeed(`${seed}:fieldcareer:${n}:${k}`)
  const [dLo, dHi] = FIELD.career.debutAge
  const [rLo, rHi] = FIELD.career.retireAge
  // The bands do not overlap (debut tops out at 19, retirement starts at 26), so no career is ever
  // shorter than seven seasons and no clamp is needed.
  return { debutAge: pickInt(rng, dLo, dHi), retireAge: pickInt(rng, rLo, rHi), rng }
}

// The timeline cache. Chairs are read by every W-table fold, so the succession is walked once per
// (seed, chair) and extended as the world advances.
//
// ⚠ A FEW SEEDS, NOT ONE, AND THAT IS DELIBERATE. `memo` below and rival.ts's runsIndexCache are
// single-entry on the reasoning that "a world is played one at a time", which is true in play – but
// a paired-world A/B (tests/preview.test.ts, tests/ending.test.ts and the input-independence guards
// all tick two worlds in one process) would alternate seeds on every call, and a single entry turns
// that into a full 364-chair re-walk each time. A miss here costs strictly more than a `memo` miss,
// so the cache holds a handful and evicts oldest-first. Purely a cost decision: the walk is a pure
// function of (seed, n, season), so an evicted entry re-derives identically.
const TIMELINE_SEEDS = 4
const timelines = new Map<string, ProCareer[][]>()

/** WHO IS SITTING IN CHAIR `n` AT `season` – the succession, walked. Pure in (seed, n, season). */
export function careerAt(seed: string, n: number, season: number): ProCareer {
  let chairs = timelines.get(seed)
  if (!chairs) {
    if (timelines.size >= TIMELINE_SEEDS) timelines.delete(timelines.keys().next().value as string)
    chairs = []
    timelines.set(seed, chairs)
  }
  let line = chairs[n]
  if (!line) {
    const { debutAge, retireAge, rng } = drawSpan(seed, n, 0)
    // Career 0 is mid-career at season 0: her age there is drawn across her own span, so the
    // opening population is a tour rather than a class that all arrived together.
    const ageAtOrigin = pickInt(rng, debutAge, retireAge)
    line = [{ index: 0, debutSeason: debutAge - ageAtOrigin, debutAge, retireAge }]
    chairs[n] = line
  }
  while (retireSeason(line[line.length - 1]) < season) {
    const prev = line[line.length - 1]
    const k = prev.index + 1
    const { debutAge, retireAge } = drawSpan(seed, n, k)
    line.push({ index: k, debutSeason: retireSeason(prev) + 1, debutAge, retireAge })
  }
  // Seasons before the origin career's debut cannot be asked for in play (weeks start at 0), and a
  // caller that does ask gets career 0 rather than a crash.
  for (const c of line) if (season <= retireSeason(c)) return c
  return line[line.length - 1]
}

// ONE pro. Draw order per player is FIXED (first name, surname, nation, core, four attribute
// offsets, points jitter) off her own stream – reordering re-maps every seed's field, exactly as the
// cohort's own draw-order note warns. Name collisions are resolved off SALTED side-streams
// (`...:name:<attempt>`) so a re-draw can never shift the base stream: two worlds whose cohorts
// differ get fields that differ in NAMES ONLY, never in skills, points, ages or nations.
//
// ⚠ THE STREAM IS KEYED ON THE CAREER, NOT ON THE SEASON (W4-LIVES). It was
// `${seed}:field:${seasonIndex}:${n}`, which is precisely why a chair held a different person every
// year; it is now `${seed}:field:${n}:c${careerIndex}`, so every fact about her is CONSTANT for the
// whole span she is on the table and only her age – and through the arc, her book – moves.
//
// ⚠ AND HER AGE IS NO LONGER DRAWN AT ALL. It is `debutAge + (season - debutSeason)`: the owner's
// "+1 when the season ends", as arithmetic.
//
// ⚠ ONE KNOWN COSMETIC EDGE, stated rather than discovered later: the name dedupe runs against the
// LIVE cohort, whose roster turns over every season, so a mid-career professional whose name a newly
// arrived thirteen-year-old happens to collide with will re-draw hers. Rare (the pools are large),
// and the pro has to yield because the junior's name is persisted state and hers is not.
function makeFieldPro(
  seed: string,
  seasonIndex: number,
  n: number,
  tier: (typeof FIELD.tiers)[number],
  taken: Set<string>,
): FieldPro {
  const career = careerAt(seed, n, seasonIndex)
  const rng = rngFromSeed(`${seed}:field:${n}:c${career.index}`)
  const id = `${FIELD.idPrefix}${n}`

  let first = FIRST_NAMES[pickInt(rng, 0, FIRST_NAMES.length - 1)]
  let last = SURNAMES[pickInt(rng, 0, SURNAMES.length - 1)]
  const nation = NATION_POOL[pickInt(rng, 0, NATION_POOL.length - 1)]

  const [cLo, cHi] = tier.core
  const core = cLo + rng() * (cHi - cLo)
  const spread = FIELD.attrSpread
  const serve = clamp01to100(core + spread * (2 * rng() - 1))
  const ret = clamp01to100(core + spread * (2 * rng() - 1))
  const composure = clamp01to100(core + spread * (2 * rng() - 1))
  const stamina = clamp01to100(core + spread * (2 * rng() - 1))

  // Her age is her career's, not a draw: one year older every season she is still here.
  const ageYears = career.debutAge + (seasonIndex - career.debutSeason)

  // ⚠ THE JITTER IS DRAWN PER SEASON, NOT PER CAREER (W4-LIVES), AND IT IS THE ONE THING IN THIS
  // FUNCTION THAT IS ALLOWED TO MOVE WHILE SHE STAYS THE SAME PERSON. It used to come off the
  // per-season player stream, which made it look like form and was in fact a re-deal; keyed on the
  // CAREER it would have been the opposite mistake – a book that glides along its arc with no year
  // that goes well or badly, so a chair at the top is held by whoever holds it until she retires.
  // Measured: with a career-constant jitter the tenure tail at the top ten ran to p90 13 seasons.
  //
  // ⚠ AND IT IS NOT A BALANCE CHANGE. `FIELD.jitter` is untouched and so is its distribution – the
  // multiplier is still mean-1 uniform on ±10%, so the population's points total and the merged
  // table's shape are exactly what they were. What changes is only its SERIAL CORRELATION, from
  // perfectly correlated to independent, which is the honest reading of a ranking that is refolded
  // every year. Stable WITHIN a season (the key is the season index), which is the promise
  // `fieldProsFor` makes to previews and draws.
  const jitterRoll = rngFromSeed(`${seed}:fieldform:${n}:${seasonIndex}`)()

  // DEDUPE, against the LIVE cohort's names and within the field itself, by salted re-draw. The
  // base stream is already fully consumed above, so however many attempts this takes, every other
  // fact about her – and about every other pro – is untouched.
  for (let attempt = 1; taken.has(`${first} ${last}`) && attempt <= FIELD.nameRedraws; attempt++) {
    const salt = rngFromSeed(`${seed}:field:${n}:c${career.index}:name:${attempt}`)
    first = FIRST_NAMES[pickInt(salt, 0, FIRST_NAMES.length - 1)]
    last = SURNAMES[pickInt(salt, 0, SURNAMES.length - 1)]
  }
  taken.add(`${first} ${last}`)

  const wtaPoints = Math.max(
    1,
    Math.round(pointsForCore(tier, core) * careerArc(ageYears) * (1 + FIELD.jitter * (2 * jitterRoll - 1))),
  )

  const pro: FieldPro = {
    id,
    name: `${first} ${last}`,
    nation,
    serve,
    ret,
    composure,
    stamina,
    // ⚠ STILL INERT, AND THAT IS THE W4-LIVES DECISION RATHER THAN AN OVERSIGHT (see `careerArc`).
    // Her BOOK follows her career; her GAME does not. A skill decline curve would change every
    // match the field plays, which is a re-balance of how strong the tour is – the owner's ruling
    // licensed ageing and retirement and did not license that. Phase 2's pro contour is where a
    // body curve belongs.
    growth: 1,
    ageYears,
    potential: { serve, ret, composure, stamina },
    strengthTier: tier.id,
    // Stored = derived, one value: see FieldPro. rivalGroundstrokes reads only (id, serve, ret).
    groundstrokes: 0,
    wtaPoints,
  }
  pro.groundstrokes = rivalGroundstrokes(pro)
  return pro
}

// The memo: the field is asked for by every W-table read (rank caches, standings, entry gates,
// previews), so it is derived once per (seed, season, cohort-names) and handed back by reference –
// WHICH ALSO MATTERS FOR CORRECTNESS, not just cost: `selectEntrants` positions candidates by id
// against a ranking built from the same array, and one instance means the two can never be built
// from different name-collision resolutions. Single entry, like rival.ts's runsIndexCache: a world
// is played one at a time.
let memo: { key: string; pros: FieldPro[] } | null = null

/** THE FIELD, for one season of one world: ~300 professionals, derived, never persisted.
 *
 *  `takenNames` is the LIVE cohort's names (pass `world.cohort.map(p => p.name)`), so no new
 *  pro duplicates a girl the player already knows. Within a season the cohort's names are fixed
 *  (the conveyor renames only at the boundary, the same boundary this regenerates on), so the
 *  result is STABLE for the whole season: previews taken in week 10 and the draw run in week 12
 *  see the same three hundred people. */
export function fieldProsFor(
  seed: string,
  seasonIndex: number,
  takenNames: readonly string[] = [],
): FieldPro[] {
  const key = `${seed} ${seasonIndex} ${takenNames.join(' ')}`
  if (memo && memo.key === key) return memo.pros
  const taken = new Set(takenNames)
  const pros: FieldPro[] = []
  let n = 0
  for (const tier of FIELD.tiers) {
    for (let i = 0; i < tier.count; i++) pros.push(makeFieldPro(seed, seasonIndex, n++, tier, taken))
  }
  memo = { key, pros }
  return pros
}

// =================================================================================================
// THE MERGED W TABLE – LIVE rows as earned, field rows as derived, ONE ranking.
// =================================================================================================
//
// The professional table used to be 200 rows of whom ~199 held zero; now it is the LIVE table's
// rows (earned points, exactly as computeRanking folded them – kid included when the caller's live
// table includes her) interleaved with the field's virtual rows. Sorting rules, all deterministic:
//
//   1. points, descending – the only thing a ranking is;
//   2. on a points tie, LIVE before FIELD – an earned point outranks a derived one, so a LIVE girl
//      never loses a tie to a simulation artefact;
//   3. inside each side, the incoming order – the LIVE table's own recency/roster order survives,
//      and the field's generation order is stable per season.
//
// Rank numbers are competition-style ("1224"), the same convention computeRanking uses, so a
// merged table reads like every other table in the game.
export function mergedWtaRanking(live: readonly RankingRow[], pros: readonly FieldPro[]): RankingRow[] {
  const rows = [
    ...live.map((r, i) => ({ playerId: r.playerId, points: r.points, live: 1, ord: i })),
    ...pros.map((p, i) => ({ playerId: p.id, points: p.wtaPoints, live: 0, ord: i })),
  ]
  rows.sort((a, b) => b.points - a.points || b.live - a.live || a.ord - b.ord)
  const out: RankingRow[] = []
  let rank = 0
  let prevPoints: number | null = null
  rows.forEach((row, i) => {
    if (prevPoints === null || row.points !== prevPoints) {
      rank = i + 1
      prevPoints = row.points
    }
    out.push({ playerId: row.playerId, points: row.points, rank })
  })
  return out
}

/** WHO MAY BE DRAWN INTO A TIER'S EVENTS – the one seam where the field joins the game.
 *
 *  W-track tiers draw from LIVE cohort ∪ field pros; every other tier draws from the LIVE cohort
 *  alone, and returns the SAME ARRAY INSTANCE it was handed so "the junior tour is untouched" is a
 *  reference-equality fact a test can pin, not a diff to re-review. The J-tier mixed-table
 *  percentile problem is real and is explicitly phase 2 (docs/specs/living-field.md).
 *
 *  =============================================================================================
 *  ⚠ THE CANONICAL AI BRACKETS COME THROUGH HERE NOW (W3-FIELD3, 04.08). THE FENCE BELOW IS
 *  SUPERSEDED, AND ITS REASONING IS KEPT BECAUSE THE HALF OF IT THAT WAS RIGHT IS STILL LAW.
 *  =============================================================================================
 *
 *  WHAT IT USED TO SAY, verbatim in substance: `drawAiEntrants` (world.ts) passes `world.cohort`
 *  directly, ON PURPOSE – canonical brackets WRITE result rows, and a field pro must never write
 *  into `world.results`, which is persisted state with a 52-week prune sized for 199 players.
 *  Consequence, accepted: AI W-tour news names LIVE players only in phase W.
 *
 *  WHY IT MOVED. The fence conflated TWO facts that turn out to be separable: "she is in the draw"
 *  and "she leaves a row". Only the second one costs persisted bytes. Holding them together cost
 *  the two things W3-ACT2 measured and stopped for:
 *
 *    * A GRAND SLAM PLAYED BY CHILDREN. `tools/big-draw-cost.ts`: a 128-draw filled from the live
 *      cohort alone takes 128 of the 199 juniors in the world, 18.3% of them under the rung's own
 *      age gate, the youngest THIRTEEN – because `selectEntrants` treats an unfillable draw as a
 *      crash rather than a compromise and its escape ladder falls through to `cohort`. So the
 *      majors shipped at draw 32 with the deviation stated (calendar.ts, `slam`).
 *    * A PROFESSIONAL TOUR WHOSE EVENTS NO PROFESSIONAL PLAYS. 364 derived pros absorbed exactly
 *      zero canonical W draws – measured at 4.50 W result rows per LIVE rival over a 20-week
 *      window both before and after W2-FIELD2 (living-field.md §8.2d) – so every W event in the
 *      game was contested, and every W title won, by juniors.
 *
 *  WHAT IS UNCHANGED, AND IT IS THE PART THAT WAS ALWAYS THE REAL RULE: **a field pro still never
 *  writes into `world.results`.** `runAiTournament` skips the ledger row for an `fp-` id (world.ts)
 *  and her standing stays exactly what it has always been – derived, `wtaPoints`, a pure function of
 *  (seed, seasonIndex). Zero persisted bytes, zero schema, zero prune pressure; the ledger in fact
 *  gets SMALLER, because the slots a pro takes are slots that no longer write a junior's row.
 *
 *  WHAT IT COSTS, stated rather than discovered later: a pro's canonical results change nothing
 *  about her. She cannot climb the table by winning a W100 and cannot fall out of it by losing in
 *  the first round, and she carries no fatigue ledger, so she is fresh every week of the season.
 *  Phase 2's pro contour (§2.2 – careers, peaks, retirements) is where that becomes untrue; until
 *  then the field is a backdrop that plays rather than a backdrop that lives, and the simplification
 *  is conservative in the hard direction (the field she meets is always at its best). */
export function universeForTier(
  tier: TierId,
  cohort: AiPlayer[],
  pros: readonly FieldPro[],
): AiPlayer[] {
  return TIERS[tier].track === 'wta' ? [...cohort, ...pros] : cohort
}
