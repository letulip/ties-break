// THE ONE PLAYBACK/VISIBILITY CLOCK – lifted out of MatchViewer.vue (R2-11: "one playback/visibility
// clock ... Never allow two clock/timer owners.").
//
// -------------------------------------------------------------------------------------------------
// ⚠ ONE OWNER, TWO HANDLES, AND THE DIFFERENCE MATTERS
// -------------------------------------------------------------------------------------------------
// This file holds a `requestAnimationFrame` id AND a `setTimeout` id, and that is not two clocks. The
// pre-roll timeout exists because the take-your-seats clip has to finish before the timeline starts,
// and it is the SAME owner's: both are armed only through `startClock()` and both are cleared only in
// `pauseInternal()`. What "never allow two clock/timer owners" forbids is a second thing that can
// advance or stop playback without going through this pair – and there is none: `tests/component/
// match-viewer-clock.test.ts` asserts it by mounting the component and counting.
//
// ⚠ WHY THAT IS WORTH A FILE. The viewer is where a second owner would arrive: something needs a
// short delay, `setTimeout` is one line, and now two things decide whether the match is running. The
// clock being a named owner with a named surface (`start` / `pause` / `finish` / `resetRun`) is what
// makes the second one obviously wrong rather than merely undesirable.
//
// ⚠ EVERY COMMENT BELOW IS THE VIEWER'S OWN, CARRIED VERBATIM – the owner's 31.07 ruling on
// backgrounding, R9-24's rate-matched hold, round-7 item 11's clip length. CLAUDE.md's rule for moved
// code: preserve the reasoning, it IS the record.
//
// ⚠ IT TAKES `speed` AND `viewMode` AS REFS AND OWNS NEITHER. They are CONTROLS – the transport
// plate's – and the clock only reads them. What it owns is `playing`, `finished`, and the two handles.
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import type { ViewMode } from '../viz/types'
import type { MatchSpeed } from './matchDefaults'

export interface PlaybackClock {
  /** is the clock running (or holding for the pre-match beat) right now? */
  playing: Ref<boolean>
  /** has playback reached the end? Written only through `finish()`. */
  finished: Ref<boolean>
  /** Start or resume: the pre-match hold on a fresh run, then the rAF loop. */
  start: () => void
  /** Stop the clock and clear BOTH handles. The only pause in the component. */
  pause: () => void
  /** Playback is over. Pauses first, so nothing can paint after the end. */
  finish: () => void
  /** A fresh run (mount, new match, Watch again, in/out of skip): the pre-match beat is owed again. */
  resetRun: () => void
}

export interface PlaybackClockOptions {
  /** the transport's speed pill – read, never written */
  speed: Ref<MatchSpeed>
  /** the transport's view pill – 'skip' never walks points, so the clock never starts */
  viewMode: Ref<ViewMode>
  /** the pre-match take-your-seats beat, if this speed plays one (the audio owner decides) */
  onPreRollCue: () => void
  /** the loop is actually beginning – where the music is ducked */
  onLoopStart: () => void
  /** ONE PAINT: walk the timeline by `dt` seconds of TIMELINE time, move the players, draw */
  onFrame: (dt: number) => void
}

/**
 * THE LARGEST REAL-TIME GAP A SINGLE FRAME MAY CARRY, in seconds.
 *
 * ⚠ THIS IS THE HALF OF THE 31.07 VISIBILITY FIX THAT SURVIVES A MISSED EVENT, and it is the half
 * that actually holds the guarantee. `visibilitychange` (below) is the door, but it is not the only
 * way a tab stops painting: iOS backgrounds through `pagehide`/`freeze` without always firing it,
 * and a device can sleep between two frames with nothing dispatched at all. In every one of those
 * cases rAF stops, `lastTs` keeps the timestamp of the last frame BEFORE the gap, and the first
 * frame back hands `frame()` the whole absence as one `dtReal` - which `advance()` would then walk
 * through the timeline in a single call. A minute on the home screen was a minute of match, played
 * with no one watching and the sound cues fired into an empty room; long enough, and the player came
 * back to a finished match he never saw.
 *
 * A quarter of a second is ~15 frames at 60Hz - far beyond any hitch that is still playback (a bad
 * GC pause is a few tens of ms) and far below any absence that is not. Clamping COSTS the missing
 * time rather than skipping any of it: the timeline is a fixed, pre-computed sequence and the walk
 * is strictly ordered, so every event still plays, in order, exactly once. The only thing that
 * changes is that the wall clock does not get to fast-forward the match.
 */
const MAX_FRAME_DT = 0.25

/** Real time the court sits static (players home, clock at 0) after 'takeYourSeats' plays
 *  and before the timeline actually starts – see startClock. Round-7 item 11: held for the
 *  clip's real length (~3.5s) so the match no longer starts over the top of it; was 1.5s,
 *  which cut the clip off. Applies at ×1/×2 (the speeds that play the cue); ×4 skips both
 *  the cue and the hold. Hardcoded to the recorded clip's duration.
 *  R9-24: the clip itself now plays rate-matched at ×2 (see playLong), so the hold scales
 *  with it – effective hold = SEATS_PREROLL_MS / min(speed, 2) (~1800ms at ×2). */
const SEATS_PREROLL_MS = 3600

