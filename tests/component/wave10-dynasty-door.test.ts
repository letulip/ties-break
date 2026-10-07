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
//
// ⭐⭐⭐ RE-AIMED 07.10 BY HIS ROUND 48 #6 (docs/rounds/round-48.md): the epilogue label is 'A child came later' (his own ruling,
// «child is better»), and the two doors stand in ONE ROW (`.ending-doors`) – so the stacking assertion in the round-20 case
// below became «one shared bottom» plus «the row sits above the record link», and the arm recorded above for the stacking line
// is the one that now reddens the second. Each moved line says so beside it. The row's own claims (flex row, equal halves, the
// phone fit at 375 and 320) are in tests/component/r48-b1-ending-page.test.ts.
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
import App from '../../src/App.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import { legacyInputOf, type LegacyInput } from '../../src/engine/world/succession'
import { PROFILE_NAME_MAX_CHARS } from '../../src/shared/protocol'
import { completeRun } from '../helpers/completeRun'

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
    closing: albumPage(7),
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

describe('wave 10 T4 – the door never closes', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐ renders on an ending with NO child – the epilogue variant, and the door is still open', async () => {
    const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour: false }) }))
    const line = w.find('.ending-line')
    expect(line.exists(), 'his 20.09 ruling: a player who had no luck still gets the door').toBe(true)
    // ⭐ RE-AIMED 07.10 BY HIS ROUND 48 #6: it read 'A daughter came later' – the owner's own ruling is that «child» is better
    // (docs/decisions.md, 07.10), so the epilogue label is 'A child came later'. Only this variant moved; the lived one below
    // is still 'Raise her daughter'. This is a pin that asserts what the string IS, so it moved with it – the dated note is
    // what makes that accountable.
    expect(line.text()).toBe('A child came later')
    // ...beside «Raise another», never instead of it: two different things.
    expect(w.text()).toContain('Raise another')
    w.unmount()
  })

  it('⭐⭐⭐ ...and the LIVED variant on an ending that had one', async () => {
    const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
    expect(w.find('.ending-line').text()).toBe('Raise her daughter')
    w.unmount()
  })

  it('⚠⚠ NEITHER TEXT NAMES HER, AND NEITHER AGES HER – the two things no string in this wave may do', async () => {
    // «имя выбирает родитель» (20.09): no name exists yet, so no label may carry one. And no age is
    // stated, because the block carries no `bornWeek` to compute one from – a limit reported to the
    // architect rather than papered over with a number.
    for (const raisedOnTour of [true, false]) {
      const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour }) }))
      const label = w.find('.ending-line').text()
      expect(label, 'no first name').not.toMatch(/Alice|Martin/)
      expect(label, 'no age, no number at all').not.toMatch(/\d/)
      w.unmount()
    }
  })

  it('⭐⭐ the press emits the BLOCK, because the shell has no world to build one from', async () => {
    const block = dynastyOf({ raisedOnTour: true, generation: 3 })
    const w = mountEpilogue(endingView({ dynasty: block }))
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
      const takeover = w.find('.ending').element
      const card = w.find('.ending-album').element
      const room = availableWidth(takeover, vp)
      // ⚠ 08.10 (loc/intake tail) – RE-AIMED: the CTA variant moved to the LINE door on the owner's
      // ruling («эту кнопку надо желтой сделать, а не соседнюю»), so a `--cta` selector would now
      // grab the line pill twice and miss «Raise another». `ending-door-start` is the start door's
      // own hook (EndingScreen.vue), variant-agnostic like `.ending-line`.
      const fits = ['.ending-door-start', '.ending-line'].map((sel) => {
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
      // ⚠⚠ AND THE TWO CONTROLS WERE REALLY STACKED, WHICH WAS WHAT GAVE THE HELPER'S NEW TAIL WALK ITS
      // TEETH. «Raise another» was second-to-last in the footer and the line was last; the old model
      // could only read a control that was last, so it would have placed BOTH of them on the card's
      // bottom edge and reported the same box twice. That line was the one that noticed.
      //
      // ⭐⭐⭐ RE-AIMED 07.10 BY HIS ROUND 48 #6 («Raise another» and the succession door in one row): THEY ARE NOT STACKED ANY
      // MORE, BY HIS ASK, so «the first door's bottom is above the second door's top» is false by design – both doors sit
      // in ONE `.ending-doors` row and share one bottom. The tail walk's teeth did not go anywhere; they MOVED to the next
      // control down. The two claims that replace the one: (1) the doors share a bottom – one row; (2) that row sits ABOVE
      // the record link under it – which a tail walk that stopped at the control's own margin would still get wrong
      // (it would put the doors and the link on the card's bottom edge together), so the arm that used to redden the
      // stacking line reddens (2).
      expect(
        fits[0].dismissBottom,
        'the two doors are not on one line – they should share ONE row now',
      ).toBeCloseTo(fits[1].dismissBottom, 6)
      const recordLink = w.findAll('button').find((b) => b.text() === 'The whole record')!
      const recordFit = assertDismissReachable(card, recordLink.element, vp, 'epilogue record link')
      expect(
        fits[0].dismissBottom,
        'the doors row is drawn on top of the record link – the tail walk is not seeing what is under the row',
      ).toBeLessThan(recordFit.dismissTop)
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


// =================================================================================================
// ⭐⭐⭐ SUCCESSION S2c – THE DOOR CARRIES THE LEGACY (docs/specs/succession-2026-10.md §8, S2c).
//
// The dynasty door already existed (wave 10): the ending's SECOND button – the one beside «Raise another» – emits `continueLine`, the shell holds
// the line and opens the prologue, and the ninth card creates the career. S2c puts the inheritance on that road: the shell asks the worker for it
// ONCE at the press (`game.loadLegacyInput`), holds it beside the line, hands it to the prologue and to the wizard (the skip), and they send it
// back on the create command. «Raise another» is a DIFFERENT door – an unrelated story – and never asks.
//
// ⚠ THE SHELL IS MOUNTED, NOT THE SCREEN ALONE: the claim is about where the answer ENDS UP (the prologue's prop), and a test of EndingScreen by
// itself sees none of it – r47-raise-another-route's own reasoning, and this is its harness. ⚠ `shallow: true` stubs the children, so the branch
// that won and the props it was handed are readable off the stub.
// ⚠ NOTHING HERE ASSERTS WORDING. Every label on these screens is the one that was already there, untouched (invariant 4).
// ⚠ THE CREATE CALL IS REACHED THROUGH THE COMPONENT'S OWN `begin()` / `start()` / `skipToDefaults()` with a finished run injected, because walking
// nine cards through a screen is a different test (prologue-walk) and the claim here is only what the ninth card SENDS.
//
// MUTATION-VERIFIED 06.10, each applied, this file run, and the source restored byte-identical (sha256 before = after):
//   · App's `pendingLegacy` as a `ref` instead of a `shallowRef`   -> 1 red: the shell arm (identity and the structured clone – the proxy that would
//                                                                     be a DataCloneError at the postMessage)
//   · App's door not asking (`loadLegacyInput` skipped)            -> 2 red: the shell arm and the refused-query arm
//   · the prologue's ninth card dropping `props.legacy`            -> 1 red: the sixth-argument arm
//   · the wizard's `start()` / `skipToDefaults()` dropping it      -> 1 red each: the skip arm, which asserts both calls
// =================================================================================================
describe('SUCCESSION S2c – the dynasty door carries the legacy', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  const MOTHER = { ...DEFAULT_PROFILE, kidName: 'Vera', kidLastName: 'Kowalski' }

  /** A real inheritance read off a real career by the engine's own reader: the blob has every field the wire really carries. */
  function legacyOf(over: Partial<LegacyInput> = {}): LegacyInput {
    return { ...legacyInputOf(createWorld('s2c-door-mother', MOTHER, 'c-s2c-mother')), ...over }
  }

  function lineOf(legacy: LegacyInput, over: Partial<DynastyHandover> = {}): DynastyHandover {
    return dynastyOf({
      generation: 2,
      childSeed: 's2c-door-mother:dynasty:2',
      background: 'wealthy',
      raisedOnTour: true,
      motherName: { first: legacy.motherName, last: legacy.surname },
      ...over,
    })
  }

  /** The shell on a finished career whose epilogue carries `line`, with the legacy query stubbed to answer `answer`.
   *  `seen` records whether the finished career was still the loaded one at the moment the query ran. */
  function mountShellOnEnding(line: DynastyHandover, answer: LegacyInput | null) {
    const game = useGameStore()
    game.init = vi.fn(async () => {})
    const seen: boolean[] = []
    const loadLegacyInput = vi.fn(async () => {
      seen.push(game.snapshot !== null)
      return answer
    })
    game.loadLegacyInput = loadLegacyInput
    const newCareer = vi.fn(async () => {})
    game.newCareer = newCareer
    const totals = { earnedCents: 0, spentCents: 0, prizeCents: 0 }
    game.$patch({
      ready: true,
      phase: 'ready',
      snapshot: {
        ageYears: 31,
        week: 900,
        kidRank: 11,
        fundsCents: 1234_00,
        careerId: 'career-s2c',
        profile: DEFAULT_PROFILE,
        careerTotals: totals,
        careerMoney: moneyOf({ ...totals, weeksLostToInjury: 0 }),
        ending: endingView({ dynasty: line }),
      } as unknown as Snapshot,
    })
    const wrapper = mount(App, {
      shallow: true,
      global: { stubs: { EndingScreen: false, PrimaryPill: false, Polaroid: false, Eyebrow: false } },
      attachTo: document.body,
    })
    wrapper.findComponent({ name: 'SplashScreen' }).vm.$emit('done')
    return { wrapper, loadLegacyInput, newCareer, seen }
  }

  async function settle(wrapper: ReturnType<typeof mount>): Promise<void> {
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))
    await wrapper.vm.$nextTick()
  }

  it('⭐⭐⭐ the press asks the worker ONCE, while the finished career is still loaded, and the prologue is handed what it answered', async () => {
    const legacy = legacyOf()
    const line = lineOf(legacy)
    const { wrapper, loadLegacyInput, newCareer, seen } = mountShellOnEnding(line, legacy)
    await settle(wrapper)
    expect(wrapper.findComponent({ name: 'EndingScreen' }).exists(), 'the epilogue is up').toBe(true)

    await wrapper.find('.ending-line').trigger('click')
    await settle(wrapper)

    expect(loadLegacyInput, 'one query at the press').toHaveBeenCalledTimes(1)
    expect(seen, 'asked after the finished career had been dropped – nothing would be left to read it from').toEqual([true])
    const prologue = wrapper.findComponent({ name: 'ChildhoodPrologue' })
    expect(prologue.exists(), 'the door leads to the childhood').toBe(true)
    expect(prologue.props('dynasty'), 'the line still travels').toEqual(line)
    // THE SAME OBJECT, NOT A COPY AND NOT A PROXY: the shell holds it in a `shallowRef`.
    expect(prologue.props('legacy'), 'the prologue was handed the answer').toBe(legacy)
    expect(() => structuredClone(prologue.props('legacy')), 'a reactive proxy cannot cross postMessage').not.toThrow()
    // ...and nothing was created at the press: the career is made on the ninth card.
    expect(newCareer, 'the door creates nothing').not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('⭐⭐ a refused query is a door without an inheritance – wave 10\'s line, unchanged, and never a dead end', async () => {
    const legacy = legacyOf()
    const line = lineOf(legacy)
    const { wrapper, loadLegacyInput } = mountShellOnEnding(line, null)
    await settle(wrapper)

    await wrapper.find('.ending-line').trigger('click')
    await settle(wrapper)

    expect(loadLegacyInput).toHaveBeenCalledTimes(1)
    const prologue = wrapper.findComponent({ name: 'ChildhoodPrologue' })
    expect(prologue.exists(), 'the press still reaches the childhood').toBe(true)
    expect(prologue.props('dynasty'), 'with the line').toEqual(line)
    expect(prologue.props('legacy'), 'and no inheritance').toBeUndefined()
    wrapper.unmount()
  })

  it('⭐⭐ «Raise another» is a different door: it never asks and it carries nothing', async () => {
    const legacy = legacyOf()
    const { wrapper, loadLegacyInput } = mountShellOnEnding(lineOf(legacy), legacy)
    await settle(wrapper)

    const pill = wrapper.findAll('button').find((b) => b.text().includes('Raise another'))
    expect(pill, 'the unrelated-story door is still on the epilogue').toBeTruthy()
    await pill!.trigger('click')
    await settle(wrapper)

    const prologue = wrapper.findComponent({ name: 'ChildhoodPrologue' })
    expect(prologue.exists()).toBe(true)
    expect(loadLegacyInput, 'a fresh story inherits nothing, so nothing is asked').not.toHaveBeenCalled()
    expect(prologue.props('legacy')).toBeUndefined()
    expect(prologue.props('dynasty')).toBeUndefined()
    wrapper.unmount()
  })

  /** A store whose `newCareer` records its arguments and, like the real action on a refusal, publishes nothing. */
  function recordingStore() {
    const game = useGameStore()
    const calls: unknown[][] = []
    game.newCareer = vi.fn(async (...args: unknown[]) => {
      calls.push(args)
    }) as unknown as typeof game.newCareer
    return calls
  }

  it('⭐⭐ the childhood opens on her mother\'s surname, locked, and the surname the legacy carries is that very name', () => {
    recordingStore()
    const legacy = legacyOf()
    const w = mount(ChildhoodPrologue, { props: { dynasty: lineOf(legacy), legacy }, attachTo: document.body })
    const last = w.find('#prologue-last').element as HTMLInputElement
    expect(last.value, 'the field is pre-filled with the family name').toBe(legacy.surname)
    expect(last.readOnly, 'and it is the line\'s, not the player\'s').toBe(true)
    w.unmount()
  })

  it('⭐⭐ an over-long inherited surname does not crash the card – it is shown whole, locked, and the create attempt leaves the card standing', async () => {
    const calls = recordingStore()
    const tooLong = 'K'.repeat(PROFILE_NAME_MAX_CHARS + 10)
    const legacy = legacyOf({ surname: tooLong })
    let w!: ReturnType<typeof mount>
    expect(() => {
      w = mount(ChildhoodPrologue, { props: { dynasty: lineOf(legacy), legacy }, attachTo: document.body })
    }, 'the card must mount').not.toThrow()
    const last = w.find('#prologue-last').element as HTMLInputElement
    expect(last.value, 'the whole name is shown').toBe(tooLong)
    expect(last.readOnly, 'the field stays the line\'s – nothing here edits it').toBe(true)
    expect(last.maxLength, 'the card\'s own cap is the profile\'s').toBe(PROFILE_NAME_MAX_CHARS)

    // The ninth card's press: the worker is the judge of the name (tests/succession-s2c-door.test.ts measures its refusal), the store swallows a refusal
    // into `store.error` and publishes nothing – so the card must be where the player left it, not stuck creating and not on a handover.
    const vm = w.vm as unknown as { run: unknown; begin(): Promise<void>; creating: boolean; handoverOpen: boolean }
    vm.run = completeRun('wealthy')
    await vm.begin()
    expect(calls, 'the create command was sent exactly once').toHaveLength(1)
    expect(vm.creating, 'a refused career does not strand the card on an empty ground').toBe(false)
    expect(vm.handoverOpen, 'and no handover is opened for a career that was not made').toBe(false)
    expect(w.find('.prologue-card').exists(), 'the card is still there').toBe(true)
    w.unmount()
  })

  it('⭐⭐⭐ the ninth card sends the legacy as the sixth argument – and nothing when the door had none', async () => {
    const calls = recordingStore()
    const legacy = legacyOf()
    const line = lineOf(legacy)

    const withLegacy = mount(ChildhoodPrologue, { props: { dynasty: line, legacy }, attachTo: document.body })
    const vm = withLegacy.vm as unknown as { run: unknown; begin(): Promise<void> }
    vm.run = completeRun('wealthy')
    await vm.begin()
    expect(calls, 'one create command').toHaveLength(1)
    expect(calls[0][0], 'on the line\'s own seed').toBe(line.childSeed)
    expect(calls[0][3], 'with the line').toEqual(line)
    // EQUALITY, NOT IDENTITY, in the direct-mount arms: VTU wraps a mounted component's props in a `reactive`, so `props.legacy` is a proxy of what was
    // passed. IDENTITY is the shell arm's claim (App's `shallowRef` hands the stub the raw object) and it is asserted there.
    expect(calls[0][5], 'and the inheritance, untouched').toEqual(legacy)
    withLegacy.unmount()

    const without = mount(ChildhoodPrologue, { props: { dynasty: line }, attachTo: document.body })
    const vm2 = without.vm as unknown as { run: unknown; begin(): Promise<void> }
    vm2.run = completeRun('wealthy')
    await vm2.begin()
    expect(calls, 'a second create command').toHaveLength(2)
    expect(calls[1][3], 'the line, as wave 10 sends it').toEqual(line)
    expect(calls[1][5], 'and no inheritance').toBeUndefined()
    without.unmount()
  })

  it('⭐⭐ the skip carries it too: both of the wizard\'s create calls send the legacy, so skipping the walk does not drop the inheritance', async () => {
    const calls = recordingStore()
    const legacy = legacyOf()
    const line = lineOf(legacy)
    const w = mount(OnboardingWizard, { props: { dynasty: line, legacy }, attachTo: document.body })
    const vm = w.vm as unknown as { start(): void; skipToDefaults(): void }
    vm.start()
    vm.skipToDefaults()
    expect(calls, 'two create commands').toHaveLength(2)
    for (const call of calls) {
      expect(call[3], 'the line rides').toEqual(line)
      expect(call[5], 'and so does the inheritance').toEqual(legacy)
    }
    w.unmount()

    const plain = mount(OnboardingWizard, { props: { dynasty: line }, attachTo: document.body })
    const vm2 = plain.vm as unknown as { start(): void }
    vm2.start()
    expect(calls[2][5], 'a line continued without one sends none').toBeUndefined()
    plain.unmount()
  })
})


// =================================================================================================
// ⭐⭐⭐ SUCCESSION W1 – «HER MOTHER'S CAREER LEAVES HER A HEAD START», THE LINE UNDER THE LOCK NOTE (docs/specs/succession-2026-10.md §8, W1 / W-S4),
// AND THE TWENTY-CHARACTER SURNAME ON THE SAME CARD.
//
// His ruling 14 (06.10): «да, звучит хорошо» – the sentence is his, so it is WRITTEN OUT HERE ON PURPOSE and not read off `LEGACY_COPY` (r37-name-cap's reasoning
// for its `CAP`): a test that compared the screen with the constant would stay green on any rewording, and the wording is the one thing an agent may not move
// (invariant 4).
//
// ⚠ THE CONDITION IS THE WALLET'S AND NOT A BAND'S NAME: the line is drawn when the start is richer than an ordinary one (`savingsMultiplier` above 1.0), so it is
// asserted at the table's three rows above the floor (1.3, 2.0, 3.0) and absent AT the floor, on a line that carries no legacy, and on an ordinary childhood.
// ⚠ ZERO OTHER STRINGS: the identity card's whole text with the sentence taken out equals the card a plain dynasty run draws – the prop adds ONE sentence.
// ⚠ THE POPUP LAW (round-20 #3): a sentence lengthens a blocking card, so the way on is measured inside 375x667 and 320x568 WITH the line drawn – and with a
// TWENTY-character surname, the cap's top. His ruling 13, 06.10: «мне кажется 20 более чем достаточно, лишь бы у нас верстка нигде не сыпалась из-за этого».
//
// MUTATION-VERIFIED 06.10, each applied, this file run and the source restored byte-identical (`cmp`) – the counts are in the spec's W1 line (§8).
// =================================================================================================
describe('SUCCESSION W1 – the head-start line (his ruling 14) and the twenty-character surname (his ruling 13)', () => {
  const HEAD_START = 'Her mother\'s career leaves her a head start.'
  const LOCK_NOTE = 'She is born into her mother\'s family and carries her name.'
  const MOTHER = { ...DEFAULT_PROFILE, kidName: 'Vera', kidLastName: 'Kowalski' }

  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  /** A real inheritance read off a real (fresh) career by the engine's own reader, with the multiplier posed. */
  const legacyAt = (savingsMultiplier: number): LegacyInput => ({
    ...legacyInputOf(createWorld('w1-line-mother', MOTHER, 'c-w1-mother')),
    savingsMultiplier,
  })
  const lineWith = (over: Partial<DynastyHandover> = {}): DynastyHandover =>
    dynastyOf({
      generation: 2,
      childSeed: 'w1-line-mother:dynasty:2',
      background: 'middle',
      raisedOnTour: true,
      motherName: { first: 'Vera', last: 'Kowalski' },
      ...over,
    })
  const mountPrologue = (props: { dynasty?: DynastyHandover; legacy?: LegacyInput }) =>
    mount(ChildhoodPrologue, { props, attachTo: document.body })
  const notesOf = (w: ReturnType<typeof mountPrologue>): string[] => w.findAll('.prologue-line-note').map((n) => n.text())
  const squash = (text: string): string => text.replace(/\s+/g, ' ').trim()

  it('⭐⭐⭐ a legacy career whose start is richer than an ordinary one says so – under the lock note, in the same note area, at every band above the floor', () => {
    for (const m of [1.3, 2.0, 3.0]) {
      const w = mountPrologue({ dynasty: lineWith(), legacy: legacyAt(m) })
      expect(notesOf(w), `x${m}: the lock note first and the head start right under it`).toEqual([LOCK_NOTE, HEAD_START])
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('⭐⭐⭐ and it is ABSENT wherever nothing is richer: at the floor (an ordinary start), on an ordinary dynasty run, on an ordinary childhood, and with a legacy but no line', () => {
    const cases: Array<[string, { dynasty?: DynastyHandover; legacy?: LegacyInput }, string[]]> = [
      ['a legacy at 1.0 – an ordinary start', { dynasty: lineWith(), legacy: legacyAt(1.0) }, [LOCK_NOTE]],
      ['an ordinary dynasty run – wave 10\'s line, no legacy', { dynasty: lineWith() }, [LOCK_NOTE]],
      ['an ordinary childhood', {}, []],
      ['a legacy with no line – the note area does not exist', { legacy: legacyAt(3.0) }, []],
    ]
    for (const [name, props, expected] of cases) {
      const w = mountPrologue(props)
      expect(notesOf(w), name).toEqual(expected)
      expect(w.text(), `${name}: the sentence is nowhere on the card`).not.toContain(HEAD_START)
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('⭐⭐ ZERO OTHER STRINGS: the identity card\'s text with the sentence taken out is the card a plain dynasty run draws', () => {
    const plain = mountPrologue({ dynasty: lineWith() })
    const plainText = squash(plain.text())
    plain.unmount()
    document.body.innerHTML = ''
    const rich = mountPrologue({ dynasty: lineWith(), legacy: legacyAt(3.0) })
    const richText = squash(rich.text())
    rich.unmount()
    expect(richText, 'the sentence is on the card').toContain(HEAD_START)
    expect(squash(richText.replace(HEAD_START, '')), 'and it is the only difference').toBe(plainText)
  })

  it('⭐⭐⭐ a TWENTY-character surname and the new line on the card: nothing breaks – the whole surname is in the locked field, the field can shrink in its column, and the way on stays on screen at 375x667 and 320x568', () => {
    const SURNAME = 'W'.repeat(PROFILE_NAME_MAX_CHARS) // the widest glyph at the cap, with nothing in it for a line break to take hold of
    expect(SURNAME, 'the cap is twenty (r37-name-cap holds the number)').toHaveLength(20)
    for (const vp of [PHONE, NARROW_PHONE]) {
      setViewport(vp) // BEFORE the mount: happy-dom caches a media query on the first computed-style read
      const w = mountPrologue({ dynasty: lineWith({ motherName: { first: 'Vera', last: SURNAME } }), legacy: legacyAt(3.0) })
      const last = w.find('#prologue-last').element as HTMLInputElement
      expect(last.value, `${vp.width}: all twenty characters reach the field`).toBe(SURNAME)
      expect(last.readOnly, `${vp.width}: locked`).toBe(true)
      expect(notesOf(w), `${vp.width}: the head-start line is drawn beside it`).toEqual([LOCK_NOTE, HEAD_START])
      // SHRINK-SAFE. A grid item and a flex item both default to `min-width: auto` – their content's width – which is the one thing that would let twenty wide
      // letters push the card past the screen. Both are `0` in the cascade (`.prologue-names .prologue-field`, `.prologue-field-row .prologue-input`), and an
      // unset value ('' or 'auto') does not match.
      for (const el of [last.closest('.prologue-field')!, last]) {
        expect(getComputedStyle(el).minWidth, `${vp.width}: ${el.className} may shrink below its content`).toMatch(/^0(px)?$/)
      }
      assertDismissReachable(
        document.querySelector('.prologue-card')!,
        document.querySelector('.prologue-answers')!,
        vp,
        `the identity card with a ${SURNAME.length}-letter surname and the head-start line, ${vp.width}x${vp.height}`,
      )
      w.unmount()
      document.body.innerHTML = ''
    }
    setViewport(PHONE)
  })
})

// =================================================================================================
// ⭐⭐ 08.10 (loc/intake tail) – THE YELLOW DOOR IS THE LINE, NOT THE FRESH START. The owner:
// «наверное эту кнопку надо желтой сделать, а не соседнюю, которая про новый старт» – the accent
// belongs to the door that CONTINUES her story. Mutation: swap the two variants back in
// EndingScreen.vue's pair branch and both arms go red; the college branch is NOT in this claim
// (its lone «Another year –» keeps `cta` as the only way forward there).
// =================================================================================================
describe('08.10 – the accent sits on the line door', () => {
  it('the line door is cta and «Raise another» is ghost, in the pair branch', () => {
    const w = mountEpilogue(endingView({ dynasty: dynastyOf({ raisedOnTour: true }) }))
    const line = w.get('.ending-line').element
    const start = w.get('.ending-door-start').element
    expect(line.classList.contains('tb-pill--cta'), 'the line door carries the yellow').toBe(true)
    expect(line.classList.contains('tb-pill--ghost')).toBe(false)
    expect(start.classList.contains('tb-pill--ghost'), '«Raise another» went quiet').toBe(true)
    expect(start.classList.contains('tb-pill--cta')).toBe(false)
  })
})
