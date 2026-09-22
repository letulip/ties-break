// WAVE 10 / T4 – THE DOOR ON THE EPILOGUE, MOUNTED.
//
// docs/specs/the-dynasty-2026-09.md §2, his 20.09 ruling: the door never closes. A player may have
// wanted a dynasty and simply not have had a child inside the career they played, so the second
// affordance renders on EVERY ending and what forks is the TEXT.
//
// ⚠⚠ THE FIT ASSERTION IS ROUND-20 #3's OWN, and it is here because this round LENGTHENED a blocking
// takeover: the epilogue is `position: fixed; inset: 0` with no way behind it, and a control the
// player cannot reach is a career that stops there. CLAUDE.md's gotcha asks for exactly this test
// whenever a dialog is added to or lengthened.
//
// MUTATION-VERIFIED 22.09, each applied, RUN and reverted:
//   · `.ending`'s `overflow-y: auto` -> `visible`: **1 red**, and it fails through the HELPER now –
//     the takeover stops being a scrolling one, `measureDialog` reads it as the round-20 shape
//     instead, and the cap rule bites a card that declares no bound: «card 375x979, cap NONE, card
//     does NOT scroll, overlay does NOT scroll, 667px of room». That is the mutation the gotcha asks
//     for – «a test that cannot fail on the too-tall version is not this test» – and it is the half
//     that keeps holding after somebody adds a sentence, because it is about the BOX.
//   · the helper's tail walk reduced to the control's own `marginBottom` (its behaviour before
//     22.09): **1 red** – the stacking assertion, because both ways off the screen would then be
//     reported on the card's bottom edge and the two boxes would land on top of each other.
//   ⚠ AND THE ROUND-20 GUARANTEE WAS RE-MEASURED AFTER THE HELPER CHANGED, not assumed: stripping
//     `max-height`/`overflow-y` off the shared `.dialog-card` reddens **41 files / 119 tests** with
//     «the card declares no height bound that fits». Nothing was loosened for the other shape.
//   · the two labels swapped in `continueLabel`: **2 red**, one per variant, which is what makes
//     the pair non-vacuous – a single label would have passed both.
//   · the `v-if`'s `resumes === null` dropped: **1 red** – the college case; an ending that can
//     still be resumed must not offer a line beside its own way forward.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { createWorld } from '../../src/engine/world'
import { toSnapshot } from '../../src/engine/world/snapshot'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { assertDismissReachable, availableWidth, demandedWidth, PHONE, NARROW_PHONE, setViewport } from './fits'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type {
  AlbumPage,
  DynastyHandover,
  EndingView,
  PlayerProfile,
  PrologueHandover,
  Snapshot,
} from '../../src/shared/protocol'
import '../../src/style.css'

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

