// Round 4 item 5 – sound framework. Round 5: rewired for the owner's own recordings
// (see the README in public/sounds/ for provenance + the manifest table). The module
// must work correctly with zero files present (silent no-op, no console spam) and
// upgrade transparently the moment files land in public/sounds/.
//
// Contract:
//  - `initSfx()` must be called once from a REAL user gesture (a click handler) before
//    any sound plays – never on component mount. Until then, `playSfx` is a pure no-op,
//    which is what keeps the app's very first (auto-started) match watch-through silent
//    instead of trying to autoplay audio the browser would block anyway.
//  - A key's manifest value is either a single file or an array of variant files; a key
//    with variants picks one uniformly at random on each `playSfx` call (Math.random is
//    fine here – this is UI polish, not game-engine RNG, so it doesn't need to be seeded).
//  - Each file is lazy-loaded on its first actual use, not eagerly for every key/variant
//    up front.
//  - A missing/failing file is remembered (never retried, never logged) so the app stays
//    silent-but-functional with an empty public/sounds/ directory, or with only some
//    variants of a key present.
//  - `muted` persists to localStorage and can be read/written any time – it never
//    touches an <audio> element, so the More screen's toggle works before initSfx().

import { vibrate } from './haptics'

export type SfxKey =
  | 'hit'
  | 'out'
  | 'ooh'
  | 'oohApplause'
  | 'applauseShort'
  | 'applauseFinal'
  | 'takeYourSeats'
  | 'click'
  | 'clickSoft'

/** Key -> filename(s) in public/sounds/ (without the .mp3 extension). A key with
 *  multiple variants plays one at random each time (see `pickFile`). */
const MANIFEST: Record<SfxKey, string | string[]> = {
  hit: ['hit-1', 'hit-2', 'hit-3', 'hit-4', 'hit-5', 'hit-6', 'hit-7', 'hit-8', 'hit-9'],
  out: 'out',
  ooh: 'ooh',
  oohApplause: 'ooh-applause',
  applauseShort: ['applause-short-1', 'applause-short-2'],
  applauseFinal: 'applause-final',
  takeYourSeats: 'take-your-seats',
  click: 'click',
  clickSoft: 'click-soft',
}

// Round-7 (audio balance): the whole SFX bus sits UNDER the 0.30 background music
// (src/audio/music.ts) so the menu→match transition no longer jumps in loudness. `SFX_MASTER`
// is the ONE owner knob (like economy.ts's constants) – every play is scaled by it; the per-key
// VOICE levels below only set the balance BETWEEN sounds. Effective volume = VOICE × SFX_MASTER,
// clamped to [0,1]. With SFX_MASTER = 0.40 the effective levels land on the owner's targets:
//   hit 0.26 (frequent → quietest) · out/ooh/oohApplause/applauseShort 0.34 · applauseFinal 0.40
//   (celebratory peak) · takeYourSeats 0.32 · click 0.25 (UI tick, unchanged) · clickSoft 0.18
//   (softer than click). Move SFX_MASTER alone to shift the whole soundscape vs the music.
const SFX_MASTER = 0.4
/** Voice level (0..1) for any key without an explicit override. 0.85 × 0.40 = 0.34 effective. */
const DEFAULT_VOICE = 0.85
// Per-key voice overrides. The UI click cues stay deliberately quiet so they read as a tap, not a
// match cue (round-5 item 6 / polish-pass click split): `click` (effective 0.25) is the hit-like
// tick for tab-bar navigation and "Watch match"/"Watch"/"Watch again" buttons; `clickSoft`
// (effective 0.18, softer) is the plainer tick for every other button. `hit` is the quietest match
// cue because it fires constantly; `takeYourSeats` (a longer crowd cue) and `applauseFinal` (the
// celebration) are the two the owner wants to read clearly above the rest.
const KEY_VOICE: Partial<Record<SfxKey, number>> = {
  hit: 0.65, // 0.26
  applauseFinal: 1.0, // 0.40
  takeYourSeats: 0.8, // 0.32
  click: 0.625, // 0.25
  clickSoft: 0.45, // 0.18
  // out / ooh / oohApplause / applauseShort fall through to DEFAULT_VOICE → 0.34
}

/** Effective, master-scaled volume for a key, clamped to a valid [0,1] range. */
function volumeFor(key: SfxKey): number {
  return Math.min(1, Math.max(0, (KEY_VOICE[key] ?? DEFAULT_VOICE) * SFX_MASTER))
}
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

/** Every file that has 404'd (or otherwise failed) once – never retried, never logged. */
const failed = new Set<string>()
/** Successfully-probed files, cached so repeat plays skip the existence check entirely. */
const cache = new Map<string, HTMLAudioElement>()
/** In-flight existence probes, so rapid repeat calls for the same not-yet-resolved file don't pile up fetches. */
const pending = new Map<string, Promise<HTMLAudioElement | null>>()

function variantsFor(key: SfxKey): string[] {
  const v = MANIFEST[key]
  return Array.isArray(v) ? v : [v]
}

