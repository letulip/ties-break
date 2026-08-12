---
type: spec
status: draft
area: economy/coach
canonical: false
last-reviewed: 2026-08-12
---

# The coach is an eye, and the eye cannot be learned from YouTube

**Design proposal. Nothing built.** The owner's third round of "why do I pay a coach" (12.08), and
this time with the measurement that makes the question unavoidable: `what-money-buys-2026-08.md`
found that above `budget` no rung beats self-coaching on any ranking axis, that at a `working`
background any paid coach is ruinous, and that the coach ladder is the only thing in this economy
that manufactures a money constraint at all.

## 0. The owner's concern, verbatim, because it kills the obvious fix

> «если мы делаем "Тренер должен продавать знание, а не проценты", то это (условно) контракт на
> 1 сезон, после чего игрок тренера выкидывает и обладая "знанием" продолжает играть… если бы в
> реальности было так – рынок тренеров был никому не нужен, а все бы занимались "по ютубу". Но в
> реальности далеко не все знают как надо растить теннисистку, поэтому всю карьеру занимаются с
> тренерами. Я хочу эту ценность воссоздать… И тренер должен стоить, но и результат давать,
> особенно если она играет и выигрывает.»

He is right. Knowledge-as-principle – "domestic points are the wrong currency", "aim your seasons" –
is learned once and owned forever. A coach whose value is a principle is a tutorial with a salary.
The durable value has to be knowledge that **expires and regrows**, and there is exactly one kind:
knowledge about HER, this season, which next season's growth makes stale.

## 1. The pieces are already in the model, and none of them is new mechanics

