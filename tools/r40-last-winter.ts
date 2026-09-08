/**
 * r40-last-winter – WHEN THE WARNING STARTS SPEAKING, AND FOR HOW LONG.
 *
 * Round 40 #14b. The owner approved a warning and named its window himself – «за сезон-два до того»
 * – and CLAUDE.md invariant 5 says the window is measured before a word of copy is written: «A
 * warning that fires for eight seasons is not a warning; one that fires for zero never appears.»
 *
 * ⚠ MEASUREMENT, NOT A CAREER WALK – r39-body-seasons.ts's own licence, and the same argument: past
 * `declineStart` nothing but `declineFactor` moves a physical attribute, so the share at every age
 * is exact arithmetic rather than something a Monte-Carlo has to find. The world below is SYNTHETIC
 * at every step (a `createWorld` seed with its week and its peak under this file's hand); no save,
 * no fixture, and nothing from ~/Downloads is read here or anywhere near here.
 *
 * WHAT IT PRINTS
 *   1. per career curve: the age each surface first speaks at, the age it stops, and how long it
 *      speaks for – in weeks for the two surfaces that are on screen every week, and in OFF-SEASONS
 *      for the two that only exist at the winter question.
 *   2. one career's every off-season from 29, with the count the three voices read on it, so the
 *      hand-off from «2» to «1» to the final card can be read rather than trusted.
 *
 * Run: npx vite-node tools/r40-last-winter.ts
 */
import { createWorld } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import {
  LAST_WINTER_WARN_SEASONS,
  coachDeclineNote,
  coachRoomShort,
  lastWinterIn,
} from '../src/engine/world/coachMarket'
import { herLastWinterLine, seasonLastWinterLine } from '../src/composables/declineVoice'
import { ageCurveOf, declineFactor, physicalMean } from '../src/engine/development'
import { kidAgeExact } from '../src/engine/world/age'
import { ENDINGS, retirementDue } from '../src/engine/ending'
import { plateauViewOf } from '../src/engine/world/endings'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'

const padL = (s: string | number, n: number) => String(s).padStart(n)
const padR = (s: string | number, n: number) => String(s).padEnd(n)

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number): SeasonHistoryEntry {
  const byTrack = {
    domestic: { ...EMPTY_ROW },
    itf: { ...EMPTY_ROW },
    wta: { ...EMPTY_ROW, endRank: wtaRank },
  } as Record<LadderTrack, SeasonTrackRow>
  return { seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0, byTrack }
}

/** The one synthetic world every row below is measured on, with its share set per week. The season
 *  rows give `seasonRankRead` a fall to talk about, so the coach's sentence exercises its rank arm
 *  as well as the clause under measurement. */
function makeWorld(stored?: { plateauStart: number; declineStart: number }, weeksLost = 0): WorldState {
  const world = createWorld('r40-last-winter', { ...DEFAULT_PROFILE, coachTier: 'middle' })
  world.seasonHistory = [season(12, 8), season(13, 12)]
  if (stored) world.ageCurve = { ...stored, injuryFrom: 0 }
  if (weeksLost) world.careerTotals = { ...world.careerTotals!, weeksLostToInjury: weeksLost }
  return world
}

const ASK_WEEK = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
const isAskWeek = (week: number) => week % WEEKS_PER_YEAR === ASK_WEEK

interface Row {
  label: string
  stored?: { plateauStart: number; declineStart: number }
  weeksLost?: number
}

// ⚠ ROW 1 LEAVES THE CURVE THE SEED DREW, and its `ds` column is why the label does not claim a
// number: round 31 #10 gives every career its own `declineStart`, so «the shipped 23/29» would be a
// guess about this seed. The other three name their pair and get it.
const ROWS: Row[] = [
  { label: 'as the seed drew it', stored: undefined },
  { label: 'direct 22/27', stored: { plateauStart: 22, declineStart: 27 } },
  { label: 'late 24/31', stored: { plateauStart: 24, declineStart: 31 } },
  { label: 'shipped, 40wk lost', stored: { plateauStart: 23, declineStart: 29 }, weeksLost: 40 },
]

interface Speaks {
  firstAge: number | null
  lastAge: number | null
  weeks: number
  offSeasons: number
}
const blank = (): Speaks => ({ firstAge: null, lastAge: null, weeks: 0, offSeasons: 0 })
function saw(s: Speaks, age: number, askWeek: boolean): void {
  if (s.firstAge === null) s.firstAge = age
  s.lastAge = age
  s.weeks++
  if (askWeek) s.offSeasons++
}
const span = (s: Speaks): string =>
  s.firstAge === null ? '   –      –      –' : `${padL(s.firstAge.toFixed(1), 5)}  ${padL(s.lastAge!.toFixed(1), 5)}  ${padL(s.weeks, 5)}`

