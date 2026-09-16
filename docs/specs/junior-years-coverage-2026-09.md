---
type: spec
status: reference
area: economy-and-progression
canonical: false
last-reviewed: 2026-09-16
---

# What a junior career's sponsors pay for

**Round 42 #40. 16.09.2026. MEASUREMENT ONLY – no constant moved, no engine file touched. The
numbers are here so the owner can rule on the junior band with the arithmetic in front of him.**

His sentence, off his own save: «за всё время до 18 пришёл 1 спонсор на 40к на год». Item 16's paper
trail confirmed it is literally true of the junior band – three kit rungs at $2,000 / $3,000 / $3,000
a season, one advertising letter at 17.0, and then the money explodes.

The question item 40 sets: **what share of the junior bill can a good junior career actually cover** –
the junior years' total sponsor income against what the family spends in the same years.

---

## 1. Corrections to the brief, made before anything was measured

**There are THREE family backgrounds, not four.** `FamilyBackground` in
`src/shared/protocol/profile.ts:16` is `'wealthy' | 'middle' | 'working'`, and
`BACKGROUNDS_ALLOWED` on line 125 is the same three. The brief's fourth is probably the coach ladder
(`self / budget / middle / high / elite`), which is a separate axis. This spec reports the three
backgrounds, and then the nine background×coach presets underneath, because the coach is the largest
line in the junior bill and a background mean averages over families that hired nobody.

**`eligible: ['working']` is gone.** The orientation hint pointed at it; the comment at
`economy.ts:801` records its removal on 10.08 – the cameo's gate is the family's BALANCE now
(`sponsorNeedMet`), not the row in the questionnaire.

---

## 2. What counts as "sponsor income", and where each channel actually books

Six channels reach a junior career. Three of them are invisible to a naive
`financeWeeks.byCategory.sponsor` fold, which is why this instrument reads events rather than the
category aggregate.

| channel | where it books | whose pocket |
| --- | --- | --- |
| the local cameo (`ECONOMY.sponsor`, need-gated, $500–1,500, 6%/wk, 4-week cooldown) | `category: 'sponsor'` | 100% family |
| advertising signature fee + anniversaries | `category: 'sponsor'`, through `bankSponsorCheque` | 15% family / 85% hers |
| a cancelled shoot's clawback | `category: 'sponsor'`, negative | family |
| kit retainer / appearance fee / result bonus | **`category: 'income'`** – beside the parent's wage | 15% family / 85% hers |
| the kit rung's kit allowance (`local` $1,000, `national` $3,000, …) | **nowhere** – the gear row is emitted at what the family PAID | family, in kind |
| the top rung's travel share (`global`+, 25% of the fare) | **nowhere** – `supportedTravelCents` reduces the fare silently | family, in kind |

The manager's commission is 15% (`ECONOMY.managerCommission.bps = 1500`), so **85 cents of every
advertising dollar is hers, not the family's**. A single number for "the sponsor money" would be
describing the wrong pocket, so this spec prints four readings:

* **cash in hand** – family sponsor cash ÷ what the family actually spent. What the ledger shows.
* **family-side (the primary reading)** – (family cash + kit covered) ÷ (spend + kit covered). The
  denominator is the bill BEFORE any sponsor help, because a covered gear line never appears as a
  cost at all.
* **letters only** – family-side with the need-based cameo removed. This is the one that answers his
  sentence, which is about letters in the inbox.
* **gross** – every cent the brands paid, her 85% included, over the same bill.

Money is in **cents** everywhere above and everywhere in the tool; the single conversion to dollars
happens in the tool's `money()` formatter (`Math.round(cents / 100)`), borrowed from
`tools/_corridor.ts`.

**The junior band** is defined in the tool as every ledger row whose week satisfies
`kidAgeYears(row.week, birthMonth, birthDay) < 18` – her real age on the engine's one clock, never a
week count. Careers open at 14 and the default birthday is 15 June, so the band is roughly weeks
0–207.

---

## 3. THE PREDICTION, written before the tool was run once

Invariant 5. This is a guess from the constants and the mechanism, not from any output.

**Per background, the primary family-side reading, MEDIAN across careers:**

| background | family-side (median) | letters only (median) | gross (median) |
| --- | ---: | ---: | ---: |
| working | 8 – 20% | 2 – 6% | 10 – 25% |
| middle | 2 – 6% | 2 – 5% | 3 – 9% |
| wealthy | 1 – 4% | 1 – 4% | 2 – 6% |

**And the four shape claims that go with it:**

* **R1.** The cameo is what separates `working` from the other two. It is need-gated on the balance
  and the coach tier, so it should fire for most working careers and almost no wealthy ones – which
  is why the "letters only" column is predicted to collapse the three rows onto each other.
