// Types for the crop table. Mirrors scripts/optimize-art.d.mts: the script itself stays plain .mjs
// (it runs under node with no build step), and this declaration is what lets the test import the
// table under vue-tsc.

/** stem -> [face centre x, face centre y, square side] in 512px painting pixels.
 *  Keyed on PAINTINGS: every painted face has an entry, because the Home hero frames by the centre.
 *  Whether a crop is CUT from one is a separate question – see `croppableStems`. */
export declare const CROPS: Record<string, [number, number, number]>

/** The emotions with a painting but no 256px crop (`rehab`). The art-side spelling of
 *  `PortraitEmotion \ AvatarEmotion`; tests/portrait-bands.test.ts pins the two equal. */
export declare const PAINTING_ONLY_FACES: readonly string[]

/** The stems the cutter actually cuts – `CROPS` minus the painting-only faces. */
export declare function croppableStems(): string[]
