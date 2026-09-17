// ⭐⭐⭐ ROUND 44 – THE CORPUS DOCUMENT, READ BY MACHINE. **THE CATALOGUE IS GENERATED FROM THE
// DOCUMENT AND NEVER RETYPED**, and this file is the half of that sentence both the emitter and the
// round-trip pin share.
//
// ⚠⚠ WHY A PARSER AND NOT A TRANSCRIPTION. `docs/specs/small-talk-corpus-2026-09.md` holds 817
// authored strings – 172 openers, 129 stance labels, 516 replies. An agent retyping 817 strings
// produces typos that NO TEST CAN CATCH, because a test written by the same agent compares against
// what was typed. So the document is parsed once into `src/engine/world/smallTalkCorpus.ts`
// (committed as ordinary source – no build step, no codegen in the pipeline, «boring TypeScript»
// intact) and `tests/round44-corpus-roundtrip.test.ts` re-parses the document on every run and
// asserts the committed catalogue matches it STRING FOR STRING.
//
// ⚠ EVERY READ HERE THROWS ON A SHAPE IT DOES NOT RECOGNISE. That is the whole discipline: the
// round opened on a measurement that the document parses completely – 43/43 rows, 172/172 openers,
// 129/129 labels, 516/516 replies, zero failures – so a parser that silently skips a row would turn
// a document defect into a missing situation nobody notices. A row this file cannot read is reported,
// never patched around. ⚠ The marker-helper law (`tests/helpers/source.ts`) is the same rule one
// layer over: a region cut with a raw `indexOf` widens silently when its marker rots.

import { readFileSync } from 'node:fs'

/** The corpus document, as the one place any of this is authored. */
export const CORPUS_DOC = new URL('../docs/specs/small-talk-corpus-2026-09.md', import.meta.url)

/** ⚠ THE FOUR VOICES IN THE DOCUMENT'S OWN ORDER, which is the order the opener table and every
 *  stance block are written in. The emitted catalogue keeps it, so a diff of the generated file
 *  reads down the page the document does. */
export const CORPUS_VOICES = ['sunny', 'fiery', 'deep', 'quiet'] as const
export type CorpusVoice = (typeof CORPUS_VOICES)[number]

/** ⚠ THE THREE STANCES IN THE DOCUMENT'S OWN ORDER – which is also `SMALL_TALK_STANCES`' order and
 *  the order the `**Parent:**` line lists its three labels in. The injector's own rule («the block
 *  header is not retyped – it is read out of the row's own `**Parent:**` line, in order») is
 *  re-asserted here rather than trusted: see `assertLabelsAgree`. */
export const CORPUS_STANCES = ['invite', 'respond', 'space'] as const
export type CorpusStance = (typeof CORPUS_STANCES)[number]

export interface CorpusStanceBlock {
  stance: CorpusStance
  /** The parent's option label – ONE per situation per stance, shared by all four voices. */
  label: string
  /** Her reply to exactly that label, per voice. */
  replies: Record<CorpusVoice, string>
}

export interface CorpusRow {
  /** `R1`… – the document's own reference, kept so a report can name the row he wrote. */
  ref: string
  id: string
  subject: string
  stages: string[]
  /** `null` where the heading says `generated`; otherwise the named competitive claim. */
  fact: string | null
  openers: Record<CorpusVoice, string>
  stances: CorpusStanceBlock[]
}

/** ⚠ R3's KEY, AND THE APOSTROPHE IS THE WHOLE OF IT (round 44). The document writes
 *  `the-stranger's-sock`; a situation id is PERSISTED into `lifeLog` as half of the row's `detail`,
 *  compared in the exclusion sets and read back by the album, so an apostrophe in it is a character
 *  in a machine key rather than in a sentence. The id is normalised HERE – at the one door the
 *  document comes through – so the emitter and the round-trip pin cannot disagree about it. */
