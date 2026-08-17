// ROUND 21 – THE DIALOG LAYER, MOUNTED: #1 (an import is a decision now) and #8 (the fork's third
// door explains its own absence).
//
// ⚠ MOUNTED AND NOT PINNED, per CLAUDE.md's gotcha. Both items are claims about what a player SEES:
// that a file picked from the Saves tab raises a question before anything is written, that the
// question is not the same question in both cases, and that a card with two answers on it says why
// there are not three. A source pin would pass on a component that renders none of it.
//
// ⚠ AND EVERY DIALOG TOUCHED HERE IS MEASURED AGAINST A PHONE. Round-20 #3 shipped a blocking card
// whose Continue left the screen and the owner's career stopped there; CLAUDE.md's rule is that any
// dialog added or lengthened gets that assertion, and the last block proves the assertion is live by
// putting the shipped defect back on this card and watching it go red.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurements below read an empty cascade and pass vacuously –
// `measureDialog` refuses a document with no `<style>` in it for exactly that reason.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { weekLabel } from '../../src/shared/dates'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import type { CareerMeta, SavePeek, Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND MoreScreen READS IT ON MOUNT (the sound, motion and match
// defaults). The same shim round20-ui.test.ts and round19-wrapup.test.ts install, for the reason
// quoted there: supply the browser's own object rather than weaken the app to suit the runner.
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

/** A real career through the real protocol – never a hand-written snapshot shape. */
function snapshotAfter(weeks: number, seed = 'round21-dialogs'): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

function career(over: Partial<CareerMeta> = {}): CareerMeta {
  return {
    careerId: 'c-ines',
    kidName: 'Ines',
    country: 'ES',
    seed: 'ines-xgv7',
    createdAt: 1,
    lastPlayedAt: 2,
    week: 400,
    ...over,
  }
}

// =================================================================================================
// ⭐ ITEM 1 – «Загрузка сейва, нужен диалог, подтверждающий намерение, особенно актуально, если сейв
//             перетирает существующий.»
// =================================================================================================

const PEEK: SavePeek = { careerId: 'c-ines', kidName: 'Ines', week: 362 }

/** Mount More on the Saves tab with a known careers list, and hand back the two spies the item is
 *  about: what the confirm was told the file holds, and whether the import ever ran. */
