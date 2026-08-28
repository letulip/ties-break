// ⭐ R2-10 STEP 2, PHASE 5 – THE REST OF THE WORLD PLAYS, AND THE WEEK CLOSES.
//
// THE LAST NAMED PHASE OF THE WEEKLY TICK. Every event on this week's calendar draws its field,
// the no-double-booking rule resolves the whole week at once, the held slots are filled, the
// brackets play – and then, on a week she is not in the middle of revealing, the books close: her
// rank is recomputed, the ledgers are pruned, the calendar rolls forward, the tour's season quota
// is settled, the season wrap-up fires and the endings are read.
//
// ⚠ THE CLOSING STEPS ARE CALLED FROM HERE BUT OWNED BY world/bookkeeping.ts, because a reveal
// week defers the same two to `finalizeTournament` and `skipEvent` runs them too – see that
// module's header.
//
// ⚠ A MOVE AND NOT A REWRITE: `tickWeek`'s steps 4 to 7 in their original order, comment for
// comment, step numbers unrenumbered – 4a/4b/4b½/4c included, since the whole reason the step is
// three statements instead of one loop is written in them.
//
// ⚠ ZERO MAIN DRAWS, AND THAT IS THE PROPERTY THE 31.07 SPLIT WAS BUILT TO PRESERVE. Each event
// runs on its own `seed:aitour:<event.id>`; `drawAiEntrants` opens that stream and hands the LIVE
// RNG OBJECT to `runAiTournament`, which resumes on exactly the number it would have read anyway.
// The phase takes no `rng` at all – the MAIN stream ended two phases ago, carrying base costs and
// the cohort drift and nothing else, which is what the frozen capture (41550 / e6b0c709) measures.
import type { AiPlayer, RankingRow, SeasonEvent, TournamentResult } from '../season/types'
import type { Rng } from '../rng'
import type { WorldState } from './state'
import type { TourWeek, WeekField } from './weekField'
import { rivalField } from './weekField'
import { rngFromSeed } from '../rng'
import { TIERS } from '../season/calendar'
import { FIELD, careerAt, isFieldProId, universeForTier } from '../season/fieldPros'
import {
  ON_RAMP,
  WILD_CARD,
  byAllocationPriority,
  fillOnRamp,
  hostNationOf,
  resolveDoubleBookings,
  runTournament,
  selectEntrants,
  wildCardWindow,
} from '../season/tournament'
import { isSponsorReviewWeek } from '../offers'
import { addEvent, seasonIndexOf } from './ledger'
import { acceptanceRank, fieldProsOf } from './ladder'
import { withinAnnualEntryLimit } from './entryCaps'
import { tierMakesWorldNews } from './matchNews'
import { playerShortName } from './snapshot'
import { maybeFireSeasonWrapUp } from './milestones'
import { settleMandatoryQuota } from './mandatory'
import { resolveEndings } from './endings'
import { housekeep, recomputeRankAndMilestones } from './bookkeeping'

