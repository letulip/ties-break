// ⭐⭐ E-08 / T4.7 – THE THREE POPUPS OUTSIDE THE FOCUS-MANAGED SET, AND THE ONE THAT WAS LENGTHENED
// AFTER THE POPUP LAW WITHOUT ITS PHONE NET.
//
// THE CENSUS (docs/review-principles-2026-09-26/05-ui.md, E-08). Sixteen components called
// `useDialogFocus`; three did not:
//
//   * `EndingScreen.vue` – `role="dialog" aria-modal="true"` and NO focus management, which
//     `composables/dialogFocus.ts` calls worse than neither in its own first paragraph: `aria-modal`
//     tells assistive technology to ignore everything outside the card while Tab is still free to walk
//     into it. This is U-06's second half, carried.
//   * `MatchViewer.vue`'s `.mv-hurt` – a `role="alertdialog"` card with no `aria-modal` and no focus
//     move, so an alertdialog that does not take focus is not reliably announced. It gained a
//     paragraph in `9cd78d8f` (08.09, round 39 #15a), AFTER the popup law was written, and neither of
//     its two test files measured its dismiss box at all.
//   * `TierGuide.vue` – no role, no trap, no Escape, no phone net, on the very `.guide-card` U-06
//     already fixed for its sibling `RankHelpDialog.vue`.
//
// ⚠⚠ WHAT THE PHONE NET CAN AND CANNOT PROVE, SAID PLAINLY, BECAUSE THE ROUND-20 FIX IS WHY. With
// `.dialog-card`'s `max-height: 100%; overflow-y: auto` in place, NO amount of content can push the
// dismiss control off a 375x667 screen – that is the content-independent half round-20 #4 asked for,
// and it is what `assertDismissReachable` turns on. So the arms that redden this file are the ones
// that take that guarantee away, and they were run rather than reasoned about (full outputs in the
// wave's report):
//
//   ARM A · THE CARD LENGTHENED UNTIL THE WAY OUT LEAVES THE SCREEN, WITH THE SHARED CAP UNTOUCHED.
//           The note's paragraph repeated SIX TIMES BELOW `.dialog-actions` in MatchViewer's own
//           template – content growing UNDER the way out, which is the one lengthening a `max-height`
//           cannot rescue, because `tailBelow` is what puts the control on the screen. RED:
//             «card 320x635 (content wants at least 1201, cap 635, card scrolls) – the dismiss
//              control sits at y=-322..-284, outside the viewport»
//           The shipped card at the same viewport is green at y=420..458 with the longest note and
//           y=347..386 with none (the case prints both). Three repeats instead of six is still GREEN at
//           y=137..175, which is what «until the control leaves the viewport» means as a number: the
//           arm was grown until it did.
//   ARM B · the round-20 defect itself – `.dialog-card`'s `max-height`/`overflow-y` killed by an
//           injected `!important` override (the TEST layer, so `src/` is untouched). RED on the
//           content-independent sentence, which is the half that keeps holding after the next honest
//           paragraph is added:
//             «cap NONE, card does NOT scroll, 635px of room – the card declares no height bound that
//              fits, so its height is whatever its content happens to be»
//           ⚠ It reddens on the FIRST of the case's two mounts, so this arm can never also produce the
//           y-coordinate sentence; ARM A is the one that does, and it does it with the cap in place,
//           which is strictly the harder claim.
//   ARM C · `useDialogFocus` removed from each of the three surfaces in turn → 2 red on that surface
//           and that surface only: its focus case and its containment case, on all three.
//   ⚠⚠ AND ONE ARM THAT CAUGHT THE TEST RATHER THAN THE CODE, which is why `pressTab` takes a ring
//   with a decoy at EACH END. Handed the card's own controls alone, the emulated step off the last one
//   lands on `undefined`, focus stays put, and `card.contains(...)` passed with the trap REMOVED – on
//   all three surfaces. The first run of ARM C reddened 1 case where it should have reddened 2, and
//   that discrepancy is what found it.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read (fits.ts's own note beside `TABLET`): happy-dom
// evaluates a media query on an element's first computed-style read and caches it.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'

