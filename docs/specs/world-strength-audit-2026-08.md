# The world above her – a tour, or a wall?

**Status: an audit (sections 0-8), then the owner's ruling built on top of it (section 9).**

Sections 0-8 are the measurement as it was reported, plus one closed-loop bug fix
(`src/engine/world/ladder.ts` + `world/sponsors.ts`, `tests/unranked-sentinel.test.ts`). **Section 9
is W4-LIVES**: the owner read the audit and ruled that the professionals must age and must retire,
because *"we made a living world so that it would be alive, and the player must have a chance of
reaching the top"*. That is built, and section 9 reports it against the section 3-4 baseline.

⚠ **Sections 2-5 are the PRE-RULING baseline and are deliberately not rewritten.** They are what
section 9 is measured against.

> **THE RESULT OF W4-LIVES, IN ONE SENTENCE.** The world above her now ages, retires and turns over –
> but **a chair keeps its storey by deliberate constraint, so a retiring `tourElite` is replaced by
> another: the world above her is alive, and it is the same height.** Not one simulated athlete has
> ever held a top-100 chair, before the ruling or after it. That null is the finding, and §9e says
> what it hands on.

Bench: `npm run bench:world -- --seeds 4 --seasons 24` (plus `--arc-probe` for the calibration in
§9c). 4 worlds x 24 seasons, 4,992 real `tickWeek` weeks in section 3, pure derivation elsewhere.
The whole thing takes ~25 s.

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

None of the four is touched by the audit. **The owner then ruled on the first of them – see section 9.**

---

# 9. W4-LIVES – the ruling, built

