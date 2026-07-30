// R14-2 — THE JOURNEY HOME (owner, 29.07: «sleepy показываем рандомно после выездов на турниры
// в конце на экране Week story как в макете»).
//
// ⚠ IT WAS FOUR PAINTINGS AND ONE FACT WHEN THIS FILE WAS WRITTEN. The owner's second art drop the
// same day made it TWELVE – three moods of the same four journeys – and asked for words to go under
// them, so the feature is now three facts (`travelHomeScene`, `travelHomeMood`,
// `DiarySnapshot.travelNote`) and this file has a second half. Nothing in the first half was
// relaxed: the three claims below are the original three and are asserted exactly as they were,
// over a set that grew. The new suites start at "ui/travel-set" and pin the mood rule and the note's
// own honesty.
//
// ⚠ AND W4 MOVED WHICH WEEK IT LANDS ON (owner, 30.07: «ставить week recap сразу после турнира, как
// будто домой едем»). Every `week: N + 1` fixture below is `week: N` now, and one whole claim – "a
// second tournament this week outranks the journey back" – is deleted rather than re-aimed, because
// the clause it guarded is deleted. The re-aim is explained on each suite; the short version is that
// claim 1 below was TRUE ONLY BECAUSE the Weekly Story refused to render on a tournament week, and it
// does not refuse any more. NOTHING WAS WEAKENED: claim 1's own integration test – a real career, a
// real away trip, and `recapExists` actually true on the week that carries the scene – is untouched,
// still the test this feature lives or dies by, and it passes against the tournament week.
//
// Four paintings of her asleep on the way back – airport / plane / bus / car – and one engine fact
// that says which, `DiaryFacts.travelHomeScene`. This suite pins the three things that could each
// silently make the feature wrong or invisible:
//
//   1. THE WEEK. A scene on a week the Weekly Story cannot render is a fact nobody ever sees. It
//      lands on the week she PLAYED, which is the week she drove back and the week whose story now
//      opens the moment the tournament flow lets go of it – and «после выездов» is after the trip,
//      i.e. the Sunday of the same week. The integration test at the bottom is the one that matters:
//      a real career, a real away tournament, and the scene on a week where `recapExists` is
//      actually true.
//   2. THE RULE. On the Weekly Story this scene REPLACES the week's painting, so a false positive
//      swaps correct art for wrong art. A career that never leaves town must never see one.
//   3. THE DRAW. Deterministic, on a purpose-scoped sub-stream – same seed, same week, same scene,
//      on any device and any replay – and ZERO draws on the MAIN weekly stream, so the frozen
//      capture (41550 / e6b0c709) cannot move. The last claim is re-proved here directly rather
//      than assumed: this file runs the same career with and without the fact being read.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import {
  travelHomeSceneFor,
  travelHomeMoodFor,
  travelHomeFactsFor,
  travelNoteFor,
  assembleDiaryFacts,
  buildDiarySnapshot,
  TRAVEL_NOTES,
  type DiaryWorldView,
  type TravelHomeFacts,
} from '../src/engine/diary'
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
import type {
  ConditionBand,
  Milestone,
  TravelHomeMood,
  TravelHomeScene,
  WorldEvent,
  WorldMatch,
} from '../src/shared/protocol'

