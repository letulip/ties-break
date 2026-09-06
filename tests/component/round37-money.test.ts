// ⭐⭐⭐ ROUND 37, THE MONEY SCREEN'S THIRD PASS, MOUNTED.
//
// His words are in docs/rounds/round-37.md and quoted in full in the rules they became – a template
// carries no Cyrillic, comments included (tests/template-copy-rules.test.ts), so the quotes live in
// `MoneyScreen.vue`'s script and style blocks and the paraphrases are here.
//
//   #9  «Her own account» is noisy in the shop; it is drawn on the Spending chapter alone now.
//
// ⚠ WHAT IS NOT IN THIS FILE, AND WHERE IT IS INSTEAD. Round 35 #3's «на каждой странице магазина»
// arm is the one this item reverses, and it is re-aimed in place in `round35-shop.test.ts` rather
// than re-asserted here – a new file claiming the absence while the old one still claims the
// presence is two tests disagreeing, which is worse than either.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read, and `attachTo: document.body` is mandatory:
// happy-dom evaluates a media query on the FIRST computed-style read and caches it, and applies no
// rule at all to a detached tree. Both are recorded beside `TABLET` in fits.ts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING, and the same arithmetic `round36-review.test.ts` writes out: the plate
// only exists once her prize-share ramp is running, which is five seasons of real engine, and
// GitHub's 2-core runner is measured at 4-5x this machine on this suite. The walk is hoisted out of
// every case (`grown` below), so what is left inside one is a mount.
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
import { DESKTOP, PHONE, setViewport } from './fits'
import { openShelfTab } from './shelf'

/** A real career, walked by the real engine – `shop-tab.test.ts`'s recipe, shared by every mounted
 *  file that reaches this screen. */
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

/** Rich enough that no rung of the shelf is greyed for money alone – item 9 has to press into the
 *  shop, and a shop with nothing on it would answer a question nobody asked. */
function rich(seed: string, weeks: number): WorldState {
  const w = walk(seed, weeks)
  w.bestFinishByTier.wta250 = 3
  w.fundsCents = 60_000_000_00
  return w
}

/**
 * ⚠ THE RAMP HAS TO BE RUNNING for the plate to be on the screen at all – her eighteenth – so the
 * fixture is WALKED to it rather than faked, which is `round35-shop.test.ts`'s own recipe for this
 * exact strip.
 *
 * ⚠⚠ AND IT IS WALKED ONCE, OUTSIDE THE CASES. Five seasons of real ticks is seconds of engine;
 * paid inside a case it passes alone and times out in a full suite run under contention, which is a
 * red that is neither a defect nor a flake. The snapshot is read-only data, so one career serves
 * every viewport and every chapter.
 */
let grownSnap: Snapshot | null = null
function grown(): Snapshot {
  if (!grownSnap) {
    grownSnap = toSnapshot(rich('r37-9-account', 52 * 5))
    expect(grownSnap.ageYears, 'the fixture is past the threshold birthday').toBeGreaterThanOrEqual(18)
  }
  return grownSnap
}

