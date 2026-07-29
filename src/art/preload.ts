// R11-9 – warm the portrait art BEFORE the screen or the popup that needs it.
//
// THE PROBLEM. The big paintings under public/images/fem-euro-brunnet/ are deliberately outside
// the service-worker precache (see vite.config: precaching all 2348 KiB would more than double the
// install, and the five age bands are never all needed at once). They are fetched the moment a
// component binds them to an <img src>, which means the tournament finale and the Kid screen can
// paint their frame before the portrait arrives.
//
// THE FIX, in two halves that fit together:
//   1. HERE: fetch the art she is about to need into the browser's image cache, ahead of time,
//      through a plain `new Image()` – no <img> in the DOM, no layout, no component change.
//   2. In the service worker: a CacheFirst route over `**/images/*.webp` (vite.config
//      runtimeCaching). So a preload is not just a warm memory cache – it PERSISTS the file, and
//      the same portrait works offline afterwards. Preloading one age band (361-424 KiB measured
//      across the five) is what makes "the whole age set is in the cache" true for the band she
//      actually plays.
//
// The URL builders below MUST agree with the consumers, or a preload warms a file nobody asks for:
//   - full paintings  `images/fem-euro-brunnet/fem-euro-brunnet-{stage}-{emotion}.webp`
//     -> composables/kidEmotion.ts portraitUrl (Kid screen + Home portrait)
//   - 256px crops     `avatars/{stage}-{emotion}.webp`
//     -> composables/kidEmotion.ts cropUrl (header + Home card; ALREADY precached, listed here
//        only so a cold first paint has them decoded, at 11-20 KiB each)
//   - finale art      the SAME paintings, for the three finale emotions
//     -> components/TournamentFlow.vue artUrl (champion / runner-up / early-exit splash)
//
// Pure side-effect module: importing it does nothing. Safe in a non-DOM (test/worker) context –
// every entry point no-ops when `Image` is unavailable.

import { portraitStage, type AvatarEmotion, type PortraitStage } from '../shared/avatarEmotion'
import type { FamilyBackground } from '../shared/protocol'

const ART_DIR = 'images/fem-euro-brunnet/'
const NAME = 'fem-euro-brunnet'
const COACH_DIR = 'images/coaches/'

/**
 * Every emotion the Kid screen / header can land on — i.e. every value `avatarEmotion()` can
 * actually RETURN, which is what makes a preload worth its bytes.
 *
 * `angry` JOINED THE LIST with its trigger (fix/world-trio item 3: a run of 4-6 straight losses,
 * the exact number drawn per streak). It used to be excluded on the standing rule stated here —
 * "add it the same day a trigger lands, not before" — because warming an unreachable face cost 2
 * files a band for nothing. That day is now: the branch exists, so bytes follow reachability in the
 * other direction. Every value the decision can return, and nothing else, belongs here.
 */
export const KID_EMOTIONS: readonly AvatarEmotion[] = [
  'norm',
  'happy',
  'sad',
  'serious',
  'tired',
  'injury',
  'angry',
]

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

/**
 * Tournament-finale painting URL.
 *
 * build/webp-only: this used to append `-fs8` — a pngquant-era Floyd-Steinberg suffix that
 * carried no meaning for webp and pointed at a SECOND, near-identical copy of every frame.
 * That parallel set was incomplete (no adult-happy), so a champion aged 23+ 404'd on her own
 * title splash. The duplicates are gone; the finale now shows the same painting the Kid screen
 * does, which is also why one age band costs 12 preloads instead of 15.
 *
 * Kept as its own function (rather than inlining portraitUrl at the call sites) because the
 * finale is a distinct surface with its own emotion set — if it ever gets dedicated art, this
 * is the one place that changes.
 */
export function finaleUrl(stage: PortraitStage, emotion: AvatarEmotion): string {
  return portraitUrl(stage, emotion)
}

/** 256px crop URL. No clamp any more: `adult` used to redirect to the teen crops because the adult
 *  ones had never been cut, and with `milf` reachable that would have put a teenager's face on a
 *  31-year-old. The missing crops were cut instead, so every stage now has its own — same rule as
 *  shared/avatarEmotion.ts `avatarCropPath`, which is the one the components go through. */