// The canonical AI-only bracket for one event. Runs on its OWN EVENT-SCOPED stream
// `seed:aitour:<event.id>` – the exact mirror of the kid's `seed:kidtour:<event.id>` – covering
// BOTH the entrant selection and the AI-vs-AI matches. ZERO main-stream draws.
//
// Why it is scoped and not on the main weekly stream: the calendar is content. While the brackets
// drew from the main stream, adding a tier or densifying a cadence changed the per-week draw count
// by construction, which re-based every frozen invariance pin – the ladder-up slice had to move
// them for exactly that reason. Scoped by (world.seed, event.id) – two immutable values, and
// event.id is unique per (year, week, tier) – the AI world is now a pure function of the event, so
// content is free and a reloaded career replays its brackets by construction rather than by the
// worker fast-forwarding the main stream onto precisely the right draw.
//
// RIVALS BECOME REAL: the field is built through `rivalField`, so the bracket runs on rivals who
// are tired from their own recent schedule and coloured by how their style suits the surface. That
// costs no draw – both are pure derivations – so everything above still holds. The awarded rows now
// record their `tier`, which is what lets next week's reconstruction read them EXACTLY instead of
// guessing (SeasonResult.tier has always been optional, so this is not a schema bump).
//
// EVERY ENTRANT LEAVES A ROW – SCORING OR NOT (fix/rival-fatigue-rows). This loop used to guard on
// `points > 0`, which was harmless while every finish paid: "has a row" and "played that week" were
// the same fact. Wave B's first-round zero ended that, and the guard then deleted the ONLY record
// that half of every draw had played at all – so `season/rival.ts`, which reconstructs a cohort
// player's strain from her rows, read a rival who lost her opener as having RESTED. She banked
// `recoveryBase` for a week she spent travelling and playing. Measured on the real engine
// (tools/rival-fatigue-audit.ts, 12 cells × 30 seeds × 208w): 45.6% of all cohort appearances were
// charged no strain whatever, the field ran ~4 points of condition fresher than the tennis it
// played, and the cohort's win% against the kid moved with it.
//
// So the row is written for EVERY entrant of the draw and `points` carries the award, 0 included.
// The two facts now live in two fields instead of one presence check, which is what
// `isCountingResult` exists to keep honest: nothing that reads the ledger as a STANDINGS table sees
// a scoreless row (computeRanking / windowedBestSum / the counting-results list all filter it out),
// and the one system that reads it as a record of PLAY – the rival fatigue window – sees all of it.
// This is the same shape `season/prehistory.ts` has always written; the live path is what moved.
//
// COSTS NOTHING ON THE STREAM: pushing a row draws no RNG on any stream, and the loop already
// visited every entrant (`result.finishes` is dense over the whole draw). The frozen MAIN capture
// 41550 / e6b0c709 is untouched by construction – points are post-draw arithmetic, read off a table
// after the bracket has already been resolved. The ledger roughly doubles in size (a 32-draw writes
// 32 rows instead of 16); it is still pruned on the same 52-week rule and stays ~2k rows.
//
// ⚠ SPLIT IN TWO BY THE NO-DOUBLE-BOOKING RULE (31.07), AND THE SPLIT IS THE LOAD-BEARING PART.
// The draw and the bracket used to be one call because they share one `aiRng`: `selectEntrants`
// spends the first N numbers of `seed:aitour:<id>` and `runTournament` continues from N+1. A rule
// that has to see EVERY event of the week before ANY bracket runs cannot be written inside a
// function shaped like that – but re-seeding a second stream for the bracket would restart it at
// draw 0 and move every AI result ever recorded. So `drawAiEntrants` makes the draw and hands the
// LIVE RNG OBJECT on; `runAiTournament` resumes on exactly the number it would have read anyway.
// Same stream, same position, same values: the split is invisible to every sub-stream in the game.
// ⚠⚠ AND SINCE W3-FIELD3 (04.08) A W-TRACK CANONICAL BRACKET IS PLAYED BY PROFESSIONALS.
//
// THE SHAPE, in one sentence: the W rungs' candidate universe becomes LIVE cohort ∪ derived field
// pros positioned by the MERGED W standings – the same `universeForTier` seam, the same
// `selectEntrants`, the same age gate, the same entrant bands the kid's shadow run has used since
// living-field phase W – and `runAiTournament` then writes a ledger row for the LIVE entrants ONLY.
//
// THE FENCE THIS REPLACES said a pro must never be in a canonical draw BECAUSE a pro must never
// write a persisted row. The second clause is still law and is enforced one function down; the
// first turned out not to follow from it, and holding the two together is what shipped a Grand Slam
// at draw 32 (calendar.ts `slam`) and a professional tour whose events no professional played.
//
// WHAT IT COSTS IN PERSISTED STATE: NOTHING, and slightly less than nothing. A 32-draw W event used
// to push 32 junior rows into `world.results`; it now pushes only as many as it drew LIVE girls,
// which at the shipped bands is a handful. No schema, no migration, no new field – and the 52-week
// prune is doing strictly less work than it did yesterday. The two alternatives considered and not
// taken: a parallel non-persisted results view (a second ledger for `rivalConditions` to read, i.e.
// a second thing to keep in step with the first) and a bounded per-season pro-results structure (a
// schema bump to buy a pro a ranking that moves – which is phase 2's pro contour, and it should
// arrive with aging and retirement rather than ahead of them).
//
// WHAT IT COSTS IN FIDELITY, stated so it is not discovered later: a pro's canonical results change
// nothing about her – her standing stays her derived `wtaPoints`, she banks no fatigue, so she is
// fresh every week. See the superseded fence in season/fieldPros.ts for the full accounting.
//
// ⚠ RNG. Zero MAIN draws, exactly as before: `drawAiEntrants` opens `seed:aitour:<event.id>` and
// `runAiTournament` resumes on it, and the frozen capture (41550 / e6b0c709) re-derives
// byte-for-byte on this branch. What DID move is the COMPOSITION of each W event's own sub-stream –
// `selectEntrants` spends one draw per band candidate and a W band now selects from 563 people
// rather than 199 – which is the documented mutable class (every band and age re-pick has moved it)
// and is NOT a fairness break: the count is a function of (seed, week, the kid-free ledger, the
// derived field), every one of which is independent of what the player has entered or won. The six
// non-W rungs are byte-identical, because `universeForTier` hands them back the same array instance.
// `TourWeek` and `W_TRACK_PROBE`: moved to world/weekField.ts with `deriveWeekField`, which is the
// only thing that builds one (R2-10 step 2, phase 3). The type is imported back for the three
// functions below that are handed one.

