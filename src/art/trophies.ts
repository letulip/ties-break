// HOW A PIECE OF SILVERWARE IS ADDRESSED — one function, and it is the only one.
//
// Eighteen masters ship as `public/images/trophies/<tier>-<metal>.webp`: nine tiers, gold and silver
// each. The Trophy Cabinet (`screens/TrophiesScreen.vue`) drew them first and owned the spelling as
// a private helper; the tournament finale now hangs the same objects on its podium, so the spelling
// moved OUT of the screen rather than being written a second time next to it.
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
// `images/` because that is what workbox's `globIgnores: ['**/images/**']` keys on — all eighteen
// stay out of the precache, so an install pays nothing for a cabinet most careers never fill, while
// the CacheFirst runtime route makes each one offline-durable from the first time it is drawn.
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
