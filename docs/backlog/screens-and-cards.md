---
type: plan
status: draft
area: ui
canonical: false
last-reviewed: 2026-08-27
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
| 7 | **The college championship is missing from the Season tab, and `friendly` is why – ⚙ RE-DIAGNOSED 26.08 on his ruling «мы используем весь этот флоу и функционал, не надо ничего выдумывать».** He is right that nothing needs inventing: the bottom bar IS shown during college (`<nav class="tab-bar">` carries no guard – only the week pill is hidden), the year pauses ON the championship week since round 26 #6/#7, and the tour's own bracket card reads `snapshot.events` at the current week. But the league's match rows are written `friendly: true` – deliberately, so the radar, the avatar's emotion and the Weekly Story do not read them as form – and `SeasonScreen`'s bracket selects on `!e.friendly`, while its summary looks for `type === 'tournament'` where the league writes a `milestone`. **Both halves of the card miss it.** ⚠ One flag carrying two meanings («not evidence about her form» and «not part of a tournament»), which is this repo's most-repeated defect class. The fix is to select on what a tournament row IS, not on what it is not | [round-26.md](../rounds/round-26.md) #6/#7, `SeasonScreen.vue` `thisWeekMatches`/`thisWeekSummary` | – | S | **Next** |
| ~~8~~ | **Her cut moves off the Budget plaque and onto the week recap** (his, 27.08: «вместо вот этой некрасивой и большой плашки на вкладке бюджет… на плашке Finances на week recap после турниров можно писать что-то вроде Income / Spent / Her cut 10% / Balance»). The recap tile ALREADY has that exact shape – `WeekRecapCard.vue:463`, Income and Spent over a hairline with Balance under it – so his line is one row in an existing card. ⚠⚠ **BUT THE ARITHMETIC HE WROTE DOUBLE-COUNTS, and it is worth knowing why before anyone builds it**: `world.ts:592` credits the family `familyShare = prize − herShare`, and the ledger row is deliberately «what the family actually banked» (the academy travel-subsidy precedent). So `Income` on that tile is ALREADY NET, and subtracting her cut again would show a balance the till never had. Two honest layouts instead: **(A) gross-first** – `Prize $10,000 / Her cut 10% −$1,000 / Income $9,000 / Spent −$3,400 / Balance $5,600`, which is what he actually wants to see and needs the gross carried to the snapshot (it is not there today, and reconstructing it by dividing back risks the penny the split's own comment forbids); or **(B)** keep Income net and put her cut BELOW the balance as a memo – cheaper, and it says «this also happened» rather than «this was deducted». ⭐ The Budget plaque is not deleted, only demoted – his own «эту плашку можно оставить, но переместить вниз, она не главная» ⭐⭐ **SHIPPED 27.08 AS (B), HIS OWN CHOICE** («(B) мемо под балансом - вот это хорошо, да»): a memo under the balance on the Finances tile – `Her cut 10% $1,000` over `Into her own account – the income above is what the family kept.` – and **nothing above it moved**, which `tests/component/week-recap-kid-share.test.ts` proves by mounting the same week twice, with the memo and without it. ⚠ THE DATA ROUTE IS NOT THE OBVIOUS ONE: the figure rides the DURABLE ledger (`FinanceWeek.kidShare`, a sibling of `byCategory` that neither fold can see), not the `WorldEvent` that `entryRef`'s widening precedent would suggest – because this tile was moved OFF the count-capped feed on 05.08 and «"the money for one week" is a question a count-capped feed must never be asked». Optional field, so no schema move (v63 stands; `entryRef`'s own reasoning, commit 2763caa). The plaque is section 9 of `MoneyScreen.vue` now, at the foot of the screen and still outside every tab guard; one directional word followed it («the prize rows BELOW» → above), because from the foot of the page the old one pointed the wrong way. Engine half: `tests/kid-share-memo.test.ts` | `WeekRecapCard.vue:463`, `MoneyScreen.vue:966`, `world.ts:575-600` | – (A) was not built: it needs the gross prize, and he chose (B) | S–M | **done** |
| – | Truthful progression surfaces – the three ranking currencies explained, the professional standing AT the fork, the «lower-ladder wins stop advancing» warning (engine `outgrown` exists, the words do not) | Codex perspective §Economy + `docs/review-codex/12-…response` | nothing – S/M | – | **Next** |
| ~~`CollegeYearCard` calls a NEGATIVE `fundsDeltaCents` «Banked»~~ – **SHIPPED 24.08**: two labels by the sign (the owner's ruling), the amount unsigned because the word carries it | `CollegeYearCard.vue:338` | – | **done** |

## The album's second half – what the shelf puts in it (owner, 29.08)

⭐⭐ **The album is NOT unbuilt.** `docs/specs/endings-and-the-album.md` §7 shipped it on **04.08**:
seven polaroids paged one at a time, each carrying the photograph, a handwritten caption on the
polaroid's lip, one hard fact off the milestone, and – always, even on an empty page – why that week
is in the album, with the full milestone scroll underneath. `EndingScreen.vue` renders it. ⚠ **I
nearly filed «design a photo album concept» as new work; it would have been a duplicate.**

**What he actually asked for is a different thing, and it is real.** His words, 29.08: «Арты для всех
вещей и стадий академии я тоже добавлю, **как раз можно будет фотоальбом собрать**» – so in his head
the album fills up with what the family BOUGHT. The shipped album fills with career milestones: all
seven slots are tennis and family, **not one is property**.

| # | what | where it is specified | blocked by | size | state |
| --- | --- | --- | --- | --- | --- |
| A1 | **The shelf can put a page in the album.** A delivered yacht, the parents' plane, each academy stage – each is a week the family will remember, and each is about to have art he is drawing himself. ⚠ The slot rules are §9.2's and the seven slots are FULL, so this is a design question before it is a build: does the album grow past seven, does property share a slot, or does it become a second chapter after the milestone pages? **That choice is his and nothing should be built before it.** ⭐ The epilogue naming the academy (round 29 part-two #10) is the first instance of exactly this and ships ahead of it | [endings-and-the-album.md](../specs/endings-and-the-album.md) §7, §9.2; [the-shop-2026-08.md](../specs/the-shop-2026-08.md) §10.4 | his ruling on the slot question; his art | M | **Next – he raised it 29.08** |