The owner read sections 0-8 and ruled: the professionals must age (*"when the season ends, can we not
just add +1 to everyone's age?"*), they must leave (*"somebody might be in the top for a while,
several years running – that seems quite possible to me"*), and the purpose is a living world in
which the player has a real chance of reaching the top.

## 9a. The answer to his question is yes, and it is exactly that simple

A chair (`fp-<n>`) keeps its storey; the **person** in it now has a debut age, a retirement age and
therefore a span of seasons. Age is `debutAge + (season - debutSeason)` – "+1 when the season ends",
computed rather than stored. `careerAt(seed, n, season)` walks the succession forward from a fixed
origin, so identity, ageing, retirement and replacement are all a pure function of `(seed, n,
season)`.

**No persisted state, no schema bump, no migration, no golden save.** The module keeps every property
its own header box claimed: derived, replayable, delete-the-file-and-saves-still-load. The stateless
form expressed everything the ruling asked for, so the three-part save move was never reached for.

New randomness is on two fresh purpose-scoped sub-streams – `seed:fieldcareer:<n>:<k>` (one per
career) and `seed:fieldform:<n>:<season>` – **never MAIN**. The frozen capture (41550 / `e6b0c709`)
re-derives byte-for-byte and is asserted in three files before any companion constant is read.

## 9b. Does strength move with age, or only presence? – **only presence**

Stated explicitly because the coordinator asked for the decision, not just the code.

**Her BOOK follows her career; her GAME does not.** The four attributes are drawn once and are
constant for the whole span. Only the points multiplier (`careerArc`) moves: rise to a plateau at
22-28, then decline. Three reasons, in order of weight:

1. **The ruling's own limit.** It licensed ageing and retirement. A skill decline curve would change
   every match the field plays against her – that is a re-balance of how strong the tour is, and it
   is not this branch's to take.
2. **It is the honest model.** A ranking is a rolling window of *results*. A player past her peak
   holds fewer points long before she hits the ball appreciably worse: thinner schedule, earlier
   losses, less to defend. The book is what the arc is about; the body is `growth`/`potential`, and
   they stay inert – phase 2's pro contour is where a body curve belongs.
3. **It is what produces the turnover he asked for.** Without it a chair's book is constant for
   twelve seasons and the top 100 is one unbroken reign per chair.

**The proof that it is not a re-balance is section E, re-run.** What is standing at rank R is as
strong as it was: mean core moves by at most **0.3** at any band (#51-100: 62.2 → 62.5) and the win
probabilities by at most **0.9pp**, at #11-25 – every other band is inside 0.6pp (#51-100 strong
junior 42.9% → 42.3%, #101-150 71.4% → 71.3%, #301-364 90.6% → 90.6%).

## 9c. The calibration – predicted vs measured (CLAUDE.md invariant 4)

The population's mean points multiplier is what decides whether the table's shape moves. Old model
(`ageRamp` over a uniform 16-30 draw): **0.9067**. That is the number to preserve.

| cut | plateau | `declineFloor` | predicted | measured | verdict |
| --- | --- | --- | --- | --- | --- |
| first | 23-27 | 0.55 | – | **0.8873 (-2.14%)** | rejected: a systematic weakening, small but not noise |
| shipped | **22-28** | 0.55 | **0.9095 (+0.31%)** | **0.9095 (+0.30%)** | accepted |

The second cut was derived from the probe's own age histogram rather than guessed, and the plateau
was widened to the sport's real peak window instead of flattening the decline – which was the other
way to reach the number and would have cost the tenure the wave is for.

**The table's shape held**, which is the whole claim (`--seeds 4 --seasons 24`):

| depth | #10 | #50 | #100 | #150 | #200 | #250 | #300 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| before | 4,534 | 1,324 | 858 | 527 | 346 | 256 | 190 |
| after | 4,247 | 1,322 | 879 | 537 | 348 | 258 | 192 |
| move | -6.3% | -0.2% | +2.4% | +1.9% | +0.6% | +0.8% | +1.1% |

Every depth from #50 down moves less than its own per-season sd. The head (#10) is the gamma-6.5
tail and is the noisiest cell in the table either way; note it lands *closer* to the real WTA anchor
(4,000) than it did.

**One further change, and it is not a balance change either:** `FIELD.jitter` is now drawn **per
season** rather than per career. The constant and its distribution are untouched – still mean-1
uniform on ±10% – so the population total and the table's shape are exactly what they were. Only its
*serial correlation* changed, from perfect to independent, which is the honest reading of a ranking
refolded every year. It was measured because it mattered: with a career-constant jitter the tenure
tail at the top ten ran to a p90 of 13 seasons.

## 9d. The seven measurements, against the audit's own baseline

| # | measurement | before (§§2-4) | after | verdict |
| --- | --- | --- | --- | --- |
| 1 | **seat churn, top 100** (live players) | 0 of 100, ever | **0 of 100, ever** | **unmoved – see 9e** |
| 2 | **tenure at the top** (consecutive seasons, one person) | n/a (a chair was re-dealt annually) | #10 median **5** (mean 6.3, p90 13, max 18) · #50 median **3** · #100 median **7** | as asked: "several years" |
| 3 | **retirements per season** | **0.00** of 364 | **27.2** of 364 (12-38) | alive |
| 4 | **ageing** | +1 in 6.0%; **47.0% got younger** | **+1 in 100.0%; 0.0% got younger** | the ruling, exactly |
| 5 | **age distribution** | mean 23.01, sd 0.229, flat uniform 16-30 | mean 23.83, sd 0.250, **a pyramid**: 1.8% at 16, plateau ~7.5% at 19-26, taper to 0.6% at 34 | a tour |
| 6 | **her peak rank** (180-career bench) | best **#237** (money spec, base branch) | best **#241** · p10 #275 · median #355 | **unmoved** – 4 places, inside seed noise |
| 7 | **tick cost / ledger** | 12.5 s / 4,992 ticks | **9.7 s** / 4,992 ticks – not slower; see below | nothing given back |

And the number that says "living world" most directly: **NAME CHURN in the top 100 fell from 98.9 of
100 people per season to 10.7.** Before, every single player in the world's top 100 was a stranger
every year. Now about eleven are, and the rest are the same people, one year older.

**On cost, structurally rather than by stopwatch** (the wall-clock figures above are on a machine
with another agent working, so they are a floor on the claim rather than a benchmark). The tick never
calls `careerAt`; it reaches the field only through `fieldProsFor`, which is memoised per `(seed,
season, cohort names)`. The added work is therefore one 364-chair walk per **season boundary**, each
chair O(1) amortised against a bounded per-seed timeline cache – not per week and not per read. **The
ledger cannot have grown at all, by construction:** `runAiTournament` still skips the row for an
`fp-` id, so a professional writes nothing into `world.results` no matter how long she plays.

Career shape: mean length **13.1 seasons** (8-19), debut age mean 17.5, retirement age mean 29.7.
Population mean age 23.83; top-100 mean age 23.83.

**On the tail he warned about.** The longest tenure seen is 18-19 seasons at every depth, and it is
bounded by career length rather than unbounded: a chair cannot be held longer than one career. Those
runs are the handful of players whose drawn core sits at the top of the `tourElite` storey – a career
that is top-100 from debut to retirement, which real tennis does produce. Median 3-7 is the number
the ruling asked for; p90 11-14 is the honest tail and is stated rather than smoothed.

## 9e. ⚠ The headline number did NOT move, and that is a finding rather than a failure

**Over 96 season boundaries and 4,992 ticked weeks, the number of simulated athletes who have ever
held a top-100 chair is still zero.** The best cohort graduate reaches chair #341 on average, #195 at
her very best – within noise of the pre-ruling #339 / #198.

The reason is structural and was a *deliberate constraint*, not an oversight: **a chair keeps its
storey.** When a `tourElite` retires, the chair is refilled by another `tourElite`, because the
pyramid (64/30/120/150) describes the shape of the world and is the one thing in `fieldPros.ts` with
a real calibration behind it. Preserving that shape is exactly what "ageing and retirement, not a
re-balance" means. So the world above her is now **alive** – it ages, it retires, it turns over,
people hold the top for years and then lose it – but it is the same **height**.

**What this rules out, and what it hands on:**

* It is not the *staleness* of the world that keeps her out. That is now fixed and she is no closer.
* Therefore the binding constraint is one of the things this branch is forbidden to touch: **the
  acceptance-cut / sliding-window collapse of §6** (one W point opens W75 and shuts W15, and three of
  the ten W cuts refuse nobody), or the **points economy** below.

### ⚠ The two probes converge, and that is worth more than either alone

The parallel skill probe landed while this was being built, and it reaches the same place from the
opposite side. Its headline: **her skill rank is #72 of 364 while her points rank is #298.** Priced
honestly through the points table – perfect entry, no fatigue – the median career caps at **#223** and
a prodigy at **#120**.

Put beside this probe's result, the two readings are one statement:

| | this probe (the world) | the skill probe (her) |
| --- | --- | --- |
| finds | the table above her is calibrated on the real WTA distribution and holds its shape | she is already the 72nd-best *player* in it |
| and | no simulated athlete has ever held a top-100 chair | but the 298th-largest *book* |

**So the binding constraint is the points economy, not the strength of the field and not the liveness
of the world.** The field's books are handed out in one stroke by a generator fitted to the real WTA
curve; hers is earned match by match inside a 14-21 event window on rungs that pay 10-125 a title.
Those are two different units of account wearing the same name, which is why she can be the #72 player
and the #298 name on the list at the same time. §5's own arithmetic agrees from a third direction: a
career that rolled the best talent the generator can ever produce still wins a title against a
top-100 field only 47% of the time, and needs five of those in a row.

**Recorded, not acted on.** No re-calibration, no acceptance-cut change, no storey change – the owner
has not ruled on this one.

## 9f. Her own trajectory

`npm run bench:money`, the same 180 careers (9 presets x 10 seeds x 2 retirement arms), re-run at this
branch's head:

```
best peak rank anywhere       : #241 (bench-middle-7, her-words)
peak-rank distribution        : best #241 · p10 #275 · median #355 · worst #379
the ladder's own top rung entered: wta125 0/180 · wta250 0 · wta500 0 · wta1000 0 · slam 0
HEADLINE prize/spend          : median 16.6% · mean 15.2% · best 37.0%
```

**Her peak rank did not move**: #237 → #241, four places, well inside the seed noise the distribution
shows (p10 #275, worst #379). And **still 0 of 180 careers enter a WTA 125 or anything above it** –
the same zero the money spec reported. This is §9e stated from her side of the table.

⚠ **The prize/spend headline reads 16.6% against the money spec's 12.4%, and that comparison is NOT
attributed.** The money spec's figure was measured before `regional-grass-1` landed, so the two runs
do not share a base and the difference cannot be assigned to this wave. A same-base A/B was started
and stopped rather than allowed to hold up the commit; it is **outstanding** and this paragraph is
the placeholder. Nothing in this document depends on it – the peak-rank row above is the measurement
the wave is judged on, and that one is a clean re-run of the same bench on the same branch.

## 9g. What moved in the guards

Six tests moved, all re-aimed with a ⚠ note, none deleted or weakened:

* `tests/condition.test.ts`, `tests/injuries.test.ts`, `tests/planner.test.ts` – the `REF.kidRank`
  companion, **90 → 89, one place**. The MAIN capture itself (count 41550, hash `e6b0c709`, head and
  tail) passes untouched in all three, and in `planner.test.ts` the A/B input-independence assertions
  pass two lines above the constant. The chain is: the pro population's age histogram changed shape →
  `selectEntrants` gates on age → a W event's entrant set changed → which juniors a W week books
  changed → the J draws they were no longer free for changed. Second-order, on a different track, and
  the same documented mutable class the previous wave re-aimed this number for (92 → 90).
* `tests/season/fieldPros.test.ts` – **the old turnover test was pinning the defect.** It asserted
  that more than half the field is a different person one season later. Inverted and strengthened
  rather than dropped: most of the field is the same person exactly one year older with an unchanged
  game, a minority is replaced by a debutante, and a second test walks a full career span and
  requires every chair to change hands.
* `tests/fatigue-bench-planner.test.ts` (sim project) – **re-aimed by WIDENING, not by loosening.**
  "A withdrawal is strictly rarer than a block" was aggregated over four profiles at ONE seed and
  read 11 withdrawals against 10 blocks: an inversion by a single event. The mechanism claim is not
  in doubt; what had gone is the sample that could support the word *strictly*. The comment's own
  measured regime is 199 blocked / 24 withdrawn, and today the same sweep yields ~10 and ~11 – two
  orders of magnitude down, because the fatigue reprice moved the phenomenon. W4-LIVES tipped the
  coin through the same second-order chain that moved `REF.kidRank`, and it touches no medical
  machinery. Widened to **four seeds**: measured **61 blocked / 42 withdrawn**, a 19-event margin
  instead of one, **holding on both arms** – which is what makes it a widening rather than a number
  picked to pass. Mutation-verified by inverting the comparison. Cost: that file 5.7 s → 10.4 s.

  ⚠ Worth recording as process: this RED was found only because the sim project was run at all, and
  it was nearly misdiagnosed – an intermediate A/B appeared to show the file passing on this branch.
  It was not. `git checkout HEAD -- <path>` writes the **index** as well as the working tree, so an
  A/B built on it had silently un-staged the change and was re-running the base twice. Use a file
  copy for arm-switching, never `git checkout`.

**Mutation-verified four ways**, each watched red first: stop the ageing (`expected 19 to be 20`),
make careers never end (`expected 0 to be greater than 0`), stop the succession advancing
(`expected +0 to be 364`), invert the veto comparison (`expected 61 to be less than 42`).

Gates: `vue-tsc -b --force` clean · `npm run test:quiet` **109 files / 2,340 tests green** ·
`npm run test:sim` **8 files / 80 tests green**. No MAIN draw was added, so the frozen capture is
unmoved; no schema field moved, so no migration and no golden save.
