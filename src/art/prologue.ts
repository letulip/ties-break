// THE PICTURE ON A PROLOGUE CARD – phase 7 of docs/specs/childhood-prologue-build-2026-09.md.
//
// THE OWNER, 02.09: «надо сделать пролог красивым … по типу нашего home screen где большой арт на всю
// ширину экрана, а текст под ним или частично на нем … Это первое прикосновение к игре, оно должно
// быть "вау! интересно!"»
//
// ⭐⭐ NOTHING WAS DRAWN FOR THIS. Every frame the nine cards show already ships:
//
//   * `fem-euro-brunnet-jun-*.webp`   – eight faces, and `portraitStage` puts every age under 11 in
//     that band. The band's boundary was set FOR this: «young starts at 11 – the childhood prologue
//     is coming, so the boundary is deliberately set where the prologue will need it» (owner, 25.07,
//     recorded in shared/avatarEmotion.ts). The prologue is the first thing that has ever asked for
//     `jun`, which until now existed only as the onboarding hero's stand-in.
//   * `fem-euro-brunnet-young-*.webp` – the same eight, for 11, 12 and 13.
//   * `welcome-1.webp` – ⭐ THE OWNER'S OWN INSTRUCTION FOR THE FIRST CARD: «для этого у нас есть
//     картинка где она первый раз на корт приходит вообще». A parent and a daughter arriving on a
//     floodlit court at dusk, which is the age-5 card and no other.
//
// ⚠ THE URL BUILDERS ARE THE SHIPPED ONES AND THIS FILE ADDS NONE. `portraitUrl` and
// `onboardingHeroUrl` both live in `art/preload.ts`; a fourth place that interpolates
// `fem-euro-brunnet-{stem}-{emotion}` is exactly the divergence `portraitAssetStem`'s note warns
// about, and it stays invisible until an art set arrives under different filenames.
//
// ⚠ AND NOTHING NEEDS PRELOADING. Round 29 part two #7 put the whole of `public/images/**` into the
// PWA precache at the owner's ruling – 313 entries, 12.3 MB – so every frame below is on the device
// before the first card renders. `preloadKidArt` is not called here and must not be: it would warm
// files the service worker already holds.
import { onboardingHeroUrl, portraitUrl } from './preload'
import { portraitAssetStem, portraitStage } from '../shared/avatarEmotion'
import type { PortraitEmotion } from '../shared/avatarEmotion'

/** ⭐ THE ONE CARD THAT IS NOT A PORTRAIT, and it is the FIRST card rather than "age 5" as a magic
 *  number: the picture is of her arriving on a court for the first time, which is what that card is
 *  about. `tests/prologue-art.test.ts` pins this against `PROLOGUE_CARDS[0].age`, so a table that
 *  ever opened somewhere else would redden here instead of quietly showing a five-year-old's
 *  welcome painting over a seven-year-old's scene. */
export const WELCOME_AGE = 5

/** The painting for one year of the childhood.
 *
 *  ⚠ TOTAL AND NEVER A 404. `portraitStage` is total over every age (`jun` below 11, `young` at
 *  11-16) and `tests/portrait-bands.test.ts` already sweeps every band × emotion against the files
 *  on disk, so any `PortraitEmotion` this is handed has a file in both bands the prologue can reach.
 *  `moodAt` in `src/prologue/run.ts` is the only producer, and it returns four of the eight. */
export function prologueArtUrl(age: number, mood: PortraitEmotion): string {
  if (age === WELCOME_AGE) return onboardingHeroUrl()
  return portraitUrl(portraitStage(age), mood)
}

/** Where her face is in that painting, as `object-position` percentages – the SAME table the Home
 *  hero, the injury popup and the 256px crop cutter read (`src/art/faceRects.ts`).
 *
 *  ⚠ IT IS A STEM AND NOT A URL because that is what `facePoint` is keyed on, and it is exported so
 *  the component and the test spell it once. ⚠ `welcome-1` is deliberately NOT in the face table:
 *  it is a scene with two people in it rather than a portrait, so `facePoint` centres it (50/50),
 *  which is what a scene wants and what every other non-band-scoped painting in this app gets.
 *
 *  ⚠ `portraitAssetStem`, NEVER THE STAGE INTERPOLATED DIRECTLY. It is identity on all five bands
 *  today and `shared/avatarEmotion.ts` keeps the seam anyway, naming the exact failure this would
 *  otherwise reintroduce: «a fifth that interpolates the stage directly is harmless TODAY and would
 *  break again the moment a stem stops being identity». This is that fifth builder. */
export function prologueArtStem(age: number, mood: PortraitEmotion): string {
  if (age === WELCOME_AGE) return 'welcome-1'
  return `${portraitAssetStem(portraitStage(age))}-${mood}`
}
