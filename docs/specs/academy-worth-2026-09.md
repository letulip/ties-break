---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-09-12
---

# What the academy is worth – round 38 #8

**HIS OBSERVATION, 06.09:** «Академия при этом стоит ровно на месте – и это не очень корректно, как
мне кажется.» **AND HIS RULING ON THE SHAPE, 07.09:** «хорошо звучит» to option C below, plus «а что
насчёт стоимости и индексации этой стоимости с годами? Как с домами, например.»

## 1. Why it stood still, and it was one number

⚠ **This section is the DIAGNOSIS and its table is the state BEFORE the item shipped.** The academy
column now reads +300 bps; §3 is what it reads today.

`assetValueCents(item, paid, weeksHeld) = paid x (1 + annualRateBps/10⁴)^years`. The whole shelf
carries a drift; **the academy was the only family on it that carried zero.**

| family | annual drift (before this item) |
| --- | ---: |
| index fund | +700 bps |
| savings deposit | +317 bps |
| **houses (all four)** | **+300 bps** |
| cars | −600 to −1500 bps |
| boats | −500 / −700 bps |
| planes | −600 bps |
| **academy (all four stages)** | **0** → now **+300 bps** |

So «стоит ровно на месте» was not an oversight in a formula – it was a literal zero in the catalogue,
and the family it sits on is the one that is most obviously real estate. His «как с домами» is exact.

⚠ AND ITS INCOME WAS ALREADY ALIVE: `academyWeeklyIncomeCents` = the delivered stages' own figures
times `academyReputationOf` (1.0 base, rising with every season ended inside a band, capped at
`4 + 0.5 x professional seasons`). On his week-1115 career reputation reads **2.825** and the two
delivered stages pay **$2,684 a week**. The asset earned like a business and was priced like a car.

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

## 3. What it reads on his own career – PREDICTED, then MEASURED

Two stages, $5,000,000 paid, `academy-land` bought week 884 and `academy-courts` week 1041, today
week 1115 – so 4.44 years and 1.42 years held. At +300 bps and `premiumPerRep = 0.15` with his
reputation of 2.825 (the draft said 2.83, which is the displayed rounding of it):

| PREDICTED | today | with the drift | with drift + premium |
| --- | ---: | ---: | ---: |
| academy-land | $2,000,000 | $2,282,000 | $2,908,000 |
| academy-courts | $3,000,000 | $3,130,000 | $3,988,000 |
| **together** | **$5,000,000** | **$5,412,000** | **$6,896,000** |

**MEASURED, 07.09, through the shipped path** – `revalueAssets` then `shopView`, on the save itself:

| MEASURED | today | with the drift | with drift + premium |
| --- | ---: | ---: | ---: |
| academy-land | $2,000,000 | $2,280,641 | $2,904,966 |
| academy-courts | $3,000,000 | $3,128,885 | $3,985,417 |
| **together** | **$5,000,000** | **$5,409,526** | **$6,890,384** |

⚠ **The prediction was high by 0.05–0.09%, and the cause is the spec's arithmetic rather than the
engine's.** The draft compounded over the *displayed* 4.44 and 1.42 years; the engine compounds over
the exact week span (231 and 74 weeks). Nothing else differs, and the shape he approved is intact – a
drift of about +$410k and a reputation premium of about +$1.48M on top of it.

⚠ **The probe is `tools/r38-academy-worth.ts`, not `npm run probe:shop`.** The shop probe walks
synthetic bench careers to answer §2e-1/§2e-5 about the good car and takes no save; step 1's
acceptance is a claim about a save *and about the rest of the shelf*, so it needed a tool that opens
one. Read-only, through `decodeExportFile`, nothing copied into the repo.

### ⚠⚠ Nothing else on the shelf moved, and that had to be printed to be believed

Every owned rung, same save, same run:

| rung | family | before | after both halves |
| --- | --- | ---: | ---: |
| index-fund | investment | $1,819,442 | $1,819,442 |
| house-first | house | $298,036 | $298,036 |
| merch-brand | business | $5,172,791 | $5,172,791 |
| academy-land | academy | $2,000,000 | **$2,904,966** |
| academy-courts | academy | $3,000,000 | **$3,985,417** |
| car-good | car | $100,100 | $100,100 |
| **shelf total** | | **$12,390,369** | **$14,280,753** |