// The hurt popup plays a cue on dismiss and the viewer primes audio on mount; audio has no business
// in a focus test (the injury-surfacing file's own rule).
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: () => {},
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

import EndingScreen from '../../src/components/EndingScreen.vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import TierGuide from '../../src/components/TierGuide.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { KID_ID } from '../../src/engine/world'
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import type { AlbumPage, EndingView, Snapshot } from '../../src/shared/protocol'
import { PHONE, assertDismissReachable, measureDialog, setViewport } from './fits'

const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

const SKIP_LABEL = 'Skip to the result'

/** ⚠ A FIXTURE, NOT PRODUCT COPY – the longest thing a caller could hand `hurtNote`. The one live
 *  caller passes `LOCAL_OPEN_COPY.hurtNote`; this is the same axis stretched, which is how the popup
 *  law asks a card to be measured («a dialog grows by one honest sentence at a time»). */
const LONGEST_NOTE =
  'She is alright, and she will play again. The physio looked her over on the bench and there is nothing ' +
  'torn and nothing broken in there, only a leg that had had enough of a long afternoon in the heat. ' +
  'She will be sore tomorrow and stiff the day after, and then she will be bored, and then she will ask ' +
  'when the next one is, because that is who she is and it always has been.'

/** ⚠ THE PLAYER'S BOX IS THE ONE THAT MATTERS, so the dismiss control is read off the DOM rather than
 *  assumed to be last: `tailBelow` walks whatever sits under it (fits.ts). */
function dismissOf(card: Element): Element {
  const actions = card.querySelector('.dialog-actions')
  if (!actions) throw new Error('the hurt card has no actions row – there is no way out to measure')
  return actions
}

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}

/** A real seeded match with HER in it and a retirement written on the record – `result.retired` is the
 *  only fact the viewer reads about it, and the engine writes exactly this shape. Carried verbatim
 *  from tests/component/round39-prologue-injury.test.ts, which carried it from match-viewer's own. */
function herRetirement() {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'w4-e08' }
  const match = annotateMatch(simulateMatch(a, b, opts), a, b, opts)
  const her = { ...a, id: KID_ID }
  const hurt: AnnotatedMatch = {
    ...match,
    result: { ...match.result, retired: { side: 0, pointNumber: match.points.length } },
  }
  return { her, opp: b, match: hurt }
}

/** The viewer, skipped to the end so the retirement popup is up. */
async function mountHurt(hurtNote?: string): Promise<VueWrapper> {
  const { her, opp, match } = herRetirement()
  const wrapper = mount(MatchViewer, {
    props: {
      match,
      playerA: her,
      playerB: opp,
      surface: 'hard' as const,
      mode: 'replay' as const,
      proceedLabel: 'Go on',
      ...(hurtNote === undefined ? {} : { hurtNote }),
    },
    attachTo: document.body,
  })
  const skip = wrapper.findAll('button').find((b) => b.text() === SKIP_LABEL)
  expect(skip, `no control labelled "${SKIP_LABEL}"`).toBeTruthy()
  await skip!.trigger('click')
  await nextTick()
  await nextTick()
  expect(wrapper.find('.mv-hurt').exists(), 'no popup for an injury inside the match').toBe(true)
  return wrapper
}

/** ⚠ THE EPILOGUE'S FIXTURE IS `wave10-dynasty-door.test.ts`'S, WHICH IS THE HOUSE SHAPE FOR THIS
 *  SCREEN, and the keys are why it is borrowed rather than written: the album is `view.album` and the
 *  resume week is `view.handoff.resumesWeek`, so an invented `pages` or `resumes` draws an epilogue
 *  with no album and no footer while every root-level assertion below still passes. Seven pages, which
 *  is what the engine hands, so «the first focusable is an album ARROW» is measured on the screen a
 *  player gets. */
