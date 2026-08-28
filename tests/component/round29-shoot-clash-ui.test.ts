// =================================================================================================
// ⭐⭐ ROUND 29 #3, THE UI HALF – THE WEEK ASKS, ON SCREEN, AND EVERY ANSWER IS REACHABLE ON A PHONE
// =================================================================================================
//
// The owner ruled the shoot/tournament collision a DECISION and named the arms himself – «И варианты
// пользователю предложить» (docs/rounds/round-29.md #3, where his words may be quoted in his own
// language). The engine half is `tests/round29-shoot-clash.test.ts`; this file is about what the
// parent actually sees, and neither claim below can be made by a source pin:
//
//   1. THE CARD IS UP ON THE REAL SHELL, over the week controls, with one button per answer, and a
//      press routes to the engine command that answer names.
//   2. AND THE WAY OUT IS ON THE SCREEN. Round-20 #3 is house law (CLAUDE.md: "any dialog you add or
//      lengthen gets a mounted assertion that its dismiss control's box is inside a 375x667
//      viewport") and it bites hardest here: this card has FOUR two-line answers, which is the
//      tallest blocking dialog in the app, and it is a dialog with no dismiss – so a control past
//      the fold would not merely be awkward, it would strand the career on a refused week.
//      Mutated, so a green run cannot be the cascade merely existing.
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30_000 })
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
// ⚠ THE REAL STYLESHEET, or every measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'

vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import ShootClashDialog from '../../src/components/ShootClashDialog.vue'
import { useGameStore } from '../../src/stores/game'
import {
  answerShootClash,
  createWorld,
  shootMoveTarget,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { adOfferId } from '../../src/engine/offers'
import { ECONOMY } from '../../src/engine/economy'
import { PLAN_DAYS } from '../../src/engine/plan'
import { DEFAULT_PROFILE, type ShootClashChoice } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHELL'S WATERMARKS ARE localStorage. Same shim as
// r2-13-span-report / round26-span-gate-ui – supply the browser's object, do not weaken the app.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

const AD = ECONOMY.advertising
const CLASH = 216
const AT = CLASH - 1

/** The collision, built the way the engine file builds it – a signed campaign naming `CLASH` and an
 *  entry she holds for the same week, with the world standing the week before. */
function clashWorld(seed: string, opts: { shootWeeks?: number[]; termWeeks?: number } = {}): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  world.week = AT
  world.fundsCents = 500_000_00
  const event: SeasonEvent = {
    id: `${seed}-event`,
    week: CLASH,
    tier: 'local',
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: AT - 2,
  }
  world.season = [event]
  world.entries = [event.id]
  const termWeeks = opts.termWeeks ?? AD.termWeeks
  world.offers.push({
    id: adOfferId(AT - 10),
    kind: 'ad',
    week: AT - 10,
    deadlineWeek: AT - 7,
    state: 'signed',
    decidedWeek: AT - 10,
    fromWeek: AT - 10,
    untilWeek: AT - 10 + termWeeks - 1,
    terms: { brand: AD.brand, cashCents: AD.cashCents, termWeeks, shootCount: 2, shootWeeks: opts.shootWeeks ?? [CLASH] },
  })
  return world
}

async function openShell(world: WorldState, vp = PHONE) {
  // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time, so a viewport set
  // after the mount measures the previous screen.
  setViewport(vp)
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  game.snapshot = toSnapshot(world)
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

/** The store is the ONLY thing stubbed, and it is stubbed onto the REAL engine – the worker is not
 *  available here, so the command runs in-process and republishes the snapshot, which is exactly
 *  what `sim.worker.ts`'s handler does. */
function wireAnswer(game: ReturnType<typeof useGameStore>, world: WorldState) {
  return vi.spyOn(game, 'answerShootClash').mockImplementation(async (choice: ShootClashChoice) => {
    answerShootClash(world, choice)
    game.snapshot = toSnapshot(world)
  })
}

const verbs = (w: { findAll: (s: string) => { text: () => string }[] }) =>
  w.findAll('.shoot-clash-dialog .knock-choice-verb').map((b) => b.text())

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
})

