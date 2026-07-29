// Recover the crop rectangle the architect used: for each existing 256px crop, search the
// 512px painting for the square window that, downsampled, best matches the crop.
//
// Speed trick: a summed-area table over the painting's greyscale lets any rectangle be
// box-averaged into an NxN thumbnail with 4 lookups per cell, so a coarse-to-fine sweep over
// (x, y, size) is cheap. Scoring is zero-mean / unit-variance SSD (= 1 - NCC), which ignores the
// brightness and webp-requantisation differences between the crop and its source.
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const PAINT = `${ROOT}/public/images/fem-euro-brunnet`
const CROPS = `${ROOT}/public/avatars`

async function grey(file, size) {
  const p = sharp(file).greyscale()
  const r = size ? p.resize(size, size, { fit: 'fill' }) : p
  const { data, info } = await r.raw().toBuffer({ resolveWithObject: true })
  return { d: data, w: info.width, h: info.height }
}

/** Summed-area table; sat[(y)*(w+1)+(x)] = sum of all pixels strictly above-left. */
function buildSat({ d, w, h }) {
  const sat = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let row = 0
    for (let x = 0; x < w; x++) {
      row += d[y * w + x]
      sat[(y + 1) * (w + 1) + (x + 1)] = sat[y * (w + 1) + (x + 1)] + row
    }
  }
  return sat
}

function rectMean(sat, w, x0, y0, x1, y1) {
  const W = w + 1
  const s = sat[y1 * W + x1] - sat[y0 * W + x1] - sat[y1 * W + x0] + sat[y0 * W + x0]
  return s / ((x1 - x0) * (y1 - y0))
}

/** Box-average the square (x,y,s) of the painting into an N x N vector. */
function thumb(sat, w, x, y, s, N, out) {
  for (let j = 0; j < N; j++) {
    const y0 = y + Math.floor((j * s) / N)
    const y1 = y + Math.floor(((j + 1) * s) / N)
    for (let i = 0; i < N; i++) {
      const x0 = x + Math.floor((i * s) / N)
      const x1 = x + Math.floor(((i + 1) * s) / N)
      out[j * N + i] = rectMean(sat, w, x0, y0, x1 < x1 + 1 ? Math.max(x1, x0 + 1) : x1, Math.max(y1, y0 + 1))
    }
  }
  return out
}

function normalise(v) {
  let m = 0
  for (const x of v) m += x
  m /= v.length
  let sd = 0
  for (const x of v) sd += (x - m) * (x - m)
  sd = Math.sqrt(sd / v.length) || 1
  const o = new Float64Array(v.length)
  for (let i = 0; i < v.length; i++) o[i] = (v[i] - m) / sd
  return o
}

function ssd(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    s += d * d
  }
  return s / a.length
}

async function locate(paintFile, cropFile) {
  const img = await grey(paintFile)
  const sat = buildSat(img)
  const { w, h } = img

  async function tmplAt(N) {
    const t = await grey(cropFile, N)
    return normalise(t.d)
  }

  // Coarse pass: N=16, size 96..min(w,h) step 8, position step 8.
  let best = null
  const N1 = 16
  const t1 = await tmplAt(N1)
  const buf1 = new Float64Array(N1 * N1)
  const maxS = Math.min(w, h)
  for (let s = 96; s <= maxS; s += 8) {
    for (let y = 0; y + s <= h; y += 8) {
      for (let x = 0; x + s <= w; x += 8) {
        const sc = ssd(t1, normalise(thumb(sat, w, x, y, s, N1, buf1)))
        if (!best || sc < best.score) best = { x, y, s, score: sc }
      }
    }
  }

  // Fine pass: N=32, +-10px around the coarse winner, step 1.
  const N2 = 32
  const t2 = await tmplAt(N2)
  const buf2 = new Float64Array(N2 * N2)
  let fine = null
  for (let s = Math.max(32, best.s - 12); s <= Math.min(maxS, best.s + 12); s += 2) {
    for (let y = Math.max(0, best.y - 12); y + s <= h && y <= best.y + 12; y += 2) {
      for (let x = Math.max(0, best.x - 12); x + s <= w && x <= best.x + 12; x += 2) {
        const sc = ssd(t2, normalise(thumb(sat, w, x, y, s, N2, buf2)))
        if (!fine || sc < fine.score) fine = { x, y, s, score: sc }
      }
    }
  }
  return { ...fine, w, h }
}

const rows = []
for (const crop of process.argv.slice(2)) {
  const stem = crop.replace('.webp', '')
  const paint = `${PAINT}/fem-euro-brunnet-${stem}.webp`
  if (!existsSync(paint)) {
    console.log(`${stem.padEnd(16)} NO PAINTING`)
    continue
  }
  const r = await locate(paint, `${CROPS}/${crop}`)
  const cx = ((r.x + r.s / 2) / r.w) * 100
  const cy = ((r.y + r.s / 2) / r.h) * 100
  const frac = (r.s / r.w) * 100
  rows.push({ stem, ...r, cx, cy, frac })
  console.log(
    `${stem.padEnd(16)} rect=(${String(r.x).padStart(3)},${String(r.y).padStart(3)}) s=${String(r.s).padStart(3)}` +
      `  centre=(${cx.toFixed(1)}%,${cy.toFixed(1)}%)  size=${frac.toFixed(1)}%  resid=${r.score.toFixed(4)}`,
  )
}

if (rows.length > 1) {
  const stat = (k) => {
    const v = rows.map((r) => r[k]).sort((a, b) => a - b)
    return `min ${v[0].toFixed(1)}  med ${v[v.length >> 1].toFixed(1)}  max ${v[v.length - 1].toFixed(1)}`
  }
  console.log(`\ncentre-x %: ${stat('cx')}`)
  console.log(`centre-y %: ${stat('cy')}`)
  console.log(`size %    : ${stat('frac')}`)
  console.log(`residual  : ${stat('score')}`)
}