function drawAiEntrants(
  world: WorldState,
  event: SeasonEvent,
  aiRanking: RankingRow[],
  tour: TourWeek,
  fatigue: Map<string, number>,
  /** see `computeShadowTournament`'s own note - the AER ledger, required for the same reason. */
  entries: ReadonlyMap<string, number>,
): { event: SeasonEvent; entrants: AiPlayer[]; rng: Rng } {
  const rng = rngFromSeed(`${world.seed}:aitour:${event.id}`)
  // `universeForTier` is the seam and it is asked BY TIER, so a non-W event provably gets
  // `world.cohort` itself back (reference equality, pinned in tests/season/fieldPros.test.ts) and
  // reads the mixed junior table it always read.
  const isW = TIERS[event.tier].track === 'wta'
  const universe = withinAnnualEntryLimit(
    universeForTier(event.tier, world.cohort, tour.pros),
    event.tier,
    entries,
    TIERS[event.tier].drawSize,
  ) as AiPlayer[]
  return {
    event,
    entrants: selectEntrants(event, universe, isW ? tour.ranking : aiRanking, rng, fatigue),
    rng,
  }
}

/** THE HELD SLOTS OF THE WHOLE WEEK (W3-ONRAMP, 04.08) – step 4b½, between the week's resolution and
 *  its brackets.
 *
 *  WHY IT IS ITS OWN PASS AND NOT PART OF THE DRAW: `season/tournament.ts`'s ⚠⚠ box has the
 *  measurement. In one sentence – a held slot filled at DRAW time can land on a junior the same
 *  week's J300 has also drawn, `resolveDoubleBookings` then correctly hands her to the higher rung,
 *  and the junior event backfills with a STRONGER player. Every held slot silently upgraded a junior
 *  draw. Filling here, from the players the resolved week has left free, makes "one body, one week"
 *  true of the held slots by construction and leaves the junior tour untouched.
 *
 *  STRONGEST RUNG FIRST, exactly as `resolveDoubleBookings` orders itself – literally so since
 *  round 22: both call the one `byAllocationPriority` in season/tournament.ts, so "exactly as" is a
 *  fact the compiler holds rather than one this comment promises. A graduate good enough for a W100
 *  is therefore not spent on the W15 that happens to sort first in the calendar. The brackets still
 *  PLAY in calendar order (the ledger's row order is unchanged); only the filling is re-ordered, and
 *  each event's own `seed:aitour:<id>` stream sees its draws in the same place either way. */
