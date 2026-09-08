/**
 * r39-body-seasons – WHAT THE COACH'S «about N more seasons» SAYS ACROSS THE DECLINE, before and
 * after round 39 #13a.
 *
 * Round 39 #13a. The owner, 08.09: «Ей почти 29, а тренер говорит, что она протянет ещё 13
 * сезонов, при этом она уже начинает постепенно сдавать, что видно в статистике сезонов: уже не
 * топ-10». At 99.7% of her own peak and age 29.0 the shipped walk runs to `ENDINGS.lastOfferPeakShare`
 * (0.55 – the share the OFF-SEASON QUESTION runs out at, age ~41-42 on the shipped curve), so the
 * card promises thirteen seasons to a woman the same sentence calls past her peak.
 *
 * ⚠ MEASUREMENT, NOT A CAREER WALK – the same licence r38-decline-shape.ts runs under: past
 * `declineStart` nothing but `declineFactor` moves a physical attribute, so the walk below is exact
 * arithmetic. Both stops are printed side by side:
 *
 *   - 0.55 (`ENDINGS.lastOfferPeakShare`) – the SHIPPED stop before #13a: where the game stops
 *     asking the retirement question. The long goodbye's own dial table: 55% ≈ age 41.2.
 *   - 0.70 (`COACH_BODY_END_SHARE`) – the stop after #13a: the share the deleted hard finish at 38
 *     mapped to (`ending.test.ts` pins the 70% ⇔ 38 equivalence that let `stopAskingAgeYears` be
 *     deleted), i.e. the model's own end of a PROFESSIONAL body, with 0.70→0.55 as the borrowed-time
 *     tail the question (not the coach) owns.
 *
 * The `live` column parses the actual `coachDeclineNote` sentence off a synthetic world at that row,
 * so the wired path is measured too – before the change it must match the 0.55 column, after it the
 * 0.70 column.
 *
 * Run: npx vite-node tools/r39-body-seasons.ts
 */
import { createWorld } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { coachDeclineNote } from '../src/engine/world/coachMarket'
import { declineFactor, physicalMean } from '../src/engine/development'
import type { AgeCurveBounds } from '../src/engine/development'
import { kidAgeExact } from '../src/engine/world/age'
import { ENDINGS } from '../src/engine/ending'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'

const padL = (s: string | number, n: number) => String(s).padStart(n)

/** The exact arithmetic of `seasonsOfBodyLeft`, with the stop as a parameter so both readings of
 *  "the end of a body" can sit in one row. Same loop, same weekly compounding, same 40-year cap. */
function walkSeasons(share: number, age: number, bounds: AgeCurveBounds, stop: number): number {
  let left = share
  let walked = age
  let weeks = 0
  while (left > stop && weeks < 40 * WEEKS_PER_YEAR) {
    left *= 1 - declineFactor(walked, bounds)
    walked += 1 / WEEKS_PER_YEAR
    weeks++
  }
  return weeks / WEEKS_PER_YEAR
}

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number): SeasonHistoryEntry {
  const byTrack = {
    domestic: { ...EMPTY_ROW },
    itf: { ...EMPTY_ROW },
    wta: { ...EMPTY_ROW, endRank: wtaRank },
  } as Record<LadderTrack, SeasonTrackRow>
  return { seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0, byTrack }
}

/** A synthetic past-peak world at (age, share) – the r38-decline-voice fixture's shape, never a
 *  player save. The season rows give `seasonRankRead` a one-place fall so the sentence also
 *  exercises #13c's singular. */
function worldAt(age: number, share: number, stored?: { plateauStart: number; declineStart: number }): WorldState {
  const world = createWorld('r39-seasons', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.week = Math.round((age - START_AGE) * WEEKS_PER_YEAR)
  // nudge the week until her exact age reaches the row's target (and clears declineStart, so the
  // note actually speaks) – kidAgeExact anchors on her birth date, not on week/52
  const ds = stored?.declineStart ?? 29
  const target = Math.max(age, ds)
  while (kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay) < target && world.week < 2200) world.week++
  world.peakPhysical = physicalMean(world.skills) / share
  world.seasonHistory = [season(12, 8), season(13, 9)]
  if (stored) world.ageCurve = { ...stored, injuryFrom: 0 }
  return world
}
const START_AGE = 14

const AGES = [27, 29, 31, 33, 35]
const SHARES = [0.997, 0.97, 0.93, 0.88]

console.log('r39 #13a – «her body has about N more seasons in it», both stops, spoken = max(1, round)')
console.log('bounds: age 27 row uses the direct route pair (22/27, no spread); the rest the shipped default (23/29)')
console.log('')
console.log('  age  share   ds |  walk->0.55  spoken |  walk->0.70  spoken |  live sentence number')
for (const age of AGES) {
  for (const share of SHARES) {
    const stored = age < 29 ? { plateauStart: 22, declineStart: 27 } : undefined
    const bounds: AgeCurveBounds = stored ?? { plateauStart: 23, declineStart: 29 }
    const world = worldAt(age, share, stored)
    const exactAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    const old = walkSeasons(share, exactAge, bounds, ENDINGS.lastOfferPeakShare)
    const next = walkSeasons(share, exactAge, bounds, 0.7)
    const live = coachDeclineNote(world).match(/about (\d+) more season/)
    console.log(
      `${padL(exactAge.toFixed(2), 5)}  ${padL((share * 100).toFixed(1), 5)}  ${padL(bounds.declineStart, 2)} |` +
        `${padL(old.toFixed(2), 12)}  ${padL(Math.max(1, Math.round(old)), 6)} |` +
        `${padL(next.toFixed(2), 12)}  ${padL(Math.max(1, Math.round(next)), 6)} |` +
        `  ${live ? live[1] : '(silent)'}`,
    )
  }
}
