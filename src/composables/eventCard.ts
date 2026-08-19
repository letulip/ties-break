// ONE UPCOMING TOURNAMENT, PRESENTED – the parts the Season feed and the Calendar's marker card
// both draw, owned once.
//
// ⚠ WHAT THIS IS NOT. It is not a mega-card component and it is not a view-model framework. The two
// screens draw genuinely different cards: Season's is a row in a scrolling feed with the entry and
// withdrawal controls on it, the Calendar's is a takeover opened from a marker, and their markup,
// classes and copy stay their own. What was duplicated is not the CARD, it is the small facts the
// card is made of – the photograph, the court's verdict, the scholarship's share, and the way an
// odds ring is named – and those are what live here.
//
// ⚠ THE RING'S COLOUR LEFT FOR `composables/readingColor.ts` AND WAS NOT REPLACED BY A WRAPPER.
// `chanceColor` was here, and it was one of FOUR copies of the same red-to-green ramp – the other
// three sat inline in HomeScreen, KidScreen and TournamentFlow, which draw a CONDITION ring and have
// nothing to do with an event card. A ramp that five surfaces share cannot be owned by the module
// that owns two of them, so it moved out whole; the two screens here now call `readingColor` for
// themselves, exactly as the other three do.
//
// ⚠ THE RING'S ACCESSIBLE NAME IS THE ONE THAT ACTUALLY MATTERED. It was written out twice, as a
// template literal inside each screen's `:label`, which means the two surfaces could have described
// the same ring in two different sentences without anything failing – and the phrasing is the only
// thing a screen reader ever gets, because the ring itself is a graphic and the visible `42%` says
// nothing about what it is 42% OF.
import { computed, type ComputedRef } from 'vue'
import { useGameStore } from '../stores/game'
import { venueArtUrl } from '../art/venues'
import { surfaceStyleHint } from '../engine/match/style'
import type { Surface } from '../engine/match/types'
import type { TierId } from '../engine/season/types'

/** Just enough of an event to paint it. Structural rather than `UpcomingEvent` for the same reason
 *  `NameableEvent` is (see `eventName.ts`): any shape carrying these three can ask. */
export interface PaintableEvent {
  id: string
  tier: TierId
  surface: Surface
}

/** Just enough of a preview to name the odds ring. */
export interface FirstMatchOdds {
  firstMatchChance: number
  opponentName: string
}

/** The odds ring's ACCESSIBLE NAME. A ring is a graphic and its visible `42%` is a bare number, so
 *  this sentence is the whole of what a screen reader is told about it – hence "percent" spelled out
 *  and the opponent named, and hence one owner rather than a literal per screen. */
export function firstMatchLabel(p: FirstMatchOdds): string {
  return `Her chance to win the first match: ${Math.round(p.firstMatchChance * 100)} percent, against ${p.opponentName}`
}

/** ...and its hover title, which is the short form of the same fact and travelled with it. */
export function firstMatchTitle(p: FirstMatchOdds): string {
  return `First round vs ${p.opponentName}`
}

/** The store-backed half: the three facts that need the live snapshot to answer. */
export function useEventCard(): {
  venueUrl: (e: PaintableEvent) => string
  surfaceVerdict: (surface: Surface) => string | null
  academyCoverPct: ComputedRef<number>
} {
  const game = useGameStore()
  return {
    /** The painted court for an event. Same picker Home uses, so one tournament wears one
     *  photograph wherever it appears – and the seed is read here rather than at each call site,
     *  which is what "one tournament, one photograph" actually rests on. */
    venueUrl: (e: PaintableEvent) =>
      venueArtUrl(e.tier, e.surface, e.id, game.snapshot?.seed ?? ''),
    /** The engine's own verdict on this court for her build, whole sentence, surface named.
     *  Consumed, not re-worded: SURFACE_STYLE_DELTAS is what actually moves her attributes, and a
     *  card that words the verdict itself is a card that can contradict the table. */
    surfaceVerdict: (surface: Surface) =>
      game.snapshot ? surfaceStyleHint(game.snapshot.profile.playStyle, surface) : null,
    academyCoverPct: useAcademyCoverPct(),
  }
}

/** The share of every trip the academy pays, as a percentage. One number for the whole calendar –
 *  the scholarship is a rate, not a per-event deal – and the travel figures beside it are already
 *  NET of it, so a smaller number with no explanation is worse than no discount (v21).
 *
 *  Exported on its own because the Money screen wants only this one: it reports the scholarship as a
 *  season total, not as a card. */
export function useAcademyCoverPct(): ComputedRef<number> {
  const game = useGameStore()
  return computed(() => Math.round((game.snapshot?.academy?.coverShare ?? 0) * 100))
}
