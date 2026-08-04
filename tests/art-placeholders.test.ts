// THE PLACEHOLDER-ART GATE.
//
// WHY THIS FILE EXISTS. Two waves shipped stand-in art, each honestly reported at the time and then
// findable only inside an agent's report: W2-LADDER copied three trophy pairs off their neighbours'
// masters (02.08) and act 3 copied four more plus borrowed one sponsor letterhead for three rungs
// (04.08). Neither left anything in the repo that would answer "what is still fake?" – so the answer
// decayed into tribal knowledge within a day, and the NEXT wave had no way to add a stand-in loudly
// even if it wanted to. Same failure shape as the legal artifacts in tests/legal-assets.test.ts:
// nothing breaks, so it ships silently.
//
// WHAT IT PINS, and the whole point is that it pins BOTH directions:
//
//   1. REGISTRY → DISK. Every row of docs/art-placeholders.md is still true. A `byte-copy` row whose
//      file has stopped being a byte copy means the owner shipped the real master, and the row has
//      to go; an `absent` row whose file has appeared means the same. The failure message SAYS SO –
//      it is a reminder to delete a line, not a complaint about the art (see the note on messages).
//   2. DISK → REGISTRY. Every byte-duplicate group under public/images/ is fully accounted for by
//      the registry. A new copy landing in a future wave fails here until somebody writes down what
//      it stands in for, which is the half that stops this list from rotting.
//
// Byte identity is the mechanism because it is the only claim a machine can check without opinions
// about pictures: `sha256(a) === sha256(b)` is exactly "this is a copy of that", and a repaint
// changes it. Nothing here judges whether art is GOOD, only whether it is the same file.
//
// ⚠ THE FAILURE MESSAGES ARE PART OF THE DESIGN, not decoration. This gate sits directly on the
// owner's own workflow – he replaces a file and the suite goes red – so every message names the file
// he just replaced, says the art is fine, and names the exact row to delete. A cryptic hash diff
// here would train him to distrust the suite, which costs more than the guard is worth.
import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'
import { SPONSOR_TIERS, sponsorArtKey } from '../src/engine/offers'
import { ART_TIER_BORROWS } from '../src/art/venues'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const REGISTRY = 'docs/art-placeholders.md'
const IMAGES = 'public/images'

const abs = (p: string) => join(ROOT, p)
const sha = (p: string) => createHash('sha256').update(readFileSync(abs(p))).digest('hex')

interface Row {
  asset: string
  kind: string
  counterpart: string
  wave: string
  why: string
  /** 1-based line in the registry, so a failure can say WHICH row to delete. */
  line: number
}

/** Parse the registry table. A line counts as a row only if its first cell is a backticked path
 *  under `public/` – so the prose, the header row and the `|---|` separator are all skipped without
 *  the parser needing to know where the table starts. Deliberately strict about the CELL COUNT: a
 *  row that has drifted a column is a row nobody can act on. */
function readRegistry(): Row[] {
  const text = readFileSync(abs(REGISTRY), 'utf8')
  const rows: Row[] = []
  text.split('\n').forEach((raw, i) => {
    if (!raw.startsWith('| `public/')) return
    const cells = raw.split('|').slice(1, -1).map((c) => c.trim().replace(/^`|`$/g, ''))
    // A thrown Error rather than an `expect`: this runs at COLLECTION time, outside any test, where
    // an assertion has no test to fail.
    if (cells.length !== 5) {
      throw new Error(`${REGISTRY}:${i + 1} – expected 5 cells (asset, kind, counterpart, wave, why), got ${cells.length}`)
    }
    rows.push({ asset: cells[0], kind: cells[1], counterpart: cells[2], wave: cells[3], why: cells[4], line: i + 1 })
  })
  return rows
}

/** Every shipped image under public/images, repo-relative. Extensions the art pipeline produces plus
 *  the raster exceptions .gitignore names, so a png stand-in cannot slip past a webp-only scan.
 *  `<set>-jpeg/` is skipped: those are the author's staging inboxes for raw masters (gitignored, and
 *  moved out of public/ by the build), so a master sitting there mid-drop is not a shipped file. */
