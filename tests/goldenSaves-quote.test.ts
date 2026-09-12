// THE v61 SWEEP – one of the three corpus walks `tests/goldenSaves.test.ts` used to make in one
// process. tests/goldenSavesCorpus.ts holds the fixture enumeration and the whole argument for why
// there are three files; the describe name below is the ORIGINAL one, so every full test name here
// is byte-identical to the name the single file produced.

import { describe, it, expect } from 'vitest'
import { migrateSave } from '../src/engine/migrations'
import { FILES, load, FIRST_QUOTE_FIXTURE } from './goldenSavesCorpus'

describe('golden saves corpus', () => {
  // ⭐⭐⭐⭐ v61 – THE FIRST FIELD THIS LADDER HAS DELETED, AND THE DELETE HAS TO BE PROVED ON THE
  // CORPUS RATHER THAN ON ITS OWN MIGRATION. Round 26 #2, second pass: the owner overruled the rule
  // that could shut a college place («по-моему в каждой стране есть домашний универ»), so
  // `CollegeQuote.open` left the type – and a value left behind in a save is worse than one that was
  // never removed, because `answerFork` used to filter on it. NINE fixtures (v52..v60) carry a fork
  // offer with `open: true`, so this sweep is not vacuous and its own anti-vacuity line says so.
  //
  // ⚠⚠ ONE TEST PER FIXTURE, AND THE SPLIT IS THE FIX ROUND 31 ALREADY MADE ONCE (P-14, 05.09).
  // This was a single `it` walking the whole corpus, and `migrateSave` runs the WHOLE ladder on each
  // fixture, so it grew TWICE with every wave: one more fixture, and one more step in every other
  // fixture's chain. Measured here at v70: this sweep and the v62 one below were 6.3 s and 6.1 s of
  // the file's 19.0 s of test time – 65 % of it, in two tests, against a 20 s PER-TEST ceiling that
  // has already killed this exact file (27.08, red four times on `check` with zero assertion
  // failures). `tests/round31-age-curve.test.ts:298-311` records the same failure and the same fix;
  // its own words apply here unchanged: «`it.each` is not a loosening – the same assertions run over
  // the same fixtures. Each one now gets its own budget, a failure names the fixture instead of the
  // sweep, and the arm cannot cross the line again however many schema versions accumulate.»
  //
  // ⚠ AND THE CORPUS IS DELIBERATELY NOT MIGRATED ONCE INTO A SHARED CONSTANT, which was the other
  // remedy on the table. It would take ~12 s out of the file, and it would put that work at MODULE
  // level, where no per-test budget and no `hookTimeout` covers it and the reporter attributes it to
  // no test – which is the defect P-15 is about, one file over. Cheaper is not the same as bounded.
  //
  // ⚠ AND P-14's BUDGET ARGUMENT IS WHY THE WAVE-3 CUT WENT THROUGH THE WALKS AND NOT THROUGH THIS
  // SWEEP'S CASES. Per-fixture, no single case here is anywhere near a ceiling – it is the SEVENTY-
  // FIVE of them, summed into one shard's wall clock, that birpc counts. So the file moved; the
  // sweep did not change shape a second time.
  it.each(FILES)('⭐⭐⭐⭐ v61: %s carries no college quote `open` flag', (file) => {
    const migrated = migrateSave(load(file)) as unknown as {
      fork?: { offer?: { quotes?: Array<Record<string, unknown>> } | null } | null
    }
    const quotes = migrated.fork?.offer?.quotes ?? []
    // ⚠ THE ANTI-VACUITY HALF, RE-AIMED BY P-14 AND STRICTLY STRONGER THAN WHAT IT REPLACES. The
    // sweep used to count quotes across the whole corpus and assert `>= 9` once; per fixture, the
    // same claim is made of EACH carrier by name, so a fixture that quietly stopped carrying its
    // quote is red instead of being absorbed by the other nineteen. Measured 05.09: every fixture
    // from v51 on carries exactly one, twenty of them – the comment this replaces still said nine.
    if (Number(file.match(/\d+/)![0]) >= FIRST_QUOTE_FIXTURE) {
      expect(quotes.length, `${file}: at or past v${FIRST_QUOTE_FIXTURE} and carrying no college quote – the case below would prove nothing`)
        .toBeGreaterThanOrEqual(1)
    }
    for (const q of quotes) {
      expect('open' in q, `${file}: a shut flag survived the migration`).toBe(false)
      // ⚠ AND NOTHING ELSE ON THE QUOTE MOVED. The migration deletes one key and re-prices nothing
      // – `ForkState.offer`'s own doctrine that a career is not re-priced halfway through a bill.
      expect(typeof q.costPerYearCents, `${file}: the sticker is still there`).toBe('number')
      expect(typeof q.familyPerYearCents, `${file}: and so is what the family pays`).toBe('number')
    }
  })

  // ⚠ THE CORPUS-SCALE HALF TRAVELLED WITH THE SWEEP IT DEFENDS, and that is the whole reason it is
  // in this file rather than in the one that kept the path. It is the anti-vacuity floor for the
  // cases above – separated from them, a reader would have to find it to know the sweep is not a
  // loop over an empty array, and a wave that emptied the corpus would leave the guard green in
  // another process.
  it('⚠ ...and the corpus really does carry college quotes for that sweep to check', () => {
    // The corpus-scale half of the anti-vacuity, kept as its own claim now that the sweep is
    // per-fixture: there have to BE carriers, or every case above is a loop over an empty array.
    const carriers = FILES.filter((f) => Number(f.match(/\d+/)![0]) >= FIRST_QUOTE_FIXTURE)
    expect(carriers.length, 'no fixture is old enough to carry a college quote').toBeGreaterThanOrEqual(9)
  })
})
