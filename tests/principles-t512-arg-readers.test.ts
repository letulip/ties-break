// ⭐⭐ T5.12 · F-04 – THE BENCHES' ARM READERS, PROVED BY UNIT RATHER THAN BY OUTPUT DIFF.
//
// Every other migration in T5.12 is certified by running its bench before and after and comparing the
// printed bytes. `tools/snapshot-bench.ts` cannot be certified that way and that is not a defect in the
// bench: EVERY numeric cell it prints is a `performance.now()` millisecond (`timeArm`, `:161-195`), so
// its output legitimately differs run to run and a diff over it says nothing either way.
//
// ⚠⚠ THE ARCHITECT'S RULING, 28.09, AND THE REASON IT IS A STRONGER PROOF AND NOT A CONCESSION: an
// argument reader's correctness is «the same argv produces the same parsed values». That is a unit
// claim over a handful of argv shapes, and it tests THE FUNCTION rather than a run that happens to
// contain it. An output diff can only ever say "this run did not move"; this file says "these two
// bodies agree on every shape either can be handed".
//
// So the table below drives the SHARED readers against the HISTORICAL bodies they replaced, verbatim,
// over every shape a bench can be handed – absent flag, normal value, zero, negative, fractional, a
// missing value at the end of argv, a non-numeric value, an empty string, and a flag whose name is a
// prefix of another.
//
// ⚠ AND THE TWO SHARED READERS DISAGREE ON PURPOSE. `--seeds abc` is NaN under `argOf` and the
// fallback under `finiteArgOf`, and `tools/_args.ts` records why both survive: for a MEASUREMENT
// instrument, loud corruption is a feature. The last describe below pins that divergence, so a later
// wave cannot unify them on tidiness without this file going red and asking first.
import { describe, it, expect, afterEach } from 'vitest'
import { argOf, finiteArgOf } from '../tools/_args'

// =================================================================================================
// THE HISTORICAL BODIES, VERBATIM
// =================================================================================================

/** `tools/snapshot-bench.ts:53`'s `flag` as it stood – and the body of the seven live copies called
 *  `argOf`, plus `chemistry-bench`, `load-bench`, `radar-bench`, `r44-decline-seats` and
 *  `season-equation`'s `numOf`. The ONE textual change on migration is that `args` was a module-level
 *  `const args = process.argv.slice(2)` closed over, where the shared reader slices at call time –
 *  equivalent for a bench, whose argv cannot change mid-run, and a parameter here so both sides can be
 *  handed identical input. */
const historicalLenient = (args: string[], name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}

/** `tools/wedding-bench.ts:85`'s body – the six copies that guarded on `Number.isFinite`. It reads
 *  `process.argv` WHOLE rather than `slice(2)`, which is why the shape table below builds both. */
