// =================================================================================================
// B-07 · THE LIFE LAYER'S SUB-STREAM KEY INVENTORY – THE EXACT SET, NOT A PREFIX ALLOWLIST
// (T3.9 of docs/plans/principles-fix-builder-2026-09.md; the finding is B-07 in
//  docs/review-principles-2026-09-26/02-engine-core.md, with B-P3-12 folded in as the plan names it)
// =================================================================================================
//
// WHAT WAS MISSING AND WHY IT MATTERED. `world/lifeBeat.ts` holds more `rngFromSeed` call sites than
// any other file in the engine – twenty – and it was the one module of its size with no key pin at
// all. Seven modules already have one (`tests/knock.test.ts:268` is the model, with `kidLife`,
// `match-retirement`, `offers`, `preview`, `radar-read` and `redesign-home`), so the device was
// house-standard and this file simply had no share of it.
//
// ⚠⚠ THE MEASURED HAZARD, AND IT IS A **SILENT RE-DEAL** RATHER THAN A CRASH. CLAUDE.md's invariant 2
// makes a sub-stream key part of the career: `rngFromSeed` is re-derived at the call site and persists
// nothing, so the key IS the stream. Rename one and every existing career's deaths, losses and
// conception windows are re-dealt from a different sequence – and NOTHING goes red. The review ran it:
// `life:loss` -> `life:bereavement` in a scratch worktree left `tests/wave11-bereavement.test.ts` at
// 14 of 14 green, because that suite finds its deaths «on the engine's own dice» and any key yields
// some deaths. The frozen MAIN capture (41550 / `e6b0c709`) cannot see a sub-stream either, by
// construction. Three keys had no test naming them anywhere: `life:loss`, `life:pregnancy-loss` and
// `life:window`; B-P3-12 found the same gap one file over in `album:flavour:patch` (the childhood
// club's name, assembled on demand from the seed – a renamed key silently renames her club in every
// career's album) and a single mention for `:rubbers:`. All five are named below.
//
// ⚠ AND THE REVIEW'S OTHER HALF IS **REFUSED ON PRICE**, which is why this file is a pin and not a
// refactor: a shared roll primitive saves about one line at each of eight sites – 8 of the file's
// ~1,969 code lines – and either takes the whole key (no gain) or composes it from a kind, which is a
// new way to write `life:bereavement` by accident. `life:loss` deliberately does NOT match its
// function's name (`lifeBeat.ts` §3l's own note). If a primitive is ever wanted it lands AFTER this
// pin and takes the literal key, so identity is proven by this file plus the counts below.
//
// ⚠⚠ THE EXACT SET AND NOT A PREFIX ALLOWLIST – the one place this parts from its seven siblings, and
// it is B-07's verification nuance made mechanical. `knock.test.ts:268` asserts every key MATCHES
// `^\$\{…\}:(knock|knockread):`, which a renamed `:knock:<thing>:` passes. A renamed key is exactly
// the failure this file exists to catch, so the assertion is set equality against the literals.
// The cost is honest and small: a harmless rename of a LOCAL variable inside a `${…}` goes red here
// and is re-aimed in one reviewed line. That is the ratchet working, not a false positive.
//
// ⚠ SCOPE: THE WHOLE MODULE SET, AND DELIBERATELY NO REGION CUT. The claim is «these are the keys
// this module draws on», which is a claim about the file and not about a span – so there is no marker
// to rot and nothing that can silently widen (CLAUDE.md's `indexOf`/`slice` gotcha). It reads the
// source through `tests/worldSource.ts`' `engineModuleSource`, which is `<name>.ts` PLUS every
// `<name>/*.ts` part: T6.8 is going to split `lifeBeat.ts`, and this pin must survive that split
// without an edit – the whole reason that helper exists.
//
// ⚠ COMMENTS ARE STRIPPED FIRST, and this file is a reason the house has two strippers. `lifeBeat.ts`
// quotes a key VERBATIM in prose at `:5765` («`rngFromSeed(\`${seed}:smalltalk:frame:${week}\`)` –
// never MAIN, invariant 2», carried in the owner's own spelling), so a sweep over raw source would
// count that mention as a twenty-first key. `scriptCodeOf` is the right one of the two: these are
// `.ts` sources and no `<!-- -->` strip is wanted.
//
// MUTATION-VERIFIED (the arm named in the plan): `life:loss` -> `life:bereavement` in
// `world/lifeBeat.ts:8077`. Both outputs are in the wave's report; the same arm leaves
// `tests/wave11-bereavement.test.ts` green, which is the finding reproduced rather than quoted.
import { describe, expect, it } from 'vitest'
import { engineModuleSource } from './worldSource'
import { scriptCodeOf } from './helpers/source'

