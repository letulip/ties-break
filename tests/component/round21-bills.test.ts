// ROUND 21 ITEM 10 - THE BILLS COUNTER COUNTS DOWN.
//
// The owner, 14.08: «В разделе bills возле выбранной позиции и "# good weeks" написать "(3 left)" -
// сколько осталось». The kit rungs printed what a rung BUYS from new ("24 good weeks") and nothing
// about the set actually in her bag, so a fourteen-week-old string job read exactly like a fresh one
// and the number never moved from the week it was bought to the week it wore out.
//
// ⚠ WHY THIS IS MOUNTED RATHER THAN AN ENGINE ASSERTION. It is a SURFACING defect, the same family as
// the sponsor quota one file over: the wear model always knew how old the line was, and the screen
// printed a catalogue constant beside it. An engine test cannot fail on that. CLAUDE.md: "Prefer a
// mounted test to a source pin."
//
// ⚠ AND IT IS MUTATION-VERIFIED. Rendering `rung.goodWeeks` inside the "(N left)" span instead of
// `view.goodWeeksLeft` - the exact revert that would put the old bug back with the new words on top -
// turns the strict-decrease claim below red. So does deleting the span.
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { acceptOffer } from '../../src/engine/world'
import { raiseKitOffers, sponsorWindowOpensAt } from '../../src/engine/offers'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type KitOfferTerms, type Snapshot } from '../../src/shared/protocol'
import '../../src/style.css'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

/** ⚠ THE TAB HAS TO BE PRESSED AND AWAITED - the Bills blocks sit behind a `v-if` on the screen's own
 *  tab state, so nothing about kit is in the document until the segment is clicked. */
async function mountBills(snap: Snapshot) {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
  expect(bills, 'the Bills tab control').toBeTruthy()
  await bills!.trigger('click')
  expect(wrapper.text(), 'the Bills tab is really the one showing').toContain('Her kit')
  return wrapper
}

/** The three kit lines as the page renders them: the chosen rung's whole button text, and the text
 *  of the rungs she has NOT chosen. */
async function rungText(snap: Snapshot): Promise<{ owned: string[]; others: string[] }> {
  const wrapper = await mountBills(snap)
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim()
  const owned = wrapper.findAll('.kit-rung.owned').map((b) => clean(b.text()))
  const others = wrapper.findAll('.kit-rung:not(.owned)').map((b) => clean(b.text()))
  wrapper.unmount()
  return { owned, others }
}

/** A plain career with no sponsor, at a week far enough in that her kit has real age on it. Nothing
 *  is hand-built: the wear clock is the world's own. */
function agedCareer(week: number): WorldState {
  const world = createWorld('round21-bills', DEFAULT_PROFILE)
  world.week = week
  return world
}

/** ...and one under a signed national deal, so the "the brand keeps it fresh" arm is a real contract
 *  rather than a hand-set flag. Same recipe as tests/component/bills-sponsor-quota.ts. */
function sponsoredCareer(): WorldState {
  const standing = { nationalRank: 1, itfRank: 20, itfRanked: true, wtaRank: 999, wtaRanked: false }
  const week = sponsorWindowOpensAt(WEEKS_PER_YEAR - 1)
  for (let attempt = 0; attempt < 30; attempt++) {
    const world = createWorld(`round21-bills-deal-${attempt}`, DEFAULT_PROFILE)
    world.week = week
    const raised = raiseKitOffers({ offers: world.offers, seed: world.seed, week, standing })
    const letter = raised.find((o) => (o.terms as KitOfferTerms).tier === 'national')
    if (!letter) continue
    acceptOffer(world, letter.id)
    world.week = world.offers[0].fromWeek!
    return world
  }
  throw new Error('no seed near "round21-bills-deal" was written to by National in 30 tries')
}

