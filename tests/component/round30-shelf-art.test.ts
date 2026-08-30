// ⭐⭐ ROUND 30 #5 – «Для каждой карточки будет свой арт», AND THE HALF OF IT THAT SHIPS TODAY.
//
// He is drawing the paintings. `src/art/shelf.ts` is the contract that lets the layout arrive first,
// and it is `vacationArtUrl`'s, word for word and for the reason it was written: «the package
// catalogue may grow before the art does», so a key with no painting returns NULL and the caller
// must not render a 404.
//
// THE CONTRACT HAS TWO BRANCHES AND BOTH ARE TESTED, IN TWO FILES, BECAUSE THAT IS WHERE THE HONEST
// EVIDENCE IS:
//   * NO PAINTING (what ships today) – `round30-subtabs.test.ts`'s last arm, against the REAL,
//     empty map: no band, no `<img>`, and the row keeps every word and every control.
//   * A PAINTING – this file, which substitutes a url for `shelfArtUrl` so the other branch is more
//     than a promise. Mocking is the only way to reach it while the map is empty, and a branch that
//     cannot be reached is a branch nobody has ever seen work.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'

// ⚠ THE REAL MODULE IS KEPT AND ONLY ITS ONE FUNCTION IS SUBSTITUTED – `BILLS_ART_KEYS` is the two
// spellings the screen calls with, and inventing them here would let the screen and the test agree
// on a key nothing else uses.
vi.mock('../../src/art/shelf', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/art/shelf')>()
  return { ...actual, shelfArtUrl: (key: string) => `/painted/${key}.webp` }
})

import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  toSnapshot,
  skipTournament,
  closeTournament,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { openBillsTab, openShelfTab } from './shelf'

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
  world.bestFinishByTier.wta250 = 3
  return world
}

async function openChapter(snapshot: Snapshot, chapter: 'Bills' | 'Shop') {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === chapter)
  expect(tab, `the ${chapter} chapter control`).toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

const grown = () => toSnapshot(walk('r30-shelf-art', 20))

beforeEach(() => setActivePinia(createPinia()))

describe('round 30 #5 – a card that HAS a painting wears it', () => {
  it('⭐⭐ every rung on the open segment draws its own band, keyed by its own id', async () => {
    const snap = grown()
    const wrapper = await openChapter(snap, 'Shop')
    await openShelfTab(wrapper, 'Cars')
    const rows = wrapper.findAll('.shop-row')
    expect(rows.length, 'the segment really has rungs').toBeGreaterThan(1)
    for (const row of rows) {
      const band = row.find('.card-art')
      expect(band.exists(), 'the card has its band').toBe(true)
      // ⚠ KEYED BY THE ROW'S OWN ID, not by its position and not by one shared picture: the id is
      // what `shelfArtUrl`'s map will be filled with, so a screen that handed it the family or the
      // index would put one painting on four cars and this is the arm that catches it.
      const id = snap.shop.rows.find((r) => row.text().includes(r.label))!.id
      expect(band.find('img').attributes('src')).toBe(`/painted/${id}.webp`)
      expect(band.find('img').attributes('alt'), 'decorative, so the name is not read twice').toBe('')
    }
    // ...and the words are still under it: a picture is added to the card, never instead of it.
    expect(rows[0].find('.shop-row-name').text().length).toBeGreaterThan(0)
    expect(rows[0].find('.shop-action').exists()).toBe(true)
  })

  it('⭐ the two Bills cards wear theirs too, on their own two keys', async () => {
    const wrapper = await openChapter(grown(), 'Bills')
    await openBillsTab(wrapper, 'Her Kit')
    const kit = wrapper.find('.money-kit .card-art img')
    expect(kit.exists(), 'her kit has a band').toBe(true)
    expect(kit.attributes('src')).toBe('/painted/her-kit.webp')
    // ⚠ AND IT IS A DIFFERENT KEY FROM THE SHOP'S – the two chapters share one map and one
    // namespace, so the check that matters is that neither card borrows the other's picture.
    expect(kit.attributes('src')).not.toBe('/painted/advs-portfolio.webp')
  })
})
