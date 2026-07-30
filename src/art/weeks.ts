// THE WEEK PAINTINGS – the art for a week with no tournament in it.
//
// The Season card made the empty weeks look like table rows next to a photo album, which is exactly
// what they had become: one muted line each, whatever the week was. These four frames (the owner's,
// 28.07) give them a card of their own:
//
//   training   she is on court doing ladder drills, the week's plan open on the bench beside her
//   off-1/2/3  the off-season, three ways – a fire and a window, a frozen lake at sunset, notes by
//              a court somewhere warm
//
// THE OWNER'S RULE, and it needs no randomness at all (28.07):
//
//   * `training` is EVERY in-year week with no tournament in it - a training week, an exam week,
//     any week the calendar left empty. She is on court or she is not competing; one frame covers
//     all of it, and a frame she sees forty times a season should be quiet enough to disappear.
//   * `off-1/2/3` are THE OFF-SEASON, one apiece. The block is exactly three weeks and there are
//     exactly three paintings, so each week wears its own: the fire, the frozen lake, the warm
//     court. In order, every year, by the week's position in the block - a fixed mapping, not a
//     draw. December then reads as a sequence rather than as three of the same thing.
//
// No RNG, no sub-stream, nothing to keep in step with the engine: the picture is a pure function of
// which week it is.

import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../engine/season/calendar'

const WEEK_DIR = 'images/weeks/'

/** Every week painting that ships, by stem. Listed rather than globbed so the test can check it
 *  against the files on disk in both directions. */
export const WEEK_ART: readonly string[] = ['training', 'off-1', 'off-2', 'off-3']

const OFF_SEASON_ART = WEEK_ART.filter((s) => s.startsWith('off-'))

/** Which week of the off-season block this is: 0, 1, 2. The block is the season's last
 *  OFF_SEASON_WEEKS weeks, so the position is just the distance from its first. */
function offSeasonIndex(week: number): number {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return offset - (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
}

/** The stem for one week. Every week without a tournament has one. */
export function weekArtStem(week: number): string {
  const i = offSeasonIndex(week)
  // Clamped rather than trusted: if the block ever grows past the three paintings, the last one
  // repeats instead of the card rendering a 404.
  if (i >= 0) return OFF_SEASON_ART[Math.min(i, OFF_SEASON_ART.length - 1)]
  return 'training'
}

/** What the card binds to its `<img>`. */
export function weekArtUrl(week: number): string {
  return `${import.meta.env.BASE_URL}${WEEK_DIR}${weekArtStem(week)}.webp`
}

// --- THE VACATION PAINTINGS (owner, 29.07) -------------------------------------------------------
// A booked family week now gets a card of its own in the Season feed, and each of the six packages
// wears its own frame instead of all of them sharing the calendar's grey row.
//
// THE FILE NAMES ARE THE OWNER'S, NOT THE PACKAGE IDS, and this map is why: he paints and names by
// what is in the picture (friends, a village, the sea), the engine names by what the family buys
// (`staycation`, `grandma`, `seaside`). Mapping them here keeps both free to be themselves and puts
// the translation in exactly one place - the alternative is renaming an author's files, which is a
// habit that eventually loses one.
//
// THEY ARE A DIFFERENT SHAPE from the week paintings and the card follows the art: the vacation
// frames are 941x377 (2.50:1) against the week frames' 941x536 (1.76:1), so a vacation card is
// visibly shorter than a training card in the same feed. That is the owner's intent, not a
// mismatch - see `.vacation-card` in style.css, which takes its aspect-ratio from these numbers.
const VACATION_ART: Record<string, string> = {
  staycation: 'vac-friends',
  grandma: 'vac-village',
  camping: 'vac-camping',
  seaside: 'vac-sea',
  resort: 'vac-resort',
  elite: 'vac-elite',
}

/** The frame for a package id, or null if the id is one we have no painting for - a caller must
 *  handle that rather than render a 404, because the package catalogue can grow before the art does. */
export function vacationArtUrl(packageId: string): string | null {
  const stem = VACATION_ART[packageId]
  return stem ? `${import.meta.env.BASE_URL}${WEEK_DIR}${stem}.webp` : null
}

/** Exported for the test that checks every shipped package has a painting and every painting is
 *  reachable from a package - the same both-directions check `WEEK_ART` gets. */
export const VACATION_ART_STEMS: readonly string[] = Object.values(VACATION_ART)

// --- W5: EVERY WEEK'S PAINTING, FROM THE ENGINE'S OWN ANSWER ---------------------------------------
//
// The owner, 30.07: «week recap сделаем на каждую неделю ... Для недель с тренировками можем
// использовать наши арты тренировки, для недель с восстановлением после травмы соответственно. Если
// был отпуск - есть соответствующие картинки отпуска».
//
// THE DECISION IS NOT HERE, and that is the point. `engine/diary.ts weekSceneFor` answers what the
// week WAS - a journey home, a layoff, a holiday, or the calendar's own frame - and writes down the
// priority order and the argument for it. This function only spells the filename, which is why it is a
// switch with no conditions in it: four arms, four builders, total over the union, so a fifth kind of
// week cannot be added without the compiler asking what it looks like.
//
// ⚠ THE VACATION ARM IS THE ONLY ONE THAT CAN FALL BACK, and it is the contract `vacationArtUrl`
// already documents: the package catalogue is allowed to grow before the art does, so a package with
// no painting returns null and the caller must not render a 404. It falls back to the week's own
// frame - which is what this screen drew before it knew about holidays at all.

import { portraitUrl, travelHomeUrl } from './preload'
import type { WeekScene } from '../shared/protocol'

/** The painting for one week, from the engine's `WeekScene`. Total, and never a 404. */
export function weekSceneArtUrl(scene: WeekScene): string {
  switch (scene.kind) {
    case 'travel':
      return travelHomeUrl(scene.scene, scene.mood)
    // The layoff painting is band-scoped (five files, one per age band) and is already warmed by
    // `preloadKidArt` - it is one of the eight faces every career preloads for her own band.
    case 'rehab':
      return portraitUrl(scene.stage, 'rehab')
    case 'vacation':
      return vacationArtUrl(scene.packageId) ?? weekArtUrl(scene.week)
    case 'week':
      return weekArtUrl(scene.week)
  }
}
