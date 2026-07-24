# Spec: Season Life slice 1 — increment 2: fix the rank ladder + travel corridors

Branch: `feat/ranking-gate` (worktree `tb-season`, continues on top of commit f044fa7).
Architect: Fable. Implementer: subagent, strict TDD. Gate: architect.

Two changes, both owner-approved. Bench (`npm run bench:econ`) is the validation tool for both.

## A. Fix the rank ladder — a new kid must climb from the BOTTOM

**Problem the bench surfaced:** with the slice-1 gate live, `local` is essentially never played
(entries: local ~0, regional ~15, national ~8) and a brand-new kid can enter the TOP tiers
immediately. Cause: a point-less kid, ranked among a cohort where many also sit at ~0 points, lands
near the TOP of the ranking (ties at 0 collapse to a high rank), so the eligibility band opens
`national`/`regional` at once and closes `local` ("outgrown") — the intended
`local → regional → national` climb is INVERTED.

**Fix (preferred: points-based eligibility).** Base tier eligibility on the kid's EARNED ranking
points (an absolute measure of achievement), not the dense/competition rank POSITION:
- A fresh kid has ~0 points → only `local` is open (the entry tier).
- `regional` opens once points cross a low threshold; `national` once they cross a higher one.
- Graduation still works both ways: `local` closes once points exceed its ceiling (she's outgrown it).
- Bands become point thresholds (provisional — TUNE on the bench). Keep the both-directions window
  idea: each tier is `[minPoints, maxPoints]` (maxPoints = ∞ for national's top, minPoints = 0 for
  local's bottom) so the "always at least one tier eligible" invariant holds.

(Acceptable alternative if points-thresholds prove awkward: keep the rank-band model but compute the
eligibility rank so an UNRANKED kid — no counting results / 0 points — is the WORST rank, i.e.
local-only, until she earns results. Pick whichever yields the clean ladder; justify in the report.)

The kid's counted points are already available (`countingResults` / the ranking machinery). Thread
whatever measure you choose into `isTierEligible` (its inputs may change — update all callers:
`enterEvent`, `upcomingEvents`, the bench, tests).

**Validation on the bench:** a fresh career must show a real early `local` phase (local entries > 0
early in the season) and a `local → regional → national` progression across the season — NOT
`local 0 / national from week 1`. Re-tune thresholds so total entries stay realistic (~15–25/season).

## B. Travel corridors — per-trip random within a background band

Owner: price sits in a corridor for EVERY tier (not a fixed multiplier). Change
`ECONOMY.travelBgFactor` from fixed scalars to corridors:

```ts
travelBgFactor: {
  working: [0.70, 0.80],
  middle:  [0.95, 1.05],
  wealthy: [1.20, 1.30],
} as Record<FamilyBackground, [number, number]>,
```

Draw a per-event factor and apply it to the base travel:
- The base `travelCostCents` (the `pickInt(rng, lo, hi)` in calendar.ts) stays **as-drawn and
  background-independent** — do NOT change that draw (keeps the calendar structure + RNG identity).
- Draw the corridor factor from a **purpose-scoped sub-stream keyed by the event** (e.g.
  `rngFromSeed(`${seedStr}:travelbg:${week}:${tier}`)`), take one uniform [0,1) `roll`, and map it:
  `factor = lo + roll * (hi - lo)` with `[lo,hi] = travelBgFactor[background]`. Apply
  `Math.round(baseTravel * factor)`. Same roll across backgrounds → consistent relative draw, only
  the corridor differs. This sub-stream is independent of BOTH the main weekly stream and the
  calendar generation stream, so it is identity-safe.
- The single factored value must be what is shown (`UpcomingEvent.travelCostCents`) AND charged
  (`chargeTravel`) — no divergence (same as today).

**Consequence:** `middle` is no longer exactly ×1.0, so the byte-identical middle travel PIN
(`buildSeason('travel-pin', …) === 31564`) will change. UPDATE that test: assert instead that (a)
each background's factored travel stays within its corridor of the base, and (b) the average ordering
`working < middle < wealthy` holds. The cohort-drift / 520-week identity guard must stay green
(replay determinism is preserved — the factor stream is deterministic).

## Gate (implementer runs, architect re-gates)
`npx vue-tsc -b` = 0 · `npx vitest run` all green (updated pins) · `npm run build` clean · dash sweep ·
`npm run bench:econ` re-run PASTED in the report, showing: (1) an early `local` phase + a
`local→regional→national` progression (ladder fixed), and (2) travel varying within each corridor,
ordering working<middle<wealthy. No `git push`. Commit to `feat/ranking-gate`. Do not touch
`docs/decisions.md`. Player-facing copy uses the short dash `–`.
