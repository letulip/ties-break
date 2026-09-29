// THE BENCHES' CONSOLE FORMATTING – one `money`, one percentage per QUESTION.
// (T5.12 · F-04, 27.09. Siblings: `tools/_stats.ts`, `tools/_args.ts`.)
//
// ⚠⚠ `pct` MEANT THREE DIFFERENT THINGS AND THAT IS WHY THE NAMES HERE ARE LONGER. Across the live
// tools `pct(x)` took a FRACTION, `pct(n, d)` took a numerator and a denominator, and
// `spirit-bench.ts:1013`'s `pct(part, whole)` returns a NUMBER rather than a string. One name over
// three contracts is a ×100 waiting to happen, exactly as `src/shared/money.ts`'s own header records
// for `formatDollars`. So: `pctOf` takes the fraction, `shareOf` takes the pair, and a reader of a
// call site can see which without opening this file.
//
// ⚠⚠ AND `money` HERE IS **NOT** `src/shared/money.ts`'s `formatCents`, WHICH THE REVIEW PROPOSED.
// F-04's proposal was «`money` = `formatCents` re-exported from `src/shared/money`», and it cannot be
// executed without moving printed numbers: `formatCents` puts the sign OUTSIDE the dollar
// (`-$1,234`), while every live copy of this body prints `$-1,234`, because
// `Math.round(cents / 100).toLocaleString('en-US')` formats the negative number whole. Eight benches,
// nine copies, would have changed every deficit cell in their output, and a de-duplication that moves
// a printed number is not one. The BODY below is therefore those copies' own, verbatim.
//
// ⚠ AND THERE WERE NINE, NOT SIX. F-04 counted six by grepping for the NAME at column 0.
// `sponsor-window-bench.ts:517`'s `usd` and `fatigue-bench.ts:1517,2244`'s two FUNCTION-SCOPED
// `dollars` are the same body under other names, and all three are routed here. A census keyed on a
// helper's name is a floor on the copies, never the count.
//
//   ⚠ Whether a bench should print `$-1,234` at all is a real question – the review says it «reads
//   differently from every other money figure in the repo» and it is right. It is a wording change to
//   developer-facing output, with a per-bench diff, and it needs asking rather than doing: the fix
//   here is that there is now ONE place to make it.
//
// ⚠ NO TOP-LEVEL SIDE EFFECTS – see `_stats.ts`.

/** WHOLE DOLLARS, UNSIGNED GROUPING: `-123456` → `"$-1,235"`. The body of the nine live copies at
 *  `coach-raise-bench.ts:74`, `form-bench.ts:66`, `masseur-raise-bench.ts:68`,
 *  `prologue-balance-bench.ts:78`, `prologue-handover-bench.ts:46`, `wedding-bench.ts:99`,
 *  `sponsor-window-bench.ts:517` (as `usd`) and `fatigue-bench.ts:1517,2244` (as `dollars`).
 *
 *  ⚠ NOT the player-facing spelling. `src/shared/money.ts` owns that one and prints `-$1,235`; this
 *  is a console column and its rule is the one its benches have always had. `shop-probe.ts:173` keeps
 *  its own signed copy for the same reason in reverse – its rule is already the sign-outside one, and
 *  it disagrees with `formatCents` on sub-dollar debt (`-49` cents: `-$0` there, `$0` in
 *  `formatCents`, whose header calls that edge load-bearing). */
export const money = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`

/** A FRACTION AS A PERCENTAGE, ONE DECIMAL: `0.1234` → `"12.3%"`. Ten live tools spelled this,
 *  five of them as `(x * 100)` and five as `(100 * x)` – IEEE-754 multiplication is commutative, so
 *  the two spellings were bit-identical and the split was noise. */
export const pctOf = (x: number): string => `${(100 * x).toFixed(1)}%`

/** A NUMERATOR OVER A DENOMINATOR AS A PERCENTAGE, ONE DECIMAL, with an empty cell for `d === 0`:
 *  `shareOf(3, 8)` → `"37.5%"`, `shareOf(0, 0)` → `"   – "`. `dead-week-probe.ts:194` /
 *  `ladder-floor.ts:68` verbatim.
 *
 *  ⚠ THE `d === 0` CELL IS THE WHOLE POINT and it is why there are two of these. A share of nothing
 *  is not `0.0%` – it is a cell with no question in it, and the benches print a dash so a reader
 *  cannot mistake "no seeds reached here" for "none of them did it". */
export const shareOf = (n: number, d: number): string =>
  d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1)}%`

/** `shareOf` RIGHT-ALIGNED IN A FIXED COLUMN – `"  1.2%"` / `" 12.3%"` / `"100.0%"`, the same dash
 *  for `d === 0`. `endings-bench.ts:363`, `outgrown-entry-probe.ts:262` and `two-doors-bench.ts:210`
 *  verbatim: a table whose rows line up needs the pad, and a table that prints one figure per line
 *  does not.
 *
 *  ⚠ TWO LIVE COPIES STILL DISAGREE AND THEY STAY LOCAL. `wedding-bench.ts:98` prints `'   –'` with
 *  no trailing space, and `retirement-rate.ts:275` takes a decimal-places argument and prints
 *  `'   n/a'`. Both are one byte from this body and both would have moved a printed cell. */
export const shareOfPadded = (n: number, d: number): string =>
  d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1).padStart(5)}%`
