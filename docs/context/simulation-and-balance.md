---
type: context-pack
status: current
area: simulation
canonical: true
last-reviewed: 2026-08-03
---

# Simulation and balance context

## Current truth

- The engine is TypeScript domain code independent of Vue and Pinia; the worker is its runtime
  owner, while tests and benches invoke engine functions directly.
- Careers are deterministic. The main RNG position is persisted, and most feature randomness uses
  purpose-scoped seed strings so player choices cannot reroll unrelated outcomes.
- Match scoring/outcomes are generated independently from visualization. Court animation,
  commentary, speed, and replay presentation must not change the result.
- Rankings use separate domestic and ITF-junior tracks, with pro-entry history now persisted at
  schema v36.
- Balance claims require distributions from tests or tools. A plausible anecdote is not a tuning
  result.

## Read order

1. The narrow module named by the task under `src/engine/match`, `season`, or `world`.
2. Its focused tests under `tests/match`, `tests/season`, or the matching root test.
3. `src/engine/world.ts` only when integration order or persistent state is involved.
4. The relevant specification and benchmark after the current code path is understood.

## Invariants

- Never call `Math.random()` inside the engine.
- Preserve main-stream input independence and purpose-scoped sub-stream naming.
- Do not tune a simulation number merely to satisfy one seed or UI example.
- Keep exact scoring rules in scoring modules rather than reimplementing them in UI code.
- A visualization consumes a match record; it cannot feed information back into the outcome.
- Changes affecting stored state follow the save-schema discipline in the saves context pack.

## Focused verification

- Match rules: `npm test -- tests/match/`
- RNG: `npm test -- tests/rng.test.ts tests/sim-worker-rng.test.ts`
- Rankings and fields: run the matching ranking, ladder, rival, or season tests.
- Fast unit gate: `npm test`
- Heavy calibration: `npm run test:sim`

The heavy simulation project is evidence for balance-sensitive work, not a routine first command
for UI or documentation changes.

## Broaden context when

- A change affects draw order, seed naming, a persisted field, ranking eligibility, or tournament
  selection.
- A measured adjustment crosses economy, fatigue, field strength, and progression simultaneously.

