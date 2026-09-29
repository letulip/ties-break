// T7.3 of the principles fix – THE IDENTITY PROOF OF THE ECONOMY SPLIT, and a standing change gate.
//
// `src/engine/economy.ts` held the whole `ECONOMY` literal, most of it comments. T7.3 split it into one module
// per block under `src/engine/economy/`, re-assembled in `economy.ts` in the key order the literal always had,
// with every essay moved verbatim to `docs/notes/economy/<block>.md`. The importers read
// `ECONOMY.<block>.<knob>` as before, so the only honest proof that nothing moved is a comparison of the
// object itself: these two pins were taken from the LIVE `ECONOMY` at c26e6146 (2026-09-29), the commit BEFORE
// the split, and they hold on the commit after it.
//
// MUTATION-VERIFIED when it was written (2026-09-29), each arm restored byte-identical afterwards: swapping two
// adjacent keys inside one split module (`economy/availability.ts`) turns the key-path pin AND the sha pin red;
// changing one numeric constant by 1 (`economy/academy.ts`) turns the sha pin red and leaves the key-path pin green.
//
//   • the sha256 of `JSON.stringify(ECONOMY)` – every value AND, because `JSON.stringify` walks keys in insertion
//     order, every key's position. Swap two adjacent keys inside a block, or change one constant by 1, and it
//     goes red. That second half is deliberate: this is a change gate on the numbers, not only a split proof, so
//     a tuning wave moves the pin – re-pin it in the same commit that carries the bench and the spec (CLAUDE.md
//     invariant 5), naming the commit the new value was taken at.
//   • the sha256 of the deep key-path list, in order – it moves ONLY when a key is added, removed or reordered,
//     so a red run of this one and a green run of the sha above means "somebody re-ordered", not "somebody tuned".
//
// ⚠ `JSON.stringify` DROPS `undefined` AND FUNCTIONS AND FLATTENS `NaN`, `Infinity` AND `-0`, so the pin above is
// only faithful while ECONOMY holds none of them. At c26e6146 it held none; the third test keeps it that way. If a
// block ever needs one of those, pin a stable stringify that sorts nothing – key order must stay observable.
//
// To re-pin after a legitimate change, log `sha(JSON.stringify(ECONOMY))` and `sha(paths.join('\n'))` from the
// `walk` below (a throwaway `console.log` in this file is the cheapest way) and edit the constants.
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/engine/economy'

// Taken at c26e6146 (2026-09-29), before economy.ts was split.
// RE-PINNED 29–30.09, the secondary market adds shop.secondary (docs/specs/secondary-market-2026-09.md §2c–§2d, step S1
// of the wave): ONE appended key at the end of the shop block, nothing reordered and nothing else tuned. Four of the five
// pins moved – the bytes (28,643 → 29,629 chars, sha 1b5c4b0b… → df4a7d51…) and the key-path list (1,853 → 1,916 paths,
// sha d0f80d19… → 3cc2c7ae…: 63 new paths, the block's 7 shared knobs, `byFamily`, six rows and their 48 columns) – and
// the 44 top-level blocks did not, `shop` being one of them. Taken on ab6c8468 plus the S1 commit of feat/secondary-market.
const PIN_JSON_SHA256 = 'df4a7d513eda46a59cef8bacfa451dea15c9440506c914d8a0036ac4f4f6964e'
const PIN_JSON_CHARS = 29_629
const PIN_PATHS_SHA256 = '3cc2c7ae8c3062695f3296e34644fd323e13756ceb5baf1d2e285a0e3be29833'
const PIN_PATH_COUNT = 1_916
const PIN_TOP_LEVEL_KEYS = 44

const sha = (s: string): string => createHash('sha256').update(s).digest('hex')

/** Every path of the object in depth-first insertion order, and everything `JSON.stringify` would not carry faithfully. */
function walk(v: unknown, path: string, paths: string[], lossy: string[]): void {
  if (v === undefined) lossy.push(`undefined at ${path}`)
  else if (typeof v === 'function') lossy.push(`function at ${path}`)
  else if (typeof v === 'number' && !Number.isFinite(v)) lossy.push(`non-finite number at ${path}`)
  else if (typeof v === 'number' && Object.is(v, -0)) lossy.push(`negative zero at ${path}`)
  else if (typeof v === 'bigint' || typeof v === 'symbol') lossy.push(`${typeof v} at ${path}`)
  if (v === null || typeof v !== 'object') return
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) {
      if (!(i in v)) lossy.push(`hole at ${path}[${i}]`)
      paths.push(`${path}[${i}]`)
      walk(v[i], `${path}[${i}]`, paths, lossy)
    }
    return
  }
  const proto = Object.getPrototypeOf(v)
  if (proto !== Object.prototype && proto !== null) lossy.push(`non-plain object at ${path}`)
  for (const k of Object.keys(v)) {
    paths.push(`${path}.${k}`)
    walk((v as Record<string, unknown>)[k], `${path}.${k}`, paths, lossy)
  }
}

describe('ECONOMY is the object it was before economy.ts was split (T7.3)', () => {
  const paths: string[] = []
  const lossy: string[] = []
  walk(ECONOMY, 'ECONOMY', paths, lossy)

  it('serialises to the same bytes: every value, in the same key order', () => {
    const json = JSON.stringify(ECONOMY)
    expect(json.length).toBe(PIN_JSON_CHARS)
    expect(sha(json)).toBe(PIN_JSON_SHA256)
  })

  it('has every key at the same place at every depth', () => {
    expect(Object.keys(ECONOMY)).toHaveLength(PIN_TOP_LEVEL_KEYS)
    expect(paths).toHaveLength(PIN_PATH_COUNT)
    expect(sha(paths.join('\n'))).toBe(PIN_PATHS_SHA256)
  })

  it('holds nothing JSON.stringify would drop or flatten, so the pin above is faithful', () => {
    expect(lossy).toEqual([])
  })
})
