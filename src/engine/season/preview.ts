// THE TOURNAMENT PREVIEW – what the Season card can honestly say about an event she has not played.
//
// Three things, and they answer to different standards of truth:
//
//   1. HER CHANCE IN ROUND ONE. A real number, not a mood. The engine already owns a closed-form
//      match probability (`fastMatchProbability`, which is what resolves every AI-vs-AI match), and
//      it already builds each event's field deterministically. So the preview builds the field the
//      same way the bracket will, draws her into it with the SAME shared helper, and asks the same
//      formula who wins. Nothing here is a model of the model.
//
//   2. HOW STRONG THE FIELD IS. Words, because a second percentage on the same card would be two
//      numbers competing to say one thing.
//
//   3. THE WEATHER. Decorative, and labelled as such (the owner: «пока декоративно рандомно»). It
//      touches nothing the simulation reads.
//
//   4. THE CROWD. Decorative too, and built to the weather's pattern rather than a second one of
//      its own (the owner: «можно как-то прикинуть какие-то коридоры для разного уровня турниров»).
//      A corridor per tier, so the ladder can be FELT on a card. It touches nothing either – see
//      the warning on `eventCrowd`, which is the whole point of the field existing at all.
//
// WHAT THE PREVIEW CANNOT KNOW, and says so in its own type: the field is drawn from the standings
// AS THEY ARE TODAY. By the time the event plays they will have moved - other girls will have won
// and lost. That makes this an estimate about a field she would meet if it started now, which is
// the information the PLAYER has when deciding whether to enter. Never a prophecy.
//
// WHO TURNS UP AND HOW STRONG THEY ARE ARE TWO QUESTIONS, and the preview answers them from two
// different places. The bracket now gates entry on condition exactly as the kid is gated (a wrecked
// rival sits the week out), so WHO is in the draw depends on today's fatigue - and the preview must
// use it, or it would name an opponent who will not be there. HOW STRONG they are is the next
// paragraph: rested, always.
//
// THE FIELD IS PREVIEWED RESTED, and that is a correction, not a simplification. The first version
// scaled every opponent by her condition TODAY, which sounded more truthful and was much less so:
// measured over 10 careers at week 40, the elite band's median condition is 10 out of 100 and it is
// at or below 5 in 45% of weeks, so a J30 card eight weeks out read 81% when the same draw against a
// rested field reads 52%. Their exhaustion today says nothing about their condition on a week that
// has not happened; quoting it turns a transient into a promise, and the transient is enormous.
// So opponents are previewed at full condition: "this is who is there, and this is her chance
// against them at their best". The card understates rather than flatters.
//
// RNG DISCIPLINE. Every draw that builds the FIELD comes off `seed:kidtour:<eventId>` - the event's
// own sub-stream, created fresh, read, and thrown away. Building a preview cannot move the MAIN
// weekly stream, so the frozen capture is untouched; and because it is the same stream in the same
// order as the real run, a preview taken on the event's own week names the opponent she actually
// gets. The two decorative readings take the same discipline one step further: each has its OWN
// purpose-scoped sub-stream (`seed:weather:`, `seed:crowd:`), so decoration cannot perturb even the
// draw, let alone the world.

import { rngFromSeed } from '../rng'
import { ECONOMY } from '../economy'
import { fastMatchProbability } from '../match/engine'
import { ratingOf } from '../match/rating'
import type { MatchPlayer, Surface } from '../match/types'
import { rivalConditions, rivalMatchPlayer } from './rival'
import {
  JUNIOR_TOUR,
  buildDraw,
  firstRoundOpponent,
  kidSeedIndexIn,
  selectEntrants,
} from './tournament'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from './types'
import type { SeasonResult } from './ranking'

/** How the field she would meet compares with her. Three bands, because a card has room for one
 *  short clause and the player only needs to know which way to lean. */
export type FieldStrength = 'favourite' | 'even' | 'strong'

