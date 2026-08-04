// THE VENUE ART PICKER (epic/redesign-home, slice A) – which painted court a tournament card shows.
//
// 63 masters ship as `public/images/fields/<tier>-<surface>-<n>.webp`, plus the `-venue-` frames,
// which are ESTABLISHING shots (a gate, a walkway) with no playable court in frame – the ones to use
// where a card must not promise a surface.
//
// THREE RULES. The first two are the module and they outrank everything below them:
//
//  1. STABLE FOREVER. A tournament's photograph is part of what that tournament IS; it may not
//     change between two renders, two reloads or two replays of the same career. Every input to the
//     pick is a FIXED FACT about the event – its tier, its surface, its id and the career seed – so
//     the answer is a pure function, drawn on the `seed:venue:` sub-stream, zero MAIN-stream draws,
//     nothing inside the tick, and identical on all five surfaces that render a card (Home, Season,
//     Calendar, Money, TournamentFlow).
//
//  2. NEVER PROMISE THE WRONG SURFACE. The card names the surface immediately under the picture
//     (the design export's own layout), so a grass event painted on a clay court is the diary's
//     cardinal sin – a surface the simulation will not play on, asserted in a picture. This is the
//     one place the fallback ladder handed down with the art was NARROWED: "same tier, any surface"
//     became "same tier, SURFACE-NEUTRAL shot", and a lower-tier court on the RIGHT surface is
//     preferred to a same-tier court on the wrong one. `venueCandidates` below is that ladder and
//     nothing in rule 3 is allowed to reorder it.
//
//  3. THE FEED MUST NOT REPEAT ITSELF (owner, 04.08, with the adult drop). «можно переименовать в
//     clay-2 и использовать рандомно, чтобы как можно меньше повторов в ленте было. Например, если
//     идет два w15 clay подряд, то чтобы они точно разные картинки показывали, если именно clay не
//     хватает – то показывать venue. И вообще разбавлять ленту артами, должны быть использованы
//     все.» Three asks: consecutive same-(tier, surface) events show DIFFERENT pictures; when the
//     surface's own courts run short the tier's establishing shot covers the gap rather than a
//     repeat; and every master that ships is reachable. See `venueVariants` and `venueOrdinal`.
//
// HOW 3 COEXISTS WITH 1, because they pull against each other and this is the whole design.
// "No repeats in a row" is a statement about NEIGHBOURING events, and the picker sees one event at
// a time. The resolution is a STABLE ORDINAL rather than any kind of state: an event's position in
// its own tier's chronological sequence is a fixed, replayable fact (the calendar block is a pure
// function of the career seed), so the rotation `ring[(ordinal + offset) % ring.length]` is both
// deterministic per event AND aware of its neighbours. Two events adjacent in a tier's sequence
// have ordinals exactly one apart, so they land on different rungs of the ring for any ring of two
// or more – which is exactly the owner's «два w15 clay подряд». Nothing is remembered between
// calls; `venueArtStem` remains a pure function of (tier, surface, eventId, seed).
//
// WHY NOT SIMPLY `week % ring.length`, which needs no calendar at all: MEASURED, and it is no
// better than the coin-flip it replaces. Over 20 seeds x 8 seasons (14442 adjacent same-(tier,
// surface) pairs) a week-derived ordinal repeats 36.2% of the time, because event gaps are not
// arbitrary – a dense rung runs every ~2 weeks and half the rings are two frames long, so the gap
// is a multiple of the ring length far more often than chance. The tier-sequence ordinal repeats
// 0.00% on the same corpus, by construction. docs/specs/venue-rotation.md has the numbers.

import type { TierId } from '../engine/season/types'
import type { Surface } from '../engine/match/types'
import { rngFromSeed } from '../engine/rng'
import { buildSeason } from '../engine/season/calendar'
import { SEASON_CHUNK } from '../engine/world/constants'

const FIELD_DIR = 'images/fields/'

/** Every field master that ships, by stem. Kept as a literal list rather than a glob because the
 *  test that pins it checks these names against the files on disk in BOTH directions – a stem with
 *  no file is a 404 on a card, and a file with no stem is art nothing can ever show.
 *
 *  ⚠ THE FILES ARE NAMED FOR `TierId`, NOT FOR THE RUNG'S MARKETING NAME. The owner's drop spelled
 *  the top four `w125` / `w250` / `w500` / `w1000`; the engine spells them `wta125` / `wta250` /
 *  `wta500` / `wta1000`, and the FILES were renamed rather than the code («можно переименовать»),
 *  so the picker stays a plain prefix match and a rung has exactly one spelling. */
