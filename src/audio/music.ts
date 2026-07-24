// Round-6 item 1 – background music. A single looping HTMLAudio for the theme track,
// independent of src/audio/sfx.ts (own localStorage key, own gate, own volume). Contract:
//
//  - `start()` must be called from a REAL user gesture (the splash screen's "any click"
//    handler) – same autoplay-policy reasoning as sfx.ts's initSfx(). Before that call the
//    module just remembers state; nothing ever tries to play.
//  - Exactly one <audio> element for the track's whole lifetime, created lazily on first
//    use (never at module load – importing this file must never touch the DOM/network).
//  - `duck()`/`restore()` are REFCOUNTED so overlapping callers (today: just MatchViewer,
//    but written generically) can't fight each other – restore() only lifts the duck once
//    every duck() has a matching restore().
//  - Muted state persists to its own key ('tb-music-muted', deliberately separate from
//    sfx's 'tb-muted') and can be read/written any time, before start() included – the More
//    screen's switch must work the instant the screen mounts.
//  - Every volume change (mute, duck, initial fade-in) goes through the same ~800ms
//    interval-based fade so nothing ever snaps abruptly.

const MUSIC_MUTED_KEY = 'tb-music-muted'
const VOLUME = 0.3
const FADE_MS = 800
const FADE_STEP_MS = 40

function urlFor(): string {
  return `${import.meta.env.BASE_URL}music/theme.mp3`
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUSIC_MUTED_KEY) === '1'
  } catch {
    return false // storage unavailable (private mode, tests, ...) – default to unmuted
  }
}

function writeMuted(value: boolean): void {
  try {
    localStorage.setItem(MUSIC_MUTED_KEY, value ? '1' : '0')
  } catch {
    // storage unavailable – the toggle still works for this session, just won't persist
  }
}

let muted = readMuted()
let started = false // true once start() has run (a real gesture has happened)
let duckCount = 0
let audio: HTMLAudioElement | null = null
let fadeTimer: ReturnType<typeof setInterval> | null = null

function ensureAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(urlFor())
    audio.loop = true
    audio.volume = 0
  }
  return audio
}

function clearFade(): void {
  if (fadeTimer !== null) {
    clearInterval(fadeTimer)
    fadeTimer = null
  }
}

/** The volume the track SHOULD be at right now, given mute + duck state. Muted always wins
 *  (no point fading up under a duck if the player also has it muted); otherwise silent
 *  while ducked (>=1 active duck() caller), full volume otherwise. */
function targetVolume(): number {
  if (muted || duckCount > 0) return 0
  return VOLUME
}

/** Fades the live element toward `target` over FADE_MS, then pauses it if it landed at 0
 *  (no point leaving a silent <audio> decoding in the background). No-op before start()
 *  (or if the file is missing/fails to play – a failed `.play()` is swallowed, same
 *  silent-but-functional contract as sfx.ts). */
function applyTarget(): void {
  if (!started) return
  const el = ensureAudio()
  const target = targetVolume()
  if (target > 0 && el.paused) {
    el.play().catch(() => {
      // Missing file / decode error / blocked autoplay – stay silent, never throw, never retry.
    })
  }
  clearFade()
  const from = el.volume
  const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS))
  let step = 0
  fadeTimer = setInterval(() => {
    step++
    const t = Math.min(1, step / steps)
    el.volume = from + (target - from) * t
    if (t >= 1) {
      clearFade()
      if (target === 0) el.pause()
    }
  }, FADE_STEP_MS)
}

export function isMusicMuted(): boolean {
  return muted
}

export function setMusicMuted(value: boolean): void {
  muted = value
  writeMuted(value)
  applyTarget()
  updateMediaSessionState()
}

// --- round-7 item 2: OS / notification-shade media session --------------------
// Show the game's identity (title/artist/logo) in the phone's notification-shade
// player instead of a bare "theme.mp3", and let that player's play/pause buttons drive
// the music toggle. Fully feature-detected: every call is a no-op wherever
// navigator.mediaSession (or the MediaMetadata constructor) is unavailable, so this
// never affects the desktop/test paths. Metadata + handlers are installed exactly once,
// from start() (a real user gesture is guaranteed by then).
function hasMediaSession(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator
}

function setupMediaSession(): void {
  if (!hasMediaSession()) return
  const ms = navigator.mediaSession
  try {
    if (typeof MediaMetadata !== 'undefined') {
      ms.metadata = new MediaMetadata({
        title: 'Ties Break',
        artist: 'Ace Parent',
        artwork: [
          { src: `${import.meta.env.BASE_URL}logos/logo-tb-line-light.webp`, sizes: '512x512', type: 'image/webp' },
        ],
      })
    }
    // The shade's play/pause toggles the music mute (its own persisted state); the actual
    // element is started/stopped by applyTarget() as a side effect of setMusicMuted().
    ms.setActionHandler('play', () => setMusicMuted(false))
    ms.setActionHandler('pause', () => setMusicMuted(true))
  } catch {
    // Some engines throw on an unsupported action/metadata shape – stay silent; the music
    // itself is unaffected, only the shade decoration is.
  }
}

/** Reflect the mute state (not the transient match-duck) as the shade's play/pause icon. */
function updateMediaSessionState(): void {
  if (!hasMediaSession()) return
  try {
    navigator.mediaSession.playbackState = muted ? 'paused' : 'playing'
  } catch {
    // ignore – decoration only.
  }
}

/** Gesture-gated: call once, from a real click handler (the splash screen's "tap to
 *  start"). Idempotent – a second call is a no-op. Respects the persisted mute: if the
 *  player had muted music last session, this call arms the module but never plays. */
export function start(): void {
  if (started) return
  started = true
  applyTarget()
  setupMediaSession()
  updateMediaSessionState()
}

/** Refcounted: fades the track to silence while >=1 caller holds a duck. Safe to call
 *  before start() (just bumps the counter; applyTarget() no-ops until a gesture happens,
 *  and the next start() call will correctly begin ducked). */
export function duck(): void {
  duckCount++
  applyTarget()
}

/** Matching restore() for a duck() call. Floored at 0 so a stray extra restore() (there
 *  shouldn't be one – callers are expected to pair these 1:1) can never go negative and
 *  permanently break future ducking. */
export function restore(): void {
  duckCount = Math.max(0, duckCount - 1)
  applyTarget()
}