async function openSaves(careers: CareerMeta[], peek: SavePeek | null = PEEK) {
  const store = useGameStore()
  store.snapshot = snapshotAfter(4)
  store.careers = careers
  // No worker under happy-dom. `refreshCareers` is replaced rather than the screen changed (the same
  // argument round20-ui.test.ts makes), and the two save actions are spied so nothing tries to post.
  store.refreshCareers = async () => {}
  const peekSpy = vi.spyOn(store, 'peekSave').mockResolvedValue(peek)
  const importSpy = vi.spyOn(store, 'importSave').mockResolvedValue(undefined)
  const w = mount(MoreScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = w.findAll('.more-tabs .tab-pill').find((t) => t.text() === 'Saves')!
  await tab.trigger('click')
  return { w, store, peekSpy, importSpy }
}

/** Pick a file the way the picker does: happy-dom's `files` is read-only, so the selection is
 *  defined onto the element and the same `change` event the screen listens for is fired. */
async function pickFile(w: Awaited<ReturnType<typeof openSaves>>['w'], name = 'tennis-sim_ines-xgv7_w362.tsave') {
  const input = w.find('input[type="file"]')
  expect(input.exists(), 'the Saves tab draws the import picker').toBe(true)
  const file = new File([new Uint8Array([1, 2, 3, 4])], name)
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
  return file
}

describe('⭐ round-21 #1 – importing a save asks first', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐ THE IMPORT DOES NOT FIRE UNTIL IT IS CONFIRMED, and Cancel really is a cancel', async () => {
    const ctx = await openSaves([career()])
    await pickFile(ctx.w)

    expect(ctx.peekSpy, 'the file is read before anything is decided').toHaveBeenCalledTimes(1)
    expect(ctx.w.findComponent(ConfirmDialog).exists(), 'a question is on screen').toBe(true)
    expect(ctx.importSpy, 'and NOTHING has been written').not.toHaveBeenCalled()

    await ctx.w.findComponent(ConfirmDialog).findAll('button')[0].trigger('click')
    await flushPromises()
    expect(ctx.w.findComponent(ConfirmDialog).exists(), 'the question is gone').toBe(false)
    expect(ctx.importSpy, 'and the career is untouched').not.toHaveBeenCalled()
    ctx.w.unmount()
  })

  it('...and confirming runs it ONCE, on the file that was picked', async () => {
    const ctx = await openSaves([career()])
    const file = await pickFile(ctx.w)
    // The confirm is the second button: `ConfirmDialog` puts Cancel first and the primary/danger
    // action last, which is the row every other destructive action on this screen uses.
    await ctx.w.findComponent(ConfirmDialog).findAll('button')[1].trigger('click')
    await flushPromises()
    expect(ctx.importSpy).toHaveBeenCalledTimes(1)
    expect(ctx.importSpy).toHaveBeenCalledWith(file)
    ctx.w.unmount()
  })

  it('⭐⭐ THE TWO MESSAGES ARE NOT THE SAME MESSAGE – overwriting names her, the other says nothing is replaced', async () => {
    // ⚠ THIS IS THE ITEM. A confirm that warns identically whether or not there is something to lose
    // teaches the player to tap through it, and then it is not protecting the one case it exists for.
    const over = await openSaves([career()])
    await pickFile(over.w)
    const overwriting = over.w.findComponent(ConfirmDialog).text()
    over.w.unmount()

    setActivePinia(createPinia())
    // The same file, on a device that holds SOMEBODY ELSE'S career – so the import adds rather than
    // replaces. Nothing about the file changed; only what is already here.
    const fresh = await openSaves([career({ careerId: 'c-maya', kidName: 'Maya', week: 90 })])
    await pickFile(fresh.w)
    const adding = fresh.w.findComponent(ConfirmDialog).text()

    expect(overwriting, 'the two branches must not read alike').not.toBe(adding)

    // The overwrite branch says WHOSE career, WHICH way the replacement goes, and both weeks – so a
    // player can tell an older file from a newer one before they lose the difference.
    expect(overwriting).toContain('Ines')
    expect(overwriting).toContain('Overwrite')
    expect(overwriting).toContain(weekLabel(400))
    expect(overwriting).toContain(weekLabel(PEEK.week))
    expect(overwriting).toContain('no undo')

    // The other branch says the opposite in as many words, and promises nothing it cannot keep.
    expect(adding).toContain('nothing here is replaced')
    expect(adding).not.toContain('no undo')
    expect(adding).not.toContain('Overwrite')

    // ...and the button follows the message: red and "Overwrite" only where something is overwritten.
    expect(over.w.exists()).toBe(false) // unmounted above; the assertions below are on `fresh`
    expect(fresh.w.findComponent(ConfirmDialog).find('button.danger').exists()).toBe(false)
    expect(fresh.w.findComponent(ConfirmDialog).find('button.primary').text()).toBe('Import')
    fresh.w.unmount()
  })

  it('the overwrite branch is the RED button, and it is the one that says Overwrite', async () => {
    const ctx = await openSaves([career()])
    await pickFile(ctx.w)
    const danger = ctx.w.findComponent(ConfirmDialog).find('button.danger')
    expect(danger.exists(), 'a replacement is destructive and is coloured like one').toBe(true)
    expect(danger.text()).toBe('Overwrite')
    ctx.w.unmount()
  })

  it('⚠ an unreadable file is a THIRD message – "cannot say" is not "safe"', async () => {
    // `peekSave` returns null for a hostile, truncated or rotted file. The confirm must not report
    // that as "nothing will be replaced", and must not report it as an error either – the real import
    // is what produces the typed failure, once, at the moment the player asks for it.
    const ctx = await openSaves([career()], null)
    await pickFile(ctx.w, 'not-a-save.tsave')
    const text = ctx.w.findComponent(ConfirmDialog).text()
    expect(text).toContain('could not be read')
    expect(text).toContain('no undo')
    expect(text).not.toContain('nothing here is replaced')
    expect(ctx.store.saveOp, 'and no error row is raised for a file nobody has agreed to import').toBeNull()
    ctx.w.unmount()
  })

  it('⚠ picking the same file twice still asks – the picker is reset', async () => {
    // `input.value = ''` before the await, not after it: the confirm can outlive several turns of the
    // event loop, and a picker left holding the old filename fires no `change` the second time.
    const ctx = await openSaves([career()])
    await pickFile(ctx.w)
    expect((ctx.w.find('input[type="file"]').element as HTMLInputElement).value).toBe('')
    ctx.w.unmount()
  })
})

