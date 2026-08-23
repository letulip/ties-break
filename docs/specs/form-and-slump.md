---
type: spec
status: draft
area: engine/psychology
canonical: false
last-reviewed: 2026-08-10
---

# Form: the third way down

**Design proposal. Nothing built, and deliberately not next.** The owner, 10.08, after the
failure-modes measurement: «форму и спад тоже давай распишем спеком, но уже на потом, у нас же мораль
и психологи в будущем, можно добавить в бэклог.»

So this is the shape of the idea, written while the measurement that motivates it is fresh, and
parked. It belongs beside morale and the sports psychologist, not in front of them.

## 0. The finding this exists because of

`tools/failure-modes.ts`, 30 seeds × 4 profiles × 4 seasons, the balanced policy:

| | 8k self | 25k self | 25k coach | 120k elite |
|---|---|---|---|---|
| median win rate | 58.8% | 56.7% | 61.9% | 56.6% |
| careers that lost more than they won | 7% | 10% | 3% | 3% |
| runs that were ONE match (median) | 41.6% | 45.1% | 36.6% | 41.9% |
| finished 10+ places below their own peak | 43% | 73% | 87% | 97% |
| the family went broke | 100% | 93% | 100% | 97% |

**She can lose, stall, fall and go broke.** All four are measured and all four are real.

⚠ **But there is exactly one thing she cannot do, and it is the one the owner asked about.**
`growWeek`:

```
gain = rate × headroom × luck × aim     headroom = max(0, potential − skills) ≥ 0
                                        luck ∈ [0.55, 1.45]  – always positive
loss = decline × skills                 declineFactor(age) = 0 below declineStart: 29
```

Every factor of `gain` is non-negative and `loss` is identically zero below 29. **Her build cannot
get worse before that age.** Not from a bad week, not from a layoff, not from any plan the player is
able to write. The worst a parent can do is make her improve more slowly.

And there is no state that remembers a bad run: `lossStreak` is computed, reaches
`avatarEmotion` and one `kidLife` line about a friend who listens, and **touches nothing on court** –
not `basePServe`, not `composure`, not `condition`.

So the two ways down that exist today are **RELATIVE** (the cohort grows too, and the conveyor brings
a new generation every season) and **INTERRUPTION** (injury weeks, the doctor's floor, money).
Form would be the third, and it is the only one that is about *her* rather than about the world or
her body.

## 1. What form is, and what it must not become

**Form is a slow-moving multiplier on how she plays, driven by results, bounded and mean-reverting.**

Three properties it has to have or it is not worth building:

* **It is a STATE, not a skill.** It moves in weeks and returns to neutral on its own. Nothing about
  `potential` or `skills` changes – those keep their monotone contract, and every measurement,
  fixture and bench anchor that depends on it survives.
* **It is symmetric.** A run of wins should feel like something too. A model that only punishes is a
  difficulty knob wearing a psychology costume.
* **It is BOUNDED and small.** For scale: `conditionMatchFactor` at 100 → 60 is worth 2.7–9.9 points
  of win probability (measured, `tools/winrate-read.ts`). Form should be **smaller than fatigue** –
  it is the thing that decides a close match, never the thing that decides a career.

⚠ **What it must not become: a second condition.** The game already has one slow scalar that the
player manages week by week, with its own screen, its own floor and its own doctor. A second one
with the same shape doubles the bookkeeping and halves the meaning of both. Form differs by being
**driven by results rather than by load**, and by being something the parent influences *indirectly*
– through what she is entered in – rather than sets.

## 2. Where it would attach

One term, one place: `basePServe` already carries every match-deciding input, and `composure` is
already the attribute about her head. The cheapest honest shape is **form modulating composure**
rather than a fifth term – so the radar, the box score and the commentary all inherit it for free
and no new number appears in any surface that reads a `MatchPlayer`.

* **Input**: the results ledger, which already exists and is already windowed.
* **Update**: at the week tick, beside condition. Pure state, zero draws – it reads results the same
  way `rivalConditions` does.
* **RNG**: if any randomness is wanted (a slump that arrives rather than accumulates), it goes on a
  purpose-scoped sub-stream, `seed:form:<week>`. Invariant 2, MAIN untouched.

## 3. What it unlocks – and this is the real argument for it

Form is not interesting on its own. It is interesting because **it gives the psychologist something
to do.** A sports psychologist with no slump to treat is a bill with no product; a coach's "she has
lost her serve" line means nothing if her serve is a constant. The same is true of morale.

So the sequencing is not "form, then psychology" – it is **one design**, and form is its engine
half. That is why this spec is parked rather than queued: building the mechanism before the systems
that read it would ship a number nobody looks at, which is exactly the shape of the academy
scholarship's $948 (task #90).

## 4. Open, all of it

1. **Driven by what, exactly?** Win/loss streak is the obvious input and probably the wrong one –
   losing to the world #1 is not the same event as losing to #400. Result *relative to expectation*
   (`fastMatchProbability` already computes the expectation) is truer and costs nothing extra.
2. **How big, and how slow?** §1's bound says smaller than fatigue. The half-life matters more than
   the amplitude: a slump that clears in three weeks is a mood, one that clears in three months is a
   season.
3. **Is it visible?** Her ceiling is behind a fog of war by an owner ruling (decisions.md #11). Form
   probably should not be a number either – a sentence from the coach, the way
   `coachMarket`'s ceiling line already works.
4. **Does the cohort have it?** Rivals carry condition and play styles; giving them form as well
   makes the field breathe, and costs a scalar per rival per week against a 199-player cohort and a
   1,600-strong professional population. Measure before assuming it is cheap.
5. **Does it interact with the knock thread?** `knock.ts` already models "she is carrying something
   and keeps being sent out". A body thread and a head thread that ignore each other would be two
   systems where the story wants one.

## ⚠ Adopted while parked (23.08, from the Codex perspective review)

When the owner unparks this, the driver is RESULTS RELATIVE TO PRE-MATCH EXPECTATION, never raw
wins and losses – losing to the world number one must not produce the state change of losing a
heavily favoured match. The odds ring already computes the expectation; form reads the residual.
And the standing sequencing rule is confirmed from both directions: form ships only WITH the
psychology surfaces that give it meaning (`the-private-life-build.md`) – alone it is an invisible
match modifier, the failure mode the perspective and this spec name identically.
