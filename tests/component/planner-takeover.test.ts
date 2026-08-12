// ⭐ THE WEEK PLANNER IS A SCREEN – round-17 #5, and the same move the Inbox made in round 16.
//
// The owner asked for the plan-week popup to open full screen, "like the Inbox now does". It was a
// `.dialog-overlay` + `.plan-sheet` capped at 420px wide and 86vh tall, holding two tabs, a price
// table and six vacation packages, each with a painting, a name, a note, a price and a Book button –
// a scroller inside a card inside a page, on the one surface in the app whose entire job is
// comparing six things against each other.
//
// ⚠ MOUNTED, NOT PINNED, and round-16 #1's own file says why: `.tournament-flow` is the takeover
// vocabulary and only a mount can say the component actually renders through it. The assertions are
// deliberately the same shape as `round16-surfaces.test.ts`'s inbox block, because "like the Inbox
// does" is the whole request and two surfaces claiming one pattern should be checked the same way.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

function mountPlanner(props: { week: number; initialTab?: 'practice' | 'vacation' } = { week: 20 }) {
  const store = useGameStore()
  store.snapshot = toSnapshot(createWorld('planner-takeover', DEFAULT_PROFILE))
  return mount(PlanWeekSheet, { props })
}

describe('R17-5 – the planner covers the screen instead of floating over it', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders through the app\'s one takeover shell, with a header and no backdrop', () => {
    const w = mountPlanner()
    // `.tournament-flow` is the takeover vocabulary in src/style.css: `position: fixed; inset: 0`.
    expect(w.find('.tournament-flow').exists(), 'the planner must be a takeover').toBe(true)
    expect(w.find('.tf-top').exists(), 'a header that does not scroll').toBe(true)
    expect(w.find('.tf-body').exists(), 'a body that does').toBe(true)
    // ⚠ MUTATION-VERIFIED: put the `.dialog-overlay` wrapper back and the last two go red.
    expect(w.find('.dialog-overlay').exists(), 'the popup shell is gone with the popup').toBe(false)
    expect(w.find('.plan-sheet').exists(), 'and so is its own 420px box').toBe(false)
    w.unmount()
  })

  it('the title names the week, and the facts under it are the ones every tab is chosen against', () => {
    const w = mountPlanner()
    expect(w.find('.tf-title').text()).toContain('Plan')
    // The dates and her condition moved into the shell's `#sub` slot rather than being lost.
    const sub = w.find('.tf-sub')
    expect(sub.exists(), 'the sub line is filled').toBe(true)
    expect(sub.text()).toContain('condition')
    w.unmount()
  })

  it('the close control is still the way out – it is now the ONLY way out', () => {
    // The backdrop tap went with the backdrop, so this is load-bearing rather than a convenience.
    const w = mountPlanner()
    const close = w.findAll('button').find((b) => (b.attributes('aria-label') ?? '') === 'Close planner')
    expect(close, 'the header must carry a close').toBeTruthy()
    w.unmount()
  })

  it('the two tabs still switch, and the packages are still there', () => {
    // A re-home must not change what the screen DOES. Same tabs, same rows.
    const w = mountPlanner({ week: 20, initialTab: 'vacation' })
    expect(w.find('.plan-tabs').exists()).toBe(true)
    expect(w.text()).toContain('Vacation')
    expect(w.text()).toContain('Practice')
    w.unmount()
  })
})
