# The world above her – a tour, or a wall?

**Status: a measurement plus one bug fix. No balance constant moved.** What shipped on
`probe/world-strength` is one new tool (`tools/world-turnover.ts`), this page, one genuine
closed-loop bug closed in `src/engine/world/ladder.ts` + `world/sponsors.ts`, and
`tests/unranked-sentinel.test.ts` (six tests, three mutations verified). How hard the elite *should*
be is the owner's ruling and this branch does not take it.

Bench: `npm run bench:world -- --seeds 4 --seasons 24`. Every figure below is that run at this
branch's head: 4 worlds x 24 seasons, 4,992 real `tickWeek` weeks in section 3, pure derivation
everywhere else. The whole thing takes ~25 s.

---

## 0. The question, and the answer in one line

`docs/specs/money-decomposition-2026-08.md` measured 180 bench careers: the best professional rank
any of them ever reached is **#237**, and not one entered a WTA 250, 500, 1000 or Grand Slam. The
development model's own calibration target is *"first points 17-18, top-100 about 4.5 years later"*.

Three probes ran on three hypotheses. This one asked about the **opposition and the standings table**.

> **VERDICT: a wall, and it is a wall by construction rather than by calibration.** The top 364 seats
> of the professional table are held by a population that is re-dealt from four fixed storeys every
> season, never ages, never retires, never wins a point and never loses one. Over 24 seasons x 4
> worlds – 96 season boundaries, 4,992 simulated weeks – **the number of simulated athletes who ever
> held one of the first 100 chairs is zero.** The first 200 chairs: 0.01 on average, high-water mark
> one. Nobody above her is ever displaced by anybody, including by each other, because the only way a
> seat changes hands is the annual re-roll, and the re-roll deals the same shape back.

---

## 1. The instrument

`tools/world-turnover.ts`, six sections. Four of them need no world at all, which is itself the
finding: the object under test, `fieldProsFor(seed, seasonIndex)`, is a pure function, so "the world
above her" can be printed without simulating a single week.

| § | what it asks | how |
| --- | --- | --- |
| A | the book held at depth k, and how much it moves | pure derivation, N seasons |
| B | four different things "turnover" can mean | pure derivation, season over season |
| C | the merged standings as the engine really builds them | 4 x 24 seasons of real `tickWeek` |
| D | do the players above her age and retire | pure derivation, 33,488 (id, season→season+1) pairs |
| E | what is standing at merged rank R, in the match engine's terms | `fastMatchProbability` |
| F | which rungs the table lets her through, by the book she holds | engine predicates on a real world |

---

## 2. Who is above her, and what they are made of

### 2a. The composition

`src/engine/season/fieldPros.ts` derives **364 professionals per season** from `(worldSeed,
seasonIndex)`, in four storeys of fixed size and fixed points band:

| storey | ids | count | core band | points band |
| --- | --- | --- | --- | --- |
| `tourElite` | `fp-0`..`fp-63` | 64 | 67-77 | 1,400-11,500 |
| `elite` | `fp-64`..`fp-93` | 30 | 56-66 | 1,000-1,400 |
| `contender` | `fp-94`..`fp-213` | 120 | 43-53 | 350-1,000 |
| `journeyman` | `fp-214`..`fp-363` | 150 | 38-48 | 150-350 |

**The storey is a property of the id, not of the player.** Measured over 4 seeds x 24 seasons:
*ids whose storey ever differs: 0 of 364*. `fp-0` is a `tourElite` in every season of every world
that will ever exist, and `fp-363` is a journeyman in all of them. The weakest pro the generator can
produce holds 150 x 0.65 (age ramp) x 0.9 (jitter) ≈ **88 points**; every LIVE player starts on
nought.

### 2b. What the live population manages against it (section C, 4 x 24 seasons of real weeks)

LIVE players (199 cohort + the kid) holding one of the first N **chairs** of the merged W standings,
mean [high-water mark] over 96 season boundaries:

| #1 | #5 | #10 | #25 | #50 | #100 | #150 | #200 | #250 | #300 | #364 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 [0] | 0 [0] | 0 [0] | 0 [0] | 0 [0] | **0.00 [0]** | 0.00 [0] | 0.01 [1] | 0.01 [1] | 0.20 [2] | 1.14 [4] |

* Best cohort graduate ever, across 4,992 weeks: **chair #198**, on 134 points mean / 248 best.
* The kid does nothing in this arm on purpose – the question is whether the WORLD moves on its own.
* *Chairs*, not rank numbers: competition ranking collapses the ~185 point-less live players onto one
  shared rank, so "rank ≤ 400" is true of all two hundred of them at once and says nothing.

