// ⭐⭐⭐ THE RANK IN THE COLOUR – spec §4's «Цвет билета и бирки несёт ранг: чем выше ступень, тем
// насыщеннее», mounted and measured.
//
// The claim has three halves and each one is a different kind of assertion:
//   1. TOTAL – every one of the sixteen rungs `season/calendar.ts` can put on a pass paints one of
//      the four steps. Walked over `TIER_LADDER` itself rather than over a list typed here, so a
//      seventeenth rung arrives in this test the day it arrives in the game.
//   2. DERIVED – the eight inks in the two components are the design system's own `--tier-*` tokens
//      times one number each, so the album adds no colour to the app. The factors are re-applied
//      HERE, against the tokens read off the live stylesheet, and compared channel by channel.
//   3. LEGIBLE – every step, on both surfaces, through the real cascade.
//
// ⚠⚠ WHY (2) IS WORTH A TEST AT ALL. `color-mix(in srgb, var(--tier-elite) 38%, #000)` is the CSS
// that would say this in one line, and it computes to the EMPTY STRING under happy-dom (probed,
// 20.09) – `effectiveBackground` would then walk straight past the pass and measure the album's
// paper, and the contrast assertions below would be green nonsense about dark text on white. So the
// components carry literal hexes and this file is what keeps them honest: change a token in
// `docs/design/tokens.css` and re-export it, and the ink that no longer matches goes red by name.
//
// ⚠ AND THE OPACITY IS FOLDED IN BY HAND, which `assertLegible` does not do. Half the pass's text
// runs at `opacity: 0.78`; reading `color` alone reports a contrast the player never sees. `ratioOf`
// walks the ancestors multiplying opacities and composites before measuring, so the number below is
// the one on the screen. It is strictly harsher than `assertLegible`, and both are used.
//
// ⚠⚠ MUTATION-VERIFIED – every `it` here was watched failing. The ledger is at the foot of the file.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import '../../src/style.css'

import AlbumTicketPass from '../../src/components/album/AlbumTicketPass.vue'
import AlbumTagCard from '../../src/components/album/AlbumTagCard.vue'
import { TIERS, TIER_LADDER } from '../../src/engine/season/calendar'
import type { TierId } from '../../src/engine/season/types'
import { ALBUM_TIER_STEP } from '../../src/engine/world/albumBook'
import type { AlbumTierStep } from '../../src/shared/protocol'
import { contrastRatio, effectiveBackground, parseColor } from './contrast'
import { sheetOf } from './albumFixture'

/** The four, in ramp order – budget lowest. Nothing here re-lists the RUNGS; that is the engine's. */
const STEPS: readonly AlbumTierStep[] = ['budget', 'middle', 'high', 'elite']

/** THE THREE FACTORS THE TWO COMPONENTS ARE PAINTED WITH, in one place so the arithmetic below is
 *  the components' own and not a second opinion about it. */
const PASS_INK = 0.38
const PASS_DEEP = 0.27
const TAG_INK = 0.18

/** The design system's token for a step, read off the LIVE document – `src/style.css` declares the
 *  four on `:root` straight from `docs/design/tokens.css`. */
function token(step: AlbumTierStep): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--tier-${step}`).trim()
  // ⚠ THROWS RATHER THAN RETURNING '' – an absent token would make every derivation below compare
  // black against black and pass, which is the vacuous-guard family this repo keeps paying for.
  if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`--tier-${step} is ${JSON.stringify(value)}, not a hex – is src/style.css loaded?`)
  return value
}

function channels(css: string): [number, number, number] {
  const [r, g, b] = parseColor(css)
  return [r, g, b]
}

/** The token scaled in sRGB, rounded the way a person writing the hex would round it. */
function scaled(step: AlbumTierStep, factor: number): [number, number, number] {
  return channels(token(step)).map((v) => Math.round(v * factor)) as [number, number, number]
}

/** Every opacity between an element and the root, multiplied – the alpha its text really paints at. */
function inheritedAlpha(el: Element): number {
  let alpha = 1
  for (let node: Element | null = el; node; node = node.parentElement) {
    const raw = getComputedStyle(node).opacity
    const value = raw === '' ? 1 : Number(raw)
    if (Number.isFinite(value)) alpha *= value
  }
  return alpha
}

/** WCAG contrast for one element's text on what is behind it, with its own alpha AND every
 *  ancestor's opacity composited in. Refuses to answer blind, `assertLegible`'s own guard. */
function ratioOf(el: Element): number {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`, and without it this measurement is vacuous')
  }
  const bg = effectiveBackground(el)
  const colour = parseColor(getComputedStyle(el).color)
  const alpha = colour[3] * inheritedAlpha(el)
  const fg = [0, 1, 2].map((i) => colour[i] * alpha + bg[i] * (1 - alpha)) as [number, number, number]
  return contrastRatio(fg, bg)
}