/** Picks one file for this key, uniformly at random across its variants (a single-file
 *  key trivially "picks" its only file). */
function pickFile(key: SfxKey): string {
  const files = variantsFor(key)
  return files[Math.floor(Math.random() * files.length)]
}

function urlFor(file: string): string {
  return `${import.meta.env.BASE_URL}sounds/${file}.mp3`
}

/**
 * Quietly checks whether the file exists before ever handing the URL to an <audio>
 * element. A `fetch` 404 does not print to the devtools console (unlike an <audio src>
 * 404, which does) – this probe is precisely what keeps the console clean with no mp3
 * files present, without any console-suppression trickery.
 *
 * The content-type check matters because a dev/preview static server (e.g. `vite
 * preview`'s SPA fallback) can answer a genuinely missing path with `200 text/html`
 * (serving index.html) instead of a real 404 – treating any `res.ok` as "found" would
 * silently hand a broken HTML "audio" file to <audio> and try to play it.
 */
async function probe(file: string, key: SfxKey): Promise<HTMLAudioElement | null> {
  const url = urlFor(file)
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok || !contentType.startsWith('audio/')) {
      failed.add(file)
      return null
    }
  } catch {
    failed.add(file)
    return null
  }
  const audio = new Audio(url)
  audio.volume = volumeFor(key)
  audio.preload = 'auto'
  cache.set(file, audio)
  return audio
}

function loadAudio(file: string, key: SfxKey): Promise<HTMLAudioElement | null> {
  const cached = cache.get(file)
  if (cached) return Promise.resolve(cached)
  if (failed.has(file)) return Promise.resolve(null)
  let inFlight = pending.get(file)
  if (!inFlight) {
    inFlight = probe(file, key).finally(() => pending.delete(file))
    pending.set(file, inFlight)
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

/** Fire-and-forget playback. Silent no-op before initSfx(), while muted, or for a file
 *  that has failed to load (missing file, decode error, ...) – if the picked variant has
 *  failed, this call is simply silent rather than falling back to another variant. */
export function playSfx(key: SfxKey): void {
  if (!audioEnabled || muted) return
  const file = pickFile(key)
  if (failed.has(file)) return
  loadAudio(file, key)
    .then((audio) => {
      if (!audio || muted) return
      audio.currentTime = 0
      audio.play().catch(() => {
        failed.add(file)
      })
    })
    .catch(() => {
      failed.add(file)
    })
}

// --- app-wide install (round-5 item 6; polish-pass click split) --------------
// ROOT CAUSE this fixes: initSfx() (the audio gate) used to be wired ONLY to the
// MatchViewer Play/Restart buttons, but matches autoplay on mount and every route into
// a viewer (tabs, "Watch match", "Play match") skips that gesture – so `audioEnabled`
// stayed false and the whole app was mute. One delegated document listener flips the gate
// on the FIRST user click anywhere, and adds a click cue to primary controls.
//
// Click split: tab-bar navigation and "Watch match"/"Watch"/"Watch again" buttons (the
// latter marked with `.sfx-watch` at their call sites – TournamentFlow, the News section
// of HomeScreen, SeasonScreen, MatchViewer) get the hit-like `click`. Every other button
// this handler covers gets the plainer `clickSoft` instead, so the match-cue-adjacent
// tick doesn't fire for routine navigation. Checked in that order so a `.sfx-watch`
// button that also happens to be `button.primary` (e.g. "Watch match") still gets `click`.
const HIT_CLICK_SELECTOR = '.tab-btn, .sfx-watch'
const SOFT_CLICK_SELECTOR = 'button.primary, .option-pill'
// Round-7 item 13: presses that also get a short haptic buzz. A superset-by-intent of the
// "meaningful action" controls – every element here already matches HIT or SOFT above, so
// the early `if (!hit && !soft) return` never wrongly skips a haptic-eligible press.
const HAPTIC_SELECTOR = 'button.primary, .tab-btn, .sfx-watch'
const CLICK_THROTTLE_MS = 80
let lastClickAt = 0
let installed = false

/** Install once at startup (main.ts). Idempotent. */
export function installGlobalSfx(): void {
  if (installed || typeof document === 'undefined') return
  installed = true
  document.addEventListener('click', (e) => {
    // Any real gesture unlocks audio (browsers block autoplay until one happens).
    initSfx()
    const target = e.target as HTMLElement | null
    const hit = target?.closest?.(HIT_CLICK_SELECTOR)
    const soft = !hit && target?.closest?.(SOFT_CLICK_SELECTOR)
    if (!hit && !soft) return
    const now = Date.now()
    if (now - lastClickAt < CLICK_THROTTLE_MS) return // no spam on rapid clicks
    lastClickAt = now
    playSfx(hit ? 'click' : 'clickSoft')
    // Same throttle window as the click cue, so a rapid double-tap buzzes once.
    if (target?.closest?.(HAPTIC_SELECTOR)) vibrate()
  })
}
