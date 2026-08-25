---
type: review
status: audit
area: product-backlog
canonical: false
last-reviewed: 2026-08-23
baseline: 13d8f95
---

# Backlog game perspective — care under uncertainty

## Status and scope

This is a read-only product and game-logic review of `main` at `13d8f95` on 23.08.2026. It is an
outside perspective for the owner to compare against the backlog, not an approved roadmap and not a
claim that every cited proposal remains unbuilt. Runtime code and tests remain authoritative.

The review started from the context index, product and narrative context, economy and simulation
context packs, the August roadmap and launch plan, then examined the explicit Season Life backlog and
the future-facing or partially open specifications around psychology, coaching, funding, progression,
weather, health, childhood and late-career play. Where document status was ambiguous, the corresponding
source and tests on `main` were checked.

## Executive judgement

Ties Break already has an unusually strong design discipline: deterministic outcomes, explicit
invariants, measured balance changes, honest ledgers, and a willingness to record when a plausible
idea fails its own test. The product also has a distinctive emotional contract: the game observes one
daughter's full career without grading the parent.

The largest future risk is no longer insufficient realism. It is **system accumulation**.

Condition, injuries, knocks, thermoregulation, form, morale, bond, burnout, chronic conditions,
hidden health, coach insight, coach presence, weather and family pressure can each be justified by
real tennis. If all become independent state, the weekly loop may turn into maintaining a dashboard
of penalties. That would weaken both the parent's story and the game's suitability for relaxed,
positive play.

The recommended direction is:

> **Care under uncertainty, not suffering accurately simulated.**

Honest difficulty can remain. The player should usually understand the pressure, have a meaningful
response, and be able to tell afterwards why the consequence happened. A setback should change the
story or the plan more often than it merely removes time, money or skill.

## What should be protected

### 1. The no-grade career contract

The career contract's strongest line is: *the game never grades you; it tells you what happened and
leaves the judging to you*. It prevents the honest economy from becoming a disguised optimization
score and lets stopping, college, a modest career or a late breakthrough all remain valid stories.

The album, durable milestones and one-tap new-career seam support this well. New psychology or family
systems should enrich the evidence the album can show, not manufacture a final relationship score.

### 2. Fair, explainable match outcomes

The open mathematics and separation of result from presentation are core brand assets. Morale, form,
weather or coach presence should enter through small named terms that can be explained before and
after a match. None should secretly override the odds ring or create narrative rubber-banding.

### 3. Measured refusal

Several recent documents demonstrate the right habit:

- the age-curve sweep says the proposed dial cannot solve the observed problem;
- the coach-eye measurement says ordered radar accuracy did not create a player-visible product;
- the money decomposition says progression surfaces should move before economy constants;
- coach travel arms were rejected or reshaped when the arithmetic did not support them.

This is as valuable as successful feature work. A backlog item should be allowed to end in
**measured and rejected** without being treated as incomplete implementation.

### 4. Warm, restrained tone

The product context already calls for drama from evidence rather than moralized punishment. The game
can be serious without being grim. Birthdays, family time, school, recovery, travel memories,
friendship, an honest grant, a coach finally understanding her, and an ordinary good week are as
important to the emotional rhythm as titles and injuries.

## A gate for every new mechanic

Before implementation, answer all six questions:

1. **What new decision does this create?** If it only changes the probability of an existing bad
   outcome, fold it into the existing system.
2. **What does the player know beforehand?** A large consequence needs a warning, forecast or
   discoverable risk.
3. **What can the player do about it?** There should be prevention, mitigation, adaptation or a
   recovery path.
4. **Is it a distinct mental model?** If it behaves like condition, money or injury, it probably
   belongs inside that system rather than beside it.
5. **Can the player explain the result afterwards?** The recap should name the cause without exposing
   hidden engine internals.
6. **What positive or human beat does it enable?** A system that only creates loss needs a stronger
   product case than realism.

A seventh implementation gate follows from the mobile format: if a mechanic requires a permanent new
meter, persistent card or weekly interruption, it must earn that interface cost separately.

## System-by-system perspective

### Morale, bond and daughter agency — highest-value major addition

This is the most valuable large future system because it completes the product's third pillar. The
first version should be deliberately smaller than a life simulator:

- one slow relationship state, expressed in language rather than a score;
- one shorter-lived emotional state;
- a small set of conversations attached to existing consequential decisions;
- memory of selected choices for diary and album copy;
- daughter preferences that can align or conflict with the parent's plan.

