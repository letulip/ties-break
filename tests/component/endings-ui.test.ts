// W2-ENDINGS – the epilogue and the two blocking questions, MOUNTED.
//
// Mounted rather than source-pinned on purpose (CLAUDE.md's own gotcha: "prefer a mounted test to a
// source pin"). What these assert is behaviour the album cannot be refactored out of: seven pages
// turned one at a time, the selection rule visible on every one of them, the caption on the
// polaroid's own lip, and an empty slot 3 that says the money never came without softening it.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EndingScreen from '../../src/components/EndingScreen.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import { useGameStore } from '../../src/stores/game'
// ⭐ THE LONG GOODBYE STEP 4 – her last word is the ENGINE's sentence, and the card renders it. The
// pin goes through the symbol so a re-wording moves the assertion with the copy.
import { lastWordLine } from '../../src/engine/ending'
import type { AlbumPage, CareerEndingType, EndingView, Snapshot } from '../../src/shared/protocol'

function albumPage(slot: number, over: Partial<AlbumPage> = {}): AlbumPage {
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
    ...over,
  }
}

function endingView(type: CareerEndingType = 'stopped', over: Partial<EndingView> = {}): EndingView {
  return {
    ending: { type, week: 265, ageYears: 19, detail: 'she stopped at nineteen', resumesWeek: null },
    album: [1, 2, 3, 4, 5, 6, 7].map((s) =>
      s === 3 ? albumPage(3, { empty: true, fact: null, week: null, why: 'The first cheque – there was never one' }) : albumPage(s),
    ),
    scroll: [
      { seasonIndex: 0, year: 2031, ageYears: 14, rows: [{ week: 12, label: 'Title', detail: 'Local Open' }] },
    ],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: { earnedCents: 100_00, spentCents: 50_000_00, prizeCents: 0, weeksLostToInjury: 0 },
    seasonsPlayed: 5,
    bestRank: 88,
    titles: 2,
    oneMoreYearCount: 0,
    // ⭐ P5: null unless the fixture is a career sitting between two college years. The screen's
    // "another year?" question is drawn from this and from nothing else.
    college: null,
    ...over,
  }
}

function patchSnapshot(fields: Record<string, unknown>): void {
  const game = useGameStore()
  game.$patch({ snapshot: { ageYears: 19, week: 265, kidRank: 88, fundsCents: 1234_00, careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 }, ...fields } as unknown as Snapshot })
}

