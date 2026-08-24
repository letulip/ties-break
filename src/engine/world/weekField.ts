// ⭐ R2-10 STEP 2 – THE WEEK, DERIVED ONCE: the one world both competitions are judged against.
//
// EVERY EVENT OF A WEEK MUST SEE THE SAME WORLD. That is not a tidiness rule here, it is the
// property the tick was reorganised around (31.07, «они физически не могут сразу везде играть»):
// the standings, the rivals' condition, the field's professional entries, the derived pros and the
// W doors are folded ONCE, before any bracket runs, so her own shadow run and the canonical AI
// brackets can never disagree about how tired an opponent is, how much of her allowance a rival has
// spent, or who is in which draw.
//
// ⚠ THIS MODULE IS THE SUBSTRATE OF TWO PHASES, WHICH IS WHY IT IS NOT INSIDE EITHER OF THEM. Her
// competition (world/phaseHerWeek.ts) and the AI's read the same derivations and build their fields
// through the same `rivalField`; giving either one ownership would leave the other importing a
// phase, or – far worse – growing a second copy of the rule.
//
// ⚠ ZERO DRAWS, ON ANY STREAM. Every line below is arithmetic over the ledger or a memoised pure
// derivation off `seed:field:`. Nothing here takes an `rng` and nothing here can move the MAIN
// sequence: the frozen capture (41550 / e6b0c709) cannot see this file.
import type { MatchPlayer } from '../match/types'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../season/types'
import type { WorldState } from './state'
import { ECONOMY } from '../economy'
import { rivalMatchPlayer } from '../season/rival'
import { rivalConditions } from '../season/rival'
import { BEST_N_BY_TRACK, computeRanking } from '../season/ranking'
import { mergedWtaRanking, universeForTier, type FieldPro } from '../season/fieldPros'
import { KID_ID } from './constants'
import { cohortIds, inTrack, fieldProsOf, proDoors, type ProDoors } from './ladder'
import { rivalProEntries } from './entryCaps'

/** RIVALS BECOME REAL: turn the selected cohort rows into the players who actually take the court
 *  for `event` – base attributes → surface/style modifier → condition factor, exactly once and in
 *  the same order as the kid's, via the single `rivalMatchPlayer` helper (season/rival.ts).
 *
 *  THE one place both tournament paths (the kid's shadow run and the canonical AI bracket) build a
 *  rival, so the two can never disagree about who she is. `fatigue` is the week's derived
 *  conditions; a player absent from it has no results inside the fatigue window and is fresh.
 *  Pure – the cohort rows are read, never written – and ZERO RNG draws. */
export function rivalField(entrants: AiPlayer[], event: SeasonEvent, fatigue: Map<string, number>): MatchPlayer[] {
  return entrants.map((p) => rivalMatchPlayer(p, event.surface, fatigue.get(p.id) ?? ECONOMY.condition.max))
}

/** THE PROFESSIONAL SIDE OF ONE WEEK, derived once before any of the week's brackets run – exactly
 *  as `aiRanking` and `rivalFatigue` are, and for the same reason: every event of the week must see
 *  the same world, or the two universes could disagree about who is in which draw. */
export interface TourWeek {
  /** this season's derived professionals */
  pros: FieldPro[]
  /** LIVE cohort ∪ pros – the pool a W event's short field backfills from */
  universe: AiPlayer[]
  /** the merged W standings, folded WITHOUT the kid (see the note at the call site) */
  ranking: RankingRow[]
  /** every W rung's acceptance door for a cohort id (W3-ONRAMP) – the kid's own gate, folded once
   *  a week beside the standings it reads */
  doors: ProDoors
}

/** `universeForTier`'s fence is per TRACK, not per rung, so any W rung answers the same question and
 *  the week's professional pool is built once off the entry rung. Named rather than inlined so the
 *  claim ("all ten W rungs share one universe") is a statement rather than a coincidence. */
const W_TRACK_PROBE: TierId = 'w15'

/** ⭐ THE WHOLE OF WHAT A WEEK IS, before anybody plays it – handed to her competition and to the
 *  AI's, so the two are reading one derivation rather than two agreeing ones. */