⚠ **And the control was run rather than assumed.** With both halves reverted in place – the four
rates back to 0 and `premiumPerRep` back to 0 – the probe reprints the "before" column to the cent
and five pins in four other files go red. The arm holds the constants *and* their readers, which is
the provenance check CLAUDE.md demands of a measurement in either direction.

## 3a. Three consequences that are not defects, and are reported rather than absorbed

**a. The shop card's sentence moved, and no string was edited.** `rateLine` picks its branch off
`annualRatePct`, so the four stages now read the houses' own sentence – **«Gains about 3% a season»**
instead of «Neither gains nor loses». That is «как с домами» arriving on screen, and invariant 4 is
satisfied the strict way rather than the convenient one: `MoneyScreen.vue` is untouched to the byte,
and what changed is the data the existing sentence is chosen by. ⚠ The zero branch is now reachable
from no rung on the shelf. It is **kept** – it is the honest answer for the next rate-0 rung, and
deleting a correct branch because today's catalogue happens not to reach it is how a shelf loses a
case. Pinned in `tests/component/round30-brand-naming-screen.test.ts`, which also asserts the card
says nothing whatsoever about the premium (step 4).

**b. The academy now feeds the household strip's shelf line.** `householdWeekly` has quoted the
week's move on the shelf since slice 1 (`assetWorthCents` at 0 against at 1). A rate-0 academy moved
it by zero; a drifting one does not. Nothing was *added* to the strip – the academy joined the line
the houses and the fund were already on – but it is a new visible number and he should not meet it
cold.

**c. ⚠ A stage bought today is worth more than it cost the same week, on a reputable career.** The
shelf has priced a rung at what it is *worth* the week it is bought since round 30 #9, not at what
was paid – `buyAsset` calls `assetWorthCents` directly and its own note says why. So a career at
reputation 2.825 buying `academy-staff` for $3M sees it valued at about $3.82M immediately, and a
sale would hand that back. **This is the shelf's existing law applied to a second family, not a new
one:** the merch brand already carries a far larger instant mark-up on his own save ($250,000 paid,
$5,172,791 worth – a 20x) and has shipped that way since round 30. It is named here because it is a
real property of option C, about twenty times smaller than the one already on the shelf, and because
a premium that can be banked on the week it is bought is his call to keep or to close, not mine.

## 4. Plan of work

| step | what | proof | done |
| --- | --- | --- | --- |
| 1 | `annualRateBps: 300` on the four academy stages | a probe before and after on his save: the two rows move by the drift and nothing else on the shelf moves | ✅ §3's two tables; `tools/r38-academy-worth.ts` (the shop probe takes no save) |
| 2 | `ECONOMY.business.academy.premiumPerRep`, read in `assetWorthCents`'s non-business branch for `family === 'academy'` only | a test at reputation 1.0 (premium exactly zero) and at a real career's figure | ✅ `tests/round38-academy-worth.test.ts` §2, and §5 asserts the family gate in both directions |
| 3 | ⚠ The floor: worth may never fall below `paid x drift` | a test that drives reputation to its minimum and reads the row | ✅ §3, reaching the minimum three different ways, plus a hostile-band arm that reaches the clamp |
| 4 | The shop card's sentence says what the rung IS, never what the premium is worth | invariant 4: the card's copy changes only where this task asks | ✅ no string edited; the branch moved with the data (§3a-a), and the mounted pin asserts the card names no premium |
| 5 | `tests/goldenSaves.test.ts` and the three frozen careers | ⚠ `annualRateBps` is read at valuation time off `paidCents` and `boughtWeek`, both already persisted – so NO schema move and no migration | ✅ green, `SAVE_SCHEMA_VERSION` unmoved at 70, no migration added |

**Effort: 1 day.** **Risk: low** – no persisted state changes, and the premium starts at zero for
every career that has not banked a season.

## 5. One structural note: the reputation fold moved a file down

