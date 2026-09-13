// ⭐ ROUND 41 #11 – THE RECAP DOTS PULL TOGETHER, AND EVERY CARD'S PADDING RIDES ONE TOKEN.
//
// The owner, in one message covering all four halves of this item: «точки с буквами о днях
// тренировки на плашке на week recap давай чуть кучнее соберем на планшетах и десктопах, а то они
// сильно широко друг от друга, не очень читаются. И вообще на этом экране для всех плашек на
// планшете можно чуть больше паддинги сделать, а на десктоп еще чуть больше. Тогда карточки станут
// аккуратнее. По типу Training plan и This week на этом же экране, там больше паддинги как раз.
// Заодно надо их привести к одному размеру, чтобы было консистентно. И на home экране тоже
// проверить эти же паддинги на карточках на пленшетах и десктопах.» (quoted here rather than in a
// template – tests/template-copy-rules.test.ts bans Cyrillic inside one).
//
// ⚠ MUTATION-VERIFIED (recorded in the round-41 ledger and the executor's report):
//   * delete the `@media (min-width: 768px) { .recap-days { ... } }` block – the dots arm goes red,
//     the padding arms stay green.
//   * delete the `--tb-card-pad: 16px` / `18px` lines from style.css's two existing `:root` blocks
//     – every padding arm below 768's own default (14px at every width) goes red, the dots arm and
//     the phone-control arm stay green.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import '../../src/style.css'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { careerSnapshot } from '../helpers/career'
import type { Snapshot } from '../../src/shared/protocol'
import { PHONE, TABLET, DESKTOP, setViewport } from './fits'

