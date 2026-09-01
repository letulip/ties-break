---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-09-01
---

# Brand inertia – a built brand must not evaporate with this year's noise

**Status: SHIPPED, round 32 #4 (01.09.2026), and REVISED the same day. §7 was his ruling and §8-§13
are the first pass's predicted vs measured; ⭐⭐⭐ §14 IS HIS REVISION AND §15-§19 ARE ITS MEASUREMENT.
READ §14 FIRST – it overturns where the memory lives, and §8's headline table is superseded by §16.**

⚠ **Measured TOGETHER with `collaborations-as-early-fame-2026-08.md` (round 32 #5)** on his own
instruction – «совместный эффект – мерить, да». The headline is the COMBINED arm; each feature alone
is beside it so the interaction is visible rather than assumed. One bench answers both:
`tools/r32-brand-inertia.ts`.

## 1. What he asked

«А еще интересно, что будет происходить с годами падения в таблице (как у нее сейчас) – известность
тоже будет падать и стоимость бренда, соответственно?» – and, on being shown the answer: «Инерция
бренда – звучит интересно, давай попробуем».

## 2. The measurement that forces this – his own w933 career, nothing new won

Projected forward with only decay running (`tools/r32-fame-read.ts`):

| | fame | weekly | multiple | worth |
| --- | ---: | ---: | ---: | ---: |
| now | 22.3 | $1,720 | 9.30x | **$831,382** |
| +1 year | 15.2 | $801 | 8.48x | $353,412 |
| +2 years | 9.7 | $327 | 7.85x | $133,266 |
| +3 years | 6.2 | $132 | 7.44x | $51,237 |
| +5 years | 2.7 | $25 | 7.04x | **$9,098** |

⚠⚠ **A 99% capital loss in five years.** The cause is arithmetic, not tuning: fame halves every 104
weeks, income goes as `fame^2`, and after round 32 #3 the multiple rises with fame too – so worth
goes as `fame^3` and **falls eightfold every two years**.

⚠ Note this is NOT a defect introduced by #3. Before #3 the multiple was flat, so worth went as
`fame^2` and still fell fourfold every two years – $1.63M to about $102k over the same five. #3 made
a steep curve steeper; it did not create it.

## 3. Why it is wrong

A brand is not a measure of how loud this year is. Once built it holds a name, a shelf, a
distribution and a customer who already owns two of its shirts. Real athlete brands survive the
athlete's decline and often outlive the career entirely – that is the whole reason the owner called
the merch line «фундамент для этого слоя». What we model today is not a brand; it is a live reading
of attention, priced as if it were one.

## 4. The proposal

A second, slower stock: **brand strength**, accumulated from fame rather than equal to it.

- it RISES while fame is above it, at some fraction of the gap per week;
- it FALLS far slower than fame – or not at all below a high-water mark, which is a decision below;
- the brand's INCOME keeps reading fame (this year's noise really does sell this year's shirts);
- the brand's WORTH reads brand strength, so the asset holds while the income breathes.

⭐ THE POINT OF THE SPLIT, stated so a later reader does not collapse it back: income is a flow and
should follow attention; worth is a stock and should follow what has been built. Today one number
does both jobs and neither well.

## 5. What must be decided before it is built

1. **Does strength ever fall, and how far?** A pure high-water mark makes the brand un-loseable,
   which removes a real stake; a slow decay keeps the stake and still ends in zero eventually. ⭐ My
   recommendation: decay, but on a half-life measured in YEARS not weeks, plus a floor at a share of
   the peak so a career that was genuinely big never prices at the mark.
2. **Does it apply retroactively?** His live career sits at week 933 with a brand freshly re-priced
   to ~$831k by #3. A strength stock seeded from today's fame gives the same number today and a
   flatter curve from here. ⭐ Recommended: seed from the CURRENT fame so nothing jumps.
3. **Does it need the save?** Almost certainly yes – a stock with memory cannot be recomputed from
   (career, week) the way `revalueAssets` does today. That is the full four-part schema move.

## 6. Acceptance

- His w933 career, projected five years with nothing won: worth must not fall by 99%. A defensible
  target is a decline of the same ORDER as the income's, not its cube.
- The top of the shelf is unmoved: a career at fame 100 prices as it does today.
- A career that never built anything gains nothing – strength is accumulated, so an unknown's brand
  is still worth an unknown's brand.
- ⚠ Invariant 5: predicted vs measured, and a bench.

## 7. HIS RULINGS (31.08) – §5 is closed, this spec is ready to build

1. **Does strength fall?** «падает, но с полураспадом в годах, плюс пол в доле от пика – чтобы
   карьера, которая реально была большой, никогда не оценивалась по минимуму. – да» ⭐ Both halves
   are his: a half-life measured in YEARS, and a floor as a SHARE OF HER OWN PEAK. The floor is
   personal, not global – a big career never prices at the mark, a small one still can.
2. **Retroactive?** «вообще всё равно, игроков нет пока.» ⭐ So it is my call and I take the cheap
   one: seed the stock from the CURRENT fame, so no existing career's number jumps on the tick after
   the merge. Nothing about that choice is load-bearing and a later wave may revisit it.
3. **The save.** «главное обратная совместимость чтобы работала» ⚠ The four-part move, and the
   binding half of his sentence is the migration: append-only, every older schema still loads, a
   golden fixture per version, `npm run e2e:fixtures`. A save that cannot be opened is the one
   failure this feature is not allowed to have.
4. **Measured together with the collaboration spec.** «совместный эффект – мерить, да» ⚠ Both push
   on the same number; the bench reports the COMBINED arm, not two separate ones summed.

---

## 8. ⭐⭐⭐ THE HEADLINE – his w933 career, five years forward with nothing new won

`npx vite-node tools/r32-brand-inertia.ts -- --save ~/Downloads/tennis-sim_alice-cfbv_w933.tsave`,
read through the game's own import door. ⚠ **The save is READ-ONLY and nothing derived from it is in
this repo** – no fixture, no copy, no committed byte. Only the numbers below crossed over; the guard
(`tests/round32-brand-inertia.test.ts` §3) MIRRORS the shape out of its own fixtures.

**⭐ THE COMBINED ARM IS THE ANSWER, and it is the table to read:**

| | **A control** | **B inertia only** | **C collabs only** | **D COMBINED (ships)** |
| --- | ---: | ---: | ---: | ---: |
| now | **$831,382** | $831,382 | $952,076 | **$952,076** |
| +1 year | $353,412 | $649,022 | $405,378 | **$767,549** |
| +2 years | $133,266 | $440,317 | $148,419 | **$519,494** |
| +3 years | $51,237 | $300,284 | $55,225 | **$353,514** |
| +5 years | **$9,098** | $141,579 | $9,442 | **$166,060** |
| **five-year fall in WORTH** | **−98.9%** | **−83.0%** | −99.0% | **−82.6%** |
| five-year fall in INCOME | −98.6% | −98.6% | −98.7% | −98.7% |
| five-year fall in FAME | −88.0% | −88.0% | −88.5% | −88.5% |

⭐ **§6's acceptance, met and passed.** The bar was «not 99%, and a decline of the same ORDER as the
income's rather than its cube». Before this wave the worth fell **harder than the income** (−98.9%
against −98.6%) because it went as `fame³` against the income's `fame²`. It now falls **sixteen points
less far than the income does**, because the stock decays on a half-life measured in years while the
attention decays on weeks. **$9,098 becomes $166,060 – 18× the residual.**

