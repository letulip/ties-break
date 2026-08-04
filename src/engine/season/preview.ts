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
import type { MatchPlayer } from '../match/types'
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
  excluded?: ReadonlySet<string>,
): MatchPlayer[] {
  const rng = rngFromSeed(`${seed}:kidtour:${event.id}`)
  // `conditions` decides WHO is drawn (the same availability gate the bracket applies); the max
  // below decides how strong they are. See the two notes at the top of this file.
  const entrants = selectEntrants(event, cohort, ranking, rng, conditions, excluded).map((p) =>
    rivalMatchPlayer(p, event.surface, ECONOMY.condition.max),
  )
  return buildDraw(event, entrants, kid, kidSeedIndexIn(entrants, ranking, kid.id), rng)
}

/** Where she would sit among the entrants if the field were drawn today. `strong` = most of them
 *  are ahead of her, `favourite` = most are behind. The thresholds are deliberately coarse: this
 *  is a lean, not a measurement, and the number beside it is the one that has to be right. */
function strengthOf(alive: readonly MatchPlayer[], kid: MatchPlayer, ranking: RankingRow[]): FieldStrength {
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  const last = ranking.length
  const mine = posOf.get(kid.id) ?? last
  const ahead = alive.filter((p) => p.id !== kid.id && (posOf.get(p.id) ?? last) < mine).length
  const share = alive.length > 1 ? ahead / (alive.length - 1) : 0
  if (share >= 0.75) return 'strong'
  if (share <= 0.35) return 'favourite'
  return 'even'
}

/** Decorative weather. Its own sub-stream so it can never perturb the draw, and keyed on the event
 *  so a tournament's day is the same every time the card is rendered. Bands are loosely seasonal by
 *  surface: clay is the spring/summer swing, grass high summer, hard the shoulders. */
export function eventTemperature(seed: string, event: SeasonEvent): number {
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
  ranking: RankingRow[],
  kid: MatchPlayer,
  /** WEEK EXCLUSIVITY (W2-FIELD2): whoever a HIGHER W rung of this same week has already drawn. The
   *  CALLER computes it, because only the caller holds the season – and it must, or the card would
   *  name an opponent the bracket will not contain. See `weekFieldExclusion`. */
  excluded?: ReadonlySet<string>,
): EventPreview {
  const alive = drawnField(
    event,
    world.cohort,
    ranking,
    rivalConditions(world.results, world.week),
    kid,
    world.seed,
    excluded,
  )
  const opp = firstRoundOpponent(alive, kid)
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  return {
    firstMatchChance: opp
      ? fastMatchProbability(kid, opp, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })
      : 0,
    opponentName: opp?.name ?? '',
    opponentRank: opp ? (ranking.find((r) => r.playerId === opp.id)?.rank ?? null) : null,
    fieldStrength: strengthOf(alive, kid, ranking),
    temperatureC: eventTemperature(world.seed, event),
    crowd: eventCrowd(world.seed, event),
  }
}
