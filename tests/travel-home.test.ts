// R14-2 — THE JOURNEY HOME (owner, 29.07: «sleepy показываем рандомно после выездов на турниры
// в конце на экране Week story как в макете»).
//
// Four paintings of her asleep on the way back – airport / plane / bus / car – and one engine fact
// that says which, `DiaryFacts.travelHomeScene`. This suite pins the three things that could each
// silently make the feature wrong or invisible:
//
//   1. THE WEEK. A week with a `tournament` event has no recap at all (composables/weekRecap.ts),
//      so a scene set on the tournament week is a fact no surface can ever render. It lands on the
//      week AFTER – which is also what «после выездов» says. The integration test at the bottom is
//      the one that matters: a real career, a real away tournament, and the scene on a week where
//      `recapExists` is actually true.
//   2. THE RULE. On the Weekly Story this scene REPLACES the week's painting, so a false positive
//      swaps correct art for wrong art. A career that never leaves town must never see one.
//   3. THE DRAW. Deterministic, on a purpose-scoped sub-stream – same seed, same week, same scene,
//      on any device and any replay – and ZERO draws on the MAIN weekly stream, so the frozen
//      capture (41550 / e6b0c709) cannot move. The last claim is re-proved here directly rather
//      than assumed: this file runs the same career with and without the fact being read.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { travelHomeSceneFor, assembleDiaryFacts, type DiaryWorldView } from '../src/engine/diary'
import {
  closeTournament,
  createWorld,
  enterEvent,
  KID_ID,
  skipTournament,
  tickWeek,
  toSnapshot,
} from '../src/engine/world'
import { recapExists } from '../src/composables/weekRecap'
import { preloadTravelHomeArt, resetPreloadCache, travelHomeUrl, warmedCount } from '../src/art/preload'
import { rngFromSeed } from '../src/engine/rng'
import { TIER_LADDER } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'
import type { TravelHomeScene, WorldEvent, WorldMatch } from '../src/shared/protocol'

const AIR: TravelHomeScene[] = ['airport', 'plane']
const ROAD: TravelHomeScene[] = ['bus', 'car']
const ALL_SCENES: TravelHomeScene[] = [...AIR, ...ROAD]

let nextId = 1
/** One competitive match of hers at `tier`, in `week` – the event shape the walk reads. */
function matchAt(week: number, tier: TierId): WorldEvent {
  return {
    id: nextId++,
    week,
    type: 'match',
    text: 'match',
    // only `eventId` is read here (the tier lives in the id); the round11-view/world-trio suites
    // fake a WorldMatch the same way rather than assembling two MatchPlayer skill snapshots.
    match: { winnerId: KID_ID, eventId: `2031-w${week}-${tier}` } as unknown as WorldMatch,
  }
}
/** The travel charge for that trip – a negative amount in the `travel` bucket. */
function travelAt(week: number, cents = -400_00): WorldEvent {
  return { id: nextId++, week, type: 'expense', category: 'travel', text: 'Travel to X', amountCents: cents }
}
/** A trip in `week`: she went, she paid, she played. */
function trip(week: number, tier: TierId): WorldEvent[] {
  return [travelAt(week), matchAt(week, tier)]
}