function endingView(): EndingView {
  const totals = { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
  return {
    ending: { type: 'natural', week: 900, ageYears: 31, detail: 'she stopped at thirty-one', resumesWeek: null },
    album: [0, 1, 2, 3, 4, 5, 6].map(
      (slot) =>
        ({
          slot,
          why: `why ${slot}`,
          caption: `caption ${slot}`,
          fact: `fact ${slot}`,
          week: 52 * slot,
          seasonIndex: slot,
          stage: 'teen',
          emotion: 'norm',
          empty: false,
        }) as AlbumPage,
    ),
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
  } as EndingView
}

/** The epilogue, mounted over an ended career – `mountEpilogue`'s own store shape. */
function mountEnding(): VueWrapper {
  useGameStore().$patch({
    snapshot: {
      ageYears: 31,
      week: 900,
      kidRank: 11,
      fundsCents: 1234_00,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
      ending: endingView(),
    } as unknown as Snapshot,
  })
  return mount(EndingScreen, { attachTo: document.body })
}

/** One Tab press: the trap's half is the REAL document listener, the platform's half (stepping to the
 *  next thing in the document's tab order when nobody called `preventDefault`) is emulated, because
 *  happy-dom has no sequential focus navigation at all. r2-07-dialog-shell.test.ts's helper in shape.
 *
 *  ⚠⚠ THE RING INCLUDES THE CONTROLS OUTSIDE THE CARD, AND THAT WAS FOUND BY MUTATING RATHER THAN
 *  REASONED ABOUT. Handed the card's own controls alone, the emulated step off the LAST one lands on
 *  `undefined` and focus simply stays where it was – inside the card – so `card.contains(...)` passed
 *  with the trap REMOVED, on all three surfaces. A walk that cannot leave the ring cannot discriminate.
 *  With a decoy at each end the platform's half can do what a browser does, and the only thing that
 *  keeps focus inside is the trap. */
function pressTab(ring: HTMLElement[], shift = false): void {
  const before = document.activeElement as HTMLElement | null
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true })
  ;(before ?? document.body).dispatchEvent(event)
  if (event.defaultPrevented) return
  const i = before ? ring.indexOf(before) : -1
  ring[i + (shift ? -1 : 1)]?.focus()
}

function controlsIn(card: Element): HTMLElement[] {
  return [...card.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])')]
}

/** A control OUTSIDE the card, which is the thing `aria-modal` promises a screen reader is not there.
 *  The whole point of the trap is that Tab cannot land on it. */
function decoyOutside(where: 'before' | 'after'): HTMLButtonElement {
  const decoy = document.createElement('button')
  decoy.textContent = `behind the scrim (${where})`
  if (where === 'before') document.body.prepend(decoy)
  else document.body.appendChild(decoy)
  decoys.push(decoy)
  return decoy
}

/** The document's tab order as this test models it: a control behind the scrim, the card's own
 *  controls, and another control behind the scrim. See `pressTab` for why both ends are needed. */
function tabRing(card: Element): { ring: HTMLElement[]; items: HTMLElement[]; before: HTMLButtonElement; after: HTMLButtonElement } {
  const before = decoyOutside('before')
  const after = decoyOutside('after')
  const items = controlsIn(card)
  expect(items.length, 'a card with no control has nothing to trap – this assertion would be vacuous').toBeGreaterThan(0)
  return { ring: [before, ...items, after], items, before, after }
}

let wrappers: VueWrapper[] = []
let decoys: HTMLElement[] = []

function track<T extends VueWrapper>(w: T): T {
  wrappers.push(w)
  return w
}

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
  setViewport(PHONE)
})

afterEach(() => {
  for (const w of wrappers) w.unmount()
  for (const d of decoys) d.remove()
  wrappers = []
  decoys = []
  document.body.innerHTML = ''
})