describe('the album', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows ONE page at a time, and turns', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    expect(w.findAll('.album-page')).toHaveLength(1)
    expect(w.text()).toContain('why 1')
    expect(w.text()).toContain('1 / 7')
    await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).toContain('why 2')
    expect(w.text()).not.toContain('why 1')
    w.unmount()
  })

  it('⚠ the caption is ON THE POLAROID, in the handwriting face – the owner asked for it there', () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    const caption = w.find('.tb-polaroid .tb-polaroid-caption')
    expect(caption.exists()).toBe(true)
    expect(caption.text()).toBe('caption 1')
    w.unmount()
  })

  it('⚠ the selection rule is on EVERY page, empty ones included', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    for (let i = 0; i < 7; i++) {
      expect(w.find('.album-why').text().length).toBeGreaterThan(0)
      if (i < 6) await w.findAll('.album-arrow')[1].trigger('click')
    }
    w.unmount()
  })

  it('⚠ slot 3 can be EMPTY, and it says so with no fact and no consolation', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    await w.findAll('.album-arrow')[1].trigger('click')
    await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).toContain('there was never one')
    expect(w.find('.album-fact').exists()).toBe(false)
    expect(w.find('.album-when').exists()).toBe(false)
    w.unmount()
  })

  it('the hand-off is an OFFER on the last page, and the record is reachable from it', async () => {
    patchSnapshot({ ending: endingView() })
    const w = mount(EndingScreen)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.find('.ending-foot').exists()).toBe(true)
    expect(w.text()).toContain('Raise another')
    await w.find('.ending-link').trigger('click')
    expect(w.text()).toContain('The whole record')
    expect(w.text()).toContain('Local Open')
    w.unmount()
  })

  it('⚠ the hand-off asks EXACTLY ONE question, and it is the capital fork', async () => {
    patchSnapshot({ ending: endingView() })
    const game = useGameStore()
    const spy = vi.spyOn(game, 'newCareer').mockResolvedValue(undefined)
    const w = mount(EndingScreen)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    await w.findAll('.tb-pill')[0].trigger('click')
    const options = w.findAll('.ending-fork-option')
    expect(options).toHaveLength(3)
    // ...and NOTHING else is asked: three cards, then a career.
    await options[2].trigger('click')
    expect(spy).toHaveBeenCalledTimes(1)
    const profile = spy.mock.calls[0][1] as { background: string }
    expect(profile.background).toBe('working')
    w.unmount()
  })

  it('⚠ COLLEGE offers a way back instead of a new career – the only ending that resumes', async () => {
    // ⭐ GUARD RE-AIMED TWICE, NEVER WEAKENED. The claim is unchanged and it is the load-bearing one:
    // on a college ending this screen offers a WAY BACK and never the hand-off.
    //   P5 (16.08) moved the offer from one pill reading «Four years later –» to the year just lived
    //   plus two answers, because the sport's own case is an early return (Diana Shnaider left NC
    //   State after about a season).
    //   ⭐⭐⭐ ROUND 24 (#2b) moved the year block OFF THIS SCREEN ENTIRELY – college weeks run on the
    //   Home shell now, because showing the player the album mid-career read as «карьера
    //   закончилась». So what reaches the epilogue on a college ending is the ONE state App.vue's
    //   `showCollege` does not route away: type 'college' with NO progress view, which no live path
    //   produces and which must still not dead-end. That is the branch asserted here, and it is why
    //   `college` is null in the fixture. The live surface is
    //   tests/component/college-second-act.test.ts (Home) and the routing itself is
    //   tests/component/round24-college-shell.test.ts.
    patchSnapshot({
      ending: endingView('college', {
        ending: { type: 'college', week: 265, ageYears: 19, detail: 'x', resumesWeek: 317 },
        handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: 317, resumesAgeYears: 20 },
        college: null,
      }),
    })
    const w = mount(EndingScreen)
    for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
    expect(w.text()).toContain('Another year')
    expect(w.text()).not.toContain('Raise another')
    w.unmount()
  })

  // ⭐ THE LONG GOODBYE STEP 4 – THE EPILOGUE STILL OPENS ON EVERY ENDING, COLLEGE INCLUDED. Step 4
  // rewrote the `natural` ending's detail line into her own voice, and `CareerEndingType` is a
  // closed set of six that this screen has to survive whichever one it is handed. College is in the
  // sweep on purpose: it is the one ending that can be RESUMED, so its epilogue is read by a player
  // whose career is still alive, and it is the one the album has already been re-aimed for twice.
  it('⚠ opens on every ending type, college included – the whole album, to the last page', async () => {
    const types: CareerEndingType[] = ['stopped', 'college', 'bankruptcy', 'injury', 'natural', 'plateau']
    for (const type of types) {
      setActivePinia(createPinia())
      patchSnapshot({
        ending: endingView(type, {
          ending: {
            type,
            week: 1453,
            ageYears: 41,
            // The natural ending's real fragment, as `endingForRetirement` now writes it.
            detail: type === 'natural' ? '41, and nobody had to ask her' : `detail for ${type}`,
            resumesWeek: type === 'college' ? 317 : null,
          },
          oneMoreYearCount: 4,
        }),
      })
      const w = mount(EndingScreen)
      expect(w.findAll('.album-page'), `${type}: no page rendered`).toHaveLength(1)
      for (let i = 0; i < 6; i++) await w.findAll('.album-arrow')[1].trigger('click')
      // The hand-off foot is the last page's own block, and it is the half a mount alone would miss.
      expect(w.text(), `${type}: the record never opened`).toContain('The whole record')
      expect(w.text(), `${type}: the count on the foot is not hers`).toContain('She said one more year 4 times')
      w.unmount()
    }
  })

  it('renders for the nineteen-year-old who never turned pro – seven pages, two of them empty', () => {
    patchSnapshot({
      ending: endingView('stopped', {
        album: [1, 2, 3, 4, 5, 6, 7].map((s) =>
          s === 3 || s === 6 ? albumPage(s, { empty: true, fact: null, week: null }) : albumPage(s),
        ),
        totals: { earnedCents: 0, spentCents: 41_000_00, prizeCents: 0, weeksLostToInjury: 0 },
      }),
    })
    const w = mount(EndingScreen)
    expect(w.findAll('.album-dots i')).toHaveLength(7)
    expect(w.findAll('.album-dots i.off')).toHaveLength(2)
    w.unmount()
  })
})

