// HER FORM: the slump and the rust, as one 0-centred number.
// docs/specs/the-form-and-the-sparring-2026-09.md §1-§3, the owner's eight rulings of 16.09.
//
// ⭐ WHAT IT IS, IN ONE SENTENCE. `world.form` is tenths, 0-centred, clamped to [-10, +10], and 0
// means «she is exactly the player her results say she is». It is not a second condition and it is
// not a second spirit: condition is her BODY this week, spirit is her LIFE this week, and form is
// her TENNIS this week – the only one of the three driven by what happened on a court.
//
// ⚠⚠ ZERO DRAWS, ON ANY STREAM, AND THAT IS THE OWNER'S RULING RATHER THAN AN IMPLEMENTATION NOTE
// (O4, 16.09: «accumulator, deterministic, v1»). Every number below is arithmetic over facts the
// world already holds – the match rows the reveal flow wrote and the results ledger's own weeks – so
// the frozen MAIN capture (41550 / e6b0c709) cannot see this file and a career's dice are untouched
// by it. `seed:form:<week>` stays RESERVED AND UNUSED: if «a slump that ARRIVES rather than
// accumulates» is ever wanted, the key is named and nothing else has taken it.
//
// ⚠ TWO CHANNELS, AND THE SPLIT IS LOAD-BEARING RATHER THAN TIDY. §4's fence sentence is the whole
// design of the seat next door: **the slump is the psychologist's patient, the rust is the sparring
// partner's**. A seat that touched both would be the two-levers-one-number failure the staff layer
// was built to avoid, so the two channels are separate summands here and the sparring partner's cut
// reaches exactly one of them (`FormWeek.rustCut`).
//
//   1a THE RESULTS CHANNEL – the slump's home. Per completed competitive match, the RESIDUAL
//      against the expectation the odds ring already computes: a win is worth `+G x (1 - p)` and a
//      loss `-G x p`, `p` being her pre-match win probability. Beating a favourite moves her; losing
//      as one costs her; doing exactly what the ring expected barely registers. That is the adopted
//      driver of 23.08 («results relative to pre-match expectation, never raw wins and losses»),
//      made arithmetic – and it is SELF-CENTRING by construction, because a career that performs
//      exactly to expectation accumulates nothing at all.
//
//   1b THE RHYTHM CHANNEL – the rust's home. Weeks with no completed competitive match, once the
//      gap passes `rustAfterWeeks`: drift toward `rustFloor` and never below it. Rust DULLS, it does
//      not destroy, which is why the floor is a third of the clamp rather than the clamp.
//
//   1c THE RETURN TO NEUTRAL, applied FIRST and off last week's value – `accrueSpirit`'s own order
//      lesson, quoted rather than re-derived: return first, then this week's inputs. A purple patch
//      decays at exactly the rate a slump lifts at, which is what makes the number a mood rather
//      than a season.
//
// ⚠ THE ONE READER IS COMPOSURE (§2, and `world/player.ts` is where it lands): `composureEff =
// composure + form x K` at `MatchPlayer` build time. The match itself, the box score and the live
// commentary all INHERIT it with no new surfaces – every one of them reads the `MatchPlayer` frozen
// into `WorldMatch.a/.b`, so her serve wobbling in a slump is the same composure the commentary
// already knows how to talk about. `potential` and `skills` NEVER move: form is STATE, so the
// monotone development contract, every fixture and every bench anchor survive untouched.
//
// ⚠⚠ THE RADAR IS **NOT** ONE OF THEM YET, AND O3 IS OPEN RATHER THAN DONE. §2 lists the radar in
// that sentence and O3 ruled it MODULATED, and the one-line implementation (`shownSkill` adding this
// delta on the composure axis) collides with FOUR shipped honesty contracts of the radar's own
// geometry, measured on `tests/radar.test.ts` and `tests/radar-read.test.ts`:
//   · `|shownValue − skills[key]| ≤ band`  – «the truth is always inside the bands»
//   · `|startValue − born[key]| ≤ band`    – the same promise about where she began
//   · `startValue ≤ shownValue`             – the start contour may never be drawn outside the now
//   · `ceilingLo ≥ shownValue`              – the haze may never fall inside the contour
// Satisfying all four needs the composure axis's reported `band` widened by |delta|, BOTH contours
// shifted, and `ceilingLo` raised with them – which changes the shape of a picture the owner has
// already approved, and weakens four guarantees his own fog design rests on. That is a redesign
// rather than a ruling, so it is REPORTED and not taken: see the wave's hand-back.
//
// ⚠⚠ AND IT IS WORTH SOMETHING ONLY BECAUSE OF ROUND 42 #34, WHICH IS WHY THIS WAVE RUNS AFTER IT.
// Before #34 composure was worth 0.4-0.6 pp of match win rate per twenty points, so a +-6-point
// slump would have moved about 0.15 pp – a slump nobody can feel, and a third decorative mechanic.
// After #34 (+20 composure = +4.1 pp measured, against his ruled +4 pp target) the same points are
// worth several times that. `ECONOMY.form.reader` is fitted against the [0.5, 4] pp corridor on that
// post-#34 engine, by `tools/form-bench.ts` §1 – the corridor is the RULING (O1) and the constant
// is its consequence.
//
// ⚠ DEPENDENCY DIRECTION. A LEAF: `ECONOMY` and nothing else. No `WorldState`, not even as a type –
// the world-reading half lives at the call site (`world/phaseHerWeek.ts`'s `herWeekForForm`), which
// is `engine/chemistry.ts`'s own shape one wave earlier and what lets `world/player.ts` import the
// reader without pointing a leaf at the integration layer.
import { ECONOMY } from './economy'