export interface EventPreview {
  /** her probability of winning the FIRST match, 0..1 – the only round a preview can speak for
   *  without simulating a whole bracket, and the round that decides whether the trip was worth it */
  firstMatchChance: number
  /** the opponent that chance is against, so the card can name her rather than assert a number */
  opponentName: string
  opponentRank: number | null
  /** ⚠ THE TWO NUMBERS THE CHANCE IS MADE OF (round 21, the owner's D&D ruling: «шансы выиграть
   *  должны быть у всех, но не у всех одинаковые», and «чтобы игрокам не биться головой в бетон»).
   *
   *  `firstMatchChance` above is a percentage the player has no way to check. These are its INPUTS,
   *  on the surface this event is played on, and they satisfy
   *      firstMatchChance = 1 / (1 + 10^((opponentRating - kidRating) / 400))
   *  to inside a percentage point over the whole reachable build range (tests/rating.test.ts).
   *
   *  ⚠⚠ AND NOTHING DRAWS THEM. THIS IS A RULING, NOT DEAD CODE THAT NOBODY NOTICED. The «Rating
   *  1642 vs 1801» line under the odds ring lived on the calendar card and the season card for two
   *  commits; the owner took it off, round 21: «я не просил этого делать, лишняя информация, убери
   *  пожалуйста». The full argument is at the top of engine/match/rating.ts – in short, he asked for
   *  the odds to BE a formula, not for the card to print one.
   *
   *  They are computed anyway, and on purpose: they are the audit trail of the ring beside them (one
   *  source, two readings, so a quoted rating can never disagree with the percentage it explains),
   *  they cost two pure calls on a preview that already ran the match model, and the day a surface is
   *  wanted the pipe is already built and already measured. ⚠ If the answer is instead "take the pipe
   *  out too", that is a second decision and it is his, not a tidy-up.
   *
   *  Null when there is no first-round opponent to be rated against. */
  kidRating: number
  opponentRating: number | null
  fieldStrength: FieldStrength
  /** decorative, deterministic per event; degrees C */
  temperatureC: number
  /** decorative, deterministic per event; how many people are there to watch – see eventCrowd */
  crowd: number
}

/** The kid's slot is the one `runTournament` gives her. The two share `buildDraw` outright – the
 *  preview cannot call `runTournament`, which PLAYS the bracket, but it must not build a second one
 *  either, so the draw is one function and both callers pass it the same stream at the same
 *  position. */
function drawnField(
  event: SeasonEvent,
  cohort: AiPlayer[],
  ranking: RankingRow[],
  conditions: ReadonlyMap<string, number>,
  kid: MatchPlayer,
  seed: string,
  excluded: ReadonlySet<string> | undefined,
  /** ⭐ ROUND 31 #3 – and it is the SECOND table, exactly as `computeShadowTournament` takes one.
   *  `selectEntrants` above positions the CANDIDATES (`ranking`); `kidSeedIndexIn` below positions
   *  HER, and the bracket has read those two off different tables since round 21 #4. See
   *  `previewEvent`'s `standing` parameter for the full argument. */
  standing: RankingRow[],
): MatchPlayer[] {
  const rng = rngFromSeed(`${seed}:kidtour:${event.id}`)
  // `conditions` decides WHO is drawn (the same availability gate the bracket applies); the max
  // below decides how strong they are. See the two notes at the top of this file.
  const entrants = selectEntrants(event, cohort, ranking, rng, conditions, excluded).map((p) =>
    rivalMatchPlayer(p, event.surface, ECONOMY.condition.max),
  )
  return buildDraw(event, entrants, kid, kidSeedIndexIn(entrants, standing, kid.id), rng)
}

