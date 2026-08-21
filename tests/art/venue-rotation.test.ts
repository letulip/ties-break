// THE ANTI-REPEAT ROTATION (feat/adult-venue-art, owner 04.08) – rule 3 of src/art/venues.ts.
//
// The owner shipped 42 adult venue masters and asked for one behavioural change with them:
//
//   «можно переименовать в clay-2 и использовать рандомно, чтобы как можно меньше повторов в ленте
//    было. Например, если идет два w15 clay подряд, то чтобы они точно разные картинки показывали,
//    если именно clay не хватает – то показывать venue. И вообще разбавлять ленту артами, должны
//    быть использованы все.»
//
// Three claims, and this file is one describe per claim plus the one that outranks all of them:
//
//   NO REPEAT   – two events of the same tier AND surface in a row show different pictures.
//   COVERAGE    – every master that ships is reachable; nothing is dead weight in the download.
//   STABLE      – and none of that is allowed to cost rule 1. The same career rendered twice picks
//                 the same photograph for every event, and so does the same event seen on week 3
//                 and again on week 11.
//
// ⚠ MEASURED AGAINST THE REAL CALENDAR, not against a hand-made list of events. The whole design
// rests on a claim about the SHAPE of the schedule – that consecutive events of one tier sit one
// ordinal apart – so a fixture that invented its own weeks would be testing the fixture. Every case
// below runs `buildSeason`, the same function `ensureSeason` deals the career's blocks with.
import { describe, it, expect } from 'vitest'
import {
  ART_TIER_BORROWS,
  FIELD_ART,
  venueArtStem,
  venueCandidates,
  venueOrdinal,
  venueVariants,
  occasionCandidates,
  occasionArtUrl,
} from '../../src/art/venues'
import { buildSeason, TIER_LADDER } from '../../src/engine/season/calendar'
import { SEASON_CHUNK } from '../../src/engine/world/constants'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { TierId } from '../../src/engine/season/types'
import type { Surface } from '../../src/engine/match/types'

const SURFACES: Surface[] = ['hard', 'clay', 'grass']

/** A career's calendar the way the engine deals it: `${seed}:s${block}` per 52-week block. */
function calendar(seed: string, blocks: number) {
  const out: { id: string; week: number; tier: TierId; surface: Surface }[] = []
  for (let b = 0; b < blocks; b++) {
    for (const e of buildSeason(`${seed}:s${b}`, b * SEASON_CHUNK, SEASON_CHUNK)) {
      out.push({ id: e.id, week: e.week, tier: e.tier, surface: e.surface })
    }
  }
  return out.sort((a, b) => a.week - b.week)
}

/** Consecutive appearances of one tier, in career order – the sequence «два w15 clay подряд» is
 *  about. Only pairs where BOTH are the same surface can repeat a picture. */
function adjacentSameSurfacePairs(seed: string, blocks: number) {
  const byTier = new Map<TierId, { id: string; week: number; tier: TierId; surface: Surface }[]>()
  for (const e of calendar(seed, blocks)) byTier.set(e.tier, [...(byTier.get(e.tier) ?? []), e])
  const pairs: { a: (typeof out)[number]; b: (typeof out)[number] }[] = []
  const out = calendar(seed, 0) // typing handle only
  for (const events of byTier.values()) {
    for (let i = 1; i < events.length; i++) {
      if (events[i - 1].surface === events[i].surface) pairs.push({ a: events[i - 1], b: events[i] })
    }
  }
  return pairs
}

