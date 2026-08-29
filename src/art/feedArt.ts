// ⭐⭐ ROUND 29 #2 – THE SEASON FEED'S OWN PAINTINGS, WARMED BEFORE THE TAB IS OPENED.
//
// The owner: «Надо сделать предзагрузку картинок для оффлайн, у меня в ленте через одну черные
// плашки в сезоне».
//
// ⚠⚠ READ THIS FIRST, 29.08: THE OWNER OVERTURNED THE COST DECISION THIS MODULE IS BUILT AROUND.
// Round 29 part two #7 – «надо сделать, чтобы можно было полностью оффлайн играть без помех» – puts
// ALL of `public/images/**` into the PWA install (313 entries / 12.3 MB) and deletes both runtime
// art routes. So the diagnosis below is still exactly right and the "ADDED TO THE PRECACHE:
// NOTHING" section below is now a record of a decision that was made and then reversed, not a
// description of the build. Every number in it was true when written.
//
// THIS MODULE IS KEPT, and not out of sentiment: `warm()` still decodes a painting before the frame
// that binds it, which is R11-9's job and has nothing to do with where the bytes came from; and it
// is the only mechanism that would still cover an image that ever fell outside the precache glob.
// What it no longer carries is the OFFLINE promise. That is the precache's now, and unlike a warm
// it covers the card he has not reached yet.
//
// =================================================================================================
// WHAT A BLACK PLATE ACTUALLY IS, and it is not a missing file. Every stem `art/venues.ts` and
// `art/weeks.ts` can spell has a webp on disk (`tests/redesign-home.test.ts` and
// `tests/art-placeholders.test.ts` check both directions). What is missing is the FETCH:
// `vite.config.ts` keeps all of `public/images/**` out of the precache (`globIgnores`) and serves it
// through a CacheFirst RUNTIME route, so a picture is on the device if and only if something asked
// for its URL while there was a network. Nothing asked. `art/preload.ts` warms her portraits, her
// coach and the one journey-home frame the week chose - the feed's courts and week frames were never
// on anybody's list, and an `<img>` binding a URL offline is a plate with no pixels in it.
//
// AND «ЧЕРЕЗ ОДНУ» IS THAT DIVIDED BY HOW OFTEN A FRAME REPEATS. The quiet weeks share four
// paintings between them (`training` plus the three off-season frames), so on a phone that has been
// online at all they were fetched months ago and are still in the cache; a tournament card binds a
// DIFFERENT court every time (`venueArtStem` – one photograph per event, forever), so every card he
// had not already scrolled past was a URL nothing had ever requested. Tournament, quiet, tournament,
// quiet - the feed's own rhythm, wearing the cache's.
//
// REPRODUCED, not reasoned: `e2e/offline.spec.ts` cuts the network on a real build with a real
// service worker and reads `naturalWidth` off the feed's own images. Before this module it named
// seven blank plates on the `junior` fixture, four of them courts.
//
// =================================================================================================
// WHAT THIS COSTS, because `public/` is 15 MB and precaching it is not on the table.
//
//   ADDED TO THE PRECACHE: NOTHING. Not one byte. `globIgnores: ['**/images/**']` is untouched and
//   the install stays at its measured 118 entries / 2826 KiB. Precaching the courts alone would be
//   +5108 KiB (73 webp, measured by `ls`) - nearly triple the install, for art a given career mostly
//   never sees.
//
//   FETCHED AT RUNTIME: at most ONE painting per week of the horizon, so at most `UPCOMING_WEEKS`
//   (8). Courts average 70 KiB and week frames 25-82 KiB, so a cold career's first warm is under
//   ~560 KiB and every later tick adds ONE week - `warm()` is idempotent per URL, so the seven
//   weeks that merely slid along cost nothing. These are the same files the feed would fetch the
//   instant he opened the tab; what moves is WHEN, from "when he looks" to "at the tick", which is
//   the only difference that matters when the difference is a network.
//
// ⚠ ONE PER WEEK, NOT ONE PER EVENT, AND THE GAP IS LARGE. Measured over 12 careers x 624 weeks:
// `snapshot.upcoming` holds a MEDIAN OF 30 events (max 38) because a week stacks several rungs,
// while the feed draws a median of 5 cards and never more than 8. Warming `upcoming` would fetch
// ~2 MB per career to paint 8 cards. This module therefore asks the feed's own question - the same
// `feedContext` / `feedShows` / `preferredWeekEvent` the screen asks - so the picture warmed is the
// picture drawn, by construction rather than by two rules happening to agree.
//
// ⚠ AND THE LRU CAP IS DELIBERATELY NOT TOUCHED. `tb-art-v1` holds 80 entries against 167 reachable
// files, which vite.config.ts records and leaves at 80 as an owner storage-budget call. It does not
// need moving for this: a warm write is the most recently used entry in the cache, so the eight the
// feed is about to draw are the last things eviction would reach.

