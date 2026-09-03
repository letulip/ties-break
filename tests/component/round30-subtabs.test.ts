// ⭐⭐ ROUND 30 #5 – SUB-TABS INSIDE BILLS AND INSIDE SHOP.
//
// The owner: «Внутри Bills и Shop сделать дополнительные вкладки как на экране Spending (12 weeks /
// So far) для каждой категории. Для Bills будет Her Kit / Advs Portfolio. Для Shop будет отдельно
// сверху плашкой The shelf, а ниже под ней вкладки в ряд Invest / Cars / Property / Business
// (Academy is subdivision inside) / Water / Air. Для каждой карточки будет свой арт, карточки лежат
// без общей подложки, примерно как на экране Season».
//
// ⚠⚠ THE TAB NAMES ARE HIS, SPELLED AS HE SPELLED THEM, and this file pins them – `Advs Portfolio`
// with no apostrophe and no expansion, `Invest` rather than `Investments`, `Water` and `Air` rather
// than the family headings they sit over. CLAUDE.md invariant 4 was written this round because an
// agent renamed a tab it was not asked to rename; the same file therefore also pins that the family
// headings INSIDE the shelf still read exactly as they shipped.
//
// ⚠ MOUNTED AGAINST A REAL SNAPSHOT, engine-built – round20-ui's house rule.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
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
import { ECONOMY } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { BILLS_TAB_LABELS, SHELF_TAB_LABELS, openBillsTab, openShelfTab } from './shelf'

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

