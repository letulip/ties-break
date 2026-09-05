// ⭐⭐⭐ ROUND 36, SECOND PASS FROM THE STAND – P2-1 AND P2-5, MOUNTED.
//
// P2-1 for now – a comment that leaked onto every page of the shop. P2-5, the week story's
// photograph, shares this file and lands in the commit after this one. His words are in
// docs/rounds/round-36-review.md; the quotes live here rather than in a template, because
// tests/template-copy-rules.test.ts bans Cyrillic inside a `<template>`.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// A runner-sized ceiling, for round36-review.test.ts's own reason: these cases mount real screens
// over careers walked by the real engine, and GitHub's 2-core runner is measured at 4-5x this
// machine on this suite. The walks are hoisted out of the cases, so what is left inside one is a
// mount; 30s is far above that and can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { shelfText } from './shelf'

/** A real career, walked by the real engine – `shop-tab.test.ts`'s recipe, shared by every file
 *  that reaches the shelf. */
function walk(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** Rich enough that no rung is greyed for money alone, so every family draws its full shelf. */
function rich(seed: string, weeks = 20): WorldState {
  const w = walk(seed, weeks)
  w.bestFinishByTier.wta250 = 3
  w.fundsCents = 60_000_000_00
  return w
}

/** The hoisted career. Walking the engine is the expensive half and no case mutates it. */
const SHOP_SNAPSHOT: Snapshot = toSnapshot(rich('r36p2-shop'))

// =================================================================================================
// 1. P2-1 – NO SHOP PAGE DRAWS THE TAIL OF A COMMENT UNDER ITS FAMILY HEADING
// =================================================================================================
// «артефакты в верстке всех страниц магазина» – he opened Money -> Shop -> Water on the stand and
// found a paragraph of English prose under «On the water», beside the first card, ending in a
// literal comment terminator. The cause was an HTML comment in MoneyScreen.vue that quoted a
// terminator inside itself: HTML comments do not nest, so the inner one closed it two and a half
// lines early and what followed became a TEXT NODE inside the `v-for` over families – on every
// family, on every page.
//
// ⚠ THIS ARM IS THE BEHAVIOURAL HALF AND `tests/template-comment-terminators.test.ts` IS THE
// STRUCTURAL ONE. That file parses every component and forbids the SHAPE, so no future comment can
// do this again; this one mounts the real screen and reads what the player reads, which is the
// claim he actually made. Neither replaces the other: a parser arm cannot say «the shop is clean»,
// and a mounted arm on one screen cannot say «no component does this».
describe('P2-1 – the shop draws no leaked comment on any of its pages', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ every shop family reads clean – no terminator, and not one word of the note', async () => {
    useGameStore().snapshot = SHOP_SNAPSHOT
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
    const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
    expect(tab, 'the Shop chapter').toBeTruthy()
    await tab!.trigger('click')

    // Walks all six families and concatenates what each page says – the helper seven mounted files
    // already reach the shelf through.
    const text = await shelfText(wrapper)

    // ⚠ A GUARD THAT READ NOTHING WOULD PASS EVERYTHING. The shelf has to actually be open and
    // drawing families before the two assertions below mean anything.
    expect(wrapper.findAll('.shop-family-head').length, 'families really are on screen').toBeGreaterThan(0)
    expect(text.length, 'and the six pages really did say something').toBeGreaterThan(2000)

    // The literal he photographed, and the words that were in the leaked paragraph. The second is
    // the sharper of the two: a reworded comment that still contains this sentence has been moved
    // rather than fixed.
    expect(text, 'the comment terminator he photographed').not.toContain('-->')
    expect(text, 'the leaked note about `coach-voice.test.ts`').not.toContain('before it scans')
    wrapper.unmount()
  })
})
