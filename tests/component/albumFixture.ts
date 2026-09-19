// A BOOK TO MOUNT THE ALBUM AGAINST, BUILT OUT OF THE REAL CORPUS.
//
// ⚠⚠ WHY THE STRINGS COME FROM `ALBUM_CORPUS` AND ARE NEVER TYPED HERE. Invariant 4: every sentence
// on a sheet is the owner's, generated from `docs/specs/album-corpus-2026-09.md` into
// `src/engine/world/albumCorpus.ts`. A fixture that invented its own handwriting would let the
// components' tests go green against strings nobody ruled, and – worse – would make the "no sentence
// is a literal in a template" assertion vacuous, because the test would be comparing one invention
// against another. Taking them off the corpus means the mounted assertions are literally "the page
// renders what the engine handed it, and the engine's words are his".
//
// ⚠ THIS IS A FIXTURE AND NOT A SELECTOR. Which occasion a sheet earns, which voice it speaks in and
// which layout it gets are all `src/engine/world/albumBook.ts`'s to decide (spec §3 and §5). Nothing
// here models that; it picks three occasions by name so the three layouts can be drawn and measured.
import { ALBUM_CORPUS } from '../../src/engine/world/albumCorpus'
import type { Temperament } from '../../src/engine/spirit'
import type {
  AlbumBook,
  AlbumChapter,
  AlbumLayout,
  AlbumSheetModel,
} from '../../src/components/album/albumWire'

/** One occasion's three registers, in one voice – the shape the engine hands a sheet. */
export function hand(id: string, voice: Temperament = 'sunny') {
  const occasion = ALBUM_CORPUS.find((o) => o.id === id)
  // ⚠ THROWS RATHER THAN FALLING BACK. A renamed occasion must not quietly produce a sheet with
  // empty handwriting that every assertion below then passes on – the `-1` family of failure this
  // repo keeps paying for.
  if (!occasion) throw new Error(`no occasion '${id}' in ALBUM_CORPUS – the fixture is out of date`)
  return occasion.voices[voice]
}

interface SheetOver {
  layout?: AlbumLayout
  chapterIndex?: number
  chapterTitle?: string
  ageLabel?: string
  occasion?: string
  voice?: Temperament
}

let seq = 0

export function sheetOf(over: SheetOver = {}): AlbumSheetModel {
  const layout = over.layout ?? 'A'
  const voice = over.voice ?? 'sunny'
  const words = hand(over.occasion ?? 'first-court', voice)
  const second = hand(over.occasion === 'first-title' ? 'first-final' : 'first-tournament', voice)
  seq += 1

  return {
    id: `sheet-${seq}`,
    layout,
    chapterIndex: over.chapterIndex ?? 1,
    chapterTitle: over.chapterTitle ?? 'The Beginning',
    ageLabel: over.ageLabel ?? 'Age 5 – 8',
    frames: [
      { art: '/images/kid/young-happy.webp', alt: 'On court', caption: words.caption },
      { art: '/images/kid/young-norm.webp', alt: 'Walking on', caption: second.caption },
      { art: '/images/travel/travel-sleepy-airport.webp', alt: 'Airport', caption: hand('first-international', voice).caption },
    ],
    note: {
      text: words.note,
      dateLabel: 'May 12, 2032',
      ageLabel: 'Age 5',
      lines: [],
    },
    line: words.line,
    ticket:
      layout === 'B'
        ? {
            tier: 'World Tour 1000',
            stage: 'Final',
            venue: 'Centre Court',
            dateLabel: 'Oct 14, 2051',
            gate: 'Gate 3',
            seat: 'Seat 14B',
            row: 'Row 14',
            bars: [2, 1, 3, 1, 1, 4, 2, 1, 2, 3, 1, 2],
          }
        : null,
    tag:
      layout === 'C'
        ? { stage: 'Singles final', tier: 'W15', place: 'Rivermouth Open', ageLabel: 'Age 16' }
        : null,
    patch: layout === 'A' ? 'Rivermouth Tennis' : null,
    doodles: layout === 'A' ? ['smile'] : layout === 'B' ? ['heart'] : ['globe'],
  }
}

export function chapterOf(index: number, firstSheet: number, sheetCount: number): AlbumChapter {
  return {
    index,
    title: `Chapter ${index}`,
    ageLabel: 'Age 5 – 8',
    sheetCount,
    firstSheet,
  }
}

/** A book of `n` sheets: an opener, then ordinary ones, the way spec §3 fills a chapter. */
export function bookOf(n: number, over: SheetOver = {}): AlbumBook {
  const sheets = Array.from({ length: n }, (_, i) =>
    sheetOf({ ...over, layout: i === 0 ? over.layout ?? 'A' : 'B', chapterIndex: 1 }),
  )
  return { chapters: [chapterOf(1, 0, n)], sheets }
}
