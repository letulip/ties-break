// Round 4 item 5 — sound framework. The owner uploads the real mp3s later; this module
// must work correctly with zero files present (silent no-op, no console spam) and
// upgrade transparently the moment files land in public/sounds/ (see the README there).
//
// Contract:
//  - `initSfx()` must be called once from a REAL user gesture (a click handler) before
//    any sound plays — never on component mount. Until then, `playSfx` is a pure no-op,
//    which is what keeps the app's very first (auto-started) match watch-through silent
//    instead of trying to autoplay audio the browser would block anyway.
//  - Each key is lazy-loaded on its first `playSfx` call, not eagerly for all 7 up front.
//  - A missing/failing file is remembered (never retried, never logged) so the app stays
//    silent-but-functional with an empty public/sounds/ directory.
//  - `muted` persists to localStorage and can be read/written any time — it never
//    touches an <audio> element, so the More screen's toggle works before initSfx().

export type SfxKey = 'hit' | 'bounce' | 'point' | 'game' | 'set' | 'win' | 'click'

const VOLUME = 0.5
const MUTED_STORAGE_KEY = 'tb-muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_STORAGE_KEY) === '1'
  } catch {
    return false // storage unavailable (private mode, tests, ...) – default to unmuted
  }
}

function writeMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTED_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // storage unavailable – the toggle still works for this session, just won't persist
  }
}

let muted = readMuted()
let audioEnabled = false // flips true on the first initSfx() call, from a real click handler

/** Every key that has 404'd (or otherwise failed) once — never retried, never logged. */
const failed = new Set<SfxKey>()
/** Successfully-probed keys, cached so repeat plays skip the existence check entirely. */
const cache = new Map<SfxKey, HTMLAudioElement>()
/** In-flight existence probes, so rapid repeat calls for the same not-yet-resolved key don't pile up fetches. */
const pending = new Map<SfxKey, Promise<HTMLAudioElement | null>>()

function urlFor(key: SfxKey): string {
  return `${import.meta.env.BASE_URL}sounds/${key}.mp3`
}

/**
 * Quietly checks whether the file exists before ever handing the URL to an <audio>
 * element. A `fetch` 404 does not print to the devtools console (unlike an <audio src>
 * 404, which does) – this probe is precisely what keeps the console clean with no mp3
 * files present, without any console-suppression trickery.
 *
 * The content-type check matters because a dev/preview static server (e.g. `vite
 * preview`'s SPA fallback) can answer a genuinely missing path with `200 text/html`
 * (serving index.html) instead of a real 404 — treating any `res.ok` as "found" would
 * silently hand a broken HTML "audio" file to <audio> and try to play it.
 */
async function probe(key: SfxKey): Promise<HTMLAudioElement | null> {
  const url = urlFor(key)
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok || !contentType.startsWith('audio/')) {
      failed.add(key)
      return null
    }
  } catch {
    failed.add(key)
    return null
  }
  const audio = new Audio(url)
  audio.volume = VOLUME
  audio.preload = 'auto'
  cache.set(key, audio)
  return audio
}

function loadAudio(key: SfxKey): Promise<HTMLAudioElement | null> {
  const cached = cache.get(key)
  if (cached) return Promise.resolve(cached)
  if (failed.has(key)) return Promise.resolve(null)
  let inFlight = pending.get(key)
  if (!inFlight) {
    inFlight = probe(key).finally(() => pending.delete(key))
    pending.set(key, inFlight)
  }
  return inFlight
}

/** Call once from a real click handler (Play/Restart/Watch again) before any sound may play. */
export function initSfx(): void {
  audioEnabled = true
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  writeMuted(value)
}

/** Fire-and-forget playback. Silent no-op before initSfx(), while muted, or for a key
 *  that has failed to load (missing file, decode error, ...). */
export function playSfx(key: SfxKey): void {
  if (!audioEnabled || muted || failed.has(key)) return
  loadAudio(key)
    .then((audio) => {
      if (!audio || muted) return
      audio.currentTime = 0
      audio.play().catch(() => {
        failed.add(key)
      })
    })
    .catch(() => {
      failed.add(key)
    })
}
