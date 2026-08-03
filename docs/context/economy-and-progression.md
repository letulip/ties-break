---
type: context-pack
status: current
area: economy
canonical: true
last-reviewed: 2026-08-03
---

# Economy and progression context

## Current truth

- Monetary state and events use signed integer cents. Shared formatting helpers are the UI boundary;
  domain modules do not invent local dollar/cents conversions.
- The economy includes starting-funds bands, parent income, recurring costs, travel and entries,
  equipment, academy support, sponsors, prize money, savings interest, and medical costs.
- Financial events feed a persisted category ledger used by the Money surfaces and season summaries.
- Development, condition, coaching load, injuries, recovery, equipment, and calendar commitments
  interact; changing one isolated knob can move several career distributions.
- Bankruptcy is currently a stop reason when funds cross below zero, not a complete terminal career
  state or epilogue. Save versions v37 and v38 remain reserved for endings and psyche work.

## Read order

1. `src/engine/economy.ts` for constants and pure money rules.
2. The focused engine leaf: development, condition, coach/load, equipment, academy, injury, offers,
  sponsors, entries, or planner.
3. `src/engine/world/ledger.ts` and `world.ts` for integration order.
4. Matching unit tests, then the relevant benchmark specification/tool.

## Invariants

- Money is cents at rest and across the protocol; conversions happen only for presentation.
- Every non-zero financial event has the correct sign and category and folds into the ledger.
- Purpose-scoped economic randomness must not consume the main stream accidentally.
- Balance changes start with a written hypothesis and baseline, then report the same metrics after.
- Do not add an economy promise to player-facing copy before its mechanic and tests exist.

## Focused verification

- `npm test -- tests/economy.test.ts tests/finance.test.ts tests/prize-money.test.ts`
- `npm test -- tests/condition.test.ts tests/injuries.test.ts tests/coach-load.test.ts`
- Economy distributions: `npm run bench:econ`
- Fatigue distributions: `npm run bench:fatigue`
- Full simulation project when distribution gates are touched: `npm run test:sim`

## Broaden context when

- A number affects entry decisions, field quality, fatigue, injury risk, or survival simultaneously.
- A change adds a new ledger category, save field, sponsor obligation, or terminal condition.

