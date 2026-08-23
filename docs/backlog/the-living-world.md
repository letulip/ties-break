---
type: plan
status: draft
area: world
canonical: false
last-reviewed: 2026-08-22
---

# The living world – what the field still owes

The population work shipped in stages (300 field pros 01.08, canonical brackets 04.08, 1,600 pros
and the 128-draw Slam 14.08). The specs' own «phase 2» lists are what remains. Sources:
[living-field.md](../specs/living-field.md) §8.3–§8.4,
[population-1600-2026-08.md](../specs/population-1600-2026-08.md), and the slam block's comment in
[calendar.ts](../../src/engine/season/calendar.ts) (search «fp-safe»).

| # | what | where it is specified | blocked by | size |
| --- | --- | --- | --- | --- |
| 1 | **The pro contour – aging, turnover and results that MOVE.** Today the field re-deals per season, and a field pro's canonical results change nothing: «she cannot climb by winning a W100, cannot fall out by losing her opener, and banks no fatigue» – §8.4 chose that shape deliberately and says a pro ranking that moves «should arrive WITH aging and retirement, not ahead of them». Careers, peaks, retirements, the graduating junior joining the field. ⚠ The old slam-block note called this «fp-safe result rows, its own wave»; §8.4 landed the brackets WITHOUT them – what remains is this contour, not the brackets. | [living-field.md](../specs/living-field.md) §8.3 (aging bullet), §8.4 (the two alternatives not taken) | its own wave; likely a schema move | **L** |
| 2 | **Field-pro fatigue** – phase-W pros enter every event fresh; a named, conservative simplification. A derived seasonal schedule would let a tired pro sit out. | [living-field.md](../specs/living-field.md) §8.1 (the named simplification), §8.3 | nothing structural | M |
| 3 | **J/domestic candidate universes** – the junior tiers keep the LIVE-only universe and the mixed-table percentile trap «real and untouched». | [living-field.md](../specs/living-field.md) §8.3, first bullet | a measurement first (does it still bite after the ladder waves?) | M |
| 4 | **Name-pool widening** – 44 first names × 216 surnames serve ~1,800 players; the pool was meant to grow BEFORE the population did, and the population got there first. Append-only by hard rule (the array note in `names.ts`). | [living-field.md](../specs/living-field.md) §8.3; the SURNAMES note in [names.ts](../../src/engine/season/names.ts) | nothing – content work | S |
| 5 | **The champion-news contradiction** – the announced (shadow) champion differs from the paid (canonical) one in ~91% of her played events. The bench ruled the RANK effect not material and closed Phase B unbuilt; what it explicitly did NOT decide is whether the news should keep speaking this way. A design decision with both benches on the table, plus the §3 gate: any Phase B revisit starts with a re-run on the merged main. | [dual-universe.md](../specs/dual-universe.md) §3, the verdict + «what this page does not decide» | owner's word | ruling, then M if the news changes |
| 6 | **The thin top of the ladder** – round-15 #6: the two rungs above W75 run on a 13-week cadence (4 events a season each) and the jump from 6 to 13 is exactly where a climbing career finds nothing to enter. Re-verified in code (`everyNWeeks` unchanged at those rungs). The later ladder waves reshaped everything BELOW this; the cadence itself has never been ruled on. | [round-15.md](../rounds/round-15.md) #6; `everyNWeeks` in [calendar.ts](../../src/engine/season/calendar.ts) | a design decision + bench (calendar density is a balance lever, invariant 4) | M |
| 7 | **Domestic rungs in an adult's season list** – round-17 H / task #84: the filter that gates the J tiers reaches it «in two lines when the owner asks». | [round-17.md](../rounds/round-17.md) H | owner's ask, explicitly | S |
| 8 | **W wins then J trouble** – round-15 #9: plausible mechanism named (`entrantPctBand` maths), never measured. | [round-15.md](../rounds/round-15.md) #9 | a measurement, nothing else | S |
| 9 | **The 14U national team event** – deliberately left out of the flags wave: «separate, and its own decision». The research is done and waiting. | [wave-flags-grant.md](../plans/wave-flags-grant.md) «What is NOT in this wave»; [national-team-competitions.md](../research/national-team-competitions.md) | owner's word | M |
| 10 | **Weather** – round-3 #67, the oldest structural absence: rain/heat/wind + indoor/outdoor. It is the missing system under three deferred items at once (the heat-injury multipliers and the thermoregulation gauge in [season-life-future.md](season-life-future.md) §2, and surface texture for the match viz). | [round-3-qa.md](../rounds/round-3-qa.md) #67 | its own wave; owner-sequenced «Phase 3/4 backlog» | **L** |