/** Where she would sit among the entrants if the field were drawn today. `strong` = most of them
 *  are ahead of her, `favourite` = most are behind. The thresholds are deliberately coarse: this
 *  is a lean, not a measurement, and the number beside it is the one that has to be right.
 *
 *  ⭐⭐⭐ ROUND 31 #3 – IT COUNTS WHO IS BETTER, NOT WHO IS RANKED HIGHER, AND THE TWO THRESHOLDS
 *  DID NOT MOVE ONE POINT. This used to read a STANDINGS TABLE, and the round's defect (b) is what
 *  that costs: on the owner's w933 save a thirty-one-year-old professional sits **199 of 200** in
 *  the ITF table – her junior points expired thirteen years ago – so every junior and every
 *  domestic card read `strong` against fields she outrates by 120 points, and the promise probe
 *  reported `DEGENERATE: only one band occurs in these careers`.
 *
 *  ⚠⚠ AND RE-SCALING 0.75/0.35 WOULD HAVE BEEN EXACTLY THE WRONG FIX, because the bands were never
 *  mis-cut – they were being applied to a quantity that does not measure the thing. Measured over
 *  the cohort on that save, the Spearman between a player's STANDINGS POSITION and her actual
 *  rating is **0.11** on the ITF table, 0.53 on the table the bracket selects from, 0.59 on the
 *  domestic one and 0.64 on the professional one. Not one of the four tables answers "who is
 *  better" well, and a wider threshold on a bad proxy just spreads the labels out over noise.
 *
 *  ⭐ SO IT READS THE SAME SOURCE THE RING BESIDE IT IS MADE OF. `ratingOf` on this event's surface
 *  is what `fastMatchProbability` plays the match with and what `kidRating` / `opponentRating`
 *  already quote – the file's own rule, three lines down, is *"one source, two readings, so the card
 *  can never quote a rating that disagrees with the ring beside it"*. This is the third reading of
 *  that one source, which is what makes band-versus-ring agreement STRUCTURAL rather than hoped for:
 *  the ring is a function of (her rating − the opponent's), the opponent is drawn out of this very
 *  field, and both are read at the same instant off the same `ratingOf`. tests/preview.test.ts
 *  asserts the pair cannot contradict and mutates to prove the assertion bites.
 *
 *  ⚠⚠ AND SHE IS READ RESTED, WHICH IS THE OTHER HALF OF A RULE THIS FILE ALREADY STATES AND WAS
 *  ONLY APPLYING TO THE FIELD. The header's own paragraph – *"THE FIELD IS PREVIEWED RESTED, and
 *  that is a correction, not a simplification… Their exhaustion today says nothing about their
 *  condition on a week that has not happened; quoting it turns a transient into a promise"* – is
 *  exactly as true of HER. `kid` arrives with `conditionMatchFactor(world.condition)` already
 *  multiplied into her five attributes, so a rating-based band read off it would move every time she
 *  got tired.
 *
 *  ⚠ IT WAS MEASURED MOVING, NOT REASONED ABOUT. With `kid` used for both readings,
 *  `tools/r31-draw-stability.ts` on the w933 save reported **3 of 24** tournaments changing band over
 *  six weeks, against **0 of 24** before – a regression against exactly the property round 31 #4
 *  shipped the band for. Read rested it is 0 of 24 again.
 *
 *  ⚠ THE RING IS DELIBERATELY NOT CHANGED. `firstMatchChance` is her chance in a match she would
 *  play in the state she is in, and the owner's card has quoted it that way since wave 2; what moves
 *  here is the BAND, which is a statement about the FIELD's level relative to her own and has no
 *  business asking how tired she was the week he happened to look. `kidAtRest` defaults to `kid`, so
 *  a caller that does not distinguish them gets the pre-change reading.
 *
 *  ⚠ IT IS STILL A READING OF THE **FIELD**, WHICH IS WHY IT HOLDS STILL WHILE THE RING MOVES. The
 *  share is over every entrant, so it changes only when the field's composition does – the property
 *  round 31 #4 measured (0 of 24 events moved band on the w933 save) and the reason the band is the
 *  one thing a pre-draw card is allowed to say. See docs/specs/tier-ladder-and-band.md. */
function strengthOf(
  alive: readonly MatchPlayer[],
  kid: MatchPlayer,
  surface: Surface,
): FieldStrength {
  const mine = ratingOf(kid, surface, JUNIOR_TOUR)
  const ahead = alive.filter((p) => p.id !== kid.id && ratingOf(p, surface, JUNIOR_TOUR) > mine).length
  const share = alive.length > 1 ? ahead / (alive.length - 1) : 0
  if (share >= 0.75) return 'strong'
  if (share <= 0.35) return 'favourite'
  return 'even'
}