describe('Bills – round 21 #10: the chosen rung says how many good weeks are LEFT', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ prints "(N left)" beside the chosen rung, with the ENGINE\'s number interpolated', async () => {
    const snap = toSnapshot(agedCareer(30))
    const { owned } = await rungText(snap)
    expect(owned.length, 'one chosen rung per kit line').toBe(snap.kit.length)
    expect(snap.kit.length).toBe(3)
    snap.kit.forEach((line, i) => {
      expect(line.goodWeeksLeft, `${line.line} has no countdown at all`).not.toBeNull()
      // The rendered row has to carry the engine's own figure, not a number this screen worked out.
      expect(owned[i], `${line.line}: "${owned[i]}"`).toContain(`(${line.goodWeeksLeft} left)`)
    })
  })

  it('⚠ it is a COUNTDOWN, not the catalogue number relabelled', async () => {
    // The bug being fixed is that the button printed what the rung BUYS. If "(N left)" were wired to
    // `rung.goodWeeks` it would render, it would be a number, and it would still be the old bug - so
    // this is the claim that has to be strict rather than "a number appears".
    const snap = toSnapshot(agedCareer(30))
    let strictlyLess = 0
    for (const line of snap.kit) {
      const chosen = line.rungs.find((r) => r.owned)
      expect(chosen, `${line.line} owns no rung`).toBeTruthy()
      expect(line.goodWeeksLeft!).toBeLessThanOrEqual(chosen!.goodWeeks)
      expect(line.goodWeeksLeft!).toBeGreaterThanOrEqual(0)
      if (line.goodWeeksLeft! < chosen!.goodWeeks) strictlyLess++
    }
    expect(strictlyLess, 'no line has used up a single one of its good weeks after 30 weeks').toBeGreaterThan(0)
    // ...and it is on the SCREEN as a smaller number than the one beside it.
    const { owned } = await rungText(snap)
    const worn = snap.kit.findIndex((l) => l.goodWeeksLeft! < l.rungs.find((r) => r.owned)!.goodWeeks)
    const line = snap.kit[worn]
    expect(owned[worn]).toContain(`${line.rungs.find((r) => r.owned)!.goodWeeks} good weeks`)
    expect(owned[worn]).toContain(`(${line.goodWeeksLeft} left)`)
    expect(line.goodWeeksLeft).not.toBe(line.rungs.find((r) => r.owned)!.goodWeeks)
  })

  it('⚠ counts DOWN as the weeks pass, and never below zero', () => {
    // Week by week over a season, with no purchase pressed. The figure falls; it jumps back up only
    // where the family's own recurring gear buy replaces the line, which is the one thing that is
    // supposed to reset it.
    const readings: number[][] = []
    for (let week = 20; week <= 60; week++) {
      readings.push(toSnapshot(agedCareer(week)).kit.map((l) => l.goodWeeksLeft!))
    }
    let fell = 0
    let rose = 0
    for (let i = 1; i < readings.length; i++) {
      for (let line = 0; line < 3; line++) {
        expect(readings[i][line], 'a countdown went negative').toBeGreaterThanOrEqual(0)
        if (readings[i][line] < readings[i - 1][line]) fell++
        if (readings[i][line] > readings[i - 1][line]) rose++
      }
    }
    expect(fell, 'the counter never moved down in 40 weeks').toBeGreaterThan(40)
    expect(rose, 'the counter only ever goes back up when the line is replaced').toBeLessThan(fell)
  })

  it('⚠ the number a line reaches 0 on is the week it starts reading "Worn"', () => {
    // ONE CLOCK. `goodWeeksLeft` is `goodWeeksFor` minus the line's real age and `wear` is the same
    // age walked along the same curve, so "no good weeks left" and "Worn" have to arrive together -
    // a countdown that disagreed with the condition word two lines above it would be worse than none.
    let checked = 0
    for (let week = 4; week <= 90; week++) {
      for (const line of toSnapshot(agedCareer(week)).kit) {
        // `wearWord` bands Worn at 0.55, which is `WORN_AT` - the edge `goodWeeksFor` is measured to.
        const worn = line.wear >= 0.55
        if (worn) expect(line.goodWeeksLeft, `${line.line} is Worn with weeks still on the clock`).toBe(0)
        if (line.goodWeeksLeft! > 0) expect(worn, `${line.line} reads Worn with ${line.goodWeeksLeft} left`).toBe(false)
        if (worn) checked++
      }
    }
    expect(checked, 'no line ever wore out in 86 weeks, so the claim was never tested').toBeGreaterThan(0)
  })

  it('⚠ a line the brand keeps fresh prints no countdown at all', async () => {
    // `kitFreshCap` holds a covered line under the Worn edge for as long as the deal runs, so there is
    // nothing counting down on it - and printing "(0 left)" beside a line the same page calls Fresh
    // is exactly the disagreement the one-clock rule exists to prevent.
    const snap = toSnapshot(sponsoredCareer())
    const covered = snap.kit.filter((l) => l.sponsored)
    const hers = snap.kit.filter((l) => !l.sponsored)
    expect(covered.length, 'the fixture signed no deal').toBeGreaterThan(0)
    expect(hers.length, 'a national deal does not cover every line').toBeGreaterThan(0)
    for (const line of covered) expect(line.goodWeeksLeft, `${line.line} is covered`).toBeNull()
    for (const line of hers) expect(line.goodWeeksLeft, `${line.line} is hers`).not.toBeNull()
    const { owned } = await rungText(snap)
    snap.kit.forEach((line, i) => {
      if (line.sponsored) expect(owned[i], `${line.line}: "${owned[i]}"`).not.toContain('left)')
      else expect(owned[i]).toContain(`(${line.goodWeeksLeft} left)`)
    })
  })

  it('a rung she has NOT chosen still says only what it would buy', async () => {
    // "How many are left" is a fact about the set in her bag. The other three rungs are a catalogue,
    // and a countdown on them would be a promise about kit she does not own.
    const { others } = await rungText(toSnapshot(agedCareer(30)))
    expect(others.length).toBe(9)
    for (const text of others) {
      expect(text, `an unchosen rung printed a countdown: "${text}"`).not.toContain('left)')
      expect(text).toContain('good weeks')
    }
  })
})

