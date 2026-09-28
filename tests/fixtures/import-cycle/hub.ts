// A FIXTURE FOR `tests/import-cycles.test.ts` ARM 4 – NOT SHIPPED CODE AND NOT IMPORTED BY ANYTHING.
//
// It holds a real 2-module runtime cycle (this file re-exports `./leaf`, `./leaf` imports this file
// back) placed the way a builder actually writes one: in the hub's export block, under a paragraph of
// prose. `tests/import-cycles.test.ts` is pointed at this directory so the judge is measured against
// a cycle it must find, rather than trusted because it reported none in `src/`.
//
// ⚠⚠ THE LINE BELOW IS THE WHOLE POINT, AND IT IS COPIED FROM THE SHAPE THAT WAS LIVE IN
// `src/engine/world/lifeBeat.ts:129`. A path glob in prose puts a SLASH IMMEDIATELY BEFORE A STAR, so
// a comment strip that runs the BLOCK matcher first reads it as an opener and deletes everything from
// here to the next block-comment CLOSE – which is the end of the JSDoc at the foot of this file. The
// re-export in between disappears, the cycle with it, and the guard goes green.
//
// ⚠ AND THE JSDOC BELOW DELIBERATELY DOES NOT QUOTE THE CLOSING MARKER. Writing it inside a block
// comment ends that comment early and leaves a stray backtick – `vue-tsc` caught exactly that here
// («TS1160: Unterminated template literal»), which is this fixture's own lesson about lexing.
//
// also the edge nine other `world/*` modules already take for THIS predicate, counted rather than
// quoted, which is the sentence the real hub carries.
export { leafValue } from './leaf'

/** The JSDoc whose close is what a block-first strip runs to: everything above it is eaten with it. */
export const hubValue = 'hub'