The first useful decisions are already present: training load, pushing through a knock, coach
changes, tournament travel, the fork at nineteen, gifts and retirement. Psychology does not need a
new event generator before it can make those choices feel shared.

Bond should mainly affect what she says, what she is willing to discuss, and how events are
remembered. Making it a direct skill or win-probability bonus would turn the daughter back into an
asset and make affection another resource to farm.

There should be no single optimum parental personality. Firm, cautious, ambitious and supportive
answers can all be coherent when the surrounding evidence supports them. The game should remember a
pattern without announcing a moral verdict.

### Form and slump — promising only as part of psychology

The draft has the correct foundations: form is bounded, symmetric, mean-reverting and smaller than
fatigue. It should be driven by results relative to pre-match expectation, not by raw wins and
losses. Losing to the world number one should not produce the same state change as losing a heavily
favoured match.

Required safeguards:

- no `loss -> bad form -> more losses -> worse form` runaway;
- strong natural mean reversion;
- good form as well as bad form;
- no permanent change to potential or trained skills;
- recovery through existing choices such as rest, a lower-pressure event, practice, conversation or
  later psychologist support;
- qualitative presentation such as *playing freely* or *searching for rhythm*, not a second condition
  number.

Form should ship with the psychology surfaces that give it meaning. Alone it is an invisible match
modifier and another failure source. With psychology it gives conversations, coach observations and
support services a real object.

### Hidden catastrophic health — reject or park indefinitely

The Season Life backlog proposes a hidden heart parameter, rare catastrophic incidents, panic-driven
match loss, suicidal ideation and chronic conditions as hidden modifiers. These are realistic subjects
but poor default game uncertainty.

A fully hidden health roll capable of an irreversible or terminal consequence gives the player no
decision and no useful lesson. It risks turning a daughter into a collection of medical failure
chances. Severe mental-health material also conflicts with an unwind-oriented, warm game when used as
random drama.

Recommended rulings:

- **Do not build** a hidden heart stat that can cause death or an arbitrary terminal career event.
- **Do not use** suicidal ideation as event flavour or a difficulty beat.
- Represent pressure, withdrawal and burnout through humane conversations, reduced willingness,
  rest and professional support.
- If a chronic condition is ever added, reveal it early enough to plan around and make management a
  trade-off rather than a strictly worse character roll.
- No high-cost irreversible outcome from a completely hidden die roll. It must have warning,
  mitigation or a non-terminal result.

### Weather and thermoregulation — keep the decision, remove the extra dashboard

Weather has good game value because it differentiates tournament weeks and makes calendar selection
more situational. A second persistent hydration/thermoregulation gauge is much less valuable and
overlaps condition.

A smaller model would use event-local environmental strain:

- cool / normal / hot;
- calm / windy;
- indoor / outdoor or rain risk.

The forecast appears before entry. Heat increases the condition cost or medical-retirement risk;
wind reduces the reliability of aggressive styles; indoor events avoid rain. The same condition
system absorbs the aftermath.

An in-match collapse should only follow a visible warning and an explicit decision to continue under
risk. A surprise collapse caused by a hidden second gauge is punishment rather than management.

### Growth spurt — good authored prologue material

A growth spurt is memorable, personal and well placed in the accelerated childhood prologue. It
should be an adaptation fork rather than a numeric debuff announcing `technique -30%` and `injury x2`.

For example:

- reduce competition and rebuild movement;
- keep the schedule but accept temporary inconsistency;
- change the training emphasis toward coordination and strength.

The later benefit should be legible enough that the event feels like a transition in her body, not
the game deleting progress. One authored sequence is likely more effective than a continuous height
simulation.

### Federation grant — strong positive mechanic, clarify merit and need

The grant is one of the strongest future ideas. It creates recognition, financial relief and a
season-level story without changing match odds or selling a rung. Its visible ledger line corrects
the problem of support that exists in arithmetic but cannot be planned around.

The proposed rule — merit decides the award, family need decides the amount — is defensible but may
be confusing. It should be expressed as two explicit terms:

- a fixed merit award for every recipient;
- an additional means-tested family-support amount, if used.

This avoids a wealthy winner receiving an unexplained `$0` award and prevents country choice from
quietly becoming a grant difficulty setting.

The player should see the review date, current qualifying position and renewal risk. Losing a grant
can be a story, but losing a large income source without forecast is an ambush. A warning season or
small transition payment would preserve planning without guaranteeing support forever.

The grant should buy runway, not guaranteed survival. Its best outcome is another meaningful season
in which the parent must decide what to fund.

