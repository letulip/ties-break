---
type: spec
status: draft
area: engine/season
canonical: false
last-reviewed: 2026-08-12
---

# Did she earn it? – the measured ladder against the July targets

**Status: MEASUREMENT. Nothing shipped.** No constant moved, no test bound moved, no engine
behaviour moved – and unlike `potential-band-2026-08.md` and `growth-age-curve-2026-08.md` this page
does not patch a shipped constant even temporarily. Every number below comes from the engine exactly
as it ships. What this branch adds is `tools/ladder-vs-targets.ts` and this page.

The owner, 12.08, having played a career he loved – «очень радовался её победам и смотрел матчи с
замиранием (то, ради чего по моему мнению делается игра)» – and then asked whether it was earned:

> «она должна была вообще сюда дойти с таким сетапом?»

She is **p0.7 on total headroom** (`potential-band-2026-08.md` §4 – the bottom one percent of the
talent distribution this model can produce), she has climbed w75 → wta500, and a Grand Slam is next.

⚠ **The save is personal.** It was read locally through the engine's own import door
(`decodeExportFile`), exactly as `tools/round15-read.ts` does. Nothing is committed from it – no
fixture, no path, no career – beyond the aggregate placement in §5.

Reproduce:

```bash
npx vite-node tools/ladder-vs-targets.ts -- --only 1                            # §1a-d and §4 - instant, builds no career
npx vite-node tools/ladder-vs-targets.ts -- --seeds 40 --talent-seeds 20        # §1e, §2, §3 - 240 full careers, ~13 min
npx vite-node tools/ladder-vs-targets.ts -- --only 2 --seeds 20 --policy grinder # §3e's control arm - 80 careers, ~3 min
```

**Measured on `wave/flags-grant` head `97ed54f`.** The tool's own section numbers do not match this
page's: its `1c` is this page's §4 and its `1d` is this page's §1e.