* **R2.** The MEAN exceeds the MEDIAN in every background, and the p75−p25 spread is at least as
  large as the median itself. One advertising letter at 16–17 is worth more than four seasons of kit,
  and most careers never get one.
* **R3.** The letters-only median is **under 6% in every background** – i.e. the junior letter band
  is decorative, and the junior years are funded by the parent.
* **R4.** Gross is 1.5–2.5× family-side wherever an advertising letter lands, and equal to it where
  none does (the kit allowance and the cameo are not split with her).

Reading key, so a miss is a miss and not a re-interpretation: the table above misses if a
background's measured median falls outside its band. R1 misses if `working`'s family-side median is
not at least double `middle`'s. R2 misses if any background's mean is below its median. R3 misses if
any letters-only median is 6% or higher. R4 misses if the gross/family-side ratio is under 1.2 in a
background whose careers signed advertising letters at all.

---

## 4. Measured

**144 careers – 16 seeds × 9 presets (48 working, 64 middle, 32 wealthy), seeds
`bench-<background>-<0..15>`, policy `player`, the parent signing every letter.** The band measured
231 weeks: she is **13.56 at week 0** (careers open in January, default birthday 15 June) and turns
eighteen after week 231, so "the junior years" is four and a bit playing seasons.

### 4.1 The coverage share

| background | family-side median | mean | p25 – p75 | pooled | letters only | gross | cash in hand | n |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| working | **7.4%** | 9.2% | 1.6 – 15.1% | 12.6% | 6.8% | 40.0% | 6.4% | 48 |
| middle | **11.2%** | 10.1% | 7.2 – 12.7% | 11.2% | 11.1% | 55.0% | 8.1% | 64 |
| wealthy | **7.3%** | 7.5% | 6.1 – 9.5% | 8.1% | 7.3% | 33.5% | 4.6% | 32 |
| ALL | **8.6%** | 9.2% | 4.4 – 12.4% | 10.2% | 8.6% | 42.9% | 6.4% | 144 |

### 4.2 The money behind it, median per career over the whole band

| background | the BILL | coach | travel + entry | kit | other | family gets | of which letters | kit cover | fare cover | (hers) | (prize) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| working | $95,470 | $21,262 | $57,484 | $3,882 | $11,688 | $7,711 | $6,000 | $1,101 | $0 | $34,000 | $32,963 |
| middle | $212,736 | $35,186 | $140,434 | $5,097 | $23,490 | $21,031 | $16,711 | $1,883 | $0 | $94,694 | $79,794 |
| wealthy | $438,173 | $102,787 | $268,224 | $8,378 | $49,601 | $32,782 | $19,169 | $2,967 | $8,827 | $108,622 | $118,247 |

Medians do not add: each cell is the median of its own column, and the shares in 4.1 are computed per
career. **Travel is the junior bill** – 60% of it for a working family, 66% for middle, 61% for
wealthy. The coach is a distant second and the kit a rounding error.

### 4.3 Who these careers are

| background | WTA-ranked at 17.9 | WTA median | best – worst | ad letters signed | careers with one | with a cameo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| working | 33/48 | #193 | #7 – #1621 | 1.21 | 27/48 | 32/48 |
| middle | 61/64 | #193 | #14 – #1620 | 2.16 | 56/64 | 32/64 |
| wealthy | 30/32 | #143 | #19 – #273 | 2.31 | 30/32 | 3/32 |

The owner's own career stood WTA #145 at 17.0 and #98 at 18.0, so this corpus is **not** a corpus of
prodigies – it sits slightly below his career, which makes the coverage figures a floor rather than a
flattering ceiling.

### 4.4 Predicted against measured, and the prediction MISSED

| claim | predicted | measured | verdict |
| --- | --- | --- | --- |
| working, family-side median | 8 – 20% | 7.4% | **MISS** (just below) |
| middle, family-side median | 2 – 6% | 11.2% | **MISS** (nearly 2×) |
| wealthy, family-side median | 1 – 4% | 7.3% | **MISS** (nearly 2×) |
| working, letters only | 2 – 6% | 6.8% | **MISS** |
| middle, letters only | 2 – 5% | 11.1% | **MISS** |
| wealthy, letters only | 1 – 4% | 7.3% | **MISS** |
| working / middle / wealthy, gross | 10–25 / 3–9 / 2–6% | 40.0 / 55.0 / 33.5% | **MISS**, all three |
| R1 – working ≥ 2× middle | working carried by the cameo | working 7.4% **below** middle 11.2% | **MISS**, inverted |
| R2 – mean > median everywhere, spread ≥ median | yes | middle's mean 10.1 < median 11.2; middle and wealthy spreads narrower than their medians | **MISS** |
| R3 – letters-only median under 6% everywhere | yes, band is decorative | 6.8 / 11.1 / 7.3% | **MISS** |
| R4 – gross is 1.5–2.5× family-side | yes | 5.4× / 4.9× / 4.6× | **HIT on direction, MISS on size** |

