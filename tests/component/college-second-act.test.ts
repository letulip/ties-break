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
import { NATIONAL_TEAM } from '../../src/engine/nationalTeam'
import type { AlbumPage, CollegeProgressView, CollegeYear, EndingView, Snapshot, WorldMatch } from '../../src/shared/protocol'
import type { MatchPlayer } from '../../src/engine/match/types'

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

/** ⭐⭐ THE COLLEGE WAVE – A RUBBER, AS THE ENGINE FILES IT. `seed` is what makes it replayable:
 *  `MatchReplay` re-runs `simulateMatch(a, b, {surface, tour, seed})` and reproduces the match point
 *  for point, so a fixture without one would mount a viewer with nothing to show. */
function rubberPlayer(id: string, name: string): MatchPlayer {
  return { id, name, serve: 62, ret: 60, composure: 61, stamina: 63, groundstrokes: 62, age: 21 }
}

function rubber(index: number, over: Partial<WorldMatch> = {}): WorldMatch {
  const opp = rubberPlayer(`nations-w295-r${index}`, index === 0 ? 'Petra Kovac' : 'Nina Larsson')
  return {
    round: index,
    aId: 'kid',
    bId: opp.id,
    winnerId: index === 0 ? 'kid' : opp.id,
    seed: `fixture:rubber:295:${index}`,
    score: index === 0 ? '6-4 6-3' : '3-6 4-6',
    eventId: `nations-w295-r${index}`,
    surface: 'hard',
    oppName: opp.name,
    a: rubberPlayer('kid', 'Mila Adler'),
    b: opp,
    ...over,
  }
}