// =================================================================================================
// THE EPILOGUE – a blocking takeover that announced modality and did not contain the keyboard
// =================================================================================================
describe('E-08 · EndingScreen – the takeover holds the keyboard it told a screen reader to trust', () => {
  it('⭐⭐ it is still the same modal, and focus is INSIDE it the moment it is drawn', async () => {

    const before = decoyOutside('before')
    before.focus()

    const wrapper = track(mountEnding())
    await nextTick()

    const card = wrapper.find('.ending')
    expect(card.exists(), 'the epilogue drew nothing – every arm below would be vacuous').toBe(true)
    expect(card.attributes('role'), 'the announcement it always made').toBe('dialog')
    expect(card.attributes('aria-modal')).toBe('true')
    // ⚠ WITHOUT THIS THE TRAP HAS NOWHERE TO PUT FOCUS – the composable's own precondition.
    expect(card.attributes('tabindex'), 'the takeover cannot take focus at all').toBe('-1')

    // ROUND 42 #8 – focus lands on the CARD and never on an album arrow, because the epilogue arrives
    // on the advance that ended the career and a held Enter would turn her first page unread.
    expect(document.activeElement, 'focus is still behind the takeover').toBe(card.element)
  })

  it('⭐⭐ Tab cannot walk out of it, in either direction', async () => {

    const wrapper = track(mountEnding())
    await nextTick()
    const card = wrapper.find('.ending').element
    const { ring, items, after } = tabRing(card)

    // Forwards off the LAST control wraps to the first rather than reaching the shell behind.
    items[items.length - 1].focus()
    pressTab(ring)
    expect(card.contains(document.activeElement), 'Tab left the epilogue for the shell behind it').toBe(true)

    // ...and backwards, which a one-directional trap gets wrong.
    items[0].focus()
    pressTab(ring, true)
    expect(card.contains(document.activeElement), 'Shift+Tab left the epilogue').toBe(true)

    // ...and a press that arrives while something else ALREADY has focus pulls it back, which is the
    // one press `dialogFocus.ts` listens on the document in capture mode for. ⚠ No platform half here
    // on purpose: emulating a step would move focus into the card by itself and prove nothing.
    after.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(card.contains(document.activeElement), 'focus stayed on a control a modal had hidden').toBe(true)
  })

  it('⚠⚠ ESCAPE IS NOT A WAY OUT – the career is over and the footer owns the ways forward', async () => {

    const wrapper = track(mountEnding())
    await nextTick()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.find('.ending').exists(), 'Escape dismissed a blocking takeover').toBe(true)
    expect(wrapper.emitted('newCareer'), 'Escape answered for the player').toBeUndefined()
    expect(wrapper.emitted('continueLine'), 'Escape answered for the player').toBeUndefined()
  })
})

