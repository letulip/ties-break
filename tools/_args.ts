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
// `snapshot-bench.ts:53`, and `numOf` in `season-equation.ts:95`, are byte-identical bodies. All six
// are routed here.
//   ⚠⚠ `snapshot-bench` WAS THE ONE I FIRST REFUSED, AND THE PROOF IS WHAT CHANGED, NOT THE RISK.
//   Every numeric cell it prints is a `performance.now()` millisecond (`timeArm`, `:161-195`), so the
//   before/after output diff that certifies the other 30 migrations cannot certify that one. The
//   architect's answer, 28.09: an argument reader's correctness is «the same argv produces the same
//   parsed values», which is a UNIT assertion over a handful of argv shapes – a STRONGER proof than an
//   output diff, because it tests the function instead of a run that happens to contain it.
//   `tests/principles-t512-arg-readers.test.ts` drives both readers against the historical bodies they
//   replaced over thirteen argv shapes and asserts they agree on every one.
//   ⚠ `form-bench.ts:55`'s `num` is NOT routed, and it is a distinct behaviour rather than a copy: it
//   guards on `argv[i + 1] !== undefined` where `argOf` guards on truthiness, so `--sims ''` yields 0
//   there and the fallback here.
//
// WHAT DIFFERS BETWEEN THE TWO IS **THREE SHAPES, IN TWO DIRECTIONS** – and the unit arms above are how
// that is known, because my own first write-up of this file said «one case» and was wrong:
//
//   `--seeds abc`        `argOf` → **NaN**      `finiteArgOf` → the fallback
//   `--seeds --weeks`    `argOf` → **NaN**      `finiteArgOf` → the fallback   (same class: not a number)
//   `--seeds ''`         `argOf` → the fallback `finiteArgOf` → **0**          (the other direction)
//
// ⚠⚠ BOTH SURVIVE, AND THE OWNER'S SIDE OF IT IS THE RULING (the architect, 28.09), NOT TIDINESS.
// I had written that `finiteArgOf` «is the better rule» and that collapsing the first into it was a
// one-line follow-up. That is wrong for a MEASUREMENT INSTRUMENT, and the reason is worth more than the
// line it saves: **loud corruption is a feature here.** `NaN` poisons every derived cell visibly, so a
// bench run on a mistyped flag announces itself; a silent fallback hands a plausible, WRONG number to
// whoever quotes the bench into a spec, and nobody ever learns. A bench's arm is the thing a spec
// quotes, so the failure that must not be quiet is the one that changes the arm.
//   ⚠ And the third shape cuts against `finiteArgOf` on the same argument: `Number('') === 0` is
//   finite, so it INVENTS a zero for a flag it was handed nothing for, and zero is a plausible arm.
//   That is precisely the quiet substitution the paragraph above is about, which is the second reason
//   not to unify on it. Neither reader is simply better; each is loud where the other is quiet.
//
// ⚠ NO TOP-LEVEL SIDE EFFECTS – see `_stats.ts`. These read `process.argv` when CALLED, which is why
// a bench's `const SEEDS = argOf('seeds', 12)` still runs at the bench's own top level.

/** `--<name> <number>` out of the command line, else `fallback`.
 *
 *  ⚠ A NON-NUMERIC VALUE RETURNS **NaN**, NOT THE FALLBACK, AND THAT IS THE POINT rather than the
 *  compromise – see the ruling in the header. Lifted from the thirteen live copies at
 *  `dead-week-probe.ts:32`, `injury-landscape.ts:27`, `ladder-floor.ts:59`,
 *  `outgrown-entry-probe.ts:46`, `points-economy.ts:80`, `skill-ceiling.ts:73` and
 *  `world-turnover.ts:76`, plus the six spelled `flag` / `numOf` above. */
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
