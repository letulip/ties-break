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
