// R11-9 – warm the portrait art BEFORE the screen or the popup that needs it.
//
// THE PROBLEM. The big paintings under public/images/fem-euro-brunnet/ are deliberately outside
// the service-worker precache (see vite.config: precaching all 3511 KiB would triple the install,
// and 1641 KiB of it is later-life art no code path can reach yet). They are fetched the moment a
// component binds them to an <img src>, which means the tournament finale and the Kid screen can
// paint their frame before the portrait arrives.
//
// THE FIX, in two halves that fit together:
//   1. HERE: fetch the art she is about to need into the browser's image cache, ahead of time,
//      through a plain `new Image()` – no <img> in the DOM, no layout, no component change.
//   2. In the service worker: a CacheFirst route over `**/images/*.webp` (vite.config
//      runtimeCaching). So a preload is not just a warm memory cache – it PERSISTS the file, and
//      the same portrait works offline afterwards. Preloading one age band (413-487 KiB measured)
//      is what makes "the whole age set is in the cache" true for the band she actually plays.
//
// The URL builders below MUST agree with the consumers, or a preload warms a file nobody asks for:
//   - full paintings  `images/fem-euro-brunnet/fem-euro-brunnet-{stage}-{emotion}.webp`
//     -> composables/kidEmotion.ts portraitUrl (Kid screen + Home portrait)
//   - 256px crops     `avatars/{stage}-{emotion}.webp`
//     -> composables/kidEmotion.ts cropUrl (header + Home card; ALREADY precached, listed here
//        only so a cold first paint has them decoded, at 11-20 KiB each)
//   - finale art      `images/fem-euro-brunnet/fem-euro-brunnet-{stage}-{emotion}-fs8.webp`
//     -> components/TournamentFlow.vue artUrl (champion / runner-up / early-exit splash)
//
// Pure side-effect module: importing it does nothing. Safe in a non-DOM (test/worker) context –
// every entry point no-ops when `Image` is unavailable.

import { portraitStage, type AvatarEmotion, type PortraitStage } from '../shared/avatarEmotion'

const ART_DIR = 'images/fem-euro-brunnet/'
const NAME = 'fem-euro-brunnet'

/** Every emotion the Kid screen / header can land on (shared/avatarEmotion AvatarEmotion). */
export const KID_EMOTIONS: readonly AvatarEmotion[] = ['norm', 'happy', 'sad', 'serious', 'tired', 'injury']

/** The three the tournament finale can show: champion (happy), runner-up (serious), earlier exit
 *  (sad). Round-5 item 11 still stands – there is no dedicated runner-up painting. */
export const FINALE_EMOTIONS: readonly AvatarEmotion[] = ['happy', 'serious', 'sad']

function base(): string {
  return import.meta.env.BASE_URL
}

/** Full-size painting URL – the Kid screen / Home portrait. */
export function portraitUrl(stage: PortraitStage, emotion: AvatarEmotion): string {
  return `${base()}${ART_DIR}${NAME}-${stage}-${emotion}.webp`
}

/** Tournament-finale painting URL (the legacy `-fs8` variant names TournamentFlow requests). */
export function finaleUrl(stage: PortraitStage, emotion: AvatarEmotion): string {
  return `${base()}${ART_DIR}${NAME}-${stage}-${emotion}-fs8.webp`
}

/** 256px crop URL. The crop set has no adult art, so adult clamps to teen – exactly what
 *  kidEmotion.ts cropUrl does. Keep the two in step. */
export function cropUrl(stage: PortraitStage, emotion: AvatarEmotion): string {
  return `${base()}avatars/${stage === 'adult' ? 'teen' : stage}-${emotion}.webp`
}

// Every URL this module has already asked for. A preload is idempotent and free to call on every
// render/tick: the second call for a URL does nothing at all.
const requested = new Set<string>()

/** How many URLs have been warmed (diagnostics + tests). */
export function warmedCount(): number {
  return requested.size
}

/** Test seam: forget what has been warmed. Not used by the app. */
export function resetPreloadCache(): void {
  requested.clear()
}

function warm(url: string): void {
  if (requested.has(url)) return
  requested.add(url)
  if (typeof Image === 'undefined') return
  const img = new Image()
  // Off the critical path: decode lazily, and never let a 404 surface as an unhandled error.
  img.decoding = 'async'
  img.onerror = null
  img.src = url
}

/** The finale set for one stage – call this the moment a tournament week is entered, so the
 *  champion/runner-up splash has its painting before the reveal animates. 3 files, ~135-165 KiB. */
export function preloadFinaleArt(stage: PortraitStage): string[] {
  const urls = FINALE_EMOTIONS.map((e) => finaleUrl(stage, e))
  for (const u of urls) warm(u)
  return urls
}

/** The whole Kid-screen set for one stage: 6 full paintings + their 6 crops. ~250-330 KiB of
 *  paintings, so every emotion the week can produce is already in the cache. */
export function preloadKidArt(stage: PortraitStage): string[] {
  const urls = [...KID_EMOTIONS.map((e) => portraitUrl(stage, e)), ...KID_EMOTIONS.map((e) => cropUrl(stage, e))]
  for (const u of urls) warm(u)
  return urls
}

/** Everything one age band needs – the answer to "should the whole age set live in the cache?".
 *  Yes, per band: 9 paintings + 6 crops, 413-487 KiB measured, fetched once and then offline. */
export function preloadStage(stage: PortraitStage): string[] {
  return [...preloadKidArt(stage), ...preloadFinaleArt(stage)]
}

/** Same, from her age – the caller usually holds `snapshot.ageYears`, not a stage. */
export function preloadForAge(ageYears: number): string[] {
  return preloadStage(portraitStage(ageYears))
}

const STAGE_ORDER: PortraitStage[] = ['jun', 'young', 'teen', 'adult']

/** The stage AFTER hers, but only while she is in the LAST year of her band (10 / 16 / 22 –
 *  the boundaries in shared/avatarEmotion portraitStage). Null the rest of the time, so a
 *  birthday never costs her a blank portrait and no career pays for a band it is years away
 *  from – a second band would roughly double the bytes for nothing. */
export function stageDueNext(ageYears: number): PortraitStage | null {
  const stage = portraitStage(ageYears)
  if (portraitStage(ageYears + 1) === stage) return null
  return STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1] ?? null
}

/** Warm the next band when (and only when) she is one year from it. */
export function preloadNextStageIfDue(ageYears: number): string[] {
  const next = stageDueNext(ageYears)
  return next ? preloadStage(next) : []
}