const historicalFinite = (argv: string[], name: string, fallback: number): number => {
  const at = argv.indexOf(`--${name}`)
  const n = Number(argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}

// =================================================================================================
// THE SHAPES
// =================================================================================================

/** `process.argv` as node really hands it over: `[execPath, scriptPath, ...userArgs]`. Building it
 *  this way is load-bearing for `historicalFinite`, whose `at > 0` guard is only unreachable BECAUSE
 *  the first two slots are never a `--flag`. */
const argvOf = (...userArgs: string[]): string[] => ['/usr/local/bin/node', '/repo/tools/x.ts', ...userArgs]

const SHAPES: { why: string; user: string[] }[] = [
  { why: 'no arguments at all', user: [] },
  { why: 'the flag is absent, another is present', user: ['--warmup', '5'] },
  { why: 'a plain value', user: ['--repeats', '40'] },
  { why: 'zero – the value is falsy as a NUMBER and truthy as a STRING, which is the guard here', user: ['--repeats', '0'] },
  { why: 'a negative value', user: ['--repeats', '-3'] },
  { why: 'a fractional value', user: ['--repeats', '2.5'] },
  { why: 'the flag is last and has no value', user: ['--repeats'] },
  { why: 'the flag is repeated – the FIRST wins in both bodies', user: ['--repeats', '7', '--repeats', '9'] },
  { why: 'a value that is itself a flag', user: ['--repeats', '--warmup'] },
  { why: 'a name that is a prefix of the flag present', user: ['--repeatsmore', '4'] },
  { why: 'the flag after another flag-value pair', user: ['--warmup', '1', '--repeats', '8'] },
  { why: 'a non-numeric value – the ONE case the two shared readers disagree on', user: ['--repeats', 'abc'] },
  { why: 'an empty-string value', user: ['--repeats', ''] },
]

const withArgv = <T,>(argv: string[], run: () => T): T => {
  const saved = process.argv
  process.argv = argv
  try {
    return run()
  } finally {
    process.argv = saved
  }
}

afterEach(() => {
  // ⚠ Belt as well as braces: a failed assertion inside `withArgv` still restores through `finally`,
  // but a throw in the shape table itself would not, and a leaked `process.argv` would corrupt every
  // later file in this worker.
  expect(Array.isArray(process.argv)).toBe(true)
})

describe('T5.12 – the shared arm readers parse exactly what the copies they replaced parsed', () => {
  it('⭐⭐ `argOf` === `snapshot-bench`\'s `flag`, on every shape – the proof that routing it was safe', () => {
    for (const { why, user } of SHAPES) {
      const argv = argvOf(...user)
      const mine = withArgv(argv, () => argOf('repeats', 25))
      const theirs = historicalLenient(argv.slice(2), 'repeats', 25)
      // `Object.is` so NaN === NaN counts as agreement – which is the whole point for `--repeats abc`.
      expect(
        Object.is(mine, theirs),
        `${why}: shared argOf gave ${String(mine)}, the historical body gave ${String(theirs)}`,
      ).toBe(true)
    }
  })

  it('⭐ `finiteArgOf` === `wedding-bench`\'s body, on every shape', () => {
    for (const { why, user } of SHAPES) {
      const argv = argvOf(...user)
      const mine = withArgv(argv, () => finiteArgOf('repeats', 56))
      const theirs = historicalFinite(argv, 'repeats', 56)
      expect(
        Object.is(mine, theirs),
        `${why}: shared finiteArgOf gave ${String(mine)}, the historical body gave ${String(theirs)}`,
      ).toBe(true)
    }
  })

  it('...and the shapes are not all answering the fallback, which would make the two arms above vacuous', () => {
    // ⚠ ANTI-VACUITY. Two functions that both return the fallback for every input agree perfectly and
    // prove nothing. This arm asserts the table actually exercises the parse.
    const parsed = SHAPES.map(({ user }) => withArgv(argvOf(...user), () => argOf('repeats', 25)))
    const distinct = new Set(parsed.map((v) => (Number.isNaN(v) ? 'NaN' : String(v))))
    expect(distinct.size, `the shapes produced only ${[...distinct].join(', ')}`).toBeGreaterThan(5)
    expect(parsed.filter((v) => v === 25).length, 'every shape fell back – the parse is never reached').toBeLessThan(
      SHAPES.length,
    )
    expect(parsed.some((v) => v === 40) && parsed.some((v) => v === 0) && parsed.some((v) => v === -3)).toBe(true)
  })

  it('⭐ the two snapshot-bench call sites keep their defaults – `--repeats 25`, `--warmup 20`', () => {
    // The values the bench's header prints and its arms are built from. A migration that silently
    // changed a default would change every cell without changing a line of logic.
    const bare = argvOf()
    expect(withArgv(bare, () => argOf('repeats', 25))).toBe(25)
    expect(withArgv(bare, () => argOf('warmup', 20))).toBe(20)
    const given = argvOf('--repeats', '3', '--warmup', '1')
    expect(withArgv(given, () => argOf('repeats', 25))).toBe(3)
    expect(withArgv(given, () => argOf('warmup', 20))).toBe(1)
  })
})

describe('T5.12 – the two readers diverge on THREE shapes, in TWO directions, and that is the ruling', () => {
  // ⚠⚠ THIS TABLE CORRECTS MY OWN WRITE-UP. Both `tools/_args.ts` and the T5.12 commit first said the
  // two readers «differ in ONE case, `--seeds abc`». The arm below was written to pin that and went RED
  // on three shapes, which is the more interesting answer: the divergence runs BOTH WAYS, and the
  // architect's «loud corruption is a feature» cuts against `finiteArgOf` on the third.
  //
  //   `--repeats abc`      argOf → NaN          finiteArgOf → fallback
  //   `--repeats --warmup` argOf → NaN          finiteArgOf → fallback     (same class: not a number)
  //   `--repeats ''`       argOf → fallback     finiteArgOf → **0**        (the other direction)
  //
  // The third is the one to keep an eye on: `Number('') === 0`, so `finiteArgOf` INVENTS a zero for a
  // flag it was handed nothing for, and zero is a plausible arm. `argOf`'s truthiness guard rejects it.
  it('⭐⭐ DIRECTION 1 – a value that is not a number: `argOf` is loud, `finiteArgOf` is quiet', () => {
    // ⚠⚠ DO NOT UNIFY THESE ON TIDINESS. The architect's ruling, 28.09: for a MEASUREMENT instrument
    // loud corruption is a FEATURE. NaN poisons every derived cell visibly; a silent fallback hands a
    // plausible, WRONG number to whoever quotes the bench into a spec. `tools/_args.ts` carries the
    // reason; this is the assertion that makes a unification ask first.
    for (const bad of ['abc', '--warmup']) {
      const argv = argvOf('--seeds', bad)
      expect(withArgv(argv, () => argOf('seeds', 12)), `--seeds ${bad} under argOf`).toBeNaN()
      expect(withArgv(argv, () => finiteArgOf('seeds', 12)), `--seeds ${bad} under finiteArgOf`).toBe(12)
    }
  })

  it('⭐⭐ DIRECTION 2 – an empty value: `argOf` falls back, `finiteArgOf` invents a zero', () => {
    const argv = argvOf('--seeds', '')
    expect(withArgv(argv, () => argOf('seeds', 12)), 'argOf should reject an empty token').toBe(12)
    expect(withArgv(argv, () => finiteArgOf('seeds', 12)), "Number('') is 0 and 0 is finite").toBe(0)
  })

  it('...and those three are ALL of it – the divergence is a listed set, not a family', () => {
    const disagreed = SHAPES.filter(({ user }) => {
      const argv = argvOf(...user)
      const a = withArgv(argv, () => argOf('repeats', 25))
      const b = withArgv(argv, () => finiteArgOf('repeats', 25))
      return !Object.is(a, b)
    }).map(({ user }) => user.join(' '))
    expect(disagreed, 'the two readers diverge on a shape this file has not named').toEqual([
      '--repeats --warmup',
      '--repeats abc',
      '--repeats ',
    ])
  })
})