// =================================================================================================
// 1 – THE WEEK ASKS, ON THE REAL SHELL
// =================================================================================================
describe('round 29 #3 – the collision raises a card the parent has to answer', () => {
  it('⭐⭐ the card is up, over the week controls, with one button per answer', async () => {
    const { w } = await openShell(clashWorld('r29-3-ui-up'))
    expect(w.findComponent(ShootClashDialog).exists(), 'the week did not ask').toBe(true)
    const card = w.find('.shoot-clash-dialog')
    expect(card.exists()).toBe(true)
    expect(card.text(), 'the card does not name whose campaign it is').toContain(AD.brand)
    // FOUR answers – his three arms with the second one split, because «cancel or move» behind one
    // button would ask him to choose twice.
    expect(w.findAll('.shoot-clash-dialog .knock-choice').length).toBe(4)
    w.unmount()
  })

  it('⚠ house law: no Cyrillic in the card, and the short dash only', async () => {
    const { w } = await openShell(clashWorld('r29-3-ui-copy'))
    const text = w.find('.shoot-clash-dialog').text()
    expect(text).not.toMatch(/[Ѐ-ӿ]/)
    expect(text).not.toContain('—')
    w.unmount()
  })

  it('⚠ every figure on the card is the ENGINE\'s, not the template\'s', async () => {
    const world = clashWorld('r29-3-ui-numbers')
    const { w, game } = await openShell(world)
    const text = w.find('.shoot-clash-dialog').text()
    expect(game.snapshot?.shootClash, 'the prompt is missing – the card is drawing from nothing').toBeTruthy()
    // The condition price, spelled on the card, rebuilt from the catalogue rather than read back.
    expect(text).toContain(String(AD.clashConditionPerDay * PLAN_DAYS))
    // ...and the cancellation's share of the fee, formatted from CENTS.
    expect(text).toContain('$10,000')
    w.unmount()
  })

  it('⚠ the MOVE arm is absent when the term has no week left to move to (R10-16)', async () => {
    // A term that ends the week after the collision: `shootMoveTarget` is null, so the option is not
    // drawn at all rather than drawn and refused.
    const world = clashWorld('r29-3-ui-nomove', { termWeeks: CLASH - (AT - 10) + 1 })
    expect(shootMoveTarget(world, CLASH), 'the fixture still has room, so this proves nothing').toBeNull()
    const { w } = await openShell(world)
    expect(w.findAll('.shoot-clash-dialog .knock-choice').length, 'three answers, not four').toBe(3)
    expect(verbs(w).join(' '), 'a move was offered with nowhere to move to').not.toContain('Move')
    w.unmount()
  })
})

// =================================================================================================
// 2 – EACH BUTTON ROUTES TO ITS OWN ANSWER, THROUGH THE REAL CLICK PATH
// =================================================================================================
describe('round 29 #3 – the four buttons are four different answers', () => {
  const cases: { label: string; index: number; choice: ShootClashChoice }[] = [
    { label: 'pull out of the tournament', index: 0, choice: 'withdraw' },
    { label: 'move the shoot', index: 1, choice: 'move-shoot' },
    { label: 'cancel the shoot', index: 2, choice: 'cancel-shoot' },
    { label: 'do both', index: 3, choice: 'play-both' },
  ]

  for (const c of cases) {
    it(`⭐ "${c.label}" sends '${c.choice}' and the card closes`, async () => {
      const world = clashWorld(`r29-3-ui-${c.choice}`)
      const { w, game } = await openShell(world)
      const answer = wireAnswer(game, world)
      await w.findAll('.shoot-clash-dialog .knock-choice')[c.index].trigger('click')
      await flushPromises()
      expect(answer, 'the button routed to the wrong answer').toHaveBeenCalledWith(c.choice)
      // ⚠ AND THE CAREER IS UNBLOCKED: the question is gone from the snapshot, so the shell's own
      // gate lets the week be spent again. A card that stayed up would strand it.
      expect(game.snapshot?.shootClash, 'the collision survived its own answer').toBeNull()
      expect(w.findComponent(ShootClashDialog).exists()).toBe(false)
      w.unmount()
    })
  }
})

// =================================================================================================
// 3 – ROUND-20 #3: THE ANSWERS ARE ON THE SCREEN
// =================================================================================================
describe('round 29 #3 – four answers still fit a phone', () => {
  function attached(vp = PHONE) {
    const world = clashWorld('r29-3-ui-fits')
    setViewport(vp)
    const game = useGameStore()
    vi.spyOn(game, 'init').mockResolvedValue(undefined)
    game.$patch({ ready: true, phase: 'ready' })
    game.snapshot = toSnapshot(world)
    const w = mount(ShootClashDialog, { attachTo: document.body })
    const card = document.querySelector('.shoot-clash-dialog')!
    const dismiss = document.querySelector('.shoot-clash-dialog .knock-choices')!
    expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
    // ⚠ THE WAY OUT IS THE LAST ANSWER, and `measureDialog` reads the dismiss box off the card's own
    // bottom edge, so the block it measures has to be the last thing in the flow.
    expect(dismiss.lastElementChild?.textContent).toContain('Do both')
    return { w, card, dismiss }
  }

  it('keeps all four answers inside a 375x667 screen', () => {
    const { w, card, dismiss } = attached()
    const fit = assertDismissReachable(card, dismiss, PHONE, 'ShootClashDialog (four answers)')
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = attached(NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ShootClashDialog (narrow)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on this card and the SAME assertion goes red', () => {
    const { w, card, dismiss } = attached()
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    const after = measureDialog(card, dismiss, PHONE)
    expect(after.cap, 'the cap survived the mutation, so the check below is vacuous').toBe(Infinity)
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ShootClashDialog (cap removed)')).toThrow()
    w.unmount()
  })
})
