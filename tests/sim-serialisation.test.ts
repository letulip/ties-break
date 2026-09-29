// P6 (d) – THE SIM PROJECT MUST RUN SERIALISED, IN EVERY SCRIPT THAT RUNS IT.
//
// WHY THIS FILE EXISTS. birpc gives every vitest worker RPC a HARD-CODED 60s timeout
// (node_modules/birpc: DEFAULT_TIMEOUT = 6e4, not configurable in vitest 3.2.7). The sim files are
// minutes of synchronous Monte-Carlo, so run in parallel the forks and the main process fight for
// cores, a pending `onTaskUpdate` ack sits past the minute, and the run exits 1 WITH EVERY TEST
// GREEN. The honest lever is `--no-file-parallelism` on the CLI, because vitest 3.2.7 ignores
// `fileParallelism` at project level (createForksPool builds one pool for the whole run off the
// ROOT config) – the reasoning is spelled out at vite.config.ts's sim project.
//
// THE FAILURE MODE THIS GUARDS. `test:sim` carried the flag; `test:sim:quiet` and `test:all` did
// not, and both reproduced the red-on-green exit (measured 02.08: `test:sim:quiet` EXIT=1, four
// files and 77 tests passed, 2 errors). A fix applied to one script and not its twins is invisible
// until a cron goes red months later, which is exactly what the weekly calibration job is for.
//
// So: any script whose command runs the sim project must carry the flag. Not "the ones we
// remembered" – all of them, checked mechanically.
//
// =================================================================================================
// ⚠⚠ RE-AIMED 24.08 (R2-03), AND IT WAS AIMED AT NOTHING. The review said this guard "scripts TEXT
// rather than the real runner arguments"; a mutation settled it in one run.
//
// WHAT IT USED TO DO. `scriptsRunningSim()` filtered package.json for scripts whose command string
// contains `vitest run`. On 05.08 `test:sim` and `test:sim:quiet` both became `node scripts/sim.mjs`
// – no `vitest run` in either string – so BOTH dropped out of the filter. The only script left
// matching was `test:all`, which is not the sim gate and is not what CI runs. The vacuity check
// (`length > 0`) passed on that one accidental survivor, so the file looked healthy while covering
// none of the sim.
//
// THE MUTATION. Delete `--no-file-parallelism` from `scripts/sim.mjs`'s actual argv – the exact
// regression this file exists to prevent, on the exact line `npm run test:sim` and the weekly CI job
// both execute. RESULT: 4 passed, exit 0. The guard was false.
//
// ⚠ AND SCANNING THE RUNNER'S WHOLE SOURCE WOULD NOT HAVE FIXED IT EITHER: `scripts/sim.mjs`'s own
// header comment names `--no-file-parallelism` in prose, so a file-level `includes` stays green with
// the flag deleted from the command. What is checked below is the ARGV ARRAY the runner spawns.
//
// This is the same move the unit half of this file made on 05.08 and for the same reason – see the
// last test. The sim half simply never followed.
//
// =================================================================================================
// ⚠ 27.09 (T5.2 · H-05) – THIS FILE NOW HOLDS A SECOND GATE-ON-GATES CLAIM, about the OTHER heavy
// list. Same shape and same reason as everything above: `scripts/heavy-tests.mjs` decides which unit
// files get a process of their own, and the one thing that decision has ever had a RULE for – a
// family cut for cost keeps all its pieces out of the bulk pool – was kept by hand and was already
// broken. The new describe is at the bottom of this file; the rule it reads is declared beside the
// list it guards (`HEAVY_UNIT_FAMILIES`), not here, so a future cut declares its family in one place.
//
// ⚠ 27.09 (T5.3 · H-06) – AND A THIRD, about the one number a test file can write that silently
// defeats the pool it runs in: a per-test budget above birpc's window. Same shape again – the rule is
// `vite.config.ts`'s own `testTimeout`, this file only enforces it. The new describe is at the bottom.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { HEAVY_UNIT_FAMILIES, HEAVY_UNIT_FILES, HEAVY_SIM_FILES } from '../scripts/heavy-tests.mjs'

