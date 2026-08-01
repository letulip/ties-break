# Product, concept, narrative, and ethics review

## Product thesis

The pitch has three unusually compatible pillars: the match as a watchable show, the brutal economics
of junior tennis, and the child as a person rather than an asset ([README](../../README.md)). The
parent point of view is the strongest differentiator. It naturally connects money, travel,
observation, limited control, family class, and the emotional cost of ambition.

The problem is not the concept. The problem is that the implemented product currently expresses the
first two pillars much more fully than the third.

## Strengths

### Clear market position

Football Manager-like structure, short-session accessibility, a parent's-eye economy, and a
watchable deterministic court are a credible niche. The research correctly identifies genre pain
around rigged outcomes, opaque attributes, repetitive progression, and intrusive monetization
([market research](../research/01-market-and-competitors.md)). The decision not to rig results is both
an engineering invariant and a marketable value.

### The point of view is emotionally productive

The parent does not play the points. They pay, plan, travel, worry, observe, and decide when to push.
This is fertile ground for drama that sports games usually ignore. The diary's facts-first voice is
especially well aligned with that point of view: it notices what happened without inventing a false
plot ([diary](../../src/engine/diary.ts#L1)).

### Authored specificity creates identity

The fixed heroine, family register, age-banded portrait system, and consistent visual voice make the
game feel authored rather than procedurally anonymous. That increases emotional coherence and makes
the app recognizable.

### The economics have thematic purpose

Money is not a shop currency bolted onto tennis. Entry fees, travel, coaching, equipment, academy
support, sponsors, and adult prize money create the promised “valley of death.” The best design
choice is that prize cheques do not scale with family wealth
([world.ts](../../src/engine/world.ts#L1047)).

## P0: the promised game does not end

The concept promises a full career and distinct endings, while the roadmap describes a detailed run
into the thirties ([plan](../plan.md#L82)). The current design document still acknowledges that
retirement, bankruptcy as an ending, career-ending injury, the age-19 decision, and an epilogue are
unfinished ([adult-tour-and-endings](../specs/adult-tour-and-endings.md)).

This is not ordinary missing content. Without an ending:

- the player's sacrifices cannot be judged in retrospect;
- “stop can be the right answer” never becomes playable;
- the title's family meaning cannot resolve;
- there is no completed campaign or replay loop;
- balance targets beyond the junior/adult handover cannot be validated as a whole.

Recommendation: make an explicit scope choice. Either market the current build as a junior chapter,
or define the smallest complete v1 ending and make every roadmap decision serve it. Do not continue
adding lateral systems while the campaign remains unfinishable.

## P0: the daughter is a subject in the writing and an object in the mechanics

The pitch says the child is a person, not an asset. Lore says the parent shapes circumstances but
does not decide her life. In play, the parent directly controls training load, entries, withdrawals,
vacations, coaching, equipment, treatment, and whether to push a tired child. The daughter has
deterministic flavor, emotion art, and life tiles, but no strong system of preferences, consent,
resistance, trust, changing goals, or the ability to say no.

This makes the human thesis mostly presentational. The minimum viable agency spine should include:

- motivation and trust as separate state;
- preferences that change with age and experience;
- acceptance/refusal probabilities that the player can understand;
- remembered parental patterns, not isolated dialog choices;
- a few thresholds where the daughter initiates a conversation or decision;
- consequences that affect relationship and choices, not just a temporary stat modifier.

The parent should increasingly move from direct control to influence. That arc is already described
in [decisions.md](../decisions.md); it now needs to become the main system, not a late phase.

## P1: narrative texture is not yet plot

Diary lines, milestones, emotional portraits, weekly recaps, injuries, and offer letters produce
atmosphere. They do not yet form persistent dramatic arcs. There is no sustained rivalry story,
parent-child conflict pattern, evolving self-concept, relationship change, or irreversible character
choice that reorganizes later scenes.

A plot system does not require branching-screenplay machinery. A KISS version can be built from a
small number of stateful threads:

1. ambition versus wellbeing;
2. money versus parental presence;
3. trust versus control;
4. tennis identity versus school/friends/other life;
5. independence at the junior-to-adult handover.

Each thread needs observable signals, escalating beats, a decision, persistent aftermath, and an
epilogue reading. Reuse the existing milestone ledger as evidence; do not create a separate
unconnected story state machine for every event.

## P1: the parent fantasy is currently a budget-manager fantasy

The concept promises work-versus-presence. Current parent income is largely automatic and there is no
job schedule, missed work, parental fatigue, travel attendance choice, family relationship cost, or
decision between being present and paying for the career. Until those exist, “parent simulator”
overstates the implemented loop.

The smallest useful parent economy is not a detailed life sim. It is one weekly availability budget:

- work more: income up, presence/trust opportunities down;
- attend: travel/time cost, direct observation and relationship opportunities up;
- delegate: coach information up, parent connection down;
- recover family time: short-term tennis optimization down, resilience/trust up.

## P1: planned investor mechanics need an ethics redesign

The investor concept in [offers-and-the-inbox](../specs/offers-and-the-inbox.md) is intentionally
predatory and involves a minor's future income. Predatory finance can be legitimate subject matter,
but a system where the parent alone irreversibly sells a child's future while the game refuses to
editorialize contradicts the central “person, not asset” claim.

Before implementation, require:

- the daughter's voice and age-appropriate consent/refusal;
- clear long-term terms and opportunity cost;
- relationship consequences;
- legal/ethical context appropriate to the setting;
- at least one non-exploitative alternative that is earned rather than purchased;
- epilogue consequences that remember the deal.

## P2: onboarding copy creates conceptual contradictions

- “Your kid has real talent” asserts the hidden answer at the beginning
  ([OnboardingWizard.vue](../../src/components/OnboardingWizard.vue#L328)), weakening the premise that
  potential is unknown.
- “Choose Play Style — This shapes strengths and training focus” overpromises. Starting skills ignore
  the profile ([world.ts](../../src/engine/world.ts#L582)); weekly growth applies a global coach-fit
  multiplier rather than style-specific skill emphasis
  ([development.ts](../../src/engine/development.ts#L227)).
- “Working class — hard mode” turns structural disadvantage into a difficulty label
  ([OnboardingWizard.vue](../../src/components/OnboardingWizard.vue#L64)). The mechanic can remain,
  but the framing deserves sensitivity review.
- The country list contains 24 entries while lore promises 36
  ([OnboardingWizard.vue](../../src/components/OnboardingWizard.vue#L48)).
- A code comment still calls birth month cosmetic even though relative-age effects are implemented
  ([OnboardingWizard.vue](../../src/components/OnboardingWizard.vue#L70)).

## Authored heroine: upside and tradeoff

The fixed protagonist is a strength for art direction and coherent writing. It is a tradeoff for
identification, representation, and replay variety. This is acceptable if it is a deliberate authored
story. If the game markets itself as “raise your player,” the limited identity range will feel like a
broken promise. Position it clearly as “guide her career,” or fund the content breadth required by a
true player-created protagonist.

The internal age-band token `milf` should be migrated to a professional domain term such as
`late-career` or `veteran`. Even if never intentionally shown, it is embedded in types, assets, tests,
and documentation and is likely to leak into debugging, modding, URLs, or community discussion.

## Product decision that must be made

The match can be observational cinema or tactical gameplay. Both can work. The current build
pre-resolves outcomes and makes shouts presentation-only, while design notes still imply coaching
intervention. Choose one contract:

- **Observational:** all meaningful agency occurs before/after the match; the presentation must make
  causal attributes, preparation, fatigue, and style legible.
- **Tactical:** a very small number of between-set interventions can change tactics, confidence,
  fatigue, or future relationship state without rerolling outcomes behind the player's back.

Ambiguity is worse than either answer because it makes the hero feature look interactive while
keeping the player powerless.
