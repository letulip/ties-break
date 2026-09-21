// ⭐⭐⭐ THE ALBUM CORPUS DOCUMENT, READ BY MACHINE. **THE CATALOGUE IS GENERATED FROM THE DOCUMENT
// AND NEVER RETYPED**, and this file is the half of that sentence the emitter and the round-trip pin
// share. It is round 44's shape (`tools/small-talk-corpus-parse.ts`) pointed at the album's §8 step 2.
//
// ⚠⚠ WHY A PARSER AND NOT A TRANSCRIPTION – the same reason, re-measured for this corpus.
// `docs/specs/album-corpus-2026-09.md` holds **400 authored strings**: 128 notes, 128 captions, 128
// loose lines and 16 arc strings. An agent retyping 400 strings produces typos that NO TEST CAN
// CATCH, because a test written by the same agent compares against what was typed. So the document
// is parsed once into `src/engine/world/albumCorpus.ts` (committed as ordinary source – no build
// step, no codegen in the pipeline, «boring TypeScript» intact) and
// `tests/album-corpus-roundtrip.test.ts` re-parses the document on every run and asserts the
// committed catalogue matches it STRING FOR STRING.
//
// ⚠ EVERY READ HERE THROWS ON A SHAPE IT DOES NOT RECOGNISE. A parser that silently skipped a row
// would turn a document defect into a missing occasion nobody notices – and an occasion that is
// silently missing is a sheet with no handwriting on it, which is exactly the empty page the album
// spec's own principle forbids. A row this file cannot read is REPORTED, never patched around.
//
// ⚠ THE SCOPE OF A ROW IS FROM ITS OWN `###` HEADING TO THE NEXT `#`-HEADING OF ANY DEPTH. That is
// what keeps §6's illustration of the format – which contains a `| voice | note |` table drawn in an
// indented block – out of the counts, and it is the same guard round 44 needed for its three
// `voice × stage` grids.

import { readFileSync } from 'node:fs'

/** The corpus document, as the one place any of this is authored. */
export const ALBUM_DOC = new URL('../docs/specs/album-corpus-2026-09.md', import.meta.url)

/** ⚠ THE FOUR VOICES IN THE DOCUMENT'S ORDER, which is the small-talk corpus's order so the two
 *  documents read down the page the same way. `TEMPERAMENTS` in `src/engine/spirit.ts` happens to
 *  list them `sunny, fiery, quiet, deep`; the emitted catalogue is a `Record`, which has no order,
 *  so the two can never disagree about anything but reading. */
export const ALBUM_VOICES = ['sunny', 'fiery', 'deep', 'quiet'] as const
export type AlbumVoice = (typeof ALBUM_VOICES)[number]

/** ⭐⭐ THE THREE REGISTERS, IN THE ORDER A SHEET IS READ: the note is pasted on, the caption sits on
 *  the polaroid's lip, the line is loose in the margin. They are three different things a parent
 *  does on a page (§1) – the note speaks TO her, the caption ABOUT her, the line to nobody – and
 *  the document writes one table per register, in this order, for every occasion. */
export const ALBUM_REGISTERS = ['note', 'caption', 'line'] as const
export type AlbumRegister = (typeof ALBUM_REGISTERS)[number]

/** ⚠ THE ALBUM'S CHAPTERS, AND `jun` IS NOT ONE OF THEM. Spec §3 and §4b: the band under 11 is
 *  unreachable (the world starts at thirteen) and carried **0 milestones on all nine** of his
 *  measured careers. An occasion that named it would be an occasion written to be skipped, so the
 *  parser refuses the word rather than trusting the author not to type it. */
export const ALBUM_BANDS = ['prologue', 'young', 'teen', 'adult', 'lateCareer'] as const
export type AlbumBand = (typeof ALBUM_BANDS)[number]

