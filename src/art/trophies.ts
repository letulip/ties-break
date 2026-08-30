// HOW A PIECE OF SILVERWARE IS ADDRESSED — one function, and it is the only one.
//
// One file per rung per metal ships as `public/images/trophies/<tier>-<metal>.webp` – the count is
// `TIER_LADDER.length * 2` and is asserted as such rather than written down, so a new rung cannot
// make this sentence stale. The Trophy Cabinet (`screens/TrophiesScreen.vue`) drew them first and
// owned the spelling as a private helper; the tournament finale now hangs the same objects on its
// podium, so the spelling moved OUT of the screen rather than being written a second time next to it.
//
// ⚠ SEVEN OF THE PAIRS ARE PLACEHOLDER COPIES, NOT ORIGINALS, and the list is NOT here - it is
// `docs/art-placeholders.md`, kept honest in both directions by `tests/art-placeholders.test.ts`.
// This comment said "three pairs" for two days after act 3 made it seven, which is the whole reason
// the list moved out of a comment and into a checked file: prose about which art is real goes stale
// silently, a hash does not. Copies on disk rather than an alias in this function, deliberately -
// the naming scheme stays uniform, both direction-checks in tests/trophy-podium.test.ts stay exact,
// and the day the real masters are cut they replace files instead of deleting a code path. Same rule
// the venue art already lives by (art/venues.ts: "a stand-in, not a compromise").
//
// -------------------------------------------------------------------------------------------------
// ⚠ WHY THIS IS A MODULE AND NOT A COPIED LINE
// -------------------------------------------------------------------------------------------------
// This app has already paid for the alternative, twice, in the same shape:
//
//   * the finale's own portrait used to hand-build a `-fs8` filename that the PRELOADER also
//     hand-built, the two spellings disagreed, and the adult champion splash 404'd on the one screen
//     a player reaches by winning (see `art/preload.ts`'s note on `finaleUrl`);
//   * `SurfaceMark` was born because three screens each drew the surface ring themselves and one of
//     them had `surf-clay` hard-coded, so every court in the game was an orange ring labelled clay.
//
// A trophy url is the same kind of fact: a directory, a naming scheme, and a file extension that a
// build pipeline could change under both callers at once. One builder, checked against the files on
// disk by `tests/round13-nav.test.ts` (all eighteen present, none of them `-fs8`) and by
// `tests/trophy-podium.test.ts` (every url this function can produce resolves to a real file).
//
// -------------------------------------------------------------------------------------------------
// ⚠ THERE ARE TWO METALS AND THERE WILL NEVER BE A THIRD
// -------------------------------------------------------------------------------------------------
// Not an art budget — the DRAW. A knockout bracket ends with two losing semi-finalists and no
// play-off between them, exactly as real tennis does, so `finishLabel(2)` is "Semifinalist", plural
// by construction, and the engine never resolves a third-place match because no such match is ever
// drawn. Gold and silver are the only two objects a tournament in this game can produce. The union
// below is therefore closed on purpose: a `'bronze'` would not fail to find a file, it would fail to
// describe the sport.
//
// -------------------------------------------------------------------------------------------------
// WHY `images/`, AND WHY THE URL IS BASE-RELATIVE
// -------------------------------------------------------------------------------------------------
// `BASE_URL` rather than a leading slash: the PWA ships under a sub-path. And the set lives under
// `images/` because that is what workbox's `globIgnores: ['**/images/**']` keyed on — every one of
// them stayed out of the precache, so an install paid nothing for a cabinet most careers never fill,
// while the CacheFirst runtime route made each one offline-durable from the first time it was drawn.
//
// ⚠⚠ BOTH HALVES OF THAT ARE GONE, 29.08 (round 29 part two #7). `globIgnores` is deleted and the
// 32 trophy webp (749 KiB) are in every install; the CacheFirst and StaleWhileRevalidate routes are
// deleted with it. `images/` is now simply where the art lives. ⭐ And the freshness problem that
// forced the trophies into their OWN runtime cache is solved rather than moved: he repainted two
// trophies on 01.08 and his phone kept the old ones for 60 days, because CacheFirst never
// revalidates. A precache entry is keyed on url+revision, so a repainted trophy has a new key and
// the next update fetches exactly it – one file, measured (tools/precache-delta.mjs).
import type { TierId } from '../engine/season/types'

const TROPHY_DIR = 'images/trophies/'

/** Gold = she won it. Silver = she LOST the final. See the header for why there is no third. */
export type TrophyMetal = 'gold' | 'silver'

/** The metal a finish is made of. `true` on the champion screen, `false` on the runner-up screen —
 *  the two states the finale poster can be in when she reached the Final at all.
 *
 *  It exists so the podium and the cabinet cannot disagree about which way round the pair goes: the
 *  cabinet builds its gold cell from `titles` and its silver cell from `finals`, and the poster
 *  builds one or the other from `pending.kidChampion`. Same two words, derived once. */
export function trophyMetalFor(champion: boolean): TrophyMetal {
  return champion ? 'gold' : 'silver'
}

/** `images/trophies/<tier>-<metal>.webp` — the whole naming scheme, in one place. */
export function trophyArtUrl(tier: TierId, metal: TrophyMetal): string {
  return `${import.meta.env.BASE_URL}${TROPHY_DIR}${tier}-${metal}.webp`
}