**One healthy finding, and it is the one my brief flagged as a suspect:** retired-but-still-listed
ids. 13.9 of them per season boundary still carry a counting W row in `world.results` – and they are
correctly **absent from every table**, because `computeRanking` treats its roster as a filter
(`docs/specs/junior-conveyor.md`). That closed-loop variant is already shut. It is a ledger artefact
with no standings consequence.

---

## 3. Turnover – 24 seasons, and only one of the four numbers is the question

"Churn" can mean four things here. Three of them look like a living tour and are not.

| measure | value | what it actually means |
| --- | --- | --- |
| **ID churn** | 12.8 of the top 100 per season | `fp-N` slots re-sorting *inside* their fixed storeys |
| **NAME churn** | **98.9 of 100** | every person in the world's top 100 is a stranger every year |
| **BOOK delta** | 8.9% mean relative | the head's gamma tail wobbling; #50 sd 2.7%, #100 sd 3.1% |
| **TIER moves** | **0.00 of 364** | nobody is ever promoted or relegated between storeys |
| **SEAT churn** | **0 of 100, ever** | no simulated athlete has ever held a top-100 chair |

And the two halves of section C that separate re-dealing from competing:

* **THE TEST.** Of the 100 players holding the first 100 chairs in **week 0** of a season, **100.00
  still hold one in week 51 of the same season**, after a full year of canonical W draws they now
  actually play (W3-FIELD3). Mean chair shift: **0.000**. Not one place, in 96 seasons.
* **THE RE-DEAL.** Across the season boundary, 87.2 of the same 100 ids still hold a top-100 chair.
  The 12.8 that "changed" is the annual re-roll, not a result.

The mechanism is stated plainly in `fieldPros.ts` itself and is worth quoting because it is the whole
verdict: *"She cannot climb the table by winning a W100 and cannot fall out of it by losing in the
first round."* A pro's canonical results are played and then discarded. Her standing is
`wtaPoints`, a pure function of `(seed, seasonIndex)`.

**The table's shape is a global constant, not a per-seed fact.** Book at #100, by seed: 862 / 859 /
857 / 854, with per-seed sd 30.8 / 28.2 / 23.3 / 22.6 over 24 seasons. Four different worlds, one
table: the seed re-deals the people and cannot move the shape, because the shape is `FIELD.tiers`.

---

## 4. Ageing and retirement above her

33,488 (id, season → season+1) pairs:

| | measured | a real career | pure chance on a 15-year band |
| --- | --- | --- | --- |
| aged by exactly +1 | **6.0%** | 100% | 6.7% |
| same age | 6.7% | 0% | 6.7% |
| **got younger** | **47.0%** | 0% | 46.7% |
| mean \|Δage\| | 5.03 years | 1.0 | 5.0 |

**A field pro's age is an i.i.d. uniform draw from 16-30 every season.** `fp-5` is 28 one year and 17
the next. Population mean age: 23.01, sd across 96 seasons **0.229** – flat, forever. Mean age of the
top 100: 23.54, sd 0.370.

**Pros who leave the population between seasons: 0.00 of 364.** Against the control, the cohort's own
conveyor retires **19.2 of 199** juniors a season and replaces them with thirteen-year-olds, exactly
as `docs/specs/junior-conveyor.md` designed.

So: the population she came up with turns over completely across a career. The population she is
climbing towards is immortal, ageless and has no careers at all. This is not a defect against the
current design – `fieldPros.ts` says in as many words that the pro contour's real curve is phase 2
– but it *is* the answer to "does anybody ever leave the top 100". Nobody does, because there is
nobody there.

---

## 5. Their strength as opponents

`fastMatchProbability`, hard court, WTA tour, bare builds both sides – the same closed form that
resolves every AI-vs-AI match. The four references are the owner's real case and the ceiling of what
`rollPotential` can ever produce (p90 68.8 / p99 73.2 / max-of-20k 80.8).