Each sweep was run **three times**: once to draft, once after the ladder-doors table was added, and
once after `vue-tsc` found two defects in the tool (§2b's methodology note). **All three agree to the
digit** – the third run's grinder output is byte-identical to the second's apart from its wall-clock
line – so the fixes were correctness repairs rather than number changes, which is what they were
predicted to be and why it was worth checking rather than asserting.

---

## 0. The one-page answer

| question | answer |
| --- | --- |
| **What rank does our Slam actually accept?** | **WTA #104 of an 1,800-row table – the top 5.8% of the world, for a room that holds 32.** The door is 3.25× the draw and that is deliberate (§1). |
| Why is it wider than a 32-draw implies? | **Three mechanisms, none of them a bug.** `acceptsRank` is an absolute rank that never reads `drawSize`; `buildDraw` reserves her the 32nd chair rather than making her compete for it; and the merged table grew to 1,800 rows, so #104 is a percentile, not a headcount (§1a-c). |
| Is a #88 really being let in? | **No – #88 is her ITF rank and she holds ZERO ITF points, so it is a zero tie, not a standing.** The door reads WTA **#71 of 1,800** – the top 3.9% of the world (§5a). |
| **Are we keeping the July targets?** | **No. Two rows are missed, in opposite directions, and the shape is one sentence: the ladder has no top** (§2d). |
| Where exactly does the top end? | **At `wta500`.** Read against the ladder's own doors: 53.1% of all starts clear `wta250`'s #200, **0.6% clear `wta500`'s #120, 0.0% clear the Slam's #104.** A door 1.6× tighter costs 4× the reach, so the acceptance list is not what is doing it – the cliff is upstream of the door (§2c′). |
| pro contour, target 50-65% | **85.0% of all starts** – over by ~1.4× |
| lives from tennis, target 15-25% | **66.3% of all starts** – over by ~3× |
| a real star (top-100), target 3-6% | **0.0%. Zero of 160 careers.** The best rank in the whole run is **#115** |
| **Slam-level, target <1%** | **0.0% on BOTH readings – kept, but by a wall rather than by scarcity.** The door at #104 sits above the model's measured ceiling |
| **Does the target say which "Slam-level" it means?** | **No, and that is a finding.** The string appears once in `docs/` with no definition. Recommendation: read it as **contending** and give **entering** its own row (§2a, §2d). |
| **Is a p0.7 career reaching the pro tour typical or lucky?** | **Typical.** The bottom decile of total headroom reaches the pro contour **73.8%** of the time and top-250 **46.3%** of the time (§3b). |
| And reaching **wta500** specifically? | **Not typical for ANY talent band – 0.0% of all 160 careers ever entered one** (§2c′, §3d). Which is a statement about the ladder, not about her. |
| So is talent what gates the ladder? | **No, and it is coherent rather than surprising.** Bottom decile → top decile moves reach by 17-25 points and the median rank by 48 places, and moves the top-100 rate by **nothing: 0.0% in every band** (§3c-d). It is the counted version of `growth-age-curve-2026-08.md`'s finding that after eighteen the model gives *"money and rank drift, not development"*. |
| **Did she earn it?** | **Yes on the rules, and it is a genuine outlier.** 1,135 professional points, all won in draws the engine ran, #71 against a #104 cut, nothing waived. p0.66 on a TOTAL – but 68% of her headroom sits on the two attributes the match model prices first (§5c). **The best book any of 160 full bench careers ever assembled is 788 points; hers is 44% fatter.** |
| Is the zero Slam entry fee a problem? | **No. Confirm and explain it.** Solvency is still required, travel is still $3,000-6,000, and its one surprising reader (`bankruptcyDue` via `cheapestEntryFeeCents`) is inert at any value (§4). |
| What should move? | **Not the acceptance list.** The binding constraint is the potential band's ceiling – `potential-band-2026-08.md` §3 measured `[4, 40]` taking the best rank to #43/#41 and putting a Slam on the board. Decide the "Slam-level" ambiguity FIRST (§2d). |

---

## 1. WHAT RANK DOES OUR SLAM ACTUALLY ACCEPT? – the door is not the draw

`TIERS.slam.drawSize` is **32** and a real major's is **128**, so the draw reads as "the top 32 in
the world" and about four times more exclusive than the real thing. **That reading is wrong, and it
is wrong by three separate mechanisms, none of which is a bug.**

### 1a. Mechanism one – `acceptsRank` is a different question from `drawSize`, and it says 104

The kid's door is `tierFloorOpen(world, 'slam')` (`world/ladder.ts`), and its whole W arm is:

```ts
return kidPoints(world, 'wta') > 0 && (world.kidRankWta ?? tableSize(world, 'wta')) <= accepts
```

with `accepts = TIERS.slam.acceptsRank = 104`. `drawSize` is not read on this path at all. The
calendar says so on the constant itself, and the sentence is the sport's own:

> ⚠ LOOSER THAN A 1000's, AND THAT IS REAL RATHER THAN A SLIP. A major's main draw is 128 and its
> direct acceptance reaches about #104 … The biggest event on earth is the EASIEST of the top three
> to get into, because it has the most chairs.

So the game kept the real *door* and shrank the real *room*. `wta1000` accepts to #65 and `wta500`
to #120; the Slam sits between them at #104, which is exactly the non-monotone step the real
calendar has.

### 1b. Mechanism two – she never competes for one of the 32

`buildDraw` (`season/tournament.ts`):

```ts
field = entrants.slice(0, drawSize - 1)
field.splice(at, 0, kid)
```

A Slam she has entered is **31 AI + her**. The 32nd-best AI entrant is the one who steps aside. So
the draw size can never refuse her: once the door is open her chair is reserved, and `drawSize` only
decides how many rivals are in the room with her.

### 1c. Mechanism three – the table is 1,800 rows, so #104 is the top 5.8%

Measured on the shipped engine (`--only 1`), not quoted:

```
live cohort 199 + derived professionals 1600 = merged W table 1800 rows
```

| rung | draw | band ceiling | rows in band | of-age in band | `acceptsRank` |
|---|---|---|---|---|---|
| w15 | 32 | 0.72 | 901 | 901 | – |
| w35 | 32 | 0.62 | 784 | 784 | 700 |
| w50 | 32 | 0.52 | 676 | 676 | 550 |
| w75 | 32 | 0.42 | 568 | 553 | 450 |
| w100 | 32 | 0.33 | 478 | 467 | 350 |
| wta125 | 32 | 0.26 | 389 | 380 | 250 |
| wta250 | 32 | 0.24 | 400 | 392 | 200 |
| wta500 | 32 | 0.22 | 375 | 369 | 120 |
| wta1000 | 32 | 0.2 | 350 | 346 | 65 |
| **slam** | **32** | **0.185** | **333** | **329** | **104** |

**The real acceptance cut, said once: WTA rank ≤ #104 on a 1,800-row merged table – the top 5.8% of
the professional world, for a room that holds 32.** The door is 3.25× the room.

### 1d. ⚠ And one shipped comment is now stale by a factor of three

`calendar.ts`'s note on `slam.entrantPctBand` says:

> The ceiling reads 37 candidates in the canonical universe and 104 in the merged one, and the second
> number is the one worth reading twice: a major's real direct-acceptance list is the world's top 104.
> Nobody arranged that … but it is the check this band would have wanted.

That was true at 364 derived pros (a 563-row table). `population-1600-2026-08.md` took the field to
**1,600**, and `entrantPctBand` is a SHARE while `acceptsRank` is an ABSOLUTE – so the share moved and
the cut did not. Measured today the ceiling reads **333**, not 104, and both universes are the same
one (`universeForTier` hands the merged pool to the canonical bracket and to her shadow draw alike).
The coincidence the comment celebrates has quietly dissolved: **the band and the door used to be the
same number and are now 333 against 104.**

Nothing is broken by that – `population-1600` re-derived every band floor deliberately and left the
upper bounds alone on the measured ground that *"a 32-draw is filled from the first ~50 positions of a
band whatever its width, and the tail only buys candidate depth"*. What is wrong is only the sentence.
**Fix the comment, not the number.**

### 1e. What actually walked in, per season – and the answer is NOBODY

**0 Slam entries over 160 full careers, 14 → 38.** There is no per-season table because there is no
data to put in one. The best WTA rank any of those 160 careers ever reached is **#115**, and the door
is **#104**: the model never produced a player the acceptance list would admit.

So §1's own question has a two-part answer, and only the first part is about the constants:

- **the acceptance cut is #104 of 1,800 – the top 5.8% of the world, three times wider than the
  32-chair room implies**, and the mechanisms are the three above (an absolute `acceptsRank`
  decoupled from `drawSize`, a reserved 32nd chair in `buildDraw`, and a table that grew to 1,800);
- **and it is not the binding constraint on anybody.** The door is generous and it is above the
  ceiling, which is the finding §2 turns into a verdict.

`population-1600-2026-08.md` §0b already recorded the same fact from the other side and did not draw
this conclusion from it: *"two of the ten rungs have never been entered by any career in either bench
(`wta500` 0/180, `wta1000` 0/180, `slam` 0/180 at this head)."* Three of the top four rungs of the
ladder have never been played by a bench career. This page is that observation with the target page
held up next to it.

---

## 2. THE LADDER AGAINST THE JULY TARGETS

### 2a. ⚠ THE TARGET IS AMBIGUOUS IN THE WAY THAT DECIDES THE ANSWER, and that is itself a finding

`career-outcome-targets.md`'s last row is, in full:

| Outcome | Target (of runs reaching the horizon) | ≈ of all starts (at 70% survival) |
|---|---|---|
| Slam-level | <1% | <1% |

**"Slam-level" is never defined.** The string appears exactly once in the document and nowhere else in
`docs/`. It could mean *entering* a major or *contending* at one, and those are different games: on a
32-draw a first-round loser and a champion are four rounds apart and $2.8M apart. Two other things
about that row give the same impression – it is the only row whose target is not bolded, and it is the
only row whose two bases carry the **same** number, where every other row multiplies by the survival
rate the page insists on.

**So both are measured and reported as separate rows below, and the owner has to pick one.** The
recommendation is at the end of §2d.

### 2b. How the careers were run

**160 full careers – 40 seeds × 4 background/coach cells, 14 → 38, the `player` policy** (someone
actually managing it – a $5,000 reserve and no racing below condition 70), the same arm
`potential-band-2026-08.md` §3 uses. Three clauses matter and each is a choice:

- ⚠ **bankruptcy is NOT defused.** The band and age-curve pages defuse it because they are measuring a
  growth curve; this page is measuring the targets page, and that page's first row IS the bankruptcy
  rate.
- the fork at nineteen is answered `continue` and every retirement offer is refused until the game
  stops asking, so what is measured is the **tennis** filter with the player's own exit choices held
  out of it. **"She quit of her own accord: 5-10%" is therefore NOT measured here** – it needs the
  morale system the targets page names as Phase 6, and an arm that answered `stop` would be measuring
  the arm rather than the model.
- **the bench accepts no offers.** `stepCareerWeek` enters tournaments and nothing else, so no kit
  deal, no academy place and no sponsorship is ever signed. Read the numbers below as a **floor** for
  a played career, not a portrait of one. §3e lists what else is missing and prices the one lever that
  could be tested from inside the bench.

⚠ **And one methodology note, because it nearly cost this page its numbers.** The first pass was
written and run under `vite-node`, which strips types – and `vue-tsc -b --force` then found two real
defects in it. One was cosmetic (`world.ending?.type` inside a loop whose own condition narrows
`world.ending` to `null`); the other was not: `WorldState.kidRankWta` is `number | undefined` and the
guard read `!== null`, which admits `undefined` and would have **latched** the best-rank accumulator
at `undefined` for the rest of any career it caught, scoring it as unranked on every rung. It never
fired – `recomputeKidRank` writes the field on every tick and the prize guard cannot pass before then
– but it was one tick of luck away from silently deflating the whole table. **Both were fixed and
every figure on this page was re-measured afterwards.** This is `tools/round15-read.ts`'s own
`careerTotals` lesson arriving a second time: a bench that only ever runs under `vite-node` has not
been type-checked, and `npm run check` is where a measurement tool gets read.

### 2c. THE LADDER, POOLED – 160 careers, 125 of them reached the horizon

| outcome | **July target** | measured, of horizon | measured, of all starts | n |
|---|---|---|---|---|
| family solvent through 14→18 | **60-80%** (of all starts) | – | **87.5%** | 140 |
| …and over the whole career | – | – | 78.1% | 125 |
| saw the pro contour (a W15) | **50-65%** | **84.0%** | 85.0% | 136 |
| lives from tennis (top-250) | **15-25%** | **81.6%** | **66.3%** | 106 |
| a real star (top-100) | **3-6%** | **0.0%** | **0.0%** | **0** |
| **Slam-level A – ENTERED a Slam** | **<1%?** | **0.0%** | **0.0%** | **0** |
| **Slam-level B – QF or better at one** | **<1%?** | **0.0%** | **0.0%** | **0** |
| (for scale) Slam SF or better | – | 0.0% | 0.0% | 0 |
| (for scale) Slam champion | – | 0.0% | 0.0% | 0 |

Endings: `natural` 90 · `injury` 35 · `bankruptcy` 35.
**Best WTA rank reached by any of the 160: #115.** Median best rank #180. 136 of 160 ever ranked.

(The tool also prints `entered ANY W-tour event`, and it is **identical to the W15 row in every cell**
– 90.0/90.0, 97.5/97.5, 62.5/62.5, 90.0/90.0. Nobody's first professional event is anything but a
W15, which is the on-ramp doing exactly its job, so the row is collapsed here.)

### 2c′. ⚠ THE SAME 160 CAREERS READ AGAINST THE LADDER'S OWN DOORS – and the cliff has a location

`top-250` and `top-100` are the July page's units. **The game's own units are `acceptsRank`**, and read
that way the ladder does not taper – it falls off a shelf, and the shelf is at one identifiable rung.
All figures of all starts:

| rung | its door | **ever CLEARED the door** | ever ENTERED it |
|---|---|---|---|
| w15 | on-ramp | – | 85.0% |
| w35 | #700 | 80.6% | 76.9% |
| w50 | #550 | 76.9% | 73.8% |
| w75 | #450 | 74.4% | 70.6% |
| w100 | #350 | 70.0% | 67.5% |
| wta125 | #250 | 66.3% | 60.6% |
| **wta250** | **#200** | **53.1%** | **46.3%** |
| **wta500** | **#120** | **0.6%** | **0.0%** |
| **wta1000** | **#65** | **0.0%** | 0.0% |
| **slam** | **#104** | **0.0%** | 0.0% |

**53.1% → 0.6% in one step.** The first seven rungs decline gently – 80.6 → 76.9 → 74.4 → 70.0 → 66.3
→ 53.1, losing between two and thirteen points each – and then the eighth loses **fifty-two and a
half**.

And the doors themselves do not tighten anything like that fast. Read as the step from one rung to the
next:

| step | the door tightens by | the share clearing it falls by |
|---|---|---|
| wta125 #250 → wta250 #200 | 50 places (×1.25) | −13.2 pts (66.3% → 53.1%) |
| **wta250 #200 → wta500 #120** | **80 places (×1.67)** | **−52.5 pts (53.1% → 0.6%)** |
| wta500 #120 → wta1000 #65 | 55 places (×1.85) | −0.6 pts (0.6% → 0.0%) |

**A door 1.6× tighter costs 4× the reach**, and the tightest step of the three (×1.85, at the top)
costs almost nothing because there is nobody left to lose. So the acceptance list is not what is
doing it – the cliff is upstream of the door.

And in the ranking's own currency, the same fact without the rank curve in the way:

| best-18 professional book | value |
|---|---|
| peak, median of the 160 | **375 pts** |
| peak, p90 | 533 pts |
| **peak, best of all 160** | **788 pts** |
| **the owner's save, TODAY** (a live book at w361, not a career peak – so a lower bound) | **1,135 pts** |

**The best book any of 160 full careers ever assembled is 788 points. Hers holds 1,135** – 44% more
than the bench's ceiling, which is why she is at a rung 0.0% of them ever entered.

⚠ **A HYPOTHESIS for the cliff, and it is not established here.** Two points on the curve are now
known: **788 points ≈ #115** (the bench's best) and **1,135 points ≈ #71** (her save). So 44 places
near the cut cost **44% more book**, while the median career sits on 375. If that is the shape, the
cliff is the **points-to-rank curve at the top of a 1,800-row table**, not the acceptance doors and
not the draw – and the fix would be somewhere in the points economy rather than in `calendar.ts`.
Two points do not make a curve; `tools/points-curve.ts` and `tools/points-economy.ts` are the
instruments that would settle it, and §6 item 5 says to do that **before** buying a ceiling change.

### 2d. ⚠ THE VERDICT: two rows missed, and they are missed in opposite directions

All figures **of all starts**, which is the base §2f argues for.

| target | what it asked for | what the model does | verdict |
|---|---|---|---|
| solvent 14→18, 60-80% | most families survive | 87.5% | **just over** – and see §2e, it is one cell's disaster hiding under three cells' perfect record |
| pro contour, 50-65% | most see the door | 85.0% | **over by ~1.4×** |
| lives from tennis, 15-25% | a minority walk through | **66.3%** | **over by ~3×** |
| a real star, 3-6% | a handful become one | **0.0%** | **UNDER – and it is a hard zero, not a small number** |
| Slam-level, <1% | almost nobody | **0.0%** on both readings | **kept – but for the wrong reason** |

**The shape of the miss is one sentence: the ladder has no top.** Two thirds of all starts reach the
top-250 rung the page reserved for a fifth of them, and then **everything stops**. Not one career in
160 crossed #100, and the best single rank in the whole run is **#115** – fifteen places short of the
first rung the July page calls a star, and eleven short of the Slam's own door at #104.

**And §2c′ locates it: the fall is one rung wide.** 53.1% of all starts clear `wta250`'s #200 and
**0.6% clear `wta500`'s #120** – a door 1.6× tighter costing 4× the reach. The July page's "top-100"
row is not measuring a rare achievement; it is measuring the far side of a cliff that starts at
`wta500`.

So the `<1%` Slam target is not being honoured by scarcity; **it is being honoured by a wall.** The
door at #104 sits above the model's measured ceiling, so **both readings of "Slam-level" are 0.0%
and the ambiguity in the target is, today, moot.** It stops being moot the moment anything lifts the
ceiling: `potential-band-2026-08.md` §3 measured the SAME instrument under a wider ceiling band
(`[4, 40]`) taking the best rank to **#43/#41 and putting a Slam on the board in both cells**. The
wall is the shipped potential band, not the acceptance list.

⚠ Two caveats on that cross-reference, both in the direction of caution. That page's arm **defuses
bankruptcy every week** and runs 12 seeds per cell, so its ranks are drawn from a more forgiving world
than this one and its `best rank` column is a minimum over twelve careers – its own §3 note 6 says so.
What survives both caveats is the DIRECTION: the only variants that moved the top of a career there
were the two that raised the ceiling, and neither of the floor lifts did.

⚠ **Which is why the ambiguity has to be resolved before, not after, any ceiling change.** Under
reading A (entering) a `<1%` target is a statement about the acceptance list, which is #104 and
generous; under reading B (contending) it is a statement about the match model – two wins in a
32-draw for a quarter-final, five for the trophy. **Recommendation: read it as B – contending – and
give A its own row.** A career that walks
into one major and loses in the first round for $190,000 is the story the July page was protecting;
a career that wins one is the thing that should be under 1%.

### 2e. Per cell – and one cell is on fire

| cell | horizon | solvent 14→18 | W15 | top-250 | top-100 | Slam | best rank | median rank | median prize |
|---|---|---|---|---|---|---|---|---|---|
| 8k · working · self-coached | **40/40** | 100.0% | 90.0% | 90.0% | 0.0% | 0.0% | #131 | #168 | $593,260 |
| 25k · middle · self-coached | **40/40** | 100.0% | 97.5% | 90.0% | 0.0% | 0.0% | #137 | #181 | $576,110 |
| 25k · middle · middle coach | **40/40** | 100.0% | 62.5% | 62.5% | 0.0% | 0.0% | **#115** | #155 | $466,020 |
| **120k · wealthy · elite coach** | **5/40** | **50.0%** | 90.0% | 22.5% | 0.0% | 0.0% | #158 | #421 | $13,250 |

(shares of ALL STARTS, so the four rows are comparable; the wealthy row's "of horizon" figures are
meaningless survivorship – five careers, all of them the five that survived.)

Three things read off this and only the first is about the Slam:

1. **The ceiling is flat across every cell.** Among the three cells that stay solvent the median best
   rank spans just 26 places (#155 to #181), and the best single rank in any of them – #115 – reaches
   no rung the July page calls a star. Buying the best coach in the game does not buy one.
2. ⚠ **The wealthy · elite cell goes bankrupt 35 times in 40, 20 of them before eighteen** – and it
   supplies **every one of the pooled run's 35 bankruptcies.** Against the July row's 60-80% it reads
   **50.0%**, outside the band. This is `econ-bench`'s own «элита = ловушка» finding arriving on a
   full-career horizon; it is a separate wave's problem, and it is named here because without it the
   pooled bankruptcy figure would be zero.
3. **The middle-coach cell reaches the pro contour LEAST often (62.5%) and ranks BEST (#115).** The
   coach's bill costs entries and buys development – exactly the trade `coach-tiers.md` describes,
   visible here as two columns pulling opposite ways.

### 2f. Which base the owner should read

The targets page insists on both, and the two disagree by 15 points on the row that matters
(top-250: 81.6% of horizon, 66.3% of all starts). **Read "of all starts" for the tennis rows.** The
conditional base is contaminated in exactly the cell where it would flatter us most: the wealthy cell
reports 100.0% top-250 "of horizon" off five survivors, which says nothing about the world and
everything about who lived.

---

## 3. CONDITIONED ON TALENT – is a p0.7 career reaching wta500 typical or lucky?

### 3a. How the bottom decile was sampled, and why that is legitimate

Total headroom is `5·lo + (hi − lo)·Σu` with `Σu` an Irwin-Hall(5) variate, so a career's place in the
talent distribution is an **exact population percentile** rather than a rank among the seeds that were
run – the same derivation `potential-band-2026-08.md` §4 used to place this career at p0.7. On the
shipped band `[4, 26]` the bottom decile is every career under **56.5 points** of total headroom.

⚠ **The bottom-decile sample is ENRICHED by seed selection, and it is legitimate by construction:**
headroom is a pure function of the seed string through the `seed:potential` sub-stream alone, so
indices are screened arithmetically before a single world is built, and nothing else about the career
is selected on – MAIN and every event sub-stream derive from different suffixes of the same seed. **The
unbiased §2 sample's own bottom tail is reported beside it as the check on exactly that**, and the two
agree (see 3c).

80 enriched careers, 20 per cell: headroom min 36.2 · median 52.2 · max 56.5, i.e. **median p5.5,
worst case p10.0**.

### 3b. The bottom decile against the same ladder

| outcome | July target | bottom decile, of horizon | bottom decile, of all starts | pooled §2, of all starts |
|---|---|---|---|---|
| solvent through 14→18 | 60-80% | – | 85.0% | 87.5% |
| saw the pro contour (a W15) | 50-65% | 68.9% | **73.8%** | 85.0% |
| lives from tennis (top-250) | 15-25% | 60.7% | **46.3%** | 66.3% |
| a real star (top-100) | 3-6% | 0.0% | **0.0%** | 0.0% |
| entered a Slam | <1%? | 0.0% | **0.0%** | 0.0% |
| QF+ at a Slam | <1%? | 0.0% | **0.0%** | 0.0% |

Best rank over the 80: **#138**. Median best rank **#216**. Median career prize **$108,440** against the
pooled **$466,020** – so being a bottom-decile talent costs about four fifths of the money and about
twenty points of reach, and costs the top of the ladder nothing, because the top of the ladder was
already closed.

**And the same 80 read against the ladder's own doors – which is the owner's sentence «she has climbed
w75 → wta500» measured directly:**

| rung | its door | bottom decile: cleared | bottom decile: entered | pooled §2: entered |
|---|---|---|---|---|
| w15 | on-ramp | – | **73.8%** | 85.0% |
| w35 | #700 | 60.0% | 58.8% | 76.9% |
| w50 | #550 | 60.0% | 51.3% | 73.8% |
| **w75** | **#450** | 53.8% | **51.3%** | 70.6% |
| w100 | #350 | 51.3% | 51.3% | 67.5% |
| wta125 | #250 | 46.3% | 41.3% | 60.6% |
| wta250 | #200 | 26.3% | 17.5% | 46.3% |
| **wta500** | **#120** | **0.0%** | **0.0%** | **0.0%** |
| wta1000 | #65 | 0.0% | 0.0% | 0.0% |
| slam | #104 | 0.0% | 0.0% | 0.0% |

Peak best-18 book over the 80: median 243 · p90 431 · **best 598** (pooled: 375 · 533 · 788).

**Half of all bottom-decile careers play a W75. None of them – and none of any other talent band –
ever plays a WTA 500.** The two halves of the owner's sentence are on opposite sides of the same
cliff, and the cliff is not made of talent.

### 3c. The gradient, on the UNBIASED sample – the check, and the finding

§2's 160 careers, split by exact talent percentile:

| | bottom decile (p<10) | middle (p10-p90) | top decile (p>90) |
|---|---|---|---|
| n | 12 | 128 | 20 |
| saw the pro contour (a W15) | 75.0% | 83.6% | **100.0%** |
| lives from tennis (top-250) | 58.3% | 65.6% | **75.0%** |
| a real star (top-100) | **0.0%** | **0.0%** | **0.0%** |
| entered a Slam | **0.0%** | **0.0%** | **0.0%** |
| median best WTA rank | #203 | #180 | **#155** |

The enrichment checks out: 75.0% against the enriched 73.8% on the pro contour, and 58.3% against
46.3% on top-250 with n=12 in the unbiased tail (±14 points at 95%). The two samples are telling the
same story.

### 3d. THE ANSWER: typical, and that is coherent rather than surprising

**Talent is a gradient on the MIDDLE of the ladder and not a gate on the TOP of it.**

- From the bottom decile to the top decile, reaching the pro contour moves **75% → 100%** and living
  from tennis moves **58% → 75%**. Real, and about 17-25 points wide.
- Over the same span the median best rank moves **#203 → #155** – 48 places, and it does not reach
  #100.
- **Every band's top-100 rate is 0.0%, and every band's Slam rate is 0.0%.** The whole talent
  distribution the engine can roll, from p0 to p100, produces the same answer at the top of the
  ladder: nobody.

**So the question splits, and the two halves have opposite answers:**

- **Reaching the pro tour and living from tennis is TYPICAL for a p0.7 career.** 73.8% see the pro
  contour and 46.3% reach the top-250 rung. Talent is not what gates that.
- **Reaching `wta500` is not typical for ANY career.** §2c′: **0.0% of all 160 careers, in every
  talent band, ever entered one**, and 0.6% ever cleared its #120 door. On this bench the rung the
  owner's career is standing at does not exist.

The first half is not a surprise and should not be reported as one – it is exactly what
`growth-age-curve-2026-08.md` predicted from the other end:

> after eighteen the model gives her **money and rank drift, not development** … From 18 to 28 the
> median career gains **2.3 skill points over ten years** and her professional rank moves
> **#247 to #202**. Nothing new opens.

If skill stops separating players after eighteen, then what separates them is who stayed solvent, who
stayed healthy and who kept getting into draws – and none of those three reads the potential band.
**The two pages agree, from opposite directions, and this one supplies the counted version.**

⚠ **One thing that IS lucky, and it is not the talent.** The owner's career is **#71**. The best rank
any of these 160 full careers reached is **#115**, and the best any of the 80 bottom-decile careers
reached is **#138**. Her career is outside the bench's whole distribution – see §3e for what the bench
does not model, because the honest reading of a single career outside a bench is usually the bench.

### 3e. ⚠ Where the bench and a played career differ – read this before believing #115

A single real career sitting outside a bench's whole distribution is usually a fact about the bench.
Four things a played career has that `stepCareerWeek` does not, listed so the #115 is read for what it
is – **the ceiling of a career nobody is managing beyond entering tournaments**:

1. **It accepts no offers.** No kit deal, no academy place, no sponsorship, ever. `two-cells.ts` had to
   add kit-signing by hand precisely because the shared step function does not. Every income line
   except prize money and the parent's wage is missing.
2. **It books nothing.** No practice weeks, no vacations, no rescue package – `fatigue-bench`'s whole
   planner axis is off. **Nothing in these 160 careers ever spends a cent to restore condition**, and
   the decomposition in §5c prices condition 100 → 60 at **−7.19 pp of win probability**, more than
   ten points of any single skill.
3. **Its entry policy is mechanical**: strongest rung first within the lookahead, a flat $5,000
   reserve, and a hard skip below condition 70 – it never picks a week, it takes the biggest event it
   can afford.
4. **It buys no equipment.**

**The obvious suspect among those – the hard rest floor – was tested and cleared.** The control arm is
the bench's other shipped policy, `grinder` (no reserve, no rest floor, coach left at home), 80
careers over the same four cells:

| pooled, of all starts | `player` (§2) | `grinder` (control) |
|---|---|---|
| reached the horizon | 125/160 = 78.1% | **40/80 = 50.0%** |
| solvent through 14→18 | 87.5% | **62.5%** |
| saw the pro contour (a W15) | 85.0% | **38.8%** |
| lives from tennis (top-250) | 66.3% | **6.3%** |
| a real star (top-100) | 0.0% | 0.0% |
| entered a Slam | 0.0% | 0.0% |
| best rank of the whole arm | #115 | **#219** |
| median career prize | $466,020 | **$0** |

**Racing her at every opportunity makes every row worse and the ceiling 104 places worse.** So the
#115 is not the rest floor holding her back – of the two managers the bench has, the careful one is
already the better one, and the top of the ladder is shut to both. What remains unmodelled is the
three levers in the list above (offers, the planner, equipment) and the human pulling them.

⚠ **And the grinder arm is the clearest statement of the wall.** Read as the ladder's own doors, it
never once enters the top four rungs:

| rung | accepts | ever cleared the door | ever entered |
|---|---|---|---|
| w35 | #700 | 30.0% | 28.8% |
| w50 | #550 | 27.5% | 27.5% |
| w75 | #450 | 25.0% | 25.0% |
| w100 | #350 | 23.8% | 22.5% |
| wta125 | #250 | 6.3% | 3.8% |
| **wta250** | **#200** | **0.0%** | **0.0%** |
| **wta500** | **#120** | **0.0%** | **0.0%** |
| **wta1000** | **#65** | **0.0%** | **0.0%** |
| **slam** | **#104** | **0.0%** | **0.0%** |

**So #115 is a floor on the model's ceiling, not the ceiling itself** – and §2's verdict survives it
either way, because the miss on `lives from tennis` (66.3% against 15-25%) is an OVERSHOOT that better
management would only widen, and the miss on `a real star` (0.0% against 3-6%) is measured against a
target of three to six in a hundred, which no amount of management turns from zero.

---

## 4. THE ZERO ENTRY FEE – round-17 #28 can explain it rather than change it

`TIERS.slam.entryFeeCents` is **0**, the only zero in a ladder that runs $40 to $1,000, and the
first-round cheque beside it is **$190,000**. It is realistic (the four majors levy no main-draw fee
and pay first-round losers) and the constant says so. What had to be established is that it **reads
as intended in the acceptance path** rather than opening a hole somewhere. Three readers, all
checked (`--only 1`, §1c of the tool's output):

| reader | what a zero does | verdict |
|---|---|---|
| `enterEvent` – `if (world.fundsCents < fee) throw` | becomes `funds < 0` | **the fee is waived, solvency is not.** A family under water still cannot enter a major |
| `travelCostFor` | untouched | **the trip is still hers: $3,000–$6,000**, the most expensive on the calendar |
| `cheapestEntryFeeCents` → `bankruptcyDue` | returns **$0** on every week a major is on the visible calendar, against $40 otherwise | **inert**, see below |

The third one is the only one that looked like a risk, and it is not one. Measured on a week-0
calendar (186 events, 3 of them majors) `cheapestEntryFeeCents` already returns **$0** where it used
to return $40. It feeds `bankruptcyDue`'s second clause – and that clause fires on
`fundsCents >= cheapestEntryFeeCents` while being reached only once `fundsCents < 0`, and a fee can
never be negative. The two clauses collapse onto each other at any value:

| funds | cheapest | `bankruptcyDue` | `enterEvent` affordability |
|---|---|---|---|
| −$1 | $0 | **TRUE** | REFUSES |
| $0 | $0 | false | passes |
| $500 | $0 | false | passes |

⚠ **One shipped comment reads the other way and should be corrected with the card.** `ending.ts`
says of that second clause: *"the day a rung ships with a zero fee – a local club draw that costs
nothing to enter – the conjunction is what stops a girl who can still play being declared bankrupt
for having no cash."* The day has arrived, and the conjunction does **not** stop it: with funds
negative and the fee zero, `funds >= fee` is still false and bankruptcy proceeds. That is the right
behaviour – a family that cannot pay the rent is bankrupt whether or not one event on the calendar is
free – but the comment now describes a protection that does not exist.

**So: nothing to change in the number.** Round-17 #28 can put the sentence on the card as it stands –
*a major charges nothing to enter and pays $190,000 to lose in the first round; the flights are still
yours* – which is both true and the most interesting money fact in the game.

---

## 5. THE CAREER THAT ASKED THE QUESTION, placed

Read locally through `decodeExportFile`. Only the aggregates below leave.

| fact | value |
|---|---|
| age / career week | 20.75 / w361 |
| setup | working family, self-coached, no coach today |
| **total headroom** | **41.0 points – exact percentile p0.66** (Irwin-Hall(5) CDF of Σu = 0.9555) |
| worst wing | 4.1 (serve: 51.0 → 54.2, ceiling 55.1) |
| career record | 323W–120L, 72.9% |
| titles | 34, topping out at one WTA 125 |
| best finishes | SF at a wta500, SF at a wta250, SF at a w100 |
| career prize | $397,670, funds $323,491 |
| professional entries | 27 |

### 5a. ⚠ The «#88» is not the number the Slam reads – and it is not a standing at all

The rank that raised the question is her **ITF** rank. Folded through the engine's own `rankingFor`:

| table | rows | rows holding a point | her rank | her points | what the number is |
|---|---|---|---|---|---|
| itf | 200 | 87 | **#88** | **0** | a **zero tie** – where a nought sorts on a junior table she aged out of |
| domestic | 200 | 111 | #112 | 0 | a zero tie |
| **wta** | **1800** | **1620** | **#71** | **1135** | **a real standing – the top 3.9% of the professional world** |

`entryStatus`' own guard is the reason this cannot leak (*"⚠ UNRANKED IS NOT RANK ONE … the gate
demands a counting result IN THIS TABLE before it will read a position at all"*), and it is doing its
job: the ITF #88 is refused as a signal because she holds no ITF point, and the door reads WTA #71.

### 5b. The engine's own verdict on her, rung by rung

Asked of `tierFloorOpen` on the loaded save:

| rung | accepts | open for her |
|---|---|---|
| w15 … wta250 | – … #200 | YES |
| wta500 | #120 | YES |
| **wta1000** | **#65** | **no** – she is #71 |
| **slam** | **#104** | **YES** |

**She is in a band where a major is open and a 1000 is shut**, which looks like a bug and is the
sport's own shape: a 128-draw takes more people than a 56-draw. `calendar.ts` flags the non-monotone
step on the constant and the top four rungs never close, so it cannot leak into the window.

⚠ **She has not played one yet.** `bestFinishByTier` carries no `slam` key, and she holds no entries
this week – four majors remain on her season's calendar and the door is open for all four. So the
owner's «сюда дойти» is about the door, and the door is the thing §1 measures.

### 5c. ⚠ p0.66 is a TOTAL, and the total is not what the model reads

`tools/winrate-read.ts` on the same save, decomposed at her current rung (wta500, hard):

| her headroom, by wing | points | what the match model does with it |
|---|---|---|
| **ret** | **20.1** (50.0 → 65.2, ceiling 70.1) | +0.50 pp of win probability per point |
| **groundstrokes** | **7.9** (58.0 → 64.4, ceiling 65.9) | **+0.68 pp per point – the biggest of the three priced** |
| serve | 4.1 | +0.49 pp per point |
| stamina | 4.5 | not priced in `basePServe` at all |
| composure | 4.5 | not priced in `basePServe` at all |

And the gaps she actually carries into a point at that rung:

```
serve  (her serve − 50)        4.18
return (50 − their return)     0.59
rally  (her ground − theirs)  15.00      <- the term that decides matches
pace   (age band, km/h)       -1.70
```

**28.0 of her 41.0 points of headroom – 68% – sit on return and groundstrokes**, the two attributes
the decomposition ranks first and second, and her three dead wings are the three that reach a point
weakly or not at all. She is favoured against **85.2%** of the field at wta500, mean match win
probability 76.1% against a 72.9% career actual.

This is `potential-band-2026-08.md` §2a's own finding – *"a career with 45 points of headroom split
5/5/5/25/5 is not the same career as one split 9/9/9/9/9"* – seen from the lucky side. **The band's
percentile is a fact about a sum, and the sum is not the talent the engine plays with.** A player at
p0.66 whose one big wing is `ret` and whose start is 58 on `groundstrokes` is a much better tennis
player than her percentile says.

⚠ **And the control is on file.** The naomi save is **p50** on total headroom (75.6 points –
`potential-band-2026-08.md` §4 placed it), has a **middle coach**, is **a year older** – and is four
rungs lower, at w75, with a raw build far stronger on paper (serve 70.6, groundstrokes 70.0 against
olivia's 54.2 / 64.4). What separates them is not the build: naomi is at **condition 54** and olivia
at **100**. One career against one career, so it is an illustration and not evidence – but it is
exactly the shape `growth-age-curve-2026-08.md` measured, and §3 is where the shape is counted.

### 5d. So: did she earn it?

**Yes, on the rules the game shipped.** She holds 1,135 professional points, all of them won in draws
the engine actually ran (`topBandForPercentile`'s ruling – the professional table opens empty for
everybody), she is #71 of 1,800, and the cut is #104. Nothing was waived.

**And no, she should not have got here – which is exactly why it was worth watching.** Placed against
the 160-career bench she is off the end of it in three separate ways:

| | best of 160 bench careers | her save |
|---|---|---|
| peak best-18 professional book | **788 pts** | **1,135 pts** |
| best WTA rank | **#115** | **#71** |
| careers that ever ENTERED a wta500 | **0.0%** | she has, and reached its semi-final |

That is the honest answer to «она должна была вообще сюда дойти с таким сетапом?». **No – and the
reason is not that the game let her through a door it should have shut.** The door read #71 against a
#104 cut and did its job. The reason is that a played career, managed by a person who signs the deals,
books the weeks and keeps her healthy, is a different animal from a benched one – and §3e is the size
of that gap, measured rather than assumed.

---

## 6. What follows – in the order the decisions have to be taken

Nothing here is a proposal to ship. It is the list of what this page unblocks, smallest first.

| # | action | why it is on the list | cost |
|---|---|---|---|
| 1 | **Decide what "Slam-level" means** in `career-outcome-targets.md`, and write the other reading in as its own row | it is the one row that cannot be measured against as written (§2a), and it decides whether the ceiling work is aimed at the acceptance list or at the match model (§2d) | one sentence, the owner's |
| 2 | **Correct two stale comments.** `calendar.ts`'s slam band note ("104 in the merged one" – it is now 333, §1d) and `ending.ts`'s zero-fee clause (it does not protect, §4) | both are load-bearing sentences that are now false, and neither number needs to move | two comment edits |
| 3 | **Round-17 #28: put the zero fee on the card as it stands** | confirmed correct in all three readers (§4) | copy only |
| 4 | **Re-derive the `lives from tennis` target, or the ladder under it** – 66.3% against 15-25% is the biggest single miss and it is an OVERSHOOT | either the July number was wrong or the top-250 rung is too cheap; the page's own reasoning («most invested careers should see the door; few should walk through it») says the second | a wave |
| 5 | **The cliff at `wta500`** – 53.1% of all starts clear #200 and 0.6% clear #120 (§2c′), so 0.0% at top-100 is the far side of a one-rung fall rather than a gentle tail | `potential-band-2026-08.md` §3 already priced the only dial that moved it (`[4, 40]`, and it costs the whole professional calibration – that page's §5 and §7 are the price list). ⚠ **Before spending that, settle §2c′'s hypothesis**: a door 1.6× tighter costs 4× the reach, so the acceptance list is not the cause, and `tools/points-curve.ts` / `tools/points-economy.ts` can say whether the points-to-rank curve is | a wave, and item 1 first |
| 6 | **The wealthy · elite cell, 35 bankruptcies in 40** (§2e) | unrelated to the Slam and outside the July band on its own | its own wave |

## 7. What this branch did NOT do

- did not move a single shipped constant – not `TIERS.slam.drawSize`, not `acceptsRank`, not
  `entrantPctBand`, not `entryFeeCents`, not the potential band, not the age curve;
- did not patch the live `ECONOMY` object even temporarily, so there is no restore to verify;
- did not re-pin a test bound, and did not edit either of the two stale comments §6 item 2 names –
  they are a decision to record, not a tidy-up to smuggle into a measurement branch;
- did not commit, derive a fixture from, or quote anything from a personal save beyond the aggregate
  placements in §5;
- **did not measure "she quit of her own accord"** (§2b) or the `<1%` row under any ceiling other
  than the shipped one – `potential-band-2026-08.md` §3 is the page that priced that.
