---
type: backlog
status: current
area: world
canonical: false
last-reviewed: 2026-08-26
---

# Geography and the country choice – what the map already decides, silently

The owner, 26.08, on being told the country still prices the college bill: «Заведи географию в
бэклог с низким приоритетом пожалуйста.» He had assumed the opposite – «мы вроде пока с географией
особо не заморачивались» – and that assumption is the reason this file exists: **the country choice
is not decoration today, it is two shipped rules, and neither is on any screen.**

⚠ **EVERY ROW HERE IS `Later` BY HIS WORD** («с низким приоритетом»). Nothing in this file is a
defect – both rules are sound and both were built deliberately. What is missing is that the player
is never told, and that the map has no other consequence beyond these two.

## What the country decides today (verified in code 26.08, not recalled)

| Where | Rule | Read it |
| --- | --- | --- |
| The college bill | **The need layer is US-only.** `needShareOf` returns 0 outright for a non-US family, so she pays the sticker with the athletic share alone and no need-based discount. This is the real federal rule (34 CFR 668.33), which `tools/college-price-probe.ts` already prints as «out-of-state sticker, no need layer» | [collegeOffer.ts:701](../../src/engine/collegeOffer.ts) |
| The ladder | **`homeWildCardPlace`** opens a rung she has NOT earned when the event is hosted in her own country – the calendar and the turnstile both ask this one function | [ladder.ts:664](../../src/engine/world/ladder.ts) |

⚠ **ROUND 26 #2 DID NOT REMOVE EITHER.** It deleted the rule that shut a college PLACE by country
(«по-моему в каждой стране есть домашний универ»); the rule that PRICES one is a different function
and still reads `profile.country`. The two were conflated in my own round-26 report and corrected
the same day – see [round-26.md](../rounds/round-26.md) item 14d.

## The rows

| # | What | State | Size | Blocked on |
| --- | --- | --- | --- | --- |
| 1 | **Say it on the onboarding country step.** One line that the country decides college pricing and home-tournament wild cards. The step today names neither, so the most consequential number in the college branch is set by a choice made blind | Later | XS | – |
| 2 | **Decide whether the US-only need layer is the design or an accident of the source.** It is the real American rule, but the game now offers a home university in every country – so a French family at a French university is priced by a US federal statute. Either the need layer follows the PLACE rather than the passport, or the sticker for a home place is derived per country | Later | M | Owner's ruling |
| 3 | **Is there anything else geography should touch?** Travel cost by distance, a home crowd, a season that starts where she lives, visa weeks. All plausible, none specified, and the owner has not asked for any of it. Listed so the theme has a home rather than to argue for it | Later | – | Owner's word |

## What this is NOT

⚠ Not the field's nationality work – the pro contour, the J universes and the name pools live in
[the-living-world.md](the-living-world.md). `hostNationOf` already gives every event a host nation;
this file is about the PLAYER's country, not the field's.
