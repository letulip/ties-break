---
type: spec
status: draft
area: engine/season
canonical: false
last-reviewed: 2026-08-12
---

# The wall: skill must buy ladder after eighteen

**Design + measurement plan. Nothing ships from this document without its own numbers.** This is
the "layer 2" that three measurements in a row have pointed at, and the coach conversation cannot
move until it does.

## 0. The wall, as measured

* `ladder-vs-targets-2026-08.md`: **53.1%** of careers clear `wta250`'s door (#200), **0.6%** clear
  `wta500`'s (#120), **0.0%** enter a Slam (#104) – best rank in 160 careers was #115. The July
  targets say top-100 should be **3-6%**; measured **0.0%**. "A door 1.6× tighter costs 4× the
  reach – the acceptance list is not the cause."
* `growth-age-curve-2026-08.md`: 18→26 the median career gains **2.2 skill points** and never
  reaches a new rung. Rank is made by table choice and health, not the racket.
* `coach-as-the-eye.md` §Measured: aim redistributes a CONSERVED growth rate – a perfect oracle is
  worth **+1.6 summed points**, so no development-side lever can reach the wall. Falsified by its
  own pre-registered test; the honest survivor of the coach ladder is `budget`'s physio.
* The owner's own careers show the wall from inside: Naomi at wta250 – eight entries, five early
  exits, best a round or two – against a flat-field model giving her **85.2%** per match. The BAND
  is not the DRAW: a wta250 draws the top of the top, she arrives unseeded and meets seeds early.
* And the field's ceiling sits above hers by construction: the professional top storey's core is
  **[67, 77]** (`fieldPros.ts`) while a typical career's wings cap in the low-to-mid 60s
  (`potentialBand [4, 26]` over starts of 40-58). The best girls she can ever be are the WORST
  girls the top storey is made of.

## 1. The root, decomposed

Three candidate roots, not one, and the measurement must separate them:

* **R1 – the field outclasses her attainable build.** If the top storey is unreachable by any
  realisation of her potential, no door change helps: she loses the quarter-final on the court.
* **R2 – rank compounds and skill does not.** Points buy seeds, seeds buy easier draws, easier
  draws buy points. A late arrival (the junior trap) or one bad season resets the compounding, and
  2.2 points of post-18 growth cannot restart it.
* **R3 – the doors are absolute.** `acceptsRank` reads one number. There is no route for "playing
  better than her rank" to enter a draw – no form-based acceptance, no wild card.

## 2. The levers, priced for measurement

### L1 – ⭐ THE OWNER'S: the coach adds a small per-match edge, for as long as he is paid

His proposal, 12.08, verbatim in the numbers: **budget 0.3-0.6% · middle 0.5-0.8% · high 0.7-1.0%
· elite 0.9-1.2%** to the chance of winning, career-long while employed; later, a per-tournament
top-up when the coach travels with her, at double the travel cost.

**Why this shape can work where the eye could not.** The eye redistributed a conserved sum once a
season; this edge applies to EVERY match and a career holds ~450-500 of them. It compounds exactly
where the wall lives – converting the R2/QF exits at her top rung into deep runs, which is where
the points are. It is undrainable knowledge: fire the coach and the edge leaves with him, which is
the owner's whole-career market. And it makes "the coach must deliver when she plays and wins"
LITERALLY true: the product is delivered per match played.

**The translation, stated before anyone builds a dial that cannot exist.** A Markov engine has no
"win chance" knob – matches are decided point by point. The honest implementation is a small edge
on her ON-COURT attributes at the composition point (`kidMatchPlayerFor` – the same seam kit and
condition already use), **calibrated per tier so her mean match-win probability against her actual
field moves by the owner's percentage**. Zero extra draws, replays byte-identical, MAIN untouched –
the same invariance argument kit shipped with.

**The fiction that carries it** – named, because this deliberately crosses "money buys speed, never
tennis": it is not the parent buying wins, it is the coach in the corner – scouting, tactics, the
word between sets. That is coaching, and it is the owner's design call to make.

**Flat first, decay later.** He floated lowering the edge near her ceiling. Measure FLAT – it is
legible ("with me she wins N% more", one sentence on the card) and the eye's post-mortem says
ceiling-coupled subtleties drown in the fog. A decay arm can be swept once flat numbers exist.

### L2 – align her attainable build with the field's top storey

