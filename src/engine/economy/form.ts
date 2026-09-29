// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.

// --- HER FORM: the slump and the rust (docs/specs/the-form-and-the-sparring-2026-09.md §1-§3) ---
// The model is `src/engine/form.ts`; these are its seven numbers. ⚠ ZERO DRAWS anywhere they are
// spent – O4, the owner's 16.09 ruling («accumulator, deterministic, v1»), so `seed:form:<week>`
// stays reserved and unused.
export const form = {
  /** §1a `G` – THE RESIDUAL GAIN. One match's worth, before the odds are applied: a win over a
   *  girl the ring gave her no chance against is `+G`, a loss as a certainty is `-G`, and both
   *  ends are unreachable because `p` is never 0 or 1.
   *
   *  ⚠ WHAT THIS DIAL SETS IS HOW FAR INTO THE CLAMPS A REAL CAREER TRAVELS, and it is the half
   *  of O1 the corridor does NOT constrain – the corridor prices the clamps, this decides whether
   *  anybody ever reaches them. Measured on the census arm of `tools/form-scale-bench.ts`; see
   *  §7 of the spec for the predicted-vs-measured table. */
  gain: 1.5,
  /** §2 `K` – THE READER, in composure points per point of form. `+-10 x 0.6 = +-6 composure` at
   *  the clamps.
   *
   *  ⚠⚠ THIS CONSTANT IS THE CONSEQUENCE AND THE CORRIDOR IS THE RULING (O1, 16.09: «what he
   *  ruled is the METHOD»). The ruled corridor is **[0.5, 4] pp of realised match win rate at the
   *  clamps** – it decides close matches, never a career – and this number is whatever puts the
   *  clamps inside it on the post-#34 engine. A builder that moves it without re-running
   *  `npm run bench:formscale` has skipped O1 rather than re-tuned it. */
  reader: 0.6,
  /** §1c – THE RETURN TO NEUTRAL, both signs, every week, applied FIRST. Half-life of a deep
   *  slump is about a month of ordinary results: «a mood, not a season» unless the results keep
   *  feeding it. A purple patch decays at the same honest rate, which is what keeps the number
   *  0-centred rather than ratcheting. */
  revertPerWeek: 0.5,
  /** §1b – HOW LONG A GAP HAS TO BE BEFORE IT IS RUST. Three weeks is an off-week, a rest and a
   *  travel week; the fourth is when a player stops being match-sharp. ⚠ STRICTLY GREATER than
   *  this, so an ordinary three-week break costs exactly nothing. */
  rustAfterWeeks: 3,
  /** §1b – the drift per matchless week past the gap, before the sparring partner's cut. */
  driftPerWeek: 0.4,
  /** §1b – HOW FAR RUST ALONE CAN TAKE HER, and it is deliberately not the clamp: rust DULLS, it
   *  does not destroy. A girl already below this from a run of bad results rusts by nothing at
   *  all – her problem is not that she has stopped playing. */
  rustFloor: -4,
  /** The clamps. 0 is neutral and both backfills; `+-10` is «as well as she has ever felt» and
   *  «nothing is going in». */
  min: -10,
  max: 10,
  /** §3's ONE WINDOW – where the coach's eye starts saying she is striking it clean, and where it
   *  starts saying she needs matches. ⚠ NOT SYMMETRICAL, because the two channels are not: the
   *  rust line is ALSO gated on the gap that caused it (`coachFormNote`), so «she needs matches
   *  under her» is never said about a girl who has been playing every week and losing – that girl
   *  is in a slump, which is the psychologist's patient and not a thing a hitting session fixes.
   *  ⚠ THE NUMBER NEVER REACHES A SURFACE, only the sentence does (O2). */
  goodNoteAt: 3,
  rustNoteAt: -2,
  /** ⭐⭐ O1's RULING ITSELF, IN THE CONSTANTS FILE, because it is the thing `reader` above serves
   *  and a corridor that lives only in a spec is a corridor a builder can forget. The realised
   *  match win-rate swing at the clamps, in probability points: form decides close matches and
   *  never a career (form-and-slump §1's bound, kept as law).
   *
   *  ⚠ IT IS READ BY THE BENCH AND BY NOTHING ELSE, deliberately: no engine path consults it, so
   *  it cannot tune anything by accident. `npm run bench:form` §1 prints each opponent's worst
   *  realised |pp| beside it and says «inside» or «OUTSIDE». */
  corridorPp: [0.5, 4] as const,
} as const
