// THE VENUE ART PICKER (epic/redesign-home, slice A) – which painted court a tournament card shows.
//
// 20 masters shipped as `public/images/fields/<tier>-<surface>-<n>.webp`, plus three `-venue-`
// frames that are ESTABLISHING shots (a gate, a walkway) with no playable court in frame – the ones
// to use where a card must not promise a surface.
//
// TWO HARD RULES, and they are the whole module:
//
//  1. STABLE FOREVER. A tournament's photograph is part of what that tournament IS; it may not
//     change between two renders, two reloads or two replays of the same career. The pick is drawn
//     from `seed:venue:<eventId>` – a purpose-scoped sub-stream, zero MAIN-stream draws, so the
//     frozen capture cannot move and nothing here runs inside the tick.
//
//  2. NEVER PROMISE THE WRONG SURFACE. The card names the surface immediately under the picture
//     (the design export's own layout), so a grass event painted on a clay court is the diary's
//     cardinal sin – a surface the simulation will not play on, asserted in a picture. This is the
//     one place the fallback ladder handed down with the art was NARROWED: "same tier, any surface"
//     became "same tier, SURFACE-NEUTRAL shot", and a lower-tier court on the RIGHT surface is
//     preferred to a same-tier court on the wrong one. The narrowing stands on its own merits, but
//     the gap that used to prove it is CLOSED: `regional-grass-1` shipped 04.08 and a regional grass
//     week no longer borrows `local-grass-1`. Every tier local..j30 now paints its own surfaces.
//     (j30 has all three surfaces AND its own establishing shot since the owner's second wave.)

import type { TierId } from '../engine/season/types'
import type { Surface } from '../engine/match/types'
import { rngFromSeed } from '../engine/rng'

const FIELD_DIR = 'images/fields/'

/** Every field master that ships, by stem. Kept as a literal list rather than a glob because the
 *  test that pins it checks these names against the files on disk in BOTH directions – a stem with
 *  no file is a 404 on a card, and a file with no stem is art nothing can ever show. */
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
]

/** Weakest to strongest – the direction "nearest LOWER tier" walks. */
const ART_TIER_ORDER: readonly TierId[] = ['local', 'regional', 'national', 'j30', 'j60', 'j300']

/** j60 and j300 have no art of their own yet and borrow the j30 set (the handed-down rule 4). They
 *  are the same junior-tour venues a rung up, so this is a stand-in, not a compromise. */
function artTier(tier: TierId): TierId {
  return tier === 'j60' || tier === 'j300' ? 'j30' : tier
}

const startsWith = (prefix: string) => FIELD_ART.filter((stem) => stem.startsWith(prefix))

/** The candidate pool for one (tier, surface), in preference order. Never empty. */
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

/** The stem this event shows, forever. */
export function venueArtStem(tier: TierId, surface: Surface, eventId: string, seed: string): string {
  const pool = venueCandidates(tier, surface)
  const rng = rngFromSeed(`${seed}:venue:${eventId}`)
  return pool[Math.floor(rng() * pool.length)]
}

/** Field-art URL for one stem. */
export function fieldUrl(stem: string): string {
  return `${import.meta.env.BASE_URL}${FIELD_DIR}${stem}.webp`
}

/** What the Home next-tournament card binds to its `<img>`. */
export function venueArtUrl(tier: TierId, surface: Surface, eventId: string, seed: string): string {
  return fieldUrl(venueArtStem(tier, surface, eventId, seed))
}
