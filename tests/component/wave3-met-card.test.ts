// =================================================================================================
// WAVE 3, T6 – THE `met` CARD, MOUNTED. «There is someone», on a phone.
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T6, and CLAUDE.md's round-20 popup law: «any dialog
// you add or lengthen gets a mounted assertion that its dismiss control's box is inside a 375x667
// viewport, and prove it by mutating: a test that cannot fail on the too-tall version is not this
// test.» T6 does not add a component – `LifeBeatDialog.vue` renders the new kind through the same
// `buildLifeBeatPrompt` contract – but it adds a CARD, with copy of its own and a fourth answer, and
// the law is about cards.
//
// ⚠⚠ THE PROMPT HERE IS THE ENGINE'S OWN AND NOT A FIXTURE, which is the one way this file differs
// from `life-beat-dialog.test.ts` and it is deliberate. That file's fixture exists because the
// engine's pools landed in the same wave as its component; this card's pools are ON THIS TREE, so
// the honest question is whether THE SHIPPED DRAFT fits a phone – a fixture would answer it about a
// sentence nobody will read (the v48 lesson recorded in `renderAll`: a budget measured on the string
// "null").
//
// ⚠ THE STRINGS IT REACHES ARE DRAFTS FOR THE OWNER (invariant 4). Nothing below asserts a word of
// them: what is pinned is «her voice is on the close card», «no voice of hers on the strained one»,
// «the component adds no sentence», and the boxes.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was really run against the real component, watched going red,
// and put back. The count in brackets is what the mutation actually reddened, because a mutation
// that reddens the WRONG case is as much a finding as one that reddens nothing.
// =================================================================================================
//
//   ARM A  `.dialog-card`'s cap removed on the TOO-TALL met card (`max-height: none; overflow-y:
//          visible`) -> RED [1]: «the content is taller than the screen and nothing scrolls, so the
//          part past the fold cannot be reached at all». Round-20 #3 reproduced on THIS card.
//          ⚠ RUN INSIDE ITS OWN CASE rather than out of band, and restoring the two declarations
//          turns it green again in the same case – which is what says the CAP is what holds.
//
//   ARM B  the cap removed on TODAY'S REAL COPY, which fits unaided -> RED [1] on the
//          content-independent half: «the card declares no height bound that fits». That is the arm
//          that still holds after somebody adds a sentence, and it is why both are here: ARM A
//          cannot run on a card that fits, and ARM B proves nothing about one that does not.
//
//   ARM C  a `<p>` appended inside the card after `.life-beat-choices` (the answers no longer last
//          in the flow) -> RED [1] on the structural precondition, before any box is measured. Also
//          run in its own case, because every number in this file is wrong without it.
//
//   ARM D  `metRegisterOf` returns `'her'` for every band (engine-side, `world/lifeBeat.ts`)
//          RED [1] · «⭐⭐ a strained home's card carries no line of hers: expected 'She said it
//          while she put the shoppin…' not to contain '"'».
//          ⚠⚠ AND THE POSITIVE HALF OF THE SAME CASE STAYED GREEN, which is the whole reason the two
//          halves are one case: a negative assertion is worthless unless its target is proved to
//          exist, and here the close card's quotation is what proves it.
//
//   ARM E  a kicker (`<p class="met-kicker">Her week</p>`) above the heading in the template
//          RED [1] · «the heading, her line, and the four labels – and nothing else: expected
//          [ 'Her week', …(6) ] to deeply equal [ …(6) ]»
//
// ⚠⚠ TWO TRAPS THIS FILE IS WRITTEN AROUND, both measured in this repo and both recorded in
// `life-beat-dialog.test.ts`'s own ledger: Vue 3 binds `@click` through `addEventListener`, so
// `attributes('onclick')` is ALWAYS undefined and an assertion on it can never fail; and `mount()`
// renders DETACHED, so `document.querySelector` returns null and a card that is not there reads
// exactly like a card with nothing wrong. Nothing below reads an `onclick` attribute, every mount is
// `attachTo: document.body`, and `mountAttached` asserts the card is really in the document.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN STYLESHEET. Without it `var(--text)` resolves to nothing and `measureDialog`
// refuses outright – every box and every colour below would be vacuous.
import '../../src/style.css'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, deliverKnownPartner, toSnapshot, raiseLifeBeat } from '../../src/engine/world'
import { bondBandOf } from '../../src/engine/spirit'
import { DEFAULT_PROFILE, type BondBand, type LifeBeatPrompt, type Snapshot } from '../../src/shared/protocol'

/** The lowest `bond` that still reads as this band – asked of the ladder, never re-derived. */
function bondFor(band: BondBand): number {
  for (let b = 0; b <= 100; b += 0.5) if (bondBandOf(b) === band) return b
  throw new Error(`no bond value reads as ${band}`)
}

/** A REAL snapshot of a world that has just been told there is someone, at the bond band asked for.
 *  Everything on it is the engine's: the prompt, its heading, her line and the four answers. */