// =================================================================================================
// `.mv-hurt` – the alertdialog that did not take focus, and the card nobody had measured
// =================================================================================================
describe('E-08 · MatchViewer `.mv-hurt` – announced, contained, and inside a phone', () => {
  it('⭐⭐ it is modal now, and focus is on the card rather than on the way out', async () => {
    const wrapper = track(await mountHurt())
    const card = wrapper.find('.mv-hurt')
    expect(card.attributes('role'), 'the report is still an alertdialog').toBe('alertdialog')
    expect(card.attributes('aria-modal'), 'an alertdialog that is not modal reaches the page behind it').toBe('true')
    expect(card.attributes('tabindex')).toBe('-1')
    expect(card.attributes('aria-labelledby')).toBe('mv-hurt-title')

    // ROUND 42 #8, and here it is load-bearing: a SKIP press is one of the things that raises this
    // card, Enter activates a button on the keydown REPEAT, so landing focus on «Stay with her» would
    // let a held press dismiss an injury report before it was read.
    expect(document.activeElement, 'focus is not inside the card the scrim is blocking').toBe(card.element)
  })

  it('⭐⭐ Tab is contained, and Escape is the keyboard spelling of the backdrop tap it already had', async () => {
    const wrapper = track(await mountHurt())
    const card = wrapper.find('.mv-hurt').element
    const { ring, items, after } = tabRing(card)

    // Off the last control, forwards – the decoy is where a browser would go.
    items[items.length - 1].focus()
    pressTab(ring)
    expect(card.contains(document.activeElement), 'Tab reached the match behind the scrim').toBe(true)

    // ...and the press that arrives from outside, with no platform half emulated.
    after.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(card.contains(document.activeElement), 'focus stayed behind the scrim').toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.find('.mv-hurt').exists(), 'Escape is not a way out of a card the mouse can already close').toBe(false)
    // ...and the match is still underneath, which is the whole item: the popup is not a door out.
    expect(wrapper.find('.mv-court, canvas').exists() || wrapper.text().length > 0).toBe(true)
  })

  it('⭐⭐⭐ THE POPUP LAW – the way out is inside a 375x667 phone, with the shipped note and with the longest one', async () => {
    // ⚠ MEASURED WITH THE CARD AT ITS TALLEST. Round 39 #15a added a paragraph to this card AFTER the
    // law was written and measured nothing, so both ends of the growth axis are measured here: no
    // note at all, and the longest a caller could hand it.
    const plain = track(await mountHurt())
    const plainCard = document.querySelector('.mv-hurt')!
    const bare = assertDismissReachable(plainCard, dismissOf(plainCard), PHONE, '.mv-hurt (no note)')
    expect(bare.scrollable, 'the card is bounded but nothing scrolls, so the rest is gone for good').toBe(true)
    plain.unmount()
    wrappers = wrappers.filter((w) => w !== plain)
    document.body.innerHTML = ''

    const long = track(await mountHurt(LONGEST_NOTE))
    const card = document.querySelector('.mv-hurt')!
    expect(card.textContent, 'the longest note is not on the card being measured').toContain('bored')
    const fit = assertDismissReachable(card, dismissOf(card), PHONE, '.mv-hurt (longest note)')

    // ⚠ THE CONTENT-INDEPENDENT HALF, which is the one that keeps holding after the next honest
    // sentence is added – and it is what ARM A and ARM B in this file's header take away.
    expect(fit.cap, `the cap is ${fit.cap} against ${fit.available.height}px of phone`).toBeLessThanOrEqual(fit.available.height)
    expect(fit.scrollable, 'bounded with no scroller hides the way out for good').toBe(true)

    // ...and the longest note really is the taller card, so the two measurements are not the same one
    // twice – the «comparing a thing with itself» null result this repo has already paid for.
    expect(fit.contentFloor, 'the longest note did not make the card any taller').toBeGreaterThan(bare.contentFloor)

    // ⚠ THE NUMBERS ARE PRINTED, on the precedent of this project's contrast cases: a green fit
    // verdict that states no box is a claim nobody can check against the next wave's measurement.
    for (const [what, f] of [['no note', bare], ['longest note', fit]] as const) {
      console.log(
        `.mv-hurt (${what}) at ${PHONE.width}x${PHONE.height}: card ${f.cardWidth.toFixed(0)}x${f.cardHeight.toFixed(0)} ` +
          `(content wants ${f.contentFloor.toFixed(0)}, cap ${f.cap.toFixed(0)}, ${f.available.height.toFixed(0)}px of room), ` +
          `the way out at y=${f.dismissTop.toFixed(0)}..${f.dismissBottom.toFixed(0)}`,
      )
    }
  })
})

