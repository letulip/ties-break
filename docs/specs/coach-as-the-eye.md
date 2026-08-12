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