async function mountMoney(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(MoneyScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

/** Press one of the four chapter buttons and leave it open. Addressed by the word on the control,
 *  which is what a player presses – never by a `v-if` reached from the inside. */
async function openChapter(wrapper: Awaited<ReturnType<typeof mountMoney>>, label: string) {
  const pill = wrapper.findAll('.money-tabs button.tab-pill').find((n) => n.text().trim() === label)
  expect(pill, `the ${label} chapter button`).toBeTruthy()
  await pill!.trigger('click')
}

// =================================================================================================
// 9. «HER OWN ACCOUNT» BELONGS TO SPENDING ALONE
// =================================================================================================
// The plate has been outside every `screenTab` guard since round 26 #5b wrote it – it was on all
// four chapters, on the shop home and on every shelf page, at every width (measured in Chromium
// before the change: present and visible on all five). The owner asked for it on Spending only.
//
// ⚠ THIS HIDES NO FIGURE. The balance sentence is the engine's own (`kidLife.ownAccountNote`) and
// `KidScreen.vue` prints the identical string on her own page; the week's short telling of the same
// split is on WeekRecapCard's Finances tile. What the plate alone says – the DIRECTION of the split –
// stays on Spending, so nothing became unreachable. That census is the reason this item was built
// rather than queried, and it is asserted below rather than only claimed.
//
// MUTATION-VERIFIED: the `&& screenTab === 'spend'` guard removed -> the three «no other chapter»
// arms; the guard widened to `!== 'shop'` -> the Bills and History arms alone.
describe('round 37 #9 – the account plate is the Spending chapter’s alone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  it('⭐ on Spending it is exactly what it always was – the frame, the photograph, both sentences', async () => {
    setViewport(PHONE)
    const wrapper = await mountMoney(grown())
    const plate = wrapper.find('.money-share')
    expect(plate.exists(), 'the chapter the screen opens on still draws it').toBe(true)
    expect(plate.attributes('role'), 'round 26 #5b’s own role').toBe('note')
    expect(plate.find('.money-share-photo').exists(), 'round 35 #3’s photograph').toBe(true)
    // ⚠ NOT ONE WORD OF THE COPY IS THIS ITEM'S TO MOVE (CLAUDE.md invariant 4). The two sentences
    // are asserted here so a «hide it on three chapters» change that also edited a clause cannot
    // pass as this item.
    expect(plate.text()).toContain('Every prize cheque is split before it reaches this account')
    expect(plate.text()).toContain('her part goes to her, the family banks the rest')
    wrapper.unmount()
  })

  it('⭐⭐ and on no other chapter – Bills, History, the shop’s home and a shelf inside it', async () => {
    setViewport(PHONE)
    const wrapper = await mountMoney(grown())
    expect(wrapper.find('.money-share').exists(), 'Spending, or this measures nothing').toBe(true)

    for (const chapter of ['Bills', 'History', 'Shop']) {
      await openChapter(wrapper, chapter)
      expect(wrapper.find('.money-share').exists(), `the plate is still drawn on ${chapter}`).toBe(false)
    }
    // ⚠ ONE LEVEL DEEPER, because round 35 #3's «а также на каждой странице магазина» was satisfied
    // by the strip sitting outside every guard, and it is that half the owner has now taken back.
    // A category page is where he was standing when he called it noise.
    await openShelfTab(wrapper, 'Cars')
    expect(wrapper.find('.money-share').exists(), 'the plate is still drawn on a shelf page').toBe(false)

    // ⚠ AND IT IS A GUARD, NOT A DELETION – pressing back into Spending brings it whole.
    await openChapter(wrapper, 'Spending')
    const back = wrapper.find('.money-share')
    expect(back.exists(), 'the plate comes back with the chapter').toBe(true)
    expect(back.find('.money-share-photo').exists(), 'photograph and all').toBe(true)
    wrapper.unmount()
  })

  it('⚠ the guard is the CHAPTER and never the width – 375 and 1280 answer identically', async () => {
    // ⚠⚠ THIS IS `e2e/parity.spec.ts`'s QUESTION ASKED IN A MOUNTED TEST, and it is the reason item
    // 9 is safe to build: that harness fails BY NAME when a surface loses something at some widths
    // and not at others. A chapter guard subtracts the same node at every width, so the four
    // fingerprints stay equal – but the claim is worth holding here too, cheaply, because a media
    // query is the obvious wrong way to build this item and it would pass every arm above.
    for (const vp of [PHONE, DESKTOP]) {
      setViewport(vp)
      document.body.innerHTML = ''
      const wrapper = await mountMoney(grown())
      expect(wrapper.find('.money-share').exists(), `Spending at ${vp.width}`).toBe(true)
      await openChapter(wrapper, 'Shop')
      expect(wrapper.find('.money-share').exists(), `the shop at ${vp.width}`).toBe(false)
      wrapper.unmount()
    }
  })
})
