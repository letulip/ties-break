---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-29
---

# The advertising portfolio (round 29 part four P6/P7/P9, built 29.08.2026)

**His order, verbatim (P6/P7):** «разнотировые рекламные контракты с реальными суммами … Федерер
получал контракт с Nike на 10+ миллионов, это 1-2млн для родителя. Таких контрактов может быть
несколько.» The design was settled across two documents before a line was written –
[endorsement-tiers-and-academy-money.md](../research/endorsement-tiers-and-academy-money.md) §5–§8
(his calibration passes) and [fame-and-the-shoots-2026-08.md](fame-and-the-shoots-2026-08.md) (the
shoots are fame's future fuel; fame itself is NOT built here).

Branch `r29p4/ad-portfolio`. Schema **still 65** – the capstone's gate is a fold over
`seasonHistory[].byTrack.wta.endRank`, already persisted; the letter shape widened with OPTIONAL
fields only (`category`, `termYears` – the `entry`-family precedent, seventh use).

## 1. The shape (his, §7–§8)

* **The portfolio is CATEGORIES, one live deal per category** – watches · cars · drinks · clothing
  (the kit brand's own campaign – «двойной программой») · airline · fragrance, plus the capstone on
  top. The «up to 4–6 concurrent» cap of §8 is not a constant anywhere: it is how many categories a
  standing has opened. `adSpokenFor` – the plan's §4.1 one-deal-at-a-time guard – is RE-AIMED per
  category, never deleted.
* **Four bands, the cheque the only scaling axis** (`ECONOMY.advertising.bands` /
  `categories[].feeCentsByBand`): gates 200 / 100 / 50 / 10 – the kit ladder's own cuts plus his
  Bublik line (P11: «Это доход у топ-100»). Every cell sits inside §8's own ranges ($5k–20k ·
  $100k–500k · $300k–1M · $1M–2.5M), pinned by test; the watches ≤200 cell is the shipped $20,000
  **unchanged to the cent** – the anchor, through its second resize.
* **Terms churn**: 1–3 years drawn per letter; the fee is PER CONTRACT YEAR, banked at signature
  and on each anniversary (`payAdAnniversaries`, through `bankSponsorCheque` like every sponsor
  cheque) – so three 1-year deals pay exactly what one 3-year deal pays. 2–4 named houses per
  category, and **no house writes twice running at the top band** (`pickAdHouse`) – «игрок устанет
  смотреть на одно и то же название без смены ГОДАМИ».
* **The capstone**: $10,000,000 a year × 8 years, kit-shaped – written by the kit house that
  dresses her (the double programme at icon scale; the icon rung's brand between kit deals), gated
  on **4 seasons ENDED inside the top 10**, one at a time. ⚠ The whole post's own floor still
  applies (a counting standing inside the top 200 – `adBandFor` gates the review before any
  category is walked): tenure earns the letter, but a face that has left the professional table is
  not written to this week – it is the review's precondition, not a second tenure rule.
* **P9 – the winter is the shoot season.** `WINTER_SHOOT_WEEKS = 6` – the last six weeks of the
  season year, derived from the top calendar's own tail (the 1000-tier's last anchor is offset 45),
  which is his «у нас 6 пустых недель там» counted. `chooseShootWeeks` fills the winter FIRST
  (adjacency allowed there – a shoot season stacks) and spills the overflow in-season under the old
  spaced-apart promises, where the round-29 #3 four-way clash machinery prices it exactly as
  before. **The winter cost is the displaced rest**: `accrueCondition` already pays a shoot week
  the travel figure, so a shoot parked on an empty winter week forfeits precisely the base + slider
  the vacation would have banked – no new constant, the ladder that was already there.

## 2. RNG discipline

Arrival, author and term length draw on `seed:ad:<category>:<week>` (+ `:letter`) – purpose-scoped,
keyed on the week, ZERO draws on MAIN. Frozen MAIN capture **41550 / `e6b0c709` UNMOVED** (pinned,
re-run green). Per-key frozen-career diff (`tools/frozen-key-diff.ts`, presets 0/1/2 × policy 1,
control = this wave's commit reverted in a detached worktree, headers checked against the
invocation): **all three arms byte-identical on every key, `rngMain` included** – the frozen
careers run 156 weeks from age 14 and end at 17, under the gate's 18, so zero movement is the
DERIVED expectation and the measurement agrees. `tests/coach-travel-edge.test.ts`'s three hashes
**UNMOVED, no re-freeze**. Input-independence is re-proved for the feature: a fortnight signing the
whole shelf and a silent one tap identical MAIN sequences (`tests/round29p4-ad-portfolio.test.ts`).

## 3. Predicted vs measured (`tools/sponsor-ladder-reach.ts`, 108 careers × 780 weeks, eager arm)

| prediction | measured |
| --- | --- |
| §8's shape: up to 4 / 5 / 5 / 6 categories held at the four bands | **exactly 4 / 5 / 5 / 6** – the most categories any career held at ≤200 / ≤100 / ≤50 / ≤10 |
| every cell reachable (no dead content) | every priced cell written AND signed by real careers – watches ≤200 by 37, fragrance ≤10 by 27, the thinnest cell 17 |
| the capstone is a top-decile deal (tenure ≥4 top-10 seasons was 9.7% of 72 careers in the round-29 run) | 9 of 108 careers (**8%**) hold ≥4 top-10 seasons, and the capstone was written to and signed by exactly those 9 |
| the ad post stops being noise (was median $76k / p90 $219k a career) | family-banked ad money: **median $0 · p90 $27.3M · best $85.3M** – bimodal by P5's own ruling (52% of careers are never written to at all); gross sponsor money p90 $55.4M |
| kit cash unmoved by this wave | median of careers paid any: **$4.76M** against the corrected $4.44M of the pre-wave run (different preset mix, same order) |

⚠ **The eager arm signs everything, so these are ceilings, not medians of play.** And ⚠ **her cut
is untouched**: every cheque still runs the shipped age ramp through `bankSponsorCheque`; the
10–20% manager-commission ruling is deliberately NOT in this wave – it is its own step with its own
bench, and stacking both would make the money unreviewable. At the new scale that step is where the
«1-2млн для родителя» arithmetic will actually land.

## 4. Surfaces

The Bills page carries **the portfolio shelf** – one row per category, filled (deal named, fee/yr,
term) / open (the band's own cheque quoted) / closed (the gate named; the capstone row counts
tenure «N of 4 top-10 seasons») – derived engine-side (`Snapshot.adPortfolio`), mutation-verified
mounted (`tests/component/round29p4-ad-portfolio-panel.test.ts`). The letter states its per-year
fee, its 1–3-year term, its CATEGORY-scoped exclusivity and the winter-first shoot rule; the sign
confirm caps the named dates at six and counts the rest (the capstone's sixteen would out-grow a
phone – round-20 #3's rule, mounted against 375×667). `Snapshot.adShoot` became `adShoots` (one row
per live deal); the calendar, week-ahead and week-days surfaces read the union.