describe('R14-2 — what counts as coming home from an away trip', () => {
  it('lands on the week AFTER the tournament, never on the tournament week itself', () => {
    // This is the whole feature: the Weekly Story does not render on a tournament week, so a scene
    // set there would be invisible. It is also the truer reading of «после выездов».
    const events = trip(10, 'regional')
    expect(travelHomeSceneFor({ events, week: 10, seed: 's' }), 'the tournament week must be null').toBeNull()
    expect(travelHomeSceneFor({ events, week: 11, seed: 's' }), 'the week she gets home must have one').not.toBeNull()
    // ...and it is over by the week after that
    expect(travelHomeSceneFor({ events, week: 12, seed: 's' })).toBeNull()
  })

  it('a Local Open is not a trip – the club down the road never sends her home asleep', () => {
    expect(travelHomeSceneFor({ events: trip(10, 'local'), week: 11, seed: 's' })).toBeNull()
    // ...and every rung above it is
    for (const tier of TIER_LADDER.filter((t) => t !== 'local')) {
      expect(travelHomeSceneFor({ events: trip(10, tier), week: 11, seed: 's' }), tier).not.toBeNull()
    }
  })

  it('needs BOTH halves of the journey: she played there, and the family paid to get her there', () => {
    // an entry with no match is a walkover / a medical withdrawal – there was no trip
    expect(travelHomeSceneFor({ events: [travelAt(10)], week: 11, seed: 's' })).toBeNull()
    // a skipped tournament refunds its travel in the same week and nets to 0 – she never boarded
    const refunded = [...trip(10, 'j30'), travelAt(10, +400_00)]
    expect(travelHomeSceneFor({ events: refunded, week: 11, seed: 's' })).toBeNull()
    // a practice friendly is not a trip and not a result (R11-2)
    const friendly: WorldEvent[] = [travelAt(10), { ...matchAt(10, 'regional'), friendly: true }]
    expect(travelHomeSceneFor({ events: friendly, week: 11, seed: 's' })).toBeNull()
  })

  it('a SECOND tournament this week outranks the journey back – and that is what makes it visible', () => {
    // Back-to-back tournament weeks are ordinary (j30 runs every 2 weeks). On one of them the
    // week's story is the second tournament, not the car; and a week with a tournament has no
    // Weekly Story at all, so a scene there could never be rendered. Both readings agree.
    const backToBack = [...trip(10, 'j30'), ...trip(11, 'j30')]
    expect(travelHomeSceneFor({ events: backToBack, week: 11, seed: 's' })).toBeNull()
    // ...and the week after the SECOND one does show it
    expect(travelHomeSceneFor({ events: backToBack, week: 12, seed: 's' })).not.toBeNull()
    // a reveal still in flight this week is the same situation before its summary event exists
    expect(
      travelHomeSceneFor({ events: trip(10, 'j30'), week: 11, seed: 's', pendingUnfinished: true }),
    ).toBeNull()
    // and a tournament SUMMARY alone (no match events yet revealed) blocks it too
    const summaryOnly: WorldEvent[] = [
      ...trip(10, 'national'),
      { id: 900, week: 11, type: 'tournament', text: 'National Series (R16)', finishIdx: 3 },
    ]
    expect(travelHomeSceneFor({ events: summaryOnly, week: 11, seed: 's' })).toBeNull()
  })

  it('week 0 has no week before it', () => {
    expect(travelHomeSceneFor({ events: trip(-1, 'j30'), week: 0, seed: 's' })).toBeNull()
  })
})

describe('R14-2 — which of the four, and why it is not uniform', () => {
  it('the international ladder flies home; the domestic one drives', () => {
    // `track` is the calendar's own axis – itf is the junior international tour ("international
    // travel out"), domestic is local/regional/national. A J300 abroad is a plane; a Regional two
    // towns over is a car. Swept over many seeds so both members of each bucket are seen.
    const seen: Record<string, Set<TravelHomeScene>> = { itf: new Set(), domestic: new Set() }
    for (const tier of TIER_LADDER.filter((t) => t !== 'local')) {
      const bucket = tier.startsWith('j') ? 'itf' : 'domestic'
      const want = bucket === 'itf' ? AIR : ROAD
      for (let w = 1; w < 120; w++) {
        const scene = travelHomeSceneFor({ events: trip(w - 1, tier), week: w, seed: `seed-${tier}` })
        expect(scene, `${tier} w${w}`).not.toBeNull()
        expect(want, `${tier} came home by the wrong mode: ${scene}`).toContain(scene!)
        seen[bucket].add(scene!)
      }
    }
    // both scenes in each bucket are actually reachable – not a constant wearing a draw's clothes
    expect([...seen.itf].sort()).toEqual([...AIR].sort())
    expect([...seen.domestic].sort()).toEqual([...ROAD].sort())
  })

  it('DETERMINISTIC: the same seed and week give the same scene, twice and forever', () => {
    const events = trip(30, 'j60')
    const first = travelHomeSceneFor({ events, week: 31, seed: 'career-a' })
    for (let i = 0; i < 50; i++) {
      expect(travelHomeSceneFor({ events, week: 31, seed: 'career-a' })).toBe(first)
    }
    // a different seed or a different week may differ – that is what makes it a draw at all
    const bySeed = new Set(
      Array.from({ length: 40 }, (_, i) => travelHomeSceneFor({ events, week: 31, seed: `career-${i}` })),
    )
    expect(bySeed.size).toBeGreaterThan(1)
  })

  it('the draw does not depend on the events object, only on (seed, week) and the bucket', () => {
    // Two different J300 trips in the same week of the same career answer the same picture, so a
    // re-render or a reload cannot shuffle it.
    const a = [travelAt(20, -1600_00), matchAt(20, 'j300')]
    const b = [travelAt(20, -3200_00), matchAt(20, 'j300'), matchAt(20, 'j300')]
    expect(travelHomeSceneFor({ events: a, week: 21, seed: 's' })).toBe(travelHomeSceneFor({ events: b, week: 21, seed: 's' }))
  })
})

