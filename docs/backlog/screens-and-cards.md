---
type: plan
status: draft
area: ui
canonical: false
last-reviewed: 2026-08-26
---

# Screens and cards the owner has asked for and nobody has built

Every row here is an owner ask with a round-ledger source. None is blocked by another layer – these
are buildable UI waves waiting their turn.

**Avatar wiring (round 8 R8-3) left this file on 24.08, both halves closed.** The header's round
icon showing only `norm` is the owner's own ruling of 27.07 («верхняя круглая аватарка в хедере
вообще не должна меняться эмоционально»), given a path an emotion cannot travel in
`src/composables/headerAvatar.ts` and pinned by `tests/round11-followups.test.ts` (F45-1); the Home
surface DOES read her current state, through `src/composables/kidEmotion.ts` over the engine's
`snapshot.diary.facts` (R9-13/15, then Diary-1's D2 painting). All five portrait bands × seven
emotions are cut under `public/avatars/`. The only thing that was ever downstream of it – the
portrait ART ORDER for the older ages – lives once, in
[college-the-remainder.md](college-the-remainder.md) #4.

| # | what | where it is specified | blocked by | size | state |
| --- | --- | --- | --- | --- | --- |
| 1 | **The in-tournament player card** (round 8 #1) – between matches of one tournament, show her card. **The oldest open item in the folder** – untouched since 25.07, re-verified in the 13.08 audit and again for this file (no card in `TournamentFlow.vue`). | [round-8.md](../rounds/round-8.md) R8-1; [rounds/README.md](../rounds/README.md) round-8 row | nothing | M | Next |
| 2 | **The Team card** (round 3) – coach and body staff as one surface. The 2026-07 reason («коуча/физио ещё нет в движке») is recorded as false since 09.08: the coach is a named roster with a market, and the masseur arrived 22.08 with a card of his own. What is missing is the TEAM view. | [round-3-qa.md](../rounds/round-3-qa.md), the Kid-tab/Team-card box | nothing – and the third seat (the psychologist) would land on it later | M | Next |
| 3 | **The Moments gallery** (round 3) – posts for significant events, the archive of cleaned-out News. The feed (`world.events` + `keep` flags) already holds the material; the ending album proves the presentation idiom. | [round-3-qa.md](../rounds/round-3-qa.md), the Gallery box | nothing | M | Next |
| 4 | **The remaining-events counter on the W cards** (round 15 #3) – the Season HEADER's supply line exists; the per-card number does not, and the events stop appearing with no sentence why. Re-verified: the card template still carries no count. | [round-15.md](../rounds/round-15.md) #3 | nothing | S | Next |
| 5 | **Per-day calendar detail screens** (round 7) – deferred in July «until per-day training controls exist». ⚠ They exist since 10.08 (the dials wave), so the stated blocker is gone; what it needs now is a re-ask – is this still wanted with the dials screen in place? | [round-7.md](../rounds/round-7.md), the deferred box; [training-dials.md](../specs/training-dials.md) §9 | owner's word (the blocker expired) | M | Next |
| 6 | **Rivals in commentary** (round 17 #22) – priced 12.08: `world.events` already keeps ~265 of her matches; the work is surfacing rival names in the commentary pools. `[>]` awaiting his word since. | [round-17.md](../rounds/round-17.md) #22 | owner's word (it was priced, never approved) | M | Next |
| 7 | **The calendar shows no PAST matches at all** – round 26 #6/#7, found while fixing the college league's feed. The league's matches turned out to be recorded but outside the news window; the deeper finding is that the calendar carries no played match of any kind, tour ones included, so a career's own history is unreadable anywhere but the feed's tail | [round-26.md](../rounds/round-26.md) #6/#7 | – | M | Later |
| – | Truthful progression surfaces – the three ranking currencies explained, the professional standing AT the fork, the «lower-ladder wins stop advancing» warning (engine `outgrown` exists, the words do not) | Codex perspective §Economy + `docs/review-codex/12-…response` | nothing – S/M | – | **Next** |
| ~~`CollegeYearCard` calls a NEGATIVE `fundsDeltaCents` «Banked»~~ – **SHIPPED 24.08**: two labels by the sign (the owner's ruling), the amount unsigned because the word carries it | `CollegeYearCard.vue:338` | – | **done** |
