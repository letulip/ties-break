// THE GOLDEN-SAVES CORPUS – the fixture enumeration the three sweeps share, and the reason there
// are three files where there was one.
//
// ⚠ WHY THIS EXISTS. `tests/goldenSaves.test.ts` walked into birpc's unraisable 60 s RPC window on
// CI (wave 3, PR #135): the `unit-heavy` job died four times on the all-green-non-zero shape –
// every test green, exit 1, a blank annotation and a ~582 s step – and this file was one of the two
// residents that had grown past the wall. It was already alone in its process from
// `scripts/heavy-tests.mjs`, so the FILE was the unit and the file had to be cut, exactly as
// radar's was on 11.08, fatigue-bench-policy's on 27.08 and coach-travel-edge's on 31.08. It is now
// three, sharing this module:
//
//   goldenSaves.test.ts          the corpus scan + the per-fixture invariants walk (KEEPS the path)
//   goldenSaves-quote.test.ts    the v61 sweep – no migrated save carries a college quote `open`
//   goldenSaves-peak.test.ts     the v62 sweep – every migrated save carries a peak physical
//
// ⚠ AND THE SEAM IS THE WALK, NOT THE SUBJECT, which is the finding worth carrying. The obvious cut
// is "the structural invariants" against "the two ⭐⭐⭐⭐ schema sweeps", and it happens to be the
// same cut – but only by accident, and reading it that way would mislead the next reader. What
// actually costs anything here is that `migrateSave` runs the WHOLE ladder on every fixture and the
// file did that THREE TIMES over the same 75 fixtures. MEASURED SOLO before anything was touched,
// one vitest process, `--project unit --reporter=json`, 228 tests in 19.82 s of test time:
//
//     the per-fixture invariants walk      6.82 s   75 cases
//     the v61 college-quote sweep          6.52 s   75 cases
//     the v62 peak-physical sweep          6.48 s   75 cases
//     the corpus scan + the two guards     0.00 s    3 cases
//
// NEAR-EQUAL THIRDS, and nothing else in the file costs a millisecond. The 05.09 review priced the
// same shape independently at 20.4 s of the file's 31.0 s for the two sweeps ("66 % of the file, in
// two tests", P-14 in docs/review-principles-2026-09-05/04-performance.md), so this is a reading
// reproduced twice on two machines. One walk per file is therefore the only seam here that divides
// the number three ways, and any seam that leaves two walks together leaves a file at two thirds of
// what already stalled – which is the trade fatigue-bench-policy spent two weeks proving is not a
// cut. Solo, same invocation, after: 6.79 s / 6.74 s / 6.84 s, summing to 20.37 s against 19.82 s,
// which is the proof no walk went missing.
//
// ⚠ IT IS A SPLIT AND NOT A DIET. Every fixture, every assertion and all 228 test names crossed
// over unchanged, and all three files keep the ORIGINAL describe name `golden saves corpus`
// deliberately, so every FULL test name is still the name it was and nothing outside can have been
// pointed at nothing. `scripts/heavy-tests.mjs`'s own rule governs the shape of the cut: trimming
// fixtures until a file fits buys speed with coverage, and that trade is made deliberately and
// measured, never as a side effect of making a wall.
//
// ⚠⚠ AND THE CORPUS DID NOT SPLIT WITH THE TESTS. `FILES` is read from the directory ONCE, here,
// and the three files import it – because the one thing this apparatus must never have is two
// truths about which fixtures exist. Three copies of a `readdirSync` + filter + numeric sort is
// precisely the hand-maintained second copy `scripts/heavy-tests.mjs` exists to make impossible: a
// filter that rotted in one copy would shorten that file's sweep and report it green.
//
// ⚠ THE ONE-FIXTURE-PER-VERSION LAW STAYS WHOLE AND IT STAYS IN `goldenSaves.test.ts`. CLAUDE.md's
// invariant 3 names that path, and the two cases that enforce it (v0..SAVE_SCHEMA_VERSION is
// gapless, and the current version has a file) must see the WHOLE directory in a single sweep. They
// are cheap – a `readdirSync` and an `existsSync` – so nothing was gained by moving them and a
// guarantee would have been split.

import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Backward compatibility is a hard product guarantee: every historical save shape must still
// load. Each fixture is a world-shaped payload for one schema version; all of them must migrate
// cleanly to the CURRENT schema. See tests/fixtures/saves/README.md for the rule.

export const DIR = fileURLToPath(new URL('./fixtures/saves', import.meta.url))

export const FILES = readdirSync(DIR)
  .filter((f) => /^v\d+\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))

export function load(file: string): unknown {
  return JSON.parse(readFileSync(`${DIR}/${file}`, 'utf8'))
}

/** The first fixture whose save carries a college quote through the ladder. Measured 05.09: every
 *  fixture from here on carries exactly one, twenty of them. It is the anti-vacuity floor for the
 *  v61 sweep – see the note there. */
export const FIRST_QUOTE_FIXTURE = 51
