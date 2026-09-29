// ⭐⭐ T7.0 (29.09) – THE SAVE-CONFLICT CARD'S RELOAD CONTROL, MOUNTED ON A CARD THAT CAN HOLD IT.
//
// THE DEFECT THIS CLOSES. Five blocking cards (Knock, ShootClash, Birthday, LifeBeat, Retirement) render
// `<StoreError />` and have no dismiss by design. When a second tab wins the save race the store writes a
// sentence that says «reload» – and the owner playtests the INSTALLED build, standalone, with no browser
// chrome, so there was nothing to press: a dead end on his own device (the ruling is §2a of
// docs/plans/principles-fix-answers-2026-09.md). The store now tags that one refusal
// (`errorKind: 'save-conflict'`) and `StoreError` draws a button carrying the store's label
// (`SAVE_CONFLICT_RELOAD_LABEL`, row PF6 of the strings table) that reloads the page.
//
// THE CASES
//   (a) the conflict puts a button inside the refusal element, after the sentence, carrying the STORE's label
//   (b) ⚠⚠ that button's box is inside 375x667 – CLAUDE.md's popup law, on a BLOCKING card
//   (c) any other refusal, and no refusal at all, shows no Reload
//   (d) ⚠⚠ THE PAIRING – the kind leaves with its sentence: replaced by a stranger, cleared by the next
//       action, and KEPT by a query that keeps the sentence
//   (e) pressing it reloads the page
//   (f) the label is the one row PF6 tables for his pass
//   (g) every write to `error` inside the store is followed by its kind write
//   (h) ⚠ a kind whose sentence was cleared BY ASSIGNMENT draws nothing – no orphan Reload
//   (i) ⚠⚠ the sentence keeps its HOST's scope attribute, conflict or not – the element is still ONE root
//
// ⚠ THE STATE IS PRODUCED BY THE SHIPPED CODE, NOT WRITTEN INTO THE STORE. The conflict goes through
// `game.run` as a real `CommandRejected('SAVE_CONFLICT')`, so the sentence AND its kind are the store's own
// writes: nothing in this file types either, and a store that stopped pairing them fails here rather than
// in a fixture that assumed it. The «unrelated» refusal is a FIXTURE string, not copy – the store prints
// `err.message` verbatim.
//
// ⚠⚠ THE WORD IS NEVER RETYPED HERE. The label is imported, and case (f) reads row PF6 off the strings
// table and compares it with the constant. That case exists because the round-trip pin
// (principles-fix-strings-roundtrip.test.ts) is CONTAINMENT against `stores/game.ts`, and «Reload» already
// stands in a comment of that file (`run`'s TB-05 note) – so that pin cannot fail on this row from the code
// side. Measured in the table below (arm 7).
//
// ⚠ WHY LifeBeatDialog. It is one of the five hosts, and the one W2 measures with a refusal up
// (principles-w2-blocking-card-refusal.test.ts). All five render the same element inside the same
// `.dialog-card`, so what is proven here about the element holds for each; the box is what is new.
//
// ⚠ THE ORDER IS ALWAYS setViewport -> refuse -> MOUNT (fits.ts: a media query is evaluated on an element's
// first computed-style read and then cached), and the REAL stylesheet is imported – without it
// `.dialog-card`'s cap is not in the cascade and case (b) is vacuous.
//
// ⚠ NO localStorage SHIM AND NO WORKER STUB, unlike the W2 file: nothing here reaches the worker (`run` is
// handed the function that throws) and the card does not touch storage – life-beat-dialog.test.ts runs
// the same way.
//
// MUTATION TABLE – every arm was really run against the real files, watched going red, and put back.
// The count in brackets is how many of the 13 cases one mutation took: a mutation that reddens the WRONG
// case is as much a finding as one that reddens nothing. Each arm was checked to have APPLIED (a null arm is
// not a result) and its file put back byte for byte (sha256 before and after all eleven).
//
//   1. StoreError.vue the button's `v-if="offerReload"` -> `v-if="true"` (a Reload inside EVERY sentence)
//      -> RED [2]: (c) any other refusal, (d) stranger. (a) and (b) stay green BY CONSTRUCTION – the Reload
//      is there under a conflict too – which is the whole reason (c) exists. (c) «no refusal at all» stays
//      green because the `<p>` itself does not render without a sentence.
//   2. StoreError.vue `{{ SAVE_CONFLICT_RELOAD_LABEL }}` -> `Refresh` (mislabelled)
//      -> RED [6]: (a), (b), (d) x3, (e) – every case that finds the control by the store's word.
//   3. StoreError.vue `window.location.reload()` -> `void 0` (a button that does nothing) -> RED [1]: (e).
//   4. game.ts `run`'s generic write (`err.message`) loses its kind reset -> RED [2]: (d) stranger, (g).
//   5. game.ts `run`'s top-of-function clear loses its kind reset -> RED [2]: (d) next action, (g). ⚠ (d) next
//      action asserts `errorKind` at the STORE and not only the absence of a button: the element renders only
//      with a sentence, so a stale kind at rest is invisible on screen and only the store's own state shows it.
//   6. game.ts the kind cleared even under `keepError` (moved out of the `if`) -> RED [2]: (d) keeps, (g) –
//      the second is the structural net seeing `this.error = ''` unpaired, which is this mutation's shape.
//   7. game.ts `SAVE_CONFLICT_RELOAD_LABEL = 'Reload'` -> `'Refresh'` (the word drifts from the table)
//      -> RED [1]: (f). ⚠⚠ AND THE ROUND-TRIP PIN STAYS GREEN (exit 0): principles-fix-strings-roundtrip.test.ts
//      is containment against `stores/game.ts`, and `Reload` already stands in a comment there, so it cannot
//      see this drift from the code side. (a) stays green too, by design – it imports the constant. (f) is
//      the ONLY guard on that direction.
//   8. style.css `.dialog-card`'s cap removed (`max-height: none; overflow-y: visible`) -> RED [1]: (b), on the
//      content-independent half – «the card declares no height bound that fits» (cap NONE, 635px of room).
//      Today's card is 282px and fits unaided, so the content-dependent half alone would have stayed green;
//      this is life-beat-dialog.test.ts's own second arm, on the card WITH the Reload up.
//   9. game.ts the stale-screen write (`refreshAfterStale`) loses its kind reset – a site NO mounted case
//      reaches, because provoking it needs a worker -> RED [1]: (g) alone. That is what (g) is for.
//  10. StoreError.vue the root's `v-if="shown"` -> `v-if="shown || offerReload"` (the kind alone renders the
//      element: the orphan Reload) -> RED [1]: (h). ⚠ AND THE SUITE HAD ALREADY CAUGHT IT, BEFORE (h) EXISTED:
//      round36-error-surfaces.test.ts «the Kid hero stops eating the line…» is red on this mutation too (exit 1,
//      measured in the same run). It clears `error` by assignment after a real conflict, so the stale kind drew
//      an orphan Reload and the hero stopped being the shell's first child. Control: that case on `HEAD`'s
//      sources was green, so the regression was this change's and not the machine's.
//  11. StoreError.vue back to TWO ROOTS – the sentence and the button as siblings, this change's FIRST version
//      -> RED [4]: (a), (h), (i) x2. ⚠⚠ AND EVERYTHING ELSE STAYED GREEN: principles-w4-refusal-surfaces.test.ts
//      exits 0 on this mutation (measured in the same run), and so did the whole component project (245 files,
//      2,576 tests) and the typecheck – that version was committed green. Only the scope attribute shows it.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, enableAutoUnmount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import '../../src/style.css'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { CommandRejected, SAVE_CONFLICT_RELOAD_LABEL, useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type LifeBeatPrompt } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

