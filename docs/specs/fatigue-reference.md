# Fatigue reference — the canonical numbers (26.07.2026)

Written because the same question was re-litigated three times, twice from a mislabeled table in a
report. **Every number here is generated from the live `ECONOMY` knobs and pinned by
`tests/fatigueReference.test.ts`** — if a knob moves, that test fails and this doc is stale by
definition. Nothing here is from memory.

> **MATCH BASE RAISED 1 → 2 (owner decision, 26.07).** `matchFatigue.straightSets` 1 → 2 and
> `matchFatigue.hardMatch` 2 → 3. His rule is unchanged — "+1 for a tiebreak or a third set", "+1
> more for a three-tiebreak epic" — so `hardMatch` stays exactly one step above the base, and
> `extraTiebreaks` (1) and `tierMatchFatigue` (local 0 … j300 5) are untouched. Every table below is
> the same arithmetic one rung higher, **regenerated from the engine, not hand-edited.**

## The rule (owner's design, round 9 + round 10; base raised 26.07)
```
one match  = scoreline + tier surcharge
             scoreline: 2 simple (2 sets, no TB) · 3 with a TB or a 3rd set · +1 more if 3 TB sets
             surcharge: local 0 · regional 1 · national 2 · j30 3 · j60 4 · j300 5
one run    = Σ over matches IN ORDER of ( match cost + cumulative ladder[index] )
             ladder index is 0-based WITHIN THE RUN, so the FIRST match never pays extra:
             the cumulative only starts once she plays more than one match that week.
one friendly = max(1, the SAME match's LOCAL cost − 1)      (a practice match, never below 1)
```
Recovery is the other half and is unchanged: +1 base per week, +0/1/2 slider bonus on match-free
weeks, +2 physio, +1 blackout week; a tournament week pays no base (V2.1).

## Per-match cost
| tier | simple | TB or 3rd set | 3 TB sets |
|---|---|---|---|
| local | **2** | 3 | 4 |
| regional | 3 | 4 | 5 |
| national | 4 | 5 | 6 |
| j30 | 5 | 6 | 7 |
| j60 | 6 | 7 | 8 |
| j300 | **7** | 8 | **9** |

So a match costs **2 to 9**: 2 for a straight-sets Local, 9 for a three-tiebreak epic at J300. (It
was 1 to 8 at the old base.)

## Whole-run cost, all matches simple
Ladders: `off [0]` · `D [0,1,1,1,1]` · `C [0,1,1,2,2]` (SHIPPED) · `B [0,1,1,2,4]` · `A [0,1,2,3,4]`.
(The owner's written B increments were +1,+1,+2,+3 = 7; the bench ran +8 to match his stated total.
B was not the pick either way.)

Depth = matches played in that ONE tournament week. **A title is 3 matches at Local (draw 8), 4 at
Regional (draw 16) and 5 at National and every J tier (draw 32)** — the title cell is bolded per row,
because reading "the depth-5 column" as "the title" is exactly the mislabeling this file exists to
stop.

| tier | ladder | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| local | off | 2 | 4 | **6** | 8 | 10 |
| | D | 2 | 5 | **8** | 11 | 14 |
| | **C** | 2 | 5 | **8** | 12 | 16 |
| | B | 2 | 5 | **8** | 12 | 18 |
| | A | 2 | 5 | **9** | 14 | 20 |
| regional | off | 3 | 6 | 9 | **12** | 15 |
| | D | 3 | 7 | 11 | **15** | 19 |
| | **C** | 3 | 7 | 11 | **16** | 21 |
| | B | 3 | 7 | 11 | **16** | 23 |
| | A | 3 | 7 | 12 | **18** | 25 |
| national | off | 4 | 8 | 12 | 16 | **20** |
| | D | 4 | 9 | 14 | 19 | **24** |
| | **C** | 4 | 9 | 14 | 20 | **26** |
| | B | 4 | 9 | 14 | 20 | **28** |
| | A | 4 | 9 | 15 | 22 | **30** |
| j30 | off | 5 | 10 | 15 | 20 | **25** |
| | D | 5 | 11 | 17 | 23 | **29** |
| | **C** | 5 | 11 | 17 | 24 | **31** |
| | B | 5 | 11 | 17 | 24 | **33** |
| | A | 5 | 11 | 18 | 26 | **35** |
| j60 | off | 6 | 12 | 18 | 24 | **30** |
| | D | 6 | 13 | 20 | 27 | **34** |
| | **C** | 6 | 13 | 20 | 28 | **36** |
| | B | 6 | 13 | 20 | 28 | **38** |
| | A | 6 | 13 | 21 | 30 | **40** |
| j300 | off | 7 | 14 | 21 | 28 | **35** |
| | D | 7 | 15 | 23 | 31 | **39** |
| | **C** | 7 | 15 | 23 | 32 | **41** |
| | B | 7 | 15 | 23 | 32 | **43** |
| | A | 7 | 15 | 24 | 34 | **45** |

