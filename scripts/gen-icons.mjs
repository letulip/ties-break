// Round 5 item 34 (PWA identity = the girl, not the ball): generates PWA/app icons
// from the jun avatar face crop, not the ball motif. Sharp-based (rewrite of the
// old dependency-free ball-icon encoder).
//
// Source: art-src/avatars/jun.png (256x256, already a face-centered square crop of
// the jun-norm portrait — see docs/decisions.md for the original crop offsets) or a
// jpeg sibling if one exists instead.
//
// Each output is a square canvas filled with the app's theme background (#0f172a,
// matches vite.config.ts manifest theme_color/background_color) with the face
// composited as a circle, centered:
//   pwa-192.png, pwa-512.png       — purpose "any", generous fill
//   pwa-maskable-512.png           — purpose "maskable": face kept inside a 62%
//                                     safe zone so OS-applied masks never clip it
//   pwa-apple-180.png              — iOS touch icon, same generous fill as "any"
//   favicon.png (64x64)            — the one exception: a bare circular face cutout
//                                     on a TRANSPARENT canvas (no square corners),
//                                     sized for a browser tab
//
// ball.svg is untouched and stays in the repo — it's no longer the favicon, but the
// court/viewer UI may still use the ball motif elsewhere.
import sharp from 'sharp'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const BG = '#0f172a'
const STANDARD_FRACTION = 0.82 // any / apple: face diameter as a fraction of the canvas
const MASKABLE_FRACTION = 0.62 // maskable: OS safe-zone
const FAVICON_FRACTION = 0.92 // favicon: small canvas, maximize legibility

function findFaceSource() {
  const candidates = [
    join(root, 'art-src/avatars/jun.png'),
    join(root, 'art-src/avatars/jun.jpg'),
    join(root, 'art-src/avatars/jun.jpeg'),
  ]
  const found = candidates.find(existsSync)
  if (!found) {
    throw new Error(
      'gen-icons: no jun avatar face source found (expected art-src/avatars/jun.png or a jpeg sibling)',
    )
  }
  return found
}

function circleMaskSvg(diameter) {
  const r = diameter / 2
  return Buffer.from(`<svg width="${diameter}" height="${diameter}"><circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`)
}

/** size x size PNG buffer: `source` resized to cover a circle of `size * faceFraction`
 *  px, centered on a `bg` canvas ('#rrggbb', or null for transparent). */
async function faceIcon(source, size, faceFraction, bg) {
  const faceD = Math.round(size * faceFraction)
  const face = await sharp(source)
    .resize(faceD, faceD, { fit: 'cover' })
    .composite([{ input: circleMaskSvg(faceD), blend: 'dest-in' }])
    .png()
    .toBuffer()

  const offset = Math.round((size - faceD) / 2)
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: face, left: offset, top: offset }])
    .png()
    .toBuffer()
}

const source = findFaceSource()
console.log(`gen-icons: face source ${source}`)

const targets = [
  ['pwa-192.png', 192, STANDARD_FRACTION, BG],
  ['pwa-512.png', 512, STANDARD_FRACTION, BG],
  ['pwa-maskable-512.png', 512, MASKABLE_FRACTION, BG],
  ['pwa-apple-180.png', 180, STANDARD_FRACTION, BG],
  ['favicon.png', 64, FAVICON_FRACTION, null],
]

for (const [name, size, fraction, bg] of targets) {
  const buf = await faceIcon(source, size, fraction, bg)
  const file = join(root, 'public', name)
  writeFileSync(file, buf)
  console.log(`wrote ${file}`)
}