/** The lowest rung on each step – the pass a career actually reaches first at that colour. */
function firstRungOf(step: AlbumTierStep): TierId {
  const rung = TIER_LADDER.find((t) => ALBUM_TIER_STEP[t] === step)
  if (!rung) throw new Error(`no rung on the ${step} step – the ramp has a hole`)
  return rung
}

const BASE_TICKET = sheetOf({ layout: 'B' }).ticket!
const BASE_TAG = sheetOf({ layout: 'C' }).tag!

function mountPass(rung: TierId) {
  const ticket = { ...BASE_TICKET, tier: TIERS[rung].label, step: ALBUM_TIER_STEP[rung] }
  return mount(AlbumTicketPass, { props: { ticket }, attachTo: document.body })
}

function mountTag(rung: TierId) {
  const tag = { ...BASE_TAG, tier: TIERS[rung].label, step: ALBUM_TIER_STEP[rung] }
  return mount(AlbumTagCard, { props: { tag }, attachTo: document.body })
}

describe('the ticket and the tag carry their rank in their colour', () => {
  // ===============================================================================================
  // 1. TOTAL OVER THE LADDER
  // ===============================================================================================

  it('every rung the calendar can put on a pass paints one of the four steps – all sixteen', () => {
    const seen = new Set<AlbumTierStep>()
    for (const rung of TIER_LADDER) {
      const w = mountPass(rung)
      const paint = getComputedStyle(w.find('.album-pass').element).backgroundColor
      const step = ALBUM_TIER_STEP[rung]
      seen.add(step)
      expect(channels(paint), `${rung} paints its own step's ink`).toEqual(scaled(step, PASS_INK))
      w.unmount()
    }
    expect(TIER_LADDER.length, 'the whole ladder was walked').toBe(16)
    expect([...seen].sort(), 'all four steps are reachable – no dead colour in the ramp').toEqual([...STEPS].sort())
  })

  it('the step never goes DOWN as the ladder goes up – «чем выше ступень, тем насыщеннее»', () => {
    const rank = (step: AlbumTierStep) => STEPS.indexOf(step)
    for (let i = 1; i < TIER_LADDER.length; i++) {
      const below = TIER_LADDER[i - 1]
      const above = TIER_LADDER[i]
      expect(
        rank(ALBUM_TIER_STEP[above]),
        `${above} sits above ${below} on the ladder and must not sit below it on the ramp`,
      ).toBeGreaterThanOrEqual(rank(ALBUM_TIER_STEP[below]))
    }
  })

  it('the four inks are four DIFFERENT colours, on both objects', () => {
    const passes = STEPS.map((step) => {
      const w = mountPass(firstRungOf(step))
      const paint = getComputedStyle(w.find('.album-pass').element).backgroundColor
      w.unmount()
      return paint.toLowerCase()
    })
    const tags = STEPS.map((step) => {
      const w = mountTag(firstRungOf(step))
      const paint = getComputedStyle(w.find('.album-tag-card').element).backgroundColor
      w.unmount()
      return paint.toLowerCase()
    })
    expect(new Set(passes).size, `the four passes are one colour: ${passes.join(', ')}`).toBe(4)
    expect(new Set(tags).size, `the four tags are one colour: ${tags.join(', ')}`).toBe(4)
  })

  // ===============================================================================================
  // 2. DERIVED FROM HIS RAMP, NOT INVENTED BESIDE IT
  // ===============================================================================================

  it('the pass\'s ink and its deep end are the step\'s token ×0.38 and ×0.27', () => {
    for (const step of STEPS) {
      const w = mountPass(firstRungOf(step))
      const pass = w.find('.album-pass').element
      expect(channels(getComputedStyle(pass).backgroundColor), `${step}: the face is the token ×${PASS_INK}`)
        .toEqual(scaled(step, PASS_INK))
      // the deep end rides in the sheen, so it is read off the custom property rather than off a
      // computed background – happy-dom does not resolve gradient stops
      const deep = getComputedStyle(pass).getPropertyValue('--album-pass-ink-deep').trim()
      expect(channels(deep), `${step}: the sheen's deep end is the token ×${PASS_DEEP}`).toEqual(scaled(step, PASS_DEEP))
      w.unmount()
    }
  })

  it('the tag\'s paper is the step\'s token itself, and its ink the same token ×0.18', () => {
    for (const step of STEPS) {
      const w = mountTag(firstRungOf(step))
      const card = w.find('.album-tag-card').element
      expect(channels(getComputedStyle(card).backgroundColor), `${step}: the paper IS --tier-${step}`)
        .toEqual(channels(token(step)))
      expect(channels(getComputedStyle(card).color), `${step}: the ink is the token ×${TAG_INK}`)
        .toEqual(scaled(step, TAG_INK))
      w.unmount()
    }
  })

  // ===============================================================================================
  // 3. LEGIBLE AT EVERY STEP – the half a structural assertion cannot see (round-17 #3's lesson)
  // ===============================================================================================

  it('the pass is legible at all four steps – the loud line and the faded one', () => {
    for (const step of STEPS) {
      const w = mountPass(firstRungOf(step))
      const title = ratioOf(w.find('.album-pass-title').element)
      const foot = ratioOf(w.find('.album-pass-foot').element)
      const stub = ratioOf(w.find('.album-pass-stage').element)
      expect(title, `${step}: the rank and stage on the pass – ${title.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      expect(foot, `${step}: the date and gate at opacity .78 – ${foot.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      expect(stub, `${step}: the round written on the stub – ${stub.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      w.unmount()
    }
  })

  it('the tag is legible at all four steps – dark ink on a light card', () => {
    for (const step of STEPS) {
      const w = mountTag(firstRungOf(step))
      const tier = ratioOf(w.find('.album-tag-tier').element)
      const stage = ratioOf(w.find('.album-tag-stage').element)
      const place = ratioOf(w.find('.album-tag-place').element)
      expect(tier, `${step}: the rank on the tag – ${tier.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      expect(stage, `${step}: the stage line – ${stage.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      expect(place, `${step}: the tournament and her age – ${place.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      w.unmount()
    }
  })
})

// =================================================================================================
// MEASURED CONTRAST, 20.09 – read out of a run of this file, not predicted. WCAG 2.1 through the
// real cascade, ancestor opacity folded in. AA for body text is 4.5:1 and the floor is the middle
// step's faded line at 4.92 – the lime token is the lightest of the four, so the ×0.38 face is the
// one with the least room, and it is the number that decides the factor.
// =================================================================================================
//
//  step   | rung   | pass ink | title & stub | date/gate (.78) | tag paper | tag, all three lines
//  budget | local  | #364451  | 8.77         | 6.08            | #8fb2d6   | 7.43
//  middle | j30    | #4f561f  | 6.87         | 4.92            | #cfe152   | 10.37
//  high   | w15    | #563112  | 10.00        | 6.76            | #e2822f   | 6.12
//  elite  | wta125 | #3b3051  | 10.67        | 7.18            | #9b7fd4   | 5.32
//
// MUTATION LEDGER – each arm applied to the SOURCE, run, red read, restored (20.09).
//   1. `ALBUM_TIER_STEP.slam` -> 'budget'                                      → 1 RED
//      («the step never goes DOWN as the ladder goes up»). ⚠ AND THE LADDER WALK STAYS GREEN ON
//      THIS ARM, WHICH IS CORRECT AND IS WORTH KNOWING: that case reads the same table for its
//      expected ink, so it proves the COMPONENT follows the engine and never that the engine's
//      grouping is right. The ramp-order case is the one that holds the grouping, which is why it
//      exists separately.
//   2. all four `.album-pass-<step>` blocks given the elite pair                → 3 RED
//      (the ladder walk by rung name, «the four passes are one colour», the ×0.38 derivation)
//   3. the pass's `background-color` removed, the sheen left as the only paint  → 4 RED
//      (the three above, plus every legibility number – the walk up from the text then reaches the
//      album's own dark page instead of the pass, i.e. the assertion passing for the WRONG reason.
//      This is the arm that matters most: it is the shape the file shipped in before today.)
//   4. `--album-tag-ink` on the elite step -> the token itself (no ×0.18)       → 2 RED
//      (the ×0.18 derivation, and «elite: the rank on the tag – 1.00:1»)
//   5. `:class="album-tag-${tag.step}"` deleted from the tag's root             → 2 RED
//      (the four tags are one colour; the paper is no longer --tier-<step> for three of the four)