function endingView(over: Partial<EndingView> = {}): EndingView {
  const totals = { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
  return {
    ending: { type: 'natural', week: 900, ageYears: 31, detail: 'she stopped at thirty-one', resumesWeek: null },
    album: [1, 2, 3, 4, 5, 6, 7].map(albumPage),
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals,
    money: moneyOf(totals),
    seasonsPlayed: 17,
    bestRank: 11,
    bestRankTrack: 'wta',
    titles: 9,
    oneMoreYearCount: 2,
    academy: null,
    lifetimeDeal: null,
    college: null,
    dynasty: dynastyOf(),
    ...over,
  } as EndingView
}

function mountEpilogue(view: EndingView) {
  const game = useGameStore()
  game.$patch({
    snapshot: {
      ageYears: 31,
      week: 900,
      kidRank: 11,
      fundsCents: 1234_00,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
      ending: view,
    } as unknown as Snapshot,
  })
  return mount(EndingScreen, { attachTo: document.body })
}

/** The footer only exists on the LAST album page – the hand-off is an offer, not a credits roll. */
async function toLastPage(w: ReturnType<typeof mountEpilogue>): Promise<void> {
  for (let i = 0; i < 6; i += 1) await w.findAll('.album-arrow')[1].trigger('click')
}

describe('wave 10 T4 – the door never closes', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ renders on an ending with NO child – the epilogue variant, and the door is still open', async () => {
    const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour: false }) }))
    await toLastPage(w)
    const line = w.find('.ending-line')
    expect(line.exists(), 'his 20.09 ruling: a player who had no luck still gets the door').toBe(true)
    expect(line.text()).toBe('A daughter came later')
    // ...beside «Raise another», never instead of it: two different things.
    expect(w.text()).toContain('Raise another')
    w.unmount()
  })

  it('⭐⭐⭐ ...and the LIVED variant on an ending that had one', async () => {
    const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
    await toLastPage(w)
    expect(w.find('.ending-line').text()).toBe('Raise her daughter')
    w.unmount()
  })

  it('⚠⚠ NEITHER TEXT NAMES HER, AND NEITHER AGES HER – the two things no string in this wave may do', async () => {
    // «имя выбирает родитель» (20.09): no name exists yet, so no label may carry one. And no age is
    // stated, because the block carries no `bornWeek` to compute one from – a limit reported to the
    // architect rather than papered over with a number.
    for (const raisedOnTour of [true, false]) {
      const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour }) }))
      await toLastPage(w)
      const label = w.find('.ending-line').text()
      expect(label, 'no first name').not.toMatch(/Alice|Martin/)
      expect(label, 'no age, no number at all').not.toMatch(/\d/)
      w.unmount()
    }
  })

  it('⭐⭐ the press emits the BLOCK, because the shell has no world to build one from', async () => {
    const block = dynastyOf({ raisedOnTour: true, generation: 3 })
    const w = mountEpilogue(endingView({ dynasty: block }))
    await toLastPage(w)
    await w.find('.ending-line').trigger('click')
    const emitted = w.emitted('continueLine')
    expect(emitted, 'the shell is handed the line it has to carry').toBeTruthy()
    expect(emitted![0][0]).toEqual(block)
    // ...and nothing was created here. This screen emits and stops – round 47 #12's own law.
    expect(w.emitted('newCareer')).toBeFalsy()
    w.unmount()
  })

  it('⚠ a college ending that can still be RESUMED offers its own way forward and not a line', async () => {
    // The footer's branches have to stay exhaustive: a blocking takeover with no way out is the
    // round-20 failure with a different cause, and «another year» is that career's way out.
    const w = mountEpilogue(
      endingView({
        ending: { type: 'college', week: 300, ageYears: 20, detail: 'she went to college', resumesWeek: 508 },
        handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 508, resumesAgeYears: 23 },
      }),
    )
    await toLastPage(w)
    expect(w.find('.ending-line').exists(), 'no line while there is still a season to play').toBe(false)
    expect(w.text()).toContain('Another year')
    w.unmount()
  })

  it('⭐⭐⭐ ROUND-20 #3: both ways off this screen are reachable on a phone, and stay reachable', async () => {
    // ⚠⚠ THIS CASE WAS WRITTEN BY HAND AND IS NOW THE HELPER'S AGAIN, which is worth recording because
    // the hand-written version was the RIGHT call at the time. `assertDismissReachable` refused the
    // epilogue outright – «the content is taller than the screen and nothing scrolls» – because it
    // read `overflow` off the CARD, where this shape does not put it: the round-20 shape is an inert
    // scrim with a bounded scrolling card, and the epilogue is the other safe shape, a TAKEOVER that
    // is itself the scroll container. So the wave asserted the law's two halves here rather than
    // loosen a shared guard in the middle of a wave, and reported the instrument defect.
    //
    // ⭐ THE HELPER KNOWS BOTH SHAPES NOW (`DialogShape` in ./fits), so the hand-written structural
    // assertions are gone and this case asks the one question through the one instrument every other
    // dialog in the app is asked through. TWO THINGS IT GAINED THAT THE HAND-WRITTEN VERSION DID NOT
    // HAVE: the dismiss control's BOX is placed and checked against the viewport (the hand-written
    // version only proved the control was inside a scrolling box), and «Raise another» is measurable
    // at all – it is second-to-last in the footer, and the old model could only read a control that
    // was last.
    //
    // ⚠ THE WIDTH HALF STAYS HERE. `assertDismissReachable` answers height and reach; width is the
    // axis this round really moved by putting a SECOND control in a footer, and `demandedWidth` is
    // the shared instrument for that one.
    for (const vp of [PHONE, NARROW_PHONE]) {
      setViewport(vp)
      const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
      await toLastPage(w)
      const takeover = w.find('.ending').element
      const card = w.find('.ending-album').element
      const room = availableWidth(takeover, vp)
      const fits = ['.ending-foot .tb-pill--cta', '.ending-line'].map((sel) => {
        const control = w.find(sel)
        expect(control.exists(), `${sel} is on the last page`).toBe(true)
        const fit = assertDismissReachable(card, control.element, vp, `epilogue ${sel}`)
        expect(fit.shape, 'the epilogue is a scrolling takeover, not a scrim with a bounded card').toBe(
          'overlay-scrolls',
        )
        expect(
          demandedWidth(control.element, room),
          `${sel} at ${vp.width}x${vp.height}: wants more than the ${room.toFixed(0)}px the takeover leaves`,
        ).toBeLessThanOrEqual(room)
        return fit
      })
      // ⚠⚠ AND THE TWO CONTROLS ARE REALLY STACKED, WHICH IS WHAT GIVES THE HELPER'S NEW TAIL WALK ITS
      // TEETH. «Raise another» is second-to-last in the footer and the line is last; the old model
      // could only read a control that was last, so it would have placed BOTH of them on the card's
      // bottom edge and reported the same box twice. This line is the one that notices.
      expect(
        fits[0].dismissBottom,
        'the two ways off this screen are drawn on top of each other – the tail walk is not seeing the line',
      ).toBeLessThan(fits[1].dismissTop)
      w.unmount()
    }
  })
})

