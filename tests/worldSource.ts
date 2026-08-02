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
  const src = worldSource()
  const at = src.indexOf(`function ${name}`)
  if (at < 0) return ''
  const end = src.indexOf('\n}', at)
  return end < 0 ? src.slice(at) : src.slice(at, end + 2)
}
