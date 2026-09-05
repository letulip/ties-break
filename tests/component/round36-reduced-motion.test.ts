// ⚠⚠ U-05 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – THE ONE ANIMATION THAT
// NEVER STOPS, AND THE ONE PREDICATE THAT DECIDES WHETHER ANYTHING MOVES.
//
// The app's reduced-motion policy was complete except at its front door: `.splash-hint` pulses
// `1.8s ease-in-out infinite` and had no reduce rule, so the FIRST thing a player who has asked
// their system for less motion saw was the only element on screen that moves for ever. The trophy
// flight refuses to arm, the day-cross sweep refuses to schedule, the pager scrolls rather than
// glides, every component that animates carries its own reduce block – and the splash had neither
// half of it.
//
// The second half of the item is that «has this player asked for less motion» was written FIVE times
// in five spellings (`dayCross.ts`, `trophyArrival.ts`, `weekPager.ts`, `ui/ConfettiBurst.vue`,
// `MoneyScreen.vue`; the review found three and the census here found the other two). One module
// owns it now.
//
// ⚠⚠ HAPPY-DOM CAN ANSWER THIS QUESTION AND THE REVIEW THOUGHT IT COULD NOT. Its device settings
// carry `prefersReducedMotion`, `matchMedia` reads them, and – because the component project sets
// `css: true` – so does the real cascade: with the switch on, `.cm-switch`'s transition computes to
// `none`. So the CSS half is a MOUNTED assertion here rather than the source pin the report
// expected, and the control below proves the harness is not simply answering `none` to everything.
//
// ⚠ A MEDIA QUERY IS EVALUATED ON AN ELEMENT'S FIRST COMPUTED-STYLE READ AND THEN CACHED (measured
// on happy-dom 04.09, recorded in tests/component/fits.ts). So the order is always: set the
// preference, THEN mount, THEN read. A preference set after the read measures the previous world.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: with the `.splash-hint` reduce rule
// removed the pulse case goes red naming the animation it still runs; with `prefersReducedMotion`
// forced to `false` the three script cases go red. The log is in the wave's scratch as `u05-red.log`.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import SplashScreen from '../../src/components/SplashScreen.vue'
import { prefersReducedMotion } from '../../src/composables/reducedMotion'
import { dayCrossRuns } from '../../src/composables/dayCross'
import { armTrophyFlight } from '../../src/composables/trophyArrival'

interface DeviceWindow {
  happyDOM: { settings: { device: { prefersReducedMotion: string } } }
}

/** ⚠ SET IT BEFORE ANYTHING IS MOUNTED OR READ – see the header. */
function setReducedMotion(on: boolean): void {
  const w = window as unknown as DeviceWindow
  if (!w.happyDOM?.settings?.device) {
    throw new Error('happy-dom exposes no device settings – this measurement cannot be trusted')
  }
  w.happyDOM.settings.device.prefersReducedMotion = on ? 'reduce' : 'no-preference'
}

/** The hint as the splash really renders it, read through the real cascade. */
function hintAnimation(): string {
  const wrapper = mount(SplashScreen, { attachTo: document.body })
  const hint = document.querySelector('.splash-hint')
  expect(hint, 'the splash draws no hint at all – this assertion would be vacuous').toBeTruthy()
  const animation = getComputedStyle(hint!).animation
  wrapper.unmount()
  return animation
}

describe('⚠⚠ U-05 – the splash pulse stands down when the system asks it to', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setReducedMotion(false))

  it('with no preference the hint pulses, exactly as it shipped', () => {
    setReducedMotion(false)
    expect(hintAnimation(), 'the splash lost its pulse for everybody').toContain('splash-pulse')
  })

  it('⚠⚠ ...and under `prefers-reduced-motion: reduce` it does not move at all', () => {
    setReducedMotion(true)
    const animation = hintAnimation()
    expect(animation, 'the one animation in the app that never ends is still running').not.toContain(
      'splash-pulse',
    )
    expect(animation, 'and it is switched off rather than left to a shorthand nobody set').toContain('none')
  })

  it('⚠ THE CONTROL – the harness is not answering `none` to every animation it is asked about', () => {
    // Without this the case above passes on a happy-dom that simply cannot compute an animation, and
    // on a stylesheet that failed to load. `.cm-switch` carries the app's OTHER reduce rule and is
    // untouched by this wave, so it is the honest control at both settings.
    setReducedMotion(false)
    const loud = document.createElement('span')
    loud.className = 'cm-switch'
    document.body.appendChild(loud)
    expect(getComputedStyle(loud).transition, 'the stylesheet is not being read at all').not.toBe('none')

    setReducedMotion(true)
    const quiet = document.createElement('span')
    quiet.className = 'cm-switch'
    document.body.appendChild(quiet)
    expect(getComputedStyle(quiet).transition, 'the preference is reaching no rule at all').toBe('none')
  })
})

describe('⭐ U-05 – one predicate, and every caller reads it', () => {
  afterEach(() => setReducedMotion(false))

  it('the predicate answers the system, both ways', () => {
    setReducedMotion(false)
    expect(prefersReducedMotion()).toBe(false)
    setReducedMotion(true)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('⚠ and the two callers that REFUSE TO MOVE follow it', () => {
    setReducedMotion(false)
    expect(dayCrossRuns(true), 'the sweep is off for everybody').toBe(true)

    setReducedMotion(true)
    expect(dayCrossRuns(true), 'the days still cross themselves out').toBe(false)
    // The trophy flight is armed with a real element and a real destination missing; what is asserted
    // is the reduced-motion arm alone, which refuses before it measures anything.
    const from = document.createElement('div')
    document.body.appendChild(from)
    expect(armTrophyFlight('trophy.webp', from), 'the trophy still flies').toBe(false)
  })

  it('⚠ nothing in `src/` asks the system this question for itself any more', () => {
    // The one-way ratchet: a sixth copy of the query in script is what this catches, and it is the
    // shape the five copies arrived in. The CSS half is deliberately NOT matched – `@media
    // (prefers-reduced-motion: reduce)` is the policy's other half and lives in eight places by
    // design – so the pattern is the JS call, which CSS never contains.
    const root = resolve(process.cwd(), 'src')
    const offenders: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) {
          walk(path)
        } else if (/\.(ts|vue)$/.test(entry.name)) {
          const src = readFileSync(path, 'utf8')
          if (/matchMedia[^\n]*prefers-reduced-motion/.test(src)) offenders.push(path)
        }
      }
    }
    walk(root)
    const shared = offenders.filter((p) => p.endsWith(join('composables', 'reducedMotion.ts')))
    expect(shared.length, 'the shared predicate is gone, so this scan is vacuous').toBe(1)
    expect(
      offenders.filter((p) => !p.endsWith(join('composables', 'reducedMotion.ts'))),
      'a second copy of the reduced-motion query',
    ).toEqual([])
  })
})
