---
type: context-pack
status: current
area: narrative
canonical: true
last-reviewed: 2026-08-19
---

# Product and narrative context

## Current truth

- The distinctive premise is the parent's view of a daughter's tennis career: uncertain talent,
  honest economics, observable matches, and the cost of pursuing the dream.
- Shipped mechanics strongly cover matches, rankings, calendar choices, money, training/condition,
  injuries, coaches, sponsors, diary texture, and tournament presentation.
- Career forks, college years and ending/epilogue views are in runtime. A general
  morale/bond/burnout system is not; documents describing it remain product intent.
- Family prose uses a derived narrative stage. From 22 onward the parent hears about ordinary life
  through calls, messages and visits rather than automatically sharing the household. This is a
  voice rule, not a persisted residence mechanic.
- The Russian concept document is the original pitch reference. The lore bible is a dated art and
  tone reference and must be checked against current code before asserting implementation.
- The current delivery sequence is the August roadmap; reviews explain risks but do not define the
  shipped feature set.

## Read order

1. `README.md` and `docs/concept-ru.md` for the proposition, with the caveat above.
2. `docs/lore/setting.md` for tone and art constraints.
3. `docs/decisions.md` for explicit owner decisions, newest applicable decision first.
4. `docs/design/human-voice-guide.md` for the current speaker and age-distance rules.
5. The relevant current code: diary, kid life, milestones, knocks, sponsors, screens, and protocol.
6. Product/narrative review chapters only when examining gaps or rationale.

## Invariants

- Do not present planned morale, bonds, or broader daughter agency as shipped functionality.
- The parent shapes circumstances; narrative copy should not reduce the daughter to a stat asset.
- Drama should emerge from mechanics and evidence rather than moralized punishment or false odds.
- Player-facing claims about price, ranking, probability, or eligibility must match engine data.
- The tone is warm, restrained, contemporary, and unglamorous; avoid triumphal sports-poster copy
  for ordinary junior moments.

## Focused verification

- Diary and weekly story: matching diary, event, week-note, and week-scene tests.
- New persistent narrative state: migration and golden-save tests as well as feature tests.
- Player-facing mechanical claims: verify the engine source and add a regression test at the
  boundary that renders the claim.

## Broaden context when

- Work changes the pitch, child agency, a terminal state, long-term memory, ethical framing, or
  investor-facing claims.
