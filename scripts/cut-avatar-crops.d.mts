// Types for the crop table. Mirrors scripts/optimize-art.d.mts: the script itself stays plain .mjs
// (it runs under node with no build step), and this declaration is what lets the test import the
// table under vue-tsc.

/** stem -> [face centre x, face centre y, square side] in 512px painting pixels. */
export declare const CROPS: Record<string, [number, number, number]>