/** The module's source with the prose taken out – see the header on why the strip is not optional. */
function codeOf(module: string): string {
  return scriptCodeOf(engineModuleSource(module))
}

/** Every `rngFromSeed(\`…\`)` template in one module set, in source order. */
function keysOf(module: string): string[] {
  return [...codeOf(module).matchAll(/rngFromSeed\(`([^`]+)`\)/g)].map((m) => m[1])
}

/** How many times `rngFromSeed` is CALLED at all – the control for the extractor above. A call whose
 *  key is not a template literal would be invisible to `keysOf`, and invisible is how a stream gets
 *  added without anybody reading this file. */
function callCountOf(module: string): number {
  return (codeOf(module).match(/rngFromSeed\(/g) ?? []).length
}

// =================================================================================================
// THE INVENTORY – transcribed from the tree at `e921eae5` and asserted as a SET.
// =================================================================================================
//
// ⚠ A ROW LEAVES THIS TABLE ONLY WITH THE STREAM IT NAMES. Adding one is adding a stream to every
// career; changing one re-deals an existing career. Either way the person doing it has read this.

/** `world/lifeBeat.ts` – twenty keys, four shapes, and two of them are deliberately not `life:`. */
const LIFE_BEAT_KEYS: readonly string[] = [
  '${seed}:life:fork:${seasonIndex}',
  // ⚠ NOT `life:` – the frame pool's spec names the key in full and the spelling is the owner's
  // document's, carried rather than tidied (`drawSmallTalkFrame`'s own note, round 44).
  '${world.seed}:smalltalk:frame:${world.week}',
  // ⚠ NOT `life:` either – the psychologist's listen is his channel, not hers.
  '${seed}:psy:listen:${kind}:${week}',
  '${seed}:life:ends:${endedWeek}:react',
  '${seed}:life:partner:${sinceWeek}:wants',
  '${seed}:life:partner:${sinceWeek}:lag',
  '${world.seed}:life:arrival:${world.week}',
  '${world.seed}:life:smalltalk:${world.week}',
  '${world.seed}:life:smalltalk:situation:${world.week}',
  '${seed}:life:smalltalk:subject:${week}',
  '${world.seed}:life:ends:${world.week}',
  '${world.seed}:life:leak:${episode.id}:${world.week}',
  '${world.seed}:life:leak:story:${episode.id}:${world.week}',
  '${world.seed}:life:wedding:${world.week}',
  '${seed}:life:partner-name:${episodeId}',
  '${world.seed}:life:spouse-view:${world.week}',
  // ⚠ B-07's first unpinned key – the hidden conception window, drawn once and persisted.
  '${seed}:life:window:${conceivedWeek}',
  '${world.seed}:life:pregnancy:${world.week}',
  // ⚠ B-07's second unpinned key.
  '${world.seed}:life:pregnancy-loss:${pregnancy.conceivedWeek}:${world.week}',
  // ⚠⚠ B-07's third, and the one the mutation was run on: `life:loss` for the BEREAVEMENT roll, not
  // `life:bereavement`. The mismatch with its function's name is on purpose (§3l).
  '${world.seed}:life:loss:${world.week}',
]

/** `world/albumBook.ts` – B-P3-12's pair. The album is assembled on demand from the seed, so a
 *  renamed key here renames her childhood club in every career that already exists. */
const ALBUM_BOOK_KEYS: readonly string[] = [
  '${seed}:album:flavour:${sheetId}',
  // ⚠ B-P3-12's unpinned key.
  '${seed}:album:flavour:patch',
]

/** `world/college.ts` – four keys; `:rubbers:` had exactly one mention anywhere (B-P3-12). */
const COLLEGE_KEYS: readonly string[] = [
  '${world.seed}:collegeoffer:${world.week}',
  '${world.seed}:callup:${week}',
  // ⚠ B-P3-12's thinly-pinned key.
  '${world.seed}:rubbers:${world.week}',
  '${world.seed}:collegeleague:${world.week}',
]

const INVENTORY: readonly [string, readonly string[]][] = [
  ['world/lifeBeat', LIFE_BEAT_KEYS],
  ['world/albumBook', ALBUM_BOOK_KEYS],
  ['world/college', COLLEGE_KEYS],
]

/** The namespaces the three modules are allowed to draw on – the prefix half the seven sibling pins
 *  carry, kept as well as the set equality because it says WHY a new key is suspicious rather than
 *  only that it is new. */
const NAMESPACES = /^\$\{(?:world\.|view\.)?seed\}:(life|smalltalk|psy|album|collegeoffer|callup|rubbers|collegeleague):/

describe('B-07 – the life layer\'s sub-stream keys are an exact, closed inventory', () => {
  for (const [module, expected] of INVENTORY) {
    it(`⭐⭐⭐ ${module}: exactly these ${expected.length} keys, character for character`, () => {
      const keys = keysOf(module)
      // ⚠ THE FLOOR FIRST: an extractor that found nothing passes every set comparison against an
      // empty expectation, and that is how eight dead tests died in this repo's wave 3.
      expect(keys.length, 'the extractor found this module\'s draws at all').toBeGreaterThan(0)
      // ⚠ SORTED, SO A REORDER OF CALL SITES IS NOT A FINDING. Duplicates survive the sort, so two
      // sites sharing one key would still be visible here as two rows.
      expect([...keys].sort(), `${module}: the key set moved`).toEqual([...expected].sort())
    })

    it(`${module}: every key is seed-scoped and in a known namespace`, () => {
      for (const key of keysOf(module)) {
        expect(key, `unexpected sub-stream namespace: ${key}`).toMatch(NAMESPACES)
      }
    })

    it(`⚠ ${module}: no draw hides behind a non-template key`, () => {
      // The control for `keysOf`. `rngFromSeed(someString)` draws on a key this file cannot read, so
      // it would be a stream added without anybody passing through this inventory. Today every call
      // site in all three modules is a template literal, and this is what keeps that true.
      expect(callCountOf(module), `${module}: rngFromSeed calls vs template keys`).toBe(keysOf(module).length)
    })

    it(`⚠ ${module}: no Math.random anywhere (invariant 2)`, () => {
      expect(codeOf(module)).not.toContain('Math.random')
    })
  }

  it('⭐⭐ the five keys no test named before today are named here', () => {
    // ⚠ B-07's and B-P3-12's own evidence, turned into an assertion so a future re-aim of the table
    // above cannot quietly drop the rows the findings were about. `git grep -l <key> -- tests` was 0
    // for the first three and 1 for `:rubbers:` on 26.09.
    const all = INVENTORY.flatMap(([module]) => keysOf(module))
    for (const key of [
      '${world.seed}:life:loss:${world.week}',
      '${world.seed}:life:pregnancy-loss:${pregnancy.conceivedWeek}:${world.week}',
      '${seed}:life:window:${conceivedWeek}',
      '${seed}:album:flavour:patch',
      '${world.seed}:rubbers:${world.week}',
    ]) {
      expect(all, `the finding's own key is no longer in the tree: ${key}`).toContain(key)
    }
  })

  it('the three modules together draw on 26 keys – the number one place, here', () => {
    // ⚠ NOT IN PROSE (wave 9's finding: a count in a document survives a full gate because no test
    // reads it). The per-module sets above are the real pin; this is the one line a reader can check
    // against a `git grep -c rngFromSeed`.
    expect(INVENTORY.reduce((n, [, keys]) => n + keys.length, 0)).toBe(26)
    expect(INVENTORY.flatMap(([module]) => keysOf(module))).toHaveLength(26)
  })
})
