// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/divorce.md#the-divorce-block

/** ⭐⭐⭐ v88 – THE PARTING (wave 12; `docs/specs/the-parting-2026-09.md` §4,
 *  `docs/plans/life-wave-12-builder-2026-09.md` §T2.1). The marriage `ECONOMY.wedding` started
 *  is the marriage this block ends, and it holds **four bond deltas and nothing else** – which
 *  is the shortest block in this file and is the wave's own boundary made structural.
 *
 *  ⚠⚠ divorce: NO MONEY, AND THE ABSENCE IS A RULING RATHER THAN AN OVERSIGHT.
 *  owner (divorce), 18.09: «я думаю как с подарками, никто и нисколько»
 *  ⚠⚠ divorce: NO HAZARD EITHER, AND THAT IS THE LOUDER ABSENCE.
 *  ⚠ divorce: ⚠ **ALL FOUR NUMBERS ARE DRAFTS, AND THEY ARE DRAFTS OF A PARTICULAR KIND**…
 *  ⚠ divorce: THE BUILDER DID NOT INVENT A SPREAD
 *  → docs/notes/economy/divorce.md#divorce
 */
export const divorce = {
  /** ⭐⭐ THE PAIR READ TWO WAYS, `ECONOMY.bond.delta.endedMatched`/`endedMismatched`'s own shape
   *  and its own argument: which of «room» and «company» is the match is HER read, drawn on
   *  `seed:life:ends:<endedWeek>:react` – the key the ending already derives – and the answer that
   *  matches costs `matched`, the other `mismatched`, whichever way round the draw came out.
   *  ⚠ ONE PRICE FOR «you gave her what she wanted» and one for «you did not», never four. */
  matched: 3,
  mismatched: -3,
  /** ⭐⭐ THE TWO READ-INDEPENDENT ROWS, and the independence is LOAD-BEARING beyond the design:
   *  `sort` is what `tools/_lifeBeats.ts` drains this kind with (`DRAIN_ANSWER['divorced']`), and
   *  a drain answer whose price moved with a fact the harness is not tracking is refused outright
   *  by `drainCostOf` rather than averaged. ⚠ AND `dismiss` IS THE ROW WITH NO READING AT ALL, the
   *  ended pool's ruling inherited word for word: «some things are wrong regardless of what she
   *  wanted» – speaking against the person she married costs −4 whichever way her read came out. */
  sortItOut: -1,
  dismiss: -4,
} as const