/** ⚠ THE FAMILY THE ENGINE SELECTS FROM – the `MilestoneType`s plus the four this corpus adds:
 *  `prologue` (the trace persisted at handover), `asset` (`world.assets` and its `boughtWeek`),
 *  `rare` (his super-rare three, all derived from stored history) and `closing` (the three written
 *  frames). Validated rather than free text, for the reason the bands are.
 *  ⭐ `birth` JOINED AT WAVE 8b T6, and it is a `MilestoneType` like the nine before it rather than a
 *  fifth corpus-only family: v85's `landBirth` captures a `'birth'` milestone, so the selector reads
 *  a ledger the save never prunes exactly as the wedding's does. */
export const ALBUM_KINDS = [
  'prologue',
  'title',
  'final',
  'prize',
  'international',
  'injury',
  'season-rank',
  'break-even',
  'school',
  'wedding',
  'birth',
  'asset',
  'rare',
  'closing',
] as const
export type AlbumKind = (typeof ALBUM_KINDS)[number]

/** ⭐ THE ARC'S TWO DIRECTIONS (§5). ⚠ `wallsLean`'s own sign convention decides which move is which;
 *  this corpus writes both and names no number. And there is deliberately NO third direction for
 *  «she never drifted» – spec §4b measured the lean moving on 1 career of 9, and the ruling is that
 *  the closing sheet takes `A32` rather than telling the other eight they stayed themselves. */
export const ALBUM_ARC_DIRECTIONS = ['open', 'reserved'] as const
export type AlbumArcDirection = (typeof ALBUM_ARC_DIRECTIONS)[number]

/** ⚠ THE ARC CARRIES TWO REGISTERS, NOT THREE, and §5 gives the reason: its sentence needs both
 *  points in it – what she was and what she became – and a caption is a handful of words on the lip
 *  of a photograph. The shape is declared here so the completeness pin can tell a documented
 *  exception from a hole. */
export const ALBUM_ARC_REGISTERS = ['note', 'line'] as const
export type AlbumArcRegister = (typeof ALBUM_ARC_REGISTERS)[number]

export interface AlbumHand {
  /** to her, second person – the pasted note */
  note: string
  /** about her, third person – the polaroid's bottom lip */
  caption: string
  /** to nobody – the parent thinking, loose in the margin */
  line: string
}

export interface AlbumRow {
  /** `A1`… – the document's own reference, kept so a report can name the row he read. */
  ref: string
  id: string
  kind: AlbumKind
  bands: AlbumBand[]
  /** `null` where the heading says `any`; otherwise the named condition beyond the kind. */
  gate: string | null
  voices: Record<AlbumVoice, AlbumHand>
}

export interface AlbumArcRow {
  direction: AlbumArcDirection
  /** the heading's own gloss, kept so the document and the catalogue cannot disagree about it */
  gloss: string
  voices: Record<AlbumVoice, { note: string; line: string }>
}

export interface AlbumCorpus {
  occasions: AlbumRow[]
  arc: AlbumArcRow[]
}

function fail(line: number, what: string): never {
  throw new Error(`album corpus, line ${line + 1}: ${what}`)
}

/** ⚠ A CELL IS BACKTICK-WRAPPED IN EVERY ONE OF THE 400, and the wrapper is stripped HERE so the
 *  emitted string is the handwriting and nothing else. It throws rather than trimming what it
 *  finds, because a cell that lost its backticks is a document defect to report. */
function unticked(raw: string, line: number, what: string): string {
  const cell = raw.trim()
  if (!cell.startsWith('`') || !cell.endsWith('`') || cell.length < 2) fail(line, `${what} is not backtick-wrapped: ${cell}`)
  const payload = cell.slice(1, -1)
  if (payload.length === 0) fail(line, `${what} is empty`)
  return payload
}