/** WHAT THE WEEK DID TO HER, as the two channels read off the world. Built by the caller, because
 *  only the caller knows which rows the week closed with – see `herWeekForForm`. */
export interface FormWeek {
  /** One entry per completed competitive match the CLOSED week holds, already residualised by
   *  `formResidual` – so this module never has to know what a `WorldMatch` is.
   *
   *  ⚠ A LIST AND NOT A SUM, so a week with two matches is two terms and a week with none is an
   *  empty array rather than a zero that could also mean «she drew level». */
  residuals: number[]
  /** How many weeks she has now gone without a completed competitive match, counted INCLUSIVE of
   *  the week that has just closed: 0 on a week she played, 1 on her first week off. */
  matchlessWeeks: number
  /** ⭐ THE SPARRING PARTNER'S ONE CHANNEL (§4). A multiplier on the rhythm channel's drift and on
   *  NOTHING else: 1 when the seat is empty, `rungs[n].driftCut` while it is filled and he is at
   *  this week. He does not touch the results channel, the reversion rate, or anything else – «a
   *  slumping girl who plays every week gets nothing from him» is a property of this field reaching
   *  one summand. */
  rustCut: number
}

/** A week nothing happened in – the identity element, and what a caller without a world means.
 *  `accrueForm(f, idleWeek())` is pure reversion, which is exactly what a week she neither played
 *  nor rusted through is worth. */
export function idleFormWeek(): FormWeek {
  return { residuals: [], matchlessWeeks: 0, rustCut: 1 }
}

/** §1a – ONE MATCH'S RESIDUAL AGAINST THE ODDS RING. `p` is her pre-match win probability on
 *  [0, 1], the same closed form the calendar card quotes (`fastMatchProbability`).
 *
 *  ⚠ THE SIGNS ARE NOT SYMMETRICAL AND THAT IS THE MODEL. A win against a girl the ring gave her a
 *  10% chance against is worth `+G x 0.9`; the same win as a 90% favourite is worth `+G x 0.1`. The
 *  loss column is the mirror, so the expected residual of a match she plays to her own odds is
 *  exactly `p x G x (1 - p) - (1 - p) x G x p = 0`. That zero is the whole reason this number can be
 *  0-centred without a corrective term anywhere.
 *
 *  ⚠ A RETIREMENT IS A RESULT (`winnerId` is set on both sides of one, the rules discount a walkover
 *  and never a retirement), so nothing here asks about `retiredId`. A girl who stopped at 2-6 1-3
 *  lost, and her form knows it. */
export function formResidual(won: boolean, p: number): number {
  const g = ECONOMY.form.gain
  return won ? g * (1 - p) : -g * p
}

/** THE WEEKLY PASS – §1c then §1a then §1b, in that order, once, over last week's value.
 *
 *  ⚠⚠ ONE `roundTenth` AND ONE `clamp`, AT THE END, ON THE SUM – `accrueSpirit`'s ruling L part 2,
 *  quoted here because the reason transfers exactly: a term that quantised its own tenths would
 *  round three small residuals away to nothing before they ever met each other.
 *
 *  ⚠ THE REVERSION CANNOT OVERSHOOT ZERO, which is what «return to neutral» means and not what
 *  `f - 0.5` does at `f = 0.2`. A career sitting at neutral stays at neutral to the bit, so a girl
 *  who has never played a match has `form === 0` for ever and every reader is byte-identical to the
 *  engine before this shipped.
 *
 *  ⚠ AND THE RUST FLOOR IS A FLOOR ON THE CHANNEL, NOT ON THE NUMBER. Rust dulls: it can walk her
 *  down to `rustFloor` and no further, so a girl already at -7 from a run of bad results rusts by
 *  exactly nothing – her problem is not that she has stopped playing. The results channel keeps the
 *  whole [-10, +10] range to itself. */
