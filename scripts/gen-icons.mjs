// Round 5 follow-up: the owner's own logo (art-src/logo-lucia-app.png, a 330x330 face
// close-up) becomes the app identity, replacing the generated jun-avatar face-crop icons.
// Sharp-based.
//
// Source: art-src/logo-lucia-app.png. It's a fully opaque square (no alpha to matte behind),
// so every output is a plain resize/crop of it — no transparency handling needed.
//
//   pwa-192.png, pwa-512.png       — purpose "any": logo filling a rounded-square canvas,
//                                     on the app's theme background (#0f172a) so the
//                                     rounded corners read as a slight dark matte
//   pwa-maskable-512.png           — purpose "maskable": logo scaled to the 80% OS safe
//                                     zone, full-bleed square (no rounding — the OS applies
//                                     its own mask shape) on #0f172a
//   pwa-apple-180.png              — iOS touch icon, same rounded-square treatment as pwa-192/512
//   favicon.png (64x64)            — circular crop of the logo, transparent canvas, full
//                                     bleed (no square corners) — sized for a browser tab
//
// ball.svg is untouched and stays in the repo — it's no longer the favicon, but the
// court/viewer UI may still use the ball motif elsewhere.

// =================================================================================================
// ⭐⭐⭐ ROUND 36 SECOND PASS – HOW THE ICONS BECAME 1,070 KB, AND WHY THEY ARE 316 NOW
// =================================================================================================
// The owner, 05.09.2026, reading the precache manifest: «Две PNG-иконки на 874 КБ. Иконка 512x512
// весит столько, сколько весит неоптимизированный экспорт».
//
// He was right and the cause was one missing argument. Every builder below ended in a bare `.png()`,
// which is sharp's DEFAULT encoder: truecolour, no quantisation. The source is a PHOTOGRAPH – a
// 330x330 face, upscaled to 512 – and a photograph is the one thing lossless PNG cannot compress:
// 528,653 bytes for pwa-512 alone, 2.0 bytes per pixel.
//
// Two facts made it cheap to fix, both MEASURED rather than assumed:
//   1. THE ALPHA PLANE WAS DEAD. `roundedSquareIcon` and `maskableIcon` composite onto an opaque
//      #0f172a canvas, so every pixel of all four square icons had alpha 255 – a quarter of the raw
//      data carrying no information. `.removeAlpha()` before the encoder.
//   2. 256 COLOURS ARE ENOUGH FOR AN ICON. Palette-quantised against the truecolour original, the
//      mean error over the VISIBLE pixels is 1.15/255 (pwa-512), worst pixel 36, and an 8x-amplified
//      difference image is black. These are drawn at 48-192 px by an OS launcher.
//
//   pwa-512          528,653 -> 150,332   pwa-maskable-512  366,605 -> 107,641
//   pwa-192           87,438 ->  28,525   pwa-apple-180      77,270 ->  25,627
//   favicon           10,132 ->   4,056   TOTAL          1,070,098 -> 316,181  (-736 KB, -70.5%)
//
// ⚠ THE FAVICON KEEPS ITS ALPHA: it is a circular crop on a transparent canvas, and a palette PNG
// carries per-entry transparency in its tRNS chunk. Verified after the change – corners 0, centre
// 255, 75.6% opaque against a circle's 78.5%.
//
// ⚠ AND `tests/pwa-icon-weight.test.ts` IS THE RATCHET, because this defect is invisible: nothing
// on screen changes when an icon triples in weight, so only a number can catch it.
//
// ⚠⚠ THE COMMITTED PNGs WERE RE-ENCODED FROM THEMSELVES, not regenerated from the master. The
// master this script wants – art-src/logo-lucia-app.png – IS NOT ON ANY MACHINE THE REPO CAN SEE:
// art-src/ is gitignored (the author's local library) and holds no such file, so `npm run icons`
// currently throws at findLogoSource(). Re-encoding the deliverable is exact for the deliverable,
// and the options below make a future regeneration land in the same place. Restoring the master is
// the owner's call, and until he does, this script cannot run.
import sharp from 'sharp'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const BG = '#0f172a'
const CORNER_FRACTION = 0.2 // rounded-square corner radius as a fraction of icon size
const MASKABLE_SAFE_FRACTION = 0.8 // maskable: logo scaled to the OS safe zone
const FAVICON_FRACTION = 1 // favicon: full-bleed circular crop, no margin

