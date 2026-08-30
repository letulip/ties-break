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
 *  pixels. The side is the CUTTER's window; the photo card only reads the centre.
 *
 *  ⚠ THE TABLE IS KEYED ON PAINTINGS, NOT ON CROPS (ui/art-rehab-sleepy). It reads as "the crop
 *  table" and it is one, but its SECOND consumer – the Home hero's `object-position` – needs a
 *  face centre for every painting the screen can show, whether or not a 256px crop is ever cut
 *  from it. `rehab` is the first face where those two sets differ: five paintings, no crops. So it
 *  has five entries here (Home would otherwise frame a rehab week at 50/50, which on a landscape
 *  cover window is her knee, not her face) and `PAINTING_ONLY_FACES` below keeps the cutter off
 *  them. Adding a rectangle here is NOT what ships a crop; being croppable is. */
export const CROPS: Record<string, [number, number, number]> = {
  'jun-angry': [252, 135, 165],
  'young-angry': [285, 122, 165],
  'teen-angry': [290, 148, 145],
  'adult-angry': [300, 150, 155],
  'lateCareer-angry': [252, 140, 155],
  // second pass: 155 framed her head noticeably smaller than the rest of the set, and this is the
  // DEFAULT face for 23-30, so it is the one worth getting tight.
  'adult-norm': [302, 140, 128],
  'adult-happy': [247, 98, 190],
  'adult-sad': [305, 180, 172],
  'adult-serious': [292, 182, 165],
  'adult-tired': [295, 168, 172],
  'adult-injury': [328, 188, 165],
  // ⭐⭐⭐ ROUND 30 #19 – THE ONE RECTANGLE IN THIS TABLE THAT WAS NOT ON A FACE.
  //
  // THE OWNER, 30.08: «Аватар иконка в левом верхнем углу home экрана для milf стадии показывает
  // только нижнюю часть лица без глаз и волос».
  //
  // ⚠ REPRODUCED EXACTLY, AND IT WAS THIS LINE. `[257, 150, 145]` put the window at y 77-222 of a
  // 512px painting whose face centre is at y~85: the crop opened at her chin and ran down to her
  // chest, so `public/avatars/lateCareer-norm.webp` really did ship a neck and a necklace. It is the
  // DEFAULT emotion of the 31+ band, which is why he sees it every week and nobody saw it before.
  //
  // ⚠ ALL FORTY RECTANGLES WERE CHECKED, not just the reported one – every entry drawn back over
  // its own painting (5 stages x 8 faces). This was the only miss. `lateCareer-angry` reads low in a
  // thumbnail because her head is TILTED DOWN in that painting and the crop is correct; it was cut
  // and looked at rather than adjusted on the strength of the thumbnail.
  //
  // ⚠ THE NEW RECTANGLE OBEYS THE FILE'S OWN FRAMING RULE and is not eyeballed against the others:
  // her head spans y~25-135, so the centre is (240, 85) and the side is 1.5x the ~110px head = 165,
  // inside the set's measured 124-182 spread. ⚠ AND THE SAME LINE STEERS THE HERO: `facePoint`
  // reads columns 0-1 for `object-position`, so this fixed two surfaces – the icon he reported and
  // every non-square window that frames this painting (the fork, retirement and finale cards).
  'lateCareer-norm': [240, 85, 165],
  'lateCareer-happy': [265, 95, 185],
  'lateCareer-sad': [300, 152, 172],
  'lateCareer-serious': [235, 130, 185],
  'lateCareer-tired': [247, 118, 185],
  'lateCareer-injury': [297, 197, 165],

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
  // R14-1 – the five REHAB paintings. Face centres read the way the note at the top of this file
  // describes (a labelled grid over each 512px painting); the `side` column is the set's usual
  // ~1.5x head height and is unused today, because nothing cuts a crop from these five – it is
  // recorded so the table stays one shape and so a future crop slice has the window already.
  'jun-rehab': [225, 125, 155],
  'young-rehab': [240, 105, 150],
  'teen-rehab': [252, 118, 150],
  'adult-rehab': [228, 118, 160],
  'lateCareer-rehab': [250, 115, 155],
}

/** The emotions that have a PAINTING but no 256px crop – the set the cutter must skip.
 *
 *  This is the art-side spelling of `shared/avatarEmotion.ts`'s `PortraitEmotion \ AvatarEmotion`,
 *  kept as a literal here so this module stays import-free (the cutter script loads it under bare
 *  node type-stripping). tests/portrait-bands.test.ts pins the two spellings equal, so they cannot
 *  drift: add a painting-only face to the union and the test fails until this list agrees. */
export const PAINTING_ONLY_FACES: readonly string[] = ['rehab']

/** The stems the 256px cutter should cut – every entry except the painting-only faces. */
export function croppableStems(): string[] {
  return Object.keys(CROPS).filter(
    (stem) => !PAINTING_ONLY_FACES.some((e) => stem.endsWith(`-${e}`)),
  )
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