export function corpusId(documentId: string): string {
  return documentId.replace(/'/g, '')
}

function fail(line: number, what: string): never {
  throw new Error(`small-talk corpus, line ${line + 1}: ${what}`)
}

/** ⚠ A CELL IS BACKTICK-WRAPPED IN EVERY ONE OF THE 817, and the wrapper is stripped HERE so the
 *  emitted string is the spoken payload and nothing else. It throws rather than trimming what it
 *  finds, because a cell that lost its backticks is a document defect to report. */
function unticked(raw: string, line: number, what: string): string {
  const cell = raw.trim()
  if (!cell.startsWith('`') || !cell.endsWith('`') || cell.length < 2) fail(line, `${what} is not backtick-wrapped: ${cell}`)
  return cell.slice(1, -1)
}

/** ⚠ A LABEL IS ITALIC-WRAPPED (`*Ask who else was standing there*`), on the `**Parent:**` line and
 *  again on the block header. Same rule: strip, or throw. */
function unitalic(raw: string, line: number, what: string): string {
  const cell = raw.trim()
  if (!cell.startsWith('*') || !cell.endsWith('*') || cell.length < 2) fail(line, `${what} is not italic-wrapped: ${cell}`)
  return cell.slice(1, -1)
}

const HEADING = /^### (R\d+) · `([^`]+)` · ([a-z-]+) · ([^·]+) · (.+)$/
const FACT = /^\*\*fact: `([a-z-]+)`\*\*$/
const OPENER_TABLE_HEAD = /^\| voice \| opener \|$/
const OPENER_ROW = /^\| `(sunny|fiery|deep|quiet)` \| (.+) \|$/
const PARENT_LINE = /^\*\*Parent:\*\* (.+)$/
const BLOCK_HEAD = /^\*\*(invite|respond|space)\*\* · (.+)$/
const REPLY_LINE = /^- `(sunny|fiery|deep|quiet)` +(.+)$/
const WITHDRAWN = /^### R\d+ · .*WITHDRAWN/

/** ⭐⭐⭐ THE DOCUMENT, AS ROWS. Throws on anything it does not recognise.
 *
 *  ⚠ THE SCOPE OF A ROW IS FROM ITS OWN `###` HEADING TO THE NEXT `#`-HEADING OF ANY DEPTH, which is
 *  what keeps the three `voice × stage` GRID tables out of the opener count: the document holds 184
 *  lines that look like an opener row and only 172 of them are inside a situation. A parser that
 *  swept the file for `| \`sunny\` |` would have counted the grids and been twelve too many, silently.
 *
 *  ⚠ A WITHDRAWN ROW IS SKIPPED BY NAME AND COUNTED, never by «it had no opener table». R26 was
 *  withdrawn on his verdict; a row that merely FAILED to parse must not be able to look like one. */
export function parseCorpus(markdown: string): CorpusRow[] {
  const lines = markdown.split('\n')
  const rows: CorpusRow[] = []
  let withdrawn = 0
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('### R')) continue
    if (WITHDRAWN.test(lines[i])) {
      withdrawn++
      continue
    }
    let end = i + 1
    while (end < lines.length && !lines[end].startsWith('#')) end++
    rows.push(parseRow(lines, i, end))
    i = end - 1
  }
  if (withdrawn !== 1) throw new Error(`small-talk corpus: expected exactly one withdrawn row, found ${withdrawn}`)
  return rows
}