import { isExamWeek } from '../engine/season/calendar'
import { UPCOMING_WEEKS } from '../engine/world/constants'
import { feedContext, feedShows, preferredWeekEvent } from '../composables/tierState'
import { portraitStage } from '../shared/avatarEmotion'
import type { Snapshot, UpcomingEvent } from '../shared/protocol'
import { venueArtUrl } from './venues'
import { vacationArtUrl, weekArtUrl, weekHomeArtUrl } from './weeks'
import { warmAll } from './preload'

/** THE ROW THE FEED DRAWS FOR ONE WEEK, reduced to the only question this module has: which
 *  painting. The precedence is SeasonScreen's own `kind` ladder - a booked family week outranks the
 *  tournament on it, and everything with no tournament falls through to the week frame. */
function weekUrl(snap: Snapshot, week: number, event: UpcomingEvent | undefined): string {
  const booked = snap.vacations.find((v) => v.week === week)
  // ⚠ THE FALLBACK IS THE CARD'S OWN: `vacationArtUrl` returns null for a package with no painting
  // yet, and the card then draws the plain week frame (SeasonScreen `vacationArt`). Warming the
  // frame it would actually draw is the whole point of following the precedence rather than the type.
  if (booked) return vacationArtUrl(booked.packageId) ?? weekArtUrl(week)
  // ⚠ A BOOKED FRIENDLY OUTRANKS THE TOURNAMENT TOO, and it is reachable: `plannable` refuses to
  // open the planner on a week she may still ENTER, but not on one whose event is locked or closed.
  // That row is `kind: 'practice'`, which the feed draws as a WEEK card with the week's own frame -
  // so warming the court there would fetch a picture that week will never show.
  if (snap.practices.some((p) => p.week === week)) return weekArtUrl(week)
  if (event) return venueArtUrl(event.tier, event.surface, event.id, snap.seed)
  if (isExamWeek(week, week >= (snap.schoolEndsWeek ?? Number.POSITIVE_INFINITY))) {
    return weekHomeArtUrl('exam', portraitStage(snap.ageYears))
  }
  return weekArtUrl(week)
}

/** Every painting the eight-week feed will draw, deduplicated, in feed order. Pure - exported so a
 *  test can read the list without a DOM and without fetching anything. */
export function feedArtUrls(snap: Snapshot | null | undefined): string[] {
  if (!snap) return []
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
  const urls: string[] = []
  for (let w = snap.week + 1; w <= snap.week + UPCOMING_WEEKS; w++) {
    urls.push(weekUrl(snap, w, byWeek.get(w)))
  }
  // ⚠ THE WEEK RECAP'S OTHER AT-HOME FRAME, and it is here rather than in its own watch because it
  // is the same defect for one file. `chores-{band}` is what the recap card draws for a week she
  // rested a knock (`weekSceneArtUrl`), it is band-scoped exactly like `study-`, and every other
  // scene that card can draw is already warmed - the journey home by its own trigger, the layoff by
  // `preloadKidArt`, the holiday and the week frame by the loop above. One file, ~66 KiB, and the
  // rule the module keeps is unchanged: warm what a surface can request, and nothing else.
  urls.push(weekHomeArtUrl('knock', portraitStage(snap.ageYears)))
  return [...new Set(urls)]
}

/** Warm them. Idempotent per URL for the life of the tab (`art/preload.ts` keeps the set), so this
 *  is free to call on every tick - a slid horizon re-asks for seven files it already has. */
export function preloadFeedArt(snap: Snapshot | null | undefined): string[] {
  return warmAll(feedArtUrls(snap))
}
