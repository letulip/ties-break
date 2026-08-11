// THE RADAR AS A STORY RATHER THAN A VERDICT (owner, 11.08) - MOUNTED.
//
// Three rulings landed on the skills rose on one day, and all three are claims about a DRAWING, so
// all three are asserted against a real SkillsRadar rendering real `RadarAxis` rows. A source pin
// would have been cheaper and would have proved almost nothing: "the file contains startPath" says
// nothing about whether a third contour reaches the page, and "the file divides by AXIS_MAX" says
// nothing about where the point lands.
//
//   1. DRAW WHERE SHE STARTED. «на розе как раз показывать "старт" - т.е. с чего начала, может быть
//      так будет приятнее и нагляднее». The rose drew where she IS and how far she COULD go, and on a
//      live career the second of those is a sliver: the owner's own girl at seventeen had 1.3 to 7.3
//      points of headroom left on her five wings, so the picture read as a career already over. It is
//      not - she is 255th in the world and bringing prize money home - and the twelve points her
//      return had GAINED were nowhere on the chart.
//   2. THE DASHED CEILING EDGE GOES, THE HAZE STAYS. «контур "безнадежности" текущий надо убрать…
//      мы знаем в игре её потолок, потому что он запрограммирован нами, но в жизни потолок можно
//      только по прогрессу в играх увидеть. Заблюренная зона это ок.»
//   3. THE AXIS ENDS WHERE THE GAME ENDS. «если мы до 100 вообще не можем дорасти, то явно имеет
//      смысл цену деления пересмотреть на графике, чтобы максимумы упирались в максимумы… Блюр при
//      этом может и за границы оверлапом выходить, не вижу проблем».
//
// ⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed:
//   * the `.radar-start` path deleted from the template -> all three "where she began" tests go red,
//     and so does "every stroked shape", which is the one that notices a shape has LEFT.
//   * `startPath` fed `a.shownValue` instead of `a.startValue` -> "it is drawn where she STARTED"
//     goes red ALONE, while the mere-existence test stays green, which is why they are separate.
//   * a `.radar-ceiling-edge` path put back -> both "the ceiling is a region" tests go red.
//   * the guide ring left at `ORDER.map(() => 100)` while the contour is scaled by the reachable
//     maximum - i.e. the picture as it was before this wave -> "lands exactly on the outer ring" and
//     "the haze is allowed to spill" both go red, which is the ruling itself.
//
// ⚠ AND TWO MUTATIONS THIS FILE CANNOT SEE, FOUND BY TRYING THEM RATHER THAN BY REASONING ABOUT IT:
//   * `AXIS_MAX` pinned to a literal 86 -> every test here stays GREEN. The picture is identical
//     today and wrong the day `potentialBand` is widened.
//   * `pointAt` dividing by 100 again while the rings sit at `AXIS_MAX` -> every test here stays
//     GREEN TOO. Everything on the rose goes through `pointAt`, so that shrinks the whole drawing to
//     86% and leaves it internally consistent; no comparison WITHIN one rendering can catch it.
// Both are pinned against the source in radar.test.ts §12, which says the same thing from the other
// side. This note is here so the next person does not read four green geometry tests as more cover
// than they are.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillsRadar from '../../src/components/SkillsRadar.vue'
import { SKILL_CEILING_MAX, SKILL_KEYS } from '../../src/engine/development'
import type { RadarAxis } from '../../src/shared/protocol'

/** Rows with every field set on purpose - this file is about geometry, so nothing may default. */
function axes(over: (i: number) => Partial<RadarAxis>): RadarAxis[] {
  return SKILL_KEYS.map((key, i) => ({
    key,
    shownValue: 50,
    startValue: 38,
    band: 6,
    ceilingLo: 60,
    ceilingHi: 72,
    note: null,
    ...over(i),
  }))
}

const mountRadar = (rows: RadarAxis[]) => mount(SkillsRadar, { props: { axes: rows, title: 'Her game' } })

/** Every coordinate pair out of an SVG path's `d`. The component writes `M x y L x y … Z` at two
 *  decimals, so the numbers are the geometry and nothing else is in there. */
function pointsOf(d: string): [number, number][] {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  const out: [number, number][] = []
  for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]])
  return out
}

/** How far a path's points sit from the picture's centre. The centre is read off the spokes rather
 *  than hard-coded: every spoke starts there, so the drawing tells us where its own middle is. */
function radii(wrapper: ReturnType<typeof mountRadar>, selector: string): number[] {
  const line = wrapper.find('svg.radar-svg .radar-grid line')
  const cx = Number(line.attributes('x1'))
  const cy = Number(line.attributes('y1'))
  const d = wrapper.find(selector).attributes('d') ?? ''
  return pointsOf(d).map(([x, y]) => Math.hypot(x - cx, y - cy))
}

