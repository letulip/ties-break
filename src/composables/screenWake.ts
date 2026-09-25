// THE SCREEN DOES NOT GO TO SLEEP WHILE A MATCH IS RUNNING – round-16 #20 («keep the screen awake
// during a match»). A match is watched, not touched: at ×1 a full set is minutes of a player holding
// a phone and doing nothing to it, which is exactly the input idleness every phone reads as "put the
// screen away". The Screen Wake Lock API is the browser's answer to that, and this file is all of it.
//
// -------------------------------------------------------------------------------------------------
// ⚠ IT RIDES ONE PREDICATE AND OWNS NONE OF ITS OWN
// -------------------------------------------------------------------------------------------------
// The caller hands over the ref that already means "a match is running on this screen", and there is
// exactly one such ref in the app: `playing`, from `composables/playbackClock.ts` – the ONE clock
// (R2-11), consumed by MatchViewer, which is the single component every match surface in the game
// mounts (the tournament flow, a practice friendly, MatchReplay from the Home feed / the Season
// bracket / the college card's Watch control, and the Season sandbox). A second spelling of "the
// match is live" is precisely the defect class the other half of this wave exists to guard, so this
// file deliberately cannot invent one: it has no idea what a match is.
//
// ⚠ AND IT IS NOT `mode === 'live'`, which is the predicate that LOOKS right and is about something
// else. That prop decides the blinking Live badge, and it is `'replay'` at three of the five call
// sites – including every re-watch in the game – because those matches were resolved by the engine
// before the screen opened. Riding it would leave the screen sleeping through most of the watching
// the item is about, and keep it awake on a finished box score.
//
// -------------------------------------------------------------------------------------------------
// ⚠ SILENCE IS THE FALLBACK, IN BOTH DIRECTIONS
// -------------------------------------------------------------------------------------------------
// Round-16 #20 asks for BEHAVIOUR, not a surface: there is no toggle, no setting, no feed row and no
// string anywhere in this file, and a player must never learn that the API exists. Two ways it can
// be absent and both end the same way – nothing:
//   * NO CAPABILITY. Safari before 16.4, any browser with the API behind a flag, a Web Worker, the
//     unit runner, happy-dom. `screenWakeApi()` answers null and not one call is made.
//   * A REFUSAL. `request()` returns a PROMISE and that promise REJECTS – `NotAllowedError` when the
//     document is not visible or not fully active, and browsers are free to refuse for their own
//     reasons (battery saver is the common one). This is an ordinary outcome of a normal call, not an
//     error condition, so it is swallowed where it happens. Nothing is logged: a console line is a
//     thing a player can find, and "your phone declined to stay awake" is not news to anybody.
//
// -------------------------------------------------------------------------------------------------
// ⚠ RE-ACQUIRING ON `visibilitychange` IS THE API'S OWN CONTRACT, NOT A NICETY
// -------------------------------------------------------------------------------------------------
// The platform RELEASES a screen wake lock the moment the document stops being visible, and it never
// gives it back on its own. A sentinel we are still holding after that is a released one, so coming
// back to a running match without asking again would mean the lock silently worked exactly once per
// visit to another app – which is the shape of the original complaint. Hence: going away DROPS the
// handle (the platform has already taken the lock; releasing our copy is a no-op we make anyway so
// the two states cannot disagree), and coming back ASKS AGAIN, but only if the match is still running.
//
// That last clause is the whole of "and not if it has ended", and it is free: `playing` is false the
// moment `playbackClock.finish()` runs, so a finished match cannot be re-acquired for by definition.
// The clock's own visibility listener and this one are not two owners of anything – the clock decides
// whether the MATCH runs, this decides whether the SCREEN sleeps, and the second reads the first.
import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

/**
 * The live API, or null wherever the question cannot be asked. Modelled on `reducedMotion.ts`'s
 * rule: the most defensive spelling is the one that survives, asked at the moment it matters rather
 * than at module load. `navigator` itself is absent in a worker and `wakeLock` is absent in every
 * environment the tests run in, so both are checked, and the try/catch covers the hardened contexts
 * where merely touching the property throws.
 */
function screenWakeApi(): WakeLock | null {
  try {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return null
    const api = navigator.wakeLock
    return typeof api?.request === 'function' ? api : null
  } catch {
    return null
  }
}

/**
 * Hold a screen wake lock for exactly as long as `live` is true, and nowhere else.
 *
 * Four events, one owner:
 *   * `live` becomes true  -> ask for the lock (immediately, so a caller that is already live when it
 *                             installs this is covered).
 *   * `live` becomes false -> give it back. The end of a match, a pause, a skip to the result: the
 *                             caller's predicate decides, this file does not second-guess it.
 *   * `visibilitychange`   -> hidden drops the handle the platform has already taken; visible asks
 *                             again, but only while `live` still says so.
 *   * unmount              -> give it back and drop the listener. ⚠ THIS ONE CANNOT BE LEFT TO THE
 *                             WATCHER. A component's effect scope is stopped as part of unmounting,
 *                             so a `live` that flips false during teardown may never reach a watcher
 *                             callback – and a wake lock that outlives the screen it was taken for is
 *                             a phone that will not sleep. `tests/component/screen-wake.test.ts`
 *                             fails on the version without this line.
 */
export function useScreenWake(live: Ref<boolean>): void {
  /** The lock we are holding right now, or null. Written in exactly two places, below. */
  let sentinel: WakeLockSentinel | null = null
  /** A request is out. Without this, a `live` flip and a visibility return landing in the same tick
   *  would each take a lock and only one of them would ever be released. */
  let asking = false

  async function acquire(): Promise<void> {
    const api = screenWakeApi()
    if (api === null || sentinel !== null || asking) return
    asking = true
    try {
      const granted = await api.request('screen')
      // The wait is real, and the match can end inside it (a skip, a close, the last point). Whoever
      // asked is no longer the situation we are in, so hand it straight back rather than leaking it.
      if (live.value) sentinel = granted
      else void granted.release().catch(() => {})
    } catch {
      // Refused. See the header: this is an outcome, not an error, and the player never hears of it.
    } finally {
      asking = false
    }
  }

  function release(): void {
    const held = sentinel
    sentinel = null
    if (held === null) return
    try {
      // `release()` on an already-released sentinel resolves rather than throwing, which is what
      // makes the hidden/unmount overlap harmless – but a rejection is still swallowed, because a
      // failed release is not news either.
      void held.release().catch(() => {})
    } catch {
      // ditto
    }
  }

  function onVisibilityChange(): void {
    if (document.hidden) release()
    else if (live.value) void acquire()
  }

  watch(
    live,
    (isLive) => {
      if (isLive) void acquire()
      else release()
    },
    { immediate: true },
  )

  // Per instance and feature-guarded, the same way `playbackClock.ts` registers its own listener and
  // for the same reason: this guards one component's lock, and the environments without a `document`
  // must be untouched.
  onMounted(() => {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange)
    release()
  })
}
