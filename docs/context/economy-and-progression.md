---
type: context-pack
status: current
area: economy
canonical: true
last-reviewed: 2026-08-03
---

# Economy and progression context

## Current truth

- Monetary state and events use signed integer cents, at rest and across the protocol. Shared
  formatting helpers are the UI boundary; conversion happens only for presentation.
- The economy covers starting-funds bands, parent income, recurring costs, travel and entries,
  equipment, academy, sponsors, prize money, savings interest and medical costs.
- Financial events feed a persisted category ledger used by Money surfaces and season summaries.
- Development, condition, coaching load, injuries, recovery, equipment and calendar commitments
  interact; one isolated knob can move several career distributions.
- Bankruptcy is one of six shipped terminal states (`CareerEndingType`), not the only stop, and a
  spell rather than a floor: `ENDINGS.bankruptcyGraceWeeks` is 12 and one solvent week clears it,
  so a single medical bill cannot end a career. Endings landed at v39 – v37/v38 went to the kit
  ladder and the penalty ledger, so no version is "reserved". Psyche/morale is still unshipped.

## Read order

1. `src/engine/economy.ts` for constants and pure money rules.
2. The focused engine leaf: development, condition, coach/load, equipment, academy, injury, offers,
  sponsors, entries, or planner.
3. `src/engine/world/ledger.ts` and `world.ts` for integration order.
4. Matching unit tests, then the relevant bench spec/tool.

## Invariants

- Every non-zero financial event has the right sign and category and folds into the ledger.
- Purpose-scoped economic randomness must not consume the main stream accidentally.
- Balance changes start with a hypothesis and baseline, then report the same metrics after.
- Do not promise economy in player-facing copy before its mechanic and tests exist.

## Focused verification

- `npm test -- tests/economy.test.ts tests/finance.test.ts tests/prize-money.test.ts`
- `npm test -- tests/condition.test.ts tests/injuries.test.ts tests/coach-load.test.ts`
- Distributions: `npm run bench:econ`, `npm run bench:fatigue`
- `npm run test:sim` when distribution gates are touched

## Broaden context when

- A number affects entry decisions, field quality, fatigue, injury risk or survival at once.
- A change adds a ledger category, save field, sponsor obligation or terminal condition.