// ===============================================================================================
// NO REPEAT
// ===============================================================================================
describe('the feed does not repeat itself', () => {
  it('two events of the same tier and surface in a row show different pictures', () => {
    // The owner's rule, asserted on every such pair 20 careers x 8 seasons produce. The ONE
    // exemption is a ring with a single frame, which is an art gap and not a picker decision – it
    // is pinned by name in its own case below, so the exemption cannot quietly widen.
    let checked = 0
    const repeats: string[] = []
    for (let s = 0; s < 20; s++) {
      const seed = `rot-${s}`
      for (const { a, b } of adjacentSameSurfacePairs(seed, 8)) {
        if (venueVariants(b.tier, b.surface).length < 2) continue
        checked++
        const first = venueArtStem(a.tier, a.surface, a.id, seed)
        const second = venueArtStem(b.tier, b.surface, b.id, seed)
        if (first === second) repeats.push(`${seed} ${a.id} -> ${b.id} both show ${first}`)
      }
    }
    expect(checked).toBeGreaterThan(10000)
    expect(repeats.slice(0, 10), `${repeats.length} of ${checked} adjacent pairs repeat`).toEqual([])
  })

  it('the rings that CANNOT satisfy it are exactly the six with one frame – an art gap, named', () => {
    // Honesty about the exemption above. A (tier, surface) with a single picture has nothing to
    // rotate to: `local` and `regional` ship no establishing shot at all, and `slam` ships two hards
    // but one clay and one grass. Two such events in a row DO repeat, and the cure is a second
    // master, not code. Registered in docs/art-placeholders.md under the non-byte-checkable gaps.
    const singles: string[] = []
    for (const tier of TIER_LADDER) {
      for (const surface of SURFACES) {
        if (venueVariants(tier, surface).length < 2) singles.push(`${tier}/${surface}`)
      }
    }
    expect(singles).toEqual([
      'local/clay',
      'local/grass',
      'regional/clay',
      'regional/grass',
      'slam/clay',
      'slam/grass',
    ])
  })

  it('when a surface runs short the tier\'s own establishing shot covers the lap, never a repeat', () => {
    // «если именно clay не хватает – то показывать venue». A ring is the ladder's courts followed by
    // the tier's neutral frames, so walking it spends every court before it reaches a gate – and
    // reaches a gate rather than starting the courts again.
    expect(venueVariants('national', 'clay')).toEqual(['national-clay-1', 'national-venue-1', 'national-venue-2'])
    expect(venueVariants('w15', 'clay')).toEqual([
      'w15-clay-1',
      'w15-clay-2',
      'w15-venue-1',
      'w15-venue-2',
      'w15-venue-3',
    ])
    // A tier with no establishing shot rotates its courts and nothing else – it may not borrow
    // another tier's gate, because the frame would promise the wrong SCALE (rule 2's cousin).
    expect(venueVariants('wta1000', 'hard')).toEqual(['wta1000-hard-1', 'wta1000-hard-2'])
    // ...and where the ladder ALREADY answered with the neutral frames (no court on this surface at
    // all) they are not appended twice.
    for (const tier of TIER_LADDER) {
      for (const surface of SURFACES) {
        const ring = venueVariants(tier, surface)
        expect(new Set(ring).size, `${tier}/${surface} lists a frame twice`).toBe(ring.length)
      }
    }
  })

  it('the ordinal is the event\'s place in its OWN tier\'s sequence, one apart for neighbours', () => {
    // The mechanism, pinned directly rather than only through its effect: this is the fact that
    // makes an anti-repeat rule expressible without any state.
    const seed = 'ord-seed'
    const byTier = new Map<TierId, { id: string; week: number }[]>()
    for (const e of calendar(seed, 3)) byTier.set(e.tier, [...(byTier.get(e.tier) ?? []), e])
    let pairs = 0
    for (const [tier, events] of byTier) {
      for (let i = 1; i < events.length; i++) {
        const step = venueOrdinal(tier, events[i].id, seed) - venueOrdinal(tier, events[i - 1].id, seed)
        expect(step, `${tier}: ${events[i - 1].id} -> ${events[i].id}`).toBe(1)
        pairs++
      }
    }
    expect(pairs).toBeGreaterThan(100)
  })

  it('a week-derived ordinal would NOT do – the measurement that chose this design', () => {
    // docs/specs/venue-rotation.md. `week % ring.length` needs no calendar and is the obvious first
    // answer; it is also no better than the coin flip it replaces, because event gaps are structured
    // (a dense rung runs every ~2 weeks and half the rings are two frames long). Kept as a test so
    // the number in the spec is a fact somebody can re-run, and so a future simplification back to
    // the week has to walk past it.
    let weekRepeats = 0
    let checked = 0
    for (let s = 0; s < 5; s++) {
      const seed = `rot-${s}`
      for (const { a, b } of adjacentSameSurfacePairs(seed, 8)) {
        const n = venueVariants(b.tier, b.surface).length
        if (n < 2) continue
        checked++
        if ((b.week - a.week) % n === 0) weekRepeats++
      }
    }
    expect(weekRepeats / checked).toBeGreaterThan(0.2)
  })
})

