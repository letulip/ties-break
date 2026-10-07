// ⭐⭐⭐ ROUND 48 #4 – «ONE MORE YEAR» IS THE PARENT'S WORD, AND THE ENGINE'S FOUR SITES SAY SO (07.10;
// docs/rounds/round-48.md item 4, the REOPEN of round 47 #11).
//
// THE OWNER, 07.10 (translated), on the line round 47 closed as «answered, drafts waiting»: it was not her who
// said that, it was us who proposed it – reword it. The retirement card asks the PARENT, and «One more year» is
// the button the player taps (`answerRetirement(world, false)`; what `oneMoreYearCount` counts is HIS taps). The
// engine wrote the words in HER voice at five sites. Three of them are engine copy and are asserted HERE; the
// page line (EndingScreen) and the note under the button (RetirementDialog) are template strings, and their
// rendered half is `tests/component/r48-b1-ending-page.test.ts`.
//
// ⚠⚠ THE FINAL OFFER IS THE EXCEPTION AND IT IS TRULY HERS. «Nobody asked her this time. She said it herself» has
// no refuse button and the decision genuinely belongs to her, so `LAST_WORD_OPENING` is asserted UNTOUCHED, to the
// byte – and so are the two plateau bands that never credited her with the parent's answer (0 and 2).
//
// ⚠ THE LITERALS ARE THE POINT OF THIS FILE, which is the opposite of `last-word.test.ts`'s «through the symbol»
// rule and for the opposite reason: the owner reads the final strings in the round ledger, and a pin through a
// symbol moves with a re-word and stays green – the one kind of diff no test catches (CLAUDE.md invariant 4).
// These are the bytes that were put in front of him.
import { describe, expect, it } from 'vitest'
import { LAST_WORD_OPENING, lastWordLine, plateauLede } from '../src/engine/ending'
import { answerRetirement, createWorld } from '../src/engine/world'

const TABLE = 'professional'

describe('⭐⭐⭐ round 48 #4 – lastWordLine: her opening is hers, the count is the parent\'s', () => {
  it('⭐⭐⭐ her opening is UNTOUCHED, to the byte', () => {
    // ⚠⚠ THE ARM. Flip this one too (the lazy sweep: every «she said» in the file becomes «you said») and the
    // line below reads «Nobody asked you this time» – a final offer nobody asked the PARENT about, which is the
    // exact fiction the exception exists to protect. Measured 07.10, RED [2 tests – this one and the count-sentence
    // one, whose literal carries the opening].
    expect(LAST_WORD_OPENING).toBe('Nobody asked her this time. She said it herself, and she said it steadily.')
  })

  it('⭐⭐⭐ the count sentence is «You have said one more year N times», singular kept, and count 0 unchanged', () => {
    // ⚠⚠ THE ARM. Put «She has said» back in `lastWordLine` and this goes red on its first line: measured 07.10,
    // RED [3 tests – this one and both tripwires at the foot of the file].
    expect(lastWordLine(4)).toBe(
      'Nobody asked her this time. She said it herself, and she said it steadily. You have said one more year 4 times, and this season was the last one.',
    )
    expect(lastWordLine(1)).toBe(
      'Nobody asked her this time. She said it herself, and she said it steadily. You have said one more year 1 time, and this season was the last one.',
    )
    // A poked save with no count never prints «one more year 0 times» – the branch is the same as it ever was.
    expect(lastWordLine(0)).toBe(
      'Nobody asked her this time. She said it herself, and she said it steadily. This season was the last one.',
    )
  })
})

describe('⭐⭐⭐ round 48 #4 – plateauLede: the two bands that counted her answers now count the parent\'s', () => {
  it('⭐⭐⭐ band 1 – «You have said one more year once already», the rest of the paragraph as it was', () => {
    expect(plateauLede(1, TABLE)).toBe(
      'She brought it up before the airport this time. You have said one more year once already, and she has ' +
        'stopped pretending the next season is different. She would still play a year for you – she said that too.',
    )
  })

  it('⭐⭐⭐ band 3+ – «You have said one more year N times», the table and the open number as they were', () => {
    // ⚠⚠ THE ARMS, each alone. Put «She has said» back in the open band, or in band 1 above, and the band's own test
    // goes red: measured 07.10, RED [3 tests each – the band's test and both tripwires at the foot of the file].
    expect(plateauLede(4, TABLE)).toBe(
      'This time she said it looking out of the window. You have said one more year 4 times, and the professional ' +
        'table has not moved. She will not fight you on one more – but you both know what she wants.',
    )
    expect(plateauLede(9, TABLE)).toBe(
      'This time she said it looking out of the window. You have said one more year 9 times, and the professional ' +
        'table has not moved. She will not fight you on one more – but you both know what she wants.',
    )
  })

  it('⚠⚠ bands 0 and 2 never credited her with the parent\'s answer and are UNTOUCHED, to the byte', () => {
    // Band 0 is the owner's own shipped sentence (invariant 4, «Three» and all); band 2 carries no count and no
    // «said one more year» at all. Neither is in the five sites, so neither may move with them.
    expect(plateauLede(0, TABLE)).toBe(
      'Three seasons on the professional table and it has not moved. If she cannot reach the top, she would ' +
        'rather go now – that is how she put it. She will keep playing if you want her to.',
    )
    expect(plateauLede(2, TABLE)).toBe(
      'She did not argue and she did not ask. She put the season on the table – where it started, where it ' +
        'ended – and waited. If you want another year, she will give you one more.',
    )
  })
})

describe('⭐⭐⭐ round 48 #4 – the diary line, through the REAL command', () => {
  it('⭐⭐⭐ pressing «One more year» files «One more year, you said. Same as last time.»', () => {
    const world = createWorld('r48-b1-voice-flip')
    world.retirementOffer = { askedWeek: world.week, seasonIndex: 0, reason: 'age', final: false }
    answerRetirement(world, false)
    // ⚠⚠ THE ARM. Put «she said» back at `answerRetirement` (world/endings.ts) and this goes red: measured 07.10,
    // RED [1 test]. The count moved too – the REAL command, so the line and the state are one act.
    const filed = world.events.filter((e) => e.text.includes('Same as last time')).map((e) => e.text)
    expect(filed).toEqual(['One more year, you said. Same as last time.'])
    expect(world.oneMoreYearCount).toBe(1)
  })
})

describe('⚠⚠ round 48 #4 – no engine line credits her with saying «one more year» any more', () => {
  // A TRIPWIRE, NOT A SPELL-CHECK: it cannot prove a sentence is honest, it can stop the one specific attribution
  // the owner refused from being written back in by somebody who has not read the ledger. It sweeps the counts the
  // card can reach, because a count is exactly what moves a band.
  const CREDITS_HER = /\bshe (has |had )?said one more/i

  it('⚠⚠ not lastWordLine, not any plateau band, at any count', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 9, 12, 40]) {
      expect(lastWordLine(n), `lastWordLine(${n})`).not.toMatch(CREDITS_HER)
      expect(plateauLede(n, TABLE), `plateauLede(${n})`).not.toMatch(CREDITS_HER)
    }
  })

  it('⭐ ...and it is NOT vacuous – the parent\'s sentence really is on the lines that carry a count', () => {
    for (const n of [1, 3, 4, 9]) expect(lastWordLine(n), `lastWordLine(${n})`).toMatch(/You have said one more year/)
    for (const n of [1, 3, 4, 9]) expect(plateauLede(n, TABLE), `plateauLede(${n})`).toMatch(/You have said one more year/)
  })
})
