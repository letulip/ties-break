// ⭐⭐ P5 – THE COLLEGE YEAR, ON SCREEN: the question at each boundary, mounted.
//
// The epilogue used to carry ONE control for college – a pill reading «Four years later –» – and
// pressing it spent 208 weeks. This file is about what replaced it: the year just lived, stated in
// the engine's own numbers, and two answers of one weight.
//
// ⚠⚠ AND IT IS MEASURED AGAINST A PHONE, WITH A MUTATION PROOF – but NOT with
// `assertDismissReachable`, and the difference is the point rather than a shortcut.
//
// Round-20 #3 shipped `TourBriefingDialog` on the shared `dialog-card`: a CENTRED card in a
// non-scrolling overlay, with no `max-height`, whose Continue left the screen and stranded the
// owner's career. `assertDismissReachable` measures exactly that shape – it asks for a declared
// height bound that fits, because a centred unbounded card overflows equally at BOTH ends and the
// part past the fold cannot be reached at all.
//
// `EndingScreen` is the other shape. Its root is `position: fixed; inset: 0; overflow-y: auto` – a
// full-screen SCROLLER – so there is no centring, nothing overflows a line box, and a card with no
// height bound is correct rather than dangerous. Asking it for a `max-height` would be asking it to
// stop being a takeover. So the property that makes THIS surface safe is asserted instead, and the
// mutation proof at the bottom of the file takes the scroll away and watches the same assertion go
// red. A test that cannot fail on the broken version is not this test.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
// ⚠ THE REAL STYLESHEET, or every measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { ENDINGS } from '../../src/engine/ending'
import { boxOf, setViewport, NARROW_PHONE, PHONE, type Viewport } from './fits'
import type { AlbumPage, CollegeProgressView, CollegeYear, EndingView, Snapshot } from '../../src/shared/protocol'

function albumPage(slot: number): AlbumPage {
  return {
    slot,
    why: `why ${slot}`,
    caption: `caption ${slot}`,
    fact: `fact ${slot}`,
    week: 52 * slot,
    seasonIndex: slot,
    stage: 'teen',
    emotion: 'norm',
    empty: false,
  } as AlbumPage
}

function collegeYear(over: Partial<CollegeYear> = {}): CollegeYear {
  return {
    index: 1,
    fromWeek: 281,
    untilWeek: 333,
    startSkill: 58.6,
    endSkill: 58.9,
    startRank: null,
    endRank: null,
    fundsDeltaCents: 3_806_075,
    callUp: { week: 295, rubbersPlayed: 2, rubbersWon: 1, nationFinish: 11 },
    ...over,
  }
}

function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  // ⚠ ROUND 21: `billPerYearCents` is a real bill by default, not 0. A fixture that defaulted to zero
  // would go on measuring the free-ride card and quietly stop covering the one the player sees – the
  // same slow failure `round21-dialogs.test.ts` records about the fork's own fixture. $8,673 is the
  // shipped example bill from `what-the-college-place-costs-2026-08.md` §1a.
  return { yearsDone: 1, totalYears: ENDINGS.collegeYears, last: collegeYear(), final: false, billPerYearCents: 8_673_00, ...over }
}

function endingView(college: CollegeProgressView | null): EndingView {
  return {
    ending: { type: 'college', week: 333, ageYears: 20, detail: '1 of 4 years', resumesWeek: 385 },
    album: [1, 2, 3, 4, 5, 6, 7].map(albumPage),
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 385, resumesAgeYears: 21 },
    totals: { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 },
    seasonsPlayed: 6,
    bestRank: 88,
    titles: 1,
    oneMoreYearCount: 0,
    college,
  }
}

/** Mounted attached to the document, on the LAST album page – the footer only exists there. */
async function openEpilogue(college: CollegeProgressView | null, vp: Viewport = PHONE) {
  setViewport(vp)
  const game = useGameStore()
  game.$patch({ snapshot: { ending: endingView(college) } as unknown as Snapshot })
  const wrapper = mount(EndingScreen, { attachTo: document.body })
  // turn to the last page, where the footer and the college block live
  const nextBtn = wrapper.findAll('.album-arrow').at(1)!
  for (let i = 0; i < 6; i++) await nextBtn.trigger('click')
  return wrapper
}

