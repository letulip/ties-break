// ⭐ L3-6 (10.10) – THE BOOK AS THE SCREEN SHOWS IT. The engine sends every string of the album with a CopyRef beside it (`AlbumSheetModel.lineC`, `AlbumNote.textC`, … docs/specs/i18n-2026-10.md §8); this is
// the ONE place a sheet's strings are turned into what is drawn under the current locale. `AlbumScreen` maps the whole book through it before anything else sees a sheet, so:
//   · the layouts, the pager, the chapter rail and the phone sheet read ordinary strings and did not change by a character;
//   · the placement resolver (`albumPlacement.ts`) MEASURES what is drawn - a Russian line is longer than the English one and the geometry must wrap the line the player will read, not the one the
//     engine wrote;
//   · a string with no ref (an engine-born word, a venue, a date line, a book stored by older code) comes out exactly as it went in.
// Under English the result is the input, field for field - `eventText` renders a ref to the very characters it sits beside (tests/i18n-l3-6-endings-album.test.ts proves it for every sheet of the posed set).
// It is a pure function of a sheet and the locale; it reads the locale through `eventText`, so a computed that calls it re-evaluates when the language flips.
import { eventText } from '../i18n'
import type { AlbumChapter, AlbumFrame, AlbumNote, AlbumSheetModel, AlbumTag, AlbumTicket } from '../shared/protocol'

const frameOf = (f: AlbumFrame): AlbumFrame => ({ ...f, alt: eventText({ text: f.alt, c: f.altC }), caption: eventText({ text: f.caption, c: f.captionC }) })

const noteOf = (n: AlbumNote): AlbumNote => ({
  ...n,
  text: eventText({ text: n.text, c: n.textC }),
  ageLabel: n.ageLabel === null ? null : eventText({ text: n.ageLabel, c: n.ageLabelC }),
  lines: n.lines.map((line, i) => eventText({ text: line, c: n.linesC?.[i] ?? undefined })),
})

const ticketOf = (t: AlbumTicket): AlbumTicket => ({
  ...t,
  gate: eventText({ text: t.gate, c: t.gateC }),
  seat: eventText({ text: t.seat, c: t.seatC }),
  row: eventText({ text: t.row, c: t.rowC }),
})

const tagOf = (t: AlbumTag): AlbumTag => ({ ...t, ageLabel: eventText({ text: t.ageLabel, c: t.ageLabelC }) })

export function shownSheet(sheet: AlbumSheetModel): AlbumSheetModel {
  return {
    ...sheet,
    chapterTitle: eventText({ text: sheet.chapterTitle, c: sheet.chapterTitleC }),
    ageLabel: eventText({ text: sheet.ageLabel, c: sheet.ageLabelC }),
    line: eventText({ text: sheet.line, c: sheet.lineC }),
    frames: sheet.frames.map(frameOf),
    note: sheet.note === null ? null : noteOf(sheet.note),
    ticket: sheet.ticket === null ? null : ticketOf(sheet.ticket),
    tag: sheet.tag === null ? null : tagOf(sheet.tag),
  }
}

export function shownChapter(chapter: AlbumChapter): AlbumChapter {
  return { ...chapter, title: eventText({ text: chapter.title, c: chapter.titleC }), ageLabel: eventText({ text: chapter.ageLabel, c: chapter.ageLabelC }) }
}
