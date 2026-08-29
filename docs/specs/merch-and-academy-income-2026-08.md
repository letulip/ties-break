---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-29
---

# Merch and the academy that earns (round 29 part four P7, parts 2+3, built 29.08.2026)

**His order, verbatim:** «нам нужен мерч, растущий от частоты и обилия рекламных контрактов,
съемок, выступлений, титулов и прочего» and «нам нужна академия, которая зарабатывает» –
«Посчитать сколько должна приносить академия или поискать в интернете на примере Надаля». The
chain is his own economy loop, stated end to end in the ledger: **early and plentiful contracts →
shoots → fame → merch income → the academy.** Part 1 (the ad portfolio) shipped first on
`r29p4/ad-portfolio`; this wave builds parts 2 and 3 ON it – the shoot records the portfolio
already writes per deal are exactly the fuel the fame stock folds.

Branch `r29p5a/merch-and-academy-income`. Schema **65 → 66** – the one genuine bump of the wave,
said loudly below.

## 1. Fame – the accounted stock, first shipped here

[fame-and-the-shoots-2026-08.md](fame-and-the-shoots-2026-08.md) §3, implemented exactly:
`world/fame.ts`, **a pure fold over records the world already persists and never prunes – zero
draws, nothing persisted, derived on every read.**

* **The floor is earned on court** (his «здесь полностью согласен»): dated titles by tier off
  `trophiesByTier[tier].titles` (weeks, append-only) – slam 25 · wta1000 14 · wta500 8 · wta250 4
  · wta125 2 · the W-series 0.25–1.5, junior and domestic rungs **zero** (the world does not read
  junior draws); a LOST Slam final 12 (the one runner-up plate the world remembers – `finals` at
  every other tier counts nothing); a season ended inside the WTA top 10 (`seasonHistory[]
  .byTrack.wta.endRank`) 10, decaying from its own wrap week.
* **The shoots MULTIPLY it** – each shoot week already LIVED (signed `'ad'` letters'
  `shootWeeks`, the P6 portfolio's own per-deal record; a week the college freeze swallowed
  lapsed and buys nothing) adds ×0.05, decayed like everything else, capped at **×2**: the
  photographs can at most double what the court earned, and zero floor times any number of
  photographs is zero – Świątek does not need the shoots, and a face with no results has nothing
  to multiply. Twelve fresh shoots ≈ ×1.6, enough to reorder two comparable floors – the census's
  #30-on-court / #2-off-court shape – never enough to make a face out of nothing.
* **Slow decay**: every contribution halves in **104 weeks** (two seasons), so a reign stays
  famous through itself and fades over four to six seasons – «a rolling memory, not a trophy»,
  and the answer to the spec's own «a stock that only rises is a rank by another name».
