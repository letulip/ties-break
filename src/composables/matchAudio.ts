// THE MATCH'S SOUND, IN ONE OWNER – lifted out of MatchViewer.vue (R2-11 / TOK-08: "the single
// playback/visibility clock and audio cues from MatchViewer").
//
// -------------------------------------------------------------------------------------------------
// WHAT IT OWNS, AND WHY THESE THINGS BELONG TOGETHER
// -------------------------------------------------------------------------------------------------
// Three pieces of mutable state that only make sense as one:
//   * THE SPEED GATE (`cue`) – which cues a given speed lets through at all;
//   * THE INTERMITTENT `out` STREAM – a per-match RNG, a counter and a threshold, which is the only
//     randomness on this screen and must reproduce exactly on a re-watch;
//   * THE MUSIC DUCK – refcounted in src/audio/music.ts, so exactly one hold per component instance.
// They were scattered across ~120 lines of the viewer with the clock interleaved between them, which
// is what made "does a cue fire here?" a question about playback rather than about sound.
//
// ⚠ EVERY COMMENT BELOW IS THE VIEWER'S OWN, CARRIED VERBATIM. The rulings are the owner's and are
// dated in docs/decisions.md; CLAUDE.md's rule for moved code is to preserve them, not to summarise.
//
// ⚠ IT TAKES THE SPEED AS A REF RATHER THAN OWNING IT. The speed is a CONTROL – it belongs to the
// transport plate, which is prop-driven now – and this file only ever reads it. One owner per fact.
import { playSfx } from '../audio/sfx'
import { duck, restore } from '../audio/music'
import { pickInt, rngFromSeed, type Rng } from '../engine/rng'
import type { MatchSpeed } from './matchDefaults'
import type { Ref } from 'vue'

// --- round-5 polish: speed-gated sound matrix ---------------------------------
// At ×2/×4 the full sound picture (every hit, every miss, every game/set cue) turns
// into noise well before the eye can track it, so each speed keeps only a curated
// subset of cues. Every play site in the viewer that's part of the match soundscape
// (not the UI `click`) routes through this one gate – it's the single source of
// truth for "which key, if any, plays at the current speed":
//
//   ×1  – everything, except `out` fires only intermittently (~1 in 3–5 out/net points,
//         seeded per match – see the outRng block below) so a miss-heavy rally doesn't spam it.
//   ×2  – `hit`, `out` AT HALF THE ×1 RATE (round 16 item 12, owner), `applauseShort` at
//         game-end/set-end (tiebreak sets use `applauseShort` here too, not `oohApplause`) and
//         match-end, plus the `takeYourSeats` pre-match beat.
//   ×4  – only `hit` and a single applause at match-end (no game/set applause, no
//         `takeYourSeats`).
//
// R10-6 amendment: the tournament FINAL's match-end cue is `applauseFinal` at EVERY speed. The
// old matrix downgraded it to `applauseShort` above ×1 because a long clip dragged behind a
// sped-up match – R9-24's rate-matching (playLong) removed that reason, and a final gets exactly
// ONE cue per match, so it is never the noise the per-game/per-set gating is about.
//
// 'seats' is special: it's not tied to a timeline event at all (see the clock's `startClock`) – it
// plays, if this speed allows it, BEFORE the clock starts, not from inside
// completeEvent like every other site.
export type SoundSite = 'hit' | 'out' | 'ooh' | 'gameEnd' | 'setEnd' | 'setEndTiebreak' | 'matchEnd' | 'seats'

export interface MatchAudio {
  /** Play the cue for this site, if the current speed lets it through. */
  cue: (site: SoundSite, opts?: { final?: boolean }) => void
  /** A fresh run: re-seed the intermittent `out` stream so a replay sounds identical. */
  resetRun: () => void
  /** Playback is starting – hold the background music down. Refcount-safe: at most one per instance. */
  duckForRun: () => void
  /** The match is over, or the component is going away – give the music back, if we are holding it. */
  releaseDuck: () => void
}

export interface MatchAudioOptions {
  /** the transport's speed pill, read-only from here */
  speed: Ref<MatchSpeed>
  /** `match.result.seed` – the `out` stream is seeded from it, so a re-watch sounds the same */
  seed: () => string
}