// =================================================================================================
// THE OTHER SIDE OF THE ROUTE – WHAT THE BLOCK CHANGES ABOUT THE CHILDHOOD (§6.2, §6.3, §6.4)
// =================================================================================================
//
// MUTATION-VERIFIED 22.09, each applied, RUN and reverted:
//   · the `:readonly` binding dropped from the surname input: **1 red** – the lock case.
//   · `openingRun()` returning `EMPTY_RUN` on a dynasty run: **1 red** – the origins case, because
//     the card then has three buttons and no answer.
//   · `openingIdentity()` returning the defaults on a dynasty run: **2 red** – the surname and the
//     country, which is the pair that says the two pre-fills are independent of each other.

describe('wave 10 T4 – a dynasty childhood', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  function stubStore() {
    const game = useGameStore()
    const calls: { seed: string; dynasty?: DynastyHandover; profile: PlayerProfile }[] = []
    game.newCareer = vi.fn(
      async (
        seed: string,
        profile: PlayerProfile = DEFAULT_PROFILE,
        prologue?: PrologueHandover,
        dynasty?: DynastyHandover,
      ) => {
        calls.push({ seed, dynasty, profile })
        game.snapshot = toSnapshot(createWorld(seed, profile, 'c-w10', prologue, dynasty))
      },
    )
    return calls
  }

  const BLOCK = dynastyOf({
    generation: 2,
    childSeed: 'ancestor-seed:dynasty:2',
    background: 'wealthy',
    motherName: { first: 'Vera', last: 'Kowalski' },
    motherCountry: 'PL',
    raisedOnTour: true,
  })

  it('⭐⭐⭐ §6.2 – the surname is her mother\'s and it is LOCKED; the first name is still typed', () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { props: { dynasty: BLOCK }, attachTo: document.body })
    const last = w.find('#prologue-last').element as HTMLInputElement
    expect(last.value, 'she carries her mother\'s name').toBe('Kowalski')
    expect(last.readOnly, 'and it cannot be typed over – the line is the point').toBe(true)
    // ⚠ THE DIE IS GONE WITH IT: a roll on a locked field would be a control that does nothing.
    expect(w.findAll('.prologue-dice')).toHaveLength(1)
    // ⚠ AND THE FIRST NAME IS UNTOUCHED AND FREE – «имя выбирает родитель» is his 20.09 ruling, so
    // nothing in this wave may invent one. It opens on the same default every prologue opens on.
    const first = w.find('#prologue-first').element as HTMLInputElement
    expect(first.readOnly).toBe(false)
    expect(first.value).toBe(DEFAULT_PROFILE.kidName)
    w.unmount()
  })

  it('⭐⭐ §6.2 – the country pre-fills from her mother\'s and stays editable', () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { props: { dynasty: BLOCK }, attachTo: document.body })
    expect(w.text(), 'her mother\'s country is what the picker opens on').toContain('Poland')
    w.unmount()
  })

  it('⭐⭐⭐ §6.3 – the origins card is NOT asked, and the background arrives answered', async () => {
    const calls = stubStore()
    const w = mount(ChildhoodPrologue, { props: { dynasty: BLOCK }, attachTo: document.body })
    // The three origin buttons are absent – not disabled, not pre-selected, absent.
    expect(w.findAll('.prologue-picks button').length, 'nothing to choose about where she is from').toBe(0)
    // ...and the card is finished the moment it arrives, because the answer came with the block.
    expect(w.find('.prologue-proceed').exists(), 'the way on is there from the first frame').toBe(true)
    // The ONE sentence that explains both, and it is a DRAFT.
    expect(w.find('.prologue-line-note').text()).toBe('She is born into her mother\'s family and carries her name.')
    w.unmount()
    expect(calls).toHaveLength(0)
  })

  // ⚠ §6.4 – THE SEED IS NOT ASSERTED HERE, AND SAYING SO IS BETTER THAN A CASE THAT CANNOT FAIL.
  // «The ninth card's call passes `childSeed`» is only observable at the END of the walk, and the
  // first draft of this case asserted a tautology instead. The claim is measured where the whole
  // route really runs – `e2e/dynasty.spec.ts`, which finishes a fixture career, takes the door, names
  // the girl and reads `world.seed` off the career that comes out.

  it('⚠ and an ordinary childhood is untouched – no lock, three origins, no note', () => {
    stubStore()
    const w = mount(ChildhoodPrologue, { attachTo: document.body })
    const last = w.find('#prologue-last').element as HTMLInputElement
    expect(last.readOnly).toBe(false)
    expect(w.findAll('.prologue-dice')).toHaveLength(2)
    expect(w.findAll('.prologue-picks button').length).toBe(3)
    expect(w.find('.prologue-line-note').exists()).toBe(false)
    w.unmount()
  })
})
