---
type: report
status: current
area: economy
last-reviewed: 2026-09-30
---
# Handoff – feat/secondary-market (30.09.2026)

## Shipped (stacked on ab6c8468, main's merge of the principles fix)
- S1 `883dca64` + S1b `1a290539` – ECONOMY.shop.secondary (6 families × 8 knobs + 8 shared),
  world/resale.ts: price corridor §2c with crash response and hangover, freshness-decay hazard with
  per-family floors and the thin-market dampener, assetSaleQuote (academy = the lot), medians true
  by construction (bisected peak, cumulative 0.500000000 at the median for all six).
- spec amendment `80c8f34c` – the hangover sags EVERY class (|crashShift|).
- S2 `6b8cdb0b` – schema v90 (listedWeek?, lastListing?; all four parts of the move + e2e fixtures
  + eleven coach-travel-edge hash cells re-stamped 37/37), listAsset/unlistAsset with engine-side
  refusals (academy = one atomic lot), the 12-week market memory, CRASH_EPOCH_WEEKS one spelling,
  the wave's strings table + whole-literal roundtrip pin.
- S3 `c75f0e4a`(+2 comment commits) – OfferKind 'sale', accumulating letters (1 draw/week/lot,
  2-week life), price printed on the paper, settleAssetSale extracted (one body, two doors),
  academy lot settles whole, unlist lapses letters, ▶▶ span stops on an arriving letter (collected
  stop), input-independence on two real 150-week careers, worth = the card's valueCents (parity).
- S4 `dc4b6738` – the fire sale is the only instant door (fireX × crash response); parked cash
  byte-identical three ways (twin + pinned figures + spy); 12 price pins re-aimed with ⚠.
- S5 `0be2875e` – SaleDialog (375×667 mutation-proved), listing badge/stale flip/Withdraw, buyer
  letter + info notice in the inbox, snapshot carries quote/listing/fire verbatim (no template
  math), SM7–SM26; fire door refuses a half-built academy; fixed a pre-existing a03 ratchet red.
- S6 `42c20f51` + S6b `eb3f8270` – tools/sale-probe.ts (windows/re-list/tail + the draw-free exact
  gate), quote.atHorizon + SM27, the game-clock age convention (ruling B), spec §2d measured column
  + §6 results; bench:econ byte-identical vs main (its policies never touch the shop).
- boundary `fb266035` – five enumeration ratchets met v90: counts 41→43, +2 d08 drivers, v90 in the
  migrated-heads list, and the S5 file's hand shim replaced by the T5.10 helper (a real RULE A catch).

## Open
- **The wording pass – SM1…SM27** (docs/plans/secondary-market-strings-2026-09.md), his, at the PR.
  ⚠ SM27 («…may be no buyer at all») shows on EVERY boat, plane, the brand and the academy (their
  p90 sits beyond the 520-week horizon by design); if that reads heavy in play, the lever is
  freshFloor per family, measured before moved.
- The popup does not pre-empt a half-built academy (List/Sell now drawn; the ENGINE refuses with
  the shipped sentence). A pre-emptive line is a wording call.
- The strings roundtrip pin cannot tell a comment quoting a word from code shipping it
  (comment-stripped matching would close it) – same family as the pending chip on the old waves'
  pins.
- No e2e exercises the popup/letters yet; the component project covers them (246 files green).

## Gates (30.09, quiet machine, verdicts from files with fresh mtime)
- check: CHECK_EXIT=0 (/tmp/sm-gate-check2.log 12:15, on fb266035)
- component: COMPONENT_EXIT=0 – 246 files (/tmp/sm-gate-comp2.log 12:16, on fb266035)
- sim: TESTSIM_EXIT=0 – 13 files in 450s (/tmp/sm-gate-sim.log, on eb3f8270; the two commits after
  touch only unit/component test files outside the sim project)
- e2e: E2E_EXIT=0 – 139 passed (/tmp/sm-gate-e2e.log, same note)
- capture 41550 / e6b0c709 unmoved in every step's own verify.