// ⭐⭐ D12, RULED BY THE OWNER ON 04.09: «а в чем проблема сделать для планшетов и десктопов в одну
// строчку?» – none. Phase 2 left the 2x2 alone under «widen the column, change nothing else» and
// passed on a caution that re-flowing a grid might trouble the parity harness. It cannot:
// `e2e/parity.spec.ts` compares SETS OF ACCESSIBLE NAMES, never positions, so the same four rungs
// under the same four names are the same fingerprint however they are arranged. Only ADDING or
// REMOVING a control is forbidden. The handoff's own §1 gives the reason to do it: «ступени кита
// встают 4-в-ряд вместо 2x2 (лестница читается как лестница)».
//
// ⚠ THE STYLESHEET HAS TO BE IN THE DOCUMENT for this file to measure anything: `.kit-rungs` is
// MoneyScreen's own scoped rule, so it arrives with the component, but the assertion refuses to run
// blind either way.
//
// MUTATION-VERIFIED: the 768 block deleted -> the wide arm alone; the media query removed from
// around it -> the wide arm AND the phone arm.
describe('round 36 phase 3 – her kit reads as a ladder from 768 up', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => setViewport(PHONE))

  /** Every kit LINE has its own ladder (racket, shoes, strings), so all three are measured – a
   *  reflow that reached one of them would be exactly the false-done this repo keeps meeting. */
  async function rungsAt(vp: typeof PHONE) {
    expect(document.head.querySelector('style'), 'no stylesheet – this measurement is vacuous').toBeTruthy()
    setViewport(vp)
    useGameStore().snapshot = toSnapshot(agedCareer(30))
    // ⚠ ATTACHED, unlike `mountBills` above: happy-dom applies no rule at all to a detached tree, so
    // every computed value here would come back as the empty string and the assertions below would
    // be about nothing (round17-surfaces.test.ts's header records the same finding).
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
    const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')
    expect(bills, 'the Bills tab control').toBeTruthy()
    await bills!.trigger('click')
    const ladders = wrapper.findAll('.kit-rungs')
    expect(ladders.length, 'the kit ladders are on screen, or this measures nothing').toBeGreaterThan(0)
    const columns = ladders.map((l) => getComputedStyle(l.element).gridTemplateColumns.replace(/\s+/g, ' '))
    const counts = ladders.map((l) => l.findAll('.kit-rung').length)
    wrapper.unmount()
    return { columns, counts }
  }

  it('⭐ four rungs, one row, on a tablet and on a desktop', async () => {
    for (const vp of [TABLET, DESKTOP]) {
      const { columns, counts } = await rungsAt(vp)
      for (const count of counts) expect(count, 'every ladder still has all four grades').toBe(4)
      for (const c of columns) expect(c, `a ladder reads across at ${vp.width}`).toBe('repeat(4, minmax(0, 1fr))')
    }
  })

  it('⚠ and the phone keeps its 2x2 – four rungs across a 375px screen is 85px each', async () => {
    const { columns, counts } = await rungsAt(PHONE)
    for (const count of counts) expect(count, 'the same four rungs').toBe(4)
    for (const c of columns) expect(c, 'two up, as they have always been').toBe('1fr 1fr')
  })
})
