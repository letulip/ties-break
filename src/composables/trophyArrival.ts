// A TROPHY ARRIVING IN THE CABINET — the flight, and the dot it leaves behind.
//
// -------------------------------------------------------------------------------------------------
// THE OWNER'S ASK (31.07), in his words
// -------------------------------------------------------------------------------------------------
//   «Можно даже анимацию сделать "добавления трофея в раздел трофеев" с точечкой зеленой по итогу»
//
// Two halves, and only the first one is decoration. The flight is a nicety; the DOT is information,
// and the two therefore have completely different rules about when they may be withheld.
//
// -------------------------------------------------------------------------------------------------
// ⚠ THE DOT ASSERTS A FACT. IT IS NOT A GUESS ABOUT ATTENTION.
// -------------------------------------------------------------------------------------------------
// The house rule is Home's bell, stated in its own words: "the bell's dot asserts one FACT and not
// the 'unread' it cannot know". A dot that means "you have not read this" is a claim about a person;
// the app has no access to a person. So this one means exactly:
//
//     THE CABINET HOLDS A PIECE OF SILVERWARE THAT ARRIVED AFTER THE LAST TIME IT WAS OPENED.
//
// Every word of that is checkable. `trophiesByTier` is the ledger and it only ever GROWS, so the
// count of pieces in it is a monotonic number; the watermark is that number as it stood when the
// player last had the cabinet on screen. `pieces > seenPieces` is then a fact about two integers,
// and the dot goes out the moment the cabinet is opened — because at that instant the sentence
// stops being true, not because we have decided the player has "seen" anything.
//
// ⚠ AND A MISSING WATERMARK IS NOT ZERO. A career that already has trophies and no stored watermark
// (a save from before this shipped, a different device) is a case where the app genuinely does not
// know whether the cabinet was ever opened — so it must not claim it was not. The watermark is
// initialised to the CURRENT count in that case, which asserts nothing at all and lets the next
// trophy be the first one the dot ever speaks about. This is the same discipline the news dot uses
// (`if (lastSeenNewsId.value < 0) markNewsSeen()`, App.vue), and for the same reason: a watermark
// that defaults low invents freshness the stored history denies.
//
// -------------------------------------------------------------------------------------------------
// ⚠ REDUCED MOTION SKIPS THE FLIGHT AND NOTHING ELSE
// -------------------------------------------------------------------------------------------------
// A player who asked their system for less motion has not asked for less information. `armFlight`
// refuses in SCRIPT (the ConfettiBurst rule: a `@media` variant that sets `animation: none` would
// still mount the element and leave it lying in the corner), so under reduced motion nothing is
// mounted at all — and the trophy is still in the cabinet, and the dot still appears, immediately,
// because `inFlight` is never true and there is nothing to wait for.
//
// -------------------------------------------------------------------------------------------------
// WHY THE DOT WAITS FOR THE FLIGHT, AND WHY THAT IS NOT A LIE
// -------------------------------------------------------------------------------------------------
// The engine writes the ledger when the tournament is finalised, which is several taps BEFORE the
// player presses Continue — so `pieces > seenPieces` is already true while the finale is still on
// screen, behind a full-screen takeover that covers the bar. The dot is therefore never withheld
// from anyone who could see it: it is held for the ~700ms the trophy is in the air, so that it
// arrives when the trophy does, which is the whole point of the animation the owner asked for
// («с точечкой зеленой ПО ИТОГУ» — the dot is the result of the flight, not a thing beside it).
// If the flight never starts, the dot is not held for a single frame.
import { ref, type Ref } from 'vue'
import { TIER_LADDER } from '../engine/season/calendar'
import type { Snapshot } from '../shared/protocol'
// ⭐ U-05 – ASKED IN ONE PLACE NOW. The local copy checked `typeof window`; the shared one checks
// `typeof matchMedia`, which is the same guard one level closer to the thing that can be missing.
// Still called at TAKE-OFF rather than at module load: a player can change the preference without
// reloading the PWA, and this module is imported by tests that have no `matchMedia` at all.
import { prefersReducedMotion } from './reducedMotion'

/** The one snapshot fact the dot reads. Structural, so a test can hand in a plain object. */
export type TrophyFacts = Pick<Snapshot, 'trophiesByTier'>

/**
 * How many pieces of silverware the cabinet holds — titles plus lost finals, every tier.
 *
 * ⚠ IT COUNTS OBJECTS, NOT TIERS, and that distinction is the dot's accuracy. `bestFinishByTier` is
 * a high-water mark and would say nothing at all when a second J300 title lands on a shelf that
 * already had one; the cabinet's own screen prints `x8` off these arrays, so counting them is the
 * same arithmetic the room the player is about to walk into is doing.
 *
 * Walks `TIER_LADDER` rather than `Object.values` so a save whose shelf is missing (the self-healing
 * case `tests/trophy-cabinet.test.ts` pins) counts as empty instead of throwing, and so a stray key
 * cannot inflate the total.
 */