⚠ **AND THE INTERACTION IS NOT ADDITIVE, which is the whole reason one agent measured both.** #5 alone
does nothing for the five-year fall (−99.0%: it lifts the level and the level decays exactly as
before). #4 alone answers it (−83.0%). Together the fall is fractionally *shallower* than #4 alone
(−82.6%) and the residual is 17% larger than #4 alone would give – because #5 raises the number the
pin is taken at, and the floor is a share of that. **Summing the two features' own deltas would have
reported the wrong number in both directions.**

⚠ **The row he complained about is unchanged where he complained about it.** Round 32 #3 brought his
brand from $1.63M to $831,382 on $1,720/week; the shipped arm reads **$952,076 on $1,937/week** – the
+14.5% is #5's, arrives with a matching +12.6% on the income, and the shop row still prints **9**,
which was #3's own sizing criterion. See the collaboration spec's §7 for why that criterion bounds
the setting.

---

## 9. What was built

⚠ **SUPERSEDED BY §15**: the stock survives unchanged – same kernel, same half-life, same floor – but
the SPLIT described below was corrected on 31.08. The income no longer reads bare fame and the worth
no longer prices on the stock directly; both read `brandReachOf`, and `brandBuiltSignals` is gone.

A second stock, `world/brandStrength.ts`, on fame's own 0..100 scale:

> `strength(w) = max over t ≤ w of  fame(t) × max(floorShare, 2^(−(w − t) / halfLifeWeeks))`

«The best she has ever been, faded on a half-life measured in YEARS, and never below a share of that
best.» ⭐⭐ **Both halves of §7.1 fall out of ONE kernel**: the fade is the half-life, and because the
kernel floors at `floorShare` the whole expression floors at `floorShare × her own peak fame` – a
share of HER OWN peak, personal and not global, needing no peak bookkeeping at all.

`ECONOMY.business.merch.strength = { halfLifeWeeks: 208, floorShare: 0.4 }` – four years against
fame's two, and two-fifths of her own best as the permanent floor.

**The split, in one line each:**

* `brandWeeklyGrossCents` still reads `fame` – **income is a flow and follows attention.**
* `brandGrossWorthCents` prices at `brandBuiltSignals`, which substitutes the stock for fame in BOTH
  its terms – **worth is a stock and follows what was built.** The shop row's «Worth N years of what
  it sells» goes through the same substitution, so the screen and the valuation cannot disagree.

⚠ **Not a character of user-facing copy changed** (invariant 4). What moved is the number inside the
sentence, exactly as in round 32 #3.

---

## 10. ⭐⭐⭐ THE TOP OF THE SHELF DID NOT MOVE, and it is by construction rather than by a clamp

Two identities hold for every possible career, and they are what the design is shaped around:

1. **strength ≥ fame, always** – the candidate at `t = w` is `fame(w) × 1`. **No career's brand is
   worth less after this wave than before it.** Nobody loses money on the merge.
2. **strength ≤ cap** – every candidate is a past fame (≤ cap) times a kernel (≤ 1). With (1) that
   **pins strength to exactly `cap` wherever fame is**, so the fame-100 valuation is the pre-wave one
   term for term.

⭐⭐ **PROVEN ON THE RUN AND NOT ARGUED,** to round 32 #3's own standard: re-asking the WORTH at
fame = cap for every week of every career in the bench – **56,160 / 56,160 career-weeks unchanged,
worst |delta| 0 cents.** The same identity holds at every week fame is at its own running maximum, so
**each career's PEAK worth is untouched: 72 / 72 careers, worst |delta| $0** – and the distribution
says the same thing from the other side: the median peak worth reads **$34.49M and the best $35.88M in
all four arms**, to the cent.

⚠ **So the shelf's top is not merely capped, it is IDENTICAL** – and the whole of both features lands
in the middle and the bottom of the range, which is where the owner pointed.

---

## 11. What else moved, named rather than discovered later

⚠ **(a) AND (b) BELOW ARE WITHDRAWN BY §19** – the named case is back at the mark and the day-one
repair is gone, both because the mechanism that produced them is the one he stopped. (c) and (d)
stand, with (c)'s numbers re-measured in §19b.

**a. ⭐⭐⭐ THE CASE HE NAMED CLEARS THE MARK, and INERTIA is what clears it.** Round 30 #24's own guard
arm – four seasons ended #18, no title, no Slam final, no top-10 season, nothing signed, fame **7.24**
– is the career round 32 #3's spec §7a recorded as having fallen UNDER the mark floor:

| the named case | gross worth | the owned row |
| --- | ---: | --- |
| **A control** | $46,095 | **$62,500 – the mark, i.e. worth nothing it earned** |
| **B inertia only** | **$67,011** | **$67,011 – ABOVE the mark** |
| C collabs only | $46,095 | $62,500 – the mark |
| **D COMBINED (ships)** | **$67,011** | **$67,011 – ABOVE the mark** |

⚠⚠ **AND THIS IS WHY THE TWO ITEMS HAD TO BE MEASURED TOGETHER RATHER THAN SUMMED.** #5 was the item
filed to answer this case and #5 alone **cannot touch it** – the career has signed nothing, so there
is no delivered shoot to add. What lifts it is the stock remembering the fame she held at her last
season's wrap (8.61 against today's 7.24). ⭐ Once she signs what her band already writes her (two
band-2 deals, two shoots a year) she is well clear in every arm – $105,512 control, **$154,741
combined**.