* **Her ceiling is fogged, permanently, by an owner ruling.** `CEILING_FLOOR_HALF = 4`: the haze
  never collapses below an eight-point window, and its centre is misread too. The player NEVER
  learns where the headroom is – only a range. That ruling ("talent is discovered, not displayed
  after a delay") is the foundation this spec builds on.
* **An aimed season moves one wing ×5** (`aimWeights` renormalises to sum 5; measured +5.6 points at
  seventeen, far above the fog). Aim is the strongest lever the player holds.
* **Aiming at a nearly-full wing burns the multiplier on nothing.** Olivia's serve had 1.3 points
  left; her return had 7.3. A season aimed at the serve wastes essentially the whole ×5.
* **The coach's eye is tiered accuracy, already shipped**: `COACH_ACCURACY` per rung; self-coaching
  reads with ±3.36 permanent error, budget ±2.16. The eye is literally "how well the radar is read".
* **And the eye goes stale**: `coachSinceWeek` – a new hire has to re-learn her. Fire the coach and
  his map of her leaves with him, while she keeps growing and the map keeps changing.

## 2. The loop, which is the whole design

    coach tier → eye accuracy → where the season is AIMED → how much of the ×5 is not burned

Every season, again, because every season she is a different girl with a different headroom map.
That is the value that cannot be extracted in one contract: not the principle of aiming, but the
**target**, re-read each year through an eye the family does not own.

### 2a. And it answers "how does the game punish a badly-trained prodigy"

The punishment scales with talent by arithmetic, with no new knob: a mis-aimed season wastes in
proportion to the headroom it missed. Naomi (71 points born headroom) mis-aimed leaves three times
what Olivia (37.5) leaves. **The prodigy with a bad eye abandons thirty points; the modest girl with
a good eye extracts all of her thirty-seven.** That is the owner's own pair, told as a mechanism.

### 2b. What each rung SAYS (the surface half)

The eye must speak, or the player cannot tell tiers apart. One line on the season plan, register by
rung – vague at the bottom, a target at the top:

* self: nothing – the parent reads the fogged radar alone;
* budget: "she is closest to her ceiling on serve" (names the FULL wing – where not to aim);
* middle: "the room is on her return" (names the best wing);
* high: "return, and the backhand after it – the serve is done" (an ordering);
* elite: a season plan: which wing, how many points of room the eye believes are there.

⚠ The line is licensed off the coach's OWN read (accuracy-degraded), never off the truth – the same
honesty contract the radar note already keeps. A budget coach can be confidently wrong.

## 3. ⚠ The prerequisite, stated so nobody builds the roof first

Two measured facts currently make ANY development-side coach value invisible:

1. **Bad training does not exist.** `gain = rate × headroom × luck × aim` is non-negative in every
   factor; the worst a plan can do is grow her slower. Doing nothing is safe.
2. **Skills stop mattering after ~18.** `growth-age-curve-2026-08.md`: 18→26 the median career gains
   2.2 points and never reaches a new rung; `ladder-vs-targets-2026-08.md`: the wta500 door passes
   0.6%, the Slam door nobody. Rank is made by table choice and health, not by the racket.

So this spec has a second layer that is NOT the coach: **skill must buy ladder again after 18**, or
the eye optimises a dead channel. That is the wta500-wall conversation and it needs its own
measured slice. Layer 1 (the eye) without layer 2 produces better radars and identical careers –
the measurement below will show exactly that if it is true, and then layer 2 goes first.

## 4. Pricing, and the owner's instinct lands here

> «тренер должен стоить, но и результат давать, особенно если она играет и выигрывает»

The eye's worth GROWS as headroom shrinks: at fourteen everything has room and a blind aim still
hits; at nineteen the map is mostly full and precision is everything. So the natural price curve is
**cost scaling with her level** – which is also why `elite` gated to the professional career (the
owner's own suggestion, `what-money-buys` §2's one supported change) stops being a patch and becomes
the design: elite is the eye for the years when only the eye matters. A cheap elite at fourteen is
selling a microscope to someone painting a fence.

## 5. The ship rule, authored before anything is built

The measurement (`tools/` probe, launched with this spec) runs careers whose season aim is chosen
three ways: by TRUTH (oracle on real headroom), by the FOGGED read at each tier's accuracy, and by
the shipped default (unaimed General). Per tier, per background:

1. **The eye must separate the tiers.** Realised skill at 18 and at 22: oracle ≥ elite-read ≥ … ≥
   self-read ≥ unaimed, with gaps a player could notice. If budget-read ≈ elite-read, the ladder
   has no product and this spec fails its own test – said in the doc, not discovered after build.
2. **The default must stop being optimal.** Unaimed General must measurably trail an aimed season at
   every tier. If it does not, aim is broken, not the coach.
3. **Net of the bill.** Each tier's skill/rank gain priced against its career cost, with
   self-coaching as control – the same table `what-money-buys` §2 built, re-run with the eye live.
4. **Nothing else moves.** Same seeds, aim-policy the only difference; the frozen MAIN capture
   holds; no schema change.

## 6. What this is NOT

* Not a new mechanic beside the old one – `coach-as-load-manager.md`'s standing rule. The eye is
  the radar's existing accuracy, speaking; aim is the shipped v47 plan; the loop is composition.
* Not morale, not form (`form-and-slump.md` stays parked with the psychologist).
* Not a replacement for load management – budget's physio (11-17 injury weeks saved) stays the
  floor of the ladder's value and is already honest.

## 7. Open, and the owner's to answer

1. **Does the eye's line appear on the plan screen or the coach card?** The plan is where aiming
   happens; the card is where paying happens. Probably both, one sentence each.
2. **May the parent see the eye's read while SELF-coached?** My instinct: no – self-coaching reads
   the fogged radar, that is what free means. But the radar already shows the haze, so "no" costs
   nothing to keep.
3. **Layer 2's shape** – how skill re-enters the ladder after 18 – is a separate spec after its own
   measurement. Nothing here depends on its answer except the size of the visible payoff.

---

## Measured – the eye, run before it is built (12.08.2026)

**`tools/coach-eye-bench.ts`, measured on `wave/flags-grant` head `e65ff34`** (the commit this spec
landed in). Reproduce:

```bash
npx vite-node tools/coach-eye-bench.ts                                # 3 cells x 7 arms x 30 seeds, ~17 min
npx vite-node tools/coach-eye-bench.ts -- --seeds 8 --cells working   # the fast look
```

§5's probe, exactly as authored: 630 careers, ages 14 to 22, whose season aim is chosen three ways –
ORACLE (the expressible aim that captures the most TRUE remaining headroom, re-decided every
season), EYE per rung (the aim that rung's own degraded read believes has the most room – five arms,
self to elite), UNAIMED (the shipped default General week). 30 seeds per background cell, `player`
policy, paired throughout – same seeds, aim policy the only difference. Careers that ended early are
41 of 630, all injury, spread 4–7 per arm with no aimed-vs-unaimed skew, so the knock's location
tilt does not confound the tables.

Two honesty constraints, stated before the numbers:

* **The worlds are self-coached in every arm; the tier names the EYE, never a hire.** Ship rule 4
  says aim-policy the only difference, and a real hire moves the development multiplier, the physio,
  the bill and the travel budget with it – the bundle `what-money-buys` §6 already measured. The
  read is the engine's own path end to end: `radarViewOf(world)` with the arm's tier substituted,
  through `buildRadar` – the career-fixed `seed:read:<axis>` misreading scaled by
  `bandFor(confidence)`, the drifted, floored ceiling haze, tenure from week 0, the same match
  evidence. Believed room = midpoint of the drawn ceiling band minus the shown value: the number a
  player would read off that rung's radar with a ruler. The rung's bill is priced arithmetically in
  M6 and never touches the careers.
* **The aim is driven through the shipped plan surface** – `planShapeError`, then `planFromWeek`,
  the worker's own `setPlan` semantics – as a pure week of one session kind on the balanced preset's
  five days. Same volume, same `train` projection, same bill, same knock CHANCE as the default;
  only `aimWeights` (and where a knock lands) differs.

### M1 ⚠ The surface cannot say "serve" – the first finding is a constraint, found before a career ran

`SESSION_AIM` gives three wings a x5 week of their own (rally → groundstrokes, fitness → stamina,
matchplay → composure), but serve and return exist only as a PAIR: `serve: ['serve','ret']`, x2.5
each. No legal week aims at the serve alone, or the return alone. Measured at the oracle's own
decisions, in **226 of 802 seasons (28.2%)** the single largest-headroom wing was not inside the
chosen week's targets – x5 on a smaller room beats x2.5 on the largest, so the aim lands beside the
wing the eye would name. Not a stop – three of five wings are fully aimable and the pair is honestly
aimable at half strength – but §2b's register ("budget: she is closest to her ceiling on SERVE")
can name a wing the plan grid cannot single out, and whoever builds the surface half should know
the vocabulary mismatch exists today.

### M2 Ship rule 1 – the tiers separate in ORDER and not in SIZE. By this spec's own test, the ladder has no product

Realised skill (sum of five wings), paired against the same girl unaimed:

| arm | working Δ@18 | Δ@22 | middle Δ@18 | Δ@22 | wealthy Δ@18 | Δ@22 |
| --- | --- | --- | --- | --- | --- | --- |
| eye-self | +0.51 | **−0.68** | +0.04 | **−1.28** | +0.40 | **−0.81** |
| eye-budget | +0.99 | +0.31 | +0.36 | **−0.42** | +0.40 | **−0.13** |
| eye-middle | +1.21 | +0.59 | +0.58 | −0.08 | +0.51 | +0.08 |
| eye-high | +1.32 | +0.77 | +0.68 | +0.22 | +0.56 | +0.31 |
| eye-elite | +1.30 | +0.75 | +0.71 | +0.32 | +0.59 | +0.32 |
| **ORACLE** | **+1.55** | **+1.23** | **+1.09** | **+0.92** | **+1.17** | **+0.91** |

Three facts, each doing separate work:

1. **The ordering is real, and it is overwhelmingly sign-consistent.** At 22 the oracle beats the
   unaimed same girl in 27/28, 27/27 and 26/28 pairs; elite beats self in 23/28, 22/27, 24/28;
   self → budget runs 23/3, 23/3, 21/4. One exception, and it is a finding: **high → elite is
   directionally dead** (Δ −0.02 to +0.10; pairs 10/9/9, 14/6/7, 11/10/7) – below ±0.60 of inner
   read error the tiers stop being tellable apart even in sign, because the error that decides the
   aim is the ceiling drift every rung shares (see the two caps below).
2. **The sizes are invisible.** The WHOLE mechanism – perfect knowledge over no aim at all – spans
   **+1.1 to +1.6 summed points at 18** and +0.9 to +1.2 at 22, against the game's own visibility
   floor of **3 points on one wing** (`TRAINING_FOG_FLOOR`). The whole eye LADDER – elite over self
   – spans +1.1 to +1.6 at 22. Adjacent rungs mostly choose the SAME seasons: at 18 budget → middle
   differs in 5, 8 and 3 pairs of 30 (the rest are byte-identical careers).
3. **Budget ≈ elite, said plainly, as rule 1 required in advance:** +0.42 (working), +0.77
   (middle), +0.40 (wealthy) at 22 – a seventh of one notch. **The ladder orders and does not
   separate. It has no player-visible product, and the spec fails its own test.**

### M3 Ship rule 2 – the default does NOT stop being optimal. A blind aim is worse than no aim

At 18 every aimed arm noses ahead of General (+0.04 to +1.55). By 22 the table turns over:
**unaimed beats the self-read eye in all three cells (−0.68 / −1.28 / −0.81; the blind aim finishes
behind in 61 of 82 pairs) and beats the budget-read at middle and wealthy.** Only high, elite and
the oracle stay ahead, by under a point. The arc is §4's own sentence, measured: at fourteen
everything has room and a blind aim still hits; as the wings fill, a misread aim burns the whole x5
on a full tank while the General week keeps feeding every wing that still has room. **Aiming
through a bad eye is worse than not aiming at all – the shipped default stays the best plan any
family below a high-accuracy eye can run, and rule 2 fails below that line.**

Why the numbers are structurally this small, stated so nobody retunes at them: `aimWeights`
RENORMALISES – the week's rate is conserved by construction, aim only chooses where it lands – so
the best possible aim buys exactly the covariance between weights and headroom, never new points.
The oracle's +1.6 IS that bound at this cadence (one aim a season, four expressible weeks). No eye
can be worth more than the aim it steers.

### M4 ⚠ RESULTS – the eye separates SKILLS and not CAREERS, and this decides the build order

Rank, rung and prize, paired at 22 (b/w/t = pairs better / worse / tied):

| duel (b vs a) | cell | Δrank@22 | b/w/t | Δrung@22 | b/w/t | Δprize@18 | b/w/t | Δprize@22 | b/w/t |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| oracle vs unaimed | working | +7 | 11/13/1 | +0.43 | 8/5/15 | −$6,945 | 9/17/3 | +$3,784 | 12/15/1 |
| oracle vs unaimed | middle | −4 | 12/9/4 | −0.11 | 5/6/16 | −$5,312 | 9/17/2 | −$6,891 | 11/16/0 |
| oracle vs unaimed | wealthy | −1 | 11/15/0 | +0.46 | 8/5/15 | −$1,183 | 15/15/0 | +$6,244 | 15/13/0 |

**The largest aim-quality contrast the mechanism can produce – perfect knowledge against no aim at
all, +0.9 to +1.2 skill points, 27/28 pairs – moves NO results axis:** rank is a coin flip (34
better / 37 worse pooled), rung ties exactly in over half the pairs and splits the rest, prize
means carry both signs. The eye-elite vs eye-self duel and eye-elite vs unaimed read the same way.
The only effects that survive a sign test anywhere are NEGATIVE ones: every aimed arm's prize at 18
sits $1,200–$6,900 below the unaimed same girl (mean negative in 17 of 18 arm-cells; concentrating
the week into the emptiest wing defers five-wing match power exactly through the ITF-turnstile
years), and the blindest eye trails on prize at 22 in two cells of three. **The results channel
notices bad aiming and never notices good aiming: a mis-aim can still leak match losses, but a
perfect aim buys nothing – `growth-age-curve` §3's skills-after-18 wall, arriving from a third
direction.**

### M5 §2a is FALSIFIED, and §4 was right all along: the waste scales AGAINST talent

"What the blindness costs" = oracle's realised skill minus the arm's, same girl, pooled across
cells, split by terciles of the TRUE roll (`Σ potential − startingSkills`):

| at 22 | all | modest T1 | middle T2 | prodigy T3 | T3−T1 |
| --- | --- | --- | --- | --- | --- |
| unaimed | 1.02 | 1.13 | 1.05 | 0.87 | −0.26 |
| eye-self | 1.92 | 2.30 | 2.03 | 1.39 | **−0.90** |
| eye-budget | 1.09 | 1.36 | 1.19 | 0.65 | −0.71 |
| eye-middle | 0.81 | 0.88 | 0.94 | 0.57 | −0.31 |
| eye-high | 0.59 | 0.71 | 0.64 | 0.40 | −0.31 |
| eye-elite | 0.56 | 0.68 | 0.59 | 0.40 | −0.27 |

**T3−T1 is negative in every arm at both ages: the modest girl mis-aimed wastes MORE than the
prodigy.** §2a's claim runs backwards, and the mechanism is the asymptote it leaned on: a prodigy's
wings all have room, so even a wrong aim lands on a live tank; the modest girl's map is nearly
full, and a misread burns the x5 on a 1-point wing – which is exactly Olivia's serve (1.3 left) in
§1's own worked example. What survives is §4's pricing intuition, now measured: **the eye's worth
grows as headroom SHRINKS. §2a must be rewritten from "the punishment scales with talent" to "the
punishment scales with how little room is left" – it is the nearly-finished girl, not the prodigy,
whose coach needs the sharp eye.** (And the absolute waste stays small everywhere: the blindest
arm abandons 1.9 summed points, not thirty – the ×5 conserves the week, so nothing on this scale
can be "abandoned" but the covariance. §2a's thirty-point story does not survive the arithmetic it
appealed to.)

### M6 Net of the bill – the eye alone pays for itself nowhere

The eye's marginal product (this arm minus the eye-self arm – self-coaching reads the same radar at
±3.36 for free) priced at the rung's full-attendance bill (the `careerBill` arithmetic
`what-money-buys` §0b prints), 14 → 22:

