// ⭐⭐ r50 №2 – THE ALBUM FITS THE VIEWPORT HEIGHT ON LANDSCAPE TABLET/DESKTOP (owner, 12.10: «давай
// по vh впишем альбом на десктоп и планшете – все элементы управления будут прибиты к низу, а фрейм
// самого альбома займет оставшееся место»).
//
// The pain this answers, recon-measured: at 1280x800 the album column was ≈1170px tall – the chapter
// rail, the dots and the counter lived BELOW THE FOLD and flipping a chapter needed a scroll.
//
// ⚠⚠ vh IS A CEILING, NOT A SIZE. The sheet is
//
//     clamp(470, availableHeight − chrome, rungMax(width))
//
// where rungMax is r49 №13's width ladder (600 @768 / 640 @1024 / 700 @1280). On a shallow screen
// the sheet shrinks so the WHOLE column (head, sheet, chapter strip, dots, counter) ends at the
// viewport bottom; on a screen taller than cap + chrome the sheet stays at its rung cap and the
// controls follow the column naturally – no void-pinning. Portrait and phones: null, the ladder
// rules, nothing changes.
//
// ⚠ A PURE TWIN, EXPORTED FOR THE PINS. `AlbumScreen.vue`'s resize handler is the one caller in the
// app; the mounted tests use this function as their oracle, so the arithmetic lives once.
//
// ⚠ THE CHROME IS CONSTANTS, NOT DOM MEASUREMENT. `AlbumScreen.vue`'s own header rules measuring out
// («the arithmetic is done in declared numbers and never in measurements») and happy-dom runs no
// layout engine at all – a measured chrome would be untestable and could disagree with nothing.
import { SHEET_DESKTOP_PX, SHEET_PX, SHEET_TABLET_PX, SHEET_WIDE_PX } from '../shared/protocol'

/** Below this width nothing fits by height – the phone pans, whatever the orientation claims. */
export const FIT_MIN_WIDTH_PX = 768

/** The two places the album is drawn: `App.vue`'s tabbed shell, and the epilogue's fixed takeover
 *  (`EndingScreen.vue`'s `section.ending-book` inside `.ending`). Each pays different chrome. */
export type AlbumFitHost = 'shell' | 'ending'

// THE ALBUM'S OWN CHROME ABOVE AND BELOW THE SHEET, the recon's table (r50 №2, measured at
// 1280x800 on r50/album-mini). Named addends so a drift is a one-line diff, not a re-derivation:
/** `.album-head`: chapter line ≈15 + 22px title with its 2px margins ≈26 + age line ≈15, rounded
 *  up to what the recon measured on the mounted head. */
const HEAD_PX = 70
/** The wide frame's four `row-gap`s of 18px (head|sheet|rail|dots|foot). */
const ROW_GAPS_PX = 4 * 18
/** The chapter rail in its one-row STRIP form: plate 10 + 40 + 10 of padding + 2 of border, plus
 *  the list's 4px scroll padding. (The ≥1024 GRID form is ≈134px – which is why the fit returns the
 *  strip: the grid is chrome that eats the sheet.) */
const STRIP_PX = 66
/** One row of 8px dots. */
const DOTS_PX = 8
/** «Sheet N of M» at the label size. */
const COUNTER_PX = 18
const ALBUM_CHROME_PX = HEAD_PX + ROW_GAPS_PX + STRIP_PX + DOTS_PX + COUNTER_PX // 234

// THE SHELL HOST: `#app` pays 24 of top padding; its 48 of bottom padding and `.app-content`'s 96
// of next-week-bar reserve are RECLAIMED under the fit (src/style.css, the `:has(.album--fit)`
// rules), and 12px of air stands under the counter in their place.
const SHELL_PAD_TOP_PX = 24
const SHELL_BOTTOM_AIR_PX = 12
export const SHELL_CHROME_PX = SHELL_PAD_TOP_PX + ALBUM_CHROME_PX + SHELL_BOTTOM_AIR_PX // 270

// THE ENDING HOST: the takeover's own paddings (`.ending`, 24 top / 48 bottom) are NOT reclaimed –
// the epilogue gets the SIZE CEILING only, never bottom-pinning, because content continues below
// the book there (the record, the handoff). The strip addend is kept even though the ending keeps
// its ≥1024 grid: the page scrolls there anyway, so the grid's extra depth continues below the fold.
const ENDING_PAD_TOP_PX = 24
const ENDING_PAD_BOTTOM_PX = 48
export const ENDING_CHROME_PX = ENDING_PAD_TOP_PX + ENDING_PAD_BOTTOM_PX + ALBUM_CHROME_PX // 306

/** r49 №13's width ladder – the cap the ceiling clamps to. One spelling of the numbers the
 *  stylesheet also declares; `tests/component/album-wide.test.ts` joins the two. */
function rungMax(width: number): number {
  if (width >= 1280) return SHEET_WIDE_PX
  if (width >= 1024) return SHEET_DESKTOP_PX
  return SHEET_TABLET_PX
}

/** The fitted sheet size in px, or null where the ladder rules unchanged: portrait, phones, and
 *  degenerate shallow windows (landscape phones among them – 844x390 leaves 120px of room) where
 *  available − chrome falls under the 470px floor and the honest answer is the rung plus a scroll. */
export function sheetFor(width: number, height: number, host: AlbumFitHost = 'shell'): number | null {
  if (width < FIT_MIN_WIDTH_PX || width <= height) return null
  const chrome = host === 'ending' ? ENDING_CHROME_PX : SHELL_CHROME_PX
  const available = height - chrome
  if (available < SHEET_PX) return null
  return Math.min(available, rungMax(width))
}