export function cropUrl(stage: PortraitStage, emotion: AvatarEmotion): string {
  return `${base()}avatars/${stage}-${emotion}.webp`
}

// --- the coach's face (epic/redesign-home) ---------------------------------------------------
//
// 16 coach masters shipped with the redesign; THREE of them are wired, one per family background,
// as the DEFAULT coach the Home card shows. The mapping is the owner's own and it is the only
// coach selection that exists today – picking a coach is its own future slice, and the other 13
// portraits are on disk waiting for it.
//
// WHY THE OTHER 13 ARE NOT IN `NOT_SHIPPED` (scripts/optimize-art.mjs), even though nothing can
// request them yet. That list exists for one measured reason, stated in the script: a master whose
// output no code path can request is "dead weight in every user's download". The coach webp are
// not in any user's download – vite.config's precache carries `globIgnores: ['**/images/**']`, and
// /images/*.webp is a CacheFirst RUNTIME route, so a file is fetched if and only if some component
// asks for its URL. Three URLs are constructible; three files will ever be fetched. The remaining
// 13 (~137 KB) sit in dist/ costing nobody anything, and stay ready for the coach-choice slice
// instead of having to be re-encoded from masters that live only on the author's machine.
// NOT_SHIPPED's rule is honoured, not bent: its premise simply is not true of art outside the
// precache. What WOULD be dishonest is preloading them, and none of them is preloaded.

/** The default coach portrait per family background – the owner's mapping (28.07). The stems are
 *  the master filenames: `budget` / `middle` / `elit` name the coach's own tier, not the girl's. */
export const COACH_BY_BACKGROUND: Record<FamilyBackground, string> = {
  working: 'budget-1',
  middle: 'middle-1',
  wealthy: 'elit-1',
}

/** Coach portrait URL for one stem (162x264 webp). */
export function coachPortraitUrl(stem: string): string {
  return `${base()}${COACH_DIR}${stem}.webp`
}

/** The default coach's portrait for a family background – what the Home coach card renders. */
export function coachUrlFor(background: FamilyBackground): string {
  return coachPortraitUrl(COACH_BY_BACKGROUND[background])
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
 *  champion/runner-up splash has its painting before the reveal animates. 3 files, and since
 *  build/webp-only they are three of the SIX the Kid screen already warms, so on a stage that
 *  has been on screen this costs nothing at all. */
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
 *  Yes, per band: 6 paintings + 6 crops = 12 files, 361-424 KiB measured across the five bands,
 *  fetched once and then offline. It was 15 files before build/webp-only, when the finale asked
 *  for a duplicate `-fs8` copy of three frames it now shares with the Kid screen. */
export function preloadStage(stage: PortraitStage): string[] {
  return [...preloadKidArt(stage), ...preloadFinaleArt(stage)]
}

/** ONE file (8-11 KB): the family's default coach portrait, on the first card grid the player sees.
 *  Deliberately NOT folded into `preloadStage`/`preloadForAge` – those are keyed on her age band and
 *  their budget ("14 urls per band, and only the faces the decision can return") is a rule worth
 *  keeping literal. The coach changes with the family, not with the year, so it warms on its own
 *  trigger (src/art/autoPreload.ts watches the background). */
export function preloadCoachArt(background: FamilyBackground): string[] {
  const url = coachUrlFor(background)
  warm(url)
  return [url]
}

/** Same, from her age – the caller usually holds `snapshot.ageYears`, not a stage. */
export function preloadForAge(ageYears: number): string[] {
  return preloadStage(portraitStage(ageYears))
}

const STAGE_ORDER: PortraitStage[] = ['jun', 'young', 'teen', 'adult', 'milf']

/** The stage AFTER hers, but only while she is in the LAST year of her band (10 / 16 / 22 / 30 –
 *  the boundaries in shared/avatarEmotion portraitStage). Null the rest of the time, so a
 *  birthday never costs her a blank portrait and no career pays for a band it is years away
 *  from – a second band would roughly double the bytes for nothing. `milf` is the top of the
 *  ladder, so from 31 on there is never a next band to warm. */
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
