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

function moduleFunction(src: string, name: string): string {
  const at = src.indexOf(`function ${name}`)
  if (at < 0) return ''
  const end = src.indexOf('\n}', at)
  return end < 0 ? src.slice(at) : src.slice(at, end + 2)
}
