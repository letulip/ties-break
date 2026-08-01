# Mechanics, progression, economy, and balance review

## Core loop as implemented

The working loop is coherent:

1. inspect condition, family money, rankings, and the coming calendar;
2. select training load, coach support, events, practice, and recovery spending;
3. advance one week;
4. observe costs, development, injury/condition, results, diary, and ranking movement;
5. watch or skip resolved matches;
6. repeat through season boundaries and higher tiers.

The systems talk to one another. This is the project's main mechanical strength.

## Strong systems

### Deterministic fairness

Purpose-scoped RNG and invariance tests are exceptional. Player choices affect modeled outcomes
without secretly perturbing unrelated random streams. This makes save/replay behavior explainable and
supports the brand promise against rubber-banding.

### Tournament ladder

Eligibility, overlapping tier bands, closing dates, one body per week, junior caps, surface seasons,
travel, three ranking tracks, adult rungs, and prize tables create a credible progression structure
([calendar.ts](../../src/engine/season/calendar.ts),
[tournament.ts](../../src/engine/season/tournament.ts)). The adult first-round token prize is a
particularly good expression of the economic cliff.

### Development and uncertainty

Skills grow from age, headroom, potential, training, coach quality/fit, match exposure, and decline
rather than a flat XP bar ([development.ts](../../src/engine/development.ts#L221)). The radar turns
uncertainty into a system, and the confidence band is an honest claim rather than decorative fog.

### Availability

Condition, load, injury, recovery, physio, vacations, and medical blocking form a meaningful risk
system. The distinction between a warning (“you may push”) and a medical floor (“you may not”) is
clear and respects player agency.

### Economy

Family background, income, coach pricing, travel, entries, equipment, academy aid, offers, and prize
money share a real ledger. Money is connected to calendar decisions rather than being a detached
resource. Income and spending are presented in real currency and mostly preserve the same arithmetic
between engine and UI.

### Match model

The scoring engine uses five player attributes, surface/style modifiers, serve dynamics, momentum,
and a closed-form/calibrated probability model. The visualization is decoupled from the result, which
protects deterministic truth while allowing presentation iteration.

## P0: pacing cannot support the stated career length

The roadmap describes roughly 880 detailed weeks, yet the shipped primary action advances a single
week and the four-week shortcut was removed from the player UI
([App.vue](../../src/App.vue#L799)). Weekly story surfaces can also open automatically. Even if an
average week took only 30 seconds, 880 transitions consume more than seven hours before planning,
reading, tournaments, matches, settings, or decisions.

This is an inference that needs playtest measurement, but the arithmetic is strong enough to treat as
a design blocker.

Recommended compression layers:

- one-week advance for weeks with a decision or consequence;
- four-week advance with automatic stops, already present in the protocol;
- “run until next decision/event” for quiet periods;
- recap aggregation so four quiet weeks become one honest summary;
- season-plan presets that can be overridden rather than repeated;
- faster adult cadence as direct parental control declines.

Do not use the raw `tick(52)` dev command as compression. It bypasses the safeguards that make time
legible and safe.

## P1: play style is more label than build

Starting skills deliberately ignore `PlayerProfile`
([world.ts](../../src/engine/world.ts#L585)). Growth applies the same rate across every skill and uses
play style only through overall coach fit ([development.ts](../../src/engine/development.ts#L250)).
Style becomes most visible in surface/match modifiers.

Either:

- change onboarding to “Choose an on-court tendency,” or
- apply a zero-sum development weighting/starting tendency so style creates an identifiable build
  without changing total talent.

The zero-sum requirement matters: otherwise the choice becomes a hidden difficulty selector.

## P1: match attributes are mathematically real but only partly visible

Serve speed and ace behavior read clearly. Groundstrokes, stamina, return, and composure are less
legible in rally presentation, which is driven mostly by generic length/surface patterns
([rally.ts](../../src/engine/match/rally.ts)). A player can therefore experience fair math as opaque
math.

Keep results fixed, but let presentation reveal causes:

- stamina changes late-match movement/recovery animation and commentary;
- composure changes pressure-point body language/commentary frequency;
- return changes receiver position and quality of first reply;
- groundstrokes change depth/pace patterns and winner/error descriptions;
- surface/style matchup appears in a short pre-match “why” card and post-match evidence.

## P1: balance targets are prose rather than a release contract

[Career outcome targets](../specs/career-outcome-targets.md) correctly separate conditional reach
from all-start reach, but explicitly say the targets are not asserted. Existing specs also record
working-class survival near 37% in one benchmark against a stated 60-80% overall target, and describe
strategies where cheap self-coaching may avoid the intended tradeoff.

The simulation suite is valuable but should publish a versioned outcome matrix:

- background x coaching strategy x load policy;
- survival to 18/19;
- reach of adult tiers;
- week of first tennis-positive cash flow;
- injury frequency and missed weeks;
- rank/outcome distribution;
- player-decision/quitting distribution once agency exists.

Use ranges and trend deltas, not one brittle exact seed total. Store the summarized artifact with the
build so design changes are reviewed against the previous model.

## P1: automatic academy support removes a flagship choice

Automatic academy assistance fixes a balance hole but skips an obvious family drama: relocation,
school, control, sponsor obligations, and separation from the parent. Turn the annual academy review
into an offer with meaningful accept/decline consequences. Reuse the inbox contract model rather than
building a separate dialog system.

## P1: the uncertainty system may hide too much progress

Hidden potential is thematically sound. Hidden current progress is more dangerous. The radar should
keep ceiling uncertainty while giving the player evidence about current development:

- estimated current band;
- coach confidence;
- qualitative recent movement;
- the training/match evidence supporting the read;
- explicit explanation when a new coach widens uncertainty.

Fairness is a perception problem as well as a mathematical one.

## P2: one known recovery inconsistency is protected by a regression test

The code notes that skipping an event underpays recovery after the base recovery rule changed
([world.ts](../../src/engine/world.ts#L4163)); the skip path adds only the bonus, while medical
withdrawal adds the base difference. A test pins the current behavior rather than the domain
invariant ([round9.test.ts](../../tests/round9.test.ts#L499)).

Create one `creditNonPlayingRecovery` rule and make every no-match exit use it. Tests should protect
“equivalent non-playing weeks recover equivalently,” not a known accident.

## P2: family-background scaling can feel like hidden rubber-banding

Charging wealthy families more for contextually different services can be realistic. Charging more
for apparently equivalent services without explanation feels like the game is reading the wallet and
moving prices. Every scaled price needs visible context: travel class, coach market, accommodation,
insurance, or chosen service tier. Prize money correctly remains unscaled.

## P2: adult economy has no complete long-horizon counterweight

Parent income grows while the promised parent-job/time system is absent. This may distort long adult
careers, especially before retirement/independence systems exist. Treat this as a hypothesis and add
20+ year bench arms before tuning. Avoid compensating with arbitrary expense inflation; model the
parent's changing availability and the athlete's increasing independence instead.

## Mechanical KISS recommendations

- Prefer a few shared currencies with many consequences: condition, money, trust, motivation,
  availability. Avoid one meter per story line.
- Keep decisions at choke points: season plan, academy offer, injury response, age-19 handover,
  sponsor/investor contract.
- Let quiet weeks be quiet and compressible.
- Reuse the existing offer, milestone, finance, and stop-reason infrastructure for new content.
- Preserve result determinism. Add causal explanation and agency around the match rather than hidden
  rerolls inside it.
