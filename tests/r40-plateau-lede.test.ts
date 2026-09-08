// ⭐⭐⭐ ROUND 39 #14a – THE PLATEAU CARD'S FOUR LEDES, AS AN ENGINE CLAIM.
//
// THE OWNER, 08.09: «„She said it in the car. Three seasons on the professional table and it has not
// moved…" – одно и то же опять, давай какую-то вариативность в этих фразах сделаем». The card
// printed ONE sentence for the life of a career. `plateauLede` maps `oneMoreYearCount` – how many
// times she has already answered «one more year» – onto four of them.
//
// WHAT THIS FILE HOLDS, and each claim is a way the item could go wrong later:
//   1. four bands, four distinct sentences, and the boundaries are exactly 0 / 1 / 2 / 3+;
//   2. band 0 is the SHIPPED sentence to the byte – the owner's copy, invariant 4;
//   3. no lede asserts a number the state contradicts, which is the defect the drafts carried;
//   4. the door stays open in every band, because 14b is not built;
//   5. the house law – no Cyrillic, no long dash – in copy that no template scanner can see.
//
// ⚠ THE RENDERED HALF IS `tests/component/r40-plateau-lede.test.ts`. This file proves the function;
// that one proves the card actually renders it, which a source-level claim cannot.
import { describe, it, expect } from 'vitest'
import { plateauLede, lastWordLine } from '../src/engine/ending'

const TABLE = 'professional'

/** The bands, named once. `3` and `7` are the same band and must not be the same sentence. */
const COUNTS = [0, 1, 2, 3, 7]

