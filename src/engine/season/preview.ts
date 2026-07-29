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
// RNG DISCIPLINE. Every draw here comes off `seed:kidtour:<eventId>` - the event's own sub-stream,
// created fresh, read, and thrown away. Building a preview cannot move the MAIN weekly stream, so
// the frozen capture is untouched; and because it is the same stream in the same order as the real
// run, a preview taken on the event's own week names the opponent she actually gets.

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
import type { AiPlayer, RankingRow, SeasonEvent } from './types'
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
): MatchPlayer[] {
  const rng = rngFromSeed(`${seed}:kidtour:${event.id}`)
  // `conditions` decides WHO is drawn (the same availability gate the bracket applies); the max
  // below decides how strong they are. See the two notes at the top of this file.
  const entrants = selectEntrants(event, cohort, ranking, rng, conditions).map((p) =>
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
): EventPreview {
  const alive = drawnField(
    event,
    world.cohort,
    ranking,
    rivalConditions(world.results, world.week),
    kid,
    world.seed,
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
  }
}