/** Decorative weather. Its own sub-stream so it can never perturb the draw, and keyed on the event
 *  so a tournament's day is the same every time the card is rendered. Bands are loosely seasonal by
 *  surface: clay is the spring/summer swing, grass high summer, hard the shoulders.
 *
 *  ⚠ ROUND 26 #6 – IT TAKES AN ID AND A SURFACE, NOT A `SeasonEvent`, AND THAT IS A WIDENING RATHER
 *  THAN A CHANGE. A `SeasonEvent` still satisfies it, every existing call site is byte-identical and
 *  no number moved; what it buys is that the College League – a fixture with no calendar event and
 *  no rung behind it – gets its day out of the SAME function rather than out of a second copy of
 *  this formula. Two weather functions is how one tournament comes to have two days. */
export function eventTemperature(seed: string, event: { id: string; surface: Surface }): number {
  const rng = rngFromSeed(`${seed}:weather:${event.id}`)
  const [lo, hi] =
    event.surface === 'grass' ? [19, 29] : event.surface === 'clay' ? [16, 28] : [12, 26]
  return Math.round(lo + rng() * (hi - lo))
}

// THE CROWD, tier by tier. The corridor the owner asked for, and it is NOT invented here: every
// band below is the venue docs/lore/setting.md §6 already describes, converted to a headcount.
//
//   local     "Parents on a wooden bench, one dog."                              10-40
//   j30       "Still no crowd."                                                  30-90
//   regional  a proper club, a flip scoreboard, "maybe thirty people"            45-130
//   j60       "a small stand along one court", a camera nobody is watching      110-320
//   national  a national training centre, an umpire chair, a real stand         220-650
//   j300      "a show court, actual seating, a media wall, agents on the fence" 900-2600
//
// ⚠ THE ORDER IS PRODUCTION SCALE, NOT PRESTIGE, and the two deliberately disagree: j30 sits BELOW
// regional and j60 below national, because a J30 abroad is thirty parents from nine countries and a
// national championship at home is a stand full of people who know her. That is the lore's own
// reading ("Still no crowd" at the rung that costs $900-2,000 to reach) and it is the point the
// figure makes: she flies further and further to play in front of fewer and fewer people, until
// J300 - the one rung where a junior plays in front of strangers. Note also that setting.md §6
// warns against building on tier PRESTIGE while the points retable is open, and in the same
// breath that production scale "does not move". This field is banded on the half that does not move.
//
// ⚠ DECORATIVE, AND IT MUST STAY DECORATIVE. Nothing in the simulation may read it - not condition,
// not nerves, not prize money. Those are real systems with their own specs and their own balance
// evidence; a free number that quietly becomes an input to one of them stops being free and starts
// needing a schema, a capture re-pin and a balance sweep. Pinned by a grep guard in
// tests/preview.test.ts, exactly as the weather is.
//
// PER EVENT, NOT PER ROUND. A final really does draw more than a first round, but neither surface
// that shows this number has a round to scale by: `EventPreview` describes an event she has not
// entered (no round exists yet) and screen E's brief is rendered before round one. Scaling would
// therefore make the SAME field mean "the first round's crowd" on one card and "the tournament's
// crowd" on the other, which is worse than not modelling it. If a round ever wants its own gate,
// it should take a round argument and be a second reading, not a re-interpretation of this one.
const CROWD_BANDS: Record<TierId, readonly [number, number]> = {
  local: [10, 40],
  regional: [45, 130],
  national: [220, 650],
  j30: [30, 90],
  j60: [110, 320],
  j300: [900, 2600],
  // THE ADULT TOUR REPEATS THE JOKE ONE TABLE UP, because the real one does. A W15 is played on an
  // outside court of a club in a town nobody has heard of, in front of the other players' parents
  // and a groundsman – twenty to seventy people, which is FEWER than a Regional and fewer even than
  // a J30. She has just turned professional and the stand is emptier than the one she played her
  // national under-14s in. That is exactly the shape j30-under-regional already draws, and it is the
  // same sentence the table's note makes about production scale disagreeing with prestige: this is
  // the first rung of the WOMEN'S PROFESSIONAL TOUR and it is the quietest room in the game.
  //
  // W35 buys a small stand and a few locals (60-200, about a J60's room). W100 is the first adult
  // week with a real crowd – a proper club with seating, a scoreboard, a couple of hundred paying
  // spectators and whoever the tournament can pull on finals day (400-1,400) – and note that it is
  // still SMALLER than a J300's 900-2,600. That is not a mistake either: a J300 is a junior Slam
  // feeder with agents on the fence and a national federation busing children in, while a W100 is a
  // Tuesday in a mid-size town. The crowd she plays in front of gets smaller as the tennis gets
  // better, right up until the tour she is climbing towards, which is off this table entirely.
  w15: [20, 70],
  w35: [60, 200],
  // The W2-LADDER middle rungs continue the same production-scale climb: a W50 is a W35 with a
  // second stand (90-280, a shade over a J60's room), a W75 is the first adult week that looks
  // organised on television-less terms (150-500). Both still sit BELOW a J300's 900-2,600 - the
  // agents-on-the-fence joke holds until W100.
  w50: [90, 280],
  w75: [150, 500],
  w100: [400, 1400],
  // The 125 is the first rung whose room finally OUTGROWS a J300: a WTA event proper, a city
  // arena's outer configuration, 1,200-3,500 - the tour she was climbing towards starts being
  // audible from the court. Still decorative; nothing reads it.
  wta125: [1200, 3500],
  // W3-ACT2 – and this is where the joke the table has been telling since `local` finally stops.
  // Every rung so far has been a room: a club, a stand, a city arena's outer configuration. A WTA
  // 250 is a full tournament week in a real venue (3,000-9,000); a 500 fills a show court
  // (7,000-18,000); a 1000 is a stadium (15,000-35,000); a major is a fortnight a country watches
  // (25,000-70,000, which is the ground, not the television). The crowd got SMALLER as the tennis
  // got better right up to the tour she was climbing towards - and these four are that tour.
  // Still decorative; nothing reads these numbers, which is pinned by a grep guard in
  // tests/preview.test.ts exactly as the weather is.
  wta250: [3000, 9000],
  wta500: [7000, 18000],
  wta1000: [15000, 35000],
  slam: [25000, 70000],
}