describe('P5 – the college year block', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐ draws the year just lived, in the engine\'s own numbers', async () => {
    const wrapper = await openEpilogue(collegeView())
    const text = wrapper.text()
    expect(text).toContain('Year 2 of 4')
    // The money the year banked, formatted by the same helper the totals use.
    expect(text).toContain('$38,061')
    // ⚠ THE RANK SPAN IS A DASH AT BOTH ENDS WHEN SHE IS ON NO LIST – null IS NOT #1, which is the
    // contract `LadderView.rank` keeps and the reason this is not a number.
    expect(text).toContain('– to –')
    wrapper.unmount()
  })

  it('⭐⭐ says what the call-up paid, which is nothing, in both currencies', async () => {
    const wrapper = await openEpilogue(collegeView())
    const text = wrapper.text()
    expect(text).toContain('Her country called')
    expect(text).toContain('1 of 2 rubbers won')
    expect(text).toContain('finished 11th')
    expect(text).toContain('No prize money and no ranking points')
    wrapper.unmount()
  })

  it('⚠ and says it plainly when nobody wrote to her', async () => {
    const wrapper = await openEpilogue(collegeView({ last: collegeYear({ callUp: null }) }))
    expect(wrapper.text()).toContain('Nobody wrote to her this year')
    expect(wrapper.text()).not.toContain('Her country called')
    wrapper.unmount()
  })

  it('⭐ TWO ANSWERS, and the early return is one of them', async () => {
    const wrapper = await openEpilogue(collegeView())
    const labels = wrapper.findAll('.ending-fork-option strong').map((n) => n.text())
    expect(labels).toEqual(['Another year', 'Back on tour now'])
    wrapper.unmount()
  })

  it('⚠ THE LEAVE ANSWER IS ABSENT BEFORE THE FIRST YEAR IS SPENT, and the engine agrees', async () => {
    // `endCollegeEarly` throws on a career with no banked year, so a button here would be a control
    // that cannot work. The screen agrees with the rule; it is not the rule (CLAUDE.md invariant 1).
    const wrapper = await openEpilogue(collegeView({ yearsDone: 0, last: null }))
    const labels = wrapper.findAll('.ending-fork-option strong').map((n) => n.text())
    expect(labels).toEqual(['Play the first year'])
    expect(wrapper.text()).toContain('Year 1 of 4')
    expect(wrapper.text()).toContain('She can leave at the end of any year')
    wrapper.unmount()
  })

  it('⚠ IT MAY NOT RECOMMEND – neither answer is styled as the CTA, and no verdict word appears', async () => {
    // Ruling 4 (30.07), the same discipline the fork at nineteen keeps. Two options of ONE weight:
    // a CTA pill beside a text link is an opinion in a different font.
    const wrapper = await openEpilogue(collegeView())
    const section = wrapper.find('.college-year')
    expect(section.findAll('.ending-fork-option')).toHaveLength(2)
    expect(section.find('.primary-pill').exists(), 'no CTA inside the question').toBe(false)
    const text = section.text().toLowerCase()
    for (const verdict of ['should', 'better', 'recommend', 'worth it', 'mistake', 'wasted']) {
      expect(text, `"${verdict}" is a verdict and this card may not carry one`).not.toContain(verdict)
    }
    wrapper.unmount()
  })

  it('⚠ the last question says so, because after it she is out either way', async () => {
    const wrapper = await openEpilogue(collegeView({ yearsDone: 3, final: true }))
    expect(wrapper.text()).toContain('One year of the scholarship left')
    wrapper.unmount()
  })

  it('⚠ NO CYRILLIC AND NO LONG DASH reaches the screen', async () => {
    // CLAUDE.md Style, asserted rather than reviewed.
    const wrapper = await openEpilogue(collegeView())
    const text = wrapper.find('.college-year').text()
    expect(text).not.toMatch(/[Ѐ-ӿ]/)
    expect(text).not.toContain('—')
    wrapper.unmount()
  })
})

// =================================================================================================
// THE PHONE MEASUREMENT – and it measures the shape this screen actually is
// =================================================================================================

