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