export const FIELD_ART: readonly string[] = [
  'local-hard-1',
  'local-hard-2', // indoor – filed as hard on purpose (our Surface union has no 'indoor')
  'local-clay-1',
  'local-grass-1',
  'regional-clay-1',
  'regional-hard-1',
  'regional-hard-2',
  'regional-hard-3',
  'regional-grass-1',
  'national-hard-1',
  'national-clay-1',
  'national-grass-1',
  'national-venue-1', // establishing shot – no court in frame
  'national-venue-2', // establishing shot – no court in frame
  'j30-clay-1',
  'j30-clay-2',
  'j30-clay-3',
  'j30-hard-1',
  'j30-hard-2',
  'j30-grass-1',
  'j30-venue-1', // establishing shot – no court in frame
  // --- the adult drop (owner, 04.08 – backlog #86). w50 and w75 are still in progress. ---
  'w15-clay-1',
  'w15-clay-2', // ⚠ byte-identical to w35-clay-1 – registered in docs/art-placeholders.md
  'w15-grass-1',
  'w15-grass-2', // ⚠ byte-identical to w35-grass-1
  'w15-hard-1',
  'w15-hard-2', // ⚠ byte-identical to w35-hard-1
  'w15-venue-1',
  'w15-venue-2',
  'w15-venue-3', // ⚠ byte-identical to w35-venue-1
  'w35-clay-1',
  'w35-grass-1',
  'w35-hard-1',
  'w35-venue-1',
  // ⚠ W50 AND W75 LANDED MID-WAVE, 19:01 and 19:09 on 04.08, as five raw .jpg masters each, dropped
  // straight into public/images/fields/ rather than into a `-jpeg` inbox. `npm run art` encoded them
  // in place and filed the masters into art-src/ (scripts/optimize-art.mjs, "anything else encodes
  // in place"), so they ship as webp like the rest. Both rungs stopped borrowing within the hour
  // their `absent` rows went into docs/art-placeholders.md - which is the loop that registry is for.
  'w50-clay-1',
  'w50-grass-1',
  'w50-hard-1',
  'w50-venue-1',
  'w50-venue-2',
  'w75-clay-1',
  'w75-grass-1',
  'w75-hard-1',
  'w75-venue-1',
  'w75-venue-2',
  'w100-clay-1',
  'w100-grass-1',
  'w100-hard-1',
  'w100-venue-1',
  'wta125-clay-1',
  'wta125-grass-1',
  'wta125-hard-1',
  'wta125-venue-1',
  'wta250-clay-1',
  'wta250-grass-1',
  'wta250-hard-1',
  'wta250-venue-1',
  'wta250-venue-2',
  'wta500-clay-1',
  'wta500-grass-1',
  'wta500-hard-1',
  'wta500-hard-2',
  'wta500-venue-1',
  'wta500-venue-2',
  'wta1000-clay-1',
  'wta1000-clay-2',
  'wta1000-grass-1',
  'wta1000-grass-2',
  'wta1000-hard-1',
  'wta1000-hard-2',
  'slam-clay-1',
  'slam-grass-1',
  'slam-hard-1',
  'slam-hard-2',
]

/** Weakest to strongest – the direction "nearest LOWER tier" walks.
 *
 *  ⚠ IT USED TO STOP AT `j300`, AND THAT WAS BACKLOG #86. Ten adult rungs fell off the end of this
 *  array, so `ART_TIER_ORDER.indexOf(t)` was -1 for every one of them, the lower-tier walk never
 *  ran, and a WTA 1000 card landed on the generic establishing shot – a junior-tour photograph on
 *  the biggest week of her career. It is now the full ladder, and `tests/redesign-home.test.ts`
 *  asserts it EQUALS `TIER_LADDER`, so a seventeenth rung cannot be added to the engine without
 *  this list noticing. */
export const ART_TIER_ORDER: readonly TierId[] = [
  'local', 'regional', 'national',
  'j30', 'j60', 'j300',
  'w15', 'w35', 'w50', 'w75', 'w100', 'wta125',
  'wta250', 'wta500', 'wta1000', 'slam',
]

