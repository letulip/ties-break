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
//   - journey home    `images/fem-euro-brunnet/fem-euro-brunnet-travel-{mood}-{scene}.webp`
//     -> the Weekly Story, on a week she came back from an away tournament. NOT band-scoped:
//        four files serve every age, and only the one the engine picked is ever warmed.
//
// Pure side-effect module: importing it does nothing. Safe in a non-DOM (test/worker) context –
// every entry point no-ops when `Image` is unavailable.

import {
  CROPPABLE_EMOTIONS,
  PORTRAIT_EMOTIONS,
  portraitStage,
  type AvatarEmotion,
  type PortraitEmotion,
  portraitAssetStem,
  type PortraitStage,
} from '../shared/avatarEmotion'
import type { FamilyBackground, TravelHomeScene, TravelHomeMood } from '../shared/protocol'

const ART_DIR = 'images/fem-euro-brunnet/'
const NAME = 'fem-euro-brunnet'
const COACH_DIR = 'images/coaches/'

/**
 * THE TWO SETS, and they are deliberately different sizes (ui/art-rehab-sleepy).
 *
 * `KID_PAINTING_EMOTIONS` – every face a portrait SURFACE can show: the eight of `PortraitEmotion`.
 * `KID_CROP_EMOTIONS`     – every face there is a 256px crop of: the seven of `AvatarEmotion`.
 *
 * They used to be one list (`KID_EMOTIONS`) because the two art sets were the same set. `rehab`
 * broke that: it ships as five paintings and no crops, on purpose, because NO surface in the app
 * renders an emotion crop (the header and Home's corner crop are both the age-only `norm` of
 * F45-1). Warming `avatars/{stage}-rehab.webp` would be a guaranteed 404 on every band.
 *
 * The standing rule is unchanged and is what keeps these honest in BOTH directions: warm every face
 * a surface can request, and nothing else. `angry` joined when its trigger landed (fix/world-trio:
 * a run of 4-6 straight losses) rather than when its art did; `injury` STAYS in both lists even
 * though `avatarEmotion()` no longer returns it, because it is still requestable – the injury popup
 * paints it at onset and the Memory card paints it for her first injury. Reachability, not the
 * emotion ladder, is the test.
 */
export const KID_PAINTING_EMOTIONS: readonly PortraitEmotion[] = PORTRAIT_EMOTIONS
export const KID_CROP_EMOTIONS: readonly AvatarEmotion[] = CROPPABLE_EMOTIONS

/** The three the tournament finale can show: champion (happy), runner-up (serious), earlier exit
 *  (sad). Round-5 item 11 still stands – there is no dedicated runner-up painting. */
export const FINALE_EMOTIONS: readonly AvatarEmotion[] = ['happy', 'serious', 'sad']

function base(): string {
  return import.meta.env.BASE_URL
}

/** Full-size painting URL – the Kid screen / Home portrait. Takes the WIDE union: every painted
 *  face has a file, `rehab` included. */