export function trophyPieces(snap: TrophyFacts | null | undefined): number {
  const ledger = snap?.trophiesByTier
  if (!ledger) return 0
  let pieces = 0
  for (const tier of TIER_LADDER) {
    const shelf = ledger[tier]
    pieces += (shelf?.titles.length ?? 0) + (shelf?.finals.length ?? 0)
  }
  return pieces
}

/**
 * The Trophies tab's dot: the cabinet holds something that arrived since it was last opened.
 *
 * `seenPieces` is the count at the player's last visit (per-career watermark in localStorage — the
 * R9-21b news pattern). `inFlight` is the ~700ms the trophy is still visibly on its way there; see
 * the header for why holding the dot for that beat withholds nothing from anybody.
 */
export function trophyDotShows(pieces: number, seenPieces: number, inFlight: boolean): boolean {
  return !inFlight && pieces > seenPieces
}

// =================================================================================================
// THE FLIGHT
// =================================================================================================
//
// A channel, not a component: the trophy takes off from inside `TournamentFlow`'s takeover and lands
// on the tab bar, which is `App.vue`'s. Neither can render the whole path — the takeover is a
// clipped, scrolling overlay and the bar is behind it — so the flying element belongs to the shell,
// at the root, and the finale only says "one left, from here". A module-level ref is the honest size
// of that: one flight can be in the air at a time, by construction.

/** Where the flying trophy starts, where it is going, and how much it shrinks on the way. Plain
 *  numbers in viewport pixels, measured ONCE at take-off while both ends are still on screen. */
export interface TrophyFlight {
  /** the same webp the poster was showing — the object does not change identity mid-air */
  src: string
  left: number
  top: number
  size: number
  dx: number
  dy: number
  scale: number
}

/** How long the trophy is in the air. ⚠ MUST MATCH `--trophy-flight-dur` in src/style.css: this
 *  number decides when the dot lands and that one decides when the animation ends, and a dot that
 *  appears before the trophy has arrived is worse than no animation at all. */
export const TROPHY_FLIGHT_MS = 720

/** What the trophy shrinks to, in px — a tab glyph's worth, so it reads as going INTO the tab. */
const LANDING_SIZE = 22

/** The tab it is flying to. The attribute already exists for the coach-mark tour, which finds its
 *  anchors exactly this way (`components/OnboardingTour.vue`), so the bar is not growing a second
 *  way to be pointed at. */
const TROPHIES_TAB = '[data-tour="tab-trophies"]'

const flight = ref<TrophyFlight | null>(null)
let clearTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Send a trophy to the cabinet. Returns whether anything is actually flying — the caller does not
 * need it, but a false answer is the reduced-motion path and saying so out loud is cheaper than
 * inferring it later.
 *
 * ⚠ BOTH RECTS ARE MEASURED NOW, synchronously, inside the click that closes the finale. The start
 * is about to be unmounted with the takeover, and measuring it a tick later would measure nothing.
 * The destination is measurable at the same moment because the bar renders under the overlay rather
 * than being swapped out for it.
 */
export function armTrophyFlight(src: string, fromEl: Element | null | undefined): boolean {
  if (!src || !fromEl || prefersReducedMotion()) return false
  const from = fromEl.getBoundingClientRect()
  const to = document.querySelector(TROPHIES_TAB)?.getBoundingClientRect()
  // No tab on screen (or a zero-size poster mid-transition) means there is nowhere to fly to, and a
  // flight to nowhere would hold the dot back for nothing. Fall through to the immediate dot.
  if (!to || from.width <= 0 || to.width <= 0) return false

  const size = Math.max(from.width, from.height)
  const scale = LANDING_SIZE / size
  // Translate the CENTRE of the mark onto the CENTRE of the tab button. The element is positioned by
  // its top-left and scaled about its own middle, so the offset is centre-to-centre and the scale
  // does not enter into it.
  flight.value = {
    src,
    left: from.left,
    top: from.top,
    size,
    dx: to.left + to.width / 2 - (from.left + from.width / 2),
    dy: to.top + to.height / 2 - (from.top + from.height / 2),
    scale,
  }
  if (clearTimer !== null) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    flight.value = null
    clearTimer = null
  }, TROPHY_FLIGHT_MS)
  return true
}

/** The shell's read-only view of the channel. */
export function useTrophyFlight(): { flight: Ref<TrophyFlight | null> } {
  return { flight }
}
