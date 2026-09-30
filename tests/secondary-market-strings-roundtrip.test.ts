// THE SECONDARY MARKET'S STRINGS TABLE AND THE CODE ARE ONE CORPUS, PINNED CHARACTER FOR CHARACTER.
//
// Wave 9's law, applied to this wave's table: «после вычитки легко исправить Markdown и забыть реализацию» – so the
// document and the shipped string go red together, whichever side moves. `tests/principles-fix-strings-roundtrip.test.ts`
// is the model and this file is its shape one wave on (its first corpus only: this wave has no «engine sentence, new
// surface» rows yet, and a second parser would be a second count with nothing to count).
// ⭐ S5 (30.09) ADDED FIVE HOMES, NOT A SECOND CORPUS: the screens' sentences are the same kind of row – a DRAFT quoted as a whole string literal
// in a bare-path home – so the one parser still counts them all. The homes test at the foot names the five.
//
// ⚠ EVERY HOME IS A BARE PATH AND THE PIN IS CONTAINMENT AGAINST THAT FILE'S SOURCE – never a region cut. No marker, no
// slice, nothing to rot silently (the 24.08 lesson is about slices: `indexOf` returns -1, the region widens to the whole
// file and the pin stays green; a boolean `includes` fails loudly instead).
//
// ⚠ THE COUNT LIVES HERE AND NOWHERE IN PROSE – wave 9's finding verbatim: a count written in prose survives a full gate
// because no test reads it. `EXPECTED_ROWS` below is the only statement of it; the document states no total. A step that
// tables more sentences moves it with a dated note beside it.
//
// ⚠ THE ROWS QUOTE THE SOURCE, PLACEHOLDER AND ALL: `Put on the market: ${label}` is in the document exactly as the template
// literal is in `world/shop.ts`, which is why the code names a `label` before it writes the row – a doc row that read
// `${listingLabel(world, item)}` would pin the wiring instead of the sentence.
//
// MUTATION-VERIFIED IN BOTH DIRECTIONS (30.09, S2), each arm applied ALONE, watched and restored: one character changed in a
// doc row fails that row by id; one character changed in the shipped string fails the same row with the arrow the other way.
// ⚠ AND ONE STRICTER THAN THE MODEL FILE, FOUND BY THAT SAME RUN: the shipped side is matched as a WHOLE string literal, not as a
// substring. An `s` appended to a sentence in the source passed a bare `includes` – the row was still inside the longer string –
// and only the engine test that compares the message with the row caught it. Both arms (an appended character, a substituted
// one) now fail this file as well.
// ⭐ S5 (30.09) RE-RAN BOTH DIRECTIONS ON THE NEW HOMES, each arm alone, watched red BY ROW ID and restored byte for byte: a character of SM20
// changed in the doc; the same character changed in `OfferLetter.vue`; a full stop appended to SM25 in `InboxSheet.vue`; SM18's word substituted in
// `saleLetter.ts`; and an `n` appended to the one-word SM10 in `composables/shop.ts`.
// ⚠ THAT LAST ARM STAYED GREEN AT FIRST, AND IT IS WHY THE «EXACTLY ONCE» ARM BELOW EXISTS: a comment in the same file quoted the word in backticks,
// which the matcher reads as a template-literal spelling, so the row was held up by prose while the code moved. Four one-word rows (SM7–SM10) were
// pinned that way; the comment is fixed and the property is now an arm (a second quoted copy fails it, arm S7 of the run).
// ⚠ AND ONE CASE IT DOES NOT CLOSE, RECORDED RATHER THAN HIDDEN: the code's word changed while a comment quotes the OLD word exactly once (`// was
// 'Withdraw'`) and the doc row is left as it was – both arms stay green, because a containment pin over a whole file cannot tell a comment from code.
// Closing it means matching against comment-stripped source (`codeOf`), which changes this pin's design, so it is left for the wording pass's owner.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

interface Row {
  id: string
  home: string
  text: string
}

const STATUS = 'DRAFT'
const TABLE = 'docs/plans/secondary-market-strings-2026-09.md'

function parseTable(path: string): Row[] {
  const md = readFileSync(path, 'utf8')
  const rows: Row[] = []
  for (const line of md.split('\n')) {
    // | SM1 | `src/...` | the string | `DRAFT` |
    const m = new RegExp(String.raw`^\| (SM\d+) \| \x60(.+?)\x60 \| (.+?) \| \x60${STATUS}\x60 \|$`).exec(line)
    if (m) rows.push({ id: m[1], home: m[2], text: m[3] })
  }
  return rows
}

const sourceCache = new Map<string, string>()
function sourceOf(path: string): string {
  let src = sourceCache.get(path)
  if (src === undefined) {
    src = readFileSync(path, 'utf8')
    sourceCache.set(path, src)
  }
  return src
}

/** ⚠ THE ROW AS A WHOLE STRING LITERAL – found between its own quote marks (`'…'`, `"…"` or a template literal), never as a bare
 *  substring. A plain `includes` cannot see a shipped sentence that has GROWN past the row's text, because the row is still a
 *  substring of the longer sentence (measured on 30.09: an `s` appended to SM4 in the source stayed green under the model file's
 *  containment). Growth, shrinkage and substitution now all fail the same row.
 *  ⚠ THE ESCAPED SPELLING IS LOAD-BEARING: the doc quotes the RUNTIME spelling, and a source literal in single quotes escapes its
 *  apostrophes – a row that reads `The mother's story` is `The mother\'s story` in the file. */
