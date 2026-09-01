---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-31
---

# The brand's multiple follows her fame – predicted vs measured (round 32 #3, 31.08.2026)

**His report, on his own w933 career:** «личный бренд в цене подрос с 250к до 1.8м, а доход у него
1800 в неделю =))) что как-будто бы не очень соответствует стоимости. Надо как-то настроить этот
момент.»

**His ruling on the repair, which is this spec's specification:** «её известность 22.3 – да, это ок,
главное, чтобы **эта известность участвовала в механизме**, тогда мы увидим разницу на других
карьерах.»

**And his standing ruling, which bounds it:** «а что с этой цифрой не так? вроде бы как раз
спонсорские коллаборации со спортсменами дают и не такое, кратно большее.» The ceiling is not to be
cut.

Companion to `brand-worth-and-income-2026-08.md`, which is round 30 #23/#24 and is where the income
curve, the ladder and the crowd term were sized. This one moves exactly one thing: the base the
ladder sits on.

---

## 1. The verdict, in one table

| | before | **after** | |
| --- | ---: | ---: | --- |
| his w933 row – multiple | 18.23x | **9.30x** | reads 9 on the shop row |
| his w933 row – worth | $1,630,191 | **$831,382** | −49.0% |
| his w933 row – weekly gross | $1,720 | **$1,720** | ⭐ untouched, to the cent |
| worth at fame 100, his record | $32,702,966 | **$32,702,966** | ⭐⭐ identical to the dollar |
| peak worth, best career in the bench | $35.88M | **$35.88M** | ⭐⭐ identical |
| peak worth, median career | $14.66M | **$11.61M** | −20.8% |
| **day-one worth, median (round 30 #9's anchor)** | **$233,173** | **$78,740** | ⚠⚠ **−66.2%, and §4 is why it could not be held** |
| in-career 52w falls, median depth | −32.8% | **−36.9%** | deeper, §6 |

---

## 2. ⭐ THE CONTROL – measured on his save before anything was proposed

`npx vite-node <probe> -- --save ~/Downloads/tennis-sim_alice-cfbv_w933.tsave`, read through the
game's own import door. ⚠ **The save is READ-ONLY and nothing derived from it is in this repo** – no
fixture, no copy, no committed byte. Only the numbers below crossed over. The guard
(`tests/round32-brand-multiple.test.ts` §7) MIRRORS the shape out of its own fixtures.

```
fame            22.3268 / 100
proSeasons      14        topSeasons 1        finalsLost 19
roomSize        4,743      (crowd multiplier 1.15, at its clamp)
winRate         68.2%
weekly gross    $1,720      = perFamePointCents($30) x fame² / famePivot(10) x crowd
annual gross    $89,428
multiple        18.2291x    (base 14 + 2.40 + 0.30 + 1.20 + 0.33; cap maxX = 20)
worth           $1,630,191
owned row       bought week 782, paid $250,000, stored value $1,635,285
```

His arithmetic is exactly right: $1.8M on $1,800/wk is ~19x, and nothing here is a typo or a unit
slip. **The defect is what the multiple ASKS ABOUT.** Every term of it reads her tennis career and
none reads the brand: a fourteen-season veteran earns an all-but-maximum multiple on a business
turning over $89k a year, and `baseX` was already 14 before a single achievement, so **an unknown's
brand traded at 14x** too.

---

## 3. The change

`brandMultipleX`'s base becomes a ramp:

> `x = unknownX + (baseX − unknownX) × min(1, max(0, fame / ECONOMY.fame.cap))`, then the four career
> rungs unchanged on top, then `min(maxX, …)`

with `ECONOMY.business.merch.value.unknownX = 2.5` and `baseX` still the rung's own
`earningsMultipleX = 14`. Nothing else moved – not the income curve, not the crowd term, not the four
rungs, not `maxX`, not `fameFloorOf`, not the half-life, not the fame stock.

⭐⭐ **THE TOP CANNOT MOVE, BY CONSTRUCTION RATHER THAN BY A CAP.** The ramp reaches `baseX` exactly
at `ECONOMY.fame.cap`, so at fame 100 the multiple is `baseX + ladder` – the pre-wave expression,
term for term, for **every** career. §5 measures it on the whole bench and finds zero drift.

⚠⚠ **TWO SHIPPED CLAIMS ARE OVERTURNED, and both are named in the code rather than left to rot.**

1. **«A title moves the income and NOT the multiple.»** It moves both now, because it moves fame and
   fame is the base. That sentence was a defence against the one-dial defect – pricing one fact
   twice – and the answer to it is that these are not one fact priced twice but the two questions a
   buyer actually asks: *how much does it earn*, and *how big is it*. The size of this business is
   her fame. A brand doing $89k of trade does not change hands at the multiple of one doing $1.5M,
   whatever the founder's résumé says. ⭐ What must still be true is that the four CAREER rungs never
   see a title, and that is guarded (§4 of the test file, round 30's M15 kept).
2. **«The multiple does not fall.»** It can now. The ratchet argument was that a career that happened
   cannot un-happen – still true of the four rungs, which are monotone and subtract nothing. What
   can un-happen is being TALKED ABOUT. §6 measures what that costs.

---

## 4. ⚠⚠ THE ANCHOR THIS COULD NOT HOLD, AND IT IS ARITHMETIC AND NOT A TUNING MISS

Round 30 #9 sized `earningsMultipleX` so that **the brand is worth about what it cost at the fame a
family holds the week it can first afford it** – median fame **9.6**, median worth **$233,173**
against a $250,000 price. That anchor and his round-32 complaint **cannot both be satisfied by any
multiple that rises with fame.** The proof needs no measurement:

* the income is convex in fame, so at his fame 22.3 the brand earns **6.2×** what it earns at the
  day-one fame 9.6 ($89,428 against $14,377, before the crowd tilt);
* a multiple that rises with fame – which is his whole ruling – has **m(22.3) ≥ m(9.6)**;
* his career also dominates the day-one career on all four rungs, so the ratio is ≥ 1 again;
* therefore **worth(22.3) ≥ 6.2 × worth(9.6)** in every monotone design.

Pin the day-one worth at $233,173 and his row cannot go below **$1.45M**, which is not an answer to
what he reported. Bring his row to the hundreds of thousands and the day-one number must follow it
down. **Measured, at `unknownX = 2.5`:**

| day-one, 70 careers that could ever afford it | before | **after** |
| --- | ---: | ---: |
| fame that week (unchanged – nothing in this wave touches fame) | median 9.6 | median 9.6 |
| multiple that week | 15.9 | **5.5** |
| worth that week | $233,173 | **$78,740** |
| at or above what it cost on day one | 33/70 | **12/70** |
| under the $62,500 mark floor on day one | 6/70 | **27/70** |

⚙ **THE FRONTIER, so the trade is his to move and not mine.** Every setting was computed on his own
row and on the day-one population; `unknownX` is one line in `ECONOMY.business.merch.value`.

| `unknownX` | his multiple | his shop row | his worth | day-one worth | vs today |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 2.0 | 8.91 | 9 years | $796,658 | ~$73k | −69% |
| **2.5 (shipped)** | **9.30** | **9 years** | **$831,382** | **$78,740** | **−66%** |
| 3.0 | 9.69 | 10 years | $866,120 | ~$86k | −63% |
| 4.0 | 10.46 | 10 years | $935,582 | ~$99k | −58% |
| 5.0 | 11.24 | 11 years | $1,005,044 | ~$112k | −52% |
| 14 (today) | 18.23 | 18 years | $1,630,191 | $233,173 | – |

⚠ The shipped row's day-one figure is the bench's measured median; the others are the same arithmetic
evaluated at the day-one population's median fame (9.6) and median ladder (+1.9), which reproduces
the measured row to 0.5% and is what the `~` marks.

**2.5 is the HIGHEST value that still reads single digits on the shop row at his fame** – the row
rounds whole (his 26.08 rule), and 3.0 already prints «10 years», which is not an answer to what he
wrote. So the shipped setting is the LEAST aggressive one that answers him: every point of `unknownX`
above it is a point of the day-one anchor bought back, and 2.5 is where the two demands meet. It also
sits inside the two-to-five band a firm turning over $89k a year changes hands at, which is the
sanity check the round-32 ledger reached for.

⭐ **THE DIAL THAT WOULD RESTORE THE ANCHOR WITHOUT TOUCHING HIS ROW IS THE PRICE, and it is his to
rule on.** At fame ~10 the brand takes in $17,940 a year; the model now says that business is worth
about $79k. `entryCents` is $250,000. Moving it to the $80–100k range restores «worth about what it
cost on the day they can afford it» exactly, and it makes the one rung whose whole pitch is «дешевле
академии» genuinely cheap. ⚠ **Not done here, and not a one-liner in disguise:** the price is also
the affordability gate, so lowering it moves WHICH week a family buys, which moves the day-one fame,
which moves the day-one worth again – a fixed point that needs its own bench pass. Filed, priced,
not shipped.

---

## 5. ⭐⭐⭐ THE CROSSOVER – where `maxX` binds, and what actually holds the top

The income already goes as `fame²`. A multiple that also rises with fame makes the **worth go as
`fame³` until `maxX` binds**, so where it binds is what decides whether the curve's shape was chosen
or inherited from a multiplication.

> **`maxX` (20) starts binding at fame 91.3, and only for a career maxed on all four rungs. For the
> bench's median career it NEVER binds.**

So the honest answer to «where does the cap start biting» is: **almost nowhere, and the cap is not
what holds the top.** The `fame³` region is the whole range for a normal career. That would be the
failure the round-32 ledger warned about – «if it binds only at fame 90+, the middle of the range
grows faster than anyone intended» – **except that the shape was chosen so that the cap does not have
to hold anything.** The ramp's own endpoint holds the top: it lands on `baseX` at `ECONOMY.fame.cap`,
so the fame-100 multiple is the pre-wave multiple by construction, cap or no cap.

⭐⭐ **PROVEN ON THE RUN AND NOT ARGUED:** re-asking `brandMultipleX` at fame = cap for every week of
every career in the bench – **56,160 / 56,160 career-weeks unchanged, worst |delta| 0.0.**

And because the top is pinned, «worth goes as `fame³`» does not mean the middle inflates – it means
**the bottom comes down**, which is the only thing the owner asked to move. The whole range, on his
own record held fixed and fame swept:

| fame | weekly | annual | before x | before worth | **after x** | **after worth** | ratio |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | $345 | $17,940 | 18.23 | $327,030 | **7.88** | **$141,351** | 0.432 |
| **22.3** | **$1,720** | **$89,428** | **18.23** | **$1,630,191** | **9.30** | **$831,382** | **0.510** |
| 40 | $5,520 | $287,040 | 18.23 | $5,232,475 | **11.33** | **$3,251,899** | 0.621 |
| 60 | $12,420 | $645,840 | 18.23 | $11,773,068 | **13.63** | **$8,802,204** | 0.748 |
| 80 | $22,080 | $1,148,160 | 18.23 | $20,929,898 | **15.93** | **$18,289,130** | 0.874 |
| **100** | **$34,500** | **$1,794,000** | **18.23** | **$32,702,966** | **18.23** | **$32,702,966** | **1.000** |

The weekly and annual columns are identical in both arms at every row – this wave never touches the
income – and the ratio column rises monotonically to exactly 1.000 at the top.

⚠ The income column carries HIS crowd tilt (roomSize 4,743, so `brandCrowdMult` is at its 1.15
clamp), because the whole record is held fixed and only fame is swept. The bare curve at fame 100 is
$1,560,000 a year; $1,794,000 is that times 1.15, and it is the same figure `brand-dynamics.ts`
reports as the best peak income in the run.

---

## 6. ⚠ THE SLUMP NOW COMPOUNDS, and here is how much

`npx vite-node tools/brand-dynamics.ts -- --seeds 8 --weeks 780`, 9 presets × 8 seeds × 780 weeks,
policy `player`. Both arms are read off **the same walk**: the tool's `pre32MultipleX` asks the
shipped `brandMultipleX` at fame = cap, which returns the old flat-base answer exactly, so the
before/after cannot suffer the arm-divergence hazard CLAUDE.md records.

| 52-week windows, career live at both ends (40,935 of them) | fell | median | worst |
| --- | ---: | ---: | ---: |
| worth, **shipped** | 24.9% | **−36.9%** | **−55.4%** |
| worth, pre-round-32 multiple | 25.3% | −32.8% | −50.5% |
| income (untouched by this wave) | 26.3% | −31.9% | −50.8% |

The fall happens no more OFTEN – marginally less often, in fact – and it goes about four points
DEEPER when it happens, because the income falls as `fame²` and the multiple now falls with fame on
top of it. ⭐ That is the asset behaving like an asset twice over, and the mark floor
(`businessValueFloorShare = 0.25`) still stops it reaching zero. It is guarded in
`round30-brand-value.test.ts` §3, where the same fixture is priced under both multiples and the
pre-32 fall is asserted to be the shallower one.

---

## 7. ⚠ WHAT ELSE MOVED, named rather than discovered later

**a. A top-20 career with no titles now prices at the mark.** Round 30 #24's arm – «a career with no
title, no Slam final and no top-10 season is worth something» – built four top-20 seasons, which
carry a fame floor of ≈7. Its brand still **earns** (which is #24's actual claim, and it earned
exactly zero before #24), but at fame 7 the multiple is ≈5.6 and the gross worth lands under the
$62,500 mark, so the row is worth the mark. The guard was rewritten to say that, in both directions:
the mark is the floor under her, and the same career at the top of the ramp is worth real money.

⚠ **This is the fame wall, not this wave.** Her fame is small because fame is fed by TITLES
(`fameFloorOf`), and a top-20 career that never wins one has almost none – the same wall round 31 §5
and the elite-shape research already filed. Round 32 #3 makes that wall **matter more**, because fame
now reaches the valuation twice.

**b. The shop row's number changed, and no string did.** `shopView` sends
`Math.round(brandMultipleX(...))` into a sentence that already existed («Worth N years of what it
sells»). His row goes from 18 to 9. Invariant 4 is intact: not a character of user-facing copy was
touched.

**c. No schema move, and here is the check rather than the assumption.** `OwnedAsset.valueCents` IS
persisted (`src/shared/protocol/profile.ts`), but `revalueAssets` is its one writer and runs at the
top of every tick, and for a business row it is a pure function of (career, week) – no path
dependence, nothing to migrate. `SAVE_SCHEMA_VERSION` stays at **68**; no field was added, removed or
re-meant.

⚠⚠ **BUT A LIVE CAREER'S BRAND VALUE MOVES UNDER HIM AT THE NEXT TICK, AND THAT IS THE POINT OF THE
ITEM.** On his own w933 save the stored row reads $1,635,285 today and will re-price to ≈$831,000 the
first week he advances. He asked for this; it is stated here so it is a decision on the record and
not a surprise. His purchase is still well up: he paid $250,000 at week 782.

**d. Zero draws, zero RNG movement.** `world/brand.ts` takes no `Rng`, no clock, no `Math.random`, and
persists nothing; every number is a fold over records the career already keeps. The frozen MAIN
capture (41550 / `e6b0c709`) and every career hash are unmoved, and the gate run is what says so.

---

## 8. The guard

`tests/round32-brand-multiple.test.ts` – 14 arms in seven sections: the ramp's two ends and its
clamps, the top-does-not-move proof, fame participating (two careers with identical records and
different fame), the four rungs still additive and still blind to titles, the multiple falling, the
crossover, and his own row mirrored. **Mutation-verified against seven mutations** – the ramp
deleted, inverted, unclamped both ways, scaled instead of ramped, the constant turned back to 14, and
the fame term replaced by a constant – each applied alone and reverted; the log is at the foot of the
file. `tests/round30-brand-value.test.ts` was repointed at `unknownX` wherever its fixtures are
fameless, with every moved claim named in place.