function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  // ⚠ ROUND 21: `billPerYearCents` is a real bill by default, not 0. A fixture that defaulted to zero
  // would go on measuring the free-ride card and quietly stop covering the one the player sees – the
  // same slow failure `round21-dialogs.test.ts` records about the fork's own fixture. $8,673 is the
  // shipped example bill from `what-the-college-place-costs-2026-08.md` §1a.
    // ⚠ 17.08: `tier` is the place she picked, and the default is a real one for the same reason the
  // bill's default is – a fixture that defaulted to `null` would go on measuring the migrated card.
  // ⚠ AND `rubbers` DEFAULTS TO THE TWO SHE PLAYED, for the third time in this function's history and
  // for the same reason the bill and the tier do: the default fixture must be the card the player
  // sees. `collegeYear()` above says she played two rubbers, so a default of `[]` would have been a
  // fixture asserting a week the engine cannot produce.
  return {
    yearsDone: 1,
    totalYears: ENDINGS.collegeYears,
    last: collegeYear(),
    final: false,
    billPerYearCents: 8_673_00,
    tier: 'state',
    rubbers: [rubber(0), rubber(1)],
    ...over,
  }
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

  // ===============================================================================================
  // ⭐⭐ THE COLLEGE WAVE – THE COMPETITION IS WATCHED, NOT SUMMARISED (owner's item 3, 19.08)
  // ===============================================================================================
  //
  // «в каждом году минимум одни соревнования, которые можно смотреть так же, как и наши текущие,
  // т.е. тот же самый механизм в точности, кроме названий турниров.»
  //
  // The engine plays the rubbers now; these three say the player can reach them. The load-bearing
  // one is the second: it mounts the REAL `MatchReplay`, the same component the tour re-watches a
  // match in, so "the same mechanism exactly" is asserted rather than claimed in a comment.

  it('⭐⭐ every rubber she played is a row, with who and what it finished', async () => {
    const wrapper = await openEpilogue(collegeView())
    const rows = wrapper.findAll('.college-rubber')
    expect(rows, 'two rubbers played, two rows').toHaveLength(2)
    expect(rows[0].text()).toContain('Rubber 1')
    expect(rows[0].text()).toContain('Kovac')
    expect(rows[0].text()).toContain('Won 6-4 6-3')
    expect(rows[1].text()).toContain('Lost 3-6 4-6')
    wrapper.unmount()
  })

  it('⭐⭐ pressing one opens the SAME replay the tour opens, headed with the competition', async () => {
    const wrapper = await openEpilogue(collegeView())
    expect(wrapper.findComponent({ name: 'MatchReplay' }).exists(), 'nothing open to begin with').toBe(false)
    await wrapper.findAll('.college-rubber')[0].trigger('click')
    const replay = wrapper.findComponent({ name: 'MatchReplay' })
    expect(replay.exists(), 'the rubber opens the app\'s own match viewer').toBe(true)
    // ⚠ THE TITLE IS THE OWNER'S «кроме названий турниров», and it is the ONE thing that differs from
    // a tour replay. A rubber has no rung behind it, so `occasionOf` correctly says nothing – without
    // this header the screen would never name the competition at all.
    expect(replay.text()).toContain(NATIONAL_TEAM.label)
    // ⚠⚠ AND IT PAINTS OVER THE EPILOGUE RATHER THAN UNDER IT, MEASURED THROUGH THE REAL CASCADE.
    // This is the one way the control could fail silently: the player taps Watch, the component
    // mounts, and nothing appears because the takeover's `z-index: 55` lost to the epilogue's 60.
    // It does not, and the reason is a rule rather than a number – `.ending` is `position: fixed`
    // with a numeric z-index, so it OPENS A STACKING CONTEXT and its descendants are ordered inside
    // it. Both halves are asserted, because either one changing breaks the claim: a takeover that
    // stopped being fixed would be clipped by `.ending`'s own `overflow-y: auto`, and an `.ending`
    // that stopped opening a context would put a 55 under a 60.
    const shell = replay.find('.tournament-flow').element
    const ending = wrapper.find('.ending').element
    expect(getComputedStyle(shell).position, 'the takeover escapes the epilogue\'s scroller').toBe('fixed')
    expect(getComputedStyle(ending).position).toBe('fixed')
    expect(Number(getComputedStyle(ending).zIndex), '.ending opens a stacking context').toBeGreaterThan(0)
    expect(Number(getComputedStyle(shell).zIndex), 'and the takeover is ordered inside it').toBeGreaterThan(0)
    // ...and it closes back onto the same undecided question.
    await replay.vm.$emit('close')
    expect(wrapper.findComponent({ name: 'MatchReplay' }).exists()).toBe(false)
    expect(wrapper.findAll('.ending-fork-option')).toHaveLength(2)
    wrapper.unmount()
  })

  it('⚠ a rubber she walked out of says so, in the result sheet\'s own notation', async () => {
    // A bare "Lost 6-4 2-1" hides that she stopped, which is the lie the news line's verb exists to
    // prevent one layer down. `ret.` sits beside the verb, so which of the two women retired is never
    // in doubt: the one who retires is always the one who lost.
    const hers = rubber(0, { retiredId: 'kid', winnerId: 'nations-w295-r0', score: '6-4 2-1' })
    const theirs = rubber(1, { retiredId: 'nations-w295-r1', winnerId: 'kid', score: '6-4 3-0' })
    const wrapper = await openEpilogue(collegeView({ rubbers: [hers, theirs] }))
    const rows = wrapper.findAll('.college-rubber')
    expect(rows[0].text()).toContain('Lost 6-4 2-1 ret.')
    expect(rows[1].text()).toContain('Won 6-4 3-0 ret.')
    wrapper.unmount()
  })

  it('⚠ named in the squad and never on court draws NO rows – the outcome, not a gap', async () => {
    // Research §5.7: representation is deemed to occur on nomination, not on playing. A squad of four
    // for three ties means one of them sits, and the week is still a week. What there is not is a
    // match, so there is nothing to open and the card must not offer one.
    const wrapper = await openEpilogue(
      collegeView({ last: collegeYear({ callUp: { week: 295, rubbersPlayed: 0, rubbersWon: 0, nationFinish: 11 } }), rubbers: [] }),
    )
    expect(wrapper.text()).toContain('never on court')
    expect(wrapper.findAll('.college-rubber')).toHaveLength(0)
    wrapper.unmount()
  })

  it('⚠ and says it plainly when nobody wrote to her', async () => {
    const wrapper = await openEpilogue(collegeView({ last: collegeYear({ callUp: null }), rubbers: [] }))
    expect(wrapper.text()).toContain('Nobody wrote to her this year')
    expect(wrapper.text()).not.toContain('Her country called')
    // ⚠ AND NO RUBBER ROW EITHER – a year with no letter has nothing to open, and a "Watch" control
    // with no match behind it is the empty-popup failure of R10-16 wearing a different button.
    expect(wrapper.findAll('.college-rubber')).toHaveLength(0)
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
    const wrapper = await openEpilogue(collegeView({ yearsDone: 0, last: null, rubbers: [] }))
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

  // ⭐⭐ 17.08 – THE EPILOGUE NAMES THE PLACE SHE PICKED. Four years are lived here and the tier is a
  // price and a place she chose at the fork; a screen that never said which one would be hiding the
  // decision the player actually made. ⚠ AND IT SAYS NOTHING WHERE IT WAS NEVER TOLD – a career that
  // entered college before the choice existed carries `tier: null` and gets no invented place.
  //
  // ⚠ RE-AIMED, NOT DELETED (round 21 #4): the name is «A private university» and no longer «A private
  // programme» – the owner's «надо переформулировать точно» – and the negative below moved with it to
  // the word the caption actually uses now. Asserting the OLD noun's absence would have passed
  // vacuously on every future rename, which is the failure `pin-hygiene` describes one file along.
  it('⭐⭐ names the place she picked on the first year, and invents none where there is none', async () => {
    const picked = await openEpilogue(collegeView({ yearsDone: 0, tier: 'private' }))
    expect(picked.find('.college-lead').text()).toContain('A private university')
    picked.unmount()
    const migrated = await openEpilogue(collegeView({ yearsDone: 0, tier: null }))
    const lead = migrated.find('.college-lead').text()
    expect(lead).not.toMatch(/university|programme/)
    expect(lead, 'and the rest of the sentence survives').toContain('the family pays whatever the award does not')
    migrated.unmount()
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
      // ⚠ THE RUBBER ROWS ARE MEASURED WITH THE ANSWERS (the college wave). They are the newest
      // controls on the longest card in the game, they sit ABOVE the two answers, and the failure
      // mode this whole describe exists for is a card that grows one honest row at a time until
      // something falls off the bottom of a phone.
      const controls = wrapper.findAll('.college-year .ending-fork-option, .college-year .college-rubber').map((n) => n.element)
      expect(controls, 'two answers and two rubbers').toHaveLength(4)
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
