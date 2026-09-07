---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-09-07
---

# What the academy is worth – round 38 #8

**HIS OBSERVATION, 06.09:** «Академия при этом стоит ровно на месте – и это не очень корректно, как
мне кажется.» **AND HIS RULING ON THE SHAPE, 07.09:** «хорошо звучит» to option C below, plus «а что
насчёт стоимости и индексации этой стоимости с годами? Как с домами, например.»

## 1. Why it stands still, and it is one number

`assetValueCents(item, paid, weeksHeld) = paid x (1 + annualRateBps/10⁴)^years`. The whole shelf
carries a drift; **the academy is the only family on it that carries zero.**

| family | annual drift |
| --- | ---: |
| index fund | +700 bps |
| savings deposit | +317 bps |
| **houses (all four)** | **+300 bps** |
| cars | −600 to −1500 bps |
| boats | −500 / −700 bps |
| planes | −600 bps |
| **academy (all four stages)** | **0** |

So «стоит ровно на месте» is not an oversight in a formula – it is a literal zero in the catalogue,
and the family it sits on is the one that is most obviously real estate. His «как с домами» is exact.

⚠ AND ITS INCOME IS ALREADY ALIVE: `academyWeeklyIncomeCents` = the delivered stages' own figures
times `academyReputationOf` (1.0 base, rising with every season ended inside a band, capped at
`4 + 0.5 x professional seasons`). On his week-1115 career reputation reads **2.83** and the two
delivered stages pay **$2,684 a week**. The asset earns like a business and is priced like a car.

## 2. The two halves, and they are independent

**HALF ONE – THE DRIFT (his «как с домами»).** `annualRateBps: 300` on all four academy stages, the
houses' own number. Land and buildings appreciate; nothing else about the rung changes.

⚠ **Why one rate and not two.** A real academy's LAND appreciates and its BUILDINGS depreciate and
need maintaining. That is true and it is deliberately not modelled: the shelf has no maintenance line
for this family, so splitting the drift would model the loss without the upkeep that justifies it and
the stages would quietly diverge. One rate, the houses', and the honest version of the split is a
later item with a maintenance line beside it.

**HALF TWO – THE REPUTATION PREMIUM (option C, which he approved).** An academy is real property PLUS
a going concern:

```
worth = paid x (1 + 300bps)^years x (1 + premiumPerRep x (reputation − 1))
```

⚠⚠ **THE COST IS A FLOOR AND THAT IS THE WHOLE OF OPTION C.** Reputation starts at 1.0, so the
premium starts at exactly zero and can only ever add. A career that collapses cannot take back the
land and the courts – which is what makes the academy the thing it is worth moving money INTO near
the end of a career, and it is the opposite property from the merch brand, deliberately.

⚠ **Option B was measured and refused.** Pricing the academy on its earnings the way the brand is
priced: $139,568 a year at a 10x multiple is **$1.4M against $5.0M paid** – the change would have cut
its value by 72% on his own save. A going concern on real property cannot be worth less than the
property.

## 3. What it reads on his own career

Two stages, $5,000,000 paid, `academy-land` bought week 884 and `academy-courts` week 1041, today
week 1115 – so 4.44 years and 1.42 years held. At +300 bps and `premiumPerRep = 0.15` with his
reputation of 2.83:

| | today | with the drift | with drift + premium |
| --- | ---: | ---: | ---: |
| academy-land | $2,000,000 | $2,282,000 | $2,908,000 |
| academy-courts | $3,000,000 | $3,130,000 | $3,988,000 |
| **together** | **$5,000,000** | **$5,412,000** | **$6,896,000** |

⚠ These are the spec's arithmetic and NOT a measurement – `tools/shop-probe.ts` re-runs them against
the shipped path when the work starts, and the table above is what it has to reproduce.

## 4. Plan of work

| step | what | proof |
| --- | --- | --- |
| 1 | `annualRateBps: 300` on the four academy stages | `npm run probe:shop` before and after on his save: the two rows move by the drift and nothing else on the shelf moves |
| 2 | `ECONOMY.business.academy.premiumPerRep`, read in `assetWorthCents`'s non-business branch for `family === 'academy'` only | a mounted shop-card test at reputation 1.0 (premium exactly zero) and at 2.83 |
| 3 | ⚠ The floor: worth may never fall below `paid x drift` | a test that drives reputation to its minimum and reads the row |
| 4 | The shop card's sentence says what the rung IS, never what the premium is worth | invariant 4: the card's copy changes only where this task asks |
| 5 | `tests/goldenSaves.test.ts` and the three frozen careers | ⚠ `annualRateBps` is read at valuation time off `paidCents` and `boughtWeek`, both already persisted – so NO schema move and no migration |

**Effort: 1 day.** **Risk: low** – no persisted state changes, and the premium starts at zero for
every career that has not banked a season.