const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')) as {
  scripts: Record<string, string>
}

/** `vitest run` on a shell command line. */
const SHELL_VITEST_RUN = /\bvitest\s+run\b/
/** `--project sim` in every spelling in use: `--project sim`, `--project=sim`, `'--project', 'sim'`. */
const PROJECT_SIM = /--project['"]?\s*[,= ]\s*['"]?sim\b/
/** any `--project` at all, so "no --project means every project" can still be answered. */
const ANY_PROJECT = /--project\b/
/** the low-chatter reporter, same three spellings. */
const DOT_REPORTER = /--reporter['"]?\s*[,= ]\s*['"]?dot\b/
/** a runner this repo delegates to – `node scripts/sim.mjs`. */
const RUNNER_PATH = /scripts\/[\w.-]+\.mjs/g
/** the vitest ARGV ARRAY a runner spawns, source text only: `['vitest', 'run', …]`. Deliberately
 *  stops at the first `]`, and deliberately not the whole file – see the header. */
const VITEST_ARGV = /\[\s*['"]vitest['"]\s*,[^\]]*\]/g

function runnerSource(rel: string): string | null {
  try {
    return readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8')
  } catch {
    return null // a script naming a file that is not there is not this test's problem
  }
}

/** Every place ONE package script actually hands the sim project to vitest: the command string when
 *  the script IS the invocation, and the spawned ARGV when it delegates to a runner. */
function simInvocationsOf(name: string, cmd: string): { where: string; command: string }[] {
  const out: { where: string; command: string }[] = []
  if (SHELL_VITEST_RUN.test(cmd) && (PROJECT_SIM.test(cmd) || !ANY_PROJECT.test(cmd))) {
    out.push({ where: `package.json "${name}"`, command: cmd })
  }
  for (const [rel] of cmd.matchAll(RUNNER_PATH)) {
    const src = runnerSource(rel)
    if (!src) continue
    for (const [argv] of src.matchAll(VITEST_ARGV)) {
      // A runner is only in scope when its own argv NAMES the sim project. `scripts/units.mjs`
      // spawns `'--project', 'unit'` and is none of this rule's business.
      if (PROJECT_SIM.test(argv)) out.push({ where: `${rel}, spawned by "${name}"`, command: argv })
    }
  }
  return out
}

function simInvocations(): { where: string; command: string }[] {
  return Object.entries(pkg.scripts).flatMap(([name, cmd]) => simInvocationsOf(name, cmd))
}

describe('the sim project runs serialised', () => {
  it('every invocation that runs it carries --no-file-parallelism', () => {
    const offenders = simInvocations().filter(({ command }) => !command.includes('--no-file-parallelism'))
    expect(
      offenders.map((o) => o.where),
      'these run the sim project in parallel and will exit 1 with every test green',
    ).toEqual([])
  })

  it('...and a low-chatter reporter, which is the second half of the same mitigation', () => {
    // Measured 02.08: with the flag but the DEFAULT reporter, `test:sim` exited 1 on one run and 0
    // on the next – the per-test tree re-render keeps far more `onTaskUpdate` acks in flight, so the
    // race against birpc's 60s window is lost more often. `--reporter=dot` still prints the summary
    // and every failure; it only drops the per-test tree nobody reads in CI.
    const offenders = simInvocations().filter(({ command }) => !DOT_REPORTER.test(command))
    expect(offenders.map((o) => o.where), 'these run the sim project with the chatty default reporter').toEqual([])
  })

  it('⚠ ...and what `npm run test:sim` ACTUALLY runs is one of them – the rule cannot pass by proxy', () => {
    // ⚠⚠ THE ANTI-VACUOUS CLAIM, AND IT IS STRICTLY STRONGER THAN THE `length > 0` IT REPLACES. That
    // one was satisfied by `test:all` alone – a script nobody runs as the sim gate – for the nineteen
    // days `test:sim` spent invisible to this file. The gate has to be covered by NAME, or the rules
    // above are being kept by somebody else's script.
    expect(simInvocations().length, 'the rules above have nothing to check').toBeGreaterThan(0)
    const gate = simInvocationsOf('test:sim', pkg.scripts['test:sim'])
    expect(gate.length, 'the sim gate itself is invisible to the rules above').toBeGreaterThan(0)
  })

  it('the unit project is NOT serialised – it is 100+ fast files and parallelism is the point', () => {
    // ⚠ RE-AIMED 05.08, and it caught a real change before it could ship – which is the point of it.
    //
    // `npm test` used to be a literal vitest invocation, so the guard could read the flags straight
    // off the script string. It is now `node scripts/units.mjs`, because the population going
    // 520 -> 1,600 pushed the unit suite past birpc's unraisable 60s RPC window on CI (everything
    // green, exit 1 — see that script's header). The heavy tail gets a process each; the other 109
    // files still run in parallel, which is what this test actually cares about.
    //
    // So the assertion moves from the SCRIPT STRING to the THING IT RUNS. Serialisation is still
    // forbidden, now checked wherever the unit project is actually invoked, and the runner must
    // still be pointed at the unit project. Not weakened: it reads the real command now instead of
    // a string that happened to contain it.
    const unit = pkg.scripts['test']
    const runner = unit.includes('scripts/units.mjs')
      ? readFileSync(fileURLToPath(new URL('../scripts/units.mjs', import.meta.url)), 'utf8')
      : unit
    expect(runner, 'the unit suite must run the unit project').toContain("'--project', 'unit'")
    expect(runner, 'the unit project must never be serialised').not.toContain('--no-file-parallelism')
  })
})

// =================================================================================================
// A GATE ON THE HEAVY UNIT POOL – T5.2 · H-05 (27.09).
//
// ⚠ WHAT WENT WRONG WITHOUT IT, and it is the finding's own measurement rather than an example.
// `154b17d0` (23.09) made the fifth cut of the coach-travel-edge version ladder and created
// `tests/coach-travel-edge-late-schemas.test.ts`. It touched three files; `scripts/heavy-tests.mjs`
// was not one of them. The family's other six members are all in `HEAVY_UNIT_FILES`, so the new
// sibling ran in the contended bulk pool – where the ladder's own blocks record the pool reading
// files at 2.06x-2.9x their solo cost, which is the mechanism the pool exists to avoid.
//
// ⚠ THIS IS THE FIRST RED THIS TEST PRODUCED, on the tree as it stood before the fix – a real
// omission and not a fixture, which is the only kind of first red worth quoting:
//
//     FAIL |unit| tests/sim-serialisation.test.ts > the heavy unit pool takes whole families
//          > every file matching a declared family glob is in HEAVY_UNIT_FILES
//     AssertionError: these match a family glob but run in the contended bulk pool … :
//     expected [ Array(1) ] to deeply equal []
//     - Expected  + Received
//     - []
//     + [
//     +   "tests/coach-travel-edge-late-schemas.test.ts  (family coach-travel-edge-*-schemas)",
//     + ]
//     Tests  1 failed | 5 passed (6)          T52_RED_EXIT=1
//
// Measured solo afterwards, this file's own prescribed method (`npx vitest run --project unit
// --reporter=json`, one file, quiet machine, load 1.57-1.67): 15.72 / 15.74 / 15.77 s wall,
// 14.20 / 14.35 / 14.36 s of test time, 6 cases, exit 0 – under 0.06 s of spread across three runs.
//
// ⚠ IT IS A MEMBERSHIP RULE AND DELIBERATELY NOT A COST RULE. «Is this file dear enough to promote?»
// is G-05's re-curation: it needs a fresh solo reading per file and one CI run per arm, and it is not
// in this wave. «Did every member of a family that was CUT for cost get its process?» needs no
// judgement at all – the cut is what established the cost – so it can be a gate, and the directory is
// the source. The families are declared next to the list in `scripts/heavy-tests.mjs`, never here: a
// second copy of that list is exactly what that module was created to abolish.
//
// ⚠ MUTATION-VERIFIED (27.09): `tests/coach-travel-edge-late-schemas.test.ts` removed from
// `HEAVY_UNIT_FILES` again -> 1 red, naming that path and its family; `'goldenSaves*'` emptied to
// `'goldenSavesNothing*'` -> 1 red on the vacuity arm below, which is the half that catches a glob
// that has rotted into matching nothing.

/** Every `tests/*.test.ts` stem, from the directory rather than from a list – the same argument
 *  `e2e/coverage-map.spec.ts` makes for parsing its document instead of restating it. */
function testStems(): string[] {
  const dir = fileURLToPath(new URL('../tests/', import.meta.url))
  return readdirSync(dir)
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => f.slice(0, -'.test.ts'.length))
    .sort()
}

/** A family glob against a STEM. `*` is the only metacharacter and it does not cross a `/`, so a
 *  family in a subdirectory has to say `/` out loud. Everything else is escaped, because a glob that
 *  quietly behaved as a regex would match by accident, which is the failure this whole file is about. */
function familyMatcher(glob: string): RegExp {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')
  return new RegExp(`^${escaped}$`)
}

const familyMembers = (glob: string): string[] =>
  testStems()
    .filter((stem) => familyMatcher(glob).test(stem))
    .map((stem) => `tests/${stem}.test.ts`)

describe('the heavy unit pool takes whole families', () => {
  it('every file matching a declared family glob is in HEAVY_UNIT_FILES', () => {
    const missing = HEAVY_UNIT_FAMILIES.flatMap((glob) =>
      familyMembers(glob)
        .filter((path) => !HEAVY_UNIT_FILES.includes(path))
        .map((path) => `${path}  (family ${glob})`),
    )
    expect(
      missing,
      'these match a family glob but run in the contended bulk pool – a cut that split a file for ' +
        'cost left a sibling behind. Add them to HEAVY_UNIT_FILES in scripts/heavy-tests.mjs, or, ' +
        'if the file genuinely is not the family (see -helping), narrow the glob and say why.',
    ).toEqual([])
  })

  it('⚠ ...and every declared family still names more than one file – a rotted glob guards nothing', () => {
    // ⚠⚠ THE ANTI-VACUOUS HALF, and this file has already been bitten by the absence of one: the sim
    // rules above spent nineteen days being kept by `test:all` alone because a `length > 0` check was
    // satisfied by one accidental survivor. A family glob that matches ZERO files after a rename
    // would pass the assertion above in silence, and a glob matching ONE file is not a family – it is
    // a single entry that would be plainer written into the list.
    expect(HEAVY_UNIT_FAMILIES.length, 'no families are declared, so the rule above checks nothing').toBeGreaterThan(0)
    const thin = HEAVY_UNIT_FAMILIES.map((glob) => ({ glob, members: familyMembers(glob) })).filter(
      ({ members }) => members.length < 2,
    )
    expect(
      thin.map(({ glob, members }) => `${glob} -> ${members.length} file(s)`),
      'these globs no longer describe a family: either a cut was renamed out from under them, or ' +
        'the family shrank back to one file and the glob should go with it',
    ).toEqual([])
  })
})

// =================================================================================================
// A GATE ON THE PER-TEST BUDGET – T5.3 · H-06 (27.09).
//
// ⚠⚠ WHY A NUMBER IN A TEST FILE CAN DEFEAT THE POOL IT RUNS IN. `vite.config.ts`'s unit project sets
// `testTimeout: 60_000` and states the reason at the declaration: birpc's own RPC window is a hard,
// unraisable 60 s, so a per-test budget ABOVE it can never actually be spent by a test. What it does
// instead is convert a readable «Test timed out in 60000ms» into an opaque
// `Timeout calling "onTaskUpdate"` stall with EVERY TEST GREEN – the signature `scripts/lib/stall.mjs`
// retries and CLAUDE.md spends a paragraph on, and the one the coach-travel-edge family has produced
// on the runner five times. So the override buys nothing and hides the thing it looks like it is
// protecting against. A test that genuinely needs longer belongs in the heavy pool (H-05) or needs a
// cut; it does not need a bigger number.
//
// ⚠ A HOOK IS NOT BOUND BY THE WINDOW AND KEEPS ITS OWN BUDGET. `beforeAll` is not reported per test,
// so it never crosses an RPC boundary the way a test does. `tests/round34-reachable-ceiling.test.ts` is
// the case in the corpus – 120 s, deliberately, with its own dated note recording the 16.58 s idle
// measurement and the above-3.1x two-core factor behind it. ⚠ No line number is cited on purpose: the
// first draft of this block said `:505`, and adding the pointer note in that file moved the hook to
// :518 within the hour. That file names this dependency at the budget itself, which is where it cannot
// drift. This gate therefore classifies every budget
// it finds as test-level or hook-level and rules only on the first kind. Getting that wrong in the
// permissive direction would let a real override through; getting it wrong in the strict direction
// would redden a legitimately slow hook. Both branches are covered by the fixture case below.
//
// ⚠⚠ THE 78 OVERRIDES THIS GATE LOCKS OUT, AND THE MEASUREMENT UNDER THEM – because a clamp without one
// is a policy, and a policy that reddens a legitimately slow file on a contended runner has replaced a
// documented number with a flake. 78 test-level budgets in 31 bulk-pool files, from 90 s to 900 s, came
// down to 60 s on 27.09 and were then DELETED, together with the 18 in those same files that already sat
// at 60 s: a budget equal to the project default states nothing, and a constant restated where it cannot
// follow its source is the failure this wave has been removing – move this ceiling to 90 s and every one
// of those files would have silently stayed at 60. 96 declarations gone from 31 files; a budget BELOW the
// ceiling says something and stays (four remain in those files, all at 30 s). All 31 were run at once in the real bulk pool first (ten cores shared, 1-min
// load 2.12 at the start, JSON reporter, per-test durations): the SLOWEST TEST IN THE WHOLE SET IS
// 16.00 s (`coach-load`), second 14.44 s (`plan`), third 9.35 s (`ending`), and 25 of the 31 are under
// 5 s. The two slowest were then read SOLO, twice, on a quiet machine (1-min load 2.21-2.58):
// coach-load 8.89 / 9.23 s, plan 8.18 / 8.25 s – so this machine's bulk pool costs about 1.75x.
//
// The headroom is stated at the STRICTEST factor on record rather than the friendliest: round34's note
// measured the two-core shared pool at ABOVE 3.1x an idle ten-core reading. 9.23 s x 3.1 = 28.6 s,
// which leaves the worst file in the set 31 s of margin (2.1x) under the ceiling; every other file is
// under 9.35 s in the pool and so under 29 s on the runner. Nothing in the set needed promoting, so
// `scripts/heavy-tests.mjs` was not touched.
//
// ⚠ MUTATION-VERIFIED (27.09), and both arms are quoted in the T5.3 report: restoring ONE real budget
// (`tests/coach-load.test.ts`, 60_000 -> 240_000) reddens the corpus case naming that file and line.
//
// ⚠ THE PARSER IS TESTED ON A FIXTURE, NOT ONLY ON THE CORPUS, and that is deliberate. A corpus check
// alone is vacuous the moment the parser stops matching – it would find zero budgets and pass – which
// is the same hole the sim rules above spent nineteen days in. So the fixture states known inputs with
// known answers, and the corpus case then uses a parser the fixture has proven.

/** The project's own ceiling for a per-TEST budget, from `vite.config.ts`'s unit project. */
const TEST_BUDGET_CEILING_MS = 60_000

/** The four textual forms a budget is written in here, as the corpus actually writes them:
 *  `vi.setConfig({ testTimeout: N })`, `hookTimeout: N`, an `it(..., { timeout: N }, fn)` option, and
 *  the trailing positional `}, N)`. */
const BUDGET = /(testTimeout|hookTimeout|timeout)\s*:\s*([0-9_]+)|\},\s*([0-9_]{5,})\s*\)/g
const HOOK_NAME = /\b(beforeAll|afterAll|beforeEach|afterEach)\b/

interface Budget {
  line: number
  ms: number
  /** `test` is bound by birpc's window; `hook` is not. */
  kind: 'test' | 'hook'
}

/**
 * Every budget declaration in `source`, with the line it sits on and whether it binds a test or a hook.
 *
 * A trailing `}, N)` belongs to whichever call it closes, so the classifier finds that call by MATCHING
 * THE PARENTHESIS – counting `)` against `(` backwards from the budget until the depth returns to zero –
 * and reads the opener's line for `it(` / `test(` (a test budget) or a hook name (a hook budget).
 * `testTimeout` and `hookTimeout` name themselves and need no walk.
 *
 * ⚠⚠ IT USED TO WALK BACK AT MOST 80 LINES AND DEFAULT TO `test`, AND THAT WAS WRONG IN THE ONE
 * DIRECTION THAT COSTS SOMETHING. `tests/save-doors-fuzz.test.ts` opens a `beforeAll` at line 561 and
 * closes it with `}, 60_000)` at line 675 – **114 lines**, past the window – so the old classifier
 * reported that hook's budget as a TEST budget. The 80-line default was chosen as «the strict direction,
 * safe for a ceiling», and for FLAGGING it is: a human dismisses a false violation. But T5.3's second
 * pass then used this same classifier to decide which declarations to DELETE, and under that use the
 * same default says «delete a hook budget that its own note measured as necessary» – vitest's default
 * `hookTimeout` is 10 s, that hook needs ~3 s solo and `unit-bulk`'s multiplier is at least 3.1x, which
 * is exactly on the wall. It was caught by reading the one site whose indentation looked odd, one command
 * before the deletion ran. ⭐ The lesson is not «widen the window»: a heuristic that is safe for one use
 * of a parser is not safe for another, and the fix is to stop guessing – the parenthesis is exact.
 */
/**
 * Which call a trailing `}, N)` closes – `test` or `hook` – by matching its parenthesis.
 *
 * Walks backwards character by character from the budget, `)` deepening and `(` unwinding, and reads the
 * line holding the `(` that brought the depth back to zero. ⚠ It defaults to `test` only when no opener
 * is found at all (a syntactically impossible file), never as a distance cut-off – see `budgetsIn`.
 */
function enclosingCallKind(lines: string[], lineIndex: number, matchEnd: number): Budget['kind'] {
  let depth = 0
  for (let i = lineIndex; i >= 0; i--) {
    // ⚠ THE SLICE MUST INCLUDE THE MATCH'S OWN `)`, which is the whole point: that paren is the one
    // being matched. The first draft sliced up to the `}` instead and the depth never returned to zero,
    // so every budget came back `test` – the fixture case caught it on the first run.
    const upTo = i === lineIndex ? lines[i].slice(0, matchEnd) : lines[i]
    for (let c = upTo.length - 1; c >= 0; c--) {
      if (upTo[c] === ')') depth++
      else if (upTo[c] === '(') {
        depth--
        if (depth === 0) {
          const opener = lines[i].slice(0, c)
          if (HOOK_NAME.test(opener)) return 'hook'
          if (/\b(it|test)(\.\w+)?\s*$/.test(opener)) return 'test'
          // `describe(…, N)` and anything else that takes a budget is bound by the test window too.
          return 'test'
        }
      }
    }
  }
  return 'test'
}

function budgetsIn(source: string): Budget[] {
  const lines = source.split('\n')
  const found: Budget[] = []
  for (let i = 0; i < lines.length; i++) {
    // ⚠⚠ PROSE IS NOT A DECLARATION, and this gate found that out on its own corpus. Its header quotes
    // «`testTimeout: 60_000`» when explaining the ceiling, and the first version of this parser read
    // that sentence as a budget. At 60 s it was harmless; a note explaining a 300 s override that USED
    // to be here would have reddened the gate on a comment. This corner matters more here than in most
    // parsers, because every one of T5.3's 31 dated notes quotes the thing it removed – the fix and the
    // hazard arrived in the same commit. So: a whole-line comment is skipped, and a match that starts
    // after a `//` on its own line is skipped. Budgets are never written inside strings in this corpus,
    // which is what makes the cheap test sound.
    if (/^\s*(\/\/|\*|\/\*)/.test(lines[i])) continue
    const commentAt = lines[i].indexOf('//')
    for (const m of lines[i].matchAll(BUDGET)) {
      if (commentAt >= 0 && (m.index ?? 0) > commentAt) continue
      const ms = Number((m[2] || m[3]).replace(/_/g, ''))
      if (m[1] === 'hookTimeout') {
        found.push({ line: i + 1, ms, kind: 'hook' })
        continue
      }
      if (m[1] === 'testTimeout') {
        found.push({ line: i + 1, ms, kind: 'test' })
        continue
      }
      if (m[1] === 'timeout') {
        // The OPTIONS-OBJECT form, `it(name, { timeout: N }, fn)`. It is always a test budget: vitest
        // gives a hook a positional timeout only (`beforeAll(fn, N)`), so `{ timeout }` cannot be one.
        found.push({ line: i + 1, ms, kind: 'test' })
        continue
      }
      found.push({ line: i + 1, ms, kind: enclosingCallKind(lines, i, (m.index ?? 0) + m[0].length) })
    }
  }
  return found
}

/** The unit files that share the bulk pool: not heavy, and – `readdirSync` being non-recursive – never
 *  a mounted `tests/component/` test. The DIRECTORY and not a list, for H-03's reason: what runs is
 *  what is on disk. */
function bulkPoolUnitFiles(): string[] {
  const heavy = new Set([...HEAVY_UNIT_FILES, ...HEAVY_SIM_FILES].map((f) => f.replace(/^\.\//, '')))
  return readdirSync(fileURLToPath(new URL('../tests/', import.meta.url)))
    .filter((f) => f.endsWith('.test.ts'))
    .map((f) => `tests/${f}`)
    .filter((f) => !heavy.has(f))
    .sort()
}

const budgetsOf = (path: string): Budget[] =>
  budgetsIn(readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8'))

describe('no bulk-pool test declares a budget above birpc’s window', () => {
  it('the parser reads all four forms and tells a test budget from a hook budget', () => {
    // ⚠ KNOWN INPUTS, KNOWN ANSWERS – so the corpus case below cannot pass by finding nothing.
    //
    // ⚠⚠ EVERY NUMBER IS INTERPOLATED, AND THE FIRST RUN OF THIS GATE IS WHY. Written as plain
    // literals these twelve lines ARE budget declarations in this file's own source, and this file is
    // itself a bulk-pool unit file – so the corpus case read its own fixture and went red naming three
    // «violations» at these very lines. Excluding this file from the sweep would have fixed the symptom
    // and opened a hole: nobody could then park a 900 s budget here. Interpolating keeps the file under
    // its own rule instead. A `$` after the colon means the parser does not match the SOURCE, while the
    // string it is HANDED still reads the budget, and the assertion is on the parsed result – so
    // nothing about the test is weakened.
    const fixture = [
      `vi.setConfig({ testTimeout: ${300_000} })`, //  1 – test, names itself
      `vi.setConfig({ hookTimeout: ${300_000} })`, //  2 – hook, names itself
      `it('a', { timeout: ${900_000} }, () => {`, //   3 – test, an option object
      `})`,
      `it('b', () => {`, //                            5
      `  expect(1).toBe(1)`,
      `}, ${240_000})`, //                             7 – test, trailing positional
      `beforeAll(() => {`, //                          8
      `  build()`,
      `}, ${120_000})`, //                            10 – HOOK, trailing positional
      `it('c', () => {`, //                            11
      `}, ${30_000})`, //                             12 – test, under the ceiling
      `// it was once vi.setConfig({ testTimeout: ${900_000} }) – PROSE, not a declaration`, // 13
      `  * a JSDoc line naming timeout: ${900_000} is prose too`, //                            14
      `it('d', () => {}) // this trailing comment names }, ${900_000}) and is still prose`, //  15
    ].join('\n')
    expect(budgetsIn(fixture), 'every form, with its line and its kind – and no prose').toEqual([
      { line: 1, ms: 300_000, kind: 'test' },
      { line: 2, ms: 300_000, kind: 'hook' },
      { line: 3, ms: 900_000, kind: 'test' },
      { line: 7, ms: 240_000, kind: 'test' },
      { line: 10, ms: 120_000, kind: 'hook' },
      { line: 12, ms: 30_000, kind: 'test' },
      // lines 13-15 contribute NOTHING: a whole-line `//`, a JSDoc `*` line, and a trailing comment.
      // Every one of T5.3's 31 dated notes is shaped like line 13, so this is not a hypothetical.
    ])
  })

  it('⚠⚠ a hook budget is a hook budget however far its body runs – the 114-line regression', () => {
    // ⚠⚠ THE CASE THE OLD 80-LINE WINDOW GOT WRONG, generated rather than transcribed so it cannot rot.
    // `tests/save-doors-fuzz.test.ts` opens a `beforeAll` at 561 and closes it with `}, 60_000)` at 675 –
    // 114 lines – and the window classified that hook's budget as a TEST budget. Harmless while the gate
    // only FLAGS; lethal the moment the same parser decides what to DELETE, which is what T5.3's second
    // pass asked it to do. So distance is pinned here: the answer must not depend on how long the body is.
    const filler = Array.from({ length: 120 }, (_, k) => `  step(${k})`).join('\n')
    expect(budgetsIn(`beforeAll(async () => {\n${filler}\n}, ${90_000})`), 'a 120-line hook').toEqual([
      { line: 122, ms: 90_000, kind: 'hook' },
    ])
    expect(budgetsIn(`it('slow', async () => {\n${filler}\n}, ${90_000})`), 'a 120-line test').toEqual([
      { line: 122, ms: 90_000, kind: 'test' },
    ])
  })

  it('⭐⭐⭐ no bulk-pool file declares a per-TEST budget over the ceiling', () => {
    const over = bulkPoolUnitFiles().flatMap((path) =>
      budgetsOf(path)
        .filter((b) => b.kind === 'test' && b.ms > TEST_BUDGET_CEILING_MS)
        .map((b) => `${path}:${b.line}  ${b.ms / 1000} s`),
    )
    expect(
      over,
      `these declare a per-test budget above ${TEST_BUDGET_CEILING_MS / 1000} s, which birpc's window ` +
        'means no test can ever spend: it only turns a readable timeout into an opaque ' +
        '`Timeout calling "onTaskUpdate"` stall with every test green. Lower it to the ceiling and, if ' +
        'the test really needs longer, promote the file in scripts/heavy-tests.mjs or cut it – with a ' +
        'measurement, the way T5.3 did',
    ).toEqual([])
  })

  it('⚠ ...and the classifier’s hook branch is live on the real corpus, not only on the fixture', () => {
    // ⚠⚠ THE ANTI-VACUITY RESTS ON THE FIXTURE ABOVE, DELIBERATELY, AND THIS IS THE RE-ANCHORING NOTE
    // (27.09, second pass). The first version of this case asserted «over 50 test budgets sit AT the
    // ceiling», which was true the hour it was written – the 78 clamps – and was the wrong shape twice
    // over. It read as a claim about the corpus's CONTENT when the rule is about a CEILING, and it
    // would have gone red on a future wave doing legitimate work: the very next step of T5.3 deleted
    // those 78 (a budget equal to the project default states nothing and cannot follow it if the
    // ceiling moves), and the assertion would have failed on the improvement.
    //
    // The real claim – «no test-level budget exceeds the ceiling» – needs NO declaration to exist, so
    // its emptiness must be proven somewhere that cannot be emptied by ordinary work. That is the
    // fixture case above: known inputs, known answers, every form and both branches. What is left for
    // the corpus is the one thing a fixture cannot show – that the `hook` branch fires on REAL source,
    // which is what stops a legal `beforeAll` budget being judged as a test budget.
    const all = bulkPoolUnitFiles().flatMap(budgetsOf)
    expect(
      all.filter((b) => b.kind === 'hook').length,
      'the classifier never returns `hook` on the real corpus, so its hook branch is dead here and a ' +
        'legal hook budget would be judged as a test budget – see the pointer in ' +
        'tests/round34-reachable-ceiling.test.ts, which holds the only hook budget above the ceiling',
    ).toBeGreaterThan(0)
  })
})