/** ⭐⭐⭐ ROUND 30 #23 (30.08) – THE CORRIDOR'S MIDPOINT FOR A RUNG, and it is the ONE thing outside
 *  this file that may read the crowd. The owner, overruling the `[GAP]` the brand wave had filed:
 *  «у нас есть понимание **коридора зрителей на каждом турнире**, мне кажется этого достаточно
 *  вполне.»
 *
 *  ⚠⚠ THE CORRIDOR IS NOT THE DRAW, AND THE DISTINCTION IS WHAT KEEPS THE RULING ABOVE INTACT.
 *  `eventCrowd` is a per-event ROLL off `seed:crowd:<eventId>`; nothing in the simulation reads it,
 *  the grep guard in tests/preview.test.ts still says so, and it stays decorative. THIS is the static
 *  table under it – how big the room is at that rung – and it is a pure constant with no stream, no
 *  event id and no week. That matters beyond tidiness: `world/brand.ts`' whole contract is «a
 *  valuation is a fold over history, zero draws», and reading the ROLL would have put a die inside a
 *  valuation. Reading the CORRIDOR cannot.
 *
 *  ⚠ It is a MIDPOINT and never a sample: two careers that played the same rung must be credited the
 *  same room, or the brand would price the dice rather than the schedule. */
export function tierCrowdMid(tier: TierId): number {
  const band = CROWD_BANDS[tier]
  return band ? (band[0] + band[1]) / 2 : 0
}

/** Decorative crowd. Its own sub-stream so it can never perturb the draw, and keyed on the event so
 *  a tournament's gate is the same every time the card is rendered. Banded by tier – see the table
 *  above for where the numbers come from and why nothing may read them.
 *
 *  Rounded to a step that grows with the band (5 / 10 / 50), because an estimate that reads "1,473"
 *  claims a turnstile we do not have. Every band's ends are multiples of their own step, so the
 *  rounding can never push a figure outside its corridor. */
export function eventCrowd(seed: string, event: SeasonEvent): number {
  const rng = rngFromSeed(`${seed}:crowd:${event.id}`)
  const [lo, hi] = CROWD_BANDS[event.tier]
  const step = hi >= 1000 ? 50 : hi >= 200 ? 10 : 5
  return Math.round((lo + rng() * (hi - lo)) / step) * step
}

