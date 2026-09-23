// WAVE 12 / T7.3 – THE DIVORCE CARD ON A PHONE, MOUNTED, WITH THE ENGINE'S OWN WORDS.
//
// `docs/plans/life-wave-12-builder-2026-09.md` §T7.3, and CLAUDE.md's round-20 #3 law: «any dialog
// you add or lengthen gets a mounted assertion that its dismiss control's box is inside a 375x667
// viewport, and prove it by mutating».
//
// ⚠⚠ WHAT THIS FILE ADDS THAT `life-beat-dialog.test.ts` DOES NOT ALREADY HAVE. That file pins the
// COMPONENT – any prompt, including a deliberately over-long fixture – and its claim is about the
// card. This one pins THIS WAVE'S COPY: the prompt is built by the ENGINE from a posed world, so
// what is measured is the four DRAFT labels, the real heading and her real line at the real widths.
// A fixture string here would have made the measurement a measurement of the fixture.
//
// ⚠⚠ AND THE MUTATION ARM IS **NOT** «LENGTHEN THE COPY», WHICH IS WAVE 11's FINDING INHERITED
// RATHER THAN RE-DISCOVERED. A capped, scrolling `.dialog-card` structurally CANNOT strand a
// control on content height – that is what the cap is for – so an arm that triples the lead comes
// in at 0 RED and proves nothing. The arm that bites is stripping the cap, and it is measured at
// the foot of this file.

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import { useGameStore } from '../../src/stores/game'
import {
  buildLifeBeatPrompt,
  createWorld,
  kidAgeExact,
  raiseLifeBeat,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type LoveEpisode, type Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, NARROW_PHONE, PHONE, setViewport } from './fits'
// ⚠ REQUIRED, and its absence throws inside `fits.ts` rather than producing a wrong number: the
// measurement resolves real lengths through the real cascade.
import '../../src/style.css'

/** A married career whose marriage has just ended, with the card raised the way `rollEnds` raises
 *  it. ⚠ THE PROMPT IS THE ENGINE'S – `buildLifeBeatPrompt` assembles the heading, her line and the
 *  four priced answers from the pools, so the card under measurement carries the wave's own DRAFT
 *  strings and not a fixture's. */
function divorcedWorld(bond: number): WorldState {
  const world = createWorld('w12-ui', DEFAULT_PROFILE)
  world.season = []
  let adult = 0
  while (kidAgeExact(adult, world.profile.birthMonth, world.profile.birthDay) < ECONOMY.wedding.ageGate) adult++
  const row: LoveEpisode = {
    id: 'p:1', sinceWeek: adult - 60, endedWeek: adult, knownWeek: adult - 58, wants: 'open',
    partnerId: 'p:1', publicWeek: null, publicWrong: false, airedMetWeek: null,
    airedEndedWeek: null, latchedWeek: adult - 20, partnerName: 'Mateo',
  }
  world.week = adult
  world.loveEpisodes = [row]
  world.bond = bond
  raiseLifeBeat(world, 'divorced', row.id)
  return world
}

function mountAttached(bond: number, vp = PHONE) {
  setViewport(vp)
  const world = divorcedWorld(bond)
  const prompt = buildLifeBeatPrompt(world)
  expect(prompt, 'the engine really raised the card – nothing below is vacuous').toBeTruthy()
  expect(prompt!.kind, '...and it is the divorce’s own').toBe('divorced')
  useGameStore().snapshot = { ...toSnapshot(world), lifeBeatPrompt: prompt } as Snapshot
  const w = mount(LifeBeatDialog, { attachTo: document.body })
  const card = document.querySelector('.life-beat-dialog')!
  expect(card, 'the card is on the screen').toBeTruthy()
  return { w, card, prompt: prompt! }
}

/** The card's last control, which on this dialog is the last answer. ⚠ Asserted to BE the last
 *  element of the card, `life-beat-dialog.test.ts`'s own guard: a control appended after the answers
 *  would make every number here quietly wrong while the assertion stayed green. */
