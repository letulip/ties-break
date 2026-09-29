// ONE BLOCK OF `ECONOMY` (T7.3 of the principles fix): assembled in `../economy.ts`, in the key order the literal always had.
// The essays that stood here moved out verbatim → docs/notes/economy/sparring.md#the-sparring-block

// --- THE SPARRING PARTNER (docs/specs/the-form-and-the-sparring-2026-09.md §4) -------------------
// THE THIRD SALARIED SEAT, and the one with the narrowest job in the game. ⚠⚠ THE FENCE SENTENCE
// IS THE DESIGN: **the slump is the psychologist's patient, the rust is the sparring partner's.**
// He reaches `FormWeek.rustCut` and nothing else – not the results channel, not the reversion
// rate, not condition, not development. A slumping girl who plays every week gets NOTHING from
// him, and that is the seat working rather than the seat failing.
export const sparring = {
  /** THE LADDER. `driftCut` is a MULTIPLIER ON THE DRIFT, not the share removed: x0.15 means the
   *  top rung leaves 15% of a rusting week's drift standing. Strictly decreasing, or the rung is
   *  re-priced – the masseur spec's §4 law.
   *
   *  ⚠ THE MONEY IS ANCHORED ON THE RESEARCH AND THE RUNGS ARE PROPOSALS (O7, 16.09)
   *  ⚠⚠ sparring.rungs: THE THREE CUTS ARE **0.75 / 0.5 / 0.25** AND NOT
   *  ⚠ THE TOP RUNG IS therefore a WEAKER cut than §4 proposed (75% of the drift removed rather than 85%) and it is the only rung that…
   *  ⚠ sparring.rungs: THE THREE SENTENCES ARE CHECKED AGAINST THE NUMBERS BESIDE THEM
   *  → docs/notes/economy/sparring.md#sparringrungs
   */
  rungs: [
    { label: 'A college hitter', weeklyCents: 500_00, driftCut: 0.75, note: 'Takes a quarter off the rust of a week without a match.' },
    { label: 'A journeyman pro', weeklyCents: 900_00, driftCut: 0.5, note: 'Takes half off the rust of a week without a match.' },
    { label: 'A top-100 partner', weeklyCents: 1400_00, driftCut: 0.25, note: 'Takes three quarters off the rust of a week without a match.' },
  ],
  /** The middle rung, and the masseur's own `defaultSessions` doctrine: MEANINGLESS UNTIL HIRED,
   *  which is why v78 could back-fill it on a career that never hires the seat. */
  defaultRung: 1,
} as const