describe('the fork at nineteen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('offers three answers and has no way out that is not one of them', () => {
    // ⚠ `collegeOpen` WAS PART OF THIS PAYLOAD UNTIL 16.08 and it is off the wire now: the owner
    // removed the rule that could shut the college answer, so three answers is the ONLY case.
    patchSnapshot({ fork: { askedWeek: 265, ageYears: 19 } })
    const w = mount(ForkDialog)
    const answers = w.findAll('.fork-answer')
    expect(answers).toHaveLength(3)
    expect(w.text()).toContain('Turn professional')
    // ⚠ RE-AIMED 12.08 (round-17 B), NOT WEAKENED. The button read "Take the scholarship" and now
    // reads "Take the college place": the academy's travel grant is also called a scholarship, in
    // the feed and on two screens, and the owner read the two as one thing and asked whether a W75+
    // result before nineteen would cost her the academy. It cannot – they are separate mechanisms –
    // so the word had to stop being shared. The assertion follows the button; the claim is
    // unchanged, and it is stricter for naming college explicitly.
    expect(w.text()).toContain('Reserve the college place')
    expect(w.text()).toContain('Stop here')
    // ⚠ NO PRIMARY. «Stop» must be able to be the right answer, so the card may not style one of
    // them as the correct one - all three carry the same class and none is a PrimaryPill.
    expect(w.findAll('.tb-pill')).toHaveLength(0)
    w.unmount()
  })

  it('an answer is a command, and it is the only exit', async () => {
    // ⚠ `collegeOpen` WAS PART OF THIS PAYLOAD UNTIL 16.08 and it is off the wire now: the owner
    // removed the rule that could shut the college answer, so three answers is the ONLY case.
    patchSnapshot({ fork: { askedWeek: 265, ageYears: 19 } })
    const game = useGameStore()
    const spy = vi.spyOn(game, 'answerFork').mockResolvedValue(undefined)
    const w = mount(ForkDialog)
    await w.findAll('.fork-answer')[2].trigger('click')
    // ⚠ RE-AIMED 17.08, NOT LOOSENED: `answerFork` gained a second argument (the college place the
    // player picked) and «stop» carries none, which this now states explicitly rather than by
    // omission. A tier riding on the stop answer would be a shape the engine has to re-validate for
    // no reason – see the command's own note in `protocol.ts`.
    expect(spy).toHaveBeenCalledWith('stop', undefined)
    w.unmount()
  })

  // ⭐⭐ ROUND-17 #6's CASE IS RETIRED BY AN OWNER RULING OF 16.08, AND THE RECORD MATTERS BECAUSE
  // THE CASE ITSELF WAS RIGHT TWICE OVER. It read *"drops the college place once she is earning on
  // the tour, and keeps the other two equal"*, and it had already been re-aimed on 12.08 when the
  // button stopped saying "Take the scholarship" – the note it carried is worth keeping: *"that is
  // the whole hazard of a text pin, and it is why the positive assertion below is kept beside it:
  // 'the college answer is gone' and 'the other two are still here' are two claims."*
  //
  // ⚠ WHAT REMOVED IT IS THE RULE, NOT THE TEST: «Колледж – это независимая ветка карьеры … 
  // альтернативная.» There is no state in which the card draws two answers, so the case has no
  // subject. Its surviving half – that removing nothing becomes a recommendation either – is the
  // no-primary assertion, which is already in the three-answer case above and in
  // tests/component/round21-dialogs.test.ts. Nothing about the fork's copy is now unpinned.
  it('⚠ ...and there is no fork state that draws fewer than three, whatever the wire carries', () => {
    // The mutation-proof shape of the retirement: hand the card the OLD flag, in both positions, and
    // watch it change nothing. A `v-if` restored on `fork.collegeOpen` goes red here.
    for (const stale of [{ collegeOpen: false }, { collegeOpen: true }]) {
      patchSnapshot({ fork: { askedWeek: 265, ageYears: 19, ...stale } as never })
      const w = mount(ForkDialog)
      expect(w.findAll('.fork-answer'), `stale ${JSON.stringify(stale)}`).toHaveLength(3)
      expect(w.text()).toContain('Reserve the college place')
      expect(w.findAll('.tb-pill'), 'and still no primary').toHaveLength(0)
      w.unmount()
    }
  })

  // ⭐ ROUND-17 #6/#16 – THE RANK ON THIS CARD NAMES ITS TABLE
  it('⭐ names the table the rank comes from, and it is the one that is hers', () => {
    // It printed `#${snap.kidRank}` under a bare "Her rank" – the INTERNATIONAL (junior) alias, on
    // the one card whose own headline is "The junior ladder is behind her."
    patchSnapshot({
      fork: { askedWeek: 265, ageYears: 19 },
      kidRank: 88,
      activeLadder: 'wta',
      ladders: {
        domestic: { rank: 5, points: 300 },
        itf: { rank: 88, points: 400 },
        wta: { rank: 210, points: 120 },
      },
    })
    const w = mount(ForkDialog)
    const text = w.text()
    expect(text, 'the table is named').toContain('Her professional rank')
    expect(text, 'and the number is that table\'s').toContain('#210')
    expect(text, 'not the junior alias it used to print').not.toContain('#88')
    w.unmount()
  })

  it('⭐ ...and unranked is a reachable answer again, not the tie floor dressed as a standing', () => {
    // `kidRank` is never null (it falls back to `tableSize`), so the old ternary's `unranked` branch
    // was dead. `LadderView.rank` is nullable and means it.
    patchSnapshot({
      fork: { askedWeek: 265, ageYears: 19 },
      kidRank: 512,
      activeLadder: 'wta',
      ladders: {
        domestic: { rank: null, points: 0 },
        itf: { rank: null, points: 0 },
        wta: { rank: null, points: 0 },
      },
    })
    const w = mount(ForkDialog)
    expect(w.text()).toContain('unranked')
    expect(w.text()).not.toContain('#512')
    w.unmount()
  })
})