function shippedImages(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.') || name.endsWith('-jpeg')) continue
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(webp|png|jpe?g|svg)$/i.test(name)) out.push(relative(ROOT, full))
    }
  }
  walk(abs(IMAGES))
  return out.sort()
}

const rows = readRegistry()
const byteCopies = rows.filter((r) => r.kind === 'byte-copy')
const absent = rows.filter((r) => r.kind === 'absent')

describe('placeholder-art registry – the list is well formed', () => {
  it('parses, is non-empty, and every row uses a known kind', () => {
    // Non-empty is a real assertion, not a formality: an empty table would make every direction
    // below vacuously true, so "somebody deleted the registry" must not read as "no placeholders".
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expect(['byte-copy', 'absent'], `${REGISTRY}:${r.line} – unknown kind "${r.kind}"`).toContain(r.kind)
      expect(r.wave, `${REGISTRY}:${r.line} – every row names the wave that introduced it`).not.toBe('')
      expect(r.why, `${REGISTRY}:${r.line} – every row says what it stands in for`).not.toBe('')
    }
  })

  it('lists each asset once', () => {
    const seen = new Set<string>()
    for (const r of rows) {
      expect(seen.has(r.asset), `${REGISTRY}:${r.line} – ${r.asset} is listed twice`).toBe(false)
      seen.add(r.asset)
    }
  })

  it('every counterpart is a real file – a stand-in must stand in for something', () => {
    for (const r of rows) {
      expect(existsSync(abs(r.counterpart)), `${REGISTRY}:${r.line} – counterpart ${r.counterpart} does not exist`).toBe(true)
    }
  })
})

// ===============================================================================================
// DIRECTION 1 – registry → disk. A placeholder that has been REPLACED must fail the list.
// ===============================================================================================
//
// One case per direction rather than an `it.each` per row, for two reasons that both serve the owner:
// he replaces four trophies in one sitting and wants ALL four rows named in one message, not four
// separate red lines; and an emptied registry (every placeholder finally replaced – the happy ending
// this file is working towards) would make `it.each([])` throw at collection instead of going green.
describe('placeholder-art registry – replaced art fails the list', () => {
  it('every byte-copy row is still a byte copy – a repaint fails here', () => {
    const stale: string[] = []
    for (const row of byteCopies) {
      if (!existsSync(abs(row.asset))) {
        stale.push(`row ${row.line}: ${row.asset} is GONE. If you deleted it on purpose, delete the row too.`)
        continue
      }
      if (sha(row.asset) !== sha(row.counterpart)) {
        stale.push(
          `row ${row.line}: ${row.asset} is no longer a byte copy of ${row.counterpart} – the REAL ` +
            `art has shipped. Nothing is wrong with the file; remove this row from ${REGISTRY}.`,
        )
      }
    }
    expect(stale, `Placeholder art has been replaced. Remove these rows from ${REGISTRY}:\n${stale.join('\n')}`).toEqual([])
  })

  it('every absent row is still absent – a new file fails here', () => {
    const stale: string[] = []
    for (const row of absent) {
      if (existsSync(abs(row.asset))) {
        stale.push(
          `row ${row.line}: ${row.asset} now EXISTS – the REAL art has shipped. Nothing is wrong ` +
            `with the file; remove this row from ${REGISTRY}, and drop the code branch that borrows ` +
            `${row.counterpart} (the row's own note names it).`,
        )
      }
    }
    expect(stale, `Placeholder art has been replaced. Remove these rows from ${REGISTRY}:\n${stale.join('\n')}`).toEqual([])
  })
})

