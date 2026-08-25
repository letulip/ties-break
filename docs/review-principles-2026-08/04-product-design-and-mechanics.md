---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# Product, plot, design, and mechanics

## Product verdict

The MVP now delivers two of its three stated pillars with unusual credibility:

1. **Match as show:** outcomes are deterministic records; the player may watch, skip, replay, or
   change presentation speed without changing the result.
2. **Honest economics:** cents-based ledgers, real trade-offs, entry/travel/coach/equipment costs,
   sponsorships, college, savings, debt, and endings produce a coherent family-career pressure arc.

The third pillar—“the child is a person, not an asset”—is represented but not yet a general mechanic.
The game has school, birthdays, development uncertainty, knocks, injury decisions, diary/news
texture, college, and retirement. It does not expose one coherent morale, trust/relationship,
burnout, consent/resistance, or quitting system. `README.md:20-24` markets morale, parent-child
relationship, and burnout in present-tense pillar copy, while the canonical product pack itself
acknowledges the general system is absent at `docs/context/product-and-narrative.md:17`.

This does not make the MVP false as a tennis-career simulator. It does make its most distinctive
narrative promise weaker than its match and economy promises.

## Concept and player role

The parent perspective is the project's clearest market distinction. It turns money, travel,
school, medical caution, coach choice, and tournament entry into family decisions rather than a
standard athlete-stat treadmill. The UI voice consistently addresses what a parent knows, pays,
and decides. Imperfect skill information and watchable matches support that perspective well.

The conceptual risk is **control without relationship**. If every meaningful lever changes finance,
condition, rank, or skill but rarely changes how the daughter feels or responds, she remains an
exceptionally well-presented asset. More flavor text will not solve this; it needs a small causal
system.

### Minimum honest “person” layer

Avoid a second economy-sized subsystem. A v1 layer can be only two slow-moving values:

- **wellbeing** — current capacity/enthusiasm, affected by load, injuries, school conflict,
  recovery, and repeated pushing;
- **trust** — accumulated relationship, affected by honoring warnings/preferences, medical care,
  promises, and pressure decisions.

They should not be direct optimization bars with exact future effects. The parent should see
behavioral signals, diary tone, conversation choices, refusal/negotiation thresholds, and eventual
career consequences. Existing decisions—training/rest, playing hurt, missed vacation, knocks,
school, college, and retirement—provide enough inputs. A small number of state transitions and
reason-coded reactions would make the pillar mechanical without building a life simulator.

If that layer is not near-term, narrow README pillar wording to what the build currently proves.

## Plot and career arc

The career now has a much stronger dramatic shape than at the previous review:

- junior uncertainty and relative-age pressure;
- escalating ladder access and travel cost;
- coach/academy/equipment commitments;
- sponsorship and financial relief;
- injury and medical withdrawal decisions;
- school/college forks;
- adult-tour sustainability, savings/debt, retirement, and epilogue.

The ending machinery and `EndingScreen.vue` mean a career can now conclude and reflect on choices.
That closes the old review's most serious plot gap. The remaining weakness is connective causality:
the economic/sporting arc is strong, but the relationship arc is mostly narrated rather than
accumulated. Endings therefore have more evidence about results and finances than about how the
family journey changed the child-parent relationship.

The next plot work should reuse persistent consequences rather than add more isolated incidents.
One trust/wellbeing decision echoed at a later fork is more valuable than ten one-off popups.

## Mechanics findings

### TB-01 — P1: live probability can drift from match serving rules

The duplicated tiebreak serve rotation described in the principles chapter is a product defect, not
only code quality. The match viewer promises honest live probability. One shared algorithm and a
cross-consumer test are required before either tiebreak implementation changes.

### TB-04 — P1: skipped-event recovery is knowingly short by eight points

During a medical withdrawal, `world.ts:3042-3060` converts a previously match-marked week into a
full free week by adding:

```text
recoveryBase - matchWeekRecoveryBase + restRecoveryBonus
```