**b. Round 32 #3's day-one cost is partly repaid, unasked.** That wave took the median day-one worth
from $233,173 to $78,740 and left 27/70 careers pinned at the mark the week they buy. A climbing
career is at or near its own peak, so the stock is at or just above its fame there:

| 70 careers that could ever afford it | A control | **D COMBINED** |
| --- | ---: | ---: |
| worth that week, median | $93,480 | **$103,918** (+11.2%) |
| under the $62,500 mark on day one | 25/70 | **21/70** |

**c. The in-career slump is materially shallower.** 52-week windows with the career live at both ends,
72 careers × 780 weeks:

| | fell in | median depth |
| --- | ---: | ---: |
| A control | 18.4% of windows | −34.4% |
| B inertia only | 17.7% | −26.2% |
| C collabs only | 18.0% | −33.2% |
| **D COMBINED** | **17.4%** | **−26.0%** |

⚠ **And the population effect is much smaller than his own row's, which is worth saying rather than
letting the headline stand alone.** Of 72 careers only **17** are still alive three years past their
own peak worth – the bench's elite careers are still climbing at week 780 – and for those the brand
holds **45.3% of its peak in the control against 47.6% combined.** The five-year table in §8 is a
career that has genuinely stopped winning, which is the case the owner reported and is not the median
career in a bench that mostly does not get there.

**d. No user-facing string moved, and no new randomness exists.** `world/brandStrength.ts` takes no
`Rng`, no clock and no `Math.random`; the stock is a fold over records the career already keeps and
never prunes. The frozen MAIN capture (41550 / `e6b0c709`) is untouched and `rngMain` is byte-identical
on all three frozen careers.

---

## 12. ⭐⭐ THE SAVE – the four-part move, and the one thing it is not allowed to fail at

«главное обратная совместимость чтобы работала.»

