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
import { readFileSync, readdirSync } from 'node:fs'

const ROOT = new URL('../src/engine/', import.meta.url)

/** world.ts followed by every world/*.ts part, concatenated with a marker between files. */
export function worldSource(): string {
  const main = readFileSync(new URL('world.ts', ROOT), 'utf8')
  const parts = readdirSync(new URL('world/', ROOT))
    .filter((f) => f.endsWith('.ts'))
    .sort()
    .map((f) => `\n// ==== src/engine/world/${f} ====\n` + readFileSync(new URL(`world/${f}`, ROOT), 'utf8'))
  return main + parts.join('')
}

/** The source of one top-level function, wherever in the world module set it now lives. Returns ''
 *  when absent, so a caller asserting `toContain` fails loudly rather than passing on a bad slice. */
export function worldFunction(name: string): string {
  return moduleFunction(worldSource(), name)
}

// -------------------------------------------------------------------------------------------------
// ⚠ GENERALISED WHEN THE SECOND MODULE STARTED MOVING. `diary.ts` is now being decomposed into
// `src/engine/diary/*.ts` the same way world.ts was, and it broke a source pin the same way on its
// very first extraction (`resultShowsOnHerFace(e)` left diary.ts for diary/facts.ts). Rather than
// copy this file, the reader below takes the module name - so the third decomposition needs no new
// helper and no test edits.
// -------------------------------------------------------------------------------------------------

/** `<name>.ts` followed by every `<name>/*.ts` part, concatenated with a marker between files. */
export function engineModuleSource(name: string): string {
  const main = readFileSync(new URL(`${name}.ts`, ROOT), 'utf8')
  let parts: string[] = []
  try {
    parts = readdirSync(new URL(`${name}/`, ROOT))
      .filter((f) => f.endsWith('.ts'))
      .sort()
      .map((f) => `\n// ==== src/engine/${name}/${f} ====\n` + readFileSync(new URL(`${name}/${f}`, ROOT), 'utf8'))
  } catch {
    // no package directory yet - the module has not been decomposed, which is not an error
  }
  return main + parts.join('')
}

/** The source of one top-level function anywhere in a named engine module set. '' when absent. */
export function engineModuleFunction(module: string, name: string): string {
  return moduleFunction(engineModuleSource(module), name)
}

/** diary.ts + every diary/*.ts part. */
export function diarySource(): string {
  return engineModuleSource('diary')
}

// -------------------------------------------------------------------------------------------------
// ⚠ AND THE SAME PROBLEM ARRIVED FOR COMPONENTS. Splitting a 2,300-line SFC means moving logic into
// `src/composables/*.ts`, and a pin that reads only the `.vue` then asserts against half a component.
// `componentSource` follows the SFC's own composable imports, so a pin keeps covering the whole
// thing however far the component is decomposed — the property `engineModuleSource` already has.
// -------------------------------------------------------------------------------------------------

const SRC = new URL('../src/', import.meta.url)

// ⚠ TWO NAMES, ON PURPOSE, AND THERE IS DELIBERATELY NO `componentSource`.
//
// The two questions a component pin can ask are NOT interchangeable, and the ambiguous name invited
// the wrong one. It cost a real failure the first time it was used: `screen-i-live-match`'s pin
// "MatchViewer imports no setter" started failing because the widened text now included
// matchDefaults.ts, where `setMatchSpeedDefault` is DEFINED — the assertion tripped on a definition
// it was never talking about. Documenting that was not enough; the name is the fix.
//
//   componentLogic()  – the SFC PLUS every composable it imports. Answers "this logic exists
//                       somewhere in the component". Survives extraction, which is the point.
//                       ⚠ POSITIVE ASSERTIONS ONLY. Never `.not.toContain` against it: widening the
//                       corpus makes a negative claim over-strict, and it will fail on a definition
//                       living in a composable. tests/pin-hygiene.test.ts enforces this.
//   componentFile()   – the .vue ALONE. Answers "this FILE itself does / does not ...", which is the
//                       only honest source for a negative claim about the component's own imports.

/** The SFC plus every `composables/*` module it imports. POSITIVE assertions only — see above. */
export function componentLogic(relFromSrc: string): string {
  const sfc = componentFile(relFromSrc)
  const parts: string[] = []
  for (const m of sfc.matchAll(/from '(?:\.\.\/)+composables\/([A-Za-z0-9_]+)'/g)) {
    try {
      parts.push(`\n// ==== src/composables/${m[1]}.ts ====\n` + readFileSync(new URL(`composables/${m[1]}.ts`, SRC), 'utf8'))
    } catch {
      // a composable that is not a plain .ts file is simply not part of the pin
    }
  }
  return sfc + parts.join('')
}

/** The `.vue` file alone — the only honest source for a NEGATIVE claim about that file. */
export function componentFile(relFromSrc: string): string {
  return readFileSync(new URL(relFromSrc, SRC), 'utf8')
}

function moduleFunction(src: string, name: string): string {
  const at = src.indexOf(`function ${name}`)
  if (at < 0) return ''
  const end = src.indexOf('\n}', at)
  return end < 0 ? src.slice(at) : src.slice(at, end + 2)
}