function snapshotAt(weeks: number, seed: string): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** ⚠ SET BEFORE MOUNT, ALWAYS, AND ATTACHED, ALWAYS – happy-dom evaluates a media query on an
 *  element's first computed-style read and caches it (round36-pass2-shop-recap.test.ts's header),
 *  and `--tb-card-pad` is a `:root` custom property with no fallback comma, which a detached tree
 *  does not inherit at all (round41-wildcard-chip.test.ts's own finding, the same day). */
function mountRecapAt(vp: typeof PHONE) {
  setViewport(vp)
  useGameStore().snapshot = snapshotAt(3, 'card-pad-41')
  return mount(WeekRecapCard, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

function mountHomeAt(vp: typeof PHONE) {
  setViewport(vp)
  const store = useGameStore()
  store.snapshot = careerSnapshot(8, 'card-pad-41-home')
  return mount(HomeScreen, {
    props: { recapFresh: false },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

const WIDE_900: typeof PHONE = { width: 900, height: 1024 }

describe('round 41 #11a – the training-day dots pull together past 768', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  it('⚠ a phone keeps the shipped spread', () => {
    expect(document.head.querySelector('style'), 'no stylesheet – this would be vacuous').toBeTruthy()
    const w = mountRecapAt(PHONE)
    const cs = getComputedStyle(w.find('.recap-days').element)
    expect(cs.justifyContent).toBe('space-between')
    expect(cs.gap).toBe('4px')
    w.unmount()
  })

  it('⭐⭐ 768 and 1280 both read as one group – a fixed, tighter gap', () => {
    for (const vp of [TABLET, DESKTOP]) {
      const w = mountRecapAt(vp)
      const cs = getComputedStyle(w.find('.recap-days').element)
      expect(cs.justifyContent, `at ${vp.width}`).toBe('flex-start')
      expect(cs.gap, `at ${vp.width}`).toBe('14px')
      w.unmount()
    }
  })
})

describe('round 41 #11b/c – every recap tile rides one padding token, consistently', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  const STEP: Record<number, string> = { 375: '14px', 768: '16px', 900: '16px', 1280: '18px' }

  it.each([PHONE, TABLET, WIDE_900, DESKTOP])('⭐⭐ all four tiles read $width’s token step, and agree with each other', (vp) => {
    const w = mountRecapAt(vp)
    const tiles = w.findAll('.recap-tile')
    expect(tiles.length, 'Finances, Training, Mood, Highlights').toBe(4)
    const paddings = tiles.map((t) => getComputedStyle(t.element).padding)
    for (const p of paddings) {
      expect(p, `at ${vp.width}, one tile read '${p}'`).toBe(STEP[vp.width])
    }
    // "ONE SIZE" (c): not merely each equal to the token, but equal to EACH OTHER – the consistency
    // claim his own words make («привести к одному размеру, чтобы было консистентно»).
    expect(new Set(paddings).size, 'every tile agrees on its own padding').toBe(1)
    w.unmount()
  })

  it('⚠ .rail-dash-card keeps its own override – src/style.css still declares it verbatim', () => {
    // ⚠ NOT MOUNTED: `.rail-dash-card` is App.vue's desktop rail shortcut, which needs the whole
    // shell (the sidebar, the router) to render at all – far more machinery than this claim is
    // worth. What matters is that introducing a `:root`-level default did not delete or reorder the
    // one thing that has to keep beating it: a rule targeting the element ITSELF always outranks an
    // inherited `:root` value regardless of what that value is, so this is a text check on the
    // override surviving, not a claim this file is otherwise shy about mounting.
    const sheet = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')
    expect(sheet).toMatch(/\.rail-dash-card\s*\{\s*--tb-card-pad:\s*10px 12px;/)
  })
})

describe('round 41 #11d – the same audit, on Home', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  it('⭐ the Family budget note-card (no pad prop of its own) reads the same token steps', () => {
    for (const [vp, expected] of [
      [TABLET, '16px'],
      [DESKTOP, '18px'],
    ] as const) {
      const w = mountHomeAt(vp)
      const card = w.find('[data-tour="family-budget"]')
      expect(card.exists(), `the Family budget card is on screen at ${vp.width}`).toBe(true)
      expect(getComputedStyle(card.element).padding, `at ${vp.width}`).toBe(expected)
      w.unmount()
    }
  })

  it('⚠ .coach-card keeps its own zero override – the token reaches only the UNSET default', () => {
    // The coach note bleeds its portrait to the card's edges (`padding: 0`, HomeScreen.vue) – a
    // card asking for something of its own, same as `.rail-dash-card`, and unaffected by this item
    // by design (see the token's own note in style.css).
    const w = mountHomeAt(DESKTOP)
    const coach = w.find('.coach-card')
    expect(coach.exists()).toBe(true)
    expect(getComputedStyle(coach.element).padding).toBe('0px')
    w.unmount()
  })
})

describe('round 41 #11b – a bare <section> grows WITH the token, from its own +2 baseline', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  /** A section needs no Vue component and no snapshot – `padding` is declared on the bare tag in
   *  src/style.css, so the plainest possible DOM proves the claim. */
  function sectionPaddingAt(vp: typeof PHONE): string {
    setViewport(vp)
    const el = document.createElement('section')
    document.body.appendChild(el)
    return getComputedStyle(el).padding
  }

  it('⭐ 16 / 18 / 20 – the same steps as the card, offset by the +2 it always read', () => {
    // ⚠ happy-dom substitutes the custom property inside `calc()` but does not reduce the
    // arithmetic (the same behaviour `min(px, %)` showed in round41-calendar-note-width.test.ts) –
    // so the honest read is the resolved-but-unevaluated expression, not the folded pixel number a
    // real browser would report. It is still the right assertion: it proves the CORRECT token step
    // is reaching the calc at each width, which is the claim.
    expect(document.head.querySelector('style'), 'no stylesheet – this would be vacuous').toBeTruthy()
    expect(sectionPaddingAt(PHONE), 'unchanged from the shipped 16px base (14 + 2)').toBe('calc(14px + 2px)')
    expect(sectionPaddingAt(TABLET)).toBe('calc(16px + 2px)')
    expect(sectionPaddingAt(DESKTOP)).toBe('calc(18px + 2px)')
  })
})