function lastControl(card: Element): Element {
  const choices = card.querySelector('.life-beat-choices')!
  expect(choices, 'the answers are on the card').toBeTruthy()
  expect(card.lastElementChild, 'the answers are the card’s last element').toBe(choices)
  return choices.lastElementChild!
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

describe('wave 12 T7.3 – the divorce card fits a phone', () => {
  it('⭐⭐⭐ her own voice: the last of the four answers is inside 375x667, and the card scrolls', () => {
    const { w, card, prompt } = mountAttached(80)
    expect(prompt.options, 'the four the spec drafted').toHaveLength(4)
    const fit = assertDismissReachable(card, lastControl(card), PHONE, 'the divorce card (her voice)')
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('⭐⭐ the DRY rung too – a different card, and the shorter one', () => {
    // ⚠ BOTH RUNGS ARE MEASURED because they are different cards: `speaksInHerOwnVoice` picks her
    // line at `close`/`steady` and the dry sentence below it, and a fit measured on one says nothing
    // about the other.
    const { w, card } = mountAttached(20)
    assertDismissReachable(card, lastControl(card), PHONE, 'the divorce card (the dry rung)')
    w.unmount()
  })

  it('⭐⭐ and on the narrowest screen the app supports', () => {
    const { w, card } = mountAttached(80, NARROW_PHONE)
    assertDismissReachable(card, lastControl(card), NARROW_PHONE, 'the divorce card (320x568)')
    w.unmount()
  })

  it('⭐⭐⭐ the screen prints the engine’s words and none of its own', () => {
    // ⚠ THE ONE CLAIM ABOUT COPY THIS FILE MAY MAKE (invariant 4): not that the strings are right –
    // they are DRAFTS and the owner's to rule – but that the card renders EXACTLY what the engine
    // handed over. A sentence of the component's own would show up here.
    const { w, card, prompt } = mountAttached(80)
    const text = card.textContent!.replace(/\s+/g, ' ')
    expect(text).toContain(prompt.heading)
    expect(text).toContain(prompt.said)
    for (const o of prompt.options) expect(text, `the answer "${o.id}" is on the screen`).toContain(o.label)
    // ⚠ AND NO PRICE, NO NUMBER AND NO METER anywhere on it – the layer's standing fence, and the
    // four bond deltas this card carries are exactly what it forbids showing.
    for (const o of prompt.options) {
      expect(text.includes(`${o.bond}`), `the card prints the bond delta for "${o.id}"`).toBe(false)
    }
    w.unmount()
  })
})

// =================================================================================================
// THE MUTATION ARM – measured, not predicted
// =================================================================================================
//
// Scope: this file (4 cases) plus tests/component/life-beat-dialog.test.ts, control GREEN first,
// each arm applied by a scripted string edit and undone by the inverse.
//
// Scope: 2 files / 66 cases, control GREEN before the first arm and GREEN AGAIN after the last
// revert (both read from their own log).
//
//   ARM 1  `DIVORCED_DRY` tripled – the lead three times over          0 RED   ⚠⚠ **PREDICTED AND
//                                                                              CONFIRMED, not a gap.**
//                                                                              A capped, scrolling
//                                                                              `.dialog-card`
//                                                                              structurally cannot
//                                                                              strand a control on
//                                                                              content height – that
//                                                                              is what the cap IS –
//                                                                              so this arm has
//                                                                              nothing to redden and
//                                                                              an assertion that
//                                                                              failed on it would be
//                                                                              asserting the wrong
//                                                                              thing. Wave 11 found
//                                                                              this the hard way;
//                                                                              here it is run to
//                                                                              confirm the shape
//                                                                              rather than to
//                                                                              discover it.
//   ARM 2  `.dialog-card`'s `max-height: 100%` stripped in            36 RED   over BOTH files – this
//          src/style.css                                                       file's three fit cases
//                                                                              and every fit case
//                                                                              life-beat-dialog owns.
//                                                                              ⭐ THIS is the arm the
//                                                                              round-20 law is
//                                                                              actually about, and
//                                                                              the pair 1/2 says
//                                                                              exactly what the
//                                                                              phone assertion
//                                                                              protects: not the
//                                                                              length of the copy,
//                                                                              the boundedness of the
//                                                                              card.
//                                                                              ⚠ The revert's first
//                                                                              pattern was not
//                                                                              unique (`overflow-y:
//                                                                              auto` appears five
//                                                                              times in that file)
//                                                                              and left the tree
//                                                                              armed; it was restored
//                                                                              with its own context
//                                                                              and the control re-run
//                                                                              green.
