// ROUND 46 #10 – THE FULL-BLEED PRE-MATCH CARD MUST BE EXACTLY AS WIDE AS THE COLUMN IT BLEEDS INTO.
//
// Owner, 05.10: «На экране между матчами с большой картинкой немного съехала вёрстка в ширину и есть
// горизонтальный скрол, надо проверить и починить».
//
// THE SCREEN is TournamentFlow's `pre` phase – "Match Day", the MatchScene card with `fill`, shown
// between the rounds of a tournament. Its picture bleeds to the screen edge with negative side
// margins that have to cancel `.tf-body`'s gutter, and the two numbers had drifted apart: R17 #8 moved
// the gutter from 24px to `--app-pad-x` (16px) and `.tf-scene` kept quoting `-24px`.
//
// MEASURED IN CHROMIUM on a production build, 320 / 360 / 375 / 390 / 430 alike (the probe was the
// round's scratch; the numbers are in docs/rounds/round-46.md #10):
//   * `.tf-scene`, its `img` and its scrim were 16px wider than the screen – left -8, right +8;
//   * `.tf-body` is the takeover's own scroller (`overflow-y: hidden`, which makes its `overflow-x`
//     compute to `auto`) and scrolled the 8px sideways: scrollWidth = clientWidth + 8;
//   * the glass plate and the round pill sat 4px from the edge where MatchScene gives them 12;
//   * ⚠ `documentElement.scrollWidth` equalled the viewport throughout – the takeover is
//     `position: fixed`, so a page-level "no horizontal scroll" check was green over the bug.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT (fits.ts's own header), so nothing here measures a rectangle. What it can
// read is the CASCADE, and the defect is two declared numbers that must cancel – so the claim is
// split along the pair, one arm per half:
//   1. MOUNTED: the card's margin is the gutter's own TOKEN on both sides, at four widths. A literal
//      that happens to be right today is the exact thing that drifted.
//   2. THE SHEET: the scroller it bleeds out of pads its sides by that same token.
//
// ⚠⚠ WHY ARM 2 READS THE SHEET AND NOT `getComputedStyle(body).paddingLeft` – MEASURED, 05.10, and it
// is a false-green trap rather than a limitation. The gutter is declared as the LOGICAL
// `padding-inline: var(--app-pad-x)` over a shared physical shorthand `padding: 8px 24px 24px`.
// Chromium applies the override (16px); happy-dom does not, and computes 24px. A mounted
// "margin + padding closes to 0" arm therefore came out RED on the fixed card (-16 + 24) and would
// have been GREEN on the broken one (-24 + 24) – it asserted the bug and refused the fix. So the
// scroller's half is read from the sheet, and the browser's own rectangles (the e2e layer, and the
// probe quoted in the ledger) are what close the pair end to end.
//
// MUTATION-VERIFIED, each applied alone (the red messages are quoted in the ledger entry):
//   * `.tf-scene.tf-scene { margin: 0 -24px }` put back -> arm 1, at all four widths;
//   * `.tf-body`'s `padding-inline` back to a literal 24px in src/style.css -> arm 2.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

import '../../src/style.css'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, decideKnock, enterEvent, pendingKnock, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { DESKTOP, NARROW_PHONE, PHONE, TABLET, setViewport, type Viewport } from './fits'

/** A REAL CAREER TICKED TO A REAL TOURNAMENT, so `snapshot.pending` is the engine's own object and
 *  the screen under test is the one a player reaches. The same recipe `round17-surfaces.test.ts`
 *  uses (it is local to that file): enter the first event the career is eligible for and tick until
 *  the reveal opens. */
function tournamentSnapshot(seed = 'r46-prematch-bleed'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const snap = toSnapshot(world)
    if (snap.pending) return snap
    for (const e of snap.upcoming) {
      if (e.eligible && !e.entered && e.week > world.week) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* affordability and caps are the engine's business; take whichever it allows */
        }
      }
    }
    tickWeek(world, rng)
  }
  throw new Error('no tournament reached in 60 weeks – the fixture, not the assertion, is broken')
}

const WIDTHS: ReadonlyArray<readonly [string, Viewport]> = [
  ['phone 375', PHONE],
  ['narrow phone 320', NARROW_PHONE],
  ['tablet 768', TABLET],
  ['desktop 1280', DESKTOP],
]

describe('round 46 #10 – the pre-match card is exactly as wide as the column it bleeds into', () => {
  let snap: Snapshot
  let wrapper: VueWrapper | null = null

  beforeAll(() => {
    snap = tournamentSnapshot()
  })
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    setViewport(PHONE)
  })

  /** Splash -> pre, through the brief's own CTA, and hand back the card.
   *  ⚠ THE VIEWPORT IS SET BEFORE THE MOUNT: happy-dom caches a media query on an element's first
   *  computed-style read, so a width set afterwards measures the previous screen (fits.ts, TABLET). */
  async function preMatchCard(vp: Viewport): Promise<Element> {
    setViewport(vp)
    useGameStore().snapshot = snap
    wrapper = mount(TournamentFlow, { attachTo: document.body })
    const begin = wrapper.findAll('button').find((b) => b.text().trim() === 'Begin')
    expect(begin, 'the splash offers Begin').toBeTruthy()
    await begin!.trigger('click')
    await nextTick()
    const scene = wrapper.find('.tf-scene')
    expect(scene.exists(), 'the pre-match card is the screen').toBe(true)
    return scene.element
  }

  it.each(WIDTHS)('arm 1 – at %s the card cancels the gutter TOKEN on both sides, never a number', async (_label, vp) => {
    const scene = await preMatchCard(vp)
    // ⚠ THE TOKEN IS READ OFF `:root`, NEVER TYPED HERE AS A NUMBER (round30-next-tournament-layout's
    // rule, and for its reason): a pin that hard-codes 16px is green on exactly the class of bug
    // this is – a literal that was right once. happy-dom substitutes the variable and leaves the
    // arithmetic alone, so the expected form is `calc(-1 * 16px)`.
    const padX = getComputedStyle(document.documentElement).getPropertyValue('--app-pad-x').trim()
    expect(padX, 'the app still declares its gutter as a token').toBe('16px')
    const cs = getComputedStyle(scene)
    expect(cs.marginLeft, 'the picture cancels the gutter on the left').toBe(`calc(-1 * ${padX})`)
    expect(cs.marginRight, 'the picture cancels the gutter on the right').toBe(`calc(-1 * ${padX})`)
  })

  it('arm 2 – and the scroller it bleeds out of pads its sides by that same token (read from the sheet)', () => {
    const sheet = readFileSync(resolve(__dirname, '../../src/style.css'), 'utf8')
    // A BOUNDED match: `[^}]*` cannot run past the rule's own closing brace, so an absent
    // declaration FAILS CLOSED instead of widening into the rest of the file (the `indexOf` ->
    // `slice(start, -1)` trap CLAUDE.md names). It is anchored to a rule that starts a line with
    // `.tf-body {`, so the shared `.onboarding-body, .tf-body` shorthand (24px) is not the match.
    const gutter = /\n\.tf-body\s*\{[^}]*\bpadding-inline:\s*var\(--app-pad-x\)\s*;[^}]*\}/
    expect(gutter.test(sheet), "`.tf-body` pads its sides by `--app-pad-x` – the token `.tf-scene` cancels").toBe(true)
  })
})