function fillWeekOnRamps(
  world: WorldState,
  drawn: readonly { event: SeasonEvent; entrants: AiPlayer[]; rng: Rng }[],
  fields: Map<string, AiPlayer[]>,
  aiRanking: RankingRow[],
  tour: TourWeek,
  fatigue: Map<string, number>,
  /** the AER ledger - see `computeShadowTournament`'s note. Required for the same reason. */
  entries: ReadonlyMap<string, number>,
): void {
  const booked = new Set<string>()
  for (const field of fields.values()) for (const p of field) booked.add(p.id)
  const wEvents = drawn
    .filter((d) => TIERS[d.event.tier].track === 'wta')
    .sort((a, b) => byAllocationPriority(a.event, b.event))
  for (const d of wEvents) {
    const before = fields.get(d.event.id) ?? d.entrants
  // ⭐⭐ ...AND THE AER REACHES THE BACKFILLS TOO, which is where the first attempt leaked. Gating
  // the DRAW's universe left `ai-177` one entry over her row, because the held slots do not come
  // from that universe: this pool is `world.cohort` itself, and the on-ramp exists precisely to hand
  // W slots to juniors - the one population the rule caps. A gate the backfills can walk around is
  // the thing `selectEntrants`' own age-gate comment warns about, one storey up.
    const after = fillOnRamp(
      d.event,
      before,
      tour.ranking,
      d.rng,
      {
        pool: withinAnnualEntryLimit(world.cohort, d.event.tier, entries, ON_RAMP.slots) as AiPlayer[],
        ranking: aiRanking,
        admits: tour.doors.at(d.event.tier),
        slots: ON_RAMP.slots,
      },
      fatigue,
      booked,
    )
    const withCards = fillWildCards(world, d.event, after, tour, fatigue, booked, entries)
    fields.set(d.event.id, withCards)
    for (const p of withCards) booked.add(p.id)
  }
}

/** ⭐⭐ THE EIGHT WILD CARDS OF A SLAM DRAW (round 21 #2b) – `fillOnRamp` in its second
 *  configuration, and NOT a second held-slot mechanism. See `WILD_CARD` in season/tournament.ts for
 *  what a wild card is here, why the ground is the home nation, and why a returning name is not
 *  expressible.
 *
 *  THE FOUR THINGS THIS CALL SITE DECIDES, all of which `fillOnRamp` then obeys unchanged:
 *
 *  1. **THE POOL IS THE HOST NATION'S PLAYERS** – `fillOnRamp` has no idea what a nation is and is
 *     not being taught one. The whole home-nation ground is a filter on the pool it is handed, which
 *     is the same seam `universeForTier` uses to keep a population question out of bracket code.
 *     ⚠ It is the event's WHOLE universe (cohort ∪ derived professionals), not `world.cohort`: at
 *     #113-#333 of a 1,799-row table almost everybody is a professional, and a wild card drawn from
 *     the live juniors alone would be `ON_RAMP` again under a different name.
 *
 *  2. **THE DOOR IS INVERTED** – `OnRamp.admits` is normally "the rung accepts her"; here it is
 *     `wildCardWindow`, i.e. "the rung REFUSED her and she is still of the level". A direct
 *     acceptance who was also handed a wild card would make the marker on the card a lie.
 *
 *  3. **ITS OWN SUB-STREAM, so the event's `seed:aitour:` draws do not move** – one draw per
 *     host-nation candidate off `seed:wildcard:<eventId>`. Nothing is added to MAIN (invariant 2),
 *     and the field the week already selected is bit-for-bit the field it selected.
 *
 *  4. **AFTER THE ON-RAMP, not before.** Both passes drop the last direct acceptances, so whichever
 *     runs second can displace what the first put in. The order is the entry list's own – places
 *     close, then the tournament announces its wild cards – and it is very nearly moot in practice:
 *     the on-ramp's candidates must clear `doors.at('slam')`, i.e. sit inside #112 of a table with
 *     1,600 professionals in it, which a live junior essentially never does.
 *
 *  ⚠ HER OWN DRAW IS NOT TOUCHED, and that is the seam `fillOnRamp`'s ⚠ SCOPE box already names:
 *  the shadow bracket she plays in (`seed:kidtour:`) fills from professionals alone, so widening it
 *  moves her measured difficulty at every W rung and is a second change wanting its own measurement.
 *  What decides whether SHE holds a wild card is the entry gate, not this function – see
 *  `homeWildCardPlace` in world/ladder.ts, which reads the same `wildCardWindow`. */