The `[10, 26]` floor (task #101, measured, held for a difficulty layer) and/or re-deriving the top
storey's core from her actual reachable distribution. Attacks R1 directly. Expensive: every
calibration downstream of the field moves.

### L3 – doors that read more than rank

A form-based acceptance lane or wild cards: N slots per draw for players whose recent results
outrun their rank. Attacks R3, models a real tour mechanism, and gives a hot streak somewhere to
go. Needs care: the on-ramp measurement (W3-ONRAMP) showed held slots barely move outcomes.

### L4 – the points table's shape

Deep runs at her reachable rungs converting harder into rank. Attacks R2 without touching matches.

## 3. The measurement, pre-registered

One bench, arms on paired seeds, 30+ per cell, all four backgrounds; the ONLY difference between
arms is the lever setting.

⚠ **Scaffolding exception, stated openly:** unlike the pure-read sweeps, L1 cannot be driven
through any existing public API – the knob does not exist. The measurement worktree may add the
smallest possible hook (a per-tier factor at the composition point, default = exactly today), and
MUST prove the default inert: the frozen MAIN capture re-derives AND one full career reproduces
byte-identically with the hook in place at its default. Shipping the hook is a separate decision
that waits on these numbers.

Arms: baseline · L1 at the owner's four bands (midpoints first: 0.45 / 0.65 / 0.85 / 1.05%) · L1
at 2× those numbers (to expose the dose-response curve, not to propose it).

Report, per arm:

1. **The July table, re-measured.** Top-250 / top-100 / wta500-cleared / Slam-entered rates beside
   the targets. The middle is ALREADY 3× over – an arm that fixes the top by blowing the middle
   further out is reported as exactly that.
2. **Does the coach finally pay for himself?** Net prize minus bill, per tier per background, with
   self-coaching as control – `what-money-buys` §2's table re-run. This is the owner's own test:
   «тренер должен стоить, но и результат давать».
3. **Where the edge lands.** Match-win delta at her top rung vs everywhere; R2/QF conversion at
   wta250; seeds reached. If the edge shows up at local events and not at the wall, it is tuned
   wrong, not working.
4. **Solvency.** The bill still competes with the plane ticket; `working` cells must not collapse.
5. **RNG.** Frozen capture (41550 / `e6b0c709`) re-derived; no draw-count change anywhere.

## 4. What this is not

* Not a rescue of the eye – that spec keeps its falsification and stays as the record.
* Not inflation, not a price re-tune (task #103 stands separately).
* Not the junior-trap fix (the `enterPointBand` ceiling and the fork's table-blindness are their
  own items) – though L1 interacts with it and the report must say how.

## 5. Open, and the owner's to answer after the numbers

1. The exact per-tier numbers (his bands are the sweep's centre, not a commitment).
2. Flat or decaying near the ceiling.
3. The travelling-coach top-up: phase 2, needs UI and a per-event decision – spec after L1 lands.
4. Whether L1 alone reaches the July table's top rows, or L2/L3 must join it – the dose-response
   arm exists to answer exactly this.

## Measured – L1 against the wall (12.08.2026)

**`tools/wall-l1-bench.ts`, measured on the L1 measurement branch off `wave/flags-grant` head
`5d40e0f`.** The scaffolding hook is `COACH_MATCH_EDGE` / `COACH_MATCH_EDGE_DECAY` in
`src/engine/world/player.ts` – an additive delta on her five on-court attributes at the composition
point, default inert. Reproduce:

```bash
npx vite-node tools/wall-freeze-probe.ts                                  # inertness, ~30s
npx vite-node tools/wall-l1-bench.ts -- --calibrate                       # the dial, ~2 min
npx vite-node tools/wall-l1-bench.ts -- --arms base,aflat,adec,bctl,bedge --out <dir>   # ~70 min, resumable
npx vite-node tools/wall-l1-bench.ts -- --report <the same dir>
```

### M0 The scaffolding exception, discharged first

§3 demanded two proofs before any arm ran, and both were run and passed BEFORE the hook was ever
set non-zero:

1. **The frozen MAIN capture re-derives**: `tests/condition.test.ts` green with the hook in place
   at its default – 44/44, the pinned **41550 draws / `e6b0c709`** asserted inside.
2. **A full 208-week career reproduces byte-identically**: `tools/wall-freeze-probe.ts` (written
   before the hook existed, deliberately ignorant of it) run at the base commit and at the hooked
   commit – sha256 of `JSON.stringify(world)` at weeks 52/104/156/208, two careers (working ·
   self-coached and middle · middle coach, `player` policy), all ten hashes identical, `diff`
   clean.

And the arms cannot touch MAIN by construction: kid brackets run on `seed:kidtour:<event.id>` /
`seed:<event.id>:r<n>` and AI brackets on `seed:aitour:<event.id>`, so the edge moves match
OUTCOMES only – the same invariance argument kit and condition ship with.

### M1 The dial – calibration, tier -> delta -> measured ΔP

The winrate-read methodology, exactly as §2 L1 prescribes: 1512 sampled states over 16 self-coached
careers (8 seeds x working/middle, 4x a season, at her CURRENT rung), her mean match-win
probability against the field that rung actually draws (`universeForTier` + `isEntrantBand` +
`rivalConditions`, hard court – the neutral surface). Career-long mean P(0) = **71.35%**, and the
dose-response in delta is linear to the eye (+1.897 pp at delta 1.0, +3.726 at 2.0):

| owner target (pp per match) | delta* (skill points, all five wings) | ΔP at delta* (check) |
| --- | --- | --- |
| budget mid **0.45** | **0.234** | 0.450 |
| middle mid **0.65** | **0.339** | 0.650 |
| high mid **0.85** | **0.444** | 0.850 |
| elite mid **1.05** | **0.549** | 1.050 |
| 2x budget 0.90 | 0.470 | 0.900 |
| 2x middle 1.30 | 0.682 | 1.300 |
| 2x high 1.70 | 0.895 | 1.700 |
| 2x elite 2.10 | 1.110 | 2.100 |

So the owner's whole ladder – 0.45 to 1.05 pp – costs **a quarter to half a skill point** on every
wing, and even the 2x elite arm is 1.11 points. For scale: the visibility floor on one wing is 3
points (`TRAINING_FOG_FLOOR`), so no setting in the sweep is ever visible on the radar. Statically,
the same delta lands remarkably flat across the ladder (ΔP at delta 0.5: 0.89-1.20 pp at every rung
she plays) except exactly at the W on-ramp she dominates (w15: P(0) 86.8%, ΔP 0.59) – the edge is
worth slightly LESS per match at the rungs above wta125 (0.89-0.92) than at the domestic rungs
(1.15-1.20), because the pp-per-point of an edge shrinks as the matchup leaves the coin-flip zone
in either direction. No calibration sample ever reached wta500 – the wall, visible from inside the
calibration.

### M2 Predictions, registered after the dial and BEFORE any career arm ran

Numbered against §3's report items. Written with the calibration table above on the desk and zero
arm careers run; the measured sections below quote these verbatim in their verdicts.

1. **July table.** Baseline re-derives the ladder-vs-targets shape at these cells (top-250 far
   over 15-25%, top-100 a hard 0%, wta500-cleared ≲2%, Slam 0). At the owner's midpoints
   (0.45-1.05 pp) the TOP does not leave zero: top-100 0-2%, wta500-cleared under ~5%, Slam ~0 –
   and the middle row creeps FURTHER over target by 0-6 points, reported as exactly that. At 2x
   (2.1 pp) the top moves visibly for the first time: wta500-cleared several %, top-100 1-5%, a
   first Slam entry possible.
2. **Net of the bill.** The edge adds prize wherever delivered, but above `budget` the bill still
   swamps it: middle/high/elite stay net-negative against self-coaching at working and middle
   backgrounds; the insolvent cells (working·high/elite, middle·elite, wealthy·elite) stay
   insolvent – the bankruptcies land at 14-16, before professional rungs pay anything the edge
   could compound. Budget remains the only rung anywhere near paying for itself.
3. **Where the edge lands.** Statically: least at the on-ramp she dominates, most mid-ladder –
   measured in M1 already. Lived: match-win % at wta125-wta500 up ~0.5-2 pp at midpoints; QF->SF
   conversion at wta250 up a few points, clearly visible only at 2x.
4. **Solvency.** Layer A moves no solvency row (no bill – prize can only rise). Layer B
   reproduces what-money-buys §6's solvency shape; no cell is rescued by the edge.
5. **RNG.** Already discharged in M0; re-checked after the arms (the capture cannot move, because
   the edge is post-draw arithmetic).

Dose-response and decay: monotone in dose on every ladder row; the July top row (3-6% top-100) is
NOT reachable inside the owner's bands and becomes approachable only around 2x elite. Decay (floor
0.5): by 18 the median remaining-headroom share should sit near ~0.3, so the delivered edge in the
wall years is ~0.55-0.67x the flat dose – decay should land BETWEEN flat at the same tier and flat
one tier lower. If flat and decayed produce the same careers anyway, that is a finding (pick by
legibility); if they diverge, the divergence should be at the top rows, where the wall years are.

### M3 The July table, measured – 51 cells, 1530 careers, 30 seeds per cell

Column key: `clr250`/`clr500` = best rank cleared that tier's door (#200 / #120); `ent500` =
actually ENTERED a wta500 event; `best`/`p50` = best WTA rank, cell minimum / median.

Layer A – the edge in isolation, self-coached, no bill, pooled working+middle (n = 60 per dose):

| dose (pp/match) | top-250 | top-100 | clr500 | ent500 | Slam | best | p50 book pts |
| --- | --- | --- | --- | --- | --- | --- | --- |
| baseline 0 | 86.7% | **0.0%** | 0.0% | 0.0% | **0.0%** | #131 | 427 |
| flat 0.45 (budget) | 91.7% | **0.0%** | 3.3% | 1.7% | **0.0%** | #114 | 439 |
| flat 0.65 (middle) | 90.0% | **0.0%** | 1.7% | 1.7% | **0.0%** | #113 | 430 |
| flat 0.85 (high) | 88.3% | **0.0%** | 1.7% | 0.0% | **0.0%** | #117 | 434 |
| flat 1.05 (elite) | 86.7% | **0.0%** | 0.0% | 0.0% | **0.0%** | #122 | 434 |
| flat 2.10 (2x elite) | 93.3% | **0.0%** | 0.0% | 0.0% | **0.0%** | #124 | 440 |

**The top rows do not move at ANY dose – including 2x elite.** Top-100 is 0 of 1530 careers in
every cell of the sweep; Slam is 0 everywhere; the clr500/ent500 flickers at low doses are single
careers (1-2 of 60), indistinguishable from noise and absent at the HIGHER doses. What the edge
does buy, honestly: top-250 +5 pp, the wta250 door (clr250) 63-73% → 80-93%, best rank ~10-17
places, prize +$20-34k at the top doses. Real, marginal, and entirely below the wall.

M2 prediction 1 is thereby HALF FALSIFIED and the record keeps it: the midpoint half was right
(top stays zero), the 2x half was wrong – "wta500-cleared several %, top-100 1-5%, a first Slam
entry possible" happened at 0.0/0.0/0.0.

### M4 Net of the bill – the edge's own product, paired against the same hire without it

`bctl` (real hire, edge OFF) vs `bedge` (same hire, edge ON) isolates what the edge itself adds to
a paid coach; both are paired per-seed against the same girl self-coached.

| cell | Δprize vs self, no edge | Δprize vs self, with edge | the edge's product | prize−bill flips? |
| --- | --- | --- | --- | --- |
| middle bg · budget | +$41k | +$93k | **+$52k** | already positive |
| middle bg · middle | −$83k | −$39k | **+$44k** | still negative |
| wealthy bg · high | +$164k | +$210k | **+$46k** | **−$39k → +$21k** |
| wealthy bg · middle | +$155k | +$162k | +$7k | positive both |
| working bg · budget | −$247k | −$206k | +$41k | negative both |
| any bg · elite | −$414..−$535k | −$450..−$584k | – | insolvent 0-17% |

The edge is worth **≈ $40-50k of prize per career** wherever the family survives the bill – against
bills of $232k (budget) to $804k (high). One genuine flip: at a wealthy background the HIGH coach
now covers his own bill (prize−bill −$39k → +$21k) – the first cell in any measurement where a
coach above budget literally pays for himself. Everything what-money-buys said about the market's
SHAPE still stands: at a working background even the budget coach wrecks the career (top-250 86.7%
→ 46.7%, the retainer eats the plane tickets); elite bankrupts 83-100% of families by 18 at every
background, wealthy included. The edge gives every rung a real product; it repairs the market only
where the bill was already survivable. The prices are task #103's problem, not L1's.

### M5 Where the edge lands, lived

Match-win % by rung, baseline → flat 2.10 (the LARGEST dose): w15 82.8 → 83.8 · w75 63.1 → 64.8 ·
wta125 41.8 → 43.4 · **wta250 26.8 → 26.8**. The edge delivers about half its calibrated size
mid-ladder and NOTHING at wta250 – exactly M1's static curve (pp-per-point shrinks away from the
coin-flip zone, and 27% is far under it). And she still almost never ENTERS wta500 – 0-2 entries
per 60-career pool, rank at wta250 entry #186-189 (unseeded) in every arm – so there is nothing at
the wall for the edge to compound on. Prediction 3 confirmed in shape.

### M6 Solvency

Layer A: zero bankruptcies in 27 cells (no bill – prize can only rise). Layer B reproduces
what-money-buys §6 exactly; no cell is rescued by the edge. Prediction 4 confirmed. RNG
(prediction 5): re-verified after the arms – capture 41550/`e6b0c709` green, freeze probe
byte-identical with the hook in place vs stashed (both re-run by the coordinator, not taken on the
agent's word).

### M7 Flat vs decay – the registered branch fires

Decay delivered 0.691x the flat dose at 18 and 0.616x at 22 (floor 0.5, measured multiplier), and
produced careers statistically indistinguishable from flat at the same nominal dose in every column
of every table – deltas within single-career noise, no divergence at the top rows because NOTHING
diverges at the top rows. So the finding M2 pre-registered: **flat and decay are the same game;
pick by legibility.** Flat is one honest sentence on the card («+0.3-0.6% per match»). Decay costs
a harder sentence and buys the owner's fiction («скилл растёт – добавка падает, но всегда есть»)
at zero balance cost. Either ships safely.

### M8 Verdict – the four answers §5 was waiting for

1. **The owner's numbers work as a coach product.** At his bands the coach delivers ~+1 pp per
   match mid-ladder, +5 pp of top-250, ~10-17 best-rank places, +$40-50k prize – and makes
   wealthy·high the first above-budget cell that pays for itself. «Тренер должен стоить, но и
   результат давать» is now measurably true wherever the family can afford him at all.
2. **L1 does not touch the wall.** Top-100 and Slam stay 0.0% at every dose including 2x elite.
   The roots confirmed are R1+R2: she wins 26.8% at wta250 with or without the edge, and never
   enters wta500 for it to compound. No per-match percentage inside (or at twice) the owner's
   bands breaks a 5-15 point attribute gap against the top storey.
3. **Flat vs decay: same careers – owner's pick on pure legibility/fiction grounds.**
4. **§5.4 answered: L1 alone does NOT reach the July top rows.** If the July targets stand, L2
   (align her attainable build with the field's top storey) and/or L3 (doors that read form, plus
   somewhere for a hot streak to go) must join it. L1 is still worth shipping on its own merits –
   it is the coach's product, not the wall's breach.

---

## 6. ⚠ THE WALL IS THE BENCH PLAYER'S, NOT THE GAME'S (13.08.2026)

**This section falsifies §0, on which everything above is built. It is kept at the bottom of its own
spec because that is where a falsification belongs – not in a separate document nobody re-reads.**

§0 rests on `ladder-vs-targets-2026-08.md`: top-100 reached by **0.0% of 1530 careers**, best rank
**#115 in 160**. Every one of those careers was played by `tools/econ-bench.ts`'s policy. The owner's
own Olivia is **#51 at twenty-one**, self-coached, from a SMALLER talent draw than his other save –
so one of the two statements describes the game and the other describes our artificial player.

### The experiment

`tools/policy-vs-owner.ts` replays the bench's policies on HIS OWN seed and profile: the same girl,
the same draw, the same field, the same number of weeks. Only the decisions differ.

| career | who | end rank | best | funds | skills | ended |
| --- | --- | --- | --- | --- | --- | --- |
| Olivia (413 wk, self-coached) | **the owner** | **#51** | – | **$1,601,182** | 270.2 | playing |
| | grinder | #1616 | #1601 | -$40 | 258.4 | **bankrupt @118** |
| | player | #211 | #152 | $91,428 | 270.0 | playing |
| Naomi (621 wk, middle coach) | **the owner** | **#106** | – | **$280,654** | 317.6 | playing |
| | grinder | #1614 | #1601 | -$266 | 290.0 | **bankrupt @79** |
| | player | **#1621** | #1601 | $19,185 | **322.0** | playing |

⚠ **#1601 is one place below the whole professional field (`fieldPros.size: 1600`) – it means she
never held a single counting result.**

### What it settles, and what it does not

**Settled: the wall is not a fact about the game.** Same girl, same world: the owner ends at #51
where the better bench policy ends at #211, and at #106 where it ends UNRANKED.

**Settled: it is not development.** Olivia's skills are 270.2 against the policy's 270.0. On Naomi
the bench player finishes at **322.0 against his 317.6** – a BETTER athlete, fifteen hundred places
lower and holding no ranking at all. The bench builds the tennis and never converts it.

**The mechanism, named rather than guessed:** the bench fixes `coachTier` at BIRTH from its preset,
and the real decision is a TIMING decision. A working family paying a `middle` coach from fourteen
has nothing left for entry fees – which is exactly the `bctl:working:middle` cell that measured
prize p50 $0 and which the owner challenged from his own save. He hired the coach once she was
earning. One modelling choice, and it manufactures the poverty every economy verdict then reported.

**Not settled, and not to be overclaimed:** two seeds. The gap's SIZE per cause – entry timing,
coach timing, sponsors, condition floors – is unmeasured, and that is the work in task #89.

### What this costs the documents above

* §0's three roots (R1 field outclasses her, R2 rank compounds, R3 doors absolute) were measured on
  a player who goes bankrupt at sixteen or never gets ranked. **All three are unproven, not
  disproven** – they may still be true for a well-played career, and nobody has looked.
* The July targets, the junior-trap verdicts, `what-money-buys`, `growth-age-curve`'s rank figures:
  same provenance, same status.
* **L1 survives on its own terms.** Its paired arms ran the same policy on both sides, so «the edge
  adds one to two careers of thirty» stands. What no longer stands is «the edge does not breach the
  wall» – as a claim about the game, since the wall it failed to breach was the bench's.

### 6a. The cause, isolated on ONE seed (13.08.2026)

⚠ §6 blamed the coach by comparing Olivia (self-coached) with Naomi (middle coach) – **two careers
that differ in SEED as well, so the comparison was confounded and the conclusion unearned.** The
owner pushed back on the price claim, which is what forced the isolation. Same seed, same policy,
only `coachTier` moves (`tools/policy-vs-owner.ts`):

| tier | end rank | best | funds | entries | matches | **W-track entries** |
| --- | --- | --- | --- | --- | --- | --- |
| self | #285 | #173 | $254,098 | 253 | 631 | **172** |
| budget | **#211** | #148 | $266,565 | 275 | 738 | **163** |
| middle | **#1621** | #1601 | $19,185 | 241 | 613 | **0** |
| high | #1615 | #1601 | -$1,289 | 11 | 25 | **0** |

**A cliff, not a slope.** Budget reaches #211 with a quarter of a million banked; middle enters
**not one professional event in twelve years** and finishes unranked.

**And she is neither idle nor broke** – 613 matches, 241 entries, $19,185 in hand. The mechanism is
`econ-bench.ts:465`, one line: `if (world.fundsCents - cost < policy.reserveCents) continue`, with
`reserveCents: 5_000_00`. A W75 trip is ~$2,200-3,900 (fee plus travel); a `local` costs almost
nothing. So a family hovering near the floor is **permanently allowed the events that pay nothing
and permanently refused the ones that pay** – she spends twelve years on rungs that bank no
professional points, never accumulates, and never crosses. A poverty trap inside the policy.

⚠ **The owner's price correction was right and mine was too:** `middle` is 1.6-1.7x `budget` per
hour ($40-60 against $24-36 young), so it is dearer than he remembered – but the failure is NOT a
budget gradient. Budget works completely; middle fails completely. An absolute floor plus any
recurring bill is a threshold, and thresholds do not degrade gracefully.

**A human has three moves the policy does not have:** go anyway and accept a thin month, drop the
coach for a season, or cut the calendar to fund one real trip. It has none of them.

---

## 7. The bench player, rebuilt (task #89, 13.08.2026)

**What this section is:** the repair of §6a, measured on the same two saves. `tools/econ-bench.ts`'s
`player` arm is now a MODEL OF A REASONABLE PARENT rather than four scalars on top of a grinder. The
`grinder` arm is untouched, byte for byte, so every number this file's history reports is still
reproducible – it is the file's reproducibility anchor and it is what
`tests/endings-bench.test.ts` drives.

### 7.1 The six rules, each in the sentence a parent would say

| | rule | the sentence |
| --- | --- | --- |
| **R1** | the reserve is WEEKS OF BILLS, not $5,000 | «I keep a couple of months of our bills in the bank – what that is in money depends on what our week costs.» |
| **R2** | never pay into a table below the one she is climbing | «Once she's playing internationals, a club tournament at home doesn't move her ranking any more – we don't pay for those.» |
| **R3** | never pay to enter a rung she has outgrown | «I'm not paying to enter tournaments she's too good for.» |
| **R4** | the rest floor is traded against what the event is worth | «If she's tired I'll skip a small one – but for a big one I'll take her tired and rest her afterwards.» |
| **R5** | the off-season family week, and a rescue week when she is run down | «We take the off-season week away every year, and when she's run down we take another – the cheapest one that will actually fix her.» |
| **R6** | let the coach go when the bill outruns the household | «If we're running the savings down and we've eaten into the cushion, the coach goes and I take her myself until the money comes back.» |

**R2 carries ONE exception and it is the ladder's own, copied rather than invented.** When the tour's
age rule has spent her professional allowance for the season (`proEntryCapUsage`), `tierOutgrown`
already lifts its ceiling on every non-professional rung – the owner's ruling 2, «игрок должен иметь
возможность играть, если не w-серии то где-то еще, чтобы не скучал». The policy obeys the same rule
for the same reason: «when she's used up her professional entries for the year, she plays the junior
and home events rather than sit out the rest of the season.» Without it R2 re-creates inside the
policy exactly the dead season the engine was changed to remove – measured, it cost 50 entries and
109 matches on Naomi's seed.

**Nothing here reads the draw, the field or anybody's form.** Every rule is a fact about her family's
bank balance, her body, or which table she is on. That is the line between a model and a solver.

### 7.2 The repair, on his two saves

⚠ Both saves are `working` families. Read only through `tools/policy-vs-owner.ts`; neither is
committed and neither ever becomes a fixture.

**Olivia (413 wk, self-coached at onboarding) – the owner ends #51.**

| arm | before | | after | | | |
| --- | --- | --- | --- | --- | --- | --- |
| | end / best | funds | end / best | funds | entries | W-track |
| player · self | #211 / #152 | $91,428 | **#282** / #138 | $163,902 | 149 | 86 |
| player · budget | **#1623** / #1601 | $13,532 | **#170** / #135 | $166,414 | 150 | 88 |
| player · middle | **#1623** / #1601 | $8,705 | **#170** / #126 | $162,648 | 150 | 91 |
| player · high | **#1612** / #1601 | -$1,220 | **#170** / #126 | $142,002 | 151 | 89 |

**Naomi (621 wk, middle coach from onboarding) – the owner ends #106.**

| arm | before | | after | | | |
| --- | --- | --- | --- | --- | --- | --- |
| | end / best | funds | end / best | funds | entries | W-track |
| player · self | #285 / #173 | $254,098 | **#111** / #111 | $428,710 | 219 | 156 |
| player · budget | #211 / #148 | $266,565 | **#71** / #71 | $529,324 | 218 | 151 |
| player · middle | **#1621** / #1601 | $19,185 | **#71** / #71 | $483,114 | 213 | 146 |
| player · high | **#1615** / #1601 | -$1,289 | **#76** / #76 | $409,270 | 213 | 145 |

**The cliff is gone.** Every arm is ranked; W-track entries go from 0 to 145-156 on the three coach
rungs that used to enter no professional event in twelve years. Nothing bankrupts, on either seed, at
any rung – including `working · elite`, which survives at #71 by spending 243 of its 621 weeks
self-coached. That is R6, and it is the owner's own second move.

**Where the arms land against his two numbers: #71-#282 against his #51 and #106.** Naomi straddles
him (#71-#111 against #106). Olivia does not: every arm is #163-#282 against his #51, with a best
rank of #108-#138. **The Olivia gap survives the fix and is reported rather than tuned away** – see
7.5.

### 7.3 The guard-rail – the policy is ONE rule away from being a solver, and it was measured

The brief for this work says a policy that reaches #10 has not been fixed, it has been broken the
other way. That is not hypothetical. Removing one rule at a time, on Naomi's seed, coach `middle`
unless stated:

| variant | end | funds | entries | mean condition |
| --- | --- | --- | --- | --- |
| **all six (baseline for the rows below)** | **#71** | $477,394 | 182 | 92.3 |
| minus R2 (no table discipline) | #109 | $358,407 | 264 | 85.0 |
| minus R5 (no holidays) | #76 | $455,306 | 179 | 84.6 |
| minus R6 (coach fixed at birth) | #76 | $507,336 | 163 | 93.8 |
| minus R6, coach `high` | **#1615, bankrupt @73** | -$1,359 | 19 | – |
| **all six (baseline for the two rows below)** | **#76** | $507,336 | 163 | 93.8 |
| minus R3 | #114 | $232,713 | 321 | 73.8 |
| **minus R3 AND R4's slide (rest floor flat at 70)** | **#14** | **$9,593,018** | **364** | 70.4 |

⚠ The sweep ran on two intermediate builds – the first before R6's release moved off the season
wrap, the second before R2 gained its pro-allowance exception – so **each block carries its own
baseline row** and only within-block differences are read. The shipped build measures #71 /
$483,114 / 213 entries on this cell, i.e. between the two baselines; no conclusion here turns on it.

**R3 is what holds the line.** Dropping it turns the parent back into a grinder – 321 entries, then
364 once the rest floor stops sliding – and the volume converts to a top-fifteen player with nine and
a half million dollars. That would make the game look far easier than it is and put every future
verdict wrong in the opposite direction, which is exactly as bad as the wall was. **R6 holds the
other line**: without it the dear coach rungs go bankrupt exactly as §6a described. **R5 buys
freshness rather than rank** – eight points of mean condition for five places, which is the honest
size of it.

### 7.4 ⚠ 25k and 120k – UNVALIDATED BY ANY HUMAN CAREER

`tools/policy-vs-owner.ts` now sweeps the background too. It is honest to sweep because the GIRL
does not move with it – `startingSkills` takes the seed and ignores the profile (`world/player.ts`,
the parameter is literally `_profile`) – so these are the same child in a richer family.

**There is no person's number beside either block.** Both saves are `working`; the owner has barely
played 25k and has no 120k career. These rows are a PREDICTION ON RECORD, to be wrong about the day
somebody plays one, and they may not be used to argue the policy is or is not in his envelope.

| background | self | budget | middle | high | elite |
| --- | --- | --- | --- | --- | --- |
| Naomi · working (his) | #111 | #71 | #71 | #76 | #71 |
| Naomi · middle ⚠ | #75 | #78 | #106 | #109 | #109 |
| Naomi · wealthy ⚠ | #67 | #78 | #81 | #86 | #116 |
| Olivia · working (his) | #282 | #170 | #170 | #170 | #178 |
| Olivia · middle ⚠ | #201 | #163 | #163 | #163 | #163 |
| Olivia · wealthy ⚠ | #282 | #170 | #173 | #182 | #182 |

**What happens there, stated plainly: nothing breaks, and the money stops mattering.** No arm
bankrupts and no arm is unranked at any background. On thirty arms the spread within a background is
smaller than the spread between the two seeds, and on Naomi the ORDER INVERTS as the family gets
richer – `wealthy · self` (#67) beats `wealthy · elite` (#116), because on a single seed the coach's
own edge is small (L1: one to two careers of thirty) while his bill is money that would otherwise
have bought entries. **That is one seed and one policy and it is NOT a verdict on the coach ladder** –
it is a reason to re-run §M's paired arms through the rebuilt policy before anybody quotes L1 again.

### 7.5 What was NOT fixed, and is now on the record

* **Olivia's gap.** The owner reaches #51 with $1,601,182; the best arm reaches #170 with $166,414 –
  a tenth of the money. On Naomi the same policy has MORE money than he does ($483k against $281k)
  and a better rank. Development is not the cause (269.9 against his 270.2, on a draw whose ceiling
  is 279.0), and neither is the calendar, the freshness or the coach, all of which are now
  human-shaped. Something specific happened in that career that the policy does not model.
* **Three decision surfaces the bench still never touches**, any of which could be it: it never
  answers a sponsor offer (`acceptOffer`/`declineOffer`), never sets an equipment grade
  (`setKitGrade`), never chooses a birthday gift (`chooseGift`), and never moves the week plan off
  `balanced`. The `practice` category still reads $0 in every cell – no friendly is ever booked.
* **The 60-week ledger prune bounds R1 and R6.** Both read `financeWindow` over a 26-week trailing
  window, which is exact, but it means the reserve reacts to the last half-season and not to the
  career. A family whose bill jumps in one week keeps the old reserve for a fortnight.
* **`vacation` now reads $11,654 over four seasons** on 25k·middle·budget where it read $0. That is
  ~7% of gross expense and it is a real change to every money table this bench prints for the
  player arm. It is not a bug; it is R5 arriving. Every earlier `player`-arm money figure in the
  documents above is superseded.

### 7.6 What moved in `tests/endings-bench.test.ts`

The gate did NOT go red, because it drives `POLICIES[0]` and the grinder is untouched. It was
re-aimed anyway, knowingly, in two places:

* **The determinism test now runs BOTH arms** (3 tests to 4, 10.3 s). This is the property the change
  actually endangers: the rebuilt arm calls two real engine commands from inside the career loop –
  `bookVacation` (priced off the `seed:vacation:week:packageId` sub-stream) and `hireCoach`. Measured
  SAME on 8k·budget, 25k·self and 120k·high before it was written.
* **The fork test stays on the grinder, and the re-aim was TRIED rather than declined.** Under the
  player arm the cell it uses (`25k · middle · self-coached`, seed 0) reaches the fork with the
  scholarship already spent: the counting W75 finish that shuts the college door lands at age
  **17 (week 178)** instead of **19 (week 292)**, and `answerFork(world, 'college')` throws. The
  cell's own selection argument – «a self-coached middle-class family grinds the calendar without
  ever putting a scoring W75 result on the board before nineteen» – was true of the GRINDER and only
  the grinder. **A family that manages the career turns professional two years earlier**, which is a
  fact about the game worth having rather than a test failure. Moving that test needs the bench's
  college-door table re-run under the player arm (28 minutes) and a cell re-picked from it.
* The grace sweep also stays on the grinder, and there the reason is that the other arm would make it
  VACUOUS rather than red: the bankruptcy grace is a rule about families that go into the red, and
  the rebuilt player arm does not. `8k · working · budget` bankrupts at week 198 under the grinder
  and survives the horizon under the player.

### 7.7 What this costs the documents above, again

§6's «what no longer stands» list grows. Every `player`-arm figure printed by `tools/econ-bench.ts`
before this section – survival, end funds, entries, reach, the A4 break-even week – was produced by
the trapped policy and is superseded. Measured on 25k·middle·budget over 14→18, same seeds, the two
arms now read:

| | grinder | player (rebuilt) |
| --- | --- | --- |
| survived | 1/4 | **4/4** |
| prize money | $1,703 | **$46,880** |
| season-4 end rank | #74 | **#31** |
| a week's prize beat that week's costs | 1/4 careers | **4/4** |

**The grinder arm is unaffected and every number ever measured through it still stands.**
