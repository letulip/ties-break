// Cut the missing 256px face crops out of the 512px paintings.
//
// FRAMING RULE, measured (not guessed) from the architect's own 18 crops: each existing crop was
// located back in its painting by normalised cross-correlation (match.mjs), which gives the exact
// rectangle he used. Those rectangles are square, centred on the FACE, and side ~= 1.5x the head
// height (124-182 px, median ~158 of a 512 px painting). So: centre the square on the face, size it
// to the head, resize to 256.
//
// Face centres (src/art/faceRects.ts) were read off a labelled 64px grid laid over each painting. That method was
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
// THE TABLE MOVED (Diary-1, D2): the face rectangles now live in src/art/faceRects.ts, because the
// Home photo card steers its `object-position` off the same face centres this cutter crops around –
// one record of the framing, two consumers that can never disagree. Node strips the types on import
// (≥23, no build step), and the re-export below keeps this module's public surface – and its
// declaration file – exactly as the completeness test has always read it.
import { CROPS } from '../src/art/faceRects.ts'

export { CROPS }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PAINT = `${ROOT}/public/images/fem-euro-brunnet`
const OUT = `${ROOT}/art-src/avatars`

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