// A wrapper left mounted by a FAILED assertion keeps a live focus trap over every later case
// (`useDialogFocus` listens on `document`) – the W2 file's own reason for this line.
enableAutoUnmount(afterEach)

// ⚠ `fileURLToPath` AND `join`, NOT `new URL(rel, base)`: happy-dom replaces the global `URL` with its own
// class, which refuses the two-argument form here (the W2 file measured it 26.09).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/** A life beat in the wire's shape. FIXTURE strings, not copy – the words a player reads are the engine's. */
const BEAT: LifeBeatPrompt = {
  week: 640,
  kind: 'fork-opinion',
  heading: 'FIXTURE heading',
  said: 'FIXTURE line of hers.',
  options: [
    { id: 'back-her', label: 'FIXTURE answer one' },
    { id: 'press-other-way', label: 'FIXTURE answer two' },
  ],
  followUps: [],
  confirm: 'FIXTURE proceed',
}

const UNRELATED = 'FIXTURE unrelated refusal'

/** The cross-tab refusal, produced the way the app produces it – through the store's own `run`. */
async function refuseWithConflict(): Promise<void> {
  await useGameStore().run(async () => {
    throw new CommandRejected('FIXTURE wire text, replaced by the store', 'SAVE_CONFLICT', 3)
  })
}