// ===============================================================================================
// COVERAGE – «должны быть использованы все»
// ===============================================================================================
describe('every master that ships can be shown', () => {
  it('every stem in FIELD_ART belongs to at least one rotation ring', () => {
    // The structural half: a file nobody's ring contains is art nothing can request, which is the
    // same defect the both-directions disk guard catches from the other side.
    const reachable = new Set<string>()
    for (const tier of TIER_LADDER) {
      for (const surface of SURFACES) for (const stem of venueVariants(tier, surface)) reachable.add(stem)
    }
    expect([...FIELD_ART].filter((s) => !reachable.has(s))).toEqual([])
  })

  it('and a real career actually reaches every one of them', () => {
    // The behavioural half, and it is the stronger claim: being in a ring is not the same as coming
    // up. Walk 30 careers of real calendars and collect what the cards actually render.
    //
    // ⚠ THE EXEMPTION IS A CALENDAR FACT, NOT A PICKER ONE, AND IT FOUND A REAL GAP. `wta1000` is an
    // ANCHORED rung: its weeks are named (`anchorWeeks: [5, 8, 12, 18, 31, 37, 41, 45]`) and an
    // anchored event takes its block's DOMINANT surface, so its surface is decided by the week, not
    // by a draw. None of those eight weeks is inside the grass window (25-30), which means the
    // simulation NEVER schedules a WTA 1000 on grass and the owner's two grass masters for that rung
    // cannot be requested by anything. That is not something the picker may fix – inventing a grass
    // WTA 1000 would be a lie about the tour – so it is registered in docs/art-placeholders.md and
    // pinned here BY NAME. If the calendar ever anchors one into the grass window, this list is what
    // goes red and tells you the art is finally live.
    const shown = new Set<string>()
    const dealt = new Set<string>()
    for (let s = 0; s < 30; s++) {
      const seed = `cover-${s}`
      for (const e of calendar(seed, 8)) {
        dealt.add(`${e.tier}/${e.surface}`)
        shown.add(venueArtStem(e.tier, e.surface, e.id, seed))
      }
    }
    expect(dealt.has('wta1000/grass')).toBe(false)
    expect([...FIELD_ART].filter((s) => !shown.has(s))).toEqual(['wta1000-grass-1', 'wta1000-grass-2'])
  })
})

