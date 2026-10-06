// ⭐⭐⭐ THE ONE-OFF THAT WRITES `src/engine/world/albumCorpus.ts`.
//
//     npx vite-node tools/album-corpus-emit.ts            # print to stdout
//     npx vite-node tools/album-corpus-emit.ts --write    # write the module
//
// ⚠⚠ IT IS A ONE-OFF AND NOT A BUILD STEP – round 44's ruling, carried: «its output is committed as
// ordinary source – no build step, no codegen in the pipeline, boring TypeScript intact». Nothing in
// `npm run check`, `npm run build` or the dev server runs this file. What keeps the committed module
// honest is `tests/album-corpus-roundtrip.test.ts`, which re-parses the document on every run and
// compares it to the committed catalogue STRING FOR STRING – so a hand-edit of the generated file
// goes red, and so does a document edit that was never re-emitted.
//
// ⚠ RE-RUNNING IT IS THE ONLY LEGITIMATE WAY TO CHANGE THE 400. When the owner edits a line in
// `docs/specs/album-corpus-2026-09.md`, run this with `--write` and commit the result; do not touch
// the generated module by hand. **The copy is his** (invariant 4) and the document is where it lives.
//
// ⭐⭐⭐ IT IS IDEMPOTENT: `--write` OVER A MODULE THAT IS ALREADY RIGHT CHANGES NOT ONE BYTE (B16, round 45,
// 02.10 – found in-wave by B8 and folded into the wave, which had paid for it three times by hand first:
// B8 spliced the pre-emit body back after a `--write`, and B15 did it twice over). Until then this was a
// whole-file generator with two hard-coded choices, and the module holds two things that are NOT the
// document's, so there was nothing in the document to regenerate them from:
//   (1) THE HAND-WRITTEN COMMENT BLOCK ABOVE AN OCCASION – `the-line`'s nineteen-line heirloom block (A-L1,
//       v86, wave 10 T6a), which `emitOccasion` replaced with a one-line `// A34 · the-line` stub;
//   (2) THE ORDER OF AN OCCASION'S VOICE COLUMNS – `the-line` stands `sunny, fiery, quiet, deep`
//       (`TEMPERAMENTS`' order) and the loop over `ALBUM_VOICES` re-wrote it `sunny, fiery, deep, quiet`.
//       A `Record` has no order, so no string moved – and a diff that reads as a reshuffle is one nobody trusts.
// ⚠⚠ BOTH WERE SILENT. The round-trip pin compares STRINGS and a comment is not one, so a builder who forgot
// the splice would have shipped a module without its heirloom and a green gate.
//
// ⭐ THE SHAPE: READ THE COMMITTED MODULE, CARRY THOSE TWO THINGS FORWARD BY OCCASION ID, RE-WRITE EVERYTHING
// ELSE. Not a patch over byte ranges – that has to say which bytes the emitter owns, and it owns all of them
// but these two. Re-serialising keeps the DOCUMENT the only source of every string, id, kind, band and gate (a
// hand-edit of a string in the module is overwritten, which is invariant 4's direction), and it makes
// idempotence a one-line induction: an emitted block is [carried comment | stub from the document] + a fixed
// skeleton + [voices in the carried order | the document's], and reading that block back returns exactly the
// comment and the order it was written with – so a second pass reproduces the first.
// `tests/album-corpus-roundtrip.test.ts` runs that from the committed module, from a cold start, and through
// this CLI over a temp copy, so the claim is a test and not a comment.
//   · A GENERATED STUB IS RE-DERIVED, NOT CARRIED: a lone `// A<n> · <id>` is the emitter's own and takes the
//     document's CURRENT ref, so a renumbering lands. Anything else above the `{` is hand-written, verbatim.
//   · THE CONTRACT HAS ONE SLOT: hand-written comments live in the run directly above an occasion's `{`. A
//     comment INSIDE a block has nowhere to be carried to, so it is REFUSED loudly – the way the parser
//     refuses a row it cannot read – rather than dropped silently by the next `--write`.
//
//     npx vite-node tools/album-corpus-emit.ts --write --out <path>   # the temp mode: <path> is read AND written

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  readAlbumCorpus,
  albumCounts,
  ALBUM_ARC_DIRECTIONS,
  ALBUM_BANDS,
  ALBUM_KINDS,
  ALBUM_VOICES,
} from './album-corpus-parse'
import type { AlbumCorpus, AlbumRow, AlbumArcRow, AlbumVoice } from './album-corpus-parse'

const ALBUM_MODULE = new URL('../src/engine/world/albumCorpus.ts', import.meta.url)

/** The module as it stands – or the empty string on a cold start, when there is no file to carry from. */
function readModule(at: URL = ALBUM_MODULE): string {
  return existsSync(at) ? readFileSync(at, 'utf8') : ''
}

