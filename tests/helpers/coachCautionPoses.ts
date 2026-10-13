// r51 №7 (13.10) – WHAT THE HIRED COACH SAYS ABOUT A TRIP: ONE SET OF POSES FOR TWO SUITES.
//
// The unit suite (tests/i18n-coach-caution.test.ts) asks the ENGINE which ref each of his eight sentences is; the component suite
// (tests/component/i18n-r51-b4-coach-caution.test.ts) mounts the real screens over the same worlds and reads what they print under Russian. Two questions
// about one fixture, so the fixture is written once – the discipline `r41EntryWarning.ts` set for the entry confirm.
//
// ⚠ THE POSES ARE `tests/ladder-floor.test.ts`'S OWN, COPIED, NOT INVENTED: that file's `proWorld` / `injectEvent` and the seeds of its coach-as-scheduler block
// ('coach-ahead', 'coach-thisweek', 'coach-strong', 'coach-book', 'coach-cross'), whose preconditions it asserts (`hasOutgrown`, `bookClosedTo`, `tierOpenFor`).
// They are asserted again by the suite that uses them, so a ladder retune that moves a seed's verdict reds HERE with the broken precondition named, instead of
// letting a branch go silently unposed. (The copy is the price of a file-local fixture; editing ladder-floor.test.ts to export it would have touched a suite this
// item has no business in.)
//
// ⚠ NOTHING VUE IN HERE. It is imported by the `unit` project as well as `component`, so it may only touch the engine and the protocol.
import { createWorld, kidAgeYears, KID_ID, openingCoachId, recomputeKidRank, tickWeek, type WorldState } from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { BEST_N_BY_TRACK } from '../../src/engine/season/ranking'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'
import type { CoachTier } from '../../src/shared/protocol'

export function injectEvent(world: WorldState, week: number, tier: TierId): SeasonEvent {
  const e: SeasonEvent = {
    id: `floor-${week}-${tier}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** A world with a PROFESSIONAL book, aged into the W era (ladder-floor.test.ts, verbatim in what it sets – the reasons for each line are written there). */
export function proWorld(seed: string, age: number, book: number): WorldState {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < age) tickWeek(world, rng)
  world.condition = 100
  world.fundsCents = 50_000_00
  world.season = []
  if (book > 0) world.results.push({ playerId: KID_ID, week: world.week, points: book, tier: 'w15' })
  world.onRampCleared = { itf: true, wta: true }
  world.seasonHistory = [
    {
      seasonIndex: 0,
      endRank: 21,
      points: 0,
      wins: 0,
      losses: 0,
      byTrack: {
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { endRank: 21, points: 0, wins: 0, losses: 0 },
        wta: { points: 0, wins: 0, losses: 0 },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    },
  ]
  recomputeKidRank(world)
  return world
}

/** Hire the coach of a rung (the snapshot reads the tier off `world.coachId`; the engine function takes it as a parameter). */
export function withCoach(world: WorldState, tier: CoachTier): WorldState {
  world.coachId = openingCoachId(world.seed, { ...world.profile, coachTier: tier })
  return world
}

export interface Pose {
  world: WorldState
  /** The card he speaks about. */
  event: SeasonEvent
  /** The tournament he points at, where he points at one. */
  alt?: SeasonEvent
}

/** «…would save her for the W75 in 3 weeks» – a rung she has outgrown, the better one a few weeks on (the horizon is his rung: high 4, elite 6). */
export function aheadPose(weeksAfter: number): Pose {
  const world = proWorld('coach-ahead', 17, 250)
  const event = injectEvent(world, world.week + 3, 'w15')
  const alt = injectEvent(world, world.week + 3 + weeksAfter, 'w75')
  return { world, event, alt }
}

/** «…the W75 is the week – she has outgrown this one» – the better rung on the SAME week, her book with room. */
export function outgrownPose(): Pose {
  const world = proWorld('coach-thisweek', 17, 250)
  const event = injectEvent(world, world.week + 3, 'w15')
  const alt = injectEvent(world, world.week + 3, 'w75')
  return { world, event, alt }
}

/** A professional window already full of results worth more than a W15 title (ladder-floor's «THE BOOK»). */
function fullBook(seed: string): WorldState {
  const world = proWorld(seed, 19, 0)
  for (let i = 0; i < BEST_N_BY_TRACK.wta; i++) world.results.push({ playerId: KID_ID, week: world.week - i, points: 100, tier: 'w75' })
  recomputeKidRank(world)
  return world
}

/** «…the WTA 250 is the week – this one will not move anything» – the book SHUT to this card, an alternative on the same week. */
export function shutPose(): Pose {
  const world = fullBook('coach-strong')
  const event = injectEvent(world, world.week + 3, 'w15')
  const alt = injectEvent(world, world.week + 3, 'wta250')
  return { world, event, alt }
}

/** «Your coach says even a title here would not move her ranking.» – the book shut and nothing better on the week. */
export function bookPose(): Pose {
  const world = fullBook('coach-book')
  const event = injectEvent(world, world.week + 3, 'w15')
  return { world, event }
}

/** «…this pays national points, not the table she is climbing» – a domestic card in her international era, the better rung on her own table the same week. */
export function paysPose(): Pose {
  const world = createWorld('coach-cross')
  world.condition = 100
  world.fundsCents = 50_000_00
  world.season = []
  world.results.push({ playerId: KID_ID, week: world.week, points: 122, tier: 'national' })
  world.results.push({ playerId: KID_ID, week: world.week, points: 60, tier: 'j30' })
  world.onRampCleared = { itf: true, wta: false }
  recomputeKidRank(world)
  const event = injectEvent(world, world.week + 3, 'local')
  const alt = injectEvent(world, world.week + 3, 'j30')
  return { world, event, alt }
}

/** ⚠ THE ENGLISH ORACLE, TYPED INDEPENDENTLY OF THE ENGINE: the eight sentences exactly as `coachEntryLine` and `coachLadderNote` returned them before they became refs (the template literals of
 *  engine/world/coachMarket.ts at d5bfc863). A ref whose English differs from these by one byte is a re-worded sentence, which is the owner's to do and no agent's. */
export const LEGACY = {
  empty: 'Your coach would not take her. She is empty.',
  skip: 'Your coach would skip this one and get her legs back.',
  short: 'Your coach thinks she is a week short of her best for this.',
  pays: (alt: string, currency: string): string => `Your coach says the ${alt} is the week – this pays ${currency} points, not the table she is climbing.`,
  shut: (alt: string): string => `Your coach says the ${alt} is the week – this one will not move anything.`,
  outgrown: (alt: string): string => `Your coach says the ${alt} is the week – she has outgrown this one.`,
  book: 'Your coach says even a title here would not move her ranking.',
  save: (label: string, weeks: number): string => `Your coach would save her for the ${label} ${weeks === 1 ? 'next week' : `in ${weeks} weeks`}.`,
} as const
