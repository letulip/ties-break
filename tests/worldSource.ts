// THE ENGINE'S WORLD SOURCE, as one string – for the source-pin tests that assert on structure
// ("exactly one payout function exists", "both surfaces call the same helper") rather than on
// behaviour.
//
// ⚠ WHY THIS EXISTS. Those tests used to read `src/engine/world.ts` directly. That file is being
// decomposed into `src/engine/world/*.ts` (docs/review/proposals/P4-world-decomposition.md), so a
// pin against the single file breaks the moment a concern moves out – and it breaks SILENTLY in the
// worst case: `world.slice(indexOf(a), indexOf(b))` with a departed end marker returns -1 and
// swallows the rest of the file, which is how a "must not contain amountCents" assertion started
// reading someone else's function. Reading the whole module set keeps the invariant honest and
// location-independent, so the remaining extractions need no test edits.
//
// ⚠⚠ AND THAT LAST SENTENCE WAS FALSE FOR ELEVEN DAYS – T6.9, 28.09. IT IS CORRECTED BY THE CODE
// BELOW RATHER THAN BY REWORDING IT, because the promise was the right one; the reader was not.
//
// `readdirSync(...).filter(f => f.endsWith('.ts'))` DOES NOT RECURSE. T6.8 created
// `src/engine/world/lifeBeat/` with thirteen kind modules, and from that commit `worldSource()`
// returned 63 of the module set's 77 files while still calling itself "the whole module set" – so the
// sentence above stopped being true of a PACKAGE the moment the decomposition P4 describes grew one.
// «Location-independent» meant «independent of WHICH FILE», never «independent of how deep», and
// nothing said so.
//
// IT BROKE A REAL GUARD, MEASURED BOTH WAYS. `tests/wave5-psy-counsel.test.ts`' «no new
// `type: 'life'` write site anywhere in the engine» counted 8 sites before the leak section moved and
// 7 after: the write site had not gone anywhere, the SWEEP had. Through `engineSource()` it is 8. And
// `tests/life-beat-keys.test.ts` – T3.9's inventory against CLAUDE.md invariant 2's silent re-deal –
// reads `engineModuleSource('world/lifeBeat')`, which had the identical flat read: a module at
// `world/lifeBeat/copy/<kind>.ts` holding a `rngFromSeed` key left that file GREEN with the key
// nowhere in its inventory (armed by hand, both outputs in T6.9's report).
//
// ⚠ SO BOTH READERS RECURSE, THROUGH ONE WALKER (`tsTree`) SHARED WITH `engineSource()` BELOW. Three
// copies of the same directory read is how the two halves drifted apart in the first place – the
// layer reader recursed from the day it was written and the module readers never did. Recursion can
// only ADD text, so no POSITIVE pin can lose a claim; the direction that needs care is a NEGATIVE one
// («the world module set contains no X»), which gets STRICTER. Every consumer was run and triaged
// file by file when this landed – see T6.9's report – and a pin that turned out to be about the HUB
// specifically gets a narrower reader rather than a widened sentence.
import { readFileSync, readdirSync } from 'node:fs'

const ROOT = new URL('../src/engine/', import.meta.url)

/** Every `.ts` under `dir`, RECURSIVELY, each preceded by a `// ==== src/engine/<path> ====` marker.
 *  Sorted at every level, so the concatenation is stable and a package's files sit at the point their
 *  directory name sorts to. ⚠ THE ONE DIRECTORY WALK IN THIS FILE – see the header on why. */
function tsTree(dir: URL, prefix: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) out.push(...tsTree(new URL(`${entry.name}/`, dir), `${prefix}${entry.name}/`))
    else if (entry.name.endsWith('.ts')) {
      out.push(`\n// ==== src/engine/${prefix}${entry.name} ====\n` + readFileSync(new URL(entry.name, dir), 'utf8'))
    }
  }
  return out
}

/** world.ts followed by every `world/**\/*.ts` part, concatenated with a marker between files. */
export function worldSource(): string {
  const main = readFileSync(new URL('world.ts', ROOT), 'utf8')
  return main + tsTree(new URL('world/', ROOT), 'world/').join('')
}

/** The source of one top-level function, wherever in the world module set it now lives.
 *  ⚠ THROWS when the function is absent – see `moduleFunction` at the foot of this file. */
