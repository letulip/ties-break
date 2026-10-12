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
import { firstWeekAtAge } from './helpers/career'

import { assembleAlbum, createWorld, TEMPERAMENTS, type WorldState } from '../src/engine/world'
import { assignAlbumOrdinals, albumHandOf, dedupeSheetCaptions } from '../src/engine/world/albumBook'
import { ALBUM_CORPUS, type AlbumHand, type AlbumOccasion } from '../src/engine/world/albumCorpus'
import { posedCareer, SWEEP_CAREERS } from './helpers/albumSweep'
import type { AlbumBook } from '../src/shared/protocol'



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

  it('⭐⭐⭐ REPRODUCED AND DEAD TWICE OVER: two layoffs put injury-return on one sheet twice – and since the content half, the page-mate carries a DIFFERENT sentence', () => {
    // His №4, posed the way `bodyCandidates` really builds it: one injury-return candidate PER
    // layoff (`world.injuryHistory`), the two returns ADJACENT in a populated adult chapter.
    // ⚠ THE CHAPTER MUST HOLD SIX, NOT TWO: the §5 thirds rule (`groupCapOf`) tightens to
    // max(1, floor(n/3)), so a two-candidate chapter keeps ONE injury and the arm proves nothing –
    // measured on the first pose of this case. Six candidates make the cap 2 (his own save's shape),
    // and `spreadFrames(6, [2,3,2])` deals [2,2,2], so positions 2 and 3 – the returns – share the
    // middle sheet: the «дважды на одной странице».
    // ⚠ RE-AIMED 12.10, THE SAME DAY, BY THE CONTENT HALF (r49 №4/№5/№7): with the mechanics alone
    // (every pool 1) the second firing repeated A16's caption and the dedupe blanked it – the arm's
    // first shape. Now `injury-return` holds FOUR hands per voice, so the second firing WALKS to the
    // second variant: the page shows two different sentences, which is the owner's actual wish –
    // variety, not a blank. The dedupe stays live for a literal repeat (the pure arm above, and the
    // wrapped-walk shape the synthetic cases pin); this arm now pins the better answer.
    const world = createWorld('r49-dedupe-page')
    const base = firstWeekAtAge(world, 24)
    world.week = base + 60
    world.milestones.push({ type: 'break-even', week: base + 2, kind: 'career' })
    world.milestones.push({ type: 'wedding', week: base + 6, kind: 'p:1' })
    world.injuryHistory.push({ kind: 'ankle soreness', severity: 'moderate', week: base + 10, weeksOut: 6 })
    world.injuryHistory.push({ kind: 'wrist strain', severity: 'moderate', week: base + 14, weeksOut: 4 })
    world.assets.push({ id: 'house-first', boughtWeek: base + 40, paidCents: 0, valueCents: 0, entries: [] })
    world.assets.push({ id: 'merch-brand', boughtWeek: base + 44, paidCents: 0, valueCents: 0, entries: [] })
    const voice = world.temperament!
    const pool = ALBUM_CORPUS.find((o) => o.id === 'injury-return')!.voices[voice]
    expect(pool.length, 'the content half grew A16 to four hands').toBe(4)
    const book = assembleAlbum(world)
    const spoken = book.sheets.flatMap((s) => s.frames.map((f) => f.caption)).filter((c) => c === pool[0].caption)
    expect(spoken, 'the base caption prints ONCE – the second firing is no longer its copy').toHaveLength(1)
    const sheet = book.sheets.find((s) => s.frames.some((f) => f.caption === pool[0].caption))!
    expect(sheet.frames, 'both returns share the sheet – the complaint\'s own shape').toHaveLength(2)
    expect(sheet.frames[0].caption, 'the first firing keeps the base hand').toBe(pool[0].caption)
    expect(sheet.frames[0].captionC, 'and its ref').toEqual({ k: pool[0].caption })
    expect(sheet.frames[1].caption, 'the second firing walks to the SECOND variant – two sentences on the page').toBe(pool[1].caption)
    expect(sheet.frames[1].captionC, 'a written caption keeps its ref').toEqual({ k: pool[1].caption })
    expect(sheet.frames[1].caption, 'and the two are different, so the dedupe has nothing to blank').not.toBe(sheet.frames[0].caption)
    // and the book is deterministic with the walk in it: same world, same book
    expect(assembleAlbum(world), 'two calls on the same world return deep-equal books').toEqual(book)
  })
})

describe('r49 №7 – the pool table (the ratchet, re-aimed by the content half)', () => {
  // ⚠ RE-AIMED 12.10, THE SAME DAY: B9a's ratchet pinned every pool at 1 until the owner's variant
  // hands landed; the content half (B9b) landed them. The seven multi-firing occasions – his
  // «вообще про повторы … много чего есть написать в альбом для разнообразия» – now hold the sizes
  // below, and EVERY OTHER occasion still holds exactly one hand per voice: a pool grows by
  // authoring, in the document, never by accident, so the whole corpus is walked against the table.
  const POOLS: Readonly<Record<string, number>> = {
    'injury-return': 4, // fires once per layoff – 127 measured against 95 titles in the recon
    'title-step-up': 3, // once per true step up the tier ladder
    'final-lost': 3, // once per lost final
    'season-best': 3, // the four season closes fire once per season close each
    'season-recovery': 3,
    'season-held': 3,
    'season-down': 3,
  }

  it('⚠ every pool is the table\'s size – the seven named occasions grew, the other 31 still hold one hand', () => {
    for (const o of ALBUM_CORPUS) {
      for (const voice of TEMPERAMENTS) {
        expect(o.voices[voice].length, `${o.id}/${voice}: the pool is not the table's – author the document, re-emit, and re-aim this table`).toBe(POOLS[o.id] ?? 1)
      }
    }
    expect(ALBUM_CORPUS.filter((o) => (POOLS[o.id] ?? 1) > 1), 'all seven grown occasions exist in the corpus').toHaveLength(7)
  })
})

