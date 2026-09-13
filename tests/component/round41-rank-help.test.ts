// =================================================================================================
// ROUND 41 #1 – «SHE HAS TWO RANKINGS», AND THERE ARE THREE
// =================================================================================================
//
// The owner, 12.09: «при клике на ранг на главной She has two rankings, их явно три, надо этот попап
// обновить».
//
// The professional table has been on the snapshot since v30 and in the engine since the adult rungs
// shipped. This card never learned it, because the list of tables was written out by hand –
// `(['domestic', 'itf'] as LadderTrack[])` – and the lede above it counted that array rather than the
// game. `docs/review/what-money-buys-2026-08.md:582` had already filed it: «a plain defect… one
// array, one sentence».
//
// ⚠ SO WHAT IS PINNED IS THE DERIVATION, NOT THE COUNT. A test asserting «three blocks» would have to
// move the day a fourth table ships, and would not have caught the defect it is written for either –
// the array was hardcoded at two while `LadderTrack` had three members, and nothing failed. The rows
// come off `LADDER_TRACKS`, which comes off `LADDER_LABEL`, which is a TOTAL Record; the assertions
// below compare the rendered headings against that map, so the card is checked against the type
// rather than against a number somebody typed twice.
//
// ⚠ THE COPY IS THE OWNER'S. The lede and the three per-table lines are DRAFT for his playtest and
// are listed verbatim in docs/rounds/round-41.md under item 1; what this file asserts about them is
// their SOURCE (the label map, the engine's own constants) and never a string of its own invention –
// except the lede's own number, which is the item.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { setViewport, PHONE } from './fits'
import RankHelpDialog from '../../src/components/RankHelpDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { LADDER_LABEL, LADDER_TRACKS } from '../../src/shared/protocol'
import { BEST_N_BY_TRACK, RANKABLE_MIN, WINDOW_BY_TRACK } from '../../src/engine/season/ranking'

function mountHelp(weeks = 8) {
  useGameStore().snapshot = careerSnapshot(weeks, 'r41-rank-help')
  return mount(RankHelpDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

describe('round 41 #1 — every table the engine runs has a block on this card', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('⭐ one block per LADDER_TRACK, named from LADDER_LABEL', () => {
    // ⚠ THE MUTATION THAT MUST FAIL THIS: put `(['domestic', 'itf'] as LadderTrack[])` back in place
    // of `LADDER_TRACKS` in RankHelpDialog.vue – the Professional block disappears and both
    // assertions red.
    const wrapper = mountHelp()
    const headings = wrapper.findAll('.rank-help-heading').map((h) => h.text())
    expect(headings.length, 'one block per table the engine runs').toBe(LADDER_TRACKS.length)
    for (const track of LADDER_TRACKS) {
      expect(
        headings.some((h) => h.startsWith(`${LADDER_LABEL[track]} –`)),
        `no block headed «${LADDER_LABEL[track]}» – the card is not showing the ${track} table`,
      ).toBe(true)
    }
    // ...and the third one is the one the owner is reporting, by its own name rather than by index.
    expect(headings.join(' | ')).toContain(LADDER_LABEL.wta)
    wrapper.unmount()
  })

  it('the lede counts the tables the card actually draws', () => {
    // The defect was that these two numbers were independent: the sentence said two and the array
    // held two, and neither knew the engine had three. The copy is the owner's, so what is asserted
    // is the AGREEMENT – the word in the lede against the blocks under it.
    const wrapper = mountHelp()
    const lede = wrapper.find('.hint').text()
    const words: Record<number, string> = { 2: 'two', 3: 'three', 4: 'four' }
    expect(lede, `the lede does not say «${words[LADDER_TRACKS.length]}»`).toContain(
      `${words[LADDER_TRACKS.length]} rankings`,
    )
    expect(lede, 'and «two» is exactly what he reported').not.toContain('two rankings')
    wrapper.unmount()
  })

  it('⭐ each block states its OWN window and best-N, off the engine\'s constants', () => {
    // The single shared rule line said «the last 52 weeks» of every table, and the National one has
    // counted THIS SEASON since round 23 #12 at the owner's own ruling. With three tables the shared
    // line had three windows and three best-Ns to carry; it now carries none of them and each block
    // carries its own.
    const wrapper = mountHelp()
    const rules = wrapper.findAll('.rank-help-block').map((b) => b.find('.rank-help-rule').text())
    expect(rules.length).toBe(LADDER_TRACKS.length)

    for (const [i, track] of LADDER_TRACKS.entries()) {
      const line = rules[i]
      expect(line, `${track}: the block does not name its best-N`).toContain(`best ${BEST_N_BY_TRACK[track]}`)
      if (WINDOW_BY_TRACK[track] === 'rolling52') {
        expect(line, `${track} is a rolling table and the block does not say so`).toContain('52 weeks')
      } else {
        expect(line, `${track} is season-to-date and the block says otherwise`).not.toContain('52 weeks')
        expect(line, `${track} does not say which season`).toContain('season')
      }
    }
    // ...and the professional table's entry bar is §VIII.A.2.b's own numbers, not a remembered pair.
    const pro = rules[LADDER_TRACKS.indexOf('wta')]
    expect(pro).toContain(`${RANKABLE_MIN.tournaments} scoring tournaments`)
    expect(pro).toContain(`${RANKABLE_MIN.points} points`)
    wrapper.unmount()
  })

  it('the empty note is the table\'s own – a blank professional table explains itself', () => {
    // Week 8 of a fourteen-year-old's career: she is nowhere near the paid tour, which is exactly the
    // reader this block has to be honest with rather than silent at.
    const wrapper = mountHelp()
    const proBlock = wrapper
      .findAll('.rank-help-block')
      .find((b) => b.find('.rank-help-heading').text().startsWith(LADDER_LABEL.wta))!
    expect(proBlock, 'no professional block to read').toBeTruthy()
    expect(proBlock.text()).toContain('junior points do not cross over')
    wrapper.unmount()
  })

  it('⚠ and the card is still bounded by the phone it grew on', () => {
    // Round-20 #3's content-independent half, re-measured because this card gained a whole block and
    // three lines. `round36-rank-help-dialog.test.ts` owns the a11y shell; this is the fit, asked
    // again of the longer card.
    const wrapper = mountHelp()
    const card = document.querySelector('.guide-card')!
    expect(document.head.querySelector('style'), 'no stylesheet – this measurement is vacuous').toBeTruthy()
    const cs = getComputedStyle(card)
    const cap = parseFloat(cs.maxHeight)
    expect(Number.isFinite(cap), 'the card declares no height bound').toBe(true)
    expect(cap, `the bound is ${cs.maxHeight} against ${PHONE.height}px of phone`).toBeLessThanOrEqual(PHONE.height)
    expect(cs.overflowY, 'bounded with no scroller hides the rest for good').toBe('auto')
    const close = card.querySelector('.replay-close')
    expect(close, 'the card has no close control').toBeTruthy()
    expect(getComputedStyle(close!).position, 'the close is pinned, so the scroll cannot take it away').toBe('absolute')
    wrapper.unmount()
  })
})