// =================================================================================================
// 1. WHERE SHE STARTED
// =================================================================================================
describe('the radar draws where she began', () => {
  it('there is a third contour, and it is a real closed shape with a corner per axis', () => {
    const wrapper = mountRadar(axes(() => ({})))
    const start = wrapper.find('svg.radar-svg path.radar-start')
    expect(start.exists()).toBe(true)
    const d = start.attributes('d') ?? ''
    expect(d.endsWith('Z'), d).toBe(true)
    expect(pointsOf(d)).toHaveLength(SKILL_KEYS.length)
    wrapper.unmount()
  })

  it('...and it is drawn where she STARTED, not a second drawing of where she is', () => {
    // The failure this exists to catch is the cheap one: a third path bound to `shownValue`, which
    // renders a picture that looks plausible and says nothing. Her start is well inside her present
    // on every axis here, so the two shapes must be measurably different sizes.
    const wrapper = mountRadar(axes((i) => ({ shownValue: 60 + i, startValue: 40 + i })))
    const start = radii(wrapper, 'svg.radar-svg path.radar-start')
    const core = radii(wrapper, 'svg.radar-svg path.radar-core')
    expect(start).toHaveLength(SKILL_KEYS.length)
    for (let i = 0; i < start.length; i++) expect(start[i]).toBeLessThan(core[i] - 1)
    // The RATIO of the two is the ratio of the numbers behind them - the picture is a drawing of the
    // rows it was handed, at one scale, with nothing else folded in.
    for (let i = 0; i < start.length; i++) {
      expect(start[i] / core[i]).toBeCloseTo((40 + i) / (60 + i), 3)
    }
    wrapper.unmount()
  })

  it('on a girl who has not moved yet the two contours land on top of each other', () => {
    // Week one, and the honest picture: one line. The story is the two coming apart, so they have to
    // START together - a third shape drawn at some decorative inset would be a claim about a gain
    // that has not happened.
    const wrapper = mountRadar(axes(() => ({ shownValue: 47, startValue: 47 })))
    expect(wrapper.find('svg.radar-svg path.radar-start').attributes('d')).toBe(
      wrapper.find('svg.radar-svg path.radar-core').attributes('d'),
    )
    wrapper.unmount()
  })

  it('the legend key for it wears the contour\'s own class, so the two cannot drift apart', () => {
    const wrapper = mountRadar(axes(() => ({})))
    const key = wrapper.findAll('.radar-legend li')[0]
    expect(key.text()).toContain('Where she started')
    expect(key.find('path').classes()).toContain('radar-start')
    wrapper.unmount()
  })
})

// =================================================================================================
// 2. NO LINE AROUND THE CEILING
// =================================================================================================
describe('the ceiling is a region and never a boundary', () => {
  it('the haze is still drawn, and nothing draws a line around it', () => {
    const wrapper = mountRadar(axes(() => ({})))
    // The region survives, blurred, punched out with evenodd - it is the whole of what the owner
    // kept ("Заблюренная зона это ок").
    const haze = wrapper.find('svg.radar-svg path.radar-ceiling')
    expect(haze.exists()).toBe(true)
    expect(haze.attributes('fill-rule')).toBe('evenodd')
    expect(haze.attributes('filter')).toContain('radar-haze')
    // ...and the hairline on its far edge does not, anywhere on the page including the legend.
    expect(wrapper.find('.radar-ceiling-edge').exists()).toBe(false)
    wrapper.unmount()
  })

  it('every stroked shape left in the picture is a contour of HER, not of her ceiling', () => {
    // A blunter version of the same claim, and the one that survives a rename: the drawing is allowed
    // exactly three shapes, and the outermost of them is a fill.
    const wrapper = mountRadar(axes(() => ({})))
    const drawn = wrapper.findAll('svg.radar-svg > path').map((p) => p.classes().join(' '))
    expect(drawn.sort()).toEqual(['radar-ceiling', 'radar-core', 'radar-fog', 'radar-start'])
    wrapper.unmount()
  })
})

// =================================================================================================
// 3. THE MAXIMUM REACHES THE MAXIMUM
// =================================================================================================
describe('the axis ends where the game ends', () => {
  it('a skill at the top of what the engine can roll lands exactly on the outer ring', () => {
    // ⚠ THIS IS THE RULING, MEASURED. At 0..100 a girl at `SKILL_CEILING_MAX` drew at 86% of the
    // radius and still looked a seventh short of the picture - of a maximum no career could ever
    // reach. «чтобы максимумы упирались в максимумы»: the contour and the guide ring are now the
    // same polygon, corner for corner.
    const wrapper = mountRadar(axes(() => ({ shownValue: SKILL_CEILING_MAX })))
    const guides = wrapper.findAll('svg.radar-svg .radar-grid path')
    expect(wrapper.find('svg.radar-svg path.radar-core').attributes('d')).toBe(guides[0].attributes('d'))
    wrapper.unmount()
  })

  it('...and ZERO is still the centre, so a modest skill does not read as nothing', () => {
    // Only the top moved. Rescaling from the middle out would have been the other obvious fix and is
    // the wrong one: a fourteen-year-old's 30 is a real number, not an empty axis.
    const wrapper = mountRadar(axes(() => ({ shownValue: 0, startValue: 0 })))
    for (const r of radii(wrapper, 'svg.radar-svg path.radar-core')) expect(r).toBeCloseTo(0, 6)
    // ...and half the maximum draws at half the radius, which is what "0 at the centre" buys.
    const half = mountRadar(axes(() => ({ shownValue: SKILL_CEILING_MAX / 2 })))
    const inner = half.findAll('svg.radar-svg .radar-grid path')[1]
    expect(half.find('svg.radar-svg path.radar-core').attributes('d')).toBe(inner.attributes('d'))
    wrapper.unmount()
    half.unmount()
  })

  it('the haze is allowed to spill outside the ring rather than being flattened onto it', () => {
    // «Блюр при этом может и за границы оверлапом выходить, не вижу проблем». The engine clamps
    // `ceilingHi` at 100, and early in a career it really does get there - a rose that pinned it back
    // to the ring would draw a confident ceiling exactly when nobody has one.
    const wrapper = mountRadar(axes(() => ({ ceilingLo: 70, ceilingHi: 100 })))
    const ring = radii(wrapper, 'svg.radar-svg .radar-grid path')[0]
    const haze = Math.max(...radii(wrapper, 'svg.radar-svg path.radar-ceiling'))
    expect(haze).toBeGreaterThan(ring)
    expect(haze / ring).toBeCloseTo(100 / SKILL_CEILING_MAX, 3)
    wrapper.unmount()
  })
})
