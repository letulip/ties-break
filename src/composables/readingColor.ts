// THE APP'S ONE RED-TO-GREEN RAMP – "how good is this number", as a colour, owned once.
//
// hue 0 (red) at the bottom of the range through hue 120 (green) at the top, at a fixed 72%
// saturation and 48% lightness, read CONTINUOUSLY rather than in bands, so 61% and 62% are
// genuinely different colours. It paints her condition on Home, on the Kid screen and on the
// tournament brief, and her odds on the Season feed and the Calendar's marker card – five surfaces,
// and a percentage has to mean the same thing on all five.
//
// ⚠ WHAT THIS REPLACES. The same expression was written out four times – `chanceColor` in
// `composables/eventCard.ts`, `ringColor` in `HomeScreen.vue`, `conditionColor` in `KidScreen.vue`
// and `conditionColor` in `TournamentFlow.vue`. They were checked against each other over the whole
// range before they were merged, at 5 samples, at 10001 swept points and at the out-of-range and NaN
// tails, and all four agreed everywhere: same hue span, same midpoint, same lightness, same clamp
// behaviour. So there is genuinely ONE ramp here and nothing to parameterise – had any of them
// differed, the difference would have become an argument rather than being flattened away.
//
// ⚠⚠ AND THE UNIT IS PART OF THE CALL, WHICH IS THE WHOLE REASON THIS TAKES AN OBJECT.
//
// The four copies did not agree about their INPUT DOMAIN: `chanceColor` took a 0..1 chance,
// the other three took a 0..100 percentage. Merging them behind a bare `(value: number)` would have
// built the bug in rather than out – `ramp(85)` on a 0..1 ramp and `ramp(0.85)` on a 0..100 one both
// return a perfectly valid colour string, both are wrong, and NOTHING fails. The reading would just
// be red when it should be green, on a screen nobody is testing that day.
//
// A comment cannot stop that, so the signature does: there is no overload that accepts a bare
// number. `readingColor(0.85)` and `readingColor(85)` are both compile errors – the argument is
// `{ pct }` or `{ fraction }`, the two keys are mutually exclusive (`?: never`), and one of them is
// required, so "which scale is this?" cannot be left unanswered, cannot be answered twice, and is
// written in the same expression as the number it describes.

/** A "how good is this" reading, on exactly one of the app's two scales.
 *
 *  `{ pct: 84 }` – a percentage, 0..100. What `snapshot.condition` is.
 *  `{ fraction: 0.84 }` – a share, 0..1. What `preview.firstMatchChance` is, and what
 *  `ui/ProgressRing.vue` takes for its `value`.
 *
 *  ⚠ The `?: never` on each side is load-bearing, not decoration: it is what makes
 *  `{ pct: 84, fraction: 0.84 }` a compile error too. Naming both scales at once is the same
 *  confusion as naming neither, and it should fail the same way. */
export type Reading = { pct: number; fraction?: never } | { fraction: number; pct?: never }

/** The reading's colour on the app's one ramp. Out of range clamps to the ends rather than wrapping
 *  the hue circle – 120% fit must not come out red. */
export function readingColor(reading: Reading): string {
  const fraction = reading.pct === undefined ? reading.fraction : reading.pct / 100
  return `hsl(${Math.round(Math.max(0, Math.min(1, fraction)) * 120)}, 72%, 48%)`
}
