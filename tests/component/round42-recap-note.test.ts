// =================================================================================================
// ⭐⭐ ROUND 42 #4 – THE SCRAP ON THE WEEK RECAP IS ONE SIZE, AND THE SIZE IS 19
// =================================================================================================
//
// The owner, off the deployed wave-5 build, 14.09: «что-то с размером шрифта на week recap на первой
// записочке… у некоторых шрифт крупнее», ruled the same day: «да, 19 хорошо». (Quoted here and in the
// style block rather than in a template: tests/template-copy-rules.test.ts bans Cyrillic inside a
// `<template>`, strings AND comments.)
//
// WHAT HE WAS LOOKING AT, AND WHY IT LOOKED RANDOM TO HIM. One `<p class="recap-note-text">` carries
// three different authors' words – the journey home, the ordinary week's note, and the ledger's own
// flavour fragment – and the card puts `--travel` on the paper whenever the first two wrote it
// (`noteIsProse`). That modifier stepped the type from 23px down to 19px. `weekNote` is null roughly
// two ordinary weeks in three (`WEEK_NOTE_CHANCE`), so the size he got was a coin flip on the week:
// the same scrap, on the same paper, in two sizes, with nothing on screen to explain the difference.
//
// ⚠ THE TEST IS THE EQUALITY, NOT THE LITERAL – and then the literal, because both are claims.
// «Одинаковый» is what he reported; «19» is what he ruled. A file that only pinned 19 would stay
// green if a future modifier stepped ONE of the two kinds somewhere else, which is the exact defect
// he found. So each case reads BOTH kinds through the real cascade in the same document and compares
// them with each other first.
//
// ⚠ AND THE TWO KINDS ARE THE ENGINE'S OWN, NOT TWO CLASSES ASSERTED BY NAME. The fixtures below walk
// a real career until the diary hands back a week WITH a prose note and a week WITHOUT one, which is
// what puts `--travel` on one paper and not on the other. Naming the classes would have tested the
// same guess the change was made on.
//
// ⚠ MEASURED AT THE PARITY SET 375 / 768 / 900 / 1280 (his standing rule of 14.09, «визуальную
// проверку на всех экранах надо тоже заложить в билдера в спеку»), because the claim is that there is
// NO width at which the two kinds diverge – this card's own sheet carries a `min-width: 768px` block
// and a second one at 1024, so "one size" has to be asked past both.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read, and `attachTo: document.body` is mandatory:
// happy-dom evaluates a media query on an element's FIRST computed-style read and caches it, and
// applies no rule at all to a detached tree. Both are round 36 phase 2's findings, written out beside
// `TABLET` in fits.ts.
//
// ⚠ MUTATION-VERIFIED – two mutations, each applied alone to the shipped SFC and really run:
//   * the two-size ramp restored exactly as he found it (`.recap-note-text` back to 23px/1.32 with
//     `.recap-note--travel .recap-note-text` at 19px/1.34) -> 4 red, the four parity cases. The
//     precondition case stays green, which is what it is for, and so does the coach postscript – in
//     the defect it inherits `--travel`'s 19 and was never the thing he was looking at;
//   * the flat size set to 21px, i.e. EQUAL but not the size he ruled -> 5 red: the four parity cases
//     fail on the literal rather than on the equality, plus the postscript. That is the separation
//     that makes this file two claims and not one.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// The runner-sized ceiling r37-week-note-tilt.test.ts uses and for its reason: these cases mount a
// real card over a career walked by the real engine, and GitHub's 2-core runner is measured at 4-5x
// this machine on this suite. Both walks are hoisted, so what is left inside a case is a mount.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import {
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, type Viewport, setViewport } from './fits'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** px off a computed value. Throws rather than returning NaN: a property that computed to `''` means
 *  the rule never reached the element, and a silent NaN would pass nothing and fail nothing. */