### Coaches — consolidate the product before adding more channels

Coaching now spans price tiers, development, facilities, physio, load management, radar accuracy,
schedule advice, travel, opponent preparation and in-match composure. Each layer has a rationale;
together they risk becoming a second management game.

Two current findings should govern the next step:

1. the eye experiment produced better information but no meaningful career product at the measured
   scale;
2. the training proposal says the pen remains with the player, but then lets a coach silently move a
   training tick and reports it afterwards.

The second is a real agency contradiction. A coach can reduce attention without secretly rewriting a
plan. Better interaction models are:

- **Advisory:** proposes a change; one tap accepts it.
- **Trusted:** may make bounded changes and reports them with immediate undo.
- **Hands-on parent:** never changes the plan automatically.

The market also needs fewer, clearer promises. Consider distinct coach identities or strengths —
development, health/load, matchcraft — rather than relying only on five linear quality rungs. If two
adjacent tiers cannot pass a player-visible effect threshold, collapse them or change their product;
do not preserve them merely because the real market has price tiers.

The elite rung should not be sold to a fourteen-year-old when the simulation already knows it is an
unsurvivable purchase for nearly every family. Gating it to the professional career is player
protection and legibility, not artificial balance.

### Economy after the breakthrough — add ambitions, not harsher bills

The measured economy says money often stops binding near the fork and can be free for most of a
career, while unaffordable coach combinations create dead careers rather than interesting decisions.
Increasing prices would deepen both problems.

Late-career wealth should buy optional direction rather than raw winning power:

- bringing the coach or leaving them home;
- better recovery and schedule flexibility;
- a stable training base;
- allowing the parent to reduce paid work and travel more;
- supporting family or beginning a post-career project;
- convenience and reduced variance rather than guaranteed results.

These create lifestyle and story choices while preserving honest matches. The first economy work
should still be truthful progression surfaces: explain the three ranking currencies, show the
professional standing at the fork, and warn when winning more on a lower ladder is no longer progress.

### Acceptance tails and wild cards — preserve planning and close the open measurement

Soft acceptance tails model real entry lists better than hard cliffs, but they also make a carefully
planned calendar partly stochastic. Player experience should decide this, as the deferred spec says.
If tested, show a clear chance or wait-list state rather than presenting the event as simply open.

Wild cards require a nearer-term decision. On the measured branch, eight Slam wild cards nearly
doubled the number of careers ever playing a major (34 to 66 of 108) and raised first-match losses by
11.7 percentage points. The leading explanation — fuller calendars causing worse condition at arrival
— remains unmeasured, and the document itself asks for an owner ruling.

Before more simulation depth is added:

1. add the missing fatigue/condition-at-arrival column;
2. distinguish the direct effect of the wild-card entry from the schedule it induces;
3. decide whether a home-Slam story should nearly double major participation;
4. tune the window or slot count only after that decision.

Reaching a major is one of the career's largest emotional moments. Its rarity should be an authored
product decision, not a side effect of an entry-list implementation.

## Positive emotional cadence

An unwind-oriented game does not require easy outcomes. It requires that a session is not composed
only of threat management.

Each season should reliably offer several kinds of reward independent of winning a title:

- **Connection:** a birthday, family day, conversation, friendship or travel memory.
- **Competence:** the player correctly reads a risk, chooses an appropriate rung, or recovers a bad
  schedule.
- **Progress:** a visible skill change, ranking threshold, first entry, first cheque or new option.
- **Relief:** recovery, support arriving, debt easing, school ending, or a difficult decision passing.
- **Surprise:** a wild card, grant, kind diary beat or unusual opponent — positive variance as well as
  negative variance.

A useful playtest question is not only *did the career survive?* but *how many real sessions ended on
something the player was pleased to see?* Track that qualitatively before inventing a happiness meter.

Setbacks should often open a different plan:

- injury -> rehabilitation choice and a different calendar;
- lost grant -> reduce support, change coach, or choose nearer events;
- bad form -> lower-pressure event, practice block or conversation;
- college -> slower clock and different memories;
- plateau -> continue for another reason or stop without shame.

Dead weeks with no meaningful choice are the least interesting form of realism.

## Documentation and backlog findings

The repository's evidence is thoughtful, but the documents no longer provide a reliable view of what
is actually upcoming:

- `docs/backlog/season-life-future.md` still presents coach choice and travel as future even though
  substantial coach market, retainer and travel work exists on `main`.