describe('round 39 #14a – the plateau lede escalates with her answers', () => {
  // ===============================================================================================
  // 1. FOUR BANDS, AND THE BOUNDARIES ARE EXACT
  // ===============================================================================================
  it('four counts, four different sentences – the card no longer repeats itself', () => {
    const four = [0, 1, 2, 3].map((n) => plateauLede(n, TABLE))
    expect(new Set(four).size, 'two bands print the same paragraph').toBe(4)
    for (const line of four) expect(line.length, 'a band printed nothing').toBeGreaterThan(80)
  })

  it('⚠ the boundaries are 0 / 1 / 2 / 3+, and nothing straddles them', () => {
    // ⚠ THE PAIRING IS THE POINT, exactly as round 31 #9's rung test states it: "the right band
    // fires" alone is satisfied by a function that returns everything, and "no other band fires" by
    // one that returns nothing. Both, at every boundary and one value well past the last of them.
    const bands = new Map(COUNTS.map((n) => [n, plateauLede(n, TABLE)]))
    expect(bands.get(0)).not.toBe(bands.get(1))
    expect(bands.get(1)).not.toBe(bands.get(2))
    expect(bands.get(2)).not.toBe(bands.get(3))
    // 3 and 7 are ONE band with a number in it: same shape, different sentence.
    expect(bands.get(7)).not.toBe(bands.get(3))
    expect(bands.get(7)!.replace(' 7 ', ' 3 ')).toBe(bands.get(3))
    // ...and the openings really are per band, so a reader can tell them apart in one glance.
    const openings = COUNTS.map((n) => bands.get(n)!.split('.')[0])
    expect(new Set(openings).size, 'two bands open with the same clause').toBe(4)
  })

  it('⚠ every count from 3 up is the open band, and none of them falls back to band 0', () => {
    const zero = plateauLede(0, TABLE)
    for (const n of [3, 4, 5, 12, 40]) {
      expect(plateauLede(n, TABLE), `count ${n} fell out of the open band`).not.toBe(zero)
      expect(plateauLede(n, TABLE)).toContain(`one more year ${n} times`)
    }
  })

  // ===============================================================================================
  // 2. BAND 0 IS HIS, TO THE BYTE
  // ===============================================================================================
  //
  // ⚠ A LITERAL IS CORRECT HERE AND NOWHERE ELSE IN THIS FILE. Every other assertion goes through
  // the symbol so a re-wording moves it; this one is a BYTE-IDENTITY claim about copy the item
  // promised not to touch (invariant 4 – «USER-FACING WORDING IS NOT AN AGENT'S TO CHANGE»), so the
  // bytes ARE the assertion. `tests/component/last-word.test.ts` holds the same string through the
  // rendered card and the two must agree.
  it('⚠⚠ band 0 is the shipped sentence, byte-identical', () => {
    expect(plateauLede(0, 'professional')).toBe(
      'Three seasons on the professional table and it has not moved. If she cannot reach the top, she would rather go now – that is how she put it. She will keep playing if you want her to.',
    )
  })

  it('⚠ ...and a count it cannot read falls back to it rather than inventing a band', () => {
    // A poked save is the only way here – `answerRetirement` only ever adds one to a zero. The
    // shipped words are the safe answer: they name no count, so they cannot be wrong about one.
    const zero = plateauLede(0, TABLE)
    for (const n of [-1, -20, Number.NaN]) expect(plateauLede(n, TABLE), `count ${n}`).toBe(zero)
  })

  it('band 0 and the open band name HER table, and it is the one they are handed', () => {
    for (const n of [0, 3, 7]) {
      expect(plateauLede(n, 'national'), `count ${n}`).toContain('national table')
      expect(plateauLede(n, 'national'), `count ${n} named a table she is not on`).not.toContain('professional')
    }
  })

  // ===============================================================================================
  // 3. NO LEDE ASSERTS A NUMBER THE STATE CONTRADICTS
  // ===============================================================================================
  //
  // ⚠⚠ THIS IS THE DEFECT THE DRAFTS CARRIED, AND IT IS THE REASON THIS SECTION EXISTS. They read
  // «Four seasons at the same table» (band 1) and «She has given you three more winters» (band 3+).
  // Both are true at exactly ONE value of the count, and the 3+ band has no such value – «three»
  // becomes false the moment she says yes again. Neither quantity is on the save either: the asks
  // need not be consecutive, so "seasons flat" cannot be recovered from an answer count at all.
  it('⚠⚠ no band prints a digit that is not `oneMoreYearCount` itself', () => {
    for (const n of COUNTS) {
      const digits = plateauLede(n, TABLE).match(/\d+/g) ?? []
      for (const d of digits) {
        expect(d, `count ${n}: the lede prints ${d}, which is not her count`).toBe(String(n))
      }
      // ...and the bands that must not carry one, do not.
      if (n < 3) expect(digits, `count ${n} printed a number at all`).toEqual([])
      else expect(digits, `count ${n} lost its number`).toEqual([String(n)])
    }
  })

  it('⚠⚠ ...and the two drafted spans are gone – the tripwire names them', () => {
    // A tripwire, not a spell-check: it cannot prove a sentence is true, it can stop these two
    // specific claims being written back in by somebody who has not read the measurement.
    for (const n of [0, 1, 2, 3, 4, 7]) {
      const line = plateauLede(n, TABLE).toLowerCase()
      for (const forbidden of ['four seasons', 'three more winters', 'three seasons at', 'for any of them']) {
        expect(line, `count ${n}: "${forbidden}" is a span the save cannot keep`).not.toContain(forbidden)
      }
    }
    // ⭐ NOT VACUOUS – the ONE spelled count that is legal is legal because its band pins it, and
    // band 0's «Three seasons» is the owner's own shipped word and stays.
    expect(plateauLede(1, TABLE)).toContain('one more year once already')
    expect(plateauLede(0, TABLE)).toContain('Three seasons on the')
  })

  it('⭐ the open band counts what `lastWordLine` counts, in the same words', () => {
    // Two surfaces reading one field must not describe it two ways: the epilogue's line and this
    // card would then disagree about what «one more year» means.
    for (const n of [3, 4, 7]) {
      expect(plateauLede(n, TABLE)).toContain(`one more year ${n} times`)
      expect(lastWordLine(n)).toContain(`one more year ${n} times`)
    }
  })

  // ===============================================================================================
  // 4. HER DOUBT, NEVER A FORECAST – AND THE DOOR STAYS OPEN
  // ===============================================================================================
  //
  // ⚠⚠ MEASURED, NOT A MATTER OF TASTE (`tools/r40-retire-trigger.ts`, 108 careers x 900 weeks): the
  // card asks on 52 careers and in 52 of 52 she LATER beat the rank she held the day it fired, 96.2%
  // of them after the very first ask. Read as a prediction the card is wrong almost always; read as
  // her doubt it is right every time. So a lede may say what she believes and never what the world
  // will do – the player is about to watch it do the opposite.
  it('⚠⚠ no lede forecasts, grades, or blames anybody', () => {
    for (const n of COUNTS) {
      const line = plateauLede(n, TABLE).toLowerCase()
      // (a) a claim about what the world will do next
      for (const forbidden of ['will never', 'never reach', 'she is finished', 'as far as she', 'no future']) {
        expect(line, `count ${n}: "${forbidden}" is a forecast the corpus contradicts`).not.toContain(forbidden)
      }
      // (b) «мы ни за что не наказываем» – no grade on her career and no verdict on the player
      for (const forbidden of ['should have', 'you could have', 'wasted', 'if only', 'your fault']) {
        expect(line, `count ${n}: "${forbidden}" grades somebody`).not.toContain(forbidden)
      }
      // (c) the plateau is a RESULTS reading (§7.2) – a body claim belongs to the age card and is
      //     false here anyway: `physicalShare` is exactly 1 at every plateau ask by construction.
      for (const forbidden of ['tired', 'exhaust', 'worn out', 'wore out', 'her body']) {
        expect(line, `count ${n}: "${forbidden}" is the age card's reading, not this one`).not.toContain(forbidden)
      }
    }
  })

  it('⚠ every band still leaves the answer to the parent – 14b is not built', () => {
    // The card draws TWO controls at every count, so a lede that closed the question would
    // contradict the buttons under it. Each band says so in its own words.
    const stillPlays: [number, string][] = [
      [0, 'She will keep playing if you want her to.'],
      [1, 'She would still play a year for you'],
      [2, 'she will give you one more'],
      [3, 'She will not fight you on one more'],
      [7, 'She will not fight you on one more'],
    ]
    for (const [n, clause] of stillPlays) {
      expect(plateauLede(n, TABLE), `count ${n} closed a question the card still asks`).toContain(clause)
    }
  })

  // ===============================================================================================
  // 5. THE HOUSE LAW, WHERE NO TEMPLATE SCANNER CAN SEE IT
  // ===============================================================================================
  //
  // ⚠ `tests/template-copy-rules.test.ts` scans `<template>` blocks, and this copy is not in one any
  // more – the same hole `last-word.test.ts` opened for `lastWordLine` and covers the same way.
  const CYRILLIC = /[Ѐ-ӿ]/
  const LONG_DASH = /[—―]/

  it('⚠ no Cyrillic and no long dash in any band, at any count', () => {
    for (const n of [-1, 0, 1, 2, 3, 7, 40]) {
      const line = plateauLede(n, TABLE)
      expect(CYRILLIC.test(line), `count ${n}: Cyrillic in the lede – ${line}`).toBe(false)
      expect(LONG_DASH.test(line), `count ${n}: a long dash in the lede – ${line}`).toBe(false)
      // ⭐ NOT A VACUOUS PASS – the short dash really is the one in use.
      expect(line, `count ${n}: no dash at all, so the check above proved nothing`).toContain('–')
    }
  })

  it('⚠ ...and a table name is never left unfilled', () => {
    for (const n of COUNTS) {
      expect(plateauLede(n, TABLE), `count ${n}`).not.toContain('undefined')
      expect(plateauLede(n, TABLE), `count ${n}`).not.toContain('{{')
    }
  })
})
