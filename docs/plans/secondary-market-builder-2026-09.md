---
type: plan
status: current
area: economy
last-reviewed: 2026-09-26
---
# The secondary market – builder plan (2026-09)

The spec, with the owner's words and the open rulings:
[secondary-market-2026-09.md](../specs/secondary-market-2026-09.md). Read it first; this file is
only the order of work.

**When**: after the principles waves (fix/principles-w1…w7) have merged – his «после ревью». One
branch, `feat/secondary-market`, off `main` at that point. Spec §5's rulings are ANSWERED (26.09) –
every step below is free to start; the strings stay DRAFTs for his wording pass as always.

House law that binds every step: pathspec commits, never `--amend`; gate verdicts from files with
fresh mtime; every new player-facing string is a DRAFT for his wording pass (invariant 4); no
`Rng` argument and no MAIN draw anywhere in the new code – sub-streams
`${seed}:sale:${itemId}:${week}` only (invariant 2).

## S1 · The corridor and the quote – pure reads, no behaviour change

- `ECONOMY.shop.secondary`: one row per family (car, house, boat, plane, business, academy) with
  the six knobs of spec §2d. Values from the spec table; they are starting points, S6 measures.
- New leaf `src/engine/world/resale.ts` (the `assets.ts` pattern: answers questions, never writes):
  - `assetSaleQuote(world, itemId)` → `{ weeksLo, weeksHi, corridorLoCents, corridorHiCents,
    fireCents }` – §2g's one primitive. For the academy it quotes the LOT (every delivered stage).
  - `saleOfferPriceCents(world, itemId, week)` – §2c's formula, drawn on
    `rngFromSeed(`${seed}:sale:${itemId}:${week}:price`)`, reading `assetWorthCents` at `week` and
    the crash depth off `world/market.ts` (the SAME path the fund rides – no second market). The
    response carries §2c's hangover: for ~half a season after an arc closes, a small opposite-sign
    residual decaying to zero (his «может даже чуть ниже на какое-то время»).
  - `buyerWritesThisWeek(world, itemId, week)` – §2d's hazard, crash-scaled per class, its own
    `:knock` sub-stream – times the FRESHNESS curve (decay from the class peak to the class floor
    over ~1–1.5× median, resumed from `lastListing` inside the ~12-week memory window, §2i) and the
    thin-market dampener (worth against the class entry rung – the $300k car waits seasons).
  - The quote gains `staleWeeks` – the deterministic week the freshness floor is reached – and a
    thin-market predicate for the popup's «may not sell at all» line (§2i; parity law – the screen
    prints, never derives).
- Tests (`tests/resale-quote.test.ts`): corridor bounds honoured incl. the ~1.05 cap; crashShift
  signs (a crash week LOWERS a plane's draw and RAISES a house's – mutate the sign, watch it fail);
  the hangover (a house week shortly AFTER an arc sits a touch below base, and half a season later
  it does not); freshness monotone down to a NON-ZERO floor, and the floor by class (boat « house);
  the thin dampener (the elite car's hazard below the sensible car's – mutate the exponent, watch
  it fail); the memory window (re-list at week +8 resumes old staleness, at week +20 starts fresh);
  stale drift monotone; same seed+week+item → identical price (reproducibility); academy quote =
  sum of delivered stages through the corridor; zero MAIN draws (the arity rule: no function in
  `resale.ts` takes an `Rng`).

## S2 · Schema v90 – the listing and its commands

- `OwnedAsset.listedWeek?: number` and `lastListing?: { endedWeek, exposedWeeks }` (§2i – written
  by `unlistAsset` and by a settle, read by the freshness resume); `SAVE_SCHEMA_VERSION` 89 → 90; append-only migration (the
  version step – the field is optional); golden fixture `tests/fixtures/saves/`; regenerate
  `e2e/fixtures`. The full three-part move plus e2e regen – `tests/goldenSaves.test.ts` holds it.