- the August roadmap and launch plan remain `status: current` while many planned phases have shipped
  or changed shape;
- the product context still says a complete ending and epilogue are absent, while `main` contains
  ending latching and the album builder;
- draft specs can contain shipped implementation, rejected experiments and genuinely open design in
  the same file;
- a document called an upcoming spec may really be a measurement record whose correct outcome was
  “do not build”.

This does not weaken the evidence, but it makes retrieval expensive and increases the chance that an
old premise is treated as current intent.

Create one small canonical backlog with five states:

| state | meaning |
| --- | --- |
| **Now** | approved, dependencies satisfied, next implementation wave |
| **Next** | approved direction, waiting on the named dependency or measurement |
| **Later** | plausible product work, deliberately unscheduled |
| **Parked** | incomplete design or insufficient player value; no implementation implied |
| **Rejected** | measured or ruled out, retained only as evidence against reopening it accidentally |

Each active row should contain only:

- the player-facing problem;
- the new decision or emotional payoff;
- dependencies;
- the next evidence or owner ruling required;
- links to detailed research/specification;
- shipped/open status.

Research, decision, implementation record and backlog state should remain separate concepts. A long
spec may preserve all reasoning, while the canonical backlog says only whether there is still work.

## Recommended order

### 0. Backlog and measurement hygiene

- Create the canonical five-state backlog.
- Mark stale roadmap/context claims or refresh their current-truth sections.
- Close the wild-card fatigue-at-arrival measurement and owner ruling.
- Treat measured rejection as a completed result.

### 1. Truthful progression surfaces

- Render the professional ranking and its currency in ranking help.
- Show professional standing and the consequence of zero professional results at the fork.
- Warn when repeated lower-ladder success no longer advances the professional career.
- Do not tune money or growth until the player can see the existing model.

### 2. Psychology-lite and daughter voice

- One relationship state, one emotional state.
- Preferences and conversations on existing decisions.
- Birthday and previous-choice memory read by diary/album.
- No direct “good parent” score and no broad random-event engine.

### 3. Federation support

- Complete the national denominator first.
- Separate merit award from any needs top-up in presentation.
- Forecast review and renewal.
- Measure runway gained without deleting insolvency.

### 4. Coach consolidation

- Decide the few promises each tier or identity sells.
- Replace silent plan edits with advisory/trusted/hands-on behavior.
- Gate known-unsurvivable purchases.
- Build no eye layer until the underlying aim produces a noticeable, honest outcome.

### 5. Form as psychology's match-facing half

- Expectation-relative, bounded and symmetric.
- Strong recovery and mean reversion.
- Qualitative surface, smaller than fatigue.

### 6. Lightweight environment

- Forecasted event-local weather effects using existing condition.
- No persistent second body gauge in the first version.
- No untelegraphed collapse.

### 7. Childhood prologue

- A few authored choices, including the growth-spurt adaptation.
- Choices establish history and tendencies without permanently deciding the career.

### Park indefinitely

- hidden catastrophic heart state;
- suicidal-ideation event content;
- chronic conditions as invisible penalties;
- a separate thermoregulation management dashboard;
- coach sub-systems that fail a player-visible product test;
- additional difficulty constants before current rules are explained.

## Owner decisions that would unlock the most work

1. Is the intended emotional center **brutal survival** or **warm care under honest pressure**? The
   recommendation is the latter; the economy can remain severe inside it.
2. Should a coach ever alter the player's plan automatically, or only advise unless explicitly
   trusted?
3. Should merit grants pay everyone the same award with a separate needs top-up, or intentionally
   vary the award itself by family background?
4. Is nearly doubling the share of careers that reach a Slam an acceptable wild-card outcome?
5. Is psychology allowed to alter match probability directly, or should most of its consequences
   operate through choices, availability and narrative?
6. Are severe mental-health and catastrophic-health incidents part of the desired tone at all?

## Bottom line

The game does not need to simulate every force that can end a tennis career. It needs to make the
forces it chooses understandable, consequential and human.

The strongest next work is not another hidden realism layer. It is daughter agency, truthful
progression information, support the player can plan around, and a clearer coach product. Those make
the existing simulation feel deeper because they improve the meaning of its decisions. Weather,
form and the childhood prologue can follow in compact forms. Catastrophic hidden health and stacked
meters should stay out unless a later prototype demonstrates a unique decision and a tonal fit.

That path keeps Ties Break solid and detailed without losing the thing the owner explicitly wants:
a game first, and a place a player can return to for positive emotion.
