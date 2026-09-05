import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// =================================================================================================
// THE ICONS MAY NOT GROW BACK
// =================================================================================================
// Round 36 second pass, 05.09.2026. The owner read the service worker's precache manifest and found
// «Две PNG-иконки на 874 КБ». The cause was a bare `.png()` in `scripts/gen-icons.mjs` – sharp's
// default truecolour encoder, over a PHOTOGRAPH, with a constant-255 alpha plane along for the ride.
// 1,070,098 bytes for five icons became 316,181.
//
// ⚠ THIS DEFECT IS INVISIBLE, which is the whole reason for a test. Nothing on any screen changes
// when an icon triples in weight; only the download does. The two claims below are the two halves of
// the fix, and either one alone would let it back:
//   * the COLOUR TYPE, read out of the IHDR – a truecolour re-export is the exact regression;
//   * the BYTES, per file and in total, against a budget with headroom for a redrawn logo.
//
// The file list is DERIVED from public/, never spelled here: an icon added under the same naming is
// covered the day it lands, and one renamed cannot slip out of the net by leaving a stale name.
const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url))

/** Colour type from the PNG's IHDR – byte 25 of the file. 3 = palette, 2 = truecolour, 6 = RGBA. */
function colourType(bytes: Buffer): number {
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
  expect(bytes.subarray(12, 16).toString('ascii')).toBe('IHDR')
  return bytes[25]
}

const ICONS = readdirSync(PUBLIC)
  .filter((f) => (f.startsWith('pwa-') || f === 'favicon.png') && f.endsWith('.png'))
  .sort()

/** Per-file ceilings: the measured size plus ~20%, which is room for a redrawn logo and not room
 *  for a lost `palette: true`. Every truecolour original was over 3x its entry here. */
const BUDGET: Record<string, number> = {
  'favicon.png': 6_000,
  'pwa-192.png': 36_000,
  'pwa-512.png': 185_000,
  'pwa-apple-180.png': 32_000,
  'pwa-maskable-512.png': 132_000,
}
const TOTAL_BUDGET = 400_000

describe('the PWA icons stay small', () => {
  it('finds the icons the manifest ships', () => {
    // Anti-vacuity: without this, a rename would empty the list and every claim below would pass.
    expect(ICONS).toEqual([
      'favicon.png',
      'pwa-192.png',
      'pwa-512.png',
      'pwa-apple-180.png',
      'pwa-maskable-512.png',
    ])
  })

  it.each(ICONS)('%s is a palette PNG, not a truecolour export', (name) => {
    expect(colourType(readFileSync(PUBLIC + name))).toBe(3)
  })

  it.each(ICONS)('%s is inside its budget', (name) => {
    const size = readFileSync(PUBLIC + name).byteLength
    expect(BUDGET[name], `${name} has no budget – add one`).toBeGreaterThan(0)
    expect(size, `${name} is ${size} bytes`).toBeLessThanOrEqual(BUDGET[name])
  })

  it('costs the player under 400 KB in total', () => {
    const total = ICONS.reduce((n, f) => n + readFileSync(PUBLIC + f).byteLength, 0)
    expect(total, `the five icons weigh ${total} bytes`).toBeLessThanOrEqual(TOTAL_BUDGET)
  })
})
