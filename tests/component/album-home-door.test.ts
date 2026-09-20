// ⭐⭐ THE ALBUM'S DOOR – HOME'S RECENT-MEMORY CARD (the album spec §8b, his ruling of 19.09: «можно
// сделать вход в альбом как раз с плашки home где у нас recent memory, она ровно этого и ждала. И
// тогда как раз кнопка Back пригодится, как в макетах.»)
//
// Two claims, and the second one is the one that needs a test more than the first:
//   1. the card IS a door – it is a button, and pressing it asks the shell for the album;
//   2. ⚠⚠ NOT ONE WORD ON IT CHANGED. Invariant 4, and round 29's own lesson: a rename nobody asked
//      for slipped in while something adjacent was being fixed, and «a wording change is the one
//      kind of diff no test catches – the pins assert what the string IS, so they move with it».
//      That is true of a pin written at the same time as the change; it is NOT true of one that
//      reads the string off the ENGINE, which is what the memory line and its date do here. The
//      eyebrow and the empty-state sentence have no engine source, so those two are pinned
//      literally – deliberately, because they are exactly the two strings a layout edit could
//      "tidy".
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import type { Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'
import { PHONE, setViewport } from './fits'

// ⚠ THIS RUNNER HAS NO localStorage AND HOME READS IT (watermarks). Same shim, same reason, as
// `home-strip-and-mail.test.ts` – the browser's own object rather than a weakened component.
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

function mountHome(snapshot: Snapshot) {
  setViewport(PHONE)
  useGameStore().snapshot = snapshot
  return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
}

/** The recent-memory card, found STRUCTURALLY.
 *
 *  ⚠ NOT BY THE WORD «Recent memory», and that is the difference between a copy pin that means
 *  something and one that cannot fail. Anchoring on the eyebrow would make the assertion further
 *  down circular – rename the label and the helper stops finding the card, so the test blows up
 *  instead of reporting the rename. `.card-short` is `.note-card`'s short variant and only two cards
 *  wear it; the other one names itself `coach-card`. */
function memoryCard(w: ReturnType<typeof mountHome>) {
  const card = w.find('.note-card.card-short:not(.coach-card)')
  if (!card.exists()) throw new Error('no recent-memory card on Home – this file is measuring nothing')
  return card
}

const said = (t: string): string => t.replace(/\s+/g, ' ').trim()

describe("Home's recent-memory card is the album's door", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⚠ with a memory on it, the card is a button and it asks for the album', async () => {
    const snapshot = careerSnapshot(160, 'album-door')
    expect(snapshot.diary.memory, 'this career has no memory yet – the fixture proves nothing').not.toBeNull()

    const w = mountHome(snapshot)
    const card = memoryCard(w)
    expect(card.element.tagName, 'the card that opens the album is not a door').toBe('BUTTON')

    await card.trigger('click')
    expect(w.emitted('navigate'), 'pressing the memory card asked for nothing').toEqual([['album']])
    w.unmount()
  })

  it('⚠ with no memory yet it is NOT a door – a control that goes nowhere is worse than none', async () => {
    const snapshot = careerSnapshot(1, 'album-door-empty')
    expect(snapshot.diary.memory, 'this fixture already has a memory, so it cannot prove the empty arm').toBeNull()

    const w = mountHome(snapshot)
    const card = memoryCard(w)
    expect(card.element.tagName, 'an empty memory card still offers a door into an empty album').toBe('ARTICLE')
    // ⚠ AND IT IS PRESSED, which is the half that makes the guard in the handler load-bearing rather
    // than decorative. The element alone is not the whole claim: a click listener still fires on an
    // `<article>`, so without `memory &&` a career with nothing to show would open the album from a
    // card that says there is nothing to show. Measured: with the press, dropping the guard goes red;
    // without it, the same mutation passes.
    await card.trigger('click')
    expect(w.emitted('navigate'), 'the empty card opened the album anyway').toBeUndefined()
    w.unmount()
  })

  // ===============================================================================================
  // ⚠⚠ INVARIANT 4 – THE CARD'S COPY IS UNTOUCHED
  // ===============================================================================================
  it('⚠⚠ every word on the card is the one that was there before, byte for byte', () => {
    const snapshot = careerSnapshot(160, 'album-door')
    const memory = snapshot.diary.memory!
    const w = mountHome(snapshot)
    const card = memoryCard(w)

    expect(said(card.find('.tb-eyebrow').text()), 'the card was relabelled').toBe('Recent memory')
    // These two are the ENGINE's, so the assertion cannot drift with an edit to the template: it is
    // comparing the screen against the snapshot it was handed.
    expect(said(card.find('.memory-line').text())).toBe(said(memory.line))
    expect(said(card.find('.memory-when').text())).toBe(said(memory.whenLabel))
    w.unmount()

    const empty = mountHome(careerSnapshot(1, 'album-door-empty'))
    expect(said(memoryCard(empty).find('.note-empty').text()), 'the empty-state sentence was rewritten').toBe(
      'Too early for memories.',
    )
    empty.unmount()
  })
})

// =================================================================================================
// ⚠⚠ MUTATION LEDGER – measured on this branch, one at a time.
// =================================================================================================
// `npx vitest run --project component tests/component/album-home-door.test.ts` (3 tests).
//
//  1. `:as` reverted to a literal `article` on the card    -> 1 RED (the door test, on BUTTON)
//  2. the `@click` handler removed                         -> 1 RED (the door test, on the emit)
//  3. the `memory &&` guard dropped from the handler       -> 1 RED (the empty arm)
//     ⚠ AND THIS ONE WAS 0 RED AT FIRST, which is why the empty arm now PRESSES the card. The
//     original test asserted only that the element was an `<article>`, and the guard is invisible to
//     that: an article with a live listener is still an article. The mutation passed, the guard
//     looked redundant, and a career with nothing to show would have opened the album from the card
//     that says so. One `trigger('click')` is the difference between a test and a description.
//  4. the eyebrow changed to «Latest memory»               -> 1 RED
//     (1 and not 3 because `memoryCard()` finds the card structurally – see its note. Anchored on
//     the eyebrow it would have taken the whole file down with it and reported a crash where the
//     honest answer is «a label changed».)
//  5. the empty state changed to «No memories yet.»        -> 1 RED