| bg | rung | bill to 22 | Δskill@22 | $/pt | Δprize@22 | prize − bill |
| --- | --- | --- | --- | --- | --- | --- |
| working | budget | $19,099 | +0.96 | $19,929 | +$5,357 | **−$13,742** |
| working | elite | $200,318 | +1.39 | $144,560 | +$8,493 | **−$191,825** |
| middle | budget | $25,465 | +0.82 | $30,898 | +$802 | −$24,663 |
| middle | elite | $267,090 | +1.60 | $167,102 | +$5,555 | −$261,535 |
| wealthy | budget | $31,831 | +0.69 | $46,109 | −$1,832 | −$33,663 |
| wealthy | elite | $333,863 | +1.14 | $293,538 | −$1,020 | −$334,882 |

(middle and high sit between; full table in the bench output.) Against `what-money-buys` §6c, where
the budget rung's whole BUNDLE cost $6,837 per skill point at working, the eye alone runs
$20,000–$294,000 a point and returns thousands of prize against bills in the tens to hundreds of
thousands. **The physio remains the rung's honest product; the eye, at the shipped constants, is a
rounding error on the same bill.**

### M7 RNG hygiene – ship rule 4 holds

The frozen MAIN capture was re-derived three ways inside the bench – no plan touched, an
oracle-aimed season, an elite-eye-aimed season – and all three tap the identical sequence and match
the documented pin (**41550 draws / `e6b0c709`**). Aim policy is player input, and the world's dice
did not notice it. No schema change; `git diff` under `src/` is empty.