function fillWildCards(
  world: WorldState,
  event: SeasonEvent,
  field: AiPlayer[],
  tour: TourWeek,
  fatigue: Map<string, number>,
  booked: ReadonlySet<string>,
  /** the AER ledger - see `computeShadowTournament`'s note. A wild card is a DOOR and not an
   *  exemption: it decides WHO the host nation may promote, never how many events a fifteen-year-old
   *  may play. Same reading as `fillWeekOnRamps` one function up. */
  entries: ReadonlyMap<string, number>,
): AiPlayer[] {
  if (event.tier !== WILD_CARD.tier || WILD_CARD.slots <= 0) return field
  const host = hostNationOf(world.seed, event.id)
  const pool = withinAnnualEntryLimit(
    tour.universe.filter((p) => p.nation === host),
    event.tier,
    entries,
    WILD_CARD.slots,
  ) as AiPlayer[]
  if (!pool.length) return field
  const accepts = acceptanceRank(world, event.tier)
  const total = tour.ranking.length
  const rankOf = new Map<string, number>()
  for (const r of tour.ranking) rankOf.set(r.playerId, r.rank)
  return fillOnRamp(
    event,
    field,
    tour.ranking,
    rngFromSeed(`${world.seed}:wildcard:${event.id}`),
    {
      pool,
      ranking: tour.ranking,
      admits: (id) => wildCardWindow(event.tier, rankOf.get(id) ?? total, total, accepts),
      slots: WILD_CARD.slots,
    },
    fatigue,
    booked,
  )
}

function runAiTournament(
  world: WorldState,
  event: SeasonEvent,
  entrants: AiPlayer[],
  aiRng: Rng,
  fatigue: Map<string, number>,
): void {
  const field = rivalField(entrants, event, fatigue)
  const result = runTournament(event, field, null, world.seed, aiRng)
  const pts = TIERS[event.tier].points
  for (const [playerId, finish] of Object.entries(result.finishes)) {
    // ⚠ THE LEDGER IS FOR LIVE PLAYERS, AND THIS LINE IS THE WHOLE OF THAT RULE (W3-FIELD3). A
    // field pro is derived state: she has no persisted identity, her standing is `wtaPoints` and
    // her condition is 100 by construction, so a row for her would be a row nothing ever reads –
    // bought with permanent bytes in a save that prunes on a 52-week window sized for 199 people.
    // She played the tournament; the tournament simply does not write her down.
    // ⭐⭐ v53 – THE FIELD'S POINTS ARE KEPT NOW, AS A TALLY RATHER THAN AS ROWS. This line used to be
    // a bare `continue`, and the comment above it argued – correctly – that a per-finisher ROW for a
    // field pro is bytes nobody reads in a save pruned for 199 people. What it did not see is that
    // throwing the row away also threw away the RESULT: her standing was a pure function of (seed,
    // season), so no match anybody played could move it. The owner found it from the seat: «таблица
    // просто "стоит"… и номер 1 мы обыгрывали на шлеме».
    //
    // ⚠ SO THE ROW STAYS GONE AND THE POINTS STAY. One number per pro per season, ~3 KB, against
    // ~6,048 rows – see `WorldState.fieldSeasonPoints`. Zero RNG: the finish is already decided.
    if (isFieldProId(playerId)) {
      const earned = pts[finish] ?? 0
      if (earned > 0) {
        world.fieldSeasonPoints ??= {}
        world.fieldSeasonPoints[playerId] = (world.fieldSeasonPoints[playerId] ?? 0) + earned
      }
      continue
    }
    world.results.push({ playerId, week: world.week, points: pts[finish] ?? 0, tier: event.tier })
  }
  recordTourChampion(world, event, result)
  announceTourChampion(world, event, result)
}

/** THE WINNER OF A RESOLVED BRACKET, or null if it produced none. `runTournament` stamps her
 *  explicitly – `finishes[alive[0].id] = 0` (season/tournament.ts) – so this reads a decision that
 *  has already been made rather than re-deriving one.
 *
 *  ⚠ ONE FUNCTION FOR BOTH READERS, and that is the point of extracting it. The tally below and the
 *  news line further down must never disagree about who won a tournament; two copies of
 *  `find(([, f]) => f === 0)` are two chances for a later change to make them. */
