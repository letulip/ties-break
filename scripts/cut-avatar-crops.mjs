// Cut the missing 256px face crops out of the 512px paintings.
//
// FRAMING RULE, measured (not guessed) from the architect's own 18 crops: each existing crop was
// located back in its painting by normalised cross-correlation (match.mjs), which gives the exact
// rectangle he used. Those rectangles are square, centred on the FACE, and side ~= 1.5x the head
// height (124-182 px, median ~158 of a 512 px painting). So: centre the square on the face, size it
// to the head, resize to 256.
//
// Face centres below were read off a labelled 64px grid laid over each painting. That method was
// checked against four paintings whose true rectangle is known (teen-norm, young-happy, jun-sad,
// teen-serious) and landed within 2-12 px of the architect's own centre every time — inside his own
// frame-to-frame spread.
//
// Output: 256x256 PNG masters into art-src/avatars/. `npm run art` encodes them to
// public/avatars/*.webp at the pipeline's portrait profile, exactly like the four masters already
// there. No bespoke encoder settings.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PAINT = `${ROOT}/public/images/fem-euro-brunnet`
const OUT = `${ROOT}/art-src/avatars`

// stem -> [face centre x, face centre y, square side], in 512px painting pixels
export const CROPS = {
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

// Only cut when RUN. The table is also imported by tests/portrait-bands.test.ts to check that every
// stage x emotion has a rectangle — importing it must not rewrite 35 masters as a side effect.
const RUN_DIRECTLY = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (RUN_DIRECTLY) {
mkdirSync(OUT, { recursive: true })

for (const [stem, [cx, cy, s]] of Object.entries(CROPS)) {
  const src = `${PAINT}/fem-euro-brunnet-${stem}.webp`
  const { width: W, height: H } = await sharp(src).metadata()
  const side = Math.min(s, W, H)
  // Clamp the window inside the canvas rather than letting sharp throw – a face near an edge just
  // sits off-centre in its square, which is what the architect's edge cases do too.
  const left = Math.max(0, Math.min(W - side, Math.round(cx - side / 2)))
  const top = Math.max(0, Math.min(H - side, Math.round(cy - side / 2)))
  await sharp(src)
    .extract({ left, top, width: side, height: side })
    .resize(256, 256, { fit: 'fill' })
    .png()
    .toFile(`${OUT}/${stem}.png`)
  console.log(`${stem.padEnd(15)} extract=(${left},${top},${side}) from ${W}x${H}`)
}
console.log(`\n${Object.keys(CROPS).length} crop masters -> art-src/avatars/`)
}