function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the rule did not reach the element`)
  return n
}

/** The walk r37-week-note-tilt.test.ts and round36-pass2-shop-recap.test.ts share, stopped by what
 *  the DIARY says rather than by a week count: one snapshot where a hand wrote prose about her week
 *  and one where the scrap falls through to the ledger's flavour fragment. Both come out of the same
 *  career, so what differs between the two mounts is the note and nothing else. */
function findNotes(seed: string, limit = 160): { prose: Snapshot; ledger: Snapshot } {
  const world: WorldState = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  let prose: Snapshot | null = null
  let ledger: Snapshot | null = null
  for (let i = 0; i < limit && !(prose && ledger); i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    const snap = toSnapshot(world)
    const isProse = !!(snap.diary.travelNote ?? snap.diary.weekNote)
    if (isProse && !prose) prose = snap
    if (!isProse && !ledger) ledger = snap
  }
  if (!prose || !ledger) {
    throw new Error('the career produced only one kind of scrap – the fixture is broken, not the assertion')
  }
  return { prose, ledger }
}

const NOTES = findNotes('r42-note')

/** The ruled size. «да, 19 хорошо» – his word on 14.09, after «у некоторых шрифт крупнее». */
const RULED_PX = 19

describe('round 42 #4 – one hand, one paper, one type size', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** 900 is the top of his tablet band and the parity set's third width; TABLET and DESKTOP are
   *  fits.ts's own. Four widths, because the claim is that no breakpoint moves this. */
  const WIDE_900: Viewport = { width: 900, height: 1024 }
  const PARITY: Viewport[] = [PHONE, TABLET, WIDE_900, DESKTOP]

  function mountRecap(snap: Snapshot, vp: Viewport) {
    setViewport(vp)
    useGameStore().snapshot = snap
    const wrapper = mount(WeekRecapCard, {
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    const note = wrapper.find('.recap-note-text')
    expect(note.exists(), `the card drew its scrap at ${vp.width}px`).toBe(true)
    return { wrapper, note }
  }

  /** The size the scrap's own text actually computes to, read off the attached element. */
  function sizeOf(snap: Snapshot, vp: Viewport): { size: number; travel: boolean; text: string } {
    const { wrapper, note } = mountRecap(snap, vp)
    const size = px(getComputedStyle(note.element).fontSize, '.recap-note-text font-size')
    const travel = !!document.querySelector('.recap-note--travel')
    const text = note.text()
    wrapper.unmount()
    return { size, travel, text }
  }

  it('⭐ the fixture really is two different kinds of scrap, or the comparison below is vacuous', () => {
    assertSheetPresent()
    const prose = sizeOf(NOTES.prose, PHONE)
    const ledger = sizeOf(NOTES.ledger, PHONE)
    // The modifier is the mechanism he tripped over, so it is asserted as a PRECONDITION rather than
    // as the subject: one paper carries `--travel` and the other does not, which is what used to make
    // the two sizes differ. Without this, "the sizes are equal" could be two identical mounts.
    expect(prose.travel, 'the prose week puts --travel on the paper').toBe(true)
    expect(ledger.travel, 'and the ledger week does not').toBe(false)
    expect(prose.text, 'the two weeks really wrote different things').not.toBe(ledger.text)
  })

  for (const vp of PARITY) {
    it(`⭐⭐ at ${vp.width}px both kinds of scrap read at the same size, and that size is ${RULED_PX}px`, () => {
      assertSheetPresent()
      const prose = sizeOf(NOTES.prose, vp)
      const ledger = sizeOf(NOTES.ledger, vp)

      // HIS REPORT, AS AN EQUALITY. «у некоторых шрифт крупнее» is a claim about the difference, so
      // the difference is what is measured first and the literal second.
      expect(
        prose.size,
        `the prose scrap reads ${prose.size}px and the ledger scrap ${ledger.size}px at ${vp.width}px`,
      ).toBe(ledger.size)
      // HIS RULING. 23 is named separately so a revert reads as what it is rather than as
      // "expected 23 to be 19" with no history attached.
      expect(prose.size, `the ruled size at ${vp.width}px`).toBe(RULED_PX)
      expect(prose.size, `the 23px ledger-week size is not back at ${vp.width}px`).not.toBe(23)
    })
  }

  it('⚠ and the coach postscript rides the same size, on the week it appears', () => {
    // ROUND-21 #2's line is `.recap-note-text .recap-note-coach` and its own style block says it
    // «inherits that rule's size» – the rule being `--travel`'s, which no longer exists. This is the
    // assertion that the sentence in that comment is still true through a different route: the
    // postscript is a `.recap-note-text` itself, so it takes the one size like everything else.
    assertSheetPresent()
    const withCoach = { ...NOTES.prose, diary: { ...NOTES.prose.diary, coachNote: 'He came to this one.' } }
    const { wrapper } = mountRecap(withCoach as Snapshot, PHONE)
    const coach = document.querySelector('.recap-note-coach')
    expect(coach, 'the postscript is on the card').toBeTruthy()
    expect(px(getComputedStyle(coach!).fontSize, '.recap-note-coach font-size')).toBe(RULED_PX)
    // ...and it is still QUIETER than the story it follows, which is the part of #2 that is about the
    // postscript rather than about the size. Opacity carries that, not type.
    expect(Number.parseFloat(getComputedStyle(coach!).opacity)).toBeLessThan(1)
    wrapper.unmount()
  })
})