function parseRow(lines: string[], head: number, end: number): CorpusRow {
  const m = HEADING.exec(lines[head])
  if (m === null) fail(head, `unreadable situation heading: ${lines[head]}`)
  const [, ref, documentId, subject, stageList, provenance] = m
  const stages = stageList.split(',').map((s) => s.trim())
  if (stages.length === 0 || stages.some((s) => s.length === 0)) fail(head, `unreadable stage list: ${stageList}`)
  let fact: string | null = null
  if (provenance.trim() !== 'generated') {
    const f = FACT.exec(provenance.trim())
    if (f === null) fail(head, `unreadable provenance: ${provenance}`)
    fact = f[1]
  }

  // ---- the opener table ------------------------------------------------------------------------
  let t = head + 1
  while (t < end && !OPENER_TABLE_HEAD.test(lines[t])) t++
  if (t >= end) fail(head, `${ref} has no opener table`)
  // The header row, then markdown's separator row, then exactly four voices in the document's order.
  if (!/^\| ---+ \| ---+ \|$/.test(lines[t + 1])) fail(t + 1, `${ref}'s opener table has no separator row`)
  const openers = {} as Record<CorpusVoice, string>
  for (let v = 0; v < CORPUS_VOICES.length; v++) {
    const at = t + 2 + v
    const row = OPENER_ROW.exec(lines[at] ?? '')
    if (row === null) fail(at, `${ref}'s opener table row ${v + 1} is unreadable: ${lines[at]}`)
    if (row[1] !== CORPUS_VOICES[v]) fail(at, `${ref}'s opener table is out of order: expected ${CORPUS_VOICES[v]}, found ${row[1]}`)
    openers[row[1] as CorpusVoice] = unticked(row[2], at, `${ref} ${row[1]} opener`)
  }

  // ---- the parent's three labels, in order -----------------------------------------------------
  let p = t + 2 + CORPUS_VOICES.length
  while (p < end && !PARENT_LINE.test(lines[p])) p++
  if (p >= end) fail(head, `${ref} has no **Parent:** line`)
  const parent = PARENT_LINE.exec(lines[p])
  if (parent === null) fail(p, `${ref}'s **Parent:** line is unreadable`)
  const labels = parent[1].split(' · ').map((l, n) => unitalic(l, p, `${ref} label ${n + 1}`))
  if (labels.length !== CORPUS_STANCES.length) {
    fail(p, `${ref}'s **Parent:** line lists ${labels.length} labels, not ${CORPUS_STANCES.length}`)
  }

  // ---- the three stance blocks -----------------------------------------------------------------
  const stanceBlocks: CorpusStanceBlock[] = []
  let b = p + 1
  for (let s = 0; s < CORPUS_STANCES.length; s++) {
    while (b < end && !BLOCK_HEAD.test(lines[b])) b++
    if (b >= end) fail(head, `${ref} has no ${CORPUS_STANCES[s]} block`)
    const bh = BLOCK_HEAD.exec(lines[b])
    if (bh === null) fail(b, `${ref}'s block header is unreadable`)
    if (bh[1] !== CORPUS_STANCES[s]) fail(b, `${ref}'s stance blocks are out of order: expected ${CORPUS_STANCES[s]}, found ${bh[1]}`)
    // ⚠⚠ THE HEADER IS NOT A SECOND SOURCE FOR THE LABEL – it is asserted against the `**Parent:**`
    // line rather than read. §8d.1's whole failure family is «a label and its replies drifting
    // apart», and the document names this check as one a script re-asserts on every read.
    const header = unitalic(bh[2], b, `${ref} ${bh[1]} block label`)
    if (header !== labels[s]) {
      fail(b, `${ref}'s ${bh[1]} block header «${header}» does not match its **Parent:** label «${labels[s]}»`)
    }
    const replies = {} as Record<CorpusVoice, string>
    for (let v = 0; v < CORPUS_VOICES.length; v++) {
      const at = b + 1 + v
      const r = REPLY_LINE.exec(lines[at] ?? '')
      if (r === null) fail(at, `${ref}'s ${bh[1]} reply ${v + 1} is unreadable: ${lines[at]}`)
      if (r[1] !== CORPUS_VOICES[v]) fail(at, `${ref}'s ${bh[1]} block is out of order: expected ${CORPUS_VOICES[v]}, found ${r[1]}`)
      const said = unticked(r[2], at, `${ref} ${bh[1]} ${r[1]} reply`)
      if (said.length === 0) fail(at, `${ref}'s ${bh[1]} ${r[1]} reply is empty`)
      replies[r[1] as CorpusVoice] = said
    }
    stanceBlocks.push({ stance: CORPUS_STANCES[s], label: labels[s], replies })
    b = b + 1 + CORPUS_VOICES.length
  }

  return { ref, id: corpusId(documentId), subject, stages, fact, openers, stances: stanceBlocks }
}

/** The document off disk, parsed. One door, so the emitter and the pin cannot read two files. */
export function readCorpus(): CorpusRow[] {
  return parseCorpus(readFileSync(CORPUS_DOC, 'utf8'))
}

/** ⭐ WHAT THE ROUND OPENED ON, RE-ASSERTED ON EVERY READ: 43 rows, 172 openers, 129 labels, 516
 *  replies. ⚠ These four are DERIVED from the parse and compared against the document's own stated
 *  arithmetic – «any number in a document that can be derived FROM that document is derived by
 *  script before the commit», the corpus's own §3a rule. */
export function corpusCounts(rows: readonly CorpusRow[]): { rows: number; openers: number; labels: number; replies: number } {
  let openers = 0
  let labels = 0
  let replies = 0
  for (const row of rows) {
    openers += Object.keys(row.openers).length
    for (const block of row.stances) {
      labels++
      replies += Object.keys(block.replies).length
    }
  }
  return { rows: rows.length, openers, labels, replies }
}