/** Any other refusal. `keepError` is the option a query the SURFACE fires passes (`loadInbox`). */
async function refuseWith(message: string, options?: { keepError?: boolean }): Promise<void> {
  await useGameStore().run(async () => {
    throw new Error(message)
  }, options)
}

function stage(): { card: Element } {
  useGameStore().snapshot = { ...toSnapshot(createWorld('w7-reload-fit', DEFAULT_PROFILE)), lifeBeatPrompt: BEAT }
  mount(LifeBeatDialog, { attachTo: document.body })
  const card = document.querySelector('.life-beat-dialog')
  expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
  return { card: card! }
}

/** The Reload, found by the STORE's label – the one thing this file may not type. */
function reloadIn(card: Element): HTMLButtonElement | undefined {
  return [...card.querySelectorAll('button')].find((b) => b.textContent?.trim() === SAVE_CONFLICT_RELOAD_LABEL)
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  setViewport(PHONE)
})

describe('⭐⭐ T7.0 – the save-conflict refusal comes with its Reload', () => {
  it('(a) the conflict puts a button inside the refusal element, after the sentence, carrying the STORE\'s label', async () => {
    await refuseWithConflict()
    const game = useGameStore()
    expect(game.errorKind, 'the store paired the kind with the sentence').toBe('save-conflict')
    const { card } = stage()
    const line = card.querySelector('.error')
    expect(line, 'the sentence is on the card').toBeTruthy()
    expect(line!.firstChild!.textContent, 'and it is the store\'s, first in the element').toBe(game.error)
    expect(line!.getAttribute('role'), 'a polite live region, as before').toBe('status')
    const reload = reloadIn(card)
    expect(reload, 'the card offers the Reload').toBeDefined()
    expect(reload!.textContent, 'with exactly the label the store owns').toBe(SAVE_CONFLICT_RELOAD_LABEL)
    expect(reload!.getAttribute('type'), 'a button that submits nothing').toBe('button')
    // ⚠ INSIDE the `<p>` and not beside it – see (i): a sibling would make the element a fragment and cost
    // every host's scoped rules their grip on the sentence. It is the LAST thing in it, so it reads after the
    // sentence; the `<br>` between them is what puts it on its own line.
    expect(reload!.parentElement, 'inside the one element that owns the refusal').toBe(line)
    expect(line!.lastElementChild, 'and last in it, after the sentence').toBe(reload)
  })

  it('(b) ⚠⚠ the Reload is inside 375x667 with the conflict up, on a card that cannot be dismissed', async () => {
    // CLAUDE.md's popup law: «any dialog you add or lengthen gets a mounted assertion that its dismiss
    // control's box is inside a 375x667 viewport». This card is BLOCKING – the Reload is the only way
    // out of a refusal that has no other – so it is measured as the dismiss control, the way
    // ad-offer-letter.test.ts measures the capstone confirm (`assertDismissReachable` on the real cascade).
    await refuseWithConflict()
    const { card } = stage()
    const reload = reloadIn(card)
    expect(reload, 'the Reload is up – the measurement below is not vacuous').toBeDefined()
    const fit = assertDismissReachable(card, reload!, PHONE, 'LifeBeatDialog (save conflict, Reload up)')
    expect(fit.dismissTop, 'the box starts on the screen').toBeGreaterThanOrEqual(0)
    expect(fit.dismissBottom, 'and ends on it').toBeLessThanOrEqual(PHONE.height)
  })

  it('(c) any other refusal shows its sentence and no Reload', async () => {
    await refuseWith(UNRELATED)
    const game = useGameStore()
    expect(game.errorKind, 'the store filed it under no kind').toBe('')
    const { card } = stage()
    expect(card.querySelector('.error')!.textContent, 'the sentence is up').toBe(UNRELATED)
    expect(reloadIn(card), 'no Reload under an unrelated sentence').toBeUndefined()
    expect(card.querySelectorAll('button').length, 'the card holds its answers and nothing more').toBe(
      BEAT.options.length,
    )
  })

  it('(c) ...and no refusal at all draws no notice and no control', async () => {
    // The anti-vacuity half: a Reload drawn on every ordinary week would pass (a) and be a regression on
    // five blocking overlays.
    const { card } = stage()
    expect(card.querySelector('.error'), 'no empty notice').toBeNull()
    expect(reloadIn(card), 'no control').toBeUndefined()
    expect(card.querySelectorAll('button').length).toBe(BEAT.options.length)
  })

  it('(d) ⚠⚠ THE PAIRING: a stranger that replaces the sentence takes the Reload away', async () => {
    await refuseWithConflict()
    const { card } = stage()
    expect(reloadIn(card), 'it was up').toBeDefined()
    // The one way a kind can outlive its sentence: a query that KEEPS the last sentence (`loadInbox`,
    // `keepError`) and then fails on its own. The top-of-`run` clear is skipped there, so the write that
    // replaces the sentence is the only thing left to reset the kind.
    await refuseWith(UNRELATED, { keepError: true })
    await nextTick()
    expect(card.querySelector('.error')!.textContent, 'the stranger\'s sentence is up').toBe(UNRELATED)
    expect(reloadIn(card), 'and the Reload is not left under it').toBeUndefined()
  })

  it('(d) ...and the next ordinary action clears the Reload with the sentence', async () => {
    await refuseWithConflict()
    const { card } = stage()
    expect(reloadIn(card), 'it was up').toBeDefined()
    await useGameStore().run(async () => 1)
    await nextTick()
    expect(card.querySelector('.error'), 'the sentence is gone').toBeNull()
    expect(reloadIn(card), 'and there is nothing left to reload for').toBeUndefined()
    // ⚠ THE STORE'S OWN HALF, ASSERTED AT ITS SOURCE. `StoreError` also requires a sentence (case (h)), so
    // it hides a stale kind at rest and the two lines above cannot see a clear that forgot the kind –
    // measured: arm 5 went from RED [2] to RED [1] the moment the element grew that clause. The pair moving
    // together is the store's contract, so it is checked where the store keeps it.
    expect(useGameStore().errorKind, 'the kind left with its sentence').toBe('')
  })

  it('(d) ...but a query that keeps the sentence keeps its Reload with it', async () => {
    await refuseWithConflict()
    const { card } = stage()
    await useGameStore().run(async () => 1, { keepError: true })
    await nextTick()
    expect(card.querySelector('.error'), 'the sentence stands').toBeTruthy()
    expect(reloadIn(card), 'so does the control that answers it').toBeDefined()
  })

  it('(e) pressing it reloads the page', async () => {
    await refuseWithConflict()
    const { card } = stage()
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
    try {
      reloadIn(card)!.click()
      expect(reload).toHaveBeenCalledTimes(1)
    } finally {
      reload.mockRestore()
    }
  })

  it('(f) ⭐ the label is the one row PF6 tables for his pass – the document and the store move together', () => {
    const md = readFileSync(join(ROOT, 'docs', 'plans', 'principles-fix-strings-2026-09.md'), 'utf8')
    const row = /^\| PF6 \| `src\/stores\/game\.ts` \| ([^|]+?) \| `DRAFT` \|$/m.exec(md)
    expect(row, 'PF6 is still tabled, with the store as its home').not.toBeNull()
    expect(SAVE_CONFLICT_RELOAD_LABEL, 'the shipped label is the tabled one').toBe(row![1])
  })

  it('(h) ⚠ a kind whose sentence was cleared by assignment draws nothing – no orphan Reload', async () => {
    // Found by the suite, not by argument: round36-error-surfaces.test.ts (the Kid hero's margin case) makes
    // a real conflict through the store and then writes `store.error = ''` DIRECTLY. That bypasses the
    // pairing – nothing in `src/` writes `error` outside the store, but a fixture may – so the kind stays
    // behind, and a kind-only condition drew a Reload with no sentence before it, which was enough to stop
    // `.kid-hero` being the shell's first child. The element now renders ONLY with a sentence to show (as it
    // always did), so a kind that outlived its sentence draws nothing – and so does MoreScreen's `except`.
    await refuseWithConflict()
    const game = useGameStore()
    game.error = ''
    expect(game.errorKind, 'the stale state this case is about – the kind outlived its sentence').toBe('save-conflict')
    const { card } = stage()
    expect(card.querySelector('.error'), 'no sentence').toBeNull()
    expect(reloadIn(card), 'so no Reload either').toBeUndefined()
    expect(card.querySelectorAll('button').length).toBe(BEAT.options.length)
  })

  it('(g) ⚠ every write to `error` inside the store is followed by its kind – a new sentence cannot forget it', () => {
    // The completeness net for what (d) reaches: the stale / restart / crash sites need a worker to
    // provoke and are not driven above, and the NEXT sentence someone adds is the one this exists for.
    // Comment lines are skipped so the pairing may be explained where it is written.
    const lines = readFileSync(join(ROOT, 'src', 'stores', 'game.ts'), 'utf8').split('\n')
    const isCode = (l: string): boolean => l.trim() !== '' && !/^\s*(\/\/|\/\*|\*)/.test(l)
    const writes = lines.map((text, i) => ({ text, i })).filter(({ text }) => isCode(text) && /\bthis\.error = /.test(text))
    expect(writes.length, 'the store still writes to `error` at every site it did').toBeGreaterThanOrEqual(7)
    for (const { text, i } of writes) {
      const next = lines.slice(i + 1).find(isCode)
      expect(next, `line ${i + 1} (${text.trim()}) is not followed by a kind write`).toMatch(/^\s*this\.errorKind = /)
    }
  })

  // ⚠⚠ THE REGRESSION THIS CHANGE'S FIRST VERSION SHIPPED, AND NO GATE SAW IT. `StoreError` was a fragment –
  // the sentence and the button as two roots – and Vue hands a parent's scoped-style attribute to a child
  // component's root ONLY when the child has ONE root. KidScreen's and HomeScreen's scoped `.error { grid-column }`
  // stopped matching every store error on the two busiest screens: measured through the real cascade,
  // `grid-column` went from '1 / -1' to '' and the attribute list from [data-v-…, class, role] to [class, role].
  // All 2,576 component tests stayed green, because nothing measured the attribute. The hero's own scope
  // attribute is the reference: it is the screen's id, `StoreError` has no scoped style of its own to confuse it.
  // THE PRICE OF ONE ROOT is that in the conflict state the element's text is the sentence PLUS the label, so
  // round36-error-surfaces.test.ts and principles-w4-refusal-surfaces.test.ts (which compared it whole) strip the
  // store's label from the end before comparing – nothing else about those pins moved.
  for (const [what, refuse] of [
    ['an unrelated refusal', () => refuseWith(UNRELATED)],
    ['the conflict, with its Reload up', () => refuseWithConflict()],
  ] as const) {
    it(`(i) ⚠⚠ the sentence still carries its host's scope attribute – ${what}`, async () => {
      await refuse()
      useGameStore().snapshot = careerSnapshot(6, 'w7-scope')
      mount(KidScreen, { attachTo: document.body })
      const line = document.querySelector('.error')
      const hero = document.querySelector('.kid-hero')
      expect(line, 'the sentence is on the Kid screen').toBeTruthy()
      const scope = hero!.getAttributeNames().find((n) => n.startsWith('data-v-'))
      expect(scope, 'the hero carries its screen\'s scope attribute – the reference').toBeTruthy()
      expect(line!.hasAttribute(scope!), 'and so does the sentence, or the screen\'s scoped `.error` rules never reach it').toBe(true)
    })
  }
})