export function worldFunction(name: string): string {
  return moduleFunction(worldSource(), name, 'the world module set (world.ts + world/*.ts)')
}

// -------------------------------------------------------------------------------------------------
// ⚠ GENERALISED WHEN THE SECOND MODULE STARTED MOVING. `diary.ts` is now being decomposed into
// `src/engine/diary/*.ts` the same way world.ts was, and it broke a source pin the same way on its
// very first extraction (`resultShowsOnHerFace(e)` left diary.ts for diary/facts.ts). Rather than
// copy this file, the reader below takes the module name - so the third decomposition needs no new
// helper and no test edits.
// -------------------------------------------------------------------------------------------------

/** `<name>.ts` followed by every `<name>/**\/*.ts` part, concatenated with a marker between files.
 *  ⚠ RECURSIVE SINCE T6.9 (28.09) – it was flat, and the header says what that cost. */
export function engineModuleSource(name: string): string {
  const main = readFileSync(new URL(`${name}.ts`, ROOT), 'utf8')
  let parts: string[] = []
  try {
    parts = tsTree(new URL(`${name}/`, ROOT), `${name}/`)
  } catch {
    // no package directory yet - the module has not been decomposed, which is not an error
  }
  return main + parts.join('')
}

/** The source of one top-level function anywhere in a named engine module set.
 *  ⚠ THROWS when the function is absent – see `moduleFunction` at the foot of this file. */
export function engineModuleFunction(module: string, name: string): string {
  return moduleFunction(engineModuleSource(module), name, `src/engine/${module}.ts + ${module}/*.ts`)
}

/** diary.ts + every diary/*.ts part.
 *  ⚠ T6.9, 28.09: this one carried the flat read only BY DELEGATION – it has always been
 *  `engineModuleSource('diary')` and nothing else, so fixing that reader fixed this one, and there is
 *  no second copy of the walk here to drift. `src/engine/diary/` is flat today; it no longer has to
 *  stay that way for the pins over it to be honest. */
export function diarySource(): string {
  return engineModuleSource('diary')
}

// -------------------------------------------------------------------------------------------------
// ⚠⚠ AND THE SAME HOLE ARRIVED IN A THIRD SHAPE – A HOME SPELLED IN A DOCUMENT (T6.9, 28.09).
// -------------------------------------------------------------------------------------------------
//
// The strings-roundtrip files pin «the document's row and the shipped string are one corpus» by
// reading a HOME out of the table – a path the document itself spells – and asserting containment
// against that file. T6.8 moved the life-beat copy sections into `world/lifeBeat/<kind>Copy.ts`, and
// both tables' homes still say `src/engine/world/lifeBeat.ts`, so two files went RED on the branch
// head with the string still shipping, unmoved, one directory deeper:
//
//     W9: src/engine/world/lifeBeat.ts contains the row's text: expected false to be true
//     P1: src/engine/world/lifeBeat.ts does not contain the row's text: expected false to be true
//
// ⚠ THE DOCUMENTS ARE NOT EDITED TO SILENCE THEM. They are the wave-10/11 and wave-12 records of
// what shipped, and rewriting a record so an instrument stops failing is the wrong direction of fix.
// The reader is what was wrong, exactly as it was for `worldSource()` above.
//
// ⚠⚠ AND THE TRADE IS STATED RATHER THAN SLIPPED IN, because it IS a loss of precision: the claim
// moves from «this string lives in this FILE» to «this string lives in this MODULE SET». A row can no
// longer tell you which of a package's files holds its words. That is the same trade CLAUDE.md's own
// gotcha already made for every source pin – «read it through `tests/worldSource.ts` … rather than
// pinning a path» – and it is the honest one here, because the property the tables are for is «the
// document and the code say the same thing», which a file boundary was never part of.

const REPO = new URL('../', import.meta.url)

/** A source-pin HOME as a DOCUMENT spells it, repo-root relative, resolved the way CLAUDE.md's
 *  gotcha prescribes: a path under `src/engine/` is read through its MODULE SET (`<module>.ts` plus
 *  its package, recursively), anything else is that file alone. ⚠ For a module with no package
 *  directory this is byte-for-byte the old single-file read, so it widens only where a split has
 *  actually happened – see the note above for the claim that is traded. */