## THE result of the base raise: a straight-sets title now costs the OLD FLAT strain, exactly
Before round 9 the engine charged a FLAT `tournamentStrain` per tournament — **local 8, regional 16,
national 26** (and a single 34 for the then-inert `itf`) — the same whether she lost in round one or
won the title. At base 2 under shipped ladder C:

| tier | title = matches | title, all simple | all 3-setters | all epics | OLD FLAT |
|---|---|---|---|---|---|
| local | 3 | **8** | 11 | 14 | **8** |
| regional | 4 | **16** | 20 | 24 | **16** |
| national | 5 | **26** | 31 | 36 | **26** |
| j30 | 5 | 31 | 36 | 41 | 34 |
| j60 | 5 | 36 | 41 | 46 | 34 |
| j300 | 5 | 41 | 46 | 51 | 34 |

Three for three on the tiers the owner priced himself, to the point. The per-match redesign is now
**cost-neutral at the top of the draw** while still being far cheaper on an early exit — which is
what the redesign was for. (The J family lands 31/36/41 against the old single 34: the flat model
never distinguished the three J levels, so there is nothing to be neutral against.)

## The owner's "a five-match National run maxes at 25"
That check was **five HARDEST national matches at the old base**: 5 × (3 scoreline + 2 surcharge) =
25, pre-ladder. At base 2 the same run is 5 × 6 = **30 per-match, 36 with ladder C** — his stated
ceiling is exceeded by ~44%. Two honest readings, both straight off the tables above:

- as a **maximum**, National now tops out at 36 (it was 31 at base 1 + C, and 25 pre-ladder);
- as the **ordinary** five-match National title (all straight sets) it is **26** — so the number his
  mental model produced now describes the typical deep run instead of the worst case, and it
  coincides with the old flat 26 exactly.

An earlier version of this doc claimed "his 25 benchmark is variant A". That read the all-simple
column, where base 1 + ladder A happened to land on 25 — a coincidence of two unrelated knobs, and it
is gone. The heaviest single thing in the game is now a five-match J300 run of epics: **51**.

## The practice friendly — the one behaviour change for practices
`max(1, local cost − 1)`, unchanged as a formula. But at base 1 a simple Local match cost 1, so the
rule was `max(1, 0) = 1` and **the −1 was dead arithmetic**: every friendly cost 1 whatever happened
on court. At base 2 the subtraction is real:

| friendly | its Local cost | drain at base 2 | drain at base 1 |
|---|---|---|---|
| straight sets | 2 | **1** | 1 |
| a tiebreak in a 2-setter | 3 | 2 | 1 |
| a third set | 3 | **2** | 1 |
| three tiebreak sets | 4 | 3 | 1 |

The floor of 1 holds — a straightforward friendly is still the cheapest thing in the game — but a
slugfest now costs more than a stroll, which is the grading the rule was written for. **Measured
consequence** (16 grinder careers × 104w — the policy that books a friendly every plannable week):
the friendly scoreline mix is 41% straight / 59% harder, so the mean friendly drain goes
**1.000 → 1.588** and a practice-heavy season pays **20.8 → 37.0** condition. A practice week recovers
`recoveryBase` (1) and forfeits the slider bonus, so the "friendly treadmill" that used to hold
condition flat for ever (drain 1 = recovery 1, net zero) became a slide of about **−0.6/week**.

### THE DOCTOR GATES THE FRIENDLY TOO (owner 26.07) — the rule that stops that slide
> "The doctor who will not let her travel probably should not clear her for a friendly at condition 0."

Below `ECONOMY.availability.medicalFloor` (15) a practice match **cannot be booked**, and a friendly
already booked whose week **arrives** under the floor is **called off on the day**. It is the same
predicate the tournament entry gate uses (`medicalBlock` in `world.ts`, off `medicalClearance`), so
the two surfaces refuse in the same words — the planner sheet disables the button and prints the
reason instead of throwing on click. Two deliberate asymmetries with the tournament veto:

- **there is no warning band for a friendly.** Below 15 it is a hard block; from 15 up, the practice
  GUARDRAIL's soft caution (`practiceCaution`) owns the whole range, exactly as before. Fatigue for
  tournaments stays a warned choice; the floor is the one hard body-gate.
- **the court rental comes back in full** when the week is called off, where a tournament withdrawal
  forfeits the entry fee. No entry list ever closed on a court booking, `cancelPractice` already
  refunds in full, and the friendly awards nothing that "book it and see" could game. The called-off
  week then pays the **full** free-week recovery (base + slider bonus), not the practice-week rung.
- a **vacation is never gated** — refusing rest below the floor is how the fix would have created a
  week where nothing at all was possible.