// ===============================================================================================
// STABLE – rule 1, which outranks everything above
// ===============================================================================================
describe("a tournament's photograph never changes", () => {
  /** Every venue pick a career makes over `weeks`, keyed by event id. Built off the SNAPSHOT, i.e.
   *  through exactly the facts a screen has (`upcoming` + `seed`), not off the world. */
  function careerPicks(seed: string, weeks: number): Map<string, string> {
    const picks = new Map<string, string>()
    const world = createWorld(seed)
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < weeks; w++) {
      const snap = toSnapshot(world)
      for (const e of snap.upcoming) {
        picks.set(e.id, venueArtStem(e.tier, e.surface, e.id, snap.seed))
      }
      tickWeek(world, rng)
    }
    return picks
  }

  it('the same career played twice picks the same photograph for every event', () => {
    const first = careerPicks('stability-seed', 40)
    const second = careerPicks('stability-seed', 40)
    expect(first.size).toBeGreaterThan(30)
    expect([...second.entries()].sort()).toEqual([...first.entries()].sort())
  })

  it('and an event keeps its photograph as the weeks pass under it', () => {
    // The failure this rules out is the one a naive "index in the list on screen" would have caused:
    // `upcoming` is filtered to future events, so a list position SHRINKS as the career advances and
    // the same tournament would repaint itself every week. The ordinal is counted in the calendar,
    // not in the list, so it cannot move.
    const seen = new Map<string, string>()
    const world = createWorld('drift-seed')
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < 40; w++) {
      const snap = toSnapshot(world)
      for (const e of snap.upcoming) {
        const stem = venueArtStem(e.tier, e.surface, e.id, snap.seed)
        if (seen.has(e.id)) expect(stem, `${e.id} repainted at week ${w}`).toBe(seen.get(e.id))
        seen.set(e.id, stem)
      }
      tickWeek(world, rng)
    }
    expect(seen.size).toBeGreaterThan(30)
  })

  it('the pick is a pure function – ten calls, one answer', () => {
    const first = venueArtStem('wta1000', 'clay', '3-w170-wta1000', 'pure-seed')
    for (let i = 0; i < 10; i++) {
      expect(venueArtStem('wta1000', 'clay', '3-w170-wta1000', 'pure-seed')).toBe(first)
    }
  })

  it('two careers walk the same ring from different rungs', () => {
    // The per-career offset. Same event id, same tier, same surface, different seed – over enough
    // seeds the whole ring shows up, so no career is stuck on one frame and no two careers are
    // guaranteed to agree.
    const seen = new Set<string>()
    for (let s = 0; s < 40; s++) seen.add(venueArtStem('w15', 'clay', '0-w10-w15', `career-${s}`))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('the calendar it counts in does not depend on the family background', () => {
    // `venueOrdinal` calls `buildSeason` WITHOUT a background, because the snapshot's `seed` is all
    // a screen has. That is only sound while the week/tier/surface grid is background-independent –
    // the background reaches `travelCostCents` alone, through its own `:travelbg:` sub-stream. If
    // that ever stops being true this test says so before a card starts repainting per family.
    const grid = (bg: 'working' | 'middle' | 'wealthy') =>
      buildSeason('bg-seed:s1', SEASON_CHUNK, SEASON_CHUNK, bg).map((e) => `${e.week}/${e.tier}/${e.surface}`)
    expect(grid('working')).toEqual(grid('middle'))
    expect(grid('wealthy')).toEqual(grid('middle'))
  })

  it('an id that is not a calendar id still answers, and answers the same way twice', () => {
    // Previews and fixtures build ids by hand. A picker that threw or drifted on one would take a
    // screen down for a picture.
    for (const id of ['', 'not-an-id', 'w14', '2031-w14-regional']) {
      expect(venueArtStem('regional', 'hard', id, 'seed-x')).toBe(venueArtStem('regional', 'hard', id, 'seed-x'))
      expect(FIELD_ART).toContain(venueArtStem('regional', 'hard', id, 'seed-x'))
    }
  })
})