export function homeSource(pathFromRepoRoot: string): string {
  const engineModule = /^src\/engine\/(.+)\.ts$/.exec(pathFromRepoRoot)
  if (engineModule) return engineModuleSource(engineModule[1])
  return readFileSync(new URL(pathFromRepoRoot, REPO), 'utf8')
}

// -------------------------------------------------------------------------------------------------
// ⚠⚠ AND A THIRD SCOPE, FOR THE LAWS THAT ARE ABOUT THE **LAYER** RATHER THAN ABOUT ONE MODULE –
// v77 T10, ruling T.
//
// THE FAILURE IT EXISTS TO STOP, and it was live for a day. `tests/wave4-life-row-stamp.test.ts`
// carries the law «no `type: 'life'` feed row leaves the engine without a `lifeKind`», and it swept
// `worldSource()` – world.ts plus world/*.ts. That is the scope of a MODULE, and the law is about a
// LAYER: wave 6's T3 wrote a life row in `src/engine/spirit.ts`, one directory over, and the pin
// could not see it. Not «did not»: COULD NOT. A guard whose scope is narrower than its sentence is
// the «unable to fail» family wearing a source pin's clothes, and this repo has now met that family
// twenty times.
//
// ⚠ WHY THE WHOLE DIRECTORY AND NOT A NAMED LIST OF TWO. A list of modules rots exactly the way the
// old scope rotted – the third module to write a life row is invisible again, and nothing goes red
// to say so. `readdirSync` recursing over `src/engine/` is total by construction, which is the same
// argument `worldSource()` itself makes one screen up about the decomposition.
// -------------------------------------------------------------------------------------------------

/** EVERY `.ts` under `src/engine/`, recursively, with a marker before each file – for laws that are
 *  about the engine LAYER rather than about one module. Sorted, so the concatenation is stable.
 *  ⚠ POSITIVE AND NEGATIVE claims are both honest against it: it is the whole layer, not a sample.
 *  ⚠ T6.9, 28.09: its private `read` was lifted to `tsTree` at the top of this file, byte for byte,
 *  and the two module readers now share it. This reader recursed from the day it was written and they
 *  did not, which is exactly the drift one copy of the walk prevents. Output byte-identical
 *  (6,375,197 characters on the clean tree, measured across the change). */
export function engineSource(): string {
  return tsTree(ROOT, '').join('')
}

// -------------------------------------------------------------------------------------------------
// ⚠ AND THE SAME PROBLEM ARRIVED FOR COMPONENTS. Splitting a 2,300-line SFC means moving logic into
// `src/composables/*.ts`, and a pin that reads only the `.vue` then asserts against half a component.
// `componentSource` follows the SFC's own composable imports, so a pin keeps covering the whole
// thing however far the component is decomposed – the property `engineModuleSource` already has.
// -------------------------------------------------------------------------------------------------

const SRC = new URL('../src/', import.meta.url)

// ⚠ TWO NAMES, ON PURPOSE, AND THERE IS DELIBERATELY NO `componentSource`.
//
// The two questions a component pin can ask are NOT interchangeable, and the ambiguous name invited
// the wrong one. It cost a real failure the first time it was used: `screen-i-live-match`'s pin
// "MatchViewer imports no setter" started failing because the widened text now included
// matchDefaults.ts, where `setMatchSpeedDefault` is DEFINED – the assertion tripped on a definition
// it was never talking about. Documenting that was not enough; the name is the fix.
//
//   componentLogic()  – the SFC PLUS every composable it imports. Answers "this logic exists
//                       somewhere in the component". Survives extraction, which is the point.
//                       ⚠ POSITIVE ASSERTIONS ONLY. Never `.not.toContain` against it: widening the
//                       corpus makes a negative claim over-strict, and it will fail on a definition
//                       living in a composable. tests/pin-hygiene.test.ts enforces this.
//   componentFile()   – the .vue ALONE. Answers "this FILE itself does / does not ...", which is the
//                       only honest source for a negative claim about the component's own imports.