| merged rank | mean core | mean book | strong junior | p90 career | p99 career | **max talent** |
| --- | --- | --- | --- | --- | --- | --- |
| #1-10 | 76.2 | 6,925 | 12.4% | 27.0% | 37.9% | 58.8% |
| #11-25 | 74.0 | 2,679 | 15.8% | 32.2% | 43.7% | 64.3% |
| #26-50 | 69.4 | 1,456 | 25.0% | 44.4% | 56.3% | 75.0% |
| #51-100 | 62.3 | 1,075 | 42.9% | 62.6% | 72.6% | 86.0% |
| #101-150 | 50.9 | 677 | 71.5% | 86.7% | 92.0% | 97.2% |
| #151-200 | 46.4 | 421 | 80.9% | 92.3% | 95.8% | 98.8% |
| #201-250 | 45.7 | 298 | 82.9% | 93.4% | 96.4% | 99.0% |
| #301-364 | 40.5 | 154 | 90.6% | 96.9% | 98.5% | 99.6% |

**Per match, the field is beatable and reads correctly.** A #150 pro loses 71.5% of the time to the
owner's strong-junior build; that is a real opponent, not a wall. The wall is in the *compounding* –
a title is five of those in a row at a 32-draw:

| merged rank | strong junior | p90 career | p99 career | **max talent** |
| --- | --- | --- | --- | --- |
| #26-50 | 0.10% | 1.73% | 5.65% | 23.8% |
| #51-100 | 1.46% | 9.63% | 20.1% | **47.1%** |
| #101-150 | 18.7% | 48.9% | 66.0% | 86.8% |

A career that rolled the **best talent the generator can ever produce**, fully realised, wins a title
against a top-100 field slightly less than half the time. Against a top-50 field, one in four.
The strength curve is calibrated; the arithmetic of surviving five rounds of it is what bites.

---

## 6. The points arithmetic, and the finding this branch reports without fixing

### 6a. The curve is right; the population is truncated

The merged table's fit against the real WTA curve, re-measured (`fieldPros.ts` calibrated it and this
confirms it independently):

| rank | #1 | #10 | #50 | #100 | #150 | #300 |
| --- | --- | --- | --- | --- | --- | --- |
| REAL | ~10,500 | 4,000 | 1,400 | 850 | 520 | 190 |
| OURS | 10,181 | 4,534 | 1,324 | **858** | 527 | 190 |

The curve is not the problem. **The depth is.** 364 pros hold a book; the other 200 rows are LIVE
players, and ~185 of them hold nothing. So the merged table's **pointed depth is ~385 of 564 rows**.

### 6b. ⚠ Three acceptance cuts sit past the end of the pointed table – so they refuse nobody

| rung | `acceptsRank` | book the cut costs (lower bound) |
| --- | --- | --- |
| W35 | #700 | **inert** – past the whole 564-row table |
| W50 | #550 | **inert** – past the whole 564-row table |
| W75 | #450 | **inert** – past the 385 pointed rows |
| W100 | #350 | 137 |
| WTA 125 | #250 | 256 |
| WTA 250 | #200 | 346 |
| WTA 500 | #120 | 707 |
| Grand Slam | #104 | 826 |
| WTA 1000 | #65 | 1,175 |

Books are the pro standing on the cut in the derived table – a **lower bound**, since every LIVE
player who passes her adds one more seat above.

### 6c. ⚠⚠ …and because of that, the entry rung of the professional tour closes on her first point

`tierOutgrown` closes a rung when the rung **three above it** opens. Three above W15 is **W75**, whose
cut is inert. Measured through the engine's own predicates (section F, `--seeds 4`):

| W book | merged chair | open rungs | closed by the window |
| --- | --- | --- | --- |
| 0 | #564 | `w15` | – |
| **1** | #386 | **`w35 w50 w75`** | **`w15`** |
| 137 | #349 | `w50 w75 w100` | `w15 w35` |
| 256 | #242 | `w75 w100 wta125` | `w15 w35 w50` |
| 828 | #101 | `wta125 wta250 wta500 slam` | `w15 w35 w50 w75 w100` |

At **16** the W75 age gate (17) short-circuits the closure and W15 stays open at any book. From **17**,
one W ranking point – a single won match at a W15 – shuts the entry rung, and it stays shut until her
professional book decays back to zero.

**The design this contradicts is `tierOutgrown`'s own worked example**, which names the stages
`{j60, j300, w15}` → `{j300, w15, w35}` → `{w15, w35, w50}` → `{w35, w50, w75}`, one rung at a time.
The engine's real floors skip from `{w15}` to `{w35, w50, w75}` in a single point. Three documented
stages of the ladder do not exist.