**Why it missed, in one sentence: the prediction priced the junior band off the junior rungs, and a
seventeen-year-old in this game is on the professional ones.** `local` and `national` pay $1,000 and
$3,000 of kit a season, which is what the prediction budgeted for. But a girl ranked inside WTA #200
at seventeen clears `tour` (WTA ≤ 200) and `global` (≤ 87), and those rungs carry a **quarterly cash
retainer** ($1,500–$2,000), an **appearance fee**, and a **result bonus of 20% of every W75+ cheque**.
The median career's letters are worth **$105,550 gross** over the band – not one $40,000 letter.

R1 missed for a second and separate reason, recorded under provenance in §7: the local cameo was
rewritten by round 42 #47 while this was being measured, and no longer separates the backgrounds.

### 4.5 So the answer to item 40

**The brands pay about 43% of the junior bill. The family sees about 9% of it.**

The gap is not the sponsors being small; it is `ECONOMY.managerCommission.bps = 1500`. Every letter –
the advertising fee, the retainer, the appearance fee, the result bonus – is split 15/85 by
`bankSponsorCheque`, and the 85 goes into *her* account. The median junior career banks **$91,001 for
her** and **$16,059 for the parent**. The parent's wallet, which is the one paying the $206,826 bill,
is looking at the 15% slice.

So the junior band is **not decorative – it is invisible to the payer.** A parent who reads his own
Money screen sees 6.4% of his outgoings covered and concludes, correctly, that the sponsors are not
helping him; the same career has in fact attracted something close to half its costs in brand money,
almost all of which is legally the child's. That is a design statement and it is worth making on
purpose rather than by omission, which is exactly the fork the item set up.

Two smaller findings that came out of the same run:

* **The kit rungs' season allowances are not the binding constraint.** Multiplying every rung's
  allowance by 100 moved the kit actually covered by **$238 a career** (§5). The brand already pays
  nearly all of what it promised to pay; what limits it is `KitOfferTerms.covers` – which *lines* the
  deal covers – not how much it will spend on them. Raising `seasonCents` would change almost nothing.
