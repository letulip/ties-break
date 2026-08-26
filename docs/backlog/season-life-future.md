---
type: backlog
status: current
area: design
canonical: false
last-reviewed: 2026-08-26
---

# Season Life – backlog (owner directives 25.07, captured so nothing is lost)

This file records design intent NOT built in slices A/B/C. Fictional analogues only (ITF/ATP are
trademarks). Player-facing copy uses the short dash "–".

## 1. Coach as a CHOICE, with tiers (next economy slice)
The bench proved 25k + a *permanent* hired coach = 0/30 survival (coach avg ~$475/wk > the $300/wk
middle income). Owner's fix (25.07): the coach is not a continuous background debit but a **player
decision**.
- **Tiers, not a price vilka:** distinct coaches the player CHOOSES – e.g. club coach / academy coach /
  elite tour coach – each with its own cost band AND its own benefit strength (a noisy "promise of
  results"). Selecting the tier is the decision; a random range alone is wrong.
  **CONFIRMED (owner 25.07): the elite tier must be PRICIER than today's hired band ($250–700/wk)** –
  it is the top-end money sink that replaces the corridor-softened flat scaling (wealthy ~1.4 →
  [1.2, 1.3]) and pairs with the wealthy income re-tune (~$700+/wk). Real-world anchor from the
  economics research: elite tour coach $250/day – $3,000/wk. All tier prices × ECONOMY.wealthCorridor.
- **Periodic, not permanent:** hire by the session/block (~once a month or a player-set cadence), not
  every week. Folds with replacing the absurd passive "video session $600-700" with a configurable
  **"detailed review + drills"** lever: the player picks *after which events* to review and *how
  thoroughly* → tangible boost (readiness / morale / next-match), paid only when used.
- **Coach does NOT travel with the family** by default (no travel multiplier); taking them on a trip
  would be a separate, pricier opt-in.
- **Income re-tune couples to this:** with coaching made occasional, wealthy income goes back UP
  (~$700+/wk, from the current $430) so elite coaches are affordable for 120k – restoring the money
  sink at the top. Middle ($300) may still need a modest bump; decide on the bench AFTER the coach
  lever lands (coach is the dominant driver – fix it first, then measure).
- Also revisit the other earned valves here: parent side-work (money↔time), grants, grandma gifts,
  "собрали колхозом", the tennis-club barter (compensates lessons, not cash), school-funded trips for
  8k. And the 8k "too easy?" balance check (100% survival / 90% proxy) – the coach-as-choice gives 8k
  an occasional-coach lever too (both a boost and a money sink).

## 2. Injury / collapse / mental-health realism (owner research 25.07)
Real incidents the owner surfaced as material for dramatic, "price of the dream" events (juniors and
pros: cardiac death, heat-stroke collapse, brain-hemorrhage collapse, repeat faintings, panic attacks
+ suicidal ideation). Use fictional analogues.

⚠⚠ **STATE: partly REJECTED (23.08, the Codex perspective review – convergent with «мы ни за что не
наказываем» and the §3e care rules).** The following shapes from this research are Rejected and are
kept here only as evidence against reopening them by accident: a HIDDEN heart stat capable of an
irreversible or terminal outcome; suicidal-ideation as event flavour or a difficulty beat; chronic
conditions as invisible penalties; any high-cost irreversible outcome from a fully hidden roll.
What survives of the theme: pressure, withdrawal and burnout through humane conversations and
support (the private-life layer), and any chronic condition – if ever – revealed early enough to
plan around, as a managed trade-off. Every deferred row below is read through that ruling.

### Folded into slice C now
- **Body-region injury distribution** (~48% lower-limb, 28% upper, rest core) → injury `kind` is
  region-composed and lower-limb-skewed (see the slice-C spec).
- The rare **severe** band (16-22 wk) already carries the "survivable-but-punishing" catastrophic tail;
  give its news beat dramatic (fictional) flavor.

### Deferred – each needs a system we don't have yet
- **Dual fatigue: Stamina + Thermoregulation.** ⚠ REJECTED as a second gauge (23.08): the adopted
  weather shape is EVENT-LOCAL strain – a forecast before entry (cool/normal/hot, calm/windy,
  indoor/outdoor), heat raising the condition cost or medical-retirement risk, wind taxing
  aggressive-style reliability – absorbed by the EXISTING condition system, with any in-match
  collapse only ever following a visible warning and an explicit decision to continue. The
  real-world numbers stay (heat → +47% medical calls, +41% heat incidents) as calibration targets
  for that shape. The original dual-gauge sketch, for the record: a second heat/hydration gauge
  draining faster in hot tournaments. *Needs* a weather/venue
  model + surfacing on the match viz. Big, evocative; a Phase-6+ system.
- **In-match "Collapse" event.** Thermoregulation → 0 mid-match ⇒ stretchered off (auto-loss + a
  health penalty for N matches). *Needs* match-engine integration (the match currently resolves from
  a seed; a mid-match medical retirement is new).
- **Hidden "Heart" stat.** A latent cardiac/health parameter revealed only by a medical exam, that can
  trigger a rare catastrophic event (cf. Çelikbilek). *Needs* a hidden-stats + medical-screening
  system; ties to the "invest without knowing the return" thesis.
- **Mental health / "Panic attack".** Overtraining + sustained pressure ⇒ a trigger that can lose a
  match even while leading (cf. Ruusuvuori). *Needs* the morale system (Phase 6). Overlaps the existing
  Phase-6 flagship "racket broken in a rage" event.
- **Chronic conditions** (e.g. exercise-induced asthma ~30-40% of pros) as a hidden modifier. Phase-6+.

### Added from the age-stats research (owner 25.07, see docs/research/injury-stats-by-age.md)
What C absorbed now: age curve (girl peak 16), consecutive-play load factor, 60/30/10 severity,
WTA ankle/knee skew, one-time onset treatment costs. Deferred, each with its missing system:
- **Growth spurt event** (12-14: +8-15 cm over 3-6 months → technique −30%, injury risk ×2, then
  post-spurt serve/power bonuses; girl growth peak ~11.5). *Needs the younger-years phase* –
  predates our age-14 start. THE strategic beat of the childhood prologue (Phase 6).
- **Heat / humidity / surface-switch risk multipliers** (×1.3-1.5) → needs a weather/venue model;
  pairs with the deferred Thermoregulation gauge + in-match Collapse.
- **Recurrence risk** (+~30% for 2 weeks after an ankle sprain) → needs a post-recovery decay
  state; derivable from injuryHistory later, cheap follow-up.
- **Injury → sponsor loss** (heavy injury suspends sponsor perks) → needs contract-shaped
  sponsorships (current sponsorship = rank-gated product discounts only).
- **Parent mini-fork events** around load ("she says her knee hurts": skip practice vs push
  through → risk shifts) → the random-events system (Phase 4/6); flagship material alongside the
  broken-racket event.
- **Under-12 acute/household injuries** (falls, face/eye, 41.9% head/face ER share) → random
  events for the younger-years phase, NOT overuse-model injuries.

## 3. Sequencing note
Order agreed with owner 25.07: finish availability first – **slice C (injuries + physio)** – keeping
the coach info recorded here. Then the coach/economy slice (section 1). The deferred items in
section 2 attach to Phase-6 systems (morale, weather, hidden stats, richer match engine).