### The verdict, rule by rule, and the sentence that decides the build order

| §5 ship rule, authored in advance | measured |
| --- | --- |
| 1. tiers separate, player-noticeable gaps; "if budget ≈ elite, the ladder has no product" | **ordered, invisible**: whole ladder ≤ 1.6 pts at 22 against a 3-pt notch; budget → elite ≤ 0.77; high → elite directionally dead. **Budget ≈ elite. No product.** |
| 2. unaimed must trail every aimed tier | **fails below high**: by 22 the default beats self everywhere (61 of 82 pairs) and budget in two cells of three |
| 3. net of the bill | negative at every rung in every cell (M6) |
| 4. nothing else moves | holds: same seeds, capture 41550 / `e6b0c709` intact (M7) |

**Layer 1 without layer 2 produces better radars and identical careers – measured, with one
refinement: a bad layer 1 produces slightly worse careers.** The oracle's perfectly aimed +0.9 to
+1.6 points is the mechanism's ceiling and buys zero rank, zero rungs and zero prize; so the
wta500-wall slice – skill must buy ladder after 18 – goes first, exactly as §3 predicted, and the
eye is not worth building until it exists.

And two caps sit UNDER the coach question that layer 2 will not lift, so they are named here rather
than discovered after the next build:

1. **The aim's own arithmetic.** `aimWeights` redistributes a conserved rate, so perfect aiming is
   worth +1.1..+1.6 summed points by 18 – half a notch – before any eye is priced. The eye cannot
   out-earn the lever it steers; if the eye is to be the ladder's product, the aim itself (its
   cadence, its multiplier shape, or what results read off single wings) has to be worth more
   first.
2. **The ceiling fog's floor is COMMON to every rung.** `CEILING_FLOOR_HALF = 4` and the 0.6 centre
   drift survive infinite confidence, so the elite eye agrees with the truth's choice in only
   **60.4%** of seasons against self's 46.8% – thirteen points of decision quality across the whole
   ladder, because the error that dominates aim choice is the one part of the fog the owner ruled
   permanent and every tier shares. The most sign-consistent step in the whole sweep is not a tier
   upgrade but eye-elite → oracle (+0.5..+0.6, 26/2, 25/2, 27/1): the permanent price of the
   ceiling floor, paid by a perfect inner read. "Talent is discovered, not displayed" and "the
   coach's durable value is reading her headroom" are, at the current constants, the same fog
   fighting itself – the ruling that makes discovery meaningful is what keeps the elite eye barely
   sharper than the budget one at the only task the eye exists for.
