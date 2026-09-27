// THE BENCHES' COMMAND-LINE ARM SWITCHES – `--seeds 30`, `--weeks 780`, `--policy 1`.
// (T5.12 · F-04, 27.09. Siblings: `tools/_stats.ts`, `tools/_fmt.ts`.)
//
// ⚠⚠ NINETEEN LIVE TOOLS SPELLED THIS AND THERE ARE **TWO** RULES, NOT ONE, SO THERE ARE TWO
// FUNCTIONS HERE. F-04 counted 13 definitions named `argOf` in 11 distinct bodies across `tools/`; on
// the live set the 13 collapse to two behaviours once the noise is normalised away, and the noise was
// genuinely noise – `args` versus `argv` versus `process.argv` for the same
// `process.argv.slice(2)`, and an `at > 0` guard that can never fire because a `--flag` cannot be
// `process.argv[0]` (the node binary) or `[1]` (the script).
//
// ⚠ AND SIX MORE WERE INVISIBLE TO THAT CENSUS BECAUSE IT GREPS FOR THE NAME, AT COLUMN 0: `flag` in
// `chemistry-bench.ts:90`, `load-bench.ts:72`, `radar-bench.ts:67`, `r44-decline-seats.ts:105` and
// `snapshot-bench.ts:53`, and `numOf` in `season-equation.ts:95`, are byte-identical bodies. Five of
// the six are routed here.
//   ⚠ `snapshot-bench` KEEPS ITS COPY, and the reason is the PROOF and not a preference: every
//   numeric cell it prints is a `performance.now()` millisecond (`timeArm`, `:161-195`), so the
//   before/after output diff that proves every other migration in T5.12 cannot be taken for it.
//   `tests/principles-t514-merged-families.test.ts` records that exemption with the same reason.
//   ⚠ `form-bench.ts:55`'s `num` is also NOT routed, and it is a FIFTH behaviour rather than a copy:
//   it guards on `argv[i + 1] !== undefined` where `argOf` guards on truthiness, so `--sims ''`
//   yields 0 there and the fallback here.
//
// WHAT ACTUALLY DIFFERS IS ONE CASE: `npm run bench:x -- --seeds abc`.
//
//   `argOf`        → `Number('abc')` = **NaN**, and the bench walks NaN seeds.
//   `finiteArgOf`  → the fallback, and the bench runs its default arm.
//
// Both are below, verbatim, because each is what its benches have always done and a bench's arm is
// the thing a spec quotes. ⚠ THE SECOND IS THE BETTER RULE and collapsing the first into it is a
// one-line follow-up – but it is a behaviour change to how a mistyped arm is handled, it cannot be
// seen in any bench's output (every run in this repo passes well-formed arms), and «measured, not
// guessed» cuts both ways: an invisible change is exactly the kind that needs asking first.
//
// ⚠ NO TOP-LEVEL SIDE EFFECTS – see `_stats.ts`. These read `process.argv` when CALLED, which is why
// a bench's `const SEEDS = argOf('seeds', 12)` still runs at the bench's own top level.

/** `--<name> <number>` out of the command line, else `fallback`.
 *
 *  ⚠ A NON-NUMERIC VALUE RETURNS **NaN**, NOT THE FALLBACK. That is this body's own behaviour, lifted
 *  from the twelve live copies at `dead-week-probe.ts:32`, `injury-landscape.ts:27`,
 *  `ladder-floor.ts:59`, `outgrown-entry-probe.ts:46`, `points-economy.ts:80`, `skill-ceiling.ts:73`
 *  and `world-turnover.ts:76`, plus the five spelled `flag` / `numOf` above. Prefer `finiteArgOf` in
 *  anything new. */
export const argOf = (name: string, fallback: number): number => {
  const args = process.argv.slice(2)
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}

/** `--<name> <number>` out of the command line, else `fallback` – and a value that is not a finite
 *  number IS the "else", so a mistyped arm runs the default rather than NaN.
 *
 *  Lifted from the six live copies at `coach-raise-bench.ts:58`, `frozen-key-diff.ts:16`,
 *  `masseur-raise-bench.ts:44`, `r31-age-curve.ts:52`, `small-talk-corpus-bench.ts:82` and
 *  `wedding-bench.ts:85`. (Four of the six carried an `at > 0` guard and two did not; the guard is
 *  unreachable either way, so this is one body and not two.) */
export const finiteArgOf = (name: string, fallback: number): number => {
  const at = process.argv.indexOf(`--${name}`)
  const n = Number(process.argv[at + 1])
  return at > 0 && Number.isFinite(n) ? n : fallback
}
