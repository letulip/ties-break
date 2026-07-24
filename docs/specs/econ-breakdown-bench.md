# Spec: Money breakdown/ledger truth + economy bench + travel-by-background

Branch: `feat/econ-breakdown-bench` (worktree `tb-econ`, off origin/main).
Architect: Fable. Implementer: subagent, strict TDD. Gate: architect.

## Why

1. **Money BREAKDOWN + LEDGER are starved.** Both `MoneyScreen.vue` breakdown
   (`windowEvents`) and ledger (`ledgerGroups`) read `snapshot.events`, which is the
   last **60 MIXED events** (`SNAPSHOT_EVENTS = 60`, all types: match/news/milestone/
   tournament + finance). A tournament week emits 8–12 events, so the "12 weeks" and
   "this season" breakdowns actually cover ~5–10 weeks. Even `EVENTS_CAP = 400`
   (engine retention) prunes old finance, so we cannot fix this by reading events at all.
   Fix = an aggregate maintained in world state that **survives pruning**.

2. **Economy bench** (owner request): a headless "how much does a season eat" tool so
   we stop hand-clicking difficulty branches. Same category aggregation feeds it.

3. **Travel-by-background** (owner request): wealthier families' travel costs more,
   poorer less. Middle stays the current baseline; working ≈ −25%, wealthy ≈ +25%.

This spec covers **Part A** (breakdown/ledger fix) and **Part B** (travel-by-background)
— implement BOTH now. **Part C** (bench) is documented for the next agent; do NOT build it.

## Invariants you must not break

- **RNG replay identity.** The per-week draw COUNT on the MAIN weekly stream must not
  depend on player input or background. Any new scaling is a POST-draw multiply of an
  already-drawn value (same pattern as `ECONOMY.bgExpenseFactor`). The cohort-drift /
  identity guard test must stay green.
- **Append-only migrations.** Never rewrite an existing migration step. Bump the schema
  and add ONE new step. Old golden saves must still load.