* Bounded 0–100, fractional in the engine, **rounded once at the snapshot boundary**
  (`Snapshot.fame` – `condition`'s own rule). Surfaced modestly where the sponsors live: one
  sentence on the Bills portfolio card. ⚠ **The fame-GATED advertising ladder (spec §4.1) is
  deliberately NOT built** – a later wave; today fame has exactly one reader.

## 2. Merch – the parent's first business, started from the shop

* One rung, `merch-brand`, family **`business`**, **$250,000** – «еще это дешевле академии» made
  arithmetic (48× under the academy), startable mid-career, no build wait, rate 0, no upkeep.
* **Income = fame × $30/point a week**, banked weekly by the till (`resolveBusinessIncome`),
  **NOT rank – rank appears nowhere in the arithmetic** (mutation-checked by name). At fame 10 (a
  few small titles) the brand ≈ the index fund on its price; a reign's fame 60–80 pays $94k–125k
  a year – a real «подспорье», sized against the round-29 counterweight gap (the 10% commission
  costs the MEDIAN career ≈ $130k of peak wallet; five seasons of merch at that career's own fame
  roughly hand it back). Zero at fame zero: a brand with nobody's name on it sells nothing, and
  «мы ни за что не наказываем» holds – the line's floor is $0, never a negative cent.

## 3. The academy that earns

* **Each of the four stages earns weekly once DELIVERED** (a stage on order is a contract, not a
  business), scaling with (a) the stage and (b) **reputation** – the P2 ruling «чем выше и дольше
  место – тем выше будет доход» as the ledger proposed it: 1.0 base + the BEST band of each
  finished season off `seasonHistory[].byTrack.wta.endRank` (top-100 +0.10 · top-50 +0.20 ·
  top-25 +0.35 · top-10 +0.60), capped at 4.0. His own save reads **1.75** – the ledger's worked
  example, pinned by test. A pre-v46 row or a null rank counts nothing: «not recorded» is not
  «top-100».
* **Stage bases at reputation 1.0**: the land $0 (a field) · the courts $950/wk · the clubhouse
  $2,500/wk · the staff $3,800/wk = **$7,250/wk whole** – the reachability proposal's own SHAPE
  (the staff are the business, the land is not), lifted a quarter above its $5,750 base, and the
  lift is measured rather than preferred: see §5. A half-built academy earns its built half –
  §3g's «a half-built academy is a real state» extended to the money.
* **ONE number reaches the ledger per week** – the row's sentence names the Nadal split as
  flavour («The academy – programmes, lodging and its own sponsors», Forbes España's 2023
  accounts: programmes+lodging 56%, its own sponsorship line 14%, merch, restaurants), never four
  lines. ⚠ The stages bill **no upkeep** – that is §13b's recorded ruling («§3g gives the academy
  no wait, no upkeep and no rate, and it was given none»), not this wave's invention – so there
  is genuinely nothing to net; where a shelf rung DOES keep a crew, the income line and the
  upkeep line stay two facts in two sentences (round 29 #10's lesson, and the shop card draws
  them as mirrored lines).

## 4. The schema move – v66, the full move, said loudly

The income lines need a ledger category, and both zero-cost reuses were weighed in the ledger and
refused: `'income'` folds a business the player BUILT into «the parents' job», `'academy'`
already means the scholarship SHE receives – two-facts-one-name, the defect the v44 'facility'
split was cut to end. So `WorldEventCategory` gains **`'business'`**, and a new union member is a
schema change by CLAUDE.md invariant 3 (the v44 precedent verbatim). The full move:
`SAVE_SCHEMA_VERSION` 65 → 66 · an append-only v65→v66 step that writes nothing (nothing is
back-filled – no old save can hold a business it could not buy) · golden fixture `v66.json`
carrying the new content · **e2e fixtures regenerated at 66** (`npm run e2e:fixtures`, the unit
pin demands it).

## 5. Predicted vs measured (`tools/sponsor-ladder-reach.ts --buy-business`, 108 careers × 780 weeks, eager arms)

The arm eagerly starts the merch brand and builds the academy, each the first week the wallet
holds twice its price; the default arm buys nothing and is the control for the published figures.

