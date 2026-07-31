// A SCREEN OPENS AT ITS TOP (owner, 31.07: «after a transition between screens, always land at the
// top of the new screen - today a screen can open already scrolled»).
//
// WHY THIS IS NEEDED AT ALL, given that every screen in this app is `v-if`'d and therefore mounts a
// brand-new element. Because the SCROLLER is not the screen. There are exactly two scrollers in the
// game and neither of them is ever unmounted by a screen change:
//
//   * the DOCUMENT, for the five tabbed screens. `main.app-content` sets no `overflow`, so the page
//     itself scrolls, and `tab` swapping HomeScreen for StatsScreen leaves `window.scrollY` exactly
//     where the player had put it. Scroll to the bottom of Home's news feed, tap Stats, and Stats
//     opens two thirds of the way down - which is what he was describing.
//   * `.tf-body`, for the four takeover surfaces. The shell stays mounted across a flow's phases, so
//     the tournament's pre-match card -> live match -> box score -> poster all inherit whatever
//     scroll position the previous phase was left at.
//
// A router would have done this for us (`scrollBehavior`), and there is no router - a plain ref
// switch, per the spec. So this is the one piece of that behaviour we do want, written once.
//
// WHY IT IS NOT `scroll-behavior: smooth` OR `scrollIntoView`: this is not a movement the player
// asked for and should not be animated. Three screens in this app DO scroll on purpose (the coach
// market's tier chips, Home's news jump, Money's ledger) and each of those is smooth because the
// player pressed something and needs to see where they went. Arriving at a new screen is not a
// journey across it; it is where the screen starts.
import { nextTick, watch, type Ref, type WatchSource } from 'vue'

/** Put a scroller back at its top. `el` null/absent means the document, which is the scroller for
 *  every tabbed screen; a takeover passes its own `.tf-body`. */
export function scrollToTop(el?: HTMLElement | null): void {
  if (el) {
    el.scrollTop = 0
    return
  }
  // Feature-guarded so the unit environment, which has no window, is untouched.
  if (typeof window !== 'undefined') window.scrollTo(0, 0)
}

/**
 * Land at the top whenever `source` changes - i.e. whenever what is on screen becomes a different
 * screen. The caller says what "a different screen" means for it, because only the caller knows:
 * the shell's is `tab`, a flow's is its phase.
 *
 * AFTER `nextTick`, DELIBERATELY. The new screen has to exist before its scroller can be told where
 * to start: reset on the same tick and the old screen's (taller) content is still in the DOM, so a
 * document scroll to 0 is immediately undone by the browser's own scroll anchoring as the swap
 * lands. One tick later the element under the scroller is the one the player is about to read.
 */
export function useScrollReset(source: WatchSource, el?: Ref<HTMLElement | null>): void {
  watch(source, () => {
    void nextTick(() => scrollToTop(el?.value ?? null))
  })
}
