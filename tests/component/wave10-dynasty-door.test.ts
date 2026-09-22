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
//   · `.ending`'s `overflow-y: auto` -> `visible`: the reach case goes RED on the content-independent
//     half. That is the mutation the gotcha asks for – «a test that cannot fail on the too-tall
//     version is not this test» – and it is the half that keeps holding after somebody adds a
//     sentence, because it is about the BOX and not about today's copy.
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
import { availableWidth, demandedWidth, PHONE, NARROW_PHONE, setViewport } from './fits'
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
    // ⚠⚠ `assertDismissReachable` DOES NOT APPLY TO THIS STRUCTURE, AND FINDING THAT OUT IS HALF OF
    // WHAT THIS CASE IS WORTH. It was tried first and refused the epilogue with «the content is
    // taller than the screen and nothing scrolls»: it reads `overflow` off the CARD, because the
    // shape it was fitted to is round-20's `.dialog-overlay` + `.dialog-card`, where the scrim is
    // inert and the card is what has to be bounded. The epilogue is the OTHER safe shape – the
    // TAKEOVER itself is `position: fixed; inset: 0; overflow-y: auto`, so its content may be any
    // height at all and every control in its flow is reachable by scrolling. A card inside it needs
    // no cap of its own. So the helper scores a genuinely safe structure as a failure; that is a
    // defect in the instrument rather than in the screen, and it is reported to the architect
    // instead of being worked around by loosening a shared guard mid-wave.
    //
    // ⚠ SO THE LAW IS ASSERTED HERE IN ITS OWN TERMS, AND IT IS STILL THE LAW'S TWO HALVES:
    //   1. CONTENT-INDEPENDENT – the takeover is fixed, full-screen and scrolls, so no amount of
    //      future copy can put a control past a fold that cannot be reached. This is the half that
    //      keeps holding after somebody adds a sentence, which is what round-20 #4 actually asked for.
    //   2. IN THE FLOW – both controls are descendants of that scrolling box rather than pinned
    //      outside it, so (1) is about them.
    // And the WIDTH, which is the axis this round really moved: a second control in a footer.
    for (const vp of [PHONE, NARROW_PHONE]) {
      setViewport(vp)
      const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
      await toLastPage(w)
      const takeover = w.find('.ending').element
      const cs = getComputedStyle(takeover)
      expect(cs.position, 'the epilogue is a full-screen takeover').toBe('fixed')
      expect(
        ['auto', 'scroll'],
        `the takeover must scroll or a long epilogue strands the player at ${vp.width}x${vp.height}`,
      ).toContain(cs.overflowY)

      const room = availableWidth(takeover, vp)
      for (const sel of ['.ending-foot .tb-pill--cta', '.ending-line']) {
        const control = w.find(sel)
        expect(control.exists(), `${sel} is on the last page`).toBe(true)
        expect(takeover.contains(control.element), `${sel} is inside the scrolling box`).toBe(true)
        expect(
          demandedWidth(control.element, room),
          `${sel} at ${vp.width}x${vp.height}: wants more than the ${room.toFixed(0)}px the takeover leaves`,
        ).toBeLessThanOrEqual(room)
      }
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