const OCCASION_HEADING = /^### (A\d+) · `([^`]+)` · ([a-z-]+) · ([^·]+) · (.+)$/
const GATE = /^\*\*gate: `([a-z-]+)`\*\*$/
const ARC_HEADING = /^### ARC · `([a-z]+)` – (.+)$/
const TABLE_HEAD = /^\| voice \| (note|caption|line) \|$/
const SEPARATOR = /^\| ---+ \| ---+ \|$/
const TABLE_ROW = /^\| `(sunny|fiery|deep|quiet)` \| (.+) \|$/
/** ⚠ AN ID IS READ BACK BY THE ALBUM AND NAMED IN THE SELECTOR, so it is a machine key rather than a
 *  sentence: lower case, digits and hyphens. Round 44 learned this from an apostrophe that had to be
 *  normalised at the door; this corpus refuses the character instead of stripping it, which is the
 *  cheaper half of the same lesson. */
const ID = /^[a-z][a-z0-9-]*$/

/** ⭐⭐⭐ THE DOCUMENT, AS ROWS. Throws on anything it does not recognise. */
export function parseAlbumCorpus(markdown: string): AlbumCorpus {
  const lines = markdown.split('\n')
  const occasions: AlbumRow[] = []
  const arc: AlbumArcRow[] = []
  for (let i = 0; i < lines.length; i++) {
    const isOccasion = OCCASION_HEADING.test(lines[i])
    const isArc = ARC_HEADING.test(lines[i])
    if (!isOccasion && !isArc) continue
    let end = i + 1
    while (end < lines.length && !lines[end].startsWith('#')) end++
    if (isOccasion) occasions.push(parseOccasion(lines, i, end))
    else arc.push(parseArc(lines, i, end))
    i = end - 1
  }
  return { occasions, arc }
}

/** The three register tables of one row, in the document's order, each read strictly: head,
 *  separator, then exactly four voices in the document's order. Returns them by register. */
function parseTables(
  lines: string[],
  head: number,
  end: number,
  ref: string,
  want: readonly string[],
): Record<string, Record<AlbumVoice, string>> {
  const out: Record<string, Record<AlbumVoice, string>> = {}
  let t = head + 1
  for (const register of want) {
    while (t < end && !TABLE_HEAD.test(lines[t])) t++
    if (t >= end) fail(head, `${ref} has no ${register} table`)
    const found = TABLE_HEAD.exec(lines[t])![1]
    // ⚠⚠ THE ORDER IS ASSERTED, NOT SEARCHED FOR. A `caption` table read where a `note` was expected
    // is a document whose registers have been shuffled, and shuffling them swaps who the sentence
    // addresses – the whole distinction §1 is about. Finding the right head further down would hide
    // exactly that.
    if (found !== register) fail(t, `${ref}'s tables are out of order: expected ${register}, found ${found}`)
    if (!SEPARATOR.test(lines[t + 1] ?? '')) fail(t + 1, `${ref}'s ${register} table has no separator row`)
    const cells = {} as Record<AlbumVoice, string>
    for (let v = 0; v < ALBUM_VOICES.length; v++) {
      const at = t + 2 + v
      const row = TABLE_ROW.exec(lines[at] ?? '')
      if (row === null) fail(at, `${ref}'s ${register} row ${v + 1} is unreadable: ${lines[at]}`)
      if (row[1] !== ALBUM_VOICES[v]) fail(at, `${ref}'s ${register} table is out of order: expected ${ALBUM_VOICES[v]}, found ${row[1]}`)
      cells[row[1] as AlbumVoice] = unticked(row[2], at, `${ref} ${row[1]} ${register}`)
    }
    out[register] = cells
    t = t + 2 + ALBUM_VOICES.length
  }
  return out
}