/** The professional door, opened the way the engine opens it – `shop-tab.test.ts`'s own recipe. */
function professional(world: WorldState): WorldState {
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

const grown = () => toSnapshot(professional(walk('r30-subtabs', 20)))

/** An ADULT career, so the advertising shelf is not empty. The week is set the way
 *  `round29p4-ad-portfolio-panel.test.ts` sets it – past the engine's own age gate on the engine's
 *  own clock, with the snapshot still `toSnapshot`'s rather than a hand-built shape. */
function adult(): Snapshot {
  const world = professional(walk('r30-subtabs-adult', 20))
  world.week = 320
  const snap = toSnapshot(world)
  expect(snap.ageYears, 'the fixture is past the advertising gate').toBeGreaterThanOrEqual(
    ECONOMY.advertising.fromAgeYears,
  )
  expect(snap.adPortfolio.length, 'so the portfolio really has rows').toBeGreaterThan(0)
  return snap
}

beforeEach(() => setActivePinia(createPinia()))

// =================================================================================================
describe('round 30 #5 – Bills gets his two segments', () => {
  it('⭐ the row exists, it is the Spending switcher\'s object, and the two names are his', async () => {
    const wrapper = await openChapter(grown(), 'Bills')
    const row = wrapper.find('.money-subtabs')
    expect(row.exists(), 'a second row of tabs inside the chapter').toBe(true)
    // ⚠ THE SAME CONTROL HE NAMED AS THE MODEL: `SegmentedRow` wearing the plate, which is what the
    // Spending chapter's 12-weeks switcher wears – not the chapter picker's `chapter` appearance.
    expect(row.classes(), 'the Spending switcher\'s own class, not a new object').toContain('money-window')
    expect(row.classes()).not.toContain('as-chapter')
    expect(row.attributes('role')).toBe('group')
    expect(row.findAll('.tab-pill').map((p) => p.text())).toEqual([...BILLS_TAB_LABELS])
  })

  it('⭐ each segment shows its own card and hides the other', async () => {
    const wrapper = await openChapter(adult(), 'Bills')
    await openBillsTab(wrapper, 'Her Kit')
    expect(wrapper.find('.money-kit').exists(), 'her kit is behind Her Kit').toBe(true)
    expect(wrapper.find('.money-ads').exists(), 'and the portfolio is not').toBe(false)

    await openBillsTab(wrapper, 'Advs Portfolio')
    expect(wrapper.find('.money-ads').exists(), 'the portfolio is behind Advs Portfolio').toBe(true)
    expect(wrapper.find('.money-kit').exists(), 'and her kit is not').toBe(false)
  })

  it('⚠ the levers and the academy stay OUTSIDE the switcher, on both segments', async () => {
    // He named two categories; the physio retainer and the academy's scholarship are neither, and
    // filing them under one of his two names would be a classification he did not make. They are
    // therefore on the chapter whichever segment is open – the argument is at `BILLS_TAB_OPTIONS`.
    const wrapper = await openChapter(grown(), 'Bills')
    for (const segment of BILLS_TAB_LABELS) {
      await openBillsTab(wrapper, segment)
      expect(wrapper.find('.physio-toggle').exists(), `the levers survive ${segment}`).toBe(true)
      expect(wrapper.text(), `the starting budget line survives ${segment}`).toContain(
        'Started this career with',
      )
    }
  })

  it('⭐ an empty portfolio names the age it opens at, and the age is the ENGINE\'s', async () => {
    // A junior has no shelf at all (`toSnapshot` gates it on the same constant), and before this
    // item that meant one missing card among four. A whole empty tab has to say something.
    const snap = toSnapshot(walk('r30-subtabs-junior', 10))
    expect(snap.ageYears, 'the fixture really is under the gate').toBeLessThan(
      ECONOMY.advertising.fromAgeYears,
    )
    expect(snap.adPortfolio, 'the engine hands an empty shelf').toEqual([])
    const wrapper = await openChapter(snap, 'Bills')
    await openBillsTab(wrapper, 'Advs Portfolio')
    const note = wrapper.find('.money-subtab-empty')
    expect(note.exists(), 'the tab is not a hole').toBe(true)
    // ⚠ THE FIGURE IS READ OUT OF `ECONOMY`, NEVER TYPED HERE EITHER – a hand-copied 18 compared
    // with a hand-copied 18 is one of the dead guards this round has already caught twice.
    expect(note.text()).toContain(String(ECONOMY.advertising.fromAgeYears))
    // ...and it really is the empty arm: no card behind it.
    expect(wrapper.find('.money-ads').exists()).toBe(false)
  })
})

// =================================================================================================
describe('round 30 #5 – the shelf gets his six, with the academy inside Business', () => {
  it('⭐ «сверху плашкой The shelf, а ниже под ней вкладки в ряд»', async () => {
    // ⚠⚠ RE-AIMED AT ROUND 35 #3, NEVER DELETED AND NEVER LOOSENED. Round 30 #5 asked for «the
    // shelf as a plate on top, and under it the tabs in a row», and that is still the shape of the
    // shop – but round 35 put a HOME in front of the categories («главная магазина становится
    // главной с текущей the shelf, выбором категорий из 6 карточек»), so the thing directly under
    // the plate is now the six category cards and the tabs are one press further in. BOTH halves
    // are asserted, in the same document-order form, so «под ней» is still a position and still
    // measured: the plate is above its picker on the home, and his six segments in his six words
    // and his order are still what a category page carries.
    const wrapper = await openChapter(grown(), 'Shop')
    const plate = wrapper.find('.money-shop')
    expect(plate.exists(), 'the plate is still there').toBe(true)
    expect(plate.text(), 'and it is still the shelf').toContain('The shelf')
    const cats = wrapper.find('.shelf-cats')
    expect(cats.exists(), 'and the six category cards are under it').toBe(true)
    expect(
      plate.element.compareDocumentPosition(cats.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    // ...and on a category page the row of tabs is exactly what it was.
    await openShelfTab(wrapper, 'Invest')
    const tabs = wrapper.find('.shelf-tabs')
    expect(tabs.exists(), 'the tabs are on the page they switch').toBe(true)
    // HIS SIX, HIS SPELLINGS, HIS ORDER.
    expect(tabs.findAll('.tab-pill').map((p) => p.text())).toEqual([...SHELF_TAB_LABELS])
  })

  it('⚠⚠ «Academy is subdivision inside» Business – it is not a seventh segment', async () => {
    const wrapper = await openChapter(grown(), 'Shop')
    // No tab is named for it...
    expect(SHELF_TAB_LABELS as readonly string[]).not.toContain('Academy')
    // ...and its stages are reached through Business, under their own unchanged heading, BELOW the
    // brand that shares the tab with them.
    await openShelfTab(wrapper, 'Business')
    const heads = wrapper.findAll('.shop-family-head').map((h) => h.text())
    expect(heads, 'both families, in shelf order').toEqual(['The business', 'Her academy'])
    expect(wrapper.text()).toContain('The land')
    // ⚠ AND THE ACADEMY IS ON NO OTHER SEGMENT, which is the half that makes "inside" a real claim.
    for (const other of SHELF_TAB_LABELS.filter((t) => t !== 'Business')) {
      await openShelfTab(wrapper, other)
      expect(
        wrapper.findAll('.shop-family-head').map((h) => h.text()),
        `the academy is not on ${other}`,
      ).not.toContain('Her academy')
    }
  })

  it('⭐ the six segments PARTITION the catalogue – every rung on exactly one', async () => {
    const snap = grown()
    const wrapper = await openChapter(snap, 'Shop')
    const seen: string[] = []
    for (const tab of SHELF_TAB_LABELS) {
      await openShelfTab(wrapper, tab)
      seen.push(...wrapper.findAll('.shop-row-name').map((n) => n.text()))
    }
    // Nothing lost: §2's window rule survives the split.
    expect(seen).toHaveLength(snap.shop.rows.length)
    // Nothing shown twice: a family mapped onto two tabs would double a rung and its controls.
    expect(new Set(seen).size).toBe(seen.length)
    expect([...seen].sort()).toEqual(snap.shop.rows.map((r) => r.label).sort())
  })

  it('⚠ the family headings inside are UNCHANGED – the tabs were renamed, the copy was not', async () => {
    // CLAUDE.md invariant 4. His tab names are `Invest` / `Water` / `Air`; the headings under them
    // still read what they always read, and a heading tidied to match its tab is exactly the unasked
    // rename this round's item 4 was about.
    const wrapper = await openChapter(grown(), 'Shop')
    const expected: Record<string, string> = {
      Invest: 'Investments',
      Cars: 'Cars',
      Property: 'Property',
      Water: 'On the water',
      Air: 'In the air',
    }
    for (const [tab, heading] of Object.entries(expected)) {
      await openShelfTab(wrapper, tab)
      expect(wrapper.findAll('.shop-family-head').map((h) => h.text()), tab).toContain(heading)
    }
  })
})

// =================================================================================================
describe('round 30 #5 – «карточки лежат без общей подложки, примерно как на экране Season»', () => {
  it('⭐⭐ every rung is its own card, laid on the page, not inside the shelf plate', async () => {
    const wrapper = await openChapter(grown(), 'Shop')
    await openShelfTab(wrapper, 'Cars')
    const rows = wrapper.findAll('.shop-row')
    expect(rows.length, 'the Cars segment has rungs').toBeGreaterThan(1)
    for (const row of rows) {
      // A CARD, the ui kit's own object – the Season feed's `variant="photo"`, so a painting can
      // bleed into it the moment his art lands.
      expect(row.classes(), 'each rung is a Card').toContain('tb-card')
      expect(row.classes()).toContain('tb-card--photo')
      // ...and NOT inside the shelf plate, which is what "no shared backing" means.
      expect(row.element.closest('.money-shop'), 'no plate behind the cards').toBeNull()
    }
    // The feed is the Season screen's arrangement: a gap-separated column, nothing behind it.
    const feed = wrapper.find('.shelf-feed')
    expect(feed.exists()).toBe(true)
    expect(feed.classes()).not.toContain('tb-card')
    expect(feed.element.closest('.tb-card'), 'and nothing behind the feed either').toBeNull()
  })

  it('⚠ artless still costs the row nothing', async () => {
    // `shelfArtUrl` returns null for a key we have no painting for, and a card with no picture is a
    // designed state rather than a hole: same words, same price, same control, one band shorter.
    // The other branch – a card that HAS a painting – is tests/component/round30-shelf-art.test.ts.
    //
    // ⚠⚠ RE-AIMED AT ROUND 35 #1, NEVER DELETED, AND THE CLAIM IS UNTOUCHED. This arm was pointed at
    // CARS because on 30.08 nothing on the shelf had a frame yet; his twenty-four paintings landed
    // on 03.09 and the cars are the family he drew first, so aimed there it would now be asserting
    // that his art is missing. The artless branch is INVEST, which he did not paint – two rungs,
    // both of them still a full card – and pointing it there is what keeps «a missing picture must
    // never cost the row» a live guard instead of a dead one.
    const wrapper = await openChapter(grown(), 'Shop')
    await openShelfTab(wrapper, 'Invest')
    expect(wrapper.findAll('.card-art'), 'no band, and no broken box either').toHaveLength(0)
    expect(wrapper.findAll('.shop-row img'), 'and nothing is pointing at a missing file').toHaveLength(0)
    const first = wrapper.findAll('.shop-row')[0]
    expect(first.find('.shop-row-name').text().length).toBeGreaterThan(0)
    expect(first.find('.shop-action').exists(), 'the control is still there').toBe(true)
    // ⭐ AND THE OTHER HALF OF THE RE-AIM, HELD HERE SO THE MOVE CANNOT HIDE A REGRESSION: the
    // family this arm used to watch really does have its paintings now.
    await openShelfTab(wrapper, 'Cars')
    expect(wrapper.findAll('.shop-row .card-art'), 'four cars, four frames').toHaveLength(4)
  })
})
