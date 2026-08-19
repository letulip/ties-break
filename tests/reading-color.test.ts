// THE ONE RED-TO-GREEN RAMP – its colours, and the reason its signature is shaped the way it is.
//
// ⚠ WHY THIS FILE EXISTS AT ALL. `composables/readingColor.ts` replaced FOUR byte-identical copies
// of one hsl expression, and it makes two claims that a comment cannot keep:
//
//   1. NO RENDERED COLOUR MOVED. The four copies were compared against each other and against the
//      replacement over the whole range before the merge, and every string matched. That is a
//      measurement, and a measurement that is not pinned rots. The `RAMP` table below is the pin.
//   2. THE UNIT CANNOT BE CONFUSED. Two of the five call sites hand it a 0..1 share and three hand
//      it a 0..100 percentage. Under a bare `(value: number)` signature, `ramp(85)` on a 0..1 ramp
//      and `ramp(0.85)` on a 0..100 one both return a valid colour string, both are wrong, and
//      nothing fails - the ring is simply red when it should be green, on a screen nobody is
//      looking at that day. The `@ts-expect-error` block is what keeps that impossible.
//
// ⚠ THE SECOND HALF IS ENFORCED BY `vue-tsc`, NOT BY VITEST, and that is deliberate rather than a
// gap. `tsconfig.app.json` includes `tests/**/*.ts`, so `npx vue-tsc -b --force` type-checks this
// file - and an `@ts-expect-error` sitting over a line that has started COMPILING is itself an
// error (TS2578). So the day somebody widens the signature to accept a bare number, the type gate
// goes red naming these exact lines. Mutation-verified before this landed: widening the parameter
// to `Reading | number` produced TS2578 on both bare-number cases and on nothing else.
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { readingColor } from '../src/composables/readingColor'

// The ramp, as rendered strings. Hue 0 (red) at the bottom of the range through hue 120 (green) at
// the top, at a fixed 72% saturation and 48% lightness. ⚠ THESE ARE A DESIGN DECISION, NOT AN
// IMPLEMENTATION DETAIL: if a change makes this table move, the change is wrong until the owner
// says otherwise.
const RAMP: Array<[fraction: number, pct: number, colour: string]> = [
  [0, 0, 'hsl(0, 72%, 48%)'],
  [0.25, 25, 'hsl(30, 72%, 48%)'],
  [0.5, 50, 'hsl(60, 72%, 48%)'],
  [0.75, 75, 'hsl(90, 72%, 48%)'],
  [1, 100, 'hsl(120, 72%, 48%)'],
]

describe('readingColor - the app has one ramp and this is it', () => {
  it.each(RAMP)('a %s share is %s percent and both paint %s', (fraction, pct, colour) => {
    expect(readingColor({ fraction })).toBe(colour)
    expect(readingColor({ pct })).toBe(colour)
  })

  // THE TWO SCALES ARE THE SAME RAMP, swept rather than sampled – five points would not notice a
  // rounding difference between them, and a rounding difference is exactly what a re-derivation
  // would introduce.
  it('the two scales agree at every point on the ramp, not only at the five above', () => {
    const disagreements: number[] = []
    for (let i = 0; i <= 10_000; i++) {
      const fraction = i / 10_000
      if (readingColor({ fraction }) !== readingColor({ pct: fraction * 100 })) disagreements.push(fraction)
    }
    expect(disagreements, 'the share scale and the percentage scale must be one ramp').toEqual([])
  })

  // ⚠ CLAMPED, NOT WRAPPED. All four originals clamped and it matters: hue is a circle, so an
  // unclamped 120% fit would come back round to RED – the worst possible reading to put on the
  // healthiest possible number.
  it.each([
    [-1, 'hsl(0, 72%, 48%)'],
    [-0.0001, 'hsl(0, 72%, 48%)'],
    [1.0001, 'hsl(120, 72%, 48%)'],
    [2, 'hsl(120, 72%, 48%)'],
  ])('%s clamps to the end of the ramp rather than wrapping the hue circle', (fraction, colour) => {
    expect(readingColor({ fraction })).toBe(colour)
    expect(readingColor({ pct: fraction * 100 })).toBe(colour)
  })
})

// -------------------------------------------------------------------------------------------------
// THE SIGNATURE. Every line in the array below is a call the compiler must REJECT. Nothing here is
// invoked – `vue-tsc` is the assertion – and the runtime check exists only so that deleting a line
// is visible in vitest too, rather than silently shrinking the protected set.
// -------------------------------------------------------------------------------------------------
describe('readingColor cannot be handed a number whose scale is unstated', () => {
  it('rejects the bare, the ambiguous and the doubly-claimed', () => {
    const rejected = [
      // @ts-expect-error a bare 0..1 share cannot say which scale it is on
      () => readingColor(0.85),
      // @ts-expect-error ...and neither can a bare 0..100 percentage. THIS is the bug designed out.
      () => readingColor(85),
      // @ts-expect-error naming both scales at once is the same confusion as naming neither
      () => readingColor({ pct: 84, fraction: 0.84 }),
      // @ts-expect-error naming neither
      () => readingColor({}),
      // @ts-expect-error a misspelled scale is not a scale
      () => readingColor({ percent: 84 }),
    ]
    expect(rejected, 'five misuse shapes are pinned above; do not shorten this list').toHaveLength(5)
  })
})

// ⚠ AND THE RAMP HAS EXACTLY ONE DEFINITION – the claim this whole change rests on, checked against
// the source rather than trusted. Four copies is the state this replaced, and a fifth would arrive
// the same way the first four did: one screen at a time, each one reasonable on its own.
describe('the ramp is written once', () => {
  it('no component or composable spells the hsl ramp out for itself', () => {
    const root = fileURLToPath(new URL('../src/', import.meta.url))
    const offenders: string[] = []
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name)
        if (e.isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(ts|vue)$/.test(e.name) || full.endsWith(join('composables', 'readingColor.ts'))) continue
        // The EXPRESSION, not the prose: `120` and the ramp's own `72%, 48%` on one line of code is
        // a hand-rolled ramp. A comment that merely mentions the colours is not, and several
        // legitimately do.
        for (const line of readFileSync(full, 'utf8').split('\n')) {
          const code = line.trimStart()
          if (code.startsWith('//') || code.startsWith('*')) continue
          if (line.includes('72%, 48%') && line.includes('120')) offenders.push(`${full.slice(root.length)}: ${code}`)
        }
      }
    }
    walk(root)
    expect(offenders, 'call readingColor() instead of re-deriving the ramp').toEqual([])
  })
})