console.log(`r40 #14b – the warning window. LAST_WINTER_WARN_SEASONS = ${LAST_WINTER_WARN_SEASONS}, ` +
  `final band = ${ENDINGS.lastOfferPeakShare}, gate = age ${ENDINGS.askFromAgeYears}`)
console.log('')
console.log('Each row walks ONE synthetic career week by week from her own declineStart to 46, with the')
console.log('share compounded exactly as growWeek compounds it, and asks every surface what it would say.')
console.log('')
console.log(padR('curve', 20) + ' ds | coach card: from    to  weeks | Home plate: from    to  weeks | her card / wrap: from    to  winters | final ask')
for (const row of ROWS) {
  const world = makeWorld(row.stored, row.weeksLost)
  const bounds = ageCurveOf(world.ageCurve, row.weeksLost ?? 0)
  const basePhysical = physicalMean(world.skills)
  const card = blank()
  const plate = blank()
  const winter = blank()
  let share = 1
  let started = false
  let finalAskAge: number | null = null

  for (let week = 0; week < 46 * WEEKS_PER_YEAR; week++) {
    const age = kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay)
    if (age < bounds.declineStart) continue
    if (started) share *= 1 - declineFactor(age, bounds)
    started = true
    world.week = week
    world.peakPhysical = basePhysical / share
    const ask = isAskWeek(week)

    if (coachDeclineNote(world).includes('last winter')) saw(card, age, ask)
    if (coachRoomShort(world).includes('last winter')) saw(plate, age, ask)
    if (ask) {
      const n = lastWinterIn(world)
      // The two off-season surfaces read the same field through their own formatters – if either
      // ever disagrees with the other, this row is the place it shows up.
      const her = herLastWinterLine(n)
      const wrap = seasonLastWinterLine(n)
      if ((her === null) !== (wrap === null)) throw new Error(`her line and the wrap disagree at age ${age.toFixed(2)}`)
      if (her !== null) saw(winter, age, true)
      // ⚠ THE WALK STOPS WHERE THE CAREER STOPS. The final offer draws one answer and it retires
      // her, so a week past it is a week no player can be on – and counting those weeks would
      // report a coach still warning about a winter that has already happened. (He does say it
      // there: past the band `lastWinterIn` reads 1 for ever, which is correct and unreachable.)
      if (retirementDue(plateauViewOf(world))?.final) {
        finalAskAge = age
        break
      }
    }
  }
  console.log(
    padR(row.label, 20) + padL(bounds.declineStart.toFixed(1), 5) + ' |' + span(card) + '            |' + span(plate) + '            |' +
      span(winter) + `      ${padL(winter.offSeasons, 3)}         |  ` +
      (finalAskAge === null ? '   –' : finalAskAge.toFixed(1)),
  )
}

// -------------------------------------------------------------------------------------------------
// 2. ONE CAREER'S EVERY OFF-SEASON, so the hand-off can be read rather than trusted.
// -------------------------------------------------------------------------------------------------
console.log('')
console.log('One career, every off-season from her own decline – what each of the three voices has on that week:')
console.log('')
console.log(' age   share | count | coach card                                                        | her card')
{
  const world = makeWorld()
  const bounds = ageCurveOf(world.ageCurve, 0)
  const basePhysical = physicalMean(world.skills)
  let share = 1
  let started = false
  for (let week = 0; week < 46 * WEEKS_PER_YEAR; week++) {
    const age = kidAgeExact(week, world.profile.birthMonth, world.profile.birthDay)
    if (age < bounds.declineStart) continue
    if (started) share *= 1 - declineFactor(age, bounds)
    started = true
    if (!isAskWeek(week)) continue
    world.week = week
    world.peakPhysical = basePhysical / share
    const n = lastWinterIn(world)
    const offer = retirementDue(plateauViewOf(world))
    const note = coachDeclineNote(world)
    const her = herLastWinterLine(n)
    console.log(
      `${padL(age.toFixed(1), 5)}  ${padL((share * 100).toFixed(1), 5)} | ${padL(n ?? '–', 5)} | ${padR(note.slice(0, 65), 65)} | ` +
        (offer?.final ? '(FINAL – her last word)' : (her ?? '')),
    )
    if (offer?.final) break
  }
}