export function useMatchAudio(options: MatchAudioOptions): MatchAudio {
  const { speed } = options

  // --- round-6: background-music ducking ----------------------------------------
  // Matches must be music-free; menus/screens outside a match are not. `duck()`/`restore()`
  // (src/audio/music.ts) are refcounted, so this component must call each at most once per
  // outstanding duck – `musicDuckedForRun` tracks whether THIS instance currently holds one.
  // Deliberately NOT reset in resetPlayback(): a mode change or a new match prop mid-viewing
  // rebuilds the timeline without ever un-ducking (still watching a match), so beginClockLoop's
  // `duckForRun()` guard must keep seeing `true` across those rebuilds, or it would
  // duck() again without a matching restore() and leak the refcount. Only the two teardown
  // paths (match finished, component unmounted) ever flip it back to false.
  let musicDuckedForRun = false

  // --- round-7 item 12: intermittent 'out' call --------------------------------------
  // An out/net point plays the `out` call only ~1 in 3–5 times, at ×1 only. Deterministic
  // PER MATCH so a replay sounds identical: a small RNG seeded from the match seed +
  // ':outcall', re-created at every resetPlayback(). `outCounter` counts out/net occurrences
  // since the last fired call; once it reaches `outThreshold` (a fresh 3–5 draw) the call
  // fires and a new threshold is drawn. (Replaced the earlier every-3rd counter.)
  //
  // ⚠ A SUB-STREAM, NOT MAIN, and that is invariant 2 rather than a detail: `rngFromSeed` re-derives
  // it at the call site from a purpose-scoped string and persists nothing, so no amount of watching
  // (or not watching) a match can move the world's own dice.
  let outRng: Rng = rngFromSeed(options.seed() + ':outcall')
  let outCounter = 0
  let outThreshold = pickInt(outRng, 3, 5)

  /**
   * ⚠ ROUND 16 ITEM 12 (owner, 11.08): the `out` call now reaches ×2, at HALF the ×1 rate.
   *
   * It was silent above ×1 because the whole miss-heavy soundscape was, and a call every third miss at
   * double speed is a call every ~1.4 seconds. Half the rate is what makes it a punctuation mark again:
   * the ear still gets told a ball went out, roughly as often per WALL-CLOCK second as it does at ×1,
   * because the points are arriving twice as fast.
   *
   * ⚠ THE RATE IS APPLIED AT THE COMPARISON, NOT AT THE DRAW, and that is what keeps the stream
   * identical. `outRng` is seeded from the match seed, so a replay must hear the same pattern; halving
   * the rate by drawing 6–10 instead of 3–5 would have made the sequence depend on which speed the
   * player happened to be on when each draw came up. Drawing 3–5 always and doubling the TARGET means
   * a mid-match speed change takes effect on the very next miss and changes nothing about what was
   * drawn – the same property the shipped mode switch already has.
   */
  function outCallDue(): boolean {
    outCounter++
    if (outCounter < outThreshold * (speed.value === 2 ? 2 : 1)) return false
    outCounter = 0
    outThreshold = pickInt(outRng, 3, 5)
    return true
  }

  // R9-24: the LONG cues (applause family + take-your-seats) play rate-matched to the clip at
  // ×2 so they stop dragging behind a sped-up match – capped at 2 inside playSfx (rate-4
  // applause is noise; ×4 already gates most cues off anyway). Short percussive cues (hit /
  // out / ooh / click*) stay at rate 1: they're too brief for the mismatch to register.
  function playLong(key: 'applauseShort' | 'oohApplause' | 'applauseFinal' | 'takeYourSeats'): void {
    playSfx(key, speed.value > 1 ? { rate: speed.value } : undefined)
  }

  function gatedSfx(site: SoundSite, opts?: { final?: boolean }): void {
    if (speed.value === 4) {
      if (site === 'hit') playSfx('hit')
      else if (site === 'matchEnd') playLong(opts?.final ? 'applauseFinal' : 'applauseShort')
      return
    }
    if (speed.value === 2) {
      if (site === 'hit') playSfx('hit')
      // Short and percussive, so it plays at rate 1 like every other cue in its family - `playLong`
      // is for the applause clips alone (R9-24).
      else if (site === 'out') {
        if (outCallDue()) playSfx('out')
      } else if (site === 'seats') playLong('takeYourSeats')
      else if (site === 'matchEnd') playLong(opts?.final ? 'applauseFinal' : 'applauseShort')
      else if (site === 'gameEnd' || site === 'setEnd' || site === 'setEndTiebreak') {
        playLong('applauseShort')
      }
      return
    }
    // ×1: everything, as before.
    switch (site) {
      case 'hit':
        playSfx('hit')
        return
      case 'out':
        if (outCallDue()) playSfx('out')
        return
      case 'ooh':
        playSfx('ooh')
        return
      case 'seats':
        playLong('takeYourSeats')
        return
      case 'gameEnd':
        playLong('applauseShort')
        return
      case 'setEnd':
        playLong('applauseShort')
        return
      case 'setEndTiebreak':
        playLong('oohApplause')
        return
      case 'matchEnd':
        playLong(opts?.final ? 'applauseFinal' : 'applauseShort')
        return
    }
  }

  return {
    cue: gatedSfx,
    resetRun(): void {
      outRng = rngFromSeed(options.seed() + ':outcall')
      outCounter = 0
      outThreshold = pickInt(outRng, 3, 5)
    },
    duckForRun(): void {
      if (!musicDuckedForRun) {
        musicDuckedForRun = true
        duck()
      }
    },
    releaseDuck(): void {
      if (musicDuckedForRun) {
        musicDuckedForRun = false
        restore()
      }
    },
  }
}