describe('r49 №4/№5/№7 – THE VARIETY IS MEASURED, NOT ASSERTED (predicted vs measured, the house law)', () => {
  /** Every caption the occasion can speak, any voice, any variant – the corpus's global uniqueness
   *  (album-corpus-roundtrip) is what makes a caption string identify its occasion. */
  function captionsOf(id: string): Set<string> {
    const o = ALBUM_CORPUS.find((x) => x.id === id)!
    const out = new Set<string>()
    for (const voice of TEMPERAMENTS) for (const hand of o.voices[voice]) out.add(hand.caption)
    return out
  }

  /** Per book: how many frames the occasion printed and the worst identical-caption run; the maxima over the set. */
  function measured(books: readonly AlbumBook[], id: string): { maxSame: number; maxPrints: number; total: number } {
    const captions = captionsOf(id)
    let maxSame = 0
    let maxPrints = 0
    let total = 0
    for (const b of books) {
      const counts = new Map<string, number>()
      let prints = 0
      for (const s of b.sheets) {
        for (const f of s.frames) {
          if (!captions.has(f.caption)) continue
          prints++
          counts.set(f.caption, (counts.get(f.caption) ?? 0) + 1)
        }
      }
      maxPrints = Math.max(maxPrints, prints)
      total += prints
      for (const n of counts.values()) maxSame = Math.max(maxSame, n)
    }
    return { maxSame, maxPrints, total }
  }

  /** The r45 sweep career, laid up SEVEN times across ages 15-30 – the owner's own count of the
   *  repeated caption. `posedCareer` holds no layoffs of its own (measured: 0 injury-return frames
   *  across its 48 books), so the returns are posed here, spread so the chapter caps keep several. */
  function laidUpCareer(i: number): WorldState {
    const world = posedCareer(i)
    const ages = [15, 17, 19, 21, 24, 27, 30]
    ages.forEach((age, k) => {
      world.injuryHistory.push({ kind: 'ankle soreness', severity: 'moderate', week: firstWeekAtAge(world, age) + ((i + k) % 40), weeksOut: 3 + (k % 5) })
    })
    world.week = Math.max(world.week, firstWeekAtAge(world, 31) + 10)
    return world
  }

  it('⭐⭐ injury-return: the owner counted SEVEN identical captions in one book – the 7-layoff posed set now measures 2 (predicted ≤ 2 = ceil(7/4))', () => {
    // Predicted: with pool 4 and the deterministic walk, N printed firings hold at most ceil(N/4)
    // identical captions – the owner's 7 gives 2. Measured 12.10 over 48 posed careers with seven
    // layoffs each: the chapter caps keep at most 5 returns per book, 159 across the set, and the
    // worst identical run is exactly 2 (= ceil(5/4)). Before the pools, every print in a book was
    // the same sentence – «фраза … повторяется 7 раз в альбоме».
    const laidUp = Array.from({ length: SWEEP_CAREERS }, (_, i) => assembleAlbum(laidUpCareer(i)))
    const m = measured(laidUp, 'injury-return')
    expect(m.total, 'the posed set really fires the occasion – a zero here is a vacuous measurement').toBe(159)
    expect(m.maxPrints, 'a book keeps up to five returns after the chapter caps').toBe(5)
    expect(m.maxSame, 'predicted ≤ 2 (ceil(7/4), the owner\'s seven) – measured exactly 2').toBe(2)
  })

  it('⭐ season-held: a flat-rank posed set measures 2 (predicted ceil(4/3) = 2)', () => {
    // The plain sweep set almost never holds a rank inside the narrow band (random closes: 2 prints
    // across its 48 books, measured 12.10), so the denominator is posed: every season close given
    // the SAME rank routes every close after the first to `season-held`. Measured: up to 4 held
    // frames per book after the caps, 152 across the set, worst identical run 2 = ceil(4/3).
    const flat = Array.from({ length: SWEEP_CAREERS }, (_, i) => {
      const world = posedCareer(i)
      for (const m of world.milestones) if (m.type === 'season-rank') m.rank = 100
      return assembleAlbum(world)
    })
    const m = measured(flat, 'season-held')
    expect(m.total, 'the flat set really fires the occasion').toBe(152)
    expect(m.maxSame, `predicted ceil(${m.maxPrints}/3) = 2 – measured exactly 2`).toBe(2)
  })

  it('⭐ final-lost: the plain r45 sweep set measures 2 (predicted ceil(4/3) = 2)', () => {
    // The sweep careers lose finals on their own (3-6 `final` milestones, mostly without a
    // same-week title). Measured 12.10: up to 4 lost-final frames per book, 100 across the set,
    // worst identical run 2 = ceil(4/3). Before the pools that 4 was four identical sentences.
    const m = measured(Array.from({ length: SWEEP_CAREERS }, (_, i) => assembleAlbum(posedCareer(i))), 'final-lost')
    expect(m.total, 'the sweep set really fires the occasion').toBe(100)
    expect(m.maxPrints, 'a book keeps up to four lost finals').toBe(4)
    expect(m.maxSame, 'predicted ceil(4/3) = 2 – measured exactly 2').toBe(2)
  })
})