/**
 * The rungs that have no art of their own and borrow a neighbour's, and the neighbour each borrows.
 * Every entry here is a DEBT, and it is registered as an `absent` row in docs/art-placeholders.md –
 * `tests/art-placeholders.test.ts` asserts this map and that registry name the same set, so a rung
 * cannot start or stop borrowing silently.
 *
 * `j60` / `j300` -> `j30`: the same junior-tour venues a rung up (the handed-down rule 4). A
 * stand-in, not a compromise, and the only junior set that exists.
 *
 * ⚠ `w50` AND `w75` WERE IN THIS MAP FOR ABOUT AN HOUR EACH, and the rule they were added under is
 * worth keeping written down because the next unpainted rung will need it: BORROW THE NEAREST
 * POPULATED RUNG, and do not let two borrowers share a lender. W50's neighbours were W35 (15 rungs
 * below) and W100 (50 above), so it went down; W75's were W35 (40 below) and W100 (25 above), so it
 * went up. Nearest-rung keeps the scale of the venue honest to within one step - a card that
 * over-promises a stadium is the same kind of lie as one that under-promises a court - and splitting
 * the two kept a W50 card and a W75 card in one season from being the same photograph, which is the
 * whole point of rule 3. The owner delivered both sets while this branch was being written
 * («в процессе, так же как и трофеи», then five masters each within the hour), so both entries and
 * their six registry rows came straight back out. NO ADULT RUNG BORROWS ANY MORE.
 */
export const ART_TIER_BORROWS: Partial<Record<TierId, TierId>> = {
  j60: 'j30',
  j300: 'j30',
}

function artTier(tier: TierId): TierId {
  return ART_TIER_BORROWS[tier] ?? tier
}

const startsWith = (prefix: string) => FIELD_ART.filter((stem) => stem.startsWith(prefix))

/** The candidate pool for one (tier, surface), in preference order – RULE 2's ladder, and the only
 *  thing that decides what a card is ALLOWED to show. Never empty. */
export function venueCandidates(tier: TierId, surface: Surface): string[] {
  const t = artTier(tier)
  // 1. the real thing: this tier, this surface.
  const exact = startsWith(`${t}-${surface}-`)
  if (exact.length) return exact
  // 2. this tier's SURFACE-NEUTRAL establishing shots – right place, promises no court.
  const neutral = startsWith(`${t}-venue-`)
  if (neutral.length) return neutral
  // 3. the nearest LOWER tier on the right surface – a smaller venue, but the correct court.
  for (let i = ART_TIER_ORDER.indexOf(t) - 1; i >= 0; i--) {
    const lower = startsWith(`${ART_TIER_ORDER[i]}-${surface}-`)
    if (lower.length) return lower
  }
  // 4. any establishing shot at all, from any tier – still promises no surface.
  const anyNeutral = FIELD_ART.filter((stem) => stem.includes('-venue-'))
  if (anyNeutral.length) return anyNeutral
  // 5. total: something rather than a broken frame. Unreachable with the current set.
  return [...FIELD_ART]
}

/**
 * THE ROTATION RING for one (tier, surface): the ladder's courts first, then the tier's own
 * establishing shots as the tail. This is RULE 3's pool, and it is a separate function from
 * `venueCandidates` on purpose – the ladder answers "what may this card show", which is about
 * CORRECTNESS, and the ring answers "in what order does the feed walk them", which is about
 * VARIETY. Keeping them apart means rule 2's pins never move when rule 3 changes.
 *
 * WHY THE ESTABLISHING SHOTS ARE IN THE RING AT ALL, and not only when a surface has no court:
 * «если именно clay не хватает – то показывать venue» is exactly what a cycle does. Walk the ring
 * and the courts come first; when they are exhausted the venue frames cover the rest of the lap,
 * then it starts again. It is also the only thing that makes «должны быть использованы все» true –
 * every adult tier paints all three surfaces, so an establishing shot that is not in its own tier's
 * ring is a file NOTHING can ever request.
 *
 * A tier with one court and two venue frames therefore shows the court one lap in three. That is
 * the owner's «разбавлять ленту артами», and the cure for wanting the court more often is a second
 * court master, not a weighting.
 */
export function venueVariants(tier: TierId, surface: Surface): string[] {
  const ladder = venueCandidates(tier, surface)
  const neutral = startsWith(`${artTier(tier)}-venue-`)
  // When the ladder ALREADY answered with the neutral shots (step 2 – no court on this surface),
  // appending them again would double every frame and halve the ring's effective length.
  return [...ladder, ...neutral.filter((stem) => !ladder.includes(stem))]
}