/**
 * The whole of round-20 #3, asked of a SCROLLING TAKEOVER instead of a centred card.
 *
 * THREE things have to hold and they fail differently, so all three are named:
 *  1. the root is a fixed, full-screen surface – checked rather than assumed, because a takeover
 *     that stopped being fixed would silently change what "the screen" means here;
 *  2. it SCROLLS, so nothing added below the fold becomes unreachable. This is the
 *     content-INDEPENDENT half – the one that still holds after the next sentence is added, and the
 *     one the mutation proof takes away;
 *  3. every control is a DESCENDANT of that scroller and has a box. A control outside the scrolling
 *     flow is not reached by scrolling it, and a control with no height is not a control – happy-dom
 *     does no layout, so this is asked of the cascade through `boxOf`, which is the same instrument
 *     `measureDialog` uses.
 */
function assertTakeoverReachable(root: Element, controls: Element[], vp: Viewport, label: string): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – without it this measurement is vacuous')
  }
  const cs = getComputedStyle(root)
  if (cs.position !== 'fixed') {
    throw new Error(`${label}: the takeover is \`${cs.position}\`, not \`fixed\` – it is not a full-screen surface`)
  }
  const scrolls = cs.overflowY === 'auto' || cs.overflowY === 'scroll'
  expect(
    scrolls,
    `${label} at ${vp.width}x${vp.height} – the takeover does not scroll, so everything past the fold is unreachable however long the copy gets`,
  ).toBe(true)

  const padX = parseFloat(cs.paddingLeft || '0') + parseFloat(cs.paddingRight || '0')
  const available = vp.width - (Number.isFinite(padX) ? padX : 0)
  for (const control of controls) {
    expect(
      root.contains(control),
      `${label} at ${vp.width}x${vp.height} – a control sits outside the scrolling surface, so scrolling cannot reach it`,
    ).toBe(true)
    const box = boxOf(control, available)
    expect(
      box.h,
      `${label} at ${vp.width}x${vp.height} – a control has no box at ${available.toFixed(0)}px of room, so there is nothing to press`,
    ).toBeGreaterThan(0)
  }
}

describe('⚠⚠ P5 – the college question fits a phone, and the measurement can fail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`both answers are reachable at ${vp.width}x${vp.height}`, async () => {
      const wrapper = await openEpilogue(collegeView(), vp)
      const root = wrapper.find('.ending').element
      const controls = wrapper.findAll('.college-year .ending-fork-option').map((n) => n.element)
      expect(controls).toHaveLength(2)
      assertTakeoverReachable(root, controls, vp, 'EndingScreen (college question)')
      wrapper.unmount()
    })
  }

  it('⭐⭐ THE MUTATION PROOF: take the scroll away and the same assertion goes red', async () => {
    // A test that cannot fail on the broken version is not this test. `.ending` without
    // `overflow-y: auto` is precisely the round-20 shape – a fixed full-screen surface whose
    // content simply runs off the bottom – and the assertion above must say so.
    const wrapper = await openEpilogue(collegeView(), PHONE)
    const root = wrapper.find('.ending').element as HTMLElement
    const controls = wrapper.findAll('.college-year .ending-fork-option').map((n) => n.element)
    // Sanity: green before the mutation.
    assertTakeoverReachable(root, controls, PHONE, 'EndingScreen (college question)')
    root.style.overflowY = 'hidden'
    expect(() => assertTakeoverReachable(root, controls, PHONE, 'EndingScreen (college question)')).toThrow(
      /does not scroll/,
    )
    wrapper.unmount()
  })

  it('⭐ AND THE SECOND HALF FAILS TOO – a control lifted out of the scroller is caught', async () => {
    // The other way this surface can strand a player: a control that is on the page but not inside
    // the thing that scrolls. Scrolling the takeover would never bring it back.
    const wrapper = await openEpilogue(collegeView(), PHONE)
    const root = wrapper.find('.ending').element
    const control = wrapper.find('.college-year .ending-fork-option').element as HTMLElement
    document.body.appendChild(control)
    expect(() => assertTakeoverReachable(root, [control], PHONE, 'EndingScreen (college question)')).toThrow(
      /outside the scrolling surface/,
    )
    wrapper.unmount()
  })
})
