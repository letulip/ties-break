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
} from '../../src/shared/protocol'

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
    // ⚠⚠ THE PATHS ARE THE ENGINE'S OWN SPELLING, AND BOTH HALVES OF THAT MATTER (19.09, the seam
    // wave). They were invented here – `/images/kid/…`, `/images/travel/…` – while this fixture stood
    // in for an assembly that did not exist yet, and they were wrong in two ways at once: neither
    // directory is on disk, and the LEADING SLASH is the exact spelling `shared/protocol/album.ts`
    // forbids on this field, because a rooted URL ignores the app's base and breaks a `BASE_PATH`
    // deploy. `albumBook.ts` emits `images/fem-euro-brunnet/fem-euro-brunnet-<stem>.webp`, base
    // RELATIVE, and `AlbumPhoto` prefixes `import.meta.env.BASE_URL` – so a fixture that led with a
    // slash was quietly measuring the one shape the app can never receive, and the mounted assertion
    // on the prefix would have been asserting nonsense. These three name real files
    // (`tests/albumBook.test.ts` sweeps the engine's own against `public/`).
    frames: [
      { art: 'images/fem-euro-brunnet/fem-euro-brunnet-young-happy.webp', alt: 'On court', caption: words.caption },
      { art: 'images/fem-euro-brunnet/fem-euro-brunnet-young-norm.webp', alt: 'Walking on', caption: second.caption },
      {
        art: 'images/fem-euro-brunnet/fem-euro-brunnet-travel-sleepy-airport.webp',
        alt: 'Airport',
        caption: hand('first-international', voice).caption,
      },
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
            // ⚠ THE STEP AGREES WITH THE TIER, and it is `ALBUM_TIER_STEP`'s answer for `wta1000`
            // rather than a taste: a fixture that painted a domestic pass in the elite ink would let
            // the ramp's own mounted test go green against a disagreement the engine cannot produce.
            // `tests/albumBook.test.ts` holds the engine to the same table from the other side.
            step: 'elite',
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
        // ⚠ `World Tour 15` AND NOT `W15`, 19.09. The tier on a ticket or a tag is a TIERS label –
        // `albumBook.ts` reads `TIERS[c.tier].label` and can emit nothing else – and this fixture had
        // hand-typed the real ITF designation the protocol field names as forbidden in as many words.
        ? { stage: 'Singles final', tier: 'World Tour 15', step: 'high', place: 'Rivermouth Open', ageLabel: 'Age 16' }
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