During manual `skipEvent`, `world.ts:3352-3358` adds only `restRecoveryBonus`. The adjacent comment
at `world.ts:3049-3053` says this became a short payment when the condition-v2 change set
`matchWeekRecoveryBase` to 0 while `recoveryBase` is currently 8. `tests/round9.test.ts:547-552`
pins the short behavior; `tests/condition.test.ts:1408-1417` proves medical withdrawal receives full
free-week recovery.

Equivalent match-free weeks therefore differ by eight body points depending on how the event was
cancelled. That is difficult for a player to infer and penalizes the explicit “do not play” choice.

**Recommendation:** characterize current long-run fatigue/injury outcomes, change skip recovery to
the same difference formula, update the test to assert equivalence, and rerun the relevant fatigue
bench. The fix must consume zero RNG draws. Because it changes shipped condition traces, it should
be a measured balance wave, not a casual refactor.

### Eligibility explanation should be an engine projection

The tier classifier duplication can produce contradictory “open/locked/capped” cards. The best
mechanics UX is not more prose; it is one neutral engine verdict, transformed into concise player
language in both Season and Calendar. The same projection can expose the next threshold/week and
reduce trial-and-error.

### Exhibition sandbox placement is ambiguous

`SeasonScreen.vue:1116-1146,1648-1722` includes a free, no-stakes exhibition with a visible seed,
alongside the costed career practice flow. It is useful for a hero demo and may be an intentional
owner tool. In the core career planner it can also weaken the economy's meaning and add a competing
mental model.

This is a product decision, not a deletion recommendation. Choose one explicit role:

- a labelled training lab/demo outside career continuity;
- a development-only tool hidden from release;
- or a real career exhibition with cost, body, time, and narrative consequences.

Do not leave it visually equivalent to a career action while mechanically exempt.

## Balance and progression

The balance methodology is a project strength. Dedicated probes and serialized simulations record
why knobs moved, and the economy centralizes tuned values. The ladder, relative-age system,
development uncertainty, mandatory entry rules, sponsorship, and college give the career multiple
interacting pressure curves.

Review guidance for future balance work:

- require before/after distribution evidence, not one seed or one hand-played career;
- retain deterministic seed sets when changing a rule;
- separate correctness corrections (same situation, different result) from desired tuning changes;
- report median plus tails and failure modes, not only averages;
- test player-facing explanations against the exact engine verdict;
- preserve integer cents and zero-draw transformations when randomness is not part of the mechanic.

Do not fragment `ECONOMY` merely to reduce tokens. It is valuable to see interacting knobs together.
Compress its historical essays first, then split only stable feature-owned sections while
reassembling one public tuning surface.

## Mobile-first interaction and visual design

The component system now includes real shared primitives, mounted tests, overlays, safe-area work,
accessible labels, and a consistent paper/desk narrative language. Match playback, season planning,
finance, inbox, and epilogue have distinct visual identities without importing a large UI library.
That is a strong solo-project trade-off.

Code-level design risks remain:

- Season and Calendar duplicate odds colors, venue projection, academy coverage, and accessible
  ring labels, so the same fact can look or speak differently;
- 4,007 lines of global CSS include verified orphan onboarding and old finance blocks;
- large store-aware SFCs make visual changes collide with playback or mechanics logic;
- future-disabled controls (“Boy / coming later”) advertise scope rather than help the present task;
- global and scoped variants of the same control have drifted because the primitive lacks a named
  appearance.

Use small presentation models and semantic primitive variants. Do not force whole screens through
one generic card system; Season and Calendar have genuinely different actions.

This audit did not perform a new device screenshot sweep, screen-reader session, or complete
keyboard pass. The conclusions above come from current structure and tests, not a claim that every
visual state was manually inspected.

## Scope recommendation

For the next release, prioritize honesty over breadth:

1. correct tiebreak parity and skipped-week recovery;
2. make engine verdicts explainable in UI;
3. decide and implement the minimum relationship mechanic, or narrow the promise;
4. decide whether the exhibition sandbox is product, demo, or developer tooling;
5. remove disabled/dormant promises until their behavior is funded.

That plan deepens the existing game instead of adding more shallow systems.
