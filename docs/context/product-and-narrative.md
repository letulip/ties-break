---
type: context-pack
status: current
area: narrative
canonical: true
last-reviewed: 2026-08-19
---

# Product and narrative context

## Current truth

- The premise is the parent's view of a daughter's tennis career: uncertain talent, honest
  economics, observable matches, the cost of the dream.
- Shipped mechanics cover matches, rankings, calendar choices, money, training/condition, injuries,
  coaches, sponsors, diary texture and tournaments.
- Endings SHIP: six terminal states, the epilogue view in `world/endings.ts` and `EndingScreen.vue`,
  and college as a live second act. Never describe any of this as planned.
- Morale, the parent-child bond, burnout and quitting are NOT in the runtime (`conduct` is a
  reserved field). Documents describing psyche are product intent, not shipped behavior.
- The Russian concept doc is the original pitch; the lore bible is a dated art/tone reference –
  check both against code before asserting implementation.
- Delivery ordering is [now / next / later](../now-next-later.md) and nothing else. The August
  roadmap and launch plan are `superseded` – they schedule schema v35–v39 against a runtime long past
  it – so take neither ordering nor state from them. Reviews explain risks; they do not define the
  shipped set.
- Family prose uses a DERIVED narrative stage, not a residence fact. From 22 the parent hears about
  ordinary life through calls, messages and visits rather than sharing the household – so a late
  career never observes her homework or her bedroom. Voice only: nothing persisted, no move event.

## Read order

1. `README.md` and `docs/concept-ru.md` for the proposition (caveat above).
2. `docs/lore/setting.md` for tone and art constraints.
3. `docs/decisions.md` for owner decisions, newest applicable first.
4. `docs/design/human-voice-guide.md` for the speaker and age-distance rules.
5. Current code: diary, kid life, milestones, knocks, sponsors, screens, protocol.
6. Review chapters only when examining gaps or rationale.

## Invariants

- Never present planned daughter agency or psyche as shipped.
- The parent shapes circumstances; copy should not reduce the daughter to a stat asset.
- Drama emerges from mechanics and evidence, not moralized punishment or false odds.
- Player-facing claims about price, ranking, probability or eligibility must match engine data.
- The tone is warm, restrained, contemporary and unglamorous; no triumphal sports-poster copy for
  ordinary junior moments.

## Focused verification

- Diary and weekly story: diary, event, week-note and week-scene tests.
- New persistent narrative state: migration and golden-save tests plus feature tests.
- Player-facing claims: verify engine source, then pin a test at the rendering boundary.

## Broaden context when

- Work changes the pitch, child agency, a terminal state, long-term memory, ethical framing or
  investor-facing claims.
