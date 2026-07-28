// THE ONE TABLE OF WHERE HER FACE IS, per stage×emotion painting (Diary-1, D2).
//
// It used to live inline in scripts/cut-avatar-crops.mjs, where only the crop cutter (and the
// completeness test) could see it. The Home photo card gave it a second consumer on the far side
// of the build: the big painting is shown landscape with `object-fit: cover`, and the crop window
// is steered by `object-position` derived from the SAME face centre the 256px cutter uses – so the
// card's framing and the avatar crops can never disagree about where she is in the frame. The
// cutter now imports the table from here (node ≥23 strips the types natively), the script's own
// declaration file stays as the type surface for the test import, and there is exactly one record
// of how the faces are framed – the property tests/portrait-bands.test.ts exists to keep.
//
// FRAMING RULE, measured (not guessed) from the architect's own 18 crops: each existing crop was
// located back in its painting by normalised cross-correlation (scripts/find-crop-rect.mjs), which
// gives the exact rectangle he used. Those rectangles are square, centred on the FACE, and side
// ~= 1.5x the head height (124-182 px, median ~158 of a 512 px painting). Face centres were read
// off a labelled 64px grid laid over each painting, checked against four known rectangles
// (within 2-12 px of the architect's own centre every time).

/** stem (`{stage}-{emotion}`) -> [face centre x, face centre y, square side], in 512px painting
 *  pixels. The side is the CUTTER's window; the photo card only reads the centre. */
export const CROPS: Record<string, [number, number, number]> = {
  'jun-angry': [252, 135, 165],
  'young-angry': [285, 122, 165],
  'teen-angry': [290, 148, 145],
  'adult-angry': [300, 150, 155],
  'milf-angry': [252, 140, 155],
  // second pass: 155 framed her head noticeably smaller than the rest of the set, and this is the
  // DEFAULT face for 23-30, so it is the one worth getting tight.
  'adult-norm': [302, 140, 128],
  'adult-happy': [247, 98, 190],
  'adult-sad': [305, 180, 172],
  'adult-serious': [292, 182, 165],
  'adult-tired': [295, 168, 172],
  'adult-injury': [328, 188, 165],
  'milf-norm': [257, 150, 145],
  'milf-happy': [265, 95, 185],
  'milf-sad': [300, 152, 172],
  'milf-serious': [235, 130, 185],
  'milf-tired': [247, 118, 185],
  'milf-injury': [297, 197, 165],

  // --- RECOVERED, not authored ------------------------------------------------------------
  // The 18 crops that shipped before this table existed were cut by hand and their rectangles
  // were never written down. Each was located back inside its painting by
  // `scripts/find-crop-rect.mjs` (normalised cross-correlation); the residual on each line is
  // that match's error — all under 0.04, i.e. near-exact. They are here so a re-cut after an
  // art refresh covers the WHOLE set, not just the ones added in this branch.
  'jun-norm': [251, 137, 138], // recovered, residual 0.0110
  'jun-happy': [208, 168, 156], // recovered, residual 0.0110
  'jun-sad': [233, 171, 154], // recovered, residual 0.0214
  'jun-serious': [239, 197, 170], // recovered, residual 0.0073
  'jun-tired': [240, 156, 172], // recovered, residual 0.0071
  'jun-injury': [238, 154, 172], // recovered, residual 0.0045
  'young-norm': [275, 135, 154], // recovered, residual 0.0088
  'young-happy': [232, 170, 156], // recovered, residual 0.0319
  'young-sad': [200, 146, 140], // recovered, residual 0.0382
  'young-serious': [296, 80, 124], // recovered, residual 0.0154
  'young-tired': [286, 164, 156], // recovered, residual 0.0062
  'young-injury': [227, 169, 154], // recovered, residual 0.0197
  'teen-norm': [275, 103, 154], // recovered, residual 0.0170
  'teen-happy': [292, 170, 172], // recovered, residual 0.0036
  'teen-sad': [290, 160, 164], // recovered, residual 0.0100
  'teen-serious': [323, 155, 182], // recovered, residual 0.0162
  'teen-tired': [304, 160, 172], // recovered, residual 0.0163
  'teen-injury': [272, 160, 164], // recovered, residual 0.0050
}

/** The paintings are square 512px (portrait-bands pins the files, the cutter reads the metadata –
 *  this constant only normalises the centres into percentages). */
const PAINTING_SIDE = 512

/** The face centre of one painting as `object-position` percentages, clamped into [0, 100].
 *
 *  WHY PERCENT SEMANTICS DO THE CROP MATH FOR US: with `object-fit: cover`, `object-position:
 *  P% Q%` aligns the point P% across the IMAGE with the point P% across the BOX – so the face
 *  lands at the same relative position inside the visible window that it has in the full painting,
 *  and (for any P, Q in 0..100) the cover window can never slide past the painting's edge. The
 *  clamp below is therefore only a guard against a bad table entry, but it is what makes the
 *  "window stays inside the painting" claim total rather than data-dependent.
 *
 *  Total: an unknown stem centres the frame (50/50) instead of breaking the card. */
export function facePoint(stem: string): { x: number; y: number } {
  const rect = CROPS[stem]
  if (!rect) return { x: 50, y: 50 }
  const clampPct = (v: number) => Math.min(100, Math.max(0, (v / PAINTING_SIDE) * 100))
  return { x: clampPct(rect[0]), y: clampPct(rect[1]) }
}