function toldSnapshot(band: BondBand, seed = 'met-card'): Snapshot {
  const world = createWorld(`${seed}-${band}`, DEFAULT_PROFILE)
  world.season = []
  world.week = 900
  world.bond = bondFor(band)
  world.loveEpisodes = [{ id: 'p:890', sinceWeek: 890, endedWeek: null, knownWeek: 900, wants: 'open', partnerId: 'p:890' }]
  deliverKnownPartner(world)
  const snap = toSnapshot(world)
  expect(snap.lifeBeatPrompt, `${band}: the engine really raised a card`).not.toBeNull()
  expect(snap.lifeBeatPrompt!.kind, 'and it is the met beat').toBe('met')
  return snap
}

/** The FORK's card, from the same machinery – the positive control for every «the met card does not
 *  have this» assertion below. A negative that never proves its target exists is not a test. */
function forkSnapshot(): Snapshot {
  const world = createWorld('met-card-fork-control', DEFAULT_PROFILE)
  world.season = []
  world.bond = bondFor('close')
  raiseLifeBeat(world, 'fork-opinion', 'tour')
  const snap = toSnapshot(world)
  expect(snap.lifeBeatPrompt!.kind).toBe('fork-opinion')
  return snap
}

/** Attached to the document, which is the only place the cascade is the player's. ⚠ VIEWPORT FIRST:
 *  happy-dom resolves lengths at `getComputedStyle` time and caches a media query on an element's
 *  first read, so a size set after the mount measures the previous screen. */
function mountAttached(snapshot: Snapshot, vp = PHONE) {
  setViewport(vp)
  useGameStore().snapshot = snapshot
  const w = mount(LifeBeatDialog, { attachTo: document.body })
  // ⚠ `attachTo: document.body` IS WHAT MAKES THIS QUERY WORK AT ALL – a plain `mount()` renders
  // DETACHED and `document.querySelector` comes back null, which reads exactly like a card that is
  // not there. The truthiness assertion below is the guard against that mistake ever being silent.
  const card = document.querySelector('.life-beat-dialog')!
  expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
  return { w, card }
}

/** Whitespace-insensitive text, so the template's own indentation is not part of any claim. */
const flat = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()

/** Every run of text the card actually prints, in reading order. TEXT NODES and not `textContent`:
 *  a joined string would depend on the compiler's whitespace condensing and read as one run. */
function printed(el: Node, out: string[] = []): string[] {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = flat(node.textContent)
      if (text) out.push(text)
    } else {
      printed(node, out)
    }
  }
  return out
}

/** ⚠ THE STRUCTURAL PRECONDITION, ASSERTED BEFORE ANY MEASUREMENT (ARM C). `measureDialog` reads the
 *  control's box off the CARD's own bottom edge, so the answers must be the last thing in the flow –
 *  anything appended after them would make every number here quietly wrong while every assertion
 *  stayed green. */
function lastControl(card: Element): Element {
  const choices = card.querySelector('.life-beat-choices')!
  expect(choices, 'the answers are on the card').toBeTruthy()
  expect(card.lastElementChild, 'the answers are the card\'s last element').toBe(choices)
  const last = choices.lastElementChild!
  expect(last.classList.contains('life-beat-choice'), 'and the last of them is an answer').toBe(true)
  return last
}