const AIR: TravelHomeScene[] = ['airport', 'plane']
const ROAD: TravelHomeScene[] = ['bus', 'car']
const ALL_SCENES: TravelHomeScene[] = [...AIR, ...ROAD]
const ALL_MOODS: TravelHomeMood[] = ['sleepy', 'happy', 'sad']

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
  // ⚠ RE-AIMED BY W4, AND THE TITLE IS THE INVERSION. This test read "lands on the week AFTER the
  // tournament, NEVER on the tournament week itself", and its own body said why: «the Weekly Story
  // does not render on a tournament week, so a scene set there would be invisible». That premise is
  // gone (composables/weekRecap.ts – the story opens when the flow lets go of the week), so the
  // offset it forced goes with it. THE PROTECTED FACT IS UNCHANGED: the scene lands on ONE week, that
  // week is a week the Weekly Story really renders, and it is over by the next one. The integration
  // test further down proves the middle claim against a live career and is untouched.
  it('lands on the tournament week itself – the week she played and drove home', () => {
    const events = trip(10, 'regional')
    expect(travelHomeSceneFor({ events, week: 10, seed: 's' }), 'the week she drove home must have one').not.toBeNull()
    // ...and it is exactly one week: the week before she left, and the week after she is back
    expect(travelHomeSceneFor({ events, week: 9, seed: 's' })).toBeNull()
    expect(travelHomeSceneFor({ events, week: 11, seed: 's' }), 'the week AFTER is an ordinary week now').toBeNull()
  })

  it('a Local Open is not a trip – the club down the road never sends her home asleep', () => {
    expect(travelHomeSceneFor({ events: trip(10, 'local'), week: 10, seed: 's' })).toBeNull()
    // ...and every rung above it is
    for (const tier of TIER_LADDER.filter((t) => t !== 'local')) {
      expect(travelHomeSceneFor({ events: trip(10, tier), week: 10, seed: 's' }), tier).not.toBeNull()
    }
  })

  it('needs BOTH halves of the journey: she played there, and the family paid to get her there', () => {
    // an entry with no match is a walkover / a medical withdrawal – there was no trip
    expect(travelHomeSceneFor({ events: [travelAt(10)], week: 10, seed: 's' })).toBeNull()
    // a skipped tournament refunds its travel in the same week and nets to 0 – she never boarded
    const refunded = [...trip(10, 'j30'), travelAt(10, +400_00)]
    expect(travelHomeSceneFor({ events: refunded, week: 10, seed: 's' })).toBeNull()
    // a practice friendly is not a trip and not a result (R11-2)
    const friendly: WorldEvent[] = [travelAt(10), { ...matchAt(10, 'regional'), friendly: true }]
    expect(travelHomeSceneFor({ events: friendly, week: 10, seed: 's' })).toBeNull()
  })

  // ⚠ THE CLAIM THIS REPLACES IS DELETED, NOT RE-AIMED, and it is the only deletion in this file.
  // It was "a SECOND tournament this week outranks the journey back", i.e. no scene on a week that
  // itself holds a tournament – and the clause it guarded existed for one stated reason: «it is
  // `recapExists`'s own tournament test ... so a scene can never land on a week that has no Weekly
  // Story to put it on». Every tournament week has one now, so the clause is a contradiction rather
  // than a mirror, and back-to-back tournament weeks each tell their own week: two trips, two drives
  // home, two stories. What that suite ALSO pinned and what is kept below, because neither depended
  // on the deleted clause: a reveal in flight is not a finished week, and a bare tournament SUMMARY
  // with no revealed match of hers is not a trip she played.
  it('a reveal in flight is not a journey home yet, and a summary alone is not a trip', () => {
    const played = trip(10, 'j30')
    expect(travelHomeSceneFor({ events: played, week: 10, seed: 's' })).not.toBeNull()
    // her run is still being played out on screen – nobody is in a car
    expect(travelHomeSceneFor({ events: played, week: 10, seed: 's', pendingUnfinished: true })).toBeNull()
    // a summary with no revealed match of hers: a walkover, a withdrawal – she did not play there
    const summaryOnly: WorldEvent[] = [
      travelAt(11),
      { id: 900, week: 11, type: 'tournament', text: 'National Series (R16)', finishIdx: 3 },
    ]
    expect(travelHomeSceneFor({ events: summaryOnly, week: 11, seed: 's' })).toBeNull()
    // ...and back-to-back tournament weeks now each carry their own drive home
    const backToBack = [...trip(10, 'j30'), ...trip(11, 'j30')]
    expect(travelHomeSceneFor({ events: backToBack, week: 10, seed: 's' })).not.toBeNull()
    expect(travelHomeSceneFor({ events: backToBack, week: 11, seed: 's' })).not.toBeNull()
  })

  // ⚠ RE-AIMED: the old title was "week 0 has no week before it", which was about the `week - 1`
  // offset. There is no offset now, so the fact worth pinning is the one that actually matters and
  // always did – a career START has no story to hang a picture on (`recapExists` refuses week 0), so
  // the rule must refuse it too even if the ledger somehow held a trip there.
  it('week 0 is the career start – no story, so no picture', () => {
    expect(travelHomeSceneFor({ events: trip(0, 'j30'), week: 0, seed: 's' })).toBeNull()
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
        // ⚠ W4: the trip and the picture are the SAME week now – `trip(w)` where this read `trip(w-1)`.
        const scene = travelHomeSceneFor({ events: trip(w, tier), week: w, seed: `seed-${tier}` })
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
    const first = travelHomeSceneFor({ events, week: 30, seed: 'career-a' })
    expect(first, 'the fixture has to actually produce a scene').not.toBeNull()
    for (let i = 0; i < 50; i++) {
      expect(travelHomeSceneFor({ events, week: 30, seed: 'career-a' })).toBe(first)
    }
    // a different seed or a different week may differ – that is what makes it a draw at all
    const bySeed = new Set(
      Array.from({ length: 40 }, (_, i) => travelHomeSceneFor({ events, week: 30, seed: `career-${i}` })),
    )
    expect(bySeed.size).toBeGreaterThan(1)
  })

  it('the draw does not depend on the events object, only on (seed, week) and the bucket', () => {
    // Two different J300 trips in the same week of the same career answer the same picture, so a
    // re-render or a reload cannot shuffle it.
    // ⚠ W4: `week: 20` where this read `week: 21`. On the old offset this pair was `null === null` the
    // moment the offset moved, i.e. the test would have gone on passing while asserting nothing – so
    // the non-null assertion below is new, and is what makes the equality mean something.
    const a = [travelAt(20, -1600_00), matchAt(20, 'j300')]
    const b = [travelAt(20, -3200_00), matchAt(20, 'j300'), matchAt(20, 'j300')]
    const scene = travelHomeSceneFor({ events: a, week: 20, seed: 's' })
    expect(scene).not.toBeNull()
    expect(travelHomeSceneFor({ events: b, week: 20, seed: 's' })).toBe(scene)
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
    // ⚠ W2 added `trainPct` to the view. This suite is about the JOURNEY HOME; the balanced
    // preset is the career default and nothing here reads it.
    trainPct: 75,
    ...over,
  })

  // ⚠ W4: the fixture's trip is in week 11, the view's own week, where it used to be in week 10. The
  // claim is unchanged – the facts object carries the scene on a come-home week and null otherwise.
  it('the facts carry it, and an ordinary week carries null', () => {
    expect(assembleDiaryFacts(view({ events: trip(11, 'national') })).travelHomeScene).not.toBeNull()
    expect(assembleDiaryFacts(view({})).travelHomeScene).toBeNull()
    // still field-for-field deterministic, which the draw could have broken
    const v = view({ events: trip(11, 'j30') })
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

  // ⚠ RE-AIMED, NOT WEAKENED (ui/travel-set). This used to sweep FOUR files, because the art set was
  // four – `-travel-sleepy-{scene}`, one picture per journey. The owner's 29.07 drop made it TWELVE,
  // three moods of each journey, and `travelHomeUrl` grew a `mood` argument (defaulted to `sleepy`,
  // so the old one-argument call still spells the old filename). The protected facts are both
  // unchanged and both still asserted, over the bigger set: every picture the engine can choose is
  // on disk, and exactly ONE file is warmed per week. What moved is the size of "every picture" –
  // which is the whole point of the mood landing, so a four-file sweep would now be passing over a
  // third of the art and would not notice a missing `-travel-happy-bus`.
  it('all TWELVE journeys are on disk and the builder finds them – no bands, one file per week', () => {
    for (const mood of ALL_MOODS) {
      for (const scene of ALL_SCENES) {
        const url = travelHomeUrl(scene, mood)
        expect(existsSync(new URL(`../public/${url.slice(import.meta.env.BASE_URL.length)}`, import.meta.url)), url).toBe(true)
      }
    }
    // the default is still the original set, so a caller that predates the mood spells a real file
    expect(travelHomeUrl('car')).toBe(travelHomeUrl('car', 'sleepy'))
    // ...and only the week's OWN picture is warmed – never a second mood, never a second scene
    resetPreloadCache()
    expect(preloadTravelHomeArt('plane', 'happy')).toEqual([travelHomeUrl('plane', 'happy')])
    expect(warmedCount()).toBe(1)
    expect(preloadTravelHomeArt(null, null), 'an ordinary week costs nothing').toEqual([])
    expect(warmedCount()).toBe(1)
    // and the URL it warms is the one the card renders: same builder, same twelve names
    expect(preloadTravelHomeArt('bus', 'sad')).toEqual([`${import.meta.env.BASE_URL}images/fem-euro-brunnet/fem-euro-brunnet-travel-sad-bus.webp`])
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
          // touch the new facts, so a lazy getter could not hide a draw. ⚠ FIVE now, not one:
          // ui/travel-set added the mood's coin (`seed:travelmood:<week>`) and the note's selection
          // (`seed:travelnote:<week>`), and W2/W3 added the ordinary week's note
          // (`seed:weeknote:<week>` – a coin AND a pick, on 30 of every 52 weeks) and the debut
          // memory (`seed:memory:debut:<week>`, drawn on every week of every career). Each is a NEW
          // rngFromSeed call inside the snapshot path – exactly the shape of change this test exists
          // to catch. Same claim, wider surface: the count and the sequence below are UNCHANGED,
          // which is the whole point.
          void snap.diary.facts.travelHomeScene
          void snap.diary.facts.travelHomeMood
          void snap.diary.travelNote
          void snap.diary.weekNote
          void snap.diary.memory
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

// =================================================================================================
// ui/travel-set — THE MOOD, and THE NOTE THE PARENT WROTE
//
// The owner's 29.07 art drop turned four paintings into twelve and named the rule verbatim:
//   «если дошла до финала можем рандомно показывать happy/sleepy разные, если не дошла - sad или
//    sleepy если сильно устала при этом»
// ...and asked for the words to go with them:
//   «про неё родительской рукой – так и делай, надо прям красиво, жизненно и уютно сделать. Если
//    травму получила - поддержать как-то словами на записке, если проиграла - тоже».
//
// Three things can each make this silently wrong, and each gets a pin below:
//   1. THE MOOD picking off something other than the two facts the owner named (the finish, and how
//      worn out she is), or moving the frozen MAIN capture on its way.
//   2. A NOTE THAT LIES – a line about a final on a week she went out in the first round. This is
//      the failure that would kill the effect outright, so the honesty pin sweeps the whole licence
//      space and re-checks every claim independently, exactly as tests/diary.test.ts does for
//      DIARY_POOL.
//   3. A NOTE THAT DOES NOT ARRIVE, or arrives in the wrong voice. The picture is of a journey and
//      the scrap under it is its caption, so silence there is a missing string rather than a quiet
//      week – and a line in the coach's register would put two identical voices on one card.
// =================================================================================================

/** One coherent away RESULT. `firstRound` is "one match, and she lost it", which is what the engine
 *  reads off the match feed rather than off the draw size. */
const RESULTS = [
  { finishIdx: 0, matchesWon: 4, firstRound: false, name: 'title' },
  { finishIdx: 1, matchesWon: 3, firstRound: false, name: 'runner-up' },
  { finishIdx: 2, matchesWon: 2, firstRound: false, name: 'semi-final' },
  { finishIdx: 3, matchesWon: 1, firstRound: false, name: 'quarter-final' },
  { finishIdx: 4, matchesWon: 0, firstRound: true, name: 'first round (16 draw)' },
  { finishIdx: 5, matchesWon: 0, firstRound: true, name: 'first round (32 draw)' },
  // defensive: a summary that never arrived. The match feed still answers everything that matters.
  { finishIdx: null as number | null, matchesWon: 0, firstRound: true, name: 'no summary' },
] as const

const BANDS: ConditionBand[] = ['fresh', 'ok', 'worn', 'drained']

/** Every journey the engine can hand the note pool. The mood is swept over all THREE rather than
 *  taken from the rule, which makes the honesty pin strictly stronger than the engine it guards. */
function* sweepTravel(): Generator<TravelHomeFacts> {
  for (const result of RESULTS) {
    for (const abroad of [true, false]) {
      for (const scene of abroad ? AIR : ROAD) {
        for (const mood of ALL_MOODS) {
          for (const band of BANDS) {
            for (const injured of [true, false]) {
              for (const injuryWeeks of injured ? [1, 3, 4, 6, 12] : [0])
              for (const firstAbroad of abroad ? [true, false] : [false]) {
                yield {
                  // ⚠ W4 deleted `awayWeek` from TravelHomeFacts: it was documented as "always
                  // `week - 1`" and is now always `week`, so keeping the field would be a name that
                  // lies to the next reader. The sweep is over the same licence space either way –
                  // no note in the pool ever read the week number.
                  week: 20,
                  scene,
                  mood,
                  tier: abroad ? 'j30' : 'regional',
                  abroad,
                  finishIdx: result.finishIdx,
                  wonTitle: result.finishIdx === 0,
                  lostFinal: result.finishIdx === 1,
                  reachedFinal: result.finishIdx === 0 || result.finishIdx === 1,
                  matchesWon: result.matchesWon,
                  firstRound: result.firstRound,
                  firstAbroad,
                  injured,
                  // 0 when healthy; otherwise sweep a niggle AND a season-ender, because the injury
                  // pool splits on the length of the layoff and a one-week band would leave half of
                  // it unswept.
                  injuryWeeks: injured ? injuryWeeks : 0,
                  conditionBand: band,
                }
              }
            }
          }
        }
      }
    }
  }
}

describe('ui/travel-set — the mood is the owner\'s rule and nothing else', () => {
  // ⚠ RE-AIMED: the rule takes the CONDITION, not the band. It read `conditionBand === 'drained'`
  // (below 40) until the measurement showed that line swallowing every late-career journey - the
  // owner then rejected thresholds altogether in favour of a weighted coin - see the re-aimed test
  // below. Each band is still exercised through a condition inside it.
  const BAND_CONDITION: Record<ConditionBand, number> = { fresh: 90, ok: 70, worn: 50, drained: 10 }
  const mood = (reachedFinal: boolean, conditionBand: ConditionBand, week = 20, seed = 's') =>
    travelHomeMoodFor({ reachedFinal, condition: BAND_CONDITION[conditionBand], seed, week })

  it('reached the final: happy or sleepy, and BOTH are reachable', () => {
    const seen = new Set<TravelHomeMood>()
    for (let w = 1; w < 200; w++) {
      for (const band of BANDS) {
        const m = mood(true, band, w)
        expect(['happy', 'sleepy'], `w${w} ${band}`).toContain(m)
        seen.add(m)
      }
    }
    expect([...seen].sort(), 'a constant wearing a draw\'s clothes').toEqual(['happy', 'sleepy'])
  })

  it('fell short: a WEIGHTED coin – both pictures reachable everywhere, sleep likelier when empty', () => {
    // ⚠ RE-AIMED, AND THE CLAIM IS STRONGER THAN THE ONE IT REPLACES. This asserted a hard line:
    // drained → sleepy, everything above → sad. The owner rejected the line itself - «я тогда её
    // вообще такую не увижу никогда, давай тоже рандом сделаем тогда между сном и sad» - because
    // condition TRENDS rather than wanders, so any threshold parks one picture out of reach for
    // whole stretches of a career. What is pinned now is what the design actually promises:
    //   (a) BOTH moods occur at EVERY condition - the thing a threshold could not give him;
    //   (b) sleeping still gets likelier the emptier she is - the fatigue meaning he kept when he
    //       ruled «это задача игрока поддерживать её состояние».
    // (b) is the half a flat 50/50 would quietly delete, which is why it is measured, not assumed.
    const share = (condition: number) => {
      let sleepy = 0
      for (let w = 1; w < 400; w++) {
        if (travelHomeMoodFor({ reachedFinal: false, condition, seed: 's', week: w }) === 'sleepy') sleepy++
      }
      return sleepy / 399
    }
    const empty = share(0)
    const mid = share(50)
    const fresh = share(100)
    // (a) nothing is ever a certainty, at either end
    for (const [label, v] of [['empty', empty], ['mid', mid], ['fresh', fresh]] as [string, number][]) {
      expect(v, `${label}: sleepy never happens`).toBeGreaterThan(0.05)
      expect(v, `${label}: sad never happens`).toBeLessThan(0.95)
    }
    // (b) and it is monotone in how empty she is, by a margin no rounding could produce
    expect(empty).toBeGreaterThan(mid + 0.15)
    expect(mid).toBeGreaterThan(fresh + 0.15)
  })

  it('DETERMINISTIC: the same seed and week answer the same mood, twice and forever', () => {
    const first = mood(true, 'ok', 31, 'career-a')
    for (let i = 0; i < 50; i++) expect(mood(true, 'ok', 31, 'career-a')).toBe(first)
    const bySeed = new Set(Array.from({ length: 40 }, (_, i) => mood(true, 'ok', 31, `career-${i}`)))
    expect(bySeed.size, 'the coin has to be a coin').toBe(2)
  })

  it('the facts carry the mood, and it is null on exactly the weeks the scene is', () => {
    const view = (over: Partial<DiaryWorldView>): DiaryWorldView => ({
      seed: 's', week: 11, kidId: KID_ID, startAgeYears: 14, condition: 80, fundsCents: 100_000_00,
      injury: null, events: [], lossStreak: null, kidRank: 50, prevKidRank: 50,
      pendingUnfinished: false, runPointsThisWeek: 0, milestones: [], vacationWeek: false,
      trainPct: 75, ...over,   // ⚠ W2: the plan, unread here
    })
    const away = assembleDiaryFacts(view({ events: trip(11, 'national') })) // ⚠ W4: the view's own week
    expect(away.travelHomeScene).not.toBeNull()
    expect(away.travelHomeMood).not.toBeNull()
    const ordinary = assembleDiaryFacts(view({}))
    expect(ordinary.travelHomeScene).toBeNull()
    expect(ordinary.travelHomeMood).toBeNull()
  })
})

describe('ui/travel-set — the note may not lie', () => {
  /** Every claim, re-derived from the facts INDEPENDENTLY of the licence that let the line through.
   *  A line whose licence and whose claims disagree is a failing test, not a matter of taste. */
  const HOLDS: Record<string, (t: TravelHomeFacts) => boolean> = {
    title: (t) => t.wonTitle,
    runnerUp: (t) => t.lostFinal,
    lost: (t) => !t.wonTitle,
    wonMatches: (t) => t.matchesWon > 0,
    firstRound: (t) => t.firstRound,
    injured: (t) => t.injured,
    tired: (t) => t.conditionBand === 'drained',
    abroad: (t) => t.abroad,
    firstAbroad: (t) => t.firstAbroad,
    road: (t) => !t.abroad,
    // the sleepy paintings are the only ones that show her asleep; happy and sad are her awake
    slept: (t) => t.mood === 'sleepy',
  }

  it('every licensed line asserts only what the trip actually carries', () => {
    let checked = 0
    for (const t of sweepTravel()) {
      for (const note of TRAVEL_NOTES) {
        if (!note.license(t)) continue
        for (const [claim, value] of Object.entries(note.claims)) {
          if (value !== true) continue
          expect(
            HOLDS[claim](t),
            `"${note.text}" claims ${claim} on: ${JSON.stringify({
              finish: t.finishIdx, won: t.matchesWon, first: t.firstRound, mood: t.mood,
              abroad: t.abroad, firstAbroad: t.firstAbroad, injured: t.injured, band: t.conditionBand,
            })}`,
          ).toBe(true)
          checked++
        }
      }
    }
    expect(checked, 'the sweep has to actually reach the pool').toBeGreaterThan(500)
  })

  it('an injured week is not offered a line about chips', () => {
    // The owner asked for support on the note when she is hurt. A pool that also licenses "she won
    // it and asked to stop for chips" on that week would draw it three times in four, so the injury
    // TAKES the note: nothing else is licensed at all.
    for (const t of sweepTravel()) {
      if (!t.injured) continue
      const licensed = TRAVEL_NOTES.filter((n) => n.license(t))
      expect(licensed.length, 'an injured week must still have words').toBeGreaterThan(0)
      for (const n of licensed) expect(n.claims.injured, `"${n.text}" on an injured week`).toBe(true)
    }
  })

  it('every journey the engine can produce has something to say', () => {
    // The scrap is the CAPTION of a painting the player is looking at, so silence here is a missing
    // string – unlike the photo caption, where a quiet week saying nothing is the point.
    for (const t of sweepTravel()) {
      expect(
        TRAVEL_NOTES.some((n) => n.license(t)),
        `nothing licensed for ${JSON.stringify({ finish: t.finishIdx, mood: t.mood, abroad: t.abroad, injured: t.injured, first: t.firstAbroad, band: t.conditionBand })}`,
      ).toBe(true)
    }
  })

  it('DETERMINISTIC, and stable for the whole week', () => {
    const t = [...sweepTravel()][17]
    const first = travelNoteFor(t, 'career-a')
    for (let i = 0; i < 40; i++) expect(travelNoteFor(t, 'career-a')).toBe(first)
    const bySeed = new Set(Array.from({ length: 60 }, (_, i) => travelNoteFor(t, `career-${i}`)))
    expect(bySeed.size, 'a pool of one wearing a draw\'s clothes').toBeGreaterThan(1)
  })
})

describe('ui/travel-set — the note is the PARENT, and it fits on a scrap of paper', () => {
  const texts = TRAVEL_NOTES.map((n) => n.text)

  it('fits on a scrap: 80 characters, which is two lines of handwriting on a phone', () => {
    // The card already has a "Next goal" scrap and a Training tile on it. A parent's note that runs
    // to four lines stops being a thing tucked under a photograph and becomes the page's main text.
    for (const t of texts) expect(t.length, t).toBeLessThanOrEqual(80)
  })

  it('is written ABOUT her, by somebody who loves her – never to the player, never a scoreboard', () => {
    for (const t of texts) {
      expect(/\byou\b|\byour\b/i.test(t), `second person in "${t}"`).toBe(false)
      // The parent narrates; they never appear as "I". "We" is the family and is in voice.
      expect(/\bI\b|\bmy\b/.test(t), `first person singular in "${t}"`).toBe(false)
      // Her name is ROLLED at onboarding (44 x 210 pools). A note that used it would read like a
      // certificate, and the fallback profile's name would be wrong for almost every career.
      expect(/Vera|Martin/.test(t), `a name in "${t}"`).toBe(false)
    }
  })

  it('speaks the app\'s player-facing English: short dash only, no Cyrillic', () => {
    for (const t of texts) {
      expect(t.includes('—'), `long dash in "${t}"`).toBe(false)
      expect(/[Ѐ-ӿ]/.test(t), `Cyrillic in "${t}"`).toBe(false)
    }
  })

  it('does not congratulate a loss, and does not talk like the coach', () => {
    // Two register tests the owner's brief asks for in words. A loss note NOTICES her; it does not
    // grade her. And engine/radar.ts already writes on this screen in the coach's voice, so anything
    // that reads as a coaching assessment would put the same person on the card twice.
    const CONSOLATION = /\bwell played\b|\bgood effort\b|\bproud of\b|\bnext time\b|\bunlucky\b|\bso close\b/i
    const COACH = /\bwe (?:build|fix|work on)\b|\bthe job\b|\bher weapon\b|\bthis year\b|\bat her age\b/i
    for (const t of texts) {
      expect(CONSOLATION.test(t), `consolation prize in "${t}"`).toBe(false)
      expect(COACH.test(t), `coach's register in "${t}"`).toBe(false)
    }
  })

  it('no two lines are the same line', () => {
    expect(new Set(texts).size).toBe(texts.length)
  })
})

describe('ui/travel-set — on a real career', () => {
  it('the note arrives on exactly the weeks the journey painting does, and never elsewhere', () => {
    const world = createWorld('travel-home-1')
    const rng = rngFromSeed(world.seed)
    let withNote = 0
    for (let i = 0; i < 120; i++) {
      for (const e of world.season) {
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try { enterEvent(world, e.id) } catch { /* blocked entries are not this test's business */ }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const snap = toSnapshot(world)
      const hasScene = snap.diary.facts.travelHomeScene !== null
      expect(snap.diary.travelNote !== null, `week ${snap.week}`).toBe(hasScene)
      expect(snap.diary.facts.travelHomeMood !== null, `week ${snap.week}`).toBe(hasScene)
      if (hasScene) {
        withNote++
        // the note is one of the pool's own lines, never a stitched-together string
        expect(TRAVEL_NOTES.map((n) => n.text)).toContain(snap.diary.travelNote)
      }
    }
    expect(withNote, 'two seasons must come home from an away trip more than once').toBeGreaterThan(3)
  })

  it('the facts reading agrees with the snapshot, week for week', () => {
    const world = createWorld('career-a')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 80; i++) {
      for (const e of world.season) {
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try { enterEvent(world, e.id) } catch { /* not this test's business */ }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const snap = toSnapshot(world)
      const travel = travelHomeFactsFor({
        events: world.events,
        milestones: world.milestones as readonly Milestone[],
        week: world.week,
        seed: world.seed,
        kidId: KID_ID,
        condition: world.condition,
        injury: world.injury,
        pendingUnfinished: world.pendingTournament !== null && !world.pendingTournament.finished,
      })
      expect(snap.diary.facts.travelHomeMood).toBe(travel?.mood ?? null)
      expect(snap.diary.travelNote).toBe(travel ? travelNoteFor(travel, world.seed) : null)
      if (travel) {
        // the mood the picture shows is the rule, re-derived from the two facts it is allowed to see
        expect(travel.mood).toBe(
          travelHomeMoodFor({
            reachedFinal: travel.reachedFinal,
            condition: world.condition,
            seed: world.seed,
            week: world.week,
          }),
        )
      }
    }
  })

  // ⚠ THE PIN FOR THE BUG A PLAYTEST FOUND AND THE SWEEP COULD NOT. `firstAbroad` was read off the
  // milestone ledger alone, and the `international` milestone is captured when the ENTRY FORM GOES
  // IN – so from the week she signed up for her first J30, a Regional Championship she DROVE to came
  // home under "Her first one in another country". The licence-space sweep above could never see it:
  // it generates `firstAbroad` only where `abroad` is true, because that is what the fact means. So
  // the invariant is asserted where the fact is BUILT, against a career that really goes abroad.
  it('her first trip abroad is a trip abroad, and it happens once', () => {
    const world = createWorld('ace-parent-1')
    const rng = rngFromSeed(world.seed)
    let firsts = 0
    let abroadTrips = 0
    for (let i = 0; i < 130; i++) {
      for (const e of world.season) {
        if (e.week > world.week && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          try { enterEvent(world, e.id) } catch { /* not this test's business */ }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const travel = travelHomeFactsFor({
        events: world.events,
        milestones: world.milestones as readonly Milestone[],
        week: world.week,
        seed: world.seed,
        kidId: KID_ID,
        condition: world.condition,
        injury: world.injury,
        pendingUnfinished: world.pendingTournament !== null && !world.pendingTournament.finished,
      })
      if (!travel) continue
      if (travel.abroad) abroadTrips++
      if (!travel.firstAbroad) continue
      firsts++
      expect(travel.abroad, `week ${world.week}: a ${travel.tier} trip claimed to be her first abroad`).toBe(true)
      expect(['j30', 'j60', 'j300'], `week ${world.week}`).toContain(travel.tier)
      expect(firsts, 'a career has one first trip abroad').toBe(1)
    }
    expect(abroadTrips, 'this career has to actually leave the country').toBeGreaterThan(3)
    expect(firsts, 'and the moment has to be reachable at all').toBe(1)
  })

  it('buildDiarySnapshot is field-for-field deterministic with the journey on it', () => {
    const view: DiaryWorldView = {
      seed: 's', week: 11, kidId: KID_ID, startAgeYears: 14, condition: 30, fundsCents: 100_000_00,
      // ⚠ W4: the trip is in the view's OWN week now (11), not the one before it.
      injury: null, events: trip(11, 'j300'), lossStreak: null, kidRank: 50, prevKidRank: 50,
      pendingUnfinished: false, runPointsThisWeek: 0, milestones: [], vacationWeek: false,
      trainPct: 75,   // ⚠ W2: the plan, unread here
    }
    expect(buildDiarySnapshot(view)).toEqual(buildDiarySnapshot(view))
    expect(buildDiarySnapshot(view).travelNote).not.toBeNull()
  })
})