// --- THE STABLE ORDINAL --------------------------------------------------------------------------
//
// An event's index in its OWN tier's chronological sequence. This is the one number that makes an
// anti-repeat rule expressible without state, and it is available to the UI because the calendar is
// a pure function: `world.season` is dealt one 52-week block at a time by
// `buildSeason(`${seed}:s${block}`, block * SEASON_CHUNK, SEASON_CHUNK, background)` (world.ts
// `ensureSeason`), so the same call here reproduces the same block. Costs 0.16 ms, measured, and is
// memoised per (seed, block) – a career touches eight of them.
//
// ⚠ THE BACKGROUND ARGUMENT IS DELIBERATELY OMITTED. `buildSeason` takes one, but it reaches only
// `travelCostCents` (through its own `:travelbg:` sub-stream); the week/tier/surface grid is
// background-independent by construction – the MAIN season draw order does not branch on it – and
// `tests/art/venue-rotation.test.ts` pins that. Passing it would mean the picker needed a fact the
// snapshot's `seed` does not carry, for no change in the answer.
//
// ⚠ AND IT DEGRADES, IT DOES NOT BREAK, ON A SAVE FROM AN OLDER PLACEMENT RULE. Season blocks are
// PERSISTED and never re-dealt (world.ts), so a career that predates a calendar change keeps a block
// this function would no longer produce. `before` counts the tier's weeks strictly BELOW this one
// rather than looking the week up, so a disagreement costs at worst a rung of the ring – the answer
// stays a pure function of (tier, surface, eventId, seed), which is rule 1, and rule 2 cannot be
// touched by an ordinal at all.

/** `${year}-w${week}-${tier}` (season/calendar.ts `makeEvent`) – the week is the ABSOLUTE career
 *  week, and it is the only part of the id this module reads. */
function weekOf(eventId: string): number | null {
  const m = /^\d+-w(\d+)-/.exec(eventId)
  return m ? Number(m[1]) : null
}

/** (seed, block) -> the weeks each tier plays in that block. Cleared wholesale rather than evicted:
 *  a career visits ~8 blocks, and only a test that walks many seeds can ever reach the cap. */
const blockCache = new Map<string, Map<TierId, number[]>>()

function tierWeeks(seed: string, block: number, tier: TierId): number[] {
  const key = `${seed}#${block}`
  let byTier = blockCache.get(key)
  if (!byTier) {
    if (blockCache.size >= 512) blockCache.clear()
    byTier = new Map<TierId, number[]>()
    for (const e of buildSeason(`${seed}:s${block}`, block * SEASON_CHUNK, SEASON_CHUNK)) {
      byTier.set(e.tier, [...(byTier.get(e.tier) ?? []), e.week])
    }
    for (const weeks of byTier.values()) weeks.sort((a, b) => a - b)
    blockCache.set(key, byTier)
  }
  return byTier.get(tier) ?? []
}

/** How many events of this tier the career has reached by this one – 0 for a tier's first event
 *  ever, +1 for each of its own events after it, across block boundaries. */
export function venueOrdinal(tier: TierId, eventId: string, seed: string): number {
  const week = weekOf(eventId)
  if (week === null) return 0 // not a calendar id (a test fixture, a preview) – still deterministic
  const block = Math.floor(week / SEASON_CHUNK)
  const weeks = tierWeeks(seed, block, tier)
  // A tier absent from the block (`everyNWeeks: 0`) has no sequence to count in; the week itself is
  // the best fixed fact left, and it is still stable.
  if (!weeks.length) return week
  // COUNT THE EARLIER BLOCKS, do not multiply. `block * weeks.length` looks equivalent and is not:
  // block 0 is SHORT, because `MIN_FIRST_EVENT_WEEK` floors the first placement so no event opens
  // already-closed. Measured, on the seam it produces: slam stepped 0-w34 -> 1-w54 by TWO, and the
  // two events either side of the join showed the same photograph – the one thing this ordinal
  // exists to prevent. Every block is memoised, so a career at block 8 pays eight map lookups.
  let before = 0
  for (let b = 0; b < block; b++) before += tierWeeks(seed, b, tier).length
  for (const w of weeks) if (w < week) before++
  return before
}

/** The stem this event shows, forever. */
export function venueArtStem(tier: TierId, surface: Surface, eventId: string, seed: string): string {
  const ring = venueVariants(tier, surface)
  if (ring.length < 2) return ring[0]
  // WHERE THE CAREER'S OWN ROTATION STARTS. One draw off a purpose-scoped sub-stream keyed by the
  // rung and the surface, so two careers walk the same ring from different rungs and two tiers
  // sharing a borrowed set (w50 and w35) do not walk it in step. Zero MAIN draws; re-derived here,
  // persisting nothing, exactly as the per-event draw it replaces did.
  const offset = Math.floor(rngFromSeed(`${seed}:venue:${tier}:${surface}`)() * ring.length)
  return ring[(venueOrdinal(tier, eventId, seed) + offset) % ring.length]
}

/** Field-art URL for one stem. */
export function fieldUrl(stem: string): string {
  return `${import.meta.env.BASE_URL}${FIELD_DIR}${stem}.webp`
}

/** What the Home next-tournament card binds to its `<img>`. */
export function venueArtUrl(tier: TierId, surface: Surface, eventId: string, seed: string): string {
  return fieldUrl(venueArtStem(tier, surface, eventId, seed))
}