export function portraitUrl(stage: PortraitStage, emotion: PortraitEmotion): string {
  // ⚠ R2-18: `portraitAssetStem`, not `stage` - the 31+ band was renamed and its files were not.
  return `${base()}${ART_DIR}${NAME}-${portraitAssetStem(stage)}-${emotion}.webp`
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

// --- the onboarding hero (screen N) -----------------------------------------------------------
//
// `welcome-1.webp` - the owner's own square master: a parent and a daughter on a floodlit court at
// dusk, which is the scene the handoff describes for N. It arrived 29.07 and went through the art
// pipeline that day (commit 02a63af); until now the screen was still drawing the documented
// stand-in, `jun-norm`.
//
// ITS OWN BUILDER rather than a `portraitUrl` call, for the same reason `travelHomeUrl` has one: it
// is NOT band-scoped and it is not of a face. One picture serves every career, because the career
// has not started yet - nobody has an age on screen N.

/** Painting URL for the onboarding hero. The one line the ui-inventory promised a swap would be. */
export function onboardingHeroUrl(): string {
  return `${base()}${ART_DIR}welcome-1.webp`
}

/** 256px crop URL. No clamp any more: `adult` used to redirect to the teen crops because the adult
 *  ones had never been cut, and with the 31+ band reachable that would have put a teenager's face on a
 *  31-year-old. The missing crops were cut instead, so every stage now has its own — same rule as
 *  shared/avatarEmotion.ts `avatarCropPath`, which is the one the components go through.
 *
 *  NARROW union on purpose: a painting-only face cannot be spelled here (see KID_CROP_EMOTIONS). */
export function cropUrl(stage: PortraitStage, emotion: AvatarEmotion): string {
  // ⚠ R2-18: the asset stem, as in `portraitUrl` above and `avatarCropPath` in shared/.
  return `${base()}avatars/${portraitAssetStem(stage)}-${emotion}.webp`
}

// --- the journey home (R14-2) ------------------------------------------------------------------
//
// `fem-euro-brunnet-travel-{mood}-{airport,plane,bus,car}.webp` – the journey back from an away
// tournament, shown on the Weekly Story.
//
// ⚠ RENAMED INTO A GROUP (owner, 29.07). The four originals were `-sleepy-{scene}`; the set now has
// three moods and the owner named the new art `-travel-sleepy-` / `-travel-happy-` / `-travel-sad-`
// so that every journey picture matches one prefix: «будет одна общая группа, тогда мы все *-travel-*
// сможем корректно привязать к отдельной логике». Twelve files, 3 moods x 4 modes.
//
// NOT BAND-SCOPED, and that is why they get their own builder rather than joining `portraitUrl`.
// The same twelve serve a fourteen-year-old and a woman of thirty-one: the picture is of a journey,
// not of a face. Threading them through the stage×emotion matrix would have implied sixty files
// that do not exist. `TravelHomeScene` (shared/protocol) is the mode union, and the ENGINE picks
// both mode and mood – see engine/diary.ts.

/** Painting URL for one journey-home picture. `mood` defaults to the original sleepy set, so a
 *  caller that predates the three-mood art keeps working. */
export function travelHomeUrl(scene: TravelHomeScene, mood: TravelHomeMood = 'sleepy'): string {
  return `${base()}${ART_DIR}${NAME}-travel-${mood}-${scene}.webp`
}

/** Warm the ONE picture this week selected, and only that one.
 *
 *  Same rule as everywhere else in this module – never preload what cannot be shown – applied to a
 *  set where the answer is known in advance: the engine has already decided which of the twelve the
 *  week shows, so warming any other would be wasted files (~29 KB each) on a week that can only ever
 *  render one. Called from art/autoPreload.ts on the snapshot's own facts, which land at the weekly
 *  tick – i.e. before the player opens the tab that renders it.
 *
 *  ⚠ THE MOOD IS PART OF THE ANSWER since the art became a group of twelve: warming
 *  `-travel-sleepy-plane` on a week the engine chose `happy` would fetch a file the card never asks
 *  for AND leave the one it does ask for cold, which is worse than not preloading at all. Scene and
 *  mood are null together on the snapshot (engine/diary.ts), so one guard covers both. */
export function preloadTravelHomeArt(
  scene: TravelHomeScene | null | undefined,
  mood: TravelHomeMood | null | undefined,
): string[] {
  if (!scene) return []
  const url = travelHomeUrl(scene, mood ?? 'sleepy')
  warm(url)
  return [url]
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
//
// ⚠ THE COACH-CHOICE SLICE ARRIVED, and all 16 are now requestable: the Coach Market (screen T)
// renders one row per coach and `ECONOMY.coach.roster` names every portrait as a coach id. The
// paragraph above still holds exactly as written - a file is fetched if and only if a component
// asks for its URL - and `preloadCoachArt` still warms ONE face, the Home card's. What changed is
// that there is now a screen that can show the other 13, so `preloadCoachMarketArt` exists to warm
// them AT THAT SCREEN and nowhere else. The rule is unchanged: never preload what cannot be shown.

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

/** Warm every roster face - called by the Coach Market and by nothing else, because it is the only
 *  surface that can show them. ~137 KB across 16 files, fetched once and then CacheFirst. */
export function preloadCoachMarketArt(stems: readonly string[]): string[] {
  return stems.map((stem) => {
    const url = coachPortraitUrl(stem)
    warm(url)
    return url
  })
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

/** The whole Kid-screen set for one stage: 8 full paintings + the 7 crops that exist. ~250-330 KiB
 *  of paintings, so every emotion the week can produce is already in the cache.
 *
 *  ⚠ THE TWO LOOPS RUN OVER DIFFERENT SETS, and that asymmetry is the feature: `rehab` is warmed as
 *  a painting and NOT as a crop, because there is no rehab crop to warm. The types enforce it –
 *  `cropUrl` will not accept the face – so this cannot silently regrow a 404. */
export function preloadKidArt(stage: PortraitStage): string[] {
  const urls = [
    ...KID_PAINTING_EMOTIONS.map((e) => portraitUrl(stage, e)),
    ...KID_CROP_EMOTIONS.map((e) => cropUrl(stage, e)),
  ]
  for (const u of urls) warm(u)
  return urls
}

/** Everything one age band needs – the answer to "should the whole age set live in the cache?".
 *  Yes, per band: 8 paintings + 7 crops = 15 files, fetched once and then offline. (It was 12 –
 *  7+7 – until `rehab` added a painting with no crop; before build/webp-only it was 15 for a
 *  different reason, a duplicate `-fs8` copy of three finale frames.) */
export function preloadStage(stage: PortraitStage): string[] {
  return [...preloadKidArt(stage), ...preloadFinaleArt(stage)]
}

/** ONE file (8-11 KB): the family's default coach portrait, on the first card grid the player sees.
 *  Deliberately NOT folded into `preloadStage`/`preloadForAge` – those are keyed on her age band and
 *  their budget ("one band's faces, and only the faces a surface can request") is a rule worth
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

const STAGE_ORDER: PortraitStage[] = ['jun', 'young', 'teen', 'adult', 'lateCareer']

/** The stage AFTER hers, but only while she is in the LAST year of her band (10 / 16 / 22 / 30 –
 *  the boundaries in shared/avatarEmotion portraitStage). Null the rest of the time, so a
 *  birthday never costs her a blank portrait and no career pays for a band it is years away
 *  from – a second band would roughly double the bytes for nothing. `lateCareer` is the top of the
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