// ===============================================================================================
// The borrowing rungs, and that borrowing never costs the surface
// ===============================================================================================
describe('the rungs that borrow somebody else\'s art', () => {
  it('only the two junior rungs borrow – every adult rung paints its own courts', () => {
    // ⚠ THIS CASE NAMED TWO ADULT RUNGS FOR ABOUT AN HOUR EACH. `w50` borrowed `w35` and `w75`
    // borrowed `w100`, by the nearest-populated-rung rule written up in ART_TIER_BORROWS' comment;
    // the owner delivered five masters for each mid-wave (19:01 and 19:09, 04.08) and both entries
    // left with their six registry rows. The RULE is kept in the module comment because the next
    // unpainted rung will need it; what is pinned here is the current set.
    expect(ART_TIER_BORROWS).toEqual({ j60: 'j30', j300: 'j30' })
    for (const surface of SURFACES) {
      expect(venueCandidates('j60', surface)).toEqual(venueCandidates('j30', surface))
      expect(venueCandidates('j300', surface)).toEqual(venueCandidates('j30', surface))
      // ...and the two rungs that stopped borrowing really did stop.
      for (const tier of ['w50', 'w75'] as TierId[]) {
        for (const stem of venueVariants(tier, surface)) expect(stem).toContain(`${tier}-`)
      }
    }
  })

  it('a borrowed set is still counted in the BORROWER\'s own sequence', () => {
    // The subtle one. `venueOrdinal` takes the event's real tier, never the tier it borrows art
    // from, so two consecutive j60 clay events differ even though the frames are j30's. Counting in
    // j30's sequence would have made the rotation follow a calendar the event is not in.
    const seed = 'borrow-seed'
    const j60 = calendar(seed, 6).filter((e) => e.tier === 'j60')
    let pairs = 0
    for (let i = 1; i < j60.length; i++) {
      if (j60[i - 1].surface !== j60[i].surface) continue
      if (venueVariants(j60[i].tier, j60[i].surface).length < 2) continue
      expect(venueArtStem(j60[i].tier, j60[i].surface, j60[i].id, seed)).not.toBe(
        venueArtStem(j60[i - 1].tier, j60[i - 1].surface, j60[i - 1].id, seed),
      )
      pairs++
    }
    expect(pairs).toBeGreaterThan(5)
  })
})

// =================================================================================================
// ⭐⭐ ROUND 24 #4 – A FIXTURE WITH NO RUNG STILL GETS AN HONEST PICTURE
// =================================================================================================
//
// The owner: «Картинки для студенческих турниров мне кажется можно взять из национальной ветки. Они
// домашние и уютные, как мне кажется, как раз для студенческих лиг должны подойти.»
//
// ⚠ IT COULD NOT GO THROUGH `ART_TIER_BORROWS`. That maps TierId onto TierId, and these fixtures have
// no tier by design – `callUpRubberId`'s own note says it "NAMES NO TIER ON PURPOSE" because the
// commentary derives its occasion from the id. So an OCCASION borrows a set, and the tier system is
// untouched. This file is what stops the borrow going stale.
describe('round 24 #4 – rungless fixtures borrow a domestic set', () => {
  it('⭐ every occasion resolves to real art, on every surface', () => {
    const surfaces = ['hard', 'clay', 'grass'] as const
    for (const occasion of ['nations-cup', 'college-league'] as const) {
      for (const surface of surfaces) {
        const pool = occasionCandidates(occasion, surface)
        expect(pool.length, `${occasion} on ${surface} has no picture at all`).toBeGreaterThan(0)
        for (const stem of pool) {
          expect(FIELD_ART, `${stem} is not a shipped master`).toContain(stem)
        }
      }
    }
  })

  it('⚠ and it borrows a DOMESTIC set – the owner named the reason, not just the folder', () => {
    // His argument was that the domestic courts read as home courts, which is the right register for
    // a fixture played for a country or a college rather than for ranking points. A borrow that
    // quietly moved to a WTA 1000 venue would lose that without failing anything else.
    for (const occasion of ['nations-cup', 'college-league'] as const) {
      for (const stem of occasionCandidates(occasion, 'hard')) {
        expect(stem, `${occasion} borrowed ${stem}`).toMatch(/^(local|regional|national)-/)
      }
    }
  })

  it('⚠ the same fixture always shows the same photograph, and two do not', () => {
    // The property the whole picker exists for, asked of the new door: one fixture, one picture.
    const a1 = occasionArtUrl('nations-cup', 'hard', 'callup-66-0', 'seed-a')
    const a2 = occasionArtUrl('nations-cup', 'hard', 'callup-66-0', 'seed-a')
    expect(a2, 'the same rubber repainted itself').toBe(a1)
    const others = ['callup-66-1', 'callup-66-2', 'callup-118-0', 'callup-118-1'].map((id) =>
      occasionArtUrl('nations-cup', 'hard', id, 'seed-a'),
    )
    expect(new Set([a1, ...others]).size, 'every rubber drew the same frame').toBeGreaterThan(1)
  })
})