// =================================================================================================
// ⭐ ITEM 8 – «В 19 не было варианта выбрать колледж, только про или завязать»
// =================================================================================================
//
// ⚠ THE FINDING FIRST, BECAUSE IT IS WHY THE COMPLAINT WAS REAL. Measured with `tools/econ-bench.ts`'s
// own `player` policy (the model of a reasonable parent, fitted to the owner's envelope) over 9
// presets x 3 seeds: 26 of 26 careers that reached the fork had the college answer already spent, and
// the snapshot carried that to the card every time. Under the `grinder` policy – which never plays the
// paid rungs – it was open 13 of 13. So the ENGINE was what shut the door, and #8 built a sentence
// explaining which rung had taken the answer away.
//
// ⭐⭐ AND #8 IS RETIRED BY THE OWNER'S OWN LATER RULING, WHICH IS RECORDED HERE RATHER THAN LEAVING
// AN ANSWERED REQUEST TO DISAPPEAR. On 16.08: «collegeClosedFromTier – так ведь нет же там никакой
// связи с w75, мы же всё узнали. Колледж – это независимая ветка карьеры с отдельным функционалом и
// турнирами, альтернативная.» Nothing closes the college branch on a result, so **there is no shut
// door left to explain** and the third answer is unconditional. The complaint that opened #8 is fixed
// more completely than the sentence fixed it: he asked why the answer was missing, and it is not.
// docs/specs/college-is-its-own-branch-2026-08.md §4.
//
// WHAT THE THREE CASES BELOW BECOME: one. The two shut-door cases are gone with the state they
// described, and the pin that the rung name is never typed into the template is gone with the rung.
// ⚠ RE-AIMED FOR v51, NOT WIDENED (docs/specs/what-the-college-place-costs-2026-08.md). This card
// grew three rows under its third answer – the offer – and the fit cases below are the repo's guard
// that a dialog which grew still fits a phone. A fixture WITHOUT an offer would have gone on
// measuring the short card and quietly stopped covering the one the player actually sees, which is
// the slow failure round-20 #3 is about ("a dialog grows by one honest sentence at a time and nothing
// objects"). So the fixture carries the LONGEST form of the offer: a named programme, both funding
// layers on one line, and a bill that is a formatted figure rather than the shorter "Nothing".
function forkSnapshot(): Snapshot {
  return {
    ageYears: 19,
    week: 265,
    kidRank: 88,
    fundsCents: 1234_00,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    fork: {
      askedWeek: 265,
      ageYears: 19,
      offer: {
        programme: 'strong',
        athleticShare: 0.62,
        needShare: 0.1,
        costPerYearCents: 30_990_00,
        familyPerYearCents: 8_673_00,
      },
    },
  } as unknown as Snapshot
}

describe('⭐ round-21 #8 – the fork offers all three doors, and no longer explains a missing one', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ three answers, one weight, and no shut-door note on any fork the wire can carry', () => {
    useGameStore().snapshot = forkSnapshot()
    const w = mount(ForkDialog)
    expect(w.findAll('.fork-answer'), 'three answers, one weight').toHaveLength(3)
    expect(w.text()).toContain('Take the college place')
    // ⚠ THE NEGATIVE IS THE HALF THAT MOVED. `.fork-shut` was the class and "two answers here and not
    // three" was the sentence; both are gone, and nothing replaced them with a softer version.
    expect(w.find('.fork-shut').exists(), 'the class is gone').toBe(false)
    expect(w.text(), 'and so is the count').not.toContain('two answers')
    // ...and round-17's absent-over-disabled rule is not undone by the other route either: no answer
    // is greyed into a recommendation, and there is still no primary on the card.
    for (const a of w.findAll('.fork-answer')) expect(a.attributes('disabled')).toBeUndefined()
    expect(w.findAll('.tb-pill')).toHaveLength(0)
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐ BOTH CARDS FIT A PHONE, AND THE WAY OUT OF THEM IS ON IT (CLAUDE.md's round-20 #3 rule)
// =================================================================================================
//
// The fork grew a paragraph in this wave and the import confirm is new, so both owe this measurement.
// The last case is the one that makes the other two mean something: it puts the round-20 defect back
// on the fork card – `max-height`/`overflow` removed from the box, which is exactly how
// `TourBriefingDialog` shipped – and asserts the same helper goes red.
describe('⭐⭐ the cards this wave touched fit a 375x667 phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  function mountFork(vp = PHONE) {
    // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time.
    setViewport(vp)
    useGameStore().snapshot = forkSnapshot()
    const w = mount(ForkDialog, { attachTo: document.body })
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
    expect(dismiss.querySelectorAll('button').length, 'the answers ARE the way out').toBeGreaterThan(0)
    return { w, card, dismiss }
  }

  it('the fork, with the new paragraph on it, keeps its answers inside the screen', () => {
    const { w, card, dismiss } = mountFork()
    const fit = assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (college shut)')
    expect(fit.available.height).toBe(635)
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = mountFork(NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ForkDialog (college shut)')
    w.unmount()
  })

  it('the import confirm fits, on its longest message', async () => {
    setViewport(PHONE)
    const ctx = await openSaves([career()])
    await pickFile(ctx.w)
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the confirm is up').toBeTruthy()
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (import overwrite)')
    ctx.w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on this card and the SAME assertion goes red', () => {
    // Without this case the three above are unfalsifiable: the height cap lives on the shared
    // `.dialog-card` rule, so no amount of copy can currently push a control off the screen and a
    // green run would prove only that the cascade exists. Stripping the cap from THIS card is the
    // exact shape `TourBriefingDialog` shipped in – `max-height: none; overflow: visible` – and the
    // helper has to report it, with the measured numbers in the message.
    const { w, card, dismiss } = mountFork()
    const before = measureDialog(card, dismiss, PHONE)
    expect(before.contentFloor, 'the card really is taller than the phone, or the mutation is vacuous').toBeGreaterThan(
      before.available.height,
    )
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})
