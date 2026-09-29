// THE TOOLS GATE'S OWN WIRING PIN – T5.6 / T5.7 of the principles fix (H-03, H-17, 26.09).
//
// ⚠⚠ WHAT IT IS FOR, AND IT IS THE SECOND ARM RATHER THAN THE FIRST. `scripts/tools-registry.mjs`
// now hands `check:tools` an explicit file list instead of letting `tsconfig.tools.json` glob the
// directory, and it withholds the frozen archival probes from that list. Both halves are the same
// risk pointing in opposite directions:
//   THE HOLE H-03 CLOSES – a gate that reads the DIRECTORY judges whatever else sits in the
//     checkout. With another session's untracked `.ts` in `tools/` (the owner's tree holds seven:
//     `tools/_devlog_*`, `tools/devlog/`) `tools:registry:check` printed «tools/README.md is stale»
//     on product-identical code, and `check:tools` compiled 273 files where the tree held 266.
//   THE HOLE A GENERATED LIST OPENS – a list that silently drops a TRACKED tool turns the gate off
//     for that file, and nothing would say so. 98 archival probes are swept by `check:tools` and by
//     NOTHING ELSE: `vue-tsc -b` only ever sees the 55 live ones through `tsconfig.app.json`.
// So the claim below is an EQUALITY, deliberately: the compiled list is exactly the tracked tools
// minus the frozen ones. Not a subset, not a floor.
//
// ⚠ MUTATION-VERIFIED (26.09, both directions, quoted in the wave report):
//   · an untracked `tools/_w5_untracked_probe.ts` carrying `const weeks: number = 'not a number'`
//     leaves `tools:registry:check` and `check:tools` at exit 0, where the readdir/glob pair went
//     red at exit 1 and exit 2 on the same file, same tree, nothing else changed;
//   · appending the same error to a TRACKED swept probe (`tools/_corridor.ts`) still reddens
//     `check:tools`: «tools/_corridor.ts(117,7): error TS2322», exit 2;
//   · appending it to a FROZEN probe (`tools/his-cadence-read.ts`) leaves `check:tools` green – and
//     `tools:registry:check` names it: «has CHANGED while frozen out of `check:tools`», exit 1.
// This file is the standing version of the first two: delete a path from the generated list, or put
// the glob back in `tsconfig.tools.json`, and it goes red without anybody re-running the arms.
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8')

/**
 * git is the authority on "in the commit", exactly as `tests/art/preload.test.ts` treats it – and
 * here it is the INDEPENDENT reader: the registry writes the list, and this asks git the same
 * question rather than asking the registry twice.
 */
function trackedTools(): string[] {
  const out = execFileSync('git', ['ls-files', '-z', '--', 'tools'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return out
    .split('\0')
    .filter((file) => file.endsWith('.ts') && !file.startsWith('tools/generated/'))
    .sort()
}

/** A file's git blob id from its bytes – the same arithmetic the registry records the freeze with. */
function blobSha(rel: string): string {
  const bytes = readFileSync(join(ROOT, rel))
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
}

/**
 * Both tsconfigs here are jsonc – they carry the notes that stop the next reader hand-editing them,
 * and `tsconfig.tools.json`'s note QUOTES the glob it replaced. So the prose is dropped before
 * anything is asserted: an assertion that reads a comment is an assertion about the comment.
 */
const withoutComments = (rel: string) => read(rel).replace(/^\s*\/\/.*$/gm, '')

const frozen: Record<string, string> = JSON.parse(read('tools/generated/archival-frozen.json')).frozen
const compiled: string[] = JSON.parse(withoutComments('tsconfig.tools.files.json')).files

describe('the tools gate judges the commit, not the checkout', () => {
  it('compiles EXACTLY the tracked tools minus the frozen ones – a dropped tracked file is a gate turned off', () => {
    const expected = trackedTools().filter((file) => !frozen[file])
    expect(expected.length).toBeGreaterThan(100) // the fixture has something to say
    expect(compiled).toEqual(expected)
  })

  it('no untracked file can enter the list, and every entry is a real tracked tool', () => {
    const tracked = new Set(trackedTools())
    expect(compiled.filter((file) => !tracked.has(file))).toEqual([])
  })

  it('tsconfig.tools.json takes its roots from the generated list and globs nothing', () => {
    const config = withoutComments('tsconfig.tools.json')
    // ⚠ The negative is the point of reading the FILE rather than the resolved program: a
    // reintroduced `"include": ["tools/**/*.ts"]` would compile the directory again and every
    // assertion above would stay green, because they read the generated list, not the compiler.
    expect(config).not.toMatch(/"include"\s*:\s*\[\s*"tools/)
    expect(config).toMatch(/"include"\s*:\s*\[\s*\]/)
    expect(config).toContain('"./tsconfig.tools.files.json"')
  })

  it('the freeze holds only archival probes, each at the blob it was frozen at', () => {
    const live = [...read('tsconfig.app.json').matchAll(/"(tools\/[^"]+)"/g)].map((match) => match[1])
    expect(live.length).toBeGreaterThan(40) // the fixture has something to say
    expect(Object.keys(frozen).filter((file) => live.includes(file))).toEqual([])
    const drifted = Object.entries(frozen).filter(([file, sha]) => blobSha(file) !== sha)
    expect(drifted.map(([file]) => file)).toEqual([])
  })
})