function shipped(src: string, text: string): boolean {
  const spellings = [text, text.replaceAll("'", "\\'")]
  return spellings.some((t) => ["'", '"', '`'].some((q) => src.includes(q + t + q)))
}

/** ⭐ S5 (30.09) – HOW MANY WHOLE-LITERAL SPELLINGS OF THE ROW THE HOME HOLDS. `shipped` answers «at least one», and that is not enough for a row of ONE
 *  word: found by S5's own mutation run, an `n` appended to the shipped `'Withdraw'` stayed green because a doc comment in the same file quoted the same
 *  word in backticks – a template-literal spelling to the matcher – so the pin was satisfied by prose and not by the code. A row that is exactly one literal
 *  in its home is a row whose change has nowhere to hide. */
function literalCount(src: string, text: string): number {
  const spellings = [...new Set([text, text.replaceAll("'", "\\'")])]
  let n = 0
  for (const t of spellings) for (const q of ["'", '"', '`']) n += src.split(q + t + q).length - 1
  return n
}

/** ⚠ THE ONE STATEMENT OF THE COUNT. 6 on 30.09 (S2): four refusals (SM1–SM4) and the two Money-feed lines (SM5, SM6).
 *  ⭐ 26 ON 30.09 (S5): +20 – the popup and the listed row's controls and lines (SM7–SM17, home `src/composables/shop.ts`), the two senders (SM18, SM19,
 *  home `src/composables/saleLetter.ts`), the buyer's letter and the quiet notice (SM20–SM23, `OfferLetter.vue`) and the inbox list's two subjects and
 *  the sign question (SM24–SM26, `InboxSheet.vue`). */
const EXPECTED_ROWS = 26

describe('the secondary market – the strings table IS the corpus', () => {
  const rows = parseTable(TABLE)

  it(`the parser found the table at all – ${EXPECTED_ROWS} rows`, () => {
    // A renamed heading or a reshaped row empties the parse; the count is the tripwire.
    expect(rows.length, `${TABLE}: rows found`).toBe(EXPECTED_ROWS)
    expect(new Set(rows.map((r) => r.id)).size, 'ids are unique').toBe(rows.length)
  })

  it('every row matches the shipped string character for character', () => {
    for (const row of rows) {
      const src = sourceOf(row.home)
      expect(shipped(src, row.text), `${row.id}: ${row.home} does not ship the row's text as a whole string literal`).toBe(true)
    }
  })

  it('⭐ (S5) every row is exactly ONE quoted literal in its home – a comment quoting it back cannot hold the pin up', () => {
    for (const row of rows) {
      expect(literalCount(sourceOf(row.home), row.text), `${row.id}: ${row.home} quotes the row's text more than once (or not at all)`).toBe(1)
    }
  })

  it('⭐ every row is still a DRAFT – one truth about where the corpus stands', () => {
    // The parser only matches rows whose status cell is exactly `DRAFT`, so a row that moves on – his pass, or an applied
    // review – simply stops being counted, and the count above says so. That is the tripwire working, not a failure to fix:
    // it is the moment somebody has to come back and state where the corpus now stands.
    const md = readFileSync(TABLE, 'utf8')
    expect(md.split(`\`${STATUS}\``).length - 1, 'the status column, counted').toBe(EXPECTED_ROWS)
  })

  it('⚠ no row carries the long dash, which this repo bans in player-facing prose', () => {
    // CLAUDE.md's style rule, applied where it is cheapest to enforce: the strings themselves.
    for (const row of rows) {
      expect(row.text.includes('—'), `${row.id} carries the long dash`).toBe(false)
    }
  })

  it('⚠ every home is a real file, and the homes are exactly the five the wave puts words in', () => {
    // Without this a typo in a home path is a `readFileSync` throw whose message is about a path rather than about the row.
    // The home set is an enumeration on purpose: a home is a claim about WHERE the wave puts words, and a row that moves to
    // a screen would be the screen authoring a sentence the engine owns.
    // ⭐ WIDENED ON 30.09 (S5), BY THE STEP'S OWN BRIEF, FROM ONE HOME TO FIVE: S2's four refusals and two ledger lines are ENGINE sentences and stay
    // where they were; S5's twenty are the screens' – sentences composed AROUND numbers the engine already worked out (the quote, the printed price,
    // the memory window), which is how every existing confirm and letter body in this app is written. The two shared modules
    // (`composables/shop.ts`, `composables/saleLetter.ts`) hold the words two surfaces both print; the letter and the inbox row hold their own. A
    // sixth home is a decision – it moves this list on purpose, never by accident.
    for (const row of rows) {
      expect(() => sourceOf(row.home), `${row.id}: ${row.home}`).not.toThrow()
    }
    expect(new Set(rows.map((r) => r.home))).toEqual(
      new Set([
        'src/engine/world/shop.ts',
        'src/composables/shop.ts',
        'src/composables/saleLetter.ts',
        'src/components/OfferLetter.vue',
        'src/components/InboxSheet.vue',
      ]),
    )
  })
})