/** The whole card's worth of preview for one event. Pure; no MAIN-stream draws; nothing persisted. */
export function previewEvent(
  world: {
    seed: string
    week: number
    cohort: AiPlayer[]
    results: SeasonResult[]
  },
  event: SeasonEvent,
  /** ⭐ WHO TURNS UP – the table `selectEntrants` positions the candidates on, and it must be the
   *  one the BRACKET selects from or the card previews a field the tournament will not field. See
   *  the `standing` note below for the pair this is half of. */
  ranking: RankingRow[],
  kid: MatchPlayer,
  /** WEEK EXCLUSIVITY (W2-FIELD2): whoever a HIGHER W rung of this same week has already drawn. The
   *  CALLER computes it, because only the caller holds the season – and it must, or the card would
   *  name an opponent the bracket will not contain. See `weekFieldExclusion`. */
  excluded?: ReadonlySet<string>,
  /** ⭐⭐ WHERE **SHE** STANDS AMONG THEM (round 31 #3) – the tier's OWN track's table, and it is a
   *  SECOND table on purpose rather than a widening of the first.
   *
   *  `computeShadowTournament` (world/phaseHerWeek.ts) has taken two tables since round 21 #4 and
   *  spells out why: *"Who TURNS UP must not depend on her… Where SHE STANDS among them must depend
   *  on her and on nothing else - it is the acceptance list's own question, and `rankingFor` is the
   *  table every other surface answers it with, so the draw now agrees with the Season card instead
   *  of contradicting it."* The preview was handed ONE table and used it for both, so the card and
   *  the bracket seeded her from different places – and for a DOMESTIC event they are different
   *  places by a whole table. Two readings, two tables, exactly as the bracket has them.
   *
   *  ⚠ OPTIONAL, AND ABSENT ⇒ `ranking`, WHICH IS BYTE-IDENTICAL TO WHAT THIS FUNCTION ALWAYS DID.
   *  Same discipline as `excluded` above and as `kidMatchPlayerFor`'s optional world keys: a pure
   *  caller that has only one table (a bench, an older test) gets the pre-change preview rather than
   *  a silently different one. */
  standing?: RankingRow[],
  /** ⭐ HER, AT FULL CONDITION – the BAND's reading of her, and the symmetric half of the header's
   *  "THE FIELD IS PREVIEWED RESTED" rule. Built by the caller through the same composer `kid` comes
   *  from, so nothing is inverted here; see `strengthOf` for what it is for and for the 3-of-24
   *  regression that produced it. Absent ⇒ `kid`, which is byte-identical to what this function did
   *  before it existed. */
  kidAtRest?: MatchPlayer,
): EventPreview {
  const standingTable = standing ?? ranking
  const alive = drawnField(
    event,
    world.cohort,
    ranking,
    rivalConditions(world.results, world.week),
    kid,
    world.seed,
    excluded,
    standingTable,
  )
  const opp = firstRoundOpponent(alive, kid)
  return {
    firstMatchChance: opp
      ? fastMatchProbability(kid, opp, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })
      : 0,
    // Same (player, surface, tour) the chance above is computed from - one source, two readings, so
    // the card can never quote a rating that disagrees with the ring beside it.
    kidRating: ratingOf(kid, event.surface, JUNIOR_TOUR),
    opponentRating: opp ? ratingOf(opp, event.surface, JUNIOR_TOUR) : null,
    opponentName: opp?.name ?? '',
    // ⚠ HER RANK COMES OFF THE SAME TABLE THE TOURNAMENT OVERLAY PRINTS IT FROM (round 31 #3).
    // `standingTable` is the tier's own track's, which is exactly what `overlayRanks` in
    // world/snapshot.ts reads – so the rank beside her name on the card and the rank beside it in
    // the draw are one number. Before this they were two for every DOMESTIC event, because the card
    // was handed the ITF table and the overlay reads the domestic one.
    opponentRank: opp ? (standingTable.find((r) => r.playerId === opp.id)?.rank ?? null) : null,
    fieldStrength: strengthOf(alive, kidAtRest ?? kid, event.surface),
    temperatureC: eventTemperature(world.seed, event),
    crowd: eventCrowd(world.seed, event),
  }
}
