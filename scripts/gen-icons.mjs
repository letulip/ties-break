// Generates PWA icons in the style of public/ball.svg (yellow-green ball, white seams):
//   pwa-192.png, pwa-512.png          — transparent background ("any" purpose)
//   pwa-maskable-512.png, pwa-apple-180.png — dark background, padded ball (maskable / iOS)
// No image dependencies: raw RGBA pixels -> minimal PNG encoder, soft edges via 1px coverage.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

let crcTable
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c
    }
  }
  let c = -1
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}

function encodePng(size, pixelFn) {
  const raw = Buffer.alloc(size * (1 + size * 4))
  let o = 0
  for (let y = 0; y < size; y++) {
    raw[o++] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x + 0.5, y + 0.5)
      raw[o++] = r
      raw[o++] = g
      raw[o++] = b
      raw[o++] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const BALL = [211, 239, 48] // #d3ef30, as in ball.svg
const SEAM = [255, 255, 255]
const BG = [15, 23, 42] // app theme background

const cov = (d) => Math.max(0, Math.min(1, d)) // 1px soft-edge coverage
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

/** Ball of radius r centered at (cx, cy); returns [r,g,b,coverage 0..1] or null outside. */
function ballAt(cx, cy, r) {
  const seamR = r * 1.28
  const seamOff = r * 1.72
  const seamW = r * 0.075
  return (x, y) => {
    const alpha = cov(r - Math.hypot(x - cx, y - cy) + 0.5)
    if (alpha === 0) return null
    const dL = Math.abs(Math.hypot(x - (cx - seamOff), y - cy) - seamR)
    const dR = Math.abs(Math.hypot(x - (cx + seamOff), y - cy) - seamR)
    const seam = cov(seamW - Math.min(dL, dR) + 0.5)
    return [...mix(BALL, SEAM, seam), alpha]
  }
}

function transparentIcon(size) {
  const ball = ballAt(size / 2, size / 2, size * 0.47)
  return (x, y) => {
    const px = ball(x, y)
    return px ? [px[0], px[1], px[2], Math.round(px[3] * 255)] : [0, 0, 0, 0]
  }
}

/** Maskable/apple: solid theme background, ball inside the safe zone. */
function paddedIcon(size) {
  const ball = ballAt(size / 2, size / 2, size * 0.32)
  return (x, y) => {
    const px = ball(x, y)
    return px ? [...mix(BG, [px[0], px[1], px[2]], px[3]), 255] : [...BG, 255]
  }
}

const targets = [
  ['pwa-192.png', 192, transparentIcon],
  ['pwa-512.png', 512, transparentIcon],
  ['pwa-maskable-512.png', 512, paddedIcon],
  ['pwa-apple-180.png', 180, paddedIcon],
]

for (const [name, size, style] of targets) {
  const file = join(root, 'public', name)
  writeFileSync(file, encodePng(size, style(size)))
  console.log(`wrote ${file}`)
}