**Why no test caught it.** `tests/tier-window.test.ts` pins the slide property – "consecutive windows
differ by at most one rung at each end" – but it **stubs `tierFloorOpen`** and says so honestly
("the point is the CEILING's arithmetic"). It walks hypothetical prefixes of `TIER_LADDER`, and those
prefixes are exactly what the real merged table never produces. The ceiling arithmetic is correct;
nothing anywhere checks that the floors open one at a time. `tools/ladder-walk.ts` prints an "open
rungs" column that reads `w15,w35,w50,w75` at every season – but it computes it as
`rank <= acceptanceRank(...)`, i.e. the **floor only**, so it has never asked the window question at
all. Two instruments, neither of them looking at the seam.

**NOT FIXED HERE, deliberately.** Every candidate repair – re-deriving `acceptsRank`, bounding a cut
by the table's pointed depth, adding a fifth storey and lifting `FIELD.size` past 500 (which
`fieldPros.ts` already flags for the unreachable #500 anchor) – is a balance change, and the brief
for this branch says balance is the owner's. The finding is pinned as a **characterisation** in
`tests/unranked-sentinel.test.ts` so that when the ruling lands it has to walk past the explanation.

---

## 7. The bug that WAS fixed – the unranked sentinel

A genuine closed-loop defect, of the "two currencies, no exchange rate" family this codebase has
already removed twice, arriving through a **default** rather than through an addition.

Three ranking tables are folded from one ledger. Two of them – domestic and ITF – are the 199-strong
cohort plus the kid, so `world.cohort.length + 1` was the right "she is below the whole field"
sentinel, and it was spelled out by hand at each site. **The W table stopped being that shape** when
living-field phase W merged 364 professionals into it: it is 564 rows. Every W-side
`?? world.cohort.length + 1` therefore read a girl with **no professional ranking at all as world
#200** – inside the acceptance cuts of W35, W50, W75, W100, a WTA 125 and a WTA 250, and worth a
top-200 professional's brand valuation in `reviewSponsors`.

`sponsors.ts` states the intended rule in its own comment – *"a career that has never held a point in
a table sits below the whole field rather than at the top of an empty one"* – so this is code being
made to agree with itself, not a rule being chosen. `world/mandatory.ts` had it right all along by
refusing outright (`?? Number.MAX_SAFE_INTEGER`) and is untouched; the bottom of the table is used
instead only because two of the three surfaces have to print the number.

**The fix.** One derivation, `tableSize(world, track)`, exported from `world/ladder.ts` and used by
`recomputeKidRank`, `tierFloorOpen`'s W arm, `rankIn`, `acceptanceRank` (which had already computed
the same expression inline) and `reviewSponsors`.

**Blast radius: none today, by design.** `recomputeKidRank` is the one writer, it runs on every tick
and every load, and the kid is always in her own roster – so the sentinel is unreachable in play.
What is removed is the landmine underneath, of exactly the kind `latchOnRamps`' own defensive branch
exists for ("a later step may never assume an earlier one's post-condition"). The change is
**conservative in one direction by construction**: the sentinel can only get bigger, so it can refuse
where the old value admitted and never the reverse.

**Mutation-verified**, three ways, each watched red before the green run was believed:

| mutation | result |
| --- | --- |
| `tableSize` W arm drops the field pros | 2 red |
| `tierFloorOpen` W arm reverted to `cohort.length + 1` | 2 red |
| `w75.acceptsRank` 450 → 300 | 2 red (the characterisation pair) |

`npm run test:quiet`: **109 files, 2,339 tests, green.** `vue-tsc -b --force`: clean. No MAIN draw was
added, so the frozen capture (41550 / `e6b0c709`) is untouched; no schema field moved, so no migration
and no golden save.

---

## 8. What this leaves for the owner

Stated as questions, with the measurement beside each, and no recommendation attached.

1. **Should the world above her be alive?** Today it is 364 immortal, ageless, career-less books
   re-dealt annually into four fixed storeys, and no seat in the top 100 has ever changed hands to a
   simulated athlete in 96 measured seasons. `fieldPros.ts` already names the pro contour – careers,
   peaks, retirements – as phase 2. This audit is the evidence for whether phase 2 is optional.
2. **Is 364 the right population?** `fieldPros.ts` flags that matching the real #500 = 75 anchor needs
   `FIELD.size` near 520. The measurement here adds a second consequence of the same truncation: with
   only ~385 pointed rows, three of the ten W acceptance cuts are not cuts.
3. **Should W15 close on one point?** §6c. It is a consequence of (2), not a separate knob, and the
   sliding window's own documented worked example says no.
4. **Is a 47% title chance for the best career the generator can produce, against a top-100 field, the
   intended ceiling?** §5. The per-match curve is calibrated and reads correctly; it is five rounds of
   it that produces the #237 wall the money spec measured.

None of the four is touched on this branch.
