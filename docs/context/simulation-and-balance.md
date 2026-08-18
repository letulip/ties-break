---
type: context-pack
status: current
area: simulation
canonical: true
last-reviewed: 2026-08-03
---

# Simulation and balance context

## Current truth

- The engine is TypeScript domain code independent of Vue and Pinia; the worker owns it at runtime,
  while tests and benches call engine functions directly.
- Careers are deterministic: the main RNG position is persisted, and feature randomness uses
  purpose-scoped seed strings so player choices cannot reroll unrelated outcomes.
- Match outcomes are generated independently of visualization: animation, commentary, speed and
  replay must not change the result.
- Rankings keep three tables, not two (`LadderTrack`): domestic, ITF junior and the adult WTA one –
  a seventeen-year-old holds two at once, and a junior Slam pays zero WTA points. Pro-entry history
  is persisted; the saves pack holds the schema number, not this file.
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
- Do not tune a number merely to satisfy one seed or UI example.
- Keep exact scoring rules in scoring modules, never reimplemented in UI code.
- A visualization consumes a match record; it cannot feed information back into the outcome.
- Changes affecting stored state follow the save-schema discipline in the saves context pack.
- The tour age grid (tier floors, U18 ceiling, AER per-year counts) is in prose in exactly one place:
  [college is its own branch §0a](../specs/college-is-its-own-branch-2026-08.md). Link to it; restating
  it is how the corpus grew two documents that disagreed about a W15 field.

## Focused verification

- Match rules: `npm test -- tests/match/`
- RNG: `npm test -- tests/rng.test.ts tests/sim-worker-rng.test.ts`
- Rankings and fields: run the matching ranking, ladder, rival, or season tests.
- Fast unit gate: `npm run test:quiet`
- Heavy calibration: `npm run test:sim`

The sim project is evidence for balance work, not a routine first command.

## Broaden context when

- A change affects draw order, seed naming, a persisted field, ranking eligibility, or tournament
  selection.
- A measured adjustment crosses economy, fatigue, field strength, and progression simultaneously.