/** What the committed module holds for ONE occasion that the document does not. */
interface Carried {
  /** the hand-written `//` run directly above the block's `{`, verbatim; `null` where that run is only the generated stub, or absent */
  comment: string[] | null
  /** the voice columns in the order the module has them – the document's order is the default, not the law */
  voices: AlbumVoice[]
  /** comment lines found INSIDE the block, which cannot be carried and so make `emitOccasion` refuse */
  inside: string[]
}

const ARRAY_OPEN = 'export const ALBUM_CORPUS: readonly AlbumOccasion[] = ['
/** The emitter's own one-line comment: written when nothing is carried, so it is re-derived and never carried. */
const GENERATED_STUB = /^ {2}\/\/ A\d+ · [a-z][a-z0-9-]*$/
const ID_LINE = /^ {4}id: '([^']*)',$/
const VOICE_LINE = /^ {6}(sunny|fiery|deep|quiet): \{$/

/** ⭐ THE COMMITTED MODULE, READ FOR THE TWO THINGS IT HOLDS THAT THE DOCUMENT DOES NOT, keyed by occasion id.
 *  ⚠ It throws on a shape it does not recognise, for the parser's reason: a module the emitter cannot read is
 *  REPORTED, never patched around – the alternative is a `--write` that discards whatever it failed to
 *  understand, which is the defect this exists to end. */
function carriedFrom(existing: string): Map<string, Carried> {
  const found = new Map<string, Carried>()
  if (existing.trim() === '') return found
  const lines = existing.split('\n')
  const open = lines.indexOf(ARRAY_OPEN)
  if (open === -1) throw new Error(`album module: no \`${ARRAY_OPEN}\` line – the emitter will not guess at a file it cannot read`)
  let run: string[] = []
  for (let i = open + 1; i < lines.length && lines[i] !== ']'; i++) {
    if (lines[i].startsWith('  //')) {
      run.push(lines[i])
      continue
    }
    if (lines[i] !== '  {') throw new Error(`album module, line ${i + 1}: neither a line the emitter writes nor a carried comment: ${lines[i]}`)
    let id: string | null = null
    const voices: AlbumVoice[] = []
    const inside: string[] = []
    let end = i + 1
    for (; end < lines.length && lines[end] !== '  },'; end++) {
      const idHere = ID_LINE.exec(lines[end])
      if (idHere !== null && id === null) id = idHere[1]
      const voiceHere = VOICE_LINE.exec(lines[end])
      if (voiceHere !== null) voices.push(voiceHere[1] as AlbumVoice)
      if (lines[end].trimStart().startsWith('//')) inside.push(`line ${end + 1}: ${lines[end].trim()}`)
    }
    if (end >= lines.length) throw new Error(`album module, line ${i + 1}: a block that never closes`)
    if (id === null) throw new Error(`album module, line ${i + 1}: a block with no id`)
    if (found.has(id)) throw new Error(`album module, line ${i + 1}: ${id} appears twice`)
    if (voices.length !== ALBUM_VOICES.length || !ALBUM_VOICES.every((v) => voices.includes(v))) {
      throw new Error(`album module, line ${i + 1}: ${id}'s columns are ${voices.join(', ')}, not the four voices once each`)
    }
    const stubOnly = run.length === 0 || (run.length === 1 && GENERATED_STUB.test(run[0]))
    found.set(id, { comment: stubOnly ? null : run, voices, inside })
    run = []
    i = end
  }
  if (run.length > 0) throw new Error(`album module: a comment run after the last block, which has no occasion to ride with: ${run[0]}`)
  return found
}

/** ⚠ SINGLE-QUOTED, AND THE ESCAPES ARE THE ONLY TWO THAT MATTER: the backslash first (or it would
 *  escape the escapes that follow it) and the quote. The handwriting is full of apostrophes –
 *  «didn't», «she'd», «everybody's» – which is precisely why this is emitted and not typed. */
function q(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function union(values: readonly string[]): string {
  return values.map((v) => `'${v}'`).join(' | ')
}

function emitOccasion(row: AlbumRow, carried: Carried | undefined): string[] {
  if (carried !== undefined && carried.inside.length > 0) {
    throw new Error(
      `${row.ref} · ${row.id}: the committed module holds a comment INSIDE its block (${carried.inside[0]}). ` +
        `Only the comment run directly above an occasion's '{' is carried, so the next --write would drop this one – ` +
        `move it above the '{'.`,
    )
  }
  const out: string[] = []
  out.push(...(carried?.comment ?? [`  // ${row.ref} · ${row.id}`]))
  out.push('  {')
  out.push(`    id: ${q(row.id)},`)
  out.push(`    kind: ${q(row.kind)},`)
  out.push(`    bands: [${row.bands.map(q).join(', ')}],`)
  out.push(`    gate: ${row.gate === null ? 'null' : q(row.gate)},`)
  out.push('    voices: {')
  for (const voice of carried?.voices ?? ALBUM_VOICES) {
    const hand = row.voices[voice]
    out.push(`      ${voice}: {`)
    out.push(`        note: ${q(hand.note)},`)
    out.push(`        caption: ${q(hand.caption)},`)
    out.push(`        line: ${q(hand.line)},`)
    out.push('      },')
  }
  out.push('    },')
  out.push('  },')
  return out
}

function emitArc(row: AlbumArcRow): string[] {
  const out: string[] = []
  out.push(`  // ${row.gloss}`)
  out.push(`  ${row.direction}: {`)
  for (const voice of ALBUM_VOICES) {
    const hand = row.voices[voice]
    out.push(`    ${voice}: {`)
    out.push(`      note: ${q(hand.note)},`)
    out.push(`      line: ${q(hand.line)},`)
    out.push('    },')
  }
  out.push('  },')
  return out
}

/** ⭐ THE MODULE'S TEXT AS A PURE FUNCTION OF THE DOCUMENT AND OF THE MODULE IT IS ABOUT TO REPLACE – so the
 *  round-trip pin can run it without touching a file, and `emit(doc, emit(doc, m)) === emit(doc, m)` is a
 *  property of this code that a test states, not a habit of whoever last ran it. */
export function emit(corpus: AlbumCorpus = readAlbumCorpus(), existing: string = readModule()): string {
  const counts = albumCounts(corpus)
  const authored = counts.notes + counts.captions + counts.lines + counts.arcStrings
  const head = `// ⭐⭐⭐ THE ALBUM'S HANDWRITING – **GENERATED FROM \`docs/specs/album-corpus-2026-09.md\`, NEVER
// RETYPED.** ${counts.occasions} occasions × ${ALBUM_VOICES.length} voices × 3 registers = ${counts.notes + counts.captions + counts.lines} strings, plus the arc's ${counts.arcStrings} across
// ${counts.arcCells} cells: **${authored} authored strings in total.**
//
// ⭐⭐ THE THREE REGISTERS ARE THREE DIFFERENT THINGS A PARENT DOES ON A PAGE, and his 19.09
// confirmation («всё верно») is what fixes them: the **note** speaks TO her («First day on court. You
// were so excited»), the **caption** speaks ABOUT her («She asked if she could try»), and the **line**
// is the parent thinking aloud («Some journeys start with a simple "Can I?"»). Those three strings are
// HIS OWN, off the mockups, and they are \`first-court\`'s \`sunny\` column, character for character.
//
// ⭐⭐ AND THE FOG LAW IS LIFTED HERE – the album spec's §2.8, his ruling 19.09. Temperament reached
// the facts and no surface until this screen (\`tests/spirit.test.ts\` pins that); the album is the
// exception, because at the end there is nothing left to hide. The parent is the SAME MAN in all four
// voice columns; what differs is the daughter he is describing and therefore what there was to notice.
//
// ⚠⚠ DO NOT EDIT THIS FILE BY HAND. It is written by \`tools/album-corpus-emit.ts\` and pinned, string
// for string, against the document by \`tests/album-corpus-roundtrip.test.ts\`. A hand-edit here goes
// red; so does a document edit that was never re-emitted. To change a line, change the DOCUMENT – the
// owner's copy lives there (invariant 4) – then re-run the emitter with \`--write\`.
//
// ⚠ IT IS ORDINARY COMMITTED SOURCE AND NOT A BUILD STEP. Nothing in \`npm run check\`, \`npm run build\`
// or the dev server generates it; the emitter is a one-off, as round 44 ruled for its sibling.
//
// ⭐ WHY GENERATION RATHER THAN TRANSCRIPTION: ${authored} authored strings. An agent retyping them produces
// typos that no test can catch, because a test written by the same agent compares against what was
// typed. The document is the source of truth; this file is its projection.
//
// ⚠⚠ EVERY STRING HERE IS A **DRAFT** UNTIL HE HAS READ IT. The document says so at its head and
// invariant 4 is the reason: a label, a caption or a sentence on screen is his.
//
// size-budget: generated corpus. Hundreds of lines of authored strings with ONE reason to change, and
// the reason is the document. \`scripts/context-audit.mjs\`' line trigger is aimed at a source file
// growing past the point where a reader can hold it; this file is not read, it is diffed against
// \`tests/album-corpus-roundtrip.test.ts\`, and splitting it would buy nothing but two files to
// re-emit. The waiver is acknowledged rather than silent.

import type { Temperament } from '../spirit'

/** The album's chapters. ⚠ \`jun\` is not among them: spec §3 and §4b – the band under 11 is
 *  unreachable (the world starts at thirteen) and carried 0 milestones on all nine measured careers,
 *  so chapter 1 is the prologue instead. */
export type AlbumBand = ${union(ALBUM_BANDS)}

/** The family the selector draws an occasion from – the nine \`MilestoneType\`s plus \`prologue\`
 *  (the trace persisted at handover), \`asset\` (\`world.assets\` and its \`boughtWeek\`), \`rare\` (his
 *  super-rare three) and \`closing\` (the three written frames). */
export type AlbumOccasionKind = ${union(ALBUM_KINDS)}

/** ⭐ ONE OCCASION IN ONE VOICE: the three registers, finished. **No placeholders and no
 *  interpolation** – her name is the player's, so the note says «you» and the caption says «she», and
 *  neither ever needs one. The sheet renders the date and her age above the note out of the frame's
 *  own week; no string here writes either, because a corpus cannot know them. */
export interface AlbumHand {
  /** to her, second person – the pasted, torn-edged note */
  note: string
  /** about her, third person – the polaroid's bottom lip */
  caption: string
  /** to nobody – the parent thinking, loose in the margin */
  line: string
}

export interface AlbumOccasion {
  id: string
  kind: AlbumOccasionKind
  bands: readonly AlbumBand[]
  /** \`null\` where the kind alone is the occasion; otherwise the named condition, resolved engine-side. */
  gate: string | null
  voices: Record<Temperament, AlbumHand>
}

/** ⭐ THE ARC – «сначала она была такой-то, а потом стала такой-то» (his addition, 19.09). The voice
 *  key is what she was BORN (\`temperament\`, drawn at birth and never changed); the direction is where
 *  \`wallsLean\` went. ⚠⚠ AND READ HIS SENTENCE AS EXPRESSION, NOT AS REPLACEMENT (corpus doc §5,
 *  re-framed 20.09 on his own reading): the temperament is drawn once and never written again, so
 *  nothing in a save can support a girl who turned into another girl. What the lean moves is how
 *  reachable she is and how much of her reaches the parent – the same nature, further out or further
 *  in. \`deep\`/\`open\` is the model: «Same sentence. Sooner.»
 *  ⚠ There is no third direction: spec §4b measured the lean moving on 1 career of
 *  9, and the ruling is that the other eight take the ordinary closing sheet rather than being told
 *  they stayed themselves. ⚠ Two registers, not three – the arc's sentence needs both points in it and
 *  a caption cannot hold two points. */
export type AlbumArcDirection = ${union(ALBUM_ARC_DIRECTIONS)}

export interface AlbumArcHand {
  note: string
  line: string
}

export const ALBUM_CORPUS: readonly AlbumOccasion[] = [
`
  const carried = carriedFrom(existing)
  const body = corpus.occasions.flatMap((row) => emitOccasion(row, carried.get(row.id))).join('\n')
  const arcHead = `
export const ALBUM_ARC: Record<AlbumArcDirection, Record<Temperament, AlbumArcHand>> = {
`
  const arcBody = corpus.arc.flatMap(emitArc).join('\n')
  return `${head}${body}\n]\n${arcHead}${arcBody}\n}\n`
}

function main(): void {
  const at = process.argv.indexOf('--out')
  const given = at === -1 ? undefined : process.argv[at + 1]
  if (at !== -1 && (given === undefined || given.startsWith('--'))) throw new Error('--out needs a path')
  const target = given === undefined ? ALBUM_MODULE : pathToFileURL(resolve(given))
  const corpus = readAlbumCorpus()
  const text = emit(corpus, readModule(target))
  if (process.argv.includes('--write')) {
    writeFileSync(target, text)
    const counts = albumCounts(corpus)
    console.log(
      `wrote ${target.pathname}: ${counts.occasions} occasions, ${counts.notes} notes, ${counts.captions} captions, ` +
        `${counts.lines} lines, ${counts.arcCells} arc cells, ${counts.arcStrings} arc strings`,
    )
  } else {
    console.log(text)
  }
}

// ⚠ `main()` RUNS UNLESS VITEST IS LOADING THIS FILE. The round-trip pin imports `emit` from here, and an
// import must not print forty-eight thousand characters of module (or, with `--write` on a stray command
// line, write one). The guard is an environment check and not the argv name check `tools/econ-bench.ts` uses:
// the installed vite-node strips the entry file from `process.argv`, so a name check is false on every run –
// and a CLI that prints nothing and exits 0 is the failure that matters, which is why the pin's CLI case
// asserts that «wrote» was actually said.
if (!process.env.VITEST) main()