function findLogoSource() {
  const source = join(root, 'art-src/logo-lucia-app.png')
  if (!existsSync(source)) {
    throw new Error('gen-icons: no logo source found (expected art-src/logo-lucia-app.png)')
  }
  return source
}

function circleMaskSvg(diameter) {
  const r = diameter / 2
  return Buffer.from(`<svg width="${diameter}" height="${diameter}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`)
}

/** THE ONE ENCODER for every deliverable below – see the note at the top of this file.
 *  `opaque` drops the alpha plane, which is only ever constant 255 on the square icons. */
function encode(pipeline, { opaque }) {
  const p = opaque ? pipeline.removeAlpha() : pipeline
  return p.png({ palette: true, colours: 256, quality: 100, effort: 10 })
}

function roundedRectMaskSvg(size, radius) {
  return Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`)
}

/** size x size PNG buffer: `source` covering the canvas, corners rounded to
 *  `size * CORNER_FRACTION` and filled with `bg` behind the mask. */
async function roundedSquareIcon(source, size, bg) {
  const radius = Math.round(size * CORNER_FRACTION)
  const logo = await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: roundedRectMaskSvg(size, radius), blend: 'dest-in' }])
    .png()
    .toBuffer()

  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, left: 0, top: 0 }])
  return encode(canvas, { opaque: true }).toBuffer()
}

/** size x size PNG buffer: `source` resized to `size * safeFraction` px, centered on a
 *  full-bleed `bg` canvas — no rounding, the OS applies its own maskable mask. */
async function maskableIcon(source, size, safeFraction, bg) {
  const logoSize = Math.round(size * safeFraction)
  const logo = await sharp(source)
    .resize(logoSize, logoSize, { fit: 'cover' })
    .png()
    .toBuffer()

  const offset = Math.round((size - logoSize) / 2)
  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, left: offset, top: offset }])
  return encode(canvas, { opaque: true }).toBuffer()
}

/** size x size PNG buffer: `source` resized to cover a circle of `size * faceFraction`
 *  px, centered on a transparent canvas. */
async function circleIcon(source, size, faceFraction) {
  const faceD = Math.round(size * faceFraction)
  const face = await sharp(source)
    .resize(faceD, faceD, { fit: 'cover' })
    .composite([{ input: circleMaskSvg(faceD), blend: 'dest-in' }])
    .png()
    .toBuffer()

  const offset = Math.round((size - faceD) / 2)
  const canvas = sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: face, left: offset, top: offset }])
  return encode(canvas, { opaque: false }).toBuffer()
}

const source = findLogoSource()
console.log(`gen-icons: logo source ${source}`)

const roundedTargets = [
  ['pwa-192.png', 192],
  ['pwa-512.png', 512],
  ['pwa-apple-180.png', 180],
]

for (const [name, size] of roundedTargets) {
  const buf = await roundedSquareIcon(source, size, BG)
  const file = join(root, 'public', name)
  writeFileSync(file, buf)
  console.log(`wrote ${file}`)
}

{
  const buf = await maskableIcon(source, 512, MASKABLE_SAFE_FRACTION, BG)
  const file = join(root, 'public', 'pwa-maskable-512.png')
  writeFileSync(file, buf)
  console.log(`wrote ${file}`)
}

{
  const buf = await circleIcon(source, 64, FAVICON_FRACTION)
  const file = join(root, 'public', 'favicon.png')
  writeFileSync(file, buf)
  console.log(`wrote ${file}`)
}