- **Dash rule.** All player-facing copy uses the short dash `–`, never `—`. (Comments are
  exempt but don't introduce `—` in new copy.)
- Do NOT touch `docs/decisions.md`. Do NOT `git push`. Work only in this worktree.

---

## Part A — Breakdown/ledger truth (engine-side aggregate)

### A1. Persisted aggregate on the world (survives pruning)

Add to `WorldState` (world.ts) a trailing per-week, per-category finance ledger:

```ts
// Signed cents per (week, category): income positive, expense negative — matches the
// event convention. One entry per week that had >=1 financial event, week-ascending.
export interface FinanceWeek {
  week: number
  byCategory: Partial<Record<WorldEventCategory, number>>
}
// on WorldState:
financeWeeks: FinanceWeek[]
```

- **Accumulate at the single choke point `addEvent`**: when `e.amountCents !== undefined`,
  add `e.amountCents` into `financeWeeks` for `e.week` under `e.category ?? 'other'`
  (find-or-create the week entry; keep the array week-ascending). This captures every
  finance emit (income/coaching/sponsor/gear/stringing/travel/entry) with zero call-site
  changes. `amount === 0` sponsored line-items may be skipped (no cash movement) — either
  is fine; be consistent and test it.
- **Prune** in the same place events are pruned (or right after tick): drop `financeWeeks`
  entries with `week < currentWeek - 59` (retain a 60-week trailing window — covers both
  the 12-week and a full 52-week season window with margin). This keeps the structure
  tiny (≤ ~60 entries) and bounded by career length, not event volume.

### A2. Pure windowing helper

```ts
export interface FinanceWindow {
  startWeek: number
  byCategory: Partial<Record<WorldEventCategory, number>> // signed
  incomeCents: number   // sum of positive across all categories
  expenseCents: number  // magnitude of negative (positive number)
  netCents: number      // income - expense (== sum of signed)
}
export function financeWindow(financeWeeks: FinanceWeek[], fromWeek: number): FinanceWindow
```

Pure, no world dependency (so the bench and tests call it directly). Sums entries with
`week >= fromWeek`.

### A3. Snapshot exposure (protocol.ts + toSnapshot)

- Add to `Snapshot`:
  ```ts
  /** category-accurate spending/income over full retained history (survives the 60-event
   *  cap). window12w = last 12 weeks; season = current 52-week season block. */
  finance: { window12w: FinanceWindow; season: FinanceWindow }
  /** most recent financial transactions (amountCents present), newest-last, up to 50 –
   *  independent of the mixed 60-event `events` cap so the ledger isn't starved by news. */
  financialEvents: WorldEvent[]
  ```
- In `toSnapshot`, compute:
  - `window12w` start = `world.week - 11`.
  - `season` start = `Math.floor(world.week / 52) * 52` (KEEP the current MoneyScreen
    semantics — the reported bug is starvation, not the boundary; do not redefine "season").
  - `financialEvents` = the last 50 events (any retained) with `amountCents !== undefined`,
    chronological.

### A4. MoneyScreen.vue consumes the aggregate (no more event filtering)

- **Breakdown**: replace `windowEvents` / `expenseRows` / `incomeCents` so they read
  `snapshot.finance[breakdownWindow === '12w' ? 'window12w' : 'season']`:
  - expense rows from `byCategory` (negative entries, mapped to `EXPENSE_META` buckets,
    unknown → `other`), magnitudes, sorted desc, donut unchanged.
  - income row from `.incomeCents`.
  - Keep the `'12w' | 'season'` toggle and the `breakdownWindow` ref (do NOT rename to
    `window` — Vue global-allowlist footgun).
- **Ledger**: `ledgerGroups` reads `snapshot.financialEvents` instead of
  `snapshot.events.filter(...)`. Balance-after still reconstructs backwards from live
  `fundsCents` (correct for the shown slice). Group-by-week + newest-first unchanged.
- Update the top-of-file comment block (it currently says the breakdown is "a recent-
  spending picture, not the full-career audit trail" — it is now window-accurate).

### A5. Schema + migration + golden

- Bump `SAVE_SCHEMA_VERSION` 10 → 11 (world.ts).
- Add migration step `v10 → v11` in `migrations.ts` (append-only, follow the existing
  per-version pattern): initialise `financeWeeks`. Best-effort **rebuild from retained
  `events`** (they carry `week` + `category` + `amountCents`), then prune to the 60-week
  trailing window. Old pruned history is unrecoverable — that's acceptable; the aggregate
  is exact going forward and approximate for the pre-migration tail.
- `seedWorldForV6` / any fresh-world constructor must init `financeWeeks: []`.
- Update the golden-save corpus + guard test so all v0..v11 load and round-trip. Add a
  v11 fixture if the corpus convention has one per version.

### A6. Tests (TDD — write first)

- `financeWeeks` accumulates every finance category at the right week; non-financial
  events don't touch it.
- Pruning drops entries older than `week-59` and keeps the rest.
- `financeWindow` sums a known fixture correctly (byCategory / income / expense / net).
- Snapshot `finance.window12w` and `.season` are **immune to the 60-event cap**: build a
  world where a busy tournament stretch pushes finance events out of the trailing 60
  `events`, and assert the breakdown totals still include them (this is the regression
  that reproduces the owner's bug — MUST fail before the fix, pass after).
- `financialEvents` contains only `amountCents` events and is not starved by news events.
- Migration v10→v11 on a golden v10 save loads and yields a valid `financeWeeks`.
- Identity/cohort-drift guard still green.

---

## Part B — Travel by family background

Owner: middle = current baseline; working ≈ −25%; wealthy ≈ +25% (he said ±20–30%).

- Add to `ECONOMY` (economy.ts):
  ```ts
  // Travel scales with family means (wealthier travel = pricier + a money-sink; poorer =
  // cheaper). middle = 1.0 (baseline unchanged). POST-draw multiply only — the travel
  // pickInt draw stays byte-identical so the RNG identity holds.
  travelBgFactor: { working: 0.75, middle: 1.0, wealthy: 1.25 } as Record<FamilyBackground, number>,
  ```
- Apply as a **post-draw** scaling of the drawn `travelCostCents`
  (`calendar.ts:105-106` draws `pickInt(rng, lo, hi)`; scale the RESULT by
  `travelBgFactor[background]`, `Math.round`). The scaled value must be what is BOTH shown
  in `UpcomingEvent.travelCostCents` and charged in `enterEvent` (world.ts:398/404) — one
  final value, no divergence. If `generateSeason` doesn't currently receive `background`,
  thread it through (it's a pure profile input, not RNG — safe).
- Tests: for the same seed+event, `working < middle < wealthy` travel; middle equals the
  pre-change baseline (pin a byte value); identity guard still green.

---

## Part C — Economy bench (NEXT agent, do NOT build now)

Documented so Part A lands aggregate-first. Headless (`tools/econ-bench.ts` + npm script):
- Presets = real difficulty tiers **8k / 25k / 120k** (working/middle/wealthy), 30 seeds
  each, Monte-Carlo (one season is noisy — average).
- Per seed: run one 52-week season headless (createWorld + tickWeek + skipTournament, like
  the `run()` helper in tests), with a documented **entry policy** (v1: enter every
  eligible event the kid can afford entry+travel for at that week). Read the season's
  category totals via `financeWindow(world.financeWeeks, seasonStart)`.
- Output: per preset, mean ± spread of {byCategory expenses, income, gross expense, net,
  end funds, weeks-to-bankrupt, peak deficit}. Console table + CSV to scratch.
- The entry policy materially drives the numbers — surface it, don't hide it.

## Gates (architect runs before any push)

`npx vue-tsc -b` = 0 · `npx vitest run` all green (incl. new tests) · `npm run build` clean ·
dash sweep clean in changed player-facing copy · browser spot-check of the Money screen
(breakdown 12w vs season now diverge correctly across a long, tournament-heavy save).
