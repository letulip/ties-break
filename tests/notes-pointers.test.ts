// THE POINTER CHECK'S OWN NET – T7.1 of the principles fix (W7, 29.09).
//
// ⚠ WHAT IT IS FOR. `scripts/notes-pointers.mjs` is the only reader of the
// `→ docs/notes/<area>/<file>.md#<anchor>` pointers W7 leaves in source, and `npm run check` runs it.
// A gate nobody has seen fail is a guess, so this file runs the REAL script as a child process – the way
// `check` meets it, judged by exit code and the two streams – over fixture trees in
// tests/fixtures/notes-pointers/, each one a whole `--root` holding a `src/` and (mostly) a `docs/notes/`:
//   valid/            five pointers: a .ts (one in a comment, two on a line where the first sits in a
//                     string) and a .vue (one in the script block, one in a template comment). The notes
//                     file's headings run the slug rule end to end – capitals, `–`, `%`, parentheses and
//                     a ` – ` that slugs to a DOUBLE hyphen (GitHub does not collapse), an underscore kept, Cyrillic letters, a sentence-ending full stop.
//   anchor-missing/   an anchor no heading slugs to; the same anchor with a capital (a slug is lowercase,
//                     so an anchor must be too); and, as the control, the right one.
//   file-missing/     a pointer at a notes file that is not there, in a tree with no docs at all.
//   malformed/        six mentions of the folder that do not parse as a pointer, each refused as such –
//                     prose is not a way round the gate.
//   false-headings/   pointers at a `# comment` in YAML front matter and in a fenced shell block, which
//                     are not headings, beside a real heading that still resolves.
//
// ⚠ THE TREES ARE FIXTURES, NOT SOURCE. `tests/**/*.ts` is inside `tsconfig.app.json`, so every fixture
// `.ts` is a valid module (comments and an export) and a fixture may not say `docs/notes/` in its own
// prose – the gate would count it, and rightly.
//
// ⚠ MUTATION-VERIFIED (29.09). Each arm was applied to the real script or fixture, this file run, and the
// file restored byte for byte (`cmp` against a copy) before the next; the restored tree re-ran green
// (8 passed of 8):
//   · rename the valid tree's heading (`Flat` -> `Level`): RED, 1 failed | 7 passed – the valid tree,
//     whose pointers at that heading stopped resolving. The plan's «rename an anchor -> red».
//   · stop lowercasing in the slug rule (drop the `.toLowerCase()` call): RED, 3 failed | 5 passed – the
//     valid, false-headings and anchor-missing trees.
//   · stop skipping YAML front matter: RED, 1 failed (false-headings).
//   · stop honouring fenced code: RED, 1 failed (false-headings).
//   · let a `..` climb through as a pointer: RED, 1 failed (malformed).
//   · drop the lookahead that refuses an anchor glued to a second `#`: RED, 1 failed (malformed).
//   · re-verified 29.09 after the GitHub-exact slug (architect): restore the hyphen collapse into slugify
//     -> RED, 1 failed (the valid tree – its `--` anchors stop resolving); removed again -> green.
import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SCRIPT = join(ROOT, 'scripts', 'notes-pointers.mjs')
const FIXTURES = join(ROOT, 'tests', 'fixtures', 'notes-pointers')
/** Each test spawns node; a starved machine has been seen to take seconds over that. */
const SPAWN = { timeout: 30_000 }

/** The gate as `npm run check` meets it: a child process, judged by exit code and the two streams. */
function gate(args: string[], cwd: string = ROOT) {
  const run = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' })
  return { status: run.status, out: run.stdout, err: run.stderr }
}
const onFixture = (name: string) => gate(['--root', join(FIXTURES, name)])

const MALFORMED = 'malformed pointer: expected docs/notes/<path>.md#<anchor>'