`assetWorthCents` lives in `src/engine/world/assets.ts`, which is deliberately a **leaf**;
`world/business.ts` imports it at runtime (`assetEarningsRateCents`, `deliveredAssets`, `shopItem`).
So `academyReputationOf` could not be imported upward – that is a real cycle, traced before the move
rather than after it. The fold moved **down** into `world/assets.ts` and `world/business.ts`
re-exports it under its historical name, so `engine/world`, three tools and
`tests/round29p5-business.test.ts` are untouched. It needed no new import to move: `ECONOMY` and
`WorldState` were already on the leaf's list.

⚠ **The precedent is exact and it is `assetEarningsRateCents`** – round 30 #9 moved the merch rate
the same distance, for the same reason, and its own note in `world/assets.ts` spells out the argument
this is the second instance of. `tests/import-cycles.test.ts` is the mechanical half of the claim and
is green.

## 6. Round 41 #24 (12.09.2026) – THE STAGES ARE BUILT TO ORDER, AND A BUILDING SITE IS WORTH WHAT WAS PAID

**HIS ASK, 12.09:** «может быть для Академии корты, клубный дом и стафф тоже должны сколько-то
строиться по времени, а не сразу быть готовы?» **AND HIS RULING, the same day, on the round's
proposal of courts ~6 weeks, clubhouse ~12, staff hire 2–4:** «сроки ок, в этот же раунд заводи
пожалуйста».

**What shipped: three fields.** `buildWeeks` on `academy-courts` (6), `academy-building` (12) and
`academy-staff` (3). The LAND carries none – «корты, клубный дом и стафф» names three things and a
field is bought rather than built, so the deeds still arrive with the money.

⚠⚠ **NOT ONE LINE OF MACHINERY MOVED, AND THAT IS THE FINDING RATHER THAN A CONVENIENCE.** The
commissioning road has been shipped since round 29 #5 (`buildWeeks` → `readyWeek` → `deliverAssets`
→ the «On order» card), and every reader of academy ownership already gated on `deliveredAssets`:
the income (`assetWeeklyIncomeCents`' own first line), the epilogue's stage count
(`academyEpilogueOf`), the sale (`sellableAsset`), the upkeep meter. The **worth** needed no gate at
all: `buyAsset` writes `basisWeek = readyWeek` on a commissioned row, and both `assetValueCents` and
`rampedWorthCents` clamp a negative span to zero – so a stage under construction is worth exactly
what was paid for it, drift and premium both held at the door, which is the yacht's own behaviour to
the cent.

⚠ **NO SCHEMA MOVE.** `readyWeek` and `basisWeek` are round-29 persisted fields.
`SAVE_SCHEMA_VERSION` stays **74**; no migration, no fixture. A save written before this item holds
academy rows with no `readyWeek`, and `assetDelivered`'s rule is that an absent key MEANS delivered –
so a loaded career finds its academy standing, which is what its owner left behind.

### What it costs, measured (no bench arm is owed and here is why)

**Invariant 5 asks for a bench where a balance corridor moves. None did:** not one price, rate,
income figure or reputation band changed, so the only measurable effect is arithmetic – the delay
shifts the start of the academy's income by each stage's own wait. Rather than run a corpus that
could only rediscover multiplication, the number is **measured in a test that holds it**
(`tests/round41-academy-build.test.ts` §3), on a career at reputation 1.0 that orders all four
stages in one week:

| | cents a week |
| --- | ---: |
| the whole academy, once built | **$7,250** |
| banked over the 12-week build (staff from w+3, courts from w+6, clubhouse from w+12) | **$47,150** |
| had all four arrived at once, as they did before this item | **$87,000** |
| **deferred by the wait** | **$39,850**, once |

**PREDICTED before the run:** «the delay shifts income start by weeks; a career loses on the order of
one to two months of the academy's weekly line, once, and nothing recurring». **MEASURED:** $39,850,
45.8% of the build window, paid once in a career – against a $12,000,000 shelf price, 0.33% of the
purchase. The corridor is untouched: a career that waits the build out is in exactly the state it
was in before, one quarter later.

⚠ **The three stages now hold three different clocks inside one academy**, which is the one genuinely
new fact and is why `tests/round38-academy-worth.test.ts` re-aimed six expectations from
`w.week − boughtWeek` to the row's own `basisWeek`. The LAND's numbers in that file are byte-identical
across this item, which is what makes the pair its own control.
