// ⭐ ROUND 53 · STEP 11 – WEATHER STAGE 2: THE MATCH READS THE DAY (docs/specs/weather-2026-10.md §4).
//
// The day was drawn in stage 1 (the season preview, off the event's own weather sub-stream).
// Everything here is ARITHMETIC on that already-drawn fact: zero draws on any stream, and the
// match's own stream still takes exactly one `rng()` per point. Each effect is a multiplier on a
// term the model already had, read by the closed form AND the point loop from this one file, so
// the card's number and the match that is played describe the same day.
//
//   · heat  – fatigue starts EARLIER and runs steeper by `heatFatigueFactor` (both players, the
//             loop through `heatFatigueTerm`, the closed form through its fitted `heatLegsFactor`
//             since r53 W1), and the retirement hazard × the factor on the unchanged fatigue;
//   · wind  – first serve down (a loss to every server) and unforced errors up (the matchup
//             diluted towards the level of the day), symmetric by construction;
//   · rain  – `falling` on clay only: the heavy ball, the same two levers, smaller. On hard and
//             grass the rain is a delay and nothing else – the pre-match number does not move.

import type { MatchWeather, Surface } from './types'

/** At and below this the heat costs nothing (spec §4: «множитель 1.0 при ≤ 27°»). */
export const HEAT_START_C = 27
/** ...and the multiplier reaches its ceiling here – the top of stage 1's hottest band (hard, summer). */
export const HEAT_FULL_C = 38
export const HEAT_MAX_FACTOR = 1.6

/** How much faster she tires today: 1.0 at ≤ 27 °C, linear to 1.6 at 38 °C, flat above. `undefined`
 *  (no weather on the match – every legacy record, every fixture) is exactly 1. */
export function heatFatigueFactor(temperatureC: number | undefined): number {
  if (temperatureC === undefined || temperatureC <= HEAT_START_C) return 1
  const t = Math.min(temperatureC, HEAT_FULL_C)
  return 1 + ((HEAT_MAX_FACTOR - 1) * (t - HEAT_START_C)) / (HEAT_FULL_C - HEAT_START_C)
}

/** The two levers, as the spec states them: first-serve percentage down by `firstServePp` (a
 *  fraction, 0.03 = 3 pp) and unforced errors up by `errorRise` (0.05 = +5%). */
export interface WeatherLevers {
  firstServePp: number
  errorRise: number
}

export const WIND_LEVERS: Record<MatchWeather['wind'], WeatherLevers> = {
  none: { firstServePp: 0, errorRise: 0 },
  fresh: { firstServePp: 0.03, errorRise: 0.05 },
  strong: { firstServePp: 0.06, errorRise: 0.1 },
}
/** Rain that is FALLING on clay – the heavy ball. Nowhere else does rain touch the point. */
export const RAIN_CLAY_LEVERS: WeatherLevers = { firstServePp: 0.02, errorRise: 0.05 }

/** ⚠ THE MODEL HAS NO FIRST SERVE AND NO UNFORCED ERROR – it has one number, p(server wins the
 *  point). These two constants translate the spec's levers into that number, and they are the
 *  whole of the translation:
 *  · a first serve missed turns a first-serve point into a second-serve point, which the server
 *    wins ~17 pp less often (WTA: ~62% won behind the first serve, ~45% behind the second) – so
 *    −3 pp of first serves is −0.03 × 0.17 ≈ −0.5 pp of p;
 *  · ~30% of points end in an unforced error, and an error is the one way a point ends that knows
 *    nothing about who is better – so +5% errors makes 1.5% more of the match a coin the skill gap
 *    does not reach, which is the gap × (1 − 0.05 × 0.30), towards the level of the day. */
export const FIRST_SERVE_POINT_GAP = 0.17
export const UNFORCED_ERROR_SHARE = 0.3

/** The levers the day pulls on this surface, summed (wind and rain on clay can both blow). */
export function weatherLevers(w: MatchWeather | undefined, surface: Surface): WeatherLevers {
  if (!w) return { firstServePp: 0, errorRise: 0 }
  const wind = WIND_LEVERS[w.wind]
  const rain = w.rain === 'falling' && surface === 'clay' ? RAIN_CLAY_LEVERS : { firstServePp: 0, errorRise: 0 }
  return { firstServePp: wind.firstServePp + rain.firstServePp, errorRise: wind.errorRise + rain.errorRise }
}

/** The weather's say in one serve's p, BEFORE the clamp: the matchup part (`p − level`) diluted by
 *  the extra errors, then the first-serve loss. `level` is the tour's serve level on this surface –
 *  what p is between two identical players – so the dilution moves nothing between equals and the
 *  first-serve loss is the one thing both servers share. Exactly `p` on a calm, dry (or non-clay) day. */
export function weatherPServe(p: number, level: number, w: MatchWeather | undefined, surface: Surface): number {
  const { firstServePp, errorRise } = weatherLevers(w, surface)
  if (firstServePp === 0 && errorRise === 0) return p
  return level + (p - level) * (1 - errorRise * UNFORCED_ERROR_SHARE) - firstServePp * FIRST_SERVE_POINT_GAP
}

/** What a played match RECORDS of its day: the weather when it touched the match – heat past the
 *  knee, any wind, or rain falling (a delay on hard and grass, the toll's −1 everywhere) – and
 *  `undefined` otherwise, so a calm match's record is byte-identical to one played before this. */
export function playedWeather(w: MatchWeather | null | undefined): MatchWeather | undefined {
  if (!w) return undefined
  if (heatFatigueFactor(w.temperatureC) === 1 && w.wind === 'none' && w.rain !== 'falling') return undefined
  return { temperatureC: w.temperatureC, wind: w.wind, rain: w.rain }
}