function championOf(result: TournamentResult): string | null {
  return Object.entries(result.finishes).find(([, f]) => f === 0)?.[0] ?? null
}

/** ⭐⭐ v64 – THE CHAMPION IS WRITTEN DOWN. One line of bookkeeping against a defect that had run
 *  since the canonical brackets existed: every AI tournament in the game computed its winner and
 *  then discarded her.
 *
 *  ⚠ WHY THIS IS NOT A LEDGER ROW, and it is v53's measured argument rather than a preference.
 *  `world.results` is pruned on a 52-week window sized for 199 people and is what `computeRanking`
 *  reads; ~30 canonical champions a week would be ~30 rows a week into the structure the STANDINGS
 *  are made of, and a change that moves a ranking is a change to the world. This moves nothing: it
 *  is a tally nothing but a census reads, two numbers deep by (rung, champion).
 *
 *  ⚠ ZERO RNG, ZERO DRAWS, POST-DRAW BY CONSTRUCTION. The bracket has already been resolved by the
 *  time this runs – `result.finishes` is a table being read, not rolled – so the frozen MAIN capture
 *  (41550 / e6b0c709) cannot see this and neither can any sub-stream.
 *
 *  ⚠ EVERY EVENT, THE KID'S INCLUDED, which is the one place this deliberately differs from
 *  `announceTourChampion` below. That function skips the event she ENTERED because her shadow run
 *  and the canonical bracket are two universes for one event id and two champions in one week's news
 *  would be a lie about the story. This is not news: it is the field's record of the field's own
 *  tour, so it holds the canonical winner of every bracket that ran and the tally therefore counts
 *  exactly as many titles as there were AI tournaments. */
function recordTourChampion(world: WorldState, event: SeasonEvent, result: TournamentResult): void {
  const championId = championOf(result)
  if (!championId) return
  world.fieldSeasonTitles ??= {}
  const rung = (world.fieldSeasonTitles[event.tier] ??= {})
  rung[championId] = (rung[championId] ?? 0) + 1
}

// WHICH RUNGS' CANONICAL CHAMPIONS MAKE THE NEWS – now `tierMakesWorldNews` in world/matchNews.ts,
// moved there whole by round 23 #3b when the retirement line became its second reader. The rule and
// the feed-budget arithmetic behind it are unchanged; see that function's own note.

/** THE W TOUR CAN NAME ITS CHAMPION NOW, AND SHE CAN BE A PROFESSIONAL (W3-FIELD3, acceptance
 *  criterion 2). Before this wave the canonical brackets resolved in silence and the only champion
 *  line in the game was `finalizeTournament`'s, about the draw SHE played in; the field's ⚠ said in
 *  as many words that AI W-tour news could name LIVE players only, because no pro was ever in a
 *  canonical draw to win one.
 *
 *  ⚠ ONE TOURNAMENT, ONE CHAMPION. The event she ENTERED is skipped here, because her shadow run
 *  and the canonical bracket are two different universes for the same event id (they always have
 *  been – separate streams, separate fields) and printing both would put two champions of one
 *  tournament in one week's news. Hers is the draw she actually played, so hers is the one that
 *  speaks. This reads `world.entries`, i.e. player input – deliberately, and it is confined to a
 *  news row: ZERO RNG, no ledger row, nothing any draw or ranking can see.
 *
 *  Names resolve through `playerShortName`, the same id→name function every bracket surface uses,
 *  so an `fp-` id comes back as a person rather than as an id.
 *
 *  ⭐⭐⭐ ROUND 26 #10 – AND SINCE 25.08 THE LINE SAYS WHO SHE IS, NOT ONLY WHAT SHE WON.
 *
 *  The owner, of the four college years: «В новостях во время колледжа вообще пустота, как будто мир
 *  умер». The inventory (`tools/college-news-probe.ts`) found the opposite of an empty feed – the
 *  Home card at rest holds ~15 rows and ~10 of them are THIS line – so the silence was never a
 *  missing row. It was that twenty-nine times a season the world said «a stranger won a tournament»
 *  and there was no way to tell that the strangers were different strangers.
 *
 *  ⚠⚠ AND THE FIX HERE COSTS NOT ONE ROW OF THE FEED BUDGET, WHICH IS WHY IT IS A CLAUSE AND NOT A
 *  SECOND EVENT – measured, not assumed. During a four-year freeze the feed runs at the ORDINARY
 *  FLOOR and stays there: `rest` is pinned at exactly `EVENTS_ORDINARY_FLOOR` = 120 rows at every
 *  one of the eight rest states, because her lifetime match rows (241-257, protected as radar
 *  evidence) plus her kept milestones (23-40) fill the remainder of `EVENTS_CAP` = 400. So the
 *  ordinary window is ~24 weeks deep, the snapshot then takes the last 60 rows of ALL classes on
 *  top of that (~11 weeks), and a college player sees the world only at the eight weeks a press
 *  hands control back. A once-a-season row written at the season boundary is therefore invisible to
 *  him BY CONSTRUCTION – the arithmetic, not bad luck. A clause on a line that is already in every
 *  window he opens (~10 of the ~15 rows on the card) is seen every time and costs nothing.
 *
 *  ⚠ THREE FACTS, ALL READ AND NONE INVENTED. Her age is `AiPlayer.ageYears` – for a professional
 *  that is `debutAge + seasons since her debut`, the succession's own arithmetic – and the two
 *  clauses are `careerAt(...)`: `debutSeason === this season` is a debutante, and a career index
 *  that changes at the next boundary is somebody playing a last year. They are the same two
 *  questions `world/fieldNews.ts` asks from the other side, so the champion line and the farewell
 *  can never tell different stories about one person. Zero draws: pure in (seed, chair, season).
 *  NO PRONOUN NAMES A PROFESSIONAL, the rule the farewell lines keep one module over.
 *
 *  ⚠ THE SENTENCE STILL CONTAINS « won the », which `tests/events.test.ts` matches on by regex. */