export interface WeekField {
  /** every event on this week's calendar, in calendar order */
  scheduled: SeasonEvent[]
  /** the mixed ordinal ambience the junior/domestic selection bands read – kid-free */
  aiRanking: RankingRow[]
  /** every cohort player's condition for THIS week */
  rivalFatigue: Map<string, number>
  /** the field's professional entries in the trailing year – the AER gate's ledger */
  rivalEntries: ReadonlyMap<string, number>
  /** the professional side of the week */
  tour: TourWeek
}

/** ⭐ Fold the week once. Called from `tickWeek` between her body and her competition, exactly where
 *  these seven `const`s stood inline before R2-10 step 2 – same order, same expressions, zero draws. */
export function deriveWeekField(world: WorldState): WeekField {
  const ids = cohortIds(world)
  const scheduled = world.season.filter((e) => e.week === world.week)
  // Canonical ranking excludes the kid so AI-field selection never depends on the kid's own
  // results / entry history – the canonical AI world stays the same world whatever she does.
  // ⚠ THE MIXED SELECTION TABLE KEEPS THE JUNIOR 6 (W2-LADDER §3, an explicit non-move). This fold
  // is not one of the three ranking tables - it is the AI side's ordinal ambience, all tracks in
  // one pot, feeding `selectEntrants`' percentile bands - and the best-16 rule is about what a
  // PROFESSIONAL SEASON IS WORTH where professional points are read (rankingFor / the merged W
  // table / kidPoints), none of which flow through here. Widening this one would permute every
  // event sub-stream's composition to make a selection heuristic agree with a rule it never
  // implements. The N is stated, not defaulted, so the split cannot land here by accident.
  const aiRanking = computeRanking(
    world.results.filter((r) => r.playerId !== KID_ID),
    world.week,
    BEST_N_BY_TRACK.itf,
    ids,
  )

  // RIVALS BECOME REAL: every cohort player's condition for THIS week, derived ONCE from the
  // results ledger before any of the week's brackets run. Deriving it up front (rather than per
  // event) is what keeps the week coherent: every event scheduled this week sees the same rivals,
  // and the kid's shadow run (step 2) and the canonical AI brackets (step 4) can never disagree
  // about how tired an opponent is. Pure derivation, ZERO main-stream draws.
  const rivalFatigue = rivalConditions(world.results, world.week)
  // ⭐⭐ ...AND THE FIELD'S AER LEDGER, derived here for exactly the reasons the line above is:
  // ONCE per week, before any bracket runs, so every event of the week gates against the same
  // ledger and the kid's shadow run (step 2) and the canonical AI brackets (step 4) can never
  // disagree about how much of her allowance a rival has spent. Pure derivation, ZERO main-stream
  // draws. See `rivalProEntries` for why it is derived rather than persisted.
  const rivalEntries = rivalProEntries(world.results, world.week)

  // ⚠ THE PROFESSIONAL SIDE OF THE WEEK (W3-FIELD3, 04.08) – the canonical W brackets' universe and
  // table, derived here beside the other two snapshots so every event of the week sees one world.
  //
  // The standings are folded WITHOUT the kid, on the very independence rule `aiRanking` above states
  // in its own comment: who turns up to a canonical W100 may never depend on what she has entered or
  // won. The LIVE half is the W-track fold at the W table's own best-16 width (this is a real table,
  // not the mixed ordinal ambience `aiRanking` is), interleaved with the field's virtual rows by
  // `mergedWtaRanking` – which is the SAME construction `computeShadowTournament` builds for her own
  // W draws, so the canonical bracket and her shadow of it finally position their candidates against
  // one table instead of two.
  //
  // ZERO DRAWS, on any stream: `fieldProsOf` is a memoised pure derivation off `seed:field:` and
  // both folds are arithmetic over the ledger.
  const seasonPros = fieldProsOf(world)
  const tourRanking = mergedWtaRanking(
    computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.wta,
      ids,
      inTrack('wta'),
    ),
    seasonPros,
    world.fieldSeasonPoints,
  )
  const tourWeek: TourWeek = {
    pros: seasonPros,
    universe: universeForTier(W_TRACK_PROBE, world.cohort, seasonPros),
    ranking: tourRanking,
    // ⚠ AND THE DOORS THE COHORT KNOCKS ON (W3-ONRAMP), folded here for the same reason the two
    // tables above are: every event of the week must be judged against ONE world. Kid-free like
    // everything else on this line, and zero draws – see `proDoors`.
    doors: proDoors(world, tourRanking),
  }
  return { scheduled, aiRanking, rivalFatigue, rivalEntries, tour: tourWeek }
}
