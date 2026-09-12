// =================================================================================================
// WAVE 3, T15 – THE HOME CARD THAT IS ONLY AN INVITATION, AND THE DIALOG IT OPENS
// =================================================================================================
//
// `docs/specs/who-she-is-2026-09.md` §5b's «SOFT BLOCK CONCRETIZED (11.09)» amendment, point 1:
// «The surface is a Home-hub card, and the card is only the INVITATION – she has come by with
// something. Tapping it opens the SAME `LifeBeatDialog` on the same prompt contract; modal only
// because the player chose to listen. No new dialog exists anywhere.»
//
// MOUNTED, because that sentence is a claim about what is on screen and what happens to a tap. The
// engine half – the window, the pending set, the answer's target – is
// `tests/wave3-soft-surface.test.ts`'s.
//
// ⚠ THE FIXTURE IS A REAL WORLD THROUGH THE REAL PROTOCOL (`careerSnapshot` + the engine's own
// writer), so nothing here is a hand-written shape that can drift from `Snapshot`.
//
// ⚠ NO WORDING IS ASSERTED (CLAUDE.md invariant 4): the card's line is a DRAFT for the owner, so
// what is pinned is that the card prints the ENGINE's line and no sentence of its own.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER
// =================================================================================================
//
//   ARM 15  the card's `v-if` inverted – `v-if="!softBeat"` in `HomeScreen.vue`, so the invitation is
//           drawn on every week EXCEPT the ones she came on.
//           **3 RED** · «⭐⭐ the card is up exactly when the engine says she is waiting: a live soft
//           row puts the invitation on the hub: expected null not to be null», «⭐ ...and it is gone
//           on an ordinary week: expected [Object HTMLButtonElement] to be null» (the absent-card
//           case reading a card that should not be there), and the tap case, which has no card to
//           press.
//
//   ARM 16  the card's line replaced by a sentence of the component's own (`She came by.` written
//           into the template instead of `{{ softBeat.card }}`).
//           **1 RED** · «⚠⚠ THE CARD PRINTS THE ENGINE'S LINE AND NOTHING OF ITS OWN: expected
//           'She came by.' to be 'She came by with something small.'» – the pin that keeps her voice
//           in the pools, which is invariant 4's own loophole closed.
//
//   ARM 17  `.soft-beat-card` given `min-width: 900px`, a card wider than any phone.
//           **1 RED** · «⚠ the tap target fits the phone: the card demands 900px of a 347px row».
//           ⚠ RECORDED BECAUSE THE MEASUREMENT IS THE ONE THAT CAN GO VACUOUS: happy-dom has no
//           layout engine, so a width read off `getBoundingClientRect` would be 0 and «it fits» would
//           be free. The box is COMPUTED from the real cascade (`tests/component/fits.ts`), and this
//           arm is the proof that the computation can say no.
//
//   ARM 18  `LifeBeatDialog`'s `soft` prop ignored – `prompt` hard-wired back to
//           `snapshot.lifeBeatPrompt`, i.e. the dialog opening on the blocking field only.
//           **2 RED** · «⭐⭐⭐ the tap opens the SAME dialog, on the soft prompt: expected null not to
//           be null» (nothing rendered at all) and the radio-group case.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { buildSoftBeatInvite, createWorld, raiseLifeBeat, toSnapshot } from '../../src/engine/world'
import { bondBandOf } from '../../src/engine/spirit'
import type { Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'
import { PHONE, availableWidth, demandedWidth, setViewport } from './fits'

/** The lowest `bond` that reads as `close` – asked of the ladder, never transcribed. */
function closeBond(): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === 'close') return b
  throw new Error('no bond value reads as close')
}

/** A real career with ONE live soft row in it, as the snapshot the app renders.
 *  ⚠ `raiseLifeBeat` is the ENGINE's own single writer and `buildSoftBeatInvite` the engine's own
 *  reader, so the fixture is a state the sim produces rather than a shape this file invented. */
function snapshotWithCard(seed = 'soft-card'): Snapshot {
  const world = createWorld(seed)
  world.week = 200
  world.bond = closeBond()
  raiseLifeBeat(world, 'small-talk', 'question')
  expect(buildSoftBeatInvite(world), 'the fixture really has a card to show').not.toBeNull()
  return toSnapshot(world)
}

/** ...and the same career on an ordinary week, which is every other week of every career. */
const snapshotWithout = (): Snapshot => careerSnapshot(6, 'soft-card-quiet')

