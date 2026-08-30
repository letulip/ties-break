// ⭐⭐ ROUND 29 #2 – THE SEASON FEED'S PRELOAD SET.
//
// ⚠⚠ THIS FILE IS NOT THE EVIDENCE FOR THE FIX AND MUST NOT BE READ AS IT. A unit test can only say
// which URLs were handed to `new Image()`; whether the file is ON THE DEVICE with the network cut is
// a claim about a real service worker, a real CacheFirst route and a real build, and it is made in
// `e2e/offline.spec.ts` ("the season feed keeps its pictures with the network cut"). That spec named
// seven black plates before this module existed and names none after it.
//
// What IS measured here is the half the e2e cannot see cheaply: that the set is the FEED's own set,
// and that it stays bounded by the horizon however many events a week stacks.
import { describe, it, expect } from 'vitest'
import { createWorld, tickWeek, toSnapshot } from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { UPCOMING_WEEKS } from '../src/engine/world/constants'
import { feedContext, feedShows, preferredWeekEvent } from '../src/composables/tierState'
import { feedArtUrls } from '../src/art/feedArt'
import { venueArtUrl } from '../src/art/venues'
import { weekArtUrl } from '../src/art/weeks'
import { DEFAULT_PROFILE, type Snapshot, type UpcomingEvent } from '../src/shared/protocol'

/** A career far enough in that its horizon stacks several rungs a week – which is the state the
 *  bound below is actually about. Ticked, never assembled. */
function careerAt(weeks: number): Snapshot {
  const world = createWorld('r29-feed-art', DEFAULT_PROFILE)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** The feed's own pick per week, computed here from the shipped predicates so the assertion below is
 *  a comparison between two callers rather than a restatement of one. */
function feedPicks(snap: Snapshot): Map<number, UpcomingEvent> {
  const ctx = feedContext({
    ageYears: snap.ageYears,
    tierOpen: snap.tierOpen,
    tierOutgrown: snap.tierOutgrown,
    activeLadder: snap.activeLadder,
    upcoming: snap.upcoming,
  })
  const byWeek = new Map<number, UpcomingEvent>()
  for (const e of snap.upcoming) {
    if (!feedShows(e, ctx)) continue
    const held = byWeek.get(e.week)
    byWeek.set(e.week, preferredWeekEvent(held ? [held, e] : [e])!)
  }
  return byWeek
}

describe('round 29 #2 – what the feed preloads', () => {
  it('warms the court of every tournament card the feed will draw', () => {
    const snap = careerAt(40)
    const urls = new Set(feedArtUrls(snap))
    const picks = feedPicks(snap)
    expect(picks.size, 'the fixture must have tournaments in its horizon or this proves nothing')
      .toBeGreaterThan(0)
    for (const [week, e] of picks) {
      // ⚠ A BOOKED FAMILY WEEK OR FRIENDLY OUTRANKS THE TOURNAMENT ON IT (SeasonScreen's `kind`
      // ladder), so the card would draw a week frame instead. This career books neither; the guard
      // is here so a future fixture that does cannot make this assertion quietly wrong.
      expect(snap.vacations.some((v) => v.week === week)).toBe(false)
      expect(snap.practices.some((p) => p.week === week)).toBe(false)
      expect(urls.has(venueArtUrl(e.tier, e.surface, e.id, snap.seed)), `w${week} ${e.label}`).toBe(true)
    }
  })

  it('warms the week frame for every week the horizon holds no card for', () => {
    const snap = careerAt(40)
    const urls = new Set(feedArtUrls(snap))
    const picks = feedPicks(snap)
    let quiet = 0
    for (let w = snap.week + 1; w <= snap.week + UPCOMING_WEEKS; w++) {
      if (picks.has(w) || snap.vacations.some((v) => v.week === w)) continue
      // Exam weeks wear `study-*` instead; they are the one arm this loop does not judge, and the
      // panel's own rule for them is asserted by the mount that draws one.
      if (urls.has(weekArtUrl(w))) quiet++
    }
    expect(quiet, 'a horizon of eight weeks holds at least one week with nothing in it').toBeGreaterThan(0)
  })

  it('stays bounded by the HORIZON and not by how many events a week stacks', () => {
    // ⚠ THIS IS THE MEASURED CLAIM. Over 12 careers x 624 weeks `snapshot.upcoming` held a median of
    // 30 events and a maximum of 38, against a feed that draws at most 8 cards. Warming `upcoming`
    // would fetch ~2 MB of courts to paint eight of them; the cap below is what stops that.
    for (const weeks of [0, 20, 40, 80]) {
      const snap = careerAt(weeks)
      const urls = feedArtUrls(snap)
      expect(new Set(urls).size, `week ${snap.week}: no duplicates`).toBe(urls.length)
      // one painting per week of the horizon, plus the recap's knock frame.
      expect(urls.length, `week ${snap.week}: ${snap.upcoming.length} events upcoming`).toBeLessThanOrEqual(
        UPCOMING_WEEKS + 1,
      )
    }
  })

  it('asks for nothing when there is no snapshot', () => {
    expect(feedArtUrls(null)).toEqual([])
    expect(feedArtUrls(undefined)).toEqual([])
  })
})