describe('wave 3 T6 – the `met` card on a phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⚠⚠ ROUND-20: the LAST ANSWER is inside a 375x667 screen, and the card is bounded and scrolls', () => {
    const { w, card } = mountAttached(toldSnapshot('close'))
    const fit = assertDismissReachable(card, lastControl(card), PHONE, 'the met card')
    expect(fit.available.height, 'the scrim leaves 667 minus its own 16 either side').toBe(635)
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    // FOUR answers on this card, not the fork's three – the thing that made it taller in the first
    // place, asserted so the measurement is known to be about the card this wave ships.
    expect(card.querySelectorAll('.life-beat-choice').length, 'four reactions').toBe(4)
    w.unmount()
  })

  it('⚠⚠ ...at every band, because the card exists at every band', () => {
    for (const band of ['close', 'steady', 'strained', 'cold'] as BondBand[]) {
      const { w, card } = mountAttached(toldSnapshot(band))
      assertDismissReachable(card, lastControl(card), PHONE, `the met card (${band})`)
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('...and on the narrowest screen the app supports', () => {
    const { w, card } = mountAttached(toldSnapshot('close'), NARROW_PHONE)
    assertDismissReachable(card, lastControl(card), NARROW_PHONE, 'the met card (320x568)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF (ARM A) – round-20 #3 put back on a long met card, and the SAME assertion goes red', () => {
    // A beat is copy, and copy grows: «a dialog grows by one honest sentence at a time and nothing
    // objects until it is taller than a phone». This is that card.
    const snap = toldSnapshot('close')
    const long = 'She has been turning it over for weeks and this is the whole of it at last. '
    const tall: LifeBeatPrompt = {
      ...snap.lifeBeatPrompt!,
      said: long.repeat(22).trim(),
      options: snap.lifeBeatPrompt!.options.map((o) => ({ ...o, label: `${o.label} – ${long.trim()}` })),
    }
    const { w, card } = mountAttached({ ...snap, lifeBeatPrompt: tall })
    const dismiss = lastControl(card)
    const before = measureDialog(card, dismiss, PHONE)
    expect(before.contentFloor, 'the mutation is not vacuous – the long card really is too tall').toBeGreaterThan(
      before.available.height,
    )
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'the met card (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    // ...and putting it back is green again, which is what says the CAP is what holds rather than an
    // accident of the fixture.
    ;(card as HTMLElement).style.maxHeight = ''
    ;(card as HTMLElement).style.overflowY = ''
    assertDismissReachable(card, dismiss, PHONE, 'the met card (cap restored)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF (ARM B) – the cap is asserted even on the copy that fits today', () => {
    const { w, card } = mountAttached(toldSnapshot('close'))
    const dismiss = lastControl(card)
    expect(
      measureDialog(card, dismiss, PHONE).contentFloor,
      'today\'s real draft fits unaided, so this case exercises the OTHER branch',
    ).toBeLessThan(PHONE.height)
    ;(card as HTMLElement).style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'the met card (unbounded)')).toThrow(
      /declares no height bound that fits/,
    )
    ;(card as HTMLElement).style.maxHeight = ''
    assertDismissReachable(card, dismiss, PHONE, 'the met card (bounded again)')
    w.unmount()
  })

  it('⚠ ARM C\'s own guard: anything appended after the answers is caught before a box is measured', () => {
    const { w, card } = mountAttached(toldSnapshot('close'))
    lastControl(card) // green as shipped
    const extra = document.createElement('p')
    extra.textContent = 'Something added after the controls.'
    card.appendChild(extra)
    expect(() => lastControl(card), 'the answers are no longer last in the flow').toThrow()
    card.removeChild(extra)
    lastControl(card)
    w.unmount()
  })

  it('⭐⭐ THE REGISTER SPLIT, ON THE SCREEN: a close card carries her line, a strained one carries none', () => {
    // ⚠⚠ THE POSITIVE HALF RUNS FIRST AND IN THE SAME CASE. «The strained card carries no line of
    // hers» is worthless unless this very test proves the close card carries one – a negative
    // assertion whose target never existed passes on a component that renders nothing at all.
    const close = mountAttached(toldSnapshot('close'))
    const closeSaid = flat(close.card.querySelector('.life-beat-said')!.textContent)
    expect(closeSaid, '⭐ at close she speaks, in quotation marks').toContain('"')
    close.w.unmount()
    document.body.innerHTML = ''

    const strained = mountAttached(toldSnapshot('strained'))
    const strainedSaid = flat(strained.card.querySelector('.life-beat-said')!.textContent)
    expect(strainedSaid.length, 'the strained card does say something – it is not an empty card').toBeGreaterThan(0)
    expect(strainedSaid, '⭐⭐ a strained home\'s card carries no line of hers').not.toContain('"')
    expect(strainedSaid, 'and it is a different card, not the same one').not.toBe(closeSaid)
    strained.w.unmount()
  })

  it('⚠⚠ THE DIALOG OWNS NO SENTENCE – the rendered text is EXACTLY the prompt\'s own strings', () => {
    const snap = toldSnapshot('close')
    const prompt = snap.lifeBeatPrompt!
    const { w, card } = mountAttached(snap)
    expect(printed(card), 'the heading, her line, and the four labels – and nothing else').toEqual([
      flat(prompt.heading),
      flat(prompt.said),
      ...prompt.options.map((o) => flat(o.label)),
    ])
    w.unmount()
  })

  it('⚠ NO NUMBER ON THIS CARD – no bond meter, no count, no price', () => {
    for (const band of ['close', 'steady', 'strained', 'cold'] as BondBand[]) {
      const { w, card } = mountAttached(toldSnapshot(band))
      for (const run of printed(card)) {
        expect(run, `${band}: ${run}`).not.toMatch(/\d|\$/)
        expect(run, `${band}: ${run}`).not.toContain('—')
      }
      w.unmount()
      document.body.innerHTML = ''
    }
  })

  it('⚠⚠ NO LISTEN DETOUR ON A `met` CARD – and the fork\'s card in the same file proves the control exists', () => {
    const { w, card } = mountAttached(toldSnapshot('close'))
    expect(card.querySelector('.life-beat-listen-done'), 'nothing on a met card promises more of her').toBeNull()
    // Pressing an answer on a met card must not open a second panel either: the radios are all there
    // is, and the fourth one («say nothing») is a plain answer with a plain price.
    expect(card.querySelectorAll('[role="radio"]').length, 'four radios and no advance control').toBe(4)
    w.unmount()
    document.body.innerHTML = ''

    // ⚠ THE CONTROL FOR THE NEGATIVE: the FORK's card, through the same component, in the same file,
    // does carry the detour – so the null above is about this kind and not about a selector typo.
    const fork = mountAttached(forkSnapshot())
    const radios = [...fork.card.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
    expect(radios.length, 'the fork has three').toBe(3)
    w.unmount()
    fork.w.unmount()
  })
})