// =================================================================================================
// TierGuide – RankHelp's own treatment, on RankHelp's own box
// =================================================================================================
describe('E-08 · TierGuide – the last roleless overlay takes its sibling\'s fix', () => {
  function mountGuide(): VueWrapper {
    useGameStore().snapshot = careerSnapshot(40, 'e08-guide')
    return track(mount(TierGuide, { attachTo: document.body }))
  }

  it('⭐⭐ it is a dialog, it is modal, and its own title is its name', () => {
    const wrapper = mountGuide()
    const card = wrapper.find('.guide-card')
    expect(card.attributes('role'), 'getByRole(\'dialog\') still finds nothing while it is open').toBe('dialog')
    expect(card.attributes('aria-modal')).toBe('true')
    expect(card.attributes('tabindex')).toBe('-1')
    const named = card.attributes('aria-labelledby')
    expect(named, 'the card is announced with no name at all').toBe('tier-guide-title')
    const title = document.getElementById(named!)
    expect(title, 'the name points at nothing in the document').toBeTruthy()
    expect(title!.textContent?.trim(), 'the owner\'s title moved').toBe('Tour guide')
    // ⚠ NOT ONE WORD MOVED: the six column headings are what they were.
    for (const heading of ['Tier', 'Opens at', 'Draw', 'Entry fee', 'Travel', 'Points (W / F / SF / …)']) {
      expect([...card.element.querySelectorAll('th')].map((th) => th.textContent?.trim())).toContain(heading)
    }
    // ⚠ FOCUS LANDS ON THE FIRST CONTROL, WHICH IS RANKHELP'S OWN BEHAVIOUR ON THIS BOX and is the
    // composable's default: the Close commits nothing, so landing on it is the shell's convention.
    // `focusOn: 'card'` belongs to the cards where the first control is an ANSWER, and this is a
    // reference table.
    expect(card.element.contains(document.activeElement), 'focus never entered the card').toBe(true)
    expect(document.activeElement, 'focus did not land on the way out').toBe(card.element.querySelector('.replay-close'))
  })

  it('⭐⭐ Tab is contained, and Escape closes it the way the backdrop already did', async () => {
    const wrapper = mountGuide()
    const card = wrapper.find('.guide-card').element
    const { ring, items, after } = tabRing(card)

    items[items.length - 1].focus()
    pressTab(ring)
    expect(card.contains(document.activeElement), 'Tab left the guide for the screen behind it').toBe(true)

    after.focus()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(card.contains(document.activeElement), 'focus stayed on the screen behind the scrim').toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.emitted('close'), 'Escape is not a way out of a card the mouse can already close').toHaveLength(1)
  })

  it('⚠ and it is bounded by the phone it is drawn on, with a way to reach what is past the fold', () => {
    // RankHelp's own bespoke bound check (round36-rank-help-dialog.test.ts:120-140), asserted HERE too
    // rather than assumed off the shared class: the close is PINNED at the card's top instead of last
    // in the flow, so `measureDialog`'s «read the dismiss box off the bottom edge» does not describe
    // this card. What does is round-20 #3's actual fix, and it is content-independent.
    const wrapper = mountGuide()
    const card = wrapper.find('.guide-card').element
    const cs = getComputedStyle(card)
    const cap = parseFloat(cs.maxHeight)
    expect(Number.isFinite(cap), 'the card declares no height bound, so it is as tall as its content').toBe(true)
    expect(cap, `the bound is ${cs.maxHeight} against ${PHONE.height}px of phone`).toBeLessThanOrEqual(PHONE.height)
    expect(cs.overflowY, 'bounded with no scroller hides the rest for good').toBe('auto')

    const close = card.querySelector('.replay-close')
    expect(close, 'the card has no close control').toBeTruthy()
    expect(getComputedStyle(close!).position, 'the way out can be scrolled away from the player').toBe('absolute')
  })
})

// =================================================================================================
// ⚠ AND THE INSTRUMENT IS NOT VACUOUS – it really does read a box off the real cascade
// =================================================================================================
describe('E-08 · the measurement itself', () => {
  it('⚠ `measureDialog` reads a real box for `.mv-hurt`, so a green verdict means something', async () => {
    track(await mountHurt(LONGEST_NOTE))
    const card = document.querySelector('.mv-hurt')!
    const fit = measureDialog(card, dismissOf(card), PHONE)
    expect(fit.shape, 'the hurt popup is the round-20 shape: an inert scrim round a bounded card').toBe('card-scrolls')
    expect(fit.cardHeight, 'the card measures as nothing at all').toBeGreaterThan(0)
    expect(fit.dismissBottom - fit.dismissTop, 'the way out has no height, so there is nothing to press').toBeGreaterThan(0)
  })
})
