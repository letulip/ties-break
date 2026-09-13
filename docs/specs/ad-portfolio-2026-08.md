---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-09-12
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

> ⚠⚠ **SUPERSEDED THE SAME NIGHT, AND THE PARAGRAPH ABOVE IS KEPT AS THE RECORD OF THE ORDER THE TWO
> STEPS SHIPPED IN.** Round 29 part three **P3** built the commission (`ECONOMY.managerCommission`,
> provisional **15%**), so «every cheque still runs the shipped age ramp» is true of the run that
> produced this table and of nothing after it. **The ad post's own gross is unmoved** – the ladder,
> the bands, the churn and the capstone are untouched – but **the family-banked column above is the
> pre-commission one**: re-measured on the same 108 careers it reads **median $0 · p90 $6.32M ·
> best $20.51M**, and kit cash's «median of careers paid any» **$4.76M** reads **$1.01M**. The
> gross those cheques were is the same to four significant figures (p90 $55.44M → $55.47M), which is
> the check that says the split moved and the ladder did not. Her side of the same money is the new
> column: **p90 $47.15M** of sponsor cash into her own account. Round 29's ledger carries the full
> before/after, both arms run from a control worktree with P3 reverted.

## 4. Surfaces

The Bills page carries **the portfolio shelf** – one row per category, filled (deal named, fee/yr,
term) / open (the band's own cheque quoted) / closed (the gate named; the capstone row counts
tenure «N of 4 top-10 seasons») – derived engine-side (`Snapshot.adPortfolio`), mutation-verified
mounted (`tests/component/round29p4-ad-portfolio-panel.test.ts`). The letter states its per-year
fee, its 1–3-year term, its CATEGORY-scoped exclusivity and the winter-first shoot rule; the sign
confirm caps the named dates at six and counts the rest (the capstone's sixteen would out-grow a
phone – round-20 #3's rule, mounted against 375×667). `Snapshot.adShoot` became `adShoots` (one row
per live deal); the calendar, week-ahead and week-days surfaces read the union.

## 5. Round 41 #15 (12.09.2026) – THE LETTERS OPEN AT SIXTEEN, ON A JUNIOR SHELF

**HIS QUESTION:** «А рекламных контрактов правда не предлагают до 18 лет или это наше ноу-хау?
кажется молодые тоже в рекламах снимаются.» **HIS RULING, option A1, the same day:** «реклама
открывается с 16 (юниорские суммы, реже), а призовые падают на её счёт с первого старта W-серии
независимо от возраста – согласен».

⚠⚠ **The eighteen was OUR reading, not his ruling, and the exhibit is the shipped comment itself.**
`ECONOMY.advertising.fromAgeYears` said in as many words that it came from «какие у нас могут быть
механики этих контрактов дополнительные от 18+ лет начиная и дальше» – a question about what EXTRA
mechanics exist above eighteen, read as an eligibility gate. The three facts it leaned on (the prize
ramp started at 18, school ends by 18.92, the junior rungs shut) are all true and none of them is
about advertising. The paragraph is kept verbatim in the constant, under the correction.

### What shipped

| | junior band, real age [16, 18) | from eighteen |
| --- | --- | --- |
| categories written | `drinks`, `clothing` only | the whole shelf |
| cheque | **half** the adult cell at her band (`junior.feeBps` 5000) | the adult cell |
| arrival | **half** the weekly chance (`junior.chanceBps` 5000) | `offerChance` |
| term | **1 year**, always | the band's own ladder (1–5) |
| shoot weeks | the band's own, unscaled | the band's own |