export function accrueForm(before: number, week: FormWeek): number {
  const f = ECONOMY.form
  // Is the RHYTHM channel drifting this week – the gap past `rustAfterWeeks`, strictly.
  const rusting = week.matchlessWeeks > f.rustAfterWeeks
  // §1c – the return to neutral, FIRST and off last week's value, both signs, never past 0.
  //
  // ⚠⚠ AND IT STANDS DOWN ON A RUSTING WEEK, WHICH IS A CORRECTION TO THE SPEC'S OWN §1c AND IS
  // REPORTED RATHER THAN DONE QUIETLY. §1c says «always, both signs»; §1b promises a drift of
  // 0.4/wk toward a floor of -4. THOSE TWO SENTENCES CANNOT BOTH BE TRUE with a reversion of 0.5,
  // and the arithmetic is not subtle: `f → min(0, f + 0.5) − 0.4` has the 2-cycle {0, −0.4} as its
  // only attractor, so the rhythm channel would top out at −0.4 for ever and `rustFloor` would be
  // unreachable by a factor of ten. The whole of F2 – the sparring seat, the prices, the rung table
  // – would then be cutting a drift worth four hundredths of a composure point. Round 42 #48's
  // census summed the drift post-hoc WITHOUT the reversion and said so in as many words; this is
  // what happens when the two are put in the same loop.
  //
  // ⚠ SO THE FIX IS THE ONE THAT KEEPS BOTH OF HIS NUMBERS AND CHANGES A RULE INSTEAD OF A DIAL, and
  // it is the more honest model as well as the cheaper diff: reversion is ORDINARY COMPETITION
  // pulling her back to her own level, and on a week she plays nothing there is nothing pulling.
  // That IS the rust. `rustFloor` is then reached in exactly `4 / 0.4 = 10` matchless weeks, which is
  // a sentence a player could be told, and §1b's «−0.4/wk toward −4» becomes literally true rather
  // than aspirational. ⚠ THE FIRST THREE WEEKS OF A GAP ARE UNAFFECTED: `rusting` is strict, so an
  // ordinary break still reverts a slump exactly as §1c describes.
  const toward = rusting
    ? before
    : before > 0
      ? Math.max(0, before - f.revertPerWeek)
      : before < 0
        ? Math.min(0, before + f.revertPerWeek)
        : 0
  // §1a – the results channel. An empty week adds an exact 0.
  let moved = toward
  for (const r of week.residuals) moved += r
  // §1b – the rhythm channel, and ONLY past the gap. `rustCut` is the sparring partner's whole
  // effect on this number (§4); at 1 he is not hired and the drift is the full one.
  if (rusting && moved > f.rustFloor) {
    moved = Math.max(f.rustFloor, moved - f.driftPerWeek * week.rustCut)
  }
  // ⚠⚠ ONE `roundTenth`, ONE `clamp`, AT THE END, ON THE SUM – and the ROUNDING HAS A CONSEQUENCE
  // THE SPARRING SEAT'S PRICES HAD TO BE FITTED AROUND, recorded here because the next reader will
  // meet it. Rounding the ACCUMULATED value every week means a drift smaller than half a tenth still
  // ratchets the number down by a whole tenth, so two different `rustCut`s can produce an identical
  // trace. `ECONOMY.sparring.rungs` carries the measurement and the three cuts that avoid it; a wave
  // that re-prices the rungs must keep `driftPerWeek x cut` exact in tenths or re-measure §3 of
  // `npm run bench:form`.
  return roundTenth(clamp(moved, f.min, f.max))
}

/** §2 – THE ONE READER, in composure points. `undefined` (a pure caller that builds a player
 *  without a world, and every stored replay frozen before this shipped) is an EXACT 0, not «a girl
 *  at neutral»: 0 is the identity element for a sum, so those callers compose byte-identically.
 *
 *  ⚠ ONE CALLER TODAY, `world/player.ts`, and the function exists as a named export rather than as
 *  three characters inline SO THAT there can never be a second SPELLING when O3's radar reader
 *  lands: the composure the match is played at and the composure the coach draws would then be one
 *  arithmetic rather than two opinions of the same girl. See this file's header for why that reader
 *  is not here yet. */
export function formComposureDelta(form: number | undefined): number {
  return form === undefined ? 0 : form * ECONOMY.form.reader
}

// --- the two helpers, once ----------------------------------------------------------------------

function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x
}

function roundTenth(x: number): number {
  return Math.round(x * 10) / 10
}