describe('R14-2 — on the facts object, and on a real career', () => {
  const view = (over: Partial<DiaryWorldView>): DiaryWorldView => ({
    seed: 's',
    week: 11,
    kidId: KID_ID,
    startAgeYears: 14,
    condition: 80,
    fundsCents: 100_000_00,
    injury: null,
    events: [],
    lossStreak: null,
    kidRank: 50,
    prevKidRank: 50,
    pendingUnfinished: false,
    runPointsThisWeek: 0,
    milestones: [],
    vacationWeek: false,
    ...over,
  })

  it('the facts carry it, and an ordinary week carries null', () => {
    expect(assembleDiaryFacts(view({ events: trip(10, 'national') })).travelHomeScene).not.toBeNull()
    expect(assembleDiaryFacts(view({})).travelHomeScene).toBeNull()
    // still field-for-field deterministic, which the draw could have broken
    const v = view({ events: trip(10, 'j30') })
    expect(assembleDiaryFacts(v)).toEqual(assembleDiaryFacts(v))
  })

  // ⚠ THE TEST THIS FEATURE LIVES OR DIES BY. A scene the Weekly Story cannot render is a scene
  // nobody ever sees, and the suite would be perfectly happy about it. So: drive a real career,
  // find a week that really carries the fact, and assert a recap really exists there.
  it('a real career produces the scene on a week where the Weekly Story ACTUALLY renders', () => {
    const world = createWorld('travel-home-1')
    const rng = rngFromSeed(world.seed)
    let shown = 0
    let awayTrips = 0
    const scenes = new Set<TravelHomeScene>()
    for (let i = 0; i < 160; i++) {
      for (const e of world.season) {
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* blocked entries are not this test's business */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      // The cheap read every week (toSnapshot builds the coach market and three finance folds, and
      // 160 of them is a minute of nothing); the FULL snapshot only on the handful of weeks that
      // actually carry a scene, where it also pins that the snapshot path and the pure function
      // agree about the answer.
      const scene = travelHomeSceneFor({
        events: world.events,
        week: world.week,
        seed: world.seed,
        pendingUnfinished: world.pendingTournament !== null && !world.pendingTournament.finished,
      })
      if (scene !== null) {
        scenes.add(scene)
        const snap = toSnapshot(world)
        expect(snap.diary.facts.travelHomeScene, `week ${snap.week}`).toBe(scene)
        // THE POINT: the week that carries a scene is a week the recap card exists on.
        expect(recapExists(snap), `week ${snap.week} carries ${scene} but has no recap`).toBe(true)
        shown++
      }
      if (world.events.some((e) => e.week === world.week && e.match && !e.friendly)) awayTrips++
    }
    expect(awayTrips, 'the career must actually have played tournaments').toBeGreaterThan(10)
    expect(shown, 'a three-season career must come home from an away trip at least a few times').toBeGreaterThan(5)
    expect(scenes.size, 'more than one picture over a career').toBeGreaterThan(1)
  })

  it('the four scenes are on disk and the builder finds them – one file per journey, no bands', () => {
    for (const scene of ALL_SCENES) {
      const url = travelHomeUrl(scene)
      expect(existsSync(new URL(`../public/${url.slice(import.meta.env.BASE_URL.length)}`, import.meta.url)), url).toBe(true)
    }
    // ...and only the week's OWN scene is warmed – never the other three
    resetPreloadCache()
    expect(preloadTravelHomeArt('plane')).toEqual([travelHomeUrl('plane')])
    expect(warmedCount()).toBe(1)
    expect(preloadTravelHomeArt(null), 'an ordinary week costs nothing').toEqual([])
    expect(warmedCount()).toBe(1)
  })

  // ⚠ THE FROZEN CAPTURE (41550 draws / hash e6b0c709). tests/condition.test.ts re-derives it from
  // the live engine and is green, which already proves the tick is untouched – but that harness
  // never calls `toSnapshot`, and the draw this slice adds lives in the SNAPSHOT path. So prove the
  // remaining half here: taking a snapshot every single week, which runs assembleDiaryFacts and its
  // `seed:travel:<week>` draw 52 times, must not perturb the MAIN stream by one value.
  it('the MAIN weekly stream is byte-identical whether or not snapshots are taken', () => {
    const run = (snapshotEveryWeek: boolean): number[] => {
      const world = createWorld('bench-working-0')
      const base = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = base()
        draws.push(v)
        return v
      }
      for (let i = 0; i < 52; i++) {
        tickWeek(world, rng)
        if (snapshotEveryWeek) {
          const snap = toSnapshot(world)
          // touch the new fact, so a lazy getter could not hide the draw
          void snap.diary.facts.travelHomeScene
        }
      }
      return draws
    }
    const withSnapshots = run(true)
    const without = run(false)
    expect(withSnapshots.length).toBe(41550)
    expect(withSnapshots).toEqual(without)
  })

  it('a career that never leaves town never sees one of these paintings', () => {
    // Every rung the family can afford early is local; nothing else is entered at all. The rule has
    // to keep the four scenes out of that career entirely, because on the Weekly Story a scene
    // REPLACES the week's painting – a false positive is wrong art, not extra art.
    const world = createWorld('travel-home-local-only')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 60; i++) {
      for (const e of world.season) {
        if (e.tier !== 'local') continue
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* blocked entries are not this test's business */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      expect(
        travelHomeSceneFor({ events: world.events, week: world.week, seed: world.seed }),
        `week ${world.week} of a local-only career`,
      ).toBeNull()
    }
  })
})