The pair is the shelf's own cheapest rungs rather than a taste: `drinks` is the only category open at
the very foot of the ladder (round 34's «a kit patch and a drink»), and `clothing` already requires a
live kit deal to be written at all (the «двойной программой» rule), which is a natural junior shape.
The capstone and the lifetime letter are refused twice – by the junior list and by their own tenure
gates, which cannot be met at seventeen.

⚠ **RNG: zero new draws.** «Реже» is the SAME purpose-scoped sub-stream (`seed:ad:<category>:<week>`)
read at a lower bar, and the one-year ceiling is applied AFTER the letter rng has spent its uniform –
round 39 #3's own discipline – so no stream shifts by one draw at any age. An age is world state, not
player input, so input-independence is untouched; the frozen MAIN capture (41550 / `e6b0c709`) cannot
see any of it and `tests/condition.test.ts` is green and unmodified. **No schema move**;
`SAVE_SCHEMA_VERSION` stays 74.

⚠ **No new player-facing string, and this was checked rather than assumed.** The empty-state sentence
reads the constant (`Nothing to show yet – the categories open at {{ adFromAgeYears }}…`), so it now
says «open at 16» by itself. A category the junior band does not write renders `state: 'closed'` with
**no** `opensAtRank`, which falls through to the shelf's own shipped «Not open yet» – deliberately,
because `opensAtRank` answers «how far up the ladder» and that is true-but-not-the-reason for a
sixteen-year-old who already meets the watch band's rank. No `MoneyScreen.vue` edit is owed.

### Predicted vs measured (`tools/r41-ad-gate-16.ts`, 216 careers per arm, walked to her eighteenth)

The four numbers were written into the tool's header **before the first run**:

| | predicted | measured (organic) | measured (staged) |
| --- | --- | ---: | ---: |
| P1 careers signing any ad deal before 18 | 4% (single digits) | **0.0%** | **61.6%** |
| P2 her account at 18, mean delta (whole corpus) | under $10,000 | **$0** | **+$25,185** |
| P3 ...conditional on a career that signed one | $40,000 – $80,000 | – | **$40,902** |
| P4 the family's funds at 18, mean delta | under $2,000 | **$0** | **+$3,862** |

**Two populations, because reporting only the first would be a null result nobody could read.**

* **ORGANIC** – the careers `econ-bench` actually produces. **Zero letters in either arm**, and the
  diagnostic says why: **0.0% of them ever stand in an advertising band before eighteen at all.** The
  gate is not what stops them – the STANDING is. That reproduces what `tests/ad-offer.test.ts` has
  said since round 24 in its own words («an organic crossing would need eight-plus entered seasons
  per arm and still not be guaranteed by the calibration – first points 17-18, top-100 about 4.5
  years later»), and it is why the bench carries a second arm. ⚠ **The null was actuation-checked**:
  `--absurd` (junior fee at 10x the adult cell, arrival certain) moves nothing on the organic corpus,
  which is the proof that the band and not the dice is the binding constraint.
* **STAGED** – the pro-fixture idiom, a counting W-series standing written from her sixteenth. This
  is the population the item is FOR, and it is the owner's own save: a girl in the top 100 at sixteen
  is the opening sentence of round 41 #18. Here 61.6% of careers sign at least one letter, 160
  letters in all, and **every one of them is a drink** – no bench career holds a kit deal, so the
  clothing slot never opens, which is the «двойной программой» rule doing its job unprompted.

**Where the prediction was wrong, and it is instructive both ways.** P3 landed inside its band at the
bottom ($40,902 against $40,000–$80,000). P1 was too HIGH for the organic corpus (0% against 4%) and
far too low for the staged one, which says the prediction was about the wrong population – the honest
reading is «rare because the STANDING is rare, not because the letters are». P4 was too low by 1.9x
(+$3,862 against under $2,000): the arithmetic checks out (160 letters × ≈$40,000 gross × the
manager's 15%, over 216 careers ≈ $4,400), so what was underestimated was the number of letters, not
the split.

⚠ **A non-finding, recorded because it was nearly reported as a finding.** A first pass at 27 careers
read the family's mean funds as **−$5,645** in the ON arm and the shoot weeks were the obvious
suspect (a junior deal costs in-season weeks that recover like travel weeks). At 216 careers the sign
flips to **+$3,862** and the median moves +$102. The 27-career reading was noise, and it is written
down here because a bench small enough to run quickly is a bench big enough to invent a mechanism.