- Protocol + worker: `listAsset { itemId }`, `unlistAsset { itemId }` (messages.ts, sim.worker.ts
  mutate handlers). Engine commands live in `world/shop.ts` beside `buyAsset`/`sellAsset`, guards
  re-validated engine-side: owned; `sellableAsset` (delivered); a THING (a row whose item is not
  parked cash – the deposit and fund refuse with today's instant path untouched); not already
  listed; `guardNotEndedForGood`.
- The academy is family-scoped (spec §2e): `listAsset('academy')`-shaped or equivalent – listing
  marks every delivered academy row as one lot, refuses while any stage is in delivery; `unlist`
  clears the lot together.
- Feed lines on list/withdraw (`addEvent`, category `shop`, amount-less) – DRAFT strings.
- Tests: golden fixture; each guard refuses (incl. fund/deposit and the half-built academy);
  list → unlist round-trip leaves the world byte-identical but for the feed.

## S3 · The buyer letters

- `Offer` kind `'sale'`, `SaleOfferTerms { itemId, priceCents }` – the price printed on the paper,
  never recomputed at accept (offers-and-the-inbox law). Deadline: arrival week + 2 (ruling §5.2).
- `raiseSaleOffers(world)` in `engine/offers.ts` beside its siblings: for each listed lot, ask
  `buyerWritesThisWeek`; on true, write a letter priced by `saleOfferPriceCents`. **Letters
  accumulate** (ruling §5.2, the sponsor window's pattern): one draw a week per lot, each letter
  standing 2 weeks, so several can be open at once and the parent picks. Wire into the tick where
  `raiseKitOffers` is called (`world/multiWeek.ts`).
- `signOffer` on `'sale'`: re-validate (still owned, still listed, still delivered), then settle
  through **`settleAssetSale(world, itemId, priceCents)` – extracted from today's `sellAsset` body**
  so the ledger sentence, the wallet move and the brand's own filters stay one body, two doors
  (spec §2h). The academy lot settles every stage in one signing, one ledger row.
  Settling also EXPIRES the lot's other open sale letters – the thing is sold and the paper says
  so. `refuseOffer` / expiry (`expireOffers` already sweeps): the listing simply continues.
- `unlistAsset` expires the lot's open sale letters (ruling §5.3) – the buyers walk.
- **The stale prompt (§2i)**: the week a listing reaches its freshness floor (`staleWeeks` – a
  deterministic week, so no flag is stored: raise exactly when `week` equals it and the listing is
  still live), raise ONE `'info'` letter – no sign/refuse – saying interest has gone quiet, naming
  the wait-or-withdraw pair. DRAFT string.
- An unanswered sale letter must NOT join the ▶▶ blockers – assert the fast-forward guard list is
  unchanged (`tests/dev-fast-forward.test.ts` untouched and green).
- Tests (`tests/resale-letters.test.ts`): a ticked listed world raises letters and an unlisted one
  never does; two letters CAN stand open on one lot, and signing one expires the rest; sign settles
  (money in, row gone, `listedWeek` cleared, ledger sentence); refuse and expiry both leave the
  listing live; the academy signing empties all stages; **the MAIN capture pin (41550 / e6b0c709) does not move** – run `tests/condition.test.ts`;
  input-independence: a career that lists-and-refuses everything and a career that never lists tap
  identical MAIN sequences (the `round29p3-market` test's shape).

## S4 · The fire sale (ruling §5.1: «да»)

- `assetSaleQuote(...).fireCents` becomes the settle price of the INSTANT `sellAsset` for things;
  parked cash keeps full-value instant partial sales, bit for bit (its guards and rounding are
  round-30 law – do not touch that arithmetic). Ledger sentence variant for a fire sale – DRAFT.
- Tests: a thing's instant sale lands `fireCents` and says so; the fund's partial sale is
  byte-identical to today (pin against a walked world before/after the wave's code path).

## S5 · The screens (strings are DRAFTs for his wording pass)

- Snapshot: `ShopRowView` gains `listing?: { sinceWeek }` and `quote?` (the engine's
  `assetSaleQuote` verbatim) – the parity law: the screen prints, never derives.
- MoneyScreen: «Sell» on a thing opens the §2g dialog – the quote's weeks and corridor, the academy
  one-lot warning line when the row is academy, the thin-market «may not sell at all» line when the
  quote's predicate says so (§2i), buttons List / Sell now / keep. A listed row shows the badge and
  «Withdraw»; past `staleWeeks` the badge reads stale. All strings DRAFT.
- `OfferLetter.vue`: the `'sale'` letter – asset label, the price, the deadline, Accept/Decline
  through the existing sign/refuse controls.
- Mounted tests (`tests/component/`): the dialog's dismiss control inside 375×667 **with the
  mutation proving the too-tall version fails** (the dialog law); the quote on screen moves when
  the engine quote moves (mutate the engine value, watch the screen test fail); the academy dialog
  carries the warning line and a car's does not; the thin-market line appears on the elite car and
  not on the first house.

## S6 · Measure, tune, document, gate

- `tools/sale-probe.ts` (the `market-probe` pattern): across seeds × classes × listing weeks –
  weeks-to-sale p10/p50/p90, mean price/worth, split three ways: quiet, in-arc, and the hangover
  half-season after an arc (ruling §5.4); the share unsold at 2× median per class and price rung,
  and the re-list effect inside vs after the memory window (§2i). Fill spec §2d's measured column; misses against the proposed numbers explained in the spec (invariant 5).
- `npm run bench:econ` – the shelf's own bench must not drift.
- Docs: decisions entry for his rulings + `npm run decisions`; spec status line flipped.
- Gates and PR via the `pull-request` skill: `npm run check`, `test:sim`, `test:e2e`, verdicts from
  files with fresh mtime, never while agents run.

## Proof discipline

Every test above names its mutation (break the thing, watch it fail) before its green run is
believed – the house rule. The wave touches money, so `NaN`/zero/negative guards follow
`sellAsset`'s own «!(asked > 0)» shape wherever an amount crosses the wire.
