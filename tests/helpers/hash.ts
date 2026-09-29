// FNV-1a, ONCE. Six test files carried their own copy to fingerprint an RNG draw sequence – the
// "did this change tap the same dice?" pin that input-independence (invariant 2) is made of.
//
// THE COPIES DIFFERED, and the difference is only in where the formatting happens:
//   five files  – `function fnv1a(s): string`, `Math.imul(h, PRIME)`, returns the padded hex.
//   knock.test  – `function fnv1a(s): number`, `Math.imul(h, PRIME) >>> 0` INSIDE the loop, returns
//                 the raw 32-bit word; its call site does `.toString(16).padStart(8, '0')`.
//
// The intra-loop `>>> 0` changes nothing: `Math.imul` already yields a signed int32, and the next
// statement is `h ^= c`, whose ToInt32 maps the unsigned value back to the same bit pattern. Checked
// rather than reasoned at: 22,000 strings (random, unicode, and the long comma-joined number lists
// the real callers hash) – zero mismatches. So both copies compute the SAME hash and every pinned
// value below stays valid; only the return TYPE was ever different.
//
// Hence two exports rather than one implementation forced into one shape: the hash, and the hex of
// it. Nobody's pinned value moves.

const OFFSET = 0x811c9dc5
const PRIME = 0x01000193

/** FNV-1a over a string, as an unsigned 32-bit word. */
export function fnv1a(s: string): number {
  let h = OFFSET
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, PRIME)
  }
  return h >>> 0
}

/** The same hash as eight zero-padded hex digits – the form the draw-sequence pins are written in. */
export function fnv1aHex(s: string): string {
  return fnv1a(s).toString(16).padStart(8, '0')
}

/** ⭐ A WHOLE WORLD'S FINGERPRINT – the control for a fixture MIGRATION (26.09, W5's T5.11).
 *
 *  H-07's migration path asks for «a world-hash identity before and after at every call site», and
 *  this is that hash: a scenario builder that moved out of a test file into `scenarios/` must hand
 *  back the same world, and a migration that moves a hash is not a migration. `JSON.stringify` is the
 *  right serialisation and not a shortcut – it is what `coachTravelEdgeFixtures.ts`' frozen ladder
 *  hashes too, and it therefore sees key ORDER as well as values, which is exactly what a hand-posed
 *  fixture's field list can quietly change.
 *
 *  ⚠ IT IS A CONTROL, NEVER A PIN. Nothing should ever commit one of these hex strings: a posed
 *  fixture changes for real reasons all the time, and a pin on this would be a second `PRE_V*` ladder
 *  with nobody's protocol behind it. Capture it in a probe, compare the two arms, throw the probe
 *  away – the migration's report carries the numbers. */
export function worldHash(world: unknown): string {
  return fnv1aHex(JSON.stringify(world))
}
