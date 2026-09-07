---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-09-06
---

# Presence is a different fact from a result – round 38 #2c and #3d

**Status: SHIPPED, round 38 (06.09.2026).** §5 is predicted against measured over 29 of the owner's
own careers; §6 is the decline half and the one thing it deliberately does NOT fix.

## 1. What he asked, and what he had asked before

**06.09:** «Бизнес: он никогда не читал таблицу – я уже поднимал этот вопрос и приводил аргументы.
Коротко еще раз: спортсменка проводит свой лучший сезон (и не один) находясь в топ-100 и входя иногда
в топ-50 даже, у нее явно есть и репутация и о ней знают, не могу забыть за год. Не уверен, что в
жизни так работает. Ты этот аргумент принимал и мы должны были чинить это поведение в купе со
стоимостью и доходностью делая его более плавным.»

⚠ **He is right that he had raised it, and it WAS built.** `brand-inertia-2026-08.md` (round 32 #4)
installed the slow stock – «the best she has ever been, faded on a half-life measured in years and
floored at a share of that best» – and it is live and measured on this same save. So the question is
not «was it done» but «why is the career he is looking at still falling a quarter a season».

## 2. The answer, in the game's own numbers

The stock was doing its job. What was NOT being paid for was **presence**, and the three lines below
are the whole of it, read off his week-1115 career (17 professional seasons, 9 inside the top 100,
4 inside the top 50, best #20):

| what the world paid her for | what it was worth to her at week 1115 |
| --- | --- |
| 9 seasons ended inside the top 100 | **0** – `fame.seasonEndBands` stopped at rank 50 |
| 4 seasons ended inside the top 50 | 1.5 each, decayed on the **104-week TITLE clock** |
| her best season ever – #20, wrapped at week 884 | `4 x 2^(-231/104)` = **0.86 fame points** |
| one WTA 500 title, one Sunday afternoon | **8** fame points |

So a decade of being a professional the world can name was worth less than one afternoon, and the
part of it that WAS paid faded on the clock built for single results. That is «не могу забыть за
год», stated in constants.

## 3. The change – five dials, and what each one is for

| dial | was | is | what it does |
| --- | --- | --- | --- |
| `fame.seasonEndBands` | stops at 50 | + `{100, 0.6}` | a top-100 season is worth something at all |
| `fame.seasonHalfLifeWeeks` | (did not exist) | **312** | a season is remembered on a CAREER clock, six years, not the title's two |
| `merch.strength.retention` | 0.78 | **0.95** | lets the slow stock actually govern the tail |
| `merch.strength.halfLifeWeeks` | 208 | **312** | the stock itself falls half as fast |
| ~~`merch.strength.floorShare`~~ | 0.4 | **0.4 – RAISED AND SENT BACK, see below** | where the decay stops |

⚠⚠ **`retention` is the dial that makes the others work, and the reason is counter-intuitive enough
to be worth stating.** `brandReachOf` reads `max(fame, retention x strength)`. At 0.78 the stock
floored the reach at 78% of her best – which her CURRENT fame had fallen below, so the floor was
binding and the floor was what smoothed her. Raising her fame with the season ladder pushed her back
ABOVE that floor and therefore back onto the fast title clock: **the level rose and the slope got
worse, -27.2% a season becoming -33.8%.** Measured, not predicted; it is the reason this spec has
five dials and not two.

## 4. The `seasonFloorDecayAt` split

A third curve, beside `decayAt` (titles, 104w) and `shootFloorDecayAt` (campaigns, 52-156w by band).
⚠ It is a third CURVE and not a third COPY: three facts about how long the world remembers three
kinds of thing, one shape. The precedent is exact – `shootFloorDecayAt` was split off `decayAt` on
this same argument in round 32 #5.

⚠ **It shipped at 104 first**, identical to the title clock, so the split could be proved a no-op
before it was tuned. `tests/r38-fame-presence.test.ts` pins that it stays the LONGEST of the three:
a season forgotten faster than the title won inside it is this change written upside down.

## 5. Predicted against measured – his week-1115 career

`tools/r38-fame-presence-sweep.ts`, 29 of his saves, 22 with a professional season.

| arm | fame | gross/wk | worth | season change | worth in 5 years | share left |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| **shipped before this** | 14.4 | $4,565 | $2,576,989 | **-27.2%** | $185,285 | **7.2%** |
| + rung 100 only | 15.8 | $4,805 | $2,739,555 | -30.7% | $199,488 | 7.3% |
| + career clock 312w | 22.6 | $6,102 | $3,653,858 | -33.8% | $260,008 | 7.1% |
| + retention 0.95 | 22.6 | $6,965 | $4,291,862 | -29.1% | $401,640 | 9.4% |
| **+ stock clock 312w = SHIPPED** | 22.6 | **$8,111** | **$5,172,791** | **-23.3%** | **$401,640** | **7.8%** |

**What it buys him:** the brand is worth twice what it was, it falls a quarter less steeply, and five
years after she stops it holds $401,640 instead of $185,285.

⚠⚠ **THE FLOOR WAS RAISED TO 0.5 AND HE SENT IT BACK THE SAME DAY.** 07.09: «он вполне может падать
и на 185к и ниже, особенно если давно не было рекламных контрактов… Или она вообще не играла и в
турниры не ходила 5 лет. Это тоже можно смоделировать. Вопрос в формуле расчёта стоимости бренда
здесь мне кажется. А ставить планку "не ниже 662к" – это немного странно, кому нужен бренд, если он
пустой?» So `floorShare` is his own round-32 0.4 again, untouched, and the $662,364 line below is
kept as the measurement rather than as a proposal. ⚠ HIS QUESTION IS ABOUT THE FORMULA AND IS STILL
OPEN: should a brand be able to reach nothing at all, and what does five years of a career that
STOPPED ENTIRELY – no tournaments, no contracts – look like? That is a modelling job
(`tools/r38-fame-presence-sweep.ts` already projects a tail; what it does not do is stop her
playing), and it is not this wave.

⚠ **AND THE KERNEL PUTS A CEILING ON THIS DIAL ANYWAY.** `strengthDecayAt` is
`max(floorShare, 2^(-d / halfLifeWeeks))`, so any floor above 0.5 clips the curve before it has
completed a single halving and `halfLifeWeeks` stops describing anything – a constant whose name is a
lie, and `tests/round32-brand-inertia.test.ts` says so directly («half at the half-life»). So
whatever the answer to his formula question turns out to be, it cannot be a `floorShare` above 0.5 –
it has to be a change to the shape.

**⚠ What it does NOT buy:** the season-over-season fall is -23.3%, not zero. A brand whose owner
stopped winning three years ago SHOULD fade; what it may not do is evaporate.

### The constraint, and it held

⚠⚠ **The top of the shelf may not move.** Measured across all four tail dials at 0.78 / 0.85 / 0.90 /
0.95 retention and 0.4 / 0.5 / 0.55 / 0.65 floor share: his two peak careers read **the same worth to
the cent** every time ($14,608,499 and $18,033,914). That is `retention < 1` doing what its own header
claims – at a running peak `strength` IS `fame`, so the `max` resolves to fame and the tail dials
cannot reach the best careers.

⚠ **The fame LADDER does move them, and that is the feature rather than a leak.** Careers with many
top-100 seasons gain through the new rung: his week-896 career +12.5% ($12,988,423 -> $14,608,499)
and the week-570 one +9.9%. Presence pays everybody who has it.

### `floorShare` is a pure tail dial

Every live figure at every week is IDENTICAL at 0.4, 0.5, 0.55 and 0.65 – the exponential still
dominates for the first two years. What it decides is where the fall STOPS: $185,285 at 0.4,
$662,364 at 0.5, $822,515 at 0.55 and $1,003,920 at 0.6, five years out.

## 6. The decline half – #3d

**HE RULED:** «они и не беспомощны… Может разве что тоже плавнее сделать» AND «Хотя может быть для
формального окончания игры это и ок». Both halves are honoured: `ageCurve.declineAccel` **0.28 ->
0.24**, and nothing else.

`tools/r38-decline-shape.ts`, exact arithmetic rather than a walk:

| accel | loss/season at 35 | share of peak at 40 | body can end the career at |
| --- | --- | ---: | ---: |
| 0.28 (was) | 4.76% | 0.601 | 42 |
| **0.24 (is)** | **4.35%** | **0.628** | **42** |
| 0.22 | 4.14% | 0.642 | 43 |
| 0.18 | 3.72% | 0.671 | 44 |
| 0.14 | 3.29% | 0.701 | 45 |

⚠⚠ **0.24 AND NOT 0.22, AND A PIN THIS REPO LEFT AS A TRIPWIRE IS WHY.** `tests/ending.test.ts` pins
that the off-season her body first falls to 70% is the off-season she is first 38 – the equivalence
that let `ENDINGS.stopAskingAgeYears = 38` be DELETED and replaced by a body-share rule, with its own
comment saying «if this line ever needs changing then the claim the change was sold on has stopped
holding». Measured: at 0.22 she reads 0.7019 at 38 and crosses during her 39th year, breaking the
equivalence by 0.0019 of share. At 0.24 she reads 0.6905 and the body and the birthday name the SAME
off-season, exactly as before. The softening is taken up to that pin and stops there.

⚠ **A FLOOR WAS MEASURED AND REFUSED.** `ENDINGS.lastOfferPeakShare` is 0.55 and `ending.ts` marks an
off-season offer FINAL at or below it. A floor at 0.45 or 0.50 never binds before 0.55 is crossed, so
it would have been decoration; a floor at 0.55 or above would have made the final offer unreachable
and no career could ever be ended by the body. `tests/r38-decline-shape.test.ts` carries that guard
with a mutation arm, because nothing else in the repo asks the question and it fails silently.

### What it costs, stated rather than buried

Four pins moved and each one is a real consequence:

* **The last off-season offer arrives at 42 instead of 41** (the crossing 41.2 -> 41.9, and the
  question is annual). `tests/ending.test.ts`.
* **The recovery corridor opens slightly for veterans** – 5.00 / 4.49 / 4.14 / 3.55 / 2.93 at
  29 / 33 / 35 / 38 / 41, against 5.00 / 4.46 / 4.09 / 3.45 / 2.79. It reads
  `physicalMean / peakPhysical`, so a body that decays more slowly also recovers better. Nothing
  asked for that; `tests/recovery-fade.test.ts` is where it is visible.
* **The share left at 33 / 38 / 41 is 90% / 71% / 59%**, against 89% / 69% / 56%.
  `tests/peak-physical.test.ts`.
* **The recovery floor still fires after the career has ended** – 43.1 against an ending at 41.9,
  a gap of 1.23 years where it was 1.14. The relationship this pin guards is intact.

⚠⚠ **AND IT IS NOT WHAT CAUSED «из топ-50 до топ-150 за сезон».** Her four attributes read 45-50
where the tour's elite read 65-70, so a loss of any size is decisive there. Softening the slope by
13% does not change that story, and saying so is the point: the LEVEL is wave C's question (C2,
`potentialBand`) and it is still open.