* **His «1 спонсор» was one dice roll away from a retainer.** Item 16's §B table records his season 3
  (w203, age 17.0, WTA #145): `tour` cleared and **missed its roll, 0.825 against 0.70**, so he signed
  the `national` renewal instead. Had that roll landed he would have had a quarterly cash retainer at
  seventeen and the sentence he wrote would not exist.

---

## 5. The actuation proof

Both halves were run, and the first version of the first half **failed and is recorded rather than
quietly repaired** – which is the point of doing it.

**(a) The null arm.** `--zero-accounting` zeroes the sponsor numerator in the tool's own accounting
and leaves the engine alone. Every coverage cell in every table reads **0.0%** – 18 careers, all
three backgrounds, all nine presets. So the numerator is what this spec says it is.

**(b) The constants.** The arm sets, on the live `ECONOMY` object in one process and restores them
before exit: `advertising.junior.feeBps` 5000 → 200,000 (20× the adult cell instead of half of it),
`advertising.junior.chanceBps` 5000 → 10,000 (every junior letter certain), and **every one of the six
kit rungs'** `seasonCents` × 100. 72 careers per arm.

| | shipped | absurd | delta |
| --- | ---: | ---: | ---: |
| kit covered, median per career | $1,572 | $1,810 | **+$238** |
| letters gross, median per career | $105,550 | $5,000,000 | +$4,894,450 |
| letters to the family, median | $15,833 | $750,000 | +$734,168 |
| letters-only coverage, median | 8.6% | **202.6%** | **+194.0 pp** |

Verdict: the kit dial is wired, the advertising dial is wired, and the coverage share follows them.

**⚠ THE FIRST ATTEMPT AT (b) READ «NOT WIRED» AND IT WAS THE ARM'S FAULT, NOT THE ENGINE'S.** It moved
`ECONOMY.sponsorship.seasonCents` alone – which is the **local** shop's allowance and nothing else.
`kitTermsFor` reads `s.national.seasonCents`, `s.global…`, `s.tour…`, `s.premium…` and `s.icon…` for
every rung above it, and every career in the corpus had climbed off `local` by its second season. The
measured kit cover did not move by one cent. A dial that reaches one rung of six is a null arm wearing
a proof.

**⚠ AND THE COMPOSITE IS NOT MONOTONE IN THE SPONSOR CONSTANTS, WHICH IS A FINDING RATHER THAN A
FAILURE.** The cameo is a *need* gate (`sponsorNeedMet` reads the family's own reachable balance), so
paying more brand money into the same wallet switches the local shop off. In the run made before round
42 #47 landed, the absurd arm's total family-side coverage went **down** 0.7 pp while its letters went
up. The verdict above is therefore read on the letters, where the dials actually live.

---

## 6. Two defects found in this instrument, both of which produced convincing wrong answers

Recorded because each was silent, and each is the sort of thing the next bench will do again.

**(a) An `else` branch over the ledger categories swept PRIZE MONEY into the expense remainder** as a
negative cost, and printed a **negative junior bill** (working: −$367,107, "other" −$579,708). The fix
is not a better `else`: the tool now names the expense categories and the income categories
exhaustively and **throws on a category it has never heard of**.

**(b) The advertising SIGNATURE FEE – the exact channel this item is about – was being dropped.**
`acceptOffer` pays the whole fee the week the paper is signed, and the tool's event watermark was
taken *after* the signing call, so those rows were never folded; the `kidShare` memo for the signature
week was read one pass too early for the same reason. The median career's letter money read **$0**.

⚠⚠ **And the cross-check did not catch it, because both folds shared the blind spot.** The tool folds
the letter money twice – once off `FinanceWeek.kidShare.sponsor` (arithmetic) and once off the row
texts (prose) – and prints the gap. The gap was $0 and the split read exactly 15.0%, both correct,
both computed over the same truncated set. **Two instruments agreeing is not a check when they agree
by construction.** What actually found it was a third quantity that had no reason to be what it was:
30 of 48 working careers had signed an advertising letter, yet the median letter money was $0, and
those two cannot both be true.

Both are fixed; the numbers in §4 are from after the fix.

---

## 7. Provenance – which tree these numbers came from

They are **not** from a clean checkout. `round/42` carried another agent's uncommitted work in
`src/engine/economy.ts`, `src/engine/world/phaseFinance.ts`, `src/engine/world/sponsors.ts`,
`src/engine/match/point.ts`, `engine.ts`, `scoring.ts` and `types.ts` throughout the measurement –
items 34 / 47 / 49(b), including match-physics constants being toggled for A/B arms.

What was done about it:

* Every figure in §4 and §5 comes from a run bracketed by an **md5 of the whole of `src/`, taken
  before and after, identical** (`8c17cbf4de472c834484f1e126436ed9`), and **two consecutive full runs
  inside that bracket produced byte-identical output**. Earlier runs against a moving tree did not
  reproduce and are discarded.
* **The figures describe the POST-#47 engine.** Round 42 #47 rewrote the local cameo from a flat
  $500–1,500 draw into a fraction of an unpayable trip's shortfall, and it landed mid-measurement. The
  channel fell from **$442,307 across 144 careers to $34,982** – from ~$3,072 a career to ~$243. That
  is why the `letters only` column and the `family-side` column are now nearly identical, and why
  prediction R1 (which assumed the cameo would carry working families) is obsolete rather than merely
  wrong.
* `src/` was never edited by this work. The only files it adds are this spec and
  `tools/r42-junior-coverage.ts`.

**One thing that was not done honestly and is named instead of hidden:** `npm run check` was not run.
The branch had three agents working in it, and CLAUDE.md forbids gating under contention. The tool
typechecks on its own (`npx vue-tsc -p tsconfig.tools.json --noEmit`, exit 0). ⚠ **Adding a file to
`tools/` makes `npm run tools:registry:check` red until `npm run tools:registry` regenerates
`tools/README.md`** – that regeneration was deliberately not done here because the brief forbade
touching any existing file, so whoever assembles the wave owes that one command.

---

## 8. The instrument

`tools/r42-junior-coverage.ts` – archival, read-only, run by hand. The numbers in §4 and §5 are from
the first command below.

```
npx vite-node tools/r42-junior-coverage.ts -- --seeds 16 --absurd        # §4 and §5
npx vite-node tools/r42-junior-coverage.ts -- --seeds 2 --zero-accounting # the null arm
npx vite-node tools/r42-junior-coverage.ts                                # the default, 12 seeds
```

It reuses `tools/econ-bench.ts`'s career loop and preset ladder (so the world evolution is defined in
one place) and `tools/_corridor.ts`'s formatters. It signs the strongest live kit letter and every
live advertising letter the week it lands – `tools/sponsor-ladder-reach.ts`' eager arm, because "a
good junior career" is one that answers its post. Signing draws zero on MAIN (invariant 2), so the
arms cannot move the world's dice apart.

The tool writes no engine constant except inside its own `--absurd` arm, which restores every value
it touched before it exits.