**Measured** (grinder, 4 profiles × 12 seeds × 104w = 4 992 weeks; gate off vs on, nothing else
changed): weeks pinned at condition 0 **worst cell 32.7% → 2.9%**, pooled **1.40% → 0.36%** (base 1,
before any of this, was 1.9% / 0.18%). The traced worst cell books 67 friendlies without the gate and
20 with it, and spends 34 weeks at 0 without it and 3 with it. `balanced` and `careful` are
**unchanged to the week** (5 of 832 weeks under the floor either way, 197 friendlies either way):
they only practise while fresh, so the gate never sees them. Full audit trail, both surfaces of the
veto and the injury-anchor side effect: `tests/fatigue-bench.test.ts` (the doctor's-veto test) and
`tests/planner.test.ts` P7b.

## Why the four variants feel alike (measured, not argued)
Run-depth distribution, RE-MEASURED at base 2 through the bench's own week stepper (4 profiles × 3
policies × {52w, 104w} × 10 seeds); base-1 figures in brackets for comparison.

| policy | 1 match | 2 | 3 | 4 | 5 | 6+ | runs/season |
|---|---|---|---|---|---|---|---|
| grinder | **53.7%** [49.3] | 22.9% [25.7] | 20.0% [20.5] | 3.1% [3.8] | 0.3% [0.8] | 0.0% | 12.3 [14.6] |
| balanced | **44.1%** [44.2] | 23.0% [23.9] | 20.2% [20.3] | 7.4% [7.1] | 5.3% [4.5] | 0.0% | 16.3 [16.6] |
| careful | **43.8%** [42.8] | 23.7% [24.2] | 19.2% [21.1] | 8.1% [6.9] | 5.2% [5.1] | 0.0% | 16.3 [16.7] |

- At depth 1 (~44-54% of all runs) every ladder is identical — the first match never pays extra.
- At depth 2 (another ~23%) all four are identical again (+1).
- D, C and B stay identical through depth 3 — together **87-97% of all runs**.
- They separate only at depths 4-5, i.e. 3-13% of runs.

The shape barely moved, which is itself the finding: **the base changes what a MATCH costs, the
ladder changes what DEPTH costs, and the two questions are independent.** (The one real shift is the
grinder's, and it is not about depth: base 2 puts her under the medical floor far more often, so she
enters fewer events — 14.6 → 12.3 runs/season — and her whole distribution slides one notch
shallower.) So the earlier conclusion stands verbatim: if the cumulative effect itself should bite,
the lever is the rungs at depths 2-3, where the runs actually live, not the slope of the tail —
`[0,2,2,3,3]` would land on ~44% of runs instead of 3-13%. Still open, not shipped.

## Where the "local runs feel free" impression came from — and where it went
Pre-round-9 the engine charged the flat `tournamentStrain` above: local 8 whether she lost in round
one or won the thing. At base 1 + ladder C a straight-sets three-match Local title cost 5, so an easy
local title was ~40% cheaper than the old flat 8 while a hard-fought one stayed put — a real, and
deliberate, discount bought by the per-match redesign.

**The base raise closed that gap.** At base 2 the same straight-sets Local title costs **8 — exactly
the old flat number** — and a Local title with one three-setter in it costs 9. The discount that made
local runs feel free is gone; what remains is the shape the redesign was actually for: a
**first-round exit** costs 2 where the flat model charged 8. That is the honest summary of this
change — it did not make local titles expensive, it made *losing early* the only cheap outcome.

## Bench outcomes of the four ladders (5 400 careers, full model)
⚠ **Measured at match base 1 and NOT re-run at base 2.** Kept because the ladder choice is still
open and this is the only measurement of it; read it as the relative ORDERING of the four ladders,
not as absolute levels.

Rival-side proof that the ladder is SHARED — mean cohort condition falls monotonically with
steepness (83.7 off → 81.4 D → 81.0 C → 80.7 B → 79.8 A), on the field she actually faced.
Distance outside the owner's wk49 60-85 band, summed over policies (lower is better): off 15.0 ·
**C 19.0** · B 19.6 · A 20.8 · D 22.2 → **C is the best of the four ladders**, and best on the 52w
and 104w horizons specifically. C is also cheapest for the family (best end funds and survival among
the shallow variants) and gentlest at the medical floor. The grinder/careful injury ratio is
unmoved by ladder choice (2.25-2.41× pooled; the ≥3× anchor is met only at 208w).

**What base 2 does to that open question:** nothing that argues for a steeper ladder, and something
that argues against one. The base raise already moves every cost up one rung PER MATCH, which is a
bigger absolute change than any ladder swap (+5 on a five-match run, where C→A is +4 and C→D is −2)
and it lands on ALL runs — including the ~half that are one match, where no ladder reaches at all.
Base 2 + C also reproduces the old flat title costs to the point (8 / 16 / 26); variant A would
overshoot them (a straight-sets National title would be 30 against the old flat 26). The measured
cost of the base raise on the shared cohort is in `tests/rivals.test.ts` C2, and on the player in
`tests/fatigue-bench.test.ts`.
