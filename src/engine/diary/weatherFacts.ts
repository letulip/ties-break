// ⭐ ROUND 53 · STEP 10 (weather stage 1, spec §3.3) – THE WEATHER OF THE TOURNAMENT SHE PLAYED THIS WEEK,
// as two booleans the diary's licences can read. A LEAF: it re-derives the event's day from the event's
// own id and surface through `eventWeather` (a pure function of the seed – nothing is stored, nothing is
// drawn from MAIN), so the diary says exactly what the plate on the match header said.
//
// «Heat» is the owner's own threshold (spec §3.3: 30 and over). «Rain» is the day the weather drew
// `falling` – `possible` is a sky, not a fact about the week, and no line may say it rained on it.
import { eventWeather } from '../season/preview'
import type { WorldEvent } from '../../shared/protocol'

export const HEAT_AT_C = 30

export interface TournamentWeatherFacts {
  heatDay: boolean
  rainDay: boolean
}

export function tournamentWeatherIn(events: readonly WorldEvent[], week: number, seed: string): TournamentWeatherFacts {
  const m = events.find((e) => e.week === week && e.match !== undefined && e.friendly !== true)
  // A hand-built or old row with no surface cannot be asked what day it was: no fact, so no line.
  if (!m || !m.match || !m.match.surface) return { heatDay: false, rainDay: false }
  const w = eventWeather(seed, { id: m.match.eventId, surface: m.match.surface, week })
  return { heatDay: w.temperatureC >= HEAT_AT_C, rainDay: w.rain === 'falling' }
}
