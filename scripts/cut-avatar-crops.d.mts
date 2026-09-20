// Types for the crop table. Mirrors scripts/optimize-art.d.mts: the script itself stays plain .mjs
// (it runs under node with no build step), and this declaration is what lets the test import the
// table under vue-tsc.

/** stem -> [face centre x, face centre y, square side] in 512px painting pixels.
 *  Keyed on PAINTINGS: every painted face has an entry, because the Home hero frames by the centre.
 *  Whether a crop is CUT from one is a separate question – see `croppableStems`. */
export declare const CROPS: Record<string, [number, number, number]>

/** The faces with a painting but no 256px crop. It STARTED as the art-side spelling of
 *  `PortraitEmotion \ AvatarEmotion` – i.e. `rehab` alone, with tests/portrait-bands.test.ts pinning
 *  the two EQUAL – and that stopped being the fact the moment one-band paintings arrived that are in
 *  no union at all: `graduated` (T14), `bride` (the wedding) and the pregnancy pair (v85 T10). The
 *  pin now states CONTAINMENT plus the literal list, and the note in `src/art/faceRects.ts` carries
 *  the argument. ⚠ Entries are FACES and not stems – `croppableStems` matches them as suffixes. */
export declare const PAINTING_ONLY_FACES: readonly string[]

/** The stems the cutter actually cuts – `CROPS` minus the painting-only faces. */
export declare function croppableStems(): string[]