function championNote(world: WorldState, championId: string): string {
  // The kid is named by her own summary line, never by this one, and a cohort girl's age is on her
  // row; only a field pro has a chair whose succession can be asked about.
  const age = isFieldProId(championId)
    ? fieldProsOf(world).find((p) => p.id === championId)?.ageYears
    : world.cohort.find((c) => c.id === championId)?.ageYears
  if (age === undefined) return ''
  if (!isFieldProId(championId)) return `, at ${age}`
  const season = seasonIndexOf(world.week)
  const chair = Number(championId.slice(FIELD.idPrefix.length))
  const career = careerAt(world.seed, chair, season)
  if (career.debutSeason === season) return `, at ${age} – a first season on tour`
  if (careerAt(world.seed, chair, season + 1).index !== career.index) return `, at ${age} – in a last season on tour`
  return `, at ${age}`
}

function announceTourChampion(world: WorldState, event: SeasonEvent, result: TournamentResult): void {
  if (!tierMakesWorldNews(event.tier)) return
  if (world.entries.includes(event.id)) return
  // ⚠ v64: THE SAME `championOf` THE TALLY USES – see its note. The line and the record can no
  // longer name different winners, because there is only one function that names one.
  const championId = championOf(result)
  if (!championId) return
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `🏆 ${playerShortName(world, championId)} won the ${TIERS[event.tier].label}${championNote(world, championId)}.`,
  })
}

/** ⭐ PHASE 5 OF THE WEEKLY TICK – the rest of the world plays, and the week closes.
 *
 *  Called last from `tickWeek`. `field` is the week folded once (world/weekField.ts) – the same
 *  object her own competition was judged against three phases earlier, which is the whole point of
 *  folding it. Takes no `rng`: every draw in here is event-scoped. */
