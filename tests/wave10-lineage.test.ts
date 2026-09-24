// WAVE 10 / T6 – THE MOTHER IN THE NEW CAREER: THE HEIRLOOM PAGE AND THE FOUR STROKES.
//
// docs/specs/the-dynasty-2026-09.md §1, his 22.09 ruling on the strokes: «звучит интересно, давай
// попробуем реализовать». T6a is one album page; T6b is eight texture lines, two per stroke.
//
// ⚠⚠ THE LICENCES ARE WHAT THIS FILE IS FOR. Every line rests on a fact the block really carries,
// and an absent fact must print nothing rather than something softer: a mother who won nothing is
// `lineageTitles: 0` – a REAL state, not an absence – so the cabinet lines carry their own second
// gate, and the scar lines carry the ending that caused them. §C flips each fact and watches the
// lines it licensed disappear.
//
// ⚠ THE ALBUM PAGE IS BUILT FROM A REAL WORLD, never from a posed one: `createWorld` with the block
// is the engine's own path and the only producer of `world.dynasty` there is.
//
// MUTATION-VERIFIED 22.09, each applied, RUN and reverted, with the count of what went red:
//   · `dynastyCandidates`' `titles > 0 ? … : null` made unconditional: **1 red** – §B's college
//     mother, whose page would then print «Titles: 0» and tell a girl her mother lost.
//   · the cabinet lines' `(f.lineageTitles ?? 0) > 0` relaxed to `!== null`: **1 red** – the college
//     mother's case in tests/week-notes.test.ts.
//   · the openness fork dropped from one stroke: **1 red** – the «every pole reaches four» case there.

import { describe, expect, it } from 'vitest'
import { assembleAlbum, createWorld } from '../src/engine/world'
import { DEFAULT_PROFILE, type DynastyHandover } from '../src/shared/protocol'

function block(over: Partial<DynastyHandover['motherCareer']> = {}, temperament: DynastyHandover['motherTemperament'] = 'sunny'): DynastyHandover {
  return {
    generation: 2,
    childSeed: 'w10-line:dynasty:2',
    background: 'middle',
    raisedOnTour: true,
    motherName: { first: 'Vera', last: 'Kowalski' },
    motherCountry: 'PL',
    childBirthdays: [{ month: 7, day: 2 }],
    motherTemperament: temperament,
    motherCareer: { titles: 0, proTitles: 0, collegeTitles: 0, bestRank: null, slams: 0, endedWeek: 900, endingKind: 'college', ...over },
  }
}

// =================================================================================================
// A. THE HEIRLOOM – ONE PAGE, ON A CAREER THAT CONTINUES A LINE
// =================================================================================================

describe('wave 10 T6a – the heirloom', () => {
  it('⭐⭐⭐ a dynasty career gets one page and a career with no line behind it gets none', () => {
    const line = createWorld('w10-heir', DEFAULT_PROFILE, 'c-a', undefined, block({ titles: 5, bestRank: 4, slams: 1 }))
    const plain = createWorld('w10-heir', DEFAULT_PROFILE, 'c-b')
    const pageOf = (w: ReturnType<typeof createWorld>) =>
      assembleAlbum(w).sheets.filter((s) => (s.note?.lines.length ?? 0) > 0)
    expect(pageOf(line), 'one page, and exactly one').toHaveLength(1)
    expect(pageOf(plain), 'no line, no page – and the book it always had is untouched').toHaveLength(0)
  })

  it('⭐⭐⭐ the checklist is the block\'s own numbers, and an absent fact prints NOTHING', () => {
    const rich = assembleAlbum(
      createWorld('w10-heir', DEFAULT_PROFILE, 'c-a', undefined, block({ titles: 5, bestRank: 4, slams: 1 })),
    ).sheets.find((s) => (s.note?.lines.length ?? 0) > 0)!
    expect(rich.note!.lines).toEqual(['Vera Kowalski', 'Best ranking: #4', 'Titles: 5', 'Slams: 1', 'Generation 2'])

    // ⚠ THE COLLEGE-FORK MOTHER, AND THE ROWS THAT ARE MISSING ARE THE POINT. A «Titles: 0» would be
    // the book telling a girl her mother lost; a «Best ranking: –» would be the same sentence with a
    // dash in it. What is true of every line there is stays: her name, and the generation.
    const humble = assembleAlbum(
      createWorld('w10-heir2', DEFAULT_PROFILE, 'c-c', undefined, block()),
    ).sheets.find((s) => (s.note?.lines.length ?? 0) > 0)!
    expect(humble.note!.lines).toEqual(['Vera Kowalski', 'Generation 2'])
  })

  it('⚠ it is EARLY in the book – the first chapter, ahead of the first day on court', () => {
    const book = assembleAlbum(
      createWorld('w10-heir', DEFAULT_PROFILE, 'c-a', undefined, block({ titles: 5, bestRank: 4 })),
    )
    const first = book.sheets[0]
    expect(first.chapterIndex, 'the first chapter').toBe(1)
    expect(first.note?.lines.length ?? 0, 'and the heirloom leads it').toBeGreaterThan(0)
  })
})

// =================================================================================================
// ⚠ THE STROKES' LICENCE CASES ARE IN tests/week-notes.test.ts, AND THAT IS A DECISION
// =================================================================================================
//
// They need a whole HOME WEEK to ask a licence about – sixty fields, held at the values the engine
// really produces – and that fixture exists once, in the file that owns the pool. A second copy here
// would be a second spelling of «an ordinary week», free to drift from the first and to go on passing
// while it did. So the eight lines' licences are asserted beside the pool's other licences, under
// «the line – the four strokes», and this file keeps the half that needs a WORLD instead: the album
// page, built by `createWorld` on the engine's own path.