function mountHome(snapshot: Snapshot) {
  setViewport(PHONE)
  useGameStore().snapshot = snapshot
  return mount(HomeScreen, {
    props: { recapFresh: false },
    // ⚠ ATTACHED, so the cascade this reads is the player's and `document.querySelector` can see it –
    // `mount()` alone renders DETACHED and every document-level read comes back null.
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

describe('wave 3 T15 – the soft beat\'s card on Home', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ the card is up exactly when the engine says she is waiting', () => {
    const snapshot = snapshotWithCard()
    const w = mountHome(snapshot)
    const card = w.find('.soft-beat-card')
    expect(card.exists(), 'a live soft row puts the invitation on the hub').toBe(true)
    // ...it is a DOOR, which is what makes it tappable at all – the element says so.
    expect(card.element.tagName, 'the card is a button, so it is reachable by keyboard too').toBe('BUTTON')
    w.unmount()

    // ⚠⚠ THE NEGATIVE ASSERTION PROVES ITS TARGET EXISTS FIRST – the case above is that proof, and
    // this half is only honest beside it.
    const quiet = mountHome(snapshotWithout())
    expect(quiet.find('.soft-beat-card').exists(), '⭐ ...and it is gone on an ordinary week').toBe(false)
    quiet.unmount()
  })

  it('⚠⚠ THE CARD PRINTS THE ENGINE\'S LINE AND NOTHING OF ITS OWN', () => {
    // Invariant 4's loophole closed the way `LifeBeatDialog` closes it: the surface renders what it
    // is handed. ⚠ `wrapper.text()` TRIMS, so the comparison is against the trimmed engine line –
    // a claim about whitespace would be a claim about the template's indentation.
    const snapshot = snapshotWithCard()
    const w = mountHome(snapshot)
    expect(w.find('.soft-beat-card').text()).toBe(snapshot.softBeat!.card.trim())
    // ...and the card does NOT preview the conversation: her line and the parent's frame are behind
    // the tap, which is what makes this an invitation rather than the beat itself.
    const text = w.find('.soft-beat-card').text()
    expect(text, 'the card is not her line').not.toContain(snapshot.softBeat!.prompt.said)
    expect(text, 'nor the parent\'s frame').not.toContain(snapshot.softBeat!.prompt.heading)
    w.unmount()
  })

  it('⚠ the tap target fits the phone – 375, measured through the real cascade', () => {
    const w = mountHome(snapshotWithCard())
    const card = w.find('.soft-beat-card').element
    // ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE (`getBoundingClientRect` is all zeros), so the box is COMPUTED
    // from the real cascade exactly as every other width verdict in this directory is.
    const room = availableWidth(card, PHONE)
    expect(room, 'the row really has room to measure against').toBeGreaterThan(0)
    const wants = demandedWidth(card, room)
    expect(wants, `the card demands ${wants.toFixed(0)}px of a ${room.toFixed(0)}px row`).toBeLessThanOrEqual(room)
    w.unmount()
  })

  it('⭐⭐⭐ the tap opens the SAME dialog, on the soft prompt – no new component anywhere', async () => {
    // ⚠⚠ VUE 3 BINDS `@click` THROUGH `addEventListener`, so `attributes('onclick')` is ALWAYS
    // undefined and a test written against it asserts nothing. The event is TRIGGERED and the emit
    // read off the wrapper, which is the seam Home actually owns: the shell opens the overlay.
    const snapshot = snapshotWithCard()
    const w = mountHome(snapshot)
    await w.find('.soft-beat-card').trigger('click')
    expect(w.emitted('softBeat'), 'the card asks the shell to open it').toHaveLength(1)
    w.unmount()

    // ...and what the shell then mounts is `LifeBeatDialog` itself, with `soft` – the same component
    // App.vue mounts for a blocking beat, on the same prompt contract.
    const dialog = mount(LifeBeatDialog, { props: { soft: true }, attachTo: document.body })
    await nextTick()
    const card = document.querySelector('.life-beat-dialog')
    expect(card, 'the dialog is up, and it is the life-beat dialog').not.toBeNull()
    expect(card!.getAttribute('role'), 'a modal, because the player chose to listen').toBe('dialog')
    expect(card!.getAttribute('aria-modal')).toBe('true')
    // The engine's words, verbatim – the heading, her line, and her parent's three replies.
    expect(dialog.find('.season-summary-title').text()).toBe(snapshot.softBeat!.prompt.heading)
    expect(dialog.find('.life-beat-said').text()).toBe(snapshot.softBeat!.prompt.said)
    const choices = dialog.findAll('button.life-beat-choice')
    expect(choices.map((c) => c.text())).toEqual(snapshot.softBeat!.prompt.options.map((o) => o.label))
    expect(dialog.find('[role="radiogroup"]').exists(), 'round 40\'s selecting idiom, unchanged').toBe(true)
    dialog.unmount()
  })

  it('⚠ and the same dialog WITHOUT `soft` is not opened by a soft row – the prop is the only switch', () => {
    // The control for the case above: the blocking mount reads `lifeBeatPrompt`, which is null here,
    // so nothing renders. Without this, «the soft mount renders» would not be a statement about the
    // prop at all.
    useGameStore().snapshot = snapshotWithCard()
    const blocking = mount(LifeBeatDialog, { attachTo: document.body })
    expect(blocking.find('.life-beat-dialog').exists(), 'no week was stopped, so no card is forced up').toBe(false)
    blocking.unmount()
  })
})