export function usePlaybackClock(options: PlaybackClockOptions): PlaybackClock {
  const { speed, viewMode } = options

  const playing = ref(false)
  const finished = ref(false)

  let rafId: number | null = null
  let lastTs: number | null = null
  /** Pending timer for the pre-match 'takeYourSeats' beat's hold (see startClock +
   *  SEATS_PREROLL_MS); non-null only during that hold, so pauseInternal can cancel it cleanly. */
  let preRollTimer: ReturnType<typeof setTimeout> | null = null
  /** True once the pre-match 'takeYourSeats' beat (see startClock) has been decided –
   *  played or skipped – for the current playback run; reset on every resetPlayback()
   *  (fresh play, mode change, restart, Watch again, ...) so each run decides exactly
   *  once, on its first startClock() call, and never re-decides on pause/resume. */
  let seatsPlayedForRun = false

  function pauseInternal(): void {
    playing.value = false
    if (preRollTimer !== null) {
      clearTimeout(preRollTimer)
      preRollTimer = null
    }
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastTs = null
  }

  function frame(ts: number): void {
    if (lastTs === null) lastTs = ts
    const dtReal = Math.min((ts - lastTs) / 1000, MAX_FRAME_DT)
    lastTs = ts
    const dt = dtReal * speed.value
    options.onFrame(dt)
    if (playing.value && !finished.value) {
      rafId = requestAnimationFrame(frame)
    }
  }

  // --- 31.07 item 2: THE MATCH STOPS WHEN THE SCREEN DOES -----------------------------------------
  //
  // Owner: pause the game and the match when the screen is minimised or backgrounded, the way the
  // music does. The music's own listener (src/audio/music.ts, R8-2) is the model this follows
  // deliberately - same event, same "only resume what was actually running" rule - because a player
  // who comes back to a silent app and a running match has been told two different things about
  // whether the game is paused.
  //
  // WHAT WAS ACTUALLY GOING WRONG, and it is not that rAF keeps running - it does not. The damage was
  // all in the RESUME: rAF stops while hidden, `lastTs` holds the last frame before the tab went away,
  // and the first frame back therefore carries the entire absence as one delta. See MAX_FRAME_DT
  // above for that half. This half is the honest one - the match is PAUSED, not merely rate-limited,
  // so nothing plays to an empty room and the pre-roll timer (a `setTimeout`, which is NOT throttled
  // away the way rAF is) cannot start the clock behind the player's back.
  //
  // RESUMING IS CLEAN BY CONSTRUCTION. `pauseInternal()` sets `lastTs = null`, so the first frame after
  // `startClock()` measures zero elapsed time and the clock resumes at exactly the value it was
  // stopped at - no skip, and nothing replayed. Time stops passing; it is never rewound or thrown away.
  //
  // ONE EDGE, stated rather than papered over: hidden DURING the take-your-seats pre-roll, the hold's
  // remainder is dropped and playback begins as soon as the screen comes back (`seatsPlayedForRun` is
  // already true, so `startClock` goes straight to the clock loop). The clip is a pre-match beat, the
  // clock was still at 0, and no match time is involved either way.
  /** Was the match actually running when the screen went away? Only then does coming back start it
   *  again - a match the player had deliberately paused, or one already finished, stays as it was. */
  let resumeOnVisible = false

  function onVisibilityChange(): void {
    if (document.hidden) {
      resumeOnVisible = playing.value && !finished.value
      if (resumeOnVisible) pauseInternal()
    } else if (resumeOnVisible) {
      resumeOnVisible = false
      startClock()
    }
  }

  function seatsHoldMs(): number {
    return SEATS_PREROLL_MS / Math.min(speed.value, 2)
  }

  function beginClockLoop(): void {
    // Playback is actually starting now (immediately at speed ×4, or after the
    // take-your-seats pre-roll at ×1/×2 – both paths funnel through here) – duck the music.
    options.onLoopStart()
    lastTs = null
    rafId = requestAnimationFrame(frame)
  }

  function startClock(): void {
    if (finished.value || viewMode.value === 'skip') return
    playing.value = true
    if (!seatsPlayedForRun) {
      seatsPlayedForRun = true
      // Pre-match beat (owner spec): on a fresh run, 'takeYourSeats' plays BEFORE the
      // clock starts – the court sits visible and static for the clip's full length
      // (SEATS_PREROLL_MS ~3.6s, round-7 item 11), then the timeline begins, so the first
      // hit never lands on top of the clip. The audio owner decides whether this speed plays the
      // cue at all (×1/×2 only); the hold only applies when it does. This replaced the old
      // wiring where the cue fired on the timeline's own first point-start event.
      if (speed.value !== 4) {
        options.onPreRollCue()
        preRollTimer = setTimeout(() => {
          preRollTimer = null
          beginClockLoop()
        }, seatsHoldMs()) // R9-24: rate-matched clip → rate-matched hold (~1800ms at ×2)
        return
      }
    }
    beginClockLoop()
  }

  // 31.07 item 2. Per INSTANCE rather than at module load (which is what music.ts does): that
  // listener guards one long-lived `<audio>` element, this one guards the rAF clock of a component
  // that mounts and unmounts four times over, and a module-level handler would have to find the live
  // one. Feature-guarded so the unit environment, which has no `document`, is untouched.
  onMounted(() => {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibilityChange)
    pauseInternal()
  })

  return {
    playing,
    finished,
    start: startClock,
    pause: pauseInternal,
    finish(): void {
      pauseInternal()
      finished.value = true
    },
    resetRun(): void {
      pauseInternal()
      finished.value = false
      seatsPlayedForRun = false
    },
  }
}