* `SAVE_SCHEMA_VERSION` **68 → 69** (main's value read, not assumed).
* an **append-only** v68 → v69 step in `engine/migrations.ts`; no shipped step edited.
* `tests/fixtures/saves/v69.json`, generated by running the shipped chain on v68.json – a **one-key
  diff**, `brandStrengthSeed`, plus the version.
* `npm run e2e:fixtures` – all six regenerated at v69.

⭐⭐⭐ **THE FIELD IS A PIN, NOT A STOCK, AND THAT IS THE DESIGN AND NOT AN IMPLEMENTATION DETAIL.**
`brandStrengthSeed = {week, value}` is written **once, by the migration, and by nothing else** – not
`createWorld`, not any phase of the weekly tick. Four things follow, and all four are load-bearing:

1. **His career does not jump.** The pin is the fame the save is holding right now, and the derivation
   treats every week at or before it as already answered – so the valuation at the pinned week is
   unchanged to the cent and only the years after it are flattened. §7.2 gave the latitude («вообще
   всё равно, игроков нет пока»); this is the cheap half of it taken and the expensive half – re-pricing
   a fifteen-season history through a new kernel – refused.
2. **A new career carries no pin** and reads its whole own history, which is what a new career should do.
3. **There is no per-week write**, so no ordering to get wrong and no idempotence to protect: the
   second press of the fast-forward button prices the brand exactly as the first.
4. ⭐⭐ **The frozen career hashes move by `schemaVersion` alone.** A stock written weekly WOULD have
   appeared on `selfTravelling` – her fame is 2.55 at week 156, first positive at week 122, measured –
   and the re-freeze would have moved two keys instead of one. `tools/frozen-key-diff.ts` against the
   branch's own base, all three careers: **1 key of 72 – `schemaVersion`**, with `rngMain` AND
   `offers` byte-identical, and `brandStrengthSeed` appearing on none of the six captures. `PRE_V69` is the byte-level half: rolling only the number back to 68
   reproduces all three v68 constants.

**Every older schema still loads, and the ladder is how it is proven rather than asserted:**
`tests/goldenSaves.test.ts` migrates all seventy fixtures v0…v69 to the current schema, and
`round32-brand-inertia.test.ts` §5 walks v0 / v31 / v35 / v46 / v57 / v67 / v68 by name and asserts
each comes out pinned at its own week with its own fame.

---

## 13. The guard, and the frontier if he wants it moved

`tests/round32-brand-inertia.test.ts` – 25 arms in nine sections, **mutation-verified against twelve
mutations** (the log is at the foot of the file), including the two that matter most: deleting the
week-itself candidate reddens the top-does-not-move arms, and pointing `createWorld` at the pin
reddens both §9 and the three frozen career hashes.

⚙ **THE FRONTIER, so the trade is his and not mine.** Both constants are one line in
`ECONOMY.business.merch.strength`, and the arithmetic below is his own row's:

Measured on his own row in the combined arm, all six settings, against a «now» of $952,076:

| `halfLifeWeeks` / `floorShare` | strength at +5y | worth at +5y | five-year fall |
| --- | ---: | ---: | ---: |
| 156 (3y) / 0.4 | 10.2 | $145,991 | −84.7% |
| **208 (4y) / 0.4 – shipped** | **10.8** | **$166,060** | **−82.6%** |
| 208 (4y) / 0.5 | 12.7 | $236,542 | −75.2% |
| 260 (5y) / 0.4 | 12.8 | $240,701 | −74.7% |
| 260 (5y) / 0.5 | 12.8 | $240,701 | −74.7% |
| 312 (6y) / 0.5 | 14.3 | $309,021 | −67.5% |

⚠ At five years the two dials are largely one dial on HIS row – the exponential has not yet fallen
through a 0.5 floor at a 260-week half-life, so `0.4` and `0.5` read the same there and diverge only
further out. The shipped pair is «half after four years, never below two-fifths of her own best».
Anything longer or higher is a bigger permanent residue, which is a decision about how much of a
career survives it rather than a correction – so it is filed here rather than chosen.

## 14. ⚠⚠ HIS REVISION (31.08) – THE MEMORY WAS PUT IN THE WRONG PLACE

⚠ *This block is his, verbatim, and is the specification §15 onwards is measured against. It was
written as «§8» and is renumbered here only because §8 above was already taken – nothing in it moved.*


He read the shipped measurement and stopped it: «меня смущает вот это: На пятом году бренд стоит
$166 060 при годовом доходе $1 352». He is right, and the fault is this spec's, not the build's.

**WHAT WENT WRONG.** §4 split flow from stock and assigned them: income reads fame, worth reads
strength. The split is right; **the assignment is not.** Income was left a bare function of fame and
falls **98.7%** over five years, so a worth that is floored while its income is not floats free of
the business: 123x annual earnings at the tail is not a valuation, it is a number that has stopped
being about the thing it prices.

**AND THE PREMISE WAS ALREADY IN THIS SPEC'S OWN §3**: a brand holds «a name, a shelf, a
distribution and a customer who already owns two of its shirts». That customer keeps buying when she
stops winning. So it is the REVENUE that should not collapse – the valuation's stability is a
consequence, not a thing to install separately.

**THE REVISED SHAPE, and it is fewer mechanisms rather than more:**

    effectiveReach = max(fame, retention x strength)      // retention < 1
    income          = f(effectiveReach)                   // the existing curve, unchanged
    worth           = income x multiple                   // as today

⭐ **The top is preserved by construction, not by a clamp.** Strength converges on fame at the cap,
so at the top `retention x strength < fame` and `effectiveReach` IS fame – the income curve at the
peak is the shipped one, term for term. The floor only ever binds on the way down, which is the only
place he asked anything to move.

⭐ **AND THE SEPARATE WORTH FLOOR MAY NOW BE REDUNDANT.** With income floored, worth is floored
through it. ⚠ MEASURE THIS RATHER THAN ASSUME IT: if the worth floor can be dropped with the
acceptance below still met, drop it – one mechanism doing one job is the whole argument of §4.

**NEW ACCEPTANCE, and this one is a number rather than an observation:**
- ⭐⭐ **worth / annual income must stay inside a defensible band at EVERY point of the five-year
  projection.** Today it runs 9.5x at week 933 and 123x at +5 years. A business does not trade at
  123x its earnings; name the band you hold it to and show the whole curve inside it.
- the five-year fall in worth is of the same order as the fall in INCOME – and income's own fall is
  now part of what changed, so quote both.
- the top of the shelf is unmoved: prove it across the bench's career-weeks as before.
- his rulings in §7 stand unchanged: years-long half-life, a floor as a share of HER OWN peak,
  seeded from current fame, append-only migration, backwards compatibility.

---

## 15. What the revision changed, in three lines

```
reach  = max(fame, retention x strength)          world/brand.ts, `brandReachOf`
income = perFamePointCents x reach² / famePivot   x the crowd tilt   – unchanged curve, new argument
worth  = income x WEEKS_PER_YEAR x multiple       – and the multiple ramps on the same reach
```

`ECONOMY.business.merch.strength.retention = 0.78`, alongside the half-life and floor §7 already
ruled on. **Nothing else about the stock moved**: same kernel, same 208-week half-life, same 0.4
floor on her own peak, same v69 pin.

⭐⭐⭐ **AND THE SEPARATE WORTH FLOOR IS GONE.** `brandBuiltSignals` – the second signal set that
priced the WORTH on the stock while the income read fame – is deleted, along with the shop row's
detour through it. That was the mechanism he stopped. What replaces it is nothing: the reach floors
the income, and the worth is a multiple OF that income.

⭐⭐ **SO `worth / a year of income` IS THE MULTIPLE AGAIN, to the cent** – round 30 #9's own claim,
which §12's wave had to record as overturned, restored rather than merely repaired.

---

## 16. ⭐⭐⭐ THE HEADLINE – and it is now a RATIO, because that is what he stopped

`npx vite-node tools/r32-brand-inertia.ts -- --save ~/Downloads/tennis-sim_alice-cfbv_w933.tsave --sweep`.
⚠ **The save is READ-ONLY and nothing derived from it is in this repo.**

**⭐ THE COMBINED ARM, five years forward with nothing new won:**

| | fame | strength | reach | a year of income | multiple | worth | **worth / income** |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| now | 23.6 | 23.6 | 23.6 | $100,203 | 9.45x | **$946,611** | **9.4x** |
| +1 year | 16.2 | 21.5 | 16.8 | $50,455 | 8.66x | $436,818 | 8.7x |
| +2 years | 10.2 | 18.1 | 14.1 | $35,677 | 8.35x | $297,929 | 8.4x |
| +3 years | 6.4 | 15.2 | 11.9 | $25,227 | 8.09x | $204,159 | 8.1x |
| +5 years | 2.7 | 10.8 | 8.4 | **$12,614** | 7.69x | **$97,041** | **7.7x** |
| **five-year fall** | **−88.5%** | | | **−87.4%** | | **−89.7%** | |

⚠ **AND THE A-CONTROL ROW STILL REPRODUCES HIS TWO NUMBERS TO THE CENT – $831,382 now, $9,098 at five
years** – which is what says the arms are honest: with `strength := fame` the reach resolves to fame
(`retention < 1`) and every function above reduces to its pre-wave expression, through the shipped
code and not a copy of it. §8's table was the pre-revision arm and is superseded by this one.

⭐⭐⭐ **THE ACCEPTANCE, MET AND THEN SOME. The band is `[unknownX, maxX]` = `[2.5x, 20x]`, and it holds
BY CONSTRUCTION rather than by tuning** – with the worth floor deleted the ratio IS `brandMultipleX`,
whose own clamp is that band. Named, justified and swept:

* **the band** is the multiple's own – what a buyer pays per dollar of earnings. Its ends are round
  32 #3's: 2.5x for a brand nobody has heard of, 20x the ceiling, and the research's own comparables
  sit inside it (Beckham's DRJB ~10.9x profit / ~5.3x revenue; the Nadal academy ~31x is the outlier
  §5.4 already refused to size on).
* **on his row it runs 7.8x – 9.6x across every one of the 261 weeks of the projection.** The 123x
  is gone. It is not clipped: 123x was never reachable once the two halves read one clock.
* **across the bench: 44,575 earning career-weeks, 2.53x – 20.00x, ZERO outside the band.**

⚠ **AND BOTH FALLS ARE QUOTED, because the revision changed the income's own.** The income used to
fall **−98.7%** over the five years and now falls **−87.4%**; the worth used to fall −99.0% in the
control and −82.6% in the first pass, and now falls **−89.7%** – of the same order as its own income
and no longer floating free of it. ⭐ The first pass's −82.6% was the shallower number and it is the
one he rejected: it was shallow because the valuation had stopped being about the business.

---

## 17. ⭐⭐⭐ THE TOP OF THE SHELF IS STILL UNMOVED, and now the INCOME is too

The first pass proved the WORTH unmoved at the cap. The revision moves the memory into the income, so
the same proof is owed for the income – and it is the same two lines: `brandStrengthAt` pins strength
to fame at the cap and at every running peak, and `retention < 1`, so `retention x strength < fame`
exactly where the best careers live and the max resolves to `fame`.

⭐⭐ **PROVEN ON THE RUN, to the same standard as the first pass:**

| | measured |
| --- | --- |
| worth at fame = cap, every career-week of the bench | **56,160 / 56,160 unchanged, worst \|delta\| 0 cents** |
| worth at each career's own peak-fame week | **72 / 72 unchanged, worst \|delta\| $0** |
| peak weekly income, floored vs pre-wave (median career) | **$1,794,000/yr in both** |
| median / best peak worth, all four arms | **$34.49M / $35.88M, to the cent** |

⚠ `retention < 1` is therefore load-bearing rather than decorative, and the guard asserts it directly:
a retention of 1 would lift the top of the shelf, which his standing ruling forbids.

---

## 18. ⚙ THE FRONTIER, and how `retention` was chosen

⚠ **IT IS ONE CONSTANT AND IT WAS MEASURED AGAINST A SOURCED ANCHOR, not picked.** The criterion is
the only documented case this repo holds of an off-court income when the winning stops:
**Naomi Osaka, ~$60M (2021) → $12.0M (2024) – −75% in three years with essentially no sponsors lost,
«the fall is playing time»** (`docs/research/player-brands-and-what-they-are-worth.md` §4e). The
income goes as reach², so that is a reach holding about half of itself over three years.

Measured on his own row in the combined arm, three- and five-year falls in the INCOME:

| `retention` | reach at +5y | income at +3y | **3y fall** | income at +5y | 5y fall | worth at +5y | ratio band |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.00 (the first pass) | 2.7 | $7,346 | −92.7% | $1,334 | −98.7% | $9,397 | 7.0x – 9.6x |
| 0.50 | 5.4 | $10,366 | −89.7% | $5,183 | −94.8% | $38,083 | 7.3x – 9.6x |
| 0.70 | 7.5 | $20,318 | −79.7% | $10,159 | −89.9% | $77,150 | 7.6x – 9.6x |
| 0.75 | 8.1 | $23,324 | −76.7% | $11,662 | −88.4% | $89,288 | 7.7x – 9.6x |
| **0.78 – shipped** | **8.4** | **$25,227** | **−74.8%** | **$12,614** | **−87.4%** | **$97,041** | **7.7x – 9.6x** |
| 0.85 | 9.1 | $29,959 | −70.1% | $14,979 | −85.1% | $116,536 | 7.8x – 9.6x |
| 0.95 | 10.2 | $37,422 | −62.7% | $18,711 | −81.3% | $147,884 | 7.9x – 9.6x |
| 0.99 | 10.6 | $40,640 | −59.4% | $20,320 | −79.7% | $161,605 | 8.0x – 9.6x |

⭐ **0.78 is the value whose three-year income fall lands on the researched −75%** (−74.8%). ⚠ It is
a bound drawn from ONE case and it is a career that kept her sponsors while playing less, which is a
gentler shape than «nothing won for five years» – so if anything it is generous. **Every row above is
inside the ratio band**, so the band does not choose this dial and moving it is a decision about how
much of a business survives its founder's silence rather than a correction.

⚠ **AND THE RATIO BAND BARELY MOVES ACROSS THE WHOLE SWEEP (7.0x → 8.0x at the bottom end)** – which
is the cleanest statement of what the revision did: with one clock, the ratio is the multiple whatever
the floor is set to.

---

## 19. ⚠⚠ WHAT THE REVISION COSTS, said plainly rather than discovered later

**a. ⚠⚠ THE CASE HE NAMED GOES BACK TO THE MARK, AND IT IS THE ONE ACCEPTANCE CRITERION THIS PASS
LOSES.** §11a recorded round 30 #24's own guard arm – four seasons ended #18, no title, **nothing
signed**, fame 7.24 – clearing the mark at $67,011 because the first pass priced the WORTH straight
off the stock. It no longer does:

| the named case, nothing signed | gross worth | the owned row |
| --- | ---: | --- |
| A control | $46,095 | $62,500 – the mark |
| B inertia only | **$46,095** | **$62,500 – the mark** |
| D COMBINED (ships) | **$46,095** | **$62,500 – the mark** |

⭐ **AND THE REASON IS EXACT RATHER THAN A TUNING SHORTFALL.** She is ONE season past her wrap, so her
stock is **8.61 against a fame of 7.24 – 1.19x**, and an income-side floor binds only above
`1 / retention = 1.28x`. Measured across the whole sweep: the floor does not touch her at 0.78, at
0.85 or at 0.95, and would need **~0.97** to lift her over the mark – a retention that has stopped
being one. ⚠ **THIS IS THE ANSWER TO §14's «measure it, do not assume it»**: the separate worth floor
was NOT redundant for this one criterion, and it is dropped anyway, because keeping it means keeping
the mechanism that priced a valuation off a business it had stopped describing.

⭐ **What clears the mark for her is signing the letters her band already writes her**, which is the
owner's own item #5 answering his own question – and it needs no new mechanism at all:

| the same career, 2 band-2 deals at 2 shoots a year | fame | gross worth |
| --- | ---: | ---: |
| A control | 10.93 | $112,844 – already above the mark |
| **D COMBINED (ships)** | **11.70** | **$131,257** |

⚠ *§8's table and the collaboration spec's §8 quote 10.60 / $105,512 for that control row. Re-run on
the base branch itself it reads 10.93 / $112,844; the older figures are from an earlier draft of the
bench and are corrected here.*

**b. ⚠⚠ THE POPULATION EFFECT IS SMALL, AND THE MEASUREMENT SAYS WHY RATHER THAN LEAVING IT TO BE
GUESSED AT.** The floor binds only where the stock is more than `1 / retention` = **1.28x** this
week's fame. Measured at the last live week of every bench career whose peak fame is at least three
years behind it: **strength / fame runs 1.00x median and 1.55x at its worst across 43 careers, and
only 3 of them are lifted at all** (best 1.46x on the income). ⭐ That is a fact about the BENCH and
not about the feature – its careers are alive and competing at week 780, so they end AT their own
peak fame rather than years past it, which is exactly the state in which a memory floor should do
nothing. The five-year projection off his own save is the only place the question is asked at all:

| 72 careers x 780 weeks | A control | B first pass (r32c) | **D COMBINED (ships)** |
| --- | ---: | ---: | ---: |
| 52-week falls, median depth | −34.4% | −26.2% | **−32.1%** |
| 3y+ past its peak, what the brand still holds | 45.3% | 47.6% | **45.9%** |
| day-one worth, median | $93,480 | $103,918 | **$93,480** |
| under the mark on day one | 25/70 | 21/70 | **25/70** |

⚠ **SO THE FIRST PASS'S §11b – «round 32 #3's day-one cost is partly repaid, unasked» – IS WITHDRAWN.**
It was repaid by pricing a climbing career's worth off a stock it was sitting on top of, i.e. by the
mechanism he stopped. A career at or near its own peak now reads exactly what it read before this
wave, which is the top-does-not-move property doing its job at the middle of the range as well.

**c. Nothing else moved.** No user-facing string (invariant 4). No new randomness, no clock, no
`Math.random`: `brandReachOf` is one `Math.max` over a value object. **The frozen career hashes are
byte-identical – 0 keys of 72 / 72 / 73 on all three presets against the base branch**, which is the
narrowest possible result and is what a wave with no schema move must produce.

**d. ⭐⭐ AND NO SCHEMA MOVE IS OWED.** `SAVE_SCHEMA_VERSION` stays at **69**. The revision adds no
persisted field and reads none: `retention` is a constant, the reach is derived from two numbers the
world already answers, and the v69 pin (`brandStrengthSeed`) is unchanged in shape and in meaning.
⚠ The pin's VALUE on a freshly-migrated v68 save moves by a fraction, because it is taken with the
current `fameAt` and round 32 #5's half-life ladder is part of that – the same consequence §12 named
the first time, for the same reason, and `tests/fixtures/saves/v69.json` is a frozen artefact of the
version rather than a re-derivation, so nothing regenerates. All seventy fixtures v0…v69 still
migrate: `tests/goldenSaves.test.ts` and `round32-brand-inertia.test.ts` §5's named ladder.