export function closeTheWeek(world: WorldState, field: WeekField): void {
  const { scheduled, aiRanking, rivalFatigue, rivalEntries, tour: tourWeek } = field
  // 4. canonical AI tournaments for ALL scheduled events. ZERO main-stream draws: each event's
  //    bracket runs on its own `seed:aitour:<event.id>` stream, so the calendar's SIZE no longer
  //    touches the weekly draw count. The main stream ends here carrying base costs + drift only.
  //
  //    ⚠ DRAW THE WHOLE WEEK, THEN RESOLVE IT, THEN PLAY IT (31.07 – «они физически не могут сразу
  //    везде играть, ведь так?»). It used to be one loop that drew and played each event in turn,
  //    which is why the same rival could be in two of a week's draws: each `selectEntrants` call saw
  //    the same condition map and nothing else about the week. The three phases below are the ONLY
  //    way to say "not twice" without touching a draw:
  //      4a. every event draws its field exactly as it always did – same stream, same order, same
  //          count. Safe to hoist because it always was independent of the brackets: `aiRanking` and
  //          `rivalFatigue` are snapshots taken above, `world.cohort` is read-only here, and
  //          `runAiTournament`'s ledger rows are never read back inside the same week. So phase 4a
  //          returns, event for event, precisely what the old loop's first line returned.
  //      4b. pure post-draw arithmetic on those arrays – higher tier keeps her, the loser backfills
  //          by standings position. ZERO draws on any stream (season/tournament.ts).
  //      4c. the brackets play, in the ORIGINAL calendar order and each on the very number of its
  //          own sub-stream it was going to read, so the ledger's row order is unchanged too.
  //
  //    ⚠ AND A WEEK NOW HOLDS TWO UNIVERSES (W3-FIELD3). The W events draw from LIVE ∪ pros against
  //    the merged W table; the six junior/domestic rungs draw from the cohort against the mixed one.
  //    4b spans both with ONE `booked` set, because it has to: the cohort's 16-18s are eligible for
  //    both tours, so "she cannot be in two draws" is a claim about the WEEK and not about a track.
  //
  //    ⚠ AND 4b½: THE HELD SLOTS (W3-ONRAMP). The W rungs keep `ON_RAMP.slots` of their draws for
  //    LIVE players coming up from the junior table – the closed loop W3-FIELD3 left behind was that
  //    a cohort player could never be drawn into a W event, so could never earn a W point, so could
  //    never leave the position that kept her out (measured: 0.0 LIVE W rows a season). It runs
  //    AFTER 4b on purpose, from the players the resolved week has left free: see `fillWeekOnRamps`.
  const weekDraws = scheduled.map((e) => drawAiEntrants(world, e, aiRanking, tourWeek, rivalFatigue, rivalEntries))
  const weekFields = resolveDoubleBookings(weekDraws, world.cohort, aiRanking, rivalFatigue, {
    universe: tourWeek.universe,
    ranking: tourWeek.ranking,
  })
  fillWeekOnRamps(world, weekDraws, weekFields, aiRanking, tourWeek, rivalFatigue, rivalEntries)
  for (const d of weekDraws) {
    runAiTournament(world, d.event, weekFields.get(d.event.id) ?? d.entrants, d.rng, rivalFatigue)
  }

  // 5-6. rank recompute + housekeeping. For a reveal week these are deferred to finalizeTournament
  //      (after the kid's points land), so the rank milestones keep their id order behind the kid's
  //      match/summary events. A normal week resolves them inline as before.
  if (!world.pendingTournament) {
    recomputeRankAndMilestones(world)
    housekeep(world)
    // ⚠ THE SEASON'S COMMITMENT IS SETTLED ON THE WRAP WEEK AND BEFORE THE WRAP-UP READS ANYTHING
    // (W3-ACT2 §6). `maybeFireSeasonWrapUp` fires on the first off-season week; the 500-level quota
    // is a fact about the season that has just finished, so it has to be charged on the same week
    // and ahead of the summary that reports it. Both are no-ops on every other week and neither
    // draws. `isSponsorReviewWeek` is the same predicate one line's worth of arithmetic away, which
    // is deliberate: the tour and the brands both settle up in the first quiet week.
    if (isSponsorReviewWeek(world.week)) settleMandatoryQuota(world, world.week)
    maybeFireSeasonWrapUp(world)
    // 7. W2-ENDINGS – WHERE THE CAREER ENDS. Last, and AFTER the wrap-up, because the natural end's
    //    offer is a reading of the season that has just closed: `seasonHistory` has to have that
    //    row in it before the plateau can be measured against it. Pure state, ZERO draws on any
    //    stream, and `tickWeek` still has no ended-world early return (see world/endings.ts).
    resolveEndings(world)
  }
}