// ===============================================================================================
// DIRECTION 2 – disk → registry. A NEW duplicate that nobody wrote down must fail too.
// ===============================================================================================
describe('placeholder-art registry – a new stand-in cannot ship silently', () => {
  it('every byte-duplicate group under public/images is accounted for', () => {
    const groups = new Map<string, string[]>()
    for (const file of shippedImages()) {
      const h = sha(file)
      groups.set(h, [...(groups.get(h) ?? []), file])
    }
    // Within a duplicate group exactly ONE file may be the master; every other member has to be a
    // registered byte-copy pointing at some member of its own group. That phrasing is what makes the
    // check independent of WHICH member the registry called the master – the owner's masters and
    // their copies are indistinguishable by content, and only the registry knows the direction.
    const unexplained: string[] = []
    for (const members of groups.values()) {
      if (members.length < 2) continue
      const registered = members.filter((m) => byteCopies.some((r) => r.asset === m && members.includes(r.counterpart)))
      if (registered.length < members.length - 1) {
        unexplained.push(members.filter((m) => !registered.includes(m)).join('  ==  '))
      }
    }
    expect(
      unexplained,
      `These files are byte-identical to each other but are not in ${REGISTRY}. If one is a ` +
        `stand-in for the other, add a \`byte-copy\` row saying so (asset, counterpart, wave, why). ` +
        `If they are meant to be two different pictures, one of them is the wrong file.\n` +
        unexplained.join('\n'),
    ).toEqual([])
  })

  it('sponsorArtKey borrows exactly the rungs the registry lists as absent', () => {
    // The `absent` half has no file to hash, so its "cannot ship silently" direction is a code
    // check: the set of rungs that borrow somebody else's letterhead must equal the set of sponsor
    // rows in the registry. A seventh rung added with a borrowed mark fails HERE.
    const borrowing = SPONSOR_TIERS.filter((t) => sponsorArtKey(t) !== t).map((t) => `${IMAGES}/sponsors/${t}.webp`)
    const listed = absent.filter((r) => r.asset.startsWith(`${IMAGES}/sponsors/`)).map((r) => r.asset)
    expect(
      [...borrowing].sort(),
      `sponsorArtKey and ${REGISTRY} disagree about which sponsor rungs borrow a mark. Add a row ` +
        `for a new borrowing rung, or delete the row for one that stopped borrowing.`,
    ).toEqual([...listed].sort())
    // …and each borrowed-from key is the counterpart the registry names, so a row cannot claim the
    // wrong master and stay green.
    for (const r of absent) {
      if (!r.asset.startsWith(`${IMAGES}/sponsors/`)) continue
      const tier = r.asset.slice(`${IMAGES}/sponsors/`.length, -'.webp'.length)
      expect(
        `${IMAGES}/sponsors/${sponsorArtKey(tier as (typeof SPONSOR_TIERS)[number])}.webp`,
        `${REGISTRY}:${r.line} – names ${r.counterpart}, but sponsorArtKey('${tier}') borrows something else.`,
      ).toBe(r.counterpart)
    }
  })

  it('ART_TIER_BORROWS borrows exactly the venue rungs the registry lists as absent', () => {
    // The same shape as the sponsor case above, for the second borrowing mechanism in the app. A
    // rung with no venue art of its own shows a neighbour's courts (`src/art/venues.ts`
    // ART_TIER_BORROWS), and there is no file to hash, so the "cannot ship silently" direction has
    // to be a code check: the set of rungs that borrow must equal the set of `fields/` rows here.
    // A NEW borrowing rung fails until somebody writes down what it borrows and why; a rung whose
    // real art lands fails on the `absent` direction above, which names the rows to delete.
    const dir = `${IMAGES}/fields/`
    const rows = absent.filter((r) => r.asset.startsWith(dir))
    const tierOf = (asset: string) => asset.slice(dir.length).split('-')[0]
    expect(
      [...new Set(rows.map((r) => tierOf(r.asset)))].sort(),
      `ART_TIER_BORROWS and ${REGISTRY} disagree about which rungs borrow venue art. Add rows for a ` +
        `new borrowing rung, or delete the rows for one whose own art has shipped.`,
    ).toEqual(Object.keys(ART_TIER_BORROWS).sort())
    // ...and each row names the rung the code ACTUALLY borrows from, on the row's own surface, so a
    // row cannot claim the wrong neighbour and stay green.
    for (const r of rows) {
      const [tier, surface] = r.asset.slice(dir.length, -'.webp'.length).split('-')
      expect(
        `${dir}${ART_TIER_BORROWS[tier as keyof typeof ART_TIER_BORROWS]}-${surface}-1.webp`,
        `${REGISTRY}:${r.line} – names ${r.counterpart}, but ART_TIER_BORROWS.${tier} borrows something else.`,
      ).toBe(r.counterpart)
    }
  })
})
