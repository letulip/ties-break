// THE BENCHES' STATISTICS – one `mean`, one `stddev`, one `median`, one `quantile`.
// (T5.12 · F-04, 27.09. `tools/_fmt.ts` and `tools/_args.ts` are its two siblings.)
//
// ⚠⚠ THE BODIES BELOW ARE A **LIFT, NOT A DESIGN**. `mean` / `stddev` / `median` are
// `tools/econ-bench.ts:1068-1087` moved here byte-identical, and `econ-bench.ts` imports them back
// and re-exports them under the same names – because **44 files already take `mean`, `median` or
// `stddev` from `./econ-bench`** (43 tools, 14 of them live, and one test), which makes econ-bench the
// de facto home whether or not anybody named it one. `tools/fatigue-bench.ts` held a byte-identical
// second copy of `mean` and `stddev` and re-exports them the same way. The reference behaviour is
// therefore econ-bench's, and it is stated here so a reader never has to open a bench to know it:
//
//   **an empty array is `0`, and an even-length `median` is the average of the two middles.**
//
// Choosing any other rule – NaN on empty, the upper middle – would have moved a printed number in
// benches that nobody asked to re-measure. Whether an empty arm SHOULD print `NaN` rather than `0`
// is a real tooling question and it is a separate one, with its own per-bench diff.
//
// ⚠ SO A COPY THAT DISAGREES STAYS WHERE IT IS, and that is deliberate. Six live tools keep a local
// `mean` or `median` because their rule is not this one – `childhood-bench.ts:39` and
// `skill-ceiling.ts:102` return NaN on empty, `snapshot-bench.ts:145` does not guard empty at all,
// `dual-universe-bench.ts:227` and `spirit-bench.ts:984,998` take `readonly number[]` and return
// NaN, and `injury-landscape.ts:136`'s `mean(rows, projection)` is not this function at all. Routing
// them here would change what they print, which is the one thing a de-duplication may not do.
//
// ⚠ NO TOP-LEVEL SIDE EFFECTS. A module a bench imports may not walk a career, read `process.argv`
// or print: it is loaded before the bench's own header line.

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}

/** Population standard deviation (we have the whole 30-seed population, not a sample). */
export function stddev(xs: number[]): number {
  if (xs.length === 0) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** NEAREST RANK, `floor(q · n)`, clamped – `tools/form-bench.ts:68` verbatim, the rule `form-bench`
 *  and `form-g-sweep` already shared. It takes the array UNSORTED and sorts a copy, so a caller
 *  cannot get a wrong answer by forgetting to sort.
 *
 *  ⚠ THE OTHER FOUR LIVE `quantile`s ARE DIFFERENT RULES AND THEY STAY LOCAL. `childhood-bench.ts:42`
 *  and `sponsor-window-bench.ts:519` use `round(q · (n−1))`; `spirit-bench.ts:1005` INTERPOLATES
 *  between the two neighbours; `chemistry-bench.ts:291` and `skill-ceiling.ts:97`'s `pctl` use this
 *  rank rule but take an ALREADY-SORTED array (and `chemistry`/`skill-ceiling` return NaN on empty).
 *  A spec that quotes p90 from two benches is still quoting two rank rules – that is F-04's finding
 *  and it needs a ruling on WHICH rule, not a silent switch. */
export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}
