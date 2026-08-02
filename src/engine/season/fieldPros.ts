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
// (`seed:kidtour:<id>` for her shadow runs and previews). Entrant sets are a documented mutable
// class – they have changed with every band/age re-pick – and the candidate-count-per-window
// discipline in selectEntrants is preserved (one draw per candidate, count a function of the window
// and the universe size, never of results content). The canonical `seed:aitour:` brackets stay
// LIVE-only and are byte-identical (see `universeForTier`).
//
// PER-SEASON REGENERATION (`seasonIndex` in the key) is the phase-W turnover model: a new season
// deals a new field, which is cheap, stable WITHIN the season (previews and draws agree week to
// week), and honest enough until phase 2 gives the pros real aging and careers. Stored state for a
// field pro is ZERO, which is §2.3's "one card index, generated lazily" holding for the pro contour.

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
export type FieldStrengthTier = 'tourElite' | 'elite' | 'contender' | 'journeyman'

/** One professional of the FIELD tier. An `AiPlayer` on purpose – she flows through the SAME
 *  machinery a cohort rival does (`selectEntrants`' age gate and bands, `rivalMatchPlayer`'s
 *  surface/style/condition build) with zero new code paths – plus what makes her a pro:
 *
 *  - `groundstrokes` is stored EQUAL to what `rivalGroundstrokes` derives for her id, so the type
 *    carries the fifth attribute the brief asks for while the engine's derived read agrees with it
 *    byte-for-byte (one meaning, two access paths, no divergence possible).
 *  - `wtaPoints` is her virtual standing row – see `mergedWtaRanking`.
 *  - `growth`/`potential` exist to satisfy the AiPlayer contract and are inert in phase W: field
 *    pros are regenerated each season, never drifted (they are not in `world.cohort`), so growth is
 *    1 and the ceiling is where she stands. Phase 2 gives the pro contour a real curve. */
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
//  * `ageRamp`: points also scale with how long she has BEEN a pro. A 19-year-old with a
//    contender's game has not accumulated a contender's ranking yet – she is exactly the hungry
//    riser a real W15 field is full of – so young pros sit deeper in the table than their skill
//    says, and a W15 window carries the occasional under-ranked shark. Ramps linearly from
//    `ageRampFloor` at 16 to 1.0 at `ageRampFullAt`. (This term deliberately blurs strict
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
// WHAT THE FIT BUYS, checked against act2-pro-tour.md §2's own season arithmetic — which was written
// as a design target and was not true of the old table: year 3 ("≈ 400-650 pts → #150-200") now
// measures #183 at 400 and #132 at 650; year 4 ("700-1,000 → top-100") measures #87 at 1,000; year
// 5+ ("1,400+ → top-50") measures #49 at 1,400. The spec's own ladder is the curve's, to the place.
//
// gamma 6.5 on the top storey is what makes the head read like a real one rather than 64 co-#1s.
export const FIELD = {
  /** id prefix – the namespace that keeps field ids disjoint from `ai-*` / `ai-s*-*` / 'kid' */
  idPrefix: 'fp-',
  /** professionals per season. 300 → 364 with the fourth storey; against 199 juniors that is the
   *  merged ~564-row W table, still one derivation per read and still zero persisted bytes. The
   *  pyramid grew at the TOP only: the three shipped storeys keep their counts, because their
   *  calibration is the one thing in this file that had a bench behind it already. */
  size: 364,
  /** a professional field: 16 (the ITF age-eligibility floor the W rungs use) to 30 */
  ageBand: [16, 30] as [number, number],
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
  ],
  /** per-attribute spread around the drawn core (uniform ± this), so a pro has a shape, not a bar */
  attrSpread: 6,
  /** how much of her skill-implied points a 16-year-old pro has banked (ramps to 1 by full age) */
  ageRampFloor: 0.65,
  ageRampFullAt: 23,
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

/** How much of her skill-implied ranking a pro of `age` has accumulated. */
function ageRamp(age: number): number {
  const [lo] = FIELD.ageBand
  if (age >= FIELD.ageRampFullAt) return 1
  const t = (age - lo) / (FIELD.ageRampFullAt - lo)
  return FIELD.ageRampFloor + (1 - FIELD.ageRampFloor) * Math.max(0, t)
}

// ONE pro. Draw order per player is FIXED (first name, surname, nation, core, four attribute
// offsets, age, points jitter) off her own `${seed}:field:${seasonIndex}:${n}` stream – reordering
// re-maps every seed's field, exactly as the cohort's own draw-order note warns. Name collisions
// are resolved off SALTED side-streams (`...:name:<attempt>`) so a re-draw can never shift the base
// stream: two worlds whose cohorts differ get fields that differ in NAMES ONLY, never in skills,
// points, ages or nations.
function makeFieldPro(
  seed: string,
  seasonIndex: number,
  n: number,
  tier: (typeof FIELD.tiers)[number],
  taken: Set<string>,
): FieldPro {
  const rng = rngFromSeed(`${seed}:field:${seasonIndex}:${n}`)
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

  const [aLo, aHi] = FIELD.ageBand
  const ageYears = pickInt(rng, aLo, aHi)

  const jitterRoll = rng()

  // DEDUPE, against the LIVE cohort's names and within the field itself, by salted re-draw. The
  // base stream is already fully consumed above, so however many attempts this takes, every other
  // fact about her – and about every other pro – is untouched.
  for (let attempt = 1; taken.has(`${first} ${last}`) && attempt <= FIELD.nameRedraws; attempt++) {
    const salt = rngFromSeed(`${seed}:field:${seasonIndex}:${n}:name:${attempt}`)
    first = FIRST_NAMES[pickInt(salt, 0, FIRST_NAMES.length - 1)]
    last = SURNAMES[pickInt(salt, 0, SURNAMES.length - 1)]
  }
  taken.add(`${first} ${last}`)

  const wtaPoints = Math.max(
    1,
    Math.round(pointsForCore(tier, core) * ageRamp(ageYears) * (1 + FIELD.jitter * (2 * jitterRoll - 1))),
  )

  const pro: FieldPro = {
    id,
    name: `${first} ${last}`,
    nation,
    serve,
    ret,
    composure,
    stamina,
    // Inert in phase W – see the FieldPro doc comment. She is finished growing because nothing
    // ever drifts her; next season deals a new field instead.
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
 *  ⚠ THE CANONICAL AI BRACKETS DO NOT COME THROUGH HERE. `drawAiEntrants` (world.ts) passes
 *  `world.cohort` directly, ON PURPOSE: canonical brackets WRITE result rows, and a field pro must
 *  never write into `world.results` – the ledger is persisted state with a 52-week prune sized for
 *  199 players, and a pro's fatigue/standing is derived, not recorded. Consequence, accepted and
 *  documented: AI W-tour news names LIVE players only in phase W. */
export function universeForTier(
  tier: TierId,
  cohort: AiPlayer[],
  pros: readonly FieldPro[],
): AiPlayer[] {
  return TIERS[tier].track === 'wta' ? [...cohort, ...pros] : cohort
}
