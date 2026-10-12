// ⭐⭐ ROUND 49 №4/№5/№7 – THE MECHANICS HALF: the corpus holds VARIANT POOLS, the book walks them
// deterministically, and a sheet never prints one sentence twice.
//
// THE OWNER: «фраза "она сообщила время тренировки" повторяется 7 раз в альбоме, причем один раз
// дважды на одной странице» (№4); the first-week-back note three times over (№5); «много чего есть
// написать в альбом для разнообразия» (№7). This file proves the machinery; the WORDS land with the
// content half, which is why the ratchet below pins every real pool at 1 – today the album is
// byte-identical to what it was, and the existing album suites say so by staying green untouched.
//
// ⚠⚠ A CHOICE, NEVER A DRAW (the LB-note law): the walk is `variants[firing ordinal % pool]`,
// arithmetic over the order candidates stand in the book. Zero MAIN draws, zero sub-streams –
// `tests/condition.test.ts`'s frozen capture does not move.
//
// MUTATION LEDGER (12.10, each arm applied to `albumBook.ts`, run, restored):
//   ARM A  the ordinal hardcoded (`c.ordinal = 0` in `assignAlbumOrdinals`)  → red (the walk case:
//          firings 3 and 4 answer variants 0 and 1, a frozen walk answers variant 0 five times)
import { describe, expect, it } from 'vitest'

import { assembleAlbum, createWorld, kidAgeAt, TEMPERAMENTS, type WorldState } from '../src/engine/world'
import { assignAlbumOrdinals, albumHandOf, dedupeSheetCaptions } from '../src/engine/world/albumBook'
import { ALBUM_CORPUS, type AlbumHand, type AlbumOccasion } from '../src/engine/world/albumCorpus'

function weekAtAge(world: WorldState, age: number): number {
  for (let w = 0; w < 2000; w++) if (kidAgeAt(world, w) === age) return w
  throw new Error(`no week reaches age ${age}`)
}

/** A synthetic hand – TEST data, never corpus copy (`tests/component/albumFixture.ts`'s rule holds:
 *  nothing here reaches a screen, and no sentence here is the owner's). */
function hand(stem: string): AlbumHand {
  return { note: `note ${stem} you`, caption: `caption ${stem}`, line: `line ${stem}` }
}

/** A synthetic occasion whose `sunny` pool is `stems.length` deep; the walk is per voice, so the
 *  other three voices keep a pool of one. */
function occasionOf(id: string, stems: readonly string[]): AlbumOccasion {
  return {
    id,
    kind: 'injury',
    bands: ['adult'],
    gate: null,
    voices: {
      sunny: stems.map(hand),
      fiery: [hand(`${id}-f`)],
      quiet: [hand(`${id}-q`)],
      deep: [hand(`${id}-d`)],
    },
  }
}

describe('r49 №7 – the variant walk: a choice over the firing ordinal, never a draw', () => {
  it('⭐⭐ firings 0..4 of a three-variant occasion take variants 0,1,2,0,1 – per occasion id, across chapters', () => {
    const synthetic = occasionOf('syn-return', ['one', 'two', 'three'])
    const bystander = occasionOf('syn-other', ['solo'])
    const build = () => [
      { candidates: [{ occasion: synthetic }, { occasion: bystander }, { occasion: synthetic }] as { occasion: AlbumOccasion; ordinal?: number }[] },
      { candidates: [{ occasion: synthetic }, { occasion: synthetic }, { occasion: bystander }, { occasion: synthetic }] as { occasion: AlbumOccasion; ordinal?: number }[] },
    ]
    const chapters = build()
    assignAlbumOrdinals(chapters)
    const own = chapters.flatMap((ch) => ch.candidates).filter((c) => c.occasion.id === 'syn-return')
    expect(own.map((c) => c.ordinal), 'the firing ordinal is 0-based and per occasion id, in book order').toEqual([0, 1, 2, 3, 4])
    expect(own.map((c) => albumHandOf(c, 'sunny').caption), 'the walk wraps: 5 firings over a pool of 3').toEqual([
      'caption one',
      'caption two',
      'caption three',
      'caption one',
      'caption two',
    ])
    // ⚠ the bystander's own count is its own – a global counter would hand it ordinal 1 and 4
    const other = chapters.flatMap((ch) => ch.candidates).filter((c) => c.occasion.id === 'syn-other')
    expect(other.map((c) => c.ordinal), 'ordinals count per occasion id, not per book').toEqual([0, 1])
    // determinism: the same chapters assign the same ordinals on a second pass
    const again = build()
    assignAlbumOrdinals(again)
    expect(again.flatMap((ch) => ch.candidates).map((c) => c.ordinal)).toEqual(chapters.flatMap((ch) => ch.candidates).map((c) => c.ordinal))
  })

  it('⭐ a pool of 2 gives two same-occasion frames DIFFERENT texts, so the sheet dedupe keeps both', () => {
    const synthetic = occasionOf('syn-two', ['first', 'second'])
    const candidates: { occasion: AlbumOccasion; ordinal?: number }[] = [{ occasion: synthetic }, { occasion: synthetic }]
    assignAlbumOrdinals([{ candidates }])
    const texts = candidates.map((c) => albumHandOf(c, 'sunny').caption)
    expect(texts[0], 'two firings, two hands').not.toBe(texts[1])
    expect(dedupeSheetCaptions(texts), 'different sentences both print').toEqual(texts)
  })

  it('⚠ an absent ordinal reads as the first firing – hand-built candidates keep their words', () => {
    const synthetic = occasionOf('syn-bare', ['one', 'two'])
    expect(albumHandOf({ occasion: synthetic }, 'sunny').caption).toBe('caption one')
  })
})