// ⚠⚠ `./composables/` COUNTS TOO, AND UNTIL WAVE B IT DID NOT – 07.09.
//
// The pattern used to require at least one `../`, which every component under `src/components/`
// writes. `src/App.vue` is the one SFC that sits at the ROOT of `src/`, so ITS composable imports are
// spelled `'./composables/x'` and NONE of them matched: `componentLogic('App.vue')` returned the SFC
// alone and was a silent synonym for `componentFile('App.vue')`.
//
// That is this repo's recurring failure shape – a search that quietly answers a different question –
// and it was about to be load-bearing: wave B moved four watchers out of the shell into
// `composables/tabSeen.ts`, and every pin re-aimed at `componentLogic` would have gone on reading a
// file the code had left, passing or failing for the wrong reason. Widening can only ADD text, so no
// positive pin can lose a claim; negative pins may not use this helper at all
// (`tests/pin-hygiene.test.ts` enforces that mechanically), so there is no direction in which this
// makes an assertion weaker. No caller named `App.vue` before today, so nothing else moves.
/** The SFC plus every `composables/*` module it imports. POSITIVE assertions only – see above. */
export function componentLogic(relFromSrc: string): string {
  const sfc = componentFile(relFromSrc)
  const parts: string[] = []
  for (const m of sfc.matchAll(/from '(?:\.\.?\/)+composables\/([A-Za-z0-9_]+)'/g)) {
    try {
      parts.push(`\n// ==== src/composables/${m[1]}.ts ====\n` + readFileSync(new URL(`composables/${m[1]}.ts`, SRC), 'utf8'))
    } catch {
      // a composable that is not a plain .ts file is simply not part of the pin
    }
  }
  return sfc + parts.join('')
}

/** The `.vue` file alone – the only honest source for a NEGATIVE claim about that file. */
export function componentFile(relFromSrc: string): string {
  return readFileSync(new URL(relFromSrc, SRC), 'utf8')
}

// =================================================================================================
// ⚠⚠ AN ABSENT FUNCTION IS AN ERROR, NOT AN EMPTY STRING – T-01, 05.09 review.
// =================================================================================================
//
// THE FAILURE MODE, AND IT IS THE `-1` FAMILY ONE DOOR OVER. This used to `return ''` when the
// function was not found. `tests/helpers/source.ts` exists because a rotted marker must never
// SILENTLY WIDEN a region; here the region silently EMPTIED instead, which is worse in the one
// direction that matters: every NEGATIVE assertion becomes a tautology. `expect('').not.toMatch(...)`
// passes for every pattern there is. Rename the function and a pin that says "this writer draws no
// randomness" goes on passing while the writer it was aimed at no longer exists.
//
// It was live: tests/round23-retirement-news.test.ts's «draws nothing» pin had no `not.toBe('')`
// guard at all, and seven other sites carried one by hand – a guard the caller should never have had
// to write. So this throws, on the marker helpers' own precedent, and those seven guards are now
// harmless redundancy rather than the only thing standing between a rename and a green vacuum.
//
// ⚠ AND IT MATCHES ON THE PARENTHESIS AND WALKS THE BRACES, which is tests/relative-age.test.ts's
// lesson folded back in (its local copy carried both and this one did not). Without the paren
// `mandatoryBinds` resolved to `mandatoryBindsRank` – a PREFIX COLLISION – and the pin passed green
// against a function that had never read the band. Measured over all 17 pinned functions when this
// landed: 16 extractions byte-identical to the old shape, and the 17th is `mandatoryBinds` finally
// resolving to itself (337 chars of the wrong function → 1,301 of the right one).
function moduleFunction(src: string, name: string, where: string): string {
  const from = src.indexOf(`function ${name}(`)
  if (from < 0) throw absentFunction(name, where, src, 'no `function ' + name + '(` anywhere in it')
  const open = src.indexOf('{', from)
  if (open < 0) throw absentFunction(name, where, src, 'its declaration has no body brace')
  let depth = 0
  for (let j = open; j < src.length; j++) {
    if (src[j] === '{') depth++
    else if (src[j] === '}' && --depth === 0) return src.slice(from, j + 1)
  }
  throw absentFunction(name, where, src, 'its body brace is never closed')
}

function absentFunction(name: string, where: string, src: string, why: string): Error {
  return new Error(
    `source function: '${name}' not found in ${where} (${src.length} characters) – ${why}.\n` +
      '  ⚠ This is the empty-string half of the -1 slice tests/helpers/source.ts exists to stop: this\n' +
      "    helper used to return '' here, and every `.not.` assertion on '' passes. The function has\n" +
      '    moved, been renamed, or changed its declaration shape – re-aim the pin at what is there.',
  )
}