describe('the pointer check – a pointer that does not resolve turns the gate red', () => {
  it('passes a tree whose every pointer resolves: comments, strings, .vue, the slug rule end to end', SPAWN, () => {
    const run = onFixture('valid')
    expect(run.err).toBe('')
    expect(run.out).toBe('notes-pointers: 6 pointers, all resolve\n')
    expect(run.status).toBe(0)
  })

  it('refuses an anchor no heading slugs to – and an anchor must BE the lowercase slug', SPAWN, () => {
    const run = onFixture('anchor-missing')
    expect(run.status).toBe(1)
    expect(run.out).toBe('')
    expect(run.err).toContain('src/engine/ladder.ts:2 -> docs/notes/engine/ladder.md#no-such-heading (anchor not found)')
    expect(run.err).toContain('src/engine/ladder.ts:3 -> docs/notes/engine/ladder.md#Why-the-ladder-is-flat (anchor not found)')
    // Line 4 is the same anchor in its lowercase form: the control, and it must not be listed.
    expect(run.err).not.toContain('#why-the-ladder-is-flat')
    expect(run.err).toContain('2 of 3 pointers do not resolve')
  })

  it('refuses a pointer at a notes file that does not exist, even where there is no docs tree at all', SPAWN, () => {
    const run = onFixture('file-missing')
    expect(run.status).toBe(1)
    expect(run.err).toContain('src/engine/ladder.ts:2 -> docs/notes/engine/nope.md#anything (file not found)')
    expect(run.err).toContain('1 of 1 pointers do not resolve')
  })

  it('refuses every mention of the folder that does not parse as a pointer: it is never prose', SPAWN, () => {
    const run = onFixture('malformed')
    expect(run.status).toBe(1)
    const refused: Array<[number, string]> = [
      [2, 'docs/notes/engine/ladder'], // no .md and no anchor
      [3, 'docs/notes/engine/ladder.md'], // a file that exists, but no anchor
      [4, 'docs/notes/engine/ladder.md#'], // an empty anchor
      [5, 'docs/notes/../ladder.md#why-the-ladder-is-flat'], // climbs out of the notes folder
      [6, 'docs/notes/'], // the bare folder
      [7, 'docs/notes/engine/ladder.md#why#the-ladder'], // an anchor glued straight to a second hash
    ]
    for (const [line, shown] of refused) {
      expect(run.err, `line ${line}`).toContain(`src/engine/ladder.ts:${line} -> ${shown} (${MALFORMED})`)
    }
    expect(run.err).toContain('6 of 6 pointers do not resolve')
  })

  it('reads no heading out of front matter or a fenced block: a shell comment is not an anchor', SPAWN, () => {
    const run = onFixture('false-headings')
    expect(run.status).toBe(1)
    expect(run.err).toContain('src/engine/ladder.ts:2 -> docs/notes/engine/ladder.md#a-yaml-comment (anchor not found)')
    expect(run.err).toContain('src/engine/ladder.ts:3 -> docs/notes/engine/ladder.md#a-shell-comment (anchor not found)')
    // Line 4 points at the one real heading; it resolves and must not be listed.
    expect(run.err).not.toContain('#a-real-heading')
    expect(run.err).toContain('2 of 3 pointers do not resolve')
  })

  it('refuses to report zero pointers from a root with no src/: a wrong root can never read as green', SPAWN, () => {
    const noSrc = gate(['--root', FIXTURES])
    expect(noSrc.status).toBe(2)
    expect(noSrc.out).toBe('')
    expect(noSrc.err).toContain('no src/ directory')
    const unknownFlag = gate(['--rot', FIXTURES])
    expect(unknownFlag.status).toBe(2)
    expect(unknownFlag.out).toBe('')
  })

  it('judges the real tree by default, from any working directory: the root is the repo the script sits in', SPAWN, () => {
    const run = gate([], FIXTURES)
    expect(run.err).toBe('')
    expect(run.out).toMatch(/^notes-pointers: \d+ pointers, all resolve\n$/)
    expect(run.status).toBe(0)
  })

  it('is wired into `npm run check` immediately after `context:audit`', () => {
    const { scripts } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }
    expect(scripts['check']).toContain('npm run context:audit && node scripts/notes-pointers.mjs && ')
  })
})
