---
type: plan
status: draft
area: ui
canonical: false
last-reviewed: 2026-08-22
---

# Screens and cards the owner has asked for and nobody has built

Every row here is an owner ask with a round-ledger source. None is blocked by another layer – these
are buildable UI waves waiting their turn.

| # | what | where it is specified | blocked by | size |
| --- | --- | --- | --- | --- |
| 1 | **The in-tournament player card** (round 8 #1) – between matches of one tournament, show her card. **The oldest open item in the folder** – untouched since 25.07, re-verified in the 13.08 audit and again for this file (no card in `TournamentFlow.vue`). | [round-8.md](../rounds/round-8.md) R8-1; [rounds/README.md](../rounds/README.md) round-8 row | nothing | M |
| 2 | **The Team card** (round 3) – coach and body staff as one surface. The 2026-07 reason («коуча/физио ещё нет в движке») is recorded as false since 09.08: the coach is a named roster with a market, and the masseur arrived 22.08 with a card of his own. What is missing is the TEAM view. | [round-3-qa.md](../rounds/round-3-qa.md), the Kid-tab/Team-card box | nothing – and the third seat (the psychologist) would land on it later | M |
| 3 | **The Moments gallery** (round 3) – posts for significant events, the archive of cleaned-out News. The feed (`world.events` + `keep` flags) already holds the material; the ending album proves the presentation idiom. | [round-3-qa.md](../rounds/round-3-qa.md), the Gallery box | nothing | M |
| 4 | **The remaining-events counter on the W cards** (round 15 #3) – the Season HEADER's supply line exists; the per-card number does not, and the events stop appearing with no sentence why. Re-verified: the card template still carries no count. | [round-15.md](../rounds/round-15.md) #3 | nothing | S |
| 5 | **Per-day calendar detail screens** (round 7) – deferred in July «until per-day training controls exist». ⚠ They exist since 10.08 (the dials wave), so the stated blocker is gone; what it needs now is a re-ask – is this still wanted with the dials screen in place? | [round-7.md](../rounds/round-7.md), the deferred box; [training-dials.md](../specs/training-dials.md) §9 | owner's word (the blocker expired) | M |
| 6 | **Avatar wiring** (round 8 R8-3) – the round icon only ever shows the `norm` variant. Part-answered by the age-band portrait work; the box is still open and overlaps the portrait ART ORDER in [college-the-remainder.md](college-the-remainder.md) #4. | [round-8.md](../rounds/round-8.md) R8-3 | the art order for the older ages | S |
| 7 | **Rivals in commentary** (round 17 #22) – priced 12.08: `world.events` already keeps ~265 of her matches; the work is surfacing rival names in the commentary pools. `[>]` awaiting his word since. | [round-17.md](../rounds/round-17.md) #22 | owner's word (it was priced, never approved) | M |
| Truthful progression surfaces – the three ranking currencies explained, the professional standing AT the fork, the «lower-ladder wins stop advancing» warning (engine `outgrown` exists, the words do not) | Codex perspective §Economy + `docs/review-codex/12-…response` | nothing – S/M | **Next** |