describe('r49 №4 – the per-sheet caption dedupe: «дважды на одной странице» is dead', () => {
  it('⭐ the pure rule: a literal repeat on one sheet renders no caption, a different sentence keeps its own', () => {
    expect(dedupeSheetCaptions(['same', 'same', 'other'])).toEqual(['same', '', 'other'])
    expect(dedupeSheetCaptions(['a', 'b', 'a'])).toEqual(['a', 'b', ''])
    expect(dedupeSheetCaptions([])).toEqual([])
  })

  it('⭐⭐⭐ REPRODUCED AND DEAD: two layoffs put injury-return on one sheet twice – the first keeps A16\'s caption, the second goes captionless', () => {
    // His №4, posed the way `bodyCandidates` really builds it: one injury-return candidate PER
    // layoff (`world.injuryHistory`), the two returns ADJACENT in a populated adult chapter.
    // ⚠ THE CHAPTER MUST HOLD SIX, NOT TWO: the §5 thirds rule (`groupCapOf`) tightens to
    // max(1, floor(n/3)), so a two-candidate chapter keeps ONE injury and the arm proves nothing –
    // measured on the first pose of this case. Six candidates make the cap 2 (his own save's shape),
    // and `spreadFrames(6, [2,3,2])` deals [2,2,2], so positions 2 and 3 – the returns – share the
    // middle sheet: the «дважды на одной странице».
    const world = createWorld('r49-dedupe-page')
    const base = weekAtAge(world, 24)
    world.week = base + 60
    world.milestones.push({ type: 'break-even', week: base + 2, kind: 'career' })
    world.milestones.push({ type: 'wedding', week: base + 6, kind: 'p:1' })
    world.injuryHistory.push({ kind: 'ankle soreness', severity: 'moderate', week: base + 10, weeksOut: 6 })
    world.injuryHistory.push({ kind: 'wrist strain', severity: 'moderate', week: base + 14, weeksOut: 4 })
    world.assets.push({ id: 'house-first', boughtWeek: base + 40, paidCents: 0, valueCents: 0, entries: [] })
    world.assets.push({ id: 'merch-brand', boughtWeek: base + 44, paidCents: 0, valueCents: 0, entries: [] })
    const voice = world.temperament!
    const caption = ALBUM_CORPUS.find((o) => o.id === 'injury-return')!.voices[voice][0].caption
    const book = assembleAlbum(world)
    const spoken = book.sheets.flatMap((s) => s.frames.map((f) => f.caption)).filter((c) => c === caption)
    expect(spoken, 'A16 fired twice and prints ONCE – the page-mate is deduped').toHaveLength(1)
    const sheet = book.sheets.find((s) => s.frames.some((f) => f.caption === caption))!
    expect(sheet.frames, 'both returns share the sheet – the complaint\'s own shape').toHaveLength(2)
    expect(sheet.frames[0].caption, 'the first firing keeps the corpus caption').toBe(caption)
    expect(sheet.frames[0].captionC, 'and its ref').toEqual({ k: caption })
    expect(sheet.frames[1].caption, 'the repeat renders NO caption – the filler photos\' own captionless path').toBe('')
    expect(sheet.frames[1].captionC, 'no caption, no ref').toBeUndefined()
    // and the book is deterministic with the dedupe in it: same world, same book
    expect(assembleAlbum(world), 'two calls on the same world return deep-equal books').toEqual(book)
  })
})

describe('r49 №7 – the ratchet the content half re-aims', () => {
  it('⚠ RATCHET (12.10): every real pool is exactly 1 until the owner\'s variant hands land', () => {
    // The mechanics ship ahead of the words, so TODAY the walk is `[0]` on every firing and the
    // album is byte-identical – which the album suites prove by staying green untouched. The content
    // half (№4/№5/№7's sentences, the owner's) re-aims this arm to the pools it grows.
    for (const o of ALBUM_CORPUS) {
      for (const voice of TEMPERAMENTS) {
        expect(o.voices[voice].length, `${o.id}/${voice}: a pool grew – re-aim this ratchet with the content half`).toBe(1)
      }
    }
  })
})
