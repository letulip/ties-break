import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// =================================================================================================
// ⭐⭐ E-07 (05.09 ENGINE REVIEW) – EVERY MEMBER OF THE SNAPSHOT HAS A READER OUTSIDE THE ENGINE.
//
// THE SNAPSHOT IS THE WHOLE CONTRACT. CLAUDE.md invariant 1: "the worker owns the world; the UI only
// ever sees `Snapshot`". So a member of it is a promise to the UI, and a member NOTHING reads is
// contract drift in the quiet direction – the UI stopped asking and nothing objected. The review
// found two (`onRampCleared`, `recoveryBuff`), both carrying doc comments that said the UI read
// them, both of which were false by then. That is the shape worth catching: not the bytes, but a
// declaration that has stopped being true while still reading like documentation.
//
// ⚠ THE SEARCH IS FOR A READER, AND «OUTSIDE THE ENGINE» IS THE POINT. `shared/protocol/*` is where
// the member is DECLARED and `engine/world/snapshot.ts` is where it is BUILT – neither is a reader,
// so both are excluded. Everything else under `src/` counts, which is deliberately wider than the
// screens: the review's first pass flagged `lossStreak` and `seasonLosses` as unread and both were
// wrong – `shared/avatarEmotion.ts` reads one and `StatsScreen.vue` the other.
//
// ⚠ AND IT IS A FLOOR, NOT A CENSUS. A word match cannot tell a genuine read from a coincidence of
// naming, so this test can pass a member that is only mentioned. It cannot pass a member that is
// mentioned NOWHERE, which is the failure it exists for, and a stricter instrument (an AST walk over
// property accesses on a `Snapshot`-typed value) would be a second derivation of the same fact for
// a defect that has occurred twice in the project's life.
// =================================================================================================

const SRC = fileURLToPath(new URL('../src', import.meta.url))
const PROTOCOL_FILE = resolve(SRC, 'shared/protocol/snapshot.ts')

/** Every top-level member name of the `Snapshot` interface, read off its own declaration. */
function snapshotMembers(): string[] {
  const lines = readFileSync(PROTOCOL_FILE, 'utf8').split('\n')
  const start = lines.findIndex((l) => l.startsWith('export interface Snapshot {'))
  expect(start, 'the Snapshot interface must still be declared here').toBeGreaterThanOrEqual(0)
  const end = lines.findIndex((l, i) => i > start && l === '}')
  expect(end, 'the interface must be closed').toBeGreaterThan(start)
  // Depth 1 only: a member sits at exactly two spaces, so the inline object literals that some
  // members are typed with (`coachBilling`, `fork`, `finance`) contribute their own name and not
  // their fields.
  const members: string[] = []
  for (const line of lines.slice(start + 1, end)) {
    const m = /^ {2}([A-Za-z_][A-Za-z0-9_]*)\??:/.exec(line)
    if (m) members.push(m[1])
  }
  return members
}

/** Every `.ts`/`.vue` file that could READ a snapshot – the side of the boundary that RECEIVES one.
 *
 *  ⚠⚠ `src/engine`, `src/worker` and `src/db` ARE NOT IN IT, AND THAT IS THE WHOLE TEST. Both
 *  members the review found are also `WorldState` fields, so the engine names them constantly – a
 *  corpus that included the engine passed on the unfixed tree and proved nothing. Caught by running
 *  the first draft before deleting anything, which is the only reason this note exists.
 *
 *  ⚠ `src/shared` IS in it, minus the protocol that declares the members: `shared/avatarEmotion.ts`
 *  is a real reader of `lossStreak` and the review's own first pass mis-flagged it. */
const READER_ROOTS = ['components', 'stores', 'composables', 'viz', 'shared']

function readerFiles(): string[] {
  const out: string[] = []
  const skip = (path: string): boolean =>
    path.includes('/shared/protocol/') || path.endsWith('/shared/protocol.ts')
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = resolve(dir, entry)
      if (statSync(path).isDirectory()) {
        walk(path)
        continue
      }
      if (!/\.(ts|vue)$/.test(entry)) continue
      if (skip(path)) continue
      out.push(path)
    }
  }
  for (const root of READER_ROOTS) walk(resolve(SRC, root))
  out.push(resolve(SRC, 'App.vue'))
  return out
}

const MEMBERS = snapshotMembers()
const CORPUS = readerFiles().map((p) => ({ path: p, text: readFileSync(p, 'utf8') }))

describe('E-07 – the Snapshot contract has no members nobody reads', () => {
  it('the instrument found the interface and the files to search', () => {
    // Both halves guard against a silently empty run: a renamed interface or a moved tree would
    // otherwise make every assertion below vacuously green, which is how the drift got in.
    expect(MEMBERS.length, 'the Snapshot must have members').toBeGreaterThan(60)
    expect(MEMBERS).toContain('week')
    expect(MEMBERS).toContain('careerTotals')
    expect(CORPUS.length, 'there must be files to search').toBeGreaterThan(50)
    // ...and the two files the review had to check by hand are in the corpus, because they are the
    // reason the search is wider than `components/`.
    expect(CORPUS.some((f) => f.path.endsWith('shared/avatarEmotion.ts'))).toBe(true)
    expect(CORPUS.some((f) => f.path.endsWith('screens/StatsScreen.vue'))).toBe(true)
  })

  it('⚠ every member is named somewhere outside the protocol and the builder', () => {
    const unread = MEMBERS.filter((name) => {
      const word = new RegExp(`\\b${name}\\b`)
      return !CORPUS.some((f) => word.test(f.text))
    })
    expect(
      unread,
      'a Snapshot member with no reader is a promise to the UI that nothing collects',
    ).toEqual([])
  })
})