describe('the natural end', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('from 29 she may always refuse', () => {
    patchSnapshot({ ageYears: 30, retirementOffer: { askedWeek: 900, seasonIndex: 16, reason: 'age', final: false } })
    const w = mount(RetirementDialog)
    expect(w.findAll('.retire-answer')).toHaveLength(2)
    expect(w.text()).toContain('One more year')
    w.unmount()
  })

  // ⚠ RE-AIMED TWICE, NEVER WEAKENED. (1) The long goodbye §3a: it read «at 38 the LAST offer», and
  // 38 was a real number then – `ENDINGS.stopAskingAgeYears`, now deleted – so the fixture moved to
  // the age the shipped 55% threshold actually produces (41). (2) STEP 4: it then read «the copy
  // says the question ran out», which is the game explaining that IT stopped asking. There is no
  // question on this card at all now, so the assertion asks the thing that replaced it – the line
  // is HERS, and it is pinned through the engine's own symbol rather than through a spelling.
  it('⚠ on the LAST offer there is nothing to answer – one control, and the line on it is hers', () => {
    patchSnapshot({
      ageYears: 41,
      oneMoreYearCount: 4,
      retirementOffer: { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true },
    })
    const w = mount(RetirementDialog)
    const controls = w.findAll('.retire-answer')
    expect(controls).toHaveLength(1)
    expect(w.text(), 'the card printed something other than the engine\'s line').toContain(lastWordLine(4))
    // ⭐ ...and it really is reading the state rather than printing a fixed sentence.
    expect(w.text()).toContain('She has said one more year 4 times')
    // ⚠ THE CONTROL ACKNOWLEDGES, IT DOES NOT ANSWER, and there is no refusal to press.
    expect(controls[0].find('strong').text()).toBe('All right')
    // It must NOT read as a rule that retires her, and it must not grade her either.
    expect(w.text().toLowerCase()).not.toContain('you must')
    w.unmount()
  })

  // ⭐ ROUND-19 #1 – ...AND THE CARD NAMES THE TABLE IT IS TALKING ABOUT.
  // It read «Three seasons and the table has not moved» over a girl who had climbed to #106 in the
  // world, because the rule was reading the junior alias. The rule now asks its question of the
  // ladder she is on, so the sentence has to say which one - the same lesson round-17 #16 shipped
  // when «Season 2035 closed at #79» named no table at all.
  it('the plateau is the same offer asked early, and the card names the table that has not moved', () => {
    patchSnapshot({
      ageYears: 26,
      retirementOffer: { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false },
      activeLadder: 'wta',
      ladders: {
        domestic: { rank: 5, points: 300 },
        itf: { rank: 84, points: 0 },
        wta: { rank: 106, points: 420 },
      },
    })
    const w = mount(RetirementDialog)
    expect(w.text(), 'the table is named').toContain('on the professional table and it has not moved')
    expect(w.findAll('.retire-answer')).toHaveLength(2)
    w.unmount()
  })

  it('⭐ ...and it names HER table, not one the game happens to prefer', () => {
    // A national-table girl gets the same sentence about the national table. `activeLadderOfSnapshot`
    // is the one answer, so the card cannot drift from the rule that raised it.
    patchSnapshot({
      ageYears: 26,
      retirementOffer: { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false },
      activeLadder: 'domestic',
      ladders: {
        domestic: { rank: 42, points: 300 },
        itf: { rank: null, points: 0 },
        wta: { rank: null, points: 0 },
      },
    })
    const w = mount(RetirementDialog)
    expect(w.text()).toContain('on the national table and it has not moved')
    expect(w.text()).not.toContain('professional table')
    w.unmount()
  })
})
