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

  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, left: 0, top: 0 }])
    .png()
    .toBuffer()
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
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toBuffer()
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
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: face, left: offset, top: offset }])
    .png()
    .toBuffer()
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