| prediction | measured |
| --- | --- |
| the published figures do not move – this wave adds income and touches no cheque | **default arm: kit cash median of careers paid $4,759,522 (published $4.76M), ad money family-banked p90 $27,342,800 (published $27.3M), gross sponsor p90 $55.4M – reproduced to the dollar**; and the buying arm's kit/ad lines are identical to its own base |
| merch is startable mid-career and the median career cannot start it (P5's bimodality) | started by **51 of 108** careers, median start week 293 (age ≈ 19.6); the median career's peak wallet is $364k against the $500k the half-wallet rule asks |
| a reign's merch ≈ $90k–125k a year – «подспорье», never a second academy | buyers' career merch income **median $858,264 · p90 $1,350,567 · best $1,568,862** over ≈ 9.4 seasons of ownership ≈ **$91k/yr at the median buyer** – inside the predicted band, and the top of it (fame 100, $156k/yr) stays 8× under the academy at the cap |
| fame is bimodal like the ad post it feeds on | at the horizon: **median 3.2 · p90 100.0** – most careers the world never noticed, a top decile at the cap |
| the academy is built by the top of the distribution, late | all four stages delivered by **40 of 108 (37%)**, median delivery week 512 (age ≈ 23.8) – the eager, commission-free ceiling of the ledger's own «affordable at about 22» |
| every builder holds a high reputation (the ledger: 2.90–4.00) | builders' end reputation **min 2.40 · median 4.00 · max 4.00** – the eager arm builds one band deeper than the affordability estimate reached |
| ⭐ the P7 criterion: $12M repays in roughly 5–10 seasons of a real reign | **8.0 seasons at the median builder's reputation (4.00)** – mid-window; best 8.0, worst 13.3 (the one 2.40-reputation builder). ⚠ At the proposal's unlifted $5,750 base the same arithmetic reads 10.06 at the cap and 16.8 at 2.40 – the edge of the window and outside it, which is the measured case for the quarter lift |
| ...and inside the played horizon | **$12M is fully repaid by 0 of 40** – a median delivery at age 23.8 leaves ≈ 5.2 seasons, and 268 weeks at the cap's $29,000/wk is $7.77M. Banked by the horizon: **median $6,876,190 · p90 $10,340,765 · best $11,936,218**; the stages hold their value (rate 0), so the build cost is never sunk – the criterion is about the RATE, and the rate is 8.0 |
| the parent's money moves only where a business exists | family banked: median **$999,634 in both arms** (the median career buys nothing); p90 **$55.18M → $66.11M** (+$10.9M ≈ the p90 career's business income); peak wallet p90 $52.4M → $51.0M – slightly LOWER, the wallet turned into $12.25M of owned stages and a brand |

⚠ **Eager-arm ceilings, not medians of play** – the portfolio bench's own caveat, inherited. And
⚠ the businesses' cheques cross no other line: her cut, the kit ladder and the ad fees are
byte-identical between the arms.

## 6. RNG discipline

**Zero draws anywhere in the wave** – fame, both incomes and the till step are arithmetic on
persisted records; there is no `Rng` argument, no clock, no `Math.random`. The frozen MAIN
capture **41550 / `e6b0c709` is UNMOVED** (tests/condition.test.ts passed untouched – no re-pin).
Input-independence re-proved for the feature: a career that buys merch and the whole academy taps
the identical MAIN sequence as one that buys nothing (`tests/round29p5-business.test.ts` §5).

**The frozen careers, per protocol**: per-key diff FIRST (`tools/frozen-key-diff.ts`, presets
0/1/2 × policy 1, control = a detached worktree at `14a18f0` – this wave's whole diff reverted –
headers checked, the reader confirmed absent on the control arm). Verdict, identical on all
three: **`schemaVersion` is the ONLY moved key; `rngMain` and every other key byte-identical** –
the narrowest re-freeze in coach-travel-edge's history (v49 moved two keys). `FROZEN` and
`PRE_R28B` re-taken, `PRE_V66` added: rolling only the number back reproduces all three v65
constants byte for byte. The walk now asserts business-inertness by name.

## 7. Surfaces

The Bills portfolio card carries fame's one line («How known she is – N of 100», the engine's own
whole number). The shop shelf gains **The business** family; every owned earner's row quotes
«Brings in $X a week right now» off the till's own arithmetic (`ShopRowView.incomeCents`), the
mirror of the upkeep line and deliberately not netted against it. The household strip totals both
streams in its IN figure (round 28 #8's law – `HouseholdWeekly.merchCents` /
`.academyIncomeCents`, memos already inside the total) and names them in one hint line. All
mutation-verified mounted (`tests/component/round29p5-business-surfaces.test.ts`, measured
red-counts in the header).