function parseOccasion(lines: string[], head: number, end: number): AlbumRow {
  const m = OCCASION_HEADING.exec(lines[head])
  if (m === null) fail(head, `unreadable occasion heading: ${lines[head]}`)
  const [, ref, id, kind, bandList, provenance] = m
  if (!ID.test(id)) fail(head, `${ref}'s id is not a machine key: ${id}`)
  if (!(ALBUM_KINDS as readonly string[]).includes(kind)) fail(head, `${ref}'s kind is not one of the fourteen: ${kind}`)
  const bands = bandList.split(',').map((b) => b.trim())
  if (bands.length === 0 || bands.some((b) => b.length === 0)) fail(head, `${ref} has an unreadable band list: ${bandList}`)
  for (const band of bands) {
    if (!(ALBUM_BANDS as readonly string[]).includes(band)) fail(head, `${ref} names a band the album has no chapter for: ${band}`)
  }
  // ⚠ `\`any\`` IS BACKTICKED LIKE EVERY OTHER MACHINE-READ TOKEN IN THE DOCUMENT, and the bare word
  // is refused rather than accepted as a synonym. Two spellings of «no gate» is two things a future
  // editor can write and only one the reader of a diff would recognise.
  let gate: string | null = null
  if (provenance.trim() !== '`any`') {
    const g = GATE.exec(provenance.trim())
    if (g === null) fail(head, `${ref}'s gate is unreadable: ${provenance}`)
    gate = g[1]
  }

  const tables = parseTables(lines, head, end, ref, ALBUM_REGISTERS)
  const voices = {} as Record<AlbumVoice, AlbumHand>
  for (const voice of ALBUM_VOICES) {
    voices[voice] = {
      note: tables.note[voice],
      caption: tables.caption[voice],
      line: tables.line[voice],
    }
  }
  return { ref, id, kind: kind as AlbumKind, bands: bands as AlbumBand[], gate, voices }
}

function parseArc(lines: string[], head: number, end: number): AlbumArcRow {
  const m = ARC_HEADING.exec(lines[head])
  if (m === null) fail(head, `unreadable arc heading: ${lines[head]}`)
  const [, direction, gloss] = m
  if (!(ALBUM_ARC_DIRECTIONS as readonly string[]).includes(direction)) {
    fail(head, `the arc has no direction called ${direction}`)
  }
  const tables = parseTables(lines, head, end, `ARC/${direction}`, ALBUM_ARC_REGISTERS)
  const voices = {} as Record<AlbumVoice, { note: string; line: string }>
  for (const voice of ALBUM_VOICES) voices[voice] = { note: tables.note[voice], line: tables.line[voice] }
  return { direction: direction as AlbumArcDirection, gloss: gloss.trim(), voices }
}

/** The document off disk, parsed. One door, so the emitter and the pin cannot read two files. */
export function readAlbumCorpus(): AlbumCorpus {
  return parseAlbumCorpus(readFileSync(ALBUM_DOC, 'utf8'))
}

/** ⭐ THE DOCUMENT'S OWN ARITHMETIC, DERIVED ON EVERY READ – «any number in a document that can be
 *  derived FROM that document is derived by script before the commit» (the small-talk corpus's §3a
 *  rule, and the third counting slip of one day is what wrote it).
 *
 *  ⚠ EVERY FIGURE IS COUNTED RATHER THAN ASSUMED TO BE `occasions × 4`. A parser whose register
 *  tables silently failed to match would report zero, and zero multiplied by anything still looks
 *  like a tidy answer. */
export function albumCounts(corpus: AlbumCorpus): {
  occasions: number
  notes: number
  captions: number
  lines: number
  arcCells: number
  arcStrings: number
} {
  let notes = 0
  let captions = 0
  let lines = 0
  for (const row of corpus.occasions) {
    for (const voice of ALBUM_VOICES) {
      if (row.voices[voice].note.length > 0) notes++
      if (row.voices[voice].caption.length > 0) captions++
      if (row.voices[voice].line.length > 0) lines++
    }
  }
  let arcCells = 0
  let arcStrings = 0
  for (const row of corpus.arc) {
    for (const voice of ALBUM_VOICES) {
      arcCells++
      if (row.voices[voice].note.length > 0) arcStrings++
      if (row.voices[voice].line.length > 0) arcStrings++
    }
  }
  return { occasions: corpus.occasions.length, notes, captions, lines, arcCells, arcStrings }
}
