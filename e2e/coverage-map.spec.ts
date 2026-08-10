// THE ROT ALARM FOR THE COVERAGE MAP.
//
// `docs/specs/e2e-coverage.md` is the document this whole layer is shown from - what is covered, at
// which layer, and why. A hand-maintained map of that kind lies within a month; this repo has just
// spent a round proving exactly that about its round-tracking files. So the map is not trusted, it
// is CHECKED, against the repo it describes.
//
// ⚠ THE DOCUMENT IS THE SOURCE, NOT A COPY OF IT. This file parses `e2e-coverage.md` itself rather
// than holding its own table of screens to compare against. A second table would be a second thing
// to forget, and the failure mode - two lists that agree with each other and not with the app - is
// exactly the rot being guarded. There is one list, it lives in the document, and the filesystem is
// what it is checked against.
//
// ⚠ AND ITS LIMIT IS DECLARED, IN THE DOCUMENT, IN THE SECTION IT GUARDS. Screens are enumerable -
// `src/components/screens/*.vue` is a closed set and a new one CANNOT slip in without a recorded
// decision. Mechanics are not: `docs/specs/` is not a machine-readable inventory (70 of its 89 files
// carry no frontmatter at all, and many are audits rather than mechanics), so section 4 can only be
// checked for broken references, never for completeness. Section 7 of the document says so in those
// words. A check that pretended otherwise would be decorative, and a decorative check on a coverage
// map is worse than none - it is the map lying with a green tick beside it.
//
// This spec needs no browser: it requests no `page` fixture, so Playwright starts none for it. It
// runs in the `chromium` project purely to travel with the suite it guards.

import { test, expect } from '@playwright/test'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const MAP_FILE = fileURLToPath(new URL('../docs/specs/e2e-coverage.md', import.meta.url))
const SCREEN_DIR = fileURLToPath(new URL('../src/components/screens/', import.meta.url))
const SPEC_DIR = fileURLToPath(new URL('./', import.meta.url))
const DOCS_SPECS_DIR = fileURLToPath(new URL('../docs/specs/', import.meta.url))

const map = readFileSync(MAP_FILE, 'utf8')

/** The rows of the markdown table between `<!-- COVERAGE-MAP:NAME -->` and its closing marker.
 *
 *  Markers rather than "the table after heading N": headings get reworded, and a parser that lost
 *  its section would silently check an empty list and pass. A missing marker throws instead. */
function mapRows(name: string): string[][] {
  const block = map.match(
    new RegExp(`<!-- COVERAGE-MAP:${name} -->([\\s\\S]*?)<!-- /COVERAGE-MAP:${name} -->`),
  )
  if (!block) throw new Error(`docs/specs/e2e-coverage.md has no COVERAGE-MAP:${name} block`)
  return block[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && line.endsWith('|'))
    .map((line) => line.slice(1, -1).split('|').map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)))
    .slice(1) // the header row
}

const backticked = (cell: string): string => cell.replace(/`/g, '').trim()

test.describe('the coverage map still describes this repo', () => {
  test('every screen has a recorded coverage decision, and no row outlives its screen', () => {
    const onDisk = readdirSync(SCREEN_DIR).filter((f) => f.endsWith('.vue')).sort()
    const inMap = mapRows('SCREENS').map((cells) => backticked(cells[0])).sort()

    // ⚠ THE ASSERTION THAT DOES THE WORK. A new screen added to `src/components/screens/` with no row
    // here fails this line by name - which is the whole point: the decision "this screen is
    // component-owned" is a decision someone has to WRITE DOWN, and until they do, the map is
    // incomplete and says so. The reverse holds too: a deleted screen cannot leave a row behind
    // claiming coverage that no longer means anything.
    expect(
      inMap,
      'docs/specs/e2e-coverage.md section 3 and src/components/screens/ disagree. A new screen ' +
        'needs a row recording WHICH LAYER covers it and why - "not covered" is a valid answer, an ' +
        'absent one is not.',
    ).toEqual(onDisk)

    // A row that records nothing is a row that lies by omission.
    for (const cells of mapRows('SCREENS')) {
      expect(cells.length, `the row for ${cells[0]} is malformed`).toBe(5)
      expect(cells[4], `the row for ${cells[0]} records no decision`).not.toBe('')
    }
  })

  test('every spec file is in the journey table, and every journey names a spec that exists', () => {
    const onDisk = readdirSync(SPEC_DIR).filter((f) => f.endsWith('.spec.ts')).sort()
    const inMap = [...new Set(mapRows('JOURNEYS').map((cells) => backticked(cells[0])))].sort()

    // Both directions. A spec nobody wrote a sentence for is a spec nobody can show; a sentence with
    // no spec behind it is the coverage claim this whole document exists to make impossible.
    expect(
      inMap,
      'docs/specs/e2e-coverage.md section 2 and e2e/*.spec.ts disagree. Every spec needs a ' +
        'one-sentence journey and the seam it owns.',
    ).toEqual(onDisk)

    for (const cells of mapRows('JOURNEYS')) {
      expect(cells[1], `${cells[0]} has no journey sentence`).not.toBe('')
      expect(cells[2], `${cells[0]} names no seam`).not.toBe('')
    }
  })

  test('every mechanic cites a spec document that exists', () => {
    const rows = mapRows('MECHANICS')
    expect(rows.length, 'the mechanics table is empty').toBeGreaterThan(10)

    for (const cells of rows) {
      const link = cells[1].match(/\]\(([^)]+)\)/)
      expect(link, `the mechanic "${cells[0]}" cites no spec document`).not.toBeNull()
      const target = `${DOCS_SPECS_DIR}${link![1]}`
      // ⚠ THIS IS THE HALF THAT CAN ROT AND THE HALF THAT CANNOT BE CLOSED. It catches a spec being
      // renamed or deleted out from under the map - the common case, in a repo that renames specs -
      // and it CANNOT catch a mechanic shipping with no row at all. Section 7 of the document states
      // that limit rather than leaving a reader to assume this check is stronger than it is.
      expect(existsSync(target), `the mechanic "${cells[0]}" cites ${link![1]}, which is gone`).toBe(
        true,
      )
      expect(cells[3], `the mechanic "${cells[0]}" records no decision`).not.toBe('')
    }
  })
})
